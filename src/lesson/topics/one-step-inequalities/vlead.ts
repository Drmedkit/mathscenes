// vlead.ts: a leader that reaches a number on a number line from ABOVE or BELOW (local helper; the runtime leader
// ends horizontally at the right side of its target, which on a number line would run along the axis and through the
// tick numbers). The path: down from the symbol on the board, along a rail under its line of notation to the board's
// left edge, an S-bend in the free gap between the model and the board to a travel height outside the number rows,
// across, then a rounded corner and straight down (or up) onto the number. Never through text, never along an axis.
import { type Box, type Pt, clamp } from '../../../core/math';
import { type Canvas, dot, drawOn } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Paint } from '../../../core/theme';
import { DUSK } from '../../dusk';

export interface VLead {
  key: string; from: () => Box; to: () => Box; col: Paint;
  /** reach the target from above or below */ side: 'above' | 'below';
  /** extra drop of the rail under the symbol */ drop?: number;
}
export function vleadPts(part: Box, T: Box, side: 'above' | 'below', boardX: number, drop = 0): Pt[] {
  const ry = part.y1 + 18 + drop;
  const exitX = boardX - 18;
  const edge = side === 'above' ? T.y0 - 8 : T.y1 + 8;
  const ya = side === 'above' ? Math.min(ry, edge - 46) : Math.max(ry, edge + 46);
  const P: Pt[] = [[part.cx, part.y1 + 8], [part.cx, ry], [exitX, ry]];
  let x = exitX;
  if (Math.abs(ya - ry) > 1) {
    const x1 = exitX - 80;
    for (let i = 1; i <= 20; i++) {
      const t = i / 20, u = 1 - t;
      P.push([u * u * u * exitX + 3 * u * u * t * (exitX - 40) + 3 * u * t * t * (x1 + 40) + t * t * t * x1, u * u * u * ry + 3 * u * u * t * ry + 3 * u * t * t * ya + t * t * t * ya]);
    }
    x = x1;
  }
  const R = Math.max(4, Math.min(28, Math.abs(edge - ya) - 2));
  const s = side === 'above' ? 1 : -1;
  P.push([T.cx + R, ya]);
  for (let i = 1; i <= 8; i++) { const a = (Math.PI / 2) * (i / 8); P.push([T.cx + R - R * Math.sin(a), ya + s * (R - R * Math.cos(a))]); }
  P.push([T.cx, edge]);
  void x;
  return P;
}
export function drawVLead(c: Canvas, d: VLead, k: number, alpha: number, boardX: number): void {
  k = clamp(k);
  if (k <= 0 || alpha <= 0) return;
  const P = vleadPts(d.from(), d.to(), d.side, boardX, d.drop ?? 0);
  c.g.save(); c.g.globalAlpha *= clamp(alpha);
  dot(c, P[0]![0], P[0]![1], 5, d.col, Math.min(1, k * 6));
  drawOn(c, P, E.inOut(k), { col: d.col, lw: 3.5 });
  if (k > 0.97) {
    const e = P[P.length - 1]!, a = (k - 0.97) / 0.03;
    dot(c, e[0], e[1], 8, d.col, a);
    dot(c, e[0], e[1], 3.5, DUSK.navy, a);
  }
  c.g.restore();
}
