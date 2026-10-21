// walk-add-subtract-rational-numbers.mjs: click through the lesson like a kid would (right and wrong answers) and
// screenshot every state. Headless, ALWAYS muted (--mute-audio and ?mute).
//   node tools/walk-add-subtract-rational-numbers.mjs [base url] [out dir]
// Needs the dev server (port 5290).
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] ?? 'http://localhost:5290/lessons/add-subtract-rational-numbers.html?mute&fresh&seed=7';
const out = process.argv[3] ?? 'out/walk-add-subtract-rational-numbers';
fs.mkdirSync(out, { recursive: true });
for (const f of fs.readdirSync(out)) if (f.endsWith('.png')) fs.unlinkSync(path.join(out, f));
const browser = await puppeteer.launch({ headless: true, args: ['--mute-audio', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
// other topics are built in the same worktree at the same time: their edits make Vite reload every open page. Swap the
// HMR client for a stub so the walk is not reloaded halfway.
await page.setRequestInterception(true);
page.on('request', req => {
  if (new URL(req.url()).pathname.endsWith('/@vite/client')) {
    req.respond({ status: 200, contentType: 'application/javascript', body: 'export function createHotContext(){return{accept(){},acceptExports(){},dispose(){},prune(){},invalidate(){},on(){},off(){},send(){},data:{}}}export function updateStyle(){}export function removeStyle(){}export function injectQuery(u){return u}export class ErrorOverlay{}' });
  } else req.continue();
});
let n = 0;
const sleep = s => new Promise(r => setTimeout(r, s * 1000));
async function shot(name) { n++; const f = path.join(out, `${String(n).padStart(2, '0')}-${name}.png`); await page.screenshot({ path: f }); console.log(f); }
async function click(text, sel = 'button') {
  const ok = await page.evaluate((text, sel) => {
    const norm = s => s.replace(/\s+/g, ' ').trim();
    const b = [...document.querySelectorAll(sel)].find(x => norm(x.textContent).startsWith(text) && !x.disabled && x.offsetParent);
    if (!b) return false; b.click(); return true;
  }, text, sel);
  if (!ok) throw new Error(`no button "${text}"`);
}
async function typeNum(v) { await page.evaluate(v => { document.querySelector('.panel .ans input').value = v; }, String(v)); }
async function typeFrac(w, nn, d) {
  await page.evaluate((w, nn, d) => {
    const ins = [...document.querySelectorAll('.panel .ans input')];
    const [W, N, D] = ins.length === 3 ? ins : [null, ...ins];
    if (W) W.value = w; N.value = nn; D.value = d;
  }, String(w ?? ''), String(nn), String(d));
}

await page.goto(base, { waitUntil: 'networkidle0' });
await page.waitForFunction('window.lessonReady');
// 1. the question
await sleep(3.2); await shot('question');
await click('1point'); await click('Certain'); await shot('question-picked'); await click('Find out');
// 2. worked example
await sleep(0.8); await shot('example-start');
await click('Draw −3'); await sleep(2.8); await shot('example-draw');
await click('Flip it'); await sleep(0.75); await shot('example-flip-mid');
await sleep(3.4); await shot('example-flip');
await click('Land'); await sleep(3.2); await shot('example-land');
await click('Check'); await sleep(3.2); await shot('example-check');
await click('Two negatives'); await sleep(0.3); await shot('example-why-wrong');
await click('Taking away undoes'); await sleep(0.3); await shot('example-why-right'); await click('Your turn');
// 3. your turn
await sleep(6.5); await shot('turn-flip-ask');
await click('← Points left'); await sleep(0.3); await shot('turn-flip-wrong');
await click('Points right'); await sleep(4.8); await shot('turn-land-ask');
await typeNum(-8); await click('Check'); await sleep(0.3); await shot('turn-land-wrong');
await typeNum(4); await click('Check'); await sleep(3.4); await shot('turn-check-ask');
await click('−2 + 4'); await sleep(0.3); await shot('turn-check-wrong');
await click('4 + (−6)'); await sleep(3.6); await shot('turn-done');
await click('Prove it');
// 4. prove it
await sleep(2.6); await shot('prove-start');
await click('Always'); await sleep(0.4); await shot('prove-judged');
await click('A minus sign always'); await sleep(0.3); await shot('prove-wrong-chip');
await click('Subtracting a positive'); await sleep(3.6); await shot('prove-1');
await click('Taking away −2'); await sleep(3.6); await shot('prove-2');
await click('One counterexample'); await sleep(3.0); await shot('prove-3');
await click('Practice');
// 5. practice: right answers, but every third item wrong (to see the feedback, the replay on the canvas and the twin)
await sleep(1.5);
const seen = new Set();
for (let i = 0; i < 60; i++) {
  const it = await page.evaluate(() => { const x = window.__practiceItem; return { fam: x.family, sg: x.subgoal, input: x.input, ans: x.answer, n: (x.choices ?? []).length }; });
  const wrong = i % 3 === 1;
  if (it.input === 'frac') {
    const a = it.ans;
    if (wrong) await typeFrac('', a.n + 1, a.d); else await typeFrac('', a.n, a.d);
  } else if (it.input === 'num') {
    await typeNum(wrong ? it.ans.v + 1 : it.ans.v);
  } else if (it.input === 'pair') {
    await page.evaluate((x, y) => { const [a, b] = document.querySelectorAll('.panel .ans input'); a.value = x; b.value = y; }, String(wrong ? it.ans.y : it.ans.x), String(wrong ? -it.ans.y : it.ans.y));
  } else {
    await page.evaluate(i => document.querySelectorAll('.panel .opts button')[i].click(), wrong ? (it.ans.i + 1) % it.n : it.ans.i);
  }
  await sleep(0.9);
  const first = !seen.has(it.fam);
  seen.add(it.fam);
  if (first) await shot(`practice-${i + 1}-${it.fam}`);
  await click('Check'); await sleep(wrong ? 4.8 : 0.5);
  if (wrong && i < 45) await shot(`practice-${i + 1}-${it.fam}-wrong`);
  await click(wrong ? 'Try one like it' : 'Next');
  await sleep(1.1);
}
await shot('practice-end');
const log = await page.evaluate(() => window.mathscenesLessons.log('add-subtract-rational-numbers'));
fs.writeFileSync(path.join(out, 'diagnosis-log.json'), JSON.stringify(log, null, 1));
console.log(`families seen: ${seen.size} (${[...seen].join(', ')})`);
console.log(`diagnosis log: ${log.length} attempts, ${log.filter(a => a.mc).length} with a misconception`);
console.log(errors.length ? `PAGE ERRORS:\n${errors.join('\n')}` : 'no page errors');
await browser.close();
