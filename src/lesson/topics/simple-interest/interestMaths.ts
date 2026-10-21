// interestMaths.ts: exact money maths for "Calculate simple interest" (grade 7, 7.RP.A.3). Pure: no DOM.
//   money    integer cents
//   rates    hundredths of a percent ("bp"): 5% = 500, 3.5% = 350, 0.8% = 80, 2.25% = 225
//   time     months (12 = one year, 18 = one and a half years)
// Interest for `months` at `bp` on P cents is P * bp * months / 120000 cents, kept as the exact integer numerator U
// (units of 1/120000 cent), so whole-cent checks and rounding are exact.
export const U_CENT = 120000;
const NAME = 'interestMaths';
const fail = (msg: string): never => { throw new Error(`${NAME}: ${msg}`); };

/** the exact interest numerator, in units of 1/120000 cent */
export const interestU = (P: number, bp: number, months = 12): number => P * bp * months;
/** the interest in whole cents, or null when it has a fraction of a cent */
export function exactCents(P: number, bp: number, months = 12): number | null {
  const u = interestU(P, bp, months);
  return u % U_CENT === 0 ? u / U_CENT : null;
}
/** the interest in cents, throws when it is not whole cents (curated pairs only) */
export function cents(P: number, bp: number, months = 12): number {
  const c = exactCents(P, bp, months);
  return c ?? fail(`${P} at ${bp} for ${months} months is not whole cents`);
}
/** round to the nearest cent, halves up (the stated rule) */
export const roundHalfUp = (u: number): number => Math.floor((2 * u + U_CENT) / (2 * U_CENT));
/** cut off at the cent (the truncation slip) */
export const truncCents = (u: number): number => Math.floor(u / U_CENT);

// ---------- year-by-year schedules ----------
export interface YearRow { year: number; base: number; interest: number; balance: number }
/** rows year 0 (start) .. years: simple keeps the base at P, compound takes the latest balance; exact cents or throws */
export function schedule(P: number, bp: number, years: number, rule: 'simple' | 'compound'): YearRow[] {
  if (!Number.isInteger(P) || P <= 0) fail('principal must be positive cents');
  if (!Number.isInteger(bp) || bp <= 0 || bp > 5000) fail('rate out of range');
  const rows: YearRow[] = [{ year: 0, base: P, interest: 0, balance: P }];
  for (let y = 1; y <= years; y++) {
    const prev = rows[y - 1]!;
    const base = rule === 'simple' ? P : prev.balance;
    const i = cents(base, bp);
    rows.push({ year: y, base, interest: i, balance: prev.balance + i });
  }
  return rows;
}
/** a compound schedule if every year is whole cents, else null */
export function compoundOrNull(P: number, bp: number, years: number): YearRow[] | null {
  try { return schedule(P, bp, years, 'compound'); } catch { return null; }
}
/** I = P r t with t = months / 12, exact cents (throws otherwise) */
export const simpleI = (P: number, bp: number, months: number): number => cents(P, bp, months);

// ---------- formatting ----------
/** cents -> "2,315.25" (whole dollars without cents unless `force`) */
export function digits(c: number, force = false): string {
  const neg = c < 0; c = Math.abs(c);
  const d = Math.floor(c / 100), r = c % 100;
  const w = String(d).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return (neg ? '-' : '') + (r || force ? `${w}.${String(r).padStart(2, '0')}` : w);
}
/** cents -> "$2,315.25" */
export const usd = (c: number, force = false): string => `$${digits(c, force)}`;
/** cents -> TeX "\$2{,}315.25" */
export const usdTex = (c: number, force = false): string => `\\$${digits(c, force).replace(/,/g, '{,}')}`;
/** an exact amount in units of 1/120000 cent as a dollar decimal ("3.7035"); only for amounts that terminate */
export function unitsStr(u: number): string {
  // dollars = u / 12,000,000; 12,000,000 = 2^8 * 3 * 5^6, so the amount terminates when 3 divides u
  if (u % 3 !== 0) fail('amount does not terminate');
  const n = u / 3;                       // dollars = n / 4,000,000 = n * 25 / 10^8
  const s = String(n * 25).padStart(9, '0');
  const w = s.slice(0, -8).replace(/^0+(?=\d)/, ''), f = s.slice(-8).replace(/0+$/, '');
  const ws = w.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return f.length >= 2 ? `${ws}.${f}` : `${ws}.${f.padEnd(2, '0')}`;
}
/** a rate as percent digits: 500 -> "5", 350 -> "3.5", 80 -> "0.8", 225 -> "2.25" */
export function pct(bp: number): string { return decOf(bp, 2); }
/** a rate as its decimal: 350 -> "0.035", 80 -> "0.008", 1200 -> "0.12" */
export function rateDec(bp: number): string { return decOf(bp, 4); }
/** the one-step multiplier 1 + r: 600 -> "1.06", 250 -> "1.025" */
export function multDec(bp: number): string { return decOf(10000 + bp, 4); }
/** months as years: 12 -> "1", 18 -> "1.5", 9 -> "0.75" */
export function yearsDec(months: number): string { return decOf(Math.round((months * 10000) / 12), 4); }
/** months as a fraction of a year in TeX: 6 -> \tfrac{1}{2}, 18 -> \tfrac{3}{2}, 24 -> 2 */
export function yearsFracTex(months: number): string {
  const g = gcd(months, 12), n = months / g, d = 12 / g;
  return d === 1 ? String(n) : `\\tfrac{${n}}{${d}}`;
}
export const gcd = (a: number, b: number): number => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
/** n / 10^places as a decimal string */
export function decOf(n: number, places: number): string {
  const s = String(Math.abs(n)).padStart(places + 1, '0');
  const w = s.slice(0, s.length - places), f = s.slice(s.length - places).replace(/0+$/, '');
  return (n < 0 ? '-' : '') + (f ? `${w}.${f}` : w);
}

// ---------- reading typed answers ----------
/** dollars typed -> cents, or null when not a whole number of cents */
export function toCents(v: number): number | null {
  if (!Number.isFinite(v)) return null;
  const c = Math.round(v * 100);
  return Math.abs(v * 100 - c) < 1e-6 ? c : null;
}
/** a typed decimal equals the exact value n / 10^places */
export const sameDec = (v: number, n: number, places: number): boolean => Number.isFinite(v) && Math.abs(v * 10 ** places - n) < 1e-6;
