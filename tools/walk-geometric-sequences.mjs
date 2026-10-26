// walk-geometric-sequences.mjs: click through the geometric-sequences lesson (Algebra 1) like a kid would (right and wrong
// answers) and screenshot every state.   node tools/walk-geometric-sequences.mjs [base url] [out dir]
// Needs the dev server (port 5290). Headless, muted (--mute-audio and ?mute).
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] ?? 'http://localhost:5290/lessons/geometric-sequences.html?mute&fresh&seed=7';
const out = process.argv[3] ?? 'out/walk-geometric-sequences';
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
    const all = [...document.querySelectorAll(sel)].filter(x => !x.disabled && x.offsetParent), t = x => x.textContent.replace(/\s+/g, ' ').trim();
    const b = all.find(x => t(x) === text) ?? all.find(x => t(x).startsWith(text));
    if (!b) return false; b.click(); return true;
  }, text, sel);
  if (!ok) throw new Error(`no button "${text}"`);
}
async function typeNum(v) { await page.evaluate(v => { const i = document.querySelector('.panel .ans input'); i.value = v; }, String(v)); }

try {
  if (only !== 'practice') {
    await page.goto(base, { waitUntil: 'networkidle0' });
    await page.waitForFunction('window.lessonReady');
    await sleep(4.6); await shot('question');
    await click('768'); await click('Pretty sure'); await shot('question-picked'); await click('Find out');
    // worked example
    await sleep(0.8); await shot('example-start');
    await click('Check'); await sleep(7.0); await shot('example-hops');
    await click('Count'); await sleep(4.6); await shot('example-count');
    await click('Generalize'); await sleep(4.0); await shot('example-general');
    await click('Read'); await sleep(8.0); await shot('example-plot');
    await click('There are 8 rounds'); await sleep(0.3); await shot('example-why-wrong');
    await click('Round 1 already'); await sleep(0.3); await click('Your turn');
    // your turn
    await sleep(10.5); await shot('turn-form');
    await click('an = 96 · (12)n'); await sleep(0.4); await shot('turn-form-wrong');
    await click('an = 96 · (12)n−1'); await sleep(1.8); await shot('turn-pos');
    await typeNum(5); await click('Check'); await sleep(0.4); await shot('turn-pos-wrong');
    await typeNum(6); await click('Check'); await sleep(4.0); await shot('turn-pos-right');
    await click('Yes: it drops'); await sleep(0.4); await shot('turn-zero-wrong');
    await click('No: halving'); await sleep(4.4); await shot('turn-zero');
    await click('Prove it');
    // prove it
    await sleep(5.0); await shot('prove-intro'); await click('No, not a proof'); await sleep(0.3); await shot('prove-start');
    await click('They agree at'); await sleep(0.3); await shot('prove-wrong-chip');
    await click('12 · 2ⁿ⁻¹ = 6 · 2ⁿ'); await sleep(2.0); await shot('prove-wrong-first');
    await click('G(1) = 12'); await sleep(1.6); await shot('prove-1');
    await click('G(n + 1) = 12'); await sleep(3.2); await shot('prove-2');
    await click('If term n agrees'); await sleep(4.0); await shot('prove-3');
    await click('Practice');
  } else {
    await page.goto(base + '&part=4&open', { waitUntil: 'networkidle0' });
    await page.waitForFunction('window.lessonReady');
  }
  // practice: right, but every third item wrong (feedback, the steps card, the replay and the twin)
  await sleep(2.0);
  const N = Number(process.env.WALK_N ?? 30);
  for (let i = 0; i < N; i++) {
    const it = await page.evaluate(() => { const x = window.__practiceItem; return { fam: x.family, sg: x.subgoal, input: x.input, ans: x.answer, n: (x.choices ?? []).length, pic: !!(x.picture && (x.picture.strip || x.picture.graph)) }; });
    const wrong = i % 3 === 1;
    if (it.input === 'num') await typeNum(wrong ? it.ans.v + 1 : it.ans.v);
    else if (it.input === 'frac') await page.evaluate((n, d) => { const [w, a, b] = document.querySelectorAll('.panel .ans input'); w.value = ''; a.value = n; b.value = d; }, String(wrong ? it.ans.n + 1 : it.ans.n), String(it.ans.d));
    else if (it.input === 'pair') await page.evaluate((x, y) => { const [a, b] = document.querySelectorAll('.panel .ans input'); a.value = x; b.value = y; }, String(wrong ? it.ans.x + 1 : it.ans.x), String(it.ans.y));
    else await page.evaluate(i => document.querySelectorAll('.panel .opts button')[i].click(), wrong ? (it.ans.i + 1) % it.n : it.ans.i);
    await sleep(it.pic ? 2.4 : 0.9);
    const show = i < 4 || wrong || it.pic;
    if (show) await shot(`practice-${i + 1}-${it.sg}-${it.fam}`);
    await click('Check'); await sleep(wrong ? (it.pic ? 7 : 1.2) : 0.6);
    if (show) await shot(`practice-${i + 1}-${it.fam}-${wrong ? 'wrong' : 'right'}`);
    await click(wrong ? 'Try one like it' : 'Next');
    await sleep(1.0);
  }
  await shot('practice-end');
  const log = await page.evaluate(() => window.mathscenesLessons.log('geometric-sequences'));
  fs.writeFileSync(path.join(out, 'diagnosis-log.json'), JSON.stringify(log, null, 1));
  console.log(`diagnosis log: ${log.length} attempts, ${log.filter(a => a.mc).length} with a misconception; parts: ${[...new Set(log.map(a => a.part))].join(', ')}`);
} catch (e) {
  console.log('WALK FAILED:', e.message); await shot('failed');
} finally {
  console.log(errors.length ? 'PAGE ERRORS:\n' + errors.join('\n') : 'no page errors');
  await browser.close();
}
