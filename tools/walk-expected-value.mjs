// walk-expected-value.mjs: click through "Probability distributions and expected value" like a student would (right and wrong
// answers) and screenshot every state.   node tools/walk-expected-value.mjs [base url] [out dir]
// Needs the dev server (port 5290). Headless, muted (--mute-audio and ?mute). WALK_ONLY=practice skips to practice.
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] ?? 'http://localhost:5290/lessons/expected-value.html?mute&fresh&seed=7';
const out = process.argv[3] ?? 'out/walk-expected-value';
const only = process.env.WALK_ONLY ?? '';
fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ headless: true, args: ['--mute-audio', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
const page = await browser.newPage();
const errors = [];
await page.setRequestInterception(true);
page.on('request', r => (new URL(r.url()).pathname.endsWith('/@vite/client') ? r.respond({ status: 200, contentType: 'application/javascript', body: 'export {}' }) : r.continue()));
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if ((m.type() === 'error' || m.type() === 'warn') && !/vite|ERR_FAILED|favicon/.test(m.text())) errors.push(m.text()); });
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
async function typePair(x, y) { await page.evaluate((x, y) => { const [a, b] = document.querySelectorAll('.panel .ans input'); a.value = x; b.value = y; }, String(x), String(y)); }
async function typeFrac(nn, d) { await page.evaluate((nn, d) => { const ins = [...document.querySelectorAll('.panel .ans input')]; const [w, a, b] = ins.length === 3 ? ins : [null, ...ins]; if (w) w.value = ''; a.value = nn; b.value = d; }, String(nn), String(d)); }

try {
  if (only !== 'practice') {
    await page.goto(base, { waitUntil: 'networkidle0' });
    await page.waitForFunction('window.lessonReady', { timeout: 60000 });
    await sleep(4.0); await shot('question');
    await click('$4'); await click('Pretty sure'); await shot('question-picked'); await click('Find out');
    // worked example
    await sleep(1.5); await shot('example-start');
    await click('Table'); await sleep(5.2); await shot('example-table');
    await click('Draw'); await sleep(4.4); await shot('example-draw');
    await click('Average'); await sleep(5.8); await shot('example-average');
    await click('Balance'); await sleep(3.2); await shot('example-tipped'); await sleep(4.0); await shot('example-balance');
    await click('Because $2 is the middle'); await sleep(0.3); await shot('example-why-wrong');
    await click('The prizes are not equally'); await sleep(0.3); await click('Your turn');
    // your turn
    await sleep(4.4); await shot('turn-p1');
    await typeFrac(9, 64); await click('Check'); await sleep(0.3); await shot('turn-p1-wrong');
    await typeFrac(27, 64); await click('Check'); await sleep(4.2); await shot('turn-ev');
    await typeNum(1.5); await click('Check'); await sleep(0.3); await shot('turn-ev-wrong');
    await typeNum(0.75); await click('Check'); await sleep(4.4); await shot('turn-judge');
    await click('No, but you will get 1'); await sleep(0.3); await shot('turn-judge-wrong');
    await click('No: one quiz'); await sleep(2.0); await shot('turn-done');
    await click('Prove it');
    // prove it
    await sleep(3.0); await click('Ana is wrong'); await sleep(1.6); await shot('prove-start');
    await click('The tallest bar'); await sleep(0.3); await shot('prove-wrong-chip');
    await click('Multiply out each term'); await sleep(2.4); await shot('prove-1');
    await click('m is the same in every'); await sleep(1.6); await shot('prove-2');
    await click('E(X) − m is zero'); await sleep(7.6); await shot('prove-3');
    await click('Practice');
  } else {
    await page.goto(base + '&part=4&open', { waitUntil: 'networkidle0' });
    await page.waitForFunction('window.lessonReady', { timeout: 60000 });
  }
  await sleep(2.0);
  const N = Number(process.env.WALK_N ?? 20);
  for (let i = 0; i < N; i++) {
    const it = await page.evaluate(() => { const x = window.__practiceItem; return { fam: x.family, sg: x.subgoal, input: x.input, ans: x.answer, nch: (x.choices ?? []).length }; });
    const wrong = i % 3 === 1;
    if (it.input === 'num') await typeNum(wrong ? it.ans.v + 1 : it.ans.v);
    else if (it.input === 'pair') await typePair(wrong ? it.ans.y + 1 : it.ans.x, wrong ? it.ans.x : it.ans.y);
    else if (it.input === 'frac') await typeFrac(wrong ? it.ans.n + 1 : it.ans.n, it.ans.d);
    else await page.evaluate(i => document.querySelectorAll('.panel .opts button')[i].click(), wrong ? (it.ans.i + 1) % it.nch : it.ans.i);
    await sleep(1.6);
    await shot(`practice-${i + 1}-${it.sg}-${it.fam}`);
    await click('Check'); await sleep(wrong ? 4.5 : 0.5);
    if (wrong) await shot(`practice-${i + 1}-${it.fam}-wrong`);
    await click(wrong ? 'Try one like it' : 'Next');
    await sleep(0.8);
  }
  const log = await page.evaluate(() => window.mathscenesLessons.log('expected-value'));
  fs.writeFileSync(path.join(out, 'diagnosis-log.json'), JSON.stringify(log, null, 1));
  console.log(`diagnosis log: ${log.length} attempts, ${log.filter(a => a.mc).length} with a misconception; parts: ${[...new Set(log.map(a => a.part))].join(', ')}`);
} catch (e) {
  console.log('WALK FAILED:', e.message); await shot('failed');
} finally {
  console.log(errors.length ? `PAGE ERRORS:\n${errors.join('\n')}` : 'no page errors');
  await browser.close();
}
