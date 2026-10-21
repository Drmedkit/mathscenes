// walk-probability.mjs: click through the probability lesson like a kid would (right and wrong answers) and
// screenshot every state; then a picture self-check over every family x sub-goal.
//   node tools/walk-probability.mjs [base url] [out dir]
// Needs the dev server on port 5290. Headless and muted (--mute-audio and ?mute).
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] ?? 'http://localhost:5290/lessons/probability.html?mute&seed=7';
const out = process.argv[3] ?? 'out/walk-probability';
fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ headless: true, protocolTimeout: 120000, args: ['--mute-audio', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|\.mp3/.test(m.text())) errors.push(m.text()); });
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
let n = 0, seg = 'x';
const sleep = s => new Promise(r => setTimeout(r, s * 1000));
async function shot(name) {
  n++; const f = path.join(out, `${seg}${String(n).padStart(2, '0')}-${name}.png`);
  for (let t = 0; ; t++) { try { await page.screenshot({ path: f, captureBeyondViewport: false }); break; } catch (e) { if (t >= 2) { console.log(`  (screenshot skipped: ${name})`); return; } console.log(`  (screenshot retry: ${e.message.slice(0, 60)})`); await sleep(2); } }
  console.log(f);
}
// other agents edit files in the same worktree: Vite may reload the page under us. Each part is a segment that
// opens its own URL (?part=n&open) and starts over when the page navigated while it ran.
let navs = 0;
page.on('framenavigated', f => { if (f === page.mainFrame()) navs++; });
async function segment(name, query, fn) {
  for (let t = 0; t < 4; t++) {
    try {
      await page.goto(base + query, { waitUntil: 'networkidle0' });
      await page.waitForFunction('window.lessonReady');
      navs = 0; seg = name; n = 0;
      await fn();
      if (navs) throw new Error('the page reloaded');
      return;
    } catch (e) { console.log(`  segment ${name} starts over: ${e.message.slice(0, 80)}`); await sleep(3); }
  }
  throw new Error(`segment ${name} failed 4 times`);
}
async function click(text, sel = 'button') {
  const ok = await page.evaluate((text, sel) => {
    const b = [...document.querySelectorAll(sel)].find(x => x.textContent.replace(/\s+/g, ' ').trim().startsWith(text) && !x.disabled && x.offsetParent);
    if (!b) return false; b.click(); return true;
  }, text, sel);
  if (!ok) throw new Error(`no button "${text}"`);
}
const clickNth = (sel, i) => page.evaluate((sel, i) => document.querySelectorAll(sel)[i].click(), sel, i);
const chip = id => page.evaluate(id => document.querySelector(`.chips button[data-id="${id}"]`).click(), id);
async function typeFrac(w, nn, d) {
  await page.evaluate((w, nn, d) => {
    const ins = [...document.querySelectorAll('.panel .ans input')];
    const [W, N, D] = ins.length === 3 ? ins : [null, ...ins];
    if (W) W.value = w; N.value = nn; D.value = d;
  }, String(w ?? ''), String(nn), String(d));
}

// 1. the question
await segment('1', '&fresh', async () => {
  await sleep(3.6); await shot('question');
  await clickNth('.cards button', 0); await click('Pretty sure'); await shot('question-picked'); await click('Find out');
});
// 2. worked example
await segment('2', '&part=1&open', async () => {
  await sleep(0.8); await shot('example-start');
  await click('List'); await sleep(3.2); await shot('example-list');
  await click('Check'); await sleep(3.2); await shot('example-check');
  await click('Count'); await sleep(3.2); await shot('example-count');
  await click('Write it'); await sleep(6.0); await shot('example-write');
  await click('Blue or white'); await sleep(0.3); await shot('example-why-wrong');
  await click('The 4 marbles'); await sleep(0.3); await click('Your turn');
});
// 3. your turn
await segment('3', '&part=2&open', async () => {
  await sleep(9.5); await shot('turn-ask');
  await chip('B1'); await chip('W1'); await click('Check'); await sleep(0.3); await shot('turn-count-wrong');
  await chip('W1'); await chip('B2'); await chip('P'); await click('Check'); await sleep(2.8); await shot('turn-count');
  await typeFrac('', 2, 3); await click('Check'); await sleep(0.3); await shot('turn-write-wrong');
  await typeFrac('', 3, 6); await click('Check'); await sleep(2.2); await shot('turn-write');
  await click('Likely'); await sleep(0.3); await click('As likely as not'); await sleep(3.4); await shot('turn-place');
  await click('Prove it');
});
// 4. prove it
await segment('4', '&part=3&open', async () => {
  await sleep(3.0); await shot('prove-start');
  await click('Sam is wrong'); await sleep(0.3);
  await click('Four draws should'); await sleep(0.3); await shot('prove-wrong-chip');
  await click('In 10 batches'); await sleep(4.4); await shot('prove-1');
  await click('After 400 draws'); await sleep(9.5); await shot('prove-2');
  await click('A probability says'); await sleep(4.6); await shot('prove-3');
  await click('Practice');
});
// 5. practice: the first item of every family wrong (feedback, the worked solution, the twin), the rest right
const fams = new Set(), sgs = new Set();
await segment('5', '&part=4&open', async () => {
  await sleep(1.5);
  const missed = new Set();
  for (let i = 0; i < 90; i++) {
    const it = await page.evaluate(() => { const x = window.__practiceItem; return { id: x.id, fam: x.family, sg: x.subgoal, input: x.input, ans: x.answer, n: (x.choices ?? []).length }; });
    fams.add(it.fam); sgs.add(it.sg); console.log(`  item ${i + 1}: ${it.id} (${it.sg})`);
    const wrong = !missed.has(it.fam); missed.add(it.fam);
    if (it.input === 'frac') {
      const a = it.ans;
      if (wrong) await typeFrac('', a.n + 1, a.d + 2); else await typeFrac(a.w || '', a.n, a.d);
    } else if (it.input === 'num') {
      await page.evaluate(v => { document.querySelector('.panel .ans input').value = v; }, String(wrong ? it.ans.v + 1 : it.ans.v));
    } else {
      await page.evaluate(i => document.querySelectorAll('.panel .opts button')[i].click(), wrong ? (it.ans.i + 1) % it.n : it.ans.i);
    }
    await sleep(it.fam === 'longRun' ? 3.0 : 1.0);
    const keep = i < 3 || wrong;
    if (keep) await shot(`practice-${i + 1}-${it.fam}`);
    await click('Check'); await sleep(wrong ? 4.5 : 0.5);
    if (keep && wrong) await shot(`practice-${i + 1}-${it.fam}-wrong`);
    const done = await page.evaluate(() => /Mastered/.test(document.querySelector('.meter')?.textContent ?? ''));
    if (done) { await shot('practice-mastered'); break; }
    await click(wrong ? 'Try one like it' : 'Next');
    await sleep(1.2);
  }
  await shot('practice-end');
});
console.log(`practice saw ${fams.size} families, ${sgs.size} sub-goals`);
const log = await page.evaluate(() => window.mathscenesLessons.log('probability'));
fs.writeFileSync(path.join(out, 'diagnosis-log.json'), JSON.stringify(log, null, 1));
console.log(`diagnosis log: ${log.length} attempts, ${log.filter(a => a.mc).length} with a misconception; parts: ${[...new Set(log.map(a => a.part))].join(', ')}`);
const self = await page.evaluate(() => window.__probSelftest(120));
console.log(self.length ? `PICTURE SELF-CHECK: ${self.length} problems\n${[...new Set(self.map(s => s.replace(/^\S+ /, '')))].slice(0, 30).join('\n')}` : 'picture self-check: every picture builds');
console.log(errors.length ? `PAGE ERRORS:\n${[...new Set(errors)].join('\n')}` : 'no page errors');
await browser.close();
