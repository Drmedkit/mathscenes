// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): a justified two-step equation, x on both sides,
// and a multi-step inequality where the symbol may have to turn.
import type { Placement } from '../../placement/types';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'justified-chain-two-step', family: 'chainSolve' },
    { subgoal: 'variable-terms-both-sides', family: 'bothSolve' },
    { subgoal: 'inequality-with-reversal', family: 'revSolve', standalone: true },
  ],
  errorLabel: {
    'mc.linear-equations.undoes-in-wrong-order': 'Undoes the steps in the wrong order (divides before taking off the constant)',
    'mc.linear-equations.no-reversal-for-negative': 'Keeps the inequality symbol when dividing by a negative number',
    'mc.linear-equations.moves-term-without-sign-change': 'Moves a term across the = sign without changing its sign',
  },
};
