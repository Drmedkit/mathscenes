// explain.ts: the worked steps of the "Step by step" card after a miss (docs/lessons/QUALITY_LAYER.md).
// Every family's solution lines end on the answer: number and fraction items mark it with <b class="s"> (numR / numX /
// fracR add a closing line when no step marks it), choice items end on the right choice through endOnChoice in the
// kit's choiceItem, the solve-the-triangle pair marks both values. So the steps are the item's own solution.
import type { Explain } from '../../runtime/item';
import { stepsFrom } from '../../runtime/explain';

export const explain: Explain = it => stepsFrom(it);
