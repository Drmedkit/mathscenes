// tcProofs.ts: the proofs of "Midsegments and points of concurrency" (pure). Each proof: Given / Prove (TeX), rows
// (statement TeX, reason, the rows it uses), decoy lines with their misconception, the wrong reasons a row may be
// confused with (never a second valid reason: AAS rows never offer ASA, HL rows never offer SSS), and an exact figure.
// The course's rule (as in triangle-congruence): a given is cited straight from the Given header; a given congruent
// pair is a row with the reason Given, a midpoint / bisector / perpendicular given is used through its definition.
// Role letters (A, B, C, D, E, F, G, M, N, P, Q, ...) are relabelled per item by the families.
import type { Fig, Pt } from '../geometry-foundations/geo';
import { add, at, dist, mul, sub, unit } from '../geometry-foundations/geo';
import { type Tri, centroidOf, circumcenterOf, footOf, incenterOf, makeTri, mid, sideMid } from './centers';
import { MC, arc, box, fig, lineEnds, tick } from './tkit';

export const RS = {
  given: 'Given',
  defMid: 'Definition of midpoint',
  defPerp: 'Definition of perpendicular lines',
  rightCong: 'All right angles are congruent',
  refl: 'Reflexive Property of Congruence',
  defBis: 'Definition of angle bisector',
  SAS: 'SAS', SSS: 'SSS', AAS: 'AAS', ASA: 'ASA', HL: 'HL', SSA: 'SSA',
  cpctc: 'CPCTC',
  linPair: 'Congruent angles in a linear pair are right angles',
  pbThm: 'Perpendicular Bisector Theorem',
  pbConv: 'Converse of the Perpendicular Bisector Theorem',
  abThm: 'Angle Bisector Theorem',
  abConv: 'Converse of the Angle Bisector Theorem',
  trans: 'Transitive Property',
  vert: 'Vertical Angles Theorem',
  altInt: 'Alternate Interior Angles Theorem',
  altIntConv: 'Converse of the Alternate Interior Angles Theorem',
  midThm: 'Midsegment Theorem',
  inside: 'Given (inside the triangle)',
  twoThirds: 'Two-thirds point of a median (proved)',
  onePoint: 'Only one point of a segment is two thirds of the way along it',
} as const;
export const MCX = { ...MC, beforeEst: 'mc.geometric-proof.uses-fact-before-established', wrongPair: 'mc.angles.cites-wrong-pair-name' } as const;

export interface WrongRs { t: string; mc?: string; say: string }
export interface PRow { st: string; rs: string; uses: number[]; wrong: WrongRs[] }
export interface PDecoy { st: string; mc: string; why: string }
export interface TCProof { id: ProofId; given: string[]; prove: string; rows: PRow[]; decoys: PDecoy[]; fig: Fig; roles: string }
export type ProofId = 'pbThm' | 'pbConv' | 'circConcur' | 'abThm' | 'abConv' | 'inConcur' | 'midA' | 'midB' | 'twoThirds' | 'medConcur';

const ov = (s: string) => `\\overline{${s}}`;
const cg = (a: string, b: string) => `${ov(a)} \\cong ${ov(b)}`;
const an = (a: string, b: string) => `\\angle ${a} \\cong \\angle ${b}`;
const tr = (a: string, b: string) => `\\triangle ${a} \\cong \\triangle ${b}`;
const W = (t: string, say: string, mc?: string): WrongRs => ({ t, say, mc });
const ri = (R: () => number, lo: number, hi: number) => lo + Math.floor(R() * (hi - lo + 1));
const rotAll = (P: Record<string, Pt>, deg: number): Record<string, Pt> => {
  const a = (deg * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  return Object.fromEntries(Object.entries(P).map(([k, p]) => [k, [p[0] * c - p[1] * s, p[0] * s + p[1] * c] as Pt]));
};

// ---------- figures ----------
function pbPts(R: () => number): Record<string, Pt> {
  const AM = ri(R, 150, 200), PM = ri(R, 190, 300) * (R() < 0.3 ? -1 : 1);
  return rotAll({ A: [-AM, 0], B: [AM, 0], M: [0, 0], P: [0, PM], X: [0, -Math.sign(PM) * 100], Y: [0, PM + Math.sign(PM) * 110] }, ri(R, -30, 30));
}
function abPts(R: () => number): Record<string, Pt> {
  const half = ri(R, 18, 30), AP = ri(R, 340, 400), A: Pt = [0, 0], P: Pt = [AP, 0];
  const u1 = at(A, half, 1), u2 = at(A, -half, 1);
  return rotAll({ A, P, E: footOf(P, A, u1), F: footOf(P, A, u2), B: mul(u1, AP * 1.35), C: mul(u2, AP * 1.35), X: [AP * 1.3, 0] }, ri(R, -40, 40));
}

export function makeTCProof(id: ProofId, R: () => number): TCProof {
  switch (id) {
    case 'pbThm': {
      const P = pbPts(R);
      return {
        id, roles: 'ABMP',
        fig: fig({ pts: P, bare: ['X', 'Y'], segs: ['AM', 'MB', 'XY', 'PA', 'PB'], marks: [tick('AM', 1), tick('MB', 1), box('YMB')], segStyle: { XY: { kind: 'line', name: 'ℓ' } } }),
        given: [`\\ell \\perp ${ov('AB')}\\text{ at its midpoint } M;\\ P \\text{ on } \\ell`], prove: cg('PA', 'PB'),
        rows: [
          { st: cg('AM', 'BM'), rs: RS.defMid, uses: [], wrong: [W(RS.refl, 'AM and BM are different segments; the midpoint makes them congruent.'), W(RS.defPerp, 'Perpendicular is about the angle, not the two halves.')] },
          { st: an('PMA', 'PMB'), rs: RS.defPerp, uses: [], wrong: [W(RS.vert, 'These angles form a linear pair, not vertical angles.', MCX.wrongPair), W(RS.defMid, 'The midpoint gives the two halves, not the angles.')] },
          { st: cg('PM', 'PM'), rs: RS.refl, uses: [], wrong: [W(RS.given, 'PM is not given as congruent to anything; it is shared by both triangles.'), W(RS.defMid, 'M is the midpoint of AB, not of PM.')] },
          { st: tr('PMA', 'PMB'), rs: RS.SAS, uses: [1, 2, 3], wrong: [W(RS.SSA, 'SSA is not a criterion; here the right angle is between the two sides: SAS.', MC.ssa), W(RS.SSS, 'Only two pairs of sides are known; PA ≅ PB is what we want to prove.', MC.circular), W(RS.HL, 'HL needs the hypotenuses PA and PB congruent: that is the conclusion.', MC.circular)] },
          { st: cg('PA', 'PB'), rs: RS.cpctc, uses: [4], wrong: [W(RS.given, 'PA ≅ PB is the claim to prove, not a given.', MC.circular), W(RS.pbThm, 'That is the theorem we are proving: it cannot be its own reason.', MC.circular)] },
        ],
        decoys: [
          { st: an('PAM', 'PBM'), mc: MCX.beforeEst, why: 'nothing gives ∠PAM ≅ ∠PBM yet; it only follows from the congruent triangles.' },
          { st: cg('PM', 'AM'), mc: MC.appearance, why: 'nothing marks PM ≅ AM; it only looks that way in this drawing.' },
        ],
      };
    }
    case 'pbConv': {
      const P = pbPts(R);
      return {
        id, roles: 'ABMP',
        fig: fig({ pts: P, bare: ['X', 'Y'], segs: ['AM', 'MB', 'PM', 'PA', 'PB'], marks: [tick('AM', 1), tick('MB', 1), tick('PA', 2), tick('PB', 2)] }),
        given: [`${cg('PA', 'PB')};\\ M \\text{ is the midpoint of } ${ov('AB')}`], prove: `\\overleftrightarrow{PM} \\perp ${ov('AB')}`,
        rows: [
          { st: cg('PA', 'PB'), rs: RS.given, uses: [], wrong: [W(RS.pbThm, 'The theorem goes the other way (on the bisector, so equidistant); here PA ≅ PB is simply given.', MC.converse)] },
          { st: cg('AM', 'BM'), rs: RS.defMid, uses: [], wrong: [W(RS.pbThm, 'Nothing is on a perpendicular bisector yet: M is given as the midpoint.', MC.converse)] },
          { st: cg('PM', 'PM'), rs: RS.refl, uses: [], wrong: [W(RS.given, 'PM is shared by both triangles: reflexive.')] },
          { st: tr('PMA', 'PMB'), rs: RS.SSS, uses: [1, 2, 3], wrong: [W(RS.SAS, 'No angle pair is known yet: three pairs of sides, SSS.', MCX.beforeEst), W(RS.HL, 'HL needs right angles, which is what we want to prove.', MC.circular), W(RS.SSA, 'SSA is not a criterion.', MC.ssa)] },
          { st: an('PMA', 'PMB'), rs: RS.cpctc, uses: [4], wrong: [W(RS.defPerp, 'Perpendicular is what we are proving; first the two angles are congruent by CPCTC.', MC.circular), W(RS.vert, 'They form a linear pair, not vertical angles.', MCX.wrongPair)] },
          { st: `\\overleftrightarrow{PM} \\perp ${ov('AB')}`, rs: RS.linPair, uses: [5], wrong: [W(RS.pbThm, 'That theorem starts from a point ON the bisector; here we must show P is on it.', MC.converse), W(RS.cpctc, 'CPCTC gives congruent angles; that they are right angles needs the linear pair.', MC.someConds)] },
        ],
        decoys: [
          { st: an('PMA', 'PMB') + '\\ (\\text{right angles})', mc: MC.circular, why: 'the right angles are what we must prove; they cannot be used before.' },
          { st: cg('PM', 'AM'), mc: MC.appearance, why: 'nothing marks PM ≅ AM.' },
        ],
      };
    }
    case 'circConcur': {
      const T = makeTri(R, R() < 0.7 ? 'acute' : 'obtuse', { at: 1, lo: 100, hi: 112 });
      const O = circumcenterOf(T), [A, B, C] = T;
      const D = mid(A, B), E = mid(B, C), F = mid(A, C);
      const ext = (M: Pt) => { const u = dist(O, M) > 1 ? unit(sub(O, M)) : [0, 1] as Pt; return lineEnds(M, u, 70, dist(O, M) + 80); };
      const [d0, d1] = ext(D), [e0, e1] = ext(E), [f0, f1] = ext(F);
      return {
        id, roles: 'ABCO',
        fig: fig({ pts: { A, B, C, O, D, E, F, u: d0, x: d1, v: e0, y: e1, w: f0, z: f1 }, bare: ['D', 'E', 'F', 'u', 'v', 'w', 'x', 'y', 'z'], segs: ['AD', 'DB', 'BE', 'EC', 'CF', 'FA', 'ux', 'vy', 'wz'], marks: [tick('AD', 1), tick('DB', 1), tick('BE', 2), tick('EC', 2), box('xDB'), box('yEC')], segStyle: { ux: { col: 'first' }, vy: { col: 'first' }, wz: { dash: true, col: 'faint' } }, body: 'ABC' }),
        given: ['\\ell_1, \\ell_2, \\ell_3 \\text{: the perpendicular bisectors of } \\overline{AB}, \\overline{BC}, \\overline{AC}', 'O \\text{ is on } \\ell_1 \\text{ and } \\ell_2'], prove: 'O \\text{ is on } \\ell_3',
        rows: [
          { st: 'OA = OB', rs: RS.pbThm, uses: [], wrong: [W(RS.pbConv, 'O is ON ℓ₁ (given); going from "on" to "equidistant" is the theorem itself.', MC.converse), W(RS.given, 'Only "O is on ℓ₁" is given; the distances follow from the theorem.', MC.noReason)] },
          { st: 'OB = OC', rs: RS.pbThm, uses: [], wrong: [W(RS.trans, 'Nothing to chain yet: O is on ℓ₂, the theorem gives this.'), W(RS.pbConv, 'From "on" to "equidistant" is the theorem, not the converse.', MC.converse)] },
          { st: 'OA = OC', rs: RS.trans, uses: [1, 2], wrong: [W(RS.pbThm, 'O is not known to be on ℓ₃: that is what we prove.', MC.circular), W(RS.given, 'It is not given; it follows from the two lines above.', MC.noReason)] },
          { st: 'O \\text{ is on } \\ell_3', rs: RS.pbConv, uses: [3], wrong: [W(RS.pbThm, 'The theorem starts from a point on the bisector; here we start from equal distances: the converse.', MC.converse), W('Two lines meet, so all three do', 'Two lines always meet somewhere; the third passing through needs OA = OC and the converse.', MC.twoMeet)] },
        ],
        decoys: [
          { st: '\\ell_1 \\text{ and } \\ell_2 \\text{ meet, so } \\ell_3 \\text{ does too}', mc: MC.twoMeet, why: 'two lines meeting says nothing about a third line.' },
          { st: 'O \\text{ looks central}', mc: MC.central, why: 'looks are not a reason (and for an obtuse triangle O is outside).' },
        ],
      };
    }
    case 'abThm': case 'abConv': {
      const P = abPts(R);
      const thm = id === 'abThm';
      return {
        id, roles: 'ABCEFP',
        fig: fig({ pts: P, bare: ['X'], segs: ['AB', 'AC', 'AP', 'PX', 'PE', 'PF'], marks: [...(thm ? [arc('BAP', 1), arc('PAC', 1)] : [tick('PE', 1), tick('PF', 1)]), box('AEP'), box('AFP')], segStyle: { AB: { kind: 'ray' }, AC: { kind: 'ray' }, PX: { kind: 'ray', col: 'faint' } } }),
        given: thm ? ['\\overrightarrow{AP} \\text{ bisects } \\angle BAC', `${ov('PE')} \\perp \\overrightarrow{AB},\\ ${ov('PF')} \\perp \\overrightarrow{AC}`] : [`P \\text{ inside } \\angle BAC;\\ ${cg('PE', 'PF')}`, `${ov('PE')} \\perp \\overrightarrow{AB},\\ ${ov('PF')} \\perp \\overrightarrow{AC}`],
        prove: thm ? cg('PE', 'PF') : an('EAP', 'FAP'),
        rows: thm ? [
          { st: an('EAP', 'FAP'), rs: RS.defBis, uses: [], wrong: [W(RS.rightCong, 'The right angles are at E and F, not at A.'), W(RS.vert, 'They are side by side, not vertical angles.', MCX.wrongPair)] },
          { st: an('AEP', 'AFP'), rs: RS.rightCong, uses: [], wrong: [W(RS.defBis, 'The bisector gives the angles at A, not at E and F.'), W(RS.cpctc, 'No triangles are congruent yet.', MCX.beforeEst)] },
          { st: cg('AP', 'AP'), rs: RS.refl, uses: [], wrong: [W(RS.given, 'AP is shared by both triangles: reflexive.')] },
          { st: tr('AEP', 'AFP'), rs: RS.AAS, uses: [1, 2, 3], wrong: [W(RS.SSA, 'SSA is not a criterion; two angles and a side: AAS.', MC.ssa), W(RS.HL, 'HL needs a pair of legs: PE ≅ PF is what we want to prove.', MC.circular), W(RS.SAS, 'Only one pair of sides is known.')] },
          { st: cg('PE', 'PF'), rs: RS.cpctc, uses: [4], wrong: [W(RS.abThm, 'That is the theorem being proved.', MC.circular), W(RS.given, 'PE ≅ PF is the conclusion, not a given.', MC.circular)] },
        ] : [
          { st: cg('PE', 'PF'), rs: RS.given, uses: [], wrong: [W(RS.abThm, 'Nothing is on a bisector yet: PE ≅ PF is given.', MC.converse)] },
          { st: '\\angle AEP, \\angle AFP \\text{ are right angles}', rs: RS.defPerp, uses: [], wrong: [W(RS.defBis, 'AP is not known to bisect anything yet.', MC.circular)] },
          { st: cg('AP', 'AP'), rs: RS.refl, uses: [], wrong: [W(RS.given, 'AP is shared by both triangles: reflexive.')] },
          { st: tr('AEP', 'AFP'), rs: RS.HL, uses: [1, 2, 3], wrong: [W(RS.AAS, 'Only one pair of angles (the right angles) is known.', MCX.beforeEst), W(RS.SSA, 'Say HL: with the right angles, hypotenuse AP and legs PE, PF, it is the right-triangle criterion.', MC.ssa), W(RS.SAS, 'The right angle is not between AP and PE.')] },
          { st: an('EAP', 'FAP'), rs: RS.cpctc, uses: [4], wrong: [W(RS.abThm, 'The theorem goes from "on the bisector" to "equidistant"; here it is the other way.', MC.converse), W(RS.defBis, 'That the angles are equal is what CPCTC gives; then AP is the bisector.', MC.circular)] },
        ],
        decoys: thm ? [
          { st: cg('AE', 'PE'), mc: MC.appearance, why: 'nothing marks AE ≅ PE.' },
          { st: cg('AP', 'PE'), mc: MC.slanted, why: 'AP runs to the vertex; it is not the distance to a side.' },
        ] : [
          { st: an('EAP', 'FAP') + '\\ (\\text{Given})', mc: MC.circular, why: 'that is what we must prove.' },
          { st: cg('AE', 'PE'), mc: MC.appearance, why: 'nothing marks AE ≅ PE.' },
        ],
      };
    }
    case 'inConcur': {
      const T = makeTri(R, R() < 0.7 ? 'acute' : 'obtuse', { at: 2, lo: 100, hi: 115 });
      const [A, B, C] = T, I = incenterOf(T), E = footOf(I, A, B), F = footOf(I, A, C), G = footOf(I, B, C);
      return {
        id, roles: 'ABCEFGI',
        fig: fig({ pts: { A, B, C, I, E, F, G }, segs: ['AE', 'EB', 'BG', 'GC', 'CF', 'FA', 'AI', 'BI', 'IE', 'IF', 'IG'], marks: [arc('EAI', 1), arc('IAF', 1), arc('EBI', 2), arc('IBG', 2), box('AEI'), box('AFI'), box('BGI')], segStyle: { IE: { col: 'faint' }, IF: { col: 'faint' }, IG: { col: 'faint' } }, body: 'ABC' }),
        given: ['\\text{bisectors of } \\angle A, \\angle B \\text{ meet at } I', `${ov('IE')}, ${ov('IF')}, ${ov('IG')} \\perp \\text{ the sides}`], prove: 'I \\text{ on the bisector of } \\angle C',
        rows: [
          { st: 'IE = IF', rs: RS.abThm, uses: [], wrong: [W(RS.abConv, 'I is ON the bisector of ∠A: from "on" to "equidistant" is the theorem.', MC.converse), W(RS.given, 'Only "I is on the bisector" is given.', MC.noReason)] },
          { st: 'IE = IG', rs: RS.abThm, uses: [], wrong: [W(RS.trans, 'Nothing to chain yet: I is on the bisector of ∠B.'), W(RS.abConv, 'From "on" to "equidistant" is the theorem.', MC.converse)] },
          { st: 'IF = IG', rs: RS.trans, uses: [1, 2], wrong: [W(RS.abThm, 'I is not known to be on the bisector of ∠C: that is the claim.', MC.circular)] },
          { st: 'I \\text{ is inside } \\angle C', rs: RS.inside, uses: [], wrong: [W(RS.abConv, 'This is a condition the converse needs, not its result.', MC.noHyp)] },
          { st: 'I \\text{ on the bisector of } \\angle C', rs: RS.abConv, uses: [3, 4], wrong: [W(RS.abThm, 'The theorem starts on the bisector; here we start from equal distances: the converse.', MC.converse), W('Two bisectors meet, so all three do', 'Two lines always meet; the third passing through needs IF = IG and the converse.', MC.twoMeet)] },
        ],
        decoys: [
          { st: '\\text{two bisectors meet, so all three do}', mc: MC.twoMeet, why: 'two lines meeting says nothing about a third.' },
          { st: 'IA = IB', mc: MC.swap, why: 'the incenter is equidistant from the SIDES, not the vertices.' },
        ],
      };
    }
    case 'midA': case 'midB': {
      const T = makeTri(R, R() < 0.7 ? 'acute' : 'obtuse', { at: 0, lo: 98, hi: 112 });
      const [A, B, C] = T, D = mid(A, B), E = mid(A, C), F = add(E, sub(E, D));
      const a = id === 'midA';
      return {
        id, roles: 'ABCDEF',
        fig: fig({ pts: { A, B, C, D, E, F }, segs: ['AD', 'DB', 'AE', 'EC', 'BC', 'DE', 'EF', 'CF', ...(a ? [] : ['DC'])], marks: [tick('AD', 1), tick('DB', 1), tick('AE', 2), tick('EC', 2), tick('DE', 3), tick('EF', 3)], segStyle: { EF: { col: 'second' }, CF: { col: 'second' }, ...(a ? {} : { DC: { col: 'faint' } }) }, body: 'ABC' }),
        given: a ? ['D, E \\text{ midpoints of } \\overline{AB}, \\overline{AC};\\ \\overline{EF} \\cong \\overline{DE}'] : ['D \\text{ midpoint of } \\overline{AB};\\ \\overline{CF} \\parallel \\overline{AB},\\ \\overline{CF} \\cong \\overline{AD}'],
        prove: a ? `${ov('CF')} \\parallel ${ov('AB')}` : `${ov('DF')} \\parallel ${ov('BC')},\\ DF = BC`,
        rows: a ? [
          { st: cg('AE', 'CE'), rs: RS.defMid, uses: [], wrong: [W(RS.vert, 'Vertical angles give angles, not segments.', MCX.wrongPair)] },
          { st: cg('DE', 'FE'), rs: RS.given, uses: [], wrong: [W(RS.defMid, 'E is the midpoint of AC, not of DF: EF ≅ DE is how F was placed (given).')] },
          { st: an('AED', 'CEF'), rs: RS.vert, uses: [], wrong: [W(RS.altInt, 'No parallel lines are known yet; the angles at E are vertical angles.', MCX.wrongPair)] },
          { st: tr('ADE', 'CFE'), rs: RS.SAS, uses: [1, 2, 3], wrong: [W(RS.SSA, 'The vertical angles are between the two sides: SAS.', MC.ssa), W(RS.SSS, 'AD ≅ CF is not known yet.', MCX.beforeEst)] },
          { st: an('ADE', 'CFE'), rs: RS.cpctc, uses: [4], wrong: [W(RS.altInt, 'That theorem needs parallel lines, which is what we prove.', MC.circular)] },
          { st: `${ov('CF')} \\parallel ${ov('AB')}`, rs: RS.altIntConv, uses: [5], wrong: [W(RS.altInt, 'That theorem starts from parallel lines; equal alternate interior angles give parallel lines: the converse.', MC.converse), W(RS.midThm, 'That is the theorem we are proving.', MC.circular)] },
        ] : [
          { st: cg('CF', 'DB'), rs: RS.trans, uses: [], wrong: [W(RS.given, 'CF ≅ AD is given; with AD ≅ DB (midpoint) it gives CF ≅ DB.', MC.noReason)] },
          { st: an('BDC', 'FCD'), rs: RS.altInt, uses: [], wrong: [W(RS.altIntConv, 'Here the lines are known to be parallel and we conclude equal angles: the theorem itself.', MC.converse), W(RS.vert, 'The angles are at different points, D and C.', MCX.wrongPair)] },
          { st: cg('DC', 'DC'), rs: RS.refl, uses: [], wrong: [W(RS.defMid, 'DC is shared by both triangles: reflexive.')] },
          { st: tr('DBC', 'CFD'), rs: RS.SAS, uses: [1, 2, 3], wrong: [W(RS.SSA, 'The angle is between the two sides: SAS.', MC.ssa), W(RS.ASA, 'Only one angle pair is known.')] },
          { st: cg('DF', 'BC'), rs: RS.cpctc, uses: [4], wrong: [W(RS.midThm, 'That is the theorem being proved.', MC.circular)] },
          { st: an('DCB', 'CDF'), rs: RS.cpctc, uses: [4], wrong: [W(RS.altInt, 'DF ∥ BC is not known yet.', MC.circular)] },
          { st: `${ov('DF')} \\parallel ${ov('BC')}`, rs: RS.altIntConv, uses: [6], wrong: [W(RS.altInt, 'Equal alternate interior angles give parallel lines: the converse.', MC.converse)] },
        ],
        decoys: a ? [
          { st: `${ov('DE')} \\parallel ${ov('BC')}`, mc: MC.circular, why: 'that is the theorem we are proving; it cannot be a step yet.' },
          { st: cg('AD', 'AE'), mc: MC.appearance, why: 'nothing marks AD ≅ AE.' },
        ] : [
          { st: `DE = \\tfrac12 BC`, mc: MC.circular, why: 'that is the conclusion of the whole theorem.' },
          { st: cg('DB', 'DC'), mc: MC.appearance, why: 'nothing marks DB ≅ DC.' },
        ],
      };
    }
    case 'twoThirds': {
      const T = makeTri(R, 'acute', { at: 2 });
      const [A, B, C] = T, M = sideMid(T, 0), N = sideMid(T, 1), G = centroidOf(T), P = mid(A, G), Q = mid(B, G);
      return {
        id, roles: 'ABCGMNPQ',
        fig: fig({ pts: { A, B, C, M, N, G, P, Q }, segs: ['AB', 'BM', 'MC', 'CN', 'NA', 'AP', 'PG', 'GM', 'BQ', 'QG', 'GN', 'PQ', 'MN'], marks: [tick('BM', 1), tick('MC', 1), tick('CN', 2), tick('NA', 2), tick('AP', 3), tick('PG', 3)], segStyle: { PQ: { col: 'second' }, MN: { col: 'second' } }, body: 'ABC' }),
        given: ['\\text{medians } \\overline{AM}, \\overline{BN} \\text{ meet at } G', 'P, Q \\text{: midpoints of } \\overline{AG}, \\overline{BG}'], prove: 'GP = GM \\ (\\text{so } AG = 2\\,GM)',
        rows: [
          { st: 'PQ \\parallel AB,\\ PQ = \\tfrac12 AB', rs: RS.midThm, uses: [], wrong: [W(RS.defMid, 'The midpoints are given; parallel and half-length come from the Midsegment Theorem.', MC.someConds)] },
          { st: 'MN \\parallel AB,\\ MN = \\tfrac12 AB', rs: RS.midThm, uses: [], wrong: [W(RS.twoThirds, 'That is what we are proving.', MC.circular)] },
          { st: 'PQ \\parallel MN,\\ PQ = MN', rs: RS.trans, uses: [1, 2], wrong: [W(RS.midThm, 'Each line above used the theorem once; this line chains them.')] },
          { st: an('GPQ', 'GMN'), rs: RS.altInt, uses: [3], wrong: [W(RS.vert, 'The vertical angles are at G; these are at P and M.', MCX.wrongPair), W(RS.altIntConv, 'The lines are already parallel; the theorem gives the equal angles.', MC.converse)] },
          { st: an('GQP', 'GNM'), rs: RS.altInt, uses: [3], wrong: [W(RS.vert, 'These angles are at Q and N, not at one point.', MCX.wrongPair)] },
          { st: tr('GPQ', 'GMN'), rs: RS.ASA, uses: [3, 4, 5], wrong: [W(RS.SSA, 'The side PQ is between the two angles: ASA.', MC.ssa), W(RS.SSS, 'Only one pair of sides is known.')] },
          { st: 'GP = GM', rs: RS.cpctc, uses: [6], wrong: [W(RS.twoThirds, 'That is the statement being proved: circular.', MC.circular), W(RS.defMid, 'G is not given as the midpoint of PM.', MC.appearance)] },
        ],
        decoys: [
          { st: 'AG = 2\\,GM\\ (\\text{centroid})', mc: MC.circular, why: 'that is the theorem we are proving.' },
          { st: 'GP = GQ', mc: MC.appearance, why: 'nothing makes GP and GQ equal.' },
        ],
      };
    }
    case 'medConcur': {
      const T = makeTri(R, R() < 0.7 ? 'acute' : 'obtuse', { at: ri(R, 0, 2), lo: 100, hi: 115 });
      const [A, B, C] = T, M = sideMid(T, 0), N = sideMid(T, 1), K = sideMid(T, 2), G = centroidOf(T);
      return {
        id, roles: 'ABCGKMN',
        fig: fig({ pts: { A, B, C, M, N, K, G }, segs: ['AK', 'KB', 'BM', 'MC', 'CN', 'NA', 'AM', 'BN', 'CK'], marks: [tick('BM', 1), tick('MC', 1), tick('CN', 2), tick('NA', 2), tick('AK', 3), tick('KB', 3)], body: 'ABC' }),
        given: ['\\overline{AM}, \\overline{BN}, \\overline{CK} \\text{ medians}', '\\overline{AM} \\text{ meets } \\overline{BN} \\text{ at } G, \\overline{CK} \\text{ at } G\''], prove: "G = G'",
        rows: [
          { st: 'AG = \\tfrac23 AM', rs: RS.twoThirds, uses: [], wrong: [W(RS.defMid, 'G is not the midpoint of AM.', MC.bisects)] },
          { st: "AG' = \\tfrac23 AM", rs: RS.twoThirds, uses: [], wrong: [W(RS.trans, 'Nothing to chain yet: the two-thirds theorem applies to medians AM and CK.')] },
          { st: "G = G'", rs: RS.onePoint, uses: [1, 2], wrong: [W('Two lines meet, so all three do', 'Two medians meeting says nothing about the third; both points are two thirds along AM.', MC.twoMeet), W(RS.given, "G = G' is the claim.", MC.circular)] },
        ],
        decoys: [{ st: '\\text{three medians usually miss each other}', mc: MC.thirdMiss, why: 'the argument shows they always meet.' }],
      };
    }
  }
}
export const TC_BANK: ProofId[] = ['pbThm', 'pbConv', 'circConcur', 'abThm', 'abConv', 'inConcur', 'midA', 'midB', 'twoThirds', 'medConcur'];
export function validOrder(p: { rows: { uses: number[] }[] }, order: number[]): boolean {
  if (order.length !== p.rows.length || new Set(order).size !== order.length) return false;
  const pos = new Map(order.map((r, i) => [r, i]));
  return p.rows.every((row, i) => row.uses.every(u => (pos.get(u) ?? 99) < (pos.get(i + 1) ?? -1))) && order[order.length - 1] === p.rows.length;
}
void ri;
