// turnMaths.ts: the exact maths of quarter and half turns on dot paper, pure (no DOM, no canvas).
//   Grid points are [x, y] with x to the right and y UP (dot paper), whole or half steps.
//   A turn is q quarter turns about a center c: q > 0 counterclockwise, q < 0 clockwise (q = ±2 a half turn).
//   rotQ / reflect / slide move points exactly; checkTurn asserts what a turn keeps (every point's distance from the
//   center, every side length, the clockwise order of the marked corners) so a wrong picture cannot be built.
//   Pointers: 8 page directions, 0 = up, counted clockwise (1 = up-right, 2 = right, ...).
//   Pictures (GridPic, SpinPic, TiltPic) are plain data an item hands to the page; picFits() says whether the
//   model can draw one readably (tests run it on every generated item).
import { check } from '../../../blocks/block';

export type V = readonly [number, number];
const EPS = 1e-9;
export const vadd = (a: V, b: V): V => [a[0] + b[0], a[1] + b[1]];
export const vsub = (a: V, b: V): V => [a[0] - b[0], a[1] - b[1]];
export const veq = (a: V, b: V): boolean => Math.abs(a[0] - b[0]) < EPS && Math.abs(a[1] - b[1]) < EPS;
export const d2 = (a: V, b: V): number => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
const fix = (x: number) => (Math.abs(x) < EPS ? 0 : x);

/** q quarter turns about c (q > 0 counterclockwise), exact */
export function rotQ(p: V, c: V, q: number): V {
  const r = (((Math.round(q) % 4) + 4) % 4);
  const x = p[0] - c[0], y = p[1] - c[1];
  const [a, b] = r === 0 ? [x, y] : r === 1 ? [-y, x] : r === 2 ? [-x, -y] : [y, -x];
  return [fix(c[0] + a), fix(c[1] + b)];
}
/** a turn by any angle (radians, + counterclockwise): for the animation between start and image */
export function rotA(p: V, c: V, ang: number): V {
  const x = p[0] - c[0], y = p[1] - c[1], cs = Math.cos(ang), sn = Math.sin(ang);
  return [c[0] + x * cs - y * sn, c[1] + x * sn + y * cs];
}

export type FlipLine = { kind: 'v'; x: number } | { kind: 'h'; y: number } | { kind: 'd'; p: V; s: 1 | -1 };
export function reflect(p: V, L: FlipLine): V {
  if (L.kind === 'v') return [2 * L.x - p[0], p[1]];
  if (L.kind === 'h') return [p[0], 2 * L.y - p[1]];
  // y - p.y = s (x - p.x): swap the offsets (s = 1) or swap and negate (s = -1)
  const x = p[0] - L.p[0], y = p[1] - L.p[1];
  return L.s === 1 ? [L.p[0] + y, L.p[1] + x] : [L.p[0] - y, L.p[1] - x];
}

export type Motion =
  | { kind: 'turn'; c: V; q: number }
  | { kind: 'slide'; d: V }
  | { kind: 'flip'; line: FlipLine }
  | { kind: 'none' };
export function apply(m: Motion, p: V): V {
  if (m.kind === 'turn') return rotQ(p, m.c, m.q);
  if (m.kind === 'slide') return vadd(p, m.d);
  if (m.kind === 'flip') return reflect(p, m.line);
  return p;
}
/** where p is when the motion is k (0..1) of the way through: turns sweep, slides glide, flips fold over the line */
export function motionAt(m: Motion, p: V, k: number): V {
  if (m.kind === 'turn') return k >= 1 ? rotQ(p, m.c, m.q) : rotA(p, m.c, (m.q * Math.PI / 2) * k);
  if (m.kind === 'slide') return [p[0] + m.d[0] * k, p[1] + m.d[1] * k];
  if (m.kind === 'flip') {
    if (k >= 1) return reflect(p, m.line);
    const r = reflect(p, m.line), f = (1 - Math.cos(Math.PI * k)) / 2;
    return [p[0] + (r[0] - p[0]) * f, p[1] + (r[1] - p[1]) * f];
  }
  return p;
}

/** +1 counterclockwise, -1 clockwise, 0 in a line (y up) */
export function orient(a: V, b: V, c: V): -1 | 0 | 1 {
  const x = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  return x > EPS ? 1 : x < -EPS ? -1 : 0;
}
export const roundWord = (o: number) => (o < 0 ? 'clockwise' : 'counterclockwise');

// ---------- figures ----------
export interface Mark { p: V; label: string }
export interface Fig { pts: V[]; marks: Mark[] }
export const movePts = (m: Motion, P: readonly V[]): V[] => P.map(p => apply(m, p));
export function moveFig(m: Motion, F: Fig, prime = false): Fig {
  return { pts: movePts(m, F.pts), marks: F.marks.map(k => ({ p: apply(m, k.p), label: prime ? k.label + '′' : k.label })) };
}
export const shiftFig = (F: Fig, d: V): Fig => moveFig({ kind: 'slide', d }, F);
/** the same outline (as a set of corners) */
export function sameSet(A: readonly V[], B: readonly V[]): boolean {
  return A.length === B.length && A.every(a => B.some(b => veq(a, b))) && B.every(b => A.some(a => veq(a, b)));
}
export const sideLens = (P: readonly V[]): number[] => P.map((p, i) => d2(p, P[(i + 1) % P.length]!));

/** asserts what a quarter or half turn keeps (throws BlockError with a readable message otherwise) */
export function checkTurn(start: Fig, image: Fig, c: V, q: number): void {
  const N = 'turn';
  check(start.pts.length === image.pts.length, N, 'the image has a different number of corners');
  start.pts.forEach((p, i) => {
    const r = image.pts[i]!;
    check(veq(r, rotQ(p, c, q)), N, `corner ${i} did not turn ${q} quarter turns`);
    check(Math.abs(d2(p, c) - d2(r, c)) < EPS, N, `corner ${i} changed its distance from the center`);
  });
  const a = sideLens(start.pts), b = sideLens(image.pts);
  check(a.every((x, i) => Math.abs(x - b[i]!) < EPS), N, 'a side changed length');
  if (start.marks.length >= 3) {
    const [A, B, C] = start.marks, [A2, B2, C2] = image.marks;
    check(orient(A!.p, B!.p, C!.p) === orient(A2!.p, B2!.p, C2!.p), N, 'a turn must keep the order of the marked corners');
  }
}

/** shapes in grid units, bottom-left corner at the origin, with three marked corners A -> B -> C clockwise */
export type ShapeName = 'L' | 'F' | 'tri' | 'flag' | 'H' | 'rect' | 'square' | 'Z';
export function shape(name: ShapeName, w = 2, h = 3): Fig {
  const mk = (pts: V[], a: number, b: number, c: number): Fig => {
    const marks = [{ p: pts[a]!, label: 'A' }, { p: pts[b]!, label: 'B' }, { p: pts[c]!, label: 'C' }];
    if (orient(marks[0]!.p, marks[1]!.p, marks[2]!.p) > 0) [marks[1], marks[2]] = [{ ...marks[2]!, label: 'B' }, { ...marks[1]!, label: 'C' }];
    return { pts, marks };
  };
  switch (name) {
    case 'L': return mk([[0, 0], [w, 0], [w, 1], [1, 1], [1, h], [0, h]], 0, 5, 1);
    case 'F': return mk([[0, 0], [1, 0], [1, 1], [2, 1], [2, 2], [1, 2], [1, 3], [3, 3], [3, 4], [0, 4]], 0, 9, 7);
    case 'tri': return mk([[0, 0], [w, 0], [0, h]], 0, 2, 1);
    case 'flag': return mk([[0, 0], [1, 0], [1, 2], [3, 3], [1, 4], [0, 4]], 0, 5, 3);
    case 'H': return { pts: [[0, 0], [1, 0], [1, 1], [2, 1], [2, 0], [3, 0], [3, 3], [2, 3], [2, 2], [1, 2], [1, 3], [0, 3]], marks: [] };
    case 'rect': return { pts: [[0, 0], [w, 0], [w, h], [0, h]], marks: [] };
    case 'square': return { pts: [[0, 0], [w, 0], [w, w], [0, w]], marks: [] };
    case 'Z': return { pts: [[0, 2], [2, 2], [2, 1], [3, 1], [3, 0], [1, 0], [1, 1], [0, 1]], marks: [] };
  }
}
export const SHAPE_WORDS: Record<ShapeName, string> = { L: 'L-tile', F: 'F-tile', tri: 'triangle', flag: 'flag', H: 'H-tile', rect: 'rectangle', square: 'square', Z: 'Z-tile' };
/** the middle of a figure's bounding box */
export function middle(P: readonly V[]): V {
  const xs = P.map(p => p[0]), ys = P.map(p => p[1]);
  return [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2];
}
/** is the point inside or on the outline? (ray casting + edges) */
export function onFigure(p: V, P: readonly V[]): boolean {
  let inside = false;
  for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
    const a = P[i]!, b = P[j]!;
    const cross = (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
    if (Math.abs(cross) < EPS && p[0] >= Math.min(a[0], b[0]) - EPS && p[0] <= Math.max(a[0], b[0]) + EPS && p[1] >= Math.min(a[1], b[1]) - EPS && p[1] <= Math.max(a[1], b[1]) + EPS) return true;
    if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < ((b[0] - a[0]) * (p[1] - a[1])) / (b[1] - a[1]) + a[0]) inside = !inside;
  }
  return inside;
}

// ---------- words ----------
export function turnWords(q: number, dir = true): string {
  const a = Math.abs(q);
  const amount = a === 1 ? 'a quarter turn' : a === 2 ? 'a half turn' : a === 4 ? 'a full turn' : a === 0 ? 'no turn' : `${a} quarter turns`;
  return dir && a !== 0 ? `${amount} ${q < 0 ? 'clockwise' : 'counterclockwise'}` : amount;
}
/** TeX for the board: "1/4 turn ↻" */
export function turnTex(q: number, dir = true): string {
  const a = Math.abs(q);
  const amt = a === 1 ? '\\tfrac{1}{4}\\ \\text{turn}' : a === 2 ? '\\tfrac{1}{2}\\ \\text{turn}' : a === 4 ? '\\text{full turn}' : '\\text{no turn}';
  return dir && a ? `${amt}\\ ${q < 0 ? '\\circlearrowright' : '\\circlearrowleft'}` : amt;
}
/** steps from the center as words: "3 right, 1 up" */
export function stepWords(d: V): string {
  const parts: string[] = [];
  if (d[0]) parts.push(`${Math.abs(d[0])} ${d[0] > 0 ? 'right' : 'left'}`);
  if (d[1]) parts.push(`${Math.abs(d[1])} ${d[1] > 0 ? 'up' : 'down'}`);
  return parts.join(', ') || 'on the pin';
}
export function stepTex(d: V): string {
  const parts: string[] = [];
  if (d[0]) parts.push(`${Math.abs(d[0])}\\ \\text{${d[0] > 0 ? 'right' : 'left'}}`);
  if (d[1]) parts.push(`${Math.abs(d[1])}\\ \\text{${d[1] > 0 ? 'up' : 'down'}}`);
  return parts.join(',\\ ') || '0';
}

// ---------- pointers ----------
export const DIR_WORDS = ['up', 'up-right', 'right', 'down-right', 'down', 'down-left', 'left', 'up-left'] as const;
export const DIR_ARROWS = ['↑', '↗', '→', '↘', '↓', '↙', '←', '↖'] as const;
export const dirVec = (d: number): V => ([[0, 1], [1, 1], [1, 0], [1, -1], [0, -1], [-1, -1], [-1, 0], [-1, 1]] as const)[((d % 8) + 8) % 8]!;
/** a page direction after q quarter turns (q > 0 counterclockwise) */
export const turnDir = (d: number, q: number): number => (((d - 2 * q) % 8) + 8) % 8;
export const dirLabel = (d: number) => `${DIR_ARROWS[d]} ${DIR_WORDS[d]}`;

// ---------- pictures ----------
export interface Win { x0: number; y0: number; x1: number; y1: number }
export interface GridPic {
  kind: 'grid';
  win: Win;
  /** the center of the turn (a pin) and its letter; pinHidden: the sheet turns about it but it is not drawn */
  pin?: V; pinLabel?: string; pinHidden?: boolean;
  /** a clear sheet, pinned at the pin, carries the start figure (tracing paper) */
  sheet?: boolean;
  /** the figure before the move (amber) */
  start?: Fig;
  /** a given "after" picture to judge (lavender) */
  after?: Fig;
  /** a dashed target outline */
  target?: V[];
  /** curved turn arrows about the pin (q quarter turns, + counterclockwise) */
  arrows?: { q: number; r: number }[];
  /** mirror lines with letters */
  lines?: { line: FlipLine; label?: string }[];
  /** labeled points that are not candidates (a center C, candidate pins P Q R) */
  points?: Mark[];
  /** the tracked point (amber dot with its letter) */
  point?: Mark;
  /** candidate dots for "where does it land?" (rings with letters) */
  dots?: Mark[];
  /** strings from the pin to these points */
  segs?: V[];
  /** a step path from `from` (default the pin): horizontal steps, then vertical; 'solve' = only in the worked solution */
  steps?: { from?: V; d: V; when?: 'now' | 'solve' };
  /** the worked solution traces A -> B -> C round arrows in both pictures */
  orderArrows?: boolean;
  /** candidate pictures on the board (each on the same window, with the pin and a faint start) */
  cands?: { label: string; fig: Fig }[];
  /** the move played live on a loop (watch it) */
  watch?: Motion;
  /** the worked solution: this move carries the start figure (or the point) to the answer */
  solve?: { motion: Motion; to?: Fig; point?: V; also?: { motion: Motion; to: Fig } };
}
export interface Spinner {
  /** start direction: degrees clockwise from up */ deg: number;
  /** the turn the arrow shows, degrees, + counterclockwise (0 = none) */ turn?: number;
  /** arm length 0.4..1 of the disc */ arm?: number;
  /** the guide: lines at these degrees (clockwise from up); null = no guide */ cuts?: number[] | null;
  label?: string;
  look?: 'spinner' | 'clock';
  /** play the turn live, on a loop */ watch?: boolean;
}
export interface SpinPic { kind: 'spin'; spinners: Spinner[]; clock?: boolean; solve?: { i: number; turn: number } }
export interface TiltPic { kind: 'tilt'; shape: 'square' | 'rect'; deg: number }
export type TurnPic = GridPic | SpinPic | TiltPic;

export const winOf = (pts: readonly V[], pad = 1): Win => {
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  return { x0: Math.floor(Math.min(...xs)) - pad, y0: Math.floor(Math.min(...ys)) - pad, x1: Math.ceil(Math.max(...xs)) + pad, y1: Math.ceil(Math.max(...ys)) + pad };
};
/** every point a grid picture draws */
export function picPoints(p: GridPic): V[] {
  const P: V[] = [];
  if (p.pin) P.push(p.pin);
  for (const f of [p.start, p.after, ...(p.cands ?? []).map(c => c.fig), p.solve?.to, p.solve?.also?.to]) if (f) P.push(...f.pts, ...f.marks.map(m => m.p));
  if (p.target) P.push(...p.target);
  for (const m of [...(p.points ?? []), ...(p.dots ?? []), ...(p.point ? [p.point] : [])]) P.push(m.p);
  if (p.solve?.point) P.push(p.solve.point);
  if (p.steps) P.push(vadd(p.steps.from ?? p.pin ?? [0, 0], p.steps.d));
  // a watched turn sweeps arcs: the window must hold the whole path, not just its ends
  if (p.watch && p.start) for (const k of [0.25, 0.5, 0.75]) for (const q of [...p.start.pts, ...(p.points ?? []).map(m => m.p)]) P.push(motionAt(p.watch, q, k));
  return P;
}
export const MAX_WIN = 13;
/** null when the model can draw the picture readably, else why not */
export function picFits(p: TurnPic): string | null {
  if (p.kind === 'spin') return p.spinners.length >= 1 && p.spinners.length <= 2 ? null : 'one or two spinners';
  if (p.kind === 'tilt') return null;
  const w = p.win.x1 - p.win.x0, h = p.win.y1 - p.win.y0;
  if (w > MAX_WIN || h > MAX_WIN) return `window ${w} x ${h} is wider than ${MAX_WIN} steps`;
  for (const q of picPoints(p)) if (q[0] < p.win.x0 + 0.5 || q[0] > p.win.x1 - 0.5 || q[1] < p.win.y0 + 0.5 || q[1] > p.win.y1 - 0.5) return `point ${q} is at the edge of the window`;
  if ((p.cands?.length ?? 0) > 4) return 'at most 4 candidate pictures';
  const ds = p.dots ?? [];
  for (let i = 0; i < ds.length; i++) for (let j = i + 1; j < ds.length; j++) if (d2(ds[i]!.p, ds[j]!.p) < 0.99) return 'two candidate dots too close';
  return null;
}
/** a window that holds the points, at least `min` steps each way, square-ish */
export function fitWin(pts: readonly V[], min = 7): Win {
  const w = winOf(pts, 1);
  const grow = (a: number, b: number): [number, number] => { const n = b - a; if (n >= min) return [a, b]; const e = min - n; return [a - Math.floor(e / 2), b + Math.ceil(e / 2)]; };
  const [x0, x1] = grow(w.x0, w.x1), [y0, y1] = grow(w.y0, w.y1);
  return { x0, y0, x1, y1 };
}
