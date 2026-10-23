// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): dilate a point about a center (the ray from
// the center), the coordinate rule about the origin, and a point through a dilation followed by rigid motions. Every
// prompt gives the coordinates it needs, so the grid picture is not needed.
import type { Placement } from '../../placement/types';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'dilation-center-ray', family: 'dilPoint', standalone: true },
    { subgoal: 'coordinate-dilation-origin', family: 'ruleImage', standalone: true },
    { subgoal: 'similarity-as-transformations', family: 'simSeq', standalone: true },
  ],
};
