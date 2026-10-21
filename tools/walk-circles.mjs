// walk-circles.mjs: click through the circles lesson like a kid would (right and wrong answers) and screenshot every
// state.   node tools/walk-circles.mjs [base url] [out dir]      (N_PRACTICE=50 by default)
// Needs the dev server (port 5290). Headless, ALWAYS muted (--mute-audio and ?mute).
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] ?? 'http://localhost:5290/lessons/circles.html?mute&fresh&seed=7';
const out = process.argv[3] ?? 'out/walk-circles';
const N_PRACTICE = Number(process.env.N_PRACTICE ?? 50);
fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ headless: true, args: ['--mute-audio', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
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
async function click(text, sel = 'button') {
  const ok = await page.evaluate((text, sel) => {
    const b = [...document.querySelectorAll(sel)].find(x => x.textContent.replace(/\s+/g, ' ').trim().startsWith(text) && !x.disabled && x.offsetParent);
    if (!b) return false; b.click(); return true;
  }, text, sel);
  if (!ok) throw new Error(`no button "${text}"`);
}
/** type values into the answer boxes of the panel (in order), then press Check */
async function fill(...vals) {
  await page.evaluate(vals => {
    const ins = [...document.querySelectorAll('.panel .ans input')];
    ins.forEach((i, k) => { i.value = vals[k] === undefined || vals[k] === null ? '' : String(vals[k]); });
  }, vals);
}

try {
  await page.goto(base, { waitUntil: 'networkidle0' });
  await page.waitForFunction('window.lessonReady');
  await sleep(3.8); await shot('question');
  await click('about 38'); await click('Pretty sure'); await shot('question-picked'); await click('Find out');
  // worked example
  await sleep(0.8); await shot('example-start');
  await click('Find r'); await sleep(4.4); await shot('example-radius');
  await click('Cut'); await sleep(6.2); await shot('example-moving');
  await sleep(6.5); await shot('example-top');
  await click('Multiply'); await sleep(4.6); await shot('example-area');
  await click('Round'); await sleep(3.6); await shot('example-round');
  await click('The whole crust'); await sleep(0.3); await shot('example-why-wrong');
  await click('Half the crust'); await sleep(0.3); await click('Your turn');
  // your turn
  await sleep(11.5); await shot('turn-ask-sides');
  await fill(10, 5); await click('Check'); await sleep(0.3); await shot('turn-sides-wrong');
  await fill(5, 5); await click('Check'); await sleep(6.8); await shot('turn-ask-area');
  await fill(10); await click('Check'); await sleep(0.3); await shot('turn-area-wrong');
  await fill(25); await click('Check'); await sleep(4.6);
  await fill(31.4); await click('Check'); await sleep(0.3); await shot('turn-round-wrong');
  await fill(78.5); await click('Check'); await sleep(3.6); await shot('turn-done');
  await click('Prove it');
  // prove it
  await sleep(3.0); await click('Sam is wrong'); await sleep(0.3); await shot('prove-start');
  await click('Area grows'); await sleep(0.3); await shot('prove-wrong-chip');
  await click('16 ÷ 8'); await sleep(1.6);
  await click('C = 2πr'); await sleep(2.4); await shot('prove-2');
  await click('A = πr²'); await sleep(3.8); await shot('prove-3');
  await click('2 × 16π'); await sleep(3.8); await shot('prove-4');
  await click('Practice');
  // practice: right answers, every fourth wrong (feedback, worked solution, twin)
  await sleep(2.0);
  const seenFam = new Set();
  let wrongShots = 0;
  for (let i = 0; i < N_PRACTICE; i++) {
    const it = await page.evaluate(() => { const x = window.__practiceItem; return { fam: x.family, sg: x.subgoal, ans: x.answer, k: (x.choices ?? []).length, input: x.input }; });
    const wrong = i % 4 === 2;
    if (it.input === 'choice') await page.evaluate(i => document.querySelectorAll('.panel .opts button')[i].click(), wrong ? (it.ans.i + 1) % it.k : it.ans.i);
    else if (it.input === 'num') await fill(wrong ? it.ans.v + 1 : it.ans.v);
    else if (it.input === 'frac') {
      const a = it.ans;
      if (wrong) await fill(a.w + 1 + (a.n ? 0 : 0), a.n || '', a.n ? a.d : '');
      else await fill(a.n ? (a.w || '') : a.w, a.n || '', a.n ? a.d : '');
    }
    await sleep(1.2);
    const fresh = !seenFam.has(it.fam);
    const snap = fresh || (wrong && wrongShots < 8);
    seenFam.add(it.fam);
    if (snap) await shot(`practice-${i + 1}-${it.sg}-${it.fam}`);
    await click('Check'); await sleep(wrong ? 4.5 : 0.4);
    if (wrong && snap) { wrongShots++; await shot(`practice-${i + 1}-${it.fam}-wrong`); }
    await click(wrong ? 'Try one like it' : 'Next');
    await sleep(1.0);
  }
  await shot('practice-end');
  const log = await page.evaluate(() => window.mathscenesLessons.log('circles'));
  fs.writeFileSync(path.join(out, 'diagnosis-log.json'), JSON.stringify(log, null, 1));
  console.log(`diagnosis log: ${log.length} attempts, ${log.filter(a => a.mc).length} with a misconception; families seen: ${[...seenFam].join(', ')}`);
} catch (e) {
  console.log('WALK FAILED:', e.message); await shot('failed');
} finally {
  console.log(errors.length ? `PAGE ERRORS:\n${errors.join('\n')}` : 'no page errors');
  await browser.close();
}
