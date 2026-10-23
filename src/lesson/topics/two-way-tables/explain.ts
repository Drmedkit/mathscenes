// explain.ts: the worked steps of the "Step by step" card after a miss (docs/lessons/QUALITY_LAYER.md).
// The lesson's lines put what they reach in bold (<b>1</b>, "From <b>6</b> to <b>12</b>"): for the card the last
// bold value (the last two for a pair) is marked as the answer. Without bold, a pair is read from the last point
// "(a, b)" its lines reach and a number from the value after the last "=". What is read is what the lines say, never
// item.answer. Choice families end on "So: <right choice>" in items.ts.
import type { Explain, Item } from '../../runtime/item';
import { marked, stepsFrom } from '../../runtime/explain';
import { markLastPoint, markTail, normalizeMarks } from '../dilations-and-similarity/explain';
import { promoteBold } from '../scatter-plots/explain';

function stepsOf(it: Item): string[] {
  if (it.input === 'choice') return it.solution.slice();
  const st = normalizeMarks(it.solution, it.input), need = it.input === 'pair' ? 2 : 1;
  if (marked(st).length >= need) return st;
  const bold = promoteBold(st, need);
  if (bold) return bold;
  return (it.input === 'pair' ? markLastPoint(st) : markTail(st, it.input)) ?? st;
}
export const explain: Explain = it => stepsFrom(it, stepsOf(it));
