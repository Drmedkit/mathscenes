// ineq.ts: the exact maths of one-step equations and inequalities with signed rational numbers.
//   N            exact rationals (integer numerator / denominator, reduced, den > 0), from integers or decimals
//   OneStep      x + p REL q, x − p REL q, p·x REL q, x / p REL q (unknown on either side, p first or second)
//   solve(f)     the solution x REL' b, the inverse step and whether the symbol reverses (only × or ÷ by p < 0)
//   holds(f, x)  does the number x make the statement true (substitution, used to check every solve in the tests)
//   tex / html   the statement and numbers as TeX (board) and HTML (panel), with a real minus sign
// Pure: no DOM, no canvas.
import { fr } from '../../runtime/item';

// ---------- exact rationals ----------
export interface N { readonly n: number; readonly d: number }
const gcd = (a: number, b: number): number => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
export function N(n: number, d = 1): N {
  if (!Number.isInteger(n) || !Number.isInteger(d) || d === 0) throw new RangeError(`N: ${n}/${d} is not a fraction of integers`);
  const s = d < 0 ? -1 : 1, g = gcd(n, d);
  return { n: (s * n) / g || 0, d: (s * d) / g };
}
/** an exact rational from a decimal literal (up to 4 places) */
export function dec(x: number): N {
  for (let k = 0; k <= 4; k++) { const m = 10 ** k, v = Math.round(x * m); if (Math.abs(v / m - x) < 1e-9) return N(v, m); }
  throw new RangeError(`dec: ${x} has more than 4 decimal places`);
}
export const add = (a: N, b: N): N => N(a.n * b.d + b.n * a.d, a.d * b.d);
export const sub = (a: N, b: N): N => N(a.n * b.d - b.n * a.d, a.d * b.d);
export const mul = (a: N, b: N): N => N(a.n * b.n, a.d * b.d);
export function div(a: N, b: N): N { if (b.n === 0) throw new RangeError('div: division by 0'); return N(a.n * b.d, a.d * b.n); }
export const neg = (a: N): N => N(-a.n, a.d);
export const abs = (a: N): N => N(Math.abs(a.n), a.d);
export const cmp = (a: N, b: N): number => Math.sign(a.n * b.d - b.n * a.d);
export const eq = (a: N, b: N): boolean => a.n === b.n && a.d === b.d;
export const val = (a: N): number => a.n / a.d;
export const isInt = (a: N): boolean => a.d === 1;
/** the denominator has only the factors 2 and 5 (a terminating decimal) */
export function terminates(a: N): boolean { let d = a.d; while (d % 2 === 0) d /= 2; while (d % 5 === 0) d /= 5; return d === 1; }
/** the decimal digits of a terminating rational, without trailing zeros */
export function decStr(a: N): string {
  if (!terminates(a)) throw new RangeError(`decStr: ${a.n}/${a.d} does not terminate`);
  for (let k = 0; k <= 8; k++) { const s = Math.abs(a.n / a.d).toFixed(k); if (Math.abs(Number(s) - Math.abs(a.n / a.d)) < 1e-12) return s; }
  return String(Math.abs(a.n / a.d));
}
/** decimals where they terminate ('dec'), fractions otherwise or when asked ('frac') */
export type Style = 'dec' | 'frac';
const useDec = (a: N, st: Style) => isInt(a) || (st === 'dec' && terminates(a));
/** TeX: -5, -3.75, -\tfrac{2}{3} */
export function nTex(a: N, st: Style = 'dec'): string {
  const s = a.n < 0 ? '-' : '';
  if (useDec(a, st)) return s + decStr(a);
  return `${s}\\tfrac{${Math.abs(a.n)}}{${a.d}}`;
}
/** HTML with a real minus sign and stacked fractions */
export function nHtml(a: N, st: Style = 'dec'): string {
  const s = a.n < 0 ? '−' : '';
  if (useDec(a, st)) return s + decStr(a);
  return s + fr(Math.abs(a.n), a.d);
}
/** plain text for logs and answers: -3.75, -2/3 */
export function nPlain(a: N, st: Style = 'dec'): string {
  const s = a.n < 0 ? '-' : '';
  if (useDec(a, st)) return s + decStr(a);
  return `${s}${Math.abs(a.n)}/${a.d}`;
}
/** a number in brackets when it is negative (after an operation sign) */
const parT = (a: N, st: Style) => (a.n < 0 ? `(${nTex(a, st)})` : nTex(a, st));
const parH = (a: N, st: Style) => (a.n < 0 ? `(${nHtml(a, st)})` : nHtml(a, st));

// ---------- relations ----------
export type Rel = '<' | '<=' | '>' | '>=' | '=';
export const REL_TEX: Record<Rel, string> = { '<': '<', '<=': '\\le', '>': '>', '>=': '\\ge', '=': '=' };
export const REL_HTML: Record<Rel, string> = { '<': '&lt;', '<=': '≤', '>': '&gt;', '>=': '≥', '=': '=' };
/** the reversed order (multiplying or dividing by a negative) */
export const flip = (r: Rel): Rel => ({ '<': '>', '<=': '>=', '>': '<', '>=': '<=', '=': '=' } as const)[r];
/** the same statement read from the other side: a < b is b > a (identical to flip, named for its meaning) */
export const mirror = flip;
export const strict = (r: Rel) => r === '<' || r === '>';
/** does a REL b hold? */
export function rel(a: N, r: Rel, b: N): boolean {
  const c = cmp(a, b);
  return r === '<' ? c < 0 : r === '<=' ? c <= 0 : r === '>' ? c > 0 : r === '>=' ? c >= 0 : c === 0;
}
/** which way the solutions run from the boundary: +1 right (x > b), -1 left (x < b), 0 just the point */
export const dirOf = (r: Rel): -1 | 0 | 1 => (r === '>' || r === '>=' ? 1 : r === '<' || r === '<=' ? -1 : 0);

// ---------- one-step statements ----------
export type Op = 'add' | 'sub' | 'mul' | 'div';
export interface OneStep {
  op: Op;
  /** the number next to the unknown */ p: N;
  /** the other side */ q: N;
  /** the relation read with the unknown's side on the LEFT */ rel: Rel;
  /** the unknown's name */ v?: string;
  /** shown as q REL' (expression): the unknown on the right */ right?: boolean;
  /** add only: shown as p + x */ pFirst?: boolean;
  st?: Style;
}
export interface Solved {
  rel: Rel; b: N;
  /** the inverse step done to both sides */ inv: { op: Op; by: N };
  /** the symbol reverses (× or ÷ by a negative number) */ flips: boolean;
}
export function solve(f: OneStep): Solved {
  if ((f.op === 'mul' || f.op === 'div') && f.p.n === 0) throw new RangeError('solve: p cannot be 0');
  const b = f.op === 'add' ? sub(f.q, f.p) : f.op === 'sub' ? add(f.q, f.p) : f.op === 'mul' ? div(f.q, f.p) : mul(f.q, f.p);
  const flips = (f.op === 'mul' || f.op === 'div') && f.p.n < 0;
  const inv = { op: ({ add: 'sub', sub: 'add', mul: 'div', div: 'mul' } as const)[f.op], by: f.p };
  return { rel: flips ? flip(f.rel) : f.rel, b, inv, flips };
}
/** the value of the unknown's side for a number x */
export function lhs(f: OneStep, x: N): N {
  return f.op === 'add' ? add(x, f.p) : f.op === 'sub' ? sub(x, f.p) : f.op === 'mul' ? mul(f.p, x) : div(x, f.p);
}
export const holds = (f: OneStep, x: N): boolean => rel(lhs(f, x), f.rel, f.q);

/** the unknown's side as TeX */
export function exprTex(f: OneStep): string {
  const v = f.v ?? 'x', st = f.st ?? 'dec';
  if (f.op === 'add') return f.pFirst ? `${nTex(f.p, st)} + ${v}` : `${v} + ${parT(f.p, st)}`;
  if (f.op === 'sub') return `${v} - ${parT(f.p, st)}`;
  if (f.op === 'mul') return coefTex(f.p, st) + v;
  return `\\frac{${v}}{${nTex(f.p, st)}}`;
}
export function exprHtml(f: OneStep): string {
  const v = `<i>${f.v ?? 'x'}</i>`, st = f.st ?? 'dec';
  if (f.op === 'add') return f.pFirst ? `${nHtml(f.p, st)} + ${v}` : `${v} + ${parH(f.p, st)}`;
  if (f.op === 'sub') return `${v} − ${parH(f.p, st)}`;
  if (f.op === 'mul') return coefHtml(f.p, st) + v;
  return fr(v, nHtml(f.p, st));
}
function coefTex(p: N, st: Style): string {
  if (eq(p, N(1))) return '';
  if (eq(p, N(-1))) return '-';
  return nTex(p, st);
}
function coefHtml(p: N, st: Style): string {
  if (eq(p, N(1))) return '';
  if (eq(p, N(-1))) return '−';
  return nHtml(p, st);
}
/** the whole statement as TeX: x + 5 > 2, or 12 < x + 5 when the unknown is on the right */
export function stTex(f: OneStep): string {
  const st = f.st ?? 'dec';
  return f.right ? `${nTex(f.q, st)} ${REL_TEX[mirror(f.rel)]} ${exprTex(f)}` : `${exprTex(f)} ${REL_TEX[f.rel]} ${nTex(f.q, st)}`;
}
export function stHtml(f: OneStep): string {
  const st = f.st ?? 'dec';
  return f.right ? `${nHtml(f.q, st)} ${REL_HTML[mirror(f.rel)]} ${exprHtml(f)}` : `${exprHtml(f)} ${REL_HTML[f.rel]} ${nHtml(f.q, st)}`;
}
/** x REL b */
export const solTex = (v: string, r: Rel, b: N, st: Style = 'dec') => `${v} ${REL_TEX[r]} ${nTex(b, st)}`;
export const solHtml = (v: string, r: Rel, b: N, st: Style = 'dec') => `<i>${v}</i> ${REL_HTML[r]} ${nHtml(b, st)}`;

/** the inverse step in words: "subtract 5 from both sides", "divide both sides by −2" */
export function invWords(f: OneStep): string {
  const st = f.st ?? 'dec', p = f.p;
  if (f.op === 'add') return p.n < 0 ? `add ${nHtml(abs(p), st)} to both sides` : `subtract ${nHtml(p, st)} from both sides`;
  if (f.op === 'sub') return p.n < 0 ? `subtract ${nHtml(abs(p), st)} from both sides (− (${nHtml(p, st)}) is + ${nHtml(abs(p), st)})` : `add ${nHtml(p, st)} to both sides`;
  if (f.op === 'mul') return `divide both sides by ${nHtml(p, st)}`;
  return `multiply both sides by ${nHtml(p, st)}`;
}
/** the inverse step as TeX for the board: "\div (-2)", "- 5", "\times 3" */
export function invTex(f: OneStep): string {
  const st = f.st ?? 'dec', p = f.p;
  if (f.op === 'add') return p.n < 0 ? `+ ${nTex(abs(p), st)}` : `- ${nTex(p, st)}`;
  if (f.op === 'sub') return p.n < 0 ? `- ${nTex(abs(p), st)}` : `+ ${nTex(p, st)}`;
  if (f.op === 'mul') return `\\div ${parT(p, st)}`;
  return `\\times ${parT(p, st)}`;
}
/** a negative number shows anywhere in the statement (the trigger of reverses-for-any-negative-sign) */
export const showsNegative = (f: OneStep): boolean => f.p.n < 0 || f.q.n < 0;
/** the inverse step written on both sides, with the symbol it leaves: "x - 4 + 4 \le 20 + 4", "-3x \div (-3) \ge 12 \div (-3)" */
export function stepTex(f: OneStep): string {
  const s = solve(f), st = f.st ?? 'dec', inv = invTex(f);
  return `${exprTex(f)} ${inv} ${REL_TEX[s.rel]} ${nTex(f.q, st)} ${inv}`;
}
