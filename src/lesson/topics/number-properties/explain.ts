// explain.ts: the worked steps of the "Step by step" card after a miss (docs/lessons/QUALITY_LAYER.md).
// Every family's solution lines already end on the answer (num and pair items mark it with ans(); choice items end on
// the right choice through endOnChoice in the choice helper), so the steps are the item's own solution.
import type { Explain } from '../../runtime/item';
import { stepsFrom } from '../../runtime/explain';

export const explain: Explain = it => stepsFrom(it);
/** text the sweep must not flag: "1/0 is not a number" is part of the lesson (0 has no reciprocal) */
export const TEXT_OK = [/ ?\b\d+\/0\b/];
