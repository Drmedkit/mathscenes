// walk-square-and-cube-roots.mjs: click through the square-and-cube-roots lesson like a kid would (right and wrong
// answers) and screenshot every state.   node tools/walk-square-and-cube-roots.mjs [base url] [out dir]
// Needs the dev server (port 5290). Headless, ALWAYS muted (--mute-audio and ?mute).
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] ?? 'http://localhost:5290/lessons/square-and-cube-roots.html?mute&fresh&seed=7';
const out = process.argv[3] ?? 'out/walk-square-and-cube-roots';
const N_PRACTICE = Number(process.env.N_PRACTICE ?? 45);
const ONLY = process.env.ONLY ?? '';   // 'practice' skips parts 1-4 (opens ?part=4&open)
fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ headless: true, args: ['--mute-audio', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warn' || m.type() === 'warning') errors.push(m.text()); });
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
// other topics are built in this worktree at the same time: their edits make Vite reload every open page, which
// would reset a ?fresh walk. The walk switches off the HMR socket (the page itself is unchanged).
await page.evaluateOnNewDocument(() => {
  const WS = window.WebSocket;
  window.WebSocket = function (url, proto) {
    if (String(proto).includes('vite-hmr')) return { addEventListener() {}, removeEventListener() {}, send() {}, close() {}, readyState: 0 };
    return new WS(url, proto);
  };
});
let n = 0;
const sleep = s => new Promise(r => setTimeout(r, s * 1000));
async function shot(name) { n++; const f = path.join(out, `${String(n).padStart(2, '0')}-${name}.png`); await page.screenshot({ path: f }); console.log(f); }
/** click the first enabled button whose text starts with `text` (waits up to 5 s: the machine can be slow) */
async function click(text, sel = 'button') {
  for (let t = 0; t < 25; t++) {
    const ok = await page.evaluate((text, sel) => {
      const b = [...document.querySelectorAll(sel)].find(x => x.textContent.replace(/\s+/g, ' ').trim().startsWith(text) && !x.disabled && x.offsetParent);
      if (!b) return false; b.click(); return true;
    }, text, sel);
    if (ok) return;
    await sleep(0.2);
  }
  throw new Error(`no button "${text}"`);
}
/** wait until the panel shows a fresh, empty answer box */
async function freshBox() {
  for (let t = 0; t < 30; t++) {
    const ok = await page.evaluate(() => { const i = document.querySelector('.panel .ans input'); return !!i && i.value === ''; });
    if (ok) return;
    await sleep(0.2);
  }
}
/** type values into the answer boxes of the panel, in order */
async function fill(...vals) {
  await page.evaluate(vals => {
    const ins = [...document.querySelectorAll('.panel .ans input')];
    vals.forEach((v, i) => { if (ins[i]) { ins[i].value = String(v); ins[i].dispatchEvent(new Event('input', { bubbles: true })); } });
  }, vals);
}

try {
  if (ONLY !== 'practice') {
    await page.goto(base, { waitUntil: 'networkidle0' });
    await page.waitForFunction('window.lessonReady');
    await sleep(3.8); await shot('question');
    await click('8 in'); await click('Pretty sure'); await shot('question-picked'); await click('Find out');
    // worked example
    await sleep(1.0); await shot('example-start');
    await click('Lay flat'); await sleep(6.5); await shot('example-flat');
    await click('Stack'); await sleep(7.5); await shot('example-stack');
    await click('Count'); await sleep(4.4); await shot('example-count');
    await click('Write it'); await sleep(7.0); await shot('example-write');
    await click('It is 8 really'); await sleep(0.3); await shot('example-why-wrong');
    await click('A cube uses its edge'); await sleep(0.3); await click('Your turn');
    // your turn
    await sleep(7.6); await shot('turn-ask');
    await fill(72); await click('Check'); await sleep(0.3); await shot('turn-count-wrong');
    await fill(6); await click('Check'); await sleep(3.8); await freshBox();
    await fill(18); await click('Check'); await sleep(0.3); await shot('turn-check-wrong');
    await fill(216); await click('Check'); await sleep(3.0); await shot('turn-check');
    await click('√', '.chips button'); await click('216', '.chips button'); await click('6', '.chips button'); await sleep(0.3); await shot('turn-write-wrong');
    await sleep(1.4);
    await click('∛', '.chips button'); await click('216', '.chips button'); await click('6', '.chips button'); await sleep(3.4); await shot('turn-write');
    await sleep(4.4); await shot('turn-bound');
    await freshBox(); await fill(14, 15); await click('Check'); await sleep(0.3); await shot('turn-bound-wrong');
    await fill(5, 6); await click('Check'); await sleep(4.6); await shot('turn-done');
    await click('Prove it');
    // prove it
    await sleep(3.2); await click('Jordan is wrong'); await sleep(0.3); await shot('prove-start');
    await click('A square root always'); await sleep(0.3); await shot('prove-wrong-chip');
    await click('7 × 7 = 49'); await sleep(3.0); await shot('prove-1');
    await click('√ names the root'); await sleep(4.0); await shot('prove-2');
    await click('the ± comes'); await sleep(4.6); await shot('prove-3');
    await click('Practice');
  } else {
    await page.goto(base.replace('?', '?part=4&open&'), { waitUntil: 'networkidle0' });
    await page.waitForFunction('window.lessonReady');
  }
  // practice: right answers, every third wrong (feedback, worked solution, twin)
  await sleep(1.8);
  const seen = new Set();
  for (let i = 0; i < N_PRACTICE; i++) {
    const it = await page.evaluate(() => { const x = window.__practiceItem; return { fam: x.family, sg: x.subgoal, input: x.input, ans: x.answer, k: (x.choices ?? []).length, pic: x.picture?.kind ?? 'none' }; });
    const wrong = i % 3 === 1;
    const a = it.ans;
    if (it.input === 'choice') await page.evaluate(i => document.querySelectorAll('.panel .opts button')[i].click(), wrong ? (a.i + 1) % it.k : a.i);
    else if (it.input === 'num') await fill(wrong ? a.v + 1 : a.v);
    else if (it.input === 'pair') await fill(wrong ? a.x + 1 : a.x, a.y);
    else if (it.input === 'frac') await fill('', wrong ? a.n + 1 : a.n, a.d);
    await sleep(0.6);
    const key = it.fam + it.pic, snap = wrong || !seen.has(key);
    seen.add(key);
    if (snap) await shot(`practice-${i + 1}-${it.fam}-${it.pic}`);
    await click('Check'); await sleep(wrong ? 5.5 : 0.5);
    if (snap) await shot(`practice-${i + 1}-${it.fam}-${wrong ? 'wrong' : 'right'}`);
    await click(wrong ? 'Try one like it' : 'Next');
    await sleep(1.8);
  }
  await shot('practice-end');
  const log = await page.evaluate(() => window.mathscenesLessons.log('square-and-cube-roots'));
  fs.writeFileSync(path.join(out, 'diagnosis-log.json'), JSON.stringify(log, null, 1));
  console.log(`diagnosis log: ${log.length} attempts, ${log.filter(a => a.mc).length} with a misconception`);
} catch (e) {
  console.log('WALK FAILED:', e.message); await shot('failed');
} finally {
  console.log(errors.length ? `PAGE ERRORS:\n${errors.join('\n')}` : 'no page errors');
  await browser.close();
}
