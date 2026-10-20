// annotate.ts: notation tied to the model.
//   slate(c, box)                 the notation board: a calm dark panel beside the model (never a texture behind digits)
//   leader(c, part, target, o)    a thin role-coloured line from a symbol to the part of the picture it names.
//                                 It leaves UNDER the symbol, runs along a rail below the line of notation (never
//                                 through text), exits the board on the left and curves into the target.
// Rules (research, see docs/lessons/LESSON_LINE.md): one colour per role in picture, notation and words; the symbol
// and its picture part are linked at the moment the symbol appears; only the current step's leaders are bright.
import { type Box, type Pt, clamp, lerp } from '../core/math';
import { type Canvas, dot, drawOn } from '../core/draw';
import { E } from '../core/easing';
import { type Paint, paint } from '../core/theme';
import { inkLine, wash } from './wash';
import { DUSK } from './dusk';
import { rectPts } from '../core/pts';

export function slate(c: Canvas, b: Box, k = 1): void {
  if (k <= 0) return;
  c.g.save(); c.g.globalAlpha *= clamp(k);
  wash(c, rectPts(b.x0, b.y0, b.w, b.h, 22), '#121531', { seed: 77, rough: 1.4, ink: null, shade: 0.1 });
  inkLine(c, rectPts(b.x0 + 3, b.y0 + 3, b.w - 6, b.h - 6, 20), { col: '#3A3F6B', w: 3, closed: true, seed: 78, rough: 0.8 });
  c.g.restore();
}

export interface LeaderOpts {
  col: Paint;
  /** draw-on 0..1 */ k: number;
  /** left edge of the board: where the rail leaves it */ boardX: number;
  /** extra drop of the rail below the symbol (stack several leaders from one line) */ drop?: number;
  alpha?: number;
  /** leave from the top of the symbol instead (for targets above the line) */ up?: boolean;
}
/** the path of a leader: down from the symbol, along the rail, out of the board, into the target's right side */
export function leaderPts(part: Box, target: Box, o: Pick<LeaderOpts, 'boardX' | 'drop' | 'up'>): Pt[] {
  const drop = 18 + (o.drop ?? 0);
  const ry = o.up ? part.y0 - drop : part.y1 + drop;
  const start: Pt = [part.cx, o.up ? part.y0 - 8 : part.y1 + 8];
  const exitX = o.boardX - 18;
  const end: Pt = [target.x1 + 16, clamp(ry, target.y0 + 10, target.y1 - 10)];
  const P: Pt[] = [start, [part.cx, ry]];
  // rail: from under the symbol to the board edge
  P.push([exitX, ry]);
  // curve out to the target (cubic, horizontal tangents at both ends)
  const c1: Pt = [exitX - Math.max(40, (exitX - end[0]) * 0.45), ry], c2: Pt = [end[0] + Math.max(40, (exitX - end[0]) * 0.45), end[1]];
  for (let i = 1; i <= 28; i++) {
    const t = i / 28, u = 1 - t;
    P.push([u * u * u * exitX + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * end[0],
      u * u * u * ry + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * end[1]]);
  }
  return P;
}
export function leader(c: Canvas, part: Box, target: Box, o: LeaderOpts): void {
  const k = clamp(o.k), a = clamp(o.alpha ?? 1);
  if (k <= 0 || a <= 0) return;
  const P = leaderPts(part, target, o);
  c.g.save(); c.g.globalAlpha *= a;
  dot(c, P[0]![0], P[0]![1], 5, o.col, Math.min(1, k * 6));
  drawOn(c, P, E.inOut(k), { col: o.col, lw: 3.5 });
  if (k > 0.97) {
    const e = P[P.length - 1]!;
    dot(c, e[0], e[1], 8, o.col, (k - 0.97) / 0.03);
    dot(c, e[0], e[1], 3.5, paint(c.th, 'ink', 'fill') === '#EFE6F7' ? DUSK.navy : '#FFFFFF', (k - 0.97) / 0.03);
  }
  c.g.restore();
}

/** a soft underline under a symbol in its role colour (the symbol is 'live': it has a picture partner) */
export function underline(c: Canvas, part: Box, col: Paint, k: number): void {
  if (k <= 0) return;
  const y = part.y1 + 10;
  drawOn(c, [[part.x0, y], [lerp(part.x0, part.x1, 1), y]], E.inOut(clamp(k)), { col, lw: 4 });
}
