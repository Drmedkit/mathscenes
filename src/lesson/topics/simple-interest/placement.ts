// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): one year of interest, I = P × r × t over whole
// years, and the ending balance (principal + interest) at the lesson's test level. No calculator items.
import type { Placement } from '../../placement/types';
import { plain } from '../../runtime/item';

const noCalc = (it: { prompt: string }) => !/\(calculator/.test(plain(it.prompt));
export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'interest-friendly', family: 'oneYear', standalone: true },
    { subgoal: 'simple-interest-formula', family: 'formulaI', standalone: true },
    { subgoal: 'simple-interest-formula', family: 'formulaTotal', standalone: true },
  ],
  use: noCalc,
  errorLabel: {
    'mc.percent.percent-as-fixed-amount': 'Reads the rate as that many dollars (4% as $4)',
    'mc.percent.change-reported-as-final-amount': 'Gives the interest when the question asks for the balance (or the other way round)',
  },
};
