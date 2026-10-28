// common.ts: what the practice families of "Polynomial division" share: misconception ids, the picture data the page
// draws (the long-division layout, the synthetic tableau, the reverse area box), and the item builders with exact
// checks. Every choice list goes through ONE helper (`keyed`, the quadratics-complex pattern): a wrong option whose
// VALUE key equals the right one (the same polynomial, the same (Q, R), the same number) is dropped, so no distractor
// is secretly right. Pair items can accept both orders (`free`). Pure: no DOM.
import { type Item, type Response, type Verdict, int, shuffle } from '../../runtime/item';
import { ans, endOnChoice } from '../../runtime/explain';
import type { Co, Q } from './pd';

// ---------- misconception ids (all in math-curriculum-essentials/misconceptions.json) ----------
export const MC = {
  remMisplaced: 'mc.quadratic-polynomial.remainder-misplaced',
  addsRem: 'mc.quadratic-polynomial.adds-remainder-to-quotient',
  stopsEarly: 'mc.quadratic-polynomial.division-stops-early',
  intRem: 'mc.quadratic-polynomial.integer-remainder-criteria-for-polynomials',
  termwise: 'mc.expressions.divides-sum-by-sum-term-by-term',
  noRestrict: 'mc.linear-equations.omits-nonzero-divisor-condition',
  divAgain: 'mc.quadratic-polynomial.divides-quotient-by-divisor-again',
  wholeQuot: 'mc.mul-div.forces-whole-number-quotient',
  firstEven: 'mc.quadratic-polynomial.first-step-even-means-factor',
  placeholder: 'mc.quadratic-polynomial.placeholder-zero-omitted',
  wrongPart: 'mc.quadratic-polynomial.quotient-term-wrong-divisor-part',
  negFirst: 'mc.integers.distribute-negative-first-term-only',
  addSub: 'mc.quadratic-polynomial.division-add-subtract-swapped',
  needZero: 'mc.quadratic-polynomial.division-requires-zero-remainder',
  stopsFirst: 'mc.quadratic-polynomial.division-stops-after-first-cancellation',
  ignoresLead: 'mc.quadratic-polynomial.quotient-ignores-divisor-leading-coefficient',
  rounded: 'mc.quadratic-polynomial.fraction-coefficients-rounded',
  pastStop: 'mc.quadratic-polynomial.division-past-stop',
  synthAny: 'mc.quadratic-polynomial.synthetic-for-any-divisor',
  zeroSign: 'mc.quadratic-polynomial.wrong-sign-zero-factor',
  minusDetached: 'mc.integers.minus-sign-detached-from-term',
  lastCol: 'mc.quadratic-polynomial.synthetic-final-column-omitted',
  recSlip: 'mc.quadratic-polynomial.synthetic-recurrence-slip',
  subtracts: 'mc.quadratic-polynomial.synthetic-subtracts-product',
  qDegree: 'mc.quadratic-polynomial.quotient-degree-wrong',
  remAsCoef: 'mc.quadratic-polynomial.synthetic-remainder-as-quotient-coefficient',
  trick: 'mc.quadratic-polynomial.synthetic-as-trick',
  unrelated: 'mc.quadratic-polynomial.synthetic-unrelated-to-long-division',
  uncompensated: 'mc.quadratic-polynomial.numerator-rewrite-adds-uncompensated-constant',
  cancelTerms: 'mc.rational-radical.cancels-terms-not-factors',
  shorter: 'mc.quadratic-polynomial.synthetic-required-because-shorter',
  looksRight: 'mc.reasoning-language.accepts-answer-that-looks-right',
  examples: 'mc.reasoning-language.examples-as-proof',
  notCompensated: 'mc.quadratic-polynomial.residual-not-compensated',
  memorized: 'mc.reasoning-language.memorized-rule-as-justification',
  dropsRestrict: 'mc.rational-radical.drops-restriction-after-simplifying',
  qrRoles: 'mc.quadratic-polynomial.quotient-remainder-roles',
  incomplete: 'mc.quadratic-polynomial.stops-before-complete',
} as const;

// ---------- pictures (what the page draws; `reveal` is answer-side and hidden from the oracle) ----------
/** the long-division layout of P ÷ D. `upto`: 'none' = nothing until the solve; 'frame' = the divisor and the
 *  dividend row (placeholders written); k = the first k cycles done (quotient terms, products, residuals);
 *  `tNext` = the quotient term of cycle k+1 is given too (supplied for a residual update) */
export interface LdPic { P: Co; D: Co; upto: 'none' | 'frame' | number; tNext?: boolean }
/** the synthetic tableau of P ÷ (x − c). `upto`: 'none' | 'frame' (c and the coefficient row) | k = the first k
 *  bottom entries (and their products); `ask` = the next bottom entry shows as '?' */
export interface SdPic { P: Co; /** absent when c is asked (then it is in reveal.c) */ c?: Q; upto: 'none' | 'frame' | number; ask?: boolean; /** c shows '?' (asked) */ cAsk?: boolean }
/** the reverse area box: the divisor's terms down the left (TeX), the partial products in the cells (TeX), the top
 *  side unknown ('?') until the solve */
export interface BoxPic { left: string[]; cells: string[][]; cols: number }
/** long division and the synthetic tableau of the same P ÷ (x − c), both complete, side by side */
export interface LinkPic { P: Co; c: Q }
export type PdPicture = { ld?: LdPic; sd?: SdPic; box?: BoxPic; link?: LinkPic; reveal?: { top?: string[]; c?: Q } };
export interface PdItem extends Item { picture?: PdPicture }
export type Gen = (R: () => number, n: number, sg?: string) => PdItem;

// ---------- builders ----------
export interface Opt { t: string; ok?: boolean; mc?: string; say: string; /** the VALUE the option names; same key as the right one = dropped */ key?: string }
export type Base = Omit<PdItem, 'input' | 'choices' | 'answer' | 'check'>;
/** thrown when the random numbers made an unfair item; retry() rolls again */
export class Reroll extends Error {}
export function retry<T>(make: () => T): T {
  for (let i = 0; i < 150; i++) { try { return make(); } catch (e) { if (!(e instanceof Reroll)) throw e; } }
  throw new Error('retry: 150 rerolls');
}
/** THE choice helper: exactly one right option; a wrong option with the same text, or the same VALUE key as the
 *  right option or an earlier kept option, is dropped (never a secretly right choice); at most `max` wrong options */
export function keyed(R: () => number, base: Base, opts: Opt[], o: { min?: number; max?: number; keep?: boolean } = {}): PdItem {
  const right = opts.filter(x => x.ok);
  if (right.length !== 1) throw new Error(`${base.family}: exactly one right choice`);
  const r = right[0]!;
  const list: Opt[] = [r];
  for (const x of opts) {
    if (x.ok) continue;
    if (list.some(k => k.t === x.t || (x.key !== undefined && k.key !== undefined && k.key === x.key))) continue;
    if (list.length - 1 < (o.max ?? 3)) list.push(x);
  }
  if (list.length < (o.min ?? 3)) throw new Reroll();
  const ordered = o.keep ? opts.filter(x => list.includes(x)) : shuffle(R, list.slice());
  const i = ordered.findIndex(x => x.ok);
  return {
    ...base, input: 'choice', choices: ordered.map(x => x.t), answer: { kind: 'choice', i }, solution: endOnChoice(base.solution, ordered[i]!.t),
    check: (res: Response) => {
      if (res.kind !== 'choice' || !ordered[res.i]) return { ok: false, say: 'Pick one of the answers.' };
      const c = ordered[res.i]!;
      return { ok: !!c.ok, mc: c.mc, say: c.say };
    },
  };
}
export const near = (a: number, b: number) => Math.abs(a - b) < 1e-9;
export interface Slip { v: number; mc?: string; say: string }
export function numItem(base: Omit<PdItem, 'input' | 'answer' | 'check'>, v: number, okSay: string, slips: Slip[], hint: string): PdItem {
  return {
    ...base, input: 'num', answer: { kind: 'num', v },
    check: (r: Response): Verdict => {
      if (r.kind !== 'num' || !Number.isFinite(r.v)) return { ok: false, say: 'Type a number.' };
      if (near(r.v, v)) return { ok: true, say: okSay };
      const s = slips.find(x => !near(x.v, v) && near(x.v, r.v));
      return s ? { ok: false, mc: s.mc, say: s.say } : { ok: false, say: hint };
    },
  };
}
export interface PairSlip { x: number; y: number; mc?: string; say: string }
/** two numbers in a frame (lead [x] op [y] tail); `free` = the order does not matter (two factors) */
export function pairItem(base: Omit<PdItem, 'input' | 'answer' | 'check'>, x: number, y: number, frame: { lead: string; op: string; tail?: string },
  okSay: string, slips: PairSlip[], hint: string, o: { free?: boolean } = {}): PdItem {
  const hit = (a: number, b: number, p: number, q: number) => (near(a, p) && near(b, q)) || (!!o.free && near(a, q) && near(b, p));
  return {
    ...base, input: 'pair', pairLead: frame.lead, pairOp: frame.op, pairTail: frame.tail ?? '', answer: { kind: 'pair', x, y },
    check: (r: Response): Verdict => {
      if (r.kind !== 'pair' || !Number.isFinite(r.x) || !Number.isFinite(r.y)) return { ok: false, say: 'Fill in both boxes.' };
      if (hit(r.x, r.y, x, y)) return { ok: true, say: okSay };
      const s = slips.find(sl => !hit(sl.x, sl.y, x, y) && hit(r.x, r.y, sl.x, sl.y));
      if (s) return { ok: false, mc: s.mc, say: s.say };
      if (!o.free && near(r.x, y) && near(r.y, x) && !near(x, y)) return { ok: false, say: 'Those two are swapped: check which box is which.' };
      return { ok: false, say: hint };
    },
  };
}
/** a nonzero whole number in [lo, hi] */
export function nz(R: () => number, lo: number, hi: number): number { for (;;) { const v = int(R, lo, hi); if (v !== 0) return v; } }
export function other(R: () => number, lo: number, hi: number, not: number[]): number { for (;;) { const v = int(R, lo, hi); if (!not.includes(v)) return v; } }
export const pickOf = <T>(R: () => number, xs: readonly T[]): T => xs[Math.floor(R() * xs.length)]!;
export { ans };
