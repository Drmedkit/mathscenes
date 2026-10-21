// walk-fraction-of-quantity.mjs: click through a lesson page like a kid would (right and wrong answers), screenshot every state.
//   node tools/walk-fraction-of-quantity.mjs [base url] [out dir]
// Needs the dev server (npm run dev, or the mathscenes-lessons launch config on port 5290). Headless, muted.
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] ?? 'http://localhost:5290/lessons/fraction-of-quantity.html?mute&fresh&seed=7';
const out = process.argv[3] ?? 'out/walk-fraction-of-quantity';
fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ headless: true, args: ['--mute-audio', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
// other sessions edit files in this worktree while we walk: keep Vite's HMR socket from reloading the page mid-walk
await page.evaluateOnNewDocument(() => {
  const WS = window.WebSocket;
  window.WebSocket = function (url, proto) {
    if (proto === 'vite-hmr' || String(url).includes('token=')) return { addEventListener() {}, removeEventListener() {}, send() {}, close() {}, readyState: 0 };
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
async function typeFrac(w, n, d) {
  await page.evaluate((w, n, d) => {
    const ins = [...document.querySelectorAll('.panel .ans input')];
    const [W, N, D] = ins.length === 3 ? ins : [null, ...ins];
    if (W) W.value = w; N.value = n; D.value = d;
  }, String(w ?? ''), String(n), String(d));
}

async function typeNum(v) { await page.evaluate(v => { document.querySelector('.panel .ans input').value = v; }, String(v)); }

await page.goto(base, { waitUntil: 'networkidle0' });
await page.waitForFunction('window.lessonReady');
await sleep(3.2); await shot('question');
await click('4'); await click('Pretty sure'); await shot('question-picked'); await click('Find out');
// worked example
await sleep(0.6); await shot('example-start');
await click('Name it'); await sleep(3.2); await shot('example-whole');
await click('Group them'); await sleep(7.0); await shot('example-groups');
await click('Take 3'); await sleep(5.0); await shot('example-take');
await click('Write it'); await sleep(6.0); await shot('example-write');
await click('You make groups of 4'); await sleep(0.3); await shot('example-why-wrong');
await click('The 4 says'); await sleep(0.3); await click('Your turn');
// your turn
await sleep(4.4); await shot('turn-ask');
await typeNum(3); await click('Check'); await sleep(0.3); await shot('turn-share-wrong');
await typeNum(5); await click('Check'); await sleep(3.0); await shot('turn-share');
await typeNum(5); await click('Check'); await sleep(0.3); await shot('turn-take-wrong');
await typeNum(10); await click('Check'); await sleep(5.0); await shot('turn-take');
await click('(15 ÷ 2)'); await sleep(0.3); await shot('turn-write-wrong');
await click('(15 ÷ 3)'); await sleep(4.0); await shot('turn-write');
await click('More than 15'); await sleep(6.5); await shot('turn-more');
await click('Prove it');
// prove it
await sleep(3.0); await click('Riley is wrong'); await sleep(0.3); await shot('prove-start');
await click('One share is 18'); await sleep(0.3); await shot('prove-wrong-chip');
await click('18 is 3 equal'); await sleep(4.8); await shot('prove-1');
await click('The whole is 4'); await sleep(3.6); await shot('prove-2');
await click('28 ÷ 4'); await sleep(7.5); await shot('prove-3');
await click('Practice');
// practice: answer right, but every third item wrong (feedback, worked solution on the picture, then a twin)
await sleep(1.5);
for (let i = 0; i < 44; i++) {
  const it = await page.evaluate(() => { const x = window.__practiceItem; return { fam: x.family, input: x.input, ans: x.answer }; });
  const wrong = i % 3 === 1;
  if (it.input === 'frac') {
    const a = it.ans; const v = a.w * a.d + a.n;
    if (wrong) await typeFrac('', a.d, v); else await typeFrac(a.w || '', a.n, a.d);
  } else if (it.input === 'num') {
    await typeNum(wrong ? it.ans.v + 1 : it.ans.v);
  } else {
    await page.evaluate(i => document.querySelectorAll('.panel .opts button')[i].click(), wrong ? (it.ans.i + 1) % 3 : it.ans.i);
  }
  await sleep(1.6);
  const snap = i < 6 || wrong;
  if (snap) await shot(`practice-${i + 1}-${it.fam}`);
  await click('Check'); await sleep(wrong ? 6.5 : 0.6);
  if (snap && wrong) await shot(`practice-${i + 1}-${it.fam}-wrong`);
  const fin = await page.evaluate(() => /Mastered/.test(document.querySelector('.meter')?.textContent ?? ''));
  if (fin) { console.log('mastered after', i + 1); break; }
  await click(wrong ? 'Try one like it' : 'Next');
  await sleep(1.0);
}
await shot('practice-end');
const log = await page.evaluate(() => window.mathscenesLessons.log('fraction-of-quantity'));
fs.writeFileSync(path.join(out, 'diagnosis-log.json'), JSON.stringify(log, null, 1));
console.log(`diagnosis log: ${log.length} attempts, ${log.filter(a => a.mc).length} with a misconception`);
console.log(errors.length ? `PAGE ERRORS:\n${errors.join('\n')}` : 'no page errors');
await browser.close();
