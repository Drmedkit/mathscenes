// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): a falling product (officers), a combination
// (committees from the ordered count), and a complement count. All three stand alone (the numbers are in the question;
// the pictures only repeat them).
import type { Placement } from '../../placement/types';
import { plain } from '../../runtime/item';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'ordered-without-repetition', family: 'officers', standalone: true },
    { subgoal: 'combinations-as-division', family: 'groupsDivide', standalone: true },
    { subgoal: 'complement-counting', family: 'atLeastOne', standalone: true },
  ],
  use: it => !/calculator/.test(it.prompt) && plain(it.prompt).length <= 260,
  errorLabel: {
    'mc.probability.uses-n-factorial-for-partial-arrangement': 'Uses n! when only some of the places are filled',
    'mc.probability.divides-ordered-count-by-selection-size': 'Divides the ordered count by r instead of r!',
    'mc.probability.at-least-one-constructive-overcount': 'Counts "at least one" by fixing one member first (double counts)',
  },
};
