// samplingMaths.ts: the exact maths of random sampling and comparative inference, pure (no DOM, no canvas).
// Every number the lesson states is computed here, from SEEDED random draws (runtime/item.ts rng), so a frame, an
// item and a test always see the same samples:
//   population      N values on a grid (e.g. minutes in steps of 5), seeded, optionally nudged to an exact total
//   drawIdx         a random sample WITHOUT replacement (partial Fisher-Yates over the roster)
//   mean / median / quartiles / mad / iqr      summaries (quartiles = medians of the halves, the middle value left
//                   out when n is odd: the grade 6-7 convention)
//   repeatMeans     many equal-size random samples and their means (the simulation)
//   mostWithin      the smallest whole distance that holds 3 of every 4 sample means round the population mean
//   scaleWhole / scaleExact    a sample count a of n scaled to a population N (whole factor / any factor, rounded once)
//   pctCount        a percent of a population, rounded once
import { rng } from '../../runtime/item';
import { BlockError, check } from '../../../blocks/block';

const NAME = 'Sampling';
export type Rand = () => number;

export interface PopSpec {
  N: number; mu: number; sd: number; lo: number; hi: number;
  /** the value grid (5 = minutes in steps of 5) */
  step: number;
  seed: number;
  /** nudge the values (deterministically) until they add up to exactly this total */
  total?: number;
}
const snap = (x: number, s: number) => Math.round(x / s) * s;
/** a seeded population of N values on the grid `step` inside [lo, hi] (normal-ish shape) */
export function population(p: PopSpec): number[] {
  check(Number.isInteger(p.N) && p.N >= 2, NAME, `a population needs at least 2 members (got ${p.N})`);
  check(p.hi > p.lo && p.step > 0, NAME, 'the value range is empty');
  const R = rng(p.seed);
  const v: number[] = [];
  while (v.length < p.N) {
    const u1 = Math.max(1e-9, R()), u2 = R();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    v.push(Math.min(p.hi, Math.max(p.lo, snap(p.mu + p.sd * z, p.step))));
  }
  if (p.total !== undefined) {
    check(p.total % p.step === 0, NAME, `the total ${p.total} is not on the ${p.step} grid`);
    let s = sum(v), guard = 0;
    for (let i = 0; s !== p.total; i = (i + 7) % p.N) {
      if (++guard > 200000) throw new BlockError(NAME, `cannot reach the total ${p.total}`);
      if (s < p.total && v[i]! + p.step <= p.hi) { v[i] = v[i]! + p.step; s += p.step; }
      else if (s > p.total && v[i]! - p.step >= p.lo) { v[i] = v[i]! - p.step; s -= p.step; }
    }
  }
  return v;
}

/** n different roster positions, drawn at random (no one is drawn twice) */
export function drawIdx(R: Rand, N: number, n: number): number[] {
  check(Number.isInteger(n) && n >= 1 && n <= N, NAME, `cannot draw ${n} of ${N}`);
  const a = Array.from({ length: N }, (_, i) => i);
  for (let i = 0; i < n; i++) { const j = i + Math.floor(R() * (N - i)); [a[i], a[j]] = [a[j]!, a[i]!]; }
  return a.slice(0, n);
}

export const sum = (xs: readonly number[]) => xs.reduce((a, b) => a + b, 0);
export function mean(xs: readonly number[]): number { check(xs.length > 0, NAME, 'the mean of nothing'); return sum(xs) / xs.length; }
export function median(xs: readonly number[]): number {
  check(xs.length > 0, NAME, 'the median of nothing');
  const s = [...xs].sort((a, b) => a - b), m = s.length >> 1;
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
}
/** [Q1, Q3]: the medians of the lower and upper halves (the middle value is left out when n is odd) */
export function quartiles(xs: readonly number[]): [number, number] {
  check(xs.length >= 4, NAME, 'quartiles need at least 4 values');
  const s = [...xs].sort((a, b) => a - b), m = s.length >> 1;
  return [median(s.slice(0, m)), median(s.slice(s.length % 2 ? m + 1 : m))];
}
export const iqr = (xs: readonly number[]) => { const [a, b] = quartiles(xs); return b - a; };
/** mean absolute deviation: the mean distance of the values from their mean */
export function mad(xs: readonly number[]): number { const m = mean(xs); return mean(xs.map(x => Math.abs(x - m))); }
export const range = (xs: readonly number[]) => Math.max(...xs) - Math.min(...xs);

/** `reps` random samples of size n from the population (each without replacement) and their means */
export function repeatMeans(pop: readonly number[], n: number, reps: number, R: Rand): { idx: number[][]; means: number[] } {
  const idx: number[][] = [], means: number[] = [];
  for (let r = 0; r < reps; r++) { const I = drawIdx(R, pop.length, n); idx.push(I); means.push(mean(I.map(i => pop[i]!))); }
  return { idx, means };
}
/** how many values lie within d of mu (inclusive) */
export const within = (xs: readonly number[], mu: number, d: number) => xs.filter(x => Math.abs(x - mu) <= d + 1e-9).length;
/** the smallest whole d with at least `share` of the values within d of mu ("most land within d") */
export function mostWithin(xs: readonly number[], mu: number, share = 0.75): number {
  const need = Math.ceil(share * xs.length);
  for (let d = 0; d < 1000; d++) if (within(xs, mu, d) >= need) return d;
  throw new BlockError(NAME, 'no distance holds most of the values');
}
export const farthest = (xs: readonly number[], mu: number) => Math.max(...xs.map(x => Math.abs(x - mu)));

// ---------- proportions: a of n in the sample, scaled to N ----------
/** a whole population-to-sample factor: N = k n, estimate = k a */
export function scaleWhole(a: number, n: number, N: number): { k: number; est: number } {
  check(Number.isInteger(a) && Number.isInteger(n) && Number.isInteger(N) && a >= 0 && a <= n && n < N, NAME, `${a} of ${n} scaled to ${N} is not a sample result`);
  check(N % n === 0, NAME, `${N} is not a whole number of ${n}s`);
  return { k: N / n, est: (N / n) * a };
}
/** half up, for positive numbers given as an exact fraction p / q */
export const roundQ = (p: number, q: number) => Math.floor((2 * p + q) / (2 * q));
/** any factor: estimate = a N / n kept exact, rounded once at the end */
export function scaleExact(a: number, n: number, N: number): { p: number; q: number; value: number; rounded: number; half: boolean } {
  check(Number.isInteger(a) && Number.isInteger(n) && Number.isInteger(N) && a >= 0 && a <= n && n < N, NAME, `${a} of ${n} scaled to ${N} is not a sample result`);
  const p = a * N, q = n;
  return { p, q, value: p / q, rounded: roundQ(p, q), half: 2 * (p % q) === q };
}
/** the early-rounding slip: round the factor N / n to a whole number first, then multiply */
export const roundedFactorFirst = (a: number, n: number, N: number) => roundQ(N, n) * a;
/** percent p of N, rounded once (p may be a decimal percent such as 37.5) */
export function pctCount(p: number, N: number): number {
  const P = Math.round(p * 1000);   // thousandths of a percent, exact for the percents used here
  return roundQ(P * N, 100000);
}
/** a TeX-safe whole number with a thin-space-free comma (1,240) */
export const commas = (x: number) => (Math.abs(x) >= 1000 ? x.toLocaleString('en-US') : String(x));
/** a number with at most `dp` decimals, trailing zeros dropped (43.5, 41.25) */
export function dec(x: number, dp = 2): string {
  const s = x.toFixed(dp).replace(/\.?0+$/, '');
  return s === '-0' ? '0' : s;
}
