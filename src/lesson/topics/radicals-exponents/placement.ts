// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): evaluate a rational power, write a radical in
// simplest form, and multiply two radical binomials. All typed answers; the pictures only replay.
import type { Placement } from '../../placement/types';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'rational-exponent-m-over-n', family: 'mnEval', standalone: true },
    { subgoal: 'extract-perfect-powers-numeric', family: 'simplifyRoot', standalone: true },
    { subgoal: 'radical-binomial-products', family: 'binProd', standalone: true },
  ],
  errorLabel: {
    'mc.exponents-roots.power-as-base-times-exponent': 'Multiplies the base by the exponent (8^(2/3) as 16/3)',
    'mc.exponents-roots.rational-exponent-root-and-power-swapped': 'Swaps the root and the power in a^(m/n)',
    'mc.rational-radical.partial-radical-simplification': 'Stops before every square factor is out of the root',
    'mc.rational-radical.extracts-factor-without-root': 'Pulls a square factor out without taking its root (√72 as 36√2)',
    'mc.quadratic-polynomial.firsts-and-lasts-only': 'Multiplies only the firsts and the lasts of two binomials',
    'mc.exponents-roots.root-times-itself-not-radicand': 'Takes √3 · √3 as 9 instead of 3',
  },
};
