// common.ts: what the practice families of "Polynomial operations and identities" share: misconception ids, the
// picture data the page draws (a product box, the area square, a chain of lines on a slate), and the item builders
// with exact checks. Expression choices go through exChoice, which drops every wrong choice that expands to the same
// polynomial as the answer (or as another kept choice): no "secretly right" distractor survives. Pure: no DOM.
import { type Item, type Response, type Verdict, int, shuffle } from '../../runtime/item';
import { endOnChoice } from '../../runtime/explain';
import { type Ex, type P, equalP, ex, exHtml } from './idm';

// ---------- misconception ids (all in math-curriculum-essentials/misconceptions.json) ----------
export const MC = {
  examples: 'mc.reasoning-language.examples-as-proof',
  conditional: 'mc.trig-functions.identity-vs-conditional-equation',
  totalDegLike: 'mc.expressions.equal-total-degree-means-like-terms',
  xyYx: 'mc.expressions.treats-xy-and-yx-as-unlike',
  fnSum: 'mc.functions-concept.function-distributes-over-sum',
  minusSpreads: 'mc.quadratic-polynomial.minus-sign-spreads',
  conjSquare: 'mc.quadratic-polynomial.conjugate-product-as-square',
  conjCross: 'mc.quadratic-polynomial.conjugate-product-cross-term-retained',
  partial: 'mc.properties.partial-distribution',
  foilRule: 'mc.quadratic-polynomial.foil-as-general-rule',
  powOne: 'mc.exponents-roots.powers-only-one-product-factor',
  mid2aPlusB: 'mc.quadratic-polynomial.middle-term-2a-plus-b',
  forced: 'mc.quadratic-polynomial.special-product-template-forced',
  chunkUnit: 'mc.quadratic-polynomial.chunk-not-a-unit',
  chunkTermwise: 'mc.quadratic-polynomial.squares-compound-chunk-termwise',
  psUnchecked: 'mc.quadratic-polynomial.perfect-square-unchecked',
  sumSquares: 'mc.quadratic-polynomial.sum-of-squares-factored',
  chunkPartial: 'mc.quadratic-polynomial.chunk-partially-substituted',
  quotient: 'mc.quadratic-polynomial.quotient-always-polynomial',
  degMult: 'mc.quadratic-polynomial.degree-of-product-multiplied',
  constNotPoly: 'mc.quadratic-polynomial.closure-means-same-degree',
  bothSides: 'mc.trig-functions.works-both-sides-to-true-statement',
  nonSep: 'mc.expressions.chooses-non-separating-test-value',
  exception: 'mc.reasoning-language.counterexample-as-exception',
  circular: 'mc.geometric-proof.circular-reasoning',
  recompute: 'mc.fraction-ops.recomputes-without-locating-invalid-renaming',
  finalAnswer: 'mc.reasoning-language.judges-work-by-final-answer',
  onlyChecked: 'mc.geometric-proof.all-limited-to-checked-examples',
  multExps: 'mc.exponents-roots.product-of-powers-multiplies-exponents',
  unlike: 'mc.expressions.combines-unlike-terms',
  unlikePos: 'mc.integers.unlike-signs-product-positive',
  negFirst: 'mc.integers.distribute-negative-first-term-only',
  baseTimesExp: 'mc.exponents-roots.power-as-base-times-exponent',
} as const;

// ---------- pictures (what the page draws; `reveal` is answer-side and hidden from the oracle) ----------
/** a product box: the terms of factor a down the left, of factor b across the top; `pre` = board lines first
 *  (an earlier product, for three factors); cells: none (the solve fills them) or all */
export interface BoxPic { a: P; b: P; cells: 'none' | 'all'; ask?: [number, number][]; pre?: string[] }
/** the area square of (a + b)²: side parts (TeX), the four pieces (TeX), b's share of the side, asked pieces */
export interface AreaPic { a: string; b: string; cells: [string, string, string, string]; share: number; ask?: number[] }
/** numbered lines on a slate (TeX), with an optional word label per line (Left side, Step 1, ...) */
export interface ChainPic { lines: string[]; labels?: string[] }
export type IdPicture = { box?: BoxPic; area?: AreaPic; chain?: ChainPic; reveal?: { bad?: number; lines?: string[] } };
export interface IdItem extends Item { picture?: IdPicture }
export type Gen = (R: () => number, n: number, sg?: string) => IdItem;

// ---------- builders ----------
export interface Opt { t: string; ok?: boolean; mc?: string; say: string }
export type Base = Omit<IdItem, 'input' | 'choices' | 'answer' | 'check'>;
/** thrown when the random numbers made an unfair item; retry() rolls again */
export class Reroll extends Error {}
export function retry(R: () => number, make: () => IdItem): IdItem {
  for (let i = 0; i < 80; i++) { try { return make(); } catch (e) { if (!(e instanceof Reroll)) throw e; } }
  throw new Error('retry: 80 rerolls');
}
/** a choice item: options shuffled (or kept in order), exactly one right, distinct texts */
export function choiceItem(R: () => number, base: Base, opts: Opt[], o: { min?: number; keep?: boolean } = {}): IdItem {
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
/** expression options: a wrong one that expands to the same polynomial as the right one (or a kept one) is dropped */
export interface ExOpt { e: Ex; mc?: string; say: string; text?: string }
export function exChoice(R: () => number, base: Base, right: ExOpt, wrongs: ExOpt[], o: { min?: number; max?: number } = {}): IdItem {
  const show = (x: ExOpt) => x.text ?? exHtml(x.e);
  const P0 = ex(right.e), kept: { o: ExOpt; p: P }[] = [];
  for (const w of wrongs) {
    const pw = ex(w.e);
    if (equalP(pw, P0) || show(w) === show(right)) continue;
    if (kept.some(k => equalP(k.p, pw) || show(k.o) === show(w))) continue;
    if (kept.length < (o.max ?? 3)) kept.push({ o: w, p: pw });
  }
  return choiceItem(R, base, [{ t: show(right), ok: true, say: right.say }, ...kept.map(k => ({ t: show(k.o), mc: k.o.mc, say: k.o.say }))], { min: o.min ?? 3 });
}
export const near = (a: number, b: number) => Math.abs(a - b) < 1e-9;
export function numItem(base: Omit<IdItem, 'input' | 'answer' | 'check'>, a: number, check: (v: number) => Verdict): IdItem {
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
export function pairItem(base: Omit<IdItem, 'input' | 'answer' | 'check'>, x: number, y: number, check: (a: number, b: number) => Verdict): IdItem {
  return {
    ...base, input: 'pair', answer: { kind: 'pair', x, y },
    check: (r: Response) => (r.kind === 'pair' && Number.isFinite(r.x) && Number.isFinite(r.y) ? check(r.x, r.y) : { ok: false, say: 'Fill in both boxes.' }),
  };
}
/** a nonzero whole number in [lo, hi] */
export function nz(R: () => number, lo: number, hi: number): number { for (;;) { const v = int(R, lo, hi); if (v !== 0) return v; } }
/** a whole number in [lo, hi] other than the given ones */
export function other(R: () => number, lo: number, hi: number, not: number[]): number { for (;;) { const v = int(R, lo, hi); if (!not.includes(v)) return v; } }
/** two letters for a general identity (a and b, m and n, p and q, x and y) */
export const LETTERS: readonly [string, string][] = [['a', 'b'], ['c', 'd'], ['m', 'n'], ['p', 'q'], ['s', 't'], ['u', 'v'], ['x', 'y']];
