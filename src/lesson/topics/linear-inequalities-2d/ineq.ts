// ineq.ts: exact maths of linear inequalities in two variables for "Graphing inequalities in two variables"
// (Algebra 1, lesson 7): the written forms (y op mx + b, Ax + By op C, x op c, y op c, point-slope), what each means
// as a relation A x + B y op C, membership with the equality case, the boundary line, the solution side, and how
// each is written (HTML for the panel, TeX for the board). Pure: no DOM, no canvas.
// Lines and numbers are written with the read-only helpers of linear-functions-slope (lineMaths.ts).
import { type Q, q, qNum, qNeg, qH, qT, nH, nT, exprH, exprT, psH, psT, stdH, stdT } from '../linear-functions-slope/lineMaths';

export type { Q };
export { q, qNum, qNeg, qH, qT, nH, nT, exprH, exprT };
export type Op = '<' | '<=' | '>' | '>=';
export const OPS: readonly Op[] = ['<', '<=', '>', '>='];
/** HTML of an operator (&lt; and &gt;, so a prompt never holds a raw angle bracket) */
export const opH = (o: Op): string => ({ '<': '&lt;', '<=': '≤', '>': '&gt;', '>=': '≥' })[o];
export const opT = (o: Op): string => ({ '<': '<', '<=': '\\le', '>': '>', '>=': '\\ge' })[o];
/** the operator in words: "is less than", "is at most" */
export const opW = (o: Op): string => ({ '<': 'less than', '<=': 'less than or equal to', '>': 'greater than', '>=': 'greater than or equal to' })[o];
export const strict = (o: Op): boolean => o === '<' || o === '>';
export const greater = (o: Op): boolean => o === '>' || o === '>=';
/** the same direction, the other strictness: < ↔ ≤ */
export const toggleIncl = (o: Op): Op => ({ '<': '<=', '<=': '<', '>': '>=', '>=': '>' } as const)[o];
/** the reversed direction, same strictness: < ↔ > */
export const flip = (o: Op): Op => ({ '<': '>', '<=': '>=', '>': '<', '>=': '<=' } as const)[o];
const EPS = 1e-9;
export function cmp(l: number, o: Op, r: number): boolean {
  const d = l - r;
  if (o === '<') return d < -EPS;
  if (o === '<=') return d <= EPS;
  if (o === '>') return d > EPS;
  return d >= -EPS;
}

/** an inequality as it is written */
export type Form =
  | { f: 'si'; m: Q; b: Q; op: Op }                      // y op mx + b
  | { f: 'std'; A: number; B: number; C: number; op: Op } // Ax + By op C
  | { f: 'x'; c: number; op: Op }                        // x op c
  | { f: 'y'; c: number; op: Op }                        // y op c
  | { f: 'ps'; m: Q; x1: number; y1: number; op: Op };   // y − y1 op m(x − x1)
/** the relation A x + B y op C the form means (numbers; A and B not both 0) */
export interface Rel { A: number; B: number; C: number; op: Op }
export function rel(F: Form): Rel {
  switch (F.f) {
    case 'si': return { A: -qNum(F.m), B: 1, C: qNum(F.b), op: F.op };
    case 'std': return { A: F.A, B: F.B, C: F.C, op: F.op };
    case 'x': return { A: 1, B: 0, C: F.c, op: F.op };
    case 'y': return { A: 0, B: 1, C: F.c, op: F.op };
    case 'ps': return { A: -qNum(F.m), B: 1, C: F.y1 - qNum(F.m) * F.x1, op: F.op };
  }
}
export const lhs = (r: Rel, x: number, y: number) => r.A * x + r.B * y;
export const holds = (F: Form | Rel, x: number, y: number): boolean => { const r = 'f' in F ? rel(F) : F; return cmp(lhs(r, x, y), r.op, r.C); };
export const onLine = (F: Form | Rel, x: number, y: number): boolean => { const r = 'f' in F ? rel(F) : F; return Math.abs(lhs(r, x, y) - r.C) < 1e-7; };
/** the solution side of the boundary: above / below (B ≠ 0), right / left (B = 0) */
export type Side = 'above' | 'below' | 'right' | 'left';
export function side(F: Form | Rel): Side {
  const r = 'f' in F ? rel(F) : F, g = greater(r.op);
  if (Math.abs(r.B) > EPS) return (r.B > 0) === g ? 'above' : 'below';
  return (r.A > 0) === g ? 'right' : 'left';
}
export const otherSide = (s: Side): Side => ({ above: 'below', below: 'above', right: 'left', left: 'right' } as const)[s];
/** the boundary as a y-function (B ≠ 0) */
export const yOn = (r: Rel, x: number) => (r.C - r.A * x) / r.B;

/** a half-plane as drawn: the points where s(Ax + By − C) ≥ 0 (strictness is the boundary's job) */
export interface Half { A: number; B: number; C: number; s: 1 | -1 }
export const halfOf = (F: Form | Rel): Half => { const r = 'f' in F ? rel(F) : F; return { A: r.A, B: r.B, C: r.C, s: greater(r.op) ? 1 : -1 }; };

// ---------- writing ----------
const Xh = '<i>x</i>', Yh = '<i>y</i>';
/** the inequality in its own form, HTML */
export function fH(F: Form): string {
  switch (F.f) {
    case 'si': return `${Yh} ${opH(F.op)} ${exprH(F.m, F.b)}`;
    case 'std': return stdH({ A: F.A, B: F.B, C: F.C }).replace(' = ', ` ${opH(F.op)} `);
    case 'x': return `${Xh} ${opH(F.op)} ${nH(F.c)}`;
    case 'y': return `${Yh} ${opH(F.op)} ${nH(F.c)}`;
    case 'ps': return psH(F.m, q(F.x1 * 1000, 1000), q(F.y1 * 1000, 1000)).replace(' = ', ` ${opH(F.op)} `);
  }
}
export function fT(F: Form): string {
  switch (F.f) {
    case 'si': return `y ${opT(F.op)} ${exprT(F.m, F.b)}`;
    case 'std': return stdT({ A: F.A, B: F.B, C: F.C }).replace(' = ', ` ${opT(F.op)} `);
    case 'x': return `x ${opT(F.op)} ${nT(F.c)}`;
    case 'y': return `y ${opT(F.op)} ${nT(F.c)}`;
    case 'ps': return psT(F.m, q(F.x1 * 1000, 1000), q(F.y1 * 1000, 1000)).replace(' = ', ` ${opT(F.op)} `);
  }
}
/** the related equation (the boundary), HTML / TeX */
export function eqH(F: Form): string {
  switch (F.f) {
    case 'si': return `${Yh} = ${exprH(F.m, F.b)}`;
    case 'std': return stdH({ A: F.A, B: F.B, C: F.C });
    case 'x': return `${Xh} = ${nH(F.c)}`;
    case 'y': return `${Yh} = ${nH(F.c)}`;
    case 'ps': return psH(F.m, q(F.x1 * 1000, 1000), q(F.y1 * 1000, 1000));
  }
}
export function eqT(F: Form): string {
  switch (F.f) {
    case 'si': return `y = ${exprT(F.m, F.b)}`;
    case 'std': return stdT({ A: F.A, B: F.B, C: F.C });
    case 'x': return `x = ${nT(F.c)}`;
    case 'y': return `y = ${nT(F.c)}`;
    case 'ps': return psT(F.m, q(F.x1 * 1000, 1000), q(F.y1 * 1000, 1000));
  }
}
/** the same form with another operator */
export const withOp = (F: Form, op: Op): Form => ({ ...F, op } as Form);
/** a point (x, y), HTML with real minus signs */
export const P = (x: number, y: number) => `(${nH(x)}, ${nH(y)})`;
export const PT = (x: number, y: number) => `(${nT(x)},\\ ${nT(y)})`;
/** "(−2)" for a negative number inside a product or sum */
export const par = (v: number) => (v < 0 ? `(${nH(v)})` : nH(v));
export const parT = (v: number) => (v < 0 ? `(${nT(v)})` : nT(v));
/** the left side A x + B y of a std form with the numbers put in, HTML: "3(−2) − 2(4)" */
export function subStd(A: number, B: number, x: number, y: number): string {
  const t = (c: number, v: number, first: boolean) => {
    const a = Math.abs(c), body = a === 1 ? (v <= 0 ? `(${nH(v)})` : nH(v)) : `${a}(${nH(v)})`;
    if (c === 0) return '';
    return first ? (c < 0 ? '−' : '') + body : (c < 0 ? ' − ' : ' + ') + body;
  };
  const a = t(A, x, true), b = t(B, y, a === '');
  return a + b;
}
/** the right side m x + b of a slope-intercept form with x put in, HTML: "2(−3) + 1" */
export function subSI(m: Q, b: Q, x: number): string {
  const mm = qNum(m);
  const head = mm === 0 ? '' : mm === 1 ? par(x) : mm === -1 ? `−(${nH(x)})` : `${qH(m)}(${nH(x)})`;
  if (!head) return qH(b);
  return b.p === 0 ? head : b.p < 0 ? `${head} − ${qH(qNeg(b))}` : `${head} + ${qH(b)}`;
}
export const r3 = (v: number) => Math.round(v * 1000) / 1000;
