// walk-exponential-functions.mjs: click through the exponential-functions lesson (Algebra 1) like a kid would (right
// and wrong answers) and screenshot every state.   node tools/walk-exponential-functions.mjs [base url] [out dir]
// Needs the dev server (port 5290). Headless, muted (--mute-audio and ?mute). WALK_ONLY=practice skips to practice.
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] ?? 'http://localhost:5290/lessons/exponential-functions.html?mute&fresh&seed=7';
const out = process.argv[3] ?? 'out/walk-exponential-functions';
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
    await click('Same'); await click('Pretty sure'); await shot('question-picked'); await click('Find out');
    // worked example
    await sleep(0.8); await shot('example-start');
    await click('Fill in'); await sleep(3.6); await shot('example-fill');
    await click('Compare'); await sleep(5.6); await shot('example-compare');
    await click('Write'); await sleep(2.8); await shot('example-model');
    await click('Graph'); await sleep(6.0); await shot('example-graph');
    await click('The interest rate goes up'); await sleep(0.3); await shot('example-why-wrong');
    await click('The 10% is taken'); await sleep(0.3); await click('Your turn');
    // your turn
    await sleep(3.6); await shot('turn-b');
    await click('b = 0.2'); await sleep(0.4); await shot('turn-b-wrong');
    await click('b = 0.8'); await sleep(2.8); await shot('turn-model');
    await click('V(t) = 24,000 − 4,800t'); await sleep(0.4); await shot('turn-model-wrong');
    await click('V(t) = 24,000(0.8)'); await sleep(1.8); await shot('turn-v2');
    await typeNum(14400); await click('Check'); await sleep(0.4); await shot('turn-v2-wrong');
    await typeNum(15360); await click('Check'); await sleep(3.0); await shot('turn-v2-right');
    await click('Yes: after 5 years'); await sleep(0.4); await shot('turn-zero-wrong');
    await click('No: 80%'); await sleep(6.4); await shot('turn-zero');
    await click('Prove it');
    // prove it
    await sleep(4.4); await shot('prove-intro'); await click('No, not a proof'); await sleep(0.3); await shot('prove-start');
    await click('It works for t = 0'); await sleep(0.3); await shot('prove-wrong-chip');
    await click('Put t + 1 in place'); await sleep(2.0); await shot('prove-1');
    await click('3ᵗ⁺¹ = 3ᵗ + 3'); await sleep(0.3); await shot('prove-wrong-sum');
    await click('3ᵗ⁺¹ = 3ᵗ · 3¹'); await sleep(2.0); await shot('prove-2');
    await click('f(t) = 5 · 3ᵗ is never 0'); await sleep(1.8); await shot('prove-3');
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
  const log = await page.evaluate(() => window.mathscenesLessons.log('exponential-functions'));
  fs.writeFileSync(path.join(out, 'diagnosis-log.json'), JSON.stringify(log, null, 1));
  console.log(`diagnosis log: ${log.length} attempts, ${log.filter(a => a.mc).length} with a misconception; parts: ${[...new Set(log.map(a => a.part))].join(', ')}`);
} catch (e) {
  console.log('WALK FAILED:', e.message); await shot('failed');
} finally {
  console.log(errors.length ? 'PAGE ERRORS:\n' + errors.join('\n') : 'no page errors');
  await browser.close();
}
