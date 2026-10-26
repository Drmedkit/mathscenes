// explain.ts: the worked steps of the "Step by step" card after a miss (docs/lessons/QUALITY_LAYER.md). Every family's
// solution lines already follow the lesson's method (divide neighbours for the factor, the value at t = 0 is a, count
// the periods in the exponent, undo by dividing, round only at the end) and mark the answer, so the card shows them.
import type { Explain } from '../../runtime/item';
import { stepsFrom } from '../../runtime/explain';

export const explain: Explain = it => stepsFrom(it);
