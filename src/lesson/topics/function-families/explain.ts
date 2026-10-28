// explain.ts: the worked steps of the "Step by step" card after a miss (docs/lessons/QUALITY_LAYER.md). Every family's
// solution lines already follow the lesson's method (equal x-steps first, then 1st differences, 2nd differences and
// ratios; the rule guarantees the pattern, a table only shows consistency; the mechanism in the story) and mark the
// answer, so the card shows them.
import type { Explain } from '../../runtime/item';
import { stepsFrom } from '../../runtime/explain';

export const explain: Explain = it => stepsFrom(it);
