// walk-functions.mjs: click through the functions lesson like a kid would (right and wrong answers) and screenshot
// every state.   node tools/walk-functions.mjs [base url] [out dir]
// Needs the dev server (port 5290). Headless, ALWAYS muted (--mute-audio and ?mute). N_PRACTICE=n practice items.
// PART=4 starts at practice (with ?open) to look at more items quickly.
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const PART = Number(process.env.PART ?? 0);
const base = process.argv[2] || `http://localhost:5290/lessons/functions.html?mute&fresh&seed=${process.env.SEED ?? 7}${PART ? `&open&part=${PART}` : ''}`;
const out = process.argv[3] || 'out/walk-functions';
const N_PRACTICE = Number(process.env.N_PRACTICE ?? 44);
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
/** click the first enabled, visible button whose text starts with `text` (waits up to 15 s for it to appear) */
async function click(text, sel = 'button') {
  for (let t = 0; t < 60; t++) {
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
  await page.goto(base, { waitUntil: 'networkidle0' });
  await page.waitForFunction('window.lessonReady');
  if (!PART) {
    await sleep(4.2); await shot('question');
    await click('Only month'); await click('Pretty sure'); await shot('question-picked'); await click('Find out');
    // worked example
    await sleep(0.8); await shot('example-start');
    await click('Show the inputs'); await sleep(2.4); await shot('example-inputs');
    await click('Follow them'); await sleep(7.2); await shot('example-follow');
    await click('Check March'); await sleep(2.6); await shot('example-share');
    await click('Flip it'); await sleep(4.6); await shot('example-flip');
    await click('It isn’t one'); await sleep(0.3); await shot('example-why-wrong');
    await click('Each student has'); await sleep(0.3); await click('Your turn');
    // your turn
    await sleep(8.8); await shot('turn-ask');
    await click('3', '.xs button'); await sleep(0.3); await shot('turn-slice-wrong');
    await click('1', '.xs button'); await sleep(3.4); await shot('turn-sweep');
    await sleep(4.6); await shot('turn-share-ask');
    await click('Yes, that breaks'); await sleep(0.3);
    await click('No, that is allowed'); await sleep(3.6); await shot('turn-shared');
    await click('The output 2'); await sleep(0.3); await shot('turn-witness-wrong');
    await click('The input 1'); await sleep(3.4); await shot('turn-done');
    await click('Prove it');
    // prove it
    await sleep(3.0); await click('Jordan is wrong'); await sleep(0.3); await shot('prove-start');
    await click('A function’s graph'); await sleep(0.3); await shot('prove-wrong-chip');
    await click('Squaring'); await sleep(5.4); await shot('prove-1');
    await click('Different inputs'); await sleep(3.0); await shot('prove-2');
    await click('A function needs'); await sleep(3.6); await shot('prove-3');
    await click('Practice');
  }
  // practice: right answers, every third wrong (feedback, worked solution, twin)
  await sleep(1.6);
  const seen = new Set();
  for (let i = 0; i < N_PRACTICE; i++) {
    const it = await page.evaluate(() => { const x = window.__practiceItem; return { fam: x.family, ans: x.answer, k: (x.choices ?? []).length, input: x.input }; });
    const wrong = i % 3 === 1;
    if (it.input === 'choice') await page.evaluate(i => document.querySelectorAll('.panel .opts button')[i].click(), wrong ? (it.ans.i + 1) % it.k : it.ans.i);
    else {
      const vals = it.input === 'num' ? [wrong ? it.ans.v + 1 : it.ans.v] : wrong ? [it.ans.y, it.ans.x] : [it.ans.x, it.ans.y];
      const boxes = await page.$$('.panel .ans input');
      for (let j = 0; j < vals.length; j++) await boxes[j].type(String(vals[j]));
    }
    await sleep(0.7);
    const snap = !seen.has(it.fam + wrong);
    seen.add(it.fam + wrong);
    if (snap && !wrong) await shot(`practice-${i + 1}-${it.fam}`);
    await click('Check'); await sleep(wrong ? 1.6 : 0.4);
    if (snap && wrong) await shot(`practice-${i + 1}-${it.fam}-wrong`);
    await click(wrong ? 'Try one like it' : 'Next');
    await sleep(1.3);
  }
  await shot('practice-end');
  const log = await page.evaluate(() => window.mathscenesLessons.log('functions'));
  fs.writeFileSync(path.join(out, 'diagnosis-log.json'), JSON.stringify(log, null, 1));
  console.log(`diagnosis log: ${log.length} attempts, ${log.filter(a => a.mc).length} with a misconception`);
} catch (e) {
  console.log('WALK FAILED:', e.message); await shot('failed');
} finally {
  console.log(errors.length ? `PAGE ERRORS:\n${errors.join('\n')}` : 'no page errors');
  await browser.close();
}
