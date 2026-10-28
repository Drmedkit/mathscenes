// normMaths.ts: the exact maths of "The normal distribution". Pure: no DOM (tests and generators import it).
// Conventions the lesson states to the student wherever they matter:
//   N(mu, sigma)   the second number is the standard deviation (never the variance)
//   table method   z = (x - mu) / sigma rounded to 2 decimal places, then the cumulative-left table (area to the LEFT
//                  of z, 4 decimal places); right tails, betweens and outsides are built from table values
//   calculator     normalcdf with the raw values (no rounding until the end), area rounded to 4 decimal places
//   benchmarks     the 68-95-99.7 rule is approximate: "about" 68%, 95%, 99.7% within 1, 2, 3 SD of the mean
// Generators avoid .x5 ties: a z whose third decimal sits on a tie, a table area whose fifth decimal is a tie, a count
// N x area that ends in .5 and an x-cutoff that ends in a rounding tie are all rejected (retried).

/** round away float noise */
export const r9 = (v: number): number => Math.round(v * 1e9) / 1e9;
export const roundTo = (v: number, d: number): number => r9(Math.round(r9(v * 10 ** d)) / 10 ** d);

/** the standard normal density */
export const phi = (z: number): number => Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI);
/** the standard normal cumulative area Phi(z) (Marsaglia's series: about 15 correct digits for |z| < 8) */
export function Phi(z: number): number {
  if (z < -8) return 0;
  if (z > 8) return 1;
  let s = z, t = z;
  const q = z * z;
  for (let i = 3; i < 400; i += 2) { t = (t * q) / i; s += t; if (Math.abs(t) < 1e-18) break; }
  return 0.5 + s * phi(z);
}
/** a normal density N(m, s) */
export const dnorm = (x: number, m: number, s: number): number => phi((x - m) / s) / s;
/** the exact cumulative area P(X < x) for N(m, s) */
export const pnorm = (x: number, m: number, s: number): number => Phi((x - m) / s);
/** normalcdf(lo, hi, m, s) exactly */
export const normalcdf = (lo: number, hi: number, m: number, s: number): number => pnorm(hi, m, s) - pnorm(lo, m, s);

/** distance of a value's (d+1)-th decimal from a rounding tie (0.5): small = dangerous */
export function tieGap(v: number, d: number): number { const s = Math.abs(v) * 10 ** d, f = s - Math.floor(s); return Math.abs(f - 0.5); }
/** v rounded to d places is safe (not within `eps` of a .x5 tie, in units of the next place) */
export const safeRound = (v: number, d: number, eps = 0.02): boolean => tieGap(v, d) > eps;

/** z = (x - mu) / sigma, exact */
export const zOf = (x: number, m: number, s: number): number => r9((x - m) / s);
/** z rounded to 2 places (the table method) */
export const z2 = (x: number, m: number, s: number): number => roundTo((x - m) / s, 2);
/** the table entry: Phi(z) for a 2-decimal z, rounded to 4 places */
export const tableArea = (z: number): number => roundTo(Phi(roundTo(z, 2)), 4);
/** a table entry is safe when its 5th decimal is no tie */
export const tableSafe = (z: number): boolean => safeRound(Phi(roundTo(z, 2)), 4, 0.03);

/** rows of a z-table excerpt around the needed z values (sorted, unique), each [z, area left] */
export function tableRows(zs: readonly number[], extra: readonly number[] = []): [number, number][] {
  const set = new Set<number>();
  for (const z of zs) { set.add(roundTo(z - 0.01, 2)); set.add(roundTo(z, 2)); set.add(roundTo(z + 0.01, 2)); }
  for (const z of extra) set.add(roundTo(z, 2));
  return [...set].filter(z => z >= -3.49 && z <= 3.49).sort((a, b) => a - b).map(z => [z, tableArea(z)]);
}
let TABLE: number[] | null = null;
/** the whole table, z = -3.49 .. 3.49 (index i <-> z = (i - 349) / 100) */
const table = (): number[] => (TABLE ??= Array.from({ length: 699 }, (_, i) => tableArea((i - 349) / 100)));
/** the table read backwards: the 2-decimal z whose table area is closest to p (ties: the smaller |z|) */
export function zForArea(p: number): number {
  const T = table();
  let best = 0, bd = Infinity;
  T.forEach((a, i) => {
    const z = (i - 349) / 100, d = Math.abs(a - p);
    if (d < bd - 1e-12 || (Math.abs(d - bd) < 1e-12 && Math.abs(z) < Math.abs(best))) { bd = d; best = z; }
  });
  return best;
}
/** the closest table area to p is unique and clearly closer than the next one (no ambiguous backwards read) */
export function zForAreaClear(p: number): boolean {
  const ds = table().map(a => Math.abs(a - p)).sort((a, b) => a - b);
  return ds[1]! - ds[0]! > 0.0003;
}

// ---------- the 68-95-99.7 benchmarks (percent) ----------
/** the central percent within k SD (k = 1, 2, 3) */
export const CENTRAL: Record<number, number> = { 1: 68, 2: 95, 3: 99.7 };
/** the percent between mu and mu + k sigma (one side) */
export const HALF: Record<number, number> = { 1: 34, 2: 47.5, 3: 49.85 };
/** the one-sided band between a and b SD (0 <= a < b <= 3), from the benchmarks, in percent */
export const bandPct = (a: number, b: number): number => r9((b === 0 ? 0 : HALF[b]!) - (a === 0 ? 0 : HALF[a]!));
/** the benchmark percent of a whole-SD interval from mu + a sigma to mu + b sigma (a < b, both in -3..3, or +-Infinity) */
export function benchPct(a: number, b: number): number {
  const side = (k: number) => (k === Infinity ? 50 : k === -Infinity ? -50 : Math.sign(k) * (HALF[Math.abs(k)] ?? 0));
  return r9(side(b) - side(a));
}

// ---------- formatting ----------
/** a number with a real minus sign, at most d decimals, no float noise */
export function fmt(v: number, d = 4): string {
  const r = roundTo(v, d);
  const s = d > 0 ? Math.abs(r).toFixed(d).replace(/0+$/, '').replace(/\.$/, '') : Math.abs(r).toFixed(0);
  return (r < 0 && s !== '0' ? '−' : '') + s;
}
/** fixed decimals (0.1587, 1.20) */
export function fix(v: number, d: number): string { const r = roundTo(v, d); return (r < 0 ? '−' : '') + Math.abs(r).toFixed(d); }
/** TeX version (TeX minus) */
export const fmtT = (v: number, d = 4): string => fmt(v, d).replace('−', '-');
export const fixT = (v: number, d: number): string => fix(v, d).replace('−', '-');
/** a percent from a proportion, at most d decimals ("15.87") */
export const pct = (p: number, d = 2): string => fmt(p * 100, d);
