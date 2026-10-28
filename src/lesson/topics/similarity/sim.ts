// sim.ts: the exact maths of "Similar triangles" (Geometry, lesson 9). Pure: no DOM, no canvas.
//   numbers       exact fractions (scale factors), tidy decimals for labels
//   triangles     integer side sets (scalene, readable angles), a similar copy scaled by k, turned / flipped and
//                 placed beside; every labelled length is drawn at its length (one unit per figure)
//   statements    simValid: an ordered statement △XYZ ~ △UVW holds when the angles at corresponding vertices are equal
//                 (computed from the drawn points); validStatements lists every valid order (isosceles: more than one)
//   proportions   a proportion p/q = r/s between named segments, checked on a generic instance of the configuration
//                 (so a "right" proportion is right for every such figure, and a wrong one is wrong for this figure)
//   configs       nested (DE ∥ BC), hourglass (AB ∥ CD, AC and BD cross at E), altitude to the hypotenuse, shadows,
//                 a mirror on the ground, a river (nested right triangles)
// The figure block is the course's GeoFig (geometry-foundations), with triangle-congruence's buildFig / pairFig
// (read-only): marks are checked there (arc groups equal, boxes 90°).
import { type Fig, type GSeg, type MarkCol, type Pt, add, dist, measure, mul, rotP, sub } from '../geometry-foundations/geo';
import { type FMark, type Tri, angle, beside, buildFig, moveT, pairFig, side, triSSS } from '../triangle-congruence/tri';
import { fr } from '../../runtime/item';

// ---------- numbers ----------
export const gcd = (a: number, b: number): number => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
export type Q = [number, number];
export const red = (n: number, d: number): Q => { const g = gcd(n, d) || 1; return d < 0 ? [-n / g, -d / g] : [n / g, d / g]; };
export const qv = (q: Q) => q[0] / q[1];
/** a length as printed: integers plain, otherwise up to 2 decimals (no float noise) */
export function fmt(x: number): string {
  const r = Math.round(x * 100) / 100;
  if (Math.abs(r - Math.round(r)) < 1e-9) return String(Math.round(r));
  return String(r);
}
/** is x printable exactly with fmt (an integer or at most 2 decimals) */
export const tidy = (x: number) => Math.abs(Math.round(x * 100) / 100 - x) < 1e-9;
export const qHtml = (q: Q) => (q[1] === 1 ? String(q[0]) : fr(q[0], q[1]));
export const qTex = (q: Q) => (q[1] === 1 ? String(q[0]) : `\\tfrac{${q[0]}}{${q[1]}}`);
export const qPlain = (q: Q) => (q[1] === 1 ? String(q[0]) : `${q[0]}/${q[1]}`);
/** a ratio of two named segments for the panel (stacked fraction) */
export const ratioH = (a: string, b: string) => fr(a, b);
export const ratioT = (a: string, b: string) => `\\frac{${a}}{${b}}`;

// ---------- triangles ----------
/** integer side sets [a, b, c] (a < b < c): every angle 30°-108°, no near-right angle, sides at least 12 % apart */
export const SIDE_SETS: [number, number, number][] = (() => {
  const out: [number, number, number][] = [];
  for (let c = 4; c <= 12; c++) for (let b = 3; b < c; b++) for (let a = 2; a < b; a++) {
    if (a + b <= c) continue;
    if (b / a < 1.12 || c / b < 1.1) continue;
    const T = triSSS(a, b, c), ang = [0, 1, 2].map(i => angle(T, i));
    if (ang.some(x => x < 30 || x > 108 || Math.abs(x - 90) < 5)) continue;
    out.push([a, b, c]);
  }
  return out;
})();
/** the triangle with sides a (opposite V0), b (opposite V1), c (opposite V2), drawn at `u` model units per unit */
export const triOf = (s: readonly number[], u: number): Tri => triSSS(s[0]! * u, s[1]! * u, s[2]! * u).map(p => mul(p, 1)) as Tri;
export const turnTri = (T: Tri, deg: number): Tri => T.map(p => rotP(p, deg)) as Tri;
/** a triangle moved by a rotation and maybe a reflection, then placed beside T1 */
export function placeBeside(T1: Tri, T2: Tri, rot: number, flip: boolean, layout: 'row' | 'col', gap = 170): Tri {
  return beside(T1, moveT(T2, { rot, flip, off: [0, 0] }), layout, gap);
}
/** the angles of a triangle (degrees) by vertex index */
export const anglesOf = (T: Tri) => [0, 1, 2].map(i => angle(T, i));
export const sidesOf = (T: Tri) => [0, 1, 2].map(i => side(T, i));

// ---------- statements ----------
/** △s1 ~ △s2 (letters in corresponding order) holds for the drawn points: the angles match vertex by vertex */
export function simValid(P: Record<string, Pt>, s1: string, s2: string, tol = 0.01): boolean {
  const A = (s: string, i: number) => measure(P[s[i]!]!, P[s[(i + 1) % 3]!]!, P[s[(i + 2) % 3]!]!);
  if (new Set(s1).size !== 3 || new Set(s2).size !== 3) return false;
  return [0, 1, 2].every(i => Math.abs(A(s1, i) - A(s2, i)) < tol);
}
export const PERM6: [number, number, number][] = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
export const permOf = (s: string, p: readonly number[]) => p.map(i => s[i]!).join('');
/** every order of s2 that makes △s1 ~ △s2 true */
export function validOrders(P: Record<string, Pt>, s1: string, s2: string): string[] {
  return PERM6.map(p => permOf(s2, p)).filter(o => simValid(P, s1, o));
}

// ---------- proportions ----------
/** p/q = r/s between named segments (letters of the endpoints, any order) */
export type Prop = [string, string, string, string];
const key = (s: string) => [...s].sort().join('');
/** a proportion holds for the lengths L (keys: sorted letter pairs) */
export function propHolds(L: Record<string, number>, p: Prop): boolean {
  const g = (s: string) => { const v = L[key(s)]; if (v === undefined) throw new Error(`no length ${s}`); return v; };
  return Math.abs(g(p[0]) / g(p[1]) - g(p[2]) / g(p[3])) < 1e-9;
}
/** lengths of every segment between the named points */
export function lengthsOf(P: Record<string, Pt>): Record<string, number> {
  const L: Record<string, number> = {}, ks = Object.keys(P);
  for (const a of ks) for (const b of ks) if (a < b) L[key(a + b)] = dist(P[a]!, P[b]!);
  return L;
}
/** a generic nested figure (DE ∥ BC, D on AB, E on AC) in role letters A-E: no special ratios */
export function genericNested(): Record<string, Pt> {
  const A: Pt = [0.37, 3.91], B: Pt = [-1.73, 0], C: Pt = [3.11, 0], f = 0.4137;
  return { A, B, C, D: add(A, mul(sub(B, A), f)), E: add(A, mul(sub(C, A), f)) };
}
/** a generic hourglass (AB ∥ CD, AC and BD meet at E) in role letters A-E */
export function genericHourglass(): Record<string, Pt> {
  const E: Pt = [0, 0], A: Pt = [-2.31, 1.37], B: Pt = [1.09, 1.83], k = 1.618;
  return { A, B, E, C: mul(A, -k), D: mul(B, -k) };
}
/** a generic right triangle ACB (right angle at C) with the altitude CD to AB */
export function genericAltitude(): Record<string, Pt> {
  const p = 1.37, q = 2.91, h = Math.sqrt(p * q);
  return { A: [0, 0], B: [p + q, 0], D: [p, 0], C: [p, h] };
}

// ---------- configurations (exact) ----------
const centroidOf = (P: Pt[]) => mul(P.reduce((a, b) => add(a, b), [0, 0] as Pt), 1 / P.length);
/** nested: B (0,0), C (BC,0), A above from SSS; D, E at the fraction f of AB and AC from A. u = model units per unit */
export function nested(AB: number, AC: number, BC: number, f: number, u: number, turn = 0): Record<string, Pt> {
  const x = (AB * AB - AC * AC + BC * BC) / (2 * BC), y = Math.sqrt(Math.max(0, AB * AB - x * x));
  const A: Pt = [x * u, y * u], B: Pt = [0, 0], C: Pt = [BC * u, 0];
  const P = { A, B, C, D: add(A, mul(sub(B, A), f)), E: add(A, mul(sub(C, A), f)) };
  if (!turn) return P;
  const c = centroidOf([A, B, C]);
  return Object.fromEntries(Object.entries(P).map(([k, p]) => [k, rotP(p, turn, c)]));
}
/** hourglass: triangle ABE from SSS (AB, AE, BE), then C on ray AE beyond E and D on ray BE beyond E at k times */
export function hourglass(AB: number, AE: number, BE: number, k: number, u: number, turn = 0): Record<string, Pt> {
  // triSSS(a, b, c): V0 (0,0), V1 (c,0), V2 above; a = V1V2, b = V0V2, c = V0V1. V0 = E, V1 = A, V2 = B.
  const T = triSSS(AB * u, BE * u, AE * u);
  const E: Pt = [0, 0];
  // turn so that the middle of AB is straight above E; A on the left (a reflection keeps every length)
  const mid = mul(add(T[1], T[2]), 0.5), rot = 90 - (Math.atan2(mid[1], mid[0]) * 180) / Math.PI;
  let A = rotP(T[1], rot), B = rotP(T[2], rot);
  if (A[0] > B[0]) { A = [-A[0], A[1]]; B = [-B[0], B[1]]; }
  A = rotP(A, turn); B = rotP(B, turn);
  return { E, A, B, C: mul(A, -k), D: mul(B, -k) };
}
/** right triangle with the right angle at C, hypotenuse AB = p + q split by the foot D of the altitude (AD = p) */
export function altitude(p: number, q: number, u: number): Record<string, Pt> {
  const h = Math.sqrt(p * q);
  return { A: [0, 0], B: [(p + q) * u, 0], D: [p * u, 0], C: [p * u, h * u] };
}

// ---------- figures ----------
export interface Lab { seg: string; text: string; alt?: string; col?: MarkCol }
/** a figure from points: segments, length labels (text, optional alt shown by the solve), angle marks */
export function figOf(pts: Record<string, Pt>, segs: string[], o: { labs?: Lab[]; marks?: FMark[]; fills?: string[]; dirs?: Record<string, number>; extra?: GSeg[]; bare?: string[]; segStyle?: Record<string, Partial<GSeg>>; pad?: number } = {}): Fig {
  const segStyle: Record<string, Partial<GSeg>> = { ...(o.segStyle ?? {}) };
  for (const l of o.labs ?? []) {
    const id = segs.find(s => s === l.seg || s === l.seg[1]! + l.seg[0]!);
    if (!id) throw new Error(`label on a missing segment ${l.seg}`);
    segStyle[id] = { ...(segStyle[id] ?? {}), text: l.text, alt: l.alt, col: l.col ?? segStyle[id]?.col };
  }
  // maxS: small model figures may grow to fill their frame (labels keep their size, so there is more room)
  return { ...buildFig({ pts, segs, marks: o.marks, fills: (o.fills ?? []).map(p => ({ pts: p })), dirs: o.dirs, extra: o.extra, bare: o.bare, segStyle, pad: o.pad }), maxS: 2.2 };
}
/** two similar triangles: sides s (opposite V0, V1, V2) and k·s; T2's vertex i is named n2[i] and corresponds to n1[i] */
export interface SimPair { T1: Tri; T2: Tri; n1: string; n2: string; s1: number[]; s2: number[]; P: Record<string, Pt> }
export function simPair(s1: readonly number[], k: number, n1: string, n2: string, o: { rot1?: number; rot2?: number; flip?: boolean; layout?: 'row' | 'col'; size?: number; s2?: number[] } = {}): SimPair {
  const s2 = o.s2 ?? s1.map(x => x * k);
  const big = Math.max(...s1, ...s2), u = (o.size ?? 400) / big;
  const T1 = turnTri(triOf(s1, u), o.rot1 ?? 0);
  const T2 = placeBeside(T1, triOf(s2, u), o.rot2 ?? 0, !!o.flip, o.layout ?? 'row');
  const P: Record<string, Pt> = {};
  [0, 1, 2].forEach(i => { P[n1[i]!] = T1[i]!; P[n2[i]!] = T2[i]!; });
  return { T1, T2, n1, n2, s1: s1.slice(), s2, P };
}
/** the pair as a figure: length labels per triangle (side index -> text) and arc marks per angle index (1-3 arcs) */
export function simFig(S: SimPair, o: { l1?: Record<number, string>; l2?: Record<number, string>; arcs?: Record<number, number>; arcs1?: Record<number, number>; arcs2?: Record<number, number>; a1?: Record<number, string>; a2?: Record<number, string>; alt2?: Record<number, string>; alt1?: Record<number, string> } = {}): Fig {
  const texts: { t: 0 | 1; k: 's' | 'a'; i: number; text: string }[] = [];
  for (const [i, t] of Object.entries(o.l1 ?? {})) texts.push({ t: 0, k: 's', i: Number(i), text: t });
  for (const [i, t] of Object.entries(o.l2 ?? {})) texts.push({ t: 1, k: 's', i: Number(i), text: t });
  const marks = Object.entries(o.arcs ?? {}).map(([i, n]) => ({ k: 'a' as const, i: Number(i), n }));
  const only = [...Object.entries(o.arcs1 ?? {}).map(([i, n]) => ({ k: 'a' as const, i: Number(i), n, only: 0 as const })), ...Object.entries(o.arcs2 ?? {}).map(([i, n]) => ({ k: 'a' as const, i: Number(i), n, only: 1 as const }))];
  const f = pairFig(S.T1, S.T2, S.n1, S.n2, [...marks, ...only], { texts });
  f.maxS = 2.2;
  // angle labels (measures) and solve-side alternatives
  const nm = (t: 0 | 1, i: number) => { const n = t === 0 ? S.n1 : S.n2; return n[(i + 1) % 3]! + n[i]! + n[(i + 2) % 3]!; };
  const addAng = (t: 0 | 1, rec: Record<number, string> | undefined) => {
    for (const [i, text] of Object.entries(rec ?? {})) {
      const id = nm(t, Number(i)), had = f.angles.find(a => a.id === id);
      if (had) had.text = text;
      else { const T = t === 0 ? S.T1 : S.T2, j = Number(i); f.angles.push({ id, v: T[j]!, p: T[(j + 1) % 3]!, q: T[(j + 2) % 3]!, text, arcs: 0 }); }
    }
  };
  addAng(0, o.a1); addAng(1, o.a2);
  const segId = (t: 0 | 1, i: number) => { const n = t === 0 ? S.n1 : S.n2; return n[(i + 1) % 3]! + n[(i + 2) % 3]!; };
  for (const [t, rec] of [[0, o.alt1], [1, o.alt2]] as const) for (const [i, a] of Object.entries(rec ?? {})) {
    const id = segId(t, Number(i)), s = f.segs.find(x => x.id === id || x.id === id[1]! + id[0]!);
    if (s) s.alt = a;
    const g = f.angles.find(x => x.id === nm(t, Number(i)));
    if (!s && g) g.alt = a;
  }
  return f;
}
/** the angle id of vertex i of triangle n (vertex in the middle) */
export const angId = (n: string, i: number) => n[(i + 1) % 3]! + n[i]! + n[(i + 2) % 3]!;
/** the side opposite vertex i of triangle n */
export const sideOf = (n: string, i: number) => n[(i + 1) % 3]! + n[(i + 2) % 3]!;

export { side, angle, dist, measure };
export type { Tri, Pt, Fig };
