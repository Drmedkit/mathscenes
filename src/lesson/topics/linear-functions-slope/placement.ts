// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): slope from two points, the equation through two
// points, and the slope of a standard-form line. Every prompt carries its numbers, so no picture is needed.
import type { Placement } from '../../placement/types';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'slope-two-points', family: 'twoPointSlope', standalone: true },
    { subgoal: 'build-from-two-points', family: 'eqTwoPoints', standalone: true },
    { subgoal: 'standard-form', family: 'stdSlope', standalone: true },
  ],
  errorLabel: {
    'mc.linear-functions.inconsistent-subtraction-order': 'Subtracts the coordinates in opposite orders (the slope comes out with the wrong sign)',
    'mc.linear-functions.rise-run-inverted': 'Puts the run over the rise',
    'mc.linear-functions.first-output-as-intercept': 'Uses a given output as the y-intercept without solving for b',
    'mc.linear-functions.standard-form-slope-shortcuts': 'Reads A or A/B as the slope of Ax + By = C',
  },
};
