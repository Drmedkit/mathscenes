// explain.ts: the worked steps of the "Step by step" card after a miss (docs/lessons/QUALITY_LAYER.md).
// Every family's solution lines end on the answer: number items mark it with ans() (kit.numItem adds a closing line
// when a family does not), choice items end on the right choice through endOnChoice in kit.choiceItem. So the steps
// are the item's own solution.
import type { Explain } from '../../runtime/item';
import { stepsFrom } from '../../runtime/explain';

export const explain: Explain = it => stepsFrom(it);
/** "undefined term" is the vocabulary of this lesson (point, line, plane are undefined), not a broken value */
export const TEXT_OK = [/ ?undefined ?/i];
