// ff.ts: the exact-enough maths of "Linear, quadratic or exponential?" (no DOM). Tables are built in index space
// (row i = 0, 1, 2, ...; x = x0 + h·i), so a table is linear / quadratic / exponential in x exactly when it is in i.
// Values are cleaned with r9 (every table the lesson shows terminates in a few decimals, so the cleaned value is
// exact); the family tests compare cleaned values.
//   d1 / d2 / rts          first differences, second differences, ratios of neighbours (null where a denominator is 0)
//   classify(xs, ys)       'unequal' | 'linear' | 'quadratic' | 'exponential' | 'none' (the three tests in sequence)
//   FSpec / evalF          a parent function with a vertical stretch / reflection and a translation: y = a·g(x − h) + k
//   fH / fT                a function's rule as HTML / TeX
import { nH, nT, r9 } from '../exponential-functions/expo';

export { nH, nT, r9 };
export const eq = (a: number, b: number) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
export const d1 = (vs: readonly number[]): number[] => vs.slice(1).map((v, i) => r9(v - vs[i]!));
export const d2 = (vs: readonly number[]): number[] => d1(d1(vs));
export const rts = (vs: readonly number[]): (number | null)[] => vs.slice(1).map((v, i) => (vs[i] === 0 ? null : r9(v / vs[i]!)));
export const allEq = (vs: readonly (number | null)[]) => vs.length > 0 && vs.every(v => v !== null && eq(v, vs[0]!));

export type Fam = 'linear' | 'quadratic' | 'exponential' | 'none';
export type Verdict = Fam | 'unequal';
export const equalSteps = (xs: readonly number[]) => allEq(d1(xs));
/** the three tests in sequence (equally spaced inputs): constant 1st differences (a constant table too) = linear;
 *  constant NONZERO 2nd differences = quadratic; no zero outputs and a constant ratio r > 0, r ≠ 1 = exponential */
export function classify(xs: readonly number[], ys: readonly number[]): Verdict {
  if (!equalSteps(xs)) return 'unequal';
  return famOf(ys);
}
export function famOf(ys: readonly number[]): Fam {
  const D1 = d1(ys);
  if (allEq(D1)) return 'linear';
  const D2 = d1(D1);
  if (ys.length >= 4 && allEq(D2) && !eq(D2[0]!, 0)) return 'quadratic';
  const R = rts(ys);
  if (ys.length >= 3 && ys.every(v => v !== 0) && allEq(R) && R[0]! > 0 && !eq(R[0]!, 1)) return 'exponential';
  return 'none';
}
/** every family whose rule passes through ALL the points (a, b, c from the first rows, checked on the rest) */
export function fits(xs: readonly number[], ys: readonly number[]): Fam[] {
  const out: Fam[] = [];
  const n = xs.length;
  // linear through the first two
  const m = (ys[1]! - ys[0]!) / (xs[1]! - xs[0]!), c = ys[0]! - m * xs[0]!;
  if (xs.every((x, i) => eq(m * x + c, ys[i]!))) out.push('linear');
  // quadratic through the first three (a ≠ 0)
  if (n >= 3) {
    const [x0, x1, x2] = xs as [number, number, number], [y0, y1, y2] = ys as [number, number, number];
    const a = ((y2 - y1) / (x2 - x1) - (y1 - y0) / (x1 - x0)) / (x2 - x0);
    const b = (y1 - y0) / (x1 - x0) - a * (x0 + x1), cc = y0 - a * x0 * x0 - b * x0;
    if (Math.abs(a) > 1e-9 && xs.every((x, i) => eq(a * x * x + b * x + cc, ys[i]!))) out.push('quadratic');
  }
  // exponential a·b^x through the first two (same sign, b > 0, b ≠ 1)
  if (ys[0] !== 0 && ys[1] !== 0 && ys[0]! * ys[1]! > 0) {
    const b = (ys[1]! / ys[0]!) ** (1 / (xs[1]! - xs[0]!)), a = ys[0]! / b ** xs[0]!;
    if (!eq(b, 1) && xs.every((x, i) => eq(a * b ** x, ys[i]!))) out.push('exponential');
  }
  return out;
}

// ---------- tables in index space ----------
export const linSeq = (c: number, d: number, n: number) => Array.from({ length: n }, (_, i) => r9(c + d * i));
export const quadSeq = (p: number, q: number, r: number, n: number) => Array.from({ length: n }, (_, i) => r9(p * i * i + q * i + r));
export const expSeq = (a: number, b: number, n: number) => Array.from({ length: n }, (_, i) => r9(a * b ** i));
export const xsOf = (x0: number, h: number, n: number) => Array.from({ length: n }, (_, i) => r9(x0 + h * i));

// ---------- labels ----------
/** "+12", "−3.5", "+0" (a difference label) */
export const plusL = (d: number) => (r9(d) < 0 ? '−' : '+') + nH(Math.abs(d));
/** "×1.5", "÷0" when undefined */
export const timesL = (r: number | null, dec = 4) => (r === null ? 'undef.' : '×' + nH(Math.round(r * 10 ** dec) / 10 ** dec));
/** a list in HTML: 3, 6, 12, 24 */
export const listH = (vs: readonly number[]) => vs.map(v => nH(v)).join(', ');

// ---------- parent functions ----------
export type Parent = 'lin' | 'quad' | 'cube' | 'sqrt' | 'cbrt' | 'abs' | 'exp' | 'log' | 'recip';
/** y = a·g(x − h) + k; for 'exp' g(u) = b^u, for 'log' g(u) = log_b(u), for 'lin' g(u) = u */
export interface FSpec { p: Parent; a: number; h: number; k: number; b?: number }
export function evalF(s: FSpec, x: number): number {
  const u = x - s.h;
  let g: number;
  switch (s.p) {
    case 'lin': g = u; break;
    case 'quad': g = u * u; break;
    case 'cube': g = u * u * u; break;
    case 'sqrt': g = u < 0 ? NaN : Math.sqrt(u); break;
    case 'cbrt': g = Math.cbrt(u); break;
    case 'abs': g = Math.abs(u); break;
    case 'exp': g = (s.b ?? 2) ** u; break;
    case 'log': g = u <= 0 ? NaN : Math.log(u) / Math.log(s.b ?? 2); break;
    case 'recip': g = u === 0 ? NaN : 1 / u; break;
  }
  return s.a * g + s.k;
}
export const fnOf = (s: FSpec) => (x: number) => evalF(s, x);
export const PARENT_NAME: Record<Parent, string> = {
  lin: 'linear', quad: 'quadratic', cube: 'cubic', sqrt: 'square root', cbrt: 'cube root', abs: 'absolute value', exp: 'exponential',
  log: 'logarithmic', recip: 'rational (reciprocal)',
};
const X = '<i>x</i>';
/** "x − 3", "x + 2", "x" (HTML) */
const innerH = (h: number) => (h === 0 ? X : `${X} ${h > 0 ? '−' : '+'} ${nH(Math.abs(h))}`);
const innerT = (h: number) => (h === 0 ? 'x' : `x ${h > 0 ? '-' : '+'} ${nT(Math.abs(h))}`);
const coefH = (a: number) => (a === 1 ? '' : a === -1 ? '−' : nH(a));
const coefT = (a: number) => (a === 1 ? '' : a === -1 ? '-' : nT(a));
const tailH = (k: number) => (k === 0 ? '' : ` ${k > 0 ? '+' : '−'} ${nH(Math.abs(k))}`);
const tailT = (k: number) => (k === 0 ? '' : ` ${k > 0 ? '+' : '-'} ${nT(Math.abs(k))}`);
const baseH = (b: number) => (b === 0.5 ? '(1/2)' : nH(b));
const baseT = (b: number) => (b === 0.5 ? '\\left(\\tfrac{1}{2}\\right)' : nT(b));
/** the rule in HTML (multi-token exponents and radicands in brackets so the plain text keeps the grouping) */
export function fH(s: FSpec): string {
  const a = s.a, h = s.h, k = s.k, wrap = (t: string) => (h === 0 ? t : `(${t})`);
  switch (s.p) {
    case 'lin': {
      // a(x − h) + k written as mx + c
      const c = r9(k - a * h);
      return a === 0 ? nH(c) : `${coefH(a)}${X}${tailH(c)}`;
    }
    case 'quad': return `${coefH(a)}${wrap(innerH(h))}<sup>2</sup>${tailH(k)}`;
    case 'cube': return `${coefH(a)}${wrap(innerH(h))}<sup>3</sup>${tailH(k)}`;
    case 'sqrt': return `${coefH(a)}√(${innerH(h)})${tailH(k)}`;
    case 'cbrt': return `${coefH(a)}∛(${innerH(h)})${tailH(k)}`;
    case 'abs': return `${coefH(a)}|${innerH(h)}|${tailH(k)}`;
    case 'exp': { const e = h === 0 ? 'x' : `(${innerH(h).replace(/<\/?i>/g, '')})`; return `${a === 1 ? '' : a === -1 ? '−' : nH(a) + ' · '}${baseH(s.b ?? 2)}<sup>${e}</sup>${tailH(k)}`; }
    case 'log': return `${coefH(a)}log<sub>${nH(s.b ?? 2)}</sub>(${innerH(h)})${tailH(k)}`;
    case 'recip': return `${a === 1 ? '1' : a === -1 ? '−1' : nH(a)}/(${innerH(h)})${tailH(k)}`;
  }
}
export function fT(s: FSpec): string {
  const a = s.a, h = s.h, k = s.k, wrap = (t: string) => (h === 0 ? t : `(${t})`);
  switch (s.p) {
    case 'lin': { const c = r9(k - a * h); return a === 0 ? nT(c) : `${coefT(a)}x${tailT(c)}`; }
    case 'quad': return `${coefT(a)}${wrap(innerT(h))}^{2}${tailT(k)}`;
    case 'cube': return `${coefT(a)}${wrap(innerT(h))}^{3}${tailT(k)}`;
    case 'sqrt': return `${coefT(a)}\\sqrt{${innerT(h)}}${tailT(k)}`;
    case 'cbrt': return `${coefT(a)}\\sqrt[3]{${innerT(h)}}${tailT(k)}`;
    case 'abs': return `${coefT(a)}\\left|${innerT(h)}\\right|${tailT(k)}`;
    case 'exp': return `${a === 1 ? '' : a === -1 ? '-' : nT(a) + '\\cdot '}${baseT(s.b ?? 2)}^{${innerT(h)}}${tailT(k)}`;
    case 'log': return `${coefT(a)}\\log_{${nT(s.b ?? 2)}}(${innerT(h)})${tailT(k)}`;
    case 'recip': return `\\dfrac{${a === -1 ? '-1' : nT(a)}}{${innerT(h)}}${tailT(k)}`;
  }
}
