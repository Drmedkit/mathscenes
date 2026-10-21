// walk-discounts.mjs: click through the "Calculate a discount" lesson like a kid would (right and wrong answers),
// screenshot every state, and check in the page that every practice item's model and board lines can be drawn.
//   node tools/walk-discounts.mjs [base url] [out dir] [--no-practice]   the click-through with screenshots
//   node tools/walk-discounts.mjs --fit       only the fit check: every family x 60 seeds, models and board lines
// Needs the dev server (port 5290). Headless, muted (--mute-audio and ?mute).
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
const base = args[0] ?? 'http://localhost:5290/lessons/discounts.html?mute&fresh&seed=7';
const out = args[1] ?? 'out/walk-discounts';
const practice = !process.argv.includes('--no-practice'), fitOnly = process.argv.includes('--fit');
fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ headless: true, protocolTimeout: 600000, args: ['--mute-audio', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning' && /discounts/.test(m.text())) errors.push(m.text()); });
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  // ~18 agents edit this worktree at once; Vite's HMR would reload the page mid-walk. A socket that never opens
  // turns HMR off for this tab only.
  await page.evaluateOnNewDocument(() => {
    const WS = window.WebSocket;
    window.WebSocket = function (url, protocols) {
      if (String(protocols).includes('vite')) return { readyState: 0, addEventListener() {}, removeEventListener() {}, send() {}, close() {} };
      return new WS(url, protocols);
    };
    Object.assign(window.WebSocket, { OPEN: 1, CLOSED: 3, CONNECTING: 0, CLOSING: 2 });
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
  async function typeIn(...vs) { await page.evaluate(vs => { [...document.querySelectorAll('.panel .ans input')].forEach((el, i) => { el.value = vs[i] ?? ''; }); }, vs.map(String)); }

  await page.goto(base, { waitUntil: 'networkidle0' });
  await page.waitForFunction('window.lessonReady');

  // ---- every practice item can be drawn: the model fits its frame, the board lines fit the slate at >= 60 px ----
  // the Vite root is pages/, so src/ is served under /@fs/<absolute path>
  const SRC = '/@fs/' + path.resolve('src').split(path.sep).join('/');
  if (fitOnly) {
  const fit = await page.evaluate(async SRC => {
    const I = await import(`${SRC}/lesson/topics/discounts/items.ts`);
    const PB = await import(`${SRC}/lesson/topics/discounts/PriceBar.ts`);
    const T = await import(`${SRC}/core/tex.ts`);
    const { rng } = await import(`${SRC}/lesson/runtime/item.ts`);
    const { frame } = await import(`${SRC}/blocks/block.ts`);
    const { dusk } = await import(`${SRC}/lesson/dusk.ts`);
    const { PLAN } = await import(`${SRC}/lesson/topics/discounts/plan.ts`);
    const fr = frame(60, 70, 860, 940), BW = 760;
    const bad = [];
    let n = 0;
    for (const p of PLAN) for (const f of p.families) for (let s = 1; s <= 60; s++) {
      const it = I.GENS[f](rng(s * 31 + 7), s, p.id); n++;
      const P = it.picture;
      if (!P) continue;
      for (const src of [it.board, ...P.work]) {
        const F = await T.texAsync(src);
        if (T.texWidth(F, 60) > BW) bad.push(`${it.id}: board line too wide: ${src}`);
      }
      for (const prm of [P.bar, P.solved ?? { ...P.bar, hide: undefined, tagHide: undefined }]) {
        try { PB.PriceBar(prm, fr, dusk); } catch (e) { bad.push(`${it.id}: ${e.message}`); }
      }
    }
    const byFam = {};
    for (const b of bad) { const f = b.replace(/-\d+:.*/, ''); (byFam[f] ??= []).push(b); }
    return { n, bad: Object.values(byFam).map(v => `${v.length} x ${v[0]}`), nbad: bad.length };
  }, SRC);
  console.log(`fit check: ${fit.n} items, ${fit.nbad} problems`); for (const b of fit.bad) console.log('  ' + b);
  console.log(errors.length ? 'PAGE ERRORS: ' + errors.join(' | ') : 'no page errors');
  await browser.close(); process.exit(0);
  }

  const explain = !/[?&]part=4/.test(base);   // ?part=4&open: practice only
  if (explain) {
  // ---- 1. the question ----
  await sleep(3.2); await shot('question');
  await click('$68'); await click('Pretty sure'); await sleep(0.3); await shot('question-picked'); await click('Find out');
  // ---- 2. worked example ----
  await sleep(0.8); await shot('example-start');
  await click('Show the whole'); await sleep(2.6); await shot('example-whole');
  await click('Find it'); await sleep(6.4); await shot('example-discount');
  await click('Subtract'); await sleep(4.2); await shot('example-subtract');
  await click('Check it'); await sleep(4.4); await shot('example-check');
  await click('It is luck'); await sleep(0.3); await shot('example-why-wrong');
  await click('The $12 off'); await sleep(0.3); await click('Your turn');
  // ---- 3. your turn ----
  await sleep(9.6); await shot('turn-ask');
  await typeIn('15.75'); await click('Check'); await sleep(0.3); await shot('turn-sub-wrong');
  await typeIn('30.25'); await click('Check'); await sleep(0.3); await shot('turn-sub-zeros');
  await typeIn('$29.25'); await click('Check'); await sleep(4.6); await shot('turn-sub');
  await click('0.65 × $15.75'); await sleep(0.3); await shot('turn-check-wrong');
  await click('0.65 × $45.00'); await sleep(4.6); await shot('turn-check');
  await click('More than half'); await sleep(4.2); await shot('turn-half');
  await click('Prove it');
  // ---- 4. prove it ----
  await sleep(4.4); await shot('prove-start');
  await click('Riley is wrong'); await sleep(0.3);
  await click('$35 is less'); await sleep(0.3); await shot('prove-wrong-chip');
  await click('70% off leaves'); await sleep(2.6); await shot('prove-1');
  await click('30% is less'); await sleep(3.6); await shot('prove-2');
  await click('$35 + $15'); await sleep(6.6); await shot('prove-3');
  await click('Practice');
  }
  // ---- 5. practice: right, but every third item wrong (feedback, the worked solution on the picture, then a twin) ----
  if (practice) {
    await sleep(1.5);
    for (let i = 0; i < 70; i++) {
      const it = await page.evaluate(() => { const x = window.__practiceItem; return { fam: x.family, input: x.input, ans: x.answer }; });
      const wrong = i % 3 === 1;
      if (it.input === 'pair') await typeIn(wrong ? it.ans.y : it.ans.x, wrong ? it.ans.x : it.ans.y);
      else if (it.input === 'num') await typeIn(wrong ? it.ans.v + 1 : it.ans.v);
      else await page.evaluate(i => document.querySelectorAll('.panel .opts button')[i].click(), wrong ? (it.ans.i + 1) % 3 : it.ans.i);
      await sleep(1.7);
      const snap = i < 5 || (wrong && i < 40);
      if (snap) await shot(`practice-${i + 1}-${it.fam}`);
      try { await click('Check'); } catch { console.log('  (no Check button, page reloaded?)'); await page.waitForFunction('window.__practiceItem', { timeout: 60000 }); continue; }
      await sleep(wrong ? 6.5 : 0.5);
      if (snap && wrong) await shot(`practice-${i + 1}-${it.fam}-wrong`);
      const fin = await page.evaluate(() => /Mastered/.test(document.querySelector('.meter')?.textContent ?? ''));
      if (fin) { console.log('mastered after', i + 1); break; }
      // another agent's file change can make Vite reload the page; then just carry on with the item that is there
      try { await click(wrong ? 'Try one like it' : 'Next'); } catch { console.log('  (page reloaded, carrying on)'); await page.waitForFunction('window.__practiceItem', { timeout: 60000 }); }
      await sleep(0.9);
    }
    await shot('practice-end');
  }
  const log = await page.evaluate(() => window.mathscenesLessons.log('discounts'));
  fs.writeFileSync(path.join(out, 'diagnosis-log.json'), JSON.stringify(log, null, 1));
  console.log(`diagnosis log: ${log.length} attempts, ${log.filter(a => a.mc).length} with a misconception`);
  console.log(errors.length ? `PAGE ERRORS:\n${errors.join('\n')}` : 'no page errors');
} finally {
  await browser.close();
}
