// walk-irrational-numbers.mjs: click through the rational / irrational numbers lesson like a kid would (right and
// wrong answers) and screenshot every state.
//   node tools/walk-irrational-numbers.mjs [base url] [out dir] [practice items]
// Needs the dev server (port 5290). Headless, ALWAYS muted (--mute-audio and ?mute).
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] || 'http://localhost:5290/lessons/irrational-numbers.html?mute&fresh&seed=7';
const out = process.argv[3] || 'out/walk-irrational-numbers';
const N = Number(process.argv[4] ?? 50);
const ONLY = process.env.ONLY ?? '';          // 'practice' skips parts 1-4 (?part=4&open)
fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ headless: true, protocolTimeout: 240000, args: ['--mute-audio', '--disable-gpu', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
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
async function shot(name) {
  // wait for two real frames so the screenshot is not a stale composite on a busy machine
  await page.evaluate(() => new Promise(r => { requestAnimationFrame(() => requestAnimationFrame(r)); setTimeout(r, 3000); }));
  n++; const f = path.join(out, `${String(n).padStart(2, '0')}-${name}.png`); await page.screenshot({ path: f }); console.log(f);
}
async function click(text, sel = 'button') {
  const ok = await page.evaluate((text, sel) => {
    const b = [...document.querySelectorAll(sel)].find(x => x.textContent.replace(/\s+/g, ' ').trim().startsWith(text) && !x.disabled && x.offsetParent);
    if (!b) return false; b.click(); return true;
  }, text, sel);
  if (!ok) throw new Error(`no button "${text}"`);
}
async function typePair(x, y) { await page.evaluate((x, y) => { const [a, b] = document.querySelectorAll('.panel .ans input'); a.value = x; b.value = y; }, String(x), String(y)); }

try {
  await page.goto(ONLY === 'practice' ? base + '&part=4&open' : base, { waitUntil: 'networkidle0' });
  await page.waitForFunction('window.lessonReady');
  if (ONLY !== 'practice') {
    // 1 the question
    await sleep(4.4); await shot('question');
    await click('Exactly 2'); await click('Pretty sure'); await shot('question-picked'); await click('Find out');
    // 2 worked example
    await sleep(1.6); await shot('example-start');
    await click('Bracket'); await sleep(4.6); await shot('example-bracket');
    await click('Zoom'); await sleep(6.2); await shot('example-tenths');
    await click('Zoom again'); await sleep(6.2); await shot('example-hundredths');
    await click('Read it'); await sleep(6.0); await shot('example-read');
    await click('2 is a third'); await sleep(0.4); await shot('example-why-wrong');
    await click('1.4² = 1.96'); await sleep(0.4); await shot('example-why-right'); await click('Your turn');
    // 3 your turn
    await sleep(4.4); await shot('turn-ask');
    await typePair(3.2, 3.3); await click('Check'); await sleep(0.4); await shot('turn-tenths-close');
    await typePair(3.1, 3.2); await click('Check'); await sleep(6.0); await shot('turn-tenths');
    await typePair(3.16, 3.17); await click('Check'); await sleep(6.0); await shot('turn-hundredths');
    await click('='); await click('3.2'); await sleep(0.4); await shot('turn-round-equal'); await sleep(1.8);
    await click('≈'); await click('3.2'); await sleep(4.4); await shot('turn-round');
    await click('Prove it');
    // 4 prove it
    await sleep(3.0); await click('Ava is wrong'); await sleep(0.4); await shot('prove-start');
    await click('10x − x'); await sleep(1.6); await shot('prove-wrong-shift');
    await click('A decimal that never ends'); await sleep(0.4); await shot('prove-wrong-chip');
    await sleep(4.0);
    await click('Multiplying by 100'); await sleep(4.6); await shot('prove-1');
    await click('The repeating tails'); await sleep(5.6); await shot('prove-2');
    await click('A rational number is'); await sleep(4.6); await shot('prove-3');
    await click('Practice');
  }
  // 5 practice: right, but every third item wrong (feedback, the worked solution on the canvas, the twin)
  await sleep(1.8);
  for (let i = 0; i < N; i++) {
    const it = await page.evaluate(() => { const x = window.__practiceItem; return { fam: x.family, sg: x.subgoal, input: x.input, ans: x.answer, n: x.choices?.length ?? 0 }; });
    const wrong = i % 3 === 1;
    if (it.input === 'num') await page.evaluate(v => { document.querySelector('.panel .ans input').value = v; }, String(wrong ? it.ans.v + 1 : it.ans.v));
    else if (it.input === 'pair') await typePair(wrong ? it.ans.x + 1 : it.ans.x, it.ans.y);
    else if (it.input === 'frac') await page.evaluate((nn, d) => { const ins = document.querySelectorAll('.panel .ans input'); ins[ins.length - 2].value = nn; ins[ins.length - 1].value = d; }, String(wrong ? it.ans.n + 1 : it.ans.n), String(it.ans.d));
    else await page.evaluate(i => document.querySelectorAll('.panel .opts button')[i].click(), wrong ? (it.ans.i + 1) % it.n : it.ans.i);
    await sleep(1.6);
    const show = i < 2 || wrong;
    if (show) await shot(`practice-${i + 1}-${it.sg}-${it.fam}`);
    await click('Check'); await sleep(wrong ? 9 : 0.5);
    if (show && wrong) await shot(`practice-${i + 1}-${it.sg}-${it.fam}-wrong`);
    await click(wrong ? 'Try one like it' : 'Next');
    await sleep(0.6);
  }
  await shot('practice-end');
  const log = await page.evaluate(() => window.mathscenesLessons.log('irrational-numbers'));
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
