// walk-linear-patterns.mjs: click through the linear-patterns lesson like a kid would (right and wrong answers) and
// screenshot every state. Headless and muted (--mute-audio, ?mute).
//   node tools/walk-linear-patterns.mjs [base url] [out dir] [practice items]
// Needs the dev server (the mathscenes-lessons launch config, port 5290).
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] ?? 'http://localhost:5290/lessons/linear-patterns.html?mute&fresh&seed=7';
const out = process.argv[3] ?? 'out/walk-linear-patterns';
const ITEMS = Number(process.argv[4] ?? 44);
fs.mkdirSync(out, { recursive: true });
for (const f of fs.readdirSync(out)) if (f.endsWith('.png')) fs.unlinkSync(path.join(out, f));
const browser = await puppeteer.launch({ headless: true, args: ['--mute-audio', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
const page = await browser.newPage();
const errors = [], warns = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); if (m.type() === 'warn') warns.push(m.text()); });
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
// ~18 lessons are built in this worktree at once: their edits make the dev server reload every open page. The walk
// replaces Vite's HMR client with a stub, so this page keeps running while files change elsewhere.
const HMR_STUB = `export const createHotContext = () => ({ data: {}, accept() {}, acceptExports() {}, dispose() {}, prune() {}, invalidate() {}, decline() {}, on() {}, off() {}, send() {} });
export const updateStyle = (id, css) => { let s = document.querySelector('style[data-vite-dev-id="' + id + '"]'); if (!s) { s = document.createElement('style'); s.setAttribute('data-vite-dev-id', id); document.head.append(s); } s.textContent = css; };
export const removeStyle = id => { document.querySelector('style[data-vite-dev-id="' + id + '"]')?.remove(); };
export const injectQuery = u => u;
export class ErrorOverlay extends HTMLElement {}`;
await page.setRequestInterception(true);
page.on('request', r => {
  if (new URL(r.url()).pathname.endsWith('/@vite/client')) r.respond({ status: 200, contentType: 'text/javascript', body: HMR_STUB });
  else r.continue();
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
const typeNum = v => page.evaluate(v => { document.querySelector('.panel .ans input').value = v; }, String(v));

try {
  await page.goto(base, { waitUntil: 'networkidle0' });
  await page.waitForFunction('window.lessonReady');
  if (process.argv[5] === 'practice') { await page.goto(base + '&open&part=4', { waitUntil: 'networkidle0' }); await page.waitForFunction('window.lessonReady'); }
  else {
  // 1. the question
  await sleep(3.4); await shot('question');
  await click('Yes: they go up $3'); await click('Certain'); await shot('question-picked'); await click('Find out');
  // 2. worked example
  await sleep(0.8); await shot('example-start');
  await click('Find the changes'); await sleep(4.2); await shot('example-changes');
  await click('Check'); await sleep(2.4); await shot('example-check');
  await click('Plot'); await sleep(6.4); await shot('example-plot');
  await click('Compare'); await sleep(5.6); await shot('example-compare');
  await click('His savings go up'); await sleep(0.3); await shot('example-why-wrong');
  await click('Each step right'); await sleep(0.3); await shot('example-why-right'); await click('Your turn');
  // 3. your turn
  await sleep(13.5); await shot('turn-ask');
  await typeNum(6); await click('Check'); await sleep(0.3); await shot('turn-unit-wrong');
  await typeNum(3); await click('Check'); await sleep(9.0); await shot('turn-unit');
  await click('16 gallons'); await click('down 3'); await sleep(0.3); await shot('turn-chips-wrong'); await sleep(1.4);
  await click('40 gallons'); await click('down 3'); await sleep(3.4); await shot('turn-rule');
  await click('Yes, it could be linear'); await sleep(1.8); await shot('turn-done');
  await click('Prove it');
  // 4. prove it
  await sleep(5.2); await shot('prove-intro');
  await click('Riley is wrong'); await sleep(0.3); await shot('prove-start');
  await click('It is made of straight'); await sleep(0.3); await shot('prove-wrong-chip');
  await click('The days are 0'); await sleep(2.6); await shot('prove-1');
  await click('3 − 1 = 2'); await sleep(3.4); await shot('prove-2');
  await click('One step with'); await sleep(5.2); await shot('prove-3');
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
    else if (it.input === 'pair') await page.evaluate((x, y) => { const [a, b] = document.querySelectorAll('.panel .ans input'); a.value = x; b.value = y; }, String(wrong ? it.ans.y : it.ans.x), String(wrong ? it.ans.x : it.ans.y));
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
  const log = await page.evaluate(() => window.mathscenesLessons.log('linear-patterns'));
  fs.writeFileSync(path.join(out, 'diagnosis-log.json'), JSON.stringify(log, null, 1));
  console.log(`diagnosis log: ${log.length} attempts, ${log.filter(a => a.mc).length} with a misconception`);
  console.log(`families seen: ${[...seen].join(', ')}`);
} finally {
  console.log(errors.length ? `PAGE ERRORS:\n${errors.join('\n')}` : 'no page errors');
  if (warns.length) console.log(`WARNINGS:\n${[...new Set(warns)].join('\n')}`);
  await browser.close();
}
