// realMaths.ts: exact real numbers for "rational and irrational numbers" (grade 8, 8.NS.A.1-2). Pure, no floats in
// any decision: a number is a fraction p/q, a signed square root ±sqrt(a/b), or pi, and every digit, bound, rounding
// and comparison is computed with BigInt (floor(x * 10^L) exactly). Floats are only used for drawing positions.
//   floorScaled(x, L)   floor(x * 10^L): the decimal address of x to L places (the left end of its 10^-L interval)
//   exactAt(x, L)       x * 10^L is a whole number (x sits ON a tick of that level)
//   roundTo(x, L)       x rounded to L places (half away from zero)
//   repToFrac(r)        an eventually repeating decimal as a reduced fraction (shift and subtract, done exactly)
//   longDivision(p, q)  the digits and remainders of p / q until a remainder repeats (or 0)

export type Real =
  | { kind: 'frac'; p: number; q: number }
  | { kind: 'sqrt'; a: number; b: number; sign: 1 | -1 }
  | { kind: 'pi' };

export const gcd = (a: number, b: number): number => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
export const frac = (p: number, q = 1): Real => {
  if (!Number.isInteger(p) || !Number.isInteger(q) || q === 0) throw new Error(`frac ${p}/${q}`);
  const s = q < 0 ? -1 : 1, g = gcd(p, q) || 1;
  return { kind: 'frac', p: (s * p) / g, q: (s * q) / g };
};
export const sqrt = (a: number, b = 1, sign: 1 | -1 = 1): Real => {
  if (!Number.isInteger(a) || !Number.isInteger(b) || a < 0 || b <= 0) throw new Error(`sqrt ${a}/${b}`);
  return { kind: 'sqrt', a, b, sign };
};
export const PI: Real = { kind: 'pi' };
/** pi to 50 places (the digits are a known fact here, not computed) */
export const PI_DIGITS = '314159265358979323846264338327950288419716939937510';

const B = BigInt;
const P10 = (L: number): bigint => 10n ** B(L);
export function isqrtBig(n: bigint): bigint {
  if (n < 0n) throw new Error('isqrt of a negative');
  if (n < 2n) return n;
  let x = n, y = (x + 1n) / 2n;
  while (y < x) { x = y; y = (x + n / x) / 2n; }
  return x;
}
export const isqrt = (n: number): number => Number(isqrtBig(B(n)));
export const isSquare = (n: number): boolean => Number.isInteger(n) && n >= 0 && isqrt(n) ** 2 === n;
/** floor division for BigInt (rounds toward minus infinity) */
export function fdiv(a: bigint, b: bigint): bigint {
  const q = a / b;
  return a % b !== 0n && (a < 0n) !== (b < 0n) ? q - 1n : q;
}

/** a square root that is rational, as a fraction (else null): sqrt(a/b) in lowest terms needs both a and b square */
export function sqrtAsFrac(x: Extract<Real, { kind: 'sqrt' }>): Real | null {
  const g = gcd(x.a, x.b) || 1, a = x.a / g, b = x.b / g;
  if (x.a === 0) return frac(0);
  return isSquare(a) && isSquare(b) ? frac(x.sign * isqrt(a), isqrt(b)) : null;
}
export const isRational = (x: Real): boolean => x.kind === 'frac' || (x.kind === 'sqrt' && sqrtAsFrac(x) !== null);
/** the same value, in its simplest kind (a rational root becomes a fraction) */
export function norm(x: Real): Real { if (x.kind === 'sqrt') return sqrtAsFrac(x) ?? x; return x; }
export const neg = (x: Real): Real => {
  if (x.kind === 'frac') return frac(-x.p, x.q);
  if (x.kind === 'sqrt') return { ...x, sign: x.sign === 1 ? -1 : 1 };
  throw new Error('-pi is not used in this topic');
};
export const sign = (x: Real): number => (x.kind === 'frac' ? Math.sign(x.p) : x.kind === 'sqrt' ? (x.a === 0 ? 0 : x.sign) : 1);
/** a float, for drawing positions only */
export const approx = (x: Real): number => (x.kind === 'frac' ? x.p / x.q : x.kind === 'sqrt' ? x.sign * Math.sqrt(x.a / x.b) : Math.PI);

/** floor(x * 10^L), exactly */
export function floorScaled(x: Real, L: number): bigint {
  if (!Number.isInteger(L) || L < 0 || L > 40) throw new Error(`places ${L}`);
  if (x.kind === 'frac') return fdiv(B(x.p) * P10(L), B(x.q));
  if (x.kind === 'pi') return B(PI_DIGITS.slice(0, L + 1));
  const N = B(x.a) * P10(2 * L), D = B(x.b);
  const r = isqrtBig(N / D);
  if (x.sign === 1) return r;
  return exactAt(x, L) ? -r : -r - 1n;
}
/** x * 10^L is a whole number */
export function exactAt(x: Real, L: number): boolean {
  if (x.kind === 'frac') return (B(x.p) * P10(L)) % B(x.q) === 0n;
  if (x.kind === 'pi') return false;
  const N = B(x.a) * P10(2 * L), D = B(x.b);
  if (N % D !== 0n) return false;
  const r = isqrtBig(N / D);
  return r * r === N / D;
}
/** compare x with a / 10^L: -1, 0 or 1 */
export function cmpDec(x: Real, a: bigint, L: number): -1 | 0 | 1 {
  const F = floorScaled(x, L);
  if (F < a) return -1;
  if (F > a) return 1;
  return exactAt(x, L) ? 0 : 1;
}
/** compare two reals exactly (rationals by cross-multiplying; otherwise refine until the addresses differ) */
export function cmpReal(x: Real, y: Real): -1 | 0 | 1 {
  const X = norm(x), Y = norm(y);
  if (X.kind === 'frac' && Y.kind === 'frac') { const d = X.p * Y.q - Y.p * X.q; return d < 0 ? -1 : d > 0 ? 1 : 0; }
  if (X.kind === 'sqrt' && Y.kind === 'sqrt' && X.sign === Y.sign && X.a * Y.b === Y.a * X.b) return 0;
  for (let L = 0; L <= 36; L++) {
    const a = floorScaled(X, L), b = floorScaled(Y, L);
    if (a !== b) return a < b ? -1 : 1;
  }
  throw new Error('cmpReal: the two numbers agree to 36 places');
}
/** x rounded to L places, half away from zero (as a / 10^L) */
export function roundTo(x: Real, L: number): bigint {
  if (sign(x) < 0) return -roundTo(neg(x), L);
  return fdiv(floorScaled(x, L + 1) + 5n, 10n);
}
/** a / 10^L as a decimal string with exactly L places ("-4.50"), or trimmed of trailing zeros */
export function decStr(a: bigint, L: number, trim = false): string {
  const s = a < 0n ? '-' : '', m = a < 0n ? -a : a;
  if (L === 0) return s + m.toString();
  const t = m.toString().padStart(L + 1, '0');
  let f = t.slice(-L);
  if (trim) f = f.replace(/0+$/, '');
  return s + t.slice(0, -L) + (f ? '.' + f : '');
}
/** the first L decimal places of x, cut off (truncated toward zero), as a string: digits(sqrt2, 3) = "1.414" */
export function digits(x: Real, L: number): string {
  const s = sign(x) < 0;
  return (s ? '-' : '') + decStr(floorScaled(s ? neg(x) : x, L), L);
}
/** a decimal string ("1.414", "-0.75") as [a, L] with value a / 10^L */
export function parseDec(s: string): [bigint, number] {
  const m = /^(-?)(\d+)(?:\.(\d+))?$/.exec(s.trim());
  if (!m) throw new Error(`not a decimal: ${s}`);
  const f = m[3] ?? '';
  return [B((m[1] ? '-' : '') + m[2] + f), f.length];
}
/** a typed number (float from the input) as a / 10^L with at most `maxL` places, or null if it has more */
export function fromTyped(v: number, maxL = 6): [bigint, number] | null {
  if (!Number.isFinite(v)) return null;
  for (let L = 0; L <= maxL; L++) {
    const a = Math.round(v * 10 ** L);
    if (Math.abs(a / 10 ** L - v) < 1e-9 * Math.max(1, Math.abs(v))) return [B(a), L];
  }
  return null;
}
/** two decimals equal as values: a/10^L == b/10^M */
export const decEq = (a: bigint, L: number, b: bigint, M: number): boolean => a * P10(M) === b * P10(L);
/** a typed float equals the decimal a / 10^L exactly */
export function typedIs(v: number, a: bigint, L: number): boolean { const t = fromTyped(v, 8); return !!t && decEq(t[0], t[1], a, L); }

// ---------- repeating decimals ----------
/** int.pre rep rep rep ... (rep non-empty) */
export interface Rep { int: number; pre: string; rep: string }
export function repToFrac(r: Rep): [number, number] {
  const p = r.pre.length, k = r.rep.length;
  const N = B(r.pre + r.rep), M = r.pre ? B(r.pre) : 0n;
  const den = P10(p) * (P10(k) - 1n);
  let num = N - M + B(r.int) * den;
  let a = num, b = den;
  while (b) [a, b] = [b, a % b];
  num /= a;
  const d = den / a;
  if (num > B(Number.MAX_SAFE_INTEGER) || d > B(Number.MAX_SAFE_INTEGER)) throw new Error('repToFrac: too big');
  return [Number(num), Number(d)];
}
/** n digits after the point of int.pre(rep)... */
export function repDigits(r: Rep, n: number): string {
  let s = r.pre;
  while (s.length < n) s += r.rep;
  return s.slice(0, n);
}
export interface DivStep { r: number; digit: number; next: number }
/** long division of p / q (0 <= p, q > 0) after the decimal point: steps until the remainder is 0 or repeats */
export function longDivision(p: number, q: number, max = 40): { int: number; steps: DivStep[]; pre: number; period: number } {
  if (!Number.isInteger(p) || !Number.isInteger(q) || p < 0 || q <= 0) throw new Error(`longDivision ${p}/${q}`);
  const int = Math.floor(p / q);
  let r = p % q;
  const seen = new Map<number, number>();
  const steps: DivStep[] = [];
  while (r !== 0 && !seen.has(r) && steps.length < max) {
    seen.set(r, steps.length);
    const digit = Math.floor((r * 10) / q), next = (r * 10) % q;
    steps.push({ r, digit, next });
    r = next;
  }
  if (r === 0) return { int, steps, pre: steps.length, period: 0 };
  const start = seen.get(r);
  if (start === undefined) throw new Error('longDivision: no cycle within max steps');
  return { int, steps, pre: start, period: steps.length - start };
}
/** p / q as an eventually repeating decimal (period 0 = terminating, rep '' ) */
export function fracToRep(p: number, q: number): Rep & { terminates: boolean } {
  const d = longDivision(p, q);
  const ds = d.steps.map(s => String(s.digit)).join('');
  return { int: d.int, pre: ds.slice(0, d.pre), rep: ds.slice(d.pre), terminates: d.period === 0 };
}

// ---------- TeX / HTML of numbers ----------
/** TeX of a decimal string with a real minus */
export const decTex = (s: string): string => s.replace(/^-/, '-');
/** TeX of a repeating decimal with a bar over the block: 0.1\\overline{6} */
export const repTex = (r: Rep): string => `${r.int}.${r.pre}\\overline{${r.rep}}`;
/** the same written out with dots: 0.16666\\ldots */
export const repDotsTex = (r: Rep, n = 6): string => `${r.int}.${repDigits(r, Math.max(n, r.pre.length + 2 * r.rep.length))}{\\ldots}`;
