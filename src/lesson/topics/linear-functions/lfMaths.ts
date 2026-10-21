// lfMaths.ts: the exact maths of linear functions y = mx + b, pure (no DOM, no canvas). Shared by the model block
// (LineModel), the practice families and the tests.
//   Every value in this topic is a whole number, a terminating decimal ($2.50, 0.4) or a simple fraction (2/3), so
//   values are held as exact rationals (Q) and never compared as floats.
import { type Q, qAdd, qDiv, qEq, qMul, qNum, rat } from '../../../core/math';

export { type Q, qAdd, qDiv, qEq, qMul, qNum, rat };
/** an exact rational for a number with at most 3 decimals, or a fraction with a small denominator */
export function q(v: number | Q): Q {
  if (typeof v !== 'number') return v;
  for (const d of [1, 2, 3, 4, 5, 6, 8, 10, 12, 20, 25, 40, 50, 100, 1000]) {
    const p = Math.round(v * d);
    if (Math.abs(p / d - v) < 1e-9) return rat(p, d);
  }
  throw new RangeError(`lfMaths: ${v} is not an exact friendly number`);
}
export const qSub = (a: Q, b: Q): Q => qAdd(a, rat(-b.p, b.q));
export const qNeg = (a: Q): Q => rat(-a.p, a.q);
export const isInt = (a: Q): boolean => a.q === 1;

// ---------- the core facts ----------
/** slope through two points: (y2 - y1) / (x2 - x1), or null when x1 = x2 (no finite slope) */
export function slopeOf(x1: number, y1: number, x2: number, y2: number): Q | null {
  const dx = qSub(q(x2), q(x1));
  if (dx.p === 0) return null;
  return qDiv(qSub(q(y2), q(y1)), dx);
}
/** the initial value b from a slope and one point: b = y1 - m x1 */
export const interceptOf = (m: number | Q, x1: number, y1: number): Q => qSub(q(y1), qMul(q(m), q(x1)));
/** y = m x + b */
export const evalLine = (m: number | Q, b: number | Q, x: number | Q): Q => qAdd(qMul(q(m), q(x)), q(b));
/** do the points (in input order or not) fit ONE linear function? The rate between consecutive inputs, sorted. */
export function linearity(xs: readonly number[], ys: readonly number[]): { linear: boolean; rates: Q[]; order: number[]; firstBreak: number } {
  const order = xs.map((_, i) => i).sort((a, b) => xs[a]! - xs[b]!);
  const rates: Q[] = [];
  for (let k = 1; k < order.length; k++) {
    const i = order[k - 1]!, j = order[k]!;
    const r = slopeOf(xs[i]!, ys[i]!, xs[j]!, ys[j]!);
    if (!r) throw new RangeError('lfMaths: two rows with the same input');
    rates.push(r);
  }
  let firstBreak = -1;
  for (let k = 1; k < rates.length; k++) if (!qEq(rates[k]!, rates[0]!)) { firstBreak = k; break; }
  return { linear: firstBreak < 0, rates, order, firstBreak };
}
/** is v (a typed answer) exactly the rational a? (typed answers have at most a few decimals) */
export function sameValue(v: number, a: Q): boolean {
  if (!Number.isFinite(v)) return false;
  return Math.abs(v - qNum(a)) < 1e-6;
}

// ---------- writing numbers ----------
/** does a Q have a short decimal (at most 2 places)? */
export const terminates = (a: Q): boolean => [1, 2, 4, 5, 10, 20, 25, 50, 100].includes(a.q);
/** plain text of a number (no sign handling: '-' is the ASCII minus; use H() for HTML) */
export function dec(a: number | Q): string {
  const v = typeof a === 'number' ? a : qNum(a);
  const r = Math.round(v * 1000) / 1000;
  return String(r);
}
/** money text: 2.5 -> 2.50, 34 -> 34 */
export function moneyStr(v: number | Q): string {
  const x = typeof v === 'number' ? v : qNum(v);
  const r = Math.round(x * 100) / 100;
  return Number.isInteger(r) ? String(Math.abs(r)) : Math.abs(r).toFixed(2);
}
/** HTML of a number: the real minus sign, fractions as a/b when they do not terminate */
export function H(a: number | Q, o: { money?: boolean; frac?: boolean } = {}): string {
  const Qa = q(a);
  const neg = Qa.p < 0, m = neg ? qNeg(Qa) : Qa;
  let s: string;
  if (o.money) s = '$' + moneyStr(m);
  else if (!o.frac && terminates(m)) s = dec(m);
  else s = m.q === 1 ? String(m.p) : `${m.p}/${m.q}`;
  return (neg ? '−' : '') + s;
}
/** TeX of a number (fractions as \tfrac when they do not terminate) */
export function T(a: number | Q, o: { money?: boolean; frac?: boolean } = {}): string {
  const Qa = q(a);
  const neg = Qa.p < 0, m = neg ? qNeg(Qa) : Qa;
  let s: string;
  if (o.money) s = '\\$' + moneyStr(m);
  else if (!o.frac && terminates(m)) s = dec(m);
  else s = m.q === 1 ? String(m.p) : `\\tfrac{${m.p}}{${m.q}}`;
  return (neg ? '-' : '') + s;
}
/** a signed change as text: +3, −6, 0 */
export const signed = (a: number | Q): string => { const v = qNum(q(a)); return v > 0 ? '+' + H(a) : v < 0 ? H(a) : '0'; };

// ---------- writing equations ----------
export type Form = 'mx+b' | 'b+mx' | 'b-mx' | 'mx-b';
export interface EqOpts { x?: string; y?: string; form?: Form; frac?: boolean }
/** the equation y = mx + b, written the way the item wants (TeX). m = 0 -> y = b; b = 0 -> y = mx; m = 1 -> y = x + b. */
export function eqTex(m: number | Q, b: number | Q, o: EqOpts = {}): string {
  const x = o.x ?? 'x', y = o.y ?? 'y', M = q(m), Bq = q(b);
  const coef = (c: Q) => (c.p === c.q ? '' : c.p === -c.q ? '-' : T(c, { frac: o.frac }));
  const absCoef = (c: Q) => { const a = c.p < 0 ? qNeg(c) : c; return a.p === a.q ? '' : T(a, { frac: o.frac }); };
  if (M.p === 0) return `${y} = ${T(Bq)}`;
  if (Bq.p === 0) return `${y} = ${coef(M)}${x}`;
  const form = o.form ?? 'mx+b';
  if (form === 'b+mx' || form === 'b-mx') {
    const sign = M.p < 0 ? '-' : '+';
    return `${y} = ${T(Bq)} ${sign} ${absCoef(M)}${x}`;
  }
  const sign = Bq.p < 0 ? '-' : '+';
  return `${y} = ${coef(M)}${x} ${sign} ${T(Bq.p < 0 ? qNeg(Bq) : Bq)}`;
}
/** the same equation as HTML (italic letters, real minus signs) */
export function eqHtml(m: number | Q, b: number | Q, o: EqOpts = {}): string {
  const x = `<i>${o.x ?? 'x'}</i>`, y = `<i>${o.y ?? 'y'}</i>`, M = q(m), Bq = q(b);
  const coef = (c: Q) => (c.p === c.q ? '' : c.p === -c.q ? '−' : H(c, { frac: o.frac }));
  const absCoef = (c: Q) => { const a = c.p < 0 ? qNeg(c) : c; return a.p === a.q ? '' : H(a, { frac: o.frac }); };
  if (M.p === 0) return `${y} = ${H(Bq)}`;
  if (Bq.p === 0) return `${y} = ${coef(M)}${x}`;
  const form = o.form ?? 'mx+b';
  if (form === 'b+mx' || form === 'b-mx') return `${y} = ${H(Bq)} ${M.p < 0 ? '−' : '+'} ${absCoef(M)}${x}`;
  return `${y} = ${coef(M)}${x} ${Bq.p < 0 ? '−' : '+'} ${H(Bq.p < 0 ? qNeg(Bq) : Bq)}`;
}

// ---------- graph windows ----------
/** a friendly grid step so that span / step is at most `lines` */
export function niceStep(span: number, lines = 8): number {
  for (const s of [0.5, 1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 5000]) if (span / s <= lines) return s;
  return 10000;
}
export interface Window { min: number; max: number; step: number }
/** an axis window that holds every value, on grid lines, from 0 when `zero` (and always when the values cross 0) */
export function windowFor(vals: readonly number[], o: { zero?: boolean; lines?: number; step?: number; pad?: boolean } = {}): Window {
  let lo = Math.min(...vals), hi = Math.max(...vals);
  if (o.zero !== false) { lo = Math.min(lo, 0); hi = Math.max(hi, 0); }
  if (hi === lo) hi = lo + 1;
  const step = o.step ?? niceStep(hi - lo, o.lines ?? 8);
  let min = Math.floor(lo / step) * step, max = Math.ceil(hi / step) * step;
  if (o.pad) { if (max === hi) max += step; }
  if (max === min) max = min + step;
  return { min, max, step };
}
