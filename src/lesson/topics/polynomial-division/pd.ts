// pd.ts: exact polynomial division for the lesson (no DOM). A polynomial in x is a DENSE coefficient row in
// descending powers (index 0 = the leading power), with exact rational coefficients (core/math Q), so a missing
// power is a 0 in its column: exactly the layout long division and synthetic division need.
//   divide(P, D)   long division, cycle by cycle (quotient term, product row, new residual), plus Q and R
//   synth(P, c)    synthetic division by x − c: the middle (product) row and the bottom row
// Writing (TeX for the board, HTML for prompts) goes through polynomials/poly.ts: fractions as x/2, 3x/4 (plain text
// reads 3x/4), a real minus, no "1x", no "+ −". `full` writes the zero placeholders (x^4 + 0x^3 − 3x^2 + 0x + 5).
import { type Q, qAdd, qDiv, qMul, rat } from '../../../core/math';
import { type Poly, T, polyHtml, polyTex } from '../polynomials/poly';

export type { Q };
export type Co = Q[];
export const q = (p: number, d = 1): Q => rat(p, d);
export const co = (xs: readonly (number | Q)[]): Co => xs.map(v => (typeof v === 'number' ? rat(v) : v));
export const isZ = (a: Q) => a.p === 0;
export const qNeg = (a: Q): Q => rat(-a.p, a.q);
export const qSub = (a: Q, b: Q): Q => qAdd(a, qNeg(b));
export const qv = (a: Q) => a.p / a.q;
export const qEq = (a: Q, b: Q) => a.p === b.p && a.q === b.q;
export { qAdd, qMul, qDiv };

/** drop leading zero coefficients (the zero polynomial stays [0]) */
export function trim(c: Co): Co { let i = 0; while (i < c.length - 1 && isZ(c[i]!)) i++; return c.slice(i); }
/** degree; null for the zero polynomial */
export function degOf(c: Co): number | null { const t = trim(c); return t.length === 1 && isZ(t[0]!) ? null : t.length - 1; }
export const isZero = (c: Co) => degOf(c) === null;
/** left-pad with zeros to length n (same polynomial) */
export function pad(c: Co, n: number): Co { const t = trim(c); return t.length >= n ? t : [...Array.from({ length: n - t.length }, () => rat(0)), ...t]; }
export function addC(a: Co, b: Co): Co { const n = Math.max(a.length, b.length), A = pad(a, n), B = pad(b, n); return trim(A.map((x, i) => qAdd(x, B[i]!))); }
export const negC = (a: Co): Co => a.map(qNeg);
export const subC = (a: Co, b: Co): Co => addC(a, negC(b));
export function mulC(a: Co, b: Co): Co {
  const out = Array.from({ length: a.length + b.length - 1 }, () => rat(0));
  a.forEach((x, i) => b.forEach((y, j) => { out[i + j] = qAdd(out[i + j]!, qMul(x, y)); }));
  return trim(out);
}
export const scaleC = (a: Co, k: Q): Co => trim(a.map(x => qMul(x, k)));
/** times x^k */
export const shiftC = (a: Co, k: number): Co => trim([...a, ...Array.from({ length: k }, () => rat(0))]);
export const keyC = (c: Co) => trim(c).map(v => `${v.p}/${v.q}`).join(',');
export const eqC = (a: Co, b: Co) => keyC(a) === keyC(b);
export function evalC(c: Co, x: Q): Q { let s = rat(0); for (const a of c) s = qAdd(qMul(s, x), a); return s; }
/** coefficient of x^k (0 when absent) */
export function coefAt(c: Co, k: number): Q { const t = trim(c); const i = t.length - 1 - k; return i >= 0 && i < t.length ? t[i]! : rat(0); }
/** every coefficient a whole number */
export const whole = (c: Co) => c.every(v => v.q === 1);

// ---------- long division ----------
export interface Cycle {
  /** the quotient term t·x^pow */ t: Q; pow: number;
  /** the residual before the cycle, the product t·x^pow·D, the residual after (S − t·x^pow·D) */
  before: Co; prod: Co; after: Co;
}
export interface Division { Q: Co; R: Co; cycles: Cycle[] }
export function divide(P: Co, D: Co): Division {
  const m = degOf(D);
  if (m === null) throw new Error('divide: D is the zero polynomial');
  const Dt = trim(D), lead = Dt[0]!;
  let S = trim(P), Qc: Co = [rat(0)];
  const cycles: Cycle[] = [];
  for (let guard = 0; guard < 20; guard++) {
    const d = degOf(S);
    if (d === null || d < m) break;
    const t = qDiv(S[0]!, lead), pow = d - m;
    const prod = shiftC(scaleC(Dt, t), pow);
    const after = subC(S, prod);
    cycles.push({ t, pow, before: S, prod, after });
    Qc = addC(Qc, shiftC([t], pow));
    S = after;
  }
  return { Q: trim(Qc), R: trim(S), cycles };
}
// ---------- synthetic division by x − c ----------
export interface Synth { top: Co; mid: Q[]; bot: Q[]; Q: Co; R: Q }
/** `top` is the complete coefficient row of P (placeholders included); mid[0] is unused (0) */
export function synth(P: Co, c: Q): Synth {
  const top = trim(P), bot: Q[] = [], mid: Q[] = [rat(0)];
  top.forEach((a, j) => { if (j === 0) bot.push(a); else { const m = qMul(c, bot[j - 1]!); mid.push(m); bot.push(qAdd(a, m)); } });
  return { top, mid, bot, Q: trim(bot.slice(0, -1).length ? bot.slice(0, -1) : [rat(0)]), R: bot[bot.length - 1]! };
}

// ---------- writing ----------
export const MINUS = '−';
/** the terms of c as poly.ts terms; `full` keeps zero coefficients below the leading power (placeholders) */
export function toPoly(c: Co, full = false): Poly {
  const t = trim(c), n = t.length - 1;
  if (degOf(t) === null) return [];
  return t.flatMap((a, i) => (isZ(a) && !full ? [] : [T(a, n - i, 0, a.q === 1 ? undefined : 'over')]));
}
export const pT = (c: Co, full = false) => polyTex(toPoly(c, full));
export const pH = (c: Co, full = false) => polyHtml(toPoly(c, full));
const terms = (c: Co) => trim(c).filter(a => !isZ(a)).length;
/** in parentheses when it has more than one term */
export const parT = (c: Co) => (terms(c) > 1 ? `(${pT(c)})` : pT(c));
export const parH = (c: Co) => (terms(c) > 1 ? `(${pH(c)})` : pH(c));
/** always in parentheses (a divisor or factor written next to another) */
export const brT = (c: Co) => `(${pT(c)})`;
export const brH = (c: Co) => `(${pH(c)})`;
/** a number with a real minus; fractions as a/b */
export function qH(a: Q): string { const s = a.p < 0 ? MINUS : ''; const p = Math.abs(a.p); return a.q === 1 ? `${s}${p}` : `${s}${p}/${a.q}`; }
export function qT(a: Q): string { const s = a.p < 0 ? '-' : ''; const p = Math.abs(a.p); return a.q === 1 ? `${s}${p}` : `${s}\\tfrac{${p}}{${a.q}}`; }
export const nH = (v: number) => (v < 0 ? MINUS + Math.abs(v) : String(v));
/** a number as a factor after · or ×: a negative one in brackets, 3 · (−4) */
export const nP = (v: number) => (v < 0 ? `(${nH(v)})` : nH(v));
/** HTML x to a power */
export const xp = (k: number) => (k === 0 ? '1' : k === 1 ? '<i>x</i>' : `<i>x</i><sup>${k}</sup>`);
export const X = '<i>x</i>';
/** "A + B" with the sign of B's leading term moved out ("x + 3 − 2", never "+ −") */
export function plusH(a: string, b: Co): string { const t = trim(b); return t[0]!.p < 0 ? `${a} ${MINUS} ${pH(t).slice(MINUS.length)}` : `${a} + ${pH(t)}`; }
export function plusT(a: string, b: Co): string { const t = trim(b); return t[0]!.p < 0 ? `${a} - ${pT(t).slice(1)}` : `${a} + ${pT(t)}`; }
/** D·Q written as a product: a single-term factor goes first without brackets (x(x + 4), 3(x − 2)), else (D)(Q) */
const oneTerm = (c: Co) => trim(c).filter(v => !isZ(v)).length === 1;
export function prodH(D: Co, Qc: Co): string { return oneTerm(Qc) ? `${pH(Qc)}${brH(D)}` : oneTerm(D) ? `${pH(D)}${brH(Qc)}` : `${brH(D)}${brH(Qc)}`; }
export function prodT(D: Co, Qc: Co): string { return oneTerm(Qc) ? `${pT(Qc)}${brT(D)}` : oneTerm(D) ? `${pT(D)}${brT(Qc)}` : `${brT(D)}${brT(Qc)}`; }
/** P = D·Q + R written out: (D)(Q) + R; R = 0 → (D)(Q) */
export function identH(P: Co, D: Co, Qc: Co, R: Co): string { const prod = prodH(D, Qc); return `${pH(P)} = ${isZero(R) ? prod : plusH(prod, R)}`; }
export function identT(P: Co, D: Co, Qc: Co, R: Co): string { const prod = prodT(D, Qc); return `${pT(P)} = ${isZero(R) ? prod : plusT(prod, R)}`; }
/** Q + R/D (HTML, plain text unambiguous): x + 3 + 1/(x + 2), x − 1 − 4/(x + 2), x + (2x − 1)/(x^2 + 1) */
export function qrH(Qc: Co, R: Co, D: Co): string {
  const Rt = trim(R);
  if (isZero(Rt)) return pH(Qc);
  const neg = Rt[0]!.p < 0, Ra = neg ? negC(Rt) : Rt;
  const frac = `${parH(Ra)}/${brH(D)}`;
  if (isZero(Qc)) return `${neg ? MINUS : ''}${frac}`;
  return `${pH(Qc)} ${neg ? MINUS : '+'} ${frac}`;
}
export function qrT(Qc: Co, R: Co, D: Co): string {
  const Rt = trim(R);
  if (isZero(Rt)) return pT(Qc);
  const neg = Rt[0]!.p < 0, Ra = neg ? negC(Rt) : Rt;
  const frac = `\\frac{${pT(Ra)}}{${pT(D)}}`;
  if (isZero(Qc)) return `${neg ? '-' : ''}${frac}`;
  return `${pT(Qc)} ${neg ? '-' : '+'} ${frac}`;
}
/** the zero of a linear divisor ax + b (as Q) */
export const zeroOf = (D: Co): Q => qDiv(qNeg(trim(D)[1]!), trim(D)[0]!);
/** x − c as a coefficient row */
export const xMinus = (c: number | Q): Co => co([1, typeof c === 'number' ? -c : qNeg(c)]);
/** "x ≠ c" in HTML */
export const neqH = (c: Q) => `${X} ≠ ${qH(c)}`;
export const DEG_NAMES = ['constant', 'linear', 'quadratic', 'cubic', 'quartic'] as const;
