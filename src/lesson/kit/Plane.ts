// Plane: the shared coordinate plane of the high school lessons (docs/lessons/HS_PLAN.md §3). One card with a grid,
// axes and tick labels, and any number of named items drawn on it, each with its own step key so a lesson decides the
// order things appear in:
//   curve   y = f(x) over lo..hi (sampled; breaks where f is undefined or jumps off the window, e.g. an asymptote),
//           drawn on from left to right; open / closed ends; an optional name placed along it
//   point   a dot (open = a ring), with an optional name on a plate
//   seg     a segment between two data points (dashed, an arrow head, a width)
//   vline / hline   a full-height / full-width line (asymptotes, x = a, y = c), dashed by default
//   shade   the region between two boundaries over lo..hi; a boundary is a function, or 'top' / 'bottom' (the window
//           edge): inequalities, areas under a curve, regions between curves
//   text    words at a data point (a short label placed by the lesson)
// The axes come in on step 'axes'. Focus: rings on items, dimmed items, and a trace point riding a curve with its
// (x, y) readout. px / toData convert between data and design pixels (drag interactions), snap rounds to a step.
// Same look as the 7-8 LineModel (card, grid, bold axes where 0 is inside the window, dusk colour roles: link (lime) =
// the main curve and answers, first (amber), second (teal), pick (lavender) = focus and inputs, water = a second
// function, wrong). Pure layout inside a Frame; throws BlockError when the grid is too dense, a point or label leaves
// the window, or labels would collide.
import { type Box, type Pt, box, clamp } from '../../core/math';
import { rectPts } from '../../core/pts';
import { type Canvas, dot, withAlpha } from '../../core/draw';
import { E } from '../../core/easing';
import type { Progress } from '../../core/clock';
import { type Paint, type Theme, paint } from '../../core/theme';
import { type Frame, check, hitsLines } from '../../blocks/block';
import { drawWords, wordsBox } from '../words';
import { wash } from '../wash';
import { DUSK } from '../dusk';

const NAME = 'Plane';
export interface PAxis {
  min: number; max: number; step: number;
  /** the axis name (a quantity with its unit, or x / y) */ name?: string;
  /** false = tick labels wait for the 'ticks' step */ ticks?: boolean;
  /** tick label text (default: the number with a real minus sign); return '' to leave a tick unlabelled */ fmt?: (v: number) => string;
}
type End = 'open' | 'closed' | 'none';
interface Base { key: string; col?: Paint }
export interface PCurve extends Base { kind: 'curve'; f: (x: number) => number; lo?: number; hi?: number; ends?: [End, End]; dash?: boolean; w?: number; name?: string }
export interface PPoint extends Base { kind: 'point'; x: number; y: number; open?: boolean; name?: string }
export interface PSeg extends Base { kind: 'seg'; a: Pt; b: Pt; dash?: boolean; arrow?: boolean; w?: number }
export interface PVLine extends Base { kind: 'vline'; x: number; dash?: boolean }
export interface PHLine extends Base { kind: 'hline'; y: number; dash?: boolean }
export interface PShade extends Base { kind: 'shade'; lo: number; hi: number; top: ((x: number) => number) | 'top'; bottom: ((x: number) => number) | 'bottom'; alpha?: number }
export interface PText extends Base { kind: 'text'; x: number; y: number; text: string; align?: 'left' | 'center' | 'right'; size?: number }
export type PItem = PCurve | PPoint | PSeg | PVLine | PHLine | PShade | PText;

export interface PParams { x: PAxis; y: PAxis; items?: readonly PItem[]; /** square grid cells (same scale on both axes): circles, slopes, distances */ equal?: boolean }
export interface PFocus {
  /** glow rings on items (points, texts, curve names) */ ring?: { key: string; col: Paint; k: number }[];
  /** items drawn at low alpha */ dim?: readonly string[];
  /** a point riding curve `key` at input x, with an (x, y) readout */ trace?: { key: string; x: number; k: number; col?: Paint; /** decimals in the readout (default 2) */ digits?: number };
  /** the axis names glow (scale / label questions) */ heads?: number;
}
export interface PlaneBlock {
  readonly kind: 'Plane';
  readonly box: Box;
  readonly grid: Box;
  /** keys of items whose name found no free spot and is not drawn (the lesson may label them another way) */ readonly dropped: readonly string[];
  /** design pixels of a data point */ px(x: number, y: number): Pt;
  /** data coordinates of a design pixel */ toData(X: number, Y: number): Pt;
  /** a value rounded to a multiple of step (drags) and kept inside the window */ snap(v: number, step: number, axis: 'x' | 'y'): number;
  /** the box of an item: a point's dot, a text, a curve's name (or its last drawn sample), a line's end */ where(key: string): Box;
  draw(c: Canvas, p: Progress<string>, f?: PFocus): void;
}

const NUM = 56, LAB = 46;
/** a tick / readout number: a real minus sign, thousands commas from 10,000 up (4-digit years and counts stay plain) */
export const fmtN = (v: number): string => { const r = Math.round(v * 1000) / 1000, a = Math.abs(r); return (r < 0 ? '−' : '') + (a >= 10000 ? a.toLocaleString('en-US', { maximumFractionDigits: 3 }) : String(a)); };

export function Plane(p: PParams, fr: Frame, th: Theme): PlaneBlock {
  const X = p.x, Y = p.y, items = p.items ?? [];
  const fx0 = fr.x, fy0 = fr.y, fx1 = fr.x + fr.w, fy1 = fr.y + fr.h;
  check(X.max > X.min && Y.max > Y.min && X.step > 0 && Y.step > 0, NAME, 'empty window');
  const nx = Math.round((X.max - X.min) / X.step), ny = Math.round((Y.max - Y.min) / Y.step);
  check(Math.abs(nx * X.step - (X.max - X.min)) < 1e-9 && Math.abs(ny * Y.step - (Y.max - Y.min)) < 1e-9, NAME, 'the window ends on grid lines');
  check(nx >= 2 && nx <= 20 && ny >= 2 && ny <= 20, NAME, `too many or too few grid lines (${nx} x ${ny})`);
  const keys = new Set<string>();
  for (const it of items) { check(!keys.has(it.key) && it.key !== 'axes' && it.key !== 'ticks', NAME, `item key "${it.key}" is used twice or reserved`); keys.add(it.key); }
  const fx = X.fmt ?? fmtN, fy = Y.fmt ?? fmtN;
  const lab = (t: string, x: number, y: number, size: number, align: 'left' | 'center' | 'right' = 'center') => ({ t, x, y, size, align, b: wordsBox(t, x, y, { size, align }) });
  type Lab = ReturnType<typeof lab>;

  // ----- geometry: tick labels left and below, axis names above (y) and below (x) -----
  const xTickVals = Array.from({ length: nx + 1 }, (_, i) => X.min + i * X.step);
  const yTickVals = Array.from({ length: ny + 1 }, (_, i) => Y.min + i * Y.step);
  const yTickW = Math.max(...yTickVals.map(v => wordsBox(fy(v), 0, 0, { size: NUM }).w));
  let gx0 = fx0 + 22 + yTickW + 26, gx1 = fx1 - 26;
  let gy0 = fy0 + (Y.name ? 110 : 40), gy1 = fy1 - (X.name ? 160 : 90);
  if (p.equal) {
    // one data unit is the same length on both axes: shrink the longer side and centre it
    const s = Math.min((gx1 - gx0) / (X.max - X.min), (gy1 - gy0) / (Y.max - Y.min));
    const w = s * (X.max - X.min), h = s * (Y.max - Y.min);
    gx0 += ((gx1 - gx0) - w) / 2; gx1 = gx0 + w;
    gy0 += ((gy1 - gy0) - h) / 2; gy1 = gy0 + h;
  }
  check(gx1 - gx0 >= 300 && gy1 - gy0 >= 300, NAME, 'the grid is too small');
  const sx = (gx1 - gx0) / (X.max - X.min), sy = (gy1 - gy0) / (Y.max - Y.min);
  const px = (x: number, y: number): Pt => [gx0 + (x - X.min) * sx, gy1 - (y - Y.min) * sy];
  const toData = (a: number, b: number): Pt => [X.min + (a - gx0) / sx, Y.min + (gy1 - b) / sy];
  const grid = box(gx0, gy0, gx1, gy1);
  const inX = (x: number) => x >= X.min - 1e-9 && x <= X.max + 1e-9, inY = (y: number) => y >= Y.min - 1e-9 && y <= Y.max + 1e-9;

  // tick labels: every grid line when they fit, else every 2nd / 3rd / 4th (anchored on 0 when 0 is a tick)
  const xw = Math.max(...xTickVals.map(v => wordsBox(fx(v), 0, 0, { size: NUM }).w));
  const cellX = (gx1 - gx0) / nx, cellY = (gy1 - gy0) / ny;
  const xStride = [1, 2, 3, 4, 5].find(s => cellX * s >= xw + 20);
  const yStride = [1, 2, 3, 4, 5].find(s => cellY * s >= NUM + 6);
  check(xStride && yStride, NAME, 'tick labels collide');
  const anchor = (vals: number[], stride: number) => { const z = vals.findIndex(v => Math.abs(v) < 1e-9); return z < 0 ? 0 : z % stride; };
  const ax0 = anchor(xTickVals, xStride!), ay0 = anchor(yTickVals, yStride!);
  // ticks sit on the axis line when it is inside the window, else on the window edge
  const xAxisY = inY(0) && Y.min < 0 ? px(0, 0)[1] : gy1, yAxisX = inX(0) && X.min < 0 ? px(0, 0)[0] : gx0;
  const xTicks = xTickVals.filter((v, i) => (i - ax0) % xStride! === 0 && fx(v) !== '' && !(Math.abs(v) < 1e-9 && yAxisX !== gx0))
    .map(v => lab(fx(v), px(v, 0)[0], Math.min(xAxisY + 44, gy1 + 44), NUM));
  const yTicks = yTickVals.filter((v, i) => (i - ay0) % yStride! === 0 && fy(v) !== '' && !(Math.abs(v) < 1e-9 && xAxisY !== gy1))
    .map(v => lab(fy(v), yAxisX === gx0 ? gx0 - 22 : yAxisX - 16, px(0, v)[1], NUM, 'right'));
  // near the origin a y tick label can sit on an x tick label: the y one goes
  for (let i = yTicks.length - 1; i >= 0; i--) if (xTicks.some(L => { const a = L.b, b = yTicks[i]!.b; return a.x0 < b.x1 + 6 && b.x0 < a.x1 + 6 && a.y0 < b.y1 && b.y0 < a.y1; })) yTicks.splice(i, 1);
  // a tick label inside the grid (axis in the middle) gets a plate; it must not leave the card
  for (const L of yTicks) check(L.b.x0 >= fx0 + 6, NAME, `the tick label ${L.t} leaves the card`);
  const xNameL = X.name ? lab(X.name, (gx0 + gx1) / 2, gy1 + 112, LAB) : null;
  const yNameL = Y.name ? lab(Y.name, gx0 - 10, gy0 - 58, LAB, 'left') : null;
  if (xNameL) check(xNameL.b.x0 >= fx0 && xNameL.b.x1 <= fx1, NAME, `the axis name "${X.name}" is too wide`);
  if (yNameL) check(yNameL.b.x1 <= fx1 - 10, NAME, `the axis name "${Y.name}" is too wide`);
  const cardBox = box(fx0, fy0, fx1, fy1);

  // ----- curves: sampled runs inside a band around the window (the grid clip does the rest) -----
  const band = (Y.max - Y.min) * 1.5;
  const runsOf = (C: PCurve): Pt[][] => {
    const a = Math.max(C.lo ?? X.min, X.min), b = Math.min(C.hi ?? X.max, X.max);
    if (b <= a) return [];
    const n = Math.max(40, Math.ceil((px(b, 0)[0] - px(a, 0)[0]) / 3));
    const runs: Pt[][] = [];
    let run: Pt[] = [], prev: number | null = null;
    for (let i = 0; i <= n; i++) {
      const x = a + (b - a) * i / n, y = C.f(x);
      const ok = Number.isFinite(y) && y > Y.min - band && y < Y.max + band;
      // a jump across most of the window between two samples is an asymptote, not a steep piece
      const jump = ok && prev !== null && Math.abs(y - prev) > (Y.max - Y.min) * 0.9 && Math.abs(px(x, y)[1] - px(x, prev)[1]) > (gy1 - gy0) * 0.9;
      if (!ok || jump) { if (run.length > 1) runs.push(run); run = []; }
      if (ok) run.push(px(x, y));
      prev = ok ? y : null;
    }
    if (run.length > 1) runs.push(run);
    return runs;
  };
  const curveRuns = new Map<string, Pt[][]>();
  const curveLen = new Map<string, number>();
  for (const it of items) if (it.kind === 'curve') {
    const R = runsOf(it);
    check(R.some(r => r.some(([, yy]) => yy >= gy0 - 1 && yy <= gy1 + 1)), NAME, `curve ${it.key} misses the window`);
    curveRuns.set(it.key, R);
    curveLen.set(it.key, R.reduce((s, r) => s + r.slice(1).reduce((t, q, i) => t + Math.hypot(q[0] - r[i]![0], q[1] - r[i]![1]), 0), 0));
    for (const [j, e] of (it.ends ?? ['none', 'none']).entries()) if (e !== 'none') {
      const x = j === 0 ? it.lo : it.hi;
      check(x !== undefined && inX(x) && inY(it.f(x)), NAME, `curve ${it.key}: an end point is outside the window`);
    }
  }
  for (const it of items) {
    if (it.kind === 'point' || it.kind === 'text') check(inX(it.x) && inY(it.y), NAME, `${it.key} (${it.x}, ${it.y}) is outside the window`);
    if (it.kind === 'seg') check(inX(it.a[0]) && inY(it.a[1]) && inX(it.b[0]) && inY(it.b[1]), NAME, `segment ${it.key} leaves the window`);
    if (it.kind === 'vline') check(inX(it.x), NAME, `x = ${it.x} is outside the window`);
    if (it.kind === 'hline') check(inY(it.y), NAME, `y = ${it.y} is outside the window`);
    if (it.kind === 'shade') check(it.hi > it.lo && inX(it.lo) && inX(it.hi), NAME, `shade ${it.key} runs outside the window`);
  }

  // ----- names on plates: points first, then curves; off every curve, axis and other label -----
  const polysExtra: Pt[][] = [];
  const polys: Pt[][] = [...curveRuns.values()].flat();
  const axisLines: Pt[][] = [];
  if (inY(0)) axisLines.push([[gx0, px(0, 0)[1]], [gx1, px(0, 0)[1]]]);
  if (inX(0)) axisLines.push([[px(0, 0)[0], gy0], [px(0, 0)[0], gy1]]);
  // vertical / horizontal lines (asymptotes) count as curves for label placement
  for (const it of items) if (it.kind === 'vline') polysExtra.push([px(it.x, Y.min), px(it.x, Y.max)]);
  else if (it.kind === 'hline') polysExtra.push([px(X.min, it.y), px(X.max, it.y)]);
  // segments (run / rise arrows, radii) count too
  for (const it of items) if (it.kind === 'seg') polysExtra.push([px(it.a[0], it.a[1]), px(it.b[0], it.b[1])]);
  polys.push(...polysExtra);
  const placed: Box[] = yAxisX !== gx0 || xAxisY !== gy1 ? [...xTicks, ...yTicks].map(L => L.b) : [];
  const dotBox = (x: number, y: number): Box => { const [a, b] = px(x, y); return box(a - 14, b - 14, a + 14, b + 14); };
  const pointBoxes = items.filter((i): i is PPoint => i.kind === 'point').map(P => dotBox(P.x, P.y));
  const fits = (b: Box, avoid: Pt[][], gap: number) =>
    b.x0 >= gx0 + 4 && b.x1 <= gx1 - 4 && b.y0 >= gy0 + 4 && b.y1 <= gy1 - 4 && !hitsLines(b, avoid, 10)
    && !placed.some(o => b.x0 < o.x1 + gap && o.x0 - gap < b.x1 && b.y0 < o.y1 + 6 && o.y0 - 6 < b.y1)
    && !pointBoxes.some(B => b.x0 < B.x1 && B.x0 < b.x1 && b.y0 < B.y1 && B.y0 < b.y1);
  const texts = new Map<string, Lab>();
  for (const it of items) if (it.kind === 'text') {
    const [x, y] = px(it.x, it.y), L = lab(it.text, x, y, it.size ?? 46, it.align ?? 'center');
    check(L.b.x0 >= gx0 - 2 && L.b.x1 <= gx1 + 2 && L.b.y0 >= gy0 - 2 && L.b.y1 <= gy1 + 2, NAME, `the text "${it.text}" leaves the grid`);
    texts.set(it.key, L);
  }
  for (const L of texts.values()) placed.push(L.b);
  const names = new Map<string, Lab>(), dropped: string[] = [];
  for (const it of items) if (it.kind === 'point' && it.name) {
    const [x, y] = px(it.x, it.y);
    let L: Lab | null = null;
    // off the curves and axes; then off the curves; last, anywhere free (the plate covers the line it sits on)
    search: for (const [avoid, gap] of [[[...polys, ...axisLines], 18], [polys, 18], [polys, 6], [[], 6]] as const)
      for (const [dx, dy, al] of [[-26, -40, 'right'], [26, -40, 'left'], [-26, 42, 'right'], [26, 42, 'left'], [0, -58, 'center'], [0, 60, 'center'],
        [30, 0, 'left'], [-30, 0, 'right'], [40, -76, 'left'], [-40, -76, 'right'], [40, 78, 'left'], [-40, 78, 'right'],
        [70, -100, 'left'], [-70, -100, 'right'], [70, 100, 'left'], [-70, 100, 'right'], [90, 0, 'left'], [-90, 0, 'right']] as const) {
        const c = lab(it.name, x + dx, y + dy, 46, al);
        if (fits(c.b, avoid as Pt[][], gap)) { L = c; break search; }
      }
    // no room anywhere: the name is left out (listed in `dropped`) rather than drawn over something
    if (!L) { dropped.push(it.key); continue; }
    placed.push(L.b); names.set(it.key, L);
  }
  for (const it of items) if (it.kind === 'curve' && it.name) {
    const pts = (curveRuns.get(it.key) ?? []).flat().filter(([a, b]) => a > gx0 + 20 && a < gx1 - 20 && b > gy0 + 20 && b < gy1 - 20);
    let L: Lab | null = null;
    // beside the curve (left or right of a sample, so a steep curve does not cut the label), then above / below it;
    // off every curve and axis, then off the curves, then (last) only off the other labels
    search: for (const avoid of [[...polys, ...axisLines], polys, []])
      for (const t of [0.85, 0.7, 0.55, 0.4, 0.25, 0.12, 0.95, 0.05]) {
        const q = pts[Math.floor(t * (pts.length - 1))];
        if (!q) break;
        for (const [dx, dy, al] of [[28, 0, 'left'], [-28, 0, 'right'], [28, -40, 'left'], [-28, -40, 'right'], [28, 40, 'left'], [-28, 40, 'right'],
          [0, -46, 'center'], [0, 46, 'center'], [0, -72, 'center'], [0, 72, 'center'], [40, -80, 'left'], [-40, -80, 'right'], [40, 80, 'left'], [-40, 80, 'right']] as const) {
          const c = lab(it.name, q[0] + dx, q[1] + dy, 48, al);
          if (fits(c.b, avoid, 8)) { L = c; break search; }
        }
      }

    // nothing beside the curve is free: the free spot on the grid nearest the curve (within 260 px), else (above) any
    // spot beside it that only avoids the other labels
    const near = (b: Box) => Math.min(...pts.map(q => Math.hypot(Math.max(b.x0 - q[0], 0, q[0] - b.x1), Math.max(b.y0 - q[1], 0, q[1] - b.y1))));
    if (L && hitsLines(L.b, [...polys, ...axisLines], 4)) {
      let best: Lab | null = null, bd = 260;
      for (let gxp = gx0 + 20; gxp < gx1; gxp += 30) for (let gyp = gy0 + 40; gyp < gy1 - 20; gyp += 24) {
        const c = lab(it.name, gxp, gyp, 48, 'left');
        if (!fits(c.b, [...polys, ...axisLines], 8)) continue;
        const d = near(c.b);
        if (d < bd) { bd = d; best = c; }
      }
      if (best) L = best;
    }
    if (!L) { dropped.push(it.key); continue; }
    placed.push(L.b); names.set(it.key, L);
  }

  // ----- drawing helpers -----
  const ink = DUSK.cream;
  const col = (c: Paint) => paint(th, c, 'fill');
  function words(c: Canvas, L: Lab, cl: Paint, k: number, weight = 600): void { drawWords(c, L.t, L.x, L.y, cl, k, { size: L.size, align: L.align, weight }); }
  function plate(c: Canvas, B: Box, k: number): void {
    if (k <= 0) return;
    const { g } = c;
    g.save(); g.globalAlpha *= clamp(k) * 0.92; g.fillStyle = '#1A1E44';
    g.beginPath(); g.roundRect(B.x0 - 10, B.y0 - 6, B.w + 20, B.h + 12, 10); g.fill(); g.restore();
  }
  function glowRing(c: Canvas, B: Box, cl: Paint, k: number, r = 14): void {
    if (k <= 0) return;
    const { g } = c;
    g.save(); g.globalAlpha *= clamp(k);
    g.strokeStyle = col(cl); g.lineWidth = 5;
    g.shadowColor = col(cl); g.shadowBlur = 10 * th.glow * Math.hypot(g.getTransform().a, g.getTransform().b);
    g.beginPath(); g.roundRect(B.x0 - 8, B.y0 - 6, B.w + 16, B.h + 12, r); g.stroke(); g.restore();
  }
  function stroke(c: Canvas, P: readonly Pt[], cl: Paint, w: number, dash?: number[]): void {
    if (P.length < 2) return;
    const { g } = c;
    g.save(); g.strokeStyle = col(cl); g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round';
    if (dash) g.setLineDash(dash);
    g.beginPath(); g.moveTo(P[0]![0], P[0]![1]); for (const q of P.slice(1)) g.lineTo(q[0], q[1]); g.stroke(); g.restore();
  }
  /** the first k of a polyline's length */
  function head(P: readonly Pt[], len: number): Pt[] {
    const out: Pt[] = [P[0]!];
    let left = len;
    for (let i = 1; i < P.length && left > 0; i++) {
      const a = P[i - 1]!, b = P[i]!, d = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (d <= left) { out.push(b); left -= d; } else { const t = left / d; out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); left = 0; }
    }
    return out;
  }
  function point(c: Canvas, at: Pt, k: number, cl: Paint, open = false, r = 11): void {
    if (k <= 0) return;
    dot(c, at[0], at[1], (r + 3) * k, DUSK.ink);
    if (open) { dot(c, at[0], at[1], r * k, cl); dot(c, at[0], at[1], (r - 4.5) * k, '#262B57'); }
    else dot(c, at[0], at[1], r * k, cl);
  }
  const clipGrid = (c: Canvas, fn: () => void) => { const { g } = c; g.save(); g.beginPath(); g.rect(gx0, gy0, gx1 - gx0, gy1 - gy0); g.clip(); fn(); g.restore(); };
  const defCol: Record<PItem['kind'], Paint> = { curve: 'link', point: 'first', seg: 'pick', vline: 'dim', hline: 'dim', shade: 'link', text: 'ink' };

  function draw(c: Canvas, P: Progress<string>, f: PFocus = {}): void {
    const kA = P.k('axes'), kTk = P.k('ticks');
    const dimmed = new Set(f.dim ?? []);
    if (kA > 0) {
      withAlpha(c, E.smooth(clamp(kA * 2)), () => {
        wash(c, rectPts(cardBox.x0, cardBox.y0, cardBox.w, cardBox.h, 18), '#262B57', { seed: 41, rough: 1.3, ink: DUSK.ink, inkW: 3, shade: 0.25 });
        const { g } = c;
        g.save(); g.strokeStyle = '#4A4F82'; g.lineWidth = 2;
        for (let i = 0; i <= nx; i++) { const x = gx0 + i * cellX; g.beginPath(); g.moveTo(x, gy0); g.lineTo(x, gy1); g.stroke(); }
        for (let i = 0; i <= ny; i++) { const y = gy1 - i * cellY; g.beginPath(); g.moveTo(gx0, y); g.lineTo(gx1, y); g.stroke(); }
        g.restore();
      });
      const kax = E.inOut(clamp(kA * 1.6 - 0.2));
      if (inY(0)) { const y = px(0, 0)[1]; stroke(c, [[gx0, y], [gx0 + (gx1 + 8 - gx0) * kax, y]], ink, 4); }
      if (inX(0)) { const x = px(0, 0)[0]; stroke(c, [[x, gy1], [x, gy1 + (gy0 - 8 - gy1) * kax]], ink, 4); }
      const kl = E.smooth(clamp(kA * 2 - 0.9));
      const kxt = X.ticks === false ? Math.min(kl, kTk) : kl, kyt = Y.ticks === false ? Math.min(kl, kTk) : kl;
      const inside = yAxisX !== gx0 || xAxisY !== gy1;
      for (const L of xTicks) { if (inside) plate(c, L.b, kxt * 0.8); words(c, L, 'dim', kxt); }
      for (const L of yTicks) { if (inside) plate(c, L.b, kyt * 0.8); words(c, L, 'dim', kyt); }
      if ((f.heads ?? 0) > 0) for (const L of [xNameL, yNameL]) if (L) glowRing(c, L.b, 'pick', f.heads!, 10);
      if (xNameL) words(c, xNameL, 'ink', kl, 650);
      if (yNameL) words(c, yNameL, 'ink', kl, 650);
    }
    // shades first, then lines, curves, segments, points, texts and names on top
    const order: PItem['kind'][] = ['shade', 'vline', 'hline', 'curve', 'seg', 'point', 'text'];
    for (const kind of order) for (const it of items) {
      if (it.kind !== kind) continue;
      const k = P.k(it.key);
      if (k <= 0) continue;
      const cl = it.col ?? defCol[kind];
      withAlpha(c, dimmed.has(it.key) ? 0.3 : 1, () => {
        if (it.kind === 'shade') {
          const n = Math.max(30, Math.ceil((px(it.hi, 0)[0] - px(it.lo, 0)[0]) / 4));
          const xs = Array.from({ length: n + 1 }, (_, i) => it.lo + (it.hi - it.lo) * i / n);
          const yAt = (b: PShade['top'] | PShade['bottom'], x: number) => (b === 'top' ? Y.max + band : b === 'bottom' ? Y.min - band : b(x));
          clipGrid(c, () => withAlpha(c, (it.alpha ?? 0.3) * E.smooth(clamp(k)), () => {
            const { g } = c;
            g.fillStyle = col(cl); g.beginPath();
            xs.forEach((x, i) => { const q = px(x, yAt(it.top, x)); if (i) g.lineTo(q[0], q[1]); else g.moveTo(q[0], q[1]); });
            for (const x of [...xs].reverse()) { const q = px(x, yAt(it.bottom, x)); g.lineTo(q[0], q[1]); }
            g.closePath(); g.fill();
          }));
        } else if (it.kind === 'vline' || it.kind === 'hline') {
          const a: Pt = it.kind === 'vline' ? px(it.x, Y.min) : px(X.min, it.y), b: Pt = it.kind === 'vline' ? px(it.x, Y.max) : px(X.max, it.y);
          stroke(c, [a, [a[0] + (b[0] - a[0]) * E.inOut(k), a[1] + (b[1] - a[1]) * E.inOut(k)]], cl, 4, it.dash === false ? undefined : [14, 11]);
        } else if (it.kind === 'curve') {
          const R = curveRuns.get(it.key)!, total = curveLen.get(it.key)!;
          let left = total * E.inOut(clamp(k));
          clipGrid(c, () => {
            for (const r of R) {
              if (left <= 0) break;
              const h = head(r, left);
              stroke(c, h, cl, it.w ?? 5, it.dash ? [16, 12] : undefined);
              left -= r.slice(1).reduce((t, q, i) => t + Math.hypot(q[0] - r[i]![0], q[1] - r[i]![1]), 0);
            }
          });
          if (k >= 0.98) (it.ends ?? ['none', 'none']).forEach((e, j) => {
            if (e === 'none') return;
            const x = j === 0 ? it.lo! : it.hi!;
            point(c, px(x, it.f(x)), 1, cl, e === 'open', 10);
          });
        } else if (it.kind === 'seg') {
          const a = px(it.a[0], it.a[1]), b = px(it.b[0], it.b[1]), kk = E.inOut(clamp(k));
          const e: Pt = [a[0] + (b[0] - a[0]) * kk, a[1] + (b[1] - a[1]) * kk];
          stroke(c, [a, e], cl, it.w ?? 5, it.dash ? [14, 10] : undefined);
          if (it.arrow && kk > 0.2) {
            const ang = Math.atan2(b[1] - a[1], b[0] - a[0]), L = 26;
            stroke(c, [[e[0] - L * Math.cos(ang - 0.45), e[1] - L * Math.sin(ang - 0.45)], e, [e[0] - L * Math.cos(ang + 0.45), e[1] - L * Math.sin(ang + 0.45)]], cl, it.w ?? 5);
          }
        } else if (it.kind === 'point') {
          point(c, px(it.x, it.y), Math.max(0, E.back(clamp(k))), cl, it.open);
        } else if (it.kind === 'text') {
          const L = texts.get(it.key)!;
          plate(c, L.b, clamp(k)); words(c, L, cl, clamp(k), 700);
        }
        const N = names.get(it.key);
        if (N) { const kn = it.kind === 'curve' ? clamp(k * 1.4 - 0.4) : clamp(k); plate(c, N.b, kn); words(c, N, cl, kn, 700); }
      });
    }
    // the trace: a point riding a curve, with its coordinates
    if (f.trace && f.trace.k > 0) {
      const C = items.find((i): i is PCurve => i.kind === 'curve' && i.key === f.trace!.key);
      const x = f.trace.x, y = C ? C.f(x) : NaN;
      if (C && inX(x) && Number.isFinite(y) && inY(y)) {
        const at = px(x, y), cl = f.trace.col ?? 'pick';
        point(c, at, f.trace.k, cl);
        const q = 10 ** (f.trace.digits ?? 2), t = `(${fmtN(Math.round(x * q) / q)}, ${fmtN(Math.round(y * q) / q)})`;
        const right = at[0] < (gx0 + gx1) / 2;
        const al = right ? 'left' : 'right', dx = right ? 26 : -26;
        const cands = [lab(t, at[0] + dx, at[1] - 46, 44, al), lab(t, at[0] + dx, at[1] + 48, 44, al), lab(t, at[0] - dx, at[1] - 46, 44, right ? 'right' : 'left'), lab(t, at[0] - dx, at[1] + 48, 44, right ? 'right' : 'left')];
        const free = (b: Box) => b.y0 >= gy0 + 4 && b.y1 <= gy1 - 4 && b.x0 >= gx0 + 4 && b.x1 <= gx1 - 4 && ![...names.values(), ...texts.values()].some(o => b.x0 < o.b.x1 + 8 && o.b.x0 - 8 < b.x1 && b.y0 < o.b.y1 + 6 && o.b.y0 - 6 < b.y1);
        const L = cands.find(q => free(q.b)) ?? cands[0]!;
        plate(c, L.b, f.trace.k); words(c, L, cl, f.trace.k, 700);
      }
    }
    for (const r of f.ring ?? []) glowRing(c, where(r.key), r.col, r.k, 18);
  }

  function where(key: string): Box {
    const it = items.find(i => i.key === key);
    check(it, NAME, `no item ${key}`);
    if (it!.kind === 'point') return dotBox(it!.x, it!.y);
    if (it!.kind === 'text') return texts.get(key)!.b;
    const N = names.get(key);
    if (N) return N.b;
    if (it!.kind === 'curve') { const r = curveRuns.get(key)!.flat(), q = r[r.length - 1]!; return box(q[0] - 10, q[1] - 10, q[0] + 10, q[1] + 10); }
    if (it!.kind === 'seg') { const q = px(it!.b[0], it!.b[1]); return box(q[0] - 10, q[1] - 10, q[0] + 10, q[1] + 10); }
    if (it!.kind === 'vline') { const q = px(it!.x, Y.max); return box(q[0] - 10, q[1], q[0] + 10, q[1] + 20); }
    if (it!.kind === 'hline') { const q = px(X.max, it!.y); return box(q[0] - 20, q[1] - 10, q[0], q[1] + 10); }
    const s = it as PShade;
    const a = px(s.lo, Y.max), b = px(s.hi, Y.min);
    return box(a[0], a[1], b[0], b[1]);
  }
  const snap = (v: number, step: number, axis: 'x' | 'y') => {
    const A = axis === 'x' ? X : Y;
    return Math.min(A.max, Math.max(A.min, Math.round(v / step) * step));
  };
  return { kind: 'Plane', box: cardBox, grid, dropped, px, toData, snap, where, draw };
}
