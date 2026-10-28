// items.ts: practice families for "Linear, quadratic or exponential?" (Algebra 1, secondary-t6-34). Families live in
// fam1.ts (stage 1: the table tests and why they work), fam2.ts (stage 2: comparing families, graphs, the
// parent-function gallery, eventual dominance), fam3.ts (stage 3: choosing a model from a context or data). Every
// table comes from tables.ts (exactly one family fits it); every wrong answer a family recognises carries a
// misconception id from math-curriculum-essentials/misconceptions.json. Pure: no DOM.
import type { Gen } from './common';
import * as F1 from './fam1';
import * as F2 from './fam2';
import * as F3 from './fam3';

export type { QItem } from './common';
export { MC } from './common';

export const GENERATORS: Record<string, Gen> = {
  spacingCheck: F1.spacingCheck, unequalSlope: F1.unequalSlope, unequalVerdict: F1.unequalVerdict,
  slopeFromDiff: F1.slopeFromDiff, isLinear: F1.isLinear, secondDiffClassify: F1.secondDiffClassify, nextValue: F1.nextValue,
  ratioClassify: F1.ratioClassify, ratioDirection: F1.ratioDirection, ratioValue: F1.ratioValue,
  genericStep: F1.genericStep, directionImplication: F1.directionImplication,
  factorToPercent: F1.factorToPercent, tableToPercent: F1.tableToPercent, negativeContrast: F1.negativeContrast,
  constantTable: F1.constantTable, zeroOutput: F1.zeroOutput, classifyMixed: F1.classifyMixed, whichTable: F1.whichTable,
  compareAt: F2.compareAt, compareTableAt: F2.compareTableAt, avgRateFormula: F2.avgRateFormula, avgRateGraph: F2.avgRateGraph,
  avgRateMeaning: F2.avgRateMeaning, ratePattern: F2.ratePattern, rateRace: F2.rateRace, graphFamily: F2.graphFamily,
  graphFeature: F2.graphFeature, equationFamily: F2.equationFamily, graphGallery: F2.graphGallery, asymptoteShift: F2.asymptoteShift,
  extendedGraph: F2.extendedGraph, tableCandidates: F2.tableCandidates, linearPair: F2.linearPair, rangeFromTable: F2.rangeFromTable,
  linVsNonlin: F2.linVsNonlin, maxFromTable: F2.maxFromTable, whoWinsLongRun: F2.whoWinsLongRun, tableOrder: F2.tableOrder,
  lastCrossoverTable: F2.lastCrossoverTable, lastCrossoverGraph: F2.lastCrossoverGraph,
  contextLinModel: F3.contextLinModel, contextLinValue: F3.contextLinValue, contextWhichFamily: F3.contextWhichFamily,
  contextExpValue: F3.contextExpValue, productFamily: F3.productFamily, productModel: F3.productModel,
  rateChangeFamily: F3.rateChangeFamily, savingsTotal: F3.savingsTotal, twoModelsAgree: F3.twoModelsAgree, enoughData: F3.enoughData,
  noisyChoose: F3.noisyChoose, noisyFormula: F3.noisyFormula, domainChoice: F3.domainChoice, extrapolate: F3.extrapolate,
  justification: F3.justification, insufficientOrNone: F3.insufficientOrNone,
};

export const FAMILY_NAMES: Record<string, string> = {
  spacingCheck: 'Equal x-steps?', unequalSlope: 'Δy/Δx with unequal steps', unequalVerdict: 'What unequal steps allow',
  slopeFromDiff: 'Difference vs slope', isLinear: 'Consistent with linear?', secondDiffClassify: 'Read the 2nd differences', nextValue: 'Extend a quadratic table',
  ratioClassify: 'The ratio test', ratioDirection: 'Up or down?', ratioValue: 'The factor per step',
  genericStep: 'Any step h', directionImplication: 'Which way does it prove?',
  factorToPercent: 'Factor to percent', tableToPercent: 'Percent from a table', negativeContrast: 'A negative start',
  constantTable: 'A constant table', zeroOutput: 'A zero in the table', classifyMixed: 'Linear, quadratic, exponential or none', whichTable: 'Find the table',
  compareAt: 'Largest at one input', compareTableAt: 'Continue three patterns', avgRateFormula: 'Average rate from a rule', avgRateGraph: 'Average rate from a graph',
  avgRateMeaning: 'What the average rate means', ratePattern: 'How the rate changes', rateRace: 'Whose rate is greater?', graphFamily: 'Family from a graph',
  graphFeature: 'The telling feature', equationFamily: 'Type from the equation', graphGallery: 'Type from the graph', asymptoteShift: 'A shifted asymptote',
  extendedGraph: 'Log, reciprocal or piecewise', tableCandidates: 'A rule for every row', linearPair: 'Two linear functions', rangeFromTable: 'What a table cannot settle',
  linVsNonlin: 'Linear vs nonlinear', maxFromTable: 'The maximum between the rows', whoWinsLongRun: 'Who wins in the long run?', tableOrder: 'Passing for good',
  lastCrossoverTable: 'The last crossover (table)', lastCrossoverGraph: 'The last crossover (graph)',
  contextLinModel: 'Same amount per step', contextLinValue: 'Not proportional', contextWhichFamily: 'Same amount or same percent?',
  contextExpValue: 'Compound growth', productFamily: 'A product of two quantities', productModel: 'Write the product',
  rateChangeFamily: 'A rate that changes steadily', savingsTotal: 'Total of a growing deposit', twoModelsAgree: 'Which point separates them?', enoughData: 'Enough points?',
  noisyChoose: 'Within the tolerance', noisyFormula: 'Candidates at uneven times', domainChoice: 'A sensible domain', extrapolate: 'Too far from the data',
  justification: 'A complete justification', insufficientOrNone: 'None, or not enough data',
};
