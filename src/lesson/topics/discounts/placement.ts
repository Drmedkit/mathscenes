// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): the discount in dollars, the sale price, and the
// sale price in one multiplication (the percent you pay). Only the "No calculator" items: the check-in has none.
import type { Placement } from '../../placement/types';
import { plain } from '../../runtime/item';

const noCalc = (it: { prompt: string }) => /No calculator/.test(plain(it.prompt));
export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'discount-amount', family: 'discAmt', standalone: true },
    { subgoal: 'subtract-discount', family: 'salePrice', standalone: true },
    { subgoal: 'one-step-remaining', family: 'oneStep', standalone: true },
  ],
  use: noCalc,
};
