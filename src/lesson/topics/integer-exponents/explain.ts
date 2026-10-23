// explain.ts: the worked steps of the "Step by step" card after a miss (docs/lessons/QUALITY_LAYER.md).
// One reading the shared reader does not make for this lesson: a negative fraction answer ((−2)^−3 = −1/8) is read
// from the marked value as the lesson's own fraction response (w 0, n negative), not as a decimal whole.
import type { Explain } from '../../runtime/item';
import { leadValue, marked, stepsFrom } from '../../runtime/explain';

export const explain: Explain = it => {
  if (it.input === 'frac') {
    const mk = marked(it.solution), L = mk.length ? leadValue(mk[mk.length - 1]!) : null;
    if (L?.frac && L.v < 0) {
      const [w, n, d] = L.frac;
      return { steps: it.solution.slice(), result: { kind: 'frac', w: 0, n: -(w * d + n), d } };
    }
  }
  return stepsFrom(it);
};
