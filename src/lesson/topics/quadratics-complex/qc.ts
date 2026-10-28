// qc.ts: exact maths of "Quadratics with complex solutions" (Algebra 2, lesson 2). Pure: no DOM.
//   NR            a pair of non-real roots re ± im·i√m (im > 0, m square-free): what the formula gives when b² − 4ac < 0
//   nonReal(a,b,c)  the non-real roots of ax² + bx + c = 0 (integer a, b, c, b² − 4ac < 0), exactly
//   evalQ(A,B,C,z)  A·z² + B·z + C for complex coefficients and a complex z (exact rational parts), with its steps
//   keys          one canonical key per VALUE (a root set, a quadratic up to a factor, a complex number), so a choice
//                 list can drop a wrong choice that is secretly the right one written another way
// Text: *T = TeX for the board, *H = HTML for the panel (a real minus sign; a fractional imaginary part in brackets,
// "(3/2)i", "(√6/3)i", so the plain-text reading keeps the grouping).
import { type Q, q, qAdd, qSub, qMul, qDiv, qNeg, qEq, qVal, squareFree } from '../number-properties/numbers';
import { type Cx, C, CQ, add, mul, scale, eq as cxEq, tex as cxTex, html as cxHtml, II, MINUS } from '../complex-numbers/cx';
import { rootH } from '../radicals-exponents/rad';
import { fr } from '../../runtime/item';
import { type Roots, roots as realRoots, rootVals, rootsH, rootsT } from '../completing-the-square/quad';

export type { Q, Cx, Roots };
export { q, qAdd, qSub, qMul, qDiv, qNeg, qEq, qVal, squareFree, C, CQ, add, mul, scale, cxEq, cxTex, cxHtml, II, MINUS, realRoots, rootVals, rootsH, rootsT, rootH };

export const disc = (a: number, b: number, c: number) => b * b - 4 * a * c;
export const isSq = (n: number) => n >= 0 && Math.round(Math.sqrt(n)) ** 2 === n;

// ---------- non-real roots ----------
/** re ± im·i√m: im > 0, m >= 1 square-free */
export interface NR { re: Q; im: Q; m: number }
export function nonReal(a: number, b: number, c: number): NR {
  const D = disc(a, b, c);
  if (a === 0 || D >= 0) throw new Error(`nonReal: ${a}, ${b}, ${c} has real roots`);
  const { k, m } = squareFree(-D);
  return { re: q(-b, 2 * a), im: q(k, 2 * Math.abs(a)), m };
}
/** a root pair given by its parts: re ± k·i√r with r any whole number (simplified here) */
export function nr(re: Q, k: Q, r = 1): NR {
  const { k: o, m } = squareFree(r);
  const im = qMul(k, q(o));
  return { re, im: im[0] < 0 ? qNeg(im) : im, m };
}
/** the same pair of roots: equal real parts and equal im²·m */
export const nrEq = (x: NR, y: NR) => qEq(x.re, y.re) && qEq(qMul(qMul(x.im, x.im), q(x.m)), qMul(qMul(y.im, y.im), q(y.m)));
export const nrKey = (x: NR) => { const s = qMul(qMul(x.im, x.im), q(x.m)); return `nr:${x.re[0]}/${x.re[1]}:${s[0]}/${s[1]}`; };
/** both roots are typable as "□ ± □ i" (whole or terminating decimal parts, no radical) */
export const typableQ = (a: Q) => { let d = a[1]; while (d % 2 === 0) d /= 2; while (d % 5 === 0) d /= 5; return d === 1; };
export const nrTypable = (x: NR) => x.m === 1 && typableQ(x.re) && typableQ(x.im);
/** the two roots as complex numbers (m = 1 only) */
export function nrPair(x: NR): [Cx, Cx] { if (x.m !== 1) throw new Error('nrPair: radical part'); return [CQ(x.re, x.im), CQ(x.re, qNeg(x.im))]; }
/** the monic quadratic with these roots: x² − 2·re·x + (re² + im²·m) */
export function nrMonic(x: NR): [Q, Q] { return [qMul(q(-2), x.re), qAdd(qMul(x.re, x.re), qMul(qMul(x.im, x.im), q(x.m)))]; }
/** the numeric values (for the plane): [re, im·√m] */
export const nrNum = (x: NR): [number, number] => [qVal(x.re), qVal(x.im) * Math.sqrt(x.m)];

// ---------- text ----------
const absQ = (a: Q): Q => [Math.abs(a[0]), a[1]];
export const qT = (a: Q) => (a[1] === 1 ? String(a[0]) : `${a[0] < 0 ? '-' : ''}\\frac{${Math.abs(a[0])}}{${a[1]}}`);
export const qH = (a: Q) => (a[1] === 1 ? (a[0] < 0 ? MINUS + -a[0] : String(a[0])) : `${a[0] < 0 ? MINUS : ''}${fr(Math.abs(a[0]), a[1])}`);
export const nH = (v: number) => (v < 0 ? MINUS + -v : String(v));
/** the imaginary part's magnitude: 3i, i, \frac{3}{2}i, 2i\sqrt{6}, \frac{\sqrt{6}}{3}i */
export function imT(im: Q, m = 1): string {
  const a = absQ(im);
  if (m === 1) return a[1] === 1 ? (a[0] === 1 ? 'i' : `${a[0]}i`) : `\\frac{${a[0]}}{${a[1]}}i`;
  const rt = `\\sqrt{${m}}`;
  return a[1] === 1 ? `${a[0] === 1 ? '' : a[0]}i${rt}` : `\\frac{${a[0] === 1 ? '' : a[0]}${rt}}{${a[1]}}i`;
}
export function imH(im: Q, m = 1): string {
  const a = absQ(im);
  if (m === 1) return a[1] === 1 ? (a[0] === 1 ? II : `${a[0]}${II}`) : `(${fr(a[0], a[1])})${II}`;
  const rt = rootH(2, m);
  // a root never sits in a stacked fraction (the plain-text reading would lose the bar): (√6/3)i, linear
  return a[1] === 1 ? `${a[0] === 1 ? '' : a[0]}${II}${rt}` : `(${a[0] === 1 ? '' : a[0]}${rt}/${a[1]})${II}`;
}
/** the pair of roots: "2 \pm 3i", "\pm 3i", "-1 \pm i\sqrt{6}" */
export const nrT = (x: NR) => (x.re[0] === 0 ? `\\pm ${imT(x.im, x.m)}` : `${qT(x.re)} \\pm ${imT(x.im, x.m)}`);
export const nrH = (x: NR) => (x.re[0] === 0 ? `±${imH(x.im, x.m)}` : `${qH(x.re)} ± ${imH(x.im, x.m)}`);
/** one root: re + im·i√m or re − im·i√m */
export function oneT(x: NR, sign: 1 | -1): string { return x.re[0] === 0 ? `${sign < 0 ? '-' : ''}${imT(x.im, x.m)}` : `${qT(x.re)} ${sign < 0 ? '-' : '+'} ${imT(x.im, x.m)}`; }
export function oneH(x: NR, sign: 1 | -1): string { return x.re[0] === 0 ? `${sign < 0 ? MINUS : ''}${imH(x.im, x.m)}` : `${qH(x.re)} ${sign < 0 ? MINUS : '+'} ${imH(x.im, x.m)}`; }

/** ax² + bx + c with integer (or Q) coefficients in TeX / HTML; zero terms dropped */
type Co = number | Q;
const asQ = (c: Co): Q => (typeof c === 'number' ? q(c) : c);
function polyText(cs: readonly [Co, number][], v: string, html: boolean): string {
  let s = '';
  for (const [c0, pw] of cs) {
    const c = asQ(c0); if (c[0] === 0) continue;
    const neg = c[0] < 0, a = absQ(c), one = a[0] === 1 && a[1] === 1 && pw > 0;
    const coef = one ? '' : html ? (a[1] === 1 ? String(a[0]) : pw > 0 ? `(${a[0]}/${a[1]})` : `${a[0]}/${a[1]}`) : a[1] === 1 ? String(a[0]) : `\\frac{${a[0]}}{${a[1]}}`;
    const body = coef + (pw === 0 ? '' : pw === 1 ? (html ? `<i>${v}</i>` : v) : html ? `<i>${v}</i><sup>2</sup>` : `${v}^{2}`);
    s += s === '' ? (neg ? (html ? MINUS : '-') : '') + body : ` ${neg ? (html ? MINUS : '-') : '+'} ${body}`;
  }
  return s || '0';
}
export const polyT = (a: Co, b: Co, c: Co, v = 'x') => polyText([[a, 2], [b, 1], [c, 0]], v, false);
export const polyH = (a: Co, b: Co, c: Co, v = 'x') => polyText([[a, 2], [b, 1], [c, 0]], v, true);
export const linT = (b: Co, c: Co, v = 'x') => polyText([[b, 1], [c, 0]], v, false);
export const linH = (b: Co, c: Co, v = 'x') => polyText([[b, 1], [c, 0]], v, true);
/** (x − h) with the sign folded: x - 3, x + 2 */
export const binT = (h: number, v = 'x') => (h === 0 ? v : `${v} ${h > 0 ? '-' : '+'} ${Math.abs(h)}`);
export const binH = (h: number, v = 'x') => (h === 0 ? `<i>${v}</i>` : `<i>${v}</i> ${h > 0 ? MINUS : '+'} ${Math.abs(h)}`);

// ---------- evaluating a quadratic at a complex number ----------
export interface Eval { z2: Cx; az2: Cx; bz: Cx; val: Cx }
/** A·z² + B·z + C (A, B, C complex) */
export function evalQ(A: Cx, B: Cx, Cc: Cx, z: Cx): Eval {
  const z2 = mul(z, z), az2 = mul(A, z2), bz = mul(B, z);
  return { z2, az2, bz, val: add(add(az2, bz), Cc) };
}
export const RE = (v: number): Cx => C(v, 0);
export const isZ = (z: Cx) => z.re[0] === 0 && z.im[0] === 0;
/** z² computed with i² = +1 (the slip): (p + qi)² → p² + q² + 2pq i */
export const sqPlus = (z: Cx): Cx => ({ re: qAdd(qMul(z.re, z.re), qMul(z.im, z.im)), im: qMul(q(2), qMul(z.re, z.im)) });
/** z² squared part by part (the slip): (p + qi)² → p² + q²i² = p² − q² */
export const sqParts = (z: Cx): Cx => ({ re: qSub(qMul(z.re, z.re), qMul(z.im, z.im)), im: q(0) });

// ---------- keys (a VALUE, however it is written) ----------
export const keyNR = nrKey;
export const keyReal = (r: Roots) => `re:${rootVals(r).map(v => v.toFixed(9)).join(',')}`;
/** a quadratic up to a nonzero factor: monic coefficients */
export const keyQuad = (a: number, b: number, c: number) => `qd:${(b / a).toFixed(9)},${(c / a).toFixed(9)}`;
export const keyCx = (z: Cx) => `z:${z.re[0]}/${z.re[1]}:${z.im[0]}/${z.im[1]}`;
/** the solutions of an integer quadratic as a key (real or non-real) */
export function keySolve(a: number, b: number, c: number): string { return disc(a, b, c) < 0 ? nrKey(nonReal(a, b, c)) : keyReal(realRoots(a, b, c)); }

// ---------- the i² = +1 slip and the part-by-part slip, for classifying wrong values ----------
/** (a + bi)(c + di) computed with i² = +1 */
export const mulPlus = (z: Cx, w: Cx): Cx => ({ re: qAdd(qMul(z.re, w.re), qMul(z.im, w.im)), im: qAdd(qMul(z.re, w.im), qMul(z.im, w.re)) });
/** A·z² + B·z + C with i² read as +1 everywhere */
export function evalPlus(A: Cx, B: Cx, Cc: Cx, z: Cx): Cx { return add(add(mulPlus(A, mulPlus(z, z)), mulPlus(B, z)), Cc); }
/** A·z² + B·z + C with z² squared part by part ((p + qi)² → p² + q²i²) */
export function evalParts(A: Cx, B: Cx, Cc: Cx, z: Cx): Cx { return add(add(mul(A, sqParts(z)), mul(B, z)), Cc); }
