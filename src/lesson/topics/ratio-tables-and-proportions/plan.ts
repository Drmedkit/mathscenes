// plan.ts: the practice walks through every sub-goal of primary.measurement.relationships-between-quantities, in topic
// JSON order. Each sub-goal names the families that practise it; a generator gets the sub-goal id and uses its ranges.
import type { SubgoalPlan } from '../../runtime/practice';

export const PLAN: readonly SubgoalPlan[] = [
  { id: 'paired-observation', title: 'One pair, one row', families: ['pairUp'] },
  { id: 'constant-multiplier', title: 'The multiplier stays', families: ['timesAsMany', 'whatStays'] },
  { id: 'ratio-vs-difference', title: 'Times as many, or more?', families: ['ratioOrDiff'] },
  { id: 'fixed-start-nonexample', title: 'A fee is not proportional', families: ['situation', 'doubleIt'] },
  { id: 'inverse-nonexample', title: 'More of one, less of the other', families: ['situation', 'doubleIt'] },
  { id: 'constant-output-nonexample', title: 'Stays the same, and sorting', families: ['situation', 'doubleIt'] },
  { id: 'table-of-pairs', title: 'A labeled table of pairs', families: ['pairTable', 'labelTable'] },
  { id: 'build-up-rows', title: 'Build up the table', families: ['buildUp'] },
  { id: 'unit-row', title: 'The row for 1', families: ['unitRow', 'rateUnit'] },
  { id: 'intermediate-row', title: 'A row in between', families: ['midRow', 'canWeFind'] },
  { id: 'add-rows', title: 'Add two rows', families: ['addRows', 'feeRows'] },
  { id: 'subtract-rows', title: 'Subtract two rows', families: ['subRows'] },
  { id: 'choose-route', title: 'Choose a route', families: ['route'] },
  { id: 'compare-tables', title: 'Compare two ratios', families: ['compare'] },
  { id: 'test-every-pair', title: 'Test every pair', families: ['testTable'] },
  { id: 'zero-row', title: 'The row for 0', families: ['zeroRow'] },
  { id: 'justify-in-context', title: 'When can you predict?', families: ['predict'] },
  { id: 'rational-entry-tables', title: 'Cents, fractions, decimals', families: ['moneyRow', 'fracRate', 'moneyTest'] },
  { id: 'graph-through-origin', title: 'A line through 0', families: ['graphLine'] },
  { id: 'measurement-tolerance', title: 'Close enough?', families: ['tolerance'] },
];
