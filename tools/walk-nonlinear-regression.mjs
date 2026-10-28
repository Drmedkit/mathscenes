// walk-nonlinear-regression.mjs: click through the quadratic and exponential regression lesson like a student would (right and wrong answers) and
// screenshot every state.   node tools/walk-nonlinear-regression.mjs [base url] [out dir]
// Needs the dev server (port 5290). Headless, muted (--mute-audio and ?mute). WALK_ONLY=practice skips to practice.
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] ?? 'http://localhost:5290/lessons/nonlinear-regression.html?mute&fresh&seed=7';
const out = process.argv[3] ?? 'out/walk-nonlinear-regression';
const only = process.env.WALK_ONLY ?? '';
fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ headless: true, args: ['--mute-audio', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
const page = await browser.newPage();
const errors = [];
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
    await page.waitForFunction('window.lessonReady');
    await sleep(5); await shot('question');
    await click('Either'); await click('Pretty sure'); await shot('question-picked'); await click('Find out');
    // worked example
    await sleep(0.8); await shot('example-start');
    await click('Fit'); await sleep(6.0); await shot('example-fit');
    await click('Measure'); await sleep(7.5); await shot('example-residuals');
    await click('Plot them'); await sleep(10); await shot('example-residual-plots');
    await click('Extend'); await sleep(9.5); await shot('example-12h');
    await click('It is not'); await sleep(0.3); await shot('example-why-wrong');
    await click('12 hours is outside'); await sleep(0.3); await click('Your turn');
    // your turn
    await sleep(4.5); await shot('turn-start');
    await click('h = 4.71t²'); await sleep(0.3); await shot('turn-eq-wrong');
    await click('h = −15.99t²'); await sleep(3.2); await shot('turn-eq');
    await typeNum(28.9); await click('Check'); await sleep(0.3); await shot('turn-pred-wrong');
    await typeNum(29.1); await click('Check'); await sleep(3.2); await shot('turn-pred');
    await click('t ≈ −0.11 s and'); await sleep(0.3); await shot('turn-land-wrong');
    await click('Only t ≈ 2.63 s'); await sleep(3.5); await shot('turn-done');
    await click('Prove it');
    // prove it
    await sleep(4.0); await click('Jamal is wrong'); await sleep(0.3); await shot('prove-start');
    await click('Models that fit the same'); await sleep(0.3); await shot('prove-wrong-chip');
    await click('Each week the exponential'); await sleep(8.5); await shot('prove-1');
    await click('The 8 data points'); await sleep(2.5); await shot('prove-2');
    await click('Residuals describe only'); await sleep(3.5); await shot('prove-3');
    await click('Practice');
  } else {
    await page.goto(base + '&part=4&open', { waitUntil: 'networkidle0' });
    await page.waitForFunction('window.lessonReady');
  }
  await sleep(2.0);
  const N = Number(process.env.WALK_N ?? 40);
  for (let i = 0; i < N; i++) {
    const it = await page.evaluate(() => { const x = window.__practiceItem; return { fam: x.family, sg: x.subgoal, input: x.input, ans: x.answer, n: (x.choices ?? []).length }; });
    const wrong = i % 3 === 1;
    if (it.input === 'num') await typeNum(wrong ? it.ans.v + 1 : it.ans.v);
    else if (it.input === 'pair') await page.evaluate((x, y) => { const [a, b] = document.querySelectorAll('.panel .ans input'); a.value = x; b.value = y; }, String(wrong ? it.ans.y : it.ans.x), String(wrong ? it.ans.x : it.ans.y));
    else await page.evaluate(i => document.querySelectorAll('.panel .opts button')[i].click(), wrong ? (it.ans.i + 1) % it.n : it.ans.i);
    await sleep(2.2);
    await shot(`practice-${i + 1}-${it.sg}-${it.fam}`);
    await click('Check'); await sleep(wrong ? 4.5 : 0.6);
    if (wrong) await shot(`practice-${i + 1}-${it.fam}-wrong`);
    await click(wrong ? 'Try one like it' : 'Next');
    await sleep(1.0);
  }
  await shot('practice-end');
  const log = await page.evaluate(() => window.mathscenesLessons.log('nonlinear-regression'));
  fs.writeFileSync(path.join(out, 'diagnosis-log.json'), JSON.stringify(log, null, 1));
  console.log(`diagnosis log: ${log.length} attempts, ${log.filter(a => a.mc).length} with a misconception; parts: ${[...new Set(log.map(a => a.part))].join(', ')}`);
} catch (e) {
  console.log('WALK FAILED:', e.message); await shot('failed');
} finally {
  console.log(errors.length ? `PAGE ERRORS:\n${errors.join('\n')}` : 'no page errors');
  await browser.close();
}
