// explain.ts: the worked steps of the "Step by step" card after a miss (docs/lessons/QUALITY_LAYER.md). Every family's
// solution lines already follow the lesson's method (define the quantity, translate the bound phrase, put the SAME
// values into every rule, let the situation add its own bounds, round in the direction the bound needs) and mark the
// answer (typed values with ans(), choices end on "So: <the right choice>"), so the card shows them as they are.
import type { Explain } from '../../runtime/item';
import { stepsFrom } from '../../runtime/explain';

export const explain: Explain = it => stepsFrom(it);
