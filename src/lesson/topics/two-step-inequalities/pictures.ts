// pictures.ts: the practice items' pictures as StepLines params, pure (tests check that they can be drawn).
//   orderPicture   two numbers before and after one move on both sides (two lines, two arrows)
//   setPicture     one line: the solution set, the test values, someone's proposed set
// The solving chain itself (three lines) is ineqMaths.chainPicture.
import { toQ } from '../../../core/math';
import { type Form, type Op, dirOf, isStrict, holds, txt } from './ineqMaths';
import type { LineSpec, StepParams } from './StepLines';
import type { OrderPic, SetPic } from './items';

const NICE = [0.25, 0.5, 1, 2, 2.5, 5, 10, 20, 25, 50];
const niceTick = (span: number, n = 5) => NICE.find(t => span / t <= n * 2.2 && span / t >= n * 0.5) ?? NICE.reduce((a, b) => (Math.abs(span / b - n) < Math.abs(span / a - n) ? b : a));
/** a number as label text (exact for friendly fractions) */
export function fmt(v: number, form: Form = 'int'): string {
  const Q = toQ(v, 12);
  return Q ? txt(Q, form) : String(Math.round(v * 100) / 100).replace('-', '−');
}
const applyM = (m: OrderPic['move'], v: number) => Math.round((m.kind === 'add' ? v + m.k : m.kind === 'mul' ? v * m.k : v / m.k) * 1e6) / 1e6;
/** a line around two values: they sit at ±42 % of the half-width; 0 is labelled when it has room */
function pairLine(u: number, w: number, caption: string, form: Form): LineSpec {
  const mid = (u + w) / 2, half = Math.max(1.2 * Math.abs(w - u), 1.5);
  const lo = mid - half, hi = mid + half;
  const labels: LineSpec['labels'] = [{ v: u, text: fmt(u, form), col: 'ink' }, { v: w, text: fmt(w, form), col: 'ink' }];
  if (lo < 0 && hi > 0 && Math.min(Math.abs(u), Math.abs(w)) > 0.5 * Math.abs(w - u)) labels.push({ v: 0, text: '0', col: 'dim' });
  return { lo, hi, tick: niceTick(2 * half, 8), origin: 0, caption, labels };
}
export function orderPicture(p: Pick<OrderPic, 'a' | 'b' | 'move'>): StepParams {
  const A = applyM(p.move, p.a), B = applyM(p.move, p.b), f = p.move.form;
  const a = p.move.kind === 'add' ? 1 : p.move.kind === 'mul' ? p.move.k : 1 / p.move.k, c = p.move.kind === 'add' ? p.move.k : 0;
  return {
    lines: [pairLine(p.a, p.b, 'before', f), pairLine(A, B, 'after', f)],
    sets: [null, null],
    maps: [{ a, c, from: [p.a, p.b] }],
  };
}
export function setPicture(p: Pick<SetPic, 'b' | 'op' | 'form' | 'v' | 'tests' | 'proposed'>): StepParams {
  const span = Math.max(...p.tests.map(t => Math.abs(t - p.b)), 1);
  const half = span * 1.3;
  const inSet = (t: number, b: number, o: Op) => holds(t, o, b);
  const onB = p.tests.some(t => Math.abs(t - p.b) < 1e-9);
  const line: LineSpec = {
    lo: p.b - half, hi: p.b + half, tick: niceTick(2 * half, 8), origin: 0, caption: p.v,
    labels: onB ? [] : [{ v: p.b, text: fmt(p.b, p.form), col: 'first', at: 'set' }],
  };
  return {
    lines: [line],
    sets: [{ b: p.b, dir: dirOf(p.op), closed: !isStrict(p.op), col: 'link' }],
    maps: [],
    tests: p.tests.map(t => ({ v: t, ok: inSet(t, p.b, p.op), text: fmt(t, p.form) })),
    wrong: p.proposed ? { b: p.proposed.b, dir: dirOf(p.proposed.op), closed: !isStrict(p.proposed.op), col: 'pick' } : null,
  };
}
