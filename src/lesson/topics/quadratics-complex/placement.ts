// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): what a negative discriminant means, the formula
// to a ± bi, and the other root of a real quadratic. All answerable from the prompt alone (pictures only replay the
// worked solution).
import type { Placement } from '../../placement/types';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'neg-discriminant-meaning', family: 'discCount', standalone: true },
    { subgoal: 'formula-perfect-square', family: 'formulaInt', standalone: true },
    { subgoal: 'conjugate-pair-justify', family: 'secondRoot', standalone: true },
  ],
  errorLabel: {
    'mc.quadratic-polynomial.no-solution-vs-no-real': 'Reads a negative discriminant as "no solution" instead of "no real solution"',
    'mc.quadratic-polynomial.formula-uses-b-instead-of-negative-b': 'Starts the quadratic formula with b instead of −b',
    'mc.advanced-algebra.nonreal-roots-are-opposites': 'Takes the opposite of a complex root instead of its conjugate',
  },
};
