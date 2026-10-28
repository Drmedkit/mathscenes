// walk-right-triangle-trig.mjs: click through "Right triangle trigonometry" like a student would (right and wrong
// answers) and screenshot every state.   node tools/walk-right-triangle-trig.mjs [base url] [out dir]
// Needs the dev server (port 5290). Headless, muted (--mute-audio and ?mute). WALK_ONLY=practice skips to practice.
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] ?? 'http://localhost:5290/lessons/right-triangle-trig.html?mute&fresh&seed=7';
const out = process.argv[3] ?? 'out/walk-right-triangle-trig';
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
/** fill the last answer box of the panel */
async function fill(v) {
  await page.evaluate(v => {
    const boxes = [...document.querySelectorAll('.panel .ans')];
    const ins = [...boxes[boxes.length - 1].querySelectorAll('input')];
    (Array.isArray(v) ? v : [v]).forEach((x, i) => { ins[i].value = String(x); });
  }, v);
}
async function checkLast() { await page.evaluate(() => { const bs = [...document.querySelectorAll('.panel button')].filter(b => b.textContent.trim() === 'Check' && !b.disabled); bs[bs.length - 1].click(); }); }

try {
  if (only !== 'practice') {
    await page.goto(base, { waitUntil: 'networkidle0' });
    await page.waitForFunction('window.lessonReady');
    await sleep(3.0); await shot('question');
    await click('about 44 ft'); await click('Pretty sure'); await shot('question-picked'); await click('Find out');
    // worked example
    await sleep(1.8); await shot('example-start');
    await click('Name'); await sleep(3.0); await shot('example-named');
    await click('Compare'); await sleep(2.0); await shot('example-small'); await sleep(3.6); await shot('example-dilated');
    await click('Write'); await sleep(2.4); await shot('example-equation');
    await click('Solve'); await sleep(2.8); await shot('example-solved');
    await click('The kite’s triangle is bigger'); await sleep(0.3); await shot('example-why-wrong');
    await click('Both have a right angle'); await sleep(0.4); await click('Your turn');
    // your turn: the ladder
    await sleep(2.0); await shot('turn-start');
    await click('sin 75°'); await sleep(0.3); await shot('turn-ratio-wrong');
    await click('cos 75°'); await sleep(1.4); await shot('turn-ratio');
    await fill(1); await checkLast(); await sleep(0.3); await shot('turn-L-wrong');
    await fill(15.5); await checkLast(); await sleep(2.2); await shot('turn-L');
    await fill(14); await checkLast(); await sleep(0.3); await shot('turn-angle-wrong');
    await fill(76); await checkLast(); await sleep(2.2); await shot('turn-done');
    await click('Prove it');
    // prove it: sin A = cos(90° − A)
    await sleep(2.0); await shot('prove-start'); await click('Always'); await sleep(0.6); await shot('prove-chain');
    await click('Sine and cosine are equal'); await sleep(0.3); await shot('prove-chip-wrong');
    await click('The angles of a triangle'); await sleep(2.0); await shot('prove-claim1');
    await click('The bottom side'); await sleep(0.3); await shot('prove-chip-wrong2');
    await click('Opposite and adjacent are named'); await sleep(2.8); await shot('prove-claim2');
    await click('Both ratios divide'); await sleep(2.4); await shot('prove-claim3');
    await click('cos 40°'); await sleep(0.3); await shot('prove-last-wrong');
    await click('cos 50°'); await sleep(4.6); await shot('prove-callback');
    await click('Practice');
  } else {
    await page.goto(base + '&part=4&open', { waitUntil: 'networkidle0' });
    await page.waitForFunction('window.lessonReady');
  }
  // practice: right, but every third item wrong (feedback, the replay on the picture and the steps card)
  await sleep(2.0);
  const N = Number(process.env.WALK_N ?? 24);
  for (let i = 0; i < N; i++) {
    const it = await page.evaluate(() => { const x = window.__practiceItem; return { fam: x.family, sg: x.subgoal, input: x.input, ans: x.answer, n: (x.choices ?? []).length }; });
    const wrong = i % 3 === 1;
    if (it.input === 'num') await fill(wrong ? it.ans.v + 1 : it.ans.v);
    else if (it.input === 'frac') await fill(wrong ? ['', it.ans.n + 1, it.ans.d] : ['', it.ans.n, it.ans.d]);
    else if (it.input === 'pair') await fill(wrong ? [it.ans.x + 1, it.ans.y] : [it.ans.x, it.ans.y]);
    else await page.evaluate(i => document.querySelectorAll('.panel .opts button')[i].click(), wrong ? (it.ans.i + 1) % it.n : it.ans.i);
    await sleep(1.6);
    const show = i < 6 || wrong;
    if (show) await shot(`practice-${i + 1}-${it.sg}-${it.fam}`);
    await click('Check'); await sleep(wrong ? 3.4 : 0.5);
    if (show && wrong) await shot(`practice-${i + 1}-${it.fam}-wrong`);
    await click(wrong ? 'Try one like it' : 'Next');
    await sleep(0.7);
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
