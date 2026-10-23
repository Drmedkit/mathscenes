// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): is a set of pairs a function, which pair fits an
// equation, and what two pairs with one input show (every question stands on the board, no graph or diagram needed).
import type { Placement } from '../../placement/types';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'exactly-one-criterion', family: 'pairVerdict', standalone: true },
    { subgoal: 'pair-satisfies-equation', family: 'whichPair', standalone: true },
    { subgoal: 'implicit-equation-check', family: 'implicitShows', standalone: true },
  ],
};
