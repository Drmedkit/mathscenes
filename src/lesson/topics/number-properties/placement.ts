// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): distribute in your head, classify disguised
// rational numbers, and work out an exact product of irrational numbers. All typed numbers; the pictures only replay.
import type { Placement } from '../../placement/types';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'distributive', family: 'distArea', standalone: true },
    { subgoal: 'classify-rational-forms', family: 'countMembers', standalone: true },
    { subgoal: 'irrational-closure-counterexample', family: 'irrValue', standalone: true },
  ],
  errorLabel: {
    'mc.properties.partial-distribution': 'Multiplies only the first part (7 × 98 as 700 − 2)',
    'mc.fractions-concept.fractions-equal-to-whole-numbers': 'Thinks a fraction like 12/4 cannot be an integer',
    'mc.exponents-roots.zero-excluded-from-whole-numbers': 'Leaves 0 out of the whole numbers',
    'mc.exponents-roots.whole-numbers-include-negatives': 'Counts negative numbers as whole numbers',
  },
};
