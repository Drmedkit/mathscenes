// taxMaths.ts: the exact maths of a sales-tax receipt, pure (no DOM, no TeX), shared by the items, the TaxTape model
// and the tests. No floating point anywhere:
//   prices are whole CENTS, rates are whole MILLI-PERCENTS (8% = 8000, 8.25% = 8250, 8.875% = 8875, 0.5% = 500),
//   exact tax amounts are integer UNITS of $0.0000001 (1 cent = 100 000 units): tax = price(cents) x rate(m%) units.
//   total = pre-tax price + tax                 (the pre-tax price is the 100% whole; the tax sticks out r% more)
//   total = (1 + r) x pre-tax price            (one step: 8% tax gives the multiplier 1.08)
// Money policy of the course: round the TAX once to the nearest cent (halves up), then add it.
import { check } from '../../../blocks/block';

const NAME = 'SalesTax';
export const U_CENT = 100000;              // units per cent
export const U_DOLLAR = 10000000;          // units per dollar
export const M_WHOLE = 100000;             // milli-percents in 100%

export interface Tax {
  /** pre-tax price, cents */ price: number;
  /** rate, milli-percent */ rate: number;
  /** the exact tax, units of $0.0000001 */ taxU: number;
  /** the tax rounded to the cent (halves up), cents */ tax: number;
  /** pre-tax price + rounded tax, cents */ total: number;
  /** true when the exact tax is a whole number of cents */ exact: boolean;
}

/** the tax on a pre-tax price in cents at a rate in milli-percent */
export function salesTax(priceCents: number, rateM: number): Tax {
  check(Number.isInteger(priceCents) && priceCents >= 0 && priceCents <= 1000000, NAME, `the price ${priceCents}¢ must be a whole number of cents up to $10,000`);
  check(Number.isInteger(rateM) && rateM >= 0 && rateM <= 20000, NAME, `the rate ${rateM / 1000}% must be 0% to 20% with at most three decimal places`);
  const taxU = priceCents * rateM;
  const tax = roundU(taxU);
  check(taxU <= Number.MAX_SAFE_INTEGER, NAME, 'the tax is too large to keep exact');
  return { price: priceCents, rate: rateM, taxU, tax, total: priceCents + tax, exact: taxU % U_CENT === 0 };
}

// ---------- rounding: units -> cents ----------
/** nearest cent, halves up (the course rule) */
export const roundU = (u: number): number => Math.floor((u + U_CENT / 2) / U_CENT);
/** cut off past the cent (the truncation slip) */
export const truncU = (u: number): number => Math.floor(u / U_CENT);
/** the total with the tax rounded (forward check of a candidate price) */
export const totalOf = (priceCents: number, rateM: number): number => priceCents + roundU(priceCents * rateM);
/** the rounded tax of a candidate price */
export const taxOf = (priceCents: number, rateM: number): number => roundU(priceCents * rateM);

// ---------- working backward (exact receipts) ----------
/** rate = tax / pre-tax price, in milli-percent, or null when it is not a whole number of milli-percents */
export function rateFrom(priceCents: number, taxCents: number): number | null {
  if (priceCents <= 0) return null;
  const n = taxCents * M_WHOLE;
  return n % priceCents === 0 ? n / priceCents : null;
}
/** pre-tax price = tax / rate, cents, or null when not a whole number of cents */
export function priceFromTax(taxCents: number, rateM: number): number | null {
  if (rateM <= 0) return null;
  const n = taxCents * M_WHOLE;
  return n % rateM === 0 ? n / rateM : null;
}
/** pre-tax price = total / (1 + r), cents, or null when not a whole number of cents */
export function priceFromTotal(totalCents: number, rateM: number): number | null {
  const n = totalCents * M_WHOLE, d = M_WHOLE + rateM;
  return n % d === 0 ? n / d : null;
}

// ---------- working backward (rounded receipts): candidates and forward checks ----------
/** every cent price whose rounded total is this total (at most one: the total rises with the price) */
export function pricesForTotal(totalCents: number, rateM: number): number[] {
  const q = Math.floor((totalCents * M_WHOLE) / (M_WHOLE + rateM));
  const out: number[] = [];
  for (let p = Math.max(0, q - 3); p <= q + 3; p++) if (totalOf(p, rateM) === totalCents) out.push(p);
  return out;
}
/** every cent price whose rounded tax is this tax: a range [lo, hi], or null */
export function pricesForTax(taxCents: number, rateM: number): [number, number] | null {
  if (rateM <= 0) return null;
  const q = Math.round((taxCents * M_WHOLE) / rateM);
  if (taxOf(q, rateM) !== taxCents) return null;
  let lo = q, hi = q;
  while (lo > 0 && taxOf(lo - 1, rateM) === taxCents) lo--;
  while (taxOf(hi + 1, rateM) === taxCents) hi++;
  return [lo, hi];
}
/** the most expensive cent price whose rounded total stays within the budget */
export function budgetMax(budgetCents: number, rateM: number): number {
  let p = Math.floor((budgetCents * M_WHOLE) / (M_WHOLE + rateM));   // the safe candidate: the quotient cut off
  check(totalOf(p, rateM) <= budgetCents, NAME, 'the cut-off quotient must fit the budget');
  while (totalOf(p + 1, rateM) <= budgetCents) p++;
  return p;
}
/** the budget quotient budget / (1 + r) in units (for the board: 28.3018...) */
export const budgetQuotientU = (budgetCents: number, rateM: number): number => Math.floor((budgetCents * M_WHOLE * U_CENT) / (M_WHOLE + rateM));

// ---------- reading a typed answer ----------
/** dollars typed by the kid -> cents, or null when it is not a whole number of cents */
export function toCents(v: number): number | null {
  if (!Number.isFinite(v)) return null;
  const c = Math.round(v * 100);
  return Math.abs(v * 100 - c) < 1e-6 ? c : null;
}
/** dollars typed -> units (exact to 7 places), or null */
export function toUnits(v: number): number | null {
  if (!Number.isFinite(v)) return null;
  const u = Math.round(v * U_DOLLAR);
  return Math.abs(v * U_DOLLAR - u) < 1e-3 ? u : null;
}

// ---------- formatting ----------
/** the digits of an amount in units: 60, 60.00, 4.80, 0.735, 1.649175 (`cents` forces two decimals at least) */
export function digitsU(u: number, cents = true): string {
  const neg = u < 0; u = Math.abs(u);
  const d = Math.floor(u / U_DOLLAR), r = u % U_DOLLAR;
  let f = String(r).padStart(7, '0');
  while (f.length > (cents ? 2 : 0) && f.endsWith('0')) f = f.slice(0, -1);
  const s = f.length ? `${d}.${f}` : String(d);
  return (neg ? '-' : '') + s.replace(/^(\d+)(\d{3})(\.|$)/, '$1,$2$3');
}
/** cents -> "$64.80" (cents=false drops ".00" from whole dollars) */
export const usd = (c: number, cents = true): string => `$${digitsU(c * U_CENT, cents || c % 100 !== 0)}`;
/** cents -> TeX "\$64.80" */
export const usdTex = (c: number, cents = true): string => `\\$${digitsU(c * U_CENT, cents || c % 100 !== 0).replace(',', '{,}')}`;
/** units -> "$0.735" / TeX */
export const usdU = (u: number): string => `$${digitsU(u, true)}`;
export const usdUTex = (u: number): string => `\\$${digitsU(u, true).replace(',', '{,}')}`;
/** a rate in milli-percent -> "8", "8.25", "8.875", "0.5" */
export function pct(rateM: number): string {
  const w = Math.floor(rateM / 1000), r = rateM % 1000;
  if (!r) return String(w);
  return `${w}.${String(r).padStart(3, '0').replace(/0+$/, '')}`;
}
/** the decimal for a rate: 8000 -> "0.08", 8250 -> "0.0825", 500 -> "0.005", 100000 -> "1" */
export function rateDec(rateM: number): string { return decOf(rateM, 5); }
/** the total multiplier 1 + r: 8000 -> "1.08", 7500 -> "1.075" */
export function multDec(rateM: number): string { return decOf(M_WHOLE + rateM, 5); }
/** n / 10^places as a decimal string */
export function decOf(n: number, places: number): string {
  const s = String(Math.abs(n)).padStart(places + 1, '0');
  const w = s.slice(0, s.length - places), f = s.slice(s.length - places).replace(/0+$/, '');
  return (n < 0 ? '-' : '') + (f ? `${w}.${f}` : w);
}
/** the value of a decimal string as an exact rational [n, 10^k] (for typed decimals) */
export function decValue(s: string): [number, number] {
  const [w, f = ''] = s.split('.');
  return [Number((w ?? '0') + f), 10 ** f.length];
}
