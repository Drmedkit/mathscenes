// common.ts: what every family of "Right triangle trigonometry" shares: misconception ids, the choice helper (exactly
// one right choice; a wrong choice whose VALUE equals the answer is dropped, so sin A / cos B or opposite / adjacent
// swaps that coincide at 45° never show up as "wrong"), the rounded-number helper (the precision is always stated; a
// value near a .x5 tie makes the maker retry), names and text bits. Pure: no DOM.
import { type Base, type GFItem, type Opt, choiceItem, fitted as kitFitted, pick, r, shuffle } from '../geometry-foundations/kit';
import type { Response, Verdict } from '../../runtime/item';
import { fr } from '../../runtime/item';
import { ans } from '../../runtime/explain';
import { PLACE, fx, rd, rnd } from './trig';

export const MC = {
  hypAdj: 'mc.right-triangles-trig.hypotenuse-as-adjacent',
  byPos: 'mc.right-triangles-trig.opposite-adjacent-by-position',
  examples: 'mc.reasoning-language.examples-as-proof',
  size: 'mc.right-triangles-trig.ratio-depends-on-size',
  inverted: 'mc.right-triangles-trig.inverted-ratio',
  fx: 'mc.functions-concept.f-of-x-as-multiplication',
  units: 'mc.right-triangles-trig.trig-ratio-given-units',
  tanBounded: 'mc.trig-functions.tangent-bounded-like-sine',
  pullOut: 'mc.trig-functions.pulls-coefficient-out-of-argument',
  tanLikeCos: 'mc.right-triangles-trig.tangent-like-cosine',
  cofNoComp: 'mc.right-triangles-trig.cofunction-without-complementarity',
  cofMisuse: 'mc.right-triangles-trig.cofunction-misuse',
  mode: 'mc.trig-functions.wrong-calculator-angle-mode',
  trusts: 'mc.estimation.trusts-calculator-display',
  keyOrder: 'mc.trig-functions.calculator-key-order-ignores-entry-syntax',
  early: 'mc.decimals.intermediate-precision-always-invalid',
  habit: 'mc.right-triangles-trig.ratio-choice-by-habit',
  second: 'mc.right-triangles-trig.ratio-introduces-second-unknown',
  wrongWay: 'mc.right-triangles-trig.solves-ratio-wrong-way',
  noSize: 'mc.estimation.accepts-result-without-size-check',
  forward: 'mc.right-triangles-trig.forward-function-for-angle',
  reciprocal: 'mc.right-triangles-trig.inverse-as-reciprocal',
  ratioAsAngle: 'mc.right-triangles-trig.ratio-as-angle-or-length',
  oneEq: 'mc.right-triangles-trig.one-ratio-equation-solves-all-parts',
  trigAll: 'mc.right-triangles-trig.trig-for-everything',
  swapped: 'mc.right-triangles-trig.special-triangle-sides-swapped',
  unanchored: 'mc.right-triangles-trig.30-60-90-coefficients-unanchored',
  halves: 'mc.right-triangles-trig.halves-isosceles-hypotenuse',
  memorize: 'mc.right-triangles-trig.memorizes-exact-values',
  additive: 'mc.ratio-rate.additive-keep-difference',
  falseTriple: 'mc.right-triangles-trig.false-pythagorean-triples',
  omitsHalf: 'mc.area-perimeter.omits-factors-from-regular-polygon-area',
  radiusApo: 'mc.area-perimeter.uses-radius-as-apothem',
  fullCentral: 'mc.right-triangles-trig.apothem-uses-full-central-angle',
  arithOk: 'mc.reasoning-language.correct-arithmetic-validates-setup',
  rangeMode: 'mc.trig-functions.output-range-validates-angle-mode',
  roleSwap: 'mc.right-triangles-trig.context-role-swap',
  wrongRef: 'mc.right-triangles-trig.angle-from-wrong-reference',
  digits: 'mc.estimation.decimal-length-guarantees-accuracy',
  depBottom: 'mc.right-triangles-trig.depression-at-bottom',
  linArea: 'mc.measurement-units.linear-factor-for-area',
  unitDim: 'mc.measurement-units.wrong-unit-dimension',
} as const;

export const NAMES = ['Lena', 'Omar', 'Priya', 'Kai', 'Sofia', 'Mateo', 'Ava', 'Noah', 'Jada', 'Eli', 'Mia', 'Ravi', 'Zoe', 'Theo', 'Nia', 'Sam'];
export { pick, r, shuffle, ans, fr };
export type { GFItem, Opt, Base };
export type Gen = (R: () => number, n: number, sg?: string) => GFItem;

/** the kit's fitted (every figure lays out readably), and a maker may throw 'retry' when its numbers do not work out */
export function fitted<T extends GFItem>(fam: string, make: () => T, tries = 200): T {
  return kitFitted(fam, () => {
    for (let i = 0; i < 600; i++) { try { return make(); } catch (e) { if ((e as Error).message !== 'retry') throw e; } }
    throw new Error(`${fam}: no item`);
  }, tries);
}

/** a choice; `v` = the value a choice stands for (a wrong choice equal in value to the right one is dropped, and wrong
 *  choices equal to each other are kept once) */
export interface VOpt extends Opt { v?: number }
export function choice(R: () => number, base: Base, opts: VOpt[], fixed = false): GFItem {
  const right = opts.find(o => o.ok);
  const keep: VOpt[] = [];
  for (const o of opts) {
    if (!o.ok) {
      if (right?.v !== undefined && o.v !== undefined && Math.abs(o.v - right.v) < 1e-9) continue;
      if (o.v !== undefined && keep.some(k => !k.ok && k.v !== undefined && Math.abs(k.v - o.v!) < 1e-9)) continue;
      if (keep.some(k => k.t === o.t) || o.t === right?.t) continue;
    }
    keep.push(o);
  }
  if (keep.length < 2) throw new Error('retry');
  return choiceItem(R, { ...base, solution: base.solution.filter(l => !/^So: /.test(l)) }, keep.map(({ v: _v, ...o }) => o), fixed);
}

/** a number to a stated precision: `exact` is the full-precision value, the answer is it rounded to p places.
 *  Wrong values are the exact values of typical slips (rounded the same way). */
export interface NumWrong { v: number; mc?: string; say: string }
export function numR(base: Omit<GFItem, 'input' | 'answer' | 'check'>, exact: number, p: number, wrong: NumWrong[], right: string, general: string): GFItem {
  const a = rnd(exact, p);
  const W = wrong.map(w => ({ ...w, v: rd(w.v, p) })).filter(w => Number.isFinite(w.v) && Math.abs(w.v - a) > 1e-9);
  const sol = base.solution.some(s => s.includes('class="s"')) ? base.solution : [...base.solution, `So the answer is ${ans(fx(a, p))}.`];
  return {
    ...base, solution: sol, input: 'num', answer: { kind: 'num', v: a },
    check: (resp: Response): Verdict => {
      if (resp.kind !== 'num' || !Number.isFinite(resp.v)) return { ok: false, say: 'Type a number.' };
      if (Math.abs(resp.v - a) < 1e-9) return { ok: true, say: right };
      const w = W.find(x => Math.abs(x.v - resp.v) < 1e-9);
      if (w) return { ok: false, mc: w.mc, say: w.say };
      if (Math.abs(resp.v - exact) < 1.01 * 10 ** -p) return { ok: false, say: `So close: round to ${PLACE[p]}, and only at the very end.` };
      return { ok: false, say: general };
    },
  };
}
/** an exact whole or terminating number (no rounding) */
export function numX(base: Omit<GFItem, 'input' | 'answer' | 'check'>, a: number, wrong: NumWrong[], right: string, general: string): GFItem {
  const W = wrong.filter(w => Number.isFinite(w.v) && Math.abs(w.v - a) > 1e-9);
  const sol = base.solution.some(s => s.includes('class="s"')) ? base.solution : [...base.solution, `So the answer is ${ans(fmtN(a))}.`];
  return {
    ...base, solution: sol, input: 'num', answer: { kind: 'num', v: a },
    check: (resp: Response): Verdict => {
      if (resp.kind !== 'num' || !Number.isFinite(resp.v)) return { ok: false, say: 'Type a number.' };
      if (Math.abs(resp.v - a) < 1e-9) return { ok: true, say: right };
      const w = W.find(x => Math.abs(x.v - resp.v) < 1e-6);
      return w ? { ok: false, mc: w.mc, say: w.say } : { ok: false, say: general };
    },
  };
}
const fmtN = (x: number) => String(Math.round(x * 1e6) / 1e6);
/** a fraction answer: any equal value is right (6/10 for 3/5) */
export function fracR(base: Omit<GFItem, 'input' | 'answer' | 'check'>, n: number, d: number, wrong: NumWrong[], right: string, general: string): GFItem {
  const v = n / d;
  const sol = base.solution.some(s => s.includes('class="s"')) ? base.solution : [...base.solution, `So the answer is ${ans(`${n}/${d}`)}.`];
  return {
    ...base, solution: sol, input: 'frac', answer: { kind: 'frac', w: 0, n, d },
    check: (resp: Response): Verdict => {
      if (resp.kind !== 'frac') return { ok: false, say: 'Type a fraction.' };
      const { w, n: N, d: D } = resp;
      if (![w, N, D].every(Number.isFinite) || D === 0) return { ok: false, say: 'Type a fraction with a denominator that is not zero.' };
      const x = w + N / D;
      if (Math.abs(x - v) < 1e-9) return { ok: true, say: right };
      const hit = wrong.find(o => Math.abs(o.v - x) < 1e-9 && Math.abs(o.v - v) > 1e-9);
      return hit ? { ok: false, mc: hit.mc, say: hit.say } : { ok: false, say: general };
    },
  };
}
/** the article for a word or number as it is SPOKEN: an 8, an 11, an 18, an 80, an 8.5, an 800, an octagon;
 *  a 1, a 100, a unit, a one-way */
export function article(w: string | number): 'a' | 'an' {
  const t = String(w).replace(/<[^>]+>/g, '').trim();
  const num = /^(\d[\d,]*)/.exec(t);
  if (num) {
    const ip = num[1]!.replace(/,/g, '');
    if (ip.startsWith('8')) return 'an';                                   // eight, eighteen, eighty, eight hundred
    // eleven / eighteen (and eleven thousand, eighteen thousand, ...): 11 and 18 heading a group of digits
    if ((ip.startsWith('11') || ip.startsWith('18')) && ip.length % 3 === 2) return 'an';
    return 'a';
  }
  if (/^(uni|use|usu|uti|one|once|eu)/i.test(t)) return 'a';
  if (/^(hour|honest|honor)/i.test(t)) return 'an';
  return /^[aeiou]/i.test(t) ? 'an' : 'a';
}
/** 'a 12' / 'an 18', and the capitalized form at the start of a sentence */
export const aN = (w: string | number) => `${article(w)} ${w}`;
export const AN = (w: string | number) => `${article(w) === 'an' ? 'An' : 'A'} ${w}`;
/** a quoted claim */
export const q = (s: string) => `“${s}”`;
export const A = (s: string | number) => `<b class="a">${s}</b>`;
export const B = (s: string | number) => `<b class="b">${s}</b>`;
export const S = (s: string | number) => `<b class="s">${s}</b>`;
export const deg = (x: number | string) => `${x}°`;
/** a segment name with combining overlines (survives plain text) */
export const segN = (s: string) => [...s].map(ch => ch + '̅').join('');
export const angN = (s: string) => `∠${s}`;
/** plain text of a ratio a/b */
export const rt = (a: string | number, b: string | number) => `${a}/${b}`;
/** a card line (the slate where a picture would be) */
export const card = (...lines: string[]) => ({ card: { lines } });
