// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): the root of a negative, a complex product, and a
// power of i. All answerable from the prompt alone (the pictures only replay the worked solution).
import type { Placement } from '../../placement/types';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'sqrt-neg-perfect', family: 'sqrtNeg', standalone: true },
    { subgoal: 'multiply-complex', family: 'binProduct', standalone: true },
    { subgoal: 'powers-of-i', family: 'iPower', standalone: true },
  ],
  errorLabel: {
    'mc.advanced-algebra.root-of-negative-as-negative-real': 'Writes √(−9) as −3 instead of 3i',
    'mc.advanced-algebra.i-squared-as-plus-one': 'Replaces i² with +1 instead of −1',
    'mc.advanced-algebra.powers-of-i-cycle-wrong': 'Thinks powers of i repeat every 2 instead of every 4',
  },
};
