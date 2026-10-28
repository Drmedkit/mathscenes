// kit.ts: what every practice family of "Scatter plots, correlation and the regression line" shares: the item type and
// its picture (plain data the page draws: a scatter plot and / or a residual plot on the shared kit's Plane, a data or
// technology-output card), misconception ids, the realistic contexts, data makers, and the choice / number / pair item
// makers (one choice helper drops a wrong choice that means the same as the right one). Pure: no DOM.
import { type Item, type Response, type Verdict, int, pick, shuffle } from '../../runtime/item';
import { ans, endOnChoice } from '../../runtime/explain';
import type { GAxis, GItem } from '../linear-functions-slope/graphPic';
import { type Fit, lsrl, nH, noise, onGrid, r9, rd, spreadXs, tieFree, until } from './regMaths';

export { ans, int, pick, shuffle };

// ---------- pictures ----------
/** a plane: `items` are drawn with the question, `solveItems` only on the worked solution after a miss (hidden from oracles) */
export interface RG { x: GAxis; y: GAxis; items: GItem[]; solveItems?: GItem[]; /** a residual plot: x tick labels under the grid, not on the 0 line */ resid?: boolean; /** a title above the plane ("Plot A") */ title?: string }
/** a card of columns (a data table, TI lists) or of lines (a technology output screen) */
export interface Card { title?: string; cols?: { head: string; cells: string[] }[]; lines?: string[]; /** rows ringed with the question */ ring?: number[]; /** [col, row, text]: what a '?' cell shows on the solve (hidden from oracles) */ solveCells?: [number, number, string][] }
export interface RPic { [k: string]: unknown; g?: RG; g2?: RG; card?: Card }
export interface RItem extends Item { picture?: RPic }
export type RGen = (R: () => number, n: number, sg?: string) => RItem;

export const MC = {
  colOrder: 'mc.data-displays.x-variable-by-column-order',
  explCause: 'mc.statistics.explanatory-means-cause',
  onLine: 'mc.statistics.expects-points-on-fitted-line',
  examples: 'mc.reasoning-language.examples-as-proof',
  notFunction: 'mc.statistics.regression-line-not-function',
  windowEdge: 'mc.data-displays.window-edge-as-axis',
  firstLast: 'mc.statistics.line-through-first-and-last',
  origin: 'mc.statistics.line-through-origin',
  equalCounts: 'mc.statistics.line-by-equal-counts',
  mostPoints: 'mc.statistics.line-through-most-points',
  precision: 'mc.decimals.intermediate-precision-always-invalid',
  swapMB: 'mc.linear-functions.swaps-m-and-b',
  yForX: 'mc.statistics.substitutes-y-for-x',
  residSign: 'mc.statistics.residual-sign-errors',
  dropsSign: 'mc.integers.drops-sign-of-computed-result',
  perpendicular: 'mc.statistics.residual-as-perpendicular-distance',
  bare: 'mc.reasoning-language.bare-number-without-meaning',
  rawY: 'mc.statistics.judges-by-raw-y-not-residual',
  zeroDisconnected: 'mc.statistics.residual-zero-disconnected-from-fit',
  levels: 'mc.statistics.residual-plot-uses-response-levels',
  signedTotal: 'mc.statistics.signed-residual-total-as-fit-objective',
  steepness: 'mc.statistics.strength-by-steepness',
  smallIgnore: 'mc.statistics.small-residuals-ignore-pattern',
  anyCurve: 'mc.statistics.any-residual-pattern-is-curvature',
  sortsLists: 'mc.data-displays.sorts-paired-lists-independently',
  indepCols: 'mc.data-displays.table-columns-as-independent-lists',
  swapAB: 'mc.statistics.swaps-a-and-b',
  swapLists: 'mc.statistics.swaps-x-y-lists',
  softwareOk: 'mc.statistics.software-output-validates-model',
  slopeExact: 'mc.statistics.slope-exact-for-every-individual',
  causation: 'mc.statistics.correlation-implies-causation',
  intercept: 'mc.statistics.intercept-always-meaningful',
  rUnits: 'mc.statistics.r-has-units',
  summaries: 'mc.statistics.regression-summaries-interchangeable-with-r',
  negWeak: 'mc.statistics.negative-r-as-weak',
  signedOrder: 'mc.statistics.correlation-strength-by-signed-order',
  rPercent: 'mc.statistics.r-as-percent-correct',
  highR: 'mc.statistics.high-r-settles-everything',
  rAny: 'mc.statistics.r-measures-any-relationship',
  domainRange: 'mc.functions-concept.domain-range-swap',
  noLimit: 'mc.statistics.extrapolates-without-limit',
  interpSafe: 'mc.statistics.interpolation-always-trustworthy',
  generalizes: 'mc.statistics.generalizes-beyond-sampled-group',
  bigSample: 'mc.statistics.large-sample-cures-bias',
  noCause: 'mc.statistics.no-cause-no-association',
  randomAny: 'mc.statistics.randomized-experiment-licenses-any-causal-claim',
  studyType: 'mc.statistics.misclassifies-study-type',
  influence: 'mc.statistics.influential-points-misjudged',
  equalInfluence: 'mc.statistics.unusual-points-have-equal-influence',
  alwaysDelete: 'mc.statistics.always-delete-outliers',
  rejectsAll: 'mc.statistics.rejects-data-claims-without-evaluation',
  settles: 'mc.statistics.high-correlation-settles-fit-scope-and-cause',
  r2Share: 'mc.statistics.r-squared-as-share-of-points-or-correct-predictions',
  r2Sign: 'mc.statistics.r-from-r-squared-sign-ignored',
  r2Across: 'mc.statistics.r-squared-compared-across-responses',
} as const;

/** the rules the items state wherever they matter */
export const RULE = {
  round: 'half away from zero',
  /** the lesson's informal strength words are never asked as a label; strength is always a comparison of |r| with a gap of at least 0.15 */
  strengthGap: 0.15,
};

// ---------- contexts: realistic linear relationships, US units ----------
export interface RCtx {
  id: string;
  who: string; one: string;
  xWhat: string; yWhat: string;
  xUnit: string; xOne: string; yUnit: string; yOne: string;
  money?: boolean;
  xAxis: string; yAxis: string;
  lo: number; hi: number; xStep: number; yStep: number; yMin?: number; yMax?: number;
  a: number; b: number; sd: number;
  /** decimals of the rounded model's intercept and slope */ da: number; db: number;
  /** "each additional ___" */ per: string;
  /** x = 0 is a value the data include (study hours, elevation) */ zeroIn?: boolean;
  /** what x = 0 would be */ zeroWord: string;
  /** who / what the data came from */ source: string;
  /** "their" for people, "its" for things */ poss: string;
  /** the x values in the plural ("floor areas"), the largest x that is still physically sensible */ xMany: string; xCap: number;
  /** "an apartment of 800 square feet" for an x value */ caseWith: (x: string) => string;
  /** the range of values the response can really take (every generated y must lie inside) */ yOk: [number, number];
}
export const CTX: RCtx[] = [
  { id: 'rent', who: 'apartments', one: 'apartment', xWhat: 'floor area', yWhat: 'monthly rent', xUnit: 'square feet', xOne: 'square foot', yUnit: 'dollars', yOne: 'dollar', money: true,
    xAxis: 'Floor area (sq ft)', yAxis: 'Monthly rent ($)', lo: 450, hi: 1250, xStep: 10, yStep: 5, a: 380, b: 1.15, sd: 120, da: 0, db: 2, per: 'square foot of floor area',
    zeroWord: 'an apartment with 0 square feet', source: 'apartments listed in one Denver neighborhood this spring', yOk: [300, 4000], poss: 'its', xMany: 'floor areas', xCap: 3000, caseWith: x => `an apartment of ${x} square feet` },
  { id: 'study', who: 'students', one: 'student', xWhat: 'hours studied', yWhat: 'test score', xUnit: 'hours', xOne: 'hour', yUnit: 'points', yOne: 'point', yMax: 100,
    xAxis: 'Hours studied', yAxis: 'Test score (points)', lo: 0, hi: 9, xStep: 0.5, yStep: 1, a: 56, b: 3.7, sd: 4.5, da: 1, db: 2, per: 'hour of study',
    zeroIn: true, zeroWord: 'a student who studied 0 hours', source: 'students in one 10th-grade chemistry class', yOk: [20, 100], poss: 'their', xMany: 'study times', xCap: 20, caseWith: x => `a student who studied ${x} hours` },
  { id: 'arm', who: 'adults', one: 'adult', xWhat: 'arm span', yWhat: 'height', xUnit: 'inches', xOne: 'inch', yUnit: 'inches', yOne: 'inch',
    xAxis: 'Arm span (inches)', yAxis: 'Height (inches)', lo: 60, hi: 76, xStep: 0.5, yStep: 0.5, a: 5, b: 0.93, sd: 2, da: 1, db: 2, per: 'inch of arm span',
    zeroWord: 'a person with an arm span of 0 inches', source: 'adults who volunteered at a county health fair', yOk: [56, 82], poss: 'their', xMany: 'arm spans', xCap: 90, caseWith: x => `an adult with an arm span of ${x} inches` },
  { id: 'drinks', who: 'days', one: 'day', xWhat: 'high temperature', yWhat: 'number of hot drinks sold', xUnit: '°F', xOne: '°F', yUnit: 'drinks', yOne: 'drink',
    xAxis: 'High temperature (°F)', yAxis: 'Hot drinks sold', lo: 38, hi: 86, xStep: 1, yStep: 1, a: 262, b: -2.1, sd: 14, da: 0, db: 2, per: 'degree Fahrenheit of high temperature',
    zeroWord: 'a day with a high of 0°F', source: 'days at one campus café over one school year', yOk: [5, 400], poss: 'its', xMany: 'high temperatures', xCap: 105, caseWith: x => `a day with a high of ${x}°F`, yMin: 15 },
  { id: 'mpg', who: 'cars', one: 'car', xWhat: 'weight', yWhat: 'highway gas mileage', xUnit: 'thousand pounds', xOne: 'thousand pounds', yUnit: 'mpg', yOne: 'mpg',
    xAxis: 'Weight (thousand lb)', yAxis: 'Highway mileage (mpg)', lo: 2.4, hi: 5.0, xStep: 0.1, yStep: 1, a: 47, b: -4.9, sd: 1.8, da: 1, db: 2, per: '1,000 pounds of weight',
    zeroWord: 'a car that weighs 0 pounds', source: '2024 gasoline car models tested by one magazine', yOk: [10, 60], poss: 'its', xMany: 'weights', xCap: 8, caseWith: x => `a car weighing ${x} thousand pounds`, yMin: 8 },
  { id: 'growth', who: 'children', one: 'child', xWhat: 'age', yWhat: 'height', xUnit: 'years', xOne: 'year', yUnit: 'inches', yOne: 'inch',
    xAxis: 'Age (years)', yAxis: 'Height (inches)', lo: 2, hi: 10, xStep: 0.5, yStep: 0.5, a: 31.5, b: 2.45, sd: 2.2, da: 1, db: 2, per: 'year of age',
    zeroWord: 'a newborn (age 0)', source: 'children at one pediatric clinic', yOk: [30, 60], poss: 'their', xMany: 'ages', xCap: 18, caseWith: x => `a child aged ${x}` },
  { id: 'elev', who: 'towns', one: 'town', xWhat: 'elevation', yWhat: 'average July high', xUnit: 'thousand feet', xOne: 'thousand feet', yUnit: '°F', yOne: '°F',
    xAxis: 'Elevation (thousand ft)', yAxis: 'July high (°F)', lo: 0, hi: 9, xStep: 0.1, yStep: 1, a: 89, b: -3.4, sd: 4, da: 1, db: 2, per: '1,000 feet of elevation',
    zeroIn: true, zeroWord: 'a town at sea level (0 feet)', source: 'towns in Colorado', yOk: [45, 105], poss: 'its', xMany: 'elevations', xCap: 14, caseWith: x => `a town at ${x} thousand feet` },
  { id: 'screen', who: 'teens', one: 'teen', xWhat: 'daily screen time', yWhat: 'sleep per night', xUnit: 'hours', xOne: 'hour', yUnit: 'hours', yOne: 'hour',
    xAxis: 'Screen time (hours per day)', yAxis: 'Sleep (hours)', lo: 1, hi: 8, xStep: 0.5, yStep: 0.1, a: 9.3, b: -0.3, sd: 0.3, da: 1, db: 2, per: 'hour of daily screen time',
    zeroWord: 'a teen with no screen time at all', source: 'teens at one high school who answered an online survey', yOk: [4.5, 11], poss: 'their', xMany: 'screen times', xCap: 14, caseWith: x => `a teen with ${x} hours of daily screen time`, yMin: 5 },
  { id: 'foot', who: 'adults', one: 'adult', xWhat: 'foot length', yWhat: 'height', xUnit: 'inches', xOne: 'inch', yUnit: 'inches', yOne: 'inch',
    xAxis: 'Foot length (inches)', yAxis: 'Height (inches)', lo: 8.5, hi: 12, xStep: 0.1, yStep: 0.5, a: 25, b: 3.9, sd: 2, da: 1, db: 2, per: 'inch of foot length',
    zeroWord: 'a person with a foot length of 0 inches', source: 'adults measured at one shoe store', yOk: [56, 82], poss: 'their', xMany: 'foot lengths', xCap: 14, caseWith: x => `an adult with a ${x}-inch foot` },
  { id: 'bike', who: 'bike commuters', one: 'commuter', xWhat: 'commute distance', yWhat: 'commute time', xUnit: 'miles', xOne: 'mile', yUnit: 'minutes', yOne: 'minute',
    xAxis: 'Distance (miles)', yAxis: 'Commute time (minutes)', lo: 1, hi: 12, xStep: 0.5, yStep: 1, a: 5, b: 4.3, sd: 6, da: 1, db: 2, per: 'mile of distance',
    zeroWord: 'a commute of 0 miles', source: 'bike commuters in Minneapolis in September', yOk: [4, 120], poss: 'their', xMany: 'distances', xCap: 40, caseWith: x => `a commute of ${x} miles`, yMin: 4 },
  { id: 'tree', who: 'oak trees', one: 'tree', xWhat: 'trunk diameter', yWhat: 'height', xUnit: 'inches', xOne: 'inch', yUnit: 'feet', yOne: 'foot',
    xAxis: 'Trunk diameter (inches)', yAxis: 'Height (feet)', lo: 4, hi: 22, xStep: 1, yStep: 1, a: 22, b: 2.5, sd: 6, da: 1, db: 2, per: 'inch of trunk diameter',
    zeroWord: 'a tree with a trunk 0 inches across', source: 'oak trees in one Ohio state park', yOk: [10, 110], poss: 'its', xMany: 'trunk diameters', xCap: 60, caseWith: x => `a tree with a ${x}-inch trunk`, yMin: 8 },
];
/** short column heads for data cards */
const HEADS: Record<string, [string, string]> = {
  rent: ['Sq ft', 'Rent ($)'], study: ['Hours', 'Score'], arm: ['Span (in)', 'Height (in)'], drinks: ['High (°F)', 'Drinks'],
  mpg: ['Weight (1,000 lb)', 'mpg'], growth: ['Age (yr)', 'Height (in)'], elev: ['Elev. (1,000 ft)', 'High (°F)'], screen: ['Screen (h)', 'Sleep (h)'],
  foot: ['Foot (in)', 'Height (in)'], bike: ['Miles', 'Minutes'], tree: ['Diam. (in)', 'Height (ft)'],
};
export const heads = (c: RCtx): [string, string] => HEADS[c.id] ?? ['x', 'y'];
/** a data table card: x | y (| ŷ) */
export function tableCard(c: RCtx, xs: readonly number[], ys: readonly number[], o: { yhat?: readonly string[]; title?: string; ring?: number[]; swap?: boolean } = {}): Card {
  const [hx, hy] = heads(c);
  const X = { head: hx, cells: xs.map(v => nH(v)) }, Y = { head: hy, cells: ys.map(v => nH(v)) };
  const cols = o.swap ? [Y, X] : [X, Y];
  if (o.yhat) cols.push({ head: 'ŷ', cells: o.yhat.slice() });
  return { title: o.title, cols, ring: o.ring };
}
export const ctxById =(id: string): RCtx => CTX.find(c => c.id === id)!;
export const ctxPick = (R: () => number, ids?: readonly string[]): RCtx => pick(R, ids ? CTX.filter(c => ids.includes(c.id)) : CTX);

/** every value is one the response can really take */
export const plausible = (c: RCtx, ys: readonly number[]): boolean => ys.every(y => y >= c.yOk[0] && y <= c.yOk[1]);
/** "a car", "an apartment" */
export const a1 = (w: string): string => (/^[aeiou]/i.test(w) ? 'an ' : 'a ') + w;
/** a response value with its unit: "$1,050", "12 points", "1 point", "−3°F", "7.5 hours" */
export function yv(c: RCtx, v: number, d = 2): string {
  if (c.money) { const s = Math.abs(rd(v, d)); return (rd(v, d) < 0 ? '−$' : '$') + (Number.isInteger(s) ? nH(s, 0) : s.toFixed(2)); }
  if (c.yUnit === '°F') return `${nH(v, d)}°F`;
  return `${nH(v, d)} ${Math.abs(rd(v, d)) === 1 ? c.yOne : c.yUnit}`;
}
/** an explanatory value with its unit */
export function xv(c: RCtx, v: number, d = 2): string {
  if (c.xUnit === '°F') return `${nH(v, d)}°F`;
  if (c.xUnit === 'thousand pounds') return `${nH(v * 1000, 0)} pounds`;
  if (c.xUnit === 'thousand feet') return `${nH(v * 1000, 0)} feet`;
  if (c.id === 'rent') return `${nH(v, 0)} square feet`;
  return `${nH(v, d)} ${Math.abs(v) === 1 ? c.xOne : c.xUnit}`;
}
/** the slope's units: "dollars per square foot" */
export const perUnit = (c: RCtx) => `${c.money ? 'dollars' : c.yUnit} per ${c.xUnit === 'thousand pounds' ? '1,000 pounds' : c.xUnit === 'thousand feet' ? '1,000 feet' : c.xOne}`;

// ---------- data ----------
export interface DSet { c: RCtx; xs: number[]; ys: number[]; f: Fit; /** the rounded model the item states */ A: number; B: number }
/** n cases of a context: spread-out distinct x values, y = a + b·x + noise, on the context's grids; the rounded least-squares
 *  model is tie-free at its places, and |r| lies in [rLo, rHi] */
export function dataSet(R: () => number, c: RCtx, n: number, o: { sd?: number; rLo?: number; rHi?: number; lo?: number; hi?: number } = {}): DSet {
  const rLo = o.rLo ?? 0.8, rHi = o.rHi ?? 0.985;
  return until(() => {
    const xs = spreadXs(R, n, o.lo ?? c.lo, o.hi ?? c.hi, c.xStep);
    if (c.zeroIn && R() < 0.5) xs[0] = 0;
    const ys = xs.map(x => {
      let y = onGrid(c.a + c.b * x + c.sd * (o.sd ?? 1) * noise(R), c.yStep);
      if (c.yMax !== undefined) y = Math.min(c.yMax, y);
      if (c.yMin !== undefined) y = Math.max(c.yMin, y);
      return y;
    });
    const f = lsrl(xs, ys);
    return { c, xs, ys, f, A: rd(f.a, c.da), B: rd(f.b, c.db) };
  }, s => plausible(c, s.ys) && new Set(s.xs).size === n && Math.abs(s.f.r) >= rLo && Math.abs(s.f.r) <= rHi && tieFree(s.f.a, s.c.da) && tieFree(s.f.b, s.c.db) && tieFree(s.f.r, 2) && Math.abs(s.B) > 0);
}

// ---------- axes and planes ----------
const STEPS = [0.05, 0.1, 0.2, 0.25, 0.5, 1, 2, 2.5, 5, 10, 20, 25, 50, 100, 200, 250, 500];
/** a window around the values with 4 to 10 grid cells (multiples of a nice step), 0 included when asked */
export function axisFor(vals: readonly number[], name: string, o: { zero?: boolean; sym?: boolean; max?: number } = {}): GAxis {
  let lo = Math.min(...vals), hi = Math.max(...vals);
  if (o.sym) { const m = Math.max(Math.abs(lo), Math.abs(hi)); lo = -m; hi = m; }
  if (o.zero) { lo = Math.min(lo, 0); hi = Math.max(hi, 0); }
  for (const s of STEPS) {
    let min = Math.floor(lo / s - 1e-9) * s, max = Math.ceil(hi / s + 1e-9) * s;
    // a little room around the dots (not when the edge is 0 and nothing is below it)
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
/** the dots of a data set as Plane items (keys pts#i share the step 'pts'); `hot` indices get their own keys and colour */
export function dots(xs: readonly number[], ys: readonly number[], o: { hot?: number[]; col?: 'first' | 'second'; key?: string; names?: Record<number, string> } = {}): GItem[] {
  const key = o.key ?? 'pts';
  return xs.map((x, i) => (o.hot?.includes(i)
    ? { kind: 'point', key: `hot#${i}`, x, y: ys[i]!, col: 'pick', name: o.names?.[i] }
    : { kind: 'point', key: `${key}#${i}`, x, y: ys[i]!, col: o.col ?? 'first', name: o.names?.[i] }) as GItem);
}
/** a line ŷ = a + b·x over lo..hi */
export const lineItem = (key: string, a: number, b: number, o: { lo?: number; hi?: number; col?: 'link' | 'pick' | 'second' | 'wrong' | 'dim' | 'first' | 'water'; dash?: boolean; name?: string } = {}): GItem =>
  ({ kind: 'line', key, m: b, b: a, lo: o.lo, hi: o.hi, col: o.col ?? 'link', dash: o.dash, name: o.name });
/** vertical residual sticks from the line to each dot (keys res#i, step 'res') */
export const sticks = (xs: readonly number[], ys: readonly number[], a: number, b: number, only?: number[], key = 'res'): GItem[] =>
  xs.flatMap((x, i) => (only && !only.includes(i) ? [] : [{ kind: 'seg', key: `${key}#${i}`, a: [x, r9(a + b * x)], b: [x, ys[i]!], col: 'second', w: 4 } as GItem]));
/** a scatter plot picture: dots (+ an optional line and sticks); the window holds the dots, the line ends and the sticks */
export function scatterG(d: { c: RCtx; xs: readonly number[]; ys: readonly number[] }, o: { line?: [number, number]; lineSolve?: boolean; sticks?: 'show' | 'solve'; hot?: number[]; extraX?: number[]; extraY?: number[]; zeroY?: boolean; zeroX?: boolean; title?: string; names?: Record<number, string> } = {}): RG {
  const { xs, ys, c } = d;
  const lineYs = o.line ? [Math.min(...xs), Math.max(...xs)].map(x => o.line![0] + o.line![1] * x) : [];
  const x = axisFor([...xs, ...(o.extraX ?? [])], c.xAxis, { zero: o.zeroX });
  const y = axisFor([...ys, ...lineYs, ...(o.extraY ?? [])], c.yAxis, { zero: o.zeroY, max: c.yMax });
  const items: GItem[] = [], solveItems: GItem[] = [];
  if (o.line) (o.lineSolve ? solveItems : items).push(lineItem('fit', o.line[0], o.line[1], { lo: x.min, hi: x.max }));
  if (o.line && o.sticks) (o.sticks === 'show' ? items : solveItems).push(...sticks(xs, ys, o.line[0], o.line[1]));
  items.push(...dots(xs, ys, { hot: o.hot, names: o.names }));
  return { x, y, items, solveItems: solveItems.length ? solveItems : undefined, title: o.title };
}
/** a residual plot picture: the points (x, e) and the reference line at 0 */
export function residG(c: RCtx, xs: readonly number[], es: readonly number[], o: { hot?: number[]; solve?: boolean; title?: string; unit?: string; xAxis?: GAxis } = {}): RG {
  const x = o.xAxis ?? axisFor(xs, c.xAxis);
  const y = axisFor(es, `Residual (${o.unit ?? (c.money ? '$' : c.yUnit)})`, { sym: true });
  const zero = lineItem('zero', 0, 0, { lo: x.min, hi: x.max, col: 'dim' });
  const pts = xs.map((xx, i) => ({ kind: 'point', key: o.hot?.includes(i) ? `rhot#${i}` : `rpt#${i}`, x: xx, y: es[i]!, col: o.hot?.includes(i) ? 'pick' : 'second' }) as GItem);
  return o.solve ? { x: { ...x, name: c.xAxis }, y, items: [zero], solveItems: pts, resid: true, title: o.title } : { x: { ...x, name: c.xAxis }, y, items: [zero, ...pts], resid: true, title: o.title };
}

// ---------- item makers ----------
export interface Opt { t: string; ok?: boolean; mc?: string; say: string; /** same key as the right choice = the same answer: dropped */ key?: string }
export interface Base { id: string; family: string; prompt: string; board: string; solution: string[]; picture?: RPic; unit?: string }

/** a choice item: duplicate texts and wrong choices that mean the same as the right one (same key) are dropped */
export function choice(R: () => number, b: Base, opts: Opt[], keepOrder = false): RItem {
  const right = opts.filter(x => x.ok);
  if (right.length !== 1) throw new Error(`${b.family}: exactly one right choice`);
  const rk = right[0]!.key;
  const seen = new Set<string>();
  const o0 = opts.filter(x => {
    const k = x.t.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
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
const near = (a: number, b: number, tol: number) => Math.abs(a - b) <= tol;
/** a typed number; `also` = other values that count as right (the unrounded value of a rounded answer) */
export function numItem(b: Base, v: number, okSay: string, cands: Cand[], hint: string, o: { tol?: number; also?: number[] } = {}): RItem {
  const tol = o.tol ?? 1e-6;
  const isRight = (x: number) => near(x, v, tol) || (o.also ?? []).some(a => near(x, a, tol));
  return {
    ...b, input: 'num', answer: { kind: 'num', v },
    check(r: Response): Verdict {
      if (r.kind !== 'num' || !Number.isFinite(r.v)) return { ok: false, say: 'Type a number (a decimal is fine).' };
      if (isRight(r.v)) return { ok: true, say: okSay };
      for (const [c, mc, say] of cands) if (Number.isFinite(c) && !isRight(c) && near(r.v, c, Math.max(tol, 1e-6))) return { ok: false, mc, say };
      return { ok: false, say: hint };
    },
  };
}
export type PCand = [number, number, string | undefined, string];
export function pairItem(b: Base, x: number, y: number, form: { lead: string; op: string; tail?: string }, okSay: string, cands: PCand[], hint: string, tol = 1e-6): RItem {
  const nr = (p: number, q: number) => Math.abs(p - q) <= tol;
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
/** "calculator" / "no calculator" tag in front of a prompt */
export const calc = (yes: boolean) => `<span class="dim">(${yes ? 'calculator' : 'no calculator'})</span> `;
