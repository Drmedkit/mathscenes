// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): a square root up to √225, the two whole numbers
// a root lies between, and the side of a real square from its area.
import type { Placement } from '../../placement/types';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'evaluate-roots-to-225', family: 'evalRoot', standalone: true },
    { subgoal: 'bound-root-between-integers', family: 'boundRoot', standalone: true },
    { subgoal: 'apply-side-from-area', family: 'context', standalone: true },
  ],
};
