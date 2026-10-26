// sets.ts: exact solution sets of one-variable linear equations and inequalities (Algebra 1, A-REI.B.3).
// A set is a sorted list of disjoint intervals on the number line (empty = [], all reals = one interval with infinite
// ends). Linear sides a·x + b with small rational a, b; solving reduces to (a1 − a2)·x  rel  (b2 − b1), and a zero
// coefficient leaves a constant statement (true: all reals, false: no solution). Every number the lesson shows is a
// fraction with a small denominator, so values are JS numbers compared with a tolerance and printed as fractions.
// Pure: no DOM, no canvas (generators, tests and the SetLine block import it).
import { toQ } from '../../../core/math';

export type Rel = '<' | '<=' | '>' | '>=' | '=';
export interface Iv { lo: number; hi: number; loC: boolean; hiC: boolean }
export type SSet = Iv[];
export const EMPTY: SSet = [];
export const ALL: SSet = [{ lo: -Infinity, hi: Infinity, loC: false, hiC: false }];
export const EPS = 1e-9;
export const near = (a: number, b: number) => Math.abs(a - b) < EPS;

// ---------- numbers as text ----------
const q = (v: number) => toQ(v, 24);
/** TeX of a number: −3, \tfrac{7}{3}, −\tfrac{1}{2}, 2.5 when no small fraction fits */
export function nT(v: number, dec = false): string {
  if (near(v, Math.round(v))) { const r = Math.round(v); return r < 0 ? `-${-r}` : String(r); }
  const Q = q(v);
  if (!Q || dec) { const r = Math.round(v * 1000) / 1000; return r < 0 ? `-${-r}` : String(r); }
  return `${Q.p < 0 ? '-' : ''}\\tfrac{${Math.abs(Q.p)}}{${Q.q}}`;
}
/** HTML of a number (real minus sign, fractions as stacked spans) */
export function nH(v: number, dec = false): string {
  if (near(v, Math.round(v))) { const r = Math.round(v); return r < 0 ? `−${-r}` : String(r); }
  const Q = q(v);
  if (!Q || dec) { const r = Math.round(v * 1000) / 1000; return r < 0 ? `−${-r}` : String(r); }
  return `${Q.p < 0 ? '−' : ''}<span class="fr"><span>${Math.abs(Q.p)}</span><span>${Q.q}</span></span>`;
}
/** words for the voice / plain text: 7/3, −1/2 */
export function nP(v: number): string {
  if (near(v, Math.round(v))) { const r = Math.round(v); return r < 0 ? `−${-r}` : String(r); }
  const Q = q(v);
  if (!Q) return String(Math.round(v * 1000) / 1000);
  return `${Q.p < 0 ? '−' : ''}${Math.abs(Q.p)}/${Q.q}`;
}
/** a decimal is exact for a terminating fraction (denominator 2^a 5^b) */
export function terminates(v: number): boolean {
  const Q = q(v); if (!Q) return false;
  let d = Q.q; while (d % 2 === 0) d /= 2; while (d % 5 === 0) d /= 5;
  return d === 1;
}

// ---------- relations ----------
export const flip = (r: Rel): Rel => (r === '<' ? '>' : r === '>' ? '<' : r === '<=' ? '>=' : r === '>=' ? '<=' : '=');
/** the relation with the sides swapped (a < b  <=>  b > a): the same as flip, named for its use */
export const mirror = flip;
export const relT = (r: Rel) => ({ '<': '<', '<=': '\\le', '>': '>', '>=': '\\ge', '=': '=' }[r]);
export const relH = (r: Rel) => ({ '<': '&lt;', '<=': '≤', '>': '&gt;', '>=': '≥', '=': '=' }[r]);
export const relP = (r: Rel) => ({ '<': '<', '<=': '≤', '>': '>', '>=': '≥', '=': '=' }[r]);
export const strictOf = (r: Rel) => r === '<' || r === '>';
/** the same direction, with or without the boundary */
export const otherStrict = (r: Rel): Rel => (r === '<' ? '<=' : r === '<=' ? '<' : r === '>' ? '>=' : r === '>=' ? '>' : '=');
export function holds(a: number, r: Rel, b: number): boolean {
  switch (r) {
    case '<': return a < b - EPS;
    case '<=': return a < b + EPS;
    case '>': return a > b + EPS;
    case '>=': return a > b - EPS;
    case '=': return near(a, b);
  }
}

// ---------- sets ----------
/** the set of x with  x rel v */
export function ray(rel: Rel, v: number): SSet {
  switch (rel) {
    case '<': return [{ lo: -Infinity, hi: v, loC: false, hiC: false }];
    case '<=': return [{ lo: -Infinity, hi: v, loC: false, hiC: true }];
    case '>': return [{ lo: v, hi: Infinity, loC: false, hiC: false }];
    case '>=': return [{ lo: v, hi: Infinity, loC: true, hiC: false }];
    case '=': return [{ lo: v, hi: v, loC: true, hiC: true }];
  }
}
export const point = (v: number): SSet => ray('=', v);
export function member(S: SSet, x: number): boolean {
  return S.some(I => (I.lo === -Infinity || (I.loC ? x > I.lo - EPS : x > I.lo + EPS)) && (I.hi === Infinity || (I.hiC ? x < I.hi + EPS : x < I.hi - EPS)));
}
function normalize(S: Iv[]): SSet {
  const xs = S.filter(I => I.lo < I.hi - EPS || (near(I.lo, I.hi) && I.loC && I.hiC)).map(I => ({ ...I }));
  xs.sort((a, b) => a.lo - b.lo || (a.loC === b.loC ? 0 : a.loC ? -1 : 1));
  const out: Iv[] = [];
  for (const I of xs) {
    const L = out[out.length - 1];
    if (L && (I.lo < L.hi - EPS || (near(I.lo, L.hi) && (I.loC || L.hiC)))) {
      if (I.hi > L.hi + EPS) { L.hi = I.hi; L.hiC = I.hiC; } else if (near(I.hi, L.hi)) L.hiC = L.hiC || I.hiC;
    } else out.push(I);
  }
  return out;
}
export function union(A: SSet, B: SSet): SSet { return normalize([...A, ...B]); }
export function inter(A: SSet, B: SSet): SSet {
  const out: Iv[] = [];
  for (const I of A) for (const J of B) {
    let lo = I.lo, loC = I.loC, hi = I.hi, hiC = I.hiC;
    if (J.lo > lo + EPS) { lo = J.lo; loC = J.loC; } else if (near(J.lo, lo)) loC = loC && J.loC;
    if (J.hi < hi - EPS) { hi = J.hi; hiC = J.hiC; } else if (near(J.hi, hi)) hiC = hiC && J.hiC;
    out.push({ lo, hi, loC, hiC });
  }
  return normalize(out);
}
export function sameSet(A: SSet, B: SSet): boolean {
  if (A.length !== B.length) return false;
  return A.every((I, i) => { const J = B[i]!; return (I.lo === J.lo || near(I.lo, J.lo)) && (I.hi === J.hi || near(I.hi, J.hi)) && (I.lo === -Infinity || I.loC === J.loC) && (I.hi === Infinity || I.hiC === J.hiC); });
}
export const isAll = (S: SSet) => S.length === 1 && S[0]!.lo === -Infinity && S[0]!.hi === Infinity;
/** every finite endpoint of a set (for axes and tests) */
export const ends = (S: SSet): number[] => S.flatMap(I => [I.lo, I.hi]).filter(v => Number.isFinite(v));

/** the set written as TeX: x < 3, -2 < x \le 3, x < -2 \text{ or } x \ge 3, x = 4, \text{all real numbers}, \varnothing */
export function setT(S: SSet, v = 'x'): string {
  if (!S.length) return '\\text{no solution}';
  if (isAll(S)) return '\\text{all real numbers}';
  return S.map(I => ivText(I, v, nT, relT, ' \\text{ or } ')).join(' \\text{ or } ');
}
export function setH(S: SSet, v = '<i>x</i>'): string {
  if (!S.length) return 'no solution';
  if (isAll(S)) return 'all real numbers';
  return S.map(I => ivText(I, v, nH, relH, ' or ')).join(' or ');
}
export function setP(S: SSet, v = 'x'): string {
  if (!S.length) return 'no solution';
  if (isAll(S)) return 'all real numbers';
  return S.map(I => ivText(I, v, nP, relP, ' or ')).join(' or ');
}
function ivText(I: Iv, v: string, n: (x: number) => string, r: (x: Rel) => string, _or: string): string {
  if (near(I.lo, I.hi)) return `${v} = ${n(I.lo)}`;
  if (I.lo === -Infinity) return `${v} ${r(I.hiC ? '<=' : '<')} ${n(I.hi)}`;
  if (I.hi === Infinity) return `${v} ${r(I.loC ? '>=' : '>')} ${n(I.lo)}`;
  return `${n(I.lo)} ${r(I.loC ? '<=' : '<')} ${v} ${r(I.hiC ? '<=' : '<')} ${n(I.hi)}`;
}

// ---------- linear sides ----------
/** a·x + b */
export interface Lin { a: number; b: number }
export const L = (a: number, b: number): Lin => ({ a, b });
export const at = (s: Lin, x: number) => s.a * x + s.b;
/** the solution set of  left rel right */
export function solve(left: Lin, rel: Rel, right: Lin): SSet {
  const a = left.a - right.a, c = right.b - left.b;
  if (near(a, 0)) return holds(0, rel, c) ? ALL : EMPTY;
  const v = c / a;
  return ray(a > 0 ? rel : flip(rel), v);
}
/** the three-part  lo rl  m·x + b  rh hi  (rl, rh are '<' or '<=') */
export function solveChain(lo: number, rl: Rel, mid: Lin, rh: Rel, hi: number): SSet {
  return inter(solve(L(0, lo), rl, mid), solve(mid, rh, L(0, hi)));
}

/** TeX of a·x + b (v the variable): 3x - 7, -x + 4, \tfrac{1}{2}x, 5 */
export function linT(s: Lin, v = 'x', dec = false): string {
  const parts: string[] = [];
  if (!near(s.a, 0)) parts.push(coefT(s.a, dec) + v);
  if (!near(s.b, 0) || !parts.length) parts.push(parts.length ? (s.b < 0 ? `- ${nT(-s.b, dec)}` : `+ ${nT(s.b, dec)}`) : nT(s.b, dec));
  return parts.join(' ');
}
export function linH(s: Lin, v = '<i>x</i>', dec = false): string {
  const parts: string[] = [];
  if (!near(s.a, 0)) parts.push(coefH(s.a, dec) + v);
  if (!near(s.b, 0) || !parts.length) parts.push(parts.length ? (s.b < 0 ? `− ${nH(-s.b, dec)}` : `+ ${nH(s.b, dec)}`) : nH(s.b, dec));
  return parts.join(' ');
}
export function linP(s: Lin, v = 'x'): string { return linH(s, v).replace(/<span class="fr"><span>([^<]*)<\/span><span>([^<]*)<\/span><\/span>/g, '$1/$2'); }
export function coefT(a: number, dec = false): string { return near(a, 1) ? '' : near(a, -1) ? '-' : nT(a, dec); }
export function coefH(a: number, dec = false): string { return near(a, 1) ? '' : near(a, -1) ? '−' : nH(a, dec); }
/** + 4 / - 4 as a trailing TeX term (nothing for 0) */
export const sgT = (v: number, dec = false) => (near(v, 0) ? '' : v < 0 ? ` - ${nT(-v, dec)}` : ` + ${nT(v, dec)}`);
export const sgH = (v: number, dec = false) => (near(v, 0) ? '' : v < 0 ? ` − ${nH(-v, dec)}` : ` + ${nH(v, dec)}`);
