// items.ts: practice families for "Parallelograms and other quadrilaterals"
// (secondary-t6-21-parallelogram-and-quadrilateral-properties, 41 sub-goals). Every figure is exact (its drawn class
// is the class its marks guarantee; labelled lengths at one scale, labelled angles at their measure; tick groups
// equal, arc groups equal, boxes 90°, chevron groups parallel), every choice item has exactly one right choice, and
// every item that names trapezoids or kites states the inclusive definitions. Pictures (item.picture): fig (the
// course's GeoFig), gallery, proof (ProofFrame), card, tree (the family tree), euler (rectangles and rhombuses).
// famA: stage 1 (marks, definitions, the hierarchy); famB: stage 2 (measures); famC: stage 3 (proofs, conditions).
import type { Gen } from './qkit';
import { allNames, allSomeNo, couldBe, defGallery, defPick, guaranteed, inclWhy, inheritChain, inheritWhich, markMeaning, markRead, mostSpecific, treeName, vennZone } from './famA';
import { bisMeaning, chaseRect, chaseRhomb, consAngle, conjTable, diagHalf, diagVocab, eqCons, eqOpp, extSum, measuredSum, mixedProp, oppAngle, oppCons, oppSide, partWhole, perim, polyMissing, polySum, rectDiag, regAngle, regSides, rhombBis, rhombPerp } from './famB';
import { converseForm, counterEx, fourWay, isoTrapAngle, isoTrapDiag, kiteDiag, necMean, onePair, paraTest, practical, propOrder, propReason, rectTestF, rhombTest, solveForTest, suffMean, testReason, trapMid, trapProof, universe } from './famC';

export type { QItem, QPicture } from './qkit';

export const GENERATORS: Record<string, Gen> = {
  markRead, markMeaning, defPick, defGallery, inclWhy, inheritWhich, inheritChain, treeName, vennZone, allNames, mostSpecific, guaranteed, couldBe, allSomeNo,
  partWhole, oppCons, oppSide, perim, oppAngle, consAngle, polySum, polyMissing, measuredSum, extSum, regAngle, regSides, diagVocab, conjTable, diagHalf,
  rectDiag, rhombPerp, bisMeaning, rhombBis, chaseRect, chaseRhomb, mixedProp, eqOpp, eqCons,
  propReason, propOrder, suffMean, converseForm, necMean, paraTest, onePair, rectTestF, rhombTest, kiteDiag, isoTrapDiag, counterEx, fourWay, universe,
  testReason, solveForTest, trapMid, isoTrapAngle, trapProof, practical,
};

export const FAMILY_NAMES: Record<string, string> = {
  markRead: 'Marked or not?', markMeaning: 'What a mark means', defPick: 'The definition', defGallery: 'Which figure is marked as it?', inclWhy: 'Is every one a ...?',
  inheritWhich: 'Passing properties down', inheritChain: 'Up or down the tree?', treeName: 'The family tree', vennZone: 'Rectangles and rhombuses', allNames: 'Every name',
  mostSpecific: 'The most specific name', guaranteed: 'Only what the marks say', couldBe: 'Must or could?', allSomeNo: 'All, some, no',
  partWhole: 'Parts and wholes', oppCons: 'Opposite or consecutive?', oppSide: 'Opposite sides', perim: 'Perimeter', oppAngle: 'Opposite angles', consAngle: 'Consecutive angles',
  polySum: 'Polygon angle sums', polyMissing: 'The missing angle', measuredSum: 'Measured or proved?', extSum: 'Exterior angles', regAngle: 'Regular polygon angles', regSides: 'How many sides?',
  diagVocab: 'Diagonal words', conjTable: 'A diagonal conjecture', diagHalf: 'Diagonals bisect each other', rectDiag: 'Rectangle diagonals', rhombPerp: 'Rhombus diagonals',
  bisMeaning: 'Bisecting an angle', rhombBis: 'Rhombus angle bisectors', chaseRect: 'Rectangle angle chase', chaseRhomb: 'Rhombus angle chase', mixedProp: 'Classify, then compute',
  eqOpp: 'Equal parts, equations', eqCons: 'Supplementary, equations', propReason: 'Parallelogram proofs: reasons', propOrder: 'Parallelogram proofs: lines',
  suffMean: 'Sufficient', converseForm: 'The converse', necMean: 'Necessary', paraTest: 'Parallelogram tests', onePair: 'The one-pair test', rectTestF: 'Rectangle tests',
  rhombTest: 'Rhombus and square tests', kiteDiag: 'Kite diagonals', isoTrapDiag: 'Isosceles trapezoid diagonals', counterEx: 'Find a counterexample', fourWay: 'Necessary, sufficient, both?',
  universe: 'Which universe?', testReason: 'Proving the tests', solveForTest: 'Find x to make it one', trapMid: 'Trapezoid midsegment', isoTrapAngle: 'Isosceles trapezoid angles',
  trapProof: 'Trapezoid proofs', practical: 'Does the check prove it?',
};
