// explain.ts: the worked steps of the "Step by step" card after a miss (docs/lessons/QUALITY_LAYER.md).
// Every family's solution lines end on the answer: x = a ± bi items mark the real part and the number in front of i
// (common.ts endPm), a + bi values mark both parts (endZ), number items mark the number, two-box items mark both
// boxes, choice items end on the right choice through endOnChoice in common.ts keyed. So the steps are the item's own
// solution.
import type { Explain } from '../../runtime/item';
import { stepsFrom } from '../../runtime/explain';

export const explain: Explain = it => stepsFrom(it);
export const TEXT_OK: RegExp[] = [];
