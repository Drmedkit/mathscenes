// walkMaths.ts: the pure maths of "enlarge on grids" (no DOM, no canvas).
//   walks      a figure as a walk from a marked start vertex: right / left / up / down moves, and slanted sides as a
//              run (across) plus a rise (up or down); scale every move by k; walk the copy; the walk closes
//   factors    the horizontal and the vertical factor of a same-orientation copy (equal = scaled, else stretched)
//   walkPic    a ScaleGrid picture (scale-factor/scaleMaths.ts, imported read-only) of an original, its start dot,
//              the copy as one open leg per move (so it can be walked leg by leg), the closed copy (its wash and
//              side labels), and dashed run / rise legs for every slanted side
// Grid units, y UP. Shapes are counter-clockwise from vertex 0 (the start vertex).
import { type Q, rat } from '../../../core/math';
import { type FigRole, type Lab, type Pic, type PicFig, type V, extent, home, move, scaledCopy } from '../scale-factor/scaleMaths';

export interface Move { dx: number; dy: number }

/** the walk around P from vertex `start` (one move per side, back to the start) */
export function walkOf(P: readonly V[], start = 0): Move[] {
  const n = P.length;
  return Array.from({ length: n }, (_, i) => {
    const a = P[(start + i) % n]!, b = P[(start + i + 1) % n]!;
    return { dx: clean(b[0] - a[0]), dy: clean(b[1] - a[1]) };
  });
}
/** the points a walk visits from `from` (n + 1 points; the last is the start again when the walk closes) */
export function runWalk(from: V, M: readonly Move[]): V[] {
  const out: V[] = [[from[0], from[1]]];
  for (const m of M) { const p = out[out.length - 1]!; out.push([clean(p[0] + m.dx), clean(p[1] + m.dy)]); }
  return out;
}
export const closes = (M: readonly Move[]): boolean => Math.abs(M.reduce((s, m) => s + m.dx, 0)) < 1e-9 && Math.abs(M.reduce((s, m) => s + m.dy, 0)) < 1e-9;
export const scaleMoves = (M: readonly Move[], k: number): Move[] => M.map(m => ({ dx: clean(m.dx * k), dy: clean(m.dy * k) }));
export const slanted = (m: Move): boolean => m.dx !== 0 && m.dy !== 0;
/** the length of a straight move (a slanted move has none here: no diagonal lengths in this topic) */
export const straightLen = (m: Move): number => (slanted(m) ? NaN : Math.abs(m.dx) + Math.abs(m.dy));
const clean = (x: number) => (Math.abs(x - Math.round(x)) < 1e-9 ? Math.round(x) : x);

export const hWord = (dx: number) => (dx >= 0 ? 'right' : 'left');
export const vWord = (dy: number) => (dy >= 0 ? 'up' : 'down');
/** "right 2", "left 1, up 3" */
export function moveWords(m: Move): string {
  if (!slanted(m)) return m.dx ? `${hWord(m.dx)} ${Math.abs(m.dx)}` : `${vWord(m.dy)} ${Math.abs(m.dy)}`;
  return `${hWord(m.dx)} ${Math.abs(m.dx)}, ${vWord(m.dy)} ${Math.abs(m.dy)}`;
}
const AR = { right: '\\rightarrow', left: '\\leftarrow', up: '\\uparrow', down: '\\downarrow' } as const;
/** TeX of a move with arrows: \rightarrow 2, \leftarrow 1\;\uparrow 3 */
export function moveTex(m: Move): string {
  const h = `${AR[hWord(m.dx)]} ${Math.abs(m.dx)}`, v = `${AR[vWord(m.dy)]} ${Math.abs(m.dy)}`;
  return !slanted(m) ? (m.dx ? h : v) : `${h}\\, ${v}`;
}
/** HTML arrows for the panel: → 2, ← 1 ↑ 3 */
export function moveHtml(m: Move): string {
  const A = { right: '→', left: '←', up: '↑', down: '↓' } as const;
  const h = `${A[hWord(m.dx)]}&#8202;${Math.abs(m.dx)}`, v = `${A[vWord(m.dy)]}&#8202;${Math.abs(m.dy)}`;
  return !slanted(m) ? (m.dx ? h : v) : `${h} ${v}`;
}

/** the factors of a same-orientation copy: across (widths) and up (heights), exact */
export function factors(A: readonly V[], B: readonly V[]): { kx: Q; ky: Q; same: boolean } {
  const a = extent(A), b = extent(B);
  const kx = rat(Math.round(b.w * 1000), Math.round(a.w * 1000)), ky = rat(Math.round(b.h * 1000), Math.round(a.h * 1000));
  return { kx, ky, same: kx.p === ky.p && kx.q === ky.q };
}
/** is B (same orientation, same start) a scaled copy of A: every move of B is k x the matching move of A */
export function isWalkCopy(A: readonly V[], B: readonly V[], k: number): boolean {
  if (A.length !== B.length) return false;
  const a = walkOf(A), b = walkOf(B);
  return a.every((m, i) => Math.abs(b[i]!.dx - k * m.dx) < 1e-9 && Math.abs(b[i]!.dy - k * m.dy) < 1e-9) && scaledCopy(A, B).ok;
}

// ---------- shapes (counter-clockwise from the bottom-left start vertex) ----------
/** a house: body w wide and h tall, the roof's top at (a, h + r) */
export const house = (w: number, h: number, a: number, r: number): V[] => [[0, 0], [w, 0], [w, h], [a, h + r], [0, h]];
/** a triangle: base b, top at (a, t) */
export const tri = (b: number, a: number, t: number): V[] => [[0, 0], [b, 0], [a, t]];
/** a staircase of three steps: widths a, b, c (bottom to top step), rises d, e, f */
export const stairs = (a: number, b: number, c: number, d: number, e: number, f: number): V[] =>
  [[0, 0], [a + b + c, 0], [a + b + c, d], [a + b, d], [a + b, d + e], [a, d + e], [a, d + e + f], [0, d + e + f]];

// ---------- the picture ----------
export interface WalkSpec {
  /** the original (homed to (0,0) here); vertex 0 is the marked start */
  shape: readonly V[];
  k: number;
  /** where the original and the copy sit on the paper (their bottom-left corner) */
  at0: V; at1: V;
  cols: number; rows: number; umax?: number;
  labels0?: (Lab | null)[]; labels1?: (Lab | null)[];
  /** angle marks on the original / the copy */
  angles0?: PicFig['angles']; angles1?: PicFig['angles'];
  /** which sides get dashed run / rise legs (default: every slanted side), on the original and on the copy */
  rr0?: boolean[]; rr1?: boolean[];
  /** run / rise numbers beside the legs (default true) */
  rrNums?: boolean;
  /** an extra open leg over side j of the original (the side in focus), role pick */
  focus0?: number;
  /** extra figures (painted after the copy) and marks / hops / dots appended */
  extra?: PicFig[];
  marks?: Pic['marks']; hops?: Pic['hops']; dots?: Pic['dots'];
  copyRole?: FigRole;
  copyOf?: boolean;
}
export interface WalkPic {
  pic: Pic;
  k: number;
  P0: V[]; P1: V[];
  moves0: Move[]; moves1: Move[];
  /** figure indices: 0 the original, 1 the closed copy, legs[j] the copy's leg j, extra[i], focus (or -1) */
  legs: number[]; extra: number[]; focus: number;
  /** pic.moves index of the run / rise legs of side j (null = none) */
  rr0: (number | null)[]; rr1: (number | null)[];
  /** pic.dots: 0 the original's start, 1 the copy's start, then the spec's dots */
}

function insidePoly(P: readonly V[], x: number, y: number): boolean {
  let c = false;
  for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
    const [xi, yi] = P[i]!, [xj, yj] = P[j]!;
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}
/** the run / rise legs of a slanted side go round the OUTSIDE of the figure */
function rrMove(P: readonly V[], from: V, m: Move, role: FigRole, nums: boolean): NonNullable<Pic['moves']>[number] {
  const across: V = [from[0] + m.dx, from[1]], upFirst: V = [from[0], from[1] + m.dy];
  const mid = (a: V, b: V): V => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const out = (c: V) => !insidePoly(P, ...mid(from, c)) && !insidePoly(P, ...mid(c, [from[0] + m.dx, from[1] + m.dy]));
  const vFirst = !out(across) && out(upFirst);
  return { from: [from[0], from[1]], dx: m.dx, dy: m.dy, role, nums, vFirst };
}

export function walkPic(s: WalkSpec): WalkPic {
  const S0 = home(s.shape);
  const P0 = move(S0, s.at0[0], s.at0[1]);
  const moves0 = walkOf(P0), moves1 = scaleMoves(moves0, s.k);
  const P1 = runWalk(s.at1, moves1).slice(0, -1);
  const role1 = s.copyRole ?? 'second';
  const figs: PicFig[] = [
    { pts: P0, role: 'first', labels: s.labels0, angles: s.angles0 },
    { pts: P1, role: role1, labels: s.labels1, angles: s.angles1, of: s.copyOf === false ? undefined : { fig: 0, k: s.k } },
  ];
  const legs = moves1.map((_, j) => {
    figs.push({ pts: [P1[j]!, P1[(j + 1) % P1.length]!], role: role1, open: true, style: 'line' });
    return figs.length - 1;
  });
  const extra = (s.extra ?? []).map(f => { figs.push(f); return figs.length - 1; });
  let focus = -1;
  if (s.focus0 !== undefined) {
    const j = s.focus0;
    figs.push({ pts: [P0[j]!, P0[(j + 1) % P0.length]!], role: 'pick', open: true, style: 'line' });
    focus = figs.length - 1;
  }
  const moves: NonNullable<Pic['moves']> = [];
  const nums = s.rrNums !== false;
  const rr0 = moves0.map((m, j) => {
    if (!(s.rr0?.[j] ?? slanted(m)) || !slanted(m)) return null;
    moves.push(rrMove(P0, P0[j]!, m, 'first', nums)); return moves.length - 1;
  });
  const rr1 = moves1.map((m, j) => {
    if (!(s.rr1?.[j] ?? slanted(m)) || !slanted(m)) return null;
    moves.push(rrMove(P1, P1[j]!, m, role1, nums)); return moves.length - 1;
  });
  const pic: Pic = {
    cols: s.cols, rows: s.rows, grid: true, umax: s.umax ?? 90, figs,
    moves: moves.length ? moves : undefined,
    dots: [{ at: P0[0]!, role: 'pick' }, { at: P1[0]!, role: 'pick' }, ...(s.dots ?? [])],
    marks: s.marks, hops: s.hops,
    // the copy's legs paint over the washes, the extras (a wrong copy, pieces laid along a side) over the legs
    order: [0, 1, ...legs, ...extra, ...(focus >= 0 ? [focus] : [])],
  };
  return { pic, k: s.k, P0, P1, moves0, moves1, legs, extra, focus, rr0, rr1 };
}

/** a row of shapes, bottom-aligned, gap units apart, margins mx / my (and extra rows on top) */
export function rowOf(shapes: readonly (readonly V[])[], gap: number, mx: number, my: number, top = 0): { at: V[]; placed: V[][]; cols: number; rows: number } {
  let x = mx; const placed: V[][] = [], at: V[] = []; let hmax = 0;
  for (const s of shapes) { const h0 = home(s), e = extent(h0); at.push([x, my]); placed.push(move(h0, x, my)); x += e.w + gap; hmax = Math.max(hmax, e.h); }
  return { at, placed, cols: x - gap + mx, rows: hmax + 2 * my + top };
}
