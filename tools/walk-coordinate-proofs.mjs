// walk-coordinate-proofs.mjs: click through "Distance, midpoint and coordinate proofs" like a student would (right
// and wrong answers) and screenshot every state.   node tools/walk-coordinate-proofs.mjs [base url] [out dir]
// Needs the dev server (port 5290). Headless, muted (--mute-audio and ?mute). WALK_ONLY=practice skips to practice.
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] ?? 'http://localhost:5290/lessons/coordinate-proofs.html?mute&fresh&seed=7';
const out = process.argv[3] ?? 'out/walk-coordinate-proofs';
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
async function typePair(x, y) { await page.evaluate((x, y) => { const a = [...document.querySelectorAll('.panel .ans')]; const ins = a[a.length - 1].querySelectorAll('input'); ins[0].value = x; ins[1].value = y; }, String(x), String(y)); }

try {
  if (only !== 'practice') {
    await page.goto(base, { waitUntil: 'networkidle0' });
    await page.waitForFunction('window.lessonReady');
    await sleep(3.6); await shot('question');
    await click('Yes'); await click('Pretty sure'); await shot('question-picked'); await click('Find out');
    // worked example: one triangle, four tools
    await sleep(2.4); await shot('example-start');
    await click('Measure'); await sleep(6.0); await shot('example-distance');
    await click('AB is the run plus'); await sleep(0.4); await shot('example-why-wrong');
    await click('AB is the hypotenuse'); await sleep(0.6);
    await click('Slopes'); await sleep(3.0); await shot('example-slopes');
    await click('Average'); await sleep(2.4); await shot('example-midpoint');
    await click('Compare'); await sleep(3.6); await shot('example-circle');
    await click('Your turn');
    // your turn: P and Q
    await sleep(3.6); await shot('turn-start');
    await typeNum(14); await click('Check'); await sleep(0.4); await shot('turn-pq-wrong');
    await typeNum(10); await click('Check'); await sleep(2.4);
    await typePair(4, -3); await click('Check'); await sleep(0.4); await shot('turn-m-wrong');
    await typePair(1, -1); await click('Check'); await sleep(2.4);
    await typePair(3, 4); await click('Check'); await sleep(0.4); await shot('turn-slope-wrong');
    await typePair(4, 3); await click('Check'); await sleep(3.2); await shot('turn-done');
    await click('Prove it');
    // prove it: placement, then the Parsons proof with reasons, then the garden bed
    await sleep(2.0); await shot('prove-start');
    await click('O(0, 0), A(a, 0), B(a, c)'); await sleep(0.4); await shot('prove-placement-wrong');
    await click('O(0, 0), A(a, 0), B(a + b, c)'); await sleep(2.6); await shot('prove-placed');
    await click('OB = AC', 'button', true); await sleep(0.3); await shot('prove-decoy');
    await click('M₁ = M₂', 'button', true); await sleep(0.3); await shot('prove-too-early');
    await click('O(0, 0), A(a, 0), B(a + b, c), C(b, c)'); await sleep(0.5);
    await click('M₁ = midpoint'); await sleep(0.5); await click('M₂ = midpoint'); await sleep(0.5);
    await click('M₁ = M₂', 'button', true); await sleep(0.5); await click('OB and AC bisect'); await sleep(1.0); await shot('prove-ordered');
    await click('Moving keeps'); await sleep(0.4);
    await click('Distance formula'); await sleep(0.3); await shot('prove-reason-wrong');
    await click('Midpoint formula'); await sleep(0.4); await click('Midpoint formula'); await sleep(0.4);
    await click('Same coordinates'); await sleep(0.4); await click('A shared midpoint'); await sleep(1.0); await shot('prove-proved');
    await sleep(4.4); await shot('prove-bed');
    await click('AB² = BC²'); await sleep(0.4); await shot('prove-bed-wrong');
    await click('AC² = 144'); await sleep(4.0); await shot('prove-callback');
    await click('Practice');
  } else {
    await page.goto(base + '&part=4&open', { waitUntil: 'networkidle0' });
    await page.waitForFunction('window.lessonReady');
  }
  // practice: right, but every third item wrong (feedback, the replay on the picture and the steps card)
  await sleep(2.0);
  const N = Number(process.env.WALK_N ?? 36);
  for (let i = 0; i < N; i++) {
    const it = await page.evaluate(() => { const x = window.__practiceItem; return { fam: x.family, sg: x.subgoal, input: x.input, ans: x.answer, n: (x.choices ?? []).length }; });
    const wrong = i % 3 === 1;
    if (it.input === 'num') await typeNum(wrong ? it.ans.v + 1 : it.ans.v);
    else if (it.input === 'pair') await typePair(wrong ? it.ans.x + 1 : it.ans.x, it.ans.y);
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
