// walk-sales-tax.mjs: click through parts 1-4 of the sales-tax lesson like a kid would (one wrong and the right
// answer per step) and screenshot every state.   node tools/walk-sales-tax.mjs [base url] [out dir]
// Needs the dev server (port 5290). Headless, muted (--mute-audio and ?mute). Practice: tools/walk-practice.mjs.
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] ?? 'http://localhost:5290/lessons/sales-tax.html?mute&fresh&seed=7';
const out = process.argv[3] ?? 'out/walk-sales-tax';
fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ headless: true, args: ['--mute-audio', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
const page = await browser.newPage();
const errors = [];
// other lessons are being built in the same dev server: block Vite's HMR client so a reload elsewhere can't restart us
await page.setRequestInterception(true);
page.on('request', r => (r.url().includes('/@vite/client') ? r.abort() : r.continue()));
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if ((m.type() === 'error' || m.type() === 'warn') && !/vite\/client|ERR_FAILED/.test(m.text())) errors.push(m.text()); });
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
  await page.goto(base, { waitUntil: 'networkidle0' });
  await page.waitForFunction('window.lessonReady');
  // 1. the question
  await sleep(4.5); await shot('question');
  await click('$4.80'); await click('Pretty sure'); await shot('question-picked'); await click('Find out');
  // 2. worked example
  await sleep(1.0); await shot('example-start');
  await click('Show the whole'); await sleep(2.6); await shot('example-whole');
  await click('Find it'); await sleep(6.2); await shot('example-tax');
  await click('Add'); await sleep(4.2); await shot('example-total');
  await click('Show it'); await sleep(5.6); await shot('example-one-step');
  await click('You write the 8'); await sleep(0.4); await shot('example-why-wrong');
  await click('The 1 keeps'); await sleep(0.4); await shot('example-why-right'); await click('Your turn');
  // 3. your turn
  await sleep(10); await shot('turn-add');
  await typeNum('47.50'); await click('Check'); await sleep(0.4); await shot('turn-add-wrong');
  await typeNum('43'); await click('Check'); await sleep(4.8); await shot('turn-mult');
  await click('1.75 ×'); await sleep(0.4); await shot('turn-mult-wrong');
  await click('1.075 ×'); await sleep(4.4); await shot('turn-bench');
  await click('Yes: $3.00 is less'); await sleep(3.8); await shot('turn-bench-wrong');
  await click('Yes: 5% is'); await sleep(3.8); await shot('turn-callback');
  await click('Prove it');
  // 4. prove it
  await sleep(4.8); await shot('prove-intro');
  await click('Ana is wrong'); await sleep(0.4); await shot('prove-start');
  await click('Adding 8%'); await sleep(0.4); await shot('prove-wrong-chip');
  await click('The price is the 100%'); await sleep(2.2); await shot('prove-1');
  await click('Dividing by 1.08'); await sleep(5.2); await shot('prove-2');
  await click('$81 is a bigger'); await sleep(9.0); await shot('prove-3');
  await click('Practice'); await sleep(2.5); await shot('practice-start');
  const log = await page.evaluate(() => window.mathscenesLessons.log('sales-tax'));
  fs.writeFileSync(path.join(out, 'diagnosis-log.json'), JSON.stringify(log, null, 1));
  console.log(`diagnosis log: ${log.length} attempts, ${log.filter(a => a.mc).length} with a misconception; parts: ${[...new Set(log.map(a => a.part))].join(', ')}`);
} catch (e) {
  console.log('WALK FAILED:', e.message); await shot('failed');
} finally {
  console.log(errors.length ? `PAGE ERRORS:\n${errors.join('\n')}` : 'no page errors');
  await browser.close();
}
