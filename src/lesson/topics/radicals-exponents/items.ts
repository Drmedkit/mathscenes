// items.ts: practice families for "Radicals and rational exponents" (secondary-t6-03). Every family is generated
// from the sub-goal's cases, checked exactly, and every wrong answer the classifier recognises carries its catalogue
// id (math-curriculum-essentials/misconceptions.json). The families live in fam1.ts (roots, rational exponents, the
// exponent laws), fam2.ts (radical arithmetic, rationalizing, choosing a form) and fam3.ts (the real-number
// conditions: negative bases, domains, |x|, law validity, context). Pictures: ladder (ExpLadder), tiles (RootTiles),
// dom (a Plane graph in the replay), chain (the flawed chain on a slate). Pure: no DOM.
import type { Gen } from './common';
import * as F1 from './fam1';
import * as F2 from './fam2';
import * as F3 from './fam3';

export { MC, type RXItem, type LadderPic, type TilesPic, type DomPic } from './common';

const FAMILIES: { id: string; name: string; gen: Gen }[] = [
  { id: 'rootEval', name: 'Evaluate a root', gen: F1.rootEval },
  { id: 'rootReal', name: 'Real or not?', gen: F1.rootReal },
  { id: 'unitEval', name: 'A unit-fraction exponent', gen: F1.unitEval },
  { id: 'unitForm', name: 'Which root is it?', gen: F1.unitForm },
  { id: 'unitWhy', name: 'Why a^(1/n) is a root', gen: F1.unitWhy },
  { id: 'mnEval', name: 'Evaluate a^(m/n)', gen: F1.mnEval },
  { id: 'mnForm', name: 'Radical form and power form', gen: F1.mnForm },
  { id: 'negEval', name: 'A negative or decimal exponent', gen: F1.negEval },
  { id: 'negForm', name: 'Reciprocal of a root', gen: F1.negForm },
  { id: 'toExp', name: 'The whole radicand is the base', gen: F1.toExp },
  { id: 'prodExp', name: 'Multiply: add the exponents', gen: F1.prodExp },
  { id: 'prodCoef', name: 'Multiply with coefficients', gen: F1.prodCoef },
  { id: 'prodNum', name: 'Join the hops', gen: F1.prodNum },
  { id: 'quotExp', name: 'Divide: subtract the exponents', gen: F1.quotExp },
  { id: 'quotNum', name: 'Divide two powers of a number', gen: F1.quotNum },
  { id: 'powPow', name: 'Power of a power', gen: F1.powPow },
  { id: 'powPowNum', name: 'Power of a power, with numbers', gen: F1.powPowNum },
  { id: 'prodPow', name: 'Power of a product', gen: F1.prodPow },
  { id: 'coefOut', name: 'Take the root of the coefficient', gen: F1.coefOut },
  { id: 'radProd', name: 'Multiply radicals', gen: F2.radProd },
  { id: 'sumVsProd', name: 'Root of a sum or of a product?', gen: F2.sumVsProd },
  { id: 'radQuot', name: 'Divide radicals', gen: F2.radQuot },
  { id: 'radQuotForm', name: 'The quotient property and its conditions', gen: F2.radQuotForm },
  { id: 'simplifyRoot', name: 'Simplest radical form', gen: F2.simplifyRoot },
  { id: 'simplestPick', name: 'Which form is simplest?', gen: F2.simplestPick },
  { id: 'varExtract', name: 'Radicals with variables', gen: F2.varExtract },
  { id: 'varPower', name: 'Groups of the index', gen: F2.varPower },
  { id: 'likeAdd', name: 'Add like radicals', gen: F2.likeAdd },
  { id: 'likeWhich', name: 'Like or unlike?', gen: F2.likeWhich },
  { id: 'monoMono', name: 'Multiply radical monomials', gen: F2.monoMono },
  { id: 'monoSum', name: 'Distribute a radical', gen: F2.monoSum },
  { id: 'binProd', name: 'Multiply two binomials', gen: F2.binProd },
  { id: 'conjProd', name: 'Conjugate products', gen: F2.conjProd },
  { id: 'ratMono', name: 'Rationalize a denominator', gen: F2.ratMono },
  { id: 'ratFactor', name: 'Which form of 1?', gen: F2.ratFactor },
  { id: 'varLike', name: 'Combine variable radicals', gen: F2.varLike },
  { id: 'varMulDiv', name: 'Multiply and divide variable radicals', gen: F2.varMulDiv },
  { id: 'ratBin', name: 'Rationalize with the conjugate', gen: F2.ratBin },
  { id: 'conjPick', name: 'Pick the conjugate', gen: F2.conjPick },
  { id: 'calcKeys', name: 'Calculator keystrokes', gen: F2.calcKeys },
  { id: 'estimate', name: 'Sanity-check a root', gen: F2.estimate },
  { id: 'combineForm', name: 'One radical from two', gen: F2.combineForm },
  { id: 'negBaseReal', name: 'Powers of a negative base', gen: F3.negBaseReal },
  { id: 'minusParen', name: 'Where is the minus sign?', gen: F3.minusParen },
  { id: 'domLin', name: 'Domain of an even root', gen: F3.domLin },
  { id: 'domKind', name: 'Which roots restrict the input?', gen: F3.domKind },
  { id: 'domDen', name: 'A root in the denominator', gen: F3.domDen },
  { id: 'allowedInput', name: 'Is this input allowed?', gen: F3.allowedInput },
  { id: 'domPow', name: 'Domain of x^(m/n)', gen: F3.domPow },
  { id: 'domPowLin', name: 'Domain of a shifted power', gen: F3.domPowLin },
  { id: 'absRoot', name: 'Even roots and |x|', gen: F3.absRoot },
  { id: 'absCheck', name: 'Check with a negative x', gen: F3.absCheck },
  { id: 'flawStep', name: 'Find the broken step', gen: F3.flawStep },
  { id: 'lawHolds', name: 'True for every x?', gen: F3.lawHolds },
  { id: 'keepDomain', name: 'Keep the restriction', gen: F3.keepDomain },
  { id: 'samePair', name: 'Where do they differ?', gen: F3.samePair },
  { id: 'ctxDomain', name: 'Domain in a context', gen: F3.ctxDomain },
  { id: 'ctxOverlap', name: 'Both bounds at once', gen: F3.ctxOverlap },
];
export const GENERATORS: Record<string, Gen> = Object.fromEntries(FAMILIES.map(f => [f.id, f.gen]));
export const FAMILY_NAMES: Record<string, string> = Object.fromEntries(FAMILIES.map(f => [f.id, f.name]));
