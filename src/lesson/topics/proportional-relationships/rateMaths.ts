// rateMaths.ts: the exact maths of proportional relationships, pure (no DOM, no canvas), shared by the model blocks
// (RateGraph, RateTable), the practice families and the tests.
//   Values in this topic are whole numbers or terminating decimals with at most 2 places ($7.50, 3.25 h), so every
//   value is held exactly as hundredths and every quotient as a reduced fraction (Q). No float is ever compared.
import { type Q, rat } from '../../../core/math';

/** a value in hundredths (7.5 -> 750); throws when it has more than 2 decimal places */
export function hundredths(v: number): number {
  const c = Math.round(v * 100);
  if (!Number.isFinite(v) || Math.abs(c - v * 100) > 1e-6) throw new RangeError(`rateMaths: ${v} is not a value with at most 2 decimals`);
  return c;
}
/** y / x exactly (null when x = 0: 0 ÷ 0 and n ÷ 0 have no value) */
export function quotient(x: number, y: number): Q | null {
  const cx = hundredths(x), cy = hundredths(y);
  return cx === 0 ? null : rat(cy, cx);
}
export const qSame = (a: Q | null, b: Q | null): boolean => !!a && !!b && a.p * b.q === b.p * a.q;
/** k · x exactly, as a number (k and x have at most 2 decimals, the product at most 4: rounded to hundredths) */
export function times(k: number, x: number): number { return Math.round(hundredths(k) * hundredths(x) / 100) / 100; }
/** does k · x have at most 2 decimals (so a table cell can show it exactly)? */
export const timesExact = (k: number, x: number): boolean => (hundredths(k) * hundredths(x)) % 100 === 0;
/** a Q as a terminating decimal number, or null when it does not terminate in 2 places */
export function qDecimal(q: Q): number | null {
  const v = (q.p * 100) / q.q;
  return Number.isInteger(v) ? v / 100 : null;
}
/** a value as text: 15, 7.5, 0.25 (no trailing zeros) */
export function fmt(v: number): string {
  const c = hundredths(v);
  const s = (Math.abs(c) / 100).toFixed(2).replace(/\.?0+$/, '');
  return (c < 0 ? '-' : '') + s;
}
/** a money amount: 15, 7.50 (cents shown when there are any) */
export function money(v: number): string {
  const c = hundredths(v);
  return c % 100 === 0 ? String(c / 100) : (c / 100).toFixed(2);
}
/** a quotient as text: a decimal when it terminates (2.5), otherwise a fraction (7/3) */
export function qText(q: Q): string { const d = qDecimal(q); return d !== null ? fmt(d) : `${q.p}/${q.q}`; }
/** the same, as TeX */
export function qTexDec(q: Q): string { const d = qDecimal(q); return d !== null ? fmt(d) : `\\tfrac{${q.p}}{${q.q}}`; }

export interface Row { x: number; y: number }
/** the table test: every row with a nonzero input gives the same y/x, and every zero-input row has output 0 */
export function tableTest(rows: readonly Row[]): { proportional: boolean; k: Q | null; breaks: number[]; zeroOk: boolean } {
  const qs = rows.map(r => quotient(r.x, r.y));
  const first = qs.find(q => q !== null) ?? null;
  const breaks: number[] = [];
  rows.forEach((r, i) => {
    const q = qs[i]!;
    if (q === null) { if (hundredths(r.y) !== 0) breaks.push(i); }
    else if (!qSame(q, first)) breaks.push(i);
  });
  const zeroOk = rows.every(r => hundredths(r.x) !== 0 || hundredths(r.y) === 0);
  return { proportional: breaks.length === 0 && first !== null, k: first, breaks, zeroOk };
}
/** successive output factors at equally spaced inputs (the wrong test some kids use): all equal? */
export function successiveFactorsEqual(rows: readonly Row[]): boolean {
  if (rows.length < 3) return false;
  const f = (i: number) => rat(hundredths(rows[i + 1]!.y), hundredths(rows[i]!.y));
  const f0 = f(0);
  for (let i = 1; i < rows.length - 1; i++) { const g = f(i); if (g.p !== f0.p || g.q !== f0.q) return false; }
  return true;
}

/** nice axis: a grid step from 1-2-2.5-5 x 10^n so that max/step <= maxLines, and a label stride */
export function niceAxis(maxVal: number, maxLines = 10): { max: number; step: number } {
  const steps = [0.25, 0.5, 1, 2, 2.5, 5, 10, 20, 25, 50, 100];
  for (const s of steps) {
    const n = Math.ceil((maxVal * 1.0001) / s);
    if (n <= maxLines) return { max: Math.max(1, n) * s, step: s };
  }
  return { max: Math.ceil(maxVal / 100) * 100, step: 100 };
}
