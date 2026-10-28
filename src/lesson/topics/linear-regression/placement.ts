// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): a residual from a stated model and point, the
// predicted change from a slope, and the strongest of four correlation coefficients. Every prompt carries its numbers,
// so the question stands without the plot.
import type { Placement } from '../../placement/types';
import { plain } from '../../runtime/item';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'residual-compute', family: 'residual', standalone: true },
    { subgoal: 'slope-interpret', family: 'slopeChange', standalone: true },
    { subgoal: 'r-strength', family: 'rStrongest', standalone: true },
  ],
  use: it => plain(it.prompt).length <= 230,   // the check-in shows short questions only
  errorLabel: {
    'mc.statistics.residual-sign-errors': 'Computes predicted − observed instead of observed − predicted',
    'mc.statistics.correlation-strength-by-signed-order': 'Ranks correlations by their signed value instead of their size |r|',
  },
};
