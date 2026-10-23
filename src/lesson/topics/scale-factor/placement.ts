// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): the scale factor from one pair of sides, a
// missing side of a scaled photo, and the factor that undoes a scaling (all told in words, no grid needed).
import type { Placement } from '../../placement/types';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'find-factor-from-pair', family: 'findK', standalone: true },
    { subgoal: 'missing-side', family: 'missing', standalone: true },
    { subgoal: 'reverse-factor', family: 'reverse', standalone: true },
  ],
};
