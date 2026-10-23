// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): is a situation proportional, k the right way
// round, and a fixed fee that breaks doubling (all stand without the graph or the table).
import type { Placement } from '../../placement/types';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'situation-test', family: 'situation', standalone: true },
    { subgoal: 'name-k-direction', family: 'nameK', standalone: true },
    { subgoal: 'starting-amount-counterexample', family: 'fixedFee', standalone: true },
  ],
};
