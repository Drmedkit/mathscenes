// walk-one-step-inequalities.mjs: click through a lesson page like a kid would (right and wrong answers), screenshot every state.
//   node tools/walk-one-step-inequalities.mjs [base url] [out dir]
// Needs the dev server (npm run dev, or the mathscenes-lessons launch config on port 5290). Headless, muted.
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] ?? 'http://localhost:5290/lessons/one-step-inequalities.html?mute&fresh&seed=7';
const out = process.argv[3] ?? 'out/walk-one-step-inequalities';
fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ headless: true, args: ['--mute-audio', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('framenavigated', f => { if (f === page.mainFrame()) console.log('navigated', f.url()); });
page.on('console', m => { if (m.type() === 'error' && !/vite\/client|ERR_FAILED|Failed to load resource/.test(m.text())) errors.push(m.text()); });
// other topics are being saved in the same dev server: block Vite's HMR client so their saves cannot reload this page
await page.setRequestInterception(true);
page.on('request', r => (r.url().includes('/@vite/client') ? r.abort() : r.continue()));
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
let n = 0;
const sleep = s => new Promise(r => setTimeout(r, s * 1000));
async function shot(name) { n++; const f = path.join(out, `${String(n).padStart(2, '0')}-${name}.png`); await page.screenshot({ path: f }); console.log(f); }
async function click(text, sel = 'button') {
  const ok = await page.evaluate((text, sel) => {
    const b = [...document.querySelectorAll(sel)].find(x => x.textContent.replace(/\s+/g, ' ').trim().startsWith(text) && !x.disabled && x.offsetParent);
    if (!b) return false; b.click(); return true;
  }, text, sel);
  if (!ok) { await page.screenshot({ path: path.join(out, 'zz-missing.png') }); throw new Error(`no button "${text}"`); }
}
async function typeFrac(w, n, d) {
  await page.evaluate((w, n, d) => {
    const ins = [...document.querySelectorAll('.panel .ans input')];
    const [W, N, D] = ins.length === 3 ? ins : [null, ...ins];
    if (W) W.value = w; N.value = n; D.value = d;
  }, String(w ?? ''), String(n), String(d));
}


await page.goto(base, { waitUntil: 'networkidle0' });
await page.waitForFunction('window.lessonReady');
await sleep(4.2); await shot('question');
await click('h < 3'); await click('Pretty sure'); await shot('question-picked'); await click('Find out');
// worked example
await sleep(0.8); await shot('example-start');
await click('Read it'); await sleep(3.4); await shot('example-read');
await click('Divide'); await sleep(5.6); await shot('example-divide');
await click('Graph'); await sleep(4.0); await shot('example-graph');
await click('Check'); await sleep(4.6); await shot('example-check');
await click('There are negative'); await sleep(0.3); await shot('example-why-wrong');
await click('Dividing by a negative'); await sleep(0.3); await click('Your turn');
// your turn
await sleep(12.5); await shot('turn-undo');
await click('Multiply both sides by 3'); await sleep(0.3); await shot('turn-undo-nosign');
await click('Multiply both sides by −3'); await sleep(2.9); await shot('turn-land');
await page.evaluate(() => { document.querySelector('.panel .ans input').value = '6'; }); await click('Check'); await sleep(0.3); await shot('turn-land-nosign');
await page.evaluate(() => { document.querySelector('.panel .ans input').value = '-6'; }); await click('Check'); await sleep(2.2); await shot('turn-symbol');
await click('x ≥ −6'); await sleep(0.3); await shot('turn-symbol-keep');
await click('x ≤ −6'); await sleep(5.6); await shot('turn-graph');
await click('No, it is not'); await sleep(9.5); await shot('turn-callback');
await click('Prove it');
// prove it
await sleep(3.6); await click('Jordan is wrong'); await sleep(0.3); await shot('prove-start');
await click('There is a negative'); await sleep(0.3); await shot('prove-wrong-chip');
await click('Adding the same'); await sleep(3.6); await shot('prove-1');
await click('Only multiplying'); await sleep(3.8); await shot('prove-2');
await click('x = 10'); await sleep(6.0); await shot('prove-3');
await click('Practice');
// practice: answer right, but every third item wrong (to see feedback, the worked solution and the twin)
await sleep(1.5);
for (let i = 0; i < Number(process.env.N_ITEMS ?? 40); i++) {
  const it = await page.evaluate(() => { const x = window.__practiceItem; return { fam: x.family, sg: x.subgoal, input: x.input, ans: x.answer, n: (x.choices ?? []).length }; });
  const wrong = i % 3 === 1;
  if (it.input === 'frac') {
    const a = it.ans; const v = a.w * a.d + a.n;
    if (wrong) await typeFrac('', a.d + 1, v + 2); else await typeFrac(a.w || '', a.n, a.d);
  } else if (it.input === 'num') {
    await page.evaluate(v => { document.querySelector('.panel .ans input').value = v; }, String(wrong ? it.ans.v + 1 : it.ans.v));
  } else if (it.input === 'pair') {
    await page.evaluate((x, y) => { const [a, b] = document.querySelectorAll('.panel .ans input'); a.value = x; b.value = y; }, String(wrong ? it.ans.y : it.ans.x), String(wrong ? it.ans.x : it.ans.y));
  } else {
    await page.evaluate((i) => document.querySelectorAll('.panel .opts button')[i].click(), wrong ? (it.ans.i + 1) % it.n : it.ans.i);
  }
  await sleep(1.6);
  const show = i < 4 || wrong;
  if (show) await shot(`practice-${i + 1}-${it.fam}-${it.sg}`);
  await click('Check'); await sleep(wrong ? 4.2 : 0.6);
  if (show && wrong) await shot(`practice-${i + 1}-${it.fam}-wrong`);
  await click(wrong ? 'Try one like it' : 'Next');
  await sleep(1.0);
}
await shot('practice-end');
const log = await page.evaluate(() => window.mathscenesLessons.log('one-step-inequalities'));
fs.writeFileSync(path.join(out, 'diagnosis-log.json'), JSON.stringify(log, null, 1));
console.log(`diagnosis log: ${log.length} attempts, ${log.filter(a => a.mc).length} with a misconception`);
console.log(errors.length ? `PAGE ERRORS:\n${errors.join('\n')}` : 'no page errors');
await browser.close();
