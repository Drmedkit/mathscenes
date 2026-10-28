// qProofs.ts: the proofs of "Parallelograms and other quadrilaterals" (pure). Each proof: Given / Prove (TeX), rows
// (statement TeX, reason, the rows it uses, the wrong reasons a row may be confused with: never a second valid one),
// decoy lines with their misconception, and an exact figure whose marks are the givens.
//   properties   opposite sides (ASA on the diagonal), consecutive angles, diagonals bisect each other (ASA),
//                rectangle diagonals congruent (SAS)
//   tests        both pairs of opposite sides congruent (SSS), diagonals bisect each other (vertical angles, SAS),
//                one pair parallel and congruent (SAS), rhombus from perpendicular diagonals (SAS on half-triangles),
//                rectangle from congruent diagonals (SSS, consecutive angles)
//   trapezoids   isosceles trapezoid diagonals (SAS), the trapezoid midsegment (two triangle midsegments)
// Role letters A, B, C, D, E, M, N, P are relabelled per item by the families.
import type { Fig } from '../geometry-foundations/geo';
import { lerpP } from '../geometry-foundations/geo';
import { type QMark, diagMeet, makeQ, par, qfig, ri } from './quad';
import { MC, box, tick } from './qkit';

export const RS = {
  given: 'Given',
  defPara: 'Definition of parallelogram',
  altInt: 'Alt. Interior Angles Theorem',
  altIntConv: 'Alt. Interior Angles Converse',
  sameSide: 'Same-Side Interior Angles',
  defSupp: 'Definition of supplementary angles',
  refl: 'Reflexive Property of Congruence',
  SAS: 'SAS', SSS: 'SSS', ASA: 'ASA', SSA: 'SSA',
  cpctc: 'CPCTC',
  oppSides: 'Parallelogram opposite sides are congruent',
  vert: 'Vertical Angles Theorem',
  rightCong: 'All right angles are congruent',
  diagBis: 'Parallelogram diagonals bisect each other',
  consSupp: 'Consecutive angles supplementary',
  subst: 'Substitution Property',
  rectTest: 'Parallelogram with a right angle',
  rhombTest: 'Consecutive sides congruent',
  isoBase: 'Isosceles trapezoid base angles are congruent',
  midThm: 'Triangle Midsegment Theorem',
  parTrans: 'Lines parallel to one line are parallel',
  parPost: 'Parallel Postulate',
  segAdd: 'Segment Addition Postulate',
  diagCongRect: 'Rectangle diagonals are congruent',
  testOpp: 'Opposite sides congruent',
  onePair: 'One-pair test',
} as const;

export interface WrongRs { t: string; mc?: string; say: string }
export interface PRow { st: string; rs: string; uses: number[]; wrong: WrongRs[] }
export interface PDecoy { st: string; mc: string; why: string }
export interface QProof { id: QProofId; given: string[]; prove: string; rows: PRow[]; decoys: PDecoy[]; fig: Fig; roles: string; name: string }
export type QProofId = 'oppSides' | 'consSupp' | 'diagBisect' | 'rectDiag' | 'testOpp' | 'testDiag' | 'testOnePair' | 'rhombPerp' | 'rectTest' | 'isoDiag' | 'trapMid';
export const PROPERTY_PROOFS: QProofId[] = ['oppSides', 'consSupp', 'diagBisect', 'rectDiag'];
export const TEST_PROOFS: QProofId[] = ['testOpp', 'testDiag', 'testOnePair', 'rhombPerp', 'rectTest'];
export const TRAP_PROOFS: QProofId[] = ['isoDiag', 'trapMid'];

const ov = (s: string) => `\\overline{${s}}`;
const cg = (a: string, b: string) => `${ov(a)} \\cong ${ov(b)}`;
const an = (a: string, b: string) => `\\angle ${a} \\cong \\angle ${b}`;
const tr = (a: string, b: string) => `\\triangle ${a} \\cong \\triangle ${b}`;
const pl = (a: string, b: string) => `${ov(a)} \\parallel ${ov(b)}`;
const W = (t: string, say: string, mc?: string): WrongRs => ({ t, say, mc });
const PM: QMark[] = [par('AB', 1), par('DC', 1), par('AD', 2), par('BC', 2)];

export function makeQProof(id: QProofId, R: () => number): QProof {
  const turn = ri(R, -30, 30);
  switch (id) {
    case 'oppSides': return {
      id, roles: 'ABCD', name: 'Opposite sides of a parallelogram are congruent',
      fig: qfig(makeQ(R, 'para', { turn }), PM, { diags: 'AC' }),
      given: ['ABCD \\text{ is a parallelogram}'], prove: `${cg('AB', 'CD')},\\ ${cg('BC', 'DA')}`,
      rows: [
        { st: `${pl('AB', 'DC')},\\ ${pl('AD', 'BC')}`, rs: RS.defPara, uses: [], wrong: [W(RS.given, 'Only "ABCD is a parallelogram" is given; the parallel sides come from its definition.'), W(RS.oppSides, 'That is about congruent sides, and it is what we are proving.', MC.circular)] },
        { st: an('BAC', 'DCA'), rs: RS.altInt, uses: [1], wrong: [W(RS.altIntConv, 'The lines are known to be parallel; the theorem (not its converse) gives the congruent angles.', MC.converse), W(RS.vert, 'The angles are at A and C, not a vertical pair at one point.', MC.wrongPair)] },
        { st: an('BCA', 'DAC'), rs: RS.altInt, uses: [1], wrong: [W(RS.altIntConv, 'Parallel lines give the angles: the theorem itself.', MC.converse), W(RS.vert, 'These are alternate interior angles of AD ∥ BC, not vertical angles.', MC.wrongPair)] },
        { st: cg('AC', 'AC'), rs: RS.refl, uses: [], wrong: [W(RS.given, 'AC is shared by both triangles: reflexive.')] },
        { st: tr('ABC', 'CDA'), rs: RS.ASA, uses: [2, 3, 4], wrong: [W(RS.SSS, 'Only one pair of sides is known; AB ≅ CD is the conclusion.', MC.circular), W(RS.SAS, 'Two angles and the side between them are known: ASA.'), W(RS.SSA, 'SSA is not a criterion; the side AC is between the two angles.', MC.ssa)] },
        { st: `${cg('AB', 'CD')},\\ ${cg('BC', 'DA')}`, rs: RS.cpctc, uses: [5], wrong: [W(RS.oppSides, 'That is the theorem being proved: it cannot be its own reason.', MC.circular), W(RS.defPara, 'The definition gives parallel sides, not congruent ones.', MC.upHier)] },
      ],
      decoys: [
        { st: tr('ABC', 'ACD'), mc: MC.vertexOrder, why: 'the vertices do not correspond: A matches C, B matches D, C matches A.' },
        { st: cg('AB', 'BC'), mc: MC.appearance, why: 'nothing makes consecutive sides congruent.' },
      ],
    };
    case 'consSupp': return {
      id, roles: 'ABCD', name: 'Consecutive angles of a parallelogram are supplementary',
      fig: qfig(makeQ(R, 'para', { turn }), PM),
      given: ['ABCD \\text{ is a parallelogram}'], prove: 'm\\angle DAB + m\\angle ABC = 180^\\circ',
      rows: [
        { st: pl('AD', 'BC'), rs: RS.defPara, uses: [], wrong: [W(RS.consSupp, 'That is the claim being proved.', MC.circular), W(RS.given, 'Only "ABCD is a parallelogram" is given; the parallel sides come from its definition.')] },
        { st: 'm\\angle DAB + m\\angle ABC = 180^\\circ', rs: RS.sameSide, uses: [1], wrong: [W(RS.altInt, 'Alternate interior angles are congruent; these two sit on the same side of AB.', MC.wrongPair), W(RS.vert, 'They are at different vertices.', MC.wrongPair), W(RS.consSupp, 'That is the claim being proved.', MC.circular)] },
      ],
      decoys: [{ st: an('DAB', 'ABC'), mc: MC.swapAng, why: 'consecutive angles are supplementary, not congruent.' }],
    };
    case 'diagBisect': return {
      id, roles: 'ABCDE', name: 'The diagonals of a parallelogram bisect each other',
      fig: qfig(makeQ(R, 'para', { turn }), PM, { diags: 'halves' }),
      given: ['ABCD \\text{ is a parallelogram}', '\\text{its diagonals meet at } E'], prove: `${cg('AE', 'CE')},\\ ${cg('BE', 'DE')}`,
      rows: [
        { st: pl('AB', 'DC'), rs: RS.defPara, uses: [], wrong: [W(RS.diagBis, 'That is the theorem being proved.', MC.circular)] },
        { st: cg('AB', 'CD'), rs: RS.oppSides, uses: [], wrong: [W(RS.defPara, 'The definition gives parallel sides; congruent opposite sides is the theorem proved before.', MC.upHier), W(RS.given, 'It is not given; it was proved for every parallelogram.')] },
        { st: an('BAE', 'DCE'), rs: RS.altInt, uses: [1], wrong: [W(RS.vert, 'The vertical angles are at E; these are at A and C.', MC.wrongPair), W(RS.altIntConv, 'The lines are already parallel: the theorem gives the angles.', MC.converse)] },
        { st: an('ABE', 'CDE'), rs: RS.altInt, uses: [1], wrong: [W(RS.vert, 'These are at B and D, not at one point.', MC.wrongPair)] },
        { st: tr('ABE', 'CDE'), rs: RS.ASA, uses: [2, 3, 4], wrong: [W(RS.SSS, 'Only one pair of sides is known.'), W(RS.SSA, 'SSA is not a criterion; AB is between the two angles.', MC.ssa)] },
        { st: `${cg('AE', 'CE')},\\ ${cg('BE', 'DE')}`, rs: RS.cpctc, uses: [5], wrong: [W(RS.diagBis, 'That is the theorem being proved.', MC.circular), W(RS.vert, 'Vertical angles give angles, not segments.', MC.wrongPair)] },
      ],
      decoys: [
        { st: cg('AE', 'BE'), mc: MC.diagWords, why: 'bisect each other compares halves of the SAME diagonal.' },
        { st: tr('ABE', 'DCE'), mc: MC.vertexOrder, why: 'the vertices do not correspond: A matches C and B matches D.' },
      ],
    };
    case 'rectDiag': return {
      id, roles: 'ABCD', name: 'The diagonals of a rectangle are congruent',
      fig: qfig(makeQ(R, 'rect', { turn }), [box('DAB'), box('ABC'), box('BCD'), box('CDA')], { diags: 'whole' }),
      given: ['ABCD \\text{ is a rectangle}'], prove: cg('AC', 'DB'),
      rows: [
        { st: cg('AB', 'DC'), rs: RS.oppSides, uses: [], wrong: [W(RS.given, 'It is not given; every rectangle is a parallelogram, so it has congruent opposite sides.', MC.noInherit)] },
        { st: an('ABC', 'DCB'), rs: RS.rightCong, uses: [], wrong: [W(RS.altInt, 'These are consecutive angles, both right angles.', MC.wrongPair), W(RS.vert, 'They are at B and C.', MC.wrongPair)] },
        { st: cg('BC', 'CB'), rs: RS.refl, uses: [], wrong: [W(RS.given, 'BC is shared by both triangles: reflexive.')] },
        { st: tr('ABC', 'DCB'), rs: RS.SAS, uses: [1, 2, 3], wrong: [W(RS.SSS, 'AC ≅ DB is the conclusion, not a known pair.', MC.circular), W(RS.SSA, 'The right angle is between the two sides: SAS.', MC.ssa)] },
        { st: cg('AC', 'DB'), rs: RS.cpctc, uses: [4], wrong: [W(RS.diagCongRect, 'That is the theorem being proved.', MC.circular), W(RS.diagBis, 'Bisecting each other says nothing about AC compared with DB.', MC.diagWords)] },
      ],
      decoys: [
        { st: `${ov('AC')} \\perp ${ov('DB')}`, mc: MC.congPerp, why: 'a rectangle\'s diagonals are not perpendicular unless it is a square.' },
        { st: tr('ABC', 'BCD'), mc: MC.vertexOrder, why: 'the vertices do not correspond: A matches D, B matches C.' },
      ],
    };
    case 'testOpp': return {
      id, roles: 'ABCD', name: 'If both pairs of opposite sides are congruent, the quadrilateral is a parallelogram',
      fig: qfig(makeQ(R, 'para', { turn }), [tick('AB', 1), tick('DC', 1), tick('BC', 2), tick('AD', 2)], { diags: 'AC' }),
      given: [`${cg('AB', 'CD')},\\ ${cg('BC', 'DA')}`], prove: 'ABCD \\text{ is a parallelogram}',
      rows: [
        { st: cg('AB', 'CD'), rs: RS.given, uses: [], wrong: [W(RS.oppSides, 'That theorem starts from a parallelogram, which is what we are proving.', MC.circular)] },
        { st: cg('BC', 'DA'), rs: RS.given, uses: [], wrong: [W(RS.oppSides, 'That theorem starts from a parallelogram.', MC.circular)] },
        { st: cg('AC', 'AC'), rs: RS.refl, uses: [], wrong: [W(RS.given, 'AC is shared by both triangles: reflexive.')] },
        { st: tr('ABC', 'CDA'), rs: RS.SSS, uses: [1, 2, 3], wrong: [W(RS.ASA, 'No angle pair is known yet: three pairs of sides.', MC.beforeEst), W(RS.SAS, 'No angle pair is known yet.', MC.beforeEst)] },
        { st: an('BAC', 'DCA'), rs: RS.cpctc, uses: [4], wrong: [W(RS.altInt, 'That theorem needs parallel lines, which is what we are proving.', MC.circular)] },
        { st: pl('AB', 'DC'), rs: RS.altIntConv, uses: [5], wrong: [W(RS.altInt, 'Congruent alternate interior angles GIVE parallel lines: the converse.', MC.converse), W(RS.defPara, 'One parallel pair is not yet a parallelogram.', MC.insuffTest)] },
        { st: 'ABCD \\text{ is a parallelogram}', rs: RS.onePair, uses: [1, 6], wrong: [W(RS.oppSides, 'That theorem goes the other way.', MC.converse), W(RS.defPara, 'The definition needs BOTH pairs parallel; here one pair is parallel and congruent.', MC.someConds)] },
      ],
      decoys: [
        { st: `${pl('AB', 'DC')}\\ (\\text{Given})`, mc: MC.circular, why: 'parallel sides are not given; they are what the proof must reach.' },
        { st: an('BAC', 'BCA'), mc: MC.wrongPair, why: 'those two angles are in the same triangle; nothing makes them congruent.' },
      ],
    };
    case 'testDiag': return {
      id, roles: 'ABCDE', name: 'If the diagonals bisect each other, the quadrilateral is a parallelogram',
      fig: qfig(makeQ(R, 'para', { turn }), [tick('AE', 1), tick('EC', 1), tick('BE', 2), tick('ED', 2)], { diags: 'halves' }),
      given: [`${ov('AC')}, ${ov('BD')} \\text{ bisect each other at } E`], prove: 'ABCD \\text{ is a parallelogram}',
      rows: [
        { st: `${cg('AE', 'CE')},\\ ${cg('BE', 'DE')}`, rs: RS.given, uses: [], wrong: [W(RS.diagBis, 'That theorem starts from a parallelogram: here the bisecting is given.', MC.circular)] },
        { st: an('AEB', 'CED'), rs: RS.vert, uses: [], wrong: [W(RS.altInt, 'No parallel lines are known yet; the angles at E are vertical angles.', MC.beforeEst)] },
        { st: tr('AEB', 'CED'), rs: RS.SAS, uses: [1, 2], wrong: [W(RS.ASA, 'Two sides and the angle between them: SAS.'), W(RS.SSA, 'The vertical angle is between the two sides: SAS.', MC.ssa)] },
        { st: `${cg('AB', 'CD')},\\ ${an('BAE', 'DCE')}`, rs: RS.cpctc, uses: [3], wrong: [W(RS.altInt, 'Parallel lines are what we are proving.', MC.circular), W(RS.oppSides, 'That theorem starts from a parallelogram.', MC.circular)] },
        { st: pl('AB', 'DC'), rs: RS.altIntConv, uses: [4], wrong: [W(RS.altInt, 'Congruent alternate interior angles give parallel lines: the converse.', MC.converse)] },
        { st: 'ABCD \\text{ is a parallelogram}', rs: RS.onePair, uses: [4, 5], wrong: [W(RS.diagBis, 'That theorem goes the other way.', MC.converse), W(RS.defPara, 'Only one pair is known parallel; with AB ≅ CD it is the one-pair test.', MC.someConds)] },
      ],
      decoys: [
        { st: cg('AC', 'BD'), mc: MC.diagWords, why: 'bisecting each other says nothing about AC compared with BD.' },
        { st: `${ov('AC')} \\perp ${ov('BD')}`, mc: MC.appearance, why: 'nothing marks a right angle at E.' },
      ],
    };
    case 'testOnePair': return {
      id, roles: 'ABCD', name: 'If one pair of opposite sides is both parallel and congruent, the quadrilateral is a parallelogram',
      fig: qfig(makeQ(R, 'para', { turn }), [par('AB', 1), par('DC', 1), tick('AB', 1), tick('DC', 1)], { diags: 'AC' }),
      given: [`${pl('AB', 'DC')},\\ ${cg('AB', 'DC')}`], prove: 'ABCD \\text{ is a parallelogram}',
      rows: [
        { st: cg('AB', 'DC'), rs: RS.given, uses: [], wrong: [W(RS.oppSides, 'That theorem starts from a parallelogram.', MC.circular)] },
        { st: an('BAC', 'DCA'), rs: RS.altInt, uses: [], wrong: [W(RS.altIntConv, 'AB ∥ DC is given: the theorem gives the angles.', MC.converse), W(RS.vert, 'The angles are at A and C.', MC.wrongPair)] },
        { st: cg('AC', 'AC'), rs: RS.refl, uses: [], wrong: [W(RS.given, 'AC is shared: reflexive.')] },
        { st: tr('ABC', 'CDA'), rs: RS.SAS, uses: [1, 2, 3], wrong: [W(RS.SSS, 'BC ≅ DA is not known yet.', MC.beforeEst), W(RS.SSA, 'The angle is between AB and AC: SAS.', MC.ssa)] },
        { st: an('BCA', 'DAC'), rs: RS.cpctc, uses: [4], wrong: [W(RS.altInt, 'BC ∥ AD is not known yet.', MC.circular)] },
        { st: pl('BC', 'AD'), rs: RS.altIntConv, uses: [5], wrong: [W(RS.altInt, 'Congruent alternate interior angles give parallel lines: the converse.', MC.converse)] },
        { st: 'ABCD \\text{ is a parallelogram}', rs: RS.defPara, uses: [6], wrong: [W(RS.testOpp, 'BC ≅ DA was never shown; both pairs are now parallel: the definition.', MC.beforeEst)] },
      ],
      decoys: [
        { st: cg('BC', 'AD') + '\\ (\\text{Given})', mc: MC.diffPairs, why: 'only the SAME pair, AB and DC, is given parallel and congruent.' },
        { st: pl('BC', 'AD') + '\\ (\\text{Given})', mc: MC.circular, why: 'that is what the proof must reach.' },
      ],
    };
    case 'rhombPerp': return {
      id, roles: 'ABCDE', name: 'A parallelogram with perpendicular diagonals is a rhombus',
      fig: qfig(makeQ(R, 'rhombus', { turn }), [...PM, box('AEB')], { diags: 'halves' }),
      given: ['ABCD \\text{ is a parallelogram}', `${ov('AC')} \\perp ${ov('BD')} \\text{ at } E`], prove: 'ABCD \\text{ is a rhombus}',
      rows: [
        { st: cg('AE', 'CE'), rs: RS.diagBis, uses: [], wrong: [W(RS.given, 'It is not given; ABCD is a parallelogram, so its diagonals bisect each other.', MC.noInherit), W(RS.defPara, 'The definition gives parallel sides, not halves.')] },
        { st: an('AEB', 'CEB'), rs: RS.rightCong, uses: [], wrong: [W(RS.vert, '∠AEB and ∠CEB form a linear pair, not vertical angles.', MC.wrongPair)] },
        { st: cg('BE', 'BE'), rs: RS.refl, uses: [], wrong: [W(RS.diagBis, 'BE is shared by both triangles: reflexive.')] },
        { st: tr('AEB', 'CEB'), rs: RS.SAS, uses: [1, 2, 3], wrong: [W(RS.SSS, 'AB ≅ CB is what we want.', MC.circular), W(RS.SSA, 'The right angle is between the two sides: SAS.', MC.ssa)] },
        { st: cg('AB', 'CB'), rs: RS.cpctc, uses: [4], wrong: [W(RS.oppSides, 'Opposite sides are AB and CD; AB and CB are consecutive.', MC.oppCons)] },
        { st: 'ABCD \\text{ is a rhombus}', rs: RS.rhombTest, uses: [5], wrong: [W(RS.defPara, 'That gives a parallelogram, which was given.', MC.dropsPara)] },
      ],
      decoys: [
        { st: cg('AC', 'BD'), mc: MC.congPerp, why: 'perpendicular diagonals need not be congruent.' },
        { st: cg('AE', 'BE'), mc: MC.diagWords, why: 'halves of DIFFERENT diagonals need not match.' },
      ],
    };
    case 'rectTest': return {
      id, roles: 'ABCD', name: 'A parallelogram with congruent diagonals is a rectangle',
      fig: qfig(makeQ(R, 'rect', { turn }), PM, { diags: 'whole' }),
      given: ['ABCD \\text{ is a parallelogram}', cg('AC', 'DB')], prove: 'ABCD \\text{ is a rectangle}',
      rows: [
        { st: cg('AB', 'DC'), rs: RS.oppSides, uses: [], wrong: [W(RS.given, 'Only the diagonals are given congruent; opposite sides follow from the parallelogram.')] },
        { st: cg('BC', 'CB'), rs: RS.refl, uses: [], wrong: [W(RS.given, 'BC is shared: reflexive.')] },
        { st: tr('ABC', 'DCB'), rs: RS.SSS, uses: [1, 2], wrong: [W(RS.SAS, 'No angle pair is known yet.', MC.beforeEst), W(RS.ASA, 'No angle pair is known yet.', MC.beforeEst)] },
        { st: an('ABC', 'DCB'), rs: RS.cpctc, uses: [3], wrong: [W(RS.rightCong, 'They are not known to be right angles yet: that comes next.', MC.circular)] },
        { st: 'm\\angle ABC = 90^\\circ', rs: RS.consSupp, uses: [4], wrong: [W(RS.rightCong, 'That is used once the angles are known to be right.', MC.circular), W(RS.cpctc, 'CPCTC gave congruent angles; consecutive angles are also supplementary, so each is 90°.', MC.someConds)] },
        { st: 'ABCD \\text{ is a rectangle}', rs: RS.rectTest, uses: [5], wrong: [W(RS.diagCongRect, 'That theorem goes the other way: rectangle to congruent diagonals.', MC.converse)] },
      ],
      decoys: [
        { st: `${ov('AC')} \\perp ${ov('DB')}`, mc: MC.congPerp, why: 'congruent diagonals need not be perpendicular.' },
        { st: 'm\\angle ABC = 90^\\circ\\ (\\text{Given})', mc: MC.circular, why: 'the right angle is what the proof must reach.' },
      ],
    };
    case 'isoDiag': return {
      id, roles: 'ABCD', name: 'The diagonals of an isosceles trapezoid are congruent',
      fig: qfig(makeQ(R, 'isoTrap', { turn }), [par('AB', 1), par('DC', 1), tick('AD', 1), tick('BC', 1)], { diags: 'whole' }),
      given: ['ABCD \\text{ is an isosceles trapezoid}', `${pl('AB', 'DC')},\\ ${cg('AD', 'BC')}`], prove: cg('AC', 'BD'),
      rows: [
        { st: cg('AD', 'BC'), rs: RS.given, uses: [], wrong: [W(RS.oppSides, 'An isosceles trapezoid is not a parallelogram; the legs are given congruent.', MC.upHier)] },
        { st: an('DAB', 'CBA'), rs: RS.isoBase, uses: [], wrong: [W(RS.altInt, 'These are base angles on the same base, not alternate interior angles.', MC.wrongPair), W(RS.consSupp, 'An isosceles trapezoid is not a parallelogram.', MC.upHier)] },
        { st: cg('AB', 'BA'), rs: RS.refl, uses: [], wrong: [W(RS.given, 'AB is shared: reflexive.')] },
        { st: tr('DAB', 'CBA'), rs: RS.SAS, uses: [1, 2, 3], wrong: [W(RS.SSS, 'BD ≅ AC is the conclusion.', MC.circular), W(RS.SSA, 'The base angle is between the two sides: SAS.', MC.ssa)] },
        { st: cg('DB', 'CA'), rs: RS.cpctc, uses: [4], wrong: [W(RS.diagBis, 'An isosceles trapezoid is not a parallelogram; its diagonals do not bisect each other.', MC.congBisect)] },
      ],
      decoys: [
        { st: cg('AE', 'EC'), mc: MC.congBisect, why: 'the diagonals of an isosceles trapezoid do not bisect each other.' },
        { st: pl('AD', 'BC'), mc: MC.upHier, why: 'the legs are not parallel; it is not a parallelogram.' },
      ],
    };
    case 'trapMid': {
      const Q = makeQ(R, 'trap', { turn });
      const M = lerpP(Q[0], Q[3], 0.5), N = lerpP(Q[1], Q[2], 0.5), P = lerpP(Q[0], Q[2], 0.5);
      void diagMeet;
      return {
        id, roles: 'ABCDMNP', name: 'The trapezoid midsegment theorem',
        fig: qfig(Q, [par('AB', 1), par('DC', 1), tick('AM', 1), tick('MD', 1), tick('BN', 2), tick('NC', 2), tick('AP', 3), tick('PC', 3)], { extraPts: { M, N, P }, extraSegs: ['AM', 'MD', 'BN', 'NC', 'AP', 'PC', 'MP', 'PN'], segStyle: { MP: { col: 'second' }, PN: { col: 'second' }, AD: { col: 'faint' }, BC: { col: 'faint' } } }),
        given: [`${pl('AB', 'DC')};\\ M, N, P \\text{ midpoints of } ${ov('AD')}, ${ov('BC')}, ${ov('AC')}`], prove: 'MN = \\tfrac{1}{2}(AB + DC)',
        rows: [
          { st: `${pl('MP', 'DC')},\\ MP = \\tfrac{1}{2}DC`, rs: RS.midThm, uses: [], wrong: [W(RS.given, 'Only the midpoints are given; parallel and half-length come from the theorem in △ADC.', MC.someConds)] },
          { st: `${pl('PN', 'AB')},\\ PN = \\tfrac{1}{2}AB`, rs: RS.midThm, uses: [], wrong: [W(RS.parTrans, 'PN is a midsegment of △CAB.')] },
          { st: pl('MP', 'AB'), rs: RS.parTrans, uses: [1], wrong: [W(RS.midThm, 'The theorem gave MP ∥ DC; with AB ∥ DC both are parallel to the same line.'), W(RS.altIntConv, 'No angles are used here.')] },
          { st: 'M, P, N \\text{ are collinear}', rs: RS.parPost, uses: [2, 3], wrong: [W(RS.segAdd, 'Segment addition needs P on MN first: that is what this line shows.', MC.beforeEst), W('It looks straight', 'Looks are not a reason.', MC.appearance)] },
          { st: 'MN = MP + PN', rs: RS.segAdd, uses: [4], wrong: [W(RS.midThm, 'That theorem is about one triangle; this adds the two pieces.')] },
          { st: 'MN = \\tfrac{1}{2}(AB + DC)', rs: RS.subst, uses: [1, 2, 5], wrong: [W(RS.midThm, 'The triangle theorem gives half of ONE side; this line substitutes both halves.', MC.trapAvg)] },
        ],
        decoys: [
          { st: 'MN = \\tfrac{1}{2}AB', mc: MC.trapAvg, why: 'the midsegment of a trapezoid averages BOTH bases.' },
          { st: 'MP = PN', mc: MC.appearance, why: 'nothing makes the two pieces equal; the bases differ.' },
        ],
      };
    }
  }
}
export function validOrder(p: { rows: { uses: number[] }[] }, order: number[]): boolean {
  if (order.length !== p.rows.length || new Set(order).size !== order.length) return false;
  const pos = new Map(order.map((r, i) => [r, i]));
  return p.rows.every((row, i) => row.uses.every(u => (pos.get(u) ?? 99) < (pos.get(i + 1) ?? -1))) && order[order.length - 1] === p.rows.length;
}
