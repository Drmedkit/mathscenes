// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): a midpoint, a squared distance and a missing
// endpoint. Every prompt states the coordinates, so the items stand alone without the lesson's canvas.
import type { Placement } from '../../placement/types';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'midpoint-as-average', family: 'midPt', standalone: true },
    { subgoal: 'distance-fluent', family: 'distSq', standalone: true },
    { subgoal: 'missing-endpoint', family: 'missEnd', standalone: true },
  ],
  errorLabel: {
    'mc.coordinate-geometry.midpoint-as-half-difference': 'Takes half the difference instead of averaging',
    'mc.coordinate-geometry.midpoint-halves-one-addend': 'Halves only the second coordinate of the sum',
    'mc.coordinate-geometry.difference-of-squares-for-squared-difference': 'Squares the coordinates before subtracting',
    'mc.coordinate-geometry.missing-endpoint-by-averaging': 'Averages the midpoint and the endpoint to find the other endpoint',
  },
};
