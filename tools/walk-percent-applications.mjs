// walk-percent-applications.mjs: click through the percent-applications lesson like a kid would (right and wrong
// answers) and screenshot every state.   node tools/walk-percent-applications.mjs [base url] [out dir] [practice]
// Needs the dev server (port 5290). Headless, ALWAYS muted (--mute-audio and ?mute). N_PRACTICE=n items (default 40).
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] ?? 'http://localhost:5290/lessons/percent-applications.html?mute&fresh&seed=7';
const out = process.argv[3] ?? 'out/walk-percent-applications';
const onlyPractice = process.argv[4] === 'practice';
const N_PRACTICE = Number(process.env.N_PRACTICE ?? 40);
fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ headless: true, args: ['--mute-audio', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
const page = await browser.newPage();
const errors = [], warns = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); if (m.type() === 'warning' && m.text().includes('percent-applications')) warns.push(m.text()); });
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
const typeNum = v => page.evaluate(v => { document.querySelector('.panel .ans input').value = v; }, String(v));

try {
  await page.goto(onlyPractice ? base + '&open&part=4' : base, { waitUntil: 'networkidle0' });
  await page.waitForFunction('window.lessonReady');
  if (!onlyPractice) {
    // 1. the question
    await sleep(4.0); await shot('question');
    await click('$56.00'); await click('Pretty sure'); await shot('question-picked'); await click('Find out');
    // 2. worked example
    await sleep(0.8); await shot('example-start');
    await click('Show the 100%'); await sleep(3.0); await shot('example-base');
    await click('Take it off'); await sleep(4.6); await shot('example-off');
    await click('Next change'); await sleep(10.4); await shot('example-new-base');
    await click('Combine'); await sleep(4.8); await shot('example-combine');
    await click('20% + 10%'); await sleep(0.3); await shot('example-why-wrong');
    await click('The second 10%'); await sleep(0.3); await click('Your turn');
    // 3. your turn
    await sleep(7.6); await shot('turn-ask-base');
    await click('$50, the price'); await sleep(0.3); await shot('turn-base-wrong');
    await click('$60, the price'); await sleep(3.8);
    await typeNum(50); await click('Check'); await sleep(0.3); await shot('turn-price-wrong');
    await typeNum(48); await click('Check'); await sleep(6.2); await shot('turn-price');
    await click('No change'); await sleep(0.3); await shot('turn-net-wrong');
    await click('A 4% decrease'); await sleep(3.4); await shot('turn-done');
    await click('Prove it');
    // 4. prove it
    await sleep(2.0); await click('Ava is wrong'); await sleep(0.3); await shot('prove-start');
    await click('20% off and 8% tax'); await sleep(0.3); await shot('prove-wrong-chip');
    await click('20% off leaves 80%'); await sleep(3.8); await shot('prove-1');
    await click('The tax makes it'); await sleep(3.8); await shot('prove-2');
    await click('Multiplying by 0.8'); await sleep(3.4); await shot('prove-3');
    await click('Practice');
  }
  // 5. practice: right answers, every third wrong (feedback, worked solution, twin); a shot of each family's first item
  await sleep(1.6);
  const seen = new Set(), seenWrong = new Set();
  for (let i = 0; i < N_PRACTICE; i++) {
    const it = await page.evaluate(() => { const x = window.__practiceItem; return { fam: x.family, sg: x.subgoal, input: x.input, ans: x.answer, k: (x.choices ?? []).length }; });
    const wrong = i % 3 === 1;
    if (it.input === 'num') await typeNum(wrong ? Math.round((it.ans.v + 1) * 100) / 100 : it.ans.v);
    else await page.evaluate(i => document.querySelectorAll('.panel .opts button')[i].click(), wrong ? (it.ans.i + 1) % it.k : it.ans.i);
    await sleep(1.3);
    const first = !seen.has(it.fam); seen.add(it.fam);
    if (first) await shot(`practice-${i + 1}-${it.fam}`);
    await click('Check'); await sleep(wrong ? 3.6 : 0.4);
    if (wrong && !seenWrong.has(it.fam)) { seenWrong.add(it.fam); await shot(`practice-${i + 1}-${it.fam}-wrong`); }
    await click(wrong ? 'Try one like it' : 'Next');
    await sleep(0.3);
  }
  await sleep(1.2); await shot('practice-end');
  const log = await page.evaluate(() => window.mathscenesLessons.log('percent-applications'));
  fs.writeFileSync(path.join(out, 'diagnosis-log.json'), JSON.stringify(log, null, 1));
  console.log(`diagnosis log: ${log.length} attempts, ${log.filter(a => a.mc).length} with a misconception`);
  console.log(`families seen: ${[...seen].join(', ')}`);
} catch (e) {
  console.log('WALK FAILED:', e.message); await shot('failed');
} finally {
  console.log(errors.length ? `PAGE ERRORS:\n${errors.join('\n')}` : 'no page errors');
  if (warns.length) console.log(`WARNINGS:\n${[...new Set(warns)].join('\n')}`);
  await browser.close();
}
