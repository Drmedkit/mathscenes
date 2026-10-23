// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): solve a system by substitution, by adding the
// equations, and by scaling one equation first; the answer is the pair (x, y) in two boxes. The equations are in the
// prompt, so the graph is not needed.
import type { Placement } from '../../placement/types';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'solve-and-back-substitute', family: 'subSolve', standalone: true },
    { subgoal: 'eliminate-by-adding', family: 'elimSolve', standalone: true },
    { subgoal: 'scale-one-equation', family: 'elimSolve', standalone: true },
  ],
};
