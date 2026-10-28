// GeoFig.ts: the figure block of "Definitions, postulates and first proofs": an exact figure on a sheet of dark
// drawing paper (layout in geo.ts, this file only paints). Crisp ink where precision matters (segments, rays with a
// head, lines with two heads, congruence ticks, parallel chevrons, arcs, right-angle boxes), soft washes for the angle
// wedges and bodies. Colour roles, as in the rest of the course:
//   first  (amber)    the given / the hypothesis side; a whole
//   second (teal)     the other given; a known part
//   link   (lime)     the target / the answer / what a step earns
//   pick   (lavender) the focus
//   wrong  (red)      wrong / struck
//   plain             no role yet
// Steps (Look): per seg id draw-on, per angle id mark / label / solved crossfade / colour / glow, letters, ticks.
// Could move to the kit: an exact geometry figure with marks (every Geometry lesson needs one).
import type { Canvas } from '../../../core/draw';
import { arrow, dot, drawOn, strokePts } from '../../../core/draw';
import { clamp } from '../../../core/math';
import { type Paint, mix, paint } from '../../../core/theme';
import { wash } from '../../wash';
import { SANS } from '../../words';
import { type Fig, type Fit, type Frame, type MarkCol, type Pt, LETTER, NAME, arcPts, boxPts, fitFig, layoutFig, toScreen } from './geo';

export interface Look {
  k?: number;
  /** per seg id: draw-on 0..1 (default 1) */
  segs?: Record<string, number>;
  /** per seg id: tick visibility (default 1) */
  ticks?: Record<string, number>;
  /** per angle id: mark visibility (default 1) */
  marks?: Record<string, number>;
  /** per angle / seg id: label visibility (default: the mark's) */
  labels?: Record<string, number>;
  /** per angle / seg id: label crossfades text -> alt */
  solved?: Record<string, number>;
  /** per angle / seg id: colour override */
  col?: Record<string, MarkCol>;
  /** per angle / seg id: glow 0..1 */
  glow?: Record<string, number>;
  /** solve-only parts (segs with solve, angles with solve 'only') */
  solve?: number;
  letters?: number;
  words?: number;
  fills?: number;
}
const ROLE: Record<MarkCol, Paint> = { first: 'first', second: 'second', link: 'link', pick: 'pick', wrong: 'wrong', plain: 'dim' };
const v = (o: Record<string, number> | undefined, id: string | undefined, d = 1) => (o && id !== undefined && id in o ? o[id]! : d);
export const LETTER_COL = mix('#EFE6F7', '#B7B0CC', 0.3);

/** the drawing sheet behind a figure */
export function sheet(c: Canvas, fr: Frame, k = 1, seed = 23): void {
  if (k <= 0) return;
  const x0 = fr.x - 8, y0 = fr.y - 8, x1 = fr.x + fr.w + 8, y1 = fr.y + fr.h + 8;
  wash(c, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], '#1C2047', { seed, rough: 1.3, ink: null, shade: 0.06, alpha: k });
}
export function label(c: Canvas, t: string, p: Pt, size: number, col: Paint, a: number, italic = false, weight = 650): void {
  if (a <= 0 || !t) return;
  const { g } = c;
  g.save(); g.globalAlpha *= clamp(a);
  g.font = `${italic ? 'italic ' : ''}${weight} ${size}px ${SANS}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineJoin = 'round'; g.lineWidth = 10; g.strokeStyle = 'rgba(20,23,52,0.92)';
  g.strokeText(t, p[0], p[1] + size * 0.03);
  g.fillStyle = paint(c.th, col, 'text'); g.fillText(t, p[0], p[1] + size * 0.03);
  g.restore();
}
const sector = (V: Pt, r: number, a0: number, span: number): Pt[] => [V, ...arcPts(V, r, a0, span)];

export function drawFig(c: Canvas, f: Fig, fr: Frame, look: Look = {}, fit: Fit = fitFig(f, fr)): void {
  const k = clamp(look.k ?? 1);
  if (k <= 0) return;
  const L = layoutFig(f, fit), ks = clamp(look.solve ?? 0);
  c.g.save(); c.g.globalAlpha *= k;
  // 1. washes: bodies and tints
  const kf = clamp(look.fills ?? 1);
  if (kf > 0) for (const x of f.fills ?? []) {
    const P = x.pts.map(p => toScreen(fit, p));
    if (x.col === 'body') wash(c, P, '#34356B', { alpha: kf * (x.alpha ?? 0.8), ink: null, rough: 1.2, seed: 9, shade: 0.12 });
    else wash(c, P, ROLE[x.col], { alpha: kf * (x.alpha ?? 0.3), ink: null, rough: 1.2, seed: 15 + Math.round(P[0]![0]), shade: 0.05 });
  }
  // 2. angle wedges
  for (const al of L.angles) {
    const m = al.m;
    const vis = v(look.marks, m.id) * (m.solve === 'only' ? ks : 1);
    if (vis <= 0 || m.nameOnly || m.bare) continue;
    const cc = look.col?.[m.id] ?? m.col ?? 'plain', col = ROLE[cc], gl = v(look.glow, m.id, 0);
    const fa = (cc === 'plain' ? 0.14 : 0.36) + 0.25 * gl;
    if (m.box) wash(c, [al.V, ...boxPts(al.V, al.a0, al.span, al.r)], col, { alpha: vis * (fa + 0.1), ink: null, rough: 0.5, seed: 5, shade: 0.05 });
    else wash(c, sector(al.V, al.r + 4 * gl, al.a0, al.span), col, { alpha: vis * fa, ink: null, rough: 0.7, seed: 7 + Math.round(al.a0), shade: 0.05 });
  }
  // 3. strokes
  for (const s of L.segs) {
    const kd = clamp(v(look.segs, s.s.id)) * (s.s.solve ? ks : 1);
    if (kd <= 0) continue;
    const cc = (s.s.id && look.col?.[s.s.id]) || s.s.col;
    const col: Paint = cc === 'faint' ? 'faint' : cc && cc !== 'ink' ? ROLE[cc as MarkCol] : 'ink';
    const gl = v(look.glow, s.s.id, 0);
    const o = { col, lw: 5, glow: gl > 0 ? 16 * gl : 0 };
    if (s.s.dash) strokePts(c, [s.A, [s.A[0] + (s.B[0] - s.A[0]) * kd, s.A[1] + (s.B[1] - s.A[1]) * kd]], { col, lw: 4, dash: [16, 14], cap: 'butt' });
    else if ((s.s.kind ?? 'seg') === 'line') {
      const mid: Pt = [(s.A[0] + s.B[0]) / 2, (s.A[1] + s.B[1]) / 2];
      arrow(c, [mid, s.A], kd, { ...o, head: 26 }); arrow(c, [mid, s.B], kd, { ...o, head: 26 });
    } else if (s.s.kind === 'ray') arrow(c, [s.A, s.B], kd, { ...o, head: 26 });
    else drawOn(c, [s.A, s.B], kd, { col, lw: 5, glow: o.glow });
    const kt = v(look.ticks, s.s.id) * clamp((kd - 0.9) / 0.1);
    for (const t of s.ticks) strokePts(c, t, { col: 'ink', lw: 4.5, alpha: kt });
    for (const ch of s.chev) strokePts(c, ch, { col: 'ink', lw: 4.5, alpha: clamp((kd - 0.9) / 0.1) });
  }
  // 4. arcs and boxes over the strokes
  for (const al of L.angles) {
    const m = al.m;
    const vis = v(look.marks, m.id) * (m.solve === 'only' ? ks : 1);
    if (vis <= 0 || m.nameOnly) continue;
    const col = ROLE[look.col?.[m.id] ?? m.col ?? 'plain'], gl = v(look.glow, m.id, 0);
    if (m.box) { strokePts(c, boxPts(al.V, al.a0, al.span, al.r), { col, lw: 5, alpha: vis, glow: gl > 0 ? 14 * gl : 0 }); continue; }
    for (let i = 0; i < (m.arcs ?? 1); i++) strokePts(c, arcPts(al.V, al.r + 4 * gl - 12 * i, al.a0, al.span), { col, lw: 5 + 2 * gl, alpha: vis, glow: gl > 0 ? 14 * gl : 0 });
  }
  // 5. points, letters, names, labels, words
  const kL = clamp(look.letters ?? 1);
  for (const p of L.points) { if (p.p.dot !== false) dot(c, p.P[0], p.P[1], 8, 'ink', kL); label(c, p.p.name, p.at, LETTER, LETTER_COL, kL); }
  for (const s of L.segs) {
    const kd = clamp(v(look.segs, s.s.id)) * (s.s.solve ? ks : 1);
    if (s.name) label(c, s.s.name!, s.name.at, NAME, LETTER_COL, kL * kd, true);
    if (s.label) {
      const a = v(look.labels, s.s.id, 1) * kd, cc = look.col?.[s.s.id ?? ''] ?? (s.s.col && s.s.col !== 'ink' && s.s.col !== 'faint' ? s.s.col : 'plain');
      const sv = clamp(v(look.solved, s.s.id, 0));
      if (s.s.alt !== undefined && sv > 0) { label(c, s.s.text ?? '', s.label.at, 60, ROLE[cc], a * (1 - sv)); label(c, s.s.alt, s.label.at, 60, 'link', a * sv); }
      else label(c, s.s.text ?? '', s.label.at, 60, ROLE[cc], a);
    }
  }
  for (const al of L.angles) {
    const m = al.m;
    if (!al.label) continue;
    const a = v(look.labels, m.id, v(look.marks, m.id)) * (m.solve === 'only' ? ks : 1);
    if (a <= 0) continue;
    const col = m.nameOnly && !look.col?.[m.id] ? ('ink' as Paint) : ROLE[look.col?.[m.id] ?? m.col ?? 'plain'];
    const sv = clamp(v(look.solved, m.id, 0));
    if (m.alt !== undefined && sv > 0) { label(c, m.text ?? '', al.label.at, al.label.size, col, a * (1 - sv)); label(c, m.alt, al.label.at, al.label.size, 'link', a * sv); }
    else label(c, m.text ?? '', al.label.at, al.label.size, col, a);
  }
  const kw = clamp(look.words ?? 1);
  for (const w of L.words) label(c, w.w.text, w.at, w.size, w.w.col ? ROLE[w.w.col] : 'dim', kw, false, 600);
  c.g.restore();
}
