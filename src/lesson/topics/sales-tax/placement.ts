// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): the tax at a whole rate, the total in two steps,
// and the pre-tax price back from a total (the lesson's test level). No calculator items: the check-in has none.
import type { Placement } from '../../placement/types';
import { plain } from '../../runtime/item';

const noCalc = (it: { prompt: string }) => !/Calculator allowed/.test(plain(it.prompt));
export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'tax-whole-rate', family: 'taxAmt', standalone: true },
    { subgoal: 'total-two-step', family: 'totalPay', standalone: true },
    { subgoal: 'price-from-total', family: 'priceFromTotal', standalone: true },
  ],
  use: noCalc,
  errorLabel: {
    'mc.percent.percent-as-fixed-amount': 'Reads a percent tax as that many dollars (7% as $7)',
    'mc.finance.shelf-price-includes-sales-tax': 'Takes the shelf price as what you pay (forgets the tax on top)',
    'mc.percent.divides-by-rate-to-undo-change': 'Undoes a tax by dividing by the rate instead of the multiplier',
  },
};
