// Calculator: a painted pocket calculator whose display shows a division and its result, the real object of the
// question ("your calculator shows 0.1666666667: is that 1/6 exactly?"). The display is a finite window: the topic is
// what the window does not show. Steps: body, keys, display (the result writes on), mark (a ring on the last digit,
// where a rounded display changed a digit). Pure painter; text in the clean sans of words.ts.
import { type Box, box, clamp } from '../../../core/math';
import { rectPts } from '../../../core/pts';
import { type Canvas, withAlpha } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Progress } from '../../../core/clock';
import { type Theme, paint } from '../../../core/theme';
import { type Frame, check, plainText } from '../../../blocks/block';
import { inkLine, wash } from '../../wash';
import { drawWords, wordsBox } from '../../words';

export interface CalcParams {
  /** the keys pressed, shown small above the result: "1 ÷ 6 =" */ expr: string;
  /** the display: "0.1666666667" */ shows: string;
}
export type CalcStep = 'body' | 'display' | 'mark';
export interface CalcBlock {
  readonly kind: 'Calculator';
  readonly box: Box;
  readonly where: { body: Box; display: Box; result: Box; last: Box };
  draw(c: Canvas, p: Progress<CalcStep>): void;
}
const NAME = 'Calculator';
const KEYS = ['7', '8', '9', '÷', '4', '5', '6', '×', '1', '2', '3', '−', '0', '.', '=', '+'];
const RES = 76, EXPR = 46, KEY = 48;

export function Calculator(p: CalcParams, fr: Frame, th: Theme): CalcBlock {
  plainText(p.expr, NAME, 'expr'); plainText(p.shows, NAME, 'shows');
  const W = 600, H = 820;
  check(fr.w >= W && fr.h >= H, NAME, 'the frame is too small for the calculator');
  const x0 = fr.x + (fr.w - W) / 2, y0 = fr.y + (fr.h - H) / 2;
  const body = box(x0, y0, x0 + W, y0 + H);
  const display = box(x0 + 40, y0 + 50, x0 + W - 40, y0 + 250);
  const resultRight = display.x1 - 28, resultY = display.y0 + 136;
  const result = wordsBox(p.shows, resultRight, resultY, { size: RES, weight: 500, align: 'right' });
  check(result.x0 >= display.x0 + 20, NAME, `"${p.shows}" does not fit the display`);
  const lastW = wordsBox(p.shows.slice(-1), 0, 0, { size: RES, weight: 500 }).w;
  const last = box(result.x1 - lastW, result.y0, result.x1, result.y1);
  const keyTop = display.y1 + 50, kw = (W - 80 - 3 * 24) / 4, kh = (H - (keyTop - y0) - 50 - 3 * 22) / 4;

  function draw(c: Canvas, P: Progress<CalcStep>): void {
    const kb = P.k('body'), kd = P.k('display'), km = P.k('mark');
    if (kb <= 0) return;
    withAlpha(c, E.smooth(kb), () => {
      const dy = (1 - E.out(kb)) * 30;
      c.g.save(); c.g.translate(0, dy);
      wash(c, rectPts(body.x0, body.y0, body.w, body.h, 46), '#3B3166', { seed: 61, rough: 1.4, inkW: 3, shade: 0.35 });
      wash(c, rectPts(display.x0, display.y0, display.w, display.h, 18), '#26324A', { seed: 62, rough: 1, ink: '#5D6A8C', inkW: 2.5, shade: 0.1 });
      KEYS.forEach((k, i) => {
        const cx = x0 + 40 + (i % 4) * (kw + 24), cyy = keyTop + Math.floor(i / 4) * (kh + 22);
        const op = i % 4 === 3 || k === '=';
        wash(c, rectPts(cx, cyy, kw, kh, 16), op ? '#5A4A8A' : '#4A4170', { seed: 70 + i, rough: 1, ink: null, shade: 0.3 });
        drawWords(c, k, cx + kw / 2, cyy + kh / 2, op ? 'pick' : 'dim', 1, { size: KEY, align: 'center' });
      });
      drawWords(c, p.expr, resultRight, display.y0 + 50, 'dim', 1, { size: EXPR, align: 'right' });
      if (kd > 0) drawWords(c, p.shows, resultRight, resultY, 'ink', kd, { size: RES, weight: 500, align: 'right' });
      if (km > 0) {
        const g = c.g; g.save(); g.globalAlpha *= clamp(km);
        g.strokeStyle = paint(th, 'pick', 'fill'); g.lineWidth = 5;
        g.beginPath(); g.roundRect(last.x0 - 10, last.y0 - 8, last.w + 20, last.h + 16, 12); g.stroke(); g.restore();
      }
      inkLine(c, [[display.x0 + 20, display.y1 - 18], [display.x1 - 20, display.y1 - 18]], { col: '#5D6A8C', w: 2, seed: 64, alpha: 0.5 });
      c.g.restore();
    });
  }
  return { kind: 'Calculator', box: body, where: { body, display, result, last }, draw };
}
