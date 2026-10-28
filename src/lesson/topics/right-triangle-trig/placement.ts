// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): sin x = cos y (complementary angles), a missing
// side from a given trig equation (x on top), and a 30-60-90 / 45-45-90 side worked back exactly. Every prompt states
// all the numbers it needs, so the items stand alone without the lesson's canvas.
import type { Placement } from '../../placement/types';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'cofunction', family: 'cofMissing', standalone: true },
    { subgoal: 'side-unknown-numerator', family: 'sideNumEq', standalone: true },
    { subgoal: 'special-right-reverse', family: 'specialRev', standalone: true },
  ],
  errorLabel: {
    'mc.right-triangles-trig.cofunction-misuse': 'Thinks sin x and cos x are equal for any angle, not for complementary angles',
    'mc.right-triangles-trig.solves-ratio-wrong-way': 'Divides instead of multiplying (or the reverse) when solving a trig equation',
    'mc.right-triangles-trig.halves-isosceles-hypotenuse': 'Halves a 45-45-90 hypotenuse to get a leg',
  },
};
