// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): spot the step that measures or guesses (the
// card lists every step, so it stands alone), choose the compass width that makes the perpendicular-bisector arcs
// cross (the prompt gives the length), and name the locus for a verbal condition.
import type { Placement } from '../../placement/types';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'perp-bisector-construct', family: 'pbWidth', standalone: true },
    { subgoal: 'choose-locus', family: 'chooseLocus', standalone: true },
    { subgoal: 'circle-intersections', family: 'howMany', standalone: true },
  ],
  errorLabel: {
    'mc.geometric-proof.arcs-do-not-meet': 'Thinks any compass width makes the bisector arcs cross',
    'mc.shapes.angle-bisector-for-two-point-equidistance': 'Uses an angle bisector for “same distance from two points”',
  },
};
