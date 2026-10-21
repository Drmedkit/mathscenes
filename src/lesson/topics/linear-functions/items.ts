// items.ts: practice families for "Linear functions and slope-intercept form" (secondary-t5-33), generated from
// templates, checked exactly, every wrong answer classified against the misconception catalogue where that is honest.
// A generator gets the SUB-GOAL it practises (plan.ts) and uses that sub-goal's number ranges from the topic JSON.
// Most items carry a LineModel picture ({ lf }: the block's params, the steps shown at once, the steps the worked
// solution adds, and TeX lines the solution writes on the board). Pure: no DOM, no canvas.
import { type Item, type Response, type Verdict, int, pick, shuffle } from '../../runtime/item';
import type { LMParams, LMStep, LMAxis } from './LineModel';
import { H, T, eqHtml, eqTex, evalLine, interceptOf, q, qNum, rat, sameValue, slopeOf, terminates, windowFor, type Form } from './lfMaths';

// ---------- the picture ----------
export interface LFPic {
  lm: LMParams;
  /** steps on at once */ show: LMStep[];
  /** steps the worked solution adds */ solve: LMStep[];
  /** steps the worked solution takes away */ hide?: LMStep[];
  /** TeX lines under the board line, before the answer (givens) */ pre?: string[];
  /** TeX lines the worked solution writes */ tex?: string[];
  /** extras the solution shows: a proportional ray, a wrong ghost point, a lit table row */
  ray?: { x: number; y: number }; ghost?: { x: number; y: number }; row?: number;
}
export interface LFItem extends Item { picture?: { lf: LFPic }; /** no picture: TeX the worked solution writes on the big slate */ slateTex?: string[] }
type Gen = (R: () => number, n: number, sg?: string) => LFItem;

// ---------- misconception ids (all in math-curriculum-essentials/misconceptions.json; the test checks) ----------
export const MC = {
  firstOut: 'mc.linear-functions.first-output-as-intercept',
  inputStep: 'mc.linear-functions.ignores-input-step',
  height: 'mc.linear-functions.slope-as-height',
  sign: 'mc.linear-functions.drops-slope-sign',
  swap: 'mc.linear-functions.swaps-m-and-b',
  backSign: 'mc.linear-functions.intercept-sign-error-back-solve',
  propo: 'mc.linear-functions.linear-means-proportional',
  dichot: 'mc.linear-functions.linear-proportional-dichotomy',
  zeroSwap: 'mc.linear-functions.intercept-zero-swap',
  window: 'mc.data-displays.window-edge-as-axis',
  perUnit: 'mc.linear-functions.rate-without-per-unit',
  inverted: 'mc.linear-functions.rise-run-inverted',
  negAmount: 'mc.linear-functions.negative-rate-as-negative-amount',
  position: 'mc.linear-functions.position-based-slope-intercept',
  termSign: 'mc.linear-functions.term-sign-dropped',
  dropStart: 'mc.linear-functions.drops-start-value',
  feeTimes: 'mc.linear-functions.multiplies-fee-by-input',
  order: 'mc.linear-functions.inconsistent-subtraction-order',
  yOverX: 'mc.linear-functions.slope-as-y-over-x',
  vertZero: 'mc.calculus.zero-over-k-vs-k-over-zero',
  vhSwap: 'mc.linear-functions.vertical-horizontal-line-swap',
  illusion: 'mc.linear-functions.illusion-of-linearity',
  spacing: 'mc.functions-concept.family-tests-ignore-input-spacing',
  noCheck: 'mc.reasoning-language.accepts-derived-rule-without-data-check',
  outDiff: 'mc.functions-concept.output-differences-suffice-to-check-table',
  coordOrder: 'mc.coordinate-geometry.reverses-coordinate-order',
  onlyPlotted: 'mc.functions-concept.graph-is-only-plotted-points',
  interval: 'mc.measurement-units.misjudges-interval-value',
  misfit: 'mc.data-displays.scale-interval-misfits-range',
  coverage: 'mc.data-displays.scale-coverage-as-sufficient',
  discrete: 'mc.functions-concept.discrete-quantity-allows-fractions',
  onlyObserved: 'mc.data-displays.values-exist-only-at-observed-inputs',
  unitsWrong: 'mc.linear-functions.feature-units-wrong',
  bInputUnits: 'mc.linear-functions.intercept-has-input-units',
  convDir: 'mc.measurement-units.rate-converted-wrong-direction',
  convSlope: 'mc.measurement-units.converts-only-slope-in-linear-model',
  scaleProp: 'mc.ratio-rate.scales-non-proportional',
  labels: 'mc.reasoning-language.labels-as-justification',
  allReals: 'mc.functions-concept.context-domain-all-reals',
  extrap: 'mc.functions-concept.extrapolates-model',
  alwaysMeaning: 'mc.statistics.intercept-always-meaningful',
  stops: 'mc.linear-functions.stops-after-slope',
} as const;

export type FamilyId =
  | 'tableRate' | 'fasterLine' | 'startTable' | 'startGraph' | 'scaledRate' | 'rateSentence' | 'rateUnit' | 'pickMB'
  | 'sameFunction' | 'whatChanged' | 'predictShift' | 'storyToEq' | 'storyPair' | 'twoPointRate' | 'specialSlope'
  | 'isLinear' | 'fitsRule' | 'backSolve' | 'eqTwoPoints' | 'eqFromTable' | 'onTheLine' | 'plotPoint' | 'slopeStep'
  | 'whichGraph' | 'graphToEq' | 'scaledRead' | 'chooseScale' | 'dotsOrLine' | 'refuteClaim' | 'convertRate'
  | 'rewriteEq' | 'interceptMeaning' | 'isProportional' | 'doubleInput' | 'whichEvidence' | 'validInputs' | 'predict'
  | 'predictValid';
export const FAMILIES: readonly { id: FamilyId; name: string }[] = [
  { id: 'tableRate', name: 'Change per one unit' },
  { id: 'fasterLine', name: 'Higher or faster?' },
  { id: 'startTable', name: 'The value at input 0' },
  { id: 'startGraph', name: 'Find b on the graph' },
  { id: 'scaledRate', name: 'Rate on scaled axes' },
  { id: 'rateSentence', name: 'Say the rate' },
  { id: 'rateUnit', name: 'Units of m and b' },
  { id: 'pickMB', name: 'Spot m and b' },
  { id: 'sameFunction', name: 'Same m, same b' },
  { id: 'whatChanged', name: 'What changed?' },
  { id: 'predictShift', name: 'Change the equation' },
  { id: 'storyToEq', name: 'Story to equation' },
  { id: 'storyPair', name: 'Write y = mx + b' },
  { id: 'twoPointRate', name: 'Slope from two points' },
  { id: 'specialSlope', name: 'Flat and vertical' },
  { id: 'isLinear', name: 'Linear or not?' },
  { id: 'fitsRule', name: 'Check the rule' },
  { id: 'backSolve', name: 'Find b from a point' },
  { id: 'eqTwoPoints', name: 'Equation from two points' },
  { id: 'eqFromTable', name: 'Equation from a table' },
  { id: 'onTheLine', name: 'On the line?' },
  { id: 'plotPoint', name: 'Make a point' },
  { id: 'slopeStep', name: 'Step from the start' },
  { id: 'whichGraph', name: 'Match line and equation' },
  { id: 'graphToEq', name: 'Graph to equation' },
  { id: 'scaledRead', name: 'Read a scaled graph' },
  { id: 'chooseScale', name: 'Choose the scale' },
  { id: 'dotsOrLine', name: 'Dots or a line?' },
  { id: 'refuteClaim', name: 'Show the claim is wrong' },
  { id: 'convertRate', name: 'Convert a rate' },
  { id: 'rewriteEq', name: 'New units, new equation' },
  { id: 'interceptMeaning', name: 'What b means' },
  { id: 'isProportional', name: 'Proportional or not?' },
  { id: 'doubleInput', name: 'Double the input' },
  { id: 'whichEvidence', name: 'Back it up with numbers' },
  { id: 'validInputs', name: 'Inputs that make sense' },
  { id: 'predict', name: 'Predict' },
  { id: 'predictValid', name: 'Can the model say?' },
];
export const FAMILY_NAMES: Record<string, string> = Object.fromEntries(FAMILIES.map(f => [f.id, f.name]));

// ---------- item helpers ----------
interface Opt { t: string; ok?: boolean; mc?: string; say: string }
function choiceItem(R: () => number, base: Omit<LFItem, 'input' | 'choices' | 'answer' | 'check'>, opts: Opt[]): LFItem {
  const seen = new Set<string>(), uniq: Opt[] = [];
  for (const o of opts) if (!seen.has(o.t)) { seen.add(o.t); uniq.push(o); }
  const o = shuffle(R, uniq);
  const i = o.findIndex(x => x.ok);
  return {
    ...base, input: 'choice', choices: o.map(x => x.t), answer: { kind: 'choice', i },
    check: (r: Response) => {
      if (r.kind !== 'choice' || !o[r.i]) return { ok: false, say: 'Pick one of the answers.' };
      const c = o[r.i]!;
      return { ok: !!c.ok, mc: c.mc, say: c.say };
    },
  };
}
const numItem = (base: Omit<LFItem, 'input' | 'answer' | 'check'>, ans: number, check: (v: number) => Verdict): LFItem => ({
  ...base, input: 'num', answer: { kind: 'num', v: ans },
  check: (r: Response) => (r.kind === 'num' ? (Number.isFinite(r.v) ? check(r.v) : { ok: false, say: 'Type a number.' }) : { ok: false, say: 'Type a number.' }),
});
const pairItem = (base: Omit<LFItem, 'input' | 'answer' | 'check'>, ans: [number, number], check: (x: number, y: number) => Verdict): LFItem => ({
  ...base, input: 'pair', answer: { kind: 'pair', x: ans[0], y: ans[1] },
  check: (r: Response) => (r.kind === 'pair' && Number.isFinite(r.x) && Number.isFinite(r.y) ? check(r.x, r.y) : { ok: false, say: 'Fill in both boxes.' }),
});
/** exact y = m x + b as a number */
const f = (m: number, b: number, x: number) => qNum(evalLine(m, b, x));
const near = (a: number, b: number) => Math.abs(a - b) < 1e-6;
const ok = (say: string): Verdict => ({ ok: true, say });
const no = (say: string, mc?: string): Verdict => ({ ok: false, mc, say });
const cap = (s: string) => s[0]!.toUpperCase() + s.slice(1);
const NAMES = ['Ana', 'Ben', 'Cara', 'Dev', 'Eli', 'Fay', 'Gus', 'Ivy', 'Jon', 'Kai', 'Lea', 'Max', 'Nia', 'Omar', 'Rosa', 'Sam', 'Tia', 'Zoe'];
const I = (s: string) => `<i>${s}</i>`;
/** a sign-aware TeX term "- 3" / "+ 3" */
const sT = (v: number) => (v < 0 ? `- ${T(-v)}` : `+ ${T(v)}`);
/** TeX of a product a·(x) with brackets around a negative x */
const par = (v: number) => (v < 0 ? `(${T(v)})` : T(v));

// ---------- contexts ----------
interface Ctx {
  id: string;
  /** letters of the input and output */ x: string; y: string;
  /** quantity names (graph axes, sentences) */ xn: string; yn: string;
  /** input unit plural / singular, its short form for the axis */ xu: string; xu1: string; xa: string;
  /** output unit plural / singular, its short form */ yu: string; yu1: string; ya: string;
  /** short table headers */ xh: string; yh: string;
  money?: boolean;
  ms: number[]; bs: number[];
  /** a sensible last input */ xMax: number;
  /** counted inputs (whole numbers only) */ count?: boolean;
  /** what b is in this story */ bWhat: string;
  story(m: number, b: number): string;
}
const A = (s: string) => `<b class="a">${s}</b>`, Bm = (s: string) => `<b class="b">${s}</b>`;
const CTX: readonly Ctx[] = [
  { id: 'bike', x: 'h', y: 'C', xn: 'time', yn: 'cost', xu: 'hours', xu1: 'hour', xa: 'h', yu: 'dollars', yu1: 'dollar', ya: '$', xh: 'time', yh: 'cost', money: true,
    ms: [6, 8, 10, 12, 15], bs: [10, 12, 15, 18, 20, 25], xMax: 6, bWhat: 'the rental fee',
    story: (m, b) => `A bike shop charges a ${A('$' + b)} fee plus ${Bm('$' + m)} per hour.` },
  { id: 'taxi', x: 'd', y: 'F', xn: 'distance', yn: 'fare', xu: 'miles', xu1: 'mile', xa: 'mi', yu: 'dollars', yu1: 'dollar', ya: '$', xh: 'trip', yh: 'fare', money: true,
    ms: [2, 2.5, 3], bs: [3, 4, 5, 6], xMax: 10, bWhat: 'the starting charge',
    story: (m, b) => `A taxi charges ${A('$' + b)} to start plus ${Bm('$' + H(m, { money: true }).slice(1))} per mile.` },
  { id: 'tank', x: 't', y: 'W', xn: 'time', yn: 'water', xu: 'minutes', xu1: 'minute', xa: 'min', yu: 'gallons', yu1: 'gallon', ya: 'gal', xh: 'time', yh: 'water',
    ms: [-2, -3, -4, -5], bs: [40, 60, 80, 100], xMax: 10, bWhat: 'the water in the tank at the start',
    story: (m, b) => `A tank holds ${A(b + ' gallons')} and drains ${Bm(H(-m) + ' gallons')} per minute.` },
  { id: 'candle', x: 't', y: 'L', xn: 'time', yn: 'height', xu: 'hours', xu1: 'hour', xa: 'h', yu: 'inches', yu1: 'inch', ya: 'in.', xh: 'time', yh: 'height',
    ms: [-0.5, -1, -1.5, -2], bs: [8, 9, 10, 12], xMax: 4, bWhat: 'the candle’s height when it is lit',
    story: (m, b) => `A candle is ${A(b + ' in.')} tall when it is lit and burns down ${Bm(H(-m) + ' in.')} per hour.` },
  { id: 'savings', x: 'w', y: 'S', xn: 'time', yn: 'savings', xu: 'weeks', xu1: 'week', xa: 'wk', yu: 'dollars', yu1: 'dollar', ya: '$', xh: 'time', yh: 'saved', money: true,
    ms: [5, 10, 15, 20, 25], bs: [20, 30, 40, 50, 60], xMax: 8, bWhat: 'the money saved at the start',
    story: (m, b) => `Maya has ${A('$' + b)} saved and adds ${Bm('$' + m)} each week.` },
  { id: 'temp', x: 'h', y: 'T', xn: 'time', yn: 'temperature', xu: 'hours', xu1: 'hour', xa: 'h', yu: 'degrees Fahrenheit', yu1: 'degree Fahrenheit', ya: '°F', xh: 'time', yh: 'temp',
    ms: [-4, -3, -2, 2, 3, 4], bs: [-10, -6, -4, 4, 6, 10, 20], xMax: 6, bWhat: 'the temperature at midnight',
    story: (m, b) => `At midnight it is ${A(H(b) + '°F')}. After that the temperature ${m > 0 ? 'rises' : 'falls'} ${Bm(H(Math.abs(m)) + '°F')} each hour.` },
  { id: 'plant', x: 'w', y: 'H', xn: 'time', yn: 'height', xu: 'weeks', xu1: 'week', xa: 'wk', yu: 'inches', yu1: 'inch', ya: 'in.', xh: 'time', yh: 'height',
    ms: [0.5, 1, 1.5, 2, 3], bs: [2, 3, 4, 6], xMax: 8, bWhat: 'the height when it was planted',
    story: (m, b) => `A seedling is ${A(b + ' in.')} tall when it is planted and grows ${Bm(H(m) + ' in.')} per week.` },
  { id: 'card', x: 'n', y: 'B', xn: 'drinks bought', yn: 'balance', xu: 'drinks', xu1: 'drink', xa: 'drinks', yu: 'dollars', yu1: 'dollar', ya: '$', xh: 'drinks', yh: 'balance', money: true, count: true,
    ms: [-3, -4, -5], bs: [30, 40, 50, 60], xMax: 8, bWhat: 'the money on the card at the start',
    story: (m, b) => `A gift card starts with ${A('$' + b)}. Each drink costs ${Bm('$' + H(-m))}.` },
  { id: 'phone', x: 'g', y: 'C', xn: 'data', yn: 'cost', xu: 'GB', xu1: 'GB', xa: 'GB', yu: 'dollars', yu1: 'dollar', ya: '$', xh: 'data', yh: 'cost', money: true,
    ms: [5, 10, 15], bs: [20, 25, 30, 35], xMax: 6, bWhat: 'the base price of the plan',
    story: (m, b) => `A phone plan costs ${A('$' + b)} a month plus ${Bm('$' + m)} per GB of data.` },
  { id: 'pizza', x: 'p', y: 'C', xn: 'pizzas', yn: 'cost', xu: 'pizzas', xu1: 'pizza', xa: 'pizzas', yu: 'dollars', yu1: 'dollar', ya: '$', xh: 'pizzas', yh: 'cost', money: true, count: true,
    ms: [8, 10, 12], bs: [3, 4, 5, 6], xMax: 6, bWhat: 'the delivery fee',
    story: (m, b) => `A pizza place charges a ${A('$' + b)} delivery fee plus ${Bm('$' + m)} per pizza.` },
  { id: 'balloon', x: 't', y: 'E', xn: 'time', yn: 'height', xu: 'minutes', xu1: 'minute', xa: 'min', yu: 'feet', yu1: 'foot', ya: 'ft', xh: 'time', yh: 'height',
    ms: [-20, -25, -40, -50], bs: [400, 500, 600, 800, 1000], xMax: 10, bWhat: 'the balloon’s height at the start',
    story: (m, b) => `A hot-air balloon is ${A(b + ' ft')} up and comes down ${Bm(H(-m) + ' ft')} per minute.` },
  { id: 'gym', x: 'n', y: 'C', xn: 'time', yn: 'cost', xu: 'months', xu1: 'month', xa: 'mo', yu: 'dollars', yu1: 'dollar', ya: '$', xh: 'time', yh: 'cost', money: true,
    ms: [20, 25, 30, 35], bs: [40, 50, 60, 75, 100], xMax: 10, bWhat: 'the joining fee',
    story: (m, b) => `A gym charges a ${A('$' + b)} joining fee plus ${Bm('$' + m)} per month.` },
];
const ctxBy = (id: string) => CTX.find(c => c.id === id)!;
/** can this story's output be negative? (only the temperature) */
const negOk = (c: Ctx | null) => !c || c.id === 'temp';
/** for a decreasing story: the largest input before the output would go negative */
/** a start high enough that the story's output stays at or above 0 over these inputs */
const liftB = (c: Ctx | null, m: number, b: number, xs: number[]) => { if (negOk(c) || m >= 0) return b; const need = -m * Math.max(...xs); return b >= need ? b : Math.ceil(need / 5) * 5; };
/** the last input of a graph window: where a decreasing amount runs out, at most the story's usual last input */
const xEnd = (c: Ctx, m: number, b: number) => (negOk(c) || m >= 0 ? c.xMax : Math.max(2, Math.min(c.xMax, Math.floor(-b / m))));
const pickCtx = (R: () => number, ok: (c: Ctx) => boolean = () => true) => pick(R, CTX.filter(ok));
/** an output amount with its unit: $34, $2.50, 40 gal, −6°F, 5 in. */
function amt(c: Ctx, v: number): string {
  if (c.money) return H(v, { money: true });
  return c.ya === '°F' ? `${H(v)}°F` : `${H(v)} ${c.ya}`;
}
const xAmt = (c: Ctx, v: number) => `${H(v)} ${Math.abs(v) === 1 ? c.xu1 : c.xu}`;
const yAmtWords = (c: Ctx, v: number) => (c.money ? H(v, { money: true }) : `${H(v)} ${Math.abs(v) === 1 ? c.yu1 : c.yu}`);
/** the rate in words: $8 per hour, 3 gallons per minute, 2°F per hour */
const rateW = (c: Ctx, m: number) => `${amt(c, Math.abs(m))} per ${c.xu1}`;
/** a unit symbol as upright TeX: $, °F, gal, in. */
const uT = (u: string) => (u === '$' ? '\\$' : u === '°F' ? '{}^{\\circ}\\mathrm{F}' : `\\text{${u}}`);
const axisX = (c: Ctx) => (c.count ? c.xn : `${c.xn} (${c.xa})`), axisY = (c: Ctx) => `${c.yn} (${c.ya})`;
/** the equation of a context in its letters */
const ctxEqT = (c: Ctx, m: number, b: number, form?: Form) => eqTex(m, b, { x: c.x, y: c.y, form });
const ctxEqH = (c: Ctx, m: number, b: number, form?: Form) => eqHtml(m, b, { x: c.x, y: c.y, form });
const defineVars = (c: Ctx) => `${I(c.y)} is the ${c.yn} in ${c.yu} and ${I(c.x)} is the ${c.xn === 'time' ? 'time' : c.xn} in ${c.xu}.`;

// ---------- windows ----------
const ax = (w: { min: number; max: number; step: number }, name: string, ticks = true): LMAxis => ({ ...w, name, ticks });
/** an x axis 0..xMax (on grid lines) */
function xAxis(xMax: number, name: string, lines = 8): LMAxis { return ax(windowFor([0, xMax], { lines }), name); }
/** a y window holding every value and the line across the x window */
function yAxisFor(vals: number[], lines: { m: number; b: number }[], X: LMAxis, name: string, nLines = 8): LMAxis {
  const all = [...vals];
  for (const L of lines) all.push(f(L.m, L.b, X.min), f(L.m, L.b, X.max));
  return ax(windowFor(all, { lines: nLines, pad: true }), name);
}
const tableOf = (c: Ctx, xs: number[], ys: (number | null)[]) => ({ xs, ys, xHead: [c.xh, c.count ? '' : `(${c.xa})`] as [string, string], yHead: [c.yh, `(${c.ya})`] as [string, string] });
const xyTable = (xs: number[], ys: (number | null)[]) => ({ xs, ys, xHead: ['x', ''] as [string, string], yHead: ['y', ''] as [string, string] });

// ======================================================================================================
// 1 rate-unit-steps · 3 rate-uneven-steps: tableRate
// ======================================================================================================
const tableRate: Gen = (R, n, sg) => {
  const uneven = sg === 'rate-uneven-steps';
  const abstract = !uneven && R() < 0.35;
  const c = abstract ? null : pickCtx(R, k => !k.count && (uneven || Math.abs(k.ms[0]!) <= 20));
  let m: number, b: number;
  if (c) { m = pick(R, c.ms); b = pick(R, c.bs); }
  else { m = R() < 0.12 ? 0 : pick(R, [-6, -5, -4, -3, -2, 2, 3, 4, 5, 6]); b = int(R, -10, 12); }
  // input steps: 1 (rate-unit-steps); 2, 5, 10 or unequal (rate-uneven-steps)
  let gaps: number[];
  if (!uneven) gaps = [1, 1, 1];
  else if (R() < 0.35) gaps = shuffle(R, [1, 2, 3]);
  else { const g = pick(R, c && c.xMax >= 10 ? [2, 5] : [2]); gaps = [g, g, g]; }
  const x0 = uneven ? 0 : int(R, 0, 2);
  const xs = [x0]; for (const g of gaps) xs.push(xs[xs.length - 1]! + g);
  b = liftB(c, m, b, xs);
  const ys = xs.map(x => f(m, b, x));
  const g0 = gaps[0]!, d0 = ys[1]! - ys[0]!;
  const X = xAxis(xs[xs.length - 1]!, c ? axisX(c) : 'x', 6);
  const Y = yAxisFor([...ys, b], [{ m, b }], X, c ? axisY(c) : 'y', 7);
  const unitTxt = c ? `${c.money ? 'dollars' : c.yu} per ${c.xu1}` : '';
  const sameGap = gaps.every(g => g === g0);
  const ask = c
    ? `The table shows the ${c.yn} for different amounts of ${c.xn}. By how much does the ${c.yn} change for ONE ${c.xu1}? (A decrease is negative.)`
    : `This table is linear. By how much does ${I('y')} change when ${I('x')} goes up by 1?`;
  return numItem({
    id: `tableRate-${n}`, family: 'tableRate', prompt: ask,
    board: `m = \\dfrac{\\text{change in } ${c ? c.y : 'y'}}{\\text{change in } ${c ? c.x : 'x'}}`,
    unit: unitTxt,
    picture: { lf: { lm: { x: X, y: Y, table: c ? tableOf(c, xs, ys) : xyTable(xs, ys), lines: [{ m, b }], pts: xs.map((x, i) => ({ x, y: ys[i]! })), step: { x: xs[0]!, y: ys[0]!, run: g0, rise: d0 } },
      show: ['axes', 'table', 'points'], solve: ['step', 'line'],
      tex: [`m = \\dfrac{${T(ys[1]!)} - ${par(ys[0]!)}}{${T(xs[1]!)} - ${par(xs[0]!)}}`, `= \\dfrac{${T(d0)}}{${g0}} = ${T(m)}`] } },
    solution: [
      `From ${I(c ? c.x : 'x')} = ${H(xs[0]!)} to ${H(xs[1]!)} the input goes up ${g0}, and the output changes by ${H(d0)}.`,
      g0 === 1 ? `That is already ONE unit of input: the rate is <b class="s">${H(m)}</b>.` : `Per ONE unit: ${H(d0)} ÷ ${g0} = <b class="s">${H(m)}</b>.`,
      sameGap ? `Every row changes the same way, so the rate is the same all along the line.` : `Check another gap: ${H(ys[2]! - ys[1]!)} ÷ ${gaps[1]} = ${H(m)} too.`,
    ],
  }, m, v => {
    if (sameValue(v, q(m))) return ok(`Yes: ${H(m)} for every one ${c ? c.xu1 : 'unit of x'}.`);
    if (g0 > 1 && near(v, d0)) return no(`${H(d0)} is the change for ${g0} ${c ? c.xu : 'units'}. For ONE, divide by ${g0}.`, MC.inputStep);
    if (!sameGap && gaps.some((g, i) => near(v, ys[i + 1]! - ys[i]!))) return no(`That is the change for one row, but the rows are not one unit apart. Divide by the input step.`, MC.inputStep);
    if (m !== 0 && near(v, -m)) return no(`Look at the direction: the output goes ${m < 0 ? 'down' : 'up'}, so the rate is ${m < 0 ? 'negative' : 'positive'}.`, MC.sign);
    if (ys.some(y => near(v, y)) && !near(v, m)) return no(`That is an output, a height on the graph. The rate is how much the output CHANGES per one unit.`, MC.height);
    if (near(v, b) && b !== m) return no(`${H(b)} is the output at input 0, the start. The rate is the change per one unit.`, MC.swap);
    return no(`Take two rows: change in output ÷ change in input.`);
  });
};

// ======================================================================================================
// 1 rate-unit-steps · 7 parameter-effects-on-graph: fasterLine (the higher line grows more slowly)
// ======================================================================================================
const fasterLine: Gen = (R, n, sg) => {
  const c = pickCtx(R, k => ['savings', 'plant', 'gym', 'phone'].includes(k.id));
  const [nA, nB] = shuffle(R, NAMES.slice()).slice(0, 2) as [string, string];
  const ms = c.ms.slice().sort((a, b) => a - b);
  const i = int(R, 0, ms.length - 2);
  const mA = ms[i]!, mB = ms[int(R, i + 1, ms.length - 1)]!;
  const X = xAxis(c.xMax >= 8 ? 6 : 4, axisX(c), 6);
  const bB = pick(R, c.bs.filter(v => v <= c.bs[c.bs.length - 2]!));
  const gapMin = (mB - mA) * X.max;
  const bA = bB + gapMin + pick(R, [2, 3, 4]) * (c.money ? 10 : 1);
  const Y = yAxisFor([bA, bB], [{ m: mA, b: bA }, { m: mB, b: bB }], X, axisY(c), 8);
  const param = sg === 'parameter-effects-on-graph';
  const who = (s: string) => (c.id === 'plant' ? `${s}’s plant` : `${s}’s plan`);
  const prompt = param
    ? `Two lines: ${who(nA)} and ${who(nB)}. ${who(nA)} is higher everywhere on the graph. Which line has the greater slope ${I('m')}?`
    : `${who(nA)} and ${who(nB)} are on the graph. Which ${c.yn} grows faster, by more per ${c.xu1}?`;
  return choiceItem(R, {
    id: `fasterLine-${n}`, family: 'fasterLine', prompt, board: `\\text{more per 1 ${c.xa}\\,?}`,
    picture: { lf: { lm: { x: X, y: Y, lines: [{ m: mB, b: bB, name: nB, col: 'link' }, { m: mA, b: bA, name: nA, col: 'water' }], step: { x: 0, y: bB, run: X.step, rise: mB * X.step } },
      show: ['axes', 'line', 'line2'], solve: ['step', 'start'],
      tex: [`\\text{${nA}: } ${T(mA)}\\ \\text{per ${c.xa}}`, `\\text{${nB}: } ${T(mB)}\\ \\text{per ${c.xa}}`] } },
    solution: [`${who(nA)} starts higher (${amt(c, bA)}), but height is not speed.`, `${who(nB)} grows ${rateW(c, mB)}; ${who(nA)} grows ${rateW(c, mA)}. ${nB}’s line is steeper: the greater rate.`],
  }, [
    { t: `${who(nB)}`, ok: true, say: `Yes: ${rateW(c, mB)} beats ${rateW(c, mA)}, even though ${nB}’s line is lower.` },
    { t: `${who(nA)}: its line is higher`, mc: MC.height, say: `Higher means more ${c.yn} right now, not more per ${c.xu1}. Compare how much each line goes up for one ${c.xu1}.` },
    { t: `They grow at the same rate`, say: `Compare one step of ${X.step} ${c.xu}: ${nB}’s line climbs ${amt(c, mB * X.step)}, ${nA}’s only ${amt(c, mA * X.step)}.` },
  ]);
};

// ======================================================================================================
// 2 initial-value-at-zero · 4 extrapolate-initial-value: startTable
// ======================================================================================================
const startTable: Gen = (R, n, sg) => {
  const back = sg !== 'initial-value-at-zero';
  const negB = back && R() < 0.3;
  const c = negB ? (R() < 0.5 ? ctxBy('temp') : null) : pickCtx(R, k => !k.count || !back);
  let m: number, b: number;
  if (c) { m = pick(R, c.ms); b = negB ? pick(R, c.bs.filter(v => v < 0)) : pick(R, c.bs.filter(v => v > 0)); }
  else { m = pick(R, [2, 3, 4, 5, -2, -3]); b = negB ? -int(R, 2, 9) : int(R, 2, 12); }
  if (negB && m < 0) m = -m;   // a negative start that rises (temperature after a cold night)
  const gap = back ? pick(R, [1, 2]) : 1;
  const x0 = back ? pick(R, [2, 4, 6].filter(v => v % gap === 0)) : 0;
  let xs = [0, 1, 2, 3].map(k => x0 + k * gap);
  b = liftB(c, m, b, xs);
  const ys0 = xs.map(x => f(m, b, x));
  // initial-value-at-zero: reordered rows, the 0 row never first
  let order = [0, 1, 2, 3];
  if (!back) { order = shuffle(R, [0, 1, 2, 3]); if (order[0] === 0) order.push(order.shift()!); }
  xs = order.map(i => xs[i]!); const ys = order.map(i => ys0[i]!);
  const X = xAxis(Math.max(...xs), c ? axisX(c) : 'x', 6);
  const Y = yAxisFor([...ys, b], [{ m, b }], X, c ? axisY(c) : 'y', 7);
  const first = ys[0]!, fx = xs[0]!;
  const prompt = back
    ? `${c ? `The table shows the ${c.yn} at a few ${c.xu}.` : 'The table shows a linear function.'} It does not show input 0. What is the initial value ${I('b')}, the output at input 0?`
    : `${c ? `The table shows the ${c.yn} over ${c.xn}, in no particular order.` : 'The rows of this linear table are mixed up.'} What is the initial value ${I('b')}, the output at input 0?`;
  const mx0 = m * x0;
  return numItem({
    id: `startTable-${n}`, family: 'startTable', prompt, board: `b = ${c ? c.y : 'y'}\\ \\text{at}\\ ${c ? c.x : 'x'} = 0`, unit: c ? (c.money ? 'dollars' : c.ya) : '',
    picture: { lf: { lm: { x: X, y: Y, table: c ? tableOf(c, xs, ys) : xyTable(xs, ys), lines: [{ m, b }], pts: xs.map((x, i) => ({ x, y: ys[i]! })), backFrom: Math.min(...xs) },
      show: ['axes', 'table', 'points'], solve: back ? ['line', 'back', 'start'] : ['start', 'line'], row: back ? undefined : order.indexOf(0),
      tex: back ? [`m = ${T(m)}\\ \\text{per ${c ? c.xa : 'unit'}}`, `b = ${T(ys0[0]!)} - ${par(m)}\\cdot ${x0} = ${T(b)}`] : [`${c ? c.x : 'x'} = 0 \\;\\Rightarrow\\; b = ${T(b)}`] } },
    solution: back ? [
      `Rate: ${H(ys0[1]! - ys0[0]!)} for every ${gap} ${c ? c.xu : 'units'}, so ${H(m)} per one.`,
      `Go back from ${I(c ? c.x : 'x')} = ${x0} to 0: that is ${x0} units, so take away ${H(m)} × ${x0} = ${H(mx0)}.`,
      `${H(ys0[0]!)} − (${H(mx0)}) = <b class="s">${H(b)}</b>${c ? ` (${c.bWhat})` : ''}.`,
    ] : [`Find the row with input 0 (it is not the first row).`, `There the output is <b class="s">${H(b)}</b>: that is ${I('b')}.`],
  }, b, v => {
    if (sameValue(v, q(b))) return ok(`Yes: ${I('b')} = ${H(b)}, the output at input 0.`);
    if (near(v, first) && fx !== 0) return no(`${H(first)} is the output at input ${H(fx)}, the first row shown. ${I('b')} is the output at input 0.`, MC.firstOut);
    if (back && near(v, ys0[0]! + mx0)) return no(`Going back to input 0 undoes the change: subtract ${H(m)} × ${x0}, don’t add it.`, MC.backSign);
    if (near(v, m) && m !== b) return no(`${H(m)} is the change per one unit, the rate. ${I('b')} is the output at input 0.`, MC.swap);
    if (v === 0 && b !== 0) return no(`A linear function does not have to start at 0. Work back to input 0 with the rate.`, MC.propo);
    return no(back ? `Find the rate per one unit, then go back ${x0} units to input 0.` : `Look for the row where the input is 0.`);
  });
};

// ======================================================================================================
// 2 initial-value-at-zero · 4 extrapolate-initial-value · 11 back-solve-b: startGraph
// ======================================================================================================
const startGraph: Gen = (R, n, sg) => {
  if (sg === 'initial-value-at-zero') {
    // the line crosses the y-axis on a grid line; a negative b sometimes; the x-intercept is a distractor
    const m = pick(R, [-2, -1, 1, 2, 0.5, -0.5, 1.5]);
    const b = pick(R, [-5, -4, -3, -2, -1, 1, 2, 3, 4, 5]);
    const X = ax({ min: -6, max: 6, step: 1 }, 'x'), Y2 = ax({ min: -6, max: 6, step: 1 }, 'y');
    const xi = -b / m;
    return numItem({
      id: `startGraph-${n}`, family: 'startGraph', prompt: `Where does this line cross the ${I('y')}-axis? Type the initial value ${I('b')}.`,
      board: `b = \\,?`, unit: '',
      picture: { lf: { lm: { x: X, y: Y2, lines: [{ m, b }] }, show: ['axes', 'line'], solve: ['start'], tex: [`x = 0 \\;\\Rightarrow\\; y = ${T(b)}`, `b = ${T(b)}`] } },
      solution: [`The ${I('y')}-axis is where ${I('x')} = 0.`, `The line meets it at (0, ${H(b)}), so ${I('b')} = <b class="s">${H(b)}</b>.`],
    }, b, v => {
      if (near(v, b)) return ok(`Yes: the line crosses the ${I('y')}-axis at (0, ${H(b)}).`);
      if (near(v, xi)) return no(`${H(xi)} is where the line crosses the ${I('x')}-axis (output 0). ${I('b')} is the output at input 0.`, MC.zeroSwap);
      if (near(v, -b)) return no(`Check the sign: the line crosses ${b < 0 ? 'below' : 'above'} the ${I('x')}-axis.`);
      if (near(v, m)) return no(`${H(m)} is the slope. ${I('b')} is where the line meets the ${I('y')}-axis.`, MC.swap);
      return no(`Find the point on the line with ${I('x')} = 0.`);
    });
  }
  // a window that does NOT include the y-axis: two marked points; work back to 0 (the left edge is not the axis)
  const c = R() < 0.6 ? pickCtx(R, k => ['savings', 'plant', 'gym', 'balloon', 'phone'].includes(k.id)) : null;
  const m = c ? pick(R, c.ms) : pick(R, [2, 3, 4, -2, -3]);
  const b = c ? pick(R, c.bs) : int(R, 3, 15);
  const x0 = pick(R, c && c.xMax >= 10 ? [4, 5, 6] : [2, 3, 4]);
  const xs = Array.from({ length: 5 }, (_, k) => x0 + k);
  const X = ax({ min: x0, max: x0 + 4, step: 1 }, c ? axisX(c) : 'x');
  const ysAll = xs.map(x => f(m, b, x));
  const Y = ax(windowFor(ysAll, { zero: false, lines: 8 }), c ? axisY(c) : 'y');
  const xa = x0 + 1, xb = x0 + 3, ya = f(m, b, xa), yb = f(m, b, xb);
  const edge = f(m, b, X.min);
  return numItem({
    id: `startGraph-${n}`, family: 'startGraph',
    prompt: `${c ? `The graph shows the ${c.yn} from ${c.xn} ${x0} on.` : 'The graph window starts at x = ' + x0 + '.'} Points ${I('A')}(${xa}, ${H(ya)}) and ${I('B')}(${xb}, ${H(yb)}) are on the line. The window does not show ${I(c ? c.x : 'x')} = 0. What is ${I('b')}?`,
    board: `b = \\,?`, unit: c ? (c.money ? 'dollars' : c.ya) : '',
    picture: { lf: { lm: { x: X, y: Y, lines: [{ m, b }], pts: [{ x: xa, y: ya, name: 'A' }, { x: xb, y: yb, name: 'B' }], step: { x: xa, y: ya, run: 2, rise: yb - ya } },
      show: ['axes', 'line', 'points'], solve: ['step'],
      tex: [`m = \\dfrac{${T(yb)} - ${par(ya)}}{${xb} - ${xa}} = ${T(m)}`, `b = ${T(ya)} - ${par(m)}\\cdot ${xa} = ${T(b)}`] } },
    solution: [`The left edge of the window is ${I(c ? c.x : 'x')} = ${x0}, not the axis.`, `Rate: (${H(yb)} − ${H(ya)}) ÷ ${xb - xa} = ${H(m)} per unit.`, `Back from ${I('A')} to input 0: ${H(ya)} − ${H(m)} × ${xa} = <b class="s">${H(b)}</b>.`],
  }, b, v => {
    if (near(v, b)) return ok(`Yes: back from ${I('A')} by ${xa} units gives ${I('b')} = ${H(b)}.`);
    if (near(v, edge)) return no(`${H(edge)} is where the line meets the left EDGE of the window, at ${I(c ? c.x : 'x')} = ${x0}. The ${I('y')}-axis is further left, at 0.`, MC.window);
    if (near(v, ya) || near(v, yb)) return no(`That is the output at a marked point. ${I('b')} is the output at input 0, off the window.`, MC.firstOut);
    if (near(v, ya + m * xa)) return no(`Going back to 0 undoes the rate: subtract ${H(m)} × ${xa}.`, MC.backSign);
    return no(`Find the rate from ${I('A')} to ${I('B')}, then work back from ${I('A')} to input 0.`);
  });
};

// ======================================================================================================
// 3 rate-uneven-steps · 16 non-unit-scales: scaledRate (grid steps are not 1)
// ======================================================================================================
const scaledRate: Gen = (R, n, sg) => {
  const c = R() < 0.75 ? pickCtx(R, k => ['gym', 'balloon', 'savings', 'phone', 'taxi', 'tank'].includes(k.id)) : null;
  const xs = pick(R, sg === 'non-unit-scales' ? [5, 10, 2] : [2, 5, 10]);
  // in grid squares: the line climbs j squares for every k squares across (over 6 squares: at most 8 squares)
  const down = c ? c.ms[0]! < 0 : R() < 0.2;
  let m = 0, ysStep = 20, k = 1, j = 1;
  for (let tries = 0; tries < 60; tries++) {
    ysStep = pick(R, [4, 10, 20, 25, 50].filter(v => v !== xs));
    k = pick(R, [1, 2]); j = int(R, 1, 4);
    if ((6 * j) / k > 8 || !Number.isInteger((6 * j) / k)) continue;
    const mq = rat((down ? -j : j) * ysStep, k * xs);
    m = qNum(mq);
    if (terminates(mq) && Math.abs(m) >= 0.5) break;
  }
  const X = ax({ min: 0, max: xs * 6, step: xs }, c ? axisX(c) : 'x');
  const kA = k, kB = kA + k * (k === 1 ? int(R, 2, 3) : 1);
  const xA = kA * xs, xB = kB * xs;
  // b on a y grid line so both points sit on grid crossings
  const climb = (6 * j) / k;
  const bLines = down ? climb + int(R, 0, 2) : int(R, 0, 2);
  const b = bLines * ysStep;
  const yA = f(m, b, xA), yB = f(m, b, xB);
  const ny = Math.max(4, bLines + (down ? 0 : climb));
  const Y = ax({ min: 0, max: ny * ysStep, step: ysStep }, c ? axisY(c) : 'y');
  const squaresUp = (yB - yA) / ysStep, squaresAcross = (xB - xA) / xs;
  return numItem({
    id: `scaledRate-${n}`, family: 'scaledRate',
    prompt: `Read the scales: each grid square is ${xs} across and ${ysStep} up. What is the rate of change of the line, per ONE ${c ? c.xu1 : 'unit of x'}?`,
    board: `m = \\dfrac{\\text{change in } ${c ? c.y : 'y'}}{\\text{change in } ${c ? c.x : 'x'}}`, unit: c ? `${c.money ? 'dollars' : c.yu} per ${c.xu1}` : '',
    picture: { lf: { lm: { x: X, y: Y, lines: [{ m, b }], pts: [{ x: xA, y: yA, name: 'A' }, { x: xB, y: yB, name: 'B' }], step: { x: xA, y: yA, run: xB - xA, rise: yB - yA } },
      show: ['axes', 'line', 'points'], solve: ['step'], tex: [`m = \\dfrac{${T(yB - yA)}}{${xB - xA}} = ${T(m)}`] } },
    solution: [`${I('A')} = (${xA}, ${H(yA)}) and ${I('B')} = (${xB}, ${H(yB)}): read the numbers on the axes, not the squares.`,
      `Change in output ${H(yB - yA)}, change in input ${xB - xA}.`, `${H(yB - yA)} ÷ ${xB - xA} = <b class="s">${H(m)}</b> per one unit.`],
  }, m, v => {
    if (sameValue(v, q(m))) return ok(`Yes: ${H(yB - yA)} over ${xB - xA} is ${H(m)} per one unit.`);
    if (near(v, squaresUp / squaresAcross)) return no(`That counts squares. Each square is ${xs} across and ${ysStep} up, so use the axis numbers.`, MC.interval);
    if (near(v, yB - yA) || near(v, (yB - yA) / squaresAcross)) return no(`That is the change for more than one unit of input. Divide by the change in input, ${xB - xA}.`, MC.inputStep);
    if (near(v, (xB - xA) / (yB - yA))) return no(`Output change goes on top: ${H(yB - yA)} ÷ ${xB - xA}.`, MC.inverted);
    if (near(v, -m)) return no(`The line goes ${m < 0 ? 'down' : 'up'}: mind the sign.`, MC.sign);
    return no(`Read ${I('A')} and ${I('B')} from the axis numbers, then change in output ÷ change in input.`);
  });
};

// ======================================================================================================
// 5 verbal-rate-interpretation: rateSentence
// ======================================================================================================
const rateSentence: Gen = (R, n) => {
  const zero = R() < 0.15;
  const c = zero ? ctxBy('bike') : pickCtx(R, k => k.id !== 'card');
  const m = zero ? 0 : pick(R, c.ms);
  const gap = pick(R, [1, 1, 2]);
  const xs = [0, 1, 2, 3].map(k => k * gap);
  const b = liftB(c, m, pick(R, c.bs.filter(v => v > 0)), xs), ys = xs.map(x => f(m, b, x));
  const X = xAxis(xs[3]!, axisX(c), 6), Y = yAxisFor([...ys, 0], [{ m, b }], X, axisY(c), 7);
  const up = m > 0, am = amt(c, Math.abs(m));
  const right = m === 0 ? `The ${c.yn} stays ${amt(c, b)}: it changes by 0 for every ${c.xu1}.`
    : `The ${c.yn} goes ${up ? 'up' : 'down'} ${am} for every 1 ${c.xu1}.`;
  const opts: Opt[] = [{ t: right, ok: true, say: m === 0 ? `Yes: a zero rate means a flat line.` : `Yes: ${am} ${up ? 'more' : 'less'} for each ${c.xu1}, and it says which way.` }];
  if (m !== 0) {
    opts.push({ t: `The ${c.yn} is ${am}.`, mc: MC.perUnit, say: `${am} is not the ${c.yn} itself. It is how much the ${c.yn} changes for each ${c.xu1}.` });
    opts.push({ t: `The ${c.yn} goes ${up ? 'up' : 'down'} 1 ${c.money ? 'dollar' : c.yu1} for every ${H(Math.abs(m))} ${c.xu}.`, mc: MC.inverted, say: `That flips the rate. Output per input: ${am} for each ONE ${c.xu1}.` });
    if (!up) opts.push({ t: `The ${c.yn} goes up ${am} for every 1 ${c.xu1}.`, mc: MC.sign, say: `The outputs get smaller, so the ${c.yn} goes DOWN.` });
    if (!up) opts.push({ t: `The ${c.yn} is ${amt(c, m)}.`, mc: MC.negAmount, say: `A negative rate means the amount goes down. The ${c.yn} itself starts at ${amt(c, b)}.` });
    if (gap > 1) opts.push({ t: `The ${c.yn} goes ${up ? 'up' : 'down'} ${amt(c, Math.abs(m * gap))} for every 1 ${c.xu1}.`, mc: MC.inputStep, say: `${amt(c, Math.abs(m * gap))} is the change for ${gap} ${c.xu}. Per ONE ${c.xu1} it is ${am}.` });
  } else {
    opts.push({ t: `The ${c.yn} goes up ${amt(c, b)} for every 1 ${c.xu1}.`, mc: MC.swap, say: `${amt(c, b)} is the amount at the start. The table never changes, so the rate is 0.` });
    opts.push({ t: `There is no rate: nothing happens.`, say: `There is a rate: 0 per ${c.xu1}. A flat line has slope 0.` });
  }
  const pickd = [opts[0]!, ...shuffle(R, opts.slice(1)).slice(0, 2)];
  return choiceItem(R, {
    id: `rateSentence-${n}`, family: 'rateSentence', prompt: `${zero ? `A bike shop sells a day pass for ${A('$' + b)}: the price is the same however many hours you ride.` : `The table shows the ${c.yn} for different amounts of ${c.xn}.`} Which sentence describes the rate of change?`,
    board: `\\text{rate} = \\,?\\ \\text{per ${c.xa}}`,
    picture: { lf: { lm: { x: X, y: Y, table: tableOf(c, xs, ys), lines: [{ m, b }], pts: xs.map((x, i) => ({ x, y: ys[i]! })), step: { x: xs[0]!, y: ys[0]!, run: gap, rise: m * gap } },
      show: ['axes', 'table', 'points'], solve: ['step', 'line'], tex: [`m = \\dfrac{${T(m * gap)}}{${gap}} = ${T(m)}\\ \\text{per ${c.xa}}`] } },
    solution: [`Each row: ${gap === 1 ? 'one' : gap} ${gap === 1 ? c.xu1 : c.xu} more, ${m === 0 ? 'no change in' : amt(c, Math.abs(m * gap)) + (up ? ' more' : ' less')} ${c.yn}.`,
      `Say both quantities, the direction and “per one ${c.xu1}”: ${right}`],
  }, pickd);
};

// ======================================================================================================
// 5 verbal-rate-interpretation · 18 slope-units · 20 intercept-units: rateUnit
// ======================================================================================================
const rateUnit: Gen = (R, n, sg) => {
  const c = pickCtx(R, k => !['card', 'pizza'].includes(k.id));
  const m = pick(R, c.ms), b = pick(R, c.bs);
  const what = sg === 'intercept-units' ? 'b' : sg === 'slope-units' ? pick(R, ['m', 'mx'] as const) : 'm';
  const X = xAxis(xEnd(c, m, b), axisX(c), 6), Y = yAxisFor([b], [{ m, b }], X, axisY(c), 7);
  const yU = c.yu, xU1 = c.xu1, xU = c.xu;
  const perU = `${yU} per ${xU1}`, inv = `${xU} per ${c.yu1}`;
  const termT = what === 'm' ? T(m) : what === 'b' ? T(b) : `${T(m)}${c.x}`;
  const termH = what === 'm' ? H(m) : what === 'b' ? H(b) : `${H(m)}${I(c.x)}`;
  const opts: Opt[] = what === 'm' ? [
    { t: cap(perU), ok: true, say: `Yes: change in ${c.yn} (${yU}) over change in ${c.xn} (${xU}): ${perU}.` },
    { t: cap(inv), mc: MC.inverted, say: `The slope is change in OUTPUT ÷ change in INPUT, so ${yU} on top: ${perU}.` },
    { t: cap(yU), mc: MC.perUnit, say: `${H(m)} ${yU} is not an amount you have. It is ${yU} for EACH ${xU1}: ${perU}.` },
  ] : what === 'b' ? [
    { t: cap(yU), ok: true, say: `Yes: ${I('b')} is an output, the ${c.yn} at 0 ${xU}, so it is in ${yU}.` },
    { t: cap(perU), mc: MC.unitsWrong, say: `${I('b')} is paid or measured once, at 0 ${xU}. It is an amount in ${yU}, not a rate.` },
    { t: cap(xU), mc: MC.bInputUnits, say: `${I('b')} sits on the ${c.yn} axis: it is a ${c.yn}, in ${yU}.` },
  ] : [
    { t: cap(yU), ok: true, say: `Yes: (${perU}) × ${xU} = ${yU}. That is why ${termH} can be added to ${H(b)}.` },
    { t: cap(perU), mc: MC.unitsWrong, say: `Multiply the units: (${yU} per ${xU1}) × ${xU} = ${yU}. Only ${yU} can be added to ${H(b)} ${yU}.` },
    { t: cap(xU), say: `${termH} is ${c.yn}: the ${xU} cancel. (${yU} per ${xU1}) × ${xU} = ${yU}.` },
  ];
  const ask = what === 'm' ? `What is the unit of the slope ${I('m')} = ${H(m)}?` : what === 'b' ? `What is the unit of ${I('b')} = ${H(b)}?` : `What is the unit of the term ${termH}?`;
  return choiceItem(R, {
    id: `rateUnit-${n}`, family: 'rateUnit', prompt: `${c.story(m, b)} The equation is ${ctxEqH(c, m, b)}, where ${defineVars(c)} ${ask}`,
    board: ctxEqT(c, m, b),
    picture: { lf: { lm: { x: X, y: Y, lines: [{ m, b }], step: what !== 'b' ? { x: 0, y: b, run: X.step, rise: m * X.step } : undefined },
      show: ['axes', 'line'], solve: what === 'b' ? ['start'] : ['step'],
      tex: what === 'b' ? [`b = ${T(b)}\\ ${uT(c.ya)}`] : what === 'm' ? [`m:\\ \\dfrac{${uT(c.ya)}}{${uT(c.xa)}}`] : [`\\dfrac{${uT(c.ya)}}{${uT(c.xa)}}\\times ${uT(c.xa)}`, `= ${uT(c.ya)}`] } },
    solution: what === 'b' ? [`${I('b')} = ${H(b)} is the ${c.yn} at 0 ${xU}: an output, so its unit is ${yU}.`]
      : what === 'm' ? [`Slope = change in ${c.yn} ÷ change in ${c.xn}.`, `So its unit is ${yU} ÷ ${xU}: <b class="s">${perU}</b>.`]
        : [`${H(m)} is in ${perU}; ${I(c.x)} is in ${xU}.`, `${perU} × ${xU} = <b class="s">${yU}</b>: the same unit as ${I(c.y)} and ${I('b')}.`],
  }, opts);
};

// ======================================================================================================
// 6 identify-m-b-in-equation: pickMB (no picture: a graph would give the numbers away)
// ======================================================================================================
interface EqForm { tex: string; html: string; m: number; b: number; first: number; note: string; x: string; y: string }
function eqForm(R: () => number): EqForm {
  const kind = pick(R, ['std', 'const', 'sub', 'b0', 'm0', 'm1', 'mneg1'] as const);
  if (kind === 'const') {
    const [y, x, m, b] = pick(R, [['C', 'm', 0.4, 25], ['C', 'g', 12, 30], ['P', 'n', 2.5, 15], ['T', 'h', 3, 48]] as const);
    const mm = m === 0.4 ? pick(R, [0.4, 0.25, 0.75]) : m, bb = b + int(R, 0, 5) * 5;
    return { tex: `${y} = ${T(bb)} + ${T(mm)}${x}`, html: `${I(y)} = ${H(bb)} + ${H(mm)}${I(x)}`, m: mm, b: bb, first: bb, note: 'the constant is written first', x, y };
  }
  if (kind === 'sub') {
    const [y, x] = pick(R, [['V', 't'], ['W', 't'], ['B', 'n']] as const);
    const b = pick(R, [900, 1200, 450, 600, 80]), m = -pick(R, [15, 25, 45, 50, 4]);
    return { tex: `${y} = ${b} - ${-m}${x}`, html: `${I(y)} = ${b} − ${-m}${I(x)}`, m, b, first: b, note: 'the rate is subtracted', x, y };
  }
  if (kind === 'b0') { const m = pick(R, [3, 4, -2, 5, 7]); return { tex: `y = ${T(m)}x`, html: `${I('y')} = ${H(m)}${I('x')}`, m, b: 0, first: m, note: 'there is no constant', x: 'x', y: 'y' }; }
  if (kind === 'm0') { const b = pick(R, [7, -3, 12, 5]); return { tex: `y = ${T(b)}`, html: `${I('y')} = ${H(b)}`, m: 0, b, first: b, note: 'there is no x-term', x: 'x', y: 'y' }; }
  if (kind === 'm1') { const b = pick(R, [3, -4, 6, -2, 9]); return { tex: eqTex(1, b), html: eqHtml(1, b), m: 1, b, first: b, note: 'x has no number in front', x: 'x', y: 'y' }; }
  if (kind === 'mneg1') { const b = pick(R, [4, -5, 2, 8]); return { tex: eqTex(-1, b), html: eqHtml(-1, b), m: -1, b, first: b, note: '−x means −1 times x', x: 'x', y: 'y' }; }
  const m = pick(R, [-6, -4, -3, -2, 2, 3, 5, 6]), b = pick(R, [-8, -5, -3, -1, 1, 4, 7, 9]);
  return { tex: eqTex(m, b), html: eqHtml(m, b), m, b, first: m, note: 'the usual order', x: 'x', y: 'y' };
}
const pickMB: Gen = (R, n) => {
  const e = eqForm(R);
  const askM = e.m === 0 ? R() < 0.6 : e.b === 0 ? R() < 0.4 : R() < 0.5;
  const ans = askM ? e.m : e.b;
  return numItem({
    id: `pickMB-${n}`, family: 'pickMB', prompt: `In ${e.html}, what is ${askM ? `the slope ${I('m')} (the coefficient of ${I(e.x)})` : `the initial value ${I('b')} (the constant term)`}?`,
    board: e.tex, unit: '', slateTex: [`m = ${T(e.m)},\\quad b = ${T(e.b)}`],
    solution: [`${I('m')} is the number that multiplies ${I(e.x)}; ${I('b')} is the number added on its own. Here ${e.note}.`, `${I('m')} = ${H(e.m)}, ${I('b')} = ${H(e.b)}, so the answer is <b class="s">${H(ans)}</b>.`],
  }, ans, v => {
    if (near(v, ans)) return ok(`Yes: ${askM ? I('m') : I('b')} = ${H(ans)}.`);
    const other = askM ? e.b : e.m;
    if (ans < 0 && near(v, -ans)) return no(`Keep the sign in front of the term: ${askM ? `−${H(-e.m)}${I(e.x)}` : `− ${H(-e.b)}`} means ${H(ans)}.`, MC.termSign);
    if (near(v, other) && e.first === other && other !== ans) return no(`The first number written is not always ${askM ? I('m') : I('b')}. ${askM ? `${I('m')} multiplies ${I(e.x)}` : `${I('b')} stands alone`}.`, MC.position);
    if (near(v, other) && other !== ans) return no(`That is ${askM ? I('b') : I('m')}. ${askM ? `${I('m')} is the number that multiplies ${I(e.x)}` : `${I('b')} is the number on its own`}.`, MC.swap);
    return no(askM ? `Find the number in front of ${I(e.x)} (with its sign).` : `Find the number added on its own (0 if there is none).`);
  });
};

// ======================================================================================================
// 6 identify-m-b-in-equation: sameFunction
// ======================================================================================================
const sameFunction: Gen = (R, n) => {
  let m = 0, b = 0;
  while (m === 0 || b === 0 || Math.abs(m) === Math.abs(b)) { m = int(R, -9, 9); b = int(R, -9, 9); }
  const rightForm: Form = pick(R, ['b+mx', 'mx+b']);
  const opts: Opt[] = [
    { t: eqHtml(m, b, { form: rightForm }), ok: true, say: `Yes: ${H(m)} multiplies ${I('x')} and ${H(b)} stands alone, in either order.` },
    { t: eqHtml(b, m), mc: MC.swap, say: `There ${H(b)} multiplies ${I('x')}: that makes ${H(b)} the slope. Swapped.` },
    { t: `${I('y')} = ${H(m)} ${b < 0 ? '−' : '+'} ${H(Math.abs(b))}${I('x')}`, mc: MC.position, say: `The first number is not always the slope. In that equation ${H(m)} stands alone, so it is ${I('b')}.` },
  ];
  if (m < 0) opts.push({ t: eqHtml(-m, b), mc: MC.termSign, say: `The slope is ${H(m)}: the minus sign belongs to the ${I('x')}-term.` });
  return choiceItem(R, {
    id: `sameFunction-${n}`, family: 'sameFunction', prompt: `Which equation has slope ${I('m')} = ${H(m)} and initial value ${I('b')} = ${H(b)}?`,
    board: `m = ${T(m)},\\quad b = ${T(b)}`, slateTex: [eqTex(m, b)],
    solution: [`${I('m')} multiplies ${I('x')}; ${I('b')} is added on its own. The order of the terms does not matter.`, `So ${eqHtml(m, b)} or ${eqHtml(m, b, { form: 'b+mx' })}.`],
  }, [opts[0]!, ...shuffle(R, opts.slice(1)).slice(0, 2)]);
};

// ======================================================================================================
// 7 parameter-effects-on-graph: whatChanged · predictShift
// ======================================================================================================
const whatChanged: Gen = (R, n) => {
  const kind = pick(R, ['b', 'm', 'flip'] as const);
  const m1 = pick(R, [1, 2, 0.5, 3, -1, -2]), b1 = int(R, -3, 3);
  let m2 = m1, b2 = b1;
  if (kind === 'b') { while (b2 === b1) b2 = b1 + pick(R, [-4, -3, -2, 2, 3, 4]); }
  else if (kind === 'm') m2 = pick(R, [m1 * 2, m1 * 3, m1 / 2].filter(v => terminates(q(v)) && Math.abs(v) <= 4));
  else m2 = -m1;
  const X = ax({ min: -5, max: 5, step: 1 }, 'x');
  const Y = ax({ min: -10, max: 10, step: 2 }, 'y');
  const d = b2 - b1;
  const steeper = Math.abs(m2) > Math.abs(m1);
  const right = kind === 'b' ? `Only ${I('b')}: ${I('B')} is ${I('A')} moved ${d > 0 ? 'up' : 'down'} ${Math.abs(d)}, just as steep`
    : kind === 'm' ? `Only ${I('m')}: ${I('B')} is ${steeper ? 'steeper' : 'less steep'}, through the same point on the ${I('y')}-axis`
      : `Only ${I('m')}: ${I('B')} ${m2 < 0 ? 'falls' : 'rises'} instead of ${m1 < 0 ? 'falling' : 'rising'}, through the same point on the ${I('y')}-axis`;
  const opts: Opt[] = [{ t: right, ok: true, say: kind === 'b' ? `Yes: parallel lines have the same slope; only the start moved.` : `Yes: both lines cross the ${I('y')}-axis at the same point, so ${I('b')} is the same.` }];
  if (kind === 'b') {
    opts.push({ t: `Only ${I('m')}: ${I('B')} is steeper because it is ${d > 0 ? 'higher' : 'lower'}`, mc: MC.height, say: `Higher is not steeper. The two lines are parallel: same slope, different ${I('b')}.` });
    opts.push({ t: `Both ${I('m')} and ${I('b')} changed`, say: `The lines are parallel, so the slope did not change. Only the crossing on the ${I('y')}-axis moved.` });
  } else {
    opts.push({ t: `Only ${I('b')}: ${I('B')} moved ${pick(R, ['up', 'down'])}`, mc: MC.swap, say: `Both lines cross the ${I('y')}-axis at the same point, so ${I('b')} did not change. The slope did.` });
    opts.push({ t: `Both ${I('m')} and ${I('b')} changed`, say: `They share the point (0, ${H(b1)}), so ${I('b')} is the same. Only the slope changed.` });
  }
  return choiceItem(R, {
    id: `whatChanged-${n}`, family: 'whatChanged', prompt: `Line ${I('A')} turned into line ${I('B')}. What changed in ${I('y')} = ${I('m')}${I('x')} + ${I('b')}?`,
    board: `y = mx + b`,
    picture: { lf: { lm: { x: X, y: Y, lines: [{ m: m1, b: b1, name: 'A', col: 'water' }, { m: m2, b: b2, name: 'B', col: 'link' }] }, show: ['axes', 'line', 'line2'], solve: [],
      tex: [`A:\\ ${eqTex(m1, b1)}`, `B:\\ ${eqTex(m2, b2)}`] } },
    solution: [`${I('b')} is where the line crosses the ${I('y')}-axis; ${I('m')} is how steep it is and which way it goes.`, `${I('A')}: ${eqHtml(m1, b1)}. ${I('B')}: ${eqHtml(m2, b2)}.`],
  }, [opts[0]!, ...shuffle(R, opts.slice(1)).slice(0, 2)]);
};
const predictShift: Gen = (R, n) => {
  const kind = pick(R, ['b', 'm', 'flip'] as const);
  const m1 = pick(R, [1, 2, 3, 0.5, -1, -2]), b1 = int(R, -3, 3);
  let m2 = m1, b2 = b1;
  if (kind === 'b') { while (b2 === b1 || Math.abs(b2) > 6) b2 = b1 + pick(R, [-4, -3, -2, 2, 3, 4]); }
  else if (kind === 'm') m2 = pick(R, [m1 * 2, m1 * 3].filter(v => Math.abs(v) <= 6));
  else m2 = -m1;
  const d = b2 - b1;
  const right = kind === 'b' ? `It moves ${d > 0 ? 'up' : 'down'} ${Math.abs(d)} and stays just as steep.`
    : kind === 'm' ? `It gets steeper and still crosses the ${I('y')}-axis at (0, ${H(b1)}).`
      : `It ${m2 < 0 ? 'falls' : 'rises'} instead, still through (0, ${H(b1)}).`;
  const opts: Opt[] = [{ t: right, ok: true, say: kind === 'b' ? `Yes: a new ${I('b')} slides the line up or down.` : `Yes: a new ${I('m')} turns the line about its point on the ${I('y')}-axis.` }];
  if (kind === 'b') {
    opts.push({ t: `It gets steeper.`, mc: MC.swap, say: `The slope stayed ${H(m1)}. Only ${I('b')} changed, so the line slides ${d > 0 ? 'up' : 'down'}.` });
    opts.push({ t: `It moves ${d > 0 ? 'right' : 'left'} ${Math.abs(d)}.`, say: `${I('b')} is on the ${I('y')}-axis: changing it moves the line ${d > 0 ? 'up' : 'down'}.` });
  } else {
    opts.push({ t: `It moves up ${Math.abs(m2 - m1)}.`, mc: MC.swap, say: `${I('b')} stayed ${H(b1)}, so the crossing point stays. Changing ${I('m')} changes the steepness and direction.` });
    opts.push({ t: `Nothing changes: it is the same line.`, say: `A different slope is a different line. Try ${I('x')} = 1: the outputs differ.` });
  }
  const X = ax({ min: -5, max: 5, step: 1 }, 'x'), Y = ax({ min: -12, max: 12, step: 2 }, 'y');
  return choiceItem(R, {
    id: `predictShift-${n}`, family: 'predictShift', prompt: `The line ${eqHtml(m1, b1)} is changed to ${eqHtml(m2, b2)}. What happens to the graph?`,
    board: eqTex(m1, b1),
    picture: { lf: { lm: { x: X, y: Y, lines: [{ m: m1, b: b1, col: 'water' }, { m: m2, b: b2, col: 'link' }] }, show: ['axes', 'line'], solve: ['line2'], pre: [`\\to\\ ${eqTex(m2, b2)}`],
      tex: [kind === 'b' ? `b:\\ ${T(b1)} \\to ${T(b2)}` : `m:\\ ${T(m1)} \\to ${T(m2)}`] } },
    solution: [kind === 'b' ? `Only ${I('b')} changed (${H(b1)} → ${H(b2)}): the line slides ${d > 0 ? 'up' : 'down'} ${Math.abs(d)}, parallel to itself.`
      : `Only ${I('m')} changed (${H(m1)} → ${H(m2)}): the line turns about (0, ${H(b1)}).`],
  }, [opts[0]!, ...shuffle(R, opts.slice(1)).slice(0, 2)]);
};

// ======================================================================================================
// 8 write-from-description: storyToEq · storyPair
// ======================================================================================================
const storyToEq: Gen = (R, n) => {
  const c = pickCtx(R);
  const m = pick(R, c.ms), b = pick(R, c.bs.filter(v => v > 0));
  const X = xAxis(xEnd(c, m, b), axisX(c), 6), Y = yAxisFor([b, 0], [{ m, b }], X, axisY(c), 7);
  const opts: Opt[] = [
    { t: ctxEqH(c, m, b, R() < 0.5 ? 'mx+b' : 'b+mx'), ok: true, say: `Yes: ${H(b)} once, plus ${H(m)} for every ${c.xu1}.` },
    { t: ctxEqH(c, b, m), mc: MC.swap, say: `That multiplies the one-time ${H(b)} by ${I(c.x)}. The amount per ${c.xu1}, ${H(m)}, multiplies ${I(c.x)}.` },
    { t: ctxEqH(c, m, 0), mc: MC.dropStart, say: `Where is ${c.bWhat}, ${amt(c, b)}? It is there even at ${I(c.x)} = 0.` },
    ...(m > 0 ? [{ t: `${I(c.y)} = ${H(b)}${I(c.x)} + ${H(m)}${I(c.x)}`, mc: MC.feeTimes, say: `${cap(c.bWhat)} happens once, so it is not multiplied by ${I(c.x)}.` }] : []),
  ];
  if (m < 0) opts.push({ t: ctxEqH(c, -m, b), mc: MC.sign, say: `The ${c.yn} goes DOWN each ${c.xu1}, so the slope is negative: ${H(m)}.` });
  return choiceItem(R, {
    id: `storyToEq-${n}`, family: 'storyToEq', prompt: `${c.story(m, b)} Let ${defineVars(c)} Which equation fits?`,
    board: `${c.y} = m \\cdot ${c.x} + b`,
    picture: { lf: { lm: { x: X, y: Y, lines: [{ m, b }] }, show: ['axes'], solve: ['start', 'line'], tex: [`b = ${T(b)},\\ m = ${T(m)}`, ctxEqT(c, m, b)] } },
    solution: [`The starting amount is ${I('b')} = ${H(b)} (${c.bWhat}).`, `The change per ${c.xu1} is ${I('m')} = ${H(m)}${m < 0 ? ' (a decrease, so negative)' : ''}.`, `${ctxEqH(c, m, b)}.`],
  }, [opts[0]!, ...shuffle(R, opts.slice(1)).slice(0, 2)]);
};
const storyPair: Gen = (R, n) => {
  // the rate is stated for 2, 5 or 10 units: a unit-rate step first
  const kind = pick(R, ['taxi', 'savings', 'card', 'phone', 'tank'] as const);
  const c = ctxBy(kind);
  const per = kind === 'taxi' ? pick(R, [5, 10]) : kind === 'phone' ? 2 : kind === 'tank' ? pick(R, [2, 5]) : 2;
  const m = kind === 'taxi' ? pick(R, [1.5, 2, 2.5, 3]) : kind === 'card' ? -pick(R, [2.5, 3.5, 4.5]) : kind === 'tank' ? -pick(R, [1.5, 2, 3]) : kind === 'phone' ? pick(R, [3.5, 4.5, 6]) : pick(R, [7.5, 12.5, 6]);
  const b = pick(R, c.bs.filter(v => v > 0));
  const chunk = m * per;
  const story = kind === 'taxi' ? `A taxi charges ${A('$' + b)} to start, plus ${Bm(H(chunk, { money: true }))} for every ${per} miles.`
    : kind === 'savings' ? `Maya has ${A('$' + b)} saved and adds ${Bm(H(chunk, { money: true }))} every 2 weeks.`
      : kind === 'card' ? `A gift card starts with ${A('$' + b)}. Every 2 drinks take ${Bm(H(-chunk, { money: true }))} off the card.`
        : kind === 'phone' ? `A phone plan costs ${A('$' + b)} a month plus ${Bm(H(chunk, { money: true }))} for every 2 GB of data.`
          : `A tank holds ${A(b + ' gallons')} and loses ${Bm(H(-chunk) + ' gallons')} every ${per} minutes.`;
  const X = xAxis(xEnd(c, m, b), axisX(c), 6), Y = yAxisFor([b, 0], [{ m, b }], X, axisY(c), 7);
  return pairItem({
    id: `storyPair-${n}`, family: 'storyPair', prompt: `${story} Write the equation, where ${defineVars(c)}`,
    board: `${c.y} = m \\cdot ${c.x} + b`, pairLead: `${I(c.y)} =`, pairOp: `${I(c.x)} +`, pairTail: '',
    picture: { lf: { lm: { x: X, y: Y, lines: [{ m, b }], step: { x: 0, y: b, run: per, rise: chunk } },
      show: ['axes'], solve: ['start', 'step', 'line'], tex: [`m = \\dfrac{${T(chunk)}}{${per}} = ${T(m)}`, ctxEqT(c, m, b)] } },
    solution: [`Per ONE ${c.xu1}: ${H(chunk)} ÷ ${per} = ${H(m)}${m < 0 ? ' (it goes down, so negative)' : ''}.`, `Start: ${I('b')} = ${H(b)}.`, `${ctxEqH(c, m, b)}.`],
  }, [m, b], (x, y) => {
    if (near(x, m) && near(y, b)) return ok(`Yes: ${ctxEqH(c, m, b)}.`);
    if (near(x, chunk) && near(y, b)) return no(`${H(chunk)} is for ${per} ${c.xu}. The slope is per ONE: ${H(chunk)} ÷ ${per}.`, MC.inputStep);
    if (near(x, b) && near(y, m)) return no(`The start goes on its own; the amount per ${c.xu1} multiplies ${I(c.x)}.`, MC.swap);
    if (near(y, 0) && b !== 0) return no(`Don’t forget the start, ${H(b)}: it is there at ${I(c.x)} = 0.`, MC.dropStart);
    if (near(x, -m) && near(y, b)) return no(`The ${c.yn} goes ${m < 0 ? 'down' : 'up'}, so the slope is ${m < 0 ? 'negative' : 'positive'}.`, MC.sign);
    if (near(x, m)) return no(`The slope is right. Now the start: what is the ${c.yn} at ${I(c.x)} = 0?`);
    return no(`Slope: the change for ONE ${c.xu1}. Then ${I('b')}: the ${c.yn} at the start.`);
  });
};

// ======================================================================================================
// 9 slope-two-points: twoPointRate · specialSlope
// ======================================================================================================
function twoPoints(R: () => number, halves: boolean): { x1: number; y1: number; x2: number; y2: number; m: number } {
  for (let t = 0; t < 200; t++) {
    const s = halves ? 0.5 : 1;
    const x1 = int(R, -8, 8) * s, x2 = int(R, -8, 8) * s, y1 = int(R, -10, 10) * s, y2 = int(R, -10, 10) * s;
    if (x1 === x2 || y1 === y2 || Math.abs(x2 - x1) < 2 * s || Math.abs(x2 - x1) > 8) continue;
    const m = slopeOf(x1, y1, x2, y2)!;
    if (!terminates(m) || Math.abs(qNum(m)) > 6 || Math.abs(qNum(m)) < 0.25) continue;
    return { x1, y1, x2, y2, m: qNum(m) };
  }
  return { x1: -2, y1: 1, x2: 2, y2: 9, m: 2 };
}
/** a window around the values and 0, with one spare grid line each side when there is room (at most 12 lines) */
const fitWin = (vals: number[], name: string): LMAxis => {
  let lo = Math.min(...vals, 0), hi = Math.max(...vals, 0);
  if (hi - lo < 6) { const d = (6 - (hi - lo)) / 2; lo -= d; hi += d; }
  const w0 = windowFor([lo, hi], { lines: 9 });
  const w = w0.step >= 1 ? w0 : windowFor([lo, hi], { lines: 9, step: 1 });
  let { min, max } = w;
  if ((max - min) / w.step + 1 <= 12) max += w.step;
  if ((max - min) / w.step + 1 <= 12) min -= w.step;
  return ax({ min, max, step: w.step }, name);
};
const twoPointRate: Gen = (R, n) => {
  const halves = R() < 0.3;
  const P = twoPoints(R, halves);
  const reversed = P.x1 > P.x2;
  const X = fitWin([P.x1, P.x2], 'x'), Y = fitWin([P.y1, P.y2], 'y');
  const dy = P.y2 - P.y1, dx = P.x2 - P.x1;
  const [L, Rr] = P.x1 < P.x2 ? [[P.x1, P.y1], [P.x2, P.y2]] : [[P.x2, P.y2], [P.x1, P.y1]];
  const b = qNum(interceptOf(P.m, P.x1, P.y1));
  return numItem({
    id: `twoPointRate-${n}`, family: 'twoPointRate', prompt: `What is the slope of the line through ${I('A')}(${H(P.x1)}, ${H(P.y1)}) and ${I('B')}(${H(P.x2)}, ${H(P.y2)})?${reversed ? ' (They are not in left-to-right order.)' : ''}`,
    board: `m = \\dfrac{y_2 - y_1}{x_2 - x_1}`, unit: '',
    picture: { lf: { lm: { x: X, y: Y, lines: [{ m: P.m, b }], pts: [{ x: P.x1, y: P.y1, name: 'A' }, { x: P.x2, y: P.y2, name: 'B' }], step: { x: L[0]!, y: L[1]!, run: Rr[0]! - L[0]!, rise: Rr[1]! - L[1]! } },
      show: ['axes', 'points'], solve: ['step', 'line'], tex: [`m = \\dfrac{${T(P.y2)} - ${par(P.y1)}}{${T(P.x2)} - ${par(P.x1)}}`, `= \\dfrac{${T(dy)}}{${T(dx)}} = ${T(P.m)}`] } },
    solution: [`Subtract in the same order on top and bottom (${I('B')} minus ${I('A')}): ${H(P.y2)} − ${P.y1 < 0 ? `(${H(P.y1)})` : H(P.y1)} = ${H(dy)}, and ${H(P.x2)} − ${P.x1 < 0 ? `(${H(P.x1)})` : H(P.x1)} = ${H(dx)}.`, `${H(dy)} ÷ ${H(dx)} = <b class="s">${H(P.m)}</b>.`],
  }, P.m, v => {
    if (near(v, P.m)) return ok(`Yes: ${H(dy)} ÷ ${H(dx)} = ${H(P.m)}.`);
    if (near(v, -P.m)) return no(`Same order on top and bottom: if you start with ${I('B')}’s ${I('y')}, start with ${I('B')}’s ${I('x')} too.`, MC.order);
    if (dy !== 0 && near(v, dx / dy)) return no(`Change in ${I('y')} goes on top, change in ${I('x')} below.`, MC.inverted);
    if ((P.x2 !== 0 && near(v, P.y2 / P.x2)) || (P.x1 !== 0 && near(v, P.y1 / P.x1))) return no(`${I('y')} ÷ ${I('x')} of one point is not the slope (the line need not go through (0, 0)). Use the CHANGES between the two points.`, MC.yOverX);
    if (near(v, dy) || near(v, -dy)) return no(`That is the change in ${I('y')}. Divide it by the change in ${I('x')}.`, MC.inputStep);
    return no(`Change in ${I('y')} ÷ change in ${I('x')}, both from ${I('A')} to ${I('B')}.`);
  });
};
const specialSlope: Gen = (R, n) => {
  const vertical = R() < 0.5;
  const k = int(R, -6, 6) || 3;
  const a = int(R, -7, -1), c2 = int(R, 1, 7);
  const [x1, y1, x2, y2] = vertical ? [k, a, k, c2] : [a, k, c2, k];
  const X = fitWin([x1, x2], 'x'), Y = fitWin([y1, y2], 'y');
  const opts: Opt[] = vertical ? [
    { t: `There is no finite slope: the change in ${I('x')} is 0, and you cannot divide by 0.`, ok: true, say: `Yes: a vertical line has no finite slope.` },
    { t: `0`, mc: MC.vertZero, say: `${H(y2 - y1)} ÷ 0 is not 0: dividing by 0 has no answer. 0 is the slope of a FLAT line.` },
    { t: `${H(k)}`, mc: MC.height, say: `${H(k)} is where the line is, not how steep it is. Here the run is 0.` },
  ] : [
    { t: `0`, ok: true, say: `Yes: ${I('y')} does not change, so the slope is 0 ÷ ${H(x2 - x1)} = 0.` },
    { t: `There is no finite slope: you cannot divide by 0.`, mc: MC.vhSwap, say: `Here the change in ${I('y')} is 0, on TOP: 0 ÷ ${H(x2 - x1)} = 0. No slope is for vertical lines.` },
    { t: `${H(k)}`, mc: MC.height, say: `${H(k)} is the height of the line, not its slope. The line is flat: slope 0.` },
  ];
  return choiceItem(R, {
    id: `specialSlope-${n}`, family: 'specialSlope', prompt: `What is the slope of the line through ${I('A')}(${H(x1)}, ${H(y1)}) and ${I('B')}(${H(x2)}, ${H(y2)})?`,
    board: `m = \\dfrac{y_2 - y_1}{x_2 - x_1}`,
    picture: { lf: { lm: { x: X, y: Y, lines: vertical ? [] : [{ m: 0, b: k }], pts: [{ x: x1, y: y1, name: 'A' }, { x: x2, y: y2, name: 'B' }] },
      show: ['axes', 'points'], solve: ['line'], tex: [`m = \\dfrac{${T(y2)} - ${par(y1)}}{${T(x2)} - ${par(x1)}} = \\dfrac{${T(y2 - y1)}}{${T(x2 - x1)}}`] } },
    solution: vertical ? [`Change in ${I('x')}: ${H(x2)} − ${par(x1).replace('-', '−')} = 0. You cannot divide by 0.`, `The line is vertical: <b class="s">no finite slope</b>.`]
      : [`Change in ${I('y')}: 0. Change in ${I('x')}: ${H(x2 - x1)}.`, `0 ÷ ${H(x2 - x1)} = <b class="s">0</b>: a flat line.`],
  }, opts);
};

// ======================================================================================================
// 10 linearity-check: isLinear · fitsRule
// ======================================================================================================
const isLinear: Gen = (R, n) => {
  const kind = pick(R, ['equal', 'unequal', 'square', 'break'] as const);
  let xs: number[], ys: number[], c: Ctx | null = null;
  let xh: [string, string] = ['x', ''], yh: [string, string] = ['y', ''];
  if (kind === 'square') { xs = [1, 2, 3, 4]; ys = xs.map(x => x * x); xh = ['side', '(in.)']; yh = ['area', '(sq in.)']; }
  else {
    c = pickCtx(R, k => k.ms[0]! > 0 && Math.abs(k.ms[0]!) <= 15);
    const m = pick(R, c.ms), b = pick(R, c.bs);
    xs = kind === 'unequal' ? [1, 2, 4, 7] : [1, 2, 3, 4];
    ys = xs.map(x => f(m, b, x));
    if (kind === 'break') { const i = int(R, 2, 3); ys[i] = ys[i]! + (c.money ? 5 : 1) * pick(R, [1, 2]); }
  }
  const lin = kind === 'equal' || kind === 'unequal';
  const L = (() => { const r = qNum(slopeOf(xs[0]!, ys[0]!, xs[1]!, ys[1]!)!); return { m: r, b: ys[0]! - r * xs[0]! }; })();
  const brk = (() => { for (let i = 1; i < xs.length - 1; i++) { const r = qNum(slopeOf(xs[i]!, ys[i]!, xs[i + 1]!, ys[i + 1]!)!); if (!near(r, L.m)) return i; } return -1; })();
  const X = xAxis(Math.max(...xs), c ? axisX(c) : kind === 'square' ? 'side (in.)' : 'x', 7);
  const Y = yAxisFor([...ys, 0], [], X, c ? axisY(c) : kind === 'square' ? 'area (sq in.)' : 'y', 8);
  const Yfit = ax({ ...Y, max: Math.max(Y.max, Math.ceil(f(L.m, L.b, X.max) / Y.step) * Y.step) }, Y.name);
  const table = c ? tableOf(c, xs, ys) : { xs, ys, xHead: xh, yHead: yh };
  const opts: Opt[] = lin ? [
    { t: `Yes: the change per ONE unit of input is the same between every two rows.`, ok: true, say: `Yes: ${H(L.m)} per unit everywhere${kind === 'unequal' ? ', even though the rows are not equally spaced' : ''}.` },
    kind === 'unequal'
      ? { t: `No: the outputs go up by different amounts.`, mc: MC.spacing, say: `The inputs jump by 1, 2 and 3. Divide each change by its input step: ${H(L.m)} per unit every time.` }
      : { t: `No: the table does not start at (0, 0).`, mc: MC.propo, say: `A linear function can start anywhere. What matters is the same change per unit.` },
    { t: `No: it would need to start at input 0.`, say: `A table can start at any input. Check the change per unit between rows.` },
  ] : [
    { t: `No: the change per unit is not the same between rows ${brk + 1} and ${brk + 2}.`, ok: true, say: `Yes: one different step is enough to break a line.` },
    { t: `Yes: the outputs go up every time.`, mc: MC.illusion, say: `Going up is not enough. A linear table goes up by the SAME amount per unit. Check every step.` },
    { t: `Yes: the first two steps match.`, mc: MC.noCheck, say: `Check every step, not just the first ones. Rows ${brk + 1} to ${brk + 2} break the pattern.` },
  ];
  return choiceItem(R, {
    id: `isLinear-${n}`, family: 'isLinear', prompt: `${kind === 'square' ? 'The table gives the area of a square from its side.' : c ? `The table shows the ${c.yn} at some ${c.xu}.` : ''} Do these rows fit ONE linear function?`,
    board: `\\dfrac{\\text{change in output}}{\\text{change in input}}\\ \\text{same?}`,
    picture: { lf: { lm: { x: X, y: Yfit, table, lines: [L], pts: xs.map((x, i) => ({ x, y: ys[i]! })) }, show: ['axes', 'table', 'points'], solve: ['line'],
      tex: xs.slice(1).map((x, i) => `\\dfrac{${T(ys[i + 1]! - ys[i]!)}}{${T(x - xs[i]!)}} = ${T(qNum(slopeOf(xs[i]!, ys[i]!, x, ys[i + 1]!)!))}`).slice(0, 3) } },
    solution: [`Between each two rows: change in output ÷ change in input.`, lin ? `Every step gives ${H(L.m)}: one line.` : `The steps do not all match: not linear. The line through the first two points misses later points.`],
  }, opts);
};
const fitsRule: Gen = (R, n) => {
  const kind = pick(R, ['fits', 'firstRow', 'sameRate'] as const);
  const m = pick(R, [2, 3, 4, 5, -2, -3]), b = int(R, -4, 9);
  const xs = [1, 2, 3, 4], ys = xs.map(x => f(m, b, x));
  let rm = m, rb = b;
  if (kind === 'firstRow') { rm = m + pick(R, [1, 2, -1]); if (rm === 0) rm = m + 3; rb = ys[0]! - rm * xs[0]!; }
  if (kind === 'sameRate') rb = b + pick(R, [1, 2, -1, -2]);
  const who = pick(R, NAMES);
  const bad = xs.findIndex((x, i) => !near(f(rm, rb, x), ys[i]!));
  const X = xAxis(4, 'x', 4), Y = yAxisFor([...ys, 0], [{ m: rm, b: rb }], X, 'y', 8);
  const opts: Opt[] = kind === 'fits' ? [
    { t: `Yes: it gives every output in the table.`, ok: true, say: `Yes: you checked every row.` },
    { t: `No: the table does not start at ${I('x')} = 0.`, mc: MC.propo, say: `A rule can be checked at any input. Put each ${I('x')} in: every output matches.` },
    { t: `No: ${I('b')} should be the first output, ${H(ys[0]!)}.`, mc: MC.firstOut, say: `${H(ys[0]!)} is the output at ${I('x')} = 1, not at 0. The rule matches every row.` },
  ] : [
    { t: `No: at ${I('x')} = ${xs[bad]} it gives ${H(f(rm, rb, xs[bad]!))}, not ${H(ys[bad]!)}.`, ok: true, say: `Yes: one row that fails is enough.` },
    kind === 'firstRow'
      ? { t: `Yes: it works for the first row.`, mc: MC.noCheck, say: `One row is not enough. At ${I('x')} = ${xs[bad]} it gives ${H(f(rm, rb, xs[bad]!))}, not ${H(ys[bad]!)}.` }
      : { t: `Yes: the outputs change by ${H(m)} each row, like the rule.`, mc: MC.outDiff, say: `The changes match, but the values do not: at ${I('x')} = ${xs[bad]} the rule gives ${H(f(rm, rb, xs[bad]!))}.` },
    { t: `Yes: it is a straight line, so it fits.`, mc: MC.noCheck, say: `Every rule y = mx + b is a line; that does not make it THIS line. Check the rows.` },
  ];
  return choiceItem(R, {
    id: `fitsRule-${n}`, family: 'fitsRule', prompt: `${who} says the rule ${eqHtml(rm, rb)} fits this table. Does it?`,
    board: eqTex(rm, rb),
    picture: { lf: { lm: { x: X, y: Y, table: xyTable(xs, ys), lines: [{ m: rm, b: rb, col: kind === 'fits' ? 'link' : 'wrong' }], pts: xs.map((x, i) => ({ x, y: ys[i]! })) },
      show: ['axes', 'table', 'points'], solve: ['line'], row: bad >= 0 ? bad : undefined,
      tex: xs.map((x, i) => `${T(rm)}\\cdot ${x} ${sT(rb)} = ${T(f(rm, rb, x))}${near(f(rm, rb, x), ys[i]!) ? '\\ \\checkmark' : `\\ne ${T(ys[i]!)}`}`).slice(0, 4) } },
    solution: [`Put every input into the rule and compare with the table.`, kind === 'fits' ? `All four rows match: the rule fits.` : `Row ${I('x')} = ${xs[bad]} gives ${H(f(rm, rb, xs[bad]!))}, but the table says ${H(ys[bad]!)}: the rule does not fit.`],
  }, opts);
};

// ======================================================================================================
// 11 back-solve-b: backSolve
// ======================================================================================================
const backSolve: Gen = (R, n) => {
  const story = R() < 0.4;
  if (story) {
    const c = pickCtx(R, k => ['bike', 'taxi', 'gym', 'phone', 'pizza'].includes(k.id));
    const m = pick(R, c.ms), b = pick(R, c.bs), x1 = pick(R, [2, 3, 4, 5].filter(v => v <= c.xMax)), y1 = f(m, b, x1);
    const X = xAxis(xEnd(c, m, b), axisX(c), 6), Y = yAxisFor([y1, b, 0], [{ m, b }], X, axisY(c), 7);
    return numItem({
      id: `backSolve-${n}`, family: 'backSolve', prompt: `${cap(c.yn === 'fare' ? 'the fare' : 'the cost')} is ${H(m, { money: true })} per ${c.xu1} plus ${c.bWhat}. For ${xAmt(c, x1)} it comes to ${H(y1, { money: true })}. What is ${c.bWhat}?`,
      board: `${T(y1)} = ${T(m)}\\cdot ${x1} + b`, unit: 'dollars',
      picture: { lf: { lm: { x: X, y: Y, lines: [{ m, b }], pts: [{ x: x1, y: y1, name: 'P' }], backFrom: x1 }, show: ['axes', 'points'], solve: ['line', 'back', 'start'], tex: [`b = ${T(y1)} - ${T(m)}\\cdot ${x1} = ${T(b)}`] } },
      solution: [`${xAmt(c, x1)} at ${H(m, { money: true })} each is ${H(m * x1, { money: true })}.`, `The rest is the one-time part: ${H(y1, { money: true })} − ${H(m * x1, { money: true })} = <b class="s">${H(b, { money: true })}</b>.`],
    }, b, v => {
      if (near(v, b)) return ok(`Yes: ${H(y1, { money: true })} − ${H(m * x1, { money: true })} = ${H(b, { money: true })}.`);
      if (near(v, y1 + m * x1)) return no(`Take the ${xAmt(c, x1)} OFF the total: ${H(y1)} − ${H(m * x1)}.`, MC.backSign);
      if (near(v, y1)) return no(`${H(y1, { money: true })} is the total for ${xAmt(c, x1)}. ${cap(c.bWhat)} is what is left after the ${c.xu}.`, MC.firstOut);
      if (near(v, m * x1)) return no(`${H(m * x1, { money: true })} is what the ${c.xu} cost. ${cap(c.bWhat)} is the rest of the total.`, MC.dropStart);
      return no(`Total minus (rate × ${c.xu}) = the one-time part.`);
    });
  }
  // abstract: slope and one point, either side of 0, fractional or negative slopes, negative b
  let m = 0, b = 0, x1 = 0, y1 = 0;
  for (let t = 0; t < 100; t++) {
    m = pick(R, [-3, -2, 2, 3, 4, 0.5, -0.5, 1.5]); x1 = pick(R, [-4, -3, -2, 2, 3, 4, 5, 6]); b = int(R, -8, 8);
    y1 = f(m, b, x1);
    if (Number.isInteger(y1) && b !== 0 && Math.abs(y1) <= 14 && !near(y1 + m * x1, b) && !near(y1, b)) break;
  }
  const X = fitWin([x1, 0], 'x'), Y = fitWin([y1, b], 'y');
  const run = Number.isInteger(m) ? 1 : 2;
  const okStep = x1 + run <= X.max && f(m, b, x1 + run) <= Y.max && f(m, b, x1 + run) >= Y.min;
  return numItem({
    id: `backSolve-${n}`, family: 'backSolve', prompt: `A line has slope ${H(m)} and goes through ${I('P')}(${H(x1)}, ${H(y1)}). What is its ${I('y')}-intercept ${I('b')}?`,
    board: `${T(y1)} = ${par(m)}\\cdot ${par(x1)} + b`, unit: '',
    picture: { lf: { lm: { x: X, y: Y, lines: [{ m, b }], pts: [{ x: x1, y: y1, name: 'P' }], backFrom: x1, step: okStep ? { x: x1, y: y1, run, rise: m * run } : undefined }, show: ['axes', 'points'].concat(okStep ? ['step'] : []) as LMStep[], solve: ['line', 'back', 'start'],
      tex: [`b = ${T(y1)} - ${par(m)}\\cdot ${par(x1)}`, `b = ${T(y1)} - ${par(m * x1)} = ${T(b)}`] } },
    solution: [`Put the point into ${I('y')} = ${I('m')}${I('x')} + ${I('b')}: ${H(y1)} = ${H(m)} · ${x1 < 0 ? `(${H(x1)})` : H(x1)} + ${I('b')}.`, `${H(m)} · ${x1 < 0 ? `(${H(x1)})` : H(x1)} = ${H(m * x1)}, so ${I('b')} = ${H(y1)} − ${m * x1 < 0 ? `(${H(m * x1)})` : H(m * x1)} = <b class="s">${H(b)}</b>.`],
  }, b, v => {
    if (near(v, b)) return ok(`Yes: ${I('b')} = ${H(b)}.`);
    if (near(v, y1 + m * x1)) return no(`${I('b')} = ${I('y')} − ${I('m')}${I('x')}: subtract ${H(m * x1)}, don’t add it.`, MC.backSign);
    if (near(v, y1)) return no(`${H(y1)} is the output at ${I('x')} = ${H(x1)}. ${I('b')} is the output at ${I('x')} = 0.`, MC.firstOut);
    if (near(v, -b)) return no(`Check the signs: ${H(y1)} − (${H(m * x1)}).`);
    return no(`Solve ${H(y1)} = ${H(m)} · ${H(x1)} + ${I('b')} for ${I('b')}.`);
  });
};

// ======================================================================================================
// 12 equation-from-two-points: eqTwoPoints · eqFromTable
// ======================================================================================================
function classifyMB(m: number, b: number, x: number, y: number, P: { x1: number; y1: number; x2: number; y2: number }): Verdict {
  if (near(x, m) && near(y, b)) return ok(`Yes: ${eqHtml(m, b)}. It fits both points.`);
  if (near(x, -m)) return no(`Check the slope’s sign: subtract the coordinates in the same order on top and bottom.`, MC.order);
  if (m !== 0 && near(x, 1 / m)) return no(`The slope is change in ${I('y')} ÷ change in ${I('x')}, not the other way round.`, MC.inverted);
  if (near(x, m) && (near(y, P.y1) || near(y, P.y2))) return no(`The slope is right. But ${H(y)} is an output at ${I('x')} = ${H(near(y, P.y1) ? P.x1 : P.x2)}, not at 0. Work back to input 0.`, MC.firstOut);
  if (near(x, m) && (near(y, P.y1 + m * P.x1) || near(y, P.y2 + m * P.x2))) return no(`The slope is right. For ${I('b')}: ${I('y')} − ${I('m')}${I('x')}, so subtract.`, MC.backSign);
  if (near(x, m) && near(y, 0) && b !== 0) return no(`The slope is right, but the equation needs ${I('b')} too: the output at ${I('x')} = 0.`, MC.stops);
  if (near(x, b) && near(y, m)) return no(`Swapped: the slope multiplies ${I('x')}, ${I('b')} stands alone.`, MC.swap);
  if (near(x, m)) return no(`The slope is right. Find ${I('b')}: ${I('b')} = ${I('y')} − ${I('m')}${I('x')} with one point.`);
  return no(`First the slope from the two points, then ${I('b')} from one point.`);
}
const eqTwoPoints: Gen = (R, n) => {
  let P = twoPoints(R, false), b = 0;
  for (let t = 0; t < 60; t++) { P = twoPoints(R, false); b = qNum(interceptOf(P.m, P.x1, P.y1)); if (terminates(q(b)) && Math.abs(b) <= 12 && P.x1 !== 0 && P.x2 !== 0) break; }
  const X = fitWin([P.x1, P.x2, 0], 'x'), Y = fitWin([P.y1, P.y2, b], 'y');
  const [L, Rr] = P.x1 < P.x2 ? [[P.x1, P.y1], [P.x2, P.y2]] : [[P.x2, P.y2], [P.x1, P.y1]];
  return pairItem({
    id: `eqTwoPoints-${n}`, family: 'eqTwoPoints', prompt: `Write the equation of the line through ${I('A')}(${H(P.x1)}, ${H(P.y1)}) and ${I('B')}(${H(P.x2)}, ${H(P.y2)}).`,
    board: `y = mx + b`, pairLead: `${I('y')} =`, pairOp: `${I('x')} +`, pairTail: '',
    picture: { lf: { lm: { x: X, y: Y, lines: [{ m: P.m, b }], pts: [{ x: P.x1, y: P.y1, name: 'A' }, { x: P.x2, y: P.y2, name: 'B' }], step: { x: L[0]!, y: L[1]!, run: Rr[0]! - L[0]!, rise: Rr[1]! - L[1]! }, backFrom: L[0]! },
      show: ['axes', 'points'], solve: ['step', 'line', 'start'],
      tex: [`m = \\dfrac{${T(P.y2 - P.y1)}}{${T(P.x2 - P.x1)}} = ${T(P.m)}`, `b = ${T(P.y1)} - ${par(P.m)}\\cdot ${par(P.x1)} = ${T(b)}`, eqTex(P.m, b)] } },
    solution: [`Slope: (${H(P.y2)} − ${par(P.y1).replace('-', '−')}) ÷ (${H(P.x2)} − ${par(P.x1).replace('-', '−')}) = ${H(P.m)}.`, `${I('b')} = ${H(P.y1)} − ${H(P.m)} · ${par(P.x1).replace('-', '−')} = ${H(b)}.`, `<b class="s">${eqHtml(P.m, b)}</b>. Check ${I('B')}: ${H(P.m)} · ${par(P.x2).replace('-', '−')} + ${par(b).replace('-', '−')} = ${H(P.y2)} ✓`],
  }, [P.m, b], (x, y) => classifyMB(P.m, b, x, y, P));
};
const eqFromTable: Gen = (R, n) => {
  const c = pickCtx(R, k => !k.count);
  const m = pick(R, c.ms);
  let b = pick(R, c.bs);
  const gap = pick(R, [1, 2]), x0 = pick(R, [1, 2, 3, 4].filter(v => v * 1 >= gap));
  let xs = [0, 1, 2].map(k => x0 + k * gap);
  if (R() < 0.35) xs = [xs[1]!, xs[0]!, xs[2]!];
  b = liftB(c, m, b, xs);
  const ys = xs.map(x => f(m, b, x));
  const X = xAxis(Math.max(...xs), axisX(c), 6), Y = yAxisFor([...ys, b, 0], [{ m, b }], X, axisY(c), 7);
  const y0 = ys[0]!;
  const wrong1 = { m: m, b: y0 }, wrong2 = { m: m * gap, b: f(m, b, xs[0]!) - m * gap * xs[0]! };
  const noCheckLine = { m: m + (m > 0 ? 1 : -1) * (c.money ? 1 : 1), b: 0 };
  noCheckLine.b = y0 - noCheckLine.m * xs[0]!;
  const opts: Opt[] = [
    { t: ctxEqH(c, m, b), ok: true, say: `Yes: it gives every row. Check one: ${H(m)} · ${xs[2]} + ${H(b)} = ${H(ys[2]!)}.` },
    { t: ctxEqH(c, wrong1.m, wrong1.b), mc: MC.firstOut, say: `${H(y0)} is the output at ${I(c.x)} = ${xs[0]}, the first row shown. ${I('b')} is the output at ${I(c.x)} = 0.` },
    ...(gap > 1 && !near(wrong2.m, m) ? [{ t: ctxEqH(c, wrong2.m, wrong2.b), mc: MC.inputStep, say: `The rows are ${gap} ${c.xu} apart, so ${H(m * gap)} is the change for ${gap}. Per one: ${H(m)}.` }] : []),
    { t: ctxEqH(c, noCheckLine.m, noCheckLine.b), mc: MC.noCheck, say: `That one fits the first row only. Check every row: at ${I(c.x)} = ${xs[1]} it gives ${H(f(noCheckLine.m, noCheckLine.b, xs[1]!))}, not ${H(ys[1]!)}.` },
    { t: ctxEqH(c, b, m), mc: MC.swap, say: `Swapped: the change per ${c.xu1} multiplies ${I(c.x)}; the start stands alone.` },
  ];
  return choiceItem(R, {
    id: `eqFromTable-${n}`, family: 'eqFromTable', prompt: `The table is linear. Which equation fits it? ${defineVars(c)}`,
    board: `${c.y} = m \\cdot ${c.x} + b`,
    picture: { lf: { lm: { x: X, y: Y, table: tableOf(c, xs, ys), lines: [{ m, b }], pts: xs.map((x, i) => ({ x, y: ys[i]! })) },
      show: ['axes', 'table', 'points'], solve: ['line', 'back', 'start'], tex: [`m = ${T(m)},\\ b = ${T(b)}`, ctxEqT(c, m, b)] } },
    solution: [`Rate: per one ${c.xu1}, the ${c.yn} changes by ${H(m)}.`, `Back to ${I(c.x)} = 0: ${I('b')} = ${H(b)}.`, `${ctxEqH(c, m, b)}, and it fits every row.`],
  }, [opts[0]!, ...shuffle(R, opts.slice(1)).slice(0, 2)]);
};

// ======================================================================================================
// 13 graph-from-points: onTheLine · plotPoint
// ======================================================================================================
const onTheLine: Gen = (R, n) => {
  const m = pick(R, [-2, -1, 1, 2, 3]), b = int(R, -4, 4);
  const xsAll = [-3, -2, -1, 0, 1, 2, 3].filter(x => Math.abs(f(m, b, x)) <= 9);
  const [xa, xb, xc] = shuffle(R, xsAll.slice()).slice(0, 3) as [number, number, number];
  const ya = f(m, b, xa), yb = f(m, b, xb), yc = f(m, b, xc);
  const X = ax({ min: -5, max: 5, step: 1 }, 'x'), Y = ax({ min: -10, max: 10, step: 2 }, 'y');
  const plotted = R() < 0.4;
  const lm: LMParams = { x: X, y: Y, lines: [{ m, b }], pts: [{ x: xa, y: ya, name: 'A' }, { x: xb, y: yb, name: 'B' }], read: xc };
  if (plotted) return choiceItem(R, {
    id: `onTheLine-${n}`, family: 'onTheLine', prompt: `${I('A')} and ${I('B')} are plotted for ${eqHtml(m, b)}. Is (${H(xc)}, ${H(yc)}) on the graph of the equation too?`,
    board: eqTex(m, b),
    picture: { lf: { lm, show: ['axes', 'points'], solve: ['line', 'read'], tex: [`${par(m)}\\cdot ${par(xc)} ${sT(b)}`, `= ${T(yc)}\\ \\checkmark`] } },
    solution: [`Put ${I('x')} = ${H(xc)} in: ${H(m)} · ${par(xc).replace('-', '−')} ${b < 0 ? '−' : '+'} ${H(Math.abs(b))} = ${H(yc)}. It solves the equation.`, `The graph is the line of ALL solutions, not just the plotted ones.`],
  }, [
    { t: `Yes: it solves the equation, so it is on the line.`, ok: true, say: `Yes: every solution is a point of the line.` },
    { t: `No: only ${I('A')} and ${I('B')} were plotted.`, mc: MC.onlyPlotted, say: `The graph is the whole line through ${I('A')} and ${I('B')}: every pair that solves the equation.` },
    { t: `No: ${I('y')} would have to be ${H(yc + 1)} there.`, say: `Work it out: ${H(m)} · ${par(xc).replace('-', '−')} ${b < 0 ? '−' : '+'} ${H(Math.abs(b))} = ${H(yc)}. It is on the line.` },
  ]);
  const swapPt = { x: yc, y: xc };
  const off = { x: xc, y: yc + pick(R, [1, -1, 2]) };
  const opts: Opt[] = [
    { t: `(${H(xc)}, ${H(yc)})`, ok: true, say: `Yes: ${H(m)} · ${par(xc).replace('-', '−')} ${b < 0 ? '−' : '+'} ${H(Math.abs(b))} = ${H(yc)}.` },
    ...(!near(f(m, b, swapPt.x), swapPt.y) ? [{ t: `(${H(swapPt.x)}, ${H(swapPt.y)})`, mc: MC.coordOrder, say: `The first number is ${I('x')}, the input. At ${I('x')} = ${H(swapPt.x)} the line has ${I('y')} = ${H(f(m, b, swapPt.x))}.` }] : []),
    { t: `(${H(off.x)}, ${H(off.y)})`, say: `At ${I('x')} = ${H(off.x)} the equation gives ${H(yc)}, not ${H(off.y)}.` },
    { t: `(${H(xc)}, ${H(f(-m, b, xc))})`, mc: MC.sign, say: `Mind the sign of the slope: ${H(m)} · ${par(xc).replace('-', '−')} = ${H(m * xc)}.` },
  ].filter((o, i, a) => i === 0 || o.t !== a[0]!.t);
  return choiceItem(R, {
    id: `onTheLine-${n}`, family: 'onTheLine', prompt: `${I('A')} and ${I('B')} are solutions of ${eqHtml(m, b)}. Which point is also on its graph?`,
    board: eqTex(m, b),
    picture: { lf: { lm, show: ['axes', 'points'], solve: ['line', 'read'], tex: [`${par(m)}\\cdot ${par(xc)} ${sT(b)} = ${T(yc)}`] } },
    solution: [`A point is on the graph when it solves the equation.`, `${I('x')} = ${H(xc)}: ${I('y')} = ${H(yc)}, so (${H(xc)}, ${H(yc)}).`],
  }, [opts[0]!, ...shuffle(R, opts.slice(1)).slice(0, 2)]);
};
const plotPoint: Gen = (R, n) => {
  const m = pick(R, [-0.5, 0.5, 1.5, -1.5, 2, -2, 3]), b = int(R, -4, 5);
  const xsAll = [-4, -2, 0, 2, 4].filter(x => Math.abs(f(m, b, x)) <= 9);
  const [xa, xb, xc] = shuffle(R, xsAll.slice()).slice(0, 3) as [number, number, number];
  const yc = f(m, b, xc);
  const X = ax({ min: -6, max: 6, step: 1 }, 'x'), Y = ax({ min: -10, max: 10, step: 2 }, 'y');
  return numItem({
    id: `plotPoint-${n}`, family: 'plotPoint', prompt: `Graph ${eqHtml(m, b, { frac: !Number.isInteger(m) && R() < 0.5 })} point by point. ${I('A')} and ${I('B')} are done. The next point has ${I('x')} = ${H(xc)}. What is its ${I('y')}?`,
    board: eqTex(m, b), unit: '',
    picture: { lf: { lm: { x: X, y: Y, lines: [{ m, b }], pts: [{ x: xa, y: f(m, b, xa), name: 'A' }, { x: xb, y: f(m, b, xb), name: 'B' }], read: xc },
      show: ['axes', 'points'], solve: ['read', 'line'], tex: [`y = ${par(m)}\\cdot ${par(xc)} ${sT(b)}`, `y = ${T(yc)}`] } },
    solution: [`Put ${I('x')} = ${H(xc)} into the equation: ${H(m)} · ${par(xc).replace('-', '−')} = ${H(m * xc)}.`, `${H(m * xc)} ${b < 0 ? '−' : '+'} ${H(Math.abs(b))} = <b class="s">${H(yc)}</b>. The three points line up.`],
  }, yc, v => {
    if (near(v, yc)) return ok(`Yes: (${H(xc)}, ${H(yc)}) lines up with ${I('A')} and ${I('B')}.`);
    if (near(v, m * xc) && b !== 0) return no(`That is ${I('m')}${I('x')} only. Add ${I('b')} = ${H(b)} too.`, MC.dropStart);
    if (near(v, -m * xc + b)) return no(`Mind the sign of the slope: ${H(m)} · ${par(xc).replace('-', '−')} = ${H(m * xc)}.`, MC.sign);
    if (near(v, b * xc + m)) return no(`Swapped: ${I('m')} = ${H(m)} multiplies ${I('x')}; ${I('b')} = ${H(b)} is added.`, MC.swap);
    return no(`Multiply ${H(m)} by ${H(xc)}, then add ${H(b)}.`);
  });
};

// ======================================================================================================
// 14 graph-slope-step: slopeStep · 14/15 whichGraph
// ======================================================================================================
const slopeStep: Gen = (R, n) => {
  const [p, qq] = pick(R, [[2, 3], [1, 2], [3, 4], [-2, 3], [-1, 2], [3, 2], [2, 1], [-3, 1], [0, 1], [-3, 2]] as [number, number][]);
  const b = int(R, -3, 3) || 2;
  const m = p / qq;
  const land: [number, number] = [qq, b + p];
  const X = ax({ min: -5, max: 5, step: 1 }, 'x'), Y = ax({ min: -6, max: 6, step: 1 }, 'y');
  const mH = qq === 1 ? H(p) : `${p < 0 ? '−' : ''}${Math.abs(p)}/${qq}`;
  return pairItem({
    id: `slopeStep-${n}`, family: 'slopeStep', prompt: `Graph ${I('y')} = ${p === 0 ? H(b) : `${mH}${I('x')} ${b < 0 ? '−' : '+'} ${Math.abs(b)}`}. Start at (0, ${H(b)}). Take ONE slope step (run ${qq} right, then rise ${H(p)}). Where do you land?`,
    board: p === 0 ? `y = ${T(b)}` : `y = ${qq === 1 ? (p === 1 ? '' : p === -1 ? '-' : T(p)) : `${p < 0 ? '-' : ''}\\tfrac{${Math.abs(p)}}{${qq}}`}x ${sT(b)}`,
    pairLead: '(', pairOp: ',', pairTail: ')',
    picture: { lf: { lm: { x: X, y: Y, lines: [{ m, b }], pts: [{ x: 0, y: b }], step: { x: 0, y: b, run: qq, rise: p } }, show: ['axes', 'points'], solve: ['step', 'line'],
      tex: [`\\text{run } ${qq},\\ \\text{rise } ${T(p)}`, `(0,\\ ${T(b)}) \\to (${qq},\\ ${T(b + p)})`] } },
    solution: [`The slope ${mH} means: ${qq} to the right, then ${p < 0 ? 'down' : 'up'} ${Math.abs(p)}${p === 0 ? ' (a flat step)' : ''}.`, `From (0, ${H(b)}): <b class="s">(${qq}, ${H(b + p)})</b>. Join the points: that is the line.`],
  }, land, (x, y) => {
    if (near(x, land[0]) && near(y, land[1])) return ok(`Yes: (${qq}, ${H(b + p)}).`);
    if (p !== 0 && near(x, Math.abs(p)) && near(y, b + qq * Math.sign(p || 1))) return no(`Run first, along ${I('x')}: ${qq} right. Then the rise, ${H(p)}, along ${I('y')}.`, MC.inverted);
    if (p !== 0 && near(x, qq) && near(y, b - p)) return no(`The slope is ${p < 0 ? 'negative: go DOWN' : 'positive: go UP'} ${Math.abs(p)}.`, MC.sign);
    if (near(x, land[1]) && near(y, land[0])) return no(`Write the point as (${I('x')}, ${I('y')}): across first, then up.`, MC.coordOrder);
    if (near(x, qq) && near(y, p)) return no(`Start the step at (0, ${H(b)}), not at (0, 0).`, MC.dropStart);
    return no(`From (0, ${H(b)}): ${qq} right, then ${p < 0 ? 'down' : 'up'} ${Math.abs(p)}.`);
  });
};
const whichGraph: Gen = (R, n, sg) => {
  let m = 0, b = 0;
  for (let t = 0; t < 50; t++) { m = pick(R, [-3, -2, 2, 3, -1, 1]); b = pick(R, [-3, -2, 2, 3, 1, -1]); if (Math.abs(m) !== Math.abs(b)) break; }
  const cands = shuffle(R, [{ m, b, k: 'ok' }, { m: -m, b, k: 'sign' }, { m: b, b: m, k: 'swap' }]);
  const names = ['A', 'B', 'C'];
  const cols = shuffle(R, ['link', 'water', 'pick'] as const);
  const right = cands.findIndex(c => c.k === 'ok');
  const ordered = [cands[right]!, ...cands.filter((_, i) => i !== right)];
  const nameOf = (c: { k: string }) => names[cands.indexOf(c as never)]!;
  const X = ax({ min: -5, max: 5, step: 1 }, 'x'), Y = ax({ min: -8, max: 8, step: 2 }, 'y');
  const lm: LMParams = { x: X, y: Y, lines: ordered.map((c, i) => ({ m: c.m, b: c.b, name: nameOf(c), col: cols[i] })), step: { x: 0, y: b, run: 1, rise: m } };
  if (sg === 'equation-from-graph') {
    const nm = nameOf(ordered[0]!);
    return choiceItem(R, {
      id: `whichGraph-${n}`, family: 'whichGraph', prompt: `Which equation belongs to line ${I(nm)}?`, board: `y = mx + b`,
      picture: { lf: { lm, show: ['axes', 'line', 'line2', 'line3'], solve: ['start', 'step'], tex: [`b = ${T(b)},\\ m = ${T(m)}`, eqTex(m, b)] } },
      solution: [`Line ${I(nm)} crosses the ${I('y')}-axis at (0, ${H(b)}): ${I('b')} = ${H(b)}.`, `One step right, it goes ${m < 0 ? 'down' : 'up'} ${Math.abs(m)}: ${I('m')} = ${H(m)}. So ${eqHtml(m, b)}.`],
    }, [
      { t: eqHtml(m, b), ok: true, say: `Yes: ${I('b')} = ${H(b)} on the ${I('y')}-axis, ${I('m')} = ${H(m)} per step.` },
      { t: eqHtml(-m, b), mc: MC.sign, say: `Line ${I(nm)} goes ${m < 0 ? 'DOWN' : 'UP'} to the right, so its slope is ${m < 0 ? 'negative' : 'positive'}.` },
      { t: eqHtml(b, m), mc: MC.swap, say: `Swapped: ${I('b')} is where the line crosses the ${I('y')}-axis (${H(b)}); ${I('m')} is the change per step (${H(m)}).` },
    ]);
  }
  return choiceItem(R, {
    id: `whichGraph-${n}`, family: 'whichGraph', prompt: `Which line is the graph of ${eqHtml(m, b)}?`, board: eqTex(m, b),
    picture: { lf: { lm, show: ['axes', 'line', 'line2', 'line3'], solve: ['start', 'step'], tex: [`\\text{start}\\ (0, ${T(b)}),\\ \\text{step}\\ ${T(m)}`] } },
    solution: [`Start on the ${I('y')}-axis at (0, ${H(b)}).`, `One step right, ${m < 0 ? 'down' : 'up'} ${Math.abs(m)}: that is line ${I(nameOf(ordered[0]!))}.`],
  }, cands.map((c, i) => ({
    t: `Line ${names[i]}`, ok: c.k === 'ok',
    mc: c.k === 'sign' ? MC.sign : c.k === 'swap' ? MC.swap : undefined,
    say: c.k === 'ok' ? `Yes: it crosses at (0, ${H(b)}) and goes ${m < 0 ? 'down' : 'up'} ${Math.abs(m)} per step.`
      : c.k === 'sign' ? `That line goes the wrong way: ${m < 0 ? 'up' : 'down'} instead of ${m < 0 ? 'down' : 'up'}.`
        : `That line crosses at (0, ${H(m)}) and has slope ${H(b)}: the numbers swapped jobs.`,
  })));
};

// ======================================================================================================
// 15 equation-from-graph: graphToEq
// ======================================================================================================
const graphToEq: Gen = (R, n, sg) => {
  const twoPts = sg === 'equation-from-two-points';
  let m = 0, b = 0;
  m = pick(R, [-3, -2, -1, 1, 2, 3, 0.5, -0.5, 1.5]); b = int(R, -4, 4);
  const X = ax({ min: -6, max: 6, step: 1 }, 'x'), Y = ax({ min: -10, max: 10, step: 2 }, 'y');
  const xsOk = [-4, -2, 2, 4].filter(x => Math.abs(f(m, b, x)) <= 9 && Number.isInteger(f(m, b, x)) && f(m, b, x) % 1 === 0);
  const pick2 = shuffle(R, xsOk.slice());
  const xa = twoPts ? pick2[0] ?? -2 : 0, xb = twoPts ? (pick2[1] ?? 2) : (pick2[0] ?? 2);
  const ya = f(m, b, xa), yb = f(m, b, xb);
  const P = { x1: xa, y1: ya, x2: xb, y2: yb };
  const [lx, ly, rx, ry] = xa < xb ? [xa, ya, xb, yb] : [xb, yb, xa, ya];
  return pairItem({
    id: `graphToEq-${n}`, family: 'graphToEq', prompt: twoPts ? `The line goes through the marked points ${I('A')} and ${I('B')}. Write its equation.` : `Write the equation of the line. ${I('A')} is on the ${I('y')}-axis; ${I('B')} is another point on the line.`,
    board: `y = mx + b`, pairLead: `${I('y')} =`, pairOp: `${I('x')} +`, pairTail: '',
    picture: { lf: { lm: { x: X, y: Y, lines: [{ m, b }], pts: [{ x: xa, y: ya, name: 'A' }, { x: xb, y: yb, name: 'B' }], step: { x: lx, y: ly, run: rx - lx, rise: ry - ly } },
      show: ['axes', 'line', 'points'], solve: ['step', 'start'], tex: [`m = \\dfrac{${T(ry - ly)}}{${T(rx - lx)}} = ${T(m)}`, `b = ${T(b)}`, eqTex(m, b)] } },
    solution: [`Read the points: ${I('A')}(${H(xa)}, ${H(ya)}), ${I('B')}(${H(xb)}, ${H(yb)}).`, `Slope: ${H(ry - ly)} ÷ ${H(rx - lx)} = ${H(m)}.`, `${I('b')}: the line crosses the ${I('y')}-axis at ${H(b)}. So <b class="s">${eqHtml(m, b)}</b>.`],
  }, [m, b], (x, y) => classifyMB(m, b, x, y, P));
};

// ======================================================================================================
// 16 non-unit-scales · 17 contextual-axes: scaledRead
// ======================================================================================================
const scaledRead: Gen = (R, n) => {
  const c = pickCtx(R, k => ['gym', 'balloon', 'savings', 'phone', 'tank'].includes(k.id));
  const m = pick(R, c.ms), b = pick(R, c.bs);
  const xs = c.xMax >= 10 ? 2 : 1;
  const X = ax({ min: 0, max: xs * 6, step: xs }, axisX(c));
  const Y0 = yAxisFor([b, 0], [{ m, b }], X, axisY(c), 6);
  // an input whose output sits on a grid line when there is one (an exact reading)
  const cands = [2, 3, 4, 5].map(k => k * xs);
  const onGrid = cands.filter(x => Math.abs(((f(m, b, x) - Y0.min) / Y0.step) % 1) < 1e-9);
  const xr = pick(R, onGrid.length ? onGrid : cands);
  const yr = f(m, b, xr);
  const squares = (yr - Y0.min) / Y0.step;
  return numItem({
    id: `scaledRead-${n}`, family: 'scaledRead', prompt: `${c.story(m, b)} Use the graph: what is the ${c.yn} at ${xAmt(c, xr)}? Watch the scales on the axes.`,
    board: `${c.y}\\ \\text{at}\\ ${c.x} = ${xr}`, unit: c.money ? 'dollars' : c.ya,
    picture: { lf: { lm: { x: X, y: Y0, lines: [{ m, b }], read: xr }, show: ['axes', 'line'], solve: ['read'], tex: [`${T(m)}\\cdot ${xr} + ${T(b)} = ${T(yr)}`] } },
    solution: [`Each square on the ${c.yn} axis is ${H(Y0.step)} ${c.money ? 'dollars' : c.ya}, each square across is ${xs} ${c.xu}.`, `Up from ${xr} to the line, across to the ${c.yn} axis: <b class="s">${amt(c, yr)}</b>.`],
  }, yr, v => {
    if (near(v, yr)) return ok(`Yes: ${amt(c, yr)}.`);
    if (near(v, squares) || near(v, Y0.min + squares)) return no(`That counts squares. Each square is ${H(Y0.step)} ${c.money ? 'dollars' : c.ya}: read the axis numbers.`, MC.interval);
    if (near(v, m * xr)) return no(`Don’t forget the start, ${amt(c, b)}.`, MC.dropStart);
    return no(`Go up from ${xr} on the ${c.xn} axis to the line, then across to read the ${c.yn}.`);
  });
};

// ======================================================================================================
// 17 contextual-axes: chooseScale
// ======================================================================================================
const chooseScale: Gen = (R, n) => {
  const c = pickCtx(R, k => ['gym', 'balloon', 'savings', 'phone'].includes(k.id));
  const N = pick(R, [8, 10]);
  const m = pick(R, c.ms), b = pick(R, c.bs);
  const X = xAxis(xEnd(c, m, b), axisX(c), 6);
  const top = Math.max(f(m, b, X.max), f(m, b, 0));
  const nice = [5, 10, 20, 25, 50, 100, 200, 250, 500];
  const s = nice.find(v => v * N >= top)!;
  const small = nice[nice.indexOf(s) - 2] ?? s / 5, big = nice[nice.indexOf(s) + 2] ?? s * 5;
  const Y = ax({ min: 0, max: s * N, step: s }, axisY(c), false);
  return choiceItem(R, {
    id: `chooseScale-${n}`, family: 'chooseScale', prompt: `${c.story(m, b)} The graph runs to ${xAmt(c, X.max)}, so the ${c.yn} reaches ${amt(c, top)}. The ${c.yn} axis has ${N} squares. Which step per square fits best?`,
    board: `${N}\\ \\text{squares},\\ 0 \\text{ to } ${T(top)}`,
    picture: { lf: { lm: { x: X, y: Y, lines: [{ m, b }] }, show: ['axes', 'line'], solve: ['ticks'], tex: [`${N}\\times ${s} = ${N * s} \\ge ${T(top)}`] } },
    solution: [`The top of the axis must reach ${amt(c, top)}: ${N} squares × step ≥ ${H(top)}.`, `${N} × ${s} = ${N * s} fits; ${N} × ${small} = ${N * small} is too short; ${big} would squash the line into the bottom.`],
  }, [
    { t: `${s} per square`, ok: true, say: `Yes: ${N} × ${s} = ${N * s} reaches ${H(top)} and uses most of the axis.` },
    { t: `${small} per square`, mc: MC.misfit, say: `${N} × ${small} = ${N * small}: the line runs off the top before ${amt(c, top)}.` },
    { t: `${big} per square`, mc: MC.coverage, say: `It fits, but ${N} × ${big} = ${N * big} is far above ${H(top)}: the line would be squashed and hard to read.` },
  ]);
};

// ======================================================================================================
// 17 contextual-axes · 23 meaningful-domain: dotsOrLine
// ======================================================================================================
const dotsOrLine: Gen = (R, n) => {
  const wantCount = R() < 0.5;
  const c = pickCtx(R, k => (wantCount ? !!k.count : ['tank', 'candle', 'bike', 'balloon', 'plant'].includes(k.id)));
  const m = pick(R, c.ms), b = pick(R, c.bs);
  const end = c.ms[0]! < 0 ? Math.min(c.xMax, Math.floor(-b / m)) : c.xMax;
  const X = xAxis(xEnd(c, m, b), axisX(c), 6), Y = yAxisFor([b, 0], [{ m, b }], X, axisY(c), 7);
  const shown = [0, 1, 2, 3].map(k => Math.round(k * end / 3));
  const pts = shown.map(x => ({ x, y: f(m, b, x) }));
  const dots = Array.from({ length: end + 1 }, (_, i) => i);
  const line = c.count ? { m, b, dots } : { m, b, lo: 0, hi: end };
  return choiceItem(R, {
    id: `dotsOrLine-${n}`, family: 'dotsOrLine', prompt: `${c.story(m, b)} Some points are plotted for 0 to ${xAmt(c, end)}. How should the graph of the whole situation look?`,
    board: `0 \\le ${c.x} \\le ${end}`,
    picture: { lf: { lm: { x: X, y: Y, lines: [line], pts }, show: ['axes', 'points'], solve: ['line'], tex: [c.count ? `${c.x} = 0, 1, 2, \\dots, ${end}` : `0 \\le ${c.x} \\le ${end}`] } },
    solution: c.count ? [`You can only buy whole ${c.xu}: ${c.x} = 0, 1, 2, …`, `So the graph is <b class="s">dots</b> at whole numbers, not a solid line.`]
      : [`${cap(c.xn)} goes on smoothly: ${xAmt(c, 1.5)} makes sense too.`, `So the graph is a <b class="s">solid segment</b> from 0 to ${end}.`],
  }, c.count ? [
    { t: `Dots at 0, 1, 2, …, ${end}`, ok: true, say: `Yes: only whole ${c.xu} make sense.` },
    { t: `A solid line segment from 0 to ${end}`, mc: MC.discrete, say: `A solid line would include ${xAmt(c, 2.5)}. You can’t buy half a ${c.xu1}.` },
    { t: `A line that goes on forever`, mc: MC.allReals, say: `Only whole numbers from 0 to ${end} make sense here: no negatives, no halves.` },
  ] : [
    { t: `A solid line segment from 0 to ${end}`, ok: true, say: `Yes: every ${c.xn} in between makes sense.` },
    { t: `Only the plotted dots`, mc: MC.onlyObserved, say: `The ${c.yn} has a value at every moment, not just at the plotted ones.` },
    { t: `A line that goes on forever`, mc: MC.allReals, say: `Before 0 or after ${end} the story doesn’t apply. Stop the segment there.` },
  ]);
};

// ======================================================================================================
// 18 slope-units · 22 evidence-justification: refuteClaim
// ======================================================================================================
const refuteClaim: Gen = (R, n, sg) => {
  const c = pickCtx(R, k => ['bike', 'gym', 'phone'].includes(k.id));
  const m = pick(R, c.ms), b = pick(R, c.bs);
  const who = pick(R, NAMES);
  const xs = [0, 1, 2, 3], ys = xs.map(x => f(m, b, x));
  const X = xAxis(4, axisX(c), 4), Y = yAxisFor([b, 0], [{ m, b }], X, axisY(c), 7);
  const kind = sg === 'slope-units' ? 'unit' : pick(R, ['total', 'swap'] as const);
  const eqH = ctxEqH(c, m, b);
  const claim = kind === 'unit' ? `the unit of the slope ${H(m)} is ${c.xu} per dollar`
    : kind === 'total' ? `the ${H(m)} means you pay $${m} in total`
      : `the ${H(b)} means you pay $${b} per ${c.xu1}`;
  const opts: Opt[] = kind === 'unit' ? [
    { t: `From 1 to 2 ${c.xu} the cost goes ${amt(c, ys[1]!)} → ${amt(c, ys[2]!)}: ${m} dollars for ONE ${c.xu1}, so dollars per ${c.xu1}.`, ok: true, say: `Yes: change in dollars ÷ change in ${c.xu}.` },
    { t: `${who} is right: you divide ${c.xu} by dollars.`, mc: MC.inverted, say: `The slope is change in OUTPUT (dollars) ÷ change in INPUT (${c.xu}): dollars per ${c.xu1}.` },
    { t: `${who} is wrong because the slope is just a number.`, mc: MC.labels, say: `A slope in a story has a unit. Use numbers: ${m} more dollars for each extra ${c.xu1}.` },
  ] : kind === 'total' ? [
    { t: `1 ${c.xu1} costs ${amt(c, ys[1]!)} and 2 cost ${amt(c, ys[2]!)}: each extra ${c.xu1} adds ${amt(c, m)}.`, ok: true, say: `Yes: the ${H(m)} is added for EVERY ${c.xu1}, not once.` },
    { t: `${who} is right: ${H(m)} is an amount of dollars.`, mc: MC.perUnit, say: `It is ${amt(c, m)} for each ${c.xu1}: 3 ${c.xu} add ${amt(c, 3 * m)}.` },
    { t: `${who} is wrong because ${H(m)} is the slope.`, mc: MC.labels, say: `Naming it is not proof. Show the numbers: each extra ${c.xu1} adds ${amt(c, m)}.` },
  ] : [
    { t: `At 0 ${c.xu} the cost is already ${amt(c, b)}, and it is ${amt(c, ys[1]!)} after 1 ${c.xu1}: only ${amt(c, m)} more.`, ok: true, say: `Yes: the ${H(b)} is paid once, at the start.` },
    { t: `${who} is right: ${H(b)} is the bigger number, so it is the price per ${c.xu1}.`, mc: MC.swap, say: `Size does not decide. The number that multiplies ${I(c.x)} is the rate: ${H(m)} per ${c.xu1}.` },
    { t: `${who} is wrong because ${H(b)} is the ${I('y')}-intercept.`, mc: MC.labels, say: `True, but show it with numbers: at 0 ${c.xu}, ${eqH.split(' = ')[1]} gives ${amt(c, b)}.` },
  ];
  return choiceItem(R, {
    id: `refuteClaim-${n}`, family: 'refuteClaim', prompt: `${c.story(m, b)} So ${eqH}. ${who} says ${claim}. Which evidence settles it?`,
    board: ctxEqT(c, m, b),
    picture: { lf: { lm: { x: X, y: Y, table: tableOf(c, xs, ys), lines: [{ m, b }], pts: xs.map((x, i) => ({ x, y: ys[i]! })), step: { x: 1, y: ys[1]!, run: 1, rise: m } },
      show: ['axes', 'table', 'points'], solve: kind === 'swap' ? ['start', 'line'] : ['step', 'line'], row: kind === 'swap' ? 0 : 2,
      tex: kind === 'swap' ? [`${c.x} = 0:\\ ${c.y} = ${T(b)}`] : [`${T(ys[2]!)} - ${T(ys[1]!)} = ${T(m)}\\ \\text{per ${c.xa}}`] } },
    solution: [`Use the table, not just names.`, kind === 'swap' ? `At 0 ${c.xu} the cost is ${amt(c, b)}: the ${H(b)} is paid once.` : `Each extra ${c.xu1} adds ${amt(c, m)}: the ${H(m)} is dollars per ${c.xu1}.`],
  }, opts);
};

// ======================================================================================================
// 19 slope-units-conversion (optional): convertRate · rewriteEq (no picture)
// ======================================================================================================
const convertRate: Gen = (R, n) => {
  const kind = pick(R, ['centsMin', 'galHour', 'miMin', 'litHour'] as const);
  let m: number, ans: number, wrong: number, from: string, to: string, steps: string[], fromT: string, toT: string;
  if (kind === 'centsMin') { m = pick(R, [6, 9, 12, 15, 18, 24, 30]); ans = (m * 100) / 60; wrong = m * 100 * 60; from = `$${m} per hour`; to = 'cents per minute'; fromT = `\\$${m}\\text{ per hour}`; toT = `\\text{cents per minute}`; steps = [`$${m} = ${m * 100} cents.`, `One hour is 60 minutes: ${m * 100} ÷ 60 = <b class="s">${H(ans)}</b> cents per minute.`]; }
  else if (kind === 'galHour') { m = pick(R, [2, 2.5, 3, 4, 1.5]); ans = m * 60; wrong = m / 60; from = `${H(m)} gallons per minute`; to = 'gallons per hour'; fromT = `${T(m)}\\text{ gal per minute}`; toT = `\\text{gal per hour}`; steps = [`An hour has 60 minutes, so 60 times as many gallons.`, `${H(m)} × 60 = <b class="s">${H(ans)}</b> gallons per hour.`]; }
  else if (kind === 'miMin') { m = pick(R, [30, 45, 60, 12, 24, 54]); ans = m / 60; wrong = m * 60; from = `${m} miles per hour`; to = 'miles per minute'; fromT = `${m}\\text{ mi per hour}`; toT = `\\text{mi per minute}`; steps = [`A minute is 1/60 of an hour, so 1/60 of the miles.`, `${m} ÷ 60 = <b class="s">${H(ans)}</b> miles per minute.`]; }
  else { m = pick(R, [3, 4, 5, 1.5]); ans = m * 60; wrong = m / 60; from = `${H(m)} liters per minute`; to = 'liters per hour'; fromT = `${T(m)}\\text{ L per minute}`; toT = `\\text{L per hour}`; steps = [`An hour has 60 minutes: 60 times as many liters.`, `${H(m)} × 60 = <b class="s">${H(ans)}</b> liters per hour.`]; }
  const it = numItem({
    id: `convertRate-${n}`, family: 'convertRate', prompt: `Rewrite the rate ${from} in ${to}.`, board: `${fromT} = \\,?\\ ${toT}`, unit: to,
    solution: steps,
  }, ans, v => {
    if (near(v, ans)) return ok(`Yes: ${H(ans)} ${to}.`);
    if (near(v, wrong)) return no(`Wrong way round. A ${kind === 'galHour' || kind === 'litHour' ? 'longer time holds MORE' : 'shorter time holds LESS'}: ${kind === 'galHour' || kind === 'litHour' ? 'multiply' : 'divide'} by 60.`, MC.convDir);
    if (kind === 'centsMin' && near(v, m / 60)) return no(`That is dollars per minute. In cents: × 100.`);
    return no(`Think: how much in ONE ${to.split(' per ')[1]}?`);
  });
  it.slateTex = [`= ${T(ans)}\\ ${toT}`];
  return it;
};
const rewriteEq: Gen = (R, n) => {
  const m = pick(R, [6, 9, 12, 15, 18, 24, 30]), b = pick(R, [10, 15, 20, 25, 40]);
  const kind = pick(R, ['minutes', 'cents'] as const);
  const mm = m / 60;
  const story = `A boat rental: ${I('C')} = ${m}${I('h')} + ${b}, where ${I('C')} is the cost in dollars and ${I('h')} the time in hours.`;
  const it = kind === 'minutes' ? choiceItem(R, {
    id: `rewriteEq-${n}`, family: 'rewriteEq', prompt: `${story} Rewrite it with ${I('t')} = the time in MINUTES (${I('C')} stays in dollars).`,
    board: `C = ${m}h + ${b}`,
    solution: [`$${m} per hour = ${H(mm)} dollars per minute (÷ 60).`, `The fee is still $${b}: ${I('C')} = ${H(mm)}${I('t')} + ${b}. Check 60 minutes: ${H(mm)} · 60 + ${b} = ${m + b}, the same as 1 hour.`],
  }, [
    { t: `${I('C')} = ${H(mm)}${I('t')} + ${b}`, ok: true, say: `Yes: 60 minutes give ${H(mm)} · 60 + ${b} = ${m + b}, the same as 1 hour.` },
    { t: `${I('C')} = ${m * 60}${I('t')} + ${b}`, mc: MC.convDir, say: `A minute is SHORTER than an hour, so it costs less: ${m} ÷ 60 = ${H(mm)} per minute.` },
    { t: `${I('C')} = ${H(mm)}${I('t')} + ${H(b / 60)}`, say: `The fee is paid once, in dollars: it stays ${b}. Only the rate is per minute now.` },
  ]) : choiceItem(R, {
    id: `rewriteEq-${n}`, family: 'rewriteEq', prompt: `${story} Rewrite it with ${I('K')} = the cost in CENTS (${I('h')} stays in hours).`,
    board: `C = ${m}h + ${b}`,
    solution: [`Every dollar amount × 100: the rate is ${m * 100} cents per hour, the fee ${b * 100} cents.`, `${I('K')} = ${m * 100}${I('h')} + ${b * 100}. Check 1 hour: ${m * 100 + b * 100} cents = $${m + b}.`],
  }, [
    { t: `${I('K')} = ${m * 100}${I('h')} + ${b * 100}`, ok: true, say: `Yes: both parts are in cents now. 1 hour: ${m * 100 + b * 100} cents = $${m + b}.` },
    { t: `${I('K')} = ${m * 100}${I('h')} + ${b}`, mc: MC.convSlope, say: `The fee must be in cents too: $${b} = ${b * 100} cents. Otherwise 1 hour gives ${m * 100 + b} cents, not ${m * 100 + b * 100}.` },
    { t: `${I('K')} = ${H(m / 100)}${I('h')} + ${H(b / 100)}`, mc: MC.convDir, say: `Cents are smaller, so there are MORE of them: × 100, not ÷ 100.` },
  ]);
  it.slateTex = [kind === 'minutes' ? `C = ${T(mm)}t + ${b}` : `K = ${m * 100}h + ${b * 100}`];
  return it;
};

// ======================================================================================================
// 20 intercept-units · 23 meaningful-domain: interceptMeaning
// ======================================================================================================
const interceptMeaning: Gen = (R, n, sg) => {
  if (sg === 'meaningful-domain') {
    const meaningless = R() < 0.6;
    if (meaningless) {
      const kind = pick(R, ['teen', 'ice'] as const);
      const M = kind === 'teen' ? { m: pick(R, [2, 2.5]), b: pick(R, [28, 30, 32]), lo: 12, hi: 16, x: 'a', y: 'H', xn: 'age', yn: 'height', xu: 'years', ya: 'in.', why: `nobody is ${'B'} in. tall at birth from this model: it was fitted to ages 12 to 16` }
        : { m: 0.5, b: pick(R, [-2, -3, -4]), lo: 10, hi: 30, x: 'd', y: 'I', xn: 'day', yn: 'ice', xu: 'days', ya: 'in.', why: `ice can’t be ${'B'} in. thick: the model only fits days 10 to 30` };
      const X = ax({ min: 0, max: M.hi + (kind === 'teen' ? 2 : 5), step: kind === 'teen' ? 2 : 5 }, `${M.xn} (${kind === 'teen' ? 'yr' : 'days'})`);
      const Y = ax(windowFor([M.b, f(M.m, M.b, X.max)], { lines: 8 }), `${M.yn} (${M.ya})`);
      const why = M.why.replace('B', H(M.b));
      return choiceItem(R, {
        id: `interceptMeaning-${n}`, family: 'interceptMeaning',
        prompt: kind === 'teen' ? `A model for a teen’s height: ${I('H')} = ${H(M.m)}${I('a')} + ${M.b} (inches), for ages 12 to 16. Does ${I('b')} = ${M.b} mean the height at age 0?`
          : `A model for ice on a lake: ${I('I')} = 0.5${I('d')} − ${-M.b} (inches) for days 10 to 30 of winter. Does ${I('b')} = ${H(M.b)} mean the ice at day 0?`,
        board: `${M.y} = ${T(M.m)}${M.x} ${sT(M.b)}`,
        picture: { lf: { lm: { x: X, y: Y, lines: [{ m: M.m, b: M.b, lo: M.lo, hi: M.hi }], backFrom: M.lo }, show: ['axes', 'line'], solve: ['back', 'domain'], tex: [`${M.lo} \\le ${M.x} \\le ${M.hi}`] } },
        solution: [`The model was made for ${M.xn}s ${M.lo} to ${M.hi} only.`, `At ${M.xn} 0 it gives ${H(M.b)} in., but ${why}. Here ${I('b')} is just a number that places the line.`],
      }, [
        { t: `No: the model only fits ${M.xn}s ${M.lo} to ${M.hi}; at 0 it means nothing real.`, ok: true, say: `Yes: ${cap(why)}.` },
        { t: `Yes: ${I('b')} is always the starting value.`, mc: MC.alwaysMeaning, say: `Only when input 0 is inside the model’s range. Here ${why}.` },
        { t: `Yes: at ${M.xn} 0 the ${M.yn} was ${H(M.b)} in.`, mc: MC.alwaysMeaning, say: `The line was never checked there: ${why}.` },
      ]);
    }
    const c = pickCtx(R, k => !!k.money && !k.count);
    const m = pick(R, c.ms), b = pick(R, c.bs);
    const X = xAxis(xEnd(c, m, b), axisX(c), 6), Y = yAxisFor([b, 0], [{ m, b }], X, axisY(c), 7);
    return choiceItem(R, {
      id: `interceptMeaning-${n}`, family: 'interceptMeaning', prompt: `${c.story(m, b)} So ${ctxEqH(c, m, b)}. Does ${I('b')} = ${b} have a real meaning here?`,
      board: ctxEqT(c, m, b),
      picture: { lf: { lm: { x: X, y: Y, lines: [{ m, b, lo: 0 }] }, show: ['axes', 'line'], solve: ['start'], tex: [`${c.x} = 0:\\ ${c.y} = ${b}`] } },
      solution: [`Input 0 makes sense here (you sign up but use nothing).`, `So ${I('b')} = ${b} is real: ${c.bWhat}, ${amt(c, b)}.`],
    }, [
      { t: `Yes: it is ${c.bWhat}, ${amt(c, b)}, paid even at 0 ${c.xu}.`, ok: true, say: `Yes: 0 ${c.xu} is a real case, and it costs ${amt(c, b)}.` },
      { t: `No: an intercept never means anything in a story.`, say: `Sometimes it does. Here 0 ${c.xu} is possible, and you still pay ${amt(c, b)}.` },
      { t: `Yes: it is the cost of each ${c.xu1}.`, mc: MC.swap, say: `Each ${c.xu1} costs ${amt(c, m)}, the slope. ${I('b')} is paid once.` },
    ]);
  }
  const c = pickCtx(R, k => !k.count);
  const m = pick(R, c.ms), b = pick(R, c.bs.filter(v => v > 0));
  const X = xAxis(xEnd(c, m, b), axisX(c), 6), Y = yAxisFor([b, 0], [{ m, b }], X, axisY(c), 7);
  const xi = -b / m;
  const opts: Opt[] = [
    { t: `At 0 ${c.xu}, the ${c.yn} is ${amt(c, b)}.`, ok: true, say: `Yes: ${I('b')} = ${H(b)} ${c.yu}, the ${c.yn} at the start.` },
    { t: `The ${c.yn} changes by ${amt(c, b)} per ${c.xu1}.`, mc: MC.swap, say: `That is what the slope tells. (0, ${H(b)}) is one point: at 0 ${c.xu}, ${amt(c, b)}.` },
    ...(m < 0 && Number.isFinite(xi) ? [{ t: `After ${xAmt(c, b)}, the ${c.yn} is 0.`, mc: MC.zeroSwap, say: `In (0, ${H(b)}) the 0 is the ${c.xn}, the ${H(b)} the ${c.yn}. It runs out after ${xAmt(c, xi)}.` }] : []),
    { t: `It takes ${xAmt(c, b)}.`, mc: MC.bInputUnits, say: `${H(b)} is on the ${c.yn} axis: it is ${yAmtWords(c, b)}, not ${c.xu}.` },
  ];
  return choiceItem(R, {
    id: `interceptMeaning-${n}`, family: 'interceptMeaning', prompt: `${c.story(m, b)} The graph meets the ${c.yn} axis at (0, ${H(b)}). What does that point mean?`,
    board: `(0,\\ ${T(b)})`,
    picture: { lf: { lm: { x: X, y: Y, lines: [{ m, b }] }, show: ['axes', 'line', 'start'], solve: [], tex: [`b = ${T(b)}\\ \\text{${c.money ? 'dollars' : c.yu}}`] } },
    solution: [`In (0, ${H(b)}) the first number is the ${c.xn} (0 ${c.xu}), the second the ${c.yn}.`, `So ${I('b')} = ${H(b)} is ${c.bWhat}, in ${c.money ? 'dollars' : c.yu}.`],
  }, [opts[0]!, ...shuffle(R, opts.slice(1)).slice(0, 2)]);
};

// ======================================================================================================
// 21 proportional-contrast: isProportional · doubleInput
// ======================================================================================================
const isProportional: Gen = (R, n) => {
  const prop = R() < 0.4;
  const c = pickCtx(R, k => k.yn === 'cost' && k.ms[0]! > 0 && !k.count);
  const m = pick(R, c.ms), b = prop ? 0 : pick(R, c.bs);
  const X = xAxis(xEnd(c, m, b), axisX(c), 6), Y = yAxisFor([b, 0], [{ m, b }], X, axisY(c), 7);
  const x1 = 2, y1 = f(m, b, x1), y2 = f(m, b, 2 * x1);
  const form = pick(R, ['eq', 'graph'] as const);
  const prompt = (form === 'eq' ? `${prop ? `A shop charges ${amt(c, m)} per ${c.xu1}, nothing else.` : c.story(m, b)} The cost is ${ctxEqH(c, m, b)}.` : `The graph shows the ${c.yn} for ${c.xn === 'time' ? 'the time' : c.xn} in ${c.xu}.`) + ` Is the ${c.yn} proportional to the ${c.xn}?`;
  return choiceItem(R, {
    id: `isProportional-${n}`, family: 'isProportional', prompt, board: form === 'eq' ? ctxEqT(c, m, b) : `\\text{proportional?}`,
    picture: { lf: { lm: { x: X, y: Y, lines: [{ m, b }], pts: [{ x: x1, y: y1 }, { x: 2 * x1, y: y2 }] }, show: form === 'eq' ? ['axes'] : ['axes', 'line', 'points'], solve: form === 'eq' ? ['line', 'start', 'points'] : ['start'],
      ray: prop ? undefined : { x: x1, y: y1 }, tex: [`${x1} \\to ${T(y1)},\\quad ${2 * x1} \\to ${T(y2)}`] } },
    solution: prop ? [`At 0 ${c.xu} the cost is 0, and the line goes through (0, 0).`, `${x1} ${c.xu}: ${amt(c, y1)}; ${2 * x1} ${c.xu}: ${amt(c, y2)}, double. Proportional (and linear too).`]
      : [`At 0 ${c.xu} the cost is already ${amt(c, b)}: the line misses (0, 0).`, `${x1} ${c.xu}: ${amt(c, y1)}, but ${2 * x1} ${c.xu}: ${amt(c, y2)}, not double. Linear, but not proportional.`],
  }, prop ? [
    { t: `Yes: it goes through (0, 0), and double the ${c.xu} costs double.`, ok: true, say: `Yes: ${amt(c, y1)} then ${amt(c, y2)}. A proportional relationship is a linear one with ${I('b')} = 0.` },
    { t: `No: it is linear, so it can’t be proportional.`, mc: MC.dichot, say: `Proportional relationships ARE linear: the ones with ${I('b')} = 0.` },
    { t: `No: the cost goes up by ${amt(c, m)} each ${c.xu1}, so it is only linear.`, mc: MC.dichot, say: `Going up by the same amount AND starting at 0: that is proportional. Double ${x1} → ${2 * x1} doubles the cost.` },
  ] : [
    { t: `No: at 0 ${c.xu} it is already ${amt(c, b)}, so doubling the ${c.xu} does not double the cost.`, ok: true, say: `Yes: ${amt(c, y1)} for ${x1} ${c.xu}, ${amt(c, y2)} for ${2 * x1}: not double.` },
    { t: `Yes: the graph is a straight line.`, mc: MC.propo, say: `Straight is linear, not proportional. A proportional line must go through (0, 0).` },
    { t: `Yes: it goes up the same ${amt(c, m)} every ${c.xu1}.`, mc: MC.propo, say: `A constant rate makes it linear. It also has to start at 0 to be proportional, and it starts at ${amt(c, b)}.` },
  ]);
};
const doubleInput: Gen = (R, n) => {
  const c = pickCtx(R, k => k.yn === 'cost' && k.ms[0]! > 0);
  const m = pick(R, c.ms), b = pick(R, c.bs);
  const x1 = pick(R, [2, 3].filter(v => 2 * v <= c.xMax + 2)), y1 = f(m, b, x1), x2 = 2 * x1, y2 = f(m, b, x2);
  const X = ax(windowFor([0, x2], { lines: 6 }), axisX(c));
  const Y = ax(windowFor([0, 2 * y1, b], { lines: 8 }), axisY(c));
  return numItem({
    id: `doubleInput-${n}`, family: 'doubleInput', prompt: `${c.story(m, b)} ${xAmt(c, x1)} cost ${H(y1, { money: true })}. What do ${xAmt(c, x2)} cost?`,
    board: `${c.y} = ${T(m)}${c.x} + ${T(b)}`, unit: 'dollars',
    picture: { lf: { lm: { x: X, y: Y, lines: [{ m, b }], pts: [{ x: x1, y: y1, name: 'P' }], read: x2 }, show: ['axes', 'line', 'points'], solve: ['read', 'start'], ray: { x: x1, y: y1 }, ghost: { x: x2, y: 2 * y1 },
      tex: [`${T(m)}\\cdot ${x2} + ${T(b)} = ${T(y2)}`, `${T(y2)} \\ne 2\\cdot ${T(y1)}`] } },
    solution: [`The ${c.bWhat} (${amt(c, b)}) is paid once, so the cost does not double.`, `${H(m)} · ${x2} + ${b} = <b class="s">${H(y2, { money: true })}</b>, not 2 × ${H(y1, { money: true })} = ${H(2 * y1, { money: true })}.`],
  }, y2, v => {
    if (near(v, y2)) return ok(`Yes: ${H(y2, { money: true })}. Only the per-${c.xu1} part doubles.`);
    if (near(v, 2 * y1)) return no(`Doubling counts ${c.bWhat} twice. It is paid once: ${H(m)} · ${x2} + ${b}.`, MC.scaleProp);
    if (near(v, m * x2)) return no(`Add ${c.bWhat}, ${amt(c, b)}.`, MC.dropStart);
    return no(`Use the rule: ${H(m)} · ${x2} + ${b}.`);
  });
};

// ======================================================================================================
// 22 evidence-justification: whichEvidence
// ======================================================================================================
const whichEvidence: Gen = (R, n) => {
  const c = pickCtx(R, k => k.yn === 'cost' && k.ms[0]! > 0 && !k.count);
  const m = pick(R, c.ms), b = pick(R, c.bs);
  const xs = [0, 1, 2, 3], ys = xs.map(x => f(m, b, x));
  const X = xAxis(4, axisX(c), 4), Y = yAxisFor([b, 0], [{ m, b }], X, axisY(c), 7);
  const aboutB = R() < 0.5;
  const eqH = ctxEqH(c, m, b);
  return choiceItem(R, {
    id: `whichEvidence-${n}`, family: 'whichEvidence',
    prompt: `${eqH} and the table belong together. Claim: ${aboutB ? `the ${H(b)} is ${c.bWhat}` : `the ${H(m)} is the price per ${c.xu1}`}. Which evidence proves it?`,
    board: ctxEqT(c, m, b),
    picture: { lf: { lm: { x: X, y: Y, table: tableOf(c, xs, ys), lines: [{ m, b }], pts: xs.map((x, i) => ({ x, y: ys[i]! })), step: { x: 1, y: ys[1]!, run: 1, rise: m } },
      show: ['axes', 'table', 'points'], solve: aboutB ? ['start', 'line'] : ['step', 'line'], row: aboutB ? 0 : 2,
      tex: aboutB ? [`${c.x} = 0:\\ ${T(m)}\\cdot 0 + ${T(b)} = ${T(b)}`] : [`${T(ys[2]!)} - ${T(ys[1]!)} = ${T(m)}`] } },
    solution: aboutB ? [`Evidence must use numbers: at ${I(c.x)} = 0 nothing has been used yet, and the cost is ${amt(c, b)}.`] : [`Evidence must use numbers: one more ${c.xu1} (1 → 2) adds ${amt(c, m)}.`],
  }, aboutB ? [
    { t: `At ${I(c.x)} = 0 the table gives ${amt(c, b)}: you pay it before using anything.`, ok: true, say: `Yes: the output at input 0 is the one-time part.` },
    { t: `It is the constant term, so it is the fee.`, mc: MC.labels, say: `That names it, but doesn’t show it. Use a number: at ${I(c.x)} = 0 the cost is ${amt(c, b)}.` },
    { t: `It is the last number in the equation.`, mc: MC.position, say: `Position proves nothing (${ctxEqH(c, m, b, 'b+mx')} is the same function). Show the cost at ${I(c.x)} = 0.` },
  ] : [
    { t: `From ${I(c.x)} = 1 to 2 the cost goes ${amt(c, ys[1]!)} → ${amt(c, ys[2]!)}: ${amt(c, m)} more for one ${c.xu1}.`, ok: true, say: `Yes: one more ${c.xu1}, ${amt(c, m)} more.` },
    { t: `It is the slope, so it is the price per ${c.xu1}.`, mc: MC.labels, say: `Naming it is not proof. Show one more ${c.xu1} adding ${amt(c, m)}.` },
    { t: `At ${I(c.x)} = 1 the cost is ${amt(c, ys[1]!)}.`, mc: MC.height, say: `That is a total, not a change. Compare two ${c.xu}: the change for ONE ${c.xu1}.` },
  ]);
};

// ======================================================================================================
// 23 meaningful-domain: validInputs · 24 qualified-prediction: predict · predictValid
// ======================================================================================================
const validInputs: Gen = (R, n) => {
  const c = pickCtx(R, k => ['tank', 'candle', 'balloon', 'card'].includes(k.id));
  const m = pick(R, c.ms);
  let b = pick(R, c.bs);
  for (let t = 0; t < 20 && !Number.isInteger(-b / m); t++) b = pick(R, c.bs);
  const end = -b / m;
  const ok2 = Number.isInteger(end);
  const E = ok2 ? end : Math.floor(end);
  const X = ax(windowFor([0, E + Math.max(2, Math.round(E / 4))], { lines: 7 }), axisX(c));
  const Y = ax(windowFor([b, f(m, b, X.max)], { lines: 8 }), axisY(c));
  const ineq = c.count ? `whole numbers 0 to ${E}` : `0 ≤ ${I(c.x)} ≤ ${E}`;
  const lines = [c.count ? { m, b, dots: Array.from({ length: E + 1 }, (_, i) => i) } : { m, b, lo: 0, hi: E }, { m, b, col: 'link' as const }];
  return choiceItem(R, {
    id: `validInputs-${n}`, family: 'validInputs', prompt: `${c.story(m, b)} The model is ${ctxEqH(c, m, b)}. For which inputs ${I(c.x)} does it make sense?`,
    board: ctxEqT(c, m, b),
    picture: { lf: { lm: { x: X, y: Y, lines }, show: ['axes', 'line2'], solve: ['line', 'domain'], hide: ['line2'], tex: [c.count ? `${c.x} = 0, 1, \\dots, ${E}` : `0 \\le ${c.x} \\le ${E}`] } },
    solution: [`${cap(c.xn)} starts at 0: no negative ${c.xu}.`, `At ${I(c.x)} = ${E} the ${c.yn} reaches 0 ${c.money ? 'dollars' : c.ya}: after that the model would go negative.`, `So: <b class="s">${ineq}</b>.`],
  }, [
    { t: c.count ? `Whole numbers from 0 to ${E}` : `0 ≤ ${I(c.x)} ≤ ${E}`, ok: true, say: `Yes: from the start until the ${c.yn} runs out${c.count ? ', whole ' + c.xu + ' only' : ''}.` },
    { t: `All numbers ${I(c.x)}`, mc: MC.allReals, say: `The formula works for any number, the story doesn’t: no negative ${c.xu}, and nothing left after ${E}.` },
    { t: `${I(c.x)} ≥ 0`, mc: MC.allReals, say: `After ${xAmt(c, E)} the ${c.yn} would be negative. The model stops at ${E}.` },
  ]);
};
const predict: Gen = (R, n) => {
  const c = pickCtx(R, k => !k.count && k.ms[0]! > 0);
  const m = pick(R, c.ms), b = pick(R, c.bs);
  const hi = c.xMax;
  const xp = int(R, 1, hi - 1) + (R() < 0.3 && !c.count ? 0.5 : 0);
  const yp = f(m, b, xp);
  const X = xAxis(hi, axisX(c), 6), Y = yAxisFor([b, 0], [{ m, b }], X, axisY(c), 7);
  return numItem({
    id: `predict-${n}`, family: 'predict', prompt: `${c.story(m, b)} The model ${ctxEqH(c, m, b)} holds for 0 to ${xAmt(c, hi)}. Predict the ${c.yn} at ${xAmt(c, xp)}.`,
    board: `${c.y} = ${T(m)}\\cdot ${T(xp)} + ${T(b)}`, unit: c.money ? 'dollars' : c.ya,
    picture: { lf: { lm: { x: X, y: Y, lines: [{ m, b, lo: 0, hi }], read: xp }, show: ['axes', 'line'], solve: ['read'], tex: [`${c.y} = ${T(m * xp)} + ${T(b)} = ${T(yp)}`] } },
    solution: [`${H(xp)} is inside 0 to ${hi}, so the model applies.`, `${H(m)} · ${H(xp)} + ${H(b)} = <b class="s">${amt(c, yp)}</b>.`],
  }, yp, v => {
    if (near(v, yp)) return ok(`Yes: ${amt(c, yp)} at ${xAmt(c, xp)}.`);
    if (near(v, m * xp)) return no(`Add the start, ${amt(c, b)}: it is part of every output.`, MC.dropStart);
    if (near(v, b * xp + m)) return no(`Swapped: ${H(m)} is per ${c.xu1}, ${H(b)} is the start.`, MC.swap);
    return no(`Put ${I(c.x)} = ${H(xp)} into ${ctxEqH(c, m, b)}.`);
  });
};
const predictValid: Gen = (R, n) => {
  const kind = pick(R, ['plant', 'teen', 'savings'] as const);
  const M = kind === 'plant' ? { m: pick(R, [1.5, 2, 2.5]), b: pick(R, [3, 4]), hi: 8, x: 'w', y: 'H', xn: 'weeks', unit: 'in.', what: 'the seedling’s height', far: pick(R, [40, 52, 60]), why: 'plants stop growing at a steady rate' }
    : kind === 'teen' ? { m: 2.5, b: pick(R, [28, 30]), hi: 16, x: 'a', y: 'H', xn: 'years old', unit: 'in.', what: 'a teen’s height', far: pick(R, [30, 40, 50]), why: 'people stop growing in their late teens' }
      : { m: pick(R, [10, 15, 20]), b: pick(R, [20, 40]), hi: 36, x: 'w', y: 'S', xn: 'weeks', unit: '$', what: 'savings for one school year', far: pick(R, [100, 150]), why: 'the plan only runs for the 36 weeks of the school year' };
  const lo = kind === 'teen' ? 12 : 0;
  const yFar = f(M.m, M.b, M.far);
  const val = M.unit === '$' ? H(yFar, { money: true }) : `${H(yFar)} in.`;
  const X = ax(windowFor([0, M.far], { lines: 6 }), kind === 'teen' ? 'age (yr)' : 'time (wk)');
  const Y = ax(windowFor([0, yFar, M.b], { lines: 8 }), kind === 'savings' ? 'savings ($)' : 'height (in.)');
  return choiceItem(R, {
    id: `predictValid-${n}`, family: 'predictValid',
    prompt: `A model for ${M.what}: ${I(M.y)} = ${H(M.m)}${I(M.x)} + ${M.b}, valid for ${lo} to ${M.hi} ${M.xn}. What does it predict at ${M.far} ${M.xn}?`,
    board: `${M.y} = ${T(M.m)}${M.x} + ${M.b}`,
    picture: { lf: { lm: { x: X, y: Y, lines: [{ m: M.m, b: M.b, lo, hi: M.hi }] }, show: ['axes', 'line'], solve: ['domain'], pre: [`${lo} \\le ${M.x} \\le ${M.hi}`], ghost: { x: M.far, y: yFar }, tex: [`${M.far} > ${M.hi}`] } },
    solution: [`${M.far} is outside ${lo} to ${M.hi}: the model was never checked there.`, `The formula gives ${val}, but ${M.why}. A fair prediction stays inside the valid inputs.`],
  }, [
    { t: `No safe prediction: ${M.far} is outside ${lo} to ${M.hi}, and ${M.why}.`, ok: true, say: `Yes: always say where a model holds.` },
    { t: val, mc: MC.extrap, say: `The formula gives ${val}, but ${M.far} is outside ${lo} to ${M.hi}: ${M.why}.` },
    { t: `${M.unit === '$' ? H(f(M.m, M.b, M.hi), { money: true }) : H(f(M.m, M.b, M.hi)) + ' in.'}, the value at ${M.hi}`, say: `That is the last value the model covers; it says nothing about ${M.far}.` },
  ]);
};

export const GENERATORS: Record<FamilyId, Gen> = {
  tableRate, fasterLine, startTable, startGraph, scaledRate, rateSentence, rateUnit, pickMB, sameFunction,
  whatChanged, predictShift, storyToEq, storyPair, twoPointRate, specialSlope, isLinear, fitsRule, backSolve, eqTwoPoints,
  eqFromTable, onTheLine, plotPoint, slopeStep, whichGraph, graphToEq, scaledRead, chooseScale, dotsOrLine, refuteClaim,
  convertRate, rewriteEq, interceptMeaning, isProportional, doubleInput, whichEvidence, validInputs, predict, predictValid,
};
