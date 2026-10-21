// expr.ts: exact linear (and monomial-times-linear) expressions for "expand, combine, and factor".
// A term is a rational coefficient times a variable part ('' constant, x, y, x², x³); an expression is the list of
// terms IN WRITTEN ORDER (7 − 2x + 4 stays three terms, so "the sign belongs to the term" can be shown and checked).
// Everything is exact (core/math Q); display is TeX for the board and HTML for the panel, as fractions or decimals.
// Pure: no DOM, no canvas.
import { type Q, qAdd, qMul, qDiv, qEq, rat } from '../../../core/math';
import { fr } from '../../runtime/item';

export type Var = '' | 'x' | 'y' | 'x2' | 'x3';
export interface Term { c: Q; v: Var }
export type Ex = readonly Term[];
/** how non-integer coefficients are written */
export type Fmt = 'frac' | 'dec';

const Z = rat(0), ONE = rat(1);
export const q = (n: number | Q, d = 1): Q => (typeof n === 'number' ? (Number.isInteger(n) && Number.isInteger(d) ? rat(n, d) : decQ(n / d)) : n);
/** an exact Q for a short decimal (0.4, -2.3, 2.53) */
export function decQ(x: number): Q {
  for (let k = 0; k <= 6; k++) { const s = 10 ** k, p = Math.round(x * s); if (Math.abs(p / s - x) < 1e-9) return rat(p, s); }
  throw new RangeError(`decQ: ${x} is not a short decimal`);
}
export const t = (c: number | Q, v: Var = ''): Term => ({ c: q(c), v });
export const isZero = (a: Q) => a.p === 0;
export const neg = (a: Q): Q => rat(-a.p, a.q);
export const qAbs = (a: Q): Q => rat(Math.abs(a.p), a.q);
export const qSub = (a: Q, b: Q): Q => qAdd(a, neg(b));
export const num = (a: Q) => a.p / a.q;

const ORDER: Var[] = ['x3', 'x2', 'x', 'y', ''];
const DEG: Record<Var, number> = { '': 0, x: 1, y: 1, x2: 2, x3: 3 };
const ofDeg = (d: number): Var => (['', 'x', 'x2', 'x3'] as Var[])[d]!;

/** like terms merged, zero terms dropped, in the order x³, x², x, y, constant */
export function normal(e: Ex): Term[] {
  const m = new Map<Var, Q>();
  for (const s of e) m.set(s.v, qAdd(m.get(s.v) ?? Z, s.c));
  return ORDER.filter(v => m.has(v) && !isZero(m.get(v)!)).map(v => ({ c: m.get(v)!, v }));
}
export const coef = (e: Ex, v: Var): Q => normal(e).find(s => s.v === v)?.c ?? Z;
export function same(a: Ex, b: Ex): boolean {
  const A = normal(a), B = normal(b);
  return A.length === B.length && A.every((s, i) => s.v === B[i]!.v && qEq(s.c, B[i]!.c));
}
export function mulTerm(a: Term, b: Term): Term {
  if ((a.v === 'y' && b.v !== '') || (b.v === 'y' && a.v !== '')) throw new RangeError('mulTerm: no xy terms in this topic');
  const v: Var = a.v === 'y' || b.v === 'y' ? 'y' : ofDeg(DEG[a.v] + DEG[b.v]);
  if (DEG[v] > 3) throw new RangeError('mulTerm: degree > 3');
  return { c: qMul(a.c, b.c), v };
}
/** f(e): every term of e times f, in e's order */
export const expand = (f: Term, e: Ex): Term[] => e.map(s => mulTerm(f, s));
export const negEx = (e: Ex): Term[] => e.map(s => ({ c: neg(s.c), v: s.v }));
export const addEx = (...es: Ex[]): Term[] => es.flat();
/** e ÷ f term by term (factoring): every term must divide exactly into a polynomial term */
export function divide(e: Ex, f: Term): Term[] {
  return e.map(s => {
    const d = DEG[s.v] - DEG[f.v];
    if (f.v === 'y' || d < 0 || (s.v === 'y' && f.v !== '')) throw new RangeError('divide: not a factor');
    return { c: qDiv(s.c, f.c), v: s.v === 'y' ? 'y' : ofDeg(d) };
  });
}
export function value(e: Ex, x: number | Q, y: number | Q = 0): Q {
  const X = q(x), Y = q(y);
  let s = Z;
  for (const m of e) {
    let p = m.c;
    if (m.v === 'y') p = qMul(p, Y);
    else for (let i = 0; i < DEG[m.v]; i++) p = qMul(p, X);
    s = qAdd(s, p);
  }
  return s;
}

// ---------- display ----------
const gcd = (a: number, b: number): number => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
/** a Q as a finite decimal string, or null when it has none */
export function decStr(a: Q): string | null {
  let d = a.q; while (d % 2 === 0) d /= 2; while (d % 5 === 0) d /= 5;
  if (d !== 1) return null;
  for (let k = 0; k <= 6; k++) { const s = 10 ** k; if ((a.p * s) % a.q === 0) return (a.p / a.q).toFixed(k); }
  return null;
}
const VT: Record<Var, string> = { '': '', x: 'x', y: 'y', x2: 'x^2', x3: 'x^3' };
const VH: Record<Var, string> = { '': '', x: '<i>x</i>', y: '<i>y</i>', x2: '<i>x</i><sup>2</sup>', x3: '<i>x</i><sup>3</sup>' };
/** |c| as TeX: 4, \tfrac{1}{2}, 0.4 */
export function magTex(c: Q, fmt: Fmt = 'frac'): string {
  const a = qAbs(c);
  if (a.q === 1) return String(a.p);
  if (fmt === 'dec') { const s = decStr(a); if (s) return s; }
  return `\\tfrac{${a.p}}{${a.q}}`;
}
export function magHtml(c: Q, fmt: Fmt = 'frac'): string {
  const a = qAbs(c);
  if (a.q === 1) return String(a.p);
  if (fmt === 'dec') { const s = decStr(a); if (s) return s; }
  return fr(a.p, a.q);
}
/** one term without its sign: 4x, x, \tfrac12 x, 12 */
export function bodyTex(s: Term, fmt: Fmt = 'frac'): string {
  if (s.v === '') return magTex(s.c, fmt);
  const one = qEq(qAbs(s.c), ONE);
  return (one ? '' : magTex(s.c, fmt)) + VT[s.v];
}
export function bodyHtml(s: Term, fmt: Fmt = 'frac'): string {
  if (s.v === '') return magHtml(s.c, fmt);
  const one = qEq(qAbs(s.c), ONE);
  return (one ? '' : magHtml(s.c, fmt)) + VH[s.v];
}
/** the colour role of a variable part (the same in picture, board and panel) */
export const ROLE: Record<Var, 'first' | 'second' | 'water' | 'lemon'> = { x: 'first', '': 'second', y: 'lemon', x2: 'water', x3: 'water' };
export const CLS: Record<Var, string> = { x: 'a', '': 'b', y: 'y', x2: 'x2', x3: 'x2' };

export interface TexOpts {
  fmt?: Fmt;
  /** \cssId prefix: term i is `${id}${i}`, its sign `${id}s${i}` */
  id?: string;
  /** keep zero terms and written order (default true: as written) */
  raw?: boolean;
  /** write a leading + on the first term (a term inside a chain) */
  lead?: boolean;
}
/** an expression as TeX in written order: 7 - 2x + 4 */
export function exTex(e: Ex, o: TexOpts = {}): string {
  const fmt = o.fmt ?? 'frac';
  const ts = o.raw === false ? normal(e) : [...e];
  if (!ts.length) return o.id ? `\\cssId{${o.id}0}{0}` : '0';
  return ts.map((s, i) => {
    const negS = s.c.p < 0, body = bodyTex(s, fmt);
    const wrap = (x: string) => (o.id ? `\\cssId{${o.id}${i}}{${x}}` : x);
    const sg = (x: string) => (o.id ? `\\cssId{${o.id}s${i}}{${x}}` : x);
    if (i === 0 && !o.lead) return negS ? wrap(`-${body}`) : wrap(body);
    return ` ${sg(negS ? '-' : '+')} ${wrap(body)}`;
  }).join('');
}
export function exHtml(e: Ex, o: { fmt?: Fmt; raw?: boolean; color?: boolean } = {}): string {
  const fmt = o.fmt ?? 'frac';
  const ts = o.raw === false ? normal(e) : [...e];
  if (!ts.length) return '0';
  const col = (s: Term, x: string) => (o.color ? `<b class="${CLS[s.v]}">${x}</b>` : x);
  return ts.map((s, i) => {
    const negS = s.c.p < 0, body = bodyHtml(s, fmt);
    if (i === 0) return col(s, negS ? `−${body}` : body);
    return ` ${negS ? '−' : '+'} ${col(s, body)}`;
  }).join('');
}
/** a factor in front of parentheses: 4, -2, -, \tfrac12, 0.5, 3x, -11x */
export function factorTex(f: Term, fmt: Fmt = 'frac'): string {
  const negS = f.c.p < 0, one = qEq(qAbs(f.c), ONE);
  const body = f.v === '' ? (one ? '' : magTex(f.c, fmt)) : bodyTex(f, fmt);
  return (negS ? '-' : '') + body;
}
export function factorHtml(f: Term, fmt: Fmt = 'frac'): string {
  const negS = f.c.p < 0, one = qEq(qAbs(f.c), ONE);
  const body = f.v === '' ? (one ? '' : magHtml(f.c, fmt)) : bodyHtml(f, fmt);
  return (negS ? '−' : '') + body;
}
/** f(e) as TeX: 4(x + 3), -(x + 6), (x + 3)5 when right */
export function prodTex(f: Term, e: Ex, o: { fmt?: Fmt; right?: boolean; id?: string; fid?: string } = {}): string {
  const inner = `(${exTex(e, { fmt: o.fmt, id: o.id })})`;
  let F = factorTex(f, o.fmt);
  if (o.fid && F) F = `\\cssId{${o.fid}}{${F}}`;
  return o.right ? `${inner}${F}` : `${F}${inner}`;
}
export function prodHtml(f: Term, e: Ex, o: { fmt?: Fmt; right?: boolean; color?: boolean } = {}): string {
  const inner = `(${exHtml(e, { fmt: o.fmt, color: o.color })})`;
  const F = factorHtml(f, o.fmt);
  return o.right ? `${inner}${F}` : `${F}${inner}`;
}
/** one term as plain HTML with its sign (for "the terms are 7, −2x, 4") */
export const termHtml = (s: Term, fmt: Fmt = 'frac') => (s.c.p < 0 ? '−' : '') + bodyHtml(s, fmt);
export const termTex = (s: Term, fmt: Fmt = 'frac') => (s.c.p < 0 ? '-' : '') + bodyTex(s, fmt);
/** a number as HTML with a real minus sign */
export const nH = (n: number | Q, fmt: Fmt = 'frac') => { const c = q(n); return (c.p < 0 ? '−' : '') + magHtml(c, fmt); };
export const nT = (n: number | Q, fmt: Fmt = 'frac') => { const c = q(n); return (c.p < 0 ? '-' : '') + magTex(c, fmt); };

/** the greatest common factor of whole-number coefficients */
export function gcfOf(ns: readonly number[]): number { return ns.reduce((a, b) => gcd(a, b), 0); }
export { qEq, qMul, qAdd, qDiv, rat };
export type { Q };
