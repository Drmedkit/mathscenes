// common.ts: what every practice family of "Exponential growth and decay" shares: the item type with its picture,
// misconception ids (math-curriculum-essentials/misconceptions.json), and the choice / number / pair item makers.
// Pure: no DOM.
import { type Item, type Response, type Verdict, int, pick, shuffle } from '../../runtime/item';
import { ans, endOnChoice } from '../../runtime/explain';
import type { Pic } from './pictures';

export interface QItem extends Item { picture?: Pic }
export type Gen = (R: () => number, n: number, sg?: string) => QItem;
export { ans, int, pick, shuffle };

export const MC = {
  constAmount: 'mc.exponential-log.constant-factor-as-constant-amount',
  negFactor: 'mc.exponential-log.decay-needs-negative-factor',
  negOut: 'mc.exponential-log.positive-base-exponential-can-output-negative',
  roughShape: 'mc.functions-concept.family-from-rough-shape',
  stopsDiffs: 'mc.functions-concept.exponential-classification-stops-at-differences',
  rounded: 'mc.exponential-log.rounded-ratios-treated-as-equal',
  gaps: 'mc.linear-functions.raw-output-ratios-ignore-input-gaps',
  addPct: 'mc.percent.adds-successive-percent-changes',
  oneInput: 'mc.functions-concept.generalizes-comparison-from-one-input',
  wrongPart: 'mc.exponential-log.exponent-on-wrong-part',
  powProd: 'mc.exponential-log.writes-power-as-product',
  aAsB: 'mc.linear-functions.exponential-initial-value-as-growth-factor',
  firstOut: 'mc.linear-functions.first-output-as-intercept',
  allUp: 'mc.exponential-log.exponential-means-increasing',
  reached: 'mc.functions-concept.unattained-bound-treated-as-reached',
  lastTable: 'mc.calculus.last-table-value-is-the-limit',
  ctxDomain: 'mc.functions-concept.context-restriction-as-algebraic-domain',
  wholeOnly: 'mc.exponential-log.exponential-only-whole-inputs',
  inverted: 'mc.sequences-series.ratio-inverted',
  asDiff: 'mc.mul-div.factor-reported-as-difference',
  forward: 'mc.sequences-series.forward-op-when-backward',
  rate: 'mc.exponential-log.factor-confused-with-rate',
  bAsPct: 'mc.exponential-log.reports-factor-number-as-percent-rate',
  early: 'mc.decimals.intermediate-precision-always-invalid',
  divide: 'mc.exponential-log.divides-instead-of-root-for-factor',
  perUnit: 'mc.exponential-log.multi-period-factor-as-per-unit',
  period: 'mc.exponential-log.wrong-exponent-for-period',
  reassign: 'mc.linear-functions.reassigns-start-without-coordinate-adjustment',
  distrib: 'mc.functions-concept.function-distributes-over-sum',
  powTimes: 'mc.exponents-roots.power-as-base-times-exponent',
  coefOut: 'mc.exponential-log.exponent-coefficient-as-output-factor',
  nPeriods: 'mc.exponential-log.compounding-period-count-omitted-or-reversed',
  annual: 'mc.exponential-log.annual-rate-per-period',
  apr: 'mc.finance.apr-treated-as-apy',
  examples: 'mc.reasoning-language.examples-as-proof',
  exact: 'mc.statistics.expects-points-on-fitted-line',
  endpoint: 'mc.statistics.endpoint-fit-or-high-r-squared-proves-validity',
  allReals: 'mc.functions-concept.context-domain-all-reals',
  cooling: 'mc.exponential-log.cooling-decays-to-zero',
  extrap: 'mc.functions-concept.extrapolates-model',
  shiftAdd: 'mc.functions-concept.shifted-input-added-to-output',
  constRatio: 'mc.exponential-log.constant-ratio-always-exponential',
  leveling: 'mc.exponential-log.decay-leveling-off-as-vertex',
} as const;

export const tI = '<i>t</i>', xI = '<i>x</i>';
/** b<sup>t</sup> in HTML */
export const sup = (s: string | number) => { const x = String(s).replace(/<[^>]+>/g, ''); return `<sup>${/[ /]/.test(x) ? `(${x})` : x}</sup>`; };

export interface Opt { t: string; ok?: boolean; mc?: string; say: string }
export interface Base { id: string; family: string; prompt: string; board: string; solution: string[]; picture?: Pic; unit?: string }

export function choice(R: () => number, b: Base, opts: Opt[], keepOrder = false): QItem {
  const seen = new Set<string>();
  const o0 = opts.filter(x => { const k = x.t.replace(/\s+/g, ' '); if (seen.has(k)) return false; seen.add(k); return true; });
  if (o0.filter(x => x.ok).length !== 1) throw new Error(`${b.family}: exactly one right choice`);
  const o = keepOrder ? o0.slice() : shuffle(R, o0.slice());
  const i = o.findIndex(x => x.ok);
  return {
    ...b, input: 'choice', choices: o.map(x => x.t), answer: { kind: 'choice', i }, solution: endOnChoice(b.solution, o[i]!.t),
    check(r: Response): Verdict {
      if (r.kind !== 'choice' || !o[r.i]) return { ok: false, say: 'Pick one of the answers.' };
      const x = o[r.i]!;
      return { ok: !!x.ok, mc: x.ok ? undefined : x.mc, say: x.say };
    },
  };
}
export type Cand = [number, string | undefined, string];
const near = (a: number, b: number, tol: number) => Math.abs(a - b) <= tol;
/** a typed number; `tol` = how close counts as right (default 1e-6; 0.005 for cents) */
export function numItem(b: Base, v: number, okSay: string, cands: Cand[], hint: string, tol = 1e-6): QItem {
  return {
    ...b, input: 'num', answer: { kind: 'num', v },
    check(r: Response): Verdict {
      if (r.kind !== 'num' || !Number.isFinite(r.v)) return { ok: false, say: 'Type a number (a decimal is fine).' };
      if (near(r.v, v, tol)) return { ok: true, say: okSay };
      for (const [c, mc, say] of cands) if (Number.isFinite(c) && !near(c, v, tol * 2 + 1e-9) && near(r.v, c, tol)) return { ok: false, mc, say };
      return { ok: false, say: hint };
    },
  };
}
export type PCand = [number, number, string | undefined, string];
export function pairItem(b: Base, x: number, y: number, form: { lead: string; op: string; tail?: string }, okSay: string, cands: PCand[], hint: string): QItem {
  const nr = (p: number, q: number) => Math.abs(p - q) < 1e-6;
  return {
    ...b, input: 'pair', pairLead: form.lead, pairOp: form.op, pairTail: form.tail ?? '', answer: { kind: 'pair', x, y },
    check(r: Response): Verdict {
      if (r.kind !== 'pair' || !Number.isFinite(r.x) || !Number.isFinite(r.y)) return { ok: false, say: 'Fill in both boxes with numbers.' };
      if (nr(r.x, x) && nr(r.y, y)) return { ok: true, say: okSay };
      for (const [cx, cy, mc, say] of cands) if (!(nr(cx, x) && nr(cy, y)) && nr(r.x, cx) && nr(r.y, cy)) return { ok: false, mc, say };
      if (nr(r.x, x)) return { ok: false, say: `The first box is right. ${hint}` };
      if (nr(r.y, y)) return { ok: false, say: `The second box is right. ${hint}` };
      return { ok: false, say: hint };
    },
  };
}
/** the y = □ · (□)^t answer form */
export const MODEL_FORM = (y = '<i>y</i>', v = tI) => ({ lead: `${y} =`, op: '· (', tail: `)${sup(v)}` });
