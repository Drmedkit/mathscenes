// explain.ts: the worked steps of the "Step by step" card after a miss (docs/lessons/QUALITY_LAYER.md).
// Every family's solution lines end on the answer (num and pair items mark it with ans(); choice items end on the
// right choice through endOnChoice in common.ts choiceItem), so the steps are the item's own solution.
import type { Explain } from '../../runtime/item';
import { stepsFrom } from '../../runtime/explain';

export const explain: Explain = it => stepsFrom(it);
