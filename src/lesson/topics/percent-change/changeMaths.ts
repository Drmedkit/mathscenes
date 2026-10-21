// changeMaths.ts: the exact maths of percent change, pure (no DOM, no canvas), shared by the ChangeTape model, the
// item families and the tests. Amounts are money (to the cent) or counts / measures (whole numbers or hundredths), so
// everything is computed on integers in hundredths and only formatted at the end: 79.50 with 8.25% tax is exactly
// 86.05875 and rounds to $86.06, never 86.05874999.

/** x rounded to 9 decimals: removes binary noise (0.1 + 0.2) before a comparison or a format */
export const r9 = (x: number): number => Math.round(x * 1e9) / 1e9;
/** same number up to a millionth (relative for big numbers) */
export const near = (a: number, b: number): boolean => Number.isFinite(a) && Math.abs(a - b) <= 1e-6 * Math.max(1, Math.abs(b));
/** round half up to `dp` decimals, on the exact decimal value */
export function roundTo(x: number, dp: number): number {
  const f = 10 ** dp;
  return Math.round(r9(x * f) + 1e-9) / f;
}

export type Dir = 'up' | 'down' | 'none';
export interface Change {
  /** the base: the amount before the change (100 %) */
  from: number; to: number;
  /** the size of the change, larger minus smaller (never negative) */
  size: number;
  dir: Dir;
  /** the size as a percent of the base */
  pct: number;
  /** one multiplier: to = from × mult */
  mult: number;
  /** the new amount as a percent OF the base (125 % for +25 %) */
  pctOf: number;
}
export function change(from: number, to: number): Change {
  if (!(from > 0) || !(to >= 0) || !Number.isFinite(from) || !Number.isFinite(to)) throw new Error(`percent change: the base must be positive and the new amount nonnegative (got ${from} -> ${to})`);
  const size = r9(Math.abs(to - from));
  return { from, to, size, dir: to > from ? 'up' : to < from ? 'down' : 'none', pct: r9((size / from) * 100), mult: r9(to / from), pctOf: r9((to / from) * 100) };
}
/** apply a percent change p (>= 0) up or down: from × (1 ± p/100); a decrease is at most 100 % */
export function apply(from: number, p: number, dir: 'up' | 'down'): number {
  if (dir === 'down' && p > 100) throw new Error(`a decrease of ${p}% would make the amount negative`);
  return r9(from * (1 + (dir === 'up' ? p : -p) / 100));
}
/** the multiplier of a percent change: 1 + r or 1 - r */
export const multiplier = (p: number, dir: 'up' | 'down'): number => r9(1 + (dir === 'up' ? p : -p) / 100);
/** number of decimals of x (up to 9) */
export function decimals(x: number): number {
  const s = String(r9(Math.abs(x)));
  const i = s.indexOf('.');
  return i < 0 ? 0 : s.length - i - 1;
}
/** does x have at most dp decimals (exact cents: dp = 2)? */
export const exactTo = (x: number, dp: number): boolean => decimals(x) <= dp;

// ---------- formatting (text for the panel, TeX for the board and the model) ----------
function group(intPart: string, sep: string): string { return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, sep); }
/** 12500.5 -> "12,500.5" (at most `dp` decimals, trailing zeros dropped) */
export function fmtNum(x: number, dp = 4): string {
  const v = r9(x);
  const neg = v < 0;
  const [i, f] = String(roundTo(Math.abs(v), dp)).split('.');
  return (neg ? '−' : '') + group(i!, ',') + (f ? '.' + f : '');
}
/** money: whole dollars stay whole ($40), anything else gets cents ($44.80) */
export function fmtMoney(x: number): string {
  const v = roundTo(Math.abs(x), 2), neg = x < 0;
  const s = Number.isInteger(v) ? group(String(v), ',') : (() => { const [i, f] = v.toFixed(2).split('.'); return group(i!, ',') + '.' + f; })();
  return (neg ? '−' : '') + '$' + s;
}
export const fmtPct = (p: number): string => `${fmtNum(p, 4)}%`;
/** TeX of a number: thousands as {,} */
export function texNum(x: number, dp = 4): string { return fmtNum(x, dp).replace(/,/g, '{,}').replace('−', '-'); }
export function texMoney(x: number): string { return fmtMoney(x).replace('$', '\\$').replace(/,/g, '{,}').replace('−', '-'); }
export const texPct = (p: number): string => `${texNum(p)}\\%`;

/** an amount with its unit: money, or a count / measure with a unit word ("640 people", "12 in.") */
export interface Unit { money: boolean; word?: string }
export const fmtQ = (u: Unit, x: number): string => (u.money ? fmtMoney(x) : `${fmtNum(x)}${u.word ? ' ' + u.word : ''}`);
export const texQ = (u: Unit, x: number): string => (u.money ? texMoney(x) : `${texNum(x)}${u.word ? `\\ \\text{${u.word}}` : ''}`);
