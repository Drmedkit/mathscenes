// explain.ts: the worked steps of the "Step by step" card after a miss (docs/lessons/QUALITY_LAYER.md).
// The solution lines of a solve are the lesson's own method (clear fractions, expand, combine, collect, divide, check);
// the card shows at most 5, so a long solve drops the check line first, then joins "expand" + "combine like terms",
// then two moves to both sides. A negative fraction answer is read with its sign on the numerator.
import type { Explain, Response } from '../../runtime/item';
import { leadValue, marked, stepsFrom } from '../../runtime/explain';

const isCheck = (l: string) => /^Check in the original/.test(l);
function fit(lines: string[]): string[] {
  let s = lines.slice();
  if (s.length > 5) s = s.filter(l => !isCheck(l));
  // still too long: join two neighbouring steps of the same kind (expand + combine, or two moves to both sides)
  const join = (i: number) => { s = [...s.slice(0, i), `${s[i]!.replace(/\.$/, '')}, then ${s[i + 1]!.charAt(0).toLowerCase()}${s[i + 1]!.slice(1)}`, ...s.slice(i + 2)]; };
  const pairAt = (a: RegExp, b: RegExp) => s.findIndex((l, i) => a.test(l) && b.test(s[i + 1] ?? ''));
  if (s.length > 5) { const i = pairAt(/^(Expand the parentheses|Multiply every term inside)/, /^Combine like terms/); if (i >= 0) join(i); }
  if (s.length > 5) { const i = pairAt(/^(Add|Subtract) .* both sides/, /^(Add|Subtract) .* both sides/); if (i >= 0) join(i); }
  return s;
}
export const explain: Explain = it => {
  const ex = stepsFrom(it, fit(it.solution));
  if (!ex || it.input !== 'frac') return ex;
  // a negative fraction (x = −23/5) is read as the fraction itself, sign on the numerator
  const L = leadValue(marked(ex.steps).at(-1) ?? '');
  if (L?.frac && L.v < 0) {
    const [w, n, d] = L.frac;
    const result: Response = { kind: 'frac', w: 0, n: -(w * d + n), d };
    return { steps: ex.steps, result };
  }
  return ex;
};
