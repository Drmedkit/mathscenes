// plan.ts: practice walks through every sub-goal of primary.ratios.calculate-sales-tax, in topic JSON order.
// Each sub-goal names the families that practise it; a generator gets the sub-goal id (items.ts).
import type { SubgoalPlan } from '../../runtime/practice';

export const PLAN: readonly SubgoalPlan[] = [
  { id: 'identify-quantities', title: 'Price, tax and total on a receipt', families: ['roles', 'missingAmt'] },
  { id: 'rate-vs-amount', title: 'The rate (%) or the amount ($)?', families: ['rateOrAmount', 'perHundred'] },
  { id: 'pretax-is-100', title: 'The pre-tax price is 100%', families: ['whichWhole', 'totalPct', 'dollarAt'] },
  { id: 'tax-whole-rate', title: 'The tax at a whole-number rate', families: ['taxAmt'] },
  { id: 'total-two-step', title: 'Tax, then the total', families: ['totalPay', 'planTotal'] },
  { id: 'extend-place-value', title: 'Places past hundredths', families: ['readDecimal', 'compareDec', 'placeDigit'] },
  { id: 'convert-decimal-percent', title: '8.25% as a decimal', families: ['pctToDec', 'decBetween'] },
  { id: 'decimal-rate', title: 'Tax at a decimal rate', families: ['decTax', 'placePoint'] },
  { id: 'round-to-cent', title: 'Round the tax once', families: ['roundTax', 'roundTotal'] },
  { id: 'benchmark-check', title: 'Check with two bounds', families: ['benchCheck', 'boundsPick'] },
  { id: 'taxable-subtotal', title: 'Exempt items in the cart', families: ['exemptCart', 'taxableBase'] },
  { id: 'rate-from-receipt', title: 'Find the rate from a receipt', families: ['findRate'] },
  { id: 'price-from-tax', title: 'The price from the tax', families: ['priceFromTax'] },
  { id: 'total-multiplier', title: 'The total multiplier 1 + r', families: ['multiplier', 'multExpr', 'oneStepTotal'] },
  { id: 'price-from-total', title: 'The price from the total', families: ['priceFromTotal', 'whichDivision'] },
  { id: 'explain-subtract-fails', title: 'Why subtracting r% fails', families: ['subtractFails', 'testNumber'] },
  { id: 'rounded-receipt-check', title: 'Rounded receipts: test candidates', families: ['roundedTotal', 'roundedTaxRange', 'roundedRate'] },
  { id: 'budget-max-price', title: 'The most a budget allows', families: ['budgetMax'] },
  { id: 'compare-totals', title: 'Compare totals, not shelf prices', families: ['compareStores', 'saveGap'] },
];
