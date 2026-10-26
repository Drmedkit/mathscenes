// expo.ts: the exact-enough maths of exponential growth and decay (no DOM). Values a·b^t are computed in floating
// point and cleaned with r9 (every table the lesson shows is built from factors and starts that terminate in a few
// decimals, so the cleaned value is exact); rounding questions check that the exact value is not a .x5 tie.
//   pw(a, b, t)          a·b^t
//   ratios / diffs       consecutive ratios and differences of a list
//   kind(vals)           'linear' | 'exponential' | 'neither' for equally spaced outputs (exact test: cross products)
//   firstOver(...)       the first whole input where one model passes another
//   formatters           HTML numbers with thousands commas and a real minus, TeX numbers ({,} separators), money
export const r9 = (v: number): number => { const r = Math.round(v * 1e9) / 1e9; return Object.is(r, -0) ? 0 : r; };
export const pw = (a: number, b: number, t: number): number => r9(a * b ** t);
export const vals = (a: number, b: number, ts: readonly number[]): number[] => ts.map(t => pw(a, b, t));
export const ratios = (vs: readonly number[]): number[] => vs.slice(1).map((v, i) => r9(v / vs[i]!));
export const diffs = (vs: readonly number[]): number[] => vs.slice(1).map((v, i) => r9(v - vs[i]!));
const eq = (a: number, b: number) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
/** equally spaced outputs: constant differences = linear, constant ratios (exact: y1·y3 = y2²) = exponential */
export function kind(vs: readonly number[]): 'linear' | 'exponential' | 'neither' {
  const D = diffs(vs);
  if (D.every(d => eq(d, D[0]!))) return 'linear';
  if (vs.every(v => v !== 0) && vs.slice(2).every((v, i) => eq(vs[i]! * v, vs[i + 1]! ** 2))) return 'exponential';
  return 'neither';
}
/** the first whole t >= from where f(t) > g(t) (null if none up to max) */
export function firstOver(f: (t: number) => number, g: (t: number) => number, from = 0, max = 200): number | null {
  for (let t = from; t <= max; t++) if (f(t) > g(t) + 1e-9) return t;
  return null;
}
/** v rounded to d decimals */
export const rnd = (v: number, d: number): number => { const q = 10 ** d; return r9(Math.round(r9(v * q)) / q); };
/** true when v sits within 0.02 of a rounding tie at d decimals (…5 at the next place): such items are skipped */
export const nearTie = (v: number, d: number): boolean => { const s = Math.abs(v) * 10 ** d, f = s - Math.floor(s); return Math.abs(f - 0.5) < 0.02; };

// ---------- numbers ----------
function grp(s: string, sep: string): string { return s.replace(/\B(?=(\d{3})+(?!\d))/g, sep); }
/** HTML number: 24,000 / 1,464.1 / −3.5 (at most `dec` decimals, trailing zeros dropped; fixed when `fix`) */
export function nH(v: number, dec = 6, fix = false): string {
  const r = r9(v), a = Math.abs(r);
  let s = fix ? a.toFixed(dec) : String(r9(Math.round(a * 10 ** dec) / 10 ** dec));
  if (s.includes('e')) s = a.toFixed(dec);
  const [i, f] = s.split('.');
  return (r < 0 ? '−' : '') + grp(i!, ',') + (f ? '.' + f : '');
}
/** TeX number: 24{,}000, negative in braces */
export function nT(v: number, dec = 6, fix = false): string {
  const r = r9(v), a = Math.abs(r);
  let s = fix ? a.toFixed(dec) : String(r9(Math.round(a * 10 ** dec) / 10 ** dec));
  if (s.includes('e')) s = a.toFixed(dec);
  const [i, f] = s.split('.');
  const body = grp(i!, '{,}') + (f ? '.' + f : '');
  return r < 0 ? `{-${body}}` : body;
}
/** money: $1,331 or $1,464.10 (cents shown when not whole, or always with `cents`) */
export function usd(v: number, cents = false): string {
  const r = r9(v), a = Math.abs(r), whole = Math.abs(a - Math.round(a)) < 1e-9;
  return (r < 0 ? '−' : '') + '$' + (whole && !cents ? nH(a, 0) : nH(a, 2, true));
}
export function usdT(v: number, cents = false): string {
  const r = r9(v), a = Math.abs(r), whole = Math.abs(a - Math.round(a)) < 1e-9;
  return (r < 0 ? '-' : '') + '\\$' + (whole && !cents ? nT(a, 0) : nT(a, 2, true));
}
/** a percent from a rate: 0.05 → "5%", 0.025 → "2.5%" */
export const pct = (r: number): string => nH(r * 100, 4) + '%';
/** "×2", "×0.8" (a ratio label) */
export const times = (b: number, dec = 4): string => '×' + nH(b, dec);
/** "+100", "−20.5" (a difference label) */
export const plus = (d: number, dec = 4): string => (r9(d) < 0 ? '−' : '+') + nH(Math.abs(d), dec);
/** a factor in TeX: 0.5 or \frac{1}{2} when asked */
export const bT = (b: number, half = false): string => (half && b === 0.5 ? '\\left(\\tfrac{1}{2}\\right)' : `(${nT(b)})`);
