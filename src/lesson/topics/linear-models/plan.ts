// plan.ts: practice walks through every sub-goal of secondary-t6-32-writing-linear-equations-from-context, in topic JSON order.
import type { SubgoalPlan } from '../../runtime/practice';

export const PLAN: readonly SubgoalPlan[] = [
  { id: 's1-linear-criterion', title: 'Linear or not: a constant change per unit', families: ['isLinearStory', 'unevenTable'] },
  { id: 's1-initial-value', title: 'The initial value: the output at input 0', families: ['startValue', 'startGraph'] },
  { id: 's1-proportional-contrast', title: 'Proportional or just linear', families: ['propOrNot', 'doubleTest'] },
  { id: 's1-interpret-rate-units', title: 'The rate and the start in words, with units', families: ['rateWords', 'bothNumbers'] },
  { id: 's2-define-variables', title: 'Define the variables: quantity, unit, what 0 means', families: ['defineVars', 'restartClock'] },
  { id: 's2-equation-given-parameters', title: 'Write y = mx + b from a rate and a start', families: ['buildModel', 'modelPair'] },
  { id: 's2-negative-rate', title: 'Decreasing stories: a negative rate', families: ['drainModel', 'buildModel'] },
  { id: 's2-rate-from-two-points', title: 'The rate from two data points', families: ['rateTwoPoints', 'rateTable'] },
  { id: 's2-back-solve-start', title: 'Walk back to an unstated start', families: ['backStart', 'twoPointModel'] },
  { id: 's2-unit-check', title: 'Check a model by units and a data point', families: ['unitCheck', 'pointCheck'] },
  { id: 's2-target-equation', title: 'An exact target: one equation in x', families: ['targetEq', 'targetValue'] },
  { id: 's2-threshold-inequality', title: 'A limit in words: one inequality in x', families: ['phraseIneq', 'budgetIneq'] },
  { id: 's3-discrete-continuous', title: 'Whole numbers or any amount?', families: ['discreteOrNot', 'graphForm'] },
  { id: 's3-context-bounds', title: 'Bounds that make sense in the story', families: ['boundIneq', 'emptyTime'] },
  { id: 's3-feasible-set', title: 'Feasible: every restriction at once', families: ['feasible', 'feasibleMax'] },
  { id: 's3-boundary-direction', title: 'Round in the direction the limit needs', families: ['wholeBoundary', 'boundaryWhy'] },
  { id: 's3-exact-no-solution', title: 'Exact targets a count cannot hit', families: ['exactOrNot', 'reachable'] },
  { id: 's3-validity-justify', title: 'Justify where the model is valid', families: ['validInterval', 'extrapolate'] },
];
