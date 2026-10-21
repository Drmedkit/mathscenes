// walk-original-amount.mjs: click through the "Find the original amount after a percent change" lesson like a kid
// would (right and wrong answers), screenshot every state, and (with --fit) check in the page that every practice
// item's model and board lines can be drawn.
//   node tools/walk-original-amount.mjs [base url] [out dir] [--no-practice]   the click-through with screenshots
//   node tools/walk-original-amount.mjs --fit       only the fit check: every family x 40 seeds, models and board lines
// Needs the dev server (port 5290). Headless, ALWAYS muted (--mute-audio and ?mute).
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
const base = args[0] ?? 'http://localhost:5290/lessons/original-amount.html?mute&fresh&seed=7';
const out = args[1] ?? 'out/walk-original-amount';
const practice = !process.argv.includes('--no-practice'), fitOnly = process.argv.includes('--fit');
const N_PRACTICE = Number(process.env.N_PRACTICE ?? 40);
fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ headless: true, protocolTimeout: 600000, args: ['--mute-audio', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error' || (m.type() === 'warning' && /original-amount/.test(m.text()))) errors.push(m.text()); });
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
async function typeIn(...vs) { await page.evaluate(vs => { [...document.querySelectorAll('.panel .ans input')].forEach((el, i) => { el.value = vs[i] ?? ''; }); }, vs.map(String)); }

try {
  await page.goto(base, { waitUntil: 'networkidle0' });
  await page.waitForFunction('window.lessonReady');

  if (fitOnly) {
    // the Vite root is pages/, so src/ is served under /@fs/<absolute path>
    const SRC = '/@fs/' + path.resolve('src').split(path.sep).join('/');
    const fit = await page.evaluate(async SRC => {
      const I = await import(`${SRC}/lesson/topics/original-amount/items.ts`);
      const BT = await import(`${SRC}/lesson/topics/original-amount/BaseTape.ts`);
      const T = await import(`${SRC}/core/tex.ts`);
      const { rng } = await import(`${SRC}/lesson/runtime/item.ts`);
      const { frame } = await import(`${SRC}/blocks/block.ts`);
      const { dusk } = await import(`${SRC}/lesson/dusk.ts`);
      const { PLAN } = await import(`${SRC}/lesson/topics/original-amount/plan.ts`);
      const fr = frame(60, 70, 860, 940), BW = 760;
      const bad = [];
      let n = 0, pics = 0;
      for (const p of PLAN) for (const f of p.families) for (let s = 1; s <= 40; s++) {
        const it = I.GENS[f](rng(s * 31 + 7), s, p.id); n++;
        const P = it.picture;
        if (!P) { const F = await T.texAsync(it.board); if (T.texWidth(F, 70) > 1440 - 140) bad.push(`${it.id}: bare board too wide: ${it.board}`); continue; }
        pics++;
        for (const src of [it.board, ...P.work]) {
          const F = await T.texAsync(src);
          if (T.texWidth(F, 60) > BW) bad.push(`${it.id}: board line too wide (${Math.round(T.texWidth(F, 60))}): ${src}`);
        }
        for (const r of P.tape.rows) if (r.pct) await T.texAsync(r.pct);
        for (const r of P.tape.rows) if (r.change) await T.texAsync(r.change);
        try { BT.BaseTape(P.tape, fr, dusk); } catch (e) { bad.push(`${it.id}: ${e.message}`); }
      }
      const byFam = {};
      for (const b of bad) { const f = b.replace(/-\d+:.*/, ''); (byFam[f] ??= []).push(b); }
      return { n, pics, bad: Object.values(byFam).map(v => `${v.length} x ${v[0]}`), nbad: bad.length };
    }, SRC);
    console.log(`fit check: ${fit.n} items (${fit.pics} with a model), ${fit.nbad} problems`); for (const b of fit.bad) console.log('  ' + b);
  } else {
    const explain = !/[?&]part=4/.test(base);   // ?part=4&open: practice only
    if (explain) {
      // ---- 1. the question ----
      await sleep(3.6); await shot('question');
      await click('$60'); await click('Pretty sure'); await sleep(0.3); await shot('question-picked'); await click('Find out');
      // ---- 2. worked example ----
      await sleep(0.8); await shot('example-start');
      await click('Show the whole'); await sleep(5.2); await shot('example-whole');
      await click('Split it'); await sleep(3.2); await shot('example-section');
      await click('Build it'); await sleep(5.0); await shot('example-build');
      await click('One step'); await sleep(4.4); await shot('example-divide');
      await click('Adding 20%'); await sleep(0.3); await shot('example-why-wrong');
      await click('The 20% was'); await sleep(0.3); await click('Your turn');
      // ---- 3. your turn ----
      await sleep(8.4); await shot('turn-ask');
      await typeIn('0.08'); await click('Check'); await sleep(0.3); await shot('turn-mult-wrong');
      await typeIn('1.08'); await click('Check'); await sleep(2.4);
      await typeIn('49.68'); await click('Check'); await sleep(0.3); await shot('turn-div-wrong');
      await typeIn('$50'); await click('Check'); await sleep(3.2); await shot('turn-div');
      await click('Divide $54'); await sleep(0.3); await shot('turn-check-wrong');
      await click('Add 8% tax'); await sleep(3.6); await shot('turn-done');
      await click('Prove it');
      // ---- 4. prove it ----
      await sleep(4.6); await shot('prove-start');
      await click('Theo is wrong'); await sleep(0.3);
      await click('Up 25%'); await sleep(0.3); await shot('prove-wrong-chip');
      await click('A percent change'); await sleep(2.4); await shot('prove-1');
      await click('After the markup'); await sleep(3.8); await shot('prove-2');
      await click('$75 is 125%'); await sleep(8.2); await shot('prove-3');
      await click('Practice');
    }
    // ---- 5. practice: right, but every third item wrong (feedback, the worked solution on the picture, then a twin) ----
    if (practice) {
      await sleep(1.6);
      for (let i = 0; i < N_PRACTICE; i++) {
        const it = await page.evaluate(() => { const x = window.__practiceItem; return { fam: x.family, input: x.input, ans: x.answer, k: (x.choices ?? []).length }; });
        const wrong = i % 3 === 1;
        if (it.input === 'pair') await typeIn(wrong ? it.ans.y : it.ans.x, wrong ? it.ans.x : it.ans.y);
        else if (it.input === 'num') await typeIn(wrong ? Math.round((it.ans.v + 1) * 100) / 100 : it.ans.v);
        else await page.evaluate(i => document.querySelectorAll('.panel .opts button')[i].click(), wrong ? (it.ans.i + 1) % it.k : it.ans.i);
        await sleep(1.6);
        const snap = i < 4 || (wrong && i < 40);
        if (snap) await shot(`practice-${i + 1}-${it.fam}`);
        await click('Check');
        await sleep(wrong ? 6.0 : 0.5);
        if (snap && wrong) await shot(`practice-${i + 1}-${it.fam}-wrong`);
        const fin = await page.evaluate(() => /Mastered/.test(document.querySelector('.meter')?.textContent ?? ''));
        if (fin) { console.log('mastered after', i + 1); break; }
        await click(wrong ? 'Try one like it' : 'Next');
        await sleep(0.9);
      }
      await shot('practice-end');
    }
    const log = await page.evaluate(() => window.mathscenesLessons.log('original-amount'));
    fs.writeFileSync(path.join(out, 'diagnosis-log.json'), JSON.stringify(log, null, 1));
    console.log(`diagnosis log: ${log.length} attempts, ${log.filter(a => a.mc).length} with a misconception`);
  }
} catch (e) {
  console.log('WALK FAILED:', e.message); await shot('failed');
} finally {
  console.log(errors.length ? `PAGE ERRORS:\n${errors.join('\n')}` : 'no page errors');
  await browser.close();
}
