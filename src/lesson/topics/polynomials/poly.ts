// poly.ts: exact polynomial maths for the lesson (no DOM). A polynomial is a list of signed terms in WRITTEN order
// (so an uncollected or scrambled polynomial keeps its look); collect() makes the standard form. Coefficients are
// exact rationals (core/math Q). Terms have exponents of x and y (y only in the multivariable extension).
// TeX for the board and HTML for prompts / choices: HTML exponents are <sup>, a hair space after an exponent that is
// followed by a letter (plain text reads x^2 y, never x^2y), fractions as fr() (plain text a/b).
import { type Q, qAdd, qMul, qNum, rat } from '../../../core/math';
import { fr } from '../../runtime/item';

export type { Q };
export { qAdd, qMul, qNum };
export interface Term {
  c: Q; x: number; y: number;
  /** how a fractional coefficient is written: 'over' = x/4, 3x/4; 'dec' = 0.5x; default = (1/2)x */
  f?: 'over' | 'dec';
  /** write y before x (yx is the same term as xy) */
  yx?: boolean;
}
export type Poly = Term[];

export const q = (p: number, d = 1): Q => rat(p, d);
export const Z: Q = rat(0);
export const isZ = (a: Q) => a.p === 0;
export const qNeg = (a: Q): Q => rat(-a.p, a.q);
export const qSame = (a: Q, b: Q) => a.p === b.p && a.q === b.q;
/** a term: coefficient (number or Q), exponent of x, exponent of y */
export function T(c: number | Q, x = 0, y = 0, f?: Term['f']): Term {
  const cc = typeof c === 'number' ? rat(c) : c;
  return f ? { c: cc, x, y, f } : { c: cc, x, y };
}
export const key = (t: Term) => `${t.x},${t.y}`;
export const deg = (t: Term) => t.x + t.y;
export const like = (a: Term, b: Term) => a.x === b.x && a.y === b.y;
/** terms with the same power combine; zero terms leave; standard form = descending total degree, then descending x */
export function collect(p: Poly): Poly {
  const m = new Map<string, Term>();
  for (const t of p) {
    const k = key(t), o = m.get(k);
    m.set(k, o ? { ...o, c: qAdd(o.c, t.c), f: o.f ?? t.f } : { ...t, yx: undefined });
  }
  return sortStd([...m.values()].filter(t => !isZ(t.c)));
}
export function sortStd(p: Poly): Poly { return p.slice().sort((a, b) => deg(b) - deg(a) || b.x - a.x); }
export const neg = (p: Poly): Poly => p.map(t => ({ ...t, c: qNeg(t.c) }));
export const add = (a: Poly, b: Poly): Poly => [...a, ...b];
export const sub = (a: Poly, b: Poly): Poly => [...a, ...neg(b)];
export const mulT = (a: Term, b: Term): Term => ({ c: qMul(a.c, b.c), x: a.x + b.x, y: a.y + b.y, f: a.f ?? b.f });
/** every term of a times every term of b, row by row (uncollected) */
export const mul = (a: Poly, b: Poly): Poly => a.flatMap(s => b.map(t => mulT(s, t)));
/** the partial products as a table [row of a][column of b] */
export const table = (a: Poly, b: Poly): Term[][] => a.map(s => b.map(t => mulT(s, t)));
/** degree of a polynomial after collecting; null for the zero polynomial */
export function degree(p: Poly): number | null { const c = collect(p); return c.length ? Math.max(...c.map(deg)) : null; }
export function coefOf(p: Poly, x: number, y = 0): Q { return collect(p).find(t => t.x === x && t.y === y)?.c ?? Z; }
export function equal(a: Poly, b: Poly): boolean {
  const A = collect(a), B = collect(b);
  return A.length === B.length && A.every((t, i) => like(t, B[i]!) && qSame(t.c, B[i]!.c));
}
/** exact value at whole numbers x, y */
export function evalP(p: Poly, x: number, y = 0): Q {
  let s = Z;
  for (const t of p) s = qAdd(s, qMul(t.c, rat(x ** t.x * y ** t.y)));
  return s;
}
export const valN = (p: Poly, x: number, y = 0) => qNum(evalP(p, x, y));
export const TERM_NAMES = ['monomial', 'binomial', 'trinomial'] as const;
export const termName = (n: number) => (n >= 1 && n <= 3 ? TERM_NAMES[n - 1]! : 'polynomial');
export const DEG_NAMES = ['constant', 'linear', 'quadratic', 'cubic', 'quartic'] as const;
export const degName = (d: number) => DEG_NAMES[d] ?? `degree ${d}`;

// ---------- writing ----------
const MINUS = '−';
function decStr(c: Q): string | null {
  let d = c.q; while (d % 2 === 0) d /= 2; while (d % 5 === 0) d /= 5;
  return d === 1 ? String(Math.abs(c.p) / c.q) : null;
}
function varTex(t: Term): string {
  const v = (s: string, n: number) => (n === 0 ? '' : n === 1 ? s : `${s}^{${n}}`);
  return t.yx ? v('y', t.y) + v('x', t.x) : v('x', t.x) + v('y', t.y);
}
function varHtml(t: Term): string {
  const v = (s: string, n: number) => (n === 0 ? '' : n === 1 ? `<i>${s}</i>` : `<i>${s}</i><sup>${n}</sup>`);
  const [a, b] = t.yx ? [v('y', t.y), v('x', t.x)] : [v('x', t.x), v('y', t.y)];
  return a && b && a.endsWith('</sup>') ? `${a}&#8202;${b}` : a + b;
}
/** the absolute value of a term (no sign) as TeX */
function absTex(t: Term): string {
  const a = { p: Math.abs(t.c.p), q: t.c.q }, vars = varTex(t);
  if (!vars) return a.q === 1 ? String(a.p) : t.f === 'dec' && decStr(a) ? decStr(a)! : `\\tfrac{${a.p}}{${a.q}}`;
  if (a.q === 1) return (a.p === 1 ? '' : String(a.p)) + vars;
  if (t.f === 'dec' && decStr(a)) return decStr(a)! + vars;
  if (t.f === 'over') return `\\frac{${a.p === 1 ? '' : a.p}${vars}}{${a.q}}`;
  return `\\tfrac{${a.p}}{${a.q}}${vars}`;
}
function absHtml(t: Term): string {
  const a = { p: Math.abs(t.c.p), q: t.c.q }, vars = varHtml(t);
  if (!vars) return a.q === 1 ? String(a.p) : t.f === 'dec' && decStr(a) ? decStr(a)! : fr(a.p, a.q);
  if (a.q === 1) return (a.p === 1 ? '' : String(a.p)) + vars;
  if (t.f === 'dec' && decStr(a)) return decStr(a)! + vars;
  if (t.f === 'over') return fr(`${a.p === 1 ? '' : a.p}${vars}`, a.q);
  return `${fr(a.p, a.q)}&#8202;${vars}`;
}
const negT = (t: Term) => t.c.p < 0;
/** one signed term alone ('-3x^{2}') */
export const termTex = (t: Term) => (negT(t) ? '-' : '') + absTex(t);
export const termHtml = (t: Term) => (negT(t) ? MINUS : '') + absHtml(t);
/** a polynomial in its written order; the zero polynomial is 0 */
export function polyTex(p: Poly): string {
  if (!p.length) return '0';
  return p.map((t, i) => (i === 0 ? termTex(t) : (negT(t) ? ' - ' : ' + ') + absTex(t))).join('');
}
export function polyHtml(p: Poly): string {
  if (!p.length) return '0';
  return p.map((t, i) => (i === 0 ? termHtml(t) : (negT(t) ? ` ${MINUS} ` : ' + ') + absHtml(t))).join('');
}
/** a factor in parentheses when it has more than one term (or a leading minus, for products) */
export const parTex = (p: Poly) => (p.length > 1 || (p.length === 1 && negT(p[0]!)) ? `(${polyTex(p)})` : polyTex(p));
export const parHtml = (p: Poly) => (p.length > 1 || (p.length === 1 && negT(p[0]!)) ? `(${polyHtml(p)})` : polyHtml(p));
/** a coefficient as plain HTML / TeX (with sign): −3, 1/2 */
export const qHtml = (a: Q) => (a.p < 0 ? MINUS : '') + (a.q === 1 ? String(Math.abs(a.p)) : fr(Math.abs(a.p), a.q));
export const qTexS = (a: Q) => (a.p < 0 ? '-' : '') + (a.q === 1 ? String(Math.abs(a.p)) : `\\tfrac{${Math.abs(a.p)}}{${a.q}}`);
/** a whole number as HTML with a real minus */
export const nH = (v: number) => (v < 0 ? MINUS + Math.abs(v) : String(v));
export const nT = (v: number) => String(v);
/** HTML variable power: xp(2) = x<sup>2</sup> */
export const xp = (n: number, v = 'x') => (n === 0 ? '1' : n === 1 ? `<i>${v}</i>` : `<i>${v}</i><sup>${n}</sup>`);
/** colour role of a degree (the same in the pictures and on the board) */
export const DEG_ROLE = ['second', 'first', 'water', 'pick', 'brown'] as const;
export const degRole = (d: number) => DEG_ROLE[Math.min(4, Math.max(0, d))]!;
