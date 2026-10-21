// walk-scientific-notation.mjs: click through the scientific-notation lesson like a kid would (right and wrong
// answers) and screenshot every state.   node tools/walk-scientific-notation.mjs [base url] [out dir]
// Needs the dev server (port 5290). Headless, ALWAYS muted (--mute-audio and ?mute). N_PRACTICE=n sets the items.
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] ?? 'http://localhost:5290/lessons/scientific-notation.html?mute&fresh&seed=7';
const out = process.argv[3] ?? 'out/walk-scientific-notation';
const N = Number(process.env.N_PRACTICE ?? 48);
fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ headless: true, args: ['--mute-audio', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warn') errors.push(`${m.type()}: ${m.text()}`); });
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
/** fill the answer boxes in order */
async function type(...vs) { await page.evaluate(vs => { const ins = document.querySelectorAll('.panel .ans input'); vs.forEach((v, i) => { ins[i].value = v; }); }, vs.map(String)); }

try {
  await page.goto(base, { waitUntil: 'networkidle0' });
  await page.waitForFunction('window.lessonReady');
  // 1 the question
  await sleep(3.6); await shot('question');
  await click('10'); await click('Pretty sure'); await shot('question-picked'); await click('Find out');
  // 2 worked example
  await sleep(0.8); await shot('example-start');
  await click('Place'); await sleep(3.6); await shot('example-place');
  await click('Climb'); await sleep(5.0); await shot('example-climb');
  await click('Divide'); await sleep(4.6); await shot('example-divide');
  await click('Put together'); await sleep(3.8); await shot('example-together');
  await click('It is 10 times'); await sleep(0.3); await shot('example-why-wrong');
  await click('The exponents only'); await sleep(0.3); await shot('example-why-right'); await click('Your turn');
  // 3 your turn
  await sleep(3.2); await shot('turn-ask');
  await type(-10); await click('Check'); await sleep(0.3); await shot('turn-pow-subneg');
  await type(2); await click('Check'); await sleep(6.0); await shot('turn-pow');
  await type(4); await click('Check'); await sleep(0.3); await shot('turn-coef-flip');
  await type(0.25); await click('Check'); await sleep(4.8); await shot('turn-coef');
  await type(2.5, 3); await click('Check'); await sleep(0.3); await shot('turn-write-same');
  await type(2.5, 1); await click('Check'); await sleep(4.6); await shot('turn-write');
  await click('Prove it');
  // 4 prove it
  await sleep(3.0); await click('Mia is wrong'); await sleep(0.3); await shot('prove-start');
  await click('One power of 10 apart'); await sleep(0.3); await shot('prove-wrong-chip');
  await click('9 × 10,000'); await sleep(3.0); await shot('prove-1');
  await click('100,000 ÷'); await sleep(3.4); await shot('prove-2');
  await click('The exponents only give'); await sleep(2.8); await shot('prove-3');
  await click('Practice');
  // 5 practice: right, but every third item wrong (feedback, the worked solution on the canvas, the twin)
  await sleep(1.6);
  for (let i = 0; i < N; i++) {
    const it = await page.evaluate(() => { const x = window.__practiceItem; return { fam: x.family, sg: x.subgoal, input: x.input, ans: x.answer, n: x.choices?.length ?? 0 }; });
    const wrong = i % 3 === 1;
    if (it.input === 'num') await type(wrong ? it.ans.v * 10 : it.ans.v);
    else if (it.input === 'pair') await type(it.ans.x, wrong ? it.ans.y + 1 : it.ans.y);
    else await page.evaluate(i => document.querySelectorAll('.panel .opts button')[i].click(), wrong ? (it.ans.i + 1) % it.n : it.ans.i);
    await sleep(1.4);
    const show = i < 3 || wrong;
    if (show) await shot(`practice-${i + 1}-${it.fam}`);
    await click('Check'); await sleep(wrong ? 8.5 : 0.5);
    if (show) await shot(`practice-${i + 1}-${it.fam}-${wrong ? 'wrong' : 'right'}`);
    await click(wrong ? 'Try one like it' : 'Next');
    await sleep(0.6);
  }
  await shot('practice-end');
  const log = await page.evaluate(() => window.mathscenesLessons.log('scientific-notation'));
  fs.writeFileSync(path.join(out, 'diagnosis-log.json'), JSON.stringify(log, null, 1));
  console.log(`diagnosis log: ${log.length} attempts, ${log.filter(a => a.mc).length} with a misconception`);
  console.log(`sub-goals answered: ${[...new Set(log.filter(a => a.part === 'practice').map(a => a.subgoal))].length}`);
  console.log(`wrong practice answers without a misconception: ${log.filter(a => a.part === 'practice' && !a.correct && !a.mc).map(a => a.family).join(', ')}`);
} catch (e) {
  console.log('WALK FAILED:', e.message);
  await shot('failed');
} finally {
  console.log(errors.length ? `PAGE ERRORS:\n${errors.join('\n')}` : 'no page errors');
  await browser.close();
}
