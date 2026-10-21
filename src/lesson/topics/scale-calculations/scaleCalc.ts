// scaleCalc.ts: the exact maths of "Scale calculations" (pure: no DOM, no canvas).
//   A scale is drawing : actual, in that order. `per` = actual units per ONE drawing unit (1 in : 8 ft -> 8 ft per in;
//   5 : 1 -> 0.2 mm per mm). One factor links every pair, so:
//     toActual(x)   = x * per     (drawing -> actual: x k at 1 : k, / k at k : 1)
//     toDrawing(y)  = y / per     (actual -> drawing: the step back undoes the step with the SAME factor)
//   ratioN        the same-unit ratio 1 : N (1 in : 4 ft = 1 : 48); a scale with units converts its actual part first
//   convert       length conversion inside one system (in / ft / yd, mm / cm / m)
// Values are terminating decimals (halves, quarters, tenths); every result is rounded to 1e-9 so 2.25 * 8 === 18.
// The unit table is scale-drawings' (imported read-only).
import { convert as convertQ } from '../scale-drawings/scaleMaths';
import { qNum } from '../../../core/math';

export type U = 'in' | 'ft' | 'yd' | 'mm' | 'cm' | 'm';
export const METRIC: ReadonlySet<U> = new Set<U>(['mm', 'cm', 'm']);
export const isMetric = (u: U): boolean => METRIC.has(u);
/** a scale "d dU : a aU" (drawing first) */
export interface Scale { d: number; dU: U; a: number; aU: U }
export const r9 = (x: number): number => Math.round(x * 1e9) / 1e9;
export const near = (a: number, b: number): boolean => Math.abs(a - b) < 1e-7;

export function scale(d: number, dU: U, a: number, aU: U): Scale {
  if (!(d > 0) || !(a > 0)) throw new RangeError('scale: both parts must be positive');
  if (isMetric(dU) !== isMetric(aU)) throw new Error(`scale: ${dU} and ${aU} are from different systems`);
  return { d, dU, a, aU };
}
/** actual units (aU) per one drawing unit (dU) */
export const per = (s: Scale): number => r9(s.a / s.d);
export const toActual = (s: Scale, x: number): number => r9(x * s.a / s.d);
export const toDrawing = (s: Scale, y: number): number => r9(y * s.d / s.a);
export const unitless = (s: Scale): boolean => s.dU === s.aU;
/** reduction (the drawing is smaller), enlargement, or the same size: only meaningful in one unit */
export const isReduction = (s: Scale): boolean => ratioN(s) > 1;
/** a length converted between two units of one system */
export function convert(x: number, from: U, to: U): number {
  if (from === to) return x;
  return r9(qNum(convertQ(rq(x), from, to)));
}
/** N in the same-unit ratio 1 : N (drawing : actual); N < 1 for an enlargement */
export const ratioN = (s: Scale): number => r9(convert(s.a, s.aU, s.dU) / s.d);
/** how many of `small` make one `big` (12 in per ft) */
export const factorOf = (big: U, small: U): number => convert(1, big, small);
/** the scale per ONE drawing unit (2 cm : 5 m -> 1 cm : 2.5 m) */
export const normalized = (s: Scale): Scale => ({ d: 1, dU: s.dU, a: per(s), aU: s.aU });

/** a friendly rational for scale-drawings' converter (halves, quarters, tenths ...) */
function rq(x: number): import('../../../core/math').Q {
  for (const den of [1, 2, 4, 5, 8, 10, 20, 25, 50, 100, 1000]) {
    const p = Math.round(x * den);
    if (Math.abs(p / den - x) < 1e-9) { const g = gcd(p, den); return { p: p / g, q: den / g }; }
  }
  throw new RangeError(`scaleCalc: ${x} is not a friendly decimal`);
}
const gcd = (a: number, b: number): number => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };

// ---------- formatting ----------
/** text of a number: thousands commas, up to 4 decimals (1,200 / 2.5 / 0.25) */
export const fmt = (x: number): string => r9(x).toLocaleString('en-US', { maximumFractionDigits: 4 });
/** TeX of a number (thousands comma as {,}) */
export const fmtT = (x: number): string => fmt(x).replace(/,/g, '{,}');
/** a customary length as a mixed number when it is a half / quarter (2 1/2), else the decimal */
export function quarters(x: number): { w: number; n: number; d: number } | null {
  const q4 = Math.round(x * 4);
  if (Math.abs(q4 / 4 - x) > 1e-9 || Number.isInteger(x)) return null;
  const w = Math.floor(q4 / 4), r = q4 - 4 * w;
  return r === 2 ? { w, n: 1, d: 2 } : { w, n: r, d: 4 };
}
/** TeX: 2\tfrac{1}{2} for halves / quarters (customary drawing lengths), else the decimal */
export function mixT(x: number): string {
  const f = quarters(x);
  return f ? `${f.w ? f.w : ''}\\tfrac{${f.n}}{${f.d}}` : fmtT(x);
}
/** HTML: 2 1/2 with a stacked fraction, else the decimal */
export function mixH(x: number): string {
  const f = quarters(x);
  return f ? `${f.w ? f.w + '&#8202;' : ''}<span class="fr"><span>${f.n}</span><span>${f.d}</span></span>` : fmt(x);
}
/** plain text: 2 1/2, else the decimal */
export function mixS(x: number): string {
  const f = quarters(x);
  return f ? `${f.w ? f.w + ' ' : ''}${f.n}/${f.d}` : fmt(x);
}
/** a scale as TeX: 1\text{ in} : 8\text{ ft}, or 1 : 50 for a same-unit scale */
export function scaleT(s: Scale, units = !unitless(s)): string {
  const d = isMetric(s.dU) ? fmtT(s.d) : mixT(s.d), a = isMetric(s.aU) ? fmtT(s.a) : mixT(s.a);
  return units ? `${d}\\text{ ${s.dU}} : ${a}\\text{ ${s.aU}}` : `${d} : ${a}`;
}
/** a scale as HTML text */
export function scaleH(s: Scale, units = !unitless(s)): string {
  const d = isMetric(s.dU) ? fmt(s.d) : mixH(s.d), a = isMetric(s.aU) ? fmt(s.a) : mixH(s.a);
  return units ? `${d} ${s.dU} : ${a} ${s.aU}` : `${d} : ${a}`;
}
