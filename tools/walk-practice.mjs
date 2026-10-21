// walk-practice.mjs: a generic QA walk for ANY lesson topic, no per-topic code. It opens parts 1-4 (start state of
// each, for a quick look), then plays practice like a kid: right answers from item.answer, every 3rd answer wrong
// (a plausible slip), until every sub-goal is done or N items. It writes, in out/qa-<slug>/:
//   NN-*.png        screenshots (each part's start, the first items, every wrong item with its worked solution)
//   sheet-*.jpg     contact sheets of all screenshots (tools/contact-sheet.py), for one quick look
//   summary.json    hard checks: page errors, sub-goals done / total, families seen, mastered, panel overflow,
//                   attempts logged / with a misconception
//   log.json        the diagnosis log of the run
//
//   node tools/walk-practice.mjs <slug> [--items 60] [--seed 7] [--wrong-every 3] [--no-parts] [--port 5290]
// Headless, muted, and the Vite live-reload client is blocked (other edits in the worktree must not reload us).
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const argv = process.argv.slice(2);
const slug = argv[0];
if (!slug) { console.error('usage: node tools/walk-practice.mjs <slug> [--items N] [--seed S] [--wrong-every K] [--no-parts]'); process.exit(2); }
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i < 0 ? d : argv[i + 1]; };
const ITEMS = Number(opt('items', 60)), SEED = Number(opt('seed', 7)), WRONG = Number(opt('wrong-every', 3)), PORT = opt('port', '5290');
const out = path.join('out', `qa-${slug}`);
fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
const url = (q) => `http://localhost:${PORT}/lessons/${slug}.html?mute&fresh&open&seed=${SEED}${q}`;

const browser = await puppeteer.launch({ headless: true, args: ['--mute-audio', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
const page = await browser.newPage();
const errors = [];
await page.setRequestInterception(true);
page.on('request', r => (new URL(r.url()).pathname.endsWith('/@vite/client') ? r.respond({ status: 200, contentType: 'application/javascript', body: 'export {}' }) : r.continue()));
page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
page.on('console', m => { if (m.type() === 'error' && !/vite|ERR_FAILED|favicon/.test(m.text())) errors.push(`console: ${m.text()}`); });
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
const sleep = s => new Promise(r => setTimeout(r, s * 1000));
let n = 0;
const shot = async name => { n++; await page.screenshot({ path: path.join(out, `${String(n).padStart(2, '0')}-${name}.png`) }); };
const ready = async () => { await page.waitForFunction('window.lessonReady', { timeout: 60000 }); };

const PARTS = ['question', 'example', 'turn', 'prove'];
if (!argv.includes('--no-parts')) {
  for (let i = 0; i < 4; i++) {
    try { await page.goto(url(`&part=${i}`), { waitUntil: 'networkidle0', timeout: 90000 }); await ready(); await sleep(5); await shot(`part${i + 1}-${PARTS[i]}-start`); }
    catch (e) { errors.push(`part ${i + 1}: ${e.message}`); }
  }
}

// practice
const summary = { slug, seed: SEED, items: 0, wrong: 0, families: {}, subgoalsDone: 0, subgoalsTotal: 0, mastered: false, panelOverflowPx: 0, attempts: 0, attemptsWithMc: 0, errors };
try {
  await page.goto(url('&part=4'), { waitUntil: 'networkidle0', timeout: 90000 }); await ready(); await sleep(2);
  for (let i = 0; i < ITEMS; i++) {
    await page.waitForFunction('window.__practiceItem', { timeout: 30000 });
    const it = await page.evaluate(() => { const x = window.__practiceItem; return { id: x.id, family: x.family, input: x.input, answer: x.answer, nChoices: (x.choices || []).length }; });
    const wrong = WRONG > 0 && i % WRONG === WRONG - 1;
    summary.families[it.family] = (summary.families[it.family] ?? 0) + 1;
    const a = it.answer;
    const resp = !wrong ? a
      : a.kind === 'frac' ? (a.n > 0 && (a.w * a.d + a.n) !== a.d ? { kind: 'frac', w: 0, n: a.d, d: a.w * a.d + a.n } : { ...a, n: a.n + 1 })
      : a.kind === 'num' ? { kind: 'num', v: a.v + 1 }
      : a.kind === 'pair' ? (a.x !== a.y ? { kind: 'pair', x: a.y, y: a.x } : { kind: 'pair', x: a.x + 1, y: a.y })
      : { kind: 'choice', i: (a.i + 1) % Math.max(2, it.nChoices) };
    const filled = await page.evaluate(r => {
      const ins = [...document.querySelectorAll('.panel .ans input')];
      const set = (el, v) => { if (el) { el.value = String(v); el.dispatchEvent(new Event('input', { bubbles: true })); } };
      if (r.kind === 'frac') { if (ins.length >= 3) { set(ins[0], r.w || ''); set(ins[1], r.n); set(ins[2], r.d); } else { set(ins[0], r.n); set(ins[1], r.d); } return true; }
      if (r.kind === 'num') { set(ins[0], r.v); return ins.length > 0; }
      if (r.kind === 'pair') { set(ins[0], r.x); set(ins[1], r.y); return ins.length >= 2; }
      const b = document.querySelectorAll('.panel .opts button')[r.i]; if (b) b.click(); return !!b;
    }, resp);
    if (!filled) errors.push(`item ${i + 1} (${it.family}): could not fill the ${resp.kind} input`);
    if (i < 3 || wrong) await shot(`p${String(i + 1).padStart(2, '0')}-${it.family}${wrong ? '-ask' : ''}`);
    const clicked = await page.evaluate(() => { const b = [...document.querySelectorAll('.panel button.go')].find(x => x.textContent.trim() === 'Check' && !x.disabled); if (b) { b.click(); return true; } return false; });
    if (!clicked) { errors.push(`item ${i + 1}: no Check button`); break; }
    await sleep(wrong ? 6 : 0.5);
    if (wrong) { summary.wrong++; await shot(`p${String(i + 1).padStart(2, '0')}-${it.family}-solution`); }
    summary.items++;
    const st = await page.evaluate(() => ({
      done: document.querySelectorAll('.sgstrip i.ok').length, total: document.querySelectorAll('.sgstrip i').length,
      mastered: /Mastered/.test(document.querySelector('.meter')?.textContent ?? ''),
      overflow: Math.max(0, Math.round((document.querySelector('.panel')?.getBoundingClientRect().bottom ?? 0) - window.innerHeight)),
    }));
    Object.assign(summary, { subgoalsDone: st.done, subgoalsTotal: st.total, mastered: st.mastered });
    summary.panelOverflowPx = Math.max(summary.panelOverflowPx, st.overflow);
    if (st.mastered) break;
    const nx = await page.evaluate(() => { const b = [...document.querySelectorAll('.panel button.go')].find(x => /Next|Try one like it/.test(x.textContent)); if (b) { b.click(); return true; } return false; });
    if (!nx) { errors.push(`item ${i + 1}: no Next button`); break; }
    await sleep(2.5);   // let the next item's picture finish drawing before the next screenshot
  }
  const log = await page.evaluate(s => window.mathscenesLessons?.log(s) ?? [], slug);
  fs.writeFileSync(path.join(out, 'log.json'), JSON.stringify(log, null, 1));
  summary.attempts = log.length; summary.attemptsWithMc = log.filter(x => x.mc).length;
} catch (e) { errors.push(`practice: ${e.message}`); }
await shot('practice-end');
await browser.close();
fs.writeFileSync(path.join(out, 'summary.json'), JSON.stringify(summary, null, 1));
try { execFileSync('python', ['tools/contact-sheet.py', out], { stdio: 'inherit' }); } catch { errors.push('contact sheet failed'); }
console.log(JSON.stringify({ ...summary, errors: errors.length ? errors : 'none' }, null, 1));
