// figs.ts: the figure builders of the lesson (pure, exact). Every builder computes its points from the numbers the
// item states, so a measure on the drawing is the measure in the question.
//   onLine        points on a segment / line in a stated order (segment addition, midpoints, overlapping segments)
//   fan           rays from one vertex (angle names, angle addition, bisectors, right-angle boxes)
//   crossing      two lines crossing at a point, angles 1-4 (vertical angles, linear pairs)
//   transversal   lines ℓ and m (parallel or not) cut by t, angles 1-8 in textbook slots
//   box3d         a box with two edges that never meet and are not in one plane (skew lines)
//   quads         square, rhombus, rectangle, tilted right angle ... for galleries
import { type Fig, type GAngle, type GPoint, type GSeg, type MarkCol, type Pt, add, at, dirv, meet, mul, norm, sub } from './geo';

export const LETTERS = 'ABCDEFGHJKMNPQRSTUVWXYZ'.split('');
/** n distinct point letters, alphabetical (a figure reads in order) */
export function letters(R: () => number, n: number): string[] {
  const start = Math.floor(R() * (LETTERS.length - n + 1));
  const pool = LETTERS.slice(start, start + n + 3);
  const out: string[] = [];
  while (out.length < n) { const c = pool[Math.floor(R() * pool.length)]!; if (!out.includes(c)) out.push(c); }
  return out.sort();
}

// ---------- points on a line ----------
export interface OnLineOpts {
  /** turn the line (degrees) */
  deg?: number;
  kind?: 'seg' | 'line';
  /** ticks on the parts between consecutive points (index i = part i) */
  ticks?: (number | undefined)[];
  /** labels on the parts */
  texts?: (string | undefined)[];
  alts?: (string | undefined)[];
  cols?: (MarkCol | undefined)[];
  ids?: string[];
}
/** points at distances xs (model units) along a line; the parts between them are separate segments (ids p0, p1 ...) */
export function onLine(names: string[], xs: number[], o: OnLineOpts = {}): Fig {
  const deg = o.deg ?? 0, u = dirv(deg), P = (x: number): Pt => mul(u, x);
  const lo = xs[0]!, hi = xs[xs.length - 1]!, mid = (lo + hi) / 2;
  const pts = xs.map(x => P(x - mid));
  const segs: GSeg[] = [];
  if (o.kind === 'line') segs.push({ id: 'line', a: P(lo - mid - 70), b: P(hi - mid + 70), kind: 'line', col: 'faint' });
  for (let i = 0; i + 1 < pts.length; i++) {
    segs.push({ id: o.ids?.[i] ?? `p${i}`, a: pts[i]!, b: pts[i + 1]!, ticks: o.ticks?.[i], text: o.texts?.[i], alt: o.alts?.[i], col: o.cols?.[i], side: 1 });
  }
  const up = norm(deg + 90), down = norm(deg - 90);
  const points: GPoint[] = names.map((n, i) => ({ at: pts[i]!, name: n, dir: o.texts?.[i] || o.texts?.[i - 1] ? down : up }));
  // labels above the line (side +1 is left of a->b = above for deg 0), letters below
  for (const p of points) p.dir = down;
  return { segs, angles: [], points, pad: 90 };
}

// ---------- a fan of rays ----------
export interface Ray { name: string; deg: number; len?: number; kind?: 'ray' | 'seg' }
/** rays from a vertex V (named) at the given directions; returns the figure and the ray end points */
export function fan(vName: string, rays: Ray[], marks: GAngle[] = [], o: { vertexDir?: number } = {}): { fig: Fig; end: Record<string, Pt> } {
  const V: Pt = [0, 0];
  const end: Record<string, Pt> = { [vName]: V };
  const segs: GSeg[] = rays.map(r => { const E = at(V, r.deg, r.len ?? 300); end[r.name] = E; return { id: 'r' + r.name, a: V, b: E, kind: r.kind ?? 'ray' }; });
  const points: GPoint[] = [
    { at: V, name: vName, dir: o.vertexDir ?? oppositeGap(rays.map(r => r.deg)) },
    ...rays.map(r => ({ at: at(V, r.deg, (r.len ?? 300) * 0.82), name: r.name, dir: norm(r.deg + (r.deg > 90 && r.deg < 270 ? -90 : 90)), dist: 40 })),
  ];
  return { fig: { segs, angles: marks, points, pad: 80 }, end };
}
/** the direction in the middle of the widest gap between rays (where the vertex letter goes) */
export function oppositeGap(degs: number[]): number {
  const d = degs.map(norm).sort((a, b) => a - b);
  let best = 0, at0 = 0;
  for (let i = 0; i < d.length; i++) { const a = d[i]!, b = i + 1 < d.length ? d[i + 1]! : d[0]! + 360; if (b - a > best) { best = b - a; at0 = a + (b - a) / 2; } }
  return norm(at0);
}
/** an angle mark between the rays to p and q of a fan at V */
export const mark = (id: string, end: Record<string, Pt>, v: string, p: string, q: string, o: Partial<GAngle> = {}): GAngle => ({ id, v: end[v]!, p: end[p]!, q: end[q]!, ...o });

// ---------- two lines crossing ----------
/** lines AC and BD crossing at E; line AC at angle 0 (turned by `turn`), BD at angle `theta`. Angles: 1 = between
 *  EB and EA... the numbering goes counterclockwise from ray EC: 1 (EC, EB), 2 (EB, EA), 3 (EA, ED), 4 (ED, EC). */
export function crossing(theta: number, turn: number, names: [string, string, string, string, string], o: { marks?: GAngle[]; numbers?: boolean; texts?: Record<number, string | undefined>; cols?: Record<number, MarkCol | undefined>; alts?: Record<number, string | undefined> } = {}): { fig: Fig; E: Pt; ray: Pt[] } {
  const [A, B, C, D, Ename] = names, E: Pt = [0, 0], r = 330;
  const dC = turn, dB = turn + theta, dA = turn + 180, dD = turn + theta + 180;
  const ray = [at(E, dC, r), at(E, dB, r), at(E, dA, r), at(E, dD, r)];   // C, B, A, D
  const segs: GSeg[] = [
    { id: 'AC', a: ray[2]!, b: ray[0]!, kind: 'line' },
    { id: 'BD', a: ray[3]!, b: ray[1]!, kind: 'line' },
  ];
  const pairs: [number, number][] = [[0, 1], [1, 2], [2, 3], [3, 0]];
  const angles: GAngle[] = o.numbers === false ? [] : pairs.map(([i, j], k) => {
    const n = k + 1, t = o.texts?.[n];
    return { id: 'a' + n, v: E, p: ray[i]!, q: ray[j]!, text: t ?? String(n), alt: o.alts?.[n], nameOnly: t === undefined && !o.cols?.[n], col: o.cols?.[n] } as GAngle;
  });
  const lab = (deg: number, name: string): GPoint => ({ at: at(E, deg, r * 0.8), name, dir: norm(deg + 90), dist: 42 });
  // the crossing's letter sits in the widest angle, outside the number labels
  const wide = theta < 90 ? dC + theta + (180 - theta) / 2 : dC + theta / 2;
  const points: GPoint[] = [lab(dC, C), lab(dB, B), lab(dA, A), lab(dD, D), { at: E, name: Ename, dir: norm(wide), dist: 130 }];
  return { fig: { segs, angles: [...angles, ...(o.marks ?? [])], points, pad: 70 }, E, ray };
}

// ---------- a transversal ----------
export interface TransOpts {
  /** the angle of t with ℓ (degrees, measured counterclockwise from ℓ's right ray) */
  theta: number;
  /** m is turned by delta degrees (0 = parallel to ℓ) */
  delta?: number;
  /** parallel chevrons on ℓ and m */
  marks?: boolean;
  /** per slot 1-8: a label (a measure, an expression); undefined = the slot number alone */
  texts?: Record<number, string | undefined>;
  alts?: Record<number, string | undefined>;
  cols?: Record<number, MarkCol | undefined>;
  /** show the slot numbers of unlabeled angles */
  numbers?: boolean;
  /** only these slots get a mark at all */
  only?: number[];
  turn?: number;
  /** half-length of l and m (model units) */
  W?: number;
}
/** slots: at P on ℓ: 1 upper-left, 2 upper-right, 3 lower-left, 4 lower-right; at Q on m: 5, 6, 7, 8 the same */
export function transversal(o: TransOpts): Fig {
  const th = o.theta, dl = o.delta ?? 0, h = 300, W = o.W ?? 460;
  const P: Pt = [h / 2 / Math.tan((th * Math.PI) / 180), h / 2], Q0: Pt = [-P[0], -h / 2];
  const Q = Q0;
  const tU = dirv(th);
  const lA: Pt = [P[0] - W, h / 2], lB: Pt = [P[0] + W, h / 2];
  const mU = dirv(dl), mA = sub(Q, mul(mU, W)), mB = add(Q, mul(mU, W));
  const tA = sub(Q, mul(tU, 220)), tB = add(P, mul(tU, 220));
  const segs: GSeg[] = [
    { id: 'l', a: lA, b: lB, kind: 'line', name: 'ℓ', par: o.marks ? 1 : undefined, parAt: 0.8 },
    { id: 'm', a: mA, b: mB, kind: 'line', name: 'm', par: o.marks ? 1 : undefined, parAt: 0.8 },
    { id: 't', a: tA, b: tB, kind: 'line', name: 't' },
  ];
  const r = (V: Pt, d: number): Pt => at(V, d, 100);
  const slot = (n: number): [Pt, Pt, Pt] => {
    const V = n <= 4 ? P : Q, base = n <= 4 ? 0 : dl;
    const up = th, dn = th + 180;
    switch ((n - 1) % 4) {
      case 0: return [V, r(V, up), r(V, base + 180)];
      case 1: return [V, r(V, base), r(V, up)];
      case 2: return [V, r(V, base + 180), r(V, dn)];
      default: return [V, r(V, dn), r(V, base + 360)];
    }
  };
  const angles: GAngle[] = [];
  for (let n = 1; n <= 8; n++) {
    if (o.only && !o.only.includes(n)) continue;
    const t = o.texts?.[n];
    if (t === undefined && o.numbers === false && !o.cols?.[n]) continue;
    const [v, p, q] = slot(n);
    angles.push({ id: 'a' + n, v, p, q, text: t ?? String(n), alt: o.alts?.[n], col: o.cols?.[n], nameOnly: t === undefined && !o.cols?.[n] });
  }
  const f: Fig = { segs, angles, points: [], pad: 70 };
  return o.turn ? turnFigSafe(f, o.turn) : f;
}
function turnFigSafe(f: Fig, deg: number): Fig {
  const T = (p: Pt): Pt => { const r = (deg * Math.PI) / 180; return [p[0] * Math.cos(r) - p[1] * Math.sin(r), p[0] * Math.sin(r) + p[1] * Math.cos(r)]; };
  return { ...f, segs: f.segs.map(s => ({ ...s, a: T(s.a), b: T(s.b) })), angles: f.angles.map(a => ({ ...a, v: T(a.v), p: T(a.p), q: T(a.q) })), points: f.points.map(p => ({ ...p, at: T(p.at), dir: norm(p.dir + deg) })) };
}
/** the measure of slot n (1-8) in a transversal figure with angle theta and m turned by delta */
export function slotMeasure(n: number, theta: number, delta = 0): number {
  const top = n <= 4, a = top ? theta : theta - delta;
  return [1, 4].includes(((n - 1) % 4) + 1) ? 180 - a : a;
}
export type PairName = 'corresponding' | 'alternate interior' | 'alternate exterior' | 'consecutive interior' | 'vertical' | 'linear pair';
export function pairName(a: number, b: number): PairName | null {
  const [x, y] = a < b ? [a, b] : [b, a];
  const k = (n: number) => ((n - 1) % 4);   // 0 UL, 1 UR, 2 LL, 3 LR
  if (y <= 4 || x > 4) {
    if (k(x) + k(y) === 3) return 'vertical';
    return 'linear pair';
  }
  if (k(x) === k(y)) return 'corresponding';
  const isInner = (n: number) => (n <= 4 ? k(n) >= 2 : k(n) <= 1);
  const left = (n: number) => k(n) % 2 === 0;
  if (isInner(x) && isInner(y)) return left(x) === left(y) ? 'consecutive interior' : 'alternate interior';
  if (!isInner(x) && !isInner(y)) return left(x) === left(y) ? null : 'alternate exterior';
  return null;
}

// ---------- a box (skew edges) ----------
export function box3d(names: string[]): Fig {
  // oblique projection: front face 360 x 240, depth 160 at 30 degrees
  const w = 360, hh = 240, d: Pt = [150, 95];
  const A: Pt = [-w / 2, -hh / 2], B: Pt = [w / 2, -hh / 2], C: Pt = [w / 2, hh / 2], D: Pt = [-w / 2, hh / 2];
  const E = add(A, d), F = add(B, d), G = add(C, d), H = add(D, d);
  const P = [A, B, C, D, E, F, G, H];
  const edge = (i: number, j: number, o: Partial<GSeg> = {}): GSeg => ({ id: `${names[i]}${names[j]}`, a: P[i]!, b: P[j]!, col: 'faint', ...o });
  const segs: GSeg[] = [edge(0, 1), edge(1, 2), edge(2, 3), edge(3, 0), edge(1, 5), edge(2, 6), edge(3, 7), edge(5, 6), edge(6, 7), edge(4, 5, { dash: true }), edge(4, 7, { dash: true }), edge(0, 4, { dash: true })];
  const dirs = [225, 315, 315, 180, 135, 0, 45, 135];
  const points: GPoint[] = P.map((p, i) => ({ at: p, name: names[i]!, dir: dirs[i]!, dist: 40 }));
  return { segs, angles: [], points, pad: 80 };
}

// ---------- quadrilaterals and single angles for galleries ----------
export function quad(kind: 'square' | 'rhombus' | 'rect', turn: number, acute = 70): Fig {
  const s = 220;
  let P: Pt[];
  if (kind === 'square') P = [[0, 0], [s, 0], [s, s], [0, s]];
  else if (kind === 'rect') P = [[0, 0], [s * 1.5, 0], [s * 1.5, s * 0.8], [0, s * 0.8]];
  else { const u = dirv(acute); P = [[0, 0], [s, 0], add([s, 0], mul(u, s)), mul(u, s)]; }
  const c = mul(P.reduce((a, b) => add(a, b), [0, 0] as Pt), 1 / 4);
  const r = (p: Pt): Pt => { const q = sub(p, c), t = (turn * Math.PI) / 180; return [q[0] * Math.cos(t) - q[1] * Math.sin(t), q[0] * Math.sin(t) + q[1] * Math.cos(t)]; };
  const Q = P.map(r);
  const eq = kind !== 'rect';
  const segs: GSeg[] = Q.map((p, i) => ({ id: 's' + i, a: p, b: Q[(i + 1) % 4]!, ticks: eq ? 1 : i % 2 === 0 ? 1 : 2 }));
  const angles: GAngle[] = Q.map((p, i) => {
    const prev = Q[(i + 3) % 4]!, next = Q[(i + 1) % 4]!;
    if (kind !== 'rhombus') return { id: 'q' + i, v: p, p: prev, q: next, box: true, bare: true, r: 30 };
    const m = i % 2 === 0 ? acute : 180 - acute;
    return { id: 'q' + i, v: p, p: next, q: prev, text: `${m}°`, bare: true, r: 34 };
  });
  return { segs, angles, points: [], fills: [{ pts: Q, col: 'body', alpha: 0.6 }], pad: 70 };
}
/** a right angle with sides at directions d and d + 90 */
export function rightAngle(d: number, names?: [string, string, string]): Fig {
  const V: Pt = [0, 0], A = at(V, d, 300), C = at(V, d + 90, 300);
  const segs: GSeg[] = [{ id: 'ba', a: V, b: A, kind: 'ray' }, { id: 'bc', a: V, b: C, kind: 'ray' }];
  const angles: GAngle[] = [{ id: 'r', v: V, p: A, q: C, box: true, col: 'second' }];
  const points: GPoint[] = names ? [{ at: V, name: names[1], dir: norm(d + 225) }, { at: at(V, d, 240), name: names[0], dir: norm(d - 90), dist: 40 }, { at: at(V, d + 90, 240), name: names[2], dir: norm(d + 180), dist: 40 }] : [];
  return { segs, angles, points, pad: 80 };
}
/** two lines meeting at an angle (no box unless marked) */
export function twoLines(d: number, a: number, o: { box?: boolean; text?: string; names?: [string, string] } = {}): Fig {
  const V: Pt = [0, 0], r = 260;
  const segs: GSeg[] = [{ id: 'l1', a: at(V, d + 180, r), b: at(V, d, r), kind: 'line', name: o.names?.[0] }, { id: 'l2', a: at(V, d + a + 180, r), b: at(V, d + a, r), kind: 'line', name: o.names?.[1] }];
  const angles: GAngle[] = o.box || o.text ? [{ id: 'x', v: V, p: at(V, d, 100), q: at(V, d + a, 100), box: o.box, text: o.text, col: o.box ? 'second' : 'plain' }] : [];
  return { segs, angles, points: [], pad: 90 };
}
/** a line ℓ through two points */
export const lineThrough = (A: Pt, B: Pt, ext = 80): GSeg => { const u = sub(B, A), L = Math.hypot(u[0], u[1]); const e: Pt = [u[0] / L * ext, u[1] / L * ext]; return { id: 'ln', a: sub(A, e), b: add(B, e), kind: 'line' }; };
export { meet };
