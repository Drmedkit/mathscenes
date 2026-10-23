// items.ts: exercise families for "scatter plots and bivariate data" (secondary-t5-40), generated from realistic,
// seeded contexts (bivariate.ts), checked exactly, and every wrong answer classified against the misconception
// catalogue (math-curriculum-essentials ids) where that is honest. A generator gets the SUB-GOAL it practises
// (plan.ts) and makes that sub-goal's cases. Pure: no DOM, no canvas.
import { type Item, type Response, type Verdict, fracValue, int, pick, same, shuffle } from '../../runtime/item';
import { endOnChoice } from '../../runtime/explain';
import {
  type ClusterCtx, type Ctx, type P2, type PlotSpec, type TableSpec, type TLine, type TwoWay,
  CLUSTERS, CONTEXTS, CURVED, LINEAR, NEGATIVE, NONE, POSITIVE, SURVEYS,
  above, below, cloud, clusterCloud, colTot, corr, fmt, grand, lineY, makeTwoWay, meanGap, near, niceAxis, round, rowTot,
  texWords, twoWaySpec, tx, windowFor, xRange, yRange,
} from './bivariate';

// ---------- pictures ----------
/** what the page animates after a miss (the worked solution on the canvas) */
export type Act =
  | { a: 'line'; i: number } | { a: 'best'; i: number } | { a: 'guide'; x: number; line: number } | { a: 'sticks'; line: number }
  | { a: 'ring'; i: number[]; col?: 'link' | 'wrong' | 'pick' } | { a: 'groups' } | { a: 'band' } | { a: 'ruler' } | { a: 'arrow' }
  | { a: 'mark'; tag: string } | { a: 'unjoin' } | { a: 'plotB' }
  | { a: 'cell'; r: number; c: number } | { a: 'row'; r: number } | { a: 'col'; c: number } | { a: 'reveal'; r: number; c: number; t: string }
  | { a: 'pickPlot'; which: 0 | 1 | 2 };
export interface ShowSpec {
  /** lines visible from the start (default: all) */
  lines?: number[];
  marks?: boolean; join?: boolean; ruler?: boolean; band?: boolean; groups?: boolean; arrow?: boolean;
  rings?: { i: number; col: 'pick' | 'wrong' | 'link' }[];
  guide?: { x: number; line: number };
}
export type Pic =
  | { kind: 'plot'; plot: PlotSpec; show?: ShowSpec; table?: TableSpec; solve: Act[] }
  | { kind: 'two'; a: PlotSpec; b: PlotSpec; solve: Act[] }
  | { kind: 'table'; table: TableSpec; solve: Act[] }
  | { kind: 'slate'; solve: Act[] };
export interface SPItem extends Item { family: FamilyId; picture: { pic: Pic } }
type Gen = (R: () => number, n: number, sg?: string) => SPItem;

// ---------- misconception ids ----------
export const MC = {
  sortsPairs: 'mc.data-displays.sorts-paired-lists-independently',
  yOnly: 'mc.coordinate-geometry.contextual-dot-as-y-value-only',
  dotIdentity: 'mc.data-displays.dot-case-identity',
  unlabeled: 'mc.data-displays.unlabeled-point-reveals-identity',
  dropsSameX: 'mc.data-displays.drops-same-x-cases',
  connects: 'mc.data-displays.connects-unconnectable-data',
  colOrder: 'mc.data-displays.x-variable-by-column-order',
  explCause: 'mc.statistics.explanatory-means-cause',
  equalTicks: 'mc.data-displays.data-values-as-equal-ticks',
  sameScale: 'mc.data-displays.both-axes-same-scale',
  breaksPairs: 'mc.data-displays.breaks-data-pairs',
  onLine: 'mc.statistics.expects-points-on-fitted-line',
  negWeak: 'mc.statistics.negative-r-as-weak',
  swapAxes: 'mc.statistics.swapping-axes-reverses-direction',
  incLinear: 'mc.statistics.increasing-means-linear',
  rAny: 'mc.statistics.r-measures-any-relationship',
  rescale: 'mc.statistics.axis-rescaling-changes-association-strength',
  steep: 'mc.statistics.strength-by-steepness',
  dirAlone: 'mc.statistics.direction-alone-completes-scatter-description',
  deleteOut: 'mc.statistics.always-delete-outliers',
  onlyExtreme: 'mc.statistics.bivariate-outlier-only-extreme-coordinate',
  extremeOut: 'mc.statistics.extreme-value-always-outlier',
  singleCase: 'mc.statistics.single-case-instead-of-distribution',
  noContext: 'mc.statistics.describes-without-context',
  twoCols: 'mc.data-displays.two-columns-implies-scatter-plot',
  firstLast: 'mc.statistics.line-through-first-and-last',
  mostPts: 'mc.statistics.line-through-most-points',
  equalCounts: 'mc.statistics.line-by-equal-counts',
  certain: 'mc.statistics.prediction-as-certain-individual-value',
  nearest: 'mc.statistics.reads-nearest-point-not-line',
  modelAsData: 'mc.statistics.simulation-output-as-data',
  offLine: 'mc.statistics.equation-from-points-off-line',
  axisRange: 'mc.statistics.misidentifies-observed-range',
  unobserved: 'mc.statistics.unobserved-input-as-extrapolation',
  noLimit: 'mc.statistics.extrapolates-without-limit',
  worthless: 'mc.statistics.all-predictions-worthless',
  interpSafe: 'mc.statistics.interpolation-always-trustworthy',
  slopeExact: 'mc.statistics.slope-exact-for-every-individual',
  interceptReal: 'mc.statistics.intercept-always-meaningful',
  cause: 'mc.statistics.correlation-implies-causation',
  twoCells: 'mc.data-displays.one-item-two-cells',
  totalCell: 'mc.data-displays.total-cell-as-joint-cell',
  wholeKept: 'mc.probability.condition-not-made-new-whole',
  oneQty: 'mc.ratio-rate.compares-by-one-quantity',
} as const;

export type FamilyId =
  | 'caseVars' | 'keepPairs' | 'readPoint' | 'countCases' | 'whereDot' | 'joinOrNot' | 'whichOnX' | 'axisPlan' | 'pickScale' | 'readScaleY'
  | 'findTheFlaw' | 'nameDirection' | 'exceptionPair' | 'linearOrCurve' | 'straightEdge' | 'whichStronger' | 'strongMeans' | 'countClusters'
  | 'completeDesc' | 'findOutlier' | 'keepOrDelete' | 'fullDescription' | 'whichDisplay' | 'bestLine' | 'equalCounts' | 'readPrediction'
  | 'estimateMeaning' | 'predictEq' | 'writeEq' | 'classify' | 'observedRange' | 'whyRisky' | 'slopeMeaning' | 'interceptMeaning'
  | 'readCell' | 'grandTotal' | 'relFreq' | 'associated';
export const FAMILIES: readonly { id: FamilyId; name: string }[] = [
  { id: 'caseVars', name: 'Cases and variables' },
  { id: 'keepPairs', name: 'Keep the pairs together' },
  { id: 'readPoint', name: 'What a dot says' },
  { id: 'countCases', name: 'Count the cases' },
  { id: 'whereDot', name: 'Place the dot' },
  { id: 'joinOrNot', name: 'Join the dots?' },
  { id: 'whichOnX', name: 'Which goes on x?' },
  { id: 'axisPlan', name: 'Plan the axes' },
  { id: 'pickScale', name: 'Pick a scale' },
  { id: 'readScaleY', name: 'Read the y scale' },
  { id: 'findTheFlaw', name: 'Find the flaw' },
  { id: 'nameDirection', name: 'Name the direction' },
  { id: 'exceptionPair', name: 'A pair against the trend' },
  { id: 'linearOrCurve', name: 'Straight or curved?' },
  { id: 'straightEdge', name: 'The straight-edge test' },
  { id: 'whichStronger', name: 'Which is stronger?' },
  { id: 'strongMeans', name: 'What strong means' },
  { id: 'countClusters', name: 'Count the clusters' },
  { id: 'completeDesc', name: 'The whole picture' },
  { id: 'findOutlier', name: 'Spot the outlier' },
  { id: 'keepOrDelete', name: 'What to do with an outlier' },
  { id: 'fullDescription', name: 'Describe it in context' },
  { id: 'whichDisplay', name: 'Scatter plot or line graph?' },
  { id: 'bestLine', name: 'The best trend line' },
  { id: 'equalCounts', name: 'Above and below' },
  { id: 'readPrediction', name: 'Predict from the line' },
  { id: 'estimateMeaning', name: 'What a prediction means' },
  { id: 'predictEq', name: 'Predict with the equation' },
  { id: 'writeEq', name: 'Write the equation' },
  { id: 'classify', name: 'Inside or outside?' },
  { id: 'observedRange', name: 'The observed range' },
  { id: 'whyRisky', name: 'Too far out' },
  { id: 'slopeMeaning', name: 'What the slope means' },
  { id: 'interceptMeaning', name: 'What the intercept means' },
  { id: 'readCell', name: 'Read the two-way table' },
  { id: 'grandTotal', name: 'Count each person once' },
  { id: 'relFreq', name: 'Relative frequency' },
  { id: 'associated', name: 'Associated or not?' },
];
export const FAMILY_NAMES: Record<string, string> = Object.fromEntries(FAMILIES.map(f => [f.id, f.name]));

// ---------- helpers ----------
const NAMES = ['Ana', 'Ben', 'Cruz', 'Dev', 'Eli', 'Fay', 'Gus', 'Hana', 'Ivan', 'Jade', 'Kai', 'Lena', 'Max', 'Nia', 'Omar', 'Pia'];
const PEOPLE = new Set(['student', 'child', 'player']);
const cap = (s: string) => s[0]!.toUpperCase() + s.slice(1);
/** a value with its unit, as words */
export function uv(unit: string, v: number): string {
  const s = fmt(v);
  if (unit === '°F') return `${s}°F`;
  if (unit === 'thousand dollars') return `$${s} thousand`;
  if (unit === '%') return `${s}%`;
  if (unit === '') return s;
  return `${s} ${near(Math.abs(v), 1) && unit.endsWith('s') ? unit.slice(0, -1) : unit}`;
}
/** a difference with its unit (percent → percentage points) */
/** the singular and plural word for one unit of x */
export function unitWords(u: string): [string, string] {
  const W: Record<string, [string, string]> = { '°F': ['degree', 'degrees'], in: ['inch', 'inches'], years: ['year', 'years'], hours: ['hour', 'hours'], days: ['day', 'days'], minutes: ['minute', 'minutes'], weeks: ['week', 'weeks'], min: ['minute', 'minutes'], mph: ['mph', 'mph'] };
  return W[u] ?? ['unit', 'units'];
}
const du = (unit: string, v: number) => (unit === '%' ? `${fmt(v)} percentage ${near(v, 1) ? 'point' : 'points'}` : uv(unit, v));
const idOf = (c: { one: string }, names: string[], i: number) => (PEOPLE.has(c.one) ? names[i]! : `${cap(c.one)} ${i + 1}`);
function caseTable(c: Ctx, P: readonly P2[], o: { names?: string[]; order?: number[]; yFirst?: boolean; noId?: boolean; short?: boolean } = {}): TableSpec {
  const order = o.order ?? P.map((_, i) => i);
  const names = o.names ?? NAMES;
  const head = o.noId ? [] : [PEOPLE.has(c.one) ? 'name' : c.one];
  const xh = o.short ? c.xHead ?? c.xName : c.xName, yh = o.short ? c.yHead ?? c.yName : c.yName;
  head.push(...(o.yFirst ? [yh, xh] : [xh, yh]));
  const rows = order.map(i => { const p = P[i]!, r = o.noId ? [] : [idOf(c, names, i)]; r.push(...(o.yFirst ? [fmt(p.y), fmt(p.x)] : [fmt(p.x), fmt(p.y)])); return r; });
  return { head, rows, rowHead: !o.noId };
}
interface Opt { t: string; ok?: boolean; mc?: string; say: string }
type Base = Omit<SPItem, 'input' | 'choices' | 'answer' | 'check'>;
function choiceItem(R: () => number, base: Base, opts: Opt[], keepOrder = false): SPItem {
  const o = keepOrder ? opts.slice() : shuffle(R, opts.slice());
  const i = o.findIndex(x => x.ok);
  return {
    ...base, input: 'choice', choices: o.map(x => x.t), answer: { kind: 'choice', i }, solution: endOnChoice(base.solution, o[i]!.t),
    check: (r: Response) => {
      if (r.kind !== 'choice' || !o[r.i]) return { ok: false, say: 'Pick one of the answers.' };
      const c = o[r.i]!;
      return { ok: !!c.ok, mc: c.mc, say: c.say };
    },
  };
}
const numItem = (base: Omit<SPItem, 'input' | 'answer' | 'check'>, ans: number, tol: number, wrong: (v: number) => Verdict): SPItem => ({
  ...base, input: 'num', answer: { kind: 'num', v: ans },
  check: (r: Response) => (r.kind !== 'num' || !Number.isFinite(r.v) ? { ok: false, say: 'Type a number.' }
    : Math.abs(r.v - ans) <= tol + 1e-9 ? { ok: true, say: `Yes: ${fmt(ans)}.` } : wrong(r.v)),
});
/** a linear cloud whose association is clear (|r| >= rMin) */
function clearCloud(R: () => number, c: Ctx, n: number, rMin = 0.8, noise?: number): P2[] {
  let P = cloud(R, c, { n, noise });
  for (let t = 0; t < 30 && Math.abs(corr(P)) < rMin; t++) P = cloud(R, c, { n, noise });
  return P;
}
const plotOf = (c: { xName: string; yName: string }, P: P2[], o: Parameters<typeof windowFor>[3] = {}) => windowFor(P, c.xName, c.yName, o);
const dirWord = (m: number) => (m > 0 ? 'increase' : 'decrease');
const strengthWord = (r: number) => (Math.abs(r) >= 0.9 ? 'strong' : Math.abs(r) >= 0.7 ? 'moderate' : 'weak');

// ===================== 1. pair-case =====================
const caseVars: Gen = (R, n) => {
  const c = pick(R, LINEAR), k = int(R, 6, 8), P = cloud(R, c, { n: k }), names = shuffle(R, NAMES.slice());
  const table = caseTable(c, P, { names, order: shuffle(R, P.map((_, i) => i)) });
  const their = PEOPLE.has(c.one) ? 'their' : 'its';
  const v = int(R, 0, 2);
  const base = (prompt: string, sol: string[]): Base => ({ id: `caseVars-${n}`, family: 'caseVars', board: '', prompt, solution: sol, picture: { pic: { kind: 'table', table, solve: [{ a: 'row', r: 0 }] } } });
  if (v === 0) return choiceItem(R, base(`This table shows <b class="a">${k} ${c.many}</b>. What is one <b>case</b> here?`,
    [`A case is one ${c.one}: one row of the table.`, `Its two numbers, ${c.xName} and ${c.yName}, belong together.`]), [
    { t: `One ${c.one}: one row, with both of ${their} measurements`, ok: true, say: `Yes. Each row is one ${c.one}, and ${their} two numbers belong together.` },
    { t: `One column: all the ${c.xName} values`, say: `A column holds one variable for every ${c.one}. A case is one ${c.one}: one row.` },
    { t: 'One number in the table', say: `One number is only half a case. A case is one ${c.one}, with both measurements.` },
  ]);
  if (v === 1) return choiceItem(R, base(`This table shows <b class="a">${k} ${c.many}</b>. Which two variables were measured, with their units?`,
    [`The variables are the measured columns: ${c.xName} and ${c.yName}.`, `The first column only names each ${c.one}.`]), [
    { t: `${cap(c.xName)} and ${c.yName}`, ok: true, say: 'Yes: two measurements of every case, each with its unit.' },
    { t: `The ${c.one} labels and ${c.xName}`, say: `The labels only name the ${c.many}. Both measured columns are variables.` },
    { t: `${cap(c.xName)} and the number of ${c.many} (${k})`, say: `${k} counts the cases. The second variable is ${c.yName}.` },
  ]);
  return choiceItem(R, base(`This table shows <b class="a">${k} ${c.many}</b>. Why must the two numbers in each row stay together?`,
    [`Both numbers in a row were measured on the same ${c.one}.`, 'Split them up and you get pairs that never happened.']), [
    { t: `They are two measurements of the same ${c.one}`, ok: true, say: `Yes: a row is one ${c.one}. Its two numbers are one paired observation.` },
    { t: 'They don’t: you may sort each column on its own', mc: MC.sortsPairs, say: `Sorting one column on its own moves numbers to the wrong ${c.one}. Move whole rows.` },
    { t: 'Only so the table is easier to read', say: `It is about meaning, not looks: both numbers belong to the same ${c.one}.` },
  ]);
};
const keepPairs: Gen = (R, n) => {
  for (;;) {
    const c = pick(R, LINEAR), k = int(R, 6, 8), P = cloud(R, c, { n: k }), names = shuffle(R, NAMES.slice());
    const ys = P.map(p => p.y).sort((a, b) => a - b);
    // the asked case is the ONLY one with its x value ("the student with 6 hours" must name one student)
    const cand = P.map((p, i) => i).filter(i => Math.abs(ys[i]! - P[i]!.y) > 1e-6 && P.filter(q => near(q.y, ys[i]!)).length === 1 && P.filter(q => near(q.x, P[i]!.x)).length === 1);
    if (!cand.length) continue;
    const i = pick(R, cand), p = P[i]!, wrongY = ys[i]!;
    const order = shuffle(R, P.map((_, j) => j));
    const table = caseTable(c, P, { names, order });
    const row = order.indexOf(i);
    return numItem({
      id: `keepPairs-${n}`, family: 'keepPairs', board: '', unit: c.yUnit === 'thousand dollars' ? 'thousand $' : c.yUnit,
      prompt: `Mia sorted the <b>${c.xName}</b> column and the <b>${c.yName}</b> column from least to greatest, each on its own. Her new table puts <b class="a">${uv(c.xUnit, p.x)}</b> next to ${uv(c.yUnit, wrongY)}. What is the real ${c.yName} of the ${c.one} with ${uv(c.xUnit, p.x)}?`,
      solution: [`Find the row with ${c.xName} ${fmt(p.x)} in the original table: it is ${idOf(c, names, i)}.`, `The same row gives ${c.yName} <b>${fmt(p.y)}</b>. Sorting each column on its own broke the pairs.`],
      picture: { pic: { kind: 'table', table, solve: [{ a: 'row', r: row }] } },
    }, p.y, 1e-6, v => (near(v, wrongY) ? { ok: false, mc: MC.sortsPairs, say: `That is Mia’s mixed-up pair. Sorting each column on its own moved the numbers to other ${c.many}. Read the original row.` }
      : { ok: false, say: `Find the row with ${c.xName} ${fmt(p.x)}. Its other number is the real one.` }));
  }
};

// ===================== 2. point-as-case =====================
function snapGrid(v: number, step: number, lo: number, hi: number) { return round(Math.min(hi, Math.max(lo, Math.round(v / step) * step)), 4); }
const readPoint: Gen = (R, n) => {
  const c = pick(R, LINEAR), P = clearCloud(R, c, int(R, 10, 13)), spec = plotOf(c, P), names = shuffle(R, NAMES.slice());
  const i0 = int(R, 3, P.length - 4);
  const x = snapGrid(P[i0]!.x, spec.xStep, spec.x0, spec.x1), y = snapGrid(P[i0]!.y, spec.yStep, spec.y0, spec.y1);
  spec.pts = spec.pts.filter((q, j) => j !== i0 && !(Math.abs(q.x - x) < spec.xStep * 0.6 && Math.abs(q.y - y) < spec.yStep * 1.1));
  spec.pts.push({ x, y, tag: 'A' });
  const i = spec.pts.length - 1;
  const solve: Act[] = [{ a: 'ring', i: [i], col: 'link' }];
  const pic: Pic = { kind: 'plot', plot: spec, solve };
  if (R() < 0.5) return {
    id: `readPoint-${n}`, family: 'readPoint', board: '', input: 'pair', pairLead: '(', pairOp: ',', pairTail: ')',
    prompt: `This plot shows ${spec.pts.length} ${c.many}. Dot <b class="a">A</b> is one ${c.one}. What are its two measurements? Give (${c.xName}, ${c.yName}).`,
    solution: [`Down from A to the x-axis: ${c.xName} ${fmt(x)}.`, `Across from A to the y-axis: ${c.yName} ${fmt(y)}.`, `So A is the ${c.one} (${fmt(x)}, ${fmt(y)}).`],
    answer: { kind: 'pair', x, y }, picture: { pic },
    check: r => (r.kind !== 'pair' ? { ok: false, say: 'Fill in both numbers.' }
      : near(r.x, x) && near(r.y, y) ? { ok: true, say: `Yes: one dot, two measurements: (${fmt(x)}, ${fmt(y)}).` }
        : near(r.x, y) && near(r.y, x) ? { ok: false, say: 'Both numbers are right, but swapped. The x-value (across) comes first.' }
          : { ok: false, say: 'Go straight down from A to read x, and straight across to read y.' }),
  };
  const id0 = PEOPLE.has(c.one) ? names[0]! : `${cap(c.one)} 1`;
  return choiceItem(R, { id: `readPoint-${n}`, family: 'readPoint', board: '', prompt: `This plot shows ${spec.pts.length} ${c.many}. What does dot <b class="a">A</b> tell you? (The plot has no names, and no table comes with it.)`,
    solution: [`A dot is one ${c.one} with BOTH measurements: ${c.xName} ${fmt(x)} and ${c.yName} ${fmt(y)}.`, 'Without names or a linked table, you cannot tell who it is.'], picture: { pic } }, [
    { t: `A ${c.one} with ${c.xName} ${fmt(x)} and ${c.yName} ${fmt(y)}`, ok: true, say: 'Yes: one dot carries both of its measurements.' },
    { t: `Only that ${c.yName} was ${fmt(y)}`, mc: MC.yOnly, say: `The dot also tells you its ${c.xName}: straight down, ${fmt(x)}.` },
    { t: `It is ${id0}, the first ${c.one} on the list`, mc: MC.unlabeled, say: 'The plot has no names. A dot shows two measurements, not who it is.' },
  ]);
};
const countCases: Gen = (R, n, sg) => {
  const c = pick(R, LINEAR);
  const v = sg === 'plot-cases' ? int(R, 1, 2) : int(R, 0, 1);
  if (v === 0) {
    const P = clearCloud(R, c, int(R, 9, 14)), spec = plotOf(c, P), j = int(R, 2, P.length - 3);
    spec.pts[j] = { ...spec.pts[j]!, n: 2 };
    const total = P.length + 1;
    return numItem({ id: `countCases-${n}`, family: 'countCases', board: '', unit: c.many,
      prompt: `Each ${c.one} is one case. How many ${c.many} does this plot show?`,
      solution: [`There are ${P.length} dots.`, `One dot is marked ×2: two ${c.many} had exactly the same pair, so they share one spot.`, `${P.length} + 1 = <b>${total}</b> ${c.many}.`],
      picture: { pic: { kind: 'plot', plot: spec, solve: [{ a: 'ring', i: [j], col: 'link' }] } } }, total, 0,
    w => (w === P.length ? { ok: false, mc: MC.dotIdentity, say: `That counts the dots. One dot is marked ×2: two ${c.many} share that spot.` } : { ok: false, say: 'Count the dots, and look for a dot that stands for more than one case.' }));
  }
  // cases that share an x-value
  const P = clearCloud(R, c, int(R, 10, 13)), spec = plotOf(c, P);
  const gx = snapGrid(P[Math.floor(P.length / 2)]!.x, spec.xStep, spec.x0, spec.x1);
  const k = int(R, 2, 3);
  const pickI = spec.pts.map((p, i) => ({ i, d: Math.abs(p.x - gx) })).sort((a, b) => a.d - b.d).filter((o, j) => j < k || o.d < 1e-9).map(o => o.i);
  // their y-values, spread at least 0.8 of a y step apart (so the dots stay separate), kept inside the window
  const gap = spec.yStep * 0.8;
  const ys = pickI.map(i => spec.pts[i]!.y).sort((a, b) => a - b);
  for (let t = 1; t < ys.length; t++) ys[t] = Math.max(ys[t]!, ys[t - 1]! + gap);
  const over = ys[ys.length - 1]! - spec.y1;
  if (over > 0) for (let t = 0; t < ys.length; t++) ys[t] = ys[t]! - over;
  pickI.sort((a, b) => spec.pts[a]!.y - spec.pts[b]!.y).forEach((i, t) => { spec.pts[i] = { x: gx, y: round(ys[t]!, 2) }; });
  if (ys[0]! < spec.y0) return countCases(R, n, sg);
  const sameX = spec.pts.filter(p => near(p.x, gx)).length;
  if (v === 1) return numItem({ id: `countCases-${n}`, family: 'countCases', board: `x = ${tx(gx)}`, unit: c.many,
    prompt: `On this plot of ${spec.pts.length} ${c.many}, how many ${c.many} have ${c.xName} ${fmt(gx)}?`,
    solution: [`Go up the line at ${fmt(gx)}: every dot on it is a ${c.one} with that ${c.xName}.`, `There are <b>${sameX}</b>, each with its own ${c.yName}.`],
    picture: { pic: { kind: 'plot', plot: spec, solve: [{ a: 'ring', i: spec.pts.map((p, i) => i).filter(i => near(spec.pts[i]!.x, gx)), col: 'link' }] } } }, sameX, 0,
  w => (w === 1 ? { ok: false, mc: MC.dropsSameX, say: `Several ${c.many} can share an x-value. Count every dot straight above ${fmt(gx)}.` } : { ok: false, say: `Count the dots straight above ${fmt(gx)} on the x-axis.` }));
  // a table case missing from the plot (it shares its x-value with another case)
  const k2 = int(R, 6, 7), Q = cloud(R, c, { n: k2 }), names = shuffle(R, NAMES.slice());
  const a = int(R, 1, k2 - 2);
  Q[a + 1] = { x: Q[a]!.x, y: round(Q[a]!.y + (R() < 0.5 ? 1 : -1) * Math.max(c.noise * 2, (yRange(Q)[1] - yRange(Q)[0]) * 0.25), c.yDec) };
  const miss = R() < 0.5 ? a : a + 1, keep = miss === a ? a + 1 : a;
  const spec2 = plotOf(c, Q);
  spec2.pts = spec2.pts.filter((_, i) => i !== miss);
  const other = pick(R, Q.map((_, i) => i).filter(i => i !== miss && i !== keep));
  return choiceItem(R, { id: `countCases-${n}`, family: 'countCases', board: '',
    prompt: `Every row of the table should be one dot. Which ${c.one} is missing from the plot?`,
    solution: [`${idOf(c, names, keep)} and ${idOf(c, names, miss)} both have ${c.xName} ${fmt(Q[miss]!.x)}.`, `Only one dot sits above ${fmt(Q[miss]!.x)}: ${idOf(c, names, miss)}, at ${c.yName} ${fmt(Q[miss]!.y)}, was left out.`],
    picture: { pic: { kind: 'plot', plot: spec2, table: caseTable(c, Q, { names, short: true }), solve: [{ a: 'row', r: miss }] } } }, [
    { t: idOf(c, names, miss), ok: true, say: `Yes: ${idOf(c, names, miss)} shares an x-value with ${idOf(c, names, keep)}, and still needs its own dot.` },
    { t: idOf(c, names, other), say: `Check ${idOf(c, names, other)}’s row: its dot is there. Look for two rows with the same ${c.xName}.` },
    { t: 'None: every row is plotted', mc: MC.dropsSameX, say: `Two rows share ${c.xName} ${fmt(Q[miss]!.x)}, but only one dot sits above it. Both cases need a dot.` },
  ]);
};

// ===================== 3. plot-cases / construct-plot =====================
const TAGS = ['A', 'B', 'C', 'D'];
const whereDot: Gen = (R, n, sg) => {
  for (;;) {
    const c = pick(R, LINEAR);
    if (sg === 'construct-plot') {
      const k = int(R, 5, 7), Q = cloud(R, c, { n: k }), spec = plotOf(c, Q);
      const r = int(R, 0, k - 2), p = Q[r]!, q = Q[r + 1]!;
      if (Math.abs(q.y - p.y) < spec.yStep * 1.5 || Math.abs(q.x - p.x) < spec.xStep * 1.2) continue;
      const up = p.y + 2 * spec.yStep <= spec.y1 - spec.yStep * 0.5 && Math.abs(p.y + 2 * spec.yStep - q.y) > spec.yStep;
      const spots = [{ x: p.x, y: p.y, ok: true }, { x: p.x, y: q.y, mc: MC.breaksPairs }, { x: q.x, y: p.y }, { x: p.x, y: p.y + (up ? 2 : -2) * spec.yStep }];
      if (spots.some(s => s.y < spec.y0 + spec.yStep * 0.5 || s.y > spec.y1 - spec.yStep * 0.5 || s.x < spec.x0 + spec.xStep * 0.5 || s.x > spec.x1 - spec.xStep * 0.5)) continue;
      if (spots.some((s, i) => spots.some((t, j) => j < i && Math.abs(s.x - t.x) < spec.xStep && Math.abs(s.y - t.y) < spec.yStep))) continue;
      const tags = shuffle(R, TAGS.slice());
      spec.marks = spots.map((s, i) => ({ x: s.x, y: s.y, tag: tags[i]! }));
      spec.pts = [];
      const right = tags[0]!;
      return choiceItem(R, { id: `whereDot-${n}`, family: 'whereDot', board: '',
        prompt: `Build the plot of these ${k} ${c.many} on a blank grid. Where does the dot for <b>row ${r + 1}</b> go?`,
        solution: [`Row ${r + 1} is one case: ${c.xName} ${fmt(p.x)} and ${c.yName} ${fmt(p.y)}, together.`, `Across to ${fmt(p.x)}, up to ${fmt(p.y)}: spot ${right}.`],
        picture: { pic: { kind: 'plot', plot: spec, show: { marks: true }, table: caseTable(c, Q, { noId: true, short: true }), solve: [{ a: 'row', r }, { a: 'mark', tag: right }] } } },
      spots.map((s, i) => ({ t: tags[i]!, ok: !!s.ok, mc: s.mc, say: s.ok ? `Yes: (${fmt(p.x)}, ${fmt(p.y)}), both numbers from row ${r + 1}.` : s.mc ? `That spot takes its ${c.yName} from row ${r + 2}. Keep both numbers of row ${r + 1} together.` : `Check both numbers of row ${r + 1}: across ${fmt(p.x)}, up ${fmt(p.y)}.` })), true);
    }
    const P = cloud(R, c, { n: 9 }), spec = plotOf(c, P);
    const nx = Math.round((spec.x1 - spec.x0) / spec.xStep), ny = Math.round((spec.y1 - spec.y0) / spec.yStep);
    if (nx < 6 || ny < 5) continue;
    const half = R() < 0.5;
    // the wrong spots are two grid steps away (a misread scale), never on an axis or the plot's edge
    const x = spec.x0 + int(R, 3, nx - 3) * spec.xStep, y = spec.y0 + (int(R, 1, ny - 3) + (half ? 0.5 : 0)) * spec.yStep;
    const spots = [{ x, y, ok: true }, { x, y: y + 2 * spec.yStep }, { x: x + 2 * spec.xStep, y }, { x: x - 2 * spec.xStep, y: y + spec.yStep }];
    if (spots.some(s => s.y > spec.y1 - spec.yStep * 0.4)) continue;
    const tags = shuffle(R, TAGS.slice());
    spec.marks = spots.map((s, i) => ({ x: s.x, y: s.y, tag: tags[i]! }));
    spec.pts = spec.pts.filter(q => spots.every(s => Math.abs(q.x - s.x) > spec.xStep * 0.9 || Math.abs(q.y - s.y) > spec.yStep));
    return choiceItem(R, { id: `whereDot-${n}`, family: 'whereDot', board: `(${tx(x)},\\ ${tx(y)})`,
      prompt: `A new ${c.one}: ${c.xName} <b class="a">${fmt(x)}</b>, ${c.yName} <b class="a">${fmt(y)}</b>. Which spot is its dot?`,
      solution: [`Across the x-axis to ${fmt(x)}.`, `Up the y-axis to ${fmt(y)}${half ? `, halfway between two grid lines` : ''}: spot ${tags[0]}.`],
      picture: { pic: { kind: 'plot', plot: spec, show: { marks: true }, solve: [{ a: 'mark', tag: tags[0]! }] } } },
    spots.map((s, i) => ({ t: tags[i]!, ok: !!s.ok, say: s.ok ? `Yes: across to ${fmt(x)}, up to ${fmt(y)}.` : `Read both axes again: the x-axis counts by ${fmt(spec.xStep)}, the y-axis by ${fmt(spec.yStep)}.` })), true);
  }
};
const joinOrNot: Gen = (R, n) => {
  if (R() < 0.5) {
    const c = pick(R, LINEAR), P = clearCloud(R, c, int(R, 9, 13)), spec = plotOf(c, P);
    return choiceItem(R, { id: `joinOrNot-${n}`, family: 'joinOrNot', board: '',
      prompt: `Sam plotted <b class="a">${P.length} ${c.many}</b> and joined the dots from left to right. Does his line mean anything?`,
      solution: [`Each dot is a different ${c.one}. Nothing changes from one ${c.one} to the next.`, 'A scatter plot shows separate cases: leave the dots unjoined.'],
      picture: { pic: { kind: 'plot', plot: spec, show: { join: true }, solve: [{ a: 'unjoin' }] } } }, [
      { t: `No: each dot is a different ${c.one}, so leave them unjoined`, ok: true, say: 'Yes. Joining dots means one thing changing; these are separate cases.' },
      { t: `Yes: it shows how ${c.yName} changes from dot to dot`, mc: MC.connects, say: `The dots are different ${c.many}. A line between them shows a change that never happened.` },
      { t: 'Yes: dots on a grid should always be joined', say: 'Only values of ONE thing over time (a line graph) are joined.' },
    ]);
  }
  const weeks = int(R, 8, 10), base = int(R, 68, 80);
  const P: P2[] = [];
  let s = base;
  for (let w = 1; w <= weeks; w++) { s = Math.max(55, Math.min(100, s + int(R, -6, 7))); P.push({ x: w, y: s }); }
  const spec: PlotSpec = { ...windowFor(P, 'week', 'quiz score (points)'), x0: 0, x1: weeks + (weeks % 2), xStep: weeks > 8 ? 2 : 1 };
  if (spec.xStep === 1) spec.x1 = weeks;
  const who = pick(R, NAMES);
  return choiceItem(R, { id: `joinOrNot-${n}`, family: 'joinOrNot', board: '',
    prompt: `${who}’s quiz score each week for <b class="a">${weeks} weeks</b>, joined in time order. Should these dots be joined?`,
    solution: [`It is ONE student, one score per week, in time order.`, 'Joining the dots shows how the score changed from week to week: a line graph.'],
    picture: { pic: { kind: 'plot', plot: spec, show: { join: true }, solve: [] } } }, [
    { t: 'Yes: one student over time, so the line shows the change', ok: true, say: 'Yes. One quantity over time is a line graph, and joining shows the change.' },
    { t: 'No: two number columns always make a scatter plot', mc: MC.twoCols, say: 'Two number columns are not enough to decide. One student over time is a line graph.' },
    { t: 'No: dots on a graph should never be joined', say: `Here the dots are the same student, week after week. Joining them is right.` },
  ]);
};

// ===================== 4. axis-roles =====================
const whichOnX: Gen = (R, n) => {
  const c = pick(R, LINEAR), k = int(R, 5, 6), P = cloud(R, c, { n: k }), v = int(R, 0, 2), names = shuffle(R, NAMES.slice());
  if (v === 2 || (v === 1 && c.id === 'smoothie')) {
    const cc = pick(R, LINEAR.filter(q => q.id === 'armspan' || q.id === 'shoe'));
    const Q = cloud(R, cc, { n: k });
    const table = caseTable(cc, Q, { names });
    return choiceItem(R, { id: `whichOnX-${n}`, family: 'whichOnX', board: '',
      prompt: `Question: “Is there a relationship between ${cc.xWord} and ${cc.yWord} for these ${k} ${cc.many}?” Which variable goes on the x-axis?`,
      solution: ['The question names no predictor: it only asks about a relationship.', 'So either orientation is fine. The axes do not say what causes what.'],
      picture: { pic: { kind: 'table', table, solve: [] } } }, [
      { t: 'Either one: the question names no predictor', ok: true, say: 'Yes. With no predictor named, either way round is fine.' },
      { t: `${cap(cc.xName)}: it is the first column`, mc: MC.colOrder, say: 'Column order is just how the table was typed. The question decides, and this one leaves it open.' },
      { t: `${cap(cc.xName)}: it causes the ${cc.yWord}`, mc: MC.explCause, say: 'The x-axis does not mean cause. With no predictor named, either way works.' },
    ]);
  }
  if (v === 0) {
    const table = caseTable(c, P, { names, yFirst: true });
    return choiceItem(R, { id: `whichOnX-${n}`, family: 'whichOnX', board: '',
      prompt: `Question: “${c.q}” Which variable goes on the x-axis?`,
      solution: [`The question uses ${c.xWord} to predict ${c.yWord}: ${c.xWord} is the predictor.`, 'The predictor goes on the x-axis, whatever column it is in. That does not make it a cause.'],
      picture: { pic: { kind: 'table', table, solve: [{ a: 'col', c: 2 }] } } }, [
      { t: `${cap(c.xName)}: the question uses it to predict`, ok: true, say: 'Yes. The predictor named in the question goes on x.' },
      { t: `${cap(c.yName)}: it is the first column`, mc: MC.colOrder, say: 'Column order is just how the table was typed. The question names the predictor.' },
      { t: 'Either one: it never matters', say: 'Here it matters: the question says which variable predicts the other.' },
    ]);
  }
  const table = caseTable(c, P, { names });
  return choiceItem(R, { id: `whichOnX-${n}`, family: 'whichOnX', board: '',
    prompt: `Question: “Can ${c.yWord} help predict ${c.xWord}?” Which variable goes on the x-axis?`,
    solution: [`This question turns it round: ${c.yWord} is the predictor.`, `So ${c.yName} goes on x, even though it is the second column.`],
    picture: { pic: { kind: 'table', table, solve: [{ a: 'col', c: 2 }] } } }, [
    { t: `${cap(c.yName)}: it is the predictor in this question`, ok: true, say: 'Yes. The question picks the predictor, and it goes on x.' },
    { t: `${cap(c.xName)}: it comes first in the table`, mc: MC.colOrder, say: 'Column order does not decide. This question predicts FROM the second variable.' },
    { t: `${cap(c.xName)}: it must be the cause`, mc: MC.explCause, say: 'The axes are about predicting, not causing. This question predicts from the other variable.' },
  ]);
};
const axisPlan: Gen = (R, n) => {
  for (;;) {
    const c = pick(R, LINEAR), P = cloud(R, c, { n: int(R, 6, 8) });
    const [xa, xb] = xRange(P), [ya, yb] = yRange(P), X = niceAxis(xa, xb), Y = niceAxis(ya, yb);
    if (near(X.step, Y.step)) continue;
    const yBySx = (Y.b - Y.a) / X.step;
    const plan = (xn: string, A: { a: number; b: number; step: number }, yn: string, B: { a: number; b: number; step: number }) => `x-axis: ${xn}, ${fmt(A.a)} to ${fmt(A.b)} by ${fmt(A.step)}; y-axis: ${yn}, ${fmt(B.a)} to ${fmt(B.b)} by ${fmt(B.step)}`;
    const opts: Opt[] = [
      { t: plan(c.xName, X, c.yName, Y), ok: true, say: 'Yes: the predictor on x, and each axis its own equal steps that fit its values.' },
      { t: plan(c.yName, Y, c.xName, X), mc: MC.colOrder, say: `That follows the column order. The question predicts ${c.yWord} from ${c.xWord}, so ${c.xName} goes on x.` },
      { t: `x-axis: ${c.xName}, a tick at each value in the table, evenly spaced; y-axis: ${c.yName}, the same`, mc: MC.equalTicks, say: 'Ticks must be equal steps of value. Data values are not evenly spaced.' },
    ];
    if (yBySx > 16 || yBySx < 3) opts.push({ t: plan(c.xName, X, c.yName, { a: Y.a, b: Y.b, step: X.step }), mc: MC.sameScale, say: `The y-axis needs its own step: by ${fmt(X.step)} it would have ${Math.round(yBySx)} steps.` });
    const table = caseTable(c, P, { yFirst: true, noId: true });
    return choiceItem(R, { id: `axisPlan-${n}`, family: 'axisPlan', board: '',
      prompt: `“${c.q}” The ${c.xName} values run from ${fmt(xa)} to ${fmt(xb)}; the ${c.yName} values from ${fmt(ya)} to ${fmt(yb)}. Which plan fits?`,
      solution: [`The question predicts from ${c.xWord}: ${c.xName} goes on x.`, `Each axis gets its own equal steps: x ${fmt(X.a)} to ${fmt(X.b)} by ${fmt(X.step)}, y ${fmt(Y.a)} to ${fmt(Y.b)} by ${fmt(Y.step)}.`],
      picture: { pic: { kind: 'table', table, solve: [{ a: 'col', c: 1 }] } } }, opts);
  }
};

// ===================== 5. axis-scales =====================
const pickScale: Gen = (R, n) => {
  if (R() < 0.6) {
    for (;;) {
      const c = pick(R, CONTEXTS), P = cloud(R, c, { n: int(R, 8, 10) }), [ya, yb] = yRange(P), [xa, xb] = xRange(P);
      const Y = niceAxis(ya, yb), X = niceAxis(xa, xb);
      if (near(X.step, Y.step) || Y.a + 4 * Y.step >= yb) continue;
      const vals = [...new Set(P.map(p => p.y))].sort((a, b) => a - b);
      const four = [vals[0]!, vals[Math.floor(vals.length / 3)]!, vals[Math.floor((2 * vals.length) / 3)]!, vals[vals.length - 1]!];
      if (new Set(four).size < 4) continue;
      const opts: Opt[] = [
        { t: `${fmt(Y.a)} to ${fmt(Y.b)}, every ${fmt(Y.step)}`, ok: true, say: 'Yes: equal steps, and every value fits.' },
        { t: `${four.map(v => fmt(v)).join(', ')}, evenly spaced`, mc: MC.equalTicks, say: 'Those are data values. Their gaps differ, so evenly spaced they make a false scale.' },
        { t: `${fmt(Y.a)} to ${fmt(Y.a + 4 * Y.step)}, every ${fmt(Y.step)}`, say: `That stops at ${fmt(Y.a + 4 * Y.step)}, but the largest value is ${fmt(yb)}.` },
      ];
      if ((Y.b - Y.a) / X.step > 16 || (Y.b - Y.a) / X.step < 3) opts.push({ t: `${fmt(Y.a)} to ${fmt(Y.b)}, every ${fmt(X.step)}, like the x-axis`, mc: MC.sameScale, say: `Each axis gets its own step. Every ${fmt(X.step)} would give ${Math.round((Y.b - Y.a) / X.step)} steps.` });
      return choiceItem(R, { id: `pickScale-${n}`, family: 'pickScale', board: `${vals.map(v => tx(v)).join(',\\ ')}`,
        prompt: `The ${c.yName} values of ${P.length} ${c.many} are on the board. The x-axis counts by ${fmt(X.step)}. Which y-axis scale is equal-interval and fits them all?`,
        solution: [`The values run from ${fmt(ya)} to ${fmt(yb)}.`, `Equal steps of ${fmt(Y.step)} from ${fmt(Y.a)} to ${fmt(Y.b)} cover them all. The y-axis does not have to copy the x-axis.`],
        picture: { pic: { kind: 'slate', solve: [] } } }, opts);
    }
  }
  for (;;) {
    const c = pick(R, LINEAR), P = cloud(R, c, { n: 5 }), xs = P.map(p => p.x);
    const gaps = xs.slice(1).map((x, i) => round(x - xs[i]!, 2));
    if (new Set(gaps).size < 3) continue;
    return choiceItem(R, { id: `pickScale-${n}`, family: 'pickScale', board: `${xs.map(v => tx(v)).join('\\quad ')}`,
      prompt: `Kai drew the ${c.xName} axis with a tick at each value in his table, evenly spaced: ${xs.map(v => fmt(v)).join(', ')}. What is wrong?`,
      solution: [`The gaps between the values are ${gaps.map(g => fmt(g)).join(', ')}.`, 'Drawn the same size, those gaps make a false scale. Use equal steps of value instead.'],
      picture: { pic: { kind: 'slate', solve: [] } } }, [
      { t: `The gaps are ${gaps.map(g => fmt(g)).join(', ')} but drawn the same size: not equal-interval`, ok: true, say: 'Yes. Equal distances must mean equal steps of value.' },
      { t: 'Nothing: each value gets its own tick', mc: MC.equalTicks, say: `Look at the gaps: ${gaps.map(g => fmt(g)).join(', ')}. Equal spacing hides them.` },
      { t: 'An axis must always start at 0', say: 'An axis may start near the data (with a break). The problem is the unequal gaps.' },
    ]);
  }
};
const readScaleY: Gen = (R, n) => {
  for (;;) {
    const c = pick(R, LINEAR), P = clearCloud(R, c, int(R, 9, 12)), spec = plotOf(c, P);
    if (near(spec.xStep, spec.yStep)) continue;
    const ny = Math.round((spec.y1 - spec.y0) / spec.yStep), nx = Math.round((spec.x1 - spec.x0) / spec.xStep);
    if (ny < 3) continue;
    const [dxa, dxb] = xRange(P), xs: number[] = [];
    for (let t = 1; t < nx; t++) { const v = spec.x0 + t * spec.xStep; if (v >= dxa && v <= dxb) xs.push(v); }
    if (!xs.length) continue;
    const j = int(R, 0, ny - 2), y = spec.y0 + (j + 0.5) * spec.yStep, x = pick(R, xs);
    const wrong = spec.y0 + (j + 0.5) * spec.xStep;
    if (Math.abs(wrong - y) <= spec.yStep / 4) continue;
    spec.pts = spec.pts.filter(q => Math.abs(q.x - x) > spec.xStep * 0.6 || Math.abs(q.y - y) > spec.yStep);
    spec.pts.push({ x, y, tag: 'A' });
    const i = spec.pts.length - 1;
    return numItem({ id: `readScaleY-${n}`, family: 'readScaleY', board: '', unit: c.yUnit === 'thousand dollars' ? 'thousand $' : c.yUnit === '°F' ? '°F' : c.yUnit,
      prompt: `The x-axis of this plot of ${spec.pts.length} ${c.many} counts by ${fmt(spec.xStep)}. What is the ${c.yName} of dot <b class="a">A</b>?`,
      solution: [`Across from A to the y-axis: halfway between ${fmt(spec.y0 + j * spec.yStep)} and ${fmt(spec.y0 + (j + 1) * spec.yStep)}.`, `Half of ${fmt(spec.yStep)} is ${fmt(spec.yStep / 2, 3)}, so A is at <b>${fmt(y, 3)}</b>.`],
      picture: { pic: { kind: 'plot', plot: spec, solve: [{ a: 'ring', i: [i], col: 'link' }] } } }, y, spec.yStep / 8,
    v => (Math.abs(v - wrong) <= spec.yStep / 8 ? { ok: false, mc: MC.sameScale, say: `That uses the x-axis step (${fmt(spec.xStep)}). The y-axis has its own step: ${fmt(spec.yStep)}.` }
      : near(v, x) ? { ok: false, say: `${fmt(x)} is A’s x-value. Read across to the y-axis.` } : { ok: false, say: `Read across from A to the y-axis. Each y grid line is ${fmt(spec.yStep)} more.` }));
  }
};
const findTheFlaw: Gen = (R, n) => {
  const c = pick(R, LINEAR), k = int(R, 5, 7), Q = cloud(R, c, { n: k }), kind = pick(R, ['drop', 'shift', 'join'] as const), who = pick(R, NAMES);
  if (kind === 'drop') { const a = int(R, 1, k - 2); Q[a + 1] = { x: Q[a]!.x, y: round(Q[a]!.y + (R() < 0.5 ? 1 : -1) * Math.max(2 * c.noise, (yRange(Q)[1] - yRange(Q)[0]) * 0.3), c.yDec) }; }
  const spec = plotOf(c, Q);
  let dropped = -1;
  if (kind === 'drop') { dropped = Q.findIndex((p, i) => i > 0 && near(p.x, Q[i - 1]!.x)); spec.pts = spec.pts.filter((_, i) => i !== dropped); }
  if (kind === 'shift') spec.pts = Q.map((p, i) => ({ x: p.x, y: Q[(i + 1) % k]!.y }));
  const D = {
    drop: { t: `A row is missing: two rows share a ${c.xName}, and only one got a dot`, mc: MC.dropsSameX },
    shift: { t: `Each dot pairs a ${c.xName} with the NEXT row’s ${c.yName}`, mc: MC.breaksPairs },
    join: { t: 'The dots are joined, as if one thing changed from dot to dot', mc: MC.connects },
  } as const;
  const other = pick(R, (['drop', 'shift', 'join'] as const).filter(f => f !== kind));
  return choiceItem(R, { id: `findTheFlaw-${n}`, family: 'findTheFlaw', board: '',
    prompt: `${who} built this plot from the table of ${k} ${c.many}. What is wrong with it?`,
    solution: kind === 'drop' ? [`Rows ${dropped} and ${dropped + 1} both have ${c.xName} ${fmt(Q[dropped]!.x)}.`, 'Both cases need a dot, one above the other.']
      : kind === 'shift' ? ['Check row 1: its dot should be at its own two numbers.', `Each dot took the ${c.yName} of the next row, so every pair is broken.`]
        : [`Each dot is a different ${c.one}.`, 'Joining them shows a change that never happened. Leave a scatter plot unjoined.'],
    picture: { pic: { kind: 'plot', plot: spec, table: caseTable(c, Q, { noId: true, short: true }), show: { join: kind === 'join' }, solve: kind === 'drop' ? [{ a: 'row', r: dropped }] : kind === 'shift' ? [{ a: 'row', r: 0 }] : [{ a: 'unjoin' }] } } }, [
    { t: D[kind].t, ok: true, say: 'Yes. Every case gets one dot at its own two numbers, and the dots stay unjoined.' },
    { t: D[other].t, say: 'Check the plot again: that is not what happened here.' },
    { t: 'Nothing: the plot matches the table', mc: D[kind].mc, say: 'Check each row against its dot.' },
  ]);
};

// ===================== 7. direction =====================
function dirCloud(R: () => number, kind: 'pos' | 'neg' | 'none'): { c: Ctx; P: P2[] } {
  const c = pick(R, kind === 'pos' ? POSITIVE : kind === 'neg' ? NEGATIVE : NONE);
  let P = cloud(R, c, { n: int(R, 12, 16) });
  for (let t = 0; t < 40; t++) {
    const r = corr(P);
    if (kind === 'none' ? Math.abs(r) < 0.25 : Math.abs(r) > 0.75) break;
    P = cloud(R, c, { n: P.length });
  }
  return { c, P };
}
const nameDirection: Gen = (R, n) => {
  const swap = R() < 0.35, kind = swap ? pick(R, ['pos', 'neg'] as const) : pick(R, ['pos', 'neg', 'none'] as const);
  const { c, P } = dirCloud(R, kind), spec = plotOf(c, P);
  const pos = `Positive: as ${c.xName} increases, ${c.yName} tends to increase`, neg = `Negative: as ${c.xName} increases, ${c.yName} tends to decrease`, none = 'No clear association';
  if (kind !== 'none') spec.lines = [{ m: fitLineM(P), b: fitLineB(P), x0: xRange(P)[0], x1: xRange(P)[1], col: 'pick' }];
  const pic: Pic = kind === 'none' ? { kind: 'plot', plot: spec, solve: [] } : { kind: 'plot', plot: spec, show: { lines: [] }, solve: [{ a: 'line', i: 0 }, { a: 'arrow' }] };
  if (swap) return choiceItem(R, { id: `nameDirection-${n}`, family: 'nameDirection', board: '',
    prompt: `This plot of ${P.length} ${c.many} is ${kind === 'pos' ? 'positive' : 'negative'}. If you swapped the axes (${c.yName} across, ${c.xName} up), what would the direction be?`,
    solution: ['Swapping the axes flips the picture over the diagonal; the pairs stay the same.', `High values still go with ${kind === 'pos' ? 'high' : 'low'} values, so it stays ${kind === 'pos' ? 'positive' : 'negative'}.`], picture: { pic } }, [
    { t: `Still ${kind === 'pos' ? 'positive' : 'negative'}`, ok: true, say: 'Yes. The same pairs go together, whichever way round you draw them.' },
    { t: kind === 'pos' ? 'Negative' : 'Positive', mc: MC.swapAxes, say: `Swapping axes keeps every pair. ${kind === 'pos' ? 'High still goes with high' : 'High still goes with low'}.` },
    { t: none, say: 'Swapping axes does not remove the pattern; the pairs are the same.' },
  ], true);
  return choiceItem(R, { id: `nameDirection-${n}`, family: 'nameDirection', board: '',
    prompt: `Look at the plot of ${P.length} ${c.many}. Which describes the direction?`,
    solution: kind === 'none' ? ['The dots form a shapeless cloud: high and low values go together in every mix.', 'No clear association.']
      : [`Left to right, the cloud tends to go ${kind === 'pos' ? 'up' : 'down'}.`, `So ${kind === 'pos' ? 'positive' : 'negative'}: as ${c.xName} increases, ${c.yName} tends to ${kind === 'pos' ? 'increase' : 'decrease'}.`],
    picture: { pic } }, [
    { t: pos, ok: kind === 'pos', say: kind === 'pos' ? 'Yes: the cloud tends to go up.' : kind === 'neg' ? 'Follow the cloud left to right: it tends to go down.' : 'Is there a tilt at all? The cloud has no clear direction.' },
    { t: neg, ok: kind === 'neg', say: kind === 'neg' ? 'Yes: the cloud tends to go down. A negative association is still an association.' : kind === 'pos' ? 'Follow the cloud left to right: it tends to go up.' : 'Is there a tilt at all? The cloud has no clear direction.' },
    { t: none, ok: kind === 'none', mc: kind === 'neg' ? MC.negWeak : undefined, say: kind === 'none' ? 'Yes: a shapeless cloud, no clear direction.' : kind === 'neg' ? 'Going down IS an association: a negative one.' : 'The cloud clearly tends to go up.' },
  ], true);
};
function fitLineM(P: readonly P2[]) { const n = P.length, mx = P.reduce((s, p) => s + p.x, 0) / n, my = P.reduce((s, p) => s + p.y, 0) / n; return P.reduce((s, p) => s + (p.x - mx) * (p.y - my), 0) / P.reduce((s, p) => s + (p.x - mx) ** 2, 0); }
function fitLineB(P: readonly P2[]) { const n = P.length, mx = P.reduce((s, p) => s + p.x, 0) / n, my = P.reduce((s, p) => s + p.y, 0) / n; return my - fitLineM(P) * mx; }
const exceptionPair: Gen = (R, n) => {
  const c = pick(R, LINEAR), P = clearCloud(R, c, int(R, 11, 14), 0.75), spec = plotOf(c, P), up = (c.m ?? 0) > 0;
  let i = P.findIndex((p, j) => j > 1 && j < P.length - 2 && (up ? P[j + 1]!.y < p.y : P[j + 1]!.y > p.y) && P[j + 1]!.x > p.x);
  if (i < 0) {
    const mids = P.map((_, j) => j).filter(j => j > 1 && j < P.length - 2 && P[j + 1]!.x > P[j]!.x);
    if (!mids.length) return exceptionPair(R, n);
    i = mids[Math.floor(mids.length / 2)]!;
    const d = Math.max(spec.yStep * 0.6, c.noise); spec.pts[i + 1] = { x: P[i + 1]!.x, y: round(P[i]!.y + (up ? -d : d), c.yDec) };
    if (spec.pts[i + 1]!.y < spec.y0 || spec.pts[i + 1]!.y > spec.y1) return exceptionPair(R, n);
  }
  spec.pts[i] = { ...spec.pts[i]!, tag: 'A' }; spec.pts[i + 1] = { ...spec.pts[i + 1]!, tag: 'B' };
  const dir = up ? 'positive' : 'negative';
  return choiceItem(R, { id: `exceptionPair-${n}`, family: 'exceptionPair', board: '',
    prompt: `${P.length} ${c.many}. Dot B has a higher ${c.xName} than dot A, but a ${up ? 'lower' : 'higher'} ${c.yName}. Does that break the ${dir} association?`,
    solution: [`An association is a tendency of the whole cloud: as ${c.xName} increases, ${c.yName} tends to ${up ? 'increase' : 'decrease'}.`, 'Single pairs can go against it. Most of the cloud still does.'],
    picture: { pic: { kind: 'plot', plot: spec, show: { rings: [{ i, col: 'pick' }, { i: i + 1, col: 'pick' }] }, solve: [{ a: 'arrow' }] } } }, [
    { t: 'No: an association is an overall tendency, and single pairs can go against it', ok: true, say: 'Yes. “Tends to” leaves room for exceptions.' },
    { t: 'Yes: every pair has to follow the pattern', mc: MC.onLine, say: 'Real data scatter. An association is about the whole cloud, not every pair.' },
    { t: 'Yes: B must be a mistake, so delete it', mc: MC.deleteOut, say: 'B is an ordinary case that goes against the trend. That is normal; keep it.' },
  ]);
};

// ===================== 8. form =====================
type FormKey = 'line' | 'rise' | 'fall' | 'hump' | 'u' | 'none';
const FORM_TEXT: Record<FormKey, string> = {
  line: 'Linear: the dots follow a straight line',
  rise: 'Nonlinear: a curve that rises more and more slowly',
  fall: 'Nonlinear: a curve that falls more and more slowly',
  hump: 'Nonlinear: it rises, then falls',
  u: 'Nonlinear: it falls, then rises',
  none: 'No association',
};
function curveCloud(R: () => number, c: Ctx, n: number): P2[] { return cloud(R, c, { n }); }
const linearOrCurve: Gen = (R, n) => {
  const useLine = R() < 0.3;
  const c = useLine ? pick(R, LINEAR) : pick(R, CURVED), P = useLine ? clearCloud(R, c, int(R, 12, 16), 0.85) : curveCloud(R, c, int(R, 12, 16));
  const key: FormKey = useLine ? 'line' : (c.shape as FormKey);
  const spec = plotOf(c, P);
  const keys: FormKey[] = key === 'line' ? ['line', (c.m ?? 0) > 0 ? 'rise' : 'fall', 'none'] : key === 'rise' || key === 'fall' ? [key, 'line', key === 'rise' ? 'hump' : 'u'] : [key, 'none', 'line'];
  const say = (k: FormKey): Opt => {
    if (k === key) return { t: FORM_TEXT[k], ok: true, say: key === 'line' ? 'Yes: a straight edge would follow the cloud.' : key === 'hump' || key === 'u' ? 'Yes: it changes direction, and that is still an association.' : 'Yes: it keeps going one way, but it curves.' };
    if (k === 'line') return { t: FORM_TEXT[k], mc: key === 'rise' ? MC.incLinear : undefined, say: 'Lay a straight edge along the cloud: the dots bend away from it.' };
    if (k === 'none') return { t: FORM_TEXT[k], mc: key === 'hump' || key === 'u' ? MC.rAny : key === 'line' && (c.m ?? 0) < 0 ? MC.negWeak : undefined, say: key === 'hump' || key === 'u' ? 'The dots follow a clear curve. Changing direction is still an association.' : 'The dots follow a clear pattern.' };
    return { t: FORM_TEXT[k], say: 'Follow the cloud from left to right and compare.' };
  };
  const sol = key === 'line' ? ['A straight edge laid along the cloud stays close to the dots all the way.', 'The form is linear.']
    : key === 'hump' ? [`${cap(c.yName)} rises, then falls: the form is nonlinear and changes direction.`, 'That is still an association, just not a straight one.']
      : key === 'u' ? [`${cap(c.yName)} falls, then rises: the form is nonlinear and changes direction.`, 'That is still an association, just not a straight one.']
        : ['The cloud keeps going one way, but it bends: steep at first, then flatter.', 'A straight edge would miss the middle: the form is nonlinear.'];
  const ruler = key === 'line' ? { m: fitLineM(P), b: fitLineB(P) } : (() => { const [a, b] = xRange(P), f = c.f!; return { m: (f(b) - f(a)) / (b - a), b: f(a) - ((f(b) - f(a)) / (b - a)) * a }; })();
  spec.ruler = ruler;
  return choiceItem(R, { id: `linearOrCurve-${n}`, family: 'linearOrCurve', board: '',
    prompt: `${P.length} ${c.many}: ${c.xName} and ${c.yName}. What is the form of the association?`, solution: sol,
    picture: { pic: { kind: 'plot', plot: spec, solve: [{ a: 'ruler' }] } } }, keys.map(say));
};
const straightEdge: Gen = (R, n, sg) => {
  const curved = R() < 0.6;
  const c = curved ? pick(R, CURVED.filter(q => q.shape === 'rise' || q.shape === 'fall')) : pick(R, LINEAR);
  const P = curved ? curveCloud(R, c, int(R, 12, 15)) : clearCloud(R, c, int(R, 12, 15), 0.85), spec = plotOf(c, P);
  const [a, b] = xRange(P);
  spec.ruler = curved ? { m: (c.f!(b) - c.f!(a)) / (b - a), b: c.f!(a) - ((c.f!(b) - c.f!(a)) / (b - a)) * a } : { m: fitLineM(P), b: fitLineB(P) };
  const rising = curved ? c.shape === 'rise' : (c.m ?? 0) > 0;
  spec.lines = [{ m: spec.ruler.m, b: spec.ruler.b, x0: a, x1: b, col: 'pick' }];
  const pic: Pic = { kind: 'plot', plot: spec, show: { ruler: true, lines: [] }, solve: [{ a: 'sticks', line: 0 }] };
  if (sg === 'fit-trend-line') return choiceItem(R, { id: `straightEdge-${n}`, family: 'straightEdge', board: '',
    prompt: `${P.length} ${c.many}, with a straight edge laid along the cloud. Is a straight trend line a good model for these dots?`,
    solution: curved ? ['The dots bow away from the straight edge: above it in the middle, below it at the ends (or the other way).', 'They follow a curve, so a straight line is not a good model.'] : ['The dots stay close to the straight edge all the way along.', 'A straight trend line is a reasonable model.'],
    picture: { pic } }, curved ? [
    { t: 'No: the dots curve, so a line misses them in the middle and at the ends', ok: true, say: 'Yes. A straight line only models a straight cloud.' },
    { t: `Yes: the dots ${rising ? 'rise' : 'fall'}, so a line fits`, mc: rising ? MC.incLinear : undefined, say: 'Going one way is not enough: the cloud bends.' },
    { t: 'Yes, as long as as many dots are above it as below', mc: MC.equalCounts, say: 'Equal counts can hide a curve. Here the dots bow away from the line.' },
  ] : [
    { t: 'Yes: the dots follow a straight trend', ok: true, say: 'Yes: they stay close to the straight edge all the way.' },
    { t: 'No: a good line must pass through every dot', mc: MC.onLine, say: 'Real data scatter. A good line follows the trend and stays close.' },
    { t: 'No: a straight line never fits real data', say: 'This cloud is straight: a line follows it well.' },
  ]);
  return choiceItem(R, { id: `straightEdge-${n}`, family: 'straightEdge', board: '',
    prompt: `A straight edge is laid along this cloud of ${P.length} ${c.many}. What does it show about the form?`,
    solution: curved ? ['The dots bow away from the edge: on one side in the middle, on the other side at the ends.', 'So the form is nonlinear (curved).'] : ['The dots stay close along the edge, some above and some below, all the way.', 'So the form is linear.'],
    picture: { pic } }, curved ? [
    { t: 'The dots bow away from it in the middle: the form is nonlinear', ok: true, say: 'Yes. A curve pulls away from a straight edge.' },
    { t: `The dots keep ${rising ? 'rising' : 'falling'}, so the form is linear`, mc: rising ? MC.incLinear : undefined, say: 'Always going one way does not make it straight. Look at the middle.' },
    { t: 'The dots touch the edge at both ends, so it fits', say: 'Look in the middle: the dots are far from the edge there.' },
  ] : [
    { t: 'The dots stay close along it all the way: the form is linear', ok: true, say: 'Yes. Close all the way along means linear.' },
    { t: 'Nonlinear: not every dot touches the edge', mc: MC.onLine, say: 'Dots never sit exactly on a line. Linear means they stay close along it.' },
    { t: 'No association: the dots are scattered', say: 'They scatter, but around a clear straight trend.' },
  ]);
};

// ===================== 9. strength =====================
/**
 * a cloud with the context's middle, slope m * mK and noise = noiseF * (the trend's rise over the range): noiseF 0.9
 * gives r near 0.7 (loose), 0.1 gives r above 0.95 (tight). Values stay at or above 0 (no negative counts or sizes).
 */
function scaledCloud(R: () => number, c: Ctx, n: number, mK: number, noiseF: number, x0: number, x1: number): P2[] {
  const cc: Ctx = { ...c, m: (c.m ?? 0) * mK, b: undefined, f: undefined };
  const xm = (x0 + x1) / 2, ym = (c.m ?? 0) * xm + (c.b ?? 0);
  cc.b = ym - (cc.m ?? 0) * xm;
  const rise = Math.abs((cc.m ?? 0) * (x1 - x0));
  for (;;) { const P = cloud(R, cc, { n, noise: noiseF * rise, lo: x0, hi: x1 }); if (P.every(p => p.y >= 0)) return P; }
}
const whichStronger: Gen = (R, n) => {
  const c = pick(R, LINEAR.filter(q => q.yDec === 0));
  if (R() < 0.6) {
    for (;;) {
      const steep = scaledCloud(R, c, 12, 1, 0.9, c.lo, c.hi), flat = scaledCloud(R, c, 12, 0.35, 0.1, c.lo, c.hi);
      const rS = Math.abs(corr(steep)), rF = Math.abs(corr(flat));
      if (!(rF >= 0.88 && rF - rS >= 0.15)) continue;
      const all = [...steep, ...flat], W = windowFor(all, c.xName, c.yName);
      const steepFirst = R() < 0.5;
      const A = { ...W, pts: (steepFirst ? steep : flat).map(p => ({ ...p })) }, B2 = { ...W, pts: (steepFirst ? flat : steep).map(p => ({ ...p })) };
      const right = steepFirst ? 1 : 0;
      return choiceItem(R, { id: `whichStronger-${n}`, family: 'whichStronger', board: '',
        prompt: `Two groups of ${c.many}, on the same scales. Which plot shows the <b>stronger</b> association between ${c.xName} and ${c.yName}?`,
        solution: ['Strength is how closely the dots follow their pattern, not how steep it is.', `Plot ${right ? 'B' : 'A'}’s dots stay much closer to a line, so it is stronger, even though it is less steep.`],
        picture: { pic: { kind: 'two', a: A, b: B2, solve: [{ a: 'pickPlot', which: right as 0 | 1 }] } } }, [
        { t: 'Plot A', ok: right === 0, mc: right === 1 ? MC.steep : undefined, say: right === 0 ? 'Yes: its dots hug the pattern tightly.' : 'Plot A is steeper, but its dots scatter more. Strength is closeness, not steepness.' },
        { t: 'Plot B', ok: right === 1, mc: right === 0 ? MC.steep : undefined, say: right === 1 ? 'Yes: its dots hug the pattern tightly.' : 'Plot B is steeper, but its dots scatter more. Strength is closeness, not steepness.' },
        { t: 'They are equally strong', say: 'Compare how far the dots spread from each pattern: one is much tighter.' },
      ], true);
    }
  }
  const P = clearCloud(R, c, int(R, 11, 14), 0.75), W = plotOf(c, P);
  const span = W.y1 - W.y0, Y2 = niceAxis(W.y0 >= 0 ? Math.max(0, W.y0 - span) : W.y0 - span, W.y1 + span, 8);
  const stretched = { ...W, y0: Y2.a, y1: Y2.b, yStep: Y2.step };
  const firstTight = R() < 0.5;
  const A = firstTight ? stretched : W, B2 = firstTight ? W : stretched;
  return choiceItem(R, { id: `whichStronger-${n}`, family: 'whichStronger', board: '',
    prompt: `Plot A and Plot B show the <b>same ${P.length} ${c.many}</b>; only the y-axis scale differs. Which shows the stronger association?`,
    solution: ['Same data means the same pairs: the association does not change.', 'A stretched or squeezed axis only changes how the cloud looks.'],
    picture: { pic: { kind: 'two', a: { ...A, pts: P.map(p => ({ ...p })) }, b: { ...B2, pts: P.map(p => ({ ...p })) }, solve: [{ a: 'pickPlot', which: 2 }] } } }, [
    { t: 'Plot A', mc: MC.rescale, say: 'It is the same data. Changing the scale changes the look, not the association.' },
    { t: 'Plot B', mc: MC.rescale, say: 'It is the same data. Changing the scale changes the look, not the association.' },
    { t: 'Equally strong: same data, different scale', ok: true, say: 'Yes. The pairs are the same, so the strength is the same.' },
  ], true);
};
const strongMeans: Gen = (R, n) => {
  const c = pick(R, LINEAR.filter(q => q.yDec === 0)), loose = R() < 0.5, nn = int(R, 11, 15);
  let P: P2[] = [];
  for (;;) {
    P = loose ? scaledCloud(R, c, nn, 1, 1, c.lo, c.hi) : scaledCloud(R, c, nn, 0.4, 0.1, c.lo, c.hi);
    const r = Math.abs(corr(P));
    if (loose ? r < 0.72 && r > 0.35 : r > 0.93) break;
  }
  let spec = plotOf(c, P);
  if (!loose) { const span = spec.y1 - spec.y0, Y2 = niceAxis(spec.y0 - span, spec.y1 + span, 8); spec = { ...spec, y0: Y2.a, y1: Y2.b, yStep: Y2.step }; }
  const [a, b] = xRange(P);
  spec.lines = [{ m: fitLineM(P), b: fitLineB(P), x0: a, x1: b, col: 'link' }];
  return choiceItem(R, { id: `strongMeans-${n}`, family: 'strongMeans', board: '',
    prompt: `${P.length} ${c.many} with a trend line. The line is ${loose ? 'steep' : 'shallow'}. Is the association strong?`,
    solution: ['Strength is how closely the dots follow the trend, not how steep it is.', loose ? 'These dots scatter far from the line: a weak or moderate association.' : 'These dots stay close to the line: a strong association.'],
    picture: { pic: { kind: 'plot', plot: spec, solve: [{ a: 'sticks', line: 0 }] } } }, loose ? [
    { t: 'Not very: the dots scatter far from the line, even though it is steep', ok: true, say: 'Yes. Steep is not strong; close is strong.' },
    { t: 'Yes: the line is steep', mc: MC.steep, say: 'Steepness tells you how fast it changes. Strength is how close the dots stay.' },
    { t: 'No: there is no association at all', say: 'There is a trend; the dots are just loose around it.' },
  ] : [
    { t: 'Yes: the dots stay close to the line, even though it is shallow', ok: true, say: 'Yes. Close to the line means strong, at any steepness.' },
    { t: 'No: the line is too flat to be strong', mc: MC.steep, say: 'A flat line can be strong. Strength is how close the dots stay.' },
    { t: 'No: there is no association at all', say: 'The dots clearly follow a rising or falling line.' },
  ]);
};

// ===================== 10. clusters =====================
const countClusters: Gen = (R, n) => {
  const which = int(R, 0, 4);
  if (which === 4) {
    const c = pick(R, LINEAR), P = clearCloud(R, c, int(R, 12, 15)), spec = plotOf(c, P);
    return numItem({ id: `countClusters-${n}`, family: 'countClusters', board: '', unit: 'clusters',
      prompt: `${P.length} ${c.many}: ${c.xName} and ${c.yName}. How many clusters (separate groups of dots) does the plot show?`,
      solution: ['The dots form one cloud, with no empty gap splitting it into groups.', 'So <b>1</b> cluster.'],
      picture: { pic: { kind: 'plot', plot: spec, solve: [] } } }, 1, 0, () => ({ ok: false, say: 'Look for empty gaps that split the dots into groups. Is there one?' }));
  }
  const c = CLUSTERS[which]!, per = int(R, 5, 7), { pts, groups } = clusterCloud(R, c, per), spec = windowFor(pts, c.xName, c.yName);
  spec.groups = groups;
  return numItem({ id: `countClusters-${n}`, family: 'countClusters', board: '', unit: 'clusters',
    prompt: `${pts.length} ${c.many}: ${c.xName} and ${c.yName}. How many clusters (separate groups of dots) does the plot show?`,
    solution: [`Empty gaps split the dots into ${groups.length} groups: ${c.groups.map(g => g.name).join(', ')}.`, `So <b>${groups.length}</b> clusters.`],
    picture: { pic: { kind: 'plot', plot: spec, solve: [{ a: 'groups' }] } } }, groups.length, 0, () => ({ ok: false, say: 'Look for empty gaps between groups of dots, and count the groups.' }));
};
const completeDesc: Gen = (R, n, sg) => {
  const c = pick(R, CLUSTERS.filter(q => q.groups.length === 2)), per = int(R, 4, 8), { pts, groups } = clusterCloud(R, c, per), spec = windowFor(pts, c.xName, c.yName);
  spec.groups = groups;
  const up = c.groups[1]!.cy > c.groups[0]!.cy, Dir = up ? 'Positive' : 'Negative';
  const opts: Opt[] = [
    { t: `${Dir}: ${c.trend}, and the dots form two clusters: ${c.groups[0]!.name} and ${c.groups[1]!.name}`, ok: true, say: 'Yes: direction in context, plus the clusters.' },
    { t: `${Dir}.`, mc: MC.dirAlone, say: 'True, but not complete: the two clusters are the most important feature.' },
    { t: 'No association: the dots are in two separate groups', say: `The groups line up: ${c.trend}. Name the direction AND the clusters.` },
  ];
  if (sg === 'describe-in-context') { const p = pts[groups[1]![0]!]!; opts.push({ t: `One ${c.one} had ${c.xName} ${fmt(p.x)} and ${c.yName} ${fmt(p.y)}`, mc: MC.singleCase, say: 'That describes one case. Describe the pattern of the whole plot.' }); }
  return choiceItem(R, { id: `completeDesc-${n}`, family: 'completeDesc', board: '',
    prompt: `${pts.length} ${c.many}: ${c.xName} and ${c.yName}. Which description is complete?`,
    solution: [`Direction in context: ${c.trend}.`, `Plus what stands out: two clusters, ${c.groups[0]!.name} and ${c.groups[1]!.name}.`],
    picture: { pic: { kind: 'plot', plot: spec, solve: [{ a: 'groups' }] } } }, opts);
};

// ===================== 11. outliers =====================
function withOutlier(R: () => number): { c: Ctx; spec: PlotSpec; off: number; ext: number; mid: number } {
  for (;;) {
    const c = pick(R, LINEAR.filter(q => q.id !== 'shoe' && q.id !== 'sleep')), P = clearCloud(R, c, int(R, 10, 12), 0.85);
    const [lo, hi] = [c.lo, c.hi], f = (x: number) => (c.m ?? 0) * x + (c.b ?? 0);
    const xo = round(lo + 0.25 * (hi - lo) + R() * 0.1 * (hi - lo), c.xDec), yo = round(f(lo + 0.8 * (hi - lo)), c.yDec);
    const [ya, yb] = yRange(P);
    if (yo <= ya || yo >= yb || Math.abs(yo - f(xo)) < 3.2 * c.noise) continue;
    const xe = round(hi + 0.25 * (hi - lo), c.xDec), ye = round(f(xe) + (R() - 0.5) * c.noise, c.yDec);
    const pts = P.filter(p => Math.abs(p.x - xo) > 1e-6);
    // the middle dot closest to the trend
    const mids = pts.map((p, i) => ({ i, d: Math.abs(p.y - f(p.x)) })).filter(o => o.i > pts.length * 0.4 && o.i < pts.length * 0.75).sort((a, b) => a.d - b.d);
    const mid = mids[0]?.i ?? Math.floor(pts.length / 2);
    pts.push({ x: xo, y: yo }, { x: xe, y: ye });
    const spec = plotOf(c, pts);
    return { c, spec, off: pts.length - 2, ext: pts.length - 1, mid };
  }
}
const findOutlier: Gen = (R, n) => {
  const { c, spec, off, ext, mid } = withOutlier(R);
  const tags = shuffle(R, ['A', 'B', 'C']);
  [off, ext, mid].forEach((i, k) => { spec.pts[i] = { ...spec.pts[i]!, tag: tags[k] }; });
  if (R() < 0.6) return choiceItem(R, { id: `findOutlier-${n}`, family: 'findOutlier', board: '',
    prompt: `${spec.pts.length} ${c.many}. Which dot is a possible outlier?`,
    solution: [`Dot ${tags[0]} sits far from the pattern of the other dots, even though its ${c.xName} and its ${c.yName} are ordinary values.`, `Dot ${tags[1]} is extreme, but it follows the trend: not an outlier.`],
    picture: { pic: { kind: 'plot', plot: spec, solve: [{ a: 'ring', i: [off], col: 'link' }, { a: 'ring', i: [ext], col: 'pick' }] } } }, [
    { t: `Dot ${tags[0]}`, ok: true, say: 'Yes: it is far from the pattern of the others.' },
    { t: `Dot ${tags[1]}`, mc: MC.extremeOut, say: 'It has the largest values, but it sits right on the trend. Extreme is not the same as unusual.' },
    { t: `Dot ${tags[2]}`, say: 'It sits right in the cloud. Look for a dot far from the pattern.' },
  ].sort((a, b) => a.t.localeCompare(b.t)), true);
  return choiceItem(R, { id: `findOutlier-${n}`, family: 'findOutlier', board: '',
    prompt: `Dot ${tags[0]}: its ${c.xName} and its ${c.yName} are both ordinary values. Can it be an outlier?`,
    solution: ['A scatter-plot outlier is judged against the two-variable pattern.', `Dot ${tags[0]} is far from where the trend puts a ${c.one} with its ${c.xName}: a possible outlier.`],
    picture: { pic: { kind: 'plot', plot: spec, show: { rings: [{ i: off, col: 'pick' }] }, solve: [{ a: 'ring', i: [off], col: 'link' }] } } }, [
    { t: 'Yes: it sits far from the pattern of the other dots', ok: true, say: 'Yes. Ordinary on each axis, unusual as a pair.' },
    { t: `No: an outlier needs an extreme ${c.xName} or ${c.yName}`, mc: MC.onlyExtreme, say: 'In a scatter plot, a dot can be unusual as a PAIR, with two ordinary values.' },
    { t: 'No: only the dot with the largest values can be one', mc: MC.extremeOut, say: `The largest dot follows the trend. Dot ${tags[0]} does not.` },
  ]);
};
const keepOrDelete: Gen = (R, n) => {
  const { c, spec, off } = withOutlier(R), typo = R() < 0.5, p = spec.pts[off]!;
  return choiceItem(R, { id: `keepOrDelete-${n}`, family: 'keepOrDelete', board: '',
    prompt: typo ? `${spec.pts.length} ${c.many}. The ringed dot is a possible outlier. The notes say its ${c.yName} (${fmt(p.y)}) may have been typed wrong. What should you do?`
      : `${spec.pts.length} ${c.many}. The ringed dot is a possible outlier. The ${c.one} was checked: the measurements are right. What should you do?`,
    solution: typo ? ['Check the original record first.', 'If it is a typo, fix it. Never delete a dot just because it is unusual.'] : ['It is a real case, just unusual.', 'Keep it, and mention it when you describe the plot.'],
    picture: { pic: { kind: 'plot', plot: spec, show: { rings: [{ i: off, col: 'pick' }] }, solve: [] } } }, typo ? [
    { t: 'Check the original record, and fix it if it is a typo', ok: true, say: 'Yes: a recording error gets fixed, not hidden.' },
    { t: 'Delete it: outliers always get removed', mc: MC.deleteOut, say: 'Outliers are not deleted by rule. Check the record first.' },
    { t: 'Keep it as it is: data can never be checked', say: 'Checking a possible typo is good practice.' },
  ] : [
    { t: 'Keep it and mention it: it is a real case, just unusual', ok: true, say: 'Yes: real data stay in, and you point out what is unusual.' },
    { t: 'Delete it: outliers always get removed', mc: MC.deleteOut, say: 'It is real and belongs to the data. Keep it and mention it.' },
    { t: 'It shows there is no association', say: 'One unusual case does not erase the pattern of all the others.' },
  ]);
};

// ===================== 12. describe-in-context =====================
const fullDescription: Gen = (R, n) => {
  const kind = pick(R, ['line', 'line', 'outlier', 'curve', 'hump', 'none'] as const);
  let c: Ctx, P: P2[], spec: PlotSpec, right: string, rAnyTrap = false;
  if (kind === 'none') {
    ({ c, P } = dirCloud(R, 'none')); spec = plotOf(c, P);
    right = `No clear association: knowing a ${c.one}’s ${c.xName} tells you little about their ${c.yName}`;
  } else if (kind === 'curve' || kind === 'hump') {
    c = pick(R, CURVED.filter(q => (kind === 'hump' ? q.shape === 'hump' || q.shape === 'u' : q.shape === 'rise' || q.shape === 'fall')));
    P = curveCloud(R, c, int(R, 12, 15)); spec = plotOf(c, P);
    right = c.shape === 'hump' ? `As ${c.xName} increases, ${c.yName} rises, then falls: a strong nonlinear association that changes direction`
      : c.shape === 'u' ? `As ${c.xName} increases, ${c.yName} falls, then rises: a strong nonlinear association that changes direction`
        : `As ${c.xName} increases, ${c.yName} ${c.shape === 'rise' ? 'rises' : 'falls'} quickly at first, then levels off: a strong nonlinear association`;
    rAnyTrap = c.shape === 'hump' || c.shape === 'u';
  } else if (kind === 'outlier') {
    const o = withOutlier(R); c = o.c; spec = o.spec; P = spec.pts;
    const r = corr(P.filter((_, i) => i !== o.off));
    right = `As ${c.xName} increases, ${c.yName} tends to ${dirWord(c.m ?? 0)}: a ${strengthWord(r)} linear association, with one possible outlier`;
  } else {
    c = pick(R, LINEAR); P = cloud(R, c, { n: int(R, 12, 15), noise: c.noise * pick(R, [0.6, 1, 1.8]) }); spec = plotOf(c, P);
    right = `As ${c.xName} increases, ${c.yName} tends to ${dirWord(c.m ?? 0)}: a ${strengthWord(corr(P))} linear association`;
  }
  const hi = P.reduce((a, p) => (p.x > a.x ? p : a), P[0]!);
  const opts: Opt[] = [
    { t: right, ok: true, say: 'Yes: direction, form, strength and anything unusual, in context.' },
    { t: kind === 'none' ? 'None, shapeless, scattered.' : `${kind === 'line' || kind === 'outlier' ? ((c.m ?? 0) > 0 ? 'Positive' : 'Negative') : 'Curved'}, ${kind === 'line' || kind === 'outlier' ? 'linear' : 'nonlinear'}, strong.`, mc: MC.noContext, say: `Those are feature words with no context. Name ${c.xName} and ${c.yName}.` },
    { t: `The ${c.one} with the largest ${c.xName} had ${c.yName} ${fmt(hi.y)}`, mc: MC.singleCase, say: 'That is one case. Describe the pattern of the whole cloud.' },
  ];
  if (rAnyTrap) opts.push({ t: 'No association: it goes up and down', mc: MC.rAny, say: 'Up then down (or down then up) is a clear curved pattern: an association that changes direction.' });
  return choiceItem(R, { id: `fullDescription-${n}`, family: 'fullDescription', board: '',
    prompt: `${P.length} ${c.many}: ${c.xName} and ${c.yName}. Which is the best description?`,
    solution: ['A complete description names the variables and gives direction, form and strength, plus anything unusual.', right + '.'],
    picture: { pic: { kind: 'plot', plot: spec, solve: [] } } }, opts);
};

// ===================== 13. scatter-vs-line-graph =====================
interface DS { what: string; scatter: boolean; head: [string, string, string]; rows: () => string[][]; why: string }
function dataSets(R: () => number): DS[] {
  const names = shuffle(R, NAMES.slice()), y0 = int(R, 2010, 2015);
  const ints = (k: number, lo: number, hi: number) => Array.from({ length: k }, () => int(R, lo, hi));
  return [
    { what: `the math grade and the English grade of each of ${int(R, 20, 32)} students`, scatter: true, head: ['student', 'math grade', 'English grade'], rows: () => ints(5, 62, 98).map((g, i) => [names[i]!, String(g), String(Math.min(100, Math.max(55, g + int(R, -12, 10))))]), why: 'separate students, and the question is how the two grades go together' },
    { what: `one student’s quiz grade each week for ${int(R, 8, 14)} weeks`, scatter: false, head: ['', 'week', 'quiz grade'], rows: () => ints(5, 68, 96).map((g, i) => ['', String(i + 1), String(g)]), why: 'one value per week, in time order: joining shows the change' },
    { what: `the daily high temperature in ${pick(R, ['Denver', 'Austin', 'Boston', 'Omaha', 'Tampa'])} for two weeks`, scatter: false, head: ['', 'day', 'high (°F)'], rows: () => ints(5, 61, 84).map((g, i) => ['', `June ${i + 1}`, String(g)]), why: 'one value per day, in time order: joining shows the change' },
    { what: `the height and shoe size of ${int(R, 20, 30)} students (several share a height)`, scatter: true, head: ['student', 'height (in)', 'shoe size'], rows: () => ints(5, 58, 70).map((g, i) => [names[i + 5]!, String(g), String(round(0.4 * g - 17 + (R() - 0.5), 0))]), why: 'separate students, repeated heights, and the question is association' },
    { what: `the price and battery life of ${int(R, 12, 20)} phones`, scatter: true, head: ['phone', 'price ($)', 'battery (hr)'], rows: () => ints(5, 2, 9).map((g, i) => [`Phone ${i + 1}`, String(g * 100 - 1), String(int(R, 18, 30))]), why: 'separate phones, and the question is how price and battery life go together' },
    { what: `a town’s population each year from ${y0} to 2025`, scatter: false, head: ['', 'year', 'population'], rows: () => { let p = int(R, 120, 140) * 100; return [0, 1, 2, 3, 4].map(i => { p += int(R, 2, 9) * 50; return ['', String(y0 + i), p.toLocaleString('en-US')]; }); }, why: 'one value per year, in time order: joining shows the change' },
  ];
}
const whichDisplay: Gen = (R, n) => {
  const ds = pick(R, dataSets(R)), rows = ds.rows();
  const noId = rows.every(r => r[0] === '');
  const table: TableSpec = noId ? { head: ds.head.slice(1), rows: rows.map(r => r.slice(1)) } : { head: ds.head.slice(), rows, rowHead: true };
  const k = int(R, 0, 999);
  return choiceItem(R, { id: `whichDisplay-${n}-${k}`, family: 'whichDisplay', board: '',
    prompt: `Data set: ${ds.what} (first rows shown). Which display fits, and why?`,
    solution: [ds.scatter ? 'Separate cases, and the question is about how two variables go together: a scatter plot, never joined.' : 'One thing measured over time, one value per time: a line graph, joined in order.', `Here: ${ds.why}.`],
    picture: { pic: { kind: 'table', table, solve: [] } } }, ds.scatter ? [
    { t: `Scatter plot: ${ds.why}`, ok: true, say: 'Yes: separate cases, so separate dots.' },
    { t: 'Line graph: join the cases from left to right to show the change', mc: MC.connects, say: 'These are different cases. Joining them shows a change that never happened.' },
    { t: 'Either one: two number columns fit both displays', say: 'The cases decide: separate cases go on a scatter plot.' },
  ] : [
    { t: `Line graph: ${ds.why}`, ok: true, say: 'Yes: one thing over time is a line graph.' },
    { t: 'Scatter plot: it has two number columns', mc: MC.twoCols, say: 'Two number columns are not enough. One thing over time is a line graph.' },
    { t: 'Either one: two number columns fit both displays', say: 'Time order matters here: a line graph shows the change.' },
  ]);
};

// ===================== 14. fit-trend-line =====================
const bestLine: Gen = (R, n) => {
  for (;;) {
    const c = pick(R, LINEAR.filter(q => q.yDec === 0)), P = cloud(R, c, { n: int(R, 11, 14) }).map(p => ({ ...p }));
    const f = (x: number) => (c.m ?? 0) * x + (c.b ?? 0), [lo, hi] = xRange(P), d = 0.18 * Math.abs((c.m ?? 0) * (hi - lo)), sg = R() < 0.5 ? 1 : -1, N = P.length;
    // the first and last dots sit on opposite sides of the trend, so the line through them is visibly tilted wrong
    P[0] = { x: P[0]!.x, y: round(f(P[0]!.x) + sg * d, c.yDec) };
    P[N - 1] = { x: P[N - 1]!.x, y: round(f(P[N - 1]!.x) - sg * d, c.yDec) };
    const fl: TLine = { m: (P[N - 1]!.y - P[0]!.y) / (P[N - 1]!.x - P[0]!.x), b: 0 };
    fl.b = P[0]!.y - fl.m * P[0]!.x;
    // a line through three dots that tilts the other way: a low dot on the left, a high dot on the right, one between
    const q1 = Math.max(2, Math.floor(N / 3)), iL = int(R, 1, q1 - 1), iR = int(R, N - q1, N - 2), im = Math.floor((iL + iR) / 2);
    if (im <= iL || im >= iR) continue;
    P[iL] = { x: P[iL]!.x, y: round(f(P[iL]!.x) - sg * 0.8 * d, c.yDec) };
    P[iR] = { x: P[iR]!.x, y: round(f(P[iR]!.x) + sg * 0.8 * d, c.yDec) };
    const mw = (P[iR]!.y - P[iL]!.y) / (P[iR]!.x - P[iL]!.x), most: TLine = { m: mw, b: P[iL]!.y - mw * P[iL]!.x };
    // the third dot sits exactly on that line (it is not labelled, so its value need not be whole)
    P[im] = { x: P[im]!.x, y: round(lineY(most, P[im]!.x), 2) };
    const [ya, yb] = yRange(P), [xa, xb] = xRange(P);
    if (P.some((q, j) => P.some((r, k) => k < j && Math.abs(q.x - r.x) < 0.02 * (xb - xa) && Math.abs(q.y - r.y) < 0.04 * (yb - ya)))) continue;
    const good2: TLine = { m: fitLineM(P), b: fitLineB(P) };
    const gG = meanGap(P, good2), gF = meanGap(P, fl), gM = meanGap(P, most);
    if (gF < 1.35 * gG || gM < 1.35 * gG) continue;
    const spec = plotOf(c, P), [a, b] = xRange(P), span = spec.y1 - spec.y0;
    if ([fl, most].some(L => [a, b].some(x => lineY(L, x) < spec.y0 + span * 0.02 || lineY(L, x) > spec.y1 - span * 0.02))) continue;
    // the three lines are clearly apart at both ends (their letters sit at the right end)
    const L3 = [good2, fl, most], far = (x: number) => L3.every((L, u) => L3.every((M, v) => v <= u || Math.abs(lineY(L, x) - lineY(M, x)) > 0.09 * span));
    if (!far(b) || !far(a)) continue;
    const tags = shuffle(R, ['A', 'B', 'C']), cols = ['second', 'pick', 'water'] as const;
    const kinds = [good2, fl, most];
    spec.lines = kinds.map((L, i) => ({ m: L.m, b: L.b, x0: a, x1: b, tag: tags[i], col: cols[['A', 'B', 'C'].indexOf(tags[i]!)] }));
    return choiceItem(R, { id: `bestLine-${n}`, family: 'bestLine', board: '',
      prompt: `Three trend lines for ${P.length} ${c.many}. Which is the best fit?`,
      solution: [`Line ${tags[0]} follows the overall trend and stays close to the dots across the whole range.`, `Line ${tags[1]} only joins the first and last dots; line ${tags[2]} hits three dots but misses the rest.`],
      picture: { pic: { kind: 'plot', plot: spec, solve: [{ a: 'best', i: 0 }, { a: 'sticks', line: 0 }] } } }, [
      { t: `Line ${tags[0]}`, ok: true, say: 'Yes: close to the dots all along the range.' },
      { t: `Line ${tags[1]}`, mc: MC.firstLast, say: 'It joins the first and last dots and ignores the rest. A trend line follows all of them.' },
      { t: `Line ${tags[2]}`, mc: MC.mostPts, say: 'It passes through three dots, but misses the trend of the others.' },
    ].sort((x, y) => x.t.localeCompare(y.t)), true);
  }
};
const equalCounts: Gen = (R, n) => {
  for (;;) {
    const c = pick(R, LINEAR.filter(q => q.yDec === 0)), P = clearCloud(R, c, 2 * int(R, 5, 7), 0.85);
    const good: TLine = { m: fitLineM(P), b: fitLineB(P) };
    const [a, b] = xRange(P), spec = plotOf(c, P);
    if (R() < 0.6) {
      // a line tilted wrong, with exactly half the dots above it
      const s = good.m * pick(R, [0.15, 0.25, 1.9]);
      const vals = P.map(p => p.y - s * p.x).sort((u, v) => u - v), h = P.length / 2;
      if (near(vals[h - 1]!, vals[h]!)) continue;
      const L: TLine = { m: s, b: (vals[h - 1]! + vals[h]!) / 2, x0: a, x1: b, col: 'pick' };
      if (above(P, L) !== h || below(P, L) !== h || meanGap(P, L) < 1.4 * meanGap(P, good)) continue;
      spec.lines = [L, { ...good, x0: a, x1: b, col: 'link' }];
      return choiceItem(R, { id: `equalCounts-${n}`, family: 'equalCounts', board: '',
        prompt: `${P.length} ${c.many}. Kim says her line fits because ${h} dots are above it and ${h} are below. Is she right?`,
        solution: ['Look where the dots above and below are: they bunch on opposite ends.', 'The line is tilted wrong. Equal counts are a quick check, never the whole test.'],
        picture: { pic: { kind: 'plot', plot: spec, show: { lines: [0] }, solve: [{ a: 'sticks', line: 0 }, { a: 'line', i: 1 }] } } }, [
        { t: 'No: the dots above sit at one end and the dots below at the other, so it is tilted wrong', ok: true, say: 'Yes. A good line stays close to the dots across the whole range.' },
        { t: 'Yes: equal counts above and below means a good fit', mc: MC.equalCounts, say: 'Equal counts can hide a tilted line. Check how close the dots are all along.' },
        { t: 'Yes: it goes through the middle of the plot', say: 'Through the middle is not enough: it has the wrong tilt.' },
      ]);
    }
    const L: TLine = { ...good, x0: a, x1: b, col: 'link' };
    const up = above(P, L), dn = below(P, L);
    if (up === dn || Math.abs(up - dn) > 3) continue;
    spec.lines = [L];
    return choiceItem(R, { id: `equalCounts-${n}`, family: 'equalCounts', board: '',
      prompt: `${P.length} ${c.many}. Rae’s line has ${up} dots above it and ${dn} below. Does that make it a bad fit?`,
      solution: ['The line follows the trend and stays close to the dots across the whole range.', 'Counts above and below do not have to match exactly.'],
      picture: { pic: { kind: 'plot', plot: spec, solve: [{ a: 'sticks', line: 0 }] } } }, [
      { t: 'No: it follows the trend and stays close to the dots all along', ok: true, say: 'Yes. Closeness across the whole range matters; counts are only a quick check.' },
      { t: 'Yes: a good line needs exactly as many dots above as below', mc: MC.equalCounts, say: 'Counts are a rough check. This line is close to the dots everywhere.' },
      { t: 'Yes: a good line goes through more of the dots', mc: MC.mostPts, say: 'Hitting dots is not the goal. Staying close to all of them is.' },
    ]);
  }
};

// ===================== 15. prediction-from-line =====================
/** a trend line through two grid points of the window, near the context trend, and a grid x where it reads cleanly */
function latticeLine(R: () => number, c: Ctx, spec: PlotSpec, P: readonly P2[]): { L: TLine; xq: number; yq: number } | null {
  const [lo, hi] = xRange(P), f = (x: number) => (c.m ?? 0) * x + (c.b ?? 0);
  const xs: number[] = [];
  for (let x = spec.x0; x <= spec.x1 + 1e-9; x += spec.xStep) if (x >= lo - 1e-9 && x <= hi + 1e-9) xs.push(round(x, 4));
  if (xs.length < 3) return null;
  const ya = (x: number) => round(Math.round(f(x) / spec.yStep) * spec.yStep, 4);
  const xa = xs[0]!, xb = xs[xs.length - 1]!, A = ya(xa), Bv = ya(xb);
  const m = (Bv - A) / (xb - xa), b = A - m * xa;
  const inner = xs.slice(1, -1).filter(x => { const y = m * x + b, k = (y - spec.y0) / (spec.yStep / 2); return Math.abs(k - Math.round(k)) < 1e-6; });
  if (!inner.length) return null;
  const xq = pick(R, inner);
  return { L: { m, b, x0: lo, x1: hi, col: 'link' }, xq, yq: round(m * xq + b, 4) };
}
const readPrediction: Gen = (R, n) => {
  for (;;) {
    const c = pick(R, LINEAR), P = clearCloud(R, c, int(R, 10, 13), 0.85), spec = plotOf(c, P);
    const ll = latticeLine(R, c, spec, P);
    if (!ll) continue;
    const { L, xq, yq } = ll, tol = spec.yStep / 4;
    // the dot nearest to xq, nudged so reading it instead of the line is a clear slip
    spec.pts = spec.pts.filter(p => !near(p.x, xq));
    const j = spec.pts.reduce((bi, p, i) => (Math.abs(p.x - xq) < Math.abs(spec.pts[bi]!.x - xq) ? i : bi), 0);
    const np = spec.pts[j]!;
    if (Math.abs(np.y - yq) <= tol + spec.yStep * 0.25) spec.pts[j] = { x: np.x, y: round(np.y + (np.y >= yq ? 1 : -1) * spec.yStep * 0.6, c.yDec) };
    const ny = spec.pts[j]!.y;
    if (!(ny >= spec.y0 && ny <= spec.y1) || Math.abs(ny - yq) <= tol) continue;
    spec.lines = [L];
    return numItem({ id: `readPrediction-${n}`, family: 'readPrediction', board: `x = ${tx(xq)}`, unit: c.yUnit === 'thousand dollars' ? 'thousand $' : c.yUnit,
      prompt: `No ${c.one} was observed at exactly ${c.xName} ${fmt(xq)}. Use the trend line to predict the ${c.yName} there.`,
      solution: [`Go up from ${fmt(xq)} on the x-axis to the LINE.`, `Then across to the y-axis: about <b>${fmt(yq)}</b>. That is an estimate, not a measured case.`],
      picture: { pic: { kind: 'plot', plot: spec, solve: [{ a: 'guide', x: xq, line: 0 }] } } }, yq, tol,
    v => (Math.abs(v - ny) <= tol ? { ok: false, mc: MC.nearest, say: 'That is the nearest dot. A prediction is read from the line.' }
      : { ok: false, say: `Go straight up from ${fmt(xq)} until you hit the line, then across to the y-axis.` }));
  }
};
const estimateMeaning: Gen = (R, n, sg) => {
  for (;;) {
    const c = pick(R, LINEAR), P = clearCloud(R, c, int(R, 10, 13), 0.8), spec = plotOf(c, P), ll = latticeLine(R, c, spec, P);
    if (!ll) continue;
    spec.lines = [ll.L];
    const at = `${uv(c.xUnit, ll.xq)}`, val = uv(c.yUnit, ll.yq);
    const pic: Pic = { kind: 'plot', plot: spec, show: { guide: { x: ll.xq, line: 0 } }, solve: [{ a: 'sticks', line: 0 }] };
    if (sg === 'extrap-unjustified') return choiceItem(R, { id: `estimateMeaning-${n}`, family: 'estimateMeaning', board: `x = ${tx(ll.xq)}`,
      prompt: `${c.xName} ${fmt(ll.xq)} is inside the observed range, and the line predicts ${val}. Is that prediction sure to be close for a new ${c.one}?`,
      solution: ['Inside the range the line is a fair estimate, but real cases scatter around it.', `It also assumes the new ${c.one} is like the ${c.many} that were observed.`],
      picture: { pic } }, [
      { t: `No: real ${c.many} scatter around the line, and the new one must be like those observed`, ok: true, say: 'Yes: a fair estimate, not a guarantee.' },
      { t: 'Yes: inside the data range a prediction is always accurate', mc: MC.interpSafe, say: 'Look how the dots scatter around the line: a new case can too.' },
      { t: 'No: no prediction is worth anything', mc: MC.worthless, say: 'Inside the range the line is a useful estimate; it is just not exact.' },
    ]);
    return choiceItem(R, { id: `estimateMeaning-${n}`, family: 'estimateMeaning', board: `x = ${tx(ll.xq)}`,
      prompt: `The trend line predicts ${val} for a ${c.one} with ${c.xName} ${fmt(ll.xq)}. What does that mean?`,
      solution: [`It is the model’s estimate for a typical ${c.one} at ${at}.`, 'Real cases scatter above and below the line; none was measured there.'],
      picture: { pic } }, [
      { t: `A typical ${c.one} at that ${c.xName} would be about ${val}; a real one may differ`, ok: true, say: 'Yes: an estimate from the trend, not a guarantee.' },
      { t: `Every ${c.one} with that ${c.xName} has exactly ${val}`, mc: MC.certain, say: 'Look at the dots: cases with the same x scatter above and below the line.' },
      { t: `A ${c.one} with that ${c.xName} was measured at ${val}`, mc: MC.modelAsData, say: 'Nobody was measured there. The value comes from the line, a model.' },
    ]);
  }
};

// ===================== 16. trend-equation =====================
/** a nice equation (m in halves, b whole) close to the context trend, and the window it lives in */
function niceEq(R: () => number, c: Ctx): { m: number; b: number } {
  const m0 = c.m ?? 1, m = Math.abs(m0) >= 1 ? Math.round(m0 * 2) / 2 : Math.round(m0 * 20) / 20;
  const xm = (c.lo + c.hi) / 2, b = Math.round((c.m ?? 0) * xm + (c.b ?? 0) - m * xm);
  void R;
  return { m: m || m0, b };
}
const eqTex = (m: number, b: number) => `y = ${near(m, 1) ? '' : near(m, -1) ? '-' : tx(m, 3)}x${near(b, 0) ? '' : ` ${b < 0 ? '-' : '+'} ${fmt(Math.abs(b))}`}`;
const eqHtml = (m: number, b: number) => `<i>y</i> = ${near(m, 1) ? '' : near(m, -1) ? '−' : fmt(m, 3)}<i>x</i>${near(b, 0) ? '' : ` ${b < 0 ? '−' : '+'} ${fmt(Math.abs(b))}`}`;
const predictEq: Gen = (R, n) => {
  const c = pick(R, LINEAR), { m, b } = niceEq(R, c), P = clearCloud(R, { ...c, m, b }, int(R, 10, 13), 0.8), spec = plotOf(c, P);
  const [lo, hi] = xRange(P);
  let xq = round(lo + (0.2 + 0.6 * R()) * (hi - lo), 0);
  if (P.some(p => near(p.x, xq))) xq = round(xq + 1, 0);
  if (xq >= hi) xq = round((lo + hi) / 2, 0);
  const ans = round(m * xq + b, 3);
  spec.lines = [{ m, b, x0: lo, x1: hi, col: 'link' }];
  const nearest = P.reduce((a, p) => (Math.abs(p.x - xq) < Math.abs(a.x - xq) ? p : a), P[0]!);
  return numItem({ id: `predictEq-${n}`, family: 'predictEq', board: eqTex(m, b), unit: c.yUnit === 'thousand dollars' ? 'thousand $' : c.yUnit,
    prompt: `The trend line is ${eqHtml(m, b)}, with <i>x</i> = ${c.xName} and <i>y</i> = ${c.yName}. Use the equation to predict <i>y</i> for <i>x</i> = ${fmt(xq)}.`,
    solution: [`Put ${fmt(xq)} in for <i>x</i>: ${fmt(m)} × ${fmt(xq)} ${b < 0 ? '−' : '+'} ${fmt(Math.abs(b))}.`, `${fmt(round(m * xq, 3))} ${b < 0 ? '−' : '+'} ${fmt(Math.abs(b))} = <b>${fmt(ans)}</b>, a predicted value.`],
    picture: { pic: { kind: 'plot', plot: spec, solve: [{ a: 'guide', x: xq, line: 0 }] } } }, ans, 0.01,
  v => (near(v, round(m * xq, 3), 0.01) ? { ok: false, say: `You multiplied. Now ${b < 0 ? 'subtract' : 'add'} ${fmt(Math.abs(b))}.` }
    : near(v, nearest.y, 0.01) ? { ok: false, mc: MC.nearest, say: 'That is the nearest dot. Use the equation of the line.' }
      : { ok: false, say: `Multiply ${fmt(m)} by ${fmt(xq)} first, then ${b < 0 ? 'subtract' : 'add'} ${fmt(Math.abs(b))}.` }));
};
const writeEq: Gen = (R, n) => {
  for (;;) {
    const c = pick(R, LINEAR.filter(q => q.yDec === 0 && q.xDec === 0)), { m, b } = niceEq(R, c);
    if (!Number.isInteger(m * 2)) continue;
    const P = clearCloud(R, { ...c, m, b }, int(R, 9, 14), 0.8), spec = plotOf(c, P);
    const xs: number[] = [];
    for (let x = spec.x0; x <= spec.x1 + 1e-9; x += spec.xStep) { const y = m * x + b; if (x > spec.x0 + 1e-9 && x < spec.x1 - 1e-9 && Number.isInteger(round(y, 6)) && y > spec.y0 + 1e-9 && y < spec.y1 - 1e-9 && Math.abs((y - spec.y0) / spec.yStep - Math.round((y - spec.y0) / spec.yStep)) < 1e-6) xs.push(round(x, 6)); }
    if (xs.length < 2) continue;
    const xp = xs[0]!, xq = xs[xs.length - 1]!;
    if (xq - xp < (spec.x1 - spec.x0) / 3) continue;
    // two data dots off the line, far apart
    // two data dots off the line, in the middle of the cloud and away from P and Q
    const awayPQ = (p: P2) => [xp, xq].every(x => Math.abs(p.x - x) > spec.xStep * 0.6);
    const off = P.map((p, i) => ({ i, d: Math.abs(p.y - (m * p.x + b)) })).filter(o => o.d > spec.yStep * 0.3 && o.i > 0 && o.i < P.length - 1 && awayPQ(P[o.i]!));
    if (off.length < 2) continue;
    const ia = off[0]!.i, ib = off[off.length - 1]!.i, A = P[ia]!, Bp = P[ib]!;
    if (Math.abs(Bp.x - A.x) < (spec.x1 - spec.x0) / 4) continue;
    if (near(A.x, Bp.x)) continue;
    const mA = (Bp.y - A.y) / (Bp.x - A.x), bA = A.y - mA * A.x;
    if (near(mA, m, 0.05) && near(bA, b, 0.5)) continue;
    spec.lines = [{ m, b, x0: xRange(P)[0], x1: xRange(P)[1], col: 'link' }];
    spec.marks = [{ x: xp, y: m * xp + b, tag: 'P' }, { x: xq, y: m * xq + b, tag: 'Q' }];
    spec.pts = P.map((p, i) => (i === ia ? { ...p, tag: 'A' } : i === ib ? { ...p, tag: 'B' } : { ...p }));
    const rise = m * (xq - xp), run = xq - xp;
    return {
      id: `writeEq-${n}`, family: 'writeEq', board: 'y = \\square\\, x + \\square', input: 'pair', pairLead: '<i>y</i> =', pairOp: '<i>x</i> +', pairTail: '',
      prompt: `${P.length} ${c.many}, observed from ${fmt(xRange(P)[0])} to ${fmt(xRange(P)[1])} (${c.xName}), and a trend line. Write its equation. P and Q sit on the line; dots A and B are ${c.many}.`,
      solution: [`Use P (${fmt(xp)}, ${fmt(m * xp + b)}) and Q (${fmt(xq)}, ${fmt(m * xq + b)}), which are ON the line.`, `Slope = ${fmt(rise)} ÷ ${fmt(run)} = <b>${fmt(m)}</b>.`, `${fmt(m * xp + b)} = ${fmt(m)} × ${fmt(xp)} + <i>b</i>, so <i>b</i> = <b>${fmt(b)}</b>: ${eqHtml(m, b)}.`],
      answer: { kind: 'pair', x: m, y: b }, picture: { pic: { kind: 'plot', plot: spec, show: { marks: true }, solve: [{ a: 'mark', tag: 'P' }, { a: 'mark', tag: 'Q' }] } },
      check: r => (r.kind !== 'pair' ? { ok: false, say: 'Fill in both numbers.' }
        : near(r.x, m, 0.01) && near(r.y, b, 0.01) ? { ok: true, say: `Yes: ${eqHtml(m, b)}.` }
          : near(r.x, mA, 0.05) ? { ok: false, mc: MC.offLine, say: 'You used dots A and B, which are not on the line. Use P and Q.' }
            : near(r.x, m, 0.01) ? { ok: false, say: `The slope is right. Now find <i>b</i>: put P into <i>y</i> = ${fmt(m)}<i>x</i> + <i>b</i>.` }
              : near(r.x, 1 / m, 0.01) ? { ok: false, say: 'Slope is rise over run: the change in y divided by the change in x.' }
                : { ok: false, say: 'Use P and Q: slope = change in y ÷ change in x, then solve for b.' }),
    } as SPItem;
  }
};

// ===================== 17. interp-vs-extrap =====================
const classify: Gen = (R, n) => {
  for (;;) {
    const c = pick(R, LINEAR), P = clearCloud(R, c, int(R, 9, 12), 0.8), [lo, hi] = xRange(P);
    const spec = plotOf(c, P, { extraX: [hi + (hi - lo) * 0.45] });
    const [a, b] = xRange(P);
    const kind = pick(R, ['inside', 'gap', 'far'] as const);
    let xq: number;
    if (kind === 'inside') { const cands: number[] = []; for (let x = Math.ceil(a); x <= Math.floor(b); x++) if (x > a && x < b && !P.some(p => near(p.x, x))) cands.push(x); if (!cands.length) continue; xq = pick(R, cands); }
    else if (kind === 'gap') { const cands: number[] = []; for (let x = Math.floor(b) + 1; x < spec.x1; x++) cands.push(x); if (!cands.length) continue; xq = pick(R, cands); }
    else xq = round(spec.x1 + (spec.x1 - spec.x0) * (0.4 + R() * 0.6), 0);
    const inside = kind === 'inside';
    spec.band = [a, b];
    return choiceItem(R, { id: `classify-${n}`, family: 'classify', board: `x = ${tx(xq)}`,
      prompt: `A prediction for a ${c.one} with ${c.xName} ${fmt(xq)}. Is that interpolation or extrapolation?`,
      solution: [`The observed ${c.xName} values run from ${fmt(a)} to ${fmt(b)}: the smallest and largest dot, not the ends of the axis.`, `${fmt(xq)} is ${inside ? 'inside' : 'outside'} that range: ${inside ? 'interpolation' : 'extrapolation'}.`],
      picture: { pic: { kind: 'plot', plot: spec, solve: [{ a: 'band' }] } } }, [
      { t: 'Interpolation: inside the observed range', ok: inside, mc: !inside && kind === 'gap' ? MC.axisRange : undefined, say: inside ? 'Yes: between the smallest and largest observed x.' : kind === 'gap' ? `The axis goes further, but the dots stop at ${fmt(b)}. ${fmt(xq)} is beyond them.` : `${fmt(xq)} is beyond the largest observed value, ${fmt(b)}.` },
      { t: 'Extrapolation: outside the observed range', ok: !inside, mc: inside ? MC.unobserved : undefined, say: !inside ? `Yes: beyond the largest observed value, ${fmt(b)}.` : `No dot sits at exactly ${fmt(xq)}, but it is between ${fmt(a)} and ${fmt(b)}: inside the range.` },
    ], true);
  }
};
const observedRange: Gen = (R, n) => {
  const c = pick(R, LINEAR), P = clearCloud(R, c, int(R, 9, 12), 0.8), [lo, hi] = xRange(P);
  const spec = plotOf(c, P, { extraX: [lo - (hi - lo) * 0.3, hi + (hi - lo) * 0.35].map(v => Math.max(0, v)) });
  spec.band = [lo, hi];
  return {
    id: `observedRange-${n}`, family: 'observedRange', board: '', input: 'pair', pairLead: 'from', pairOp: 'to', pairTail: c.xUnit === '°F' ? '°F' : c.xUnit,
    prompt: `What is the observed range of ${c.xName} for these ${P.length} ${c.many}?`,
    solution: [`The observed range runs from the smallest observed x to the largest: the leftmost and rightmost dots.`, `From <b>${fmt(lo)}</b> to <b>${fmt(hi)}</b>. The axis is just drawn longer.`],
    answer: { kind: 'pair', x: lo, y: hi }, picture: { pic: { kind: 'plot', plot: spec, solve: [{ a: 'band' }] } },
    check: r => (r.kind !== 'pair' ? { ok: false, say: 'Fill in both numbers.' }
      : near(r.x, lo) && near(r.y, hi) ? { ok: true, say: `Yes: ${fmt(lo)} to ${fmt(hi)}.` }
        : near(r.x, spec.x0) || near(r.y, spec.x1) ? { ok: false, mc: MC.axisRange, say: 'Those are the ends of the axis. Use the leftmost and rightmost dots.' }
          : { ok: false, say: 'Find the leftmost dot and the rightmost dot, and read their x-values.' }),
  } as SPItem;
};

// ===================== 18. extrap-unjustified =====================
interface Far { c: Ctx; x: number; limit: string }
function farCases(): Far[] {
  const by = (id: string) => CONTEXTS.find(c => c.id === id)!;
  return [
    { c: by('growth'), x: 30, limit: 'people stop growing in their late teens' },
    { c: by('growth'), x: 40, limit: 'people stop growing in their late teens' },
    { c: by('smoothie'), x: 120, limit: 'in extreme heat people may stay inside, and no such day was logged' },
    { c: by('cocoa'), x: 100, limit: 'sales cannot go below zero' },
    { c: by('car'), x: 25, limit: 'a price cannot go below zero' },
    { c: by('study'), x: 15, limit: 'the test has at most 100 points' },
    { c: by('absent'), x: 70, limit: 'a grade cannot go below zero, and no student missed that much' },
    { c: by('freethrow'), x: 180, limit: 'nobody makes more than 25 of 25' },
  ];
}
const whyRisky: Gen = (R, n) => {
  const fc = pick(R, farCases()), c = fc.c, P = clearCloud(R, c, int(R, 9, 12), 0.8), [lo, hi] = xRange(P);
  const m = c.m ?? 0, b = c.b ?? 0, y = round(m * fc.x + b, 2);
  const spec = plotOf(c, P, { extraX: [fc.x], extraY: [y, 0] });
  spec.lines = [{ m, b, x0: lo, x1: hi, col: 'link' }, { m, b, x0: hi, x1: fc.x, col: 'wrong', dash: true }];
  spec.band = [lo, hi];
  const slight = round(hi + (hi - lo) * 0.08, c.xDec);
  if (R() < 0.35) return choiceItem(R, { id: `whyRisky-${n}`, family: 'whyRisky', board: eqTex(m, b),
    prompt: `The ${c.many} were observed from ${fmt(lo)} to ${fmt(hi)} (${c.xName}). Which prediction from the line deserves more trust: at ${fmt(slight)} or at ${fmt(fc.x)}?`,
    solution: [`Both are extrapolations, but ${fmt(slight)} is just past the data, and ${fmt(fc.x)} is far past it.`, 'The further from the data, the more room for the pattern to change.'],
    picture: { pic: { kind: 'plot', plot: spec, show: { lines: [0] }, solve: [{ a: 'band' }, { a: 'line', i: 1 }] } } }, [
    { t: `At ${fmt(slight)}: just outside the data, where the pattern has had little room to change`, ok: true, say: 'Yes: slightly outside is risky; far outside is much riskier.' },
    { t: 'Both equally: the same line gives both', mc: MC.noLimit, say: 'The line is only backed by data from the observed range. Far out, nothing checks it.' },
    { t: 'Neither: every prediction outside the data is worthless', mc: MC.worthless, say: 'Just past the data, the line still gives a reasonable estimate. Far out is the problem.' },
  ]);
  return choiceItem(R, { id: `whyRisky-${n}`, family: 'whyRisky', board: `${eqTex(m, b)}`,
    prompt: `The ${c.many} were observed from ${fmt(lo)} to ${fmt(hi)} (${c.xName}). Jo uses ${eqHtml(m, b)} to predict ${uv(c.yUnit, y)} at ${c.xName} ${fmt(fc.x)}. Is that reliable?`,
    solution: [`${fmt(fc.x)} is far outside the observed ${fmt(lo)} to ${fmt(hi)}: extrapolation.`, `The data say nothing out there, and ${fc.limit}.`],
    picture: { pic: { kind: 'plot', plot: spec, show: { lines: [0] }, solve: [{ a: 'band' }, { a: 'line', i: 1 }] } } }, [
    { t: `No: ${fmt(fc.x)} is far outside the data, and ${fc.limit}`, ok: true, say: 'Yes: the pattern was only seen inside the observed range.' },
    { t: 'Yes: the line keeps going, so the prediction holds', mc: MC.noLimit, say: 'A line goes on forever on paper. The real pattern was only seen inside the data.' },
    { t: 'No: predictions from data can never be trusted', mc: MC.worthless, say: 'Inside the range the line gives fair estimates. The problem is going far outside.' },
  ]);
};

// ===================== 19. interpret-slope-intercept =====================
const slopeMeaning: Gen = (R, n) => {
  const c = pick(R, LINEAR), { m, b } = niceEq(R, c), P = clearCloud(R, { ...c, m, b }, int(R, 10, 13), 0.8), spec = plotOf(c, P);
  const [lo, hi] = xRange(P);
  spec.lines = [{ m, b, x0: lo, x1: hi, col: 'link' }];
  const goes = m > 0 ? 'goes up' : 'goes down', d = du(c.yUnit, Math.abs(m));
  const [one, ones] = unitWords(c.xUnit);
  if (R() < 0.3) {
    const k = pick(R, [2, 3, 4, 5]), diff = round(Math.abs(m) * k, 3);
    return numItem({ id: `slopeMeaning-${n}`, family: 'slopeMeaning', board: eqTex(m, b), unit: c.yUnit === 'thousand dollars' ? 'thousand $' : c.yUnit === '%' ? 'points' : c.yUnit,
      prompt: `Trend line: ${eqHtml(m, b)} (<i>x</i> = ${c.xName}, <i>y</i> = ${c.yName}). Two ${c.many} differ by ${k} ${ones}. By how much do their PREDICTED ${c.yName} values differ?`,
      solution: [`On the line, each extra ${one} changes ${c.yName} by ${fmt(Math.abs(m))}.`, `${k} × ${fmt(Math.abs(m))} = <b>${fmt(diff)}</b>. (Two real ${c.many} may differ by more or less.)`],
      picture: { pic: { kind: 'plot', plot: spec, solve: [] } } }, diff, 0.01,
    v => (near(v, Math.abs(m), 0.01) ? { ok: false, say: `That is for 1 ${one}. These differ by ${k}.` } : { ok: false, say: `The slope is the change per 1 ${one}. Multiply by ${k}.` }));
  }
  return choiceItem(R, { id: `slopeMeaning-${n}`, family: 'slopeMeaning', board: eqTex(m, b),
    prompt: `Trend line for ${P.length} ${c.many}: ${eqHtml(m, b)} (<i>x</i> = ${c.xName}, <i>y</i> = ${c.yName}). What does the slope ${fmt(m)} mean?`,
    solution: [`The slope is the predicted change in ${c.yName} for each extra ${one}.`, `On average, ${c.yName} ${goes} by about ${d} per ${one}. Single cases vary, and it says nothing about cause.`],
    picture: { pic: { kind: 'plot', plot: spec, solve: [] } } }, [
    { t: `On average, ${c.yName} ${goes} by about ${d} for each extra ${one}`, ok: true, say: 'Yes: an average rate, read from the trend.' },
    { t: `For every single ${c.one}, 1 more ${one} means exactly ${d} ${m > 0 ? 'more' : 'less'}`, mc: MC.slopeExact, say: 'The dots scatter around the line, so single pairs differ. The slope is an average.' },
    { t: `Each extra ${one} causes ${c.yName} to change by ${d}`, mc: MC.cause, say: 'Data like these show an association. They cannot prove what causes what.' },
  ]);
};
const interceptMeaning: Gen = (R, n) => {
  const c = pick(R, LINEAR), { m, b } = niceEq(R, c), P = clearCloud(R, { ...c, m, b }, int(R, 10, 13), 0.8), [lo, hi] = xRange(P);
  const meaningful = c.zeroOk;
  const spec = plotOf(c, P);
  spec.lines = [{ m, b, x0: lo, x1: hi, col: 'link' }];
  const at0 = uv(c.yUnit, b), z = `${c.xName} 0`, [one] = unitWords(c.xUnit);
  return choiceItem(R, { id: `interceptMeaning-${n}`, family: 'interceptMeaning', board: eqTex(m, b),
    prompt: `Trend line for ${P.length} ${c.many} observed from ${fmt(lo)} to ${fmt(hi)} (${c.xName}): ${eqHtml(m, b)}. What does the intercept ${fmt(b)} mean?`,
    solution: meaningful ? [`The intercept is the predicted ${c.yName} at x = 0: about ${at0}.`, 'Here x = 0 makes sense and is near the data, so it is a reasonable estimate, not a measured value.']
      : [`The intercept is the line’s value at x = 0: ${at0}.`, `But ${z} is outside the observed ${fmt(lo)} to ${fmt(hi)}, where the line has no data behind it: the intercept has no real meaning here.`],
    picture: { pic: { kind: 'plot', plot: spec, solve: [] } } }, meaningful ? [
    { t: `The predicted ${c.yName} for a ${c.one} with ${z}: about ${at0}`, ok: true, say: 'Yes: here x = 0 makes sense and is close to the data.' },
    { t: `Every ${c.one} with ${z} had exactly ${at0}`, mc: MC.interceptReal, say: 'It is a prediction from the line, not a measured value.' },
    { t: `The change in ${c.yName} for each extra ${one}`, say: 'That is the slope. The intercept is the value at x = 0.' },
  ] : [
    { t: `Nothing real: ${z} is outside the observed ${fmt(lo)} to ${fmt(hi)}, where the line has no data behind it`, ok: true, say: 'Yes: the line is only backed by data inside that range.' },
    { t: `A ${c.one} with ${z} had ${at0}`, mc: MC.interceptReal, say: `No ${c.one} near ${z} was observed, so the intercept is not a real starting value.` },
    { t: `The change in ${c.yName} for each extra ${one}`, say: 'That is the slope. The intercept is the value at x = 0.' },
  ]);
};

// ===================== 20-22. two-way tables =====================
const SURVEY3 = { rowVar: 'grade', rows: ['7th grade', '8th grade'], cols: ['bus', 'car', 'walk or bike'], who: 'students' };
const readCell: Gen = (R, n) => {
  const v = int(R, 0, 2);
  if (v === 2) {
    const cells = [[int(R, 6, 20), int(R, 6, 20), int(R, 4, 15)], [int(R, 6, 20), int(R, 6, 20), int(R, 4, 15)]];
    const t: TwoWay = { rowVar: SURVEY3.rowVar, colVar: 'gets to school by', rows: SURVEY3.rows.slice(), cols: SURVEY3.cols.slice(), cells };
    const r = int(R, 0, 1), k = int(R, 0, 2), ans = cells[r]![k]!, rt = rowTot(t, r);
    return numItem({ id: `readCell-${n}`, family: 'readCell', board: '', unit: 'students',
      prompt: `${grand(t)} students said how they get to school. How many ${t.rows[r]} students come by <b>${t.cols[k]}</b>? (The cell shows “?”.)`,
      solution: [`The ${t.rows[r]} row has ${rt} students in all.`, `Take away the other cells: ${rt} − ${cells[r]!.filter((_, j) => j !== k).join(' − ')} = <b>${ans}</b>.`],
      picture: { pic: { kind: 'table', table: twoWaySpec(t, { blank: [r, k] }), solve: [{ a: 'row', r }, { a: 'reveal', r, c: k + 1, t: String(ans) }] } } }, ans, 0,
    w => (w === rt ? { ok: false, mc: MC.totalCell, say: `${rt} is the whole ${t.rows[r]} row. The “?” cell is only part of it.` } : { ok: false, say: `The row total is the sum of its cells. Subtract the known cells from ${rt}.` }));
  }
  const s = pick(R, SURVEYS), t = makeTwoWay(R, s, R() < 0.5), r = int(R, 0, 1), k = int(R, 0, 1), ans = t.cells[r]![k]!;
  if (v === 1) {
    const rt = rowTot(t, r);
    return numItem({ id: `readCell-${n}`, family: 'readCell', board: '', unit: s.who,
      prompt: `Fill in the “?”: how many ${s.who} are in the <b>${t.rows[r]}</b> row and the <b>${t.cols[k]}</b> column?`,
      solution: [`The ${t.rows[r]} row adds up to ${rt}.`, `${rt} − ${t.cells[r]![1 - k]} = <b>${ans}</b>.`],
      picture: { pic: { kind: 'table', table: twoWaySpec(t, { blank: [r, k] }), solve: [{ a: 'row', r }, { a: 'reveal', r, c: k + 1, t: String(ans) }] } } }, ans, 0,
    w => (w === rt ? { ok: false, mc: MC.totalCell, say: `${rt} is the row total. The “?” is one part of that row.` } : { ok: false, say: 'The two cells of a row add up to its total.' }));
  }
  const rt = rowTot(t, r), ct = colTot(t, k);
  return numItem({ id: `readCell-${n}`, family: 'readCell', board: '', unit: s.who,
    prompt: `${grand(t)} ${s.who} were surveyed. How many are in the <b>${t.rows[r]}</b> row AND the <b>${t.cols[k]}</b> column?`,
    solution: [`Find the ${t.rows[r]} row and the ${t.cols[k]} column.`, `Where they cross: <b>${ans}</b>. The margins hold totals, not joint counts.`],
    picture: { pic: { kind: 'table', table: twoWaySpec(t), solve: [{ a: 'cell', r, c: k + 1 }] } } }, ans, 0,
  w => (w === rt || w === ct ? { ok: false, mc: MC.totalCell, say: `${w} is a total in the margin. Both at once is the cell where the row and the column cross.` } : { ok: false, say: 'Find the cell where the row and the column cross.' }));
};
const grandTotal: Gen = (R, n) => {
  const s = pick(R, SURVEYS), t = makeTwoWay(R, s, R() < 0.5), G = grand(t), A = rowTot(t, 0), Bc = colTot(t, 0), C = t.cells[0]![0]!;
  if (R() < 0.5) {
    if (A + Bc === G) return grandTotal(R, n);
    return numItem({ id: `grandTotal-${n}`, family: 'grandTotal', board: '', unit: s.who,
      prompt: `Each ${s.who.replace(/s$/, '')} answered both questions; the table shows the four groups. How many ${s.who} were surveyed?`,
      solution: ['Each person sits in exactly ONE cell: their pair of answers.', `${t.cells.flat().join(' + ')} = <b>${G}</b>.`],
      picture: { pic: { kind: 'table', table: twoWaySpec(t, { hideTotals: true }), solve: [{ a: 'reveal', r: 2, c: 3, t: String(G) }] } } }, G, 0,
    w => (w === A + Bc ? { ok: false, mc: MC.twoCells, say: `${A} + ${Bc} counts the ${C} who are in both groups twice. Add the four cells.` } : { ok: false, say: 'Add the four cells: every person is in exactly one.' }));
  }
  const ans = A - C;
  const t2: TwoWay = { ...t, cells: t.cells.map(r => r.slice()) };
  return numItem({ id: `grandTotal-${n}`, family: 'grandTotal', board: '', unit: s.who,
    prompt: `${G} ${s.who} answered both questions. ${A} ${s.rowYes}; ${C} of them also ${s.colYes}. How many ${s.rowYes} but do NOT ${s.colYes}?`,
    solution: [`The ${A} who ${s.rowYes} split into two cells: ${C} who ${s.colYes}, and the rest.`, `${A} − ${C} = <b>${ans}</b>.`],
    picture: { pic: { kind: 'table', table: twoWaySpec(t2, { blank: [0, 1] }), solve: [{ a: 'row', r: 0 }, { a: 'reveal', r: 0, c: 2, t: String(ans) }] } } }, ans, 0,
  w => (w === A ? { ok: false, mc: MC.totalCell, say: `${A} is everyone who ${s.rowYes}. Some of them DO ${s.colYes}: take those away.` }
    : w === A + C ? { ok: false, mc: MC.twoCells, say: `The ${C} are already inside the ${A}. Each person is counted once.` } : { ok: false, say: `Take the ${C} who do both out of the ${A}.` }));
};
const relFreq: Gen = (R, n, sg) => {
  const s = pick(R, SURVEYS), t = makeTwoWay(R, s, R() < 0.6), r = sg === 'categorical-association' ? 1 : int(R, 0, 1), k = 0;
  const cell = t.cells[r]![k]!, rt = rowTot(t, r), G = grand(t), ct = colTot(t, k);
  const p = round((100 * cell) / rt, 1);
  const v = sg === 'categorical-association' ? 0 : int(R, 0, 2);
  const table = twoWaySpec(t);
  if (v === 2) {
    const opts: Opt[] = [{ t: String(rt), ok: true, say: `Yes: “of the ${t.rows[r]}” makes that row the new whole.` }];
    if (G !== rt) opts.push({ t: String(G), mc: MC.wholeKept, say: `“Of the ${t.rows[r]}” means only that row counts: its total is the whole.` });
    if (ct !== rt && ct !== G) opts.push({ t: String(ct), say: `That is the ${t.cols[k]} column. The question is about the ${t.rows[r]} row.` });
    if (opts.length < 3 && !opts.some(o => o.t === String(cell))) opts.push({ t: String(cell), say: 'That is the part. The denominator is the whole group.' });
    return choiceItem(R, { id: `relFreq-${n}`, family: 'relFreq', board: '',
      prompt: `“Of the ${s.who} in the <b>${t.rows[r]}</b> row, what fraction ${s.colYes}?” The numerator is ${cell}. Which number is the denominator?`,
      solution: [`“Of the ${t.rows[r]} row” names the group: that row is the new whole.`, `Denominator <b>${rt}</b>: ${cell} of ${rt}.`],
      picture: { pic: { kind: 'table', table, solve: [{ a: 'row', r }, { a: 'cell', r, c: 3 }] } } }, opts);
  }
  if (v === 1) {
    const c2 = colTot(t, 0);
    return {
      id: `relFreq-${n}`, family: 'relFreq', board: '', input: 'frac', unit: '',
      prompt: `Of the ${s.who} in the <b>${t.cols[0]}</b> column, what fraction are <b>${t.rows[r]}</b>?`,
      solution: [`“Of the ${t.cols[0]}” makes that column the whole: ${c2}.`, `${t.cells[r]![0]} of them are ${t.rows[r]}: <b>${t.cells[r]![0]}/${c2}</b>.`],
      answer: { kind: 'frac', w: 0, n: t.cells[r]![0]!, d: c2 }, picture: { pic: { kind: 'table', table, solve: [{ a: 'col', c: 1 }, { a: 'cell', r, c: 1 }] } },
      check: rr => {
        if (rr.kind !== 'frac') return { ok: false, say: 'Type a fraction.' };
        const fv = fracValue(rr);
        if (!fv) return { ok: false, say: 'Type a fraction with whole numbers.' };
        if (same(fv, t.cells[r]![0]!, c2)) return { ok: true, say: `Yes: ${t.cells[r]![0]} of the ${c2}.` };
        if (same(fv, t.cells[r]![0]!, G)) return { ok: false, mc: MC.wholeKept, say: `That divides by everyone (${G}). “Of the ${t.cols[0]}” makes that column the whole: ${c2}.` };
        if (same(fv, t.cells[r]![0]!, rowTot(t, r))) return { ok: false, say: `That divides by the ${t.rows[r]} row. The question is about the ${t.cols[0]} column.` };
        return { ok: false, say: `Part over whole: the ${t.rows[r]} in that column, over the column total ${c2}.` };
      },
    } as SPItem;
  }
  return numItem({ id: `relFreq-${n}`, family: 'relFreq', board: '', unit: '%',
    prompt: `${G} ${s.who} were surveyed. Of the ${s.who} in the <b>${t.rows[r]}</b> row, what percent are in the <b>${t.cols[k]}</b> column?`,
    solution: [`“Of the ${t.rows[r]}” makes that row the whole: ${rt}.`, `${cell} ÷ ${rt} = ${fmt(cell / rt, 3)} = <b>${fmt(p)}%</b>.`],
    picture: { pic: { kind: 'table', table, solve: [{ a: 'row', r }, { a: 'cell', r, c: 1 }] } } }, p, 0.5,
  w => (Math.abs(w - (100 * cell) / G) <= 0.5 ? { ok: false, mc: MC.wholeKept, say: `That divides by all ${G} ${s.who}. Only the ${t.rows[r]} row counts: divide by ${rt}.` }
    : Math.abs(w - (100 * cell) / ct) <= 0.5 ? { ok: false, say: `That divides by the column total. The question is about the ${t.rows[r]} row: divide by ${rt}.` }
      : near(w, cell) ? { ok: false, say: `${cell} is a count. As a percent of ${rt}: ${cell} ÷ ${rt} × 100.` } : { ok: false, say: `Divide the cell by the ${t.rows[r]} total, ${rt}, then × 100.` }));
};
const associated: Gen = (R, n) => {
  const s = pick(R, SURVEYS), assoc = R() < 0.6;
  const t = makeTwoWay(R, s, assoc, { mislead: true });
  const a = t.cells[0]![0]!, c = t.cells[1]![0]!, p0 = round((100 * a) / rowTot(t, 0), 1), p1 = round((100 * c) / rowTot(t, 1), 1);
  const hiRow = p0 > p1 ? 0 : 1, rawHi = a > c ? 0 : 1;
  const conclusion = R() < 0.4;
  const g = (i: number) => `the ${t.rows[i]} group`;
  const opts: Opt[] = conclusion ? [
    { t: assoc ? `In ${g(hiRow)}, a larger share ${s.colYes} (${fmt(Math.max(p0, p1))}% vs ${fmt(Math.min(p0, p1))}%): the two are associated` : `Little or no association: ${fmt(p0)}% vs ${fmt(p1)}% ${s.colYes}`, ok: true, say: 'Yes: compare the shares, and say “associated with”, never “causes”.' },
    { t: `Being in ${g(assoc ? hiRow : 0)} makes ${s.who} ${s.colYes}`, mc: MC.cause, say: 'A survey shows association, not cause.' },
    { t: `More of ${g(rawHi)} ${s.colYes} (${Math.max(a, c)} vs ${Math.min(a, c)}), so that group goes with it`, mc: MC.oneQty, say: 'The groups have different sizes. Compare percents, not counts.' },
  ] : [
    { t: assoc ? `Yes: ${fmt(p0)}% of ${g(0)} vs ${fmt(p1)}% of ${g(1)} ${s.colYes}, clearly different` : `No clear association: ${fmt(p0)}% vs ${fmt(p1)}% ${s.colYes}, nearly the same`, ok: true, say: 'Yes: compare the row percents.' },
    { t: `Yes: ${Math.max(a, c)} in ${g(rawHi)} vs ${Math.min(a, c)} in ${g(1 - rawHi)} ${s.colYes}`, mc: MC.oneQty, say: `The groups have different sizes (${rowTot(t, 0)} and ${rowTot(t, 1)}). Compare percents, not counts.` },
    assoc ? { t: `No: some in both groups ${s.colYes}`, say: 'Compare how big a SHARE of each group it is.' }
      : { t: `Yes: being in ${g(0)} makes ${s.who} ${s.colYes}`, mc: MC.cause, say: 'The shares are nearly equal, and a survey could not show cause anyway.' },
  ];
  return choiceItem(R, { id: `associated-${n}`, family: 'associated', board: '',
    prompt: conclusion ? `${grand(t)} ${s.who} were surveyed. Which conclusion is stated well?` : `Is ${s.rowVar.replace('?', '')} associated with ${s.colVar.replace('?', '')} for these ${grand(t)} ${s.who}?`,
    solution: [`Row percents: ${a} of ${rowTot(t, 0)} = ${fmt(p0)}%, ${c} of ${rowTot(t, 1)} = ${fmt(p1)}%.`, assoc ? 'Clearly different shares: associated (not proof of cause).' : 'Nearly the same shares: little or no association, whatever the raw counts say.'],
    picture: { pic: { kind: 'table', table: twoWaySpec(t), solve: [{ a: 'cell', r: 0, c: 1 }, { a: 'cell', r: 1, c: 1 }] } } }, opts);
};

export const GENERATORS: Record<FamilyId, Gen> = {
  caseVars, keepPairs, readPoint, countCases, whereDot, joinOrNot, whichOnX, axisPlan, pickScale, readScaleY,
  findTheFlaw, nameDirection, exceptionPair, linearOrCurve, straightEdge, whichStronger, strongMeans, countClusters,
  completeDesc, findOutlier, keepOrDelete, fullDescription, whichDisplay, bestLine, equalCounts, readPrediction,
  estimateMeaning, predictEq, writeEq, classify, observedRange, whyRisky, slopeMeaning, interceptMeaning,
  readCell, grandTotal, relFreq, associated,
};
/** test hook: the contexts a few families draw from */
export const _ctx = { CLUSTERS, texWords, POSITIVE, NEGATIVE };
export type { ClusterCtx };
