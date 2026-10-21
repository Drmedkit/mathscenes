// bivariate.ts: the exact maths of "scatter plots and bivariate data" (secondary-t5-40). Pure: no DOM, no canvas.
//   PlotSpec / TableSpec   what a picture shows (the Scatter and TableCard blocks draw them; items build them)
//   lineY, fitLine, corr   trend lines, least squares and Pearson r (r only checks the generators, kids never see it)
//   niceAxis               an equal-interval scale for one variable's range (each axis gets its own)
//   CONTEXTS               realistic US contexts (units, ranges, a trend) and seeded clouds from them
//   SMOOTHIE               the lesson's data set: 12 summer days, high temperature (°F) and smoothies sold
//   twoWay                 a two-way frequency table with margins and row / column relative frequencies
import { int } from '../../runtime/item';

// ---------- pictures ----------
export interface P2 { x: number; y: number; /** cases at this exact spot (a duplicate pair), default 1 */ n?: number; /** a letter beside the dot */ tag?: string }
export type LineRole = 'link' | 'second' | 'pick' | 'water' | 'wrong' | 'dim' | 'first';
export interface TLine { m: number; b: number; /** drawn from x0 to x1 (default: the whole window) */ x0?: number; x1?: number; col?: LineRole; tag?: string; dash?: boolean }
export interface PlotSpec {
  x0: number; x1: number; xStep: number; y0: number; y1: number; yStep: number;
  /** axis names with units, e.g. 'high temperature (°F)' */
  xName: string; yName: string;
  pts: P2[];
  lines?: TLine[];
  /** a (wrong) polyline that joins the dots left to right */
  join?: boolean;
  /** a straight edge laid along y = m x + b */
  ruler?: { m: number; b: number };
  /** the observed x-range [min, max] (shaded on demand) */
  band?: [number, number];
  /** candidate spots with letters (where does this case go?) */
  marks?: { x: number; y: number; tag: string }[];
  /** groups of point indices (clusters) */
  groups?: number[][];
  /** point indices ringed from the start */
  ring?: number[];
}
export interface TableSpec {
  head: string[];
  rows: string[][];
  /** the first column names the row (a two-way table or a named case) */
  rowHead?: boolean;
  /** the last row and column are totals (margins) */
  margins?: boolean;
  /** split the rows into two side-by-side halves (a long table on the narrow board) */
  split?: boolean;
}

// ---------- numbers ----------
export const EPS = 1e-9;
export const near = (a: number, b: number, e = EPS) => Math.abs(a - b) < e;
export const round = (v: number, d = 0) => { const k = 10 ** d; return Math.round(v * k) / k; };
/** a number as plain text (no trailing zeros; a real minus sign) */
export function fmt(v: number, d = 2): string {
  const r = round(v, d);
  const s = String(Math.abs(r));
  return (r < 0 ? '−' : '') + s;
}
/** a number in TeX (a TeX minus) */
export const tx = (v: number, d = 2) => (round(v, d) < 0 ? '-' : '') + String(Math.abs(round(v, d)));
export const lineY = (L: { m: number; b: number }, x: number) => L.m * x + L.b;

/** least-squares line (checks only) */
export function fitLine(P: readonly P2[]): { m: number; b: number } {
  const n = P.length, mx = P.reduce((s, p) => s + p.x, 0) / n, my = P.reduce((s, p) => s + p.y, 0) / n;
  const sxy = P.reduce((s, p) => s + (p.x - mx) * (p.y - my), 0), sxx = P.reduce((s, p) => s + (p.x - mx) ** 2, 0);
  const m = sxx ? sxy / sxx : 0;
  return { m, b: my - m * mx };
}
/** Pearson r (checks only: the generators prove "tight" and "loose" with it) */
export function corr(P: readonly P2[]): number {
  const n = P.length, mx = P.reduce((s, p) => s + p.x, 0) / n, my = P.reduce((s, p) => s + p.y, 0) / n;
  const sxy = P.reduce((s, p) => s + (p.x - mx) * (p.y - my), 0);
  const sxx = P.reduce((s, p) => s + (p.x - mx) ** 2, 0), syy = P.reduce((s, p) => s + (p.y - my) ** 2, 0);
  return sxx && syy ? sxy / Math.sqrt(sxx * syy) : 0;
}
/** mean distance (vertical) of the points from a line */
export const meanGap = (P: readonly P2[], L: { m: number; b: number }) => P.reduce((s, p) => s + Math.abs(p.y - lineY(L, p.x)), 0) / P.length;
export const above = (P: readonly P2[], L: { m: number; b: number }) => P.filter(p => p.y > lineY(L, p.x) + EPS).length;
export const below = (P: readonly P2[], L: { m: number; b: number }) => P.filter(p => p.y < lineY(L, p.x) - EPS).length;
export const xRange = (P: readonly P2[]): [number, number] => [Math.min(...P.map(p => p.x)), Math.max(...P.map(p => p.x))];
export const yRange = (P: readonly P2[]): [number, number] => [Math.min(...P.map(p => p.y)), Math.max(...P.map(p => p.y))];

/** an equal-interval scale for [lo, hi]: a friendly step, ends on the step, at most `max` intervals; starts at 0 when that is close */
export function niceAxis(lo: number, hi: number, max = 8): { a: number; b: number; step: number } {
  const span = Math.max(hi - lo, 1e-6);
  const steps = [0.1, 0.2, 0.25, 0.5, 1, 2, 2.5, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000];
  for (const s of steps) {
    let a = Math.floor(lo / s + EPS) * s, b = Math.ceil(hi / s - EPS) * s;
    if (b - a < span + EPS) b += s;
    // keep dots off the axis lines and the plot's edge: a quarter step of room at both ends (0 stays 0)
    if (a > 0 && lo - a < 0.25 * s) a -= s;
    if (b - hi < 0.25 * s) b += s;
    if (a > 0 && a <= 2 * s) a = 0;
    if ((b - a) / s <= max + EPS) return { a: round(a, 3), b: round(b, 3), step: s };
  }
  return { a: lo, b: hi, step: span };
}
/** a full PlotSpec window for some points (each axis its own scale) */
export function windowFor(P: readonly P2[], xName: string, yName: string, o: { xMax?: number; yMax?: number; extraX?: number[]; extraY?: number[] } = {}): PlotSpec {
  const [xa, xb] = xRange(P), [ya, yb] = yRange(P);
  const X = niceAxis(Math.min(xa, ...(o.extraX ?? [])), Math.max(xb, ...(o.extraX ?? [])), o.xMax ?? 8);
  const Y = niceAxis(Math.min(ya, ...(o.extraY ?? [])), Math.max(yb, ...(o.extraY ?? [])), o.yMax ?? 8);
  return { x0: X.a, x1: X.b, xStep: X.step, y0: Y.a, y1: Y.b, yStep: Y.step, xName, yName, pts: P.map(p => ({ ...p })) };
}
export function inWindow(s: PlotSpec, x: number, y: number): boolean { return x >= s.x0 - EPS && x <= s.x1 + EPS && y >= s.y0 - EPS && y <= s.y1 + EPS; }

// ---------- contexts ----------
export type Shape = 'line' | 'rise' | 'fall' | 'hump' | 'u' | 'none';
export interface Ctx {
  id: string;
  /** one case, many cases: 'student', 'students' */
  one: string; many: string;
  xName: string; yName: string;
  /** short column headers for a table on the narrow board */
  xHead?: string; yHead?: string;
  /** short words for sentences: 'the high temperature', 'smoothies sold'; units for sentences */
  xWord: string; yWord: string; xUnit: string; yUnit: string;
  /** a per-unit phrase for the slope: 'smoothies per °F' */
  per: string;
  lo: number; hi: number; xDec: number; yDec: number;
  shape: Shape;
  /** the trend (for 'line'), or the curve f(x) */
  m?: number; b?: number; f?: (x: number) => number;
  noise: number;
  /** an investigative question that names the predictor */
  q: string;
  /** could x = 0 happen in this context (is the intercept meaningful)? and is it in the observed range? */
  zeroOk: boolean;
}
const L = (c: Omit<Ctx, 'shape'>): Ctx => ({ ...c, shape: 'line' });
export const CONTEXTS: Ctx[] = [
  L({ id: 'smoothie', xHead: 'high (°F)', yHead: 'sold', one: 'day', many: 'days', xName: 'high temperature (°F)', yName: 'smoothies sold', xWord: 'the high temperature', yWord: 'smoothies sold', xUnit: '°F', yUnit: 'smoothies', per: 'smoothies per °F',
    lo: 66, hi: 95, xDec: 0, yDec: 0, m: 2.5, b: -135, noise: 5, q: 'Can the day’s high temperature help predict how many smoothies sell?', zeroOk: false }),
  L({ id: 'study', xHead: 'hours', yHead: 'score', one: 'student', many: 'students', xName: 'hours studied', yName: 'test score (points)', xWord: 'hours studied', yWord: 'the test score', xUnit: 'hours', yUnit: 'points', per: 'points per hour',
    lo: 1, hi: 9, xDec: 0, yDec: 0, m: 5, b: 50, noise: 6, q: 'Can hours studied help predict the test score?', zeroOk: true }),
  L({ id: 'armspan', xHead: 'height (in)', yHead: 'arm span (in)', one: 'student', many: 'students', xName: 'height (in)', yName: 'arm span (in)', xWord: 'height', yWord: 'arm span', xUnit: 'in', yUnit: 'in', per: 'inches of arm span per inch of height',
    lo: 56, hi: 72, xDec: 0, yDec: 0, m: 1, b: 0, noise: 2, q: 'Can a student’s height help predict their arm span?', zeroOk: false }),
  L({ id: 'growth', xHead: 'age (yr)', yHead: 'height (in)', one: 'child', many: 'children', xName: 'age (years)', yName: 'height (in)', xWord: 'age', yWord: 'height', xUnit: 'years', yUnit: 'in', per: 'inches per year',
    lo: 5, hi: 13, xDec: 0, yDec: 0, m: 2.4, b: 31, noise: 2, q: 'Can a child’s age help predict their height?', zeroOk: false }),
  L({ id: 'car', xHead: 'age (yr)', yHead: 'price (thousand $)', one: 'car', many: 'cars', xName: 'age (years)', yName: 'price (thousand $)', xWord: 'the car’s age', yWord: 'the price', xUnit: 'years', yUnit: 'thousand dollars', per: 'thousand dollars per year',
    lo: 1, hi: 12, xDec: 0, yDec: 1, m: -1.5, b: 24, noise: 1.5, q: 'Can a used car’s age help predict its price?', zeroOk: true }),
  L({ id: 'cocoa', xHead: 'high (°F)', yHead: 'cups sold', one: 'day', many: 'days', xName: 'high temperature (°F)', yName: 'cups of cocoa sold', xWord: 'the high temperature', yWord: 'cocoa sold', xUnit: '°F', yUnit: 'cups', per: 'cups per °F',
    lo: 20, hi: 60, xDec: 0, yDec: 0, m: -1.5, b: 110, noise: 5, q: 'Can the high temperature help predict cocoa sales?', zeroOk: false }),
  L({ id: 'absent', xHead: 'days absent', yHead: 'grade (%)', one: 'student', many: 'students', xName: 'days absent', yName: 'final grade (%)', xWord: 'days absent', yWord: 'the final grade', xUnit: 'days', yUnit: 'percentage points', per: 'points per day absent',
    lo: 0, hi: 15, xDec: 0, yDec: 0, m: -1.6, b: 92, noise: 4, q: 'Can days absent help predict the final grade?', zeroOk: true }),
  L({ id: 'freethrow', xHead: 'practice (min)', yHead: 'made (of 25)', one: 'player', many: 'players', xName: 'practice (min per day)', yName: 'free throws made (of 25)', xWord: 'daily practice', yWord: 'free throws made', xUnit: 'minutes', yUnit: 'free throws', per: 'free throws per minute',
    lo: 10, hi: 60, xDec: 0, yDec: 0, m: 0.25, b: 6, noise: 2, q: 'Can daily practice time help predict free throws made?', zeroOk: true }),
  L({ id: 'shoe', xHead: 'height (in)', yHead: 'shoe size', one: 'student', many: 'students', xName: 'height (in)', yName: 'shoe size (US)', xWord: 'height', yWord: 'shoe size', xUnit: 'in', yUnit: 'sizes', per: 'sizes per inch',
    lo: 58, hi: 72, xDec: 0, yDec: 0, m: 0.4, b: -17, noise: 0.8, q: 'Can height help predict shoe size?', zeroOk: false }),
  L({ id: 'sleep', xHead: 'screen (hr)', yHead: 'sleep (hr)', one: 'student', many: 'students', xName: 'screen time (hours a day)', yName: 'sleep (hours a night)', xWord: 'screen time', yWord: 'sleep', xUnit: 'hours', yUnit: 'hours', per: 'hours of sleep per hour of screen time',
    lo: 1, hi: 8, xDec: 0, yDec: 1, m: -0.4, b: 10, noise: 0.4, q: 'Can daily screen time help predict hours of sleep?', zeroOk: true }),
];
export const LINEAR = CONTEXTS;
export const POSITIVE = CONTEXTS.filter(c => (c.m ?? 0) > 0), NEGATIVE = CONTEXTS.filter(c => (c.m ?? 0) < 0);
/** no clear association */
export const NONE: Ctx[] = [
  { id: 'jersey', one: 'player', many: 'players', xName: 'jersey number', yName: 'points scored', xWord: 'jersey number', yWord: 'points scored', xUnit: '', yUnit: 'points', per: '', lo: 1, hi: 40, xDec: 0, yDec: 0, shape: 'none', f: () => 14, noise: 9, q: 'Can jersey number help predict points scored?', zeroOk: true },
  { id: 'birthday', one: 'student', many: 'students', xName: 'day of the month born', yName: 'height (in)', xWord: 'birth day of the month', yWord: 'height', xUnit: '', yUnit: 'in', per: '', lo: 1, hi: 31, xDec: 0, yDec: 0, shape: 'none', f: () => 63, noise: 5, q: 'Can the day of the month you were born help predict height?', zeroOk: false },
  { id: 'shoemath', one: 'student', many: 'students', xName: 'shoe size (US)', yName: 'math score (points)', xWord: 'shoe size', yWord: 'math score', xUnit: '', yUnit: 'points', per: '', lo: 5, hi: 12, xDec: 0, yDec: 0, shape: 'none', f: () => 75, noise: 12, q: 'Can shoe size help predict a math score?', zeroOk: false },
];
/** curved forms (nonlinear) */
export const CURVED: Ctx[] = [
  { id: 'puppy', one: 'puppy', many: 'puppies', xName: 'age (weeks)', yName: 'weight (lb)', xWord: 'age', yWord: 'weight', xUnit: 'weeks', yUnit: 'lb', per: '', lo: 4, hi: 52, xDec: 0, yDec: 0, shape: 'rise', f: x => 62 * (1 - Math.exp(-x / 14)), noise: 2, q: '', zeroOk: false },
  { id: 'pizza', one: 'reading', many: 'readings', xName: 'minutes out of the oven', yName: 'pizza temperature (°F)', xWord: 'time out of the oven', yWord: 'the pizza’s temperature', xUnit: 'min', yUnit: '°F', per: '', lo: 0, hi: 60, xDec: 0, yDec: 0, shape: 'fall', f: x => 75 + 340 * Math.exp(-x / 15), noise: 5, q: '', zeroOk: true },
  { id: 'mpg', one: 'test drive', many: 'test drives', xName: 'speed (mph)', yName: 'gas mileage (mpg)', xWord: 'speed', yWord: 'gas mileage', xUnit: 'mph', yUnit: 'mpg', per: '', lo: 20, hi: 80, xDec: 0, yDec: 0, shape: 'hump', f: x => 32 - 0.012 * (x - 50) ** 2, noise: 0.8, q: '', zeroOk: false },
  { id: 'energy', one: 'day', many: 'days', xName: 'average temperature (°F)', yName: 'energy used (kWh)', xWord: 'the temperature', yWord: 'energy used', xUnit: '°F', yUnit: 'kWh', per: '', lo: 20, hi: 100, xDec: 0, yDec: 0, shape: 'u', f: x => 20 + 0.03 * (x - 62) ** 2, noise: 3, q: '', zeroOk: true },
  { id: 'sunrise', one: 'hour', many: 'hours', xName: 'hours after sunrise', yName: 'air temperature (°F)', xWord: 'hours after sunrise', yWord: 'the temperature', xUnit: 'hours', yUnit: '°F', per: '', lo: 0, hi: 14, xDec: 0, yDec: 0, shape: 'hump', f: x => 58 + 26 * Math.sin((Math.PI * x) / 15), noise: 1.5, q: '', zeroOk: true },
];

/** seeded noise in [-1, 1], roughly bell shaped */
const wob = (R: () => number) => (R() + R() + R() - 1.5) / 1.5;
export interface CloudOpts { n: number; noise?: number; /** allow repeated x-values */ repeatX?: boolean; lo?: number; hi?: number }
/** a seeded cloud from a context: distinct x-values spread over [lo, hi] (unless repeatX), y = trend + noise, rounded */
export function cloud(R: () => number, c: Ctx, o: CloudOpts): P2[] {
  const lo = o.lo ?? c.lo, hi = o.hi ?? c.hi, k = 10 ** c.xDec;
  const f = c.f ?? ((x: number) => (c.m ?? 0) * x + (c.b ?? 0));
  const noise = o.noise ?? c.noise;
  const xs: number[] = [];
  const slots = Math.round((hi - lo) * k);
  // stratified: one x per slice, so the cloud covers the whole range
  for (let i = 0; i < o.n; i++) {
    for (let t = 0; t < 40; t++) {
      const a = lo + ((hi - lo) * i) / o.n, b = lo + ((hi - lo) * (i + 1)) / o.n;
      const x = round(a + R() * (b - a), c.xDec);
      if (x < lo || x > hi) continue;
      if (!o.repeatX && xs.some(v => near(v, x))) { if (slots < o.n) break; continue; }
      xs.push(x); break;
    }
  }
  while (xs.length < o.n) xs.push(round(lo + R() * (hi - lo), c.xDec));
  xs.sort((a, b) => a - b);
  const P = xs.map(x => ({ x, y: round(f(x) + wob(R) * noise, c.yDec) }));
  // cases that share an x-value keep their dots apart (a hidden dot would change the count): at least 4% of the
  // cloud's height between them
  const [ya, yb] = yRange(P), unit = 10 ** -c.yDec, gap = Math.max(unit, Math.ceil((0.04 * (yb - ya)) / unit) * unit);
  for (let i = 0; i < P.length; ) {
    let j = i;
    while (j + 1 < P.length && near(P[j + 1]!.x, P[i]!.x)) j++;
    if (j > i) {
      const G = P.slice(i, j + 1).sort((a, b) => a.y - b.y);
      for (let k = 1; k < G.length; k++) if (G[k]!.y - G[k - 1]!.y < gap - 1e-9) G[k]!.y = round(G[k - 1]!.y + gap, c.yDec);
      P.splice(i, j - i + 1, ...G);
    }
    i = j + 1;
  }
  return P;
}
/** a context's trend as a TLine (linear contexts), drawn over the observed range */
export const trendOf = (c: Ctx, P: readonly P2[]): TLine => { const [a, b] = xRange(P); return { m: c.m ?? 0, b: c.b ?? 0, x0: a, x1: b, col: 'link' }; };

// ---------- the lesson's data set ----------
/** 12 summer days at a smoothie stand: high temperature (°F) and smoothies sold. Two days were 80°F. */
export const SMOOTHIE: readonly P2[] = [
  { x: 68, y: 32 }, { x: 71, y: 46 }, { x: 73, y: 44 }, { x: 75, y: 57 }, { x: 77, y: 54 }, { x: 80, y: 58 },
  { x: 80, y: 72 }, { x: 82, y: 67 }, { x: 85, y: 82 }, { x: 87, y: 79 }, { x: 90, y: 94 }, { x: 94, y: 97 },
];
/** the trend line fitted by eye: through (70, 40) and (90, 90), so slope 50 / 20 = 2.5 and y = 2.5x - 135 */
export const SM_LINE = { m: 2.5, b: -135 } as const;
export const SM_P1 = { x: 70, y: 40 }, SM_P2 = { x: 90, y: 90 };
/** the prediction of part 2 and the turn's input */
export const SM_AT = 80, SM_TURN = 86, SM_FAR = 120;
export const SM_PLOT: PlotSpec = { x0: 65, x1: 95, xStep: 5, y0: 0, y1: 110, yStep: 10, xName: 'high temperature (°F)', yName: 'smoothies sold', pts: SMOOTHIE.map(p => ({ ...p })) };
/** the wide window of "Prove it" (the line extended to 120°F) */
export const SM_WIDE: PlotSpec = { x0: 60, x1: 130, xStep: 10, y0: 0, y1: 180, yStep: 20, xName: 'high temperature (°F)', yName: 'smoothies sold', pts: SMOOTHIE.map(p => ({ ...p })) };

// ---------- clusters ----------
export interface Group { name: string; cx: number; cy: number; sx: number; sy: number }
export interface ClusterCtx { id: string; one: string; many: string; xName: string; yName: string; xWord: string; yWord: string; xUnit: string; yUnit: string; xDec: number; yDec: number; groups: Group[]; /** the overall trend in words */ trend: string }
export const CLUSTERS: ClusterCtx[] = [
  { id: 'geyser', one: 'eruption', many: 'eruptions', xName: 'eruption length (min)', yName: 'wait until the next one (min)', xWord: 'eruption length', yWord: 'wait', xUnit: 'min', yUnit: 'min', xDec: 1, yDec: 0,
    groups: [{ name: 'short eruptions with short waits', cx: 2.0, cy: 55, sx: 0.25, sy: 4 }, { name: 'long eruptions with long waits', cx: 4.3, cy: 81, sx: 0.35, sy: 5 }], trend: 'longer eruptions tend to be followed by longer waits' },
  { id: 'vehicle', one: 'vehicle', many: 'vehicles', xName: 'weight (thousand lb)', yName: 'gas mileage (mpg)', xWord: 'weight', yWord: 'gas mileage', xUnit: 'thousand lb', yUnit: 'mpg', xDec: 1, yDec: 0,
    groups: [{ name: 'light cars with high mileage', cx: 3.1, cy: 32, sx: 0.25, sy: 2.5 }, { name: 'heavy pickups with low mileage', cx: 5.0, cy: 19, sx: 0.35, sy: 2.5 }], trend: 'heavier vehicles tend to get lower gas mileage' },
  { id: 'grades', one: 'student', many: 'students', xName: 'age (years)', yName: 'height (in)', xWord: 'age', yWord: 'height', xUnit: 'years', yUnit: 'in', xDec: 1, yDec: 0,
    groups: [{ name: 'second graders', cx: 7.6, cy: 50, sx: 0.5, sy: 2.5 }, { name: 'eighth graders', cx: 13.6, cy: 63, sx: 0.5, sy: 3 }], trend: 'older students tend to be taller' },
  { id: 'dogs', one: 'dog', many: 'dogs', xName: 'height at the shoulder (in)', yName: 'weight (lb)', xWord: 'height', yWord: 'weight', xUnit: 'in', yUnit: 'lb', xDec: 1, yDec: 0,
    groups: [{ name: 'toy breeds', cx: 9, cy: 9, sx: 1.2, sy: 2 }, { name: 'medium breeds', cx: 18, cy: 40, sx: 1.5, sy: 5 }, { name: 'large breeds', cx: 27, cy: 85, sx: 1.5, sy: 7 }], trend: 'taller dogs tend to weigh more' },
];
export function clusterCloud(R: () => number, c: ClusterCtx, perGroup: number): { pts: P2[]; groups: number[][] } {
  const pts: P2[] = [], groups: number[][] = [];
  const W = Math.max(...c.groups.map(g => g.cx + 2 * g.sx)) - Math.min(...c.groups.map(g => g.cx - 2 * g.sx)), H = Math.max(...c.groups.map(g => g.cy + 2 * g.sy)) - Math.min(...c.groups.map(g => g.cy - 2 * g.sy));
  for (const g of c.groups) {
    const idx: number[] = [];
    for (let i = 0; i < perGroup; i++) {
      let p: P2;
      let t = 0;
      // dots at least 3% of the cloud's width or height apart (no bead hides another)
      do { p = { x: round(g.cx + wob(R) * g.sx * 1.6, c.xDec), y: round(g.cy + wob(R) * g.sy * 1.6, c.yDec) }; t++; } while (t < 200 && pts.some(q => Math.abs(q.x - p.x) < 0.03 * W && Math.abs(q.y - p.y) < 0.04 * H));
      if (pts.some(q => Math.abs(q.x - p.x) < 0.03 * W && Math.abs(q.y - p.y) < 0.04 * H)) continue;   // no room left: one dot fewer
      idx.push(pts.length); pts.push(p);
    }
    groups.push(idx);
  }
  return { pts, groups };
}

// ---------- TeX ----------
/** words for \text{...}: TeX specials escaped, °F written as a degree sign */
export function texWords(s: string): string {
  const esc = (t: string) => t.replace(/[\\{}]/g, '').replace(/([$%#&_])/g, '\\$1').replace(/’/g, "'");
  return s.split('°F').map(p => (p ? `\\text{${esc(p)}}` : '')).join('{}^{\\circ}\\mathrm{F}');
}

// ---------- two-way tables ----------
export interface TwoWay {
  rowVar: string; colVar: string;
  rows: string[]; cols: string[];
  /** cells[r][c] */
  cells: number[][];
}
export const rowTot = (t: TwoWay, r: number) => t.cells[r]!.reduce((s, v) => s + v, 0);
export const colTot = (t: TwoWay, c: number) => t.cells.reduce((s, row) => s + row[c]!, 0);
export const grand = (t: TwoWay) => t.cells.reduce((s, row) => s + row.reduce((a, v) => a + v, 0), 0);
/** the table with margins, as a TableSpec (blank = a cell shown as "?") */
export function twoWaySpec(t: TwoWay, o: { blank?: [number, number]; hideTotals?: boolean } = {}): TableSpec {
  const cell = (r: number, c: number) => (o.blank && o.blank[0] === r && o.blank[1] === c ? '?' : String(t.cells[r]![c]));
  const rows = t.rows.map((rn, r) => [rn, ...t.cols.map((_, c) => cell(r, c)), o.hideTotals ? '' : String(rowTot(t, r))]);
  rows.push(['total', ...t.cols.map((_, c) => (o.hideTotals ? '' : String(colTot(t, c)))), o.hideTotals ? '' : String(grand(t))]);
  return { head: [t.rowVar, ...t.cols, 'total'], rows, rowHead: true, margins: true };
}
export interface Survey { rowVar: string; colVar: string; rows: [string, string]; cols: string[]; who: string; rowQ: string; colQ: string; /** for sentences: 'have a curfew', 'do chores' */ rowYes: string; colYes: string }
export const SURVEYS: Survey[] = [
  { rowVar: 'curfew?', colVar: 'chores?', rows: ['curfew', 'no curfew'], cols: ['chores', 'no chores'], who: 'students', rowQ: 'have a curfew', colQ: 'do chores', rowYes: 'have a curfew', colYes: 'do chores' },
  { rowVar: 'grade', colVar: 'lunch', rows: ['7th grade', '8th grade'], cols: ['brings lunch', 'buys lunch'], who: 'students', rowQ: 'are in 7th grade', colQ: 'bring lunch', rowYes: 'are in 7th grade', colYes: 'bring lunch' },
  { rowVar: 'sport?', colVar: 'breakfast?', rows: ['athletes', 'non-athletes'], cols: ['eats breakfast', 'skips it'], who: 'students', rowQ: 'play a sport', colQ: 'eat breakfast', rowYes: 'play a sport', colYes: 'eat breakfast' },
  { rowVar: 'pet?', colVar: 'sibling?', rows: ['pet owners', 'no pet'], cols: ['has a sibling', 'no sibling'], who: 'students', rowQ: 'have a pet', colQ: 'have a sibling', rowYes: 'have a pet', colYes: 'have a sibling' },
  { rowVar: 'phone?', colVar: 'bedtime', rows: ['phone', 'no phone'], cols: ['before 10 pm', 'after 10 pm'], who: 'teens', rowQ: 'have a phone', colQ: 'go to bed before 10 pm', rowYes: 'have a phone', colYes: 'go to bed before 10 pm' },
];
/**
 * a 2 x 2 table whose row relative frequencies are friendly (whole percents): row totals from {20, 25, 40, 50},
 * `assoc` = the two rows' shares of the first column clearly differ (>= 20 points) or nearly match (<= 5 points).
 */
export function makeTwoWay(R: () => number, s: Survey, assoc: boolean, o: { mislead?: boolean } = {}): TwoWay {
  for (let t = 0; t < 20000; t++) {
    const T = [20, 25, 40, 50];
    const n0 = T[int(R, 0, 3)]!, n1 = T[int(R, 0, 3)]!;
    const p0 = int(R, 2, 18) * 5, p1 = int(R, 2, 18) * 5;
    const a = (p0 * n0) / 100, c = (p1 * n1) / 100;
    if (!Number.isInteger(a) || !Number.isInteger(c) || a < 1 || c < 1 || a >= n0 || c >= n1) continue;
    const gap = Math.abs(p0 - p1);
    if (assoc ? gap < 20 : gap > 5) continue;
    // mislead: the row with the SMALLER share has the bigger raw count (raw counts point the other way)
    if (o.mislead && !((p0 > p1 && a < c) || (p1 > p0 && c < a))) continue;
    if (o.mislead && n0 === n1) continue;
    return { rowVar: s.rowVar, colVar: s.colVar, rows: [...s.rows], cols: [...s.cols], cells: [[a, n0 - a], [c, n1 - c]] };
  }
  // a fixed fallback (never reached in tests)
  return { rowVar: s.rowVar, colVar: s.colVar, rows: [...s.rows], cols: [...s.cols], cells: [[15, 5], [16, 24]] };
}
export const pct = (part: number, whole: number) => round((100 * part) / whole, 1);
