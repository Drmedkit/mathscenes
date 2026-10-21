// walk-multiply-divide-rational-numbers.mjs: click through the lesson like a kid would (right and wrong answers),
// screenshot every state.
//   node tools/walk-multiply-divide-rational-numbers.mjs [base url] [out dir] [practice items]
// Needs the dev server (npm run dev, or the mathscenes-lessons launch config on port 5290). Headless, muted.
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] || 'http://localhost:5290/lessons/multiply-divide-rational-numbers.html?mute&fresh&seed=7';
const out = process.argv[3] || 'out/walk-multiply-divide-rational-numbers';
const N = Number(process.argv[4] ?? 48);
fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ headless: true, args: ['--mute-audio', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('framenavigated', f => { if (f === page.mainFrame()) console.log('navigated', f.url()); });
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
// other people save files while the dev server runs: a stub HMR client keeps the page from reloading mid-walk
const HMR_STUB = 'export function createHotContext(){return{accept(){},acceptExports(){},dispose(){},prune(){},decline(){},invalidate(){},on(){},off(){},send(){},data:{}}}export function injectQuery(u){return u}export function updateStyle(){}export function removeStyle(){}export class ErrorOverlay{}';
await page.setRequestInterception(true);
page.on('request', r => (r.url().endsWith('/@vite/client') ? r.respond({ status: 200, contentType: 'application/javascript', body: HMR_STUB }) : r.continue()));
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
async function typeNum(v) { await page.evaluate(v => { document.querySelector('.panel .ans input').value = v; }, String(v)); }
async function typeFrac(w, n, d) {
  await page.evaluate((w, n, d) => {
    const ins = [...document.querySelectorAll('.panel .ans input')];
    const [W, N, D] = ins.length === 3 ? ins : [null, ...ins];
    if (W) W.value = w; N.value = n; D.value = d;
  }, String(w ?? ''), String(n), String(d));
}

try {
  await page.goto(base, { waitUntil: 'networkidle0' });
  await page.waitForFunction('window.lessonReady');
  await sleep(5.0); await shot('question');
  await click('−12'); await click('Pretty sure'); await shot('question-picked'); await click('Find out');
  // worked example
  await sleep(0.8); await shot('example-start');
  await click('Rate'); await sleep(3.4); await shot('example-rate');
  await click('Later'); await sleep(5.4); await shot('example-later');
  await click('Earlier'); await sleep(7.6); await shot('example-earlier');
  await click('Divide'); await sleep(3.6); await shot('example-divide');
  await click('Two negatives'); await sleep(0.3); await shot('example-why-wrong');
  await click('3 minutes ago'); await sleep(0.3); await click('Your turn');
  // your turn
  await sleep(13.5); await shot('turn-ask');
  await typeNum(-6); await click('Check'); await sleep(0.3); await shot('turn-sign-wrong');
  await typeNum(6); await click('Check'); await sleep(2.6); await shot('turn-count');
  await click('4', '.chips button'); await click('×'); await click('(−1.5)'); await sleep(0.3); await shot('turn-chips-wrong'); await sleep(1.8);
  await click('(−4)'); await click('×'); await click('(−1.5)'); await sleep(3.4); await shot('turn-write');
  await click('−1.5'); await sleep(7.5); await shot('turn-divide');
  await click('Prove it');
  // prove it
  await sleep(3.0); await click('Jordan is wrong'); await sleep(0.3); await shot('prove-start');
  await click('A negative times'); await sleep(0.3); await shot('prove-wrong-chip');
  await click('4 + ('); await sleep(2.0); await shot('prove-1');
  await click('The distributive'); await sleep(1.4);
  await click('One negative factor'); await sleep(3.4); await shot('prove-3');
  await click('Only 12'); await sleep(8.6); await shot('prove-4');
  await click('Practice');
  // practice: answer right, but every third item wrong (to see feedback, the worked solution and the twin)
  await sleep(1.5);
  for (let i = 0; i < N; i++) {
    const it = await page.evaluate(() => { const x = window.__practiceItem; return { fam: x.family, sg: x.subgoal, input: x.input, ans: x.answer, n: (x.choices ?? []).length }; });
    const wrong = i % 3 === 1;
    if (it.input === 'frac') {
      const a = it.ans;
      if (wrong) await typeFrac('', a.n + 1, a.d); else await typeFrac('', a.n, a.d);
    } else if (it.input === 'num') {
      await typeNum(wrong ? it.ans.v + 1 : it.ans.v);
    } else {
      await page.evaluate(i => document.querySelectorAll('.panel .opts button')[i].click(), wrong ? (it.ans.i + 1) % it.n : it.ans.i);
    }
    await sleep(1.7);
    const show = i < 6 || wrong;
    if (show) await shot(`practice-${i + 1}-${it.fam}-${it.sg}`);
    await click('Check'); await sleep(wrong ? 3.6 : 0.5);
    if (show && wrong) await shot(`practice-${i + 1}-${it.fam}-wrong`);
    await click(wrong ? 'Try one like it' : 'Next');
    await sleep(0.9);
  }
  await shot('practice-end');
  const log = await page.evaluate(() => window.mathscenesLessons.log('multiply-divide-rational-numbers'));
  fs.writeFileSync(path.join(out, 'diagnosis-log.json'), JSON.stringify(log, null, 1));
  console.log(`diagnosis log: ${log.length} attempts, ${log.filter(a => a.mc).length} with a misconception`);
} finally {
  console.log(errors.length ? `PAGE ERRORS:\n${errors.join('\n')}` : 'no page errors');
  await browser.close();
}
