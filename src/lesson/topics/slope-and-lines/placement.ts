// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): the slope through two points (rising, and
// falling with a negative answer) and the equation y = mx + b of the line through two points (m and b in two boxes).
// The prompts give the points, so the grid is not needed.
import type { Placement } from '../../placement/types';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'change-quotient', family: 'slopePts', standalone: true },
    { subgoal: 'negative-slope', family: 'slopePts', standalone: true },
    { subgoal: 'recover-b', family: 'lineFromTwo', standalone: true },
  ],
};
