// DistPic: the pictures of "Probability distributions and expected value" (a candidate for src/lesson/kit/: the
// balance-beam bar graph and the distribution table would serve every discrete-distribution lesson). One card in a
// Frame, of one of six kinds:
//   bars    a probability bar graph that is also a balance beam: the values of X at their true places on a number
//           line (the beam), one equal-width bar per value with its probability as the height (a TeX label on top),
//           an optional probability scale on the left, and an optional fulcrum (a triangle under the beam). On step
//           'tilt' the beam tips by the turning effect sum of P(x)(x - m) about the fulcrum m (it rests level exactly
//           when m = E(X)); the page can slide the fulcrum (focus.m). Hidden bars are dashed outlines with a "?" until
//           'rev' (their heights live in `reveal`, which oracles never see)
//   table   a distribution table laid on its side: a head column (x, P(X = x), x·P(x), ...) and one column per value,
//           TeX cells, "?" for a hidden cell until 'rev'; columns of an event glow lime on 'hl'
//   cond    any conditional-probability/CondPic card (tree, outcome grid, spinner, chips, dots)
//   count   any counting/CountPic card (rows of outcome chips grouped by their value of X)
//   run     a running-mean plot of one simulated game on the kit Plane (plays on a log scale 1 .. 10,000), the
//           checkpoints as points, E(X) as a dashed level line
//   binorm  a binomial histogram (bars of width 1 centred on the counts) on the kit Plane, with the normal curve
//           N(np, sqrt(np(1 - p))) on step 'curve'
// Steps: 'card' then per kind (see `steps`); 'rev' brings in what an item's solution adds. Pure layout with estimated
// text widths (no DOM in the layout); throws BlockError when something would not fit at 60 px numbers / 44 px labels.
import { type Box, type Pt, box, clamp, lag } from '../../../core/math';
import { rectPts } from '../../../core/pts';
import { type Canvas, withAlpha } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Progress } from '../../../core/clock';
import { type Formula, tex, texDraw, texWidth } from '../../../core/tex';
import { type Paint, type Theme, paint } from '../../../core/theme';
import { type Frame, check } from '../../../blocks/block';
import { drawWords } from '../../words';
import { wash } from '../../wash';
import { DUSK } from '../../dusk';
import { CondPic, type CPic as CondSpec } from '../conditional-probability/CondPic';
import { CountPic, type CPic as CountSpec } from '../counting/CountPic';
import { Plane, type PItem, type PParams } from '../../kit/Plane';
import { binomP, dnorm } from './ev';

const NAME = 'DistPic';
export interface BarsPic {
  kind: 'bars';
  xs: number[];
  /** bar heights (probabilities); null = hidden until 'rev' */
  ps: (number | null)[];
  /** TeX labels on top of the bars; null = "?" until 'rev'; omit = no labels */
  labs?: (string | null)[];
  axis: { min: number; max: number; step: number; name?: string; /** label every tick (default) or only the values of X */ only?: boolean; /** '$' before tick labels */ pre?: string };
  /** a probability scale on the left */
  y?: { max: number; step: number; dec: number; name?: string };
  title?: string;
  /** the fulcrum under the beam (data units) */
  fulc?: number;
  /** bars of an event, lime on 'hl' */
  hl?: number[];
  col?: Paint;
  /** false: a hidden bar shows nothing (not even its place) until 'rev' */
  ghost?: boolean;
  reveal?: { ps?: (number | null)[]; labs?: (string | null)[] };
}
export interface TablePic {
  kind: 'table';
  rows: { head: string; cells: (string | null)[] }[];
  title?: string;
  /** columns lime on 'hl' */
  hl?: number[];
  reveal?: { cells: (string | null)[][] };
}
export interface RunPic { kind: 'run'; pts: [number, number][]; marks?: [number, number][]; ev?: number; /** a break-even level (the cost of a play) */ cost?: number; y: { min: number; max: number; step: number }; name?: string; yName?: string; title?: string }
export interface BinormPic { kind: 'binorm'; n: number; p: number; lo: number; hi: number; step: number; curve?: boolean; name?: string; yMax?: number }
export type DPic = BarsPic | TablePic | RunPic | BinormPic | { kind: 'cond'; pic: CondSpec } | { kind: 'count'; pic: CountSpec };

export interface DFocus { /** the fulcrum's current place (data units) */ m?: number; /** extra glow on bars */ glow?: { idx: number[]; col: Paint; k: number } }
export interface DistPicBlock {
  readonly kind: 'DistPic';
  readonly pic: DPic;
  readonly box: Box;
  readonly steps: readonly string[];
  where(key: string): Box;
  /** bars: the x pixel of a value on the level beam */ px?(x: number): number;
  draw(c: Canvas, P: Progress<string>, f?: DFocus): void;
}

const NUM = 60, LAB = 44, TITLE = 46;
const CARD = '#262B57', PLATE = '#1A1E44';
const wW = (s: string, size: number) => s.length * size * 0.56;
const FC = new Map<string, Formula>();
const F = (s: string): Formula => { let f = FC.get(s); if (!f) { f = tex(s) as Formula; FC.set(s, f); } return f; };
const texW = (s: string, size: number) => { try { return texWidth(F(s), size); } catch { return wW(s, size) * 0.8; } };
const r9 = (v: number) => Math.round(v * 1e9) / 1e9;

/** the turning effect about m of a bar graph: sum of P(x)(x - m) (zero exactly at m = E(X)) */
export function torque(xs: readonly number[], ps: readonly number[], m: number): number { return xs.reduce((s, x, i) => s + ps[i]! * (x - m), 0); }

export function DistPic(pic: DPic, fr: Frame, th: Theme): DistPicBlock {
  if (pic.kind === 'cond') { const B = CondPic(pic.pic, fr, th); return { kind: 'DistPic', pic, box: B.box, steps: B.steps, where: B.where, draw: (c, P) => B.draw(c, P) }; }
  if (pic.kind === 'count') { const B = CountPic(pic.pic, fr, th); return { kind: 'DistPic', pic, box: B.box, steps: B.steps, where: B.where, draw: (c, P) => B.draw(c, P) }; }
  if (pic.kind === 'run' || pic.kind === 'binorm') {
    const prm = pic.kind === 'run' ? runParams(pic) : binormParams(pic);
    const B = Plane(prm, fr, th);
    return { kind: 'DistPic', pic, box: B.box, steps: ['axes', ...(prm.items ?? []).map(i => i.key)], where: B.where, draw: (c, P) => B.draw(c, P) };
  }
  const x0 = fr.x, y0 = fr.y, x1 = fr.x + fr.w, y1 = fr.y + fr.h;
  const col = (cl: Paint) => paint(th, cl, 'fill');
  const ink = DUSK.cream;
  const title = pic.title ?? '';
  if (title) check(wW(title, TITLE) * 0.92 <= fr.w - 40, NAME, `title "${title}" is too wide`);
  const top = y0 + (title ? 96 : 30), bot = y1 - 26;
  const boxes = new Map<string, Box>();
  function stroke(c: Canvas, Pp: readonly Pt[], cl: Paint | string, w: number, dash?: number[], alpha = 1): void {
    if (Pp.length < 2 || alpha <= 0) return;
    const { g } = c;
    g.save(); g.globalAlpha *= alpha; g.strokeStyle = cl.startsWith('#') || cl.startsWith('rgba') ? cl : col(cl as Paint); g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round';
    if (dash) g.setLineDash(dash);
    g.beginPath(); g.moveTo(Pp[0]![0], Pp[0]![1]); for (const q of Pp.slice(1)) g.lineTo(q[0], q[1]); g.stroke(); g.restore();
  }
  function glowRing(c: Canvas, Bx: Box, cl: Paint, k: number): void {
    if (k <= 0) return;
    const { g } = c;
    g.save(); g.globalAlpha *= clamp(k); g.strokeStyle = col(cl); g.lineWidth = 5;
    g.shadowColor = col(cl); g.shadowBlur = 10 * th.glow * Math.hypot(g.getTransform().a, g.getTransform().b);
    g.beginPath(); g.roundRect(Bx.x0 - 9, Bx.y0 - 7, Bx.w + 18, Bx.h + 14, 14); g.stroke(); g.restore();
  }
  const texAt = (c: Canvas, s: string, x: number, y: number, size: number, cl: Paint, a: number, align: 'left' | 'center' | 'right' = 'center') => { if (a > 0 && s) texDraw(c, F(s), x, y, { size, align, col: cl, alpha: clamp(a) }); };
  const cardDraw = (c: Canvas, k: number) => {
    if (k <= 0) return;
    withAlpha(c, E.smooth(clamp(k * 2)), () => wash(c, rectPts(x0, y0, fr.w, fr.h, 18), CARD as Paint, { seed: 47, rough: 1.3, ink: DUSK.ink, inkW: 3, shade: 0.25 }));
    if (title) drawWords(c, title, (x0 + x1) / 2, y0 + 50, 'ink', clamp(k * 1.5 - 0.3), { size: TITLE, align: 'center', weight: 700 });
  };
  let steps: string[] = ['card'];
  let drawBody: (c: Canvas, P: Progress<string>, f: DFocus) => void = () => undefined;
  let pxOut: ((x: number) => number) | undefined;

  if (pic.kind === 'bars') {
    const n = pic.xs.length;
    check(n >= 2 && n <= 12 && pic.ps.length === n, NAME, 'bars: 2 to 12 values');
    const A = pic.axis, Y = pic.y;
    check(A.max > A.min && A.step > 0, NAME, 'bars: empty axis');
    for (const x of pic.xs) check(x >= A.min - 1e-9 && x <= A.max + 1e-9, NAME, `value ${x} off the axis`);
    const yLabs = Y ? Array.from({ length: Math.round(Y.max / Y.step) + 1 }, (_, i) => (i * Y.step).toFixed(Y.dec)) : [];
    const yW = Y ? Math.max(...yLabs.map(s => wW(s, LAB) * 0.95)) : 0;
    const gx0 = x0 + (Y ? 40 + yW + 22 : 70), gx1 = x1 - 70;
    const beam = pic.fulc !== undefined;
    const axisY = bot - (A.name ? 70 : 0) - (beam ? 128 : 74);
    const tickY = axisY + (beam ? 102 : 46);
    // the end values sit half a bar in from the beam's ends (a bar never covers the probability scale)
    const padX = 74, sx = (gx1 - gx0 - 2 * padX) / (A.max - A.min);
    const px = (x: number) => gx0 + padX + (x - A.min) * sx;
    pxOut = px;
    const sorted = [...pic.xs].sort((a, b) => a - b);
    let gap = Infinity;
    for (let i = 1; i < n; i++) gap = Math.min(gap, (sorted[i]! - sorted[i - 1]!) * sx);
    const bw = Math.min(120, gap * 0.62, (gx1 - gx0) * 0.3);
    check(bw >= 30, NAME, `bars too thin (${bw.toFixed(0)} px)`);
    const labs = pic.labs, labH = labs ? 104 : 20;
    const hTop = top + (Y?.name ? 50 : 0) + labH;
    check(axisY - hTop >= 140, NAME, 'bars: no room for the heights');
    const known = pic.ps.filter((p): p is number => p !== null), rv = pic.reveal?.ps ?? [];
    const yMax = Y ? Y.max : Math.max(...known, ...rv.filter((p): p is number => p !== null)) * 1.04;
    for (const p of known) check(p >= -1e-9 && p <= yMax + 1e-9, NAME, 'a bar is taller than the scale');
    const hy = (p: number) => axisY - (p / yMax) * (axisY - hTop);
    // labels on top of neighbouring bars must not collide
    if (labs) {
      const ws = pic.xs.map((_, i) => texW(labs[i] ?? pic.reveal?.labs?.[i] ?? '?', NUM));
      const ord = pic.xs.map((x, i) => [x, i] as const).sort((a, b) => a[0] - b[0]);
      for (let j = 1; j < ord.length; j++) check((ord[j]![0] - ord[j - 1]![0]) * sx >= (ws[ord[j]![1]]! + ws[ord[j - 1]![1]]!) / 2 + 14, NAME, 'bar labels collide');
      for (const [x, i] of ord) check(px(x) - ws[i]! / 2 >= x0 + 14 && px(x) + ws[i]! / 2 <= x1 - 14, NAME, 'a bar label leaves the card');
    }
    const ticks: { v: number; x: number; t: string }[] = [];
    const nT = Math.round((A.max - A.min) / A.step);
    check(nT >= 1 && nT <= 24, NAME, 'bars: too many ticks');
    const tickVals = A.only ? sorted : Array.from({ length: nT + 1 }, (_, i) => r9(A.min + i * A.step));
    for (const v of tickVals) ticks.push({ v, x: px(v), t: `${v < 0 ? '−' : ''}${A.pre ?? ''}${Math.abs(v)}` });
    const tw = Math.max(...ticks.map(t => wW(t.t, NUM) * 0.92));
    let stride = 1;
    while (stride < 6 && ticks.length > 1 && (A.only ? gap : A.step * sx) * stride < tw + 16) stride++;
    check((A.only ? gap : A.step * sx) * stride >= tw + 16, NAME, 'tick labels collide');
    const shown = ticks.filter((_, i) => i % stride === 0 || pic.xs.some(x => Math.abs(x - ticks[i]!.v) < 1e-9 && stride === 1));
    pic.xs.forEach((x, i) => boxes.set(`bar${i}`, box(px(x) - bw / 2, hy(pic.ps[i] ?? rv[i] ?? yMax * 0.5), px(x) + bw / 2, axisY)));
    boxes.set('axis', box(gx0, axisY - 6, gx1, tickY + 30));
    if (A.name) boxes.set('name', box((gx0 + gx1) / 2 - wW(A.name, LAB) * 0.45, tickY + 70 - 22, (gx0 + gx1) / 2 + wW(A.name, LAB) * 0.45, tickY + 70 + 22));
    steps = ['card', 'axis', 'bars', ...(labs ? ['labs'] : []), ...(beam ? ['fulc', 'tilt'] : []), ...(pic.hl ? ['hl'] : [])];
    drawBody = (c, P, f) => {
      const ka = P.k('axis'), kb = P.k('bars'), kl = P.k('labs'), kf = P.k('fulc'), kt = P.k('tilt'), kh = Math.max(P.k('hl'), P.k('rev') * (pic.hl ? 1 : 0)), rvk = P.k('rev');
      const m = f.m ?? pic.fulc ?? 0;
      const fx = px(m);
      // the beam tips by the turning effect (probabilities that are still hidden count with their revealed value)
      const psNow = pic.ps.map((p, i) => p ?? (rv[i] ?? 0));
      const span = A.max - A.min;
      const ang = beam ? clamp(torque(pic.xs, psNow, m) / (span / 5), -1, 1) * 0.08 * clamp(kt) : 0;
      const { g } = c;
      g.save();
      if (ang) { g.translate(fx, axisY); g.rotate(ang); g.translate(-fx, -axisY); }
      // probability scale (level, behind the bars; it does not tip)
      if (Y && ka > 0) {
        g.save(); if (ang) { g.translate(fx, axisY); g.rotate(-ang); g.translate(-fx, -axisY); }
        const kk = E.smooth(clamp(ka * 1.4 - 0.2));
        yLabs.forEach((s, i) => {
          const v = i * Y.step, yy = hy(v);
          if (i > 0) stroke(c, [[gx0, yy], [gx1, yy]], '#3A3F6E', 2, [6, 8], kk);
          stroke(c, [[gx0 - 12, yy], [gx0, yy]], ink, 3, undefined, kk);
          drawWords(c, s, gx0 - 20, yy, 'dim', kk, { size: LAB, align: 'right' });
        });
        stroke(c, [[gx0, axisY], [gx0, hTop - 20]], ink, 3, undefined, kk);
        if (Y.name) drawWords(c, Y.name, gx0 - 20, hTop - 64, 'dim', kk, { size: LAB, align: 'left', weight: 650 });
        g.restore();
      }
      if (ka > 0) {
        const kx = E.inOut(clamp(ka * 1.5));
        if (beam) wash(c, rectPts(gx0 - 30, axisY - 4, (gx1 - gx0 + 60) * kx, 16, 6), 'brown', { seed: 12, rough: 0.6, ink: DUSK.ink, inkW: 2.5, shade: 0.3 });
        else stroke(c, [[gx0 - 20, axisY], [gx0 - 20 + (gx1 - gx0 + 40) * kx, axisY]], ink, 4);
        const kt2 = E.smooth(clamp(ka * 2 - 0.8));
        for (const t of ticks) stroke(c, [[t.x, axisY + (beam ? 12 : 0)], [t.x, axisY + (beam ? 26 : 14)]], ink, 3, undefined, kt2);
        for (const t of shown) drawWords(c, t.t, t.x, tickY, 'ink', kt2, { size: NUM, align: 'center', weight: 600 });
        if (A.name) drawWords(c, A.name, (gx0 + gx1) / 2, tickY + 70, 'dim', kt2, { size: LAB, align: 'center', weight: 650 });
      }
      pic.xs.forEach((x, i) => {
        const ki = E.inOut(clamp(lag(kb, i, n, 0.5)));
        if (ki <= 0) return;
        const p0 = pic.ps[i] ?? null, hid = p0 === null, p: number | null = hid ? (rv[i] ?? null) : p0;
        const cx = px(x);
        if (hid) {
          // a dashed outline (with "?") until the replay grows the bar
          const hh = (axisY - hTop) * 0.5;
          if (rvk < 1 && pic.ghost !== false) stroke(c, [[cx - bw / 2, axisY], [cx - bw / 2, axisY - hh], [cx + bw / 2, axisY - hh], [cx + bw / 2, axisY]], 'pick', 4, [10, 8], ki * (1 - rvk));
          if (rvk < 1 && pic.ghost !== false) texAt(c, '?', cx, axisY - hh / 2, NUM, 'pick', ki * (1 - rvk));
          if (p !== null && rvk > 0) wash(c, rectPts(cx - bw / 2, axisY - (axisY - hy(p)) * E.inOut(rvk), bw, (axisY - hy(p)) * E.inOut(rvk), 4), 'link', { seed: 80 + i, rough: 0.7, ink: DUSK.ink, inkW: 3, shade: 0.3 });
          return;
        }
        const yTop = axisY - (axisY - hy(p!)) * ki;
        const hl = pic.hl?.includes(i) ? kh : 0;
        const gl = f.glow?.idx.includes(i) ? f.glow.k : 0;
        if (p! > 0) {
          wash(c, rectPts(cx - bw / 2, yTop, bw, axisY - yTop, 4), pic.col ?? 'first', { seed: 60 + i, rough: 0.7, ink: DUSK.ink, inkW: 3, shade: 0.3 });
          if (hl > 0) withAlpha(c, clamp(hl), () => wash(c, rectPts(cx - bw / 2, yTop, bw, axisY - yTop, 4), 'link', { seed: 60 + i, rough: 0.7, ink: DUSK.ink, inkW: 3, shade: 0.3 }));
        } else stroke(c, [[cx - bw / 2, axisY - 2], [cx + bw / 2, axisY - 2]], pic.col ?? 'first', 6, undefined, ki);
        if (gl > 0) glowRing(c, box(cx - bw / 2, yTop, cx + bw / 2, axisY), f.glow!.col, gl);
      });
      if (labs && kl > 0) pic.xs.forEach((x, i) => {
        const p = pic.ps[i] ?? rv[i] ?? null;
        const yTop = p === null ? axisY - (axisY - hTop) * 0.5 : hy(p);
        const L = labs[i], R = pic.reveal?.labs?.[i];
        if (L !== null && L !== undefined) texAt(c, L, px(x), yTop - 44, NUM, 'ink', kl);
        else if (R) { if (pic.ps[i] !== null) texAt(c, '?', px(x), yTop - 44, NUM, 'pick', kl * (1 - rvk)); texAt(c, R, px(x), yTop - 44, NUM, 'link', rvk); }
        else if (pic.ps[i] !== null) texAt(c, '?', px(x), yTop - 44, NUM, 'pick', kl);
      });
      g.restore();
      if (beam && kf > 0) {
        const s = 34 * E.back(clamp(kf));
        g.save(); g.fillStyle = col('pick'); g.strokeStyle = DUSK.ink; g.lineWidth = 3;
        g.beginPath(); g.moveTo(fx, axisY + 14); g.lineTo(fx + s, axisY + 14 + s * 1.7); g.lineTo(fx - s, axisY + 14 + s * 1.7); g.closePath(); g.fill(); g.stroke(); g.restore();
      }
    };
    boxes.set('fulc', box(px(pic.fulc ?? 0) - 34, axisY + 14, px(pic.fulc ?? 0) + 34, axisY + 72));
  } else if (pic.kind === 'table') {
    const R = pic.rows.length, n = pic.rows[0]?.cells.length ?? 0;
    check(R >= 1 && R <= 4 && n >= 1 && n <= 8 && pic.rows.every(r => r.cells.length === n), NAME, 'tables are 1-4 rows of 1-8 cells');
    const cellTex = (r: number, j: number) => pic.rows[r]!.cells[j] ?? pic.reveal?.cells[r]?.[j] ?? '?';
    const fracRow = (r: number) => pic.rows[r]!.cells.some((s, j) => /frac/.test(s ?? pic.reveal?.cells[r]?.[j] ?? '')) || /frac/.test(pic.rows[r]!.head);
    const headW = (s: number) => Math.max(...pic.rows.map(r => texW(r.head, s))) + 40;
    const cellW = (s: number) => Math.max(...pic.rows.flatMap((_, r) => pic.rows[r]!.cells.map((_, j) => texW(cellTex(r, j), s)))) + 26;
    let size = 64;
    while (size > NUM && headW(size) + n * cellW(size) > fr.w - 40) size -= 2;
    // laid on its side when it fits; otherwise upright (one line per value, the heads on top)
    const side = headW(size) + n * cellW(size) <= fr.w - 40;
    // a cell (r = head row, j = value) and its box, in either orientation
    let cellBox: (r: number, j: number) => Box, headBox: (r: number) => Box, lineBox: (j: number) => Box, all: Box;
    if (side) {
      const hw = headW(size), cw = (fr.w - 40 - hw) / n;
      const rh = pic.rows.map((_, r) => (fracRow(r) ? 122 : 100)), totH = rh.reduce((a, b) => a + b, 0);
      check(totH <= bot - top, NAME, 'the table is too tall');
      const tx0 = x0 + 20, ty0 = top + Math.max(0, (bot - top - totH) / 2) * 0.6;
      const rowY: number[] = []; let yy = ty0;
      for (const h of rh) { rowY.push(yy); yy += h; }
      cellBox = (r, j) => box(tx0 + hw + j * cw, rowY[r]!, tx0 + hw + (j + 1) * cw, rowY[r]! + rh[r]!);
      headBox = r => box(tx0, rowY[r]!, tx0 + hw, rowY[r]! + rh[r]!);
      lineBox = j => box(tx0 + hw + j * cw, ty0, tx0 + hw + (j + 1) * cw, yy);
      all = box(tx0, ty0, tx0 + hw + n * cw, yy);
    } else {
      size = 64;
      const colW = (s: number, r: number) => Math.max(texW(pic.rows[r]!.head, s), ...pic.rows[r]!.cells.map((_, j) => texW(cellTex(r, j), s))) + 50;
      const totW = (s: number) => pic.rows.reduce((a, _, r) => a + colW(s, r), 0);
      while (size > NUM && totW(size) > fr.w - 40) size -= 2;
      check(totW(size) <= fr.w - 40, NAME, 'the table is too wide');
      const lh = pic.rows.some((_, r) => fracRow(r)) ? 104 : 86, hh = 96;
      check(hh + n * lh <= bot - top, NAME, 'the table is too tall');
      const ws = pic.rows.map((_, r) => colW(size, r)), W = ws.reduce((a, b) => a + b, 0);
      const tx0 = x0 + (fr.w - W) / 2, ty0 = top + Math.max(0, (bot - top - hh - n * lh) / 2) * 0.6;
      const cx0 = (r: number) => tx0 + ws.slice(0, r).reduce((a, b) => a + b, 0);
      cellBox = (r, j) => box(cx0(r), ty0 + hh + j * lh, cx0(r) + ws[r]!, ty0 + hh + (j + 1) * lh);
      headBox = r => box(cx0(r), ty0, cx0(r) + ws[r]!, ty0 + hh);
      lineBox = j => box(tx0, ty0 + hh + j * lh, tx0 + W, ty0 + hh + (j + 1) * lh);
      all = box(tx0, ty0, tx0 + W, ty0 + hh + n * lh);
    }
    for (let j = 0; j < n; j++) boxes.set(`col${j}`, lineBox(j));
    for (let r = 0; r < R; r++) { boxes.set(`row${r}`, headBox(r)); for (let j = 0; j < n; j++) boxes.set(`c${r}.${j}`, cellBox(r, j)); }
    steps = ['card', ...pic.rows.map((_, r) => `r${r}`), ...(pic.hl ? ['hl'] : [])];
    drawBody = (c, P) => {
      const kh = Math.max(P.k('hl'), P.k('rev') * (pic.hl ? 1 : 0)), rvk = P.k('rev');
      // the event's values glow behind the cells
      for (const j of pic.hl ?? []) if (kh > 0) withAlpha(c, clamp(kh) * 0.3, () => { const b = lineBox(j), { g } = c; g.fillStyle = col('link'); g.beginPath(); g.roundRect(b.x0 + 4, b.y0 + 4, b.w - 8, b.h - 8, 12); g.fill(); });
      pic.rows.forEach((row, r) => {
        const k = P.k(`r${r}`);
        if (k <= 0) return;
        const kk = E.smooth(clamp(k * 1.5));
        const hb = headBox(r);
        if (side) {
          if (r < R - 1) stroke(c, [[all.x0, hb.y1], [all.x0 + all.w * kk, hb.y1]], ink, 3, undefined, 0.85);
          stroke(c, [[hb.x1, hb.y0 + 10], [hb.x1, hb.y1 - 10]], ink, 3, undefined, kk);
        } else {
          if (r === 0) stroke(c, [[all.x0, hb.y1], [all.x0 + all.w * kk, hb.y1]], ink, 3, undefined, 0.85);
          if (r < R - 1) stroke(c, [[hb.x1, all.y0 + 10], [hb.x1, all.y1 - 10]], ink, 3, undefined, kk);
        }
        withAlpha(c, kk, () => { const { g } = c; g.fillStyle = PLATE; g.globalAlpha *= 0.55; g.beginPath(); g.roundRect(hb.x0 + 4, hb.y0 + 6, hb.w - 14, hb.h - 12, 10); g.fill(); });
        texAt(c, row.head, hb.cx - 4, hb.cy, size, r === 0 ? 'first' : 'second', kk);
        row.cells.forEach((s, j) => {
          const kj = clamp(lag(k, j, n, 0.5) * 1.3);
          const b = cellBox(r, j);
          if (s !== null) { texAt(c, s, b.cx, b.cy, size, 'ink', kj); return; }
          const R0 = pic.reveal?.cells[r]?.[j];
          texAt(c, '?', b.cx, b.cy, size, 'pick', kj * (R0 ? 1 - rvk : 1));
          if (R0) texAt(c, R0, b.cx, b.cy, size, 'link', kj * rvk);
        });
      });
    };
  }

  function draw(c: Canvas, P: Progress<string>, f: DFocus = {}): void {
    cardDraw(c, P.k('card'));
    drawBody(c, P, f);
  }
  function where(key: string): Box {
    if (key === 'card') return box(x0, y0, x1, y1);
    const b = boxes.get(key);
    check(b, NAME, `no box for "${key}"`);
    return b!;
  }
  return { kind: 'DistPic', pic, box: box(x0, y0, x1, y1), steps, where, px: pxOut, draw };
}

// ---------- the Plane cards ----------
const LOGX = ['1', '10', '100', '1,000', '10,000'];
/** running means at plays 1 .. 10,000 on a log scale: x = log10(plays) */
export function runParams(p: RunPic): PParams {
  const pts = p.pts.map(([n, m]) => [Math.log10(n), m] as const);
  const f = (x: number) => {
    if (x <= pts[0]![0]) return pts[0]![1];
    for (let i = 1; i < pts.length; i++) if (x <= pts[i]![0]) { const [a, ya] = pts[i - 1]!, [b, yb] = pts[i]!; return ya + ((x - a) / (b - a)) * (yb - ya); }
    return pts[pts.length - 1]![1];
  };
  const items: PItem[] = [];
  if (p.cost !== undefined) items.push({ kind: 'hline', key: 'cost', y: p.cost, col: 'wrong', dash: true });
  if (p.ev !== undefined) items.push({ kind: 'hline', key: 'ev', y: p.ev, col: 'link', dash: true });
  items.push({ kind: 'curve', key: 'run', f, lo: pts[0]![0], hi: pts[pts.length - 1]![0], col: 'first', w: 5 });
  (p.marks ?? []).forEach(([n, m], i) => items.push({ kind: 'point', key: `m${i}`, x: Math.log10(n), y: m, col: 'first' }));
  // labels at the right end, on the side of their line away from the other line
  const span = p.y.max - p.y.min, up = (a: number, b?: number) => (b === undefined ? a + span * 0.07 : a >= b ? a + span * 0.07 : a - span * 0.07);
  if (p.ev !== undefined) items.push({ kind: 'text', key: 'evlab', x: 3.95, y: up(p.ev, p.cost), text: 'expected', col: 'link', align: 'right', size: 46 });
  if (p.cost !== undefined) items.push({ kind: 'text', key: 'costlab', x: 3.95, y: up(p.cost, p.ev), text: 'cost', col: 'wrong', align: 'right', size: 46 });
  return {
    x: { min: 0, max: 4, step: 1, name: p.name ?? 'Number of plays', fmt: v => LOGX[Math.round(v)] ?? '' },
    y: { min: p.y.min, max: p.y.max, step: p.y.step, name: p.yName ?? 'Average per play', fmt: v => (Math.abs(v) < 1e-9 ? '0' : `${v < 0 ? '−' : ''}${Math.round(Math.abs(v) * 100) / 100}`) },
    items,
  };
}
/** a binomial histogram with the normal curve of the same mean and SD */
export function binormParams(p: BinormPic): PParams {
  const mu = p.n * p.p, sd = Math.sqrt(p.n * p.p * (1 - p.p));
  const items: PItem[] = [];
  let top = 0;
  for (let k = Math.ceil(p.lo); k <= Math.floor(p.hi); k++) {
    const h = binomP(p.n, k, p.p);
    top = Math.max(top, h);
    if (h < 1e-4) continue;
    items.push({ kind: 'shade', key: `b${k}`, lo: Math.max(p.lo, k - 0.5), hi: Math.min(p.hi, k + 0.5), top: () => h, bottom: 'bottom', col: 'second', alpha: 0.5 });
  }
  if (p.curve) items.push({ kind: 'curve', key: 'curve', f: x => dnorm(x, mu, sd), lo: p.lo, hi: p.hi, col: 'link', w: 5 });
  const yMax = p.yMax ?? Math.max(top, p.curve ? dnorm(mu, mu, sd) : 0) * 1.2;
  return { x: { min: p.lo, max: p.hi, step: p.step, name: p.name ?? 'Number of yes answers' }, y: { min: 0, max: yMax, step: yMax / 4, fmt: () => '' }, items };
}
