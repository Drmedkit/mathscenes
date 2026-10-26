// rad.ts: exact maths for "Radicals and rational exponents". Pure: no DOM.
//   iroot(a, n)        the exact principal nth root of an integer, or null (not a perfect power / not real)
//   powQ(b, m, n)      b^(m/n) for a rational base: a rational value, 'irrational', or 'notreal' (reduced m/n convention)
//   extract(k, n)      k = out^n * rest with rest free of nth powers (simplest radical form)
//   Surd               a sum of rational multiples of square roots (r0 + r1 √2 + r3 √3 ...), exact + - ×
// Text: TeX (board) and HTML (panel) for roots, powers and exponents, with a real minus sign in HTML.
import { type Q, q, qAdd, qMul, qNeg, qEq, QT, QH } from '../number-properties/numbers';

export type { Q };
export { q, qAdd, qMul, qNeg, qEq, QT, QH };

const gcd = (a: number, b: number): number => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
export { gcd };

/** exact integer power (throws when it leaves the safe integers) */
export function ipow(a: number, e: number): number {
  let r = 1;
  for (let i = 0; i < e; i++) r *= a;
  if (!Number.isSafeInteger(r)) throw new Error(`ipow: ${a}^${e} too big`);
  return r;
}
/** the principal nth root of an integer if it is an integer; null when it is not a whole number or not real */
export function iroot(a: number, n: number): number | null {
  if (!Number.isInteger(a) || n < 1) return null;
  if (a < 0) { if (n % 2 === 0) return null; const r = iroot(-a, n); return r === null ? null : -r; }
  const g = Math.round(Math.pow(a, 1 / n));
  for (const c of [g - 1, g, g + 1]) if (c >= 0 && ipow(c, n) === a) return c;
  return null;
}
export type PowVal = { kind: 'value'; v: Q } | { kind: 'irrational' } | { kind: 'notreal' } | { kind: 'undefined' };
/** b^(m/n), m/n reduced first (the lowest-terms convention for negative bases) */
export function powQ(b: Q, m: number, n: number): PowVal {
  if (n <= 0) throw new Error('powQ: n > 0');
  const g = gcd(m, n) || 1; m /= g; n /= g;
  if (b[0] === 0) return m > 0 ? { kind: 'value', v: q(0) } : { kind: 'undefined' };
  if (b[0] < 0 && n % 2 === 0) return { kind: 'notreal' };
  const rp = iroot(b[0], n), rq = iroot(b[1], n);
  if (rp === null || rq === null) return { kind: 'irrational' };
  const am = Math.abs(m);
  const top = ipow(rp, am), bot = ipow(rq, am);
  return { kind: 'value', v: m >= 0 ? q(top, bot) : q(bot, top) };
}
/** k = out^n · rest, with no nth power > 1 left in rest (k > 0) */
export function extract(k: number, n: number): { out: number; rest: number } {
  if (!Number.isInteger(k) || k <= 0) throw new Error(`extract: ${k}`);
  let out = 1, rest = k;
  for (let f = 2; ipow(f, n) <= rest; f++) { const p = ipow(f, n); while (rest % p === 0) { rest /= p; out *= f; } }
  return { out, rest };
}
export const nthFree = (k: number, n: number) => extract(k, n).out === 1;
/** prime factors in order (72 → 2 2 2 3 3) */
export function primes(k: number): number[] {
  const out: number[] = [];
  for (let f = 2; f * f <= k; f++) while (k % f === 0) { out.push(f); k /= f; }
  if (k > 1) out.push(k);
  return out;
}

// ---------- surds: Σ c_r √r, r square-free (r = 1 is the rational part) ----------
export type Surd = ReadonlyMap<number, Q>;
function clean(m: Map<number, Q>): Surd { for (const [r, c] of [...m]) if (c[0] === 0) m.delete(r); return m; }
export const S = (c: number | Q, r = 1): Surd => {
  const cq: Q = typeof c === 'number' ? q(c) : c;
  const { out, rest } = extract(r, 2);
  return clean(new Map([[rest, qMul(cq, q(out))]]));
};
export function sAdd(a: Surd, b: Surd): Surd { const m = new Map(a); for (const [r, c] of b) m.set(r, qAdd(m.get(r) ?? q(0), c)); return clean(m); }
export const sNeg = (a: Surd): Surd => new Map([...a].map(([r, c]) => [r, qNeg(c)] as [number, Q]));
export const sSub = (a: Surd, b: Surd) => sAdd(a, sNeg(b));
export function sMul(a: Surd, b: Surd): Surd {
  let m: Surd = new Map();
  for (const [r1, c1] of a) for (const [r2, c2] of b) m = sAdd(m, S(qMul(c1, c2), r1 * r2));
  return m;
}
export const sScale = (a: Surd, k: Q): Surd => sMul(a, S(k));
export function sEq(a: Surd, b: Surd): boolean { const d = sSub(a, b); return d.size === 0; }
export const sVal = (a: Surd) => [...a].reduce((s, [r, c]) => s + (c[0] / c[1]) * Math.sqrt(r), 0);
export const sRational = (a: Surd) => [...a.keys()].every(r => r === 1);
/** the rational part / the coefficient of √r */
export const sPart = (a: Surd, r: number): Q => a.get(r) ?? q(0);

/** terms in order: rational part first, then radicals by radicand */
function terms(a: Surd): [number, Q][] { return [...a].sort((x, y) => x[0] - y[0]); }
/** TeX of a surd (integer coefficients expected; fractions are written as \frac) */
export function sTex(a: Surd): string {
  const ts = terms(a);
  if (!ts.length) return '0';
  return ts.map(([r, c], i) => {
    const neg = c[0] < 0, ac: Q = [Math.abs(c[0]), c[1]];
    const coef = r === 1 ? QT(ac) : (ac[0] === 1 && ac[1] === 1 ? '' : QT(ac));
    const body = r === 1 ? coef : `${coef}\\sqrt{${r}}`;
    return i === 0 ? (neg ? '-' : '') + body : ` ${neg ? '-' : '+'} ${body}`;
  }).join('');
}
export function sHtml(a: Surd): string {
  const ts = terms(a);
  if (!ts.length) return '0';
  return ts.map(([r, c], i) => {
    const neg = c[0] < 0, ac: Q = [Math.abs(c[0]), c[1]];
    const coef = r === 1 ? QH(ac) : (ac[0] === 1 && ac[1] === 1 ? '' : QH(ac));
    const body = r === 1 ? coef : `${coef}${rootH(2, r)}`;
    return i === 0 ? (neg ? '−' : '') + body : ` ${neg ? '−' : '+'} ${body}`;
  }).join('');
}

// ---------- text ----------
/** a root in TeX: \sqrt{s} or \sqrt[n]{s} */
export const rootT = (n: number, s: string | number) => (n === 2 ? `\\sqrt{${s}}` : `\\sqrt[${n}]{${s}}`);
/** a root in HTML: the sign, then a bar over the radicand (∛ and ∜ for 3 and 4) */
export const rootH = (n: number, s: string | number) => {
  // no <span> inside, so a root can sit in a fraction (fr); a radicand that is not a plain number gets parentheses that
  // only the plain-text reading sees (u.rb draws the bar; s.pp is hidden)
  const plainNum = /^[−-]?\d+$/.test(String(s));
  return `${n === 2 ? '√' : n === 3 ? '∛' : n === 4 ? '∜' : `<sup>${n}</sup>√`}<u class="rb">${plainNum ? s : `<s class="pp">(</s>${s}<s class="pp">)</s>`}</u>`;
};
/** an exponent m/n (reduced or not, as given) in TeX */
export function expT(m: number, n: number): string {
  if (n === 1) return m < 0 ? `-${-m}` : String(m);
  return m < 0 ? `-\\frac{${-m}}{${n}}` : `\\frac{${m}}{${n}}`;
}
/** an exponent in HTML (inside <sup>) */
export const expH = (m: number, n: number) => (n === 1 ? (m < 0 ? `−${-m}` : String(m)) : `${m < 0 ? '−' : ''}${Math.abs(m)}/${n}`);
/** base^(m/n) in TeX; a negative or fractional base is put in parentheses */
export function powT(base: string, m: number, n: number): string {
  const b = /^-|\\frac|[+\- ]/.test(base) && !/^\(.*\)$/.test(base) ? `\\left(${base}\\right)` : base;
  return `${b}^{${expT(m, n)}}`;
}
export function powH(base: string, m: number, n: number): string {
  const b = /^−|<span class="fr">|[+−] /.test(base) && !/^\(.*\)$/.test(base) ? `(${base})` : base;
  return `${b}<sup>${expH(m, n)}</sup>`;
}
/** a signed integer: TeX / HTML */
export const iT = (v: number) => (v < 0 ? `-${-v}` : String(v));
export const iH = (v: number) => (v < 0 ? `−${-v}` : String(v));
/** an exact fraction as TeX / HTML (whole numbers plain) */
export const qT = (a: Q) => QT(a);
export const qH = (a: Q) => QH(a);
export const V = (s: string) => `<i>${s}</i>`;
/** x^e for a variable in TeX / HTML, with x^1 = x and x^0 = 1 */
export function varT(x: string, e: number): string { return e === 0 ? '1' : e === 1 ? x : `${x}^{${e}}`; }
export function varH(x: string, e: number): string { return e === 0 ? '1' : e === 1 ? V(x) : `${V(x)}<sup>${e}</sup>`; }
/** coefficient · body in TeX / HTML (1 is left out, −1 becomes a minus) */
export function coefT(c: number, body: string): string { if (!body || body === '1') return iT(c); return c === 1 ? body : c === -1 ? `-${body}` : `${iT(c)}${body}`; }
export function coefH(c: number, body: string): string { if (!body || body === '1') return iH(c); return c === 1 ? body : c === -1 ? `−${body}` : `${iH(c)}${body}`; }
/** a reduced fraction m/n as [m, n] with n > 0 */
export function red(m: number, n: number): [number, number] { if (n === 0) throw new Error('red: n = 0'); const g = gcd(m, n) || 1, s = n < 0 ? -1 : 1; return [(s * m) / g + 0, (s * n) / g]; }
export const sameFrac = (a: number, b: number, c: number, d: number) => b !== 0 && d !== 0 && a * d === c * b;
