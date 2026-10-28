// stats.ts: the exact one-variable statistics of the lesson (and of later Statistics lessons). Pure: no DOM.
// Conventions (stated to the student wherever they matter):
//   median     the middle of the ORDERED list; even n: the mean of the two middle values
//   quartiles  the median of each half; odd n: the median is left out of both halves (the TI-84 method)
//   IQR        Q3 − Q1;  fences  Q1 − 1.5·IQR and Q3 + 1.5·IQR;  an outlier lies STRICTLY beyond a fence
//   modified box plot  whiskers end at the most extreme values that are not outliers; outliers are points
//   MAD        the mean of the distances |x − mean|
//   SD         σ (population, "σx" on the TI-84) unless a function says sample (Sx, divide by n − 1)
//   histogram  equal-width bins [start + k·w, start + (k + 1)·w): lower end in, upper end out
/** round away float noise (values here have at most a few decimals) */
export const r9 = (v: number): number => Math.round(v * 1e9) / 1e9;
export const sorted = (xs: readonly number[]): number[] => xs.slice().sort((a, b) => a - b);
export const sum = (xs: readonly number[]): number => r9(xs.reduce((s, x) => s + x, 0));
export const mean = (xs: readonly number[]): number => r9(sum(xs) / xs.length);

export function median(xs: readonly number[]): number {
  const s = sorted(xs), n = s.length;
  if (!n) return NaN;
  return n % 2 ? s[(n - 1) / 2]! : r9((s[n / 2 - 1]! + s[n / 2]!) / 2);
}
/** the lower and upper halves of the ordered list (odd n: the median is in neither) */
export function halves(xs: readonly number[]): [number[], number[]] {
  const s = sorted(xs), n = s.length, h = Math.floor(n / 2);
  return [s.slice(0, h), s.slice(n - h)];
}
export interface Five { min: number; q1: number; med: number; q3: number; max: number }
export function five(xs: readonly number[]): Five {
  const s = sorted(xs), [lo, hi] = halves(s);
  return { min: s[0]!, q1: median(lo), med: median(s), q3: median(hi), max: s[s.length - 1]! };
}
export const iqrOf = (f: Five): number => r9(f.q3 - f.q1);
export interface Fences { lo: number; hi: number; step: number }
export function fences(f: Five): Fences {
  const step = r9(1.5 * iqrOf(f));
  return { lo: r9(f.q1 - step), hi: r9(f.q3 + step), step };
}
export const isOutlier = (v: number, F: Fences): boolean => v < F.lo - 1e-9 || v > F.hi + 1e-9;
export function outliers(xs: readonly number[]): number[] {
  const F = fences(five(xs));
  return sorted(xs).filter(v => isOutlier(v, F));
}
/** the ends of the whiskers of the modified box plot (the most extreme values that are not outliers) */
export function whiskers(xs: readonly number[]): [number, number] {
  const F = fences(five(xs)), keep = sorted(xs).filter(v => !isOutlier(v, F));
  return [keep[0]!, keep[keep.length - 1]!];
}
export const range = (xs: readonly number[]): number => r9(Math.max(...xs) - Math.min(...xs));
export const deviations = (xs: readonly number[], m = mean(xs)): number[] => xs.map(x => r9(Math.abs(x - m)));
export const mad = (xs: readonly number[]): number => mean(deviations(xs));
export function sdPop(xs: readonly number[]): number {
  const m = sum(xs) / xs.length;
  return Math.sqrt(xs.reduce((s, x) => s + (x - m) ** 2, 0) / xs.length);
}
export function sdSample(xs: readonly number[]): number {
  const m = sum(xs) / xs.length;
  return Math.sqrt(xs.reduce((s, x) => s + (x - m) ** 2, 0) / (xs.length - 1));
}
/** the counts of equal-width bins [start + k·w, start + (k + 1)·w), k = 0 … nBins − 1 */
export function binCounts(xs: readonly number[], start: number, w: number, nBins: number): number[] {
  const c = new Array<number>(nBins).fill(0);
  for (const x of xs) {
    const k = Math.floor(r9((x - start) / w));
    if (k >= 0 && k < nBins) c[k]!++;
  }
  return c;
}
/** values sitting exactly on a bin edge */
export const onEdge = (xs: readonly number[], start: number, w: number): number[] => xs.filter(x => Math.abs(r9((x - start) / w) - Math.round(r9((x - start) / w))) < 1e-9);
export function weightedMean(vals: readonly number[], ws: readonly number[]): number {
  return r9(vals.reduce((s, v, i) => s + v * ws[i]!, 0) / ws.reduce((s, w) => s + w, 0));
}
/** the counts of each distinct value (dot-plot stacks) */
export function stacks(xs: readonly number[]): Map<number, number> {
  const m = new Map<number, number>();
  for (const x of xs) m.set(r9(x), (m.get(r9(x)) ?? 0) + 1);
  return m;
}
/** v rounded to `d` decimals, and whether the exact value sits on (or within 1e-6 of) a ...5 tie */
export function roundTo(v: number, d: number): { v: number; tie: boolean } {
  const s = v * 10 ** d, f = s - Math.floor(s);
  return { v: Math.round(s) / 10 ** d, tie: Math.abs(f - 0.5) < 1e-4 };
}
/** a number as text: up to 3 decimals, no float noise, a real minus sign */
export function fmt(v: number, d = 3): string {
  const r = Math.round(v * 10 ** d) / 10 ** d;
  const s = String(Math.abs(r));
  return (r < 0 ? '−' : '') + s;
}
/** the same for TeX (hyphen minus) */
export function fmtT(v: number, d = 3): string { return fmt(v, d).replace('−', '-'); }
