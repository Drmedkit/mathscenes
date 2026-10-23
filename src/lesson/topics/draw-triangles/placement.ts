// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): the third side's range, the third angle, and
// none / one / many triangles from a set of conditions (no ruler, protractor or compass needed on the check-in).
import type { Placement } from '../../placement/types';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'triangle-existence', family: 'thirdSide', standalone: true },
    { subgoal: 'angle-sum-investigate', family: 'thirdAngle', standalone: true },
    { subgoal: 'triangle-uniqueness', family: 'howMany', standalone: true },
  ],
};
