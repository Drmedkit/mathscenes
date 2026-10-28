// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): the middle term of a squared binomial (typed),
// factoring with a special product when a or b is a chunk, and a product in your head with (n + k)(n − k) = n² − k².
// All answerable from the prompt and the board alone (the pictures only replay).
import type { Placement } from '../../placement/types';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'special-products-direct', family: 'middleCoef', standalone: true },
    { subgoal: 'reverse-special-products', family: 'factorChunk', standalone: true },
    { subgoal: 'numerical-relationships', family: 'mentalProduct', standalone: true },
  ],
  errorLabel: {
    'mc.quadratic-polynomial.middle-term-2a-plus-b': 'Writes the middle term of (a + b)² as 2a + b instead of 2ab',
    'mc.functions-concept.function-distributes-over-sum': 'Squares a sum term by term ((a + b)² as a² + b²)',
    'mc.quadratic-polynomial.chunk-partially-substituted': 'Uses only part of a chunk when factoring',
    'mc.quadratic-polynomial.conjugate-product-as-square': 'Treats a sum times a difference as a square',
  },
};
