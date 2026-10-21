// GeoFig.ts: the model block of "Angle relationships with parallel lines and triangles": a figure on a sheet of dark
// drawing paper. Crisp lines where precision matters (lines with arrowheads, parallel marks, arcs, right-angle boxes),
// soft washes for the angle wedges, the band between two parallel lines and the body of a triangle or polygon.
// Colour roles (as in the rest of the line):
//   first  (amber)    the whole: the straight angle (180°), the angle sum
//   second (teal)     a given measure
//   link   (lime)     the unknown / the answer
//   pick   (lavender) the focus (the pair being named, the angle that moves)
//   wrong  (red)      wrong
//   plain             a numbered angle with no role yet
// Layout is pure (figMaths.layoutFig); this file only paints. drawFig(c, fig, fit, look) depends on its inputs only.
import type { Canvas } from '../../../core/draw';
import { arrow, dot, drawOn, strokePts } from '../../../core/draw';
import { type Pt, clamp } from '../../../core/math';
import { type Paint, mix, paint } from '../../../core/theme';
import { wash } from '../../wash';
import { SANS } from '../../words';
import { type Fig, type Fit, type MarkCol, LETTER, NAME, arcPts, boxPts, fitFig, isNumberOnly, layoutFig } from './figMaths';

export interface Look {
  /** the whole figure fades in */
  k?: number;
  /** painted streets under the lines (part 1), 0..1 */
  road?: number;
  /** per angle id: visibility 0..1 (default 1) */
  marks?: Record<string, number>;
  /** per angle id: label visibility (default: the mark's) */
  labels?: Record<string, number>;
  /** per angle id: the label crossfades from text to alt */
  solved?: Record<string, number>;
  /** per angle id: a colour override */
  col?: Record<string, MarkCol>;
  /** per angle id: a soft glow (focus) */
  glow?: Record<string, number>;
  /** per segment id: draw-on 0..1 (default 1) */
  segs?: Record<string, number>;
  /** per fill id: visibility (default 1) */
  fills?: Record<string, number>;
  /** point letters and line names fade in */
  letters?: number;
  /** words (street names) */
  words?: number;
}
const ROLE: Record<MarkCol, Paint> = { first: 'first', second: 'second', link: 'link', pick: 'pick', wrong: 'wrong', plain: 'dim' };
const v = (o: Record<string, number> | undefined, id: string | undefined, d = 1) => (o && id !== undefined && id in o ? o[id]! : d);

/** the drawing sheet behind the figure (a lighter navy, so the wall and the figure separate) */
export function sheet(c: Canvas, fr: { x: number; y: number; w: number; h: number }, k = 1): void {
  if (k <= 0) return;
  const x0 = fr.x - 10, y0 = fr.y - 10, x1 = fr.x + fr.w + 10, y1 = fr.y + fr.h + 10;
  wash(c, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], '#1C2047', { seed: 23, rough: 1.3, ink: null, shade: 0.06, alpha: k });
}
function sector(O: Pt, r: number, a0: number, span: number): Pt[] { return [O, ...arcPts(O, r, a0, span)]; }
function label(c: Canvas, t: string, at: Pt, size: number, col: Paint, a: number, italic = false): void {
  if (a <= 0 || !t) return;
  const { g } = c;
  g.save(); g.globalAlpha *= clamp(a);
  g.font = `${italic ? 'italic ' : ''}650 ${size}px ${SANS}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineJoin = 'round'; g.lineWidth = 10; g.strokeStyle = 'rgba(18,20,46,0.92)';
  g.strokeText(t, at[0], at[1] + size * 0.03);
  g.fillStyle = paint(c.th, col, 'text'); g.fillText(t, at[0], at[1] + size * 0.03);
  g.restore();
}

export function drawFig(c: Canvas, f: Fig, fit: Fit = fitFig(f), look: Look = {}): void {
  const k = clamp(look.k ?? 1);
  if (k <= 0) return;
  const L = layoutFig(f, fit);
  c.g.save(); c.g.globalAlpha *= k;
  // 1. washes: the band between parallel lines, the body of a shape, triangle tints
  for (const x of f.fills) {
    const a = v(look.fills, x.id);
    if (a <= 0) continue;
    const P = x.pts.map(p => [fit.ox + fit.s * p[0], fit.oy - fit.s * p[1]] as Pt);
    if (x.col === 'body') wash(c, P, '#34356B', { alpha: a * (x.alpha ?? 0.85), ink: null, rough: 1.2, seed: 9, shade: 0.12 });
    else if (x.col === 'band') wash(c, P, 'second', { alpha: a * 0.16 * (x.alpha ?? 1), ink: null, rough: 2, seed: 13, shade: 0.05 });
    else wash(c, P, ROLE[x.col], { alpha: a * (x.alpha ?? 0.35), ink: null, rough: 1.2, seed: 15 + Math.round(P[0]![0]), shade: 0.05 });
  }
  // 2. streets under the lines (part 1)
  const rd = clamp(look.road ?? 0);
  if (rd > 0) for (const s of L.segs) {
    if (s.s.arrows !== 2) continue;
    const [a, b] = [s.A, s.B], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = (-dy / l) * 40, ny = (dx / l) * 40;
    wash(c, [[a[0] + nx, a[1] + ny], [b[0] + nx, b[1] + ny], [b[0] - nx, b[1] - ny], [a[0] - nx, a[1] - ny]], '#4A4466', { seed: 31 + Math.round(a[0]), rough: 2, ink: null, alpha: rd * 0.9, shade: 0.25 });
  }
  // 3. angle wedges (wholes first)
  const ordered = L.angles.slice().sort((p, q) => Number(!!q.m.whole) - Number(!!p.m.whole));
  for (const al of ordered) {
    const m = al.m, vis = v(look.marks, m.id);
    if (vis <= 0) continue;
    const col = ROLE[look.col?.[m.id] ?? m.col ?? 'plain'], gl = v(look.glow, m.id, 0);
    if (isNumberOnly(m) && gl <= 0 && !look.col?.[m.id]) continue;
    const fillA = m.whole ? 0.08 + 0.12 * gl : ((m.col ?? 'plain') === 'plain' ? 0.16 : 0.4) + 0.25 * gl;
    if (m.box) wash(c, [al.V, ...boxPts(al.V, al.a0, al.span, al.r)], col, { alpha: vis * (fillA + 0.1), ink: null, rough: 0.5, seed: 5, shade: 0.05 });
    else wash(c, sector(al.V, al.r + 4 * gl, al.a0, al.span), col, { alpha: vis * fillA, ink: null, rough: m.whole ? 1.4 : 0.7, seed: 7 + Math.round(al.a0), shade: 0.05, lift: m.whole ? 0.3 : 0 });
  }
  // 4. the strokes: lines draw on from their middle, rays from their start, segments plain
  for (const s of L.segs) {
    const kd = clamp(v(look.segs, s.s.id));
    if (kd <= 0) continue;
    const col: Paint = s.s.col && s.s.col !== 'ink' ? ROLE[s.s.col] : 'ink';
    if (s.s.dash) { strokePts(c, [s.A, [s.A[0] + (s.B[0] - s.A[0]) * kd, s.A[1] + (s.B[1] - s.A[1]) * kd]], { col, lw: 4, dash: [16, 14], cap: 'butt' }); }
    else if (s.s.arrows === 2) {
      const mid: Pt = [(s.A[0] + s.B[0]) / 2, (s.A[1] + s.B[1]) / 2];
      arrow(c, [mid, s.A], kd, { col, lw: 5, head: 26 }); arrow(c, [mid, s.B], kd, { col, lw: 5, head: 26 });
    } else if (s.s.arrows === 1) arrow(c, [s.A, s.B], kd, { col, lw: 5, head: 26 });
    else drawOn(c, [s.A, s.B], kd, { col, lw: 5 });
    // parallel marks: small chevrons pointing along the line
    if (s.s.par && kd > 0.95) {
      const t = s.s.parAt ?? 0.2, P: Pt = [s.A[0] + (s.B[0] - s.A[0]) * t, s.A[1] + (s.B[1] - s.A[1]) * t];
      const dx = s.B[0] - s.A[0], dy = s.B[1] - s.A[1], l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l;
      for (let i = 0; i < s.s.par; i++) {
        const tip: Pt = [P[0] + ux * 18 * i, P[1] + uy * 18 * i];
        strokePts(c, [[tip[0] - ux * 18 - uy * 14, tip[1] - uy * 18 + ux * 14], tip, [tip[0] - ux * 18 + uy * 14, tip[1] - uy * 18 - ux * 14]], { col: 'ink', lw: 4.5 });
      }
    }
  }
  // 5. arcs, boxes and matching arcs (crisp, over the strokes)
  for (const al of ordered) {
    const m = al.m, vis = v(look.marks, m.id);
    if (vis <= 0) continue;
    const col = ROLE[look.col?.[m.id] ?? m.col ?? 'plain'], gl = v(look.glow, m.id, 0);
    if (isNumberOnly(m) && gl <= 0 && !look.col?.[m.id]) continue;
    if (m.box) { strokePts(c, boxPts(al.V, al.a0, al.span, al.r), { col, lw: 5, alpha: vis, glow: gl > 0 ? 14 * gl : 0 }); continue; }
    const n = m.arcs ?? 1;
    for (let i = 0; i < n; i++) strokePts(c, arcPts(al.V, al.r + 4 * gl - 12 * i, al.a0, al.span), { col, lw: m.whole ? 6 : 5 + 2 * gl, alpha: vis, glow: gl > 0 ? 14 * gl : 0 });
  }
  // 6. points, letters, line names, angle labels, words
  const kL = clamp(look.letters ?? 1);
  const letterCol = mix('#EFE6F7', '#B7B0CC', 0.35);
  for (const p of L.points) {
    const P: Pt = [fit.ox + fit.s * p.p.at[0], fit.oy - fit.s * p.p.at[1]];
    if (p.p.dot) dot(c, P[0], P[1], 8, 'ink', kL);
    label(c, p.p.name, p.at, LETTER, letterCol, kL);
  }
  for (const n of L.names) label(c, n.s.name!, n.at, NAME, letterCol, kL * clamp(v(look.segs, n.s.id)), true);
  for (const al of L.angles) {
    const m = al.m;
    if (!al.label) continue;
    const a = v(look.labels, m.id, v(look.marks, m.id));
    if (a <= 0) continue;
    const col = ROLE[look.col?.[m.id] ?? m.col ?? 'plain'];
    const s = clamp(v(look.solved, m.id, 0));
    if (m.alt !== undefined && s > 0) {
      label(c, m.text ?? '', al.label.at, al.label.size, col, a * (1 - s));
      label(c, m.alt, al.label.at, al.label.size, 'link', a * s);
    } else label(c, m.text ?? '', al.label.at, al.label.size, col, a);
  }
  const kw = clamp(look.words ?? 1);
  for (const w of L.words) label(c, w.w.text, w.at, w.size, 'dim', kw);
  if (L.nts) {
    const { g } = c;
    g.save(); g.font = `italic 600 44px ${SANS}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = paint(c.th, 'dim', 'text'); g.fillText('not drawn to scale', L.nts[0], L.nts[1]); g.restore();
  }
  c.g.restore();
}

/** the label box of an angle (for leaders and glows), or a small box at its arc */
export function angleBox(f: Fig, id: string, fit: Fit = fitFig(f)) {
  const L = layoutFig(f, fit);
  const al = L.angles.find(a => a.m.id === id);
  if (!al) return null;
  if (al.label) return al.label.box;
  const a = ((al.a0 + al.span / 2) * Math.PI) / 180, x = al.V[0] + al.r * Math.cos(a), y = al.V[1] - al.r * Math.sin(a);
  return { x0: x - 14, y0: y - 14, x1: x + 14, y1: y + 14, cx: x, cy: y, w: 28, h: 28 };
}
