// walk-fraction-times-fraction.mjs: click through a lesson page like a kid would (right and wrong answers), screenshot every state.
//   node tools/walk-fraction-times-fraction.mjs [base url] [out dir]
// Needs the dev server (npm run dev, or the mathscenes-lessons launch config on port 5290). Headless, muted.
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] ?? 'http://localhost:5290/lessons/fraction-times-fraction.html?mute&fresh&seed=7';
const out = process.argv[3] ?? 'out/walk-fraction-times-fraction';
fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ headless: true, args: ['--mute-audio', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('framenavigated', f => { if (f === page.mainFrame()) console.log('navigated', f.url()); });
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
await sleep(3.6); await shot('question');
await click('2'); await click('Pretty sure'); await shot('question-picked'); await click('Find out');
// worked example
await sleep(0.8); await shot('example-start');
await click('Cut'); await sleep(3.6); await shot('example-cut');
await click('Take'); await sleep(3.4); await shot('example-take');
await click('Count'); await sleep(5.4); await shot('example-count');
await click('Write it'); await sleep(5.8); await shot('example-write');
await click('You multiply the bottom'); await sleep(0.3); await shot('example-why-wrong');
await click('The cuts run through'); await sleep(0.3); await click('Your turn');
// your turn
await sleep(12.5); await shot('turn-ask');
await typeFrac('', 3, 4); await click('Check'); await sleep(0.3); await shot('turn-part-as-whole');
await typeFrac('', 6, 20); await click('Check'); await sleep(4.4); await shot('turn-count');
await click('2', '.chips button'); await click('+'); await click('3', '.chips button'); await sleep(0.3); await shot('turn-chips-wrong'); await sleep(1.6);
await click('3', '.chips button'); await click('×'); await click('2', '.chips button'); await sleep(4.4); await shot('turn-write');
await click('Less than'); await sleep(7.0); await shot('turn-size');
await click('Prove it');
// prove it
await sleep(3.0); await click('Riley is wrong'); await sleep(0.3); await shot('prove-start');
await click('Multiplying always'); await sleep(0.3); await shot('prove-wrong-chip');
await click('× a fraction'); await sleep(3.4); await shot('prove-1');
await click('2', '.chips button'); await sleep(4.2); await shot('prove-2');
await click('Maya'); await sleep(7.5); await shot('prove-3');
await click('Practice');
// practice: answer right, but every third item wrong (to see feedback, the worked solution and the twin)
await sleep(1.5);
for (let i = 0; i < 45; i++) {
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
  const show = i < 6 || wrong;
  if (show) await shot(`practice-${i + 1}-${it.fam}-${it.sg}`);
  await click('Check'); await sleep(wrong ? 4.2 : 0.6);
  if (show && wrong) await shot(`practice-${i + 1}-${it.fam}-wrong`);
  await click(wrong ? 'Try one like it' : 'Next');
  await sleep(1.0);
}
await shot('practice-end');
const log = await page.evaluate(() => window.mathscenesLessons.log('fraction-times-fraction'));
fs.writeFileSync(path.join(out, 'diagnosis-log.json'), JSON.stringify(log, null, 1));
console.log(`diagnosis log: ${log.length} attempts, ${log.filter(a => a.mc).length} with a misconception`);
console.log(errors.length ? `PAGE ERRORS:\n${errors.join('\n')}` : 'no page errors');
await browser.close();
