// explain.ts: the worked steps of the "Step by step" card after a miss (docs/lessons/QUALITY_LAYER.md).
// An exact answer a + bπ goes in two boxes (the number part and the π part): the last a + bπ (or a − bπ, or bπ alone,
// whose number part is 0) that the steps write is marked there, so the card ends on both boxes.
import type { Explain } from '../../runtime/item';
import { stepsFrom } from '../../runtime/explain';

const PN = /(?:(\d+(?:\.\d+)?) ([+−]) )?(\d+(?:\.\d+)?)?π/g;
const S = (v: string) => `<b class="s">${v}</b>`;
function markPN(steps: readonly string[]): string[] | null {
  for (let i = steps.length - 1; i >= 0; i--) {
    const s = steps[i]!.replace(/<b class="s">((?:(?!<\/b>).)*)<\/b>/g, '$1');
    const all = [...s.matchAll(PN)];
    const m = all[all.length - 1];
    if (!m) continue;
    const [whole, a, op, b] = m;
    const out = (a ? `${S(a)} ${op} ` : `${S('0')} + `) + (b ? `${S(b)}π` : `${S('π')}`);
    const res = steps.slice();
    res[i] = s.slice(0, m.index!) + out + s.slice(m.index! + whole.length);
    return res;
  }
  return null;
}
export const explain: Explain = it => {
  if (it.input === 'pair') { const s = markPN(it.solution); return s ? stepsFrom(it, s) : null; }
  return stepsFrom(it);
};
