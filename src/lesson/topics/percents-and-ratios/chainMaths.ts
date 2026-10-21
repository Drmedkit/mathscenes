// chainMaths.ts: exact arithmetic and formatting for "combine percents and ratios" (no DOM).
// Money is checked in whole cents, percents may have decimals (7.25%), ratio shares are exact by construction.

export const EPS = 1e-6;
export const near = (a: number, b: number, e = EPS) => Math.abs(a - b) < e;
/** a value to whole cents (half up) */
export const toCents = (v: number) => Math.round(v * 100 + 1e-7);
export const isCents = (v: number) => Math.abs(v * 100 - Math.round(v * 100)) < 1e-6;
export const isWhole = (v: number) => Math.abs(v - Math.round(v)) < 1e-9;
/** round half up of the exact quotient n / d (n, d >= 0 integers) */
export const roundDiv = (n: number, d: number) => Math.floor((2 * n + d) / (2 * d));
export const r2 = (v: number) => Math.round(v * 100 + 1e-9) / 100;
export const r4 = (v: number) => Math.round(v * 10000 + 1e-9) / 10000;

/** p% of a whole, kept exact to 1e-9 */
export const pctOf = (p: number, whole: number) => r4((p * whole) / 100);
/** the share of part i of a total shared in the ratio parts */
export function shareOf(total: number, parts: readonly number[], i: number): number {
  const s = parts.reduce((a, b) => a + b, 0);
  return r4((total * parts[i]!) / s);
}
/** the multiplier of a change: -p% -> 1 - p/100, +p% -> 1 + p/100 */
export const mult = (p: number) => r4(1 + p / 100);

// ---------- text ----------
function commas(s: string): string {
  const [w, f] = s.split('.');
  const ww = w!.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return f === undefined ? ww : `${ww}.${f}`;
}
/** a plain number: whole, or up to 4 decimals, with thousands commas */
export function nf(v: number): string {
  const neg = v < 0, a = Math.abs(v);
  const s = isWhole(a) ? String(Math.round(a)) : String(r4(a));
  return (neg ? '−' : '') + commas(s);
}
/** dollars: "$90", "$4.80", "$1,200" */
export function money(v: number): string {
  const c = toCents(Math.abs(v));
  const s = c % 100 === 0 ? String(c / 100) : (c / 100).toFixed(2);
  return (v < 0 ? '−' : '') + '$' + commas(s);
}
/** a percent: "20%", "7.25%" */
export const pc = (p: number) => `${nf(p)}%`;
/** TeX of a number (thousands comma as {,}) */
export function tn(v: number, cents = false): string {
  const a = Math.abs(v);
  const s = cents && !isWhole(a) ? (toCents(a) / 100).toFixed(2) : isWhole(a) ? String(Math.round(a)) : String(r4(a));
  const [w, f] = s.split('.');
  return (v < 0 ? '-' : '') + w!.replace(/\B(?=(\d{3})+(?!\d))/g, '{,}') + (f === undefined ? '' : '.' + f);
}
/** a multiplier as text: 0.8, 1.07, 1.0725 */
export const mf = (m: number) => String(r4(m));

/** the ratio a : b : c as text */
export const ratioText = (parts: readonly number[]) => parts.join(' : ');
