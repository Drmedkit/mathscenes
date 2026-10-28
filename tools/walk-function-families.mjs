// walk-function-families.mjs: click through the function-families lesson (Algebra 1) like a kid would (right and
// wrong answers) and screenshot every state.   node tools/walk-function-families.mjs [base url] [out dir]
// Needs the dev server (port 5290). Headless, muted (--mute-audio and ?mute). WALK_ONLY=practice skips to practice.
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] ?? 'http://localhost:5290/lessons/function-families.html?mute&fresh&seed=7';
const out = process.argv[3] ?? 'out/walk-function-families';
const only = process.env.WALK_ONLY ?? '';
fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ headless: true, args: ['--mute-audio', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
const page = await browser.newPage();
const errors = [];
// other lessons are being built in the same dev server: block Vite's HMR client so a reload elsewhere can't restart us
await page.setRequestInterception(true);
page.on('request', r => (new URL(r.url()).pathname.endsWith('/@vite/client') ? r.respond({ status: 200, contentType: 'application/javascript', body: 'export {}' }) : r.continue()));
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if ((m.type() === 'error' || m.type() === 'warn') && !/vite\/client|ERR_FAILED|favicon/.test(m.text())) errors.push(m.text()); });
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
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
async function typeNum(v) { await page.evaluate(v => { const i = document.querySelector('.panel .ans input'); i.value = v; }, String(v)); }

try {
  if (only !== 'practice') {
    await page.goto(base, { waitUntil: 'networkidle0' });
    await page.waitForFunction('window.lessonReady', { timeout: 60000 });
    await sleep(4.0); await shot('question');
    await click('Exponential'); await click('Pretty sure'); await shot('question-picked'); await click('Find out');
    // worked example
    await sleep(0.8); await shot('example-start');
    await click('Check'); await sleep(3.4); await shot('example-steps');
    await click('Divide'); await sleep(4.0); await shot('example-ratios');
    await click('Subtract'); await sleep(3.8); await shot('example-d1');
    await click('Subtract again'); await sleep(4.6); await shot('example-d2');
    await click('Because 14 is'); await sleep(0.3); await shot('example-why-wrong');
    await click('A test has to hold'); await sleep(0.3); await click('Your turn');
    // your turn
    await sleep(3.2); await shot('turn-step');
    await click('Not usable'); await sleep(0.4); await shot('turn-step-wrong');
    await click('Equal steps of +2'); await sleep(3.4); await shot('turn-d1');
    await typeNum(2); await click('Check'); await sleep(0.4); await shot('turn-d1-wrong');
    await typeNum(6); await click('Check'); await sleep(3.6); await shot('turn-quad');
    await click('Yes: changing'); await sleep(0.4); await shot('turn-quad-wrong');
    await click('Not yet'); await sleep(3.4); await shot('turn-ratio');
    await typeNum(6); await click('Check'); await sleep(0.4); await shot('turn-ratio-wrong');
    await typeNum(2); await click('Check'); await sleep(3.6); await shot('turn-family');
    await click('Exponential: ×2 for every 1'); await sleep(0.4); await shot('turn-family-wrong');
    await click('Exponential: ×2 for every step'); await sleep(1.8); await shot('turn-done');
    await click('Prove it');
    // prove it
    await sleep(3.6); await shot('prove-intro'); await click('Yes, that proves'); await sleep(3.2); await shot('prove-judged');
    await click('It works for every row'); await sleep(0.3); await shot('prove-wrong-chip');
    await click('Put x + h'); await sleep(1.4); await shot('prove-1');
    await click('f(x + h) = f(x) + h'); await sleep(0.3); await shot('prove-wrong-shift');
    await click('m(x + h) = mx + mh'); await sleep(1.4); await shot('prove-2');
    await click('mh has no x'); await sleep(2.4); await shot('prove-3');
    await click('Practice');
  } else {
    await page.goto(base + '&part=4&open', { waitUntil: 'networkidle0' });
    await page.waitForFunction('window.lessonReady', { timeout: 60000 });
  }
  // practice: right, but every third item wrong (feedback, the steps card, the replay and the twin)
  await sleep(2.0);
  const N = Number(process.env.WALK_N ?? 30);
  for (let i = 0; i < N; i++) {
    const it = await page.evaluate(() => { const x = window.__practiceItem; return { fam: x.family, sg: x.subgoal, input: x.input, ans: x.answer, n: (x.choices ?? []).length, pic: !!(x.picture && (x.picture.t || x.picture.g)) }; });
    const wrong = i % 3 === 1;
    if (it.input === 'num') await typeNum(wrong ? it.ans.v + 1 : it.ans.v);
    else if (it.input === 'pair') await page.evaluate((x, y) => { const [a, b] = document.querySelectorAll('.panel .ans input'); a.value = x; b.value = y; }, String(wrong ? it.ans.x + 1 : it.ans.x), String(it.ans.y));
    else await page.evaluate(i => document.querySelectorAll('.panel .opts button')[i].click(), wrong ? (it.ans.i + 1) % it.n : it.ans.i);
    await sleep(it.pic ? 2.4 : 1.0);
    const skip = i < Number(process.env.WALK_SKIP ?? 0);
    if (!skip) await shot(`practice-${i + 1}-${it.sg}-${it.fam}`);
    await click('Check'); await sleep(wrong ? (it.pic ? 5 : 1.2) : 0.6);
    if (wrong && !skip) await shot(`practice-${i + 1}-${it.fam}-wrong`);
    await click(wrong ? 'Try one like it' : 'Next');
    await sleep(0.8);
  }
  await shot('practice-end');
  const log = await page.evaluate(() => window.mathscenesLessons.log('function-families'));
  fs.writeFileSync(path.join(out, 'diagnosis-log.json'), JSON.stringify(log, null, 1));
  console.log(`diagnosis log: ${log.length} attempts, ${log.filter(a => a.mc).length} with a misconception; parts: ${[...new Set(log.map(a => a.part))].join(', ')}`);
} catch (e) {
  console.log('WALK FAILED:', e.message); await shot('failed');
} finally {
  console.log(errors.length ? 'PAGE ERRORS:\n' + errors.join('\n') : 'no page errors');
  await browser.close();
}
