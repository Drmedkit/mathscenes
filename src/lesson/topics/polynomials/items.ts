// items.ts: the practice families of "Polynomial expressions" (secondary-t6-04, Algebra 1). Every family is generated
// from its sub-goal's cases, checked exactly (poly.ts), and every wrong answer the classifier recognises carries its
// catalogue id (common.ts MC). Families: fam1 (reading a polynomial), fam2 (operating), fam3 (reasoning, context).
// Pictures (item.picture): box (ProductBox: partial products), shelf (DegreeShelf: terms by power), chain (a
// numbered rewrite on a slate). Pure: no DOM.
import type { Gen } from './common';
import * as F1 from './fam1';
import * as F2 from './fam2';
import * as F3 from './fam3';
export { MC, type PolyItem, type PolyPicture, type BoxPic, type ShelfPic, type ChainPic } from './common';

export const GENERATORS: Record<string, Gen> = {
  powerRead: F1.powerRead, powerEval: F1.powerEval,
  isPoly: F1.isPoly, notPoly: F1.notPoly,
  countTerms: F1.countTerms, whichTerms: F1.whichTerms,
  coefOf: F1.coefOf, coefPick: F1.coefPick,
  termDegree: F1.termDegree, degreeHigh: F1.degreeHigh,
  polyDegree: F1.polyDegree, degreeCh: F1.degreeCh,
  termName: F1.termName, degreeName: F1.degreeName, fullName: F1.fullName,
  stdForm: F1.stdForm, leadCoef: F1.leadCoef,
  mvDegree: F1.mvDegree, mvHigh: F1.mvHigh,
  likePick: F2.likePick, likeCount: F2.likeCount,
  mvLike: F2.mvLike, mvPair: F2.mvPair,
  collect: F2.collectFam, collectCoef: F2.collectCoef, collectName: F2.collectName,
  addPoly: F2.addPoly, addVertical: F2.addVertical,
  opposite: F2.opposite, oppositeCoef: F2.oppositeCoef,
  subPoly: F2.subPoly, subCoef: F2.subCoef,
  monoMul: F2.monoMul, monoMulPair: F2.monoMulPair,
  monoPoly: F2.monoPoly, monoPolyCoef: F2.monoPolyCoef,
  binBin: F2.binBin, binBinCoef: F2.binBinCoef,
  squareBin: F2.squareBin, squareMid: F2.squareMid,
  conj: F2.conj, conjMatch: F2.conjMatch,
  multiTerm: F2.multiTerm, multiCoef: F2.multiCoef, cellCount: F2.cellCount,
  testValue: F3.testValue, testVerdict: F3.testVerdict,
  badStep: F3.badStep, badStepSub: F3.badStepSub,
  nameError: F3.nameError, repair: F3.repair,
  closure: F3.closure, closureEx: F3.closureEx,
  ctxMeaning: F3.ctxMeaning, ctxWrite: F3.ctxWrite, ctxValue: F3.ctxValue,
};
export const FAMILY_NAMES: Record<string, string> = {
  powerRead: 'Read the power', powerEval: 'Evaluate a power',
  isPoly: 'Spot the polynomial', notPoly: 'Spot the impostor',
  countTerms: 'Count the terms', whichTerms: 'Terms with their signs',
  coefOf: 'Read a coefficient', coefPick: 'Fraction coefficients',
  termDegree: 'Degree of a term', degreeHigh: 'Highest-degree term',
  polyDegree: 'Degree of a polynomial', degreeCh: 'Degree, special cases',
  termName: 'Name by terms', degreeName: 'Name by degree', fullName: 'Full name',
  stdForm: 'Standard form', leadCoef: 'Leading coefficient',
  mvDegree: 'Degree with two variables', mvHigh: 'Highest total degree',
  likePick: 'Find a like term', likeCount: 'Count like terms',
  mvLike: 'Like terms in x and y', mvPair: 'Which pair is like?',
  collect: 'Collect like terms', collectCoef: 'Collect one power', collectName: 'Collect, then name',
  addPoly: 'Add polynomials', addVertical: 'Add in columns',
  opposite: 'The opposite', oppositeCoef: 'Opposite, one term',
  subPoly: 'Subtract polynomials', subCoef: 'Subtract, one column',
  monoMul: 'Multiply monomials', monoMulPair: 'Monomial product',
  monoPoly: 'Monomial times polynomial', monoPolyCoef: 'Distribute, one term',
  binBin: 'Binomial times binomial', binBinCoef: 'Fill in the product',
  squareBin: 'Square a binomial', squareMid: 'The middle term',
  conj: 'Sum times difference', conjMatch: 'Find the factors',
  multiTerm: 'Bigger products', multiCoef: 'One diagonal of the box', cellCount: 'Count the partial products',
  testValue: 'Pick a test value', testVerdict: 'What a test proves',
  badStep: 'Find the broken step', badStepSub: 'Broken step by values',
  nameError: 'Explain the error', repair: 'Repair the line',
  closure: 'Always a polynomial?', closureEx: 'Not a polynomial',
  ctxMeaning: 'What a term means', ctxWrite: 'Write the polynomial', ctxValue: 'Evaluate in context',
};
