// walk-percent-change.mjs: click through the percent-change lesson like a kid would (right and wrong answers),
// screenshot every state.   node tools/walk-percent-change.mjs [base url] [out dir]
// Needs the dev server (port 5290). Headless, ALWAYS muted (--mute-audio and ?mute).
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] ?? 'http://localhost:5290/lessons/percent-change.html?mute&fresh&seed=7';
const out = process.argv[3] ?? 'out/walk-percent-change';
fs.mkdirSync(out, { recursive: true });
for (const f of fs.readdirSync(out)) if (f.endsWith('.png')) fs.unlinkSync(path.join(out, f));
const browser = await puppeteer.launch({ headless: true, args: ['--mute-audio', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
// other topics are built in the same worktree: without the HMR client their edits cannot reload this page mid-walk
await page.setRequestInterception(true);
page.on('request', r => (r.url().includes('/@vite/client') ? r.abort() : r.continue()));
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

await page.goto(base, { waitUntil: 'networkidle0' });
await page.waitForFunction('window.lessonReady');
await sleep(3.4); await shot('question');
await click('20%'); await click('Pretty sure'); await shot('question-picked'); await click('Find out');
// worked example
await sleep(0.8); await shot('example-start');
await click('Mark the base'); await sleep(5.0); await shot('example-base');
await click('Find the change'); await sleep(4.4); await shot('example-change');
await click('Compare'); await sleep(5.2); await shot('example-compare');
await click('Name it'); await sleep(4.6); await shot('example-name');
await click('You always divide'); await sleep(0.3); await shot('example-why-wrong');
await click('The change is compared'); await sleep(0.3); await click('Your turn');
// your turn
await sleep(9.6); await shot('turn-ask');
await typeNum(25); await click('Check'); await sleep(0.3); await shot('turn-new-base');
await typeNum(20); await click('Check'); await sleep(5.6); await shot('turn-percent');
await click('an 80% decrease'); await sleep(0.3); await shot('turn-name-wrong');
await click('a 20% decrease'); await sleep(3.6); await shot('turn-done');
await click('Prove it');
// prove it
await sleep(3.0); await click('Sam is wrong'); await sleep(0.3); await shot('prove-start');
await click('The bigger number'); await sleep(0.3); await shot('prove-wrong-chip');
await click('$50 − $40'); await sleep(3.6); await shot('prove-1');
await click('A percent change is compared'); await sleep(3.2); await shot('prove-2');
await click('$10 is one of 5'); await sleep(7.0); await shot('prove-3');
await click('Practice');
// practice: right, but every third item wrong (feedback, the worked solution on the canvas, the twin)
await sleep(1.5);
const fams = new Set();
for (let i = 0; i < 48; i++) {
  const it = await page.evaluate(() => { const x = window.__practiceItem; return { fam: x.family, input: x.input, ans: x.answer, n: (x.choices ?? []).length }; });
  fams.add(it.fam);
  const wrong = i % 3 === 1;
  if (it.input === 'num') await typeNum(wrong ? it.ans.v + 1 : it.ans.v);
  else if (it.input === 'pair') await page.evaluate((x, y) => { const [a, b] = document.querySelectorAll('.panel .ans input'); a.value = x; b.value = y; }, String(wrong && it.ans.x !== it.ans.y ? it.ans.y : it.ans.x), String(wrong ? (it.ans.x !== it.ans.y ? it.ans.x : it.ans.y + 1) : it.ans.y));
  else await page.evaluate(i => document.querySelectorAll('.panel .opts button')[i].click(), wrong ? (it.ans.i + 1) % it.n : it.ans.i);
  await sleep(0.9);
  const keep = i < 3 || (wrong && i < 40);
  if (keep) await shot(`practice-${i + 1}-${it.fam}`);
  await click('Check'); await sleep(wrong ? 5.5 : 0.6);
  if (keep) await shot(`practice-${i + 1}-${it.fam}-${wrong ? 'wrong' : 'right'}`);
  await click(wrong ? 'Try one like it' : 'Next');
  await sleep(1.4);
}
await shot('practice-end');
const log = await page.evaluate(() => window.mathscenesLessons.log('percent-change'));
fs.writeFileSync(path.join(out, 'diagnosis-log.json'), JSON.stringify(log, null, 1));
console.log(`families seen: ${fams.size} (${[...fams].join(', ')})`);
console.log(`diagnosis log: ${log.length} attempts, ${log.filter(a => a.mc).length} with a misconception`);
console.log(errors.length ? `PAGE ERRORS:\n${errors.join('\n')}` : 'no page errors');
await browser.close();
