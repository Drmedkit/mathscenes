// items.ts: the practice families of "Factoring" (secondary-t6-05, Algebra 1). Every family is generated from its
// sub-goal's cases, checked exactly (fx.ts: a wrong factored form never multiplies back to the polynomial unless
// the family is about completeness and says so), and every wrong answer the classifier recognises carries its
// catalogue id (common.ts MC). fam1: forms, common factors, monomial division; fam2: quadratics; fam3: division by a
// polynomial, justifying, completeness, context. Pictures: item.picture.box (the product box read backwards).
import type { Gen } from './common';
import * as F1 from './fam1';
import * as F2 from './fam2';
import * as F3 from './fam3';
export { MC, type FacItem, type FacPicture, type FBoxPic, type FReveal } from './common';

export const GENERATORS: Record<string, Gen> = {
  formPick: F1.formPick, formKind: F1.formKind,
  numGcfSum: F1.numGcfSum, distBack: F1.distBack, sameValue: F1.sameValue,
  areaSides: F1.areaSides, areaPair: F1.areaPair, areaParallel: F1.areaParallel,
  verifyJudge: F1.verifyJudge, verifyMid: F1.verifyMid,
  gcfNum: F1.gcfNum, gcfOut: F1.gcfOut,
  missingMono: F1.missingMono, zeroCond: F1.zeroCond,
  gcfMonoPick: F1.gcfMonoPick, gcfMonoOut: F1.gcfMonoOut,
  negOut: F1.negOut, negOne: F1.negOne,
  divTerms: F1.divTerms, divSigned: F1.divSigned,
  monicPair: F2.monicPair, monicPick: F2.monicPick,
  monicNegPair: F2.monicNegPair, monicNegPick: F2.monicNegPick,
  monicOppPair: F2.monicOppPair, monicMixed: F2.monicMixed,
  dosPick: F2.dosPick, dosFill: F2.dosFill,
  pstPick: F2.pstPick, pstMid: F2.pstMid,
  groupPick: F2.groupPick, groupStep: F2.groupStep,
  acSplit: F2.acSplit, acPick: F2.acPick,
  primeJudge: F2.primeJudge, primeGcf: F2.primeGcf,
  completePick: F2.completePick, completeFill: F2.completeFill,
  cancelPick: F3.cancelPick, cancelExcl: F3.cancelExcl,
  longPick: F3.longPick, longRem: F3.longRem,
  agreeProof: F3.agreeProof, whyExpand: F3.whyExpand,
  judgeWhich: F3.judgeWhich, judgeYes: F3.judgeYes,
  roomSides: F3.roomSides, roomAt: F3.roomAt, roomWidth: F3.roomWidth,
  ctxOp: F3.ctxOp, ctxValue: F3.ctxValue,
};
export const FAMILY_NAMES: Record<string, string> = {
  formPick: 'Spot the product', formKind: 'Sum or product?',
  numGcfSum: 'A common factor in numbers', distBack: 'Distribution backwards', sameValue: 'Same value?',
  areaSides: 'Sides from the tiles', areaPair: 'Read the box backwards', areaParallel: 'The number version',
  verifyJudge: 'Check a factorization', verifyMid: 'The middle coefficient',
  gcfNum: 'Greatest common factor', gcfOut: 'Take out the GCF',
  missingMono: 'Missing monomial factor', zeroCond: 'What happens at 0?',
  gcfMonoPick: 'GCF with powers', gcfMonoOut: 'Factor out a monomial',
  negOut: 'Take out a negative', negOne: 'Take out −1',
  divTerms: 'Divide by a monomial', divSigned: 'Signs and fractions',
  monicPair: 'Product and sum', monicPick: 'Factor the trinomial',
  monicNegPair: 'Both negative', monicNegPick: 'Minus in the middle',
  monicOppPair: 'Opposite signs', monicMixed: 'All four sign cases',
  dosPick: 'Difference of squares', dosFill: 'Fill the square roots',
  pstPick: 'Perfect square?', pstMid: 'The middle term 2AB',
  groupPick: 'Factor by grouping', groupStep: 'Group the pairs',
  acSplit: 'Split the middle term', acPick: 'Leading coefficient not 1',
  primeJudge: 'Prime or not?', primeGcf: 'Prime after the GCF?',
  completePick: 'Factor completely', completeFill: 'GCF, then the trinomial',
  cancelPick: 'Factor and cancel', cancelExcl: 'The excluded value',
  longPick: 'Divide with a remainder', longRem: 'The remainder',
  agreeProof: 'One value is not a proof', whyExpand: 'Why expanding proves it',
  judgeWhich: 'Which one is complete?', judgeYes: 'Complete or not?',
  roomSides: 'Sides from the area', roomAt: 'The real room', roomWidth: 'Given the width',
  ctxOp: 'Which operation?', ctxValue: 'Evaluate in context',
};
