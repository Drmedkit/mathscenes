// numbers.ts: exact numbers for "Properties and the real numbers". Pure: no DOM.
//   Q     an exact fraction [p, q] (q > 0, lowest terms)
//   Real  r + s·√n (n square-free >= 2) or r + s·π, with r, s exact fractions; s = 0 is a rational number
//   innermost(x)  the smallest US set that holds x BY ITS VALUE (12/4 = 3 is a counting number, √49 = 7 too)
//   setsOf(x)     every set that holds x (nested: counting ⊂ whole ⊂ integers ⊂ rational ⊂ real; irrational beside)
// Text: tex(x) for the board, html(x) for the panel (a real minus sign).

export type Q = readonly [number, number];
const gcd = (a: number, b: number): number => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
export function q(p: number, d = 1): Q {
  if (!Number.isInteger(p) || !Number.isInteger(d) || d === 0) throw new Error(`q: not a fraction ${p}/${d}`);
  const g = gcd(p, d), s = d < 0 ? -1 : 1;
  return [(s * p) / g + 0, (s * d) / g];
}
export const qAdd = (a: Q, b: Q): Q => q(a[0] * b[1] + b[0] * a[1], a[1] * b[1]);
export const qNeg = (a: Q): Q => q(-a[0], a[1]);
export const qSub = (a: Q, b: Q): Q => qAdd(a, qNeg(b));
export const qMul = (a: Q, b: Q): Q => q(a[0] * b[0], a[1] * b[1]);
export const qInv = (a: Q): Q => { if (a[0] === 0) throw new Error('0 has no reciprocal'); return q(a[1], a[0]); };
export const qDiv = (a: Q, b: Q): Q => qMul(a, qInv(b));
export const qEq = (a: Q, b: Q) => a[0] === b[0] && a[1] === b[1];
export const qIsInt = (a: Q) => a[1] === 1;
export const qVal = (a: Q) => a[0] / a[1];
/** a decimal with at most 6 places as an exact fraction (0.25 -> 1/4) */
export function qOf(v: number): Q {
  for (const d of [1, 10, 100, 1000, 10000, 100000, 1000000]) { const p = Math.round(v * d); if (Math.abs(p / d - v) < 1e-9) return q(p, d); }
  throw new Error(`qOf: ${v} is not a short decimal`);
}

export interface Real { r: Q; s: Q; n: number /* 1 = rational, >= 2 = √n, 0 = π */ }
export const R = (p: number, d = 1): Real => ({ r: q(p, d), s: q(0), n: 1 });
export const RQ = (a: Q): Real => ({ r: a, s: q(0), n: 1 });
export const frac = (p: number, d: number): Real => RQ(q(p, d));
export const PI: Real = { r: q(0), s: q(1), n: 0 };
/** n = k² · m with m square-free */
export function squareFree(n: number): { k: number; m: number } {
  if (!Number.isInteger(n) || n < 0) throw new Error(`squareFree: ${n}`);
  let k = 1, m = n;
  for (let f = 2; f * f <= m; f++) while (m % (f * f) === 0) { m /= f * f; k *= f; }
  return { k, m };
}
/** √n for a whole number n, exact (√50 = 5√2, √49 = 7) */
export function sqrt(n: number): Real {
  if (n === 0) return R(0);
  const { k, m } = squareFree(n);
  return m === 1 ? R(k) : { r: q(0), s: q(k), n: m };
}
function norm(x: Real): Real { return x.s[0] === 0 ? { r: x.r, s: q(0), n: 1 } : x; }
export const isRational = (x: Real) => x.s[0] === 0;
export function add(a: Real, b: Real): Real {
  if (isRational(a)) return norm({ r: qAdd(a.r, b.r), s: b.s, n: b.n });
  if (isRational(b)) return norm({ r: qAdd(a.r, b.r), s: a.s, n: a.n });
  if (a.n !== b.n) throw new Error('add: two different irrational parts');
  return norm({ r: qAdd(a.r, b.r), s: qAdd(a.s, b.s), n: a.n });
}
export const neg = (a: Real): Real => norm({ r: qNeg(a.r), s: qNeg(a.s), n: a.n });
export const sub = (a: Real, b: Real) => add(a, neg(b));
export function mul(a: Real, b: Real): Real {
  if (isRational(a)) return norm({ r: qMul(a.r, b.r), s: qMul(a.r, b.s), n: b.n });
  if (isRational(b)) return mul(b, a);
  if (a.n !== b.n || a.n === 0) throw new Error('mul: only the same square root');
  // (r1 + s1√n)(r2 + s2√n) = r1 r2 + s1 s2 n + (r1 s2 + r2 s1)√n
  return norm({ r: qAdd(qMul(a.r, b.r), qMul(qMul(a.s, b.s), q(a.n))), s: qAdd(qMul(a.r, b.s), qMul(b.r, a.s)), n: a.n });
}
export const eq = (a: Real, b: Real) => qEq(a.r, b.r) && qEq(a.s, b.s) && (a.n === b.n || a.s[0] === 0);
export const approx = (x: Real) => qVal(x.r) + qVal(x.s) * (x.n === 0 ? Math.PI : Math.sqrt(x.n));

// ---------- the US number sets ----------
export type SetId = 'counting' | 'whole' | 'integer' | 'rational' | 'irrational';
export const SET_IDS: readonly SetId[] = ['counting', 'whole', 'integer', 'rational', 'irrational'];
export const SET_NAME: Record<SetId, string> = { counting: 'Counting', whole: 'Whole', integer: 'Integers', rational: 'Rational', irrational: 'Irrational' };
/** the long names for the panel */
export const SET_LONG: Record<SetId, string> = { counting: 'counting numbers', whole: 'whole numbers', integer: 'integers', rational: 'rational numbers', irrational: 'irrational numbers' };
export const SETS_OF: Record<SetId, readonly SetId[]> = {
  counting: ['counting', 'whole', 'integer', 'rational'], whole: ['whole', 'integer', 'rational'],
  integer: ['integer', 'rational'], rational: ['rational'], irrational: ['irrational'],
};
export function innermost(x: Real): SetId {
  if (!isRational(x)) return 'irrational';
  const [p, d] = x.r;
  if (d !== 1) return 'rational';
  return p >= 1 ? 'counting' : p === 0 ? 'whole' : 'integer';
}
export const inSet = (x: Real, s: SetId) => SETS_OF[innermost(x)].includes(s);

// ---------- text ----------
const qTex = (a: Q, frac = '\\frac') => (a[1] === 1 ? String(Math.abs(a[0])) : `${frac}{${Math.abs(a[0])}}{${a[1]}}`);
/** TeX of a Real in its simplest exact form */
export function tex(x: Real): string {
  if (isRational(x)) return (x.r[0] < 0 ? '-' : '') + qTex(x.r);
  const root = x.n === 0 ? '\\pi' : `\\sqrt{${x.n}}`;
  const sa = Math.abs(x.s[0]), coef = x.s[1] === 1 ? (sa === 1 ? '' : String(sa)) : '';
  const irr = x.s[1] === 1 ? `${coef}${root}` : `\\frac{${sa === 1 ? '' : sa}${root}}{${x.s[1]}}`;
  if (x.r[0] === 0) return (x.s[0] < 0 ? '-' : '') + irr;
  return `${x.r[0] < 0 ? '-' : ''}${qTex(x.r)} ${x.s[0] < 0 ? '-' : '+'} ${irr}`;
}
const fr = (n: number | string, d: number | string) => `<span class="fr"><span>${n}</span><span>${d}</span></span>`;
const qHtml = (a: Q) => (a[1] === 1 ? String(Math.abs(a[0])) : fr(Math.abs(a[0]), a[1]));
/** HTML of a Real (√ with an overline radicand, a real minus sign) */
export function html(x: Real): string {
  if (isRational(x)) return (x.r[0] < 0 ? '−' : '') + qHtml(x.r);
  const root = x.n === 0 ? 'π' : rootHtml(x.n);
  const sa = Math.abs(x.s[0]), coef = sa === 1 ? '' : String(sa);
  const irr = x.s[1] === 1 ? `${coef}${root}` : fr(`${coef}${root}`, x.s[1]);
  if (x.r[0] === 0) return (x.s[0] < 0 ? '−' : '') + irr;
  return `${x.r[0] < 0 ? '−' : ''}${qHtml(x.r)} ${x.s[0] < 0 ? '−' : '+'} ${irr}`;
}
export const rootHtml = (n: number | string) => `√<span class="rad">${n}</span>`;
/** a signed number as HTML text */
export const H = (v: number) => (v < 0 ? '−' + fmt(-v) : fmt(v));
/** a signed number as TeX */
export const T = (v: number) => (v < 0 ? '-' + fmt(-v) : fmt(v));
/** a number without float noise (up to 4 decimals) */
export function fmt(v: number): string { const r = Math.round(v * 10000) / 10000; return String(Object.is(r, -0) ? 0 : r); }
/** a fraction as TeX / HTML, signed */
export const QT = (a: Q, frac = '\\frac') => (a[0] < 0 ? '-' : '') + qTex(a, frac);
export const QH = (a: Q) => (a[0] < 0 ? '−' : '') + qHtml(a);
