// explain.ts: the worked steps of the "Step by step" card after a miss (docs/lessons/QUALITY_LAYER.md).
// The runtime reads a negative written fraction (−15/2, −5 1/2) as a decimal whole number (w: −7.5), which the lesson's
// check does not take; here the same marked value is kept as a signed fraction (w: −5, n: 1, d: 2 or n: −15, d: 2).
import type { Explain, Response } from '../../runtime/item';
import { leadValue, marked, stepsFrom } from '../../runtime/explain';

function signedFrac(steps: readonly string[]): Response | null {
  const mk = marked(steps);
  const L = mk.length ? leadValue(mk[mk.length - 1]!) : null;
  if (!L?.frac || L.v >= 0) return null;
  const [w, n, d] = L.frac;
  return w ? { kind: 'frac', w: -w, n, d } : { kind: 'frac', w: 0, n: -n, d };
}
export const explain: Explain = it => {
  const ex = stepsFrom(it);
  if (ex && ex.result.kind === 'frac' && !Number.isInteger(ex.result.w)) return { steps: ex.steps, result: signedFrac(ex.steps) ?? ex.result };
  return ex;
};
