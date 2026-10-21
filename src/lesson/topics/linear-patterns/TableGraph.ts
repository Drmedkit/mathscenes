// TableGraph: an input-output table beside a first-quadrant graph of the same pairs, the model of
// "a linear relationship = the same output change for every equal input step = points on one straight line".
//   table     the table card writes in, row by row (input column, output column, two header lines each)
//   xsteps    the input changes (+1, +2 ...) as brackets LEFT of the input column (for unequal gaps)
//   changes   the output changes (+3, -6 ...) as teal brackets RIGHT of the output column, one per gap
//   axes      the graph card, grid, axes, tick labels (scaled by xGrid / yGrid), axis names
//   points    the pairs as points, one after another (output colour)
//   stairs    from every point: run right to the next input, then rise / fall to the next output (teal)
//   units     the stairs split into steps of ONE input unit (the change per 1 unit, used when the step is 2, 5, 10)
//   line      a straight line through all the points (link), only when the change per unit is constant
//   segments  the points joined point to point (a bent or curved path), for nonlinear pictures
//   ruler     the straight line through the first two points, run on across the grid (dashed): it misses later points
//   start     a ring on the point at input 0 and on the output at input 0 in the table (start colour)
//   points2 / line2   a second series on the same axes (compare two lines), its own colour
// Pure maths in computeTG() (exact rationals); the block lays out inside a Frame and throws BlockError when a number
// would be too small, a label would collide, or a point would leave the grid.
import { type Box, type Pt, type Q, box, clamp, lerp, qEq, rat, unionBox } from '../../../core/math';
import { rectPts } from '../../../core/pts';
import { type Canvas, dot, withAlpha } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Progress } from '../../../core/clock';
import { type Paint, type Theme, paint } from '../../../core/theme';
import { type Frame, check, hitsLines } from '../../../blocks/block';
import { drawWords, wordsBox } from '../../words';
import { inkLine, wash } from '../../wash';
import { DUSK } from '../../dusk';

const NAME = 'TableGraph';
export type TGStep = 'table' | 'xsteps' | 'changes' | 'axes' | 'points' | 'stairs' | 'units' | 'line' | 'segments' | 'ruler' | 'start' | 'points2' | 'line2';
export const TG_STEPS: readonly TGStep[] = ['table', 'xsteps', 'changes', 'axes', 'points', 'stairs', 'units', 'line', 'segments', 'ruler', 'start', 'points2', 'line2'];

export interface TGParams {
  xs: readonly number[]; ys: readonly number[];
  /** a second series on the same inputs (graph only) */
  ys2?: readonly number[];
  /** column headers: a short name and its unit, e.g. ['week', '$ saved'] */
  xHead: [string, string]; yHead: [string, string];
  /** axis names under / above the graph */
  xName: string; yName: string;
  show?: 'both' | 'table' | 'graph';
  /** grid spacing on each axis (default 1 and a friendly step) */
  xGrid?: number; yGrid?: number;
  xMax?: number; yMax?: number;
  /** names of the two series when there are two (drawn at the line ends) */
  names?: [string, string];
}

// ---------- maths ----------
export interface TGMaths {
  xs: number[]; ys: number[]; ys2: number[] | null;
  /** output change per gap, input gap, change per 1 input unit (exact) */
  diffs: number[]; gaps: number[]; rates: Q[];
  /** every rate equal */ constant: boolean;
  /** the constant rate (or null) */ rate: Q | null;
  /** the output at input 0 when the rate is constant (rate held back to input 0), or null */ start: Q | null;
  /** index of the first gap whose rate differs from the first gap's (-1 when constant) */ firstBreak: number;
  /** the same for the second series */ rate2: Q | null; start2: Q | null;
}
export function computeTG(p: Pick<TGParams, 'xs' | 'ys' | 'ys2'>): TGMaths {
  const xs = [...p.xs], ys = [...p.ys];
  check(xs.length >= 2 && xs.length === ys.length, NAME, 'needs at least two pairs, one output per input');
  check(xs.every(Number.isInteger) && ys.every(Number.isInteger), NAME, 'inputs and outputs are whole numbers');
  check(xs.every(x => x >= 0) && ys.every(y => y >= 0), NAME, 'first quadrant only');
  for (let i = 1; i < xs.length; i++) check(xs[i]! > xs[i - 1]!, NAME, 'inputs go up');
  const gaps = xs.slice(1).map((x, i) => x - xs[i]!), diffs = ys.slice(1).map((y, i) => y - ys[i]!);
  const rates = diffs.map((d, i) => rat(d, gaps[i]!));
  let firstBreak = -1;
  for (let i = 1; i < rates.length; i++) if (!qEq(rates[i]!, rates[0]!)) { firstBreak = i; break; }
  const constant = firstBreak < 0;
  const rate = constant ? rates[0]! : null;
  const start = rate ? rat(ys[0]! * rate.q - xs[0]! * rate.p, rate.q) : null;
  // a second series: its own rate and start (the comparison needs both to be straight lines)
  let ys2: number[] | null = null, rate2: Q | null = null, start2: Q | null = null;
  if (p.ys2) {
    ys2 = [...p.ys2];
    check(ys2.length === xs.length && ys2.every(y => Number.isInteger(y) && y >= 0), NAME, 'the second series has one whole output per input');
    const r2 = ys2.slice(1).map((y, i) => rat(y - ys2![i]!, gaps[i]!));
    if (r2.every(r => qEq(r, r2[0]!))) { rate2 = r2[0]!; start2 = rat(ys2[0]! * rate2.q - xs[0]! * rate2.p, rate2.q); }
  }
  // assert the defining property directly: constant <=> every output lies on start + rate * x
  if (rate && start) for (let i = 0; i < xs.length; i++) check(ys[i]! * rate.q * start.q === start.p * rate.q + xs[i]! * rate.p * start.q, NAME, 'a point is off its own line');
  return { xs, ys, ys2, diffs, gaps, rates, constant, rate, start, firstBreak, rate2, start2 };
}
/** the signed change as a label: +3, −6, 0 */
export const signed = (n: number): string => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '0');
/** a friendly grid step for a top value: 1, 2, 5, 10, 20 so the axis has 4..10 lines */
export function niceGrid(max: number): number {
  for (const s of [1, 2, 5, 10, 20, 25, 50]) if (max / s <= 10) return s;
  return 100;
}

// ---------- the block ----------
export interface TGFocus {
  /** a table row lit (index), in its colour */ row?: number; rowCol?: Paint; rowK?: number;
  /** change brackets drawn in another colour (e.g. the one that breaks the pattern) */ hot?: number[]; hotCol?: Paint;
  /** dim the other changes when some are hot */ dimOthers?: boolean;
  /** rings on points that are off the ruler line */ missK?: number;
  /** a pulse on the input steps (the runs of the stairs, the xsteps labels) */ runs?: number;
  /** a pulse on the axis names / headers */ heads?: number;
  /** hide one point (to be plotted by the kid) */ hidePoint?: number;
}
export interface TGBlock {
  readonly kind: 'TableGraph';
  readonly maths: TGMaths;
  readonly steps: readonly TGStep[];
  readonly box: Box;
  readonly where: {
    table: Box | null; graph: Box | null; grid: Box | null;
    row(i: number): Box; yCell(i: number): Box; xCell(i: number): Box;
    change(i: number): Box; xstep(i: number): Box;
    point(i: number): Box; point2(i: number): Box;
    stair(i: number): Box; rise(i: number): Box; run(i: number): Box;
    /** the right end of the main line / of the second line (for a leader) */ lineEnd: Box; line2End: Box;
    start: Box | null;
  };
  /** design px of a data point */
  px(x: number, y: number): Pt;
  draw(c: Canvas, p: Progress<TGStep>, f?: TGFocus): void;
}

const NUM = 60, LAB = 44;
const S2: Paint = 'water';

export function TableGraph(p: TGParams, fr: Frame, th: Theme): TGBlock {
  const m = computeTG(p);
  const show = p.show ?? 'both', hasT = show !== 'graph', hasG = show !== 'table';
  const n = m.xs.length;
  const fx0 = fr.x, fy0 = fr.y, fx1 = fr.x + fr.w, fy1 = fr.y + fr.h;
  const lab = (t: string, x: number, y: number, size: number, align: 'left' | 'center' | 'right' = 'center') => ({ t, x, y, size, align, b: wordsBox(t, x, y, { size, align }) });
  type Lab = ReturnType<typeof lab>;

  // ----- table geometry -----
  const needXsteps = new Set(m.gaps).size > 1;
  const tX0 = fx0 + (needXsteps ? 120 : 20);
  const colW = [150, 180];
  const tX1 = tX0 + colW[0]! + colW[1]!;
  const xC = tX0 + colW[0]! / 2, yC = tX0 + colW[0]! + colW[1]! / 2;
  const headY = fy0 + 52, unitY = fy0 + 104, row0 = fy0 + 200;
  const rh = Math.min(112, (fy1 - 60 - row0) / Math.max(1, n - 1 + 0.6));
  check(!hasT || rh >= 84, NAME, `${n} rows do not fit (row height ${Math.round(rh)} px)`);
  const rowY = (i: number) => row0 + i * rh;
  const tableBox = hasT ? box(tX0 - 14, fy0, tX1 + 14, rowY(n - 1) + rh * 0.62) : null;
  const heads: Lab[] = hasT ? [lab(p.xHead[0], xC, headY, LAB), lab(p.xHead[1], xC, unitY, LAB), lab(p.yHead[0], yC, headY, LAB), lab(p.yHead[1], yC, unitY, LAB)] : [];
  if (hasT) {
    check(heads[0]!.b.x1 + 14 < heads[2]!.b.x0 && heads[1]!.b.x1 + 14 < heads[3]!.b.x0, NAME, `the headers "${p.xHead.join(' ')}" and "${p.yHead.join(' ')}" collide`);
    check(heads.every(h => h.b.x0 >= tX0 - 10 && h.b.x1 <= tX1 + 10), NAME, 'a header is wider than its column');
  }
  const xLabs = m.xs.map((x, i) => lab(String(x), xC, rowY(i), NUM));
  const yLabs = m.ys.map((y, i) => lab(String(y), yC, rowY(i), NUM));
  if (hasT) for (const L of [...xLabs, ...yLabs]) check(L.b.w <= colW[1]! - 24, NAME, `the number ${L.t} is too wide for its column`);
  // output changes: a bracket right of the output column, label right of it, centred between the two rows
  const bx = tX1 + 22;
  const chLabs = m.diffs.map((d, i) => lab(signed(d), bx + 34, (rowY(i) + rowY(i + 1)) / 2, NUM, 'left'));
  const xsLabs = m.gaps.map((g, i) => lab(`+${g}`, tX0 - 38, (rowY(i) + rowY(i + 1)) / 2, NUM, 'right'));
  const chRight = hasT ? Math.max(...chLabs.map(L => L.b.x1)) : fx0;

  // ----- graph geometry -----
  const xGrid = p.xGrid ?? niceGrid(Math.max(...m.xs));
  const xMax = p.xMax ?? Math.max(xGrid, Math.ceil(Math.max(...m.xs) / xGrid) * xGrid);
  const allY = [...m.ys, ...(m.ys2 ?? [])];
  const yGrid = p.yGrid ?? niceGrid(Math.max(...allY));
  const yMax = p.yMax ?? Math.max(yGrid, Math.ceil(Math.max(...allY) / yGrid) * yGrid);
  check(xMax % xGrid === 0 && yMax % yGrid === 0, NAME, 'the axis tops sit on grid lines');
  const gLeft = hasT ? Math.max(chRight + 40, fx0 + 560) : fx0 + 40;
  const yTickW = wordsBox(String(yMax), 0, 0, { size: NUM }).w;
  const gx0 = gLeft + yTickW + 36, gx1 = fx1 - 30;
  const gy0 = fy0 + 92, gy1 = fy1 - 150;
  const grid = hasG ? box(gx0, gy0, gx1, gy1) : null;
  const sx = (gx1 - gx0) / xMax, sy = (gy1 - gy0) / yMax;
  const px = (x: number, y: number): Pt => [gx0 + x * sx, gy1 - y * sy];
  const nxl = xMax / xGrid, nyl = yMax / yGrid;
  if (hasG) {
    check(gx1 - gx0 >= 330, NAME, 'the graph is too narrow');
    check(nxl <= 12 && nyl <= 10, NAME, 'too many grid lines');
    for (const x of m.xs) check(x <= xMax, NAME, `input ${x} is off the grid`);
    for (const y of allY) check(y <= yMax, NAME, `output ${y} is off the grid`);
  }
  // tick labels: every grid line if they fit, else every other one
  const xStride = (gx1 - gx0) / nxl >= wordsBox(String(xMax), 0, 0, { size: NUM }).w + 40 ? 1 : 2;
  const yStride = (gy1 - gy0) / nyl >= NUM + 6 ? 1 : 2;
  check(hasG ? (gx1 - gx0) / nxl * xStride >= wordsBox(String(xMax), 0, 0, { size: NUM }).w + 14 : true, NAME, 'x tick labels collide');
  const xTicks = Array.from({ length: nxl + 1 }, (_, i) => i * xGrid).filter((_, i) => i % xStride === 0).map(x => lab(String(x), px(x, 0)[0], gy1 + 50, NUM));
  const yTicks = Array.from({ length: nyl + 1 }, (_, i) => i * yGrid).filter((_, i) => i % yStride === 0).map(y => lab(String(y), gx0 - 30, px(0, y)[1], NUM, 'right'));
  const xNameL = lab(p.xName, (gx0 + gx1) / 2, gy1 + 112, LAB);
  const yNameL = lab(p.yName, gx0 - 10, gy0 - 52, LAB, 'left');
  if (hasG) {
    check(yNameL.b.x1 <= fx1 + 40, NAME, `the axis name "${p.yName}" runs off the frame`);
    check(xNameL.b.y1 <= fy1 + 30, NAME, 'the x axis name does not fit');
  }
  const graphBox = hasG ? box(gLeft - 16, gy0 - 96, fx1 + 4, gy1 + 150) : null;

  // ----- where -----
  const pt = (i: number): Box => { const [x, y] = px(m.xs[i]!, m.ys[i]!); return box(x - 14, y - 14, x + 14, y + 14); };
  const pt2 = (i: number): Box => { const [x, y] = px(m.xs[i]!, m.ys2?.[i] ?? 0); return box(x - 14, y - 14, x + 14, y + 14); };
  const stairBox = (i: number): Box => { const a = px(m.xs[i]!, m.ys[i]!), b = px(m.xs[i + 1]!, m.ys[i + 1]!); return box(Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(a[1], b[1])); };
  const riseBox = (i: number): Box => { const a = px(m.xs[i + 1]!, m.ys[i]!), b = px(m.xs[i + 1]!, m.ys[i + 1]!); return box(a[0] - 8, Math.min(a[1], b[1]), a[0] + 8, Math.max(a[1], b[1])); };
  const runBox = (i: number): Box => { const a = px(m.xs[i]!, m.ys[i]!), b = px(m.xs[i + 1]!, m.ys[i]!); return box(a[0], a[1] - 8, b[0], a[1] + 8); };
  const rowBox = (i: number): Box => box(tX0, rowY(i) - rh / 2 + 6, tX1, rowY(i) + rh / 2 - 6);
  const at0 = m.xs.indexOf(0);
  const start = at0 >= 0 ? pt(at0) : null;
  const endOf = (ysr: readonly number[] | null, r: Q | null, s: Q | null): Box => {
    if (!ysr || !r || !s) { const P = px(m.xs[n - 1]!, (ysr ?? m.ys)[n - 1]!); return box(P[0] - 10, P[1] - 10, P[0] + 10, P[1] + 10); }
    const [x, y] = lineEnds(r, s)[1];
    return box(x - 10, y - 10, x + 10, y + 10);
  };
  /** the line start + rate * x clipped to the grid (design px), from its left end to its right end */
  function lineEnds(r: Q, s: Q): [Pt, Pt] {
    const f = (x: number) => (s.p / s.q) + (r.p / r.q) * x;
    let xa = 0, xb = xMax;
    // clip to 0 <= y <= yMax
    const clipX = (y: number) => ((y - s.p / s.q) * r.q) / r.p;
    if (r.p !== 0) {
      const xl = clipX(0), xh = clipX(yMax);
      xa = Math.max(0, Math.min(xl, xh)); xb = Math.min(xMax, Math.max(xl, xh));
    }
    return [px(xa, f(xa)), px(xb, f(xb))];
  }

  /** the two series names: just above the right end of each line, kept apart and inside the grid */
  let named: [Lab, Lab] | null = null;
  function nameLabels(): [Lab, Lab] {
    if (named) return named;
    // each series as a polyline (its straight line across the grid, or point to point)
    const poly = (ysr: readonly number[], r: Q | null, s: Q | null): Pt[] => (r && s ? lineEnds(r, s) : ysr.map((y, i) => px(m.xs[i]!, y)));
    const L1 = poly(m.ys, m.rate, m.start), L2 = poly(m.ys2 ?? m.ys, m.rate2, m.start2);
    const dots = [...m.ys.map((_, i) => pt(i)), ...(m.ys2 ?? []).map((_, i) => pt2(i))];
    const along = (P: Pt[], t: number): Pt => { const x = lerp(P[0]![0], P[P.length - 1]![0], t); let k = 1; while (k < P.length - 1 && P[k]![0] < x) k++; const a = P[k - 1]!, b = P[k]!; const u = b[0] === a[0] ? 0 : (x - a[0]) / (b[0] - a[0]); return [x, lerp(a[1], b[1], u)]; };
    const place = (name: string, P: Pt[], avoid: Box | null): Lab | null => {
      for (const t of [0.88, 0.7, 0.5, 0.3, 0.12]) for (const dy of [-50, 50, -80, 80]) {
        const [x, y] = along(P, t), L = lab(name, x, y + dy, LAB, 'center'), b = L.b;
        if (b.x0 < gx0 + 10 || b.x1 > gx1 - 6 || b.y0 < gy0 + 4 || b.y1 > gy1 - 8) continue;
        if (hitsLines(b, [L1, L2], 10)) continue;
        if (dots.some(d => b.x0 < d.x1 + 8 && d.x0 - 8 < b.x1 && b.y0 < d.y1 + 8 && d.y0 - 8 < b.y1)) continue;
        if (avoid && b.x0 < avoid.x1 + 12 && avoid.x0 - 12 < b.x1 && b.y0 < avoid.y1 + 8 && avoid.y0 - 8 < b.y1) continue;
        return L;
      }
      return null;
    };
    const n1 = place(p.names![0], L1, null), n2 = n1 ? place(p.names![1], L2, n1.b) : null;
    if (n1 && n2) return (named = [n1, n2]);
    const e1 = endOf(m.ys, m.rate, m.start), e2 = endOf(m.ys2, m.rate2, m.start2);
    let y1 = e1.cy - 44, y2 = e2.cy - 44;
    if (Math.abs(y1 - y2) < 56) { if (e1.cy <= e2.cy) { y1 = Math.min(y1, y2 - 56); } else { y2 = Math.min(y2, y1 - 56); } }
    y1 = Math.max(gy0 + 26, y1); y2 = Math.max(gy0 + 26, y2);
    if (Math.abs(y1 - y2) < 56) { if (e1.cy <= e2.cy) y2 = y1 + 56; else y1 = y2 + 56; }
    return (named = [lab(p.names![0], Math.min(e1.cx, gx1) - 34, y1, LAB, 'right'), lab(p.names![1], Math.min(e2.cx, gx1) - 34, y2, LAB, 'right')]);
  }

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
    g.beginPath(); g.roundRect(B.x0 - 12, B.y0 - 8, B.w + 24, B.h + 16, 12); g.fill(); g.restore();
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
  function bracket(c: Canvas, x: number, ya: number, yb: number, dir: 1 | -1, col: Paint, k: number, seed: number): void {
    if (k <= 0) return;
    const P: Pt[] = [[x, ya + 14], [x + 16 * dir, ya + 14], [x + 16 * dir, yb - 14], [x, yb - 14]];
    // an arrow-ish bracket: down the side, a small head at the lower row
    const L = partialPts(P, E.inOut(clamp(k)));
    inkLine(c, L, { col, w: 4, seed, rough: 0.6 });
    if (k > 0.95) { const tip = P[3]!; inkLine(c, [[tip[0] + 10 * dir, tip[1] - 9], tip, [tip[0] + 10 * dir, tip[1] + 9]], { col, w: 4, seed: seed + 1, rough: 0.3 }); }
  }

  function draw(c: Canvas, P: Progress<TGStep>, f: TGFocus = {}): void {
    const kT = P.k('table'), kX = P.k('xsteps'), kC = P.k('changes'), kA = P.k('axes'), kP = P.k('points'), kS = P.k('stairs'), kU = P.k('units');
    const kL = P.k('line'), kG = P.k('segments'), kR = P.k('ruler'), kSt = P.k('start'), kP2 = P.k('points2'), kL2 = P.k('line2');
    // ===== table =====
    if (hasT && tableBox && kT > 0) {
      withAlpha(c, E.smooth(clamp(kT * 3)), () => {
        card(c, tableBox, 31);
        const yl = (headY + unitY) / 2 + 60;
        inkLine(c, [[tX0 + 6, yl], [tX1 - 6, yl]], { col: DUSK.rule, w: 3, seed: 32 });
        inkLine(c, [[tX0 + colW[0]!, headY - 30], [tX0 + colW[0]!, tableBox.y1 - 16]], { col: DUSK.rule, w: 3, seed: 33 });
      });
      const hk = f.heads ?? 0;
      if (hk > 0) for (const H of heads) glowRing(c, H.b, 'pick', hk, 10);
      heads.forEach((H, i) => words(c, H, i % 2 === 0 ? 'ink' : 'dim', E.smooth(clamp(kT * 3 - 0.3)), i % 2 === 0 ? 650 : 500));
      if (f.row !== undefined && f.row >= 0 && f.row < n) {
        const B = rowBox(f.row), k = f.rowK ?? 1;
        withAlpha(c, 0.22 * k, () => { c.g.fillStyle = paint(th, f.rowCol ?? 'pick', 'fill'); c.g.beginPath(); c.g.roundRect(B.x0 + 4, B.y0, B.w - 8, B.h, 12); c.g.fill(); });
      }
      for (let i = 0; i < n; i++) {
        const k = E.smooth(clamp(kT * (n + 2) - 1.4 - i));
        words(c, xLabs[i]!, 'ink', k);
        const isStart = m.xs[i] === 0 && kSt > 0;
        words(c, yLabs[i]!, isStart ? 'first' : 'ink', k);
        if (isStart) glowRing(c, yLabs[i]!.b, 'first', kSt);
      }
    }
    // input steps (left)
    if (hasT && kX > 0) for (let i = 0; i < n - 1; i++) {
      const k = clamp(kX * (n - 1) - i * 0.85);
      const L = xsLabs[i]!;
      bracket(c, tX0 - 10, rowY(i), rowY(i + 1), -1, 'dim', k, 600 + i);
      words(c, L, 'dim', E.smooth(clamp(k * 1.6 - 0.4)));
      if ((f.runs ?? 0) > 0) glowRing(c, L.b, 'pick', f.runs!, 10);
    }
    // output changes (right)
    if (hasT && kC > 0) for (let i = 0; i < n - 1; i++) {
      const k = clamp(kC * (n - 1) - i * 0.85);
      const hot = f.hot?.includes(i) ?? false;
      const col: Paint = hot ? (f.hotCol ?? 'wrong') : 'second';
      const a = f.hot?.length && f.dimOthers && !hot ? 0.45 : 1;
      withAlpha(c, a, () => {
        bracket(c, bx, rowY(i), rowY(i + 1), 1, col, k, 700 + i);
        words(c, chLabs[i]!, col, E.smooth(clamp(k * 1.6 - 0.4)), 700);
      });
    }
    // ===== graph =====
    if (hasG && grid && graphBox && kA > 0) {
      const ka = E.smooth(clamp(kA * 2));
      withAlpha(c, ka, () => {
        card(c, graphBox, 41);
        const { g } = c;
        g.save(); g.strokeStyle = '#4A4F82'; g.lineWidth = 2;
        for (let i = 1; i <= nxl; i++) { const x = px(i * xGrid, 0)[0]; g.beginPath(); g.moveTo(x, gy0); g.lineTo(x, gy1); g.stroke(); }
        for (let i = 1; i <= nyl; i++) { const y = px(0, i * yGrid)[1]; g.beginPath(); g.moveTo(gx0, y); g.lineTo(gx1, y); g.stroke(); }
        g.restore();
      });
      const kax = E.inOut(clamp(kA * 1.6 - 0.2));
      seg(c, [gx0, gy1], [gx1 + 6, gy1], kax, ink, 4);
      seg(c, [gx0, gy1], [gx0, gy0 - 6], kax, ink, 4);
      const kl = E.smooth(clamp(kA * 2 - 0.9));
      for (const L of xTicks) words(c, L, 'dim', kl, 600);
      for (const L of yTicks) words(c, L, 'dim', kl, 600);
      const hk = f.heads ?? 0;
      if (hk > 0) { glowRing(c, xNameL.b, 'pick', hk, 10); glowRing(c, yNameL.b, 'pick', hk, 10); }
      words(c, xNameL, 'ink', kl, 650);
      words(c, yNameL, 'ink', kl, 650);
    }
    if (hasG && grid) {
      // the ruler (behind the points): the line through the first two points, run on across the grid
      if (kR > 0) {
        const r = m.rates[0]!, s = rat(m.ys[0]! * r.q - m.xs[0]! * r.p, r.q);
        const [a, b] = lineEnds(r, s);
        const a0 = px(m.xs[0]!, m.ys[0]!);
        seg(c, a0, b, E.inOut(kR), 'dim', 4, 0.9, [16, 12]);
        seg(c, a0, a, E.inOut(kR), 'dim', 4, 0.9, [16, 12]);
      }
      // the straight line through all points (link)
      if (kL > 0 && m.rate && m.start) {
        const [a, b] = lineEnds(m.rate, m.start);
        seg(c, a, b, E.inOut(kL), m.ys2 ? 'first' : 'link', 5);
      }
      if (kL2 > 0 && m.ys2 && m.rate2 && m.start2) {
        const [a, b] = lineEnds(m.rate2, m.start2);
        seg(c, a, b, E.inOut(kL2), S2, 5);
      }
      // point to point (bent / curved)
      if (kG > 0) for (let i = 0; i < n - 1; i++) {
        const k = clamp(kG * (n - 1) - i);
        seg(c, px(m.xs[i]!, m.ys[i]!), px(m.xs[i + 1]!, m.ys[i + 1]!), E.inOut(k), 'first', 4, 0.85);
      }
      // stairs: run then rise, from each point to the next
      if (kS > 0 || kU > 0) for (let i = 0; i < n - 1; i++) {
        const k = clamp(Math.max(kS, kU) * (n - 1) - i * 0.9);
        if (k <= 0) continue;
        const a = px(m.xs[i]!, m.ys[i]!), mid = px(m.xs[i + 1]!, m.ys[i]!), b = px(m.xs[i + 1]!, m.ys[i + 1]!);
        const hot = f.hot?.includes(i) ?? false;
        const col: Paint = hot ? (f.hotCol ?? 'wrong') : 'second';
        const runCol: Paint = (f.runs ?? 0) > 0.5 ? 'pick' : col;
        if (kU > 0 && m.gaps[i]! > 1 && sx >= 24) {
          // unit steps: one input unit right, then the change per unit up / down
          const g = m.gaps[i]!, per = m.diffs[i]! / g;
          for (let u = 0; u < g; u++) {
            const ku = clamp(k * g - u);
            const p0 = px(m.xs[i]! + u, m.ys[i]! + per * u), p1 = px(m.xs[i]! + u + 1, m.ys[i]! + per * u), p2 = px(m.xs[i]! + u + 1, m.ys[i]! + per * (u + 1));
            seg(c, p0, p1, E.inOut(clamp(ku * 2)), runCol, 5);
            seg(c, p1, p2, E.inOut(clamp(ku * 2 - 1)), col, 5);
            if (ku >= 1 && u < g - 1) dot(c, p2[0], p2[1], 6, col, 0.9);
          }
        } else {
          seg(c, a, mid, E.inOut(clamp(k * 2)), runCol, 5);
          seg(c, mid, b, E.inOut(clamp(k * 2 - 1)), col, 5);
        }
      }
      // points
      if (kP > 0) for (let i = 0; i < n; i++) {
        if (f.hidePoint === i) continue;
        const k = E.back(clamp(kP * (n + 1) - i * 1.0));
        if (k <= 0) continue;
        const [x, y] = px(m.xs[i]!, m.ys[i]!);
        dot(c, x, y, 13 * Math.max(0, k), DUSK.ink);
        dot(c, x, y, 10 * Math.max(0, k), 'first');
      }
      if (kP2 > 0 && m.ys2) for (let i = 0; i < n; i++) {
        const k = E.back(clamp(kP2 * (n + 1) - i));
        if (k <= 0) continue;
        const [x, y] = px(m.xs[i]!, m.ys2[i]!);
        // a little smaller than the first series: where both share a point, the first one shows as a ring
        dot(c, x, y, 8.5 * Math.max(0, k), DUSK.ink);
        dot(c, x, y, 6.5 * Math.max(0, k), S2);
      }
      // points that miss the ruler line
      if ((f.missK ?? 0) > 0) {
        const r = m.rates[0]!, s0 = m.ys[0]! - m.xs[0]! * (r.p / r.q);
        for (let i = 2; i < n; i++) if (Math.abs(s0 + (r.p / r.q) * m.xs[i]! - m.ys[i]!) > 1e-9) glowRing(c, pt(i), 'wrong', f.missK!, 18);
      }
      if (kSt > 0 && start) glowRing(c, start, 'first', kSt, 18);
      // series names at the right ends
      if (p.names && m.ys2) {
        const [l1, l2] = nameLabels();
        const k1 = clamp(Math.max(kL, kP * 1.2 - 0.2)), k2 = clamp(Math.max(kL2, kP2 * 1.2 - 0.2));
        if (k1 > 0) { plate(c, l1.b, k1); words(c, l1, 'first', k1, 700); }
        if (k2 > 0) { plate(c, l2.b, k2); words(c, l2, S2, k2, 700); }
      }
    }
  }

  const parts = [tableBox, graphBox].filter((b): b is Box => !!b);
  return {
    kind: 'TableGraph', maths: m, steps: TG_STEPS,
    box: unionBox(parts.length ? parts : [box(fx0, fy0, fx1, fy1)]),
    where: {
      table: tableBox, graph: graphBox, grid,
      row: rowBox, yCell: i => yLabs[i]!.b, xCell: i => xLabs[i]!.b,
      change: i => chLabs[i]!.b, xstep: i => xsLabs[i]!.b,
      point: pt, point2: pt2, stair: stairBox, rise: riseBox, run: runBox,
      lineEnd: endOf(m.ys, m.rate, m.start), line2End: endOf(m.ys2, m.rate2, m.start2),
      start,
    },
    px, draw,
  };
}

/** the first k (0..1) of a polyline */
function partialPts(P: readonly Pt[], k: number): Pt[] {
  if (k >= 1) return [...P];
  let L = 0;
  for (let i = 1; i < P.length; i++) L += Math.hypot(P[i]![0] - P[i - 1]![0], P[i]![1] - P[i - 1]![1]);
  let left = L * clamp(k);
  const out: Pt[] = [P[0]!];
  for (let i = 1; i < P.length; i++) {
    const a = P[i - 1]!, b = P[i]!, d = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (left >= d) { out.push(b); left -= d; continue; }
    const t = d ? left / d : 0;
    out.push([lerp(a[0], b[0], t), lerp(a[1], b[1], t)]);
    break;
  }
  return out;
}
