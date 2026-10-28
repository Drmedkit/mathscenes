// common.ts: what the practice families of "Solving quadratics" share: misconception ids, the picture data the page
// draws, and the item builders (choice / number / fraction / pair) with exact checks. Pure: no DOM.
import { type Item, type Response, type Verdict, shuffle } from '../../runtime/item';
import { endOnChoice, ans } from '../../runtime/explain';
import { type Q, q, qEq } from './quad';
import { qOf } from '../number-properties/numbers';

// ---------- misconception ids (all in math-curriculum-essentials/misconceptions.json) ----------
export const MC = {
  sumsPart: 'mc.expressions.multiplies-sums-part-by-part',
  unchecked: 'mc.quadratic-polynomial.perfect-square-unchecked',
  incomplete: 'mc.quadratic-polynomial.completing-constant-from-incomplete-formula',
  wrongTerm: 'mc.quadratic-polynomial.cs-wrong-term',
  unbalanced: 'mc.quadratic-polynomial.cs-unbalanced',
  oneSide: 'mc.linear-equations.one-side-only',
  detached: 'mc.integers.minus-sign-detached-from-term',
  oneFactor: 'mc.exponents-roots.power-applied-to-one-factor-only',
  rounded: 'mc.quadratic-polynomial.fraction-coefficients-rounded',
  someTerms: 'mc.linear-equations.scales-only-some-terms',
  notDivA: 'mc.quadratic-polynomial.cs-not-dividing-a',
  selected: 'mc.expressions.divides-a-selected-numerator-term-only',
  negSub: 'mc.integers.negative-substitution-without-grouping',
  noFactor: 'mc.quadratic-polynomial.no-integer-factors-no-roots',
  habit: 'mc.estimation.method-not-chosen-from-numbers',
  addDen: 'mc.fraction-ops.adds-or-subtracts-denominators',
  scaledWhole: 'mc.fraction-ops.numerator-scaled-by-whole-new-denominator',
  rewrite: 'mc.fraction-ops.algebraic-common-denominator-rewrite-unavailable',
  unrelated: 'mc.quadratic-polynomial.formula-unrelated-to-cs',
  negALoses: 'mc.quadratic-polynomial.negative-a-loses-branch',
  zeroNone: 'mc.quadratic-polynomial.discriminant-zero-no-solution',
  negIrr: 'mc.quadratic-polynomial.negative-disc-irrational',
  repeatTwo: 'mc.quadratic-polynomial.repeated-root-two-solutions',
  noReal: 'mc.quadratic-polynomial.no-solution-vs-no-real',
  roundedExact: 'mc.estimation.rounded-value-treated-as-exact',
  gapError: 'mc.estimation.rounding-gap-treated-as-error',
  borderOnce: 'mc.area-perimeter.adds-border-width-once',
  priceQty: 'mc.quadratic-polynomial.price-quantity-tradeoff',
  discarded: 'mc.reasoning-language.valid-solution-discarded-without-feasibility-check',
  notInterpreted: 'mc.reasoning-language.no-solution-not-interpreted',
  onlyPos: 'mc.quadratic-polynomial.only-positive-root',
  ctxAll: 'mc.functions-concept.context-domain-all-reals',
  noCond: 'mc.linear-equations.omits-nonzero-divisor-condition',
  boundary: 'mc.linear-equations.boundary-only-solution',
  noZerosNone: 'mc.quadratic-polynomial.ineq-no-zeros-no-solution',
  rootSum: 'mc.exponents-roots.distributes-root-over-sum',
  forgetsH: 'mc.quadratic-polynomial.forgets-to-add-h',
  bNotNeg: 'mc.quadratic-polynomial.formula-uses-b-instead-of-negative-b',
  signSlip: 'mc.quadratic-polynomial.formula-sign-slips',
  abcFirst: 'mc.quadratic-polynomial.abc-before-standard-form',
  shifted: 'mc.quadratic-polynomial.coefficients-shifted',
  discAdd: 'mc.quadratic-polynomial.discriminant-subtraction-as-addition',
  swapped: 'mc.quadratic-polynomial.between-outside-swapped',
  likeLinear: 'mc.quadratic-polynomial.quad-ineq-like-linear',
  pmBound: 'mc.quadratic-polynomial.square-inequality-uses-plus-minus-bound',
  everyReal: 'mc.quadratic-polynomial.every-quadratic-has-a-real-zero',
  pmValue: 'mc.exponents-roots.principal-root-as-plus-minus',
} as const;

// ---------- pictures (answer-side data under `reveal`) ----------
/** the completing-the-square area picture (positive h only); `steps` are on from the start, `reveal` adds the rest */
export interface SqPic {
  hT: string; stripT: string; halfT: string; cornerT: string; sideT?: string;
  steps: ('sq' | 'strip' | 'halve' | 'corner' | 'fill' | 'side')[];
  /** the corner's number stays hidden until the replay */ hideCorner?: boolean;
  reveal: { steps: ('sq' | 'strip' | 'halve' | 'corner' | 'fill' | 'side')[]; halfT?: string; stripT?: string };
}
/** a parabola y = ax² + bx + c on the kit Plane; `marks` = x-intercepts to mark in the replay; `band` = the solution
 *  set of an inequality on the x-axis (replay); `level` = a horizontal line y = level (projectiles) */
export interface PlanePic {
  a: number; b: number; c: number; x: [number, number, number]; y: [number, number, number];
  /** the graph is on from the start (graph items) or only in the replay */ shown: boolean;
  reveal: { marks: number[]; band?: { lo: number; hi: number; loClosed: boolean; hiClosed: boolean }[]; level?: number };
}
export interface QItem extends Item { picture?: { sq?: SqPic; plane?: PlanePic } }
export type Gen = (R: () => number, n: number, sg?: string) => QItem;

// ---------- builders ----------
export interface Opt { t: string; ok?: boolean; mc?: string; say: string }
export type Base = Omit<QItem, 'input' | 'choices' | 'answer' | 'check'>;
/** keep the first of options with equal text */
export const uniq = (o: Opt[]) => o.filter((x, i) => o.findIndex(y => y.t === x.t) === i);
export function choiceItem(R: () => number, base: Base, opts: Opt[], keepOrder = false): QItem {
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
export const near = (a: number, b: number, e = 1e-6) => Math.abs(a - b) < e;
export function numItem(base: Base, a: number, check: (v: number) => Verdict, unit = ''): QItem {
  return { ...base, input: 'num', unit, answer: { kind: 'num', v: a }, check: (r: Response) => (r.kind === 'num' && Number.isFinite(r.v) ? check(r.v) : { ok: false, say: 'Type a number.' }) };
}
/** the exact value of a fraction response (whole may be a decimal or negative; a minus in any box makes it negative) */
export function fracOf(r: Response): Q | null {
  if (r.kind !== 'frac') return null;
  const { w, n, d } = r;
  if (![w, n, d].every(Number.isFinite) || d === 0) return null;
  const neg = w < 0 || n < 0 || d < 0;
  let W: Q;
  try { W = qOf(Math.abs(w)); } catch {
    // a long decimal in the whole box (−1.2222… for −11/9): the fraction it is, if its denominator is small
    let hit: Q | null = null;
    for (let den = 1; den <= 1000 && !hit; den++) { const p = Math.round(Math.abs(w) * den); if (Math.abs(p / den - Math.abs(w)) < 1e-9) hit = q(p, den); }
    if (!hit) return null;
    W = hit;
  }
  if (!Number.isInteger(n) || !Number.isInteger(d)) return null;
  const v = q(W[0] * Math.abs(d) + W[1] * Math.abs(n), W[1] * Math.abs(d));
  return neg ? q(-v[0], v[1]) : v;
}
/** a fraction answer; `check` gets the exact value typed */
export function fracItem(base: Base, a: Q, check: (v: Q) => Verdict, unit = ''): QItem {
  return {
    ...base, input: 'frac', unit, answer: a[1] === 1 ? { kind: 'frac', w: a[0], n: 0, d: 1 } : { kind: 'frac', w: 0, n: a[0], d: a[1] },
    check: (r: Response) => { const v = fracOf(r); return v ? check(v) : { ok: false, say: 'Type whole numbers in the boxes, and a denominator that is not 0.' }; },
  };
}
export const qIs = (v: Q, a: Q) => qEq(v, a);
/** two number boxes; `either` = the two values may come in either order (x = □ or x = □) */
export function pairItem(base: Base, x: number, y: number, lead: string, op: string, tail: string, check: (x: number, y: number) => Verdict): QItem {
  return {
    ...base, input: 'pair', pairLead: lead, pairOp: op, pairTail: tail, answer: { kind: 'pair', x, y },
    check: (r: Response) => (r.kind === 'pair' && Number.isFinite(r.x) && Number.isFinite(r.y) ? check(r.x, r.y) : { ok: false, say: 'Fill in both boxes.' }),
  };
}
/** the two typed values are the set {a, b} (either order) */
export const isSet = (x: number, y: number, a: number, b: number) => (near(x, a) && near(y, b)) || (near(x, b) && near(y, a));
export { ans };
