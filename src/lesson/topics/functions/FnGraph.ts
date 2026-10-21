// FnGraph: a relation as a graph, the model of "a vertical slice fixes ONE input and shows every output it has".
//   axes    a crisp signed grid (any steps, numbers >= 60 px at the plot's left and bottom edges, never on a line),
//           the x axis = input (amber name), the y axis = output (teal name); `qual` = a story graph without numbers
//   pt:<k>  a point: a painted bead (closed) or a ring (open), optionally its "(x, y)" on a plate beside it
//   path:<k> a line or curve (units polyline), clipped to the plot
// Focus: the vertical SLICE at an input (lavender, with a ring on every output it meets), a horizontal guide at an
// output, points / paths in another role (link = allowed, wrong = the witness), pulses, dimming, label fade.
// Pure layout; draw(c, progress, focus) keeps no state. Throws BlockError when the grid or a label cannot be read.
import { type Box, type Pt, box, boxesOverlap, clamp, padBox } from '../../../core/math';
import { type Canvas, arrow, strokePts, withAlpha, drawOn } from '../../../core/draw';
import type { Progress } from '../../../core/clock';
import { type Theme, type Paint, paint } from '../../../core/theme';
import { type Frame, check, hitsLines } from '../../../blocks/block';
import { circlePts } from '../../../core/pts';
import { drawWords } from '../../words';
import { tbox as wordsBox } from './text';
import { wash } from '../../wash';
import { DUSK } from '../../dusk';
import { hn } from './relation';

const NAME = 'FnGraph';
export interface GPoint { key: string; x: number; y: number; open?: boolean; col?: Paint; label?: boolean }
export interface GPath { key: string; pts: readonly (readonly [number, number])[]; col?: Paint; lw?: number }
export interface FnGraphParams {
  x0: number; x1: number; y0: number; y1: number; xStep: number; yStep: number;
  xName: string; yName: string;
  /** a story graph: first quadrant, no grid numbers (xTicks may name a few inputs) */
  qual?: boolean; xTicks?: readonly { v: number; t: string }[];
  /** the same px per unit on both axes (circles stay round) */
  equal?: boolean;
  points?: readonly GPoint[]; paths?: readonly GPath[];
}
export interface GraphFocus {
  slice?: { x: number; k: number; col?: Paint; hits?: readonly { y: number; col: Paint }[] };
  hline?: { y: number; k: number; col: Paint };
  ptCol?: Record<string, Paint>; ptPulse?: Record<string, number>; pathCol?: Record<string, Paint>;
  lit?: readonly string[]; dim?: number;
  labels?: Record<string, number>;
  xName?: number; yName?: number;
}
export interface GraphBlock {
  readonly kind: 'FnGraph';
  readonly box: Box;
  readonly where: { at(x: number, y: number): Pt; plot: Box; point(key: string): Box; label(key: string): Box | null; xName: Box; yName: Box; sliceFoot(x: number): Box };
  draw(c: Canvas, p: Progress<string>, f?: GraphFocus): void;
}

const NUM = 60, NAMEW = 46, BEAD = 15;
const near = (a: number, b: number) => Math.abs(a - b) < 1e-9;
const onStep = (v: number, s: number) => near(v / s, Math.round(v / s));

export function FnGraph(p: FnGraphParams, fr: Frame, _th: Theme): GraphBlock {
  check(p.x1 > p.x0 && p.y1 > p.y0 && p.xStep > 0 && p.yStep > 0, NAME, 'the window needs a size and steps');
  const nx = Math.round((p.x1 - p.x0) / p.xStep), ny = Math.round((p.y1 - p.y0) / p.yStep);
  if (!p.qual) {
    check(onStep(p.x0, p.xStep) && onStep(p.x1, p.xStep) && onStep(p.y0, p.yStep) && onStep(p.y1, p.yStep), NAME, 'the window ends must sit on grid lines');
    check(nx <= 22 && ny <= 22, NAME, 'too many grid lines to read');
  } else check(p.x0 === 0 && p.y0 === 0, NAME, 'a story graph starts at (0, 0)');
  const yLabs = p.qual ? [] : Array.from({ length: ny + 1 }, (_, i) => p.y0 + i * p.yStep);
  const yLabW = p.qual ? 0 : Math.max(...yLabs.map(v => wordsBox(hn(v), 0, 0, { size: NUM }).w));
  let plot = box(fr.x + (p.qual ? 40 : yLabW + 40), fr.y + 78, fr.x + fr.w - 36, fr.y + fr.h - (p.qual && !p.xTicks ? 90 : 150));
  let sx = plot.w / (p.x1 - p.x0), sy = plot.h / (p.y1 - p.y0);
  if (p.equal) {
    const s = Math.min(sx, sy), w = s * (p.x1 - p.x0), h = s * (p.y1 - p.y0);
    // centred in the room left over (the model stays in the middle of its frame)
    const ox = (plot.w - w) / 2, oy = (plot.h - h) / 2;
    plot = box(plot.x0 + ox, plot.y0 + oy, plot.x0 + ox + w, plot.y0 + oy + h);
    sx = sy = s;
  }
  check(plot.w >= 360 && plot.h >= 300, NAME, 'the frame is too small for a readable graph');
  const X = (v: number) => plot.x0 + (v - p.x0) * sx, Y = (v: number) => plot.y1 - (v - p.y0) * sy;
  const at = (x: number, y: number): Pt => [X(x), Y(y)];

  // tick labels outside the plot: bottom edge (x) and left edge (y), at a stride that leaves room
  interface Lab { t: string; x: number; y: number; align: 'center' | 'right'; box: Box }
  const ticks: Lab[] = [];
  if (!p.qual) {
    const xVals = Array.from({ length: nx + 1 }, (_, i) => p.x0 + i * p.xStep);
    const xw = Math.max(...xVals.map(v => wordsBox(hn(v), 0, 0, { size: NUM }).w));
    const STRIDES = [1, 2, 4, 5, 10, 20];
    const xs = STRIDES.find(k => k * p.xStep * sx >= xw + 24) ?? 20, ys = STRIDES.find(k => k * p.yStep * sy >= NUM + 14) ?? 20;
    // keep 0 labelled: stride counted from 0 when 0 is in the window
    const xAnchor = p.x0 <= 0 && p.x1 >= 0 ? 0 : p.x0, yAnchor = p.y0 <= 0 && p.y1 >= 0 ? 0 : p.y0;
    for (const v of xVals) if (onStep(v - xAnchor, xs * p.xStep)) ticks.push({ t: hn(v), x: X(v), y: plot.y1 + 48, align: 'center', box: wordsBox(hn(v), X(v), plot.y1 + 48, { size: NUM, align: 'center' }) });
    const xTicks = [...ticks];
    for (const v of yLabs) if (onStep(v - yAnchor, ys * p.yStep) && !xTicks.some(t => boxesOverlap(padBox(t.box, 6), wordsBox(hn(v), plot.x0 - 20, Y(v), { size: NUM, align: 'right' })))) ticks.push({ t: hn(v), x: plot.x0 - 20, y: Y(v), align: 'right', box: wordsBox(hn(v), plot.x0 - 20, Y(v), { size: NUM, align: 'right' }) });
  } else for (const t of p.xTicks ?? []) {
    check(t.v >= p.x0 && t.v <= p.x1, NAME, `tick ${t.t} is off the axis`);
    ticks.push({ t: t.t, x: X(t.v), y: plot.y1 + 48, align: 'center', box: wordsBox(t.t, X(t.v), plot.y1 + 48, { size: NUM, align: 'center' }) });
  }
  for (const a of ticks) for (const b of ticks) if (a !== b) check(!boxesOverlap(padBox(a.box, 4), b.box), NAME, `tick labels ${a.t} and ${b.t} overlap`);
  const xNameY = p.qual && !p.xTicks ? plot.y1 + 50 : plot.y1 + 112;
  const xNameB = wordsBox(p.xName, plot.x1, xNameY, { size: NAMEW, align: 'right' });
  const yNameB = wordsBox(p.yName, plot.x0 + (p.qual ? 30 : 0), plot.y0 - 44, { size: NAMEW, align: 'left' });
  check(xNameB.x0 > fr.x - 10 && yNameB.x1 < fr.x + fr.w + 10, NAME, 'an axis name is too long');
  for (const t of ticks) check(!boxesOverlap(padBox(t.box, 6), xNameB), NAME, 'the x axis name collides with a tick label');

  // axes: through 0 when 0 is in the window, else along the edge
  const axY = p.y0 <= 0 && p.y1 >= 0 ? Y(0) : plot.y1, axX = p.x0 <= 0 && p.x1 >= 0 ? X(0) : plot.x0;
  const pathPx = new Map<string, Pt[]>();
  for (const P of p.paths ?? []) {
    check(P.pts.length >= 2, NAME, `path ${P.key} needs two points`);
    pathPx.set(P.key, P.pts.map(([x, y]) => at(x, y)));
  }
  for (const q of p.points ?? []) check(q.x >= p.x0 - 1e-9 && q.x <= p.x1 + 1e-9 && q.y >= p.y0 - 1e-9 && q.y <= p.y1 + 1e-9, NAME, `point (${q.x}, ${q.y}) is off the grid`);
  const beads = (p.points ?? []).map(q => { const [x, y] = at(q.x, q.y); return box(x - BEAD - 4, y - BEAD - 4, x + BEAD + 4, y + BEAD + 4); });
  // point labels "(x, y)" on a plate: a search that refuses beads, curves, other labels and the frame edge
  const placed: Box[] = [...ticks.map(t => t.box), xNameB, yNameB];
  const labels = new Map<string, Box>();
  const curves = [...pathPx.values()];
  const SPOTS: [number, number][] = [[1, -1], [-1, -1], [1, 1], [-1, 1], [1.15, 0], [-1.15, 0], [0, -1.6], [0, 1.6], [1.6, -1.8], [-1.6, -1.8], [1.6, 1.8], [-1.6, 1.8]];
  for (const q of p.points ?? []) {
    if (!q.label) continue;
    const t = `(${hn(q.x)}, ${hn(q.y)})`, wB = wordsBox(t, 0, 0, { size: NUM }).w, h = NUM * 0.84;
    const [ax, ay] = at(q.x, q.y);
    let got: Box | null = null;
    for (const [dx, dy] of SPOTS) {
      const cx = ax + dx * (wB / 2 + 30), cy = ay + dy * (h / 2 + 22);
      const B = box(cx - wB / 2, cy - h / 2, cx + wB / 2, cy + h / 2);
      if (B.x0 < fr.x + 4 || B.x1 > fr.x + fr.w + 30 || B.y0 < fr.y || B.y1 > plot.y1 + 4) continue;
      if (hitsLines(B, curves, 12)) continue;
      if (placed.some(o => boxesOverlap(padBox(B, 10), o)) || beads.some(o => boxesOverlap(padBox(B, 8), o))) continue;
      got = B; break;
    }
    check(got, NAME, `no clear spot for the label ${t}`);
    placed.push(got); labels.set(q.key, got);
  }

  function draw(c: Canvas, P: Progress<string>, f: GraphFocus = {}): void {
    const kA = clamp(P.k('axes'));
    const g = c.g;
    if (kA > 0) withAlpha(c, kA, () => {
      wash(c, [[plot.x0 - 14, plot.y0 - 14], [plot.x1 + 14, plot.y0 - 14], [plot.x1 + 14, plot.y1 + 14], [plot.x0 - 14, plot.y1 + 14]], '#1A1E42', { seed: 51, ink: null, rough: 1.2, shade: 0.12 });
      if (!p.qual) {
        for (let i = 0; i <= nx; i++) { const x = X(p.x0 + i * p.xStep); strokePts(c, [[x, plot.y0], [x, plot.y1]], { col: '#3A3F6B', lw: 2, cap: 'butt' }); }
        for (let i = 0; i <= ny; i++) { const y = Y(p.y0 + i * p.yStep); strokePts(c, [[plot.x0, y], [plot.x1, y]], { col: '#3A3F6B', lw: 2, cap: 'butt' }); }
      }
      strokePts(c, [[plot.x0 - (p.qual ? 0 : 10), axY], [plot.x1 + 6, axY]], { col: DUSK.cream, lw: 4 });
      strokePts(c, [[axX, plot.y1 + (p.qual ? 0 : 10)], [axX, plot.y0 - 6]], { col: DUSK.cream, lw: 4 });
      arrow(c, [[plot.x1 - 10, axY], [plot.x1 + 26, axY]], 1, { col: 'ink', lw: 4, head: 22 });
      arrow(c, [[axX, plot.y0 + 10], [axX, plot.y0 - 26]], 1, { col: 'ink', lw: 4, head: 22 });
      for (const t of ticks) drawWords(c, t.t, t.x, t.y, 'dim', 1, { size: NUM, align: t.align, weight: 600 });
      const nameRing = (B: Box, col: Paint, k: number) => {
        if (k <= 0) return;
        g.save(); g.globalAlpha *= clamp(k); g.strokeStyle = paint(c.th, col, 'fill'); g.lineWidth = 4;
        g.beginPath(); g.roundRect(B.x0 - 14, B.y0 - 10, B.w + 28, B.h + 20, 12); g.stroke(); g.restore();
      };
      nameRing(xNameB, 'first', f.xName ?? 0); nameRing(yNameB, 'second', f.yName ?? 0);
      drawWords(c, p.xName, xNameB.x1, xNameY, 'first', 1, { size: NAMEW, align: 'right' });
      drawWords(c, p.yName, yNameB.x0, plot.y0 - 44, 'second', 1, { size: NAMEW, align: 'left' });
    });
    // the horizontal guide (under the curves)
    if (f.hline && f.hline.k > 0) drawOn(c, [[plot.x0, Y(f.hline.y)], [plot.x1, Y(f.hline.y)]], clamp(f.hline.k), { col: f.hline.col, lw: 4, dash: [14, 12], cap: 'butt' });
    // paths, clipped to the plot
    g.save(); g.beginPath(); g.rect(plot.x0 - 2, plot.y0 - 2, plot.w + 4, plot.h + 4); g.clip();
    for (const Pp of p.paths ?? []) {
      const k = clamp(P.k('path:' + Pp.key));
      if (k <= 0) continue;
      const col = f.pathCol?.[Pp.key] ?? Pp.col ?? 'water';
      drawOn(c, pathPx.get(Pp.key)!, k, { col, lw: Pp.lw ?? 6 });
    }
    g.restore();
    // the slice (over the paths, under the points)
    const S = f.slice;
    if (S && S.k > 0) {
      const x = X(S.x);
      strokePts(c, [[x, plot.y1 + 12], [x, plot.y0 - 12]], { col: S.col ?? 'pick', lw: 5, glow: 8, alpha: clamp(S.k * 1.5) });
    }
    // points
    for (const q of p.points ?? []) {
      const k = clamp(P.k('pt:' + q.key));
      if (k <= 0) continue;
      const [x, y] = at(q.x, q.y), col = f.ptCol?.[q.key] ?? q.col ?? 'ink';
      const dimmed = f.lit && !f.lit.includes(q.key) ? 1 - 0.65 * clamp(f.dim ?? 0) : 1;
      const pulse = f.ptPulse?.[q.key] ?? 0;
      withAlpha(c, dimmed, () => {
        if (pulse > 0) { g.save(); g.globalAlpha *= clamp(pulse); g.strokeStyle = paint(c.th, col, 'fill'); g.lineWidth = 4; g.shadowColor = paint(c.th, col, 'fill'); g.shadowBlur = 12; g.beginPath(); g.arc(x, y, 30, 0, Math.PI * 2); g.stroke(); g.restore(); }
        const r = BEAD * Math.min(1, k * 1.3);
        if (q.open) {
          g.save(); g.globalAlpha *= k; g.fillStyle = DUSK.navy; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
          g.strokeStyle = paint(c.th, col, 'fill'); g.lineWidth = 5; g.stroke(); g.restore();
        } else wash(c, circlePts(x, y, Math.max(1, r), 32), col, { seed: 5 + Math.round(x + y), ink: DUSK.ink, inkW: 2.5, rough: 0.6, shade: 0.2, alpha: k });
      });
      const L = labels.get(q.key), kl = f.labels?.[q.key] ?? (L ? 1 : 0);
      if (L && kl > 0) withAlpha(c, kl * k * dimmed, () => {
        g.save(); g.fillStyle = 'rgba(18,21,49,0.92)'; g.beginPath(); g.roundRect(L.x0 - 12, L.y0 - 8, L.w + 24, L.h + 16, 12); g.fill(); g.restore();
        drawWords(c, `(${hn(q.x)}, ${hn(q.y)})`, L.cx, L.cy, col === 'ink' ? 'ink' : col, 1, { size: NUM, align: 'center' });
      });
    }
    // slice hits: a ring on every output the slice meets
    if (S && S.k > 0.6) for (const h of S.hits ?? []) {
      const [x, y] = at(S.x, h.y);
      g.save(); g.globalAlpha *= clamp((S.k - 0.6) / 0.4); g.strokeStyle = paint(c.th, h.col, 'fill'); g.lineWidth = 5; g.shadowColor = g.strokeStyle as string; g.shadowBlur = 12;
      g.beginPath(); g.arc(x, y, 28, 0, Math.PI * 2); g.stroke(); g.restore();
    }
  }
  const pointBox = (key: string): Box => {
    const q = (p.points ?? []).find(z => z.key === key); check(q, NAME, `no point ${key}`);
    const [x, y] = at(q.x, q.y); return box(x - BEAD, y - BEAD, x + BEAD, y + BEAD);
  };
  return {
    kind: 'FnGraph',
    box: box(Math.min(plot.x0 - yLabW - 30, fr.x), yNameB.y0, Math.max(plot.x1 + 30, xNameB.x1), xNameB.y1),
    where: { at, plot, point: pointBox, label: k => labels.get(k) ?? null, xName: xNameB, yName: yNameB, sliceFoot: x => box(X(x) - 6, plot.y1 + 4, X(x) + 6, plot.y1 + 16) },
    draw,
  };
}

// ---------- curves in units (the maths of the familiar graphs, sampled) ----------
export function fnPts(f: (x: number) => number, a: number, b: number, n = 120): [number, number][] {
  return Array.from({ length: n + 1 }, (_, i) => { const x = a + ((b - a) * i) / n; return [x, f(x)] as [number, number]; });
}
/** x = a y^2 + c, sampled over y */
export const sidewaysPts = (a: number, c: number, ya: number, yb: number, n = 120): [number, number][] =>
  Array.from({ length: n + 1 }, (_, i) => { const y = ya + ((yb - ya) * i) / n; return [a * y * y + c, y] as [number, number]; });
export const circleUnits = (cx: number, cy: number, r: number, n = 160): [number, number][] =>
  Array.from({ length: n + 1 }, (_, i) => { const t = (Math.PI * 2 * i) / n; return [cx + r * Math.cos(t), cy + r * Math.sin(t)] as [number, number]; });
