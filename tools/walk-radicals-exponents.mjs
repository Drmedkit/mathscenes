// walk-radicals-exponents.mjs: click through "Radicals and rational exponents" like a student would (right and wrong
// answers) and screenshot every state.   node tools/walk-radicals-exponents.mjs [base url] [out dir]
// Needs the dev server (port 5290). Headless, muted (--mute-audio and ?mute). WALK_ONLY=practice skips to practice.
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] ?? 'http://localhost:5290/lessons/radicals-exponents.html?mute&fresh&seed=7';
const out = process.argv[3] ?? 'out/walk-radicals-exponents';
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
async function typeIn(vals) { await page.evaluate(vals => { const ins = [...document.querySelectorAll('.panel .ans input')]; vals.forEach((v, i) => { if (ins[i]) ins[i].value = v; }); }, vals.map(String)); }

try {
  if (only !== 'practice') {
    await page.goto(base, { waitUntil: 'networkidle0' });
    await page.waitForFunction('window.lessonReady');
    await sleep(5.0); await shot('question');
    await click('163'); await click('Pretty sure'); await shot('question-picked'); await click('Find out');
    // worked example
    await sleep(0.8); await shot('example-start');
    await click('Show'); await sleep(5.6); await shot('example-whole');
    await click('Split'); await sleep(7.6); await shot('example-split');
    await click('Hop'); await sleep(3.4); await shot('example-hops');
    await click('Compare'); await sleep(2.8); await shot('example-compare');
    await click('8 ×'); await sleep(0.3); await shot('example-why-wrong');
    await click('Three equal hops'); await sleep(0.3); await click('Your turn');
    // your turn
    await sleep(10.5); await shot('turn-given');
    await typeIn([12]); await click('Check'); await sleep(0.3); await shot('turn-pos-wrong');
    await typeIn([8]); await click('Check'); await sleep(3.0); await shot('turn-pos');
    await typeIn([-1, 8]); await click('Check'); await sleep(0.3); await shot('turn-neg-wrong');
    await typeIn([1, 8]); await click('Check'); await sleep(4.8); await shot('turn-done');
    await click('Prove it');
    // prove it
    await sleep(3.6); await shot('prove-start');
    await click('Jay is right'); await sleep(0.5); await shot('prove-judge');
    await click('Step 1'); await sleep(0.6); await shot('prove-step-wrong'); await sleep(2.2);
    await click('Step 3'); await sleep(0.4); await shot('prove-step');
    await click('(−8)1/3 is not'); await sleep(0.3); await shot('prove-wrong-chip');
    await click('(−2)3 = −8'); await sleep(1.4); await shot('prove-1');
    await click('An exponent is read'); await sleep(1.4);
    await click('Exponent laws hold'); await sleep(0.3); await shot('prove-wrong-chip-2');
    await click('Squaring throws'); await sleep(1.6); await shot('prove-3');
    await click('The power-of-a-power'); await sleep(4.4); await shot('prove-4-done');
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
    if (it.input === 'num') await typeIn([wrong ? it.ans.v + 1 : it.ans.v]);
    else if (it.input === 'pair') await typeIn(wrong ? [it.ans.x + 1, it.ans.y] : [it.ans.x, it.ans.y]);
    else if (it.input === 'frac') await typeIn([wrong ? it.ans.w + 1 : (it.ans.w || ''), it.ans.n || '', it.ans.n ? it.ans.d : '']);
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
