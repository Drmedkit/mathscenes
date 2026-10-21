// walk-scale-and-area.mjs: click through the "scale factor and area" lesson like a kid would (right and one wrong
// answer per part) and screenshot every state.   node tools/walk-scale-and-area.mjs [base url] [out dir]
// Needs the dev server (port 5290). Headless, ALWAYS muted (--mute-audio and ?mute). WALK_N=practice items (default 6).
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] ?? 'http://localhost:5290/lessons/scale-and-area.html?mute&fresh&seed=7';
const out = process.argv[3] ?? 'out/walk-scale-and-area';
fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ headless: true, args: ['--mute-audio', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
const page = await browser.newPage();
const errors = [];
// other lessons are being built in the same dev server: block Vite's HMR client so a reload elsewhere can't restart us
await page.setRequestInterception(true);
page.on('request', r => (r.url().includes('/@vite/client') ? r.abort() : r.continue()));
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if ((m.type() === 'error' || m.type() === 'warn') && !/vite\/client|ERR_FAILED/.test(m.text())) errors.push(m.text()); });
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
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
async function typeNum(v) { await page.evaluate(v => { const i = document.querySelector('.panel .ans input'); i.value = v; }, String(v)); }

try {
  await page.goto(base, { waitUntil: 'networkidle0' });
  await page.waitForFunction('window.lessonReady');
  // 1 the question
  await sleep(4.8); await shot('question');
  await click('18'); await click('Pretty sure'); await shot('question-picked'); await click('Find out');
  // 2 worked example
  await sleep(0.8); await shot('example-start');
  await click('Scale it'); await sleep(5.0); await shot('example-scale');
  await click('Fill one row'); await sleep(1.4); await shot('example-row-flying'); await sleep(3.4); await shot('example-row');
  await click('Fill the rows'); await sleep(5.0); await shot('example-rows');
  await click('Name it'); await sleep(4.8); await shot('example-name');
  await click('The copy is 3 times'); await sleep(0.3); await shot('example-why-wrong');
  await click('The length multiplies'); await sleep(0.3); await shot('example-why-right'); await click('Your turn');
  // 3 your turn
  await sleep(12.5); await shot('turn-count');
  await typeNum(2); await click('Check'); await sleep(0.3); await shot('turn-count-wrong');
  await typeNum(4); await click('Check'); await sleep(4.5); await shot('turn-area');
  await typeNum(24); await click('Check'); await sleep(0.3); await shot('turn-area-wrong');
  await typeNum(48); await click('Check'); await sleep(5.0); await shot('turn-done');
  await click('Prove it');
  // 4 prove it
  await sleep(3.6); await shot('prove-start');
  await click('Riley is wrong'); await sleep(0.3); await shot('prove-judged');
  await click('Doubling every side'); await sleep(0.3); await shot('prove-wrong-chip');
  await click('Four small'); await sleep(2.0); await shot('prove-1-flying'); await sleep(3.6); await shot('prove-1');
  await click('Every small copy'); await sleep(2.0); await shot('prove-2');
  await click('The base doubles'); await sleep(2.6); await shot('prove-3');
  await click('Practice');
  // 5 practice: a few items, every third wrong (the worked solution plays)
  await sleep(2.5);
  const N = Number(process.env.WALK_N ?? 6);
  for (let i = 0; i < N; i++) {
    const it = await page.evaluate(() => { const x = window.__practiceItem; return { fam: x.family, sg: x.subgoal, input: x.input, ans: x.answer, nc: (x.choices || []).length, pic: !!x.pict }; });
    const wrong = i % 3 === 1, a = it.ans;
    await page.evaluate((a, wrong, nc) => {
      const ins = [...document.querySelectorAll('.panel .ans input')];
      const set = (el, v) => { el.value = String(v); };
      if (a.kind === 'num') set(ins[0], wrong ? a.v + 1 : a.v);
      else if (a.kind === 'frac') { const [w, nn, d] = ins.length >= 3 ? ins : [null, ...ins]; if (w) set(w, ''); set(nn, wrong ? a.n + 1 : a.n); set(d, a.d); }
      else if (a.kind === 'pair') { set(ins[0], wrong ? a.x + 1 : a.x); set(ins[1], a.y); }
      else document.querySelectorAll('.panel .opts button')[wrong ? (a.i + 1) % nc : a.i].click();
    }, a, wrong, it.nc);
    await sleep(it.pic ? 2.2 : 0.6);
    await shot(`practice-${i + 1}-${it.sg}-${it.fam}`);
    await click('Check'); await sleep(wrong ? (it.pic ? 6 : 1.0) : 0.6);
    if (wrong) await shot(`practice-${i + 1}-${it.fam}-wrong`);
    await click(wrong ? 'Try one like it' : 'Next');
    await sleep(1.0);
  }
  const log = await page.evaluate(() => window.mathscenesLessons.log('scale-and-area'));
  fs.writeFileSync(path.join(out, 'diagnosis-log.json'), JSON.stringify(log, null, 1));
  console.log(`diagnosis log: ${log.length} attempts, ${log.filter(a => a.mc).length} with a misconception; parts: ${[...new Set(log.map(a => a.part))].join(', ')}`);
} catch (e) {
  console.log('WALK FAILED:', e.message); await shot('failed');
} finally {
  console.log(errors.length ? `PAGE ERRORS:\n${errors.join('\n')}` : 'no page errors');
  await browser.close();
}
