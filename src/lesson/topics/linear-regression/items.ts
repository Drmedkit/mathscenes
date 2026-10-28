// items.ts: the practice families of "Scatter plots, correlation and the regression line" (HS Statistics 2), one per
// deep structure, gathered from famA (roles, residuals, residual plots), famB (least squares, technology, slope,
// intercept, r) and famC (scope, cause, influence, critique, r²). plan.ts maps every sub-goal to its families.
import type { RGen } from './kit';
import * as A from './famA';
import * as B from './famB';
import * as C from './famC';

export { MC, type RItem } from './kit';

export const GENERATORS: Record<string, RGen> = {
  roles: A.roles, rolesAxis: A.rolesAxis, exactStat: A.exactStat, exactSample: A.exactSample, yhatRead: A.yhatRead, obsPred: A.obsPred,
  eyeEq: A.eyeEq, eyeCritique: A.eyeCritique, predict: A.predict, predictTable: A.predictTable, residual: A.residual, residGraph: A.residGraph,
  residMeaning: A.residMeaning, residCompare: A.residCompare, residPoint: A.residPoint, residZero: A.residZero, pattern: A.pattern,
  strengthResid: A.strengthResid,
  sseCompare: B.sseCompare, sseCompute: B.sseCompute, pairedLists: B.pairedLists, readOutput: B.readOutput, lsrlData: B.lsrlData,
  slopeSentence: B.slopeSentence, slopeChange: B.slopeChange, interceptMeaning: B.interceptMeaning, whichCoef: B.whichCoef,
  readR: B.readR, rData: B.rData, rUnits: B.rUnits, rSign: B.rSign, rMismatch: B.rMismatch, rStrongest: B.rStrongest,
  steepTight: B.steepTight, rZero: B.rZero, highRCurve: B.highRCurve,
  interExtra: C.interExtra, extraNonsense: C.extraNonsense, represent: C.represent, bigSample: C.bigSample, scope: C.scope,
  scopeWhich: C.scopeWhich, lurking: C.lurking, causeClaim: C.causeClaim, design: C.design, designLimits: C.designLimits,
  refit: C.refit, reportNotDelete: C.reportNotDelete, critique: C.critique, r2SS: C.r2SS, r2Sentence: C.r2Sentence,
  rFromR2: C.rFromR2, r2Compare: C.r2Compare,
};

export const FAMILY_NAMES: Record<string, string> = {
  roles: 'Which variable is x?', rolesAxis: 'Axes for the question', exactStat: 'Exact or statistical?', exactSample: 'Can the data prove a rule?',
  yhatRead: 'Observed or predicted', obsPred: 'y and ŷ in a table', eyeEq: 'Equation of a line by eye', eyeCritique: 'Judge a line of fit',
  predict: 'Predict from a model', predictTable: 'A table of predictions', residual: 'Compute a residual', residGraph: 'Read a residual off the graph',
  residMeaning: 'A residual in words', residCompare: 'Compare by residuals', residPoint: 'A point of the residual plot', residZero: 'Read the residual plot',
  pattern: 'Residual patterns', strengthResid: 'Strength from residuals', sseCompare: 'Least squares: which line?', sseCompute: 'Sum of squared residuals',
  pairedLists: 'Paired lists in a tool', readOutput: 'Read regression output', lsrlData: 'The least-squares line with technology',
  slopeSentence: 'The slope in context', slopeChange: 'Predicted change', interceptMeaning: 'The intercept in context', whichCoef: 'Slope or intercept?',
  readR: 'Read r from output', rData: 'r with technology', rUnits: 'r has no units', rSign: 'The sign of r', rMismatch: 'Does r match the plot?',
  rStrongest: 'Strongest and weakest r', steepTight: 'Steep or tight?', rZero: 'r = 0 but a curve', highRCurve: 'High r, curved residuals',
  interExtra: 'Interpolation or extrapolation', extraNonsense: 'Far outside the data', represent: 'Whom do the data represent?', bigSample: 'Big or random?',
  scope: 'Can the model be used here?', scopeWhich: 'A fair use of the model', lurking: 'Another explanation', causeClaim: 'Association or cause?',
  design: 'A study that tests cause', designLimits: 'What experiments can and cannot show', refit: 'Which point is influential?',
  reportNotDelete: 'What to do with an unusual point', critique: 'Fit, scope, cause', r2SS: 'r² from SSE and SST', r2Sentence: 'r² in words',
  rFromR2: 'r and r²', r2Compare: 'Comparing r² values',
};
