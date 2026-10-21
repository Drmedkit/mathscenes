// walk-systems-of-equations.mjs: click through the systems lesson like a kid would (right and wrong answers in
// every part) and screenshot every state.   node tools/walk-systems-of-equations.mjs [base url] [out dir]
// Needs the dev server (port 5290). Headless, muted (--mute-audio and ?mute). WALK_ONLY=practice skips to practice.
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] ?? 'http://localhost:5290/lessons/systems-of-equations.html?mute&fresh&seed=7';
const out = process.argv[3] ?? 'out/walk-systems-of-equations';
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
async function typeNum(v) { await page.evaluate(v => { const i = document.querySelector('.panel .ans input'); i.value = v; }, String(v)); }
async function typePair(x, y) { await page.evaluate((x, y) => { const [a, b] = document.querySelectorAll('.panel .ans input'); a.value = x; b.value = y; }, String(x), String(y)); }

try {
  if (only !== 'practice') {
    await page.goto(base, { waitUntil: 'networkidle0' });
    await page.waitForFunction('window.lessonReady');
    await sleep(3.5); await shot('question');
    await click('(5, 2)'); await click('Pretty sure'); await shot('question-picked'); await click('Find out');
    // worked example
    await sleep(0.8); await shot('example-start');
    await click('Show them'); await sleep(5.8); await shot('example-line1');
    await click('Show them'); await sleep(5.4); await shot('example-line2');
    await click('Find it'); await sleep(6.6); await shot('example-cross');
    await click('Add them'); await sleep(12.5); await shot('example-add');
    await click('It is where a line'); await sleep(0.3); await shot('example-why-wrong');
    await click('It is on both lines'); await sleep(0.3); await click('Your turn');
    // your turn
    await sleep(4.6); await shot('turn-sub');
    await click('x + 2x'); await sleep(0.3); await shot('turn-sub-wrong');
    await click('x + (2x'); await sleep(3.0); await shot('turn-x');
    await typeNum(9); await click('Check'); await sleep(0.3); await shot('turn-x-wrong');
    await typeNum(3); await click('Check'); await sleep(3.4); await shot('turn-pair');
    await typePair(5, 3); await click('Check'); await sleep(0.3); await shot('turn-pair-wrong');
    await typePair(3, 5); await click('Check'); await sleep(4.2); await shot('turn-done');
    await click('Prove it');
    // prove it
    await sleep(4.4); await click('Riley is wrong'); await sleep(0.3); await shot('prove-start');
    await click('When the x'); await sleep(0.3); await shot('prove-wrong-chip');
    await click('It is on the first line'); await sleep(4.0); await shot('prove-1');
    await click('Both lines have slope'); await sleep(3.6); await shot('prove-2');
    await click('3 = −1 is false'); await sleep(3.0); await shot('prove-3');
    await click('Practice');
  } else {
    await page.goto(base + '&part=4&open', { waitUntil: 'networkidle0' });
    await page.waitForFunction('window.lessonReady');
  }
  // practice: right, but every third item wrong (feedback, the worked solution and the twin)
  await sleep(2.0);
  const N = Number(process.env.WALK_N ?? 36);
  for (let i = 0; i < N; i++) {
    const it = await page.evaluate(() => { const x = window.__practiceItem; return { fam: x.family, sg: x.subgoal, input: x.input, ans: x.answer, n: (x.choices || []).length, pic: !!(x.picture && x.picture.sys) }; });
    const wrong = i % 3 === 1;
    if (it.input === 'num') await typeNum(wrong ? it.ans.v + 1 : it.ans.v);
    else if (it.input === 'pair') await typePair(wrong ? it.ans.y : it.ans.x, wrong ? (it.ans.x === it.ans.y ? it.ans.x + 1 : it.ans.x) : it.ans.y);
    else await page.evaluate(i => document.querySelectorAll('.panel .opts button')[i].click(), wrong ? (it.ans.i + 1) % it.n : it.ans.i);
    await sleep(it.pic ? 2.0 : 0.9);
    const show = i < 4 || wrong || i % 4 === 0;
    if (show) await shot(`practice-${i + 1}-${it.sg}-${it.fam}`);
    await click('Check'); await sleep(wrong ? (it.pic ? 7 : 1.0) : 0.6);
    if (show) await shot(`practice-${i + 1}-${it.fam}-${wrong ? 'wrong' : 'right'}`);
    await click(wrong ? 'Try one like it' : 'Next');
    await sleep(1.0);
  }
  await shot('practice-end');
  const log = await page.evaluate(() => window.mathscenesLessons.log('systems-of-equations'));
  fs.writeFileSync(path.join(out, 'diagnosis-log.json'), JSON.stringify(log, null, 1));
  console.log(`diagnosis log: ${log.length} attempts, ${log.filter(a => a.mc).length} with a misconception; parts: ${[...new Set(log.map(a => a.part))].join(', ')}`);
} catch (e) {
  console.log('WALK FAILED:', e.message); await shot('failed');
} finally {
  console.log(errors.length ? `PAGE ERRORS:\n${errors.join('\n')}` : 'no page errors');
  await browser.close();
}
