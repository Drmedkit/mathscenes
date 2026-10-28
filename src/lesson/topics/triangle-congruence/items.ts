// items.ts: practice families for "Triangle congruence" (secondary-t6-19-triangle-congruence-sss-sas-asa-aas-hl,
// 31 sub-goals). Every figure is exact (computed points; tick groups equal, arc groups equal, boxes 90°, labelled
// measures drawn at their measure); every choice item has exactly one right choice (a second criterion that also
// works from the known pairs, with the third angle or a right triangle's third side derived, is never offered as
// wrong); every recognised slip carries its catalogue id. Pictures (item.picture, the course's GFPicture): fig
// (GeoFig), proof (ProofFrame), card, cards. famA: stage 1 (marks, correspondence, criteria); famB: stage 2 (rigid
// motions, circles, correspondence, hidden pairs, definitions, overlaps, proofs, CPCTC); famC: stage 3 (claims,
// counterexamples, SSA swing, HL, critique, find x).
import type { Gen } from '../geometry-foundations/kit';
import { aasSide, aasThird, classify, classifyList, corrPart, corrPick, countPairs, findHyp, fixOne, hlCheck, includedPart, isRight, listPairs, mirrorCopy, missingPair, patternName, sssNum, whyNotList } from './famA';
import { bisectDef, bisectNum, circlesMeet, cpctcEarly, cpctcNext, cpctcNum, defReason, defToPair, hiddenAngle, hiddenCrit, mirrorPoint, motionNext, motionWhy, overlapCrit, overlapShare, proofGap, proofParsons, proofReason, reflexReason, sharedPart, stmtAndCrit, stmtFromList, writeStmt } from './famB';
import { aaaBuild, aaaSize, claimAbout, critIfThen, critique, cxCheck, cxWhich, hlSwing, repairPick, scopeJudge, solvePart, solveX, ssaArc, ssaSwing, ssaVerify, ssaWhich } from './famC';

export type { GFItem, GFPicture } from '../geometry-foundations/kit';

export const GENERATORS: Record<string, Gen> = {
  listPairs, countPairs, whyNotList, corrPart, corrPick, fixOne, mirrorCopy, includedPart, patternName, findHyp, isRight,
  classify, sssNum, missingPair, aasThird, aasSide, hlCheck, classifyList,
  motionWhy, motionNext, circlesMeet, mirrorPoint, writeStmt, stmtAndCrit, stmtFromList, sharedPart, reflexReason,
  hiddenAngle, hiddenCrit, bisectDef, bisectNum, defToPair, defReason, overlapShare, overlapCrit, proofParsons,
  proofReason, proofGap, cpctcNext, cpctcNum, cpctcEarly,
  critIfThen, claimAbout, cxCheck, cxWhich, aaaBuild, aaaSize, ssaVerify, ssaWhich, ssaSwing, ssaArc, scopeJudge,
  hlSwing, critique, repairPick, solveX, solvePart,
};

export const FAMILY_NAMES: Record<string, string> = {
  listPairs: 'Read the marks', countPairs: 'Count the pairs', whyNotList: 'Looks are not marks', corrPart: 'Corresponding parts',
  corrPick: 'Pairs from the statement', fixOne: 'What a criterion means', mirrorCopy: 'Mirror copies', includedPart: 'Included parts',
  patternName: 'Name the pattern', findHyp: 'Hypotenuse and legs', isRight: 'Is it a right triangle?', classify: 'Which criterion?',
  sssNum: 'SSS with numbers', missingPair: 'The missing pair', aasThird: 'The third angle', aasSide: 'The side for AAS',
  hlCheck: 'Does HL apply?', classifyList: 'Criteria from a list', motionWhy: 'Why the moves work', motionNext: 'The next move',
  circlesMeet: 'Where circles meet', mirrorPoint: 'Mirror points', writeStmt: 'Write the statement', stmtAndCrit: 'Statement and criterion',
  stmtFromList: 'Statement from pairs', sharedPart: 'Shared parts', reflexReason: 'The reflexive reason', hiddenAngle: 'Hidden angle pairs',
  hiddenCrit: 'Criteria with hidden pairs', bisectDef: 'Midpoints and bisectors', bisectNum: 'Halves and wholes', defToPair: 'From a given to a pair',
  defReason: 'Definitions as reasons', overlapShare: 'Overlapping triangles', overlapCrit: 'Criteria for overlaps', proofParsons: 'Order the proof',
  proofReason: 'Reasons in a proof', proofGap: 'The missing line', cpctcNext: 'What CPCTC gives', cpctcNum: 'CPCTC with numbers',
  cpctcEarly: 'CPCTC too early', critIfThen: 'Criteria as if-then', claimAbout: 'What a claim covers', cxCheck: 'Check a counterexample',
  cxWhich: 'Find the counterexample', aaaBuild: 'Build an AAA counterexample', aaaSize: 'Same angles, new size', ssaVerify: 'Verify an SSA counterexample',
  ssaWhich: 'What SSA leaves open', ssaSwing: 'Swing the side', ssaArc: 'Two triangles from SSA', scopeJudge: 'SSA or HL?',
  hlSwing: 'Why HL works', critique: 'Judge the argument', repairPick: 'Repair the argument', solveX: 'Find x with CPCTC', solvePart: 'Find the part',
};
