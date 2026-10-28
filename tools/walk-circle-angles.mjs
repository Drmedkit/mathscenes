// walk-circle-angles.mjs: click through "Arcs and angles in circles" like a student would (right and wrong answers)
// and screenshot every state.   node tools/walk-circle-angles.mjs [base url] [out dir]
// Needs the dev server (port 5290). Headless, muted (--mute-audio and ?mute). WALK_ONLY=practice skips to practice.
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] ?? 'http://localhost:5290/lessons/circle-angles.html?mute&fresh&seed=7';
const out = process.argv[3] ?? 'out/walk-circle-angles';
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

const timer = setTimeout(() => { console.log('WALK TIMEOUT'); process.exit(2); }, 420000);
try {
  if (only !== 'practice') {
    await page.goto(base, { waitUntil: 'networkidle0' });
    await page.waitForFunction('window.lessonReady');
    await sleep(3.0); await shot('question');
    await click('Pnearest'); await click('Pretty sure'); await shot('question-picked'); await click('Find out');
    // worked example: one arc, three angles
    await sleep(1.8); await shot('example-start');
    await click('Measure'); await sleep(2.0); await shot('example-central');
    await click('Slide C'); await sleep(2.2); await shot('example-sliding'); await sleep(3.4); await shot('example-inscribed');
    await click('Push C across'); await sleep(1.4); await shot('example-crossing'); await sleep(2.6); await shot('example-major');
    await click('C is twice'); await sleep(0.3); await shot('example-why-wrong');
    await click('two radii make'); await sleep(0.4); await shot('example-why-right'); await click('Your turn');
    // your turn
    await sleep(4.6); await shot('turn-start');
    await typeNum(128); await click('Check'); await sleep(0.4); await shot('turn-d-wrong');
    await typeNum(64); await click('Check'); await sleep(2.6); await shot('turn-d-right');
    await typeNum(64); await click('Check'); await sleep(0.4); await shot('turn-e-wrong');
    await typeNum(116); await click('Check'); await sleep(2.6); await shot('turn-done');
    await click('Prove it');
    // prove it: the base case
    await sleep(2.0); await shot('prove-start');
    await click('OA = AC'); await sleep(0.3); await shot('prove-decoy');
    await click('m∠AOB = 2x'); await sleep(0.3); await shot('prove-too-early');
    await click('OA = OC', 'button', true); await sleep(0.5); await click('m∠OAC = x', 'button', true); await sleep(0.5);
    await click('m∠AOB = 2x', 'button', true); await sleep(0.5); await click('m(arc AB) = 2x', 'button', true); await sleep(0.5);
    await click('x = ½ m(arc AB)', 'button', true); await sleep(1.0); await shot('prove-ordered');
    await click('All radii'); await sleep(0.4);
    await click('Inscribed Angle Theorem'); await sleep(0.3); await shot('prove-circular');
    await click('Isosceles base'); await sleep(0.4); await click('Exterior Angle'); await sleep(0.4); await click('Definition of arc'); await sleep(0.4);
    await click('Division Property'); await sleep(1.0); await shot('prove-proved');
    await sleep(3.6); await shot('prove-plaza');
    await click('P sees it widest'); await sleep(0.3); await shot('prove-near');
    await click('35°'); await sleep(2.0); await shot('prove-labels'); await sleep(1.6); await shot('prove-callback');
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
    await sleep(1.6);
    const show = i < 6 || wrong;
    if (show) await shot(`practice-${i + 1}-${it.sg}-${it.fam}`);
    await click('Check'); await sleep(wrong ? 3.2 : 0.5);
    if (show && wrong) await shot(`practice-${i + 1}-${it.fam}-wrong`);
    await click(wrong ? 'Try one like it' : 'Next');
    await sleep(0.7);
  }
  await shot('practice-end');
  const log = await page.evaluate(() => window.__lesson.store.attempts());
  fs.writeFileSync(path.join(out, 'diagnosis-log.json'), JSON.stringify(log, null, 1));
  console.log(`diagnosis log: ${log.length} attempts, ${log.filter(a => a.mc).length} with a misconception; parts: ${[...new Set(log.map(a => a.part))].join(', ')}`);
} catch (e) {
  console.log('WALK FAILED:', e.message); await shot('failed');
} finally {
  clearTimeout(timer);
  console.log(errors.length ? `PAGE ERRORS:\n${errors.join('\n')}` : 'no page errors');
  await browser.close();
}
