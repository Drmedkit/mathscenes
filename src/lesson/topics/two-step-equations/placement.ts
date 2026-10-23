// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): solve a two-step equation, whole, signed and grouped.
import type { Placement } from '../../placement/types';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'solve-whole-positive', family: 'solve', standalone: true },
    { subgoal: 'solve-signed', family: 'solve', standalone: true },
    { subgoal: 'solve-grouped', family: 'solve', standalone: true },
  ],
  errorLabel: {
    'mc.linear-equations.undoes-in-wrong-order': 'Undoes the two steps in the wrong order (divides before taking off the constant)',
    'mc.sequences-series.forward-op-when-backward': 'Repeats an operation instead of undoing it (adds where it should subtract)',
    'mc.reasoning-language.reports-intermediate-result': 'Stops one step early (gives 3x instead of x)',
  },
};
