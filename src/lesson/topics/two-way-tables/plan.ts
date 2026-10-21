// plan.ts: practice walks through every sub-goal of us.statistics.two-way-tables-relative-frequencies-and-segmented-bar-graphs,
// in topic JSON order. Each sub-goal names the families that practise it (items.ts); 35 families in all.
import type { SubgoalPlan } from '../../runtime/practice';

export const PLAN: readonly SubgoalPlan[] = [
  { id: 'conditional-both-directions', title: 'Of a row or of a column?', families: ['rowPct', 'colPct', 'matchQuestion'] },
  { id: 'joint-relative-frequency', title: 'Joint: a cell of everybody', families: ['jointPct', 'jointRound'] },
  { id: 'marginal-relative-frequency', title: 'Marginal: a total of everybody', families: ['marginalPct', 'marginalFromJoint', 'weightedTrap'] },
  { id: 'name-the-whole', title: 'Name the whole', families: ['nameType', 'nameWhole'] },
  { id: 'conditional-from-joint', title: 'Conditional from a joint table', families: ['condFromJoint', 'countUnknown'] },
  { id: 'segmented-bar-construct', title: 'Build a segmented bar graph', families: ['barSegment', 'pickGraph'] },
  { id: 'segmented-bar-read', title: 'Read a segmented bar graph', families: ['readSeg', 'readSentence'] },
  { id: 'segmented-bar-limits', title: 'What 100% bars hide', families: ['moreWho', 'countFromBar'] },
  { id: 'association-compare-distributions', title: 'Is there an association?', families: ['assocTable', 'pointsDiff', 'assocBars'] },
  { id: 'tree-joint', title: 'Trees: branch times branch', families: ['treeLeaf', 'treeMissing'] },
  { id: 'complete-rf-table', title: 'Complete the table', families: ['fillCell', 'fromConditional'] },
  { id: 'screening-test-frequencies', title: 'Screening tests', families: ['screenWord', 'screenPPV'] },
  { id: 'relative-frequency-as-probability', title: 'Chance from a table', families: ['chanceAll', 'chanceGroup', 'chanceWho'] },
  { id: 'association-not-causation', title: 'Association is not cause', families: ['rewriteClaim', 'confounder'] },
  { id: 'categorical-problems-mixed', title: 'Mixed problems', families: ['combineGroups', 'pieAngle', 'rawCountClaim'] },
];
