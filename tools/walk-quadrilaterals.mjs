// walk-quadrilaterals.mjs: click through "Parallelograms and other quadrilaterals" like a student would (right and wrong answers)
// and screenshot every state.   node tools/walk-quadrilaterals.mjs [base url] [out dir]
// Needs the dev server (port 5290). Headless, muted (--mute-audio and ?mute). WALK_ONLY=practice skips to practice.
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] ?? 'http://localhost:5290/lessons/quadrilaterals.html?mute&fresh&seed=7';
const out = process.argv[3] ?? 'out/walk-quadrilaterals';
const only = process.env.WALK_ONLY ?? '';
fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ headless: true, args: ['--mute-audio', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
const page = await browser.newPage();
const errors = [];
// other lessons are being built in the same dev server: stub Vite's HMR client so a reload elsewhere can't restart us
await page.setRequestInterception(true);
page.on('request', r => (new URL(r.url()).pathname.endsWith('/@vite/client') ? r.respond({ status: 200, contentType: 'application/javascript', body: 'export {}' }) : r.continue()));
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if ((m.type() === 'error' || m.type() === 'warn') && !/vite\/client|ERR_FAILED/.test(m.text())) errors.push(m.text()); });
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
let n = 0;
const sleep = s => new Promise(r => setTimeout(r, s * 1000));
async function shot(name) { n++; const f = path.join(out, `${String(n).padStart(2, '0')}-${name}.png`); await page.screenshot({ path: f }); console.log(f); }
async function click(text, sel = 'button', exact = false) {
  const ok = await page.evaluate((text, sel, exact) => {
    const norm = s => s.replace(/\s+/g, ' ').trim();
    const b = [...document.querySelectorAll(sel)].find(x => (exact ? norm(x.textContent) === text : norm(x.textContent).startsWith(text)) && !x.disabled && x.offsetParent);
    if (!b) return false; b.click(); return true;
  }, text, sel, exact);
  if (!ok) throw new Error(`no button "${text}"`);
}
async function typeNum(v) { await page.evaluate(v => { const all = document.querySelectorAll('.panel .ans input'); const i = all[all.length - 1]; i.value = v; }, String(v)); }

const ov = s => [...s].map(ch => ch + '̅').join('');
try {
  if (only !== 'practice') {
    await page.goto(base, { waitUntil: 'networkidle0' });
    await page.waitForFunction('window.lessonReady');
    await sleep(3.0); await shot('question');
    await click('Yes'); await click('Pretty sure'); await shot('question-picked'); await click('Find out');
    // worked example: one parallelogram, three moves
    await sleep(1.8); await shot('example-start');
    await click('Measure'); await sleep(2.4); await shot('example-sides');
    await click('Draw'); await sleep(2.6); await shot('example-diagonals');
    await click('Push'); await sleep(1.4); await shot('example-pushing'); await sleep(2.4); await shot('example-rectangle');
    await click('Squeeze'); await sleep(4.2); await shot('example-rhombus');
    await click('because its diagonals'); await sleep(0.3); await shot('example-why-wrong');
    await click('every rectangle is'); await sleep(0.4); await shot('example-why-right'); await click('Your turn');
    // your turn: a rhombus
    await sleep(4.4); await shot('turn-start');
    await typeNum(64); await click('Check'); await sleep(0.4); await shot('turn-dac-wrong');
    await typeNum(32); await click('Check'); await sleep(2.4); await shot('turn-dac-right');
    await typeNum(32); await click('Check'); await sleep(0.4); await shot('turn-abd-wrong');
    await typeNum(58); await click('Check'); await sleep(2.6); await shot('turn-done');
    await click('Prove it');
    // prove it: the rectangle test, then the frame
    await sleep(2.0); await shot('prove-start');
    await click(`${ov('AC')} ⊥`); await sleep(0.3); await shot('prove-decoy');
    await click('△ABC ≅ △DCB'); await sleep(0.3); await shot('prove-too-early');
    await click(`${ov('AB')} ≅ ${ov('DC')}`); await sleep(0.5); await click(`${ov('BC')} ≅ ${ov('CB')}`); await sleep(0.5);
    await click('△ABC ≅ △DCB'); await sleep(0.5); await click('∠ABC ≅ ∠DCB'); await sleep(0.5); await click('m∠ABC = 90°', 'button', true); await sleep(0.5);
    await click('ABCD is a rectangle'); await sleep(1.0); await shot('prove-ordered');
    await click('Parallelogram opposite sides'); await sleep(0.4); await click('Reflexive'); await sleep(0.4);
    await click('SAS', 'button', true); await sleep(0.3); await shot('prove-sas');
    await click('SSS', 'button', true); await sleep(0.4); await click('CPCTC'); await sleep(0.4); await click('Consecutive angles'); await sleep(0.4); await click('Parallelogram with a right angle'); await sleep(1.0); await shot('prove-proved');
    await sleep(3.4); await shot('prove-frame'); await sleep(3.0); await shot('prove-trapezoid');
    await click('measure the diagonals again'); await sleep(0.3); await shot('prove-again');
    await click('check that both pairs'); await sleep(2.8); await shot('prove-back'); await sleep(4.4); await shot('prove-callback');
    await click('Practice');
  } else {
    await page.goto(base + '&part=4&open', { waitUntil: 'networkidle0' });
    await page.waitForFunction('window.lessonReady');
  }
  // practice: right, but every third item wrong (feedback, the replay on the picture and the steps card)
  await sleep(2.0);
  const N = Number(process.env.WALK_N ?? 30);
  for (let i = 0; i < N; i++) {
    const it = await page.evaluate(() => { const x = window.__practiceItem; return { fam: x.family, sg: x.subgoal, input: x.input, ans: x.answer, n: (x.choices ?? []).length }; });
    const wrong = i % 3 === 1;
    if (it.input === 'num') await typeNum(wrong ? it.ans.v + 1 : it.ans.v);
    else await page.evaluate(i => document.querySelectorAll('.panel .opts button')[i].click(), wrong ? (it.ans.i + 1) % it.n : it.ans.i);
    await sleep(2.0);
    const show = i < 6 || wrong;
    if (show) await shot(`practice-${i + 1}-${it.sg}-${it.fam}`);
    await click('Check'); await sleep(wrong ? 3.6 : 0.6);
    if (show && wrong) await shot(`practice-${i + 1}-${it.fam}-wrong`);
    await click(wrong ? 'Try one like it' : 'Next');
    await sleep(0.8);
  }
  await shot('practice-end');
  const log = await page.evaluate(() => window.__lesson.store.attempts());
  fs.writeFileSync(path.join(out, 'diagnosis-log.json'), JSON.stringify(log, null, 1));
  console.log(`diagnosis log: ${log.length} attempts, ${log.filter(a => a.mc).length} with a misconception; parts: ${[...new Set(log.map(a => a.part))].join(', ')}`);
} catch (e) {
  console.log('WALK FAILED:', e.message); await shot('failed');
} finally {
  console.log(errors.length ? `PAGE ERRORS:\n${errors.join('\n')}` : 'no page errors');
  await browser.close();
}
