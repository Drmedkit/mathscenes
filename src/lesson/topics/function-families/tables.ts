// tables.ts: random tables of the four kinds (linear, quadratic, exponential, none of these) on equally spaced
// inputs, and a table as a picture (TPic) with its change columns. Every table is checked with ff.ts classify (the
// generator keeps drawing until the table is exactly of the kind asked), so no table fits two families: a constant
// table is never used as "exponential", quadratic and exponential tables have at least 4 rows. Pure: no DOM.
import type { DKind } from './DiffTable';
import type { TPic } from './common';
import { type Fam, allEq, classify, d1, d2, eq, nH, r9, rts, plusL } from './ff';
import { int, pick } from '../../runtime/item';

export interface Tab { xs: number[]; ys: number[]; fam: Fam }
const decs = (v: number) => { const s = String(r9(v)); return s.includes('.') ? s.split('.')[1]!.length : 0; };
export const GROW: readonly [number, number][] = [[3, 2], [5, 2], [2, 3], [4, 3], [1, 3], [16, 1.5], [32, 1.5], [1000, 1.1], [625, 1.2], [100, 1.5], [4, 2.5], [10, 2], [12, 2], [7, 2], [6, 2]];
export const DECAY: readonly [number, number][] = [[64, 0.5], [96, 0.5], [160, 0.5], [625, 0.8], [1000, 0.9], [256, 0.75], [1000, 0.6], [48, 0.5], [1250, 0.4], [400, 0.5]];
export const NEG: readonly [number, number][] = [[-64, 0.5], [-2, 3], [-100, 0.85], [-256, 0.75], [-5, 2], [-80, 0.5], [-1000, 0.9]];

export function xsOf(x0: number, h: number, n: number): number[] { return Array.from({ length: n }, (_, i) => r9(x0 + h * i)); }
/** a table of the given kind; `n` rows (4-6), inputs x0 + h·i */
export function makeTab(R: () => number, fam: Fam, o: { n?: number; x0?: number; h?: number; sign?: 'grow' | 'decay' | 'neg'; zero?: boolean } = {}): Tab {
  for (let tries = 0; tries < 200; tries++) {
    let n = o.n ?? 5;
    const x0 = o.x0 ?? 0, h = o.h ?? 1;
    const xs = xsOf(x0, h, n);
    let ys: number[];
    if (fam === 'linear') {
      const d = pick(R, [1, 2, 3, 4, 5, 6, 7, 8, 9, 12, -2, -3, -4, -5, -6, -8, 0.5, 1.5, 2.5, -1.5]);
      const c = o.zero ? r9(-d * int(R, 1, n - 2)) : int(R, -10, 40);
      ys = xs.map((_, i) => r9(c + d * i));
    } else if (fam === 'quadratic') {
      const A = pick(R, [1, 1, 2, 3, -1, -2, 0.5]), B = int(R, -6, 6), C = int(R, -10, 20);
      if (o.zero) {
        // a(x − p)(x − q) with a root at a listed input
        const p = xs[int(R, 1, n - 2)]!, q = p + pick(R, [-3, -2, 2, 3, 4]) * h;
        ys = xs.map(x => r9(A * (x - p) * (x - q)));
      } else ys = xs.map(x => r9(A * x * x + B * x + C));
    } else if (fam === 'exponential') {
      const list = o.sign === 'decay' ? DECAY : o.sign === 'neg' ? NEG : o.sign === 'grow' ? GROW : [...GROW, ...DECAY];
      const [a, b] = pick(R, list);
      ys = xs.map((_, i) => r9(a * b ** i));
      while (n > 4 && ys.some(v => decs(v) > 3 || Math.abs(v) > 99999)) { n--; ys = ys.slice(0, n); xs.length = n; }
      if (ys.some(v => decs(v) > 3 || Math.abs(v) > 99999)) continue;
    } else {
      const kind = int(R, 0, 2);
      if (kind === 0) { const c = int(R, -5, 10); ys = xs.map(x => r9(x * x * x + c)); }
      else if (kind === 1) { const k = pick(R, [-3, -1, 1, 2, 3, 5]); ys = xs.map((_, i) => r9(2 ** i + k)); }
      else { const c = int(R, 0, 6); ys = xs.map((_, i) => r9(i * i * i - 2 * i * i + c + 3 * i)); }
    }
    if (Math.max(...ys.map(Math.abs)) > 99999) continue;
    if (classify(xs, ys) !== fam) continue;
    return { xs, ys, fam };
  }
  throw new Error(`makeTab: no ${fam} table`);
}

/** a ratio label: ×1.5, ≈×1.57 (2 places when it does not terminate there), '÷0' (a zero denominator: no value) */
export function ratioL(r: number | null): string {
  if (r === null) return '÷0';
  const q = Math.round(r * 1e4) / 1e4, q2 = Math.round(r * 100) / 100;
  return eq(q, r) && decs(q) <= 3 ? '×' + nH(q) : '≈×' + nH(q2);
}
const labelsOf = (k: DKind, xs: readonly number[], ys: readonly number[]): string[] =>
  k === 'dx' ? d1(xs).map(plusL) : k === 'd1' ? d1(ys).map(plusL) : k === 'd2' ? d2(ys).map(plusL) : rts(ys).map(ratioL);
/** is a change column a passing test (glow), a failing one (hot), or neutral (2nd differences of a linear table) */
function verdictOf(k: DKind, xs: readonly number[], ys: readonly number[]): 'glow' | 'hot' | null {
  if (k === 'dx') return allEq(d1(xs)) ? 'glow' : 'hot';
  if (k === 'd1') return allEq(d1(ys)) ? 'glow' : 'hot';
  if (k === 'd2') { const D = d2(ys); return allEq(d1(ys)) ? null : allEq(D) && !eq(D[0]!, 0) ? 'glow' : 'hot'; }
  const R = rts(ys);
  return allEq(R) && R[0]! > 0 && !eq(R[0]!, 1) ? 'glow' : 'hot';
}
export interface TabOpts { xName?: string; yName?: string; show?: DKind[]; solve?: DKind[]; hide?: number[] }
/** a table picture: `show` columns with the question, `solve` columns on the replay (with hot / glow) */
export function tpic(xs: readonly number[], ys: readonly number[], o: TabOpts = {}): TPic {
  const hide = o.hide ?? [];
  const t: TPic = {
    xName: o.xName ?? 'x', xs: xs.map(v => nH(v)),
    cols: [{ name: o.yName ?? 'y', vals: ys.map((v, i) => (hide.includes(i) ? null : nH(v))), ...(hide.length ? { reveal: ys.map((v, i) => (hide.includes(i) ? nH(v) : null)) } : {}) }],
  };
  for (const k of o.show ?? []) if (k !== 'd2' || ys.length >= 3) t[k] = labelsOf(k, xs, ys);
  const S: NonNullable<TPic['solve']> = {};
  for (const k of o.solve ?? []) if (!(o.show ?? []).includes(k) && (k !== 'd2' || ys.length >= 3)) S[k] = labelsOf(k, xs, ys);
  const all = [...(o.show ?? []), ...(o.solve ?? [])];
  const hot = all.filter(k => verdictOf(k, xs, ys) === 'hot'), glow = all.filter(k => verdictOf(k, xs, ys) === 'glow');
  if (Object.keys(S).length || hot.length || glow.length) t.solve = { ...S, hot, glow };
  return t;
}
/** board lines of a list, at most 3 values a line (split with \qquad) */
export const listLines = (name: string, vs: readonly number[]) => Array.from({ length: Math.ceil(vs.length / 3) }, (_, i) => (i ? '' : `${name}:\\ `) + listT(vs.slice(i * 3, i * 3 + 3))).join('\\qquad ');
/** the board TeX of a table's outputs: y: 3,\ 6,\ 12 */
export const listT = (vs: readonly number[]) => vs.map(v => (v < 0 ? `{-${nH(-v).replace(/,/g, '{,}')}}` : nH(v).replace(/,/g, '{,}'))).join(',\\ ');
