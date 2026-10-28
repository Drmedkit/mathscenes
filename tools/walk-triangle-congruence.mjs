// walk-triangle-congruence.mjs: click through "Triangle congruence" like a student would (right and wrong answers)
// and screenshot every state.   node tools/walk-triangle-congruence.mjs [base url] [out dir]
// Needs the dev server (port 5290). Headless, muted (--mute-audio and ?mute). WALK_ONLY=practice skips to practice.
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] ?? 'http://localhost:5290/lessons/triangle-congruence.html?mute&fresh&seed=7';
const out = process.argv[3] ?? 'out/walk-triangle-congruence';
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
    await sleep(3.0); await shot('question');
    await click('Yes, always'); await click('Pretty sure'); await shot('question-picked'); await click('Find out');
    // worked example
    await sleep(1.8); await shot('example-start');
    await click('Read'); await sleep(6.2); await shot('example-marks');
    await click('Look'); await sleep(3.0); await shot('example-included');
    await click('Move'); await sleep(2.0); await shot('example-move-slide'); await sleep(2.2); await shot('example-move-turn'); await sleep(3.6); await shot('example-moved');
    await click('Write'); await sleep(2.6); await shot('example-written');
    await click('It does not matter'); await sleep(0.3); await shot('example-why-wrong');
    await click('The angle between'); await sleep(0.3); await click('Your turn');
    // your turn: the bowtie with the proof frame
    await sleep(2.0); await shot('turn-start');
    await click('△AEB ≅ △DEC'); await sleep(0.3); await shot('turn-decoy');
    await click('△AEB ≅ △CED'); await sleep(0.3); await shot('turn-too-early');
    await click('A̅E̅ ≅ C̅E̅'); await sleep(0.6); await click('B̅E̅ ≅ D̅E̅'); await sleep(0.6);
    await click('∠AEB ≅ ∠CED'); await sleep(0.6); await shot('turn-order-4');
    await click('△AEB ≅ △CED'); await sleep(1.2); await shot('turn-ordered');
    await click('Definition of midpoint'); await sleep(0.5); await click('Definition of midpoint'); await sleep(0.5);
    await click('Alternate Interior'); await sleep(0.3); await shot('turn-reason-wrong');
    await click('Vertical Angles'); await sleep(0.5); await click('SSA'); await sleep(0.3); await shot('turn-ssa');
    await click('SAS'); await sleep(1.4); await shot('turn-proved');
    await click('A̅B̅ ≅ D̅E̅'); await sleep(0.3); await shot('turn-cpctc-wrong');
    await click('A̅B̅ ≅ C̅D̅'); await sleep(1.0); await shot('turn-done');
    await click('Prove it');
    // prove it: the SSA swing and HL
    await sleep(2.0); await shot('prove-start'); await click('Not always'); await sleep(0.6); await shot('prove-chain');
    await click('The two triangles face'); await sleep(0.3); await shot('prove-chip-wrong');
    await click('The angle at A fixes'); await sleep(1.4); await shot('prove-claim1');
    await click('The circle crosses'); await sleep(3.8); await shot('prove-swing');
    await click('△ABC₁ and △ABC₂'); await sleep(3.0); await shot('prove-two-triangles');
    await click('Two: the circle'); await sleep(0.3); await shot('prove-hl-wrong');
    await click('One: the second point'); await sleep(5.2); await shot('prove-hl'); await sleep(5.8); await shot('prove-callback');
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
