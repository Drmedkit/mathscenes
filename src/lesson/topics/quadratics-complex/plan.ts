// plan.ts: practice walks through every sub-goal of secondary-t7-09-solving-quadratic-equations-with-complex-solutions, in topic JSON order.
import type { SubgoalPlan } from '../../runtime/practice';

export const PLAN: readonly SubgoalPlan[] = [
  { id: 'sqrt-of-negative', title: 'Roots of negatives: √(−48) = 4i√3', families: ['rootNeg', 'rootNegCoef'] },
  { id: 'neg-discriminant-meaning', title: 'A negative discriminant: two non-real solutions', families: ['discCount', 'discValue', 'complexTruth'] },
  { id: 'sqrt-method-negative', title: 'Square roots when the square is negative', families: ['sqrtSolve', 'sqrtSolvePick'] },
  { id: 'formula-perfect-square', title: 'The formula: split into a ± bi', families: ['formulaInt', 'splitPick'] },
  { id: 'formula-nonsquare-radical', title: 'The formula: exact radical parts', families: ['formulaRad', 'radCoef'] },
  { id: 'formula-nonunit-a', title: 'The formula when a is not 1', families: ['formulaA', 'partsA'] },
  { id: 'method-choice-mixed', title: 'Read the form, pick a method', families: ['mixedSolve', 'contrastSolve', 'completeQ'] },
  { id: 'verify-by-substitution', title: 'Check a complex root by substituting', families: ['residual', 'verifyVerdict'] },
  { id: 'conjugate-pair-justify', title: 'Why non-real roots come as a conjugate pair', families: ['conjProofStep', 'secondRoot'] },
  { id: 'conjugate-pair-check', title: 'Rule out impossible pairs', families: ['pairCheck', 'whichPair'] },
  { id: 'conjugacy-not-sufficient', title: 'Conjugates are not proof', families: ['conjEnough', 'whichEquation'] },
  { id: 'real-coefficient-boundary', title: 'The pair rule needs real coefficients', families: ['complexCoef', 'coefResidual'] },
  { id: 'build-from-conjugate-root', title: 'Build a quadratic from one root', families: ['buildQuad', 'buildPick'] },
  { id: 'interpret-in-model', title: 'Non-real solutions in a real model', families: ['modelInterp', 'modelMax'] },
];
