// plan.ts: the practice walks through every sub-goal of secondary-t5-25-sampling-and-comparative-inferences, in
// topic JSON order (17 sub-goals), each with the families that practise it (items.ts).
import type { SubgoalPlan } from '../../runtime/practice';

export const PLAN: readonly SubgoalPlan[] = [
  { id: 'pop-sample-id', title: 'Population and sample', families: ['popSample'] },
  { id: 'within-variability', title: 'Spread in a sample vs the population', families: ['spreadCompare'] },
  { id: 'statistic-parameter', title: 'Sample value vs population value', families: ['statParam'] },
  { id: 'random-representative', title: 'Why random samples work', families: ['isRandom', 'randomDiffers'] },
  { id: 'sampling-variability-concept', title: 'Samples vary', families: ['whatDot', 'twoSamples'] },
  { id: 'sample-size-effect', title: 'Bigger samples, steadier means', families: ['whichSize', 'biggerSample'] },
  { id: 'random-sampling-protocol', title: 'Draw a random sample', families: ['drawNumbers', 'absent'] },
  { id: 'estimate-from-sample', title: 'Estimate from one sample', families: ['estimate', 'report'] },
  { id: 'simulate-repeated-samples', title: 'Many samples: how far off?', families: ['typical', 'plan'] },
  { id: 'estimate-count-from-proportion', title: 'Scale a count up (whole factor)', families: ['scaleCount', 'reportCount'] },
  { id: 'center-difference-in-mad-units', title: 'The gap between centers, in MADs', families: ['madUnits', 'pickMeasure'] },
  { id: 'informal-comparative-inference', title: 'Compare two groups', families: ['compare'] },
  { id: 'selection-bias-mechanism', title: 'How a method biases', families: ['biasWay'] },
  { id: 'bias-vs-variability', title: 'Bias or chance?', families: ['biasOrChance', 'whichBiased'] },
  { id: 'scope-of-generalization', title: 'How far a claim reaches', families: ['scope'] },
  { id: 'estimate-count-nonwhole-factor', title: 'Scale up, round once', families: ['scaleNonWhole'] },
  { id: 'predict-population-percent', title: 'Predict a percent and the rest', families: ['complementPct', 'complementCount'] },
];
