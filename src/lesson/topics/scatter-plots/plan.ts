// plan.ts: practice walks through every sub-goal of secondary-t5-40-scatter-plots-and-bivariate-data, in topic JSON order.
// Each sub-goal: a short kid-friendly title and the families that practise it (items.ts makes the sub-goal's cases).
import type { SubgoalPlan } from '../../runtime/practice';

export const PLAN: readonly SubgoalPlan[] = [
  { id: 'pair-case', title: 'One case, two measurements', families: ['caseVars', 'keepPairs'] },
  { id: 'point-as-case', title: 'One dot is one case', families: ['readPoint', 'countCases'] },
  { id: 'plot-cases', title: 'Plot every case', families: ['whereDot', 'countCases', 'joinOrNot'] },
  { id: 'axis-roles', title: 'Which variable goes on x', families: ['whichOnX', 'axisPlan'] },
  { id: 'axis-scales', title: 'A scale for each axis', families: ['pickScale', 'readScaleY'] },
  { id: 'construct-plot', title: 'Build a whole plot', families: ['findTheFlaw', 'axisPlan', 'whereDot'] },
  { id: 'direction', title: 'Direction: a tendency', families: ['nameDirection', 'exceptionPair'] },
  { id: 'form', title: 'Form: straight or curved', families: ['linearOrCurve', 'straightEdge'] },
  { id: 'strength', title: 'Strength is not steepness', families: ['whichStronger', 'strongMeans'] },
  { id: 'clusters', title: 'Clusters', families: ['countClusters', 'completeDesc'] },
  { id: 'outliers', title: 'Outliers', families: ['findOutlier', 'keepOrDelete'] },
  { id: 'describe-in-context', title: 'Describe it in context', families: ['fullDescription', 'completeDesc'] },
  { id: 'scatter-vs-line-graph', title: 'Scatter plot or line graph', families: ['whichDisplay', 'joinOrNot'] },
  { id: 'fit-trend-line', title: 'Fit a trend line', families: ['bestLine', 'equalCounts', 'straightEdge'] },
  { id: 'prediction-from-line', title: 'Predict from the line', families: ['readPrediction', 'estimateMeaning'] },
  { id: 'trend-equation', title: 'The trend-line equation', families: ['predictEq', 'writeEq'] },
  { id: 'interp-vs-extrap', title: 'Inside or outside the data', families: ['classify', 'observedRange'] },
  { id: 'extrap-unjustified', title: 'Why far out is risky', families: ['whyRisky', 'estimateMeaning'] },
  { id: 'interpret-slope-intercept', title: 'Slope and intercept in context', families: ['slopeMeaning', 'interceptMeaning'] },
  { id: 'two-way-table', title: 'Two-way tables', families: ['readCell', 'grandTotal'] },
  { id: 'relative-frequencies', title: 'Relative frequencies', families: ['relFreq', 'associated'] },
  { id: 'categorical-association', title: 'Associated or not', families: ['associated', 'relFreq'] },
];
