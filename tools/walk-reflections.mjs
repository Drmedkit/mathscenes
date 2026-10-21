// walk-reflections.mjs: click through the reflections lesson like a kid would (right and wrong answers), screenshot
// every state of parts 1-4 and practice items (right and wrong, with the worked solution after a miss).
//   node tools/walk-reflections.mjs [base url] [out dir] [practice items]
// Needs the dev server (port 5290). Headless and muted (--mute-audio and ?mute).
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] ?? 'http://localhost:5290/lessons/reflections.html?mute&fresh&seed=7';
const out = process.argv[3] ?? 'out/walk-reflections';
const N = Number(process.argv[4] ?? 50);
fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ headless: true, args: ['--mute-audio', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', async m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text() + ' ' + (await Promise.all(m.args().map(a => a.evaluate(x => (x && x.stack) || '').catch(() => '')))).join(' ').slice(0, 600)); });
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
// other agents edit files in this worktree: keep Vite's hot reload from reloading the page mid-walk
await page.setRequestInterception(true);
page.on('request', r => (r.url().includes('/@vite/client') ? r.abort() : r.continue()));
page.on('framenavigated', f => { if (f === page.mainFrame()) console.log('navigated:', f.url()); });
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
async function typeNum(v) { await page.evaluate(v => { document.querySelector('.panel .ans input').value = v; }, String(v)); }

// gallery: one item of every family x sub-goal, with its worked solution (node tools/walk-reflections.mjs gallery [out])
if (process.argv[2] === 'gallery') {
  const PAIRS = ['move:flip-not-slide', 'fold:fold-correspondence', 'perp:common-perpendicular', 'distance:equal-distance-opposite-side', 'fixed:fixed-points', 'marks:read-diagram-marks',
    'count:grid-point-reflect', 'stepsNum:grid-point-reflect', 'tool:construct-perpendicular', 'transfer:transfer-distance', 'vertex:polygon-vertex-by-vertex', 'crossing:polygon-touching-crossing',
    'vertex:polygon-touching-crossing', 'diag:diagonal-grid-reflect', 'stepsNum:diagonal-grid-reflect', 'half:diagonal-half-steps', 'stepsNum:diagonal-half-steps', 'oblique:oblique-line-tools',
    'tool:oblique-line-tools', 'extend:extend-mirror-line', 'verify:verify-point-pair', 'audit:audit-polygon', 'sameShape:same-shape-not-enough', 'orient:orientation-test',
    'bisect:fold-perpendicular-bisector', 'locate:locate-mirror-line', 'slip:diagnose-error', 'exact:exact-vs-measured'];
  const dir = process.argv[3] ?? 'out/walk-reflections/gallery';
  fs.mkdirSync(dir, { recursive: true });
  const seeds = (process.argv[4] ?? '3').split(',').map(Number);
  for (const pr of PAIRS) for (const sd of seeds) {
    await page.goto(`http://localhost:5290/lessons/reflections.html?mute&open&part=4&solve&item=${pr}:${sd}`, { waitUntil: 'networkidle0' });
    await page.waitForFunction('window.lessonReady');
    await sleep(6.5);
    const f = path.join(dir, `${pr.replace(':', '--')}-${sd}.png`); await page.screenshot({ path: f }); console.log(f);
  }
  console.log(errors.length ? 'PAGE ERRORS: ' + [...new Set(errors)].join(' | ') : 'no page errors');
  await browser.close();
  process.exit(0);
}
try {
  await page.goto(base, { waitUntil: 'networkidle0' });
  await page.waitForFunction('window.lessonReady');
  // 1. the question
  await sleep(3.4); await shot('question');
  await click('1'); await click('Pretty sure'); await shot('question-picked'); await click('Find out');
  // 2. worked example
  await sleep(0.8); await shot('example-start');
  await click('Go to m'); await sleep(3.6); await shot('example-perp');
  await click('Count'); await sleep(3.4); await shot('example-count');
  await click('Go beyond'); await sleep(4.0); await shot('example-beyond');
  await click('Fold'); await sleep(1.3); await shot('example-folding');
  await sleep(5.6); await shot('example-folded');
  await click('A reflection always'); await sleep(0.3); await shot('example-why-wrong');
  await click('The fold moves'); await sleep(0.3); await click('Your turn');
  // 3. your turn
  await sleep(8.6); await shot('turn-ask');
  await typeNum(6); await click('Check'); await sleep(0.3); await shot('turn-count-across');
  await typeNum(3); await click('Check'); await sleep(3.6); await shot('turn-spots');
  await click('Spot 2'); await sleep(0.3); await shot('turn-spot-short');
  await click('Spot 3'); await sleep(4.2); await shot('turn-b');
  await click('C′ is across'); await sleep(0.3); await shot('turn-c-wrong');
  await click('C′ is C itself'); await sleep(3.2); await shot('turn-c');
  await click('Clockwise'); await sleep(1.4); await shot('turn-order-wrong');
  await click('Counterclockwise'); await sleep(2.6); await shot('turn-done');
  await click('Prove it');
  // 4. prove it
  await sleep(3.0); await click('Riley is wrong'); await sleep(0.3); await shot('prove-start');
  await click('Q is just as far'); await sleep(0.3); await shot('prove-wrong-chip');
  await click('A fold moves'); await sleep(3.4); await shot('prove-1');
  await click('PQ crosses m'); await sleep(3.0); await shot('prove-2');
  await click('P is 2 steps'); await sleep(9.6); await shot('prove-3');
  await click('Practice');
  // 5. practice: right answers, every third wrong (feedback, worked solution, twin)
  await sleep(1.6);
  for (let i = 0; i < N; i++) {
    const it = await page.evaluate(() => { const x = window.__practiceItem; return { fam: x.family, input: x.input, ans: x.answer, k: (x.choices ?? []).length }; });
    const wrong = i % 3 === 1;
    if (it.input === 'num') await typeNum(wrong ? it.ans.v + 1 : it.ans.v);
    else await page.evaluate(i => document.querySelectorAll('.panel .opts button')[i].click(), wrong ? (it.ans.i + 1) % it.k : it.ans.i);
    await sleep(0.5);
    const snap = i < 16 || (wrong && i < 48);
    if (snap) await shot(`practice-${i + 1}-${it.fam}`);
    await click('Check'); await sleep(wrong ? 5.8 : 0.5);
    if (snap && wrong) await shot(`practice-${i + 1}-${it.fam}-wrong`);
    await click(wrong ? 'Try one like it' : 'Next');
    await sleep(1.3);
  }
  await shot('practice-end');
  const log = await page.evaluate(() => window.mathscenesLessons.log('reflections'));
  fs.writeFileSync(path.join(out, 'diagnosis-log.json'), JSON.stringify(log, null, 1));
  console.log(`diagnosis log: ${log.length} attempts, ${log.filter(a => a.mc).length} with a misconception`);
} catch (e) {
  console.log('WALK FAILED:', e.message);
  await shot('failed');
} finally {
  console.log(errors.length ? `PAGE ERRORS:\n${errors.join('\n')}` : 'no page errors');
  await browser.close();
}
