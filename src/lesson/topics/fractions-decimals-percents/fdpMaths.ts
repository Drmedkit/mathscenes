// fdpMaths.ts: the exact maths of "Convert fractions, decimals, and percents: extended" (grade 7, 7.NS.A.2.d).
// Everything is integers: a fraction p/q is divided by long division, one remainder at a time. The division STOPS when
// a remainder is 0 (terminating) or when a remainder comes back (repeating: the digits from that point on recur).
// A percent is the same division of 100 p by q (no float, no rounding anywhere unless a function says so).
// Pure: no DOM, no canvas.
import { gcd } from '../../runtime/item';

/** one line of the long division: x ÷ d = q remainder r (x = 10 × the previous remainder; row 0 is n ÷ d) */
export interface DivRow { x: number; q: number; r: number }
export interface LongDiv {
  n: number; d: number;
  /** the whole-number part (row 0's quotient) */ whole: number;
  /** rows[0] = n ÷ d, rows[i] = the step that makes fraction digit i */ rows: DivRow[];
  /** 'zero': a remainder reached 0 at row `at`; 'repeat': row `at` has the same remainder as row `from` */
  stop: 'zero' | 'repeat';
  at: number; from: number;
  /** the digits before the repeating block and the block itself ('' when it terminates) */
  pre: string; rep: string;
}

/** long division of n by d (n >= 0, d >= 1). `extra` computes that many more rows after the stop (a repeat only). */
export function longDivide(n: number, d: number, extra = 0): LongDiv {
  if (!Number.isInteger(n) || !Number.isInteger(d) || n < 0 || d < 1) throw new Error(`longDivide: ${n} / ${d} is not a nonnegative fraction`);
  const whole = Math.floor(n / d);
  let r = n % d;
  const rows: DivRow[] = [{ x: n, q: whole, r }];
  const seen = new Map<number, number>([[r, 0]]);
  let stop: 'zero' | 'repeat' = 'zero', at = 0, from = 0;
  if (r !== 0) {
    for (let i = 1; i <= d + 1; i++) {
      const x = 10 * r, q = Math.floor(x / d);
      r = x % d;
      rows.push({ x, q, r });
      if (r === 0) { stop = 'zero'; at = i; break; }
      const j = seen.get(r);
      if (j !== undefined) { stop = 'repeat'; at = i; from = j; break; }
      seen.set(r, i);
    }
  }
  const digits = rows.slice(1).map(w => w.q).join('');
  const pre = stop === 'zero' ? digits : digits.slice(0, from), rep = stop === 'zero' ? '' : digits.slice(from, at);
  if (stop === 'repeat') for (let e = 0; e < extra; e++) { const x = 10 * rows[rows.length - 1]!.r; rows.push({ x, q: Math.floor(x / d), r: x % d }); }
  return { n, d, whole, rows, stop, at, from, pre, rep };
}

/** a signed exact decimal: ±(whole + 0.pre rep rep rep ...) */
export interface Dec { neg: boolean; whole: number; pre: string; rep: string }
export function expand(p: number, q: number): Dec {
  if (q <= 0 || !Number.isInteger(p) || !Number.isInteger(q)) throw new Error(`expand: ${p}/${q}`);
  const L = longDivide(Math.abs(p), q);
  return { neg: p < 0, whole: L.whole, pre: L.pre, rep: L.rep };
}
/** the j-th digit after the point (1-based) of an expansion */
export function digitAt(e: Pick<Dec, 'pre' | 'rep'>, j: number): number {
  if (j <= e.pre.length) return Number(e.pre[j - 1]);
  if (!e.rep) return 0;
  return Number(e.rep[(j - e.pre.length - 1) % e.rep.length]);
}
/** the percent of p/q: the decimal of 100 p / q */
export const pctOf = (p: number, q: number): Dec => expand(100 * p, q);
export const terminates = (p: number, q: number): boolean => longDivide(Math.abs(p), q).stop === 'zero';

// ---------- writing an expansion ----------
const MINUS_T = '-', MINUS_H = '−';
/** TeX: 0.1\overline{6}, 31.\overline{81}, -1.6, 2 */
export function decTex(e: Dec): string {
  const f = e.pre + (e.rep ? `\\overline{${e.rep}}` : '');
  return `${e.neg ? MINUS_T : ''}${e.whole}${f ? '.' + f : ''}`;
}
/** HTML: the repeating block under a bar (.rep { text-decoration: overline }) */
export function decHtml(e: Dec): string {
  const f = e.pre + (e.rep ? `<span class="rep">${e.rep}</span>` : '');
  return `${e.neg ? MINUS_H : ''}${e.whole}${f ? '.' + f : ''}`;
}
/** written out with n digits after the point and "…" when it goes on: 0.16666… */
export function decLong(e: Dec, n: number, html = true): string {
  let s = '';
  for (let j = 1; j <= n; j++) s += digitAt(e, j);
  return `${e.neg ? (html ? MINUS_H : '-') : ''}${e.whole}.${s}${e.rep ? '…' : ''}`;
}
/** speakable: "zero point one six repeating" is written by the script, not here */

// ---------- finite decimals as integers: v = N / 10^k ----------
export interface Fin { N: number; k: number }
/** "0.0375" for {N: 375, k: 4}; negative N gives a minus sign (HTML minus when html) */
export function finStr(f: Fin, html = false): string {
  const neg = f.N < 0, a = Math.abs(f.N);
  const s = String(a).padStart(f.k + 1, '0');
  const body = f.k === 0 ? s : `${s.slice(0, s.length - f.k)}.${s.slice(s.length - f.k)}`;
  return (neg ? (html ? MINUS_H : '-') : '') + body;
}
/** the same finite decimal without trailing zeros */
export function finTrim(f: Fin): Fin {
  let { N, k } = f;
  while (k > 0 && N % 10 === 0) { N /= 10; k--; }
  return { N, k };
}
/** a typed number equals N / 10^k exactly (to rounding noise of the float) */
export function isFin(v: number, f: Fin): boolean {
  if (!Number.isFinite(v)) return false;
  const s = v * 10 ** f.k;
  return Math.abs(s - f.N) < 1e-6 * Math.max(1, Math.abs(f.N));
}
/** a finite decimal as a reduced fraction */
export function finFrac(f: Fin): [number, number] { const den = 10 ** f.k, g = gcd(f.N, den); return [f.N / g, den / g]; }
/** p/q as a finite decimal, or null when it repeats */
export function fracFin(p: number, q: number): Fin | null {
  const e = expand(p, q);
  if (e.rep) return null;
  const k = e.pre.length, N = (e.whole * 10 ** k + (k ? Number(e.pre) : 0)) * (e.neg ? -1 : 1);
  return { N, k };
}
/** compare a finite decimal with p/q exactly: -1, 0, 1 */
export function cmpFinFrac(f: Fin, p: number, q: number): number { const a = f.N * q, b = p * 10 ** f.k; return a < b ? -1 : a > b ? 1 : 0; }
/** p/q rounded (halves up, for nonnegative values) or truncated to k places */
export function roundFrac(p: number, q: number, k: number, mode: 'round' | 'trunc' = 'round'): Fin {
  const s = 10 ** k, num = p * s;
  const N = mode === 'trunc' ? Math.floor(num / q) : Math.floor((2 * num + q) / (2 * q));
  return { N, k };
}
/** an exact mixed number a b/c for p/q (p >= 0): [whole, num, den] with num/den reduced */
export function mixedOf(p: number, q: number): [number, number, number] {
  const w = Math.floor(p / q), r = p - w * q, g = gcd(r, q) || 1;
  return [w, r / g, q / g];
}
export const reduce = (p: number, q: number): [number, number] => { const g = gcd(p, q) || 1; return [p / g, q / g]; };
/** the prime factors of n other than 2 and 5 (empty: p/n in simplest form terminates) */
export function otherFactors(n: number): number[] {
  let m = n; const out: number[] = [];
  while (m % 2 === 0) m /= 2;
  while (m % 5 === 0) m /= 5;
  for (let f = 3; m > 1; f += 2) while (m % f === 0) { if (!out.includes(f)) out.push(f); m /= f; }
  return out;
}
