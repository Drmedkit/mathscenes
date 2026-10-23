// sysMaths.ts: the exact maths of a system of two linear equations, pure (no DOM, no canvas).
//   A line is  a·x + b·y = c  (Lin). Coefficients are usually integers; a slope-form line y = m·x + k is stored as
//   (−m)x + 1·y = k. solve() uses Cramer's rule: one crossing point, no point (parallel), or every point of one line
//   (the same line). clip() gives the part of a line inside a window (for drawing); texLin / htmlLin write a line in
//   standard form ('std'), solved for y ('y') or solved for x ('x'), with a real minus sign and no "1x" or "+ -3".
export type V = readonly [number, number];
export interface Win { x0: number; y0: number; x1: number; y1: number }
export interface Lin { a: number; b: number; c: number }
export type Form = 'std' | 'y' | 'x';
export type Sol = { kind: 'one'; x: number; y: number } | { kind: 'none' } | { kind: 'inf' };

const EPS = 1e-9;
export const near = (a: number, b: number) => Math.abs(a - b) < 1e-7;
const fix = (v: number) => { const r = Math.round(v * 1e9) / 1e9; return Object.is(r, -0) ? 0 : r; };

export const lin = (a: number, b: number, c: number): Lin => ({ a, b, c });
/** y = m·x + k */
export const ySlope = (m: number, k: number): Lin => ({ a: -m, b: 1, c: k });
/** the line through two points (as integers when the points are whole) */
export function through(p: V, q: V): Lin {
  let a = q[1] - p[1], b = p[0] - q[0], c = a * p[0] + b * p[1];
  if ([a, b, c].every(Number.isInteger)) { let g = Math.abs(a); for (const v of [b, c]) { let h = Math.abs(v); while (h) [g, h] = [h, g % h]; } if (g > 1) { a /= g; b /= g; c /= g; } }
  if (a < 0 || (a === 0 && b < 0)) { a = -a; b = -b; c = -c; }
  return { a: a || 0, b: b || 0, c: c || 0 };
}
export const on = (L: Lin, p: V): boolean => near(L.a * p[0] + L.b * p[1], L.c);
export const scale = (L: Lin, k: number): Lin => ({ a: fix(L.a * k), b: fix(L.b * k), c: fix(L.c * k) });
export const add = (L: Lin, M: Lin): Lin => ({ a: fix(L.a + M.a), b: fix(L.b + M.b), c: fix(L.c + M.c) });
export const sub = (L: Lin, M: Lin): Lin => ({ a: fix(L.a - M.a), b: fix(L.b - M.b), c: fix(L.c - M.c) });

export function solve(L: Lin, M: Lin): Sol {
  const det = L.a * M.b - M.a * L.b;
  if (Math.abs(det) > EPS) return { kind: 'one', x: fix((L.c * M.b - M.c * L.b) / det), y: fix((L.a * M.c - M.a * L.c) / det) };
  // parallel or the same line: the same line when one is a multiple of the other (constants too)
  const same = Math.abs(L.a * M.c - M.a * L.c) < EPS && Math.abs(L.b * M.c - M.b * L.c) < EPS;
  return same ? { kind: 'inf' } : { kind: 'none' };
}
/** slope and y-intercept (b ≠ 0) */
export const slope = (L: Lin) => fix(-L.a / L.b);
export const yInt = (L: Lin) => fix(L.c / L.b);
export const yAt = (L: Lin, x: number) => fix((L.c - L.a * x) / L.b);
export const xAt = (L: Lin, y: number) => fix((L.c - L.b * y) / L.a);

/** the part of a line inside the window, or null */
export function clip(L: Lin, w: Win): [V, V] | null {
  const P: V[] = [];
  const push = (p: V) => { if (p[0] >= w.x0 - EPS && p[0] <= w.x1 + EPS && p[1] >= w.y0 - EPS && p[1] <= w.y1 + EPS && !P.some(q => near(q[0], p[0]) && near(q[1], p[1]))) P.push(p); };
  if (Math.abs(L.b) > EPS) { push([w.x0, yAt(L, w.x0)]); push([w.x1, yAt(L, w.x1)]); }
  if (Math.abs(L.a) > EPS) { push([xAt(L, w.y0), w.y0]); push([xAt(L, w.y1), w.y1]); }
  if (P.length < 2) return null;
  P.sort((p, q) => p[0] - q[0] || p[1] - q[1]);
  return [P[0]!, P[P.length - 1]!];
}
/** whole-number points of a line inside the window */
export function lattice(L: Lin, w: Win): V[] {
  const out: V[] = [];
  for (let x = Math.ceil(w.x0); x <= w.x1; x++) for (let y = Math.ceil(w.y0); y <= w.y1; y++) if (on(L, [x, y])) out.push([x, y]);
  return out;
}
export const inWin = (p: V, w: Win, pad = 0) => p[0] >= w.x0 + pad && p[0] <= w.x1 - pad && p[1] >= w.y0 + pad && p[1] <= w.y1 - pad;

// ---------- numbers as text ----------
const gcd = (a: number, b: number): number => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
/** a rational close to v as [p, q] (q ≤ 60), or null */
export function ratOf(v: number): [number, number] | null {
  for (let q = 1; q <= 60; q++) { const p = Math.round(v * q); if (Math.abs(p / q - v) < 1e-9) { const g = gcd(p, q); return [p / g, q / g]; } }
  return null;
}
/** TeX of a number: whole, a short decimal (money / tenths), or a fraction */
export function nT(v: number, dec = false): string {
  v = fix(v);
  const r = ratOf(v);
  if (dec || !r) return v < 0 ? '-' + String(Math.round(-v * 1000) / 1000) : String(Math.round(v * 1000) / 1000);
  if (r[1] === 1) return String(r[0]);
  return `${r[0] < 0 ? '-' : ''}\\tfrac{${Math.abs(r[0])}}{${r[1]}}`;
}
/** HTML of a number (real minus sign; fractions as a stacked fraction) */
export function nH(v: number, dec = false): string {
  v = fix(v);
  const r = ratOf(v);
  if (dec || !r || r[1] === 1) { const s = String(Math.round(Math.abs(v) * 1000) / 1000); return v < 0 ? '−' + s : s; }
  return `${r[0] < 0 ? '−' : ''}<span class="fr"><span>${Math.abs(r[0])}</span><span>${r[1]}</span></span>`;
}
/** plain text of a number (for choices that must stay unique as text) */
export function nP(v: number): string { v = fix(v); const r = ratOf(v); if (!r || r[1] === 1) return (v < 0 ? '−' : '') + String(Math.round(Math.abs(v) * 1000) / 1000); return `${r[0] < 0 ? '−' : ''}${Math.abs(r[0])}/${r[1]}`; }
export const isInt = (v: number) => Math.abs(v - Math.round(v)) < 1e-9;

// ---------- a line as text ----------
interface Style { minus: string; num: (v: number) => string; x: string; y: string }
const TS: Style = { minus: '-', num: v => nT(v), x: 'x', y: 'y' };
const HS: Style = { minus: '−', num: v => nH(v), x: '<i>x</i>', y: '<i>y</i>' };
/** a term "3x", "-x", "+ 3y", "- y"; first = no leading "+" */
function term(s: Style, k: number, v: string, first: boolean): string {
  if (near(k, 0)) return '';
  const abs = Math.abs(k), mag = near(abs, 1) ? '' : s.num(abs);
  if (first) return `${k < 0 ? s.minus : ''}${mag}${v}`;
  return ` ${k < 0 ? s.minus : '+'} ${mag}${v}`;
}
function constTerm(s: Style, k: number, first: boolean): string {
  if (first) return k < 0 ? s.minus + s.num(-k) : s.num(k);
  if (near(k, 0)) return '';
  return ` ${k < 0 ? s.minus : '+'} ${s.num(Math.abs(k))}`;
}
function write(s: Style, L: Lin, form: Form): string {
  if (form === 'y' && !near(L.b, 0)) {
    const m = -L.a / L.b, k = L.c / L.b;
    const mx = term(s, m, s.x, true);
    return `${s.y} = ${mx ? mx + constTerm(s, k, false) : constTerm(s, k, true)}`;
  }
  if (form === 'x' && !near(L.a, 0)) {
    const n = -L.b / L.a, k = L.c / L.a;
    const ny = term(s, n, s.y, true);
    return `${s.x} = ${ny ? ny + constTerm(s, k, false) : constTerm(s, k, true)}`;
  }
  const lhs = near(L.a, 0) ? term(s, L.b, s.y, true) : term(s, L.a, s.x, true) + term(s, L.b, s.y, false);
  return `${lhs} = ${constTerm(s, L.c, true)}`;
}
export const texLin = (L: Lin, form: Form = 'std') => write(TS, L, form);
export const htmlLin = (L: Lin, form: Form = 'std') => write(HS, L, form);
/** an expression a·x + b (for substitution): TeX / HTML */
export function texExpr(m: number, k: number, v = 'x'): string { const t = term(TS, m, v, true); return t ? t + constTerm(TS, k, false) : constTerm(TS, k, true); }
export function htmlExpr(m: number, k: number, v = 'x'): string { const t = term(HS, m, `<i>${v}</i>`, true); return t ? t + constTerm(HS, k, false) : constTerm(HS, k, true); }
/** an ordered pair */
export const pairT = (p: V) => `(${nT(p[0])}, ${nT(p[1])})`;
export const pairH = (p: V) => `(${nH(p[0])}, ${nH(p[1])})`;
export const pairP = (p: V) => `(${nP(p[0])}, ${nP(p[1])})`;
/** "2(−3) + 5" style substitution text of a·x + b·y for a point (HTML) */
export function subH(L: Lin, p: V): string {
  const val = (k: number, v: number) => `${near(Math.abs(k), 1) ? '' : nH(Math.abs(k))}${near(Math.abs(k), 1) ? (v < 0 || (k < 0 && v === 0) ? `(${nH(v)})` : nH(v)) : `(${nH(v)})`}`;
  const parts: string[] = [];
  if (!near(L.a, 0)) parts.push(`${L.a < 0 ? '−' : ''}${val(L.a, p[0])}`);
  if (!near(L.b, 0)) parts.push(parts.length ? `${L.b < 0 ? '−' : '+'} ${val(L.b, p[1])}` : `${L.b < 0 ? '−' : ''}${val(L.b, p[1])}`);
  return parts.join(' ');
}
export const lhsOf = (L: Lin, p: V) => fix(L.a * p[0] + L.b * p[1]);
