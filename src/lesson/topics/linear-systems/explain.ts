// explain.ts: the worked steps of the "Step by step" card after a miss (docs/lessons/QUALITY_LAYER.md). Every family's
// solution lines already follow the lesson's method with the item's own numbers (put the pair into BOTH equations;
// read the crossing, then check it; substitute in brackets; scale whole equations so one letter cancels, add, back-
// substitute, report the pair and check it; 0 = k means no solution, 0 = 0 means the whole line) and mark the answer:
// typed values with ans(), choices end on "So: <the right choice>" (itemKit.ts choice helpers use endOnChoice).
import type { Explain } from '../../runtime/item';
import { stepsFrom } from '../../runtime/explain';

export const explain: Explain = it => stepsFrom(it);
/** "undefined" is the lesson's own word for the slope of a vertical line (an answer and a step), not a missing value */
export const TEXT_OK = [/ ?undefined ?/];
