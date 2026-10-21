// circleMaths.ts: the pure maths and layout of the circle model (no DOM, no canvas, no TeX measuring).
//   numbers     exact pi-coefficients (rationals), decimals for display, "about" values
//   wedgeStrip  the classic rearrangement: n equal wedges laid alternately up and down, half of the first wedge
//               moved to the far end; every piece keeps its size (area is conserved exactly) and the shape's width
//               n * r * sin(pi / n) approaches pi * r as the wedges narrow
//   layoutPic   where every part of a picture goes inside a Frame, with label boxes; returns `why` when a label would
//               sit on a line, leave the frame or hit another label (readable or nothing)
import { type Box, type Pt, type Q, box, rat } from '../../../core/math';
import { hitsLines } from '../../../blocks/block';

// ---------- numbers ----------
export const PI = Math.PI;
const EPS = 1e-9;
export const near = (a: number, b: number, tol = EPS) => Math.abs(a - b) <= tol;
/** a number as short text: whole, or up to 4 decimals, trailing zeros dropped */
export function dec(v: number, places = 4): string {
  const r = Math.round(v * 10 ** places) / 10 ** places;
  return String(Object.is(r, -0) ? 0 : r);
}
/** round to a number of decimal places (0 = whole) */
export const roundTo = (v: number, places: number) => Math.round(v * 10 ** places + 1e-9) / 10 ** places;
/** a rational from a friendly decimal or fraction (denominator up to 100) */
export function q(x: number): Q {
  for (let d = 1; d <= 100; d++) { const p = Math.round(x * d); if (Math.abs(p / d - x) < 1e-9) return rat(p, d); }
  throw new RangeError(`not a friendly number: ${x}`);
}
/** TeX of a pi-coefficient: 8, \tfrac{49}{4}, 2.5 (decimals stay decimals) */
export function coefTex(c: Q | number): string {
  if (typeof c === 'number') return dec(c);
  return c.q === 1 ? String(c.p) : `\\tfrac{${c.p}}{${c.q}}`;
}
/** TeX of c * pi: \pi, 8\pi, \tfrac{49}{4}\pi */
export function piTex(c: Q | number): string {
  const v = typeof c === 'number' ? c : c.p / c.q;
  if (near(v, 1)) return '\\pi';
  return `${coefTex(c)}\\pi`;
}
/** circumference and area of a circle with radius r, exactly as pi-coefficients and as numbers */
export function circle(r: Q): { C: Q; A: Q; Cv: number; Av: number } {
  const C = rat(2 * r.p, r.q), A = rat(r.p * r.p, r.q * r.q);
  return { C, A, Cv: (C.p / C.q) * PI, Av: (A.p / A.q) * PI };
}

// ---------- the wedge rearrangement ----------
export interface Piece {
  /** angles of the piece in the circle (canvas: y down, radians) */
  a0: number; a1: number;
  /** arcs on top (apex at the bottom) or arcs at the bottom */
  up: boolean;
  /** apex in the strip and the rotation that carries the piece there (shortest turn) */
  ax: number; ay: number; rot: number;
}
export interface Strip { n: number; R: number; x0: number; yb: number; width: number; rc: number; pieces: Piece[] }
const norm = (a: number) => { let x = a % (2 * PI); if (x > PI) x -= 2 * PI; if (x <= -PI) x += 2 * PI; return x; };
/** n wedges (even, >= 4) of a circle of radius R rearranged into a near-rectangle whose bottom-left corner is (x0, yb) */
export function wedgeStrip(n: number, R: number, x0: number, yb: number): Strip {
  if (n < 4 || n % 2) throw new RangeError(`wedgeStrip: n must be even and at least 4 (got ${n})`);
  const th = (2 * PI) / n, hw = R * Math.sin(th / 2), rc = R * Math.cos(th / 2);
  const pieces: Piece[] = [];
  // the upper half (angles pi .. 2pi, left to right) becomes the arcs on top, apex down
  for (let j = 0; j < n / 2; j++) {
    const a0 = PI + j * th, phi = a0 + th / 2, rot = norm(-PI / 2 - phi);
    if (j === 0) {
      // the first wedge is cut in half: its right half stays, its left half moves to the far end
      pieces.push({ a0: phi, a1: a0 + th, up: true, ax: x0, ay: yb, rot });
      pieces.push({ a0, a1: phi, up: true, ax: x0 + n * hw, ay: yb, rot });
    } else pieces.push({ a0, a1: a0 + th, up: true, ax: x0 + 2 * j * hw, ay: yb, rot });
  }
  // the lower half (angles pi .. 0, left to right) becomes the arcs at the bottom, apex up
  for (let j = 0; j < n / 2; j++) {
    const phi = PI - (j + 0.5) * th;
    pieces.push({ a0: phi - th / 2, a1: phi + th / 2, up: false, ax: x0 + (2 * j + 1) * hw, ay: yb - rc, rot: norm(PI / 2 - phi) });
  }
  return { n, R, x0, yb, width: n * hw, rc, pieces };
}
/** the outline of a piece placed at apex (x, y) turned by rot (k = 0: in the circle at (cx, cy)) */
export function piecePts(p: Piece, R: number, x: number, y: number, rot: number, r0 = 0): Pt[] {
  const P: Pt[] = [];
  const m = Math.max(4, Math.ceil(((p.a1 - p.a0) / (2 * PI)) * 96));
  if (r0 <= 0) P.push([x, y]);
  for (let i = 0; i <= m; i++) { const a = p.a0 + ((p.a1 - p.a0) * i) / m + rot; P.push([x + R * Math.cos(a), y + R * Math.sin(a)]); }
  if (r0 > 0) for (let i = m; i >= 0; i--) { const a = p.a0 + ((p.a1 - p.a0) * i) / m + rot; P.push([x + r0 * Math.cos(a), y + r0 * Math.sin(a)]); }
  return P;
}

// ---------- pictures ----------
export type Look = 'plain' | 'pizza' | 'rug' | 'pool' | 'garden' | 'lid' | 'table';
/** the rim band of each look, as a share of r (labels stay off it) */
export const RIM: Record<Look, number> = { plain: 0, pizza: 0.12, rug: 0.07, pool: 0.08, garden: 0.07, lid: 0.1, table: 0.05 };
export type SegKind = 'radius' | 'diameter' | 'chord' | 'stub' | 'off';
export interface Seg {
  kind: SegKind;
  /** degrees, canvas convention (0 = right, 90 = down) */
  a: number;
  /** chord: the angle of its other end; off: the angle of its inner end */
  b?: number;
  /** stub: its length as a share of r; off: how far from the center its inner end is */
  f?: number;
  /** TeX label (a letter or a measure); ans = what it turns into in the worked solution */
  tag?: string; ans?: string;
  /** drawn only in the worked solution */
  hidden?: boolean;
}
export interface DiscPic { kind: 'disc'; look: Look; segs: Seg[]; /** TeX labels for the circumference / the area */ ctag?: string; atag?: string }
export interface GridPic { kind: 'grid'; r: 3 | 4 | 5 }
export interface WedgePic { kind: 'wedges'; look: Look; n: number; topTag?: string; htTag?: string; dTag?: string; rTag?: string }
export interface PairPic { kind: 'pair'; look: Look; r1: number; r2: number; tags: [string, string]; seg: 'radius' | 'diameter'; copies?: number }
export interface UnrollPic { kind: 'unroll'; look: Look; dTag: string }
export type Pic = DiscPic | GridPic | WedgePic | PairPic | UnrollPic;
export interface FrameLike { x: number; y: number; w: number; h: number }

export interface Label { key: string; tex: string; x: number; y: number; size: number; box: Box; inside: boolean }
export interface SegGeo { p0: Pt; p1: Pt; label?: Label; ans?: Label }
export interface Lay {
  why: string | null;
  labels: Label[];
  /** every drawn line (segments, outlines), for the "no text on lines" check */
  lines: Pt[][];
  disc?: { cx: number; cy: number; R: number; segs: SegGeo[] };
  grid?: { cx: number; cy: number; s: number; r: number; x0: number; y0: number; cols: number };
  strip?: Strip;
  pair?: { a: { cx: number; cy: number; R: number }[]; b: { cx: number; cy: number; R: number }[]; quad: boolean; k: number };
  unroll?: { R: number; cx0: number; cy: number; floor: number; len: number };
}

// label size estimates (the canvas draws them centred on their anchor, so a generous box is safe)
const LABEL = 64;
/** a rough width of a TeX label in px (good to ~15 %; the layout pads by more) */
export function texW(src: string, size = LABEL): number {
  let s = src.replace(/\\text\{([^}]*)\}/g, '$1').replace(/\\tfrac\{([^}]*)\}\{([^}]*)\}/g, (_m, a: string, b: string) => (a.length > b.length ? a : b) + ' ')
    .replace(/\\(pi|approx|times|div|cdot|neq|to)/g, 'x').replace(/\\[,;!]|\\ /g, ' ').replace(/[{}^]/g, '').replace(/\\cssId\{[^}]*\}/g, '');
  s = s.replace(/\\[a-zA-Z]+/g, 'x');
  let w = 0;
  for (const ch of s) w += ch === ' ' ? 0.28 : /[0-9]/.test(ch) ? 0.52 : /[.,:]/.test(ch) ? 0.3 : /[A-Z=+]/.test(ch) ? 0.74 : 0.47;
  return w * size;
}
function labelAt(key: string, tex: string, x: number, y: number, size = LABEL, inside = false): Label {
  const w = texW(tex, size), h = size * (/\\tfrac/.test(tex) ? 1.15 : 0.82);
  return { key, tex, x, y, size, box: box(x - w / 2, y - h / 2, x + w / 2, y + h / 2), inside };
}
const overlaps = (a: Box, b: Box, pad: number) => a.x0 - pad < b.x1 && b.x0 - pad < a.x1 && a.y0 - pad < b.y1 && b.y0 - pad < a.y1;
const u = (deg: number): Pt => [Math.cos((deg * PI) / 180), Math.sin((deg * PI) / 180)];
export function circlePoly(cx: number, cy: number, R: number, n = 120): Pt[] {
  return Array.from({ length: n + 1 }, (_, i) => [cx + R * Math.cos((2 * PI * i) / n), cy + R * Math.sin((2 * PI * i) / n)] as Pt);
}
/** is a box clear of the circle's outline (wholly inside or wholly outside, with a margin)? */
function clearOfRing(b: Box, cx: number, cy: number, R: number, pad = 10, rim = 0): boolean {
  const cs: Pt[] = [[b.x0, b.y0], [b.x1, b.y0], [b.x0, b.y1], [b.x1, b.y1]];
  const far = Math.max(...cs.map(p => Math.hypot(p[0] - cx, p[1] - cy)));
  const nx = Math.max(b.x0, Math.min(cx, b.x1)), ny = Math.max(b.y0, Math.min(cy, b.y1));
  const nearD = Math.hypot(nx - cx, ny - cy);
  return far < R * (1 - rim) - pad || nearD > R + pad;
}
function inFrame(b: Box, F: FrameLike, m = 8): boolean { return b.x0 >= F.x + m && b.x1 <= F.x + F.w - m && b.y0 >= F.y + m && b.y1 <= F.y + F.h - m; }

export function segEnds(s: Seg, cx: number, cy: number, R: number): [Pt, Pt] {
  const A = u(s.a), B = u(s.b ?? s.a + 180);
  switch (s.kind) {
    case 'radius': return [[cx, cy], [cx + R * A[0], cy + R * A[1]]];
    case 'diameter': return [[cx - R * A[0], cy - R * A[1]], [cx + R * A[0], cy + R * A[1]]];
    case 'chord': return [[cx + R * A[0], cy + R * A[1]], [cx + R * B[0], cy + R * B[1]]];
    case 'stub': return [[cx, cy], [cx + (s.f ?? 0.6) * R * A[0], cy + (s.f ?? 0.6) * R * A[1]]];
    case 'off': return [[cx + R * A[0], cy + R * A[1]], [cx + (s.f ?? 0.3) * R * B[0], cy + (s.f ?? 0.3) * R * B[1]]];
  }
}
/** does a chord pass through the center? (the test of a diameter) */
export function throughCenter(s: Seg): boolean {
  if (s.kind === 'diameter') return true;
  if (s.kind !== 'chord') return false;
  const d = Math.abs(norm((((s.b ?? 0) - s.a) * PI) / 180));
  return near(d, PI, 1e-6);
}
/** a segment is a radius when one end is the center and the other is on the circle */
export const isRadius = (s: Seg) => s.kind === 'radius';

/** place a label beside a segment: off its middle, on either side, never on a line */
function placeSegLabel(key: string, tex: string, p0: Pt, p1: Pt, taken: Box[], lines: Pt[][], disc: { cx: number; cy: number; R: number; rim: number }, F: FrameLike, others: [Pt, Pt][] = []): Label | null {
  const dx = p1[0] - p0[0], dy = p1[1] - p0[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  const w = texW(tex), h = LABEL * 0.82;
  for (const t of [0.5, 0.62, 0.38, 0.75, 0.25, 0.85]) {
    for (const side of [1, -1]) {
      const off = 24 + 0.5 * Math.abs(w * nx) + 0.5 * Math.abs(h * ny);
      const x = p0[0] + dx * t + side * nx * off, y = p0[1] + dy * t + side * ny * off;
      const inside = Math.hypot(x - disc.cx, y - disc.cy) < disc.R;
      const lb = labelAt(key, tex, x, y, LABEL, inside);
      if (!inFrame(lb.box, F)) continue;
      if (hitsLines(lb.box, lines, 10)) continue;
      if (!clearOfRing(lb.box, disc.cx, disc.cy, disc.R, 10, disc.rim)) continue;
      if (taken.some(b => overlaps(b, lb.box, 12))) continue;
      // the label must clearly belong to its own segment: much nearer to it than to any other
      const own = segDist([x, y], p0, p1);
      if (others.some(([a, b]) => segDist([x, y], a, b) < own + 55)) continue;
      return lb;
    }
  }
  return null;
}

/** distance from a point to a segment */
export function segDist(p: Pt, a: Pt, b: Pt): number {
  const dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2));
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
}

export function layoutPic(p: Pic, F: FrameLike): Lay {
  switch (p.kind) {
    case 'disc': return layoutDisc(p, F);
    case 'grid': return layoutGrid(p, F);
    case 'wedges': return layoutWedges(p, F);
    case 'pair': return layoutPair(p, F);
    case 'unroll': return layoutUnroll(p, F);
  }
}

function layoutDisc(p: DiscPic, F: FrameLike): Lay {
  const R = Math.min(300, F.h * 0.33, F.w * 0.3), cx = F.x + F.w / 2, cy = F.y + F.h / 2 + 10;
  const ring = circlePoly(cx, cy, R);
  const lines: Pt[][] = [ring];
  const rim = RIM[p.look];
  const ends = p.segs.map(s => segEnds(s, cx, cy, R));
  for (const e of ends) lines.push([e[0], e[1]]);
  const labels: Label[] = [], taken: Box[] = [box(cx - 14, cy - 14, cx + 14, cy + 14)];
  let why: string | null = null;
  if (p.ctag) {
    // the circumference label sits above the circle, clear of the rim
    const lb = labelAt('ctag', p.ctag, cx, cy - R - 52);
    labels.push(lb); taken.push(lb.box);
  }
  if (p.atag) {
    const lb = labelAt('atag', p.atag, cx, cy - R * 0.5, LABEL, true);
    labels.push(lb); taken.push(lb.box);
  }
  const segs: SegGeo[] = ends.map(([p0, p1], i) => {
    const s = p.segs[i]!, g: SegGeo = { p0, p1 };
    if (!s.tag && !s.ans) return g;
    // the label is placed for the wider of its two texts (the answer takes the place of the question mark)
    const wide = [s.tag, s.ans].filter((t): t is string => !!t).sort((a, b) => texW(b) - texW(a))[0]!;
    const lb = placeSegLabel(`seg${i}`, wide, p0, p1, taken, lines, { cx, cy, R, rim }, F, ends.filter((_, j) => j !== i));
    if (!lb) { why ??= `no room for the label ${wide} of segment ${i} (${s.kind})`; return g; }
    taken.push(lb.box);
    if (s.tag) { g.label = labelAt(`seg${i}`, s.tag, lb.x, lb.y, LABEL, lb.inside); labels.push(g.label); }
    if (s.ans) { g.ans = labelAt(`seg${i}a`, s.ans, lb.x, lb.y, LABEL, lb.inside); labels.push(g.ans); }
    return g;
  });
  for (const lb of labels) {
    if (!inFrame(lb.box, F)) why ??= `label ${lb.tex} leaves the frame`;
    if (hitsLines(lb.box, lines, 6)) why ??= `label ${lb.tex} sits on a line`;
  }
  return { why, labels, lines, disc: { cx, cy, R, segs } };
}

function layoutGrid(p: GridPic, F: FrameLike): Lay {
  const cols = 2 * p.r + 2, s = Math.floor(Math.min((F.h - 60) / cols, (F.w - 360) / cols));
  const x0 = F.x + 40, y0 = F.y + (F.h - cols * s) / 2;
  const cx = x0 + (cols / 2) * s, cy = y0 + (cols / 2) * s;
  const lines: Pt[][] = [circlePoly(cx, cy, p.r * s)];
  for (let i = 0; i <= cols; i++) { lines.push([[x0 + i * s, y0], [x0 + i * s, y0 + cols * s]]); lines.push([[x0, y0 + i * s], [x0 + cols * s, y0 + i * s]]); }
  const lb = labelAt('rtag', `r = ${p.r}`, x0 + cols * s + 40 + texW(`r = ${p.r}`) / 2, cy);
  let why: string | null = null;
  if (s < 44) why = `grid squares too small (${s} px)`;
  if (!inFrame(lb.box, F)) why ??= 'the r label leaves the frame';
  return { why, labels: [lb], lines, grid: { cx, cy, s, r: p.r, x0, y0, cols } };
}

function layoutWedges(p: WedgePic, F: FrameLike): Lay {
  const R = Math.min(220, (F.h - 250) / 3, (F.w - 260) / 3.25);
  const cx = F.x + F.w / 2, cy = F.y + 40 + R;
  const strip = wedgeStrip(p.n, R, 0, 0);
  const x0 = cx - strip.width / 2, yt = cy + R + 125, yb = yt + R;
  const S = wedgeStrip(p.n, R, x0, yb);
  const lines: Pt[][] = [circlePoly(cx, cy, R), [[S.x0, yb], [S.x0, yb - R]], [[S.x0 + S.width, yb], [S.x0 + S.width, yb - S.rc]]];
  const labels: Label[] = [];
  if (p.dTag) labels.push(labelAt('dtag', p.dTag, cx - R - 30 - texW(p.dTag) / 2, cy));
  if (p.rTag) { const a = u(32); labels.push(labelAt('rtag', p.rTag, cx + (R + 30) * a[0] + texW(p.rTag) / 2, cy + (R + 30) * a[1] + 18)); }
  if (p.topTag) labels.push(labelAt('toptag', p.topTag, cx, yb - R - 50));
  if (p.htTag) labels.push(labelAt('httag', p.htTag, S.x0 + S.width + 36 + texW(p.htTag) / 2, yb - S.rc / 2));
  let why: string | null = null;
  for (const lb of labels) if (!inFrame(lb.box, F)) why ??= `label ${lb.tex} leaves the frame`;
  for (let i = 0; i < labels.length; i++) for (let j = i + 1; j < labels.length; j++) if (overlaps(labels[i]!.box, labels[j]!.box, 8)) why ??= `labels ${labels[i]!.tex} and ${labels[j]!.tex} overlap`;
  return { why, labels, lines, strip: S, disc: { cx, cy, R, segs: [] } };
}

function layoutPair(p: PairPic, F: FrameLike): Lay {
  const copies = p.copies ?? 1;
  const s = Math.min(290 / Math.max(p.r1, p.r2), (F.w - 300) / (2 * p.r1 + 2 * p.r2), copies > 1 ? (F.h - 260) / (2 * p.r2 * copies) : Infinity);
  const R1 = p.r1 * s, R2 = p.r2 * s, gap = 150;
  const lx = F.x + (F.w - (2 * R1 + 2 * R2 + gap)) / 2;
  const ax = lx + R1, bx = lx + 2 * R1 + gap + R2;
  const base = F.y + F.h * 0.5 + Math.max(R1, R2) * 0.5 + 10;
  const A = [{ cx: ax, cy: copies > 1 ? F.y + F.h / 2 - 30 : base - R1, R: R1 }];
  const B: { cx: number; cy: number; R: number }[] = [];
  if (copies > 1) {
    const step = (F.h - 120) / copies;
    for (let i = 0; i < copies; i++) B.push({ cx: bx, cy: F.y + 40 + step * i + step / 2 - 30, R: R2 });
  } else B.push({ cx: bx, cy: base - R2, R: R2 });
  const lines: Pt[][] = [];
  const labels: Label[] = [];
  const seg = (d: { cx: number; cy: number; R: number }): Pt[] => p.seg === 'radius' ? [[d.cx, d.cy], [d.cx + d.R, d.cy]] : [[d.cx - d.R, d.cy], [d.cx + d.R, d.cy]];
  for (const d of [...A, ...B]) { lines.push(circlePoly(d.cx, d.cy, d.R), seg(d)); }
  labels.push(labelAt('tag0', p.tags[0], A[0]!.cx, A[0]!.cy + A[0]!.R + 52));
  B.forEach((d, i) => labels.push(labelAt(`tag1.${i}`, p.tags[1], d.cx, d.cy + d.R + 52)));
  const k = Math.max(p.r1, p.r2) / Math.min(p.r1, p.r2);
  let why: string | null = null;
  for (const lb of labels) {
    if (!inFrame(lb.box, F)) why ??= `label ${lb.tex} leaves the frame`;
    if (hitsLines(lb.box, lines, 6)) why ??= `label ${lb.tex} sits on a line`;
  }
  if (Math.min(R1, R2) < 40) why ??= 'a circle is too small to read';
  for (let i = 0; i < labels.length; i++) for (let j = i + 1; j < labels.length; j++) if (overlaps(labels[i]!.box, labels[j]!.box, 8)) why ??= 'labels overlap';
  return { why, labels, lines, pair: { a: A, b: B, quad: Number.isInteger(k) && k >= 2 && k <= 4, k } };
}

function layoutUnroll(p: UnrollPic, F: FrameLike): Lay {
  const R = Math.min(130, (F.w - 140) / (2 + 2 * PI));
  const cx0 = F.x + 60 + R, floor = F.y + F.h * 0.56, cy = floor - R, len = 2 * PI * R;
  const lines: Pt[][] = [[[cx0, floor], [cx0 + len, floor]], [[cx0 - R, cy], [cx0 + R, cy]], circlePoly(cx0, cy, R)];
  const labels: Label[] = [labelAt('dtag', p.dTag, cx0, cy - R - 50)];
  for (let i = 0; i < 3; i++) labels.push(labelAt(`d${i}`, 'd', cx0 + (2 * i + 1) * R, floor + 95));
  let why: string | null = null;
  if (cx0 + len + R > F.x + F.w) why = 'the rolled line leaves the frame';
  for (const lb of labels) if (!inFrame(lb.box, F)) why ??= `label ${lb.tex} leaves the frame`;
  return { why, labels, lines, unroll: { R, cx0, cy, floor, len } };
}
