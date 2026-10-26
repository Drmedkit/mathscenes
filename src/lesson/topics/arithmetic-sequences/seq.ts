// seq.ts: the exact maths of arithmetic sequences (no DOM). Values are integers or multiples of 1/4 (exact in binary
// floating point), so plain numbers stay exact; r6 only cleans the display.
//   term(a1, d, n, n0)       the value at index n of the sequence that starts with a1 at index n0
//   diffs / arith            consecutive differences, and whether they are all equal
//   position(...)            where a value sits: a term (its n), not a whole n, before the start, past the end,
//                            every index (d = 0, v = a1) or none (d = 0, v != a1)
//   formatters               the explicit form a1 + d(n - 1), the expanded form pn + q, the recursive definition,
//                            each as TeX (the board) and HTML (the panel), with real minus signs in HTML
export const r6 = (v: number): number => { const r = Math.round(v * 1e6) / 1e6; return Object.is(r, -0) ? 0 : r; };
export const term = (a1: number, d: number, n: number, n0 = 1): number => r6(a1 + d * (n - n0));
export const terms = (a1: number, d: number, count: number, n0 = 1): number[] => Array.from({ length: count }, (_, i) => term(a1, d, n0 + i, n0));
export const diffs = (vs: readonly number[]): number[] => vs.slice(1).map((v, i) => r6(v - vs[i]!));
export const arith = (vs: readonly number[]): boolean => { const D = diffs(vs); return D.every(x => x === D[0]); };

export type Pos =
  | { kind: 'term'; n: number }
  | { kind: 'notWhole'; n: number }
  | { kind: 'before'; n: number }
  | { kind: 'after'; n: number }
  | { kind: 'every' }
  | { kind: 'none' };
/** where v sits in a1, a1 + d, ... (first index n0, optional last index) */
export function position(a1: number, d: number, v: number, n0 = 1, last?: number): Pos {
  if (d === 0) return r6(v) === r6(a1) ? { kind: 'every' } : { kind: 'none' };
  const n = r6(n0 + (v - a1) / d);
  if (!Number.isInteger(n)) return { kind: 'notWhole', n };
  if (n < n0) return { kind: 'before', n };
  if (last !== undefined && n > last) return { kind: 'after', n };
  return { kind: 'term', n };
}

// ---------- numbers ----------
/** HTML number with a real minus sign */
export const nH = (v: number): string => { const r = r6(v); return (r < 0 ? '−' : '') + String(Math.abs(r)); };
/** TeX number */
export const nT = (v: number): string => (r6(v) < 0 ? `{${r6(v)}}` : String(r6(v)));
/** money: $12.50, −$3 */
export const usd = (v: number): string => { const r = r6(v); const a = Math.abs(r); return (r < 0 ? '−' : '') + '$' + (Number.isInteger(a) ? String(a) : a.toFixed(2)); };
/** "+3", "−4", "+0" (a jump label) */
export const jumpH = (d: number): string => (r6(d) < 0 ? '−' : '+') + String(Math.abs(r6(d)));
/** a signed tail " + 3" / " − 3" (HTML), " + 3" / " - 3" (TeX); empty for 0 when skip0 */
export const sgH = (v: number, skip0 = true): string => (skip0 && r6(v) === 0 ? '' : r6(v) < 0 ? ` − ${Math.abs(r6(v))}` : ` + ${r6(v)}`);
export const sgT = (v: number, skip0 = true): string => (skip0 && r6(v) === 0 ? '' : r6(v) < 0 ? ` - ${Math.abs(r6(v))}` : ` + ${r6(v)}`);

// ---------- forms (name = the sequence letter, e.g. a, f; fn = function notation f(n) instead of a_n) ----------
export interface Nm { s: string; fn?: boolean }
export const A: Nm = { s: 'a' };
const iT = (N: Nm, i: string) => (N.fn ? `${N.s}(${i})` : `${N.s}_{${i}}`);
const iH = (N: Nm, i: string) => (N.fn ? `${N.s}(${i})` : `${N.s}<sub>${i.replace(/<[^>]+>/g, '')}</sub>`);
export const atT = (N: Nm, i: string | number) => iT(N, typeof i === 'number' ? nT(i) : i);
export const atH = (N: Nm, i: string | number) => iH(N, typeof i === 'number' ? nH(i) : i.replace(/-/g, '−'));
const nI = '<i>n</i>';
/** d(n - 1) as a term after a1: " + 3(n - 1)", " - 4(n - 1)", " + (n - 1)", "" for d = 0 when skip0 */
function tailT(d: number, k: number, skip0: boolean): string {
  const r = r6(d), a = Math.abs(r), inner = k === 0 ? 'n' : `(n ${k > 0 ? '-' : '+'} ${Math.abs(k)})`;
  if (r === 0) return skip0 ? '' : ` + 0${inner}`;
  return `${r < 0 ? ' - ' : ' + '}${a === 1 ? '' : nT(a)}${inner}`;
}
function tailH(d: number, k: number, skip0: boolean): string {
  const r = r6(d), a = Math.abs(r), inner = k === 0 ? nI : `(${nI} ${k > 0 ? '−' : '+'} ${Math.abs(k)})`;
  if (r === 0) return skip0 ? '' : ` + 0${inner}`;
  return `${r < 0 ? ' − ' : ' + '}${a === 1 ? '' : nH(a)}${inner}`;
}
/** the explicit right side a1 + d(n - n0): "14 + 3(n - 1)" (n0 = 0: "6 + 4n") */
export const expRT = (a1: number, d: number, n0 = 1, skip0 = false) => `${nT(a1)}${tailT(d, n0, skip0)}`;
export const expRH = (a1: number, d: number, n0 = 1, skip0 = false) => `${nH(a1)}${tailH(d, n0, skip0)}`;
/** pn + q: "3n + 11", "-n + 4", "0.5n", "7" */
export function linT(p: number, q: number): string {
  const P = r6(p), Q = r6(q);
  if (P === 0) return nT(Q);
  const lead = P === 1 ? 'n' : P === -1 ? '-n' : `${nT(P)}n`;
  return lead + sgT(Q);
}
export function linH(p: number, q: number): string {
  const P = r6(p), Q = r6(q);
  if (P === 0) return nH(Q);
  const lead = P === 1 ? nI : P === -1 ? `−${nI}` : `${nH(P)}${nI}`;
  return lead + sgH(Q);
}
/** a range "n \ge 1", "1 \le n \le 8" */
export const rangeT = (lo: number, hi?: number, v = 'n') => (hi === undefined ? `${v} \\ge ${nT(lo)}` : `${nT(lo)} \\le ${v} \\le ${nT(hi)}`);
export const rangeH = (lo: number, hi?: number, v = nI) => (hi === undefined ? `${v} ≥ ${nH(lo)}` : `${nH(lo)} ≤ ${v} ≤ ${nH(hi)}`);
/** the update a_n = a_{n-1} + d (back = true) or a_{n+1} = a_n + d */
export function stepT(N: Nm, d: number, back = true): string {
  const L = back ? iT(N, 'n') : iT(N, 'n+1'), R = back ? iT(N, 'n-1') : iT(N, 'n');
  return `${L} = ${R}${sgT(d, false)}`;
}
export function stepH(N: Nm, d: number, back = true): string {
  const L = back ? iH(N, nI) : iH(N, `${nI}+1`), R = back ? iH(N, `${nI}−1`) : iH(N, nI);
  return `${L} = ${R}${sgH(d, false)}`;
}
/** a complete recursive definition: seed, update, its range (TeX, one line) */
export interface RecDef { N: Nm; n0: number; seed: number; d: number; back: boolean; lo: number; hi?: number; noSeed?: boolean; noRange?: boolean }
export function recT(r: RecDef): string {
  const seed = r.noSeed ? '' : `${iT(r.N, nT(r.n0))} = ${nT(r.seed)},\\ `;
  return `${seed}${stepT(r.N, r.d, r.back)}${r.noRange ? '' : `\\ \\text{for } ${rangeT(r.lo, r.hi)}`}`;
}
export function recH(r: RecDef): string {
  const seed = r.noSeed ? '' : `${iH(r.N, nH(r.n0))} = ${nH(r.seed)}, `;
  return `${seed}${stepH(r.N, r.d, r.back)}${r.noRange ? '' : ` for ${rangeH(r.lo, r.hi)}`}`;
}
/** the terms a recursive definition lists (the update read literally; null when it never moves past the seed) */
export function listRec(r: RecDef, count: number): number[] {
  const out = [r.seed];
  for (let i = 1; i < count; i++) out.push(r6(out[i - 1]! + r.d));
  return out;
}
