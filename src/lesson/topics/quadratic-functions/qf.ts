// qf.ts: exact maths and text of "Quadratic functions and their graphs" (no DOM). A quadratic is kept as its standard
// coefficients [a, b, c]; vertex form (a, h, k) and factored form (A, zeros with integer factor multipliers) convert to
// it. Text: *H = HTML for the panel (real minus, linear fractions in brackets), *T = TeX for the board.
//   std / fromV / fromZ      the three forms -> [a, b, c]
//   val, vertexOf, zerosOf   f(x), the vertex (h, k), the real zeros (exact when the discriminant is a square)
//   win                      a Plane window [min, max, step] that holds a list of values with a margin
export type Std = readonly [number, number, number];
export const EPS = 1e-9;
export const near = (a: number, b: number, e = 1e-6) => Math.abs(a - b) < e;
/** a value with float noise removed (6 places) */
export const cl = (v: number) => { const r = Math.round(v * 1e6) / 1e6; return Object.is(r, -0) ? 0 : r; };

export const fromV = (a: number, h: number, k: number): Std => [a, cl(-2 * a * h), cl(a * h * h + k)];
export const fromZ = (a: number, p: number, q: number): Std => [a, cl(-a * (p + q)), cl(a * p * q)];
export const val = (s: Std, x: number) => cl(s[0] * x * x + s[1] * x + s[2]);
export const fn = (s: Std) => (x: number) => s[0] * x * x + s[1] * x + s[2];
export const vertexOf = (s: Std): [number, number] => { const h = cl(-s[1] / (2 * s[0])); return [h, val(s, h)]; };
export const sameStd = (s: Std, t: Std) => s.every((v, i) => near(v, t[i]!));
export const keyStd = (s: Std) => s.map(cl).join(',');
/** the real zeros, ascending (one value for a repeated zero) */
export function zerosOf(s: Std): number[] {
  const [a, b, c] = s, D = b * b - 4 * a * c;
  if (D < -EPS) return [];
  if (Math.abs(D) < EPS) return [cl(-b / (2 * a))];
  const r = Math.sqrt(D), x1 = cl((-b - r) / (2 * a)), x2 = cl((-b + r) / (2 * a));
  return x1 < x2 ? [x1, x2] : [x2, x1];
}

// ---------- numbers as text ----------
/** a simple fraction p/q (q <= 12) for v, or null */
export function asFrac(v: number): [number, number] | null {
  for (let q = 1; q <= 12; q++) { const p = Math.round(v * q); if (Math.abs(p / q - v) < 1e-6) return [p, q]; }
  return null;
}
/** a number in HTML: real minus, decimals as they are (2.5, −0.05), thousands commas from 10,000 */
export function nH(v: number): string {
  const r = cl(v), a = Math.abs(r);
  return (r < 0 ? '−' : '') + (a >= 10000 ? a.toLocaleString('en-US', { maximumFractionDigits: 6 }) : String(a));
}
/** a number in TeX */
export const nT = (v: number) => { const r = cl(v); return (r < 0 ? '-' : '') + String(Math.abs(r)); };
/** a number in spoken / plain words is the lesson's job; this is a signed number in brackets when negative: (−3) */
export const pH = (v: number) => (v < 0 ? `(${nH(v)})` : nH(v));
/** a coefficient in front of a body (x², (x − 3)², a factor): 1 → '', −1 → '−', 1/2 → '(1/2)', 3 → '3' */
export function coefH(a: number): string {
  if (near(a, 1)) return ''; if (near(a, -1)) return '−';
  const f = asFrac(a);
  if (f && f[1] !== 1) return `${f[0] < 0 ? '−' : ''}(${Math.abs(f[0])}/${f[1]})`;
  return nH(a);
}
export function coefT(a: number): string {
  if (near(a, 1)) return ''; if (near(a, -1)) return '-';
  const f = asFrac(a);
  if (f && f[1] !== 1) return `${f[0] < 0 ? '-' : ''}\\frac{${Math.abs(f[0])}}{${f[1]}}`;
  return nT(a);
}
/** a fraction-or-decimal value in HTML for answers and prose: 1/2 → "1/2" when not a short decimal, else 0.5 */
export function qH(v: number): string {
  const f = asFrac(v);
  if (!f || f[1] === 1) return nH(v);
  let d = f[1]; while (d % 2 === 0) d /= 2; while (d % 5 === 0) d /= 5;
  return d === 1 ? nH(v) : `${f[0] < 0 ? '−' : ''}${Math.abs(f[0])}/${f[1]}`;
}
const X = '<i>x</i>';
/** x − h in HTML (x when h = 0) */
export const binH = (h: number, v = X) => (near(h, 0) ? v : `${v} ${h > 0 ? '−' : '+'} ${nH(Math.abs(h))}`);
export const binT = (h: number, v = 'x') => (near(h, 0) ? v : `${v} ${h > 0 ? '-' : '+'} ${nT(Math.abs(h))}`);
/** + k / − k (empty when k = 0) */
const tailH = (k: number) => (near(k, 0) ? '' : ` ${k > 0 ? '+' : '−'} ${nH(Math.abs(k))}`);
const tailT = (k: number) => (near(k, 0) ? '' : ` ${k > 0 ? '+' : '-'} ${nT(Math.abs(k))}`);

/** vertex form a(x − h)² + k */
export function vfH(a: number, h: number, k: number, v = X): string {
  const body = near(h, 0) ? `${v}²` : `(${binH(h, v)})²`;
  return `${coefH(a)}${body}${tailH(k)}`;
}
export function vfT(a: number, h: number, k: number, v = 'x'): string {
  const body = near(h, 0) ? `${v}^2` : `(${binT(h, v)})^2`;
  return `${coefT(a)}${body}${tailT(k)}`;
}
/** standard form ax² + bx + c (zero terms left out) */
export function stdH(s: Std, v = X): string {
  const [a, b, c] = s;
  let o = `${coefH(a)}${v}²`;
  if (!near(b, 0)) o += ` ${b > 0 ? '+' : '−'} ${near(Math.abs(b), 1) ? '' : coefH(Math.abs(b))}${v}`;
  return o + tailH(c);
}
export function stdT(s: Std, v = 'x'): string {
  const [a, b, c] = s;
  let o = `${coefT(a)}${v}^2`;
  if (!near(b, 0)) o += ` ${b > 0 ? '+' : '-'} ${near(Math.abs(b), 1) ? '' : coefT(Math.abs(b))}${v}`;
  return o + tailT(c);
}

// ---------- factored form ----------
/** a linear factor m·x − m·r (zero r, integer multiplier m > 0): (x − 3), (2x − 3), x */
export interface Lin { m: number; r: number }
export interface Fac { A: number; f: [Lin, Lin] }
export const facStd = (F: Fac): Std => { const [u, w] = F.f; return fromZ(F.A * u.m * w.m, u.r, w.r); };
function linH(L: Lin, v: string): string {
  const n = cl(L.m * L.r), mv = L.m === 1 ? v : `${L.m}${v}`;
  return near(n, 0) ? mv : `${mv} ${n > 0 ? '−' : '+'} ${nH(Math.abs(n))}`;
}
function linT(L: Lin, v: string): string {
  const n = cl(L.m * L.r), mv = L.m === 1 ? v : `${L.m}${v}`;
  return near(n, 0) ? mv : `${mv} ${n > 0 ? '-' : '+'} ${nT(Math.abs(n))}`;
}
export function facH(F: Fac, v = X): string {
  const [u, w] = F.f, A = coefH(F.A);
  if (u.m === w.m && near(u.r, w.r)) return `${A}(${linH(u, v)})²`;
  // a bare x factor goes first: x(x − 4)
  const parts = [u, w].sort((p, q) => (near(q.r, 0) && q.m === 1 ? 1 : 0) - (near(p.r, 0) && p.m === 1 ? 1 : 0));
  return A + parts.map(L => (near(L.r, 0) && L.m === 1 ? v : `(${linH(L, v)})`)).join('');
}
export function facT(F: Fac, v = 'x'): string {
  const [u, w] = F.f, A = coefT(F.A);
  if (u.m === w.m && near(u.r, w.r)) return `${A}(${linT(u, v)})^2`;
  const parts = [u, w].sort((p, q) => (near(q.r, 0) && q.m === 1 ? 1 : 0) - (near(p.r, 0) && p.m === 1 ? 1 : 0));
  return A + parts.map(L => (near(L.r, 0) && L.m === 1 ? v : `(${linT(L, v)})`)).join('');
}
/** a monic factored form a(x − p)(x − q) */
export const fz = (a: number, p: number, q: number): Fac => ({ A: a, f: [{ m: 1, r: p }, { m: 1, r: q }] });

// ---------- windows ----------
const STEPS = [1, 2, 4, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000];
/** a window [min, max, step] that holds every value with at least half a step of room, 6..`most` grid cells;
 *  `zero` keeps 0 inside (the axes on screen) */
export function win(vals: number[], most = 14, zero = true): [number, number, number] {
  const vs = zero ? [...vals, 0] : vals, lo = Math.min(...vs), hi = Math.max(...vs);
  for (const s of STEPS) {
    let a = Math.floor((lo - 0.5 * s) / s + 1e-9) * s, b = Math.ceil((hi + 0.5 * s) / s - 1e-9) * s;
    const n = Math.round((b - a) / s);
    if (n > most) continue;
    if (n < 6) { const more = Math.ceil((6 - n) / 2); a -= more * s; b += more * s; }
    return [cl(a), cl(b), s];
  }
  throw new Error(`win: no window for ${vals.join(', ')}`);
}
/** a window that starts at 0 (time, lengths, prices: no negative part on screen) */
export function win0(vals: number[], most = 12): [number, number, number] {
  const hi = Math.max(...vals);
  for (const s of STEPS) { const b = Math.ceil((hi + 0.5 * s) / s - 1e-9) * s, n = Math.round(b / s); if (n <= most) return [0, cl(Math.max(b, 2 * s)), s]; }
  throw new Error(`win0: no window for ${vals.join(', ')}`);
}
