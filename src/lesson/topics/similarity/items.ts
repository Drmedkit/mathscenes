// items.ts: practice families for "Similar triangles" (secondary-t6-22-similarity-criteria-and-applications,
// 25 sub-goals). Every figure is exact (labelled lengths drawn at their length, one unit per figure; labelled angles
// at their measure; arc groups equal, boxes 90°); every choice item has exactly one right choice (a second valid
// statement order or a second true proportion is never offered as wrong: statements are checked on the drawn points,
// proportions on a generic figure); every recognised slip carries its catalogue id. Pictures (item.picture, the
// course's GFPicture): fig (GeoFig), proof (ProofFrame), card, gallery.
// famA: stage 1 (criteria, evidence, classification); famB: stage 2 (correspondence, k, lengths, nested, altitude,
// hourglass, algebra); famC: stage 3 (reasons, proofs, proportions, Pythagoras, side-splitter, circular arguments,
// indirect measurement).
import type { Gen } from './common';
import { aaMissing, aaThird, classify5, critName, dilateK, dilateWhy, evidence, evidenceJudge, k1Claim, k1Classify, polyScope, polyWhy, sasCheck, sasLen, sssCheck, sssRatio } from './famA';
import { algNest, algSep, altStmt, altWhich, corrRatio, corrSide, gmAlt, gmDerive, gmLeg, hourLen, hourStmt, kDirected, kFromStmt, missSep, missStory, nestPart, nestWhole, stmtMarks } from './famB';
import { angleK, circFind, circRepair, convCheck, convWhich, deduceCross, deduceProp, lookAlike, mirror, proofEnd, proofOrder, proofReasonS, pythGap, pythReason, reasonPick, river, shadow, ssAlgebra, ssForm, ssNum } from './famC';

export type { GFItem, GFPicture } from '../geometry-foundations/kit';

export const GENERATORS: Record<string, Gen> = {
  k1Classify, k1Claim, aaThird, aaMissing, sssCheck, sssRatio, sasCheck, sasLen, dilateWhy, dilateK, evidence, evidenceJudge,
  classify5, critName, polyScope, polyWhy,
  corrSide, corrRatio, stmtMarks, kDirected, kFromStmt, missSep, missStory, nestPart, nestWhole, altStmt, altWhich, gmAlt,
  gmLeg, gmDerive, hourStmt, hourLen, algNest, algSep,
  reasonPick, lookAlike, proofOrder, proofReasonS, proofEnd, deduceProp, deduceCross, angleK, pythGap, pythReason,
  ssAlgebra, ssNum, ssForm, convWhich, convCheck, circFind, circRepair, shadow, mirror, river,
};

export const FAMILY_NAMES: Record<string, string> = {
  k1Classify: 'Congruent is similar too', k1Claim: 'Always, sometimes, never', aaThird: 'The hidden third angle', aaMissing: 'Angles from the statement',
  sssCheck: 'Three side ratios', sssRatio: 'Pair the sides by size', sasCheck: 'Is the angle included?', sasLen: 'Make SAS~ work',
  dilateWhy: 'Dilate, then congruence', dilateK: 'The dilation factor', evidence: 'What the facts establish', evidenceJudge: 'Judge the disproof',
  classify5: 'Congruent, similar or neither', critName: 'Name the criterion', polyScope: 'Beyond triangles', polyWhy: 'Why only triangles',
  corrSide: 'Read the statement', corrRatio: 'Proportions from the statement', stmtMarks: 'Write the statement', kDirected: 'Scale factor with direction',
  kFromStmt: 'Scale factor from the statement', missSep: 'Missing side', missStory: 'Similar shapes in use', nestPart: 'Whole versus part',
  nestWhole: 'Part from the whole', altStmt: 'Altitude triangles', altWhich: 'Which are similar?', gmAlt: 'The altitude as a mean',
  gmLeg: 'A leg as a mean', gmDerive: 'Where the means come from', hourStmt: 'Hourglass statement', hourLen: 'Hourglass lengths',
  algNest: 'Solve for x (nested)', algSep: 'Solve for x (separate)', reasonPick: 'Reasons for the angles', lookAlike: 'Looks are not reasons',
  proofOrder: 'Order the proof', proofReasonS: 'Reasons in a proof', proofEnd: 'The last line', deduceProp: 'The proportion it gives',
  deduceCross: 'Cross products', angleK: 'Angles do not give k', pythGap: 'Pythagoras by similarity', pythReason: 'Reasons in the Pythagoras proof',
  ssAlgebra: 'Side-splitter algebra', ssNum: 'Side-splitter lengths', ssForm: 'Side-splitter proportions', convWhich: 'Theorem or converse?',
  convCheck: 'Is it parallel?', circFind: 'Find the circle', circRepair: 'Repair the proof', shadow: 'Shadows', mirror: 'A mirror on the ground', river: 'Across the river',
};
