// explain.ts: the worked steps of the "Step by step" card after a miss (docs/lessons/QUALITY_LAYER.md). Every family's
// solution lines already follow the lesson's method (name the units, a factor equal to 1 turned so units cancel, half a
// step either side, report only digits the range agrees on) and mark the answer, so the card uses them as they are.
import type { Explain } from '../../runtime/item';
import { stepsFrom } from '../../runtime/explain';

export const explain: Explain = it => stepsFrom(it);
