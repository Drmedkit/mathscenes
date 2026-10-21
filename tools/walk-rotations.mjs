// walk-rotations.mjs: click through the rotations lesson like a kid would (right and wrong answers), screenshot every
// state. node tools/walk-rotations.mjs [base url] [out dir] [practice items] [first part 0-4] [wrong every n] [all]
// Needs the dev server (port 5290). Headless, muted (--mute-audio and ?mute).
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] ?? 'http://localhost:5290/lessons/rotations.html?mute&fresh&seed=7';
const out = process.argv[3] ?? 'out/walk-rotations';
const N = Number(process.argv[4] ?? 48);
const FROM = Number(process.argv[5] ?? 0);
/** every WRONG-th practice answer is wrong (0 = never); SHOTS=all screenshots every item */
const WRONG = Number(process.argv[6] ?? 3), SHOTS = process.argv[7] ?? 'some';
fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ headless: true, args: ['--mute-audio', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
// other agents add pages to the same dev server; Vite would reload this page mid-walk. A walk never needs HMR:
// give the Vite client a socket that never opens (it then never reloads).
await page.evaluateOnNewDocument(() => {
  const Real = window.WebSocket;
  window.WebSocket = function (url, p) {
    if (String(p).includes('vite-hmr') || String(url).includes('token=')) return { readyState: 0, addEventListener() {}, removeEventListener() {}, send() {}, close() {} };
    return new Real(url, p);
  };
});
let n = 0;
const sleep = s => new Promise(r => setTimeout(r, s * 1000));
async function shot(name) { n++; const f = path.join(out, `${String(n).padStart(2, '0')}-${name}.png`); await page.screenshot({ path: f }); console.log(f); }
/** click the first enabled, visible button whose text starts with `text`; waits up to 25 s for it (busy machine) */
async function click(text, sel = 'button') {
  for (let t = 0; t < 100; t++) {
    const ok = await page.evaluate((text, sel) => {
      const b = [...document.querySelectorAll(sel)].find(x => x.textContent.replace(/\s+/g, ' ').trim().startsWith(text) && !x.disabled && x.offsetParent);
      if (!b) return false; b.click(); return true;
    }, text, sel);
    if (ok) return;
    await sleep(0.25);
  }
  throw new Error(`no button "${text}"`);
}

try {
  await page.goto(FROM ? `${base}&open&part=${FROM}` : base, { waitUntil: 'networkidle0' });
  await page.waitForFunction('window.lessonReady');
  if (FROM <= 0) {
  await sleep(2.6); await shot('question');
  await click('1', '.cards button'); await click('Pretty sure'); await shot('question-picked'); await click('Find out');
  // worked example
  await sleep(0.8); await shot('example-start');
  await click('Pin it'); await sleep(3.2); await shot('example-pin');
  await click('Turn A'); await sleep(8.6); await shot('example-turnA');
  await click('Turn B and C'); await sleep(4.6); await shot('example-turnBC');
  await click('Check it'); await sleep(5.4); await shot('example-check');
  await click('C turned more'); await sleep(0.3); await shot('example-why-wrong');
  await click('C is farther'); await sleep(0.3); await click('Your turn');
  }
  if (FROM <= 2) {
  // your turn
  await sleep(11.5); await shot('turn-askB');
  await click('Dot 3'); await sleep(0.4); await shot('turn-B-wrong');
  await click('Dot 1'); await sleep(5.6); await shot('turn-B-right');
  await click('It points left'); await sleep(0.4); await shot('turn-check-wrong');
  await click('Every side kept'); await sleep(2.6); await shot('turn-callback');
  await click('Prove it');
  }
  if (FROM <= 3) {
  // prove it
  await sleep(1.5); await click('Riley is wrong'); await sleep(0.3); await shot('prove-start');
  await click('Upside down always'); await sleep(0.3); await shot('prove-wrong-chip');
  await click('Turning the sheet'); await sleep(4.8); await shot('prove-1');
  await click('Trace A'); await sleep(3.8); await shot('prove-2');
  await click('Folding the sheet'); await sleep(5.0); await shot('prove-3');
  await click('Practice');
  }
  // practice: right, but every third item wrong (feedback, the worked solution, the twin)
  await sleep(1.5);
  for (let i = 0; i < N; i++) {
    const it = await page.evaluate(() => { const x = window.__practiceItem; return { fam: x.family, sg: x.subgoal, input: x.input, ans: x.answer, n: (x.choices ?? []).length }; });
    const wrong = WRONG > 0 && i % WRONG === 1;
    if (it.input === 'num') {
      await page.evaluate(v => { document.querySelector('.panel .ans input').value = v; }, String(wrong ? it.ans.v + 1 : it.ans.v));
    } else if (it.input === 'pair') {
      await page.evaluate((x, y) => { const [a, b] = document.querySelectorAll('.panel .ans input'); a.value = x; b.value = y; }, String(wrong ? it.ans.x + 1 : it.ans.x), String(wrong ? it.ans.y + 1 : it.ans.y));
    } else {
      await page.evaluate(i => document.querySelectorAll('.panel .opts button')[i].click(), wrong ? (it.ans.i + 1) % it.n : it.ans.i);
    }
    await sleep(1.0);
    const keep = SHOTS === 'all' || i < 6 || (wrong && i < 40);
    if (keep) await shot(`practice-${i + 1}-${it.fam}`);
    await click('Check'); await sleep(wrong ? 3.2 : 0.4);
    if (keep && wrong) await shot(`practice-${i + 1}-${it.fam}-wrong`);
    await click(wrong ? 'Try one like it' : 'Next');
    await sleep(1.0);
  }
  await shot('practice-end');
  const log = await page.evaluate(() => window.mathscenesLessons.log('rotations'));
  fs.writeFileSync(path.join(out, 'diagnosis-log.json'), JSON.stringify(log, null, 1));
  console.log(`diagnosis log: ${log.length} attempts, ${log.filter(a => a.mc).length} with a misconception`);
} catch (e) {
  console.log('WALK FAILED:', e.message);
  await shot('failed');
} finally {
  console.log(errors.length ? `PAGE ERRORS:\n${errors.join('\n')}` : 'no page errors');
  await browser.close();
}
