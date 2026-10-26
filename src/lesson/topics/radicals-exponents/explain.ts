// explain.ts: the worked steps of the "Step by step" card after a miss (docs/lessons/QUALITY_LAYER.md).
// Every family's solution lines end on the answer: num, frac and pair items mark it with ans() (a pair marks both
// numbers, the exponent's numerator and denominator or the coefficient and the radicand), choice items end on the right
// choice through endOnChoice in common.ts. So the steps are the item's own solution.
import type { Explain } from '../../runtime/item';
import { stepsFrom } from '../../runtime/explain';

export const explain: Explain = it => stepsFrom(it);
/** text the sweep must not flag: "√0 = 0 in the denominator" names a division by 0 on purpose */
export const TEXT_OK: RegExp[] = [];
