// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): angle equations that stand without the figure:
// a triangle's angles as expressions (x and the largest angle), the sides of a polygon from its angle sum, and the
// sides of a regular polygon from one angle. (The transversal families need their figure, so they are not asked.)
import type { Placement } from '../../placement/types';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'angle-expressions-equation', family: 'exprTri', standalone: true },
    { subgoal: 'polygon-angle-equations', family: 'polySides', standalone: true },
    { subgoal: 'regular-polygon-interior-angle', family: 'regSides', standalone: true },
  ],
};
