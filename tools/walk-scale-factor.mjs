// walk-scale-factor.mjs: click through the scale-factor lesson like a kid would (right and wrong answers) and
// screenshot every state.   node tools/walk-scale-factor.mjs [base url] [out dir] [practice items]
// Needs the dev server (port 5290). Headless, ALWAYS muted (--mute-audio and ?mute).
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] ?? 'http://localhost:5290/lessons/scale-factor.html?mute&fresh&seed=7';
const out = process.argv[3] ?? 'out/walk-scale-factor';
const N = Number(process.argv[4] ?? 48);
fs.mkdirSync(out, { recursive: true });
for (const f of fs.readdirSync(out)) if (f.endsWith('.png')) fs.unlinkSync(path.join(out, f));
const browser = await puppeteer.launch({ headless: true, args: ['--mute-audio', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
// other topics are being built in the same worktree: keep Vite's hot reload from restarting the page mid-walk
await page.evaluateOnNewDocument(() => { const W = window.WebSocket; window.WebSocket = function (url, p) { if (String(p).includes('vite-hmr')) return { addEventListener() {}, removeEventListener() {}, send() {}, close() {}, readyState: 0 }; return new W(url, p); }; });
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
async function fill(vals) {
  await page.evaluate(vals => { [...document.querySelectorAll('.panel .ans input')].forEach((el, i) => { el.value = vals[i] ?? ''; }); }, vals.map(String));
}

await page.goto(base, { waitUntil: 'networkidle0' });
await page.waitForFunction('window.lessonReady');
await sleep(4.0); await shot('question');
await click('5'); await click('Pretty sure'); await shot('question-picked'); await click('Find out');
// worked example
await sleep(0.8); await shot('example-start');
await click('Match'); await sleep(2.2); await shot('example-match');
await click('Find k'); await sleep(3.6); await shot('example-k');
await click('Multiply'); await sleep(5.0); await shot('example-multiply');
await click('Check'); await sleep(12.0); await shot('example-check');
await click('Adding 3'); await sleep(0.4); await shot('example-why-wrong');
await click('A scaled copy multiplies'); await sleep(0.4); await shot('example-why-right'); await click('Your turn');
// your turn
await sleep(7.5); await shot('turn-ask-k');
await fill(['2', '', '']); await click('Check'); await sleep(0.4); await shot('turn-k-inverted');
await fill(['', '1', '2']); await click('Check'); await sleep(4.5); await shot('turn-k');
await fill(['1']); await click('Check'); await sleep(0.4); await shot('turn-side-additive');
await fill(['2']); await click('Check'); await sleep(6.5); await shot('turn-side');
await click('They are half'); await sleep(0.4); await shot('turn-angle-wrong');
await click('They are still right'); await sleep(3.6); await shot('turn-done');
await click('Prove it');
// prove it
await sleep(3.0); await shot('prove-start');
await click('Riley is wrong'); await sleep(0.4); await shot('prove-chain');
await click('Adding the same amount'); await sleep(0.3); await shot('prove-wrong-chip');
await click('8 ÷ 4'); await sleep(2.0); await shot('prove-1');
await click('10 ÷ 6'); await sleep(2.0); await shot('prove-2');
await click('Every length must'); await sleep(4.0); await shot('prove-3');
await click('6 × 2'); await sleep(5.5); await shot('prove-4');
await click('Practice');
// practice: right answers, every third one wrong (feedback, the worked solution on the canvas, the twin)
await sleep(2.0);
const famSeen = new Set();
for (let i = 0; i < N; i++) {
  const it = await page.evaluate(() => { const x = window.__practiceItem; return { fam: x.family, sg: x.subgoal, input: x.input, ans: x.answer, nChoices: x.choices?.length ?? 0 }; });
  const wrong = i % 3 === 1;
  const a = it.ans;
  if (it.input === 'frac') {
    const w = wrong ? (a.w || 0) + 1 : a.w;
    if (a.n === 0 && a.d === 1) await fill([w, '', '']); else await fill([w || '', a.n, a.d]);
  } else if (it.input === 'num') await fill([wrong ? a.v + 1 : a.v]);
  else if (it.input === 'pair') await fill(wrong ? [a.x + 1, a.y] : [a.x, a.y]);
  else await page.evaluate(i => document.querySelectorAll('.panel .opts button')[i].click(), wrong ? (a.i + 1) % it.nChoices : a.i);
  await sleep(1.4);
  const first = !famSeen.has(it.fam); famSeen.add(it.fam);
  if (first || wrong) await shot(`practice-${i + 1}-${it.fam}`);
  await click('Check'); await sleep(wrong ? 5.0 : 0.5);
  if (wrong) await shot(`practice-${i + 1}-${it.fam}-wrong`);
  await click(wrong ? 'Try one like it' : 'Next');
  await sleep(1.2);
}
await shot('practice-end');
const log = await page.evaluate(() => window.mathscenesLessons.log('scale-factor'));
fs.writeFileSync(path.join(out, 'diagnosis-log.json'), JSON.stringify(log, null, 1));
console.log(`families seen: ${famSeen.size} (${[...famSeen].join(', ')})`);
console.log(`diagnosis log: ${log.length} attempts, ${log.filter(a => a.mc).length} with a misconception`);
console.log(errors.length ? `PAGE ERRORS:\n${errors.join('\n')}` : 'no page errors');
await browser.close();
