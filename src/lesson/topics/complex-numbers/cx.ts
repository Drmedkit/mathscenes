// cx.ts: exact complex numbers for "Complex numbers" (Algebra 2, lesson 1). Pure: no DOM.
//   Cx     a + bi with exact rational parts (Q = [p, q] from number-properties)
//   arithmetic: add, sub, mul, div (throws on 0), conj, powI (the cycle of 4), equality by parts
//   text: tex(z) for the board ("3 - 4i", "\frac{7}{5} - \frac{1}{5}i"), html(z) for the panel (a real minus sign,
//         a fractional imaginary part in brackets: "(1/5)i", so the plain-text reading keeps the grouping)
//   typable(z): both parts can be typed as decimals (denominators made of 2s and 5s only)
import { rootH as radH } from '../radicals-exponents/rad';
import { type Q, q, qAdd, qSub, qMul, qDiv, qNeg, qEq, qVal } from '../number-properties/numbers';

export type { Q };
export interface Cx { re: Q; im: Q }
export const C = (a: number, b = 0): Cx => ({ re: q(a), im: q(b) });
export const CQ = (re: Q, im: Q): Cx => ({ re, im });
export const ZERO = C(0, 0), ONE = C(1, 0), I = C(0, 1);

export const add = (z: Cx, w: Cx): Cx => ({ re: qAdd(z.re, w.re), im: qAdd(z.im, w.im) });
export const sub = (z: Cx, w: Cx): Cx => ({ re: qSub(z.re, w.re), im: qSub(z.im, w.im) });
export const neg = (z: Cx): Cx => ({ re: qNeg(z.re), im: qNeg(z.im) });
export const conj = (z: Cx): Cx => ({ re: z.re, im: qNeg(z.im) });
export const scale = (z: Cx, k: Q): Cx => ({ re: qMul(z.re, k), im: qMul(z.im, k) });
/** (a + bi)(c + di) = (ac − bd) + (ad + bc)i, because i² = −1 */
export const mul = (z: Cx, w: Cx): Cx => ({
  re: qSub(qMul(z.re, w.re), qMul(z.im, w.im)),
  im: qAdd(qMul(z.re, w.im), qMul(z.im, w.re)),
});
/** z · conj(z) = a² + b², a real number */
export const normSq = (z: Cx): Q => qAdd(qMul(z.re, z.re), qMul(z.im, z.im));
export const isZero = (z: Cx) => z.re[0] === 0 && z.im[0] === 0;
export function div(z: Cx, w: Cx): Cx {
  if (isZero(w)) throw new Error('div: dividing by 0');
  const n = normSq(w), t = mul(z, conj(w));
  return { re: qDiv(t.re, n), im: qDiv(t.im, n) };
}
export const eq = (z: Cx, w: Cx) => qEq(z.re, w.re) && qEq(z.im, w.im);
export const isReal = (z: Cx) => z.im[0] === 0;
export const isPureImag = (z: Cx) => z.re[0] === 0 && z.im[0] !== 0;
/** i^n for a whole number n >= 0: 1, i, −1, −i, repeating every 4 */
export function powI(n: number): Cx {
  if (!Number.isInteger(n) || n < 0) throw new Error(`powI: ${n}`);
  return [C(1), C(0, 1), C(-1), C(0, -1)][n % 4]!;
}
export function pow(z: Cx, n: number): Cx { let r = ONE; for (let k = 0; k < n; k++) r = mul(r, z); return r; }
export const re = (z: Cx) => qVal(z.re), im = (z: Cx) => qVal(z.im);
/** a part that can be typed in a number box: a whole number or a terminating decimal */
export const typableQ = (a: Q) => { let d = a[1]; while (d % 2 === 0) d /= 2; while (d % 5 === 0) d /= 5; return d === 1; };
export const typable = (z: Cx) => typableQ(z.re) && typableQ(z.im);
/** a typed pair (two decimals) equals z */
export const near = (a: number, b: number) => Math.abs(a - b) < 1e-9;
export const pairIs = (x: number, y: number, z: Cx) => near(x, re(z)) && near(y, im(z));

// ---------- text ----------
const qAbsTex = (a: Q) => (a[1] === 1 ? String(Math.abs(a[0])) : `\\frac{${Math.abs(a[0])}}{${a[1]}}`);
const fr = (n: number | string, d: number | string) => `<span class="fr"><span>${n}</span><span>${d}</span></span>`;
const qAbsHtml = (a: Q) => (a[1] === 1 ? String(Math.abs(a[0])) : fr(Math.abs(a[0]), a[1]));
export const MINUS = '−';
export const II = '<i>i</i>';
/** the imaginary term's magnitude: i, 3i, \frac{1}{5}i */
const imTex = (b: Q) => (b[1] === 1 && Math.abs(b[0]) === 1 ? 'i' : `${qAbsTex(b)}i`);
const imHtml = (b: Q) => (b[1] === 1 && Math.abs(b[0]) === 1 ? II : b[1] === 1 ? `${Math.abs(b[0])}${II}` : `(${qAbsHtml(b)})${II}`);
/** TeX of z in a + bi form: "3 - 4i", "-i", "7", "0", "\frac{7}{5} - \frac{1}{5}i" */
export function tex(z: Cx): string {
  const a = z.re, b = z.im;
  if (b[0] === 0) return (a[0] < 0 ? '-' : '') + qAbsTex(a);
  if (a[0] === 0) return (b[0] < 0 ? '-' : '') + imTex(b);
  return `${a[0] < 0 ? '-' : ''}${qAbsTex(a)} ${b[0] < 0 ? '-' : '+'} ${imTex(b)}`;
}
/** HTML of z in a + bi form (a real minus sign, i in italics) */
export function html(z: Cx): string {
  const a = z.re, b = z.im;
  if (b[0] === 0) return (a[0] < 0 ? MINUS : '') + qAbsHtml(a);
  if (a[0] === 0) return (b[0] < 0 ? MINUS : '') + imHtml(b);
  return `${a[0] < 0 ? MINUS : ''}${qAbsHtml(a)} ${b[0] < 0 ? MINUS : '+'} ${imHtml(b)}`;
}
/** z in brackets when it has two parts or a leading minus (a factor in a product) */
export const parTex = (z: Cx) => (twoParts(z) || lead(z) ? `(${tex(z)})` : tex(z));
export const parHtml = (z: Cx) => (twoParts(z) || lead(z) ? `(${html(z)})` : html(z));
const twoParts = (z: Cx) => z.re[0] !== 0 && z.im[0] !== 0;
const lead = (z: Cx) => (z.im[0] === 0 ? z.re[0] < 0 : z.re[0] === 0 ? z.im[0] < 0 : z.re[0] < 0);
/** a signed rational as TeX / HTML */
export const qT = (a: Q) => (a[0] < 0 ? '-' : '') + qAbsTex(a);
export const qH = (a: Q) => (a[0] < 0 ? MINUS : '') + qAbsHtml(a);
/** a signed whole number as HTML / TeX */
export const nH = (v: number) => (v < 0 ? MINUS + Math.abs(v) : String(v));
export const nT = (v: number) => String(v);
/** a number with a sign in front for sums: "+ 3", "− 3" (HTML) */
export const sgnH = (v: number) => (v < 0 ? `${MINUS} ${Math.abs(v)}` : `+ ${v}`);
export const sgnT = (v: number) => (v < 0 ? `- ${Math.abs(v)}` : `+ ${v}`);
/** a monomial k·i^p as TeX / HTML: 3i, -i, 6i^{2} */
export function monoT(k: number, p: number): string {
  const body = p === 0 ? '' : p === 1 ? 'i' : `i^{${p}}`;
  if (!body) return String(k);
  return k === 1 ? body : k === -1 ? `-${body}` : `${k}${body}`;
}
export function monoH(k: number, p: number): string {
  const body = p === 0 ? '' : p === 1 ? II : `${II}<sup>${p}</sup>`;
  if (!body) return nH(k);
  return k === 1 ? body : k === -1 ? MINUS + body : `${nH(k)}${body}`;
}
/** a list of signed terms joined with + / −: terms as [coef, power of i] */
export function sumT(ts: readonly (readonly [number, number])[]): string {
  return ts.map(([k, p], j) => (j === 0 ? monoT(k, p) : k < 0 ? `- ${monoT(-k, p)}` : `+ ${monoT(k, p)}`)).join(' ');
}
export function sumH(ts: readonly (readonly [number, number])[]): string {
  return ts.map(([k, p], j) => (j === 0 ? monoH(k, p) : k < 0 ? `${MINUS} ${monoH(-k, p)}` : `+ ${monoH(k, p)}`)).join(' ');
}
/** a decimal for a typable part (no float noise) */
export function dec(a: Q): string { const v = Math.round(qVal(a) * 1e6) / 1e6; return (v < 0 ? MINUS : '') + String(Math.abs(v)); }
/** the principal square root of a negative number -k, k > 0 a perfect square: s·i */
export function isSquare(k: number) { const s = Math.round(Math.sqrt(k)); return s * s === k; }
/** k = out² · rest with rest square-free */
export function extract(k: number): { out: number; rest: number } {
  let out = 1, rest = k;
  for (let f = 2; f * f <= rest; f++) while (rest % (f * f) === 0) { rest /= f * f; out *= f; }
  return { out, rest };
}
export const rootT = (s: number | string) => `\\sqrt{${s}}`;
/** a root in HTML: the sign and a bar over the radicand (radicals-exponents' rootH; css u.rb / s.pp in the html) */
export const rootH = (s: number | string) => radH(2, s);
export { q, qVal, qEq, qMul, qAdd, qSub, qDiv, qNeg };
