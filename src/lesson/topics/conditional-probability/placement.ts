// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): P(A | B) from given probabilities, the addition
// rule, and the second draw without replacement. All three stand alone (the numbers are in the question; the
// pictures only repeat them).
import type { Placement } from '../../placement/types';
import { plain } from '../../runtime/item';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'formula-conditional', family: 'formulaDec', standalone: true },
    { subgoal: 'addition-rule', family: 'addGiven', standalone: true },
    { subgoal: 'replacement-effect', family: 'replaceCond', standalone: true },
  ],
  use: it => !/calculator/.test(it.prompt) && plain(it.prompt).length <= 300,
  errorLabel: {
    'mc.probability.confusion-of-the-inverse': 'Swaps P(A | B) and P(B | A)',
    'mc.probability.double-counts-overlap': 'Adds P(A) + P(B) without removing the overlap',
    'mc.probability.assumes-independence-by-default': 'Treats a draw without replacement as if the bag did not change',
  },
};
