// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): the volume of a cone and of a sphere in a story,
// exact in terms of π (the number in front of π is typed, no π key needed), and the height of a cylinder or cone from
// its volume. Every prompt names its own lengths, so the picture is not needed.
import type { Placement } from '../../placement/types';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'cone-volume-calc', family: 'calc-story', standalone: true },
    { subgoal: 'sphere-volume-calc', family: 'calc-story', standalone: true },
    { subgoal: 'solve-for-height', family: 'solve-story', standalone: true },
  ],
};
