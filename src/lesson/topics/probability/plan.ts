// plan.ts: the practice walks through every sub-goal of secondary-t5-24-probability-concepts, in topic JSON order.
import type { SubgoalPlan } from '../../runtime/practice';

export const PLAN: readonly SubgoalPlan[] = [
  { id: 'probability-scale-0-1', title: 'From impossible to certain', families: ['scale'] },
  { id: 'sample-space-single-stage', title: 'List every outcome', families: ['space'] },
  { id: 'event-as-subset', title: 'The outcomes of an event', families: ['event'] },
  { id: 'equal-likelihood-assumption', title: 'Equally likely, or not?', families: ['equal'] },
  { id: 'experimental-relative-frequency', title: 'Probability from data', families: ['relFreq'] },
  { id: 'theoretical-uniform', title: 'Favorable over all outcomes', families: ['theory'] },
  { id: 'complete-model-sums-to-1', title: 'A model adds to 1', families: ['model'] },
  { id: 'complement', title: 'The chance it does not happen', families: ['complement'] },
  { id: 'probability-notation-forms', title: 'Fractions, decimals, percents', families: ['forms'] },
  { id: 'predict-expected-count', title: 'About how many times?', families: ['predict'] },
  { id: 'event-probability-nonuniform', title: 'Unequal outcomes: add them', families: ['nonUniform'] },
  { id: 'batch-variation', title: 'Why batches differ', families: ['batches'] },
  { id: 'long-run-stabilization', title: 'Settling in the long run', families: ['longRun'] },
  { id: 'no-due-outcomes', title: 'Nothing is ever due', families: ['streak'] },
  { id: 'model-data-discrepancy', title: 'Chance, or a wrong model?', families: ['discrepancy'] },
  { id: 'simulate-compound-event', title: 'Simulate with random digits', families: ['simDigits'] },
  { id: 'compound-sample-space', title: 'Outcomes of several stages', families: ['compoundSpace'] },
  { id: 'compound-theoretical-probability', title: 'Probability of a compound event', families: ['compoundP'] },
  { id: 'design-simulation', title: 'Design a simulation', families: ['designSim'] },
  { id: 'compound-predict-and-compare', title: 'Predict and compare', families: ['compoundPredict'] },
];
