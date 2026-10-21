// walk-angle-relationships.mjs: click through the angle-relationships lesson like a kid would (right and wrong
// answers) and screenshot every state.   node tools/walk-angle-relationships.mjs [base url] [out dir]
// Env: FROM=0..4 (start at a part), N=practice items (default 30), WRONG=k (every k-th practice answer wrong, 3),
// SHOT_FROM=i (screenshots from practice item i on).
// Needs the dev server (port 5290). Headless, ALWAYS muted (--mute-audio and ?mute).
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const FROM = Number(process.env.FROM ?? 0);
const N = Number(process.env.N ?? 30), WRONG = Number(process.env.WRONG ?? 3), SHOT_FROM = Number(process.env.SHOT_FROM ?? 0);
const base = process.argv[2] ?? `http://localhost:5290/lessons/angle-relationships.html?mute&fresh&seed=7${FROM ? `&open&part=${FROM}` : ''}`;
const out = process.argv[3] ?? 'out/walk-angle-relationships';
fs.mkdirSync(out, { recursive: true });
for (const f of fs.readdirSync(out)) if (f.endsWith('.png')) fs.unlinkSync(path.join(out, f));
const browser = await puppeteer.launch({ headless: true, args: ['--mute-audio', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`${m.type()}: ${m.text()}`); });
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
async function type(v) { await page.evaluate(v => { const i = document.querySelector('.panel .ans input'); i.value = v; }, String(v)); }

try {
  await page.goto(base, { waitUntil: 'networkidle0' });
  await page.waitForFunction('window.lessonReady');
  if (FROM <= 0) {
    await sleep(3.2); await shot('question');
    await click('115°'); await click('Pretty sure'); await shot('question-picked'); await click('Find out');
  }
  if (FROM <= 1) {
    await sleep(0.8); await shot('example-start');
    await click('Read them'); await sleep(4.0); await shot('example-read');
    await click('Name it'); await sleep(3.4); await shot('example-pair');
    await click('Solve it'); await sleep(3.8); await shot('example-solve');
    await click('Go across'); await sleep(9.6); await shot('example-across');
    await click('They are next to each other'); await sleep(0.3); await shot('example-why-wrong');
    await click('OA and OC are opposite'); await sleep(0.6); await shot('example-why-right'); await click('Your turn');
  }
  if (FROM <= 2) {
    await sleep(8.4); await shot('turn-ask-x');
    await type(38); await click('Check'); await sleep(0.3); await shot('turn-x-wrong');
    await type(142); await click('Check'); await sleep(2.2); await shot('turn-ask-y');
    await click('142°'); await sleep(0.3); await shot('turn-y-wrong');
    await click('38°'); await sleep(3.4); await shot('turn-y-leader');
    await sleep(3.8); await shot('turn-callback');
    await click('Prove it');
  }
  if (FROM <= 3) {
    await sleep(2.0); await shot('prove-start');
    await click('Not proved yet'); await sleep(1.8); await shot('prove-table');
    await click('I measured them'); await sleep(0.3); await shot('prove-wrong-chip');
    await click('Linear pair: OA'); await sleep(2.4); await shot('prove-1');
    await click('Both sums'); await sleep(0.3); await shot('prove-wrong-row');
    await click('Linear pair: OB'); await sleep(2.4); await shot('prove-2');
    await click('Both sums'); await sleep(2.4); await shot('prove-3');
    await click('Subtract'); await sleep(4.0); await shot('prove-4');
    await sleep(3.6); await shot('prove-swing');
    await click('Practice');
  }
  // practice: right, but every WRONG-th item wrong (feedback, the worked solution on the board, the twin)
  await sleep(1.4);
  for (let i = 0; i < N; i++) {
    const it = await page.evaluate(() => { const x = window.__practiceItem; return { fam: x.family, sg: x.subgoal, input: x.input, ans: x.answer, n: (x.choices ?? []).length }; });
    const wrong = WRONG > 0 && i % WRONG === 1;
    if (it.input === 'num') await type(wrong ? it.ans.v + 10 : it.ans.v);
    else await page.evaluate(i => document.querySelectorAll('.panel .opts button')[i].click(), wrong ? (it.ans.i + 1) % it.n : it.ans.i);
    await sleep(0.9);
    const keep = i >= SHOT_FROM && (i < SHOT_FROM + 26 || wrong);
    if (keep) await shot(`practice-${i + 1}-${it.fam}`);
    await click('Check'); await sleep(wrong ? 3.6 : 0.4);
    if (keep && wrong) await shot(`practice-${i + 1}-${it.fam}-wrong`);
    await click(wrong ? 'Try one like it' : 'Next');
    await sleep(0.9);
  }
  await shot('practice-end');
  const log = await page.evaluate(() => window.mathscenesLessons.log('angle-relationships'));
  fs.writeFileSync(path.join(out, 'diagnosis-log.json'), JSON.stringify(log, null, 1));
  console.log(`diagnosis log: ${log.length} attempts, ${log.filter(a => a.mc).length} with a misconception`);
} catch (e) {
  console.log('WALK FAILED:', e.message);
  await shot('failed');
} finally {
  console.log(errors.length ? `PAGE ERRORS:\n${errors.join('\n')}` : 'no page errors');
  await browser.close();
}
