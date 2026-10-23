// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): a verbal scale with a mixed-number map length,
// a 1 : 24,000 map to feet on the ground, and the same road on a map with another ratio scale. All asked in words.
import type { Placement } from '../../placement/types';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'verbal-scale-calc', family: 'verbalMixed', standalone: true },
    { subgoal: 'customary-route', family: 'customaryFt', standalone: true },
    { subgoal: 'compare-denominators', family: 'sameRoad', standalone: true },
  ],
};
