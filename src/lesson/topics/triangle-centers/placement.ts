// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): the midsegment half-length, the centroid's
// 2 : 1 split of a median, and an equidistance equation (perpendicular or angle bisector). Every prompt states the
// givens in words, so the items stand alone without the lesson's canvas.
import type { Placement } from '../../placement/types';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 's2-midsegment-length', family: 'midsegLen', standalone: true },
    { subgoal: 's2-centroid-ratio', family: 'centroidPart', standalone: true },
    { subgoal: 's2-equidistance-distances', family: 'equiAlg', standalone: true },
  ],
  errorLabel: {
    'mc.shapes.midsegment-halves-a-touched-side': 'Halves a side the midsegment touches instead of the third side',
    'mc.shapes.centroid-ratio-wrong': 'Puts the longer centroid part next to the midpoint',
    'mc.shapes.centroid-bisects-median': 'Thinks the centroid is the midpoint of each median',
  },
};
