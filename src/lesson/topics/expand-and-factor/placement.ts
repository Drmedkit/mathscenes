// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): expand with signed numbers, expand then combine,
// and factor out a given factor. Typed two-box answers ("□x + □"); the questions stand without the area model.
import type { Placement } from '../../placement/types';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'expand-negative', family: 'expand', standalone: true },
    { subgoal: 'expand-then-collect', family: 'expandCollect', standalone: true },
    { subgoal: 'factor-given-factor', family: 'factorOut', standalone: true },
  ],
  errorLabel: {
    'mc.properties.partial-distribution': 'Multiplies only the first term inside the parentheses',
    'mc.integers.distribute-negative-first-term-only': 'Gives the minus to the first term only',
    'mc.expressions.factors-out-of-one-term-only': 'Divides only one term by the factor',
  },
};
