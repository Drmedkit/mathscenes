// Thermo: one thermometer read on two scales, Celsius on the left and Fahrenheit on the right. The scales are
// lined up by temperature, so 0 °C sits next to 32 °F: a READING needs the offset (F = 9/5 C + 32), while a RISE
// is the same stretch of the tube on both sides and only scales by 9/5 (no + 32). That is why temperature has no
// single unit factor.
// Steps: scales, zero, mark, rise.
import { type Box, box, clamp } from '../../../core/math';
import { type Canvas, withAlpha } from '../../../core/draw';
import type { Progress } from '../../../core/clock';
import { type Theme, paint } from '../../../core/theme';
import { type Frame, check } from '../../../blocks/block';
import { wash } from '../../wash';
import { drawWords } from '../../words';
import { cToF, fToC, fmt } from './units';

const NAME = 'Thermo';
export type ThermoStep = 'scales' | 'zero' | 'mark' | 'rise';
export interface ThermoParams {
  /** the window in °C and the labelled steps on each side */ cLo: number; cHi: number; cStep: number; fStep: number;
  /** a reading in °C (the liquid level) */ mark?: number;
  /** a rise from c0 to c1 °C */ rise?: [number, number];
  /** hide the answer side's label (of the mark and of the rise) until focus.reveal > 0 */ hide?: 'F' | 'C';
}
export interface ThermoBlock { readonly kind: 'Thermo'; readonly where: { tube: Box }; draw(c: Canvas, P: Progress<ThermoStep>, f?: { reveal?: number }): void }

const NUM = 50;

export function Thermo(p: ThermoParams, fr: Frame, th: Theme): ThermoBlock {
  check(p.cHi > p.cLo, NAME, 'empty window');
  const y0 = fr.y + fr.h - 70, y1 = fr.y + 60;
  const Y = (c: number) => y0 - ((c - p.cLo) / (p.cHi - p.cLo)) * (y0 - y1);
  const cx = fr.x + fr.w / 2, xl = cx - 70, xr = cx + 70;
  const nC = Math.round((p.cHi - p.cLo) / p.cStep);
  check(nC <= 14 && (y0 - y1) / nC >= 50, NAME, 'Celsius labels too dense');
  const fLo = Math.ceil(cToF(p.cLo) / p.fStep) * p.fStep, fHi = Math.floor(cToF(p.cHi) / p.fStep) * p.fStep;
  check((y0 - y1) / ((p.cHi - p.cLo) * 9 / 5 / p.fStep) >= 50, NAME, 'Fahrenheit labels too dense');
  if (p.mark !== undefined) check(p.mark > p.cLo && p.mark < p.cHi, NAME, 'the reading is off the scale');
  if (p.rise) check(p.rise[0] >= p.cLo && p.rise[1] <= p.cHi && p.rise[1] > p.rise[0], NAME, 'the rise is off the scale');
  const tube = box(cx - 26, y1 - 30, cx + 26, y0 + 40);

  function draw(c: Canvas, P: Progress<ThermoStep>, f: { reveal?: number } = {}): void {
    const kS = clamp(P.k('scales'));
    if (kS <= 0) return;
    const g = c.g, rv = clamp(f.reveal ?? 0), rF = p.hide === 'F' ? rv : 1, rC = p.hide === 'C' ? rv : 1;
    withAlpha(c, kS, () => {
      wash(c, [[cx - 26, y1 - 30], [cx + 26, y1 - 30], [cx + 26, y0 + 10], [cx - 26, y0 + 10]], '#C9D6EE', { seed: 4, inkW: 3, shade: 0.1, rough: 0.6 });
      g.save(); g.fillStyle = '#E0574F'; g.beginPath(); g.arc(cx, y0 + 40, 40, 0, Math.PI * 2); g.fill(); g.restore();
      g.save(); g.strokeStyle = '#EFE6F7'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(xl, y1 - 20); g.lineTo(xl, y0); g.moveTo(xr, y1 - 20); g.lineTo(xr, y0); g.stroke();
      for (let i = 0; i <= nC; i++) { const v = p.cLo + i * p.cStep, y = Y(v); g.beginPath(); g.moveTo(xl, y); g.lineTo(xl - 22, y); g.stroke(); drawWords(c, `${fmt(v).replace('−', '−')}°`, xl - 36, y, 'second', 1, { size: NUM, align: 'right' }); }
      for (let v = fLo; v <= fHi + 1e-9; v += p.fStep) { const y = Y(fToC(v)); g.beginPath(); g.moveTo(xr, y); g.lineTo(xr + 22, y); g.stroke(); drawWords(c, `${fmt(v)}°`, xr + 36, y, 'first', 1, { size: NUM }); }
      g.restore();
      drawWords(c, '°C', xl - 36, y1 - 40, 'second', 1, { size: NUM, align: 'right' });
      drawWords(c, '°F', xr + 36, y1 - 40, 'first', 1, { size: NUM });
    });
    const kZ = clamp(P.k('zero'));
    if (kZ > 0 && p.cLo <= 0 && p.cHi >= 0) {
      const y = Y(0);
      g.save(); g.globalAlpha *= kZ; g.strokeStyle = paint(th, 'pick', 'fill'); g.lineWidth = 4; g.setLineDash([10, 8]);
      g.beginPath(); g.moveTo(xl, y); g.lineTo(xr, y); g.stroke(); g.restore();
      drawWords(c, '0 °C = 32 °F', xr + 230, y1 + 10, 'pick', kZ, { size: 46 });
    }
    const kM = clamp(P.k('mark'));
    if (p.mark !== undefined && kM > 0) {
      const level = Y(p.cLo + (p.mark - p.cLo) * kM);
      g.save(); g.fillStyle = '#E0574F'; g.fillRect(cx - 12, level, 24, y0 + 12 - level); g.restore();
      if (kM >= 0.95) {
        const y = Y(p.mark);
        g.save(); g.strokeStyle = paint(th, 'link', 'fill'); g.lineWidth = 4; g.setLineDash([8, 7]);
        g.beginPath(); g.moveTo(xl, y); g.lineTo(xr, y); g.stroke(); g.restore();
        drawWords(c, `${fmt(p.mark)} °C`, xl - 250, y, 'second', rC, { size: NUM, align: 'right' });
        drawWords(c, `${fmt(cToF(p.mark))} °F`, xr + 250, y, 'first', rF, { size: NUM });
      }
    }
    const kR = clamp(P.k('rise'));
    if (p.rise && kR > 0) {
      const [a, b] = p.rise, ya = Y(a), yb = Y(a + (b - a) * kR);
      for (const [x, col] of [[xl - 200, 'second'], [xr + 200, 'first']] as const) {
        g.save(); g.strokeStyle = paint(th, col, 'fill'); g.lineWidth = 6; g.lineCap = 'round';
        g.beginPath(); g.moveTo(x, ya); g.lineTo(x, yb); g.moveTo(x - 14, ya); g.lineTo(x + 14, ya); g.moveTo(x - 14, yb); g.lineTo(x + 14, yb); g.stroke(); g.restore();
      }
      if (kR >= 0.95) {
        const ym = (ya + Y(b)) / 2;
        drawWords(c, `+${fmt(b - a)} °C`, xl - 230, ym, 'second', rC, { size: NUM, align: 'right' });
        drawWords(c, `+${fmt((b - a) * 9 / 5)} °F`, xr + 230, ym, 'first', rF, { size: NUM });
      }
    }
  }
  return { kind: 'Thermo', where: { tube }, draw };
}
