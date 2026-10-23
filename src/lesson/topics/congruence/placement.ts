// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): rule a congruence out with a length, carry a
// point through two moves, and undo a sequence. All three are asked in words and coordinates; the grid is not needed.
import type { Placement } from '../../placement/types';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'rule-out-by-invariant', family: 'invariant', standalone: true },
    { subgoal: 'execute-given-sequence', family: 'sequence', standalone: true },
    { subgoal: 'reverse-sequence', family: 'undo', standalone: true },
  ],
  errorLabel: {
    'mc.transformations.equal-area-or-perimeter-proves-congruence': 'Takes the same area or perimeter as proof of congruence',
    'mc.transformations.applies-sequence-steps-to-original': 'Applies the second move to the original figure, not to the first image',
    'mc.transformations.undoes-sequence-wrongly': 'Undoes the moves in the same order instead of last move first',
  },
};
