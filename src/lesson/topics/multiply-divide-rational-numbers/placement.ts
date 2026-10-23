// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): signed products and quotients of fractions and
// decimals, and order of operations with signed numbers (the lesson's test level). Typed answers; no counters needed.
import type { Placement } from '../../placement/types';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'rational-products-signed', family: 'ratMul', standalone: true },
    { subgoal: 'rational-quotients-signed', family: 'ratDiv', standalone: true },
    { subgoal: 'compound-expressions', family: 'compound', standalone: true },
  ],
  errorLabel: {
    'mc.integers.drops-sign-of-computed-result': 'Drops the sign of a product or quotient',
    'mc.integers.any-negative-makes-negative': 'Makes a product negative whenever a negative is in it',
    'mc.properties.pemdas-letters-as-ranks': 'Multiplies before dividing (or adds before subtracting) instead of left to right',
  },
};
