// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): the completing term, solving by completing the
// square, and the discriminant value. Typed answers; the pictures only replay.
import type { Placement } from '../../placement/types';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'completing-term', family: 'fillTerm', standalone: true },
    { subgoal: 'complete-square-even-b', family: 'csSolve', standalone: true },
    { subgoal: 'quadratic-formula-apply', family: 'discVal', standalone: true },
  ],
  errorLabel: {
    'mc.quadratic-polynomial.cs-wrong-term': 'Halves b but does not square it (adds 4 to complete x² + 8x)',
    'mc.quadratic-polynomial.completing-constant-from-incomplete-formula': 'Uses b² or 2b as the completing term',
    'mc.quadratic-polynomial.forgets-to-add-h': 'Stops at x + h = ±s and reports ±s as the solutions',
    'mc.quadratic-polynomial.only-positive-root': 'Keeps only the positive square root',
    'mc.integers.negative-substitution-without-grouping': 'Squares a negative b without brackets ((−3)² as −9)',
  },
};
