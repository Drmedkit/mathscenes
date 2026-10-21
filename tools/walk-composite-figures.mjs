// walk-composite-figures.mjs: click through the composite-figures lesson like a kid would (right and wrong answers)
// and screenshot every state.   node tools/walk-composite-figures.mjs [base url] [out dir] [--from=part] [--gallery]
// Needs the dev server (port 5290). Headless, ALWAYS muted (--mute-audio and ?mute).
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
const from = Number((process.argv.find(a => a.startsWith('--from=')) ?? '--from=0').split('=')[1]);
const base = args[0] ?? 'http://localhost:5290/lessons/composite-figures.html?mute&fresh&seed=7';
const out = args[1] ?? 'out/walk-composite-figures';
const N_PRACTICE = Number(process.env.N_PRACTICE ?? 44);
fs.mkdirSync(out, { recursive: true });
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
let loads = 0;
page.on('load', () => { loads++; if (loads > 1) console.log('PAGE RELOADED'); });
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
const typePair = (x, y) => page.evaluate((x, y) => { const [a, b] = document.querySelectorAll('.panel .ans input'); a.value = x; b.value = y; }, String(x), String(y));

// --gallery: draw one item of every family x sub-goal with its worked solution (no clicking), one still each
if (process.argv.includes('--gallery')) {
  try {
    await page.goto(base.replace('&fresh', '') + '&open&part=4', { waitUntil: 'networkidle0' });
    await page.waitForFunction('window.lessonReady');
    await sleep(1.5);
    // the dev server's root is pages/: source modules are served under /@fs/<absolute path>
    const FS = '/@fs/' + process.cwd().split(path.sep).join('/') + '/src';
    const plan = await page.evaluate(async FS => (await import(FS + '/lesson/topics/composite-figures/plan.ts')).PLAN.flatMap(p => p.families.map(f => [f, p.id])), FS);
    const only = process.env.FAMS ? process.env.FAMS.split(',') : null;
    for (const [fam, sg] of plan) {
      if (only && !only.includes(fam)) continue;
      for (const seed of (process.env.SEEDS ?? '3').split(',').map(Number)) {
        const info = await page.evaluate(async (fam, sg, seed, FS) => {
          const m = await import(FS + '/lesson/topics/composite-figures/items.ts');
          const r = await import(FS + '/lesson/runtime/item.ts');
          const it = m.GENS[fam](r.rng(seed * 7919 + 3), seed, sg);
          window.__cfShow(it, true);
          return it.prompt.replace(/<[^>]+>/g, '');
        }, fam, sg, seed, FS);
        await sleep(Number(process.env.WAIT ?? 6.5));
        await shot(`gallery-${fam}-${sg.slice(0, 18)}-${seed}`);
        console.log('   ', info.slice(0, 150));
      }
    }
  } catch (e) { console.error('GALLERY FAILED:', e.message); }
  console.log(errors.length ? `PAGE ERRORS:\n${errors.join('\n')}` : 'no page errors');
  await browser.close();
  process.exit(0);
}

try {
  const url = from ? base.replace('&fresh', '') + `&open&part=${from}` : base;
  await page.goto(url, { waitUntil: 'networkidle0' });
  await page.waitForFunction('window.lessonReady');
  if (from <= 0) {
    await sleep(3.6); await shot('question');
    await click('40 + 4π'); await click('Pretty sure'); await shot('question-picked'); await click('Find out');
  }
  if (from <= 1) {
    await sleep(0.8); await shot('example-start');
    await click('Split'); await sleep(4.2); await shot('example-split');
    await click('Area'); await sleep(5.8); await shot('example-area');
    await click('Walk'); await sleep(5.0); await shot('example-walk');
    await click('Finish'); await sleep(3.2); await shot('example-finish');
    await click('It should count'); await sleep(0.4); await shot('example-why-wrong');
    await click('It is inside'); await sleep(0.3); await click('Your turn');
  }
  if (from <= 2) {
    await sleep(24.5); await shot('turn-ask-walk');
    await click('14 + 8 + 14'); await sleep(0.8); await shot('turn-walk-wrong');
    await click('14 + 14 + the two'); await sleep(6.0); await shot('turn-walk-right');
    await typePair(0, 36); await click('Check'); await sleep(0.4); await shot('turn-exact-wrong');
    await typePair(28, 8); await click('Check'); await sleep(4.0); await shot('turn-exact-right');
    await typeNum(113); await click('Check'); await sleep(0.4); await shot('turn-round-wrong');
    await typeNum(53.1); await click('Check'); await sleep(3.8); await shot('turn-done');
    await click('Prove it');
  }
  if (from <= 3) {
    await sleep(3.2); await shot('prove-claim');
    await click('Riley is wrong'); await sleep(0.4); await shot('prove-start');
    await click('Cutting something out'); await sleep(0.3); await shot('prove-wrong-chip');
    await click('The notch’s diameter'); await sleep(4.0); await shot('prove-1');
    await click('The new edge'); await sleep(3.8); await shot('prove-2');
    await click('One shape where'); await sleep(7.0); await shot('prove-3');
    await click('Practice');
  }
  // practice: right answers, every third one wrong (feedback, the worked solution on the canvas, the twin)
  await sleep(1.6);
  const fams = new Set();
  for (let i = 0; i < N_PRACTICE; i++) {
    const it = await page.evaluate(() => { const x = window.__practiceItem; return { fam: x.family, sg: x.subgoal, input: x.input, ans: x.answer, n: (x.choices ?? []).length }; });
    fams.add(it.fam);
    const wrong = i % 3 === 1;
    if (it.input === 'num') await typeNum(wrong ? it.ans.v + 1 : it.ans.v);
    else if (it.input === 'pair') await typePair(wrong ? it.ans.x + 1 : it.ans.x, it.ans.y);
    else await page.evaluate(i => document.querySelectorAll('.panel .opts button')[i].click(), wrong ? (it.ans.i + 1) % it.n : it.ans.i);
    await sleep(0.8);
    const keep = i < 3 || (wrong && i % 6 === 1) || i === 20 || i === 30;
    if (keep) await shot(`practice-${i + 1}-${it.fam}`);
    await click('Check'); await sleep(wrong ? 7.0 : 0.5);
    if (keep) await shot(`practice-${i + 1}-${it.fam}-${wrong ? 'wrong' : 'right'}`);
    await click(wrong ? 'Try one like it' : 'Next');
    await sleep(1.2);
  }
  await shot('practice-end');
  console.log(`families seen: ${[...fams].join(' ')}`);
  const log = await page.evaluate(() => window.mathscenesLessons.log('composite-figures'));
  fs.writeFileSync(path.join(out, 'diagnosis-log.json'), JSON.stringify(log, null, 1));
  console.log(`diagnosis log: ${log.length} attempts, ${log.filter(a => a.mc).length} with a misconception`);
} catch (e) {
  console.error('WALK FAILED:', e.message);
  await shot('failed');
} finally {
  console.log(errors.length ? `PAGE ERRORS:\n${errors.join('\n')}` : 'no page errors');
  await browser.close();
}
