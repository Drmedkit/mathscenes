// ev.ts: the exact maths of "Probability distributions and expected value" (secondary-t8-19). Pure: no DOM.
// Probabilities are exact fractions [n, d] wherever the items state fractions, and integers over 100 / 1000 where they
// state decimals, so every table sums to exactly 1 and every E(X) is exact. Binomial, geometric and Poisson values are
// floats that the items round with a stated number of places (never at a rounding tie, see noTie in common.ts).

export type Q = [number, number];
export const gcd = (a: number, b: number): number => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
export const qr = (n: number, d: number): Q => { if (d < 0) { n = -n; d = -d; } const g = gcd(n, d) || 1; return [n / g, d / g]; };
export const qadd = (a: Q, b: Q): Q => qr(a[0] * b[1] + b[0] * a[1], a[1] * b[1]);
export const qsub = (a: Q, b: Q): Q => qr(a[0] * b[1] - b[0] * a[1], a[1] * b[1]);
export const qmul = (a: Q, b: Q): Q => qr(a[0] * b[0], a[1] * b[1]);
export const qsum = (xs: readonly Q[]): Q => xs.reduce((s, x) => qadd(s, x), [0, 1] as Q);
export const qv = (a: Q): number => a[0] / a[1];
export const qeq = (a: Q, b: Q): boolean => a[0] * b[1] === b[0] * a[1];

/** E(X) = sum of x * P(x), exact */
export const evQ = (xs: readonly number[], ps: readonly Q[]): Q => qsum(xs.map((x, i) => qmul([x, 1], ps[i]!)));
/** E(X) for probabilities given as integers over `den` (hundredths: den = 100), exact as [n, den] reduced */
export const evInt = (xs: readonly number[], ps: readonly number[], den: number): Q => qr(xs.reduce((s, x, i) => s + x * ps[i]!, 0), den);

// ---------- counting ----------
export function nCk(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
  return Math.round(r);
}
export const fact = (n: number): number => (n <= 1 ? 1 : n * fact(n - 1));

// ---------- the named models ----------
export function binomP(n: number, k: number, p: number): number {
  if (k < 0 || k > n) return 0;
  if (n <= 60) return nCk(n, k) * p ** k * (1 - p) ** (n - k);
  // large n: in logs (C(2500, 1250) overflows, 0.5^2500 underflows)
  const j = Math.min(k, n - k);
  let lc = 0;
  for (let i = 1; i <= j; i++) lc += Math.log((n - j + i) / i);
  return Math.exp(lc + k * Math.log(p) + (n - k) * Math.log(1 - p));
}
/** P(a <= X <= b) of a binomial count */
export function binomRange(n: number, p: number, a: number, b: number): number { let s = 0; for (let k = Math.max(0, a); k <= Math.min(n, b); k++) s += binomP(n, k, p); return s; }
/** first success on trial k (k = 1, 2, ...) */
export const geoP = (p: number, k: number): number => (1 - p) ** (k - 1) * p;
export const poisP = (lam: number, k: number): number => (Math.exp(-lam) * lam ** k) / fact(k);
export function poisCdf(lam: number, k: number): number { let s = 0; for (let i = 0; i <= k; i++) s += poisP(lam, i); return s; }
export const dnorm = (x: number, m: number, s: number): number => Math.exp(-0.5 * ((x - m) / s) ** 2) / (s * Math.sqrt(2 * Math.PI));

// ---------- totals of n plays ----------
/** every total that n plays of a variable with values xs can give */
export function possibleTotals(xs: readonly number[], n: number): Set<number> {
  let s = new Set<number>([0]);
  for (let i = 0; i < n; i++) { const t = new Set<number>(); for (const a of s) for (const x of xs) t.add(a + x); s = t; }
  return s;
}

// ---------- a simulation (running means of one unchanged game) ----------
/** plays a game N times with the seeded rng and returns the running mean after each checkpoint */
export function runningMeans(R: () => number, xs: readonly number[], ps: readonly number[], checkpoints: readonly number[]): number[] {
  const out: number[] = [];
  let sum = 0, n = 0;
  const N = Math.max(...checkpoints);
  const cps = new Set(checkpoints);
  while (n < N) {
    let u = R(), i = 0;
    while (i < ps.length - 1 && u >= ps[i]!) { u -= ps[i]!; i++; }
    sum += xs[i]!; n++;
    if (cps.has(n)) out.push(sum / n);
  }
  return out;
}
