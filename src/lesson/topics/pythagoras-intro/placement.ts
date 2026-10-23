// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): the hypotenuse from two legs, a missing leg,
// and a right triangle found in a story. Whole-number answers only (no calculator, no rounding on the check-in).
import type { Placement } from '../../placement/types';
import { plain } from '../../runtime/item';

const whole = (it: { prompt: string }) => !/nearest tenth|calculator|√/i.test(plain(it.prompt));
export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'hypotenuse-whole', family: 'hypWhole', standalone: true },
    { subgoal: 'missing-leg', family: 'missingLeg', standalone: true },
    { subgoal: 'model-context', family: 'story', standalone: true },
  ],
  use: whole,
  errorLabel: {
    'mc.right-triangles-trig.adds-lengths-not-squares': 'Adds the lengths instead of their squares',
    'mc.right-triangles-trig.missing-leg-adds-squares': 'Adds the squares when a leg is missing (should subtract)',
    'mc.exponents-roots.stops-before-taking-root': 'Stops at c² and forgets the square root',
  },
};
