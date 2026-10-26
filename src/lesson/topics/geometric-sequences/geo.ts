// geo.ts: the exact maths of geometric sequences (no DOM). Terms are exact rationals Q = n/d (d > 0, lowest terms):
// a fraction ratio like 2/3 never turns into 0.6666…, and a decimal ratio like 0.8 is 4/5, so 51.2 is 256/5 exactly.
//   q / mul / div / pow / eq      rational arithmetic (integers stay far below 2^53 in every family)
//   terms(a1, r, count, n0)       a1, a1·r, a1·r², … (index n0, n0 + 1, …)
//   ratios / geo / diffs / arith  consecutive ratios (null where a term is 0) and differences, and the tests
//   qH / qT                       a rational as HTML (fraction, or a decimal when `dec` and it terminates) and as TeX
//   expH / expT                   the explicit form a·r^(n − k) (k = 1: a_1·r^(n−1), k = 0: a_0·r^n)
//   recH / recT                   a complete recursive definition (seed, update, range)
import { fr } from '../../runtime/item';

export interface Q { n: number; d: number }
const gcd = (a: number, b: number): number => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
export function q(n: number, d = 1): Q {
  if (!Number.isInteger(n) || !Number.isInteger(d)) {
    // a decimal: scale to an integer fraction (0.8 → 4/5, 1.025 → 41/40)
    let s = 1; while ((!Number.isInteger(Math.round(n * s * 1e9) / 1e9) || !Number.isInteger(Math.round(d * s * 1e9) / 1e9)) && s < 1e9) s *= 10;
    return q(Math.round(n * s), Math.round(d * s));
  }
  if (d === 0) throw new Error('q: zero denominator');
  const g = gcd(n, d), sg = d < 0 ? -1 : 1;
  const N = (sg * n) / g, D = (sg * d) / g;
  return { n: Object.is(N, -0) ? 0 : N, d: D };
}
export const qi = (n: number): Q => q(n, 1);
export const mul = (a: Q, b: Q): Q => q(a.n * b.n, a.d * b.d);
export const div = (a: Q, b: Q): Q => q(a.n * b.d, a.d * b.n);
export const add = (a: Q, b: Q): Q => q(a.n * b.d + b.n * a.d, a.d * b.d);
export const sub = (a: Q, b: Q): Q => q(a.n * b.d - b.n * a.d, a.d * b.d);
export const neg = (a: Q): Q => q(-a.n, a.d);
export function pow(a: Q, k: number): Q {
  if (k < 0) return pow(div(qi(1), a), -k);
  let r = qi(1); for (let i = 0; i < k; i++) r = mul(r, a);
  return r;
}
export const eq = (a: Q, b: Q): boolean => a.n === b.n && a.d === b.d;
export const val = (a: Q): number => a.n / a.d;
export const isInt = (a: Q): boolean => a.d === 1;
export const near = (x: number, a: Q): boolean => Math.abs(x - val(a)) < 1e-9 * Math.max(1, Math.abs(val(a)));

/** the term at index n of the sequence that has a1 at index n0 */
export const term = (a1: Q, r: Q, n: number, n0 = 1): Q => mul(a1, pow(r, n - n0));
export const terms = (a1: Q, r: Q, count: number, n0 = 1): Q[] => Array.from({ length: count }, (_, i) => term(a1, r, n0 + i, n0));
/** consecutive ratios later ÷ earlier (null where the earlier term is 0) */
export const ratios = (vs: readonly Q[]): (Q | null)[] => vs.slice(1).map((v, i) => (vs[i]!.n === 0 ? null : div(v, vs[i]!)));
export const diffs = (vs: readonly Q[]): Q[] => vs.slice(1).map((v, i) => sub(v, vs[i]!));
/** geometric: no zero term and one ratio for every pair (the topic's convention a_1 ≠ 0, r ≠ 0) */
export function geo(vs: readonly Q[]): boolean { if (vs.some(v => v.n === 0)) return false; const R = ratios(vs) as Q[]; return R.every(x => eq(x, R[0]!)); }
export function arith(vs: readonly Q[]): boolean { const D = diffs(vs); return D.every(x => eq(x, D[0]!)); }
/** a terminating decimal with at most `max` places, or null */
export function decStr(a: Q, max = 4): string | null {
  let d = a.d; while (d % 2 === 0) d /= 2; while (d % 5 === 0) d /= 5;
  if (d !== 1) return null;
  for (let p = 0; p <= max; p++) { const v = (Math.abs(a.n) / a.d) * 10 ** p; if (Math.abs(v - Math.round(v)) < 1e-9) return (Math.abs(a.n) / a.d).toFixed(p); }
  return null;
}

// ---------- numbers ----------
const M = '−';
/** HTML: an integer, a decimal (dec and it terminates), else a stacked fraction; a real minus sign */
export function qH(a: Q, dec = false): string {
  const s = a.n < 0 ? M : '';
  if (a.d === 1) return s + String(Math.abs(a.n));
  const D = dec ? decStr(a) : null;
  return D ? s + D : s + fr(Math.abs(a.n), a.d);
}
/** TeX of a rational */
export function qT(a: Q, dec = false): string {
  const s = a.n < 0 ? '-' : '';
  if (a.d === 1) return s + String(Math.abs(a.n));
  const D = dec ? decStr(a) : null;
  return D ? s + D : `${s}\\frac{${Math.abs(a.n)}}{${a.d}}`;
}
/** plain text (for the voice-free logs and board-free places): 2/3, −1.5 */
export function qP(a: Q, dec = false): string {
  const s = a.n < 0 ? M : '';
  if (a.d === 1) return s + String(Math.abs(a.n));
  const D = dec ? decStr(a) : null;
  return D ? s + D : `${s}${Math.abs(a.n)}/${a.d}`;
}
/** a factor that follows "×" or "·": brackets when negative ("× (−3)") or, in TeX, a fraction keeps no brackets */
export const facH = (r: Q, dec = false) => (r.n < 0 ? `(${qH(r, dec)})` : qH(r, dec));
export const facT = (r: Q, dec = false) => (r.n < 0 ? `(${qT(r, dec)})` : qT(r, dec));
/** the hop label "×2", "×½", "×(−3)" as TeX */
export const hopT = (r: Q, dec = false) => `\\times ${facT(r, dec)}`;
export const hopH = (r: Q, dec = false) => `×${facH(r, dec)}`;

// ---------- forms ----------
export interface Nm { s: string; fn?: boolean }
export const A: Nm = { s: 'a' };
export const F: Nm = { s: 'f', fn: true };
export const atT = (N: Nm, i: string | number) => (N.fn ? `${N.s}(${i})` : `${N.s}_{${i}}`);
export const atH = (N: Nm, i: string | number) => (N.fn ? `${N.s}(${String(i).replace(/-/g, M)})` : `${N.s}<sub>${String(i).replace(/-/g, M)}</sub>`);
/** the base of a power in TeX / HTML: brackets around a negative or a fraction */
const baseT = (r: Q, dec: boolean) => (r.n < 0 || (r.d !== 1 && !(dec && decStr(r))) ? `\\left(${qT(r, dec)}\\right)` : qT(r, dec));
const baseH = (r: Q, dec: boolean) => (r.n < 0 || (r.d !== 1 && !(dec && decStr(r))) ? `(${qH(r, dec)})` : qH(r, dec));
/** the exponent n − k: k = 1 "n−1", k = 0 "n", k = −1 "n+1" */
const expoT = (k: number) => (k === 0 ? 'n' : k > 0 ? `n-${k}` : `n+${-k}`);
const expoH = (k: number) => (k === 0 ? 'n' : k > 0 ? `n${M}${k}` : `n+${-k}`);
/** a·r^(n − k) as TeX: "3 \cdot 2^{n-1}", "96\left(\frac{1}{2}\right)^{n-1}", "-4 \cdot 3^{n}", "2^{n-1}" for a = 1 */
export function expT(a: Q, r: Q, k = 1, dec = false): string {
  const B = baseT(r, dec), P = `${B}^{${expoT(k)}}`;
  if (eq(a, qi(1))) return P;
  if (eq(a, qi(-1))) return `-${P}`;
  return `${qT(a, dec)}${B.startsWith('\\left') ? '' : ' \\cdot '}${P}`;
}
export function expH(a: Q, r: Q, k = 1, dec = false): string {
  const B = baseH(r, dec), P = `${B}<sup>${expoH(k)}</sup>`;
  if (eq(a, qi(1))) return P;
  if (eq(a, qi(-1))) return `${M}${P}`;
  return `${qH(a, dec)} · ${P}`;
}
/** a complete recursive definition: seed at n0, the update a_n = r·a_(n−1) for n ≥ n0 + 1 (or forward a_(n+1) = r·a_n) */
export interface RecDef { N: Nm; n0: number; seed: Q; r: Q; back?: boolean; noSeed?: boolean; noRange?: boolean; lo?: number; dec?: boolean }
const coefT = (r: Q, dec: boolean) => (eq(r, qi(-1)) ? '-' : r.n < 0 ? `(${qT(r, dec)})` : `${qT(r, dec)} \\cdot `);
const coefH = (r: Q, dec: boolean) => (eq(r, qi(-1)) ? M : r.n < 0 ? `(${qH(r, dec)}) · ` : `${qH(r, dec)} · `);
export function stepT(N: Nm, r: Q, back = true, dec = false): string {
  const L = back ? atT(N, 'n') : atT(N, 'n+1'), R = back ? atT(N, 'n-1') : atT(N, 'n');
  return `${L} = ${coefT(r, dec)}${R}`;
}
export function stepH(N: Nm, r: Q, back = true, dec = false): string {
  const L = back ? atH(N, 'n') : atH(N, 'n+1'), R = back ? atH(N, 'n-1') : atH(N, 'n');
  return `${L} = ${coefH(r, dec)}${R}`;
}
export function recT(d: RecDef): string {
  const back = d.back ?? true, lo = d.lo ?? (back ? d.n0 + 1 : d.n0);
  const seed = d.noSeed ? '' : `${atT(d.N, d.n0)} = ${qT(d.seed, d.dec)},\\ `;
  return `${seed}${stepT(d.N, d.r, back, d.dec)}${d.noRange ? '' : `\\ \\text{for } n \\ge ${lo}`}`;
}
export function recH(d: RecDef): string {
  const back = d.back ?? true, lo = d.lo ?? (back ? d.n0 + 1 : d.n0);
  const seed = d.noSeed ? '' : `${atH(d.N, d.n0)} = ${qH(d.seed, d.dec)}, `;
  return `${seed}${stepH(d.N, d.r, back, d.dec)}${d.noRange ? '' : ` for <i>n</i> ≥ ${lo}`}`;
}
