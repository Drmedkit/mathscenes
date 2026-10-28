// items.ts: practice families for "Arcs and angles in circles" (secondary-t6-26-circle-theorems, 33 sub-goals).
// Every figure is exact (cfig.ts: arcs and angles drawn at their measures, a diameter through the center, a tangent
// perpendicular to its radius); every choice list goes through ckit.choose (one right choice; a wrong choice equal in
// text or value to the right one is dropped); every typed answer through ckit.numQ (a wrong value equal to the
// answer is dropped). Pictures (item.picture): cfig (the circle figure), proof (the course's ProofFrame), card.
// famA: stage 1 (parts of a circle, kinds of angles, arcs); famB: stage 2 (measures); famC: stage 3 (reasoning).
import type { Gen } from './ckit';
import { angleKind, arcMeasure, arcName, chordCount, circumTangency, halveArc, interceptPick, lineKind, segKind, simProof, simScale, tangentPoint, whichAngle } from './famA';
import { algebra, chase2, chase3, chordChord, circumValue, cyclicApplies, cyclicQuad, diameterGiven, exteriorAngle, inscribedArc, inscribedCentral, inscribedMajor, radiusIso, sameArc, sameOrOpposite, semicircle, tangentChord, tangentRadius } from './famB';
import { chainReason, contraForm, contraUse, converseClass, findCenter, hypCheck, hypMatch, proofBase, proofChord, proofCyclic, proofDiff, proofSum, realWorld, rejectVerdict, rightDiameter } from './famC';

export type { CItem, CPicture } from './ckit';

export const GENERATORS: Record<string, Gen> = {
  simScale, simProof, segKind, chordCount, lineKind, tangentPoint, angleKind, whichAngle, circumTangency, arcName, arcMeasure, interceptPick, halveArc,
  inscribedArc, inscribedCentral, inscribedMajor, sameArc, sameOrOpposite, semicircle, diameterGiven, cyclicQuad, cyclicApplies, tangentRadius, circumValue,
  tangentChord, chordChord, exteriorAngle, radiusIso, algebra, chase2, chase3,
  hypCheck, hypMatch, rejectVerdict, converseClass, contraForm, contraUse, rightDiameter, findCenter, chainReason, proofBase, proofSum, proofDiff, proofCyclic, proofChord, realWorld,
};

export const FAMILY_NAMES: Record<string, string> = {
  simScale: 'Circles are similar: the scale factor', simProof: 'Circles are similar: the proof', segKind: 'Chord, diameter or radius?', chordCount: 'Count the chords',
  lineKind: 'Secant or tangent?', tangentPoint: 'The point of tangency', angleKind: 'What kind of angle?', whichAngle: 'Find the angle', circumTangency: 'Circumscribed angles',
  arcName: 'Naming arcs', arcMeasure: 'Arc measures', interceptPick: 'The intercepted arc', halveArc: 'Halves and doubles',
  inscribedArc: 'Inscribed angle and its arc', inscribedCentral: 'Inscribed and central angles', inscribedMajor: 'Inscribed on a major arc', sameArc: 'Same arc, same angle',
  sameOrOpposite: 'Congruent or supplementary?', semicircle: 'Angle in a semicircle', diameterGiven: 'Is it a right angle?', cyclicQuad: 'Inscribed quadrilaterals',
  cyclicApplies: 'Does the theorem apply?', tangentRadius: 'Tangent and radius', circumValue: 'Circumscribed angle measure', tangentChord: 'Tangent and chord',
  chordChord: 'Two chords inside', exteriorAngle: 'Angles outside the circle', radiusIso: 'Two radii, one isosceles triangle', algebra: 'Circle equations in x',
  chase2: 'Two-step chase', chase3: 'Three-step chase', hypCheck: 'What the theorem needs', hypMatch: 'Which given licenses it?', rejectVerdict: 'Justified, or not?',
  converseClass: 'The converse', contraForm: 'The contrapositive', contraUse: 'Theorem, converse or contrapositive?', rightDiameter: 'Right angle, so a diameter',
  findCenter: 'Find the center', chainReason: 'Justify every step', proofBase: 'Proof: the base case', proofSum: 'Proof: center inside', proofDiff: 'Proof: center outside',
  proofCyclic: 'Proof: inscribed quadrilaterals', proofChord: 'Proof: chord and secant angles', realWorld: 'Circles in the world',
};
