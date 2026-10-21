// plan.ts: practice walks through every sub-goal of primary.ratios.calculate-simple-interest, in topic JSON order.
// Each sub-goal names the families that practise it; a generator gets the sub-goal id (items.ts).
import type { SubgoalPlan } from '../../runtime/practice';

export const PLAN: readonly SubgoalPlan[] = [
  { id: 'identify-principal', title: 'The principal: the starting amount', families: ['whoIsP', 'findP'] },
  { id: 'rate-as-percent-of-principal', title: 'The rate: a percent of the principal', families: ['per100', 'rateVsDollars'] },
  { id: 'match-rate-period', title: 'Per year, for one year', families: ['periodTrap', 'oneYearUnit'] },
  { id: 'savings-and-loan-contexts', title: 'Savings and loans', families: ['loanRoles', 'earnOrOwe'] },
  { id: 'interest-friendly', title: 'One year of interest', families: ['oneYear', 'fromTen'] },
  { id: 'interest-decimal-rates', title: 'Rates like 3.5% and 0.8%', families: ['decInterest', 'pctToDec'] },
  { id: 'new-balance', title: 'Principal + interest', families: ['endBalance', 'labelBoth'] },
  { id: 'balance-multiplier', title: 'One step: × (1 + r)', families: ['multExpr', 'multValue'] },
  { id: 'round-to-cent', title: 'Round to the nearest cent', families: ['roundI', 'roundRule'] },
  { id: 'justify-reasonableness', title: 'Check the base and the size', families: ['spotError', 'estimate'] },
  { id: 'simple-multi-year', title: 'Year by year: the same each year', families: ['tableCell', 'sameEach'] },
  { id: 'simple-interest-formula', title: 'I = P × r × t', families: ['formulaI', 'formulaTotal', 'costOfCredit'] },
  { id: 'fractional-years', title: 'Months as part of a year', families: ['monthsT', 'monthsI'] },
  { id: 'compound-year-by-year', title: 'Compound: interest on interest', families: ['compoundCell', 'compoundBase'] },
  { id: 'compare-simple-compound', title: 'Simple or compound?', families: ['ruleFromTable', 'gapGrows', 'saverBorrower'] },
];
