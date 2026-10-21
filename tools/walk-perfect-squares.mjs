// walk-perfect-squares.mjs: click through the square-roots lesson like a kid would (right and wrong answers) and
// screenshot every state.
//   node tools/walk-perfect-squares.mjs [base url] [out dir] [practice items]
// Needs the dev server (port 5290). Headless, ALWAYS muted (--mute-audio and ?mute).
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] ?? 'http://localhost:5290/lessons/perfect-squares.html?mute&fresh&seed=7';
const out = process.argv[3] ?? 'out/walk-perfect-squares';
const N = Number(process.argv[4] ?? 40);
fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ headless: true, protocolTimeout: 240000, args: ['--mute-audio', '--disable-gpu', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`${m.type()}: ${m.text()}`); });
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
// no hot reload during the walk: other topics are edited in this worktree at the same time
await page.setRequestInterception(true);
page.on('request', r => {
  if (r.url().includes('/@vite/client')) r.respond({ status: 200, contentType: 'text/javascript', body: 'export const createHotContext = () => ({ accept() {}, dispose() {}, prune() {}, invalidate() {}, on() {}, off() {}, send() {}, data: {} }); export const updateStyle = () => {}; export const removeStyle = () => {}; export const injectQuery = u => u; export class ErrorOverlay {}' });
  else r.continue();
});
let n = 0;
const sleep = s => new Promise(r => setTimeout(r, s * 1000));
async function shot(name) {
  // wait for two real frames so the screenshot is not a stale composite on a busy machine
  await page.evaluate(() => new Promise(r => { requestAnimationFrame(() => requestAnimationFrame(r)); setTimeout(r, 3000); }));
  n++; const f = path.join(out, `${String(n).padStart(2, '0')}-${name}.png`); await page.screenshot({ path: f }); console.log(f); }
async function click(text, sel = 'button') {
  const ok = await page.evaluate((text, sel) => {
    const b = [...document.querySelectorAll(sel)].find(x => x.textContent.replace(/\s+/g, ' ').trim().startsWith(text) && !x.disabled && x.offsetParent);
    if (!b) return false; b.click(); return true;
  }, text, sel);
  if (!ok) throw new Error(`no button "${text}"`);
}
async function typeNum(v) { await page.evaluate(v => { document.querySelector('.panel .ans input').value = v; }, String(v)); }

try {
  await page.goto(base, { waitUntil: 'networkidle0' });
  await page.waitForFunction('window.lessonReady');
  // 1 the question
  await sleep(3.2); await shot('question');
  await click('32'); await click('Pretty sure'); await shot('question-picked'); await click('Find out');
  // 2 worked example
  await sleep(0.8); await shot('example-start');
  await click('Tile it'); await sleep(2.9); await shot('example-tiles');
  await click('Count'); await sleep(4.6); await shot('example-count');
  await click('Check'); await sleep(5.0); await shot('example-check');
  await click('Write it'); await sleep(3.0); await shot('example-write');
  await click('Because a square root means halving'); await sleep(0.3); await shot('example-why-wrong');
  await click('Because 8 rows'); await sleep(0.3); await shot('example-why-right'); await click('Your turn');
  // 3 your turn
  await sleep(5.6); await shot('turn-ask');
  await typeNum(72); await click('Check'); await sleep(0.3); await shot('turn-count-half');
  await typeNum(12); await click('Check'); await sleep(4.8); await shot('turn-count');
  await typeNum(24); await click('Check'); await sleep(0.3); await shot('turn-check-double');
  await typeNum(144); await click('Check'); await sleep(5.6); await shot('turn-check');
  await click('12'); await click('144'); await sleep(0.4); await shot('turn-write-swap'); await sleep(1.4);
  await click('144'); await click('12'); await sleep(4.4); await shot('turn-write');
  await click('Prove it');
  // 4 prove it
  await sleep(2.8); await click('Sam is wrong'); await sleep(0.3); await shot('prove-start');
  await click('It works for 0 and for 4'); await sleep(0.3); await shot('prove-wrong-chip');
  await click('2 × 2 = 4'); await sleep(3.0); await shot('prove-1');
  await click('4 × 4 = 16'); await sleep(5.4); await shot('prove-2');
  await click('One counterexample'); await sleep(2.6); await shot('prove-3');
  await click('Practice');
  // 5 practice: right, but every third item wrong (feedback, the worked solution on the canvas, the twin)
  await sleep(1.6);
  for (let i = 0; i < N; i++) {
    const it = await page.evaluate(() => { const x = window.__practiceItem; return { fam: x.family, sg: x.subgoal, input: x.input, ans: x.answer, n: x.choices?.length ?? 0 }; });
    const wrong = i % 3 === 1;
    if (it.input === 'num') await typeNum(wrong ? it.ans.v + 1 : it.ans.v);
    else if (it.input === 'pair') {
      await page.evaluate((x, y) => { const [a, b] = document.querySelectorAll('.panel .ans input'); a.value = x; b.value = y; }, String(wrong ? it.ans.x + 1 : it.ans.x), String(wrong ? it.ans.y + 1 : it.ans.y));
    } else await page.evaluate(i => document.querySelectorAll('.panel .opts button')[i].click(), wrong ? (it.ans.i + 1) % it.n : it.ans.i);
    await sleep(1.4);
    const show = i < 3 || wrong;
    if (show) await shot(`practice-${i + 1}-${it.fam}`);
    await click('Check'); await sleep(wrong ? 7.5 : 0.5);
    if (show) await shot(`practice-${i + 1}-${it.fam}-${wrong ? 'wrong' : 'right'}`);
    await click(wrong ? 'Try one like it' : 'Next');
    await sleep(0.6);
  }
  await shot('practice-end');
  const log = await page.evaluate(() => window.mathscenesLessons.log('perfect-squares'));
  fs.writeFileSync(path.join(out, 'diagnosis-log.json'), JSON.stringify(log, null, 1));
  console.log(`diagnosis log: ${log.length} attempts, ${log.filter(a => a.mc).length} with a misconception`);
  console.log(`sub-goals answered: ${[...new Set(log.filter(a => a.part === 'practice').map(a => a.subgoal))].length}`);
} catch (e) {
  console.log('WALK FAILED:', e.message);
  await shot('failed');
} finally {
  console.log(errors.length ? `PAGE ERRORS:\n${errors.join('\n')}` : 'no page errors');
  await browser.close();
}
