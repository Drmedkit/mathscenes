// walk-pie-charts.mjs: click through the circle-graph lesson like a kid would (right and wrong answers), screenshot
// every state.   node tools/walk-pie-charts.mjs [base url] [out dir]
// Needs the dev server (port 5290). Headless, ALWAYS muted (--mute-audio and ?mute).
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] ?? 'http://localhost:5290/lessons/pie-charts.html?mute&fresh&seed=7';
const out = process.argv[3] ?? 'out/walk-pie-charts';
const ITEMS = Number(process.argv[4] ?? 40);
fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ headless: true, args: ['--mute-audio', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
// other topics are edited in the same dev server: keep Vite's HMR socket silent so their edits don't reload this page
await page.evaluateOnNewDocument(() => {
  const Real = window.WebSocket;
  window.WebSocket = function (url, p) {
    if (String(url).includes('token=') || String(p).includes('vite')) return { addEventListener() {}, removeEventListener() {}, send() {}, close() {}, readyState: 0 };
    return new Real(url, p);
  };
});
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
async function typeNum(v) { await page.evaluate(v => { document.querySelector('.panel .ans input').value = v; }, String(v)); }

const ONLY = process.argv[5] ?? 'qetpx';
/** open one part directly (?part=n&open): a dev-server reload in one part does not break the others */
async function open(part, fresh = false) {
  await page.goto(`${base}&part=${part}&open${fresh ? '&fresh' : ''}`, { waitUntil: 'networkidle0' });
  await page.waitForFunction('window.lessonReady');
}
async function segment(name, fn) {
  if (!ONLY.includes(name)) return;
  try { await fn(); } catch (e) { console.log(`SEGMENT ${name} FAILED:`, e.message); await shot(`failed-${name}`); }
}
try {
  await segment('q', async () => {
    await open(0, true);
    await sleep(3.4); await shot('question');
    await click('25°'); await click('Pretty sure'); await shot('question-picked'); await click('Find out');
  });
  await segment('e', async () => {
    await open(1);
    await sleep(0.8); await shot('example-start');
    await click('Show the whole'); await sleep(2.6); await shot('example-whole');
    await click('Find the share'); await sleep(2.2); await shot('example-share');
    await click('Convert'); await sleep(5.4); await shot('example-convert');
    await click('Draw the rest'); await sleep(6.4); await shot('example-around');
    await click('25% means'); await sleep(0.3); await shot('example-why-wrong');
    await click('Pizza is'); await sleep(0.3); await click('Your turn');
  });
  await segment('t', async () => {
    await open(2);
    await sleep(7.0); await shot('turn-ask-pct');
    await typeNum(21); await click('Check'); await sleep(0.3); await shot('turn-pct-wrong');
    await typeNum(35); await click('Check'); await sleep(2.0);
    await typeNum(35); await click('Check'); await sleep(0.3); await shot('turn-deg-wrong');
    await typeNum(126); await click('Check'); await sleep(5.4); await shot('turn-deg');
    await click('At 0°'); await sleep(0.3); await shot('turn-next-wrong');
    await click('At 126°'); await sleep(1.0); await shot('turn-ray'); await sleep(5.4); await shot('turn-around');
    await click('Soccer 126°'); await sleep(0.3);
    await click('Soccer 35%'); await sleep(2.4); await shot('turn-done');
  });
  await segment('p', async () => {
    await open(3);
    await sleep(5.0); await shot('prove-start');
    await click('Riley is wrong'); await sleep(0.3);
    await click('The angles add up'); await sleep(0.3); await shot('prove-wrong-chip');
    await click('14 of 40'); await sleep(3.2); await shot('prove-1');
    await click('Its two edges'); await sleep(2.4); await shot('prove-2');
    await click('Swapping two labels'); await sleep(5.6); await shot('prove-3');
  });
  await segment('x', async () => {
    await open(4);
    await sleep(1.6);
    // practice: answer right, every third item wrong (feedback, worked solution, twin)
    for (let i = 0; i < ITEMS; i++) {
      const it = await page.evaluate(() => { const x = window.__practiceItem; return { fam: x.family, input: x.input, ans: x.answer }; });
      const wrong = i % 3 === 1;
      if (it.input === 'frac') {
        const a = it.ans;
        await page.evaluate((n, d) => { const ins = [...document.querySelectorAll('.panel .ans input')]; const [W, N, D] = ins.length === 3 ? ins : [null, ...ins]; if (W) W.value = ''; N.value = n; D.value = d; }, String(wrong ? a.d : a.n), String(wrong ? a.n : a.d));
      } else if (it.input === 'num') await typeNum(wrong ? it.ans.v + 1 : it.ans.v);
      else await page.evaluate(i => document.querySelectorAll('.panel .opts button')[i].click(), wrong ? (it.ans.i + 1) % 3 : it.ans.i);
      await sleep(1.0);
      const show = i < 6 || (wrong && i < 70) || (i >= 36 && i < 56);
      if (show) await shot(`practice-${i + 1}-${it.fam}`);
      await click('Check'); await sleep(wrong ? 3.4 : 0.5);
      if (wrong && show) await shot(`practice-${i + 1}-${it.fam}-wrong`);
      await click(wrong ? 'Try one like it' : 'Next');
      await sleep(1.2);
    }
    await shot('practice-end');
  });
  const log = await page.evaluate(() => window.mathscenesLessons.log('pie-charts'));
  fs.writeFileSync(path.join(out, 'diagnosis-log.json'), JSON.stringify(log, null, 1));
  console.log(`diagnosis log: ${log.length} attempts, ${log.filter(a => a.mc).length} with a misconception`);
} catch (e) {
  console.log('WALK FAILED:', e.message); await shot('failed');
} finally {
  console.log(errors.length ? `PAGE ERRORS:\n${errors.join('\n')}` : 'no page errors');
  await browser.close();
}
