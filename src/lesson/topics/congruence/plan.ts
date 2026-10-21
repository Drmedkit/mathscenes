// plan.ts: the practice walks through every sub-goal of secondary-t5-35-congruence-via-transformations, in topic JSON order.
import type { SubgoalPlan } from '../../runtime/practice';

export const PLAN: readonly SubgoalPlan[] = [
  { id: 'congruence-definition', title: 'Can the tracing cover it?', families: ['cover'] },
  { id: 'correspondence', title: 'Partner corners', families: ['partner'] },
  { id: 'rule-out-by-invariant', title: 'Rule it out with lengths or angles', families: ['invariant'] },
  { id: 'vertex-orientation', title: 'Which way round?', families: ['orient'] },
  { id: 'motion-type-by-orientation', title: 'Slide, turn or flip?', families: ['whichMove'] },
  { id: 'specify-single-motion', title: 'Name the move exactly', families: ['specify'] },
  { id: 'execute-given-sequence', title: 'Two moves in a row', families: ['sequence'] },
  { id: 'order-dependence', title: 'Does the order matter?', families: ['order'] },
  { id: 'verify-whole-figure', title: 'Check every corner', families: ['verify'] },
  { id: 'plan-sequence', title: 'Plan the moves', families: ['plan'] },
  { id: 'fix-mirror-placement', title: 'Finish with a flip', families: ['finish'] },
  { id: 'equivalent-sequences', title: 'More than one right sequence', families: ['twoWays'] },
  { id: 'reverse-sequence', title: 'Move it back', families: ['undo'] },
  { id: 'dilation-not-rigid', title: 'A dilation is not rigid', families: ['dilate'] },
  { id: 'identity-dilation', title: 'Scale factor 1', families: ['identity'] },
  { id: 'transformation-properties-table', title: 'The summary table', families: ['table'] },
  { id: 'rule-length-test', title: 'Is the rule rigid?', families: ['rule'] },
  { id: 'justify-congruence-claim', title: 'Justify a congruence claim', families: ['justify'] },
];
