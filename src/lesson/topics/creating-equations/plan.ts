// plan.ts: practice walks through every sub-goal of secondary-t6-06-creating-equations-and-inequalities, in topic JSON order.
import type { SubgoalPlan } from '../../runtime/practice';

export const PLAN: readonly SubgoalPlan[] = [
  { id: 'equation-as-condition', title: 'An equation is a condition', families: ['eqTest', 'eqMeaning'] },
  { id: 'inequality-as-allowed-set', title: 'An inequality allows a set', families: ['allowedSet', 'boundaryCand'] },
  { id: 'test-candidates', title: 'Test a value or a pair', families: ['pairTest', 'pairValue'] },
  { id: 'conjunction-of-constraints', title: 'Every condition at once', families: ['bothValue', 'pairBoth'] },
  { id: 'bound-phrase-to-symbol', title: 'From “at most” to a symbol', families: ['phraseSymbol', 'phraseWrite'] },
  { id: 'define-variables', title: 'Define each variable', families: ['defineVar', 'unitCheck'] },
  { id: 'one-var-equation', title: 'Write a one-variable equation', families: ['feeRate', 'groupEq'] },
  { id: 'one-var-inequality', title: 'Write a one-variable inequality', families: ['rateIneq', 'feeIneq'] },
  { id: 'two-var-resource', title: 'Two quantities, one budget', families: ['budget2', 'total2'] },
  { id: 'two-var-comparison', title: 'Compare two quantities', families: ['timesAsMany', 'atLeastTwice', 'compareCheck'] },
  { id: 'implicit-bounds', title: 'The bounds nobody states', families: ['unstatedBound', 'boundCandidate'] },
  { id: 'discrete-vs-continuous', title: 'Separated values or a range', families: ['discreteOrNot', 'fracValue'] },
  { id: 'assemble-system', title: 'Write the whole model', families: ['systemPick', 'missingCon'] },
  { id: 'viability-of-candidates', title: 'Viable or not?', families: ['viablePair', 'whichViable'] },
  { id: 'bound-rounding', title: 'Round the right way', families: ['busRound', 'intEnd', 'solveRound'] },
  { id: 'represent-allowed-values', title: 'Show the allowed values', families: ['pickRep', 'notation', 'pairRange'] },
  { id: 'empty-feasible-set', title: 'When nothing works', families: ['noOption', 'betweenInt'] },
  { id: 'model-assumption', title: 'Change the assumption', families: ['blocks', 'packs'] },
];
