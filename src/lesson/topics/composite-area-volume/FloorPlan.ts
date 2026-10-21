// FloorPlan: the 2-D model block of "composite area": a composite figure seen from above (a floor plan, a patio, a
// garden bed, a frame) drawn as one flat wash with a crisp outline, its holes cut out, right-angle marks in the
// corners, side lengths beside their sides (never on a line), an unlabeled side as "?", dashed heights with a
// right-angle mark, and a proposed split as translucent pieces with dashed seams (overlaps show darker, gaps show the
// figure through). Units are drawn to scale; the block throws when a label has no readable place.
//   steps (Progress keys): fig, dims, p<i> (piece i, or the piece's own key), hole (the removed region lights up),
//   and any label / segment key the caller names
//   roles: first (amber) = the figure, second / link / pick = pieces, wrong = the removed or doubly counted part
import { type Box, type Pt, box, clamp, unionBox } from '../../../core/math';
import { type Canvas, fillPts, strokePts, pathOf, withAlpha } from '../../../core/draw';
import type { Progress } from '../../../core/clock';
import { type Theme, paint } from '../../../core/theme';
import { type Frame, check, hitsLines } from '../../../blocks/block';
import { drawWords, wordsBox } from '../../words';
import { wash } from '../../wash';
import { DUSK } from '../../dusk';
import type { P2 } from './measure';
import type { Role } from './Solids';

export interface PlanLabel { a: P2; b: P2; text: string; col?: Role; key?: string; inside?: boolean; size?: number }
export interface PlanSeg { a: P2; b: P2; col?: Role; key: string; right?: P2; dash?: boolean }
export interface PlanSpec {
  outer: P2[];
  holes?: P2[][];
  pieces?: { pts: P2[]; role: Role; key?: string }[];
  labels?: PlanLabel[];
  segs?: PlanSeg[];
  role?: Role;
  /** mark the right angles of the outline (default true) */ rightAngles?: boolean;
  maxScale?: number;
  margin?: [number, number];
}
export interface PlanBlock {
  readonly kind: 'FloorPlan';
  readonly box: Box;
  readonly scale: number;
  readonly where: { at(p: P2): Pt; fig: Box; piece(i: number): Box; hole(i: number): Box; label(i: number): Box };
  draw(c: Canvas, p: Progress<string>): void;
}

const NAME = 'FloorPlan';
export function FloorPlan(s: PlanSpec, fr: Frame, th: Theme): PlanBlock {
  check(s.outer.length >= 3, NAME, 'the figure needs at least 3 corners');
  const xs = s.outer.map(q => q[0]), ys = s.outer.map(q => q[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const [MX, MY] = s.margin ?? [130, 100];
  const scale = Math.min((fr.w - 2 * MX) / (x1 - x0), (fr.h - 2 * MY) / (y1 - y0), s.maxScale ?? 120);
  check(scale > 12, NAME, `the figure would be drawn at ${Math.round(scale)} px per unit: too small to read`);
  const ox = fr.x + fr.w / 2 - scale * (x0 + x1) / 2, oy = fr.y + fr.h / 2 + scale * (y0 + y1) / 2;
  const at = (q: P2): Pt => [ox + scale * q[0], oy - scale * q[1]];
  const O = s.outer.map(at), Hs = (s.holes ?? []).map(h => h.map(at));
  const inPoly = (q: Pt, H: readonly Pt[]) => {
    let inside = false;
    for (let i = 0, j = H.length - 1; i < H.length; j = i++) {
      const a = H[i]!, b = H[j]!;
      if ((a[1] > q[1]) !== (b[1] > q[1]) && q[0] < ((b[0] - a[0]) * (q[1] - a[1])) / (b[1] - a[1]) + a[0]) inside = !inside;
    }
    return inside;
  };
  const inFig = (q: Pt) => inPoly(q, O) && !Hs.some(H => inPoly(q, H));
  const boxOf = (P: readonly Pt[]): Box => box(Math.min(...P.map(q => q[0])), Math.min(...P.map(q => q[1])), Math.max(...P.map(q => q[0])), Math.max(...P.map(q => q[1])));

  // right-angle marks: at every corner whose two sides are square (inside the figure)
  const marks: Pt[][] = [];
  if (s.rightAngles ?? true) for (const P of [O, ...Hs]) for (let i = 0; i < P.length; i++) {
    const a = P[(i - 1 + P.length) % P.length]!, b = P[i]!, c = P[(i + 1) % P.length]!;
    const u = [a[0] - b[0], a[1] - b[1]], v = [c[0] - b[0], c[1] - b[1]];
    const lu = Math.hypot(u[0]!, u[1]!), lv = Math.hypot(v[0]!, v[1]!);
    if (Math.abs(u[0]! * v[0]! + u[1]! * v[1]!) > 1e-6 * lu * lv) continue;
    const m = Math.min(22, lu / 3, lv / 3);
    const q1: Pt = [b[0] + u[0]! / lu * m, b[1] + u[1]! / lu * m], q3: Pt = [b[0] + v[0]! / lv * m, b[1] + v[1]! / lv * m];
    const q2: Pt = [q1[0] + q3[0] - b[0], q1[1] + q3[1] - b[1]];
    if (inFig([(b[0] + q2[0]) / 2, (b[1] + q2[1]) / 2])) marks.push([q1, q2, q3]);
  }
  const segLines = (s.segs ?? []).map(g => [at(g.a), at(g.b)]);
  const pieceLines = (s.pieces ?? []).map(pc => { const P = pc.pts.map(at); return [...P, P[0]!]; });
  const lines: Pt[][] = [[...O, O[0]!], ...Hs.map(H => [...H, H[0]!]), ...marks, ...segLines, ...pieceLines];

  // ---- labels: beside their side, outside the figure first, never on a line ----
  interface Placed { L: PlanLabel; x: number; y: number; box: Box; size: number }
  const placed: Placed[] = [];
  for (const L of s.labels ?? []) {
    const a = at(L.a), b = at(L.b), dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
    const nx0 = -dy / len, ny0 = dx / len;
    let best: Placed | null = null;
    // pass 0 outside the figure, pass 1 anywhere off the lines, pass 2 the same at the smallest label size (44 px)
    for (const pass of [0, 1, 2]) for (const gap of [18, 34, 56, 84, 120]) for (const t of [0.5, 0.36, 0.64, 0.24, 0.76, 0.12, 0.88]) for (const sgn of [1, -1]) {
      const size = pass === 2 ? 44 : L.size ?? 48;
      if (best) break;
      const m: Pt = [a[0] + dx * t, a[1] + dy * t];
      // the outward side first: the side where a step off the line leaves the figure
      const outSide = inFig([m[0] + nx0 * 6, m[1] + ny0 * 6]) ? -1 : 1;
      const side = L.inside ? -outSide * sgn : outSide * sgn;
      const nx = nx0 * side, ny = ny0 * side;
      const b0 = wordsBox(L.text, 0, 0, { size, align: 'center' });
      const ext = Math.abs(nx) * b0.w / 2 + Math.abs(ny) * b0.h / 2;
      const x = m[0] + nx * (gap + ext), y = m[1] + ny * (gap + ext);
      const bx = wordsBox(L.text, x, y, { size, align: 'center' });
      if (bx.x0 < fr.x - 30 || bx.x1 > fr.x + fr.w + 30 || bx.y0 < fr.y - 20 || bx.y1 > fr.y + fr.h + 20) continue;
      if (hitsLines(bx, lines, 8)) continue;
      const cs: Pt[] = [[bx.x0, bx.y0], [bx.x1, bx.y0], [bx.x1, bx.y1], [bx.x0, bx.y1], [bx.cx, bx.cy]];
      if (pass === 0 && !L.inside && cs.some(inFig)) continue;
      if (placed.some(q => q.box.x0 < bx.x1 + 10 && bx.x0 < q.box.x1 + 10 && q.box.y0 < bx.y1 + 8 && bx.y0 < q.box.y1 + 8)) continue;
      best = { L, x, y, box: bx, size };
    }
    check(best !== null, NAME, `no readable place for the label "${L.text}"`);
    placed.push(best);
  }

  function draw(c: Canvas, P: Progress<string>): void {
    const kF = clamp(P.k('fig'));
    if (kF <= 0) return;
    const { g } = c;
    withAlpha(c, kF, () => {
      // the figure: one flat wash, holes cut out (even-odd clip), a crisp outline
      g.save();
      const clip = new Path2D(); clip.addPath(pathOf(O, true)); for (const H of Hs) clip.addPath(pathOf(H, true));
      g.clip(clip, 'evenodd');
      wash(c, O, s.role ?? 'first', { seed: 7, rough: 1.2, ink: null, shade: 0.22, alpha: 0.88 });
      g.restore();
      for (const H of Hs) fillPts(c, H, DUSK.navy as never, 0.55);
      strokePts(c, O, { col: DUSK.cream as never, lw: 4, closed: true, alpha: 0.95 });
      for (const H of Hs) strokePts(c, H, { col: DUSK.cream as never, lw: 4, closed: true, alpha: 0.95 });
      for (const m of marks) strokePts(c, m, { col: DUSK.cream as never, lw: 2.5, alpha: 0.75 });
    });
    // the removed region lights up
    const kH = clamp(P.k('hole'));
    if (kH > 0) for (const H of Hs) { fillPts(c, H, 'wrong', 0.3 * kH); strokePts(c, H, { col: 'wrong', lw: 4.5, closed: true, alpha: kH, dash: [14, 9], cap: 'butt' }); }
    // a split into pieces: translucent washes, dashed seams
    (s.pieces ?? []).forEach((pc, i) => {
      const k = clamp(P.k(pc.key ?? `p${i}`));
      if (k <= 0) return;
      const Q = pc.pts.map(at);
      fillPts(c, Q, pc.role, 0.36 * k);
      strokePts(c, Q, { col: paint(th, pc.role, 'line') as never, lw: 4, closed: true, alpha: k, dash: [14, 9], cap: 'butt' });
    });
    for (const sg of s.segs ?? []) {
      const k = clamp(P.k(sg.key));
      if (k <= 0) continue;
      const a = at(sg.a), b = at(sg.b);
      strokePts(c, [a, b], { col: sg.col ?? 'pick', lw: sg.dash === false ? 6 : 3.5, alpha: k, dash: sg.dash === false ? null : [12, 8], cap: 'butt' });
      if (sg.right) {
        const u = [a[0] - b[0], a[1] - b[1]], lu = Math.hypot(u[0]!, u[1]!) || 1, rv = at([sg.b[0] + sg.right[0], sg.b[1] + sg.right[1]]);
        const v = [rv[0] - b[0], rv[1] - b[1]], lv = Math.hypot(v[0]!, v[1]!) || 1, m = 20;
        const q1: Pt = [b[0] + u[0]! / lu * m, b[1] + u[1]! / lu * m], q3: Pt = [b[0] + v[0]! / lv * m, b[1] + v[1]! / lv * m];
        strokePts(c, [q1, [q1[0] + q3[0] - b[0], q1[1] + q3[1] - b[1]], q3], { col: sg.col ?? 'pick', lw: 3, alpha: k });
      }
    }
    const kD = clamp(P.k('dims'));
    for (const L of placed) {
      const k = L.L.key ? clamp(P.k(L.L.key)) : kD;
      if (k > 0) drawWords(c, L.L.text, L.x, L.y, L.L.col ?? 'first', k, { size: L.size, align: 'center' });
    }
  }
  const where = {
    at,
    fig: boxOf(O),
    piece: (i: number) => boxOf(s.pieces![i]!.pts.map(at)),
    hole: (i: number) => boxOf(Hs[i]!),
    label: (i: number) => placed[i]!.box,
  };
  return { kind: 'FloorPlan', scale, box: unionBox([where.fig, ...placed.map(q => q.box)]), where, draw };
}
