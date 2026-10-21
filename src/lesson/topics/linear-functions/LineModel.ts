// LineModel: the model of a linear function in context: an input-output table card beside a graph card whose axes
// carry the quantities and their units. The line is y = mx + b; the initial value b is the point where the line
// meets the output axis at input 0; the rate m is the change in output for ONE input unit.
//   axes     the graph card, grid, axes (bold where x = 0 / y = 0 are inside the window), axis names, tick labels
//   ticks    tick labels for an axis whose labels are held back (scale questions)
//   table    the table card writes in, row by row ('?' cells for unknown outputs)
//   tableQ   the '?' cells fill in with line 0's outputs (lime)
//   points   the marked points (pts), one after another (with letter names on a plate)
//   line     line 0 draws on (over its stated inputs lo..hi, or the whole window; dots for counted inputs)
//   line2    line 1;   line3   line 2
//   start    a ring on (0, b) of line 0 and a short amber mark on the output axis
//   back     line 0 runs on, dashed, from its first given input back to input 0
//   step     the rate step from a point: run (lavender) then rise / fall (teal), each with its signed label
//   read     a prediction: up from an input to line 0, then across to the output axis (dashed), ring on the point
//   domain   line 0 runs on beyond its stated inputs, dashed and dim (where the model no longer applies)
// Colour roles: first (amber) = the initial value, second (teal) = the rate / change, link (lime) = the line and
// answers, pick (lavender) = input steps and focus, wrong = a wrong reading, water = a second function.
// Pure layout inside a Frame: numbers >= 60 px, labels >= 44 px; throws BlockError when a grid would be too dense,
// a value falls outside the window, or labels would collide.
import { type Box, type Pt, box, clamp, lerp, unionBox } from '../../../core/math';
import { rectPts } from '../../../core/pts';
import { type Canvas, dot, withAlpha } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Progress } from '../../../core/clock';
import { type Paint, type Theme, paint } from '../../../core/theme';
import { type Frame, check, hitsLines } from '../../../blocks/block';
import { drawWords, wordsBox } from '../../words';
import { inkLine, wash } from '../../wash';
import { DUSK } from '../../dusk';

const NAME = 'LineModel';
export type LMStep = 'axes' | 'ticks' | 'table' | 'tableQ' | 'points' | 'line' | 'line2' | 'line3' | 'start' | 'back' | 'step' | 'read' | 'domain';
export const LM_STEPS: readonly LMStep[] = ['axes', 'ticks', 'table', 'tableQ', 'points', 'line', 'line2', 'line3', 'start', 'back', 'step', 'read', 'domain'];

export interface LMAxis { min: number; max: number; step: number; name: string; /** false = tick labels wait for the 'ticks' step */ ticks?: boolean }
export interface LMLine {
  m: number; b: number; col?: Paint;
  /** the inputs the model is for (the line is drawn only there; 'domain' shows the rest dashed) */ lo?: number; hi?: number;
  /** counted inputs: dots at these inputs instead of a line */ dots?: readonly number[];
  /** a name drawn near the line (comparisons) */ name?: string;
}
export interface LMPoint { x: number; y: number; col?: Paint; name?: string }
export interface LMTable { xs: readonly number[]; ys: readonly (number | null)[]; xHead: [string, string]; yHead: [string, string] }
export interface LMParams {
  x: LMAxis; y: LMAxis;
  table?: LMTable;
  lines?: readonly LMLine[];
  pts?: readonly LMPoint[];
  /** the rate step: from (x, y) run `run` input units, then change by `rise` */
  step?: { x: number; y: number; run: number; rise: number };
  /** the input whose output is read off line 0 */
  read?: number;
  /** where 'back' starts (default: the smallest given input) */
  backFrom?: number;
}

export interface LMFocus {
  /** a table row lit */ row?: number; rowCol?: Paint; rowK?: number;
  /** a glow ring on the axis names (scale / label questions) */ heads?: number;
  /** a ring on point i */ ring?: { i: number; col: Paint; k: number }[];
  /** line 0 drawn in another colour (e.g. wrong) */ line0Col?: Paint;
  /** strike a wrong extra point */ ghost?: { x: number; y: number; k: number; col?: Paint };
  /** a dashed ray from (0, 0) through a point (a proportional guess) */ ray?: { x: number; y: number; k: number };
}
export interface LMBlock {
  readonly kind: 'LineModel';
  readonly steps: readonly LMStep[];
  readonly box: Box;
  readonly where: {
    grid: Box; graph: Box; table: Box | null;
    point(i: number): Box; row(i: number): Box; yCell(i: number): Box;
    start: Box | null; read: Box | null; rise: Box | null; run: Box | null; lineEnd(i: number): Box;
  };
  px(x: number, y: number): Pt;
  draw(c: Canvas, p: Progress<LMStep>, f?: LMFocus): void;
}

const NUM = 60, LAB = 46;
const fmtN = (v: number) => { const r = Math.round(v * 1000) / 1000; return (r < 0 ? '−' : '') + String(Math.abs(r)); };

export function LineModel(p: LMParams, fr: Frame, th: Theme): LMBlock {
  const fx0 = fr.x, fy0 = fr.y, fx1 = fr.x + fr.w, fy1 = fr.y + fr.h;
  const X = p.x, Y = p.y, lines = p.lines ?? [], pts = p.pts ?? [];
  check(X.max > X.min && Y.max > Y.min && X.step > 0 && Y.step > 0, NAME, 'empty window');
  const nx = Math.round((X.max - X.min) / X.step), ny = Math.round((Y.max - Y.min) / Y.step);
  check(Math.abs(nx * X.step - (X.max - X.min)) < 1e-9 && Math.abs(ny * Y.step - (Y.max - Y.min)) < 1e-9, NAME, 'the window ends on grid lines');
  check(nx >= 2 && nx <= 12 && ny >= 2 && ny <= 12, NAME, `too many or too few grid lines (${nx} x ${ny})`);
  const lab = (t: string, x: number, y: number, size: number, align: 'left' | 'center' | 'right' = 'center') => ({ t, x, y, size, align, b: wordsBox(t, x, y, { size, align }) });
  type Lab = ReturnType<typeof lab>;

  // ----- table geometry -----
  const T = p.table;
  let tableBox: Box | null = null, tX0 = fx0, tX1 = fx0, rowY = (_i: number) => 0, rh = 0, col0 = 140;
  let heads: Lab[] = [], xLabs: Lab[] = [], yLabs: Lab[] = [], qLabs: (Lab | null)[] = [];
  if (T) {
    check(T.xs.length === T.ys.length && T.xs.length >= 2 && T.xs.length <= 6, NAME, 'a table needs 2 to 6 rows');
    // columns as wide as their widest header or number (plus padding): the graph gets the rest of the frame
    const L0q = lines[0];
    const wOf = (t: string, size: number) => wordsBox(t, 0, 0, { size }).w;
    const yStrs = T.ys.map((y, i) => (y === null ? (L0q ? fmtN(L0q.m * T.xs[i]! + L0q.b) : '?') : fmtN(y)));
    const colW = [
      Math.max(110, wOf(T.xHead[0], LAB), wOf(T.xHead[1], 40), ...T.xs.map(x => wOf(fmtN(x), NUM))) + 34,
      Math.max(120, wOf(T.yHead[0], LAB), wOf(T.yHead[1], 40), ...yStrs.map(v => wOf(v, NUM))) + 34,
    ];
    col0 = colW[0]!;
    tX0 = fx0 + 10; tX1 = tX0 + colW[0]! + colW[1]!;
    const xC = tX0 + colW[0]! / 2, yC = tX0 + colW[0]! + colW[1]! / 2;
    const headY = fy0 + 160, unitY = headY + 52, row0 = unitY + 112;
    rh = Math.min(110, (fy1 - 120 - row0) / Math.max(1, T.xs.length - 1 + 0.6));
    check(rh >= 84, NAME, 'the table rows do not fit');
    rowY = (i: number) => row0 + i * rh;
    heads = [lab(T.xHead[0], xC, headY, LAB), lab(T.xHead[1], xC, unitY, 40), lab(T.yHead[0], yC, headY, LAB), lab(T.yHead[1], yC, unitY, 40)];
    for (const h of heads) check(h.b.w <= (h.x < yC - 10 ? colW[0]! : colW[1]!) + 6, NAME, `the header "${h.t}" is wider than its column`);
    xLabs = T.xs.map((x, i) => lab(fmtN(x), xC, rowY(i), NUM));
    yLabs = T.ys.map((y, i) => lab(y === null ? '?' : fmtN(y), yC, rowY(i), NUM));
    const L0 = lines[0];
    qLabs = T.ys.map((y, i) => (y === null && L0 ? lab(fmtN(L0.m * T.xs[i]! + L0.b), yC, rowY(i), NUM) : null));
    for (const L of [...xLabs, ...yLabs, ...qLabs]) if (L) check(L.b.w <= colW[1]! - 16, NAME, `the number ${L.t} is too wide for its column`);
    tableBox = box(tX0 - 12, headY - 70, tX1 + 12, rowY(T.xs.length - 1) + rh * 0.6);
  }

  // ----- graph geometry -----
  const gLeft = T ? tX1 + 28 : fx0 + 10;
  const showTicks = (a: LMAxis) => a.ticks !== false;
  const yTickVals = Array.from({ length: ny + 1 }, (_, i) => Y.min + i * Y.step);
  const xTickVals = Array.from({ length: nx + 1 }, (_, i) => X.min + i * X.step);
  const yTickW = Math.max(...yTickVals.map(v => wordsBox(fmtN(v), 0, 0, { size: NUM }).w));
  const gx0 = gLeft + yTickW + 40, gx1 = fx1 - 26;
  const gy0 = fy0 + 120, gy1 = fy1 - 170;
  check(gx1 - gx0 >= 340, NAME, 'the graph is too narrow');
  const sx = (gx1 - gx0) / (X.max - X.min), sy = (gy1 - gy0) / (Y.max - Y.min);
  const px = (x: number, y: number): Pt => [gx0 + (x - X.min) * sx, gy1 - (y - Y.min) * sy];
  const grid = box(gx0, gy0, gx1, gy1);
  const inX = (x: number) => x >= X.min - 1e-9 && x <= X.max + 1e-9, inY = (y: number) => y >= Y.min - 1e-9 && y <= Y.max + 1e-9;
  for (const P of pts) check(inX(P.x) && inY(P.y), NAME, `the point (${P.x}, ${P.y}) is outside the window`);
  if (T) T.xs.forEach((x, i) => { const y = T.ys[i] ?? (lines[0] ? lines[0].m * x + lines[0].b : null); if (y !== null && p.table && lines.length) check(inX(x) && inY(y), NAME, `the row (${x}, ${y}) is outside the window`); });
  // tick labels: every grid line when they fit, else every other one (always including the ends)
  const xw = Math.max(...xTickVals.map(v => wordsBox(fmtN(v), 0, 0, { size: NUM }).w));
  const xStride = (gx1 - gx0) / nx >= xw + 22 ? 1 : (gx1 - gx0) / nx * 2 >= xw + 22 ? 2 : 3;
  const yStride = (gy1 - gy0) / ny >= NUM + 8 ? 1 : 2;
  check((gx1 - gx0) / nx * xStride >= xw + 16, NAME, 'x tick labels collide');
  const anchor = (vals: number[], stride: number) => { const z = vals.findIndex(v => Math.abs(v) < 1e-9); return z < 0 ? 0 : z % stride; };
  const ax0 = anchor(xTickVals, xStride), ay0 = anchor(yTickVals, yStride);
  const xTicks = xTickVals.filter((_, i) => (i - ax0) % xStride === 0).map(v => lab(fmtN(v), px(v, Y.min)[0], gy1 + 50, NUM));
  const yTicks = yTickVals.filter((_, i) => (i - ay0) % yStride === 0).map(v => lab(fmtN(v), gx0 - 24, px(X.min, v)[1], NUM, 'right'));
  const xNameL = lab(X.name, (gx0 + gx1) / 2, gy1 + 122, LAB);
  const yNameL = lab(Y.name, Math.max(gx0 - 40, gLeft), gy0 - 62, LAB, 'left');
  check(xNameL.b.x1 <= fx1 + 20 && xNameL.b.x0 >= gLeft - 30, NAME, `the axis name "${X.name}" is too wide`);
  check(yNameL.b.x1 <= fx1 + 20, NAME, `the axis name "${Y.name}" is too wide`);
  const graphBox = box(gLeft - 12, gy0 - 112, fx1 + 4, gy1 + 168);

  // ----- lines -----
  /** the part of y = mx + b for inputs in [a, b] that lies inside the window (data coords), or null */
  function clipped(L: LMLine, a: number, b: number): [Pt, Pt] | null {
    let xa = Math.max(a, X.min), xb = Math.min(b, X.max);
    if (xb < xa) return null;
    if (L.m !== 0) {
      const x1 = (Y.min - L.b) / L.m, x2 = (Y.max - L.b) / L.m;
      xa = Math.max(xa, Math.min(x1, x2)); xb = Math.min(xb, Math.max(x1, x2));
    } else if (!inY(L.b)) return null;
    if (xb < xa + 1e-9) return null;
    return [[xa, L.m * xa + L.b], [xb, L.m * xb + L.b]];
  }
  const lineIn = lines.map(L => (L.dots ? null : clipped(L, L.lo ?? -Infinity, L.hi ?? Infinity)));
  lines.forEach((L, i) => {
    if (L.dots) for (const x of L.dots) check(inX(x) && inY(L.m * x + L.b), NAME, `dot ${x} of line ${i} is outside the window`);
    else check(lineIn[i], NAME, `line ${i} misses the window`);
  });
  const pixLine = (s: [Pt, Pt] | null): Pt[] => (s ? [px(s[0][0], s[0][1]), px(s[1][0], s[1][1])] : []);
  const polyLines = lineIn.map(pixLine).filter(P => P.length);
  const L0 = lines[0];
  // start (0, b)
  const startOk = !!L0 && inX(0) && inY(L0.b);
  const startPt = startOk ? px(0, L0!.b) : null;
  const startBox = startPt ? box(startPt[0] - 16, startPt[1] - 16, startPt[0] + 16, startPt[1] + 16) : null;
  // back: from the first given input to 0
  const backFrom = p.backFrom ?? Math.min(...(T ? T.xs : pts.map(P => P.x)), L0?.lo ?? Infinity);
  const backRaw = L0 && startOk && Number.isFinite(backFrom) && backFrom !== 0 ? clipped(L0, Math.min(0, backFrom), Math.max(0, backFrom)) : null;
  /** [from the given point, to input 0] */
  const backSeg: [Pt, Pt] | null = backRaw ? (backFrom > 0 ? [backRaw[1], backRaw[0]] : [backRaw[0], backRaw[1]]) : null;
  // domain: the parts outside lo..hi
  const outside: [Pt, Pt][] = [];
  if (L0 && !L0.dots) {
    if (L0.lo !== undefined) { const s = clipped(L0, -Infinity, L0.lo); if (s) outside.push(s); }
    if (L0.hi !== undefined) { const s = clipped(L0, L0.hi, Infinity); if (s) outside.push(s); }
  }
  // the rate step and its labels
  let stepPts: [Pt, Pt, Pt] | null = null, runLab: Lab | null = null, riseLab: Lab | null = null;
  if (p.step) {
    const S = p.step;
    check(inX(S.x) && inX(S.x + S.run) && inY(S.y) && inY(S.y + S.rise), NAME, 'the rate step leaves the window');
    const a = px(S.x, S.y), mid = px(S.x + S.run, S.y), b = px(S.x + S.run, S.y + S.rise);
    stepPts = [a, mid, b];
    const up = S.rise >= 0;
    runLab = lab(`+${fmtN(S.run)}`, (a[0] + mid[0]) / 2, up ? a[1] + 46 : a[1] - 46, NUM);
    if (runLab.b.y0 < gy0 + 4 || runLab.b.y1 > gy1 - 4) runLab = lab(runLab.t, runLab.x, up ? a[1] - 46 : a[1] + 46, NUM);
    riseLab = lab(S.rise >= 0 ? `+${fmtN(S.rise)}` : fmtN(S.rise), mid[0] + 22, (mid[1] + b[1]) / 2, NUM, 'left');
    if (riseLab.b.x1 > gx1 - 4) riseLab = lab(riseLab.t, mid[0] - 22, (mid[1] + b[1]) / 2, NUM, 'right');
    if (S.rise === 0) riseLab = null;
    // a step too small to see is left out (the board still writes the rate)
    if (!(Math.abs(mid[0] - a[0]) >= 34 && (S.rise === 0 || Math.abs(b[1] - mid[1]) >= 30))) { stepPts = null; runLab = null; riseLab = null; }
  }
  // the reading
  let readPt: Pt | null = null;
  if (p.read !== undefined && L0) {
    const yv = L0.m * p.read + L0.b;
    check(inX(p.read) && inY(yv), NAME, 'the reading is outside the window');
    readPt = px(p.read, yv);
  }
  // point names: around the point, inside the grid, off every line, apart from each other
  const ptBox = (P: LMPoint): Box => { const [x, y] = px(P.x, P.y); return box(x - 14, y - 14, x + 14, y + 14); };
  const placed: Box[] = [runLab?.b, riseLab?.b].filter((b): b is Box => !!b);
  const axisLines: Pt[][] = [];
  if (inY(0)) axisLines.push([[gx0, px(X.min, 0)[1]], [gx1, px(X.min, 0)[1]]]);
  if (inX(0)) axisLines.push([[px(0, Y.min)[0], gy0], [px(0, Y.min)[0], gy1]]);
  const nameLabs = pts.map(P => {
    if (!P.name) return null;
    const [x, y] = px(P.x, P.y);
    // first off the lines AND the axes; then (a point on an axis) off the lines only: the plate covers the axis
    for (const [avoid, gap] of [[[...polyLines, ...axisLines], 18], [polyLines, 18], [polyLines, 6]] as const) for (const [dx, dy, al] of [[-26, -40, 'right'], [26, -40, 'left'], [-26, 42, 'right'], [26, 42, 'left'], [0, -58, 'center'], [0, 60, 'center'],
      [30, 0, 'left'], [-30, 0, 'right'], [40, -76, 'left'], [-40, -76, 'right'], [40, 78, 'left'], [-40, 78, 'right']] as const) {
      const L = lab(P.name, x + dx, y + dy, 48, al), b = L.b;
      if (b.x0 < gx0 + 4 || b.x1 > gx1 - 4 || b.y0 < gy0 + 4 || b.y1 > gy1 - 4) continue;
      if (hitsLines(b, avoid, 10)) continue;
      if (placed.some(o => b.x0 < o.x1 + gap && o.x0 - gap < b.x1 && b.y0 < o.y1 + 6 && o.y0 - 6 < b.y1)) continue;
      if (pts.some(Q => { const B = ptBox(Q); return b.x0 < B.x1 && B.x0 < b.x1 && b.y0 < B.y1 && B.y0 < b.y1; })) continue;
      placed.push(b);
      return L;
    }
    check(false, NAME, `no room for the point name ${P.name}`);
    return null;
  });
  // line names: along the line, inside the grid, off the other lines and the points
  const lineNames = lines.map((L, i) => {
    if (!L.name) return null;
    const seg = lineIn[i];
    if (!seg) return null;
    const A = px(seg[0][0], seg[0][1]), B = px(seg[1][0], seg[1][1]);
    for (const t of [0.85, 0.7, 0.55, 0.4, 0.25, 0.12, 0.95, 0.05]) for (const dy of [-46, 46, -70, 70, -96, 96]) {
      const x = lerp(A[0], B[0], t), y = lerp(A[1], B[1], t) + dy;
      const Lb = lab(L.name, x, y, 50, 'center'), b = Lb.b;
      if (b.x0 < gx0 + 6 || b.x1 > gx1 - 6 || b.y0 < gy0 + 6 || b.y1 > gy1 - 6) continue;
      if (hitsLines(b, [...polyLines, ...axisLines], 10)) continue;
      if (placed.some(o => b.x0 < o.x1 + 8 && o.x0 - 8 < b.x1 && b.y0 < o.y1 + 8 && o.y0 - 8 < b.y1)) continue;
      placed.push(b);
      return Lb;
    }
    check(false, NAME, `no room for the line name ${L.name}`);
    return null;
  });

  // ----- drawing -----
  const ink = DUSK.cream;
  function card(c: Canvas, B: Box, seed: number): void {
    wash(c, rectPts(B.x0, B.y0, B.w, B.h, 18), '#262B57', { seed, rough: 1.3, ink: DUSK.ink, inkW: 3, shade: 0.25 });
  }
  function words(c: Canvas, L: Lab, col: Paint, k: number, weight = 600): void { drawWords(c, L.t, L.x, L.y, col, k, { size: L.size, align: L.align, weight }); }
  function plate(c: Canvas, B: Box, k: number): void {
    if (k <= 0) return;
    const { g } = c;
    g.save(); g.globalAlpha *= clamp(k) * 0.92; g.fillStyle = '#1A1E44';
    g.beginPath(); g.roundRect(B.x0 - 10, B.y0 - 6, B.w + 20, B.h + 12, 10); g.fill(); g.restore();
  }
  function glowRing(c: Canvas, B: Box, col: Paint, k: number, r = 14): void {
    if (k <= 0) return;
    const { g } = c;
    g.save(); g.globalAlpha *= clamp(k);
    g.strokeStyle = paint(th, col, 'fill'); g.lineWidth = 5;
    g.shadowColor = paint(th, col, 'fill'); g.shadowBlur = 10 * th.glow * Math.hypot(g.getTransform().a, g.getTransform().b);
    g.beginPath(); g.roundRect(B.x0 - 8, B.y0 - 6, B.w + 16, B.h + 12, r); g.stroke(); g.restore();
  }
  function seg(c: Canvas, a: Pt, b: Pt, k: number, col: Paint, w: number, alpha = 1, dash?: number[]): void {
    if (k <= 0) return;
    const e: Pt = [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
    const { g } = c;
    g.save(); g.globalAlpha *= alpha; g.strokeStyle = paint(th, col, 'fill'); g.lineWidth = w; g.lineCap = 'round';
    if (dash) g.setLineDash(dash);
    g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(e[0], e[1]); g.stroke(); g.restore();
  }
  function point(c: Canvas, at: Pt, k: number, col: Paint, r = 11): void {
    if (k <= 0) return;
    dot(c, at[0], at[1], (r + 3) * k, DUSK.ink);
    dot(c, at[0], at[1], r * k, col);
  }
  const lineCols: Paint[] = ['link', 'water', 'pick'];
  const lineKey: LMStep[] = ['line', 'line2', 'line3'];

  function draw(c: Canvas, P: Progress<LMStep>, f: LMFocus = {}): void {
    const kA = P.k('axes'), kTk = P.k('ticks'), kT = P.k('table'), kTQ = P.k('tableQ'), kP = P.k('points');
    const kS = P.k('start'), kB = P.k('back'), kSt = P.k('step'), kR = P.k('read'), kD = P.k('domain');
    // ===== table =====
    if (T && tableBox && kT > 0) {
      withAlpha(c, E.smooth(clamp(kT * 3)), () => {
        card(c, tableBox!, 31);
        const yl = heads[1]!.y + 44;
        inkLine(c, [[tX0 + 6, yl], [tX1 - 6, yl]], { col: DUSK.rule, w: 3, seed: 32 });
        inkLine(c, [[tX0 + col0, heads[0]!.y - 34], [tX0 + col0, tableBox!.y1 - 16]], { col: DUSK.rule, w: 3, seed: 33 });
      });
      heads.forEach((H, i) => words(c, H, i % 2 === 0 ? 'ink' : 'dim', E.smooth(clamp(kT * 3 - 0.3)), i % 2 === 0 ? 650 : 500));
      if ((f.heads ?? 0) > 0) for (const H of heads) glowRing(c, H.b, 'pick', f.heads!, 10);
      if (f.row !== undefined && f.row >= 0 && f.row < T.xs.length) {
        const y = rowY(f.row), k = f.rowK ?? 1;
        withAlpha(c, 0.22 * k, () => { c.g.fillStyle = paint(th, f.rowCol ?? 'pick', 'fill'); c.g.beginPath(); c.g.roundRect(tX0 + 4, y - rh / 2 + 6, tX1 - tX0 - 8, rh - 12, 12); c.g.fill(); });
      }
      const n = T.xs.length;
      for (let i = 0; i < n; i++) {
        const k = E.smooth(clamp(kT * (n + 2) - 1.4 - i));
        words(c, xLabs[i]!, 'ink', k);
        const qL = qLabs[i];
        if (qL && kTQ > 0) { withAlpha(c, 1 - clamp(kTQ * 2), () => words(c, yLabs[i]!, 'dim', k)); words(c, qL, 'link', kTQ, 700); }
        else words(c, yLabs[i]!, T.ys[i] === null ? 'dim' : 'ink', k);
      }
    }
    // ===== graph =====
    if (kA > 0) {
      const ka = E.smooth(clamp(kA * 2));
      withAlpha(c, ka, () => {
        card(c, graphBox, 41);
        const { g } = c;
        g.save(); g.strokeStyle = '#4A4F82'; g.lineWidth = 2;
        for (let i = 0; i <= nx; i++) { const x = gx0 + i * X.step * sx; g.beginPath(); g.moveTo(x, gy0); g.lineTo(x, gy1); g.stroke(); }
        for (let i = 0; i <= ny; i++) { const y = gy1 - i * Y.step * sy; g.beginPath(); g.moveTo(gx0, y); g.lineTo(gx1, y); g.stroke(); }
        g.restore();
      });
      // the axes: bold where input 0 / output 0 lie inside the window (a window edge is not an axis)
      const kax = E.inOut(clamp(kA * 1.6 - 0.2));
      if (inY(0)) { const y = px(X.min, 0)[1]; seg(c, [gx0, y], [gx1 + 8, y], kax, ink, 4); }
      if (inX(0)) { const x = px(0, Y.min)[0]; seg(c, [x, gy1], [x, gy0 - 8], kax, ink, 4); }
      const kl = E.smooth(clamp(kA * 2 - 0.9));
      const kxt = showTicks(X) ? kl : Math.min(kl, kTk), kyt = showTicks(Y) ? kl : Math.min(kl, kTk);
      for (const L of xTicks) words(c, L, 'dim', kxt, 600);
      for (const L of yTicks) words(c, L, 'dim', kyt, 600);
      if ((f.heads ?? 0) > 0) { glowRing(c, xNameL.b, 'pick', f.heads!, 10); glowRing(c, yNameL.b, 'pick', f.heads!, 10); }
      words(c, xNameL, 'ink', kl, 650);
      words(c, yNameL, 'ink', kl, 650);
    }
    // a proportional guess: a dashed ray from (0, 0) through a point
    if (f.ray && f.ray.k > 0 && inX(0) && inY(0)) {
      const m = f.ray.y / f.ray.x;
      const s = clipped({ m, b: 0 }, 0, Infinity);
      if (s) seg(c, px(s[0][0], s[0][1]), px(s[1][0], s[1][1]), E.inOut(f.ray.k), 'wrong', 4, 0.85, [14, 12]);
    }
    // domain (behind the line): the model run on beyond its inputs, dashed and dim
    if (kD > 0) for (const s of outside) {
      const a = px(s[0][0], s[0][1]), b = px(s[1][0], s[1][1]);
      const near = L0!.lo !== undefined && Math.abs(s[1][0] - L0!.lo) < 1e-9 ? [b, a] as const : [a, b] as const;
      seg(c, near[0], near[1], E.inOut(kD), 'dim', 4, 0.9, [16, 12]);
    }
    // back to input 0 (dashed, line colour)
    if (kB > 0 && backSeg) {
      const a = px(backSeg[0][0], backSeg[0][1]), b = px(backSeg[1][0], backSeg[1][1]);
      seg(c, a, b, E.inOut(kB), 'first', 5, 0.95, [16, 11]);
    }
    // the lines
    lines.forEach((L, i) => {
      const k = P.k(lineKey[i] ?? 'line3');
      if (k <= 0) return;
      const col: Paint = i === 0 && f.line0Col ? f.line0Col : (L.col ?? lineCols[i] ?? 'link');
      if (L.dots) {
        L.dots.forEach((x, j) => { const kk = E.back(clamp(k * (L.dots!.length + 1) - j)); point(c, px(x, L.m * x + L.b), Math.max(0, kk), col, 9); });
        return;
      }
      const s = lineIn[i];
      if (s) seg(c, px(s[0][0], s[0][1]), px(s[1][0], s[1][1]), E.inOut(k), col, 5);
    });
    // the rate step: run, then rise / fall
    if (kSt > 0 && stepPts) {
      const [a, mid, b] = stepPts;
      seg(c, a, mid, E.inOut(clamp(kSt * 2)), 'pick', 6);
      seg(c, mid, b, E.inOut(clamp(kSt * 2 - 1)), 'second', 6);
      if (runLab) { plate(c, runLab.b, clamp(kSt * 2 - 0.4)); words(c, runLab, 'pick', clamp(kSt * 2 - 0.4), 700); }
      if (riseLab) { plate(c, riseLab.b, clamp(kSt * 2 - 1.2)); words(c, riseLab, 'second', clamp(kSt * 2 - 1.2), 700); }
    }
    // the reading: up to the line, across to the output axis
    if (kR > 0 && readPt && p.read !== undefined) {
      const foot = px(p.read, Math.max(Y.min, Math.min(0, Y.max)));
      const side: Pt = [inX(0) ? px(0, 0)[0] : gx0, readPt[1]];
      seg(c, [readPt[0], foot[1]], readPt, E.inOut(clamp(kR * 2)), 'pick', 4, 1, [12, 9]);
      seg(c, readPt, side, E.inOut(clamp(kR * 2 - 1)), 'link', 4, 1, [12, 9]);
      point(c, readPt, E.back(clamp(kR * 2 - 0.8)), 'link', 10);
    }
    // marked points
    pts.forEach((Pp, i) => {
      const k = E.back(clamp(kP * (pts.length + 1) - i));
      if (k <= 0) return;
      point(c, px(Pp.x, Pp.y), Math.max(0, k), Pp.col ?? 'first');
      const L = nameLabs[i];
      if (L) { plate(c, L.b, clamp(k)); words(c, L, Pp.col ?? 'first', clamp(k), 700); }
    });
    for (const r of f.ring ?? []) if (pts[r.i]) glowRing(c, ptBox(pts[r.i]!), r.col, r.k, 18);
    if (f.ghost && f.ghost.k > 0 && inX(f.ghost.x) && inY(f.ghost.y)) {
      const [x, y] = px(f.ghost.x, f.ghost.y);
      withAlpha(c, clamp(f.ghost.k), () => { dot(c, x, y, 13, DUSK.ink); dot(c, x, y, 10, f.ghost!.col ?? 'wrong'); });
    }
    // the start
    if (kS > 0 && startPt && startBox) {
      point(c, startPt, E.back(clamp(kS * 1.4)), 'first', 12);
      glowRing(c, startBox, 'first', kS, 18);
    }
    // line names
    lines.forEach((L, i) => {
      const N = lineNames[i];
      if (!N) return;
      const k = clamp(P.k(lineKey[i] ?? 'line3') * 1.4 - 0.4);
      if (k <= 0) return;
      plate(c, N.b, k); words(c, N, i === 0 && f.line0Col ? f.line0Col : (L.col ?? lineCols[i] ?? 'link'), k, 700);
    });
  }

  const endOf = (i: number): Box => {
    const s = lineIn[i];
    if (!s) return box(gx1 - 20, gy0, gx1, gy0 + 20);
    const [x, y] = px(s[1][0], s[1][1]);
    return box(x - 10, y - 10, x + 10, y + 10);
  };
  return {
    kind: 'LineModel', steps: LM_STEPS,
    box: unionBox([graphBox, ...(tableBox ? [tableBox] : [])]),
    where: {
      grid, graph: graphBox, table: tableBox,
      point: i => ptBox(pts[i]!),
      row: i => box(tX0, rowY(i) - rh / 2 + 6, tX1, rowY(i) + rh / 2 - 6),
      yCell: i => yLabs[i]!.b,
      start: startBox,
      read: readPt ? box(readPt[0] - 14, readPt[1] - 14, readPt[0] + 14, readPt[1] + 14) : null,
      rise: stepPts ? box(stepPts[1][0] - 8, Math.min(stepPts[1][1], stepPts[2][1]), stepPts[1][0] + 8, Math.max(stepPts[1][1], stepPts[2][1])) : null,
      run: stepPts ? box(stepPts[0][0], stepPts[0][1] - 8, stepPts[1][0], stepPts[0][1] + 8) : null,
      lineEnd: endOf,
    },
    px, draw,
  };
}
