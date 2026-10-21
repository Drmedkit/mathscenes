// mirrorMaths.ts: the exact maths of a reflection in a line, and the picture data a reflection item carries.
// Pure (no DOM, no canvas): items.ts, the tests and the Mirror block all use it.
//
// Coordinates are grid units with y UP and the origin at the sheet's bottom-left corner. Lines of reflection:
//   v  x = c          h  y = c          d  y = x + c  (45°, bottom-left to top-right)
//   a  y = -x + c  (45°, top-left to bottom-right)          o  an oblique line through `at` at `deg` degrees
// For v, h, d and a the image is computed exactly (whole and half units are exact in binary floating point);
// the oblique case is floating point and is checked to 1e-9.
export type Pt = [number, number];
export type LineKind = 'v' | 'h' | 'd' | 'a' | 'o';
export interface MLine { kind: LineKind; c: number; at?: Pt; deg?: number }

export const vLine = (c: number): MLine => ({ kind: 'v', c });
export const hLine = (c: number): MLine => ({ kind: 'h', c });
export const dLine = (c: number): MLine => ({ kind: 'd', c });
export const aLine = (c: number): MLine => ({ kind: 'a', c });
export const oLine = (at: Pt, deg: number): MLine => ({ kind: 'o', c: 0, at, deg });

const EPS = 1e-9;
export class ReflectError extends Error { constructor(m: string) { super(`reflection: ${m}`); this.name = 'BlockError'; } }
function need(cond: unknown, msg: string): asserts cond { if (!cond) throw new ReflectError(msg); }

/** a point q on the line, its unit direction u and unit normal n (n points to the side where offset > 0) */
export function lineFrame(L: MLine): { q: Pt; u: Pt; n: Pt } {
  const r = Math.SQRT1_2;
  switch (L.kind) {
    case 'v': return { q: [L.c, 0], u: [0, 1], n: [1, 0] };
    case 'h': return { q: [0, L.c], u: [1, 0], n: [0, 1] };
    case 'd': return { q: [0, L.c], u: [r, r], n: [-r, r] };
    case 'a': return { q: [0, L.c], u: [r, -r], n: [r, r] };
    case 'o': {
      need(L.at && Number.isFinite(L.deg), 'an oblique line needs a point and an angle');
      const t = ((L.deg ?? 0) * Math.PI) / 180, u: Pt = [Math.cos(t), Math.sin(t)];
      return { q: L.at!, u, n: [-u[1], u[0]] };
    }
  }
}
/** signed offset from the line: v, h in squares; d, a in squares across (= small diagonal steps); o in units */
export function offset(P: Pt, L: MLine): number {
  const [x, y] = P;
  switch (L.kind) {
    case 'v': return x - L.c;
    case 'h': return y - L.c;
    case 'd': return y - x - L.c;
    case 'a': return x + y - L.c;
    case 'o': { const { q, n } = lineFrame(L); return (x - q[0]) * n[0] + (y - q[1]) * n[1]; }
  }
}
export const onLine = (P: Pt, L: MLine): boolean => Math.abs(offset(P, L)) < EPS;
/** the image of P */
export function reflect(P: Pt, L: MLine): Pt {
  const [x, y] = P, c = L.c;
  switch (L.kind) {
    case 'v': return [2 * c - x, y];
    case 'h': return [x, 2 * c - y];
    case 'd': return [y - c, x + c];
    case 'a': return [c - y, c - x];
    case 'o': { const F = foot(P, L); return [2 * F[0] - x, 2 * F[1] - y]; }
  }
}
/** the foot M of the perpendicular from P to the line (the midpoint of PP') */
export function foot(P: Pt, L: MLine): Pt {
  const [x, y] = P, c = L.c;
  switch (L.kind) {
    case 'v': return [c, y];
    case 'h': return [x, c];
    case 'd': return [(x + y - c) / 2, (x + y + c) / 2];
    case 'a': return [(x - y + c) / 2, (y - x + c) / 2];
    case 'o': { const { q, u } = lineFrame(L); const t = (x - q[0]) * u[0] + (y - q[1]) * u[1]; return [q[0] + t * u[0], q[1] + t * u[1]]; }
  }
}
/** the true (perpendicular) distance to the line, in grid units */
export const perpDist = (P: Pt, L: MLine): number => (L.kind === 'd' || L.kind === 'a' ? Math.abs(offset(P, L)) * Math.SQRT1_2 : Math.abs(offset(P, L)));
/** counts for the grid procedures: squares (v, h), whole diagonal steps and small steps (d, a) */
export function stepsTo(P: Pt, L: MLine): { squares: number; whole: number | null; small: number } {
  const o = Math.abs(offset(P, L));
  if (L.kind === 'v' || L.kind === 'h') return { squares: o, whole: null, small: o };
  if (L.kind === 'd' || L.kind === 'a') return { squares: o, whole: o % 2 === 0 ? o / 2 : null, small: o };
  return { squares: o, whole: null, small: o };
}
/** one step along the perpendicular from P toward the line (squares for v/h, a whole diagonal step for d/a) */
export function stepToward(P: Pt, L: MLine, half = false): Pt {
  const s = Math.sign(offset(P, L));
  const { n } = lineFrame(L);
  if (L.kind === 'v' || L.kind === 'h') return [-s * n[0], -s * n[1]];
  const k = half ? 0.5 : 1;
  return [-s * Math.sign(n[0]) * k, -s * Math.sign(n[1]) * k];
}

export const dist = (a: Pt, b: Pt): number => Math.hypot(b[0] - a[0], b[1] - a[1]);
export const samePt = (a: Pt, b: Pt, eps = 1e-6): boolean => Math.abs(a[0] - b[0]) < eps && Math.abs(a[1] - b[1]) < eps;
export const add = (a: Pt, b: Pt, k = 1): Pt => [a[0] + k * b[0], a[1] + k * b[1]];

/** the full criterion, asserted: PP' is perpendicular to the line, the line bisects it, points on the line stay */
export function checkReflection(P: Pt, L: MLine): { image: Pt; foot: Pt } {
  const I = reflect(P, L), M = foot(P, L), { u } = lineFrame(L);
  need(onLine(M, L), `the foot of the perpendicular from (${P}) is not on the line`);
  need(Math.abs((I[0] - P[0]) * u[0] + (I[1] - P[1]) * u[1]) < 1e-9, `PP' from (${P}) is not perpendicular to the line`);
  need(Math.abs(dist(P, M) - dist(I, M)) < 1e-9, `P and P' are not the same distance from the line`);
  need(samePt([(P[0] + I[0]) / 2, (P[1] + I[1]) / 2], M, 1e-9), `the line does not pass through the midpoint of PP'`);
  need(samePt(reflect(I, L), P, 1e-9), 'reflecting twice does not give P back');
  if (onLine(P, L)) need(samePt(I, P), 'a point on the line moved');
  else need(Math.sign(offset(P, L)) === -Math.sign(offset(I, L)), "P' is not on the other side of the line");
  return { image: I, foot: M };
}

// ---------- polygons ----------
export const reflectAll = (P: readonly Pt[], L: MLine): Pt[] => P.map(p => reflect(p, L));
export const shift = (P: readonly Pt[], d: Pt): Pt[] => P.map(p => add(p, d));
export const halfTurn = (P: readonly Pt[], c: Pt): Pt[] => P.map(p => [2 * c[0] - p[0], 2 * c[1] - p[1]] as Pt);
/** twice the signed area: > 0 counterclockwise (y up), < 0 clockwise */
export function area2(P: readonly Pt[]): number {
  let s = 0;
  for (let i = 0; i < P.length; i++) { const a = P[i]!, b = P[(i + 1) % P.length]!; s += a[0] * b[1] - b[0] * a[1]; }
  return s;
}
export const orientation = (P: readonly Pt[]): 'ccw' | 'cw' => (area2(P) > 0 ? 'ccw' : 'cw');
export const centroid = (P: readonly Pt[]): Pt => [P.reduce((s, p) => s + p[0], 0) / P.length, P.reduce((s, p) => s + p[1], 0) / P.length];

/** the part of the line inside the sheet [0, cols] x [0, rows], or null */
export function lineInSheet(L: MLine, cols: number, rows: number): [Pt, Pt] | null {
  const { q, u } = lineFrame(L);
  let t0 = -1e9, t1 = 1e9;
  for (const [p, d, lo, hi] of [[q[0], u[0], 0, cols], [q[1], u[1], 0, rows]] as const) {
    if (Math.abs(d) < 1e-12) { if (p < lo - EPS || p > hi + EPS) return null; continue; }
    let a = (lo - p) / d, b = (hi - p) / d;
    if (a > b) [a, b] = [b, a];
    t0 = Math.max(t0, a); t1 = Math.min(t1, b);
  }
  if (t1 - t0 < 1e-6) return null;
  return [[q[0] + t0 * u[0], q[1] + t0 * u[1]], [q[0] + t1 * u[0], q[1] + t1 * u[1]]];
}

// ---------- the picture an item carries ----------
export type PicRole = 'first' | 'link' | 'pick' | 'dim' | 'wrong' | 'second';
/** a labelled point; style 'blob' is a dab of paint */
export interface Pin { at: Pt; label?: string; role: PicRole; style?: 'dot' | 'blob' }
/** a polygon (closed) or an open path; labels per vertex (null = none) */
export interface Poly { pts: Pt[]; labels?: (string | null)[]; role: PicRole; open?: boolean }
/** a numbered candidate spot */
export interface Spot { at: Pt; n: number }
/** a numbered candidate line through a and b */
export interface CandLine { a: Pt; b: Pt; n: number }
export interface Seg { a: Pt; b: Pt; role: PicRole; dash?: boolean; ticks?: number }
/** a right-angle mark at `at` between the directions u and v (unit vectors in grid space) */
export interface Mark { at: Pt; u: Pt; v: Pt }
/** a length written beside the segment a-b */
export interface Note { a: Pt; b: Pt; text: string }
export interface Solve {
  /** reflect these points: perpendicular, counting hops, the same count beyond, the image */
  pts: { from: Pt; label?: string }[];
  hops: 'square' | 'diag' | 'half' | 'none';
  /** the right-angle tool at the first foot (plain paper) */
  tool?: boolean;
  /** the image polygon, drawn when the solution lands */
  poly?: Poly;
  /** the spot / candidate line that is right (ringed in lime) */
  spot?: number; cand?: number;
  /** the true line of reflection, drawn in lime (locate / bisect) */
  line?: MLine;
  /** vertex-order arrows inside these polygons */
  orient?: Pt[][];
}
export interface MirrorPic {
  cols: number; rows: number;
  /** graph paper (true) or plain paper (false) */
  grid: boolean;
  line: MLine | null;
  /** only this piece of the line is drawn (with arrowheads: it goes on) */
  part?: [Pt, Pt];
  lineLabel?: string;
  figure?: Poly[]; pins?: Pin[];
  image?: Poly[]; imagePins?: Pin[];
  spots?: Spot[]; cands?: CandLine[]; segs?: Seg[]; marks?: Mark[]; notes?: Note[];
  /** a "not to scale" note on the sheet */
  notToScale?: boolean;
  solve?: Solve;
  /** TeX lines the worked solution writes on the board */
  solveTex?: string[];
}

/** can the picture be drawn? null = yes, else the reason (generators only make what the block can draw) */
export function picFits(p: MirrorPic): string | null {
  if (p.cols < 4 || p.cols > 22 || p.rows < 4 || p.rows > 16) return `sheet ${p.cols} x ${p.rows}`;
  const inside = (q: Pt) => q[0] >= -1e-9 && q[0] <= p.cols + 1e-9 && q[1] >= -1e-9 && q[1] <= p.rows + 1e-9;
  const all: Pt[] = [];
  for (const P of [...(p.figure ?? []), ...(p.image ?? []), ...(p.solve?.poly ? [p.solve.poly] : [])]) all.push(...P.pts);
  for (const P of [...(p.pins ?? []), ...(p.imagePins ?? [])]) all.push(P.at);
  for (const s of p.spots ?? []) all.push(s.at);
  for (const s of p.solve?.pts ?? []) { all.push(s.from); if (p.line) all.push(reflect(s.from, p.line)); }
  for (const q of all) if (!inside(q)) return `point (${q[0]}, ${q[1]}) is off the sheet`;
  if (p.line && !lineInSheet(p.line, p.cols, p.rows)) return 'the line misses the sheet';
  for (const c of p.cands ?? []) {
    const dx = c.b[0] - c.a[0], dy = c.b[1] - c.a[1];
    if (Math.hypot(dx, dy) < 1e-9 || !lineInSheet({ kind: 'o', c: 0, at: c.a, deg: (Math.atan2(dy, dx) * 180) / Math.PI }, p.cols, p.rows)) return `candidate line ${c.n} misses the sheet`;
  }
  const sp = p.spots ?? [];
  for (let i = 0; i < sp.length; i++) for (let j = i + 1; j < sp.length; j++) if (dist(sp[i]!.at, sp[j]!.at) < 0.9) return 'two spots are too close';
  if (new Set(sp.map(s => s.n)).size !== sp.length) return 'spot numbers repeat';
  return null;
}
