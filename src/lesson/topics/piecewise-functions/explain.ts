// explain.ts: the worked steps of the "Step by step" card after a miss (docs/lessons/QUALITY_LAYER.md). Every family's
// solution lines follow the lesson's method (test the input against each condition, the ≤ / ≥ decides a breakpoint,
// filled dot = included, open dot = left out, per started unit = round up, per completed unit = round down) and mark
// the answer (or end on the right choice), so the card shows them as they are.
import type { Explain } from '../../runtime/item';
import { stepsFrom } from '../../runtime/explain';

export const explain: Explain = it => stepsFrom(it);
