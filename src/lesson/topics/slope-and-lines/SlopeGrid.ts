// SlopeGrid: the coordinate plane of slope and lines (any quadrants, any axis scales, square grid cells).
//   axes        a quiet grid, bold axes where 0 is in range, tick labels on the bottom and left EDGES of the plot (never
//               on a grid line), the two quantity names (x amber, y teal)
//   line:<id>   y = mx + b, a vertical line x = c, or a curve y = ax² + c; drawn as a full line (arrows both ways), a
//               ray, a segment, separate points or a plain stroke, over the allowed inputs `from..to`
//   pt:<id>     a painted bead; ptl:<id> its label "(3, 3)" (or a name) placed beside it, never on a line
//   tri:<id>    a slope triangle from a to b: the run leg (amber, horizontal from a) and the rise leg (teal, vertical
//               to b), a faint fill; run:<id> / rise:<id> the leg labels; ang:<id> the angle at a and the right angle
//   path:<id>   a broken path through points (a non-line); ray:<id> a dashed ray from (0, 0) through a point (y/x)
// Labels are plain sans words (numbers >= 60 px, names >= 44 px) placed by a search that refuses any spot touching a
// line, a bead or another label; the block throws (BlockError) when nothing fits, so an unreadable picture never draws.
// Pure: layout in design px inside a Frame; draw(c, progress, focus) depends only on its inputs.
import { type Box, type Pt, box, clamp, boxesOverlap, padBox } from '../../../core/math';
import { type Canvas, drawOn, dot, withAlpha, arrow, fillPts, strokePts } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Progress } from '../../../core/clock';
import { type Role, type Theme, paint, rgba } from '../../../core/theme';
import { type Frame, check, hitsLines } from '../../../blocks/block';
import { circlePts } from '../../../core/pts';
import { drawWords, wordsBox } from '../../words';
import { wash } from '../../wash';
import { DUSK } from '../../dusk';
import { fmt, type P2 } from './slopeMaths';

const NAME = 'SlopeGrid';
export interface SGLine {
  id: string;
  /** y = m x + b */ m?: number; b?: number;
  /** a vertical line x = vx */ vx?: number;
  /** a curve y = a x² + c */ curve?: { a: number; c: number };
  /** allowed inputs (outputs for a vertical line); default: the whole axis */ from?: number; to?: number;
  ends?: 'full' | 'ray' | 'segment' | 'points' | 'plain';
  /** spacing of the inputs for ends 'points' (default 1) */ pstep?: number;
  /** the start of the allowed inputs is NOT allowed: a hollow ring there */ open0?: boolean;
  role?: Role;
  /** a short name at the far end (A, B, C) */ name?: string;
  /** where along the drawn line the name sits (0 = start, 1 = far end; default 1) */ nameAt?: number;
}
export interface SGPoint { id: string; x: number; y: number; label?: boolean | string; role?: Role }
export interface SGTri { id: string; a: P2; b: P2; run?: string; rise?: string; role?: Role }
export interface SGPath { id: string; pts: P2[]; role?: Role }
export interface SGRay { id: string; through: P2; role?: Role }
export interface SlopeGridParams {
  x0: number; x1: number; y0: number; y1: number; xStep: number; yStep: number;
  xName?: string; yName?: string;
  lines?: SGLine[]; points?: SGPoint[]; tris?: SGTri[]; paths?: SGPath[]; rays?: SGRay[];
}
export interface GridFocus {
  rings?: { b: Box; col: Role; k: number }[];
  /** a soft glow along a triangle leg (the part a symbol names) */ legs?: { id: string; leg: 'run' | 'rise'; k: number }[];
  /** fade a triangle out (0 = gone) */ triAlpha?: Record<string, number>;
}
export interface SlopeGridBlock {
  readonly kind: 'SlopeGrid';
  readonly box: Box;
  /** every step name the picture has, in drawing order (axes, lines, triangles, paths, rays, points, labels) */
  readonly steps: string[];
  readonly where: {
    plot: Box; at(x: number, y: number): Pt; point(id: string): Box; label(id: string): Box | null;
    run(id: string): Box | null; rise(id: string): Box | null; runLeg(id: string): Box; riseLeg(id: string): Box; corner(id: string): Box;
    lineEnd(id: string): Box; xName: Box | null; yName: Box | null;
  };
  draw(c: Canvas, p: Progress<string>, f?: GridFocus): void;
}

const NUM = 60, WORD = 46, BEAD = 15;
/** label width: measured in the browser; outside it (tests, generators) a per-glyph estimate a little wider than Segoe UI */
const GLYPH: Record<string, number> = { '(': 0.33, ')': 0.33, ',': 0.28, '.': 0.28, ' ': 0.27, '−': 0.6, '/': 0.4, '$': 0.56, '%': 0.85 };
export const approxWidth = (text: string, size: number): number => [...text].reduce((w, ch) => w + (GLYPH[ch] ?? (/[0-9]/.test(ch) ? 0.56 : /[A-Z]/.test(ch) ? 0.64 : 0.55)), 0) * size * 1.06;
const measure = (text: string, size: number): number => (typeof document === 'undefined' ? approxWidth(text, size) : wordsBox(text, 0, 0, { size }).w);
const bxAt = (text: string, x: number, y: number, size: number, align: 'left' | 'center' | 'right'): Box => {
  const w = measure(text, size), x0 = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
  return box(x0, y - size * 0.42, x0 + w, y + size * 0.42);
};
const near = (a: number, b: number) => Math.abs(a - b) < 1e-9;
const isMult = (v: number, s: number) => near(v / s, Math.round(v / s));

/** clip y = m x + b over x in [a0, a1] to y in [y0, y1]; null when it misses */
function clipLine(m: number, b: number, a0: number, a1: number, y0: number, y1: number): [number, number] | null {
  let lo = a0, hi = a1;
  if (near(m, 0)) { if (b < y0 - 1e-9 || b > y1 + 1e-9) return null; }
  else {
    const xa = (y0 - b) / m, xb = (y1 - b) / m;
    lo = Math.max(lo, Math.min(xa, xb)); hi = Math.min(hi, Math.max(xa, xb));
  }
  return hi - lo > 1e-9 ? [lo, hi] : null;
}

export function SlopeGrid(p: SlopeGridParams, fr: Frame, th: Theme): SlopeGridBlock {
  check(p.x1 > p.x0 && p.y1 > p.y0 && p.xStep > 0 && p.yStep > 0, NAME, 'axes need positive sizes and steps');
  check(isMult(p.x0, p.xStep) && isMult(p.x1, p.xStep) && isMult(p.y0, p.yStep) && isMult(p.y1, p.yStep), NAME, 'axis ends must sit on grid lines');
  const nx = Math.round((p.x1 - p.x0) / p.xStep), ny = Math.round((p.y1 - p.y0) / p.yStep);
  check(nx <= 24 && ny <= 24, NAME, 'too many grid lines to read');
  const xv = (i: number) => p.x0 + i * p.xStep, yv = (i: number) => p.y0 + i * p.yStep;
  const yLabW = Math.max(...Array.from({ length: ny + 1 }, (_, i) => measure(fmt(yv(i)), NUM)));
  const top = fr.y + (p.yName ? 86 : 34), bottom = fr.y + fr.h - 86 - (p.xName ? 66 : 0);
  const left = fr.x + yLabW + 34, right = fr.x + fr.w - 40;
  const cell = Math.min((right - left) / nx, (bottom - top) / ny);
  check(cell >= 24, NAME, 'grid cells are too small to read');
  const pw = cell * nx, ph = cell * ny;
  const px0 = left + (right - left - pw) / 2, py0 = top + (bottom - top - ph) / 2;
  const plot = box(px0, py0, px0 + pw, py0 + ph);
  const X = (v: number) => plot.x0 + ((v - p.x0) / p.xStep) * cell, Y = (v: number) => plot.y1 - ((v - p.y0) / p.yStep) * cell;
  const at = (x: number, y: number): Pt => [X(x), Y(y)];
  const inX = (v: number) => v >= p.x0 - 1e-9 && v <= p.x1 + 1e-9, inY = (v: number) => v >= p.y0 - 1e-9 && v <= p.y1 + 1e-9;

  // ---- tick labels on the plot edges, a nice stride of grid lines ----
  interface Lab { text: string; x: number; y: number; size: number; align: 'left' | 'center' | 'right'; box: Box; col: Role }
  const xLabMax = Math.max(...Array.from({ length: nx + 1 }, (_, i) => measure(fmt(xv(i)), NUM)));
  const STR = [1, 2, 4, 5, 10, 20];
  const xStride = STR.find(s => s * cell >= xLabMax + 26) ?? 20, yStride = STR.find(s => s * cell >= NUM + 10) ?? 20;
  const ticks: Lab[] = [];
  for (let i = 0; i <= nx; i++) {
    const v = xv(i); if (!isMult(v, xStride * p.xStep)) continue;
    const t = fmt(v); ticks.push({ text: t, x: X(v), y: plot.y1 + 46, size: NUM, align: 'center', box: bxAt(t, X(v), plot.y1 + 46, NUM, 'center'), col: 'dim' });
  }
  for (let i = 0; i <= ny; i++) {
    const v = yv(i); if (!isMult(v, yStride * p.yStep)) continue;
    if (i === 0 && ticks.some(t => t.align === 'center' && near(t.x, plot.x0))) { /* the corner: both labels fit, the x one sits lower */ }
    const t = fmt(v); ticks.push({ text: t, x: plot.x0 - 18, y: Y(v), size: NUM, align: 'right', box: bxAt(t, plot.x0 - 18, Y(v), NUM, 'right'), col: 'dim' });
  }
  // a y label at the bottom corner and an x label at the left corner would touch: drop the y one (the x row shows it)
  for (let i = ticks.length - 1; i >= 0; i--) {
    const t = ticks[i]!;
    if (t.align === 'right' && ticks.some(o => o !== t && o.align === 'center' && boxesOverlap(padBox(o.box, 6), t.box))) ticks.splice(i, 1);
  }
  const xNameL: Lab | null = p.xName ? { text: p.xName, x: plot.x1, y: plot.y1 + 112, size: WORD, align: 'right', box: bxAt(p.xName, plot.x1, plot.y1 + 112, WORD, 'right'), col: 'first' } : null;
  const yNameL: Lab | null = p.yName ? { text: p.yName, x: plot.x0, y: plot.y0 - 50, size: WORD, align: 'left', box: bxAt(p.yName, plot.x0, plot.y0 - 50, WORD, 'left'), col: 'second' } : null;
  if (xNameL) check(xNameL.box.x0 > fr.x, NAME, `the axis name "${p.xName}" is too long`);
  if (yNameL) check(yNameL.box.x1 < fr.x + fr.w + 10, NAME, `the axis name "${p.yName}" is too long`);

  // ---- geometry in px ----
  const axisLines: Pt[][] = [];
  if (inY(0)) axisLines.push([[plot.x0, Y(0)], [plot.x1 + 20, Y(0)]]);
  if (inX(0)) axisLines.push([[X(0), plot.y1], [X(0), plot.y0 - 22]]);
  const lineGeo = new Map<string, { P: Pt[]; ends: Pt[]; dots: Pt[]; hollow: Pt | null; arrowsBoth: boolean; arrowEnd: boolean }>();
  for (const L of p.lines ?? []) {
    let P: Pt[] = [];
    const ends = L.ends ?? 'full';
    let dots: Pt[] = [], hollow: Pt | null = null;
    if (L.vx !== undefined) {
      check(inX(L.vx), NAME, `vertical line x = ${L.vx} is off the axes`);
      const a0 = Math.max(L.from ?? p.y0, p.y0), a1 = Math.min(L.to ?? p.y1, p.y1);
      P = [at(L.vx, a0), at(L.vx, a1)];
    } else if (L.curve) {
      const a0 = Math.max(L.from ?? p.x0, p.x0), a1 = Math.min(L.to ?? p.x1, p.x1);
      for (let i = 0; i <= 120; i++) { const x = a0 + ((a1 - a0) * i) / 120, y = L.curve.a * x * x + L.curve.c; if (inY(y)) P.push(at(x, y)); }
      if (ends === 'points') for (let x = Math.ceil(a0); x <= a1 + 1e-9; x += L.pstep ?? 1) { const y = L.curve.a * x * x + L.curve.c; if (inY(y)) dots.push(at(x, y)); }
    } else {
      const m = L.m ?? 0, b = L.b ?? 0;
      const cl = clipLine(m, b, Math.max(L.from ?? p.x0, p.x0), Math.min(L.to ?? p.x1, p.x1), p.y0, p.y1);
      check(cl, NAME, `line ${L.id} is not inside the axes`);
      P = [at(cl[0], m * cl[0] + b), at(cl[1], m * cl[1] + b)];
      if (ends === 'points') {
        const st = L.pstep ?? 1;
        for (let x = Math.ceil((L.from ?? p.x0) / st - 1e-9) * st; x <= (L.to ?? p.x1) + 1e-9; x += st) {
          const y = m * x + b; if (!inX(x) || !inY(y)) continue;
          if (L.open0 && near(x, L.from ?? p.x0)) continue;
          dots.push(at(x, y));
        }
        check(dots.length >= 2, NAME, `line ${L.id}: fewer than 2 points inside the axes`);
      }
      if (L.open0) { const x = L.from ?? p.x0, y = m * x + b; if (inX(x) && inY(y)) hollow = at(x, y); }
    }
    check(P.length >= 2, NAME, `line ${L.id} is not inside the axes`);
    lineGeo.set(L.id, { P, ends: [P[0]!, P[P.length - 1]!], dots, hollow, arrowsBoth: ends === 'full', arrowEnd: ends === 'ray' });
  }
  const triGeo = new Map<string, { a: Pt; c: Pt; b: Pt; run: Pt[]; rise: Pt[] }>();
  for (const T of p.tris ?? []) {
    check(inX(T.a[0]) && inX(T.b[0]) && inY(T.a[1]) && inY(T.b[1]), NAME, `triangle ${T.id} is off the axes`);
    check(!near(T.a[0], T.b[0]) && !near(T.a[1], T.b[1]), NAME, `triangle ${T.id} has a zero leg`);
    const a = at(T.a[0], T.a[1]), b = at(T.b[0], T.b[1]), c = at(T.b[0], T.a[1]);
    triGeo.set(T.id, { a, b, c, run: [a, c], rise: [c, b] });
  }
  const pathGeo = new Map<string, Pt[]>();
  for (const Pa of p.paths ?? []) { for (const q of Pa.pts) check(inX(q[0]) && inY(q[1]), NAME, `path ${Pa.id} leaves the axes`); pathGeo.set(Pa.id, Pa.pts.map(q => at(q[0], q[1]))); }
  const rayGeo = new Map<string, Pt[]>();
  for (const R of p.rays ?? []) {
    check(inX(0) && inY(0), NAME, 'a ray from (0, 0) needs the origin on the axes');
    const [tx, ty] = R.through;
    const t = Math.min(tx > 0 ? p.x1 / tx : tx < 0 ? p.x0 / tx : Infinity, ty > 0 ? p.y1 / ty : ty < 0 ? p.y0 / ty : Infinity);
    rayGeo.set(R.id, [at(0, 0), at(tx * t, ty * t)]);
  }
  const allLines: Pt[][] = [...axisLines, ...[...lineGeo.values()].map(g => g.P), ...[...triGeo.values()].flatMap(g => [g.run, g.rise]), ...pathGeo.values(), ...rayGeo.values()];

  // ---- labels: a search over spots around an anchor ----
  const placed: Box[] = [...ticks.map(t => t.box), ...(xNameL ? [xNameL.box] : []), ...(yNameL ? [yNameL.box] : [])];
  const beads: Box[] = [...(p.points ?? []).map(pt => { const [x, y] = at(pt.x, pt.y); return box(x - BEAD, y - BEAD, x + BEAD, y + BEAD); }),
    ...[...lineGeo.values()].flatMap(g => g.dots.map(d => box(d[0] - 12, d[1] - 12, d[0] + 12, d[1] + 12)))];
  const inner = box(fr.x, fr.y, fr.x + fr.w, fr.y + fr.h);
  function place(text: string, ax: number, ay: number, size: number, spots: readonly [number, number][], what: string, col: Role): Lab {
    const w = measure(text, size), h = size * 0.84;
    for (const [dx, dy] of [...spots, ...RING]) {
      const cx = ax + dx * (w / 2 + 22), cy = ay + dy * (h / 2 + 18);
      const B = box(cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2);
      if (B.x0 < inner.x0 || B.x1 > inner.x1 || B.y0 < inner.y0 || B.y1 > inner.y1) continue;
      if (hitsLines(B, allLines, 8)) continue;
      if (placed.some(o => boxesOverlap(padBox(B, 8), o)) || beads.some(o => boxesOverlap(padBox(B, 6), o))) continue;
      placed.push(B);
      return { text, x: cx, y: cy, size, align: 'center', box: B, col };
    }
    check(false, NAME, `no clear spot for the label ${what}`);
  }
  // after a label's preferred spots: rings of spots around the anchor (on a square, nearest first), never far away
  const RING: [number, number][] = [];
  for (const r of [1, 1.35, 1.75]) for (let i = 0; i < 16; i++) {
    const t = (i * Math.PI) / 8, c = Math.cos(t), sn = Math.sin(t), k = r / Math.max(Math.abs(c), Math.abs(sn));
    RING.push([c * k, sn * k]);
  }
  const triLabs = new Map<string, { run: Lab | null; rise: Lab | null }>();
  for (const T of p.tris ?? []) {
    const g = triGeo.get(T.id)!;
    const s = T.b[1] > T.a[1] ? 1 : -1, t = T.b[0] > T.a[0] ? 1 : -1;   // screen: run label away from b, rise label away from a
    const runL = T.run ? place(T.run, (g.a[0] + g.c[0]) / 2, g.a[1], T.run.length > 3 ? WORD : NUM,
      [[0, s], [0, s * 1.7], [0.7, s], [-0.7, s], [0, s * 2.5], [0, -s], [0, -s * 1.7]], `run of ${T.id}`, 'first') : null;
    const riseL = T.rise ? place(T.rise, g.c[0], (g.c[1] + g.b[1]) / 2, T.rise.length > 3 ? WORD : NUM,
      [[t, 0], [t * 1.5, 0], [t, 0.8], [t, -0.8], [t * 2.1, 0], [-t, 0], [-t * 1.5, 0]], `rise of ${T.id}`, 'second') : null;
    triLabs.set(T.id, { run: runL, rise: riseL });
  }
  const SPOTS: [number, number][] = [[1, -1], [-1, -1], [1, 1], [-1, 1], [1.1, 0], [-1.1, 0], [0, -1.3], [0, 1.3], [1.6, -1.4], [-1.6, -1.4], [1.6, 1.4], [-1.6, 1.4], [0, -2.3], [0, 2.3], [2.1, 0], [-2.1, 0]];
  const nameLabs = new Map<string, Lab>();
  for (const L of p.lines ?? []) if (L.name) {
    const [s0, s1] = lineGeo.get(L.id)!.ends as [Pt, Pt], t = L.nameAt ?? 1;
    const e: Pt = [s0[0] + (s1[0] - s0[0]) * t, s0[1] + (s1[1] - s0[1]) * t];
    const sp: [number, number][] = t > 0.95 ? [[-1, -0.8], [-1.2, 0.8], [1, -0.8], [-1, 1.4], [-1.9, -0.8], [-1.9, 0.8], [1.2, 0.8], [0, 1.5], [0, -1.5]] : [[1, -1], [-1, -1], [1, 1], [-1, 1], [1.2, 0], [-1.2, 0], [0, -1.3], [0, 1.3]];
    nameLabs.set(L.id, place(L.name, e[0], e[1], NUM, sp, `line ${L.name}`, L.role ?? 'link'));
  }
  const ptLabs = new Map<string, Lab>();
  for (const pt of p.points ?? []) if (pt.label) {
    const text = typeof pt.label === 'string' ? pt.label : `(${fmt(pt.x)}, ${fmt(pt.y)})`;
    ptLabs.set(pt.id, place(text, X(pt.x), Y(pt.y), text.length <= 2 ? NUM : NUM, SPOTS, text, pt.role === 'wrong' ? 'wrong' : 'ink'));
  }
  const steps = ['axes', ...(p.lines ?? []).map(l => 'line:' + l.id), ...(p.rays ?? []).map(r => 'ray:' + r.id), ...(p.paths ?? []).map(q => 'path:' + q.id),
    ...(p.tris ?? []).flatMap(t => ['tri:' + t.id, ...(t.run ? ['run:' + t.id] : []), ...(t.rise ? ['rise:' + t.id] : [])]),
    ...(p.points ?? []).flatMap(q => ['pt:' + q.id, ...(q.label ? ['ptl:' + q.id] : [])])];

  // ---------- painters ----------
  function plate(c: Canvas, B: Box, a: number): void {
    const { g } = c;
    g.save(); g.globalAlpha *= a * 0.9; g.fillStyle = '#161A36';
    g.beginPath(); g.roundRect(B.x0 - 10, B.y0 - 6, B.w + 20, B.h + 12, 10); g.fill(); g.restore();
  }
  function lab(c: Canvas, L: Lab, k: number, col?: Role, bg = false): void {
    if (k <= 0) return;
    if (bg) plate(c, L.box, clamp(k));
    drawWords(c, L.text, L.align === 'center' ? L.box.cx : L.x, L.y, col ?? L.col, k, { size: L.size, align: L.align });
  }
  function ring(c: Canvas, B: Box, col: Role, k: number): void {
    if (k <= 0) return;
    const { g } = c, r = Math.max(B.w, B.h) / 2 + 10;
    g.save(); g.globalAlpha *= clamp(k);
    g.strokeStyle = paint(th, col, 'fill'); g.lineWidth = 5;
    g.shadowColor = paint(th, col, 'fill'); g.shadowBlur = 12 * th.glow * Math.hypot(g.getTransform().a, g.getTransform().b);
    g.beginPath(); g.arc(B.cx, B.cy, r, 0, Math.PI * 2); g.stroke(); g.restore();
  }
  function bead(c: Canvas, x: number, y: number, col: Role, k: number, seed: number): void {
    if (k <= 0) return;
    const r = BEAD * E.back(clamp(k));
    if (r <= 0.5) return;
    wash(c, circlePts(x, y, r, 28), col, { seed, rough: 0.9, ink: DUSK.ink, inkW: 3, shade: 0.25 });
  }
  function head(c: Canvas, from: Pt, to: Pt, col: Role, k: number): void {
    if (k <= 0) return;
    const d = Math.hypot(to[0] - from[0], to[1] - from[1]) || 1, u: Pt = [(to[0] - from[0]) / d, (to[1] - from[1]) / d];
    arrow(c, [[to[0] - u[0] * 30, to[1] - u[1] * 30], to], 1, { col, lw: 5.5, head: 22, alpha: clamp(k) });
  }
  function angleMark(c: Canvas, g: { a: Pt; c: Pt; b: Pt }, k: number): void {
    if (k <= 0) return;
    const t1 = Math.atan2(g.c[1] - g.a[1], g.c[0] - g.a[0]), t2 = Math.atan2(g.b[1] - g.a[1], g.b[0] - g.a[0]);
    let d = t2 - t1; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
    const r = 58, n = 24, P: Pt[] = [];
    for (let i = 0; i <= n; i++) { const t = t1 + (d * i) / n; P.push([g.a[0] + r * Math.cos(t), g.a[1] + r * Math.sin(t)]); }
    fillPts(c, [g.a, ...P], 'pick', 0.35 * clamp(k));
    drawOn(c, P, E.inOut(clamp(k)), { col: 'pick', lw: 5 });
    // the right angle at the corner
    const sx = Math.sign(g.a[0] - g.c[0]), sy = Math.sign(g.b[1] - g.c[1]), s = 26;
    strokePts(c, [[g.c[0] + sx * s, g.c[1]], [g.c[0] + sx * s, g.c[1] + sy * s], [g.c[0], g.c[1] + sy * s]], { col: 'pick', lw: 4, alpha: clamp(k) });
  }

  function draw(c: Canvas, P: Progress<string>, f: GridFocus = {}): void {
    const kA = P.k('axes');
    if (kA > 0) {
      const a = E.smooth(clamp(kA));
      withAlpha(c, a, () => {
        const { g } = c;
        g.save(); g.strokeStyle = rgba('#8A8EB8', 0.24); g.lineWidth = 1.6;
        for (let i = 0; i <= nx; i++) { const x = plot.x0 + i * cell; g.beginPath(); g.moveTo(x, plot.y1); g.lineTo(x, plot.y0); g.stroke(); }
        for (let i = 0; i <= ny; i++) { const y = plot.y1 - i * cell; g.beginPath(); g.moveTo(plot.x0, y); g.lineTo(plot.x1, y); g.stroke(); }
        g.restore();
      });
      for (const L of axisLines) arrow(c, L, a, { col: 'dim', lw: 4, head: 16 });
      for (const t of ticks) lab(c, t, a);
      if (xNameL) lab(c, xNameL, a); if (yNameL) lab(c, yNameL, a);
    }
    for (const R of p.rays ?? []) {
      const k = P.k('ray:' + R.id); if (k <= 0) continue;
      drawOn(c, rayGeo.get(R.id)!, E.inOut(clamp(k)), { col: R.role ?? 'pick', lw: 3.5, dash: [14, 10], alpha: 0.95 });
    }
    for (const L of p.lines ?? []) {
      const k = P.k('line:' + L.id); if (k <= 0) continue;
      const G = lineGeo.get(L.id)!, col = L.role ?? 'link', ke = E.inOut(clamp(k)), ends = L.ends ?? 'full';
      if (ends === 'points') {
        drawOn(c, G.P, ke, { col, lw: 2.5, dash: [6, 12], alpha: 0.4 });
        G.dots.forEach((d, i) => dot(c, d[0], d[1], 11 * E.back(clamp(k * 1.5 - (i / Math.max(1, G.dots.length)) * 0.5)), col));
      } else {
        drawOn(c, G.P, ke, { col, lw: 5.5 });
        const kh = clamp((k - 0.85) / 0.15);
        if (G.arrowsBoth && G.P.length >= 2) { head(c, G.P[G.P.length - 2]!, G.ends[1]!, col, kh); head(c, G.P[1]!, G.ends[0]!, col, kh); }
        if (G.arrowEnd) head(c, G.P[G.P.length - 2]!, G.ends[1]!, col, kh);
        if (ends === 'segment') for (const e of G.ends) dot(c, e[0], e[1], 11, col, kh);
        if (ends === 'ray' && !G.hollow) dot(c, G.ends[0]![0], G.ends[0]![1], 11, col, kh);
      }
      if (G.hollow && k > 0.3) {
        const [ox, oy] = G.hollow, g = c.g;
        g.save(); g.globalAlpha *= clamp((k - 0.3) / 0.3); g.fillStyle = '#20244A'; g.beginPath(); g.arc(ox, oy, 12, 0, Math.PI * 2); g.fill();
        g.strokeStyle = paint(th, col, 'fill'); g.lineWidth = 4; g.stroke(); g.restore();
      }
      const nl = nameLabs.get(L.id); if (nl) lab(c, nl, clamp((k - 0.6) / 0.4), col, true);
    }
    for (const Pa of p.paths ?? []) {
      const k = P.k('path:' + Pa.id); if (k <= 0) continue;
      const G = pathGeo.get(Pa.id)!;
      drawOn(c, G, E.inOut(clamp(k)), { col: Pa.role ?? 'wrong', lw: 5 });
    }
    for (const T of p.tris ?? []) {
      const k = P.k('tri:' + T.id) * (f.triAlpha?.[T.id] ?? 1), G = triGeo.get(T.id)!;
      if (k <= 0) continue;
      for (const l of f.legs ?? []) if (l.id === T.id && l.k > 0) strokePts(c, l.leg === 'run' ? G.run : G.rise, { col: l.leg === 'run' ? 'first' : 'second', lw: 18, alpha: 0.35 * clamp(l.k), glow: 16 });
      {
        fillPts(c, [G.a, G.c, G.b], T.role ?? 'pick', 0.16 * clamp(k * 2 - 1));
        drawOn(c, G.run, E.inOut(clamp(k * 2)), { col: 'first', lw: 7 });
        drawOn(c, G.rise, E.inOut(clamp(k * 2 - 1)), { col: 'second', lw: 7 });
      }
      const ka = f.triAlpha?.[T.id] ?? 1;
      angleMark(c, G, P.k('ang:' + T.id) * ka);
      const L = triLabs.get(T.id)!;
      if (L.run) lab(c, L.run, P.k('run:' + T.id) * ka, 'first', true);
      if (L.rise) lab(c, L.rise, P.k('rise:' + T.id) * ka, 'second', true);
    }
    (p.points ?? []).forEach((pt, i) => {
      const k = P.k('pt:' + pt.id); if (k <= 0) return;
      const [x, y] = at(pt.x, pt.y);
      bead(c, x, y, pt.role ?? 'ink', k, 700 + i * 13);
      const L = ptLabs.get(pt.id);
      if (L) lab(c, L, P.k('ptl:' + pt.id), pt.role === 'wrong' ? 'wrong' : pt.role === 'pick' ? 'pick' : 'ink', true);
    });
    for (const r of f.rings ?? []) ring(c, r.b, r.col, r.k);
  }

  const triOr = (id: string) => { const g = triGeo.get(id); check(g, NAME, `no triangle ${id}`); return g; };
  const legBox = (P: Pt[]) => box(Math.min(P[0]![0], P[1]![0]) - 8, Math.min(P[0]![1], P[1]![1]) - 8, Math.max(P[0]![0], P[1]![0]) + 8, Math.max(P[0]![1], P[1]![1]) + 8);
  return {
    kind: 'SlopeGrid', box: box(fr.x, fr.y, fr.x + fr.w, fr.y + fr.h), steps,
    where: {
      plot, at,
      point: id => { const pt = (p.points ?? []).find(q => q.id === id); check(pt, NAME, `no point ${id}`); const [x, y] = at(pt.x, pt.y); return box(x - BEAD, y - BEAD, x + BEAD, y + BEAD); },
      label: id => ptLabs.get(id)?.box ?? null,
      run: id => triLabs.get(id)?.run?.box ?? null, rise: id => triLabs.get(id)?.rise?.box ?? null,
      runLeg: id => legBox(triOr(id).run), riseLeg: id => legBox(triOr(id).rise),
      corner: id => { const g = triOr(id); return box(g.a[0] - 20, g.a[1] - 20, g.a[0] + 20, g.a[1] + 20); },
      lineEnd: id => { const g = lineGeo.get(id); check(g, NAME, `no line ${id}`); const e = g.ends[1]!; return box(e[0] - 16, e[1] - 16, e[0] + 16, e[1] + 16); },
      xName: xNameL?.box ?? null, yName: yNameL?.box ?? null,
    },
    draw,
  };
}
