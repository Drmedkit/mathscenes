// congMaths.ts: the exact maths of congruence by rigid motions, pure (no DOM, no canvas).
//   Points are [x, y] on a coordinate plane (y UP), whole or half units. A Move is one transformation: a slide, a
//   quarter / half turn about a center (q > 0 counterclockwise), a flip over a line, a dilation (center, k) or a
//   stretch (kx x, ky y) about the origin. Sequences run left to right: the output of a step is the input of the next.
//   checkCongruence asserts that a sequence is rigid and carries EVERY vertex of A onto its partner in B, so a wrong
//   worked example cannot be built. CongPic is the plain picture data an item hands to the page; picFits says whether
//   the model can draw it readably (the tests run it on every generated item).
import { check } from '../../../blocks/block';
import { type FlipLine, type V, type Win, d2, reflect, rotA, rotQ, sameSet, veq } from '../rotations/turnMaths';

export type { V, Win, FlipLine };
export { d2, veq, sameSet, reflect, rotQ };

export type Move =
  | { kind: 'slide'; d: V }
  | { kind: 'turn'; c: V; q: number }
  | { kind: 'flip'; line: FlipLine }
  | { kind: 'dil'; c: V; k: number }
  | { kind: 'stretch'; kx: number; ky: number };

const EPS = 1e-9;
const fix = (x: number) => (Math.abs(x) < EPS ? 0 : Math.round(x * 1e9) / 1e9);
export const O: V = [0, 0];
export const slide = (dx: number, dy: number): Move => ({ kind: 'slide', d: [dx, dy] });
export const turn = (q: number, c: V = O): Move => ({ kind: 'turn', c, q });
export const flipY: Move = { kind: 'flip', line: { kind: 'v', x: 0 } };   // over the y-axis
export const flipX: Move = { kind: 'flip', line: { kind: 'h', y: 0 } };   // over the x-axis
export const flipV = (x: number): Move => ({ kind: 'flip', line: { kind: 'v', x } });
export const flipH = (y: number): Move => ({ kind: 'flip', line: { kind: 'h', y } });
export const dil = (k: number, c: V = O): Move => ({ kind: 'dil', c, k });

/** the image of p, exact for whole and half units */
export function mv(m: Move, p: V): V {
  switch (m.kind) {
    case 'slide': return [fix(p[0] + m.d[0]), fix(p[1] + m.d[1])];
    case 'turn': return rotQ(p, m.c, m.q);
    case 'flip': { const r = reflect(p, m.line); return [fix(r[0]), fix(r[1])]; }
    case 'dil': return [fix(m.c[0] + m.k * (p[0] - m.c[0])), fix(m.c[1] + m.k * (p[1] - m.c[1]))];
    case 'stretch': return [fix(m.kx * p[0]), fix(m.ky * p[1])];
  }
}
/** where p is when the move is t (0..1) of the way through: slides glide, turns sweep, flips fold over the line */
export function mvAt(m: Move, p: V, t: number): V {
  if (t >= 1) return mv(m, p);
  if (t <= 0) return p;
  switch (m.kind) {
    case 'slide': return [p[0] + m.d[0] * t, p[1] + m.d[1] * t];
    case 'turn': return rotA(p, m.c, (m.q * Math.PI / 2) * t);
    case 'flip': { const r = mv(m, p), f = (1 - Math.cos(Math.PI * t)) / 2; return [p[0] + (r[0] - p[0]) * f, p[1] + (r[1] - p[1]) * f]; }
    case 'dil': { const k = 1 + (m.k - 1) * t; return [m.c[0] + k * (p[0] - m.c[0]), m.c[1] + k * (p[1] - m.c[1])]; }
    case 'stretch': return [p[0] * (1 + (m.kx - 1) * t), p[1] * (1 + (m.ky - 1) * t)];
  }
}
export const runSeq = (ms: readonly Move[], p: V): V => ms.reduce<V>((q, m) => mv(m, q), p);
/** a sequence part-way: s in [0, n] (step i runs while i < s < i + 1) */
export function seqAt(ms: readonly Move[], p: V, s: number): V {
  let q = p;
  for (let i = 0; i < ms.length; i++) { const t = s - i; if (t <= 0) break; q = mvAt(ms[i]!, q, Math.min(1, t)); }
  return q;
}
export const mapPts = (ms: readonly Move[], P: readonly V[]): V[] => P.map(p => runSeq(ms, p));
export const isRigid = (m: Move): boolean => m.kind === 'slide' || m.kind === 'turn' || m.kind === 'flip' || (m.kind === 'dil' && m.k === 1) || (m.kind === 'stretch' && Math.abs(m.kx) === 1 && Math.abs(m.ky) === 1);
export const reverses = (m: Move): boolean => m.kind === 'flip' || (m.kind === 'stretch' && m.kx * m.ky < 0);
/** the move that undoes m */
export function inverse(m: Move): Move {
  switch (m.kind) {
    case 'slide': return { kind: 'slide', d: [-m.d[0] || 0, -m.d[1] || 0] };
    case 'turn': return { kind: 'turn', c: m.c, q: -m.q };
    case 'flip': return m;
    case 'dil': return { kind: 'dil', c: m.c, k: 1 / m.k };
    case 'stretch': return { kind: 'stretch', kx: 1 / m.kx, ky: 1 / m.ky };
  }
}
export const inverseSeq = (ms: readonly Move[]): Move[] => ms.slice().reverse().map(inverse);

// ---------- figures ----------
export interface Fig { pts: V[]; labels: string[] }
export const fig = (pts: V[], labels = 'ABCDEFG'.slice(0, pts.length).split('')): Fig => ({ pts, labels });
export const moveFig = (ms: readonly Move[], F: Fig, labels?: string[]): Fig => ({ pts: mapPts(ms, F.pts), labels: labels ?? F.labels.map(l => l + '′') });
/** +1 counterclockwise, -1 clockwise (shoelace, y up) */
export function orient(P: readonly V[]): 1 | -1 {
  let s = 0;
  for (let i = 0; i < P.length; i++) { const a = P[i]!, b = P[(i + 1) % P.length]!; s += a[0] * b[1] - b[0] * a[1]; }
  check(Math.abs(s) > EPS, 'congruence', 'a figure needs an area');
  return s > 0 ? 1 : -1;
}
export const roundWord = (o: number) => (o > 0 ? 'counterclockwise' : 'clockwise');
/** squared side lengths, side i = P[i] -> P[i + 1] */
export const lens2 = (P: readonly V[]): number[] => P.map((p, i) => d2(p, P[(i + 1) % P.length]!));
export const sideLen = (a: V, b: V): number => Math.sqrt(d2(a, b));
/** the same collection of side lengths (as a multiset) */
export function sameLens(P: readonly V[], Q: readonly V[]): boolean {
  const a = lens2(P).sort((x, y) => x - y), b = lens2(Q).sort((x, y) => x - y);
  return a.length === b.length && a.every((x, i) => Math.abs(x - b[i]!) < EPS);
}
export function area2(P: readonly V[]): number {
  let s = 0;
  for (let i = 0; i < P.length; i++) { const a = P[i]!, b = P[(i + 1) % P.length]!; s += a[0] * b[1] - b[0] * a[1]; }
  return Math.abs(s);
}
/** vertex i of P lands on vertex i of Q for every i */
export const sameMap = (P: readonly V[], Q: readonly V[]): boolean => P.length === Q.length && P.every((p, i) => veq(p, Q[i]!));
export const mapsOnto = (ms: readonly Move[], A: readonly V[], B: readonly V[]): boolean => sameMap(mapPts(ms, A), B);
/** congruent figures as point sets: some correspondence keeps every pairwise distance */
export function congruentSets(P: readonly V[], Q: readonly V[]): boolean {
  if (P.length !== Q.length) return false;
  const n = P.length;
  // try every cyclic shift, both ways round (polygon vertex order)
  for (const dir of [1, -1]) for (let s = 0; s < n; s++) {
    const R = P.map((_, i) => Q[((s + dir * i) % n + n) % n]!);
    let ok = true;
    for (let i = 0; i < n && ok; i++) for (let j = i + 1; j < n && ok; j++) if (Math.abs(d2(P[i]!, P[j]!) - d2(R[i]!, R[j]!)) > EPS) ok = false;
    if (ok) return true;
  }
  return false;
}
/** asserts a congruence: every step rigid, every vertex of A onto its partner in B, every distance kept */
export function checkCongruence(A: readonly V[], B: readonly V[], ms: readonly Move[]): void {
  const N = 'congruence';
  check(A.length === B.length, N, 'the figures have different numbers of corners');
  check(ms.every(isRigid), N, 'a congruence needs rigid motions only');
  const P = mapPts(ms, A);
  P.forEach((p, i) => check(veq(p, B[i]!), N, `corner ${i} does not land on its partner`));
  for (let i = 0; i < A.length; i++) for (let j = i + 1; j < A.length; j++) check(Math.abs(d2(A[i]!, A[j]!) - d2(B[i]!, B[j]!)) < EPS, N, 'a distance changed');
}
/** does some non-identity symmetry of the square grid (about the middle) map P onto itself? */
export function symmetric(P: readonly V[]): boolean {
  const xs = P.map(p => p[0]), ys = P.map(p => p[1]);
  const c: V = [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2];
  const ops: ((p: V) => V)[] = [
    p => rotQ(p, c, 1), p => rotQ(p, c, 2), p => rotQ(p, c, 3),
    p => reflect(p, { kind: 'v', x: c[0] }), p => reflect(p, { kind: 'h', y: c[1] }),
    p => reflect(p, { kind: 'd', p: c, s: 1 }), p => reflect(p, { kind: 'd', p: c, s: -1 }),
  ];
  return ops.some(f => sameSet(P.map(f), P));
}

// ---------- words and TeX ----------
export const n2 = (x: number) => (x < 0 ? `−${-x}` : String(x));
export const texN = (x: number) => (x < 0 ? `{-${-x}}` : String(x));
export const ptWords = (p: V) => `(${n2(p[0])}, ${n2(p[1])})`;
export const ptTex = (p: V) => `(${texN(p[0])},\\ ${texN(p[1])})`;
export function lineWords(L: FlipLine): string {
  if (L.kind === 'v') return L.x === 0 ? 'the y-axis' : `the line x = ${n2(L.x)}`;
  if (L.kind === 'h') return L.y === 0 ? 'the x-axis' : `the line y = ${n2(L.y)}`;
  return L.s === 1 && L.p[0] === L.p[1] ? 'the line y = x' : L.s === -1 && L.p[0] === -L.p[1] ? 'the line y = −x' : 'a slanted line';
}
export function lineTex(L: FlipLine): string {
  if (L.kind === 'v') return L.x === 0 ? 'y\\text{-axis}' : `x = ${texN(L.x)}`;
  if (L.kind === 'h') return L.y === 0 ? 'x\\text{-axis}' : `y = ${texN(L.y)}`;
  return L.s === 1 ? 'y = x' : 'y = -x';
}
export function stepWords(d: V): string {
  const parts: string[] = [];
  if (d[0]) parts.push(`${Math.abs(d[0])} ${d[0] > 0 ? 'right' : 'left'}`);
  if (d[1]) parts.push(`${Math.abs(d[1])} ${d[1] > 0 ? 'up' : 'down'}`);
  return parts.join(', ') || 'nowhere';
}
const centerWords = (c: V) => (veq(c, O) ? 'the origin' : `the point ${ptWords(c)}`);
const kWords = (k: number) => (k === 0.5 ? '1/2' : k === 1 / 3 ? '1/3' : String(k));
export const kTex = (k: number) => (k === 0.5 ? '\\tfrac{1}{2}' : k === 1 / 3 ? '\\tfrac{1}{3}' : String(k));
export function turnWords(q: number): string {
  const a = Math.abs(q) === 2 ? '180°' : Math.abs(q) === 1 ? '90°' : `${Math.abs(q) * 90}°`;
  return Math.abs(q) === 2 ? a : `${a} ${q > 0 ? 'counterclockwise' : 'clockwise'}`;
}
/** a move in words: "flip over the y-axis", "turn 90° counterclockwise about the origin", "slide 3 right, 2 down" */
export function moveWords(m: Move): string {
  switch (m.kind) {
    case 'slide': return `slide ${stepWords(m.d)}`;
    case 'turn': return `turn ${turnWords(m.q)} about ${centerWords(m.c)}`;
    case 'flip': return `flip over ${lineWords(m.line)}`;
    case 'dil': return `dilate by ${kWords(m.k)} about ${centerWords(m.c)}`;
    case 'stretch': return `stretch by ${m.kx} across and ${m.ky} up`;
  }
}
export const seqWords = (ms: readonly Move[]) => ms.map(moveWords).join(', then ');
/** the move in TeX words for the board */
export function moveTex(m: Move): string {
  switch (m.kind) {
    case 'slide': {
      const p: string[] = [];
      if (m.d[0]) p.push(`${Math.abs(m.d[0])}\\ \\text{${m.d[0] > 0 ? 'right' : 'left'}}`);
      if (m.d[1]) p.push(`${Math.abs(m.d[1])}\\ \\text{${m.d[1] > 0 ? 'up' : 'down'}}`);
      return `\\text{slide}\\ ${p.join(',\\ ')}`;
    }
    case 'turn': return `\\text{turn}\\ ${Math.abs(m.q) * 90}^\\circ${Math.abs(m.q) === 2 ? '' : m.q > 0 ? '\\ \\circlearrowleft' : '\\ \\circlearrowright'}\\ \\text{about}\\ ${veq(m.c, O) ? 'O' : ptTex(m.c)}`;
    case 'flip': return `\\text{flip over}\\ ${lineTex(m.line)}`;
    case 'dil': return `\\text{dilate by}\\ ${kTex(m.k)}\\ \\text{about}\\ ${veq(m.c, O) ? 'O' : ptTex(m.c)}`;
    case 'stretch': return `(${m.kx === 1 ? '' : m.kx}x,\\ ${m.ky === 1 ? '' : m.ky}y)`;
  }
}
const sgn = (v: string, d: number) => (d === 0 ? v : d > 0 ? `${v} + ${d}` : `${v} - ${-d}`);
/** the coordinate rule of a move about the origin / an axis (null if it has no short rule here) */
export function ruleOf(m: Move): [string, string] | null {
  switch (m.kind) {
    case 'slide': return [sgn('x', m.d[0]), sgn('y', m.d[1])];
    case 'turn': if (!veq(m.c, O)) return null; { const r = ((m.q % 4) + 4) % 4; return r === 1 ? ['-y', 'x'] : r === 2 ? ['-x', '-y'] : r === 3 ? ['y', '-x'] : ['x', 'y']; }
    case 'flip': return m.line.kind === 'v' && m.line.x === 0 ? ['-x', 'y'] : m.line.kind === 'h' && m.line.y === 0 ? ['x', '-y'] : m.line.kind === 'd' && veq(m.line.p, O) ? (m.line.s === 1 ? ['y', 'x'] : ['-y', '-x']) : null;
    case 'dil': return veq(m.c, O) ? [`${kTex(m.k)}x`, `${kTex(m.k)}y`] : null;
    case 'stretch': return [`${m.kx === 1 ? '' : m.kx}x`, `${m.ky === 1 ? '' : m.ky}y`];
  }
}
export const ruleTex = (r: readonly [string, string]) => `(x,\\ y) \\to (${r[0]},\\ ${r[1]})`;
export const ruleWordsOf = (r: readonly [string, string]) => `(x, y) → (${r[0].replace(/-/g, '−').replace(/\\tfrac\{1\}\{2\}/g, '½')}, ${r[1].replace(/-/g, '−').replace(/\\tfrac\{1\}\{2\}/g, '½')})`;

// ---------- pictures ----------
export type Role = 'first' | 'pick' | 'link' | 'ghost' | 'wrong';
export interface PFig {
  pts: V[];
  /** a letter per vertex ('' = none) */
  labels?: string[];
  role: Role;
  /** a big name in the middle of the figure ("P", "1") */
  tag?: string;
  /** side length labels: one per side (null = none) */
  lens?: (string | null)[];
}
export interface CongPic {
  kind: 'plane';
  win: Win;
  /** x- and y-axes with numbers in the margin (else a plain grid) */
  axes: boolean;
  figs: PFig[];
  /** mirror lines (teal, dashed) with an optional name */
  lines?: { line: FlipLine; label?: string }[];
  /** centers of turns */
  pins?: { p: V; label?: string }[];
  /** right-angle marks: figure index and vertex index */
  rights?: { fig: number; at: number }[];
  /** angle measures written at a vertex */
  angles?: { fig: number; at: number; text: string }[];
  /** order arrows A -> B -> C inside these figures */
  orderArrows?: number[];
  /** candidate pictures on the board, each on the same window */
  cands?: { label: string; fig: PFig }[];
  /** the worked solution: a tracing of figure `fig` carried through `seq` (onto figure `to`, if given) */
  solve?: { fig: number; seq: Move[]; to?: number; also?: Move[]; miss?: boolean };
  /** extra board lines (TeX) under item.board */
  more?: string[];
}
export const winOf = (pts: readonly V[], pad = 1): Win => {
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  return { x0: Math.floor(Math.min(...xs)) - pad, y0: Math.floor(Math.min(...ys)) - pad, x1: Math.ceil(Math.max(...xs)) + pad, y1: Math.ceil(Math.max(...ys)) + pad };
};
/** every point a picture draws (the solution's in-between images included) */
export function picPoints(p: CongPic): V[] {
  const P: V[] = [];
  for (const f of p.figs) P.push(...f.pts);
  for (const c of p.cands ?? []) P.push(...c.fig.pts);
  for (const q of p.pins ?? []) P.push(q.p);
  if (p.axes) P.push(O);
  for (const seq of [p.solve?.seq, p.solve?.also]) if (p.solve && seq) {
    const F = p.figs[p.solve.fig]!;
    for (let s = 1; s <= seq.length; s++) for (const q of F.pts) {
      P.push(seqAt(seq, q, s));
      // a turn sweeps an arc: the window must hold the middle of the path too
      if (seq[s - 1]!.kind === 'turn') P.push(seqAt(seq, q, s - 0.5));
      if (seq[s - 1]!.kind === 'turn') P.push((seq[s - 1] as { c: V }).c);
    }
  }
  return P;
}
export const MAX_WIN = 16;
/** a window that holds the picture: with axes it is centred so the origin sits on a grid line inside */
export function fitWin(p: CongPic, min = 8): Win {
  const w = winOf(picPoints(p), 1);
  const grow = (a: number, b: number): [number, number] => { const n = b - a; if (n >= min) return [a, b]; const e = min - n; return [a - Math.floor(e / 2), b + Math.ceil(e / 2)]; };
  let [x0, x1] = grow(w.x0, w.x1), [y0, y1] = grow(w.y0, w.y1);
  if (p.axes) { x0 = Math.min(x0, -1); y0 = Math.min(y0, -1); x1 = Math.max(x1, 1); y1 = Math.max(y1, 1); }
  // square-ish: the narrow side grows to at least 3/4 of the wide one (the model frame is square)
  const W = x1 - x0, H = y1 - y0;
  if (H < W * 0.75) { const e = Math.ceil(W * 0.75) - H; y0 -= Math.floor(e / 2); y1 += Math.ceil(e / 2); }
  if (W < H * 0.75) { const e = Math.ceil(H * 0.75) - W; x0 -= Math.floor(e / 2); x1 += Math.ceil(e / 2); }
  return { x0, y0, x1, y1 };
}
/** null when the model can draw the picture readably, else why not */
export function picFits(p: CongPic): string | null {
  const w = p.win.x1 - p.win.x0, h = p.win.y1 - p.win.y0;
  if (w > MAX_WIN || h > MAX_WIN) return `window ${w} x ${h} is wider than ${MAX_WIN} units`;
  for (const q of picPoints(p)) if (q[0] < p.win.x0 + 0.5 - EPS || q[0] > p.win.x1 - 0.5 + EPS || q[1] < p.win.y0 + 0.5 - EPS || q[1] > p.win.y1 - 0.5 + EPS) return `point ${q} is at the edge of the window`;
  if ((p.cands?.length ?? 0) > 4) return 'at most 4 candidate pictures';
  if (p.solve && !p.figs[p.solve.fig]) return 'the solution moves a figure that is not there';
  for (const f of [...p.figs, ...(p.cands ?? []).map(c => c.fig)]) {
    if (f.labels && f.labels.length !== f.pts.length) return 'one letter per vertex';
    if (f.lens && f.lens.length !== f.pts.length) return 'one length per side';
    for (let i = 0; i < f.pts.length; i++) for (let j = i + 1; j < f.pts.length; j++) if (veq(f.pts[i]!, f.pts[j]!)) return 'two vertices on one point';
  }
  return null;
}
/** the length of a side as a label: whole numbers for grid sides, else null (not countable) */
export function gridLen(a: V, b: V): string | null {
  if (a[0] === b[0]) return String(Math.abs(b[1] - a[1]));
  if (a[1] === b[1]) return String(Math.abs(b[0] - a[0]));
  const l = Math.sqrt(d2(a, b));
  return Number.isInteger(Math.round(l * 1e9) / 1e9) ? String(Math.round(l)) : null;
}
export const lensOf = (P: readonly V[]): (string | null)[] => P.map((p, i) => gridLen(p, P[(i + 1) % P.length]!));
