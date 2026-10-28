// common.ts: what the practice families of "Polynomial expressions" share: misconception ids, the picture data the
// page draws (a product box, a degree shelf, a chain of rewrites), and the item builders (choice / number / pair)
// with exact checks. Pure: no DOM.
import { type Item, type Response, type Verdict, int, shuffle } from '../../runtime/item';
import { endOnChoice } from '../../runtime/explain';
import { type Poly, type Term, collect, equal, polyHtml } from './poly';

// ---------- misconception ids (all in math-curriculum-essentials/misconceptions.json) ----------
export const MC = {
  beyondBase: 'mc.properties.exponent-applied-beyond-base',
  baseTimesExp: 'mc.exponents-roots.power-as-base-times-exponent',
  expZero: 'mc.expressions.unwritten-exponent-as-zero',
  varDen: 'mc.quadratic-polynomial.variable-denominator-allowed',
  rejectFrac: 'mc.rational-radical.rejects-fractional-polynomial-coefficients',
  surface: 'mc.rational-radical.classifies-by-surface-symbol',
  symbols: 'mc.expressions.counts-symbols-as-terms',
  detached: 'mc.integers.minus-sign-detached-from-term',
  expAsCoef: 'mc.expressions.selects-exponent-as-coefficient',
  denAsCoef: 'mc.expressions.denominator-as-coefficient',
  implicitOne: 'mc.expressions.ignores-implicit-coefficient-one',
  coefAsDeg: 'mc.quadratic-polynomial.coefficient-as-degree',
  constDeg: 'mc.quadratic-polynomial.nonzero-constant-degree-misassigned',
  degSum: 'mc.quadratic-polynomial.degree-sum-of-exponents',
  degCount: 'mc.quadratic-polynomial.degree-is-term-count',
  byPosition: 'mc.linear-functions.m-b-by-position',
  miscount: 'mc.quadratic-polynomial.miscount-terms-for-name',
  mvFirst: 'mc.quadratic-polynomial.multivariable-degree-first-exponent',
  likeByLetter: 'mc.expressions.matches-like-terms-by-letter-or-coefficient',
  totalDegLike: 'mc.expressions.equal-total-degree-means-like-terms',
  xyYx: 'mc.expressions.treats-xy-and-yx-as-unlike',
  addExps: 'mc.exponents-roots.sci-add-adds-exponents',
  unlike: 'mc.expressions.combines-unlike-terms',
  nameBefore: 'mc.quadratic-polynomial.polynomial-name-before-collecting',
  position: 'mc.quadratic-polynomial.combine-unlike-terms',
  negFirst: 'mc.integers.distribute-negative-first-term-only',
  multExps: 'mc.exponents-roots.product-of-powers-multiplies-exponents',
  addCoefs: 'mc.expressions.adds-when-multiplying-terms',
  dropVar: 'mc.expressions.drops-variable-factor-in-constant-term-product',
  partial: 'mc.properties.partial-distribution',
  firstsLasts: 'mc.quadratic-polynomial.firsts-and-lasts-only',
  foilLimit: 'mc.quadratic-polynomial.foil-limit-blocks-larger-products',
  fnSum: 'mc.functions-concept.function-distributes-over-sum',
  unlikePos: 'mc.integers.unlike-signs-product-positive',
  conjSquare: 'mc.quadratic-polynomial.conjugate-product-as-square',
  foilRule: 'mc.quadratic-polynomial.foil-as-general-rule',
  mismatch: 'mc.quadratic-polynomial.partial-product-like-term-mismatch',
  nonSep: 'mc.expressions.chooses-non-separating-test-value',
  examples: 'mc.reasoning-language.examples-as-proof',
  exception: 'mc.reasoning-language.counterexample-as-exception',
  unfamiliar: 'mc.expressions.rejects-unfamiliar-rewrites',
  finalAnswer: 'mc.reasoning-language.judges-work-by-final-answer',
  answerSwap: 'mc.reasoning-language.answer-swap-as-error-explanation',
  quotient: 'mc.quadratic-polynomial.quotient-always-polynomial',
  constNotPoly: 'mc.quadratic-polynomial.closure-means-same-degree',
  keepDegree: 'mc.quadratic-polynomial.closure-requires-degree-preservation',
  group: 'mc.expressions.misses-group-as-one-quantity',
  noMeaning: 'mc.expressions.gives-terms-no-context-meaning',
} as const;

// ---------- pictures (what the page draws; `reveal` is answer-side and hidden from the oracle) ----------
/** a product box: factor a down the left, factor b across the top. cells: none (the solve fills them), all, or all
 *  but the asked ones ('?'). notes: side words with units. */
export interface BoxPic { a: Term[]; b: Term[]; cells: 'none' | 'all' | 'ask'; ask?: [number, number][]; noteL?: string; noteT?: string }
/** a degree shelf: rows of signed term cards; row 0 may lie loose in written order; flipRow turns at the solve */
export interface ShelfPic { rows: Term[][]; labels?: string[]; loose?: boolean; flipRow?: number; sum?: boolean; askD?: number[] }
/** a chain of rewrites, numbered lines (TeX); `x` = a test value whose line values are shown (subst. audit) */
export interface ChainPic { lines: string[]; vals?: string[]; at?: number }
export type PolyPicture = { box?: BoxPic; shelf?: ShelfPic; chain?: ChainPic; reveal?: { lines?: string[]; bad?: number; flipOnly?: number[] } };
export interface PolyItem extends Item { picture?: PolyPicture }
export type Gen = (R: () => number, n: number, sg?: string) => PolyItem;

// ---------- builders ----------
export interface Opt { t: string; ok?: boolean; mc?: string; say: string }
export type Base = Omit<PolyItem, 'input' | 'choices' | 'answer' | 'check'>;
/** thrown when the random numbers made an unfair item; retry() rolls again */
export class Reroll extends Error {}
export function retry(R: () => number, make: () => PolyItem): PolyItem {
  for (let i = 0; i < 60; i++) { try { return make(); } catch (e) { if (!(e instanceof Reroll)) throw e; } }
  throw new Error('retry: 60 rerolls');
}
/** a choice item: options shuffled, exactly one right, distinct texts (a duplicate wrong text is dropped) */
export function choiceItem(R: () => number, base: Base, opts: Opt[], o: { min?: number; keep?: boolean } = {}): PolyItem {
  const seen = new Set<string>(), list: Opt[] = [];
  for (const x of opts) { if (seen.has(x.t)) { if (x.ok) throw new Reroll(); continue; } seen.add(x.t); list.push(x); }
  if (list.filter(x => x.ok).length !== 1) throw new Error(`${base.family}: exactly one right choice`);
  if (list.length < (o.min ?? 3)) throw new Reroll();
  const sh = o.keep ? list : shuffle(R, list.slice());
  const i = sh.findIndex(x => x.ok);
  return {
    ...base, input: 'choice', choices: sh.map(x => x.t), answer: { kind: 'choice', i }, solution: endOnChoice(base.solution, sh[i]!.t),
    check: (r: Response) => {
      if (r.kind !== 'choice' || !sh[r.i]) return { ok: false, say: 'Pick one of the answers.' };
      const c = sh[r.i]!;
      return { ok: !!c.ok, mc: c.mc, say: c.say };
    },
  };
}
/** polynomial options: wrong ones that collect to the right answer (or to each other) are dropped */
export interface PolyOpt { p: Poly; mc?: string; say: string; text?: string }
export function polyChoice(R: () => number, base: Base, right: PolyOpt, wrongs: PolyOpt[], o: { min?: number; std?: boolean; max?: number } = {}): PolyItem {
  const show = (x: PolyOpt) => x.text ?? polyHtml(o.std === false ? x.p : collect(x.p));
  const kept: PolyOpt[] = [];
  for (const w of wrongs) {
    if (equal(w.p, right.p) || show(w) === show(right)) continue;
    if (kept.some(k => equal(k.p, w.p) || show(k) === show(w))) continue;
    if (kept.length < (o.max ?? 3)) kept.push(w);
  }
  return choiceItem(R, base, [{ t: show(right), ok: true, say: right.say }, ...kept.map(w => ({ t: show(w), mc: w.mc, say: w.say }))], { min: o.min ?? 3 });
}
export const near = (a: number, b: number) => Math.abs(a - b) < 1e-9;
export function numItem(base: Omit<PolyItem, 'input' | 'answer' | 'check'>, a: number, check: (v: number) => Verdict): PolyItem {
  return {
    ...base, input: 'num', answer: { kind: 'num', v: a },
    check: (r: Response) => (r.kind === 'num' && Number.isFinite(r.v) ? check(r.v) : { ok: false, say: 'Type a number.' }),
  };
}
/** a number check: right, else the first matching slip (value → mc, say), else the general hint */
export function numCheck(right: number, okSay: string, slips: { v: number; mc?: string; say: string }[], hint: string): (v: number) => Verdict {
  return v => {
    if (near(v, right)) return { ok: true, say: okSay };
    const s = slips.find(x => !near(x.v, right) && near(x.v, v));
    return s ? { ok: false, mc: s.mc, say: s.say } : { ok: false, say: hint };
  };
}
export function pairItem(base: Omit<PolyItem, 'input' | 'answer' | 'check'>, x: number, y: number, check: (a: number, b: number) => Verdict): PolyItem {
  return {
    ...base, input: 'pair', answer: { kind: 'pair', x, y },
    check: (r: Response) => (r.kind === 'pair' && Number.isFinite(r.x) && Number.isFinite(r.y) ? check(r.x, r.y) : { ok: false, say: 'Fill in both boxes.' }),
  };
}
/** a nonzero whole number in [lo, hi] */
export function nz(R: () => number, lo: number, hi: number): number { for (;;) { const v = int(R, lo, hi); if (v !== 0) return v; } }
/** a whole number in [lo, hi] other than the given ones */
export function other(R: () => number, lo: number, hi: number, not: number[]): number { for (;;) { const v = int(R, lo, hi); if (!not.includes(v)) return v; } }
export const V = (s: string) => `<i>${s}</i>`;
export const X = V('x');
