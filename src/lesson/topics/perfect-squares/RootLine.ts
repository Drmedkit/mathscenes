// RootLine: a number line of side lengths 0..15 that places the square root of a non-square n between two
// consecutive whole numbers: k x k < n < (k+1) x (k+1), so k < sqrt(n) < k+1.
//   axis     the line, its ticks and the whole numbers 0..15 under them
//   squares  the two neighbouring perfect squares in amber, under k and k+1 ("49" under 7, "64" under 8)
//   bracket  a lime band on the line from k to k+1, a bracket over it and the label sqrt(n)
//   near     a ring around the whole number the root is nearer to (the closer square wins)
// No point is placed inside the interval: the topic stops at integer bounds.
import { type Box, box, clamp, unionBox } from '../../../core/math';
import { type Canvas, withAlpha } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Progress } from '../../../core/clock';
import { type Theme, paint } from '../../../core/theme';
import { type Formula, tex, texBox, texDraw } from '../../../core/tex';
import { type Frame, check } from '../../../blocks/block';
import { inkLine } from '../../wash';
import { isqrt } from './TileSquare';

export type LineStep = 'axis' | 'squares' | 'bracket' | 'near';
export const LINE_STEPS: readonly LineStep[] = ['axis', 'squares', 'bracket', 'near'];

export interface RootLineMaths {
  n: number; k: number; lo: number; hi: number;
  /** the whole number sqrt(n) is nearer to: the one whose square is closer to n (never a tie for whole n) */
  nearer: number;
  dLo: number; dHi: number;
  max: number;
}
const NAME = 'RootLine';

export function computeRootLine(n: number, max = 15): RootLineMaths {
  check(Number.isInteger(n) && n >= 2 && n < max * max, NAME, `n = ${n}: the line places roots of 2 to ${max * max - 1}`);
  const k = isqrt(n), lo = k * k, hi = (k + 1) * (k + 1);
  check(lo !== n, NAME, `${n} is a perfect square: its root is the whole number ${k}`);
  check(lo < n && n < hi, NAME, 'bounds broken');
  const dLo = n - lo, dHi = hi - n;
  check(dLo !== dHi, NAME, 'a tie cannot happen for a whole number');   // n = k^2 + k + 1/2 is never whole
  return { n, k, lo, hi, dLo, dHi, nearer: dLo < dHi ? k : k + 1, max };
}

export interface RootLineBlock {
  readonly kind: 'RootLine';
  readonly maths: RootLineMaths;
  readonly steps: readonly LineStep[];
  readonly box: Box;
  readonly where: { tick(i: number): Box; label(i: number): Box; lo: Box; hi: Box; bracket: Box; root: Box; band: Box };
  draw(c: Canvas, p: Progress<LineStep>): void;
}

export function RootLine(n: number, fr: Frame, th: Theme, o: { max?: number; showRoot?: boolean } = {}): RootLineBlock {
  const m = computeRootLine(n, o.max ?? 15);
  const ax0 = fr.x + 70, ax1 = fr.x + fr.w - 70, y = fr.y + 220;
  const step = (ax1 - ax0) / m.max;
  check(step >= 90, NAME, `ticks ${Math.round(step)} px apart are too close for the numbers`);
  const X = (v: number) => ax0 + v * step;
  const NUM = 60;
  const nums: Formula[] = Array.from({ length: m.max + 1 }, (_, i) => tex(String(i)) as Formula);
  const label = (i: number) => texBox(nums[i]!, X(i), y + 62, { size: NUM, align: 'center' });
  const Flo = tex(String(m.lo)) as Formula, Fhi = tex(String(m.hi)) as Formula;
  // the two squares sit under k and k+1; 3-digit squares are pushed apart a little so they never read as one number
  const wLo = texBox(Flo, 0, 0, { size: NUM, align: 'center' }).w, wHi = texBox(Fhi, 0, 0, { size: NUM, align: 'center' }).w;
  const push = Math.max(0, (wLo / 2 + wHi / 2 + 44 - step) / 2);
  const xLo = X(m.k) - push, xHi = X(m.k + 1) + push;
  const loB = texBox(Flo, xLo, y + 150, { size: NUM, align: 'center' }), hiB = texBox(Fhi, xHi, y + 150, { size: NUM, align: 'center' });
  check(loB.x1 + 40 < hiB.x0, NAME, 'the two squares under the line are too close');
  check(hiB.x1 <= fr.x + fr.w + 20, NAME, 'the upper square runs off the frame');
  const Froot = tex(`\\sqrt{${n}}`) as Formula;
  const rootB = texBox(Froot, (X(m.k) + X(m.k + 1)) / 2, y - 112, { size: 76, align: 'center' });
  check(rootB.y0 >= fr.y - 4, NAME, 'the root label does not fit above the line');
  const bracket = box(X(m.k), y - 52, X(m.k + 1), y - 26);
  const band = box(X(m.k), y - 9, X(m.k + 1), y + 9);

  function draw(c: Canvas, P: Progress<LineStep>): void {
    const kA = P.k('axis'), kSq = P.k('squares'), kB = P.k('bracket'), kN = P.k('near');
    const { g } = c;
    if (kA > 0) {
      const a = E.smooth(kA);
      inkLine(c, [[ax0 - 30, y], [ax0 - 30 + (ax1 - ax0 + 60) * a, y]], { col: 'ink', w: 4, seed: 601, rough: 0.6 });
      for (let i = 0; i <= m.max; i++) {
        const ki = E.smooth(clamp(kA * 1.6 - (i / m.max) * 0.6));
        if (ki <= 0) continue;
        withAlpha(c, ki, () => {
          g.save(); g.strokeStyle = paint(th, 'ink', 'line'); g.lineWidth = 3.5; g.lineCap = 'round';
          g.beginPath(); g.moveTo(X(i), y - 16); g.lineTo(X(i), y + 16); g.stroke(); g.restore();
        });
        const nearRing = m.nearer === i ? kN : 0;
        texDraw(c, nums[i]!, X(i), y + 62, { size: NUM, align: 'center', k: 1, alpha: ki, col: nearRing > 0.5 || (kB > 0.5 && (i === m.k || i === m.k + 1)) ? 'link' : 'ink' });
      }
    }
    if (kB > 0) {
      const a = E.smooth(kB);
      g.save(); g.globalAlpha *= a; g.fillStyle = paint(th, 'link', 'fill');
      g.beginPath(); g.roundRect(band.x0, band.y0, band.w * a, band.h, 9); g.fill(); g.restore();
      inkLine(c, [[bracket.x0, bracket.y1], [bracket.x0, bracket.y0], [bracket.x1, bracket.y0], [bracket.x1, bracket.y1]], { col: 'link', w: 4, seed: 602, alpha: a, rough: 0.5 });
      if (o.showRoot !== false) texDraw(c, Froot, rootB.cx, y - 112, { size: 76, align: 'center', k: a, col: 'link' });
    }
    if (kSq > 0) {
      const a = E.smooth(kSq);
      texDraw(c, Flo, xLo, y + 150, { size: NUM, align: 'center', k: a, col: 'first' });
      texDraw(c, Fhi, xHi, y + 150, { size: NUM, align: 'center', k: clamp(a * 1.2 - 0.2), col: 'first' });
    }
    if (kN > 0) {
      const L = label(m.nearer), a = E.smooth(kN);
      g.save(); g.globalAlpha *= a; g.strokeStyle = paint(th, 'link', 'fill'); g.lineWidth = 5;
      g.beginPath(); g.arc(L.cx, L.cy, Math.max(L.w, L.h) / 2 + 18, 0, Math.PI * 2); g.stroke(); g.restore();
    }
  }
  return {
    kind: 'RootLine', maths: m, steps: LINE_STEPS,
    box: unionBox([box(ax0 - 30, rootB.y0, ax1 + 30, y + 190), loB, hiB]),
    where: { tick: i => box(X(i) - 4, y - 16, X(i) + 4, y + 16), label, lo: loB, hi: hiB, bracket, root: rootB, band },
    draw,
  };
}
