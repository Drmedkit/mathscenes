// walk-choose-the-form.mjs: click through the "choose the form" lesson like a kid would (right and wrong answers)
// and screenshot every state.   node tools/walk-choose-the-form.mjs [base url] [out dir]
// Needs the dev server (port 5290). Headless, muted (--mute-audio and ?mute). WALK_ONLY=practice skips to practice.
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] ?? 'http://localhost:5290/lessons/choose-the-form.html?mute&fresh&seed=7';
const out = process.argv[3] ?? 'out/walk-choose-the-form';
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
    await sleep(5.0); await shot('question');
    await click('Only Leo'); await click('Pretty sure'); await shot('question-picked'); await click('Find out');
    // worked example
    await sleep(0.8); await shot('example-start');
    await click('Name it'); await sleep(4.6); await shot('example-names');
    await click('Cut it'); await sleep(6.2); await shot('example-fraction');
    await click('Multiply'); await sleep(4.2); await shot('example-decimal');
    await click('Choose'); await sleep(3.6); await shot('example-choose');
    await click('Here it was luck'); await sleep(0.3); await shot('example-why-wrong');
    await click('25%, 1/4'); await sleep(0.3); await click('Your turn');
    // your turn
    await sleep(9.0); await shot('turn-route');
    await click('Divide $45 by 18'); await sleep(0.5); await shot('turn-route-wrong');
    await click('Split it'); await sleep(3.2); await shot('turn-ten');
    await typeNum(0.45); await click('Check'); await sleep(0.3); await shot('turn-ten-wrong');
    await typeNum(4.5); await click('Check'); await sleep(3.0); await shot('turn-total');
    await typeNum(3.6); await click('Check'); await sleep(0.3); await shot('turn-total-wrong');
    await typeNum(8.1); await click('Check'); await sleep(4.8); await shot('turn-done');
    await click('Prove it');
    // prove it
    await sleep(4.5); await shot('prove-start');
    await click('Ava is wrong'); await sleep(0.3); await shot('prove-chips');
    await click('Any decimal'); await sleep(0.3); await shot('prove-wrong-chip');
    await click('One third is'); await sleep(2.8); await shot('prove-1');
    await click('Cut $900'); await sleep(2.6); await shot('prove-2');
    await click('Three shares'); await sleep(7.5); await shot('prove-3');
    await click('Practice');
  } else {
    await page.goto(base + '&part=4&open', { waitUntil: 'networkidle0' });
    await page.waitForFunction('window.lessonReady');
  }
  // practice: right, but every third item wrong (feedback, the worked solution and the twin)
  await sleep(2.0);
  const N = Number(process.env.WALK_N ?? 12);
  for (let i = 0; i < N; i++) {
    const it = await page.evaluate(() => { const x = window.__practiceItem; return { fam: x.family, sg: x.subgoal, input: x.input, ans: x.answer, nc: (x.choices || []).length, pic: !!(x.picture && x.picture.form) }; });
    const wrong = i % 3 === 1;
    if (it.input === 'num') await typeNum(wrong ? it.ans.v + 1 : it.ans.v);
    else if (it.input === 'frac') await page.evaluate((a, wrong) => { const ins = [...document.querySelectorAll('.panel .ans input')]; const set = (e, v) => { if (e) e.value = String(v); }; set(ins[0], a.w || ''); set(ins[1], wrong ? a.n + 1 : a.n); set(ins[2], a.d); }, it.ans, wrong);
    else await page.evaluate(i => document.querySelectorAll('.panel .opts button')[i].click(), wrong ? (it.ans.i + 1) % Math.max(2, it.nc) : it.ans.i);
    await sleep(it.pic ? 3.0 : 0.9);
    await shot(`practice-${i + 1}-${it.sg}-${it.fam}`);
    await click('Check'); await sleep(wrong ? (it.pic ? 7 : 1.0) : 0.6);
    await shot(`practice-${i + 1}-${it.fam}-${wrong ? 'wrong' : 'right'}`);
    await click(wrong ? 'Try one like it' : 'Next');
    await sleep(1.0);
  }
  await shot('practice-end');
  const log = await page.evaluate(() => window.mathscenesLessons.log('choose-the-form'));
  fs.writeFileSync(path.join(out, 'diagnosis-log.json'), JSON.stringify(log, null, 1));
  console.log(`diagnosis log: ${log.length} attempts, ${log.filter(a => a.mc).length} with a misconception; parts: ${[...new Set(log.map(a => a.part))].join(', ')}`);
} catch (e) {
  console.log('WALK FAILED:', e.message); await shot('failed');
} finally {
  console.log(errors.length ? `PAGE ERRORS:\n${errors.join('\n')}` : 'no page errors');
  await browser.close();
}
