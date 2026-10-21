// scaleBasicsMaths.ts: the exact maths of "Understand scale" (pure: no DOM, no canvas).
//   factor        how many times as long the actual length is (actual / drawing, ONE unit), exact
//   toScale       one factor for every pair of corresponding lengths
//   sameUnit      rewrite a pair of lengths in one unit (the smaller one) before comparing
//   legendRatio   "1 in represents 10 ft" -> 1 : 120 (reuses scale-drawings' unit table, read-only)
//   reduce        a : b -> 1 : b/a (normalised, drawing first)
// Lengths are small whole numbers here; every quotient is checked to be whole (or the item is rejected).
import { convert, legend, ratioN } from '../scale-drawings/scaleMaths';
import { qIsInt, qNum } from '../../../core/math';

export type LenUnit = 'in' | 'ft' | 'yd' | 'cm' | 'm';
const METRIC = new Set<LenUnit>(['cm', 'm']);
export const isMetricU = (u: LenUnit): boolean => METRIC.has(u);
/** size of a unit in its system's smallest unit here (in, cm) */
const SMALL: Record<LenUnit, number> = { in: 1, ft: 12, yd: 36, cm: 1, m: 100 };

/** actual / drawing when both are in one unit; throws when it is not a whole number (no such item is made) */
export function factor(drawing: number, actual: number): number {
  if (!(drawing > 0) || !(actual > 0)) throw new RangeError('factor: lengths must be positive');
  const k = actual / drawing;
  if (!Number.isInteger(k)) throw new RangeError(`factor: ${actual} / ${drawing} is not whole`);
  return k;
}
/** the same factor for every corresponding pair (length with length, width with width) */
export function toScale(draw: readonly number[], real: readonly number[]): boolean {
  if (draw.length !== real.length || !draw.length) return false;
  const k = real[0]! / draw[0]!;
  return draw.every((d, i) => Math.abs(real[i]! / d - k) < 1e-9);
}
/** a length in the smaller unit of its system (2 m -> 200 cm, 2 ft -> 24 in) */
export function inSmall(x: number, u: LenUnit): number {
  const small: LenUnit = isMetricU(u) ? 'cm' : 'in';
  const v = convert(x, u === 'm' ? 'm' : u, small === 'cm' ? 'cm' : 'in');
  if (!qIsInt(v)) throw new RangeError('inSmall: not whole');
  return qNum(v);
}
/** both lengths in one unit (the drawing's unit), then the factor: 3 in vs 2 ft -> 3 in vs 24 in, factor 8 */
export function sameUnit(d: number, dU: LenUnit, a: number, aU: LenUnit): { d: number; a: number; unit: LenUnit; k: number } {
  if (isMetricU(dU) !== isMetricU(aU)) throw new Error('sameUnit: different systems');
  const aIn = (a * SMALL[aU]) / SMALL[dU];
  if (!Number.isInteger(aIn)) throw new RangeError('sameUnit: not whole');
  return { d, a: aIn, unit: dU, k: factor(d, aIn) };
}
/** "1 dU represents r aU" as a same-unit ratio 1 : N */
export function legendRatio(r: number, dU: 'in' | 'cm', aU: LenUnit): number {
  const L = legend(1, dU, r, aU === 'm' ? 'm' : aU);
  const N = ratioN(L);
  if (!qIsInt(N)) throw new RangeError('legendRatio: not whole');
  return qNum(N);
}
/** a : b with a | b -> [1, b / a] */
export function reduce(a: number, b: number): [number, number] { return [1, factor(a, b)]; }
/** thousands commas: 2000 -> "2,000" (text), "2{,}000" (TeX) */
export const fmt = (n: number): string => n.toLocaleString('en-US');
export const tfmt = (n: number): string => fmt(n).replace(/,/g, '{,}');
