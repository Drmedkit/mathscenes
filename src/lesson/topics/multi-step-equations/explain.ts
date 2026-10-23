// explain.ts: the worked steps of the "Step by step" card after a miss (docs/lessons/QUALITY_LAYER.md).
// The solve families reuse the linear-equations work lines (read-only import), which can run to six lines (clear,
// expand, collect, undo, divide, check). The card shows at most five: the shortest neighbouring pair of moves before
// the check line is joined into one step. A negative fraction answer (x = −13/3) is read as the fraction it is (the
// runtime reader turns it into a decimal, which this lesson's exact check rejects).
import type { Explain, Response } from '../../runtime/item';
import { plain } from '../../runtime/item';
import { leadValue, marked, stepsFrom } from '../../runtime/explain';

const MAX = 5, CHARS = 200;
export function fold(lines: readonly string[]): string[] {
  const out = lines.slice();
  while (out.length > MAX) {
    let best = -1, len = Infinity;
    for (let i = 0; i + 1 < out.length; i++) {
      if (/^Check\b/.test(plain(out[i + 1]!))) continue;   // the check stays its own step
      const l = plain(out[i]!).length + 1 + plain(out[i + 1]!).length;
      if (l <= CHARS && l < len) { best = i; len = l; }
    }
    if (best < 0) break;
    out.splice(best, 2, `${out[best]}${/[.:!?✓]\s*$/.test(plain(out[best]!)) ? ' ' : '; '}${out[best + 1]}`);   // "x = 1; y = 2"
  }
  return out;
}
/** a negative written fraction (−13/3, −2 1/3) as the fraction boxes hold it */
function negFrac(steps: readonly string[]): Response | null {
  const mk = marked(steps), L = mk.length ? leadValue(mk[mk.length - 1]!) : null;
  if (!L?.frac || L.v >= 0) return null;
  const [w, n, d] = L.frac;
  return w ? { kind: 'frac', w: -w, n, d } : { kind: 'frac', w: 0, n: -n, d };
}
export const explain: Explain = it => {
  const ex = stepsFrom(it, fold(it.solution));
  if (!ex || it.input !== 'frac') return ex;
  const nf = negFrac(ex.steps);
  return nf ? { ...ex, result: nf } : ex;
};
