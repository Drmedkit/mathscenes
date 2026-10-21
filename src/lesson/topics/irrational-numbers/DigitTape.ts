// DigitTape: why a repeating decimal is a fraction (shift and subtract). The decimal is a row of digit tiles lined up
// on the decimal point; multiplying by 10^s slides every digit s places to the left. Two shifted copies whose repeating
// tails sit in the same columns subtract to a whole number: the endless tails cancel digit for digit.
//   bottom    the lower row: 10^s2 * x (s2 = 0: x itself)
//   top       the upper row slides in from under it: the same digits, s1 - s2 places further left (10^s1 * x)
//   align     the tail columns light up: lime where the two rows agree, red where they do not (a wrong shift)
//   subtract  the rule, the minus, and the difference row (10^s1 - 10^s2) * x: a whole number when the tails agree
//   cancel    the tails dim: nothing is left after the point
// Exact: the rows' digits come from realMaths; computeTape asserts that "the tails agree" and "the difference is a
// whole number" are the same fact (it checks 40 columns and the exact fraction).
import { type Box, box, clamp, unionBox } from '../../../core/math';
import { rectPts } from '../../../core/pts';
import { type Canvas } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Progress } from '../../../core/clock';
import { type Theme, paint } from '../../../core/theme';
import { type Formula, tex, texBox, texDraw } from '../../../core/tex';
import { type Frame, check } from '../../../blocks/block';
import { inkLine, wash } from '../../wash';
import { DUSK } from '../../dusk';
import { type Rep, fracToRep, gcd, repDigits, repToFrac } from './realMaths';

export type TapeStep = 'bottom' | 'top' | 'align' | 'subtract' | 'cancel';
export const TAPE_STEPS: readonly TapeStep[] = ['bottom', 'top', 'align', 'subtract', 'cancel'];

export interface TapeParams {
  r: Rep;
  /** the upper row is 10^s1 * x, the lower row 10^s2 * x */
  s1: number; s2: number;
  /** digits shown after the point (default 7) */
  cells?: number;
  /** TeX row names (default "100x", "x", "99x") */
  names?: { top?: string; bottom?: string; diff?: string };
}
export interface TapeMaths {
  x: [number, number];
  /** the digit of x at place j (j <= 0: integer places, 0 = ones; j >= 1: after the point) */
  digit(j: number): number;
  aligned: boolean;
  /** (10^s1 - 10^s2) * x as a fraction; whole when aligned */
  diff: [number, number];
  top: number; bottom: number; mult: number;
}
const NAME = 'DigitTape';

export function computeTape(p: TapeParams): TapeMaths {
  const { r, s1, s2 } = p;
  check(Number.isInteger(r.int) && r.int >= 0 && r.int <= 99, NAME, `integer part ${r.int}: 0 to 99`);
  check(/^\d*$/.test(r.pre) && /^\d+$/.test(r.rep) && r.pre.length <= 3 && r.rep.length <= 3, NAME, 'pre and repeat blocks of up to 3 digits');
  check(Number.isInteger(s1) && Number.isInteger(s2) && s1 > s2 && s2 >= 0 && s1 <= 4, NAME, `shifts ${s1}, ${s2}`);
  const x = repToFrac(r);
  const ints = String(r.int);
  const digit = (j: number): number => {
    if (j <= 0) { const i = ints.length - 1 + j; return i >= 0 ? Number(ints[i]) : 0; }
    return Number(repDigits(r, j)[j - 1]);
  };
  const mult = 10 ** s1 - 10 ** s2;
  const g = gcd(mult * x[0], x[1]) || 1;
  const diff: [number, number] = [(mult * x[0]) / g, x[1] / g];
  let tails = true;
  for (let c = 1; c <= 40; c++) if (digit(c + s1) !== digit(c + s2)) { tails = false; break; }
  check(tails === (diff[1] === 1), NAME, 'tails agreeing must be the same as a whole-number difference');
  const top = Math.floor((10 ** s1 * x[0]) / x[1]), bottom = Math.floor((10 ** s2 * x[0]) / x[1]);
  if (tails) check(top - bottom === diff[0], NAME, `${top} - ${bottom} should be ${diff[0]}`);
  return { x, digit, aligned: tails, diff, top, bottom, mult };
}

export interface TapeBlock {
  readonly kind: 'DigitTape';
  readonly maths: TapeMaths;
  readonly box: Box;
  readonly where: { top: Box; bottom: Box; diff: Box; topName: Box; bottomName: Box; diffName: Box; tails: Box };
  draw(c: Canvas, p: Progress<TapeStep>, focus?: { top?: number; bottom?: number; diff?: number }): void;
}

export function DigitTape(p: TapeParams, fr: Frame, th: Theme): TapeBlock {
  const M = computeTape(p);
  const cells = p.cells ?? 7;
  check(cells >= 4 && cells <= 9, NAME, 'show 4 to 9 digits after the point');
  const NUM = 60, cw = 58, pointW = 28;
  const intLen = (v: number) => String(Math.max(0, v)).length;
  const diffInt = M.aligned ? M.diff[0] : Math.floor(M.diff[0] / M.diff[1]);
  const intCols = Math.max(intLen(M.top), intLen(M.bottom), intLen(diffInt), 1);
  const nameW = 230;
  const x0 = fr.x + nameW + 34;
  const posX = (c: number) => x0 + (intCols - 1 + c) * cw + cw / 2 + pointW * clamp(c);
  const right = posX(cells) + cw / 2;
  const dotsX = right + 40;
  check(dotsX + 40 <= fr.x + fr.w + 60, NAME, `${cells} digits do not fit (${Math.round(dotsX + 40)} px)`);
  const yT = fr.y + fr.h / 2 - 210, yB = yT + 140, yRule = yB + 72, yD = yB + 160;
  const pow = (s: number) => (s === 0 ? '' : String(10 ** s));
  const names = {
    top: p.names?.top ?? `${pow(p.s1)}x`, bottom: p.names?.bottom ?? `${pow(p.s2)}x`, diff: p.names?.diff ?? `${M.mult}x`,
  };
  const F = { top: tex(`${names.top} =`) as Formula, bottom: tex(`${names.bottom} =`) as Formula, diff: tex(`${names.diff} =`) as Formula, minus: tex('-') as Formula, dots: tex('\\ldots') as Formula };
  const nameX = fr.x + nameW + 6;
  const nameBox = (f: Formula, y: number) => texBox(f, nameX, y, { size: 64, align: 'right' });
  check(nameBox(F.top, yT).x0 >= fr.x - 20 && nameBox(F.diff, yD).x0 >= fr.x - 20, NAME, 'a row name is too long');
  const digF = Array.from({ length: 10 }, (_, d) => tex(String(d)) as Formula);
  const pointF = tex('.') as Formula;

  // the difference row's digits: a whole number (aligned) or the true decimal of a wrong shift
  const diffRep = M.aligned ? null : fracToRep(M.diff[0], M.diff[1]);
  const diffDigit = (c: number): number => {
    if (c <= 0) { const s = String(diffInt), i = s.length - 1 + c; return i >= 0 ? Number(s[i]) : -1; }
    return diffRep ? Number(repDigits(diffRep, c)[c - 1] ?? 0) : 0;
  };
  /** is place j of x part of the repeating block? which block (for alternate shading)? */
  const blockOf = (j: number): number => (j <= p.r.pre.length ? -1 : Math.floor((j - p.r.pre.length - 1) / p.r.rep.length));
  const leadingZero = (j: number, shift: number) => {
    // a zero in the integer part of 10^shift x that has only zeros to its left (and is not the ones place)
    const c = j - shift;
    if (c >= 0) return false;
    for (let i = j; i >= -6; i--) if (M.digit(i) !== 0) return false;
    return true;
  };

  function tile(c: Canvas, x: number, y: number, fill: string, alpha: number, ring: string | null, seed: number): void {
    const P = rectPts(x - cw / 2 + 3, y - 40, cw - 6, 80, 10);
    wash(c, P, fill as never, { seed, rough: 1.0, ink: null, alpha, shade: 0.12 });
    if (ring) inkLine(c, P, { col: ring as never, w: 3.5, closed: true, seed: seed + 3, alpha, rough: 0.6 });
  }
  const tailFill = (b: number) => (b % 2 === 0 ? '#5B4B95' : '#4A3F7E');
  function row(c: Canvas, shift: number, y: number, k: number, o: { alignK: number; cancelK: number; slideFrom?: number; slideK?: number }): void {
    if (k <= 0) return;
    const g = c.g;
    const sh = o.slideFrom !== undefined ? o.slideFrom + (shift - o.slideFrom) * E.inOut(o.slideK ?? 1) : shift;
    g.save();
    g.beginPath(); g.rect(x0 - 10, y - 50, right - x0 + 20, 100); g.clip();
    const jMin = -intCols - 4 + Math.floor(sh), jMax = cells + Math.ceil(sh) + 1;
    for (let j = jMin; j <= jMax; j++) {
      const col = j - sh;
      if (col < -(intCols - 1) - 0.98 || col > cells + 0.98) continue;
      const d = M.digit(j);
      const lead = leadingZero(j, shift) || (j < -(String(p.r.int).length - 1));
      let a = clamp(k);
      if (lead) a *= o.slideFrom !== undefined ? 1 - E.smooth(o.slideK ?? 1) : 0;
      if (col > cells) a *= clamp(cells + 1 - col);
      if (col < -(intCols - 1)) a *= clamp(col + intCols);
      if (a <= 0.01) continue;
      const x = posX(col);
      const b = blockOf(j);
      const inTail = col >= 0.5;
      const agree = M.digit(Math.round(col) + p.s1) === M.digit(Math.round(col) + p.s2);
      const ring = inTail && o.alignK > 0 ? paint(th, agree ? 'link' : 'wrong', 'line') : null;
      const dimT = inTail ? 1 - 0.6 * o.cancelK : 1;
      tile(c, x, y, b >= 0 ? tailFill(b) : '#2C3262', a * dimT, ring && o.alignK > 0.05 ? ring : null, 900 + j * 7 + Math.round(y));
      texDraw(c, digF[d]!, x, y, { size: NUM, align: 'center', k: 1, alpha: a * dimT, col: 'ink' });
    }
    g.restore();
    // the decimal point and the dots
    const pc = posX(0) + cw / 2 + pointW / 2;
    texDraw(c, pointF, pc, y + 10, { size: NUM, align: 'center', k: 1, alpha: clamp(k), col: 'ink' });
    texDraw(c, F.dots, dotsX, y + 6, { size: NUM, align: 'center', k: 1, alpha: clamp(k) * (1 - 0.6 * o.cancelK), col: 'dim' });
  }

  function draw(c: Canvas, P: Progress<TapeStep>, focus: { top?: number; bottom?: number; diff?: number } = {}): void {
    const kB = P.k('bottom'), kT = P.k('top'), kA = P.k('align'), kS = P.k('subtract'), kC = P.k('cancel');
    if (kB > 0) {
      texDraw(c, F.bottom, nameX, yB, { size: 64, align: 'right', k: E.smooth(kB), col: 'second', glow: (focus.bottom ?? 0) * 0.9 });
      row(c, p.s2, yB, kB, { alignK: kA, cancelK: kC });
    }
    if (kT > 0) {
      // the upper row slides up out of the lower one, then left by s1 - s2 places
      const up = E.smooth(clamp(kT * 2)), slide = clamp(kT * 2 - 1);
      const y = yB + (yT - yB) * up;
      texDraw(c, F.top, nameX, yT, { size: 64, align: 'right', k: slide, col: 'first', glow: (focus.top ?? 0) * 0.9 });
      row(c, p.s1, y, Math.min(1, kT * 3), { alignK: kA, cancelK: kC, slideFrom: p.s2, slideK: slide });
    }
    if (kS > 0) {
      const a = E.smooth(kS);
      texDraw(c, F.minus, fr.x + 18, yB, { size: 70, align: 'center', k: a, col: 'ink' });
      inkLine(c, [[fr.x + 10, yRule], [fr.x + 10 + (dotsX + 30 - fr.x - 10) * a, yRule]], { col: 'ink', w: 4, seed: 951, rough: 0.5 });
      texDraw(c, F.diff, nameX, yD, { size: 64, align: 'right', k: a, col: 'link', glow: (focus.diff ?? 0) * 0.9 });
      const g = c.g;
      for (let col = -(intCols - 1); col <= cells; col++) {
        const d = diffDigit(col);
        if (d < 0) continue;
        const inTail = col >= 1;
        const fade = inTail && M.aligned ? 1 - kC : 1;
        const aa = a * clamp(kS * 1.6 - (col + intCols) / (cells + intCols) * 0.6) * fade;
        if (aa <= 0.01) continue;
        const x = posX(col);
        tile(c, x, yD, inTail ? (M.aligned ? '#2C3262' : '#7A2E3A') : '#3D5A2E', aa, inTail && !M.aligned ? paint(th, 'wrong', 'line') : null, 980 + col);
        texDraw(c, digF[d]!, x, yD, { size: NUM, align: 'center', k: 1, alpha: aa, col: inTail ? (M.aligned ? 'faint' : 'ink') : 'link' });
      }
      const pc = posX(0) + cw / 2 + pointW / 2;
      g.save(); g.globalAlpha *= M.aligned ? 1 - kC : 1;
      texDraw(c, pointF, pc, yD + 10, { size: NUM, align: 'center', k: 1, alpha: a, col: 'ink' });
      if (!M.aligned) texDraw(c, F.dots, dotsX, yD + 6, { size: NUM, align: 'center', k: 1, alpha: a, col: 'dim' });
      g.restore();
    }
    void DUSK;
  }
  const rowBox = (y: number) => box(posX(-(intCols - 1)) - cw / 2, y - 40, dotsX + 30, y + 40);
  return {
    kind: 'DigitTape', maths: M,
    box: unionBox([nameBox(F.top, yT), rowBox(yT), rowBox(yD)]),
    where: {
      top: rowBox(yT), bottom: rowBox(yB), diff: rowBox(yD),
      topName: nameBox(F.top, yT), bottomName: nameBox(F.bottom, yB), diffName: nameBox(F.diff, yD),
      tails: box(posX(1) - cw / 2, yT - 40, right, yB + 40),
    },
    draw,
  };
}
