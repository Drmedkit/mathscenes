// chanceMaths.ts: the exact maths of one-stage and compound chance experiments, pure (no DOM, no canvas).
//   bagSpace / cubeSpace / spinnerSpace   sample spaces at the level where outcomes are equally likely
//   prob(event, space)                    favorable / total, checked (the event must be part of the space)
//   simulate / running / batches          a SEEDED experiment (the rng is passed in; never Math.random)
//   pairs / tossSpace                     compound sample spaces as ordered outcomes (with / without replacement)
//   digitTrials                           a random-digit simulation cut into complete trials
// Every function checks its own result and throws a readable BlockError when the maths does not hold.
import { check } from '../../../blocks/block';

const NAME = 'Chance';
/** an exact fraction [numerator, denominator], NOT reduced (3/6 stays 3/6: counts mean something) */
export type Frac = readonly [number, number];
export const gcd = (a: number, b: number): number => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
export const reduce = (f: Frac): Frac => { const g = gcd(f[0], f[1]) || 1; return [f[0] / g, f[1] / g]; };
export const eqF = (a: Frac, b: Frac): boolean => a[0] * b[1] === b[0] * a[1];
export const cmpF = (a: Frac, b: Frac): number => a[0] * b[1] - b[0] * a[1];
export const addF = (a: Frac, b: Frac): Frac => (a[1] === b[1] ? [a[0] + b[0], a[1]] : [a[0] * b[1] + b[0] * a[1], a[1] * b[1]]);
export const num = (f: Frac): number => f[0] / f[1];
export const complementOf = (p: Frac): Frac => { check(p[0] >= 0 && p[0] <= p[1], NAME, `P = ${p[0]}/${p[1]} is not between 0 and 1`); return [p[1] - p[0], p[1]]; };

// ---------- one-stage sample spaces ----------
export type MarbleCol = 'blue' | 'white' | 'pink' | 'gray';
export const LETTER: Record<MarbleCol, string> = { blue: 'B', white: 'W', pink: 'P', gray: 'G' };
export interface Outcome { id: string; tex: string; group: string }
export interface Group { col: MarbleCol; n: number }
/** a bag: every marble its own outcome (B1, B2, W ...); a colour with one marble keeps its bare letter */
export function bagSpace(groups: readonly Group[]): Outcome[] {
  const out: Outcome[] = [];
  for (const g of groups) {
    check(Number.isInteger(g.n) && g.n >= 1, NAME, `a bag needs whole counts (got ${g.n} ${g.col})`);
    for (let i = 1; i <= g.n; i++) {
      const L = LETTER[g.col];
      out.push({ id: g.n === 1 ? L : `${L}${i}`, tex: g.n === 1 ? L : `${L}_{${i}}`, group: g.col });
    }
  }
  check(new Set(groups.map(g => g.col)).size === groups.length, NAME, 'a colour is listed twice');
  check(new Set(out.map(o => o.id)).size === out.length, NAME, 'two marbles have the same name');
  return out;
}
export const cubeSpace = (): Outcome[] => [1, 2, 3, 4, 5, 6].map(v => ({ id: String(v), tex: String(v), group: String(v) }));
/** an equal-sector spinner with labelled sectors */
export const spinnerSpace = (labels: readonly string[]): Outcome[] => labels.map((l, i) => ({ id: `${i}`, tex: l, group: l }));

/** favorable / total in an equally likely space (not reduced) */
export function prob(event: readonly Outcome[], space: readonly Outcome[]): Frac {
  check(space.length > 0, NAME, 'an empty sample space');
  const ids = new Set(space.map(o => o.id));
  check(ids.size === space.length, NAME, 'the sample space repeats an outcome');
  check(event.every(o => ids.has(o.id)), NAME, 'the event has an outcome that is not in the sample space');
  check(new Set(event.map(o => o.id)).size === event.length, NAME, 'the event repeats an outcome');
  return [event.length, space.length];
}
export const eventOf = (space: readonly Outcome[], pred: (o: Outcome) => boolean): Outcome[] => space.filter(pred);

/** the five words of the 0-1 scale */
export type Word = 'impossible' | 'unlikely' | 'as likely as not' | 'likely' | 'certain';
export const WORDS: readonly Word[] = ['impossible', 'unlikely', 'as likely as not', 'likely', 'certain'];
export function wordOf(p: Frac): Word {
  check(p[1] > 0 && p[0] >= 0 && p[0] <= p[1], NAME, `${p[0]}/${p[1]} is not a probability`);
  const c = cmpF(p, [1, 2]);
  return p[0] === 0 ? 'impossible' : p[0] === p[1] ? 'certain' : c === 0 ? 'as likely as not' : c < 0 ? 'unlikely' : 'likely';
}
/** a complete model: every probability in [0, 1] and the sum exactly 1 */
export function isModel(ps: readonly Frac[]): { ok: boolean; sum: Frac; outside: boolean } {
  let sum: Frac = [0, 1];
  for (const p of ps) sum = addF(sum, p);
  const outside = ps.some(p => p[0] < 0 || p[0] > p[1]);
  return { ok: !outside && sum[0] === sum[1], sum, outside };
}
/** the expected count n·P, exact (only items where it is a whole number use it as an answer) */
export const expectedCount = (p: Frac, n: number): number => (n * p[0]) / p[1];

// ---------- a seeded experiment ----------
/** n draws; each draw is a category index chosen with the given probabilities (they must sum to 1) */
export function simulate(R: () => number, ps: readonly Frac[], n: number): number[] {
  check(isModel(ps).ok, NAME, 'the model of the experiment does not sum to 1');
  const cum: number[] = []; let s = 0;
  for (const p of ps) { s += num(p); cum.push(s); }
  const out: number[] = [];
  for (let i = 0; i < n; i++) { const u = R(); let k = cum.findIndex(c => u < c); if (k < 0) k = ps.length - 1; out.push(k); }
  return out;
}
/** the running share of hits after every trial: hits so far / trials so far */
export function running(hits: readonly boolean[]): Frac[] {
  let h = 0;
  const out = hits.map((x, i) => { if (x) h++; return [h, i + 1] as Frac; });
  check(out.length === 0 || out[out.length - 1]![0] === hits.filter(Boolean).length, NAME, 'running share lost a hit');
  return out;
}
/** `count` batches of `size` trials with P(hit) = p: the number of hits in each batch */
export function batches(R: () => number, p: Frac, size: number, count: number): number[] {
  const out: number[] = [];
  for (let b = 0; b < count; b++) { let h = 0; for (let i = 0; i < size; i++) if (R() < num(p)) h++; out.push(h); }
  return out;
}
/** how many reference batches reach the observation (at least `obs`, or at most when below the expected count) */
export function asExtreme(ref: readonly number[], obs: number, expected: number): number {
  return obs >= expected ? ref.filter(x => x >= obs).length : ref.filter(x => x <= obs).length;
}

// ---------- compound sample spaces ----------
/** all ordered pairs (a, b) of two stages; without replacement the same object can't be drawn twice */
export function pairs<A, B>(as: readonly A[], bs: readonly B[], same?: (a: A, b: B) => boolean): [A, B][] {
  const out: [A, B][] = [];
  for (const a of as) for (const b of bs) if (!same || !same(a, b)) out.push([a, b]);
  return out;
}
/** every sequence of n coin tosses, in tree order (H first) */
export function tossSpace(n: number): string[] {
  check(n >= 1 && n <= 4, NAME, 'toss a coin 1 to 4 times');
  let out = [''];
  for (let i = 0; i < n; i++) out = out.flatMap(s => [s + 'H', s + 'T']);
  check(out.length === 2 ** n && new Set(out).size === out.length, NAME, 'the toss list is not complete');
  return out;
}
export const heads = (s: string): number => [...s].filter(c => c === 'H').length;
/** the 36 ordered rolls of two number cubes */
export const twoCubes = (): [number, number][] => pairs([1, 2, 3, 4, 5, 6], [1, 2, 3, 4, 5, 6]);

// ---------- a random-digit simulation ----------
/** cut a digit string into complete trials of `size` digits, in order, no overlap; a trial succeeds by `ok` */
export function digitTrials(digits: readonly number[], size: number, ok: (block: readonly number[]) => boolean): { blocks: number[][]; wins: boolean[] } {
  check(size >= 1 && digits.length % size === 0, NAME, `${digits.length} digits do not cut into trials of ${size}`);
  const blocks: number[][] = [];
  for (let i = 0; i < digits.length; i += size) blocks.push(digits.slice(i, i + size));
  check(blocks.flat().length === digits.length, NAME, 'a digit was lost or reused');
  return { blocks, wins: blocks.map(ok) };
}
