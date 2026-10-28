// proofs.ts: the reasons of "Similar triangles" and its bank of short similarity proofs (pure, no DOM).
// Every row has a statement (TeX), a reason, the rows it uses (an order is valid when every row comes after the rows
// it uses and the target is last). Decoys carry the misconception a wrong line shows. The figures are exact; a given
// that is not itself a congruence or a length (DE ∥ BC, a right angle, a perpendicular) is cited from the Given
// header, never restated as a row (the course's rule, as in triangle-congruence).
import type { Fig } from '../geometry-foundations/geo';
import { MC, names2, pick, r } from './common';
import { type Roles, altFig, altPts, hourFig, hourPts, nestedFig, nm, roles } from './figs';
import { type Q, PERM6, SIDE_SETS, fmt, nested, permOf, red, simFig, simPair, triOf } from './sim';
import { angle } from '../triangle-congruence/tri';

export const RS = {
  given: 'Given',
  refl: 'Reflexive Property of Congruence',
  vert: 'Vertical Angles Theorem',
  altInt: 'Alternate Interior Angles Theorem',
  corr: 'Corresponding Angles Theorem',
  right: 'All right angles are congruent',
  segAdd: 'Segment Addition Postulate',
  calc: 'Division of the given lengths',
  sum: 'Triangle Angle Sum Theorem',
  defCong: 'Definition of congruent angles',
  AA: 'AA', SASs: 'SAS~', SSSs: 'SSS~',
  corrConv: 'Corresponding Angles Converse',
  cpsp: 'Corresponding sides of similar triangles are proportional',
} as const;
export type RKey = keyof typeof RS;
export interface SRow { st: string; rs: RKey; uses: number[] }
export interface SDecoy { st: string; mc: string; why: string }
export type ProofId = 'nestAA' | 'hourAA' | 'altAA' | 'nestSAS' | 'sepAA' | 'sepSSS';
export const BANK: ProofId[] = ['nestAA', 'hourAA', 'altAA', 'nestSAS', 'sepAA', 'sepSSS'];
/** proofs long enough to put in order (three rows or more) */
export const ORDER_BANK: ProofId[] = ['nestAA', 'hourAA', 'altAA', 'nestSAS', 'sepAA'];
export interface SProof {
  id: ProofId; crit: 'AA' | 'SAS~' | 'SSS~';
  given: string[]; prove: string; rows: SRow[]; fig: Fig; decoys: SDecoy[];
  /** the two triangles in corresponding order, and a wrong order of the second (a valid-looking statement) */
  t1: string; t2: string; wrongT2: string;
}
const T = (s: string) => `\\triangle ${s}`;
const sim = (a: string, b: string) => `${T(a)} \\sim ${T(b)}`;
const an = (a: string, b: string) => `\\angle ${a} \\cong \\angle ${b}`;
const ov = (s: string) => `\\overline{${s}}`;
/** role letters in TeX -> real letters (TeX commands are lower case, so only point letters change) */
const mapTex = (s: string, t: Roles) => s.replace(/[A-Z]/g, ch => t[ch] ?? ch);
/** role letters in prose -> real letters (only 1-3 capital tokens standing alone; criterion names stay) */
export const mapProse = (s: string, t: Roles) => s.replace(/(?<![A-Za-z])[A-Z]{1,3}(?![A-Za-z])/g, m => (/^(AA|SAS|SSS|ASA|AAS|HL|AAA|SSA)$/.test(m) ? m : [...m].map(c => t[c] ?? c).join('')));

export function makeProof(id: ProofId, R: () => number): SProof {
  switch (id) {
    case 'nestAA': {
      const t = roles(R);
      const AB = r(R, 8, 12), AC = r(R, 8, 13), BC = r(R, 7, 12), f = r(R, 40, 55) / 100;
      if (AB + AC <= BC * 1.3 || AB + BC <= AC * 1.3 || AC + BC <= AB * 1.3) return makeProof(id, R);
      const fig = nestedFig(t, nested(AB, AC, BC, f, 380 / Math.max(AB, AC, BC)), { par: true });
      return {
        id, crit: 'AA', t1: nm(t, 'ADE'), t2: nm(t, 'ABC'), wrongT2: nm(t, 'ACB'),
        given: [mapTex(`${ov('DE')} \\parallel ${ov('BC')}`, t)], prove: mapTex(sim('ADE', 'ABC'), t), fig,
        rows: [
          { st: mapTex(an('ADE', 'ABC'), t), rs: 'corr', uses: [] },
          { st: mapTex(an('A', 'A'), t), rs: 'refl', uses: [] },
          { st: mapTex(sim('ADE', 'ABC'), t), rs: 'AA', uses: [1, 2] },
        ],
        decoys: [
          { st: mapTex('\\frac{AD}{AB} = \\frac{DE}{BC}', t), mc: MC.beforeEst, why: 'that proportion follows only once the triangles are proved similar.' },
          { st: mapTex(an('ADE', 'AED'), t), mc: MC.wrongPair, why: mapProse('those two angles are in the same triangle; nothing makes them congruent.', t) },
        ],
      };
    }
    case 'hourAA': {
      const t = roles(R);
      const k = pick(R, [1.3, 1.5, 0.7]);
      const AB = r(R, 6, 9), AE = r(R, 5, 8), BE = AE + r(R, 2, 3);
      if (AB + AE <= BE * 1.2) return makeProof(id, R);
      const fig = hourFig(t, hourPts(AB, AE, BE, k, 300 / Math.max(AB, BE * k, AE * k, BE), r(R, -10, 10)), { par: true });
      return {
        id, crit: 'AA', t1: nm(t, 'ABE'), t2: nm(t, 'CDE'), wrongT2: nm(t, 'DCE'),
        given: [mapTex(`${ov('AB')} \\parallel ${ov('CD')}`, t)], prove: mapTex(sim('ABE', 'CDE'), t), fig,
        rows: [
          { st: mapTex(an('AEB', 'CED'), t), rs: 'vert', uses: [] },
          { st: mapTex(an('BAE', 'DCE'), t), rs: 'altInt', uses: [] },
          { st: mapTex(sim('ABE', 'CDE'), t), rs: 'AA', uses: [1, 2] },
        ],
        decoys: [
          { st: mapTex(sim('ABE', 'DCE'), t), mc: MC.vertexOrder, why: mapProse('the vertices are not in matching order: A matches C (alternate interior angles), not D.', t) },
          { st: mapTex(`${ov('AE')} \\cong ${ov('CE')}`, t), mc: MC.appearance, why: mapProse('nothing marks or gives AE ≅ CE.', t) },
        ],
      };
    }
    case 'altAA': {
      const t = roles(R, 'ABCD');
      const [p, q] = pick(R, [[2, 5], [3, 5], [4, 7], [3, 7], [2, 3], [4, 9]] as [number, number][]);
      const fig = altFig(t, altPts(p, q, 380 / (p + q), r(R, -15, 15), R() < 0.5));
      return {
        id, crit: 'AA', t1: nm(t, 'ADC'), t2: nm(t, 'ACB'), wrongT2: nm(t, 'ABC'),
        given: [mapTex(`\\angle ACB\\text{ is a right angle},\\ ${ov('CD')} \\perp ${ov('AB')}`, t)], prove: mapTex(sim('ADC', 'ACB'), t), fig,
        rows: [
          { st: mapTex(an('ADC', 'ACB'), t), rs: 'right', uses: [] },
          { st: mapTex(an('A', 'A'), t), rs: 'refl', uses: [] },
          { st: mapTex(sim('ADC', 'ACB'), t), rs: 'AA', uses: [1, 2] },
        ],
        decoys: [
          { st: mapTex(sim('ADC', 'ABC'), t), mc: MC.vertexOrder, why: mapProse('the right angle at D must match the right angle at C, so D and C share a place.', t) },
          { st: mapTex(`${ov('AD')} \\cong ${ov('DC')}`, t), mc: MC.appearance, why: mapProse('nothing marks or gives AD ≅ DC.', t) },
        ],
      };
    }
    case 'nestSAS': {
      const t = roles(R);
      const k: Q = pick(R, [[5, 2], [3, 1], [5, 3], [2, 1], [7, 3]] as Q[]);
      const AD = k[1] * r(R, 1, 3), AE = k[1] * r(R, 1, 4);
      if (AD === AE) return makeProof(id, R);
      const AB = (AD * k[0]) / k[1], AC = (AE * k[0]) / k[1], angA = r(R, 45, 70);
      const BC = Math.sqrt(AB * AB + AC * AC - 2 * AB * AC * Math.cos((angA * Math.PI) / 180));
      const fig = nestedFig(t, nested(AB, AC, BC, AD / AB, 380 / Math.max(AB, AC, BC)), { labs: [{ seg: 'AD', text: fmt(AD) }, { seg: 'DB', text: fmt(AB - AD) }, { seg: 'AE', text: fmt(AE) }, { seg: 'EC', text: fmt(AC - AE) }] });
      const q = red(k[1], k[0]);
      const qt = `\\tfrac{${q[0]}}{${q[1]}}`;
      return {
        id, crit: 'SAS~', t1: nm(t, 'ADE'), t2: nm(t, 'ABC'), wrongT2: nm(t, 'ACB'),
        given: ['\\text{the lengths in the figure}'], prove: mapTex(sim('ADE', 'ABC'), t), fig,
        rows: [
          { st: mapTex(`AB = ${fmt(AB)},\\ AC = ${fmt(AC)}`, t), rs: 'segAdd', uses: [] },
          { st: mapTex(`\\frac{AD}{AB} = \\frac{AE}{AC} = ${qt}`, t), rs: 'calc', uses: [1] },
          { st: mapTex(an('A', 'A'), t), rs: 'refl', uses: [] },
          { st: mapTex(sim('ADE', 'ABC'), t), rs: 'SASs', uses: [2, 3] },
        ],
        decoys: [
          { st: mapTex(an('ADE', 'ABC'), t), mc: MC.beforeEst, why: mapProse('DE ∥ BC is not given: that angle pair follows only after the similarity.', t) },
          { st: mapTex(`\\frac{AD}{DB} = \\frac{AE}{AC}`, t), mc: MC.partWhole, why: mapProse('SAS~ pairs the whole sides: AD/AB with AE/AC.', t) },
        ],
      };
    }
    case 'sepAA': {
      const [L1, L2] = names2(R), n2 = permOf(L2, pick(R, PERM6));
      let a = 0, b = 0, c = 0;
      for (;;) { a = r(R, 35, 70); b = r(R, 40, 80); c = 180 - a - b; if (c >= 30 && Math.abs(b - c) >= 8 && Math.abs(a - b) >= 6 && Math.abs(a - c) >= 6) break; }
      const s = sidesFromAngles(a, b);
      const S2 = simPair(s, pick(R, [0.7, 1.4]), L1, n2, { rot1: r(R, -20, 20), rot2: r(R, 0, 359), flip: R() < 0.5, layout: 'col' });
      const fig = simFig(S2, { a1: { 0: `${a}°`, 1: `${b}°` }, a2: { 0: `${a}°`, 2: `${c}°` } });
      const V = (nmS: string, i: number) => nmS[i]!;
      return {
        id, crit: 'AA', t1: L1, t2: n2, wrongT2: permOf(n2, [1, 0, 2]),
        given: [`m\\angle ${V(L1, 0)} = ${a}^\\circ,\\ m\\angle ${V(L1, 1)} = ${b}^\\circ`, `m\\angle ${V(n2, 0)} = ${a}^\\circ,\\ m\\angle ${V(n2, 2)} = ${c}^\\circ`], prove: sim(L1, n2), fig,
        rows: [
          { st: `m\\angle ${V(L1, 2)} = ${c}^\\circ`, rs: 'sum', uses: [] },
          { st: an(V(L1, 0), V(n2, 0)), rs: 'defCong', uses: [] },
          { st: an(V(L1, 2), V(n2, 2)), rs: 'defCong', uses: [1] },
          { st: sim(L1, n2), rs: 'AA', uses: [2, 3] },
        ],
        decoys: [
          { st: `${T(L1)} \\cong ${T(n2)}`, mc: MC.aaaCong, why: 'equal angles fix the shape, not the size: the triangles are similar, not proved congruent.' },
          { st: an(V(L1, 1), V(n2, 2)), mc: MC.aaListed, why: `m∠${V(L1, 1)} = ${b}° but m∠${V(n2, 2)} = ${c}°.` },
        ],
      };
    }
    case 'sepSSS': {
      const [L1, L2] = names2(R), n2 = permOf(L2, pick(R, PERM6));
      const s = pick(R, SIDE_SETS).slice(), k = pick(R, [2, 3]);
      const S2 = simPair(s, k, L1, n2, { rot1: r(R, -20, 20), rot2: r(R, 0, 359), flip: R() < 0.5, layout: 'col' });
      const lab = (x: number[]) => ({ 0: fmt(x[0]!), 1: fmt(x[1]!), 2: fmt(x[2]!) });
      const fig = simFig(S2, { l1: lab(s), l2: lab(s.map(x => x * k)) });
      const sd = (n: string, i: number) => n[(i + 1) % 3]! + n[(i + 2) % 3]!;
      return {
        id, crit: 'SSS~', t1: L1, t2: n2, wrongT2: permOf(n2, [1, 0, 2]),
        given: ['\\text{the lengths in the figure}'], prove: sim(L1, n2), fig,
        rows: [
          { st: `\\frac{${sd(n2, 0)}}{${sd(L1, 0)}} = \\frac{${sd(n2, 1)}}{${sd(L1, 1)}} = \\frac{${sd(n2, 2)}}{${sd(L1, 2)}} = ${k}`, rs: 'calc', uses: [] },
          { st: sim(L1, n2), rs: 'SSSs', uses: [1] },
        ],
        decoys: [
          { st: `${sd(L1, 0)} = ${sd(n2, 0)}`, mc: MC.sidesEqual, why: 'similar sides are proportional, not equal.' },
          { st: sim(L1, permOf(n2, [1, 0, 2])), mc: MC.vertexOrder, why: 'that order pairs sides that are not in one ratio.' },
        ],
      };
    }
  }
}
/** whole-number-free sides of a triangle with angles a, b at V0, V1 (law of sines, longest side 10) */
function sidesFromAngles(a: number, b: number): number[] {
  const c = 180 - a - b, s = (x: number) => Math.sin((x * Math.PI) / 180);
  const m = 10 / Math.max(s(a), s(b), s(c));
  return [s(a) * m, s(b) * m, s(c) * m];
}
/** a row order is valid when every row comes after the rows it uses and the target is last */
export function validOrder(p: { rows: SRow[] }, order: number[]): boolean {
  if (order.length !== p.rows.length || new Set(order).size !== order.length) return false;
  const pos = new Map(order.map((x, i) => [x, i]));
  return p.rows.every((row, i) => row.uses.every(u => (pos.get(u) ?? 99) < (pos.get(i + 1) ?? -1))) && order[order.length - 1] === p.rows.length;
}
export { angle, triOf };
