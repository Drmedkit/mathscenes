// common.ts: what every practice family of "Linear, quadratic or exponential?" shares: the item type with its
// picture (a DiffTable and / or a kit Plane, as plain data), the misconception ids (math-curriculum-essentials/
// misconceptions.json), and the choice / number item makers. Pure: no DOM.
import { type Item, type Response, type Verdict, int, pick, shuffle } from '../../runtime/item';
import { ans, endOnChoice } from '../../runtime/explain';
import type { Paint } from '../../../core/theme';
import type { DKind } from './DiffTable';
import type { FSpec } from './ff';

export { ans, int, pick, shuffle };

export const MC = {
  inputStep: 'mc.linear-functions.ignores-input-step',
  gapRepair: 'mc.functions-concept.input-gap-division-repairs-all-family-tests',
  diffOnly: 'mc.functions-concept.difference-test-only',
  zeroD2: 'mc.functions-concept.zero-second-differences-quadratic',
  allUp: 'mc.exponential-log.exponential-means-increasing',
  factorDir: 'mc.exponential-log.factor-alone-decides-direction',
  rowRatio: 'mc.linear-functions.within-row-ratio-as-growth-factor',
  expDiffs: 'mc.functions-concept.exponential-test-uses-differences',
  finite: 'mc.reasoning-language.finite-data-fixes-unique-rule',
  examples: 'mc.reasoning-language.examples-as-proof',
  pctOf: 'mc.percent.percent-of-read-as-percent-change',
  bAsPct: 'mc.exponential-log.reports-factor-number-as-percent-rate',
  constRatio: 'mc.exponential-log.constant-ratio-always-exponential',
  zeroNum: 'mc.fractions-concept.zero-numerator-misread',
  zeroBreaks: 'mc.functions-concept.zero-output-breaks-tests',
  forces: 'mc.functions-concept.forces-known-family',
  expGreater: 'mc.exponential-log.exponential-always-greater',
  rateConst: 'mc.functions-concept.nonlinear-rate-constant',
  everyMoment: 'mc.functions-concept.average-rate-as-every-moment-rate',
  outAsChange: 'mc.linear-functions.output-value-as-change',
  units: 'mc.ratio-rate.rate-units-omitted-or-inverted',
  expRate: 'mc.exponential-log.exponential-always-has-greater-growth-rate',
  slopeHeight: 'mc.linear-functions.slope-as-height',
  vertex: 'mc.exponential-log.decay-leveling-off-as-vertex',
  curvedQuad: 'mc.functions-concept.every-curved-function-is-quadratic',
  anyExp: 'mc.functions-concept.any-exponent-means-quadratic',
  sqrtQuad: 'mc.functions-concept.square-root-classified-as-quadratic',
  transform: 'mc.functions-concept.transformation-changes-family',
  logSqrt: 'mc.functions-concept.logarithmic-curve-called-square-root',
  recipExp: 'mc.exponential-log.reciprocal-classified-as-exponential-decay',
  cropped: 'mc.data-displays.cropped-graph-is-whole',
  steep: 'mc.linear-functions.steepness-ignores-scale',
  discrete: 'mc.functions-concept.discrete-quantity-allows-fractions',
  scales: 'mc.data-displays.compares-across-different-scales',
  maxListed: 'mc.functions-concept.max-from-listed-values',
  anyExpWins: 'mc.exponential-log.any-increasing-exponential-dominates',
  oneInput: 'mc.functions-concept.generalizes-comparison-from-one-input',
  firstCross: 'mc.functions-concept.first-crossover-is-last',
  nonProp: 'mc.ratio-rate.scales-non-proportional',
  constAmount: 'mc.exponential-log.constant-factor-as-constant-amount',
  addPct: 'mc.percent.adds-successive-percent-changes',
  roughShape: 'mc.functions-concept.family-from-rough-shape',
  product: 'mc.functions-concept.product-means-quadratic',
  initialRows: 'mc.functions-concept.initial-rows-only-model-check',
  exactFit: 'mc.statistics.expects-points-on-fitted-line',
  extrap: 'mc.functions-concept.extrapolates-model',
  allReals: 'mc.functions-concept.context-domain-all-reals',
  asserts: 'mc.reasoning-language.restates-or-asserts-instead-of-reason',
  stopsDiffs: 'mc.functions-concept.exponential-classification-stops-at-differences',
  shiftAdd: 'mc.functions-concept.shifted-input-added-to-output',
} as const;

// ---------- pictures (plain data; the page draws them) ----------
export interface TPic {
  xName: string; xs: string[];
  cols: { name: string; vals: (string | null)[]; reveal?: (string | null)[]; col?: Paint }[];
  /** change columns shown with the question */
  dx?: string[]; d1?: string[]; d2?: string[]; rt?: string[];
  /** change columns that come in on the replay after a miss, and how they read then: not constant (wrong colour)
   *  or the test that passes (ringed) */
  solve?: { dx?: string[]; d1?: string[]; d2?: string[]; rt?: string[]; hot?: DKind[]; glow?: DKind[] };
}
type End = 'open' | 'closed' | 'none';
export type GItem =
  | { kind: 'fn'; key: string; s: FSpec; lo?: number; hi?: number; col?: Paint; name?: string; dash?: boolean; ends?: [End, End] }
  | { kind: 'point'; key: string; x: number; y: number; col?: Paint; name?: string; open?: boolean }
  | { kind: 'seg'; key: string; a: [number, number]; b: [number, number]; col?: Paint; dash?: boolean }
  | { kind: 'hline'; key: string; y: number; col?: Paint }
  | { kind: 'vline'; key: string; x: number; col?: Paint }
  | { kind: 'text'; key: string; x: number; y: number; text: string; col?: Paint };
export interface GPic { x: [number, number, number]; y: [number, number, number]; xName?: string; yName?: string; items: GItem[]; solve?: GItem[] }
export type Pic = { t?: TPic; g?: GPic };

export interface QItem extends Item { picture?: Pic }
export type Gen = (R: () => number, n: number, sg?: string) => QItem;

export interface Opt { t: string; ok?: boolean; mc?: string; say: string; /** options with the same key say the same thing: a wrong one equal to the right one is dropped */ key?: string }
export interface Base { id: string; family: string; prompt: string; board: string; solution: string[]; picture?: Pic; unit?: string }

/** a choice item: duplicate texts and wrong options equivalent to the right one (same key) are dropped; exactly one right */
export function choice(R: () => number, b: Base, opts: Opt[], keepOrder = false): QItem {
  const right = opts.find(o => o.ok);
  if (!right || opts.filter(o => o.ok).length !== 1) throw new Error(`${b.family}: exactly one right choice`);
  const seen = new Set<string>();
  const o0 = opts.filter(x => {
    if (!x.ok && right.key !== undefined && x.key === right.key) return false;
    const k = x.t.replace(/\s+/g, ' ').trim();
    if (seen.has(k)) return false;
    seen.add(k); return true;
  });
  if (o0.length < 2) throw new Error(`${b.family}: fewer than two choices`);
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
/** a typed number; `tol` = how close counts as right (default 1e-6) */
export function numItem(b: Base, v: number, okSay: string, cands: Cand[], hint: string, tol = 1e-6): QItem {
  return {
    ...b, input: 'num', answer: { kind: 'num', v },
    check(r: Response): Verdict {
      if (r.kind !== 'num' || !Number.isFinite(r.v)) return { ok: false, say: 'Type a number (a decimal or a negative number is fine).' };
      if (near(r.v, v, tol)) return { ok: true, say: okSay };
      for (const [c, mc, say] of cands) if (Number.isFinite(c) && !near(c, v, tol * 2 + 1e-9) && near(r.v, c, tol)) return { ok: false, mc, say };
      return { ok: false, say: hint };
    },
  };
}
export const xI = '<i>x</i>', yI = '<i>y</i>', tI = '<i>t</i>';
