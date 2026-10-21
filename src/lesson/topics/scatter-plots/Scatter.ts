// Scatter: the model of bivariate data. Every case is ONE painted dot that carries both of its measurements; the
// cloud of dots has a direction, a form and a strength; a trend line summarises it, and a prediction is read
// from the LINE, not from a dot.
//   axes      a crisp grid, each axis its own equal-interval scale (numbers >= 60 px outside the plot, never on a
//             line), axis names with units (44 px); a zigzag break when an axis does not start at 0
//   points    amber beads (a duplicate pair shows its count beside it), letter tags beside some dots
//   lines     trend lines (clipped to the plot, a letter at the end when tagged, dashed for an extension)
// Focus: plot dots one by one with guides from both axes, ring dots, sticks from the dots to a line (how close),
// a straight edge, a direction arrow, the observed x-range band, a prediction guide (up to the line, across to the
// y axis), cluster rings, a (wrong) join of the dots, candidate spots A-D, dimming.
// Pure layout; draw(c, focus) keeps no state. Throws BlockError when a label or the grid cannot be read.
import { type Box, type Pt, box, boxesOverlap, clamp, padBox } from '../../../core/math';
import { type Canvas, arrow, drawOn, strokePts, withAlpha } from '../../../core/draw';
import { circlePts, rectPts } from '../../../core/pts';
import type { Paint } from '../../../core/theme';
import { type Frame, check } from '../../../blocks/block';
import { drawWords, wordsBox } from '../../words';
import { inkLine, wash } from '../../wash';
import { DUSK } from '../../dusk';
import { type PlotSpec, EPS, fmt, lineY } from './bivariate';

const NAME = 'Scatter';
const NUM = 60, NAMEW = 44, TAG = 48, BEAD = 13;
export interface ScatterFocus {
  axes?: number;
  /** how many dots show (float: the next one fades in); default all */
  shown?: number;
  /** the dot being plotted now: dashed guides from both axes (k 0..1) */
  cur?: { i: number; k: number };
  /** per-line draw-on (default 1 for every line) */
  lines?: readonly number[];
  lineCol?: readonly (Paint | undefined)[];
  lineDim?: readonly number[];
  join?: number;
  ruler?: number;
  band?: number;
  /** a prediction guide at x up to line `line`, 0..1 */
  guide?: { x: number; line: number; k: number; col?: Paint };
  sticks?: { line: number; k: number };
  rings?: readonly { i: number; col: Paint; k: number }[];
  groups?: number;
  arrow?: number;
  marks?: number;
  markCol?: Readonly<Record<string, Paint>>;
  /** 0..1 dims every dot except `lit` */
  dim?: number; lit?: readonly number[];
  /** 0..1 tag letters on dots */
  tags?: number;
  /** pulse on the axis names */
  names?: number;
  /** a slope triangle from (x1, y1) across to x2, then up to y2, with its run and rise written beside the legs */
  tri?: { x1: number; y1: number; x2: number; y2: number; k: number; run: string; rise: string };
}
export interface ScatterBlock {
  readonly kind: 'Scatter';
  readonly spec: PlotSpec;
  readonly box: Box;
  readonly where: { at(x: number, y: number): Pt; plot: Box; pt(i: number): Box; guideHit(x: number, line: number): Box; yAxisAt(y: number): Box; xName: Box; yName: Box; mark(tag: string): Box };
  draw(c: Canvas, f?: ScatterFocus): void;
}

const onStep = (v: number, s: number) => Math.abs(v / s - Math.round(v / s)) < 1e-6;
const ROLE_OF: Record<string, Paint> = { link: 'link', second: 'second', pick: 'pick', water: 'water', wrong: 'wrong', dim: 'dim', first: 'first' };

export function Scatter(p: PlotSpec, fr: Frame): ScatterBlock {
  check(p.x1 > p.x0 && p.y1 > p.y0 && p.xStep > 0 && p.yStep > 0, NAME, 'the window needs a size and steps');
  check(onStep(p.x0, p.xStep) && onStep(p.x1, p.xStep) && onStep(p.y0, p.yStep) && onStep(p.y1, p.yStep), NAME, 'the window ends must sit on grid lines');
  const nx = Math.round((p.x1 - p.x0) / p.xStep), ny = Math.round((p.y1 - p.y0) / p.yStep);
  check(nx <= 16 && ny <= 16, NAME, 'too many grid lines to read');
  const yVals = Array.from({ length: ny + 1 }, (_, i) => p.y0 + i * p.yStep), xVals = Array.from({ length: nx + 1 }, (_, i) => p.x0 + i * p.xStep);
  const yLabW = Math.max(...yVals.map(v => wordsBox(fmt(v), 0, 0, { size: NUM }).w));
  const plot = box(fr.x + yLabW + 44, fr.y + 84, fr.x + fr.w - 44, fr.y + fr.h - 150);
  check(plot.w >= 300 && plot.h >= 260, NAME, 'the frame is too small for a readable plot');
  const sx = plot.w / (p.x1 - p.x0), sy = plot.h / (p.y1 - p.y0);
  const X = (v: number) => plot.x0 + (v - p.x0) * sx, Y = (v: number) => plot.y1 - (v - p.y0) * sy;
  const at = (x: number, y: number): Pt => [X(x), Y(y)];

  // tick labels outside the plot, at a stride that leaves room
  interface Lab { t: string; x: number; y: number; align: 'center' | 'right'; box: Box }
  const ticks: Lab[] = [];
  const xw = Math.max(...xVals.map(v => wordsBox(fmt(v), 0, 0, { size: NUM }).w));
  const STRIDES = [1, 2, 4, 5, 10];
  const xs = STRIDES.find(k => k * p.xStep * sx >= xw + 26) ?? 10, ys = STRIDES.find(k => k * p.yStep * sy >= NUM + 12) ?? 10;
  xVals.forEach((v, i) => { if (i % xs === 0) ticks.push({ t: fmt(v), x: X(v), y: plot.y1 + 50, align: 'center', box: wordsBox(fmt(v), X(v), plot.y1 + 50, { size: NUM, align: 'center' }) }); });
  yVals.forEach((v, i) => { if (i % ys === 0 && i > 0) ticks.push({ t: fmt(v), x: plot.x0 - 22, y: Y(v), align: 'right', box: wordsBox(fmt(v), plot.x0 - 22, Y(v), { size: NUM, align: 'right' }) }); });
  // y0 labelled too unless it would collide with the first x label
  { const v = p.y0, B = wordsBox(fmt(v), plot.x0 - 22, Y(v), { size: NUM, align: 'right' }); if (!ticks.some(t => boxesOverlap(padBox(t.box, 6), B))) ticks.push({ t: fmt(v), x: plot.x0 - 22, y: Y(v), align: 'right', box: B }); }
  for (const a of ticks) for (const b of ticks) if (a !== b) check(!boxesOverlap(padBox(a.box, 3), b.box), NAME, `tick labels ${a.t} and ${b.t} overlap`);
  const xNameB = wordsBox(p.xName, plot.x1, plot.y1 + 116, { size: NAMEW, align: 'right' });
  const yNameB = wordsBox(p.yName, plot.x0 - 10, plot.y0 - 46, { size: NAMEW, align: 'left' });
  check(xNameB.x0 > fr.x - 10 && yNameB.x1 < fr.x + fr.w + 20, NAME, `an axis name is too long (${p.xName} / ${p.yName})`);
  for (const t of ticks) check(!boxesOverlap(padBox(t.box, 4), xNameB), NAME, 'the x axis name collides with a tick label');

  for (const q of p.pts) check(q.x >= p.x0 - EPS && q.x <= p.x1 + EPS && q.y >= p.y0 - EPS && q.y <= p.y1 + EPS, NAME, `point (${q.x}, ${q.y}) is off the grid`);
  for (const m of p.marks ?? []) check(m.x >= p.x0 - EPS && m.x <= p.x1 + EPS && m.y >= p.y0 - EPS && m.y <= p.y1 + EPS, NAME, `spot ${m.tag} is off the grid`);
  const ptBox = (i: number) => { const [x, y] = at(p.pts[i]!.x, p.pts[i]!.y); return box(x - BEAD - 6, y - BEAD - 6, x + BEAD + 6, y + BEAD + 6); };

  /** a line clipped to the plot (and to its own x-range) */
  function seg(L: { m: number; b: number; x0?: number; x1?: number }): [Pt, Pt] | null {
    let a = Math.max(p.x0, L.x0 ?? p.x0), b = Math.min(p.x1, L.x1 ?? p.x1);
    if (Math.abs(L.m) > EPS) {
      const ya = (p.y0 - L.b) / L.m, yb = (p.y1 - L.b) / L.m;
      a = Math.max(a, Math.min(ya, yb)); b = Math.min(b, Math.max(ya, yb));
    } else if (L.b < p.y0 - EPS || L.b > p.y1 + EPS) return null;
    if (b <= a) return null;
    return [at(a, lineY(L, a)), at(b, lineY(L, b))];
  }
  const segs = (p.lines ?? []).map(seg);
  const guideHit = (x: number, li: number): Box => { const L = p.lines?.[li]; const [gx, gy] = at(x, L ? lineY(L, x) : p.y0); return box(gx - 12, gy - 12, gx + 12, gy + 12); };
  const yAxisAt = (y: number): Box => { const yy = Y(y); return box(plot.x0 - 12, yy - 12, plot.x0 + 12, yy + 12); };
  const markBox = (tag: string): Box => { const m = (p.marks ?? []).find(q => q.tag === tag); const [x, y] = m ? at(m.x, m.y) : [plot.cx, plot.cy]; return box(x - 26, y - 26, x + 26, y + 26); };
  const all = box(Math.min(fr.x, yNameB.x0), fr.y, fr.x + fr.w, fr.y + fr.h);

  function ring(c: Canvas, cx: number, cy: number, r: number, col: Paint, k: number, lw = 4): void {
    if (k <= 0) return;
    drawOn(c, circlePts(cx, cy, r, 56), k, { col, lw, closed: true, glow: 8, glowCol: col });
  }
  function bead(c: Canvas, x: number, y: number, a: number, col: Paint = 'first'): void {
    if (a <= 0) return;
    withAlpha(c, a, () => {
      wash(c, circlePts(x, y, BEAD, 20), col, { seed: Math.round(x * 7 + y), rough: 0.6, ink: null, shade: 0.2 });
      inkLine(c, circlePts(x, y, BEAD, 20), { col: DUSK.ink, w: 3, closed: true, seed: Math.round(x + y), rough: 0.4 });
    });
  }

  function draw(c: Canvas, f: ScatterFocus = {}): void {
    const kA = clamp(f.axes ?? 1);
    const g = c.g;
    // the plot card, grid, axes, labels
    if (kA > 0) withAlpha(c, kA, () => {
      wash(c, rectPts(plot.x0 - 14, plot.y0 - 14, plot.w + 28, plot.h + 28, 12), '#1A1E42', { seed: 51, ink: null, rough: 1.0, shade: 0.12 });
      for (let i = 0; i <= nx; i++) { const x = X(p.x0 + i * p.xStep); strokePts(c, [[x, plot.y0], [x, plot.y1]], { col: '#363B66', lw: 2, cap: 'butt' }); }
      for (let i = 0; i <= ny; i++) { const y = Y(p.y0 + i * p.yStep); strokePts(c, [[plot.x0, y], [plot.x1, y]], { col: '#363B66', lw: 2, cap: 'butt' }); }
      strokePts(c, [[plot.x0, plot.y1], [plot.x1 + 8, plot.y1]], { col: DUSK.cream, lw: 4 });
      strokePts(c, [[plot.x0, plot.y1], [plot.x0, plot.y0 - 8]], { col: DUSK.cream, lw: 4 });
      // a break on an axis that does not start at 0
      if (p.x0 > EPS) { const x = plot.x0 + 22, y = plot.y1; g.save(); g.fillStyle = '#1A1E42'; g.fillRect(x - 10, y - 6, 20, 12); g.restore(); strokePts(c, [[x - 10, y + 10], [x - 3, y - 10]], { col: DUSK.cream, lw: 3.5 }); strokePts(c, [[x + 3, y + 10], [x + 10, y - 10]], { col: DUSK.cream, lw: 3.5 }); }
      if (p.y0 > EPS) { const x = plot.x0, y = plot.y1 - 22; g.save(); g.fillStyle = '#1A1E42'; g.fillRect(x - 6, y - 10, 12, 20); g.restore(); strokePts(c, [[x - 10, y + 10], [x + 10, y + 3]], { col: DUSK.cream, lw: 3.5 }); strokePts(c, [[x - 10, y - 3], [x + 10, y - 10]], { col: DUSK.cream, lw: 3.5 }); }
      for (const t of ticks) drawWords(c, t.t, t.x, t.y, 'dim', 1, { size: NUM, align: t.align, weight: 500 });
      const pn = clamp(f.names ?? 0);
      drawWords(c, p.xName, plot.x1, plot.y1 + 116, pn > 0 ? 'pick' : 'ink', 1, { size: NAMEW, align: 'right' });
      drawWords(c, p.yName, plot.x0 - 10, plot.y0 - 46, pn > 0 ? 'pick' : 'ink', 1, { size: NAMEW, align: 'left' });
    });
    // the observed x-range
    const kB = clamp(f.band ?? 0);
    if (kB > 0 && p.band) withAlpha(c, kB, () => {
      const a = X(p.band![0]), b = X(p.band![1]);
      g.save(); g.fillStyle = 'rgba(174,147,238,0.16)'; g.fillRect(a, plot.y0, b - a, plot.h); g.restore();
      strokePts(c, [[a, plot.y0], [a, plot.y1]], { col: 'pick', lw: 3, dash: [10, 8], cap: 'butt' });
      strokePts(c, [[b, plot.y0], [b, plot.y1]], { col: 'pick', lw: 3, dash: [10, 8], cap: 'butt' });
    });
    // a straight edge, under the dots
    const kR = clamp(f.ruler ?? 0);
    if (kR > 0 && p.ruler) {
      const s = seg({ m: p.ruler.m, b: p.ruler.b });
      if (s) withAlpha(c, kR * 0.85, () => {
        const [A, B] = s, dx = B[0] - A[0], dy = B[1] - A[1], l = Math.hypot(dx, dy) || 1, nx2 = -dy / l, ny2 = dx / l, w = 34;
        const P: Pt[] = [[A[0] + nx2 * 4, A[1] + ny2 * 4], [B[0] + nx2 * 4, B[1] + ny2 * 4], [B[0] + nx2 * w, B[1] + ny2 * w], [A[0] + nx2 * w, A[1] + ny2 * w]];
        wash(c, P, '#C9A86A', { seed: 33, rough: 0.8, alpha: 0.45, ink: DUSK.ink, inkW: 2.5, shade: 0.1 });
        for (let i = 1; i < 16; i++) { const t = i / 16, x = A[0] + dx * t, y = A[1] + dy * t, L2 = i % 4 === 0 ? 16 : 9; strokePts(c, [[x + nx2 * 4, y + ny2 * 4], [x + nx2 * (4 + L2), y + ny2 * (4 + L2)]], { col: DUSK.ink, lw: 2, alpha: 0.7 }); }
        strokePts(c, [A, B], { col: '#F2DCA6', lw: 3 });
      });
    }
    // sticks: how far each dot is from a line
    if (f.sticks && f.sticks.k > 0 && p.lines?.[f.sticks.line]) {
      const L = p.lines[f.sticks.line]!;
      p.pts.forEach(q => { const [x, y] = at(q.x, q.y), y2 = Y(lineY(L, q.x)); if (Math.abs(y2 - y) > 4 && y2 >= plot.y0 && y2 <= plot.y1) strokePts(c, [[x, y], [x, y + (y2 - y) * clamp(f.sticks!.k)]], { col: 'pick', lw: 3.5 }); });
    }
    // the (wrong) join
    const kJ = clamp(f.join ?? 0);
    if (kJ > 0) {
      const P = p.pts.slice().sort((a, b) => a.x - b.x || a.y - b.y).map(q => at(q.x, q.y));
      drawOn(c, P, kJ, { col: 'wrong', lw: 4 });
    }
    // trend lines
    (p.lines ?? []).forEach((L, i) => {
      const s = segs[i], k = clamp(f.lines?.[i] ?? 1);
      if (!s || k <= 0) return;
      const col = f.lineCol?.[i] ?? ROLE_OF[L.col ?? 'link']!;
      const a = 1 - 0.7 * clamp(f.lineDim?.[i] ?? 0);
      withAlpha(c, a, () => {
        drawOn(c, [s[0], s[1]], k, { col, lw: 5, dash: L.dash ? [16, 12] : null, cap: L.dash ? 'butt' : 'round' });
        if (L.tag && k > 0.95) {
          const e = s[1], tx = Math.min(e[0] + 14, plot.x1 - 30), ty = e[1] < plot.y0 + 50 ? e[1] + 40 : e[1] - 34;
          drawWords(c, L.tag, tx, ty, col, (k - 0.95) / 0.05, { size: TAG, align: 'left', weight: 700 });
        }
      });
    });
    // direction arrow beside the first line
    const kW = clamp(f.arrow ?? 0);
    if (kW > 0 && segs[0]) {
      const [A, B] = segs[0], dx = B[0] - A[0], dy = B[1] - A[1], l = Math.hypot(dx, dy) || 1;
      let nx2 = -dy / l, ny2 = dx / l; if (ny2 > 0) { nx2 = -nx2; ny2 = -ny2; }
      const off = 70, s0: Pt = [A[0] + dx * 0.12 + nx2 * off, A[1] + dy * 0.12 + ny2 * off], s1: Pt = [A[0] + dx * 0.8 + nx2 * off, A[1] + dy * 0.8 + ny2 * off];
      arrow(c, [s0, s1], kW, { col: 'pick', lw: 6, head: 28, glow: 8 });
    }
    // candidate spots
    const kM = clamp(f.marks ?? 0);
    if (kM > 0) for (const m of p.marks ?? []) {
      const [x, y] = at(m.x, m.y), col = f.markCol?.[m.tag] ?? 'pick';
      withAlpha(c, kM, () => {
        strokePts(c, circlePts(x, y, 20, 40), { col, lw: 3.5, closed: true, dash: [7, 6] });
        drawWords(c, m.tag, x + 26, y - 30, col, 1, { size: TAG, align: 'left', weight: 700 });
      });
    }
    // the dots
    const shown = f.shown ?? p.pts.length, dimK = clamp(f.dim ?? 0);
    p.pts.forEach((q, i) => {
      const a = clamp(shown - i);
      if (a <= 0) return;
      const lit = f.lit?.includes(i) ?? false, alpha = a * (lit ? 1 : 1 - 0.7 * dimK);
      const [x, y] = at(q.x, q.y);
      bead(c, x, y - (1 - a) * 30, alpha);
      if ((q.n ?? 1) > 1) drawWords(c, `×${q.n}`, x + 22, y + 2, 'first', alpha, { size: NAMEW, align: 'left', weight: 700 });
      if (q.tag) drawWords(c, q.tag, x + 20, y - 32, 'ink', alpha * clamp(f.tags ?? 1), { size: TAG, align: 'left', weight: 700 });
    });
    // the dot being plotted: guides from both axes
    if (f.cur && f.cur.k > 0 && p.pts[f.cur.i]) {
      const q = p.pts[f.cur.i]!, [x, y] = at(q.x, q.y), k = clamp(f.cur.k);
      strokePts(c, [[x, plot.y1], [x, plot.y1 + (y - plot.y1) * Math.min(1, k * 2)]], { col: 'pick', lw: 3, dash: [9, 7], cap: 'butt' });
      if (k > 0.5) strokePts(c, [[plot.x0, y], [plot.x0 + (x - plot.x0) * Math.min(1, (k - 0.5) * 2), y]], { col: 'pick', lw: 3, dash: [9, 7], cap: 'butt' });
      ring(c, x, y, 24, 'pick', k);
    }
    // rings
    for (const r of f.rings ?? []) { const q = p.pts[r.i]; if (!q) continue; const [x, y] = at(q.x, q.y); ring(c, x, y, 26, r.col, r.k); }
    // clusters
    const kG = clamp(f.groups ?? 0);
    if (kG > 0) (p.groups ?? []).forEach((G, gi) => {
      const P = G.map(i => at(p.pts[i]!.x, p.pts[i]!.y));
      const x0 = Math.min(...P.map(q => q[0])) - 34, x1 = Math.max(...P.map(q => q[0])) + 34, y0 = Math.min(...P.map(q => q[1])) - 34, y1 = Math.max(...P.map(q => q[1])) + 34;
      const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, rx = (x1 - x0) / 2 * 1.12, ry = (y1 - y0) / 2 * 1.12;
      const E: Pt[] = Array.from({ length: 64 }, (_, j) => { const t = (j / 64) * Math.PI * 2; return [cx + rx * Math.cos(t), cy + ry * Math.sin(t)]; });
      drawOn(c, E, kG, { col: gi % 2 ? 'second' : 'pick', lw: 4, closed: true, dash: [12, 8] });
    });
    // a slope triangle: run along, rise up, numbers outside the legs (never on a line)
    if (f.tri && f.tri.k > 0) {
      const T = f.tri, A = at(T.x1, T.y1), Bq = at(T.x2, T.y1), C = at(T.x2, T.y2), k = clamp(T.k);
      drawOn(c, [A, Bq, C], k, { col: 'pick', lw: 4, dash: [12, 8], cap: 'butt' });
      if (k > 0.45) drawWords(c, T.run, (A[0] + Bq[0]) / 2, A[1] + 44, 'pick', (k - 0.45) / 0.3, { size: NUM, align: 'center' });
      if (k > 0.8) drawWords(c, T.rise, Bq[0] + 20, (Bq[1] + C[1]) / 2, 'pick', (k - 0.8) / 0.2, { size: NUM, align: 'left' });
    }
    // a prediction guide: up from x to the line, across to the y axis
    if (f.guide && f.guide.k > 0 && p.lines?.[f.guide.line]) {
      const L = p.lines[f.guide.line]!, gx = X(f.guide.x), gy = Y(lineY(L, f.guide.x)), k = clamp(f.guide.k), col = f.guide.col ?? 'link';
      const k1 = Math.min(1, k * 2), k2 = Math.max(0, k * 2 - 1);
      strokePts(c, [[gx, plot.y1], [gx, plot.y1 + (gy - plot.y1) * k1]], { col, lw: 3.5, dash: [10, 7], cap: 'butt' });
      if (k2 > 0) strokePts(c, [[gx, gy], [gx + (plot.x0 - gx) * k2, gy]], { col, lw: 3.5, dash: [10, 7], cap: 'butt' });
      if (k1 >= 1) { ring(c, gx, gy, 16, col, Math.min(1, k2 * 3 + 0.3), 4); }
      // where the guide meets the y-axis: the predicted value, ringed on the axis
      if (k2 >= 1) ring(c, plot.x0, gy, 15, col, 1, 4);
    }
  }
  return { kind: 'Scatter', spec: p, box: all, where: { at, plot, pt: ptBox, guideHit, yAxisAt, xName: xNameB, yName: yNameB, mark: markBox }, draw };
}
