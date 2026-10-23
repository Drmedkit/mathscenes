// explain.ts: the worked steps of the "Step by step" card after a miss (docs/lessons/QUALITY_LAYER.md).
// The steps write mixed numbers the way the lesson does (15¾ ft², 36⅔ ft³); a fraction answer is read from the last
// number of the last step, its vulgar fraction included.
import type { Explain, Response } from '../../runtime/item';
import { plain } from '../../runtime/item';
import { stepsFrom } from '../../runtime/explain';

const VULGAR: Record<string, [number, number]> = { '½': [1, 2], '⅓': [1, 3], '⅔': [2, 3], '¼': [1, 4], '¾': [3, 4], '⅛': [1, 8], '⅜': [3, 8], '⅝': [5, 8], '⅞': [7, 8] };
/** the last number in a step: 15¾ → [15, 3, 4], ⅓ → [0, 1, 3], 23 → [23, 0, 1] */
function lastMixed(html: string): [number, number, number] | null {
  const t = plain(html).replace(/(\d),(?=\d{3}(?!\d))/g, '$1');
  const all = [...t.matchAll(/(\d+(?:\.\d+)?)?([½⅓⅔¼¾⅛⅜⅝⅞])|(\d+(?:\.\d+)?)/g)];
  const m = all[all.length - 1];
  if (!m) return null;
  if (m[2]) { const [n, d] = VULGAR[m[2]]!; return [m[1] ? Number(m[1]) : 0, n, d]; }
  return [Number(m[3]), 0, 1];
}
export const explain: Explain = it => {
  const ex = stepsFrom(it);
  if (it.input !== 'frac') return ex;
  const steps = ex?.steps ?? it.solution.slice();
  const v = lastMixed(steps[steps.length - 1] ?? '');
  if (!v) return null;
  const result: Response = { kind: 'frac', w: v[0], n: v[1], d: v[2] };
  return { steps, result };
};
