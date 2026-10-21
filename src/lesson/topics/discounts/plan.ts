// plan.ts: the practice walk for "Calculate a discount", one entry per sub-goal of the topic JSON, in its order.
import type { SubgoalPlan } from '../../runtime/practice';

export const PLAN: SubgoalPlan[] = [
  { id: 'name-sale-amounts', title: 'Name the three amounts', families: ['roles', 'partWhole'] },
  { id: 'find-missing-amount', title: 'Find the missing amount', families: ['missing'] },
  { id: 'original-is-100', title: 'The original price is 100%', families: ['whichWhole', 'pctOrDollars'] },
  { id: 'percent-split-model', title: 'A percent off on the bar', families: ['readSplit', 'judgeSplit'] },
  { id: 'discount-amount', title: 'The discount in dollars', families: ['discAmt'] },
  { id: 'subtract-discount', title: 'Subtract to get the sale price', families: ['salePrice', 'saveAndPay'] },
  { id: 'multiply-cents-prices', title: 'Exact discounts on cents prices', families: ['exactDisc', 'keepExact'] },
  { id: 'round-to-cent', title: 'Round the final price', families: ['roundFinal', 'policy'] },
  { id: 'percent-paid', title: 'The percent you pay', families: ['pctPaid', 'paidOfWhat'] },
  { id: 'one-step-remaining', title: 'The sale price in one step', families: ['oneStep', 'whichProduct'] },
  { id: 'explain-equivalence', title: 'Why both ways agree', families: ['whyAgree'] },
  { id: 'check-and-correct', title: 'Check and correct a price', families: ['checkClaim'] },
  { id: 'estimate-reasonableness', title: 'Estimate and bounds', families: ['estimate', 'bounds'] },
];
