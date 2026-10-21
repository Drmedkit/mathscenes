// walk-draw-triangles.mjs: click through the "draw triangles" lesson like a kid would (right and wrong answers),
// screenshot every state.
//   node tools/walk-draw-triangles.mjs [base url] [out dir]
// Needs the dev server (port 5290). Headless and muted (--mute-audio and ?mute).
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] ?? 'http://localhost:5290/lessons/draw-triangles.html?mute&fresh&seed=7';
const out = process.argv[3] ?? 'out/walk-draw-triangles';
const ITEMS = Number(process.env.ITEMS ?? 30);
fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ headless: true, args: ['--mute-audio', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); });
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
// other agents edit files in the same dev server: stub the Vite client so a hot reload cannot restart the walk
await page.setRequestInterception(true);
page.on('request', r => {
  if (r.url().includes('/@vite/client')) r.respond({ status: 200, contentType: 'application/javascript', body: 'export const createHotContext=()=>({accept(){},dispose(){},prune(){},invalidate(){},on(){},off(){},send(){},data:{}});export const updateStyle=()=>{};export const removeStyle=()=>{};export const injectQuery=u=>u;export class ErrorOverlay{};' });
  else r.continue();
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

await page.goto(base, { waitUntil: 'networkidle0' });
await page.waitForFunction('window.lessonReady');
await sleep(3.0); await shot('question');
await click('One'); await click('Pretty sure'); await shot('question-picked'); await click('Find out');
// worked example
await sleep(0.8); await shot('example-start');
await click('Sketch it'); await sleep(3.4); await shot('example-sketch');
await click('Draw AB'); await sleep(1.6); await shot('example-ruler'); await sleep(2.2); await shot('example-base');
await click('Swing the arcs'); await sleep(1.8); await shot('example-arc1'); await sleep(4.6); await shot('example-arcs');
await click('Join'); await sleep(7.2); await shot('example-join');
await click('It looks about right'); await sleep(0.3); await shot('example-why-wrong');
await click('Every point of one arc'); await sleep(0.3); await click('Your turn');
// your turn
await sleep(8.0); await shot('turn-ask-arc');
await click('4 in'); await sleep(0.3); await shot('turn-arc-wrong');
await click('3½ in'); await sleep(7.2); await shot('turn-ask-point');
await click('Q'); await sleep(0.3); await shot('turn-point-wrong');
await click('P'); await sleep(4.5); await shot('turn-joined');
await click('Now the sticks'); await sleep(7.0); await shot('turn-flat-ask');
await click('Only on the base'); await sleep(3.5); await shot('turn-flat');
await click('Prove it');
// prove it
await sleep(3.0); await click('Jordan is wrong'); await sleep(0.3); await shot('prove-start');
await click('triangles with the same angles'); await sleep(0.3); await shot('prove-wrong-chip');
await click('the three angles of every'); await sleep(2.6); await shot('prove-1');
await click('the rays leave'); await sleep(4.5); await shot('prove-2');
await click('same angles but different'); await sleep(3.6); await shot('prove-3');
await click('Practice');
// practice: answer right, but every third item wrong (to see feedback, the worked solution and the twin)
await sleep(1.5);
const fams = new Map();
for (let i = 0; i < ITEMS; i++) {
  const it = await page.evaluate(() => { const x = window.__practiceItem; return { fam: x.family, sg: x.subgoal, input: x.input, ans: x.answer, n: (x.choices ?? []).length }; });
  const wrong = i % 3 === 1;
  fams.set(it.fam, (fams.get(it.fam) ?? 0) + 1);
  if (it.input === 'frac') {
    const a = it.ans;
    const [W, N, D] = wrong ? [a.w + 1, a.n, a.d] : [a.w, a.n, a.d];
    await page.evaluate((W, N, D) => {
      const ins = [...document.querySelectorAll('.panel .ans input')];
      const [w, nn, d] = ins.length === 3 ? ins : [null, ...ins];
      if (w) w.value = W; nn.value = N; d.value = D;
    }, String(W || ''), N ? String(N) : '', N ? String(D) : '');
  } else if (it.input === 'num') {
    await page.evaluate(v => { document.querySelector('.panel .ans input').value = v; }, String(wrong ? it.ans.v + 1 : it.ans.v));
  } else if (it.input === 'pair') {
    await page.evaluate((x, y) => { const [a, b] = document.querySelectorAll('.panel .ans input'); a.value = x; b.value = y; }, String(wrong ? it.ans.x - 1 : it.ans.x), String(wrong ? it.ans.y + 1 : it.ans.y));
  } else {
    await page.evaluate(i => document.querySelectorAll('.panel .opts button')[i].click(), wrong ? (it.ans.i + 1) % it.n : it.ans.i);
  }
  await sleep(1.0);
  const keep = i < 12 || wrong;
  if (keep) await shot(`practice-${i + 1}-${it.fam}`);
  await click('Check'); await sleep(wrong ? 6.0 : 0.6);
  if (wrong) await shot(`practice-${i + 1}-${it.fam}-wrong`);
  await click(wrong ? 'Try one like it' : 'Next');
  await sleep(1.2);
}
await shot('practice-end');
const log = await page.evaluate(() => window.mathscenesLessons.log('draw-triangles'));
fs.writeFileSync(path.join(out, 'diagnosis-log.json'), JSON.stringify(log, null, 1));
console.log(`families seen: ${[...fams].map(([f, k]) => `${f}×${k}`).join(' ')}`);
console.log(`diagnosis log: ${log.length} attempts, ${log.filter(a => a.mc).length} with a misconception`);
console.log(errors.length ? `PAGE ERRORS:\n${errors.join('\n')}` : 'no page errors');
await browser.close();
