// Calc: a calculator display is a CUT-OFF. A painted square of a known area (optional) and a painted calculator whose
// screen shows what was typed and the first digits of the answer; the 'cut' step shows the digits that do not fit
// running on past the screen's edge (faint, lavender), so "the display is the number" is visibly false.
//   square   the painted square (amber) and its area under it      side   the side bracket and its name (lime)
//   calc     the calculator body and the typed keys                 display  the digits on the screen
//   cut      a dashed edge at the end of the screen and the digits that run on past it
// Exact: the shown and the hidden digits come from realMaths (the block only lays them out).
import { type Box, box, clamp, unionBox } from '../../../core/math';
import { rectPts } from '../../../core/pts';
import { type Canvas, withAlpha } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Progress } from '../../../core/clock';
import { type Theme, paint } from '../../../core/theme';
import { type Formula, tex, texBox, texDraw, texWidth } from '../../../core/tex';
import { type Frame, check } from '../../../blocks/block';
import { inkLine, wash } from '../../wash';

export type CalcStep = 'square' | 'side' | 'calc' | 'display' | 'cut';
export const CALC_STEPS: readonly CalcStep[] = ['square', 'side', 'calc', 'display', 'cut'];
export interface CalcParams {
  /** a square of this area (TeX) with this side (TeX) */
  square?: { area: string; side: string };
  /** what was typed (TeX), shown small on the screen's top line */
  keys: string;
  /** the digits the screen shows */
  display: string;
  /** the digits after them that do not fit (shown by 'cut'); '' = the display is the whole number */
  more: string;
}
const NAME = 'Calc';

export interface CalcBlock {
  readonly kind: 'Calc';
  readonly box: Box;
  readonly where: { square: Box; area: Box; side: Box; screen: Box; display: Box; more: Box };
  draw(c: Canvas, p: Progress<CalcStep>, focus?: { area?: number; side?: number; display?: number }): void;
}

export function Calc(p: CalcParams, fr: Frame, th: Theme): CalcBlock {
  check(/^-?\d+(\.\d+)?$/.test(p.display) && p.display.length <= 13, NAME, `display "${p.display}": up to 13 characters`);
  check(/^\d*$/.test(p.more), NAME, 'more digits are digits');
  const NUM = 62;
  const sq = p.square ? box(fr.x + 30, fr.y + 190, fr.x + 330, fr.y + 490) : null;
  const cx0 = p.square ? fr.x + 400 : fr.x + 170, cw = 470;
  const body = box(cx0, fr.y + 90, cx0 + cw, fr.y + 870);
  const screen = box(body.x0 + 26, body.y0 + 30, body.x1 - 26, body.y0 + 230);
  const Fd = tex(p.display) as Formula, Fk = tex(p.keys) as Formula;
  const dW = texWidth(Fd, NUM);
  check(dW <= screen.w - 30, NAME, `the display (${Math.round(dW)} px) does not fit the screen`);
  const dispB = texBox(Fd, screen.x1 - 16, screen.y0 + 150, { size: NUM, align: 'right' });
  const keysB = texBox(Fk, screen.x1 - 16, screen.y0 + 58, { size: 48, align: 'right' });
  const moreF = p.more ? (tex(p.more + '{\\ldots}') as Formula) : null;
  const moreB = moreF ? texBox(moreF, screen.x1 + 14, screen.y0 + 150, { size: NUM, align: 'left' }) : box(screen.x1, screen.y0, screen.x1, screen.y0);
  check(moreB.x1 <= 1200, NAME, 'the hidden digits run into the board');
  const Farea = p.square ? (tex(`\\text{area} = ${p.square.area}\\ \\text{ft}^2`) as Formula) : null;
  const Fside = p.square ? (tex(`${p.square.side}\\ \\text{ft}`) as Formula) : null;
  const areaB = sq && Farea ? texBox(Farea, sq.cx, sq.y1 + 70, { size: 56, align: 'center' }) : box(0, 0, 0, 0);
  const sideB = sq && Fside ? texBox(Fside, sq.cx, sq.y0 - 86, { size: 64, align: 'center' }) : box(0, 0, 0, 0);
  if (sq) check(areaB.x1 < body.x0 - 10 && sideB.x1 < body.x0 - 10 && areaB.x0 >= fr.x - 30, NAME, 'the square labels run into the calculator');

  function draw(c: Canvas, P: Progress<CalcStep>, f: { area?: number; side?: number; display?: number } = {}): void {
    const kS = P.k('square'), kSd = P.k('side'), kC = P.k('calc'), kD = P.k('display'), kX = P.k('cut');
    if (sq && kS > 0) {
      const a = E.smooth(kS);
      wash(c, rectPts(sq.x0, sq.y0, sq.w, sq.h, 6), 'first', { seed: 41, alpha: a });
      texDraw(c, Farea!, sq.cx, sq.y1 + 70, { size: 56, align: 'center', k: a, col: 'first', glow: (f.area ?? 0) * 0.9 });
    }
    if (sq && kSd > 0) {
      const a = E.smooth(kSd);
      inkLine(c, [[sq.x0, sq.y0 - 14], [sq.x0, sq.y0 - 34], [sq.x1, sq.y0 - 34], [sq.x1, sq.y0 - 14]], { col: 'link', w: 4, seed: 43, alpha: a, rough: 0.5 });
      texDraw(c, Fside!, sq.cx, sq.y0 - 86, { size: 64, align: 'center', k: a, col: 'link', glow: (f.side ?? 0) * 0.9 });
    }
    if (kC > 0) {
      const a = E.smooth(kC);
      wash(c, rectPts(body.x0, body.y0, body.w, body.h, 34), '#3B3262' as never, { seed: 51, alpha: a, shade: 0.3 });
      wash(c, rectPts(screen.x0, screen.y0, screen.w, screen.h, 14), '#C9D8B0' as never, { seed: 52, alpha: a, ink: null, rough: 0.8, shade: 0.06, lift: 0 });
      // keys: blank painted caps in a 4 x 4 grid (decoration only)
      const g = c.g, kx0 = body.x0 + 40, ky0 = screen.y1 + 50, kw = (body.w - 80 - 3 * 22) / 4, kh = 96;
      for (let r = 0; r < 4; r++) for (let q = 0; q < 4; q++) {
        const x = kx0 + q * (kw + 22), y = ky0 + r * (kh + 22);
        wash(c, rectPts(x, y, kw, kh, 18), (q === 3 ? '#8A6FC9' : '#5A5288') as never, { seed: 60 + r * 4 + q, alpha: a * 0.95, ink: null, rough: 1, shade: 0.25 });
      }
      void g;
      texDraw(c, Fk, screen.x1 - 16, screen.y0 + 58, { size: 48, align: 'right', k: a, col: '#2A3320' as never });
    }
    if (kD > 0) texDraw(c, Fd, screen.x1 - 16, screen.y0 + 150, { size: NUM, align: 'right', k: E.smooth(kD), col: '#1E2616' as never, glow: 0 });
    if (kD > 0 && (f.display ?? 0) > 0) withAlpha(c, f.display!, () => { const g = c.g; g.save(); g.strokeStyle = paint(th, 'pick', 'line'); g.lineWidth = 4; g.beginPath(); g.roundRect(dispB.x0 - 12, dispB.y0 - 10, dispB.w + 24, dispB.h + 20, 10); g.stroke(); g.restore(); });
    if (kX > 0 && moreF) {
      const a = E.smooth(kX), g = c.g;
      withAlpha(c, a, () => { g.save(); g.strokeStyle = paint(th, 'pick', 'line'); g.lineWidth = 4; g.setLineDash([10, 8]); g.beginPath(); g.moveTo(screen.x1 + 2, screen.y0 - 20); g.lineTo(screen.x1 + 2, screen.y1 + 20); g.stroke(); g.restore(); });
      texDraw(c, moreF, screen.x1 + 14, screen.y0 + 150, { size: NUM, align: 'left', k: clamp(kX * 1.3), col: 'pick', alpha: 0.85 });
    }
  }
  return {
    kind: 'Calc',
    box: unionBox([body, ...(sq ? [sq, areaB, sideB] : []), moreB]),
    where: { square: sq ?? body, area: areaB, side: sideB, screen, display: dispB, more: moreB },
    draw,
  };
}
