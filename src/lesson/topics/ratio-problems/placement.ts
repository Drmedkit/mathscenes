// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): scale a pair by a factor, go through the rate
// for one (a terminating decimal), and keep an exact fraction multiplier when no route is friendly.
import type { Placement } from '../../placement/types';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'scale-up-same-factor', family: 'scaleUp', standalone: true },
    { subgoal: 'unit-rate-decimal-route', family: 'unitRate', standalone: true },
    { subgoal: 'exact-fraction-factor', family: 'exactFrac', standalone: true },
  ],
};
