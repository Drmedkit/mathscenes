// walk-linear-functions-slope.mjs: click through the "Linear functions and slope" lesson like a student would (right
// and wrong answers) and screenshot every state.   node tools/walk-linear-functions-slope.mjs [base url] [out dir]
// Needs the dev server (port 5290). Headless, muted (--mute-audio and ?mute). WALK_ONLY=practice skips to practice.
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] ?? 'http://localhost:5290/lessons/linear-functions-slope.html?mute&fresh&seed=7';
const out = process.argv[3] ?? 'out/walk-linear-functions-slope';
const only = process.env.WALK_ONLY ?? '';
fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ headless: true, args: ['--mute-audio', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
const page = await browser.newPage();
const errors = [], warns = [];
// other lessons are being built in the same dev server: block Vite's HMR client so a reload elsewhere can't restart us
await page.setRequestInterception(true);
page.on('request', r => (new URL(r.url()).pathname.endsWith('/@vite/client') ? r.respond({ status: 200, contentType: 'application/javascript', body: 'export {}' }) : r.continue()));
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error' && !/vite|ERR_FAILED|favicon/.test(m.text())) errors.push(m.text()); if (m.type() === 'warn' && !/vite/.test(m.text())) warns.push(m.text()); });
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
    await sleep(4.5); await shot('question');
    await click('−2'); await click('Pretty sure'); await shot('question-picked'); await click('Find out');
    // worked example
    await sleep(0.8); await shot('example-start');
    await click('Go A to B'); await sleep(7.0); await shot('example-slope');
    await click('Slide P'); await sleep(3.0); await shot('example-slide'); await sleep(7.0); await shot('example-pointslope');
    await click('Solve for y'); await sleep(4.0); await shot('example-yalone');
    await click('Rewrite'); await sleep(6.5); await shot('example-standard');
    await click('Point-slope form only'); await sleep(0.3); await shot('example-why-wrong');
    await click('A line has the same slope'); await sleep(0.3); await click('Your turn');
    // your turn
    await sleep(6.5); await shot('turn-ps');
    await click('y + 5'); await sleep(0.4); await shot('turn-ps-wrong');
    await click('y − 5 = −2(x + 1)'); await sleep(2.2); await shot('turn-b');
    await typeNum(6); await click('Check'); await sleep(0.3); await shot('turn-b-wrong');
    await typeNum(3); await click('Check'); await sleep(3.6); await shot('turn-std');
    await click('y = −2x'); await sleep(0.4); await shot('turn-std-wrong');
    await click('2x + y = 3'); await sleep(5.5); await shot('turn-done');
    await click('Prove it');
    // prove it
    await sleep(3.5); await click('Riley is wrong'); await sleep(2.0); await shot('prove-start');
    await click('0 ÷ 6 and 6'); await sleep(0.3); await shot('prove-wrong-chip');
    await click('Δx = 2'); await sleep(3.4); await shot('prove-1');
    await click('Its rise is 0'); await sleep(3.4); await shot('prove-2');
    await click('The input 2'); await sleep(3.6); await shot('prove-3');
    await click('Practice');
  } else {
    await page.goto(base + '&part=4&open', { waitUntil: 'networkidle0' });
    await page.waitForFunction('window.lessonReady');
  }
  // practice: right, but every third item wrong (feedback, the worked solution and the twin)
  await sleep(2.0);
  const N = Number(process.env.WALK_N ?? 40);
  const famSeen = new Set();
  for (let i = 0; i < N; i++) {
    const it = await page.evaluate(() => { const x = window.__practiceItem; return { fam: x.family, sg: x.subgoal, input: x.input, ans: x.answer, nch: (x.choices ?? []).length }; });
    famSeen.add(it.fam);
    const wrong = i % 3 === 1;
    if (it.input === 'num') await typeNum(wrong ? it.ans.v + 1 : it.ans.v);
    else if (it.input === 'pair') await page.evaluate((x, y) => { const [a, b] = document.querySelectorAll('.panel .ans input'); a.value = x; b.value = y; }, String(wrong ? it.ans.y + 1 : it.ans.x), String(wrong ? it.ans.x : it.ans.y));
    else await page.evaluate(i => document.querySelectorAll('.panel .opts button')[i].click(), wrong ? (it.ans.i + 1) % it.nch : it.ans.i);
    await sleep(1.6);
    await shot(`practice-${i + 1}-${it.sg}-${it.fam}`);
    await click('Check'); await sleep(wrong ? 5.0 : 0.5);
    if (wrong) await shot(`practice-${i + 1}-${it.fam}-wrong`);
    await click(wrong ? 'Try one like it' : 'Next');
    await sleep(0.8);
  }
  await shot('practice-end');
  const log = await page.evaluate(() => window.mathscenesLessons.log('linear-functions-slope'));
  fs.writeFileSync(path.join(out, 'diagnosis-log.json'), JSON.stringify(log, null, 1));
  console.log(`diagnosis log: ${log.length} attempts, ${log.filter(a => a.mc).length} with a misconception; parts: ${[...new Set(log.map(a => a.part))].join(', ')}; families seen: ${famSeen.size}`);
} catch (e) {
  console.log('WALK FAILED:', e.message); await shot('failed');
} finally {
  console.log(errors.length ? `PAGE ERRORS:\n${errors.join('\n')}` : 'no page errors');
  if (warns.length) console.log(`WARNINGS:\n${[...new Set(warns)].join('\n')}`);
  await browser.close();
}
