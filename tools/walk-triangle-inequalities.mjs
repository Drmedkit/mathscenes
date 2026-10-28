// walk-triangle-inequalities.mjs: click through "Isosceles triangles and side-angle order" like a student would (right
// and wrong answers) and screenshot every state.   node tools/walk-triangle-inequalities.mjs [base url] [out dir]
// Needs the dev server (port 5290). Headless, muted (--mute-audio and ?mute). WALK_ONLY=practice skips to practice.
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] ?? 'http://localhost:5290/lessons/triangle-inequalities.html?mute&fresh&seed=7';
const out = process.argv[3] ?? 'out/walk-triangle-inequalities';
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
const ov = s => [...s].map(ch => ch + '̅').join('');
async function shot(name) { n++; const f = path.join(out, `${String(n).padStart(2, '0')}-${name}.png`); await page.screenshot({ path: f }); console.log(f); }
async function click(text, sel = 'button') {
  const ok = await page.evaluate((text, sel) => {
    const norm = s => s.replace(/\s+/g, ' ').trim();
    const b = [...document.querySelectorAll(sel)].find(x => norm(x.textContent).startsWith(text) && !x.disabled && x.offsetParent);
    if (!b) return false; b.click(); return true;
  }, text, sel);
  if (!ok) throw new Error(`no button "${text}"`);
}
async function typeNum(v, k = 0) { await page.evaluate((v, k) => { const i = document.querySelectorAll('.panel .ans input')[k]; i.value = v; }, String(v), k); }

try {
  if (only !== 'practice') {
    await page.goto(base, { waitUntil: 'networkidle0' });
    await page.waitForFunction('window.lessonReady');
    await sleep(3.0); await shot('question');
    await click('Yes, a very flat one'); await click('Pretty sure'); await shot('question-picked'); await click('Find out');
    // worked example
    await sleep(1.8); await shot('example-start');
    await click('Read'); await sleep(2.6); await shot('example-marks');
    await click('Flip'); await sleep(1.6); await shot('example-flipping'); await sleep(5.0); await shot('example-flipped');
    await click('Read off'); await sleep(2.6); await shot('example-angles');
    await click('Stretch'); await sleep(2.0); await shot('example-stretching'); await sleep(2.8); await shot('example-stretched');
    await click('The triangle looks'); await sleep(0.3); await shot('example-why-wrong');
    await click('The match'); await sleep(0.3); await click('Your turn');
    // your turn
    await sleep(2.0); await shot('turn-start');
    await typeNum(40); await click('Check'); await sleep(0.4); await shot('turn-a-wrong');
    await typeNum(70); await click('Check'); await sleep(3.6); await shot('turn-a-right');
    await click('Next triangle'); await sleep(1.2); await shot('turn-b');
    await click(ov('XY')); await sleep(0.3); await shot('turn-b-wrong');
    await click(ov('YZ')); await sleep(2.4); await shot('turn-b-right');
    await click('Next triangle'); await sleep(1.2); await shot('turn-c');
    await click('KM, JM, JK'); await sleep(0.3); await shot('turn-c-wrong');
    await click('KM, JK, JM'); await sleep(4.2); await shot('turn-done');
    await click('Prove it');
    // prove it: the triangle inequality, then the flat case
    await sleep(2.0); await shot('prove-start'); await click('Always'); await sleep(0.6); await shot('prove-chain');
    await click('BD looks longer'); await sleep(0.3); await shot('prove-chip-wrong');
    await click('AD = AC by construction'); await sleep(3.0); await shot('prove-claim1');
    await click('∠BCD is ∠BCA'); await sleep(1.6); await shot('prove-claim2');
    await click('In △BCD'); await sleep(3.0); await shot('prove-claim3');
    await click('It is a very flat'); await sleep(0.3); await shot('prove-flat-wrong');
    await click('Then AC + CB'); await sleep(2.6); await shot('prove-arcs'); await sleep(3.2); await shot('prove-flat'); await sleep(5.2); await shot('prove-callback');
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
    else if (it.input === 'pair') { await typeNum(wrong ? 0 : it.ans.x, 0); await typeNum(it.ans.y, 1); }
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
