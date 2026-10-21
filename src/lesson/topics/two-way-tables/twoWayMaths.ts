// twoWayMaths.ts: the exact maths of two-way tables, and the seeded, realistic data the lesson and practice use.
//   totals            row totals, column totals and the grand total of a count table
//   pct(part, whole)  100 * part / whole, exact (no rounding); fmt() rounds only for display
//   cond / joint      the row-conditional, column-conditional and joint relative-frequency tables
//   contexts          survey situations with the words every sentence needs ("of the students with a curfew",
//                     "have a curfew"), so prompts, labels and choices are generated from one source
//   genCounts         a count table with friendly or non-friendly totals and a chosen kind of association
// Pure: no DOM, no canvas.
import { int, pick, shuffle } from '../../runtime/item';

export type Grid = number[][];
export interface Totals { row: number[]; col: number[]; all: number }
export function totals(cells: Grid): Totals {
  const row = cells.map(r => r.reduce((s, v) => s + v, 0));
  const col = cells[0]!.map((_, j) => cells.reduce((s, r) => s + r[j]!, 0));
  return { row, col, all: row.reduce((s, v) => s + v, 0) };
}
/** 100 * part / whole, exact */
export const pct = (part: number, whole: number): number => (100 * part) / whole;
/** round to d decimals (half up, robust to float noise) */
export function round(x: number, d = 1): number {
  const m = 10 ** d;
  return Math.round(x * m + Math.sign(x) * 1e-7) / m;
}
/** a number for display: at most d decimals, no trailing zeros */
export function fmt(x: number, d = 1): string {
  const r = round(x, d);
  return Number.isInteger(r) ? String(r) : r.toFixed(d).replace(/0+$/, '').replace(/\.$/, '');
}
/** is the exact percent already a short decimal (so "≈" is not needed)? */
export const exactAt = (x: number, d = 1): boolean => Math.abs(round(x, d) - x) < 1e-9;
/** TeX of a percent: 72.4\% (the \\% is a TeX percent sign) */
export const texPct = (x: number, d = 1): string => `${fmt(x, d)}\\%`;
export const htmlPct = (x: number, d = 1): string => `${fmt(x, d)}%`;
/** "=" when exact, "≈" when rounded (TeX) */
export const texEq = (x: number, d = 1): string => (exactAt(x, d) ? '=' : '\\approx');
export const htmlEq = (x: number, d = 1): string => (exactAt(x, d) ? '=' : '≈');

/** the conditional table: each row (by 'row') or each column (by 'col') as 100% */
export function cond(cells: Grid, by: 'row' | 'col'): Grid {
  const t = totals(cells);
  return cells.map((r, i) => r.map((v, j) => pct(v, by === 'row' ? t.row[i]! : t.col[j]!)));
}
export const joint = (cells: Grid): Grid => { const N = totals(cells).all; return cells.map(r => r.map(v => pct(v, N))); };
/** sum of the joint percents after each is rounded to tenths (can be 99.9 or 100.1) */
export const roundedJointSum = (cells: Grid): number => round(joint(cells).flat().reduce((s, v) => s + round(v, 1), 0), 1);
/** segment boundaries of one 100% bar: [0, p0, p0 + p1, ..., 100] */
export function bounds(ps: readonly number[]): number[] { const b = [0]; for (const p of ps) b.push(b[b.length - 1]! + p); return b; }

// ---------- contexts ----------
/** one category of a variable: its short table label, the noun phrase of the group, and the verb phrase */
export interface Cat { label: string; group: string; has: string }
export interface Var { name: string; cats: Cat[] }
export interface Ctx {
  id: string;
  /** plural and singular noun of a case: "students" / "student" */
  who: string; one: string;
  rows: Var; cols: Var;
  /** a plausible third variable behind an association (for the causation families) */
  confounder?: string;
}
const c = (label: string, group: string, has: string): Cat => ({ label, group, has });
export const CURFEW: Ctx = {
  id: 'curfew', who: 'eighth graders', one: 'eighth grader',
  rows: { name: 'curfews', cats: [c('Curfew', 'eighth graders with a curfew', 'have a curfew'), c('No curfew', 'eighth graders with no curfew', 'have no curfew')] },
  cols: { name: 'chores', cats: [c('Chores', 'eighth graders who do chores', 'do chores'), c('No chores', 'eighth graders who skip chores', 'skip chores')] },
  confounder: 'how strict their families are in general',
};
export const BUS: Ctx = {
  id: 'bus', who: 'students', one: 'student',
  rows: { name: 'riding the bus', cats: [c('Bus', 'bus riders', 'ride the bus'), c('No bus', 'students who don’t ride the bus', 'don’t ride the bus')] },
  cols: { name: 'school breakfast', cats: [c('Breakfast', 'breakfast eaters', 'eat school breakfast'), c('No breakfast', 'students who skip school breakfast', 'skip school breakfast')] },
  confounder: 'what time they get to school',
};
export const MUSIC: Ctx = {
  id: 'music', who: 'students', one: 'student',
  rows: { name: 'music lessons', cats: [c('Music', 'students who take music lessons', 'take music lessons'), c('No music', 'students who don’t take music lessons', 'don’t take music lessons')] },
  cols: { name: 'sports', cats: [c('Sport', 'students who play a sport', 'play a sport'), c('No sport', 'students who don’t play a sport', 'don’t play a sport')] },
  confounder: 'how much free time they have after school',
};
export const CONTEXTS_2x2: readonly Ctx[] = [
  CURFEW, BUS, MUSIC,
  { id: 'sleep', who: 'students', one: 'student',
    rows: { name: 'sports', cats: [c('Sport', 'athletes', 'play a sport'), c('No sport', 'students who don’t play a sport', 'don’t play a sport')] },
    cols: { name: 'bedtimes', cats: [c('Before 10', 'students in bed before 10 p.m.', 'go to bed before 10 p.m.'), c('After 10', 'students in bed after 10 p.m.', 'go to bed after 10 p.m.')] },
    confounder: 'how early their school day starts' },
  { id: 'dog', who: 'adults', one: 'adult',
    rows: { name: 'dogs', cats: [c('Dog', 'dog owners', 'own a dog'), c('No dog', 'adults without a dog', 'don’t own a dog')] },
    cols: { name: 'daily walks', cats: [c('Walks', 'daily walkers', 'walk every day'), c('No walks', 'adults who don’t walk every day', 'don’t walk every day')] },
    confounder: 'whether they live near a park' },
  { id: 'phone', who: 'students', one: 'student',
    rows: { name: 'phones', cats: [c('Phone', 'students with their own phone', 'have their own phone'), c('No phone', 'students without a phone', 'don’t have a phone')] },
    cols: { name: 'reading for fun', cats: [c('Reads', 'students who read for fun', 'read for fun'), c('Rarely', 'students who rarely read for fun', 'rarely read for fun')] },
    confounder: 'their age' },
  { id: 'card', who: 'students', one: 'student',
    rows: { name: 'library cards', cats: [c('Card', 'students with a library card', 'have a library card'), c('No card', 'students without a library card', 'don’t have a library card')] },
    cols: { name: 'homework club', cats: [c('Club', 'homework-club members', 'go to homework club'), c('No club', 'students who skip homework club', 'skip homework club')] },
    confounder: 'how close they live to the school library' },
  { id: 'garden', who: 'families', one: 'family',
    rows: { name: 'gardens', cats: [c('Garden', 'families with a garden', 'have a garden'), c('No garden', 'families without a garden', 'don’t have a garden')] },
    cols: { name: 'the farmers market', cats: [c('Market', 'farmers-market shoppers', 'shop at the farmers market'), c('No market', 'families who skip the market', 'skip the farmers market')] },
    confounder: 'whether they live in a house or an apartment' },
];
export const CONTEXTS_2x3: readonly Ctx[] = [
  { id: 'travel', who: 'students', one: 'student',
    rows: { name: 'their grade', cats: [c('Grade 7', 'seventh graders', 'are in seventh grade'), c('Grade 8', 'eighth graders', 'are in eighth grade')] },
    cols: { name: 'how they get to school', cats: [c('Bus', 'bus riders', 'ride the bus'), c('Car', 'students who come by car', 'come by car'), c('Walk', 'walkers', 'walk to school')] } },
  { id: 'lunch', who: 'students', one: 'student',
    rows: { name: 'their grade', cats: [c('Grade 7', 'seventh graders', 'are in seventh grade'), c('Grade 8', 'eighth graders', 'are in eighth grade')] },
    cols: { name: 'lunch', cats: [c('Pizza', 'pizza fans', 'chose pizza'), c('Salad', 'salad fans', 'chose salad'), c('Tacos', 'taco fans', 'chose tacos')] } },
  { id: 'movie', who: 'people', one: 'person',
    rows: { name: 'their age', cats: [c('Teens', 'teens', 'are teens'), c('Adults', 'adults', 'are adults')] },
    cols: { name: 'their favorite kind of movie', cats: [c('Comedy', 'comedy fans', 'chose comedy'), c('Action', 'action fans', 'chose action'), c('Drama', 'drama fans', 'chose drama')] } },
];
export const CONTEXTS_3x2: readonly Ctx[] = [
  { id: 'cardGrade', who: 'students', one: 'student',
    rows: { name: 'their grade', cats: [c('Grade 6', 'sixth graders', 'are in sixth grade'), c('Grade 7', 'seventh graders', 'are in seventh grade'), c('Grade 8', 'eighth graders', 'are in eighth grade')] },
    cols: { name: 'library cards', cats: [c('Card', 'students with a library card', 'have a library card'), c('No card', 'students without a library card', 'don’t have a library card')] } },
  { id: 'petHome', who: 'families', one: 'family',
    rows: { name: 'their home', cats: [c('House', 'families in a house', 'live in a house'), c('Apartment', 'families in an apartment', 'live in an apartment'), c('Other', 'families in other homes', 'live in another kind of home')] },
    cols: { name: 'pets', cats: [c('Pet', 'pet owners', 'have a pet'), c('No pet', 'families without a pet', 'don’t have a pet')] } },
];

// ---------- count tables ----------
export type Assoc = 'pos' | 'neg' | 'none' | 'any';
export interface GenOpts { rows: number; cols: number; friendly: boolean; assoc?: Assoc; /** grand totals that are not 100 or 200 */ oddTotal?: boolean; max?: number }
/** percent splits of 100 into k parts, multiples of 5, each at least lo */
function split(R: () => number, k: number, lo = 10): number[] {
  for (;;) {
    const ps: number[] = [];
    let left = 100;
    for (let i = 0; i < k - 1; i++) { const p = 5 * int(R, lo / 5, Math.floor((left - lo * (k - 1 - i)) / 5)); ps.push(p); left -= p; }
    ps.push(left);
    if (ps.every(p => p >= lo)) return ps;
  }
}
/** a count table. friendly: row totals multiples of 20 and row percents multiples of 5 (whole-number percents) */
export function genCounts(R: () => number, o: GenOpts): Grid {
  const max = o.max ?? 500;
  for (let tries = 0; tries < 400; tries++) {
    let cells: Grid;
    if (o.friendly) {
      const T = Array.from({ length: o.rows }, () => 20 * int(R, 2, Math.max(3, Math.floor(max / (20 * o.rows)))));
      const base = split(R, o.cols, o.cols === 2 ? 15 : 10);
      const P = T.map((_, i) => {
        if (o.assoc === 'none') return base;
        if (i === 0) return base;
        return split(R, o.cols, o.cols === 2 ? 15 : 10);
      });
      cells = T.map((t, i) => P[i]!.map(p => (t * p) / 100));
    } else {
      cells = Array.from({ length: o.rows }, () => Array.from({ length: o.cols }, () => int(R, 12, Math.floor(max / (o.rows * o.cols)) + 10)));
    }
    const t = totals(cells);
    if (t.all > max) continue;
    if (o.oddTotal && (t.all === 100 || t.all === 200)) continue;
    // every total distinct, so "which whole?" always has distinct answers
    const all = [...t.row, ...t.col, t.all];
    if (new Set(all).size !== all.length) continue;
    if (cells.flat().some(v => !Number.isInteger(v) || v <= 0)) continue;
    if (new Set(cells.flat()).size < cells.flat().length) continue;
    if (all.some(v => cells.flat().includes(v))) continue;
    // association control, judged on the first column's row-conditional percents
    const rc = cond(cells, 'row').map(r => r[0]!);
    const d = rc[0]! - rc[rc.length - 1]!;
    if (o.assoc === 'pos' && d < 20) continue;
    if (o.assoc === 'neg' && d > -20) continue;
    if (o.assoc === 'none' && Math.abs(d) > 1e-9) continue;
    if ((o.assoc === 'any' || o.assoc === undefined) && o.friendly && Math.abs(d) < 10) continue;
    return cells;
  }
  throw new Error('genCounts: no table found');
}
/** a context for a table shape */
export function ctxFor(R: () => number, rows: number, cols: number): Ctx {
  if (rows === 2 && cols === 2) return pick(R, CONTEXTS_2x2);
  if (rows === 2 && cols === 3) return pick(R, CONTEXTS_2x3);
  return pick(R, CONTEXTS_3x2);
}
/** choose a shape: 2x2 mostly, sometimes 2x3 or 3x2 */
export function shapeFor(R: () => number, wide = true): [number, number] {
  if (!wide) return [2, 2];
  const u = R();
  return u < 0.6 ? [2, 2] : u < 0.8 ? [2, 3] : [3, 2];
}
export { shuffle };

// ---------- the anchor data of the lesson ----------
/** 200 eighth graders: curfew x chores (topic JSON anchor set) */
export const ANCHOR: Grid = [[84, 36], [32, 48]];
/** your turn: 250 students, bus x school breakfast */
export const TURN: Grid = [[72, 48], [18, 112]];
/** prove it: 300 students, music lessons x sports; the yes-yes cell is the biggest, but there is no association */
export const PROVE: Grid = [[120, 60], [80, 40]];

// ---------- relative-frequency tables with margins (percents of the grand total) ----------
export interface RF { cells: number[][]; row: number[]; col: number[] }
/** complete a 2x2 joint relative-frequency table from known entries (keys 'c00','c01','c10','c11','r0','r1','k0','k1');
 *  returns the solved values or null when the information is not enough */
export function completeRF(known: Partial<Record<RFKey, number>>): Record<RFKey, number> | null {
  const v: Partial<Record<RFKey, number>> = { ...known };
  const eqs: [RFKey, RFKey, RFKey | 100][] = [
    ['c00', 'c01', 'r0'], ['c10', 'c11', 'r1'], ['c00', 'c10', 'k0'], ['c01', 'c11', 'k1'], ['r0', 'r1', 100], ['k0', 'k1', 100],
  ];
  for (let pass = 0; pass < 8; pass++) {
    for (const [a, b, s] of eqs) {
      const S = s === 100 ? 100 : v[s];
      const A = v[a], B = v[b];
      if (S !== undefined && A !== undefined && B === undefined) v[b] = round(S - A, 2);
      else if (S !== undefined && B !== undefined && A === undefined) v[a] = round(S - B, 2);
      else if (S === undefined && s !== 100 && A !== undefined && B !== undefined) v[s] = round(A + B, 2);
    }
  }
  return RF_KEYS.every(k => v[k] !== undefined) ? (v as Record<RFKey, number>) : null;
}
export type RFKey = 'c00' | 'c01' | 'c10' | 'c11' | 'r0' | 'r1' | 'k0' | 'k1';
export const RF_KEYS: readonly RFKey[] = ['c00', 'c01', 'c10', 'c11', 'r0', 'r1', 'k0', 'k1'];

// ---------- screening ----------
export interface Screen { N: number; base: number; sens: number; spec: number; tp: number; fn: number; fp: number; tn: number }
/** a screening population of N people (counts are whole numbers) */
export function screen(N: number, base: number, sens: number, spec: number): Screen {
  const has = (N * base) / 100, not = N - has;
  const tp = (has * sens) / 100, fn = has - tp, tn = (not * spec) / 100, fp = not - tn;
  return { N, base, sens, spec, tp, fn, fp, tn };
}
export const screenOk = (s: Screen): boolean => [s.tp, s.fn, s.fp, s.tn].every(v => Number.isInteger(v) && v > 0);
