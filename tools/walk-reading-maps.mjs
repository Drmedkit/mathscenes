// walk-reading-maps.mjs: click through parts 1-4 of the "Read a map" lesson like a kid would (a right AND a wrong
// answer in every part) and screenshot every state.   node tools/walk-reading-maps.mjs [base url] [out dir]
// Needs the dev server (port 5290). Headless, muted (--mute-audio and ?mute). Practice: tools/walk-practice.mjs.
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] ?? 'http://localhost:5290/lessons/reading-maps.html?mute&fresh&seed=7';
const out = process.argv[3] ?? 'out/walk-reading-maps';
fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ headless: true, args: ['--mute-audio', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
const page = await browser.newPage();
const errors = [];
// other lessons are being built in the same dev server: block Vite's HMR client so a reload elsewhere can't restart us
await page.setRequestInterception(true);
page.on('request', r => (r.url().includes('/@vite/client') ? r.abort() : r.continue()));
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if ((m.type() === 'error' || m.type() === 'warn') && !/vite\/client|ERR_FAILED|voice|mp3|404/.test(m.text())) errors.push(m.text()); });
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
  // 1 the question
  await sleep(5.5); await shot('question');
  await click('10'); await click('14'); await click('Pretty sure'); await shot('question-picked'); await click('Find out');
  // 2 worked example
  await sleep(0.8); await shot('example-start');
  await click('Find them'); await sleep(5.6); await shot('example-places');
  await click('Read the bar'); await sleep(4.4); await shot('example-bar');
  await click('Lay it along'); await sleep(9.5); await shot('example-road');
  await click('Compare'); await sleep(6.2); await shot('example-straight');
  await click('The highway is drawn wider'); await sleep(0.3); await shot('example-why-wrong');
  await click('The road bends'); await sleep(0.3); await click('Your turn');
  // 3 your turn
  await sleep(12.5); await shot('turn-road');
  await typeNum(8); await click('Check'); await sleep(0.3); await shot('turn-road-wrong');
  await typeNum(7); await click('Check'); await sleep(5.6); await shot('turn-line');
  await click('7 miles'); await sleep(0.3); await shot('turn-line-wrong');
  await click('5 miles'); await sleep(2.4); await shot('turn-done');
  await click('Prove it');
  // 4 prove it
  await sleep(3.2); await click('Sam is wrong'); await sleep(0.3); await shot('prove-start');
  await click('The last number on the bar'); await sleep(0.3); await shot('prove-wrong-chip');
  await click('The bar is a number line'); await sleep(4.6); await shot('prove-1');
  await click('Copies of one interval'); await sleep(3.6); await shot('prove-2');
  await click('Every interval on one map'); await sleep(3.2); await shot('prove-3');
  await click('Practice'); await sleep(2.5); await shot('practice-start');
  const log = await page.evaluate(() => window.mathscenesLessons?.log?.('reading-maps') ?? []);
  fs.writeFileSync(path.join(out, 'diagnosis-log.json'), JSON.stringify(log, null, 1));
  console.log(`diagnosis log: ${log.length} attempts, ${log.filter(a => a.mc).length} with a misconception; parts: ${[...new Set(log.map(a => a.part))].join(', ')}`);
} catch (e) {
  console.log('WALK FAILED:', e.message); await shot('failed');
} finally {
  console.log(errors.length ? `PAGE ERRORS:\n${errors.join('\n')}` : 'no page errors');
  await browser.close();
}
