// common.ts: what every family of "Similar triangles" shares: misconception ids, the choice / number / fraction
// helpers (exactly one right choice; a wrong choice that means the same as the answer is dropped), letters, text bits.
// Pure: no DOM.
import { type GFItem, type Gen, type Opt, choiceItem, fitted as kitFitted, numItem, pick, r, shuffle } from '../geometry-foundations/kit';
import type { Response, Verdict } from '../../runtime/item';
import { fr } from '../../runtime/item';
import { ans } from '../../runtime/explain';
import { pickLetters } from '../triangle-congruence/tri';

export const MC = {
  special: 'mc.shapes.special-case-excluded-from-class',
  aaListed: 'mc.angles.aa-compares-listed-angles-only',
  allParts: 'mc.transformations.demands-all-parts-for-triangles',
  aaaCong: 'mc.transformations.equal-angles-prove-congruence',
  additive: 'mc.ratio-rate.additive-keep-difference',
  oneRatio: 'mc.transformations.checks-one-side-ratio',
  listOrder: 'mc.ratio-rate.matches-sides-by-list-order',
  ssa: 'mc.transformations.ssa-accepted-as-criterion',
  validSSA: 'mc.transformations.valid-ssa-cases-rejected',
  noCritNot: 'mc.transformations.no-criterion-means-not-similar',
  sidesEqual: 'mc.transformations.similar-sides-set-equal',
  wholeFig: 'mc.geometric-proof.whole-figure-coincidence-asserted',
  appearance: 'mc.geometric-proof.diagram-appearance-as-given',
  circular: 'mc.geometric-proof.circular-reasoning',
  badK: 'mc.transformations.accepts-scale-factor-inconsistent-with-sides',
  failedSearch: 'mc.transformations.failed-search-proves-impossible',
  polyAngles: 'mc.transformations.equal-angles-make-polygons-similar',
  vertexOrder: 'mc.transformations.statement-vertex-order-ignored',
  byPosition: 'mc.transformations.matches-parts-by-position-or-letters',
  largerOver: 'mc.ratio-rate.scale-factor-larger-over-smaller',
  inconsistent: 'mc.ratio-rate.proportion-inconsistent-order',
  partWhole: 'mc.transformations.part-segment-for-whole-side',
  altAny: 'mc.transformations.altitude-similarity-without-right-triangle',
  altTwo: 'mc.transformations.altitude-hypotenuse-similarity-misapplied',
  farSeg: 'mc.right-triangles-trig.leg-with-far-segment',
  arithMean: 'mc.right-triangles-trig.arithmetic-not-geometric-mean',
  partHyp: 'mc.right-triangles-trig.part-used-as-whole-hypotenuse',
  looks: 'mc.transformations.similarity-judged-by-appearance',
  partialDist: 'mc.properties.partial-distribution',
  noHyp: 'mc.geometric-proof.cites-theorem-without-checking-hypotheses',
  noReason: 'mc.geometric-proof.step-without-reason',
  ignoreCorr: 'mc.transformations.part-equalities-ignore-correspondence',
  angleK: 'mc.transformations.angle-equality-determines-scale-factor',
  cancelTerms: 'mc.rational-radical.cancels-terms-not-factors',
  converse: 'mc.geometric-proof.converse-assumed-true',
  validityTruth: 'mc.geometric-proof.validity-judged-by-truth',
  units: 'mc.measurement-units.arithmetic-on-unconverted-unit-numerals',
  crossPair: 'mc.ratio-rate.cross-pairs-objects-in-similarity-proportion',
  wrongPair: 'mc.angles.cites-wrong-pair-name',
  beforeEst: 'mc.geometric-proof.uses-fact-before-established',
  intermediate: 'mc.reasoning-language.reports-intermediate-result',
} as const;

export const NAMES = ['Lena', 'Omar', 'Priya', 'Kai', 'Sofia', 'Mateo', 'Ava', 'Noah', 'Jada', 'Eli', 'Mia', 'Ravi', 'Zoe', 'Theo', 'Nia', 'Sam'];
/** the course's choice item; its closing "So: ..." line is left to endOnChoice (it marks the right choice) */
export function choice(R: () => number, b: Parameters<typeof choiceItem>[1], opts: Opt[], fixed = false): GFItem {
  return choiceItem(R, { ...b, solution: b.solution.filter(l => !/^So: /.test(l)) }, opts, fixed);
}
export { numItem, pick, r, shuffle, ans, fr };
/** the kit's fitted (retries until every figure lays out readably), and a maker may also throw 'retry' when its
 *  random numbers do not work out (a triangle that does not exist, a length that is not tidy) */
export function fitted<T extends GFItem>(fam: string, make: () => T, tries = 200): T {
  return kitFitted(fam, () => {
    for (let i = 0; i < 400; i++) { try { return make(); } catch (e) { if ((e as Error).message !== 'retry') throw e; } }
    throw new Error(`${fam}: no item`);
  }, tries);
}
export type { GFItem, Gen, Opt };

/** a fraction answer (a scale factor): any equal value is right (2/3, 4/6, a whole number, a terminating decimal) */
export interface FracWrong { v: number; mc?: string; say: string }
export function fracItem(base: Omit<GFItem, 'input' | 'answer' | 'check'>, n: number, d: number, wrong: FracWrong[], right: string, general: string): GFItem {
  const v = n / d;
  const answer: Response = d === 1 ? { kind: 'frac', w: n, n: 0, d: 1 } : { kind: 'frac', w: 0, n, d };
  return {
    ...base, input: 'frac', answer,
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

/** letters for two triangles (6 distinct, alphabetical, never I, L, O) */
export function names2(R: () => number): [string, string] { const s = pickLetters(R, 6); return [s.slice(0, 3), s.slice(3)]; }
/** a segment name with combining overlines (survives plain text) */
export const segN = (s: string) => [...s].map(ch => ch + '̅').join('');
export const triN = (s: string) => `△${s}`;
export const triT = (s: string) => `\\triangle ${s}`;
export const simH = (a: string, b: string) => `△${a} ~ △${b}`;
export const simT = (a: string, b: string) => `\\triangle ${a} \\sim \\triangle ${b}`;
export const angN = (s: string) => `∠${s}`;
export const deg = (x: number) => `${x}°`;
/** a ratio of two lengths for the panel */
export const rt = (a: string | number, b: string | number) => fr(a, b);
export const A = (s: string | number) => `<b class="a">${s}</b>`;
export const B = (s: string | number) => `<b class="b">${s}</b>`;
export const S = (s: string | number) => `<b class="s">${s}</b>`;
