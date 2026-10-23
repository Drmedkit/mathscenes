// explain.ts: the worked steps of the "Step by step" card after a miss (docs/lessons/QUALITY_LAYER.md).
// The lesson marks whole statements ("So M′ = (6, 0)", "P′Q′ = 11"): a coordinate answer is the last point the steps
// write (its two coordinates are marked), a typed number is the value after the last "=" of the last marked statement.
import type { Explain, Item } from '../../runtime/item';
import { ans, leadValue, marked, stepsFrom } from '../../runtime/explain';

const PT = /\(([−-]?\d+(?:\.\d+)?), ([−-]?\d+(?:\.\d+)?)\)/g;
/** the last point (x, y) written in the steps, with its coordinates marked (a marked statement around it is opened) */
export function markLastPoint(steps: readonly string[]): string[] {
  for (let k = steps.length - 1; k >= 0; k--) {
    const step = steps[k]!.replace(/<b class="s">((?:(?!<\/b>).)*)<\/b>/g, (m0, inner: string) => (/\(([−-]?\d+(?:\.\d+)?), ([−-]?\d+(?:\.\d+)?)\)/.test(inner) ? inner : m0));
    const all = [...step.matchAll(PT)], m = all[all.length - 1];
    if (!m) continue;
    const out = steps.slice();
    out[k] = step.slice(0, m.index) + `(${ans(m[1]!)}, ${ans(m[2]!)})` + step.slice(m.index! + m[0].length);
    return out;
  }
  return steps.slice();
}
/** a typed number: the value after the last "=" of the last marked statement ("P′Q′ = 11", "∠P′Q′R′ = 90°") */
function markedValue(it: Item) {
  const mk = marked(it.solution), last = mk[mk.length - 1];
  if (!last) return null;
  const L = leadValue(last.split('=').pop()!);
  return L ? { steps: it.solution.slice(), result: { kind: 'num' as const, v: L.v } } : null;
}
export const explain: Explain = it => {
  if (it.input === 'pair') return stepsFrom(it, markLastPoint(it.solution));
  return stepsFrom(it) ?? (it.input === 'num' ? markedValue(it) : null);
};
