// plan.ts: practice walks through every sub-goal of secondary-t5-38-pythagorean-theorem, in topic JSON order.
// Each sub-goal: a short kid-friendly title and the families that practise it (items.ts; a family that serves two
// sub-goals uses the number ranges of the one it is called for).
import type { SubgoalPlan } from '../../runtime/practice';

export const PLAN: readonly SubgoalPlan[] = [
  { id: 'identify-hyp-legs', title: 'Legs and hypotenuse, any way round', families: ['hypOpp', 'embedded'] },
  { id: 'tilted-square-area', title: 'The area of a tilted square', families: ['tiltArea', 'tiltSteps'] },
  { id: 'area-relationship', title: 'Leg squares fill the hypotenuse square', families: ['missingSq', 'unitsAreas'] },
  { id: 'symbolic-equation', title: 'Write the equation for any labels', families: ['writeEq', 'legOrHyp'] },
  { id: 'right-triangles-only', title: 'Only for right triangles', families: ['holdsOrNot', 'counterEx'] },
  { id: 'find-hypotenuse', title: 'Find the hypotenuse', families: ['hyp', 'rootFinish'] },
  { id: 'find-leg', title: 'Find a missing leg', families: ['leg', 'legOrHyp'] },
  { id: 'decimal-sides', title: 'Decimal sides', families: ['hyp', 'leg'] },
  { id: 'approximate-root', title: 'A root to the nearest tenth', families: ['bracketRt', 'tenthRt', 'squareCheck'] },
  { id: 'irrational-lengths', title: 'Exact and rounded lengths', families: ['exactLen', 'lenTenth', 'squareCheck'] },
  { id: 'converse-test', title: 'The converse: is it right?', families: ['isRight', 'whereRight'] },
  { id: 'model-2d-context', title: 'Right triangles in real life', families: ['story', 'whichTri'] },
  { id: 'coordinate-distance', title: 'Distance on the coordinate plane', families: ['dist', 'distLegs'] },
  { id: 'prism-perpendicularity', title: 'Right angles inside a box', families: ['perp3d', 'whichTri3d'] },
  { id: 'locate-3d-triangle', title: 'Find the triangle in the box', families: ['whichTri3d', 'faceOrSpace'] },
  { id: 'chain-3d', title: 'The space diagonal: two triangles', families: ['spaceDiag', 'keepExact'] },
  { id: 'critique-hypotenuse-assignment', title: 'Spot the wrong hypotenuse', families: ['findError', 'sizeCheck'] },
  { id: 'insufficient-information', title: 'Is the right angle given?', families: ['enough', 'deckBrace'] },
  { id: 'disprove-right-angle', title: 'Prove a triangle is not right', families: ['refute', 'isRight'] },
  { id: 'inner-square-justification', title: 'Why the pieces are squares', families: ['whySquare', 'innerAngle'] },
  { id: 'dissection-area-argument', title: 'The proof by rearranging', families: ['equalRemainders', 'proofLogic'] },
  { id: 'converse-proof', title: 'Why the converse is true', families: ['converseStep', 'converseWhy'] },
];
