// plan.ts: practice walks through every sub-goal of secondary-t7-19-regression-models-non-linear, in topic JSON order.
// Each sub-goal has a short title and the families that practise it (a family may serve two sub-goals).
import type { SubgoalPlan } from '../../runtime/practice';

export const PLAN: readonly SubgoalPlan[] = [
  { id: 'family-from-shape', title: 'Candidate families from the shape', families: ['shapeFamily', 'shapeTurn'] },
  { id: 'table-difference-ratio-test', title: 'Second differences and ratios (provisional)', families: ['diffTest', 'diffSpacing', 'diffNoisy'] },
  { id: 'residuals-curved-model', title: 'Residuals of a curved model', families: ['residQuad', 'residExp', 'residOne'] },
  { id: 'residual-pattern', title: 'Residual patterns compare models', families: ['patternPick', 'patternSumZero'] },
  { id: 'residual-size', title: 'Residual size against units and use', families: ['sizeUse', 'sizeTol'] },
  { id: 'least-squares-criterion', title: 'What least squares means', families: ['sseCompare', 'sseCompute'] },
  { id: 'quadratic-regression', title: 'Quadratic regression with technology', families: ['quadPredict', 'quadPrecision', 'quadLists', 'quad3pts'] },
  { id: 'log-response-scale', title: 'The ln scale', families: ['lnStep', 'lnNonpos', 'lnRelative'] },
  { id: 'exponential-regression', title: 'Exponential regression with technology', families: ['expOut', 'expPredict', 'expZero', 'expTools'] },
  { id: 'recode-input', title: 'Years as elapsed time', families: ['recodeA', 'recodePredict'] },
  { id: 'interpret-parameters', title: 'Fitted parameters in context', families: ['interpB', 'interpVertex', 'interpC'] },
  { id: 'compare-own-fits', title: 'Compare your own fits', families: ['compareFits', 'expTools'] },
  { id: 'solve-for-input', title: 'Solve model = target', families: ['solveCount', 'solveExp'] },
  { id: 'report-in-context', title: 'Report in context', families: ['reportBall', 'reportNever', 'reportWords'] },
  { id: 'square-root-regression', title: 'Square-root models (Texas)', families: ['sqrtFit', 'sqrtShape'] },
  { id: 'interp-vs-extrap', title: 'Interpolation or extrapolation', families: ['interpExtrap'] },
  { id: 'context-domain', title: 'Where the model can be used', families: ['domainQuad', 'domainPop'] },
  { id: 'model-divergence', title: 'Equal fits, different predictions', families: ['divergePair', 'divergeClaim'] },
  { id: 'log-linearization', title: 'Linearize with ln y (Florida)', families: ['linRecover', 'linCurved'] },
  { id: 'model-choice-argument', title: 'Justify a model choice', families: ['cerPick', 'cerVerdict'] },
  { id: 'no-guaranteed-bounds', title: 'Residuals are no guarantee', families: ['boundsClaim'] },
];
