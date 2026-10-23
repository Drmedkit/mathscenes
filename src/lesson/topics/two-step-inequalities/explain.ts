// explain.ts: the worked steps of the "Step by step" card after a miss (docs/lessons/QUALITY_LAYER.md).
// A number-line graph choice is an SVG; the steps name it by its label ("So: open dot at 3, shaded left").
import type { Explain } from '../../runtime/item';
import { marked, stepsFrom } from '../../runtime/explain';
import { graphLabel } from './items';

export const explain: Explain = it => {
  const ex = stepsFrom(it);
  if (ex || it.input !== 'choice') return ex;
  const mk = marked(it.solution);
  const hits = (it.choices ?? []).map((c, i) => (mk.includes(graphLabel(c) ?? '\u0000') ? i : -1)).filter(i => i >= 0);
  return hits.length === 1 ? { steps: it.solution.slice(), result: { kind: 'choice', i: hits[0]! } } : null;
};
