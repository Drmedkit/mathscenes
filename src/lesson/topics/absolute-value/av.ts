// av.ts: the exact maths of "Absolute value functions and equations" (Algebra 1, secondary-t7-13). No DOM.
// An absolute value function y = a|mx + b| + k is two linear pieces that meet at the vertex x = −b/m (where the inside
// is 0), with branch slopes −a|m| (left) and a|m| (right). |u| = c splits into u = c or u = −c (c > 0), has one
// solution at c = 0 and none for c < 0; |u| < c is the band −c < u < c ('and'), |u| > c the two rays u < −c or u > c.
// Formatting (HTML for the panel, TeX for the board) lives here so generators, the page and the tests read the same.
// Pictures: graphs are piecewise-functions GPic data (drawn on the kit Plane by piecewise-functions/graph.ts), number
// lines are solving-linear-equations SetLine rows (sets.ts).
import { type Fn, type Axis, axisOver, clean, lin } from '../piecewise-functions/pw';
import type { GPart, GPic } from '../piecewise-functions/pic';
import { type Rel, type SSet, EMPTY, ALL, L, near, nH, nT, ray, solve, union, inter, setH, setT } from '../solving-linear-equations/sets';

export { clean, near, nH, nT, setH, setT, EMPTY, ALL, ray, union, inter, solve, L };
export type { Rel, SSet, GPic, GPart, Axis };

// ---------- numbers ----------
/** a decimal for HTML: real minus, no float noise */
export const D = (v: number): string => { const r = clean(Math.round(v * 1e6) / 1e6); return (r < 0 ? '−' : '') + String(Math.abs(r)); };
/** a decimal for TeX */
export const DT = (v: number): string => { const r = clean(Math.round(v * 1e6) / 1e6); return (r < 0 ? '-' : '') + String(Math.abs(r)); };
/** a number after an operation sign: negatives in brackets */
export const P = (v: number) => (v < 0 ? `(${D(v)})` : D(v));
export const PT = (v: number) => (v < 0 ? `(${DT(v)})` : DT(v));
/** a value is a "nice" decimal (at most 2 places) */
export const nice = (v: number) => near(v * 100, Math.round(v * 100));
export const half = (v: number) => near(v * 2, Math.round(v * 2));

// ---------- expressions ----------
const X = '<i>x</i>';
/** the inside m·x + b as HTML / TeX: x − 4, 2x + 1, 3 − x (a negative x term after a positive constant), −2x − 6 */
export function inH(m: number, b: number, v = X): string {
  const cx = (a: number) => (near(a, 1) ? v : near(a, -1) ? '−' + v : D(a) + v);
  if (near(b, 0)) return cx(m);
  if (m < 0 && b > 0) return `${D(b)} − ${near(m, -1) ? v : D(-m) + v}`;
  return `${cx(m)} ${b < 0 ? '−' : '+'} ${D(Math.abs(b))}`;
}
export function inT(m: number, b: number, v = 'x'): string {
  const cx = (a: number) => (near(a, 1) ? v : near(a, -1) ? '-' + v : DT(a) + v);
  if (near(b, 0)) return cx(m);
  if (m < 0 && b > 0) return `${DT(b)} - ${near(m, -1) ? v : DT(-m) + v}`;
  return `${cx(m)} ${b < 0 ? '-' : '+'} ${DT(Math.abs(b))}`;
}
/** m·x + b written plainly (no constant-first reordering): the branch formulas */
export function linStrH(m: number, b: number, v = X): string {
  if (near(m, 0)) return D(b);
  const cx = near(m, 1) ? v : near(m, -1) ? '−' + v : D(m) + v;
  return near(b, 0) ? cx : `${cx} ${b < 0 ? '−' : '+'} ${D(Math.abs(b))}`;
}
export function linStrT(m: number, b: number, v = 'x'): string {
  if (near(m, 0)) return DT(b);
  const cx = near(m, 1) ? v : near(m, -1) ? '-' + v : DT(m) + v;
  return near(b, 0) ? cx : `${cx} ${b < 0 ? '-' : '+'} ${DT(Math.abs(b))}`;
}
const coefH = (a: number) => (near(a, 1) ? '' : near(a, -1) ? '−' : D(a));
const coefT = (a: number) => (near(a, 1) ? '' : near(a, -1) ? '-' : DT(a));
const kH = (k: number) => (near(k, 0) ? '' : ` ${k < 0 ? '−' : '+'} ${D(Math.abs(k))}`);
const kT = (k: number) => (near(k, 0) ? '' : ` ${k < 0 ? '-' : '+'} ${DT(Math.abs(k))}`);
/** a|mx + b| + k */
export const absH = (a: number, m: number, b: number, k = 0, v = X) => `${coefH(a)}|${inH(m, b, v)}|${kH(k)}`;
export const absT = (a: number, m: number, b: number, k = 0, v = 'x') => `${coefT(a)}|${inT(m, b, v)}|${kT(k)}`;
export const relH = (r: Rel) => ({ '<': '&lt;', '<=': '≤', '>': '&gt;', '>=': '≥', '=': '=' }[r]);
export const relT = (r: Rel) => ({ '<': '<', '<=': '\\le', '>': '>', '>=': '\\ge', '=': '=' }[r]);
export const flipRel = (r: Rel): Rel => (r === '<' ? '>' : r === '>' ? '<' : r === '<=' ? '>=' : r === '>=' ? '<=' : '=');

// ---------- the function ----------
export interface AbsF { a: number; m: number; b: number; k: number }
export const absAt = (f: AbsF, x: number) => clean(f.a * Math.abs(f.m * x + f.b) + f.k);
export const vertexOf = (f: AbsF): [number, number] => [clean(-f.b / f.m), f.k];
/** the slopes of the left and right branch */
export const slopesOf = (f: AbsF): [number, number] => [clean(-f.a * Math.abs(f.m)), clean(f.a * Math.abs(f.m))];
/** the branch formulas as linear functions */
export function branchesOf(f: AbsF): [Fn, Fn] {
  const [xv, yv] = vertexOf(f), [sl, sr] = slopesOf(f);
  return [lin(sl, clean(yv - sl * xv)), lin(sr, clean(yv - sr * xv))];
}
/** the solutions of a|mx + b| + k = c (sorted): two, one or none */
export function solveEq(f: AbsF, c: number): number[] {
  const t = (c - f.k) / f.a;
  if (t < -1e-12) return [];
  if (Math.abs(t) < 1e-12) return [clean(-f.b / f.m)];
  return [clean((t - f.b) / f.m), clean((-t - f.b) / f.m)].sort((x, y) => x - y);
}
/** the solution set of |m x + b| rel t (any sign of t) */
export function absIneq(m: number, b: number, rel: Rel, t: number): SSet {
  const u = L(m, b);
  if (rel === '=') { const s = solveEq({ a: 1, m, b, k: 0 }, t); return s.reduce<SSet>((S, v) => union(S, ray('=', v)), EMPTY); }
  if (rel === '<' || rel === '<=') {
    if (t < 0 || (t === 0 && rel === '<')) return EMPTY;
    const lo = rel === '<' ? '>' : '>=';
    return inter(solve(u, lo as Rel, L(0, -t)), solve(u, rel, L(0, t)));
  }
  if (t < 0 || (t === 0 && rel === '>=')) return ALL;
  const neg = rel === '>' ? '<' : '<=';
  return union(solve(u, neg as Rel, L(0, -t)), solve(u, rel, L(0, t)));
}
export const sameSet = (A: SSet, B: SSet) => setT(A) === setT(B);

// ---------- graphs (GPic on the kit Plane) ----------
/** a window around some x and y values: grid lines on whole numbers (or 2s), at most `cells` cells */
export function win(xs: number[], ys: number[], o: { cells?: number; xName?: string; yName?: string; zero?: boolean } = {}): { x: Axis; y: Axis } {
  return {
    x: axisOver(xs, { cells: o.cells ?? 12, name: o.xName ?? 'x', zero: o.zero }),
    y: axisOver(ys, { cells: o.cells ?? 12, name: o.yName ?? 'y', zero: o.zero }),
  };
}
/** the V of f as two pieces (each a ray with an arrow) and its vertex dot; keys `${pre}L`, `${pre}R`, `${pre}V` */
export function vParts(f: AbsF, pre = 'v', col: 'link' | 'water' | 'first' | 'wrong' | 'dim' | 'pick' = 'link', vertex = true): GPart[] {
  const [xv, yv] = vertexOf(f), [fl, fr] = branchesOf(f);
  const out: GPart[] = [
    { kind: 'piece', key: pre + 'L', fn: fl, hi: xv, ends: ['none', 'none'], col, arrow: true },
    { kind: 'piece', key: pre + 'R', fn: fr, lo: xv, ends: ['none', 'none'], col, arrow: true },
  ];
  if (vertex) out.push({ kind: 'point', key: pre + 'V', x: xv, y: yv, col });
  return out;
}
/** a window for a V: the vertex, a few units each side, and extra x / y values */
export function vWindow(f: AbsF, xs: number[] = [], ys: number[] = [], o: { spread?: number; cells?: number } = {}): { x: Axis; y: Axis } {
  const [xv, yv] = vertexOf(f), s = o.spread ?? 4;
  const xv0 = [xv - s, xv + s, ...xs];
  const lo = Math.min(...xv0), hi = Math.max(...xv0);
  const yv0 = [yv, absAt(f, lo), absAt(f, hi), ...ys];
  // a steep V would need a tall window: clip its arms (the rays leave through the top / bottom)
  const yCap = (v: number) => Math.max(yv - 9, Math.min(yv + 9, v));
  return win(xv0, yv0.map(yCap), { cells: o.cells });
}
/** the point where a V crosses y = c as Plane parts: a dot and a dashed drop to the x-axis */
export function crossParts(xs: number[], c: number, pre = 's'): GPart[] {
  return xs.flatMap((x, i) => [
    { kind: 'point', key: `${pre}${i}`, x, y: c, col: 'second' } as GPart,
    ...(Math.abs(c) > 1e-9 ? [{ kind: 'seg', key: `${pre}${i}d`, a: [x, c], b: [x, 0], col: 'pick', dash: true } as GPart] : []),
  ]);
}
/** the window holds every point a picture names (x and y inside) */
export const inWin = (g: { x: Axis; y: Axis }, x: number, y: number) => x >= g.x.min - 1e-9 && x <= g.x.max + 1e-9 && y >= g.y.min - 1e-9 && y <= g.y.max + 1e-9;

// ---------- number line pictures (SetLine) ----------
export interface NumPic {
  /** values the window must hold */ values: number[];
  /** solution side (hidden from the oracle): the set on the line, a center with distance arcs, test values */
  reveal: { set?: SSet; center?: number; arcs?: { to: number; label: string }[]; tests?: { key: string; v: number; ok?: boolean }[]; result?: string };
}
