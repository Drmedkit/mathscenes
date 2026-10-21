// plan.ts: the practice walk-through, one entry per sub-goal of secondary-t5-16-proportional-relationships in topic
// JSON order, with the families that practise it (the generator gets the sub-goal id and makes that sub-goal's cases).
import type { SubgoalPlan } from '../../runtime/practice';
import type { FamilyId } from './items';

interface Plan extends SubgoalPlan { families: FamilyId[] }
export const PLAN: Plan[] = [
  { id: 'table-test', title: 'The table test: one rate in every row', families: ['tableTest', 'rowRate'] },
  { id: 'zero-input', title: 'A row with 0: multiply, don’t divide', families: ['zeroRow'] },
  { id: 'situation-test', title: 'Is the situation proportional?', families: ['situation'] },
  { id: 'name-k-direction', title: 'Find k, the right way round', families: ['nameK'] },
  { id: 'write-equation', title: 'Write y = kx', families: ['writeEq'] },
  { id: 'graph-ray', title: 'Graph it: a ray from (0, 0)', families: ['plotPoint', 'readScale'] },
  { id: 'graph-domain', title: 'Ray, segment or points', families: ['domain'] },
  { id: 'graph-test', title: 'Straight AND through (0, 0)', families: ['graphTest'] },
  { id: 'interpret-point', title: 'What a point says', families: ['interpret'] },
  { id: 'k-from-graph', title: 'Read k from a graph', families: ['kGraph'] },
  { id: 'translate-check', title: 'The same k in every form', families: ['translate', 'writeEq'] },
  { id: 'ratio-counterexample', title: 'One row breaks it', families: ['counterRatio'] },
  { id: 'starting-amount-counterexample', title: 'A starting amount breaks it', families: ['fixedFee'] },
  { id: 'changing-rate-counterexample', title: 'A changing rate breaks it', families: ['changingRate'] },
  { id: 'premise-counterexample', title: 'Build a counterexample', families: ['buildCounter'] },
  { id: 'apply-model', title: 'Use the rate, when it applies', families: ['applyModel'] },
  { id: 'evidence-vs-guarantee', title: 'Proven, refuted, or only consistent', families: ['evidence', 'graphTest', 'tableTest', 'situation'] },
];
