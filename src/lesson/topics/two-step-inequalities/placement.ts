// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): solve a two-step inequality with a positive and
// with a negative coefficient (the symbol turns), and the fewest or most whole things a story's inequality allows.
// Every question gives its inequality in words and on the board; the number line is the lesson's picture.
import type { Placement } from '../../placement/types';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'solve-ineq-positive', family: 'solve', standalone: true },
    { subgoal: 'solve-ineq-negative', family: 'solve', standalone: true },
    { subgoal: 'discrete-domain', family: 'wholeCount', standalone: true },
  ],
};
