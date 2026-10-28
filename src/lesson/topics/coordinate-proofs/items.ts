// items.ts: practice families for "Distance, midpoint and coordinate proofs"
// (secondary-t6-24-coordinate-geometry-distance-midpoint-and-slope-proofs, 33 sub-goals). famA: distance, midpoint,
// slope criteria, partition and weighted averages, sides and diagonals; famB: one specified figure (claims, perimeter,
// area, check sets, verdicts, the converse, circles); famC: every figure of a kind (examples, scope, counterexamples,
// placement, general proofs, the slope-criteria proofs, critique, audit). Every choice list goes through ckit.choice.
import type { Gen } from './ckit';
import { bisectEach, centroid, closing, congExact, distLegs, distSq, distTri, distX, hvLine, hvRel, lineRel, midMix, midPt, midWhich, missEnd, missEndPick, parFourth, parSlope, parTest, partRatio, partT, perpSlope, perpTest, sideDiag, slopeZU, vocabBisect, vocabMid, wAvg, whichLonger, wMove } from './famA';
import { areaBox, areaRect, checkNeed, checkSet, claimArg, claimProp, classify, converse, onCircle, perimExact, perimRound, rightWhere, verdict, whichOnCircle } from './famB';
import { audit, critique, cxCheck, cxPick, genProofEnd, genProofStep, iffBoth, nondegen, paramFam, perpProof, placeFourth, placeGen, preserved, scope, slopeProof, varyEx, whyMove } from './famC';

export type { CItem, CPicture } from './ckit';

export const GENERATORS: Record<string, Gen> = {
  distTri, distLegs, vocabMid, vocabBisect, congExact, whichLonger, midPt, midWhich, missEnd, missEndPick, bisectEach, parFourth,
  slopeZU, parTest, parSlope, perpSlope, perpTest, hvRel, hvLine, distX, distSq, midMix, partT, partRatio, wAvg, wMove, centroid,
  lineRel, sideDiag, closing,
  claimArg, claimProp, perimExact, perimRound, areaBox, areaRect, checkSet, checkNeed, verdict, classify, converse, rightWhere, onCircle, whichOnCircle,
  varyEx, scope, cxPick, cxCheck, paramFam, nondegen, preserved, whyMove, placeGen, placeFourth, genProofStep, genProofEnd, slopeProof, perpProof, iffBoth, critique, audit,
};

export const FAMILY_NAMES: Record<string, string> = {
  distTri: 'Distance is Pythagoras', distLegs: 'The distance expression', vocabMid: 'What a midpoint is', vocabBisect: 'Which one bisects?',
  congExact: 'Congruent, exactly?', whichLonger: 'Which is longer?', midPt: 'Midpoint', midWhich: 'Which point is the midpoint?',
  missEnd: 'The missing endpoint', missEndPick: 'Which endpoint?', bisectEach: 'Do the diagonals bisect each other?', parFourth: 'The fourth vertex',
  slopeZU: 'Zero or undefined?', parTest: 'Parallel lines', parSlope: 'A parallel slope', perpSlope: 'A perpendicular slope', perpTest: 'Perpendicular?',
  hvRel: 'Horizontal and vertical lines', hvLine: 'A perpendicular through a point', distX: 'Exact distance', distSq: 'Squared distance', midMix: 'Midpoint or endpoint',
  partT: 'Part of the way', partRatio: 'Partition in a ratio', wAvg: 'Weighted average', wMove: 'Weights and the balance point', centroid: 'The centroid',
  lineRel: 'Two lines', sideDiag: 'Side or diagonal?', closing: 'All the way around',
  claimArg: 'A complete argument', claimProp: 'What the numbers prove', perimExact: 'Exact perimeter', perimRound: 'Perimeter, rounded', areaBox: 'Triangle area',
  areaRect: 'Tilted rectangle area', checkSet: 'Enough checks?', checkNeed: 'What else must be shown?', verdict: 'Prove or disprove', classify: 'The most specific name',
  converse: 'Right, acute or obtuse?', rightWhere: 'Where is the right angle?', onCircle: 'On the circle?', whichOnCircle: 'Which point is on the circle?',
  varyEx: 'Varied examples', scope: 'Does it prove the claim?', cxPick: 'Find a counterexample', cxCheck: 'Is it a counterexample?', paramFam: 'What the letters cover',
  nondegen: 'Keeping the figure', preserved: 'What moving changes', whyMove: 'Why we may move it', placeGen: 'A general placement', placeFourth: 'Placing with letters',
  genProofStep: 'A step of a general proof', genProofEnd: 'What the algebra shows', slopeProof: 'Proving the parallel criterion', perpProof: 'Proving the perpendicular criterion',
  iffBoth: 'Both directions', critique: 'Critique the argument', audit: 'The missing case',
};
