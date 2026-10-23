// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): subtract integers, add and subtract signed
// fractions, and signed decimals (no number line, no calculator).
import type { Placement } from '../../placement/types';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'int-subtract', family: 'subInt', standalone: true },
    { subgoal: 'fraction-add-sub-signed', family: 'fracSigned', standalone: true },
    { subgoal: 'decimal-add-sub-signed', family: 'decSigned', standalone: true },
  ],
};
