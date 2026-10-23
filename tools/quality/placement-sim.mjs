// placement-sim.mjs: simulated students on the check-in model (src/lesson/placement/model.ts), the lesson graph
// (pages/lessons/placement/graph.json) and the strands (placement/strands.json). Each student has a grade (6-8), an
// ability, and a hidden set of known lessons (consistent with the graph: knowing a lesson mostly means knowing what it
// rests on). Knowing a lesson: the right answer, with slips. Not knowing it: "not learned yet" or a wrong answer (a
// lucky guess on choice questions).
//   node tools/quality/placement-sim.mjs [--n 300] [--slip 0.1] [--all] [--total] [--profile 0.5] [--strands file.json]
//     tuning: [--below 0.35] [--tw 0.15] [--stop 0.12] [--link 0.8] [--path 0.4] [--max 20] (defaults: the model's constants)
//   default   the real adapters: every lesson with a placement.ts is askable; the questions are the lessons' own items,
//             judged by their own check()
//   --all     every lesson askable with model answers (a typed answer, guess 5%), no items loaded: the model alone
//   --total   the old single-start model (questions scored on the overall uncertainty), strand starts read off it
//   --profile s  students also differ per strand (a strand ability ~ N(0, s) on top of the overall one); default 0
// Reports: questions per student, the single start (exact / within 2 lessons), per strand the start lesson exact /
// within 1 lesson of the truth (the strand's first lesson the student does not know), lessons decided and correct.
import path from 'node:path';
import fs from 'node:fs';
import { loadTs, loadLesson, closeLoader, ROOT } from './load.mjs';

const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i < 0 ? d : Number(argv[i + 1]); };
const N = opt('n', 300), SLIP = opt('slip', 0.1), ALL = argv.includes('--all'), TOTAL = argv.includes('--total'), PROFILE = opt('profile', 0);
const M = await loadTs(path.join(ROOT, 'src', 'lesson', 'placement', 'model.ts'));
const I = await loadTs(path.join(ROOT, 'src', 'lesson', 'runtime', 'item.ts'));
const dir = path.join(ROOT, 'pages', 'lessons', 'placement');
const graph = JSON.parse(fs.readFileSync(path.join(dir, 'graph.json'), 'utf8'));
const SFILE = argv.includes('--strands') ? argv[argv.indexOf('--strands') + 1] : path.join(dir, 'strands.json');
const STRANDS = JSON.parse(fs.readFileSync(SFILE, 'utf8')).strands;
const units = [...graph.units].sort((a, b) => a.order - b.order);
const idOf = new Map(units.map(u => [u.slug, u.id]));
const strandOf = new Map(STRANDS.flatMap(t => t.slugs.map(s => [idOf.get(s), t.id])));
const adapters = {};
if (!ALL) for (const u of units) {
  if (!fs.existsSync(path.join(ROOT, 'src', 'lesson', 'topics', u.slug, 'placement.ts'))) continue;
  const L = await loadLesson(u.slug);
  if (L.placement) adapters[u.id] = L;
}
const askable = ALL ? units.map(u => u.id) : Object.keys(adapters);
const rand = I.rng(2026);
const gauss = () => Math.sqrt(-2 * Math.log(rand() + 1e-12)) * Math.cos(2 * Math.PI * rand());
const strong = graph.edges.filter(e => e.w >= 0.75);
function student() {
  const grade = 6 + Math.floor(rand() * 3), a = 0.9 * (grade - 6) + gauss() * 0.8;
  const by = Object.fromEntries(STRANDS.map(t => [t.id, PROFILE * gauss()]));
  // difficulty grows along the order (the path), plus the lesson's grade
  const know = new Map(units.map(u => [u.id, a + by[strandOf.get(u.id)] + gauss() * 0.6 > 0.045 * u.order + 0.4 * (u.grade - 7) - 0.6]));
  for (let ch = true; ch;) { ch = false; for (const e of strong) if (know.get(e.post) && !know.get(e.pre) && rand() < 0.85) { know.set(e.post, false); ch = true; } }
  return { grade, know };
}
function answer(u, knows) {
  const L = adapters[u];
  if (!L) return { right: knows ? rand() > SLIP : rand() < 0.05, guess: 0.05 };
  const pk = L.placement.picks[Math.floor(rand() * L.placement.picks.length)];
  let it; for (let n = 1; n < 200; n++) { it = L.gens[pk.family](rand, n, pk.subgoal); if (!L.placement.use || L.placement.use(it)) break; }
  const guess = it.input === 'choice' ? 1 / it.choices.length : 0.05;
  let r = null;
  if (knows && rand() > SLIP) r = it.answer;
  else if (it.input === 'choice') r = { kind: 'choice', i: Math.floor(rand() * it.choices.length) };
  else if (!knows && rand() < 0.5) r = null;                                       // "not learned yet"
  else r = it.answer.kind === 'num' ? { kind: 'num', v: it.answer.v + 1 + Math.floor(rand() * 3) } : it.answer.kind === 'frac' ? { ...it.answer, d: it.answer.d + 1 } : it.answer.kind === 'pair' ? { ...it.answer, x: it.answer.x + 1 } : it.answer;
  return { right: r ? it.check(r).ok : false, guess, judgeErr: knows && r === it.answer && !it.check(r).ok };
}
const below = opt('below', TOTAL ? 0.5 : M.START_BELOW);
const mopts = { askable, max: opt('max', 20), min: 10, ...(TOTAL ? { pathLink: 0, startBelow: 0.5 } : { strands: STRANDS, totalWeight: opt('tw', M.TOTAL_W), startBelow: below, stopGain: opt('stop', M.STOP_GAIN), strandLink: opt('link', M.STRAND_LINK), pathLink: opt('path', M.PATH_LINK) }) };
let exact = 0, near = 0, asked = 0, dec = 0, decOk = 0, tot = 0, judgeErr = 0;
const per = Object.fromEntries(STRANDS.map(t => [t.id, { exact: 0, near: 0, asked: 0, off: 0 }]));
for (let k = 0; k < N; k++) {
  const { grade, know } = student();
  const S = M.create(graph, { ...mopts, priors: M.gradePriors(graph, grade) });
  for (let u; (u = M.next(S));) {
    const a = answer(u, know.get(u));
    if (a.judgeErr) judgeErr++;
    M.record(S, { unit: u, right: a.right, guess: a.guess });
  }
  const R = M.result(S); asked += R.asked;
  const truth = units.findIndex(u => !know.get(u.id)), got = R.start ? units.findIndex(u => u.id === R.start) : units.length;
  const t = truth < 0 ? units.length : truth;
  if (t === got) exact++;
  if (Math.abs(t - got) <= 2) near++;
  const pOf = new Map(R.units.map(x => [x.id, x]));
  for (const st of STRANDS) {
    const ids = st.slugs.map(s => idOf.get(s));
    const want = ids.findIndex(i => !know.get(i)), iw = want < 0 ? ids.length : want;
    let ig = ids.findIndex(i => pOf.get(i).p < below); if (ig < 0) ig = ids.length;
    if (!TOTAL) { const rs = R.strands.find(x => x.id === st.id); ig = rs.start ? ids.indexOf(idOf.get(rs.start)) : ids.length; }
    const P = per[st.id];
    if (iw === ig) P.exact++;
    if (Math.abs(iw - ig) <= 1) P.near++;
    P.off += ig - iw;
    P.asked += ids.reduce((a, i) => a + pOf.get(i).asked, 0);
  }
  for (const x of R.units) { tot++; if (x.status !== 'unsure') { dec++; if ((x.status === 'mastered') === know.get(x.id)) decOk++; } }
}
await closeLoader();
const pc = (a, b) => `${(100 * a / b).toFixed(1)}%`;
console.log(`${N} students, ${askable.length} askable lessons${ALL ? ' (--all: model answers, no items)' : ' (real adapters)'}, slip ${SLIP}${PROFILE ? `, strand profile ${PROFILE}` : ''}, ${TOTAL ? 'old single-start scoring' : `strand scoring (overall weight ${mopts.totalWeight}, start below ${below})`}`);
console.log(`questions per student: ${(asked / N).toFixed(1)}; right answers a lesson rejected: ${judgeErr}`);
console.log(`single start on the whole path: exact ${pc(exact, N)}, within 2 lessons ${pc(near, N)}`);
let sx = 0, sn = 0;
for (const st of STRANDS) {
  const P = per[st.id]; sx += P.exact; sn += P.near;
  console.log(`  ${st.id.padEnd(11)} ${String(st.slugs.length).padStart(2)} lessons  exact ${pc(P.exact, N).padStart(6)}  within 1 ${pc(P.near, N).padStart(6)}  questions ${(P.asked / N).toFixed(1).padStart(4)}  bias ${(P.off / N >= 0 ? '+' : '') + (P.off / N).toFixed(2)}`);
}
console.log(`per strand (mean of ${STRANDS.length}): exact ${pc(sx, N * STRANDS.length)}, within 1 lesson ${pc(sn, N * STRANDS.length)}`);
console.log(`lessons decided: ${pc(dec, tot)}, of those correct: ${pc(decOk, dec)}`);
