// items.ts: practice families for "Constructions with compass and straightedge" (secondary-t6-35-geometric-
// constructions + secondary.geometric-constructions, 34 sub-goals). Every construction is computed (cons.ts: exact
// circle and line intersections) and drawn by the construction player (Construct.ts); every choice item has exactly
// one right answer; every recognised slip carries its catalogue id. famA: rules, arcs, definitions and the
// constructions themselves (incl. the generic nextStep / orderSteps / spotFake); famB: conjectures, givens,
// SSS / SAS justifications, both directions of the equidistance theorem, diagnosis, loci.
import type { Gen } from './ckit';
import { abArbitrary, abFlawRays, abHalf, abMid, arcMeaning, arcRead, armLength, bothCond, caChord, circleLocus, connector, copyTwice, corrCheck, corrWhy, ddWhy, dragTest, centralAngle, eqRhombus, eqWhy, foldWhich, foldWhy, freeChoice, hexClose, howMany, keepWidth, midNum, midPick, needleWhere, nextStep, onInside, orderSteps, pbBoth, pbWhich, pbWidth, poffRadius, polyJoin, ponSlant, ponWrong, reopened, secondPerp, spotFake, toolRules, turnedCopy } from './famA';
import { abProofCrit, abProofNext, boundaryCase, caMissing, caProof, chooseLocus, circumWhere, convWhy, diagnose, fwdNum, fwdWhy, givenFromArcs, guaranteed, iffBoth, measuredProof, onPath, pbLinear, pbProof1, pbProof2, proofReason, sharedSide, testConj, threeTowns, whyTwo } from './famB';

export type { CItem, CPicture } from './ckit';

export const GENERATORS: Record<string, Gen> = {
  spotFake, toolRules, freeChoice, arcRead, onInside, reopened, circleLocus, arcMeaning, howMany, bothCond, pbWhich, pbBoth,
  abHalf, abMid, nextStep, keepWidth, orderSteps, copyTwice, needleWhere, turnedCopy, eqWhy, eqRhombus, pbWidth, midPick,
  midNum, abFlawRays, abArbitrary, ponWrong, ponSlant, poffRadius, connector, hexClose, centralAngle, polyJoin, caChord,
  armLength, secondPerp, ddWhy, corrCheck, corrWhy, foldWhich, dragTest, foldWhy,
  circumWhere, guaranteed, testConj, givenFromArcs, sharedSide, abProofCrit, abProofNext, caProof, caMissing, pbProof1,
  pbProof2, pbLinear, fwdNum, fwdWhy, convWhy, iffBoth, boundaryCase, diagnose, measuredProof, chooseLocus, onPath,
  threeTowns, whyTwo, proofReason,
};

export const FAMILY_NAMES: Record<string, string> = {
  spotFake: 'Spot the non-construction', toolRules: 'What the tools may do', freeChoice: 'Free choices', arcRead: 'An arc is a distance',
  onInside: 'On the circle or inside?', reopened: 'A re-opened compass', circleLocus: 'A fixed distance from a point', arcMeaning: 'What an arc records',
  howMany: 'How many crossings?', bothCond: 'Two distances at once', pbWhich: 'Which line is the bisector?', pbBoth: 'Both conditions',
  abHalf: 'Half the angle', abMid: 'Bisectors and midpoints', nextStep: 'The next step', keepWidth: 'Keep the width',
  orderSteps: 'Put the steps in order', copyTwice: 'Copies of a segment', needleWhere: 'Where the needle goes', turnedCopy: 'Turned copies',
  eqWhy: 'Why it is equilateral', eqRhombus: 'Both crossings', pbWidth: 'A width that works', midPick: 'Find the midpoint',
  midNum: 'Midpoint lengths', abFlawRays: 'Marks on the sides', abArbitrary: 'A ray through a midpoint', ponWrong: 'Centred on the point?',
  ponSlant: 'Perpendicular to a tilted line', poffRadius: 'Reach the line twice', connector: 'Any segment to the line?', hexClose: 'Stepping round the circle',
  centralAngle: 'Central angles', polyJoin: 'Square or rectangle?', caChord: 'Carry the chord', armLength: 'Long sides, same angle',
  secondPerp: 'The second perpendicular', ddWhy: 'Why two perpendiculars work', corrCheck: 'Corresponding or not?', corrWhy: 'Why the copy makes a parallel',
  foldWhich: 'Fold it', dragTest: 'The drag test', foldWhy: 'Why folding works', circumWhere: 'Where the bisectors meet',
  guaranteed: 'Guaranteed or just this drawing?', testConj: 'Examples and conjectures', givenFromArcs: 'What the compass gives', sharedSide: 'The shared side',
  abProofCrit: 'The bisector proof', abProofNext: 'From triangles to the bisector', caProof: 'Why the copy works', caMissing: 'The missing pair',
  pbProof1: 'The first congruence', pbProof2: 'Both conclusions', pbLinear: 'A congruent linear pair', fwdNum: 'Any point of the bisector',
  fwdWhy: 'Why every point is equidistant', convWhy: 'The converse', iffBoth: 'Exactly the set', boundaryCase: 'The boundary case',
  diagnose: 'What broke?', measuredProof: 'Measuring is not proving', chooseLocus: 'Choose the locus', onPath: 'On the road',
  threeTowns: 'Three towns', whyTwo: 'Why two bisectors are enough', proofReason: 'Reasons in the proof',
};
