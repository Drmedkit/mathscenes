// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): read a degree, subtract polynomials, and
// multiply two binomials. All answerable from the prompt alone (the pictures only replay).
import type { Placement } from '../../placement/types';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'degree-of-polynomial', family: 'polyDegree', standalone: true },
    { subgoal: 'subtract-polynomials', family: 'subPoly', standalone: true },
    { subgoal: 'binomial-times-binomial', family: 'binBin', standalone: true },
  ],
  errorLabel: {
    'mc.linear-functions.m-b-by-position': 'Reads the degree from the first written term',
    'mc.integers.distribute-negative-first-term-only': 'Subtracts only the first term of a polynomial',
    'mc.quadratic-polynomial.firsts-and-lasts-only': 'Multiplies only firsts and lasts ((x + 3)(x + 2) as x² + 6)',
  },
};
