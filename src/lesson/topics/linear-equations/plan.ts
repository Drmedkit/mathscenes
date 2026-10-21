// plan.ts: the practice walks through every sub-goal of secondary-t5-30-solving-linear-equations, in topic JSON order
// (22 sub-goals). Each entry names the families that practise it; a family gets the sub-goal id and uses that
// sub-goal's cases (signs, parentheses, fractions, decimals, the three kinds of solution sets) from the topic JSON.
import type { SubgoalPlan } from '../../runtime/practice';

export const PLAN: readonly SubgoalPlan[] = [
  { id: 's1-check-both-sides', title: 'Check both sides', families: ['checkBoth', 'evalSides'] },
  { id: 's1-equivalent-equations', title: 'Equivalent: exactly the same solutions', families: ['sameSet'] },
  { id: 's1-same-number-both-sides', title: 'The same step on both whole sides', families: ['keepStep', 'noResolve'] },
  { id: 's1-variable-term-both-sides', title: 'An x-term off both sides', families: ['varStep'] },
  { id: 's1-expression-rewrite', title: 'Rewrite one side', families: ['rewrite'] },
  { id: 's1-nonzero-condition', title: 'Steps that change the solutions', families: ['zeroStep'] },
  { id: 's1-solution-set-types', title: 'One, none, or every number', families: ['howMany'] },
  { id: 's2-collect-integer', title: 'Collect the x-terms, then solve', families: ['solve', 'nextLine'] },
  { id: 's2-negative-coefficients', title: 'Negative coefficients', families: ['solve', 'nextLine'] },
  { id: 's2-expand-positive', title: 'Expand first, then solve', families: ['solve', 'nextLine'] },
  { id: 's2-negative-factor', title: 'A minus in front of parentheses', families: ['solve', 'nextLine'] },
  { id: 's2-fraction-coefficients', title: 'Clear the fractions', families: ['solve', 'nextLine'] },
  { id: 's2-decimal-coefficients', title: 'Decimals, checked in the original', families: ['solve', 'checkOrig'] },
  { id: 's3-one-solution', title: 'Ends at x = a number: one solution', families: ['classify'] },
  { id: 's3-no-solution', title: 'Ends false: no solution', families: ['classify'] },
  { id: 's3-infinitely-many', title: 'Ends always true: every number', families: ['classify'] },
  { id: 's3-classify-mixed', title: 'Sort them: one, none, every number', families: ['classify'] },
  { id: 's3-structure-predict', title: 'Predict from the structure', families: ['predict'] },
  { id: 's3-construct-examples', title: 'Build each kind', families: ['construct'] },
  { id: 's3-properties-of-equality', title: 'Name the property', families: ['nameProp'] },
  { id: 's3-written-justification', title: 'Finish the argument', families: ['argue'] },
  { id: 's3-context-interpret', title: 'What it means in the story', families: ['context'] },
];
