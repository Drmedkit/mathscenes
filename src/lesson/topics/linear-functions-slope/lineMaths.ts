// lineMaths.ts: exact maths of lines for "Linear functions and slope" (Algebra 1): rationals, slope from two points,
// the three forms (slope-intercept, point-slope, standard Ax + By = C), zeros and intercepts, and how each is written
// (HTML for the panel, TeX for the board). Pure: no DOM, no canvas.
import { type Q, rat, qAdd, qMul, qDiv, qEq, qNum } from '../../../core/math';
import { fr } from '../../runtime/item';

export type { Q };
export const q = (p: number, d = 1): Q => rat(p, d);
export const ZERO = q(0), ONE = q(1);
export const qSub = (a: Q, b: Q): Q => qAdd(a, q(-b.p, b.q));
export const qNeg = (a: Q): Q => q(-a.p, a.q);
export { qAdd, qMul, qDiv, qEq, qNum };
export const qIs = (a: Q, v: number) => Math.abs(qNum(a) - v) < 1e-9;
/** a rational from a number with a small denominator (throws when there is none: generators only make friendly values) */
export function toQ(v: number): Q {
  for (let d = 1; d <= 24; d++) { const p = Math.round(v * d); if (Math.abs(p / d - v) < 1e-9) return q(p, d); }
  throw new RangeError(`toQ: ${v}`);
}

// ---------- numbers as text ----------
const r3 = (v: number) => Math.round(v * 1000) / 1000;
/** HTML / canvas text of a number with a real minus sign */
export const nH = (v: number): string => (r3(v) < 0 ? '−' : '') + String(Math.abs(r3(v)));
/** TeX of a number */
export const nT = (v: number): string => (r3(v) < 0 ? '-' : '') + String(Math.abs(r3(v)));
/** a terminating decimal of a rational (up to 3 places), or null */
export function qDec(a: Q): string | null { let d = a.q; while (d % 2 === 0) d /= 2; while (d % 5 === 0) d /= 5; return d === 1 && Math.abs(qNum(a) * 1000 - Math.round(qNum(a) * 1000)) < 1e-9 ? nH(qNum(a)) : null; }
/** HTML of a rational: −3, or −3/2 as a stacked fraction */
export const qH = (a: Q): string => (a.q === 1 ? nH(a.p) : `${a.p < 0 ? '−' : ''}${fr(Math.abs(a.p), a.q)}`);
/** plain text of a rational (canvas words, log): −3/2 */
export const qP = (a: Q): string => (a.q === 1 ? nH(a.p) : `${a.p < 0 ? '−' : ''}${Math.abs(a.p)}/${a.q}`);
/** TeX of a rational */
export const qT = (a: Q): string => (a.q === 1 ? nT(a.p) : `${a.p < 0 ? '-' : ''}\\frac{${Math.abs(a.p)}}{${a.q}}`);

// ---------- terms ----------
const X = '<i>x</i>', Y = '<i>y</i>';
/** HTML of c·v as the FIRST term (1x -> x, −1x -> −x, 0 -> '') */
function termH(c: Q, v: string): string { if (c.p === 0) return ''; if (qIs(c, 1)) return v; if (qIs(c, -1)) return '−' + v; return qH(c) + v; }
function termT(c: Q, v: string): string { if (c.p === 0) return ''; if (qIs(c, 1)) return v; if (qIs(c, -1)) return '-' + v; return qT(c) + v; }
/** " + 4" / " − 4" after a term */
const tailH = (c: Q): string => (c.p === 0 ? '' : c.p < 0 ? ` − ${qH(qNeg(c))}` : ` + ${qH(c)}`);
const tailT = (c: Q): string => (c.p === 0 ? '' : c.p < 0 ? ` - ${qT(qNeg(c))}` : ` + ${qT(c)}`);
/** mx + b as an expression (HTML / TeX), x = the input letter */
export function exprH(m: Q, b: Q, x = X): string { const t = termH(m, x); return t ? t + tailH(b) : qH(b); }
export function exprT(m: Q, b: Q, x = 'x'): string { const t = termT(m, x); return t ? t + tailT(b) : qT(b); }
/** y = mx + b */
export const siH = (m: Q, b: Q, y = Y, x = X) => `${y} = ${exprH(m, b, x)}`;
export const siT = (m: Q, b: Q, y = 'y', x = 'x') => `${y} = ${exprT(m, b, x)}`;
/** v − c  ("x − 1", "x + 6", "x") */
const shiftH = (v: string, c: Q) => (c.p === 0 ? v : c.p > 0 ? `${v} − ${qH(c)}` : `${v} + ${qH(qNeg(c))}`);
const shiftT = (v: string, c: Q) => (c.p === 0 ? v : c.p > 0 ? `${v} - ${qT(c)}` : `${v} + ${qT(qNeg(c))}`);
/** point-slope y − y1 = m(x − x1) */
export function psH(m: Q, x1: Q, y1: Q, y = Y, x = X): string {
  const mm = qIs(m, 1) ? '' : qIs(m, -1) ? '−' : qH(m);
  return `${shiftH(y, y1)} = ${mm}(${shiftH(x, x1)})`;
}
export function psT(m: Q, x1: Q, y1: Q, y = 'y', x = 'x'): string {
  const mm = qIs(m, 1) ? '' : qIs(m, -1) ? '-' : qT(m);
  return `${shiftT(y, y1)} = ${mm}(${shiftT(x, x1)})`;
}

// ---------- lines ----------
export type Pt2 = readonly [number, number];
/** slope from two points, or null when the inputs are equal (a vertical pair: undefined) */
export function slope(a: Pt2, b: Pt2): Q | null { return a[0] === b[0] ? null : qDiv(toQ(b[1] - a[1]), toQ(b[0] - a[0])); }
export interface Lin { m: Q; b: Q }
/** the line through a point with slope m */
export const through = (m: Q, P: Pt2): Lin => ({ m, b: qSub(toQ(P[1]), qMul(m, toQ(P[0]))) });
export const at = (L: Lin, x: number): number => qNum(L.m) * x + qNum(L.b);
/** the zero of y = mx + b: a value, 'none' (m = 0, b ≠ 0) or 'all' (y = 0) */
export function zeroOf(L: Lin): Q | 'none' | 'all' { if (L.m.p === 0) return L.b.p === 0 ? 'all' : 'none'; return qDiv(qNeg(L.b), L.m); }
/** standard form Ax + By = C with integers, gcd 1, A ≥ 0 (and B > 0 when A = 0) */
export interface Std { A: number; B: number; C: number }
const gcd = (a: number, b: number): number => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
export function stdOf(L: Lin): Std {
  // y = (p/q)x + (r/s)  ->  -(p/q)x + y = r/s, times lcm(q, s)
  const l = (L.m.q * L.b.q) / gcd(L.m.q, L.b.q);
  let A = -L.m.p * (l / L.m.q), B = l, C = L.b.p * (l / L.b.q);
  const g = gcd(gcd(A, B), C) || 1;
  A /= g; B /= g; C /= g;
  if (A < 0 || (A === 0 && B < 0)) { A = -A; B = -B; C = -C; }
  return { A: A + 0, B: B + 0, C: C + 0 };
}
export function stdNorm(s: Std): Std {
  let { A, B, C } = s; const g = gcd(gcd(A, B), C) || 1; A /= g; B /= g; C /= g;
  if (A < 0 || (A === 0 && B < 0)) { A = -A; B = -B; C = -C; }
  return { A: A + 0, B: B + 0, C: C + 0 };
}
/** the slope-intercept line of Ax + By = C (B ≠ 0) */
export const linOfStd = (s: Std): Lin => ({ m: q(-s.A, s.B), b: q(s.C, s.B) });
const coefStd = (c: number, v: string, first: boolean, minus: string): string => {
  if (c === 0) return '';
  const a = Math.abs(c), body = (a === 1 ? '' : String(a)) + v;
  return first ? (c < 0 ? minus : '') + body : (c < 0 ? ` ${minus} ` : ' + ') + body;
};
export function stdH(s: Std, x = X, y = Y): string {
  const a = coefStd(s.A, x, true, '−'), b = coefStd(s.B, y, a === '', '−');
  return `${a}${b} = ${nH(s.C)}`;
}
export function stdT(s: Std, x = 'x', y = 'y'): string {
  const a = coefStd(s.A, x, true, '-'), b = coefStd(s.B, y, a === '', '-');
  return `${a}${b} = ${nT(s.C)}`;
}
export const sameLin = (a: Lin, b: Lin) => qEq(a.m, b.m) && qEq(a.b, b.b);
/** does (x, y) lie on y = mx + b */
export const onLin = (L: Lin, P: Pt2) => Math.abs(at(L, P[0]) - P[1]) < 1e-9;
export const pt = (P: Pt2) => `(${nH(P[0])}, ${nH(P[1])})`;
export const ptT = (P: Pt2) => `(${nT(P[0])}, ${nT(P[1])})`;
/** y = mx + b with decimal coefficients (contexts: 0.45, 2.5), HTML and TeX */
export function siDecH(m: number, b: number, y: string, x: string): string {
  const t = m === 0 ? '' : m === 1 ? x : m === -1 ? '−' + x : nH(m) + x;
  return `${y} = ${t ? t + (b === 0 ? '' : b < 0 ? ` − ${nH(-b)}` : ` + ${nH(b)}`) : nH(b)}`;
}
export function siDecT(m: number, b: number, y: string, x: string): string {
  const t = m === 0 ? '' : m === 1 ? x : m === -1 ? '-' + x : nT(m) + x;
  return `${y} = ${t ? t + (b === 0 ? '' : b < 0 ? ` - ${nT(-b)}` : ` + ${nT(b)}`) : nT(b)}`;
}
