// ratioMaths.ts: the exact maths of "ratio problems with fractions and decimals". No DOM, no canvas.
// Values are exact rationals (core/math Q). A missing value of a proportional pair is b × (t ÷ a), kept exact; long
// division gives the digits of a quotient one place past the stated precision; rounding happens once, at the end,
// half up (2.625 -> 2.63), on the exact value.
import { type Q, qAdd, qDiv, qEq, qMul, qNum, rat } from '../../../core/math';

export { rat, qMul, qDiv, qAdd, qEq, qNum };
export type { Q };

/** an exact value from a number with at most 6 decimals (typed answers, money, tenths) */
export function qOf(x: number): Q {
  if (!Number.isFinite(x)) throw new RangeError(`qOf: ${x}`);
  for (const d of [1, 10, 100, 1000, 10000, 100000, 1000000]) {
    const p = Math.round(x * d);
    if (Math.abs(x * d - p) < 1e-7) return rat(p, d);
  }
  return rat(Math.round(x * 1e6), 1e6);
}
export const Qv = (x: number | Q): Q => (typeof x === 'number' ? qOf(x) : x);
export const qSub = (a: Q, b: Q): Q => rat(a.p * b.q - b.p * a.q, a.q * b.q);
export const qLess = (a: Q, b: Q): boolean => a.p * b.q < b.p * a.q;

/** the missing value of a proportional pair: a -> b, so t -> b × t / a (exact) */
export function missing(a: Q | number, b: Q | number, t: Q | number): Q { return qMul(Qv(b), qDiv(Qv(t), Qv(a))); }
/** the multiplier between two values of the same quantity: new ÷ old (directional) */
export const multiplier = (oldV: Q | number, newV: Q | number): Q => qDiv(Qv(newV), Qv(oldV));
/** the rate within a pair: second per one first */
export const rateOf = (a: Q | number, b: Q | number): Q => qDiv(Qv(b), Qv(a));

/** does p/q have a finite decimal (denominator only 2s and 5s)? */
export function terminates(v: Q): boolean { let d = v.q; while (d % 2 === 0) d /= 2; while (d % 5 === 0) d /= 5; return d === 1; }
/** the number of decimal places of a terminating value (or Infinity) */
export function places(v: Q): number {
  if (!terminates(v)) return Infinity;
  for (let n = 0; n < 16; n++) if (10 ** n % v.q === 0) return n;
  return Infinity;
}
/** long division of a value to `n` decimal places, cut off (not rounded): 240/7, 3 -> "34.285" */
export function longDiv(v: Q, n: number): string {
  if (v.p < 0) return '-' + longDiv(rat(-v.p, v.q), n);
  const w = Math.floor(v.p / v.q);
  let r = v.p % v.q, s = String(w);
  if (n > 0) s += '.';
  for (let i = 0; i < n; i++) { r *= 10; s += String(Math.floor(r / v.q)); r %= v.q; }
  return s;
}
/** round the exact value half up to n decimal places (exact integer arithmetic) */
export function roundQ(v: Q, n: number): Q {
  const s = 10 ** n, num = v.p * s, k = Math.floor((2 * num + v.q) / (2 * v.q));
  return rat(k, s);
}
/** cut off (truncate) to n places */
export function truncQ(v: Q, n: number): Q { const s = 10 ** n; return rat(Math.floor((v.p * s) / v.q), s); }
/** a value as plain text: 12, 4.5, 2.625, else p/q (money: $4.50, $240/7) */
export function fmt(v: Q, money = false, maxDp = 3): string {
  const dp = places(v);
  if (v.q === 1) return (money ? '$' : '') + String(v.p);
  if (dp <= maxDp) { const t = qNum(v).toFixed(money ? Math.max(2, dp) : dp); return (money ? '$' : '') + t; }
  return (money ? '$' : '') + `${v.p}/${v.q}`;
}
/** a value as a mixed number text: 8 4/7 (or the decimal when it terminates) */
export function fmtMixed(v: Q, money = false): string {
  if (terminates(v) && places(v) <= 3) return fmt(v, money);
  const w = Math.floor(v.p / v.q), r = v.p - w * v.q;
  return (money ? '$' : '') + (w ? `${w} ${r}/${v.q}` : `${r}/${v.q}`);
}
/** TeX of a value: 12, 4.5, \tfrac{60}{7} or 8\tfrac{4}{7} (mixed) */
export function texQ(v: Q, o: { money?: boolean; mixed?: boolean; d?: boolean } = {}): string {
  const $ = o.money ? '\\$' : '';
  if (terminates(v) && places(v) <= 3) return o.money ? $ + fmt(v, true).slice(1) : fmt(v);
  const f = o.d ? '\\dfrac' : '\\tfrac';
  if (o.mixed && v.p > v.q) { const w = Math.floor(v.p / v.q), r = v.p - w * v.q; return `${$}${w}${f}{${r}}{${v.q}}`; }
  return `${$}${f}{${v.p}}{${v.q}}`;
}
/** money text: $34.29, $2.50, and whole dollars without cents ($12) */
export const money = (v: Q | number) => { const x = qNum(Qv(v)); return '$' + (Math.abs(x - Math.round(x)) < 1e-9 ? String(Math.round(x)) : x.toFixed(2)); };

/** the frac answer {w, n, d} of a value (mixed form) */
export function fracAns(v: Q): { kind: 'frac'; w: number; n: number; d: number } {
  const w = Math.floor(v.p / v.q), r = v.p - w * v.q;
  return r === 0 ? { kind: 'frac', w, n: 0, d: 1 } : { kind: 'frac', w, n: r, d: v.q };
}
/** the exact value of a typed response: a number box, or whole + n/d (a decimal typed in the whole box counts too) */
export function valueOf(r: { kind: string; v?: number; w?: number; n?: number; d?: number }): Q | null {
  if (r.kind === 'num') return r.v !== undefined && Number.isFinite(r.v) ? qOf(r.v) : null;
  if (r.kind !== 'frac') return null;
  const w = r.w ?? 0, n = r.n ?? 0, d = r.d ?? 1;
  if (![w, n, d].every(Number.isFinite) || d <= 0 || w < 0 || n < 0) return null;
  if (!Number.isInteger(n) || !Number.isInteger(d)) return null;
  return qAdd(qOf(w), rat(n, d));
}
/** is a typed value within `tol` of v (numbers a kid could have rounded) */
export const near = (x: Q, v: Q | number, tol = 0.005) => Math.abs(qNum(x) - (typeof v === 'number' ? v : qNum(v))) <= tol + 1e-12;
