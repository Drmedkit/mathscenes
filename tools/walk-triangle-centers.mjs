// walk-triangle-centers.mjs: click through "Midsegments and points of concurrency" like a student would (right and wrong answers)
// and screenshot every state.   node tools/walk-triangle-centers.mjs [base url] [out dir]
// Needs the dev server (port 5290). Headless, muted (--mute-audio and ?mute). WALK_ONLY=practice skips to practice.
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] ?? 'http://localhost:5290/lessons/triangle-centers.html?mute&fresh&seed=7';
const out = process.argv[3] ?? 'out/walk-triangle-centers';
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
async function typeNum(v) { await page.evaluate(v => { const all = document.querySelectorAll('.panel .ans input'); const i = all[all.length - 1]; i.value = v; }, String(v)); }

try {
  if (only !== 'practice') {
    await page.goto(base, { waitUntil: 'networkidle0' });
    await page.waitForFunction('window.lessonReady');
    await sleep(3.0); await shot('question');
    await click('The middle'); await click('Pretty sure'); await shot('question-picked'); await click('Find out');
    // worked example: four centers
    await sleep(1.8); await shot('example-start');
    await click('Draw'); await sleep(4.2); await shot('example-centroid');
    await click('Draw'); await sleep(5.6); await shot('example-incenter');
    await click('Draw'); await sleep(3.0); await shot('example-camera'); await sleep(5.4); await shot('example-circumcenter');
    await click('Draw'); await sleep(4.6); await shot('example-orthocenter');
    await click('O is in the middle'); await sleep(0.3); await shot('example-why-wrong');
    await click('O is on the perpendicular'); await sleep(0.4); await shot('example-why-right'); await click('Your turn');
    // your turn: midsegment (worked), AG and GN typed
    await sleep(4.2); await shot('turn-start');
    await typeNum(6); await click('Check'); await sleep(0.4); await shot('turn-ag-wrong');
    await typeNum(8); await click('Check'); await sleep(2.4); await shot('turn-ag-right');
    await typeNum(10); await click('Check'); await sleep(0.4); await shot('turn-gn-wrong');
    await typeNum(5); await click('Check'); await sleep(2.6); await shot('turn-done');
    await click('Prove it');
    // prove it: the proof frame, then concurrency
    await sleep(2.0); await shot('prove-start');
    await click('∠PAM ≅ ∠PBM'); await sleep(0.3); await shot('prove-decoy');
    await click('△PMA ≅ △PMB'); await sleep(0.3); await shot('prove-too-early');
    await click('A̅M̅ ≅ B̅M̅'); await sleep(0.5); await click('∠PMA ≅ ∠PMB'); await sleep(0.5); await click('P̅M̅ ≅ P̅M̅'); await sleep(0.5);
    await click('△PMA ≅ △PMB'); await sleep(0.5); await click('P̅A̅ ≅ P̅B̅'); await sleep(1.0); await shot('prove-ordered');
    await click('Definition of midpoint'); await sleep(0.4); await click('Definition of perpendicular'); await sleep(0.4); await click('Reflexive'); await sleep(0.4);
    await click('SSA'); await sleep(0.3); await shot('prove-ssa');
    await click('SAS'); await sleep(0.4); await click('CPCTC'); await sleep(1.0); await shot('prove-proved');
    await sleep(3.6); await shot('prove-towns');
    await click('Any two lines'); await sleep(0.3); await shot('prove-two-meet');
    await click('OA = OB'); await sleep(3.0); await shot('prove-third'); await sleep(6.0); await shot('prove-callback');
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
