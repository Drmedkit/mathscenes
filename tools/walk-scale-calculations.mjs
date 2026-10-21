// walk-scale-calculations.mjs: click through the scale calculations lesson like a kid would (right and wrong
// answers) and screenshot every state.   node tools/walk-scale-calculations.mjs [base url] [out dir]
// Needs the dev server (port 5290). Headless, muted (--mute-audio and ?mute). WALK_ONLY=practice skips parts 1-4.
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] ?? 'http://localhost:5290/lessons/scale-calculations.html?mute&fresh&seed=7';
const out = process.argv[3] ?? 'out/walk-scale-calculations';
const only = process.env.WALK_ONLY ?? '';
fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ headless: true, args: ['--mute-audio', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
const page = await browser.newPage();
const errors = [];
// other lessons are being built in the same dev server: block Vite's HMR client so a reload elsewhere can't restart us
await page.setRequestInterception(true);
page.on('request', r => (new URL(r.url()).pathname.endsWith('/@vite/client') ? r.respond({ status: 200, contentType: 'application/javascript', body: 'export {}' }) : r.continue()));
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if ((m.type() === 'error' || m.type() === 'warn') && !/vite\/client|ERR_FAILED|favicon/.test(m.text())) errors.push(m.text()); });
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
    // 1 the question
    await sleep(4.5); await shot('question');
    await click('160 in'); await click('Pretty sure'); await shot('question-picked'); await click('Find out');
    // 2 worked example
    await sleep(0.8); await shot('example-start');
    await click('Read it'); await sleep(4.8); await shot('example-read');
    await click('Turn back'); await sleep(3.6); await shot('example-back');
    await click('Divide'); await sleep(4.8); await shot('example-divide');
    await click('Check'); await sleep(5.6); await shot('example-check');
    await click('You always multiply'); await sleep(0.3); await shot('example-why-wrong');
    await click('× 8 goes from'); await sleep(0.3); await click('Your turn');
    // 3 your turn
    await sleep(4.4); await shot('turn-way');
    await click('Divide by 8'); await sleep(1.4); await shot('turn-way-wrong'); await sleep(1.6);
    await click('Multiply by 8'); await sleep(2.8); await shot('turn-calc');
    await typeNum(16.25); await click('Check'); await sleep(0.3); await shot('turn-calc-wrong');
    await typeNum(18); await click('Check'); await sleep(3.4); await shot('turn-calc-right');
    await typeNum(144); await click('Check'); await sleep(0.3); await shot('turn-back-wrong');
    await typeNum(2.25); await click('Check'); await sleep(3.6); await shot('turn-back-right');
    await click('Prove it');
    // 4 prove it
    await sleep(3.6); await click('Sam is wrong'); await sleep(0.3); await shot('prove-start');
    await click('You must always convert'); await sleep(0.3); await shot('prove-wrong-chip');
    await click('Straight above 12 ft'); await sleep(5.6); await shot('prove-1');
    await click('1 ft = 12 in'); await sleep(2.8); await shot('prove-2');
    await click('Every 48 real'); await sleep(5.4); await shot('prove-3');
    await click('Practice');
  } else {
    await page.goto(base + '&part=4&open', { waitUntil: 'networkidle0' });
    await page.waitForFunction('window.lessonReady');
  }
  // practice: right, but every third item wrong (feedback, the worked solution and the twin)
  await sleep(2.0);
  const N = Number(process.env.WALK_N ?? 12);
  for (let i = 0; i < N; i++) {
    const it = await page.evaluate(() => { const x = window.__practiceItem; return { fam: x.family, sg: x.subgoal, input: x.input, ans: x.answer, nc: (x.choices || []).length, pic: !!(x.picture && x.picture.lines) }; });
    const wrong = i % 3 === 1;
    if (it.input === 'num') await typeNum(wrong ? it.ans.v + 1 : it.ans.v);
    else await page.evaluate(i => document.querySelectorAll('.panel .opts button')[i].click(), wrong ? (it.ans.i + 1) % it.nc : it.ans.i);
    await sleep(it.pic ? 2.6 : 0.9);
    await shot(`practice-${i + 1}-${it.sg}-${it.fam}`);
    await click('Check'); await sleep(wrong ? (it.pic ? 6.5 : 1.2) : 0.6);
    if (wrong) await shot(`practice-${i + 1}-${it.fam}-wrong`);
    await click(wrong ? 'Try one like it' : 'Next');
    await sleep(1.0);
  }
  await shot('practice-end');
  const log = await page.evaluate(() => window.mathscenesLessons.log('scale-calculations'));
  fs.writeFileSync(path.join(out, 'diagnosis-log.json'), JSON.stringify(log, null, 1));
  console.log(`diagnosis log: ${log.length} attempts, ${log.filter(a => a.mc).length} with a misconception; parts: ${[...new Set(log.map(a => a.part))].join(', ')}`);
} catch (e) {
  console.log('WALK FAILED:', e.message); await shot('failed');
} finally {
  console.log(errors.length ? `PAGE ERRORS:\n${errors.join('\n')}` : 'no page errors');
  await browser.close();
}
