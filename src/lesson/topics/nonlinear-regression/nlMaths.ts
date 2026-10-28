// nlMaths.ts: the exact maths of "Quadratic and exponential regression" (HS Statistics 3). Pure: no DOM.
//   QuadReg      least squares of y on (x², x, 1): the normal equations, solved with x centred (stable for years)
//   ExpReg (TI)  least squares of ln y on x (log-response convention): a = e^A, b = e^B; needs every y > 0
//   Desmos y~ab^x (default, original scale) least squares of y itself: Gauss-Newton from the ExpReg start
//   PwrReg (TI)  least squares of ln y on ln x: y = a·x^b; needs every x > 0 and y > 0
//   sqrt model   y = a√x + k with h fixed at 0: least squares of y on √x (a line in √x)
//   residual     e = y − ŷ on the ORIGINAL response scale (models are compared there whatever the fitting convention)
// Rounding: half away from zero to the places an item names; generators reject values within 2% of a rounding unit
// of a .x5 tie (tieFree from linear-regression/regMaths), so an independent float recomputation rounds the same way.
import { lsrl, r9, rd, tieFree } from '../linear-regression/regMaths';

export { lsrl, r9, rd, tieFree };

export type Fam = 'lin' | 'quad' | 'exp' | 'sqrt' | 'pwr';
/** a model: lin [a, b] = a + bx; quad [a, b, c] = ax² + bx + c; exp [a, b] = a·b^x; sqrt [a, k] = a√x + k; pwr [a, b] = a·x^b */
export interface Model { fam: Fam; p: readonly number[] }
export function evalM(m: Model, x: number): number {
  const p = m.p;
  switch (m.fam) {
    case 'lin': return p[0]! + p[1]! * x;
    case 'quad': return p[0]! * x * x + p[1]! * x + p[2]!;
    case 'exp': return p[0]! * p[1]! ** x;
    case 'sqrt': return x < 0 ? NaN : p[0]! * Math.sqrt(x) + p[1]!;
    case 'pwr': return x < 0 ? NaN : p[0]! * x ** p[1]!;
  }
}
export const fnOf = (m: Model) => (x: number) => evalM(m, x);
export const resid = (m: Model, xs: readonly number[], ys: readonly number[]): number[] => xs.map((x, i) => ys[i]! - evalM(m, x));
export const sse = (m: Model, xs: readonly number[], ys: readonly number[]): number => resid(m, xs, ys).reduce((s, e) => s + e * e, 0);
export const sst = (ys: readonly number[]): number => { const yb = ys.reduce((s, v) => s + v, 0) / ys.length; return ys.reduce((s, v) => s + (v - yb) ** 2, 0); };

// ---------- regressions ----------
function solve3(M: number[][], v: number[]): number[] {
  const A = M.map((r, i) => [...r, v[i]!]);
  for (let c = 0; c < 3; c++) {
    let p = c; for (let r = c + 1; r < 3; r++) if (Math.abs(A[r]![c]!) > Math.abs(A[p]![c]!)) p = r;
    [A[c], A[p]] = [A[p]!, A[c]!];
    for (let r = 0; r < 3; r++) if (r !== c) { const f = A[r]![c]! / A[c]![c]!; for (let k = c; k < 4; k++) A[r]![k]! -= f * A[c]![k]!; }
  }
  return [0, 1, 2].map(i => A[i]![3]! / A[i]![i]!);
}
export interface QFit { a: number; b: number; c: number; sse: number; r2: number; model: Model }
/** QuadReg: y = ax² + bx + c by least squares */
export function quadReg(xs: readonly number[], ys: readonly number[]): QFit {
  const n = xs.length, m = xs.reduce((s, v) => s + v, 0) / n;
  const u = xs.map(x => x - m);
  const S = (k: number) => u.reduce((s, v) => s + v ** k, 0), T = (k: number) => u.reduce((s, v, i) => s + v ** k * ys[i]!, 0);
  const [A, B, C] = solve3([[S(4), S(3), S(2)], [S(3), S(2), S(1)], [S(2), S(1), n]], [T(2), T(1), T(0)]) as [number, number, number];
  // A(x−m)² + B(x−m) + C
  const a = A, b = B - 2 * A * m, c = A * m * m - B * m + C;
  const model: Model = { fam: 'quad', p: [a, b, c] };
  const e = sse(model, xs, ys);
  return { a, b, c, sse: e, r2: 1 - e / sst(ys), model };
}
export interface EFit { a: number; b: number; r: number; r2: number; A: number; B: number; model: Model }
/** TI-84 ExpReg: ln y = A + Bx by least squares; a = e^A, b = e^B; r (and r²) are those of (x, ln y). Throws on y ≤ 0. */
export function expReg(xs: readonly number[], ys: readonly number[]): EFit {
  if (ys.some(y => !(y > 0))) throw new Error('ExpReg needs every y > 0');
  const f = lsrl(xs, ys.map(Math.log));
  return { a: Math.exp(f.a), b: Math.exp(f.b), r: f.r, r2: f.r2, A: f.a, B: f.b, model: { fam: 'exp', p: [Math.exp(f.a), Math.exp(f.b)] } };
}
/** Desmos y1 ~ a·b^x1 (default): least squares of y itself, Gauss-Newton on (a, k = ln b) from a start */
export function expRegOrig(xs: readonly number[], ys: readonly number[], start?: { a: number; b: number }): { a: number; b: number; sse: number; model: Model } {
  let a = start?.a ?? 0, k = 0;
  if (!start) { const pos = xs.map((x, i) => [x, ys[i]!] as const).filter(([, y]) => y > 0); const f = lsrl(pos.map(p => p[0]), pos.map(p => Math.log(p[1]))); a = Math.exp(f.a); k = f.b; }
  else k = Math.log(start.b);
  for (let it = 0; it < 200; it++) {
    let j11 = 0, j12 = 0, j22 = 0, g1 = 0, g2 = 0;
    xs.forEach((x, i) => {
      const ex = Math.exp(k * x), f = a * ex, r = ys[i]! - f, da = ex, dk = a * x * ex;
      j11 += da * da; j12 += da * dk; j22 += dk * dk; g1 += da * r; g2 += dk * r;
    });
    const det = j11 * j22 - j12 * j12;
    const sa = (j22 * g1 - j12 * g2) / det, sk = (j11 * g2 - j12 * g1) / det;
    a += sa; k += sk;
    if (Math.abs(sa) < 1e-13 * Math.max(1, Math.abs(a)) && Math.abs(sk) < 1e-14) break;
  }
  const model: Model = { fam: 'exp', p: [a, Math.exp(k)] };
  return { a, b: Math.exp(k), sse: sse(model, xs, ys), model };
}
/** TI-84 PwrReg: ln y = A + B ln x; y = a·x^b with a = e^A, b = B */
export function pwrReg(xs: readonly number[], ys: readonly number[]): { a: number; b: number; model: Model } {
  const f = lsrl(xs.map(Math.log), ys.map(Math.log));
  return { a: Math.exp(f.a), b: f.b, model: { fam: 'pwr', p: [Math.exp(f.a), f.b] } };
}
/** y = a√x + k (h fixed at 0): a line in √x */
export function sqrtReg(xs: readonly number[], ys: readonly number[]): { a: number; k: number; model: Model } {
  const f = lsrl(xs.map(Math.sqrt), ys);
  return { a: f.b, k: f.a, model: { fam: 'sqrt', p: [f.b, f.a] } };
}
/** LinReg a + bx as a Model */
export function linReg(xs: readonly number[], ys: readonly number[]): { a: number; b: number; r: number; r2: number; model: Model } {
  const f = lsrl(xs, ys);
  return { a: f.a, b: f.b, r: f.r, r2: f.r2, model: { fam: 'lin', p: [f.a, f.b] } };
}

// ---------- residual patterns ----------
/** the number of sign runs in a residual list (zeros skipped) */
export function runs(es: readonly number[]): number {
  const s = es.filter(e => Math.abs(e) > 1e-9).map(Math.sign);
  return s.reduce((n, v, i) => n + (i > 0 && v !== s[i - 1] ? 1 : 0), s.length ? 1 : 0);
}
/** how much of the residuals' spread a parabola in x explains (0..1): near 1 = a clear bend (U or arch) */
export function bendShare(xs: readonly number[], es: readonly number[]): number {
  const q = quadReg(xs, es); const t = es.reduce((s, e) => s + e * e, 0);
  return t === 0 ? 0 : 1 - q.sse / t;
}
/** a residual plot that reads as "no pattern": many sign changes and no bend */
/** a residual plot that reads as "no pattern": many sign changes (at least n/2, and more than a pattern may have), no bend and no wave;
 *  never true together with patterned() */
export const patternless = (xs: readonly number[], es: readonly number[]): boolean => runs(es) >= Math.max(5, Math.ceil(es.length / 2)) && bendShare(xs, es) < 0.35 && cubicShare(xs, es) < 0.5;
/** a residual plot that reads as a clear pattern: few long runs and most of the spread a smooth curve (a U, an arch, a wave) */
export function patterned(xs: readonly number[], es: readonly number[]): boolean {
  const r = runs(es);
  return r <= 4 && r < Math.ceil(es.length / 2) && (bendShare(xs, es) > 0.75 || cubicShare(xs, es) > 0.8);
}
/** share of the residuals explained by a cubic in x (a wave) */
export function cubicShare(xs: readonly number[], es: readonly number[]): number {
  const n = xs.length, m = xs.reduce((s, v) => s + v, 0) / n, sc = Math.max(...xs.map(x => Math.abs(x - m))) || 1;
  const u = xs.map(x => (x - m) / sc);
  const cols = [u.map(v => v ** 3), u.map(v => v * v), u, u.map(() => 1)];
  const M = cols.map(a => cols.map(b => a.reduce((s, v, i) => s + v * b[i]!, 0))), v = cols.map(a => a.reduce((s, x, i) => s + x * es[i]!, 0));
  const A = M.map((r, i) => [...r, v[i]!]);
  for (let c = 0; c < 4; c++) {
    let p = c; for (let r = c + 1; r < 4; r++) if (Math.abs(A[r]![c]!) > Math.abs(A[p]![c]!)) p = r;
    [A[c], A[p]] = [A[p]!, A[c]!];
    for (let r = 0; r < 4; r++) if (r !== c) { const f = A[r]![c]! / A[c]![c]!; for (let k = c; k < 5; k++) A[r]![k]! -= f * A[c]![k]!; }
  }
  const co = [0, 1, 2, 3].map(i => A[i]![4]! / A[i]![i]!);
  const fit = u.map((_, i) => cols.reduce((s, cc, j) => s + co[j]! * cc[i]!, 0));
  const t = es.reduce((s, e) => s + e * e, 0), r = es.reduce((s, e, i) => s + (e - fit[i]!) ** 2, 0);
  return t === 0 ? 0 : 1 - r / t;
}

// ---------- solving model = target ----------
/** the real solutions of ax² + bx + c = t, sorted (one when tangent) */
export function quadSolve(a: number, b: number, c: number, t: number): number[] {
  const D = b * b - 4 * a * (c - t);
  if (D < -1e-12) return [];
  if (Math.abs(D) <= 1e-12) return [-b / (2 * a)];
  const s = Math.sqrt(D), r1 = (-b - s) / (2 * a), r2 = (-b + s) / (2 * a);
  return [Math.min(r1, r2), Math.max(r1, r2)];
}
/** the solution of a·b^x = t, or null when there is none (t ≤ 0, or b = 1) */
export const expSolve = (a: number, b: number, t: number): number | null => (t / a > 0 && b !== 1 ? Math.log(t / a) / Math.log(b) : null);

// ---------- numbers as text ----------
/** v with s significant digits, as plain decimal text ("0.000473", "15.2", "1,240" not used: no commas) */
export function sig(v: number, s: number): number { if (v === 0) return 0; const d = s - 1 - Math.floor(Math.log10(Math.abs(v))); return d >= 0 ? rd(v, d) : r9(Math.round(v / 10 ** -d) * 10 ** -d); }
/** decimals that s significant digits of v need */
export const sigPlaces = (v: number, s: number): number => Math.max(0, s - 1 - Math.floor(Math.log10(Math.abs(v))));
/** HTML number: real minus, thousands commas from 10,000 up (years like 2016 stay plain), up to d decimals */
export function nH(v: number, d = 4): string {
  const r = rd(v, d), a = Math.abs(r);
  const s = a >= 10000 ? a.toLocaleString('en-US', { maximumFractionDigits: d }) : String(a);
  return (Object.is(r, -0) || r === 0 ? '' : r < 0 ? '−' : '') + s;
}
export const nT = (v: number, d = 4): string => nH(v, d).replace('−', '-').replace(/,/g, '{,}');
/** fixed decimals ("−0.12", "53.10") */
export const fx = (v: number, d: number): string => { const r = rd(v, d); return (r < 0 ? '−' : '') + Math.abs(r).toFixed(d); };
export const fxT = (v: number, d: number): string => fx(v, d).replace('−', '-');
/** a signed value with its sign written ("+1.5", "−0.3", "0") */
export const sgn = (v: number, d = 4): string => (rd(v, d) > 0 ? '+' : '') + nH(v, d);
/** TI-84 style: no leading zero (".9184", "−.1188") */
export function ti(v: number, d = 4): string { const r = rd(v, d), s = Math.abs(r).toFixed(d).replace(/0+$/, '').replace(/\.$/, '').replace(/^0\./, '.'); return (r < 0 ? '−' : '') + s; }
/** scientific notation text "4.73 × 10⁻⁴" (HTML) and TeX "4.73 \times 10^{-4}" for s significant digits */
const SUP: Record<string, string> = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
export function sci(v: number, s: number): { h: string; t: string; ti: string } {
  const e = Math.floor(Math.log10(Math.abs(v))), m = rd(v / 10 ** e, s - 1);
  const ms = (m < 0 ? '−' : '') + Math.abs(m).toFixed(s - 1);
  return { h: `${ms} × 10${String(e).split('').map(ch => SUP[ch]).join('')}`, t: `${ms.replace('−', '-')} \\times 10^{${e}}`, ti: `${ms}E${e < 0 ? '−' : ''}${Math.abs(e)}` };
}

// ---------- model text ----------
const X = '<i>x</i>';
/** "ŷ = −0.42x² + 6.1x + 3.5" from coefficient strings (as written: trailing zeros kept) */
export function quadH(a: string, b: string, c: string, x = X, lhs = 'ŷ'): string {
  const t = (s: string, first: boolean, tail: string) => { const neg = s.startsWith('−'); const v = neg ? s.slice(1) : s; return first ? `${neg ? '−' : ''}${v}${tail}` : ` ${neg ? '−' : '+'} ${v}${tail}`; };
  return `${lhs} = ${t(a, true, `${x}²`)}${t(b, false, x)}${t(c, false, '')}`;
}
export function quadT(a: string, b: string, c: string, x = 'x', lhs = '\\hat{y}'): string {
  const t = (s: string, first: boolean, tail: string) => { const S = s.replace('−', '-'); const neg = S.startsWith('-'); const v = neg ? S.slice(1) : S; return first ? `${neg ? '-' : ''}${v}${tail}` : ` ${neg ? '-' : '+'} ${v}${tail}`; };
  return `${lhs} = ${t(a, true, `${x}^2`)}${t(b, false, x)}${t(c, false, '')}`;
}
/** "ŷ = 24.3(0.78)<sup>x</sup>" */
export const expH = (a: string, b: string, x = X, lhs = 'ŷ'): string => `${lhs} = ${a}(${b})<sup>${x}</sup>`;
export const expT = (a: string, b: string, x = 'x', lhs = '\\hat{y}'): string => `${lhs} = ${a.replace('−', '-')}(${b})^{${x}}`;
