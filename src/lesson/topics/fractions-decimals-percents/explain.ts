// explain.ts: the worked steps of the "Step by step" card after a miss (docs/lessons/QUALITY_LAYER.md).
// Bar-notation choices (0.1<span class="rep">6</span> vs 0.<span class="rep">16</span>) read the same as plain text, so
// a choice is also found by its HTML: the one choice whose exact HTML a step marks as the answer.
import type { Explain, Item } from '../../runtime/item';
import { marked, stepsFrom } from '../../runtime/explain';

/** the one choice whose HTML is marked as the answer in the steps; -1 if none or several */
export function markedChoiceHtml(it: Item, steps: readonly string[]): number {
  const mk = marked(steps);
  const hits = (it.choices ?? []).map((c, i) => (mk.includes(c) ? i : -1)).filter(i => i >= 0);
  return hits.length === 1 ? hits[0]! : -1;
}
export const explain: Explain = it => {
  // the marked HTML first: plain-text matching can pick "12" out of "1 ÷ 12" when two bar forms read alike
  const i = it.input === 'choice' ? markedChoiceHtml(it, it.solution) : -1;
  return i >= 0 ? { steps: it.solution.slice(), result: { kind: 'choice', i } } : stepsFrom(it);
};
