// idm.ts: exact maths for "Polynomial operations and identities" (no DOM). Polynomials in several letters with
// exact rational coefficients (core/math Q), and a small expression tree (sums, products, powers, opposites) that is
// written as TeX / HTML exactly as built AND expanded exactly, so every choice the lesson shows can be compared with
// the answer as a polynomial (two different-looking choices that expand to the same polynomial are the same answer).
// HTML exponents are <sup>; a hair space follows an exponent that is followed by a letter (plain text x^2 y).
import { type Q, qAdd, qMul, qNum, rat } from '../../../core/math';
import { fr } from '../../runtime/item';

export type { Q };
/** the letters, in standard-form order (a before b, x before y) */
export const VARS = ['a', 'b', 'c', 'd', 'm', 'n', 'p', 'q', 's', 't', 'u', 'v', 'x', 'y'] as const;
export type Var = (typeof VARS)[number];
const NV = VARS.length;
export interface Mono { c: Q; e: readonly number[] }
export type P = Mono[];

const ZQ = rat(0);
export const qq = (p: number, d = 1): Q => rat(p, d);
const zeroE = () => new Array<number>(NV).fill(0);
const ekey = (e: readonly number[]) => e.join(',');
export const tdeg = (m: Mono) => m.e.reduce((s, v) => s + v, 0);

/** one term: coefficient and letters, e.g. M(3, 'x2y') = 3x²y, M(-1, 'ab') = −ab, M(9) = 9 */
export function M(c: number | Q, vars = ''): Mono {
  const e = zeroE();
  for (const t of vars.matchAll(/([a-z])(\d*)/g)) {
    const i = VARS.indexOf(t[1] as Var);
    if (i < 0) throw new Error(`idm: unknown letter ${t[1]}`);
    e[i] = e[i]! + (t[2] ? Number(t[2]) : 1);
  }
  return { c: typeof c === 'number' ? rat(c) : c, e };
}
/** a polynomial from a short string: pp('x2 + 2xy - 3'), pp('1/2x - 4'), pp('-a2 + 2ab - b2') */
export function pp(s: string): P {
  const out: P = [];
  const src = s.replace(/\s+/g, '').replace(/−/g, '-');
  for (const m of src.matchAll(/([+-]?)(\d+(?:\/\d+)?)?((?:[a-z]\d*)*)/g)) {
    if (!m[0]) continue;
    const sg = m[1] === '-' ? -1 : 1;
    let c = rat(sg);
    if (m[2]) { const [n, d] = m[2].split('/'); c = rat(sg * Number(n), d ? Number(d) : 1); }
    out.push(M(c, m[3] ?? ''));
  }
  return out;
}
export const mulM = (a: Mono, b: Mono): Mono => ({ c: qMul(a.c, b.c), e: a.e.map((v, i) => v + b.e[i]!) });
export const negP = (p: P): P => p.map(m => ({ ...m, c: rat(-m.c.p, m.c.q) }));
export const addP = (...ps: P[]): P => ps.flat();
export const subP = (a: P, b: P): P => [...a, ...negP(b)];
export const mulP = (a: P, b: P): P => a.flatMap(s => b.map(t => mulM(s, t)));
export function powP(a: P, n: number): P { let r: P = [M(1)]; for (let i = 0; i < n; i++) r = collect(mulP(r, a)); return r; }
/** standard form: descending total degree, then a before b before ... (x²y before xy²) */
export function sortStd(p: P): P {
  return p.slice().sort((A, B) => tdeg(B) - tdeg(A) || cmpE(B.e, A.e));
}
function cmpE(a: readonly number[], b: readonly number[]): number { for (let i = 0; i < NV; i++) if (a[i] !== b[i]) return a[i]! - b[i]!; return 0; }
/** like terms add, zero terms leave, standard form */
export function collect(p: P): P {
  const m = new Map<string, Mono>();
  for (const t of p) { const k = ekey(t.e), o = m.get(k); m.set(k, o ? { c: qAdd(o.c, t.c), e: o.e } : t); }
  return sortStd([...m.values()].filter(t => t.c.p !== 0));
}
export function equalP(a: P, b: P): boolean {
  const A = collect(a), B = collect(b);
  return A.length === B.length && A.every((t, i) => ekey(t.e) === ekey(B[i]!.e) && t.c.p === B[i]!.c.p && t.c.q === B[i]!.c.q);
}
export const isZeroP = (p: P) => collect(p).length === 0;
export function degreeP(p: P): number | null { const c = collect(p); return c.length ? Math.max(...c.map(tdeg)) : null; }
/** the coefficient of one term (by its letters) after collecting */
export function coefP(p: P, vars = ''): Q { const k = ekey(M(1, vars).e); return collect(p).find(t => ekey(t.e) === k)?.c ?? ZQ; }
export type Env = Partial<Record<Var, number | Q>>;
/** exact value at given numbers (letters not given count as 0) */
export function evalP(p: P, env: Env): Q {
  let s = ZQ;
  for (const t of p) {
    let v = t.c;
    t.e.forEach((n, i) => { if (!n) return; const x = env[VARS[i]!] ?? 0; const xq = typeof x === 'number' ? rat(x) : x; for (let k = 0; k < n; k++) v = qMul(v, xq); });
    s = qAdd(s, v);
  }
  return s;
}
export const valP = (p: P, env: Env) => qNum(evalP(p, env));
/** the letters a polynomial uses */
export const lettersOf = (p: P): Var[] => VARS.filter((_, i) => p.some(t => t.e[i]! > 0));

// ---------- writing polynomials ----------
const MINUS = '−';
function varTex(e: readonly number[]): string { return e.map((n, i) => (n === 0 ? '' : n === 1 ? VARS[i]! : `${VARS[i]}^{${n}}`)).join(''); }
function varHtml(e: readonly number[]): string {
  let s = '';
  e.forEach((n, i) => {
    if (!n) return;
    const v = `<i>${VARS[i]}</i>`;
    if (s.endsWith('</sup>')) s += '&#8202;';
    s += n === 1 ? v : `${v}<sup>${n}</sup>`;
  });
  return s;
}
function absTex(t: Mono): string {
  const a = Math.abs(t.c.p), d = t.c.q, v = varTex(t.e);
  if (d !== 1) return `\\tfrac{${a}}{${d}}${v}`;
  return !v ? String(a) : (a === 1 ? '' : String(a)) + v;
}
function absHtml(t: Mono): string {
  const a = Math.abs(t.c.p), d = t.c.q, v = varHtml(t.e);
  if (d !== 1) return v ? `${fr(a, d)}&#8202;${v}` : fr(a, d);
  return !v ? String(a) : (a === 1 ? '' : String(a)) + v;
}
const isNeg = (t: Mono) => t.c.p < 0;
export const monoTex = (t: Mono) => (isNeg(t) ? '-' : '') + absTex(t);
export const monoHtml = (t: Mono) => (isNeg(t) ? MINUS : '') + absHtml(t);
/** a polynomial in its written order; the zero polynomial is 0 */
export function polyTex(p: P): string { return p.length ? p.map((t, i) => (i === 0 ? monoTex(t) : (isNeg(t) ? ' - ' : ' + ') + absTex(t))).join('') : '0'; }
export function polyHtml(p: P): string { return p.length ? p.map((t, i) => (i === 0 ? monoHtml(t) : (isNeg(t) ? ` ${MINUS} ` : ' + ') + absHtml(t))).join('') : '0'; }
export const stdTex = (p: P) => polyTex(collect(p));
export const stdHtml = (p: P) => polyHtml(collect(p));
/** numbers with a real minus (HTML) */
export const nH = (v: number) => (v < 0 ? MINUS + Math.abs(v) : String(v));
export const qH = (a: Q) => (a.p < 0 ? MINUS : '') + (a.q === 1 ? String(Math.abs(a.p)) : fr(Math.abs(a.p), a.q));
export const V = (s: string) => `<i>${s}</i>`;

// ===================== expressions: written as built, expanded exactly =====================
export type Ex =
  | { t: 'P'; p: P }                                 // a polynomial in written order (one term or a sum)
  | { t: 'mul'; f: Ex[] }                            // a product, factors side by side
  | { t: 'pow'; b: Ex; n: number }                   // a power
  | { t: 'add'; a: Ex; op: '+' | '-'; b: Ex }        // a sum or difference of two expressions
  | { t: 'neg'; e: Ex }                              // the opposite of an expression
  | { t: 'grp'; e: Ex };                             // explicit brackets around a chunk: ((x + 1) + 3)
/** a polynomial as written; zero terms are left out (never "x + 0"), the zero polynomial stays 0 */
export const E = (p: P | string): Ex => {
  const q = (typeof p === 'string' ? pp(p) : p).filter(t => t.c.p !== 0);
  return { t: 'P', p: q.length ? q : [M(0)] };
};
export const mul = (...f: (Ex | string)[]): Ex => ({ t: 'mul', f: f.map(x => (typeof x === 'string' ? E(x) : x)) });
export const pow = (b: Ex | string, n: number): Ex => ({ t: 'pow', b: typeof b === 'string' ? E(b) : b, n });
export const plus = (a: Ex | string, b: Ex | string): Ex => ({ t: 'add', a: typeof a === 'string' ? E(a) : a, op: '+', b: typeof b === 'string' ? E(b) : b });
export const minus = (a: Ex | string, b: Ex | string): Ex => ({ t: 'add', a: typeof a === 'string' ? E(a) : a, op: '-', b: typeof b === 'string' ? E(b) : b });
export const opp = (e: Ex | string): Ex => ({ t: 'neg', e: typeof e === 'string' ? E(e) : e });
export const grp = (e: Ex | string): Ex => ({ t: 'grp', e: typeof e === 'string' ? E(e) : e });
/** expand to a collected polynomial */
export function ex(e: Ex): P {
  switch (e.t) {
    case 'P': return collect(e.p);
    case 'mul': return collect(e.f.reduce<P>((acc, f) => mulP(acc, ex(f)), [M(1)]));
    case 'pow': return powP(ex(e.b), e.n);
    case 'add': return collect(e.op === '+' ? addP(ex(e.a), ex(e.b)) : subP(ex(e.a), ex(e.b)));
    case 'neg': return negP(ex(e.e));
    case 'grp': return ex(e.e);
  }
}
const isSum = (e: Ex): boolean => (e.t === 'P' && e.p.length > 1) || e.t === 'add';
const startsNeg = (e: Ex): boolean => (e.t === 'P' ? !!e.p[0] && isNeg(e.p[0]) : e.t === 'neg' ? true : e.t === 'mul' ? startsNeg(e.f[0]!) : e.t === 'add' ? startsNeg(e.a) : e.t === 'pow' ? false : false);
const isNumber = (e: Ex): boolean => e.t === 'P' && e.p.length === 1 && e.p[0]!.e.every(v => v === 0);
/** a power's base needs brackets unless it is a single letter or a positive whole number */
function bareBase(e: Ex): boolean {
  if (e.t !== 'P' || e.p.length !== 1) return false;
  const t = e.p[0]!, nv = t.e.filter(v => v > 0).length;
  if (nv === 0) return t.c.q === 1 && t.c.p >= 0;
  return nv === 1 && t.c.p === 1 && t.c.q === 1 && t.e.every(v => v <= 1);
}
type W = { tex: string; html: string };
function wr(e: Ex): W {
  switch (e.t) {
    case 'P': return { tex: polyTex(e.p), html: polyHtml(e.p) };
    case 'mul': {
      let tx = '', h = '';
      e.f.forEach((f, i) => {
        const w = wr(f);
        // a negative factor is bracketed after another factor, and also first when every factor is one term
        const allMono = e.f.every(g => g.t === 'P' && g.p.length === 1);
        const br = isSum(f) || ((i > 0 || allMono) && startsNeg(f) && e.f.length > 1) || f.t === 'neg';
        const ft = br ? `(${w.tex})` : w.tex, fh = br ? `(${w.html})` : w.html;
        // a number after something else, or two bare factors that would run together into one number: a dot
        const dot = i > 0 && !br && (isNumber(f) || /^\d/.test(ft));
        tx += (dot ? ' \\cdot ' : '') + ft; h += (dot ? ' · ' : '') + fh;
      });
      return { tex: tx, html: h };
    }
    case 'pow': {
      const w = wr(e.b), br = !bareBase(e.b) && e.b.t !== 'grp';
      return { tex: br ? `(${w.tex})^{${e.n}}` : `${w.tex}^{${e.n}}`, html: br ? `(${w.html})<sup>${e.n}</sup>` : `${w.html}<sup>${e.n}</sup>` };
    }
    case 'add': {
      const a = wr(e.a);
      // a one-term negative polynomial after +: write it as − |term|
      if (e.b.t === 'P' && e.b.p.length === 1 && isNeg(e.b.p[0]!)) {
        const t = e.b.p[0]!, op = e.op === '+' ? '-' : '+', abs = { ...t, c: rat(-t.c.p, t.c.q) };
        return { tex: `${a.tex} ${op} ${absTex(abs)}`, html: `${a.html} ${op === '-' ? MINUS : '+'} ${absHtml(abs)}` };
      }
      const b = wr(e.b);
      const br = (e.op === '-' && isSum(e.b)) || startsNeg(e.b);
      return { tex: `${a.tex} ${e.op} ${br ? `(${b.tex})` : b.tex}`, html: `${a.html} ${e.op === '-' ? MINUS : '+'} ${br ? `(${b.html})` : b.html}` };
    }
    case 'grp': { const w = wr(e.e); return { tex: `(${w.tex})`, html: `(${w.html})` }; }
    case 'neg': {
      const w = wr(e.e), br = isSum(e.e) || startsNeg(e.e);
      return { tex: br ? `-(${w.tex})` : `-${w.tex}`, html: br ? `${MINUS}(${w.html})` : `${MINUS}${w.html}` };
    }
  }
}
export const exTex = (e: Ex) => wr(e).tex;
export const exHtml = (e: Ex) => wr(e).html;
export const sameEx = (a: Ex, b: Ex) => equalP(ex(a), ex(b));
/** an equation "L = R" holds for every value exactly when L − R expands to 0 */
export const isIdentity = (L: Ex, R: Ex) => isZeroP(subP(ex(L), ex(R)));
/** a numeric value of an expression */
export const valEx = (e: Ex, env: Env) => valP(ex(e), env);
