// items.ts: practice families for "two-way tables, relative frequencies and segmented bar graphs". Every family builds
// realistic seeded data (twoWayMaths.ts), checks the answer exactly (percents to the tenth, or the exact hundredth),
// and classifies the typical slips against the misconception catalogue (math-curriculum-essentials ids).
// Every item carries a picture the page draws (a table, bars, a tree, or three small graphs), the TeX lines the board
// writes when the solution is replayed, and what to light up (the whole in amber, the part in lime).
// Pure: no DOM, no canvas.
import { type Item, type Response, type Verdict, int, pick, shuffle } from '../../runtime/item';
import { endOnChoice } from '../../runtime/explain';
import {
  type Ctx, type Grid, type RFKey, CONTEXTS_2x2, CONTEXTS_2x3 as CONTEXTS_3, RF_KEYS, ctxFor, exactAt, fmt, genCounts, htmlEq, htmlPct, pct, round,
  screen, screenOk, shapeFor, texEq, texPct, totals,
} from './twoWayMaths';
import { type TableSpec, countSpec } from './TwoWayTable';
import type { BarsSpec } from './SegBars';
import type { TreeSpec } from './Tree';

// ---------- misconception ids ----------
/** practice boards are drawn on a wider slate: every board / solve line fits this width at 60 px */
export const PRACTICE_BOARD_W = 710;

export const MC = {
  inverse: 'mc.probability.confusion-of-the-inverse',
  fixedRow: 'mc.probability.fixed-row-denominator-for-conditionals',
  subgroupJoint: 'mc.probability.subgroup-denominator-for-joint-frequencies',
  notNewWhole: 'mc.probability.condition-not-made-new-whole',
  unweighted: 'mc.statistics.unweighted-average',
  keywords: 'mc.statistics.relative-frequency-named-by-keywords',
  fixed: 'mc.percent.percent-as-fixed-amount',
  segOrder: 'mc.data-displays.segment-order-varies',
  barsCounts: 'mc.data-displays.segmented-bars-as-counts',
  endReading: 'mc.measurement-units.end-reading-as-length',
  diffWholes: 'mc.fractions-concept.different-wholes-treated-as-same',
  negWeak: 'mc.statistics.negative-r-as-weak',
  oneCell: 'mc.probability.independence-from-one-cell-count',
  addsStages: 'mc.probability.adds-stage-counts',
  fpfn: 'mc.statistics.false-positive-negative-confused',
  noCause: 'mc.statistics.no-cause-no-association',
  causation: 'mc.statistics.correlation-implies-causation',
  forceClose: 'mc.data-displays.forces-last-value-to-close-whole',
  roundedSum: 'mc.estimation.rounded-parts-must-sum-to-total',
  totalAsCell: 'mc.data-displays.total-cell-as-joint-cell',
  partAsWhole: 'mc.add-sub.swaps-whole-and-part-roles',
  pctDeg: 'mc.data-displays.percent-as-degrees',
  noData: 'mc.statistics.asks-questions-data-cannot-answer',
  oneLabel: 'mc.data-displays.one-label-lookup',
} as const;

// ---------- families ----------
export const FAMILIES = [
  { id: 'rowPct', name: 'Percent of a row group' },
  { id: 'colPct', name: 'Percent of a column group' },
  { id: 'matchQuestion', name: 'Which question does it answer?' },
  { id: 'jointPct', name: 'Percent of everyone' },
  { id: 'jointRound', name: 'Rounded joint tables' },
  { id: 'marginalPct', name: 'Margin over the grand total' },
  { id: 'marginalFromJoint', name: 'Add the joint percents' },
  { id: 'weightedTrap', name: 'Don’t average the groups' },
  { id: 'nameType', name: 'Joint, marginal or conditional?' },
  { id: 'nameWhole', name: 'Name the whole' },
  { id: 'condFromJoint', name: 'Conditional from joint' },
  { id: 'countUnknown', name: 'Counts from percents?' },
  { id: 'barSegment', name: 'Build a 100% bar' },
  { id: 'pickGraph', name: 'Which graph is right?' },
  { id: 'readSeg', name: 'Read a middle segment' },
  { id: 'readSentence', name: 'Say what a segment means' },
  { id: 'moreWho', name: 'Which group has more?' },
  { id: 'countFromBar', name: 'Counts from a bar' },
  { id: 'assocTable', name: 'Association from a table' },
  { id: 'pointsDiff', name: 'Percentage points apart' },
  { id: 'assocBars', name: 'Association from bars' },
  { id: 'treeLeaf', name: 'Branch times branch' },
  { id: 'treeMissing', name: 'The missing branch' },
  { id: 'fillCell', name: 'Fill the gaps' },
  { id: 'fromConditional', name: 'From a conditional to the table' },
  { id: 'screenWord', name: 'True or false, positive or negative' },
  { id: 'screenPPV', name: 'A positive test: how sure?' },
  { id: 'chanceAll', name: 'Chosen from everyone' },
  { id: 'chanceGroup', name: 'Chosen from one group' },
  { id: 'chanceWho', name: 'Can the table tell?' },
  { id: 'rewriteClaim', name: 'Association, not cause' },
  { id: 'confounder', name: 'Something else behind it' },
  { id: 'combineGroups', name: 'Combine two groups' },
  { id: 'pieAngle', name: 'From a table to a circle graph' },
  { id: 'rawCountClaim', name: 'Counts or percents?' },
] as const;
export type FamilyId = (typeof FAMILIES)[number]['id'];
export const FAMILY_NAMES: Record<string, string> = Object.fromEntries(FAMILIES.map(f => [f.id, f.name]));

// ---------- pictures ----------
export type WholeKind = 'row' | 'col' | 'all';
export interface Focus {
  whole?: { kind: WholeKind; i: number };
  part?: { r: number; c: number };
  glows?: { r: number; c: number }[];
  seg?: { g: number; s: number };
  bar?: number;
  path?: { i: number; j: number };
  /** grow the attached bars out of the table during the solve */
  grow?: boolean;
  /** an alignment line along the boundary after category s */
  align?: number;
}
export type Pic =
  | { kind: 'table'; table: TableSpec; bars?: { spec: BarsSpec; orient: 'h' | 'v'; atStart: boolean } }
  | { kind: 'bars'; bars: BarsSpec; orient: 'h' | 'v' }
  | { kind: 'tree'; tree: TreeSpec }
  | { kind: 'graphs'; table: TableSpec; graphs: BarsSpec[]; names: string[] };
export interface TwPicture { pic: Pic; focus: Focus; steps: string[] }
export interface TwItem extends Item { family: FamilyId; picture: TwPicture & Record<string, unknown> }
type Gen = (R: () => number, n: number, sg?: string) => TwItem;

// ---------- checking ----------
interface Wrong { v: number; mc?: string; say: string; /** compare exactly (a count) */ exact?: boolean }
const tolOf = (d: number) => (d >= 2 ? 0.006 : 0.051);
/** a typed percent: exact to the tenth (or hundredth), the decimal form accepted, typical slips classified */
function pctCheck(exact: number, d: number, wrongs: readonly Wrong[], okSay: string, miss: string, tol = tolOf(d)): (r: Response) => Verdict {
  return r => {
    if (r.kind !== 'num' || !Number.isFinite(r.v)) return { ok: false, say: 'Type a number.' };
    const v = r.v, near = (a: number, b: number) => Math.abs(a - b) <= tol;
    if (near(v, exact)) return { ok: true, say: okSay };
    if (exact >= 1 && v > 0 && v < 1 && near(v * 100, exact)) return { ok: true, say: `${okSay} (${fmt(v, 4)} as a decimal is ${fmt(exact, d)}%.)` };
    for (const w of wrongs) {
      if (Math.abs(w.v - exact) <= tol + 1e-9) continue;
      const hit = w.exact ? v === w.v : near(v, w.v) || (w.v >= 1 && v > 0 && v < 1 && near(v * 100, w.v));
      if (hit) return { ok: false, mc: w.mc, say: w.say };
    }
    if (Math.abs(v - exact) < 0.6 && d >= 1 && !exactAt(exact, 0)) return { ok: false, say: 'Close. Keep one decimal place: round to the nearest tenth of a percent.' };
    return { ok: false, say: miss };
  };
}
/** a typed whole number (a count or degrees) */
function countCheck(ans: number, wrongs: readonly Wrong[], okSay: string, miss: string): (r: Response) => Verdict {
  return r => {
    if (r.kind !== 'num' || !Number.isFinite(r.v)) return { ok: false, say: 'Type a number.' };
    if (Math.abs(r.v - ans) < 1e-9) return { ok: true, say: okSay };
    for (const w of wrongs) if (Math.abs(w.v - ans) > 1e-9 && Math.abs(r.v - w.v) < 0.051) return { ok: false, mc: w.mc, say: w.say };
    return { ok: false, say: miss };
  };
}
interface Opt { t: string; ok?: boolean; mc?: string; say: string }
function choose(R: () => number, opts: readonly Opt[], keepOrder = false): Pick<Item, 'choices' | 'answer' | 'check'> {
  const o = keepOrder ? [...opts] : shuffle(R, [...opts]);
  return {
    choices: o.map(x => x.t), answer: { kind: 'choice', i: o.findIndex(x => x.ok) },
    check: r => (r.kind === 'choice' && o[r.i] ? { ok: !!o[r.i]!.ok, mc: o[r.i]!.mc, say: o[r.i]!.say } : { ok: false, say: 'Pick one.' }),
  };
}
const roundHint = (x: number, d = 1) => (exactAt(x, 0) ? '' : d >= 2 ? ' Give the exact percent (to the hundredth).' : ' Round to the nearest tenth of a percent.');
const P = (x: number, d = 1) => htmlPct(x, d);
const frac = (a: number | string, b: number | string) => `\\frac{${a}}{${b}}`;
/** TeX: part / whole = percent */
const divTex = (a: number, b: number, d = 1) => `${frac(a, b)} ${texEq(pct(a, b), d)} ${texPct(pct(a, b), d)}`;
const BOARD_PCT = '\\frac{\\text{part}}{\\text{whole}} = \\;?\\,\\%';

// ---------- data bundles ----------
interface Tb { x: Ctx; cells: Grid; t: ReturnType<typeof totals>; nR: number; nC: number }
function tb(R: () => number, o: { shape?: [number, number]; friendly?: boolean; assoc?: 'pos' | 'neg' | 'none' | 'any'; oddTotal?: boolean; ctx?: Ctx; max?: number } = {}): Tb {
  const [nR, nC] = o.shape ?? [2, 2];
  const x = o.ctx ?? ctxFor(R, nR, nC);
  const cells = genCounts(R, { rows: nR, cols: nC, friendly: o.friendly ?? true, assoc: o.assoc ?? 'any', oddTotal: o.oddTotal, max: o.max });
  return { x, cells, t: totals(cells), nR, nC };
}
const rl = (T: Tb) => T.x.rows.cats.map(c => c.label);
const cl = (T: Tb) => T.x.cols.cats.map(c => c.label);
const tableOf = (T: Tb, tint: 'row' | 'col' | null = 'col', hide?: string[]) => countSpec(rl(T), cl(T), T.cells, { tint, hide });
const intro = (T: Tb) => `A survey asked <b class="a">${T.t.all}</b> ${T.x.who} about ${T.x.rows.name} and ${T.x.cols.name}.`;
const rowBars = (T: Tb, o: Partial<BarsSpec> = {}): BarsSpec => ({ groups: rl(T), cats: cl(T), pcts: T.cells.map((r, i) => r.map(v => pct(v, T.t.row[i]!))), labels: true, ...o });
const colBars = (T: Tb, o: Partial<BarsSpec> = {}): BarsSpec => ({ groups: cl(T), cats: rl(T), pcts: T.cells[0]!.map((_, j) => T.cells.map(r => pct(r[j]!, T.t.col[j]!))), labels: true, ...o });
const sg1 = (sg?: string) => sg ?? '';

// ======================= 1 conditional-both-directions =======================
const rowPct: Gen = (R, n, sg) => {
  const T = tb(R, { shape: shapeFor(R, sg1(sg) !== 'relative-frequency-as-probability'), friendly: R() < 0.6 });
  const r = int(R, 0, T.nR - 1), c = int(R, 0, T.nC - 1), v = T.cells[r]![c]!, w = T.t.row[r]!, ex = pct(v, w);
  const Rr = T.x.rows.cats[r]!, Cc = T.x.cols.cats[c]!;
  return {
    id: `rowPct-${n}`, family: 'rowPct',
    prompt: `${intro(T)} Of the ${Rr.group}, what percent ${Cc.has}?${roundHint(ex)}`,
    board: BOARD_PCT, input: 'num', unit: '%', answer: { kind: 'num', v: round(ex, 1) },
    picture: { pic: { kind: 'table', table: tableOf(T, 'col') }, focus: { whole: { kind: 'row', i: r }, part: { r, c } }, steps: [`\\text{whole} = ${w}`, divTex(v, w)] },
    solution: [`“Of the ${Rr.group}” makes the <b class="a">${Rr.label}</b> row the whole: <b class="a">${w}</b>.`, `The part is the cell where that row meets <b class="b">${Cc.label}</b>: <b class="b">${v}</b>.`, `${v} ÷ ${w} ${htmlEq(ex)} <b class="s">${P(ex)}</b>.`],
    check: pctCheck(ex, 1, [
      { v: pct(v, T.t.col[c]!), mc: MC.inverse, say: `That divides by the ${Cc.label} column total, ${T.t.col[c]}. It answers “of the ${Cc.group}”, a different question.` },
      { v: pct(v, T.t.all), mc: MC.notNewWhole, say: `${v} out of all ${T.t.all} is a share of everybody. “Of the ${Rr.group}” makes only that row the whole.` },
      { v, exact: true, mc: MC.fixed, say: `${v} is a count, not a percent. Divide it by its whole first.` },
    ], `Right: “of the ${Rr.group}” makes their row total, ${w}, the whole.`, `Find the row of the ${Rr.group}: its total is the whole, the ${Cc.label} cell is the part.`),
  };
};
const colPct: Gen = (R, n, sg) => {
  const T = tb(R, { shape: shapeFor(R, true), friendly: R() < 0.6 });
  void sg;
  const r = int(R, 0, T.nR - 1), c = int(R, 0, T.nC - 1), v = T.cells[r]![c]!, w = T.t.col[c]!, ex = pct(v, w);
  const Rr = T.x.rows.cats[r]!, Cc = T.x.cols.cats[c]!;
  return {
    id: `colPct-${n}`, family: 'colPct',
    prompt: `${intro(T)} Of the ${Cc.group}, what percent ${Rr.has}?${roundHint(ex)}`,
    board: BOARD_PCT, input: 'num', unit: '%', answer: { kind: 'num', v: round(ex, 1) },
    picture: { pic: { kind: 'table', table: tableOf(T, 'row') }, focus: { whole: { kind: 'col', i: c }, part: { r, c } }, steps: [`\\text{whole} = ${w}`, divTex(v, w)] },
    solution: [`“Of the ${Cc.group}” makes the <b class="a">${Cc.label}</b> column the whole: <b class="a">${w}</b>.`, `The part is the <b class="b">${Rr.label}</b> cell of that column: <b class="b">${v}</b>.`, `${v} ÷ ${w} ${htmlEq(ex)} <b class="s">${P(ex)}</b>.`],
    check: pctCheck(ex, 1, [
      { v: pct(v, T.t.row[r]!), mc: MC.fixedRow, say: `That divides by the row total, ${T.t.row[r]}. Here the question names a column group: “of the ${Cc.group}”.` },
      { v: pct(v, T.t.all), mc: MC.notNewWhole, say: `${v} out of all ${T.t.all} is a share of everybody. Only the ${Cc.group} are the whole here.` },
      { v, exact: true, mc: MC.fixed, say: `${v} is a count, not a percent. Divide it by its whole first.` },
    ], `Right: the column total, ${w}, is the whole.`, `“Of the ${Cc.group}”: their column total is the whole.`),
  };
};
const matchQuestion: Gen = (R, n) => {
  const T = tb(R, { shape: [2, 2], friendly: R() < 0.5 });
  const r = int(R, 0, 1), c = int(R, 0, 1), v = T.cells[r]![c]!, by = pick(R, ['row', 'col'] as const);
  const w = by === 'row' ? T.t.row[r]! : T.t.col[c]!, ex = pct(v, w);
  const Rr = T.x.rows.cats[r]!, Cc = T.x.cols.cats[c]!;
  const qRow = `Of the ${Rr.group}, what percent ${Cc.has}?`, qCol = `Of the ${Cc.group}, what percent ${Rr.has}?`, qAll = `What percent of all ${T.t.all} ${T.x.who} ${Rr.has} and ${Cc.has}?`;
  const ch = choose(R, [
    { t: qRow, ok: by === 'row', mc: by === 'col' ? MC.inverse : undefined, say: by === 'row' ? `Yes: ${w} is the ${Rr.label} row total, so the row is the whole.` : `That question would divide by the ${Rr.label} row total, ${T.t.row[r]}. Kai divided by a column total.` },
    { t: qCol, ok: by === 'col', mc: by === 'row' ? MC.inverse : undefined, say: by === 'col' ? `Yes: ${w} is the ${Cc.label} column total, so the column is the whole.` : `That question would divide by the ${Cc.label} column total, ${T.t.col[c]}. Kai divided by a row total.` },
    { t: qAll, mc: MC.subgroupJoint, say: `“Of all ${T.t.all}” would divide by ${T.t.all}, the grand total. Kai divided by ${w}, one group.` },
  ]);
  return {
    id: `matchQuestion-${n}`, family: 'matchQuestion',
    prompt: `${intro(T)} Kai worked out ${v} ÷ ${w} ${htmlEq(ex)} ${P(ex)}. Which question does that answer?`,
    board: divTex(v, w), input: 'choice', ...ch,
    picture: { pic: { kind: 'table', table: tableOf(T, by === 'row' ? 'col' : 'row') }, focus: { whole: { kind: by, i: by === 'row' ? r : c }, part: { r, c } }, steps: [`${w} = \\text{${by === 'row' ? 'row' : 'column'} total}`] },
    solution: [`The bottom number is the whole. ${w} is the <b class="a">${by === 'row' ? `${Rr.label} row` : `${Cc.label} column`}</b> total.`, `So the question is about that group: “${by === 'row' ? qRow : qCol}”`],
  };
};

// ======================= 2 joint-relative-frequency =======================
const jointPct: Gen = (R, n, sg) => {
  const T = tb(R, { shape: shapeFor(R, true), friendly: R() < 0.4, oddTotal: sg === 'joint-relative-frequency' });
  const r = int(R, 0, T.nR - 1), c = int(R, 0, T.nC - 1), v = T.cells[r]![c]!, N = T.t.all, ex = pct(v, N);
  const Rr = T.x.rows.cats[r]!, Cc = T.x.cols.cats[c]!;
  return {
    id: `jointPct-${n}`, family: 'jointPct',
    prompt: `${intro(T)} What percent of all ${N} ${T.x.who} ${Rr.has} and ${Cc.has}? That is a joint relative frequency.${roundHint(ex)}`,
    board: BOARD_PCT, input: 'num', unit: '%', answer: { kind: 'num', v: round(ex, 1) },
    picture: { pic: { kind: 'table', table: tableOf(T, null) }, focus: { whole: { kind: 'all', i: 0 }, part: { r, c } }, steps: [`\\text{whole} = ${N}`, divTex(v, N)] },
    solution: [`“Of all ${N}”: the grand total <b class="a">${N}</b> is the whole.`, `The part is one cell, ${Rr.label} and ${Cc.label}: <b class="b">${v}</b>.`, `${v} ÷ ${N} ${htmlEq(ex)} <b class="s">${P(ex)}</b>.`],
    check: pctCheck(ex, 1, [
      { v: pct(v, T.t.row[r]!), mc: MC.subgroupJoint, say: `That uses the ${T.t.row[r]} ${Rr.group} as the whole. A joint percent is out of everybody: ${N}.` },
      { v: pct(v, T.t.col[c]!), mc: MC.subgroupJoint, say: `That uses the ${T.t.col[c]} ${Cc.group} as the whole. A joint percent is out of everybody: ${N}.` },
      { v, exact: true, mc: MC.fixed, say: `${v} is the count. For a percent of all ${N}, divide by ${N}.` },
    ], `Right: one cell out of the grand total.`, `Joint means out of everybody: divide the cell by ${N}.`),
  };
};
const jointRound: Gen = (R, n) => {
  let cells: Grid = [], sum = 100;
  for (let k = 0; k < 400; k++) {
    cells = [[int(R, 15, 140), int(R, 15, 140)], [int(R, 15, 140), int(R, 15, 140)]];
    const N = totals(cells).all, js = cells.flat().map(v => round(pct(v, N), 1));
    sum = round(js.reduce((s, v) => s + v, 0), 1);
    if (sum !== 100 && new Set(cells.flat()).size === 4) break;
  }
  const x = pick(R, CONTEXTS_2x2), N = totals(cells).all, J = cells.map(r => r.map(v => round(pct(v, N), 1)));
  const table: TableSpec = { rows: x.rows.cats.map(c => c.label), cols: x.cols.cats.map(c => c.label), vals: [[J[0]![0]!, J[0]![1]!, null], [J[1]![0]!, J[1]![1]!, null], [null, null, sum]], margins: true, fmt: 'pct', d: 1, tint: null };
  const ch = choose(R, [
    { t: 'Nothing: rounding each cell can leave the total off by a tenth.', ok: true, say: 'Right: the unrounded shares add to exactly 100%.' },
    { t: 'Change the last cell so the total is 100%.', mc: MC.forceClose, say: 'That makes one cell wrong on purpose. Each cell is right to the tenth.' },
    { t: 'Start over: a cell must be wrong.', mc: MC.roundedSum, say: `Every cell is right. Rounded parts can add to ${fmt(sum)}%.` },
    { t: 'Divide each cell by its row total instead.', mc: MC.subgroupJoint, say: 'Then it is not a joint table: joint percents are out of everybody.' },
  ]);
  return {
    id: `jointRound-${n}`, family: 'jointRound',
    prompt: `Lee’s joint table of ${N} ${x.who}, each cell rounded to the tenth, adds up to ${fmt(sum)}%. What should Lee do?`,
    board: `\\text{sum} = ${texPct(sum)}`, input: 'choice', ...ch,
    picture: { pic: { kind: 'table', table }, focus: { glows: [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 1, c: 0 }, { r: 1, c: 1 }] }, steps: [J.flat().map(v => fmt(v)).join(' + '), `= ${texPct(sum)} \\text{ rounded}`, `\\text{exact: } 100\\%`] },
    solution: [`The exact shares (${cells.flat().join(', ')} of ${N}) add to 100%; each rounded cell can be off a little, so the sum can be ${fmt(sum)}%.`],
  };
};

// ======================= 3 marginal-relative-frequency =======================
const marginalPct: Gen = (R, n) => {
  const T = tb(R, { shape: [2, 2], friendly: R() < 0.7 });
  const c = int(R, 0, 1), m = T.t.col[c]!, N = T.t.all, ex = pct(m, N), Cc = T.x.cols.cats[c]!;
  const avg = (pct(T.cells[0]![c]!, T.t.row[0]!) + pct(T.cells[1]![c]!, T.t.row[1]!)) / 2;
  return {
    id: `marginalPct-${n}`, family: 'marginalPct',
    prompt: `${intro(T)} What percent of all ${N} ${T.x.who} ${Cc.has}? That is a marginal relative frequency.${roundHint(ex)}`,
    board: BOARD_PCT, input: 'num', unit: '%', answer: { kind: 'num', v: round(ex, 1) },
    picture: { pic: { kind: 'table', table: tableOf(T, null) }, focus: { whole: { kind: 'all', i: 0 }, part: { r: 2, c } }, steps: [`\\text{whole} = ${N}`, divTex(m, N)] },
    solution: [`The part is the whole ${Cc.label} column: its total, <b class="b">${m}</b>, in the margin.`, `The whole is everybody: <b class="a">${N}</b>.`, `${m} ÷ ${N} ${htmlEq(ex)} <b class="s">${P(ex)}</b>.`],
    check: pctCheck(ex, 1, [
      { v: avg, mc: MC.unweighted, say: `That averages the two row percents. The rows are different sizes (${T.t.row[0]} and ${T.t.row[1]}), so the plain average is off. Use the margin: ${m} of ${N}.` },
      { v: pct(T.cells[0]![c]!, N), say: `That is only the ${T.x.rows.cats[0]!.label} row’s share. The question is about all ${Cc.group}: use the column total.` },
      { v: m, exact: true, mc: MC.fixed, say: `${m} is the count in the margin. As a percent of ${N}, divide by ${N}.` },
    ], 'Right: the margin over the grand total.', `Use the column total in the margin, out of all ${N}.`),
  };
};
function jointPercents(R: () => number, mode: 'whole' | 'tenth'): number[] {
  for (;;) {
    const unit = mode === 'whole' ? 1 : 0.1, lo = mode === 'whole' ? 6 : 60, total = mode === 'whole' ? 100 : 1000;
    const a = int(R, lo, 45 * (mode === 'whole' ? 1 : 10)), b = int(R, lo, 40 * (mode === 'whole' ? 1 : 10)), c = int(R, lo, 35 * (mode === 'whole' ? 1 : 10)), d = total - a - b - c;
    if (d < lo) continue;
    const v = [a, b, c, d].map(x => round(x * unit, 1));
    if (new Set(v).size === 4) return v;
  }
}
const marginalFromJoint: Gen = (R, n) => {
  const x = pick(R, CONTEXTS_2x2), J = jointPercents(R, R() < 0.5 ? 'whole' : 'tenth');
  const g: number[][] = [[J[0]!, J[1]!], [J[2]!, J[3]!]];
  const byRow = R() < 0.5, i = int(R, 0, 1);
  const parts = byRow ? g[i]! : [g[0]![i]!, g[1]![i]!], ex = round(parts[0]! + parts[1]!, 1);
  const cat = byRow ? x.rows.cats[i]! : x.cols.cats[i]!;
  const vals: (number | null)[][] = [[g[0]![0]!, g[0]![1]!, null], [g[1]![0]!, g[1]![1]!, null], [null, null, 100]];
  const hide = [byRow ? `${i},2` : `2,${i}`];
  vals[byRow ? i : 2]![byRow ? 2 : i] = ex;
  return {
    id: `marginalFromJoint-${n}`, family: 'marginalFromJoint',
    prompt: `This table shows joint relative frequencies: every cell is a percent of all the ${x.who} surveyed. What percent of all the ${x.who} ${cat.has}?`,
    board: `${fmt(parts[0]!)}\\% + ${fmt(parts[1]!)}\\% = \\;?`, input: 'num', unit: '%', answer: { kind: 'num', v: ex },
    picture: { pic: { kind: 'table', table: { rows: x.rows.cats.map(c => c.label), cols: x.cols.cats.map(c => c.label), vals, margins: true, fmt: 'pct', d: 1, hide, tint: null } }, focus: { whole: { kind: 'all', i: 0 }, glows: byRow ? [{ r: i, c: 0 }, { r: i, c: 1 }] : [{ r: 0, c: i }, { r: 1, c: i }] }, steps: [`${fmt(parts[0]!)}\\% + ${fmt(parts[1]!)}\\% = ${texPct(ex)}`] },
    solution: [`The ${cat.label} ${byRow ? 'row' : 'column'} has two cells, each already a percent of everybody.`, `Add them: ${P(parts[0]!)} + ${P(parts[1]!)} = <b class="s">${P(ex)}</b>.`],
    check: pctCheck(ex, 1, [
      { v: round((parts[0]! + parts[1]!) / 2, 2), mc: MC.unweighted, say: 'That averages the two cells. Both are already percents of everybody, so the margin is their sum.' },
      { v: parts[0]!, say: 'That is one cell only. The margin collects the whole row or column.' },
      { v: parts[1]!, say: 'That is one cell only. The margin collects the whole row or column.' },
    ], 'Right: joint percents add up to the marginal percent.', `Add the joint percents of the ${cat.label} ${byRow ? 'row' : 'column'}.`),
  };
};
const weightedTrap: Gen = (R, n) => {
  let T: Tb;
  do T = tb(R, { shape: [2, 2], friendly: true, assoc: 'pos' }); while (Math.abs(T.t.row[0]! - T.t.row[1]!) < 40);
  const c = 0, Cc = T.x.cols.cats[c]!, p0 = pct(T.cells[0]![c]!, T.t.row[0]!), p1 = pct(T.cells[1]![c]!, T.t.row[1]!);
  const ex = pct(T.t.col[c]!, T.t.all), avg = (p0 + p1) / 2;
  const name = pick(R, ['Sam', 'Ana', 'Jay', 'Noor']);
  return {
    id: `weightedTrap-${n}`, family: 'weightedTrap',
    prompt: `${intro(T)} ${P(p0)} of the ${T.x.rows.cats[0]!.group} and ${P(p1)} of the ${T.x.rows.cats[1]!.group} ${Cc.has}. ${name} says: “So ${P(avg)} of all of them ${Cc.has}.” What percent of all ${T.t.all} really ${Cc.has}?${roundHint(ex)}`,
    board: `\\frac{${fmt(p0)} + ${fmt(p1)}}{2} = ${fmt(avg)}\\;?`, input: 'num', unit: '%', answer: { kind: 'num', v: round(ex, 1) },
    picture: { pic: { kind: 'table', table: tableOf(T, 'col'), bars: { spec: rowBars(T), orient: 'h', atStart: true } }, focus: { whole: { kind: 'all', i: 0 }, part: { r: 2, c } }, steps: [`${T.cells[0]![c]} + ${T.cells[1]![c]} = ${T.t.col[c]}`, divTex(T.t.col[c]!, T.t.all)] },
    solution: [`The two groups are different sizes (${T.t.row[0]} and ${T.t.row[1]}), so a plain average of their percents is off.`, `Count them: ${T.cells[0]![c]} + ${T.cells[1]![c]} = ${T.t.col[c]} ${T.x.who} ${Cc.has}.`, `${T.t.col[c]} ÷ ${T.t.all} ${htmlEq(ex)} <b class="s">${P(ex)}</b>.`],
    check: pctCheck(ex, 1, [
      { v: avg, mc: MC.unweighted, say: `That is ${name}’s plain average. The bigger group counts more: use the column total ${T.t.col[c]} out of ${T.t.all}.` },
      { v: p0 + p1, say: 'Percents of different groups don’t add up. Count the people instead.' },
    ], `Right: ${T.t.col[c]} of ${T.t.all}. The plain average was off because the groups differ in size.`, `Add the counts in the ${Cc.label} column, then divide by ${T.t.all}.`),
  };
};

// ======================= 4 name-the-whole =======================
type Kind3 = 'joint' | 'marginal' | 'conditional';
const nameType: Gen = (R, n) => {
  const T = tb(R, { shape: [2, 2], friendly: true });
  const r = int(R, 0, 1), c = int(R, 0, 1), Rr = T.x.rows.cats[r]!, Cc = T.x.cols.cats[c]!, Cc2 = T.x.cols.cats[1 - c]!, N = T.t.all;
  const kind = pick(R, ['joint', 'joint', 'marginal', 'conditional', 'conditional'] as Kind3[]);
  const trap = R() < 0.5;
  let st = '', whole = N, part = T.cells[r]![c]!, wk: WholeKind = 'all', wi = 0, partAt = { r, c };
  if (kind === 'joint') st = trap ? `${P(pct(part, N))} of all ${N} ${T.x.who} are ${Rr.group} who ${Cc.has}.` : `${P(pct(part, N))} of all ${N} ${T.x.who} ${Rr.has} and ${Cc.has}.`;
  else if (kind === 'marginal') { part = T.t.col[c]!; partAt = { r: 2, c }; st = `${P(pct(part, N))} of all ${N} ${T.x.who} ${Cc.has}.`; }
  else { whole = T.t.row[r]!; wk = 'row'; wi = r; const p1 = pct(part, whole); st = trap ? `Of the ${whole} ${Rr.group}, ${P(p1)} ${Cc.has} and ${P(100 - p1)} ${Cc2.has}.` : `Of the ${whole} ${Rr.group}, ${P(p1)} ${Cc.has}.`; }
  const hasAnd = / and /.test(st);
  const opts: Opt[] = [
    { t: `Joint: a part of all ${N}, with two conditions`, ok: kind === 'joint', mc: kind === 'conditional' ? (hasAnd ? MC.keywords : MC.notNewWhole) : undefined, say: kind === 'joint' ? 'Yes: out of everybody, one cell.' : kind === 'conditional' ? `The whole here is the ${whole} ${Rr.group}, one group, not all ${N}. ${hasAnd ? 'The word “and” doesn’t make it joint.' : ''}` : `This has one condition (${Cc.has}), not two.` },
    { t: `Marginal: a part of all ${N}, with one condition`, ok: kind === 'marginal', mc: kind === 'joint' ? MC.oneLabel : kind === 'conditional' ? MC.notNewWhole : undefined, say: kind === 'marginal' ? 'Yes: one whole margin out of everybody.' : kind === 'joint' ? `Two conditions here: ${Rr.label} and ${Cc.label}, one cell.` : `The whole is one group, the ${whole} ${Rr.group}, not all ${N}.` },
    { t: 'Conditional: a part of one group only', ok: kind === 'conditional', mc: kind === 'joint' ? (hasAnd ? MC.subgroupJoint : MC.keywords) : kind === 'marginal' ? MC.subgroupJoint : undefined, say: kind === 'conditional' ? `Yes: the whole is the ${whole} ${Rr.group}.` : `The whole is all ${N} ${T.x.who}, not one group.${kind === 'joint' && !hasAnd ? ' No “and”, but still two conditions: joint.' : ''}` },
  ];
  return {
    id: `nameType-${n}`, family: 'nameType',
    prompt: `${intro(T)} “${st}” What kind of relative frequency is that?`,
    board: '\\text{whole} = \\;?', input: 'choice', ...choose(R, opts, true),
    picture: { pic: { kind: 'table', table: tableOf(T, null) }, focus: { whole: { kind: wk, i: wi }, part: partAt }, steps: [`\\text{whole} = ${whole}`, divTex(part, whole)] },
    solution: [`Ask: out of whom? Here the whole is <b class="a">${wk === 'all' ? `all ${N}` : `the ${whole} ${Rr.group}`}</b>.`, kind === 'joint' ? 'Out of everybody, with two conditions: joint.' : kind === 'marginal' ? 'Out of everybody, with one condition: marginal.' : 'Out of one group only: conditional.'],
  };
};
const nameWhole: Gen = (R, n) => {
  const T = tb(R, { shape: [2, 2], friendly: true });
  const r = int(R, 0, 1), c = int(R, 0, 1), Rr = T.x.rows.cats[r]!, Cc = T.x.cols.cats[c]!, N = T.t.all, v = T.cells[r]![c]!;
  const kind = pick(R, ['joint', 'marginal', 'row', 'col', 'row', 'col'] as const);
  const q = kind === 'joint' ? `What percent of all the ${T.x.who} ${Rr.has} and ${Cc.has}?` : kind === 'marginal' ? `What percent of all the ${T.x.who} ${Cc.has}?`
    : kind === 'row' ? pick(R, [`Of the ${Rr.group}, what percent ${Cc.has}?`, `Among the ${Rr.group}, what percent ${Cc.has}?`]) : pick(R, [`Of the ${Cc.group}, what percent ${Rr.has}?`, `What percent of the ${Cc.group} ${Rr.has}?`]);
  const right = kind === 'row' ? 'row' : kind === 'col' ? 'col' : 'all';
  const opts: Opt[] = [
    { t: `All ${N} ${T.x.who}`, ok: right === 'all', mc: right !== 'all' ? MC.notNewWhole : undefined, say: right === 'all' ? `Yes: “of all” means the grand total, ${N}.` : `The question narrows it to one group first, so that group is the 100%.` },
    { t: `The ${T.t.row[r]} ${Rr.group}`, ok: right === 'row', mc: right === 'col' ? MC.inverse : right !== 'row' ? MC.subgroupJoint : undefined, say: right === 'row' ? `Yes: “of the ${Rr.group}” makes them the 100%.` : right === 'col' ? `Read the “of” phrase: it names the ${Cc.group}, not the ${Rr.group}.` : `“Of all” keeps everybody as the whole.` },
    { t: `The ${T.t.col[c]} ${Cc.group}`, ok: right === 'col', mc: right === 'row' ? MC.inverse : right !== 'col' ? MC.subgroupJoint : undefined, say: right === 'col' ? `Yes: “of the ${Cc.group}” makes them the 100%.` : right === 'row' ? `Read the “of” phrase: it names the ${Rr.group}, not the ${Cc.group}.` : `“Of all” keeps everybody as the whole.` },
    { t: `The ${v} who ${Rr.has} and ${Cc.has}`, mc: MC.partAsWhole, say: `${v} is a part (one cell). The whole is the group the part is taken from.` },
  ];
  const [wk, wi] = right === 'row' ? ['row', r] as const : right === 'col' ? ['col', c] as const : ['all', 0] as const;
  const part = kind === 'marginal' ? { r: 2, c } : { r, c }, pv = kind === 'marginal' ? T.t.col[c]! : v, wv = right === 'row' ? T.t.row[r]! : right === 'col' ? T.t.col[c]! : N;
  return {
    id: `nameWhole-${n}`, family: 'nameWhole',
    prompt: `${intro(T)} “${q}” What is the whole (the 100%) for this percent?`,
    board: '\\text{whole} = \\;?', input: 'choice', ...choose(R, opts, true),
    picture: { pic: { kind: 'table', table: tableOf(T, null) }, focus: { whole: { kind: wk, i: wi }, part }, steps: [`\\text{whole} = ${wv}`, divTex(pv, wv)] },
    solution: [right === 'all' ? `“Of all the ${T.x.who}”: the whole is the grand total, <b class="a">${N}</b>.` : `The “of” phrase names the group: <b class="a">${right === 'row' ? `the ${T.t.row[r]} ${Rr.group}` : `the ${T.t.col[c]} ${Cc.group}`}</b>.`, `The percent: ${pv} ÷ ${wv} ${htmlEq(pct(pv, wv))} ${P(pct(pv, wv))}.`],
  };
};

// ======================= 5 conditional-from-joint =======================
function jointTable(R: () => number, sg?: string): { x: Ctx; g: number[][]; row: number[]; col: number[]; d: number } {
  const x = pick(R, CONTEXTS_2x2);
  const mode = sg === 'conditional-from-joint' && R() < 0.3 ? 'hundredth' : R() < 0.55 ? 'whole' : 'tenth';
  let J: number[];
  if (mode === 'hundredth') {
    // a survey of 400: every joint percent is a multiple of 0.25
    for (;;) { const a = int(R, 20, 160), b = int(R, 20, 140), c = int(R, 20, 120), d = 400 - a - b - c; if (d >= 20 && new Set([a, b, c, d]).size === 4) { J = [a, b, c, d].map(v => v / 4); break; } }
  } else J = jointPercents(R, mode);
  const g = [[J[0]!, J[1]!], [J[2]!, J[3]!]];
  return { x, g, row: g.map(r => round(r[0]! + r[1]!, 2)), col: [round(g[0]![0]! + g[1]![0]!, 2), round(g[0]![1]! + g[1]![1]!, 2)], d: mode === 'hundredth' ? 2 : 1 };
}
const rfSpec = (x: Ctx, g: number[][], row: number[], col: number[], d: number, hide?: string[]): TableSpec => ({
  rows: x.rows.cats.map(c => c.label), cols: x.cols.cats.map(c => c.label), vals: [[g[0]![0]!, g[0]![1]!, row[0]!], [g[1]![0]!, g[1]![1]!, row[1]!], [col[0]!, col[1]!, 100]], margins: true, fmt: 'pct', d, hide, tint: null,
});
const condFromJoint: Gen = (R, n, sg) => {
  const { x, g, row, col, d } = jointTable(R, sg);
  const r = int(R, 0, 1), c = int(R, 0, 1), byRow = R() < 0.5, j = g[r]![c]!, m = byRow ? row[r]! : col[c]!, ex = pct(j, m);
  const Rr = x.rows.cats[r]!, Cc = x.cols.cats[c]!;
  const q = byRow ? `Of the ${Rr.group}, what percent ${Cc.has}?` : `Of the ${Cc.group}, what percent ${Rr.has}?`;
  return {
    id: `condFromJoint-${n}`, family: 'condFromJoint',
    prompt: `This table shows joint relative frequencies: each cell is a percent of all the ${x.who} surveyed. ${q}${roundHint(ex)}`,
    board: `\\frac{\\text{joint}}{\\text{marginal}} = \\;?`, input: 'num', unit: '%', answer: { kind: 'num', v: round(ex, 1) },
    picture: { pic: { kind: 'table', table: rfSpec(x, g, row, col, d) }, focus: { whole: { kind: byRow ? 'row' : 'col', i: byRow ? r : c }, part: { r, c } }, steps: [`${frac(fmt(j, 2) + '\\%', fmt(m, 2) + '\\%')} ${texEq(ex)} ${texPct(ex)}`] },
    solution: [`The group is the ${byRow ? Rr.label + ' row' : Cc.label + ' column'}: <b class="a">${fmt(m, 2)}%</b> of everybody. That is the new whole.`, `The part is the cell: <b class="b">${fmt(j, 2)}%</b> of everybody.`, `${fmt(j, 2)} ÷ ${fmt(m, 2)} ${htmlEq(ex)} <b class="s">${P(ex)}</b>. (Percents of the same everybody divide like counts.)`],
    check: pctCheck(ex, 1, [
      { v: j, mc: MC.notNewWhole, say: `${fmt(j, 2)}% is a share of everybody. “Of the ${byRow ? Rr.group : Cc.group}” makes that group the whole: divide by its ${fmt(m, 2)}%.` },
      { v: pct(j, byRow ? col[c]! : row[r]!), mc: MC.inverse, say: `That divides by the ${byRow ? Cc.label + ' column' : Rr.label + ' row'}. The question’s group is the ${byRow ? Rr.label + ' row' : Cc.label + ' column'}.` },
      { v: m, say: `${fmt(m, 2)}% is the size of the whole group. The question asks for the part inside it.` },
    ], 'Right: joint ÷ marginal.', `Divide the cell by the margin of the group the question names.`),
  };
};
const countUnknown: Gen = (R, n) => {
  const { x, g, row, col } = jointTable(R, 'whole');
  const r = int(R, 0, 1), c = int(R, 0, 1), j = g[r]![c]!, Rr = x.rows.cats[r]!, Cc = x.cols.cats[c]!;
  const given = R() < 0.5;
  const N = pick(R, [200, 300, 400, 500, 600, 800]);
  const cnt = (j * N) / 100;
  const ok = given && Number.isInteger(cnt);
  const variantGiven = ok;
  const q = variantGiven ? `The survey asked ${N} ${x.who}. How many of them ${Rr.has} and ${Cc.has}?` : `How many of the ${x.who} surveyed ${Rr.has} and ${Cc.has}?`;
  const opts: Opt[] = variantGiven ? [
    { t: String(cnt), ok: true, say: `Right: ${fmt(j)}% of ${N} = ${cnt}.` },
    { t: String(fmt(j)), mc: MC.fixed, say: `${fmt(j)} is the percent. Out of ${N} people that is ${fmt(j)}% of ${N}, not ${fmt(j)} people.` },
    { t: String((row[r]! * N) / 100), mc: MC.totalAsCell, say: `That is the whole ${Rr.label} row. The question asks for one cell: ${Rr.label} and ${Cc.label}.` },
    { t: 'Can’t tell without more information', say: `The survey size is given: ${N}. Take ${fmt(j)}% of it.` },
  ] : [
    { t: 'Can’t tell: the table doesn’t say how many were surveyed', ok: true, say: 'Right. Percents alone don’t give counts; you would need the total.' },
    { t: String(fmt(j)), mc: MC.fixed, say: `${fmt(j)}% is not ${fmt(j)} people unless exactly 100 were asked. The table doesn’t say.` },
    { t: String(fmt(j * 2)), mc: MC.fixed, say: 'That guesses 200 people were asked. The table doesn’t say how many.' },
    { t: String(fmt(row[r]!)), mc: MC.totalAsCell, say: 'That is the row margin, and it is a percent anyway. Without the total you can’t get a count.' },
  ];
  if (new Set(opts.map(o => o.t)).size < opts.length) opts.splice(2, 1);
  return {
    id: `countUnknown-${n}`, family: 'countUnknown',
    prompt: `This table shows joint relative frequencies: each cell is a percent of all the ${x.who} surveyed. ${q}`,
    board: variantGiven ? `${fmt(j)}\\% \\text{ of } ${N} = \\;?` : `${fmt(j)}\\% \\text{ of } \\;? = \\;?`, input: 'choice', ...choose(R, opts),
    picture: { pic: { kind: 'table', table: rfSpec(x, g, row, col, 1) }, focus: { part: { r, c } }, steps: variantGiven ? [`${fmt(j / 100, 4)} \\times ${N} = ${cnt}`] : [`${fmt(j)}\\% \\text{ of } \\;? \\text{ is unknown}`] },
    solution: variantGiven ? [`Each cell is a percent of ALL the ${x.who} surveyed: the whole is ${N}.`, `${fmt(j)}% of the ${N} ${x.who}: ${fmt(j / 100, 4)} × ${N} = <b class="s">${cnt}</b>.`] : ['A percent is a share of some total. The table never says how many were surveyed, so no count can be found.'],
  };
};

// ======================= 6 segmented-bar-construct =======================
const barSegment: Gen = (R, n) => {
  const byRow = R() < 0.6;
  const T = tb(R, { shape: byRow ? (R() < 0.7 ? [2, 2] : [2, 3]) : [2, R() < 0.7 ? 2 : 3], friendly: R() < 0.7 });
  const nG = byRow ? T.nR : T.nC, gI = int(R, 0, nG - 1), sI = int(R, 0, (byRow ? T.nC : T.nR) - 1);
  const r = byRow ? gI : sI, c = byRow ? sI : gI, v = T.cells[r]![c]!, w = byRow ? T.t.row[r]! : T.t.col[c]!, ex = pct(v, w);
  const G = byRow ? T.x.rows.cats[gI]! : T.x.cols.cats[gI]!, S = byRow ? T.x.cols.cats[sI]! : T.x.rows.cats[sI]!;
  const spec = byRow ? rowBars(T, { hideBars: [gI] }) : colBars(T, { hideBars: [gI] });
  return {
    id: `barSegment-${n}`, family: 'barSegment',
    prompt: `${intro(T)} You draw a segmented bar graph with one 100% bar for each ${byRow ? 'row' : 'column'} group. How long is the <b class="b">${S.label}</b> segment of the <b class="a">${G.label}</b> bar, in percent?${roundHint(ex)}`,
    board: BOARD_PCT, input: 'num', unit: '%', answer: { kind: 'num', v: round(ex, 1) },
    picture: { pic: { kind: 'table', table: tableOf(T, byRow ? 'col' : 'row'), bars: { spec, orient: byRow ? 'h' : 'v', atStart: true } }, focus: { whole: { kind: byRow ? 'row' : 'col', i: gI }, part: { r, c }, seg: { g: gI, s: sI } }, steps: [`\\text{whole} = ${w}`, divTex(v, w)] },
    solution: [`Each bar is 100% of its own group: the ${G.label} bar is the <b class="a">${w}</b> ${G.group}.`, `The ${S.label} segment is ${v} of them: ${v} ÷ ${w} ${htmlEq(ex)} <b class="s">${P(ex)}</b> of the bar.`],
    check: pctCheck(ex, 1, [
      { v, exact: true, mc: MC.barsCounts, say: `${v} is the count. In a 100% bar every segment is a percent of its own group (${w}).` },
      { v: pct(v, T.t.all), mc: MC.notNewWhole, say: `That is out of all ${T.t.all}. In a 100% bar the whole is the bar’s own group, ${w}.` },
      { v: pct(v, byRow ? T.t.col[c]! : T.t.row[r]!), mc: MC.inverse, say: `That uses the other direction’s total. The ${G.label} bar is the ${G.group}: divide by ${w}.` },
    ], 'Right: a percent of the bar’s own group.', `Divide the cell by the ${G.label} total.`),
  };
};
const pickGraph: Gen = (R, n) => {
  const T = tb(R, { shape: [2, 2], friendly: true, assoc: 'pos' });
  const ok = rowBars(T, { labels: false });
  const mx = Math.max(...T.t.row);
  const counts: BarsSpec = { ...ok, scale: T.t.row.map(t => t / mx) };
  const swapped: BarsSpec = { ...ok, order: [[0, 1], [1, 0]] };
  const order = shuffle(R, [0, 1, 2]), names = ['A', 'B', 'C'];
  const graphs = order.map(k => [ok, counts, swapped][k]!);
  const at = (k: number) => names[order.indexOf(k)]!;
  const opts: Opt[] = [
    { t: `Graph ${at(0)}`, ok: true, say: 'Yes: both bars full length (100% of each group), same segment order.' },
    { t: `Graph ${at(1)}`, mc: MC.barsCounts, say: 'Those bars are drawn with counts: the bigger group gets a longer bar. In a 100% bar graph every bar is full length.' },
    { t: `Graph ${at(2)}`, mc: MC.segOrder, say: 'The segments are in a different order in the second bar, so the bars are hard to compare. Keep one order in every bar.' },
  ];
  return {
    id: `pickGraph-${n}`, family: 'pickGraph',
    prompt: `${intro(T)} Which graph is a correct segmented (100%) bar graph comparing the ${T.x.rows.cats[0]!.label} and ${T.x.rows.cats[1]!.label} rows?`,
    board: '\\text{each bar} = 100\\%', input: 'choice', ...choose(R, opts.sort((a, b) => a.t.localeCompare(b.t)), true),
    picture: { pic: { kind: 'graphs', table: tableOf(T, 'col'), graphs, names }, focus: { bar: order.indexOf(0) }, steps: [divTex(T.cells[0]![0]!, T.t.row[0]!), divTex(T.cells[1]![0]!, T.t.row[1]!)] },
    solution: ['A 100% bar graph: every bar is one group as 100%, so every bar is the same length.', 'The segments come in the same order in every bar, matching the key.'],
  };
};

// ======================= 7 segmented-bar-read =======================
const readSeg: Gen = (R, n) => {
  const G = 2 + (R() < 0.35 ? 1 : 0), vert = R() < 0.65, step = vert ? 5 : 10;
  const x = pick(R, G === 3 ? CONTEXTS_3.filter(q => q.id !== 'movie') : CONTEXTS_3);
  const groups = G === 3 ? ['Grade 6', 'Grade 7', 'Grade 8'] : x.rows.cats.map(c => c.label);
  const pcts = Array.from({ length: G }, () => {
    const a = step * int(R, 10 / step, 50 / step), b = step * int(R, Math.ceil((a + 15) / step), Math.floor(85 / step));
    return [a, b - a, 100 - b];
  });
  const g = int(R, 0, G - 1), [a, mid] = [pcts[g]![0]!, pcts[g]![1]!], top = a + mid;
  const Gname = G === 3 ? ['sixth graders', 'seventh graders', 'eighth graders'][g]! : x.rows.cats[g]!.group;
  const Cc = x.cols.cats[1]!;
  return {
    id: `readSeg-${n}`, family: 'readSeg',
    prompt: `The graph shows how the ${x.who} in each group answered. Read it off the scale: what percent of the ${Gname} ${Cc.has}?`,
    board: '\\text{top} - \\text{bottom} = \\;?', input: 'num', unit: '%', answer: { kind: 'num', v: mid },
    picture: { pic: { kind: 'bars', bars: { groups, cats: x.cols.cats.map(c => c.label), pcts, labels: false, axis: 'grid' }, orient: vert ? 'v' : 'h' }, focus: { seg: { g, s: 1 } }, steps: [`${top}\\% - ${a}\\% = ${mid}\\%`] },
    solution: [`The ${Cc.label} segment of the ${groups[g]} bar runs from ${a}% to ${top}%.`, `Its length is the difference: ${top} − ${a} = <b class="s">${mid}%</b>.`],
    check: pctCheck(mid, 0, [
      { v: top, mc: MC.endReading, say: `${top}% is where the segment ends, not how long it is. It starts at ${a}%: subtract.` },
      { v: a, say: `${a}% is where the segment starts. Its length is top minus bottom.` },
      { v: 100 - top, say: 'That is the segment after it. Find the middle one.' },
    ], 'Right: top minus bottom.', 'Read where the segment starts and ends, and subtract.', 1.01),
  };
};
const readSentence: Gen = (R, n) => {
  const three = R() < 0.4;
  const T = tb(R, { shape: three ? [2, 3] : [2, 2], friendly: true });
  const g = int(R, 0, 1), s = int(R, 0, T.nC - 1), p = pct(T.cells[g]![s]!, T.t.row[g]!);
  const G = T.x.rows.cats[g]!, S = T.x.cols.cats[s]!;
  const opts: Opt[] = [
    { t: `${P(p)} of the ${G.group} ${S.has}.`, ok: true, say: `Yes: each bar is one group, the ${G.group}, as 100%.` },
    { t: `${P(p)} of the ${S.group} ${G.has}.`, mc: MC.inverse, say: `That swaps the group and the answer. The bar is the ${G.group}; the segment is the part of them who ${S.has}.` },
    { t: `${P(p)} of all the ${T.x.who} ${G.has} and ${S.has}.`, mc: MC.subgroupJoint, say: `The bar is 100% of the ${G.group} only, not of everybody.` },
    { t: `${fmt(p)} ${G.group} ${S.has}.`, mc: MC.fixed, say: `${fmt(p)} is a percent of the group, not a number of people.` },
  ];
  return {
    id: `readSentence-${n}`, family: 'readSentence',
    prompt: `In this segmented bar graph, the <b class="b">${S.label}</b> segment of the <b class="a">${G.label}</b> bar is ${P(p)}. Which sentence says what it means?`,
    board: `${texPct(p)} \\text{ of } \\;?`, input: 'choice', ...choose(R, opts),
    picture: { pic: { kind: 'bars', bars: rowBars(T), orient: R() < 0.5 ? 'h' : 'v' }, focus: { bar: g, seg: { g, s } }, steps: [`\\text{bar} = 100\\% \\text{ of its group}`] },
    solution: [`Every bar is one group as 100%: this one is the <b class="a">${G.group}</b>.`, `So the segment says: ${P(p)} of the ${G.group} ${S.has}.`],
  };
};

// ======================= 8 segmented-bar-limits =======================
const moreWho: Gen = (R, n) => {
  const x = pick(R, CONTEXTS_2x2), variant = pick(R, ['none', 'flip', 'keep'] as const);
  const pA = 10 * int(R, 3, 6), pB = pA - 10 * int(R, 1, 2);
  let nA = 0, nB = 0, cA = 0, cB = 0;
  for (;;) {
    nA = 20 * int(R, 2, 12); nB = 20 * int(R, 2, 12);
    if (variant === 'flip') { nA = 20 * int(R, 2, 4); nB = nA * int(R, 3, 4); }
    if (variant === 'keep') { nB = 20 * int(R, 2, 4); nA = nB * int(R, 2, 3); }
    cA = (pA * nA) / 100; cB = (pB * nB) / 100;
    if (cA !== cB && nA !== nB && (variant !== 'flip' || cB > cA)) break;
  }
  const A = x.rows.cats[0]!, B = x.rows.cats[1]!, C = x.cols.cats[0]!;
  const sized = variant !== 'none';
  const right = variant === 'none' ? 'cant' : cA > cB ? 'A' : 'B';
  const opts: Opt[] = [
    { t: `The ${A.group}`, ok: right === 'A', mc: right !== 'A' ? MC.diffWholes : undefined, say: right === 'A' ? `Yes: ${pA}% of ${nA} = ${cA}, more than ${pB}% of ${nB} = ${cB}.` : sized ? `A bigger percent of a smaller group: ${pA}% of ${nA} is only ${cA}, but ${pB}% of ${nB} is ${cB}.` : `${pA}% is the bigger share, but of a group whose size the graph doesn’t show.` },
    { t: `The ${B.group}`, ok: right === 'B', mc: right === 'cant' ? MC.diffWholes : undefined, say: right === 'B' ? `Yes: ${pB}% of ${nB} = ${cB}, more than ${pA}% of ${nA} = ${cA}.` : sized ? `${pB}% of ${nB} is ${cB}; ${pA}% of ${nA} is ${cA}.` : 'The graph shows percents only. Without the group sizes you can’t compare counts.' },
    { t: 'Both have the same number', mc: right === 'cant' ? MC.diffWholes : undefined, say: sized ? `Work them out: ${cA} and ${cB}.` : 'The graph can’t tell you that either: it shows no counts.' },
    { t: 'Can’t tell from the graph alone', ok: right === 'cant', say: right === 'cant' ? 'Right: every bar is 100% of its own group, and the group sizes aren’t shown.' : `Here the sizes are given (${nA} and ${nB}), so you can work out the counts.` },
  ];
  return {
    id: `moreWho-${n}`, family: 'moreWho',
    prompt: `The segmented bar graph compares ${A.group} and ${B.group}${sized ? ` (there are <b class="a">${nA}</b> ${A.group} and <b class="a">${nB}</b> ${B.group})` : ''}. Which group has more ${x.who} who ${C.has}?`,
    board: sized ? `${pA}\\% \\text{ of } ${nA} \\;\\text{vs}\\; ${pB}\\% \\text{ of } ${nB}` : `${pA}\\% \\text{ of } \\;? \\;\\text{vs}\\; ${pB}\\% \\text{ of } \\;?`, input: 'choice', ...choose(R, opts, true),
    picture: { pic: { kind: 'bars', bars: { groups: [A.label, B.label], cats: x.cols.cats.map(c => c.label), pcts: [[pA, 100 - pA], [pB, 100 - pB]], labels: true, sizes: sized ? [nA, nB] : null }, orient: 'h' }, focus: { seg: { g: right === 'B' ? 1 : 0, s: 0 } }, steps: sized ? [`${pA}\\% \\times ${nA} = ${cA}`, `${pB}\\% \\times ${nB} = ${cB}`] : ['\\text{each bar} = 100\\%', '\\text{group sizes: } \\;?'] },
    solution: sized ? [`${pA}% of ${nA} = ${cA}. ${pB}% of ${nB} = ${cB}.`, `So <b class="s">the ${right === 'A' ? A.group : B.group}</b> have more. The bigger percent doesn’t always mean more people.`] : ['Every bar is 100% of its own group, so the bars hide the group sizes.', 'Without the sizes, counts can’t be compared.'],
  };
};
const countFromBar: Gen = (R, n) => {
  const x = pick(R, CONTEXTS_2x2), viaPct = R() < 0.4;
  const pcts = [10 * int(R, 2, 8), 10 * int(R, 2, 8)];
  const N = 100 * int(R, 3, 8), m0 = pick(R, [30, 40, 60, 70]);
  const s0 = 20 * int(R, 2, 14), s1 = 20 * int(R, 2, 13);
  const sizes = viaPct ? [(N * m0) / 100, N - (N * m0) / 100] : [s0, s1 >= s0 ? s1 + 20 : s1];
  const g = int(R, 0, 1), G = x.rows.cats[g]!, C = x.cols.cats[0]!, ans = (pcts[g]! * sizes[g]!) / 100;
  const total = sizes[0]! + sizes[1]!;
  return {
    id: `countFromBar-${n}`, family: 'countFromBar',
    prompt: viaPct
      ? `A survey asked <b class="a">${N}</b> ${x.who}; ${m0}% of them ${x.rows.cats[0]!.has}. The graph shows each group as 100%. How many ${G.group} ${C.has}?`
      : `The graph shows each group as 100%, with the size of each group at the end. How many ${G.group} ${C.has}?`,
    board: `${pcts[g]}\\% \\text{ of } \\;? = \\;?`, input: 'num', unit: x.who, answer: { kind: 'num', v: ans },
    picture: { pic: { kind: 'bars', bars: { groups: x.rows.cats.map(c => c.label), cats: x.cols.cats.map(c => c.label), pcts: pcts.map(p => [p, 100 - p]), labels: true, sizes: viaPct ? null : sizes }, orient: 'h' }, focus: { seg: { g, s: 0 }, bar: g }, steps: [...(viaPct ? [`${g === 0 ? m0 : 100 - m0}\\% \\times ${N} = ${sizes[g]}`] : []), `${pcts[g]}\\% \\times ${sizes[g]} = ${ans}`] },
    solution: [...(viaPct ? [`The ${G.group}: ${g === 0 ? m0 : 100 - m0}% of ${N} = <b class="a">${sizes[g]}</b>.`] : [`The ${G.label} bar is <b class="a">${sizes[g]}</b> ${x.who}.`]), `${pcts[g]}% of ${sizes[g]} = <b class="s">${ans}</b>.`],
    check: countCheck(ans, [
      { v: pcts[g]!, mc: MC.fixed, say: `${pcts[g]} is the percent. Take ${pcts[g]}% of the ${sizes[g]} ${G.group}.` },
      { v: (pcts[g]! * sizes[1 - g]!) / 100, mc: MC.diffWholes, say: 'That uses the other group’s size. Each bar is a percent of its own group.' },
      { v: (pcts[g]! * total) / 100, mc: MC.notNewWhole, say: `That takes ${pcts[g]}% of everybody (${total}). The bar is only the ${G.group}.` },
    ], `Right: ${pcts[g]}% of ${sizes[g]}.`, `Find the size of the ${G.group} first, then take ${pcts[g]}% of it.`),
  };
};

// ======================= 9 association-compare-distributions =======================
function assocData(R: () => number, kind: 'pos' | 'neg' | 'none'): Tb {
  for (;;) {
    const T = tb(R, { shape: [2, 2], friendly: true, assoc: kind });
    if (kind !== 'none') return T;
    const flat = T.cells.flat();
    if (T.cells[0]![0] === Math.max(...flat)) return T;
  }
}
const assocTable: Gen = (R, n) => {
  const kind = pick(R, ['pos', 'neg', 'none'] as const), T = assocData(R, kind);
  const A = T.x.rows.cats[0]!, B = T.x.rows.cats[1]!, C = T.x.cols.cats[0]!;
  const p0 = pct(T.cells[0]![0]!, T.t.row[0]!), p1 = pct(T.cells[1]![0]!, T.t.row[1]!);
  const opts: Opt[] = [
    { t: `Yes: the ${A.group} are more likely to ${C.has}.`, ok: kind === 'pos', mc: kind === 'none' || (kind === 'neg' && T.cells[0]![0]! > T.cells[1]![0]!) ? MC.oneCell : undefined, say: kind === 'pos' ? `Yes: ${P(p0)} of them, against ${P(p1)} of the others.` : kind === 'none' ? `The ${T.cells[0]![0]} cell is the biggest, but the group is big too: ${P(p0)} of each group ${C.has}.` : `Compare percents: ${P(p0)} of the ${A.group}, ${P(p1)} of the ${B.group}.` },
    { t: `Yes: the ${B.group} are more likely to ${C.has}.`, ok: kind === 'neg', mc: kind !== 'neg' && T.cells[1]![0]! > T.cells[0]![0]! ? MC.oneCell : undefined, say: kind === 'neg' ? `Yes: ${P(p1)} of them, against ${P(p0)} of the ${A.group}.` : `Compare percents: ${P(p0)} of the ${A.group}, ${P(p1)} of the ${B.group}.` },
    { t: `No: about the same share of each group ${C.has}.`, ok: kind === 'none', mc: kind === 'neg' ? MC.negWeak : undefined, say: kind === 'none' ? `Right: ${P(p0)} and ${P(p1)}. Same split, no association.` : `${P(p0)} against ${P(p1)} is a big difference: an association${kind === 'neg' ? ', just in the other direction' : ''}.` },
  ];
  return {
    id: `assocTable-${n}`, family: 'assocTable',
    prompt: `${intro(T)} Do the data suggest an association between ${T.x.rows.name} and ${T.x.cols.name}?`,
    board: `${frac('\\;?', T.t.row[0]!)} \\;\\text{vs}\\; ${frac('\\;?', T.t.row[1]!)}`, input: 'choice', ...choose(R, opts, true),
    picture: { pic: { kind: 'table', table: tableOf(T, 'col'), bars: { spec: rowBars(T), orient: 'h', atStart: false } }, focus: { grow: true, align: kind === 'none' ? 0 : undefined }, steps: [divTex(T.cells[0]![0]!, T.t.row[0]!), divTex(T.cells[1]![0]!, T.t.row[1]!)] },
    solution: [`Compare each group as its own 100%: ${T.cells[0]![0]} ÷ ${T.t.row[0]} ${htmlEq(p0)} ${P(p0)}; ${T.cells[1]![0]} ÷ ${T.t.row[1]} ${htmlEq(p1)} ${P(p1)}.`, kind === 'none' ? 'The same percent in both groups: the bars line up, no association.' : `${fmt(Math.abs(p0 - p1))} percentage points apart: an association.`],
  };
};
const pointsDiff: Gen = (R, n) => {
  const T = assocData(R, R() < 0.5 ? 'pos' : 'neg');
  const C = T.x.cols.cats[0]!, p0 = pct(T.cells[0]![0]!, T.t.row[0]!), p1 = pct(T.cells[1]![0]!, T.t.row[1]!), ex = Math.abs(p0 - p1);
  return {
    id: `pointsDiff-${n}`, family: 'pointsDiff',
    prompt: `${intro(T)} Compare the ${T.x.rows.cats[0]!.group} with the ${T.x.rows.cats[1]!.group}: how many percentage points apart are the percents who ${C.has}?`,
    board: `${frac(T.cells[0]![0]!, T.t.row[0]!)} \\;\\text{vs}\\; ${frac(T.cells[1]![0]!, T.t.row[1]!)}`, input: 'num', unit: 'points', answer: { kind: 'num', v: round(ex, 1) },
    picture: { pic: { kind: 'table', table: tableOf(T, 'col'), bars: { spec: rowBars(T), orient: 'h', atStart: false } }, focus: { grow: true }, steps: [divTex(T.cells[0]![0]!, T.t.row[0]!), divTex(T.cells[1]![0]!, T.t.row[1]!), `${fmt(Math.max(p0, p1))} - ${fmt(Math.min(p0, p1))} = ${fmt(ex)}`] },
    solution: [`${T.x.rows.cats[0]!.label}: ${T.cells[0]![0]} ÷ ${T.t.row[0]} ${htmlEq(p0)} ${P(p0)}. ${T.x.rows.cats[1]!.label}: ${T.cells[1]![0]} ÷ ${T.t.row[1]} ${htmlEq(p1)} ${P(p1)}.`, `The difference: <b class="s">${fmt(ex)} percentage points</b>.`],
    check: pctCheck(ex, 1, [
      { v: Math.abs(T.cells[0]![0]! - T.cells[1]![0]!), exact: true, mc: MC.oneCell, say: 'That compares the counts. The groups are different sizes: compare each group’s percent.' },
      { v: Math.abs(pct(T.cells[0]![0]!, T.t.all) - pct(T.cells[1]![0]!, T.t.all)), mc: MC.notNewWhole, say: 'Those are percents of everybody. Compare each group as its own 100%.' },
    ], 'Right: the difference of the two conditional percents.', 'Work out each row’s percent first, then subtract.'),
  };
};
const assocBars: Gen = (R, n) => {
  const x = pick(R, [...CONTEXTS_2x2, ...CONTEXTS_3]), has = R() < 0.55, nC = x.cols.cats.length;
  const base = nC === 2 ? [5 * int(R, 6, 14)] : [5 * int(R, 4, 8), 5 * int(R, 3, 6)];
  base.push(100 - base.reduce((s, v) => s + v, 0));
  const other = [...base];
  // a clear association moves the first boundary 20-35 points (toward the side with room); none moves it 0-5
  const d = has ? 5 * int(R, 4, 7) * (base[0]! > 50 ? -1 : 1) : 5 * int(R, -1, 1);
  other[0] = base[0]! + d; other[nC - 1] = other[nC - 1]! - d;
  if (other[nC - 1]! < 10) { const fix = 10 - other[nC - 1]!; other[nC - 1] = 10; other[nC - 2] = other[nC - 2]! - fix; }
  const strong = has;
  const opts: Opt[] = [
    { t: `A possible association: the ${x.cols.cats[0]!.label} share is quite different in the two bars.`, ok: strong, say: strong ? `Yes: ${base[0]}% against ${other[0]}%.` : `${base[0]}% and ${other[0]}% are close: the boundaries nearly line up.` },
    { t: 'Little or no association: both bars split about the same way.', ok: !strong, mc: undefined, say: !strong ? 'Right: the segment boundaries nearly line up.' : `${base[0]}% against ${other[0]}% is a big gap: the boundaries don’t line up.` },
    { t: 'You can’t tell from 100% bars: you need the counts.', say: 'Association is about percents of each group, and that is exactly what 100% bars show.' },
  ];
  return {
    id: `assocBars-${n}`, family: 'assocBars',
    prompt: `The segmented bar graph shows ${x.cols.name} for ${x.rows.cats[0]!.group} and ${x.rows.cats[1]!.group}. What does it suggest?`,
    board: '\\text{do the boundaries line up?}', input: 'choice', ...choose(R, opts, true),
    picture: { pic: { kind: 'bars', bars: { groups: x.rows.cats.map(c => c.label), cats: x.cols.cats.map(c => c.label), pcts: [base, other], labels: true }, orient: R() < 0.5 ? 'h' : 'v' }, focus: { align: 0 }, steps: [`${base[0]}\\% \\;\\text{vs}\\; ${other[0]}\\%`, `${Math.abs(base[0]! - other[0]!)} \\text{ points apart}`] },
    solution: [`Compare the same segment in each bar: ${base[0]}% against ${other[0]}%.`, strong ? 'Far apart: a possible association.' : 'About the same: little or no association.'],
  };
};

// ======================= 10 tree-joint =======================
const TREE_CTX = () => CONTEXTS_2x2.filter(x => [...x.rows.cats, ...x.cols.cats].every(c => c.label.length <= 9));
function treeData(R: () => number): { x: Ctx; m: number[]; c: number[][]; d: number } {
  const x = pick(R, TREE_CTX()), mode = R();
  let m0: number, a: number, b: number;
  if (mode < 0.45) { m0 = 10 * int(R, 2, 8); a = 10 * int(R, 2, 8); b = 10 * int(R, 1, 8); }
  else if (mode < 0.8) { m0 = 5 * int(R, 3, 17); a = 5 * int(R, 2, 18); b = 5 * int(R, 2, 18); }
  else { m0 = int(R, 3, 12); a = 5 * int(R, 14, 19); b = int(R, 3, 9); }
  if (a === b) b = b + 5 <= 95 ? b + 5 : b - 5;
  return { x, m: [m0, 100 - m0], c: [[a, 100 - a], [b, 100 - b]], d: 2 };
}
const treeSpecOf = (t: ReturnType<typeof treeData>, leaf: (number | null)[][], hide: string[], second?: (number | null)[][]): TreeSpec => ({
  first: t.x.rows.cats.map((c, i) => ({ label: c.label, p: t.m[i]! })),
  second: t.x.rows.cats.map((_, i) => t.x.cols.cats.map((c, j) => ({ label: c.label, p: second ? second[i]![j]! : t.c[i]![j]! }))),
  leaf, hide, d: 1,
});
const treeLeaf: Gen = (R, n) => {
  const t = treeData(R), i = int(R, 0, 1), j = int(R, 0, 1), m = t.m[i]!, c = t.c[i]![j]!, ex = round((m * c) / 100, 2);
  const Ri = t.x.rows.cats[i]!, Cj = t.x.cols.cats[j]!;
  const leaf = [[null, null], [null, null]] as (number | null)[][];
  leaf[i]![j] = ex;
  return {
    id: `treeLeaf-${n}`, family: 'treeLeaf',
    prompt: `In a survey of ${t.x.who}, ${t.m[0]}% ${t.x.rows.cats[0]!.has}. Of those, ${t.c[0]![0]}% ${t.x.cols.cats[0]!.has}; of the others, ${t.c[1]![0]}% ${t.x.cols.cats[0]!.has}. What percent of ALL the ${t.x.who} ${Ri.has} and ${Cj.has}?${roundHint(ex, 2)}`,
    board: '\\text{branch} \\times \\text{branch} = \\;?', input: 'num', unit: '%', answer: { kind: 'num', v: ex },
    picture: { pic: { kind: 'tree', tree: treeSpecOf(t, leaf, [`l${i}${j}`]) }, focus: { path: { i, j } }, steps: [`${m}\\% \\times ${c}\\% = ${fmt(ex, 2)}\\%`] },
    solution: [`Follow the path: ${Ri.label} (<b class="a">${m}%</b> of everybody), then ${Cj.label} (<b class="b">${c}%</b> of them).`, `${c}% of ${m}%: ${fmt(m / 100, 2)} × ${c}% = <b class="s">${fmt(ex, 2)}%</b> of everybody.`],
    check: pctCheck(ex, 2, [
      { v: m + c, mc: MC.addsStages, say: `Along a path you multiply: ${c}% OF the ${m}%. Adding gives more than either branch.` },
      { v: c, mc: MC.subgroupJoint, say: `${c}% is a percent of the ${Ri.group} only. Of everybody it is ${c}% of ${m}%.` },
      { v: m, say: `${m}% is the whole ${Ri.label} branch. Only ${c}% of it goes on to ${Cj.label}.` },
    ], `Right: ${m}% × ${c}%.`, 'Multiply the percents along the path.'),
  };
};
const treeMissing: Gen = (R, n) => {
  const t = treeData(R), i = int(R, 0, 1), j = int(R, 0, 1), viaLeaf = R() < 0.45;
  const c = t.c[i]![j]!, m = t.m[i]!, Ri = t.x.rows.cats[i]!, Cj = t.x.cols.cats[j]!;
  const second = t.c.map(r => r.map(v => v as number | null));
  const leaf = [[null, null], [null, null]] as (number | null)[][];
  const L = round((m * c) / 100, 2);
  if (viaLeaf) { second[i]![1 - j] = null; leaf[i]![j] = L; }
  const sib = t.c[i]![1 - j]!;
  return {
    id: `treeMissing-${n}`, family: 'treeMissing',
    prompt: viaLeaf
      ? `The tree shows ${Ri.label} as ${m}% of the ${t.x.who}, and ${fmt(L, 2)}% of ALL the ${t.x.who} are ${Ri.label} and ${Cj.label}. What percent goes on the “?” branch: the ${Ri.group} who ${Cj.has}?`
      : `Complete the tree. What percent goes on the “?” branch: the ${Ri.group} who ${Cj.has}?`,
    board: viaLeaf ? `${m}\\% \\times \\;? = ${fmt(L, 2)}\\%` : `\\;? + ${sib}\\% = 100\\%`, input: 'num', unit: '%', answer: { kind: 'num', v: c },
    picture: { pic: { kind: 'tree', tree: treeSpecOf(t, leaf, [`b${i}${j}`], second) }, focus: { path: { i, j } }, steps: viaLeaf ? [`${frac(fmt(L, 2) + '\\%', m + '\\%')} = ${c}\\%`] : [`100\\% - ${sib}\\% = ${c}\\%`] },
    solution: viaLeaf ? [`Branch × branch = leaf: ${m}% × ? = ${fmt(L, 2)}%.`, `So ? = ${fmt(L, 2)} ÷ ${m} = <b class="s">${c}%</b>.`] : [`The branches out of ${Ri.label} cover all the ${Ri.group}: they add to 100%.`, `100 − ${sib} = <b class="s">${c}%</b>.`],
    check: pctCheck(c, 1, viaLeaf ? [
      { v: L, mc: MC.notNewWhole, say: `${fmt(L, 2)}% is out of everybody. The branch is out of the ${Ri.group} only: divide by ${m}%.` },
      { v: round((L * m) / 100, 2), say: 'Undo the multiply with a divide: leaf ÷ first branch.' },
    ] : [
      { v: 100 - m, say: `That uses the first-level branch. The two branches out of ${Ri.label} add to 100%.` },
      { v: sib, say: `That is the other branch. Together they make 100%.` },
    ], 'Right.', viaLeaf ? 'Leaf ÷ first branch.' : `The branches out of ${Ri.label} add to 100%.`),
  };
};

// ======================= 11 complete-rf-table =======================
type Known = Partial<Record<RFKey, number>>;
const KEY_RC: Record<RFKey, [number, number]> = { c00: [0, 0], c01: [0, 1], c10: [1, 0], c11: [1, 1], r0: [0, 2], r1: [1, 2], k0: [2, 0], k1: [2, 1] };
/** the derivation chain (TeX lines) that fills `target` from `known` */
interface Step { key: RFKey; from: RFKey[]; tex: string; text: string }
function derive(known: Known, target: RFKey, name: (k: RFKey) => string): Step[] | null {
  const v: Known = { ...known }, made = new Map<RFKey, Step>();
  const eqs: [RFKey, RFKey, RFKey | 100][] = [['c00', 'c01', 'r0'], ['c10', 'c11', 'r1'], ['c00', 'c10', 'k0'], ['c01', 'c11', 'k1'], ['r0', 'r1', 100], ['k0', 'k1', 100]];
  const P2 = (x: number) => `${fmt(x, 2)}\\%`, H2 = (x: number) => `${fmt(x, 2)}%`;
  const put = (key: RFKey, val: number, from: RFKey[], op: [number, string, number]) => {
    v[key] = val;
    made.set(key, { key, from, tex: `${P2(op[0])} ${op[1]} ${P2(op[2])} = ${P2(val)}`, text: `${name(key)}: ${H2(op[0])} ${op[1] === '-' ? '−' : '+'} ${H2(op[2])} = ${H2(val)}` });
  };
  for (let pass = 0; pass < 6 && v[target] === undefined; pass++) for (const [a, b, s] of eqs) {
    const S = s === 100 ? 100 : v[s], A = v[a], B = v[b], sk = s === 100 ? [] : [s];
    if (S !== undefined && A !== undefined && B === undefined) put(b, round(S - A, 2), [...sk, a], [S, '-', A]);
    else if (S !== undefined && B !== undefined && A === undefined) put(a, round(S - B, 2), [...sk, b], [S, '-', B]);
    else if (s !== 100 && S === undefined && A !== undefined && B !== undefined) put(s, round(A + B, 2), [a, b], [A, '+', B]);
  }
  if (v[target] === undefined) return null;
  // keep only the steps the target needs, in the order they were found
  const need = new Set<RFKey>(), walk = (k: RFKey) => { const st = made.get(k); if (!st || need.has(k)) return; need.add(k); st.from.forEach(walk); };
  walk(target);
  return [...made.values()].filter(st => need.has(st.key));
}
const fillCell: Gen = (R, n) => {
  const x = pick(R, CONTEXTS_2x2), J = jointPercents(R, R() < 0.7 ? 'whole' : 'tenth');
  const full: Record<RFKey, number> = { c00: J[0]!, c01: J[1]!, c10: J[2]!, c11: J[3]!, r0: round(J[0]! + J[1]!, 1), r1: round(J[2]! + J[3]!, 1), k0: round(J[0]! + J[2]!, 1), k1: round(J[1]! + J[3]!, 1) };
  const lab = (k: RFKey) => { const [r, c] = KEY_RC[k]; const R0 = x.rows.cats[r]?.label, C0 = x.cols.cats[c]?.label; return r === 2 ? `${C0} total` : c === 2 ? `${R0} total` : `${R0} and ${C0}`; };
  let known: Known = {}, target: RFKey = 'c11', steps: Step[] | null = null;
  for (let k = 0; k < 200; k++) {
    target = pick(R, ['c00', 'c01', 'c10', 'c11'] as RFKey[]);
    const pool = shuffle(R, RF_KEYS.filter(q => q !== target)), m = int(R, 3, 4);
    known = Object.fromEntries(pool.slice(0, m).map(q => [q, full[q]]));
    steps = derive(known, target, lab);
    if (steps && steps.length >= 2) break;
  }
  const vals: (number | null)[][] = [[null, null, null], [null, null, null], [null, null, 100]];
  for (const [q, v] of Object.entries(known) as [RFKey, number][]) { const [r, c] = KEY_RC[q]; vals[r]![c] = v; }
  const [tr, tc] = KEY_RC[target];
  vals[tr]![tc] = full[target];
  const ex = full[target], rowTot = full[tr === 0 ? 'r0' : 'r1'];
  return {
    id: `fillCell-${n}`, family: 'fillCell',
    prompt: `This joint relative-frequency table of ${x.who} has gaps. Each row and column adds up to its total, and everything adds up to 100%. What percent goes in the “?” cell?`,
    board: '\\text{rows, columns} \\to \\text{totals}', input: 'num', unit: '%', answer: { kind: 'num', v: ex },
    picture: { pic: { kind: 'table', table: { rows: x.rows.cats.map(c => c.label), cols: x.cols.cats.map(c => c.label), vals, margins: true, fmt: 'pct', d: 1, hide: [`${tr},${tc}`], tint: null } }, focus: { part: { r: tr, c: tc } }, steps: steps!.map(s => s.tex) },
    solution: [...steps!.map(s => s.text), `So the cell is <b class="s">${fmt(ex)}%</b>.`],
    check: pctCheck(ex, 1, [{ v: rowTot, mc: MC.totalAsCell, say: 'That is the row total. The cell is only part of it.' }], 'Right: totals and differences fill the table.', 'Find a row or column with only one gap, then use its total.'),
  };
};
const fromConditional: Gen = (R, n) => {
  const x = pick(R, CONTEXTS_2x2);
  let m0 = 0, c = 0, j00 = 0;
  for (;;) { m0 = 5 * int(R, 4, 16); c = 5 * int(R, 4, 18); j00 = (m0 * c) / 100; if (Number.isInteger(j00) && j00 !== c) break; }
  const j10 = int(R, 5, Math.max(6, 100 - m0 - 5)), j01 = m0 - j00, j11 = 100 - m0 - j10, k0 = j00 + j10;
  const target = pick(R, ['c00', 'c01', 'c11', 'k0'] as const);
  const ans = { c00: j00, c01: j01, c11: j11, k0 }[target];
  const A = x.rows.cats[0]!, B = x.rows.cats[1]!, C0 = x.cols.cats[0]!, C1 = x.cols.cats[1]!;
  const phrase = { c00: `${A.has} and ${C0.has}`, c01: `${A.has} and ${C1.has}`, c11: `${B.has} and ${C1.has}`, k0: C0.has }[target];
  const vals: (number | null)[][] = [[null, null, m0], [j10, null, null], [null, null, 100]];
  const [tr, tc] = KEY_RC[target];
  vals[tr]![tc] = ans;
  const wrongs: Wrong[] = target === 'c00' ? [{ v: c, mc: MC.subgroupJoint, say: `${c}% is a percent of the ${A.group} only. Of everybody it is ${c}% of ${m0}%.` }]
    : target === 'c01' ? [{ v: m0 - c, mc: MC.subgroupJoint, say: `${c}% is of the ${A.group} only: first find ${c}% of ${m0}% = ${j00}%.` }, { v: 100 - c, mc: MC.subgroupJoint, say: `${100 - c}% is of the ${A.group} only. Of everybody, take it of ${m0}%.` }]
      : target === 'k0' ? [{ v: c + j10, mc: MC.subgroupJoint, say: `${c}% is of the ${A.group} only: first find ${c}% of ${m0}% = ${j00}%.` }]
        : [{ v: 100 - j10, say: `That leaves out the ${A.group}: they are ${m0}% of everybody.` }];
  const steps = [`${m0}\\% \\times ${c}\\% = ${j00}\\%`, ...(target === 'c01' ? [`${m0} - ${j00} = ${j01}`] : target === 'k0' ? [`${j00} + ${j10} = ${k0}`] : target === 'c11' ? [`100 - ${m0} - ${j10} = ${j11}`] : [])];
  return {
    id: `fromConditional-${n}`, family: 'fromConditional',
    prompt: `${m0}% of the ${x.who} ${A.has}. Of the ${A.group}, ${c}% ${C0.has}. ${j10}% of all the ${x.who} ${B.has} and ${C0.has}. What percent of all the ${x.who} ${phrase}?`,
    board: `${c}\\% \\text{ of } ${m0}\\% = \\;?`, input: 'num', unit: '%', answer: { kind: 'num', v: ans },
    picture: { pic: { kind: 'table', table: { rows: x.rows.cats.map(q => q.label), cols: x.cols.cats.map(q => q.label), vals, margins: true, fmt: 'pct', d: 1, hide: [`${tr},${tc}`], tint: null } }, focus: { part: { r: tr, c: tc } }, steps: target === 'c11' ? [`100 - ${m0} - ${j10} = ${j11}`] : steps },
    solution: target === 'c11'
      ? [`${B.has[0]!.toUpperCase() + B.has.slice(1)}: 100% − ${m0}% = ${100 - m0}% of everybody.`, `Take away the ${j10}% who ${C0.has}: ${100 - m0} − ${j10} = <b class="s">${j11}%</b>.`]
      : [`The ${c}% is a conditional: of the ${A.group} only. Make it joint: ${c}% of ${m0}% = <b class="b">${j00}%</b> of everybody.`, ...(target === 'c01' ? [`The rest of the ${A.label} row: ${m0} − ${j00} = <b class="s">${j01}%</b>.`] : target === 'k0' ? [`Add the ${B.label} cell: ${j00} + ${j10} = <b class="s">${k0}%</b>.`] : [`That is the cell: <b class="s">${j00}%</b>.`])],
    check: pctCheck(ans, 1, wrongs, 'Right.', 'Turn the conditional into a joint percent first (multiply by the margin), then use the totals.'),
  };
};

// ======================= 12 screening-test-frequencies =======================
const SCREENS = [
  { who: 'people', test: 'A screening test', has: 'have the condition', hasNot: 'don’t have it', pos: 'test positive', neg: 'test negative', rows: ['Has it', 'Doesn’t'], cols: ['Positive', 'Negative'], groupPos: 'people who test positive', groupHas: 'people who have the condition' },
  { who: 'emails', test: 'A spam filter', has: 'are spam', hasNot: 'are not spam', pos: 'get flagged', neg: 'get through', rows: ['Spam', 'Not spam'], cols: ['Flagged', 'Through'], groupPos: 'flagged emails', groupHas: 'spam emails' },
  { who: 'bags', test: 'A metal detector', has: 'hold metal', hasNot: 'hold no metal', pos: 'make it beep', neg: 'pass quietly', rows: ['Metal', 'No metal'], cols: ['Beep', 'No beep'], groupPos: 'bags that make it beep', groupHas: 'bags that hold metal' },
] as const;
function screenData(R: () => number) {
  for (;;) {
    const s = screen(pick(R, [1000, 10000]), pick(R, [2, 5, 9, 10, 20, 30]), pick(R, [80, 90, 95]), pick(R, [90, 95]));
    if (screenOk(s) && s.tp !== s.fp) return s;
  }
}
const screenWord: Gen = (R, n) => {
  const S = pick(R, SCREENS), s = screenData(R), cell = pick(R, ['tp', 'fn', 'fp', 'tn'] as const);
  const v = s[cell], [r, c] = ({ tp: [0, 0], fn: [0, 1], fp: [1, 0], tn: [1, 1] } as Record<string, [number, number]>)[cell]!;
  const desc = { tp: `${S.has} and ${S.pos}`, fn: `${S.has} but ${S.neg}`, fp: `${S.hasNot} but ${S.pos}`, tn: `${S.hasNot} and ${S.neg}` }[cell];
  const names = { tp: 'True positives', fn: 'False negatives', fp: 'False positives', tn: 'True negatives' };
  const why = { tp: 'the test says yes, and it is right', fn: 'the test says no, and it is wrong', fp: 'the test says yes, and it is wrong', tn: 'the test says no, and it is right' };
  const opts: Opt[] = (['tp', 'fp', 'fn', 'tn'] as const).map(k => ({
    t: names[k], ok: k === cell,
    mc: (cell === 'fp' && k === 'fn') || (cell === 'fn' && k === 'fp') ? MC.fpfn : undefined,
    say: k === cell ? `Yes: ${why[cell]}.` : `“Positive” and “negative” name what the test says; “true” and “false” say whether it was right. Here ${why[cell]}.`,
  }));
  return {
    id: `screenWord-${n}`, family: 'screenWord',
    prompt: `${S.test} was used on ${s.N.toLocaleString('en-US')} ${S.who}. What do you call the ${S.who} that ${desc} (<b class="b">${v.toLocaleString('en-US')}</b> of them here)?`,
    board: '\\text{test says} \\;\\text{vs}\\; \\text{truth}', input: 'choice', ...choose(R, opts, true),
    picture: { pic: { kind: 'table', table: countSpec(S.rows, S.cols, [[s.tp, s.fn], [s.fp, s.tn]]) }, focus: { part: { r, c } }, steps: [`\\text{${cell[1] === 'p' ? 'positive' : 'negative'}: the test said ${cell[1] === 'p' ? 'yes' : 'no'}}`, `\\text{${cell[0] === 't' ? 'true' : 'false'}: it was ${cell[0] === 't' ? 'right' : 'wrong'}}`] },
    solution: [`Positive or negative: what the test said. True or false: whether it was right.`, `These ${S.who} ${desc}: ${why[cell]}, so they are <b class="s">${names[cell].toLowerCase()}</b>.`],
  };
};
const screenPPV: Gen = (R, n) => {
  const S = pick(R, SCREENS), s = screenData(R), ex = pct(s.tp, s.tp + s.fp);
  const fmtN = (v: number) => v.toLocaleString('en-US');
  return {
    id: `screenPPV-${n}`, family: 'screenPPV',
    prompt: `${S.test} was used on ${fmtN(s.N)} ${S.who}; ${s.base}% of them ${S.has}. It catches ${s.sens}% of the ${S.groupHas}. Of the ${S.groupPos}, what percent really ${S.has}?${roundHint(ex)}`,
    board: BOARD_PCT, input: 'num', unit: '%', answer: { kind: 'num', v: round(ex, 1) },
    picture: { pic: { kind: 'table', table: countSpec(S.rows, S.cols, [[s.tp, s.fn], [s.fp, s.tn]]) }, focus: { whole: { kind: 'col', i: 0 }, part: { r: 0, c: 0 } }, steps: [`${s.tp} + ${s.fp} = ${s.tp + s.fp}`, divTex(s.tp, s.tp + s.fp)] },
    solution: [`The whole is the ${S.cols[0]} column: all ${S.groupPos}, <b class="a">${s.tp} + ${s.fp} = ${s.tp + s.fp}</b>.`, `The part: the ones that really ${S.has}, <b class="b">${s.tp}</b>.`, `${s.tp} ÷ ${s.tp + s.fp} ${htmlEq(ex)} <b class="s">${P(ex)}</b>. When few ${S.has}, the false positives can outnumber the true ones.`],
    check: pctCheck(ex, 1, [
      { v: s.sens, mc: MC.inverse, say: `${s.sens}% is “of the ${S.groupHas}, how many ${S.pos}”. The question turns it around: of the ${S.groupPos}.` },
      { v: pct(s.tp, s.N), mc: MC.notNewWhole, say: `That is out of all ${fmtN(s.N)}. The whole is only the ${S.groupPos}.` },
      { v: s.base, say: `${s.base}% is the share of everybody who ${S.has}. Look only at the ${S.cols[0]} column.` },
    ], 'Right: of the positives only.', `Use the ${S.cols[0]} column as the whole.`),
  };
};

// ======================= 13 relative-frequency-as-probability =======================
const chanceAll: Gen = (R, n) => {
  const T = tb(R, { shape: [2, 2], friendly: true });
  const r = int(R, 0, 1), c = int(R, 0, 1), N = T.t.all, joint = R() < 0.6;
  const part = joint ? T.cells[r]![c]! : T.t.col[c]!, ex = pct(part, N), Rr = T.x.rows.cats[r]!, Cc = T.x.cols.cats[c]!;
  return {
    id: `chanceAll-${n}`, family: 'chanceAll',
    prompt: `${intro(T)} One ${T.x.one} is chosen at random from all ${N}. What is the chance (as a percent) that they ${joint ? `${Rr.has} and ${Cc.has}` : Cc.has}?${roundHint(ex)}`,
    board: `\\text{chance} = ${frac('\\text{part}', N)}`, input: 'num', unit: '%', answer: { kind: 'num', v: round(ex, 1) },
    picture: { pic: { kind: 'table', table: tableOf(T, null) }, focus: { whole: { kind: 'all', i: 0 }, part: joint ? { r, c } : { r: 2, c } }, steps: [divTex(part, N)] },
    solution: [`Chosen from all ${N}: everybody is the whole, <b class="a">${N}</b>.`, `${part} of them ${joint ? `${Rr.has} and ${Cc.has}` : Cc.has}: ${part} ÷ ${N} ${htmlEq(ex)} <b class="s">${P(ex)}</b>.`],
    check: pctCheck(ex, 1, [
      { v: pct(part, joint ? T.t.row[r]! : T.t.row[0]!), mc: MC.subgroupJoint, say: `That divides by one group. The ${T.x.one} comes from all ${N}.` },
      { v: part, exact: true, mc: MC.fixed, say: `${part} is a count. As a chance out of ${N}, divide.` },
    ], 'Right: out of everybody.', `Chosen from all ${N}: divide by ${N}.`),
  };
};
const chanceGroup: Gen = (R, n) => {
  const T = tb(R, { shape: [2, 2], friendly: true });
  const r = int(R, 0, 1), c = int(R, 0, 1), v = T.cells[r]![c]!, w = T.t.row[r]!, ex = pct(v, w), Rr = T.x.rows.cats[r]!, Cc = T.x.cols.cats[c]!;
  return {
    id: `chanceGroup-${n}`, family: 'chanceGroup',
    prompt: `${intro(T)} One ${T.x.one} is chosen at random from the ${Rr.group} only. What is the chance (as a percent) that they ${Cc.has}?${roundHint(ex)}`,
    board: `\\text{chance} = ${frac('\\text{part}', '\\text{group}')}`, input: 'num', unit: '%', answer: { kind: 'num', v: round(ex, 1) },
    picture: { pic: { kind: 'table', table: tableOf(T, 'col') }, focus: { whole: { kind: 'row', i: r }, part: { r, c } }, steps: [divTex(v, w)] },
    solution: [`Chosen from the ${Rr.group} only: that row is the whole, <b class="a">${w}</b>.`, `${v} of them ${Cc.has}: ${v} ÷ ${w} ${htmlEq(ex)} <b class="s">${P(ex)}</b>.`],
    check: pctCheck(ex, 1, [
      { v: pct(v, T.t.all), mc: MC.notNewWhole, say: `That is out of all ${T.t.all}. The ${T.x.one} comes from the ${Rr.group} only: ${w} of them.` },
      { v: pct(v, T.t.col[c]!), mc: MC.inverse, say: `That divides by the ${Cc.label} column. The pick is from the ${Rr.group}.` },
    ], 'Right: the group is the new whole.', `Divide by the size of the group the ${T.x.one} is picked from.`),
  };
};
const chanceWho: Gen = (R, n) => {
  const T = tb(R, { shape: [2, 2], friendly: true });
  const r = int(R, 0, 1), c = int(R, 0, 1), v = T.cells[r]![c]!, Rr = T.x.rows.cats[r]!, Cc = T.x.cols.cats[c]!;
  const variant = pick(R, ['other', 'group', 'all'] as const);
  const pJ = pct(v, T.t.all), pC = pct(v, T.t.row[r]!);
  const other = pick(R, [`at another school across the country`, `from the whole town, of any age`, `from a survey taken ten years ago`]);
  const where = variant === 'other' ? `One ${T.x.one} is chosen at random ${other}.` : variant === 'group' ? `One ${T.x.one} is chosen at random from the ${Rr.group}.` : `One ${T.x.one} is chosen at random from all ${T.t.all}.`;
  const q = variant === 'all' ? `${Rr.has} and ${Cc.has}` : Cc.has;
  const opts: Opt[] = [
    { t: P(pJ), ok: variant === 'all', mc: variant === 'group' ? MC.notNewWhole : variant === 'other' ? MC.noData : undefined, say: variant === 'all' ? `Yes: ${v} of all ${T.t.all}.` : variant === 'group' ? `That is out of everybody. The pick is from the ${Rr.group} only.` : `This table is only about these ${T.t.all} ${T.x.who}. It can’t speak for other people.` },
    { t: P(pC), ok: variant === 'group', mc: variant === 'all' ? MC.subgroupJoint : variant === 'other' ? MC.noData : undefined, say: variant === 'group' ? `Yes: ${v} of the ${T.t.row[r]} ${Rr.group}.` : variant === 'all' ? `That is out of one group. The pick is from all ${T.t.all}.` : `This table is only about these ${T.t.all} ${T.x.who}. It can’t speak for other people.` },
    { t: 'The table can’t tell', ok: variant === 'other', say: variant === 'other' ? `Right: the data describe only these ${T.t.all} ${T.x.who}.` : 'It can: the pick is from the people in the table.' },
  ];
  if (new Set(opts.map(o => o.t)).size < opts.length) opts[0]!.t = `${fmt(pJ, 2)}% of everybody`;
  return {
    id: `chanceWho-${n}`, family: 'chanceWho',
    prompt: `${intro(T)} ${where} What is the chance that they ${q}?`,
    board: '\\text{chosen from whom?}', input: 'choice', ...choose(R, opts, true),
    picture: { pic: { kind: 'table', table: tableOf(T, null) }, focus: variant === 'other' ? {} : variant === 'group' ? { whole: { kind: 'row', i: r }, part: { r, c } } : { whole: { kind: 'all', i: 0 }, part: { r, c } }, steps: variant === 'other' ? ['\\text{not in the table}'] : [divTex(v, variant === 'group' ? T.t.row[r]! : T.t.all)] },
    solution: variant === 'other' ? [`The table counts only these ${T.t.all} ${T.x.who}. A pick from other people is outside the data.`] : [`The pick is from ${variant === 'group' ? `the ${Rr.group}` : 'everybody'}: that is the whole.`, `${v} ÷ ${variant === 'group' ? T.t.row[r] : T.t.all} ${htmlEq(variant === 'group' ? pC : pJ)} <b class="s">${P(variant === 'group' ? pC : pJ)}</b>.`],
  };
};

// ======================= 14 association-not-causation =======================
const CLAIM: Record<string, string> = {
  curfew: 'A curfew makes teens do chores.', bus: 'Riding the bus makes students eat school breakfast.', music: 'Music lessons make students play sports.',
  sleep: 'Playing a sport makes students go to bed early.', dog: 'Owning a dog makes people walk every day.', phone: 'Having a phone makes students read for fun.',
  card: 'A library card makes students go to homework club.', garden: 'Having a garden makes families shop at the farmers market.',
};
const causeData = (R: () => number) => { for (;;) { const T = tb(R, { shape: [2, 2], friendly: true, assoc: 'pos', ctx: pick(R, CONTEXTS_2x2) }); if (T.cells[0]![0] === Math.max(...T.cells.flat())) return T; } };
const rewriteClaim: Gen = (R, n) => {
  const T = causeData(R), A = T.x.rows.cats[0]!, C = T.x.cols.cats[0]!;
  const p0 = pct(T.cells[0]![0]!, T.t.row[0]!), p1 = pct(T.cells[1]![0]!, T.t.row[1]!), claim = CLAIM[T.x.id]!;
  const opts: Opt[] = [
    { t: `${A.group[0]!.toUpperCase() + A.group.slice(1)} were more likely to ${C.has} (${P(p0)} vs ${P(p1)}).`, ok: true, say: 'Yes: an association, no cause claimed.' },
    { t: 'The survey proves the headline.', mc: MC.causation, say: 'A survey shows the groups differ, not why. Something else could cause both.' },
    { t: 'There is no link, since nothing explains one.', mc: MC.noCause, say: `The link is in the data (${P(p0)} vs ${P(p1)}), with or without a reason.` },
    { t: `It’s true: ${T.cells[0]![0]} is the biggest cell.`, mc: MC.oneCell, say: 'One cell can’t show a link; compare each group’s percent.' },
  ];
  return {
    id: `rewriteClaim-${n}`, family: 'rewriteClaim',
    prompt: `Headline about this survey of ${T.t.all} ${T.x.who}: “${claim}” What does the survey support?`,
    board: '\\text{association} \\neq \\text{cause}', input: 'choice', ...choose(R, opts),
    picture: { pic: { kind: 'bars', bars: { ...rowBars(T), sizes: T.t.row }, orient: 'h' }, focus: { seg: { g: 0, s: 0 } }, steps: [`${texPct(p0)} \\;\\text{vs}\\; ${texPct(p1)}`, '\\text{a survey only}'] },
    solution: [`An association: ${P(p0)} of the ${A.group} vs ${P(p1)} of the others. Only a randomized experiment could test a cause.`],
  };
};
const confounder: Gen = (R, n) => {
  const T = causeData(R), x = T.x, claim = CLAIM[x.id]!;
  const study = R() < 0.5;
  const opts: Opt[] = study ? [
    { t: `Randomly assign ${x.who} to ${x.rows.cats[0]!.label.toLowerCase()} or not, then compare.`, ok: true, say: 'Yes: random assignment balances everything else, so a difference could be the cause.' },
    { t: 'Survey twice as many people.', say: 'A bigger survey shows the same association more precisely, but still not the cause.' },
    { t: 'Nothing: the survey already proves it.', mc: MC.causation, say: 'A survey shows a link, not a cause. Something else could produce both.' },
    { t: 'Ask people whether they think it is true.', say: 'Opinions don’t test a cause. An experiment with random groups does.' },
  ] : [
    { t: `Something else: ${x.confounder} could affect both.`, ok: true, say: 'Yes: a third variable can make both differ without one causing the other.' },
    { t: `Nothing else: ${claim.charAt(0).toLowerCase() + claim.slice(1)}`, mc: MC.causation, say: 'That is the causal claim itself. The question asks what ELSE could explain the link.' },
    { t: 'The color of the paper the survey was printed on.', say: 'That can’t affect either answer. Look for something that could push both.' },
    { t: 'How many questions the survey had.', say: 'That is the same for everybody, so it can’t make the groups differ.' },
  ];
  return {
    id: `confounder-${n}`, family: 'confounder',
    prompt: study ? `The survey of ${T.t.all} ${x.who} shows a link. Someone claims: “${claim}” What kind of study could test that claim?` : `The survey of ${T.t.all} ${x.who} shows a link. Someone claims: “${claim}” Which could explain the link without one causing the other?`,
    board: study ? '\\text{random groups} \\to \\text{cause?}' : '\\text{a third variable?}', input: 'choice', ...choose(R, opts),
    picture: { pic: { kind: 'bars', bars: { ...rowBars(T), sizes: T.t.row }, orient: 'h' }, focus: {}, steps: ['\\text{association} \\neq \\text{cause}'] },
    solution: study ? ['Only a randomized experiment can test a cause: random groups make everything else equal on average.'] : [`A confounder such as ${x.confounder} could change both answers at once.`, 'Then the groups differ without one causing the other.'],
  };
};

// ======================= 15 categorical-problems-mixed =======================
const combineGroups: Gen = (R, n) => {
  const x = pick(R, CONTEXTS_3), cat = int(R, 0, 2), C = x.cols.cats[cat]!;
  let n1 = 0, n2 = 0, p1 = 0, p2 = 0, ex = 0;
  for (;;) {
    n1 = 50 * int(R, 3, 8); n2 = 50 * int(R, 3, 9); p1 = 5 * int(R, 3, 10); p2 = 5 * int(R, 3, 10);
    ex = pct((n1 * p1) / 100 + (n2 * p2) / 100, n1 + n2);
    if (n1 !== n2 && Math.abs(p1 - p2) >= 10 && Number.isInteger((n1 * p1) / 100) && Number.isInteger((n2 * p2) / 100) && Math.abs(ex - (p1 + p2) / 2) >= 0.5) break;
  }
  const pr = [p1, p2].map(p => { const a = 5 * Math.floor((100 - p) / 10), v = [a, 100 - p - a]; v.splice(cat, 0, p); return v; });
  const c1 = (n1 * p1) / 100, c2 = (n2 * p2) / 100;
  return {
    id: `combineGroups-${n}`, family: 'combineGroups',
    prompt: `${x.rows.cats[0]!.label}: ${n1} ${x.who}, ${x.rows.cats[1]!.label}: ${n2}. The graph shows each group as 100%. You make one circle graph for all ${n1 + n2}. What percent goes in the <b class="b">${C.label}</b> slice?${roundHint(ex)}`,
    board: `\\frac{\\;?\\;}{${n1 + n2}} = \\;?\\,\\%`, input: 'num', unit: '%', answer: { kind: 'num', v: round(ex, 1) },
    picture: { pic: { kind: 'bars', bars: { groups: x.rows.cats.map(c => c.label), cats: x.cols.cats.map(c => c.label), pcts: pr, labels: true, sizes: [n1, n2] }, orient: 'h' }, focus: { seg: { g: 0, s: cat } }, steps: [`${p1}\\% \\times ${n1} = ${c1}`, `${p2}\\% \\times ${n2} = ${c2}`, divTex(c1 + c2, n1 + n2)] },
    solution: [`Count each group: ${p1}% of ${n1} = ${c1}; ${p2}% of ${n2} = ${c2}.`, `Together: ${c1 + c2} of ${n1 + n2} ${htmlEq(ex)} <b class="s">${P(ex)}</b>. It lies between ${p1}% and ${p2}%, nearer the bigger group.`],
    check: pctCheck(ex, 1, [
      { v: (p1 + p2) / 2, mc: MC.unweighted, say: `That is the plain average of ${p1}% and ${p2}%. The groups differ in size: count the people first.` },
      { v: p1 + p2, say: 'Percents of different groups don’t add. Count the people in each group first.' },
    ], 'Right: count, combine, divide.', 'Turn each percent into a count, add the counts, divide by everybody.'),
  };
};
const pieAngle: Gen = (R, n) => {
  let T: Tb, c = 0, ang = 0;
  for (;;) {
    T = tb(R, { shape: [2, R() < 0.5 ? 2 : 3], friendly: true });
    c = int(R, 0, T.nC - 1); ang = (T.t.col[c]! * 360) / T.t.all;
    if (Math.abs(ang * 10 - Math.round(ang * 10)) < 1e-9) break;
  }
  const Cc = T.x.cols.cats[c]!, p = pct(T.t.col[c]!, T.t.all);
  return {
    id: `pieAngle-${n}`, family: 'pieAngle',
    prompt: `${intro(T)} You draw a circle graph of ${T.x.cols.name} for all ${T.t.all} ${T.x.who}. How many degrees is the <b class="b">${Cc.label}</b> slice?`,
    board: `${frac('\\;?', T.t.all)} \\times 360^\\circ`, input: 'num', unit: '°', answer: { kind: 'num', v: round(ang, 1) },
    picture: { pic: { kind: 'table', table: tableOf(T, null) }, focus: { whole: { kind: 'all', i: 0 }, part: { r: 2, c } }, steps: [`${frac(T.t.col[c]!, T.t.all)} \\times 360^\\circ = ${fmt(ang)}^\\circ`] },
    solution: [`The circle is all <b class="a">${T.t.all}</b>; the ${Cc.label} slice is the column total, <b class="b">${T.t.col[c]}</b>.`, `${T.t.col[c]} ÷ ${T.t.all} × 360° = <b class="s">${fmt(ang)}°</b>.`],
    check: pctCheck(ang, 1, [
      { v: p, mc: MC.pctDeg, say: `${fmt(p)} is the percent. The circle has 360°, not 100: take ${fmt(p)}% of 360°.` },
      { v: (T.cells[0]![c]! * 360) / T.t.all, say: 'That uses one row only. The slice is the whole column total.' },
    ], 'Right.', 'Column total ÷ grand total × 360°.'),
  };
};
const rawCountClaim: Gen = (R, n) => {
  let T: Tb;
  for (;;) {
    T = tb(R, { shape: [2, 2], friendly: true, assoc: 'pos' });
    if (T.cells[1]![0]! > T.cells[0]![0]!) break;
  }
  const A = T.x.rows.cats[0]!, B = T.x.rows.cats[1]!, C = T.x.cols.cats[0]!;
  const p0 = pct(T.cells[0]![0]!, T.t.row[0]!), p1 = pct(T.cells[1]![0]!, T.t.row[1]!);
  const name = pick(R, ['Mia', 'Leo', 'Ravi', 'Zoe']);
  const opts: Opt[] = [
    { t: `No: ${B.group} are a bigger group. Compare percents: ${A.group} are more likely to ${C.has}.`, ok: true, say: `Right: ${P(p0)} against ${P(p1)}.` },
    { t: `Yes: ${T.cells[1]![0]} is more than ${T.cells[0]![0]}.`, mc: MC.oneCell, say: `Counts from groups of different sizes (${T.t.row[0]} and ${T.t.row[1]}) can’t be compared directly. Use each group’s percent.` },
    { t: `Yes, if you divide both counts by all ${T.t.all}.`, mc: MC.notNewWhole, say: 'Dividing both by the same total keeps the same order. Each group needs its own whole.' },
  ];
  return {
    id: `rawCountClaim-${n}`, family: 'rawCountClaim',
    prompt: `${intro(T)} ${name} says: “More ${B.group} than ${A.group} ${C.has} (${T.cells[1]![0]} against ${T.cells[0]![0]}), so ${B.group} are more likely to ${C.has}.” Is ${name} right?`,
    board: `${T.cells[1]![0]} > ${T.cells[0]![0]} \\;\\Rightarrow\\; ?`, input: 'choice', ...choose(R, opts),
    picture: { pic: { kind: 'table', table: tableOf(T, 'col'), bars: { spec: rowBars(T), orient: 'h', atStart: false } }, focus: { grow: true }, steps: [divTex(T.cells[0]![0]!, T.t.row[0]!), divTex(T.cells[1]![0]!, T.t.row[1]!)] },
    solution: [`The groups differ in size: ${T.t.row[0]} and ${T.t.row[1]}.`, `As percents: ${P(p0)} of the ${A.group}, ${P(p1)} of the ${B.group}. The ${A.group} are more likely.`],
  };
};

/** a choice item's worked lines end on the right choice (docs/lessons/QUALITY_LAYER.md: "So: <right choice>" when no
 *  line marks it yet), for every choice family. A category that ends in "p.m." at the end of a sentence would print
 *  "p.m.."; every text gets one dot. */
const oneDot = (s: string) => s.replace(/\b([ap])\.m\.\./g, '$1.m.');
const endsOnChoice = (g: Gen): Gen => (R, n, sg) => {
  const it = g(R, n, sg), chk = it.check;
  it.prompt = oneDot(it.prompt);
  it.solution = it.solution.map(oneDot);
  if (it.choices) it.choices = it.choices.map(oneDot);
  it.check = r => { const v = chk(r); return { ...v, say: oneDot(v.say) }; };
  if (it.input === 'choice' && it.answer.kind === 'choice' && it.choices) it.solution = endOnChoice(it.solution, it.choices[it.answer.i]!);
  return it;
};
export const GENERATORS: Record<FamilyId, Gen> = Object.fromEntries(Object.entries({
  rowPct, colPct, matchQuestion, jointPct, jointRound, marginalPct, marginalFromJoint, weightedTrap, nameType, nameWhole,
  condFromJoint, countUnknown, barSegment, pickGraph, readSeg, readSentence, moreWho, countFromBar, assocTable, pointsDiff,
  assocBars, treeLeaf, treeMissing, fillCell, fromConditional, screenWord, screenPPV, chanceAll, chanceGroup, chanceWho,
  rewriteClaim, confounder, combineGroups, pieAngle, rawCountClaim,
} satisfies Record<FamilyId, Gen>).map(([k, g]) => [k, endsOnChoice(g)])) as Record<FamilyId, Gen>;

