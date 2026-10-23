// explain.ts: the worked steps of the "Step by step" card after a miss (docs/lessons/QUALITY_LAYER.md).
// Two readings the shared reader does not make for this lesson, both read from the marked value in the steps:
// - a negative fraction answer (−2/15, −1 1/9) as the lesson's own fraction response (w 0, n negative), not a decimal
//   whole the fraction boxes cannot hold;
// - a repeating decimal choice (0.8<span class="rep">3</span>) next to the plain 0.83: the marked choice is matched on
//   its HTML, because the two read the same as plain text.
import type { Explain, Item, Response } from '../../runtime/item';
import { leadValue, marked, stepsFrom } from '../../runtime/explain';

function negFrac(it: Item, steps: readonly string[]): Response | null {
  const mk = marked(steps), L = mk.length ? leadValue(mk[mk.length - 1]!) : null;
  if (!L?.frac || L.v >= 0) return null;
  const [w, n, d] = L.frac;
  return { kind: 'frac', w: 0, n: -(w * d + n), d };
}
function rawChoice(it: Item, steps: readonly string[]): Response | null {
  const mk = new Set(marked(steps));
  const hits = (it.choices ?? []).map((c, i) => (mk.has(c) ? i : -1)).filter(i => i >= 0);
  return hits.length === 1 ? { kind: 'choice', i: hits[0]! } : null;
}
export const explain: Explain = it => {
  if (it.input === 'frac') { const r = negFrac(it, it.solution); if (r) return { steps: it.solution.slice(), result: r }; }
  const ex = stepsFrom(it);
  if (ex || it.input !== 'choice') return ex;
  const r = rawChoice(it, it.solution);
  return r ? { steps: it.solution.slice(), result: r } : null;
};
/** "no number works: undefined" is the maths of a division by 0, not a broken value */
export const TEXT_OK = [/ undefined/];
