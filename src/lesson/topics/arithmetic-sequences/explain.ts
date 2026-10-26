// explain.ts: the worked steps of the "Step by step" card after a miss (docs/lessons/QUALITY_LAYER.md). Every family's
// solution lines already follow the lesson's method (check every jump; term n is n − 1 jumps after a_1; undo the
// formula to find n, then check it is a whole number in the domain; same seed + same step) and mark the answer, so
// the card shows them as they are.
import type { Explain } from '../../runtime/item';
import { stepsFrom } from '../../runtime/explain';

export const explain: Explain = it => stepsFrom(it);
