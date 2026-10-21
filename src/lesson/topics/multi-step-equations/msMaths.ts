// msMaths.ts: exact maths and display for multi-step linear equations with rational coefficients (secondary-t5-44).
// The equation engine is the linear-equations topic's pure lin.ts / solving.ts (read-only imports): a side is a list
// of written pieces (terms c·x or c, groups f(e)), everything exact (core/math Q). This file adds what THIS topic
// needs on top: written looks for one coefficient (2x/3, 2 1/2 x, a fraction bar over a binomial), big board TeX
// (\dfrac so numerals stay >= 60 px), the clearing multipliers (least integer, powers of 10, valid / too small),
// scaling a whole equation (or only some terms: the slip), and the balance picture of an equation (pieces by value).
// Pure: no DOM, no canvas.
import { type Q, qAdd, qEq, qMul, rat } from '../../../core/math';
import { fr } from '../../runtime/item';
import { type Eq, type Grp, type Piece, type Side, type Term, isGrp, isZ, neg, num, sideLin, solve, valueAt } from '../linear-equations/lin';
import { decStr } from '../expand-and-factor/expr';

export type { Eq, Side, Piece, Term, Grp, Q };
export type Fmt = 'frac' | 'dec';
/** display hints (ignored by the maths): over = 2x/3, mixed = 2 1/2 x; a group with bar = (x + 2)/3 */
export interface MTerm extends Term { look?: 'over' | 'mixed'; fmt?: Fmt; raw?: readonly [number, number] }
export interface MGrp extends Grp { bar?: boolean; fmt?: Fmt }

export const q = (n: number, d = 1): Q => (Number.isInteger(n) && Number.isInteger(d) ? rat(n, d) : decQ(n / d));
export function decQ(x: number): Q { for (const s of [1, 10, 100, 1000]) { const p = Math.round(x * s); if (Math.abs(p / s - x) < 1e-9) return rat(p, s); } throw new RangeError(`decQ: ${x}`); }
export const X = (c: number | Q, look?: MTerm['look']): MTerm => ({ c: typeof c === 'number' ? q(c) : c, v: 'x', ...(look ? { look } : {}) });
export const N = (c: number | Q): MTerm => ({ c: typeof c === 'number' ? q(c) : c, v: '' });
export const G = (f: number | Q, ...e: Term[]): MGrp => ({ f: typeof f === 'number' ? q(f) : f, e });
/** (e)/d written with a fraction bar; sign -1 puts a minus in front of the bar */
export const BAR = (d: number, sign: 1 | -1, ...e: Term[]): MGrp => ({ f: rat(sign, d), e, bar: true });
export const eq = (L: Side, R: Side, fmt: Fmt = 'frac'): Eq => ({ L, R, fmt });
export { isGrp, sideLin, solve, valueAt, isZ, num, neg };
export const qSub = (a: Q, b: Q): Q => qAdd(a, neg(b));
export const qAbs = (a: Q): Q => rat(Math.abs(a.p), a.q);
export const ZERO = rat(0), ONE = rat(1);

// ---------- numbers as text ----------
/** |a| as TeX: 4, \dfrac{1}{2} (big) or \tfrac{1}{2}, 0.4 (dec) */
export function magT(a: Q, fmt: Fmt = 'frac', big = true): string {
  const m = qAbs(a);
  if (m.q === 1) return String(m.p);
  if (fmt === 'dec') { const s = decStr(m); if (s) return s; }
  return big ? `\\dfrac{${m.p}}{${m.q}}` : `\\tfrac{${m.p}}{${m.q}}`;
}
export function magH(a: Q, fmt: Fmt = 'frac'): string {
  const m = qAbs(a);
  if (m.q === 1) return String(m.p);
  if (fmt === 'dec') { const s = decStr(m); if (s) return s; }
  return fr(m.p, m.q);
}
/** a signed number: HTML with a real minus, TeX, plain text (logs) */
export const nH = (a: Q | number, fmt: Fmt = 'frac') => { const c = typeof a === 'number' ? q(a) : a; return (c.p < 0 ? '−' : '') + magH(c, fmt); };
export const nT = (a: Q | number, fmt: Fmt = 'frac', big = true) => { const c = typeof a === 'number' ? q(a) : a; return (c.p < 0 ? '-' : '') + magT(c, fmt, big); };
export const nPlain = (a: Q) => (a.q === 1 ? String(a.p) : decStr(a) ?? `${a.p}/${a.q}`);
/** a mixed number as HTML: 5 1/3 */
export function mixedH(a: Q): string {
  const m = qAbs(a), w = Math.floor(m.p / m.q), r = m.p % m.q;
  return (a.p < 0 ? '−' : '') + (r === 0 ? String(w) : `${w ? w + '&#8202;' : ''}${fr(r, m.q)}`);
}
/** money: $4.50 */
export const usd = (v: number) => `$${(Math.round(v * 100) / 100).toFixed(Number.isInteger(Math.round(v * 100) / 100) ? 0 : 2)}`;

// ---------- sides and equations as text ----------
const XT = 'x', XH = '<i>x</i>';
function bodyT(t: MTerm, fmt0: Fmt, big: boolean, tag: boolean): string {
  let s: string;
  const fmt = t.fmt ?? fmt0;
  if (t.raw) s = (big ? `\\dfrac{${t.raw[0]}}{${t.raw[1]}}` : `\\tfrac{${t.raw[0]}}{${t.raw[1]}}`) + (t.v === 'x' ? XT : '');
  else if (t.v === '') s = magT(t.c, fmt, big);
  else {
    const m = qAbs(t.c);
    if (qEq(m, ONE)) s = XT;
    else if (t.look === 'over' && m.q > 1) s = `\\dfrac{${m.p === 1 ? '' : m.p}${XT}}{${m.q}}`;
    else if (t.look === 'mixed' && m.q > 1 && m.p > m.q) s = `${Math.floor(m.p / m.q)}\\tfrac{${m.p % m.q}}{${m.q}}\\,${XT}`;
    else s = magT(m, fmt, big) + XT;
  }
  return tag ? `\\cssId{${t.v === 'x' ? 'tx' : 'tn'}}{${s}}` : s;
}
function bodyHt(t: MTerm, fmt0: Fmt): string {
  const fmt = t.fmt ?? fmt0;
  if (t.raw) return fr(t.raw[0], t.raw[1]) + (t.v === 'x' ? XH : '');
  if (t.v === '') return magH(t.c, fmt);
  const m = qAbs(t.c);
  if (qEq(m, ONE)) return XH;
  if (t.look === 'over' && m.q > 1) return fr(`${m.p === 1 ? '' : m.p}${XH}`, m.q);
  if (t.look === 'mixed' && m.q > 1 && m.p > m.q) return `${Math.floor(m.p / m.q)}&#8202;${fr(m.p % m.q, m.q)}&#8202;${XH}`;
  return magH(m, fmt) + XH;
}
const inner = (e: Term[], f: (t: MTerm) => string, minus: string) => e.map((t, i) => (i === 0 ? (t.c.p < 0 ? minus : '') : ` ${t.c.p < 0 ? minus : '+'} `) + f(t)).join('');
const signOf = (p: Piece) => (isGrp(p) ? p.f.p : p.c.p) < 0;
/** a side as TeX in written order (big = \dfrac for the board; tag = \cssId{tx} on x-terms, {tn} on numbers) */
export function sideT(s: Side, fmt: Fmt = 'frac', o: { big?: boolean; tag?: boolean } = {}): string {
  const big = o.big ?? true, tag = !!o.tag;
  if (!s.length) return '0';
  return s.map((p, i) => {
    let body: string;
    if (isGrp(p)) {
      const g = p as MGrp, inT = inner(g.e, t => bodyT(t, fmt, big, tag), '-');
      if (g.bar) body = `\\dfrac{${inT}}{${g.f.q}}`;
      else { const fm = qEq(qAbs(g.f), ONE) ? '' : magT(g.f, fmt, big); body = `${fm}(${inT})`; }
    } else body = bodyT(p as MTerm, fmt, big, tag);
    if (i === 0) return (signOf(p) ? '-' : '') + body;
    return ` ${signOf(p) ? '-' : '+'} ${body}`;
  }).join('');
}
export function sideH(s: Side, fmt: Fmt = 'frac'): string {
  if (!s.length) return '0';
  return s.map((p, i) => {
    let body: string;
    if (isGrp(p)) {
      const g = p as MGrp, gf = g.fmt ?? fmt, inH = inner(g.e, t => bodyHt(t, gf), '−');
      if (g.bar) body = fr(inH, g.f.q);
      else { const fm = qEq(qAbs(g.f), ONE) ? '' : magH(g.f, gf); body = `${fm}(${inH})`; }
    } else body = bodyHt(p as MTerm, fmt);
    if (i === 0) return (signOf(p) ? '−' : '') + body;
    return ` ${signOf(p) ? '−' : '+'} ${body}`;
  }).join('');
}
export const eqT = (e: Eq, o: { big?: boolean; tag?: boolean } = {}) => `${sideT(e.L, e.fmt, o)} = ${sideT(e.R, e.fmt, o)}`;
export const eqH = (e: Eq) => `${sideH(e.L, e.fmt)} = ${sideH(e.R, e.fmt)}`;
/** a linear side mx + k as pieces (x first; 0 when both vanish) */
export function lin(m: Q, k: Q): Side { const s: Side = []; if (!isZ(m)) s.push(X(m)); if (!isZ(k) || !s.length) s.push(N(k)); return s; }
/** the side collected: mx + k */
export const collected = (s: Side): Side => { const l = sideLin(s); return lin(l.m, l.k); };
/** the value of a side with x = v, as a step-by-step substitution (HTML): 3/4(8) + 2 */
export function subH(s: Side, v: Q, fmt: Fmt = 'frac'): string {
  const vs = `(${nH(v, fmt)})`;
  return sideH(s, fmt).split(XH).join(vs);
}

// ---------- clearing multipliers ----------
const gcd = (a: number, b: number): number => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
export const lcm = (a: number, b: number) => (a / gcd(a, b)) * b;
/** every coefficient as it acts on x or 1 (a group contributes f·e for each inner term) */
export function coefs(e: Eq): Q[] { return [...e.L, ...e.R].flatMap(p => (isGrp(p) ? p.e.map(t => qMul(p.f, t.c)) : [p.c])); }
/** the least positive whole number that makes every coefficient whole (LCM of the reduced denominators) */
export const leastClear = (e: Eq) => coefs(e).reduce((m, c) => lcm(m, c.q), 1);
/** does multiplying by M make every coefficient whole? */
export const clears = (e: Eq, M: number) => M !== 0 && coefs(e).every(c => (c.p * M) % c.q === 0);
/** the smallest power of 10 that clears it (decimals), or 0 when none does (a third, a sixth) */
export function pow10Clear(e: Eq): number { for (const t of [1, 10, 100, 1000]) if (clears(e, t)) return t; return 0; }
/** multiply EVERY piece on both sides by M (a group's factor carries it) */
export function scaleSide(s: Side, M: Q): Side { return s.map(p => (isGrp(p) ? { f: qMul(p.f, M), e: p.e } : { c: qMul(p.c, M), v: p.v })); }
export const scaleEq = (e: Eq, M: Q | number): Eq => { const m = typeof M === 'number' ? q(M) : M; return { L: scaleSide(e.L, m), R: scaleSide(e.R, m), fmt: e.fmt }; };
/** the slip: multiply only the x-terms and fraction terms, leave whole-number constants as they are */
export function scaleSome(e: Eq, M: number): Eq {
  const m = q(M), sc = (s: Side): Side => s.map(p => (isGrp(p) ? { f: qMul(p.f, m), e: p.e } : p.v === 'x' || p.c.q !== 1 ? { c: qMul(p.c, m), v: p.v } : p));
  return { L: sc(e.L), R: sc(e.R), fmt: e.fmt };
}
/** the side after clearing by M, written whole: groups keep their parentheses (2(x - 1)), terms are scaled */
export const clearedEq = (e: Eq, M: number): Eq => { const s = scaleEq(e, M); return { ...s, fmt: 'frac' }; };
/** does the equation hold for the value v? */
export const holds = (e: Eq, v: Q) => qEq(valueAt(e.L, v), valueAt(e.R, v));
export type Kind = 'one' | 'none' | 'all';
export const kindOf = (e: Eq): Kind => solve(e).kind;
export const solOf = (e: Eq): Q => { const s = solve(e); if (s.kind !== 'one') throw new Error('one solution expected'); return s.x; };

// ---------- the balance picture of an equation (by value: pieces of bags and balls) ----------
/** what each pan holds by value: x = bags (may be a fraction of a bag), n = balls (may be a fraction of a ball) */
export interface PanVal { x: Q; n: Q }
export interface ClearPic { L: PanVal; R: PanVal; k: number }
/** whole numbers on the pans after k copies */
export function cleared(p: ClearPic): { a: number; b: number; c: number; d: number } {
  const w = (v: Q) => (v.p * p.k) / v.q;
  return { a: w(p.L.x), b: w(p.L.n), c: w(p.R.x), d: w(p.R.n) };
}
