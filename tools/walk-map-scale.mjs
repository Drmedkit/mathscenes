// walk-map-scale.mjs: click through the map-scale lesson like a kid would (right and wrong answers in every part) and
// screenshot every state.   node tools/walk-map-scale.mjs [base url] [out dir]
// Needs the dev server (port 5290). Headless, muted (--mute-audio and ?mute). WALK_ONLY=practice skips to practice,
// WALK_N=<n> sets the number of practice items (default 12; tools/walk-practice.mjs does the long practice walk).
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] ?? 'http://localhost:5290/lessons/map-scale.html?mute&fresh&seed=7';
const out = process.argv[3] ?? 'out/walk-map-scale';
const only = process.env.WALK_ONLY ?? '';
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
  if (only !== 'practice') {
    await page.goto(base, { waitUntil: 'networkidle0' });
    await page.waitForFunction('window.lessonReady');
    // 1 the question: pick the 30 mi card (skips inches -> feet)
    await sleep(4.5); await shot('question');
    await click('30'); await click('Pretty sure'); await shot('question-picked'); await click('Find out');
    // 2 worked example
    await sleep(0.8); await shot('example-start');
    await click('Read it'); await sleep(4.6); await shot('example-read');
    await click('Multiply'); await sleep(5.6); await shot('example-multiply');
    await click('Convert'); await sleep(5.8); await shot('example-convert');
    await click('Show me'); await sleep(3.4); await shot('example-shortcut');
    await click('A mile is 63,360 feet'); await sleep(0.3); await shot('example-why-wrong');
    await click('A mile is 5,280'); await sleep(0.3); await shot('example-why-right'); await click('Your turn');
    // 3 your turn
    await sleep(4.2); await shot('turn-multiply');
    await typeNum(72000); await click('Check'); await sleep(0.3); await shot('turn-multiply-wrong');
    await typeNum(84000); await click('Check'); await sleep(4.2); await shot('turn-feet');
    await typeNum('15.9'); await click('Check'); await sleep(0.3); await shot('turn-feet-wrong');
    await typeNum(7000); await click('Check'); await sleep(4.8); await shot('turn-size');
    await click('About 16'); await sleep(0.3); await shot('turn-size-wrong');
    await click('A bit more'); await sleep(2.0); await shot('turn-callback');
    await click('Prove it');
    // 4 prove it
    await sleep(4.5); await click('Jo is wrong'); await sleep(0.3); await shot('prove-start');
    await click('To go from the ground'); await sleep(0.3); await shot('prove-wrong-chip');
    await click('Jo divided feet'); await sleep(1.8); await shot('prove-1');
    await click('12 in make'); await sleep(3.2); await shot('prove-2');
    await click('Every 24,000'); await sleep(4.8); await shot('prove-3');
    await click('Practice');
  } else {
    await page.goto(base + '&part=4&open', { waitUntil: 'networkidle0' });
    await page.waitForFunction('window.lessonReady');
  }
  // practice: right, but every third item wrong (feedback, the worked solution and the twin)
  await sleep(2.0);
  const N = Number(process.env.WALK_N ?? 12);
  for (let i = 0; i < N; i++) {
    const it = await page.evaluate(() => { const x = window.__practiceItem; return { fam: x.family, sg: x.subgoal, input: x.input, ans: x.answer, n: (x.choices || []).length }; });
    const wrong = i % 3 === 1;
    if (it.input === 'num') await typeNum(wrong ? it.ans.v + 1 : it.ans.v);
    else if (it.input === 'frac') await page.evaluate((a, wrong) => { const [w, nn, d] = document.querySelectorAll('.panel .ans input'); w.value = String(wrong ? a.w + 1 : a.w); nn.value = String(a.n); d.value = String(a.d); }, it.ans, wrong);
    else await page.evaluate(i => document.querySelectorAll('.panel .opts button')[i].click(), wrong ? (it.ans.i + 1) % it.n : it.ans.i);
    await sleep(2.6);
    await shot(`practice-${i + 1}-${it.sg}-${it.fam}`);
    await click('Check'); await sleep(wrong ? 6.5 : 0.6);
    if (wrong) await shot(`practice-${i + 1}-${it.fam}-wrong`);
    await click(wrong ? 'Try one like it' : 'Next');
    await sleep(1.0);
  }
  await shot('practice-end');
  const log = await page.evaluate(() => window.mathscenesLessons.log('map-scale'));
  fs.writeFileSync(path.join(out, 'diagnosis-log.json'), JSON.stringify(log, null, 1));
  console.log(`diagnosis log: ${log.length} attempts, ${log.filter(a => a.mc).length} with a misconception; parts: ${[...new Set(log.map(a => a.part))].join(', ')}`);
} catch (e) {
  console.log('WALK FAILED:', e.message); await shot('failed');
} finally {
  console.log(errors.length ? `PAGE ERRORS:\n${errors.join('\n')}` : 'no page errors');
  await browser.close();
}
