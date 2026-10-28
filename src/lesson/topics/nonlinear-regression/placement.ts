// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): the sum of squared residuals from a table of
// y and ŷ (no calculator), the residual of a supplied quadratic model at one point, and what a fitted factor b says.
// Every prompt carries its numbers, so the question stands without the picture.
import type { Placement } from '../../placement/types';
import { plain } from '../../runtime/item';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'least-squares-criterion', family: 'sseCompute', standalone: true },
    { subgoal: 'residuals-curved-model', family: 'residQuad', standalone: true },
    { subgoal: 'interpret-parameters', family: 'interpB', standalone: true },
  ],
  use: it => plain(it.prompt).length <= 240,
  errorLabel: {
    'mc.statistics.residual-sign-errors': 'Computes predicted − observed instead of observed − predicted',
    'mc.statistics.signed-residual-total-as-fit-objective': 'Adds the signed residuals instead of their squares',
    'mc.exponential-log.reports-factor-number-as-percent-rate': 'Reads the factor b itself as the percent rate',
  },
};
