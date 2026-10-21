// plan.ts: practice walks through every sub-goal of secondary-t5-44-multi-step-equations-with-rational-coefficients,
// in topic JSON order (22 sub-goals, 36 families). Each entry names the families that practise it; a family gets the
// sub-goal id and uses that sub-goal's cases (fractions, decimals, groups, the three kinds of solution sets, contexts).
import type { SubgoalPlan } from '../../runtime/practice';

export const PLAN: readonly SubgoalPlan[] = [
  { id: 'coefficient-as-multiplier', title: 'A coefficient multiplies', families: ['evalTerm', 'coefMeaning'] },
  { id: 'equivalent-coefficient-forms', title: 'One coefficient, many notations', families: ['formMatch', 'mixedCoef'] },
  { id: 'fraction-bar-grouping', title: 'The fraction bar groups the top', families: ['barSplit', 'barClear'] },
  { id: 'equivalent-equations-solution-set', title: 'Equivalent: the same solutions', families: ['sameSet', 'scaleKeep'] },
  { id: 'scale-whole-equation', title: 'Multiply the whole equation', families: ['scaleKeep', 'scaleBy'] },
  { id: 'choose-clearing-multiplier', title: 'Pick the clearing number', families: ['lcdPick', 'validMult'] },
  { id: 'clear-every-term-two-step', title: 'Clear every term, then solve', families: ['clearLine', 'clearSolve'] },
  { id: 'collect-like-terms-one-side', title: 'Combine like terms first', families: ['collectLine', 'collectSolve'] },
  { id: 'distribute-rational-factor', title: 'A fraction in front of parentheses', families: ['distFirst', 'distSolve'] },
  { id: 'clear-binomial-numerators', title: 'Keep each numerator together', families: ['barClear', 'barSolve'] },
  { id: 'variables-both-sides-rational', title: 'x on both sides', families: ['bothLine', 'bothSolve'] },
  { id: 'plan-multi-step-strategy', title: 'Plan the whole solve', families: ['planFirst', 'planSolve', 'exactForm'] },
  { id: 'identity-after-cancel', title: 'Every number works', families: ['howMany', 'zeroTrap'] },
  { id: 'contradiction-after-cancel', title: 'No number works', families: ['howMany', 'makeKind', 'zeroTrap'] },
  { id: 'check-in-original', title: 'Check in the original', families: ['checkCand', 'checkSide'] },
  { id: 'estimate-reasonableness', title: 'Is the answer reasonable?', families: ['estimate', 'checkCand'] },
  { id: 'justify-steps-properties', title: 'Name the property', families: ['nameProp', 'scaleBy'] },
  { id: 'locate-first-invalid-step', title: 'Find the first wrong step', families: ['firstBad', 'checkCand'] },
  { id: 'check-versus-justification', title: 'A check is not a proof', families: ['oneValue', 'sameSet'] },
  { id: 'interpret-solution-in-context', title: 'What the answer means', families: ['planMeaning', 'feasible'] },
  { id: 'model-comparison-both-sides', title: 'Write the comparison', families: ['writeModel', 'planMeaning'] },
  { id: 'write-context-for-relation', title: 'A story for the equation', families: ['storyFor', 'writeModel'] },
];
