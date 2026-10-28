// common.ts: what every practice family of "Summarizing and comparing data" shares: the item type with its picture
// (a DataPlot spec the page draws), misconception ids (math-curriculum-essentials/misconceptions.json), the stated
// conventions, realistic contexts, data makers and the choice / number / pair item makers. Pure: no DOM.
import { type Item, type Response, type Verdict, int, pick, shuffle } from '../../runtime/item';
import { ans, endOnChoice } from '../../runtime/explain';
import type { DAxis, DMark, DPanel } from './DataPlot';
import { fmt, fmtT, r9 } from './stats';

export { ans, int, pick, shuffle };

/** a plot the page draws (DataPlot params) + what the replay adds after a miss (hidden from oracles: solve*) */
export interface PlotPic {
  axis: DAxis; panels: DPanel[]; marks?: DMark[];
  /** a dot the question points at (colored) */ hot?: { panel: string; idx: number[] };
  /** panels drawn empty first (the student builds them in their head); the replay draws them */ empty?: string[];
  solveMarks?: DMark[]; solvePanels?: string[];
}
export interface Pic { [k: string]: unknown; plot?: PlotPic; list?: { name: string; data: number[] }; stem?: { stems: number[]; leaves: number[][]; key: string } }
export interface DItem extends Item { picture?: Pic }
export type Gen = (R: () => number, n: number, sg?: string) => DItem;

export const MC = {
  noSort: 'mc.statistics.median-without-sorting',
  eitherMiddle: 'mc.statistics.even-median-selects-either-middle',
  tallest: 'mc.statistics.center-chosen-by-maximum-or-tallest-stack',
  midScale: 'mc.statistics.middle-of-scale-as-center',
  midrange: 'mc.statistics.midrange-as-median',
  centerAlone: 'mc.statistics.center-alone-summarizes-distribution',
  rangeSpread: 'mc.statistics.range-as-reliable-spread',
  shiftSpread: 'mc.statistics.shift-changes-spread',
  heights: 'mc.statistics.spread-from-heights-not-width',
  bell: 'mc.statistics.symmetric-means-bell',
  peak: 'mc.statistics.skew-named-by-peak',
  clusters: 'mc.statistics.ignores-clusters-and-gaps',
  hidden: 'mc.data-displays.reads-hidden-information',
  lenCount: 'mc.data-displays.box-section-length-as-count',
  quarter: 'mc.data-displays.box-sections-exactly-quarter',
  extreme: 'mc.statistics.extreme-value-always-outlier',
  otherRef: 'mc.statistics.mean-deviations-use-another-reference',
  signedCancel: 'mc.statistics.signed-deviations-cancel',
  missMeanKnown: 'mc.statistics.missing-value-as-mean-of-known',
  missIsMean: 'mc.statistics.missing-value-equals-mean',
  madHalfRange: 'mc.statistics.mad-as-half-range',
  repeatedOnce: 'mc.statistics.repeated-values-counted-once',
  madSum: 'mc.statistics.mad-sum-not-divided',
  sdRange: 'mc.statistics.sd-equals-range',
  spreadAsCenter: 'mc.statistics.spread-measure-as-center',
  sdObserved: 'mc.statistics.sd-must-be-observed-value',
  sdIsMad: 'mc.statistics.sd-equals-other-spread-measure',
  sdNeg: 'mc.statistics.sd-can-be-negative',
  oneBar: 'mc.data-displays.one-bar-per-observation',
  barChart: 'mc.data-displays.histogram-as-bar-chart',
  equalTicks: 'mc.data-displays.data-values-as-equal-ticks',
  bothBins: 'mc.data-displays.boundary-in-both-bins',
  layout: 'mc.data-displays.layout-change-changes-data',
  splitRange: 'mc.statistics.quartiles-split-range-equally',
  mustBeError: 'mc.statistics.unusual-value-must-be-error',
  statusFixed: 'mc.statistics.outlier-status-independent-of-data-set',
  atFences: 'mc.data-displays.modified-whiskers-end-at-fences',
  samePurpose: 'mc.data-displays.same-display-best-for-every-purpose',
  orderTime: 'mc.data-displays.ordered-data-as-time',
  everyType: 'mc.data-displays.every-display-suits-every-data-type',
  codes: 'mc.statistics.numeric-codes-are-quantitative-data',
  twoAsOne: 'mc.statistics.two-categorical-variables-read-as-one',
  addStemLeaf: 'mc.data-displays.adds-stem-and-leaf',
  leftover: 'mc.statistics.trusts-tech-without-checking-entry',
  trustCalc: 'mc.estimation.trusts-calculator-display',
  sampleSd: 'mc.statistics.sample-vs-population-sd-output',
  pctNumeral: 'mc.percent.percent-numeral-without-dividing-by-100',
  unweighted: 'mc.statistics.unweighted-average',
  overCount: 'mc.statistics.weighted-sum-over-category-count',
  pushAway: 'mc.statistics.larger-weight-pushes-away',
  bare: 'mc.reasoning-language.bare-number-without-meaning',
  singleCase: 'mc.statistics.single-case-instead-of-distribution',
  unlike: 'mc.reasoning-language.compares-unlike-units-or-things',
  rightTail: 'mc.statistics.right-tail-always-mean-above-median',
  equalEffect: 'mc.statistics.outlier-effect-on-mean-vs-median',
  medNever: 'mc.statistics.median-never-changes',
  meanIgnoresN: 'mc.statistics.mean-change-ignores-n',
  meanIgnoresExtreme: 'mc.statistics.mean-ignores-isolated-extreme',
  equallySensitive: 'mc.statistics.spread-measures-equally-sensitive',
  iqrImmune: 'mc.statistics.iqr-immune-to-change',
  purpose: 'mc.statistics.center-choice-ignores-question-purpose',
  meanBest: 'mc.statistics.mean-always-best-summary',
  everyHigher: 'mc.statistics.higher-center-means-every-value-higher',
  meanVsMedian: 'mc.statistics.compares-mean-with-median-across-groups',
  singledOut: 'mc.statistics.singled-out-cases-determine-group-comparison',
  alwaysDelete: 'mc.statistics.always-delete-outliers',
  cherryPick: 'mc.statistics.selects-valid-data-for-preferred-result',
  iqrCount: 'mc.statistics.iqr-as-count-between-quartiles',
  interchangeable: 'mc.statistics.center-measures-treated-as-interchangeable',
} as const;

// ---------- the stated conventions ----------
export const RULE = {
  quart: 'Quartiles: the medians of the two halves of the ordered list (odd count: leave the median out, as the TI-84 does).',
  fence: 'Outlier rule: a value more than 1.5 × IQR below Q1 or above Q3 (a value exactly on a fence is not an outlier).',
  sd: 'SD means σ, the population standard deviation (σx on the TI-84).',
  bins: 'Each bin includes its lower end, not its upper end.',
};

// ---------- contexts: realistic values with US units ----------
export interface Ctx {
  id: string;
  /** the cases ("students"), the measure ("commute"), the unit plural and singular */
  who: string; what: string; unit: string; u1: string;
  axis: string; lo: number; hi: number; dec: 0 | 1;
  /** the measure in the plural ("commute times") and two group names for comparisons */ many?: string; groups?: [string, string][];
  /** money: "$" before the number */ money?: boolean;
}
export const CTX: Record<string, Ctx> = {
  commute: { id: 'commute', who: 'students', what: 'commute to school', unit: 'minutes', u1: 'minute', axis: 'Commute (minutes)', lo: 5, hi: 45, dec: 0, many: 'commute times', groups: [['Class A', 'Class B'], ['School A', 'School B']] },
  quiz: { id: 'quiz', who: 'students', what: 'quiz score', unit: 'points', u1: 'point', axis: 'Quiz score (points)', lo: 2, hi: 20, dec: 0, many: 'quiz scores', groups: [['Class A', 'Class B'], ['Period 1', 'Period 2']] },
  points: { id: 'points', who: 'games', what: 'points scored', unit: 'points', u1: 'point', axis: 'Points scored', lo: 0, hi: 34, dec: 0, many: 'points per game', groups: [['Player A', 'Player B'], ['Team A', 'Team B']] },
  height: { id: 'height', who: '9th graders', what: 'height', unit: 'inches', u1: 'inch', axis: 'Height (inches)', lo: 58, hi: 76, dec: 0, many: 'heights', groups: [['Class A', 'Class B']] },
  battery: { id: 'battery', who: 'phones', what: 'battery life', unit: 'hours', u1: 'hour', axis: 'Battery life (hours)', lo: 6, hi: 26, dec: 0, many: 'battery lives', groups: [['Brand A', 'Brand B']] },
  test: { id: 'test', who: 'students', what: 'test score', unit: 'points', u1: 'point', axis: 'Test score (points)', lo: 40, hi: 100, dec: 0, many: 'test scores', groups: [['Class A', 'Class B'], ['Period 1', 'Period 2']] },
  sleep: { id: 'sleep', who: 'students', what: 'sleep last night', unit: 'hours', u1: 'hour', axis: 'Sleep (hours)', lo: 4.5, hi: 10.5, dec: 1, many: 'hours of sleep', groups: [['Class A', 'Class B']] },
  sprint: { id: 'sprint', who: 'runners', what: '100 m dash time', unit: 'seconds', u1: 'second', axis: '100 m time (seconds)', lo: 11.5, hi: 17.5, dec: 1, many: '100 m dash times', groups: [['Team A', 'Team B']] },
  apple: { id: 'apple', who: 'apples', what: 'weight', unit: 'ounces', u1: 'ounce', axis: 'Weight (ounces)', lo: 4, hi: 10, dec: 1, many: 'apple weights', groups: [['Orchard A', 'Orchard B']] },
  temp: { id: 'temp', who: 'January days', what: 'low temperature', unit: '°F', u1: '°F', axis: 'Low temperature (°F)', lo: -14, hi: 26, dec: 0, many: 'low temperatures', groups: [['City A', 'City B']] },
  sneaker: { id: 'sneaker', who: 'pairs of sneakers', what: 'price', unit: 'dollars', u1: 'dollar', axis: 'Price (dollars)', lo: 40, hi: 160, dec: 0, money: true, many: 'sneaker prices', groups: [['Store A', 'Store B']] },
  reaction: { id: 'reaction', who: 'players', what: 'reaction time', unit: 'milliseconds', u1: 'millisecond', axis: 'Reaction time (ms)', lo: 180, hi: 340, dec: 0, many: 'reaction times', groups: [['Team A', 'Team B']] },
  homerun: { id: 'homerun', who: 'home runs', what: 'distance', unit: 'feet', u1: 'foot', axis: 'Distance (feet)', lo: 340, hi: 470, dec: 0, many: 'home run distances', groups: [['Player A', 'Player B']] },
};
export const ctxPick = (R: () => number, ids: readonly string[]): Ctx => CTX[pick(R, ids)]!;
/** "the commute times of 9 students (minutes)": what a data set is, with its unit */
const PH: Record<string, string> = {
  commute: 'the commute times of {n} students (minutes)', quiz: 'the scores of {n} students on a 20-point quiz',
  points: 'the points a basketball player scored in {n} games', height: 'the heights of {n} ninth graders (inches)',
  battery: 'the battery lives of {n} phones (hours)', test: 'the scores of {n} students on a 100-point test',
  sleep: 'the hours of sleep {n} students got last night', sprint: 'the 100 m dash times of {n} runners (seconds)',
  apple: 'the weights of {n} apples (ounces)', temp: 'the low temperatures on {n} January days in Duluth (°F)',
  sneaker: 'the prices of {n} pairs of sneakers (dollars)', reaction: 'the reaction times of {n} players (milliseconds)',
  homerun: 'the distances of {n} home runs (feet)',
};
export const groupsOf = (R: () => number, c: Ctx): [string, string] => pick(R, c.groups ?? [['Group A', 'Group B']]);
export const manyOf = (c: Ctx) => `${c.many ?? c.what} (${c.unit})`;
export const phrase = (c: Ctx, n: number) => PH[c.id]!.replace('{n}', String(n));
/** a value with its unit: "12 minutes", "1 point", "$45", "−3°F", "7.5 hours" */
export function withU(c: Ctx, v: number, d = 3): string {
  if (c.money) return (v < 0 ? '−$' : '$') + fmt(Math.abs(v), d);
  if (c.unit === '°F') return `${fmt(v, d)}°F`;
  return `${fmt(v, d)} ${Math.abs(v) === 1 ? c.u1 : c.unit}`;
}
/** the unit after a value: "1 point", "3 points" */
export const un = (c: Ctx, v: number) => (Math.abs(v) === 1 ? c.u1 : c.unit);
/** plural noun after a count ("1 student", "3 students") */
export const pl = (k: number, one: string, many = one + 's') => `${k} ${k === 1 ? one : many}`;

// ---------- data makers ----------
export const roundD = (v: number, dec: number) => r9(Math.round(v * 10 ** dec) / 10 ** dec);
/** a value on the context's grid (whole or tenths) between lo and hi */
export const val = (R: () => number, lo: number, hi: number, dec: number) => roundD(lo + R() * (hi - lo), dec);
/** n values with a shape: mound (sum of uniforms), right / left skew, uniform, spread (wide) */
export function shaped(R: () => number, n: number, lo: number, hi: number, dec: number, shape: 'mound' | 'right' | 'left' | 'uniform'): number[] {
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    let u: number;
    if (shape === 'mound') u = (R() + R() + R()) / 3;
    else if (shape === 'right') u = Math.min(0.999, -Math.log(1 - R() * 0.95) / 3.2);
    else if (shape === 'left') u = 1 - Math.min(0.999, -Math.log(1 - R() * 0.95) / 3.2);
    else u = R();
    out.push(roundD(lo + u * (hi - lo), dec));
  }
  return out;
}
/** try a maker until the test holds (generators stay total: the last try is returned and the tests catch misses) */
export function until<T>(make: () => T, ok: (t: T) => boolean, tries = 3000): T {
  let t = make();
  for (let i = 0; i < tries && !ok(t); i++) t = make();
  if (!ok(t)) throw new Error('until: no data found');
  return t;
}
/** list text for prompts: "12, 15, 9" with real minus signs */
export const listH = (xs: readonly number[]) => xs.map(v => fmt(v)).join(', ');
/** the list on the board, split into rows of `per` values (\qquad separates board lines) */
export function listT(xs: readonly number[], per = 5): string {
  const rows: string[] = [];
  for (let i = 0; i < xs.length; i += per) rows.push(xs.slice(i, i + per).map(v => fmtT(v)).join(',\\ ') + (i + per < xs.length ? ',' : ''));
  return rows.join(' \\qquad ');
}
/** a nice axis for a context's data: ticks every 1, 2, 5, 10 … with 6 to 14 ticks */
export function axisOf(c: Ctx | string, lo: number, hi: number, o: { ticks?: [number, number]; step?: number } = {}): DAxis {
  const name = typeof c === 'string' ? c : c.axis;
  const [tMin, tMax] = o.ticks ?? [6, 14];
  const steps = o.step ? [o.step] : [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 25, 50, 100];
  for (const s of steps) {
    let min = r9(Math.floor(lo / s) * s), max = r9(Math.ceil(hi / s) * s);
    if (min === lo && lo !== 0) min = r9(min - s);
    if (max === hi) max = r9(max + s);
    let n = Math.round((max - min) / s), k = 0;
    while (n < tMin) { if (k++ % 2 === 0 || (lo >= 0 && min - s < -1e-9)) max = r9(max + s); else min = r9(min - s); n++; }
    if (n <= tMax) return { min, max, step: s, name };
  }
  return { min: lo, max: hi, step: r9((hi - lo) / 10), name };
}

// ---------- item makers ----------
export interface Opt { t: string; ok?: boolean; mc?: string; say: string; /** same key as the right choice = the same answer: dropped */ key?: string }
export interface Base { id: string; family: string; prompt: string; board: string; solution: string[]; picture?: Pic; unit?: string }

/** a choice item: duplicate texts and wrong choices that mean the same as the right one (same key) are dropped */
export function choice(R: () => number, b: Base, opts: Opt[], keepOrder = false): DItem {
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
const near = (a: number, b: number, tol: number) => Math.abs(a - b) <= tol;
/** a typed number; `also` = other values that count as right (e.g. the unrounded value) */
export function numItem(b: Base, v: number, okSay: string, cands: Cand[], hint: string, o: { tol?: number; also?: number[] } = {}): DItem {
  const tol = o.tol ?? 1e-6;
  const isRight = (x: number) => near(x, v, tol) || (o.also ?? []).some(a => near(x, a, tol));
  return {
    ...b, input: 'num', answer: { kind: 'num', v },
    check(r: Response): Verdict {
      if (r.kind !== 'num' || !Number.isFinite(r.v)) return { ok: false, say: 'Type a number (a decimal is fine).' };
      if (isRight(r.v)) return { ok: true, say: okSay };
      for (const [c, mc, say] of cands) if (Number.isFinite(c) && !isRight(c) && near(r.v, c, tol)) return { ok: false, mc, say };
      return { ok: false, say: hint };
    },
  };
}
export type PCand = [number, number, string | undefined, string];
export function pairItem(b: Base, x: number, y: number, form: { lead: string; op: string; tail?: string }, okSay: string, cands: PCand[], hint: string): DItem {
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
/** a tenth-rounded value that is not a .x5 tie (generators retry on a tie) */
export function tenth(v: number): number | null { const s = v * 10, f = s - Math.floor(s); return Math.abs(f - 0.5) < 1e-4 ? null : Math.round(s) / 10; }
export const H = (v: number, d = 3) => fmt(v, d);
export const B = (s: string | number) => `<b class="b">${s}</b>`;
export const A = (s: string | number) => `<b class="a">${s}</b>`;
