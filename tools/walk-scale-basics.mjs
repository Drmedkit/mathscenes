// walk-scale-basics.mjs: click through the "Understand scale" lesson like a kid would (right and wrong answers) and
// screenshot every state.   node tools/walk-scale-basics.mjs [base url] [out dir]
// Needs the dev server (port 5290). Headless, muted (--mute-audio and ?mute). WALK_ONLY=practice skips to practice;
// WALK_N = practice items after parts 1-4 (default 12; tools/walk-practice.mjs does the long practice walk).
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] ?? 'http://localhost:5290/lessons/scale-basics.html?mute&fresh&seed=7';
const out = process.argv[3] ?? 'out/walk-scale-basics';
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
async function typePair(x, y) { await page.evaluate((x, y) => { const [a, b] = document.querySelectorAll('.panel .ans input'); a.value = x; b.value = y; }, String(x), String(y)); }

try {
  if (only !== 'practice') {
    await page.goto(base, { waitUntil: 'networkidle0' });
    await page.waitForFunction('window.lessonReady');
    // 1 the question
    await sleep(4.5); await shot('question');
    await click('1 : 28'); await click('Pretty sure'); await shot('question-picked'); await click('Find out');
    // 2 worked example
    await sleep(0.8); await shot('example-start');
    await click('Match'); await sleep(5.2); await shot('example-match');
    await click('Lay them out'); await sleep(6.6); await shot('example-copies');
    await click('Check'); await sleep(4.6); await shot('example-width');
    await click('Write it'); await sleep(3.8); await shot('example-scale');
    await click('32 − 4'); await sleep(0.3); await shot('example-why-wrong');
    await click('The actual board is 8 copies'); await sleep(0.3); await click('Your turn');
    // 3 your turn
    await sleep(12.5); await shot('turn-width');
    await typeNum(16); await click('Check'); await sleep(0.3); await shot('turn-width-wrong');
    await typeNum(5); await click('Check'); await sleep(5.6); await shot('turn-width-right');
    await typePair(5, 1); await click('Check'); await sleep(0.3); await shot('turn-scale-wrong');
    await typePair(1, 5); await click('Check'); await sleep(3.6); await shot('turn-scale-right');
    await click('Prove it');
    // 4 prove it
    await sleep(3.2); await shot('prove-start');
    await click('Sam is wrong'); await sleep(0.3);
    await click('The biggest number'); await sleep(0.3); await shot('prove-wrong-chip');
    await click('Each centimeter on the plan'); await sleep(4.8); await shot('prove-1');
    await click('The hallway is 5 cm'); await sleep(5.4); await shot('prove-2');
    await click('One factor works'); await sleep(3.8); await shot('prove-3');
    await click('Practice');
  } else {
    await page.goto(base + '&part=4&open', { waitUntil: 'networkidle0' });
    await page.waitForFunction('window.lessonReady');
  }
  // practice: right, but every third item wrong (feedback, the worked solution and the twin)
  await sleep(2.0);
  const N = Number(process.env.WALK_N ?? 12);
  for (let i = 0; i < N; i++) {
    const it = await page.evaluate(() => { const x = window.__practiceItem; return { fam: x.family, sg: x.subgoal, input: x.input, ans: x.answer, pic: !!x.picture, n: (x.choices ?? []).length }; });
    const wrong = i % 3 === 1;
    if (it.input === 'num') await typeNum(wrong ? it.ans.v + 1 : it.ans.v);
    else if (it.input === 'pair') await typePair(wrong ? it.ans.y : it.ans.x, wrong ? it.ans.x : it.ans.y);
    else if (it.input === 'frac') await page.evaluate((w, a, b) => { const [x, y, z] = document.querySelectorAll('.panel .ans input'); x.value = w; y.value = a; z.value = b; }, wrong ? String(it.ans.d) : '', wrong ? '' : String(it.ans.n), wrong ? '' : String(it.ans.d));
    else await page.evaluate(i => document.querySelectorAll('.panel .opts button')[i].click(), wrong ? (it.ans.i + 1) % it.n : it.ans.i);
    await sleep(it.pic ? 3.0 : 0.9);
    await shot(`practice-${i + 1}-${it.sg}-${it.fam}`);
    await click('Check'); await sleep(wrong ? (it.pic ? 6.5 : 1.2) : 0.6);
    if (wrong) await shot(`practice-${i + 1}-${it.fam}-wrong`);
    await click(wrong ? 'Try one like it' : 'Next');
    await sleep(1.0);
  }
  await shot('practice-end');
  const log = await page.evaluate(() => window.mathscenesLessons.log('scale-basics'));
  fs.writeFileSync(path.join(out, 'diagnosis-log.json'), JSON.stringify(log, null, 1));
  console.log(`diagnosis log: ${log.length} attempts, ${log.filter(a => a.mc).length} with a misconception; parts: ${[...new Set(log.map(a => a.part))].join(', ')}`);
} catch (e) {
  console.log('WALK FAILED:', e.message); await shot('failed');
} finally {
  console.log(errors.length ? `PAGE ERRORS:\n${errors.join('\n')}` : 'no page errors');
  await browser.close();
}
