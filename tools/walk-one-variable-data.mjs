// walk-one-variable-data.mjs: click through "Summarizing and comparing data" like a student would (right and wrong
// answers) and screenshot every state.   node tools/walk-one-variable-data.mjs [base url] [out dir]
// Needs the dev server (port 5290). Headless, muted (--mute-audio and ?mute). WALK_ONLY=practice skips to practice.
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] ?? 'http://localhost:5290/lessons/one-variable-data.html?mute&fresh&seed=7';
const out = process.argv[3] ?? 'out/walk-one-variable-data';
const only = process.env.WALK_ONLY ?? '';
fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ headless: true, args: ['--mute-audio', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
const page = await browser.newPage();
const errors = [];
await page.setRequestInterception(true);
page.on('request', r => (new URL(r.url()).pathname.endsWith('/@vite/client') ? r.respond({ status: 200, contentType: 'application/javascript', body: 'export {}' }) : r.continue()));
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if ((m.type() === 'error' || m.type() === 'warn') && !/vite|ERR_FAILED|favicon/.test(m.text())) errors.push(m.text()); });
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
async function typePair(x, y) { await page.evaluate((x, y) => { const [a, b] = document.querySelectorAll('.panel .ans input'); a.value = x; b.value = y; }, String(x), String(y)); }

try {
  if (only !== 'practice') {
    await page.goto(base, { waitUntil: 'networkidle0' });
    await page.waitForFunction('window.lessonReady', { timeout: 60000 });
    await sleep(4.0); await shot('question');
    await click('22'); await click('Pretty sure'); await shot('question-picked'); await click('Find out');
    // worked example
    await sleep(0.8); await shot('example-start');
    await click('Count in'); await sleep(5.5); await shot('example-median');
    await click('Split'); await sleep(6.0); await shot('example-quartiles');
    await click('Fence'); await sleep(6.5); await shot('example-fence');
    await click('Compare'); await sleep(4.5); await shot('example-compare');
    await click('The median is always'); await sleep(0.3); await shot('example-why-wrong');
    await click('The 59 pulls'); await sleep(0.3); await click('Your turn');
    // your turn
    await sleep(8.5); await shot('turn-iqr');
    await typeNum(23); await click('Check'); await sleep(0.3); await shot('turn-iqr-wrong');
    await typeNum(6); await click('Check'); await sleep(1.6); await shot('turn-fences');
    await typePair(12, 30); await click('Check'); await sleep(0.3); await shot('turn-fences-wrong');
    await typePair(9, 33); await click('Check'); await sleep(3.4); await shot('turn-whisker');
    await click('At 9'); await sleep(0.3); await shot('turn-whisker-wrong');
    await click('At 17'); await sleep(3.0); await shot('turn-done');
    await click('Prove it');
    // prove it
    await sleep(3.0); await click('Sam is wrong'); await sleep(0.3); await shot('prove-start');
    await click('Larger values'); await sleep(0.3); await shot('prove-wrong-chip');
    await click('Every value moved'); await sleep(4.2); await shot('prove-1');
    await click('A value and the mean'); await sleep(3.2); await shot('prove-2');
    await click('The SD is built'); await sleep(2.6); await shot('prove-3');
    await click('Practice');
  } else {
    await page.goto(base + '&part=4&open', { waitUntil: 'networkidle0' });
    await page.waitForFunction('window.lessonReady', { timeout: 60000 });
  }
  await sleep(2.0);
  const N = Number(process.env.WALK_N ?? 20);
  for (let i = 0; i < N; i++) {
    const it = await page.evaluate(() => { const x = window.__practiceItem; return { fam: x.family, sg: x.subgoal, input: x.input, ans: x.answer, nch: (x.choices ?? []).length }; });
    const wrong = i % 3 === 1;
    if (it.input === 'num') await typeNum(wrong ? it.ans.v + 1 : it.ans.v);
    else if (it.input === 'pair') await typePair(wrong ? it.ans.y + 1 : it.ans.x, wrong ? it.ans.x : it.ans.y);
    else await page.evaluate(i => document.querySelectorAll('.panel .opts button')[i].click(), wrong ? (it.ans.i + 1) % it.nch : it.ans.i);
    await sleep(1.6);
    await shot(`practice-${i + 1}-${it.sg}-${it.fam}`);
    await click('Check'); await sleep(wrong ? 4.5 : 0.5);
    if (wrong) await shot(`practice-${i + 1}-${it.fam}-wrong`);
    await click(wrong ? 'Try one like it' : 'Next');
    await sleep(0.8);
  }
  const log = await page.evaluate(() => window.mathscenesLessons.log('one-variable-data'));
  fs.writeFileSync(path.join(out, 'diagnosis-log.json'), JSON.stringify(log, null, 1));
  console.log(`diagnosis log: ${log.length} attempts, ${log.filter(a => a.mc).length} with a misconception; parts: ${[...new Set(log.map(a => a.part))].join(', ')}`);
} catch (e) {
  console.log('WALK FAILED:', e.message); await shot('failed');
} finally {
  console.log(errors.length ? `PAGE ERRORS:\n${errors.join('\n')}` : 'no page errors');
  await browser.close();
}
