// walk-scale-drawings.mjs: click through the scale-drawings lesson like a kid would (right and wrong answers) and
// screenshot every state.   node tools/walk-scale-drawings.mjs [base url] [out dir] [practice items] [segments qetpx]
// Needs the dev server (port 5290). Headless, ALWAYS muted (--mute-audio and ?mute).
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] ?? 'http://localhost:5290/lessons/scale-drawings.html?mute&seed=7';
const out = process.argv[3] ?? 'out/walk-scale-drawings';
const ITEMS = Number(process.argv[4] ?? 32);
const ONLY = process.argv[5] ?? 'qetpx';
fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ headless: true, args: ['--mute-audio', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`${m.type()}: ${m.text()}`); });
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
// other topics are built in this worktree at the same time: their edits make Vite reload every open page, which
// would reset a walk. The walk switches off the HMR socket (the page itself is unchanged).
await page.evaluateOnNewDocument(() => {
  const WS = window.WebSocket;
  window.WebSocket = function (url, proto) {
    if (String(proto).includes('vite-hmr') || String(url).includes('token=')) return { addEventListener() {}, removeEventListener() {}, send() {}, close() {}, readyState: 0 };
    return new WS(url, proto);
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
async function clickSel(sel) { const ok = await page.evaluate(sel => { const b = document.querySelector(sel); if (!b) return false; b.click(); return true; }, sel); if (!ok) throw new Error(`no ${sel}`); }
async function typeNum(v) { await page.evaluate(v => { const i = [...document.querySelectorAll('.panel .ans input')].pop(); i.value = v; }, String(v)); }
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
    await sleep(3.6); await shot('question');
    await clickSel('.cards button[data-i="1"]'); await click('Pretty sure'); await shot('question-picked'); await click('Find out');
  });
  await segment('e', async () => {
    await open(1);
    await sleep(0.8); await shot('example-start');
    await click('Read it'); await sleep(3.2); await shot('example-scale');
    await click('Measure'); await sleep(4.0); await shot('example-measure');
    await click('Multiply'); await sleep(3.2); await shot('example-multiply');
    await click('Do the rest'); await sleep(6.6); await shot('example-rest');
    await click('1 inch becomes'); await sleep(0.3); await shot('example-why-wrong');
    await click('Every inch'); await sleep(0.3); await click('Your turn');
  });
  await segment('t', async () => {
    await open(2);
    await sleep(7.6); await shot('turn-ask-long');
    await typeNum(9); await click('Check'); await sleep(0.3); await shot('turn-long-wrong');
    await typeNum(18); await click('Check'); await sleep(3.6); await shot('turn-long');
    await typeNum(13.5); await click('Check'); await sleep(3.4); await shot('turn-short');
    await typeNum(18); await click('Check'); await sleep(0.3); await shot('turn-shed-wrong');
    await typeNum(2); await click('Check'); await sleep(3.0); await shot('turn-done');
  });
  await segment('p', async () => {
    await open(3);
    await sleep(4.0); await shot('prove-start');
    await click('Sam is wrong'); await sleep(0.3);
    await click('Areas grow'); await sleep(0.3); await shot('prove-wrong-chip');
    await click('Each inch on the plan'); await sleep(2.6); await shot('prove-1');
    await click('Area is length'); await sleep(2.2); await shot('prove-2');
    await click('One square inch'); await sleep(7.4); await shot('prove-3');
  });
  await segment('x', async () => {
    await open(4);
    await sleep(1.6);
    // practice: answer right, every third item wrong (feedback, worked solution, twin)
    for (let i = 0; i < ITEMS; i++) {
      const it = await page.evaluate(() => { const x = window.__practiceItem; return { fam: x.family, input: x.input, ans: x.answer, k: (x.choices ?? []).length }; });
      const wrong = i % 3 === 1;
      if (it.input === 'frac') {
        const a = it.ans;
        await page.evaluate((w, nn, d) => { const [W, N, D] = [...document.querySelectorAll('.panel .ans input')]; W.value = w; N.value = nn; D.value = d; }, String(wrong ? a.w + 1 : a.w || ''), String(a.n), String(a.d));
      } else if (it.input === 'num') await typeNum(wrong ? it.ans.v + 1 : it.ans.v);
      else await page.evaluate(i => document.querySelectorAll('.panel .opts button')[i].click(), wrong ? (it.ans.i + 1) % it.k : it.ans.i);
      await sleep(1.4);
      const show = i < 14 || wrong;
      if (show) await shot(`practice-${i + 1}-${it.fam}`);
      await click('Check'); await sleep(wrong ? 3.6 : 0.5);
      if (wrong) await shot(`practice-${i + 1}-${it.fam}-wrong`);
      await click(wrong ? 'Try one like it' : 'Next');
      await sleep(1.0);
    }
    await shot('practice-end');
  });
  const log = await page.evaluate(() => window.mathscenesLessons.log('scale-drawings'));
  fs.writeFileSync(path.join(out, 'diagnosis-log.json'), JSON.stringify(log, null, 1));
  console.log(`diagnosis log: ${log.length} attempts, ${log.filter(a => a.mc).length} with a misconception`);
} catch (e) {
  console.log('WALK FAILED:', e.message); await shot('failed');
} finally {
  console.log(errors.length ? `PAGE ERRORS:\n${errors.join('\n')}` : 'no page errors');
  await browser.close();
}
