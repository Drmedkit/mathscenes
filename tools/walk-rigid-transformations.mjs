// walk-rigid-transformations.mjs: click through the translations / reflections / rotations lesson like a kid would
// (right and wrong answers) and screenshot every state.
//   node tools/walk-rigid-transformations.mjs [base url] [out dir] [practice items] [parts: qetpx]
// Needs the dev server (port 5290). Headless, ALWAYS muted (--mute-audio and ?mute).
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] || 'http://localhost:5290/lessons/rigid-transformations.html?mute&seed=7';
const out = process.argv[3] || 'out/walk-rigid-transformations';
const ITEMS = Number(process.argv[4] || 60);
const ONLY = process.argv[5] || 'qetpx';
fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ headless: true, args: ['--mute-audio', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
// other topics are built in this worktree at the same time: their edits make Vite reload every open page, which
// would reset a walk. The walk switches off the HMR socket (the page itself is unchanged).
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
async function typePair(x, y) { await page.evaluate((x, y) => { const ins = document.querySelectorAll('.panel .ans input'); ins[0].value = x; ins[1].value = y; }, String(x), String(y)); }
async function typeNum(v) { await page.evaluate(v => { document.querySelector('.panel .ans input').value = v; }, String(v)); }
/** open one part directly (?part=n&open): a dev-server reload in one part does not break the others */
async function open(part, fresh = false) {
  await page.goto(`${base}&part=${part}&open${fresh ? '&fresh' : ''}`, { waitUntil: 'networkidle0' });
  await page.waitForFunction('window.lessonReady');
}
async function segment(name, fn) {
  if (!ONLY.includes(name)) return;
  try { await fn(); } catch (e) { console.log(`SEGMENT ${name} FAILED:`, e.message); await shot(`failed-${name}`); }
}

try {
  await segment('q', async () => {
    await open(0, true);
    await sleep(3.6); await shot('question');
    await click('Flip'); await click('Pretty sure'); await shot('question-picked'); await click('Find out');
  });
  await segment('e', async () => {
    await open(1);
    await sleep(0.8); await shot('example-start');
    await click('Match them'); await sleep(2.8); await shot('example-match');
    await click('Go round'); await sleep(3.6); await shot('example-order');
    await click('Find it'); await sleep(3.6); await shot('example-fixed-turning'); await sleep(3.4); await shot('example-fixed');
    await click('Write it'); await sleep(3.0); await shot('example-rule-leader'); await sleep(3.6); await shot('example-rule');
    await click('Upside-down'); await sleep(0.3); await shot('example-why-wrong');
    await click('A flip would'); await sleep(0.3); await click('Your turn');
  });
  await segment('t', async () => {
    await open(2);
    await sleep(8.2); await shot('turn-ask-motion');
    await click('90° clockwise'); await sleep(0.3); await shot('turn-motion-wrong');
    await click('90° counterclockwise'); await sleep(2.4); await shot('turn-motion-turning'); await sleep(3.8);
    await click('(x, y) → (y, x)'); await sleep(0.3); await shot('turn-rule-wrong');
    await click('(x, y) → (−y, x)'); await sleep(1.8);
    await typePair(-3, 4); await click('Check'); await sleep(0.3); await shot('turn-apply-wrong');
    await typePair(3, 4); await click('Check'); await sleep(4.8); await shot('turn-apply');
    await click('We have to'); await sleep(0.3); await shot('turn-len-wrong');
    await click('3 units'); await sleep(2.4); await shot('turn-done');
  });
  await segment('p', async () => {
    await open(3);
    await sleep(5.6); await shot('prove-start');
    await click('Maya is wrong'); await sleep(0.3);
    await click('The right angle is kept'); await sleep(0.3); await shot('prove-wrong-chip');
    await click('The rule doubles'); await sleep(3.4); await shot('prove-1');
    await click('Both sides run'); await sleep(2.6); await shot('prove-2');
    await click('A rigid motion keeps'); await sleep(3.4); await shot('prove-3');
  });
  await segment('x', async () => {
    await open(4);
    await sleep(1.6);
    // practice: answer right, every third item wrong (feedback, worked solution, twin)
    const fams = new Set();
    for (let i = 0; i < ITEMS; i++) {
      const it = await page.evaluate(() => { const x = window.__practiceItem; return { fam: x.family, input: x.input, ans: x.answer, k: x.choices?.length ?? 0 }; });
      const wrong = i % 3 === 1;
      if (it.input === 'pair') await typePair(wrong ? it.ans.x + 1 : it.ans.x, it.ans.y);
      else if (it.input === 'num') await typeNum(wrong ? it.ans.v + 1 : it.ans.v);
      else await page.evaluate(i => document.querySelectorAll('.panel .opts button')[i].click(), wrong ? (it.ans.i + 1) % it.k : it.ans.i);
      await sleep(1.2);
      const first = !fams.has(it.fam); fams.add(it.fam);
      const snap = first || (wrong && i < 40);
      if (snap) await shot(`practice-${i + 1}-${it.fam}`);
      await click('Check'); await sleep(wrong ? 3.2 : 0.4);
      if (wrong && snap) await shot(`practice-${i + 1}-${it.fam}-wrong`);
      await click(wrong ? 'Try one like it' : 'Next');
      await sleep(1.0);
    }
    await shot('practice-end');
    console.log(`families seen: ${fams.size}`);
  });
  const log = await page.evaluate(() => window.mathscenesLessons.log('rigid-transformations'));
  fs.writeFileSync(path.join(out, 'diagnosis-log.json'), JSON.stringify(log, null, 1));
  console.log(`diagnosis log: ${log.length} attempts, ${log.filter(a => a.mc).length} with a misconception`);
} catch (e) {
  console.log('WALK FAILED:', e.message); await shot('failed');
} finally {
  console.log(errors.length ? `PAGE ERRORS:\n${errors.join('\n')}` : 'no page errors');
  await browser.close();
}
