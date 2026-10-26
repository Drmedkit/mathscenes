// items.ts: practice families for "Exponential growth and decay" (Algebra 1, secondary-t6-13). Families live in
// fam1.ts (stage 1: what exponential change is), fam2.ts (stage 2: the model a·b^t and its pictures), fam3.ts
// (stage 3: rewriting, compounding, proof, validity). Every family is generated from templates with the sub-goal's
// number ranges, checked exactly (expo.ts), and every wrong answer it recognises carries a misconception id from
// math-curriculum-essentials/misconceptions.json. Pure: no DOM.
import type { Gen } from './common';
import * as F1 from './fam1';
import * as F2 from './fam2';
import * as F3 from './fam3';

export type { QItem } from './common';
export { MC } from './common';

export const GENERATORS: Record<string, Gen> = {
  continueTable: F1.continueTable, twoPlans: F1.twoPlans, decaySubtract: F1.decaySubtract, decayPick: F1.decayPick,
  classifyTable: F1.classifyTable, roundedRatios: F1.roundedRatios, stepTwo: F1.stepTwo, unequalGaps: F1.unequalGaps,
  situationType: F1.situationType, simpleVsCompound: F1.simpleVsCompound, overtake: F1.overtake, aheadForever: F1.aheadForever,
  decayVsLinear: F1.decayVsLinear,
  evalModel: F2.evalModel, formFromTable: F2.formFromTable, readA: F2.readA, readATable: F2.readATable,
  growOrDecay: F2.growOrDecay, pickModel: F2.pickModel, matchPoints: F2.matchPoints, twoGraphs: F2.twoGraphs,
  decayPoints: F2.decayPoints, rangeChoice: F2.rangeChoice, asymptote: F2.asymptote, domainChoice: F2.domainChoice,
  factorTable: F2.factorTable, backA: F2.backA, backAWords: F2.backAWords, factorToPct: F2.factorToPct,
  pctToFactor: F2.pctToFactor, modelChoice: F2.modelChoice, modelPair: F2.modelPair, predict: F2.predict,
  kFactor: F3.kFactor, kPercent: F3.kPercent, twoPt: F3.twoPt, twoPtModel: F3.twoPtModel, periodEval: F3.periodEval,
  periodCount: F3.periodCount, rewritePair: F3.rewritePair, rewriteRate: F3.rewriteRate, compoundBalance: F3.compoundBalance,
  apy: F3.apy, principalNeeded: F3.principalNeeded, ratioProof: F3.ratioProof, ratioOverH: F3.ratioOverH,
  twoModels: F3.twoModels, modelCheck: F3.modelCheck, noisyFit: F3.noisyFit, ratioDrift: F3.ratioDrift,
  contextDomain: F3.contextDomain, contextRange: F3.contextRange, horizon: F3.horizon, trustModel: F3.trustModel,
};

export const FAMILY_NAMES: Record<string, string> = {
  continueTable: 'Keep multiplying', twoPlans: 'Adding vs multiplying', decaySubtract: 'Percent of what is left', decayPick: 'A factor that decays',
  classifyTable: 'Linear, exponential or neither', roundedRatios: 'Exactly equal ratios?', stepTwo: 'Steps of 2', unequalGaps: 'Unequal gaps',
  situationType: 'Same amount or same factor?', simpleVsCompound: 'Simple vs compound', overtake: 'When does it pass?', aheadForever: 'Ahead forever?',
  decayVsLinear: 'Does it reach 0?', evalModel: 'Evaluate a·bᵗ', formFromTable: 'Formula from a table', readA: 'The starting value',
  readATable: 'The value at x = 0', growOrDecay: 'Growth or decay?', pickModel: 'Which one decays or grows?', matchPoints: 'Points to formula',
  twoGraphs: 'Same a or same b?', decayPoints: 'Decay stays positive', rangeChoice: 'The range', asymptote: 'Toward the asymptote',
  domainChoice: 'The domain', factorTable: 'The factor b', backA: 'Back to t = 0', backAWords: 'Back to the start',
  factorToPct: 'Factor to percent', pctToFactor: 'Percent to factor', modelChoice: 'Pick the model', modelPair: 'Write the model',
  predict: 'Predict with the model', kFactor: 'Factor over k periods', kPercent: 'Percent over k periods', twoPt: 'b from two points',
  twoPtModel: 'Model from two points', periodEval: 'Whole periods', periodCount: 'Count the periods', rewritePair: 'Rewrite as A·Bᵗ',
  rewriteRate: 'Monthly to yearly', compoundBalance: 'Compound n times a year', apy: 'APY', principalNeeded: 'Deposit for a target',
  ratioProof: 'Prove the constant ratio', ratioOverH: 'Ratio over h steps', twoModels: 'A third observation', modelCheck: 'Test the model',
  noisyFit: 'Within the tolerance?', ratioDrift: 'Ratios that drift', contextDomain: 'Meaningful inputs', contextRange: 'Meaningful outputs',
  horizon: 'Where the model breaks', trustModel: 'Can we trust it?',
};
