// plan.ts: practice walks through every sub-goal of secondary-t5-29-proportional-relationships-lines-and-linear-equations,
// in topic JSON order. Each sub-goal names the families that practise it; a generator gets the sub-goal id and uses
// that sub-goal's cases (items.ts).
import type { SubgoalPlan } from '../../runtime/practice';

export const PLAN: readonly SubgoalPlan[] = [
  { id: 'unit-rate-run-one', title: 'The unit rate is the slope', families: ['unitRate', 'rateTable'] },
  { id: 'paired-changes', title: 'Change in x, change in y', families: ['changes', 'tableChanges'] },
  { id: 'change-quotient', title: 'Slope = rise ÷ run', families: ['slopePts', 'slopeTri', 'slopeMeaning'] },
  { id: 'scaled-axes-slope', title: 'Read the scales, not the squares', families: ['slopeTri', 'squaresToScale'] },
  { id: 'slope-triangles-similar', title: 'Slope triangles are similar', families: ['whySimilar', 'similarOrNot'] },
  { id: 'slope-invariance', title: 'The same slope anywhere', families: ['bigTriangle', 'brokenPath'] },
  { id: 'negative-slope', title: 'Negative slope: going down', families: ['slopePts', 'bigTriangle', 'rateTable'] },
  { id: 'zero-slope', title: 'Zero slope: no change', families: ['specialSlope', 'flatMeaning'] },
  { id: 'vertical-undefined', title: 'Vertical: undefined slope', families: ['specialSlope', 'hvMatch'] },
  { id: 'uneven-table-rate', title: 'Tables with uneven steps', families: ['rateTable', 'tableChanges'] },
  { id: 'point-on-line-check', title: 'Is the point on the line?', families: ['onLine', 'whichPoint'] },
  { id: 'write-y-equals-kx', title: 'Write y = kx', families: ['writeFromGraph', 'directVar'] },
  { id: 'graph-y-equals-kx', title: 'Graph y = kx with the slope', families: ['graphStep', 'whichGraph'] },
  { id: 'initial-value', title: 'The initial value b', families: ['readB', 'tableB'] },
  { id: 'write-y-mx-plus-b', title: 'Write y = mx + b', families: ['writeFromGraph', 'wordsToMB'] },
  { id: 'graph-y-mx-plus-b', title: 'Graph y = mx + b', families: ['graphStep', 'whichGraph'] },
  { id: 'contextual-domain', title: 'How much of the line?', families: ['domainShape', 'allowedInput'] },
  { id: 'recover-b', title: 'Find b from a point', families: ['bFromPoint', 'lineFromTwo'] },
  { id: 'missing-coordinate', title: 'A missing coordinate', families: ['missingY', 'missingX'] },
  { id: 'interpret-m-b-in-context', title: 'What m and b mean', families: ['meaningMB', 'slopeMeaning'] },
  { id: 'compare-two-relationships', title: 'Compare two rates', families: ['compareRates', 'compareGraphs'] },
  { id: 'ratio-vs-slope', title: 'y/x or the slope?', families: ['ratioOrSlope', 'yOverX'] },
  { id: 'nonlinear-varying-rate', title: 'A changing rate: not linear', families: ['varyingRate', 'rateTable'] },
  { id: 'three-way-classification', title: 'Proportional, linear or nonlinear', families: ['classify3', 'classifyGraph'] },
  { id: 'justify-b-zero', title: 'Proportional means b = 0', families: ['bZero', 'yOverX'] },
  { id: 'choose-model-in-context', title: 'Fee or no fee?', families: ['chooseModel', 'doubling'] },
  { id: 'evidence-limits', title: 'Evidence or proof?', families: ['evidence', 'brokenPath'] },
];
