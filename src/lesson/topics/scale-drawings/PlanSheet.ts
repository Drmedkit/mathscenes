// PlanSheet: a scale drawing the way it is made by hand. A blueprint sheet with a grid (1 in or 1 cm squares), the
// drawn figures (rooms, gardens, shapes) with their side lengths written OUTSIDE each side, the scale legend above the
// sheet, and a ruler under it, to scale with the drawing, whose second row gives what each inch / centimeter stands
// for (0, 4, 8, 12, 16 ft): the legend made visible.
//   legend   the scale tag above the sheet ("Scale 1 in : 4 ft"; drawing part amber, actual part teal)
//   sheet    the blueprint paper and its grid
//   figs     the figures (wash + crisp outline), one after another
//   labels   side labels (drawing lengths, amber); labels2 crossfade them into a second set (actual lengths, teal)
//   marks    right-angle marks and angle arcs with their size
//   names    captions under figures (A, B, C)
//   ruler    the ruler (zero inset from its edge, as on a real ruler), ticks to 1/4 in or 1/2 cm
//   seg      a measured segment grows along the ruler's edge; `actual` the row of actual lengths under it
//   zoom     one grid square blown up into k x k squares (why area grows by k x k)
// Layout is computed in a Frame (px per unit as big as fits); the block throws BlockError when a label would sit on a
// line, leave the sheet or run into another label, so a picture that cannot be read is never drawn.
import { type Box, type Pt, box, clamp, lerp } from '../../../core/math';
import { type Canvas, dot, strokePts, withAlpha } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Progress } from '../../../core/clock';
import { type Paint, paint } from '../../../core/theme';
import { type Formula, tex, texBox, texDraw } from '../../../core/tex';
import { type Frame, check } from '../../../blocks/block';
import { rectPts } from '../../../core/pts';
import { drawWords, wordsBox } from '../../words';
import { inkLine, wash } from '../../wash';
import { DUSK } from '../../dusk';

export type PlanStep = 'legend' | 'sheet' | 'figs' | 'labels' | 'labels2' | 'marks' | 'names' | 'ruler' | 'seg' | 'actual' | 'zoom';
export const PLAN_STEPS: readonly PlanStep[] = ['legend', 'sheet', 'figs', 'labels', 'marks', 'names', 'ruler', 'seg', 'actual', 'labels2', 'zoom'];

export interface PlanFig {
  /** vertices in drawing units (x right, y down) */
  pts: [number, number][];
  /** where the figure's (0, 0) sits on the sheet, units (default: the layout places it) */
  at?: [number, number];
  /** the wash role (default 'first': the drawing) */
  col?: Paint;
  /** TeX label per side i (pts[i] -> pts[i+1]); null = none */
  labels?: (string | null)[];
  /** a second label set that crossfades in on the 'labels2' step (the actual lengths, the answer) */
  labels2?: (string | null)[];
  labelCol?: Paint; label2Col?: Paint;
  /** the step key of each side's second label (default 'labels2'), so sides can turn one at a time */
  labels2Keys?: (string | null)[];
  /** a colour per side for the first label set (overrides labelCol) */
  labelCols?: (Paint | null)[];
  /** a caption under the figure ("A") */
  name?: string;
  /** right-angle marks at every square corner */
  right?: boolean;
  /** an arc with its size at a vertex */
  angles?: { at: number; text: string; text2?: string }[];
  /** a pencil outline without fill (a drawing still to be made) */
  dashed?: boolean;
  /** this figure appears on its own step key instead of 'figs' (e.g. 'fig2') */
  key?: string;
}
export interface RulerSpec {
  /** whole units long */
  len: number;
  /** subdivisions per unit (4 = quarter inches, 2 = half centimeters, 10 = millimeters) */
  ticks: number;
  /** sheet x (units) under which the ruler's zero sits (default: the left edge of the first figure) */
  zeroAt?: number;
  /** a measured segment along the edge, ruler units */
  seg?: [number, number]; segCol?: Paint;
  /** a start dot on the edge */
  start?: number;
  /** candidate end marks with names (A, B, C) */
  marks?: { at: number; name: string }[];
  /** the second row: what every `every` drawing units stand for */
  actual?: { per: number; unit: string; every?: number };
  /** dashed projection lines from the ends of this side down to the ruler (focus.proj) */
  proj?: { fig: number; side: number };
}
export interface PlanParams {
  unit: 'in' | 'cm';
  figs: PlanFig[];
  /** TeX of the scale tag; tag the drawing part \cssId{d}{...} and the actual part \cssId{a}{...} */
  legend?: string;
  ruler?: RulerSpec;
  /** draw the sheet (default true); false = a ruler on its own */
  sheet?: boolean;
  grid?: boolean;
  /** fixed sheet size in units (a page); figures then need `at` */
  size?: [number, number];
  /** a caption of the sheet's size, beside it (page items): [width TeX, height TeX] */
  sizeLabels?: [string, string];
  /** px per unit cap */
  maxPx?: number;
  /** one grid square at (x, y) (sheet units, top-left) blown up into k x k squares; `side` is the TeX of one side */
  zoom?: { cell: [number, number]; k: number; side: string };
}
export interface PlanFocus {
  /** a side glows in a role colour */
  side?: { fig: number; side: number; col: Paint; k: number };
  /** a figure lights up in a role colour */
  fig?: { fig: number; col: Paint; k: number };
  /** the ruler's projection lines */
  proj?: number;
  /** dim everything but the focus (0..1) */
  dim?: number;
}
export interface PlanBlock {
  readonly kind: 'PlanSheet';
  readonly u: number;
  readonly box: Box;
  readonly steps: readonly PlanStep[];
  readonly where: {
    sheet: Box; legend: Box;
    fig(i: number): Box;
    /** a small box at the middle of a side */ side(i: number, s: number): Box;
    label(i: number, s: number): Box; label2(i: number, s: number): Box;
    ruler: Box; seg: Box;
    /** the point on the ruler's edge at ruler reading x */ edge(x: number): Box;
    zoom: Box; zoomCell: Box;
  };
  draw(c: Canvas, p: Progress<string>, f?: PlanFocus): void;
}

const NAME = 'PlanSheet';
const LBL = 60, LEG = 50, ACT = 48, RULER_H = 98, PAPER = '#1C3A70', GRIDC = '#4C6CAA', RULER = '#E8DCC0', RULER_INK = '#2A2238';
interface Lbl { src: string; F: Formula; x: number; y: number; box: Box; col: Paint }

/** does segment a-b cross box b (Liang-Barsky) */
function segHits(a: Pt, b: Pt, r: Box): boolean {
  let t0 = 0, t1 = 1;
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const P = [-dx, dx, -dy, dy], Qs = [a[0] - r.x0, r.x1 - a[0], a[1] - r.y0, r.y1 - a[1]];
  for (let i = 0; i < 4; i++) {
    const p = P[i]!, qq = Qs[i]!;
    if (p === 0) { if (qq < 0) return false; continue; }
    const t = qq / p;
    if (p < 0) { if (t > t1) return false; if (t > t0) t0 = t; } else { if (t < t0) return false; if (t < t1) t1 = t; }
  }
  return true;
}
function inside(P: readonly Pt[], x: number, y: number): boolean {
  let o = false;
  for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
    const a = P[i]!, b = P[j]!;
    if ((a[1] > y) !== (b[1] > y) && x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0]) o = !o;
  }
  return o;
}
const overlap = (a: Box, b: Box, g = 8) => a.x0 < b.x1 + g && b.x0 < a.x1 + g && a.y0 < b.y1 + g && b.y0 < a.y1 + g;

export function PlanSheet(p: PlanParams, fr: Frame): PlanBlock {
  const sheetOn = p.sheet !== false;
  const R = p.ruler;
  const hasLabels = p.figs.some(f => f.labels?.some(Boolean) || f.labels2?.some(Boolean));
  const hasNames = p.figs.some(f => f.name);
  const maxU = p.maxPx ?? (p.unit === 'in' ? 140 : 72);
  const zoomW = p.zoom ? 380 : 0;
  const legH = p.legend ? 84 : 0;
  const rulerH = R ? 34 + RULER_H + (R.actual ? 76 : 0) + (R.marks || R.start !== undefined ? 64 : 0) : 0;

  // ---- content box in units ----
  const figs = p.figs.map(f => ({ ...f, at: f.at ?? [0, 0] as [number, number] }));
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const f of figs) for (const [x, y] of f.pts) { x0 = Math.min(x0, x + f.at[0]); y0 = Math.min(y0, y + f.at[1]); x1 = Math.max(x1, x + f.at[0]); y1 = Math.max(y1, y + f.at[1]); }
  if (!figs.length) { x0 = 0; y0 = 0; x1 = 0; y1 = 0; }

  // the room the side labels need around the figures, per side of the sheet (a label sits outside its side)
  let nL = 46, nR = 46, nT = 46, nB = 46;
  for (const f of figs) {
    const U = f.pts.map(([x, y]) => [x + f.at[0], y + f.at[1]] as Pt);
    U.forEach((a, s) => {
      const b = U[(s + 1) % U.length]!, len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      let nx = (b[1] - a[1]) / len, ny = -(b[0] - a[0]) / len;
      if (inside(U, (a[0] + b[0]) / 2 + nx * 0.01, (a[1] + b[1]) / 2 + ny * 0.01)) { nx = -nx; ny = -ny; }
      for (const src of [f.labels?.[s], f.labels2?.[s]]) {
        if (!src) continue;
        const bb = texBox(tex(src) as Formula, 0, 0, { size: LBL, align: 'center' });
        if (Math.abs(nx) >= Math.abs(ny)) { if (nx > 0) nR = Math.max(nR, bb.w + 52); else nL = Math.max(nL, bb.w + 52); }
        else if (ny > 0) nB = Math.max(nB, bb.h + 52); else nT = Math.max(nT, bb.h + 52);
      }
    });
  }
  void hasLabels;
  let u = maxU, mL = 1, mR = 1, mT = 1, mB = 1, mb = 0, sw = 0, sh = 0;
  if (sheetOn) {
    for (let it = 0; it < 6; it++) {
      if (p.size) { [sw, sh] = p.size; mL = mR = mT = mB = 0; mb = 0; }
      else {
        mL = Math.max(1, Math.ceil(nL / u)); mR = Math.max(1, Math.ceil(nR / u)); mT = Math.max(1, Math.ceil(nT / u)); mB = Math.max(1, Math.ceil(nB / u));
        mb = hasNames ? Math.max(0, Math.ceil(76 / u) - mB + 1) : 0;
        sw = Math.ceil(x1 - Math.floor(x0)) + mL + mR;
        sh = Math.ceil(y1 - Math.floor(y0)) + mT + mB + mb;
      }
      const availW = fr.w - zoomW - (p.sizeLabels ? 170 : 0) - 10, availH = fr.h - legH - rulerH - (p.sizeLabels ? 70 : 0) - 6;
      u = Math.min(maxU, availW / sw, availH / sh);
      if (R) u = Math.min(u, (fr.w - 40) / (R.len + 0.7));
    }
    check(u >= 26, NAME, `the grid is too small to read (${u.toFixed(1)} px per ${p.unit})`);
  } else {
    check(!!R, NAME, 'no sheet and no ruler');
    u = Math.min(p.maxPx ?? 200, (fr.w - 80) / (R!.len + 0.7));
    check(u >= 60, NAME, 'the ruler is too small to read');
  }
  const shiftX = p.size ? 0 : mL - Math.floor(x0), shiftY = p.size ? 0 : mT - Math.floor(y0);
  const sheetWpx = sw * u, sheetHpx = sh * u;
  const usedW = sheetOn ? sheetWpx + zoomW + (p.sizeLabels ? 170 : 0) : 0;
  const SX = sheetOn ? Math.round(fr.x + Math.max(0, (fr.w - usedW) / 2)) : fr.x;
  const blockH = legH + (sheetOn ? sheetHpx + (p.sizeLabels ? 70 : 0) : 0) + rulerH;
  const top = fr.y + Math.max(0, (fr.h - blockH) / 2);
  const SY = Math.round(top + legH);
  const sheet = sheetOn ? box(SX, SY, SX + sheetWpx, SY + sheetHpx) : box(SX, SY, SX, SY);
  const toPx = (f: typeof figs[number], [x, y]: [number, number]): Pt => [SX + (x + f.at[0] + shiftX) * u, SY + (y + f.at[1] + shiftY) * u];
  const P = figs.map(f => f.pts.map(v => toPx(f, v)));
  const fbox = (i: number): Box => { const Q = P[i]!; return box(Math.min(...Q.map(v => v[0])), Math.min(...Q.map(v => v[1])), Math.max(...Q.map(v => v[0])), Math.max(...Q.map(v => v[1]))); };
  const area2 = (Q: Pt[]) => { let s = 0; for (let i = 0; i < Q.length; i++) { const a = Q[i]!, b = Q[(i + 1) % Q.length]!; s += a[0] * b[1] - b[0] * a[1]; } return s; };

  // ---- side labels: outside each side, on a pad (no grid line through a digit) ----
  const bound = sheetOn ? sheet : box(fr.x, fr.y, fr.x + fr.w, fr.y + fr.h);
  function placeLabel(fi: number, s: number, src: string, col: Paint): Lbl {
    const Q = P[fi]!, a = Q[s]!, b = Q[(s + 1) % Q.length]!;
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    check(len >= 30, NAME, `side ${s} is too short to label`);
    let nx = (b[1] - a[1]) / len, ny = -(b[0] - a[0]) / len;
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
    if (inside(Q, mx + nx * 6, my + ny * 6)) { nx = -nx; ny = -ny; }
    const F = tex(src) as Formula;
    const b0 = texBox(F, 0, 0, { size: LBL, align: 'center' });
    const ext = Math.abs(nx) * b0.w / 2 + Math.abs(ny) * b0.h / 2 + 18;
    const x = mx + nx * ext, y = my + ny * ext - (b0.cy - 0);
    const bb = texBox(F, x, y, { size: LBL, align: 'center' });
    return { src, F, x, y, box: bb, col };
  }
  const L1: (Lbl | null)[][] = figs.map((f, i) => f.pts.map((_, s) => (f.labels?.[s] ? placeLabel(i, s, f.labels[s]!, f.labelCols?.[s] ?? f.labelCol ?? 'first') : null)));
  const L2: (Lbl | null)[][] = figs.map((f, i) => f.pts.map((_, s) => (f.labels2?.[s] ? placeLabel(i, s, f.labels2[s]!, f.label2Col ?? 'second') : null)));
  for (const set of [L1, L2]) {
    const all = set.flat().filter((l): l is Lbl => !!l);
    for (const l of all) {
      check(l.box.x0 >= bound.x0 + 4 && l.box.x1 <= bound.x1 - 4 && l.box.y0 >= bound.y0 + 4 && l.box.y1 <= bound.y1 - 4, NAME, `a side label leaves the sheet`);
      for (const Q of P) for (let i = 0; i < Q.length; i++) check(!segHits(Q[i]!, Q[(i + 1) % Q.length]!, l.box), NAME, 'a side label sits on a line');
      for (const Q of P) check(!inside(Q, l.box.cx, l.box.cy), NAME, 'a side label sits inside a figure');
    }
    for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) check(!overlap(all[i]!.box, all[j]!.box, 10), NAME, 'two side labels overlap');
  }
  // captions
  const names = figs.map((f, i) => {
    if (!f.name) return null;
    const b = fbox(i), y = b.y1 + 48;
    const bb = wordsBox(f.name, b.cx, y, { size: 48, align: 'center', weight: 700 });
    return { text: f.name, x: b.cx, y, box: bb };
  });
  for (const nm of names) if (nm) {
    check(nm.box.y1 <= bound.y1 - 2, NAME, `the caption ${nm.text} leaves the sheet`);
    for (const l of [...L1.flat(), ...L2.flat()]) if (l) check(!overlap(l.box, nm.box, 6), NAME, `the caption ${nm.text} runs into a label`);
  }
  // legend tag
  const LF = p.legend ? (tex(p.legend) as Formula) : null;
  const legY = SY - 46;
  const legBox = LF ? texBox(LF, SX + 6, legY, { size: LEG, align: 'left' }) : box(SX, legY, SX, legY);
  if (LF) check(legBox.x1 <= fr.x + fr.w + 10, NAME, 'the legend is too wide');
  // page size labels (beside the sheet)
  const SL = p.sizeLabels ? p.sizeLabels.map(s => tex(s) as Formula) : null;

  // ---- ruler ----
  const rTop = (sheetOn ? sheet.y1 + 34 : SY + 10) + (R?.marks || R?.start !== undefined ? 64 : 0);
  const zeroUnits = R?.zeroAt ?? (figs.length ? Math.min(...figs[0]!.pts.map(v => v[0] + figs[0]!.at[0])) : 0);
  const RX = sheetOn ? SX + (zeroUnits + shiftX) * u : Math.round(fr.x + (fr.w - (R?.len ?? 0) * u) / 2);
  const rx = (v: number) => RX + v * u;
  const rBody = R ? box(rx(-0.32), rTop, Math.max(rx(R.len + 0.32), rx(R.len) + 64), rTop + RULER_H) : box(0, 0, 0, 0);
  if (R) {
    check(rBody.x0 >= fr.x - 30 && rBody.x1 <= fr.x + fr.w + 60, NAME, 'the ruler does not fit');
    if (R.marks) {
      const xs = R.marks.map(mk => rx(mk.at)).sort((a, b) => a - b);
      for (let i = 1; i < xs.length; i++) check(xs[i]! - xs[i - 1]! >= 56, NAME, 'two ruler marks too close to name');
    }
  }
  const actY = rTop + RULER_H + 42;
  const actFmt = (v: number) => String(Number(v.toFixed(4)));
  /** the real values must not touch each other: show every unit, or every 2nd, 3rd ... when they get wide */
  const roomy = (every: number) => {
    let prev = -Infinity;
    for (let i = 0; i <= R!.len; i += every) {
      const b = wordsBox(actFmt(i * R!.actual!.per), rx(i), actY, { size: ACT, align: 'center', weight: 700 });
      if (b.x0 <= prev + 26) return false;
      prev = b.x1;
    }
    return true;
  };
  let actEvery = R?.actual ? (R.actual.every ?? 1) : 1;
  if (R?.actual) {
    while (!roomy(actEvery) && actEvery < R.len) actEvery++;
    check(roomy(actEvery), NAME, 'the actual lengths under the ruler are too crowded');
  }
  // ---- zoom ----
  const Z = p.zoom ? Math.min(300, zoomW - 70, sheetHpx - 60) : 0;
  const zoomBox = p.zoom ? box(sheet.x1 + zoomW - Z - 10, sheet.cy - Z / 2 + 20, sheet.x1 + zoomW - 10, sheet.cy + Z / 2 + 20) : box(0, 0, 0, 0);
  const cellBox = p.zoom ? box(SX + (p.zoom.cell[0] + shiftX) * u, SY + (p.zoom.cell[1] + shiftY) * u, SX + (p.zoom.cell[0] + shiftX + 1) * u, SY + (p.zoom.cell[1] + shiftY + 1) * u) : box(0, 0, 0, 0);
  const ZF = p.zoom ? (tex(p.zoom.side) as Formula) : null;
  if (p.zoom) check(Z >= 200, NAME, 'no room for the zoom');

  // ---------- drawing ----------
  function drawLabel(c: Canvas, l: Lbl | null, k: number, pad: boolean): void {
    if (!l || k <= 0) return;
    withAlpha(c, E.smooth(clamp(k)), () => {
      if (pad && sheetOn && p.grid !== false) { c.g.save(); c.g.fillStyle = PAPER; c.g.beginPath(); c.g.roundRect(l.box.x0 - 10, l.box.y0 - 8, l.box.w + 20, l.box.h + 16, 10); c.g.fill(); c.g.restore(); }
      texDraw(c, l.F.pending ? tex(l.src) : l.F, l.x, l.y, { size: LBL, align: 'center', col: l.col });
    });
  }
  function rightMarks(c: Canvas, Q: Pt[], col: Paint): void {
    const sgn = Math.sign(area2(Q)) || 1;
    for (let i = 0; i < Q.length; i++) {
      const v = Q[i]!, a = Q[(i - 1 + Q.length) % Q.length]!, b = Q[(i + 1) % Q.length]!;
      const ax = a[0] - v[0], ay = a[1] - v[1], bx = b[0] - v[0], by = b[1] - v[1];
      const la = Math.hypot(ax, ay), lb = Math.hypot(bx, by);
      if (Math.abs((ax * bx + ay * by) / (la * lb)) > 0.02) continue;
      // interior corner only (convex at this vertex)
      const cross = (v[0] - a[0]) * (b[1] - v[1]) - (v[1] - a[1]) * (b[0] - v[0]);
      if (Math.sign(cross) !== sgn) continue;
      const s = Math.min(26, la / 4, lb / 4), ux = (ax / la) * s, uy = (ay / la) * s, wx = (bx / lb) * s, wy = (by / lb) * s;
      strokePts(c, [[v[0] + ux, v[1] + uy], [v[0] + ux + wx, v[1] + uy + wy], [v[0] + wx, v[1] + wy]], { col, lw: 3 });
    }
  }
  function angleMark(c: Canvas, Q: Pt[], i: number, text: string, col: Paint, text2?: string, k2 = 0): void {
    const v = Q[i]!, a = Q[(i - 1 + Q.length) % Q.length]!, b = Q[(i + 1) % Q.length]!;
    const t0 = Math.atan2(a[1] - v[1], a[0] - v[0]), t1 = Math.atan2(b[1] - v[1], b[0] - v[0]);
    let d = t1 - t0; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
    const r = 44, pts: Pt[] = [];
    for (let j = 0; j <= 20; j++) { const t = t0 + (d * j) / 20; pts.push([v[0] + r * Math.cos(t), v[1] + r * Math.sin(t)]); }
    strokePts(c, pts, { col, lw: 3.5 });
    const tm = t0 + d / 2;
    const tx = v[0] + 92 * Math.cos(tm), ty = v[1] + 92 * Math.sin(tm);
    drawWords(c, text, tx, ty, col, text2 ? 1 - k2 : 1, { size: 44, align: 'center', weight: 700 });
    if (text2 && k2 > 0) drawWords(c, text2, tx, ty, 'link', k2, { size: 44, align: 'center', weight: 700 });
  }

  function draw(c: Canvas, pr: Progress<string>, f: PlanFocus = {}): void {
    const kLeg = pr.k('legend'), kSh = pr.k('sheet'), kL = pr.k('labels'), kM = pr.k('marks'), kN = pr.k('names');
    const kR = pr.k('ruler'), kS = pr.k('seg'), kA = pr.k('actual'), kZ = pr.k('zoom');
    const dim = clamp(f.dim ?? 0);
    if (sheetOn && kSh > 0) withAlpha(c, E.smooth(kSh), () => {
      wash(c, rectPts(sheet.x0 - 6, sheet.y0 - 6, sheet.w + 12, sheet.h + 12, 8), PAPER, { seed: 21, rough: 1.4, ink: DUSK.ink, inkW: 3, shade: 0.2 });
      if (p.grid !== false) {
        const g: Pt[][] = [];
        for (let i = 0; i <= sw; i++) g.push([[sheet.x0 + i * u, sheet.y0], [sheet.x0 + i * u, sheet.y1]]);
        for (let j = 0; j <= sh; j++) g.push([[sheet.x0, sheet.y0 + j * u], [sheet.x1, sheet.y0 + j * u]]);
        for (const L of g) strokePts(c, L, { col: GRIDC as Paint, lw: 1.6, alpha: 0.75 });
      }
    });
    // page size labels
    if (SL && kSh > 0) withAlpha(c, E.smooth(kSh), () => {
      texDraw(c, SL[0]!, sheet.cx, sheet.y1 + 44, { size: LBL, align: 'center', col: 'first' });
      texDraw(c, SL[1]!, sheet.x1 + 24, sheet.cy, { size: LBL, align: 'left', col: 'first' });
    });
    if (LF && kLeg > 0) texDraw(c, LF, SX + 6, legY, { size: LEG, align: 'left', k: kLeg, col: 'dim', tags: { d: { col: 'first' }, a: { col: 'second' } } as never });
    // figures
    figs.forEach((fg, i) => {
      const kF = pr.k(fg.key ?? 'figs');
      if (kF <= 0) return;
      const Q = P[i]!;
      const lit = f.fig?.fig === i ? clamp(f.fig.k) : 0;
      const dd = (f.fig && f.fig.fig !== i) || (f.side && f.side.fig !== i) ? dim : 0;
      withAlpha(c, E.smooth(kF) * (1 - 0.5 * dd), () => {
        if (!fg.dashed) {
          withAlpha(c, 0.55, () => wash(c, Q, fg.col ?? 'first', { seed: 40 + i, rough: 1.2, ink: null, shade: 0.15 }));
          if (lit > 0) withAlpha(c, 0.6 * lit, () => wash(c, Q, f.fig!.col, { seed: 60 + i, rough: 1.2, ink: null, shade: 0.1 }));
          // the grid shows through the drawing (squares can be counted)
          if (sheetOn && p.grid !== false) {
            c.g.save(); c.g.beginPath(); Q.forEach((v, j) => (j ? c.g.lineTo(v[0], v[1]) : c.g.moveTo(v[0], v[1]))); c.g.closePath(); c.g.clip();
            for (let gx = 0; gx <= sw; gx++) strokePts(c, [[sheet.x0 + gx * u, sheet.y0], [sheet.x0 + gx * u, sheet.y1]], { col: '#0E1E3E', lw: 1.6, alpha: 0.35 });
            for (let gy = 0; gy <= sh; gy++) strokePts(c, [[sheet.x0, sheet.y0 + gy * u], [sheet.x1, sheet.y0 + gy * u]], { col: '#0E1E3E', lw: 1.6, alpha: 0.35 });
            c.g.restore();
          }
          strokePts(c, Q, { col: paint(c.th, fg.col ?? 'first', 'line') as Paint, lw: 5, closed: true });
        } else {
          strokePts(c, Q, { col: DUSK.cream, lw: 3.5, closed: true, dash: [14, 10], alpha: 0.85 });
        }
      });
      if (kM > 0) withAlpha(c, E.smooth(kM) * E.smooth(kF), () => {
        if (fg.right) rightMarks(c, Q, DUSK.cream);
        for (const a of fg.angles ?? []) angleMark(c, Q, a.at, a.text, 'pick', a.text2, pr.k('labels2'));
      });
      const nm = names[i];
      if (nm && kN > 0) drawWords(c, nm.text, nm.x, nm.y, 'ink', E.smooth(kN) * E.smooth(kF), { size: 48, align: 'center', weight: 700 });
    });
    // a glowing side
    if (f.side && f.side.k > 0) {
      const Q = P[f.side.fig]!, a = Q[f.side.side]!, b = Q[(f.side.side + 1) % Q.length]!;
      strokePts(c, [a, [lerp(a[0], b[0], E.inOut(clamp(f.side.k))), lerp(a[1], b[1], E.inOut(clamp(f.side.k)))]], { col: f.side.col, lw: 9, glow: 10 });
    }
    // labels (set 1 fades out where set 2 has a label)
    figs.forEach((fg, i) => {
      const kF = pr.k(fg.key ?? 'figs');
      if (kF <= 0) return;
      fg.pts.forEach((_, s) => {
        const l1 = L1[i]![s] ?? null, l2 = L2[i]![s] ?? null;
        const k2 = l2 ? pr.k(fg.labels2Keys?.[s] ?? 'labels2') : 0;
        drawLabel(c, l1, Math.min(kL, kF) * (l2 ? 1 - k2 : 1), true);
        drawLabel(c, l2, Math.min(k2, kF), true);
      });
    });
    // the ruler
    if (R && kR > 0) withAlpha(c, E.smooth(kR), () => {
      wash(c, rectPts(rBody.x0, rBody.y0, rBody.w, rBody.h, 6), RULER, { seed: 33, rough: 0.8, ink: DUSK.ink, inkW: 2.5, shade: 0.25 });
      const n = R.len * R.ticks;
      for (let j = 0; j <= n; j++) {
        const v = j / R.ticks, whole = j % R.ticks === 0, half = R.ticks % 2 === 0 && (2 * j) % R.ticks === 0;
        const quarter = R.ticks % 4 === 0 && (4 * j) % R.ticks === 0;
        const L = whole ? 40 : half ? 28 : quarter ? 20 : 13;
        strokePts(c, [[rx(v), rTop + 2], [rx(v), rTop + L]], { col: RULER_INK as Paint, lw: whole ? 3 : 2 });
        if (whole) drawWords(c, String(v), rx(v), rTop + 66, RULER_INK as Paint, 1, { size: 40, align: 'center', weight: 700 });
      }
      drawWords(c, p.unit, rx(R.len) + 20, rTop + 66, RULER_INK as Paint, 1, { size: 30, align: 'left', weight: 600 });
      if (R.start !== undefined) { dot(c, rx(R.start), rTop - 2, 10, 'pick'); }
    });
    // projection lines from a side down to the ruler
    if (R?.proj && (f.proj ?? 0) > 0 && kR > 0) {
      const Q = P[R.proj.fig]!, a = Q[R.proj.side]!, b = Q[(R.proj.side + 1) % Q.length]!;
      for (const v of [a, b]) strokePts(c, [[v[0], v[1] + 10], [v[0], lerp(v[1] + 10, rTop - 4, E.inOut(clamp(f.proj!)))]], { col: 'first', lw: 2.5, dash: [10, 9] });
    }
    // candidate marks
    if (R?.marks && kR > 0) withAlpha(c, E.smooth(kR), () => {
      for (const mk of R.marks!) {
        const x = rx(mk.at);
        strokePts(c, [[x, rTop - 30], [x, rTop + 6]], { col: 'pick', lw: 4 });
        drawWords(c, mk.name, x, rTop - 56, 'pick', 1, { size: 46, align: 'center', weight: 700 });
      }
    });
    // the measured segment
    if (R?.seg && kS > 0) {
      const [a, b] = R.seg, xe = lerp(rx(a), rx(b), E.inOut(clamp(kS)));
      strokePts(c, [[rx(a), rTop - 9], [xe, rTop - 9]], { col: R.segCol ?? 'link', lw: 10, cap: 'round' });
      dot(c, rx(a), rTop - 9, 9, R.segCol ?? 'link');
      if (kS >= 1) dot(c, rx(b), rTop - 9, 9, R.segCol ?? 'link');
    }
    // the actual row
    if (R?.actual && kA > 0) withAlpha(c, E.smooth(kA), () => {
      for (let i = 0; i <= R.len; i += actEvery) {
        drawWords(c, actFmt(i * R.actual!.per), rx(i), actY, 'second', 1, { size: ACT, align: 'center', weight: 700 });
        strokePts(c, [[rx(i), rBody.y1 + 4], [rx(i), actY - 26]], { col: 'second', lw: 2, alpha: 0.6 });
      }
      const last = wordsBox(actFmt(R.len * R.actual!.per), rx(R.len), actY, { size: ACT, align: 'center', weight: 700 });
      drawWords(c, R.actual!.unit, last.x1 + 14, actY, 'second', 1, { size: 40, align: 'left', weight: 600 });
    });
    // zoom: one square of the drawing, blown up
    if (p.zoom && kZ > 0) {
      const k = E.smooth(clamp(kZ));
      withAlpha(c, k, () => {
        wash(c, rectPts(cellBox.x0, cellBox.y0, cellBox.w, cellBox.h), 'pick', { seed: 81, rough: 0.8, ink: null, alpha: 0.7 });
        strokePts(c, rectPts(cellBox.x0, cellBox.y0, cellBox.w, cellBox.h), { col: 'pick', lw: 4, closed: true });
        strokePts(c, [[cellBox.x1, cellBox.y0], [zoomBox.x0, zoomBox.y0]], { col: 'pick', lw: 2.5, dash: [10, 9] });
        strokePts(c, [[cellBox.x1, cellBox.y1], [zoomBox.x0, zoomBox.y1]], { col: 'pick', lw: 2.5, dash: [10, 9] });
        wash(c, rectPts(zoomBox.x0, zoomBox.y0, zoomBox.w, zoomBox.h), PAPER, { seed: 83, rough: 1, ink: null });
        wash(c, rectPts(zoomBox.x0, zoomBox.y0, zoomBox.w, zoomBox.h), 'second', { seed: 84, rough: 1, ink: null, alpha: 0.45 });
        const n = p.zoom!.k, kk = clamp(kZ * 1.6 - 0.6);
        for (let i = 1; i < n; i++) {
          const t = zoomBox.x0 + (zoomBox.w * i) / n, s = zoomBox.y0 + (zoomBox.h * i) / n;
          strokePts(c, [[t, zoomBox.y0], [t, lerp(zoomBox.y0, zoomBox.y1, kk)]], { col: DUSK.cream, lw: 2.5, alpha: 0.85 });
          strokePts(c, [[zoomBox.x0, s], [lerp(zoomBox.x0, zoomBox.x1, kk), s]], { col: DUSK.cream, lw: 2.5, alpha: 0.85 });
        }
        strokePts(c, rectPts(zoomBox.x0, zoomBox.y0, zoomBox.w, zoomBox.h), { col: 'second', lw: 5, closed: true });
        if (ZF) texDraw(c, ZF, zoomBox.cx, zoomBox.y0 - 46, { size: LBL, align: 'center', col: 'second' });
      });
    }
    void inkLine;
  }

  const sideBox = (i: number, s: number): Box => {
    const Q = P[i]!, a = Q[s]!, b = Q[(s + 1) % Q.length]!, x = (a[0] + b[0]) / 2, y = (a[1] + b[1]) / 2;
    return box(x - 14, y - 14, x + 14, y + 14);
  };
  return {
    kind: 'PlanSheet', u, steps: PLAN_STEPS, box: box(fr.x, fr.y, fr.x + fr.w, fr.y + fr.h),
    where: {
      sheet, legend: legBox,
      fig: fbox, side: sideBox,
      label: (i, s) => L1[i]?.[s]?.box ?? sideBox(i, s),
      label2: (i, s) => L2[i]?.[s]?.box ?? sideBox(i, s),
      ruler: rBody,
      seg: R?.seg ? box(rx(R.seg[0]), rTop - 20, rx(R.seg[1]), rTop + 2) : rBody,
      edge: x => box(rx(x) - 10, rTop - 10, rx(x) + 10, rTop + 10),
      zoom: zoomBox, zoomCell: cellBox,
    },
    draw,
  };
}
