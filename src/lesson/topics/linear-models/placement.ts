// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): the model from two data points (rate, then the
// start by walking back), the inequality for a limit in words, and the whole-number boundary in the direction the
// story needs. Every prompt carries its numbers, so no picture is needed.
import type { Placement } from '../../placement/types';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 's2-back-solve-start', family: 'twoPointModel', standalone: true },
    { subgoal: 's2-threshold-inequality', family: 'budgetIneq', standalone: true },
    { subgoal: 's3-boundary-direction', family: 'wholeBoundary', standalone: true },
  ],
  errorLabel: {
    'mc.linear-functions.first-output-as-intercept': 'Uses a data point’s output as the starting value without walking back to input 0',
    'mc.estimation.rounds-nearest-when-context-needs-direction': 'Rounds to the nearest whole number when the story needs rounding up or down',
  },
};
