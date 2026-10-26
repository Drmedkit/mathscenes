// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): solve |mx + b| = c by splitting, isolate the
// absolute value first, and count the solutions from the sign of the target. All three stand alone without the canvas
// (the equation is in the question; the graph only comes in on the replay).
import type { Placement } from '../../placement/types';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'solve-abs-eq-positive', family: 'splitSolve', standalone: true },
    { subgoal: 'isolate-first', family: 'isolateSolve', standalone: true },
    { subgoal: 'solution-count-by-sign', family: 'howManySol', standalone: true },
  ],
  errorLabel: {
    'mc.linear-equations.abs-plus-minus-c-ignoring-inside': 'Answers x = ±c, ignoring what is inside the bars',
    'mc.linear-equations.abs-split-before-isolating': 'Splits into cases before getting the absolute value alone',
    'mc.linear-equations.abs-branches-with-negative-target': 'Finds two solutions for a negative target',
  },
};
