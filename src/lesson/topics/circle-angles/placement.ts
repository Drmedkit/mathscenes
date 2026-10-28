// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): the Inscribed Angle Theorem (both directions),
// opposite angles of an inscribed quadrilateral, and the circumscribed angle. Every prompt states the givens in words
// (which arc, which points, which lines are tangent), so the items stand alone without the lesson's canvas.
import type { Placement } from '../../placement/types';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'inscribed-angle-half-arc', family: 'inscribedArc', standalone: true },
    { subgoal: 'cyclic-quadrilateral', family: 'cyclicQuad', standalone: true },
    { subgoal: 'circumscribed-angle-value', family: 'circumValue', standalone: true },
  ],
  errorLabel: {
    'mc.circles.full-arc-for-angle-on-circle': 'Gives an inscribed angle the whole arc instead of half',
    'mc.circles.inscribed-angle-doubled': 'Doubles where the arc should be halved (or the reverse)',
    'mc.circles.cyclic-quad-opposite-angles-equal': 'Sets opposite angles of an inscribed quadrilateral equal',
    'mc.circles.inscribed-rule-off-the-circle': 'Uses the inscribed-angle rule for an angle outside the circle',
  },
};
