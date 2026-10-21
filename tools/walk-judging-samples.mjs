// walk-judging-samples.mjs: click through the judging-samples lesson like a kid would (right and wrong answers) and
// screenshot every state.   node tools/walk-judging-samples.mjs [base url] [out dir]
// Needs the dev server (port 5290). Headless, ALWAYS muted (--mute-audio and ?mute).
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] ?? 'http://localhost:5290/lessons/judging-samples.html?mute&fresh&seed=7';
const out = process.argv[3] ?? 'out/walk-judging-samples';
const N_PRACTICE = Number(process.env.N_PRACTICE ?? 30);
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

try {
  await page.goto(base, { waitUntil: 'networkidle0' });
  await page.waitForFunction('window.lessonReady');
  await sleep(3.6); await shot('question');
  await click('Most of Lincoln'); await click('Pretty sure'); await shot('question-picked'); await click('Find out');
  // worked example
  await sleep(0.8); await shot('example-start');
  await click('Outline it'); await sleep(2.6); await shot('example-pop');
  await click('Ring it'); await sleep(5.6); await shot('example-sample');
  await click('Shade them'); await sleep(2.8); await shot('example-left');
  await click('Write it'); await sleep(5.8); await shot('example-write');
  await click('60 is too few'); await sleep(0.3); await shot('example-why-wrong');
  await click('The 60 were all'); await sleep(0.3); await click('Your turn');
  // your turn
  await sleep(9.5); await shot('turn-ask');
  await click('About right'); await sleep(0.3); await shot('turn-missing-wrong');
  await click('Likely too high'); await sleep(1.4);
  await sleep(5.6); await shot('turn-state');
  await click('110 of 140'); await sleep(0.3); await shot('turn-state-wrong');
  await click('More than half'); await sleep(3.4); await shot('turn-done');
  await click('Prove it');
  // prove it
  await sleep(3.0); await click('Maya’s claim goes too far'); await sleep(0.3); await shot('prove-start');
  await click('200 is a big'); await sleep(0.3); await shot('prove-wrong-chip');
  await click('The population is'); await sleep(2.4); await shot('prove-1');
  await click('Students who bring'); await sleep(3.6); await shot('prove-2');
  await click('A conclusion may'); await sleep(6.0); await shot('prove-3');
  await click('Practice');
  // practice: right answers, every third wrong (feedback, worked solution, twin)
  await sleep(1.6);
  for (let i = 0; i < N_PRACTICE; i++) {
    const it = await page.evaluate(() => { const x = window.__practiceItem; return { fam: x.family, ans: x.answer, k: x.choices.length }; });
    const wrong = i % 3 === 1;
    await page.evaluate(i => document.querySelectorAll('.panel .opts button')[i].click(), wrong ? (it.ans.i + 1) % it.k : it.ans.i);
    await sleep(0.6);
    const snap = i < 3 || (wrong && i < 22) || (i >= 12 && i < 18);
    if (snap) await shot(`practice-${i + 1}-${it.fam}`);
    await click('Check'); await sleep(wrong ? 5.5 : 0.5);
    if (snap) await shot(`practice-${i + 1}-${it.fam}-${wrong ? 'wrong' : 'right'}`);
    await click(wrong ? 'Try one like it' : 'Next');
    await sleep(1.6);
  }
  await shot('practice-end');
  const log = await page.evaluate(() => window.mathscenesLessons.log('judging-samples'));
  fs.writeFileSync(path.join(out, 'diagnosis-log.json'), JSON.stringify(log, null, 1));
  console.log(`diagnosis log: ${log.length} attempts, ${log.filter(a => a.mc).length} with a misconception`);
} catch (e) {
  console.log('WALK FAILED:', e.message); await shot('failed');
} finally {
  console.log(errors.length ? `PAGE ERRORS:\n${errors.join('\n')}` : 'no page errors');
  await browser.close();
}
