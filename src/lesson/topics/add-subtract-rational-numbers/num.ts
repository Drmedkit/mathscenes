// num.ts: exact signed rationals for this topic (pure, no DOM): numbers in a FORM (integer, fraction, mixed number,
// decimal), their TeX and HTML (real minus signs, negatives in parentheses after an operator), sums of signed terms,
// and reading a kid's typed answer (a number box, or the fraction boxes with a minus sign in any box).
import { type Q, rat, qAdd, qNum } from '../../../core/math';
import { type Response, fr } from '../../runtime/item';

export type Form = 'int' | 'frac' | 'mixed' | 'dec';
export interface Num { q: Q; form: Form }
export const N = (p: number, q = 1, form?: Form): Num => ({ q: rat(p, q), form: form ?? (q === 1 ? 'int' : 'frac') });
export const D = (x: number): Num => { const q = decQ(x); return { q, form: q.q === 1 ? 'int' : 'dec' }; };
/** a terminating decimal as an exact fraction (up to thousandths) */
export function decQ(x: number): Q { const p = Math.round(x * 1000); if (Math.abs(p / 1000 - x) > 1e-9) throw new RangeError(`not a decimal to thousandths: ${x}`); return rat(p, 1000); }
export const neg = (a: Num): Num => ({ q: rat(-a.q.p, a.q.q), form: a.form });
export const abs = (a: Num): Num => ({ q: rat(Math.abs(a.q.p), a.q.q), form: a.form });
export const val = (a: Num) => qNum(a.q);
export const sgn = (a: Num | Q) => { const p = 'p' in a ? a.p : a.q.p; return p > 0 ? 1 : p < 0 ? -1 : 0; };
export const qSub = (a: Q, b: Q): Q => qAdd(a, rat(-b.p, b.q));
export const qNeg = (a: Q): Q => rat(-a.p, a.q);
export const qAbs = (a: Q): Q => rat(Math.abs(a.p), a.q);
export const qSame = (a: Q, b: Q) => a.p === b.p && a.q === b.q;
/** decimal places a terminating fraction needs (null when it does not terminate within 3 places) */
export function places(q: Q): number | null { for (let k = 0; k <= 3; k++) if ((q.p * 10 ** k) % q.q === 0) return k; return null; }
export function isDec(q: Q): boolean { return places(q) !== null; }

function decStr(q: Q): string {
  const k = places(q);
  if (k === null) throw new RangeError(`${q.p}/${q.q} does not terminate`);
  const v = Math.abs(q.p) * 10 ** k / q.q;
  const s = String(Math.round(v)).padStart(k + 1, '0');
  return k ? `${s.slice(0, s.length - k)}.${s.slice(s.length - k)}` : s;
}
/** the same value in another form (the form an answer is shown in) */
export function as(q: Q, form: Form): Num {
  if (q.q === 1) return { q, form: 'int' };
  if (form === 'dec' && isDec(q)) return { q, form: 'dec' };
  if (form === 'mixed' && Math.abs(q.p) > q.q) return { q, form: 'mixed' };
  return { q, form: form === 'dec' || form === 'int' ? (isDec(q) ? 'dec' : 'frac') : 'frac' };
}
/** TeX; `paren` wraps a negative in parentheses (after an operator) */
export function tx(a: Num, paren = false): string {
  const n = a.q.p < 0, P = Math.abs(a.q.p), Qd = a.q.q;
  let body: string;
  if (Qd === 1) body = String(P);
  else if (a.form === 'dec') body = decStr(a.q);
  else if (a.form === 'mixed' && P > Qd) body = `${Math.floor(P / Qd)}\\tfrac{${P % Qd}}{${Qd}}`;
  else body = `\\tfrac{${P}}{${Qd}}`;
  const s = (n ? '-' : '') + body;
  return n && paren ? `(${s})` : s;
}
/** HTML with a real minus sign and stacked fractions */
export function hx(a: Num, paren = false): string {
  const n = a.q.p < 0, P = Math.abs(a.q.p), Qd = a.q.q;
  let body: string;
  if (Qd === 1) body = String(P);
  else if (a.form === 'dec') body = decStr(a.q);
  else if (a.form === 'mixed' && P > Qd) body = `${Math.floor(P / Qd)}&#8202;${fr(P % Qd, Qd)}`;
  else body = fr(P, Qd);
  const s = (n ? '−' : '') + body;
  return n && paren ? `(${s})` : s;
}
/** plain text (for logs and tests) */
export function pt(a: Num): string { return hx(a).replace(/<span class="fr"><span>([^<]*)<\/span><span>([^<]*)<\/span><\/span>/g, '$1/$2').replace(/&#8202;/g, ' '); }

export interface Term { op: '+' | '-' | null; n: Num }
export const sumQ = (ts: readonly Term[]): Q => ts.reduce((s, t) => (t.op === '-' ? qSub(s, t.n.q) : qAdd(s, t.n.q)), rat(0));
export function exprTex(ts: readonly Term[]): string { return ts.map((t, i) => (i === 0 ? tx(t.n) : ` ${t.op === '-' ? '-' : '+'} ${tx(t.n, true)}`)).join(''); }
export function exprHtml(ts: readonly Term[]): string { return ts.map((t, i) => (i === 0 ? hx(t.n) : ` ${t.op === '-' ? '−' : '+'} ${hx(t.n, true)}`)).join(''); }

// ---------- reading answers ----------
/** the value a kid typed: a number box (accepts the − sign too) or the fraction boxes (a minus in any box makes it negative) */
export function readQ(r: Response): Q | null {
  if (r.kind === 'num') {
    if (!Number.isFinite(r.v)) return null;
    try { return decQ(r.v); } catch { return null; }
  }
  if (r.kind === 'frac') {
    const { w, n, d } = r;
    if (![w, n, d].every(Number.isInteger) || d === 0) return null;
    const negative = w < 0 || n < 0 || d < 0;
    const mag = rat(Math.abs(w) * Math.abs(d) + Math.abs(n), Math.abs(d));
    return negative ? qNeg(mag) : mag;
  }
  return null;
}
/** a response that types this value (tests, walk-throughs) */
export function respond(q: Q, input: 'num' | 'frac'): Response {
  if (input === 'num') return { kind: 'num', v: qNum(q) };
  return { kind: 'frac', w: 0, n: q.p, d: q.q };
}
