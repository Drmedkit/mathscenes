// explain.ts: the worked steps of the "Step by step" card after a miss (docs/lessons/QUALITY_LAYER.md).
// Every family's solution lines end on the answer: num, frac and pair items mark it with ans() (a pair marks both
// values, in the order of the boxes), choice items end on the right choice through endOnChoice in common.ts.
import type { Explain } from '../../runtime/item';
import { stepsFrom } from '../../runtime/explain';

export const explain: Explain = it => stepsFrom(it);
export const TEXT_OK: RegExp[] = [];
