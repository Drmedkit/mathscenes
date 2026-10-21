// walk-integer-exponents.mjs: click through the integer-exponents lesson like a kid would (right and wrong answers)
// and screenshot every state.   node tools/walk-integer-exponents.mjs [base url] [out dir]
// Needs the dev server (port 5290). Headless, ALWAYS muted (--mute-audio and ?mute). N_PRACTICE=45 by default.
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] ?? 'http://localhost:5290/lessons/integer-exponents.html?mute&fresh&seed=7';
const out = process.argv[3] ?? 'out/walk-integer-exponents';
const N_PRACTICE = Number(process.env.N_PRACTICE ?? 45);
fs.mkdirSync(out, { recursive: true });
for (const f of fs.readdirSync(out)) if (f.endsWith('.png')) fs.unlinkSync(path.join(out, f));
const browser = await puppeteer.launch({ headless: true, args: ['--mute-audio', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
// other topics are built in this worktree at the same time: their edits make Vite reload every open page, which
// would reset a ?fresh walk. The walk switches off the HMR socket (the page itself is unchanged).
await page.evaluateOnNewDocument(() => {
  const WS = window.WebSocket;
  window.WebSocket = function (url, proto) {
    if (String(proto).includes('vite-hmr')) return { addEventListener() {}, removeEventListener() {}, send() {}, close() {}, readyState: 0 };
    return new WS(url, proto);
  };
});
let n = 0;
const sleep = s => new Promise(r => setTimeout(r, s * 1000));
async function shot(name) { n++; const f = path.join(out, `${String(n).padStart(2, '0')}-${name}.png`); await page.screenshot({ path: f }); console.log(f); }
/** click the first enabled, visible button whose text starts with `text`; waits up to 25 s (the machine may be busy) */
async function click(text, sel = 'button') {
  for (let t = 0; t < 100; t++) {
    const ok = await page.evaluate((text, sel) => {
      const norm = s => s.replace(/\s+/g, ' ').trim();
      const b = [...document.querySelectorAll(sel)].find(x => norm(x.textContent).startsWith(text) && !x.disabled && x.offsetParent);
      if (!b) return false; b.click(); return true;
    }, text, sel);
    if (ok) return;
    await sleep(0.25);
  }
  throw new Error(`no button "${text}"`);
}
const waitInput = () => page.waitForSelector('.panel .ans input', { timeout: 25000 });
async function typeNum(v) { await waitInput(); await page.evaluate(v => { document.querySelector('.panel .ans input').value = v; }, String(v)); }
async function typeFrac(w, nn, d) {
  await page.waitForSelector('.panel .ans .stack input', { timeout: 25000 });
  await page.evaluate((w, nn, d) => {
    const ins = [...document.querySelectorAll('.panel .ans input')];
    const [W, N, D] = ins.length === 3 ? ins : [null, ...ins];
    if (W) W.value = w; N.value = nn; D.value = d;
  }, String(w ?? ''), String(nn), String(d));
}

try {
  await page.goto(base, { waitUntil: 'networkidle0' });
  await page.waitForFunction('window.lessonReady');
  // 1. the question
  await sleep(3.6); await shot('question');
  await click('−8'); await click('Pretty sure'); await shot('question-picked'); await click('Find out');
  // 2. worked example
  await sleep(0.8); await shot('example-start');
  await click('Write 2³'); await sleep(3.4); await shot('example-write');
  await click('Back to noon'); await sleep(4.0); await shot('example-noon-mid');
  await sleep(5.0); await shot('example-noon');
  await click('Back to 9 am'); await sleep(6.4); await shot('example-9am');
  await click('Read it'); await sleep(1.6); await shot('example-read');
  await click('The minus sign'); await sleep(0.3); await shot('example-why-wrong');
  await click('Each step down'); await sleep(0.3); await shot('example-why-right'); await click('Your turn');
  // 3. your turn
  await sleep(10.2); await shot('turn-power-ask');
  await typeNum(3); await click('Check'); await sleep(0.3); await shot('turn-power-wrong');
  await typeNum(-3); await click('Check'); await sleep(3.2); await shot('turn-value-ask');
  await typeFrac(null, -1, 27); await click('Check'); await sleep(0.3); await shot('turn-value-wrong');
  await typeFrac(null, 1, 27); await click('Check'); await sleep(2.6); await shot('turn-done');
  await click('Prove it');
  // 4. prove it
  await sleep(2.2); await shot('prove-start');
  await click('Yes: 5⁰ = 0'); await sleep(0.4); await shot('prove-judged');
  await click('5⁰ = 1 is just'); await sleep(0.3); await shot('prove-wrong-chip');
  await click('The product rule'); await sleep(4.0); await shot('prove-1');
  await click('Multiplying by 1'); await sleep(2.4); await shot('prove-2');
  await click('Any number times 0'); await sleep(2.6); await shot('prove-3-mid');
  await sleep(4.6); await shot('prove-3');
  await click('Practice');
  // 5. practice: right answers, every third wrong (feedback, worked solution on the canvas, twin)
  await sleep(1.6);
  const seen = new Set();
  for (let i = 0; i < N_PRACTICE; i++) {
    const it = await page.evaluate(() => { const x = window.__practiceItem; return { fam: x.family, sg: x.subgoal, input: x.input, ans: x.answer, k: (x.choices ?? []).length, pic: !!x.picture }; });
    const wrong = i % 3 === 1;
    if (it.input === 'frac') { const a = it.ans; await typeFrac('', wrong ? a.n + 1 : a.n, a.d); }
    else if (it.input === 'num') await typeNum(wrong ? it.ans.v + 1 : it.ans.v);
    else await page.evaluate(i => document.querySelectorAll('.panel .opts button')[i].click(), wrong ? (it.ans.i + 1) % it.k : it.ans.i);
    await sleep(0.9);
    const first = !seen.has(it.fam + (it.pic ? '+pic' : ''));
    seen.add(it.fam + (it.pic ? '+pic' : ''));
    if (first) await shot(`practice-${i + 1}-${it.fam}${it.pic ? '-pic' : ''}`);
    await click('Check'); await sleep(wrong ? (it.pic ? 6.0 : 1.2) : 0.5);
    if (wrong) await shot(`practice-${i + 1}-${it.fam}-wrong`);
    await click(wrong ? 'Try one like it' : 'Next');
    await sleep(1.1);
  }
  await shot('practice-end');
  const log = await page.evaluate(() => window.mathscenesLessons.log('integer-exponents'));
  fs.writeFileSync(path.join(out, 'diagnosis-log.json'), JSON.stringify(log, null, 1));
  console.log(`families seen: ${seen.size} (${[...seen].join(', ')})`);
  console.log(`diagnosis log: ${log.length} attempts, ${log.filter(a => a.mc).length} with a misconception`);
} catch (e) {
  console.log('WALK FAILED:', e.message); await shot('failed');
} finally {
  console.log(errors.length ? `PAGE ERRORS:\n${errors.join('\n')}` : 'no page errors');
  await browser.close();
}
