// explain.ts: the worked steps of the "Step by step" card after a miss (docs/lessons/QUALITY_LAYER.md). Every family's
// solution lines already follow the lesson's method (reversible steps on both sides, the symbol turning only for a
// negative factor, sets read from the leftover statement) and mark the answer, so the card shows them as they are.
import type { Explain } from '../../runtime/item';
import { stepsFrom } from '../../runtime/explain';

export const explain: Explain = it => stepsFrom(it);
