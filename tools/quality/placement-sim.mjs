// placement-sim.mjs: simulated students on the check-in model (src/lesson/placement/model.ts) and the lesson graph
// (pages/lessons/placement/graph.json). Each student has a grade (6-8), an ability, and a hidden set of known lessons
// (consistent with the graph: knowing a lesson mostly means knowing what it rests on). Knowing a lesson: the right
// answer, with slips. Not knowing it: "not learned yet" or a wrong answer (a lucky guess on choice questions).
//   node tools/quality/placement-sim.mjs [--n 300] [--slip 0.1] [--all]   (--all: as if every lesson had an adapter)
// With the real adapters, the questions are the lessons' own items, judged by their own check().
// Reports: questions per student, start lesson exact / within 2 lessons of the truth, lessons decided and correct.
import path from 'node:path';
import fs from 'node:fs';
import { loadTs, loadLesson, closeLoader, ROOT } from './load.mjs';

const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i < 0 ? d : Number(argv[i + 1]); };
const N = opt('n', 300), SLIP = opt('slip', 0.1), ALL = argv.includes('--all');
const M = await loadTs(path.join(ROOT, 'src', 'lesson', 'placement', 'model.ts'));
const I = await loadTs(path.join(ROOT, 'src', 'lesson', 'runtime', 'item.ts'));
const graph = JSON.parse(fs.readFileSync(path.join(ROOT, 'pages', 'lessons', 'placement', 'graph.json'), 'utf8'));
const units = [...graph.units].sort((a, b) => a.order - b.order);
const adapters = {};
for (const u of units) {
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
  // difficulty grows along the order (the path), plus the lesson's grade
  const know = new Map(units.map(u => [u.id, a + gauss() * 0.6 > 0.045 * u.order + 0.4 * (u.grade - 7) - 0.6]));
  for (let ch = true; ch;) { ch = false; for (const e of strong) if (know.get(e.post) && !know.get(e.pre) && rand() < 0.85) { know.set(e.post, false); ch = true; } }
  return { grade, know };
}
function answer(u, knows) {
  const L = adapters[u];
  if (!L || ALL && !L) return { right: knows ? rand() > SLIP : rand() < 0.05, guess: 0.05 };
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
let exact = 0, near = 0, asked = 0, dec = 0, decOk = 0, tot = 0, judgeErr = 0;
for (let k = 0; k < N; k++) {
  const { grade, know } = student();
  const S = M.create(graph, { askable, max: 20, min: 10, priors: M.gradePriors(graph, grade) });
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
  for (const x of R.units) { tot++; if (x.status !== 'unsure') { dec++; if ((x.status === 'mastered') === know.get(x.id)) decOk++; } }
}
await closeLoader();
const pc = (a, b) => `${(100 * a / b).toFixed(1)}%`;
console.log(`${N} students, ${askable.length} askable lessons${ALL ? ' (--all: every lesson as if it had an adapter)' : ' (real adapters)'}, slip ${SLIP}`);
console.log(`questions per student: ${(asked / N).toFixed(1)}; right answers a lesson rejected: ${judgeErr}`);
console.log(`start lesson exact: ${pc(exact, N)}, within 2 lessons: ${pc(near, N)}`);
console.log(`lessons decided: ${pc(dec, tot)}, of those correct: ${pc(decOk, dec)}`);
