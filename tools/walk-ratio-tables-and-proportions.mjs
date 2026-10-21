// walk-ratio-tables-and-proportions.mjs: click through the ratio-tables lesson like a kid would (right and wrong
// answers) and screenshot every state. Headless and muted (--mute-audio, ?mute).
//   node tools/walk-ratio-tables-and-proportions.mjs [base url] [out dir] [practice items] [practice]
// Needs the dev server (the mathscenes-lessons launch config, port 5290).
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] ?? 'http://localhost:5290/lessons/ratio-tables-and-proportions.html?mute&fresh&seed=7';
const out = process.argv[3] ?? 'out/walk-ratio-tables-and-proportions';
const ITEMS = Number(process.argv[4] ?? 46);
fs.mkdirSync(out, { recursive: true });
for (const f of fs.readdirSync(out)) if (f.endsWith('.png')) fs.unlinkSync(path.join(out, f));
const browser = await puppeteer.launch({ headless: true, args: ['--mute-audio', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
const page = await browser.newPage();
const errors = [], warns = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); if (m.type() === 'warn') warns.push(m.text()); });
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
async function click(text, sel = 'button') {
  const ok = await page.evaluate((text, sel) => {
    const b = [...document.querySelectorAll(sel)].find(x => x.textContent.replace(/\s+/g, ' ').trim().startsWith(text) && !x.disabled && x.offsetParent);
    if (!b) return false; b.click(); return true;
  }, text, sel);
  if (!ok) throw new Error(`no button "${text}"`);
}
const typeNum = v => page.evaluate(v => { const i = [...document.querySelectorAll('.panel .ans input')]; i[i.length - 1].value = v; }, String(v));

try {
  if (process.argv[5] === 'practice') { await page.goto(base + '&open&part=4', { waitUntil: 'networkidle0' }); await page.waitForFunction('window.lessonReady'); }
  else {
    await page.goto(base, { waitUntil: 'networkidle0' });
    await page.waitForFunction('window.lessonReady');
    // 1. the question
    await sleep(3.6); await shot('question');
    await click('12 cups of water'); await click('Certain'); await shot('question-picked'); await click('Find out');
    // 2. worked example
    await sleep(1.2); await shot('example-start');
    await click('Pair them'); await sleep(4.0); await shot('example-pair');
    await click('Divide'); await sleep(5.6); await shot('example-divide');
    await click('Multiply'); await sleep(5.8); await shot('example-multiply');
    await click('Check'); await sleep(5.4); await shot('example-check');
    await click('Taking 2 cups off'); await sleep(0.3); await shot('example-why-wrong');
    await click('Half a recipe'); await sleep(0.3); await shot('example-why-right'); await click('Your turn');
    // 3. your turn
    await sleep(9.5); await shot('turn-ask');
    await typeNum(21); await click('Check'); await sleep(0.3); await shot('turn-unit-wrong');
    await typeNum(8); await click('Check'); await sleep(7.5); await shot('turn-scale');
    await typeNum(28); await click('Check'); await sleep(0.3); await shot('turn-scale-wrong');
    await typeNum(56); await click('Check'); await sleep(6.0); await shot('turn-rate');
    await click('8 cases per bottle'); await sleep(0.3); await shot('turn-rate-wrong');
    await click('8 bottles per case'); await sleep(2.0); await shot('turn-done');
    await click('Prove it');
    // 4. prove it
    await sleep(4.4); await shot('prove-intro');
    await click('Jordan is wrong'); await sleep(0.3); await shot('prove-start');
    await click('Adding two rows always'); await sleep(0.3); await shot('prove-wrong-chip');
    await click('8 ÷ 1 = 8'); await sleep(3.4); await shot('prove-1');
    await click('At 0 hours'); await sleep(2.6); await shot('prove-2');
    await click('$19 is $14'); await sleep(5.6); await shot('prove-3');
    await click('Practice');
  }
  // 5. practice: right, but every third item wrong (feedback, worked solution, twin); a shot of each family's first
  // item, and of its first worked solution
  await sleep(1.6);
  const seen = new Set(), seenWrong = new Set();
  for (let i = 0; i < ITEMS; i++) {
    const it = await page.evaluate(() => { const x = window.__practiceItem; return { fam: x.family, input: x.input, ans: x.answer, n: (x.choices ?? []).length }; });
    const wrong = i % 3 === 1;
    if (it.input === 'num') await typeNum(wrong ? it.ans.v + 1 : it.ans.v);
    else if (it.input === 'frac') await page.evaluate((a, wrong) => { const [w, nn, d] = document.querySelectorAll('.panel .ans input'); w.value = String(a.w + (wrong ? 1 : 0)); nn.value = a.n ? String(a.n) : ''; d.value = a.n ? String(a.d) : ''; }, it.ans, wrong);
    else await page.evaluate(i => document.querySelectorAll('.panel .opts button')[i].click(), wrong ? (it.ans.i + 1) % it.n : it.ans.i);
    await sleep(1.4);
    const first = !seen.has(it.fam); seen.add(it.fam);
    if (first) await shot(`practice-${i + 1}-${it.fam}`);
    await click('Check'); await sleep(wrong ? 5.5 : 0.4);
    if (wrong && !seenWrong.has(it.fam)) { seenWrong.add(it.fam); await shot(`practice-${i + 1}-${it.fam}-wrong`); }
    await click(wrong ? 'Try one like it' : 'Next');
    await sleep(0.4);
  }
  await sleep(1.0); await shot('practice-end');
  const log = await page.evaluate(() => window.mathscenesLessons.log('ratio-tables-and-proportions'));
  fs.writeFileSync(path.join(out, 'diagnosis-log.json'), JSON.stringify(log, null, 1));
  console.log(`diagnosis log: ${log.length} attempts, ${log.filter(a => a.mc).length} with a misconception`);
  console.log(`families seen: ${[...seen].join(', ')}`);
} catch (e) {
  console.log('WALK FAILED:', e.message); await shot('failed');
} finally {
  console.log(errors.length ? `PAGE ERRORS:\n${[...new Set(errors)].join('\n')}` : 'no page errors');
  if (warns.length) console.log(`WARNINGS:\n${[...new Set(warns)].join('\n')}`);
  await browser.close();
}
