// sysMaths.ts: exact maths of systems of two linear equations for "Systems of equations" (Algebra 1, lesson 8):
// an equation a x + b y = c with integer coefficients, the forms it is written in (standard, y = mx + b, x = my + k,
// x = c, y = c, any other written form), the solution set of a system (one point / none / a whole line), keys that say
// when two equations are the same line and two systems have the same solutions (distractors equivalent to the answer
// are dropped through them), the elimination step E2 + k E1, and the writing (HTML for the panel, TeX for the board).
// Pure: no DOM, no canvas. Numbers and rationals come from linear-functions-slope (lineMaths.ts, read-only).
import { type Q, q, qH, qT, nH, nT, qNum, qEq, stdH, stdT, exprH, exprT } from '../linear-functions-slope/lineMaths';
import { gcd } from '../../runtime/item';

export type { Q };
export { q, qH, qT, nH, nT, qNum, qEq, exprH, exprT };

/** a x + b y = c, integers, not a = b = 0 */
export interface Eq { a: number; b: number; c: number }
export const eq = (a: number, b: number, c: number): Eq => ({ a: a + 0, b: b + 0, c: c + 0 });
export type Sol = { k: 'one'; x: Q; y: Q } | { k: 'none' } | { k: 'inf'; L: Eq };

const lcm = (a: number, b: number) => Math.abs(a * b) / (gcd(a, b) || 1);
/** the equation scaled to gcd 1 and a positive first coefficient (the line it describes) */
export function norm(E: Eq): Eq {
  const g = gcd(gcd(E.a, E.b), E.c) || 1, s = E.a < 0 || (E.a === 0 && E.b < 0) ? -1 : 1;
  return eq(s * E.a / g, s * E.b / g, s * E.c / g);
}
/** the line an equation describes */
export const lineKey = (E: Eq): string => { const n = norm(E); return `L ${n.a} ${n.b} ${n.c}`; };
export const sameLine = (E: Eq, F: Eq): boolean => lineKey(E) === lineKey(F);
export const holds = (E: Eq, x: number, y: number): boolean => Math.abs(E.a * x + E.b * y - E.c) < 1e-9;
export const lhs = (E: Eq, x: number, y: number): number => E.a * x + E.b * y;
/** k E (every term) */
export const scale = (E: Eq, k: number): Eq => eq(k * E.a, k * E.b, k * E.c);
/** E + F, term by term */
export const add = (E: Eq, F: Eq): Eq => eq(E.a + F.a, E.b + F.b, E.c + F.c);
export const sub = (E: Eq, F: Eq): Eq => eq(E.a - F.a, E.b - F.b, E.c - F.c);

/** the solution set of a system (Cramer, exact) */
export function solve(E1: Eq, E2: Eq): Sol {
  const D = E1.a * E2.b - E2.a * E1.b;
  if (D !== 0) return { k: 'one', x: q(E1.c * E2.b - E2.c * E1.b, D), y: q(E1.a * E2.c - E2.a * E1.c, D) };
  // parallel normals: the same line when the equations are multiples (constants included), else none
  return sameLine(E1, E2) ? { k: 'inf', L: norm(E1) } : { k: 'none' };
}
/** the solution set as a key: two systems with the same key have the same solutions */
export function solKey(S: Sol): string {
  if (S.k === 'one') return `P ${S.x.p}/${S.x.q} ${S.y.p}/${S.y.q}`;
  return S.k === 'none' ? 'none' : lineKey(S.L);
}
export const sysKey = (E1: Eq, E2: Eq): string => solKey(solve(E1, E2));
/** the integer solution of a system (generators make them so), or null */
export function intSol(E1: Eq, E2: Eq): [number, number] | null {
  const S = solve(E1, E2);
  return S.k === 'one' && S.x.q === 1 && S.y.q === 1 ? [S.x.p, S.y.p] : null;
}
/** y at x on a non-vertical line */
export const yAt = (E: Eq, x: number): number => (E.c - E.a * x) / E.b;
/** slope and intercept of a non-vertical line */
export const slopeOf = (E: Eq): Q => q(-E.a, E.b);
export const interceptOf = (E: Eq): Q => q(E.c, E.b);
/** an equation through a point with integer a, b: c follows */
export const through = (a: number, b: number, x: number, y: number): Eq => eq(a, b, a * x + b * y);

// ---------- written forms ----------
/** how an equation is WRITTEN: std a x + b y = c, si y = m x + k, xs x = m y + k, vx x = c, hy y = c, raw any other
 *  (its html and tex given, its line in E) */
export type Form =
  | { f: 'std'; E: Eq }
  | { f: 'si'; m: Q; k: Q }
  | { f: 'xs'; m: Q; k: Q }
  | { f: 'raw'; h: string; t: string; E: Eq };
/** the integer equation of a form */
export function eqOf(F: Form): Eq {
  if (F.f === 'std' || F.f === 'raw') return F.E;
  // y = (p/q) x + (r/s)  ->  -(p/q) x + y = r/s, times lcm(q, s)
  const l = lcm(F.m.q, F.k.q);
  const A = -F.m.p * (l / F.m.q), B = l, C = F.k.p * (l / F.k.q);
  return F.f === 'si' ? eq(A, B, C) : eq(B, A, C);
}
const LX = '<i>x</i>', LY = '<i>y</i>';
export interface Letters { x: string; y: string; tx: string; ty: string }
export const XY: Letters = { x: LX, y: LY, tx: 'x', ty: 'y' };
export const letters = (x: string, y: string): Letters => ({ x: `<i>${x}</i>`, y: `<i>${y}</i>`, tx: x, ty: y });
export function fH(F: Form, L: Letters = XY): string {
  if (F.f === 'std') return stdH({ A: F.E.a, B: F.E.b, C: F.E.c }, L.x, L.y);
  if (F.f === 'si') return `${L.y} = ${exprH(F.m, F.k, L.x)}`;
  if (F.f === 'xs') return `${L.x} = ${exprH(F.m, F.k, L.y)}`;
  return F.h;
}
export function fT(F: Form, L: Letters = XY): string {
  if (F.f === 'std') return stdT({ A: F.E.a, B: F.E.b, C: F.E.c }, L.tx, L.ty);
  if (F.f === 'si') return `${L.ty} = ${exprT(F.m, F.k, L.tx)}`;
  if (F.f === 'xs') return `${L.tx} = ${exprT(F.m, F.k, L.ty)}`;
  return F.t;
}
/** a x + b y = c as written (a coefficient may be 0: "2x = 8", "3y = 6") */
export const std = (E: Eq): Form => ({ f: 'std', E });
export const si = (m: Q | number, k: Q | number): Form => ({ f: 'si', m: typeof m === 'number' ? q(m) : m, k: typeof k === 'number' ? q(k) : k });
export const xs = (m: Q | number, k: Q | number): Form => ({ f: 'xs', m: typeof m === 'number' ? q(m) : m, k: typeof k === 'number' ? q(k) : k });
export const eH = (E: Eq, L: Letters = XY) => fH(std(E), L);
export const eT = (E: Eq, L: Letters = XY) => fT(std(E), L);

// ---------- numbers and points ----------
/** a value as HTML: integers plain, other rationals as a stacked fraction */
export const vH = (v: Q) => qH(v);
export const vT = (v: Q) => qT(v);
export const P = (x: number, y: number) => `(${nH(x)}, ${nH(y)})`;
export const PT = (x: number, y: number) => `(${nT(x)},\\ ${nT(y)})`;
export const PQ = (x: Q, y: Q) => `(${qH(x)}, ${qH(y)})`;
/** a term c·v as written inside a sum: 3x, −x, x (sign handled by the caller) */
export function cv(c: number, v: string): string { return c === 1 ? v : c === -1 ? `−${v}` : `${nH(c)}${v}`; }
export function cvT(c: number, v: string): string { return c === 1 ? v : c === -1 ? `-${v}` : `${nT(c)}${v}`; }
/** "3(4)", "−2(−1)": a coefficient times a value in brackets, for checks written out */
export const times = (c: number, v: number) => (c === 1 ? (v < 0 ? `(${nH(v)})` : nH(v)) : `${c === -1 ? '−' : nH(c)}(${nH(v)})`);
export const timesT = (c: number, v: number) => `${c === 1 ? '' : c === -1 ? '-' : nT(c)}(${nT(v)})`;
/** the left side of E written with the numbers put in: 3(4) + 2(2) */
export function putIn(E: Eq, x: number, y: number): string {
  const parts: string[] = [];
  if (E.a !== 0) parts.push(times(E.a, x));
  if (E.b !== 0) parts.push(parts.length ? (E.b < 0 ? `− ${times(-E.b, y)}` : `+ ${times(E.b, y)}`) : times(E.b, y));
  return parts.join(' ');
}
export function putInT(E: Eq, x: number, y: number): string {
  const parts: string[] = [];
  if (E.a !== 0) parts.push(timesT(E.a, x));
  if (E.b !== 0) parts.push(parts.length ? (E.b < 0 ? `- ${timesT(-E.b, y)}` : `+ ${timesT(E.b, y)}`) : timesT(E.b, y));
  return parts.join(' ');
}
/** "3(4) + 2(2) = 16 ✓" or "… = 14, not 16 ✗" */
export function checkAt(E: Eq, x: number, y: number, L: Letters = XY): string {
  const v = lhs(E, x, y);
  return Math.abs(v - E.c) < 1e-9 ? `${putIn(E, x, y)} = ${nH(v)} ✓` : `${putIn(E, x, y)} = ${nH(v)}, not ${nH(E.c)} ✗`;
}
export const r3 = (v: number) => Math.round(v * 1000) / 1000 + 0;

/** a form checked at a point, written the way the form is written: "3(4) + 2(2) = 16 ✓", "2(3) − 1 = 5, not 4 ✗" */
export function checkF(F: Form, x: number, y: number): string {
  if (F.f === 'std' || F.f === 'raw') return checkAt(F.f === 'std' ? F.E : F.E, x, y);
  const inV = F.f === 'si' ? x : y, outV = F.f === 'si' ? y : x;
  const m = qNum(F.m), k = qNum(F.k), v = r3(m * inV + k);
  const mm = qEq(F.m, q(1)) ? '' : qEq(F.m, q(-1)) ? '−' : qH(F.m);
  const put = `${mm}(${nH(inV)})${k === 0 ? '' : k < 0 ? ` − ${qH(q(-F.k.p, F.k.q))}` : ` + ${qH(F.k)}`}`;
  return Math.abs(v - outV) < 1e-9 ? `${put} = ${nH(v)} ✓` : `${put} = ${nH(v)}, not ${nH(outV)} ✗`;
}
/** does a point satisfy a form (through its integer equation) */
export const holdsF = (F: Form, x: number, y: number) => holds(eqOf(F), x, y);
/** an exact (rational) point checked in a x + b y = c: "−2(−1/3) − 2(4/3) = −2 ✓" */
export function checkQ(E: Eq, x: Q, y: Q): string {
  const tm = (c: number, v: Q, first: boolean) => {
    if (c === 0) return '';
    const a = Math.abs(c), co = a === 1 ? '' : nH(a);
    return `${c < 0 ? (first ? '−' : ' − ') : first ? '' : ' + '}${co}(${qH(v)})`;
  };
  const t1 = tm(E.a, x, true), t2 = tm(E.b, y, t1 === '');
  const v = E.a * qNum(x) + E.b * qNum(y);
  return `${t1}${t2} = ${nH(r3(v))} ${Math.abs(v - E.c) < 1e-9 ? '✓' : '✗'}`;
}
