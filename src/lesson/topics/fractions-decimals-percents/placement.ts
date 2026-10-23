// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): a fraction to a terminating decimal by division,
// a decimal back to a fraction, and a number above one whole as a percent. Every question is typed and stands alone
// (the division ladder is the lesson's picture, not part of the question).
import type { Placement } from '../../placement/types';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'fraction-to-terminating-by-division', family: 'divide', standalone: true },
    { subgoal: 'terminating-decimal-to-fraction', family: 'decToFrac', standalone: true },
    { subgoal: 'beyond-one-whole', family: 'beyondOne', standalone: true },
  ],
};
