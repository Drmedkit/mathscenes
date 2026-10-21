// SysPlane: the model of the systems lesson. A coordinate plane on the dusk wall with the two lines of a system:
// line 1 in amber (first), line 2 in teal (second). Every point ON a line is a solution of that line's equation
// (solution dots sit on it), and the crossing is the one point on BOTH lines: the system's solution (lime, link).
//   grid     crisp grid lines; the axes brighter; numbers in the margin (never on a line); a grid step per axis so a
//            context (months, dollars) gets a scaled plane; optional axis names
//   lines    each draws on across the window (k 0..1); a dashed line lies over a solid one when the lines coincide
//   dots     solution dots along a line (lag in one by one)
//   guides   dashed vertical / horizontal lines (x = 4 from 2x = 8, y = 3)
//   gaps     vertical arrows between two parallel lines (the gap never closes)
//   marks    points: a dot, an optional ring, an optional label ("A", "(4, 3)") placed clear of every line and dot
// The page drives every k from named tr keys. Layout throws (BlockError) when a grid square would be too small.
// Painters only (inputs -> pixels); the maths is in sysMaths.ts, the plane text painters come from the congruence
// lesson (read-only).
import { type Box, type Pt, box, clamp, lag, padBox } from '../../../core/math';
import { type Canvas, arrow, dot, drawOn, strokePts } from '../../../core/draw';
import { E } from '../../../core/easing';
import { type Paint, paint } from '../../../core/theme';
import { check } from '../../../blocks/block';
import { SANS } from '../../words';
import { wash } from '../../wash';
import { DUSK } from '../../dusk';
import { type Clear, newClear, placeAround, letter, textW } from '../congruence/TraceBoard';
import { type Lin, type V, type Win, clip, nP } from './sysMaths';

const NAME = 'SysPlane';
export const LABEL = 46, NUM = 44;
/** where the plane goes on the 1920 x 1080 stage: the model frame left of the board */
export const PLANE_AREA: Box = box(24, 64, 1024, 1016);
/** the wide notation slate right of the plane (the runtime board is too narrow for a system and its work) */
export const WIDE_BOARD: Box = box(1056, 70, 1880, 1010);

export interface SysView { win: Win; gx: number; gy: number; cell: number; x0: number; y0: number; box: Box; names?: readonly [string, string] }
/** fit the window into `area`; grid squares are gx by gy units; room is kept for the numbers and the axis names */
export function sysView(win: Win, area: Box, gx = 1, gy = 1, names?: readonly [string, string], maxCell = 92): SysView {
  const ml = 84, mb = names ? 112 : 64, mt = names ? 74 : 44, mr = 46;
  const nx = (win.x1 - win.x0) / gx, ny = (win.y1 - win.y0) / gy;
  const cell = Math.min(maxCell, (area.w - ml - mr) / nx, (area.h - mt - mb) / ny);
  check(cell >= 30, NAME, `grid squares of ${Math.round(cell)} px are too small to read`);
  const cx = area.x0 + ml + (area.w - ml - mr) / 2, cy = area.y0 + mt + (area.h - mt - mb) / 2;
  const x0 = cx - (nx * cell) / 2, y0 = cy + (ny * cell) / 2;
  return { win, gx, gy, cell, x0, y0, box: box(x0, y0 - ny * cell, x0 + nx * cell, y0), names };
}
export const px = (v: SysView, p: V): Pt => [v.x0 + ((p[0] - v.win.x0) / v.gx) * v.cell, v.y0 - ((p[1] - v.win.y0) / v.gy) * v.cell];
export const ptBox = (v: SysView, p: V, r = 22): Box => { const [x, y] = px(v, p); return box(x - r, y - r, x + r, y + r); };
/** the drawn ends of a line (px), or null when it misses the window */
export function lineEnds(v: SysView, L: Lin): [Pt, Pt] | null { const e = clip(L, v.win); return e ? [px(v, e[0]), px(v, e[1])] : null; }

// ---------- the plane ----------
export function drawGrid(c: Canvas, v: SysView, k = 1): void {
  if (k <= 0) return;
  const { g } = c, b = v.box;
  const pb = padBox(b, Math.min(30, v.cell * 0.4));
  wash(c, [[pb.x0, pb.y0], [pb.x1, pb.y0], [pb.x1, pb.y1], [pb.x0, pb.y1]], '#1B1F45', { seed: 12, rough: 1.2, ink: null, shade: 0.08, alpha: k });
  g.save(); g.globalAlpha *= k;
  g.lineWidth = 1.6; g.strokeStyle = '#323867';
  g.beginPath();
  for (let x = v.win.x0; x <= v.win.x1 + 1e-9; x += v.gx) { const X = px(v, [x, 0])[0]; g.moveTo(X, b.y0); g.lineTo(X, b.y1); }
  for (let y = v.win.y0; y <= v.win.y1 + 1e-9; y += v.gy) { const Y = px(v, [0, y])[1]; g.moveTo(b.x0, Y); g.lineTo(b.x1, Y); }
  g.stroke();
  g.restore();
  const hasX = v.win.y0 <= 0 && v.win.y1 >= 0, hasY = v.win.x0 <= 0 && v.win.x1 >= 0;
  const [OX, OY] = px(v, [0, 0]);
  if (hasX) strokePts(c, [[b.x0, OY], [b.x1, OY]], { col: '#8A8EB8', lw: 3, alpha: k });
  if (hasY) strokePts(c, [[OX, b.y0], [OX, b.y1]], { col: '#8A8EB8', lw: 3, alpha: k });
  const every = v.cell >= 84 ? 1 : 2;
  const xs: number[] = [], ys: number[] = [];
  for (let i = 0, x = v.win.x0; x <= v.win.x1 + 1e-9; i++, x += v.gx) if (Math.round(x / v.gx) % every === 0) xs.push(x);
  for (let i = 0, y = v.win.y0; y <= v.win.y1 + 1e-9; i++, y += v.gy) if (Math.round(y / v.gy) % every === 0) ys.push(y);
  for (const x of xs) num(c, nP(x), px(v, [x, 0])[0], b.y1 + 36, 'center', k);
  for (const y of ys) num(c, nP(y), b.x0 - 16, px(v, [0, y])[1], 'right', k);
  if (v.names) {
    words(c, v.names[0], b.x1, b.y1 + 88, 'right', k);
    words(c, v.names[1], b.x0, b.y0 - 44, 'left', k);
  } else {
    if (hasX) letter(c, 'x', b.x1 + 24, OY, 'dim', k, NUM, 600);
    if (hasY) letter(c, 'y', OX, b.y0 - 22, 'dim', k, NUM, 600);
  }
}
function num(c: Canvas, t: string, x: number, y: number, align: CanvasTextAlign, k: number): void {
  const { g } = c;
  g.save(); g.globalAlpha *= k;
  g.font = `600 ${NUM}px ${SANS}`; g.textAlign = align; g.textBaseline = 'middle'; g.fillStyle = paint(c.th, 'faint', 'text');
  g.fillText(t, x, y);
  g.restore();
}
function words(c: Canvas, t: string, x: number, y: number, align: CanvasTextAlign, k: number): void {
  const { g } = c;
  g.save(); g.globalAlpha *= k;
  g.font = `600 ${NUM}px ${SANS}`; g.textAlign = align; g.textBaseline = 'middle'; g.fillStyle = paint(c.th, 'dim', 'text');
  g.fillText(t, x, y);
  g.restore();
}

// ---------- the state the page drives ----------
export interface SysLine { L: Lin; col: Paint; k: number; dashed?: boolean; alpha?: number }
export interface SysDots { pts: readonly V[]; col: Paint; k: number }
export interface SysGuide { x?: number; y?: number; col: Paint; k: number }
export interface SysGaps { L1: Lin; L2: Lin; xs: readonly number[]; col: Paint; k: number }
export interface SysMark { p: V; col: Paint; k: number; label?: string; ring?: number; big?: boolean }
export interface SysState {
  grid?: number;
  lines?: readonly SysLine[];
  dots?: readonly SysDots[];
  guides?: readonly SysGuide[];
  gaps?: SysGaps | null;
  marks?: readonly SysMark[];
}

const LW = 6;
export function drawLin(c: Canvas, v: SysView, l: SysLine): void {
  if (l.k <= 0) return;
  const e = lineEnds(v, l.L);
  if (!e) return;
  const a = l.alpha ?? 1;
  if (l.dashed) { drawOn(c, e, l.k, { col: paint(c.th, l.col, 'fill'), lw: LW, dash: [26, 20], cap: 'butt', alpha: a }); return; }
  drawOn(c, e, l.k, { col: DUSK.ink, lw: LW + 5, alpha: a * 0.8 });
  drawOn(c, e, l.k, { col: paint(c.th, l.col, 'fill'), lw: LW, alpha: a, glow: 6 });
}
export function drawGuide(c: Canvas, v: SysView, gd: SysGuide): void {
  if (gd.k <= 0) return;
  const b = v.box;
  const P: [Pt, Pt] = gd.x !== undefined ? [[px(v, [gd.x, 0])[0], b.y1], [px(v, [gd.x, 0])[0], b.y0]] : [[b.x0, px(v, [0, gd.y!])[1]], [b.x1, px(v, [0, gd.y!])[1]]];
  drawOn(c, P, gd.k, { col: gd.col, lw: 4, dash: [14, 12], cap: 'butt', alpha: 0.95 });
}
function drawGaps(c: Canvas, v: SysView, G: SysGaps): void {
  if (G.k <= 0) return;
  // only where both lines are inside the window: an arrow never leaves the plane
  const inside = (x: number, L: Lin) => { const y = (L.c - L.a * x) / L.b; return y >= v.win.y0 && y <= v.win.y1 && x >= v.win.x0 && x <= v.win.x1; };
  const xs = G.xs.filter(x => inside(x, G.L1) && inside(x, G.L2));
  xs.forEach((x, i) => {
    const kk = E.smooth(lag(G.k, i, xs.length, 0.4));
    if (kk <= 0) return;
    const A = px(v, [x, (G.L1.c - G.L1.a * x) / G.L1.b]), B = px(v, [x, (G.L2.c - G.L2.a * x) / G.L2.b]);
    const d = B[1] > A[1] ? 1 : -1;
    arrow(c, [[A[0], A[1] + d * 10], [B[0], B[1] - d * 12]], kk, { col: G.col, lw: 4.5 });
    arrow(c, [[B[0], B[1] - d * 10], [A[0], A[1] + d * 12]], kk, { col: G.col, lw: 4.5 });
  });
}
function ring(c: Canvas, x: number, y: number, r: number, col: Paint, k: number): void {
  if (k <= 0) return;
  const { g } = c;
  g.save(); g.globalAlpha *= clamp(k);
  g.strokeStyle = paint(c.th, col, 'fill'); g.lineWidth = 5;
  g.shadowColor = paint(c.th, col, 'fill'); g.shadowBlur = 14 * c.th.glow * Math.hypot(g.getTransform().a, g.getTransform().b);
  g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.stroke();
  g.restore();
}
/** the obstacles a label must stay clear of: every drawn line, the axes and every point */
function clearOf(v: SysView, st: SysState): Clear {
  const cl = newClear();
  for (const l of st.lines ?? []) if (l.k > 0.05) { const e = lineEnds(v, l.L); if (e) cl.segs.push(e); }
  for (const gd of st.guides ?? []) if (gd.k > 0.05) {
    const b = v.box;
    cl.segs.push(gd.x !== undefined ? [[px(v, [gd.x, 0])[0], b.y1], [px(v, [gd.x, 0])[0], b.y0]] : [[b.x0, px(v, [0, gd.y!])[1]], [b.x1, px(v, [0, gd.y!])[1]]]);
  }
  const b = v.box, [OX, OY] = px(v, [0, 0]);
  if (v.win.y0 <= 0 && v.win.y1 >= 0) cl.segs.push([[b.x0, OY], [b.x1, OY]]);
  if (v.win.x0 <= 0 && v.win.x1 >= 0) cl.segs.push([[OX, b.y0], [OX, b.y1]]);
  for (const m of st.marks ?? []) if (m.k > 0.05) cl.dots.push(px(v, m.p));
  for (const d of st.dots ?? []) if (d.k > 0.05) for (const p of d.pts) cl.dots.push(px(v, p));
  return cl;
}
/** a mark's label box (for leaders), placed the same way draw() places it */
export function labelBoxes(v: SysView, st: SysState): Box[] {
  const cl = clearOf(v, st), out: Box[] = [];
  for (const m of st.marks ?? []) if (m.label && m.k > 0) { const s = place(v, m, cl); cl.boxes.push(s.box); out.push(s.box); }
  return out;
}
function place(v: SysView, m: SysMark, cl: Clear) {
  const at = px(v, m.p), cx = (v.box.x0 + v.box.x1) / 2, cy = (v.box.y0 + v.box.y1) / 2;
  const w = textW(m.label!, LABEL) + 10, h = LABEL * 0.95;
  // near a crossing every spot close by is cut by a line or a guide: step outward until a clear spot is found
  let best = placeAround(at, [at[0] - cx || 1, at[1] - cy || -1], w, h, cl, padBox(v.box, -6), 30 + LABEL * 0.25);
  for (const r0 of [80, 130, 180]) {
    if (best.clear > 4) break;
    const s = placeAround(at, [at[0] - cx || 1, at[1] - cy || -1], w, h, cl, padBox(v.box, -6), r0);
    if (s.clear > best.clear) best = s;
  }
  return best;
}

export function drawSys(c: Canvas, v: SysView, st: SysState): void {
  drawGrid(c, v, st.grid ?? 1);
  for (const gd of st.guides ?? []) drawGuide(c, v, gd);
  for (const l of st.lines ?? []) if (!l.dashed) drawLin(c, v, l);
  for (const l of st.lines ?? []) if (l.dashed) drawLin(c, v, l);
  if (st.gaps) drawGaps(c, v, st.gaps);
  for (const d of st.dots ?? []) d.pts.forEach((p, i) => {
    const kk = E.smooth(lag(d.k, i, d.pts.length, 0.35));
    if (kk <= 0) return;
    const [x, y] = px(v, p);
    dot(c, x, y, 11, DUSK.ink, kk); dot(c, x, y, 8, d.col, kk);
  });
  const cl = clearOf(v, st);
  for (const m of st.marks ?? []) {
    if (m.k <= 0) continue;
    const [x, y] = px(v, m.p), r = m.big ? 14 : 11;
    dot(c, x, y, r + 3.5, DUSK.ink, m.k); dot(c, x, y, r, m.col, m.k);
    ring(c, x, y, r + 14, m.col, m.ring ?? 0);
  }
  for (const m of st.marks ?? []) {
    if (!m.label || m.k <= 0) continue;
    const s = place(v, m, cl);
    cl.boxes.push(s.box);
    letter(c, m.label, s.at[0], s.at[1], m.col, m.k, LABEL);
  }
}

// ---------- the block: a system on a plane, with its where{} boxes ----------
export interface SysBlock {
  readonly kind: 'SysPlane';
  readonly view: SysView;
  readonly where: { pt(p: V): Box; plane: Box };
  draw(c: Canvas, st: SysState): void;
}
export function SysPlane(o: { win: Win; gx?: number; gy?: number; names?: readonly [string, string] }, area: Box): SysBlock {
  const view = sysView(o.win, area, o.gx ?? 1, o.gy ?? 1, o.names);
  return { kind: 'SysPlane', view, where: { pt: p => ptBox(view, p), plane: view.box }, draw: (c, st) => drawSys(c, view, st) };
}
