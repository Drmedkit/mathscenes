// plan.ts: practice walks through every sub-goal of secondary-t5-37-angle-relationships-in-parallel-lines-and-triangles,
// in topic JSON order. Each sub-goal has a short kid-friendly title and the families that practise it (items.ts);
// a family that serves several sub-goals reads the sub-goal id and uses that sub-goal's cases.
import type { SubgoalPlan } from '../../runtime/practice';

export const PLAN: readonly SubgoalPlan[] = [
  { id: 'transversal-configuration', title: 'Read a transversal figure', families: ['tcWhere', 'tcWhichTrans'] },
  { id: 'corresponding-position', title: 'Spot corresponding angles', families: ['findPartner', 'pairName'] },
  { id: 'corresponding-congruent-if-parallel', title: 'Corresponding angles at parallel lines', families: ['pairValue', 'classify'] },
  { id: 'alternate-position', title: 'Spot alternate angles', families: ['findPartner', 'pairName'] },
  { id: 'alternate-congruent-if-parallel', title: 'Alternate angles at parallel lines', families: ['pairValue', 'classify'] },
  { id: 'same-side-interior-position', title: 'Spot same-side interior angles', families: ['findPartner', 'pairName'] },
  { id: 'same-side-supplementary', title: 'Same-side interior angles add to 180°', families: ['pairValue', 'ssRight'] },
  { id: 'classify-pair-relation', title: 'Equal, 180°, both, or can’t tell', families: ['classify', 'needsParallel'] },
  { id: 'triangle-angle-sum', title: 'A triangle’s angles add to 180°', families: ['triSum', 'third'] },
  { id: 'exterior-angle-identify', title: 'Spot an exterior angle', families: ['extFind', 'extName'] },
  { id: 'exterior-angle-remote-sum', title: 'Exterior angle = the two remote angles', families: ['extRemote', 'extWrite'] },
  { id: 'missing-angle-parallel-one-step', title: 'One step with parallel lines', families: ['pairValue', 'allEight'] },
  { id: 'triangle-third-angle', title: 'The third angle of a triangle', families: ['third', 'thirdRight'] },
  { id: 'isosceles-marked-angles', title: 'Matching arcs in a triangle', families: ['isoBase', 'isoApex'] },
  { id: 'exterior-angle-missing', title: 'Missing angles with an exterior angle', families: ['extValue', 'extRemoteMissing'] },
  { id: 'polygon-angle-sum', title: 'Polygon angle sum', families: ['polyTriangles', 'polySum', 'polySides'] },
  { id: 'regular-polygon-interior-angle', title: 'Angles of regular polygons', families: ['regAngle', 'regSides', 'regNot'] },
  { id: 'multi-step-chain', title: 'Two steps in a row', families: ['chainTri', 'chainExt', 'zigzag'] },
  { id: 'angle-expressions-equation', title: 'Angles as expressions', families: ['exprPair', 'exprTri'] },
  { id: 'polygon-angle-equations', title: 'Polygon equations', families: ['polyExpr', 'polySides'] },
  { id: 'justify-step-with-condition', title: 'Give the reason and its condition', families: ['reasonPick', 'findBadStep'] },
  { id: 'justify-angle-sum-equation', title: 'Which angles make the sum?', families: ['sumCheck', 'findBadStep'] },
  { id: 'rigid-motion-argument', title: 'Why the angles match: slides and turns', families: ['motionPick', 'critique'] },
  { id: 'triangle-sum-argument', title: 'Why a triangle makes 180°', families: ['triArgReason', 'critique'] },
  { id: 'exterior-angle-argument', title: 'Why the exterior angle works', families: ['extArgGeneral', 'critique'] },
];
