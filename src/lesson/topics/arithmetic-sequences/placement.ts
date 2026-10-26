// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): a far term from the explicit formula, the
// explicit formula from a list (a_1 and d typed), and which term has a given value.
import type { Placement } from '../../placement/types';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'explicit-evaluate', family: 'evalFar', standalone: true },
    { subgoal: 'explicit-from-list', family: 'formFromList', standalone: true },
    { subgoal: 'solve-for-position', family: 'whichN' },
  ],
  errorLabel: {
    'mc.sequences-series.n-steps-for-nth-term': 'Counts n jumps to the nth term instead of n − 1',
    'mc.sequences-series.index-shifted-by-one': 'Uses the value before the first term as the start',
    'mc.properties.partial-distribution': 'Multiplies d by n but not by the 1 in (n − 1)',
  },
};
