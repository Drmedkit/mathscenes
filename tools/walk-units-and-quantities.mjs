// walk-units-and-quantities.mjs: click through "Reasoning with units" like a student would (right and wrong answers)
// and screenshot every state.   node tools/walk-units-and-quantities.mjs [base url] [out dir]
// Needs the dev server (port 5290). Headless, muted (--mute-audio and ?mute). WALK_ONLY=practice skips to practice.
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] ?? 'http://localhost:5290/lessons/units-and-quantities.html?mute&fresh&seed=7';
const out = process.argv[3] ?? 'out/walk-units-and-quantities';
const only = process.env.WALK_ONLY ?? '';
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ headless: true, args: ['--mute-audio', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
const page = await browser.newPage();
const errors = [];
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
    await sleep(3.5); await shot('question');
    await click('The greyhound'); await click('Pretty sure'); await shot('question-picked'); await click('Find out');
    // worked example
    await sleep(0.8); await shot('example-start');
    await click('Read it'); await sleep(4.2); await shot('example-read');
    await click('Convert'); await sleep(4.6); await shot('example-hours');
    await click('Convert'); await sleep(6.0); await shot('example-miles');
    await click('Race'); await sleep(5.0); await shot('example-race');
    await click('Either way'); await sleep(0.3); await shot('example-why-wrong');
    await click('The seconds on top'); await sleep(0.3); await click('Your turn');
    // your turn
    await sleep(10.5); await shot('turn-pick');
    await click('3,600 s'); await sleep(0.5); await shot('turn-pick-wrong');
    await click('1 h3,600 s'); await sleep(2.6); await shot('turn-factor');
    await typeNum(316800); await click('Check'); await sleep(0.3); await shot('turn-x-wrong');
    await typeNum(88); await click('Check'); await sleep(2.0); await shot('turn-x');
    await typeNum(90); await click('Check'); await sleep(0.3);
    await typeNum(88); await click('Check'); await sleep(5.0); await shot('turn-check');
    await click('Prove it');
    // prove it
    await sleep(4.0); await shot('prove-intro'); await click('Jo is wrong'); await sleep(0.3); await shot('prove-start');
    await click('Changing feet'); await sleep(0.3); await shot('prove-wrong-chip');
    await click('× 12 fills'); await sleep(4.0); await shot('prove-1');
    await click('It is 12 in by'); await sleep(5.0); await shot('prove-2');
    await click('Each of the 120'); await sleep(2.5); await shot('prove-3');
    await click('Practice');
  } else {
    await page.goto(base + '&part=4&open', { waitUntil: 'networkidle0' });
    await page.waitForFunction('window.lessonReady');
  }
  await sleep(2.0);
  const N = Number(process.env.WALK_N ?? 50);
  const seenSg = new Set();
  for (let i = 0; i < N; i++) {
    const it = await page.evaluate(() => { const x = window.__practiceItem; return { fam: x.family, sg: x.subgoal, input: x.input, ans: x.answer, n: (x.choices ?? []).length, pic: !!x.picture }; });
    const wrong = i % 3 === 1;
    if (it.input === 'num') await typeNum(wrong ? it.ans.v + 1 : it.ans.v);
    else if (it.input === 'pair') await page.evaluate((x, y) => { const [a, b] = document.querySelectorAll('.panel .ans input'); a.value = x; b.value = y; }, String(wrong ? it.ans.y : it.ans.x), String(wrong ? it.ans.x : it.ans.y));
    else if (it.input === 'frac') await page.evaluate((w, nn, d) => { const [a, b, c] = document.querySelectorAll('.panel .ans input'); a.value = w; b.value = nn; c.value = d; }, String(it.ans.w), String(wrong ? it.ans.n + 1 : it.ans.n), String(it.ans.d));
    else await page.evaluate(i => document.querySelectorAll('.panel .opts button')[i].click(), wrong ? (it.ans.i + 1) % it.n : it.ans.i);
    await sleep(it.pic ? 2.4 : 0.9);
    const show = !seenSg.has(it.sg + it.fam) || wrong;
    seenSg.add(it.sg + it.fam);
    if (show) await shot(`practice-${i + 1}-${it.fam}`);
    await click('Check'); await sleep(wrong ? (it.pic ? 5 : 1.0) : 0.6);
    if (wrong) await shot(`practice-${i + 1}-${it.fam}-wrong`);
    await click(wrong ? 'Try one like it' : 'Next');
    await sleep(1.0);
  }
  await shot('practice-end');
  const log = await page.evaluate(() => window.mathscenesLessons.log('units-and-quantities'));
  fs.writeFileSync(path.join(out, 'diagnosis-log.json'), JSON.stringify(log, null, 1));
  console.log(`diagnosis log: ${log.length} attempts, ${log.filter(a => a.mc).length} with a misconception; parts: ${[...new Set(log.map(a => a.part))].join(', ')}`);
} catch (e) {
  console.log('WALK FAILED:', e.message); await shot('failed');
} finally {
  console.log(errors.length ? `PAGE ERRORS:\n${[...new Set(errors)].join('\n')}` : 'no page errors');
  await browser.close();
}
