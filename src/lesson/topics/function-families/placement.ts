// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): classify a table by the three tests (the
// outputs are on the board and the x-step in the prompt, so the table picture is not needed), a factor as a percent
// change, and same amount vs same percent in a story.
import type { Placement } from '../../placement/types';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'mixed-classification', family: 'classifyMixed', standalone: true },
    { subgoal: 'factor-to-percent', family: 'factorToPercent' },
    { subgoal: 'context-exponential', family: 'contextWhichFamily' },
  ],
  errorLabel: {
    'mc.functions-concept.difference-test-only': 'Calls a table quadratic because its 1st differences change',
    'mc.functions-concept.forces-known-family': 'Forces a table into a family when none fits',
    'mc.exponential-log.reports-factor-number-as-percent-rate': 'Reads the factor (1.08) as the percent change',
    'mc.exponential-log.constant-factor-as-constant-amount': 'Treats a constant percent as a constant amount',
  },
};
