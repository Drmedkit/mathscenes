// walk-parallel-lines-and-triangles.mjs: click through the parallel lines and triangles lesson like a kid would
// (right and wrong answers) and screenshot every state.   node tools/walk-parallel-lines-and-triangles.mjs [base url] [out dir]
// Needs the dev server (port 5290). Headless, muted (--mute-audio and ?mute). WALK_ONLY=practice skips to practice;
// WALK_N sets the number of practice items (default 36).
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] ?? 'http://localhost:5290/lessons/parallel-lines-and-triangles.html?mute&fresh&seed=7';
const out = process.argv[3] ?? 'out/walk-parallel-lines-and-triangles';
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
// the panel must fit the 1920 x 1080 screen: no scrolling to reach a chip or a button
const fitLog = [];
async function panelFit(name) {
  const r = await page.evaluate(() => ({ b: Math.round(document.querySelector('.panel').getBoundingClientRect().bottom), h: innerHeight }));
  fitLog.push(`${name}: panel bottom ${r.b} / ${r.h}`);
  if (r.b > r.h) errors.push(`panel overflows at ${name}: bottom ${r.b} > ${r.h}`);
}
async function typeNum(v) { await page.evaluate(v => { const i = document.querySelector('.panel .ans input'); i.value = v; }, String(v)); }

try {
  if (only !== 'practice') {
    await page.goto(base, { waitUntil: 'networkidle0' });
    await page.waitForFunction('window.lessonReady');
    await sleep(3.5); await shot('question');
    await click('65°'); await click('Pretty sure'); await shot('question-picked'); await panelFit('part 1'); await click('Find out');
    // worked example
    await sleep(0.8); await shot('example-start');
    await click('Read it'); await sleep(4.8); await shot('example-read');
    await click('Slide it'); await sleep(1.6); await shot('example-sliding'); await sleep(4.4); await shot('example-slide');
    await click('Use it'); await sleep(4.4); await shot('example-straight');
    await click('Check'); await sleep(3.6); await shot('example-check');
    await click('x looks bigger'); await sleep(0.3); await shot('example-why-wrong'); await panelFit('part 2');
    await click('The streets are parallel'); await sleep(0.3); await click('Your turn');
    // your turn
    await sleep(4.6); await shot('turn-partner');
    await click('Angle b'); await sleep(0.8); await shot('turn-partner-wrong');
    await click('Angle a'); await sleep(1.8); await shot('turn-half-turn'); await sleep(2.8); await shot('turn-a-ask');
    await typeNum(72); await click('Check'); await sleep(0.3); await shot('turn-a-wrong');
    await typeNum(108); await click('Check'); await sleep(2.2); await shot('turn-b-ask');
    await typeNum(108); await click('Check'); await sleep(0.9); await shot('turn-b-wrong'); await sleep(2.4);
    await typeNum(72); await click('Check'); await sleep(4.0); await shot('turn-done'); await panelFit('part 3');
    await click('Prove it');
    // prove it
    await sleep(2.0); await click('Yes, that proves it'); await sleep(0.3); await shot('prove-start');
    await click('A triangle’s angles add'); await sleep(0.3); await shot('prove-wrong-chip'); await panelFit('part 4 start');
    await click('Alt. interior: AB'); await sleep(1.8); await shot('prove-1-turning'); await sleep(2.4); await shot('prove-1');
    await click('Alt. interior: AC'); await sleep(4.2); await shot('prove-2');
    await click('They fill'); await sleep(3.4); await shot('prove-3'); await panelFit('part 4 claim 3');
    await click('Swap in'); await sleep(3.6); await shot('prove-4-sliding'); await sleep(6.4); await shot('prove-4'); await panelFit('part 4 end');
    await click('Practice');
  } else {
    await page.goto(base + '&part=4&open', { waitUntil: 'networkidle0' });
    await page.waitForFunction('window.lessonReady');
  }
  // practice: right, but every third item wrong (feedback, the worked solution and the twin)
  await sleep(2.0);
  const N = Number(process.env.WALK_N ?? 36);
  for (let i = 0; i < N; i++) {
    const it = await page.evaluate(() => { const x = window.__practiceItem; return { fam: x.family, sg: x.subgoal, input: x.input, ans: x.answer, nc: (x.choices || []).length, pic: !!x.picture }; });
    const wrong = i % 3 === 1;
    if (it.input === 'num') await typeNum(wrong ? it.ans.v + 1 : it.ans.v);
    else if (it.input === 'pair') await page.evaluate((x, y) => { const [a, b] = document.querySelectorAll('.panel .ans input'); a.value = x; b.value = y; }, String(wrong ? it.ans.x + 1 : it.ans.x), String(it.ans.y));
    else await page.evaluate(i => document.querySelectorAll('.panel .opts button')[i].click(), wrong ? (it.ans.i + 1) % it.nc : it.ans.i);
    await sleep(it.pic ? 1.4 : 0.8);
    const show = i < 4 || (wrong && i < 34) || it.pic;
    if (show) await shot(`practice-${i + 1}-${it.sg}-${it.fam}`);
    await click('Check'); await sleep(wrong ? 4.2 : 0.6);
    if (show) await shot(`practice-${i + 1}-${it.fam}-${wrong ? 'wrong' : 'right'}`);
    await click(wrong ? 'Try one like it' : 'Next');
    await sleep(0.8);
  }
  await shot('practice-end');
  const log = await page.evaluate(() => window.mathscenesLessons.log('parallel-lines-and-triangles'));
  fs.writeFileSync(path.join(out, 'diagnosis-log.json'), JSON.stringify(log, null, 1));
  console.log(`diagnosis log: ${log.length} attempts, ${log.filter(a => a.mc).length} with a misconception; parts: ${[...new Set(log.map(a => a.part))].join(', ')}`);
} catch (e) {
  console.log('WALK FAILED:', e.message); await shot('failed');
} finally {
  for (const f of fitLog) console.log(f);
  console.log(errors.length ? `PAGE ERRORS:\n${errors.join('\n')}` : 'no page errors');
  await browser.close();
}
