// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): is a pair a solution of a system (the core
// meaning: both equations at once), elimination after scaling one equation (the stage-2 method), and how many
// solutions from slopes and intercepts (stage 3). Every prompt carries its equations, so the questions stand without
// the plane.
import type { Placement } from '../../placement/types';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'check-pair-both', family: 'pairCheck', standalone: true },
    { subgoal: 'eliminate-scale-one', family: 'scaleSolve', standalone: true },
    { subgoal: 'predict-by-slopes', family: 'predictSlopes', standalone: true },
  ],
  errorLabel: {
    'mc.systems.one-condition-enough': 'Accepts a pair that makes only one equation of a system true',
    'mc.coordinate-geometry.reverses-coordinate-order': 'Reports the solution with x and y swapped',
    'mc.linear-functions.equal-slopes-always-distinct': 'Thinks equal slopes always mean no solution, even for the same line',
  },
};
