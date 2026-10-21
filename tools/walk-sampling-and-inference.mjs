// walk-sampling-and-inference.mjs: click through the sampling-and-inference lesson like a kid would (right and wrong
// answers) and screenshot every state.   node tools/walk-sampling-and-inference.mjs [base url] [out dir]
// Needs the dev server (port 5290). Headless, ALWAYS muted (--mute-audio and ?mute).
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] ?? 'http://localhost:5290/lessons/sampling-and-inference.html?mute&fresh&seed=7';
const out = process.argv[3] ?? 'out/walk-sampling-and-inference';
const N_PRACTICE = Number(process.env.N_PRACTICE ?? 40);
const ONLY = process.env.ONLY ?? '';   // 'practice' skips parts 1-4
fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ headless: true, args: ['--mute-audio', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warn') errors.push(`${m.type()}: ${m.text()}`); });
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
async function typeAnswer(v) {
  await page.evaluate(v => { const i = document.querySelector('.panel .ans input'); i.value = String(v); }, v);
}

try {
  await page.goto(ONLY === 'practice' ? base.replace('?', '?part=4&open&') : base, { waitUntil: 'networkidle0' });
  await page.waitForFunction('window.lessonReady');
  if (ONLY !== 'practice') {
    await sleep(7.0); await shot('question');
    await click('One of them made a mistake'); await click('Pretty sure'); await shot('question-picked'); await click('Find out');
    // worked example
    await sleep(0.8); await shot('example-start');
    await click('Show them'); await sleep(3.6); await shot('example-1-population');
    await click('Average it'); await sleep(5.4); await shot('example-2-mean');
    await click('Draw 19 more'); await sleep(4.8); await shot('example-3-many');
    await click('Reveal it'); await sleep(4.6); await shot('example-4-check');
    await click('Each dot is one student'); await sleep(0.3); await shot('example-why-wrong');
    await click('Chance picks'); await sleep(0.3); await click('Your turn');
    // your turn
    await sleep(5.2); await shot('turn-start');
    await typeAnswer(172); await click('Check'); await sleep(0.4); await shot('turn-mean-wrong');
    await typeAnswer(43); await click('Check'); await sleep(2.8); await shot('turn-mean-right');
    await click('Just as spread out'); await sleep(3.4); await shot('turn-predict-wrong');
    await click('About 14'); await sleep(0.4); await shot('turn-far-wrong');
    await click('About 3'); await sleep(4.6); await shot('turn-done');
    await click('Prove it');
    // prove it
    await sleep(1.6); await click('Jordan is wrong'); await sleep(0.3); await shot('prove-start');
    await click('60 is more than 40'); await sleep(0.3); await shot('prove-wrong-chip');
    await click('Every student had'); await sleep(2.8); await shot('prove-1');
    await click('Students with a lot'); await sleep(3.0); await shot('prove-2');
    await click('More answers shrink'); await sleep(4.6); await shot('prove-3');
    await click('Practice');
  }
  // practice: right answers, every third wrong (feedback, worked solution, twin)
  await sleep(1.8);
  for (let i = 0; i < N_PRACTICE; i++) {
    const it = await page.evaluate(() => { const x = window.__practiceItem; return { fam: x.family, ans: x.answer, k: x.choices ? x.choices.length : 0 }; });
    const wrong = i % 3 === 1;
    if (it.ans.kind === 'choice') await page.evaluate(i => document.querySelectorAll('.panel .opts button')[i].click(), wrong ? (it.ans.i + 1) % it.k : it.ans.i);
    else await typeAnswer(wrong ? it.ans.v + 7 : it.ans.v);
    await sleep(0.4);
    const snap = i < 3 || wrong || (i >= 12 && i < 16);
    if (snap) await shot(`practice-${i + 1}-${it.fam}`);
    await click('Check'); await sleep(wrong ? 5.5 : 0.4);
    if (snap) await shot(`practice-${i + 1}-${it.fam}-${wrong ? 'wrong' : 'right'}`);
    await click(wrong ? 'Try one like it' : 'Next');
    await sleep(1.6);
  }
  await shot('practice-end');
  const log = await page.evaluate(() => window.mathscenesLessons.log('sampling-and-inference'));
  fs.writeFileSync(path.join(out, 'diagnosis-log.json'), JSON.stringify(log, null, 1));
  console.log(`diagnosis log: ${log.length} attempts, ${log.filter(a => a.mc).length} with a misconception`);
} catch (e) {
  console.log('WALK FAILED:', e.message); await shot('failed');
} finally {
  console.log(errors.length ? `PAGE ERRORS:\n${errors.join('\n')}` : 'no page errors');
  await browser.close();
}
