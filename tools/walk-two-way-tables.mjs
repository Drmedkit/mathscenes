// walk-two-way-tables.mjs: click through the two-way tables lesson like a kid would (right and wrong answers in every
// part) and screenshot every state.   node tools/walk-two-way-tables.mjs [base url] [out dir]
// Needs the dev server (port 5290). Headless, muted (--mute-audio and ?mute). WALK_ONLY=practice skips to practice.
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] ?? 'http://localhost:5290/lessons/two-way-tables.html?mute&fresh&seed=7';
const out = process.argv[3] ?? 'out/walk-two-way-tables';
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
async function typeNum(v) { await page.evaluate(v => { const i = document.querySelector('.panel .ans input'); i.value = v; }, String(v)); }

try {
  if (only !== 'practice') {
    await page.goto(base, { waitUntil: 'networkidle0' });
    await page.waitForFunction('window.lessonReady');
    await sleep(4.5); await shot('question');
    await click('42%'); await click('Pretty sure'); await shot('question-picked'); await click('Find out');
    // worked example
    await sleep(0.8); await shot('example-start');
    await click('Add them up'); await sleep(4.2); await shot('example-totals');
    await click('Ring it'); await sleep(3.6); await shot('example-whole');
    await click('Divide'); await sleep(3.8); await shot('example-bar');
    await click('Compare'); await sleep(6.4); await shot('example-compare');
    await click('Percents are always'); await sleep(1.2); await shot('example-why-wrong');
    await click('“Of the students'); await sleep(0.4); await shot('example-why-right'); await click('Your turn');
    // your turn
    await sleep(8.0); await shot('turn-whole');
    await click('The 120 bus riders'); await sleep(1.4); await shot('turn-whole-wrong'); await sleep(2.2);
    await click('The 90 breakfast eaters'); await sleep(2.8); await shot('turn-pct');
    await typeNum(60); await click('Check'); await sleep(0.4); await shot('turn-pct-wrong');
    await typeNum(80); await click('Check'); await sleep(7.0); await shot('turn-bars');
    await click('Yes: riding the bus'); await sleep(0.4); await shot('turn-assoc-wrong');
    await click('Yes: breakfast eaters'); await sleep(0.6); await shot('turn-done');
    await click('Prove it');
    // prove it
    await sleep(4.2); await click('Jordan is wrong'); await sleep(0.3); await shot('prove-start');
    await click('120 is the biggest cell'); await sleep(0.3); await shot('prove-wrong-chip');
    await click('The music group is bigger'); await sleep(3.0); await shot('prove-1');
    await click('The whole is the 180'); await sleep(3.4); await shot('prove-2');
    await click('Both bars split'); await sleep(6.6); await shot('prove-3');
    await click('Practice');
  } else {
    await page.goto(base + '&part=4&open', { waitUntil: 'networkidle0' });
    await page.waitForFunction('window.lessonReady');
  }
  // practice: right, but every third item wrong (feedback, the worked solution on the canvas, and the twin)
  await sleep(2.0);
  const N = Number(process.env.WALK_N ?? 40);
  for (let i = 0; i < N; i++) {
    const it = await page.evaluate(() => { const x = window.__practiceItem; return { fam: x.family, sg: x.subgoal, input: x.input, ans: x.answer, nch: (x.choices ?? []).length }; });
    const wrong = i % 3 === 1;
    if (it.input === 'num') await typeNum(wrong ? it.ans.v + 7 : it.ans.v);
    else await page.evaluate(i => document.querySelectorAll('.panel .opts button')[i].click(), wrong ? (it.ans.i + 1) % it.nch : it.ans.i);
    await sleep(1.6);
    const show = i < 6 || wrong || i % 2 === 0;
    if (show) await shot(`practice-${i + 1}-${it.sg}-${it.fam}`);
    await click('Check'); await sleep(wrong ? 6.5 : 0.6);
    if (show) await shot(`practice-${i + 1}-${it.fam}-${wrong ? 'wrong' : 'right'}`);
    await click(wrong ? 'Try one like it' : 'Next');
    await sleep(1.0);
  }
  await shot('practice-end');
  const log = await page.evaluate(() => window.mathscenesLessons.log('two-way-tables'));
  fs.writeFileSync(path.join(out, 'diagnosis-log.json'), JSON.stringify(log, null, 1));
  console.log(`diagnosis log: ${log.length} attempts, ${log.filter(a => a.mc).length} with a misconception; parts: ${[...new Set(log.map(a => a.part))].join(', ')}; sub-goals: ${new Set(log.map(a => a.subgoal).filter(Boolean)).size}`);
} catch (e) {
  console.log('WALK FAILED:', e.message); await shot('failed');
} finally {
  console.log(errors.length ? `PAGE ERRORS:\n${errors.join('\n')}` : 'no page errors');
  await browser.close();
}
