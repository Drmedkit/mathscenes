// centers.ts: the exact maths of "Midsegments and points of concurrency" (Geometry, lesson 7). Pure: no DOM.
//   triangles   random scalene acute / right / obtuse triangles with whole-degree angles (no near-equal angles or
//               sides, so no special segment coincides with another by accident), triangles from three sides
//   segments    midpoints, the foot of an altitude (on the line of the side, maybe outside it), the foot of an angle
//               bisector (it splits the side in the ratio of the adjacent sides)
//   centers     centroid, circumcenter, incenter, orthocenter, inradius, circumradius, where a point lies
//               (inside / on a side / at a vertex / outside)
// Model coordinates: px-like, y UP (as geometry-foundations/geo.ts). The figures are the course's GeoFig, built with
// triangle-congruence/tri.ts buildFig (tick groups equal, arc groups equal, boxes 90°: it throws otherwise).
import { type Pt, add, at, dist, lerpP, measure, mul, sub, unit } from '../geometry-foundations/geo';
import { type Tri, angle, side, triASA, triSSS, turnT } from '../triangle-congruence/tri';

export type { Tri, Pt };
export const mid = (a: Pt, b: Pt): Pt => lerpP(a, b, 0.5);
export const centroidOf = (T: Tri): Pt => mul(add(add(T[0], T[1]), T[2]), 1 / 3);
export function circumcenterOf([A, B, C]: Tri): Pt {
  const d = 2 * (A[0] * (B[1] - C[1]) + B[0] * (C[1] - A[1]) + C[0] * (A[1] - B[1]));
  const a2 = A[0] ** 2 + A[1] ** 2, b2 = B[0] ** 2 + B[1] ** 2, c2 = C[0] ** 2 + C[1] ** 2;
  return [(a2 * (B[1] - C[1]) + b2 * (C[1] - A[1]) + c2 * (A[1] - B[1])) / d, (a2 * (C[0] - B[0]) + b2 * (A[0] - C[0]) + c2 * (B[0] - A[0])) / d];
}
export function incenterOf(T: Tri): Pt {
  const a = side(T, 0), b = side(T, 1), c = side(T, 2), s = a + b + c;
  return [(a * T[0][0] + b * T[1][0] + c * T[2][0]) / s, (a * T[0][1] + b * T[1][1] + c * T[2][1]) / s];
}
export const orthocenterOf = (T: Tri): Pt => sub(add(add(T[0], T[1]), T[2]), mul(circumcenterOf(T), 2));
export const areaOf = (T: Tri): number => Math.abs((T[1][0] - T[0][0]) * (T[2][1] - T[0][1]) - (T[2][0] - T[0][0]) * (T[1][1] - T[0][1])) / 2;
export const inradiusOf = (T: Tri): number => (2 * areaOf(T)) / (side(T, 0) + side(T, 1) + side(T, 2));
export const circumradiusOf = (T: Tri): number => dist(circumcenterOf(T), T[0]);
/** the foot of the perpendicular from p to the line a-b */
export function footOf(p: Pt, a: Pt, b: Pt): Pt { const u = unit(sub(b, a)); const t = (p[0] - a[0]) * u[0] + (p[1] - a[1]) * u[1]; return add(a, mul(u, t)); }
/** where the foot lies along a->b: 0 at a, 1 at b (outside the side when < 0 or > 1) */
export function footT(p: Pt, a: Pt, b: Pt): number { const d = sub(b, a); return ((p[0] - a[0]) * d[0] + (p[1] - a[1]) * d[1]) / (d[0] * d[0] + d[1] * d[1]); }
/** the foot on side i (opposite vertex i) of the bisector of angle i */
export function bisectorFoot(T: Tri, i: number): Pt {
  const P = T[(i + 1) % 3]!, Q = T[(i + 2) % 3]!, p = dist(T[i]!, P), q = dist(T[i]!, Q);
  return lerpP(P, Q, p / (p + q));
}
export const altitudeFoot = (T: Tri, i: number): Pt => footOf(T[i]!, T[(i + 1) % 3]!, T[(i + 2) % 3]!);
export const sideMid = (T: Tri, i: number): Pt => mid(T[(i + 1) % 3]!, T[(i + 2) % 3]!);

export type Kind = 'acute' | 'right' | 'obtuse';
export const angles = (T: Tri): [number, number, number] => [angle(T, 0), angle(T, 1), angle(T, 2)];
export function kindOf(T: Tri): Kind {
  const m = Math.max(...angles(T));
  return Math.abs(m - 90) < 1e-6 ? 'right' : m > 90 ? 'obtuse' : 'acute';
}
export type Where = 'inside' | 'side' | 'vertex' | 'outside';
/** where p lies relative to the triangle (on a side / at a vertex within a tolerance relative to the size) */
export function whereIs(T: Tri, p: Pt): Where {
  const L = Math.max(side(T, 0), side(T, 1), side(T, 2)), tol = 1e-7 * L;
  if (T.some(v => dist(v, p) < tol)) return 'vertex';
  const cr = (a: Pt, b: Pt) => ((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])) / dist(a, b);
  const s = [cr(T[0], T[1]), cr(T[1], T[2]), cr(T[2], T[0])];
  const sg = Math.sign(s[0]! + s[1]! + s[2]!);
  const d = s.map(x => x * sg);
  if (d.every(x => x > tol)) return 'inside';
  if (d.every(x => x > -tol)) return 'side';
  return 'outside';
}

const ri = (R: () => number, lo: number, hi: number) => lo + Math.floor(R() * (hi - lo + 1));
/** a scalene triangle of a kind, whole-degree angles, the special angle at vertex `at` (0..2), every pair of angles
 *  at least 8° apart and every pair of sides at least 10 % apart, turned by `turn` degrees (random when undefined) */
export function makeTri(R: () => number, kind: Kind, o: { at?: number; turn?: number; base?: number; lo?: number; hi?: number } = {}): Tri {
  for (let t = 0; t < 400; t++) {
    let a: number;
    if (kind === 'right') a = 90;
    else if (kind === 'obtuse') a = ri(R, o.lo ?? 104, o.hi ?? 128);
    else a = ri(R, o.lo ?? 48, o.hi ?? 82);
    const b = ri(R, kind === 'acute' ? 40 : 25, kind === 'acute' ? 82 : 62), c = 180 - a - b;
    if (kind === 'acute' && (c < 40 || c > 82)) continue;
    if (kind !== 'acute' && c < 25) continue;
    const ang = [a, b, c];
    if (Math.abs(a - b) < 8 || Math.abs(b - c) < 8 || Math.abs(a - c) < 8) continue;
    // vertex 0 gets angle a, 1 gets b, 2 gets c: triASA(A at V0, side V0V1, B at V1)
    let T = triASA(ang[0]!, o.base ?? 340, ang[1]!);
    const s = [side(T, 0), side(T, 1), side(T, 2)].sort((x, y) => x - y);
    if (s[1]! / s[0]! < 1.1 || s[2]! / s[1]! < 1.1) continue;
    const k = o.at ?? 0;
    if (k !== 0) T = [T[(3 - k) % 3]!, T[(4 - k) % 3]!, T[(5 - k) % 3]!] as Tri;   // the special angle moves to vertex k
    return turnT(T, o.turn ?? ri(R, 0, 359));
  }
  return turnT(triASA(70, 340, 50), o.turn ?? 0);
}
/** a triangle with sides a = V1V2, b = V0V2, c = V0V1 (any scale), turned */
export const triFromSides = (a: number, b: number, c: number, turn = 0): Tri => { const k = 340 / Math.max(a, b, c); return turnT(triSSS(a * k, b * k, c * k), turn); };
export const valid3 = (a: number, b: number, c: number) => a + b > c * 1.08 && a + c > b * 1.08 && b + c > a * 1.08;

/** the triangle scaled so that the length between points p and q becomes L */
export function scaleTo(T: Tri, p: Pt, q: Pt, L: number): { T: Tri; k: number } {
  const k = L / dist(p, q);
  return { T: T.map(v => mul(v, k)) as Tri, k };
}
export const fmt = (x: number) => (Math.abs(x - Math.round(x)) < 1e-9 ? String(Math.round(x)) : String(Math.round(x * 100) / 100));
/** a whole-degree check of an angle drawn between three points */
export const deg = (v: Pt, p: Pt, q: Pt) => measure(v, p, q);
export { at, dist, side, angle, lerpP, sub, add, mul, unit };
