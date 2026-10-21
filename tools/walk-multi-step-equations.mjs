// walk-multi-step-equations.mjs: click through parts 1-4 of the multi-step equations lesson like a kid would (a right
// AND a wrong answer per part) and screenshot every state. Practice is walked by tools/walk-practice.mjs.
//   node tools/walk-multi-step-equations.mjs [base url] [out dir]
// Needs the dev server (port 5290). Headless, muted (--mute-audio and ?mute); Vite's HMR client is blocked.
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] ?? 'http://localhost:5290/lessons/multi-step-equations.html?mute&fresh&seed=7';
const out = process.argv[3] ?? 'out/walk-multi-step-equations';
fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ headless: true, args: ['--mute-audio', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
const page = await browser.newPage();
const errors = [];
await page.setRequestInterception(true);
page.on('request', r => (new URL(r.url()).pathname.endsWith('/@vite/client') ? r.respond({ status: 200, contentType: 'application/javascript', body: 'export {}' }) : r.continue()));
page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
page.on('console', m => { if ((m.type() === 'error' || m.type() === 'warn') && !/vite|ERR_FAILED|favicon/.test(m.text())) errors.push(`console ${m.type()}: ${m.text()}`); });
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
/** fill the answer boxes: one value (a number box) or [whole, numerator, denominator] (a fraction box) */
async function typeIn(vals) {
  await page.evaluate(vals => { const ins = [...document.querySelectorAll('.panel .ans input')]; const vs = Array.isArray(vals) ? vals : [vals]; ins.forEach((i, k) => { i.value = vs[k] ?? ''; }); }, Array.isArray(vals) ? vals.map(String) : String(vals));
}

try {
  await page.goto(base, { waitUntil: 'networkidle0' });
  await page.waitForFunction('window.lessonReady');
  // 1 the question: a wrong card (the 1 not multiplied) so the callback in part 3 has something to say
  await sleep(4.0); await shot('question');
  await click('3x + 4 = 2x + 1'); await click('Pretty sure'); await shot('question-picked'); await click('Find out');
  // 2 worked example
  await sleep(0.8); await shot('example-start');
  await click('Find it'); await sleep(3.6); await shot('example-find');
  await click('Multiply'); await sleep(2.6); await shot('example-copies'); await sleep(5.4); await shot('example-cleared');
  await click('Solve'); await sleep(6.2); await shot('example-solved');
  await click('Check'); await sleep(7.0); await shot('example-check');
  await click('6 is the only'); await sleep(0.3); await shot('example-why-wrong');
  await click('Six copies of BOTH'); await sleep(0.3); await click('Your turn');
  // 3 your turn
  await sleep(7.0); await shot('turn-line');
  await click('3x + 2 = x + 3'); await sleep(2.8); await shot('turn-some-terms-tips'); await sleep(3.4);
  await click('3x + 2 = x + 12'); await sleep(8.0); await shot('turn-cleared'); await sleep(10.0); await shot('turn-split');
  await typeIn(10); await click('Check'); await sleep(0.4); await shot('turn-x-wrong');
  await typeIn(5); await click('Check'); await sleep(2.0); await shot('turn-x');
  await typeIn([17, '', '']); await click('Check'); await sleep(0.4); await shot('turn-check-derived');
  await typeIn(['', 17, 4]); await click('Check'); await sleep(7.5); await shot('turn-check');
  await click('Prove it');
  // 4 prove it
  await sleep(4.0); await shot('prove-start'); await click('Maya is wrong'); await sleep(0.3); await shot('prove-judged');
  await click('Whole numbers have'); await sleep(0.3); await shot('prove-wrong-chip');
  await click('She tripled'); await sleep(3.0); await shot('prove-1-tips'); await sleep(3.2); await shot('prove-1');
  await click('Three copies'); await sleep(7.6); await shot('prove-2');
  await click('12 off both'); await sleep(12.5); await shot('prove-3');
  await click('Practice'); await sleep(2.5); await shot('practice-start');
  const log = await page.evaluate(() => window.mathscenesLessons?.log?.('multi-step-equations') ?? []);
  fs.writeFileSync(path.join(out, 'diagnosis-log.json'), JSON.stringify(log, null, 1));
  console.log(`diagnosis log: ${log.length} attempts, ${log.filter(a => a.mc).length} with a misconception; parts: ${[...new Set(log.map(a => a.part))].join(', ')}`);
} catch (e) {
  console.log('WALK FAILED:', e.message); await shot('failed');
} finally {
  console.log(errors.length ? `PAGE ERRORS:\n${errors.join('\n')}` : 'no page errors');
  await browser.close();
}
