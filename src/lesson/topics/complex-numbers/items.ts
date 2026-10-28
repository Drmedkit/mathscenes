// items.ts: the practice families of "Complex numbers" (fam1 stage 1, fam2 stage 2, fam3 stage 3) and their names.
import type { Gen } from './common';
import { FAM1 } from './fam1';
import { FAM2 } from './fam2';
import { FAM3 } from './fam3';

export { MC, type CxItem, type CxPicture } from './common';
export const GENERATORS: Record<string, Gen> = { ...FAM1, ...FAM2, ...FAM3 };
export const FAMILY_NAMES: Record<string, string> = {
  squareSign: 'Square it', whyNoReal: 'Why i is new', sqrtNeg: 'Root of a negative', rootContrast: 'One root or two numbers',
  sqrtNonPerfect: 'Simplify the root', nonPerfectCoef: 'The number in front', readParts: 'Real and imaginary parts',
  planeRead: 'Read the plane', stdFormPick: 'a + bi form', classify: 'Where does it belong?', setTruth: 'Reals inside complex',
  whichEqual: 'Equal numbers', solveEqual: 'Match the parts', addPair: 'Add', fracAddSub: 'Add and subtract with fractions',
  propertyName: 'Name the property', subPair: 'Subtract', monoProduct: 'Times i', scaleDistribute: 'Distribute',
  rotateByI: 'A quarter turn', binProduct: 'Multiply', squareComplex: 'Square it', radProduct: 'Roots of negatives',
  radTrapChoice: 'The root trap', iPower: 'Powers of i', iPowerSum: 'Sums of powers of i', conjPair: 'Conjugate',
  conjPlane: 'Conjugate on the plane', conjProduct: 'Times its conjugate', sumSquaresPick: 'Which product?',
  distance: 'Distance from 0', divReal: 'Divide by a real number', divRealFrac: 'Divide: exact fractions',
  divI: 'Divide by an imaginary number', divIRotate: 'Divide by i on the plane', divComplex: 'Divide',
  divSteps: 'How to divide', findError: 'Find the invalid step', nameRule: 'Name the broken rule',
  finishWork: 'Finish or fix the work', conjProofStep: 'Prove z · z̄ = a² + b²', alwaysSometimes: 'Always, sometimes, never',
  checkProduct: 'Multiply back', verifyQuot: 'Does it check?', whyConj: 'Why the conjugate works', newDenominator: 'The new denominator',
};
