// CounterMat: two-colour counters on a mat (integers). A light counter is +1, a dark counter is -1; a light and a dark
// together are a ZERO PAIR (+1 + -1 = 0), so pairs can be added or removed without changing the mat's value.
//   mat       the mat and the legend
//   counters  the counters of the problem: `pos` light ones on the top row, `neg` dark ones on the bottom row
//   add       `add` zero pairs come in (so there is something to take away)
//   take      `take.n` counters of one sign leave the mat (subtraction)
//   pair      every column that holds a light AND a dark counter gets a ring: a zero pair
//   remove    the zero pairs leave: what is left is the value, its colour is the sign
// Model action -> rule step (subgoal model-to-algorithm-add-sub): removing pairs = subtracting the magnitudes; the
// colour left over = the sign of the larger magnitude; adding pairs before taking away = p - q = p + (-q).
// computeMat() counts every counter at every stage and asserts the value never changes except by `take`.
import { type Box, box, clamp, unionBox } from '../../../core/math';
import { type Canvas, strokePts, withAlpha } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Progress } from '../../../core/clock';
import { type Theme, paint } from '../../../core/theme';
import { type Frame, check } from '../../../blocks/block';
import { circlePts, rectPts } from '../../../core/pts';
import { inkLine, wash } from '../../wash';
import { drawWords, wordsBox } from '../../words';
import { DUSK } from '../../dusk';

const NAME = 'CounterMat';
export interface MatParams { pos: number; neg: number; add?: number; take?: { sign: 1 | -1; n: number } }
export type MatStep = 'mat' | 'counters' | 'add' | 'take' | 'pair' | 'remove';
export const MAT_STEPS: readonly MatStep[] = ['mat', 'counters', 'add', 'take', 'pair', 'remove'];
export const MAT_MAX_COLS = 16;

interface Counter { sign: 1 | -1; col: number; added: boolean; taken: boolean; paired: boolean }
export interface MatMaths {
  start: number; afterAdd: number; afterTake: number; end: number;
  pairs: number; left: number; leftSign: 1 | -1 | 0; cols: number;
  counters: Counter[];
}
export function matFits(p: MatParams): boolean {
  const add = p.add ?? 0;
  const ok = [p.pos, p.neg, add].every(n => Number.isInteger(n) && n >= 0) && p.pos + p.neg + add > 0;
  return ok && Math.max(p.pos, p.neg) + add <= MAT_MAX_COLS && (!p.take || (p.take.n >= 1 && p.take.n <= (p.take.sign > 0 ? p.pos : p.neg) + add));
}
export function computeMat(p: MatParams): MatMaths {
  check(matFits(p), NAME, `mat ${p.pos} light, ${p.neg} dark, +${p.add ?? 0} pairs: does not fit or cannot take away`);
  const add = p.add ?? 0, base = Math.max(p.pos, p.neg);
  const C: Counter[] = [];
  for (let i = 0; i < p.pos; i++) C.push({ sign: 1, col: i, added: false, taken: false, paired: false });
  for (let i = 0; i < p.neg; i++) C.push({ sign: -1, col: i, added: false, taken: false, paired: false });
  for (let i = 0; i < add; i++) { C.push({ sign: 1, col: base + i, added: true, taken: false, paired: false }); C.push({ sign: -1, col: base + i, added: true, taken: false, paired: false }); }
  const val = (xs: Counter[]) => xs.reduce((s, c) => s + c.sign, 0);
  const start = val(C), afterAdd = val(C);
  check(start === p.pos - p.neg, NAME, 'counting the mat went wrong');
  check(afterAdd === start, NAME, 'adding zero pairs changed the value');
  if (p.take) {
    // take from the right end of the row (the added counters first), so the leftovers stay at the left
    const row = C.filter(c => c.sign === p.take!.sign).sort((a, b) => b.col - a.col);
    for (let i = 0; i < p.take.n; i++) row[i]!.taken = true;
  }
  const live = C.filter(c => !c.taken);
  const afterTake = val(live);
  check(afterTake === start - (p.take ? p.take.sign * p.take.n : 0), NAME, 'taking away did not change the value by the amount taken');
  // pair every column holding both signs
  let pairs = 0;
  const cols = Math.max(0, ...C.map(c => c.col + 1));
  for (let k = 0; k < cols; k++) {
    const up = live.find(c => c.col === k && c.sign > 0), dn = live.find(c => c.col === k && c.sign < 0);
    if (up && dn) { up.paired = dn.paired = true; pairs++; }
  }
  const left = live.filter(c => !c.paired);
  const end = val(left);
  check(end === afterTake, NAME, 'removing zero pairs changed the value');
  check(left.every(c => c.sign === left[0]?.sign), NAME, 'leftover counters of both colours');
  return { start, afterAdd, afterTake, end, pairs, left: left.length, leftSign: left.length ? left[0]!.sign : 0, cols, counters: C };
}

export interface MatFocus { ring?: number; legend?: number }
export interface CounterMatBlock {
  readonly kind: 'CounterMat';
  readonly maths: MatMaths;
  readonly box: Box;
  readonly where: { mat: Box; counter(i: number): Box; pairs: Box | null; left: Box | null; legend: Box };
  draw(c: Canvas, p: Progress<MatStep>, f?: MatFocus): void;
}

const R = 36, PITCH = 96, ROWGAP = 112;
const LIGHT = '#F2E4C2', DARK = '#3A2A55';

export function CounterMat(p: MatParams, fr: Frame, th: Theme): CounterMatBlock {
  const m = computeMat(p);
  const cols = Math.max(m.cols, 3);
  const w = cols * PITCH + 70, hh = ROWGAP + 2 * R + 90;
  const mx0 = fr.x + (fr.w - w) / 2, my0 = fr.y + Math.max(0, (fr.h - 70 - hh) / 2);
  check(w <= fr.w, NAME, `${cols} columns do not fit`);
  const mat = box(mx0, my0, mx0 + w, my0 + hh);
  const cx = (k: number) => mx0 + 35 + PITCH / 2 + k * PITCH, cyOf = (s: 1 | -1) => (s > 0 ? my0 + 45 + R : my0 + 45 + R + ROWGAP);
  const cBox = (c: Counter) => box(cx(c.col) - R, cyOf(c.sign) - R, cx(c.col) + R, cyOf(c.sign) + R);
  const pairCols = [...new Set(m.counters.filter(c => c.paired).map(c => c.col))];
  const leftCs = m.counters.filter(c => !c.taken && !c.paired);
  const legendY = mat.y1 + 46;
  const legend = 'light = +1     dark = −1';
  const lb = wordsBox(legend, mat.cx, legendY, { size: 44, align: 'center' });
  check(lb.y1 <= fr.y + fr.h + 4, NAME, 'the legend does not fit under the mat');

  function counter(c: Canvas, C: Counter, x: number, y: number, a: number, ringK: number): void {
    if (a <= 0) return;
    withAlpha(c, a, () => {
      wash(c, circlePts(x, y, R, 44), C.sign > 0 ? LIGHT : DARK, { seed: 70 + C.col * 3 + (C.sign > 0 ? 0 : 1), ink: DUSK.ink, inkW: 3, rough: 0.9, shade: 0.25 });
      const ink = C.sign > 0 ? DUSK.ink : '#EDE3F7';
      strokePts(c, [[x - 15, y], [x + 15, y]], { col: ink, lw: 6, cap: 'round' });
      if (C.sign > 0) strokePts(c, [[x, y - 15], [x, y + 15]], { col: ink, lw: 6, cap: 'round' });
    });
    void ringK;
  }
  function draw(c: Canvas, P: Progress<MatStep>, f: MatFocus = {}): void {
    const kM = E.smooth(clamp(P.k('mat'))), kC = clamp(P.k('counters')), kA = clamp(P.k('add')), kT = clamp(P.k('take'));
    const kP = clamp(P.k('pair')), kR = clamp(P.k('remove'));
    if (kM <= 0) return;
    withAlpha(c, kM, () => {
      wash(c, rectPts(mat.x0, mat.y0, mat.w, mat.h, 22), '#4A557F', { seed: 21, ink: DUSK.ink, inkW: 3, rough: 1.4, shade: 0.3 });
      drawWords(c, legend, mat.cx, legendY, 'dim', 1, { size: 44, align: 'center' });
    });
    // zero-pair rings (lime: a pair is worth 0), drawn under the counters
    for (const k of pairCols) {
      const ka = E.smooth(kP) * (1 - E.smooth(kR));
      if (ka <= 0) continue;
      const x = cx(k), B = box(x - R - 12, cyOf(1) - R - 12, x + R + 12, cyOf(-1) + R + 12);
      c.g.save(); c.g.globalAlpha *= ka;
      c.g.strokeStyle = paint(th, 'link', 'fill'); c.g.lineWidth = 5;
      c.g.beginPath(); c.g.roundRect(B.x0, B.y0, B.w, B.h, 40); c.g.stroke(); c.g.restore();
    }
    m.counters.forEach((C, i) => {
      const x = cx(C.col);
      let y = cyOf(C.sign);
      let a = C.added ? E.smooth(clamp(kA * 1.6 - (C.col % 6) * 0.1)) : E.smooth(clamp(kC * 1.6 - (C.col / Math.max(1, m.cols)) * 0.6));
      if (C.added && a > 0 && a < 1) y -= (1 - a) * 40;
      if (C.taken) { const t = E.smooth(kT); a *= 1 - t; y += (C.sign > 0 ? -1 : 1) * t * 60; }
      if (C.paired) {
        const r = E.smooth(kR);
        // a removed pair leaves a faint dashed ghost: you can still see what cancelled
        if (r > 0 && !C.taken) inkLine(c, circlePts(x, cyOf(C.sign), R, 44), { col: '#C9C0DD', w: 2.5, closed: true, seed: 90 + C.col, alpha: 0.45 * r * a });
        a *= 1 - r; y += (C.sign > 0 ? -1 : 1) * r * 30;
      }
      counter(c, C, x, y, a, f.ring ?? 0);
      void i;
    });
    // the leftover: a soft bracket in its sign's role once the pairs are gone
    if (kR > 0 && leftCs.length) {
      const B = unionBox(leftCs.map(cBox));
      inkLine(c, rectPts(B.x0 - 14, B.y0 - 14, B.w + 28, B.h + 28, 24), { col: 'link', w: 4, closed: true, seed: 5, alpha: E.smooth(kR) });
    }
  }
  return {
    kind: 'CounterMat', maths: m,
    box: unionBox([mat, lb]),
    where: {
      mat,
      counter: i => cBox(m.counters[i]!),
      pairs: pairCols.length ? box(cx(Math.min(...pairCols)) - R, cyOf(1) - R, cx(Math.max(...pairCols)) + R, cyOf(-1) + R) : null,
      left: leftCs.length ? unionBox(leftCs.map(cBox)) : null,
      legend: lb,
    },
    draw,
  };
}
