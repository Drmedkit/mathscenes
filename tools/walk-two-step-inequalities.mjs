// walk-two-step-inequalities.mjs: click through the two-step inequalities lesson like a kid would (right and wrong
// answers) and screenshot every state.   node tools/walk-two-step-inequalities.mjs [base url] [out dir]
// Needs the dev server (port 5290). Headless, ALWAYS muted (--mute-audio and ?mute).
// WALK_ONLY=practice skips to practice; WALK_N sets the number of practice items.
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] ?? 'http://localhost:5290/lessons/two-step-inequalities.html?mute&fresh&seed=7';
const out = process.argv[3] ?? 'out/walk-two-step-inequalities';
const only = process.env.WALK_ONLY ?? '';
const N = Number(process.env.WALK_N ?? 45);
fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ headless: true, args: ['--mute-audio', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error' || (m.type() === 'warn' && /voice line|render failed/.test(m.text()))) errors.push(m.text()); });
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
async function typeNum(v) { await page.evaluate(v => { const i = document.querySelector('.panel .ans input'); i.value = v; }, String(v)); }

try {
  if (only !== 'practice') {
    await page.goto(base, { waitUntil: 'networkidle0' });
    await page.waitForFunction('window.lessonReady');
    await sleep(4.0); await shot('question');
    await click('h < 7'); await click('Pretty sure'); await shot('question-picked'); await click('Find out');
    // worked example
    await sleep(0.8); await shot('example-start');
    await click('Read it'); await sleep(3.4); await shot('example-read');
    await click('Subtract 50'); await sleep(6.6); await shot('example-subtract');
    await click('Divide'); await sleep(9.0); await shot('example-divide');
    await click('Test'); await sleep(5.6); await shot('example-test');
    await click('Because the problem'); await sleep(0.3); await shot('example-why-wrong');
    await click('Dividing by'); await sleep(0.3); await click('Your turn');
    // your turn
    await sleep(12.5); await shot('turn-land');
    await typeNum(5); await click('Check'); await sleep(0.3); await shot('turn-land-wrong');
    await typeNum(-5); await click('Check'); await sleep(4.6); await shot('turn-arrows');
    await click('x ≤'); await sleep(0.3); await shot('turn-set-wrong');
    await click('x ≥'); await sleep(5.2); await shot('turn-set');
    await typeNum(-17); await click('Check'); await sleep(0.3);
    await typeNum(25); await click('Check'); await sleep(9.5); await shot('turn-test');
    await click('Prove it');
    // prove it
    await sleep(3.6); await shot('prove-intro'); await click('Jordan is wrong'); await sleep(0.3); await shot('prove-start');
    await click('−6 and −11'); await sleep(0.3); await shot('prove-wrong-chip');
    await click('Adding slides'); await sleep(6.0); await shot('prove-1');
    await click('2 is positive'); await sleep(8.5); await shot('prove-2');
    await click('−5 is in'); await sleep(5.0); await shot('prove-3');
    await click('Practice');
  } else {
    await page.goto(base + '&part=4&open', { waitUntil: 'networkidle0' });
    await page.waitForFunction('window.lessonReady');
  }
  // practice: right, but every third item wrong (feedback, the worked solution and the twin)
  await sleep(2.0);
  for (let i = 0; i < N; i++) {
    const it = await page.evaluate(() => { const x = window.__practiceItem; return { fam: x.family, sg: x.subgoal, input: x.input, ans: x.answer, k: (x.choices || []).length, pic: x.picture ? x.picture.kind : '' }; });
    const wrong = i % 3 === 1;
    if (it.input === 'num') await typeNum(wrong ? it.ans.v + 1 : it.ans.v);
    else await page.evaluate(i => document.querySelectorAll('.panel .opts button')[i].click(), wrong ? (it.ans.i + 1) % it.k : it.ans.i);
    await sleep(it.pic ? 2.6 : 0.8);
    const show = i < 4 || wrong || it.pic === 'chain';
    if (show) await shot(`practice-${i + 1}-${it.sg}-${it.fam}`);
    await click('Check'); await sleep(wrong ? (it.pic === 'chain' ? 9.5 : it.pic ? 5.0 : 1.0) : 0.6);
    if (show) await shot(`practice-${i + 1}-${it.fam}-${wrong ? 'wrong' : 'right'}`);
    await click(wrong ? 'Try one like it' : 'Next');
    await sleep(1.0);
  }
  await shot('practice-end');
  const log = await page.evaluate(() => window.mathscenesLessons.log('two-step-inequalities'));
  fs.writeFileSync(path.join(out, 'diagnosis-log.json'), JSON.stringify(log, null, 1));
  console.log(`diagnosis log: ${log.length} attempts, ${log.filter(a => a.mc).length} with a misconception; parts: ${[...new Set(log.map(a => a.part))].join(', ')}`);
} catch (e) {
  console.log('WALK FAILED:', e.message); await shot('failed');
} finally {
  console.log(errors.length ? `PAGE ERRORS:\n${errors.join('\n')}` : 'no page errors');
  await browser.close();
}
