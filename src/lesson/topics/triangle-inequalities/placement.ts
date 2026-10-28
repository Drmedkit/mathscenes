// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): can three lengths make a triangle (the flat
// case included), the range of a third side, and an isosceles angle from the vertex or base angle. All three stand
// alone: the prompt states every length, mark and angle the figure shows.
import type { Placement } from '../../placement/types';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 's1-triangle-existence', family: 'existCheck', standalone: true },
    { subgoal: 's2-triangle-inequality-range', family: 'rangePair', standalone: true },
    { subgoal: 's2-isosceles-unknowns', family: 'isoAngle', standalone: true },
  ],
  errorLabel: {
    'mc.shapes.accepts-degenerate-triangle': 'Accepts lengths where the two shorter add to exactly the longest (a flat "triangle")',
    'mc.shapes.checks-wrong-pair-in-triangle-inequality': 'Checks a sum that includes the longest length instead of the two shorter',
    'mc.shapes.third-side-upper-bound-only': 'Gives only the upper bound for a third side',
    'mc.shapes.misplaces-isosceles-base-angles': 'Treats the vertex angle of an isosceles triangle as a base angle',
  },
};
