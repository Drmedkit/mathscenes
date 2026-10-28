// items.ts: the practice families of "Quadratic and exponential regression" (HS Statistics 3), one per deep structure,
// gathered from famA (shape, table check, residuals, residual patterns and size, least squares), famB (QuadReg, the ln
// scale, ExpReg, re-coding, parameters, comparing fits, solving, reporting, square-root models) and famC (extrapolation,
// domain, divergence, linearization, justification, bounds). plan.ts maps every sub-goal to its families.
import type { NGen } from './nkit';
import * as A from './famA';
import * as B from './famB';
import * as C from './famC';

export { MC, type NItemQ } from './nkit';

export const GENERATORS: Record<string, NGen> = {
  shapeFamily: A.shapeFamily, shapeTurn: A.shapeTurn, diffTest: A.diffTest, diffSpacing: A.diffSpacing, diffNoisy: A.diffNoisy,
  residQuad: A.residQuad, residExp: A.residExp, residOne: A.residOne, patternPick: A.patternPick, patternSumZero: A.patternSumZero,
  sizeUse: A.sizeUse, sizeTol: A.sizeTol, sseCompare: A.sseCompare, sseCompute: A.sseCompute,
  quadPredict: B.quadPredict, quadPrecision: B.quadPrecision, quadLists: B.quadLists, quad3pts: B.quad3pts,
  lnStep: B.lnStep, lnNonpos: B.lnNonpos, lnRelative: B.lnRelative,
  expOut: B.expOutF, expPredict: B.expPredict, expZero: B.expZero, expTools: B.expTools,
  recodeA: B.recodeA, recodePredict: B.recodePredict, interpB: B.interpB, interpVertex: B.interpVertex, interpC: B.interpC,
  compareFits: B.compareFits, solveCount: B.solveCount, solveExp: B.solveExp,
  reportBall: B.reportBall, reportNever: B.reportNever, reportWords: B.reportWords, sqrtFit: B.sqrtFit, sqrtShape: B.sqrtShape,
  interpExtrap: C.interpExtrap, domainQuad: C.domainQuad, domainPop: C.domainPop, divergePair: C.divergePair, divergeClaim: C.divergeClaim,
  linRecover: C.linRecover, linCurved: C.linCurved, cerPick: C.cerPick, cerVerdict: C.cerVerdict, boundsClaim: C.boundsClaim,
};

export const FAMILY_NAMES: Record<string, string> = {
  shapeFamily: 'Candidates from the shape', shapeTurn: 'Can this family follow it?', diffTest: 'Differences and ratios', diffSpacing: 'Unequal x-steps',
  diffNoisy: 'Noisy tables', residQuad: 'Residual of a quadratic model', residExp: 'Residual of an exponential model', residOne: 'One residual of 0',
  patternPick: 'Compare residual plots', patternSumZero: 'Residuals that add to 0', sizeUse: 'Residual size and scale', sizeTol: 'Good enough for the use?',
  sseCompare: 'Least squares: which curve?', sseCompute: 'Sum of squared residuals', quadPredict: 'Predict with QuadReg', quadPrecision: 'Precision of coefficients',
  quadLists: 'Lists for QuadReg', quad3pts: 'Regression or 3 chosen points?', lnStep: 'Steps on the ln scale', lnNonpos: 'ln of 0 or a negative',
  lnRelative: 'Residuals on the ln scale', expOut: 'Read ExpReg output', expPredict: 'Predict with ExpReg', expZero: 'A response of 0',
  expTools: 'Two tools, two fits', recodeA: 'Calendar years or elapsed time', recodePredict: 'Predict with re-coded time', interpB: 'What b says',
  interpVertex: 'The fitted peak or valley', interpC: 'The value at x = 0', compareFits: 'Which fitted family is adequate?', solveCount: 'How many inputs reach the target?',
  solveExp: 'Solve an exponential model', reportBall: 'Report only admissible times', reportNever: 'When the model never gets there', reportWords: 'Report a prediction',
  sqrtFit: 'Square-root models', sqrtShape: 'Square-root shape and domain', interpExtrap: 'Interpolation or extrapolation', domainQuad: 'Where the model can be used',
  domainPop: 'A different population', divergePair: 'Two models far from the data', divergeClaim: 'Equal fits, equal predictions?', linRecover: 'Back from ln y = A + Bx',
  linCurved: 'Straight on the ln scale?', cerPick: 'The strongest justification', cerVerdict: 'Choose, refuse or ask for more', boundsClaim: 'Residuals are no guarantee',
};
