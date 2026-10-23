// rq.ts: exact signed rationals for "multiply and divide rational numbers" (pure, no DOM): a number in a FORM
// (integer, fraction, mixed number, decimal), its HTML (a real minus sign, negatives in parentheses after an operator)
// and TeX, repeating decimals, and reading a kid's typed answer (a number box, or the fraction boxes with a minus
// sign in any box).
import { type Q, rat, qAdd, qMul, qDiv, qNum } from '../../../core/math';
import { type Response, fr } from '../../runtime/item';

export type Form = 'int' | 'frac' | 'mixed' | 'dec';
export const q = (p: number, d = 1): Q => rat(p, d);
/** a terminating decimal (up to thousandths) as an exact fraction */
export function dq(x: number): Q {
  const p = Math.round(x * 1000);
  if (Math.abs(p / 1000 - x) > 1e-9) throw new RangeError(`not a decimal to thousandths: ${x}`);
  return rat(p, 1000);
}
export const qNeg = (a: Q): Q => rat(-a.p, a.q);
export const qAbs = (a: Q): Q => rat(Math.abs(a.p), a.q);
export const qSub = (a: Q, b: Q): Q => qAdd(a, qNeg(b));
export const qSame = (a: Q, b: Q): boolean => a.p === b.p && a.q === b.q;
export const sgn = (a: Q): number => Math.sign(a.p);
export const val = (a: Q): number => qNum(a);
export { qAdd, qMul, qDiv };
/** a^n for a whole-number exponent */
export function qPow(a: Q, n: number): Q { let r = rat(1); for (let i = 0; i < n; i++) r = qMul(r, a); return r; }

/** decimal places a fraction needs to terminate (null when it does not terminate within `max` places) */
export function places(a: Q, max = 4): number | null { for (let k = 0; k <= max; k++) if ((a.p * 10 ** k) % a.q === 0) return k; return null; }
export const isDec = (a: Q, max = 4): boolean => places(a, max) !== null;
/** the unsigned digits of a terminating decimal */
function decDigits(a: Q): string {
  const k = places(a);
  if (k === null) throw new RangeError(`${a.p}/${a.q} does not terminate`);
  const s = String(Math.round(Math.abs(a.p) * 10 ** k / a.q)).padStart(k + 1, '0');
  return k ? `${s.slice(0, s.length - k)}.${s.slice(s.length - k)}` : s;
}
/** a repeating decimal: the digits before the repeat and the repeating block (long division, remainders tracked) */
export function expand(a: Q): { int: string; pre: string; rep: string } {
  const P = Math.abs(a.p), D = a.q;
  const int = String(Math.floor(P / D));
  let r = P % D;
  const seen = new Map<number, number>();
  let digits = '';
  while (r !== 0 && !seen.has(r)) { seen.set(r, digits.length); r *= 10; digits += String(Math.floor(r / D)); r %= D; }
  if (r === 0) return { int, pre: digits, rep: '' };
  const at = seen.get(r)!;
  return { int, pre: digits.slice(0, at), rep: digits.slice(at) };
}

const MINUS = '−';   // the real minus sign (not &minus;): the steps card reads the answer out of the text

/** the number in its form, HTML, with a real minus sign */
export function hq(a: Q, form: Form = a.q === 1 ? 'int' : 'frac'): string {
  const m = a.p < 0 ? MINUS : '';
  if (a.q === 1) return `${m}${Math.abs(a.p)}`;
  if (form === 'dec' && isDec(a)) return `${m}${decDigits(a)}`;
  if (form === 'dec') { const e = expand(a); return `${m}${e.int}.${e.pre}<span class="rep">${e.rep}</span>`; }
  const P = Math.abs(a.p);
  if (form === 'mixed' && P > a.q) return `${m}${Math.floor(P / a.q)}&#8202;${fr(P % a.q, a.q)}`;
  return `${m}${fr(P, a.q)}`;
}
/** the same in TeX */
export function tq(a: Q, form: Form = a.q === 1 ? 'int' : 'frac', big = false): string {
  const m = a.p < 0 ? '-' : '';
  const F = big ? '\\frac' : '\\tfrac';
  if (a.q === 1) return `${m}${Math.abs(a.p)}`;
  if (form === 'dec' && isDec(a)) return `${m}${decDigits(a)}`;
  if (form === 'dec') { const e = expand(a); return `${m}${e.int}.${e.pre}\\overline{${e.rep}}`; }
  const P = Math.abs(a.p);
  if (form === 'mixed' && P > a.q) return `${m}${Math.floor(P / a.q)}${F}{${P % a.q}}{${a.q}}`;
  return `${m}${F}{${P}}{${a.q}}`;
}
/** after an operator: negatives in parentheses */
export const hp = (a: Q, form?: Form): string => (a.p < 0 ? `(${hq(a, form)})` : hq(a, form));
export const tp = (a: Q, form?: Form, big = false): string => (a.p < 0 ? `(${tq(a, form, big)})` : tq(a, form, big));
/** plain decimal text (tests, logs) */
export const dstr = (a: Q): string => (a.p < 0 ? '-' : '') + decDigits(a);
/** an amount with a unit: "+12 ft", "−3 °F", "−$7.50" */
export function withUnit(a: Q, unit: string, signed = true): string {
  const s = a.p < 0 ? '−' : signed && a.p > 0 ? '+' : '';
  const dig = unit === '$' ? Math.abs(qNum(a)).toFixed(a.q === 1 ? 0 : 2) : isDec(a) ? decDigits(a) : `${Math.abs(a.p)}/${a.q}`;
  if (unit === '$') return `${s}$${dig}`;
  return `${s}${dig}${unit ? ' ' + unit : ''}`;
}

// ---------- reading answers ----------
/** the value of a typed response: a number box, or [whole] numerator / denominator with a minus in any box */
export function readQ(r: Response): Q | null {
  if (r.kind === 'num') {
    if (!Number.isFinite(r.v)) return null;
    const p = Math.round(r.v * 1e6);
    if (Math.abs(p / 1e6 - r.v) > 1e-9) return null;
    return rat(p, 1e6);
  }
  if (r.kind === 'frac') {
    const { w, n, d } = r;
    if (![w, n, d].every(Number.isInteger) || d === 0) return null;
    const negs = [w, n, d].filter(x => x < 0).length;
    const mag = qAdd(rat(Math.abs(w)), rat(Math.abs(n), Math.abs(d)));
    return negs % 2 ? qNeg(mag) : mag;
  }
  return null;
}
/** a right response for the tests and the walk script */
export function respond(a: Q, input: 'num' | 'frac'): Response {
  if (input === 'num') return { kind: 'num', v: qNum(a) };
  return { kind: 'frac', w: 0, n: a.p, d: a.q };
}
