// walk-congruence.mjs: click through the congruence lesson like a kid would (right and wrong answers) and screenshot
// every state.   node tools/walk-congruence.mjs [base url] [out dir] [practice items] [first part 0-4] [wrong every n]
//                node tools/walk-congruence.mjs gallery [out dir] [seed]   (one item of every family, solved)
// Needs the dev server (port 5290). Headless, ALWAYS muted (--mute-audio and ?mute).
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const GALLERY = process.argv[2] === 'gallery';
const base = GALLERY ? 'http://localhost:5290/lessons/congruence.html?mute' : (process.argv[2] ?? 'http://localhost:5290/lessons/congruence.html?mute&fresh&seed=7');
const out = process.argv[3] ?? (GALLERY ? 'out/walk-congruence-gallery' : 'out/walk-congruence');
const N = GALLERY ? 0 : Number(process.argv[4] ?? 24);
const FROM = GALLERY ? 0 : Number(process.argv[5] ?? 0);
const WRONG = Number(process.argv[6] ?? 3);
fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ headless: true, args: ['--mute-audio', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
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
/** click the first enabled, visible button whose text starts with `text`; waits up to 25 s for it (busy machine) */
async function click(text, sel = 'button') {
  for (let t = 0; t < 100; t++) {
    const ok = await page.evaluate((text, sel) => {
      const b = [...document.querySelectorAll(sel)].find(x => x.textContent.replace(/\s+/g, ' ').trim().startsWith(text) && !x.disabled && x.offsetParent);
      if (!b) return false; b.click(); return true;
    }, text, sel);
    if (ok) return;
    await sleep(0.25);
  }
  throw new Error(`no button "${text}"`);
}
async function pair(x, y) { await page.evaluate((x, y) => { const [a, b] = document.querySelectorAll('.panel .ans input'); a.value = x; b.value = y; }, String(x), String(y)); }

const PAIRS = [
  ['cover', 'congruence-definition'], ['partner', 'correspondence'], ['invariant', 'rule-out-by-invariant'], ['orient', 'vertex-orientation'],
  ['whichMove', 'motion-type-by-orientation'], ['specify', 'specify-single-motion'], ['sequence', 'execute-given-sequence'], ['order', 'order-dependence'],
  ['verify', 'verify-whole-figure'], ['plan', 'plan-sequence'], ['finish', 'fix-mirror-placement'], ['twoWays', 'equivalent-sequences'],
  ['undo', 'reverse-sequence'], ['dilate', 'dilation-not-rigid'], ['identity', 'identity-dilation'], ['table', 'transformation-properties-table'],
  ['rule', 'rule-length-test'], ['justify', 'justify-congruence-claim'],
];

try {
  if (GALLERY) {
    const seed = Number(process.argv[4] ?? 3);
    for (const [fam, sg] of PAIRS) {
      await page.goto(`${base}&open&part=4&item=${fam}:${sg}:${seed}&solve`, { waitUntil: 'networkidle0' });
      await page.waitForFunction('window.lessonReady');
      await sleep(6.5);
      await shot(`${fam}`);
    }
  } else {
    await page.goto(FROM ? `${base}&open&part=${FROM}` : base, { waitUntil: 'networkidle0' });
    await page.waitForFunction('window.lessonReady');
    if (FROM <= 0) {
      await sleep(2.4); await shot('question');
      await page.evaluate(() => document.querySelectorAll('.cards button')[0].click()); await click('Pretty sure'); await shot('question-picked'); await click('Find out');
      // worked example
      await sleep(0.8); await shot('example-start');
      await click('Match them'); await sleep(3.8); await shot('example-match');
      await click('Flip it'); await sleep(8.2); await shot('example-flip');
      await click('Slide it'); await sleep(6.6); await shot('example-slide');
      await click('Check it'); await sleep(4.4); await shot('example-check');
      await click('Tile 2 looks'); await sleep(0.3); await shot('example-why-wrong');
      await click('The tracing only moved'); await sleep(0.3); await click('Your turn');
    }
    if (FROM <= 2) {
      await sleep(12.5); await shot('turn-ask-slide');
      await pair(0, -5); await click('Check'); await sleep(1.2); await shot('turn-slide-wrong');
      await pair(2, -5); await click('Check'); await sleep(5.0); await shot('turn-slide-right');
      await click('A″ is on D, so'); await sleep(0.4); await shot('turn-check-wrong');
      await click('A″ is on D, B″ on E and C″'); await sleep(4.2); await shot('turn-callback');
      await click('Prove it');
    }
    if (FROM <= 3) {
      await sleep(1.6); await click('Jordan is wrong'); await sleep(0.3); await shot('prove-start');
      await click('Both cover 12'); await sleep(0.3); await shot('prove-wrong-chip');
      await click('Sliding, turning'); await sleep(2.4); await shot('prove-1-turning'); await sleep(2.2); await shot('prove-1');
      await click('Count the squares'); await sleep(3.0); await shot('prove-2');
      await click('Every sequence'); await sleep(2.4); await shot('prove-3-slide'); await sleep(7.2); await shot('prove-3');
      await click('Practice');
    }
    // practice: right, but every third item wrong (feedback, the worked solution, the twin)
    await sleep(1.5);
    for (let i = 0; i < N; i++) {
      const it = await page.evaluate(() => { const x = window.__practiceItem; return { fam: x.family, sg: x.subgoal, input: x.input, ans: x.answer, n: (x.choices ?? []).length }; });
      const wrong = WRONG > 0 && i % WRONG === 1;
      if (it.input === 'num') await page.evaluate(v => { document.querySelector('.panel .ans input').value = v; }, String(wrong ? it.ans.v + 1 : it.ans.v));
      else if (it.input === 'pair') await pair(wrong ? it.ans.x + 1 : it.ans.x, wrong ? it.ans.y + 1 : it.ans.y);
      else await page.evaluate(i => document.querySelectorAll('.panel .opts button')[i].click(), wrong ? (it.ans.i + 1) % it.n : it.ans.i);
      await sleep(1.0);
      const keep = i < 6 || (wrong && i < 40) || i % 4 === 0;
      if (keep) await shot(`practice-${i + 1}-${it.fam}`);
      await click('Check'); await sleep(wrong ? 5.5 : 0.4);
      if (keep && wrong) await shot(`practice-${i + 1}-${it.fam}-wrong`);
      await click(wrong ? 'Try one like it' : 'Next');
      await sleep(1.0);
    }
    if (N > 0) await shot('practice-end');
    const log = await page.evaluate(() => window.mathscenesLessons.log('congruence'));
    fs.writeFileSync(path.join(out, 'diagnosis-log.json'), JSON.stringify(log, null, 1));
    console.log(`diagnosis log: ${log.length} attempts, ${log.filter(a => a.mc).length} with a misconception`);
  }
} catch (e) {
  console.log('WALK FAILED:', e.message); await shot('failed');
} finally {
  console.log(errors.length ? `PAGE ERRORS:\n${errors.join('\n')}` : 'no page errors');
  await browser.close();
}
