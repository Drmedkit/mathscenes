// items.ts: the practice families of "Polynomial operations and identities" (secondary-t7-02, Algebra 2). Every
// family is generated from its sub-goal's cases and checked exactly (idm.ts expands every expression); every wrong
// answer the classifier recognises carries its catalogue id (common.ts MC). fam1: what an identity is, two-variable
// terms, the three special products from scratch; fam2: bigger products, templates in one step, chunks, factoring in
// reverse; fam3: closure, proof, counterexamples, auditing, identities that explain numbers. Pure: no DOM.
import type { Gen } from './common';
import * as F1 from './fam1';
import * as F2 from './fam2';
import * as F3 from './fam3';
export { MC, type IdItem, type IdPicture, type BoxPic, type AreaPic, type ChainPic } from './common';

export const GENERATORS: Record<string, Gen> = {
  classify: F1.classify, identityPick: F1.identityPick,
  monoProd: F1.monoProd, collect2: F1.collect2, likeTwo: F1.likeTwo,
  sumSquareNum: F1.sumSquareNum, sumSquareSym: F1.sumSquareSym,
  diffSquare: F1.diffSquare, lastTerm: F1.lastTerm,
  conjExpand: F1.conjExpand, conjCancel: F1.conjCancel,
  triple: F2.triple, bigCoef: F2.bigCoef, cubes: F2.cubes,
  whichPattern: F2.whichPattern, oneStep: F2.oneStep, middleCoef: F2.middleCoef,
  chunkExpand: F2.chunkExpand, chunkName: F2.chunkName,
  factorChunk: F2.factorChunk, nearMatch: F2.nearMatch,
  closureWhich: F3.closureWhich, degProduct: F3.degProduct,
  proofStep: F3.proofStep, proofLogic: F3.proofLogic,
  counterPick: F3.counterPick, counterValues: F3.counterValues,
  firstBad: F3.firstBad, repairStep: F3.repairStep, auditLogic: F3.auditLogic,
  mentalProduct: F3.mentalProduct, squareMental: F3.squareMental, consecutive: F3.consecutive, pyTriple: F3.pyTriple,
};
export const FAMILY_NAMES: Record<string, string> = {
  classify: 'Every value, some, or none?', identityPick: 'Spot the identity',
  monoProd: 'Multiply two-letter terms', collect2: 'Collect two-letter terms', likeTwo: 'Like terms in two letters',
  sumSquareNum: 'A square split in four', sumSquareSym: '(a + b)² for any a and b',
  diffSquare: 'The square of a difference', lastTerm: 'Why + b² at the end',
  conjExpand: 'Sum times difference', conjCancel: 'The cross terms cancel',
  triple: 'Three factors', bigCoef: 'Bigger boxes', cubes: 'Sums and differences of cubes',
  whichPattern: 'Which template fits?', oneStep: 'Expand in one step', middleCoef: 'The middle term',
  chunkExpand: 'A chunk as a or b', chunkName: 'Name the chunk',
  factorChunk: 'Factor with a chunk', nearMatch: 'Near-matches',
  closureWhich: 'Always a polynomial?', degProduct: 'Degree of a product',
  proofStep: 'Fill in the proof', proofLogic: 'What counts as a proof',
  counterPick: 'One counterexample', counterValues: 'Test both sides',
  firstBad: 'Find the first wrong step', repairStep: 'Repair the step', auditLogic: 'Audit the argument',
  mentalProduct: 'Products in your head', squareMental: 'Squares in your head', consecutive: 'Consecutive squares', pyTriple: 'Pythagorean triples',
};
