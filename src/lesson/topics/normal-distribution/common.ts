// common.ts: what every practice family of "The normal distribution" shares: the picture spec the page draws (a curve
// card on the kit Plane, a z-table excerpt or calculator screen on a DataCard, sample dot plots on DataPlot),
// misconception ids (math-curriculum-essentials/misconceptions.json), realistic contexts with US units, and the
// choice / number / pair item makers. Pure: no DOM.
import { type Item, type Response, type Verdict, int, pick, shuffle } from '../../runtime/item';
import { ans, endOnChoice } from '../../runtime/explain';
import type { Paint } from '../../../core/theme';
import { fmt, fix, r9, roundTo } from './normMaths';

export { ans, int, pick, shuffle };

// ---------- the picture ----------
/** a curve on the card: a normal N(m, s) or a non-normal shape centred near m with scale s (all in axis units) */
export interface NCurve { key: string; kind: 'normal' | 'skewR' | 'skewL' | 'bimodal' | 'uniform'; m: number; s: number; col?: Paint; name?: string; dash?: boolean }
/** a shaded area under curve `on` from lo to hi (axis units; the window edge when lo / hi lie beyond it) */
export interface NShade { key: string; lo: number; hi: number; on: string; col?: Paint }
/** a bar of a density histogram: [lo, hi) with height h (density) */
export interface NBar { lo: number; hi: number; h: number; col?: Paint }
/** words on the card at axis x and at a fraction `at` (0..1) of the card's height */
export interface NText { key: string; x: number; at: number; text: string; col?: Paint }
export interface NVline { key: string; x: number; col?: Paint }
export interface NPic {
  [k: string]: unknown;
  /** the curve card (kit Plane): the axis in data units, ticks every `step` (the SD for SD-scaled axes) */
  card?: {
    x: { min: number; max: number; step: number; name: string; /** tick values drawn as "?" */ hide?: number[]; /** when set, only these tick values are labelled (the rest blank) */ show?: number[]; /** decimals in tick labels */ dec?: number };
    /** a labelled density scale (histograms); default: no labels, the height fits the curves */
    y?: { max: number; step: number; name: string; dec: number };
    curves?: NCurve[]; shades?: NShade[]; bars?: NBar[]; texts?: NText[]; vlines?: NVline[];
  };
  /** a z-table excerpt (cumulative area to the left), rows [z, area]; ring = row indexes to glow */
  table?: { rows: [number, number][] };
  /** a calculator screen: lines of output */
  calc?: { title: string; lines: string[] };
  /** sample shares (percent) of many simulated samples, one dot plot per sample size */
  samples?: { axis: { min: number; max: number; step: number; name: string }; panels: { key: string; label: string; data: number[] }[]; mark?: number };
  /** shown after a miss (hidden from oracles) */
  solveTexts?: NText[]; solveShades?: NShade[]; solveRing?: number[];
}
export interface NItem extends Item { picture?: NPic }
export type Gen = (R: () => number, n: number, sg?: string) => NItem;

export const MC = {
  ftcRev: 'mc.calculus.ftc-subtraction-reversed',
  relCount: 'mc.data-displays.relative-frequency-as-count',
  unequalSteps: 'mc.data-displays.unequal-scale-steps',
  dropSign: 'mc.integers.drops-sign-of-computed-result',
  pctSign: 'mc.percent.appends-percent-sign-to-unscaled-value',
  betweenCum: 'mc.probability.between-area-from-cumulatives',
  doubleTail: 'mc.probability.doubles-one-tail',
  evExact: 'mc.probability.ev-as-guaranteed-outcome',
  eventIneq: 'mc.probability.event-inequality-as-probability-inequality',
  leftDefault: 'mc.probability.left-tail-default',
  misread: 'mc.probability.misreads-tool-area-output',
  rvFixed: 'mc.probability.random-variable-as-fixed-unknown',
  grouping: 'mc.properties.ignores-grouping-symbols',
  approxExact: 'mc.quadratic-polynomial.approximation-as-exact',
  modelTruth: 'mc.reasoning-language.model-as-truth',
  within3: 'mc.statistics.all-data-within-3-sd',
  anyNormal: 'mc.statistics.any-data-is-normal',
  areaAsZ: 'mc.statistics.area-used-as-z',
  pointMass: 'mc.statistics.assigns-positive-mass-to-continuous-points',
  centralToTail: 'mc.statistics.central-benchmark-misassigned-to-tail',
  agreeProves: 'mc.statistics.close-agreement-proves-representative',
  raw: 'mc.statistics.compares-raw-not-standardized',
  narrowBins: 'mc.statistics.density-curve-from-narrowing-bins',
  heightProb: 'mc.statistics.density-height-as-probability',
  centered: 'mc.statistics.every-normal-interval-centered-at-mean',
  invFormula: 'mc.statistics.inverse-normal-formula-error',
  meanHeight: 'mc.statistics.larger-mean-increases-normal-height-or-width',
  sdTaller: 'mc.statistics.larger-sd-means-taller-or-more-data',
  marginN: 'mc.statistics.margin-independent-of-n',
  wrongDist: 'mc.statistics.normal-benchmark-attached-to-wrong-distance',
  law: 'mc.statistics.normal-fit-as-law',
  typical: 'mc.statistics.normal-means-typical',
  toolArgs: 'mc.statistics.normal-tool-arguments-misassigned',
  oneSided: 'mc.statistics.one-sided-band-uses-central-percent',
  mirror: 'mc.statistics.sample-should-mirror-population',
  statExact: 'mc.statistics.sample-statistic-as-exact-parameter',
  sdNeg: 'mc.statistics.sd-can-be-negative',
  sdEndpoint: 'mc.statistics.sd-marked-as-endpoint',
  noScale: 'mc.statistics.standardize-without-scaling',
  stdChanges: 'mc.statistics.standardizing-changes-probability',
  stdNormal: 'mc.statistics.standardizing-makes-normal',
  humpNormal: 'mc.statistics.symmetry-or-hump-implies-normal',
  tailHalf: 'mc.statistics.tail-as-half-central-percent',
  variance: 'mc.statistics.variance-for-sd',
  zNeg: 'mc.statistics.z-score-meaning',
  zPct: 'mc.statistics.z-score-read-as-percent',
} as const;

// ---------- the stated methods ----------
export const RULE = {
  table: 'Round z to 2 decimal places and use the table (area to the <b>left</b> of z).',
  area4: 'Give the area as a decimal to 4 places.',
  calc: 'Use normalcdf with the raw values (no rounding until the end); give the area to 4 decimal places.',
  about: 'Use the 68-95-99.7 rule.',
};

// ---------- contexts: realistic normal models with US units ----------
export interface NCtx {
  id: string;
  /** the individuals (plural, singular) and the measured variable */
  who: string; one: string; what: string; /** the count noun after a number ("women", "days") */ noun: string;
  /** unit after a number ("in", "lb", "°F", "points") and the axis name */
  unit: string; axis: string;
  /** realistic models [mean, SD] */ models: [number, number][];
  /** decimals of a measured value; grid of x values (SAT scores come in steps of 10) */ dx: number; grid?: number;
  /** population / group sizes for counts */ Ns: number[];
  /** "taller", "heavier", "higher" and the opposite */ more: string; less: string;
  /** a value can not go below this (wait times, weights) */ floor?: number;
  /** the possible values (SAT scores: 200 to 800) */ range?: [number, number];
}
export const CTX: NCtx[] = [
  { id: 'women', noun: 'women', who: 'adult women', one: 'woman', what: 'height', unit: 'in', axis: 'Height (inches)', models: [[64, 2.5], [63.5, 2.5], [64, 3], [63, 2.5], [64.5, 2.8]], dx: 1, Ns: [400, 500, 800, 1000, 2000], more: 'taller', less: 'shorter' },
  { id: 'men', noun: 'men', who: 'adult men', one: 'man', what: 'height', unit: 'in', axis: 'Height (inches)', models: [[69, 3], [69.5, 3], [70, 2.8], [69, 2.8], [69.5, 3.2]], dx: 1, Ns: [400, 500, 800, 1000, 2000], more: 'taller', less: 'shorter' },
  { id: 'newborn', noun: 'newborns', who: 'newborns', one: 'newborn', what: 'birth weight', unit: 'lb', axis: 'Birth weight (pounds)', models: [[7.5, 1.1], [7.4, 1.2], [7.6, 1.15], [7.3, 1.1], [7.5, 1.2]], dx: 1, Ns: [400, 600, 1000, 2000, 3000], more: 'heavier', less: 'lighter' },
  { id: 'sat', noun: 'test takers', who: 'test takers', one: 'test taker', what: 'SAT Math score', unit: 'points', axis: 'SAT Math score (points)', models: [[500, 100], [520, 110], [510, 105], [530, 100], [505, 110]], dx: 0, grid: 10, range: [200, 800], Ns: [800, 1000, 2000, 5000, 10000], more: 'higher', less: 'lower' },
  { id: 'iq', noun: 'adults', who: 'adults', one: 'adult', what: 'score on a reasoning test', unit: 'points', axis: 'Test score (points)', models: [[100, 15], [100, 16], [100, 15], [100, 16], [100, 15]], dx: 0, Ns: [500, 1000, 2000, 4000, 5000], more: 'higher', less: 'lower' },
  { id: 'dog', noun: 'dogs', who: 'adult golden retrievers', one: 'dog', what: 'weight', unit: 'lb', axis: 'Weight (pounds)', models: [[65, 6], [66, 5], [64, 5.5], [65, 5], [67, 6]], dx: 0, Ns: [200, 400, 500, 800, 1000], more: 'heavier', less: 'lighter' },
  { id: 'temp', noun: 'days', who: 'May days in Atlanta', one: 'day', what: 'daily high', unit: '°F', axis: 'Daily high (°F)', models: [[80, 4], [79, 5], [81, 4.5], [80, 5], [78, 4]], dx: 0, Ns: [300, 600, 900, 1200, 1500], more: 'warmer', less: 'cooler' },
  { id: 'apple', noun: 'apples', who: 'apples from one orchard', one: 'apple', what: 'weight', unit: 'oz', axis: 'Weight (ounces)', models: [[6.5, 0.8], [6.8, 0.7], [7, 0.9], [6.6, 0.8], [6.9, 0.6]], dx: 1, Ns: [500, 1000, 2000, 4000, 5000], more: 'heavier', less: 'lighter' },
  { id: 'run', noun: 'runners', who: 'high school runners', one: 'runner', what: '400 m time', unit: 's', axis: '400 m time (seconds)', models: [[62, 4], [61, 3.5], [63, 4.5], [62, 3.6], [60.5, 3.8]], dx: 1, Ns: [200, 400, 500, 800, 1000], more: 'slower', less: 'faster' },
];
export const ctxById = (id: string): NCtx => CTX.find(c => c.id === id)!;
/** a context; without ids every context but SAT (its 200-800 range cuts off the 3-SD benchmarks) */
export const ctxPick = (R: () => number, ids?: readonly string[]): NCtx => pick(R, ids ? CTX.filter(c => ids.includes(c.id)) : CTX.filter(c => c.id !== 'sat'));
export const modelPick = (R: () => number, c: NCtx): [number, number] => pick(R, c.models);
/** a value with its unit: "64 in", "7.5 lb", "80°F", "520 points", "62.3 s" */
export function withU(c: NCtx, v: number, d = 3): string {
  if (c.unit === '°F') return `${fmt(v, d)}°F`;
  return `${fmt(v, d)} ${c.unit === 'points' && Math.abs(v) === 1 ? 'point' : c.unit}`;
}
/** the unit for TeX ("\ \text{in}") */
export const unitT = (c: NCtx) => (c.unit === '°F' ? '^{\\circ}\\text{F}' : `\\ \\text{${c.unit}}`);
/** "N(64, 2.5)" plain and TeX */
export const NN = (m: number, s: number) => `N(${fmt(m)}, ${fmt(s)})`;
export const NT = (m: number, s: number) => `N(${fmt(m).replace('−', '-')},\\ ${fmt(s)})`;
/** a measured value on the context's grid between lo and hi */
export function valueIn(R: () => number, c: NCtx, lo: number, hi: number): number {
  const g = c.grid ?? 10 ** -c.dx;
  if (c.range) { lo = Math.max(lo, c.range[0]); hi = Math.min(hi, c.range[1]); }
  const a = Math.ceil(r9(lo / g)), b = Math.floor(r9(hi / g));
  return r9(int(R, a, Math.max(a, b)) * g);
}
/** a count with thousands commas */
export const cnt = (v: number) => Math.round(v).toLocaleString('en-US');
/** plural noun after a count */
export const pl = (k: number, one: string, many = one + 's') => `${cnt(k)} ${k === 1 ? one : many}`;
/** try a maker until the test holds (generators stay total; the tests catch a miss) */
export function until<T>(make: () => T, ok: (t: T) => boolean, tries = 4000): T {
  let t = make();
  for (let i = 0; i < tries && !ok(t); i++) t = make();
  if (!ok(t)) throw new Error('until: nothing found');
  return t;
}

// ---------- a standard curve card for a model ----------
/** the SD-scaled axis of N(m, s): -4..4 SD, a tick every SD */
export function sdAxis(c: NCtx | string, m: number, s: number, o: { hide?: number[]; show?: number[]; k?: number } = {}): NonNullable<NPic['card']>['x'] {
  const k = o.k ?? 4;
  return { min: r9(m - k * s), max: r9(m + k * s), step: s, name: typeof c === 'string' ? c : c.axis, hide: o.hide, show: o.show };
}
export const normalCurve = (m: number, s: number, key = 'C', col?: Paint, name?: string): NCurve => ({ key, kind: 'normal', m, s, col, name });

// ---------- item makers ----------
export interface Opt { t: string; ok?: boolean; mc?: string; say: string; /** same key as the right choice = same answer: dropped */ key?: string }
export interface Base { id: string; family: string; prompt: string; board: string; solution: string[]; picture?: NPic; unit?: string; ex?: Record<string, unknown> }

/** HTML-safe text: a "<" that does not start a tag ("P(X < 62)") becomes &lt; */
export const esc = (h: string): string => h.replace(/<(?![a-zA-Z\/!])/g, '&lt;');
const escB = <T extends Base>(b: T): T => ({ ...b, prompt: esc(b.prompt), solution: b.solution.map(esc) });
const escV = (v: Verdict): Verdict => ({ ...v, say: esc(v.say) });

/** a choice item: duplicate texts and wrong choices that mean the same as the right one (same key) are dropped */
export function choice(R: () => number, b0: Base, opts0: Opt[], keepOrder = false): NItem {
  const b = escB(b0), opts = opts0.map(o => ({ ...o, t: esc(o.t), say: esc(o.say) }));
  const right = opts.filter(x => x.ok);
  if (right.length !== 1) throw new Error(`${b.family}: exactly one right choice`);
  const rk = right[0]!.key;
  const seen = new Set<string>();
  const o0 = opts.filter(x => {
    const k = x.t.replace(/\s+/g, ' ').trim();
    if (seen.has(k)) return false;
    if (!x.ok && rk !== undefined && x.key === rk) return false;
    seen.add(k); return true;
  });
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
/** how a typed number may be written: an area (0.1587, or 15.87 as a percent), a percent (15.87, or 0.1587), a plain value */
export type Form = 'area' | 'pct' | 'plain';
/** a typed number; `tol` = how close counts as right (default: exact to the stated places) */
export function numItem(b0: Base, v: number, form: Form, okSay: string, cands: Cand[], hint: string, tol = 1e-6): NItem {
  const b = escB(b0);
  const inner = numCheck(v, form, okSay, cands, hint, tol);
  return { ...b, input: 'num', answer: { kind: 'num', v }, check: r => escV(inner(r)) };
}
function numCheck(v: number, form: Form, okSay: string, cands: Cand[], hint: string, tol: number): (r: Response) => Verdict {
  const forms = (x: number) => (form === 'area' ? [x, x * 100] : form === 'pct' ? [x, x / 100] : [x]);
  const near = (x: number, y: number, t: number) => Math.abs(x - y) <= t + 1e-9;
  const isRight = (x: number) => forms(v).some((y, i) => near(x, y, i === 0 ? tol : form === 'area' ? tol * 100 : tol / 100));
  return (r: Response): Verdict => {
    if (r.kind !== 'num' || !Number.isFinite(r.v)) return { ok: false, say: 'Type a number (a decimal is fine).' };
    if (isRight(r.v)) return { ok: true, say: okSay };
    for (const [c, mc, say] of cands) if (Number.isFinite(c) && !isRight(c) && forms(c).some(y => near(r.v, y, Math.max(tol, 1e-6)))) return { ok: false, mc, say };
    return { ok: false, say: hint };
  };
}
export type PCand = [number, number, string | undefined, string];
export function pairItem(b0: Base, x: number, y: number, form: { lead: string; op: string; tail?: string }, okSay: string, cands: PCand[], hint: string, tol = 1e-6): NItem {
  const nr = (p: number, q: number) => Math.abs(p - q) <= tol + 1e-9;
  const b = escB(b0);
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
export const A = (s: string | number) => `<b class="a">${s}</b>`;
export const B = (s: string | number) => `<b class="b">${s}</b>`;
/** a proportion as "0.1587" (4 places) */
export const a4 = (p: number) => fix(p, 4);
export { fmt, fix, roundTo };
