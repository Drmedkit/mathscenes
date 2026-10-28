// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): a whole long division by x − c (quotient and
// remainder typed), the remainder of a synthetic division, and dividing out a known factor to factor completely.
// All answerable from the prompt and the board alone (the pictures only replay the work).
import type { Placement } from '../../placement/types';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'ld-iterate-stop', family: 'ldFull', standalone: true },
    { subgoal: 'sd-recurrence', family: 'sdLast', standalone: true },
    { subgoal: 'apply-known-factor', family: 'factorFull', standalone: true },
  ],
  errorLabel: {
    'mc.quadratic-polynomial.adds-remainder-to-quotient': 'Adds the remainder onto the quotient',
    'mc.quadratic-polynomial.synthetic-subtracts-product': 'Subtracts instead of adding in synthetic division',
    'mc.quadratic-polynomial.synthetic-final-column-omitted': 'Stops synthetic division before the remainder column',
    'mc.quadratic-polynomial.stops-before-complete': 'Leaves the quadratic quotient unfactored',
  },
};
