// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): consecutive angles of a parallelogram, the
// trapezoid midsegment, and a parallelogram property turned into an equation. Every prompt states the givens in words,
// so the items stand alone without the lesson's canvas.
import type { Placement } from '../../placement/types';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'consecutive-angles', family: 'consAngle', standalone: true },
    { subgoal: 'trapezoid-theorems', family: 'trapMid', standalone: true },
    { subgoal: 'property-to-equation', family: 'eqCons', standalone: true },
  ],
  use: it => !/calculator/.test(it.prompt),
  errorLabel: {
    'mc.shapes.swaps-parallelogram-angle-relations': 'Makes consecutive parallelogram angles equal',
    'mc.angles.congruent-pair-treated-as-supplementary': 'Treats an equal angle pair as supplementary',
    'mc.calculus.trapezoid-height-not-endpoint-average': 'Does not average the two bases of a trapezoid',
    'mc.linear-equations.reports-x-not-asked-quantity': 'Reports x instead of the asked measure',
  },
};
