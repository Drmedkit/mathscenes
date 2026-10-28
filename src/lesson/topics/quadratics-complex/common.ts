// common.ts: what the practice families of "Quadratics with complex solutions" share: misconception ids, the picture
// data the page draws (a parabola on the x-y plane, the roots on the complex plane, a column of worked lines), and the
// item builders with exact checks. Every choice list goes through ONE helper (`keyed`) that drops a wrong choice whose
// VALUE equals the right one (the same root set written another way, the same quadratic times a factor, the same
// complex number), so no distractor is secretly right. Pure: no DOM.
import { type Item, type Response, type Verdict, int, shuffle } from '../../runtime/item';
import { ans, endOnChoice } from '../../runtime/explain';
import { type Cx, type NR, II, MINUS, cxHtml, nrH, qVal, qH } from './qc';

// ---------- misconception ids (all in math-curriculum-essentials/misconceptions.json) ----------
export const MC = {
  dropsI: 'mc.advanced-algebra.drops-i-from-root-of-negative',
  rootNegReal: 'mc.advanced-algebra.root-of-negative-as-negative-real',
  iUnder: 'mc.advanced-algebra.i-under-the-radical',
  plusMinus: 'mc.exponents-roots.principal-root-as-plus-minus',
  dismiss: 'mc.advanced-algebra.dismisses-non-real-numbers',
  realsNot: 'mc.advanced-algebra.reals-not-complex',
  oneComplex: 'mc.quadratic-polynomial.negative-discriminant-one-complex-solution',
  noSolution: 'mc.quadratic-polynomial.no-solution-vs-no-real',
  onlyPos: 'mc.quadratic-polynomial.only-positive-root',
  zeroSign: 'mc.quadratic-polynomial.wrong-sign-zero-factor',
  stops: 'mc.advanced-algebra.stops-before-a-plus-bi-form',
  selTerm: 'mc.expressions.divides-a-selected-numerator-term-only',
  useB: 'mc.quadratic-polynomial.formula-uses-b-instead-of-negative-b',
  productRule: 'mc.advanced-algebra.product-rule-for-negative-radicands',
  rounded: 'mc.estimation.rounded-value-treated-as-exact',
  oneTerm: 'mc.expressions.divides-only-one-term-of-numerator',
  imagOnly: 'mc.expressions.divides-only-imaginary-numerator-term',
  signSlip: 'mc.quadratic-polynomial.formula-sign-slips',
  discAdd: 'mc.quadratic-polynomial.discriminant-subtraction-as-addition',
  zeroNone: 'mc.quadratic-polynomial.discriminant-zero-no-solution',
  realZero: 'mc.quadratic-polynomial.every-quadratic-has-a-real-zero',
  repeated: 'mc.quadratic-polynomial.repeated-root-two-solutions',
  cancels: 'mc.rational-radical.cancels-terms-not-factors',
  abcFirst: 'mc.quadratic-polynomial.abc-before-standard-form',
  methodNumbers: 'mc.estimation.method-not-chosen-from-numbers',
  lastMethod: 'mc.reasoning-language.last-practiced-method-for-everything',
  realOnly: 'mc.advanced-algebra.checks-only-real-part',
  i2Plus: 'mc.advanced-algebra.i-squared-as-plus-one',
  partByPart: 'mc.expressions.multiplies-sums-part-by-part',
  failedArg: 'mc.geometric-proof.failed-argument-as-disproof',
  opposites: 'mc.advanced-algebra.nonreal-roots-are-opposites',
  conjBoth: 'mc.advanced-algebra.conjugate-negates-wrong-part',
  conjReal: 'mc.advanced-algebra.conjugate-negates-real-only',
  examples: 'mc.reasoning-language.examples-as-proof',
  anyConj: 'mc.advanced-algebra.any-conjugate-pair-solves',
  needReal: 'mc.advanced-algebra.conjugate-pairs-need-real-coefficients',
  oneFactor: 'mc.advanced-algebra.quadratic-from-one-complex-root',
  noSolError: 'mc.linear-equations.no-solution-means-error',
  domainAll: 'mc.functions-concept.context-domain-all-reals',
} as const;

// ---------- pictures (what the page draws; `reveal` is answer-side and comes in at the solve) ----------
/** a parabola y = s0·x² + s1·x + s2 on the x-y plane (window [min, max, step] per axis); the vertex dot and the
 *  dashed axis of symmetry show from the start when `vertex`; `hline` is a target height (a model: "does it reach 30
 *  feet?"); `reveal` names the vertex or marks the x-intercepts at the solve */
export interface GraphPic {
  s: [number, number, number]; x: [number, number, number]; y: [number, number, number];
  xName?: string; yName?: string; lo?: number; hi?: number;
  vertex?: boolean; hline?: { y: number; name: string };
  /** the curve (and target line) come in at the solve: the graph would give the answer away */ late?: boolean;
  reveal?: { vertexName?: string; xints?: number[] };
}
/** a point on the complex plane at (real part, imaginary part); `arrow` draws it from 0 */
export interface PP { key: string; at: [number, number]; name?: string; col?: string; open?: boolean }
/** the complex plane: the given points, a dashed vertical line at real part `vline` (the shared real part −b/2a);
 *  `reveal` brings in more points (the answer) at the solve */
export interface RootsPic { x: [number, number]; y: [number, number]; step: number; given: PP[]; vline?: number; reveal?: { pts?: PP[]; vline?: number } }
/** worked lines (TeX), numbered on a slate: a supplied computation to audit; `bad` = the first wrong line (0 = none) */
export interface LinesPic { lines: string[]; reveal?: { bad: number } }
/** completing the square as an area (completing-the-square's CompleteSquare): x² + 2h·x, the corner h² */
export interface SquarePic { h: number }
export type QPicture = { graph?: GraphPic; roots?: RootsPic; lines?: LinesPic; square?: SquarePic };
export interface QItem extends Item { picture?: QPicture }
export type Gen = (R: () => number, n: number, sg?: string) => QItem;

// ---------- builders ----------
export interface Opt { t: string; ok?: boolean; mc?: string; say: string; /** the VALUE the option names (a canonical key); same key as the right one = dropped */ key?: string }
export type Base = Omit<QItem, 'input' | 'choices' | 'answer' | 'check'>;
/** thrown when the random numbers made an unfair item; retry() rolls again */
export class Reroll extends Error {}
export function retry<T>(make: () => T): T {
  for (let i = 0; i < 120; i++) { try { return make(); } catch (e) { if (!(e instanceof Reroll)) throw e; } }
  throw new Error('retry: 120 rerolls');
}
/** THE choice helper: options shuffled (or kept in order), exactly one right; a wrong option with the same text, or
 *  the same VALUE key as the right option or as an earlier kept option, is dropped (never a secretly right choice);
 *  at most `max` wrong options are kept */
export function keyed(R: () => number, base: Base, opts: Opt[], o: { min?: number; max?: number; keep?: boolean } = {}): QItem {
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
/** non-real roots typed as x = [a] ± [b] i: the order is fixed by the form; b may be typed negative (a ± (−b)i is the
 *  same pair); a slip matches its (a, |b|); swapped boxes get their own hint */
export interface PmSlip { re: number; im: number; mc?: string; say: string }
export function pmPair(base: Omit<QItem, 'input' | 'answer' | 'check' | 'pairLead' | 'pairOp' | 'pairTail'>, x: NR, okSay: string, slips: PmSlip[], hint: string, lead = '<i>x</i> ='): QItem {
  if (x.m !== 1) throw new Error('pmPair: radical part');
  const a = qVal(x.re), b = qVal(x.im);
  return {
    ...base, input: 'pair', pairLead: lead, pairOp: '±', pairTail: II, answer: { kind: 'pair', x: a, y: b },
    check: (r: Response): Verdict => {
      if (r.kind !== 'pair' || !Number.isFinite(r.x) || !Number.isFinite(r.y)) return { ok: false, say: `Fill in both boxes: the real part, then the number in front of ${II}.` };
      const y = Math.abs(r.y);
      if (near(r.x, a) && near(y, b)) return { ok: true, say: okSay };
      const s = slips.find(sl => !(near(sl.re, a) && near(Math.abs(sl.im), b)) && near(r.x, sl.re) && near(y, Math.abs(sl.im)));
      if (s) return { ok: false, mc: s.mc, say: s.say };
      if (near(r.x, b) && near(y, Math.abs(a)) && !near(a, b)) return { ok: false, say: `Those two are swapped: the first box is the real part, the second the number in front of ${II}.` };
      if (near(y, 0)) return { ok: false, say: `The roots are not real here, so the number in front of ${II} is not 0.` };
      return { ok: false, say: hint };
    },
  };
}
/** a complex number typed as [a] + [b] i */
export interface CxSlip { z: Cx; mc?: string; say: string }
export function cxPair(base: Omit<QItem, 'input' | 'answer' | 'check' | 'pairLead' | 'pairOp' | 'pairTail'>, z: Cx, okSay: string, slips: CxSlip[], hint: string, lead = ''): QItem {
  const a = qVal(z.re), b = qVal(z.im);
  return {
    ...base, input: 'pair', pairLead: lead, pairOp: '+', pairTail: II, answer: { kind: 'pair', x: a, y: b },
    check: (r: Response): Verdict => {
      if (r.kind !== 'pair' || !Number.isFinite(r.x) || !Number.isFinite(r.y)) return { ok: false, say: 'Fill in both boxes: the real part, then the imaginary part.' };
      if (near(r.x, a) && near(r.y, b)) return { ok: true, say: okSay };
      const s = slips.find(sl => !(near(qVal(sl.z.re), a) && near(qVal(sl.z.im), b)) && near(r.x, qVal(sl.z.re)) && near(r.y, qVal(sl.z.im)));
      if (s) return { ok: false, mc: s.mc, say: s.say };
      if (near(r.x, b) && near(r.y, a) && !near(a, b)) return { ok: false, say: 'Those two are swapped: the first box is the real part, the second the imaginary part.' };
      return { ok: false, say: hint };
    },
  };
}
/** two numbers typed in a fixed frame (x² + [b]x + [c]) */
export function twoNum(base: Omit<QItem, 'input' | 'answer' | 'check' | 'pairLead' | 'pairOp' | 'pairTail'>, a: number, b: number, frame: { lead: string; op: string; tail: string },
  okSay: string, slips: { x: number; y: number; mc?: string; say: string }[], hint: string): QItem {
  return {
    ...base, input: 'pair', pairLead: frame.lead, pairOp: frame.op, pairTail: frame.tail, answer: { kind: 'pair', x: a, y: b },
    check: (r: Response): Verdict => {
      if (r.kind !== 'pair' || !Number.isFinite(r.x) || !Number.isFinite(r.y)) return { ok: false, say: 'Fill in both boxes.' };
      if (near(r.x, a) && near(r.y, b)) return { ok: true, say: okSay };
      const s = slips.find(sl => !(near(sl.x, a) && near(sl.y, b)) && near(r.x, sl.x) && near(r.y, sl.y));
      return s ? { ok: false, mc: s.mc, say: s.say } : { ok: false, say: hint };
    },
  };
}
export function numItem(base: Omit<QItem, 'input' | 'answer' | 'check'>, v: number, okSay: string, slips: { v: number; mc?: string; say: string }[], hint: string): QItem {
  return {
    ...base, input: 'num', answer: { kind: 'num', v },
    check: (r: Response) => {
      if (r.kind !== 'num' || !Number.isFinite(r.v)) return { ok: false, say: 'Type a number.' };
      if (near(r.v, v)) return { ok: true, say: okSay };
      const s = slips.find(x => !near(x.v, v) && near(x.v, r.v));
      return s ? { ok: false, mc: s.mc, say: s.say } : { ok: false, say: hint };
    },
  };
}
/** the last solution line of an x = a ± bi answer: both boxes marked (the steps card reads them) */
export const endPm = (x: NR) => `So <i>x</i> = ${nrH(x)}: real part ${ans(qH(x.re))}, and ${ans(qH(x.im))} in front of ${II}.`;
export const endZ = (z: Cx) => `So the value is ${cxHtml(z)}: real part ${ans(qH(z.re))}, imaginary part ${ans(qH(z.im))}.`;
export function nz(R: () => number, lo: number, hi: number): number { for (;;) { const v = int(R, lo, hi); if (v !== 0) return v; } }
export const pickOf = <T>(R: () => number, xs: readonly T[]): T => xs[Math.floor(R() * xs.length)]!;
export const s = (t: string) => `<b class="s">${t}</b>`;
export { ans, MINUS, II };
