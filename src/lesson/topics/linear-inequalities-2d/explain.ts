// explain.ts: the worked steps of the "Step by step" card after a miss (docs/lessons/QUALITY_LAYER.md). Every family's
// solution lines already follow the lesson's method (put the point in and compare, the boundary where the two sides
// are equal, dashed or solid from the sign, one test point off the line for the side, every constraint at the same
// point for a system, corners for an optimum) with the item's own numbers, and mark the answer: typed values with
// ans(), choices end on "So: <the right choice>" (items.ts choice helpers use endOnChoice).
import type { Explain } from '../../runtime/item';
import { stepsFrom } from '../../runtime/explain';

export const explain: Explain = it => stepsFrom(it);
