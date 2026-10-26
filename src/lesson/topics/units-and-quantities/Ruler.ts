// Ruler: a measuring scale zoomed in around a recorded value, subdivided finer than the recording, with the rounding
// interval as a band: every value in [v − res/2, v + res/2) is recorded as v (closed dot left, open ring right: a value
// exactly halfway rounds up). A probe marker tests one candidate true value. Optional scaled band: the same interval
// carried through an exact factor (a second line under the first, its ends computed, never typed).
// Steps: line, ticks, value, band, ends, probe, scaled.
import { type Box, box, clamp } from '../../../core/math';
import { type Canvas, withAlpha } from '../../../core/draw';
import type { Progress } from '../../../core/clock';
import { type Theme, paint } from '../../../core/theme';
import { type Formula, tex, texBox, texDraw } from '../../../core/tex';
import { type Frame, check } from '../../../blocks/block';
import { wash } from '../../wash';
import { drawWords } from '../../words';

const NAME = 'Ruler';
export type RulerStep = 'line' | 'ticks' | 'value' | 'band' | 'ends' | 'probe' | 'scaled';
export interface RulerParams {
  lo: number; hi: number;
  /** finest tick and labelled tick (in the unit) */ minor: number; major: number;
  /** recorded value and its resolution (nearest ...) */ v: number; res: number;
  unit: string;
  /** TeX of a tick label / of a value */ label(v: number): string;
  probe?: number;
  /** an exact factor the interval is carried through (and the TeX of the scaled ends, the unit) */
  scaled?: { lo: string; hi: string; unit: string; by: string };
}
export interface RulerBlock { readonly kind: 'Ruler'; readonly where: { band: Box; value: Box }; draw(c: Canvas, P: Progress<RulerStep>): void }

const NUM = 54;

export function Ruler(p: RulerParams, fr: Frame, th: Theme): RulerBlock {
  check(p.hi > p.lo && p.minor > 0 && p.major >= p.minor, NAME, 'empty scale');
  const nMinor = Math.round((p.hi - p.lo) / p.minor), nMajor = Math.round((p.hi - p.lo) / p.major);
  check(nMinor <= 64, NAME, `too many ticks (${nMinor})`);
  const x0 = fr.x + 90, x1 = fr.x + fr.w - 190, X = (v: number) => x0 + ((v - p.lo) / (p.hi - p.lo)) * (x1 - x0);
  check((x1 - x0) / nMinor >= 12, NAME, 'ticks too close');
  check((x1 - x0) / nMajor >= 170, NAME, 'labels too close');
  const [a, b] = [p.v - p.res / 2, p.v + p.res / 2];
  check(a > p.lo && b < p.hi, NAME, 'the interval leaves the scale');
  const top = fr.y + 200, rulerH = 120;
  check(top + rulerH + 260 <= fr.y + fr.h, NAME, 'the frame is too short');
  const majors: { v: number; F: Formula }[] = [];
  for (let i = 0; i <= nMajor; i++) { const v = p.lo + i * p.major; majors.push({ v, F: tex(p.label(v)) as Formula }); }
  const FV = tex(p.label(p.v)) as Formula, FA = tex(p.label(a)) as Formula, FB = tex(p.label(b)) as Formula;
  const FP = p.probe !== undefined ? (tex(p.label(p.probe)) as Formula) : null;
  const FSa = p.scaled ? (tex(p.scaled.lo) as Formula) : null, FSb = p.scaled ? (tex(p.scaled.hi) as Formula) : null;
  const FBy = p.scaled ? (tex(p.scaled.by) as Formula) : null;
  const bandBox = box(X(a), top - 70, X(b), top);
  const valueBox = box(X(p.v) - 30, top - 190, X(p.v) + 30, top - 80);

  function tickLen(i: number): number {
    const v = p.lo + i * p.minor;
    const m = Math.abs((v - p.lo) / p.major - Math.round((v - p.lo) / p.major)) < 1e-6;
    const half = Math.abs((v - p.lo) / (p.major / 2) - Math.round((v - p.lo) / (p.major / 2))) < 1e-6;
    return m ? 62 : half ? 44 : 26;
  }
  function draw(c: Canvas, P: Progress<RulerStep>): void {
    const kL = clamp(P.k('line'));
    if (kL <= 0) return;
    const g = c.g;
    withAlpha(c, kL, () => {
      wash(c, [[x0 - 50, top], [x1 + 50, top], [x1 + 50, top + rulerH], [x0 - 50, top + rulerH]], '#D9C48F', { seed: 7, inkW: 3, shade: 0.25, rough: 0.8 });
    });
    const kT = clamp(P.k('ticks'));
    if (kT > 0) {
      g.save(); g.globalAlpha *= kT; g.strokeStyle = '#2A2238'; g.lineWidth = 2.5;
      for (let i = 0; i <= nMinor; i++) { const x = x0 + (i / nMinor) * (x1 - x0); g.beginPath(); g.moveTo(x, top); g.lineTo(x, top + tickLen(i)); g.stroke(); }
      g.restore();
      for (const M of majors) texDraw(c, M.F, X(M.v), top + rulerH + 56, { size: NUM, align: 'center', col: 'ink', alpha: kT });
      drawWords(c, p.unit, x1 + 80, top + rulerH / 2, 'ink', kT, { size: 50 });
    }
    // the band of values that round to v
    const kB = clamp(P.k('band'));
    if (kB > 0) {
      const xa = X(a), xb = X(a + (b - a) * kB);
      g.save(); g.globalAlpha *= 0.35; g.fillStyle = paint(th, 'link', 'fill'); g.fillRect(xa, top - 46, xb - xa, 46); g.restore();
      g.save(); g.strokeStyle = paint(th, 'link', 'fill'); g.lineWidth = 6; g.beginPath(); g.moveTo(xa, top - 23); g.lineTo(xb, top - 23); g.stroke();
      g.fillStyle = paint(th, 'link', 'fill'); g.beginPath(); g.arc(xa, top - 23, 11, 0, Math.PI * 2); g.fill();
      if (kB >= 1) { g.fillStyle = '#121531'; g.beginPath(); g.arc(X(b), top - 23, 10, 0, Math.PI * 2); g.fill(); g.lineWidth = 5; g.stroke(); }
      g.restore();
    }
    // the recorded value: a marker over the ruler
    const kV = clamp(P.k('value'));
    if (kV > 0) {
      const x = X(p.v);
      g.save(); g.globalAlpha *= kV; g.strokeStyle = paint(th, 'pick', 'fill'); g.fillStyle = paint(th, 'pick', 'fill'); g.lineWidth = 5;
      g.beginPath(); g.moveTo(x, top - 76); g.lineTo(x, top - 4); g.stroke();
      g.beginPath(); g.moveTo(x, top - 2); g.lineTo(x - 12, top - 22); g.lineTo(x + 12, top - 22); g.closePath(); g.fill(); g.restore();
      texDraw(c, FV, x, top - 120, { size: 62, align: 'center', col: 'pick', alpha: kV });
    }
    const kE = clamp(P.k('ends'));
    if (kE > 0) {
      // the two ends written under the ruler's labels, never on a line
      const y = top + rulerH + 136;
      texDraw(c, FA, X(a), y, { size: NUM, align: 'center', col: 'link', alpha: kE });
      texDraw(c, FB, X(b), y, { size: NUM, align: 'center', col: 'link', alpha: kE });
      for (const xe of [X(a), X(b)]) { g.save(); g.globalAlpha *= kE * 0.7; g.setLineDash([6, 6]); g.strokeStyle = paint(th, 'link', 'fill'); g.lineWidth = 2.5; g.beginPath(); g.moveTo(xe, top - 20); g.lineTo(xe, top + rulerH + 4); g.stroke(); g.restore(); }
    }
    const kP = clamp(P.k('probe'));
    if (kP > 0 && FP && p.probe !== undefined) {
      const x = X(p.probe), inside = p.probe >= a - 1e-9 && p.probe < b - 1e-9;
      const col = P.k('band') > 0.5 ? (inside ? 'link' : 'wrong') : 'first';
      g.save(); g.globalAlpha *= kP; g.fillStyle = paint(th, col, 'fill'); g.beginPath(); g.arc(x, top + rulerH + 8, 12, 0, Math.PI * 2); g.fill(); g.restore();
      texDraw(c, FP, x, top + rulerH + 216, { size: NUM, align: 'center', col, alpha: kP });
    }
    const kS = clamp(P.k('scaled'));
    if (kS > 0 && FSa && FSb && FBy && p.scaled) {
      const y = top + rulerH + 226;
      texDraw(c, FBy, x0 - 60, y, { size: NUM, align: 'left', col: 'pick', alpha: kS });
      texDraw(c, FSa, X(a), y, { size: NUM, align: 'center', col: 'link', alpha: kS });
      texDraw(c, FSb, X(b), y, { size: NUM, align: 'center', col: 'link', alpha: kS });
      drawWords(c, p.scaled.unit, x1 + 80, y, 'ink', kS, { size: 50 });
    }
  }
  // the label boxes must not collide
  for (let i = 1; i < majors.length; i++) {
    const A = texBox(majors[i - 1]!.F, X(majors[i - 1]!.v), 0, { size: NUM, align: 'center' }), B = texBox(majors[i]!.F, X(majors[i]!.v), 0, { size: NUM, align: 'center' });
    check(A.x1 + 16 < B.x0 || A.w === 0, NAME, 'tick labels collide');
  }
  return { kind: 'Ruler', where: { band: bandBox, value: valueBox }, draw };
}
