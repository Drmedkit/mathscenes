// common.ts: what every practice family of "Using probability to make decisions" shares: the item type with its
// pictures (DecPic specs the page draws), misconception ids (math-curriculum-essentials/misconceptions.json), money
// formatting, the exact maths of a payoff distribution (E, SD, P(loss)), and the item makers. EVERY choice list goes
// through ONE helper, `ch` = quadratics-complex `keyed` (read-only reuse): a wrong choice whose key equals the right
// one (the same option, the same value) is dropped, so no distractor is secretly right. Pure: no DOM.
import { type Response, type Verdict, fr, fracValue, int, pick, same, shuffle } from '../../runtime/item';
import { ans } from '../../runtime/explain';
import { keyed, Reroll, retry, type Opt } from '../quadratics-complex/common';
import { aD, big, dec, money, noTie, round } from '../expected-value/common';
import type { Item } from '../../runtime/item';
import type { PPic } from './DecPic';

export { ans, aD, big, dec, fr, int, noTie, pick, Reroll, retry, round, shuffle };
export type { Opt };

export interface Pic { [k: string]: unknown; pics: PPic[]; weights?: number[] }
export interface PItem extends Item { picture?: Pic }
export type Gen = (R: () => number, n: number, sg?: string) => PItem;
export type Base = Omit<PItem, 'input' | 'choices' | 'answer' | 'check'>;

export const MC = {
  chanceAsChoice: 'mc.probability.chance-outcome-as-controllable-choice',
  omitsBranch: 'mc.probability.omits-alternative-branch-outcomes',
  sellerView: 'mc.finance.seller-perspective-payoff',
  revenue: 'mc.finance.revenue-treated-as-profit',
  onlyOnWins: 'mc.finance.subtracts-ticket-cost-only-on-wins',
  costTwice: 'mc.finance.cost-subtracted-twice',
  equiprob: 'mc.probability.equiprobability-bias',
  noChange: 'mc.probability.no-change-outcome-omitted',
  positiveFair: 'mc.probability.positive-chance-implies-fair-selection',
  units: 'mc.measurement-units.combine-mismatched-units',
  dedEvery: 'mc.finance.deductible-subtracted-in-every-branch',
  unweighted: 'mc.statistics.unweighted-average',
  wrongDir: 'mc.probability.fair-price-wrong-direction',
  guaranteed: 'mc.probability.ev-as-guaranteed-outcome',
  fairMisread: 'mc.probability.fair-game-misread',
  fairHalf: 'mc.probability.fair-means-half-wins',
  byPrize: 'mc.probability.chooses-by-prize-or-entry-cost',
  direction: 'mc.probability.cost-gain-direction-ignored',
  independence: 'mc.probability.assumes-independence-by-default',
  exactParam: 'mc.statistics.sample-statistic-as-exact-parameter',
  notOne: 'mc.probability.probabilities-not-summing-to-one',
  unqualified: 'mc.reasoning-language.recommendation-without-assumption-qualification',
  coinsFirst: 'mc.finance.coinsurance-before-deductible',
  coversAll: 'mc.finance.warranty-covers-everything',
  oneFee: 'mc.finance.judges-cost-by-one-visible-fee',
  cap: 'mc.finance.ignores-stated-cap',
  equalMeans: 'mc.probability.equal-means-equal-distributions',
  riskPrize: 'mc.probability.risk-from-prize-or-loss-possibility',
  linked: 'mc.probability.ignores-linked-outcomes-in-long-run',
  divEv: 'mc.probability.diversification-raises-ev',
  sdBetter: 'mc.probability.higher-payoff-sd-always-better',
  gambler: 'mc.probability.gamblers-fallacy',
  forces: 'mc.probability.repetition-alone-forces-average-to-ev',
  dismisses: 'mc.probability.dismisses-expected-value',
  mode: 'mc.probability.ev-as-most-likely-value',
  inputsExact: 'mc.probability.uncertain-inputs-treated-as-exact',
  singleJudges: 'mc.probability.single-outcome-judges-probability',
  prefModel: 'mc.probability.preference-confused-with-model',
  desire: 'mc.probability.desire-changes-event-probability',
  prefJustify: 'mc.reasoning-language.preference-as-justification',
  varForSd: 'mc.statistics.variance-for-sd',
} as const;

// ---------- money and numbers ----------
/** dollars, cents only when needed: $45, $4.50, −$300, $1,200 */
export const M = (v: number): string => money(v, false);
/** dollars always with cents: $0.50 */
export const Mc = (v: number): string => money(v, true);
/** TeX dollars: -\$45 */
export const mx = (v: number): string => M(v).replace('−', '-').replace('$', '\\$').replace(/,/g, '{,}');
/** a probability as a decimal: 0.15 */
export const pd = (p: number): string => dec(p, 4);
/** TeX of a decimal (minus as '-') */
export const dx = (v: number, d = 4): string => dec(v, d).replace('−', '-');
/** a value in a product, bracketed when negative: (−$500) */
export const par = (v: number): string => (v < 0 ? `(${M(v)})` : M(v));
/** a percent: 15% */
export const pc = (p: number): string => `${dec(p * 100, 2)}%`;
/** "a" or "an" before a number read aloud (an 8%, an $80, an 11, an 18) */
export const an = (v: number): string => aD(v);
export const An = (v: number): string => (aD(v) === 'an' ? 'An' : 'A');
export const B = (s: string | number) => `<b class="b">${s}</b>`;
export const A = (s: string | number) => `<b class="a">${s}</b>`;
export const CALC = ' <span class="dim">(calculator allowed)</span>';
export const NEG = ' A cost or a loss is negative.';
const r6 = (v: number) => Math.round(v * 1e6) / 1e6;

// ---------- a payoff distribution ----------
export interface Dist { xs: number[]; ps: number[] }
export const evOf = (d: Dist): number => r6(d.xs.reduce((s, x, i) => s + x * d.ps[i]!, 0));
export const varOf = (d: Dist): number => { const m = evOf(d); return r6(d.xs.reduce((s, x, i) => s + (x - m) ** 2 * d.ps[i]!, 0)); };
export const sdOf = (d: Dist): number => Math.sqrt(varOf(d));
export const pLoss = (d: Dist, below = 0): number => r6(d.xs.reduce((s, x, i) => s + (x < below ? d.ps[i]! : 0), 0));
export const sumP = (ps: readonly number[]): number => r6(ps.reduce((a, b) => a + b, 0));
/** probabilities in hundredths, each a multiple of `step`, adding to 100 */
export function hundredths(R: () => number, m: number, step = 5, min = 5): number[] {
  const units = 100 / step, mn = min / step;
  for (;;) {
    const cuts = Array.from({ length: m - 1 }, () => int(R, 1, units - 1)).sort((a, b) => a - b);
    const parts = [...cuts, units].map((c, i, a) => c - (i ? a[i - 1]! : 0));
    if (parts.every(p => p >= mn)) return parts.map(p => (p * step) / 100);
  }
}

// ---------- item makers ----------
/** THE choice helper (keyed: drops a wrong choice whose key or text equals the right one); 3 or more choices */
export function ch(R: () => number, b: Base, opts: Opt[], o: { min?: number; max?: number; keep?: boolean } = {}): PItem {
  return keyed(R, b as never, opts, { min: 3, ...o }) as unknown as PItem;
}
/** a wrong typed value: [value, misconception id, the specific reply] */
export type Slip = [number, string | undefined, string];
/** a typed number; tol = the accepted distance (a stated rounding); slips equal to the answer are skipped */
export function num(b: Base, v: number, okSay: string, slips: Slip[], hint: string, tol = 1e-6): PItem {
  return {
    ...b, input: 'num', answer: { kind: 'num', v },
    check(r: Response): Verdict {
      if (r.kind !== 'num' || !Number.isFinite(r.v)) return { ok: false, say: 'Type a number.' };
      if (Math.abs(r.v - v) <= tol) return { ok: true, say: okSay };
      for (const [c, mc, say] of slips) if (Number.isFinite(c) && Math.abs(c - v) > tol && Math.abs(r.v - c) <= Math.max(tol, 1e-6)) return { ok: false, mc, say };
      return { ok: false, say: hint };
    },
  };
}
export type FSlip = [number, number, string | undefined, string];
/** a probability as a fraction: any equivalent fraction is right (the key in lowest terms) */
export function frac(b: Base, n: number, d: number, okSay: string, slips: FSlip[], hint: string): PItem {
  const g = gcdN(n, d), ln = n / g, ld = d / g;
  const key: Response = ld === 1 ? { kind: 'frac', w: ln, n: 0, d: 1 } : { kind: 'frac', w: 0, n: ln, d: ld };
  return {
    ...b, input: 'frac', answer: key,
    check(r: Response): Verdict {
      if (r.kind !== 'frac') return { ok: false, say: 'Type a fraction.' };
      const v = fracValue(r);
      if (!v) return { ok: false, say: 'Type it as a fraction: a whole-number top and bottom.' };
      if (same(v, ln, ld)) return { ok: true, say: okSay };
      for (const [cn, cd, mc, say] of slips) if (cd > 0 && cn * ld !== ln * cd && same(v, cn, cd)) return { ok: false, mc, say };
      return { ok: false, say: hint };
    },
  };
}
/** two numbers in boxes (lowest, highest) */
export function pair(b: Base, lead: string, op: string, tail: string, x: number, y: number, okSay: string, slips: [number, number, string | undefined, string][], hint: string, tol = 1e-6): PItem {
  return {
    ...b, input: 'pair', pairLead: lead, pairOp: op, pairTail: tail, answer: { kind: 'pair', x, y },
    check(r: Response): Verdict {
      if (r.kind !== 'pair' || !Number.isFinite(r.x) || !Number.isFinite(r.y)) return { ok: false, say: 'Type a number in each box.' };
      if (Math.abs(r.x - x) <= tol && Math.abs(r.y - y) <= tol) return { ok: true, say: okSay };
      for (const [cx, cy, mc, say] of slips) if (!(Math.abs(cx - x) <= tol && Math.abs(cy - y) <= tol) && Math.abs(r.x - cx) <= tol && Math.abs(r.y - cy) <= tol) return { ok: false, mc, say };
      return { ok: false, say: hint };
    },
  };
}
export const gcdN = (a: number, b: number): number => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
/** a fraction in lowest terms as text: 2/3 */
export const ft = (n: number, d: number): string => { const g = gcdN(n, d); return d / g === 1 ? String(n / g) : `${n / g}/${d / g}`; };
/** TeX fraction in lowest terms */
export const fx = (n: number, d: number): string => { const g = gcdN(n, d); return d / g === 1 ? String(n / g) : `\\tfrac{${n / g}}{${d / g}}`; };
/** try until the test holds */
export function until<T>(make: () => T, ok: (t: T) => boolean, tries = 6000): T {
  for (let i = 0; i < tries; i++) { const t = make(); if (ok(t)) return t; }
  throw new Error('until: nothing found');
}
export const near = (a: number, b: number, eps = 1e-6) => Math.abs(a - b) < eps;
/** a TeX \text{} cell */
export const tt = (s: string) => `\\text{${s}}`;
