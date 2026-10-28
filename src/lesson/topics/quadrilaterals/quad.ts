// quad.ts: the exact maths of "Parallelograms and other quadrilaterals" (Geometry, lesson 8). Pure: no DOM.
//   shapes     a quadrilateral ABCD (counterclockwise, model units with y up) built from its defining numbers:
//              parallelogram family (two sides and the angle at A), kite (axis AC, B and D mirrored), trapezoid
//              (bases AB and DC), a general convex quadrilateral; turned about its centroid
//   facts      what the coordinates SHOW (parallel pairs, equal sides, right angles, the diagonals: bisect each other,
//              congruent, perpendicular, bisect the vertex angles) and the most specific class (inclusive trapezoid,
//              kite = two pairs of adjacent congruent sides, isosceles trapezoid = a non-parallelogram trapezoid with
//              congruent legs)
//   figures    qfig: the course's buildFig (tick groups equal, arc groups equal, boxes 90°, or it throws) plus a check
//              that every chevron group is parallel and points the same way
//   polygons   regular n-gons and convex polygons with prescribed interior angles (exact closure)
import type { Fig, Pt } from '../geometry-foundations/geo';
import { add, dist, measure, meet, mul, rotP, sub } from '../geometry-foundations/geo';
import { type FMark, type FigSpec, buildFig } from '../triangle-congruence/tri';

export type Q4 = [Pt, Pt, Pt, Pt];
export type QK = 'square' | 'rect' | 'rhombus' | 'para' | 'kite' | 'isoTrap' | 'trap' | 'quad';
export const QK_ALL: QK[] = ['square', 'rect', 'rhombus', 'para', 'kite', 'isoTrap', 'trap', 'quad'];
const D2R = Math.PI / 180;
const ri = (R: () => number, lo: number, hi: number) => lo + Math.floor(R() * (hi - lo + 1));

// ---------- shapes ----------
/** A at the origin, AB = a along x, AD = b at `deg` from AB */
export function paraPts(a: number, b: number, deg: number): Q4 {
  const A: Pt = [0, 0], B: Pt = [a, 0], D: Pt = [b * Math.cos(deg * D2R), b * Math.sin(deg * D2R)];
  return [A, B, add(B, D), D];
}
/** kite: A and C on the axis (AC = p + q), B below and D above at x = p: AB = AD, CB = CD */
export function kitePts(p: number, q: number, h: number): Q4 { return [[0, 0], [p, -h], [p + q, 0], [p, h]]; }
/** trapezoid: base AB = a on the x axis, top DC = top at height h, D at x = off */
export function trapPts(a: number, top: number, off: number, h: number): Q4 { return [[0, 0], [a, 0], [off + top, h], [off, h]]; }
export const centroidQ = (Q: readonly Pt[]): Pt => mul(Q.reduce((s, p) => add(s, p), [0, 0] as Pt), 1 / Q.length);
export const turnQ = <T extends Pt[]>(Q: T, deg: number): T => { const c = centroidQ(Q); return Q.map(p => rotP(p, deg, c)) as T; };

/** a random shape of kind k (no accidental look-alikes: a parallelogram is never within 15° of a rectangle, adjacent
 *  sides differ by 20 % or more unless the kind makes them equal, a kite is never a rhombus, a trapezoid is neither
 *  isosceles nor right unless asked) */
export function makeQ(R: () => number, k: QK, o: { turn?: number; size?: number } = {}): Q4 {
  const S = o.size ?? 360;
  let Q: Q4;
  const acute = () => ri(R, 56, 74), ratio = () => 1.3 + R() * 0.45;
  switch (k) {
    case 'square': Q = paraPts(S * 0.85, S * 0.85, 90); break;
    case 'rect': { const r = ratio(); Q = paraPts(S, S / r, 90); break; }
    case 'rhombus': { const d = acute(); Q = paraPts(S * 0.8, S * 0.8, d); break; }
    case 'para': { const r = ratio(), d = acute(); Q = R() < 0.5 ? paraPts(S, S / r, d) : paraPts(S / r, S, d); break; }
    case 'kite': { const L = S * 1.15, p = L * (0.3 + R() * 0.12), h = L * (0.26 + R() * 0.1); Q = kitePts(p, L - p, h); break; }
    case 'isoTrap': { const a = S * 1.1, top = a * (0.42 + R() * 0.2), h = S * (0.5 + R() * 0.15); Q = trapPts(a, top, (a - top) / 2, h); break; }
    case 'trap': {
      for (;;) {
        const a = S * 1.1, top = a * (0.4 + R() * 0.25), h = S * (0.5 + R() * 0.15), off = (a - top) * (R() < 0.5 ? 0.12 + R() * 0.2 : 0.68 + R() * 0.2);
        const t = trapPts(a, top, off, h);
        if (Math.abs(off - (a - top) / 2) > 0.12 * a && Math.min(...anglesQ(t).map(x => Math.abs(x - 90))) > 10) { Q = t; break; }
      }
      break;
    }
    case 'quad': {
      for (;;) {
        const t: Q4 = [[0, 0], [S * (0.9 + R() * 0.3), S * (-0.05 + R() * 0.15)], [S * (0.7 + R() * 0.45), S * (0.55 + R() * 0.3)], [S * (-0.15 + R() * 0.25), S * (0.5 + R() * 0.3)]];
        if (generic(t)) { Q = t; break; }
      }
      break;
    }
  }
  return o.turn ? turnQ(Q, o.turn) : Q;
}
/** a convex quadrilateral with no parallel sides (8° or more apart), no two sides within 12 %, no right angle within 8° */
export function generic(Q: Q4): boolean {
  if (!convex(Q)) return false;
  const s = sidesQ(Q), a = anglesQ(Q);
  for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) if (Math.abs(s[i]! - s[j]!) < 0.12 * Math.max(s[i]!, s[j]!)) return false;
  if (a.some(x => Math.abs(x - 90) < 8 || x < 50 || x > 140)) return false;
  for (const [i, j] of [[0, 2], [1, 3]] as const) if (dirDiff(Q, i, j) < 8) return false;
  return true;
}

// ---------- facts ----------
export const sidesQ = (Q: Q4): number[] => [0, 1, 2, 3].map(i => dist(Q[i]!, Q[(i + 1) % 4]!));
export const anglesQ = (Q: Q4): number[] => [0, 1, 2, 3].map(i => measure(Q[i]!, Q[(i + 3) % 4]!, Q[(i + 1) % 4]!));
export function convex(Q: Q4): boolean {
  const cr = [0, 1, 2, 3].map(i => { const a = sub(Q[(i + 1) % 4]!, Q[i]!), b = sub(Q[(i + 2) % 4]!, Q[(i + 1) % 4]!); return a[0] * b[1] - a[1] * b[0]; });
  return cr.every(x => x > 0) || cr.every(x => x < 0);
}
/** the angle (0..90) between side i (Q[i] -> Q[i+1]) and side j as undirected lines */
export function dirDiff(Q: Q4, i: number, j: number): number {
  const u = sub(Q[(i + 1) % 4]!, Q[i]!), w = sub(Q[(j + 1) % 4]!, Q[j]!);
  const c = Math.abs(u[0] * w[0] + u[1] * w[1]) / (Math.hypot(...u) * Math.hypot(...w));
  return Math.acos(Math.min(1, c)) / D2R;
}
export const diagMeet = (Q: Q4): Pt => meet(Q[0], sub(Q[2], Q[0]), Q[1], sub(Q[3], Q[1]));
const eq = (a: number, b: number) => Math.abs(a - b) <= 1e-6 * Math.max(1, Math.abs(a), Math.abs(b));
export interface QFacts {
  parAB: boolean; parAD: boolean; sides: number[]; angles: number[];
  diagBisect: boolean; diagCong: boolean; diagPerp: boolean;
  /** the diagonal from vertex i bisects the angle at i */
  bisectsAt: boolean[];
  kind: QK;
}
export function factsOf(Q: Q4): QFacts {
  const s = sidesQ(Q), a = anglesQ(Q), E = diagMeet(Q);
  const parallel = (i: number, j: number) => { const u = sub(Q[(i + 1) % 4]!, Q[i]!), w = sub(Q[(j + 1) % 4]!, Q[j]!); return Math.abs(u[0] * w[1] - u[1] * w[0]) <= 1e-9 * Math.hypot(...u) * Math.hypot(...w); };
  const parAB = parallel(0, 2), parAD = parallel(1, 3);
  const diagBisect = eq(dist(Q[0], E), dist(E, Q[2])) && eq(dist(Q[1], E), dist(E, Q[3]));
  const diagCong = eq(dist(Q[0], Q[2]), dist(Q[1], Q[3]));
  const diagPerp = Math.abs(measure(E, Q[0], Q[1]) - 90) < 1e-6;
  const bisectsAt = [0, 1, 2, 3].map(i => eq(measure(Q[i]!, Q[(i + 3) % 4]!, Q[(i + 2) % 4]!), measure(Q[i]!, Q[(i + 2) % 4]!, Q[(i + 1) % 4]!)));
  const right = a.every(x => Math.abs(x - 90) < 1e-6), allEq = s.every(x => eq(x, s[0]!));
  let kind: QK;
  if (parAB && parAD) kind = right && allEq ? 'square' : right ? 'rect' : allEq ? 'rhombus' : 'para';
  else if ((eq(s[0]!, s[3]!) && eq(s[1]!, s[2]!)) || (eq(s[0]!, s[1]!) && eq(s[2]!, s[3]!))) kind = 'kite';
  else if (parAB || parAD) kind = (parAB ? eq(s[1]!, s[3]!) : eq(s[0]!, s[2]!)) ? 'isoTrap' : 'trap';
  else kind = 'quad';
  return { parAB, parAD, sides: s, angles: a, diagBisect, diagCong, diagPerp, bisectsAt, kind };
}

// ---------- names and the hierarchy ----------
export const NAME: Record<QK, string> = { square: 'square', rect: 'rectangle', rhombus: 'rhombus', para: 'parallelogram', kite: 'kite', isoTrap: 'isosceles trapezoid', trap: 'trapezoid', quad: 'quadrilateral' };
export const PLURAL: Record<QK, string> = { square: 'squares', rect: 'rectangles', rhombus: 'rhombuses', para: 'parallelograms', kite: 'kites', isoTrap: 'isosceles trapezoids', trap: 'trapezoids', quad: 'quadrilaterals' };
export const ART: Record<QK, string> = { square: 'a square', rect: 'a rectangle', rhombus: 'a rhombus', para: 'a parallelogram', kite: 'a kite', isoTrap: 'an isosceles trapezoid', trap: 'a trapezoid', quad: 'a quadrilateral' };
/** every class a member of class k belongs to (inclusive trapezoid; a rhombus is a kite; an isosceles trapezoid is
 *  not a parallelogram by its convention) */
export const UP: Record<QK, QK[]> = {
  square: ['square', 'rect', 'rhombus', 'para', 'trap', 'kite', 'quad'],
  rect: ['rect', 'para', 'trap', 'quad'],
  rhombus: ['rhombus', 'para', 'trap', 'kite', 'quad'],
  para: ['para', 'trap', 'quad'],
  kite: ['kite', 'quad'],
  isoTrap: ['isoTrap', 'trap', 'quad'],
  trap: ['trap', 'quad'],
  quad: ['quad'],
};
/** is every member of class a a member of class b? */
export const every = (a: QK, b: QK): boolean => UP[a].includes(b);
/** do the classes share a member? */
export const some = (a: QK, b: QK): boolean => QK_ALL.some(k => UP[k].includes(a) && UP[k].includes(b));
/** the convention line every item that names trapezoids or kites states */
export const TRAP_DEF = 'Here a trapezoid has at least one pair of parallel sides, and a kite has two pairs of adjacent congruent sides.';
export const ISO_DEF = 'An isosceles trapezoid here is a trapezoid with congruent legs that is not a parallelogram.';

// ---------- figures ----------
export type QMark = FMark;
/** a quadrilateral figure: points A, B, C, D (+ E where the diagonals meet), the sides as AB, BC, DC, AD (so chevrons on
 *  a parallel pair point the same way), diagonals optional (whole, or as halves AE, EC, BE, ED) */
export function qfig(Q: Q4, marks: QMark[], o: { diags?: 'whole' | 'halves' | 'AC' | 'BD'; extraPts?: Record<string, Pt>; extraSegs?: string[]; segStyle?: FigSpec['segStyle']; bare?: string[]; dirs?: Record<string, number>; noBody?: boolean } = {}): Fig {
  const pts: Record<string, Pt> = { A: Q[0], B: Q[1], C: Q[2], D: Q[3], ...(o.extraPts ?? {}) };
  const segs = ['AB', 'BC', 'DC', 'AD'];
  if (o.diags === 'whole') segs.push('AC', 'BD');
  if (o.diags === 'AC') segs.push('AC');
  if (o.diags === 'BD') segs.push('BD');
  if (o.diags === 'halves') { pts.E = diagMeet(Q); segs.push('AE', 'EC', 'BE', 'ED'); }
  segs.push(...(o.extraSegs ?? []));
  const f = buildFig({ pts, segs, marks, segStyle: o.segStyle, bare: o.bare, dirs: o.dirs, fills: o.noBody ? undefined : [{ pts: 'ABCD' }] });
  const pp = parProblems(f);
  if (pp.length) throw new Error(pp.join('; '));
  return { ...f, maxS: 2.2 };
}
/** every chevron group: parallel segments pointing the same way */
export function parProblems(f: Fig): string[] {
  const out: string[] = [];
  const groups = new Map<number, Pt[]>();
  for (const s of f.segs) if (s.par) groups.set(s.par, [...(groups.get(s.par) ?? []), sub(s.b, s.a)]);
  for (const [k, us] of groups) for (const u of us.slice(1)) {
    const w = us[0]!, cr = (u[0] * w[1] - u[1] * w[0]) / (Math.hypot(...u) * Math.hypot(...w)), dot = u[0] * w[0] + u[1] * w[1];
    if (Math.abs(cr) > 1e-9) out.push(`chevron group ${k} is not parallel`);
    else if (dot < 0) out.push(`chevron group ${k} points both ways`);
  }
  return out;
}
export const par = (seg: string, n: number): FMark => ({ seg, par: n });

// ---------- polygons ----------
/** a regular n-gon of circumradius r, one side flat at the bottom */
export function regularPts(n: number, r: number): Pt[] {
  const a0 = -90 - 180 / n;
  return Array.from({ length: n }, (_, i) => [r * Math.cos((a0 + (360 * i) / n) * D2R), r * Math.sin((a0 + (360 * i) / n) * D2R)] as Pt);
}
/** a convex polygon with the given interior angles (sum (n-2)·180), counterclockwise: the first n-2 sides are chosen,
 *  the last two close the polygon; null when they would not be positive and similar in size */
export function polyWithAngles(R: () => number, angles: readonly number[], S = 260): Pt[] | null {
  const n = angles.length;
  const ext = angles.map(a => 180 - a);
  // heading of side i (from vertex i to i+1): side 0 heads 0°, then turns by the exterior angle at vertex i+1
  const head: number[] = [0];
  for (let i = 1; i < n; i++) head.push(head[i - 1]! + ext[i]!);
  const L: number[] = Array.from({ length: n - 2 }, () => S * (0.7 + R() * 0.6));
  let x = 0, y = 0;
  for (let i = 0; i < n - 2; i++) { x += L[i]! * Math.cos(head[i]! * D2R); y += L[i]! * Math.sin(head[i]! * D2R); }
  // solve s·u + t·w = -(x, y) for the last two sides
  const u: Pt = [Math.cos(head[n - 2]! * D2R), Math.sin(head[n - 2]! * D2R)], w: Pt = [Math.cos(head[n - 1]! * D2R), Math.sin(head[n - 1]! * D2R)];
  const det = u[0] * w[1] - u[1] * w[0];
  if (Math.abs(det) < 1e-9) return null;
  const s = (-x * w[1] + y * w[0]) / det, t = (-u[0] * y + u[1] * x) / det;
  if (!(s > S * 0.45 && t > S * 0.45 && s < S * 1.8 && t < S * 1.8)) return null;
  const P: Pt[] = [[0, 0]];
  const all = [...L, s];
  for (let i = 0; i < n - 1; i++) P.push(add(P[i]!, [all[i]! * Math.cos(head[i]! * D2R), all[i]! * Math.sin(head[i]! * D2R)]));
  return P;
}
/** interior angles of a polygon (counterclockwise) */
export const polyAngles = (P: readonly Pt[]): number[] => P.map((p, i) => measure(p, P[(i + P.length - 1) % P.length]!, P[(i + 1) % P.length]!));
export const polyName = (n: number): string => ({ 3: 'triangle', 4: 'quadrilateral', 5: 'pentagon', 6: 'hexagon', 7: 'heptagon', 8: 'octagon', 9: 'nonagon', 10: 'decagon', 12: 'dodecagon' } as Record<number, string>)[n] ?? `${n}-gon`;
export { ri };
