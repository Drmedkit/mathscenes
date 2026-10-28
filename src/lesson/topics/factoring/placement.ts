// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): factor x² + bx + c with opposite signs (typed),
// a trinomial with a ≠ 1, and factor completely (GCF first, typed). All answerable from the prompt alone.
import type { Placement } from '../../placement/types';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'monic-opposite-signs', family: 'monicOppPair', standalone: true },
    { subgoal: 'nonmonic-ac-method', family: 'acPick', standalone: true },
    { subgoal: 'factor-completely', family: 'completeFill', standalone: true },
  ],
  errorLabel: {
    'mc.quadratic-polynomial.opposite-sign-factor-larger-sign-reversed': 'Gives the larger number the wrong sign ((x − 3)(x + 5) for x² − 2x − 15)',
    'mc.quadratic-polynomial.nonmonic-ignores-a': 'Factors ax² + bx + c as if a were 1',
    'mc.quadratic-polynomial.stops-before-complete': 'Stops before the factoring is complete (a common factor left inside)',
  },
};
