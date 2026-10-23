// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): solve a one-step inequality with a positive
// factor (type the boundary), with a negative factor (pick the solution set: the symbol has to reverse), and a word
// problem with whole-number answers. The questions stand without the number line.
import type { Placement } from '../../placement/types';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'solve-ineq-positive-scale', family: 'boundaryNum', standalone: true },
    { subgoal: 'ineq-negative-scale-reverse', family: 'solveScale', standalone: true },
    { subgoal: 'model-solve-ineq-context', family: 'contextCount', standalone: true },
  ],
};
