// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): "1 inch represents N miles" with a whole and a
// fractional map length, and how far a 1/4-inch slip moves the real distance. Each question gives the scale and the
// map length in words, so the map itself is not needed.
import type { Placement } from '../../placement/types';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'unit-scale-whole', family: 'unitPick', standalone: true },
    { subgoal: 'unit-scale-fraction', family: 'fracScale', standalone: true },
    { subgoal: 'error-scaling', family: 'errorSize', standalone: true },
  ],
};
