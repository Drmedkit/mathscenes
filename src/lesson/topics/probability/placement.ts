// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): favorable over all, an expected count from a
// probability, and a compound event (two stages), each told in words.
import type { Placement } from '../../placement/types';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'theoretical-uniform', family: 'theory', standalone: true },
    { subgoal: 'predict-expected-count', family: 'predict', standalone: true },
    { subgoal: 'compound-theoretical-probability', family: 'compoundP', standalone: true },
  ],
};
