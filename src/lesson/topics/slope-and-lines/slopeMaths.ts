// slopeMaths.ts: the exact maths of slope and lines (no DOM, no canvas). Slopes, intercepts and y/x are exact
// rationals (core/math Q), so "the same slope" is an equality, never a rounding accident. Text helpers write numbers
// for HTML (real minus sign, fractions as stacked spans) and for TeX (a TeX minus, \tfrac).
import { type Q, rat, qAdd, qDiv, qEq, qMul, qNum, toQ } from '../../../core/math';
import { fr } from '../../runtime/item';

export type P2 = readonly [number, number];
export type { Q };

/** an exact rational for a decimal or whole number (throws if it is not a friendly fraction) */
export function q(x: number): Q {
  const v = toQ(x, 1000);
  if (!v) throw new RangeError(`slopeMaths: ${x} is not a friendly rational`);
  return v;
}
export const qSub = (a: Q, b: Q): Q => qAdd(a, rat(-b.p, b.q));
export const qNeg = (a: Q): Q => rat(-a.p, a.q);
export const qZero = (a: Q) => a.p === 0;

/** the paired changes from a to b (change in x, change in y), in that order */
export function changes(a: P2, b: P2): [Q, Q] { return [qSub(q(b[0]), q(a[0])), qSub(q(b[1]), q(a[1]))]; }
/** slope from a to b: (change in y)/(change in x); null for a vertical pair (run 0, rise not 0) */
export function slopeQ(a: P2, b: P2): Q | null {
  const [dx, dy] = changes(a, b);
  if (qZero(dx)) { if (qZero(dy)) throw new RangeError('slopeMaths: the two points are the same point'); return null; }
  return qDiv(dy, dx);
}
/** the line through two points with distinct x: y = m x + b */
export function lineThrough(a: P2, c: P2): { m: Q; b: Q } {
  const m = slopeQ(a, c);
  if (!m) throw new RangeError('slopeMaths: a vertical line has no y = mx + b form');
  return { m, b: qSub(q(a[1]), qMul(m, q(a[0]))) };
}
/** y of the line y = m x + b at x */
export const yAt = (m: Q, b: Q, x: number | Q): Q => qAdd(qMul(m, typeof x === 'number' ? q(x) : x), b);
/** is (x, y) exactly on y = m x + b? */
export const onLine = (m: Q, b: Q, x: number, y: number): boolean => qEq(yAt(m, b, x), q(y));
/** x on y = m x + b where the output is y (m not 0) */
export function xAt(m: Q, b: Q, y: number | Q): Q {
  if (qZero(m)) throw new RangeError('slopeMaths: a horizontal line has no single x for an output');
  return qDiv(qSub(typeof y === 'number' ? q(y) : y, b), m);
}
/** y/x at a point (null at x = 0) */
export const ratioQ = (x: number, y: number): Q | null => (x === 0 ? null : qDiv(q(y), q(x)));
/** are all the points on one line? (exact) */
export function collinear(pts: readonly P2[]): boolean {
  if (pts.length < 3) return true;
  const [a, b] = [pts[0]!, pts[1]!];
  return pts.slice(2).every(c => qEq(qMul(qSub(q(b[0]), q(a[0])), qSub(q(c[1]), q(a[1]))), qMul(qSub(q(b[1]), q(a[1])), qSub(q(c[0]), q(a[0])))));
}
/** two right triangles with legs (run, rise) are similar exactly when rise/run is the same (AA with the right angle) */
export const legsSimilar = (run1: number, rise1: number, run2: number, rise2: number): boolean => qEq(qDiv(q(Math.abs(rise1)), q(Math.abs(run1))), qDiv(q(Math.abs(rise2)), q(Math.abs(run2))));
/** the rates of change between successive rows of a table (rows sorted by x); null where an input repeats */
export function rowRates(rows: readonly P2[]): (Q | null)[] {
  const s = [...rows].sort((u, v) => u[0] - v[0]);
  return s.slice(1).map((r, i) => (r[0] === s[i]![0] ? null : slopeQ(s[i]!, r)));
}
/** a table is linear when every row-to-row rate is the same */
export function constantRate(rows: readonly P2[]): Q | null {
  const r = rowRates(rows);
  if (r.some(v => v === null) || r.length === 0) return null;
  return r.every(v => qEq(v!, r[0]!)) ? r[0]! : null;
}
export { qEq, qNum, qAdd, qMul, qDiv, rat };

// ---------- text ----------
const r3 = (v: number) => Math.round(v * 1000) / 1000;
/** a number as plain text with a real minus sign (canvas labels, HTML) */
export const fmt = (v: number, money = false): string => {
  const a = r3(Math.abs(v)), s = money && !Number.isInteger(a) ? a.toFixed(2) : String(a);
  return (v < 0 && a !== 0 ? '−' : '') + s;
};
/** a number in TeX (a TeX minus) */
export const tnum = (v: number, money = false): string => {
  const a = r3(Math.abs(v)), s = money && !Number.isInteger(a) ? a.toFixed(2) : String(a);
  return (v < 0 && a !== 0 ? '-' : '') + s;
};
/** a rational in HTML: 3, −2, 2/3 stacked, −1/2 */
export const qHtml = (a: Q): string => (a.q === 1 ? fmt(a.p) : `${a.p < 0 ? '−' : ''}${fr(Math.abs(a.p), a.q)}`);
/** a rational as a decimal if it has one short (−1.5, 0.25), else as a fraction (HTML) */
export const qDecHtml = (a: Q): string => ([1, 2, 4, 5, 10, 20, 25, 50, 100].includes(a.q) ? fmt(qNum(a)) : qHtml(a));
/** a rational in TeX: 3, -2, \tfrac{2}{3}, -\tfrac{1}{2} */
export const qTex = (a: Q, big = false): string => (a.q === 1 ? tnum(a.p) : `${a.p < 0 ? '-' : ''}${big ? '\\frac' : '\\tfrac'}{${Math.abs(a.p)}}{${a.q}}`);
/** plain text of a rational (canvas labels): 2/3, −1/2 */
export const qText = (a: Q): string => (a.q === 1 ? fmt(a.p) : `${a.p < 0 ? '−' : ''}${Math.abs(a.p)}/${a.q}`);

/** the coefficient part of m·x in TeX/HTML: '' for 1, '-' for −1, else the number */
function coefT(m: Q): string { if (m.q === 1 && m.p === 1) return ''; if (m.q === 1 && m.p === -1) return '-'; return qTex(m); }
function coefH(m: Q): string { if (m.q === 1 && m.p === 1) return ''; if (m.q === 1 && m.p === -1) return '−'; return qHtml(m); }
/** y = m x + b in TeX, written the way a kid writes it (y = 3x, y = -x + 2, y = \tfrac{2}{3}x - 1, y = 4) */
export function eqTex(m: Q, b: Q, xv = 'x', yv = 'y'): string {
  if (qZero(m)) return `${yv} = ${qTex(b)}`;
  const mx = `${coefT(m)}${xv}`;
  if (qZero(b)) return `${yv} = ${mx}`;
  return `${yv} = ${mx} ${b.p < 0 ? '-' : '+'} ${qTex(rat(Math.abs(b.p), b.q))}`;
}
export function eqHtml(m: Q, b: Q, xv = '<i>x</i>', yv = '<i>y</i>'): string {
  if (qZero(m)) return `${yv} = ${qHtml(b)}`;
  const mx = `${coefH(m)}${xv}`;
  if (qZero(b)) return `${yv} = ${mx}`;
  return `${yv} = ${mx} ${b.p < 0 ? '−' : '+'} ${qHtml(rat(Math.abs(b.p), b.q))}`;
}
/** a point as HTML / TeX / canvas text */
export const ptHtml = (x: number, y: number) => `(${fmt(x)}, ${fmt(y)})`;
export const ptTex = (x: number, y: number) => `(${tnum(x)},\\ ${tnum(y)})`;
/** a signed change as text: +3, −2, 0 */
export const signed = (v: number | Q): string => {
  const n = typeof v === 'number' ? v : qNum(v);
  const t = typeof v === 'number' ? fmt(Math.abs(v)) : qText(rat(Math.abs(v.p), v.q));
  return n > 0 ? `+${t}` : n < 0 ? `−${t}` : '0';
};
