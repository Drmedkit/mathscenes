// walk-geometry-foundations.mjs: click through "Definitions, postulates and first proofs" like a student would (right and wrong
// answers) and screenshot every state.   node tools/walk-geometry-foundations.mjs [base url] [out dir]
// Needs the dev server (port 5290). Headless, muted (--mute-audio and ?mute). WALK_ONLY=practice skips to practice.
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] ?? 'http://localhost:5290/lessons/geometry-foundations.html?mute&fresh&seed=7';
const out = process.argv[3] ?? 'out/walk-geometry-foundations';
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
async function click(text, sel = 'button') {
  const ok = await page.evaluate((text, sel) => {
    const norm = s => s.replace(/\s+/g, ' ').trim();
    const b = [...document.querySelectorAll(sel)].find(x => norm(x.textContent).startsWith(text) && !x.disabled && x.offsetParent);
    if (!b) return false; b.click(); return true;
  }, text, sel);
  if (!ok) throw new Error(`no button "${text}"`);
}
async function typeNum(v) { await page.evaluate(v => { const i = document.querySelector('.panel .ans input'); i.value = v; }, String(v)); }

try {
  if (only !== 'practice') {
    await page.goto(base, { waitUntil: 'networkidle0' });
    await page.waitForFunction('window.lessonReady');
    await sleep(3.5); await shot('question');
    await click('It looks that way'); await click('Pretty sure'); await shot('question-picked'); await click('Find out');
    // worked example
    await sleep(1.8); await shot('example-start');
    await click('Start'); await sleep(3.4); await shot('example-givens');
    await click('Split'); await sleep(4.6); await shot('example-split');
    await click('Substitute'); await sleep(3.4); await shot('example-subst');
    await click('Subtract'); await sleep(4.2); await shot('example-subtract');
    await click('It could: the drawing'); await sleep(0.3); await shot('example-why-wrong');
    await click('A drawing may show'); await sleep(0.3); await click('Your turn');
    // your turn
    await sleep(6.0); await shot('turn-start');
    await click('Vertical Angles Theorem'); await sleep(0.4); await shot('turn-r3-wrong');
    await click('Substitution Property'); await sleep(2.4); await shot('turn-r3');
    await click('∠1 = ∠3'); await sleep(0.4); await shot('turn-s4-wrong');
    await click('m∠1 = m∠3'); await sleep(2.6); await shot('turn-s4');
    await click('Linear Pair Postulate'); await sleep(0.4); await shot('turn-r5-wrong');
    await click('Definition of congruent angles'); await sleep(2.6); await shot('turn-r5');
    await click('A conjecture'); await sleep(0.4); await shot('turn-status-wrong');
    await click('A theorem'); await sleep(3.0); await shot('turn-swing'); await sleep(3.6); await shot('turn-done');
    await click('Prove it');
    // prove it
    await sleep(2.0); await shot('prove-start'); await click('Not proved yet'); await sleep(0.6); await shot('prove-pool');
    await click('∠3 and ∠6 are vertical'); await sleep(0.3); await shot('prove-decoy');
    await click('m∠3 = m∠6'); await sleep(0.3); await shot('prove-too-early');
    await click('ℓ ∥ m'); await sleep(0.8); await click('m∠2 = m∠6'); await sleep(0.8); await shot('prove-order-2');
    await click('m∠3 = m∠2'); await sleep(0.8); await click('m∠3 = m∠6'); await sleep(1.2); await shot('prove-ordered');
    await click('Linear Pair Postulate'); await sleep(0.3); await shot('prove-reason-wrong');
    await click('Given'); await sleep(0.6); await click('Corresponding Angles'); await sleep(0.6); await click('Vertical Angles Theorem'); await sleep(0.6);
    await click('Alternate Interior Angles Theorem'); await sleep(0.3); await shot('prove-circular');
    await click('Transitive Property'); await sleep(2.6); await shot('prove-done'); await sleep(3.0); await shot('prove-swing');
    await click('Practice');
  } else {
    await page.goto(base + '&part=4&open', { waitUntil: 'networkidle0' });
    await page.waitForFunction('window.lessonReady');
  }
  // practice: right, but every third item wrong (feedback, the replay on the picture and the steps card)
  await sleep(2.0);
  const N = Number(process.env.WALK_N ?? 30);
  for (let i = 0; i < N; i++) {
    const it = await page.evaluate(() => { const x = window.__practiceItem; return { fam: x.family, sg: x.subgoal, input: x.input, ans: x.answer, pic: x.picture ? Object.keys(x.picture).join('') : '', n: (x.choices ?? []).length }; });
    const wrong = i % 3 === 1;
    if (it.input === 'num') await typeNum(wrong ? it.ans.v + 1 : it.ans.v);
    else if (it.input === 'pair') await page.evaluate((x, y) => { const [a, b] = document.querySelectorAll('.panel .ans input'); a.value = x; b.value = y; }, String(wrong ? it.ans.y : it.ans.x), String(wrong ? it.ans.x : it.ans.y));
    else await page.evaluate(i => document.querySelectorAll('.panel .opts button')[i].click(), wrong ? (it.ans.i + 1) % it.n : it.ans.i);
    await sleep(2.2);
    const show = i < 6 || wrong;
    if (show) await shot(`practice-${i + 1}-${it.sg}-${it.fam}`);
    await click('Check'); await sleep(wrong ? 3.8 : 0.6);
    if (show) await shot(`practice-${i + 1}-${it.fam}-${wrong ? 'wrong' : 'right'}`);
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
