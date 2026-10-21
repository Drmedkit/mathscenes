// Freezer.ts: the painted object of the lesson's situation (a freezer that cools 6 °F every hour), washes + one ink
// line, pure. It stands in the empty part of the model while only the temperature line is up (parts 1 and 2), and
// fades when the other number lines arrive. The display shows the reading; the label beside it shows the rate.
import { clamp } from '../../../core/math';
import { rectPts, circlePts } from '../../../core/pts';
import { type Canvas, withAlpha } from '../../../core/draw';
import { inkLine, wash } from '../../wash';
import { drawWords } from '../../words';
import { DUSK } from '../../dusk';

export interface FreezerOpts { x: number; y: number; w: number; h: number; reading: string; rate: string }
export function drawFreezer(c: Canvas, o: FreezerOpts, k: number): void {
  const a = clamp(k);
  if (a <= 0) return;
  const { x, y, w, h } = o;
  withAlpha(c, a, () => {
    // the cabinet, its feet, and the split between the freezer door and the drawer below
    wash(c, rectPts(x + 20, y + h - 6, 40, 22, 6), '#3A3F6B', { seed: 201, ink: DUSK.ink, inkW: 2.5 });
    wash(c, rectPts(x + w - 60, y + h - 6, 40, 22, 6), '#3A3F6B', { seed: 202, ink: DUSK.ink, inkW: 2.5 });
    wash(c, rectPts(x, y, w, h, 26), '#C9D4E2', { seed: 203, ink: DUSK.ink, inkW: 3.5, shade: 0.35, rough: 1.6 });
    inkLine(c, [[x + 14, y + h * 0.66], [x + w - 14, y + h * 0.66]], { col: DUSK.ink, w: 3.5, seed: 204 });
    // the handles
    wash(c, rectPts(x + w - 50, y + 70, 18, h * 0.42, 9), '#7C86A8', { seed: 205, ink: DUSK.ink, inkW: 2.5 });
    wash(c, rectPts(x + 50, y + h * 0.66 + 26, w - 100, 16, 8), '#7C86A8', { seed: 206, ink: DUSK.ink, inkW: 2.5 });
    // the display with the reading (the amount: amber)
    wash(c, rectPts(x + 34, y + 44, w - 110, 96, 14), '#1A1E3C', { seed: 207, ink: DUSK.ink, inkW: 3, shade: 0.1 });
    drawWords(c, o.reading, x + 34 + (w - 110) / 2, y + 92, 'first', 1, { size: 60, align: 'center', weight: 700 });
    // frost: a painted snowflake on the door
    const cx = x + (w - 50) / 2, cy = y + 200 + (h * 0.66 - 200) / 2, r = Math.min(64, (h * 0.66 - 200) / 2 - 8);
    wash(c, circlePts(cx, cy, r + 14, 40), '#E9F1FA', { seed: 208, ink: null, alpha: 0.55, rough: 3 });
    for (let i = 0; i < 3; i++) {
      const t = (i * Math.PI) / 3, dx = Math.cos(t) * r, dy = Math.sin(t) * r;
      inkLine(c, [[cx - dx, cy - dy], [cx + dx, cy + dy]], { col: '#5E8FB3', w: 4, seed: 210 + i });
      for (const s of [-1, 1]) {
        const ex = cx + s * dx * 0.7, ey = cy + s * dy * 0.7, n = 0.22 * r;
        inkLine(c, [[ex + Math.cos(t + 2.4) * n * s, ey + Math.sin(t + 2.4) * n * s], [ex, ey], [ex + Math.cos(t - 2.4) * n * s, ey + Math.sin(t - 2.4) * n * s]], { col: '#5E8FB3', w: 3, seed: 214 + i });
      }
    }
  });
  // the rate beside it (the part that repeats every hour: teal)
  drawWords(c, o.rate, x + w + 40, y + h * 0.33, 'second', a, { size: 50, align: 'left', weight: 700 });
  drawWords(c, 'every hour', x + w + 40, y + h * 0.33 + 62, 'dim', a, { size: 44, align: 'left' });
}
