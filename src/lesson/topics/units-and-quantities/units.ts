// units.ts: the exact maths of "Reasoning with units" (no DOM). Unit factors, rounding intervals, reporting places,
// temperature readings vs differences, and the number / unit formatting the items, blocks and tests share.
import { gcd } from '../../runtime/item';

// ---------- numbers ----------
export const EPS = 1e-9;
export const near = (a: number, b: number, tol = 1e-6) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
/** round to n decimals without float noise */
export const roundTo = (v: number, dp: number) => { const f = 10 ** dp; return Math.round((v + Math.sign(v) * 1e-12) * f) / f; };
/** 1234.5 -> "1,234.5" (up to 5 decimals, trailing zeros dropped unless dp is given) */
export function fmt(v: number, dp?: number): string {
  const neg = v < 0, a = Math.abs(v);
  let s = dp === undefined ? String(roundTo(a, 5)) : roundTo(a, dp).toFixed(dp);
  if (s.includes('e')) s = a.toFixed(6).replace(/0+$/, '').replace(/\.$/, '');
  const [i, d] = s.split('.') as [string, string | undefined];
  const ii = i.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return (neg ? '−' : '') + ii + (d !== undefined ? '.' + d : '');
}
/** TeX of a number: thousands comma as {,}, real minus */
export const fmtT = (v: number, dp?: number) => fmt(v, dp).replace(/,/g, '{,}').replace('−', '-');
/** money: $3.50 */
export const money = (v: number) => '$' + fmt(v, 2);
export const moneyT = (v: number) => '\\$' + fmtT(v, 2);

// ---------- fractions (inches) ----------
export type Q = [number, number];
export const qn = (n: number, d: number): Q => { const g = gcd(n, d) || 1; return [n / g, d / g]; };
export const qadd = (a: Q, b: Q): Q => qn(a[0] * b[1] + b[0] * a[1], a[1] * b[1]);
export const qsub = (a: Q, b: Q): Q => qn(a[0] * b[1] - b[0] * a[1], a[1] * b[1]);
export const qval = (a: Q) => a[0] / a[1];
export const qeq = (a: Q, b: Q) => a[0] * b[1] === b[0] * a[1];
/** a non-negative fraction as a mixed number in HTML (3 3/16) */
export function mixedH(a: Q): string {
  const [n, d] = qn(a[0], a[1]), w = Math.floor(n / d), r = n - w * d;
  if (r === 0) return String(w);
  return `${w ? w + '&#8202;' : ''}<span class="fr"><span>${r}</span><span>${d}</span></span>`;
}
/** the same in TeX */
export function mixedT(a: Q): string {
  const [n, d] = qn(a[0], a[1]), w = Math.floor(n / d), r = n - w * d;
  if (r === 0) return String(w);
  return `${w || ''}\\tfrac{${r}}{${d}}`;
}
/** the same as words for a voiced or plain line (3 3/16) */
export function mixedP(a: Q): string {
  const [n, d] = qn(a[0], a[1]), w = Math.floor(n / d), r = n - w * d;
  return r === 0 ? String(w) : `${w ? w + ' ' : ''}${r}/${d}`;
}

// ---------- units ----------
/** a unit as TeX: "ft²" -> \text{ft}^2, "mi/h" -> \text{mi/h}, "$" -> \$ */
export function unitT(u: string): string {
  if (u === '$') return '\\$';
  if (u === '¢') return '\\text{¢}';
  if (u === '°F' || u === '°C') return `^\\circ\\mathrm{${u[1]}}`;
  const m = u.match(/^(.*?)([²³])$/);
  if (m) return `\\text{${m[1]}}^${m[2] === '²' ? 2 : 3}`;
  return `\\text{${u}}`;
}
/** n unit in TeX with a thin space; cssId wraps the unit when id is given */
export function qT(n: number | string, u: string, id?: string): string {
  const ns = typeof n === 'number' ? fmtT(n) : n;
  if (u === '$') return `\\$${ns}`;
  const ut = unitT(u);
  return `${ns}\\,${id ? `\\cssId{${id}}{${ut}}` : ut}`;
}
/** n unit in HTML */
export const qH = (n: number | string, u: string) => (u === '$' ? `$${typeof n === 'number' ? fmt(n, 2) : n}` : `${typeof n === 'number' ? fmt(n) : n} ${u}`);

/** a conversion pair: 1 big = f small (exact unless approx) */
export interface Pair { big: string; small: string; f: number; attr: string; approx?: boolean; system: 'customary' | 'metric' | 'cross' }
export const PAIRS: readonly Pair[] = [
  { big: 'ft', small: 'in', f: 12, attr: 'length', system: 'customary' },
  { big: 'yd', small: 'ft', f: 3, attr: 'length', system: 'customary' },
  { big: 'yd', small: 'in', f: 36, attr: 'length', system: 'customary' },
  { big: 'mi', small: 'ft', f: 5280, attr: 'length', system: 'customary' },
  { big: 'lb', small: 'oz', f: 16, attr: 'weight', system: 'customary' },
  { big: 'gal', small: 'qt', f: 4, attr: 'volume', system: 'customary' },
  { big: 'qt', small: 'pt', f: 2, attr: 'volume', system: 'customary' },
  { big: 'h', small: 'min', f: 60, attr: 'time', system: 'customary' },
  { big: 'min', small: 's', f: 60, attr: 'time', system: 'customary' },
  { big: 'ton', small: 'lb', f: 2000, attr: 'weight', system: 'customary' },
  { big: 'm', small: 'cm', f: 100, attr: 'length', system: 'metric' },
  { big: 'km', small: 'm', f: 1000, attr: 'length', system: 'metric' },
  { big: 'kg', small: 'g', f: 1000, attr: 'mass', system: 'metric' },
  { big: 'L', small: 'mL', f: 1000, attr: 'volume', system: 'metric' },
  { big: 'in', small: 'cm', f: 2.54, attr: 'length', system: 'cross' },
  { big: 'mi', small: 'km', f: 1.609, attr: 'length', system: 'cross', approx: true },
];
export const UNIT_WORD: Record<string, string> = {
  in: 'inches', ft: 'feet', yd: 'yards', mi: 'miles', lb: 'pounds', oz: 'ounces', gal: 'gallons', qt: 'quarts', pt: 'pints',
  h: 'hours', min: 'minutes', s: 'seconds', ton: 'tons', m: 'meters', cm: 'centimeters', km: 'kilometers', kg: 'kilograms',
  g: 'grams', L: 'liters', mL: 'milliliters', mm: 'millimeters',
};

// ---------- rounding intervals ----------
/** the values that round to v at resolution res: [v − res/2, v + res/2) (a value halfway rounds up) */
export const interval = (v: number, res: number): [number, number] => [v - res / 2, v + res / 2];
/** does x round to v at resolution res (half up)? */
export const roundsTo = (x: number, v: number, res: number) => x >= v - res / 2 - EPS && x < v + res / 2 - EPS;
/** the finest place (10^k) where both ends of a range round to the same value (0.1475..0.1525 -> 10^-2: both 0.15);
 *  null when no place from 10^-6 up to 10^3 agrees. The range is half-open [lo, hi): lo is included (a halfway value
 *  rounds up), hi is excluded, so a hi sitting on a rounding boundary counts as the value just below it
 *  (2.13 <= true < 2.15 -> every value rounds to 2.1) */
export function agreePlace(lo: number, hi: number): number | null {
  for (let k = -6; k <= 3; k++) {
    const p = 10 ** k, a = Math.round(lo / p + 1e-6), b = Math.round(hi / p - 1e-6);
    if (a === b && a !== 0) return k;
  }
  return null;
}
/** a value reported at place 10^k: "3.0", "21", "1,060" */
export function report(v: number, k: number): string {
  if (k >= 0) { const p = 10 ** k; return fmt(Math.round(v / p) * p); }
  return fmt(v, -k);
}

// ---------- temperature ----------
export const cToF = (c: number) => (9 / 5) * c + 32;
export const fToC = (f: number) => (5 / 9) * (f - 32);

// ---------- speeds ----------
/** a speed in ft/s */
export const MPH_FTPS = 5280 / 3600;
