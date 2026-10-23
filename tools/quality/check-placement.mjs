// check-placement.mjs: checks every lesson's check-in adapter (src/lesson/topics/<slug>/placement.ts) against the
// lesson's own items and its independent oracle, the way pages/lessons/placement.html will ask them.
//   node tools/quality/check-placement.mjs [<slug> ...]      (default: every lesson with a placement.ts)
// Per pick, 300 items (after the adapter's `use` filter): the item's answer passes its check, the oracle agrees, the
// text is clean and short enough, a question that needs its picture has a figure, and the misconceptions the check
// reports (probed with typical wrong answers) exist in the catalogue. Exit 1 on any failure.
import fs from 'node:fs';
import path from 'node:path';
import { loadLesson, loadOracle, closeLoader, lessonSlugs, loadTs, ROOT } from './load.mjs';
import { plainText } from './view.mjs';
import { viewOf } from './view.mjs';
import { sameAnswer } from './answers.mjs';

const args = process.argv.slice(2), only = args.filter(a => !a.startsWith('--'));
const ESS = process.env.ESSENTIALS || path.join(ROOT, '..', 'math-curriculum-essentials');
const mcNames = (() => { try { return new Map(JSON.parse(fs.readFileSync(path.join(ESS, 'misconceptions.json'), 'utf8')).misconceptions.map(m => [m.id, m.name])); } catch { return null; } })();
const I = await loadTs(path.join(ROOT, 'src', 'lesson', 'runtime', 'item.ts'));
const slugs = only.length ? only : lessonSlugs().filter(s => fs.existsSync(path.join(ROOT, 'src', 'lesson', 'topics', s, 'placement.ts')));
const BAD = /(?<!is )undefined|NaN|\[object|Infinity|\+\s*[-−]\s*\d|\s{2,}\S/;
const PICTURE_WORDS = /\b(the picture|shown|drawn|lit |the lit|segment [A-D]\b|in the graph|this graph|the dot)\b/i;
const MAX_TEXT = 240, N = 300;

// typical wrong typed answers: the answer nudged, and simple combinations of the numbers in the question
function probes(it) {
  const a = it.answer, out = [];
  const nums = [...new Set([...plainText(it.prompt).matchAll(/-?\d+(?:\.\d+)?/g), ...String(it.board).matchAll(/-?\d+(?:\.\d+)?/g)].map(m => Number(m[0])))].slice(0, 8);
  const vals = a.kind === 'num' ? [a.v] : a.kind === 'frac' ? [a.w + a.n / a.d] : [];
  for (const v of vals) out.push(v * 10, v / 10, v + 1, v - 1, -v, 2 * v, v / 2, v * v, Math.sqrt(Math.abs(v)));
  for (const x of nums) { out.push(x); for (const y of nums) if (x !== y) out.push(x + y, x - y, x * y, y ? x / y : NaN); }
  const ok = out.filter(Number.isFinite);
  if (a.kind === 'num') return ok.map(v => ({ kind: 'num', v }));
  if (a.kind === 'frac') return ok.filter(v => v >= 0).map(v => ({ kind: 'frac', w: v, n: 0, d: 1 }));
  if (a.kind === 'choice') return (it.choices ?? []).map((_, i) => ({ kind: 'choice', i }));
  if (a.kind === 'pair') return [{ kind: 'pair', x: a.y, y: a.x }, { kind: 'pair', x: a.x + 1, y: a.y }, { kind: 'pair', x: a.x, y: a.y + 1 }];
  return [];
}

let fails = 0;
for (const slug of slugs) {
  const errs = [], warns = [];
  let L, O;
  try { L = await loadLesson(slug); } catch (e) { console.log(`FAIL ${slug}: does not load: ${e.message}`); fails++; continue; }
  const P = L.placement;
  if (!P) { console.log(`--   ${slug.padEnd(32)} no placement.ts`); continue; }
  try { O = await loadOracle(slug); } catch { O = null; }
  if (!Array.isArray(P.picks) || P.picks.length < 1 || P.picks.length > 3) errs.push('picks must list 1-3 (sub-goal, family) pairs');
  const mcs = new Set();
  let asked = 0;
  for (const pk of P.picks ?? []) {
    const sg = L.plan.find(p => p.id === pk.subgoal);
    if (!sg || !sg.families.includes(pk.family)) { errs.push(`${pk.subgoal}/${pk.family}: not a pair of plan.ts`); continue; }
    const R = I.rng(77 + pk.family.length);
    let made = 0, kept = 0;
    const seen = { e: 0 }, E = m => { if (seen.e++ < 6) errs.push(`${pk.subgoal}/${pk.family}: ${m}`); };
    while (kept < N && made < N * 8) {
      const it = L.gens[pk.family](R, ++made, pk.subgoal);
      it.subgoal = pk.subgoal;
      if (P.use && !P.use(it)) continue;
      kept++; asked++;
      const text = plainText(it.prompt);
      if (!text || text.length > MAX_TEXT) E(`question missing or longer than ${MAX_TEXT} characters: "${text}"`);
      if (BAD.test(text) || BAD.test(it.board ?? '')) E(`broken text: "${text}" ${it.board}`);
      if (!it.check(it.answer).ok) E(`check rejects its own answer ${JSON.stringify(it.answer)}`);
      const hasPic = ['picture', 'pict', 'pic', 'givens'].some(k => it[k]);
      const fig = P.figure ? P.figure(it) : null;
      if (fig && (!/^<svg[\s>]/.test(fig) || fig.length > 6144 || /href=|<script|url\(/i.test(fig) || !/viewBox=/.test(fig))) E('figure must be a small self-contained svg with a viewBox');
      if (!fig && PICTURE_WORDS.test(text)) E(`the question needs its picture ("${text.match(PICTURE_WORDS)[0]}") but the adapter gives no figure`);
      if (!fig && hasPic && !pk.standalone) E('the items carry picture data: give a figure, or set standalone: true once you checked the question stands alone');
      if (O) {
        let want; try { want = O.solve(viewOf(it, pk.subgoal)); } catch { want = undefined; }
        if (want !== undefined && !sameAnswer(it, want, it.answer)) E(`answer ${JSON.stringify(it.answer)} but the oracle says ${JSON.stringify(want)}`);
      }
      for (const r of probes(it)) { try { const v = it.check(r); if (!v.ok && v.mc) mcs.add(v.mc); } catch { /* fine */ } }
    }
    if (kept < N) E(`only ${kept} of ${made} items pass the adapter's use() filter`);
  }
  for (const id of [...mcs, ...Object.keys(P.errorLabel ?? {})]) if (mcNames && !mcNames.has(id)) errs.push(`misconception ${id} is not in misconceptions.json`);
  const unnamed = [...mcs].filter(id => !P.errorLabel?.[id]);
  if (!O) warns.push('no oracle: answers not independently checked');
  if (errs.length) fails++;
  console.log(`${errs.length ? 'FAIL' : 'ok  '} ${slug.padEnd(32)} ${String(asked).padStart(4)} items, picks ${P.picks.map(p => p.family).join(',')}, ${mcs.size} misconceptions probed (${mcs.size - unnamed.length} with own wording, the rest use the catalogue name)`);
  errs.forEach(e => console.log(`       x ${e}`));
  warns.forEach(w => console.log(`       ! ${w}`));
}
await closeLoader();
console.log(`\n${slugs.length} adapters, ${fails} failing`);
process.exit(fails ? 1 : 0);
