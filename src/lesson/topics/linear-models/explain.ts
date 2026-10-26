// explain.ts: the worked steps of the "Step by step" card after a miss (docs/lessons/QUALITY_LAYER.md). Every family's
// solution lines end on the answer they arrive at: the marked value(s) for number and pair items, the named option
// for choice items (items.ts adds "So: <the right option>" through endOnChoice).
import type { Explain } from '../../runtime/item';
import { stepsFrom } from '../../runtime/explain';

export const explain: Explain = it => stepsFrom(it);
