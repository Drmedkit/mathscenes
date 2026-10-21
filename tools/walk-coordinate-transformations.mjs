// walk-coordinate-transformations.mjs: click through the coordinate-transformations lesson like a kid would (right and
// wrong answers) and screenshot every state. Headless and muted (--mute-audio, ?mute).
//   node tools/walk-coordinate-transformations.mjs [base url] [out dir] [practice items] [practice]
// Needs the dev server (the mathscenes-lessons launch config, port 5290).
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] ?? 'http://localhost:5290/lessons/coordinate-transformations.html?mute&fresh&seed=7';
const out = process.argv[3] ?? 'out/walk-coordinate-transformations';
const ITEMS = Number(process.argv[4] ?? 46);
fs.mkdirSync(out, { recursive: true });
for (const f of fs.readdirSync(out)) if (f.endsWith('.png')) fs.unlinkSync(path.join(out, f));
const browser = await puppeteer.launch({ headless: true, args: ['--mute-audio', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
const page = await browser.newPage();
const errors = [], warns = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); if (m.type() === 'warn') warns.push(m.text()); });
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
// other topics are built in this worktree at the same time: their edits make Vite reload every open page, which
// would reset a ?fresh walk. The walk switches off the HMR socket (the page itself is unchanged).
await page.evaluateOnNewDocument(() => {
  const WS = window.WebSocket;
  window.WebSocket = function (url, proto) {
    if (String(proto).includes('vite-hmr')) return { addEventListener() {}, removeEventListener() {}, send() {}, close() {}, readyState: 0 };
    return new WS(url, proto);
  };
});
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
const typePair = (x, y) => page.evaluate((x, y) => { const [a, b] = document.querySelectorAll('.panel .ans input'); a.value = x; b.value = y; }, String(x), String(y));
const typeNum = v => page.evaluate(v => { document.querySelector('.panel .ans input').value = v; }, String(v));

try {
  await page.goto(base, { waitUntil: 'networkidle0' });
  await page.waitForFunction('window.lessonReady');
  if (process.argv[5] === 'practice') { await page.goto(base + '&open&part=4', { waitUntil: 'networkidle0' }); await page.waitForFunction('window.lessonReady'); }
  else {
  // 1. the question
  await sleep(4.2); await shot('question');
  await click('(−6, 8)'); await click('Certain'); await shot('question-picked'); await click('Find out');
  // 2. worked example
  await sleep(0.8); await shot('example-start');
  await click('Slide it'); await sleep(4.0); await shot('example-move');
  await click('Follow A'); await sleep(5.2); await shot('example-one');
  await click('Do B and C'); await sleep(5.0); await shot('example-every');
  await click('Write it'); await sleep(3.4); await shot('example-rule');
  await click('Every move changes'); await sleep(0.3); await shot('example-why-wrong');
  await click('Right is across'); await sleep(0.3); await shot('example-why-right'); await click('Your turn');
  // 3. your turn
  await sleep(17.5); await shot('turn-ask');
  await typePair(-3, 2); await click('Check'); await sleep(0.3); await shot('turn-image-wrong');
  await typePair(3, -2); await click('Check'); await sleep(6.6); await shot('turn-image');
  await click('x', '.chips button'); await click('−y', '.chips button'); await sleep(0.3); await shot('turn-chips-wrong'); await sleep(1.4);
  await click('−x', '.chips button'); await click('y', '.chips button'); await sleep(3.2); await shot('turn-rule');
  await click('Prove it');
  // 4. prove it
  await sleep(4.6); await shot('prove-intro');
  await click('Jordan is wrong'); await sleep(0.3); await shot('prove-start');
  await click('Across the x-axis, so'); await sleep(0.3); await shot('prove-wrong-chip');
  await click('The x-axis is horizontal'); await sleep(2.6); await shot('prove-1');
  await click('Moving straight'); await sleep(2.2); await shot('prove-2');
  await click('K is 3 below'); await sleep(6.2); await shot('prove-3');
  await click('Practice');
  }
  // 5. practice: right, but every third item wrong (feedback, worked solution, twin); a shot of each family's first item
  await sleep(1.6);
  // other lessons are built in the same worktree: a dev-server reload can restart the page; then reopen practice
  const mark = () => page.evaluate(() => { window.__walk = 1; });
  await mark();
  const seen = new Set();
  for (let i = 0; i < ITEMS; i++) {
    if (!(await page.evaluate(() => window.__walk === 1 && !!window.__practiceItem))) {
      console.log('page reloaded: reopening practice');
      await page.goto(base.replace('&fresh', '') + '&open&part=4', { waitUntil: 'networkidle0' });
      await page.waitForFunction('window.lessonReady'); await sleep(1.2); await mark();
    }
    const it = await page.evaluate(() => { const x = window.__practiceItem; return { fam: x.family, input: x.input, ans: x.answer, n: (x.choices ?? []).length }; });
    const wrong = i % 3 === 1;
    if (it.input === 'num') await typeNum(wrong ? it.ans.v + 1 : it.ans.v);
    else if (it.input === 'pair') await page.evaluate((x, y) => { const [a, b] = document.querySelectorAll('.panel .ans input'); a.value = x; b.value = y; }, String(wrong ? it.ans.x + 1 : it.ans.x), String(it.ans.y));
    else await page.evaluate(i => document.querySelectorAll('.panel .opts button')[i].click(), wrong ? (it.ans.i + 1) % it.n : it.ans.i);
    await sleep(1.6);
    const first = !seen.has(it.fam); seen.add(it.fam);
    if (first) await shot(`practice-${i + 1}-${it.fam}`);
    await click('Check'); await sleep(wrong ? 6.5 : 0.5);
    if (wrong) await shot(`practice-${i + 1}-${it.fam}-wrong`);
    await click(wrong ? 'Try one like it' : 'Next');
    await sleep(0.4);
  }
  await sleep(1.2); await shot('practice-end');
  const log = await page.evaluate(() => window.mathscenesLessons.log('coordinate-transformations'));
  fs.writeFileSync(path.join(out, 'diagnosis-log.json'), JSON.stringify(log, null, 1));
  console.log(`diagnosis log: ${log.length} attempts, ${log.filter(a => a.mc).length} with a misconception`);
  console.log(`families seen: ${[...seen].join(', ')}`);
} finally {
  console.log(errors.length ? `PAGE ERRORS:\n${errors.join('\n')}` : 'no page errors');
  if (warns.length) console.log(`WARNINGS:\n${[...new Set(warns)].join('\n')}`);
  await browser.close();
}
