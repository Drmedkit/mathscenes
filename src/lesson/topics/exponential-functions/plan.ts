// plan.ts: practice walks through every sub-goal of secondary-t6-13-exponential-functions-and-growth-decay, in topic
// JSON order, each with a short title and the families that practise it (items.ts).
import type { SubgoalPlan } from '../../runtime/practice';

export const PLAN: readonly SubgoalPlan[] = [
  { id: 'repeated-factor', title: 'Growth: multiply by the same factor', families: ['continueTable', 'twoPlans'] },
  { id: 'decay-factor', title: 'Decay: multiply by a factor below 1', families: ['decaySubtract', 'decayPick', 'continueTable'] },
  { id: 'ratio-test', title: 'Equal differences or equal ratios', families: ['classifyTable', 'roundedRatios'] },
  { id: 'equal-intervals', title: 'Compare over equal input steps', families: ['stepTwo', 'unequalGaps'] },
  { id: 'percent-situations', title: 'Same amount or same percent?', families: ['situationType', 'simpleVsCompound'] },
  { id: 'long-run-comparison', title: 'Exponential beats linear in the end', families: ['overtake', 'aheadForever', 'decayVsLinear'] },
  { id: 'model-form', title: 'Write it as a·bᵗ', families: ['evalModel', 'formFromTable'] },
  { id: 'initial-value', title: 'The initial value a = f(0)', families: ['readA', 'readATable'] },
  { id: 'classify-by-b', title: 'Growth or decay from b', families: ['growOrDecay', 'pickModel'] },
  { id: 'graph-whole-inputs', title: 'Point graphs at whole inputs', families: ['matchPoints', 'twoGraphs', 'decayPoints'] },
  { id: 'continuous-graph', title: 'The curve: asymptote, domain, range', families: ['rangeChoice', 'asymptote', 'domainChoice'] },
  { id: 'factor-from-table', title: 'Find b from a table or graph', families: ['factorTable'] },
  { id: 'backsolve-initial', title: 'Back to t = 0', families: ['backA', 'backAWords'] },
  { id: 'factor-percent', title: 'Factor and percent rate', families: ['factorToPct', 'pctToFactor'] },
  { id: 'model-from-words', title: 'A model from a story', families: ['modelChoice', 'modelPair'] },
  { id: 'predict', title: 'Predict with units', families: ['predict'] },
  { id: 'multi-period-factor', title: 'The factor over k periods', families: ['kFactor', 'kPercent'] },
  { id: 'two-point-factor', title: 'b from two points', families: ['twoPt', 'twoPtModel'] },
  { id: 'exponent-period-count', title: 'The exponent counts periods', families: ['periodEval', 'periodCount'] },
  { id: 'rewrite-exponent-form', title: 'Rewrite as A·Bᵗ', families: ['rewritePair', 'rewriteRate'] },
  { id: 'periodic-compounding', title: 'Compounding n times a year', families: ['compoundBalance', 'apy', 'principalNeeded'] },
  { id: 'constant-ratio-proof', title: 'Prove the constant ratio', families: ['ratioProof', 'ratioOverH'] },
  { id: 'test-extra-observations', title: 'Test a model on more data', families: ['twoModels', 'modelCheck'] },
  { id: 'noisy-data-fit', title: 'Real data within a tolerance', families: ['noisyFit', 'ratioDrift'] },
  { id: 'time-domain', title: 'Meaningful inputs and outputs', families: ['contextDomain', 'contextRange'] },
  { id: 'extrapolation-limits', title: 'How far to trust it', families: ['horizon', 'trustModel'] },
];
