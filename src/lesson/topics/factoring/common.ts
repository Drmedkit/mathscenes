// common.ts: what the practice families of "Factoring" share: misconception ids, the picture data the page draws
// (a product box read backwards: the cells are given, the sides are the answer), and the item builders with exact
// checks. Every choice list goes through choiceItem: a wrong option whose value equals the right one for every x is
// dropped (checked at seven whole x), unless the family marks it `same` on purpose (a correct but incomplete
// factorization, a right expression with a wrong unit). Pure: no DOM.
import { type Item, type Response, type Verdict, int, shuffle } from '../../runtime/item';
import { endOnChoice } from '../../runtime/explain';
import { type Poly, deg, mul, termTex } from './fx';

// ---------- misconception ids (all in math-curriculum-essentials/misconceptions.json) ----------
export const MC = {
  sumOfProducts: 'mc.quadratic-polynomial.sum-of-products-called-factored',
  vsSolving: 'mc.quadratic-polynomial.factoring-vs-solving',
  changesValue: 'mc.properties.rewriting-changes-value',
  discards: 'mc.quadratic-polynomial.factoring-discards-factor',
  termsAsSides: 'mc.quadratic-polynomial.area-terms-as-sides',
  firstLast: 'mc.quadratic-polynomial.first-last-only-check',
  oneTerm: 'mc.expressions.factors-out-of-one-term-only',
  stops: 'mc.quadratic-polynomial.stops-before-complete',
  divExp: 'mc.exponents-roots.quotient-divides-exponents',
  zeroSelf: 'mc.expressions.leaves-zero-for-factor-over-itself',
  noCond: 'mc.linear-equations.omits-nonzero-divisor-condition',
  hiddenOne: 'mc.quadratic-polynomial.drop-the-hidden-one',
  highPow: 'mc.quadratic-polynomial.gcf-highest-power',
  negFirst: 'mc.integers.distribute-negative-first-term-only',
  divFirst: 'mc.quadratic-polynomial.divide-first-term-only',
  dropsNonPoly: 'mc.quadratic-polynomial.division-drops-nonpolynomial-terms',
  cancelTerms: 'mc.rational-radical.cancels-terms-not-factors',
  sumUnchecked: 'mc.quadratic-polynomial.trinomial-factors-sum-unchecked',
  rolesSwapped: 'mc.quadratic-polynomial.sum-product-roles-swapped',
  minusOpposite: 'mc.quadratic-polynomial.minus-sign-forces-opposite-factor-signs',
  largerReversed: 'mc.quadratic-polynomial.opposite-sign-factor-larger-sign-reversed',
  dosSquared: 'mc.quadratic-polynomial.dos-as-squared-binomial',
  sumSquares: 'mc.quadratic-polynomial.sum-of-squares-factored',
  pstUnchecked: 'mc.quadratic-polynomial.perfect-square-unchecked',
  ignoresA: 'mc.quadratic-polynomial.nonmonic-ignores-a',
  primeEarly: 'mc.quadratic-polynomial.declares-prime-too-early',
  chunkTermwise: 'mc.quadratic-polynomial.squares-compound-chunk-termwise',
  noRoots: 'mc.quadratic-polynomial.no-integer-factors-no-roots',
  zeroRem: 'mc.quadratic-polynomial.division-requires-zero-remainder',
  wholeQuot: 'mc.mul-div.forces-whole-number-quotient',
  examples: 'mc.reasoning-language.examples-as-proof',
  productComplete: 'mc.quadratic-polynomial.product-check-proves-complete',
  fixesDims: 'mc.quadratic-polynomial.area-fixes-dimensions',
  areaPerim: 'mc.area-perimeter.confuses-area-with-perimeter',
  unitDim: 'mc.measurement-units.wrong-unit-dimension',
} as const;

// ---------- pictures (what the page draws; `reveal` is answer-side and hidden from the oracle) ----------
export interface Side { tex: string; deg: number }
/** the product box read backwards: the given cells (TeX; '' = a cell held back as '?' until the solve) */
export interface FBoxPic { cells: string[][]; deg: number[][]; noteL?: string; noteT?: string }
/** answer side: the box's sides, every cell, cells that cancel (struck at the solve), the factored form (TeX) */
export interface FReveal { left?: Side[]; top?: Side[]; cells?: string[][]; strike?: [number, number][]; tex?: string }
export type FacPicture = { box?: FBoxPic; reveal?: FReveal };
/** ex (hidden from oracles): target = the value of the polynomial the item gives, for the self-check in choiceItem */
export interface FacItem extends Item { picture?: FacPicture; ex?: { target?: (x: number) => number } }
export type Gen = (R: () => number, n: number, sg?: string) => FacItem;

/** a box for left × top. show: 'all' cells given, 'corners' (first and last cell only: the middle is the answer),
 *  'none'. Middle cells that add to 0 are struck at the solve. */
export function boxOf(left: Poly, top: Poly, show: 'all' | 'corners' | 'none', tex: string, notes: { noteL?: string; noteT?: string } = {}): FacPicture {
  const cells = left.map(a => top.map(b => mul([a], [b])[0]!));
  const R = left.length, C = top.length;
  const shown = (r: number, c: number) => show === 'all' || (show === 'corners' && ((r === 0 && c === 0) || (r === R - 1 && c === C - 1)));
  const strike: [number, number][] = [];
  if (R === 2 && C === 2) {
    const a = cells[0]![1]!, b = cells[1]![0]!;
    if (deg(a) === deg(b) && a.x === b.x && a.c.p * b.c.q === -b.c.p * a.c.q) strike.push([0, 1], [1, 0]);
  }
  return {
    box: { cells: cells.map((r, i) => r.map((t, j) => (shown(i, j) ? termTex(t) : ''))), deg: cells.map(r => r.map(deg)), ...notes },
    reveal: { left: left.map(t => ({ tex: termTex(t), deg: deg(t) })), top: top.map(t => ({ tex: termTex(t), deg: deg(t) })), cells: cells.map(r => r.map(termTex)), strike: strike.length ? strike : undefined, tex },
  };
}

// ---------- builders ----------
/** an option: its text (HTML), whether it is right, its misconception, what the kid hears, and its value as a
 *  function of x (for dropping wrong options that are secretly equal to the right one) */
export interface Opt { t: string; ok?: boolean; mc?: string; say: string; ev?: (x: number) => number; same?: boolean }
export type Base = Omit<FacItem, 'input' | 'choices' | 'answer' | 'check'>;
/** thrown when the random numbers made an unfair item; retry() rolls again */
export class Reroll extends Error {}
export function retry(R: () => number, make: () => FacItem): FacItem {
  for (let i = 0; i < 80; i++) { try { return make(); } catch (e) { if (!(e instanceof Reroll)) throw e; } }
  throw new Error('retry: 80 rerolls');
}
const XS = [2, 3, 5, 7, -3, -4, 11];
/** two values as functions of x agree at every test x where both are defined */
export function sameFn(f: (x: number) => number, g: (x: number) => number): boolean {
  let n = 0;
  for (const x of XS) {
    const a = f(x), b = g(x);
    if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
    n++;
    if (Math.abs(a - b) > 1e-7 * Math.max(1, Math.abs(a))) return false;
  }
  return n >= 4;
}
/** a choice item: wrong options equal to the right one (by value) or repeating a text are dropped, at most `max`
 *  wrong ones kept; shuffled; exactly one right */
export function choiceItem(R: () => number, base: Base, opts: Opt[], o: { min?: number; max?: number; keep?: boolean; target?: (x: number) => number } = {}): FacItem {
  const right = opts.filter(x => x.ok);
  if (right.length !== 1) throw new Error(`${base.family}: exactly one right option`);
  const r = right[0]!;
  // the right option must multiply back to the polynomial the item gives (a self-check on every generated item)
  const target = o.target ?? base.ex?.target;
  if (target && (!r.ev || !sameFn(r.ev, target))) throw new Error(`${base.family}: the right option is not equal to the given polynomial`);
  const list: Opt[] = [r];
  for (const w of opts) {
    if (w.ok) continue;
    if (list.some(x => x.t === w.t)) continue;
    if (!w.same && w.ev && r.ev && sameFn(w.ev, r.ev)) continue;
    if (!w.same && w.ev && list.some(x => x !== r && x.ev && !x.same && sameFn(x.ev, w.ev!))) continue;
    if (list.length - 1 < (o.max ?? 3)) list.push(w);
  }
  if (list.length < (o.min ?? 3)) throw new Reroll();
  const sh = o.keep ? list : shuffle(R, list.slice());
  const i = sh.indexOf(r);
  return {
    ...base, input: 'choice', choices: sh.map(x => x.t), answer: { kind: 'choice', i }, solution: endOnChoice(base.solution, r.t),
    check: (resp: Response): Verdict => {
      if (resp.kind !== 'choice' || !sh[resp.i]) return { ok: false, say: 'Pick one of the answers.' };
      const c = sh[resp.i]!;
      return { ok: !!c.ok, mc: c.mc, say: c.say };
    },
  };
}
export const near = (a: number, b: number) => Math.abs(a - b) < 1e-9;
export function numItem(base: Omit<FacItem, 'input' | 'answer' | 'check'>, a: number, check: (v: number) => Verdict): FacItem {
  return { ...base, input: 'num', answer: { kind: 'num', v: a }, check: (r: Response) => (r.kind === 'num' && Number.isFinite(r.v) ? check(r.v) : { ok: false, say: 'Type a number.' }) };
}
/** a number check: right, else the first matching slip, else the general hint */
export function numCheck(right: number, okSay: string, slips: { v: number; mc?: string; say: string }[], hint: string): (v: number) => Verdict {
  return v => {
    if (near(v, right)) return { ok: true, say: okSay };
    const s = slips.find(x => !near(x.v, right) && near(x.v, v));
    return s ? { ok: false, mc: s.mc, say: s.say } : { ok: false, say: hint };
  };
}
/** two numbers, smaller first (the prompt says so); the other order is accepted too */
export function pairItem(base: Omit<FacItem, 'input' | 'answer' | 'check'>, a: number, b: number, okSay: string, slip: (x: number, y: number) => { mc?: string; say: string } | null, hint: string): FacItem {
  const [x, y] = a <= b ? [a, b] : [b, a];
  return {
    ...base, input: 'pair', answer: { kind: 'pair', x, y },
    check: (r: Response): Verdict => {
      if (r.kind !== 'pair' || !Number.isFinite(r.x) || !Number.isFinite(r.y)) return { ok: false, say: 'Fill in both boxes.' };
      if ((near(r.x, x) && near(r.y, y)) || (near(r.x, y) && near(r.y, x))) return { ok: true, say: okSay };
      const s = slip(r.x, r.y);
      return s ? { ok: false, ...s } : { ok: false, say: hint };
    },
  };
}
export function nz(R: () => number, lo: number, hi: number): number { for (;;) { const v = int(R, lo, hi); if (v !== 0) return v; } }
export function other(R: () => number, lo: number, hi: number, not: number[]): number { for (;;) { const v = int(R, lo, hi); if (!not.includes(v)) return v; } }
export const X = '<i>x</i>';
export const sq = `${X}<sup>2</sup>`;
/** a signed whole number for HTML, with a real minus */
export const nH = (v: number) => (v < 0 ? '−' + Math.abs(v) : String(v));
/** a signed number after an operator: 3 + (−5), never 3 + −5 */
export const pn = (v: number) => (v < 0 ? `(−${Math.abs(v)})` : String(v));
/** " + 3" / " − 3" after a term */
export const sgn = (v: number) => (v < 0 ? ` − ${Math.abs(v)}` : ` + ${v}`);
export const sgnT = (v: number) => (v < 0 ? ` - ${Math.abs(v)}` : ` + ${v}`);
