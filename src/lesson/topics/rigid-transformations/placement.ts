// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): the coordinate rules of the three rigid motions
// (a translation rule from a point and its image, a reflection in an axis, a quarter turn about the origin). Every
// question gives its points in the prompt, so the grid picture is not needed.
import type { Placement } from '../../placement/types';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'coord-translate', family: 'ruleT', standalone: true },
    { subgoal: 'coord-reflect-axes', family: 'ruleAx', standalone: true },
    { subgoal: 'coord-rotate-90', family: 'rule90', standalone: true },
  ],
};
