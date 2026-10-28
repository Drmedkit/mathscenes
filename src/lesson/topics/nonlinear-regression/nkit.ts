// nkit.ts: what every practice family of "Quadratic and exponential regression" shares: the item type and its picture
// (plain data the page draws: scatter plots and residual plots on the shared kit's Plane, with fitted curves given by
// their family and parameters; data / technology-output cards from linear-regression's DataCard; a difference table
// from function-families' DiffTable), misconception ids, realistic contexts (US units), data makers and planes. The
// choice / number / pair item makers are linear-regression's (one choice helper drops a wrong choice equivalent to the
// right one). Pure: no DOM.
import { type Item, int, pick, shuffle } from '../../runtime/item';
import { ans } from '../../runtime/explain';
import type { GAxis, GItem } from '../linear-functions-slope/graphPic';
import * as LR from '../linear-regression/kit';
import { type Card, type Cand, type Opt, type PCand, calc } from '../linear-regression/kit';
import { noise } from '../linear-regression/regMaths';
import { type Model, evalM, nH, r9, rd } from './nlMaths';

export { ans, calc, int, pick, shuffle };
export type { Card, Cand, Opt, PCand };

// ---------- pictures ----------
/** a fitted curve on a plane: drawn from its family and parameters (the page turns it into a Plane curve) */
export interface MItem { kind: 'model'; key: string; fam: Model['fam']; p: number[]; lo?: number; hi?: number; col?: GItem['col']; dash?: boolean; name?: string }
/** a horizontal line y = c (a target, the residual 0 line) */
export interface HItem { kind: 'hline'; key: string; y: number; col?: GItem['col']; dash?: boolean }
export type NItem = GItem | MItem | HItem;
/** a plane: `items` come with the question, `solveItems` only on the worked solution after a miss (hidden from oracles) */
export interface NG { x: GAxis; y: GAxis; items: NItem[]; solveItems?: NItem[]; /** a residual plot (x tick labels under the grid) */ resid?: boolean; title?: string }
/** a difference table: rows with the question, the change columns on the solve (hidden from oracles) */
export interface DiffPic { xName: string; yName: string; xs: string[]; ys: string[]; /** change columns shown with the question */ show?: { dx?: string[]; d1?: string[]; d2?: string[]; rt?: string[] }; solveDiffs: { dx?: string[]; d1?: string[]; d2?: string[]; rt?: string[] } }
export interface NPic { [k: string]: unknown; g?: NG; g2?: NG; card?: Card; card2?: Card; diff?: DiffPic }
export interface NItemQ extends Item { picture?: NPic }
export type NGen = (R: () => number, n: number, sg?: string) => NItemQ;
/** linear-regression's item makers (one choice helper drops wrong choices equivalent to the right one), typed for this topic's pictures */
export interface Base { id: string; family: string; prompt: string; board: string; solution: string[]; picture?: NPic; unit?: string }
export const choice = (R: () => number, b: Base, opts: Opt[], keepOrder = false): NItemQ => LR.choice(R, b as unknown as LR.Base, opts, keepOrder) as unknown as NItemQ;
export const numItem = (b: Base, v: number, okSay: string, cands: Cand[], hint: string, o: { tol?: number; also?: number[] } = {}): NItemQ => LR.numItem(b as unknown as LR.Base, v, okSay, cands, hint, o) as unknown as NItemQ;
export const pairItem = (b: Base, x: number, y: number, form: { lead: string; op: string; tail?: string }, okSay: string, cands: PCand[], hint: string, tol = 1e-6): NItemQ =>
  LR.pairItem(b as unknown as LR.Base, x, y, form, okSay, cands, hint, tol) as unknown as NItemQ;

export const MC = {
  roughShape: 'mc.functions-concept.family-from-rough-shape',
  uniqueShape: 'mc.statistics.shape-identifies-unique-family',
  spacing: 'mc.functions-concept.family-tests-ignore-input-spacing',
  incDiffs: 'mc.functions-concept.increasing-first-differences-mean-exponential',
  noisyProves: 'mc.statistics.noisy-table-pattern-proves-model-family',
  residSign: 'mc.statistics.residual-sign-errors',
  onCurve: 'mc.statistics.expects-points-on-fitted-line',
  oneSmall: 'mc.statistics.one-small-residual-proves-model-quality',
  signedTotal: 'mc.statistics.signed-residual-total-as-fit-objective',
  highR: 'mc.statistics.high-r-settles-everything',
  scales: 'mc.data-displays.compares-across-different-scales',
  patternless: 'mc.statistics.patternless-residuals-always-useful',
  precision: 'mc.decimals.intermediate-precision-always-invalid',
  threePts: 'mc.statistics.curve-through-chosen-points',
  swapLists: 'mc.statistics.swaps-x-y-lists',
  logNonpos: 'mc.exponential-log.accepts-log-of-nonpositive',
  logResid: 'mc.exponential-log.log-residuals-interchangeable',
  zeroRules: 'mc.exponential-log.zero-response-rules-out-exponential',
  addsBase: 'mc.exponential-log.adds-exponential-base',
  deletes: 'mc.statistics.deletes-nonpositive-for-command',
  sameFit: 'mc.statistics.all-tools-same-fit',
  intercept: 'mc.statistics.intercept-always-meaningful',
  calendar: 'mc.functions-concept.calendar-vs-elapsed-time',
  factorPct: 'mc.exponential-log.reports-factor-number-as-percent-rate',
  mustChoose: 'mc.statistics.must-choose-a-model',
  software: 'mc.statistics.software-output-validates-model',
  oneSol: 'mc.linear-equations.exactly-one-solution',
  noSolError: 'mc.linear-equations.no-solution-means-error',
  allReals: 'mc.functions-concept.context-domain-all-reals',
  noSolBare: 'mc.reasoning-language.no-solution-not-interpreted',
  truth: 'mc.reasoning-language.model-as-truth',
  negRadicand: 'mc.rational-radical.allows-negative-even-radicand',
  levelsOff: 'mc.exponential-log.log-graph-levels-off',
  forcesTheory: 'mc.statistics.forces-theoretical-parameter',
  rejectsNear: 'mc.statistics.rejects-near-theoretical-parameter',
  noLimit: 'mc.statistics.extrapolates-without-limit',
  interpSafe: 'mc.statistics.interpolation-always-trustworthy',
  equalFits: 'mc.statistics.equal-fits-predict-alike',
  notExp: 'mc.exponential-log.log-fit-coefficients-not-exponentiated',
  causation: 'mc.statistics.correlation-implies-causation',
  pearson: 'mc.statistics.pearson-r-as-curved-model-fit-score',
  bounds: 'mc.statistics.observed-extremes-as-guaranteed-bounds',
} as const;

// ---------- contexts (US units, realistic ranges) ----------
export interface NCtx {
  id: string; fam: 'quad' | 'exp' | 'lin' | 'sqrt';
  /** what one data point is ("a throw", "a dose") and where the data came from */ source: string;
  xWhat: string; yWhat: string; xAxis: string; yAxis: string; hx: string; hy: string;
  /** the response unit as words ("feet", "mg/L") and how a residual / value is written */ yUnit: string; money?: boolean;
  xUnit: string; xOne: string;
  /** the x values of one data set */ xs: (R: () => number) => number[];
  /** the true model the data scatter around */ truth: (R: () => number) => Model;
  /** noise: absolute sd, or relative (fraction of y) */ sd: number; rel?: boolean;
  /** y values are rounded to this grid; display decimals */ yStep: number; yd: number;
  /** the smallest sensible y (a concentration cannot go below 0) */ yMin?: number;
}
const xsStep = (lo: number, hi: number, step: number) => (_R: () => number) => { const o: number[] = []; for (let x = lo; x <= hi + 1e-9; x = r9(x + step)) o.push(x); return o; };
const xsSome = (cands: number[], n: number) => (R: () => number) => shuffle(R, cands.slice()).slice(0, n).sort((a, b) => a - b);
const U = (R: () => number, lo: number, hi: number, d = 2) => rd(lo + R() * (hi - lo), d);
export const CTX: NCtx[] = [
  // ----- quadratic -----
  { id: 'ball', fam: 'quad', source: 'one throw, measured from a slow-motion video', xWhat: 'time since the throw', yWhat: 'height of the ball', xAxis: 'Time (seconds)', yAxis: 'Height (feet)', hx: 'Time (s)', hy: 'Height (ft)',
    yUnit: 'feet', xUnit: 'seconds', xOne: 'second', xs: xsStep(0, 2.25, 0.25), truth: R => ({ fam: 'quad', p: [-16, int(R, 34, 44), U(R, 3, 6, 1)] }), sd: 0.45, yStep: 0.1, yd: 1, yMin: 0 },
  { id: 'rocket', fam: 'quad', source: 'one launch of a water rocket, from a video', xWhat: 'time since launch', yWhat: 'height of the rocket', xAxis: 'Time (seconds)', yAxis: 'Height (meters)', hx: 'Time (s)', hy: 'Height (m)',
    yUnit: 'meters', xUnit: 'seconds', xOne: 'second', xs: xsStep(0, 3.6, 0.4), truth: R => ({ fam: 'quad', p: [-4.9, int(R, 18, 24), U(R, 0.5, 1.5, 1)] }), sd: 0.4, yStep: 0.1, yd: 1, yMin: 0 },
  { id: 'truck', fam: 'quad', source: 'one food truck over 9 weeks, a different meal price each week', xWhat: 'meal price', yWhat: 'weekly revenue', xAxis: 'Meal price ($)', yAxis: 'Weekly revenue ($)', hx: 'Price ($)', hy: 'Revenue ($)',
    yUnit: 'dollars', money: true, xUnit: 'dollars', xOne: 'dollar', xs: xsStep(6, 14, 1), truth: R => { const N = int(R, 50, 64) * 10, k = int(R, 20, 26); return { fam: 'quad', p: [-k, N, 0] }; }, sd: 45, yStep: 10, yd: 0 },
  { id: 'mpg', fam: 'quad', source: 'one hybrid car on a test track', xWhat: 'speed', yWhat: 'gas mileage', xAxis: 'Speed (mph)', yAxis: 'Gas mileage (mpg)', hx: 'Speed (mph)', hy: 'Mileage (mpg)',
    yUnit: 'mpg', xUnit: 'mph', xOne: 'mph', xs: xsStep(25, 75, 5), truth: R => { const h = int(R, 45, 55), k = int(R, 44, 52), a = -U(R, 0.008, 0.012, 4); return { fam: 'quad', p: [a, -2 * a * h, a * h * h + k] }; }, sd: 0.6, yStep: 0.1, yd: 1 },
  { id: 'power', fam: 'quad', source: 'one house, one day per week for a year', xWhat: 'average outdoor temperature', yWhat: 'electricity use', xAxis: 'Outdoor temperature (°F)', yAxis: 'Electricity use (kWh per day)', hx: 'Temp (°F)', hy: 'Use (kWh)',
    yUnit: 'kWh', xUnit: '°F', xOne: '°F', xs: xsSome([20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95], 11), truth: R => { const h = int(R, 62, 68), k = int(R, 14, 20), a = U(R, 0.010, 0.014, 4); return { fam: 'quad', p: [a, -2 * a * h, a * h * h + k] }; }, sd: 1.2, yStep: 0.5, yd: 1 },
  { id: 'stop', fam: 'quad', source: 'one car on dry pavement', xWhat: 'speed', yWhat: 'stopping distance', xAxis: 'Speed (mph)', yAxis: 'Stopping distance (feet)', hx: 'Speed (mph)', hy: 'Distance (ft)',
    yUnit: 'feet', xUnit: 'mph', xOne: 'mph', xs: xsStep(20, 70, 5), truth: R => ({ fam: 'quad', p: [U(R, 0.045, 0.055, 3), U(R, 1.0, 1.4, 2), 0] }), sd: 4, yStep: 1, yd: 0 },
  // ----- exponential -----
  { id: 'drug', fam: 'exp', source: 'blood samples of one adult patient after one dose', xWhat: 'time since the dose', yWhat: 'drug concentration', xAxis: 'Time since dose (hours)', yAxis: 'Concentration (mg/L)', hx: 'Hours', hy: 'mg/L',
    yUnit: 'mg/L', xUnit: 'hours', xOne: 'hour', xs: xsStep(0, 8, 1), truth: R => ({ fam: 'exp', p: [int(R, 18, 30), U(R, 0.7, 0.85, 2)] }), sd: 0.025, rel: true, yStep: 0.1, yd: 1, yMin: 0.1 },
  { id: 'car', fam: 'exp', source: 'listings of one sedan model of different ages', xWhat: 'age', yWhat: 'value', xAxis: 'Age (years)', yAxis: 'Value ($)', hx: 'Age (yr)', hy: 'Value ($)',
    yUnit: 'dollars', money: true, xUnit: 'years', xOne: 'year', xs: xsStep(0, 10, 1), truth: R => ({ fam: 'exp', p: [int(R, 24, 38) * 1000, U(R, 0.82, 0.88, 2)] }), sd: 0.03, rel: true, yStep: 100, yd: 0 },
  { id: 'cells', fam: 'exp', source: 'one lab culture of bacteria', xWhat: 'time', yWhat: 'number of cells', xAxis: 'Time (hours)', yAxis: 'Cells (thousands)', hx: 'Hours', hy: 'Cells (1,000s)',
    yUnit: 'thousand cells', xUnit: 'hours', xOne: 'hour', xs: xsStep(0, 6, 1), truth: R => ({ fam: 'exp', p: [U(R, 1.5, 4, 1), U(R, 1.4, 1.8, 2)] }), sd: 0.04, rel: true, yStep: 0.1, yd: 1 },
  { id: 'views', fam: 'exp', source: 'one new video in its first 10 days', xWhat: 'days since posting', yWhat: 'total views', xAxis: 'Days since posting', yAxis: 'Views (thousands)', hx: 'Day', hy: 'Views (1,000s)',
    yUnit: 'thousand views', xUnit: 'days', xOne: 'day', xs: xsStep(1, 10, 1), truth: R => ({ fam: 'exp', p: [U(R, 1.2, 2.5, 1), U(R, 1.25, 1.4, 2)] }), sd: 0.035, rel: true, yStep: 0.1, yd: 1 },
  { id: 'decay', fam: 'exp', source: 'one radioactive sample in a school lab', xWhat: 'time', yWhat: 'count rate', xAxis: 'Time (days)', yAxis: 'Counts per minute', hx: 'Day', hy: 'Counts/min',
    yUnit: 'counts per minute', xUnit: 'days', xOne: 'day', xs: xsStep(0, 10, 1), truth: R => ({ fam: 'exp', p: [int(R, 60, 90) * 10, U(R, 0.8, 0.9, 2)] }), sd: 0.03, rel: true, yStep: 1, yd: 0, yMin: 1 },
  // ----- linear (for contrast) -----
  { id: 'battery', fam: 'lin', source: 'one phone streaming video', xWhat: 'minutes of streaming', yWhat: 'battery charge', xAxis: 'Time (minutes)', yAxis: 'Battery (%)', hx: 'Minutes', hy: 'Battery (%)',
    yUnit: 'percentage points', xUnit: 'minutes', xOne: 'minute', xs: xsStep(0, 300, 30), truth: R => ({ fam: 'lin', p: [int(R, 94, 100), -U(R, 0.16, 0.2, 3)] }), sd: 1.2, yStep: 1, yd: 0, yMin: 0 },
  { id: 'candle', fam: 'lin', source: 'one candle burning', xWhat: 'hours burned', yWhat: 'height of the candle', xAxis: 'Time burned (hours)', yAxis: 'Height (inches)', hx: 'Hours', hy: 'Height (in)',
    yUnit: 'inches', xUnit: 'hours', xOne: 'hour', xs: xsStep(0, 9, 1), truth: R => ({ fam: 'lin', p: [U(R, 8, 10, 1), -U(R, 0.6, 0.8, 2)] }), sd: 0.12, yStep: 0.1, yd: 1, yMin: 0 },
  // ----- square root (Texas) -----
  { id: 'pend', fam: 'sqrt', source: 'one pendulum with strings of different lengths', xWhat: 'string length', yWhat: 'period (time of one full swing)', xAxis: 'Length (feet)', yAxis: 'Period (seconds)', hx: 'Length (ft)', hy: 'Period (s)',
    yUnit: 'seconds', xUnit: 'feet', xOne: 'foot', xs: xsSome([0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 7, 8], 8), truth: () => ({ fam: 'sqrt', p: [1.107, 0] }), sd: 0.03, yStep: 0.01, yd: 2 },
  { id: 'skid', fam: 'sqrt', source: 'test stops of one car on dry asphalt', xWhat: 'skid-mark length', yWhat: 'speed', xAxis: 'Skid length (feet)', yAxis: 'Speed (mph)', hx: 'Skid (ft)', hy: 'Speed (mph)',
    yUnit: 'mph', xUnit: 'feet', xOne: 'foot', xs: xsSome([20, 30, 40, 50, 60, 80, 100, 120, 140, 160, 180, 200], 8), truth: R => ({ fam: 'sqrt', p: [U(R, 4.4, 4.8, 2), 0] }), sd: 0.8, yStep: 1, yd: 0 },
];
export const ctxById = (id: string): NCtx => CTX.find(c => c.id === id)!;
export const ctxOf = (R: () => number, ids: readonly string[]): NCtx => ctxById(pick(R, ids));
export const QUAD = ['ball', 'rocket', 'truck', 'mpg', 'power'];
export const EXP = ['drug', 'car', 'cells', 'views', 'decay'];
export const LIN = ['battery', 'candle'];

/** a response value with its unit: "$1,050", "12.4 feet", "3.1 mg/L" */
export function yv(c: NCtx, v: number, d = c.yd): string {
  if (c.money) { const r = rd(v, d), a = Math.abs(r); return (r < 0 ? '−$' : '$') + a.toLocaleString('en-US', { minimumFractionDigits: d > 0 ? 2 : 0, maximumFractionDigits: d }); }
  if (c.yUnit === 'percentage points') return `${nH(v, d)}%`;
  const one: Record<string, string> = { feet: 'foot', meters: 'meter', inches: 'inch', seconds: 'second', 'counts per minute': 'count per minute' };
  return `${nH(v, d)} ${rd(v, d) === 1 ? one[c.yUnit] ?? c.yUnit : c.yUnit}`;
}
export function xv(c: NCtx, v: number, d = 4): string {
  if (c.xUnit === '°F') return `${nH(v, d)}°F`;
  if (c.xUnit === 'dollars') return `$${nH(v, d)}`;
  return `${nH(v, d)} ${Math.abs(v) === 1 ? c.xOne : c.xUnit}`;
}
/** a residual's unit word for an axis */
export const resUnit = (c: NCtx) => (c.money ? '$' : c.yUnit === 'percentage points' ? '%' : c.yUnit);

// ---------- data ----------
export interface NData { c: NCtx; xs: number[]; ys: number[]; truth: Model }
/** one noisy data set of a context; y on the context's grid, at least yMin */
export function dataOf(R: () => number, c: NCtx, o: { xs?: number[]; truth?: Model; sd?: number } = {}): NData {
  const xs = o.xs ?? c.xs(R), truth = o.truth ?? c.truth(R), sdk = o.sd ?? 1;
  const ys = xs.map(x => {
    const t = evalM(truth, x), s = (c.rel ? Math.abs(t) * c.sd : c.sd) * sdk;
    let y = r9(Math.round((t + s * noise(R)) / c.yStep) * c.yStep);
    if (c.yMin !== undefined) y = Math.max(c.yMin, y);
    return rd(y, c.yd);
  });
  return { c, xs, ys, truth };
}
/** the data table card (x | y, optionally more columns) */
export function tableCard(d: { c: NCtx; xs: readonly number[]; ys: readonly number[] }, o: { title?: string; extra?: { head: string; cells: string[] }[]; ring?: number[]; swap?: boolean } = {}): Card {
  const X = { head: d.c.hx, cells: d.xs.map(v => nH(v)) }, Y = { head: d.c.hy, cells: d.ys.map(v => (d.c.money ? Math.abs(v).toLocaleString('en-US') : nH(v, d.c.yd + 2))) };
  return { title: o.title, cols: [...(o.swap ? [Y, X] : [X, Y]), ...(o.extra ?? [])], ring: o.ring };
}

// ---------- planes ----------
const STEPS = [0.01, 0.02, 0.025, 0.05, 0.1, 0.2, 0.25, 0.5, 1, 2, 2.5, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000, 10000, 20000, 25000, 50000, 100000];
/** a window around the values with 4 to 10 grid cells (multiples of a nice step), 0 included when asked, symmetric when asked */
export function axisFor(vals: readonly number[], name: string, o: { zero?: boolean; sym?: boolean; max?: number } = {}): GAxis {
  let lo = Math.min(...vals), hi = Math.max(...vals);
  if (o.sym) { const m = Math.max(Math.abs(lo), Math.abs(hi)) || 1; lo = -m; hi = m; }
  if (o.zero) { lo = Math.min(lo, 0); hi = Math.max(hi, 0); }
  for (const s of STEPS) {
    let min = Math.floor(lo / s - 1e-9) * s, max = Math.ceil(hi / s + 1e-9) * s;
    if (min > lo - s * 0.3 && !(o.zero && min === 0 && lo >= 0)) min -= s;
    if (max < hi + s * 0.3) max += s;
    if (lo >= 0 && min < 0) min = 0;
    if (o.sym) { const m = Math.max(-min, max); min = -m; max = m; }
    if (o.max !== undefined && max > o.max && hi <= o.max) max = o.max;
    const n = Math.round((max - min) / s);
    if (n <= 10 && n >= 4) return { min: r9(min), max: r9(max), step: s, name };
    if (n < 4) return { min: r9(min), max: r9(min + 4 * s), step: s, name };
  }
  return { min: lo, max: hi, step: (hi - lo) / 10, name };
}
export const dots = (xs: readonly number[], ys: readonly number[], o: { hot?: number[]; col?: GItem['col']; key?: string } = {}): NItem[] =>
  xs.map((x, i) => (o.hot?.includes(i) ? { kind: 'point', key: `hot#${i}`, x, y: ys[i]!, col: 'pick' } : { kind: 'point', key: `${o.key ?? 'pts'}#${i}`, x, y: ys[i]!, col: o.col ?? 'first' }) as NItem);
export const curve = (key: string, m: Model, o: { lo?: number; hi?: number; col?: GItem['col']; dash?: boolean; name?: string } = {}): MItem =>
  ({ kind: 'model', key, fam: m.fam, p: m.p.slice(), lo: o.lo, hi: o.hi, col: o.col ?? 'link', dash: o.dash, name: o.name });
/** a scatter plot: dots, optional curves; the window holds the dots and the curves over the window */
export function scatter(d: { c: NCtx; xs: readonly number[]; ys: readonly number[] }, o: { curves?: { m: Model; key?: string; col?: GItem['col']; name?: string; solve?: boolean; dash?: boolean }[]; hot?: number[]; extraX?: number[]; extraY?: number[]; zeroY?: boolean; zeroX?: boolean; title?: string; yAxis?: string } = {}): NG {
  const x = axisFor([...d.xs, ...(o.extraX ?? [])], d.c.xAxis, { zero: o.zeroX });
  // fitted curves are drawn over the observed inputs only (beyond them a model is an extrapolation)
  const lo = Math.min(...d.xs), hi = Math.max(...d.xs);
  const cy: number[] = [];
  for (const cv of o.curves ?? []) for (let i = 0; i <= 40; i++) { const v = evalM(cv.m, lo + ((hi - lo) * i) / 40); if (Number.isFinite(v)) cy.push(v); }
  const y = axisFor([...d.ys, ...cy, ...(o.extraY ?? [])], o.yAxis ?? d.c.yAxis, { zero: o.zeroY });
  const items: NItem[] = [], solveItems: NItem[] = [];
  (o.curves ?? []).forEach((cv, i) => (cv.solve ? solveItems : items).push(curve(cv.key ?? `fit${i}`, cv.m, { lo, hi, col: cv.col, name: cv.name, dash: cv.dash })));
  items.push(...dots(d.xs, d.ys, { hot: o.hot }));
  return { x, y, items, solveItems: solveItems.length ? solveItems : undefined, title: o.title };
}
/** a residual plot (x, e) with the 0 line; `ymax` fixes a symmetric vertical window (to compare two plots fairly or not) */
export function residPlot(c: NCtx, xs: readonly number[], es: readonly number[], o: { title?: string; ymax?: number; hot?: number[]; xAxis?: GAxis } = {}): NG {
  const x = o.xAxis ?? axisFor(xs, c.xAxis);
  const y = o.ymax ? axisFor([-o.ymax, o.ymax], `Residual (${resUnit(c)})`, { sym: true }) : axisFor(es.map(e => rd(e, 3)), `Residual (${resUnit(c)})`, { sym: true });
  const zero: NItem = { kind: 'hline', key: 'zero', y: 0, col: 'dim', dash: false };
  const pts = xs.map((xx, i) => ({ kind: 'point', key: o.hot?.includes(i) ? `rhot#${i}` : `rpt#${i}`, x: xx, y: rd(es[i]!, 3), col: o.hot?.includes(i) ? 'pick' : 'second' }) as NItem);
  return { x: { ...x, name: c.xAxis }, y, items: [zero, ...pts], resid: true, title: o.title };
}

// ---------- shared words ----------
export const I = (s: string) => `<i>${s}</i>`;
export const cap = (s: string) => s[0]!.toUpperCase() + s.slice(1);
export const a1 = (w: string): string => (/^[aeiou]/i.test(w) ? 'an ' : 'a ') + w;
/** pick a random element that passes the test (or throw: the tests run many seeds) */
export function pickWhere<T>(R: () => number, xs: readonly T[], ok: (t: T) => boolean): T { const c = xs.filter(ok); if (!c.length) throw new Error('pickWhere: none'); return c[Math.floor(R() * c.length)]!; }
export function until<T>(make: () => T, ok: (t: T) => boolean, tries = 3000): T {
  for (let i = 0; i < tries; i++) { const t = make(); if (ok(t)) return t; }
  throw new Error('until: nothing found');
}
