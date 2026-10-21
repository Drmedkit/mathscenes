// walk-slope-and-lines.mjs: click through the slope-and-lines lesson like a kid would (right and wrong answers in
// every part) and screenshot every state.   node tools/walk-slope-and-lines.mjs [base url] [out dir]
// Needs the dev server (port 5290). Headless, muted (--mute-audio and ?mute). WALK_ONLY=practice skips to practice.
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] ?? 'http://localhost:5290/lessons/slope-and-lines.html?mute&fresh&seed=7';
const out = process.argv[3] ?? 'out/walk-slope-and-lines';
const only = process.env.WALK_ONLY ?? '';
fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ headless: true, args: ['--mute-audio', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
const page = await browser.newPage();
const errors = [];
// other lessons are being built in the same dev server: block Vite's HMR client so a reload elsewhere can't restart us
await page.setRequestInterception(true);
page.on('request', r => (new URL(r.url()).pathname.endsWith('/@vite/client') ? r.respond({ status: 200, contentType: 'application/javascript', body: 'export {}' }) : r.continue()));
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if ((m.type() === 'error' || m.type() === 'warn') && !/vite\/client|ERR_FAILED|favicon/.test(m.text())) errors.push(m.text()); });
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
async function clickCard(i) { await page.evaluate(i => document.querySelectorAll('.panel .cards button')[i].click(), i); }
async function typeNum(v) { await page.evaluate(v => { const i = document.querySelector('.panel .ans input'); i.value = v; }, String(v)); }

try {
  if (only !== 'practice') {
    await page.goto(base, { waitUntil: 'networkidle0' });
    await page.waitForFunction('window.lessonReady');
    await sleep(6.5); await shot('question');
    await clickCard(1); await click('Pretty sure'); await shot('question-picked'); await click('Find out');
    // worked example
    await sleep(0.8); await shot('example-start');
    await click('Show it'); await sleep(4.8); await shot('example-rise-run');
    await click('Compare'); await sleep(6.8); await shot('example-same-angles');
    await click('Divide'); await sleep(3.4); await shot('example-same-ratio');
    await click('Write it'); await sleep(11.5); await shot('example-equation');
    await click('They look'); await sleep(0.3); await shot('example-why-wrong');
    await click('The triangles are similar'); await sleep(0.3); await click('Your turn');
    // your turn: the candle
    await sleep(9.5); await shot('turn-rise-ask');
    await typeNum(3); await click('Check'); await sleep(0.4); await shot('turn-rise-sign');
    await typeNum(-3); await click('Check'); await sleep(2.4); await shot('turn-slope-ask');
    await click('12'); await sleep(0.3); await shot('turn-slope-wrong');
    await click('−12'); await sleep(2.6); await shot('turn-eq-ask');
    await click('y = 6x'); await sleep(0.3); await shot('turn-eq-wrong');
    await click('y = −12x + 6'); await sleep(2.4); await shot('turn-done');
    await click('Prove it');
    // prove it: Riley
    await sleep(3.6); await click('Riley is wrong'); await sleep(0.3); await shot('prove-start');
    await click('every straight line'); await sleep(0.3); await shot('prove-wrong-chip');
    await click('slope triangles on one line'); await sleep(4.4); await shot('prove-1');
    await click('y/x divides'); await sleep(3.8); await shot('prove-2');
    await click('a proportional line'); await sleep(4.8); await shot('prove-3');
    await click('Practice');
  } else {
    await page.goto(base + '&part=4&open', { waitUntil: 'networkidle0' });
    await page.waitForFunction('window.lessonReady');
  }
  // practice: right, but every third item wrong (feedback, the worked solution and the twin)
  await sleep(2.0);
  const N = Number(process.env.WALK_N ?? 12);
  for (let i = 0; i < N; i++) {
    const it = await page.evaluate(() => { const x = window.__practiceItem; return { fam: x.family, sg: x.subgoal, input: x.input, ans: x.answer, pic: !!(x.picture && (x.picture.graph || x.picture.table)) }; });
    const wrong = i % 3 === 1;
    if (it.input === 'num') await typeNum(wrong ? it.ans.v + 1 : it.ans.v);
    else if (it.input === 'frac') await page.evaluate((a, w) => { const ins = document.querySelectorAll('.panel .ans input'); ins[0].value = ''; ins[1].value = String(w ? a.n + 1 : a.n); ins[2].value = String(a.d); }, it.ans, wrong);
    else if (it.input === 'pair') await page.evaluate((x, y) => { const [a, b] = document.querySelectorAll('.panel .ans input'); a.value = x; b.value = y; }, String(wrong ? it.ans.y : it.ans.x), String(wrong ? it.ans.x : it.ans.y));
    else await page.evaluate((i, w) => { const bs = document.querySelectorAll('.panel .opts button'); bs[w ? (i + 1) % bs.length : i].click(); }, it.ans.i, wrong);
    await sleep(1.6);
    await shot(`practice-${i + 1}-${it.sg}-${it.fam}`);
    await click('Check'); await sleep(wrong ? 4.5 : 0.5);
    if (wrong) await shot(`practice-${i + 1}-${it.fam}-wrong`);
    await click(wrong ? 'Try one like it' : 'Next');
    await sleep(0.8);
  }
  await shot('practice-end');
  const log = await page.evaluate(() => window.mathscenesLessons.log('slope-and-lines'));
  fs.writeFileSync(path.join(out, 'diagnosis-log.json'), JSON.stringify(log, null, 1));
  console.log(`diagnosis log: ${log.length} attempts, ${log.filter(a => a.mc).length} with a misconception; parts: ${[...new Set(log.map(a => a.part))].join(', ')}`);
} catch (e) {
  console.log('WALK FAILED:', e.message); await shot('failed');
} finally {
  console.log(errors.length ? `PAGE ERRORS:\n${errors.join('\n')}` : 'no page errors');
  await browser.close();
}
