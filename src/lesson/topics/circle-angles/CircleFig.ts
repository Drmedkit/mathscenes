// CircleFig.ts: the circle figure block of "Arcs and angles in circles", the draw half (the pure half, spec and
// layout, is cfig.ts). On the course's dark drawing sheet: the disc as a soft wash, the circle as one crisp ink line,
// arcs as thick strokes in their colour role (glow for focus), then the course's GeoFig on top (chords, radii, tangent
// and secant lines, angle marks at their true measure, letters), then the arc labels outside the circle (a label can
// crossfade "?" -> the answer in the worked solution).
// Steps (Look, as GeoFig's, plus): circle (the circle draws on), disc, arcs[id] (visibility), arcLabels[id].
// Could move to the kit (with cfig.ts): chords-tangents, arcs-and-sectors and circle-equations all need a circle
// with arcs, chords, tangents and angle marks.
import type { Canvas } from '../../../core/draw';
import { drawOn, strokePts } from '../../../core/draw';
import { clamp } from '../../../core/math';
import type { Paint } from '../../../core/theme';
import { wash } from '../../wash';
import { type Frame, type MarkCol, type Pt, toScreen } from '../geometry-foundations/geo';
import { type Look, drawFig, label } from '../geometry-foundations/GeoFig';
import { type CFig, type CLay, arcPoly, cfLayout, circlePts } from './cfig';

export interface CLook extends Look {
  circle?: number;
  disc?: number;
  /** per arc id: visibility (default 1) */
  arcs?: Record<string, number>;
  /** per arc id: label visibility (default: the arc's) */
  arcLabels?: Record<string, number>;
}
const ROLE: Record<MarkCol, Paint> = { first: 'first', second: 'second', link: 'link', pick: 'pick', wrong: 'wrong', plain: 'dim' };
const v = (o: Record<string, number> | undefined, id: string, d = 1) => (o && id in o ? o[id]! : d);

export function drawCF(c: Canvas, cf: CFig, fr: Frame, look: CLook = {}, L: CLay = cfLayout(cf, fr)): void {
  const k = clamp(look.k ?? 1);
  if (k <= 0) return;
  const S = (p: Pt) => toScreen(L.fit, p);
  const ks = clamp(look.solve ?? 0);
  c.g.save(); c.g.globalAlpha *= k;
  // the disc and the circle
  const kc = clamp(look.circle ?? 1), kd = clamp(look.disc ?? 1);
  cf.circles.forEach((cc, i) => {
    const P = circlePts(cc).map(S);
    if (kd > 0) wash(c, P, '#2E3166', { alpha: 0.55 * kd, ink: null, rough: 0.6, seed: 31 + i, shade: 0.08 });
    drawOn(c, P, kc, { col: 'ink', lw: 5 });
  });
  // arcs: thick strokes along the circle
  for (const a of cf.arcs) {
    const vis = v(look.arcs, a.id) * (a.solve ? ks : 1) * clamp((kc - 0.8) / 0.2);
    if (vis <= 0) continue;
    const cc = look.col?.[a.id] ?? a.col ?? 'plain', gl = v(look.glow, a.id, 0);
    strokePts(c, arcPoly(cf, a).map(S), { col: ROLE[cc], lw: (a.thin ? 7 : 12) + 3 * gl, alpha: vis, glow: gl > 0 ? 16 * gl : 0 });
  }
  c.g.restore();
  drawFig(c, cf.fig, fr, look, L.fit);
  // arc labels
  c.g.save(); c.g.globalAlpha *= k;
  for (const lb of L.labels) {
    const a = lb.arc;
    const vis = v(look.arcLabels, a.id, v(look.arcs, a.id)) * (a.solve ? ks : 1) * clamp((kc - 0.8) / 0.2);
    if (vis <= 0) continue;
    const at = S(lb.at), col = ROLE[look.col?.[a.id] ?? a.col ?? 'plain'];
    const sv = clamp(v(look.solved, a.id, 0));
    if (a.alt !== undefined && sv > 0) { label(c, a.text ?? '', at, lb.size, col, vis * (1 - sv)); label(c, a.alt, at, lb.size, 'link', vis * sv); }
    else label(c, a.text ?? '', at, lb.size, col, vis);
  }
  c.g.restore();
}
