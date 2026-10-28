// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): a z-score, a benchmark tail, a right tail from a
// cumulative (left) area. All three state everything in the question; the curve picture is not needed.
import type { Placement } from '../../placement/types';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'z-compute', family: 'zCalc', standalone: true },
    { subgoal: 'benchmark-tails-complement', family: 'tailPct', standalone: true },
    { subgoal: 'right-tail-complement', family: 'rightSupplied', standalone: true },
  ],
  errorLabel: {
    'mc.statistics.standardize-without-scaling': 'Subtracts the mean but does not divide by the SD',
    'mc.statistics.central-benchmark-misassigned-to-tail': 'Gives both tails (or the central share) for one tail',
    'mc.probability.left-tail-default': 'Uses the left area for a "more than" question',
  },
};
