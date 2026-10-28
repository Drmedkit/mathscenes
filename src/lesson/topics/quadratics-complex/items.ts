// items.ts: the practice families of "Quadratics with complex solutions" (fam1 stages 1-2, fam2 stage 3) and their names.
import type { Gen } from './common';
import { FAM1 } from './fam1';
import { FAM2 } from './fam2';

export { MC, type QItem, type QPicture } from './common';
export const GENERATORS: Record<string, Gen> = { ...FAM1, ...FAM2 };
export const FAMILY_NAMES: Record<string, string> = {
  rootNeg: 'Root of a negative', rootNegCoef: 'The number in front', discCount: 'How many solutions?', discValue: 'The discriminant',
  complexTruth: 'No real solution vs no solution', sqrtSolve: 'Solve by square roots', sqrtSolvePick: 'Square roots: pick the solutions',
  formulaInt: 'The formula: a ± bi', splitPick: 'Split into a ± bi', formulaRad: 'The formula: exact radicals', radCoef: 'The radical part',
  formulaA: 'When a is not 1', partsA: 'a ≠ 1 and fractional coefficients', mixedSolve: 'Read the form, then solve',
  contrastSolve: 'Real or non-real?', completeQ: 'Complete the square', residual: 'Substitute a complex number',
  verifyVerdict: 'Is it a solution?', conjProofStep: 'Why a conjugate pair', secondRoot: 'The other root', pairCheck: 'The conjugate test',
  whichPair: 'Which pair could it be?', conjEnough: 'Conjugates are not enough', whichEquation: 'Which equation?',
  complexCoef: 'When coefficients are not real', coefResidual: 'Substitute: complex coefficients', buildQuad: 'Build the quadratic',
  buildPick: 'Which quadratic?', modelInterp: 'What non-real means here', modelMax: 'The highest it gets',
};
