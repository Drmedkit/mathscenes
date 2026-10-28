// items.ts: the practice families of "Polynomial division" (secondary-t7-05, Algebra 2). Every family is generated
// from its sub-goal's cases and checked exactly (pd.ts divides with exact rationals); every wrong answer the
// classifier recognises carries its catalogue id (common.ts MC). fam1: P = D·Q + R read and rebuilt, the stopping
// rule, the reverse area box, the restriction, Q + R/D, factors; fam2: long division; fam3: synthetic division,
// inspection, method choice; fam4: verifying, completeness, spot checks, the invariant, the domain, known factors.
// Pure: no DOM.
import type { Gen } from './common';
import * as F1 from './fam1';
import * as F2 from './fam2';
import * as F3 from './fam3';
import * as F4 from './fam4';
export { MC, type PdItem, type PdPicture, type LdPic, type SdPic, type BoxPic, type LinkPic } from './common';

export const GENERATORS: Record<string, Gen> = {
  roleName: F1.roleName, rebuildP: F1.rebuildP, stopCheck: F1.stopCheck, remCandidates: F1.remCandidates,
  areaSide: F1.areaSide, areaSide3: F1.areaSide3, excluded: F1.excluded, restrictionPick: F1.restrictionPick,
  rewriteQR: F1.rewriteQR, qrFill: F1.qrFill, isFactor: F1.isFactor, factorPick: F1.factorPick,
  layoutRow: F2.layoutRow, placeholderCount: F2.placeholderCount, monoDivide: F2.monoDivide, nextTerm: F2.nextTerm,
  subtractRow: F2.subtractRow, updateChoice: F2.updateChoice, ldFull: F2.ldFull, ldRemainder: F2.ldRemainder,
  ldQuotientPick: F2.ldQuotientPick, nonmonicQ: F2.nonmonicQ, nonmonicFrac: F2.nonmonicFrac, quadDivR: F2.quadDivR, quadDivQ: F2.quadDivQ,
  sdApplies: F3.sdApplies, sdC: F3.sdC, coefRow: F3.coefRow, rowBack: F3.rowBack, sdNext: F3.sdNext, sdLast: F3.sdLast,
  sdDecodeQ: F3.sdDecodeQ, sdDecodeCoef: F3.sdDecodeCoef, linkBottom: F3.linkBottom, linkWhyAdd: F3.linkWhyAdd,
  inspectLinear: F3.inspectLinear, inspectSquare: F3.inspectSquare, methodPick: F3.methodPick, methodDo: F3.methodDo,
  verifyClaim: F4.verifyClaim, firstMismatch: F4.firstMismatch, finishedPick: F4.finishedPick, smallDividend: F4.smallDividend,
  spotValue: F4.spotValue, spotVerdict: F4.spotVerdict, invariantStep: F4.invariantStep, cycleCount: F4.cycleCount,
  domainCheck: F4.domainCheck, domainFix: F4.domainFix, factorFull: F4.factorFull, boxDims: F4.boxDims, quotientFirst: F4.quotientFirst,
};
export const FAMILY_NAMES: Record<string, string> = {
  roleName: 'Name the parts', rebuildP: 'Rebuild the dividend', stopCheck: 'Finished yet?', remCandidates: 'Which can be a remainder?',
  areaSide: 'The missing side', areaSide3: 'The missing side of a bigger box', excluded: 'Where it has no value', restrictionPick: 'The restriction',
  rewriteQR: 'Quotient plus remainder over divisor', qrFill: 'Fill in Q + R/D', isFactor: 'Is it a factor?', factorPick: 'Remainder 0',
  layoutRow: 'Set up the bracket', placeholderCount: 'Count the placeholders', monoDivide: 'Divide two terms', nextTerm: 'The next quotient term',
  subtractRow: 'Subtract the product', updateChoice: 'The new residual', ldFull: 'A whole division', ldRemainder: 'The remainder',
  ldQuotientPick: 'The quotient', nonmonicQ: 'A divisor like 2x + 1', nonmonicFrac: 'Fractions in the quotient', quadDivR: 'A quadratic divisor: the remainder', quadDivQ: 'A quadratic divisor: the quotient',
  sdApplies: 'When synthetic works', sdC: 'The number c', coefRow: 'The coefficient row', rowBack: 'Read the row back', sdNext: 'The next entry', sdLast: 'Run the tableau',
  sdDecodeQ: 'Read the bottom row', sdDecodeCoef: 'One quotient coefficient', linkBottom: 'Synthetic meets long division', linkWhyAdd: 'Why the tableau adds',
  inspectLinear: 'By inspection', inspectSquare: 'By inspection with a square', methodPick: 'Choose a method', methodDo: 'Any method',
  verifyClaim: 'Check by expanding', firstMismatch: 'Find where it breaks', finishedPick: 'True but unfinished', smallDividend: 'A smaller dividend',
  spotValue: 'Spot check', spotVerdict: 'What a check proves', invariantStep: 'What each step keeps', cycleCount: 'Why it ends',
  domainCheck: 'Identity versus quotient', domainFix: 'Fix the rewrite', factorFull: 'Factor completely', boxDims: 'Box dimensions', quotientFirst: 'Complete factorization',
};
