// walk-cylinders-cones-spheres.mjs: click through the cylinders / cones / spheres lesson like a kid would (right and
// wrong answers in every part), screenshot every state, then lay out every practice family's picture strictly
// (__ccsAudit) and play a few practice items.
//   node tools/walk-cylinders-cones-spheres.mjs [base url] [out dir]
//   WALK_ONLY=audit   only the picture-layout audit (fast)      WALK_ONLY=practice   skip parts 1-4
// Needs the dev server (port 5290). Headless, muted (--mute-audio and ?mute).
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] ?? 'http://localhost:5290/lessons/cylinders-cones-spheres.html?mute&fresh&seed=7';
const out = process.argv[3] ?? 'out/walk-cylinders-cones-spheres';
const only = process.env.WALK_ONLY ?? '';
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
/** fill the answer boxes in order (num: one box; frac: whole, numerator, denominator) */
async function fill(...vals) { await page.evaluate(vs => { const ins = [...document.querySelectorAll('.panel .ans input')]; vs.forEach((v, i) => { if (ins[i]) ins[i].value = String(v); }); }, vals); }

try {
  if (only === 'audit' || only === 'practice') {
    await page.goto(base + '&part=4&open', { waitUntil: 'networkidle0' });
    await page.waitForFunction('window.lessonReady');
  } else {
    await page.goto(base, { waitUntil: 'networkidle0' });
    await page.waitForFunction('window.lessonReady');
    // 1. the question: a wrong card (2 cups = "a cone is half")
    await sleep(4.5); await shot('question');
    await click('2'); await click('Pretty sure'); await shot('question-picked'); await click('Find out');
    // 2. worked example
    await sleep(1.0); await shot('example-start');
    await click('Stack'); await sleep(6.8); await shot('example-layers');
    await click('Pour'); await sleep(7.0); await shot('example-pour-mid'); await sleep(7.0); await shot('example-pour');
    await click('Pour'); await sleep(4.2); await shot('example-ball-mid'); await sleep(4.0); await shot('example-ball');
    await click('Name them'); await sleep(6.8); await shot('example-formulas');
    await click('Any can works'); await sleep(0.4); await shot('example-why-wrong');
    await click('The ball is 6 in tall'); await sleep(0.4); await click('Your turn');
    // 3. your turn
    await sleep(14); await shot('turn-layers'); await sleep(15); await shot('turn-ask-h');
    await fill(6); await click('Check'); await sleep(0.4); await shot('turn-h-wrong');
    await fill(4); await click('Check'); await sleep(4.6); await shot('turn-ask-v');
    await fill(8, '', ''); await click('Check'); await sleep(0.4); await shot('turn-v-wrong');
    await fill('', 32, 3); await click('Check'); await sleep(3.0); await shot('turn-v-pour'); await sleep(6.5); await shot('turn-done');
    await click('Prove it');
    // 4. prove it
    await sleep(4.0); await click('Jordan is wrong'); await sleep(0.4); await shot('prove-start');
    await click('Any cone is one third'); await sleep(0.4); await shot('prove-wrong-chip');
    await click('The one-third rule'); await sleep(2.0); await shot('prove-1');
    await click('Same base'); await sleep(2.0); await shot('prove-2');
    await click('A cone is one third of its own'); await sleep(7.0); await shot('prove-3');
    await click('Practice');
  }
  // every family's picture, laid out strictly (a label with no readable place is an error here)
  await sleep(1.5);
  const audit = await page.evaluate(() => window.__ccsAudit(10));
  console.log(`picture audit: ${audit.n} pictures, ${audit.bad.length} without a strict layout`);
  for (const b of audit.bad.slice(0, 40)) console.log('  ' + b);
  fs.writeFileSync(path.join(out, 'audit.json'), JSON.stringify(audit, null, 1));
  if (only !== 'audit') {
    // practice: right, but every third item wrong (feedback, the worked solution and the twin)
    const N = Number(process.env.WALK_N ?? 12);
    for (let i = 0; i < N; i++) {
      const it = await page.evaluate(() => { const x = window.__practiceItem; return { fam: x.family, sg: x.subgoal, input: x.input, ans: x.answer }; });
      const wrong = i % 3 === 1;
      if (it.input === 'num') await fill(wrong ? it.ans.v + 1 : it.ans.v);
      else if (it.input === 'frac') await fill(it.ans.w || '', it.ans.n || '', it.ans.n ? it.ans.d : '').then(() => wrong ? fill(it.ans.w + 1 || 1, '', '') : null);
      else if (it.input === 'pair') await page.evaluate((x, y) => { const [a, b] = document.querySelectorAll('.panel .ans input'); a.value = x; b.value = y; }, String(wrong ? it.ans.y : it.ans.x), String(wrong ? it.ans.x : it.ans.y));
      else await page.evaluate(i => document.querySelectorAll('.panel .opts button')[i].click(), wrong ? (it.ans.i + 1) % 3 : it.ans.i);
      await sleep(2.2);
      await shot(`practice-${i + 1}-${it.sg}-${it.fam}`);
      await click('Check'); await sleep(wrong ? 8 : 0.6);
      if (wrong) await shot(`practice-${i + 1}-${it.fam}-wrong`);
      await click(wrong ? 'Try one like it' : 'Next');
      await sleep(1.0);
    }
    await shot('practice-end');
    const log = await page.evaluate(() => window.mathscenesLessons.log('cylinders-cones-spheres'));
    fs.writeFileSync(path.join(out, 'diagnosis-log.json'), JSON.stringify(log, null, 1));
    console.log(`diagnosis log: ${log.length} attempts, ${log.filter(a => a.mc).length} with a misconception; parts: ${[...new Set(log.map(a => a.part))].join(', ')}`);
  }
} catch (e) {
  console.log('WALK FAILED:', e.message); await shot('failed');
} finally {
  console.log(errors.length ? `PAGE ERRORS:\n${errors.join('\n')}` : 'no page errors');
  await browser.close();
}
