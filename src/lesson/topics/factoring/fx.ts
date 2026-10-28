// fx.ts: exact maths for "Factoring" (no DOM). Polynomials come from the polynomials lesson (poly.ts, read-only):
// a factored form is a monomial in front (k) times polynomial factors (fs, each with a power), and expand() turns it
// back into the standard-form sum. Also: integer factor pairs, the sum-product search, completeness over the
// integers, and the HTML / TeX writers for factored forms.
import { gcd } from '../../runtime/item';
import { type Poly, type Term, T, collect, deg, equal, mul, polyHtml, polyTex, termHtml, termTex, valN } from '../polynomials/poly';

export { T, collect, equal, mul, polyHtml, polyTex, termHtml, termTex, valN, deg };
export type { Poly, Term };

/** px + q (zero parts left out); with v = 2: px² + q */
export const lin = (p: number, q: number, v = 1): Poly => [...(p ? [T(p, v)] : []), ...(q ? [T(q)] : [])];
/** ax² + bx + c (zero parts left out) */
export const quad = (a: number, b: number, c: number): Poly => [...(a ? [T(a, 2)] : []), ...(b ? [T(b, 1)] : []), ...(c ? [T(c)] : [])];
/** a polynomial from [coefficient, exponent] pairs, zero coefficients left out */
export const P = (...ts: [number, number][]): Poly => ts.filter(([c]) => c !== 0).map(([c, e]) => T(c, e));

// ---------- factored forms ----------
export interface Fac { k?: Term; fs: Poly[]; pw?: number[] }
export const F = (k: Term | number | undefined, ...fs: Poly[]): Fac => ({ k: typeof k === 'number' ? T(k) : k, fs });
export const Fp = (k: Term | number | undefined, fs: Poly[], pw: number[]): Fac => ({ k: typeof k === 'number' ? T(k) : k, fs, pw });
export function expand(f: Fac): Poly {
  let p: Poly = [f.k ?? T(1)];
  f.fs.forEach((g, i) => { for (let j = 0; j < (f.pw?.[i] ?? 1); j++) p = collect(mul(p, g)); });
  return collect(p);
}
const isUnit = (k?: Term) => !k || (k.x === 0 && k.y === 0 && k.c.q === 1 && Math.abs(k.c.p) === 1);
function headOf(k: Term | undefined, html: boolean): string {
  if (!k) return '';
  if (isUnit(k)) return k.c.p < 0 ? (html ? '−' : '-') : '';
  return html ? termHtml(k) : termTex(k);
}
const one = (g: Poly) => g.length === 1;
export function facTex(f: Fac): string {
  const body = f.fs.map((g, i) => {
    const e = f.pw?.[i] ?? 1;
    const s = one(g) && !f.k && f.fs.length === 1 ? polyTex(g) : `(${polyTex(g)})`;
    return e > 1 ? `${s}^{${e}}` : s;
  }).join('');
  const h = headOf(f.k, false);
  return f.fs.length ? h + body : f.k ? termTex(f.k) : '1';
}
export function facHtml(f: Fac): string {
  const body = f.fs.map((g, i) => {
    const e = f.pw?.[i] ?? 1;
    const s = !f.k && f.fs.length === 1 && e === 1 ? polyHtml(g) : `(${polyHtml(g)})`;
    return e > 1 ? `${s}<sup>${e}</sup>` : s;
  }).join('');
  const h = headOf(f.k, true);
  return f.fs.length ? h + body : f.k ? termHtml(f.k) : '1';
}
/** a factored form's value at x (float, exact enough for whole x) */
export const evF = (f: Fac) => (x: number) => valN(expand(f), x);
export const evP = (p: Poly) => (x: number) => valN(p, x);

// ---------- integer search ----------
/** every integer pair m <= n with m·n = c (c ≠ 0) */
export function pairs(c: number): [number, number][] {
  const out: [number, number][] = [];
  const a = Math.abs(c);
  for (let d = 1; d * d <= a; d++) if (a % d === 0) {
    const e = a / d;
    if (c > 0) { out.push([d, e]); out.push([-e, -d]); } else { out.push([-e, d]); out.push([-d, e]); }
  }
  const seen = new Set<string>();
  return out.map(([m, n]) => (m <= n ? [m, n] : [n, m]) as [number, number]).filter(([m, n]) => { const k = `${m},${n}`; if (seen.has(k)) return false; seen.add(k); return true; });
}
/** the pair with product c and sum b, or null */
export const sumProd = (b: number, c: number): [number, number] | null => pairs(c).find(([m, n]) => m + n === b) ?? null;
export const isSquare = (n: number) => n >= 0 && Number.isInteger(Math.sqrt(n)) && Math.round(Math.sqrt(n)) ** 2 === n;

// ---------- completeness over the integers ----------
const intCoefs = (g: Poly) => g.every(t => t.c.q === 1);
export const content = (g: Poly) => g.reduce((s, t) => gcd(s, t.c.p), 0);
/** a primitive integer polynomial factor that does not factor further over the integers (degree 1, or degree 2 with
 *  a discriminant that is not a perfect square); its leading coefficient positive */
export function irreducible(g: Poly): boolean {
  const s = collect(g);
  if (!s.length || !intCoefs(s) || content(s) !== 1 || s[0]!.c.p < 0 || s.some(t => t.y)) return false;
  const d = Math.max(...s.map(t => t.x));
  if (d === 1) return true;
  if (d !== 2) return false;
  const co = (e: number) => s.find(t => t.x === e)?.c.p ?? 0;
  if (co(0) === 0) return false;   // x is a common factor
  return !isSquare(co(1) ** 2 - 4 * co(2) * co(0));
}
/** factored completely: a monomial in front times factors that are each primitive and irreducible */
export const isComplete = (f: Fac) => f.fs.every(irreducible);
export const sameP = (a: Poly, b: Poly) => equal(a, b);
