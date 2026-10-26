// walk-absolute-value.mjs: click through the absolute-value lesson (Algebra 1) like a student would (right and wrong
// answers) and screenshot every state.   node tools/walk-absolute-value.mjs [base url] [out dir]
// Needs the dev server (port 5290). Headless, muted (--mute-audio and ?mute). WALK_ONLY=practice skips to practice.
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] ?? 'http://localhost:5290/lessons/absolute-value.html?mute&fresh&seed=7';
const out = process.argv[3] ?? 'out/walk-absolute-value';
const only = process.env.WALK_ONLY ?? '';
fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ headless: true, args: ['--mute-audio', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
const page = await browser.newPage();
const errors = [];
// other lessons are being built in the same dev server: block Vite's HMR client so a reload elsewhere can't restart us
await page.setRequestInterception(true);
page.on('request', r => (new URL(r.url()).pathname.endsWith('/@vite/client') ? r.respond({ status: 200, contentType: 'application/javascript', body: 'export {}' }) : r.continue()));
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if ((m.type() === 'error' || m.type() === 'warn') && !/vite|ERR_FAILED|favicon/.test(m.text())) errors.push(m.text()); });
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
    await click('only x = 7'); await click('Pretty sure'); await shot('question-picked'); await click('Find out');
    // worked example
    await sleep(0.8); await shot('example-start');
    await click('Find it'); await sleep(2.6); await shot('example-vertex');
    await click('Draw them'); await sleep(4.6); await shot('example-pieces');
    await click('Draw it'); await sleep(3.8); await shot('example-line');
    await click('Solve'); await sleep(3.6); await shot('example-solved');
    await click('Every absolute value'); await sleep(0.3); await shot('example-why-wrong');
    await click('Left of 4'); await sleep(0.3); await click('Your turn');
    // your turn
    await sleep(3.6); await shot('turn-iso');
    await click('2(x − 2)'); await sleep(0.6); await shot('turn-iso-wrong');
    await click('|x − 2| = 5'); await sleep(2.0); await shot('turn-sol');
    await typeIn([-5, 5]); await click('Check'); await sleep(1.0); await shot('turn-sol-wrong');
    await typeIn([7, -3]); await click('Check'); await sleep(3.6); await shot('turn-done');
    await click('Prove it');
    // prove it
    await sleep(4.0); await click('Jordan is wrong'); await sleep(0.3); await shot('prove-start');
    await click('Both came from'); await sleep(0.3); await shot('prove-wrong-chip');
    await click('It came from the case 2x − 3 ≥ 0'); await sleep(2.4); await shot('prove-1');
    await click('It came from the case 2x − 3 <'); await sleep(2.4); await shot('prove-2');
    await click('An absolute value is a distance'); await sleep(2.6); await shot('prove-3');
    await click('Practice');
  } else {
    await page.goto(base + '&part=4&open', { waitUntil: 'networkidle0' });
    await page.waitForFunction('window.lessonReady');
  }
  // practice: right, but every third item wrong (feedback, the steps card, the replay and the twin)
  await sleep(2.0);
  const N = Number(process.env.WALK_N ?? 12);
  for (let i = 0; i < N; i++) {
    const it = await page.evaluate(() => { const x = window.__practiceItem; return { fam: x.family, sg: x.subgoal, input: x.input, ans: x.answer, n: (x.choices ?? []).length, pic: !!x.picture }; });
    const wrong = i % 3 === 1;
    if (it.input === 'num') await typeIn([wrong ? it.ans.v + 1 : it.ans.v]);
    else if (it.input === 'pair') await typeIn(wrong ? [it.ans.y + 1, it.ans.x] : [it.ans.x, it.ans.y]);
    else await page.evaluate(i => document.querySelectorAll('.panel .opts button')[i].click(), wrong ? (it.ans.i + 1) % it.n : it.ans.i);
    await sleep(it.pic ? 2.2 : 0.9);
    await shot(`practice-${i + 1}-${it.sg}-${it.fam}`);
    await click('Check'); await sleep(wrong ? (it.pic ? 4.5 : 1.2) : 0.5);
    if (wrong) await shot(`practice-${i + 1}-${it.fam}-wrong`);
    await click(wrong ? 'Try one like it' : 'Next');
    await sleep(0.8);
  }
  await shot('practice-end');
  const log = await page.evaluate(() => window.mathscenesLessons.log('absolute-value'));
  fs.writeFileSync(path.join(out, 'diagnosis-log.json'), JSON.stringify(log, null, 1));
  console.log(`diagnosis log: ${log.length} attempts, ${log.filter(a => a.mc).length} with a misconception; parts: ${[...new Set(log.map(a => a.part))].join(', ')}`);
} catch (e) {
  console.log('WALK FAILED:', e.message); await shot('failed');
} finally {
  console.log(errors.length ? 'PAGE ERRORS:\n' + errors.join('\n') : 'no page errors');
  await browser.close();
}
