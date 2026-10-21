// walk-two-step-equations.mjs: click through the two-step equations lesson like a kid would (right and wrong
// answers) and screenshot every state.   node tools/walk-two-step-equations.mjs [base url] [out dir]
// Needs the dev server (port 5290). Headless, muted (--mute-audio and ?mute).
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] ?? 'http://localhost:5290/lessons/two-step-equations.html?mute&fresh&seed=7';
const out = process.argv[3] ?? 'out/walk-two-step-equations';
const only = process.env.WALK_ONLY ?? '';   // e.g. "practice" to skip to practice (?part=4&open)
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
async function typeNum(v) { await page.evaluate(v => { const i = document.querySelector('.panel .ans input'); i.value = v; }, String(v)); }

try {
  if (only !== 'practice') {
    await page.goto(base, { waitUntil: 'networkidle0' });
    await page.waitForFunction('window.lessonReady');
    await sleep(4.5); await shot('question');
    await click('3'); await click('Pretty sure'); await shot('question-picked'); await click('Find out');
    // worked example
    await sleep(0.8); await shot('example-start');
    await click('Read it'); await sleep(4.6); await shot('example-read');
    await click('Take 6 off'); await sleep(5.6); await shot('example-take');
    await click('Split'); await sleep(6.8); await shot('example-split');
    await click('Check'); await sleep(6.8); await shot('example-check');
    await click('Either order'); await sleep(0.3); await shot('example-why-wrong');
    await click('The + 6 was'); await sleep(0.3); await click('Your turn');
    // your turn
    await sleep(13.5); await shot('turn-move');
    await click('Divide the left side'); await sleep(1.8); await shot('turn-left-only-tips'); await sleep(2.5);
    await click('Divide both sides by 4'); await sleep(5.2); await shot('turn-split');
    await typeNum(24); await click('Check'); await sleep(0.3); await shot('turn-x-wrong');
    await typeNum(6); await click('Check'); await sleep(3.0); await shot('turn-x');
    await typeNum(60); await click('Check'); await sleep(0.3);
    await typeNum(33); await click('Check'); await sleep(6.5); await shot('turn-check');
    await click('Prove it');
    // prove it
    await sleep(4.0); await click('Sam is wrong'); await sleep(0.3); await shot('prove-start');
    await click('Moving the 8'); await sleep(0.3); await shot('prove-wrong-chip');
    await click('He halved'); await sleep(2.2); await shot('prove-1-tips'); await sleep(2.6); await shot('prove-1');
    await click('8 comes off'); await sleep(6.0); await shot('prove-2');
    await click('Both pans split'); await sleep(13); await shot('prove-3');
    await click('Practice');
  } else {
    await page.goto(base + '&part=4&open', { waitUntil: 'networkidle0' });
    await page.waitForFunction('window.lessonReady');
  }
  // practice: right, but every third item wrong (feedback, the worked solution and the twin)
  await sleep(2.0);
  const N = Number(process.env.WALK_N ?? 36);
  for (let i = 0; i < N; i++) {
    const it = await page.evaluate(() => { const x = window.__practiceItem; return { fam: x.family, sg: x.subgoal, input: x.input, ans: x.answer, pic: !!(x.picture && x.picture.balance) }; });
    const wrong = i % 3 === 1;
    if (it.input === 'num') await typeNum(wrong ? it.ans.v + 1 : it.ans.v);
    else if (it.input === 'pair') await page.evaluate((x, y) => { const [a, b] = document.querySelectorAll('.panel .ans input'); a.value = x; b.value = y; }, String(wrong ? it.ans.y : it.ans.x), String(wrong ? it.ans.x : it.ans.y));
    else await page.evaluate(i => document.querySelectorAll('.panel .opts button')[i].click(), wrong ? (it.ans.i + 1) % 3 : it.ans.i);
    await sleep(it.pic ? 3.2 : 0.9);
    const show = i < 4 || (wrong && i < 34) || it.pic;
    if (show) await shot(`practice-${i + 1}-${it.sg}-${it.fam}`);
    await click('Check'); await sleep(wrong ? (it.pic ? 14 : 1.0) : 0.6);
    if (show) await shot(`practice-${i + 1}-${it.fam}-${wrong ? 'wrong' : 'right'}`);
    await click(wrong ? 'Try one like it' : 'Next');
    await sleep(1.0);
  }
  await shot('practice-end');
  const log = await page.evaluate(() => window.mathscenesLessons.log('two-step-equations'));
  fs.writeFileSync(path.join(out, 'diagnosis-log.json'), JSON.stringify(log, null, 1));
  console.log(`diagnosis log: ${log.length} attempts, ${log.filter(a => a.mc).length} with a misconception; parts: ${[...new Set(log.map(a => a.part))].join(', ')}`);
} catch (e) {
  console.log('WALK FAILED:', e.message); await shot('failed');
} finally {
  console.log(errors.length ? `PAGE ERRORS:\n${errors.join('\n')}` : 'no page errors');
  await browser.close();
}
