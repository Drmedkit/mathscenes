// figs.ts: the lesson's exact configurations as figures, with random letters (pure, no DOM).
//   nestedFig     D on AB, E on AC (DE ∥ BC when the ratios match; chevrons only when the parallel is given)
//   hourFig       AC and BD cross at E; AB ∥ CD (chevrons when given) or a look-alike that is not parallel
//   altFig        right triangle ACB (right angle at C), the altitude CD to AB (boxes at C and D)
// Letters: `roles` maps the role letters A-E to random letters (alphabetical along the roles). Lengths are drawn at
// their value (one unit per figure).
import { type Fig, type Pt, add, mul, rotP, sub } from '../geometry-foundations/geo';
import type { FMark } from '../triangle-congruence/tri';
import { type Lab, altitude, figOf, hourglass } from './sim';

export type Roles = Record<string, string>;
/** random letters for the roles (alphabetical along the roles; never I, L, O) */
export function roles(R: () => number, rs = 'ABCDE'): Roles {
  const pool = 'ABCDEFGHJKMNPQRSTUVWXYZ'.split(''), out: string[] = [];
  while (out.length < rs.length) { const c = pool[Math.floor(R() * pool.length)]!; if (!out.includes(c)) out.push(c); }
  out.sort();
  return Object.fromEntries([...rs].map((c, i) => [c, out[i]!]));
}
/** a role string mapped to letters ('ADE' -> 'KNP'); other characters stay */
export const nm = (t: Roles, s: string) => [...s].map(c => t[c] ?? c).join('');
const mapPts = (t: Roles, P: Record<string, Pt>) => Object.fromEntries(Object.entries(P).map(([k, p]) => [t[k] ?? k, p]));
const turnAll = (P: Record<string, Pt>, deg: number) => Object.fromEntries(Object.entries(P).map(([k, p]) => [k, rotP(p, deg)]));

/** nested: A apex, B and C the base; D on AB at AD, E on AC at AE (role lengths). BC from the angle at A. */
export function nestedPts(AD: number, AB: number, AE: number, AC: number, angA: number, u: number, turn = 0): Record<string, Pt> {
  // A at the origin, AB along angle 270 - angA/2 - ..., AC along the other side: the base BC below A
  const dB = 270 - angA / 2, dC = 270 + angA / 2;
  const dir = (d: number): Pt => [Math.cos((d * Math.PI) / 180), Math.sin((d * Math.PI) / 180)];
  const A: Pt = [0, 0], B = mul(dir(dB), AB * u), C = mul(dir(dC), AC * u), D = mul(dir(dB), AD * u), E = mul(dir(dC), AE * u);
  return turnAll({ A, B, C, D, E }, turn);
}
/** the nested figure: segments AD, DB, AE, EC, DE, BC; labels by role segment; chevrons on DE and BC when `par` */
export function nestedFig(t: Roles, P0: Record<string, Pt>, o: { labs?: Lab[]; par?: boolean; marks?: FMark[]; noDE?: boolean } = {}): Fig {
  const segs = ['AD', 'DB', 'AE', 'EC', ...(o.noDE ? [] : ['DE']), 'BC'].map(s => nm(t, s));
  const marks: FMark[] = [...(o.par ? [{ seg: nm(t, 'DE'), par: 1 }, { seg: nm(t, 'BC'), par: 1 }] : []), ...(o.marks ?? []).map(m => ({ ...m, seg: m.seg ? nm(t, m.seg) : undefined, ang: m.ang ? nm(t, m.ang) : undefined }))];
  return figOf(mapPts(t, P0), segs, { labs: (o.labs ?? []).map(l => ({ ...l, seg: nm(t, l.seg) })), marks, fills: [nm(t, 'ABC')] });
}
/** hourglass role points: E at the origin, AB on top; C = -k·A, D = -kD·B (kD = k when AB ∥ CD) */
export function hourPts(AB: number, AE: number, BE: number, k: number, u: number, turn = 0, kD = k): Record<string, Pt> {
  const P = hourglass(AB, AE, BE, k, u, turn);
  if (kD !== k) P.D = mul(P.B!, -kD);
  return P;
}
export function hourFig(t: Roles, P0: Record<string, Pt>, o: { labs?: Lab[]; par?: boolean; marks?: FMark[] } = {}): Fig {
  // DC runs the same way as AB (C = -k·A, D = -k·B), so the two chevrons point the same way
  const segs = ['AE', 'EC', 'BE', 'ED', 'AB', 'DC'].map(s => nm(t, s));
  const marks: FMark[] = [...(o.par ? [{ seg: nm(t, 'AB'), par: 1 }, { seg: nm(t, 'DC'), par: 1 }] : []), ...(o.marks ?? []).map(m => ({ ...m, seg: m.seg ? nm(t, m.seg) : undefined, ang: m.ang ? nm(t, m.ang) : undefined }))];
  return figOf(mapPts(t, P0), segs, { labs: (o.labs ?? []).map(l => ({ ...l, seg: nm(t, l.seg) })), marks, fills: [nm(t, 'ABE'), nm(t, 'CDE')] });
}
/** right triangle ACB, right angle at C, altitude CD (AD = p, DB = q), turned; boxes at C and D */
export function altPts(p: number, q: number, u: number, turn = 0, flip = false): Record<string, Pt> {
  const P = altitude(p, q, u);
  const c: Pt = [((p + q) * u) / 2, 0];
  const out = Object.fromEntries(Object.entries(P).map(([k, v]) => [k, flip ? ([2 * c[0] - v[0], v[1]] as Pt) : v]));
  return turnAll(Object.fromEntries(Object.entries(out).map(([k, v]) => [k, sub(v, c)])), turn);
}
export function altFig(t: Roles, P0: Record<string, Pt>, o: { labs?: Lab[]; boxC?: boolean; extraMarks?: FMark[]; text?: Record<string, string> } = {}): Fig {
  const segs = ['AD', 'DB', 'AC', 'CB', 'CD'].map(s => nm(t, s));
  const marks: FMark[] = [{ ang: nm(t, 'ADC'), box: true }, ...(o.boxC === false ? [] : [{ ang: nm(t, 'ACB'), box: true }]), ...(o.extraMarks ?? []).map(m => ({ ...m, ang: m.ang ? nm(t, m.ang) : undefined, seg: m.seg ? nm(t, m.seg) : undefined }))];
  return figOf(mapPts(t, P0), segs, { labs: (o.labs ?? []).map(l => ({ ...l, seg: nm(t, l.seg) })), marks, fills: [nm(t, 'ACB')] });
}
export { add };
