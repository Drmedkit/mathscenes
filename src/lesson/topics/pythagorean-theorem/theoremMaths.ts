// theoremMaths.ts: the exact maths of "Pythagorean theorem" (converse, distance, 3-D), pure (no DOM, no TeX). Items,
// the model blocks and the tests import it, so every number a picture or an item states is computed here. The squares,
// roots and the proof square come read-only from the intro topic (pythagoras-intro/pythag.ts).
//
//   three lengths      sorted, triangle inequality, kind3 (right / acute / obtuse from the squares, exact), sssPts
//                      (the triangle drawn true to its three lengths, right-angle vertex first)
//   the plane          run / rise (the coordinate differences), dist2
//   boxes              the oblique drawing of an l x w x h box (vertices A..H, hidden edges), base and space
//                      diagonals squared, the 3-D right-angle mark projected
//   rounding           tenth / trunc1 (the "cut off" slip), roundMid (rounding the base diagonal mid-way)
import type { Pt } from '../../../core/math';
import { TRIPLES, bracket, isSquare, isqrt, polyArea, proofTris, round1, rootHtml, rootTex, tilted } from '../pythagoras-intro/pythag';
export { TRIPLES, bracket, isSquare, isqrt, polyArea, proofTris, round1, rootHtml, rootTex, tilted };

export const sq = (x: number): number => x * x;
/** exact comparisons on decimals with up to 2 places (scaled to whole numbers first) */
const S100 = (x: number) => Math.round(x * 100);
export const near = (a: number, b: number, eps = 1e-6): boolean => Math.abs(a - b) < eps;
/** a number as text: whole, or up to 2 decimals */
export const fmt = (v: number): string => String(Math.round(v * 100) / 100);
/** to the nearest tenth, always one decimal (7.0) */
export const tenth = (v: number): string => round1(v).toFixed(1);
/** the "cut off after the tenths" slip (no rounding) */
export const trunc1 = (v: number): number => Math.floor(v * 10 + 1e-9) / 10;

// ---------- three lengths ----------
export const sorted3 = (s: readonly [number, number, number]): [number, number, number] => [...s].sort((x, y) => x - y) as [number, number, number];
export const isTriangle = (s: readonly [number, number, number]): boolean => { const [a, b, c] = sorted3(s); return a > 0 && a + b > c + 1e-9; };
export type Kind = 'right' | 'acute' | 'obtuse';
/** the angle opposite the longest side, from the squares (exact for decimals with up to 2 places) */
export function kind3(s: readonly [number, number, number]): Kind {
  const [a, b, c] = sorted3(s).map(S100) as [number, number, number];
  const d = a * a + b * b - c * c;
  return d === 0 ? 'right' : d > 0 ? 'acute' : 'obtuse';
}
/** the triangle with sides s (any order), y up: [R, A, B] with R the vertex across from the longest side (so the
 *  intro's SideSquares names a = R–A, b = R–B the two shorter sides and c = A–B the longest) */
export function sssPts(s: readonly [number, number, number]): [Pt, Pt, Pt] {
  const [a, b, c] = sorted3(s);
  if (!isTriangle(s)) throw new Error(`sssPts: ${s.join(', ')} is not a triangle`);
  // A = (0, 0), B = (c, 0); R with |RA| = a, |RB| = b, above the base
  const x = (a * a - b * b + c * c) / (2 * c), y = Math.sqrt(Math.max(0, a * a - x * x));
  return [[x, y], [0, 0], [c, 0]];
}
/** a familiar right triangle, legs a < b, hypotenuse c */
export const triples = (maxC = 30): [number, number, number][] => [...TRIPLES, [20, 21, 29], [12, 16, 20], [15, 20, 25], [10, 24, 26]]
  .filter(t => t[2] <= maxC).map(t => [...t] as [number, number, number]);

// ---------- the plane ----------
export type V = [number, number];
export const run = (A: V, B: V): number => Math.abs(B[0] - A[0]);
export const rise = (A: V, B: V): number => Math.abs(B[1] - A[1]);
export const dist2 = (A: V, B: V): number => sq(B[0] - A[0]) + sq(B[1] - A[1]);
/** the corner of the right triangle under AB: across from A, level with B in x, with A in y */
export const corner = (A: V, B: V): V => [B[0], A[1]];
export const quadrant = (p: V): number => (p[0] > 0 ? (p[1] > 0 ? 1 : 4) : p[1] > 0 ? 2 : 3);

// ---------- boxes ----------
export const BOX_NAMES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] as const;
export type BoxV = (typeof BOX_NAMES)[number];
/** a box l (left-right) x w (front-back) x h (up): A B C D the floor (A front left, B front right, C back right,
 *  D back left), E F G H straight above them */
export function box3(l: number, w: number, h: number): Record<BoxV, [number, number, number]> {
  return { A: [0, 0, 0], B: [l, 0, 0], C: [l, w, 0], D: [0, w, 0], E: [0, 0, h], F: [l, 0, h], G: [l, w, h], H: [0, w, h] };
}
/** oblique drawing: depth goes up and to the right at 35 degrees, shortened to half */
export const OBL = { k: 0.5, ang: (35 * Math.PI) / 180 };
export const project = (p: readonly [number, number, number]): Pt => [p[0] + OBL.k * p[1] * Math.cos(OBL.ang), p[2] + OBL.k * p[1] * Math.sin(OBL.ang)];
/** the edges of the box; the three that meet at D (the back bottom left corner) are hidden in this view */
export const BOX_EDGES: readonly [BoxV, BoxV, boolean][] = [
  ['A', 'B', false], ['B', 'C', false], ['C', 'D', true], ['D', 'A', true],
  ['E', 'F', false], ['F', 'G', false], ['G', 'H', false], ['H', 'E', false],
  ['A', 'E', false], ['B', 'F', false], ['C', 'G', false], ['D', 'H', true],
];
export const baseDiag2 = (l: number, w: number): number => sq(l) + sq(w);
export const spaceDiag2 = (l: number, w: number, h: number): number => sq(l) + sq(w) + sq(h);
/** drawn proportions: no edge drawn more than 2.6 times another (the labels carry the real numbers) */
export function drawnBox(l: number, w: number, h: number): [number, number, number] {
  const lo = Math.min(l, w, h), cap = lo * 2.6;
  return [Math.min(l, cap), Math.min(w, cap), Math.min(h, cap)];
}
/** a 3-D right-angle mark at vertex v between the directions to p and q, projected: three points */
export function mark3(v: readonly [number, number, number], p: readonly [number, number, number], q: readonly [number, number, number], size: number): [Pt, Pt, Pt] {
  const u = (t: readonly [number, number, number]) => { const d = [t[0] - v[0], t[1] - v[1], t[2] - v[2]]; const n = Math.hypot(d[0]!, d[1]!, d[2]!); return d.map(x => (x / n) * size); };
  const a = u(p), b = u(q);
  return [project([v[0] + a[0]!, v[1] + a[1]!, v[2] + a[2]!]), project([v[0] + a[0]! + b[0]!, v[1] + a[1]! + b[1]!, v[2] + a[2]! + b[2]!]), project([v[0] + b[0]!, v[1] + b[1]!, v[2] + b[2]!])];
}
/** the drawn angle (degrees) at v between the drawn segments to p and q */
export function drawnAngle(v: Pt, p: Pt, q: Pt): number {
  const ux = p[0] - v[0], uy = p[1] - v[1], wx = q[0] - v[0], wy = q[1] - v[1];
  return (Math.acos((ux * wx + uy * wy) / (Math.hypot(ux, uy) * Math.hypot(wx, wy))) * 180) / Math.PI;
}

// ---------- rounding mid-way ----------
/** the space diagonal when the base diagonal is first rounded to a tenth (the premature-rounding slip) */
export const roundMid = (l: number, w: number, h: number): number => round1(Math.sqrt(sq(round1(Math.sqrt(baseDiag2(l, w)))) + sq(h)));
/** boxes (whole edges up to 12) whose base diagonal is irrational and where rounding it mid-way changes the tenth */
export const MIDWAY_BOXES: readonly [number, number, number][] = (() => {
  const out: [number, number, number][] = [];
  for (let l = 1; l <= 9; l++) for (let w = l; w <= 9; w++) for (let h = 2; h <= 12; h++) {
    const b = baseDiag2(l, w);
    if (isSquare(b) || isSquare(b + h * h)) continue;
    if (roundMid(l, w, h) !== round1(Math.sqrt(b + h * h))) out.push([l, w, h]);
  }
  return out;
})();
/** boxes with whole edges and a whole space diagonal (the base diagonal may be irrational) */
export const WHOLE_BOXES: readonly [number, number, number, number][] = (() => {
  const out: [number, number, number, number][] = [];
  for (let l = 1; l <= 16; l++) for (let w = l; w <= 16; w++) for (let h = 2; h <= 24; h++) {
    const d2 = spaceDiag2(l, w, h);
    if (isSquare(d2) && isqrt(d2) <= 30) out.push([l, w, h, isqrt(d2)]);
  }
  return out;
})();

// ---------- tilted squares: whole grid cells inside (the "ignore the partial squares" slip) ----------
export function wholeCellsInside(p: number, q: number): number {
  const T = tilted(p, q), P = T.pts;
  const inside = (x: number, y: number) => {
    // convex, counter-clockwise: every cross product >= 0
    for (let i = 0; i < 4; i++) {
      const a = P[i]!, b = P[(i + 1) % 4]!;
      if ((b[0] - a[0]) * (y - a[1]) - (b[1] - a[1]) * (x - a[0]) < -1e-9) return false;
    }
    return true;
  };
  let n = 0;
  for (let i = 0; i < T.n; i++) for (let j = 0; j < T.n; j++) if (inside(i, j) && inside(i + 1, j) && inside(i + 1, j + 1) && inside(i, j + 1)) n++;
  return n;
}

// ---------- the converse proof: a constructed right triangle laid onto the given one ----------
/** the given triangle (legs a, b turned by `turn` radians; R the corner across from c) and the constructed right
 *  triangle with legs a (up) and b (across) at `at`, plus the motion (turn about Z, then slide) that carries it on */
export function converseFigure(a: number, b: number, turn: number, at: Pt): { R: Pt; P: Pt; Q: Pt; Z: Pt; X: Pt; Y: Pt; dx: number; dy: number; rot: number } {
  const cs = Math.cos(turn), sn = Math.sin(turn);
  const rot = (v: Pt): Pt => [v[0] * cs - v[1] * sn, v[0] * sn + v[1] * cs];
  const R: Pt = [0, 0], P = rot([0, a]), Q = rot([b, 0]);
  const Z: Pt = at, X: Pt = [at[0], at[1] + a], Y: Pt = [at[0] + b, at[1]];
  return { R, P, Q, Z, X, Y, dx: R[0] - Z[0], dy: R[1] - Z[1], rot: turn };
}
/** where a point of the constructed triangle is after a fraction k of the motion (turn about Z, then slide) */
export function moveAt(p: Pt, Z: Pt, rot: number, dx: number, dy: number, k: number): Pt {
  const t = rot * k, cs = Math.cos(t), sn = Math.sin(t);
  const v: Pt = [p[0] - Z[0], p[1] - Z[1]];
  return [Z[0] + v[0] * cs - v[1] * sn + dx * k, Z[1] + v[0] * sn + v[1] * cs + dy * k];
}
