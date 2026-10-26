// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): evaluate a·b^t, the factor from a percent
// story, and a whole model from a story (a and b typed).
import type { Placement } from '../../placement/types';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'model-form', family: 'evalModel' },
    { subgoal: 'factor-percent', family: 'pctToFactor' },
    { subgoal: 'model-from-words', family: 'modelPair' },
  ],
  errorLabel: {
    'mc.exponential-log.exponent-on-wrong-part': 'Raises a·b to the power instead of only b',
    'mc.exponential-log.factor-confused-with-rate': 'Uses the rate r as the factor instead of 1 ± r',
    'mc.linear-functions.exponential-initial-value-as-growth-factor': 'Swaps the starting value and the factor',
  },
};
