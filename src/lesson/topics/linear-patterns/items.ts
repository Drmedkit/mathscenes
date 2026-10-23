// items.ts: exercise families for "recognize a linear relationship" (grade 8, 8.F.A.3 / 8.F.B.4-5), generated from
// templates, checked exactly, every wrong answer classified against the misconception catalogue
// (math-curriculum-essentials/misconceptions.json ids). A generator gets the SUB-GOAL it practises (plan.ts) and uses
// that sub-goal's number ranges from the topic JSON ('cases'). Pure: no DOM, no canvas; a seeded rng.
// PROBES records, per item, typical wrong responses and the id they must get (tests).
import { type Item, type Response, type Verdict, A, B, S, int, pick, shuffle } from '../../runtime/item';
import { ans, endOnChoice } from '../../runtime/explain';
import { type TGFocus, type TGParams, type TGStep, computeTG, niceGrid, signed } from './TableGraph';

export type FamilyId = 'rowChange' | 'couldBeLinear' | 'perUnit' | 'startValue' | 'wordsToTable' | 'tableToWords' | 'plotPoint' | 'graphMeaning'
  | 'graphChange' | 'graphToWords' | 'compareLines' | 'connectOrNot' | 'lastChange' | 'onALine' | 'unequalGaps' | 'gapRate' | 'contextLinear'
  | 'bestReason' | 'couldOrMust' | 'farPredict';
export const FAMILY_NAMES: Record<FamilyId, string> = {
  rowChange: 'Change from row to row', couldBeLinear: 'Could it be linear?', perUnit: 'Per row and per 1 unit', startValue: 'Find the start',
  wordsToTable: 'Words to table', tableToWords: 'Table to words', plotPoint: 'Plot the missing point', graphMeaning: 'What the line means',
  graphChange: 'Change on a graph', graphToWords: 'Graph to words', compareLines: 'Which grows faster?', connectOrNot: 'Points or a line?',
  lastChange: 'Changes that are not constant', onALine: 'On one straight line?', unequalGaps: 'Uneven steps', gapRate: 'Per 1 unit, uneven steps',
  contextLinear: 'Linear from the words', bestReason: 'The best reason', couldOrMust: 'Could be or must be?', farPredict: 'Predict far ahead',
};

// ---------- pictures ----------
/** what the page draws for an item: a TableGraph, the steps shown at the start, the steps of the worked solution */
export interface LinPic {
  tg: TGParams;
  at: TGStep[];
  solve: TGStep[];
  focus?: TGFocus;
  /** focus once the solution has played (the step that breaks, the points off the line) */
  solved?: TGFocus;
  /** a different picture for the solution (e.g. the table run back to input 0) */
  then?: LinPic;
}
export interface LinItem extends Item {
  family: FamilyId;
  pic?: LinPic;
  /** the TeX line the solution writes on the board */
  hero?: string;
}
export const PROBES = new WeakMap<Item, { r: Response; mc: string }[]>();
const probe = (it: Item, r: Response, mc: string) => { const l = PROBES.get(it) ?? []; l.push({ r, mc }); PROBES.set(it, l); };

// ---------- contexts (US units; money only where it is the point) ----------
export interface Ctx {
  id: string; xh: [string, string]; yh: [string, string]; xName: string; yName: string;
  one: string; many: string; unit: string; money?: boolean; pct?: boolean;
  /** the rule in words for a start s and a change c (c > 0 up, c < 0 down) */
  rule: (s: number, c: number) => string;
  dirs: ('up' | 'down')[];
  discrete: boolean;
  /** what the output is, in a question ("the cost") */ what: string;
}
const $ = (v: number) => `$${v}`;
/** "a" or "an" before a dollar amount read aloud: an $8, an $11, an $18, an $80; a $5 */
export const aAn = (v: number) => (/^8/.test(String(v)) || v === 11 || v === 18 ? 'an' : 'a');
export const CTX: Ctx[] = [
  { id: 'rental', xh: ['hours', ''], yh: ['cost', '($)'], xName: 'hours', yName: 'cost ($)', one: 'hour', many: 'hours', unit: '', money: true, dirs: ['up'], discrete: false, what: 'the cost',
    rule: (s, c) => `A kayak rental costs ${A($(s))} to start, plus ${B($(c))} for each hour.` },
  { id: 'savings', xh: ['week', ''], yh: ['saved', '($)'], xName: 'weeks', yName: 'saved ($)', one: 'week', many: 'weeks', unit: '', money: true, dirs: ['up'], discrete: false, what: 'the amount saved',
    rule: (s, c) => `Maya has ${A($(s))} saved and adds ${B($(c))} each week.` },
  { id: 'spending', xh: ['week', ''], yh: ['left', '($)'], xName: 'weeks', yName: 'money left ($)', one: 'week', many: 'weeks', unit: '', money: true, dirs: ['down'], discrete: false, what: 'the money left',
    rule: (s, c) => `Leo has ${A($(s))} and spends ${B($(-c))} each week.` },
  { id: 'tank', xh: ['min', ''], yh: ['water', '(gal)'], xName: 'minutes', yName: 'water (gal)', one: 'minute', many: 'minutes', unit: 'gallons', dirs: ['up', 'down'], discrete: false, what: 'the water in the tank',
    rule: (s, c) => (c >= 0 ? `A tank holds ${A(`${s} ${one1(s, 'gallons')}`)} and fills ${B(`${c} ${one1(c, 'gallons')}`)} each minute.` : `A tank holds ${A(`${s} ${one1(s, 'gallons')}`)} and drains ${B(`${-c} ${one1(-c, 'gallons')}`)} each minute.`) },
  { id: 'candle', xh: ['hours', ''], yh: ['height', '(in.)'], xName: 'hours', yName: 'height (in.)', one: 'hour', many: 'hours', unit: 'in.', dirs: ['down'], discrete: false, what: 'the height of the candle',
    rule: (s, c) => `A candle ${A(`${s} in.`)} tall burns down ${B(`${-c} in.`)} each hour.` },
  { id: 'plant', xh: ['week', ''], yh: ['height', '(in.)'], xName: 'weeks', yName: 'height (in.)', one: 'week', many: 'weeks', unit: 'in.', dirs: ['up'], discrete: false, what: 'the height of the plant',
    rule: (s, c) => `A bean plant is ${A(`${s} in.`)} tall and grows ${B(`${c} in.`)} each week.` },
  { id: 'tiles', xh: ['step', ''], yh: ['tiles', ''], xName: 'step', yName: 'tiles', one: 'step', many: 'steps', unit: 'tiles', dirs: ['up'], discrete: true, what: 'the number of tiles',
    rule: (s, c) => `A tile pattern starts with ${A(`${s} tiles`)} at step 0 and adds ${B(`${c} tiles`)} each step.` },
  { id: 'hike', xh: ['hours', ''], yh: ['miles', ''], xName: 'hours', yName: 'distance (mi)', one: 'hour', many: 'hours', unit: 'miles', dirs: ['up'], discrete: false, what: 'the distance from the trailhead',
    rule: (s, c) => `A hiker starts ${A(`${s} ${one1(s, 'miles')}`)} from the trailhead and walks ${B(`${c} ${one1(c, 'miles')}`)} farther each hour.` },
  { id: 'battery', xh: ['hours', ''], yh: ['battery', '(%)'], xName: 'hours', yName: 'battery (%)', one: 'hour', many: 'hours', unit: '%', pct: true, dirs: ['down'], discrete: false, what: 'the battery level',
    rule: (s, c) => `A phone battery is at ${A(`${s}%`)} and drops ${B(`${-c}%`)} each hour.` },
  { id: 'vans', xh: ['vans', ''], yh: ['kids', ''], xName: 'vans', yName: 'kids at camp', one: 'van', many: 'vans', unit: 'kids', dirs: ['up'], discrete: true, what: 'the number of kids at camp',
    rule: (s, c) => `${A(`${s} kids`)} are already at camp, and each van brings ${B(`${c} more kids`)}.` },
  { id: 'packs', xh: ['packs', ''], yh: ['cost', '($)'], xName: 'packs', yName: 'cost ($)', one: 'pack', many: 'packs', unit: '', money: true, dirs: ['up'], discrete: true, what: 'the cost',
    rule: (s, c) => `Pens cost ${B($(c))} a pack, plus ${aAn(s)} ${A($(s))} shipping fee for the order.` },
];
const ctxBy = (id: string) => CTX.find(c => c.id === id)!;
const ups = CTX.filter(c => c.dirs.includes('up')), downs = CTX.filter(c => c.dirs.includes('down'));
/** an output with its unit: $5, 20 gallons, 40%, 6 in. */
const amt = (c: Ctx, v: number) => (c.money ? `$${v}` : c.pct ? `${v}%` : `${v} ${one1(v, c.unit)}`);
/** a unit word after 1: 1 gallon, 1 tile, 1 kid ("in." stays) */
function one1(v: number, unit: string): string { return v === 1 ? unit.replace(/s$/, '') : unit; }

// ---------- table helpers ----------
const range = (x0: number, step: number, n: number) => Array.from({ length: n }, (_, i) => x0 + i * step);
const diffsOf = (ys: readonly number[]) => ys.slice(1).map((y, i) => y - ys[i]!);
/** a list of changes for the board, wrapped after three (' | ' starts a board line); NaN shows as ? */
export const txList = (ds: readonly number[]): string => {
  const t = ds.map(d => (Number.isNaN(d) ? '?' : tx(d)));
  return t.length > 4 ? `${t.slice(0, 3).join(',\\,')}, | ${t.slice(3).join(',\\,')}` : t.join(',\\,');
};
/** a plain difference: 3, −6 (after "a − b =") */
const dif = (n: number): string => (n < 0 ? `−${-n}` : String(n));
/** a signed change in TeX, tight: {+}3, {-}6, 0 */
export const tx = (n: number): string => (n > 0 ? `{+}${n}` : n < 0 ? `{-}${-n}` : '0');
const list = (xs: readonly (number | string)[]) => xs.join(', ');
const signedList = (ds: readonly number[]) => ds.map(signed).join(', ');
function tgOf(c: Ctx, xs: number[], ys: number[], extra: Partial<TGParams> = {}): TGParams {
  return { xs, ys, xHead: c.xh, yHead: c.yh, xName: c.xName, yName: c.yName, ...extra };
}
/** a pure check of what the TableGraph can draw (tests; the block itself also checks text widths) */
export function tgFits(p: TGParams): boolean {
  try {
    const m = computeTG(p);
    const allY = [...m.ys, ...(m.ys2 ?? [])];
    if (m.xs.length > 7 || allY.some(y => y > 100) || m.xs.some(x => x > 40)) return false;
    const xGrid = p.xGrid ?? niceGrid(Math.max(...m.xs)), yGrid = p.yGrid ?? niceGrid(Math.max(...allY, 1));
    const xMax = p.xMax ?? Math.max(xGrid, Math.ceil(Math.max(...m.xs) / xGrid) * xGrid);
    const yMax = p.yMax ?? Math.max(yGrid, Math.ceil(Math.max(...allY) / yGrid) * yGrid);
    return xMax % xGrid === 0 && yMax % yGrid === 0 && xMax / xGrid <= 12 && yMax / yGrid <= 10 && allY.every(y => y <= yMax) && m.xs.every(x => x <= xMax);
  } catch { return false; }
}
/** the steps of a worked solution for a table: changes, the graph, then the line (linear) or ruler + path (not) */
function tableSolve(ys: readonly number[], xs: readonly number[]): TGStep[] {
  const m = computeTG({ xs, ys });
  return m.constant ? ['changes', 'axes', 'points', 'stairs', 'line'] : ['changes', 'axes', 'points', 'segments', 'ruler'];
}
function breakFocus(ys: readonly number[], xs: readonly number[]): TGFocus {
  const m = computeTG({ xs, ys });
  return m.constant ? {} : { hot: [m.firstBreak], hotCol: 'wrong', missK: 1 };
}

// ---------- choice items ----------
interface Opt { t: string; ok: boolean; mc?: string; say: string }
function choices(R: () => number, opts: Opt[]): { choices: string[]; check: (r: Response) => Verdict; answer: Response; wrong: { i: number; mc: string }[] } {
  const o = shuffle(R, [...opts]);
  const right = o.findIndex(x => x.ok);
  return {
    choices: o.map(x => x.t),
    check: r => {
      if (r.kind !== 'choice' || !o[r.i]) return { ok: false, say: 'Pick one of the answers.' };
      const x = o[r.i]!;
      return { ok: x.ok, mc: x.mc, say: x.say };
    },
    answer: { kind: 'choice', i: right },
    wrong: o.map((x, i) => ({ i, mc: x.mc ?? '' })).filter(x => x.mc),
  };
}
/** every choice item passes here: the probes, and the worked solution ends on the right choice (QUALITY_LAYER.md) */
function withProbes<T extends LinItem>(it: T, wrong: { i: number; mc: string }[]): T {
  for (const w of wrong) probe(it, { kind: 'choice', i: w.i }, w.mc);
  if (it.input === 'choice' && it.answer.kind === 'choice') it.solution = endOnChoice(it.solution, it.choices![it.answer.i]!);
  return it;
}
const numOf = (r: Response): number | null => (r.kind === 'num' && Number.isFinite(r.v) ? r.v : null);

// ---------- linear table makers ----------
/** a linear table with consecutive (or `step`) inputs that stays within 0..100 */
function linTable(R: () => number, o: { n?: [number, number]; x0?: number[]; step?: number; c: [number, number]; s?: [number, number]; down?: boolean; maxY?: number }): { xs: number[]; ys: number[]; s: number; c: number } {
  const maxY = o.maxY ?? 100;
  for (;;) {
    const n = int(R, o.n?.[0] ?? 4, o.n?.[1] ?? 6), x0 = pick(R, o.x0 ?? [0, 1]), step = o.step ?? 1;
    const mag = int(R, o.c[0], o.c[1]), c = o.down ? -mag : mag;
    const s = int(R, o.s?.[0] ?? 1, o.s?.[1] ?? 30) + (o.down ? (n - 1 + x0) * mag : 0);
    const xs = range(x0, step, n), ys = xs.map(x => s + c * x);
    if (ys.every(y => y >= 0 && y <= maxY) && s <= maxY) return { xs, ys, s, c };
  }
}

// =====================================================================================================================
// 1. rowChange: the output change from each row to the next (sub-goals change-between-rows, constant-decrease-and-zero)
const rowChange = (R: () => number, n: number, sg?: string): LinItem => {
  const down = sg === 'constant-decrease-and-zero';
  const c = pick(R, down ? downs : ups);
  const t = linTable(R, { c: down ? pick(R, [[2, 2], [5, 5], [10, 10], [1, 6]] as [number, number][]) : [1, 10], s: [1, 30], down, n: [4, 6] });
  const mag = Math.abs(t.c);
  const unit = `${c.money ? 'dollars' : c.pct ? 'percent' : c.unit} ${down ? 'less' : 'more'} each row`;
  const it: LinItem = {
    id: `rowChange-${n}`, family: 'rowChange',
    prompt: '',
    board: `\\text{each row: }\\ ?`, input: 'num', unit,
    pic: { tg: tgOf(c, t.xs, t.ys), at: ['table'], solve: ['changes', 'axes', 'points', 'stairs', 'line'] },
    hero: `\\text{every row: }\\ ${tx(t.c)}`,
    solution: [`Subtract each output from the NEXT output: ${t.ys[1]} − ${t.ys[0]} = ${dif(t.c)}, ${t.ys[2]} − ${t.ys[1]} = ${dif(t.c)}, and so on.`,
      `Every row changes by ${signed(t.c)}: ${S(String(mag))} ${down ? 'less' : 'more'} each row.`],
    answer: { kind: 'num', v: mag },
    check: r => {
      const v = numOf(r);
      if (v === null) return { ok: false, say: 'Type a number.' };
      if (Math.abs(v) === mag) return { ok: true, say: `Yes: every row ${down ? 'goes down' : 'goes up'} by ${mag}. ${t.ys[1]} − ${t.ys[0]} = ${dif(t.c)}, and the same for every row.` };
      if (t.ys.includes(v)) return { ok: false, mc: 'mc.linear-functions.output-value-as-change', say: `${v} is an output in the table, not a change. A change is the difference between two outputs next to each other: ${t.ys[1]} − ${t.ys[0]} = ${dif(t.c)}.` };
      if (t.xs.some((x, i) => t.ys[i]! - x === v || x - t.ys[i]! === v)) return { ok: false, mc: 'mc.linear-functions.row-correspondence-as-change', say: `That compares the input with the output in ONE row. The change goes DOWN the output column: ${t.ys[0]} to ${t.ys[1]} is ${signed(t.c)}.` };
      return { ok: false, say: `Not quite. Go down the output column: ${t.ys[0]} to ${t.ys[1]} is ${signed(t.c)}, ${t.ys[1]} to ${t.ys[2]} is ${signed(t.c)}.` };
    },
  };
  it.prompt = `The table shows ${c.what} (${c.xName} → ${c.yName.replace(/ \(.*\)/, '')}). By how much does the output ${down ? 'go down' : 'go up'} from each row to the next?`;
  for (let i = 0; i < t.xs.length; i++) {
    const rc = t.ys[i]! - t.xs[i]!;
    if (rc > 0 && rc !== mag && !t.ys.includes(rc)) { probe(it, { kind: 'num', v: rc }, 'mc.linear-functions.row-correspondence-as-change'); break; }
  }
  if (t.ys[1] !== mag) probe(it, { kind: 'num', v: t.ys[1]! }, 'mc.linear-functions.output-value-as-change');
  return it;
};

// 2. couldBeLinear: same change every row? (constant-or-not, constant-decrease-and-zero, growing-differences, other-nonconstant)
type Shape = 'const' | 'break' | 'down' | 'zero' | 'grow' | 'shrink' | 'irregular';
function shapeTable(R: () => number, shape: Shape): { xs: number[]; ys: number[]; c: Ctx } {
  for (;;) {
    const n = int(R, 5, 6);
    let xs = range(pick(R, [0, 1]), 1, n), ys: number[] = [];
    let c = pick(R, ups);
    if (shape === 'const') { const t = linTable(R, { c: [1, 10], n: [n, n] }); xs = t.xs; ys = t.ys; }
    else if (shape === 'down') { c = pick(R, downs); const t = linTable(R, { c: pick(R, [[2, 2], [5, 5], [10, 10], [1, 8]] as [number, number][]), down: true, n: [n, n], s: [0, 20] }); xs = t.xs; ys = t.ys; }
    else if (shape === 'zero') { c = pick(R, [ctxBy('tank'), ctxBy('savings'), ctxBy('plant'), ctxBy('battery')]); const v = int(R, 3, 60); ys = xs.map(() => v); }
    else if (shape === 'break') {
      // the first two changes agree, a later one (middle or last) differs
      const d = int(R, 2, 9), s = int(R, 1, 30), at = int(R, 2, n - 2), e = d + pick(R, [-1, 1, 2, -2]);
      if (e <= 0) continue;
      ys = [s]; for (let i = 1; i < n; i++) ys.push(ys[i - 1]! + (i - 1 >= at ? e : d));
    } else if (shape === 'grow') {
      const kind = pick(R, ['square', 'stair', 'double'] as const);
      const base = int(R, 0, 10);
      if (kind === 'square') ys = xs.map(x => base + x * x);
      else if (kind === 'stair') { let v = base + 1; ys = xs.map((_, i) => (v += i)); }
      else ys = xs.map(x => base + 2 ** x);
    } else if (shape === 'shrink') {
      const first = pick(R, [8, 10, 12, 16, 20]), s = int(R, 0, 20);
      const ds = first === 8 ? [8, 4, 2, 1, 1] : first === 16 ? [16, 8, 4, 2, 1] : first === 12 ? [12, 9, 6, 3, 1] : first === 10 ? [10, 8, 6, 4, 2] : [20, 15, 10, 5, 2];
      ys = [s]; for (let i = 1; i < n; i++) ys.push(ys[i - 1]! + ds[i - 1]!);
    } else {
      const s = int(R, 0, 25); ys = [s];
      const ds = shuffle(R, [2, 3, 5, 4, 6, 7].slice(0, n - 1));
      for (let i = 1; i < n; i++) ys.push(ys[i - 1]! + ds[i - 1]!);
    }
    if (!ys.every(y => y >= 0 && y <= 100)) continue;
    const m = computeTG({ xs, ys });
    if ((shape === 'const' || shape === 'down' || shape === 'zero') !== m.constant) continue;
    return { xs, ys, c };
  }
}
const couldBeLinear = (R: () => number, n: number, sg?: string): LinItem => {
  const shape: Shape = sg === 'constant-or-not' ? pick(R, ['const', 'break', 'break'] as const)
    : sg === 'constant-decrease-and-zero' ? pick(R, ['down', 'down', 'zero', 'break'] as const)
      : sg === 'growing-differences' ? pick(R, ['grow', 'grow', 'grow', 'const'] as const)
        : sg === 'other-nonconstant' ? pick(R, ['shrink', 'irregular', 'shrink'] as const)
          : pick(R, ['const', 'break', 'down', 'grow', 'shrink'] as const);
  const { xs, ys, c } = shapeTable(R, shape);
  const ds = diffsOf(ys), m = computeTG({ xs, ys });
  const allUp = ds.every(d => d > 0);
  const lin = m.constant;
  const opts: Opt[] = [];
  const why = `The changes are ${signedList(ds)}.`;
  if (lin) {
    opts.push({ t: `Yes: the output changes by ${signed(ds[0]!)} every row`, ok: true, say: `Yes. ${why} The same change for every equal step, so it could be linear.` });
    if (ds[0]! <= 0) opts.push({ t: ds[0] === 0 ? 'No: nothing changes, so there is no pattern' : 'No: the output goes down, not up', ok: false, mc: 'mc.linear-functions.constant-change-must-increase', say: `${why} A constant change can be a decrease, or 0. The same change every row is what counts.` });
    else opts.push({ t: 'No: it does not start at 0', ok: false, mc: 'mc.linear-functions.linear-means-proportional', say: `A linear relationship can start anywhere. ${why} The same every row, so it could be linear.` });
    opts.push({ t: 'No: the changes are not all the same', ok: false, say: `Check again: ${why}` });
  } else {
    opts.push({ t: 'No: the change is not the same every row', ok: true, say: `Right. ${why} One different change is enough: not linear.` });
    if (shape === 'break') opts.push({ t: `Yes: it goes ${ds[0]! > 0 ? 'up' : 'down'} ${Math.abs(ds[0]!)} each row`, ok: false, mc: 'mc.reasoning-language.checks-only-some-given-cases', say: `The first changes are ${signed(ds[0]!)}, but check them ALL: ${why}` });
    else if (shape === 'shrink' || shape === 'irregular') opts.push({ t: 'Yes: the changes do not grow', ok: false, mc: 'mc.linear-functions.nonlinear-only-curving-up', say: `Changes that shrink or jump around are not constant either. ${why}` });
    else opts.push({ t: 'Yes: the changes follow a pattern too', ok: false, mc: 'mc.linear-functions.illusion-of-linearity', say: `A pattern in the changes is not the same change. ${why} They grow, so it is not linear.` });
    if (allUp) opts.push({ t: 'Yes: the output goes up every row', ok: false, mc: 'mc.linear-functions.illusion-of-linearity', say: `Going up is not enough. ${why} Linear needs the SAME change every row.` });
    else opts.push({ t: 'Yes: the outputs are all whole numbers', ok: false, say: `Whole numbers don't decide it. ${why}` });
  }
  const ch = choices(R, opts);
  return withProbes({
    id: `couldBeLinear-${n}`, family: 'couldBeLinear',
    prompt: `The table shows ${c.what}. Could this table represent a linear relationship (the same change for every step)?`,
    board: `\\text{linear?}`, input: 'choice', choices: ch.choices,
    pic: { tg: tgOf(c, xs, ys), at: ['table'], solve: tableSolve(ys, xs), solved: breakFocus(ys, xs) },
    hero: lin ? `\\text{same change:} | \\text{linear}` : `\\text{changes:} | ${txList(ds)}`,
    solution: [`Find every change down the output column: ${signedList(ds)}.`, lin ? 'They are all the same: it could be linear, and the points lie on one straight line.' : 'They are not all the same: not linear. The points do not lie on one straight line.'],
    answer: ch.answer, check: ch.check,
  }, ch.wrong);
};

// 3. perUnit: the input step is 2, 5 or 10: change per row and per 1 input unit (equal-steps-larger-than-one)
const perUnit = (R: () => number, n: number): LinItem => {
  for (;;) {
    const step = pick(R, [2, 5, 10]), down = R() < 0.3;
    const c = pick(R, down ? downs : ups);
    const u = step === 2 ? int(R, 1, 10) : step === 5 ? int(R, 1, 6) : int(R, 1, 4);
    const x0 = step === 10 ? pick(R, [0, 10]) : 0, rows = step === 10 ? 4 : int(R, 4, 5);
    const xs = range(x0, step, rows);
    const s = int(R, 0, 20) + (down ? u * xs[rows - 1]! : 0);
    const ys = xs.map(x => s + (down ? -u : u) * x);
    if (!ys.every(y => y >= 0 && y <= 100)) continue;
    const per = step * u;
    const word = down ? 'less' : 'more';
    const it: LinItem = {
      id: `perUnit-${n}`, family: 'perUnit',
      prompt: `The table shows ${c.what}. The input goes up ${step} ${c.many} each row. How much ${word} is the output per row, and per 1 ${c.one}?`,
      board: `\\text{per 1 ${c.one}} = \\,?`, input: 'pair', pairLead: 'Per row', pairOp: `per 1 ${c.one}`,
      pic: { tg: tgOf(c, xs, ys, { xGrid: step }), at: ['table', 'axes', 'points'], solve: ['changes', 'stairs', 'units', 'line'] },
      hero: `${per} \\div ${step} = ${u}`,
      solution: [`Per row: ${ys[1]} − ${ys[0]} = ${dif(ys[1]! - ys[0]!)}, the same every row: ${S(String(per))} ${word}.`, `One row is ${step} ${c.many}, so per 1 ${c.one}: ${per} ÷ ${step} = ${S(String(u))} ${word}.`],
      answer: { kind: 'pair', x: per, y: u },
      check: r => {
        if (r.kind !== 'pair') return { ok: false, say: 'Fill in both boxes.' };
        const x = Math.abs(r.x), y = Math.abs(r.y);
        if (x === per && y === u) return { ok: true, say: `Yes: ${per} per row, and a row is ${step} ${c.many}, so ${per} ÷ ${step} = ${u} per ${c.one}.` };
        if (x === per && y === per) return { ok: false, mc: 'mc.linear-functions.ignores-input-step', say: `${per} is the change for ${step} ${c.many}. For ONE ${c.one}, divide by the step: ${per} ÷ ${step} = ${u}.` };
        if (x === u && y === per) return { ok: false, say: `Swapped: the row is the bigger change (${per}); per 1 ${c.one} is ${u}.` };
        if (x === per) return { ok: false, say: `The change per row is right. Per 1 ${c.one}: ${per} ÷ ${step} = ${u}.` };
        return { ok: false, say: `Per row the output changes by ${per}. One row is ${step} ${c.many}, so per 1 ${c.one} it is ${per} ÷ ${step} = ${u}.` };
      },
    };
    probe(it, { kind: 'pair', x: per, y: per }, 'mc.linear-functions.ignores-input-step');
    return it;
  }
};

// 4. startValue: the output at input 0, stepping back when the table starts at 1 or 2 (start-value)
const startValue = (R: () => number, n: number): LinItem => {
  for (;;) {
    const down = R() < 0.35, c = pick(R, down ? downs : ups);
    const x0 = pick(R, [0, 1, 1, 2, 2]), mag = int(R, 2, 9), rows = int(R, 4, 5);
    const s = R() < 0.15 && !down ? 0 : int(R, 1, 40);
    const ch = down ? -mag : mag;
    const xs = range(x0, 1, rows), ys = xs.map(x => s + ch * x);
    const all = [s, ...ys];
    if (!all.every(y => y >= 0 && y <= 100)) continue;
    const y0 = ys[0]!, fwd = y0 + ch;
    const ok0 = x0 === 0;
    const back = x0 === 0 ? '' : ` The change is the same for every ${c.one}, back to 0 ${c.many} too.`;
    const xs0 = range(0, 1, rows + x0), ys0 = xs0.map(x => s + ch * x);
    const it: LinItem = {
      id: `startValue-${n}`, family: 'startValue',
      prompt: `The table shows ${c.what}.${back} What is the output at 0 ${c.many} (the start)?`,
      board: `\\text{at 0 ${c.many}:}\\ \\,?`, input: 'num', unit: c.money ? 'dollars' : c.pct ? 'percent' : c.unit,
      pic: { tg: tgOf(c, xs, ys), at: ['table', 'axes', 'points'], solve: ['changes'],
        then: { tg: tgOf(c, xs0, ys0), at: ['table', 'axes', 'points'], solve: ['changes', 'stairs', 'line', 'start'] } },
      hero: ok0 ? `\\text{start} = ${s}` : `${y0} ${ch > 0 ? '-' : '+'} ${x0 === 1 ? mag : `${x0} \\times ${mag}`} = ${s}`,
      solution: ok0 ? [`The start is the output at input 0: look for the row for 0 ${c.many}.`, `That row is in the table: the start is ${S(String(s))}.`]
        : [`The change is ${signed(ch)} each ${c.one}. Going BACK one ${c.one} undoes it: ${ch > 0 ? 'subtract' : 'add'} ${mag}.`,
          `${x0 === 1 ? `${y0} ${ch > 0 ? '−' : '+'} ${mag}` : `${y0} ${ch > 0 ? '−' : '+'} ${mag} ${ch > 0 ? '−' : '+'} ${mag}`} = ${S(String(s))}: that is the output at 0 ${c.many}.`],
      answer: { kind: 'num', v: s },
      check: r => {
        const v = numOf(r);
        if (v === null) return { ok: false, say: 'Type a number.' };
        if (v === s) return { ok: true, say: ok0 ? `Yes: at 0 ${c.many} the output is ${s}.` : `Yes: step back ${x0} ${x0 === 1 ? c.one : c.many} from ${y0}, undoing ${signed(ch)} each time: ${s}.` };
        if (!ok0 && v === y0) return { ok: false, mc: 'mc.linear-functions.first-output-as-intercept', say: `${y0} is the output at ${x0} ${x0 === 1 ? c.one : c.many}, the first row shown, not at 0. Step back: ${ch > 0 ? 'subtract' : 'add'} ${mag} for each ${c.one}.` };
        if (!ok0 && (v === fwd || v === y0 + ch * x0)) return { ok: false, mc: 'mc.sequences-series.forward-op-when-backward', say: `Going back you undo the change: ${ch > 0 ? 'subtract' : 'add'} ${mag}, don't ${ch > 0 ? 'add' : 'subtract'} it. The start is ${s}.` };
        if (v === 0 && s !== 0) return { ok: false, mc: 'mc.linear-functions.linear-means-proportional', say: `A linear pattern does not have to start at 0. Step back along the table: the start is ${s}.` };
        return { ok: false, say: `Not quite. The change is ${signed(ch)} each ${c.one}; step back to 0 ${c.many}: ${s}.` };
      },
    };
    if (!ok0) { probe(it, { kind: 'num', v: y0 }, 'mc.linear-functions.first-output-as-intercept'); if (fwd !== s && fwd >= 0 && fwd !== 0) probe(it, { kind: 'num', v: fwd }, 'mc.sequences-series.forward-op-when-backward'); }
    if (s !== 0 && y0 !== 0 && fwd !== 0) probe(it, { kind: 'num', v: 0 }, 'mc.linear-functions.linear-means-proportional');
    return it;
  }
};

// 5. wordsToTable: the rule in words -> which table? (words-to-table)
const wordsToTable = (R: () => number, n: number): LinItem => {
  for (;;) {
    const down = R() < 0.3, c = pick(R, down ? downs : ups);
    const mag = int(R, 2, 9), s = down ? int(R, 4 * mag, Math.min(100, 4 * mag + 40)) : int(R, 2, 30);
    const ch = down ? -mag : mag;
    const xs = [0, 1, 2, 3];
    const row = (st: number, d: number) => xs.map(x => st + d * x);
    const right = row(s, ch);
    const noStart = xs.map(x => mag * x);
    const s2 = s + pick(R, [-1, 1]) * int(R, 1, 4) * (mag > 2 ? 1 : 2), d2 = mag + pick(R, [-1, 1, 2]);
    if (s2 < 0 || d2 <= 0 || d2 === mag || s2 === s) continue;
    const otherStart = row(s2, ch), otherChange = row(s, down ? -d2 : d2);
    const rows = [right, noStart, otherStart, otherChange];
    if (!rows.every(r => r.every(y => y >= 0 && y <= 100))) continue;
    const txt = rows.map(r => list(r.map(v => amt(c, v))));
    if (new Set(txt).size !== 4) continue;
    const ch_ = choices(R, [
      { t: txt[0]!, ok: true, say: `Yes: it starts at ${amt(c, s)} and changes by ${signed(ch)} each ${c.one}.` },
      { t: txt[1]!, ok: false, mc: 'mc.linear-functions.drops-start-value', say: `That table leaves out the start. At 0 ${c.many} it is already ${amt(c, s)}, then ${signed(ch)} each ${c.one}.` },
      { t: txt[2]!, ok: false, mc: 'mc.linear-functions.matches-on-one-feature', say: `The change matches (${signed(ch)}), but the start does not: at 0 ${c.many} it must be ${amt(c, s)}.` },
      { t: txt[3]!, ok: false, mc: 'mc.reasoning-language.one-feature-sufficient-for-match', say: `The start matches, but the change does not: it must be ${signed(ch)} each ${c.one}. Check both.` },
    ]);
    return withProbes({
      id: `wordsToTable-${n}`, family: 'wordsToTable',
      prompt: `${c.rule(s, ch)} Which list shows ${c.what} after 0, 1, 2 and 3 ${c.many}?`,
      board: `\\text{start } ${s} | ${tx(ch)}\\ \\text{each ${c.one}}`, input: 'choice', choices: ch_.choices,
      pic: { tg: tgOf(c, xs, right), at: [], solve: ['table', 'changes', 'axes', 'points', 'line', 'start'] },
      hero: `${s},\\,${right.slice(1).join(',\\,')}`,
      solution: [`Start at 0 ${c.many}: ${amt(c, s)}.`, `Then ${signed(ch)} each ${c.one}: ${list(right.map(v => amt(c, v)))}.`, 'Both the start and the change must match.'],
      answer: ch_.answer, check: ch_.check,
    }, ch_.wrong);
  }
};

// 6. tableToWords: the table -> which description? (words-to-table)
const tableToWords = (R: () => number, n: number): LinItem => {
  for (;;) {
    const down = R() < 0.3, c = pick(R, down ? downs : ups);
    const mag = int(R, 2, 9), x0 = pick(R, [0, 0, 1]), rows = 4;
    const s = down ? int(R, 4 * mag + 2, Math.min(95, 4 * mag + 40)) : int(R, 2, 30);
    if (s === mag) continue;
    const ch = down ? -mag : mag, xs = range(x0, 1, rows), ys = xs.map(x => s + ch * x);
    if (!ys.every(y => y >= 0 && y <= 100)) continue;
    const verb = down ? 'goes down' : 'goes up';
    const say = (st: number, d: number) => `Starts at ${amt(c, st)}, ${verb} ${amt(c, d)} each ${c.one}`;
    const wrongStart = x0 === 1 ? ys[0]! : s + int(R, 2, 6);
    const d2 = mag + pick(R, [1, 2, 3]);
    const opts: Opt[] = [
      { t: say(s, mag), ok: true, say: `Yes: at 0 ${c.many} it is ${amt(c, s)}, and every ${c.one} it ${verb} ${mag}.` },
      { t: say(mag, s), ok: false, mc: 'mc.linear-functions.swaps-m-and-b', say: `Start and change are swapped. The start is the output at 0 ${c.many} (${amt(c, s)}); the change is ${signed(ch)} each ${c.one}.` },
      { t: say(wrongStart, mag), ok: false, mc: x0 === 1 ? 'mc.linear-functions.first-output-as-intercept' : 'mc.linear-functions.matches-on-one-feature', say: x0 === 1 ? `${amt(c, ys[0]!)} is at 1 ${c.one}. Step back one ${c.one} to 0: ${amt(c, s)}.` : `The change matches, but the start does not: at 0 ${c.many} it is ${amt(c, s)}.` },
      { t: say(s, d2), ok: false, mc: 'mc.reasoning-language.one-feature-sufficient-for-match', say: `The start matches, but each ${c.one} it ${verb} ${mag}, not ${d2}. Check both.` },
    ];
    if (new Set(opts.map(o => o.t)).size !== 4) continue;
    const ch_ = choices(R, opts);
    return withProbes({
      id: `tableToWords-${n}`, family: 'tableToWords',
      prompt: `The table shows ${c.what}.${x0 ? ` The change is the same back to 0 ${c.many}.` : ''} Which description matches it?`,
      board: `\\text{start?} | \\text{change?}`, input: 'choice', choices: ch_.choices,
      pic: { tg: tgOf(c, xs, ys), at: ['table'], solve: x0 ? ['changes', 'axes', 'points', 'line'] : ['changes', 'axes', 'points', 'line', 'start'] },
      hero: `\\text{start } ${s} | ${tx(ch)}\\ \\text{each ${c.one}}`,
      solution: [`The change: ${ys[1]} − ${ys[0]} = ${dif(ch)} every row.`, x0 ? `The start: step back from 1 ${c.one} to 0: ${ys[0]} ${ch > 0 ? '−' : '+'} ${mag} = ${s}.` : `The start is the output at 0 ${c.many}: ${s}.`, `${S(say(s, mag))}.`],
      answer: ch_.answer, check: ch_.check,
    }, ch_.wrong);
  }
};

// 7. plotPoint: the missing point of the graph, as (input, output) (table-to-graph-line)
const plotPoint = (R: () => number, n: number): LinItem => {
  for (;;) {
    const scale = pick(R, [1, 2, 5, 10]);
    const shape = pick(R, ['up', 'up', 'down', 'flat'] as const);
    const c = pick(R, shape === 'down' ? downs : shape === 'flat' ? [ctxBy('tank'), ctxBy('savings'), ctxBy('plant')] : ups);
    const rows = int(R, 4, 5), x0 = 0;
    const xs = range(x0, 1, rows);
    const per = shape === 'flat' ? 0 : scale * int(R, 1, scale === 1 ? 2 : 2);
    const s = scale * int(R, shape === 'down' ? rows : 0, scale === 1 ? 8 : 9);
    const ch = shape === 'down' ? -per : per;
    const ys = xs.map(x => s + ch * x);
    const yMax = scale * Math.max(5, Math.ceil(Math.max(...ys) / scale));
    if (!ys.every(y => y >= 0 && y <= 100) || yMax / scale > 10) continue;
    const hide = int(R, 1, rows - 1), hx = xs[hide]!, hy = ys[hide]!;
    if (hx === hy) continue;
    const it: LinItem = {
      id: `plotPoint-${n}`, family: 'plotPoint',
      prompt: `One row of the table is not on the graph yet. Which point is missing? Give it as (input, output).${scale > 1 ? ` Careful: one square up is ${scale} ${c.unit || 'dollars'}.` : ''}`,
      board: `(\\,?\\,,\\ ?\\,)`, input: 'pair', pairLead: '(', pairOp: ',',
      pic: { tg: tgOf(c, xs, ys, { yGrid: scale, yMax }), at: ['table', 'axes', 'points'], solve: ['points', 'stairs', 'line'], focus: { hidePoint: hide }, solved: { row: hide, rowCol: 'pick' } },
      hero: `(${hx},\\ ${hy})`,
      solution: [`The missing row is ${hx} ${hx === 1 ? c.one : c.many} → ${amt(c, hy)}.`, `Input first (across), output second (up): (${S(String(hx))}, ${S(String(hy))}).`, `It lands on the same straight line as the others.`],
      answer: { kind: 'pair', x: hx, y: hy },
      check: r => {
        if (r.kind !== 'pair') return { ok: false, say: 'Fill in both boxes.' };
        if (r.x === hx && r.y === hy) return { ok: true, say: `Yes: (${hx}, ${hy}): ${hx} across, ${hy} up. It sits on the same straight line.` };
        if (r.x === hy && r.y === hx) return { ok: false, mc: 'mc.coordinate-geometry.reverses-coordinate-order', say: `Swapped: the input comes first (across), then the output (up): (${hx}, ${hy}).` };
        if (r.x === hx && scale > 1 && r.y === hy / scale) return { ok: false, mc: 'mc.measurement-units.misjudges-interval-value', say: `${hy / scale} counts squares, but one square is ${scale}. The output is ${hy}.` };
        return { ok: false, say: `Find the row that has no point: ${hx} → ${hy}. As a point: (${hx}, ${hy}).` };
      },
    };
    probe(it, { kind: 'pair', x: hy, y: hx }, 'mc.coordinate-geometry.reverses-coordinate-order');
    if (scale > 1 && hy % scale === 0 && hy / scale !== hy && !(hx === hy && hy / scale === hx)) probe(it, { kind: 'pair', x: hx, y: hy / scale }, 'mc.measurement-units.misjudges-interval-value');
    return it;
  }
};

// 8. graphMeaning: what a straight graph says about the situation (table-to-graph-line)
const graphMeaning = (R: () => number, n: number): LinItem => {
  const kind = pick(R, ['hike', 'tank', 'candle'] as const);
  const c = ctxBy(kind);
  const mag = int(R, 2, 5), rows = 5;
  const s = kind === 'candle' ? int(R, 4 * mag + 2, 4 * mag + 12) : int(R, 0, 10);
  const ch = kind === 'candle' ? -mag : mag;
  const xs = range(0, 1, rows), ys = xs.map(x => s + ch * x);
  const right = kind === 'hike' ? `The hiker covers the same ${mag} miles every hour` : kind === 'tank' ? `The tank gains the same ${mag} gallons every minute` : `The candle loses the same ${mag} in. every hour`;
  const picture = kind === 'hike' ? 'The trail goes straight up a hill' : kind === 'tank' ? 'The tank is shaped like a ramp' : 'The candle is shaped like a slope';
  const faster = kind === 'hike' ? 'The hiker walks faster and faster' : kind === 'tank' ? 'The tank fills faster and faster' : 'The candle burns faster and faster';
  const ch_ = choices(R, [
    { t: right, ok: true, say: `Yes: each step right (1 ${c.one}) the line goes ${ch > 0 ? 'up' : 'down'} the same ${mag}. Straight line = same change.` },
    { t: picture, ok: false, mc: 'mc.functions-concept.graph-as-picture', say: `The graph is not a picture of the place. Read the axes: across is ${c.xName}, up is ${c.yName}. Straight means the same change every ${c.one}.` },
    { t: faster, ok: false, say: `Faster and faster would bend the line (bigger steps up). A straight line has the same change every ${c.one}.` },
  ]);
  return withProbes({
    id: `graphMeaning-${n}`, family: 'graphMeaning',
    prompt: `The graph shows ${c.what}: ${c.xName} across, ${c.yName} up. What does the straight line tell you?`,
    board: `\\text{straight line?}`, input: 'choice', choices: ch_.choices,
    pic: { tg: tgOf(c, xs, ys, { show: 'graph' }), at: ['axes', 'points', 'line'], solve: ['stairs'] },
    hero: `${tx(ch)}\\ \\text{every ${c.one}}`,
    solution: [`Step right 1 ${c.one}: the line goes ${ch > 0 ? 'up' : 'down'} ${mag}. Every step is the same.`, `So ${S(right.toLowerCase())}.`],
    answer: ch_.answer, check: ch_.check,
  }, ch_.wrong);
};

// 9. graphChange: the change per 1 input unit read from a graph, with the scale (change-on-graph)
const graphChange = (R: () => number, n: number): LinItem => {
  for (;;) {
    const yScale = pick(R, [1, 5, 10, 5]), xStep = pick(R, [1, 1, 2]);
    const down = R() < 0.35, c = pick(R, down ? downs : ups);
    const u = yScale === 1 ? int(R, 1, 3) : yScale * int(R, 1, 2) / (xStep === 2 ? 1 : 1);
    const rate = xStep === 2 && yScale === 1 ? int(R, 1, 4) : u;
    const rows = 4, xs = range(0, xStep, rows);
    const span = rate * xs[rows - 1]!;
    const s = down ? span + yScale * int(R, 0, 2) : yScale * int(R, 0, 3);
    const ys = xs.map(x => s + (down ? -rate : rate) * x);
    const top = Math.max(...ys), yMax = yScale * Math.max(4, Math.ceil(top / yScale));
    if (!ys.every(y => y >= 0 && y <= 100) || yMax / yScale > 10 || !Number.isInteger(rate)) continue;
    const squares = rate / yScale, perStep = rate * xStep;
    const word = down ? 'less' : 'more';
    const it: LinItem = {
      id: `graphChange-${n}`, family: 'graphChange',
      prompt: `The graph shows ${c.what}. By how much does the output change for each 1 ${c.one}? Read the scale on both axes.`,
      board: `\\text{per 1 ${c.one}} = \\,?`, input: 'num', unit: `${c.money ? 'dollars' : c.pct ? 'percent' : c.unit} ${word} per ${c.one}`,
      pic: { tg: tgOf(c, xs, ys, { show: 'graph', yGrid: yScale, yMax, xGrid: 1, xMax: xs[rows - 1]! }), at: ['axes', 'points', 'line'], solve: xStep > 1 ? ['stairs', 'units'] : ['stairs'] },
      hero: xStep > 1 ? `${perStep} \\div ${xStep} = ${rate}` : `${tx(down ? -rate : rate)}\\ \\text{per ${c.one}}`,
      solution: [`From one point to the next the input goes ${xStep} ${xStep === 1 ? c.one : c.many} and the output ${down ? 'drops' : 'rises'} ${perStep}${yScale > 1 ? ` (${perStep / yScale} ${one1(perStep / yScale, 'squares')} of ${yScale})` : ''}.`,
        xStep > 1 ? `Per 1 ${c.one}: ${perStep} ÷ ${xStep} = ${S(String(rate))} ${word}.` : `So ${S(String(rate))} ${word} per ${c.one}.`],
      answer: { kind: 'num', v: rate },
      check: r => {
        const v = numOf(r);
        if (v === null) return { ok: false, say: 'Type a number.' };
        const a = Math.abs(v);
        if (a === rate) return { ok: true, say: `Yes: ${rate} ${word} for every 1 ${c.one}.` };
        if (yScale > 1 && (a === squares || a === perStep / yScale)) return { ok: false, mc: 'mc.linear-functions.steepness-ignores-scale', say: `${a} counts squares. One square up is ${yScale}, so the change is ${rate} per ${c.one}.` };
        if (xStep > 1 && a === perStep) return { ok: false, mc: 'mc.linear-functions.ignores-input-step', say: `${perStep} is the change for ${xStep} ${c.many}. Per 1 ${c.one}: ${perStep} ÷ ${xStep} = ${rate}.` };
        if (ys.includes(a)) return { ok: false, mc: 'mc.linear-functions.output-value-as-change', say: `${a} is a value on the graph, not a change. The change is how far it moves up or down for 1 ${c.one}: ${rate}.` };
        return { ok: false, say: `Step 1 ${c.one} right and read how far the line moves: ${rate}.` };
      },
    };
    if (yScale > 1 && squares !== rate && !ys.includes(squares)) probe(it, { kind: 'num', v: squares }, 'mc.linear-functions.steepness-ignores-scale');
    if (xStep > 1 && perStep !== rate && !ys.includes(perStep) && perStep / yScale !== perStep && (yScale === 1 || (perStep !== squares && perStep !== perStep / yScale))) probe(it, { kind: 'num', v: perStep }, 'mc.linear-functions.ignores-input-step');
    const oy = ys.find(y => y !== rate && y !== perStep && y !== squares && y !== perStep / yScale && y > 0);
    if (oy !== undefined) probe(it, { kind: 'num', v: oy }, 'mc.linear-functions.output-value-as-change');
    return it;
  }
};

// 10. graphToWords: describe the graph by its start and change (graph-to-words)
const graphToWords = (R: () => number, n: number): LinItem => {
  for (;;) {
    const down = R() < 0.3, c = pick(R, down ? downs : ups);
    const mag = int(R, 1, 6), rows = 5, xs = range(0, 1, rows);
    const s = down ? int(R, 4 * mag + 1, Math.min(60, 4 * mag + 20)) : int(R, 1, 20);
    if (s === mag) continue;
    const ch = down ? -mag : mag, ys = xs.map(x => s + ch * x);
    if (!ys.every(y => y >= 0 && y <= 100)) continue;
    const verb = down ? 'goes down' : 'goes up';
    const say = (st: number, d: number) => `Starts at ${amt(c, st)}, ${verb} ${amt(c, d)} each ${c.one}`;
    const s2 = s + pick(R, [-1, 1]) * int(R, 1, 3) * (s > 3 ? 1 : -1), d2 = mag + int(R, 1, 3);
    if (s2 < 0 || s2 === s) continue;
    const opts: Opt[] = [
      { t: say(s, mag), ok: true, say: `Yes: the point at 0 ${c.many} is ${s}, and each ${c.one} right the line ${verb} ${mag}.` },
      { t: say(mag, s), ok: false, mc: 'mc.linear-functions.swaps-m-and-b', say: `Start and change are swapped: the start is the output at 0 (${s}), the change is ${signed(ch)} per ${c.one}.` },
      { t: say(s2, mag), ok: false, mc: 'mc.reasoning-language.one-feature-sufficient-for-match', say: `The change is right, but read the point at 0 ${c.many}: ${s}. Both must match.` },
      { t: say(s, d2), ok: false, mc: 'mc.reasoning-language.one-feature-sufficient-for-match', say: `The start is right, but step 1 ${c.one} right: the line ${verb} ${mag}, not ${d2}.` },
    ];
    if (new Set(opts.map(o => o.t)).size !== 4) continue;
    const ch_ = choices(R, opts);
    return withProbes({
      id: `graphToWords-${n}`, family: 'graphToWords',
      prompt: `The graph shows ${c.what}. Which description matches the graph?`,
      board: `\\text{start?} | \\text{change?}`, input: 'choice', choices: ch_.choices,
      pic: { tg: tgOf(c, xs, ys, { show: 'graph' }), at: ['axes', 'points', 'line'], solve: ['start', 'stairs'] },
      hero: `\\text{start } ${s} | ${tx(ch)}\\ \\text{each ${c.one}}`,
      solution: [`Start: the point at 0 ${c.many} is at ${s}.`, `Change: one ${c.one} right, the line ${verb} ${mag}.`, `${S(say(s, mag))}.`],
      answer: ch_.answer, check: ch_.check,
    }, ch_.wrong);
  }
};

// 11. compareLines: two increasing lines on the same axes; which changes faster? (compare-two-lines)
const NAMES: [string, string][] = [['Ava', 'Ben'], ['Kai', 'Rosa'], ['Noor', 'Eli'], ['Jada', 'Sam']];
const compareLines = (R: () => number, n: number): LinItem => {
  for (;;) {
    const kind = pick(R, ['sameStart', 'parallel', 'higherSlower', 'higherSlower'] as const);
    const [nA, nB] = pick(R, NAMES);
    const c = pick(R, [ctxBy('savings'), ctxBy('plant'), ctxBy('hike')]);
    const xs = range(0, 1, 5);
    let sA: number, dA: number, sB: number, dB: number;
    if (kind === 'sameStart') { sA = sB = int(R, 1, 10); dA = int(R, 1, 6); dB = int(R, 1, 6); if (dA === dB) continue; }
    else if (kind === 'parallel') { dA = dB = int(R, 2, 6); sA = int(R, 1, 15); sB = sA + pick(R, [-1, 1]) * int(R, 4, 12); }
    else { dA = int(R, 1, 3); dB = dA + int(R, 2, 4); sA = int(R, 14, 30); sB = int(R, 0, Math.max(0, sA - 12)); }
    const yA = xs.map(x => sA + dA * x), yB = xs.map(x => sB + dB * x);
    if (![...yA, ...yB].every(y => y >= 0 && y <= 60)) continue;
    // which is first: A (amber) or B (blue) is shuffled so the answer is not always B
    const flip = R() < 0.5;
    const [s1, d1, y1, s2, d2, y2, n1, n2] = flip ? [sB, dB, yB, sA, dA, yA, nB, nA] : [sA, dA, yA, sB, dB, yB, nA, nB];
    void s1; void s2;
    const higher = y1[2]! > y2[2]! ? n1 : y1[2]! < y2[2]! ? n2 : null;
    const faster = d1 > d2 ? n1 : d2 > d1 ? n2 : null;
    const tA = `${n1}'s`, tB = `${n2}'s`, tS = 'They change at the same rate';
    const opts: Opt[] = [n1, n2, null].map(who => {
      const t = who === n1 ? tA : who === n2 ? tB : tS;
      const ok = who === faster;
      let mc: string | undefined, say: string;
      if (ok) say = faster ? `Yes: ${faster}'s line is steeper. ${n1}: ${signed(d1)} per ${c.one}, ${n2}: ${signed(d2)} per ${c.one}.` : `Yes: both go up ${d1} each ${c.one}. The lines are parallel; one just starts higher.`;
      else if (who !== null && who === higher) { mc = 'mc.linear-functions.slope-as-height'; say = `${who}'s line is HIGHER, but faster means a bigger change per ${c.one}. ${n1}: ${signed(d1)}, ${n2}: ${signed(d2)}.`; }
      else say = `Compare the change per ${c.one}: ${n1} ${signed(d1)}, ${n2} ${signed(d2)}.`;
      return { t, ok, mc, say };
    });
    const ch_ = choices(R, opts);
    const it = withProbes<LinItem>({
      id: `compareLines-${n}`, family: 'compareLines',
      prompt: `The graph shows ${c.what} for ${B2(n1)} and ${W2(n2)}. At ${xs[2]} ${c.many}, ${higher ? `${higher}'s line is higher` : 'the lines are level'}. Whose ${c.id === 'savings' ? 'savings' : c.id === 'plant' ? 'height' : c.id === 'hike' ? 'distance' : c.yName.replace(/ \(.*\)/, '')} change${c.id === 'savings' ? '' : 's'} faster each ${c.one}?`,
      board: `\\text{faster?}`, input: 'choice', choices: ch_.choices,
      pic: { tg: { ...tgOf(c, xs, y1, { show: 'graph', ys2: y2, names: [n1, n2] }) }, at: ['axes', 'points', 'line', 'points2', 'line2'], solve: ['stairs'] },
      hero: `\\text{${n1}: } ${tx(d1)} | \\text{${n2}: } ${tx(d2)}`,
      solution: [`Faster means a bigger change per ${c.one}, not a higher line.`, `${n1}: ${signed(d1)} each ${c.one}; ${n2}: ${signed(d2)} each ${c.one}.`, faster ? `The steeper line changes faster: ${ans(`${faster}'s`)}.` : `Parallel lines: ${ans(tS)}.`],
      answer: ch_.answer, check: ch_.check,
    }, ch_.wrong);
    if (kind !== 'parallel' && !ch_.wrong.length) continue;
    return it;
  }
};
const B2 = (s: string) => `<b class="a">${s}</b>`, W2 = (s: string) => `<b class="w2">${s}</b>`;

// 12. connectOrNot: points or a joined line? (discrete-vs-continuous)
const connectOrNot = (R: () => number, n: number): LinItem => {
  const discrete = R() < 0.5;
  const c = pick(R, discrete ? CTX.filter(x => x.discrete) : [ctxBy('tank'), ctxBy('hike'), ctxBy('candle'), ctxBy('plant')]);
  const down = c.dirs[0] === 'down' && !c.dirs.includes('up');
  const t = linTable(R, { c: [2, 6], s: [1, 15], down, n: [4, 5], x0: [0] });
  const opts: Opt[] = discrete ? [
    { t: `Only the points: there is no half ${c.one === 'step' ? 'step' : c.one} or part of a ${c.one}`, ok: true, say: `Right: you count whole ${c.many}. In-between values like 2½ ${c.many} make no sense, so the graph is a set of points.` },
    { t: `Join them: in-between values make sense`, ok: false, mc: 'mc.functions-concept.discrete-quantity-allows-fractions', say: `There is no 2½ ${c.many} here: ${c.many} come in whole numbers. Only the points are real.` },
    { t: `Join them: a linear pattern is always one joined line`, ok: false, mc: 'mc.functions-concept.discrete-quantity-allows-fractions', say: `The points lie on a straight line, but the context decides: whole ${c.many} only, so only the points.` },
  ] : [
    { t: `Join them: in-between ${c.many} have values too (like 2½ ${c.many})`, ok: true, say: `Right: time goes on between the rows, so every in-between ${c.one} has an output. Join the points.` },
    { t: `Only the points: only whole ${c.many} count`, ok: false, say: `Time does not jump from 2 to 3 ${c.many}: at 2½ ${c.many} there is a value too. Join the points.` },
    { t: 'Only the points: the points are not on one line', ok: false, say: `Check the changes: the same every ${c.one}, so the points ARE on one line. And in-between times make sense: join them.` },
  ];
  const ch_ = choices(R, opts);
  return withProbes({
    id: `connectOrNot-${n}`, family: 'connectOrNot',
    prompt: `The graph shows ${c.what}. Should the points be joined by a line, or only drawn as points?`,
    board: `\\text{points or line?}`, input: 'choice', choices: ch_.choices,
    pic: { tg: tgOf(c, t.xs, t.ys), at: ['table', 'axes', 'points'], solve: discrete ? ['changes'] : ['changes', 'line'] },
    hero: discrete ? `\\text{whole ${c.many} only}` : `\\text{in-between counts}`,
    solution: discrete ? [`${c.many[0]!.toUpperCase()}${c.many.slice(1)} come in whole numbers: 1, 2, 3 ...`, 'So the graph is a set of separate points on a straight path, not a joined line.']
      : [`Between ${t.xs[1]} and ${t.xs[2]} ${c.many} there is still a value (time goes on).`, 'So the points are joined by one straight line.'],
    answer: ch_.answer, check: ch_.check,
  }, ch_.wrong);
};

// 13. lastChange: compute the changes of a nonlinear table (growing-differences, other-nonconstant)
const lastChange = (R: () => number, n: number, sg?: string): LinItem => {
  const shape: Shape = sg === 'other-nonconstant' ? pick(R, ['shrink', 'irregular'] as const) : 'grow';
  const { xs, ys, c } = shapeTable(R, shape);
  const ds = diffsOf(ys), k = ds.length - 1, ans = ds[k]!;
  const shown = ds.slice(0, k);
  const it: LinItem = {
    id: `lastChange-${n}`, family: 'lastChange',
    prompt: `The changes from row to row start ${signedList(shown)}. What is the change from the row for ${xs[k]} to the row for ${xs[k + 1]}?`,
    board: `${txList([...shown, NaN])}`, input: 'num', unit: 'more',
    pic: { tg: tgOf(c, xs, ys), at: ['table'], solve: ['changes', 'axes', 'points', 'segments', 'ruler'], solved: { hot: [computeTG({ xs, ys }).firstBreak], hotCol: 'wrong', missK: 1 } },
    hero: `${txList(ds)}`,
    solution: [`${ys[k + 1]} − ${ys[k]} = ${ans < 0 ? S(signed(ans)) : `+${S(String(ans))}`}.`, `The changes are ${signedList(ds)}: ${shape === 'grow' ? 'they grow' : shape === 'shrink' ? 'they shrink' : 'they jump around'}, so the table is not linear.`],
    answer: { kind: 'num', v: ans },
    check: r => {
      const v = numOf(r);
      if (v === null) return { ok: false, say: 'Type a number.' };
      if (v === ans) return { ok: true, say: `Yes: ${ys[k + 1]} − ${ys[k]} = ${ans}. The changes ${signedList(ds)} are not all the same: not linear.` };
      if (v === ys[k + 1] || v === ys[k]) return { ok: false, mc: 'mc.linear-functions.output-value-as-change', say: `${v} is an output, not a change. Subtract: ${ys[k + 1]} − ${ys[k]} = ${ans}.` };
      if (v === ys[k + 1]! - xs[k + 1]!) return { ok: false, mc: 'mc.linear-functions.row-correspondence-as-change', say: `That compares input and output in one row. The change goes down the output column: ${ys[k + 1]} − ${ys[k]} = ${ans}.` };
      if (v === shown[k - 1]) return { ok: false, mc: 'mc.linear-functions.illusion-of-linearity', say: `It is not the same as last time: ${ys[k + 1]} − ${ys[k]} = ${ans}. The changes are not constant.` };
      return { ok: false, say: `Subtract the two outputs: ${ys[k + 1]} − ${ys[k]} = ${ans}.` };
    },
  };
  if (ys[k + 1] !== ans) probe(it, { kind: 'num', v: ys[k + 1]! }, 'mc.linear-functions.output-value-as-change');
  const rc = ys[k + 1]! - xs[k + 1]!;
  if (rc !== ans && rc !== ys[k + 1] && rc !== ys[k]) probe(it, { kind: 'num', v: rc }, 'mc.linear-functions.row-correspondence-as-change');
  return it;
};

// 14. onALine: do the plotted points lie on one straight line? (curve-vs-line)
const onALine = (R: () => number, n: number): LinItem => {
  for (;;) {
    const kind = pick(R, ['bent', 'almost', 'curve', 'level', 'line'] as const);
    let xs = range(0, 1, 5), ys: number[];
    const c = pick(R, [ctxBy('plant'), ctxBy('hike'), ctxBy('tank'), ctxBy('savings')]);
    if (kind === 'bent') { const a = int(R, 1, 4), b = a + int(R, 1, 3), s = int(R, 0, 15), at = int(R, 2, 3); ys = [s]; for (let i = 1; i < 5; i++) ys.push(ys[i - 1]! + (i <= at ? a : b)); }
    else if (kind === 'almost') { const x0 = int(R, 5, 6); xs = range(x0, 1, 4); ys = xs.map(x => x * x - pick(R, [0, 10, 20])); }
    else if (kind === 'curve') { const s = int(R, 0, 10); ys = xs.map(x => s + x * x * pick(R, [1, 2]) ); }
    else if (kind === 'level') { const s = int(R, 0, 10); ys = [s, s + 8, s + 12, s + 14, s + 15]; }
    else { const t = linTable(R, { c: [2, 9], s: [1, 25], n: [5, 5], x0: [0] }); xs = t.xs; ys = t.ys; }
    if (!ys.every(y => y >= 0 && y <= 100)) continue;
    // a plant, a hike, savings only go up: no table that drops (36, 29, 44, 71)
    if (!c.dirs.includes('down') && ys.some((y, i) => i > 0 && y < ys[i - 1]!)) continue;
    const m = computeTG({ xs, ys }), ds = diffsOf(ys);
    if ((kind === 'line') !== m.constant) continue;
    const why = `The changes are ${signedList(ds)}.`;
    let opts: Opt[];
    if (kind === 'line') opts = [
      { t: 'Linear: the same change every step, one straight line', ok: true, say: `Yes. ${why} One straight line.` },
      { t: 'Not linear: it does not start at 0', ok: false, mc: 'mc.linear-functions.linear-means-proportional', say: `A line does not have to start at 0. ${why} Linear.` },
      { t: 'Not linear: it is too steep', ok: false, say: `Steepness does not decide it. ${why} Linear.` },
    ];
    else opts = [
      { t: `Not linear: the changes are ${signedList(ds)}`, ok: true, say: `Right. ${why} Not all the same, so the points are not on one straight line.` },
      kind === 'bent' ? { t: 'Linear: it is made of straight pieces', ok: false, mc: 'mc.linear-functions.nonlinear-requires-smooth-curve', say: `Two straight pieces with a corner are not ONE straight line. ${why}` }
        : kind === 'almost' ? { t: 'Linear: the points look straight', ok: false, mc: 'mc.linear-functions.approximate-straightness-proves-linearity', say: `Looking almost straight is not enough: check the numbers. ${why}` }
          : { t: 'Linear: the points go up every step', ok: false, mc: 'mc.linear-functions.illusion-of-linearity', say: `Going up is not enough. ${why}` },
      kind === 'almost' ? { t: 'Linear: the points go up every step', ok: false, mc: 'mc.linear-functions.illusion-of-linearity', say: `Going up is not enough. ${why}` }
        : { t: 'Linear: it looks like one smooth path', ok: false, mc: kind === 'bent' ? 'mc.linear-functions.approximate-straightness-proves-linearity' : 'mc.functions-concept.graph-as-picture', say: `Smooth is not straight. ${why}` },
    ];
    const ch_ = choices(R, opts);
    return withProbes({
      id: `onALine-${n}`, family: 'onALine',
      prompt: `The points show ${c.what}. Do they lie on one straight line? Could the relationship be linear?`,
      board: `\\text{one line?}`, input: 'choice', choices: ch_.choices,
      pic: { tg: tgOf(c, xs, ys), at: ['table', 'axes', 'points', 'segments'], solve: m.constant ? ['changes', 'stairs', 'line'] : ['changes', 'ruler'], solved: m.constant ? {} : { hot: [m.firstBreak], hotCol: 'wrong', missK: 1 } },
      hero: `${txList(ds)}`,
      solution: [`Find the changes: ${signedList(ds)}.`, m.constant ? 'All the same: the points lie on one straight line. Linear.' : 'Lay a ruler through the first two points: later points miss it. Not linear.'],
      answer: ch_.answer, check: ch_.check,
    }, ch_.wrong);
  }
};

// 15. unequalGaps / 16. gapRate: inputs with uneven gaps; compare per 1 unit (unequal-gaps)
function gapTable(R: () => number, lin: boolean): { xs: number[]; ys: number[]; rates: number[] } {
  for (;;) {
    const gaps = Array.from({ length: 3 }, () => int(R, 1, 5));
    if (new Set(gaps).size < 2) continue;
    const xs = [int(R, 0, 2)]; for (const g of gaps) xs.push(xs[xs.length - 1]! + g);
    const r = int(R, 1, 8);
    let rates = gaps.map(() => r);
    if (!lin) { const i = int(R, 1, 2); rates = rates.map((v, j) => (j === i ? v + pick(R, [1, 2, -1]) : v)); if (rates.some(v => v <= 0)) continue; }
    const s = int(R, 0, 20); const ys = [s];
    gaps.forEach((g, i) => ys.push(ys[i]! + g * rates[i]!));
    if (!ys.every(y => y <= 100) || xs[3]! > 16) continue;
    const ds = diffsOf(ys);
    if (lin && new Set(ds).size < 2) continue;
    return { xs, ys, rates };
  }
}
const unequalGaps = (R: () => number, n: number): LinItem => {
  const lin = R() < 0.55, c = pick(R, [ctxBy('hike'), ctxBy('tank'), ctxBy('plant'), ctxBy('savings')]);
  const { xs, ys, rates } = gapTable(R, lin);
  const ds = diffsOf(ys), gaps = diffsOf(xs);
  const per = rates.map((r, i) => `${ds[i]} ÷ ${gaps[i]} = ${r}`).join(', ');
  const opts: Opt[] = lin ? [
    { t: `Yes: per 1 ${c.one} it is +${rates[0]} for every gap`, ok: true, say: `Yes: ${per}. The same per 1 ${c.one}: it could be linear.` },
    { t: `No: the changes ${signedList(ds)} are different`, ok: false, mc: 'mc.linear-functions.ignores-input-step', say: `The gaps are different too (${gaps.join(', ')} ${c.many}). Per 1 ${c.one}: ${per}. All the same.` },
    { t: 'No: the inputs are not evenly spaced', ok: false, say: `Uneven inputs are fine; compare per 1 ${c.one}: ${per}.` },
  ] : [
    { t: `No: per 1 ${c.one} it is ${rates.join(', then ')}`, ok: true, say: `Right: ${per}. Not the same per 1 ${c.one}: not linear.` },
    { t: `Yes: the output goes up every row`, ok: false, mc: 'mc.linear-functions.illusion-of-linearity', say: `Going up is not enough. Per 1 ${c.one}: ${per}.` },
    { t: `Yes: the bigger the gap, the bigger the change`, ok: false, mc: 'mc.reasoning-language.checks-only-some-given-cases', say: `Check every gap per 1 ${c.one}: ${per}. One is different.` },
  ];
  const ch_ = choices(R, opts);
  return withProbes({
    id: `unequalGaps-${n}`, family: 'unequalGaps',
    prompt: `The inputs of this table do not go up evenly. Could ${c.what} be linear?`,
    board: `\\text{per 1 ${c.one}?}`, input: 'choice', choices: ch_.choices,
    pic: { tg: tgOf(c, xs, ys), at: ['table'], solve: ['xsteps', 'changes', 'axes', 'points', ...(lin ? ['stairs', 'line'] as TGStep[] : ['segments', 'ruler'] as TGStep[])], solved: lin ? {} : { missK: 1 } },
    hero: rates.map(r => tx(r)).join(',\\,') + ` | \\text{per ${c.one}}`,
    solution: [`Gaps in the input: ${gaps.join(', ')}. Changes in the output: ${signedList(ds)}.`, `Per 1 ${c.one}: ${per}.`, lin ? 'All the same: it could be linear.' : 'Not all the same: not linear.'],
    answer: ch_.answer, check: ch_.check,
  }, ch_.wrong);
};
const gapRate = (R: () => number, n: number): LinItem => {
  const c = pick(R, [ctxBy('hike'), ctxBy('tank'), ctxBy('plant'), ctxBy('savings')]);
  for (;;) {
    const { xs, ys, rates } = gapTable(R, true);
    const ds = diffsOf(ys), gaps = diffsOf(xs);
    const i = gaps.findIndex(g => g > 1);
    if (i < 0) continue;
    const r = rates[i]!, d = ds[i]!;
    const word = c.money ? 'dollars' : c.unit;
    const it: LinItem = {
      id: `gapRate-${n}`, family: 'gapRate',
      prompt: `From ${xs[i]} to ${xs[i + 1]} ${c.many}, the output goes from ${ys[i]} to ${ys[i + 1]}. What is the change per 1 ${c.one} in that gap?`,
      board: `${d} \\div ${gaps[i]} = \\,?`, input: 'num', unit: `${word} per ${c.one}`,
      pic: { tg: tgOf(c, xs, ys), at: ['table', 'xsteps'], solve: ['changes', 'axes', 'points', 'units', 'line'], focus: { hot: [i], hotCol: 'pick', dimOthers: true } },
      hero: `${d} \\div ${gaps[i]} = ${r}`,
      solution: [`The output changes by ${d} over ${gaps[i]} ${c.many}.`, `Per 1 ${c.one}: ${d} ÷ ${gaps[i]} = ${S(String(r))}.`],
      answer: { kind: 'num', v: r },
      check: rr => {
        const v = numOf(rr);
        if (v === null) return { ok: false, say: 'Type a number.' };
        if (v === r) return { ok: true, say: `Yes: ${d} ÷ ${gaps[i]} = ${r} per ${c.one}.` };
        if (v === d) return { ok: false, mc: 'mc.linear-functions.ignores-input-step', say: `${d} is the change over ${gaps[i]} ${c.many}. Per 1 ${c.one}: ${d} ÷ ${gaps[i]} = ${r}.` };
        if (v === ys[i + 1]) return { ok: false, mc: 'mc.linear-functions.output-value-as-change', say: `${v} is an output. The change is ${ys[i + 1]} − ${ys[i]} = ${d}, over ${gaps[i]} ${c.many}: ${r} per ${c.one}.` };
        return { ok: false, say: `Change ÷ gap: ${d} ÷ ${gaps[i]} = ${r}.` };
      },
    };
    probe(it, { kind: 'num', v: d }, 'mc.linear-functions.ignores-input-step');
    return it;
  }
};

// 17. contextLinear: classify a situation from its words (classify-from-context)
const contextLinear = (R: () => number, n: number): LinItem => {
  const kind = pick(R, ['pay', 'plant', 'taxi', 'double', 'more'] as const);
  const name = pick(R, ['Mia', 'Jon', 'Ana', 'Theo', 'Zoe']);
  let text: string, xs: number[], ys: number[], lin: boolean, ctx: Ctx, one: string;
  const r = int(R, 2, 9);
  if (kind === 'pay') { text = `${name} earns ${B($(r))} for every hour of work.`; xs = range(0, 1, 5); ys = xs.map(x => r * x); lin = true; one = 'hour'; ctx = { ...ctxBy('rental'), yh: ['pay', '($)'], yName: 'pay ($)', what: 'the pay' }; }
  else if (kind === 'plant') { text = `A sunflower is ${A(`${int(R, 2, 10)} in.`)} tall and grows ${B(`${r} in.`)} each week.`; const s = Number(/(\d+) in\./.exec(text)![1]); xs = range(0, 1, 5); ys = xs.map(x => s + r * x); lin = true; one = 'week'; ctx = ctxBy('plant'); }
  else if (kind === 'taxi') { const s = int(R, 2, 5), m = int(R, 2, 4); text = `A taxi ride costs ${A($(s))} to get in, plus ${B($(m))} per mile.`; xs = range(0, 1, 5); ys = xs.map(x => s + m * x); lin = true; one = 'mile'; ctx = { ...ctxBy('rental'), xh: ['miles', ''], xName: 'miles', one: 'mile', many: 'miles', what: 'the fare' }; }
  else if (kind === 'double') { const s = pick(R, [1, 2, 3]); text = `${name}'s savings start at ${A($(s))} and double every week.`; xs = range(0, 1, 5); ys = xs.map(x => s * 2 ** x); lin = false; one = 'week'; ctx = ctxBy('savings'); }
  // the weekly amount alone would be linear: the question is about the total
  else { const s = int(R, 1, 6); text = `${name} saves ${A($(s))} in week 1, ${$(s + 1)} in week 2, ${$(s + 2)} in week 3, and so on. Look at the TOTAL saved after each week.`; xs = range(1, 1, 5); let t = 0; ys = xs.map((_, i) => (t += s + i)); lin = false; one = 'week'; ctx = ctxBy('savings'); }
  const ds = diffsOf(ys);
  const opts: Opt[] = [
    { t: `Linear: the same change every ${one}`, ok: lin, mc: lin ? undefined : 'mc.linear-functions.illusion-of-linearity', say: lin ? `Yes: every ${one} adds the same amount (${signed(ds[0]!)}). Linear.` : `It grows, but not by the same amount: the changes are ${signedList(ds)}. Not linear.` },
    { t: `Not linear: the change gets bigger`, ok: !lin, say: !lin ? `Right: the changes are ${signedList(ds)}. They grow, so it is not linear.` : `The change is the same every ${one}: ${signed(ds[0]!)}. Linear.` },
    { t: `Not linear: it does not start at 0`, ok: false, mc: 'mc.linear-functions.linear-means-proportional', say: lin ? `A linear relationship can start anywhere. The change is the same every ${one}: linear.` : `Starting at 0 is not the test. The changes ${signedList(ds)} grow: that is why it is not linear.` },
  ];
  const ch_ = choices(R, opts);
  return withProbes({
    id: `contextLinear-${n}`, family: 'contextLinear',
    prompt: `${text} Is this relationship linear?`,
    board: `\\text{linear?}`, input: 'choice', choices: ch_.choices,
    pic: { tg: tgOf(ctx, xs, ys), at: [], solve: ['table', 'changes', 'axes', 'points', lin ? 'line' : 'segments'] },
    hero: `${txList(ds)}`,
    solution: [`Make a few rows: ${list(ys)}.`, `The changes: ${signedList(ds)}.`, lin ? 'The same every time: linear.' : 'They grow: not linear.'],
    answer: ch_.answer, check: ch_.check,
  }, ch_.wrong);
};

// 18. bestReason: pick the justification that cites equal steps and changes, or one conflicting step (justify-with-changes)
const bestReason = (R: () => number, n: number): LinItem => {
  const lin = R() < 0.5, who = pick(R, ['Kai', 'Lena', 'Omar', 'Priya']);
  const { xs, ys, c } = lin ? (() => { const c = pick(R, ups); const t = linTable(R, { c: [2, 9], s: [1, 25], n: [5, 5] }); return { xs: t.xs, ys: t.ys, c }; })() : shapeTable(R, pick(R, ['break', 'grow', 'irregular'] as const));
  const ds = diffsOf(ys), m = computeTG({ xs, ys });
  const b = m.firstBreak;
  const opts: Opt[] = lin ? [
    { t: `The input goes up by 1 every row, and the output goes up by ${ds[0]} every row`, ok: true, say: `Yes: equal input steps AND equal output changes. That is the evidence.` },
    { t: 'The outputs keep getting bigger', ok: false, mc: 'mc.sequences-series.justifies-by-appearance', say: `Getting bigger does not prove it: squares get bigger too. Cite the equal steps and the equal changes (${signed(ds[0]!)}).` },
    { t: 'Its graph would look like a line', ok: false, mc: 'mc.sequences-series.justifies-by-appearance', say: `"Looks like" is not evidence. Cite the numbers: input +1, output ${signed(ds[0]!)} every row.` },
  ] : [
    { t: `From ${xs[0]} to ${xs[1]} it changes by ${signed(ds[0]!)}, but from ${xs[b]} to ${xs[b + 1]} by ${signed(ds[b]!)}`, ok: true, say: 'Yes: one step with a different change is enough to show it is not linear.' },
    { t: 'The numbers look random', ok: false, mc: 'mc.sequences-series.justifies-by-appearance', say: `"Looks random" is not evidence. Name one step that breaks it: ${xs[b]} to ${xs[b + 1]} changes by ${signed(ds[b]!)}, not ${signed(ds[0]!)}.` },
    { t: 'It does not start at 0', ok: false, mc: 'mc.linear-functions.linear-means-proportional', say: `Linear patterns can start anywhere. The reason is a step with a different change.` },
  ];
  const ch_ = choices(R, opts);
  return withProbes({
    id: `bestReason-${n}`, family: 'bestReason',
    prompt: `${who} says the table of ${c.what} ${lin ? 'could be linear' : 'is not linear'}. ${who} is right. Which reason proves it best?`,
    board: `\\text{${who}:} | \\text{${lin ? 'could be linear' : 'not linear'}}`, input: 'choice', choices: ch_.choices,
    pic: { tg: tgOf(c, xs, ys), at: ['table'], solve: lin ? ['changes', 'axes', 'points', 'line'] : ['changes', 'axes', 'points', 'segments', 'ruler'], solved: lin ? {} : { hot: [b], hotCol: 'wrong', missK: 1 } },
    hero: `${txList(ds)}`,
    solution: lin ? ['A good reason cites the numbers: equal input steps (+1) and equal output changes.', `Here every change is ${signed(ds[0]!)}.`]
      : ['A good reason cites ONE step that breaks the pattern.', `${xs[0]} to ${xs[1]}: ${signed(ds[0]!)}; ${xs[b]} to ${xs[b + 1]}: ${signed(ds[b]!)}. Different, so not linear.`],
    answer: ch_.answer, check: ch_.check,
  }, ch_.wrong);
};

// 19. couldOrMust: a finite table only says "could be"; a stated rule says "must be" (table-could-be-linear)
const couldOrMust = (R: () => number, n: number): LinItem => {
  const rule = R() < 0.45, c = pick(R, [ctxBy('rental'), ctxBy('tank'), ctxBy('plant'), ctxBy('hike')]);
  const t = linTable(R, { c: [2, 8], s: [1, 20], n: [3, 4], x0: [0, 1] });
  const opts: Opt[] = rule ? [
    { t: 'It must be linear: the rule says the same change every time', ok: true, say: `Yes: the rule promises the same ${signed(t.c)} for every ${c.one}, also the ones not in the table. So it must be linear.` },
    { t: 'It could be linear, but we cannot know', ok: false, say: `A stated rule settles it: the same change for EVERY ${c.one}. That is a must.` },
    { t: 'It cannot be linear: it does not start at 0', ok: false, mc: 'mc.linear-functions.linear-means-proportional', say: 'Linear patterns can start anywhere. The rule says the same change every time: it must be linear.' },
  ] : [
    { t: 'It could be linear: these rows have the same change', ok: true, say: `Right: ${t.xs.length} rows agree, but the rows we cannot see might not. Without a rule it COULD be linear.` },
    { t: 'It must be linear: every row checks out', ok: false, mc: 'mc.reasoning-language.examples-as-proof', say: `The rows shown check out, but a table cannot show every input. Without a rule, it could be linear, not must.` },
    { t: 'It cannot be linear: it has too few rows', ok: false, say: 'A few rows cannot rule it out: they all have the same change. It could be linear.' },
  ];
  const ch_ = choices(R, opts);
  return withProbes({
    id: `couldOrMust-${n}`, family: 'couldOrMust',
    prompt: rule ? `${c.rule(t.s, t.c)} This rule holds for every ${c.one}. The table shows a few rows. What can you say?`
      : `A table shows ${c.what} for a few ${c.many}. No rule is given. What can you say?`,
    board: rule ? `\\text{rule:} | ${tx(t.c)}\\ \\text{every ${c.one}}` : `\\text{no rule given}`, input: 'choice', choices: ch_.choices,
    pic: { tg: tgOf(c, t.xs, t.ys), at: ['table'], solve: ['changes', 'axes', 'points', 'line'] },
    hero: rule ? `\\text{must be linear}` : `\\text{could be linear}`,
    solution: rule ? ['The rule is about EVERY input, not just the rows shown.', 'So it must be linear.'] : [`The rows shown all change by ${signed(t.c)}.`, 'A table cannot show every input, so it could be linear: not must.'],
    answer: ch_.answer, check: ch_.check,
  }, ch_.wrong);
};

// 20. farPredict: start + n × change, the start found first when the table starts at 1 (far-prediction)
const farPredict = (R: () => number, n: number): LinItem => {
  for (;;) {
    const c = pick(R, [ctxBy('tiles'), ctxBy('vans'), ctxBy('rental'), ctxBy('packs')]);
    const step = int(R, 2, 5), s = int(R, 1, 10), N = pick(R, [6, 7, 8, 9, 10, 10, 20]);
    const val = s + N * step;
    if (val > 100 || N * step > 100) continue;
    const xs = range(1, 1, 4), ys = xs.map(x => s + step * x), y1 = ys[0]!;
    if (y1 * N === val || N * step === val - 0 && s === 0) continue;
    const tiles = c.id === 'tiles', at = (k: number) => (tiles ? `step ${k}` : `${k} ${k === 1 ? c.one : c.many}`);
    const ask = tiles ? `How many tiles are there at step ${N}?` : c.id === 'vans' ? `How many kids are at camp after ${N} vans?` : `What is the cost for ${N} ${c.many}?`;
    const it: LinItem = {
      id: `farPredict-${n}`, family: 'farPredict',
      prompt: `The table starts at ${at(1)}. Each ${c.one} adds ${B(c.money ? $(step) : `${step} ${c.unit}`)} (the rule). ${ask}`,
      board: `\\text{${at(N)}:}\\ ?`, input: 'num', unit: c.money ? 'dollars' : c.unit,
      pic: { tg: tgOf(c, xs, ys, { xMax: 4 }), at: ['table', 'axes', 'points'], solve: ['changes', 'stairs', 'line'] },
      hero: `${s} + ${N} \\times ${step} = ${val}`,
      solution: [`The start (${at(0)}): ${y1} − ${step} = ${A(String(s))}.`, `At ${at(N)}: start + ${N} × change = ${s} + ${N} × ${step} = ${S(String(val))}.`],
      answer: { kind: 'num', v: val },
      check: r => {
        const v = numOf(r);
        if (v === null) return { ok: false, say: 'Type a number.' };
        if (v === val) return { ok: true, say: `Yes: start ${s}, plus ${N} × ${step} = ${N * step}: ${val}.` };
        if (v === N * step) return { ok: false, mc: 'mc.linear-functions.drops-start-value', say: `${N} × ${step} is only the added part. Add the start too: ${s} + ${N * step} = ${val}.` };
        if (v === y1 * N) return { ok: false, mc: 'mc.ratio-rate.scales-non-proportional', say: `${y1} × ${N} would be right only if it started at 0. The start is ${s}: ${s} + ${N} × ${step} = ${val}.` };
        if (v === y1 + N * step) return { ok: false, mc: 'mc.linear-functions.first-output-as-intercept', say: `${y1} is at ${at(1)}, not ${at(0)}. Start at ${s}: ${s} + ${N} × ${step} = ${val}.` };
        return { ok: false, say: `Find the start first (${at(0)}: ${s}), then add ${N} × ${step}: ${val}.` };
      },
    };
    probe(it, { kind: 'num', v: N * step }, 'mc.linear-functions.drops-start-value');
    if (y1 * N !== N * step && y1 * N !== y1 + N * step) probe(it, { kind: 'num', v: y1 * N }, 'mc.ratio-rate.scales-non-proportional');
    if (y1 + N * step !== y1 * N && y1 + N * step !== N * step) probe(it, { kind: 'num', v: y1 + N * step }, 'mc.linear-functions.first-output-as-intercept');
    return it;
  }
};

const RAW: Record<FamilyId, (R: () => number, n: number, sg?: string) => LinItem> = {
  rowChange, couldBeLinear, perUnit, startValue, wordsToTable, tableToWords, plotPoint, graphMeaning, graphChange, graphToWords,
  compareLines, connectOrNot, lastChange, onALine, unequalGaps, gapRate, contextLinear, bestReason, couldOrMust, farPredict,
};
/** "5 in." at the end of a sentence: one full stop, not "5 in.." */
const tidy = (h: string) => h.replace(/\b(in|ft|mi|gal)\.\./g, '$1.');
const tidied = (g: (R: () => number, n: number, sg?: string) => LinItem) => (R: () => number, n: number, sg?: string): LinItem => {
  const it = g(R, n, sg);
  it.prompt = tidy(it.prompt); it.solution = it.solution.map(tidy);
  if (it.choices) it.choices = it.choices.map(tidy);
  return it;
};
export const GENS = Object.fromEntries(Object.entries(RAW).map(([k, g]) => [k, tidied(g)])) as typeof RAW;
