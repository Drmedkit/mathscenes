// common.ts: what every practice family of "Counting: permutations and combinations" shares: the item type with its
// picture (CountPic specs the page draws), misconception ids (math-curriculum-essentials/misconceptions.json), names
// and contexts, and the choice / number / fraction / pair item makers (one helper per input kind; the choice maker
// drops every wrong choice whose value or meaning equals the right one). Pure: no DOM.
import { type Item, type Response, type Verdict, int, pick, shuffle, fracValue, same } from '../../runtime/item';
import { ans, endOnChoice } from '../../runtime/explain';
import type { CPic } from './CountPic';
import { fmtN, lowest } from './count';

export { ans, int, pick, shuffle };

/** the picture of an item: 1-2 CountPic cards stacked in the model frame (weights = their share of the height) */
export interface Pic { [k: string]: unknown; pics?: CPic[]; weights?: number[] }
export interface CItem extends Item { picture?: Pic }
export type Gen = (R: () => number, n: number, sg?: string) => CItem;

export const MC = {
  incomplete: 'mc.probability.incomplete-sample-space',
  branchLabels: 'mc.probability.branch-labels-as-complete-outcomes',
  keyWords: 'mc.probability.chooses-method-by-key-words',
  ordersDiff: 'mc.probability.counts-orders-as-different',
  reusePerson: 'mc.probability.reuses-person-across-exclusive-roles',
  repetition: 'mc.probability.misjudges-repetition',
  replOrder: 'mc.probability.replacement-conflated-with-order',
  addStages: 'mc.probability.adds-stage-counts',
  someStages: 'mc.probability.multiplies-only-some-stages',
  overlap: 'mc.probability.double-counts-overlap',
  multAlt: 'mc.probability.multiplies-alternatives-instead-of-adding',
  nTimesR: 'mc.probability.multiplies-n-by-r',
  swapNR: 'mc.probability.swaps-n-and-r',
  nFact: 'mc.probability.uses-n-factorial-for-partial-arrangement',
  keepAll: 'mc.probability.keeps-all-slot-choices-without-replacement',
  square: 'mc.probability.factorial-read-as-square',
  emptyZero: 'mc.probability.empty-selection-counted-as-zero',
  extraFact: 'mc.probability.extra-selection-factorial-in-permutations',
  divByR: 'mc.probability.divides-ordered-count-by-selection-size',
  merged: 'mc.probability.ordered-outcomes-merged',
  multOut: 'mc.probability.multiplies-out-factorials',
  missFact: 'mc.probability.combination-denominator-missing-factorial',
  compLarger: 'mc.probability.expects-complement-choose-larger',
  coincidence: 'mc.probability.identity-seen-as-coincidence',
  pools: 'mc.probability.pools-separate-groups',
  restrict: 'mc.probability.fills-positions-ignoring-restriction',
  atLeastOver: 'mc.probability.at-least-one-constructive-overcount',
  equiprob: 'mc.probability.equiprobability-bias',
  mixModel: 'mc.probability.ordered-numerator-unordered-denominator',
  noAudit: 'mc.probability.trusts-count-without-audit',
  repeatsDiv: 'mc.probability.divides-by-r-factorial-with-repeats',
  completeList: 'mc.add-sub.valid-examples-imply-complete-list',
  bounds: 'mc.statistics.mean-check-by-bounds-only',
  examples: 'mc.reasoning-language.examples-as-proof',
} as const;

// ---------- people and things (short names: they sit inside discs and chips) ----------
export const PEOPLE = ['Ana', 'Ben', 'Cy', 'Dev', 'Eli', 'Fay', 'Gus', 'Hal', 'Ivy', 'Jo', 'Kai', 'Lu', 'Max', 'Nia', 'Oz', 'Pia'];
export const LETTERS = 'ABCDEFGHIJKLMNOP'.split('');
/** someone who did the counting in a story */
export const NARRATORS = ['Ravi', 'Mia', 'Lee', 'Jay', 'Pat', 'Ty', 'Zoe', 'Mo', 'Rita', 'Kim', 'Ada', 'Omar'];
export const who = (R: () => number): string => NARRATORS[Math.floor(R() * NARRATORS.length)]!;
/** n distinct people, shuffled */
export const people = (R: () => number, n: number): string[] => shuffle(R, PEOPLE.slice()).slice(0, n);
/** "Ana, Ben and Cy" */
export const andList = (xs: readonly string[]): string => (xs.length <= 1 ? xs.join('') : xs.length === 2 ? `${xs[0]} and ${xs[1]}` : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);
/** plural noun after a count ("1 way", "3 ways") */
export const pl = (k: number, one: string, many = one + 's') => `${fmtN(k)} ${k === 1 ? one : many}`;
export const B = (s: string | number) => `<b class="b">${s}</b>`;
export const A = (s: string | number) => `<b class="a">${s}</b>`;
export const N = (v: number) => fmtN(v);
/** the calculator tag the topic asks for (the arithmetic policy: big products go on a calculator after set-up) */
export const CALC = ' <span class="dim">(calculator allowed)</span>';

// ---------- item makers ----------
export interface Opt { t: string; ok?: boolean; mc?: string; say: string; /** the same key as the right choice = the same answer: dropped */ key?: string | number }
export interface Base { id: string; family: string; prompt: string; board: string; solution: string[]; picture?: Pic; unit?: string }

/** a choice item: duplicate texts and wrong choices that mean the same as the right one (same key) are dropped */
export function choice(R: () => number, b: Base, opts: Opt[], keepOrder = false): CItem {
  const right = opts.filter(x => x.ok);
  if (right.length !== 1) throw new Error(`${b.family}: exactly one right choice`);
  const rk = right[0]!.key;
  const seen = new Set<string>(), seenKey = new Set<string>();
  const o0 = opts.filter(x => {
    const t = x.t.replace(/\s+/g, ' ').trim();
    if (seen.has(t)) return false;
    if (!x.ok && rk !== undefined && x.key !== undefined && String(x.key) === String(rk)) return false;
    seen.add(t); if (x.key !== undefined) seenKey.add(String(x.key));
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
/** a typed whole number; candidate slips equal to the answer are skipped (they would be right) */
export function numItem(b: Base, v: number, okSay: string, cands: Cand[], hint: string): CItem {
  return {
    ...b, input: 'num', answer: { kind: 'num', v },
    check(r: Response): Verdict {
      if (r.kind !== 'num' || !Number.isFinite(r.v)) return { ok: false, say: 'Type a whole number.' };
      if (Math.abs(r.v - v) < 1e-9) return { ok: true, say: okSay };
      for (const [c, mc, say] of cands) if (Number.isFinite(c) && Math.abs(c - v) > 1e-9 && Math.abs(r.v - c) < 1e-9) return { ok: false, mc, say };
      return { ok: false, say: hint };
    },
  };
}
export type FCand = [number, number, string | undefined, string];
/** a probability as a fraction: any equivalent fraction is right (the answer key is in lowest terms) */
export function fracItem(b: Base, n: number, d: number, okSay: string, cands: FCand[], hint: string): CItem {
  const [ln, ld] = lowest(n, d);
  return {
    ...b, input: 'frac', answer: { kind: 'frac', w: 0, n: ln, d: ld },
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
export type PCand = [number, number, string | undefined, string];
export function pairItem(b: Base, x: number, y: number, form: { lead: string; op: string; tail?: string }, okSay: string, cands: PCand[], hint: string): CItem {
  const nr = (p: number, q: number) => Math.abs(p - q) < 1e-9;
  return {
    ...b, input: 'pair', pairLead: form.lead, pairOp: form.op, pairTail: form.tail ?? '', answer: { kind: 'pair', x, y },
    check(r: Response): Verdict {
      if (r.kind !== 'pair' || !Number.isFinite(r.x) || !Number.isFinite(r.y)) return { ok: false, say: 'Fill in both boxes with whole numbers.' };
      if (nr(r.x, x) && nr(r.y, y)) return { ok: true, say: okSay };
      for (const [cx, cy, mc, say] of cands) if (!(nr(cx, x) && nr(cy, y)) && nr(r.x, cx) && nr(r.y, cy)) return { ok: false, mc, say };
      if (nr(r.x, x)) return { ok: false, say: `The first box is right. ${hint}` };
      if (nr(r.y, y)) return { ok: false, say: `The second box is right. ${hint}` };
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
