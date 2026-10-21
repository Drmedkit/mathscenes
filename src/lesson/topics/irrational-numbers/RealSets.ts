// RealSets: the real number system as nested regions. Natural inside whole inside integers inside rational numbers;
// the irrational numbers are a separate region beside them; both together fill the real numbers. A number is placed
// in the INNERMOST region that holds its value (sqrt 16 = 4 sits with the natural numbers, sqrt 2 with the
// irrationals), and then it belongs to every region around it too.
//   real, rational, integer, whole, natural, irrational   the regions appear (a wash + one ink line + the name)
//   tokens   the numbers drop into their regions            focus   one number glows, its region is ringed in lime
// Exact: the region of each token comes from realMaths (the value decides, not the way it is written).
import { type Box, box, unionBox } from '../../../core/math';
import { rectPts } from '../../../core/pts';
import { type Canvas } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Progress } from '../../../core/clock';
import { type Theme } from '../../../core/theme';
import { type Formula, tex, texBox, texDraw } from '../../../core/tex';
import { type Frame, check } from '../../../blocks/block';
import { drawWords, wordsBox } from '../../words';
import { inkLine, wash } from '../../wash';
import { type Real, cmpReal, frac, isRational, norm } from './realMaths';

export type SetId = 'natural' | 'whole' | 'integer' | 'rational' | 'irrational';
export type SetsStep = 'real' | 'rational' | 'integer' | 'whole' | 'natural' | 'irrational' | 'tokens' | 'focus';
export const SETS_STEPS: readonly SetsStep[] = ['real', 'rational', 'integer', 'whole', 'natural', 'irrational', 'tokens', 'focus'];
export const SET_NAME: Record<SetId, string> = { natural: 'Natural', whole: 'Whole', integer: 'Integers', rational: 'Rational', irrational: 'Irrational' };
/** the sets a number of each innermost set belongs to (nested), innermost first */
export const SETS_OF: Record<SetId, SetId[]> = {
  natural: ['natural', 'whole', 'integer', 'rational'], whole: ['whole', 'integer', 'rational'],
  integer: ['integer', 'rational'], rational: ['rational'], irrational: ['irrational'],
};

/** the innermost set that holds x (by its value) */
export function innermost(x: Real): SetId {
  if (!isRational(x)) return 'irrational';
  const v = norm(x);
  if (v.kind !== 'frac') throw new Error('rational but not a fraction');
  if (v.q !== 1) return 'rational';
  if (v.p >= 1) return 'natural';
  if (v.p === 0) return 'whole';
  return 'integer';
}
export interface Token { tex: string; x: Real }
export interface SetsParams { tokens: Token[]; focus?: number }
const NAME = 'RealSets';

export function computeSets(p: SetsParams): { where: SetId[] } {
  check(p.tokens.length <= 12, NAME, 'at most 12 numbers');
  if (p.focus !== undefined) check(p.focus >= 0 && p.focus < p.tokens.length, NAME, 'focus out of range');
  const where = p.tokens.map(t => innermost(t.x));
  // sanity: the regions agree with the value: naturals are >= 1, the whole number 0, integers < 0
  p.tokens.forEach((t, i) => {
    const w = where[i]!;
    if (w === 'natural') check(cmpReal(t.x, frac(1)) >= 0, NAME, `${t.tex} is not a counting number`);
    if (w === 'whole') check(cmpReal(t.x, frac(0)) === 0, NAME, `${t.tex} is not 0`);
  });
  const per = (s: SetId) => where.filter(w => w === s).length;
  check(per('natural') <= 3 && per('whole') <= 3 && per('integer') <= 3 && per('rational') <= 3 && per('irrational') <= 4, NAME, 'too many numbers in one region');
  return { where };
}

export interface SetsBlock {
  readonly kind: 'RealSets';
  readonly box: Box;
  readonly where: { region(s: SetId): Box; token(i: number): Box; name(s: SetId | 'real'): Box };
  draw(c: Canvas, p: Progress<SetsStep>): void;
}

export function RealSets(p: SetsParams, fr: Frame, th: Theme): SetsBlock {
  const M = computeSets(p);
  const LAB = 46, NUM = 62;
  const outer = box(fr.x, fr.y, fr.x + fr.w, fr.y + fr.h);
  const ratW = Math.round(fr.w * 0.6);
  const R: Record<SetId, Box> = {} as Record<SetId, Box>;
  R.rational = box(fr.x + 22, fr.y + 78, fr.x + 22 + ratW, fr.y + fr.h - 18);
  R.irrational = box(R.rational.x1 + 22, fr.y + 78, fr.x + fr.w - 22, fr.y + fr.h - 18);
  const inset = (b: Box, top: number, bottom: number) => box(b.x0 + 22, b.y0 + top, b.x1 - 22, b.y1 - bottom);
  R.integer = inset(R.rational, 70, 128);
  R.whole = inset(R.integer, 70, 128);
  R.natural = inset(R.whole, 70, 128);
  check(R.natural.h >= 190, NAME, 'the natural numbers region is too small');
  const nameAt = (b: Box) => [b.x0 + 18, b.y0 + 36] as const;
  const names: Record<SetId | 'real', Box> = {
    real: wordsBox('Real numbers', fr.x + 22, fr.y + 38, { size: LAB }),
    rational: wordsBox('Rational', ...nameAt(R.rational), { size: LAB }), integer: wordsBox('Integers', ...nameAt(R.integer), { size: LAB }),
    whole: wordsBox('Whole', ...nameAt(R.whole), { size: LAB }), natural: wordsBox('Natural', ...nameAt(R.natural), { size: LAB }),
    irrational: wordsBox('Irrational', ...nameAt(R.irrational), { size: LAB }),
  };
  for (const s of ['rational', 'integer', 'whole', 'natural', 'irrational'] as SetId[]) check(names[s].x1 <= R[s].x1 - 10, NAME, `the name "${SET_NAME[s]}" does not fit its region`);
  // token slots: the free strip of each ring (under the inner region), the irrational column, the natural region
  const slots = (s: SetId, count: number): [number, number][] => {
    if (!count) return [];
    if (s === 'irrational') {
      const b = R.irrational, top = b.y0 + 160, gap = Math.min(170, (b.y1 - 60 - top) / Math.max(1, count - 1));
      return Array.from({ length: count }, (_, i) => [b.cx, top + i * gap] as [number, number]);
    }
    const inner = s === 'natural' ? null : R[({ rational: 'integer', integer: 'whole', whole: 'natural' } as Record<string, SetId>)[s]!];
    const b = R[s];
    const y = inner ? (inner.y1 + b.y1) / 2 : (b.y0 + 70 + b.y1) / 2 + 6;
    const w = b.w - 60, step = Math.min(170, w / count);
    return Array.from({ length: count }, (_, i) => [b.cx + (i - (count - 1) / 2) * step, y] as [number, number]);
  };
  const F = p.tokens.map(t => tex(t.tex) as Formula);
  const pos: [number, number][] = new Array(p.tokens.length);
  for (const s of ['natural', 'whole', 'integer', 'rational', 'irrational'] as SetId[]) {
    const ids = M.where.map((w, i) => (w === s ? i : -1)).filter(i => i >= 0);
    const sl = slots(s, ids.length);
    ids.forEach((id, j) => { pos[id] = sl[j]!; });
  }
  const tb = (i: number) => texBox(F[i]!, pos[i]![0], pos[i]![1], { size: NUM, align: 'center' });
  // every token fits in its own strip, clear of the inner region and of the other tokens
  p.tokens.forEach((_, i) => {
    const b = tb(i), s = M.where[i]!, own = R[s];
    check(b.x0 >= own.x0 + 6 && b.x1 <= own.x1 - 6, NAME, `${p.tokens[i]!.tex} is too wide for its region`);
    for (let j = 0; j < i; j++) { const o = tb(j); check(!(b.x0 < o.x1 + 10 && o.x0 < b.x1 + 10 && b.y0 < o.y1 && o.y0 < b.y1), NAME, 'two numbers overlap'); }
  });
  const fills: Record<SetId, string> = { rational: '#26305E', integer: '#2C3868', whole: '#334072', natural: '#3A487C', irrational: '#3A2C5C' };

  function region(c: Canvas, s: SetId, k: number, ring: number): void {
    if (k <= 0) return;
    const b = R[s], a = E.smooth(k), P = rectPts(b.x0, b.y0, b.w, b.h, 26);
    wash(c, P, fills[s] as never, { seed: 300 + s.length * 7, rough: 1.4, ink: null, alpha: a, shade: 0.1 });
    inkLine(c, P, { col: ring > 0 ? 'link' : '#7C82B8', w: ring > 0 ? 5 : 3, closed: true, seed: 310 + s.length, alpha: a, rough: 0.8 });
    drawWords(c, SET_NAME[s], ...nameAt(b), ring > 0 ? 'link' : 'dim', a, { size: LAB });
  }
  function draw(c: Canvas, P: Progress<SetsStep>): void {
    const kR = P.k('real');
    if (kR > 0) {
      const Po = rectPts(outer.x0, outer.y0, outer.w, outer.h, 30);
      wash(c, Po, '#1D2248' as never, { seed: 290, rough: 1.4, ink: null, alpha: E.smooth(kR), shade: 0.1 });
      inkLine(c, Po, { col: '#8A90C4', w: 3, closed: true, seed: 291, alpha: E.smooth(kR), rough: 0.8 });
      drawWords(c, 'Real numbers', fr.x + 22, fr.y + 38, 'ink', E.smooth(kR), { size: LAB });
    }
    const kF = P.k('focus');
    const fs = p.focus !== undefined ? M.where[p.focus]! : null;
    for (const s of ['rational', 'integer', 'whole', 'natural', 'irrational'] as SetId[]) region(c, s, P.k(s), fs === s ? kF : 0);
    const kT = P.k('tokens');
    if (kT > 0) p.tokens.forEach((_, i) => {
      const hot = p.focus === i ? kF : 0;
      const ki = E.smooth(Math.min(1, Math.max(0, kT * 1.5 - (i / Math.max(1, p.tokens.length)) * 0.5)));
      texDraw(c, F[i]!, pos[i]![0], pos[i]![1], { size: NUM, align: 'center', k: ki, col: hot > 0.3 ? 'link' : 'ink', glow: hot * 0.9 });
    });
  }
  return {
    kind: 'RealSets', box: outer,
    where: { region: s => R[s], token: tb, name: s => names[s] },
    draw,
  };
}
export { unionBox };
