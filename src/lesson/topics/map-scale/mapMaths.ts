// mapMaths.ts: the exact maths of "Use a map scale" (pure: no DOM, no canvas).
//   A map scale 1 : n says ONE map unit stands for n of the SAME unit on the ground (1 : 24,000: 1 in -> 24,000 in,
//   1 cm -> 24,000 cm). A verbal scale says it with units (1 in = 10 mi).
//     ground(len, n)    = len * n           (map -> ground, the answer in the map unit)
//     mapLen(g, n)      = g / n             (ground -> map: the same factor, the other way)
//   1 mi = 5,280 ft = 63,360 in, so 1 : 63,360 is exactly 1 in = 1 mi; 1 : 24,000 is 1 in = 2,000 ft.
//   A reading to the nearest u stands for every true length within u / 2 of it; that error scales by n too.
// Numbers are terminating decimals; every result is rounded to 1e-9 so 2.5 * 24000 === 60000.
import { r9, near, fmt, fmtT } from '../scale-calculations/scaleCalc';

export { r9, near, fmt, fmtT };
export const IN_PER_FT = 12, FT_PER_MI = 5280, IN_PER_MI = 63360;
export const MM_PER_CM = 10, CM_PER_M = 100, M_PER_KM = 1000, CM_PER_KM = 100000;

export type LenU = 'in' | 'ft' | 'mi' | 'mm' | 'cm' | 'm' | 'km';
/** size of each unit in a base unit of its system (in for customary, mm for metric) */
const SIZE: Record<LenU, number> = { in: 1, ft: 12, mi: 63360, mm: 1, cm: 10, m: 1000, km: 1_000_000 };
export const isMetricU = (u: LenU): boolean => u === 'mm' || u === 'cm' || u === 'm' || u === 'km';
/** a length converted between two units of ONE system */
export function conv(x: number, from: LenU, to: LenU): number {
  if (isMetricU(from) !== isMetricU(to)) throw new Error(`mapMaths: ${from} and ${to} are from different systems`);
  return r9(x * SIZE[from] / SIZE[to]);
}

/** ground length in the map unit at 1 : n */
export function ground(len: number, n: number): number {
  if (!(len >= 0) || !(n > 0)) throw new RangeError('mapMaths: lengths are positive');
  return r9(len * n);
}
/** map length (in the ground unit) for a ground length at 1 : n */
export const mapLen = (g: number, n: number): number => r9(g / n);
/** a verbal scale "1 mapU = per groundU": ground length of a map length */
export const verbal = (len: number, per: number): number => r9(len * per);
/** the 1 : n of a verbal scale (1 in = 1 mi -> 63,360) */
export const ratioOf = (mapU: LenU, per: number, groundU: LenU): number => conv(per, groundU, mapU);

/** the range a reading to the nearest `unit` stands for */
export const range = (reading: number, unit: number): [number, number] => [r9(reading - unit / 2), r9(reading + unit / 2)];
/** could `x` be the true length behind this reading? (ends included: the edge case is a convention) */
export const possible = (x: number, reading: number, unit: number): boolean => { const [a, b] = range(reading, unit); return x >= a - 1e-9 && x <= b + 1e-9; };
/** the ground size of a map-reading error at 1 : n, in `to` */
export const groundError = (err: number, errU: LenU, n: number, to: LenU): number => conv(err * n, errU, to);

/** a 1 : n scale is LARGER when n is smaller (1/n is a bigger fraction): the same ground is drawn longer */
export const largerScale = (a: number, b: number): number => (a < b ? a : b);
/** how many inches long a ground length (in miles) is drawn at 1 : n */
export const drawnInches = (mi: number, n: number): number => r9(mi * IN_PER_MI / n);
/** how many miles of ground one sheet side (in inches) covers at 1 : n */
export const coverMiles = (sheetIn: number, n: number): number => r9(sheetIn * n / IN_PER_MI);

/** round to a number of decimal places */
export const roundTo = (x: number, places: number): number => { const f = 10 ** places; return Math.round(x * f + 1e-9) / f; };
/** text of a scale 1 : n */
export const rfText = (n: number): string => `1 : ${fmt(n)}`;
export const rfTex = (n: number): string => `1 : ${fmtT(n)}`;
