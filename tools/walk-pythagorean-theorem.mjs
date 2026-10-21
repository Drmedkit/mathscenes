// walk-pythagorean-theorem.mjs: click through the Pythagorean theorem lesson like a kid would (the right AND one wrong
// answer per part) and screenshot every state.   node tools/walk-pythagorean-theorem.mjs [base url] [out dir]
// Needs the dev server (port 5290). Headless, muted (--mute-audio and ?mute). WALK_ONLY=practice skips to practice.
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] ?? 'http://localhost:5290/lessons/pythagorean-theorem.html?mute&fresh&seed=7';
const out = process.argv[3] ?? 'out/walk-pythagorean-theorem';
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
// the panel must fit the screen in every state of every part: its bottom is measured at every screenshot
const overflow = {};
async function shot(name) {
  n++; const f = path.join(out, `${String(n).padStart(2, '0')}-${name}.png`); await page.screenshot({ path: f }); console.log(f);
  const o = await page.evaluate(() => Math.max(0, Math.round((document.querySelector('.panel')?.getBoundingClientRect().bottom ?? 0) - innerHeight)));
  const part = name.split('-')[0];
  overflow[part] = Math.max(overflow[part] ?? 0, o);
  if (o > 0) errors.push(`panel overflows by ${o} px at ${name}`);
}
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
    // 1. the question: pick 14 (adds the run and the rise)
    await sleep(4.0); await shot('question');
    await click('14'); await click('Pretty sure'); await shot('question-picked'); await click('Find out');
    // 2. worked example
    await sleep(0.8); await shot('example-start');
    await click('Draw it'); await sleep(5.0); await shot('example-triangle');
    await click('Read them'); await sleep(4.0); await shot('example-legs');
    await click('Add the squares'); await sleep(4.4); await shot('example-squares');
    await click('Finish'); await sleep(5.6); await shot('example-root');
    await click('9 and 12 are where'); await sleep(0.3); await shot('example-why-wrong');
    await click('A leg is how far'); await sleep(0.3); await click('Your turn');
    // 3. your turn: the box
    await sleep(8.4); await shot('turn-floor');
    await click('Triangle ABC'); await sleep(1.0); await shot('turn-tri-wrong'); await sleep(2.4);
    await click('Triangle ACG'); await sleep(4.6); await shot('turn-tri');
    await typeNum(17); await click('Check'); await sleep(0.3); await shot('turn-sq-wrong');
    await typeNum(169); await click('Check'); await sleep(2.0); await shot('turn-sq');
    await typeNum(169); await click('Check'); await sleep(0.3); await shot('turn-len-wrong');
    await typeNum(13); await click('Check'); await sleep(2.6); await shot('turn-len');
    await click('Prove it');
    // 4. prove it: the converse
    await sleep(4.0); await click('Her reason is good'); await sleep(0.3); await shot('prove-start');
    await click('Every rule works'); await sleep(0.3); await shot('prove-wrong-chip');
    await click('Perpendicular sides'); await sleep(2.6); await shot('prove-1');
    await click('The theorem applies'); await sleep(2.2); await shot('prove-2');
    await click('Same three sides'); await sleep(1.6); await shot('prove-3-moving'); await sleep(4.6); await shot('prove-3');
    await click('Practice');
  } else {
    await page.goto(base + '&part=4&open', { waitUntil: 'networkidle0' });
    await page.waitForFunction('window.lessonReady');
  }
  // practice: right, but every third item wrong (feedback, the worked solution replay and the twin)
  await sleep(2.0);
  const N = Number(process.env.WALK_N ?? 36);
  for (let i = 0; i < N; i++) {
    const it = await page.evaluate(() => { const x = window.__practiceItem; return { fam: x.family, sg: x.subgoal, input: x.input, ans: x.answer, nch: (x.choices ?? []).length }; });
    const wrong = i % 3 === 1;
    if (it.input === 'num') await typeNum(wrong ? it.ans.v + 1 : it.ans.v);
    else if (it.input === 'pair') await page.evaluate((x, y) => { const [a, b] = document.querySelectorAll('.panel .ans input'); a.value = x; b.value = y; }, String(wrong ? it.ans.y + 1 : it.ans.x), String(wrong ? it.ans.x : it.ans.y));
    else await page.evaluate(i => document.querySelectorAll('.panel .opts button')[i].click(), wrong ? (it.ans.i + 1) % it.nch : it.ans.i);
    await sleep(2.2);
    await shot(`practice-${i + 1}-${it.sg}-${it.fam}`);
    await click('Check'); await sleep(wrong ? 7.5 : 0.6);
    if (wrong) await shot(`practice-${i + 1}-${it.fam}-wrong`);
    await click(wrong ? 'Try one like it' : 'Next');
    await sleep(1.0);
  }
  await shot('practice-end');
  const log = await page.evaluate(() => window.mathscenesLessons.log('pythagorean-theorem'));
  fs.writeFileSync(path.join(out, 'diagnosis-log.json'), JSON.stringify(log, null, 1));
  console.log(`diagnosis log: ${log.length} attempts, ${log.filter(a => a.mc).length} with a misconception; parts: ${[...new Set(log.map(a => a.part))].join(', ')}`);
} catch (e) {
  console.log('WALK FAILED:', e.message); await shot('failed');
} finally {
  console.log(`panel overflow (px) by part: ${JSON.stringify(overflow)}`);
  console.log(errors.length ? `PAGE ERRORS:\n${errors.join('\n')}` : 'no page errors');
  await browser.close();
}
