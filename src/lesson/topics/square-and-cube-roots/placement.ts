// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): evaluate a perfect cube root (or a cube),
// bound a square root between whole numbers, and solve x² = p after isolating x² (both solutions). Typed answers;
// the questions stand without the tiles, the cube or the ruler.
import type { Placement } from '../../placement/types';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'eval-perfect-cube-roots', family: 'evalCube', standalone: true },
    { subgoal: 'bound-square-root-integers', family: 'boundSq', standalone: true },
    { subgoal: 'isolate-then-root', family: 'isolate', standalone: true },
  ],
  errorLabel: {
    'mc.quadratic-polynomial.only-positive-root': 'Gives only the positive solution of x² = p',
  },
};
