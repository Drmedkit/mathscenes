// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): find the original from the amount after a
// percent change (divide by the multiplier), decide which amount is 100% in a story, and the percent back to the start.
// Typed answers, no calculator items; the tape is the lesson's picture, not part of the question.
import type { Placement } from '../../placement/types';
import { plain } from '../../runtime/item';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'reverse-percent-change', family: 'reverse', standalone: true },
    { subgoal: 'context-diagnose-change', family: 'contextOrig', standalone: true },
    { subgoal: 'explain-base-change', family: 'undoPct', standalone: true },
  ],
  use: it => !/calculator allowed|you may use a calculator/i.test(plain(it.prompt)),
};
