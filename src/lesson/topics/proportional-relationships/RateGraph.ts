// RateGraph: a proportional relationship as a first-quadrant graph, the model of y = kx.
//   axes    crisp axes and grid, tick labels on whole grid lines, the two quantity names (x amber, y teal)
//   pt:<id> a data point (a painted bead) with its coordinate label "(6, 15)" placed beside it, never on a line
//   ray:<id> the ray from (0, 0) through a point: points with the same y/x share ONE ray, a point with another y/x
//           gets its own ray (the picture of "one fixed multiplier")
//   line:<id> y = kx + b (or y = kx² for a curve), drawn as a ray, a segment, separate points, or a full line
//   unit    the unit rate: from (0, 0) one unit across (amber) and k up (teal) to the point (1, k), labelled
//   origin  a ring at (0, 0) and its label "(0, 0)"
//   mark    one marked point (practice: "read this point"), lavender
// Everything is in design px inside a Frame; labels are plain sans words (numbers >= 60 px, names >= 44 px) placed
// by a search that refuses any spot touching a line, a bead or another label (BlockError when nothing fits).
// Pure: computeGraph() holds the maths (exact quotients via rateMaths), RateGraph() lays out and draws.
import { type Box, type Pt, box, clamp, lerp, boxesOverlap, padBox } from '../../../core/math';
import { type Canvas, drawOn, dot, strokePts, withAlpha, arrow } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Progress } from '../../../core/clock';
import { type Role, type Theme, paint, rgba } from '../../../core/theme';
import { type Frame, check, hitsLines } from '../../../blocks/block';
import { circlePts, rectPts } from '../../../core/pts';
import { drawWords, wordsBox } from '../../words';
import { wash, inkLine } from '../../wash';
import { DUSK } from '../../dusk';
import { type Q } from '../../../core/math';
import { fmt, quotient, qSame, hundredths } from './rateMaths';

const NAME = 'RateGraph';

export interface GraphPt { x: number; y: number; id: string; role?: Role; label?: boolean }
export interface GraphLine {
  id: string; k: number; b?: number;
  /** 'line' y = kx + b (default) or 'square' y = kx² (a curve through the origin) */
  kind?: 'line' | 'square';
  /** the allowed inputs: from..to (default 0..the edge) */
  from?: number; to?: number;
  /** how the allowed part is drawn: ray (arrow at the far end), segment (closed ends), points (whole inputs only), plain */
  ends?: 'ray' | 'segment' | 'points' | 'plain';
  role?: Role;
  /** (0, 0) is on the line but not allowed: a hollow ring at the origin */
  hollow0?: boolean;
  /** a short name drawn at the far end of the line (A, B) */
  name?: string;
}
export interface RateGraphParams {
  xMax: number; yMax: number; xStep: number; yStep: number;
  /** quantity names with units: 'pounds', 'dollars' */
  xName: string; yName: string;
  points?: readonly GraphPt[];
  lines?: readonly GraphLine[];
  /** a line id: show (1, k) with its step triangle */
  unit?: string;
  /** words for the unit legs: ['1 lb', '$2.50'] */
  unitWords?: [string, string];
  /** a marked point to read (practice) */
  mark?: { x: number; y: number; label?: boolean };
}

export interface GraphMaths {
  /** y/x per point (null at x = 0) and whether every nonzero-input point shares one quotient */
  q: Record<string, Q | null>;
  oneRay: boolean;
  /** for each line: does it pass through (0, 0)? is it straight? */
  lineFacts: Record<string, { origin: boolean; straight: boolean; proportional: boolean }>;
}
export function computeGraph(p: RateGraphParams): GraphMaths {
  check(p.xMax > 0 && p.yMax > 0 && p.xStep > 0 && p.yStep > 0, NAME, 'axes need positive sizes and steps');
  check(Math.abs(p.xMax / p.xStep - Math.round(p.xMax / p.xStep)) < 1e-9 && Math.abs(p.yMax / p.yStep - Math.round(p.yMax / p.yStep)) < 1e-9, NAME, 'axis ends must sit on a grid line');
  check(p.xMax / p.xStep <= 16 && p.yMax / p.yStep <= 16, NAME, 'too many grid lines to read');
  const q: Record<string, Q | null> = {};
  for (const pt of p.points ?? []) {
    check(pt.x >= 0 && pt.y >= 0 && pt.x <= p.xMax && pt.y <= p.yMax, NAME, `point (${pt.x}, ${pt.y}) is off the axes`);
    q[pt.id] = quotient(pt.x, pt.y);
  }
  const qs = Object.values(q).filter((v): v is Q => v !== null);
  const oneRay = qs.length > 0 && qs.every(v => qSame(v, qs[0]!));
  const lineFacts: GraphMaths['lineFacts'] = {};
  for (const L of p.lines ?? []) {
    const b = L.b ?? 0, sq = L.kind === 'square';
    const origin = hundredths(b) === 0;
    lineFacts[L.id] = { origin, straight: !sq, proportional: origin && !sq && L.k > 0 };
  }
  if (p.unit) {
    const L = (p.lines ?? []).find(l => l.id === p.unit);
    check(L && (L.kind ?? 'line') === 'line' && !(L.b), NAME, `unit: no proportional line "${p.unit}"`);
    check(L.k <= p.yMax, NAME, 'the unit point (1, k) is above the axes');
    check(p.xMax >= 1, NAME, 'the unit point (1, k) is right of the axes');
  }
  if (p.mark) check(p.mark.x >= 0 && p.mark.y >= 0 && p.mark.x <= p.xMax && p.mark.y <= p.yMax, NAME, 'the marked point is off the axes');
  return { q, oneRay, lineFacts };
}

export interface GraphFocus {
  /** points in focus (a glowing ring) */ pts?: readonly string[]; ptK?: number; ptCol?: Role;
  /** dim everything but the focused points (0..1) */ dim?: number;
  /** pulse on the axis names */ xName?: number; yName?: number;
  /** points shown as breaking the pattern (bead, ray and label turn red), e.g. in a worked solution */ wrong?: readonly string[];
}
export interface RateGraphBlock {
  readonly kind: 'RateGraph';
  readonly maths: GraphMaths;
  readonly box: Box;
  readonly where: {
    plot: Box; origin: Box; point(id: string): Box; label(id: string): Box | null; lineEnd(id: string): Box;
    unit: Box | null; mark: Box | null; xName: Box; yName: Box;
    /** design px of a graph point */ at(x: number, y: number): Pt;
  };
  draw(c: Canvas, p: Progress<string>, f?: GraphFocus): void;
}

const NUM = 60, WORD = 46, BEAD = 15;
const measure = (text: string, size: number): { w: number } => {
  if (typeof document === 'undefined') return { w: text.length * size * 0.56 };
  const b = wordsBox(text, 0, 0, { size }); return { w: b.w };
};
const bxAt = (text: string, x: number, y: number, size: number, align: 'left' | 'center' | 'right'): Box => {
  const w = measure(text, size).w, x0 = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
  return box(x0, y - size * 0.42, x0 + w, y + size * 0.42);
};

export function RateGraph(p: RateGraphParams, fr: Frame, th: Theme): RateGraphBlock {
  const m = computeGraph(p);
  const xs = Math.round(p.xMax / p.xStep), ys = Math.round(p.yMax / p.yStep);
  // y tick labels decide the left margin
  const yLabW = Math.max(...Array.from({ length: ys + 1 }, (_, i) => measure(fmt(i * p.yStep), NUM).w));
  const plot = box(fr.x + yLabW + 40, fr.y + 96, fr.x + fr.w - 44, fr.y + fr.h - 150);
  check(plot.w > 300 && plot.h > 300, NAME, 'the frame is too small for a readable graph');
  const sx = plot.w / p.xMax, sy = plot.h / p.yMax;
  const X = (v: number) => plot.x0 + v * sx, Y = (v: number) => plot.y1 - v * sy;
  const at = (x: number, y: number): Pt => [X(x), Y(y)];

  // tick label strides: whole grid lines, far enough apart to read
  const xLabMax = Math.max(...Array.from({ length: xs + 1 }, (_, i) => measure(fmt(i * p.xStep), NUM).w));
  let xStride = 1; while (xStride * p.xStep * sx < xLabMax + 30) xStride++;
  let yStride = 1; while (yStride * p.yStep * sy < NUM + 16) yStride++;
  interface Lab { text: string; x: number; y: number; size: number; align: 'left' | 'center' | 'right'; box: Box; col: Role }
  const ticks: Lab[] = [];
  for (let i = xStride; i <= xs; i += xStride) { const v = i * p.xStep, t = fmt(v); ticks.push({ text: t, x: X(v), y: plot.y1 + 50, size: NUM, align: 'center', box: bxAt(t, X(v), plot.y1 + 50, NUM, 'center'), col: 'dim' }); }
  for (let i = yStride; i <= ys; i += yStride) { const v = i * p.yStep, t = fmt(v); ticks.push({ text: t, x: plot.x0 - 22, y: Y(v), size: NUM, align: 'right', box: bxAt(t, plot.x0 - 22, Y(v), NUM, 'right'), col: 'dim' }); }
  ticks.push({ text: '0', x: plot.x0 - 22, y: plot.y1 + 50, size: NUM, align: 'right', box: bxAt('0', plot.x0 - 22, plot.y1 + 50, NUM, 'right'), col: 'dim' });
  const xNameL: Lab = { text: p.xName, x: plot.x1, y: plot.y1 + 116, size: WORD, align: 'right', box: bxAt(p.xName, plot.x1, plot.y1 + 116, WORD, 'right'), col: 'first' };
  const yNameL: Lab = { text: p.yName, x: plot.x0 + 26, y: plot.y0 - 52, size: WORD, align: 'left', box: bxAt(p.yName, plot.x0 + 26, plot.y0 - 52, WORD, 'left'), col: 'second' };
  check(xNameL.box.x0 > fr.x, NAME, `the axis name "${p.xName}" is too long`);
  check(yNameL.box.x1 < fr.x + fr.w + 10, NAME, `the axis name "${p.yName}" is too long`);
  for (const t of ticks) if (t.align === 'center' && boxesOverlap(padBox(t.box, 6), xNameL.box)) {
    // the last x tick label would touch the name: the name moves under the axis end, the ticks stay
    check(false, NAME, 'the x axis name collides with a tick label');
  }

  // ---- lines: polylines in px ----
  const linePts = new Map<string, Pt[]>();
  for (const L of p.lines ?? []) {
    const b = L.b ?? 0, f = (x: number) => (L.kind === 'square' ? L.k * x * x : L.k * x + b);
    const a0 = L.from ?? 0, a1 = L.to ?? p.xMax, P: Pt[] = [];
    const n = L.kind === 'square' ? 80 : 40;
    for (let i = 0; i <= n; i++) {
      const x = lerp(a0, a1, i / n), y = f(x);
      if (y < -1e-9 || y > p.yMax + 1e-9) continue;
      P.push(at(x, y));
    }
    // clip the far end exactly at the top edge for a ray that leaves the plot
    if (L.kind !== 'square' && L.k > 0 && f(a1) > p.yMax) { const xe = (p.yMax - b) / L.k; if (xe > a0) P.push(at(xe, p.yMax)); }
    if (L.kind !== 'square' && L.k < 0 && f(a1) < 0) { const xe = -b / L.k; P.push(at(xe, 0)); }
    P.sort((u, v) => u[0] - v[0]);
    check(P.length >= 2, NAME, `line ${L.id} is not inside the axes`);
    linePts.set(L.id, P);
  }
  // rays from the origin through each nonzero point, to the plot edge
  const rayPts = new Map<string, Pt[]>();
  for (const pt of p.points ?? []) {
    if (pt.x === 0 && pt.y === 0) continue;
    const t = Math.min(pt.x > 0 ? p.xMax / pt.x : Infinity, pt.y > 0 ? p.yMax / pt.y : Infinity);
    rayPts.set(pt.id, [at(0, 0), at(pt.x * t, pt.y * t)]);
  }
  // unit triangle
  const uL = p.unit ? (p.lines ?? []).find(l => l.id === p.unit)! : null;
  const unitLegs: Pt[][] = uL ? [[at(0, 0), at(1, 0)], [at(1, 0), at(1, uL.k)]] : [];
  const axisLines: Pt[][] = [[[plot.x0, plot.y1], [plot.x1 + 22, plot.y1]], [[plot.x0, plot.y1], [plot.x0, plot.y0 - 26]]];
  const allLines: Pt[][] = [...axisLines, ...linePts.values(), ...rayPts.values(), ...unitLegs];

  // ---- labels beside points: a search over spots around the anchor ----
  const placed: Box[] = [...ticks.map(t => t.box), xNameL.box, yNameL.box];
  const beads: Box[] = (p.points ?? []).map(pt => { const [x, y] = at(pt.x, pt.y); return box(x - BEAD, y - BEAD, x + BEAD, y + BEAD); });
  const inner = box(fr.x, fr.y, fr.x + fr.w + 30, fr.y + fr.h);
  function place(text: string, ax: number, ay: number, size: number, spots: readonly [number, number][], what: string): Lab {
    const w = measure(text, size).w, h = size * 0.84;
    for (const [dx, dy] of spots) {
      const cx = ax + dx * (w / 2 + 26), cy = ay + dy * (h / 2 + 22);
      const B = box(cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2);
      if (B.x0 < inner.x0 || B.x1 > inner.x1 || B.y0 < inner.y0 || B.y1 > inner.y1) continue;
      if (hitsLines(B, allLines, 8)) continue;
      if (placed.some(o => boxesOverlap(padBox(B, 8), o)) || beads.some(o => boxesOverlap(padBox(B, 6), o))) continue;
      placed.push(B);
      return { text, x: cx, y: cy, size, align: 'center', box: B, col: 'ink' };
    }
    check(false, NAME, `no clear spot for the label ${what}`);
  }
  const SPOTS: [number, number][] = [[1, 1], [-1, -1], [1.1, 0], [0, 1.25], [-1.1, 0], [1, -1], [-1, 1], [0, -1.25], [1.6, 0.6], [1.6, 1.5], [0, 2.2],
    [1, 2.2], [-1, -2.2], [2, 1], [-2, -1], [0, 3.2], [1.4, 3], [-1.4, -3]];
  // line names at the far end (A, B)
  const nameLabs = new Map<string, Lab>();
  for (const L of p.lines ?? []) if (L.name) {
    const e = linePts.get(L.id)!.at(-1)!;
    nameLabs.set(L.id, { ...place(L.name, e[0], e[1], NUM, [[-1, -0.6], [-1.2, 0.5], [1, 0], [-1, 1], [1, -1], [1, 1], [-2, -1], [-2, 1], [-1, -1.8]], `line ${L.name}`), col: L.role ?? 'link' });
  }
  const ptLabels = new Map<string, Lab>();
  for (const pt of p.points ?? []) if (pt.label) ptLabels.set(pt.id, place(`(${fmt(pt.x)}, ${fmt(pt.y)})`, X(pt.x), Y(pt.y), NUM, SPOTS, `(${pt.x}, ${pt.y})`));
  let unitLabs: Lab[] = [];
  let unitBox: Box | null = null;
  if (uL) {
    const [w1, w2] = p.unitWords ?? ['1', fmt(uL.k)];
    // "1 lb" sits under the x axis below its leg; the tick labels it would touch give way (it names that step itself)
    const w1w = measure(w1, WORD).w;
    const c1 = Math.max(X(0.5), plot.x0 + 16 + w1w / 2);
    const B1 = box(c1 - w1w / 2, plot.y1 + 50 - WORD * 0.42, c1 + w1w / 2, plot.y1 + 50 + WORD * 0.42);
    for (let i = ticks.length - 1; i >= 0; i--) {
      const t = ticks[i]!;
      if (t.text !== '0' && boxesOverlap(padBox(B1, 26), t.box)) { ticks.splice(i, 1); placed.splice(placed.indexOf(t.box), 1); }
    }
    placed.push(B1);
    const l1: Lab = { text: w1, x: c1, y: plot.y1 + 50, size: WORD, align: 'center', box: B1, col: 'first' };
    const l2 = place(w2, X(1), Y(uL.k / 2), WORD, [[1, 0], [1, 0.6], [1, -0.6], [1.6, 0], [1.6, -0.9], [2.4, -0.9], [3.2, -0.9], [2.4, -1.6], [3.2, -1.6]], w2);
    unitLabs = [{ ...l1, col: 'first' }, { ...l2, col: 'second' }];
    const [ux, uy] = at(1, uL.k);
    unitBox = box(ux - 20, uy - 20, ux + 20, uy + 20);
  }
  const origin = box(plot.x0 - 20, plot.y1 - 20, plot.x0 + 20, plot.y1 + 20);
  // the "(0, 0)" label: inside the plot, above the axis, right of the y axis (never on a line)
  let originLab: Lab | null = null;
  const hasOrigin = (p.lines ?? []).length > 0 || (p.points ?? []).length > 0;
  if (hasOrigin) {
    const tries: [number, number][] = [[1.15, -1.2], [1.15, -2.4], [1.15, -3.6], [2.4, -1.2], [2.4, -2.4]];
    const w = measure('(0, 0)', NUM).w;
    for (const [dx, dy] of tries) {
      const cx = plot.x0 + dx * (w / 2 + 10), cy = plot.y1 + dy * (NUM * 0.5);
      const B = box(cx - w / 2, cy - NUM * 0.42, cx + w / 2, cy + NUM * 0.42);
      if (hitsLines(B, allLines, 8) || placed.some(o => boxesOverlap(padBox(B, 8), o)) || beads.some(o => boxesOverlap(padBox(B, 6), o))) continue;
      originLab = { text: '(0, 0)', x: cx, y: cy, size: NUM, align: 'center', box: B, col: 'ink' }; break;
    }
  }
  let markBox: Box | null = null, markLab: Lab | null = null;
  if (p.mark) {
    const [mx, my] = at(p.mark.x, p.mark.y);
    markBox = box(mx - 20, my - 20, mx + 20, my + 20);
    beads.push(box(mx - BEAD, my - BEAD, mx + BEAD, my + BEAD));
    if (p.mark.label) markLab = place(`(${fmt(p.mark.x)}, ${fmt(p.mark.y)})`, mx, my, NUM, SPOTS, 'the marked point');
  }
  const lineEnd = (id: string): Box => { const P = linePts.get(id) ?? rayPts.get(id); check(P, NAME, `no line ${id}`); const e = P[P.length - 1]!; return box(e[0] - 16, e[1] - 16, e[0] + 16, e[1] + 16); };

  // ---------- painters ----------
  function plate(c: Canvas, B: Box, a: number): void {
    const { g } = c;
    g.save(); g.globalAlpha *= a * 0.88; g.fillStyle = '#161A36';
    g.beginPath(); g.roundRect(B.x0 - 10, B.y0 - 6, B.w + 20, B.h + 12, 10); g.fill(); g.restore();
  }
  function lab(c: Canvas, L: Lab, k: number, col?: Role, bg = false): void {
    if (k <= 0) return;
    if (bg) plate(c, L.box, clamp(k));
    drawWords(c, L.text, L.align === 'center' ? L.box.cx : L.x, L.y, col ?? L.col, k, { size: L.size, align: L.align === 'center' ? 'center' : L.align });
  }
  function ring(c: Canvas, x: number, y: number, r: number, col: Role, k: number): void {
    if (k <= 0) return;
    const { g } = c;
    g.save(); g.globalAlpha *= clamp(k);
    g.strokeStyle = paint(th, col, 'fill'); g.lineWidth = 5;
    g.shadowColor = paint(th, col, 'fill'); g.shadowBlur = 12 * th.glow * Math.hypot(g.getTransform().a, g.getTransform().b);
    g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.stroke(); g.restore();
  }
  function bead(c: Canvas, x: number, y: number, col: Role | string, k: number, seed: number): void {
    if (k <= 0) return;
    const r = BEAD * E.back(clamp(k));
    if (r <= 0.5) return;
    wash(c, circlePts(x, y, r, 28), col as Role, { seed, rough: 0.9, ink: DUSK.ink, inkW: 3, shade: 0.25 });
  }
  function pulse(c: Canvas, B: Box, col: Role, k: number): void {
    if (k <= 0) return;
    const { g } = c;
    g.save(); g.globalAlpha *= clamp(k) * 0.22; g.fillStyle = paint(th, col, 'fill');
    g.beginPath(); g.roundRect(B.x0 - 14, B.y0 - 10, B.w + 28, B.h + 20, 14); g.fill(); g.restore();
  }

  function draw(c: Canvas, P: Progress<string>, f: GraphFocus = {}): void {
    const kA = P.k('axes');
    const dim = clamp(f.dim ?? 0);
    if (kA > 0) {
      const a = E.smooth(clamp(kA));
      // grid: crisp and quiet
      withAlpha(c, a, () => {
        const { g } = c;
        g.save(); g.strokeStyle = rgba('#8A8EB8', 0.22); g.lineWidth = 1.6;
        for (let i = 1; i <= xs; i++) { const x = X(i * p.xStep); g.beginPath(); g.moveTo(x, plot.y1); g.lineTo(x, plot.y0); g.stroke(); }
        for (let i = 1; i <= ys; i++) { const y = Y(i * p.yStep); g.beginPath(); g.moveTo(plot.x0, y); g.lineTo(plot.x1, y); g.stroke(); }
        g.restore();
      });
      arrow(c, axisLines[0]!, a, { col: 'dim', lw: 4, head: 16 });
      arrow(c, axisLines[1]!, a, { col: 'dim', lw: 4, head: 16 });
      for (const t of ticks) lab(c, t, a);
      pulse(c, xNameL.box, 'first', f.xName ?? 0); pulse(c, yNameL.box, 'second', f.yName ?? 0);
      lab(c, xNameL, a); lab(c, yNameL, a);
    }
    // rays (dashed, under the lines)
    for (const pt of p.points ?? []) {
      const R = rayPts.get(pt.id), kr = P.k('ray:' + pt.id);
      if (!R || kr <= 0) continue;
      const qOk = m.q[pt.id] && p.points!.length > 0;
      void qOk;
      drawOn(c, R, E.inOut(clamp(kr)), { col: pt.role === 'wrong' || f.wrong?.includes(pt.id) ? 'wrong' : 'link', lw: 3.5, dash: [14, 10], alpha: 0.9 * (1 - dim * 0.5) });
    }
    // lines
    for (const L of p.lines ?? []) {
      const kl = P.k('line:' + L.id);
      if (kl <= 0) continue;
      const Pl = linePts.get(L.id)!, col = L.role ?? 'link', ends = L.ends ?? 'plain';
      const ke = E.inOut(clamp(kl));
      if (ends === 'points') {
        const a0 = Math.ceil((L.from ?? 0) - 1e-9), a1 = Math.floor((L.to ?? p.xMax) + 1e-9);
        drawOn(c, Pl, ke, { col, lw: 2.5, dash: [6, 12], alpha: 0.45 });
        for (let x = a0; x <= a1; x++) {
          const y = L.k * x + (L.b ?? 0); if (y > p.yMax + 1e-9 || y < 0) continue;
          const [px, py] = at(x, y);
          const kk = clamp(kl * 1.4 - ((x - a0) / Math.max(1, a1 - a0)) * 0.4);
          if (x === 0 && L.hollow0) continue;
          dot(c, px, py, 11 * E.back(kk), col);
        }
      } else if (ends === 'ray' && Pl.length >= 2) {
        arrow(c, Pl, ke, { col, lw: 5.5, head: 22 });
      } else {
        drawOn(c, Pl, ke, { col, lw: 5.5 });
        if (ends === 'segment' && kl > 0.95) for (const e of [Pl[0]!, Pl[Pl.length - 1]!]) dot(c, e[0], e[1], 11, col, (kl - 0.95) / 0.05);
      }
      if (L.hollow0 && kl > 0.3) {
        const [ox, oy] = at(0, 0);
        c.g.save(); c.g.globalAlpha *= clamp((kl - 0.3) / 0.3); c.g.fillStyle = '#20244A'; c.g.beginPath(); c.g.arc(ox, oy, 12, 0, Math.PI * 2); c.g.fill();
        c.g.strokeStyle = paint(th, col, 'fill'); c.g.lineWidth = 4; c.g.stroke(); c.g.restore();
      }
      const nl = nameLabs.get(L.id);
      if (nl) lab(c, nl, clamp((kl - 0.6) / 0.4), undefined, true);
    }
    // unit triangle
    const ku = P.k('unit');
    if (uL && ku > 0) {
      drawOn(c, unitLegs[0]!, E.inOut(clamp(ku * 2)), { col: 'first', lw: 7 });
      drawOn(c, unitLegs[1]!, E.inOut(clamp(ku * 2 - 1)), { col: 'second', lw: 7 });
      const [ux, uy] = at(1, uL.k);
      ring(c, ux, uy, 19, 'link', clamp(ku * 2 - 1));
      dot(c, ux, uy, 8, 'link', clamp(ku * 2 - 1));
      lab(c, unitLabs[0]!, clamp(ku * 2), undefined, true);
      const L2 = unitLabs[1]!, legX = X(1), legY = Y(uL.k / 2);
      if (L2.box.x0 - legX > 44) drawOn(c, [[L2.box.x0 - 12, L2.box.cy], [legX + 8, legY]], clamp(ku * 2 - 1), { col: 'second', lw: 2.5, alpha: 0.85 });
      lab(c, L2, clamp(ku * 2 - 1), undefined, true);
    }
    // points
    (p.points ?? []).forEach((pt, i) => {
      const kp = P.k('pt:' + pt.id);
      if (kp <= 0) return;
      const [x, y] = at(pt.x, pt.y);
      const focused = f.pts?.includes(pt.id);
      const a = focused ? 1 : 1 - dim * 0.6;
      const bad = pt.role === 'wrong' || !!f.wrong?.includes(pt.id);
      withAlpha(c, a, () => bead(c, x, y, bad ? 'wrong' : pt.role ?? 'ink', kp, 700 + i * 13));
      if (focused) ring(c, x, y, 25, f.ptCol ?? 'pick', f.ptK ?? 1);
      const L = ptLabels.get(pt.id);
      if (L) withAlpha(c, a, () => lab(c, L, clamp((kp - 0.3) / 0.7), bad ? 'wrong' : focused ? (f.ptCol ?? 'pick') : 'ink', true));
    });
    // origin
    const ko = P.k('origin');
    if (ko > 0) {
      ring(c, plot.x0, plot.y1, 22, 'link', ko);
      if (originLab) lab(c, originLab, ko, 'link', true);
    }
    // the marked point
    const km = P.k('mark');
    if (p.mark && km > 0) {
      const [mx, my] = at(p.mark.x, p.mark.y);
      bead(c, mx, my, 'pick', km, 991);
      ring(c, mx, my, 25, 'pick', km);
      if (markLab) lab(c, markLab, km, 'pick', true);
    }
  }
  void inkLine; void rectPts; void strokePts;

  return {
    kind: 'RateGraph', maths: m,
    box: box(fr.x, fr.y, fr.x + fr.w, fr.y + fr.h),
    where: {
      plot, origin,
      point: id => { const pt = (p.points ?? []).find(q => q.id === id); check(pt, NAME, `no point ${id}`); const [x, y] = at(pt.x, pt.y); return box(x - BEAD, y - BEAD, x + BEAD, y + BEAD); },
      label: id => ptLabels.get(id)?.box ?? null,
      lineEnd, unit: unitBox, mark: markBox, xName: xNameL.box, yName: yNameL.box, at,
    },
    draw,
  };
}
