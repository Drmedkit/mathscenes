// explain.ts: the worked steps of the "Step by step" card after a miss (docs/lessons/QUALITY_LAYER.md).
// A coordinate answer is the last point (x, y) the solution writes: its two coordinates are marked as the answer.
import type { Explain } from '../../runtime/item';
import { ans, stepsFrom } from '../../runtime/explain';

const PT = /\(([−-]?\d+(?:\.\d+)?), ([−-]?\d+(?:\.\d+)?)\)/g;
/** mark the coordinates of the last point written in the steps: "(<b class="s">3</b>, <b class="s">−1</b>)" */
export function markLastPoint(steps: readonly string[]): string[] {
  for (let k = steps.length - 1; k >= 0; k--) {
    const all = [...steps[k]!.matchAll(PT)];
    const m = all[all.length - 1];
    if (!m) continue;
    const out = steps.slice();
    out[k] = steps[k]!.slice(0, m.index) + `(${ans(m[1]!)}, ${ans(m[2]!)})` + steps[k]!.slice(m.index! + m[0].length);
    return out;
  }
  return steps.slice();
}
export const explain: Explain = it => (it.input === 'pair' ? stepsFrom(it, markLastPoint(it.solution)) : stepsFrom(it));
