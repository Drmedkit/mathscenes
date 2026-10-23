// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): a non-unit fraction of a number (divide, then
// multiply), a fraction of a length that is not a whole number, and the whole from a part (all typed answers).
import type { Placement } from '../../placement/types';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'divide-then-multiply', family: 'bareDTM', standalone: true },
    { subgoal: 'fractional-non-unit-share', family: 'fracNonUnit', standalone: true },
    { subgoal: 'unknown-whole-extension', family: 'unknownWhole', standalone: true },
  ],
};
