// common.ts: what the practice families of "Radicals and rational exponents" share: misconception ids, the picture
// data the page draws, and the item builders (choice / number / fraction / pair) with exact checks. Pure: no DOM.
import { type Item, type Response, type Verdict, shuffle } from '../../runtime/item';
import { endOnChoice } from '../../runtime/explain';

// ---------- misconception ids (all in math-curriculum-essentials/misconceptions.json) ----------
export const MC = {
  everyPM: 'mc.exponents-roots.every-radical-as-plus-minus',
  indexMult: 'mc.exponents-roots.root-index-as-multiplier',
  sqrtNegNeg: 'mc.exponents-roots.square-root-of-negative-as-negative',
  oddNegUndef: 'mc.exponents-roots.odd-root-of-negative-undefined',
  baseTimesExp: 'mc.exponents-roots.power-as-base-times-exponent',
  swapped: 'mc.exponents-roots.rational-exponent-root-and-power-swapped',
  recipRootNegIndex: 'mc.exponents-roots.reciprocal-root-as-negative-index-power',
  negMakesNeg: 'mc.exponents-roots.negative-exponent-makes-negative',
  oneFactor: 'mc.exponents-roots.powers-only-one-product-factor',
  prodMult: 'mc.exponents-roots.product-of-powers-multiplies-exponents',
  addDen: 'mc.fraction-ops.adds-or-subtracts-denominators',
  quotDiv: 'mc.exponents-roots.quotient-divides-exponents',
  quotRev: 'mc.exponents-roots.quotient-exponent-subtraction-reversed',
  powAdd: 'mc.exponents-roots.power-of-power-adds-exponents',
  rootSum: 'mc.exponents-roots.distributes-root-over-sum',
  rootSelf: 'mc.exponents-roots.root-times-itself-not-radicand',
  denZero: 'mc.rational-radical.radical-denominator-zero-allowed',
  rootFirst: 'mc.exponents-roots.root-before-radicand-operations',
  noRoot: 'mc.rational-radical.extracts-factor-without-root',
  partial: 'mc.rational-radical.partial-radical-simplification',
  divIndex: 'mc.exponents-roots.root-as-dividing-by-index',
  dropRem: 'mc.rational-radical.drops-exponent-remainder',
  addRad: 'mc.exponents-roots.adds-radicands',
  unlikeTerms: 'mc.expressions.combines-unlike-terms',
  detached: 'mc.integers.minus-sign-detached-from-term',
  partialDist: 'mc.properties.partial-distribution',
  firstsLasts: 'mc.quadratic-polynomial.firsts-and-lasts-only',
  fnSum: 'mc.functions-concept.function-distributes-over-sum',
  conjDrop: 'mc.rational-radical.conjugate-product-drops-square',
  onePart: 'mc.rational-radical.one-part-times-form-of-one',
  ignoreIndex: 'mc.exponents-roots.ignores-root-index',
  coefDiv: 'mc.rational-radical.coefficient-divided-by-radicand',
  notSimplified: 'mc.rational-radical.unlike-radicals-not-simplified',
  outsideUnlike: 'mc.rational-radical.outside-factor-makes-unlike',
  notConj: 'mc.rational-radical.multiplies-by-denominator-not-conjugate',
  calcParen: 'mc.exponents-roots.calculator-exponent-without-parentheses',
  exactUnfinished: 'mc.rational-radical.exact-radical-not-finished',
  wrongFeature: 'mc.exponents-roots.rational-exponent-domain-from-wrong-feature',
  alwaysReal: 'mc.exponents-roots.negative-base-rational-powers-always-real',
  neverDefined: 'mc.exponents-roots.negative-base-powers-never-defined',
  noReversal: 'mc.linear-equations.no-reversal-for-negative',
  domainShift: 'mc.functions-concept.domain-wrong-under-transformation',
  strictOrZero: 'mc.rational-radical.radicand-domain-uses-strict-or-zero-condition',
  signOnly: 'mc.exponents-roots.rational-power-domain-from-exponent-sign-only',
  zeroZero: 'mc.exponents-roots.zero-to-the-zero-as-one',
  principalPM: 'mc.exponents-roots.principal-root-as-plus-minus',
  unneededAbs: 'mc.rational-radical.unneeded-absolute-value',
  sqrtX2: 'mc.exponents-roots.sqrt-of-x-squared-as-x',
  lawsAlways: 'mc.exponents-roots.exponent-laws-without-restrictions',
  rejectsAll: 'mc.exponents-roots.rejects-all-negative-base-exponent-laws',
  dropsRestriction: 'mc.rational-radical.drops-restriction-after-simplifying',
  andOr: 'mc.linear-equations.and-or-confused',
  ctxAll: 'mc.functions-concept.context-domain-all-reals',
  swapsBaseExp: 'mc.exponents-roots.swaps-base-and-exponent',
  pmOdd: 'mc.exponents-roots.plus-minus-on-odd-roots',
  minusPower: 'mc.exponents-roots.confuses-negative-power-notation',
  sameDomain: 'mc.exponents-roots.same-domain-for-even-and-odd-roots',
  allowsNeg: 'mc.rational-radical.allows-negative-even-radicand',
  dropsSign: 'mc.exponents-roots.cubing-loses-sign',
  examplesProof: 'mc.reasoning-language.examples-as-proof',
} as const;

// ---------- pictures (solution-side data under `reveal`, hidden from oracles) ----------
/** the exponent ladder: powers of a base at exponents k/n for k = lo..hi */
export interface LadderPic {
  base: string; n: number; lo: number; hi: number;
  known: { k: number; tex: string }[];
  ask?: number;
  /** brackets over runs of hops shown from the start (TeX label) */
  spans?: { from: number; to: number; tex: string }[];
  reveal: { values: { k: number; tex: string }[]; factor?: string };
}
/** prime-factor tiles under a radical: groups of n equal tiles leave as one tile */
export interface TilesPic { n: number; tiles: string[]; reveal: { groups: number[][]; out: string; inside: string } }
/** a domain question: y = (n-th root of (a x + b)), or 1 over it; the graph comes in the replay */
export interface DomPic { a: number; b: number; n: number; den?: boolean; pow?: [number, number]; reveal: { show: true } }
export interface RXItem extends Item { picture?: { ladder?: LadderPic; tiles?: TilesPic; dom?: DomPic; chain?: { lines: string[] } } }
export type Gen = (R: () => number, n: number, sg?: string) => RXItem;

// ---------- builders ----------
export interface Opt { t: string; ok?: boolean; mc?: string; say: string }
export type Base = Omit<RXItem, 'input' | 'choices' | 'answer' | 'check'>;
export function choiceItem(R: () => number, base: Base, opts: Opt[], keepOrder = false): RXItem {
  const o = keepOrder ? opts.slice() : shuffle(R, opts.slice());
  const i = o.findIndex(x => x.ok);
  if (i < 0 || o.filter(x => x.ok).length !== 1) throw new Error(`${base.family}: exactly one right choice`);
  if (new Set(o.map(x => x.t)).size !== o.length) throw new Error(`${base.family}: duplicate choices ${o.map(x => x.t).join(' | ')}`);
  return {
    ...base, input: 'choice', choices: o.map(x => x.t), answer: { kind: 'choice', i }, solution: endOnChoice(base.solution, o[i]!.t),
    check: (r: Response) => {
      if (r.kind !== 'choice' || !o[r.i]) return { ok: false, say: 'Pick one of the answers.' };
      const c = o[r.i]!;
      return { ok: !!c.ok, mc: c.mc, say: c.say };
    },
  };
}
/** distinct options (keeps the first of equal texts) */
export const uniq = (o: Opt[]) => o.filter((x, i) => o.findIndex(y => y.t === x.t) === i);
export function numItem(base: Base, a: number, check: (v: number) => Verdict, unit = ''): RXItem {
  return { ...base, input: 'num', unit, answer: { kind: 'num', v: a }, check: (r: Response) => (r.kind === 'num' && Number.isFinite(r.v) ? check(r.v) : { ok: false, say: 'Type a number.' }) };
}
/** a fraction answer (whole + n/d); `sv` is the signed exact value typed (a minus sign in any box makes it negative) */
export function fracItem(base: Base, ans: [number, number], check: (p: number, d: number) => Verdict, unit = ''): RXItem {
  const [p, d] = ans;
  const w = Math.floor(p / d), rem = p - w * d;
  return {
    ...base, input: 'frac', unit, answer: { kind: 'frac', w: rem === 0 ? p / d : w, n: rem, d: rem === 0 ? 1 : d },
    check: (r: Response) => {
      if (r.kind !== 'frac') return { ok: false, say: 'Type a fraction.' };
      const { w: W, n: N, d: D } = r;
      if (![W, N, D].every(Number.isFinite) || D === 0 || !Number.isInteger(N) || !Number.isInteger(D) || !Number.isInteger(W)) return { ok: false, say: 'Type whole numbers in the boxes, and a denominator that is not 0.' };
      const neg = W < 0 || N < 0 || D < 0;
      const top = Math.abs(W) * Math.abs(D) + Math.abs(N), bot = Math.abs(D);
      return check(neg ? -top : top, bot);
    },
  };
}
export function pairItem(base: Base, x: number, y: number, lead: string, op: string, tail: string, check: (x: number, y: number) => Verdict): RXItem {
  return {
    ...base, input: 'pair', pairLead: lead, pairOp: op, pairTail: tail, answer: { kind: 'pair', x, y },
    check: (r: Response) => (r.kind === 'pair' && Number.isFinite(r.x) && Number.isFinite(r.y) ? check(r.x, r.y) : { ok: false, say: 'Fill in both boxes.' }),
  };
}
export const near = (a: number, b: number, e = 1e-6) => Math.abs(a - b) < e;
