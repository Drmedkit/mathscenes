// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): is a point a solution (the core membership
// test), which side a standard-form inequality shades (the test point beats the symbol), and is a point a solution of
// a system. Every prompt carries its numbers, so the questions stand without the plane.
import type { Placement } from '../../placement/types';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'point-membership', family: 'isSolution', standalone: true },
    { subgoal: 'standard-form-inequalities', family: 'stdSide', standalone: true },
    { subgoal: 'system-meaning', family: 'sysPoint', standalone: true },
  ],
  errorLabel: {
    'mc.linear-equations.strict-includes-boundary': 'Counts boundary points as solutions of a strict inequality',
    'mc.linear-equations.shades-above-for-greater': 'Shades above for > even when y is not alone with a plus sign',
    'mc.systems.one-condition-enough': 'Accepts a point that makes only one inequality of a system true',
  },
};
