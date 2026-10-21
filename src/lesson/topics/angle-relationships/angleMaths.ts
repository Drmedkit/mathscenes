// angleMaths.ts: the exact maths and the pure layout of the angle figures of "Angle relationships" (grade 7, 7.G.B.5).
// A picture (Pic) is one or two fans. A fan is a vertex with rays (a direction in degrees each, 0 = east, counter-
// clockwise), the lines that are DRAWN through the vertex (two opposite rays drawn as one stroke = encoded evidence),
// and angle marks (an arc or a right-angle box, a label: a measure, a name, an unknown or an expression).
// The drawing is only a picture: measures come from the labels (and the facts the kid names), never from the drawing.
// layoutPic() places everything inside a frame and refuses (picFits) when a label cannot sit inside its angle without
// touching a ray, an arc, another label or the frame edge. Pure: no DOM, no canvas (tests run it in node).
import { type Box, type Pt, box } from '../../../core/math';

export type MarkCol = 'first' | 'second' | 'link' | 'pick' | 'wrong' | 'plain';
export interface RayD {
  /** the letter of the point on the ray */
  p: string;
  /** direction in degrees (drawing only) */
  deg: number;
  /** drawn length as a share of the fan size (default 1) */
  len?: number;
  /** hide the letter (and the point) */
  noLetter?: boolean;
  /** a word shown at the ray's end instead of its letter (real-world items: "ground", "wall") */
  name?: string;
}
export interface AMark {
  id: string;
  /** the angle runs counterclockwise from ray a to ray b */
  a: string; b: string;
  /** the label ('' = none): '65°', 'x', '1', '(3x + 10)°', '?' */
  text?: string;
  /** the label after solving (layout reserves room for the longer of the two) */
  alt?: string;
  col?: MarkCol;
  /** a right-angle box instead of an arc */
  box?: boolean;
  /** equal-angle ticks across the arc */
  ticks?: number;
  /** 0 = a part (small arc), 1 = a whole drawn around parts (bigger arc) */
  lvl?: 0 | 1;
  /** the label sits in a bigger font (numbers >= 60 px always) */
  size?: number;
}
export interface Fan {
  O: string;
  rays: RayD[];
  /** pairs of rays drawn as ONE line through the vertex (arrows at both ends) */
  lines: [string, string][];
  marks: AMark[];
  /** draw the vertex letter (default true) */
  showO?: boolean;
}
export interface Pic {
  fans: Fan[];
  /** "not drawn to scale" caption */
  nts?: boolean;
  /** after a miss: marks to light up, texts to reveal (alt), the whole (straight / right / full) to show */
  solve?: { focus?: string[]; reveal?: string[] };
}

// ---------- angle maths ----------
export const norm = (d: number): number => ((d % 360) + 360) % 360;
/** the counterclockwise turn from direction a to direction b, in (0, 360] */
export const ccw = (a: number, b: number): number => { const s = norm(b - a); return s === 0 ? 360 : s; };
export function rayOf(f: Fan, p: string): RayD {
  const r = f.rays.find(x => x.p === p);
  if (!r) throw new Error(`angle figure: no ray ${p}`);
  return r;
}
/** the drawn measure of a mark (ccw from a to b) */
export const drawnSpan = (f: Fan, m: Pick<AMark, 'a' | 'b'>): number => ccw(rayOf(f, m.a).deg, rayOf(f, m.b).deg);
/** two rays are opposite rays in the figure only when a line through them is DRAWN (encoded), not when they look aligned */
export const isLine = (f: Fan, p: string, q: string): boolean => f.lines.some(([a, b]) => (a === p && b === q) || (a === q && b === p));
/** rays strictly inside the angle a -> b (ccw) */
export function raysInside(f: Fan, a: string, b: string): string[] {
  const d0 = rayOf(f, a).deg, s = ccw(d0, rayOf(f, b).deg);
  return f.rays.filter(r => r.p !== a && r.p !== b && ccw(d0, r.deg) < s).map(r => r.p);
}
/** adjacent: same vertex, a shared side, interiors do not overlap (angles given as ccw pairs) */
export function adjacent(f: Fan, m1: Pick<AMark, 'a' | 'b'>, m2: Pick<AMark, 'a' | 'b'>): boolean {
  return (m1.b === m2.a || m2.b === m1.a) && drawnSpan(f, m1) + drawnSpan(f, m2) <= 360 && !(m1.a === m2.a && m1.b === m2.b);
}
/** linear pair: adjacent and the two outer sides form a DRAWN line */
export function linearPair(f: Fan, m1: Pick<AMark, 'a' | 'b'>, m2: Pick<AMark, 'a' | 'b'>): boolean {
  if (!adjacent(f, m1, m2)) return false;
  const [x, y] = m1.b === m2.a ? [m1.a, m2.b] : [m2.a, m1.b];
  return isLine(f, x, y);
}
/** vertical angles: the sides of one are the opposite rays of the sides of the other, along two drawn lines */
export function vertical(f: Fan, m1: Pick<AMark, 'a' | 'b'>, m2: Pick<AMark, 'a' | 'b'>): boolean {
  return isLine(f, m1.a, m2.a) && isLine(f, m1.b, m2.b) && m1.a !== m2.a;
}

// ---------- building figures ----------
/** a fan from a start direction and consecutive angles (ccw), letters in order */
export function fanFrom(letters: string[], start: number, spans: number[], o: Partial<Fan> = {}): Fan {
  if (letters.length < spans.length + 1) throw new Error('fanFrom: too few letters');
  const rays: RayD[] = [];
  let d = start;
  rays.push({ p: letters[0]!, deg: norm(d) });
  spans.forEach((s, i) => { d += s; rays.push({ p: letters[i + 1]!, deg: norm(d) }); });
  return { O: o.O ?? 'O', rays, lines: o.lines ?? [], marks: o.marks ?? [], showO: o.showO };
}
/** two lines AC and BD crossing at O: A at `start`, B at start + theta (ccw), C opposite A, D opposite B */
export function crossing(L: [string, string, string, string], start: number, theta: number, O = 'O'): Fan {
  const [A, B, C, D] = L;
  return { O, rays: [{ p: A, deg: norm(start) }, { p: B, deg: norm(start + theta) }, { p: C, deg: norm(start + 180) }, { p: D, deg: norm(start + 180 + theta) }], lines: [[A, C], [B, D]], marks: [] };
}

// ---------- layout ----------
export interface Frame { x: number; y: number; w: number; h: number }
/** the model frame of the lesson stage (= runtime/stage MF), kept here so node tests can lay pictures out */
export const FIG: Frame = { x: 60, y: 70, w: 940, h: 940 };
export const LABEL = 60, LETTER = 48, NAME = 44, MAXL = 390, LETTER_GAP = 44;
const W: Record<string, number> = { ' ': 0.27, '(': 0.33, ')': 0.33, '°': 0.42, '+': 0.62, '−': 0.62, '-': 0.4, '?': 0.5, '=': 0.62, '.': 0.27, '∠': 0.72 };
/** estimated ink width of a sans label (Segoe UI semibold), a little generous so a real font always fits */
export function textW(t: string, size: number): number {
  let w = 0;
  for (const ch of t) w += W[ch] ?? (/[0-9]/.test(ch) ? 0.56 : /[A-Z]/.test(ch) ? 0.66 : /[a-z]/.test(ch) ? 0.54 : 0.6);
  return w * size * 1.04;
}
export const labelBox = (t: string, c: Pt, size: number): Box => { const w = textW(t, size); return box(c[0] - w / 2, c[1] - size * 0.42, c[0] + w / 2, c[1] + size * 0.42); };
const dirV = (deg: number): Pt => [Math.cos((deg * Math.PI) / 180), -Math.sin((deg * Math.PI) / 180)];
const add = (a: Pt, b: Pt, k = 1): Pt => [a[0] + b[0] * k, a[1] + b[1] * k];
const overlap = (a: Box, b: Box, pad: number) => a.x0 - pad < b.x1 && b.x0 - pad < a.x1 && a.y0 - pad < b.y1 && b.y0 - pad < a.y1;
/** does a polyline pass through the padded box (the "never text on lines" rule) */
export function hits(b: Box, lines: readonly (readonly Pt[])[], pad = 8): boolean {
  const x0 = b.x0 - pad, x1 = b.x1 + pad, y0 = b.y0 - pad, y1 = b.y1 + pad;
  for (const P of lines) for (let i = 1; i < P.length; i++) {
    const a = P[i - 1]!, c = P[i]!, n = Math.max(1, Math.ceil(Math.hypot(c[0] - a[0], c[1] - a[1]) / 5));
    for (let j = 0; j <= n; j++) { const x = a[0] + ((c[0] - a[0]) * j) / n, y = a[1] + ((c[1] - a[1]) * j) / n; if (x > x0 && x < x1 && y > y0 && y < y1) return true; }
  }
  return false;
}

export interface MarkLayout { m: AMark; a0: number; span: number; r: number; arc: Pt[]; label: { at: Pt; box: Box; size: number } | null }
export interface FanLayout {
  fan: Fan; O: Pt; L: number;
  ends: Record<string, Pt>;
  /** the drawn strokes: lines through O and lone rays */
  strokes: { pts: [Pt, Pt]; arrows: 1 | 2 }[];
  letters: { p: string; text: string; size: number; at: Pt; box: Box }[];
  oLetter: { at: Pt; box: Box } | null;
  marks: MarkLayout[];
}
export interface PicLayout { fans: FanLayout[]; nts: { at: Pt; box: Box } | null; err: string | null }

export const arcR = (L: number, lvl: number): number => (lvl ? Math.max(170, L * 0.66) : Math.max(70, Math.min(100, L * 0.25)));
export const BOX_S = 44;
function arcPts(O: Pt, r: number, a0: number, span: number, box_: boolean): Pt[] {
  if (box_) { const u = dirV(a0), v = dirV(a0 + span); const s = BOX_S; return [add(O, u, s), add(add(O, u, s), v, s), add(O, v, s)]; }
  const n = Math.max(6, Math.ceil(span / 4)), P: Pt[] = [];
  for (let i = 0; i <= n; i++) P.push(add(O, dirV(a0 + (span * i) / n), r));
  return P;
}

/** the equal-angle tick strokes across an arc */
export function tickSegs(O: Pt, r: number, a0: number, span: number, n: number): Pt[][] {
  const out: Pt[][] = [];
  for (let i = 0; i < n; i++) {
    const u = dirV(a0 + span / 2 + (i - (n - 1) / 2) * 7);
    out.push([add(O, u, r - 14), add(O, u, r + 14)]);
  }
  return out;
}
const cache = new Map<string, PicLayout>();
/** lay a picture out inside a frame; err says why it cannot be drawn readably (null = fine) */
export function layoutPic(pic: Pic, fr: Frame = FIG): PicLayout {
  const key = JSON.stringify([pic.fans, pic.nts, fr]);
  const hit = cache.get(key);
  if (hit) return hit;
  const out = layoutUncached(pic, fr);
  if (cache.size > 400) cache.clear();
  cache.set(key, out);
  return out;
}
function layoutUncached(pic: Pic, fr: Frame): PicLayout {
  const n = pic.fans.length;
  const capH = pic.nts ? 70 : 0;
  const cells: Frame[] = n === 1 ? [{ x: fr.x, y: fr.y, w: fr.w, h: fr.h - capH }]
    : pic.fans.map((_, i) => ({ x: fr.x, y: fr.y + ((fr.h - capH) / n) * i, w: fr.w, h: (fr.h - capH) / n }));
  let err: string | null = null;
  const placed: Box[] = [];
  const fans: FanLayout[] = pic.fans.map((f, i) => {
    const r = layoutFan(f, cells[i]!, placed);
    if (r.err && !err) err = r.err;
    return r.lay;
  });
  let nts: PicLayout['nts'] = null;
  if (pic.nts) {
    const t = 'not drawn to scale', at: Pt = [fr.x + fr.w / 2, fr.y + fr.h - 34];
    nts = { at, box: box(at[0] - textW(t, 44) / 2, at[1] - 19, at[0] + textW(t, 44) / 2, at[1] + 19) };
    const strokes = fans.flatMap(fl => fl.strokes.map(s => s.pts as Pt[]));
    if (hits(nts.box, strokes) || placed.some(b => overlap(b, nts!.box, 6))) err ??= 'the not-to-scale caption touches the figure';
  }
  return { fans, nts, err };
}
function layoutFan(f: Fan, cell: Frame, placed: Box[]): { lay: FanLayout; err: string | null } {
  let err: string | null = null;
  // the fan's extent in units of L (vertex + every ray end), then the biggest L that fits with room for letters
  const pts: Pt[] = [[0, 0], ...f.rays.map(r => { const v = dirV(r.deg); const l = r.len ?? 1; return [v[0] * l, v[1] * l] as Pt; })];
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const bx0 = Math.min(...xs), bx1 = Math.max(...xs), by0 = Math.min(...ys), by1 = Math.max(...ys);
  const M = LETTER_GAP + 44;
  const L = Math.min(MAXL, (cell.w - 2 * M) / Math.max(0.3, bx1 - bx0), (cell.h - 2 * M) / Math.max(0.3, by1 - by0));
  const O: Pt = [cell.x + cell.w / 2 - ((bx0 + bx1) / 2) * L, cell.y + cell.h / 2 - ((by0 + by1) / 2) * L];
  const ends: Record<string, Pt> = {};
  for (const r of f.rays) ends[r.p] = add(O, dirV(r.deg), L * (r.len ?? 1));
  const strokes: FanLayout['strokes'] = [];
  const inLine = new Set<string>();
  for (const [a, b] of f.lines) { strokes.push({ pts: [ends[a]!, ends[b]!], arrows: 2 }); inLine.add(a); inLine.add(b); }
  for (const r of f.rays) if (!inLine.has(r.p)) strokes.push({ pts: [O, ends[r.p]!], arrows: 1 });
  const polys: Pt[][] = strokes.map(s => s.pts);
  const inside = (b: Box) => b.x0 >= cell.x + 6 && b.x1 <= cell.x + cell.w - 6 && b.y0 >= cell.y + 6 && b.y1 <= cell.y + cell.h - 6;
  const letters: FanLayout['letters'] = [];
  for (const r of f.rays) {
    if (r.noLetter) continue;
    const t = r.name ?? r.p, size = r.name ? NAME : LETTER, u = dirV(r.deg);
    const w = textW(t, size), gap = r.name ? 24 + Math.abs(u[0]) * w / 2 + Math.abs(u[1]) * size * 0.45 : LETTER_GAP;
    const at = add(ends[r.p]!, u, gap);
    const b = labelBox(t, at, size);
    letters.push({ p: r.p, text: t, size, at, box: b });
    if (!inside(b)) err ??= `letter ${r.p} is outside the frame`;
    if (placed.some(x => overlap(x, b, 6))) err ??= `letter ${r.p} touches another label`;
    placed.push(b);
  }
  // marks: arcs first (their curves are obstacles for every label), then labels, the smallest angle first
  const marks: MarkLayout[] = f.marks.map(m => {
    const a0 = rayOf(f, m.a).deg, span = drawnSpan(f, m);
    const r = m.box ? BOX_S : arcR(L, m.lvl ?? 0);
    return { m, a0, span, r, arc: arcPts(O, r, a0, span, !!m.box), label: null };
  });
  const arcs: Pt[][] = marks.map(x => x.arc);
  // equal-angle ticks are obstacles too (reserved even while they are hidden, so labels never jump)
  for (const ml of marks) for (const t of tickSegs(O, ml.r, ml.a0, ml.span, ml.m.box ? 0 : ml.m.ticks ?? 0)) arcs.push(t);
  const order = marks.slice().sort((p, q) => (p.m.lvl ?? 0) - (q.m.lvl ?? 0) || p.span - q.span);
  for (const ml of order) {
    const t = longer(ml.m.text ?? '', ml.m.alt ?? '');
    if (!t) continue;
    const size = Math.max(LABEL, ml.m.size ?? LABEL);
    const found = placeLabel(O, ml, t, size, L, [...polys, ...arcs], placed, inside);
    if (!found) { err ??= `label "${t}" does not fit inside its ${Math.round(ml.span)}° angle`; continue; }
    ml.label = found; placed.push(found.box);
  }
  // the vertex letter: in the widest gap, close to the vertex, clear of everything
  let oLetter: FanLayout['oLetter'] = null;
  if (f.showO !== false) {
    const dirs = f.rays.map(r => r.deg).sort((a, b) => a - b);
    const gaps = dirs.map((d, i) => ({ d, s: ccw(d, dirs[(i + 1) % dirs.length]!) })).sort((a, b) => b.s - a.s);
    if (dirs.length === 1) gaps[0] = { d: dirs[0]!, s: 360 };
    outer: for (const g of gaps) for (const rr of [34, 40, 48, 108, 124]) for (const off of [0.5, 0.35, 0.65, 0.2, 0.8]) {
      const at = add(O, dirV(g.d + g.s * off), rr);
      const b = labelBox(f.O, at, LETTER);
      if (hits(b, [...polys, ...arcs], 4) || placed.some(x => overlap(x, b, 4)) || !inside(b)) continue;
      oLetter = { at, box: b }; placed.push(b); break outer;
    }
    if (!oLetter) err ??= `no room for the vertex letter ${f.O}`;
  }
  return { lay: { fan: f, O, L, ends, strokes, letters, oLetter, marks }, err };
}
const longer = (a: string, b: string) => (textW(b, 1) > textW(a, 1) ? b : a);
function placeLabel(O: Pt, ml: MarkLayout, t: string, size: number, L: number, obstacles: Pt[][], placed: Box[], inside: (b: Box) => boolean): MarkLayout['label'] {
  const half = ml.span / 2, mid = ml.a0 + half;
  const r0 = ml.m.box ? BOX_S + 20 : ml.r + 18;
  const offs: number[] = [0];
  for (let s = 3; s < half - 2; s += 3) offs.push(s, -s);
  for (let rr = r0; rr <= L - 16; rr += 8) {
    for (const off of offs) {
      const at = add(O, dirV(mid + off), rr);
      const b = labelBox(t, at, size);
      if (!inside(b)) continue;
      if (hits(b, obstacles, 9)) continue;
      if (placed.some(x => overlap(x, b, 10))) continue;
      return { at, box: b, size };
    }
  }
  return null;
}
/** null when the picture lays out readably in the frame, otherwise the reason */
export const picFits = (pic: Pic, fr: Frame = FIG): string | null => layoutPic(pic, fr).err;

// ---------- text helpers (TeX for the board, plain for the panel) ----------
export const deg = (n: number): string => `${n}°`;
export const texDeg = (n: number | string): string => `${n}^\\circ`;
export const mA = (name: string): string => `m\\angle ${name}`;
/** an expression ax + b as text: "3x + 10", "2x − 5", "x" */
export function exprText(a: number, b: number, minus = '−'): string {
  const ax = a === 1 ? 'x' : `${a}x`;
  return b === 0 ? ax : b > 0 ? `${ax} + ${b}` : `${ax} ${minus} ${-b}`;
}
