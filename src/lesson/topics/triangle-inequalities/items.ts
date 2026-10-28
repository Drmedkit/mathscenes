// items.ts: practice families for "Isosceles triangles and side-angle order"
// (secondary.triangle-side-angle-relationships-isosceles-theorems-side-an, 12 sub-goals). famA: stage 1 (the
// isosceles theorem and its converse, side-angle order, the compass check, the triangle-inequality test); famB:
// stage 2 (isosceles unknowns, third-side ranges); famC: stage 3 (the proofs and their use). Every figure is exact,
// every choice item has exactly one right choice, every recognised slip carries its catalogue id.
import type { Gen } from './tkit';
import { arcsCheck, arcsSetup, baseAnglePick, converseClaim, converseSides, existCheck, isoStatement, oneCheck, orderAngles, orderRatio, orderSides, whichSet } from './famA';
import { isoAlgebra, isoAngle, isoSides, rangeCount, rangePair, rangePick } from './famB';
import { convProofReason, convProofWhy, extAlgebra, extMissing, extProof, ineqAlgebra, ineqBoundary, ineqProofReason, isoProofCorr, isoProofEarly, isoProofReason, sumAux, sumReason, sumWhy } from './famC';

export type { TIItem, TIPicture } from './tkit';

export const GENERATORS: Record<string, Gen> = {
  baseAnglePick, isoStatement, converseSides, converseClaim, orderAngles, orderSides, orderRatio, arcsCheck, arcsSetup,
  existCheck, whichSet, oneCheck,
  isoAngle, isoSides, isoAlgebra, rangePair, rangeCount, rangePick,
  sumReason, sumAux, sumWhy, isoProofReason, isoProofCorr, isoProofEarly, convProofReason, convProofWhy,
  extMissing, extAlgebra, extProof, ineqProofReason, ineqBoundary, ineqAlgebra,
};

export const FAMILY_NAMES: Record<string, string> = {
  baseAnglePick: 'Equal sides, equal angles', isoStatement: 'The isosceles theorem', converseSides: 'Equal angles, equal sides',
  converseClaim: 'A converse on its own', orderAngles: 'Angles from the sides', orderSides: 'Sides from the angles',
  orderRatio: 'Order, not ratio', arcsCheck: 'The compass check', arcsSetup: 'Setting up the arcs', existCheck: 'Triangle or not?',
  whichSet: 'Which set works?', oneCheck: 'The one check', isoAngle: 'Isosceles angles', isoSides: 'Isosceles sides',
  isoAlgebra: 'Isosceles with x', rangePair: 'Range of the third side', rangeCount: 'Whole-number third sides',
  rangePick: 'Possible third sides', sumReason: 'Angle-sum proof', sumAux: 'The auxiliary parallel', sumWhy: 'Evidence or proof?',
  isoProofReason: 'Isosceles proof', isoProofCorr: 'The mirror correspondence', isoProofEarly: 'Fix the proof',
  convProofReason: 'Converse proof', convProofWhy: 'Why the converse needs a proof', extMissing: 'Exterior angles total 360°',
  extAlgebra: 'Exterior angles with x', extProof: 'Why 360°?', ineqProofReason: 'Triangle-inequality proof',
  ineqBoundary: 'The collinear case', ineqAlgebra: 'Third side with x',
};
