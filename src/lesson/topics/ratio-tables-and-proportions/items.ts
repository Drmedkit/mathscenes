// items.ts: exercise families for "ratio tables and proportional relationships" (grade 7, 6.RP.A.1-3, 7.RP.A.2),
// generated from templates, checked exactly, every wrong answer classified against the misconception catalogue
// (math-curriculum-essentials/misconceptions.json ids). A generator gets the SUB-GOAL it practises (plan.ts) and uses
// that sub-goal's number ranges from the topic JSON ('cases'). Pure: no DOM, no canvas; a seeded rng.
// PROBES records, per item, typical wrong responses and the id they must get (tests).
import { type Item, type Response, type Verdict, A, B, S, fr, fracValue, gcd, int, pick, same, shuffle } from '../../runtime/item';
import { type RRFocus, type RRParams, type TableSpec, computeTable, fmtQ } from './RatioRows';

export type FamilyId = 'pairUp' | 'timesAsMany' | 'whatStays' | 'ratioOrDiff' | 'situation' | 'doubleIt' | 'pairTable' | 'labelTable'
  | 'buildUp' | 'unitRow' | 'rateUnit' | 'midRow' | 'canWeFind' | 'addRows' | 'feeRows' | 'subRows' | 'route' | 'compare'
  | 'testTable' | 'zeroRow' | 'predict' | 'moneyRow' | 'fracRate' | 'moneyTest' | 'graphLine' | 'tolerance';
export const FAMILY_NAMES: Record<FamilyId, string> = {
  pairUp: 'Which row?', timesAsMany: 'The missing pair', whatStays: 'What stays the same?', ratioOrDiff: 'Times as many, or more?',
  situation: 'Proportional or not?', doubleIt: 'Double it?', pairTable: 'Keep the pairs together', labelTable: 'A table a reader understands',
  buildUp: 'Build up the table', unitRow: 'The row for 1', rateUnit: 'The rate and its unit', midRow: 'A row in between',
  canWeFind: 'Can the table get there?', addRows: 'Add two rows', feeRows: 'Can you add these rows?', subRows: 'Subtract two rows',
  route: 'The best route', compare: 'Compare two ratios', testTable: 'Test every pair', zeroRow: 'The row for 0',
  predict: 'Can you predict it?', moneyRow: 'Dollars and cents', fracRate: 'Fractions in the table', moneyTest: 'A price list with cents',
  graphLine: 'Points on a line through 0', tolerance: 'Close enough?',
};

// ---------- pictures ----------
/** what the page draws for an item: a RatioRows picture, the steps shown at the start, the steps of the worked solution */
export interface RRPic {
  p: RRParams;
  at: string[];
  solve: string[];
  focus?: RRFocus;
  /** focus once the solution plays (the row that breaks, the common rows) */
  solved?: RRFocus;
  /** a different picture for the solution (words-only items get a table) */
  then?: RRPic;
}
export interface RTItem extends Item {
  family: FamilyId;
  pic?: RRPic;
  /** the TeX line the solution writes on the board */
  hero?: string;
}
export const PROBES = new WeakMap<Item, { r: Response; mc: string }[]>();
const probe = (it: Item, r: Response, mc: string) => { const l = PROBES.get(it) ?? []; l.push({ r, mc }); PROBES.set(it, l); };

// ---------- number words ----------
const r2 = (x: number) => Math.round(x * 100) / 100;
export const money = (v: number) => (Number.isInteger(r2(v)) ? `$${r2(v)}` : `$${r2(v).toFixed(2)}`);
const cents = (v: number) => `$${r2(v).toFixed(2)}`;
const pl = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const dec = (v: number) => String(r2(v));
/** a fraction or mixed number in HTML */
const mixedHtml = (p: number, q: number) => { const w = Math.floor(p / q), r = p % q; return r === 0 ? String(w) : `${w ? w + '&#8202;' : ''}${fr(r, q)}`; };
/** the same in TeX */
const mixedTex = (p: number, q: number) => { const w = Math.floor(p / q), r = p % q; return r === 0 ? String(w) : `${w || ''}\\tfrac{${r}}{${q}}`; };
const near = (a: number, b: number) => Math.abs(a - b) < 1e-6;

// ---------- contexts: two quantities that keep a constant ratio (US units; money where it is the point) ----------
export interface PCtx {
  id: string;
  A: readonly [string, string]; B: readonly [string, string];
  an: (n: number) => string; bn: (v: number) => string;
  /** the pair as a sentence (some name the second quantity first) */
  sent: (x: number, y: number) => string;
  /** a question about the second quantity for x */
  ask: (x: number) => string;
  per: string; rev: string; unit: string;
  /** the first and the second quantity as nouns */
  An: string; Bn: string;
  rates: readonly number[];
  money?: boolean;
}
const cost = ['cost', '($)'] as const;
export const CTX: PCtx[] = [
  { id: 'notebooks', A: ['notebooks', ''], B: cost, an: n => pl(n, 'notebook', 'notebooks'), bn: money, money: true,
    sent: (x, y) => `${A(pl(x, 'notebook', 'notebooks'))} cost ${B(money(y))}.`, ask: x => `What do ${pl(x, 'notebook', 'notebooks')} cost?`,
    per: 'dollars per notebook', rev: 'notebooks per dollar', unit: 'dollars', An: 'the notebooks', Bn: 'the cost', rates: [2, 3, 4, 5, 6, 7, 8, 9] },
  { id: 'tickets', A: ['tickets', ''], B: cost, an: n => pl(n, 'bus ticket', 'bus tickets'), bn: money, money: true,
    sent: (x, y) => `${A(pl(x, 'bus ticket', 'bus tickets'))} cost ${B(money(y))}.`, ask: x => `What do ${pl(x, 'bus ticket', 'bus tickets')} cost?`,
    per: 'dollars per ticket', rev: 'tickets per dollar', unit: 'dollars', An: 'the tickets', Bn: 'the cost', rates: [2, 3, 4, 5, 6] },
  { id: 'hike', A: ['hours', ''], B: ['miles', ''], an: n => pl(n, 'hour', 'hours'), bn: v => pl(v, 'mile', 'miles'),
    sent: (x, y) => `At a steady pace, a hiker covers ${B(pl(y, 'mile', 'miles'))} in ${A(pl(x, 'hour', 'hours'))}.`, ask: x => `How far does the hiker go in ${pl(x, 'hour', 'hours')}?`,
    per: 'miles per hour', rev: 'hours per mile', unit: 'miles', An: 'the hours', Bn: 'the miles', rates: [2, 3, 4] },
  { id: 'printer', A: ['minutes', ''], B: ['pages', ''], an: n => pl(n, 'minute', 'minutes'), bn: v => pl(v, 'page', 'pages'),
    sent: (x, y) => `A printer prints ${B(pl(y, 'page', 'pages'))} in ${A(pl(x, 'minute', 'minutes'))}, at a steady speed.`, ask: x => `How many pages does it print in ${pl(x, 'minute', 'minutes')}?`,
    per: 'pages per minute', rev: 'minutes per page', unit: 'pages', An: 'the minutes', Bn: 'the pages', rates: [2, 3, 4, 5, 6, 7, 8, 9] },
  { id: 'yards', A: ['yards', ''], B: ['feet', ''], an: n => pl(n, 'yard', 'yards'), bn: v => pl(v, 'foot', 'feet'),
    sent: (x, y) => `${A(pl(x, 'yard', 'yards'))} of rope ${x === 1 ? 'is' : 'are'} ${B(pl(y, 'foot', 'feet'))} long.`, ask: x => `How many feet are in ${pl(x, 'yard', 'yards')}?`,
    per: 'feet per yard', rev: 'yards per foot', unit: 'feet', An: 'the yards', Bn: 'the feet', rates: [3] },
  { id: 'gallons', A: ['gallons', ''], B: ['quarts', ''], an: n => pl(n, 'gallon', 'gallons'), bn: v => pl(v, 'quart', 'quarts'),
    sent: (x, y) => `${B(pl(y, 'quart', 'quarts'))} of milk fill ${A(pl(x, 'gallon jug', 'gallon jugs'))}.`, ask: x => `How many quarts are in ${pl(x, 'gallon', 'gallons')}?`,
    per: 'quarts per gallon', rev: 'gallons per quart', unit: 'quarts', An: 'the gallons', Bn: 'the quarts', rates: [4] },
  { id: 'pints', A: ['quarts', ''], B: ['pints', ''], an: n => pl(n, 'quart', 'quarts'), bn: v => pl(v, 'pint', 'pints'),
    sent: (x, y) => `${A(pl(x, 'quart', 'quarts'))} of juice ${x === 1 ? 'is' : 'are'} ${B(pl(y, 'pint', 'pints'))}.`, ask: x => `How many pints are in ${pl(x, 'quart', 'quarts')}?`,
    per: 'pints per quart', rev: 'quarts per pint', unit: 'pints', An: 'the quarts', Bn: 'the pints', rates: [2] },
  { id: 'apples', A: ['bags', ''], B: ['apples', ''], an: n => pl(n, 'bag', 'bags'), bn: v => pl(v, 'apple', 'apples'),
    sent: (x, y) => `${A(pl(x, 'bag', 'bags'))} hold ${B(pl(y, 'apple', 'apples'))}, the same number in every bag.`, ask: x => `How many apples are in ${pl(x, 'bag', 'bags')}?`,
    per: 'apples per bag', rev: 'bags per apple', unit: 'apples', An: 'the bags', Bn: 'the apples', rates: [4, 5, 6, 7, 8, 9] },
  { id: 'paint', A: ['cans', ''], B: ['area', '(sq ft)'], an: n => pl(n, 'can of paint', 'cans of paint'), bn: v => `${v} square feet`,
    sent: (x, y) => `${A(pl(x, 'can of paint', 'cans of paint'))} cover ${B(`${y} square feet`)} of wall.`, ask: x => `How much wall do ${pl(x, 'can', 'cans')} cover?`,
    per: 'square feet per can', rev: 'cans per square foot', unit: 'square feet', An: 'the cans', Bn: 'the area', rates: [5, 6, 7, 8, 9] },
  { id: 'grapes', A: ['pounds', ''], B: cost, an: n => pl(n, 'pound of grapes', 'pounds of grapes'), bn: money, money: true,
    sent: (x, y) => `${A(pl(x, 'pound of grapes', 'pounds of grapes'))} cost ${B(money(y))}.`, ask: x => `What do ${pl(x, 'pound', 'pounds')} of grapes cost?`,
    per: 'dollars per pound', rev: 'pounds per dollar', unit: 'dollars', An: 'the pounds', Bn: 'the cost', rates: [2, 3, 4, 5, 6] },
  { id: 'muffins', A: ['batches', ''], B: ['eggs', ''], an: n => pl(n, 'batch of muffins', 'batches of muffins'), bn: v => pl(v, 'egg', 'eggs'),
    sent: (x, y) => `${A(pl(x, 'batch of muffins', 'batches of muffins'))} use ${B(pl(y, 'egg', 'eggs'))}.`, ask: x => `How many eggs do ${pl(x, 'batch', 'batches')} use?`,
    per: 'eggs per batch', rev: 'batches per egg', unit: 'eggs', An: 'the batches', Bn: 'the eggs', rates: [2, 3, 4] },
];
const ctxWith = (R: () => number, ok: (c: PCtx) => boolean = () => true) => pick(R, CTX.filter(ok));
/** two-part mixes (recipes): the same attribute in both columns */
interface Mix { id: string; A: readonly [string, string]; B: readonly [string, string]; what: string; an: (n: number) => string; bn: (n: number) => string }
const MIXES: Mix[] = [
  { id: 'juice', A: ['juice', '(cups)'], B: ['water', '(cups)'], what: 'a juice drink', an: n => pl(n, 'cup of juice', 'cups of juice'), bn: n => pl(n, 'cup of water', 'cups of water') },
  { id: 'pancakes', A: ['flour', '(cups)'], B: ['milk', '(cups)'], what: 'pancake batter', an: n => pl(n, 'cup of flour', 'cups of flour'), bn: n => pl(n, 'cup of milk', 'cups of milk') },
  { id: 'purple', A: ['red', '(drops)'], B: ['blue', '(drops)'], what: 'purple paint', an: n => pl(n, 'drop of red', 'drops of red'), bn: n => pl(n, 'drop of blue', 'drops of blue') },
  { id: 'trail', A: ['peanuts', '(cups)'], B: ['raisins', '(cups)'], what: 'trail mix', an: n => pl(n, 'cup of peanuts', 'cups of peanuts'), bn: n => pl(n, 'cup of raisins', 'cups of raisins') },
  { id: 'concrete', A: ['cement', '(bags)'], B: ['sand', '(bags)'], what: 'concrete', an: n => pl(n, 'bag of cement', 'bags of cement'), bn: n => pl(n, 'bag of sand', 'bags of sand') },
];

// ---------- tables ----------
const heads = (c: { A: readonly [string, string]; B: readonly [string, string] }) => [c.A, c.B] as const;
function table(c: { A: readonly [string, string]; B: readonly [string, string] }, rows: (readonly [number, number])[], x: Partial<TableSpec> = {}): TableSpec {
  return { heads: heads(c), rows, ...x };
}
const pic1 = (T: TableSpec, at: string[], solve: string[], focus?: RRFocus, solved?: RRFocus): RRPic => ({ p: { tables: [T] }, at, solve, focus, solved });
const quotHead = (c: { A: readonly [string, string]; B: readonly [string, string] }) => [`${c.B[0]} ÷`, c.A[0]] as const;
/** rows whose quotient differs from the first positive row's */
function badRows(rows: readonly (readonly [number, number])[]): number[] {
  const m = computeTable({ rows });
  const first = m.quots.find(q => q !== null);
  return m.quots.map((q, i) => (q && first && (q.p !== first.p || q.q !== first.q) ? i : -1)).filter(i => i >= 0);
}
const kText = (b: number, a: number) => fmtQ(computeTable({ rows: [[a, b]] }).quots[0]!);

// ---------- item makers ----------
interface NumSpec { family: FamilyId; id: string; prompt: string; board: string; unit: string; answer: number; ok: string; wrong: (readonly [number, string | undefined, string])[]; other: string; solution: string[]; pic?: RRPic; hero?: string }
function numItem(o: NumSpec): RTItem {
  const wrong = o.wrong.filter(([v]) => Number.isFinite(v) && !near(v, o.answer));
  const it: RTItem = {
    id: o.id, family: o.family, prompt: o.prompt, board: o.board, input: 'num', unit: o.unit, solution: o.solution, pic: o.pic, hero: o.hero,
    answer: { kind: 'num', v: o.answer },
    check(r: Response): Verdict {
      if (r.kind !== 'num' || !Number.isFinite(r.v)) return { ok: false, say: 'Type just the number, like 12 or 4.50.' };
      if (near(r.v, o.answer)) return { ok: true, say: o.ok };
      const w = wrong.find(([v]) => near(v, r.v));
      return w ? { ok: false, mc: w[1], say: w[2] } : { ok: false, say: o.other };
    },
  };
  const seen: number[] = [];
  for (const [v, mc] of wrong) if (!seen.some(s => near(s, v))) { seen.push(v); if (mc) probe(it, { kind: 'num', v }, mc); }
  return it;
}
interface Opt { t: string; ok: boolean; mc?: string; say: string }
interface ChoiceSpec { family: FamilyId; id: string; prompt: string; board: string; opts: Opt[]; solution: string[]; pic?: RRPic; hero?: string }
function choiceItem(R: () => number, o: ChoiceSpec): RTItem {
  const opts = shuffle(R, [...o.opts]);
  const it: RTItem = {
    id: o.id, family: o.family, prompt: o.prompt, board: o.board, input: 'choice', choices: opts.map(x => x.t), solution: o.solution, pic: o.pic, hero: o.hero,
    answer: { kind: 'choice', i: opts.findIndex(x => x.ok) },
    check(r: Response): Verdict {
      if (r.kind !== 'choice' || !opts[r.i]) return { ok: false, say: 'Pick one of the answers.' };
      const x = opts[r.i]!;
      return { ok: x.ok, mc: x.mc, say: x.say };
    },
  };
  opts.forEach((x, i) => { if (x.mc) probe(it, { kind: 'choice', i }, x.mc); });
  return it;
}
interface FracSpec { family: FamilyId; id: string; prompt: string; board: string; unit: string; answer: [number, number]; ok: string; wrong: (readonly [number, number, string | undefined, string])[]; other: string; solution: string[]; pic?: RRPic; hero?: string }
function fracItem(o: FracSpec): RTItem {
  const [p, q] = o.answer;
  const wrong = o.wrong.filter(([a, b]) => a * q !== p * b);
  const it: RTItem = {
    id: o.id, family: o.family, prompt: o.prompt, board: o.board, input: 'frac', unit: o.unit, solution: o.solution, pic: o.pic, hero: o.hero,
    answer: { kind: 'frac', w: Math.floor(p / q), n: p % q, d: q },
    check(r: Response): Verdict {
      if (r.kind === 'num' && Number.isFinite(r.v)) { const v = r.v; if (near(v, p / q)) return { ok: true, say: o.ok }; }
      const v = r.kind === 'frac' ? fracValue(r) : null;
      if (!v) return { ok: false, say: 'Fill in a fraction or a mixed number.' };
      if (same(v, p, q)) return { ok: true, say: o.ok };
      const w = wrong.find(([a, b]) => same(v, a, b));
      return w ? { ok: false, mc: w[2], say: w[3] } : { ok: false, say: o.other };
    },
  };
  for (const [a, b, mc] of wrong) if (mc) probe(it, { kind: 'frac', w: 0, n: a, d: b }, mc);
  return it;
}
const MC = {
  sortsPairs: 'mc.data-displays.sorts-paired-lists-independently',
  omitsLabels: 'mc.data-displays.omits-display-labels',
  timesMore: 'mc.mul-div.times-as-many-read-as-more',
  sameQty: 'mc.ratio-rate.quantities-stay-same-when-constant',
  fewChecks: 'mc.ratio-rate.too-few-checks-for-proportionality',
  addDiff: 'mc.ratio-rate.additive-keep-difference',
  scalesNon: 'mc.ratio-rate.scales-non-proportional',
  inverse: 'mc.ratio-rate.inverse-treated-as-direct',
  ignores: 'mc.reasoning-language.ignores-stated-model-conditions',
  oneTerm: 'mc.ratio-rate.scale-only-one-term',
  reversed: 'mc.ratio-rate.unit-rate-division-reversed',
  noUnit: 'mc.measurement-units.omits-unit',
  wholeRow: 'mc.ratio-rate.whole-number-row-scaling-only',
  wholeRate: 'mc.ratio-rate.whole-number-rates-factors-only',
  otherTable: 'mc.ratio-rate.combines-rows-of-different-tables',
  smallMinusBig: 'mc.ratio-rate.smaller-purchase-minus-larger-for-added-amount',
  habit: 'mc.estimation.method-not-chosen-from-numbers',
  mismatch: 'mc.functions-concept.mismatched-comparison',
  someCases: 'mc.reasoning-language.checks-only-some-given-cases',
  origin: 'mc.ratio-rate.origin-alone-means-proportional',
  zeroRate: 'mc.ratio-rate.zero-over-zero-as-rate',
  examples: 'mc.reasoning-language.examples-as-proof',
  decScale: 'mc.decimals.product-decimal-scale-not-preserved',
  discrepancy: 'mc.measurement-units.misjudges-discrepancy',
  allOrNothing: 'mc.reasoning-language.model-judged-all-or-nothing',
} as const;
const distinctSorted = (R: () => number, n: number, lo: number, hi: number): number[] => {
  const s = new Set<number>();
  for (let g = 0; s.size < n && g < 200; g++) s.add(int(R, lo, hi));
  return [...s].sort((a, b) => a - b);
};

// ===================================================================================================================
// 1 paired-observation: which row goes in the table (the pair, in the right columns)
const pairUp = (R: () => number, n: number): RTItem => {
  const c = ctxWith(R, x => x.rates.length > 1);
  let x = int(R, 2, 9), y = int(R, 2, 9);
  while (y === x) y = int(R, 2, 9);
  const yv = c.money ? y : y;
  const t = (a: number, b: number) => `${a} | ${c.money ? money(b) : b}`;
  return choiceItem(R, {
    family: 'pairUp', id: `pairUp-${n}-${c.id}-${x}-${y}`,
    prompt: `${c.sent(x, yv)} The table has the columns <b>${c.A[0]}</b> and <b>${c.B[0]}</b>. Which row goes in it?`,
    board: `\\text{${c.A[0]}} \\;|\\; \\text{${c.B[0]}}`,
    opts: [
      { t: t(x, y), ok: true, say: `Yes: ${c.an(x)} with ${c.bn(y)}, in the order of the columns.` },
      { t: t(y, x), ok: false, mc: MC.sortsPairs, say: `That swaps the pair: ${x} is the ${c.A[0]}, ${c.bn(y)} goes in the ${c.B[0]} column.` },
      { t: t(x, x + y), ok: false, say: `${x + y} is ${x} + ${y}. Each column holds its own amount: ${c.bn(y)}.` },
    ],
    solution: [`The sentence pairs ${A(c.an(x))} with ${B(c.bn(y))}.`, `First column ${c.A[0]}: ${x}. Second column ${c.B[0]}: ${c.money ? money(y) : y}.`],
    pic: pic1(table(c, [[x, y]], { hide: [[0, 0], [0, 1]] }), ['table'], ['fill']),
    hero: `${x} : ${y}`,
  });
};

// 2 constant-multiplier: the missing value; what stays the same
const timesRows = (R: () => number, m: number, k: number) => distinctSorted(R, k, 1, 9);
const timesAsMany = (R: () => number, n: number): RTItem => {
  const c = ctxWith(R);
  const m = pick(R, c.rates.filter(r => r <= 5).length ? c.rates.filter(r => r <= 5) : [2, 3, 4, 5]);
  const xs = timesRows(R, m, 4);
  const tx = xs.splice(int(R, 1, 3), 1)[0]!;
  const rows = [...xs.map(x => [x, m * x] as const), [tx, m * tx] as const];
  const ans = m * tx;
  return numItem({
    family: 'timesAsMany', id: `timesAsMany-${n}-${c.id}-${m}-${xs.join('.')}-${tx}`,
    prompt: `${c.sent(xs[0]!, m * xs[0]!)} The table shows more pairs like it. What goes with ${A(c.an(tx))}?`,
    board: `${tx} : \\;?`, unit: c.unit, answer: ans,
    ok: `Yes: in every row ${c.Bn} is ${m} times ${c.An}. ${m} × ${tx} = ${ans}.`,
    wrong: [
      [tx + m, MC.timesMore, `${tx} + ${m} adds ${m}. The rows say ${m} <em>times</em>: ${m} × ${xs[0]} = ${m * xs[0]!}.`],
      [tx + (m - 1) * xs[0]!, MC.addDiff, `That keeps the difference of the first row. Check the others: ${xs[1]} → ${m * xs[1]!}. It is ${m} times, every row.`],
    ],
    other: `Look across one row: ${xs[0]} → ${m * xs[0]!}. What do you multiply by? Do the same to ${tx}.`,
    solution: [`Every row: ${c.Bn} = ${m} × ${c.An} (${rows.slice(0, 3).map(r => `${r[1]} = ${m} × ${r[0]}`).join(', ')}).`, `${m} × ${tx} = ${S(String(ans))}.`],
    pic: pic1(table(c, rows, { hide: [[3, 1]], quot: quotHead(c) }), ['table'], ['quot', 'fill']),
    hero: `${m} \\times ${tx} = ${ans}`,
  });
};
const whatStays = (R: () => number, n: number): RTItem => {
  const c = ctxWith(R);
  const m = pick(R, c.rates);
  const xs = distinctSorted(R, 3, 1, 9).filter(x => m * x <= 100);
  while (xs.length < 3) xs.push(xs.length + 1);
  const rows = xs.map(x => [x, m * x] as const);
  return choiceItem(R, {
    family: 'whatStays', id: `whatStays-${n}-${c.id}-${m}-${xs.join('.')}`,
    prompt: `${c.sent(xs[0]!, m * xs[0]!)} From row to row both numbers change. What stays the same?`,
    board: `\\text{what stays the same?}`,
    opts: [
      { t: `${cap(c.Bn)} is always ${m} times ${c.An}.`, ok: true, say: `Yes: ${rows.map(r => `${r[1]} = ${m} × ${r[0]}`).join(', ')}. One multiplier, every row.` },
      { t: `${cap(c.Bn)} is always ${m} more than ${c.An}.`, ok: false, mc: MC.timesMore, say: `${xs[0]} + ${m} is ${xs[0]! + m}, not ${m * xs[0]!}. It is ${m} <em>times</em> as many.` },
      { t: `${cap(c.An)} and ${c.Bn} stay the same.`, ok: false, mc: MC.sameQty, say: 'Both numbers change from row to row. What stays the same is how they compare: the multiplier.' },
    ],
    solution: [`Divide in every row: ${rows.map(r => `${r[1]} ÷ ${r[0]} = ${m}`).join(', ')}.`, `The quantities change; the multiplier ${S(String(m))} stays.`],
    pic: pic1(table(c, rows, { quot: quotHead(c) }), ['table'], ['quot']),
    hero: `\\times ${m} \\text{ in every row}`,
  });
};
const cap = (s: string) => s[0]!.toUpperCase() + s.slice(1);

// 3 ratio-vs-difference: always k times as many, or always d more?
const ratioOrDiff = (R: () => number, n: number): RTItem => {
  const xy = { A: ['x', ''] as const, B: ['y', ''] as const };
  const isRatio = R() < 0.5, frac = R() < 0.4;
  let rows: [number, number][], mtext: string, d: number;
  if (frac) {
    const [p, q] = pick(R, [[2, 3], [3, 4], [2, 5], [4, 5], [3, 5]] as const);
    d = q - p; mtext = `${kText(q, p)} times`;
    rows = [1, 2, 3].map(k => (isRatio ? [p * k, q * k] : [p * k, p * k + d]));
  } else {
    const m = int(R, 2, 4), x0 = m === 4 ? 2 : int(R, 2, 3);
    d = (m - 1) * x0; mtext = `${m} times`;
    const xs = [x0, ...distinctSorted(R, 4, x0 + 1, Math.min(9, 10 - d)).slice(0, 2)];
    while (xs.length < 3) xs.push(xs[xs.length - 1]! + 1);
    rows = xs.map(x => (isRatio ? [x, m * x] : [x, x + d]));
  }
  const first = rows[0]!;
  return choiceItem(R, {
    family: 'ratioOrDiff', id: `ratioOrDiff-${n}-${rows.flat().join('.')}`,
    prompt: `Look at every pair: ${rows.map(r => `(${r[0]}, ${r[1]})`).join(', ')}. Which rule fits <em>every</em> pair?`,
    board: `${rows.slice(0, 2).map(r => `(${r[0]}, ${r[1]})`).join(',\\ ')}, | (${rows[2]![0]}, ${rows[2]![1]})`,
    opts: [
      { t: `y is always ${mtext} as much as x`, ok: isRatio, mc: isRatio ? undefined : MC.fewChecks, say: isRatio ? `Yes: y ÷ x = ${kText(first[1], first[0])} in every pair. A constant ratio.` : `It fits (${first[0]}, ${first[1]}), but check the next pair: ${rows[1]![0]} → ${rows[1]![1]} is not ${mtext} as much.` },
      { t: `y is always ${d} more than x`, ok: !isRatio, mc: isRatio ? MC.fewChecks : undefined, say: !isRatio ? `Yes: y − x = ${d} in every pair. A constant difference, not a constant ratio.` : `It fits (${first[0]}, ${first[1]}), but ${rows[1]![0]} + ${d} = ${rows[1]![0] + d}, not ${rows[1]![1]}. Check every pair.` },
      { t: 'Neither: no one rule fits every pair', ok: false, say: isRatio ? `One does: y ÷ x = ${kText(first[1], first[0])} in every pair.` : `One does: y − x = ${d} in every pair.` },
    ],
    solution: isRatio ? [`y ÷ x: ${rows.map(r => `${r[1]} ÷ ${r[0]} = ${kText(r[1], r[0])}`).join(', ')}.`, `The same every time: ${S('a constant ratio')}.`] : [`y − x: ${rows.map(r => `${r[1]} − ${r[0]} = ${d}`).join(', ')}.`, `The ratio changes (${rows.map(r => kText(r[1], r[0])).join(', ')}): ${S('a constant difference')}.`],
    pic: pic1(table(xy, rows, { quot: ['y ÷ x', ''] }), ['table'], ['quot'], undefined, isRatio ? {} : { t: [{ hotQ: [1, 2] }] }),
    hero: isRatio ? `y \\div x = ${kText(first[1], first[0])}` : `y - x = ${d}`,
  });
};

// 4-6 situations: proportional, a fixed start, inverse, constant output, a constant difference
type Kind = 'prop' | 'fixed' | 'inverse' | 'constant' | 'diff';
function situationParts(R: () => number, kind: Kind) {
  if (kind === 'prop' || kind === 'fixed') {
    const p = int(R, 2, 9), f = int(R, 2, 9);
    const it = pick(R, [{ thing: 'Grapes', unit: 'pound', units: 'pounds', A: ['pounds', ''] as const }, { thing: 'Bulk rice', unit: 'pound', units: 'pounds', A: ['pounds', ''] as const }, { thing: 'A taxi ride', unit: 'mile', units: 'miles', A: ['miles', ''] as const }]);
    const taxi = it.thing.startsWith('A taxi');
    const text = kind === 'prop'
      ? `${it.thing} cost${taxi ? 's' : ''} ${money(p)} per ${it.unit}, with no other charges. Is the cost proportional to the ${it.units}?`
      : taxi ? `A taxi ride costs a ${money(f)} start fee plus ${money(p)} per mile. Is the cost proportional to the miles?`
        : `${it.thing} cost ${money(p)} per ${it.unit}, plus a ${money(f)} delivery fee per order. Is the cost proportional to the ${it.units}?`;
    const s = kind === 'prop' ? 0 : f;
    const rows = [0, 1, 2, 3].map(x => [x, s + p * x] as const);
    return { text, rows, T: table({ A: it.A, B: cost }, rows, { zero: null, quot: ['dollars', `per ${it.unit}`] }), p, f, unitWord: it.unit, units: it.units };
  }
  if (kind === 'inverse') {
    const v = pick(R, ['painters', 'pizza', 'trip'] as const);
    if (v === 'painters') {
      const n = int(R, 2, 4), h = pick(R, [3, 4, 6]);
      const W = n * h, ps = [1, 2, 3, 4, 6].filter(x => W % x === 0).slice(0, 4);
      const rows = ps.map(x => [x, W / x] as const);
      return { text: `${n} painters, all working at the same pace, paint a fence in ${h} hours. Is the time proportional to the number of painters?`, rows, T: table({ A: ['painters', ''], B: ['hours', ''] }, rows, { quot: ['hours ÷', 'painters'] }), n, h };
    }
    if (v === 'pizza') {
      const sl = pick(R, [8, 12]);
      const ps = [1, 2, 4].map(x => [x, sl / x] as const);
      return { text: `A pizza with ${sl} slices is shared equally among friends. Is the number of slices each friend gets proportional to the number of friends?`, rows: ps, T: table({ A: ['friends', ''], B: ['slices', '(each)'] }, ps, { quot: ['slices ÷', 'friends'] }) };
    }
    const D = pick(R, [60, 120]);
    const sp = (D === 60 ? [20, 30, 60] : [30, 40, 60]).map(x => [x, D / x] as const);
    return { text: `A ${D}-mile trip is driven at a steady speed. Is the time the trip takes proportional to the speed?`, rows: sp, T: table({ A: ['speed', '(mph)'], B: ['time', '(hours)'] }, sp, { quot: ['time ÷', 'speed'] }) };
  }
  if (kind === 'constant') {
    const v = R() < 0.6;
    const t = int(R, 3, 6), n = int(R, 2, 5);
    const rows = [1, 2, 3].map(x => [x, t] as const);
    return v
      ? { text: `${n} musicians play a ${t}-minute song together, at the same tempo, starting at the same time. Is the time the song takes proportional to the number of musicians?`, rows, T: table({ A: ['players', ''], B: ['minutes', ''] }, rows, { quot: ['minutes ÷', 'players'] }), n, t }
      : { text: `A movie is ${t} hours long. Is the length of the movie proportional to the number of people watching it?`, rows, T: table({ A: ['people', ''], B: ['hours', ''] }, rows, { quot: ['hours ÷', 'people'] }), n, t };
  }
  const d = int(R, 2, 5), a0 = int(R, 3, 6);
  const rows = [a0, a0 + 1, a0 + 3].map(x => [x, x + d] as const);
  return { text: `Sam is always ${d} years older than his sister. Is Sam's age proportional to his sister's age?`, rows, T: table({ A: ['sister', '(age)'], B: ['Sam', '(age)'] }, rows, { quot: ['Sam ÷', 'sister'] }), d };
}
function kindFor(R: () => number, sg?: string): Kind {
  if (sg === 'fixed-start-nonexample') return R() < 0.7 ? 'fixed' : 'prop';
  if (sg === 'inverse-nonexample') return R() < 0.7 ? 'inverse' : pick(R, ['fixed', 'prop'] as const);
  if (sg === 'constant-output-nonexample') return R() < 0.5 ? 'constant' : pick(R, ['prop', 'fixed', 'inverse', 'diff'] as const);
  return pick(R, ['prop', 'fixed', 'inverse', 'constant', 'diff'] as const);
}
const situation = (R: () => number, n: number, sg?: string): RTItem => {
  const kind = kindFor(R, sg);
  const P = situationParts(R, kind);
  const zero = P.rows[0]![0] === 0 ? 0 : null;
  const T: TableSpec = { ...P.T, zero };
  const bad = badRows(P.rows);
  const opts: Record<Kind, Opt[]> = {
    prop: [
      { t: 'Yes: double the amount, double the cost, and 0 costs $0', ok: true, say: 'Yes: one price per unit and nothing else, so the cost is proportional.' },
      { t: 'No: the cost changes when the amount changes', ok: false, mc: MC.sameQty, say: 'Both quantities change in a proportional relationship. What stays the same is the price per unit.' },
      { t: 'No: there is a fee on top', ok: false, mc: MC.ignores, say: 'Read the situation again: no other charges. Only the price per unit.' },
    ],
    fixed: [
      { t: 'No: the fee is paid even for 0', ok: true, say: 'Right: at 0 the cost is already the fee, not $0. The dollars per unit change.' },
      { t: 'Yes: more of it costs more', ok: false, mc: MC.scalesNon, say: 'More costs more, but that is not enough. With the fee, double the amount does not double the cost.' },
      { t: 'Yes: the price per unit stays the same', ok: false, mc: MC.scalesNon, say: 'The per-unit price does not change, but the fee comes on top. Divide cost by amount: it changes from row to row.' },
    ],
    inverse: [
      { t: 'No: more of one means less of the other', ok: true, say: 'Right: this goes the other way. Double one, and the other is cut in half.' },
      { t: 'Yes: double one, double the other', ok: false, mc: MC.inverse, say: 'Try it: twice as many means each one needs only half. The other quantity goes down, not up.' },
      { t: 'Yes: everything happens at the same steady rate', ok: false, mc: MC.scalesNon, say: 'A steady rate is part of the story, but the second quantity goes down as the first goes up. Not proportional.' },
    ],
    constant: [
      { t: 'No: the second amount stays the same', ok: true, say: 'Right: it stays the same however many there are. Its ratio to the first amount changes.' },
      { t: 'Yes: double the first, double the second', ok: false, mc: MC.scalesNon, say: 'Picture it: more people do not make the time longer. It stays the same.' },
      { t: 'No: with more of them it goes faster', ok: false, mc: MC.ignores, say: 'The situation says the same tempo or the same length: nothing gets faster. The second amount stays the same.' },
    ],
    diff: [
      { t: 'No: the difference stays the same, not the ratio', ok: true, say: 'Right: always the same number of years more. The ratio of the ages changes every year.' },
      { t: 'Yes: both go up by 1 every year', ok: false, mc: MC.addDiff, say: 'Going up by the same amount keeps the difference, not the ratio. Divide the ages: it changes.' },
      { t: 'Yes: one is always older than the other', ok: false, say: 'Always older is not the same as always the same multiple. Divide the ages: it changes.' },
    ],
  };
  const sol: Record<Kind, string> = {
    prop: 'Make a table: 0 → $0, and the dollars per unit are the same in every row.',
    fixed: 'Make a table with a row for 0: it costs the fee. The dollars per unit change from row to row.',
    inverse: 'Make a table: one quantity goes up, the other goes down. The quotient changes.',
    constant: 'Make a table: the second amount is the same in every row. The quotient changes.',
    diff: 'Make a table of the ages: the difference stays, the quotient changes.',
  };
  return choiceItem(R, {
    family: 'situation', id: `situation-${n}-${kind}-${P.rows.flat().join('.')}`,
    prompt: P.text, board: `\\text{proportional?}`, opts: opts[kind],
    solution: [sol[kind], kind === 'prop' ? `Every row: ${S('the same quotient')}, and 0 goes with 0.` : `Not the same in every row: ${S('not proportional')}.`],
    pic: { p: { tables: [{ ...T, quot: null }] }, at: [], solve: [], then: { p: { tables: [T] }, at: ['table'], solve: zero !== null ? ['zero', 'quot'] : ['quot'], solved: { t: [{ hotQ: bad }] } } },
  });
};
const doubleIt = (R: () => number, n: number, sg?: string): RTItem => {
  const kind: Kind = sg === 'fixed-start-nonexample' ? 'fixed' : sg === 'inverse-nonexample' ? 'inverse' : sg === 'constant-output-nonexample' ? 'constant' : pick(R, ['fixed', 'inverse', 'constant'] as const);
  const k = pick(R, [2, 3]);
  if (kind === 'fixed') {
    const f = int(R, 2, 9), p = int(R, 2, 9), x = int(R, 2, 4);
    const y = f + p * x, x2 = k * x, ans = f + p * x2;
    const rows = [[0, f], [x, y], [x2, ans]] as const;
    return numItem({
      family: 'doubleIt', id: `doubleIt-${n}-fixed-${f}-${p}-${x}-${k}`,
      prompt: `A shop delivers potting soil: ${money(p)} per bag plus a ${money(f)} delivery fee per order. ${A(`${x} bags`)} cost ${B(money(y))}. What do ${A(`${x2} bags`)} cost?`,
      board: `${x} \\to ${y} | ${x2} \\to \\;?`, unit: 'dollars', answer: ans,
      ok: `Yes: ${money(f)} + ${x2} × ${money(p)} = ${money(ans)}. The fee is paid once.`,
      wrong: [[k * y, MC.scalesNon, `${k} × ${money(y)} pays the ${money(f)} fee ${k} times. The fee is paid once: ${money(f)} + ${x2} × ${money(p)}.`]],
      other: `Start from the fee: ${money(f)}, then ${money(p)} for each of the ${x2} bags.`,
      solution: [`Not proportional: 0 bags still cost the ${money(f)} fee.`, `${money(f)} + ${x2} × ${money(p)} = ${S(money(ans))}.`],
      pic: { p: { tables: [{ heads: [['bags', ''], cost], rows: [...rows], zero: 0, hide: [[2, 1]], showAll: true }] }, at: ['table'], solve: ['zero', 'fill'] },
      hero: `${f} + ${x2} \\times ${p} = ${ans}`,
    });
  }
  if (kind === 'inverse') {
    const p = int(R, 2, 4), h = k * int(R, 2, 4);
    const ans = h / k, p2 = k * p;
    return numItem({
      family: 'doubleIt', id: `doubleIt-${n}-inverse-${p}-${h}-${k}`,
      prompt: `${A(`${p} painters`)}, all working at the same pace, paint a fence in ${B(`${h} hours`)}. How long do ${p2} painters take?`,
      board: `${p} \\to ${h}\\text{ h} | ${p2} \\to \\;?`, unit: 'hours', answer: ans,
      ok: `Yes: ${k} times as many painters share the work, so it takes ${h} ÷ ${k} = ${ans} hours.`,
      wrong: [[h * k, MC.inverse, `More painters finish sooner, not later. ${k} times the painters: the time is divided by ${k}.`]],
      other: `The work is the same: ${p} × ${h} = ${p * h} painter-hours. Share it among ${p2} painters.`,
      solution: [`The fence takes ${p} × ${h} = ${p * h} painter-hours.`, `${p * h} ÷ ${p2} = ${S(String(ans))} hours: ${k} times the painters, the time ÷ ${k}.`],
      pic: { p: { tables: [{ heads: [['painters', ''], ['hours', '']], rows: [[p, h], [p2, ans]], hide: [[1, 1]] }] }, at: ['table'], solve: ['fill'] },
      hero: `${h} \\div ${k} = ${ans}`,
    });
  }
  const m = int(R, 2, 5), t = int(R, 3, 6), m2 = k * m;
  return numItem({
    family: 'doubleIt', id: `doubleIt-${n}-constant-${m}-${t}-${k}`,
    prompt: `${A(`${m} musicians`)} play a ${B(`${t}-minute`)} song together, at the same tempo, starting at the same time. How long does the song take when ${m2} musicians play it the same way?`,
    board: `${m} \\to ${t}\\text{ min} | ${m2} \\to \\;?`, unit: 'minutes', answer: t,
    ok: `Yes: ${t} minutes. More players do not change the length of the song.`,
    wrong: [[t * k, MC.scalesNon, `More players do not make the song longer: same song, same tempo, ${t} minutes.`], [t / k, MC.inverse, 'They all play the whole song together; nobody shares the work. Still the same length.']],
    other: `Same song, same tempo: the time does not depend on the number of players.`,
    solution: [`The time stays ${t} minutes for any number of players.`, `${S(String(t))} minutes: a constant output, not proportional.`],
    pic: { p: { tables: [{ heads: [['players', ''], ['minutes', '']], rows: [[m, t], [m2, t]], hide: [[1, 1]] }] }, at: ['table'], solve: ['fill'] },
    hero: `${t} \\text{ minutes}`,
  });
};

// 7 table-of-pairs: keep each pair together; a table needs its labels
const NAMES = ['Ana', 'Ben', 'Cy', 'Dee', 'Eli', 'Fay', 'Gus', 'Ivy'];
const LOGS = [
  { A: ['miles', ''] as const, B: ['minutes', ''] as const, line: (nm: string, a: number, b: number) => `${nm} ran ${a} miles in ${b} minutes.`, aR: [2, 6] as const, bR: [14, 60] as const, unit: 'minutes', title: 'A running log' },
  { A: ['laps', ''] as const, B: ['minutes', ''] as const, line: (nm: string, a: number, b: number) => `${nm} swam ${a} laps in ${b} minutes.`, aR: [3, 9] as const, bR: [6, 30] as const, unit: 'minutes', title: 'A swim log' },
  { A: ['hours', '(study)'] as const, B: ['score', ''] as const, line: (nm: string, a: number, b: number) => `${nm} studied ${a} hours and scored ${b}.`, aR: [1, 8] as const, bR: [60, 99] as const, unit: 'points', title: 'Quiz scores' },
];
const pairTable = (R: () => number, n: number): RTItem => {
  const L = pick(R, LOGS);
  const k = int(R, 3, 4);
  for (let g = 0; ; g++) {
    const as = distinctSorted(R, k, L.aR[0], L.aR[1]);
    const bs = shuffle(R, distinctSorted(R, k, L.bR[0], L.bR[1]));
    if (as.length < k || bs.length < k) continue;
    const sortedB = [...bs].sort((a, b) => a - b);
    const cands = as.map((_, i) => i).filter(i => sortedB[i] !== bs[i]);
    if (!cands.length && g < 40) continue;
    const r = cands.length ? pick(R, cands) : 0;
    const names = shuffle(R, [...NAMES]).slice(0, k);
    const order = shuffle(R, as.map((_, i) => i));
    const rows = as.map((a, i) => [a, bs[i]!] as const);
    return numItem({
      family: 'pairTable', id: `pairTable-${n}-${rows.flat().join('.')}-${r}`,
      prompt: `${L.title}: ${order.map(i => L.line(names[i]!, as[i]!, bs[i]!)).join(' ')} The table lists the ${L.A[0]} in order. What goes with ${A(String(as[r]))}?`,
      board: `${as[r]} : \\;?`, unit: L.unit, answer: bs[r]!,
      ok: `Yes: ${names[r]}'s pair stays together: ${as[r]} with ${bs[r]}.`,
      wrong: [[sortedB[r]!, MC.sortsPairs, `That sorts the ${L.B[0]} on their own. Each row is one person: ${names[r]}, ${as[r]} with ${bs[r]}.`]],
      other: `Find ${as[r]} ${L.A[0]} in the sentences: whose is it? Take that person's ${L.B[0]}.`,
      solution: [`${as[r]} ${L.A[0]} belongs to ${names[r]}.`, `${names[r]}'s other number: ${S(String(bs[r]))}. A pair is never split.`],
      pic: pic1({ heads: [L.A, L.B], rows: [...rows], hide: [[r, 1]] }, ['table'], ['fill'], { t: [{ lit: [r] }] }),
    });
  }
};
const labelTable = (R: () => number, n: number): RTItem => {
  const c = ctxWith(R);
  const m = pick(R, c.rates);
  const xs = distinctSorted(R, 3, 1, 9).filter(x => m * x <= 100);
  while (xs.length < 3) xs.push(10 + xs.length);
  const rows = xs.slice(0, 3).map(x => [x, m * x] as const);
  const nm = pick(R, NAMES);
  return choiceItem(R, {
    family: 'labelTable', id: `labelTable-${n}-${c.id}-${rows.flat().join('.')}`,
    prompt: `${nm} writes down ${c.An} and ${c.Bn} and makes this table, with no headers. What does a reader still need?`,
    board: `\\text{what is missing?}`,
    opts: [
      { t: 'The name and unit of each column', ok: true, say: `Yes: without "${c.A[0]}" and "${c.B[0]}" the numbers could mean anything.` },
      { t: 'Nothing: the numbers say it all', ok: false, mc: MC.omitsLabels, say: `Is ${rows[0]![1]} dollars, miles or apples? Without headers a reader cannot tell.` },
      { t: 'A row for 0', ok: false, say: 'A row for 0 is not needed. The reader needs to know what each column counts.' },
    ],
    solution: [`Headers: ${A(c.A[0])} and ${B(c.B[0] + (c.B[1] ? ' ' + c.B[1] : ''))}.`, 'Every column gets a name and its unit.'],
    pic: { p: { tables: [{ heads: [['?', ''], ['?', '']], rows: [...rows] }] }, at: ['table'], solve: [], then: { p: { tables: [table(c, [...rows])] }, at: [], solve: ['table'] } },
  });
};

// 8 build-up-rows: one more copy of the base pair on both sides
const buildUp = (R: () => number, n: number): RTItem => {
  const mx = pick(R, MIXES);
  let a = int(R, 2, 6), b = int(R, 2, 7);
  while (b === a) b = int(R, 2, 7);
  const k = int(R, 2, Math.min(4, Math.floor(50 / Math.max(a, b)) - 1));
  const rows = Array.from({ length: k + 1 }, (_, i) => [(i + 1) * a, (i + 1) * b] as const);
  const ans = (k + 1) * b;
  const ops = rows.slice(1).map((_, i) => ({ kind: 'step' as const, from: i, to: i + 1, da: a, db: b }));
  return numItem({
    family: 'buildUp', id: `buildUp-${n}-${mx.id}-${a}-${b}-${k}`,
    prompt: `One batch of ${mx.what} uses ${A(mx.an(a))} and ${B(mx.bn(b))}. The table builds up one batch at a time. What goes with ${A(String((k + 1) * a))}?`,
    board: `${(k + 1) * a} : \\;?`, unit: mx.B[1].replace(/[()]/g, ''), answer: ans,
    ok: `Yes: one more batch adds ${a} and ${b}. ${k * b} + ${b} = ${ans}.`,
    wrong: [
      [(k + 1) * a + (k * b - k * a), MC.addDiff, `That keeps the difference between the columns. A batch adds ${b} to the ${mx.B[0]}, not ${a}.`],
      [k * b, MC.oneTerm, `The ${mx.A[0]} went up by a batch, so the ${mx.B[0]} must too: + ${b}.`],
    ],
    other: `Each row is one more batch: + ${a} on the left, + ${b} on the right.`,
    solution: [`One more batch: + ${a} ${mx.A[0]}, + ${b} ${mx.B[0]}.`, `${k * b} + ${b} = ${S(String(ans))}.`],
    pic: pic1({ heads: [mx.A, mx.B], rows: [...rows], ops: ops.slice(0, -1).concat(ops.slice(-1)), hide: [[k, 1]], showAll: true }, ['table', ...ops.slice(0, -1).map((_, i) => 'op' + i)], ['op' + (k - 1), 'fill']),
    hero: `${k * b} + ${b} = ${ans}`,
  });
};

// 9 unit-row: the row for 1 as a step; the rate with its unit
const unitRow = (R: () => number, n: number): RTItem => {
  const c = ctxWith(R);
  const u = pick(R, c.rates);
  let x = int(R, 2, 9);
  while (x * u > 100) x--;
  let m = int(R, 2, 10);
  while (m === x || m * u > 100) m = m === x ? m + 1 : int(R, 2, Math.floor(100 / u));
  if (m === x) m = x === 2 ? 3 : 2;
  const askRate = R() < 0.34;
  const T: TableSpec = askRate
    ? table(c, [[x, x * u], [1, u]], { ops: [{ kind: 'div', from: 0, to: 1, f: x }], hide: [[1, 1]], showAll: true })
    : table(c, [[x, x * u], [1, u], [m, m * u]], { ops: [{ kind: 'div', from: 0, to: 1, f: x }, { kind: 'mul', from: 1, to: 2, f: m }], hide: [[1, 1], [2, 1]], showAll: true });
  if (askRate) {
    return numItem({
      family: 'unitRow', id: `unitRow-${n}-${c.id}-${x}-${u}-rate`,
      prompt: `${c.sent(x, x * u)} Find the row for ${A('1')}: how many ${c.per}?`,
      board: `${x} : ${x * u} \\;\\to\\; 1 : \\;?`, unit: c.per, answer: u,
      ok: `Yes: divide both columns by ${x}. ${x * u} ÷ ${x} = ${u} ${c.per}.`,
      wrong: [
        [1 / u, MC.reversed, `That is ${x} ÷ ${x * u}: ${c.rev}. For ${c.per}, divide ${x * u} by ${x}.`],
        [x * u - (x - 1), MC.addDiff, `That takes ${x - 1} off both columns. To get from ${x} to 1, divide both by ${x}.`],
      ],
      other: `${x} becomes 1 when you divide by ${x}. Do the same to ${x * u}.`,
      solution: [`${x} ÷ ${x} = 1, so divide the other column by ${x} too.`, `${x * u} ÷ ${x} = ${S(String(u))} ${c.per}.`],
      pic: pic1(T, ['table'], ['op0', 'fill']), hero: `${x * u} \\div ${x} = ${u}`,
    });
  }
  return numItem({
    family: 'unitRow', id: `unitRow-${n}-${c.id}-${x}-${u}-${m}`,
    prompt: `${c.sent(x, x * u)} Use the row for 1. ${c.ask(m)}`,
    board: `${x} : ${x * u} \\;\\to\\; ${m} : \\;?`, unit: c.unit, answer: m * u,
    ok: `Yes: the row for 1 is 1 : ${u}, and ${m} × ${u} = ${m * u}.`,
    wrong: [
      [x * u + (m - x), MC.addDiff, `That adds ${m - x} to both columns. Go through the row for 1: ÷${x}, then ×${m}.`],
      [x * u * m, undefined, `That multiplies the ${x} row by ${m}: that is ${x * m}, not ${m}. Go to the row for 1 first.`],
    ],
    other: `Row for 1: ${x * u} ÷ ${x} = ${u}. Then multiply by ${m}.`,
    solution: [`Row for 1: ÷${x} on both sides → 1 : ${u}.`, `×${m} on both sides → ${m} : ${S(String(m * u))}.`],
    pic: pic1(T, ['table'], ['op0', 'op1', 'fill']), hero: `${m} \\times ${u} = ${m * u}`,
  });
};
const rateUnit = (R: () => number, n: number): RTItem => {
  const c = ctxWith(R);
  const u = pick(R, c.rates);
  let x = int(R, 2, 9);
  while (x * u > 100) x--;
  return choiceItem(R, {
    family: 'rateUnit', id: `rateUnit-${n}-${c.id}-${x}-${u}`,
    prompt: `${c.sent(x, x * u)} Which is the unit rate, with its unit?`,
    board: `${x} : ${x * u} \\;\\to\\; 1 : ${u}`,
    opts: [
      { t: `${u} ${c.per}`, ok: true, say: `Yes: the row for 1 is 1 : ${u}, so ${u} ${c.per}.` },
      { t: `${u} ${c.rev}`, ok: false, mc: MC.reversed, say: `Read it back: ${u} ${c.rev}? It is the other way round: ${u} ${c.per}.` },
      { t: `${u}`, ok: false, mc: MC.noUnit, say: `${u} what? A rate needs its unit: ${c.per}.` },
    ],
    solution: [`Divide both columns by ${x}: 1 : ${u}.`, `So ${S(`${u} ${c.per}`)}: the unit names both quantities.`],
    pic: pic1(table(c, [[x, x * u], [1, u]], { ops: [{ kind: 'div', from: 0, to: 1, f: x }] }), ['table'], ['op0']),
  });
};

// 10 intermediate-row: no whole unit rate; divide by a common divisor, then scale
interface Mid { c: PCtx; p: number; q: number; d: number; t: number }
function midNums(R: () => number): Mid {
  for (;;) {
    // only quantities where a fractional unit rate makes sense (no half eggs, no half apples per bag)
    const c = ctxWith(R, x => !['yards', 'gallons', 'pints', 'muffins', 'apples'].includes(x.id));
    const p = int(R, 2, 5), q = int(R, 2, 9);
    if (gcd(p, q) !== 1 || q % p === 0) continue;
    const d = int(R, 2, 5), t = int(R, 2, 10);
    if (t === d || t % d === 0 || d * q > 81 || t * q > 100 || t * p > 100 || d * p > 50) continue;
    return { c, p, q, d, t };
  }
}
const midRow = (R: () => number, n: number): RTItem => {
  const { c, p, q, d, t } = midNums(R);
  const ans = t * q, hint = R() < 0.5;
  const rnd = Math.round(q / p + 1e-9);
  return numItem({
    family: 'midRow', id: `midRow-${n}-${c.id}-${p}-${q}-${d}-${t}`,
    prompt: `${c.sent(d * p, d * q)} ${c.ask(t * p)}${hint ? ` Start by dividing both columns by ${d}.` : ''}`,
    board: `${d * p} : ${d * q} \\;\\to\\; ${t * p} : \\;?`, unit: c.unit, answer: ans,
    ok: `Yes: ÷${d} gives ${p} : ${q}, then ×${t} gives ${t * p} : ${ans}.`,
    wrong: [
      [d * q + (t * p - d * p), MC.addDiff, `That adds ${t * p - d * p} to both columns. Divide both by ${d} first (${p} : ${q}), then multiply both by ${t}.`],
      [rnd * t * p, MC.wholeRate, `${q} ÷ ${p} is not ${rnd}: it is ${kText(q, p)}. Use a whole row instead: ${p} : ${q}, then ×${t}.`],
    ],
    other: `Find a smaller row: ${d * p} and ${d * q} can both be divided by ${d}.`,
    solution: [`÷${d} on both sides: ${d * p} : ${d * q} → ${p} : ${q}.`, `×${t} on both sides: ${p} : ${q} → ${t * p} : ${S(String(ans))}.`],
    pic: pic1(table(c, [[d * p, d * q], [p, q], [t * p, ans]], { ops: [{ kind: 'div', from: 0, to: 1, f: d }, { kind: 'mul', from: 1, to: 2, f: t }], hide: [[1, 0], [1, 1], [2, 1]], showAll: true }), ['table'], ['op0', 'op1', 'fill']),
    hero: `${t} \\times ${q} = ${ans}`,
  });
};
const canWeFind = (R: () => number, n: number): RTItem => {
  const { c, p, q, d, t } = midNums(R);
  const diff = t * p - d * p;
  return choiceItem(R, {
    family: 'canWeFind', id: `canWeFind-${n}-${c.id}-${p}-${q}-${d}-${t}`,
    prompt: `${c.sent(d * p, d * q)} Can a ratio table find ${c.Bn} for ${A(String(t * p))}?`,
    board: `${d * p} : ${d * q} \\;\\to\\; ${t * p} : \\;?`,
    opts: [
      { t: `Yes: divide both by ${d}, then multiply both by ${t}`, ok: true, say: `Yes: ${p} : ${q} is a row too, and ×${t} gives ${t * p} : ${t * q}.` },
      { t: `No: ${t * p} is not a multiple of ${d * p}`, ok: false, mc: MC.wholeRow, say: `You can go down first: ÷${d} gives the row ${p} : ${q}. From there ×${t} reaches ${t * p}.` },
      { t: `Yes: ${diff >= 0 ? `add ${diff} to` : `subtract ${-diff} from`} both columns`, ok: false, mc: MC.addDiff, say: `Adding the same amount changes the ratio. Multiply or divide both columns instead.` },
    ],
    solution: [`÷${d}: ${d * p} : ${d * q} → ${p} : ${q}.`, `×${t}: ${p} : ${q} → ${t * p} : ${S(String(t * q))}.`],
    pic: pic1(table(c, [[d * p, d * q], [p, q], [t * p, t * q]], { ops: [{ kind: 'div', from: 0, to: 1, f: d }, { kind: 'mul', from: 1, to: 2, f: t }], hide: [[1, 0], [1, 1], [2, 1]], showAll: true }), ['table'], ['op0', 'op1', 'fill']),
  });
};

// 11-12 add and subtract rows
function twoRows(R: () => number, sum: boolean) {
  const c = ctxWith(R, x => x.rates.length > 1);
  const u = pick(R, c.rates);
  for (;;) {
    const x1 = int(R, 2, 9), x2 = int(R, 2, 9);
    if (x1 === x2 || (sum ? (x1 + x2) * u > 100 : x1 <= x2 || x1 * u > 100)) continue;
    return { c, u, x1, x2 };
  }
}
const addRows = (R: () => number, n: number): RTItem => {
  const { c, u, x1, x2 } = twoRows(R, true);
  const s = x1 + x2, ans = s * u;
  return numItem({
    family: 'addRows', id: `addRows-${n}-${c.id}-${u}-${x1}-${x2}`,
    prompt: `${c.sent(x1, x1 * u)} ${c.sent(x2, x2 * u)} ${c.ask(s)} Add the two rows.`,
    board: `${x1} : ${x1 * u} \\;+\\; ${x2} : ${x2 * u}`, unit: c.unit, answer: ans,
    ok: `Yes: ${x1} + ${x2} = ${s} and ${x1 * u} + ${x2 * u} = ${ans}. Add both columns.`,
    wrong: [[x1 * u, MC.oneTerm, `The first column went up from ${x1} to ${s}; the second must go up too: ${x1 * u} + ${x2 * u}.`], [x1 * u + x2, MC.oneTerm, `Add the matching numbers: ${x1 * u} + ${x2 * u}, the second column of both rows.`]],
    other: `Add down both columns: ${x1} + ${x2} on the left, ${x1 * u} + ${x2 * u} on the right.`,
    solution: [`${x1} + ${x2} = ${s} on the left.`, `${x1 * u} + ${x2 * u} = ${S(String(ans))} on the right.`],
    pic: pic1(table(c, [[x1, x1 * u], [x2, x2 * u], [s, ans]], { ops: [{ kind: 'add', a: 0, b: 1, to: 2 }], hide: [[2, 1]], showAll: true }), ['table'], ['op0', 'fill']),
    hero: `${x1 * u} + ${x2 * u} = ${ans}`,
  });
};
const subRows = (R: () => number, n: number): RTItem => {
  const { c, u, x1, x2 } = twoRows(R, false);
  const dd = x1 - x2, ans = dd * u;
  return numItem({
    family: 'subRows', id: `subRows-${n}-${c.id}-${u}-${x1}-${x2}`,
    prompt: `${c.sent(x1, x1 * u)} ${c.sent(x2, x2 * u)} ${c.ask(dd)} Subtract the smaller row from the larger one.`,
    board: `${x1} : ${x1 * u} \\;-\\; ${x2} : ${x2 * u}`, unit: c.unit, answer: ans,
    ok: `Yes: ${x1} − ${x2} = ${dd} and ${x1 * u} − ${x2 * u} = ${ans}.`,
    wrong: [[-ans, MC.smallMinusBig, `${x2 * u} − ${x1 * u} goes below 0. Take the smaller row from the larger one: ${x1 * u} − ${x2 * u}.`], [x1 * u, MC.oneTerm, `The first column went down to ${dd}; the second must go down too: ${x1 * u} − ${x2 * u}.`]],
    other: `Subtract down both columns: ${x1} − ${x2} and ${x1 * u} − ${x2 * u}.`,
    solution: [`${x1} − ${x2} = ${dd} on the left.`, `${x1 * u} − ${x2 * u} = ${S(String(ans))} on the right.`],
    pic: pic1(table(c, [[x1, x1 * u], [x2, x2 * u], [dd, ans]], { ops: [{ kind: 'sub', a: 0, b: 1, to: 2 }], hide: [[2, 1]], showAll: true }), ['table'], ['op0', 'fill']),
    hero: `${x1 * u} - ${x2 * u} = ${ans}`,
  });
};
const feeRows = (R: () => number, n: number): RTItem => {
  const fee = R() < 0.65;
  const f = fee ? int(R, 2, 9) : 0, r = int(R, 2, 9);
  let x1 = int(R, 1, 4), x2 = int(R, 1, 5);
  while (x2 === x1) x2 = int(R, 1, 5);
  if (x1 > x2) [x1, x2] = [x2, x1];
  const y1 = f + r * x1, y2 = f + r * x2, s = x1 + x2, claim = y1 + y2, truth = f + r * s;
  const it = pick(R, [{ what: 'kayak', A: ['hours', ''] as const, u: 'hour', us: 'hours' }, { what: 'shipping', A: ['pounds', ''] as const, u: 'pound', us: 'pounds' }, { what: 'bike', A: ['hours', ''] as const, u: 'hour', us: 'hours' }]);
  const text = fee ? `A ${it.what} price list: ${money(r)} per ${it.u} plus a ${money(f)} fee. ${pl(x1, it.u, it.us)} cost ${money(y1)}, ${pl(x2, it.u, it.us)} cost ${money(y2)}.`
    : `A ${it.what} price list: ${money(r)} per ${it.u}, no other charges. ${pl(x1, it.u, it.us)} cost ${money(y1)}, ${pl(x2, it.u, it.us)} cost ${money(y2)}.`;
  const T: TableSpec = { heads: [it.A, cost], rows: [[x1, y1], [x2, y2], [s, claim]], ops: [{ kind: 'add', a: 0, b: 1, to: 2 }], showAll: true, quot: ['dollars', `per ${it.u}`] };
  return choiceItem(R, {
    family: 'feeRows', id: `feeRows-${n}-${fee}-${f}-${r}-${x1}-${x2}`,
    prompt: `${text} Lee adds the two rows: “${pl(s, it.u, it.us)} must cost ${money(claim)}.” Is Lee right?`,
    board: `${y1} + ${y2} = ${claim}\\,?`,
    opts: fee ? [
      { t: `No: the ${money(f)} fee would be paid twice`, ok: true, say: `Right: ${money(y1)} and ${money(y2)} each hold the fee. ${pl(s, it.u, it.us)} really cost ${money(truth)}.` },
      { t: 'Yes: adding two rows always gives a row', ok: false, mc: MC.otherTable, say: `Only in a proportional table. Here each price holds the ${money(f)} fee once; added, it counts twice.` },
      { t: `Yes: ${s} is ${x1} + ${x2}, so the costs add too`, ok: false, mc: MC.otherTable, say: `The hours add, but the fee is not per ${it.u}. ${money(claim)} pays it twice; the price is ${money(truth)}.` },
    ] : [
      { t: `Yes: every row is ${money(r)} per ${it.u}, so rows add`, ok: true, say: `Right: no fee, one price per ${it.u}. Adding rows adds ${it.us} and dollars together.` },
      { t: 'No: you may only multiply a row, never add rows', ok: false, mc: MC.wholeRow, say: 'In a proportional table adding two rows gives another row: it is just more copies of the same pair.' },
      { t: `No: a fee would be paid twice`, ok: false, mc: MC.ignores, say: 'Read it again: no other charges. Without a fee the rows add.' },
    ],
    solution: fee ? [`Dollars per ${it.u} change (${kText(y1, x1)}, ${kText(y2, x2)}): not proportional.`, `Truth: ${money(f)} + ${s} × ${money(r)} = ${S(money(truth))}.`] : [`Dollars per ${it.u}: ${r} in every row, proportional.`, `So ${money(y1)} + ${money(y2)} = ${S(money(claim))} is right.`],
    pic: { p: { tables: [T] }, at: ['table', 'op0'], solve: fee ? ['quot', 'strike', 'fix'] : ['quot'], focus: { t: [{ lit: [2], hideQ: [2] }] }, solved: { t: [{ lit: [2], litCol: 'link', hideQ: [2], hotQ: fee ? [1] : [], strike: fee ? [2, 1] : undefined, fixText: fee ? String(truth) : undefined }] } },
  });
};

// 13 choose-route: the efficient route to the target row
const route = (R: () => number, n: number): RTItem => {
  const kind = pick(R, ['scale', 'add', 'mid'] as const);
  if (kind === 'scale') {
    const c = ctxWith(R, x => x.rates.length > 1);
    const u = pick(R, c.rates);
    let x = int(R, 2, 5), k = int(R, 2, 4);
    while (k * x * u > 100) { if (k > 2) k--; else x--; }
    return choiceItem(R, {
      family: 'route', id: `route-${n}-scale-${c.id}-${u}-${x}-${k}`,
      prompt: `${c.sent(x, x * u)} ${c.ask(k * x)} Which route is best?`,
      board: `${x} : ${x * u} \\;\\to\\; ${k * x} : \\;?`,
      opts: [
        { t: `Multiply both columns by ${k}: one step`, ok: true, say: `Yes: ${x} × ${k} = ${k * x}, so ×${k} on both sides gets there in one step.` },
        { t: `Find the row for 1, then multiply by ${k * x}`, ok: false, mc: MC.habit, say: `That works too, but takes two steps. ${k * x} is ${k} × ${x}: one ×${k} is enough.` },
        { t: `Add ${k * x - x} to both columns`, ok: false, mc: MC.addDiff, say: 'Adding the same amount changes the ratio. Multiply both columns.' },
      ],
      solution: [`${k * x} = ${k} × ${x}: look at the numbers first.`, `×${k} on both sides: ${k * x} : ${S(String(k * x * u))}.`],
      pic: pic1(table(c, [[x, x * u], [k * x, k * x * u]], { ops: [{ kind: 'mul', from: 0, to: 1, f: k }], hide: [[1, 1]], showAll: true }), ['table'], ['op0', 'fill']),
    });
  }
  if (kind === 'add') {
    const { c, u, x1, x2 } = twoRows(R, true);
    return choiceItem(R, {
      family: 'route', id: `route-${n}-add-${c.id}-${u}-${x1}-${x2}`,
      prompt: `${c.sent(x1, x1 * u)} ${c.sent(x2, x2 * u)} ${c.ask(x1 + x2)} Which route is best?`,
      board: `${x1} + ${x2} = ${x1 + x2}`,
      opts: [
        { t: 'Add the two rows you know', ok: true, say: `Yes: ${x1} + ${x2} = ${x1 + x2}, so add the rows: one step.` },
        { t: `Find the row for 1, then multiply by ${x1 + x2}`, ok: false, mc: MC.habit, say: `That works, but takes two steps. ${x1 + x2} = ${x1} + ${x2}: adding the rows is quicker.` },
        { t: `Add ${x2} to both columns of the ${x1} row`, ok: false, mc: MC.addDiff, say: `Adding ${x2} to both changes the ratio. Add the whole ${x2} row instead.` },
      ],
      solution: [`${x1 + x2} = ${x1} + ${x2}: the two known rows add up to it.`, `${x1 * u} + ${x2 * u} = ${S(String((x1 + x2) * u))}.`],
      pic: pic1(table(c, [[x1, x1 * u], [x2, x2 * u], [x1 + x2, (x1 + x2) * u]], { ops: [{ kind: 'add', a: 0, b: 1, to: 2 }], hide: [[2, 1]], showAll: true }), ['table'], ['op0', 'fill']),
    });
  }
  const { c, p, q, d, t } = midNums(R);
  const rnd = Math.round(q / p + 1e-9);
  return choiceItem(R, {
    family: 'route', id: `route-${n}-mid-${c.id}-${p}-${q}-${d}-${t}`,
    prompt: `${c.sent(d * p, d * q)} ${c.ask(t * p)} Which route works?`,
    board: `${d * p} : ${d * q} \\;\\to\\; ${t * p} : \\;?`,
    opts: [
      { t: `Divide both by ${d}, then multiply both by ${t}`, ok: true, say: `Yes: ${p} : ${q} is a whole-number row, and ×${t} reaches ${t * p}.` },
      { t: `Round ${q} ÷ ${p} to ${rnd}, then multiply by ${t * p}`, ok: false, mc: MC.wholeRate, say: `${q} ÷ ${p} is ${kText(q, p)}, not ${rnd}. Rounding gives a wrong answer; use the row ${p} : ${q}.` },
      { t: `None: ${t * p} is not a multiple of ${d * p}`, ok: false, mc: MC.wholeRow, say: `Go down first: ÷${d} gives ${p} : ${q}. From there ×${t} reaches ${t * p}.` },
    ],
    solution: [`No whole row for 1 here (${q} ÷ ${p} = ${kText(q, p)}).`, `÷${d} → ${p} : ${q}, then ×${t} → ${t * p} : ${S(String(t * q))}.`],
    pic: pic1(table(c, [[d * p, d * q], [p, q], [t * p, t * q]], { ops: [{ kind: 'div', from: 0, to: 1, f: d }, { kind: 'mul', from: 1, to: 2, f: t }], hide: [[1, 0], [1, 1], [2, 1]], showAll: true }), ['table'], ['op0', 'op1', 'fill']),
  });
};

// 14 compare-tables: extend both to a common row
const compare = (R: () => number, n: number): RTItem => {
  const kind = pick(R, ['price', 'mix', 'speed'] as const);
  if (kind === 'price' || kind === 'speed') {
    for (;;) {
      const u1 = int(R, 2, 9), u2 = int(R, 2, 9), a1 = int(R, 2, 9), a2 = int(R, 2, 9);
      if (u1 === u2 || a1 === a2 || a1 * u1 > 100 || a2 * u2 > 100) continue;
      // the one with the better rate has the worse total (the trap: comparing rows with different first amounts)
      const better = kind === 'price' ? (u1 < u2 ? 0 : 1) : (u1 > u2 ? 0 : 1);
      const t1 = a1 * u1, t2 = a2 * u2;
      if (t1 === t2) continue;
      const totalPick = kind === 'price' ? (t1 < t2 ? 0 : 1) : (t1 > t2 ? 0 : 1);
      if (totalPick === better) continue;
      const names = kind === 'price' ? ['Store A', 'Store B'] : pick(R, [['Ava', 'Ben'], ['Kim', 'Leo'], ['Mia', 'Noah']]);
      const item = pick(R, [{ one: 'pound of grapes', many: 'pounds of grapes', col: 'pounds', per: 'pound' }, { one: 'pack of pens', many: 'packs of pens', col: 'packs', per: 'pack' }, { one: 'bag of rice', many: 'bags of rice', col: 'bags', per: 'bag' }]);
      const heads2 = kind === 'price' ? [[item.col, ''], cost] as const : [['hours', ''], ['miles', '']] as const;
      const rows = (a: number, u: number): (readonly [number, number])[] => [[a, a * u], [1, u]];
      const T = (j: number): TableSpec => ({ heads: heads2 as never, rows: rows(j ? a2 : a1, j ? u2 : u1), hide: [[1, 1]], showAll: true, title: names[j] });
      const txt = kind === 'price'
        ? `${names[0]} sells ${A(pl(a1, item.one, item.many))} for ${B(money(t1))}. ${names[1]} sells ${A(pl(a2, item.one, item.many))} for ${B(money(t2))}. Which is the better buy?`
        : `At steady speeds, ${names[0]} covers ${B(`${t1} miles`)} in ${A(`${a1} hours`)} and ${names[1]} covers ${B(`${t2} miles`)} in ${A(`${a2} hours`)}. Who is faster?`;
      const say = (j: number) => (kind === 'price' ? `${money(j ? u2 : u1)} per ${item.per}` : `${j ? u2 : u1} miles per hour`);
      return choiceItem(R, {
        family: 'compare', id: `compare-${n}-${kind}-${a1}-${u1}-${a2}-${u2}`,
        prompt: txt,
        board: `\\text{${names[0]}: } ${a1} : ${t1} | \\text{${names[1]}: } ${a2} : ${t2}`,
        opts: [
          { t: names[better]!, ok: true, say: `Yes: compare the rows for 1. ${names[0]}: ${say(0)}, ${names[1]}: ${say(1)}.` },
          { t: names[1 - better]!, ok: false, mc: MC.mismatch, say: `Those totals are for different amounts (${a1} and ${a2}). Compare at the same amount: the rows for 1.` },
          { t: kind === 'price' ? 'Both are the same deal' : 'Both are just as fast', ok: false, say: `Build both tables to the row for 1: ${say(0)} and ${say(1)} are not the same.` },
        ],
        solution: [`Row for 1: ${names[0]} ${say(0)}, ${names[1]} ${say(1)}.`, `Same amount, compare: ${S(names[better]!)}.`],
        pic: { p: { tables: [T(0), T(1)] }, at: ['table', 'Btable'], solve: ['fill', 'Bfill'], solved: { t: [{ lit: [1], litCol: 'link' }, { lit: [1], litCol: 'link' }] } },
      });
    }
  }
  const mx = MIXES[0]!;
  for (;;) {
    const j1 = int(R, 1, 6), j2 = int(R, 1, 6), dd = int(R, 1, 4);
    if (j1 === j2) continue;
    const w1 = j1 + dd, w2 = j2 + dd;
    const L = (j1 * j2) / gcd(j1, j2);
    if (L > 30 || (L / j1) * w1 > 60 || (L / j2) * w2 > 60) continue;
    const better = j1 * w2 > j2 * w1 ? 0 : 1;
    const T = (j: number): TableSpec => {
      const jj = j ? j2 : j1, ww = j ? w2 : w1, f = L / jj;
      const rows: (readonly [number, number])[] = f === 1 ? [[jj, ww]] : [[jj, ww], [L, ww * f]];
      return { heads: [mx.A, mx.B], rows, hide: f === 1 ? [] : [[1, 0], [1, 1]], showAll: true, title: j ? 'Mix B' : 'Mix A' };
    };
    const wL = (j: number) => (L / (j ? j2 : j1)) * (j ? w2 : w1);
    return choiceItem(R, {
      family: 'compare', id: `compare-${n}-mix-${j1}-${j2}-${dd}`,
      prompt: `Mix A uses ${A(mx.an(j1))} for every ${B(mx.bn(w1))}. Mix B uses ${A(mx.an(j2))} for every ${B(mx.bn(w2))}. Which tastes more of juice?`,
      board: `\\text{A: } ${j1} : ${w1} | \\text{B: } ${j2} : ${w2}`,
      opts: [
        { t: better === 0 ? 'Mix A' : 'Mix B', ok: true, say: `Yes: with ${L} cups of juice, Mix A needs ${wL(0)} cups of water and Mix B ${wL(1)}. Less water, stronger juice.` },
        { t: better === 0 ? 'Mix B' : 'Mix A', ok: false, mc: MC.mismatch, say: `Compare at the same amount of juice: ${L} cups. Then the water is ${wL(0)} for A and ${wL(1)} for B.` },
        { t: 'They taste the same', ok: false, mc: MC.addDiff, say: `Both have ${dd} more cups of water than juice, but that is a difference, not a ratio. At ${L} cups of juice: ${wL(0)} vs ${wL(1)} cups of water.` },
      ],
      solution: [`Build both to ${L} cups of juice: A → ${L} : ${wL(0)}, B → ${L} : ${wL(1)}.`, `Less water for the same juice: ${S(better === 0 ? 'Mix A' : 'Mix B')}.`],
      pic: { p: { tables: [T(0), T(1)] }, at: ['table', 'Btable'], solve: [...(T(0).hide?.length ? ['fill'] : []), ...(T(1).hide?.length ? ['Bfill'] : [])], solved: { t: [{ lit: [T(0).rows.length - 1], litCol: 'link' }, { lit: [T(1).rows.length - 1], litCol: 'link' }] } },
    });
  }
};

// 15 test-every-pair
type TK = 'whole' | 'frac' | 'start' | 'off' | 'const';
function testRows(R: () => number, kind: TK): { rows: [number, number][]; K: string; offRow: number } {
  const n = int(R, 3, 5);
  if (kind === 'whole') { const k = int(R, 2, 9); const xs = distinctSorted(R, n, 1, Math.min(10, Math.floor(100 / k))); return { rows: xs.map(x => [x, k * x]), K: String(k), offRow: -1 }; }
  if (kind === 'frac') { const [p, q] = pick(R, [[3, 2], [5, 2], [4, 3], [5, 4], [3, 4], [2, 3]] as const); const xs = distinctSorted(R, n, 1, 6).map(x => x * q); return { rows: xs.map(x => [x, (p * x) / q]), K: kText(p, q), offRow: -1 }; }
  if (kind === 'start') { const s = int(R, 1, 6), r = int(R, 2, 5), x0 = int(R, 1, 3); return { rows: Array.from({ length: n }, (_, i) => [x0 + i, s + r * (x0 + i)] as [number, number]), K: '', offRow: 1 }; }
  if (kind === 'const') { const cc = int(R, 3, 12), x0 = int(R, 1, 3); return { rows: Array.from({ length: n }, (_, i) => [x0 + i, cc] as [number, number]), K: '', offRow: 1 }; }
  const k = int(R, 2, 9);
  const xs = distinctSorted(R, n, 1, Math.min(10, Math.floor(98 / k)));
  const j = R() < 0.6 ? xs.length - 1 : int(R, 2, xs.length - 1);
  const rows = xs.map((x, i) => [x, k * x + (i === j ? pick(R, [1, 2, -1]) : 0)] as [number, number]);
  return { rows, K: String(k), offRow: j };
}
const testTable = (R: () => number, n: number): RTItem => {
  const kind = pick(R, ['whole', 'frac', 'start', 'off', 'off', 'const'] as const);
  const c = ctxWith(R, x => !x.money);
  const { rows, K, offRow } = testRows(R, kind);
  const nm = { A: c.A, B: c.B };
  const qq = (i: number) => kText(rows[i]![1], rows[i]![0]);
  const ratio = `${c.B[0]} ÷ ${c.A[0]}`;
  const opts: Opt[] = kind === 'whole' || kind === 'frac' ? [
    { t: `Proportional: ${ratio} = ${K} in every row`, ok: true, say: `Yes: every row gives ${K}. One constant of proportionality.` },
    { t: `Not proportional: the ${c.B[0]} go up by different amounts`, ok: false, say: 'The steps between the rows differ in size, so the jumps differ. Divide in each row instead: always the same.' },
    kind === 'frac'
      ? { t: `Not proportional: ${K} is not a whole number`, ok: false, mc: MC.wholeRate, say: `A constant of proportionality can be a fraction or a decimal. ${K} in every row: proportional.` }
      : { t: 'Can’t tell without the row for 1', ok: false, say: `You don't need the row for 1: divide in every row. Always ${K}.` },
  ] : kind === 'off' ? [
    { t: `Not proportional: the ${rows[offRow]![0]} row gives ${qq(offRow)}, not ${K}`, ok: true, say: `Right: one row that breaks the pattern is enough. ${rows[offRow]![1]} ÷ ${rows[offRow]![0]} = ${qq(offRow)}.` },
    { t: `Proportional: the first two rows give ${K}`, ok: false, mc: MC.someCases, say: `Check every row, not just the first two: the ${rows[offRow]![0]} row gives ${qq(offRow)}.` },
    { t: `Proportional: almost every row gives ${K}`, ok: false, mc: MC.someCases, say: 'Almost is not enough: one row with another quotient breaks it.' },
  ] : kind === 'start' ? [
    { t: `Not proportional: ${ratio} is ${qq(0)} in one row but ${qq(1)} in the next`, ok: true, say: 'Right: the quotient changes, so there is no single constant. There is a start amount.' },
    { t: `Proportional: the ${c.B[0]} go up by the same amount each row`, ok: false, mc: MC.scalesNon, say: `Same steps make a straight pattern, not a proportional one. Divide: ${qq(0)}, then ${qq(1)}.` },
    { t: 'Proportional: both columns go up together', ok: false, mc: MC.scalesNon, say: `Going up together is not enough. Divide in each row: ${qq(0)}, ${qq(1)}: not the same.` },
  ] : [
    { t: `Not proportional: the ${c.B[0]} stay ${rows[0]![1]}, so ${ratio} changes`, ok: true, say: `Right: ${qq(0)}, then ${qq(1)}. A constant output is not proportional.` },
    { t: `Proportional: the ${c.B[0]} are the same in every row`, ok: false, mc: MC.sameQty, say: `What must stay the same is the quotient, not the ${c.B[0]}. Here the quotient changes.` },
    { t: `Proportional: the ${c.A[0]} go up evenly`, ok: false, mc: MC.scalesNon, say: `Even steps in one column say nothing yet. Divide in each row: ${qq(0)}, ${qq(1)}.` },
  ];
  const bad = badRows(rows);
  return choiceItem(R, {
    family: 'testTable', id: `testTable-${n}-${kind}-${c.id}-${rows.flat().join('.')}`,
    prompt: `Is this table proportional? Test every pair.`,
    board: `\\text{${c.B[0]}} \\div \\text{${c.A[0]}}`,
    opts,
    solution: [`Divide in every row: ${rows.map((r, i) => `${r[1]} ÷ ${r[0]} = ${qq(i)}`).join(', ')}.`, bad.length ? `Not the same: ${S('not proportional')}.` : `Always ${K}: ${S('proportional')}, k = ${K}.`],
    pic: pic1({ heads: [nm.A, nm.B], rows, quot: quotHead(c) }, ['table'], ['quot'], undefined, { t: [{ hotQ: bad, hot: kind === 'off' ? [offRow] : [] }] }),
  });
};

// 16 zero-row: (0, 0) fits, (0, b) breaks, 0 ÷ 0 is no rate
const zeroRow = (R: () => number, n: number): RTItem => {
  const v = pick(R, ['broken', 'start', 'ok', 'meaning'] as const);
  const c = ctxWith(R, x => !x.money && x.rates.length > 1);
  const k = int(R, 2, 6), x1 = int(R, 1, 4), x2 = x1 + int(R, 1, 4), s = int(R, 1, 5);
  const rows: [number, number][] = v === 'start' ? [[0, s], [x1, k * x1], [x2, k * x2]] : v === 'broken' ? [[0, 0], [x1, k * x1], [x2, k * x2 + 1]] : [[0, 0], [x1, k * x1], [x2, k * x2]];
  const T: TableSpec = { heads: [c.A, c.B], rows, zero: 0, quot: quotHead(c) };
  const opts: Opt[] = v === 'meaning' ? [
    { t: 'Only that it fits: 0 ÷ 0 gives no rate, so check the other rows', ok: true, say: `Right: any rate times 0 is 0, so 0 : 0 fits every rate. The other rows decide: ${k}.` },
    { t: 'The rate is 0, because 0 ÷ 0 = 0', ok: false, mc: MC.zeroRate, say: `0 ÷ 0 is not a number: 5 × 0 = 0 and 9 × 0 = 0 too. The rate comes from the other rows: ${k}.` },
    { t: 'That the table is proportional', ok: false, mc: MC.origin, say: 'A row 0 : 0 is needed, but it is not enough. Every other row must give the same quotient too.' },
  ] : v === 'broken' ? [
    { t: `No: ${rows[2]![1]} ÷ ${x2} is not ${k}`, ok: true, say: `Right: the 0 : 0 row fits, but the ${x2} row breaks the pattern.` },
    { t: 'Yes: it starts at 0 and 0', ok: false, mc: MC.origin, say: `Starting at 0 : 0 is not enough. Test every row: ${rows[2]![1]} ÷ ${x2} is not ${k}.` },
    { t: 'Yes: 0 ÷ 0 = 0 fits the pattern', ok: false, mc: MC.zeroRate, say: `0 ÷ 0 is no rate at all. Test the other rows: ${k * x1} ÷ ${x1} = ${k}, ${rows[2]![1]} ÷ ${x2} is not.` },
  ] : v === 'start' ? [
    { t: `No: the 0 row already has ${s}, a start amount`, ok: true, say: `Right: in a proportional table 0 goes with 0. Here 0 goes with ${s}.` },
    { t: `Yes: ${k * x1} ÷ ${x1} = ${k * x2} ÷ ${x2} = ${k}`, ok: false, mc: MC.someCases, say: `Those two rows agree, but the 0 row does not: 0 goes with ${s}, not 0.` },
    { t: 'Can’t tell: you can’t divide by 0', ok: false, say: `Check the 0 row by multiplying: ${k} × 0 = 0, not ${s}. So it is not proportional.` },
  ] : [
    { t: `Yes: 0 : 0 fits, and the other rows all give ${k}`, ok: true, say: `Right: ${k} × 0 = 0, and every other row gives ${k}.` },
    { t: 'No: the rate is 0, from 0 ÷ 0', ok: false, mc: MC.zeroRate, say: `0 ÷ 0 is no rate. Check the 0 row by multiplying: ${k} × 0 = 0. It fits.` },
    { t: 'No: you can’t divide 0 by 0', ok: false, say: `Then don't divide in that row: multiply. ${k} × 0 = 0, so 0 : 0 fits.` },
  ];
  const bad = v === 'broken' ? [2] : [];
  return choiceItem(R, {
    family: 'zeroRow', id: `zeroRow-${n}-${v}-${c.id}-${rows.flat().join('.')}`,
    prompt: v === 'meaning' ? `This table has a row 0 : 0. What does that row tell you about the rate?` : `Is this table proportional? Check the row for 0 on its own.`,
    board: `0 : ${rows[0]![1]}`,
    opts,
    solution: [`Row for 0: ${rows[0]![1] === 0 ? 'k × 0 = 0 fits any rate, but gives no rate (0 ÷ 0)' : `0 goes with ${s}: a start amount`}.`, `Other rows: ${rows.slice(1).map(r => `${r[1]} ÷ ${r[0]} = ${kText(r[1], r[0])}`).join(', ')}.`],
    pic: pic1(T, ['table', 'zero'], ['quot'], { t: [{ lit: [0], litCol: rows[0]![1] ? 'wrong' : 'pick' }] }, { t: [{ lit: [0], litCol: rows[0]![1] ? 'wrong' : 'pick', hotQ: bad }] }),
  });
};

// 17 justify-in-context: a prediction needs a rule from the situation
const predict = (R: () => number, n: number): RTItem => {
  const v = pick(R, ['sale', 'guarantee', 'fee', 'alone'] as const);
  if (v === 'sale') {
    const p = int(R, 6, 15), sale = p - int(R, 2, 4), N = int(R, 10, 15);
    const rows: [number, number][] = [[1, p], [2, 2 * p], [3, 3 * p]];
    return choiceItem(R, {
      family: 'predict', id: `predict-${n}-sale-${p}-${sale}-${N}`,
      prompt: `A shop's price list: 1 T-shirt ${money(p)}, 2 for ${money(2 * p)}, 3 for ${money(3 * p)}. A sign says: from 10 shirts on, each shirt is ${money(sale)}. Can the table predict the price of ${N} shirts?`,
      board: `${N}\\text{ shirts?}`,
      opts: [
        { t: 'No: from 10 shirts on, a different price applies', ok: true, say: `Right: the table fits for small orders, but the sign changes the rule at 10. ${N} shirts cost ${N} × ${money(sale)} = ${money(N * sale)}.` },
        { t: `Yes: every row gives ${money(p)} a shirt, so ${money(N * p)}`, ok: false, mc: MC.examples, say: 'The rows you see do fit, but the sign says the rule changes at 10. Rows that fit are not a promise.' },
        { t: 'No: the table is not proportional', ok: false, say: `The table is proportional: ${money(p)} a shirt in every row. The problem is the sign, from 10 on.` },
      ],
      solution: ['The table is proportional for 1 to 3 shirts.', `The situation changes the rule at 10: ${S(`${N} × ${money(sale)} = ${money(N * sale)}`)}.`],
      pic: pic1({ heads: [['shirts', ''], cost], rows, quot: ['dollars', 'per shirt'] }, ['table'], ['quot']),
    });
  }
  if (v === 'guarantee') {
    const p = int(R, 2, 4), N = pick(R, [10, 20, 25]);
    const rows: [number, number][] = [[1, p], [3, 3 * p], [5, 5 * p]];
    return choiceItem(R, {
      family: 'predict', id: `predict-${n}-guarantee-${p}-${N}`,
      prompt: `A store sells bulk rice at ${money(p)} per pound, for any amount. Its table shows 1, 3 and 5 pounds. Can you predict the price of ${N} pounds?`,
      board: `${N}\\text{ pounds?}`,
      opts: [
        { t: `Yes: the store promises ${money(p)} per pound, so ${money(N * p)}`, ok: true, say: `Right: the situation guarantees one fixed rate, so ×${N} works beyond the table.` },
        { t: 'No: the table stops at 5 pounds', ok: false, say: `The table stops, but the store states the rate for any amount. That rule allows the prediction: ${money(N * p)}.` },
        { t: `Yes: add ${N - 5} pounds and ${money(N - 5)}`, ok: false, mc: MC.addDiff, say: `Adding the same amount to both columns changes the ratio. Multiply: ${N} × ${money(p)}.` },
      ],
      solution: [`The context promises ${money(p)} per pound for any amount.`, `So ${S(`${N} × ${money(p)} = ${money(N * p)}`)}.`],
      pic: pic1({ heads: [['pounds', ''], cost], rows, quot: ['dollars', 'per pound'] }, ['table'], ['quot']),
    });
  }
  if (v === 'fee') {
    const f = int(R, 2, 6), r = int(R, 1, 3);
    const rows: [number, number][] = [[1, f + r], [2, f + 2 * r], [4, f + 4 * r]];
    return choiceItem(R, {
      family: 'predict', id: `predict-${n}-fee-${f}-${r}`,
      prompt: `Shipping costs a ${money(f)} flat fee plus ${money(r)} per pound. 4 pounds cost ${money(f + 4 * r)}. Is 8 pounds ${money(2 * (f + 4 * r))}?`,
      board: `8\\text{ pounds} \\to ${2 * (f + 4 * r)}\\,?`,
      opts: [
        { t: `No: 8 pounds cost ${money(f + 8 * r)}; the fee is paid once`, ok: true, say: `Right: ${money(f)} + 8 × ${money(r)} = ${money(f + 8 * r)}. Doubling would pay the fee twice.` },
        { t: 'Yes: double the pounds, double the cost', ok: false, mc: MC.scalesNon, say: `That only works without the fee. ${money(f)} + 8 × ${money(r)} = ${money(f + 8 * r)}.` },
        { t: 'Yes: the table goes up by the same amount each pound', ok: false, mc: MC.scalesNon, say: `Even steps are not enough: the fee makes 0 pounds cost ${money(f)}. Not proportional.` },
      ],
      solution: [`Not proportional: ${money(f)} for 0 pounds.`, `${money(f)} + 8 × ${money(r)} = ${S(money(f + 8 * r))}.`],
      pic: pic1({ heads: [['pounds', ''], cost], rows, quot: ['dollars', 'per pound'] }, ['table'], ['quot'], undefined, { t: [{ hotQ: [1, 2] }] }),
    });
  }
  const k = int(R, 2, 9);
  const rows: [number, number][] = [[2, 2 * k], [4, 4 * k], [6, 6 * k]];
  return choiceItem(R, {
    family: 'predict', id: `predict-${n}-alone-${k}`,
    prompt: `A table with no story: 2 → ${2 * k}, 4 → ${4 * k}, 6 → ${6 * k}. Must the row for 10 be ${10 * k}?`,
    board: `10 \\to ${10 * k}\\,?`,
    opts: [
      { t: 'Not for sure: the rows fit, but only a rule from the situation can promise it', ok: true, say: `Right: ${k} in every row is consistent with proportional, but data alone can't promise row 10.` },
      { t: 'Yes: three rows fit, so every row fits', ok: false, mc: MC.examples, say: 'Examples that fit are not a proof. Without the situation, nothing says row 10 follows the same rule.' },
      { t: 'No: 10 is not in the table', ok: false, say: `It could well be ${10 * k}: the rows are consistent with that. But only a rule from the situation can promise it.` },
    ],
    solution: [`Every row gives ${k}: consistent with proportional.`, `${S('Prediction needs a rule')} from the situation, not just rows that fit.`],
    pic: pic1({ heads: [['x', ''], ['y', '']], rows, quot: ['y ÷ x', ''] }, ['table'], ['quot']),
  });
};

// 18 rational entries: money with cents, fractions and decimals
const PRICES = [0.75, 1.25, 1.5, 2.25, 2.5, 3.5, 1.2, 0.6, 2.4, 4.5, 1.75, 0.8];
const moneyRow = (R: () => number, n: number): RTItem => {
  const v = pick(R, ['times', 'times', 'divide', 'tenths'] as const);
  if (v === 'tenths') {
    const s = pick(R, [2.5, 1.5, 3.5, 0.4, 1.2]), h = int(R, 2, 9), ans = r2(s * h);
    const lap = s < 1;
    const T: TableSpec = { heads: lap ? [['laps', ''], ['miles', '']] : [['hours', ''], ['miles', '']], rows: [[1, s], [h, ans]], ops: [{ kind: 'mul', from: 0, to: 1, f: h }], hide: [[1, 1]], showAll: true };
    return numItem({
      family: 'moneyRow', id: `moneyRow-${n}-tenths-${s}-${h}`,
      prompt: lap ? `One lap of the track is ${B(`${dec(s)} mile`)}. How far are ${A(`${h} laps`)}?` : `A walker keeps a steady ${B(`${dec(s)} miles per hour`)}. How far does she walk in ${A(`${h} hours`)}?`,
      board: `1 : ${dec(s)} | \\to\\; ${h} : \\;?`, unit: 'miles', answer: ans,
      ok: `Yes: ${h} × ${dec(s)} = ${dec(ans)} miles.`,
      wrong: [[ans * 10, MC.decScale, `The decimal point slipped: ${h} × ${dec(s)} is about ${Math.round(ans)}, not ${dec(ans * 10)}.`], [ans / 10, MC.decScale, `The decimal point slipped: ${h} × ${dec(s)} is about ${Math.round(ans)}, not ${dec(ans / 10)}.`], [Math.round(s) * h, MC.wholeRate, `${dec(s)} is not ${Math.round(s)}: keep the exact rate. ${h} × ${dec(s)} = ${dec(ans)}.`]],
      other: `Multiply both columns by ${h}: ${h} × ${dec(s)}.`,
      solution: [`×${h} on both sides of 1 : ${dec(s)}.`, `${h} × ${dec(s)} = ${S(dec(ans))} miles.`],
      pic: pic1(T, ['table'], ['op0', 'fill']), hero: `${h} \\times ${dec(s)} = ${dec(ans)}`,
    });
  }
  const u = pick(R, PRICES), x = int(R, 2, 10), tot = r2(u * x);
  const it = pick(R, [{ one: 'pound of apples', many: 'pounds of apples', A: ['pounds', ''] as const, per: 'pound' }, { one: 'notebook', many: 'notebooks', A: ['notebooks', ''] as const, per: 'notebook' }, { one: 'bottle of juice', many: 'bottles of juice', A: ['bottles', ''] as const, per: 'bottle' }]);
  if (v === 'divide') {
    const T: TableSpec = { heads: [it.A, cost], rows: [[x, tot], [1, u]], fmt: ['n', '$'], ops: [{ kind: 'div', from: 0, to: 1, f: x }], hide: [[1, 1]], showAll: true };
    return numItem({
      family: 'moneyRow', id: `moneyRow-${n}-div-${u}-${x}`,
      prompt: `${A(pl(x, it.one, it.many))} cost ${B(cents(tot))}. What is the price per ${it.per}?`,
      board: `${x} : ${tot.toFixed(2)} | \\to\\; 1 : \\;?`, unit: `dollars per ${it.per}`, answer: u,
      ok: `Yes: ${cents(tot)} ÷ ${x} = ${cents(u)} per ${it.per}.`,
      wrong: [[u * 10, MC.decScale, `The decimal point slipped: ${cents(tot)} ÷ ${x} is less than ${money(Math.ceil(tot / x))}.`], [r2(x / tot), MC.reversed, `That is ${x} ÷ ${tot.toFixed(2)}: ${it.per}s per dollar. Divide the dollars by ${x}.`]],
      other: `Divide both columns by ${x}: ${cents(tot)} ÷ ${x}.`,
      solution: [`÷${x} on both sides: 1 ${it.per}.`, `${cents(tot)} ÷ ${x} = ${S(cents(u))}.`],
      pic: pic1(T, ['table'], ['op0', 'fill']), hero: `${tot.toFixed(2)} \\div ${x} = ${u.toFixed(2)}`,
    });
  }
  const T: TableSpec = { heads: [it.A, cost], rows: [[1, u], [x, tot]], fmt: ['n', '$'], ops: [{ kind: 'mul', from: 0, to: 1, f: x }], hide: [[1, 1]], showAll: true };
  return numItem({
    family: 'moneyRow', id: `moneyRow-${n}-times-${u}-${x}`,
    prompt: `One ${it.one} costs ${B(cents(u))}. What do ${A(pl(x, it.one, it.many))} cost?`,
    board: `1 : ${u.toFixed(2)} | \\to\\; ${x} : \\;?`, unit: 'dollars', answer: tot,
    ok: `Yes: ${x} × ${cents(u)} = ${cents(tot)}.`,
    wrong: [[tot * 10, MC.decScale, `The decimal point slipped: ${x} × ${cents(u)} is about ${money(Math.round(tot))}.`], [tot / 10, MC.decScale, `The decimal point slipped: ${x} × ${cents(u)} is about ${money(Math.round(tot))}.`], [Math.round(u) * x, MC.wholeRate, `${cents(u)} is not ${money(Math.round(u))}: keep the cents. ${x} × ${cents(u)} = ${cents(tot)}.`]],
    other: `Multiply both columns by ${x}: ${x} × ${cents(u)}.`,
    solution: [`×${x} on both sides of 1 : ${cents(u)}.`, `${x} × ${cents(u)} = ${S(cents(tot))}.`],
    pic: pic1(T, ['table'], ['op0', 'fill']), hero: `${x} \\times ${u.toFixed(2)} = ${tot.toFixed(2)}`,
  });
};
const fracRate = (R: () => number, n: number): RTItem => {
  if (R() < 0.4) {
    // a whole-number pair, a fractional unit rate: L lawns in H hours -> hours per lawn H/L
    let L = pick(R, [2, 4, 5]), H = int(R, L + 1, 4 * L - 1);
    while (gcd(H, L) !== 1) H++;
    if (H % L === 0) H++;
    const rev = R() < 0.5;
    const [p, q] = rev ? [L, H] : [H, L];
    const rnd = Math.round(p / q);
    const qv = H / L;
    const T: TableSpec = { heads: [['lawns', ''], ['hours', '']], rows: [[L, H], [1, qv]], fmt: ['n', L === 5 ? 'n' : 'h'], ops: [{ kind: 'div', from: 0, to: 1, f: L }], hide: [[1, 1]], showAll: true };
    return fracItem({
      family: 'fracRate', id: `fracRate-${n}-lawns-${L}-${H}-${rev}`,
      prompt: `Jen mows ${A(`${L} lawns`)} in ${B(`${H} hours`)}, at a steady rate. ${rev ? 'How many lawns per hour?' : 'How many hours per lawn?'}`,
      board: `${L}\\text{ lawns} : ${H}\\text{ h}`, unit: rev ? 'lawn per hour' : 'hours per lawn', answer: [p / gcd(p, q), q / gcd(p, q)],
      ok: `Yes: ${p} ÷ ${q} = ${mixedHtml(p, q)} ${rev ? 'lawn per hour' : 'hours per lawn'}.`,
      wrong: [[q, p, MC.reversed, `That is ${rev ? 'hours per lawn' : 'lawns per hour'}. For ${rev ? 'lawns per hour divide the lawns by the hours' : 'hours per lawn divide the hours by the lawns'}: ${p} ÷ ${q}.`], ...(rnd > 0 && rnd * q !== p ? [[rnd, 1, MC.wholeRate, `Keep it exact: ${p} ÷ ${q} = ${fr(p, q)}, not ${rnd}.`] as const] : [])],
      other: `A rate is one quantity divided by the other: ${p} ÷ ${q}, written as a fraction.`,
      solution: [`${rev ? 'Lawns per hour' : 'Hours per lawn'} = ${p} ÷ ${q}.`, `${S(fr(p, q))}${p > q ? ` = ${mixedHtml(p, q)}` : ''}: a unit rate can be a fraction.`],
      pic: rev ? undefined : pic1(T, ['table'], ['op0', 'fill']), hero: `${p} \\div ${q} = \\tfrac{${p}}{${q}}`,
    });
  }
  const base = pick(R, [
    { p: 1, q: 2, A: ['batches', ''] as const, B: ['sugar', '(cups)'] as const, say: (f: string) => `A recipe uses ${B(`${f} cup of sugar`)} per batch.`, ask: (x: number) => `How much sugar for ${A(`${x} batches`)}?`, unit: 'cups' },
    { p: 3, q: 4, A: ['laps', ''] as const, B: ['miles', ''] as const, say: (f: string) => `One lap of the track is ${B(`${f} mile`)}.`, ask: (x: number) => `How far are ${A(`${x} laps`)}?`, unit: 'miles' },
    { p: 1, q: 4, A: ['pizzas', ''] as const, B: ['cheese', '(lb)'] as const, say: (f: string) => `A pizza uses ${B(`${f} pound of cheese`)}.`, ask: (x: number) => `How much cheese for ${A(`${x} pizzas`)}?`, unit: 'pounds' },
    { p: 3, q: 2, A: ['loaves', ''] as const, B: ['flour', '(cups)'] as const, say: (f: string) => `A loaf of bread uses ${B(`${f} cups of flour`)}.`, ask: (x: number) => `How much flour for ${A(`${x} loaves`)}?`, unit: 'cups' },
  ]);
  const x = int(R, 2, 10);
  const P = base.p * x, g = gcd(P, base.q), ap = P / g, aq = base.q / g;
  const rnd = Math.round(P / base.q);
  const T: TableSpec = { heads: [base.A, base.B], rows: [[1, base.p / base.q], [x, P / base.q]], fmt: ['n', 'h'], ops: [{ kind: 'mul', from: 0, to: 1, f: x }], hide: [[1, 1]], showAll: true };
  return fracItem({
    family: 'fracRate', id: `fracRate-${n}-${base.unit}-${base.p}-${x}`,
    prompt: `${base.say(mixedHtml(base.p, base.q))} ${base.ask(x)}`,
    board: `1 : \\tfrac{${base.p}}{${base.q}} \\;\\to\\; ${x} : \\;?`, unit: base.unit, answer: [ap, aq],
    ok: `Yes: ${x} × ${fr(base.p, base.q)} = ${mixedHtml(P, base.q)}.`,
    wrong: [...(rnd * base.q !== P ? [[rnd, 1, MC.wholeRate, `Keep it exact: ${x} × ${fr(base.p, base.q)} = ${fr(P, base.q)}, not ${rnd}.`] as const] : []), [base.p * x, base.q * x, undefined, `That multiplies the top and the bottom: still ${fr(base.p, base.q)}. Multiply only the top: ${fr(P, base.q)}.`]],
    other: `Multiply both columns by ${x}: ${x} × ${fr(base.p, base.q)} = ${fr(P, base.q)}.`,
    solution: [`×${x} on both sides of 1 : ${fr(base.p, base.q)}.`, `${x} × ${fr(base.p, base.q)} = ${fr(P, base.q)} = ${S(mixedHtml(P, base.q))}.`],
    pic: pic1(T, ['table'], ['op0', 'fill']), hero: `${x} \\times \\tfrac{${base.p}}{${base.q}} = ${mixedTex(P, base.q)}`,
  });
};
const moneyTest = (R: () => number, n: number): RTItem => {
  const u = pick(R, PRICES.filter(x => x >= 1));
  const kind = pick(R, ['prop', 'off', 'fee'] as const);
  const xs = [2, 3, 5];
  const off = pick(R, [0.5, -0.5, 0.25]);
  const fee = pick(R, [1, 2]);
  const rows: [number, number][] = xs.map((x, i) => [x, r2(kind === 'fee' ? fee + u * x : u * x + (kind === 'off' && i === 2 ? off : 0))]);
  const q = (i: number) => cents(rows[i]![1] / rows[i]![0]);
  const opts: Opt[] = kind === 'prop' ? [
    { t: `Proportional: ${cents(u)} per pound in every row`, ok: true, say: `Yes: every row divides to ${cents(u)} a pound.` },
    { t: 'Not proportional: the prices are not whole dollars', ok: false, mc: MC.wholeRate, say: `Cents are fine: ${cents(u)} per pound in every row is a constant rate.` },
    { t: 'Not proportional: the price goes up by different amounts', ok: false, say: 'The pounds go up by different amounts too. Divide in every row: always the same.' },
  ] : [
    { t: kind === 'off' ? `Not proportional: 5 pounds gives ${q(2)} per pound, not ${cents(u)}` : `Not proportional: ${q(0)} per pound, then ${q(1)}`, ok: true, say: 'Right: one row with another price per pound breaks it.' },
    { t: `Proportional: the first two rows give ${kind === 'off' ? cents(u) : q(0)} per pound`, ok: false, mc: MC.someCases, say: kind === 'off' ? `Test the last row too: ${cents(rows[2]![1])} ÷ 5 = ${q(2)}.` : `Test every row: ${q(0)}, then ${q(1)}: different.` },
    { t: 'Proportional: more pounds cost more', ok: false, mc: MC.scalesNon, say: 'More costs more in many tables. Proportional needs the same price per pound in every row.' },
  ];
  return choiceItem(R, {
    family: 'moneyTest', id: `moneyTest-${n}-${kind}-${u}-${off}-${fee}`,
    prompt: `A price list for cherries: ${rows.map(r => `${r[0]} lb ${cents(r[1])}`).join(', ')}. Is the price proportional to the weight?`,
    board: `\\text{dollars} \\div \\text{pounds}`,
    opts,
    solution: [`Price per pound in each row: ${rows.map((_, i) => q(i)).join(', ')}.`, kind === 'prop' ? `Always ${cents(u)}: ${S('proportional')}.` : `Not the same: ${S('not proportional')}.`],
    pic: pic1({ heads: [['pounds', ''], cost], rows, fmt: ['n', '$'], quot: ['dollars', 'per pound'] }, ['table'], ['quot'], undefined, { t: [{ hotQ: badRows(rows) }] }),
  });
};

// 19 graph-through-origin (enrichment): points on a straight line through (0, 0)
const graphLine = (R: () => number, n: number): RTItem => {
  const kind = pick(R, ['prop', 'fixed', 'const'] as const);
  const k = int(R, 2, 4), s = int(R, 2, 5), r = int(R, 1, 3), cc = int(R, 3, 9);
  const xs = distinctSorted(R, int(R, 3, 4), 1, 5);
  const rows = xs.map(x => [x, kind === 'prop' ? k * x : kind === 'fixed' ? s + r * x : cc] as [number, number]);
  const opts: Opt[] = kind === 'prop' ? [
    { t: 'Yes: the points are on a straight line through (0, 0)', ok: true, say: 'Right: straight AND through the origin. The table test agrees: the same quotient in every row.' },
    { t: 'No: the line is too steep', ok: false, say: 'Steepness only shows the rate. A proportional graph is a straight line through (0, 0), at any steepness.' },
    { t: 'No: there is no point at (0, 0) in the table', ok: false, say: 'The line still passes through (0, 0): 0 goes with 0. Check the quotients: all the same.' },
  ] : kind === 'fixed' ? [
    { t: 'No: the line is straight but misses (0, 0)', ok: true, say: `Right: at 0 it is already ${s}. A start amount, not proportional.` },
    { t: 'Yes: the points are on a straight line', ok: false, mc: MC.scalesNon, say: `Straight is not enough: the line must also go through (0, 0). This one starts at ${s}.` },
    { t: 'Yes: two of the points fit one line from (0, 0)', ok: false, mc: MC.examples, say: 'Two points always fit some line. All points must be on ONE straight line through (0, 0).' },
  ] : [
    { t: 'No: the line is flat, so y ÷ x changes', ok: true, say: `Right: y stays ${cc}. A flat line does not go through (0, 0).` },
    { t: 'Yes: the points are on a straight line', ok: false, mc: MC.scalesNon, say: 'A straight line must also pass through (0, 0). This flat line stays at ' + cc + '.' },
    { t: 'Yes: every point is at the same height', ok: false, mc: MC.sameQty, say: 'The same height means y never changes. Proportional means y ÷ x never changes: here it does.' },
  ];
  const yMax = 20;
  return choiceItem(R, {
    family: 'graphLine', id: `graphLine-${n}-${kind}-${rows.flat().join('.')}`,
    prompt: 'Plot the pairs and look at the line through them. Is y proportional to x?',
    board: `\\text{through } (0, 0)\\,?`,
    opts,
    solution: [kind === 'prop' ? `The line goes through (0, 0) and every point: y = ${k}x.` : kind === 'fixed' ? `The line meets the y-axis at ${s}, not 0.` : `A flat line at ${cc}: it never reaches (0, 0).`, kind === 'prop' ? `${S('Proportional')}: straight and through the origin.` : `${S('Not proportional')}: the table test agrees (the quotients change).`],
    pic: { p: { tables: [{ heads: [['x', ''], ['y', '']], rows }], graph: { pts: rows, xMax: 6, yMax, xGrid: 1, yGrid: 4, xName: 'x', yName: 'y' } }, at: ['table', 'axes', 'points'], solve: ['line', 'origin'], solved: { origin: kind === 'prop' ? 'link' : 'wrong' } },
  });
};

// 20 measurement-tolerance (extension): close enough to the rule?
const tolerance = (R: () => number, n: number): RTItem => {
  const r = int(R, 2, 5), tol = pick(R, [0.2, 0.3]);
  const ms = [1, 2, 3, 4].slice(0, int(R, 3, 4));
  const within = R() < 0.5;
  const gaps = ms.map(() => pick(R, tol === 0.2 ? [0, 0.1, 0.2] : [0.1, 0.2, 0.3]));
  const big = int(R, 0, ms.length - 1);
  if (!within) gaps[big] = r2(tol + pick(R, [0.1, 0.2, 0.3]));
  const signs = ms.map(() => (R() < 0.5 ? 1 : -1));
  const rows = ms.map((m, i) => [m, r2(r * m + signs[i]! * gaps[i]!)] as [number, number]);
  const gapText = ms.map((m, i) => `${m} kg: ${dec(gaps[i]!)} cm ${gaps[i] ? (signs[i]! > 0 ? 'above' : 'below') : ''}`.trim()).join('; ');
  const maxGap = Math.max(...gaps);
  const opts: Opt[] = within ? [
    { t: `Yes: every gap is at most ${dec(tol)} cm`, ok: true, say: `Right: the largest gap is ${dec(maxGap)} cm, within the ${dec(tol)} cm the task allows.` },
    { t: `No: the stretches are not exactly ${ms.map(m => r * m).join(', ')}`, ok: false, mc: MC.allOrNothing, say: `Measurements are never exact. The task allows ${dec(tol)} cm, and every gap is within it.` },
    { t: `No: a gap of ${dec(maxGap)} cm is too big`, ok: false, say: `${dec(maxGap)} cm is not more than ${dec(tol)} cm: "up to ${dec(tol)}" includes ${dec(tol)}.` },
  ] : [
    { t: `No: one gap, ${dec(gaps[big]!)} cm, is more than ${dec(tol)} cm`, ok: true, say: `Right: ${dec(gaps[big]!)} cm is outside the ${dec(tol)} cm the task allows. That measurement does not fit the rule.` },
    { t: 'Yes: the gaps are just measurement error', ok: false, mc: MC.discrepancy, say: `Error is allowed only up to ${dec(tol)} cm. ${dec(gaps[big]!)} cm is more than that.` },
    { t: 'Yes: most gaps are small', ok: false, mc: MC.discrepancy, say: `Every gap must be within ${dec(tol)} cm. One is ${dec(gaps[big]!)} cm.` },
  ];
  return choiceItem(R, {
    family: 'tolerance', id: `tolerance-${n}-${r}-${tol}-${rows.flat().join('.')}`,
    prompt: `The rule: a spring stretches ${B(`${r} cm`)} for every ${A('1 kg')}. The masses are exact; a measured stretch may be off by up to ${dec(tol)} cm. The gaps from the rule: ${gapText}. Do the measurements agree with the rule?`,
    board: `\\text{gap} \\le ${dec(tol)}\\text{ cm}\\,?`,
    opts,
    solution: [`Compare each gap with ${dec(tol)} cm: ${gaps.map(g => dec(g)).join(', ')}.`, within ? `All within: ${S('they agree')} with the rule.` : `${dec(gaps[big]!)} cm is too big: ${S('they do not all agree')}.`],
    pic: pic1({ heads: [['mass', '(kg)'], ['stretch', '(cm)']], rows }, ['table'], [], undefined, { t: [{ hot: within ? [] : [big] }] }),
  });
};

export const GENS: Record<FamilyId, (R: () => number, n: number, subgoal?: string) => RTItem> = {
  pairUp, timesAsMany, whatStays, ratioOrDiff, situation, doubleIt, pairTable, labelTable, buildUp, unitRow, rateUnit, midRow, canWeFind,
  addRows, feeRows, subRows, route, compare, testTable, zeroRow, predict, moneyRow, fracRate, moneyTest, graphLine, tolerance,
};
