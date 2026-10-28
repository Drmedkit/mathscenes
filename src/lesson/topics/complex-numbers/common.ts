// common.ts: what the practice families of "Complex numbers" share: misconception ids, the picture data the page
// draws (the complex plane, a product box, the number-set map, a column of worked lines), and the item builders
// (choice / pair / number) with exact checks. Choice lists go through ONE helper that drops a wrong choice equal in
// value to the right one (or to another wrong one), so no distractor is secretly right. Pure: no DOM.
import { type Item, type Response, type Verdict, int, shuffle } from '../../runtime/item';
import { ans, endOnChoice } from '../../runtime/explain';
import { type Cx, II, eq, html, near, pairIs, qH, re, im } from './cx';

// ---------- misconception ids (all in math-curriculum-essentials/misconceptions.json) ----------
export const MC = {
  iIsMinusOne: 'mc.advanced-algebra.i-equals-negative-one',
  iVariable: 'mc.advanced-algebra.i-as-variable',
  evenPowNeg: 'mc.integers.even-power-of-negative-negative',
  rootNegReal: 'mc.advanced-algebra.root-of-negative-as-negative-real',
  plusMinus: 'mc.exponents-roots.principal-root-as-plus-minus',
  dropsI: 'mc.advanced-algebra.drops-i-from-root-of-negative',
  iUnder: 'mc.advanced-algebra.i-under-the-radical',
  unsignedB: 'mc.advanced-algebra.imaginary-part-not-signed-coefficient',
  dismiss: 'mc.advanced-algebra.dismisses-non-real-numbers',
  realsNot: 'mc.advanced-algebra.reals-not-complex',
  coefSum: 'mc.advanced-algebra.complex-equality-by-coefficient-sum',
  combines: 'mc.advanced-algebra.combines-real-and-imaginary-terms',
  firstOnly: 'mc.integers.distribute-negative-first-term-only',
  iTimesI: 'mc.advanced-algebra.i-times-i-as-i',
  stops: 'mc.advanced-algebra.stops-before-a-plus-bi-form',
  i2Plus: 'mc.advanced-algebra.i-squared-as-plus-one',
  firstsLasts: 'mc.quadratic-polynomial.firsts-and-lasts-only',
  productRule: 'mc.advanced-algebra.product-rule-for-negative-radicands',
  cycle2: 'mc.advanced-algebra.powers-of-i-cycle-wrong',
  conjBoth: 'mc.advanced-algebra.conjugate-negates-wrong-part',
  conjReal: 'mc.advanced-algebra.conjugate-negates-real-only',
  divFirst: 'mc.expressions.divides-only-first-numerator-term',
  oneSide: 'mc.rational-radical.one-part-times-form-of-one',
  conjNum: 'mc.advanced-algebra.conjugate-of-numerator',
  termByTerm: 'mc.expressions.divides-sum-by-sum-term-by-term',
  rejectsUnfinished: 'mc.expressions.rejects-equivalent-non-final-forms',
  repeatCheck: 'mc.reasoning-language.check-by-repeating-same-steps',
  changesAnswer: 'mc.reasoning-language.changes-answer-without-locating-error',
  forgetsZero: 'mc.advanced-algebra.sum-of-squares-forgets-zero',
  examples: 'mc.reasoning-language.examples-as-proof',
  looksRight: 'mc.reasoning-language.accepts-answer-that-looks-right',
  surface: 'mc.fractions-concept.surface-check-as-proof',
  factorDivision: 'mc.advanced-algebra.conjugate-factor-described-as-division',
  oneChanges: 'mc.fraction-ops.multiplying-by-one-changes-fraction',
} as const;

// ---------- pictures (what the page draws; `reveal` is answer-side and hidden from the oracle) ----------
/** a point / arrow on the complex plane at real part at[0], imaginary part at[1]; an arrow runs from `from` (default 0) */
export interface PP { key: string; at: [number, number]; name?: string; col?: string; arrow?: boolean; from?: [number, number]; open?: boolean }
/** the complex plane: a square-celled window, the given points and arrows; `reveal` comes in at the solve (the answer,
 *  a quarter turn from a point, an arrow moved tip to tail) */
export interface PlanePic {
  x: [number, number]; y: [number, number]; step?: number;
  given: PP[];
  reveal?: { pts?: PP[]; turn?: { from: [number, number]; quarters: number; scale?: number } };
}
/** a product box: factor a down the left, factor b across the top, terms as [coefficient, power of i]; at the solve the
 *  cells fill, the i² cells turn real (i² = −1) and the parts collect */
export interface BoxPic { a: [number, number][]; b: [number, number][] }
/** the number sets: the reals (counting ⊂ whole ⊂ integers ⊂ rational, irrational beside) inside the complex numbers,
 *  with the non-real numbers (purely imaginary inside) beside them; `others` are numbers already in place; the asked
 *  number drops in at the solve (`reveal.at` = its region) */
export type Region = 'counting' | 'whole' | 'integer' | 'rational' | 'irrational' | 'imag' | 'nonreal';
export interface SetsPic { token: string; others: { tex: string; at: Region }[]; reveal?: { at: Region } }
/** worked lines (TeX), numbered on a slate: a supplied computation to audit */
export interface LinesPic { lines: string[]; reveal?: { bad: number; fix?: string } }
/** the graph of y = x² + k on an x-y plane (why x² = −k has no real solution) */
export interface GraphPic { k: number }
export type CxPicture = { plane?: PlanePic; box?: BoxPic; sets?: SetsPic; lines?: LinesPic; graph?: GraphPic };
export interface CxItem extends Item { picture?: CxPicture }
export type Gen = (R: () => number, n: number, sg?: string) => CxItem;

// ---------- builders ----------
export interface Opt { t: string; ok?: boolean; mc?: string; say: string }
export type Base = Omit<CxItem, 'input' | 'choices' | 'answer' | 'check'>;
/** thrown when the random numbers made an unfair item; retry() rolls again */
export class Reroll extends Error {}
export function retry(make: () => CxItem): CxItem {
  for (let i = 0; i < 80; i++) { try { return make(); } catch (e) { if (!(e instanceof Reroll)) throw e; } }
  throw new Error('retry: 80 rerolls');
}
/** a choice item: options shuffled (or kept in order), exactly one right, distinct texts */
export function choiceItem(R: () => number, base: Base, opts: Opt[], o: { min?: number; keep?: boolean } = {}): CxItem {
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
/** complex-valued options: a wrong option EQUAL IN VALUE to the right one (or to an earlier wrong one) is dropped,
 *  whatever its text; `text` overrides the a + bi text (a product, an unfinished form) */
export interface CxOpt { z: Cx; mc?: string; say: string; text?: string }
export function cxChoice(R: () => number, base: Base, right: CxOpt, wrongs: CxOpt[], o: { min?: number; max?: number } = {}): CxItem {
  const show = (x: CxOpt) => x.text ?? html(x.z);
  const kept: CxOpt[] = [];
  for (const w of wrongs) {
    if (eq(w.z, right.z) || show(w) === show(right)) continue;
    if (kept.some(k => eq(k.z, w.z) || show(k) === show(w))) continue;
    if (kept.length < (o.max ?? 3)) kept.push(w);
  }
  return choiceItem(R, base, [{ t: show(right), ok: true, say: right.say }, ...kept.map(w => ({ t: show(w), mc: w.mc, say: w.say }))], { min: o.min ?? 3 });
}
/** a + bi typed as two boxes: [a] + [b] i */
export const PAIR = { pairLead: '', pairOp: '+', pairTail: II } as const;
export interface Slip { z: Cx; mc?: string; say: string }
/** an a + bi answer in two boxes: right, else a slip with the same value (not equal to the answer), else swapped parts,
 *  else the general hint */
export function cxPair(base: Omit<CxItem, 'input' | 'answer' | 'check'>, z: Cx, okSay: string, slips: Slip[], hint: string, swapSay = 'Those two are swapped: the first box is the real part a, the second the imaginary part b.'): CxItem {
  return {
    ...PAIR, ...base, input: 'pair', answer: { kind: 'pair', x: re(z), y: im(z) },
    check: (r: Response): Verdict => {
      if (r.kind !== 'pair' || !Number.isFinite(r.x) || !Number.isFinite(r.y)) return { ok: false, say: 'Fill in both boxes: the real part, then the imaginary part.' };
      if (pairIs(r.x, r.y, z)) return { ok: true, say: okSay };
      const s = slips.find(x => !eq(x.z, z) && pairIs(r.x, r.y, x.z));
      if (s) return { ok: false, mc: s.mc, say: s.say };
      if (near(r.x, im(z)) && near(r.y, re(z))) return { ok: false, say: swapSay };
      return { ok: false, say: hint };
    },
  };
}
export function numItem(base: Omit<CxItem, 'input' | 'answer' | 'check'>, a: number, check: (v: number) => Verdict): CxItem {
  return { ...base, input: 'num', answer: { kind: 'num', v: a }, check: (r: Response) => (r.kind === 'num' && Number.isFinite(r.v) ? check(r.v) : { ok: false, say: 'Type a number.' }) };
}
/** a number check: right, else the first matching slip, else the hint */
export function numCheck(right: number, okSay: string, slips: { v: number; mc?: string; say: string }[], hint: string): (v: number) => Verdict {
  return v => {
    if (near(v, right)) return { ok: true, say: okSay };
    const s = slips.find(x => !near(x.v, right) && near(x.v, v));
    return s ? { ok: false, mc: s.mc, say: s.say } : { ok: false, say: hint };
  };
}
/** the last solution line of an a + bi answer: both parts marked (the steps card reads them) */
export const endZ = (z: Cx) => `So the answer is ${html(z)}: real part ${ans(qH(z.re))}, imaginary part ${ans(qH(z.im))}.`;
/** a nonzero whole number in [lo, hi] */
export function nz(R: () => number, lo: number, hi: number): number { for (;;) { const v = int(R, lo, hi); if (v !== 0) return v; } }
export function other(R: () => number, lo: number, hi: number, not: number[]): number { for (;;) { const v = int(R, lo, hi); if (!not.includes(v)) return v; } }
export const pickOf = <T>(R: () => number, xs: readonly T[]): T => xs[Math.floor(R() * xs.length)]!;
/** a fraction in HTML whose top / bottom get brackets when they have more than one term (the plain-text reading
 *  keeps the grouping: (7 + 5i)/(2 − 2i)) */
export const frx = (a: string, b: string) => {
  const w = (t: string) => (/\s[+−-]\s/.test(t.replace(/<[^>]+>/g, '')) ? `(${t})` : t);
  return `<span class="fr"><span>${w(a)}</span><span>${w(b)}</span></span>`;
};
export { ans };
