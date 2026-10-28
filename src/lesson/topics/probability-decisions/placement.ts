// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): the expected net payoff of a raffle ticket
// (expected prize minus the ticket price), the expected yearly cost of an insurance policy (the deductible only in the
// claim branch), and the fair price of a booth game. All three stand alone: every number is in the question, the
// pictures only repeat them.
import type { Placement } from '../../placement/types';
import { plain } from '../../runtime/item';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 's2-expected-net-payoff', family: 'evRoutes', standalone: true },
    { subgoal: 's2-expected-net-payoff', family: 'evInsureCost', standalone: true },
    { subgoal: 's2-fair-price', family: 'fairPrice', standalone: true },
  ],
  use: it => !/calculator/.test(it.prompt) && plain(it.prompt).length <= 320,
  errorLabel: {
    'mc.finance.revenue-treated-as-profit': 'Reports the expected prize without subtracting the ticket price',
    'mc.finance.subtracts-ticket-cost-only-on-wins': 'Subtracts the ticket price only on winning tickets',
    'mc.finance.deductible-subtracted-in-every-branch': 'Charges the deductible even in years without a claim',
    'mc.probability.fair-price-wrong-direction': 'Moves the price the wrong way to make the game fair',
  },
};
