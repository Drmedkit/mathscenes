// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): a sharing story with fewer wholes than people,
// a share bigger than one as a mixed number, and a leftover shared as a fraction of the divisor.
import type { Placement } from '../../placement/types';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'share-several-wholes-less-than-one', family: 'story', standalone: true },
    { subgoal: 'quotient-as-mixed-number', family: 'toMixed', standalone: true },
    { subgoal: 'remainder-as-fraction-of-divisor', family: 'remainder', standalone: true },
  ],
};
