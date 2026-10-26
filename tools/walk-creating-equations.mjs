// walk-creating-equations.mjs: click through the creating-equations lesson (Algebra 1) like a kid would (right and wrong
// answers) and screenshot every state.   node tools/walk-creating-equations.mjs [base url] [out dir]
// Needs the dev server (port 5290). Headless, muted (--mute-audio and ?mute).
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] ?? 'http://localhost:5290/lessons/creating-equations.html?mute&fresh&seed=7';
const out = process.argv[3] ?? 'out/walk-creating-equations';
const only = process.env.WALK_ONLY ?? '';   // e.g. "practice" to skip to practice (?part=4&open)
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
    await sleep(4.0); await shot('question');
    await click('Plan 1'); await click('Pretty sure'); await shot('question-picked'); await click('Find out');
    // worked example
    await sleep(0.8); await shot('example-start');
    await click('Name them'); await sleep(3.6); await shot('example-unknowns');
    await click('Write it'); await sleep(4.6); await shot('example-money');
    await click('Write them'); await sleep(7.4); await shot('example-stated');
    await click('Add it'); await sleep(8.4); await shot('example-unstated');
    await click('It passes most'); await sleep(0.3); await shot('example-why-wrong');
    await click('A plan must pass'); await sleep(0.3); await click('Your turn');
    // your turn
    await sleep(7.6); await shot('turn-cmp');
    await click('2t ≥ b'); await sleep(0.4); await shot('turn-cmp-wrong');
    await click('t ≥ 2b'); await sleep(1.9); await shot('turn-judge');
    await click('Viable: 2(12)'); await sleep(0.4); await shot('turn-judge-wrong');
    await click('Not viable'); await sleep(7.6); await shot('turn-done');
    await click('Prove it');
    // prove it
    await sleep(4.8); await shot('prove-intro'); await click('Kai is wrong'); await sleep(0.3); await shot('prove-start');
    await click('2.33 rounds'); await sleep(0.3); await shot('prove-wrong-chip');
    await click('12 × 2'); await sleep(2.0); await shot('prove-1');
    await click('The school can rent'); await sleep(2.0); await shot('prove-2');
    await click('A viable answer'); await sleep(4.6); await shot('prove-3');
    await click('Practice');
  } else {
    await page.goto(base + '&part=4&open', { waitUntil: 'networkidle0' });
    await page.waitForFunction('window.lessonReady');
  }
  // practice: right, but every third item wrong (feedback, the steps card, the replay and the twin)
  await sleep(2.0);
  const N = Number(process.env.WALK_N ?? 30);
  for (let i = 0; i < N; i++) {
    const it = await page.evaluate(() => { const x = window.__practiceItem; return { fam: x.family, sg: x.subgoal, input: x.input, ans: x.answer, n: (x.choices ?? []).length, pic: !!x.picture }; });
    const wrong = i % 3 === 1;
    if (it.input === 'num') await typeNum(wrong ? it.ans.v + 1 : it.ans.v);
    else await page.evaluate(i => document.querySelectorAll('.panel .opts button')[i].click(), wrong ? (it.ans.i + 1) % it.n : it.ans.i);
    await sleep(it.pic ? 2.4 : 0.9);
    const show = i < 4 || wrong || it.pic;
    if (show) await shot(`practice-${i + 1}-${it.sg}-${it.fam}`);
    await click('Check'); await sleep(wrong ? (it.pic ? 7 : 1.2) : 0.6);
    if (show) await shot(`practice-${i + 1}-${it.fam}-${wrong ? 'wrong' : 'right'}`);
    await click(wrong ? 'Try one like it' : 'Next');
    await sleep(1.0);
  }
  await shot('practice-end');
  const log = await page.evaluate(() => window.mathscenesLessons.log('creating-equations'));
  fs.writeFileSync(path.join(out, 'diagnosis-log.json'), JSON.stringify(log, null, 1));
  console.log(`diagnosis log: ${log.length} attempts, ${log.filter(a => a.mc).length} with a misconception; parts: ${[...new Set(log.map(a => a.part))].join(', ')}`);
} catch (e) {
  console.log('WALK FAILED:', e.message); await shot('failed');
} finally {
  console.log(errors.length ? 'PAGE ERRORS:\n' + errors.join('\n') : 'no page errors');
  await browser.close();
}
