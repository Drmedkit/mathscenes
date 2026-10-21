// reverseMaths.ts: the exact maths of "find the original amount after a percent change", pure (no DOM, no TeX), so
// the items, the BaseTape model and the tests share one source of truth.
//   money      integer CENTS
//   rates      integer BASIS POINTS of a percent (hundredths of a percent): 20% = 2000, 8.25% = 825, 12.5% = 1250
//   multiplier m = (10000 ± rb) / 10000, so  new = m × original  and  original = new ÷ m = new × 10000 / (10000 ± rb)
// The original is an exact fraction of a cent (oNum / oDen cents); it is "exact" when that fraction is a whole number
// of cents, otherwise it is rounded to the nearest cent (halves up) as the course does with money.
import { check } from '../../../blocks/block';

const NAME = 'OriginalAmount';
export type Dir = 'down' | 'up';
export const BP = 10000;            // basis points in 100%

/** a percent (number, up to 2 decimals) -> basis points */
export function bp(r: number): number {
  const b = Math.round(r * 100);
  check(Number.isFinite(r) && Math.abs(r * 100 - b) < 1e-7, NAME, `the rate ${r}% must have at most two decimals`);
  return b;
}
/** the multiplier's numerator over 10000: 20% off -> 8000, 8% up -> 10800 */
export function mNum(r: number, dir: Dir): number {
  const b = bp(r);
  check(b > 0 && (dir === 'up' || b < BP), NAME, `a ${dir === 'down' ? 'decrease' : 'increase'} of ${r}% is not allowed (a decrease needs 0 < r < 100)`);
  return dir === 'up' ? BP + b : BP - b;
}

export interface Reverse {
  /** the amount after the change, cents */ newC: number;
  r: number; rb: number; dir: Dir;
  /** multiplier numerator over 10000 */ m: number;
  /** the original as an exact fraction of cents: oNum / oDen (reduced) */ oNum: number; oDen: number;
  /** true when the original is a whole number of cents */ exact: boolean;
  /** the original rounded to the nearest cent (halves up) */ origC: number;
  /** the original with the digits past the cent cut off (the truncation slip) */ truncC: number;
}
const gcd = (a: number, b: number): number => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };

/** the original amount from the amount after an r% change */
export function reverse(newC: number, r: number, dir: Dir): Reverse {
  check(Number.isInteger(newC) && newC > 0 && newC <= 10_000_000, NAME, `the new amount ${newC}¢ must be a whole number of cents`);
  const m = mNum(r, dir);
  let oNum = newC * BP, oDen = m;
  const g = gcd(oNum, oDen); oNum /= g; oDen /= g;
  const origC = Math.floor((2 * oNum + oDen) / (2 * oDen)), truncC = Math.floor(oNum / oDen);
  const out: Reverse = { newC, r, rb: bp(r), dir, m, oNum, oDen, exact: oDen === 1, origC, truncC };
  // the maths checks itself: applying the change to the exact original gives the new amount back
  check(oNum * m === newC * BP * oDen, NAME, 'the original times the multiplier must give the new amount');
  return out;
}
/** the forward change of a whole-cent original: m × P as an exact fraction of cents (num / 10000) */
export function forwardExact(origC: number, r: number, dir: Dir): { num: number; den: number } {
  return { num: origC * mNum(r, dir), den: BP };
}
/** the forward change of a whole-cent original, rounded to the cent (halves up) */
export function forwardC(origC: number, r: number, dir: Dir): number {
  const { num, den } = forwardExact(origC, r, dir);
  return Math.floor((2 * num + den) / (2 * den));
}
/** Model 2 (receipts): the change r% of P is rounded to the nearest cent FIRST, then added or taken off */
export function receiptTotal(origC: number, r: number, dir: Dir): number {
  const ch = Math.floor((2 * origC * bp(r) + BP) / (2 * BP));
  return dir === 'up' ? origC + ch : origC - ch;
}
/** the change r% of a cents amount, exact as num / 10000 cents */
export const changeOf = (c: number, r: number): number => c * bp(r);   // ÷ 10000 for cents
/** a fraction num/den of cents rounded half up to a whole cent */
export const roundFrac = (num: number, den: number): number => Math.floor((2 * num + den) / (2 * den));

// ---------- the percents and multipliers as text ----------
/** 8.25 -> "8.25", 20 -> "20", 12.5 -> "12.5" */
export function pctNum(r: number): string {
  const b = bp(r), w = Math.trunc(b / 100), f = Math.abs(b % 100);
  if (f === 0) return String(w);
  return `${w}.${String(f).padStart(2, '0').replace(/0$/, '')}`;
}
/** the resulting percent 100 ± r as a number (80, 108.25) */
export const resultPct = (r: number, dir: Dir): number => mNum(r, dir) / 100;
/** a number of basis points over 10000 as a decimal: 8000 -> "0.8", 10825 -> "1.0825", 600 -> "0.06" */
export function decimal(numOver10000: number): string {
  const neg = numOver10000 < 0, n = Math.abs(numOver10000);
  const w = Math.floor(n / BP), f = n % BP;
  let s = String(w);
  if (f) s += '.' + String(f).padStart(4, '0').replace(/0+$/, '');
  return (neg ? '-' : '') + s;
}
/** the multiplier as a decimal: 0.8, 1.06, 1.0825, 0.875 */
export const multStr = (r: number, dir: Dir): string => decimal(mNum(r, dir));
/** the rate as a decimal: 20 -> 0.2, 6 -> 0.06, 8.25 -> 0.0825 */
export const rateStr = (r: number): string => decimal(bp(r));
/** the multiplier as a number (for typed answers) */
export const multVal = (r: number, dir: Dir): number => mNum(r, dir) / BP;

// ---------- money formatting ----------
function group(i: string): string { return i.replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
/** cents -> "48", "47.17", "1,234.50"; `cents` forces two decimals ("48.00") */
export function digits(c: number, cents = false): string {
  const neg = c < 0; c = Math.abs(c);
  const d = Math.floor(c / 100), r = c % 100;
  const s = group(String(d)) + (r || cents ? '.' + String(r).padStart(2, '0') : '');
  return (neg ? '-' : '') + s;
}
export const usd = (c: number, cents = false): string => `$${digits(c, cents)}`;
export const usdTex = (c: number, cents = false): string => `\\$${digits(c, cents).replace(/,/g, '{,}')}`;
/** an exact fraction of cents as a decimal with `places` decimals of a dollar and "…" when it goes on: 47.1698… */
export function decimalsOf(num: number, den: number, places = 4): string {
  // dollars = num / (100 den)
  const D = 100 * den;
  const w = Math.floor(num / D);
  let rem = num - w * D, s = '';
  for (let i = 0; i < places && (rem || i < 2); i++) { rem *= 10; s += String(Math.floor(rem / D)); rem %= D; }
  return `${group(String(w))}${s ? '.' + s : ''}${rem ? '…' : ''}`;
}
/** spoken money: "forty-eight dollars" is left to the script; this gives "48 dollars and 50 cents" for tests/logs */
export function sayUsd(c: number): string {
  const d = Math.floor(c / 100), r = c % 100;
  if (!r) return `${d} dollar${d === 1 ? '' : 's'}`;
  return d ? `${d} dollars and ${r} cent${r === 1 ? '' : 's'}` : `${r} cents`;
}
/** a typed dollar amount -> cents when it is a whole number of cents, else null */
export function toCents(v: number): number | null {
  if (!Number.isFinite(v)) return null;
  const c = Math.round(v * 100);
  return Math.abs(v * 100 - c) < 1e-6 ? c : null;
}
