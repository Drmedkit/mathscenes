// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): solve with x on both sides (negative
// coefficients), solve with a minus in front of parentheses, and tell one / no / every-number solutions apart.
import type { Placement } from '../../placement/types';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 's2-negative-coefficients', family: 'solve', standalone: true },
    { subgoal: 's2-negative-factor', family: 'solve', standalone: true },
    { subgoal: 's3-classify-mixed', family: 'classify', standalone: true },
  ],
  errorLabel: {
    'mc.linear-equations.moves-term-without-sign-change': 'Moves a term to the other side without changing its sign',
    'mc.integers.distribute-negative-first-term-only': 'Multiplies only the first term in the parentheses by the minus',
    'mc.linear-equations.zero-vs-no-solution': 'Mixes up "x = 0" and "no solution"',
  },
};
