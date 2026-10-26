// plan.ts: practice walks through every sub-goal of secondary-t6-07-solving-linear-equations-and-inequalities-algebra-i,
// in topic JSON order. Every sub-goal has two or three families (items.ts).
import type { SubgoalPlan } from '../../runtime/practice';

export const PLAN: readonly SubgoalPlan[] = [
  { id: 'equiv-solution-set', title: 'Equivalent means the same solution set', families: ['sameSet', 'pickEquiv'] },
  { id: 'reversible-ops-preserve', title: 'Steps you can undo keep the solutions', families: ['undoStep', 'whyKeeps'] },
  { id: 'non-equivalent-steps', title: 'Steps that lose or gain solutions', families: ['badStep', 'lostSolution'] },
  { id: 'order-preserving-ops', title: 'Steps that keep an inequality’s direction', families: ['keepDir', 'stepIneq'] },
  { id: 'negative-scaling-reverses', title: 'A negative factor turns the symbol', families: ['flipNum', 'doesFlip'] },
  { id: 'annotate-worked-solution', title: 'A reason for every step', families: ['reasonFor', 'propName'] },
  { id: 'justified-chain-two-step', title: 'Your own chain: px + q = r and p(x + q) = r', families: ['chainSolve', 'nextReason'] },
  { id: 'variable-terms-both-sides', title: 'x on both sides', families: ['bothSolve', 'collectSide'] },
  { id: 'identity-contradiction-equations', title: 'All real numbers or no solution', families: ['howMany', 'whySet'] },
  { id: 'rational-coefficients-lcd', title: 'Fractions and decimals: clear them in one step', families: ['lcdSolve', 'lcdLine'] },
  { id: 'letter-coefficients', title: 'Solve a formula for a letter', families: ['rearrange', 'formulaCheck', 'nonzeroCond'] },
  { id: 'zero-parameter-cases', title: 'When the letter you divide by is 0', families: ['paramCases', 'paramValue', 'nonzeroCond'] },
  { id: 'inequality-no-reversal', title: 'Multi-step inequalities and their graphs', families: ['ineqSolve', 'ineqGraph'] },
  { id: 'inequality-with-reversal', title: 'Inequalities where the symbol turns', families: ['revSolve', 'revStep'] },
  { id: 'inequality-special-cases', title: 'When x cancels in an inequality', families: ['ineqCancel', 'constStatement'] },
  { id: 'compound-inequalities', title: 'Compound inequalities: and, or', families: ['compSolve', 'andOr', 'compContext'] },
  { id: 'check-original-equation', title: 'Check in the original, find the bad step', families: ['checkVerdict', 'checkSide', 'firstBad'] },
  { id: 'boundary-test-points', title: 'Test the boundary and both sides', families: ['testPoint', 'whichTests'] },
  { id: 'prove-complete-set', title: 'All the solutions, and only those', families: ['completeArg', 'memberVsAll'] },
  { id: 'contextual-domain', title: 'Answers that make sense in the story', families: ['viable', 'domainPick'] },
  { id: 'validate-model', title: 'Does the model fit the words?', families: ['modelCheck', 'critique'] },
];
