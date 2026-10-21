// CalcScreen: a calculator or a spreadsheet showing a number in E-notation ("4.7E-8", "1.20E+09"), painted as an
// object (a calculator body with an LCD, or a sheet with one cell picked), so E-notation reads as what a device
// displays, not as maths. The display text is drawn in a monospace digital style; the translation lives on the board.
//   body    the device appears
//   text    the display text types on
import { type Box, box, clamp } from '../../../core/math';
import { type Canvas, withAlpha } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Theme } from '../../../core/theme';
import { type Frame, check } from '../../../blocks/block';
import { rectPts } from '../../../core/pts';
import { inkLine, wash } from '../../wash';
import { DUSK } from '../../dusk';
import { SANS } from '../../words';

export type ScreenStep = 'body' | 'text';
const NAME = 'CalcScreen';
const MONO = '"Cascadia Mono", Consolas, "DejaVu Sans Mono", ui-monospace, monospace';

export interface ScreenBlock {
  readonly kind: 'CalcScreen';
  readonly box: Box;
  readonly where: { screen: Box; text: Box };
  draw(c: Canvas, k: { body: number; text: number }): void;
}
export function CalcScreen(text: string, device: 'calculator' | 'spreadsheet', fr: Frame, _th: Theme): ScreenBlock {
  check(/^\d+(\.\d+)?E[+-]?\d+$/.test(text), NAME, `"${text}" is not E-notation`);
  const size = 92, cw = size * 0.6;
  const tw = text.length * cw;
  if (device === 'calculator') {
    const W = Math.max(560, tw + 160), H = 760;
    check(W <= fr.w, NAME, 'the display text is too long');
    const x0 = fr.x + (fr.w - W) / 2, y0 = fr.y + (fr.h - H) / 2;
    const scr = box(x0 + 50, y0 + 60, x0 + W - 50, y0 + 250);
    const txt = box(scr.x1 - 40 - tw, scr.cy - size * 0.4, scr.x1 - 40, scr.cy + size * 0.4);
    return {
      kind: 'CalcScreen', box: box(x0, y0, x0 + W, y0 + H), where: { screen: scr, text: txt },
      draw(c, k) {
        const kb = E.smooth(clamp(k.body));
        if (kb <= 0) return;
        withAlpha(c, kb, () => {
          wash(c, rectPts(x0, y0, W, H, 46), '#2B2F55', { seed: 501, ink: DUSK.ink, inkW: 4, shade: 0.35, rough: 1.2 });
          wash(c, rectPts(scr.x0, scr.y0, scr.w, scr.h, 16), '#B8C7A4', { seed: 502, ink: DUSK.ink, inkW: 3, shade: 0.15, rough: 0.8 });
          // a few keys, calm
          for (let r = 0; r < 4; r++) for (let q = 0; q < 4; q++) {
            const kw = (W - 100 - 3 * 26) / 4, kx = x0 + 50 + q * (kw + 26), ky = y0 + 310 + r * 108;
            wash(c, rectPts(kx, ky, kw, 76, 14), q === 3 ? '#C97E5E' : '#3E4373', { seed: 510 + r * 4 + q, ink: DUSK.ink, inkW: 2.5, shade: 0.3, rough: 0.8 });
          }
        });
        drawMono(c, text, txt.x1, scr.cy, size, '#1E2A16', clamp(k.text), kb);
      },
    };
  }
  // a spreadsheet: column letters, row numbers, one picked cell with the value
  const colW = Math.max(tw + 90, 420), W = 140 + colW + 220, H = 600;
  check(W <= fr.w + 40, NAME, 'the cell text is too long');
  const x0 = fr.x + (fr.w - W) / 2, y0 = fr.y + (fr.h - H) / 2;
  const cell = box(x0 + 140, y0 + 90 + 2 * 130, x0 + 140 + colW, y0 + 90 + 3 * 130);
  const txt = box(cell.x1 - 30 - tw, cell.cy - size * 0.4, cell.x1 - 30, cell.cy + size * 0.4);
  return {
    kind: 'CalcScreen', box: box(x0, y0, x0 + W, y0 + H), where: { screen: cell, text: txt },
    draw(c, k) {
      const kb = E.smooth(clamp(k.body));
      if (kb <= 0) return;
      const { g } = c;
      withAlpha(c, kb, () => {
        wash(c, rectPts(x0, y0, W, H, 18), '#E9E4F0', { seed: 520, ink: DUSK.ink, inkW: 3.5, shade: 0.12, rough: 1 });
        g.save(); g.fillStyle = '#C9C3D9'; g.fillRect(x0 + 4, y0 + 4, W - 8, 86); g.fillRect(x0 + 4, y0 + 4, 136, H - 8); g.restore();
        g.save(); g.font = `600 44px ${SANS}`; g.fillStyle = '#4A4466'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText('A', x0 + 140 + colW / 2, y0 + 48); g.fillText('B', x0 + 140 + colW + 110, y0 + 48);
        for (let r = 0; r < 4; r++) g.fillText(String(r + 1), x0 + 72, y0 + 90 + r * 130 + 65);
        g.restore();
        for (let r = 0; r <= 4; r++) inkLine(c, [[x0 + 4, y0 + 90 + r * 130], [x0 + W - 4, y0 + 90 + r * 130]], { col: '#A9A2C0', w: 2, seed: 530 + r, rough: 0.3 });
        for (const x of [x0 + 140, x0 + 140 + colW]) inkLine(c, [[x, y0 + 4], [x, y0 + H - 4]], { col: '#A9A2C0', w: 2, seed: 540 + x, rough: 0.3 });
        g.save(); g.strokeStyle = '#2E7D4F'; g.lineWidth = 6; g.strokeRect(cell.x0 + 3, cell.y0 + 3, cell.w - 6, cell.h - 6); g.restore();
      });
      drawMono(c, text, txt.x1, cell.cy, size, '#221B2E', clamp(k.text), kb);
    },
  };
}
function drawMono(c: Canvas, text: string, xRight: number, y: number, size: number, col: string, k: number, a: number): void {
  if (k <= 0 || a <= 0) return;
  const n = Math.ceil(text.length * k);
  const { g } = c;
  g.save(); g.globalAlpha *= a; g.font = `600 ${size}px ${MONO}`; g.fillStyle = col; g.textAlign = 'right'; g.textBaseline = 'middle';
  // right-aligned like a display: the characters type on from the left, the text stays where it ends
  const full = g.measureText(text).width;
  g.textAlign = 'left';
  g.fillText(text.slice(0, n), xRight - full, y + 4);
  g.restore();
}
