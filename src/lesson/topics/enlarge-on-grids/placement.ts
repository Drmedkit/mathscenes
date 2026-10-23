// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): one factor across and up (the missing side of a
// scaled copy), a reduction with factor 1/2, and repairing a resize that added instead of multiplied.
import type { Placement } from '../../placement/types';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'common-factor-both-directions', family: 'missingDim', standalone: true },
    { subgoal: 'reduction-concept', family: 'halfOf', standalone: true },
    { subgoal: 'justify-and-repair-resize', family: 'repair', standalone: true },
  ],
};
