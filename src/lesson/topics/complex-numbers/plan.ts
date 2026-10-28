// plan.ts: practice walks through every sub-goal of secondary-t7-01-complex-numbers, in topic JSON order.
import type { SubgoalPlan } from '../../runtime/practice';

export const PLAN: readonly SubgoalPlan[] = [
  { id: 'define-i', title: 'Why i is a new number: i² = −1', families: ['squareSign', 'whyNoReal'] },
  { id: 'sqrt-neg-perfect', title: 'Roots of negatives: √(−9) = 3i', families: ['sqrtNeg', 'rootContrast'] },
  { id: 'sqrt-neg-nonperfect', title: 'Simplify √(−12) = 2i√3', families: ['sqrtNonPerfect', 'nonPerfectCoef'] },
  { id: 'standard-form', title: 'The form a + bi: real and imaginary parts', families: ['readParts', 'planeRead', 'stdFormPick'] },
  { id: 'reals-in-complex', title: 'Real, purely imaginary, or neither', families: ['classify', 'setTruth'] },
  { id: 'equal-by-parts', title: 'Equal means equal parts', families: ['whichEqual', 'solveEqual'] },
  { id: 'add-complex', title: 'Add: real with real, i with i', families: ['addPair', 'fracAddSub', 'propertyName'] },
  { id: 'subtract-complex', title: 'Subtract: the minus goes to both parts', families: ['subPair', 'fracAddSub'] },
  { id: 'multiply-by-imaginary', title: 'Multiply by i: i² = −1', families: ['monoProduct', 'scaleDistribute', 'rotateByI'] },
  { id: 'multiply-complex', title: 'Multiply two complex numbers', families: ['binProduct', 'squareComplex', 'propertyName'] },
  { id: 'radical-product-trap', title: 'The trap: √(−4) · √(−9) = −6', families: ['radProduct', 'radTrapChoice'] },
  { id: 'powers-of-i', title: 'Powers of i repeat every 4', families: ['iPower', 'iPowerSum'] },
  { id: 'conjugate', title: 'The conjugate a − bi', families: ['conjPair', 'conjPlane'] },
  { id: 'conjugate-product', title: 'z times its conjugate: a² + b²', families: ['conjProduct', 'sumSquaresPick', 'distance'] },
  { id: 'divide-by-real', title: 'Divide by a real number', families: ['divReal', 'divRealFrac'] },
  { id: 'divide-by-imaginary', title: 'Divide by an imaginary number', families: ['divI', 'divIRotate'] },
  { id: 'divide-complex', title: 'Divide using the conjugate', families: ['divComplex', 'divSteps'] },
  { id: 'diagnose-product-error', title: 'Find and fix the invalid step', families: ['findError', 'nameRule', 'finishWork'] },
  { id: 'justify-conjugate-identity', title: 'Prove z · z̄ = a² + b² ≥ 0', families: ['conjProofStep', 'alwaysSometimes'] },
  { id: 'verify-quotient-by-multiplying', title: 'Check a quotient by multiplying back', families: ['checkProduct', 'verifyQuot'] },
  { id: 'justify-division-method', title: 'Why the conjugate method works', families: ['whyConj', 'newDenominator'] },
];
