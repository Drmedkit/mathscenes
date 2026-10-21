// expo.ts: exact powers for "integer exponents" (pure, no DOM): a base is an exact rational, an exponent an integer;
// b^n is computed by repeated multiplication (never Math.pow) and 0 to a zero or negative power throws. Formatting in
// TeX (board) and HTML (panel, real minus signs, <sup> exponents), and reading a kid's answer (a number box with a
// decimal, or the fraction boxes with a minus sign in any box) as an exact rational.
import { type Q, rat } from '../../../core/math';
import { type Response, fr } from '../../runtime/item';

export const qOf = (p: number, q = 1): Q => rat(p, q);
export const qSame = (a: Q, b: Q): boolean => a.p === b.p && a.q === b.q;
export const qNeg = (a: Q): Q => rat(-a.p, a.q);
export const qInv = (a: Q): Q => { if (a.p === 0) throw new RangeError('1 / 0 has no value'); return rat(a.q, a.p); };
export const qTimes = (a: Q, b: Q): Q => rat(a.p * b.p, a.q * b.q);

/** b^n for an integer n: n factors of b (n > 0), the empty product 1 (n = 0), or 1 over -n factors (n < 0) */
export function qPow(b: Q, n: number): Q {
  if (!Number.isInteger(n)) throw new RangeError(`exponent ${n} is not an integer`);
  if (b.p === 0 && n <= 0) throw new RangeError(`0 to the power ${n} has no value`);
  let v = rat(1);
  for (let i = 0; i < Math.abs(n); i++) v = qTimes(v, b);
  return n < 0 ? qInv(v) : v;
}
export const isWhole = (b: Q) => b.q === 1;

// ---------- TeX ----------
/** a rational in TeX: 27, -8, \frac{1}{8}, -\frac{9}{4} */
export function vTex(v: Q): string {
  if (v.q === 1) return String(v.p);
  return `${v.p < 0 ? '-' : ''}\\frac{${Math.abs(v.p)}}{${v.q}}`;
}
/** a base in TeX, in parentheses when it is negative or a fraction (and always when `paren`) */
export function baseTex(b: Q): string {
  if (b.q === 1) return b.p < 0 ? `(${b.p})` : String(b.p);
  return `\\left(${vTex(b)}\\right)`;
}
export const expTex = (n: number | string) => `{${n}}`;
/** b^n in TeX */
export const powTex = (b: Q, n: number | string): string => `${baseTex(b)}^${expTex(n)}`;
/** a variable or a number to a power in TeX (x^{-2}); exponent 1 is not written */
export const varPow = (x: string, n: number): string => (n === 1 ? x : `${x}^{${n}}`);

// ---------- HTML (panel) ----------
export const minus = (s: string | number) => String(s).replace(/-/g, '−');
/** a rational in HTML: 27, −8, a stacked fraction with a real minus in front */
export function vHtml(v: Q): string {
  if (v.q === 1) return minus(v.p);
  return `${v.p < 0 ? '−' : ''}${fr(Math.abs(v.p), v.q)}`;
}
export function baseHtml(b: Q): string {
  if (b.q === 1) return b.p < 0 ? `(${minus(b.p)})` : String(b.p);
  return `(${vHtml(b)})`;
}
export const sup = (n: number | string) => `<sup>${minus(n)}</sup>`;
export const powHtml = (b: Q, n: number | string): string => `${baseHtml(b)}${sup(n)}`;
export const varHtml = (x: string, n: number): string => (n === 1 ? `<i>${x}</i>` : `<i>${x}</i>${sup(n)}`);
/** spoken / plain text of a rational: 1/8, -27 */
export const vPlain = (v: Q) => (v.q === 1 ? String(v.p) : `${v.p}/${v.q}`);
/** a terminating decimal string for v (null when it needs more than 8 places) */
export function decStr(v: Q): string | null {
  for (let k = 0; k <= 8; k++) {
    const t = v.p * 10 ** k;
    if (Number.isSafeInteger(t) && t % v.q === 0) {
      const n = Math.abs(t / v.q), s = String(n).padStart(k + 1, '0');
      return (v.p < 0 ? '−' : '') + (k ? `${s.slice(0, s.length - k)}.${s.slice(s.length - k)}` : s);
    }
  }
  return null;
}

// ---------- reading a kid's answer ----------
/** a decimal typed in a number box, as an exact rational (up to 8 places) */
export function numQ(v: number): Q | null {
  if (!Number.isFinite(v)) return null;
  for (let k = 0; k <= 8; k++) {
    const t = Math.round(v * 10 ** k);
    if (Math.abs(t / 10 ** k - v) < 1e-12 * Math.max(1, Math.abs(v))) return rat(t, 10 ** k);
  }
  return null;
}
/** the value of a response: a number box, or [whole] n / d with a minus sign in any box making it negative */
export function readQ(r: Response): Q | null {
  if (r.kind === 'num') return numQ(r.v);
  if (r.kind !== 'frac') return null;
  const { w, n, d } = r;
  if (![w, n, d].every(Number.isInteger) || d === 0) return null;
  const neg = w < 0 || n < 0 || d < 0;
  const v = rat(Math.abs(w) * Math.abs(d) + Math.abs(n), Math.abs(d));
  return neg ? qNeg(v) : v;
}
/** a response for a rational answer (tests and the item's own answer) */
export function respOf(v: Q, input: 'num' | 'frac'): Response {
  return input === 'num' ? { kind: 'num', v: v.p / v.q } : { kind: 'frac', w: 0, n: v.p, d: v.q };
}
