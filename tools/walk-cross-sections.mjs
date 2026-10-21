// walk-cross-sections.mjs: click through the cross-sections lesson like a kid would (right and wrong answers) and
// screenshot every state.   node tools/walk-cross-sections.mjs [base url] [out dir] [--from part]
// Needs the dev server (port 5290). Headless, muted (--mute-audio and ?mute).
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
const from = Number((process.argv.find(a => a.startsWith('--from=')) ?? '--from=0').split('=')[1]);
const base = args[0] ?? 'http://localhost:5290/lessons/cross-sections.html?mute&fresh&seed=7';
const out = args[1] ?? 'out/walk-cross-sections';
fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ headless: true, args: ['--mute-audio', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
// other topics are built in the same worktree: keep the dev server's hot reload from restarting the page mid-walk
await page.evaluateOnNewDocument(() => {
  const WS = window.WebSocket;
  window.WebSocket = function (url, proto) {
    if (proto === 'vite-hmr' || String(url).includes('token=')) return { readyState: 0, addEventListener() {}, removeEventListener() {}, send() {}, close() {} };
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

// --gallery: draw items of every family x sub-goal with their worked solution (no clicking), one still each
if (process.argv.includes('--gallery')) {
  try {
    await page.goto(base.replace('&fresh', '') + '&open&part=4', { waitUntil: 'networkidle0' });
    await page.waitForFunction('window.lessonReady');
    await sleep(1.5);
    // the dev server's root is pages/: source modules are served under /@fs/<absolute path>
    const FS = '/@fs/' + process.cwd().split(path.sep).join('/') + '/src';
    const plan = await page.evaluate(async FS => (await import(FS + '/lesson/topics/cross-sections/plan.ts')).PLAN.flatMap(p => p.families.map(f => [f, p.id])), FS);
    const seen = new Set();
    for (const [fam, sg] of plan) {
      const seeds = fam === 'taper' || fam === 'possible' ? [3, 8, 21, 40] : seen.has(fam) ? [5] : [3, 12];
      seen.add(fam);
      for (const seed of seeds) {
        const info = await page.evaluate(async (fam, sg, seed, FS) => {
          const m = await import(FS + '/lesson/topics/cross-sections/items.ts');
          const r = await import(FS + '/lesson/runtime/item.ts');
          const it = m.GENS[fam](r.rng(seed * 7919 + 3), seed, sg);
          window.__csShow(it, true);
          return it.prompt.replace(/<[^>]+>/g, '');
        }, fam, sg, seed, FS);
        await sleep(7.5);
        await shot(`gallery-${fam}-${sg.replace('cs-', '')}-${seed}`);
        console.log('   ', info.slice(0, 140));
      }
    }
  } catch (e) { console.error('GALLERY FAILED:', e.message); }
  console.log(errors.length ? `PAGE ERRORS:\n${errors.join('\n')}` : 'no page errors');
  await browser.close();
  process.exit(0);
}

try {
  const url = from ?base.replace('&fresh', '') + `&open&part=${from}` : base;
  await page.goto(url, { waitUntil: 'networkidle0' });
  await page.waitForFunction('window.lessonReady');
  if (from <= 0) {
    await sleep(3.8); await shot('question');
    await click('6 in × 4 in'); await click('Pretty sure'); await shot('question-picked'); await click('Find out');
  }
  if (from <= 1) {
    await sleep(0.8); await shot('example-start');
    await click('Place'); await sleep(3.8); await shot('example-place');
    await click('Trace'); await sleep(5.2); await shot('example-trace');
    await click('Lift'); await sleep(4.6); await shot('example-lift');
    await click('Name'); await sleep(5.4); await shot('example-name');
    await click('Every cross-section is'); await sleep(0.4); await shot('example-why-wrong');
    await click('The cut is parallel'); await sleep(0.3); await click('Your turn');
  }
  if (from <= 2) {
    await sleep(23.5); await shot('turn-ask-name');
    await click('a 6 in × 4 in'); await sleep(0.4); await shot('turn-name-wrong');
    await click('a 3 in × 2 in'); await sleep(4.0); await shot('turn-name-right');
    await sleep(4.4); await shot('turn-rise');
    await sleep(15.0); await shot('turn-stand');
    await click('Slide it off'); await sleep(3.0); await shot('turn-slide');
    await click('a rectangle'); await sleep(0.4); await shot('turn-slide-wrong');
    await click('a trapezoid'); await sleep(2.2);
    await typeNum(6); await click('Check'); await sleep(0.4); await shot('turn-bottom-wrong');
    await typeNum(4); await click('Check'); await sleep(4.2); await shot('turn-done');
    await click('Prove it');
  }
  if (from <= 3) {
    await sleep(3.2); await click('Jordan is wrong'); await sleep(0.4); await shot('prove-start');
    await click('Tilt the cut'); await sleep(0.3); await shot('prove-wrong-chip');
    await click('The edge of a section'); await sleep(5.8); await shot('prove-1');
    await click('A flat cut meets'); await sleep(3.0); await shot('prove-2');
    await click('A cube has only'); await sleep(6.0); await shot('prove-3');
    await click('Practice');
  }
  // practice: right answers, every third one wrong (feedback, the worked solution on the canvas, the twin)
  await sleep(1.6);
  for (let i = 0; i < 30; i++) {
    const it = await page.evaluate(() => { const x = window.__practiceItem; return { fam: x.family, input: x.input, ans: x.answer, n: (x.choices ?? []).length }; });
    const wrong = i % 3 === 1;
    if (it.input === 'num') await typeNum(wrong ? it.ans.v + 1 : it.ans.v);
    else if (it.input === 'pair') await page.evaluate((x, y) => { const [a, b] = document.querySelectorAll('.panel .ans input'); a.value = x; b.value = y; }, String(wrong ? it.ans.x + 1 : it.ans.x), String(it.ans.y));
    else await page.evaluate(i => document.querySelectorAll('.panel .opts button')[i].click(), wrong ? (it.ans.i + 1) % it.n : it.ans.i);
    await sleep(0.9);
    const keep = i < 4 || (wrong && i < 28);
    if (keep) await shot(`practice-${i + 1}-${it.fam}`);
    await click('Check'); await sleep(wrong ? 6.5 : 0.6);
    if (keep) await shot(`practice-${i + 1}-${it.fam}-${wrong ? 'wrong' : 'right'}`);
    await click(wrong ? 'Try one like it' : 'Next');
    await sleep(1.4);
  }
  await shot('practice-end');
  const log = await page.evaluate(() => window.mathscenesLessons.log('cross-sections'));
  fs.writeFileSync(path.join(out, 'diagnosis-log.json'), JSON.stringify(log, null, 1));
  console.log(`diagnosis log: ${log.length} attempts, ${log.filter(a => a.mc).length} with a misconception`);
} catch (e) {
  console.error('WALK FAILED:', e.message);
  await shot('failed');
} finally {
  console.log(errors.length ? `PAGE ERRORS:\n${errors.join('\n')}` : 'no page errors');
  await browser.close();
}
