// walk-dilations-and-similarity.mjs: click through the dilations-and-similarity lesson like a kid would (right and
// wrong answers) and screenshot every state.   node tools/walk-dilations-and-similarity.mjs [base url] [out dir]
// Needs the dev server (port 5290). Headless, muted (--mute-audio and ?mute). WALK_ONLY=practice skips to practice;
// WALK_N = number of practice items at the end (default 8).
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] ?? 'http://localhost:5290/lessons/dilations-and-similarity.html?mute&fresh&seed=7';
const out = process.argv[3] ?? 'out/walk-dilations-and-similarity';
const only = process.env.WALK_ONLY ?? '';
fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ headless: true, args: ['--mute-audio', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
const page = await browser.newPage();
const errors = [];
// other lessons are being built in the same dev server: block Vite's HMR client so a reload elsewhere can't restart us
await page.setRequestInterception(true);
page.on('request', r => (r.url().includes('/@vite/client') ? r.abort() : r.continue()));
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if ((m.type() === 'error' || m.type() === 'warn') && !/vite\/client|ERR_FAILED/.test(m.text())) errors.push(m.text()); });
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
async function fill(...vals) { await page.evaluate(vs => { const ins = [...document.querySelectorAll('.panel .ans input')]; vs.forEach((v, i) => { if (ins[i]) ins[i].value = v; }); }, vals.map(String)); }

try {
  if (only !== 'practice') {
    await page.goto(base, { waitUntil: 'networkidle0' });
    await page.waitForFunction('window.lessonReady');
    // 1. the question
    await sleep(3.5); await shot('question');
    await click('1'); await click('Pretty sure'); await shot('question-picked'); await click('Find out');
    // 2. worked example
    await sleep(0.8); await shot('example-start');
    await click('Draw the rays'); await sleep(3.2); await shot('example-rays');
    await click('Measure'); await sleep(7.6); await shot('example-measure');
    await click('Join'); await sleep(3.6); await shot('example-join');
    await click('Check'); await sleep(4.0); await shot('example-check');
    await click('The center of a dilation is always'); await sleep(0.3); await shot('example-why-wrong');
    await click('The center is O'); await sleep(0.3); await click('Your turn');
    // 3. your turn
    await sleep(10.5); await shot('turn-ask-q');
    await fill(1, 2); await click('Check'); await sleep(0.3); await shot('turn-q-sign');
    await fill(-1, 2); await click('Check'); await sleep(6.6); await shot('turn-q-right');
    await fill(12); await click('Check'); await sleep(0.3); await shot('turn-len-wrong');
    await fill(3); await click('Check'); await sleep(2.0);
    await click('Every side and every angle'); await sleep(0.3); await shot('turn-true-wrong');
    await click('Every side is half as long'); await sleep(0.5); await shot('turn-callback');
    await click('Prove it');
    // 4. prove it
    await sleep(3.0); await click('Riley is wrong'); await sleep(0.3); await shot('prove-start');
    await click('Every rectangle has four'); await sleep(0.3); await shot('prove-wrong-chip');
    await click('A dilation multiplies every length'); await sleep(2.6); await shot('prove-1');
    await click('Dilating R by'); await sleep(4.2); await shot('prove-2');
    await click('Equal angles are not enough'); await sleep(2.6); await shot('prove-3');
    await click('Practice');
  } else {
    await page.goto(base + '&part=4&open', { waitUntil: 'networkidle0' });
    await page.waitForFunction('window.lessonReady');
  }
  // 5. a few practice items: right, every third one wrong (feedback, worked solution, twin)
  await sleep(2.0);
  const N = Number(process.env.WALK_N ?? 8);
  for (let i = 0; i < N; i++) {
    const it = await page.evaluate(() => { const x = window.__practiceItem; return { fam: x.family, sg: x.subgoal, input: x.input, ans: x.answer }; });
    const wrong = i % 3 === 1;
    if (it.input === 'num') await fill(wrong ? it.ans.v + 1 : it.ans.v);
    else if (it.input === 'pair') await fill(wrong ? it.ans.y + 1 : it.ans.x, wrong ? it.ans.x : it.ans.y);
    else if (it.input === 'frac') await fill('', wrong ? it.ans.n + 1 : it.ans.n, it.ans.d);
    else await page.evaluate(i => document.querySelectorAll('.panel .opts button')[i].click(), wrong ? (it.ans.i + 1) % 3 : it.ans.i);
    await sleep(1.2);
    await shot(`practice-${i + 1}-${it.sg}-${it.fam}`);
    await click('Check'); await sleep(wrong ? 8 : 0.6);
    if (wrong) await shot(`practice-${i + 1}-${it.fam}-wrong`);
    await click(wrong ? 'Try one like it' : 'Next');
    await sleep(1.0);
  }
  await shot('practice-end');
  const log = await page.evaluate(() => window.mathscenesLessons.log('dilations-and-similarity'));
  fs.writeFileSync(path.join(out, 'diagnosis-log.json'), JSON.stringify(log, null, 1));
  console.log(`diagnosis log: ${log.length} attempts, ${log.filter(a => a.mc).length} with a misconception; parts: ${[...new Set(log.map(a => a.part))].join(', ')}`);
} catch (e) {
  console.log('WALK FAILED:', e.message); await shot('failed');
} finally {
  console.log(errors.length ? `PAGE ERRORS:\n${errors.join('\n')}` : 'no page errors');
  await browser.close();
}
