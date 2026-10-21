// dilMaths.ts: the exact maths of dilations and similarity, pure (no DOM, no canvas).
//   A dilation with center c and scale factor k sends P to P' = c + k (P - c): P' is on ray cP and cP' = k * cP.
//   Scale factors are fractions K = n/d (k = 1/2, 3/4, 3/2, ...) so every image is exact. Similar figures are a
//   dilation followed by rigid motions; `simMap` recovers (k, flip, turn, shift) from a vertex correspondence and
//   asserts that EVERY vertex lands, so a wrong picture cannot be built. Paper figures (no grid) are built from side
//   lengths (SSS) or angles (AA) so every printed label equals the drawn shape. DilPic is the plain picture data an
//   item hands to the page; `picProblem` says whether the painter can draw it readably (the tests run it on every item).
import { check } from '../../../blocks/block';
import { gcd, fr } from '../../runtime/item';
import { type Move, type V, type Win, mv, seqAt, veq } from '../congruence/congMaths';

export type { Move, V, Win };
const EPS = 1e-7;
export const fix = (x: number) => (Math.abs(x) < 1e-9 ? 0 : Math.round(x * 1e9) / 1e9);

// ---------- scale factors as exact fractions ----------
export interface K { n: number; d: number }
export const kk = (n: number, d = 1): K => { const g = gcd(n, d); return { n: n / g, d: d / g }; };
export const kv = (k: K) => k.n / k.d;
export const kInv = (k: K): K => kk(k.d, k.n);
export const kEq = (a: K, b: K) => a.n * b.d === b.n * a.d;
/** k in HTML: 2, ½ as a stacked fraction, 3/2 as a stacked fraction */
export const kH = (k: K) => (k.d === 1 ? String(k.n) : fr(k.n, k.d));
export const kT = (k: K) => (k.d === 1 ? String(k.n) : `\\tfrac{${k.n}}{${k.d}}`);
const UNITS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
const DEN1 = ['', '', 'half', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth'];
const DENS = ['', '', 'halves', 'thirds', 'fourths', 'fifths', 'sixths', 'sevenths', 'eighths'];
export const kSay = (k: K) => (k.d === 1 ? UNITS[k.n] ?? String(k.n) : `${UNITS[k.n]} ${k.n === 1 ? DEN1[k.d] : DENS[k.d]}`);

// ---------- numbers as text ----------
/** a denominator that makes x whole (1, 2, 3, 4, 5, 6, 8), or 0 */
export function denOf(x: number): number { for (const d of [1, 2, 3, 4, 5, 6, 8]) if (Math.abs(x * d - Math.round(x * d)) < EPS) return d; return 0; }
const terminating = (d: number) => d === 1 || d === 2 || d === 4 || d === 5 || d === 8;
/** a number for the panel: whole, or a terminating decimal, else a fraction; the real minus sign */
export function numH(x: number): string {
  x = fix(x);
  const d = denOf(x), neg = x < 0 ? '−' : '';
  if (d && !terminating(d)) { const n = Math.round(Math.abs(x) * d); return `${neg}${fr(n, d)}`; }
  return neg + String(Math.abs(Math.round(x * 1e6) / 1e6));
}
/** the same number in TeX */
export function numT(x: number): string {
  x = fix(x);
  const d = denOf(x), neg = x < 0 ? '-' : '';
  if (d && !terminating(d)) { const n = Math.round(Math.abs(x) * d); return `${neg}\\tfrac{${n}}{${d}}`; }
  return `${neg ? '{-' : ''}${Math.abs(Math.round(x * 1e6) / 1e6)}${neg ? '}' : ''}`;
}
export const ptH = (p: V) => `(${numH(p[0])}, ${numH(p[1])})`;
export const ptT = (p: V) => `(${numT(p[0])},\\ ${numT(p[1])})`;
/** a length label: 7.5, 12 */
export const lenS = (x: number) => String(Math.round(x * 1e6) / 1e6);

// ---------- dilation ----------
export const O: V = [0, 0];
export const dilate = (p: V, c: V, k: number): V => [fix(c[0] + k * (p[0] - c[0])), fix(c[1] + k * (p[1] - c[1]))];
export const dilateAll = (P: readonly V[], c: V, k: number): V[] => P.map(p => dilate(p, c, k));
export const dist = (a: V, b: V) => Math.hypot(a[0] - b[0], a[1] - b[1]);
/** asserts a dilation: every image point on its ray from c, at k times the distance */
export function checkDilation(P: readonly V[], Q: readonly V[], c: V, k: number): void {
  check(P.length === Q.length, 'dilation', 'one image per point');
  P.forEach((p, i) => {
    const q = Q[i]!;
    check(Math.abs(dist(c, q) - k * dist(c, p)) < 1e-6, 'dilation', `point ${i} is not at k times the distance`);
    const cr = (p[0] - c[0]) * (q[1] - c[1]) - (p[1] - c[1]) * (q[0] - c[0]);
    check(Math.abs(cr) < 1e-6 && (p[0] - c[0]) * (q[0] - c[0]) + (p[1] - c[1]) * (q[1] - c[1]) >= -1e-9, 'dilation', `point ${i} is not on its ray`);
  });
}

// ---------- polygons ----------
export const sides = (P: readonly V[]) => P.map((p, i) => dist(p, P[(i + 1) % P.length]!));
/** interior angle at vertex i in degrees (convex polygons) */
export function angleAt(P: readonly V[], i: number): number {
  const p = P[i]!, a = P[(i + 1) % P.length]!, b = P[(i - 1 + P.length) % P.length]!;
  const u = [a[0] - p[0], a[1] - p[1]], w = [b[0] - p[0], b[1] - p[1]];
  return (Math.acos(Math.max(-1, Math.min(1, (u[0]! * w[0]! + u[1]! * w[1]!) / (Math.hypot(u[0]!, u[1]!) * Math.hypot(w[0]!, w[1]!))))) * 180) / Math.PI;
}
export const angles = (P: readonly V[]) => P.map((_, i) => angleAt(P, i));
export function orientOf(P: readonly V[]): 1 | -1 {
  let s = 0;
  for (let i = 0; i < P.length; i++) { const a = P[i]!, b = P[(i + 1) % P.length]!; s += a[0] * b[1] - b[0] * a[1]; }
  check(Math.abs(s) > EPS, 'dilation', 'a figure needs an area');
  return s > 0 ? 1 : -1;
}
export const centroid = (P: readonly V[]): V => [P.reduce((s, p) => s + p[0], 0) / P.length, P.reduce((s, p) => s + p[1], 0) / P.length];
/** a triangle from its sides AB, BC, CA (A at the origin, B on the x-axis, C above) */
export function triSSS(ab: number, bc: number, ca: number): V[] {
  check(ab + bc > ca + EPS && bc + ca > ab + EPS && ca + ab > bc + EPS, 'dilation', 'not a triangle');
  const x = (ab * ab + ca * ca - bc * bc) / (2 * ab), y = Math.sqrt(ca * ca - x * x);
  return [[0, 0], [ab, 0], [x, y]];
}
/** a triangle from AB and the angles at A and B (degrees) */
export function triAA(ab: number, A: number, B: number): V[] {
  check(A > 0 && B > 0 && A + B < 180, 'dilation', 'angles of a triangle');
  const r = Math.PI / 180, ca = (ab * Math.sin(B * r)) / Math.sin((A + B) * r);
  return [[0, 0], [ab, 0], [ca * Math.cos(A * r), ca * Math.sin(A * r)]];
}
export const rectP = (w: number, h: number): V[] => [[0, 0], [w, 0], [w, h], [0, h]];
/** a parallelogram: base w, slanted side s at angle a (degrees) */
export function paraP(w: number, s: number, a: number): V[] {
  const r = (a * Math.PI) / 180, dx = s * Math.cos(r), dy = s * Math.sin(r);
  return [[0, 0], [w, 0], [w + dx, dy], [dx, dy]];
}
/** move a figure: flip (over a vertical line), scale by k and turn (degrees ccw) about its centroid, centroid to `at` */
export function place(P: readonly V[], o: { k?: number; rot?: number; flip?: boolean; at?: V } = {}): V[] {
  const c = centroid(P), k = o.k ?? 1, r = ((o.rot ?? 0) * Math.PI) / 180, at = o.at ?? c;
  return P.map(p => {
    let x = (p[0] - c[0]) * (o.flip ? -1 : 1) * k, y = (p[1] - c[1]) * k;
    [x, y] = [x * Math.cos(r) - y * Math.sin(r), x * Math.sin(r) + y * Math.cos(r)];
    return [fix(at[0] + x), fix(at[1] + y)] as V;
  });
}
export function bbox(P: readonly V[]): { x0: number; y0: number; x1: number; y1: number } {
  const xs = P.map(p => p[0]), ys = P.map(p => p[1]);
  return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
}
/** shift a figure so its box starts at (x0, y0) */
export function at(P: readonly V[], x0: number, y0: number): V[] { const b = bbox(P); return P.map(p => [fix(p[0] - b.x0 + x0), fix(p[1] - b.y0 + y0)] as V); }

// ---------- similarity ----------
export interface SimMap { k: number; flip: boolean; rot: number; from: V; to: V }
/** the similarity that takes P[i] to Q[i] for every i (dilate about P's centroid, flip, turn, shift); throws if none */
export function simMap(P: readonly V[], Q: readonly V[]): SimMap {
  check(P.length === Q.length && P.length >= 3, 'similarity', 'same number of corners');
  const cp = centroid(P), cq = centroid(Q);
  const k = dist(Q[0]!, Q[1]!) / dist(P[0]!, P[1]!);
  const flip = orientOf(P) !== orientOf(Q);
  const u0 = [(P[1]![0] - P[0]![0]) * (flip ? -1 : 1), P[1]![1] - P[0]![1]], u1 = [Q[1]![0] - Q[0]![0], Q[1]![1] - Q[0]![1]];
  const rot = Math.atan2(u1[1]!, u1[0]!) - Math.atan2(u0[1]!, u0[0]!);
  const m: SimMap = { k, flip, rot, from: cp, to: cq };
  P.forEach((p, i) => check(dist(simAt(m, p, 1), Q[i]!) < 1e-6, 'similarity', `corner ${i} does not land on its partner`));
  return m;
}
/** where p is at time t of the replay: 0..0.45 the dilation (in place), 0.45..1 the flip, turn and slide */
export function simAt(m: SimMap, p: V, t: number): V {
  const a = Math.min(1, Math.max(0, t / 0.45)), b = Math.min(1, Math.max(0, (t - 0.45) / 0.55));
  const sa = a * a * (3 - 2 * a), sb = b * b * (3 - 2 * b);
  const k = 1 + (m.k - 1) * sa;
  let x = (p[0] - m.from[0]) * k, y = (p[1] - m.from[1]) * k;
  if (m.flip) x *= 1 - 2 * Math.min(1, sb * 1.6);
  const r = m.rot * sb;
  [x, y] = [x * Math.cos(r) - y * Math.sin(r), x * Math.sin(r) + y * Math.cos(r)];
  return [m.from[0] + (m.to[0] - m.from[0]) * sb + x, m.from[1] + (m.to[1] - m.from[1]) * sb + y];
}
/** are P and Q similar under the correspondence P[i] -> Q[i]? (every side ratio equal and every angle equal) */
export function similarAs(P: readonly V[], Q: readonly V[]): boolean {
  if (P.length !== Q.length) return false;
  const a = sides(P), b = sides(Q), r = b[0]! / a[0]!;
  if (!a.every((x, i) => Math.abs(b[i]! / x - r) < 1e-6)) return false;
  const A = angles(P), B = angles(Q);
  return A.every((x, i) => Math.abs(x - B[i]!) < 1e-4);
}
/** similar under SOME vertex correspondence (cyclic shifts, both ways round) */
export function similarAny(P: readonly V[], Q: readonly V[]): boolean {
  const n = P.length;
  if (n !== Q.length) return false;
  for (const dir of [1, -1]) for (let s = 0; s < n; s++) if (similarAs(P, P.map((_, i) => Q[((s + dir * i) % n + n) % n]!))) return true;
  return false;
}
/** do three side lengths make similar triangles under some order? (sorted ratios) */
export function sssSimilar(a: readonly number[], b: readonly number[]): boolean {
  const x = [...a].sort((p, q) => p - q), y = [...b].sort((p, q) => p - q), r = y[0]! / x[0]!;
  return x.every((v, i) => Math.abs(y[i]! / v - r) < 1e-9);
}

// ---------- pictures ----------
export type DRole = 'first' | 'second' | 'pick' | 'link' | 'wrong' | 'ghost';
export interface DFig {
  pts: V[];
  role: DRole;
  /** a letter per vertex ('' = none) */
  labels?: string[];
  /** side labels, side i = pts[i] -> pts[i + 1] (null = none) */
  lens?: (string | null)[];
  /** angle measures at vertices (null = none) */
  angs?: (string | null)[];
  /** equal-angle marks: 0..3 arcs per vertex */
  marks?: number[];
  /** right-angle squares at these vertices */
  rights?: number[];
  /** a big name in the middle ("R", "1") */
  tag?: string;
  /** a word under the figure ("photo", "flagpole") */
  caption?: string;
  /** an order arrow A -> B -> C inside */
  order?: boolean;
  dashed?: boolean;
  /** the unknown: '?' until the solution reveals `ans` */
  ask?: { side?: number; angle?: number; ans: string };
  /** drawn only when the solution runs (it is the answer) */
  hidden?: boolean;
}
export type DilPic = {
  kind: 'plane' | 'paper';
  win: Win;
  /** plane: x- and y-axes with numbers (else plain grid paper) */
  axes: boolean;
  figs: DFig[];
  /** the center of a dilation (teal pin) */
  center?: { p: V; label?: string };
  /** a dilation of figure `fig` about c by k: rays, distance bars at `bars` vertices, the image grows (solve) */
  dil?: { fig: number; c: V; k: K; bars?: number[]; labels?: boolean; role?: DRole; given?: boolean };
  /** a tracing carried through moves (dilations and rigid motions) onto figure `to` */
  seq?: { fig: number; moves: Move[]; to?: number };
  /** paper: figure `fig` dilated, flipped, turned and slid onto figure `to` (corner i onto corner i) */
  sim?: { fig: number; to: number };
  /** marked points (a candidate image, Mia's point) */
  pts?: { p: V; label: string; role: DRole; hidden?: boolean }[];
  /** a small note at the top of the picture ("not drawn to scale") */
  note?: string;
  /** sides / angles that light up when the solution runs */
  hi?: { fig: number; side: number }[];
  hiAng?: { fig: number; at: number }[];
};
export const MAX_WIN = 16;
/** a plane window that holds the points (with axes: the origin inside), square-ish, at least `min` units */
export function planeWin(pts: readonly V[], axes: boolean, min = 8): Win {
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  let x0 = Math.floor(Math.min(...xs)) - 1, x1 = Math.ceil(Math.max(...xs)) + 1, y0 = Math.floor(Math.min(...ys)) - 1, y1 = Math.ceil(Math.max(...ys)) + 1;
  if (axes) { x0 = Math.min(x0, -1); y0 = Math.min(y0, -1); x1 = Math.max(x1, 1); y1 = Math.max(y1, 1); }
  const grow = (a: number, b: number, m: number): [number, number] => { const n = b - a; if (n >= m) return [a, b]; const e = m - n; return [a - Math.floor(e / 2), b + Math.ceil(e / 2)]; };
  [x0, x1] = grow(x0, x1, min); [y0, y1] = grow(y0, y1, min);
  const W = x1 - x0, H = y1 - y0;
  if (H < W * 0.75) [y0, y1] = grow(y0, y1, Math.ceil(W * 0.75));
  if (W < H * 0.75) [x0, x1] = grow(x0, x1, Math.ceil(H * 0.75));
  return { x0, y0, x1, y1 };
}
/** every point a picture draws, the solution's included */
export function picPoints(p: DilPic): V[] {
  const P: V[] = [];
  for (const f of p.figs) P.push(...f.pts);
  if (p.center) P.push(p.center.p);
  for (const q of p.pts ?? []) P.push(q.p);
  if (p.dil) { const F = p.figs[p.dil.fig]!; P.push(...dilateAll(F.pts, p.dil.c, kv(p.dil.k))); }
  if (p.seq) { const F = p.figs[p.seq.fig]!; for (let s = 1; s <= p.seq.moves.length; s++) for (const q of F.pts) { P.push(seqAt(p.seq.moves, q, s)); if (p.seq.moves[s - 1]!.kind === 'turn') P.push(seqAt(p.seq.moves, q, s - 0.5)); } }
  return P;
}
/** a paper window around every figure (with room for the labels) */
export function paperWin(figs: readonly DFig[], pad = 0.16, extra: readonly V[] = []): Win {
  const b = bbox([...figs.flatMap(f => f.pts), ...extra]), w = b.x1 - b.x0, h = b.y1 - b.y0, m = Math.max(w, h) * pad;
  return { x0: b.x0 - m, y0: b.y0 - m, x1: b.x1 + m, y1: b.y1 + m };
}
/** lay figures out left to right (or top to bottom) with a gap, bottoms aligned; returns new figures */
export function row(figs: DFig[], gap = 0.35, vertical = false): DFig[] {
  const boxes = figs.map(f => bbox(f.pts));
  const H = Math.max(...boxes.map(b => b.y1 - b.y0)), Wd = Math.max(...boxes.map(b => b.x1 - b.x0));
  let x = 0, y = 0;
  return figs.map((f, i) => {
    const b = boxes[i]!, w = b.x1 - b.x0, h = b.y1 - b.y0;
    const pts = vertical ? at(f.pts, (Wd - w) / 2, -y - h) : at(f.pts, x, (H - h) / 2);
    x += w + gap * Math.max(H, Wd); y += h + gap * Math.max(H, Wd) * 0.7;
    return { ...f, pts };
  });
}
/** null when the painter can draw the picture readably, else why not */
export function picProblem(p: DilPic): string | null {
  const w = p.win.x1 - p.win.x0, h = p.win.y1 - p.win.y0;
  if (p.kind === 'plane') {
    if (w > MAX_WIN || h > MAX_WIN) return `window ${w} x ${h} is wider than ${MAX_WIN} units`;
    for (const q of picPoints(p)) if (q[0] < p.win.x0 + 0.5 - EPS || q[0] > p.win.x1 - 0.5 + EPS || q[1] < p.win.y0 + 0.5 - EPS || q[1] > p.win.y1 - 0.5 + EPS) return `point ${q} is at the edge of the window`;
  } else {
    // the model area is about 900 px square: the smallest side of every figure must stay readable
    const u = Math.min(880 / w, 860 / h);
    for (const f of p.figs) { const s = Math.min(...sides(f.pts)); if (s * u < 46) return `a side of ${Math.round(s * u)} px is too short to label`; }
  }
  for (const f of p.figs) {
    if (f.labels && f.labels.length !== f.pts.length) return 'one letter per vertex';
    if (f.lens && f.lens.length !== f.pts.length) return 'one length per side';
    if (f.angs && f.angs.length !== f.pts.length) return 'one angle per vertex';
    for (let i = 0; i < f.pts.length; i++) for (let j = i + 1; j < f.pts.length; j++) if (veq(f.pts[i]!, f.pts[j]!)) return 'two vertices on one point';
  }
  if (p.dil && !p.figs[p.dil.fig]) return 'the dilation moves a figure that is not there';
  if (p.sim) { try { simMap(p.figs[p.sim.fig]!.pts, p.figs[p.sim.to]!.pts); } catch (e) { return (e as Error).message; } }
  return null;
}
export { mv, seqAt };
