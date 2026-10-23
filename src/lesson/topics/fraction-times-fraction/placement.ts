// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): multiply two proper fractions, multiply with
// mixed numbers, and a fraction of a fraction in a story (all typed, any equal form accepted).
import type { Placement } from '../../placement/types';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'compute-proper', family: 'compute', standalone: true },
    { subgoal: 'mixed-number-factors', family: 'compute', standalone: true },
    { subgoal: 'apply-context', family: 'story', standalone: true },
  ],
};
