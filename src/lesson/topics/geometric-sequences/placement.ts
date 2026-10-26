// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): a term from the explicit formula, the explicit
// formula from a list (a_1 and r typed), and a negative common ratio. All typed; the pictures only replay.
import type { Placement } from '../../placement/types';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'explicit-evaluate', family: 'evalTerm', standalone: true },
    { subgoal: 'explicit-write', family: 'writeExp', standalone: true },
    { subgoal: 'ratio-negative', family: 'findRneg', standalone: true },
  ],
  errorLabel: {
    'mc.sequences-series.n-steps-for-nth-term': 'Uses n multiplications for the nth term instead of n − 1',
    'mc.exponents-roots.power-as-base-times-exponent': 'Reads r to a power as r times the exponent',
    'mc.integers.even-power-of-negative-negative': 'Gives an even power of a negative ratio a minus sign',
    'mc.linear-functions.exponential-initial-value-as-growth-factor': 'Swaps the first term and the common ratio',
    'mc.sequences-series.negative-ratio-sign': 'Drops the minus sign of a negative common ratio',
    'mc.sequences-series.ratio-inverted': 'Divides earlier by later (the ratio upside down)',
  },
};
