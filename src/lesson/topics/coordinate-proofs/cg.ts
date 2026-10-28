// cg.ts: the exact maths of "Distance, midpoint and coordinate proofs": squared distances, simplest radicals, exact
// fractions (slopes, partition points), midpoints, line relations, polygon area (shoelace), and the class of a
// quadrilateral read from its coordinates. Pure: no DOM. Tests and generators import it.

export type V = readonly [number, number];
export const near = (a: number, b: number) => Math.abs(a - b) < 1e-9;
export const gcd = (a: number, b: number): number => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };

// ---------- vectors ----------
/** -0 becomes 0 (a point's data never holds a negative zero) */
const z = (x: number) => x + 0;
export const add = (a: V, b: V): V => [z(a[0] + b[0]), z(a[1] + b[1])];
export const sub = (a: V, b: V): V => [z(a[0] - b[0]), z(a[1] - b[1])];
export const mul = (a: V, k: number): V => [z(a[0] * k), z(a[1] * k)];
export const dot = (a: V, b: V) => a[0] * b[0] + a[1] * b[1];
export const cross = (a: V, b: V) => a[0] * b[1] - a[1] * b[0];
export const d2 = (a: V, b: V) => (b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2;
export const mid = (a: V, b: V): V => [z((a[0] + b[0]) / 2), z((a[1] + b[1]) / 2)];
export const same = (a: V, b: V) => near(a[0], b[0]) && near(a[1], b[1]);
/** the point a fraction t of the way from a to b */
export const along = (a: V, b: V, t: number): V => [z(a[0] + t * (b[0] - a[0])), z(a[1] + t * (b[1] - a[1]))];

// ---------- exact fractions ----------
export interface Q { n: number; d: number }
export function q(n: number, d = 1): Q {
  if (d === 0) throw new Error('q: zero denominator');
  if (d < 0) { n = -n; d = -d; }
  const g = gcd(n, d) || 1;
  return { n: n / g === 0 ? 0 : n / g, d: d / g };
}
export const qv = (x: Q) => x.n / x.d;
export const qEq = (a: Q, b: Q) => a.n * b.d === b.n * a.d;
/** a fraction as text: 3, −2/3 (real minus) */
export const qT = (x: Q) => (x.n < 0 ? '−' : '') + (x.d === 1 ? String(Math.abs(x.n)) : `${Math.abs(x.n)}/${x.d}`);
/** a fraction as TeX: -\frac{2}{3} */
export const qTex = (x: Q) => (x.n < 0 ? '-' : '') + (x.d === 1 ? String(Math.abs(x.n)) : `\\frac{${Math.abs(x.n)}}{${x.d}}`);
/** slope of the line through a and b (integer coordinates); null = vertical (undefined) */
export function slope(a: V, b: V): Q | null {
  const run = b[0] - a[0], rise = b[1] - a[1];
  if (near(run, 0)) return null;
  // half-integer coordinates: scale by 2 first so the fraction is of integers
  return q(Math.round(rise * 4), Math.round(run * 4));
}
export const negRecip = (m: Q): Q => q(-m.d, m.n);

// ---------- radicals ----------
/** √n in simplest form: k√r (n a non-negative integer) */
export function rad(n: number): { k: number; r: number } {
  if (!Number.isInteger(n) || n < 0) throw new Error(`rad: ${n}`);
  if (n === 0) return { k: 0, r: 1 };
  let k = 1, r = n;
  for (let f = 2; f * f <= r; f++) while (r % (f * f) === 0) { r /= f * f; k *= f; }
  return { k, r };
}
export const isSq = (n: number) => Number.isInteger(n) && n >= 0 && Number.isInteger(Math.round(Math.sqrt(n))) && Math.round(Math.sqrt(n)) ** 2 === n;
/** √n as plain text in simplest form: 10, √10, 2√10 */
export function radT(n: number): string { const { k, r } = rad(n); return r === 1 ? String(k) : k === 1 ? `√${r}` : `${k}√${r}`; }
export function radTex(n: number): string { const { k, r } = rad(n); return r === 1 ? String(k) : k === 1 ? `\\sqrt{${r}}` : `${k}\\sqrt{${r}}`; }
/** a sum of radicals, like terms combined: {r: coefficient}; text 6 + 4√10 */
export function radSum(ns: number[]): Map<number, number> {
  const m = new Map<number, number>();
  for (const n of ns) { const { k, r } = rad(n); m.set(r, (m.get(r) ?? 0) + k); }
  return m;
}
export function radSumT(m: Map<number, number>): string {
  const parts = [...m.entries()].sort((a, b) => a[0] - b[0]).map(([r, k]) => (r === 1 ? String(k) : k === 1 ? `√${r}` : `${k}√${r}`));
  return parts.join(' + ');
}
export const radSumV = (m: Map<number, number>) => [...m.entries()].reduce((s, [r, k]) => s + k * Math.sqrt(r), 0);

// ---------- lines ----------
export type LineRel = 'parallel' | 'perpendicular' | 'same' | 'neither';
/** relation of line PQ and line RS (each through two distinct points) */
export function lineRel(P: V, Qp: V, R: V, Sp: V): LineRel {
  const u = sub(Qp, P), v = sub(Sp, R);
  if (near(cross(u, v), 0)) return near(cross(u, sub(R, P)), 0) ? 'same' : 'parallel';
  if (near(dot(u, v), 0)) return 'perpendicular';
  return 'neither';
}

// ---------- polygons ----------
/** shoelace area (absolute) */
export function area(P: readonly V[]): number {
  let s = 0;
  for (let i = 0; i < P.length; i++) { const a = P[i]!, b = P[(i + 1) % P.length]!; s += a[0] * b[1] - b[0] * a[1]; }
  return Math.abs(s) / 2;
}
/** simple polygon: no two non-adjacent sides meet */
export function simple(P: readonly V[]): boolean {
  const n = P.length;
  const segX = (a: V, b: V, c: V, d: V) => {
    const o = (p: V, q: V, r: V) => Math.sign(cross(sub(q, p), sub(r, p)));
    return o(a, b, c) * o(a, b, d) < 0 && o(c, d, a) * o(c, d, b) < 0;
  };
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    if (j === i + 1 || (i === 0 && j === n - 1)) continue;
    if (segX(P[i]!, P[(i + 1) % n]!, P[j]!, P[(j + 1) % n]!)) return false;
  }
  return true;
}
export type QClass = 'square' | 'rectangle' | 'rhombus' | 'parallelogram' | 'none';
/** the most specific class of quadrilateral ABCD (vertices in order) */
export function qclass(A: V, B: V, C: V, D: V): QClass {
  if (!same(add(A, C), add(B, D))) return 'none';
  const right = near(dot(sub(B, A), sub(D, A)), 0), rh = near(d2(A, B), d2(A, D));
  return right && rh ? 'square' : right ? 'rectangle' : rh ? 'rhombus' : 'parallelogram';
}
export const isA = (c: QClass, k: QClass): boolean =>
  k === 'parallelogram' ? c !== 'none' : k === 'rectangle' ? c === 'rectangle' || c === 'square' : k === 'rhombus' ? c === 'rhombus' || c === 'square' : k === 'square' ? c === 'square' : c === 'none';
/** angle type of a triangle from its squared sides */
export function triKind(A: V, B: V, C: V): 'right' | 'acute' | 'obtuse' {
  const s = [d2(A, B), d2(B, C), d2(C, A)].sort((a, b) => a - b);
  return near(s[0]! + s[1]!, s[2]!) ? 'right' : s[0]! + s[1]! > s[2]! ? 'acute' : 'obtuse';
}
/** collinear points */
export const collinear = (A: V, B: V, C: V) => near(cross(sub(B, A), sub(C, A)), 0);
