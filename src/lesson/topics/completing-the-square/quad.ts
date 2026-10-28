// quad.ts: exact maths of "Solving quadratics" (completing the square, the quadratic formula, the discriminant).
// Pure: no DOM. Fractions are [p, q] (q > 0, lowest terms) from number-properties/numbers.ts.
//   roots(a, b, c)   the real solutions of ax² + bx + c = 0 (integer a, b, c) EXACTLY: none, one rational, two
//                    rational, or (P ± K√m) / Q in simplest radical form (gcd(P, K, Q) = 1, Q > 0, m square-free)
//   complete(b, c)   x² + bx + c = 0 completed: h = b/2, (x + h)² = h² − c (exact fractions, b and c may be fractions)
// Text: T* = TeX for the board, H* = HTML for the panel (a real minus sign, linear fractions in prompts).
import { type Q, q, qAdd, qMul, qSub, qNeg, qVal, qEq, squareFree } from '../number-properties/numbers';
import { fr } from '../../runtime/item';

export type { Q };
export { q, qAdd, qMul, qSub, qNeg, qVal, qEq, squareFree };
export const gcd = (a: number, b: number): number => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
export const isSq = (n: number) => n >= 0 && Number.isInteger(Math.sqrt(n)) && Math.sqrt(n) ** 2 === n;

// ---------- numbers as text ----------
/** an integer in HTML (real minus) */
export const iH = (v: number) => (v < 0 ? `−${-v}` : String(v));
/** a decimal in HTML (real minus) */
export const dH = (v: number) => (v < 0 ? `−${-v}` : String(v));
export const iT = (v: number) => (v < 0 ? `-${-v}` : String(v));
/** a fraction in TeX: -\frac{9}{4} or an integer */
export function qT(a: Q): string { return a[1] === 1 ? iT(a[0]) : `${a[0] < 0 ? '-' : ''}\\frac{${Math.abs(a[0])}}{${a[1]}}`; }
/** a fraction in HTML (stacked) */
export function qH(a: Q): string { return a[1] === 1 ? iH(a[0]) : `${a[0] < 0 ? '−' : ''}${fr(Math.abs(a[0]), a[1])}`; }
/** a fraction as linear text (9/4, −3/2) for choices and short prose */
export function qL(a: Q): string { return a[1] === 1 ? iH(a[0]) : `${a[0] < 0 ? '−' : ''}${Math.abs(a[0])}/${a[1]}`; }
/** a decimal for a fraction whose denominator divides a power of ten (−0.5), else null */
export function qDec(a: Q): number | null {
  let d = a[1]; while (d % 2 === 0) d /= 2; while (d % 5 === 0) d /= 5;
  return d === 1 ? a[0] / a[1] : null;
}

// ---------- polynomials as text ----------
/** terms [coefficient, power] → "2x^2 - 3x + 1" (TeX) / "2x² − 3x + 1" (HTML); zero terms dropped; x is the variable */
export type Term = readonly [Q | number, number];
const asQ = (c: Q | number): Q => (typeof c === 'number' ? q(c) : c);
function termBody(pw: number, v: string, html: boolean): string {
  if (pw === 0) return '';
  if (pw === 1) return html ? `<i>${v}</i>` : v;
  return html ? `<i>${v}</i>²` : `${v}^2`;
}
export function polyT(terms: readonly Term[], v = 'x'): string {
  let s = '';
  for (const [c0, pw] of terms) {
    const c = asQ(c0); if (c[0] === 0) continue;
    const neg = c[0] < 0, abs: Q = [Math.abs(c[0]), c[1]];
    const one = abs[0] === 1 && abs[1] === 1 && pw > 0;
    const coef = one ? '' : qT(abs);
    const body = coef + termBody(pw, v, false);
    s += s === '' ? (neg ? '-' : '') + body : ` ${neg ? '-' : '+'} ${body}`;
  }
  return s || '0';
}
export function polyH(terms: readonly Term[], v = 'x', linear = false): string {
  let s = '';
  for (const [c0, pw] of terms) {
    const c = asQ(c0); if (c[0] === 0) continue;
    const neg = c[0] < 0, abs: Q = [Math.abs(c[0]), c[1]];
    const one = abs[0] === 1 && abs[1] === 1 && pw > 0;
    const coef = one ? '' : abs[1] !== 1 && pw > 0 ? `(${qL(abs)})` : linear ? qL(abs) : qH(abs);
    const body = coef + termBody(pw, v, true);
    s += s === '' ? (neg ? '−' : '') + body : ` ${neg ? '−' : '+'} ${body}`;
  }
  return s || '0';
}
/** ax² + bx + c */
export const quadTerms = (a: Q | number, b: Q | number, c: Q | number): Term[] => [[a, 2], [b, 1], [c, 0]];
/** (x + h) with the sign folded: (x − 3), (x + 3/2) */
export function binT(h: Q, v = 'x'): string { return h[0] === 0 ? v : `${v} ${h[0] < 0 ? '-' : '+'} ${qT([Math.abs(h[0]), h[1]])}`; }
export function binH(h: Q, v = 'x', linear = false): string { const a: Q = [Math.abs(h[0]), h[1]]; return h[0] === 0 ? `<i>${v}</i>` : `<i>${v}</i> ${h[0] < 0 ? '−' : '+'} ${linear ? qL(a) : qH(a)}`; }

// ---------- completing the square ----------
export interface Completed { h: Q; add: Q; rhs: Q }
/** x² + bx + c = 0 → (x + h)² = rhs, where h = b/2, add = h² is added to both sides, rhs = h² − c */
export function complete(b: Q, c: Q): Completed { const h = qMul(b, q(1, 2)), add = qMul(h, h); return { h, add, rhs: qSub(add, c) }; }

// ---------- exact roots ----------
export type Roots =
  | { kind: 'none' }
  | { kind: 'one'; x: Q }
  | { kind: 'rat'; x1: Q; x2: Q }               // x1 < x2
  | { kind: 'surd'; P: number; K: number; m: number; Q: number };   // (P ± K√m)/Q, K > 0, Q > 0
export function disc(a: number, b: number, c: number): number { return b * b - 4 * a * c; }
export function roots(a: number, b: number, c: number): Roots {
  if (a === 0) throw new Error('roots: a = 0');
  const D = disc(a, b, c);
  if (D < 0) return { kind: 'none' };
  if (D === 0) return { kind: 'one', x: q(-b, 2 * a) };
  if (isSq(D)) { const s = Math.sqrt(D), r1 = q(-b - s, 2 * a), r2 = q(-b + s, 2 * a); return qVal(r1) < qVal(r2) ? { kind: 'rat', x1: r1, x2: r2 } : { kind: 'rat', x1: r2, x2: r1 }; }
  const { k, m } = squareFree(D);
  let P = -b, K = k, Qd = 2 * a;
  if (Qd < 0) { P = -P; Qd = -Qd; }          // ± absorbs the sign of K
  const g = gcd(gcd(P, K), Qd) || 1;
  return { kind: 'surd', P: P / g, K: K / g, m, Q: Qd / g };
}
/** roots (P ± K√m)/Q given directly (used for distractors); reduced the same way */
export function surd(P: number, K: number, m: number, Qd: number): Roots {
  const sf = squareFree(m); K *= sf.k; m = sf.m;
  if (m === 1) { const r1 = q(P - K, Qd), r2 = q(P + K, Qd); return qVal(r1) < qVal(r2) ? { kind: 'rat', x1: r1, x2: r2 } : { kind: 'rat', x1: r2, x2: r1 }; }
  if (Qd < 0) { P = -P; Qd = -Qd; }
  K = Math.abs(K);
  const g = gcd(gcd(P, K), Qd) || 1;
  return { kind: 'surd', P: P / g, K: K / g, m, Q: Qd / g };
}
/** the numeric values of the roots, ascending */
export function rootVals(r: Roots): number[] {
  switch (r.kind) {
    case 'none': return [];
    case 'one': return [qVal(r.x)];
    case 'rat': return [qVal(r.x1), qVal(r.x2)];
    case 'surd': return [(r.P - r.K * Math.sqrt(r.m)) / r.Q, (r.P + r.K * Math.sqrt(r.m)) / r.Q];
  }
}
export function sameRoots(a: Roots, b: Roots): boolean {
  const x = rootVals(a), y = rootVals(b);
  return x.length === y.length && x.every((v, i) => Math.abs(v - y[i]!) < 1e-9);
}
const rootPart = (K: number, m: number, html: boolean) => (html ? `${K === 1 ? '' : K}√<u class="rb">${m}</u>` : `${K === 1 ? '' : K}\\sqrt{${m}}`);
/** the solutions as linear HTML: "x = −2 ± √3", "x = (−3 ± √13)/2", "x = 2 or x = −1/2", "x = −3 (one solution)", "no real solutions" */
export function rootsH(r: Roots, v = 'x'): string {
  const V = `<i>${v}</i>`;
  switch (r.kind) {
    case 'none': return 'no real solutions';
    case 'one': return `${V} = ${qL(r.x)} only`;
    case 'rat': return `${V} = ${qL(r.x1)} or ${V} = ${qL(r.x2)}`;
    case 'surd': {
      const rp = rootPart(r.K, r.m, true);
      if (r.Q === 1) return r.P === 0 ? `${V} = ±${rp}` : `${V} = ${iH(r.P)} ± ${rp}`;
      return r.P === 0 ? `${V} = ±${rp}/${r.Q}` : `${V} = (${iH(r.P)} ± ${rp})/${r.Q}`;
    }
  }
}
/** the solutions in TeX */
export function rootsT(r: Roots, v = 'x'): string {
  switch (r.kind) {
    case 'none': return '\\text{no real solutions}';
    case 'one': return `${v} = ${qT(r.x)}`;
    case 'rat': return `${v} = ${qT(r.x1)} \\text{ or } ${v} = ${qT(r.x2)}`;
    case 'surd': {
      const rp = rootPart(r.K, r.m, false);
      if (r.Q === 1) return r.P === 0 ? `${v} = \\pm ${rp}` : `${v} = ${iT(r.P)} \\pm ${rp}`;
      return r.P === 0 ? `${v} = \\pm\\frac{${rp}}{${r.Q}}` : `${v} = \\frac{${iT(r.P)} \\pm ${rp}}{${r.Q}}`;
    }
  }
}
/** a decimal rounded to `d` places is safe to ask when the value is not within 0.02 of a rounding tie */
export function noTie(v: number, d = 2, margin = 0.02): boolean { const s = Math.abs(v) * 10 ** d, f = s - Math.floor(s); return Math.abs(f - 0.5) > margin; }
export const round = (v: number, d = 2) => Math.round(v * 10 ** d) / 10 ** d;
