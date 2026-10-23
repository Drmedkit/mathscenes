// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): from a story to y = mx + b (the unit rate
// first, then the start), the slope from two points, and the equation of the line through two points (m and b in
// the two boxes of "y = [ ] x + [ ]"). The prompts carry every number, so no graph or table is needed.
import type { Placement } from '../../placement/types';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'write-from-description', family: 'storyPair', standalone: true },
    { subgoal: 'slope-two-points', family: 'twoPointRate', standalone: true },
    { subgoal: 'equation-from-two-points', family: 'eqTwoPoints', standalone: true },
  ],
};
