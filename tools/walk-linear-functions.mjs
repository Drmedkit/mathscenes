// walk-linear-functions.mjs: click through the linear functions lesson like a kid would (a right AND a wrong answer
// in every part) and screenshot every state.   node tools/walk-linear-functions.mjs [base url] [out dir]
// Needs the dev server (port 5290). Headless, muted (--mute-audio and ?mute). WALK_ONLY=practice skips to practice,
// WALK_N sets the number of practice items (default 12).
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] ?? 'http://localhost:5290/lessons/linear-functions.html?mute&fresh&seed=7';
const out = process.argv[3] ?? 'out/walk-linear-functions';
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
    // 1 the question: a wrong card ($34 = first output as intercept)
    await sleep(4.5); await shot('question');
    await click('$34'); await click('Pretty sure'); await shot('question-picked'); await click('Find out');
    // 2 worked example
    await sleep(0.8); await shot('example-start');
    await click('Find the rate'); await sleep(5.2); await shot('example-rate');
    await click('Walk back'); await sleep(5.0); await shot('example-back');
    await click('Write it'); await sleep(4.2); await shot('example-equation');
    await click('Check'); await sleep(5.0); await shot('example-check');
    await click('The fee is always'); await sleep(0.3); await shot('example-why-wrong');
    await click('$34 is the cost after'); await sleep(0.3); await click('Your turn');
    // 3 your turn: the battery (b wrong, then right; equation wrong, then right; check wrong, then right)
    await sleep(10.5); await shot('turn-b-ask');
    await typeNum(85); await click('Check'); await sleep(0.3); await shot('turn-b-wrong');
    await typeNum(95); await click('Check'); await sleep(4.6); await shot('turn-b');
    await click('B = 95t'); await sleep(0.3); await shot('turn-eq-wrong');
    await click('B = −2t'); await sleep(4.4); await shot('turn-eq');
    await typeNum(145); await click('Check'); await sleep(0.3); await shot('turn-check-wrong');
    await typeNum(45); await click('Check'); await sleep(3.8); await shot('turn-check');
    await click('Prove it');
    // 4 prove it: Jordan doubles
    await sleep(3.6); await click('Jordan is wrong'); await sleep(0.3); await shot('prove-start');
    await click('Every straight line'); await sleep(0.3); await shot('prove-wrong-chip');
    await click('The table says'); await sleep(2.4); await shot('prove-1-ray'); await sleep(2.6); await shot('prove-1');
    await click('The $18 fee'); await sleep(3.2); await shot('prove-2');
    await click('Its line meets'); await sleep(2.6); await shot('prove-3');
    await click('Practice');
  } else {
    await page.goto(base + '&part=4&open', { waitUntil: 'networkidle0' });
    await page.waitForFunction('window.lessonReady');
  }
  // practice: right, but every third item wrong (feedback, the worked solution and the twin)
  await sleep(2.0);
  const N = Number(process.env.WALK_N ?? 12);
  for (let i = 0; i < N; i++) {
    const it = await page.evaluate(() => { const x = window.__practiceItem; return { fam: x.family, sg: x.subgoal, input: x.input, ans: x.answer, pic: !!(x.picture && x.picture.lf) }; });
    const wrong = i % 3 === 1;
    if (it.input === 'num') await typeNum(wrong ? it.ans.v + 1 : it.ans.v);
    else if (it.input === 'pair') await page.evaluate((x, y) => { const [a, b] = document.querySelectorAll('.panel .ans input'); a.value = x; b.value = y; }, String(wrong ? it.ans.x + 1 : it.ans.x), String(it.ans.y));
    else await page.evaluate((i, w) => { const bs = document.querySelectorAll('.panel .opts button'); bs[w ? (i + 1) % bs.length : i].click(); }, it.ans.i, wrong);
    await sleep(it.pic ? 2.2 : 0.9);
    await shot(`practice-${i + 1}-${it.sg}-${it.fam}`);
    await click('Check'); await sleep(wrong ? (it.pic ? 7 : 2.5) : 0.6);
    if (wrong) await shot(`practice-${i + 1}-${it.fam}-wrong`);
    await click(wrong ? 'Try one like it' : 'Next');
    await sleep(1.0);
  }
  await shot('practice-end');
  const log = await page.evaluate(() => window.mathscenesLessons?.log('linear-functions') ?? []);
  fs.writeFileSync(path.join(out, 'diagnosis-log.json'), JSON.stringify(log, null, 1));
  console.log(`diagnosis log: ${log.length} attempts, ${log.filter(a => a.mc).length} with a misconception; parts: ${[...new Set(log.map(a => a.part))].join(', ')}`);
} catch (e) {
  console.log('WALK FAILED:', e.message); await shot('failed');
} finally {
  console.log(errors.length ? `PAGE ERRORS:\n${errors.join('\n')}` : 'no page errors');
  await browser.close();
}
