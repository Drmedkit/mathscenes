// lin.ts: exact linear equations in one variable for "solving linear equations" (secondary-t5-30).
// A side is a list of written pieces in written order: terms (4x, -7, \tfrac12 x) and groups f(e) such as 3(x + 2),
// -(x - 4), \tfrac23(x - 6). Everything is exact (core/math Q). The solution set is one number, none, or every number.
// Display: TeX for the board (x-terms tagged `tx`, numbers `tn`, so the board can colour them like the balance:
// bags / x teal, marbles / numbers amber) and HTML for the panel. Pure: no DOM, no canvas.
// Term arithmetic and formatting come from the expand-and-factor topic's pure expr.ts (read-only import).
import { type Q, qAdd, qDiv, qEq, qMul, rat } from '../../../core/math';
import { fr } from '../../runtime/item';
import { type Fmt, type Term, bodyHtml, bodyTex, decStr, magHtml, magTex } from '../expand-and-factor/expr';

export type { Fmt, Term, Q };
export interface Grp { f: Q; e: Term[] }
export type Piece = Term | Grp;
export type Side = Piece[];
export interface Eq { L: Side; R: Side; fmt: Fmt }
export interface Lin { m: Q; k: Q }
export type Sol = { kind: 'one'; x: Q } | { kind: 'none' } | { kind: 'all' };

export const Z = rat(0), ONE = rat(1);
export const q = (n: number | Q, d = 1): Q => (typeof n === 'number' ? (Number.isInteger(n) ? rat(n, d) : decQ(n / d)) : n);
/** an exact Q for a short decimal (0.15, -2.5) */
export function decQ(x: number): Q {
  for (let k = 0; k <= 6; k++) { const s = 10 ** k, p = Math.round(x * s); if (Math.abs(p / s - x) < 1e-9) return rat(p, s); }
  throw new RangeError(`decQ: ${x} is not a short decimal`);
}
export const X = (c: number | Q): Term => ({ c: q(c), v: 'x' });
export const N = (c: number | Q): Term => ({ c: q(c), v: '' });
export const G = (f: number | Q, ...e: Term[]): Grp => ({ f: q(f), e });
export const isGrp = (p: Piece): p is Grp => 'f' in p;
export const neg = (a: Q): Q => rat(-a.p, a.q);
export const qSub = (a: Q, b: Q): Q => qAdd(a, neg(b));
export const num = (a: Q): number => a.p / a.q;
export const isZ = (a: Q) => a.p === 0;

// ---------- maths ----------
export function sideLin(s: Side): Lin {
  let m = Z, k = Z;
  for (const p of s) {
    const ts = isGrp(p) ? p.e.map(t => ({ c: qMul(p.f, t.c), v: t.v })) : [p];
    for (const t of ts) { if (t.v === 'x') m = qAdd(m, t.c); else if (t.v === '') k = qAdd(k, t.c); else throw new RangeError('lin: only x and numbers'); }
  }
  return { m, k };
}
export const valueAt = (s: Side, x: Q): Q => { const l = sideLin(s); return qAdd(qMul(l.m, x), l.k); };
export function solve(e: Eq): Sol {
  const a = sideLin(e.L), b = sideLin(e.R);
  const m = qSub(a.m, b.m), k = qSub(b.k, a.k);
  if (!isZ(m)) return { kind: 'one', x: qDiv(k, m) };
  return isZ(k) ? { kind: 'all' } : { kind: 'none' };
}
/** does x make the equation true? */
export const holds = (e: Eq, x: Q): boolean => qEq(valueAt(e.L, x), valueAt(e.R, x));
/** the simplified side mx + k as pieces (x term first; "0" when both vanish) */
export function simp(s: Side): Side { const l = sideLin(s); const out: Side = []; if (!isZ(l.m)) out.push({ c: l.m, v: 'x' }); if (!isZ(l.k) || !out.length) out.push({ c: l.k, v: '' }); return out; }
export const linSide = (l: Lin): Side => simp([{ c: l.m, v: 'x' }, { c: l.k, v: '' }]);

// ---------- display ----------
const factorMagTex = (f: Q, fmt: Fmt) => (Math.abs(f.p) === f.q ? '' : magTex(f, fmt));
const factorMagHtml = (f: Q, fmt: Fmt) => (Math.abs(f.p) === f.q ? '' : magHtml(f, fmt));
const sgn = (p: Piece) => (isGrp(p) ? p.f.p : p.c.p) < 0;
function innerTex(e: Term[], fmt: Fmt, tag: boolean): string {
  return e.map((t, i) => {
    const b = tag ? `\\cssId{${t.v === 'x' ? 'tx' : 'tn'}}{${bodyTex(t, fmt)}}` : bodyTex(t, fmt);
    if (i === 0) return (t.c.p < 0 ? '-' : '') + b;
    return ` ${t.c.p < 0 ? '-' : '+'} ${b}`;
  }).join('');
}
/** a side as TeX in written order; `tag` wraps x-terms in \cssId{tx} and numbers in \cssId{tn} */
export function sideTex(s: Side, fmt: Fmt = 'frac', tag = false): string {
  if (!s.length) return tag ? '\\cssId{tn}{0}' : '0';
  return s.map((p, i) => {
    let body: string;
    if (isGrp(p)) body = `${factorMagTex(p.f, fmt)}(${innerTex(p.e, fmt, tag)})`;
    else { body = bodyTex(p, fmt); if (tag) body = `\\cssId{${p.v === 'x' ? 'tx' : 'tn'}}{${body}}`; }
    if (i === 0) return (sgn(p) ? '-' : '') + body;
    return ` ${sgn(p) ? '-' : '+'} ${body}`;
  }).join('');
}
const VX = '<i>x</i>';
function termHtml(t: Term, fmt: Fmt): string { return t.v === 'x' ? bodyHtml(t, fmt).replace('<i>x</i>', VX) : bodyHtml(t, fmt); }
export function sideHtml(s: Side, fmt: Fmt = 'frac'): string {
  if (!s.length) return '0';
  return s.map((p, i) => {
    const body = isGrp(p)
      ? `${factorMagHtml(p.f, fmt)}(${p.e.map((t, j) => (j === 0 ? (t.c.p < 0 ? '−' : '') : ` ${t.c.p < 0 ? '−' : '+'} `) + termHtml(t, fmt)).join('')})`
      : termHtml(p, fmt);
    if (i === 0) return (sgn(p) ? '−' : '') + body;
    return ` ${sgn(p) ? '−' : '+'} ${body}`;
  }).join('');
}
export const eqTex = (e: Eq, tag = false) => `${sideTex(e.L, e.fmt, tag)} = ${sideTex(e.R, e.fmt, tag)}`;
export const eqHtml = (e: Eq) => `${sideHtml(e.L, e.fmt)} = ${sideHtml(e.R, e.fmt)}`;
/** a number as HTML (real minus; fraction or decimal) and TeX */
export function nH(a: Q | number, fmt: Fmt = 'frac'): string {
  const c = q(a);
  if (c.q === 1) return (c.p < 0 ? '−' : '') + Math.abs(c.p);
  if (fmt === 'dec') { const s = decStr(rat(Math.abs(c.p), c.q)); if (s) return (c.p < 0 ? '−' : '') + s; }
  return (c.p < 0 ? '−' : '') + fr(Math.abs(c.p), c.q);
}
export function nT(a: Q | number, fmt: Fmt = 'frac'): string {
  const c = q(a);
  if (c.q === 1) return String(c.p);
  if (fmt === 'dec') { const s = decStr(rat(Math.abs(c.p), c.q)); if (s) return (c.p < 0 ? '-' : '') + s; }
  return `${c.p < 0 ? '-' : ''}\\tfrac{${Math.abs(c.p)}}{${c.q}}`;
}
/** a number in words-friendly plain text (logs, test names): -7/3, 0.15 */
export const nPlain = (a: Q) => (a.q === 1 ? String(a.p) : decStr(a) ?? `${a.p}/${a.q}`);
/** a substituted side for a check line: 5(3) + 3, 3 + 15 */
export function subHtml(s: Side, x: Q, fmt: Fmt = 'frac'): string {
  const xs = `(${nH(x, fmt)})`;
  // inside parentheses the value needs no second pair: 3((−4) + 7) -> 3(−4 + 7)
  return sideHtml(s, fmt).split('<i>x</i>').join(xs).split(`(${xs}`).join(`(${nH(x, fmt)}`);
}
export function subTex(s: Side, x: Q, fmt: Fmt = 'frac'): string {
  const xs = `(${nT(x, fmt)})`;
  return sideTex(s, fmt).replace(/x/g, xs);
}
export const solHtml = (s: Sol, fmt: Fmt = 'frac') => (s.kind === 'one' ? `${VX} = ${nH(s.x, fmt)}` : s.kind === 'none' ? 'no solution' : 'every number (infinitely many solutions)');
