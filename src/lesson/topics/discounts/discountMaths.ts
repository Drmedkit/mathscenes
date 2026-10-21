// discountMaths.ts: the exact maths of a sale, pure (no DOM, no TeX), so the items, the PriceBar model and the tests
// share one source of truth. Every amount is an integer number of TICKS, 1 tick = $0.0001, so p% of a price in cents
// is exact: p% of 1599 cents = 1599 × p ticks (15% of $15.99 = 23985 ticks = $2.3985). No floating point anywhere.
//   original price = discount + sale price          (the sale partition, checked)
//   discount = p% of the original                   (the original price is the 100% whole)
//   sale price = (100 - p)% of the original          (the same bar: the parts you do not pay and the part you pay)
// Money policy of this course: keep exact intermediate values, round only the FINAL sale price to the nearest cent,
// halves up.
import { check } from '../../../blocks/block';

const NAME = 'Discount';
export const TICK = 10000;          // ticks per dollar
export const CENT = 100;            // ticks per cent

export interface Sale {
  /** original price, cents */ price: number;
  /** percent off (whole number 0..100), or null for a dollars-off sale */ pct: number | null;
  /** the exact amounts, ticks */ origT: number; discT: number; saleT: number;
  /** the sale price rounded to the cent under the policy (ticks) */ saleRT: number;
  /** percent paid (100 - p), or null */ paid: number | null;
  /** the discount's share of the bar, 0..1 */ frac: number;
}

/** a percent sale: p% off a price in cents */
export function percentSale(priceCents: number, pct: number): Sale {
  check(Number.isInteger(priceCents) && priceCents >= 1 && priceCents <= 100000, NAME, `the price ${priceCents}¢ must be a whole number of cents up to $1,000`);
  check(Number.isInteger(pct) && pct >= 0 && pct <= 100, NAME, `the discount ${pct}% must be a whole-number percent from 0 to 100`);
  const origT = priceCents * CENT, discT = priceCents * pct, saleT = origT - discT;
  check(discT + saleT === origT && saleT === priceCents * (100 - pct), NAME, 'the discount and the sale price must make the original price');
  return { price: priceCents, pct, origT, discT, saleT, saleRT: roundCent(saleT), paid: 100 - pct, frac: pct / 100 };
}
/** a dollars-off sale: offCents off a price in cents */
export function dollarSale(priceCents: number, offCents: number): Sale {
  check(Number.isInteger(priceCents) && priceCents >= 1 && priceCents <= 100000, NAME, `the price ${priceCents}¢ must be a whole number of cents`);
  check(Number.isInteger(offCents) && offCents >= 0 && offCents <= priceCents, NAME, `the discount ${offCents}¢ must be between $0 and the price`);
  const origT = priceCents * CENT, discT = offCents * CENT, saleT = origT - discT;
  return { price: priceCents, pct: null, origT, discT, saleT, saleRT: saleT, paid: null, frac: offCents / priceCents };
}

// ---------- rounding (ticks -> ticks) ----------
/** nearest cent, halves up (the course policy) */
export const roundCent = (t: number): number => Math.floor((t + CENT / 2) / CENT) * CENT;
/** cut off past the cent (the truncation slip) */
export const truncCent = (t: number): number => Math.floor(t / CENT) * CENT;
/** the sale price when the discount is rounded FIRST (a policy violation the course names) */
export const saleRoundingDiscountFirst = (s: Sale): number => s.origT - roundCent(s.discT);
/** a whole dollar */
export const isWholeDollar = (t: number): boolean => t % TICK === 0;

// ---------- reading a typed answer ----------
/** dollars typed by the kid -> ticks, or null when it is not a tick-exact number */
export function toTicks(v: number): number | null {
  if (!Number.isFinite(v)) return null;
  const t = Math.round(v * TICK);
  return Math.abs(v * TICK - t) < 1e-6 ? t : null;
}

// ---------- formatting ----------
/** the digits of an amount (no $): 80, 80.00, 15.75, 2.3985, 17.955. `cents` forces at least two decimals */
export function digits(t: number, cents = false): string {
  const neg = t < 0; t = Math.abs(t);
  const d = Math.floor(t / TICK), r = t % TICK;
  let s: string;
  if (r === 0) s = cents ? `${d}.00` : String(d);
  else {
    let f = String(r).padStart(4, '0');
    while (f.length > 2 && f.endsWith('0')) f = f.slice(0, -1);
    s = `${d}.${f}`;
  }
  return (neg ? '-' : '') + s.replace(/^(\d+)(\d{3})(\.|$)/, '$1,$2$3');
}
/** an amount for the page: $80, $15.75, $2.3985 */
export const usd = (t: number, cents = false): string => `$${digits(t, cents)}`;
/** an amount for TeX: \$80 (thousands with {,}) */
export const usdTex = (t: number, cents = false): string => `\\$${digits(t, cents).replace(',', '{,}')}`;
/** a percent as a decimal multiplier: 15 -> 0.15, 5 -> 0.05, 40 -> 0.4, 100 -> 1 */
export function mult(p: number): string {
  if (p % 100 === 0) return String(p / 100);
  const s = (p / 100).toFixed(2);
  return s.endsWith('0') ? s.slice(0, -1) : s;
}
/** spoken money for the narrator: 80 dollars, 15 dollars and 75 cents */
export function sayUsd(t: number): string {
  const d = Math.floor(t / TICK), c = Math.round((t % TICK) / CENT);
  if (c === 0) return `${d} dollar${d === 1 ? '' : 's'}`;
  return d ? `${d} dollars and ${c} cent${c === 1 ? '' : 's'}` : `${c} cents`;
}
