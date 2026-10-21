// pythag.ts: the exact maths of "Pythagorean theorem: introduction and use", pure (no DOM, no TeX). Item generators,
// the model blocks and the tests all import it, so every number a picture or an item states is computed here.
//
//   squares and roots        isqrt, isSquare, bracket (k < √n < k + 1), round1 (nearest tenth)
//   right triangles          TRIPLES, hyp2 / leg2 (the squares), rightPts (the vertices in any quarter-turn pose)
//   squares on sides         squareOn (the square built outward on a side), sideSq (its exact area on grid points)
//   tilted squares           tilted(p, q): surround (p + q)², four corner triangles pq / 2, area p² + q², and the
//                            number of grid cells it touches (the "count every piece as one" slip)
//   the rearrangement proof  proofTris(a, b, k): the four triangles in the big square of side a + b, sliding from
//                            "tilted c-square in the middle" (k = 0) to "a-square + b-square left over" (k = 1)
import type { Pt } from '../../../core/math';

// ---------- squares and roots ----------
export function isqrt(n: number): number {
  if (n < 0) return NaN;
  let r = Math.floor(Math.sqrt(n));
  while (r * r > n) r--;
  while ((r + 1) * (r + 1) <= n) r++;
  return r;
}
export const isSquare = (n: number): boolean => Number.isInteger(n) && n >= 0 && isqrt(n) ** 2 === n;
/** the two consecutive whole numbers around √n (n not a perfect square) */
export function bracket(n: number): [number, number] {
  const k = isqrt(n);
  return [k, k + 1];
}
/** to the nearest tenth (half up), without float noise */
export const round1 = (v: number): number => Math.round(v * 10 + 1e-9) / 10;
/** a length √n: exact whole number when n is a perfect square */
export const rootVal = (n: number): number => (isSquare(n) ? isqrt(n) : Math.sqrt(n));
/** TeX of √n (a whole number when n is a perfect square) */
export const rootTex = (n: number): string => (isSquare(n) ? String(isqrt(n)) : `\\sqrt{${n}}`);
/** HTML of √n with a real vinculum */
export const rootHtml = (n: number | string): string =>
  typeof n === 'number' && isSquare(n) ? String(isqrt(n)) : `√<span style="border-top:1.5px solid currentColor;padding:1px 1px 0">${n}</span>`;

// ---------- right triangles ----------
/** whole-number right triangles of the topic (legs a < b, hypotenuse c) */
export const TRIPLES: readonly (readonly [number, number, number])[] = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15], [7, 24, 25]];
export const hyp2 = (a: number, b: number): number => a * a + b * b;
export const leg2 = (c: number, a: number): number => c * c - a * a;
export const isTriple = (a: number, b: number, c: number): boolean => a > 0 && b > 0 && c > 0 && a * a + b * b === c * c;

/** a quarter-turn pose: rot quarter turns counter-clockwise, then an optional mirror in the vertical axis */
export interface Pose { rot?: 0 | 1 | 2 | 3; flip?: boolean }
export function posePt(p: Pt, o: Pose = {}): Pt {
  let [x, y] = p;
  for (let i = 0; i < (o.rot ?? 0); i++) [x, y] = [-y, x];
  if (o.flip) x = -x;
  return [x, y];
}
/** a right triangle with the right angle R at the origin, leg a up the y axis and leg b along the x axis (y up),
 *  then posed. Returns [R, A, B]: side a = R–A, side b = R–B, hypotenuse c = A–B. */
export function rightPts(a: number, b: number, o: Pose = {}): [Pt, Pt, Pt] {
  return [posePt([0, 0], o), posePt([0, a], o), posePt([b, 0], o)];
}
export const sideLen2 = (p: Pt, q: Pt): number => (q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2;
/** the square built on side p–q, on the side away from `away` (the triangle's third vertex): [p, q, q', p'] */
export function squareOn(p: Pt, q: Pt, away: Pt): [Pt, Pt, Pt, Pt] {
  const dx = q[0] - p[0], dy = q[1] - p[1];
  let nx = -dy, ny = dx;   // a normal of the same length as the side
  const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2;
  if ((away[0] - mx) * nx + (away[1] - my) * ny > 0) { nx = -nx; ny = -ny; }
  return [p, q, [q[0] + nx, q[1] + ny], [p[0] + nx, p[1] + ny]];
}
/** the angle at vertex v of triangle (v, p, q), in degrees */
export function angleAt(v: Pt, p: Pt, q: Pt): number {
  const ux = p[0] - v[0], uy = p[1] - v[1], wx = q[0] - v[0], wy = q[1] - v[1];
  return (Math.acos((ux * wx + uy * wy) / (Math.hypot(ux, uy) * Math.hypot(wx, wy))) * 180) / Math.PI;
}
export type AngleKind = 'right' | 'acute' | 'obtuse';
export function triKind(P: readonly [Pt, Pt, Pt]): AngleKind {
  const m = Math.max(angleAt(P[0], P[1], P[2]), angleAt(P[1], P[2], P[0]), angleAt(P[2], P[0], P[1]));
  return Math.abs(m - 90) < 1e-6 ? 'right' : m > 90 ? 'obtuse' : 'acute';
}

// ---------- tilted squares on grid paper ----------
export interface Tilted {
  p: number; q: number;
  /** side of the upright square around it */ n: number;
  surround: number;
  /** area of one corner triangle (legs p and q) */ corner: number;
  area: number;
  /** grid cells the tilted square covers at least partly (each counted as one whole square: the slip) */ touched: number;
  /** vertices in grid units, y up, inside [0, n]² */ pts: [Pt, Pt, Pt, Pt];
}
/** polygon ∩ axis-aligned box, area (Sutherland–Hodgman) */
function clipArea(P: readonly Pt[], x0: number, y0: number, x1: number, y1: number): number {
  let Q: Pt[] = [...P];
  const edges: [(p: Pt) => boolean, (a: Pt, b: Pt) => Pt][] = [
    [p => p[0] >= x0, (a, b) => [x0, a[1] + ((b[1] - a[1]) * (x0 - a[0])) / (b[0] - a[0])]],
    [p => p[0] <= x1, (a, b) => [x1, a[1] + ((b[1] - a[1]) * (x1 - a[0])) / (b[0] - a[0])]],
    [p => p[1] >= y0, (a, b) => [a[0] + ((b[0] - a[0]) * (y0 - a[1])) / (b[1] - a[1]), y0]],
    [p => p[1] <= y1, (a, b) => [a[0] + ((b[0] - a[0]) * (y1 - a[1])) / (b[1] - a[1]), y1]],
  ];
  for (const [inside, cut] of edges) {
    const R: Pt[] = [];
    for (let i = 0; i < Q.length; i++) {
      const a = Q[i]!, b = Q[(i + 1) % Q.length]!;
      const ia = inside(a), ib = inside(b);
      if (ia) R.push(a);
      if (ia !== ib) R.push(cut(a, b));
    }
    Q = R;
    if (Q.length < 3) return 0;
  }
  let s = 0;
  for (let i = 0; i < Q.length; i++) { const a = Q[i]!, b = Q[(i + 1) % Q.length]!; s += a[0] * b[1] - b[0] * a[1]; }
  return Math.abs(s) / 2;
}
export function tilted(p: number, q: number): Tilted {
  if (!(Number.isInteger(p) && Number.isInteger(q) && p >= 1 && q >= 1)) throw new Error(`tilted: steps ${p}, ${q} must be whole numbers >= 1`);
  const n = p + q;
  const pts: [Pt, Pt, Pt, Pt] = [[p, 0], [n, p], [q, n], [0, q]];
  let touched = 0, sum = 0;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const a = clipArea(pts, i, j, i + 1, j + 1); sum += a; if (a > 1e-9) touched++; }
  const area = p * p + q * q;
  if (Math.abs(sum - area) > 1e-6) throw new Error('tilted: cell areas do not add up');
  if (n * n - 4 * (p * q) / 2 !== area) throw new Error('tilted: surround minus corners is not p² + q²');
  return { p, q, n, surround: n * n, corner: (p * q) / 2, area, touched, pts };
}

// ---------- the rearrangement proof ----------
/** the four congruent right triangles (legs a, b) in the big square [0, s]², s = a + b, y up.
 *  k = 0: around the tilted c-square in the middle; k = 1: slid into two a-by-b rectangles, which leaves an
 *  a-square (bottom left) and a b-square (top right). Each triangle only slides (no turn); T2 stays put. */
export function proofTris(a: number, b: number, k: readonly [number, number, number, number] = [0, 0, 0, 0]): [Pt, Pt, Pt][] {
  const s = a + b;
  const T: [Pt, Pt, Pt][] = [
    [[0, 0], [a, 0], [0, b]],
    [[s, 0], [s, a], [a, 0]],
    [[s, s], [b, s], [s, a]],
    [[0, s], [0, b], [b, s]],
  ];
  const move: Pt[] = [[0, a], [0, 0], [-b, 0], [a, -b]];
  return T.map((t, i) => t.map(([x, y]) => [x + move[i]![0] * k[i]!, y + move[i]![1] * k[i]!] as Pt) as [Pt, Pt, Pt]);
}
/** the middle c-square at k = 0 */
export const proofMiddle = (a: number, b: number): [Pt, Pt, Pt, Pt] => { const s = a + b; return [[a, 0], [s, a], [b, s], [0, b]]; };
/** the two squares left over at k = 1 */
export const proofLeft = (a: number, b: number): { A: [Pt, Pt, Pt, Pt]; B: [Pt, Pt, Pt, Pt] } => {
  const s = a + b;
  return { A: [[0, 0], [a, 0], [a, a], [0, a]], B: [[a, a], [s, a], [s, s], [a, s]] };
};
/** polygon area (shoelace) */
export function polyArea(P: readonly Pt[]): number {
  let s = 0;
  for (let i = 0; i < P.length; i++) { const p = P[i]!, q = P[(i + 1) % P.length]!; s += p[0] * q[1] - q[0] * p[1]; }
  return Math.abs(s) / 2;
}
