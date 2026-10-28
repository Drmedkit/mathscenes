// explain.ts: the worked steps of the "Step by step" card after a miss (docs/lessons/QUALITY_LAYER.md).
// Every family's solution lines check the claim, the form or the proof line by line and end on the right choice
// (kit.choiceItem adds "So: <right choice>" through endOnChoice). So the steps are the item's own solution.
import type { Explain } from '../../runtime/item';
import { stepsFrom } from '../../runtime/explain';

export const explain: Explain = it => stepsFrom(it);
