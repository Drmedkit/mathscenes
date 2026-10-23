// walk-placement.mjs: click through the check-in page (pages/lessons/placement.html) like a student: answers right on
// lessons up to --knows (an index in topics.json order), "Not learned yet" or a wrong answer after it; screenshots
// every question and the result (and the teacher's view opened), and checks: no page errors, the board renders, the
// result has a start (or "all known") for every strand of placement/strands.json. Prints per strand the start found
// next to the one the walk implies (the strand's first lesson at or after --knows).
//   node tools/walk-placement.mjs [--knows 30] [--grade 7] [--seed 7] [--port 5290]
// Needs the dev server (port 5290). Headless, muted, Vite's live-reload client blocked.
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i < 0 ? d : argv[i + 1]; };
const KNOWS = Number(opt('knows', 30)), GRADE = opt('grade', '7'), SEED = opt('seed', '7'), PORT = opt('port', '5290');
const topics = JSON.parse(fs.readFileSync('pages/lessons/topics.json', 'utf8')).map(t => t.slug);
const out = path.join('out', 'walk-placement'); fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ headless: true, args: ['--mute-audio', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
const page = await browser.newPage();
const errors = [];
await page.setRequestInterception(true);
page.on('request', r => (new URL(r.url()).pathname.endsWith('/@vite/client') ? r.respond({ status: 200, contentType: 'application/javascript', body: 'export {}' }) : r.continue()));
page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
page.on('console', m => { if (m.type() === 'error' && !/vite|ERR_FAILED|favicon/.test(m.text())) errors.push(`console: ${m.text()}`); });
await page.setViewport({ width: 1280, height: 900 });
const sleep = s => new Promise(r => setTimeout(r, s * 1000));
let n = 0;
const shot = async name => { n++; await page.screenshot({ path: path.join(out, `${String(n).padStart(2, '0')}-${name}.png`), fullPage: true }); };

await page.goto(`http://localhost:${PORT}/lessons/placement.html?seed=${SEED}`, { waitUntil: 'networkidle0' });
await shot('intro');
await page.evaluate(g => { [...document.querySelectorAll('.grades button')].find(b => b.textContent.includes(g)).click(); }, GRADE);
await page.evaluate(() => [...document.querySelectorAll('button')].find(b => b.textContent === 'Start').click());
const asked = [];
for (let q = 1; q <= 30; q++) {
  try {
    await page.waitForFunction(q => (window.__placementQ ?? 0) >= q || window.__placementResult, { timeout: 30000 }, q);
  } catch {
    await shot('stuck');
    errors.push(`question ${q} never came (after ${asked.map(i => `${i.lesson}/${i.family}`).join(', ')})`);
    console.log(JSON.stringify({ errors }, null, 1)); await browser.close(); process.exit(1);
  }
  if (await page.evaluate(() => !!window.__placementResult)) break;
  await sleep(0.4);
  const it = await page.evaluate(() => { const it = window.__placementItem; return { id: it.id, family: it.family, subgoal: it.subgoal, answer: it.answer, input: it.input }; });
  const board = await page.evaluate(() => !!document.querySelector('canvas.q-board') || !document.querySelector('.panel p'));
  asked.push(it);
  if (q <= 3) await shot(`q${q}-${it.family}`);
  // the lesson asked (its index in topics.json order): the student knows every lesson before --knows
  const idx = await page.evaluate(() => window.__placementLesson ?? -1);
  it.lesson = topics[idx];
  const right = idx >= 0 && idx < KNOWS;
  const a = it.answer;
  if (!right) {
    await page.evaluate(() => [...document.querySelectorAll('button')].find(b => b.textContent === 'Not learned yet').click());
    continue;
  }
  await page.evaluate(a => {
    const ins = [...document.querySelectorAll('.panel .ans input')];
    const set = (el, v) => { el.value = String(v); };
    if (a.kind === 'num') set(ins[0], a.v);
    else if (a.kind === 'frac') { set(ins[0], a.w || ''); set(ins[1], a.n || (a.w ? '' : 0)); set(ins[2], a.n ? a.d : ''); }
    else if (a.kind === 'pair') { set(ins[0], a.x); set(ins[1], a.y); }
    else document.querySelectorAll('.panel .opts button')[a.i].click();
  }, a);
  await page.evaluate(() => [...document.querySelectorAll('button')].find(b => b.textContent === 'Next').click());
  if (!board) errors.push(`no board canvas for ${it.id}`);
}
await page.waitForFunction('window.__placementResult', { timeout: 30000 });
await sleep(0.5);
await page.setViewport({ width: 1280, height: 900 });
await shot('result');
await page.evaluate(() => { document.querySelector('details.teacher').open = true; });
await shot('result-teacher');
await page.setViewport({ width: 390, height: 844 });
await sleep(0.3);
await shot('result-phone');
const res = await page.evaluate(() => ({ start: window.__placementResult.start, asked: window.__placementResult.asked, skip: window.__placementResult.skip.length, gaps: window.__placementResult.gaps, strands: window.__placementResult.strands.map(t => ({ id: t.id, start: t.start })) }));
const cards = await page.evaluate(() => document.querySelectorAll('article.strand').length);
const STRANDS = JSON.parse(fs.readFileSync('pages/lessons/placement/strands.json', 'utf8')).strands;
if (res.strands.length !== STRANDS.length || cards !== STRANDS.length) errors.push(`expected ${STRANDS.length} strands, result has ${res.strands.length}, page shows ${cards}`);
const perStrand = STRANDS.map(t => {
  const want = t.slugs.find(sl => topics.indexOf(sl) >= KNOWS) ?? null, got = res.strands.find(x => x.id === t.id)?.start ?? null;
  const pos = sl => (sl ? t.slugs.indexOf(sl) : t.slugs.length);
  return `${t.id}: ${got ?? 'all known'} (walk implies ${want ?? 'all known'}, ${Math.abs(pos(got) - pos(want)) <= 1 ? 'within 1' : `off by ${pos(got) - pos(want)}`})`;
});
const summary = { knows: KNOWS, knowsUpTo: topics[KNOWS - 1], grade: GRADE, ...res, strands: perStrand, asked: asked.map(i => `${i.lesson}/${i.family}`), errors };
fs.writeFileSync(path.join(out, 'summary.json'), JSON.stringify(summary, null, 1));
console.log(JSON.stringify(summary, null, 1));
await browser.close();
process.exit(errors.length ? 1 : 0);
