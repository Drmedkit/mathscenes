// cProofs.ts: the proofs and justified chains of "Arcs and angles in circles" (pure). Each: Given / Prove (TeX), rows
// (statement TeX, reason, rows it uses, wrong reasons it may be confused with: never a second valid one), decoy lines
// with their misconception, and an exact circle figure (cfig.ts).
//   inscribed     base case (the center on a side), sum case (center inside; acute, and obtuse on a major arc),
//                 difference case (center outside)
//   cyclic        opposite angles of an inscribed quadrilateral (symbolic arcs u + v = 360)
//   chord angles  two chords inside (auxiliary chord: exterior angle), two secants outside (exterior angle of the
//                 triangle at P), tangent-chord (diameter through the point of tangency)
//   chains        numeric solutions in which every step cites a theorem and its condition (one uses a converse)
// Role letters A, B, C, D, E, P, Q, T (O is the center) are relabelled per item by the families.
import { type CSpec, R0, cfig, type CFig } from './cfig';
import { cross, placeCcw, splitArcs } from './cconf';
import { MC, r } from './ckit';
import { add, dirv, mul } from '../geometry-foundations/geo';
import { secSecConf } from './famB';

export const RS = {
  given: 'Given',
  radii: 'All radii of a circle are congruent',
  isoBase: 'Isosceles base angles are congruent',
  divProp: 'Division Property of Equality',
  extAngle: 'Exterior Angle Theorem',
  triSum: 'Triangle Angle Sum Theorem',
  subst: 'Substitution Property',
  arcDef: 'Definition of arc measure',
  inscribed: 'Inscribed Angle Theorem',
  baseCase: 'Base case (center on a side)',
  angleAdd: 'Angle Addition Postulate',
  arcAdd: 'Arc Addition Postulate',
  vert: 'Vertical Angles Theorem',
  tanPerp: 'Tangent ⊥ radius at point of tangency',
  tanChord: 'Tangent-chord angle = ½ its arc',
  cyclic: 'Inscribed quadrilateral theorem',
  rightConv: 'Converse: right inscribed angle → diameter',
  semi: 'Inscribed angle on a semicircle is right',
  semiArc: 'Diameter cuts off a semicircle (180°)',
  addProp: 'Addition Property of Equality',
  central: 'Central angle = its arc',
  defInscribed: 'Definition of inscribed polygon',
} as const;

export interface WrongRs { t: string; mc?: string; say: string }
export interface PRow { st: string; rs: string; uses: number[]; wrong: WrongRs[] }
export interface PDecoy { st: string; mc: string; why: string }
export interface CProof { id: CProofId; given: string[]; prove: string; rows: PRow[]; decoys: PDecoy[]; fig: CFig; roles: string; name: string }
export type CProofId = 'base' | 'sum' | 'sumObtuse' | 'diff' | 'cyclic' | 'chordIn' | 'chordOut' | 'tanChord' | 'chainTan' | 'chainConv' | 'chainCyc';
export const CHAINS: CProofId[] = ['chainTan', 'chainConv', 'chainCyc'];

const W = (t: string, say: string, mc?: string): WrongRs => ({ t, say, mc });
const ma = (s: string) => `m\\angle ${s}`;
const arc = (s: string) => `m\\overparen{${s}}`;
const H = '\\tfrac{1}{2}';
const CIRC = W(RS.inscribed, 'That is the theorem being proved: it cannot be used in its own proof.', MC.circular);

/** proof TeX -> panel text */
export function texHtml(s: string): string {
  return s.replace(/m\\overparen\{([A-Z]+)\}/g, 'm(arc $1)').replace(/\\overparen\{([A-Z]+)\}/g, 'arc $1').replace(/\\overleftrightarrow\{([A-Z]+)\}/g, 'line $1')
    .replace(/\\tfrac\{1\}\{2\}/g, '½').replace(/\\tfrac\{([^{}]*)\}\{([^{}]*)\}/g, (_, a: string, b: string) => (/\s/.test(a.trim()) ? `(${a.trim()})/${b}` : `${a}/${b}`)).replace(/\\triangle\s*/g, '△').replace(/\\text\{([^}]*)\}/g, '$1')
    .replace(/\\overline\{([^}]*)\}/g, (_, x: string) => [...x].map(ch => ch + '̅').join(''))
    .replace(/m\\angle\s*/g, 'm∠').replace(/\\angle\s*/g, '∠').replace(/\^\\circ/g, '°').replace(/\\cdot/g, '·').replace(/\\perp/g, '⊥').replace(/\\ell/g, 'ℓ')
    .replace(/\\[,;: ]/g, ' ').replace(/[{}]/g, '').replace(/(^|[\s(=+])-(?=[\d\s(])/g, '$1−').replace(/\s+/g, ' ').trim();
}

export function makeProof(id: CProofId, R: () => number): CProof {
  const th = r(R, 0, 359);
  switch (id) {
    case 'base': {
      const a = r(R, 50, 130);
      const fig = cfig({ center: 'O', on: { C: th, B: th + 180, A: th + 180 + a }, segs: ['CB', 'CA', 'OA'], angles: [{ id: 'ACB', col: 'second', r: 64 }, { id: 'AOB', col: 'first', r: 46 }], arcs: [{ from: 'B', to: 'A', col: 'link', thin: true }] });
      return {
        id, roles: 'ABC', name: 'the base case of the Inscribed Angle Theorem', fig,
        given: ['\\overline{CB} \\text{ is a diameter of circle } O', `A \\text{ is on the circle};\\ x = ${ma('ACB')}`], prove: `x = ${H}\\,${arc('AB')}`,
        rows: [
          { st: 'OA = OC', rs: RS.radii, uses: [], wrong: [W(RS.given, 'Only the diameter and point A are given; OA and OC are equal because both are radii.'), W(RS.isoBase, 'Base angles come next; first the two sides must be known equal.', MC.beforeEst)] },
          { st: `${ma('OAC')} = x`, rs: RS.isoBase, uses: [1], wrong: [W(RS.vert, '∠OAC and ∠OCA are at different vertices, not a vertical pair.'), CIRC] },
          { st: `${ma('AOB')} = 2x`, rs: RS.extAngle, uses: [2], wrong: [W(RS.triSum, 'The angle sum gives 180°; ∠AOB is OUTSIDE △OAC: the exterior angle equals x + x.'), W(RS.angleAdd, '∠AOB is not split into these two angles; it is the exterior angle of △OAC.')] },
          { st: `${arc('AB')} = 2x`, rs: RS.arcDef, uses: [3], wrong: [CIRC, W(RS.radii, 'Radii are lengths; an arc measure is its central angle by definition.')] },
          { st: `x = ${H}\\,${arc('AB')}`, rs: RS.divProp, uses: [4], wrong: [CIRC, W(RS.baseCase, 'This IS the base case being proved.', MC.circular)] },
        ],
        decoys: [
          { st: `x = ${H}\\,${arc('AB')} \\text{ (Inscribed Angle Theorem)}`, mc: MC.circular, why: 'it uses the theorem being proved.' },
          { st: 'OA = AC', mc: MC.appearance, why: 'nothing makes OA equal to AC; the equal sides are the radii OA and OC.' },
        ],
      };
    }
    case 'sum': case 'sumObtuse': case 'diff': {
      const obt = id === 'sumObtuse', dif = id === 'diff';
      const D = th + 180;
      let A: number, B: number;
      if (dif) { const p = r(R, 80, 150), q = r(R, 25, p - 30); A = D + p; B = D + q; }
      else { const p = obt ? r(R, 95, 125) : r(R, 30, 75), q = obt ? r(R, 95, 125) : r(R, 30, 75); A = D - p; B = D + q; }
      const big = obt ? 'ADB' : 'AB', sg = dif ? '-' : '+';
      const fig = cfig({ center: 'O', on: { C: th, D, A, B }, segs: ['CA', 'CB', { id: 'CD', dash: true, col: 'pick' }],
        angles: dif ? [{ id: 'ACD', col: 'first', r: 92 }, { id: 'BCD', col: 'second', r: 70 }] : [{ id: 'ACD', col: 'first', r: obt ? 74 : 92 }, { id: 'DCB', col: 'second', r: obt ? 58 : 70 }],
        arcs: dif ? [{ from: 'D', to: 'A', col: 'first', thin: true }, { from: 'D', to: 'B', col: 'second', thin: true }] : [{ from: 'A', to: 'D', col: 'first', thin: true }, { from: 'D', to: 'B', col: 'second', thin: true }] });
      const yA = dif ? 'BCD' : 'DCB', bA = dif ? 'BD' : 'DB';
      return {
        id, roles: 'ABCD', name: dif ? 'the Inscribed Angle Theorem, center outside the angle' : obt ? 'the Inscribed Angle Theorem, center inside an obtuse angle' : 'the Inscribed Angle Theorem, center inside the angle', fig,
        given: [`A, B, C \\text{ on circle } O;\\ O \\text{ ${dif ? 'outside' : 'inside'} } \\angle ACB;\\ \\overline{CD} \\text{ a diameter}`, `w = ${ma('ACB')},\\ x = ${ma('ACD')},\\ y = ${ma(yA)}`, `a = ${arc('AD')},\\ b = ${arc(bA)}`], prove: `${ma('ACB')} = ${H}\\,${arc(big)}`,
        rows: [
          { st: `x = ${H}a`, rs: RS.baseCase, uses: [], wrong: [CIRC, W(RS.central, '∠ACD is inscribed (vertex C on the circle), not central.')] },
          { st: `y = ${H}b`, rs: RS.baseCase, uses: [], wrong: [CIRC, W(RS.radii, 'The base case, with the center on side CD, gives this.')] },
          { st: `w = x ${sg} y`, rs: RS.angleAdd, uses: [], wrong: [W(RS.arcAdd, 'These are angles, not arcs.'), W(RS.extAngle, dif ? '∠ACD is made of ∠ACB and ∠BCD: angle addition.' : 'Ray CD splits ∠ACB in two: angle addition.')] },
          { st: `${arc(big)} = a ${sg} b`, rs: RS.arcAdd, uses: [], wrong: [W(RS.angleAdd, 'These are arcs: arc addition.'), ...(obt ? [W('No theorem covers a major arc', 'Arc addition works for a major arc too: no separate theorem.', MC.majorSeparate)] : [W(RS.semiArc, dif ? 'Arc AD is made of arc AB and arc BD: arc addition.' : 'D splits arc AB; nothing here is a semicircle.')])] },
          { st: `w = ${H}(a ${sg} b)`, rs: RS.subst, uses: [1, 2, 3], wrong: [CIRC, W(RS.addProp, 'Lines 1 and 2 are substituted into line 3.')] },
          { st: `w = ${H}\\,${arc(big)}`, rs: RS.subst, uses: [4, 5], wrong: [CIRC, W(RS.arcDef, 'Line 4 is substituted into line 5.')] },
        ],
        decoys: dif ? [
          { st: 'w = x + y', mc: MC.diffAdded, why: 'O is outside: ∠BCD is part of ∠ACD, so it is SUBTRACTED.' },
          { st: `${arc('AB')} = a + b`, mc: MC.diffAdded, why: 'arc BD is part of arc AD: subtract it.' },
        ] : [
          { st: 'w = x - y', mc: MC.caseSplit, why: 'O is inside the angle: ray CD splits it, so the parts ADD (subtracting is the center-outside case).' },
          { st: `w = ${H}\\,${arc(big)} \\text{ (Inscribed Angle Theorem)}`, mc: MC.circular, why: 'it uses the theorem being proved.' },
        ],
      };
    }
    case 'cyclic': {
      const arcs = splitArcs(R, 4, 50, 130);
      const [A, B, C, D] = placeCcw(th, arcs);
      const fig = cfig({ center: null, on: { A: A!, B: B!, C: C!, D: D! }, segs: ['AB', 'BC', 'CD', 'DA'], angles: [{ id: 'DAB', col: 'first', r: 56 }, { id: 'BCD', col: 'second', r: 56 }], arcs: [{ from: 'B', to: 'D', col: 'first', thin: true }, { from: 'D', to: 'B', col: 'second', thin: true }] });
      return {
        id, roles: 'ABCD', name: 'opposite angles of an inscribed quadrilateral are supplementary', fig,
        given: ['ABCD \\text{ is inscribed in a circle}', `u = ${arc('BCD')},\\ v = ${arc('DAB')}`], prove: `${ma('A')} + ${ma('C')} = 180^\\circ`,
        rows: [
          { st: 'u + v = 360^\\circ', rs: RS.arcAdd, uses: [], wrong: [W(RS.semiArc, 'The two arcs are not semicircles in general; together they make the whole circle.'), W(RS.cyclic, 'That is what we are proving.', MC.circular)] },
          { st: `${ma('A')} = ${H}u`, rs: RS.inscribed, uses: [], wrong: [W(RS.central, '∠A has its vertex on the circle: inscribed, half its arc.'), W(RS.cyclic, 'That is the conclusion.', MC.circular)] },
          { st: `${ma('C')} = ${H}v`, rs: RS.inscribed, uses: [], wrong: [W(RS.vert, '∠A and ∠C are not vertical angles.'), W(RS.cyclic, 'That is the conclusion.', MC.circular)] },
          { st: `${ma('A')} + ${ma('C')} = \\tfrac{u + v}{2}`, rs: RS.addProp, uses: [2, 3], wrong: [W(RS.angleAdd, '∠A and ∠C are not adjacent: the two equations are added.'), W(RS.subst, 'Nothing is replaced yet: the two equations are added.')] },
          { st: `${ma('A')} + ${ma('C')} = 180^\\circ`, rs: RS.subst, uses: [1, 4], wrong: [W(RS.cyclic, 'That is the theorem being proved.', MC.circular), W(RS.triSum, 'No triangle: u + v = 360° is substituted.')] },
        ],
        decoys: [
          { st: `${ma('A')} = ${ma('C')}`, mc: MC.cyclicEqual, why: 'opposite angles of an inscribed quadrilateral are supplementary, not congruent (that is a parallelogram).' },
          { st: '70^\\circ + 110^\\circ = 180^\\circ \\text{ (checked)}', mc: MC.examples, why: 'one example is not a proof for every inscribed quadrilateral.' },
        ],
      };
    }
    case 'chordIn': {
      const arcs = splitArcs(R, 4, 50, 130);
      const [A, B, C, D] = placeCcw(th, arcs);
      const E = cross(mul(dirv(A!), R0), mul(dirv(C!), R0), mul(dirv(B!), R0), mul(dirv(D!), R0));
      const fig = cfig({ center: null, on: { A: A!, B: B!, C: C!, D: D! }, pts: { E }, segs: ['AC', 'BD', { id: 'AD', dash: true, col: 'pick' }], angles: [{ id: 'AEB', col: 'link', r: 46 }], arcs: [{ from: 'A', to: 'B', col: 'first', thin: true }, { from: 'C', to: 'D', col: 'second', thin: true }] });
      return {
        id, roles: 'ABCDE', name: 'the angle of two chords is half the sum of the arcs', fig,
        given: ['\\text{chords } \\overline{AC},\\ \\overline{BD} \\text{ meet at } E;\\ \\overline{AD} \\text{ drawn}', `a = ${arc('AB')},\\ c = ${arc('CD')}`, `x = ${ma('CAD')},\\ y = ${ma('BDA')}`], prove: `${ma('AEB')} = ${H}(a + c)`,
        rows: [
          { st: `x = ${H}c`, rs: RS.inscribed, uses: [], wrong: [W(RS.central, '∠CAD has its vertex on the circle: inscribed.'), W(RS.extAngle, '∠CAD is inscribed in the circle: half its arc.')] },
          { st: `y = ${H}a`, rs: RS.inscribed, uses: [], wrong: [W(RS.central, '∠BDA has its vertex on the circle: inscribed.'), W(RS.isoBase, 'No isosceles triangle here: ∠BDA is inscribed.')] },
          { st: `${ma('AEB')} = x + y`, rs: RS.extAngle, uses: [], wrong: [W(RS.triSum, '∠AEB is outside △AED: the exterior angle equals the two remote interior angles.'), W(RS.vert, 'The vertical angle of ∠AEB is ∠CED; this line is about △AED.')] },
          { st: `${ma('AEB')} = ${H}(a + c)`, rs: RS.subst, uses: [1, 2, 3], wrong: [W(RS.inscribed, 'E is inside the circle, not on it: ∠AEB is not inscribed.', MC.insideInscribed), W(RS.arcAdd, 'Arcs AB and CD are not adjacent: lines 1 and 2 are substituted.')] },
        ],
        decoys: [
          { st: `${ma('AEB')} = ${H}a`, mc: MC.firstArc, why: 'E is not on the circle: the inscribed rule does not apply to ∠AEB.' },
          { st: `${ma('AEB')} = a + c`, mc: MC.notHalved, why: 'each inscribed angle is HALF its arc.' },
        ],
      };
    }
    case 'chordOut': {
      const c = secSecConf(R);
      const fig = cfig({ center: null, on: c.on, pts: { P: c.P }, segs: ['PD', 'PC', { id: 'AC', dash: true, col: 'pick' }], angles: [{ id: 'APC', col: 'link', r: 60 }], arcs: [{ from: 'A', to: 'B', col: 'first', thin: true }, { from: 'C', to: 'D', col: 'second', thin: true }] });
      return {
        id, roles: 'ABCDP', name: 'the angle of two secants is half the difference of the arcs', fig,
        given: ['\\text{secants } PAD,\\ PBC;\\ \\overline{AC} \\text{ drawn}', `a = ${arc('AB')},\\ d = ${arc('CD')}`, `x = ${ma('DAC')},\\ y = ${ma('ACP')}`], prove: `${ma('APC')} = ${H}(d - a)`,
        rows: [
          { st: `x = ${H}d`, rs: RS.inscribed, uses: [], wrong: [W(RS.extAngle, '∠DAC has its vertex A on the circle and intercepts arc CD: inscribed.'), W(RS.central, 'A is on the circle, not the center.')] },
          { st: `y = ${H}a`, rs: RS.inscribed, uses: [], wrong: [W(RS.central, 'C is on the circle, not the center.'), W(RS.tanChord, 'No tangent here: ∠ACP is inscribed.')] },
          { st: `x = ${ma('APC')} + y`, rs: RS.extAngle, uses: [], wrong: [W(RS.triSum, '∠DAC is outside △PAC at A: exterior angle.'), W(RS.inscribed, 'This line is about △PAC: its exterior angle at A.')] },
          { st: `${ma('APC')} = ${H}(d - a)`, rs: RS.subst, uses: [1, 2, 3], wrong: [W(RS.inscribed, 'P is outside the circle: ∠APC is not inscribed.', MC.inscribedOff), W(RS.arcAdd, 'Lines 1 and 2 are substituted into line 3 and solved for ∠APC.')] },
        ],
        decoys: [
          { st: `${ma('APC')} = ${H}(d + a)`, mc: MC.interiorRule, why: 'P is outside: the near arc is SUBTRACTED.' },
          { st: `${ma('APC')} = ${ma('ADC')}`, mc: MC.auxChord, why: 'the auxiliary chord AC makes △PAC; ∠ADC is not one of its angles.' },
        ],
      };
    }
    case 'tanChord': {
      const m = r(R, 60, 150), T = th, Q = add(mul(dirv(T), R0), mul(dirv(T + 90), R0 * 0.75));
      const fig = cfig({ center: 'O', on: { T, A: T + m, D: T + 180 }, pts: { Q }, segs: ['TA', 'AD', { id: 'TD', dash: true, col: 'pick' }, { id: 'TQ', kind: 'line', ext: [R0 * 0.7, R0 * 0.1], col: 'ink' }], angles: [{ id: 'ATQ', col: 'link', r: 64 }], arcs: [{ from: 'T', to: 'A', col: 'first', thin: true }] });
      return {
        id, roles: 'ADQT', name: 'the tangent-chord angle is half its arc', fig,
        given: ['\\overleftrightarrow{TQ} \\text{ tangent at } T;\\ \\overline{TD} \\text{ a diameter}', `t = ${arc('TA')},\\ y = ${ma('ATD')}`], prove: `${ma('ATQ')} = ${H}\\,${arc('TA')}`,
        rows: [
          { st: `${ma('DTQ')} = 90^\\circ`, rs: RS.tanPerp, uses: [], wrong: [W(RS.semi, 'The right angle at T is between the tangent and the diameter TD (a radius line).', MC.rightWrongV), W(RS.given, 'Only the tangent is given; the right angle follows from it.')] },
          { st: `y = ${H}\\,${arc('AD')}`, rs: RS.inscribed, uses: [], wrong: [W(RS.tanChord, 'That is the theorem being proved.', MC.circular), W(RS.central, 'T is on the circle: ∠ATD is inscribed.')] },
          { st: `${arc('AD')} = 180^\\circ - t`, rs: RS.semiArc, uses: [], wrong: [W(RS.arcDef, 'Arc TA and arc AD make the semicircle cut off by diameter TD.'), W(RS.inscribed, 'This is about arcs: TD cuts off a semicircle.')] },
          { st: `${ma('ATQ')} = 90^\\circ - y`, rs: RS.angleAdd, uses: [1], wrong: [W(RS.triSum, 'No triangle: ∠DTQ is split by ray TA.'), W(RS.vert, 'No vertical angles here.')] },
          { st: `${ma('ATQ')} = ${H}t`, rs: RS.subst, uses: [2, 3, 4], wrong: [W(RS.tanChord, 'That is what is being proved.', MC.circular), W(RS.inscribed, 'The tangent side is not a chord: ∠ATQ is not inscribed.')] },
        ],
        decoys: [
          { st: `${ma('ATQ')} = t`, mc: MC.fullArc, why: 'T is on the circle: the angle is half its arc, not the whole arc.' },
          { st: `${ma('OAT')} = 90^\\circ`, mc: MC.perpAny, why: 'the right angle is at T, the point of tangency, not at A.' },
        ],
      };
    }
    case 'chainTan': {
      const m = 2 * r(R, 25, 70), t = m / 2, Q = add(mul(dirv(th), R0), mul(dirv(th + 90), R0 * 0.75));
      const fig = cfig({ center: 'O', on: { A: th, B: th + m }, pts: { Q }, segs: ['AB', 'OA', 'OB', { id: 'AQ', kind: 'line', ext: [R0 * 0.7, R0 * 0.1], col: 'ink' }], angles: [{ id: 'BAQ', col: 'first', text: `${t}°`, r: 70 }] });
      return {
        id, roles: 'ABQ', name: `m∠OBA when m∠BAQ = ${t}°`, fig,
        given: ['\\overleftrightarrow{AQ} \\text{ tangent to circle } O \\text{ at } A', `${ma('BAQ')} = ${t}^\\circ`], prove: `${ma('OBA')} = ${90 - t}^\\circ`,
        rows: [
          { st: `${arc('AB')} = ${m}^\\circ`, rs: RS.tanChord, uses: [], wrong: [W(RS.inscribed, 'A side of ∠BAQ is the tangent, not a chord: use the tangent-chord theorem (its condition: AQ tangent at A).', MC.noHyp), W(RS.central, '∠BAQ is not at the center.')] },
          { st: `${ma('AOB')} = ${m}^\\circ`, rs: RS.central, uses: [1], wrong: [W(RS.inscribed, '∠AOB has its vertex at the center O: it EQUALS its arc.', MC.doubled), W(RS.tanPerp, 'The tangent is not part of ∠AOB.')] },
          { st: 'OA = OB', rs: RS.radii, uses: [], wrong: [W(RS.given, 'Not given: OA and OB are equal because both are radii.', MC.noReason), W(RS.isoBase, 'That gives equal angles; first the sides.', MC.beforeEst)] },
          { st: `${ma('OBA')} = ${ma('OAB')}`, rs: RS.isoBase, uses: [3], wrong: [W(RS.tanPerp, 'The right angle is ∠OAQ; this line is about the isosceles triangle OAB.'), W(RS.vert, 'Not a vertical pair.')] },
          { st: `${ma('OBA')} = ${90 - t}^\\circ`, rs: RS.triSum, uses: [2, 4], wrong: [W(RS.extAngle, 'The three angles of △OAB add to 180°.'), W(RS.tanChord, 'Already used in line 1.')] },
        ],
        decoys: [{ st: `${ma('OBA')} = ${t}^\\circ`, mc: MC.appearance, why: 'nothing makes ∠OBA equal to the tangent-chord angle.' }],
      };
    }
    case 'chainConv': {
      const c = r(R, 40, 140), C = th + 180 + c, Dd = th + r(R, 30, 150);
      const fig = cfig({ center: null, on: { A: th, B: th + 180, C, D: Dd }, segs: ['AB', 'CA', 'CB', 'DA', 'DB'], angles: [{ id: 'ACB', col: 'first', text: '90°', r: 46 }, { id: 'ADB', col: 'link', r: 46 }] });
      return {
        id, roles: 'ABCD', name: 'm∠ADB from one right inscribed angle', fig,
        given: ['A, B, C, D \\text{ on one circle}', `${ma('ACB')} = 90^\\circ`], prove: `${ma('ADB')} = 90^\\circ`,
        rows: [
          { st: '\\overline{AB} \\text{ is a diameter}', rs: RS.rightConv, uses: [], wrong: [W(RS.semi, 'That theorem goes from a diameter to a right angle; here the right angle is known: use its converse (condition: C on the circle).', MC.contraConv), W(RS.given, 'Not given: it follows from the right inscribed angle at C.', MC.appearance)] },
          { st: `${arc('ACB')} = 180^\\circ`, rs: RS.semiArc, uses: [1], wrong: [W(RS.arcAdd, 'A diameter cuts the circle into two semicircles.'), W(RS.inscribed, 'This is about the arc, not an angle.')] },
          { st: `${ma('ADB')} = 90^\\circ`, rs: RS.inscribed, uses: [2], wrong: [W(RS.rightConv, 'The converse goes the other way: from a right angle to a diameter.', MC.converse), W(RS.cyclic, 'No quadrilateral is used here: ∠ADB stands on a semicircle.')] },
        ],
        decoys: [{ st: `${ma('ADB')} = ${ma('ACB')} \\text{ (look alike)}`, mc: MC.appearance, why: 'a look is not a reason.' }],
      };
    }
    case 'chainCyc': {
      const b = r(R, 60, 120), arcs = [r(R, 40, 2 * (180 - b) - 40)];
      arcs.push(2 * (180 - b) - arcs[0]!);
      const rest = 2 * b, s1 = r(R, 40, rest - 40);
      const [A, B, C, D] = placeCcw(th, [arcs[0]!, arcs[1]!, s1, rest - s1]);
      const fig = cfig({ center: null, on: { A: A!, B: B!, C: C!, D: D! }, segs: ['AB', 'BC', 'CD', 'DA'], angles: [{ id: 'ABC', col: 'first', text: `${b}°`, r: 56 }, { id: 'CDA', col: 'link', r: 56 }], arcs: [{ from: 'A', to: 'C', col: 'link', thin: true }] });
      return {
        id, roles: 'ABCD', name: `m(arc ABC) when m∠ABC = ${b}°`, fig,
        given: ['A, B, C, D \\text{ on one circle}', `${ma('ABC')} = ${b}^\\circ`], prove: `${arc('ABC')} = ${2 * (180 - b)}^\\circ`,
        rows: [
          { st: 'ABCD \\text{ is inscribed}', rs: RS.defInscribed, uses: [], wrong: [W(RS.given, 'What is given is that the four points lie on one circle; being inscribed follows from the definition.'), W(RS.cyclic, 'That theorem needs ABCD inscribed first.', MC.beforeEst)] },
          { st: `${ma('CDA')} = ${180 - b}^\\circ`, rs: RS.cyclic, uses: [1], wrong: [W(RS.vert, '∠ABC and ∠CDA are opposite angles of the quadrilateral, not vertical angles.', MC.cyclicEqual), W(RS.triSum, 'No triangle here: opposite angles of an inscribed quadrilateral.')] },
          { st: `${arc('ABC')} = ${2 * (180 - b)}^\\circ`, rs: RS.inscribed, uses: [2], wrong: [W(RS.central, '∠CDA has its vertex D on the circle: inscribed, so the arc is TWICE it.', MC.fullArc), W(RS.cyclic, 'Already used: this line turns an angle into its arc.')] },
        ],
        decoys: [{ st: `${ma('CDA')} = ${b}^\\circ`, mc: MC.cyclicEqual, why: 'opposite angles of an inscribed quadrilateral are supplementary.' }],
      };
    }
  }
}
/** every line placed after the lines it uses */
export const validOrder = (p: CProof, order: number[]): boolean => order.every((row, k) => p.rows[row - 1]!.uses.every(u => order.slice(0, k).includes(u)));
export type { CSpec };
