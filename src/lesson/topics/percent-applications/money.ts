// money.ts: exact money and percent maths for "percent applications" (grade 7). Money is kept in integer CENTS and
// a rate as an integer number of MILLI-percents (8.875% = 8875), so every product is an exact integer ratio and the
// generators can insist on whole cents (or round on purpose, with a stated policy). Pure: no DOM, no canvas.

/** a rate in percent (up to 3 decimals) as integer milli-percents */
export function mp(p: number): number {
  const m = Math.round(p * 1000);
  if (Math.abs(m - p * 1000) > 1e-6) throw new Error(`rate ${p}% has more than 3 decimals`);
  return m;
}
/** dollars -> integer cents (throws on fractions of a cent) */
export function cents(d: number): number {
  const c = Math.round(d * 100);
  if (Math.abs(c - d * 100) > 1e-6) throw new Error(`$${d} is not a whole number of cents`);
  return c;
}
/** p% of an amount in cents, exactly, or null when it is not a whole number of cents */
export function partC(c: number, p: number): number | null {
  const n = c * mp(p);
  return n % 100000 === 0 ? n / 100000 : null;
}
/** p% of an amount in cents, rounded to the nearest cent (half up) */
export function partRound(c: number, p: number): number {
  const n = c * mp(p);
  return Math.floor((2 * n + 100000) / 200000);
}
/** p% of an amount in cents as a plain number of cents (may have fractions of a cent) */
export const partRaw = (c: number, p: number): number => (c * mp(p)) / 100000;
/** the amount after a signed percent change (+8 = up 8%, -20 = down 20%), exact cents or null */
export function applyC(c: number, p: number): number | null {
  const d = partC(c, Math.abs(p));
  return d === null ? null : p >= 0 ? c + d : c - d;
}
/** apply several signed changes in order, each to the current amount; null as soon as one leaves whole cents */
export function chainC(c: number, ps: readonly number[]): number | null {
  let v: number | null = c;
  for (const p of ps) { if (v === null) return null; v = applyC(v, p); }
  return v;
}

/** the decimal multiplier of a signed change as a string: -20 -> "0.8", 8.25 -> "1.0825", 150 -> "2.5" */
export function multStr(p: number): string { return decStr(100000 + mp(p), 100000); }
/** the percent of a signed change as a decimal string: 0.0625 for 6.25 (rate -> decimal) */
export function rateStr(p: number): string { return decStr(mp(p), 100000); }
/** an exact terminating decimal n / d (d a power of 10) without trailing zeros */
export function decStr(n: number, d: number): string {
  const neg = n < 0; n = Math.abs(n);
  const w = Math.floor(n / d), r = n % d;
  if (r === 0) return `${neg ? '-' : ''}${w}`;
  const digits = String(d).length - 1;
  return `${neg ? '-' : ''}${w}.${String(r).padStart(digits, '0').replace(/0+$/, '')}`;
}
/** a percent number as text: 8.875 -> "8.875", 20 -> "20" */
export const pctStr = (p: number): string => decStr(mp(p), 1000);
export const multNum = (p: number): number => (100000 + mp(p)) / 100000;

/** "$1,234.50" / "$64" (whole dollars without cents unless `always`) */
export function money(c: number, always = false): string {
  const neg = c < 0; c = Math.abs(c);
  const d = Math.floor(c / 100), r = c % 100;
  const ds = d.toLocaleString('en-US');
  return `${neg ? '−' : ''}$${ds}${r || always ? '.' + String(r).padStart(2, '0') : ''}`;
}
/** the same in TeX: \$1{,}234.50 */
export function moneyTex(c: number, always = false): string {
  return money(c, always).replace('$', '\\$').replace(/,/g, '{,}').replace('−', '-');
}
/** cents -> dollars number (for answers) */
export const dollars = (c: number): number => c / 100;
/** a dollar value of the multiplier products as TeX-safe plain number: 57.6 -> "57.60" */
export function numStr(c: number, always = true): string { return money(c, always).replace('$', '').replace('−', '-'); }

/** simple interest in cents: P r t (t in years, may be a fraction like 1.5) -> exact or null */
export function simpleInterest(P: number, p: number, years: number): number | null {
  const n = P * mp(p) * Math.round(years * 100);
  return n % 10000000 === 0 ? n / 10000000 : null;
}
/** a whole-number percent of a ratio a / b, as a number (for percent error) */
export const pctOf = (a: number, b: number): number => (100 * a) / b;
/** round to `dp` decimals, half up */
export const roundTo = (x: number, dp: number): number => { const f = 10 ** dp; return Math.round(x * f + 1e-9) / f; };
