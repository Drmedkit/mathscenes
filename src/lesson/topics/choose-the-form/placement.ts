// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): move between percent, decimal and fraction past
// 100%, work out a percent of a money amount, and compare numbers written in different forms.
import type { Placement } from '../../placement/types';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'over-100-percent', family: 'over100', standalone: true },
    { subgoal: 'decimal-multiplier-choice', family: 'routeCompute', standalone: true },
    { subgoal: 'common-form-compare', family: 'orderForms', standalone: true },
  ],
  errorLabel: {
    'mc.fractions-concept.fraction-must-be-less-than-one': 'Drops the whole past 100% (150% as 0.5)',
    'mc.percent.fraction-digits-as-percent-numeral': 'Copies the digits of a fraction as the percent (3/4 as 34%)',
  },
};
