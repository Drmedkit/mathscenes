// walk-complex-numbers.mjs: click through the complex-numbers lesson like a student would (right and wrong answers) and
// screenshot every state.   node tools/walk-complex-numbers.mjs [base url] [out dir]
// Needs the dev server (port 5290). Headless, muted (--mute-audio and ?mute). WALK_ONLY=practice skips to practice.
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] ?? 'http://localhost:5290/lessons/complex-numbers.html?mute&fresh&seed=7';
const out = process.argv[3] ?? 'out/walk-complex-numbers';
const only = process.env.WALK_ONLY ?? '';
fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ headless: true, args: ['--mute-audio', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
const page = await browser.newPage();
const errors = [];
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
    const norm = s => s.replace(/\s+/g, ' ').replace(/ /g, ' ').trim();
    const b = [...document.querySelectorAll(sel)].find(x => norm(x.textContent).startsWith(text) && !x.disabled && x.offsetParent);
    if (!b) return false; b.click(); return true;
  }, text, sel);
  if (!ok) throw new Error(`no button "${text}"`);
}
async function typePair(x, y) { await page.evaluate((x, y) => { const [a, b] = document.querySelectorAll('.panel .ans input'); a.value = x; b.value = y; }, String(x), String(y)); }
async function typeNum(v) { await page.evaluate(v => { const i = document.querySelector('.panel .ans input'); i.value = v; }, String(v)); }

try {
  if (only !== 'practice') {
    await page.goto(base, { waitUntil: 'networkidle0' });
    await page.waitForFunction('window.lessonReady');
    await sleep(4.0); await shot('question');
    await click('11 + 14i'); await click('Pretty sure'); await shot('question-picked'); await click('Find out');
    // worked example
    await sleep(0.8); await shot('example-start');
    await click('Turn it'); await sleep(7.0); await shot('example-turn');
    await click('Fill the box'); await sleep(7.0); await shot('example-cells');
    await click('Replace it'); await sleep(3.4); await shot('example-turned');
    await click('Collect'); await sleep(4.4); await shot('example-collect');
    await click('Because i = −1'); await sleep(0.6); await shot('example-why-wrong');
    await click('Because i2 = −1'); await sleep(0.3); await click('Your turn');
    // your turn
    await sleep(5.6); await shot('turn-start');
    await typeNum(-8); await click('Check'); await sleep(0.3); await shot('turn-i2-wrong');
    await typeNum(8); await click('Check'); await sleep(3.6); await shot('turn-i2');
    await typePair(-5, 10); await click('Check'); await sleep(0.3); await shot('turn-sum-wrong');
    await typePair(11, 10); await click('Check'); await sleep(2.0); await shot('turn-done');
    await click('Prove it');
    // prove it
    await sleep(2.6); await click('Sam is wrong'); await sleep(0.3); await shot('prove-start');
    await click('√a · √b = √(ab) for all'); await sleep(0.3); await shot('prove-wrong-chip');
    await click('√(−k) = i√k'); await sleep(2.8); await shot('prove-1');
    await click('Multiply the numbers'); await sleep(2.8); await shot('prove-2');
    await click('i2 = −1: two quarter'); await sleep(7.0); await shot('prove-3');
    await click('Practice');
  } else {
    await page.goto(base + '&part=4&open', { waitUntil: 'networkidle0' });
    await page.waitForFunction('window.lessonReady');
  }
  // practice: right, but every third item wrong (feedback, the steps card, the replay and the twin)
  await sleep(2.0);
  const N = Number(process.env.WALK_N ?? 40);
  for (let i = 0; i < N; i++) {
    const it = await page.evaluate(() => { const x = window.__practiceItem; return { fam: x.family, sg: x.subgoal, input: x.input, ans: x.answer, nch: (x.choices ?? []).length, pic: !!(x.picture && (x.picture.box || x.picture.plane || x.picture.sets || x.picture.lines || x.picture.graph)) }; });
    const wrong = i % 3 === 1;
    if (it.input === 'num') await typeNum(wrong ? it.ans.v + 1 : it.ans.v);
    else if (it.input === 'pair') await page.evaluate((x, y) => { const [a, b] = document.querySelectorAll('.panel .ans input'); a.value = x; b.value = y; }, String(wrong ? it.ans.x + 1 : it.ans.x), String(it.ans.y));
    else await page.evaluate(i => document.querySelectorAll('.panel .opts button')[i].click(), wrong ? (it.ans.i + 1) % it.nch : it.ans.i);
    await sleep(it.pic ? 2.4 : 0.9);
    const show = i < 6 || wrong || it.pic;
    if (show) await shot(`practice-${i + 1}-${it.sg}-${it.fam}`);
    await click('Check'); await sleep(wrong ? (it.pic ? 7 : 1.2) : 0.6);
    if (show && wrong) await shot(`practice-${i + 1}-${it.fam}-wrong`);
    await click(wrong ? 'Try one like it' : 'Next');
    await sleep(0.8);
  }
  await shot('practice-end');
  const log = await page.evaluate(() => window.mathscenesLessons.log('complex-numbers'));
  fs.writeFileSync(path.join(out, 'diagnosis-log.json'), JSON.stringify(log, null, 1));
  console.log(`diagnosis log: ${log.length} attempts, ${log.filter(a => a.mc).length} with a misconception; parts: ${[...new Set(log.map(a => a.part))].join(', ')}`);
} catch (e) {
  console.log('WALK FAILED:', e.message); await shot('failed');
} finally {
  console.log(errors.length ? `PAGE ERRORS:\n${errors.join('\n')}` : 'no page errors');
  await browser.close();
}
