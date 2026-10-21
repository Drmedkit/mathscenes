// walk-simple-interest.mjs: click through the simple interest lesson like a kid would (right and wrong answers) and
// screenshot every state.   node tools/walk-simple-interest.mjs [base url] [out dir]
// Needs the dev server (port 5290). Headless, muted (--mute-audio and ?mute). WALK_N=<n> also walks n practice items.
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] ?? 'http://localhost:5290/lessons/simple-interest.html?mute&fresh&seed=7';
const out = process.argv[3] ?? 'out/walk-simple-interest';
const N = Number(process.env.WALK_N ?? 0);
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
  // 1 the question
  await sleep(4.5); await shot('question');
  await click('$2,100'); await click('Pretty sure'); await shot('question-picked'); await click('Find out');
  // 2 worked example
  await sleep(0.8); await shot('example-start');
  await click('Show it'); await sleep(4.4); await shot('example-principal');
  await click('Year 1'); await sleep(5.8); await shot('example-year1');
  await click('Years 2 and 3'); await sleep(7.8); await shot('example-years');
  await click('Use the formula'); await sleep(5.2); await shot('example-formula');
  await click('The balance grows'); await sleep(0.4); await shot('example-why-wrong');
  await click('Simple interest is always'); await sleep(0.3); await click('Your turn');
  // 3 your turn (Sam's loan)
  await sleep(12.5); await shot('turn-total');
  await typeNum(60); await click('Check'); await sleep(0.3); await shot('turn-total-wrong');
  await typeNum(180); await click('Check'); await sleep(12.5); await shot('turn-owe');
  await typeNum(180); await click('Check'); await sleep(0.3); await shot('turn-owe-wrong');
  await typeNum('1,680'); await click('Check'); await sleep(2.2); await shot('turn-done');
  await click('Prove it');
  // 4 prove it (Alex)
  await sleep(4.8); await shot('prove-start');
  await click('Alex is wrong'); await sleep(0.3);
  await click('After year 1'); await sleep(0.3); await shot('prove-wrong-chip');
  await click('In year 1'); await sleep(3.0); await shot('prove-1');
  await click('Simple interest is 10%'); await sleep(2.6); await shot('prove-2-mid'); await sleep(4.2); await shot('prove-2');
  await click('Alex took'); await sleep(3.6); await shot('prove-3');
  await click('Practice'); await sleep(2.0); await shot('practice-start');
  // optional: a few practice items (right, every third wrong)
  for (let i = 0; i < N; i++) {
    const it = await page.evaluate(() => { const x = window.__practiceItem; return { fam: x.family, sg: x.subgoal, input: x.input, ans: x.answer }; });
    const wrong = i % 3 === 1;
    if (it.input === 'num') await typeNum(wrong ? it.ans.v + 1 : it.ans.v);
    else if (it.input === 'pair') await page.evaluate((x, y) => { const [a, b] = document.querySelectorAll('.panel .ans input'); a.value = x; b.value = y; }, String(wrong ? it.ans.y : it.ans.x), String(wrong ? it.ans.x : it.ans.y));
    else await page.evaluate((i, w) => { const bs = document.querySelectorAll('.panel .opts button'); bs[w ? (i + 1) % bs.length : i].click(); }, it.ans.i, wrong);
    await sleep(1.6); await shot(`practice-${i + 1}-${it.sg}-${it.fam}`);
    await click('Check'); await sleep(wrong ? 6 : 0.6);
    if (wrong) await shot(`practice-${i + 1}-${it.fam}-wrong`);
    await click(wrong ? 'Try one like it' : 'Next'); await sleep(0.8);
  }
  const log = await page.evaluate(() => window.mathscenesLessons.log('simple-interest'));
  fs.writeFileSync(path.join(out, 'diagnosis-log.json'), JSON.stringify(log, null, 1));
  console.log(`diagnosis log: ${log.length} attempts, ${log.filter(a => a.mc).length} with a misconception; parts: ${[...new Set(log.map(a => a.part))].join(', ')}`);
} catch (e) {
  console.log('WALK FAILED:', e.message); await shot('failed');
} finally {
  console.log(errors.length ? `PAGE ERRORS:\n${errors.join('\n')}` : 'no page errors');
  await browser.close();
}
