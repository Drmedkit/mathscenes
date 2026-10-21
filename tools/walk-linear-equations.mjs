// walk-linear-equations.mjs: click through the linear-equations lesson like a kid would (right and wrong answers) and
// screenshot every state.   node tools/walk-linear-equations.mjs [base url] [out dir]
// Needs the dev server (port 5290). Headless, ALWAYS muted (--mute-audio and ?mute). N_PRACTICE=… sets the items.
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] ?? 'http://localhost:5290/lessons/linear-equations.html?mute&fresh&seed=7';
const out = process.argv[3] ?? 'out/walk-linear-equations';
const N_PRACTICE = Number(process.env.N_PRACTICE ?? 30);
const ONLY = process.env.ONLY ?? '';   // 'practice' skips the explain parts (jumps with ?part=4&open)
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
async function click(text, sel = 'button') {
  const ok = await page.evaluate((text, sel) => {
    const b = [...document.querySelectorAll(sel)].find(x => x.textContent.replace(/\s+/g, ' ').trim().startsWith(text) && !x.disabled && x.offsetParent);
    if (!b) return false; b.click(); return true;
  }, text, sel);
  if (!ok) throw new Error(`no button "${text}"`);
}
/** fill the panel's answer boxes in order (clears them first) */
async function fill(...vals) {
  const boxes = await page.$$('.panel .ans input');
  for (let i = 0; i < vals.length; i++) {
    if (vals[i] === null) continue;
    await boxes[i].click({ clickCount: 3 }); await page.keyboard.press('Backspace');
    await boxes[i].type(String(vals[i]));
  }
}

try {
  const url = ONLY === 'practice' ? base.replace('?', '?part=4&open&') : base;
  await page.goto(url, { waitUntil: 'networkidle0' });
  await page.waitForFunction('window.lessonReady');
  if (ONLY !== 'practice') {
    await sleep(4.0); await shot('question');
    await page.evaluate(() => document.querySelectorAll('.cards button')[1].click());
    await click('Pretty sure'); await shot('question-picked'); await click('Find out');
    // worked example
    await sleep(1.0); await shot('example-start');
    await click('Take a bag off'); await sleep(5.0); await shot('example-takeX');
    await click('Take 3 off'); await sleep(4.8); await shot('example-takeN');
    await click('Split'); await sleep(6.0); await shot('example-split');
    await click('Check'); await sleep(7.5); await shot('example-check');
    await click('The x moves'); await sleep(0.3); await shot('example-why-wrong');
    await click('Both bags hold'); await sleep(0.3); await click('Your turn');
    // your turn
    await sleep(10.5); await shot('turn-ask-move');
    await click('Take 3 marbles off the right'); await sleep(1.8); await shot('turn-move-wrong');
    await sleep(2.5);
    await click('Take 3 marbles off both'); await sleep(7.5); await shot('turn-ask-x');
    await fill(16); await click('Check'); await sleep(0.4); await shot('turn-x-wrong');
    await fill(4); await click('Check'); await sleep(3.2); await shot('turn-x-right');
    await fill(23, 3); await click('Check'); await sleep(0.4); await shot('turn-check-wrong');
    await fill(23, 23); await click('Check'); await sleep(8.0); await shot('turn-done');
    await click('Prove it');
    // prove it
    await sleep(4.0); await shot('prove-start');
    await click('Jordan is wrong'); await sleep(0.4);
    await click('When the x'); await sleep(0.3); await shot('prove-wrong-chip');
    await click('Both pans lose'); await sleep(5.5); await shot('prove-1');
    await click('There is no x'); await sleep(9.5); await shot('prove-2');
    await click('Every step kept'); await sleep(4.5); await shot('prove-3');
    await click('Practice');
  }
  // practice: right answers, every third wrong (feedback, worked solution, twin)
  await sleep(2.0);
  for (let i = 0; i < N_PRACTICE; i++) {
    const it = await page.evaluate(() => { const x = window.__practiceItem; return { fam: x.family, sg: x.subgoal, input: x.input, ans: x.answer, k: x.choices?.length ?? 0 }; });
    const wrong = i % 3 === 1;
    const a = it.ans;
    if (it.input === 'choice') await page.evaluate(i => document.querySelectorAll('.panel .opts button')[i].click(), wrong ? (a.i + 1) % it.k : a.i);
    else if (it.input === 'num') await fill(wrong ? a.v + 1 : a.v);
    else if (it.input === 'pair') await fill(wrong ? a.x + 1 : a.x, a.y);
    else if (it.input === 'frac') await fill(null, wrong ? a.n + 1 : a.n, a.d);
    await sleep(0.8);
    const snap = i < 4 || (wrong && i < 24) || (i >= 12 && i < 16) || i % 7 === 0;
    if (snap) await shot(`practice-${i + 1}-${it.fam}-${it.sg}`);
    await click('Check'); await sleep(wrong ? 9 : 0.6);
    if (snap) await shot(`practice-${i + 1}-${it.fam}-${wrong ? 'wrong' : 'right'}`);
    await click(wrong ? 'Try one like it' : 'Next');
    await sleep(2.2);
  }
  await shot('practice-end');
  const log = await page.evaluate(() => window.mathscenesLessons.log('linear-equations'));
  fs.writeFileSync(path.join(out, 'diagnosis-log.json'), JSON.stringify(log, null, 1));
  console.log(`diagnosis log: ${log.length} attempts, ${log.filter(a => a.mc).length} with a misconception`);
  // later sub-goals with their pictures (?sg= jumps to one part): a wrong answer first, so the worked solution plays
  const SGS = (process.env.SGS ?? 's2-collect-integer,s1-solution-set-types,s1-check-both-sides,s3-infinitely-many,s3-context-interpret').split(',').filter(Boolean);
  for (const sg of SGS) {
    await page.goto(base.replace('?', `?part=4&open&sg=${sg}&`), { waitUntil: 'networkidle0' });
    await page.waitForFunction('window.lessonReady'); await sleep(2.0);
    for (let j = 0; j < 2; j++) {
      const it = await page.evaluate(() => { const x = window.__practiceItem; return { fam: x.family, input: x.input, ans: x.answer, k: x.choices?.length ?? 0, pic: !!x.picture?.balance }; });
      const wrong = j === 0, a = it.ans;
      if (it.input === 'choice') await page.evaluate(i => document.querySelectorAll('.panel .opts button')[i].click(), wrong ? (a.i + 1) % it.k : a.i);
      else if (it.input === 'num') await fill(wrong ? a.v + 1 : a.v);
      else if (it.input === 'pair') await fill(wrong ? a.x + 1 : a.x, a.y);
      else if (it.input === 'frac') await fill(null, wrong ? a.n + 1 : a.n, a.d);
      await sleep(it.pic ? 2.5 : 0.6);
      await shot(`sg-${sg}-${j + 1}-${it.fam}${it.pic ? '-pic' : ''}`);
      await click('Check'); await sleep(wrong ? (it.pic ? 14 : 2) : 0.6);
      await shot(`sg-${sg}-${j + 1}-${wrong ? 'wrong' : 'right'}`);
      await click(wrong ? 'Try one like it' : 'Next'); await sleep(1.5);
    }
  }
} catch (e) {
  console.log('WALK FAILED:', e.message); await shot('failed');
} finally {
  console.log(errors.length ? `PAGE ERRORS:\n${errors.join('\n')}` : 'no page errors');
  await browser.close();
}
