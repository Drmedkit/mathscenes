// walk-proportional-relationships.mjs: click through the lesson like a kid would (right and wrong answers), screenshot
// every state.   node tools/walk-proportional-relationships.mjs [base url] [out dir]
// Needs the dev server (port 5290). Headless, ALWAYS muted (--mute-audio and ?mute).
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] ?? 'http://localhost:5290/lessons/proportional-relationships.html?mute&fresh&seed=7';
const out = process.argv[3] ?? 'out/walk-proportional-relationships';
fs.mkdirSync(out, { recursive: true });
for (const f of fs.readdirSync(out)) if (f.endsWith('.png')) fs.unlinkSync(path.join(out, f));
const browser = await puppeteer.launch({ headless: true, args: ['--mute-audio', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error' || /render failed|too wide/.test(m.text())) errors.push(m.text()); });
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
// other topics are edited in the same worktree while we walk: stub Vite's HMR client so a full reload can't reset us
await page.setRequestInterception(true);
page.on('request', r => {
  if (/\/@vite\/client(\?|$)/.test(r.url())) {
    r.respond({ status: 200, contentType: 'application/javascript', body: 'export const createHotContext = () => ({ accept() {}, dispose() {}, prune() {}, on() {}, off() {}, send() {}, invalidate() {}, data: {} }); export const updateStyle = () => {}; export const removeStyle = () => {}; export const injectQuery = u => u;' });
  } else r.continue();
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
async function typeNum(v) { await page.evaluate(v => { document.querySelector('.panel .ans input').value = v; }, String(v)); }
async function typePair(x, y) { await page.evaluate((x, y) => { const [a, b] = document.querySelectorAll('.panel .ans input'); a.value = x; b.value = y; }, String(x), String(y)); }

await page.goto(base, { waitUntil: 'networkidle0' });
await page.waitForFunction('window.lessonReady');
// 1. the question
await sleep(2.6); await shot('question');
await click('A'); await click('Pretty sure'); await sleep(0.5); await shot('question-picked'); await click('Find out');
// 2. worked example
await sleep(0.8); await shot('example-start');
await click('Plot the rows'); await sleep(4.0); await shot('example-plot');
await click('Divide'); await sleep(5.6); await shot('example-divide');
await click('Find k'); await sleep(3.2); await shot('example-k');
await click('Write the rule'); await sleep(5.6); await shot('example-rule');
await click('If two rows agree'); await sleep(0.4); await shot('example-why-wrong');
await click('One row with a different rate'); await sleep(0.3); await click('Your turn');
// 3. your turn
await page.waitForSelector('.panel .ans input', { timeout: 20000 }); await sleep(1.2); await shot('turn-ask-divide');
await typeNum('0.29'); await click('Check'); await sleep(0.3); await shot('turn-divide-flipped');
await typeNum('3.5'); await click('Check'); await sleep(2.2); await shot('turn-divide-ok');
await typePair(3.5, 1); await click('Check'); await sleep(0.3); await shot('turn-unit-swapped');
await typePair(1, 3.5); await click('Check'); await sleep(3.2); await shot('turn-unit-ok');
await click('c = g + 3.5', '.opts button'); await sleep(0.3); await shot('turn-write-wrong');
await click('c = 3.5g', '.opts button'); await sleep(4.6); await shot('turn-write-ok');
await click('Divide: 0 ÷ 0'); await sleep(0.3); await shot('turn-zero-wrong');
await click('Multiply: 3.5'); await sleep(2.2); await shot('turn-zero-ok');
await click('Prove it');
// 4. prove it
await sleep(2.6); await click('Riley is wrong'); await sleep(0.3); await shot('prove-start');
await click('Doubling 1 pound'); await sleep(0.3); await shot('prove-wrong-chip');
await click('3 ÷ 1 = 3'); await sleep(3.0); await shot('prove-1');
await click('10 ÷ 4'); await sleep(3.6); await shot('prove-2');
await click('One row that breaks'); await sleep(2.2); await shot('prove-3');
await click('Practice');
// 5. practice: mostly right, every third wrong (feedback, worked solution, twin); shots of new families + wrongs
await sleep(1.5);
const famShot = new Set();
for (let i = 0; i < 70; i++) {
  const it = await page.evaluate(() => { const x = window.__practiceItem; return { fam: x.family, sg: x.subgoal, input: x.input, ans: x.answer, n: (x.choices ?? []).length }; });
  const wrong = i % 3 === 1;
  if (it.input === 'num') await typeNum(wrong ? it.ans.v + 1 : it.ans.v);
  else if (it.input === 'pair') await typePair(wrong ? it.ans.y : it.ans.x, wrong ? it.ans.x : it.ans.y);
  else await page.evaluate(i => document.querySelectorAll('.panel .opts button')[i].click(), wrong ? (it.ans.i + 1) % it.n : it.ans.i);
  await sleep(1.1);
  const want = !famShot.has(it.fam) || (wrong && i < 30);
  if (want) await shot(`practice-${i + 1}-${it.fam}`);
  await click('Check'); await sleep(wrong ? 4.0 : 0.5);
  if (want) { await shot(`practice-${i + 1}-${it.fam}-${wrong ? 'wrong' : 'right'}`); famShot.add(it.fam); }
  const more = await page.evaluate(() => [...document.querySelectorAll('.panel button')].some(b => /^(Next|Try one like it)/.test(b.textContent.trim())));
  if (!more) break;
  await page.evaluate(() => [...document.querySelectorAll('.panel button')].find(b => /^(Next|Try one like it)/.test(b.textContent.trim())).click());
  await sleep(1.0);
}
await shot('practice-end');
const log = await page.evaluate(() => window.mathscenesLessons.log('proportional-relationships'));
fs.writeFileSync(path.join(out, 'diagnosis-log.json'), JSON.stringify(log, null, 1));
const parts = {}; for (const a of log) parts[a.part] = (parts[a.part] ?? 0) + 1;
console.log(`diagnosis log: ${log.length} attempts (${JSON.stringify(parts)}), ${log.filter(a => a.mc).length} with a misconception; families shot: ${[...famShot].join(', ')}`);
console.log(errors.length ? `PAGE ERRORS:\n${errors.join('\n')}` : 'no page errors');
await browser.close();
