// walk-similarity.mjs: click through "Similar triangles" like a student would (right and wrong answers) and
// screenshot every state.   node tools/walk-similarity.mjs [base url] [out dir]
// Needs the dev server (port 5290). Headless, muted (--mute-audio and ?mute). WALK_ONLY=practice skips to practice.
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] ?? 'http://localhost:5290/lessons/similarity.html?mute&fresh&seed=7';
const out = process.argv[3] ?? 'out/walk-similarity';
const only = process.env.WALK_ONLY ?? '';
fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ headless: true, args: ['--mute-audio', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
const page = await browser.newPage();
const errors = [];
// other lessons are being built in the same dev server: stub Vite's HMR client so a reload elsewhere can't restart us
await page.setRequestInterception(true);
page.on('request', r => (new URL(r.url()).pathname.endsWith('/@vite/client') ? r.respond({ status: 200, contentType: 'application/javascript', body: 'export {}' }) : r.continue()));
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if ((m.type() === 'error' || m.type() === 'warn') && !/vite\/client|ERR_FAILED/.test(m.text())) errors.push(m.text()); });
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
let n = 0;
const sleep = s => new Promise(r => setTimeout(r, s * 1000));
async function shot(name) { n++; const f = path.join(out, `${String(n).padStart(2, '0')}-${name}.png`); await page.screenshot({ path: f }); console.log(f); }
async function click(text, sel = 'button') {
  const ok = await page.evaluate((text, sel) => {
    const norm = s => s.replace(/\s+/g, ' ').trim();
    const b = [...document.querySelectorAll(sel)].find(x => norm(x.textContent).startsWith(text) && !x.disabled && x.offsetParent);
    if (!b) return false; b.click(); return true;
  }, text, sel);
  if (!ok) throw new Error(`no button "${text}"`);
}
/** fill the last answer box of the panel: one number, or [whole, numerator, denominator] */
async function fill(vals) {
  await page.evaluate(vals => {
    const boxes = [...document.querySelectorAll('.panel .ans')];
    const ins = [...boxes[boxes.length - 1].querySelectorAll('input')];
    (Array.isArray(vals) ? vals : [vals]).forEach((v, i) => { ins[i].value = String(v); });
  }, vals);
}
async function checkLast() { await page.evaluate(() => { const bs = [...document.querySelectorAll('.panel button')].filter(b => b.textContent.trim() === 'Check' && !b.disabled); bs[bs.length - 1].click(); }); }

try {
  if (only !== 'practice') {
    await page.goto(base, { waitUntil: 'networkidle0' });
    await page.waitForFunction('window.lessonReady');
    await sleep(3.0); await shot('question');
    await click('7.5 ft'); await click('Pretty sure'); await shot('question-picked'); await click('Find out');
    // worked example
    await sleep(1.8); await shot('example-start');
    await click('Find'); await sleep(4.4); await shot('example-angles');
    await click('Name'); await sleep(2.2); await shot('example-named');
    await click('Dilate'); await sleep(2.0); await shot('example-dilating'); await sleep(2.6); await shot('example-dilated');
    await click('Solve'); await sleep(3.6); await shot('example-solved');
    await click('Either works'); await sleep(0.3); await shot('example-why-wrong');
    await click('AB is the side'); await sleep(0.4); await click('Your turn');
    // your turn: the hourglass
    await sleep(2.0); await shot('turn-start');
    await click('△ABE ~ △DCE'); await sleep(0.3); await shot('turn-position');
    await click('△ABE ~ △CDE'); await sleep(1.8); await shot('turn-halfturn'); await sleep(2.2); await shot('turn-dilated'); await sleep(1.0);
    await fill(['', 2, 3]); await checkLast(); await sleep(0.3); await shot('turn-k-wrong');
    await fill(['', 3, 2]); await checkLast(); await sleep(0.8); await shot('turn-k');
    await fill(11); await checkLast(); await sleep(0.3); await shot('turn-cd-wrong');
    await fill(12); await checkLast(); await sleep(2.2); await shot('turn-done');
    await click('Prove it');
    // prove it: the side-splitter theorem
    await sleep(2.0); await shot('prove-start'); await click('Always'); await sleep(0.6); await shot('prove-chain');
    await click('DB and EC are corresponding'); await sleep(0.3); await shot('prove-chip-wrong');
    await click('AA: ∠A is shared'); await sleep(1.4); await shot('prove-claim1');
    await click('Corresponding sides of similar'); await sleep(3.4); await shot('prove-claim2');
    await click('DB = AB − AD'); await sleep(3.8); await shot('prove-claim3');
    await click('Yes: a parallel'); await sleep(0.3); await shot('prove-last-wrong');
    await click('No: DE and BC'); await sleep(5.2); await shot('prove-callback');
    await click('Practice');
  } else {
    await page.goto(base + '&part=4&open', { waitUntil: 'networkidle0' });
    await page.waitForFunction('window.lessonReady');
  }
  // practice: right, but every third item wrong (feedback, the replay on the picture and the steps card)
  await sleep(2.0);
  const N = Number(process.env.WALK_N ?? 30);
  for (let i = 0; i < N; i++) {
    const it = await page.evaluate(() => { const x = window.__practiceItem; return { fam: x.family, sg: x.subgoal, input: x.input, ans: x.answer, n: (x.choices ?? []).length }; });
    const wrong = i % 3 === 1;
    if (it.input === 'num') await fill(wrong ? it.ans.v + 1 : it.ans.v);
    else if (it.input === 'frac') await fill(wrong ? ['', it.ans.n + it.ans.w * it.ans.d + 1, it.ans.d] : (it.ans.d === 1 ? [it.ans.w, '', ''] : ['', it.ans.n, it.ans.d]));
    else await page.evaluate(i => document.querySelectorAll('.panel .opts button')[i].click(), wrong ? (it.ans.i + 1) % it.n : it.ans.i);
    await sleep(2.0);
    const show = i < 6 || wrong;
    if (show) await shot(`practice-${i + 1}-${it.sg}-${it.fam}`);
    await click('Check'); await sleep(wrong ? 3.6 : 0.6);
    if (show && wrong) await shot(`practice-${i + 1}-${it.fam}-wrong`);
    await click(wrong ? 'Try one like it' : 'Next');
    await sleep(0.8);
  }
  await shot('practice-end');
  const log = await page.evaluate(() => window.__lesson.store.attempts());
  fs.writeFileSync(path.join(out, 'diagnosis-log.json'), JSON.stringify(log, null, 1));
  console.log(`diagnosis log: ${log.length} attempts, ${log.filter(a => a.mc).length} with a misconception; parts: ${[...new Set(log.map(a => a.part))].join(', ')}`);
} catch (e) {
  console.log('WALK FAILED:', e.message); await shot('failed');
} finally {
  console.log(errors.length ? `PAGE ERRORS:\n${errors.join('\n')}` : 'no page errors');
  await browser.close();
}
