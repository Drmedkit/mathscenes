// AngleFig.ts: the model block of "Angle relationships": an angle figure on a sheet of dark drawing paper.
// Crisp lines where precision matters (rays and lines with arrowheads, arcs, the right-angle box), soft washes for the
// angle wedges (the objects the kid reasons about). Colour roles:
//   first  (amber)    the whole: the straight angle (180), the right angle (90), the full turn (360), a given whole
//   second (teal)     a known part (a given measure)
//   link   (lime)     the unknown / the answer
//   pick   (lavender) the focus (the angle being named or asked about)
//   wrong  (red)      wrong
//   plain             a numbered angle with no role yet
// Layout is pure (angleMaths.layoutPic); this file only paints. draw(c, pic, frame, look) depends on its inputs only.
import type { Canvas } from '../../../core/draw';
import { arrow, dot, strokePts } from '../../../core/draw';
import { type Pt, clamp } from '../../../core/math';
import { type Paint, mix, paint } from '../../../core/theme';
import { wash } from '../../wash';
import { SANS } from '../../words';
import { type AMark, type FanLayout, type Frame, type MarkCol, type Pic, FIG, LETTER, layoutPic, tickSegs } from './angleMaths';

export interface Look {
  /** the whole figure fades in */
  k?: number;
  /** painted streets under the drawn lines (part 1), 0..1 */
  road?: number;
  /** the strokes draw on from the vertex */
  lines?: number;
  /** per mark id: visibility 0..1 (default 1) */
  marks?: Record<string, number>;
  /** per mark id: label visibility (default: the mark's) */
  labels?: Record<string, number>;
  /** per mark id: the label crossfades from text to alt */
  solved?: Record<string, number>;
  /** per mark id: a colour override */
  col?: Record<string, MarkCol>;
  /** per mark id: a soft glow (focus) */
  glow?: Record<string, number>;
  /** per ray letter: alpha (fade a ray and its letter) */
  ray?: Record<string, number>;
  /** letters fade in */
  letters?: number;
  /** per mark id: equal-angle ticks visibility (default 1) */
  ticks?: Record<string, number>;
}
const ROLE: Record<MarkCol, Paint> = { first: 'first', second: 'second', link: 'link', pick: 'pick', wrong: 'wrong', plain: 'dim' };
const v = (o: Record<string, number> | undefined, id: string, d = 1) => (o && id in o ? o[id]! : d);

/** the drawing sheet behind the figure (a lighter navy, so the wall and the figure separate) */
export function sheet(c: Canvas, fr: Frame = FIG, k = 1): void {
  if (k <= 0) return;
  const x0 = fr.x - 10, y0 = fr.y - 10, x1 = fr.x + fr.w + 10, y1 = fr.y + fr.h + 10;
  wash(c, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], '#1C2047', { seed: 21, rough: 1.3, ink: null, shade: 0.06, alpha: k });
}

function sector(O: Pt, r: number, a0: number, span: number): Pt[] {
  const n = Math.max(8, Math.ceil(span / 3)), P: Pt[] = [O];
  for (let i = 0; i <= n; i++) { const a = ((a0 + (span * i) / n) * Math.PI) / 180; P.push([O[0] + r * Math.cos(a), O[1] - r * Math.sin(a)]); }
  return P;
}
function label(c: Canvas, t: string, at: Pt, size: number, col: Paint, a: number): void {
  if (a <= 0 || !t) return;
  const { g } = c;
  g.save(); g.globalAlpha *= clamp(a);
  g.font = `650 ${size}px ${SANS}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineJoin = 'round'; g.lineWidth = 10; g.strokeStyle = 'rgba(18,20,46,0.92)';
  g.strokeText(t, at[0], at[1] + size * 0.03);
  g.fillStyle = paint(c.th, col, 'text'); g.fillText(t, at[0], at[1] + size * 0.03);
  g.restore();
}

export function drawPic(c: Canvas, pic: Pic, fr: Frame = FIG, look: Look = {}): void {
  const k = clamp(look.k ?? 1);
  if (k <= 0) return;
  const lay = layoutPic(pic, fr);
  c.g.save(); c.g.globalAlpha *= k;
  for (const fl of lay.fans) drawFan(c, fl, look);
  if (lay.nts) {
    const { g } = c;
    g.save(); g.font = `italic 600 44px ${SANS}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = paint(c.th, 'dim', 'text'); g.fillText('not drawn to scale', lay.nts.at[0], lay.nts.at[1]); g.restore();
  }
  c.g.restore();
}

function drawFan(c: Canvas, fl: FanLayout, look: Look): void {
  const { O, L } = fl;
  const rayA = (p: string) => v(look.ray, p);
  // 1. streets (part 1): a painted band under every drawn line
  const rd = clamp(look.road ?? 0);
  if (rd > 0) for (const s of fl.strokes) {
    const [a, b] = s.pts, dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = (-dy / l) * 46, ny = (dx / l) * 46;
    const ex = (dx / l) * 30, ey = (dy / l) * 30;
    wash(c, [[a[0] - ex + nx, a[1] - ey + ny], [b[0] + ex + nx, b[1] + ey + ny], [b[0] + ex - nx, b[1] + ey - ny], [a[0] - ex - nx, a[1] - ey - ny]], '#4A4466', { seed: 31 + Math.round(a[0]), rough: 2, ink: null, alpha: rd * 0.95, shade: 0.25 });
  }
  // 2. wedges (wholes first, then parts)
  const ordered = fl.marks.slice().sort((p, q) => (q.m.lvl ?? 0) - (p.m.lvl ?? 0));
  for (const ml of ordered) {
    const m = ml.m, vis = v(look.marks, m.id);
    if (vis <= 0) continue;
    const col = ROLE[look.col?.[m.id] ?? m.col ?? 'plain'];
    const whole = (m.lvl ?? 0) === 1;
    const gl = v(look.glow, m.id, 0);
    const fillA = whole ? 0.07 + 0.13 * gl : (m.col === 'plain' ? 0.18 : 0.42) + 0.25 * gl;
    if (m.box) {
      const s = ml.arc;
      wash(c, [O, ...s], col, { alpha: vis * (fillA + 0.1), ink: null, rough: 0.6, seed: 5, shade: 0.05 });
    } else {
      const r = ml.r + (whole ? 0 : 6 * gl);
      wash(c, sector(O, r, ml.a0, ml.span), col, { alpha: vis * fillA, ink: null, rough: whole ? 1.6 : 0.8, seed: 7 + Math.round(ml.a0), shade: 0.05, lift: whole ? 0.3 : 0 });
    }
  }
  // 3. the strokes (lines with two arrowheads, lone rays with one), drawn on from the vertex
  const kl = clamp(look.lines ?? 1);
  for (const s of fl.strokes) {
    const [a, b] = s.pts;
    const pa = fl.fan.rays.find(r => near(fl.ends[r.p]!, a))?.p ?? '', pb = fl.fan.rays.find(r => near(fl.ends[r.p]!, b))?.p ?? '';
    if (s.arrows === 2) {
      arrow(c, [O, a], kl, { col: 'ink', lw: 5, head: 26, alpha: rayA(pa) });
      arrow(c, [O, b], kl, { col: 'ink', lw: 5, head: 26, alpha: rayA(pb) });
    } else arrow(c, [O, b], kl, { col: 'ink', lw: 5, head: 26, alpha: rayA(pb) });
  }
  // 4. arcs, boxes and equal-angle ticks (crisp, over the strokes' ends near the vertex)
  for (const ml of ordered) {
    const m = ml.m, vis = v(look.marks, m.id);
    if (vis <= 0) continue;
    const col = ROLE[look.col?.[m.id] ?? m.col ?? 'plain'];
    const gl = v(look.glow, m.id, 0);
    const whole = (m.lvl ?? 0) === 1;
    strokePts(c, m.box ? ml.arc : arcOf(O, ml.r + (whole ? 0 : 6 * gl), ml.a0, ml.span), { col, lw: whole ? 6 : 5 + 2 * gl, alpha: vis, glow: gl > 0 ? 14 * gl : 0 });
    const tk = vis * v(look.ticks, m.id);
    if (m.ticks && !m.box && tk > 0) for (const P of tickSegs(O, ml.r + (whole ? 0 : 6 * gl), ml.a0, ml.span, m.ticks)) strokePts(c, P, { col, lw: 5, alpha: tk });
  }
  // 5. vertex, letters, labels
  dot(c, O[0], O[1], 8, 'ink');
  const kL = clamp(look.letters ?? 1);
  const letterCol = mix('#EFE6F7', '#B7B0CC', 0.35);
  if (fl.oLetter) label(c, fl.fan.O, fl.oLetter.at, LETTER, letterCol, kL);
  for (const lt of fl.letters) label(c, lt.text, lt.at, lt.size, lt.text === lt.p ? letterCol : paint(c.th, 'dim', 'text'), kL * rayA(lt.p));
  for (const ml of fl.marks) {
    const m = ml.m;
    if (!ml.label) continue;
    const a = v(look.labels, m.id, v(look.marks, m.id));
    if (a <= 0) continue;
    const col = ROLE[look.col?.[m.id] ?? m.col ?? 'plain'];
    const s = clamp(v(look.solved, m.id, 0));
    if (m.alt !== undefined && s > 0) {
      label(c, m.text ?? '', ml.label.at, ml.label.size, col, a * (1 - s));
      label(c, m.alt, ml.label.at, ml.label.size, 'link', a * s);
    } else label(c, m.text ?? '', ml.label.at, ml.label.size, col, a);
  }
  void L;
}
const near = (p: Pt, q: Pt) => Math.abs(p[0] - q[0]) < 0.5 && Math.abs(p[1] - q[1]) < 0.5;
function arcOf(O: Pt, r: number, a0: number, span: number): Pt[] { return sector(O, r, a0, span).slice(1); }

/** the label box of a mark (for leaders), or a small box at the arc's middle when it has no label */
export function markBox(pic: Pic, id: string, fr: Frame = FIG): { x0: number; y0: number; x1: number; y1: number; cx: number; cy: number; w: number; h: number } | null {
  const lay = layoutPic(pic, fr);
  for (const fl of lay.fans) for (const ml of fl.marks) if (ml.m.id === id) {
    if (ml.label) return ml.label.box;
    const a = ((ml.a0 + ml.span / 2) * Math.PI) / 180, x = fl.O[0] + ml.r * Math.cos(a), y = fl.O[1] - ml.r * Math.sin(a);
    return { x0: x - 14, y0: y - 14, x1: x + 14, y1: y + 14, cx: x, cy: y, w: 28, h: 28 };
  }
  return null;
}
export type { AMark };
