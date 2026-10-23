// items-dump.mjs: the practice items of a lesson AS THE STUDENT SEES THEM, per (sub-goal, family): exactly the view
// an oracle's solve(q) gets (tools/quality/view.mjs): the prompt as plain text, the board TeX, the answer input
// (kind, unit, pair boxes), the choices, and the picture data the page draws. By default it does NOT print the
// answer or the worked solution (--answers adds them, for the lesson builder only; an oracle writer never uses it).
//   node tools/quality/items-dump.mjs <slug> [--n 4] [--seed 1] [--family solve] [--subgoal solve-signed] [--json] [--answers]
import { loadLesson, closeLoader, pairsOf, loadTs, ROOT } from './load.mjs';
import { viewOf, plainText } from './view.mjs';
import path from 'node:path';

const argv = process.argv.slice(2);
const slug = argv[0]?.startsWith('--') ? '' : argv[0];
if (!slug) { console.error('usage: node tools/quality/items-dump.mjs <slug> [--n 4] [--seed 1] [--family f] [--subgoal sg] [--json] [--answers]'); process.exit(2); }
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i < 0 ? d : argv[i + 1]; };
const N = Number(opt('n', 4)), SEED = Number(opt('seed', 1)), FAM = opt('family', ''), SG = opt('subgoal', '');
const ANSWERS = argv.includes('--answers'), JSON_OUT = argv.includes('--json');

const L = await loadLesson(slug);
const I = await loadTs(path.join(ROOT, 'src', 'lesson', 'runtime', 'item.ts'));
const out = [];
for (const { subgoal, family } of pairsOf(L.plan)) {
  if (FAM && family !== FAM) continue;
  if (SG && subgoal !== SG) continue;
  const R = I.rng(SEED * 7919 + family.length * 31 + subgoal.length);
  for (let k = 1; k <= N; k++) {
    const it = L.gens[family](R, k, subgoal);
    const v = { familyName: L.names[family] ?? family, ...viewOf(it, subgoal) };
    if (ANSWERS) Object.assign(v, { answer: it.answer, solution: it.solution.map(plainText) });
    out.push(v);
  }
}
if (JSON_OUT) console.log(JSON.stringify(out, null, 1));
else for (const v of out) {
  console.log(`\n[${v.subgoal} / ${v.family}] ${v.familyName}  (${v.id})`);
  console.log(`  prompt: ${v.prompt}`);
  if (v.board) console.log(`  board : ${v.board}`);
  console.log(`  input : ${v.input}${v.unit ? ` (unit: ${v.unit})` : ''}${v.pair ? `  ${v.pair.lead} [ ] ${v.pair.op} [ ] ${v.pair.tail}` : ''}`);
  if (v.choices) v.choices.forEach((c, i) => console.log(`    (${i}) ${c}`));
  if (Object.keys(v.data).length) console.log(`  data  : ${JSON.stringify(v.data).slice(0, 700)}`);
  if (v.answer) console.log(`  answer: ${JSON.stringify(v.answer)}\n  solution: ${v.solution.join(' | ')}`);
}
await closeLoader();
