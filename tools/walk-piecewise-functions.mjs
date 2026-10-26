// walk-piecewise-functions.mjs: click through the piecewise-functions lesson (Algebra 1) like a student would (right
// and wrong answers) and screenshot every state.   node tools/walk-piecewise-functions.mjs [base url] [out dir]
// Needs the dev server (port 5290). Headless, muted (--mute-audio and ?mute). WALK_ONLY=practice skips to practice.
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] ?? 'http://localhost:5290/lessons/piecewise-functions.html?mute&fresh&seed=7';
const out = process.argv[3] ?? 'out/walk-piecewise-functions';
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
async function typeIn(vals) { await page.evaluate(vals => { const is = document.querySelectorAll('.panel .ans input'); vals.forEach((v, i) => { is[i].value = String(v); }); }, vals); }

try {
  if (only !== 'practice') {
    await page.goto(base, { waitUntil: 'networkidle0' });
    await page.waitForFunction('window.lessonReady');
    await sleep(3.5); await shot('question');
    await click('2'); await click('Pretty sure'); await shot('question-picked'); await click('Find out');
    // worked example
    await sleep(0.8); await shot('example-start');
    await click('Test 1'); await sleep(4.2); await shot('example-f1');
    await click('Draw it'); await sleep(4.2); await shot('example-first');
    await click('Draw it'); await sleep(5.8); await shot('example-second');
    await click('Read it'); await sleep(4.4); await shot('example-read');
    await click('The first rule is listed'); await sleep(0.3); await shot('example-why-wrong');
    await click('The symbols decide'); await sleep(0.3); await click('Your turn');
    // your turn
    await sleep(4.4); await shot('turn-dots');
    await click('Filled at (2'); await sleep(1.6); await shot('turn-dots-wrong');
    await click('Open at (2'); await sleep(3.4); await shot('turn-steps');
    await typeIn([8]); await click('Check'); await sleep(1.2); await shot('turn-cost-wrong');
    await typeIn([12]); await click('Check'); await sleep(2.4); await shot('turn-cost');
    await click('Prove it');
    // prove it
    await sleep(4.0); await click('Mia is wrong'); await sleep(0.3); await shot('prove-start');
    await click('A function’s graph'); await sleep(0.3); await shot('prove-wrong-chip');
    await click('x < 1 and'); await sleep(1.3); await shot('prove-1');
    await click('1 meets only'); await sleep(2.8); await shot('prove-2');
    await click('A function needs'); await sleep(2.2); await shot('prove-sweep');
    await sleep(4.0); await shot('prove-3');
    await click('Practice');
  } else {
    await page.goto(base + '&part=4&open', { waitUntil: 'networkidle0' });
    await page.waitForFunction('window.lessonReady');
  }
  // practice: right, but every third item wrong (feedback, the steps card, the replay and the twin)
  await sleep(2.0);
  const N = Number(process.env.WALK_N ?? 30);
  for (let i = 0; i < N; i++) {
    const it = await page.evaluate(() => { const x = window.__practiceItem; return { fam: x.family, sg: x.subgoal, input: x.input, ans: x.answer, n: (x.choices ?? []).length, pic: !!(x.picture && (x.picture.g || x.picture.opts)) }; });
    const wrong = i % 3 === 1;
    if (it.input === 'num') await typeIn([wrong ? it.ans.v + 1 : it.ans.v]);
    else if (it.input === 'pair') await typeIn(wrong ? [it.ans.y, it.ans.x + 1] : [it.ans.x, it.ans.y]);
    else await page.evaluate(i => document.querySelectorAll('.panel .opts button')[i].click(), wrong ? (it.ans.i + 1) % it.n : it.ans.i);
    await sleep(it.pic ? 2.2 : 0.9);
    await shot(`practice-${i + 1}-${it.sg}-${it.fam}`);
    await click('Check'); await sleep(wrong ? (it.pic ? 4.5 : 1.2) : 0.5);
    if (wrong) await shot(`practice-${i + 1}-${it.fam}-wrong`);
    await click(wrong ? 'Try one like it' : 'Next');
    await sleep(0.8);
  }
  await shot('practice-end');
  const log = await page.evaluate(() => window.mathscenesLessons.log('piecewise-functions'));
  fs.writeFileSync(path.join(out, 'diagnosis-log.json'), JSON.stringify(log, null, 1));
  console.log(`diagnosis log: ${log.length} attempts, ${log.filter(a => a.mc).length} with a misconception; parts: ${[...new Set(log.map(a => a.part))].join(', ')}`);
} catch (e) {
  console.log('WALK FAILED:', e.message); await shot('failed');
} finally {
  console.log(errors.length ? 'PAGE ERRORS:\n' + errors.join('\n') : 'no page errors');
  await browser.close();
}
