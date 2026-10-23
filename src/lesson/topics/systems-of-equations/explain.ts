// explain.ts: the worked steps of the "Step by step" card after a miss (docs/lessons/QUALITY_LAYER.md).
// The solve lines end on the pair they reach ("So the solution is (1, 2).", "They cross at (2, 0)."): for the card
// that point is marked coordinate by coordinate; a typed number with no mark gets the value after the last "=" of
// its last line with one marked ("y = −3"). What is read is what the line says, never item.answer. Choice families
// end on "So: <right choice>" in items.ts.
import type { Explain, Item } from '../../runtime/item';
import { marked, stepsFrom } from '../../runtime/explain';
import { markLastPoint, markTail, normalizeMarks } from '../dilations-and-similarity/explain';
import { fold } from '../multi-step-equations/explain';

// a full elimination or substitution can take six short lines: the card joins the shortest neighbours ("x = 1; y = 2")
function stepsOf(it: Item): string[] {
  if (it.input === 'choice') return it.solution.slice();
  const st = normalizeMarks(fold(it.solution), it.input);
  if (it.input === 'pair') return marked(st).length >= 2 ? st : markLastPoint(st) ?? st;
  return marked(st).length ? st : markTail(st, it.input) ?? st;
}
export const explain: Explain = it => stepsFrom(it, stepsOf(it));
