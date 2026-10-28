// plan.ts: practice walks through every sub-goal of secondary.triangle-side-angle-relationships-isosceles-theorems-side-an,
// in topic JSON order, each with the families that practise it.
import type { SubgoalPlan } from '../../runtime/practice';

export const PLAN: readonly SubgoalPlan[] = [
  { id: 's1-isosceles-base-angles', title: 'Equal sides face equal angles', families: ['baseAnglePick', 'isoStatement'] },
  { id: 's1-isosceles-converse', title: 'Equal angles face equal sides (the converse)', families: ['converseSides', 'converseClaim'] },
  { id: 's1-side-angle-order', title: 'Longest side, largest angle', families: ['orderAngles', 'orderSides', 'orderRatio'] },
  { id: 's1-triangle-construction-check', title: 'The compass check', families: ['arcsCheck', 'arcsSetup'] },
  { id: 's1-triangle-existence', title: 'Can three lengths make a triangle?', families: ['existCheck', 'whichSet', 'oneCheck'] },
  { id: 's2-isosceles-unknowns', title: 'Unknowns in isosceles triangles', families: ['isoAngle', 'isoSides', 'isoAlgebra'] },
  { id: 's2-triangle-inequality-range', title: 'The range of a third side', families: ['rangePair', 'rangeCount', 'rangePick'] },
  { id: 's3-angle-sum-proof', title: 'Prove the angle sum', families: ['sumReason', 'sumAux', 'sumWhy'] },
  { id: 's3-isosceles-proof', title: 'Prove the isosceles theorem', families: ['isoProofReason', 'isoProofCorr', 'isoProofEarly'] },
  { id: 's3-isosceles-converse-proof', title: 'Prove the converse on its own', families: ['convProofReason', 'convProofWhy'] },
  { id: 's3-exterior-angle-sum-proof', title: 'Exterior angles total 360°', families: ['extMissing', 'extAlgebra', 'extProof'] },
  { id: 's3-triangle-inequality-proof', title: 'Prove the triangle inequality', families: ['ineqProofReason', 'ineqBoundary', 'ineqAlgebra'] },
];
