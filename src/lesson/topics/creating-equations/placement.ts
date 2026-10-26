// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): translate a bound phrase into an inequality,
// write a two-variable budget constraint, and find the whole number a bound allows (rounding in the right direction).
import type { Placement } from '../../placement/types';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'bound-phrase-to-symbol', family: 'phraseWrite' },
    { subgoal: 'two-var-resource', family: 'budget2' },
    { subgoal: 'bound-rounding', family: 'busRound', standalone: true },
  ],
  errorLabel: {
    'mc.linear-equations.bound-phrase-direction-reversed': 'Turns “at most / at least” the wrong way round',
    'mc.expressions.swaps-rates-between-variables': 'Puts each price on the other variable',
    'mc.linear-equations.count-and-value-mixed': 'Adds item counts where the budget needs dollars',
    'mc.estimation.rounds-nearest-when-context-needs-direction': 'Rounds to the nearest whole number when the bound needs up or down',
  },
};
