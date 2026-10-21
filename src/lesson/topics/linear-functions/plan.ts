// plan.ts: practice walks through every sub-goal of secondary-t5-33-linear-functions-and-slope-intercept-form, in
// topic JSON order. Each sub-goal names the families that practise it; a generator gets the sub-goal id and uses that
// sub-goal's number ranges and variants (items.ts). Some families serve two sub-goals with different variants.
import type { SubgoalPlan } from '../../runtime/practice';

export const PLAN: readonly SubgoalPlan[] = [
  { id: 'rate-unit-steps', title: 'Change per one unit', families: ['tableRate', 'fasterLine'] },
  { id: 'initial-value-at-zero', title: 'The output at input 0', families: ['startTable', 'startGraph'] },
  { id: 'rate-uneven-steps', title: 'Steps bigger than 1', families: ['tableRate', 'scaledRate'] },
  { id: 'extrapolate-initial-value', title: 'Work back to input 0', families: ['startTable', 'startGraph'] },
  { id: 'verbal-rate-interpretation', title: 'Say the rate in words', families: ['rateSentence', 'rateUnit'] },
  { id: 'identify-m-b-in-equation', title: 'Spot m and b', families: ['pickMB', 'sameFunction'] },
  { id: 'parameter-effects-on-graph', title: 'What m and b do to the line', families: ['whatChanged', 'predictShift', 'fasterLine'] },
  { id: 'write-from-description', title: 'From a story to y = mx + b', families: ['storyToEq', 'storyPair'] },
  { id: 'slope-two-points', title: 'Slope from two points', families: ['twoPointRate', 'specialSlope'] },
  { id: 'linearity-check', title: 'Linear or not?', families: ['isLinear', 'fitsRule'] },
  { id: 'back-solve-b', title: 'Find b from a point', families: ['backSolve', 'startGraph'] },
  { id: 'equation-from-two-points', title: 'Equation from two points', families: ['eqTwoPoints', 'eqFromTable', 'graphToEq'] },
  { id: 'graph-from-points', title: 'The line is all solutions', families: ['onTheLine', 'plotPoint'] },
  { id: 'graph-slope-step', title: 'Start at b, step by m', families: ['slopeStep', 'whichGraph'] },
  { id: 'equation-from-graph', title: 'From a graph to an equation', families: ['graphToEq', 'whichGraph'] },
  { id: 'non-unit-scales', title: 'Axes that count by 5s and 20s', families: ['scaledRate', 'scaledRead'] },
  { id: 'contextual-axes', title: 'Scale and label the axes', families: ['chooseScale', 'scaledRead', 'dotsOrLine'] },
  { id: 'slope-units', title: 'The unit of the slope', families: ['rateUnit', 'refuteClaim'] },
  { id: 'slope-units-conversion', title: 'Change the rate’s units', families: ['convertRate', 'rewriteEq'] },
  { id: 'intercept-units', title: 'The unit of b', families: ['interceptMeaning', 'rateUnit'] },
  { id: 'proportional-contrast', title: 'Linear but not proportional', families: ['isProportional', 'doubleInput'] },
  { id: 'evidence-justification', title: 'Prove what m and b mean', families: ['whichEvidence', 'refuteClaim'] },
  { id: 'meaningful-domain', title: 'Inputs that make sense', families: ['validInputs', 'interceptMeaning', 'dotsOrLine'] },
  { id: 'qualified-prediction', title: 'Predict, and say where it holds', families: ['predict', 'predictValid'] },
];
