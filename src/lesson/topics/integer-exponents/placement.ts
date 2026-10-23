// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): the product rule with integer exponents (type
// the exponent), a negative exponent (type the value or the exponent), and the value of a quotient of powers (the
// lesson's test level). The questions stand without the factor mat.
import type { Placement } from '../../placement/types';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'product-rule-integer', family: 'prodExp', standalone: true },
    { subgoal: 'negative-exponent-general', family: 'negExp', standalone: true },
    { subgoal: 'quotient-rule-integer', family: 'lawVal', standalone: true },
  ],
  errorLabel: {
    'mc.exponents-roots.product-of-powers-multiplies-exponents': 'Multiplies the exponents when multiplying powers',
  },
};
