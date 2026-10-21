// plan.ts: the practice walks through every sub-goal of secondary-t5-43-percent-applications-grade-7, in topic JSON
// order. Each sub-goal names the families that practise it; a generator gets the sub-goal id and uses its ranges.
import type { SubgoalPlan } from '../../runtime/practice';

export const PLAN: readonly SubgoalPlan[] = [
  { id: 'base-markup', title: 'Markup: the cost is 100%', families: ['base', 'baseCalc'] },
  { id: 'base-discount', title: 'Discount: the original is 100%', families: ['base', 'baseCalc'] },
  { id: 'base-sales-tax', title: 'Sales tax: the taxable amount', families: ['base', 'baseCalc'] },
  { id: 'base-tip-commission', title: 'Tips, commission and fees', families: ['base', 'baseCalc'] },
  { id: 'base-simple-interest', title: 'Interest: the principal stays', families: ['base', 'baseCalc'] },
  { id: 'add-or-subtract', title: 'Add it, take it off, or neither', families: ['direction'] },
  { id: 'percent-of-original', title: 'The new amount as one percent', families: ['pctOf'] },
  { id: 'multiplier-encode', title: 'One multiplier', families: ['mult'] },
  { id: 'single-change-in-context', title: 'One change in a story', families: ['single'] },
  { id: 'commission-earnings', title: 'Salary plus commission', families: ['commission'] },
  { id: 'round-to-cent', title: 'Round to the cent', families: ['round'] },
  { id: 'income-tax-wages', title: 'Income tax and net pay', families: ['wages'] },
  { id: 'estimate-check', title: 'Check with an estimate', families: ['estimate'] },
  { id: 'successive-changes', title: 'One change after another', families: ['successive'] },
  { id: 'reverse-percent', title: 'Back to the original', families: ['reverse'] },
  { id: 'percent-error', title: 'Percent error', families: ['pctError'] },
  { id: 'simple-interest-years', title: 'Simple interest over years', families: ['interest'] },
  { id: 'interest-months', title: 'Interest for months', families: ['months'] },
  { id: 'justify-single-multiplier', title: 'Why one multiplier works', families: ['factor'] },
  { id: 'product-of-multipliers', title: 'Multiply the multipliers', families: ['product'] },
  { id: 'net-percent-change', title: 'The net change', families: ['net'] },
  { id: 'undo-change-inverse', title: 'Undo a change', families: ['undo'] },
  { id: 'order-and-fixed-coupons', title: 'Does the order matter?', families: ['order'] },
  { id: 'shared-vs-updated-base', title: 'Same base or a new base?', families: ['shared'] },
  { id: 'compare-offers', title: 'Compare two offers', families: ['offers'] },
];
