// walk-expand-and-factor.mjs: click through the lesson like a kid would (right and wrong answers), screenshot every state.
//   node tools/walk-expand-and-factor.mjs [base url] [out dir] [practice items]
// Needs the dev server (port 5290). Headless, ALWAYS muted (--mute-audio and ?mute).
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] ?? 'http://localhost:5290/lessons/expand-and-factor.html?mute&fresh&seed=7';
const out = process.argv[3] ?? 'out/walk-expand-and-factor';
const N = Number(process.argv[4] ?? 72);
fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ headless: true, args: ['--mute-audio', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
const page = await browser.newPage();
// many agents edit the worktree at once: Vite's HMR would reload the page mid-walk. Give its socket a dummy.
await page.evaluateOnNewDocument(() => {
  const WS = window.WebSocket;
  const Fake = function (url, proto) {
    if (String(proto ?? '').includes('vite')) return { addEventListener() {}, removeEventListener() {}, send() {}, close() {}, readyState: 0 };
    return new WS(url, proto);
  };
  Fake.prototype = WS.prototype; Object.assign(Fake, { CONNECTING: 0, OPEN: 1, CLOSING: 2, CLOSED: 3 });
  window.WebSocket = Fake;
});
let navs = 0;
page.on('framenavigated', f => { if (f === page.mainFrame() && ++navs > 1) console.log('PAGE RELOADED (HMR?)'); });
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
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
async function typePair(x, y) {
  await page.evaluate((x, y) => { const [a, b] = document.querySelectorAll('.panel .ans input'); a.value = x; b.value = y; }, String(x), String(y));
}
async function typeNum(v) { await page.evaluate(v => { document.querySelector('.panel .ans input').value = v; }, String(v)); }

try {
  await page.goto(base, { waitUntil: 'networkidle0' });
  await page.waitForFunction('window.lessonReady');
  await sleep(4.4); await shot('question');
  await click('4x + 3'); await click('Pretty sure'); await shot('question-picked'); await click('Find out');
  // worked example
  await sleep(0.8); await shot('example-start');
  await click('Build'); await sleep(4.6); await shot('example-build');
  await click('Split'); await sleep(4.8); await shot('example-split');
  await click('Count'); await sleep(5.2); await shot('example-count');
  await click('Both ways'); await sleep(5.6); await shot('example-both');
  await click('The 4 only'); await sleep(1.0); await shot('example-why-wrong');
  await click('Each of the 4 rows'); await sleep(0.3); await click('Your turn');
  // your turn
  await sleep(8.6); await shot('turn-ask');
  await typePair(6, 5); await click('Check'); await sleep(1.2); await shot('turn-partial');
  await typePair(6, 15); await click('Check'); await sleep(4.4); await shot('turn-area');
  await click('Commutative'); await sleep(0.4); await shot('turn-name-wrong');
  await click('Distributive'); await sleep(2.6); await shot('turn-name');
  await typeNum(6); await click('Check'); await sleep(0.4); await shot('turn-back-wrong');
  await typeNum(3); await click('Check'); await sleep(3.0); await shot('turn-back');
  await click('Prove it');
  // prove it
  await sleep(3.0); await shot('prove-start'); await click('Riley is wrong'); await sleep(0.3);
  await click('PEMDAS'); await sleep(0.3); await shot('prove-wrong-chip');
  await click('The 2 multiplies'); await sleep(2.8); await shot('prove-1');
  await click('Put in 0'); await sleep(2.8); await shot('prove-2');
  await click('Equivalent means'); await sleep(5.0); await shot('prove-3');
  await click('Practice');
  // practice: right, but every third item wrong (to see the feedback, the worked solution and the twin)
  await sleep(1.5);
  const seen = new Set(), seenWrong = new Set();
  for (let i = 0; i < N; i++) {
    const it = await page.evaluate(() => { const x = window.__practiceItem; return { fam: x.family, sg: x.subgoal, input: x.input, ans: x.answer, n: (x.choices ?? []).length }; });
    const wrong = i % 3 === 1;
    if (it.input === 'pair') await typePair(wrong ? it.ans.x + 1 : it.ans.x, it.ans.y);
    else if (it.input === 'num') await typeNum(wrong ? it.ans.v + 1 : it.ans.v);
    else await page.evaluate(i => document.querySelectorAll('.panel .opts button')[i].click(), wrong ? (it.ans.i + 1) % it.n : it.ans.i);
    // a shot of the first item of every family, and of the first miss of every family (feedback + worked solution)
    const snap = !seen.has(it.fam) || (wrong && !seenWrong.has(it.fam));
    seen.add(it.fam); if (wrong) seenWrong.add(it.fam);
    await sleep(1.0);
    if (snap) await shot(`practice-${i + 1}-${it.fam}`);
    await click('Check'); await sleep(wrong ? 5.0 : 0.6);
    if (snap) await shot(`practice-${i + 1}-${it.fam}-${wrong ? 'wrong' : 'right'}`);
    await click(wrong ? 'Try one like it' : 'Next');
    await sleep(1.2);
  }
  await shot('practice-end');
  const log = await page.evaluate(() => window.mathscenesLessons.log('expand-and-factor'));
  fs.writeFileSync(path.join(out, 'diagnosis-log.json'), JSON.stringify(log, null, 1));
  console.log(`diagnosis log: ${log.length} attempts, ${log.filter(a => a.mc).length} with a misconception`);
} catch (e) {
  console.log('WALK FAILED:', e.message);
  await shot('failure');
} finally {
  console.log(errors.length ? `PAGE ERRORS:\n${errors.join('\n')}` : 'no page errors');
  await browser.close();
}
