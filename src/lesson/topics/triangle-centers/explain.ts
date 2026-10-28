// explain.ts: the worked steps of the "Step by step" card after a miss (docs/lessons/QUALITY_LAYER.md).
// Every family's solution lines end on the answer: number items mark it with <b class="s"> (the course's numItem adds
// a marked line when a family has none), choice items end on the right choice through endOnChoice in choiceItem.
import type { Explain } from '../../runtime/item';
import { stepsFrom } from '../../runtime/explain';

export const explain: Explain = it => stepsFrom(it);
