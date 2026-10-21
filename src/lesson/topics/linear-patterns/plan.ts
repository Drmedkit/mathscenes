// plan.ts: the practice walks through every sub-goal of primary.patterns.recognize-linear-relationship, in topic JSON
// order. Each sub-goal names the families that practise it; a generator gets the sub-goal id and uses its ranges.
import type { SubgoalPlan } from '../../runtime/practice';

export const PLAN: readonly SubgoalPlan[] = [
  { id: 'change-between-rows', title: 'Change from row to row', families: ['rowChange'] },
  { id: 'constant-or-not', title: 'Check every step', families: ['couldBeLinear'] },
  { id: 'constant-decrease-and-zero', title: 'Going down, or no change', families: ['couldBeLinear', 'rowChange'] },
  { id: 'equal-steps-larger-than-one', title: 'Steps of 2, 5 or 10', families: ['perUnit'] },
  { id: 'start-value', title: 'The start at input 0', families: ['startValue'] },
  { id: 'words-to-table', title: 'Words and tables', families: ['wordsToTable', 'tableToWords'] },
  { id: 'table-to-graph-line', title: 'Table to graph', families: ['plotPoint', 'graphMeaning'] },
  { id: 'change-on-graph', title: 'The change on a graph', families: ['graphChange'] },
  { id: 'graph-to-words', title: 'Graph to words', families: ['graphToWords'] },
  { id: 'compare-two-lines', title: 'Steeper, not higher', families: ['compareLines'] },
  { id: 'discrete-vs-continuous', title: 'Points or a line?', families: ['connectOrNot'] },
  { id: 'growing-differences', title: 'Changes that grow', families: ['lastChange', 'couldBeLinear'] },
  { id: 'other-nonconstant', title: 'Changes that shrink or jump', families: ['couldBeLinear', 'lastChange'] },
  { id: 'curve-vs-line', title: 'On one straight line?', families: ['onALine'] },
  { id: 'unequal-gaps', title: 'Uneven input steps', families: ['unequalGaps', 'gapRate'] },
  { id: 'classify-from-context', title: 'Linear from the words', families: ['contextLinear'] },
  { id: 'justify-with-changes', title: 'Give the evidence', families: ['bestReason'] },
  { id: 'table-could-be-linear', title: 'Could be, or must be?', families: ['couldOrMust'] },
  { id: 'far-prediction', title: 'Predict far ahead', families: ['farPredict'] },
];
