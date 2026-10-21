// plan.ts: the practice walks through every sub-goal of secondary.draw-triangles-from-given-conditions, in topic
// JSON order; each sub-goal names the families that practise it (items.ts).
import type { SubgoalPlan } from '../../runtime/practice';

export const PLAN: readonly SubgoalPlan[] = [
  { id: 'condition-set', title: 'List the givens', families: ['sketch', 'included', 'invent'] },
  { id: 'draw-given-length', title: 'Draw a length with a ruler', families: ['segLen', 'endMark'] },
  { id: 'draw-triangle-sas', title: 'Two sides and the angle between', families: ['sasWhere', 'protractor'] },
  { id: 'draw-triangle-asa', title: 'A side and its two end angles', families: ['asaRays', 'asaWhere'] },
  { id: 'compass-transfer', title: 'Carry a length with a compass', families: ['compassCopy', 'compassOpen'] },
  { id: 'draw-triangle-sss', title: 'Three sides with arcs', families: ['sssNext', 'sssPoint'] },
  { id: 'tolerance-audit', title: 'Check every condition', families: ['audit'] },
  { id: 'triangle-existence', title: 'Do three sides close up?', families: ['exists', 'thirdSide'] },
  { id: 'angle-sum-investigate', title: 'The angles add to 180°', families: ['thirdAngle', 'sumCheck'] },
  { id: 'side-angle-order', title: 'Longest side, largest angle', families: ['longest', 'ratio'] },
  { id: 'triangle-uniqueness', title: 'None, one or many?', families: ['howMany', 'flipped'] },
];
