// plan.ts: practice walks through every sub-goal of primary.geometry.pythagorean-theorem-introduction, in topic JSON
// order. Each sub-goal names the families that practise it (items.ts); a generator gets the sub-goal id.
import type { SubgoalPlan } from '../../runtime/practice';

export const PLAN: readonly SubgoalPlan[] = [
  { id: 'name-legs-hypotenuse', title: 'Legs and hypotenuse', families: ['findHyp', 'letterC'] },
  { id: 'square-area-labels', title: 'The square on a side', families: ['squareArea', 'areaUnit'] },
  { id: 'tilted-square-area', title: 'Area of a tilted square', families: ['tilted', 'surroundCalc'] },
  { id: 'area-relation-right', title: 'a² + b² = c² as areas', families: ['missingArea', 'eqTrue', 'meaning'] },
  { id: 'relation-fails-nonright', title: 'Only for right triangles', families: ['nonRight', 'rightFirst'] },
  { id: 'side-from-area', title: 'A side from its area', families: ['exactSide', 'bracketRoot'] },
  { id: 'write-equation', title: 'Write the equation', families: ['writeEq'] },
  { id: 'hypotenuse-whole', title: 'Find the hypotenuse', families: ['hypWhole'] },
  { id: 'missing-leg', title: 'Find a missing leg', families: ['missingLeg', 'mixedSides'] },
  { id: 'irrational-exact-approx', title: 'Exact and to the tenth', families: ['exactRoot', 'roundTenth'] },
  { id: 'model-context', title: 'Find the right triangle', families: ['contextHyp', 'story'] },
  { id: 'unit-consistency', title: 'One unit first', families: ['mixedUnits', 'unitName'] },
  { id: 'substitution-check', title: 'Check by substituting', families: ['subCheck'] },
  { id: 'size-check', title: 'Is the size sensible?', families: ['sizeCheck'] },
  { id: 'rounding-aware-check', title: 'Check a rounded answer', families: ['roundCheck'] },
  { id: 'explain-proof', title: 'Why it is always true', families: ['proofStep'] },
];
