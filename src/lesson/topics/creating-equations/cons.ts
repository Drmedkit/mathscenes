// cons.ts: the exact maths of "Writing equations and inequalities from constraints". A constraint is a condition on
// named quantities: a linear relation L(v) rel R(v), a whole-number restriction, a sign bound, or a block size
// (quarter-hour blocks, packs of 6). A candidate (a value for every variable) is viable when EVERY constraint holds
// with the same values. Plus the one-variable helpers: the extreme whole number a bound allows, the allowed values of
// a restricted variable, money and number text. Pure: no DOM (items, blocks and tests import it).
import { type Rel, EPS, holds, near, nH, nT, relH, relT } from '../solving-linear-equations/sets';

export type { Rel };
export { holds, near, nH, nT, relH, relT };
export type Vals = Record<string, number>;
/** a linear form: sum of c[v] * v, plus k */
export interface Lin { c: Record<string, number>; k?: number }
export type Con =
  | { kind: 'rel'; L: Lin; rel: Rel; R: Lin }
  | { kind: 'whole'; vars: string[] }
  | { kind: 'nonneg'; vars: string[] }
  | { kind: 'step'; vars: string[]; step: number };

export const lin = (c: Record<string, number>, k = 0): Lin => ({ c, k });
export const num = (k: number): Lin => ({ c: {}, k });
/** a rel constraint: L rel R */
export const rel = (L: Lin, r: Rel, R: Lin): Con => ({ kind: 'rel', L, rel: r, R });
export const whole = (...vars: string[]): Con => ({ kind: 'whole', vars });
export const nonneg = (...vars: string[]): Con => ({ kind: 'nonneg', vars });
export const steps = (step: number, ...vars: string[]): Con => ({ kind: 'step', vars, step });

export function evalLin(L: Lin, v: Vals): number {
  let s = L.k ?? 0;
  for (const [x, c] of Object.entries(L.c)) { const val = v[x]; if (val === undefined) throw new Error(`no value for ${x}`); s += c * val; }
  return Math.round(s * 1e6) / 1e6;
}
export const isConst = (L: Lin) => Object.values(L.c).every(c => c === 0);
const isWhole = (x: number) => near(x, Math.round(x)) && x > -EPS;
export const isMultiple = (x: number, step: number) => near(x / step, Math.round(x / step));

export interface Verdict { ok: boolean; l?: number; r?: number; bad?: string }
/** does candidate v meet constraint C? (with the two sides' values for a relation, and the variable that breaks a
 *  restriction) */
export function test(C: Con, v: Vals): Verdict {
  switch (C.kind) {
    case 'rel': { const l = evalLin(C.L, v), r = evalLin(C.R, v); return { ok: holds(l, C.rel, r), l, r }; }
    case 'whole': { const bad = C.vars.find(x => !isWhole(v[x]!)); return { ok: !bad, bad }; }
    case 'nonneg': { const bad = C.vars.find(x => v[x]! < -EPS); return { ok: !bad, bad }; }
    case 'step': { const bad = C.vars.find(x => v[x]! < -EPS || !isMultiple(v[x]!, C.step)); return { ok: !bad, bad }; }
  }
}
/** viable = every constraint holds for the same values */
export const viable = (cs: readonly Con[], v: Vals) => cs.every(C => test(C, v).ok);
/** the indices of the constraints a candidate breaks */
export const broken = (cs: readonly Con[], v: Vals) => cs.map((C, i) => (test(C, v).ok ? -1 : i)).filter(i => i >= 0);

// ---------- one variable ----------
/** the least (for > / >=) or greatest (for < / <=) whole number with  x rel b; null when none (x < 0 for instance) */
export function extremeWhole(r: Rel, b: number): number | null {
  if (r === '=') return isWhole(b) ? Math.round(b) : null;
  if (r === '<=') { const n = Math.floor(b + EPS); return n >= 0 ? n : null; }
  if (r === '<') { const n = Math.ceil(b - EPS) - 1; return n >= 0 ? n : null; }
  if (r === '>=') return Math.max(0, Math.ceil(b - EPS));
  return Math.max(0, Math.floor(b + EPS) + 1);
}
/** the multiples of step in lo..hi (inclusive ends as given) */
export function stepsIn(lo: number, hi: number, step: number, loC = true, hiC = true): number[] {
  const out: number[] = [];
  for (let k = Math.ceil(lo / step - EPS); k * step <= hi + EPS; k++) {
    const x = Math.round(k * step * 1e6) / 1e6;
    if ((!loC && near(x, lo)) || (!hiC && near(x, hi))) continue;
    out.push(x);
  }
  return out;
}
/** whole numbers in [lo, hi] (inclusive), clipped at 0 */
export const wholeIn = (lo: number, hi: number) => stepsIn(Math.max(0, lo), hi, 1);

// ---------- text ----------
/** money: $12, $4.50, $0.75 */
export function money(x: number): string {
  const r = Math.round(x * 100) / 100;
  return '$' + (Number.isInteger(r) ? String(r) : r.toFixed(2));
}
/** a plain decimal (no fraction): 2.5, 0.75, 1.07 */
export function dec(x: number): string { const r = Math.round(x * 1000) / 1000; return r < 0 ? `−${-r}` : String(r); }
export function decT(x: number): string { const r = Math.round(x * 1000) / 1000; return r < 0 ? `-${-r}` : String(r); }
/** a coefficient in front of a letter (1 → '', 0.75 → 0.75) */
export const coef = (c: number) => (near(c, 1) ? '' : dec(c));
export const coefTx = (c: number) => (near(c, 1) ? '' : decT(c));
/** a linear form as HTML with italic letters: 8<i>a</i> + 5<i>s</i> + 12 */
export function linH(L: Lin): string {
  const parts: string[] = [];
  for (const [x, c] of Object.entries(L.c)) { if (c === 0) continue; const t = `${coef(Math.abs(c))}<i>${x}</i>`; parts.push(parts.length ? (c < 0 ? ` − ${t}` : ` + ${t}`) : (c < 0 ? `−${t}` : t)); }
  const k = L.k ?? 0;
  if (k !== 0 || !parts.length) parts.push(parts.length ? (k < 0 ? ` − ${dec(-k)}` : ` + ${dec(k)}`) : dec(k));
  return parts.join('');
}
export function linT(L: Lin): string {
  const parts: string[] = [];
  for (const [x, c] of Object.entries(L.c)) { if (c === 0) continue; const t = `${coefTx(Math.abs(c))}${x}`; parts.push(parts.length ? (c < 0 ? ` - ${t}` : ` + ${t}`) : (c < 0 ? `-${t}` : t)); }
  const k = L.k ?? 0;
  if (k !== 0 || !parts.length) parts.push(parts.length ? (k < 0 ? ` - ${decT(-k)}` : ` + ${decT(k)}`) : decT(k));
  return parts.join('');
}
/** a constraint as TeX / HTML */
export function conT(C: Con): string {
  switch (C.kind) {
    case 'rel': return `${linT(C.L)} ${relT(C.rel)} ${linT(C.R)}`;
    case 'whole': return `${C.vars.join(', ')}\\ \\text{whole numbers}`;
    case 'nonneg': return `${C.vars.join(', ')} \\ge 0`;
    case 'step': return `${C.vars.join(', ')}\\ \\text{in steps of } ${decT(C.step)}`;
  }
}
export function conH(C: Con): string {
  const vs = (xs: string[]) => xs.map(x => `<i>${x}</i>`).join(', ');
  switch (C.kind) {
    case 'rel': return `${linH(C.L)} ${relH(C.rel)} ${linH(C.R)}`;
    case 'whole': return `${vs(C.vars)} whole numbers`;
    case 'nonneg': return `${vs(C.vars)} ≥ 0`;
    case 'step': return `${vs(C.vars)} in steps of ${dec(C.step)}`;
  }
}
/** a candidate as TeX: (3,\,6) or n = 4 */
export function candT(v: Vals, vars: readonly string[]): string {
  return vars.length === 1 ? `${vars[0]} = ${decT(v[vars[0]!]!)}` : `(${vars.map(x => decT(v[x]!)).join(',\\,')})`;
}
export function candH(v: Vals, vars: readonly string[]): string {
  return vars.length === 1 ? `<i>${vars[0]}</i> = ${dec(v[vars[0]!]!)}` : `(${vars.map(x => dec(v[x]!)).join(', ')})`;
}
/** the cell text of a candidate in a constraint row (TeX): the left side's value, or both sides when the right side
 *  holds a variable too; '' for restrictions */
export function cellT(C: Con, v: Vals): string {
  if (C.kind !== 'rel') return '';
  const t = test(C, v);
  return isConst(C.R) ? decT(t.l!) : `${decT(t.l!)} ${relT(C.rel)} ${decT(t.r!)}`;
}
