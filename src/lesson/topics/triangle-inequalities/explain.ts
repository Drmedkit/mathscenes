// explain.ts: the worked steps of the "Step by step" card after a miss (docs/lessons/QUALITY_LAYER.md).
// Every family's solution lines end on the answer: number items mark it with <b class="s"> (the course's numItem),
// pair items mark both bounds (tkit pairItem), choice items end on the right choice (the course's choiceItem,
// endOnChoice). So the steps are the item's own solution, and the answer is read from them, not from item.answer.
import type { Explain } from '../../runtime/item';
import { stepsFrom } from '../../runtime/explain';

export const explain: Explain = it => stepsFrom(it);
