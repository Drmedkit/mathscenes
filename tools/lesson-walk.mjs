// lesson-walk.mjs: click through a lesson page like a kid would (right and wrong answers), screenshot every state.
//   node tools/lesson-walk.mjs [base url] [out dir]
// Needs the dev server (npm run dev, or the mathscenes-lessons launch config on port 5290). Headless, muted.
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] ?? 'http://localhost:5290/lessons/fractions-as-division.html';
const out = process.argv[3] ?? 'out/lesson-walk';
fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ headless: true, args: ['--mute-audio', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
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
async function typeFrac(w, n, d) {
  await page.evaluate((w, n, d) => {
    const ins = [...document.querySelectorAll('.panel .ans input')];
    const [W, N, D] = ins.length === 3 ? ins : [null, ...ins];
    if (W) W.value = w; N.value = n; D.value = d;
  }, String(w ?? ''), String(n), String(d));
}

await page.goto(base, { waitUntil: 'networkidle0' });
await page.waitForFunction('window.lessonReady');
await sleep(3.2); await shot('question');
await click('4'); await click('Pretty sure'); await shot('question-picked'); await click('Find out');
// worked example
await sleep(0.6); await shot('example-start');
await click('Cut the bars'); await sleep(3.6); await shot('example-cut');
await click('Deal'); await sleep(4.2); await shot('example-deal');
await click('Count'); await sleep(3.8); await shot('example-count');
await click('Write it'); await sleep(5.6); await shot('example-write');
await click('The bigger number'); await sleep(0.3); await shot('example-why-wrong');
await click('Every bar is cut'); await sleep(0.3); await click('Your turn');
// your turn
await sleep(10.5); await shot('turn-ask');
await typeFrac('', 3, 5); await click('Check'); await sleep(0.3); await shot('turn-reversed');
await typeFrac(1, 2, 3); await click('Check'); await sleep(3.0); await shot('turn-count');
await click('3 friends'); await click('5 bars'); await sleep(0.3); await shot('turn-chips-wrong'); await sleep(1.2);
await click('5 bars'); await click('3 friends'); await sleep(5.6); await shot('turn-write');
await click('More than 1 bar'); await sleep(4.0); await shot('turn-regroup');
await click('Prove it');
// prove it
await sleep(3.0); await click('Jordan is wrong'); await sleep(0.3); await shot('prove-start');
await click('The bigger number always'); await sleep(0.3); await shot('prove-wrong-chip');
await click('There are fewer bars'); await sleep(3.0); await shot('prove-1');
await click('2 halves make'); await sleep(3.6); await shot('prove-2');
await click('Each bar is cut into 5'); await sleep(9.5); await shot('prove-3');
await click('Practice');
// practice: answer right, but every third item wrong (to see feedback, the worked solution and the twin)
await sleep(1.5);
for (let i = 0; i < 14; i++) {
  const it = await page.evaluate(() => { const x = window.__lesson.item(); return { fam: x.family, input: x.input, ans: x.answer, prompt: x.prompt }; });
  const wrong = i % 3 === 1;
  if (it.input === 'frac') {
    const a = it.ans; const v = a.w * a.d + a.n;
    if (wrong) await typeFrac('', a.d, v); else await typeFrac(a.w || '', a.n, a.d);
  } else if (it.input === 'num') {
    await page.evaluate(v => { document.querySelector('.panel .ans input').value = v; }, String(wrong ? it.ans.v + 1 : it.ans.v));
  } else if (it.input === 'pair') {
    await page.evaluate((x, y) => { const [a, b] = document.querySelectorAll('.panel .ans input'); a.value = x; b.value = y; }, String(wrong ? it.ans.y : it.ans.x), String(wrong ? it.ans.x : it.ans.y));
  } else {
    await page.evaluate(i => document.querySelectorAll('.panel .opts button')[i].click(), wrong ? (it.ans.i + 1) % 3 : it.ans.i);
  }
  await sleep(0.8);
  if (i < 6 || wrong) await shot(`practice-${i + 1}-${it.fam}`);
  await click('Check'); await sleep(wrong ? 5.5 : 0.6);
  if (i < 6 || wrong) await shot(`practice-${i + 1}-${it.fam}-${wrong ? 'wrong' : 'right'}`);
  await click(wrong ? 'Try one like it' : 'Next');
  await sleep(1.4);
}
await shot('practice-end');
console.log(errors.length ? `PAGE ERRORS:\n${errors.join('\n')}` : 'no page errors');
await browser.close();
