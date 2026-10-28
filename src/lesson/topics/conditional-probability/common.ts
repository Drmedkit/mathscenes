// common.ts: what every practice family of "Conditional probability and independence" shares: the item type with its
// picture (CondPic specs the page draws), misconception ids (math-curriculum-essentials/misconceptions.json), exact
// fraction helpers, and the choice / number / fraction item makers. The choice maker drops every wrong choice whose
// key equals the right one (same value, same claim), so a distractor can never be secretly right. Pure: no DOM.
import { type Item, type Response, type Verdict, fr, fracValue, gcd, int, pick, same, shuffle } from '../../runtime/item';
import { ans, endOnChoice } from '../../runtime/explain';
import type { CPic } from './CondPic';

export { ans, fr, gcd, int, pick, shuffle };

export interface Pic { [k: string]: unknown; pics?: CPic[]; weights?: number[] }
export interface CItem extends Item { picture?: Pic }
export type Gen = (R: () => number, n: number, sg?: string) => CItem;

export const MC = {
  branchLabels: 'mc.probability.branch-labels-as-complete-outcomes',
  merged: 'mc.probability.ordered-outcomes-merged',
  interSum: 'mc.probability.intersection-count-as-sum',
  andOr: 'mc.probability.and-or-confusion',
  overlap: 'mc.probability.double-counts-overlap',
  orExcl: 'mc.probability.or-read-as-exclusive',
  partialComp: 'mc.probability.partial-complement',
  totalCell: 'mc.data-displays.total-cell-as-joint-cell',
  totalOne: 'mc.data-displays.total-for-one-category',
  newWhole: 'mc.probability.condition-not-made-new-whole',
  barDiv: 'mc.probability.conditional-bar-read-as-division',
  inverse: 'mc.probability.confusion-of-the-inverse',
  equiprob: 'mc.probability.equiprobability-bias',
  zeroDen: 'mc.probability.zero-denominator-conditional-is-zero',
  reuseDen: 'mc.probability.reuses-denominator-when-condition-changes',
  twoCells: 'mc.data-displays.one-item-two-cells',
  marginTally: 'mc.data-displays.marginal-tallies-replace-joint-classification',
  causation: 'mc.statistics.correlation-implies-causation',
  assumeIndep: 'mc.probability.assumes-independence-by-default',
  noProps: 'mc.probability.independence-judged-without-proportions',
  oneCell: 'mc.probability.independence-from-one-cell-count',
  circular: 'mc.probability.circular-independence-product-test',
  wrAlways: 'mc.probability.without-replacement-always-dependent',
  drawsExcl: 'mc.probability.different-draw-results-assumed-exclusive',
  addStages: 'mc.probability.adds-stage-counts',
  misExcl: 'mc.probability.misreads-mutually-exclusive',
  exclUnequal: 'mc.probability.mutual-exclusivity-as-unequal-probabilities',
  multOr: 'mc.probability.multiplies-for-or',
  subDisjoint: 'mc.probability.subtracts-overlap-for-disjoint-events',
  disjIndep: 'mc.probability.disjointness-decides-independence',
  exhaustive: 'mc.probability.independent-or-exclusive-assumed-exhaustive',
  incompatible: 'mc.probability.exclusive-and-independent-always-incompatible',
  mirror: 'mc.statistics.sample-should-mirror-population',
  anyDiff: 'mc.statistics.any-sample-difference-is-real',
  exactParam: 'mc.statistics.sample-statistic-as-exact-parameter',
  laterEvent: 'mc.probability.later-event-cannot-condition-earlier',
  unweighted: 'mc.probability.total-probability-unweighted-rates',
  bayesDiv: 'mc.probability.bayes-divides-by-prior-or-one-path',
  baseRate: 'mc.probability.posterior-ignores-base-rate',
  examples: 'mc.reasoning-language.examples-as-proof',
} as const;

// ---------- exact numbers ----------
export const lowest = (n: number, d: number): [number, number] => { const g = gcd(n, d) || 1; return [n / g, d / g]; };
/** "3/8" in HTML (stacked), lowest terms unless raw */
export const fh = (n: number, d: number, raw = false): string => { const [a, b] = raw ? [n, d] : lowest(n, d); return b === 1 ? String(a) : fr(a, b); };
/** "3/8" as plain text (the answer mark: the explain reader parses it) */
export const ft = (n: number, d: number): string => { const [a, b] = lowest(n, d); return b === 1 ? String(a) : `${a}/${b}`; };
/** TeX of a fraction (lowest terms unless raw) */
export const fx = (n: number, d: number, raw = false): string => { const [a, b] = raw ? [n, d] : lowest(n, d); return b === 1 ? String(a) : `\\tfrac{${a}}{${b}}`; };
/** round half up, robust to float noise */
export function round(x: number, d: number): number { const m = 10 ** d; return Math.round(x * m + Math.sign(x) * 1e-7) / m; }
/** a decimal for display: at most d places, no trailing zeros */
export function dec(x: number, d = 4): string { const r = round(x, d); return Number.isInteger(r) ? String(r) : r.toFixed(d).replace(/0+$/, '').replace(/\.$/, ''); }
/** a decimal with exactly d places (for stated roundings: 0.090) */
export const decFixed = (x: number, d: number): string => round(x, d).toFixed(d);
/** percent text of a probability: 0.35 -> "35%" */
export const pc = (p: number, d = 2): string => `${dec(p * 100, d)}%`;
/** the exact value of a ratio in hundredths? (so a stated decimal answer has no rounding) */
export const isDec = (n: number, d: number, places = 3): boolean => Number.isInteger(round((n * 10 ** places) / d, 6));
/** is x far enough from a rounding tie at `places` (no "5" right after the last kept place)? */
export function noTie(x: number, places: number): boolean { const s = x * 10 ** places; const f = s - Math.floor(s); return Math.abs(f - 0.5) > 0.02; }

/** "n/d = a/b" with the lowest-terms value marked as the answer; just the marked value when n/d is already in lowest terms */
export const red = (n: number, d: number): string => { const [a, b] = lowest(n, d); return a === n && b === d ? ans(ft(n, d)) : `${n}/${d} = ${ans(ft(n, d))}`; };
/** the same without the answer mark */
export const redP = (n: number, d: number): string => { const [a, b] = lowest(n, d); return a === n && b === d ? ft(n, d) : `${n}/${d} = ${ft(n, d)}`; };

// ---------- words ----------
export const NAMES = ['Ravi', 'Mia', 'Lee', 'Jay', 'Pat', 'Ty', 'Zoe', 'Mo', 'Rita', 'Kim', 'Ada', 'Omar', 'Noor', 'Eli', 'Sam', 'Lu'];
export const who = (R: () => number): string => pick(R, NAMES);
const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
export const word = (n: number): string => WORDS[n] ?? String(n);
export const B = (s: string | number) => `<b class="b">${s}</b>`;
export const A = (s: string | number) => `<b class="a">${s}</b>`;
export const CALC = ' <span class="dim">(calculator allowed)</span>';

// ---------- item makers ----------
export interface Opt { t: string; ok?: boolean; mc?: string; say: string; /** the same key as the right choice = the same answer: dropped */ key?: string | number }
export interface Base { id: string; family: string; prompt: string; board: string; solution: string[]; picture?: Pic; unit?: string }

/** a choice item: duplicate texts and wrong choices that mean the same as the right one (same key) are dropped */
export function choice(R: () => number, b: Base, opts: Opt[], keepOrder = false): CItem {
  const right = opts.filter(x => x.ok);
  if (right.length !== 1) throw new Error(`${b.family}: exactly one right choice`);
  const rk = right[0]!.key;
  const seen = new Set<string>();
  const o0 = opts.filter(x => {
    const t = x.t.replace(/\s+/g, ' ').trim();
    if (seen.has(t)) return false;
    if (!x.ok && rk !== undefined && x.key !== undefined && String(x.key) === String(rk)) return false;
    seen.add(t);
    return true;
  });
  const o = keepOrder ? o0.slice() : shuffle(R, o0.slice());
  const i = o.findIndex(x => x.ok);
  return {
    ...b, input: 'choice', choices: o.map(x => x.t), answer: { kind: 'choice', i }, solution: endOnChoice(b.solution, o[i]!.t),
    check(r: Response): Verdict {
      if (r.kind !== 'choice' || !o[r.i]) return { ok: false, say: 'Pick one of the answers.' };
      const x = o[r.i]!;
      return { ok: !!x.ok, mc: x.ok ? undefined : x.mc, say: x.say };
    },
  };
}
/** a wrong typed value with its misconception and a specific reply */
export type Cand = [number, string | undefined, string];
/** a typed number; `tol` = the accepted distance (a stated rounding); slips equal to the answer are skipped */
export function numItem(b: Base, v: number, okSay: string, cands: Cand[], hint: string, tol = 1e-9): CItem {
  return {
    ...b, input: 'num', answer: { kind: 'num', v },
    check(r: Response): Verdict {
      if (r.kind !== 'num' || !Number.isFinite(r.v)) return { ok: false, say: 'Type a number.' };
      if (Math.abs(r.v - v) <= tol) return { ok: true, say: okSay };
      for (const [c, mc, say] of cands) if (Number.isFinite(c) && Math.abs(c - v) > tol && Math.abs(r.v - c) <= Math.max(tol, 1e-9)) return { ok: false, mc, say };
      return { ok: false, say: hint };
    },
  };
}
export type FCand = [number, number, string | undefined, string];
/** a probability as a fraction: any equivalent fraction is right (the answer key is in lowest terms) */
export function fracItem(b: Base, n: number, d: number, okSay: string, cands: FCand[], hint: string): CItem {
  const [ln, ld] = lowest(n, d);
  const key: Response = ld === 1 ? { kind: 'frac', w: ln, n: 0, d: 1 } : { kind: 'frac', w: 0, n: ln, d: ld };
  return {
    ...b, input: 'frac', answer: key,
    check(r: Response): Verdict {
      if (r.kind !== 'frac') return { ok: false, say: 'Type a fraction.' };
      const v = fracValue(r);
      if (!v) return { ok: false, say: 'Type the probability as a fraction: a whole-number top and bottom.' };
      if (same(v, ln, ld)) return { ok: true, say: okSay };
      for (const [cn, cd, mc, say] of cands) if (cd > 0 && cn * ld !== ln * cd && same(v, cn, cd)) return { ok: false, mc, say };
      return { ok: false, say: hint };
    },
  };
}
/** try a maker until the test holds */
export function until<T>(make: () => T, ok: (t: T) => boolean, tries = 4000): T {
  let t = make();
  for (let i = 0; i < tries && !ok(t); i++) t = make();
  if (!ok(t)) throw new Error('until: nothing found');
  return t;
}
