// walk-fractions-decimals-percents.mjs: click through the "Convert fractions, decimals, and percents" lesson like a kid
// would (right and wrong answers), screenshot every state, and check in the page that every practice item's picture
// and board lines can be drawn.
//   node tools/walk-fractions-decimals-percents.mjs [base url] [out dir] [--no-practice]   click-through + screenshots
//   node tools/walk-fractions-decimals-percents.mjs --fit       only the fit check: every family x sub-goal x 40 seeds
// Needs the dev server (port 5290). Headless, ALWAYS muted (--mute-audio and ?mute).
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
const SLUG = 'fractions-decimals-percents';
const base = args[0] ?? `http://localhost:5290/lessons/${SLUG}.html?mute&fresh&seed=7`;
const out = args[1] ?? `out/walk-${SLUG}`;
const practice = !process.argv.includes('--no-practice'), fitOnly = process.argv.includes('--fit');
const N_PRACTICE = Number(process.env.N_PRACTICE ?? 60);
fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ headless: true, protocolTimeout: 600000, args: ['--mute-audio', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error' || (m.type() === 'warning' && m.text().includes(SLUG))) errors.push(m.text()); });
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
async function clickIdx(sel, i) {
  const ok = await page.evaluate((sel, i) => { const b = document.querySelectorAll(sel)[i]; if (!b || b.disabled) return false; b.click(); return true; }, sel, i);
  if (!ok) throw new Error(`no button ${sel}[${i}]`);
}
async function typeIn(...vs) { await page.evaluate(vs => { [...document.querySelectorAll('.panel .ans input')].forEach((el, i) => { el.value = vs[i] ?? ''; }); }, vs.map(v => (v === null || v === undefined ? '' : String(v)))); }

try {
  await page.goto(base, { waitUntil: 'networkidle0' });
  await page.waitForFunction('window.lessonReady');

  if (fitOnly) {
    // the Vite root is pages/, so src/ is served under /@fs/<absolute path>
    const SRC = '/@fs/' + path.resolve('src').split(path.sep).join('/');
    const fit = await page.evaluate(async (SRC, SLUG) => {
      const I = await import(`${SRC}/lesson/topics/${SLUG}/items.ts`);
      const DL = await import(`${SRC}/lesson/topics/${SLUG}/DivisionLadder.ts`);
      const CA = await import(`${SRC}/lesson/topics/${SLUG}/Calculator.ts`);
      const T = await import(`${SRC}/core/tex.ts`);
      const { rng } = await import(`${SRC}/lesson/runtime/item.ts`);
      const { frame } = await import(`${SRC}/blocks/block.ts`);
      const { dusk } = await import(`${SRC}/lesson/dusk.ts`);
      const { PLAN } = await import(`${SRC}/lesson/topics/${SLUG}/plan.ts`);
      const MF = frame(60, 70, 940, 940), BW = 512, BIG = 1300;
      const bad = [];
      let count = 0;
      for (const p of PLAN) for (const f of p.families) for (let s = 1; s <= 40; s++) {
        const it = I.GENS[f](rng(s * 31 + 7), s, p.id); count++;
        const P = it.picture;
        const lineW = P.kind === 'bare' ? BIG : BW;
        for (const src of [it.board, ...P.work]) {
          try { const F = await T.texAsync(src); if (T.texWidth(F, P.kind === 'bare' ? 70 : 60) > lineW) bad.push(`${it.id}: line too wide (${Math.round(T.texWidth(F, 60))} px): ${src}`); }
          catch (e) { bad.push(`${it.id}: bad TeX ${src}: ${e.message}`); }
        }
        try {
          if (P.kind === 'ladder') DL.DivisionLadder(P.p, MF, dusk);
          if (P.kind === 'calc') CA.Calculator(P.p, MF, dusk);
        } catch (e) { bad.push(`${it.id}: ${e.message}`); }
      }
      const byFam = {};
      for (const b of bad) { const k = b.replace(/-\d+:.*/, ''); (byFam[k] ??= []).push(b); }
      return { count, nbad: bad.length, bad: Object.values(byFam).map(v => `${v.length} x ${v[0]}`) };
    }, SRC, SLUG);
    console.log(`fit check: ${fit.count} items, ${fit.nbad} problems`); for (const b of fit.bad) console.log('  ' + b);
  } else {
    const explain = !/[?&]part=4/.test(base);
    if (explain) {
      // ---- 1. the question ----
      await sleep(3.6); await shot('question');
      await clickIdx('.cards button', 2); await click('Pretty sure'); await sleep(0.3); await shot('question-picked'); await click('Find out');
      // ---- 2. worked example ----
      await sleep(1.2); await shot('example-start');
      await click('Divide'); await sleep(4.6); await shot('example-divide');
      await click('Next line'); await sleep(3.6); await shot('example-track');
      await click('Show the repeat'); await sleep(7.0); await shot('example-repeat');
      await click('Make it a percent'); await sleep(5.4); await shot('example-percent');
      await click('A bar goes over every'); await sleep(0.3); await shot('example-why-wrong');
      await click('The 1 comes from'); await sleep(0.3); await click('Your turn');
      // ---- 3. your turn ----
      await sleep(6.5); await shot('turn-ask');
      await typeIn(7, 4); await click('Check'); await sleep(0.3); await shot('turn-step-wrong');
      await typeIn(6, 8); await click('Check'); await sleep(5.2); await shot('turn-step');
      await clickIdx('.panel .opts button', 1); await sleep(0.3); await shot('turn-write-wrong');
      await clickIdx('.panel .opts button', 0); await sleep(5.6); await shot('turn-write');
      await clickIdx('.panel .opts button', 2); await sleep(0.3); await shot('turn-pct-wrong');
      await clickIdx('.panel .opts button', 0); await sleep(6.2); await shot('turn-done');
      await click('Prove it');
      // ---- 4. prove it ----
      await sleep(3.2); await shot('prove-start');
      await click('Ava is wrong'); await sleep(0.3);
      await click('0.333 has three'); await sleep(0.3); await shot('prove-wrong-chip');
      await click('10 ÷ 3'); await sleep(6.0); await shot('prove-1');
      await click('That leftover'); await sleep(3.0); await shot('prove-2');
      await click('Cutting a repeating'); await sleep(7.6); await shot('prove-3');
      await click('Practice');
    }
    // ---- 5. practice: right answers, every third one wrong (feedback, the worked solution on the picture, a twin) ----
    if (practice) {
      await sleep(1.6);
      for (let i = 0; i < N_PRACTICE; i++) {
        const it = await page.evaluate(() => { const x = window.__practiceItem; return { fam: x.family, sg: x.subgoal, input: x.input, ans: x.answer, k: x.choices ? x.choices.length : 0 }; });
        const wrong = i % 3 === 1;
        const a = it.ans;
        if (it.input === 'pair') await typeIn(wrong ? a.x + 1 : a.x, a.y);
        else if (it.input === 'num') await typeIn(wrong ? Math.round((a.v + 1) * 1e6) / 1e6 : a.v);
        else if (it.input === 'frac') await typeIn(a.w || '', wrong ? a.n + 1 : a.n, a.d);
        else await clickIdx('.panel .opts button', wrong ? (a.i + 1) % it.k : a.i);
        await sleep(1.4);
        const snap = i < 4 || (wrong && i < 46);
        if (snap) await shot(`practice-${i + 1}-${it.fam}`);
        try { await click('Check'); } catch { console.log('  (no Check button, page reloaded?)'); await page.waitForFunction('window.__practiceItem', { timeout: 60000 }); continue; }
        await sleep(wrong ? 6.0 : 0.4);
        if (snap && wrong) await shot(`practice-${i + 1}-${it.fam}-wrong`);
        const fin = await page.evaluate(() => /Mastered/.test(document.querySelector('.meter')?.textContent ?? ''));
        if (fin) { console.log('mastered after', i + 1); break; }
        try { await click(wrong ? 'Try one like it' : 'Next'); } catch { console.log('  (page reloaded, carrying on)'); await page.waitForFunction('window.__practiceItem', { timeout: 60000 }); }
        await sleep(0.8);
      }
      await shot('practice-end');
    }
    const lg = await page.evaluate(SLUG => window.mathscenesLessons.log(SLUG), SLUG);
    fs.writeFileSync(path.join(out, 'diagnosis-log.json'), JSON.stringify(lg, null, 1));
    console.log(`diagnosis log: ${lg.length} attempts, ${lg.filter(a => a.mc).length} with a misconception`);
  }
} catch (e) {
  console.log('WALK FAILED:', e.message); await shot('failed');
} finally {
  console.log(errors.length ? `PAGE ERRORS:\n${errors.join('\n')}` : 'no page errors');
  await browser.close();
}
