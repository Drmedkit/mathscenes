// explain.ts: the worked steps of the "Step by step" card after a miss (docs/lessons/QUALITY_LAYER.md).
// - an answer in scientific notation (two boxes: the number in front and the exponent) is the last a × 10ⁿ the steps
//   write: its two parts are marked there;
// - a typed decimal is read from the marked value with every thousands comma removed (7,400,000 is 7400000).
import type { Explain, Response } from '../../runtime/item';
import { plain } from '../../runtime/item';
import { leadValue, marked, stepsFrom } from '../../runtime/explain';

const SCI = /(\d+(?:\.\d+)?) × 10<sup>([−-]?\d+)<\/sup>/g;
/** mark the a and the n of the last a × 10ⁿ in the steps (the form the answer boxes ask for) */
function markSci(steps: readonly string[]): string[] | null {
  for (let i = steps.length - 1; i >= 0; i--) {
    const s = steps[i]!.replace(/<b class="s">((?:(?!<\/b>).)*)<\/b>/g, '$1');
    const all = [...s.matchAll(SCI)];
    const m = all[all.length - 1];
    if (!m) continue;
    const at = m.index!;
    const marked1 = `<b class="s">${m[1]}</b> × 10<sup><b class="s">${m[2]}</b></sup>`;
    const out = steps.slice();
    out[i] = s.slice(0, at) + marked1 + s.slice(at + m[0].length);
    return out;
  }
  return null;
}
/** the marked decimal, thousands commas removed in full (the runtime reader stops after the first group) */
function numOf(steps: readonly string[]): number | null {
  const mk = marked(steps);
  const last = mk[mk.length - 1];
  if (last === undefined) return null;
  const t = plain(last).replace(/(\d),(?=\d{3}(?!\d))/g, '$1');
  return leadValue(t)?.v ?? null;
}
export const explain: Explain = it => {
  if (it.input === 'pair') { const s = markSci(it.solution); return s ? stepsFrom(it, s) : null; }
  const ex = stepsFrom(it);
  if (ex && it.input === 'num') {
    const v = numOf(ex.steps);
    if (v !== null) { const result: Response = { kind: 'num', v }; return { steps: ex.steps, result }; }
  }
  return ex;
};
