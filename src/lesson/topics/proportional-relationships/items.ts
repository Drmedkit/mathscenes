// items.ts: practice families for "proportional relationships" (grade 7, 7.RP.A.2). Each family is one deep structure;
// a generator receives the sub-goal id and makes that sub-goal's cases (topic JSON `cases`). Every wrong answer the
// classifier recognises carries its misconception id (math-curriculum-essentials/misconceptions.json).
// Pure: no DOM, no canvas. Values are exact (rateMaths: hundredths and reduced quotients). PROBES records, per item,
// typical wrong responses and the id they must get (tests).
import { type Gen, type Item, type Response, type Verdict, A, B, S, int, pick, shuffle } from '../../runtime/item';
import { type RateGraphParams } from './RateGraph';
import { type Row, fmt, hundredths, money, niceAxis, quotient, qDecimal, qText, tableTest, times, timesExact } from './rateMaths';

export type FamilyId = 'tableTest' | 'rowRate' | 'zeroRow' | 'situation' | 'nameK' | 'writeEq' | 'plotPoint' | 'readScale' | 'domain'
  | 'graphTest' | 'interpret' | 'kGraph' | 'translate' | 'counterRatio' | 'fixedFee' | 'changingRate' | 'buildCounter' | 'applyModel' | 'evidence';
export const FAMILY_NAMES: Record<FamilyId, string> = {
  tableTest: 'Is the table proportional?',
  rowRate: 'The rate in one row',
  zeroRow: 'The row with 0',
  situation: 'Is the situation proportional?',
  nameK: 'Find k',
  writeEq: 'Write y = kx',
  plotPoint: 'Points on the graph',
  readScale: 'Read the scale',
  domain: 'Ray, segment or points?',
  graphTest: 'Is the graph proportional?',
  interpret: 'What a point means',
  kGraph: 'k from the graph',
  translate: 'Same k in every form',
  counterRatio: 'One row breaks it',
  fixedFee: 'A starting amount',
  changingRate: 'A changing rate',
  buildCounter: 'Build a counterexample',
  applyModel: 'Use the rate',
  evidence: 'Proven, refuted, or only consistent?',
};

/** what the page draws for an item: the graph (left), the table (board), and what plays after a miss */
export interface RatePicture {
  graph?: RateGraphParams;
  /** graph steps visible when the item appears, and the ones that play in the worked solution */
  show: string[]; solve: string[];
  table?: { cols: [string, string, string]; rows: Row[]; money: [boolean, boolean]; showQ: boolean };
  /** TeX lines written on the board in the worked solution */
  lines?: string[];
  /** point ids that break the pattern: red in the worked solution only (never before the kid answers) */
  breaks?: string[];
}

export const PROBES = new WeakMap<Item, { r: Response; mc: string }[]>();
const probe = (it: Item, r: Response, mc: string) => { const l = PROBES.get(it) ?? []; l.push({ r, mc }); PROBES.set(it, l); };
const num = (v: number): Response => ({ kind: 'num', v });

// ---------- contexts (US units; dollars where a price is the point) ----------
interface Skin {
  id: string;
  x: string; x1: string; y: string; y1: string;
  /** table / graph headers: input, output, quotient */ head: [string, string, string];
  /** "dollars per pound" */ per: string;
  money: boolean; discrete: boolean;
  /** context letters: input, output */ L: [string, string];
  ks: number[]; xs: number[];
  /** a row as a sentence: "3 pounds of trail mix cost $7.50" */ story(x: number, y: number): string;
  /** the rate in words: "$2.50 per pound" */ rate(k: number): string;
  /** what the thing is (for prompts) */ what: string;
}
const $ = (v: number) => `$${money(v)}`;
const pl = (v: number, one: string, many: string) => `${fmt(v)} ${hundredths(v) === 100 ? one : many}`;
const SKINS: Skin[] = [
  { id: 'trail', x: 'pounds', x1: 'pound', y: 'dollars', y1: 'dollar', head: ['pounds', 'dollars', '$ per lb'], per: 'dollars per pound', money: true, discrete: false, L: ['p', 'c'],
    ks: [2.5, 3, 4, 4.5, 6, 1.5, 3.5, 5, 7.5], xs: [1, 2, 3, 4, 5, 6, 8],
    story: (x, y) => `${pl(x, 'pound', 'pounds')} of trail mix ${hundredths(x) === 100 ? 'costs' : 'cost'} ${$(y)}`, rate: k => `${$(k)} per pound`, what: 'trail mix sold by the pound' },
  { id: 'gas', x: 'gallons', x1: 'gallon', y: 'dollars', y1: 'dollar', head: ['gallons', 'dollars', '$ per gal'], per: 'dollars per gallon', money: true, discrete: false, L: ['g', 'c'],
    ks: [3.5, 3.2, 4, 3.6, 2.8, 3, 3.4], xs: [2, 3, 4, 5, 6, 8, 10],
    story: (x, y) => `${pl(x, 'gallon', 'gallons')} of gas ${hundredths(x) === 100 ? 'costs' : 'cost'} ${$(y)}`, rate: k => `${$(k)} per gallon`, what: 'gas from one pump' },
  { id: 'drive', x: 'hours', x1: 'hour', y: 'miles', y1: 'mile', head: ['hours', 'miles', 'mi per hr'], per: 'miles per hour', money: false, discrete: false, L: ['t', 'd'],
    ks: [45, 50, 55, 60, 65, 40], xs: [1, 2, 3, 4, 5, 6],
    story: (x, y) => `in ${pl(x, 'hour', 'hours')} the car goes ${pl(y, 'mile', 'miles')}`, rate: k => `${fmt(k)} miles per hour`, what: 'a car driving at a steady speed' },
  { id: 'printer', x: 'minutes', x1: 'minute', y: 'pages', y1: 'page', head: ['minutes', 'pages', 'per min'], per: 'pages per minute', money: false, discrete: false, L: ['m', 'n'],
    ks: [12, 15, 20, 25, 8, 30], xs: [1, 2, 3, 4, 5, 6, 8],
    story: (x, y) => `in ${pl(x, 'minute', 'minutes')} the printer prints ${pl(y, 'page', 'pages')}`, rate: k => `${fmt(k)} pages per minute`, what: 'a printer' },
  { id: 'hose', x: 'minutes', x1: 'minute', y: 'gallons', y1: 'gallon', head: ['minutes', 'gallons', 'per min'], per: 'gallons per minute', money: false, discrete: false, L: ['t', 'w'],
    ks: [4, 5, 6, 8, 2.5, 7.5], xs: [2, 3, 4, 5, 6, 8, 10],
    story: (x, y) => `in ${pl(x, 'minute', 'minutes')} the hose fills ${pl(y, 'gallon', 'gallons')}`, rate: k => `${fmt(k)} gallons per minute`, what: 'a hose filling a pool' },
  { id: 'tickets', x: 'tickets', x1: 'ticket', y: 'dollars', y1: 'dollar', head: ['tickets', 'dollars', '$ each'], per: 'dollars per ticket', money: true, discrete: true, L: ['n', 'c'],
    ks: [8, 12, 15, 7.5, 9, 6.5], xs: [1, 2, 3, 4, 5, 6, 8],
    story: (x, y) => `${pl(x, 'ticket', 'tickets')} ${hundredths(x) === 100 ? 'costs' : 'cost'} ${$(y)}`, rate: k => `${$(k)} per ticket`, what: 'concert tickets' },
  { id: 'recipe', x: 'cups of flour', x1: 'cup of flour', y: 'cups of sugar', y1: 'cup of sugar', head: ['flour', 'sugar', 'per cup'], per: 'cups of sugar per cup of flour', money: false, discrete: false, L: ['f', 's'],
    ks: [0.5, 0.75, 1.5, 0.25, 1.25], xs: [2, 4, 6, 8, 12],
    story: (x, y) => `${pl(x, 'cup', 'cups')} of flour ${hundredths(x) === 100 ? 'goes' : 'go'} with ${pl(y, 'cup', 'cups')} of sugar`, rate: k => `${fmt(k)} cups of sugar per cup of flour`, what: 'a recipe that scales' },
];
const skinBy = (id: string) => SKINS.find(s => s.id === id)!;
const yAmt = (s: Skin, y: number) => (s.money ? $(y) : pl(y, s.y1, s.y));
const xAmt = (s: Skin, x: number) => pl(x, s.x1, s.x);
const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
const NAMES = ['Ana', 'Leo', 'Maya', 'Sam', 'Kim', 'Ravi', 'Jo', 'Eli', 'Dee', 'Kai', 'Riley', 'Noor'];

// ---------- checks ----------
function numCheck(r: Response, want: number, okSay: string, wrongs: { v: number; tol?: number; mc?: string; say: string }[], fallback: string): Verdict {
  if (r.kind !== 'num') return { ok: false, say: 'Type a number.' };
  if (!Number.isFinite(r.v)) return { ok: false, say: 'Type a number, like 2.5.' };
  if (Math.abs(r.v - want) < 0.0005) return { ok: true, say: okSay };
  for (const w of wrongs) if (Math.abs(r.v - w.v) < (w.tol ?? 0.0005) && Math.abs(w.v - want) > 0.0005) return { ok: false, mc: w.mc, say: w.say };
  return { ok: false, say: fallback };
}
interface Opt { t: string; ok?: boolean; say: string; mc?: string }
function options(R: () => number, opts: Opt[]): { choices: string[]; right: number; says: { say: string; mc?: string }[] } {
  const o = shuffle(R, opts.slice());
  return { choices: o.map(x => x.t), right: o.findIndex(x => x.ok), says: o.map(x => ({ say: x.say, mc: x.mc })) };
}
function choiceItem(base: Omit<Item, 'input' | 'choices' | 'answer' | 'check'>, R: () => number, opts: Opt[]): Item {
  const o = options(R, opts);
  const it: Item = {
    ...base, input: 'choice', choices: o.choices, answer: { kind: 'choice', i: o.right },
    check: r => {
      if (r.kind !== 'choice' || !o.says[r.i]) return { ok: false, say: 'Pick one answer.' };
      return { ok: r.i === o.right, mc: r.i === o.right ? undefined : o.says[r.i]!.mc, say: o.says[r.i]!.say };
    },
  };
  o.says.forEach((s, i) => { if (i !== o.right && s.mc) probe(it, { kind: 'choice', i }, s.mc); });
  return it;
}

// ---------- shared builders ----------
/** k and inputs for a skin so every output has at most 2 decimals */
function kxs(R: () => number, s: Skin, n: number, o: { k?: number; noOne?: boolean } = {}): { k: number; xs: number[] } {
  for (let t = 0; t < 200; t++) {
    const k = o.k ?? pick(R, s.ks);
    const pool = s.xs.filter(x => !(o.noOne && x === 1) && timesExact(k, x));
    if (pool.length < n) continue;
    const xs = shuffle(R, pool.slice()).slice(0, n);
    return { k, xs };
  }
  return { k: s.ks[0]!, xs: s.xs.slice(0, n) };
}
function axes(s: Skin, rows: Row[], extra: { x?: number; y?: number } = {}): Pick<RateGraphParams, 'xMax' | 'yMax' | 'xStep' | 'yStep' | 'xName' | 'yName'> {
  const mx = Math.max(extra.x ?? 0, ...rows.map(r => r.x)), my = Math.max(extra.y ?? 0, ...rows.map(r => r.y));
  const xm = Math.ceil(mx * 1.12 + 0.01);
  const ax = xm <= 12 ? { max: Math.max(4, xm), step: 1 } : niceAxis(mx * 1.12 + 0.01, 10), ay = niceAxis(my * 1.12 + 0.01, 10);
  return { xMax: ax.max, yMax: ay.max, xStep: ax.step, yStep: ay.step, xName: s.head[0], yName: s.head[1] };
}
const ptsOf = (rows: Row[], label = true) => rows.map((r, i) => ({ x: r.x, y: r.y, id: 'r' + i, label }));
const rowsHtml = (s: Skin, rows: Row[]) => rows.map(r => `${xAmt(s, r.x)} → ${yAmt(s, r.y)}`).join(', ');
const qLine = (s: Skin, r: Row) => { const q = quotient(r.x, r.y); return `${s.money ? money(r.y) : fmt(r.y)} ÷ ${fmt(r.x)} = ${q ? qText(q) : 'no value'}`; };
const tex$ = (s: Skin, v: number) => (s.money ? `\\$${money(v)}` : fmt(v));

// =====================================================================================================
// 1. the table test [table-test, evidence-vs-guarantee]
const tableTest_: Gen = (R, n, sg) => {
  const s = pick(R, SKINS.filter(x => x.id !== 'drive'));
  const kinds = ['prop', 'prop', 'add', 'start', 'late', 'doubling', 'nonlin'] as const;
  const kind = pick(R, kinds);
  let rows: Row[] = [];
  const nr = int(R, 3, 4);
  if (kind === 'prop') { const { k, xs } = kxs(R, s, nr, { noOne: R() < 0.6 }); rows = xs.map(x => ({ x, y: times(k, x) })); }
  else if (kind === 'add') { const c = int(R, 2, 6), st = pick(R, [1, 2]); rows = [1, 2, 3, 4].slice(0, nr).map(i => ({ x: i * st, y: i * st + c })); }
  else if (kind === 'start') { const k = pick(R, [2, 3, 4, 5]), b = int(R, 1, 6); rows = [2, 4, 6, 8].slice(0, nr).map(x => ({ x, y: k * x + b })); }
  else if (kind === 'late') { const { k, xs } = kxs(R, s, nr); const sorted = xs.sort((a, b) => a - b); rows = sorted.map((x, i) => ({ x, y: i < nr - 1 ? times(k, x) : times(k, x) + pick(R, [-2, -1, 1, 2]) })); if (rows[nr - 1]!.y <= 0) rows[nr - 1]!.y = times(k, rows[nr - 1]!.x) + 1; }
  else if (kind === 'doubling') { const a = int(R, 2, 5); rows = [1, 2, 3, 4].slice(0, nr).map(x => ({ x, y: a * 2 ** x })); }
  else { const a = int(R, 1, 3); rows = [1, 2, 3, 4].slice(0, nr).map(x => ({ x, y: a * x * x })); }
  const T = tableTest(rows);
  const k = T.k!;
  const br = T.breaks[0] ?? 1;
  const qB = quotient(rows[br]!.x, rows[br]!.y)!, q0 = quotient(rows[0]!.x, rows[0]!.y)!;
  const sample = sg === 'evidence-vs-guarantee';
  const who = pick(R, NAMES);
  const prompt = `${sample ? `${who} wrote down a few prices for ${s.what} (the table)` : `The table is the full price list for ${s.what}`}. Is ${B(s.y)} proportional to ${A(s.x)}?`;
  const opts: Opt[] = [];
  const kTxt = qText(k);
  if (T.proportional) {
    opts.push({ t: sample ? `Consistent with proportional: every row gives ${kTxt} ${s.per}, but only these rows were checked` : `Proportional: every row gives ${kTxt} ${s.per}`, ok: true, say: `Yes. ${s.y} ÷ ${s.x} is ${kTxt} in every row: one multiplier fits them all${sample ? ', at least for the rows that were written down' : ''}.` });
    if (sample) opts.push({ t: `Proven proportional: every row gives ${kTxt} ${s.per}`, mc: 'mc.reasoning-language.examples-as-proof', say: `The rows fit, but they are only a few prices. Nothing says every other amount has the same rate, so the rows are consistent with proportional, not proof.` });
    else opts.push({ t: `Not proportional: each ${s.y1} amount is not the same multiple of the one above it`, mc: 'mc.ratio-rate.tests-proportionality-by-successive-output-ratios', say: `Comparing each row with the row above is not the test. Divide ${s.y} by ${s.x} inside each row: ${kTxt} every time.` });
    const inv = quotient(rows[0]!.y, rows[0]!.x)!;
    opts.push({ t: `Not proportional: row 1 gives ${qText(inv)} and the other rows give ${kTxt}`, mc: 'mc.ratio-rate.mixed-rate-orientation', say: `${qText(inv)} is ${s.x} ÷ ${s.y}, the other order. Divide the same way in every row (${s.y} ÷ ${s.x}): ${kTxt} each time.` });
  } else {
    opts.push({ t: `Not proportional: row ${br + 1} gives ${qText(qB)} ${s.per}, row 1 gives ${qText(q0)}`, ok: true, say: `Right. Two rows with different ${s.per}: no single multiplier fits.` });
    if (kind === 'late') opts.push({ t: `Proportional: the first rows all give ${qText(q0)} ${s.per}`, mc: 'mc.ratio-rate.too-few-checks-for-proportionality', say: `Check every row. Row ${br + 1} gives ${qText(qB)}, so one multiplier does not fit them all.` });
    else if (kind === 'doubling') opts.push({ t: `Proportional: each ${s.y1} amount is double the one before`, mc: 'mc.ratio-rate.tests-proportionality-by-successive-output-ratios', say: `Doubling from row to row is not the test. Divide inside each row: ${qText(q0)}, then ${qText(quotient(rows[1]!.x, rows[1]!.y)!)}. Not the same.` });
    else opts.push({ t: `Proportional: the ${s.y} go up as the ${s.x} go up`, mc: 'mc.ratio-rate.scales-non-proportional', say: `Going up together is not enough. Divide inside each row: ${qText(q0)} and ${qText(qB)} are different.` });
    opts.push({ t: `Proportional: row 1 gives ${qText(q0)} ${s.per}`, mc: 'mc.ratio-rate.too-few-checks-for-proportionality', say: `One row only gives one rate. Check every row: row ${br + 1} gives ${qText(qB)}.` });
  }
  const pic: RatePicture = { graph: { ...axes(s, rows), points: ptsOf(rows, false) }, show: ['axes', ...rows.map((_, i) => 'pt:r' + i)], solve: rows.map((_, i) => 'ray:r' + i), table: { cols: s.head, rows, money: [false, s.money], showQ: false }, breaks: T.breaks.map(i => 'r' + i) };
  return choiceItem({ id: `tt-${n}`, family: 'tableTest', prompt, board: `\\text{${s.head[1]}} \\div \\text{${s.head[0]}}`, picture: pic as unknown as Record<string, unknown>,
    solution: [...rows.map(r => qLine(s, r)), T.proportional ? `Every row: ${kTxt} ${s.per}. One multiplier.` : `The rates are not all the same: not proportional.`] }, R, opts);
};

// 2. the rate in one row [table-test]
const rowRate: Gen = (R, n) => {
  const s = pick(R, SKINS);
  const { k, xs } = kxs(R, s, 1, { noOne: true });
  const x = xs[0]!, y = times(k, x);
  const inv = x / y;
  const it: Item = {
    id: `rr-${n}`, family: 'rowRate', prompt: `${cap(s.story(x, y))}. How many ${B(s.per)} is that?`, board: `${tex$(s, y)} \\div ${fmt(x)} = \\,?`,
    input: 'num', unit: s.per,
    picture: { table: { cols: s.head, rows: [{ x, y }], money: [false, s.money], showQ: false }, show: [], solve: [], lines: [`${tex$(s, y)} \\div ${fmt(x)} = ${fmt(k)}`] } as unknown as Record<string, unknown>,
    solution: [`Same order as the question: ${s.y} ÷ ${s.x}.`, `${s.money ? money(y) : fmt(y)} ÷ ${fmt(x)} = ${fmt(k)} ${s.per}.`],
    answer: num(k),
    check: r => numCheck(r, k, `Yes: ${fmt(k)} ${s.per}.`, [
      { v: inv, tol: 0.006, mc: 'mc.ratio-rate.mixed-rate-orientation', say: `That is ${s.x} per ${s.y1}: ${fmt(x)} ÷ ${s.money ? money(y) : fmt(y)}. The question asks ${s.per}, so divide ${s.y} by ${s.x}.` },
      { v: y, say: `That is the total for ${xAmt(s, x)}. Per ${s.x1}, divide by ${fmt(x)}.` },
    ], `Divide ${s.y} by ${s.x}: ${s.money ? money(y) : fmt(y)} ÷ ${fmt(x)}.`),
  };
  probe(it, num(Math.round(inv * 100) / 100), 'mc.ratio-rate.mixed-rate-orientation');
  return it;
};

// 3. the zero row [zero-input]
const zeroRow: Gen = (R, n) => {
  const s = pick(R, SKINS);
  const { k, xs } = kxs(R, s, 2, { noOne: true });
  const kind = pick(R, ['zz', 'zz', 'fee', 'none'] as const);
  const kt = fmt(k);
  if (kind === 'zz') {
    const rows: Row[] = [{ x: 0, y: 0 }, ...xs.sort((a, b) => a - b).map(x => ({ x, y: times(k, x) }))];
    return choiceItem({ id: `zr-${n}`, family: 'zeroRow', prompt: `The table for ${s.what} has a row with ${A(`0 ${s.x}`)}. The other rows give ${kt} ${s.per}. How do you check the 0 row?`,
      board: `0 \\to 0`, picture: { table: { cols: s.head, rows, money: [false, s.money], showQ: false }, graph: { ...axes(s, rows), points: ptsOf(rows, false) }, show: ['axes', 'pt:r1', 'pt:r2'], solve: ['ray:r1', 'origin'], lines: [`${kt} \\times 0 = 0`] } as unknown as Record<string, unknown>,
      solution: [`0 ÷ 0 has no value: every number times 0 is 0, so the row cannot pick a multiplier.`, `Check it by multiplying: ${kt} × 0 = 0. The row fits.`] }, R, [
      { t: `Multiply: ${kt} × 0 = 0, so the row fits`, ok: true, say: `Yes. A zero row is checked by multiplying: the rate times 0 must be 0, and it is.` },
      { t: `Divide: 0 ÷ 0 = 0, so the rate in that row is 0`, mc: 'mc.ratio-rate.zero-over-zero-as-rate', say: `0 ÷ 0 has no value (every number times 0 is 0). Check the row by multiplying instead: ${kt} × 0 = 0.` },
      { t: `0 ÷ 0 has no value, so the table cannot be proportional`, mc: 'mc.ratio-rate.rejects-proportional-over-zero-point', say: `The row is fine. You can't divide there, so check by multiplying: ${kt} × 0 = 0. It fits.` },
    ]);
  }
  if (kind === 'fee') {
    const b = s.money ? pick(R, [2, 3, 5, 10]) : pick(R, [2, 3, 5]);
    const rows: Row[] = [{ x: 0, y: b }, ...xs.sort((a, c) => a - c).map(x => ({ x, y: times(k, x) }))];
    return choiceItem({ id: `zr-${n}`, family: 'zeroRow', prompt: `In the table, the rows without 0 give ${kt} ${s.per}. Look at the row with ${A(`0 ${s.x}`)}. Is ${B(s.y)} proportional to ${A(s.x)}?`,
      board: `0 \\to ${tex$(s, b)}`, picture: { table: { cols: s.head, rows, money: [false, s.money], showQ: false }, show: [], solve: [], lines: [`${kt} \\times 0 = 0`] } as unknown as Record<string, unknown>,
      solution: [`A proportional relationship gives ${kt} × 0 = 0 at 0 ${s.x}.`, `This row says ${yAmt(s, b)} at 0, so it is not proportional.`] }, R, [
      { t: `Not proportional: ${kt} × 0 = 0, but the 0 row says ${yAmt(s, b)}`, ok: true, say: `Right. At 0 ${s.x} a proportional relationship must give 0.` },
      { t: `Proportional: skip the 0 row, the other rows all give ${kt}`, mc: 'mc.ratio-rate.scales-non-proportional', say: `Every row counts. At 0 the output must be ${kt} × 0 = 0, and this one is ${yAmt(s, b)}.` },
      { t: `Proportional: ${s.money ? money(b) : fmt(b)} ÷ 0 = 0, so that row fits too`, mc: 'mc.mul-div.value-for-division-by-zero', say: `Dividing by 0 gives no number, not 0. Multiply instead: ${kt} × 0 = 0, not ${yAmt(s, b)}.` },
    ]);
  }
  const rows: Row[] = xs.map(x => ({ x, y: times(k, x) }));
  return choiceItem({ id: `zr-${n}`, family: 'zeroRow', prompt: `${cap(s.story(rows[0]!.x, rows[0]!.y))}, and ${s.story(rows[1]!.x, rows[1]!.y)}. If the relationship is proportional, what goes with ${A(`0 ${s.x}`)}?`,
    board: `0\\ \\text{${s.head[0]}} \\to\\ ?`, picture: { graph: { ...axes(s, rows), points: ptsOf(rows, false), lines: [{ id: 'L', k, ends: 'ray' }] }, show: ['axes', 'pt:r0', 'pt:r1'], solve: ['line:L', 'origin'], lines: [`${kt} \\times 0 = 0`] } as unknown as Record<string, unknown>,
    solution: [`Both rows give ${kt} ${s.per}.`, `At 0: ${kt} × 0 = 0. The graph goes through (0, 0).`] }, R, [
    { t: `${s.money ? '$0' : `0 ${s.y}`}: ${kt} × 0 = 0`, ok: true, say: `Yes: the multiplier times 0 is 0.` },
    { t: `${yAmt(s, k)}: the rate for 1 ${s.x1}`, say: `${yAmt(s, k)} goes with 1 ${s.x1}, not 0. At 0: ${kt} × 0 = 0.` },
    { t: `You can't tell: 0 ÷ 0 has no value`, mc: 'mc.ratio-rate.rejects-proportional-over-zero-point', say: `You don't need to divide. Multiply: ${kt} × 0 = 0.` },
  ]);
};

// 4. situations [situation-test, evidence-vs-guarantee]
const situation: Gen = (R, n, sg) => {
  const kind = pick(R, ['unit', 'speed', 'recipe', 'age', 'fee', 'inverse', 'tier'] as const);
  const PROP_SAY = 'Yes. The situation fixes one rate per unit, for every amount: one multiplier.';
  const p = (t: string): Opt => ({ t, ok: true, say: PROP_SAY });
  const notProp = (why: string, say: string, mc?: string): Opt => ({ t: `Not proportional: ${why}`, say, mc });
  let prompt = '', board = '', opts: Opt[] = [], sol: string[] = [];
  if (kind === 'unit') {
    const k = pick(R, [2.75, 3.5, 4.25, 6, 1.8, 0.73]), thing = pick(R, ['Bulk almonds cost', 'Ground coffee costs', 'Stamps cost', 'Bananas cost']), unit = thing.startsWith('Stamps') ? 'stamp' : 'pound';
    prompt = `${thing} ${$(k)} per ${unit}, for any amount, with no other fees. Is the cost proportional to the number of ${unit}s?`;
    board = `\\text{cost} = ${money(k)} \\times \\text{${unit}s}`;
    opts = [p(`Proportional: every ${unit} costs the same ${$(k)}`), notProp(`the more you buy, the more it costs`, `It is proportional, but not for that reason: the reason is that every ${unit} costs ${$(k)}.`), notProp(`0 ${unit}s and $0 is not a real purchase`, `(0, 0) still fits: 0 × ${money(k)} = 0. Every ${unit} costs ${$(k)}: proportional.`, 'mc.ratio-rate.requires-origin-in-allowed-domain')];
    sol = [`One price for every ${unit}: cost = ${money(k)} × ${unit}s.`];
  } else if (kind === 'speed') {
    const r = pick(R, [45, 50, 55, 60, 62]);
    prompt = `A train runs at a steady ${r} miles per hour. Is the distance proportional to the time?`;
    board = `d = ${r}t`;
    opts = [p(`Proportional: every hour adds the same ${r} miles, from 0`), notProp(`the train needs time to get going`, `The story says a steady speed, so every hour covers ${r} miles: d = ${r}t.`), notProp(`distance and time have different units`, `Different units are fine: the rate is miles per hour. d = ${r}t.`)];
    sol = [`Steady speed: d = ${r}t, one multiplier.`];
  } else if (kind === 'recipe') {
    const e = int(R, 2, 4), c = int(R, 1, 3);
    prompt = `A pancake recipe uses ${e} eggs for every ${c} cup${c > 1 ? 's' : ''} of milk, for any size batch. Is the number of eggs proportional to the cups of milk?`;
    board = `${e} \\text{ eggs} : ${c} \\text{ cup${c > 1 ? 's' : ''}}`;
    opts = [p(`Proportional: the same number of eggs per cup, for any batch`), notProp(`eggs are counted and milk is measured`, `Mixed kinds of amounts are fine: the eggs per cup stay the same for any batch.`), notProp(`the eggs go up by a different amount each time`, `Look at eggs per cup, not at the steps: ${e} ÷ ${c} for every batch.`)];
    sol = [`Every batch: ${e} eggs per ${c} cup${c > 1 ? 's' : ''}, one rate.`];
  } else if (kind === 'age') {
    const d = int(R, 2, 6);
    prompt = `Mia is ${d} years older than her brother. Is Mia's age proportional to her brother's age?`;
    board = `\\text{Mia} = \\text{brother} + ${d}`;
    opts = [notProp(`the difference stays ${d}, but the ratio changes`, `Right. ${d + 1} ÷ 1 and ${d + 10} ÷ 10 are different: adding ${d} is not one multiplier.`), { t: `Proportional: both ages go up by 1 every year`, mc: 'mc.ratio-rate.scales-non-proportional', say: `Going up together is not enough. When he is 1 she is ${d + 1}; when he is 10 she is ${d + 10}. The ratio changes.` }, notProp(`ages are not numbers you can divide`, `You can divide ages. The real reason: the difference stays ${d}, so the ratio changes.`)];
    opts[0]!.ok = true;
    sol = [`Brother 1, Mia ${d + 1}: ratio ${d + 1}. Brother 10, Mia ${d + 10}: ratio ${fmt((d + 10) / 10)}.`, `Different ratios: not proportional.`];
  } else if (kind === 'fee') {
    const f = pick(R, [5, 8, 10, 12]), r = pick(R, [2, 3, 4, 6]);
    const ctx = pick(R, [['A climbing gym charges', 'to get in plus', 'per hour', 'hours'], ['A taxi charges', 'to start plus', 'per mile', 'miles'], ['A bowling alley charges', 'for shoes plus', 'per game', 'games']] as const);
    prompt = `${ctx[0]} ${$(f)} ${ctx[1]} ${$(r)} ${ctx[2]}. Is the cost proportional to the number of ${ctx[3]}?`;
    board = `\\text{cost} = ${f} + ${r} \\times \\text{${ctx[3]}}`;
    opts = [notProp(`there is a ${$(f)} starting amount`, `Right. At 0 ${ctx[3]} it already costs ${$(f)}, not $0.`), { t: `Proportional: every ${ctx[3].replace(/s$/, '')} costs the same ${$(r)}`, mc: 'mc.ratio-rate.scales-non-proportional', say: `The ${$(r)} part is per unit, but the ${$(f)} is paid once: 1 costs ${$(f + r)}, 2 cost ${$(f + 2 * r)}, not double.` }, notProp(`the price per ${ctx[3].replace(/s$/, '')} goes up`, `The ${$(r)} stays the same. The trouble is the ${$(f)} you pay at the start.`)];
    opts[0]!.ok = true;
    sol = [`0 ${ctx[3]} cost ${$(f)}: a proportional cost would be $0.`, `1 → ${$(f + r)}, 2 → ${$(f + 2 * r)}: not double.`];
  } else if (kind === 'inverse') {
    const h = pick(R, [12, 24, 36]);
    prompt = `One painter can paint a fence in ${h} hours. With more painters working together, the job takes fewer hours. Is the time proportional to the number of painters?`;
    board = `1 \\to ${h},\\ 2 \\to ${h / 2},\\ 3 \\to ${h / 3}`;
    opts = [notProp(`more painters means fewer hours`, `Right. 1 painter: ${h} hours, 2 painters: ${h / 2} hours. The time goes down, so time ÷ painters changes.`), { t: `Proportional: the hours change by the same factor as the painters`, mc: 'mc.ratio-rate.scales-non-proportional', say: `Doubling the painters halves the hours: ${h} ÷ 1 and ${h / 2} ÷ 2 are different rates. Not proportional.` }, notProp(`painters work at different speeds`, `The story treats them the same. The reason: more painters, fewer hours.`)];
    opts[0]!.ok = true;
    sol = [`${h} ÷ 1 = ${h}, ${h / 2} ÷ 2 = ${h / 4}: different.`];
  } else {
    const r1 = pick(R, [4, 5, 6]), r2 = pick(R, [2, 3]);
    const c10 = 2 * r1 + 8 * r2;
    prompt = `Parking costs ${$(r1)} an hour for the first 2 hours, then ${$(r2)} an hour after that. (0 hours: $0, 1 hour: ${$(r1)}, 2 hours: ${$(2 * r1)}, 10 hours: ${$(c10)}.) Is the cost proportional to the time?`;
    board = `0 \\to 0,\\ 1 \\to ${r1},\\ 2 \\to ${2 * r1},\\ 10 \\to ${c10}`;
    opts = [notProp(`the rate per hour changes after 2 hours`, `Right. ${r1} per hour at first, but 10 hours cost ${$(c10)}, which is ${fmt(c10 / 10)} per hour.`), { t: `Proportional: 0 hours cost $0, and 2 hours cost twice 1 hour`, mc: 'mc.ratio-rate.zero-and-doubling-prove-proportionality', say: `Those checks can only rule it out, never prove it. 10 hours cost ${$(c10)}, not ${$(10 * r1)}: the rate changes.` }, notProp(`parking for 0 hours makes no sense`, `0 hours is fine. The problem is the rate: after 2 hours it drops to ${$(r2)}.`)];
    opts[0]!.ok = true;
    sol = [`1 hour: ${r1} per hour. 10 hours: ${c10} ÷ 10 = ${fmt(c10 / 10)} per hour.`, `The rate changes: not proportional.`];
  }
  void sg;
  return choiceItem({ id: `si-${kind}-${n}`, family: 'situation', prompt, board, picture: undefined, solution: sol }, R, opts);
};

// 5. find k with its direction [name-k-direction]
const nameK: Gen = (R, n) => {
  const kind = pick(R, ['table', 'reverse', 'eq', 'over', 'fractions', 'dnl'] as const);
  if (kind === 'eq') {
    const s = pick(R, SKINS.filter(x => x.money)), k = pick(R, s.ks);
    const [x, y] = s.L;
    return mkNum({ id: `nk-eq-${n}`, family: 'nameK', prompt: `The cost of ${s.what} is ${S(`${y} = ${fmt(k)}${x}`)}, with ${x} in ${s.x} and ${y} in dollars. What is k?`, board: `${y} = ${fmt(k)}${x}`, unit: s.per,
      solution: [`y = kx: k is the number multiplying ${x}.`, `k = ${fmt(k)} ${s.per}.`] }, k, [{ v: 1 / k, tol: 0.006, mc: 'mc.ratio-rate.scale-factor-inverted', say: `That is 1 ÷ ${fmt(k)}. In ${y} = ${fmt(k)}${x}, k is the number in front of ${x}: ${fmt(k)}.` }], 'k is the number that multiplies the input.');
  }
  if (kind === 'over') {
    const d = pick(R, [2, 4, 5, 10]);
    const [x, y] = pick(R, [['x', 'y'], ['t', 'd'], ['g', 'm']] as const);
    const k = 1 / d;
    return mkNum({ id: `nk-over-${n}`, family: 'nameK', prompt: `A relationship is ${S(`${y} = ${x}/${d}`)}. Write it as ${y} = k${x}. What is k? (a decimal)`, board: `${y} = \\dfrac{${x}}{${d}} = k\\,${x}`, unit: '',
      solution: [`Dividing by ${d} is the same as multiplying by 1/${d}.`, `k = 1/${d} = ${fmt(k)}.`] }, k, [{ v: d, mc: 'mc.ratio-rate.misreads-y-equals-x-over-k', say: `${x}/${d} divides by ${d}, so it multiplies by 1/${d}. k = ${fmt(k)}, not ${d}.` }], `${x}/${d} means ${x} × 1/${d}.`);
  }
  if (kind === 'fractions') {
    const [a, b, c, d] = pick(R, [[1, 2, 1, 4], [3, 4, 1, 4], [1, 2, 1, 3], [2, 3, 1, 3], [3, 4, 1, 2], [1, 4, 1, 2]] as const);
    const k = Math.round((a / b) / (c / d) * 100) / 100;
    const who = pick(R, NAMES);
    return mkNum({ id: `nk-fr-${n}`, family: 'nameK', prompt: `${who} walks ${a}/${b} mile in every ${c}/${d} hour, at a steady pace. How many ${B('miles per hour')} is that?`, board: `\\dfrac{${a}}{${b}} \\div \\dfrac{${c}}{${d}} = \\,?`, unit: 'miles per hour',
      solution: [`Miles per hour: miles ÷ hours.`, `${a}/${b} ÷ ${c}/${d} = ${a}/${b} × ${d}/${c} = ${fmt(k)}.`] }, k, [{ v: 1 / k, tol: 0.006, mc: 'mc.ratio-rate.scale-factor-inverted', say: `That is hours per mile. Miles per hour = miles ÷ hours = ${fmt(k)}.` }], `Divide the miles by the hours.`);
  }
  if (kind === 'reverse') {
    const [p, q] = pick(R, [[2, 5], [4, 10], [3, 6], [5, 2], [4, 1], [3, 12], [8, 2]] as const); // p cups blue : q cups yellow
    const yb = R() < 0.5; // ask yellow per blue (q/p), else blue per yellow (p/q)
    const kk = yb ? q / p : p / q;
    const top = yb ? 'yellow' : 'blue', bot = yb ? 'blue' : 'yellow';
    return mkNum({ id: `nk-rv-${n}`, family: 'nameK', prompt: `A paint mix uses ${p} cups of blue for every ${q} cups of yellow. How many cups of ${B(top)} per cup of ${A(bot)}?`, board: `${p} \\text{ blue} : ${q} \\text{ yellow}`, unit: `cups of ${top} per cup of ${bot}`,
      solution: [`Per cup of ${bot}: divide the ${top} by the ${bot}.`, `${yb ? q : p} ÷ ${yb ? p : q} = ${fmt(kk)}.`] }, kk, [{ v: 1 / kk, tol: 0.006, mc: 'mc.ratio-rate.scale-factor-inverted', say: `That is the other direction. Cups of ${top} per cup of ${bot}: ${yb ? q : p} ÷ ${yb ? p : q} = ${fmt(kk)}.` }], `Divide the amount asked for by the amount after "per".`);
  }
  const s = pick(R, SKINS);
  const { k, xs } = kxs(R, s, 2, { noOne: true });
  const rows = xs.map(x => ({ x, y: times(k, x) }));
  if (kind === 'dnl') {
    return mkNum({ id: `nk-dnl-${n}`, family: 'nameK', prompt: `A double number line for ${s.what} matches ${A(`0, ${fmt(rows[0]!.x)}, ${fmt(rows[1]!.x)} ${s.x}`)} with ${B(`0, ${s.money ? money(rows[0]!.y) : fmt(rows[0]!.y)}, ${s.money ? money(rows[1]!.y) : fmt(rows[1]!.y)} ${s.y}`)}. What is k in ${s.per}?`,
      board: `\\begin{array}{l} \\text{${s.head[0]}}:\\ 0,\\ ${fmt(rows[0]!.x)},\\ ${fmt(rows[1]!.x)} \\\\ \\text{${s.head[1]}}:\\ 0,\\ ${s.money ? money(rows[0]!.y) : fmt(rows[0]!.y)},\\ ${s.money ? money(rows[1]!.y) : fmt(rows[1]!.y)} \\end{array}`, unit: s.per,
      solution: [qLine(s, rows[0]!), `k = ${fmt(k)} ${s.per}.`] }, k, [{ v: 1 / k, tol: 0.006, mc: 'mc.ratio-rate.scale-factor-inverted', say: `That is ${s.x} per ${s.y1}. k is ${s.y} ÷ ${s.x}: ${fmt(k)}.` }], `Divide ${s.y} by ${s.x} for one pair.`);
  }
  const it = mkNum({ id: `nk-t-${n}`, family: 'nameK', prompt: `The table shows ${s.what}. What is the constant of proportionality k, in ${B(s.per)}?`, board: `k = \\,?`, unit: s.per,
    picture: { table: { cols: s.head, rows, money: [false, s.money], showQ: false }, show: [], solve: [], lines: [`k = ${fmt(k)}`] },
    solution: [qLine(s, rows[0]!), qLine(s, rows[1]!), `k = ${fmt(k)} ${s.per}.`] }, k, [
    { v: 1 / k, tol: 0.006, mc: 'mc.ratio-rate.scale-factor-inverted', say: `That is ${s.x} per ${s.y1}, the other direction. k = ${s.y} ÷ ${s.x} = ${fmt(k)}.` },
    { v: rows[0]!.y, mc: 'mc.ratio-rate.confuses-rate-with-total', say: `${yAmt(s, rows[0]!.y)} is the total for ${xAmt(s, rows[0]!.x)}. k is the amount for 1 ${s.x1}: divide.` },
  ], `k = ${s.y} ÷ ${s.x} in any row.`);
  return it;
};
function mkNum(base: { id: string; family: FamilyId; prompt: string; board: string; unit: string; solution: string[]; picture?: unknown }, want: number, wrongs0: { v: number; tol?: number; mc?: string; say: string }[], fallback: string, okSay?: string): Item {
  // a wrong value equal to the answer or to an earlier wrong value cannot be told apart: drop it
  const wrongs = wrongs0.filter((w, i) => Math.abs(w.v - want) > 0.01 && !wrongs0.slice(0, i).some(e => Math.abs(e.v - w.v) < 0.01));
  const it: Item = {
    id: base.id, family: base.family, prompt: base.prompt, board: base.board, input: 'num', unit: base.unit, solution: base.solution,
    picture: base.picture as Record<string, unknown> | undefined,
    answer: num(want), check: r => numCheck(r, want, okSay ?? `Yes: ${fmt(want)}${base.unit ? ' ' + base.unit : ''}.`, wrongs, fallback),
  };
  for (const w of wrongs) if (w.mc && Math.abs(w.v - want) > 0.0005) probe(it, num(w.tol ? Math.round(w.v * 1000) / 1000 : w.v), w.mc);
  return it;
}

// 6. write y = kx [write-equation, translate-check]
const writeEq: Gen = (R, n) => {
  const kind = pick(R, ['table', 'story', 'times', 'check'] as const);
  if (kind === 'times') {
    const k = pick(R, [4, 5, 6, 8, 12, 15]);
    const [many, few, m, f] = pick(R, [['students', 'teachers', 's', 't'], ['players', 'coaches', 'p', 'c'], ['campers', 'counselors', 'c', 'n'], ['chairs', 'tables', 'c', 't']] as const).slice() as [string, string, string, string];
    const prompt = `There are ${k} times as many ${many} as ${few}. Use ${m} for ${many} and ${f} for ${few}. Which equation is right?`;
    return choiceItem({ id: `we-x-${n}`, family: 'writeEq', prompt, board: `${m} = k\\,${f}`, solution: [`For 1 ${few.replace(/s$/, '')} there are ${k} ${many}.`, `So ${m} = ${k}${f}: test ${f} = 2 → ${m} = ${2 * k}.`] }, R, [
      { t: `<i>${m}</i> = ${k}<i>${f}</i>`, ok: true, say: `Yes: test it. 2 ${few} → ${2 * k} ${many}.` },
      { t: `<i>${f}</i> = ${k}<i>${m}</i>`, mc: 'mc.expressions.reverses-multiplicative-comparison', say: `Test it: 10 ${many} would give ${10 * k} ${few}. There are MORE ${many}, so ${m} = ${k}${f}.` },
      { t: `<i>${m}</i> = <i>${f}</i> + ${k}`, mc: 'mc.ratio-rate.wrong-form-proportional-equation', say: `"Times as many" multiplies: ${m} = ${k}${f}.` },
    ]);
  }
  const s = pick(R, SKINS);
  const { k, xs } = kxs(R, s, 2, { noOne: true });
  const rows = xs.map(x => ({ x, y: times(k, x) }));
  const [x, y] = s.L;
  const prod = times(rows[0]!.x, rows[0]!.y);
  const pool: Opt[] = shuffle(R, [
    { t: `<i>${x}</i> = ${fmt(k)}<i>${y}</i>`, mc: 'mc.ratio-rate.scale-factor-inverted', say: `Test a row: ${x} = ${fmt(rows[0]!.x)} must give ${y} = ${fmt(rows[0]!.y)}. Here the output ${y} is on the left: ${y} = ${fmt(k)}${x}.` },
    { t: `<i>${y}</i> = <i>${x}</i> + ${fmt(k)}`, mc: 'mc.ratio-rate.wrong-form-proportional-equation', say: `k multiplies: ${y} = ${fmt(k)}${x}. Adding ${fmt(k)} would give ${fmt(rows[0]!.x + k)} for row 1, not ${fmt(rows[0]!.y)}.` },
    { t: `<i>${y}</i> = ${fmt(prod)}<i>${x}</i>`, mc: 'mc.ratio-rate.product-as-proportionality-constant', say: `${fmt(prod)} is ${fmt(rows[0]!.x)} × ${fmt(rows[0]!.y)}. k is ${y} ÷ ${x} = ${fmt(k)}.` },
    { t: `None: k gets bigger in the rows with bigger numbers`, mc: 'mc.ratio-rate.constant-varies-row-to-row', say: `The numbers get bigger, but ${y} ÷ ${x} stays ${fmt(k)} in every row. One k: ${y} = ${fmt(k)}${x}.` },
  ]).slice(0, 2);
  const prompt = kind === 'story' ? `${cap(s.story(rows[0]!.x, rows[0]!.y))}, at the same rate for any amount. Use ${x} for ${s.x} and ${y} for ${s.y}. Which equation fits?`
    : kind === 'check' ? `The table shows ${s.what}, and 0 ${s.x} go with 0 ${s.y}. Use ${x} for ${s.x} and ${y} for ${s.y}. Which equation fits every row, the 0 row too?`
      : `The table shows ${s.what}. Use ${x} for ${s.x} and ${y} for ${s.y}. Which equation fits?`;
  return choiceItem({ id: `we-${n}`, family: 'writeEq', prompt, board: `${y} = k\\,${x}`, picture: { table: { cols: s.head, rows, money: [false, s.money], showQ: false }, show: [], solve: [], lines: [`${y} = ${fmt(k)}${x}`] } as unknown as Record<string, unknown>,
    solution: [`k = ${y} ÷ ${x} = ${fmt(k)}.`, `${y} = ${fmt(k)}${x}. Check: ${fmt(k)} × ${fmt(rows[0]!.x)} = ${fmt(rows[0]!.y)}${kind === 'check' ? `, and ${fmt(k)} × 0 = 0` : ''}.`] }, R, [
    { t: `<i>${y}</i> = ${fmt(k)}<i>${x}</i>`, ok: true, say: `Yes. ${fmt(k)} × ${fmt(rows[0]!.x)} = ${fmt(rows[0]!.y)}: it fits.` }, ...pool,
  ]);
};

// 7. points on the graph [graph-ray]
const plotPoint: Gen = (R, n) => {
  const s = pick(R, SKINS.filter(x => !x.discrete));
  const { k, xs } = kxs(R, s, 3, { noOne: true });
  const rows = xs.map(x => ({ x, y: times(k, x) }));
  const [x, y] = s.L;
  const g: RateGraphParams = { ...axes(s, rows), lines: [{ id: 'L', k, ends: 'ray' }] };
  if (R() < 0.3) {
    // where does the ray start?
    const it: Item = {
      id: `pp-o-${n}`, family: 'plotPoint', prompt: `${S(`${y} = ${fmt(k)}${x}`)} for any amount ${x} ≥ 0 (${s.what}). The table starts at ${xAmt(s, rows[0]!.x)}. At which point does the graph start?`,
      board: `${y} = ${fmt(k)}${x}`, input: 'pair', pairLead: '(', pairOp: ',',
      picture: { graph: { ...g, points: [{ x: rows[0]!.x, y: rows[0]!.y, id: 'r0', label: true }] }, show: ['axes', 'pt:r0'], solve: ['line:L', 'origin'] } as unknown as Record<string, unknown>,
      solution: [`0 ${s.x} is allowed: ${fmt(k)} × 0 = 0.`, `The graph starts at (0, 0) and runs as a ray through (${fmt(rows[0]!.x)}, ${fmt(rows[0]!.y)}).`],
      answer: { kind: 'pair', x: 0, y: 0 },
      check: r => {
        if (r.kind !== 'pair') return { ok: false, say: 'Fill in both numbers.' };
        if (r.x === 0 && r.y === 0) return { ok: true, say: `Yes: 0 ${s.x} go with 0 ${s.y}, so the ray starts at (0, 0).` };
        if (Math.abs(r.x - rows[0]!.x) < 1e-9 && Math.abs(r.y - rows[0]!.y) < 1e-9) return { ok: false, mc: 'mc.ratio-rate.ignores-origin-meaning', say: `That is the first row, not the start. 0 ${s.x} are allowed too: ${fmt(k)} × 0 = 0, so the graph starts at (0, 0).` };
        if (Math.abs(r.x - 1) < 1e-9 && Math.abs(r.y - k) < 1e-9) return { ok: false, mc: 'mc.ratio-rate.ignores-origin-meaning', say: `(1, ${fmt(k)}) is on the graph, but it starts earlier: at 0, ${fmt(k)} × 0 = 0.` };
        return { ok: false, say: `At ${x} = 0: ${y} = ${fmt(k)} × 0 = 0.` };
      },
    };
    probe(it, { kind: 'pair', x: rows[0]!.x, y: rows[0]!.y }, 'mc.ratio-rate.ignores-origin-meaning');
    return it;
  }
  const tx = pick(R, s.xs.filter(v => timesExact(k, v) && v <= g.xMax && times(k, v) <= g.yMax)), ty = times(k, tx);
  const it: Item = {
    id: `pp-${n}`, family: 'plotPoint', prompt: `${S(`${y} = ${fmt(k)}${x}`)} for ${s.what} (${x} in ${s.x}, ${y} in ${s.y}). Which point of the graph goes with ${A(`${x} = ${fmt(tx)}`)}?`,
    board: `${y} = ${fmt(k)} \\times ${fmt(tx)}`, input: 'pair', pairLead: '(', pairOp: ',',
    picture: { graph: { ...g, mark: { x: tx, y: ty, label: true } }, show: ['axes', 'line:L'], solve: ['mark'] } as unknown as Record<string, unknown>,
    solution: [`${y} = ${fmt(k)} × ${fmt(tx)} = ${fmt(ty)}.`, `The point is (${fmt(tx)}, ${fmt(ty)}): input first, output second.`],
    answer: { kind: 'pair', x: tx, y: ty },
    check: r => {
      if (r.kind !== 'pair') return { ok: false, say: 'Fill in both numbers.' };
      const eq = (a: number, b: number) => Math.abs(a - b) < 1e-6;
      if (eq(r.x, tx) && eq(r.y, ty)) return { ok: true, say: `Yes: (${fmt(tx)}, ${fmt(ty)}).` };
      if (eq(r.x, ty) && eq(r.y, tx)) return { ok: false, mc: 'mc.coordinate-geometry.ordered-pair-as-unordered', say: `Order matters: the input (${s.x}) comes first. (${fmt(tx)}, ${fmt(ty)}).` };
      if (eq(r.x, tx) && eq(r.y, tx + k)) return { ok: false, mc: 'mc.ratio-rate.wrong-form-proportional-equation', say: `${fmt(k)}${x} means ${fmt(k)} × ${x}, not ${x} + ${fmt(k)}: ${fmt(ty)}.` };
      return { ok: false, say: `Multiply: ${fmt(k)} × ${fmt(tx)} = ${fmt(ty)}.` };
    },
  };
  probe(it, { kind: 'pair', x: ty, y: tx }, 'mc.coordinate-geometry.ordered-pair-as-unordered');
  return it;
};

// 8. read the scale [graph-ray]
const readScale: Gen = (R, n) => {
  if (R() < 0.3) {
    // choose the scale: equal steps between the labels
    const st = pick(R, [2, 5, 10, 2.5, 20]);
    const good = [0, 1, 2, 3, 4, 5].map(i => i * st);
    const bad1 = [0, st, 2 * st, 4 * st, 8 * st, 16 * st];
    const bad2 = [0, st, 2 * st, 3 * st, 5 * st, 6 * st];
    const L = (v: number[]) => v.map(fmt).join(', ');
    const s = pick(R, SKINS.filter(x => x.id !== 'recipe'));
    return choiceItem({ id: `rs-c-${n}`, family: 'readScale', prompt: `You graph ${s.what}. Which labels make a correct ${B(s.y)} axis, with grid lines the same distance apart?`, board: `\\text{equal steps?}`,
      solution: [`On a scale, equal distances must mean equal amounts.`, `${L(good)}: every step is ${fmt(st)}.`] }, R, [
      { t: L(good), ok: true, say: `Yes: every grid step adds ${fmt(st)}.` },
      { t: L(bad1), mc: 'mc.data-displays.unequal-scale-steps', say: `The labels go up, but the steps grow: ${fmt(st)}, then ${fmt(2 * st)}, then ${fmt(4 * st)}. Equal distances must mean equal amounts.` },
      { t: L(bad2), mc: 'mc.data-displays.unequal-scale-steps', say: `${fmt(4 * st)} is skipped: one step adds ${fmt(2 * st)}, the others ${fmt(st)}.` },
    ]);
  }
  for (let t = 0; t < 60; t++) {
    const s = pick(R, SKINS.filter(x => x.id !== 'recipe'));
    const { k, xs } = kxs(R, s, 3, { noOne: true });
    const rows = xs.map(x => ({ x, y: times(k, x) }));
    const ax = axes(s, rows);
    if (ax.yStep === 1) continue;
    // a marked point on a grid crossing (so it can be read exactly), at least 2 steps up
    const cands: [number, number][] = [];
    for (let i = 1; i * ax.xStep <= ax.xMax + 1e-9; i++) {
      const x = i * ax.xStep;
      if (!timesExact(k, x)) continue;
      const y = times(k, x);
      if (y <= ax.yMax && Math.abs(y / ax.yStep - Math.round(y / ax.yStep)) < 1e-9 && Math.round(y / ax.yStep) >= 2) cands.push([x, y]);
    }
    if (!cands.length) continue;
    const [mx, my] = pick(R, cands);
    const sq = Math.round(my / ax.yStep);
    return mkNum({ id: `rs-${n}`, family: 'readScale', prompt: `The graph shows ${s.what}. Read the marked point: how many ${B(s.y)} go with ${A(xAmt(s, mx))}?`, board: `\\text{one step up} = \\,?`, unit: s.y,
      picture: { graph: { ...ax, lines: [{ id: 'L', k, ends: 'ray' }], mark: { x: mx, y: my } }, show: ['axes', 'line:L', 'mark'], solve: [], lines: [`${sq} \\times ${fmt(ax.yStep)} = ${fmt(my)}`] },
      solution: [`The labels show that each grid step up is ${fmt(ax.yStep)} ${s.y}.`, `${sq} steps up: ${sq} × ${fmt(ax.yStep)} = ${fmt(my)}.`] }, my, [
      { v: sq, mc: 'mc.measurement-units.misjudges-interval-value', say: `${sq} is the number of grid steps. Each step is ${fmt(ax.yStep)} ${s.y}: ${sq} × ${fmt(ax.yStep)} = ${fmt(my)}.` },
    ], `Count the grid steps up and use the scale: each step is ${fmt(ax.yStep)}.`);
  }
  throw new Error('readScale: no readable point');
};

// 9. ray, segment or points [graph-domain]
const domain: Gen = (R, n) => {
  const kind = pick(R, ['ray', 'segment', 'points', 'no0', 'half'] as const);
  const RAY = 'A ray from (0, 0): any amount is allowed';
  if (kind === 'half') {
    const c = pick(R, [8, 12, 15, 9]), t = pick(R, [1.5, 2.5, 3.5]);
    return choiceItem({ id: `dm-h-${n}`, family: 'domain', prompt: `Tickets cost ${$(c)} each. Can the graph have a point at ${A(`${fmt(t)} tickets`)}?`, board: `c = ${c}n,\\ n = 0, 1, 2, \\dots`,
      picture: { graph: { xMax: 6, yMax: niceAxis(6 * c * 1.12).max, xStep: 1, yStep: niceAxis(6 * c * 1.12).step, xName: 'tickets', yName: 'dollars', lines: [{ id: 'L', k: c, ends: 'points', from: 0, to: 6 }] }, show: ['axes'], solve: ['line:L'] } as unknown as Record<string, unknown>,
      solution: [`Tickets are counted: 0, 1, 2, 3, ...`, `The graph is separate points; ${fmt(t)} tickets is not one of them.`] }, R, [
      { t: `No: you can't buy ${fmt(t)} tickets`, ok: true, say: `Right. Only whole numbers of tickets: the graph is separate points.` },
      { t: `Yes: ${fmt(t)} × ${c} = ${fmt(t * c)}`, mc: 'mc.functions-concept.discrete-quantity-allows-fractions', say: `The arithmetic works, but nobody buys ${fmt(t)} tickets. Only whole numbers are allowed.` },
      { t: `Yes: every point on the line through (0, 0) counts`, mc: 'mc.functions-concept.discrete-quantity-allows-fractions', say: `The points lie on that line, but only whole numbers of tickets are allowed. ${fmt(t)} is not.` },
    ]);
  }
  const k = pick(R, [3, 4, 2.5, 3.5, 6]);
  let prompt = '', right = '', lineSpec: RateGraphParams['lines'] = [], xName = '', yName = 'dollars', xMax = 10;
  if (kind === 'ray') { prompt = `Gas costs ${$(k)} per gallon, and you can pump any amount. Which graph shows the cost?`; right = RAY; lineSpec = [{ id: 'L', k, ends: 'ray' }]; xName = 'gallons'; }
  else if (kind === 'segment') { const m = pick(R, [6, 8, 5]); prompt = `A cooler holds at most ${m} gallons of lemonade, at ${$(k)} a gallon. The cost goes with any amount from 0 to ${m} gallons. Which graph shows it?`; right = `A segment from (0, 0) to ${m} gallons`; lineSpec = [{ id: 'L', k, ends: 'segment', from: 0, to: m }]; xName = 'gallons'; xMax = 10; }
  else if (kind === 'points') { prompt = `Concert tickets cost ${$(k)} each. Which graph shows the cost of 0 to 8 tickets?`; right = 'Separate points at 0, 1, 2, ... tickets'; lineSpec = [{ id: 'L', k, ends: 'points', from: 0, to: 8 }]; xName = 'tickets'; }
  else { const a = pick(R, [2, 3]), b = pick(R, [8, 10]); prompt = `Packages of nuts come in any weight from ${a} to ${b} pounds, at ${$(k)} a pound. Which graph shows the cost?`; right = `The part of the line through (0, 0) from ${a} to ${b} pounds`; lineSpec = [{ id: 'L', k, ends: 'segment', from: a, to: b }]; xName = 'pounds'; }
  const ay = niceAxis(k * xMax * 1.05);
  const g: RateGraphParams = { xMax, yMax: ay.max, xStep: 1, yStep: ay.step, xName, yName, lines: lineSpec };
  const opts: Opt[] = [{ t: right, ok: true, say: `Yes. The allowed inputs decide which part of the line through (0, 0) you draw.` }];
  if (kind !== 'ray') opts.push({ t: RAY, mc: kind === 'points' ? 'mc.functions-concept.discrete-quantity-allows-fractions' : 'mc.functions-concept.graphs-beyond-restricted-interval', say: kind === 'points' ? `Only whole numbers of tickets: separate points, not a full ray.` : `Not every amount is allowed. Draw only the allowed part.` });
  if (kind !== 'points') opts.push({ t: 'Separate points at 0, 1, 2, ... only', say: `Any amount in between is allowed too, so the graph is not just separate points.`, mc: undefined });
  if (kind === 'no0') opts.push({ t: 'No graph: without 0 it is not proportional', mc: 'mc.ratio-rate.requires-origin-in-allowed-domain', say: `It is still proportional: cost = ${fmt(k)} × pounds. The line goes through (0, 0); only the allowed part is drawn.` });
  else if (kind === 'ray') opts.push({ t: 'A segment from (0, 0) to 10 gallons', say: `Nothing stops at 10 gallons here: any amount is allowed, so it is a ray.` });
  else if (kind === 'points') opts.push({ t: 'A segment from 0 to 8 tickets', mc: 'mc.functions-concept.discrete-quantity-allows-fractions', say: `A segment would allow 2.5 tickets. Tickets are counted: separate points.` });
  else opts.push({ t: 'A segment from (0, 0) to 10 gallons', mc: 'mc.functions-concept.graphs-beyond-restricted-interval', say: `The cooler holds less than that. Stop the segment where the cooler is full.` });
  return choiceItem({ id: `dm-${kind}-${n}`, family: 'domain', prompt, board: `\\text{allowed inputs?}`, picture: { graph: g, show: ['axes'], solve: ['line:L'] } as unknown as Record<string, unknown>,
    solution: [`The rule is the same line through (0, 0): cost = ${fmt(k)} × amount.`, `Draw only the allowed inputs: ${right.toLowerCase()}.`] }, R, opts);
};

// 10. is the graph proportional? [graph-test, evidence-vs-guarantee]
const graphTest: Gen = (R, n, sg) => {
  const kinds = sg === 'evidence-vs-guarantee' ? (['few', 'line', 'shift', 'few'] as const) : (['line', 'shift', 'curve', 'down', 'discrete', 'few'] as const);
  const kind = pick(R, kinds);
  const s = pick(R, SKINS.filter(x => x.id !== 'recipe' && !x.discrete));
  const k = pick(R, [1.5, 2, 2.5, 3, 4]);
  let g: RateGraphParams, solve: string[] = ['origin'], right: Opt['t'] = '';
  const P = 'Proportional: straight and through (0, 0)', M = 'Not proportional: it misses (0, 0)', C = 'Not proportional: it is not straight', Cs = 'Only consistent with proportional: a few points, no rule';
  const xMax = 8, ay = niceAxis(k * xMax * 1.2);
  const base = { xMax, yMax: ay.max, xStep: 1, yStep: ay.step, xName: s.head[0], yName: s.head[1] };
  let prompt = `The graph shows ${B(s.y)} against ${A(s.x)}. Is ${B(s.y)} proportional to ${A(s.x)}?`;
  if (kind === 'line') { g = { ...base, lines: [{ id: 'L', k, ends: 'ray' }] }; right = P; }
  else if (kind === 'shift') { const b = ay.step * int(R, 1, 2); g = { ...base, lines: [{ id: 'L', k, b, ends: 'ray' }] }; right = M; }
  else if (kind === 'curve') { const c = k / 4; g = { ...base, lines: [{ id: 'L', k: c, kind: 'square', ends: 'plain' }] }; right = C; }
  else if (kind === 'down') { const b = ay.max * 0.8; const kk = -b / xMax; g = { ...base, lines: [{ id: 'L', k: Math.round(kk * 100) / 100, b: Math.round(b * 100) / 100, ends: 'plain' }] }; right = M; }
  else if (kind === 'discrete') { const c = pick(R, [8, 12, 15]); const ad = niceAxis(c * 6 * 1.15); g = { xMax: 6, yMax: ad.max, xStep: 1, yStep: ad.step, xName: 'tickets', yName: 'dollars', lines: [{ id: 'L', k: c, ends: 'points', from: 1, to: 6 }] }; right = P; prompt = `Tickets cost ${$(c)} each, no fees. The graph shows the cost of 1 to 6 tickets. Is the cost proportional to the number of tickets?`; }
  else { const who = pick(R, NAMES); const xs = shuffle(R, [1, 2, 3, 4, 5, 6]).slice(0, 3).sort((a, b) => a - b); g = { ...base, points: xs.map((x, i) => ({ x, y: times(k, x), id: 'r' + i })) }; right = Cs; solve = xs.map((_, i) => 'ray:r' + i); prompt = `${who} measured ${s.y} and ${s.x} three times and plotted the results. Is ${B(s.y)} proportional to ${A(s.x)}?`; }
  const opts: Opt[] = [P, M, C, Cs].map(t => ({ t, ok: t === right, say: t === right ? 'Yes.' : '' }));
  for (const o of opts) {
    if (o.ok) { o.say = right === P ? 'Yes: the allowed points lie on one straight line through (0, 0).' : right === M ? 'Right: at 0 the output is not 0, so y ÷ x changes.' : right === C ? 'Right: it bends, so y ÷ x is not the same everywhere.' : 'Right: three points fit a line through (0, 0), but nothing says every other amount does.'; continue; }
    if (o.t === P) { o.mc = kind === 'curve' ? 'mc.ratio-rate.origin-alone-means-proportional' : kind === 'few' ? 'mc.reasoning-language.examples-as-proof' : 'mc.ratio-rate.scales-non-proportional'; o.say = kind === 'curve' ? 'Through (0, 0) is not enough: it also has to be straight. This one bends.' : kind === 'few' ? 'Three points fit, but they are only measurements. That is consistent with proportional, not proof.' : 'Straight is not enough: it also has to go through (0, 0). This one starts higher up.'; }
    else if (o.t === M) o.say = kind === 'curve' || kind === 'few' || kind === 'line' || kind === 'discrete' ? `Look at (0, 0): ${kind === 'discrete' ? 'the points line up with it' : 'it does go through it'}.` : '';
    else if (o.t === C) o.say = kind === 'few' ? 'Three points cannot show the rest of the graph. They fit a line through (0, 0), but that is only consistent.' : `It is straight.${right === M ? ' Look where it meets the y-axis.' : ''}`;
    else { o.say = kind === 'few' ? '' : `This graph is not a few measured points: ${kind === 'discrete' ? 'the price rule fixes every point' : 'it is drawn as a full rule'}.`; }
    if (!o.say) o.say = 'Look again at two things: is it straight, and does it go through (0, 0)?';
  }
  if (kind === 'discrete') opts.forEach(o => { if (o.t === M) { o.mc = 'mc.ratio-rate.requires-origin-in-allowed-domain'; o.say = '0 tickets is not plotted, but the points line up with (0, 0): cost = price × tickets.'; } });
  return choiceItem({ id: `gt-${kind}-${n}`, family: 'graphTest', prompt, board: `\\text{straight?}\\ \\ (0, 0)?`,
    picture: { graph: g, show: ['axes', ...(g.lines ?? []).map(l => 'line:' + l.id), ...(g.points ?? []).map(p => 'pt:' + p.id)], solve } as unknown as Record<string, unknown>,
    solution: [`Proportional needs both: a straight line AND through (0, 0).`, right === Cs ? 'A few measured points can only be consistent with it.' : right === P ? 'This one has both.' : right === M ? 'This one misses (0, 0).' : 'This one is curved.'] }, R, opts);
};

// 11. what a point means [interpret-point]
const interpret: Gen = (R, n) => {
  const s = pick(R, SKINS.filter(x => x.id !== 'recipe'));
  const { k, xs } = kxs(R, s, 2, { noOne: true });
  const ax = axes(s, xs.map(x => ({ x, y: times(k, x) })));
  const origin = R() < 0.2;
  const half = !origin && R() < 0.3 && !s.discrete && timesExact(k, 2.5);
  const mx = origin ? 0 : half ? 2.5 : pick(R, xs), my = times(k, mx);
  const g: RateGraphParams = { ...ax, lines: [{ id: 'L', k, ends: s.discrete ? 'points' : 'ray', from: 0, to: s.discrete ? ax.xMax : undefined }], mark: { x: mx, y: my, label: !origin } };
  const opts: Opt[] = origin ? [
    { t: cap(s.story(0, 0)), ok: true, say: `Yes: (0, 0) is a pair of amounts too, both 0.` },
    { t: `The rate is 0 ${s.per}`, mc: 'mc.ratio-rate.zero-over-zero-as-rate', say: `The rate is the same everywhere on the line: ${fmt(k)} ${s.per}. (0, 0) only says 0 goes with 0.` },
    { t: `Start here, then go right and up`, mc: 'mc.coordinate-geometry.point-not-two-quantities', say: `A point on this graph is two amounts: 0 ${s.x} and 0 ${s.y}.` },
  ] : [
    { t: cap(s.story(mx, my)), ok: true, say: `Yes: first the ${s.x}, then the ${s.y}.` },
    { t: cap(s.story(my, mx)), mc: 'mc.coordinate-geometry.ordered-pair-as-unordered', say: `The order matters: the first number is on the ${s.x} axis.` },
    { t: `Go ${fmt(mx)} right and ${fmt(my)} up`, mc: 'mc.coordinate-geometry.point-not-two-quantities', say: `That is how you find it. What it says: ${s.story(mx, my)}.` },
    { t: `The rate is ${fmt(my)} ${s.per}`, mc: 'mc.ratio-rate.confuses-rate-with-total', say: `${fmt(my)} is the total for ${xAmt(s, mx)}. The rate is ${fmt(my)} ÷ ${fmt(mx)} = ${fmt(k)}.` },
  ];
  return choiceItem({ id: `ip-${n}`, family: 'interpret', prompt: `The graph shows ${s.what}. What does the marked point ${S(`(${fmt(mx)}, ${fmt(my)})`)} say?`, board: `(\\text{${s.head[0]}},\\ \\text{${s.head[1]}})`,
    picture: { graph: g, show: ['axes', 'line:L', 'mark', ...(origin ? ['origin'] : [])], solve: [] } as unknown as Record<string, unknown>,
    solution: [`A point is (${s.x}, ${s.y}).`, `(${fmt(mx)}, ${fmt(my)}): ${s.story(mx, my)}.`] }, R, origin ? opts : shuffle(R, opts.slice(1)).slice(0, 2).concat(opts[0]!));
};

// 12. k from the graph [k-from-graph]
const kGraph: Gen = (R, n) => {
  const s = pick(R, SKINS.filter(x => x.id !== 'recipe'));
  if (R() < 0.2) {
    const ys = pick(R, [5, 10, 20, 2.5]), xs = pick(R, [1, 2]);
    const k = ys / xs;
    const g: RateGraphParams = { xMax: xs === 1 ? 8 : 16, xStep: xs, yMax: 8 * ys, yStep: ys, xName: s.head[0], yName: s.head[1], lines: [{ id: 'L', k, ends: 'ray' }] };
    return mkNum({ id: `kg-s-${n}`, family: 'kGraph', prompt: `On this graph of ${s.what} the line climbs exactly one grid square for every grid square across. ${pick(R, NAMES)} says k = 1. What is k, in ${B(s.per)}?`, board: `k = \\,?`, unit: s.per,
      picture: { graph: g, show: ['axes', 'line:L'], solve: [], lines: [`k = \\dfrac{${fmt(ys)}}{${fmt(xs)}} = ${fmt(k)}`] },
      solution: [`Read the labels: one square across is ${fmt(xs)} ${xs === 1 ? s.x1 : s.x}, one square up is ${fmt(ys)} ${s.y}.`, `k = ${fmt(ys)} ÷ ${fmt(xs)} = ${fmt(k)}.`] }, k, [
      { v: 1, mc: 'mc.linear-functions.steepness-ignores-scale', say: `Squares are not units. One square up is ${fmt(ys)} ${s.y}, one across is ${fmt(xs)}: k = ${fmt(k)}.` },
    ], `Use the axis labels: how much is one square up, and one across?`);
  }
  if (R() < 0.25) {
    // two lines on the same axes: which rate is bigger?
    const ka = pick(R, [2.5, 3, 3.5, 4]), kb = pick(R, [1.5, 2, 4.5, 5].filter(v => v !== ka));
    const xa = pick(R, [2, 4]), xb = pick(R, [4, 6].filter(v => v !== xa));
    const ay = niceAxis(Math.max(ka, kb) * 8 * 1.1);
    const big = ka > kb ? 'A' : 'B';
    const totalBig = times(ka, xa) > times(kb, xb) ? 'A' : 'B';
    const opts: Opt[] = [
      { t: `Line A`, ok: big === 'A', say: big === 'A' ? `Yes: A gives ${fmt(ka)}, B gives ${fmt(kb)} ${s.per}.` : `A's rate is ${fmt(times(ka, xa))} ÷ ${fmt(xa)} = ${fmt(ka)}; B's is ${fmt(kb)}.`, mc: big === 'A' ? undefined : (totalBig === 'A' ? 'mc.ratio-rate.confuses-rate-with-total' : undefined) },
      { t: `Line B`, ok: big === 'B', say: big === 'B' ? `Yes: B gives ${fmt(kb)}, A gives ${fmt(ka)} ${s.per}.` : `B's rate is ${fmt(times(kb, xb))} ÷ ${fmt(xb)} = ${fmt(kb)}; A's is ${fmt(ka)}.`, mc: big === 'B' ? undefined : (totalBig === 'B' ? 'mc.ratio-rate.confuses-rate-with-total' : undefined) },
      { t: `Neither: both go through (0, 0), so k is the same`, say: `Both go through (0, 0), but they climb at different rates: ${fmt(ka)} and ${fmt(kb)}.` },
    ];
    return choiceItem({ id: `kg-2-${n}`, family: 'kGraph', prompt: `Two stores sell ${s.id === 'gas' ? 'gas' : s.what}. Line A goes through ${A(`(${xa}, ${fmt(times(ka, xa))})`)}, line B through ${B(`(${xb}, ${fmt(times(kb, xb))})`)}. Which has the bigger k?`, board: `k = \\dfrac{y}{x}`,
      picture: { graph: { xMax: 8, yMax: ay.max, xStep: 1, yStep: ay.step, xName: s.head[0], yName: s.head[1], lines: [{ id: 'A', k: ka, ends: 'ray', name: 'A' }, { id: 'B', k: kb, ends: 'ray', name: 'B', role: 'second' }], points: [{ x: xa, y: times(ka, xa), id: 'a' }, { x: xb, y: times(kb, xb), id: 'b', role: 'second' }] }, show: ['axes', 'line:A', 'line:B', 'pt:a', 'pt:b'], solve: [] } as unknown as Record<string, unknown>,
      solution: [`A: ${fmt(times(ka, xa))} ÷ ${xa} = ${fmt(ka)}.`, `B: ${fmt(times(kb, xb))} ÷ ${xb} = ${fmt(kb)}.`] }, R, opts);
  }
  const { k, xs } = kxs(R, s, 2, { noOne: true });
  const rows = xs.map(x => ({ x, y: times(k, x) }));
  const ax = axes(s, rows);
  const onGrid = Math.abs(k / ax.yStep - Math.round(k / ax.yStep)) < 1e-9;
  const px = pick(R, xs), py = times(k, px);
  const g: RateGraphParams = { ...ax, lines: [{ id: 'L', k, ends: 'ray' }], mark: { x: px, y: py, label: true }, unit: 'L', unitWords: [`1 ${s.x1 === 'cup of flour' ? 'cup' : s.x1}`, s.money ? $(k) : fmt(k)] };
  const sq = Math.round(k / ax.yStep);
  const wrongs: { v: number; tol?: number; mc?: string; say: string }[] = [
    { v: py, mc: 'mc.ratio-rate.confuses-rate-with-total', say: `${fmt(py)} is the total for ${xAmt(s, px)}. k is for 1 ${s.x1}: ${fmt(py)} ÷ ${fmt(px)} = ${fmt(k)}.` },
    { v: px / py, tol: 0.006, mc: 'mc.ratio-rate.scale-factor-inverted', say: `That is ${s.x} per ${s.y1}. k = ${s.y} ÷ ${s.x} = ${fmt(k)}.` },
  ];
  if (onGrid && ax.yStep !== 1 && sq >= 1 && Math.abs(sq - py) > 1e-9 && Math.abs(sq - px / py) > 0.01) wrongs.push({ v: sq, mc: 'mc.measurement-units.misjudges-interval-value', say: `${sq} is the number of grid steps up. Each step is ${fmt(ax.yStep)}: k = ${fmt(k)}.` });
  return mkNum({ id: `kg-${n}`, family: 'kGraph', prompt: `The graph shows ${s.what}. What is k, in ${B(s.per)}?`, board: `k = \\,?`, unit: s.per,
    picture: { graph: g, show: ['axes', 'line:L', 'mark'], solve: ['unit'], lines: [`k = \\dfrac{${fmt(py)}}{${fmt(px)}} = ${fmt(k)}`] },
    solution: [onGrid ? `The point (1, ${fmt(k)}) is on the line: 1 ${s.x1} → ${fmt(k)}.` : `(1, k) is between grid lines, so use the marked point.`, `k = ${fmt(py)} ÷ ${fmt(px)} = ${fmt(k)} ${s.per}.`] }, k, wrongs, `Divide the marked point's ${s.y} by its ${s.x}.`);
};

// 13. same k in every form [translate-check]
const translate: Gen = (R, n) => {
  const kind = pick(R, ['eqTable', 'mismatch', 'describe', 'mismatch'] as const);
  const s = pick(R, SKINS.filter(x => x.money || x.id === 'drive' || x.id === 'hose'));
  const [x, y] = s.L;
  if (kind === 'eqTable') {
    const k = pick(R, s.ks), tx = pick(R, [0.5, 1.5, 2.5, 0.25, 3.5].filter(v => timesExact(k, v)));
    const ty = times(k, tx);
    return mkNum({ id: `tr-e-${n}`, family: 'translate', prompt: `${S(`${y} = ${fmt(k)}${x}`)} for ${s.what}. Fill in the table: ${A(`${x} = ${fmt(tx)}`)} → ${y} = ?`, board: `${y} = ${fmt(k)} \\times ${fmt(tx)}`, unit: s.y,
      solution: [`${fmt(k)} × ${fmt(tx)} = ${fmt(ty)}.`] }, ty, [
      { v: tx + k, mc: 'mc.ratio-rate.wrong-form-proportional-equation', say: `${fmt(k)}${x} means ${fmt(k)} × ${x}: ${fmt(k)} × ${fmt(tx)} = ${fmt(ty)}.` },
    ], `Multiply k by the input: ${fmt(k)} × ${fmt(tx)}.`);
  }
  const { k, xs } = kxs(R, s, 2, { noOne: true });
  const k2 = pick(R, s.ks.filter(v => v !== k));
  if (kind === 'describe') {
    return choiceItem({ id: `tr-d-${n}`, family: 'translate', prompt: `Which sentence says the same as ${S(`${y} = ${fmt(k)}${x}`)} for ${s.what}?`, board: `${y} = ${fmt(k)}${x}`,
      solution: [`k = ${fmt(k)} is the amount for ONE input unit: ${s.rate(k)}.`] }, R, [
      { t: `Every ${s.x1} adds ${s.money ? $(k) : `${fmt(k)} ${s.y}`}: ${s.rate(k)}`, ok: true, say: `Yes: k is the amount per 1 ${s.x1}.` },
      { t: `Every ${s.y1} gives ${fmt(k)} ${s.x}`, mc: 'mc.ratio-rate.scale-factor-inverted', say: `That flips the direction. k = ${fmt(k)} is ${s.per}.` },
      { t: `The ${s.y} are always ${fmt(k)} more than the ${s.x}`, mc: 'mc.ratio-rate.wrong-form-proportional-equation', say: `${fmt(k)}${x} multiplies, it does not add ${fmt(k)}.` },
    ]);
  }
  // mismatch: does a table row agree with an equation?
  const r = { x: xs[0]!, y: times(k, xs[0]!) };
  const agree = R() < 0.4;
  const kEq = agree ? k : k2;
  return choiceItem({ id: `tr-m-${n}`, family: 'translate', prompt: `For ${s.what}, a table has the row ${A(xAmt(s, r.x))} → ${B(yAmt(s, r.y))}, and someone wrote the equation ${S(`${y} = ${fmt(kEq)}${x}`)}. Do they show the same relationship?`, board: `${y} = ${fmt(kEq)}${x}`,
    picture: { table: { cols: s.head, rows: [r], money: [false, s.money], showQ: false }, show: [], solve: [] } as unknown as Record<string, unknown>,
    solution: [`Table: ${qLine(s, r)}.`, `Equation: k = ${fmt(kEq)}. ${agree ? 'Same k: they agree.' : 'Different k: they do not agree.'}`] }, R, agree ? [
    { t: `Yes: both give k = ${fmt(k)}`, ok: true, say: `Right: the same k in both forms.` },
    { t: `No: a table and an equation are different things`, mc: 'mc.ratio-rate.representations-checked-separately', say: `They are different forms, but compare their k: ${fmt(k)} in both.` },
    { t: `No: ${fmt(r.x)} × ${fmt(r.y)} is not ${fmt(k)}`, mc: 'mc.ratio-rate.product-as-proportionality-constant', say: `k is ${s.y} ÷ ${s.x}, not a product: ${fmt(k)}.` },
  ] : [
    { t: `No: the table gives k = ${fmt(k)}, the equation k = ${fmt(kEq)}`, ok: true, say: `Right: one of them is wrong, the k does not agree.` },
    { t: `Yes: both are proportional`, mc: 'mc.ratio-rate.representations-checked-separately', say: `Both are proportional, but with different k: ${fmt(k)} and ${fmt(kEq)}. Not the same relationship.` },
    { t: `Yes: both go up when ${x} goes up`, mc: 'mc.ratio-rate.representations-checked-separately', say: `Compare k: the table gives ${fmt(k)}, the equation ${fmt(kEq)}.` },
  ]);
};

// 14. one row breaks it [ratio-counterexample]
const counterRatio: Gen = (R, n) => {
  const s = pick(R, SKINS.filter(x => x.money));
  const { k, xs } = kxs(R, s, 4);
  const sorted = xs.sort((a, b) => a - b);
  const bad = int(R, 1, 3);
  const shifts = [-1, 1, 2, -2, 0.5, -0.5, 3].filter(d => times(k, sorted[bad]!) + d > 0 && qDecimal(quotient(sorted[bad]!, times(k, sorted[bad]!) + d)!) !== null);
  const d = shifts.length ? pick(R, shifts) : sorted[bad]!;   // shifting by x itself always terminates (rate k + 1)
  const rows = sorted.map((x, i) => ({ x, y: i === bad ? times(k, x) + d : times(k, x) }));
  const qb = quotient(rows[bad]!.x, rows[bad]!.y)!;
  const who = pick(R, NAMES);
  return choiceItem({ id: `cr-${n}`, family: 'counterRatio', prompt: `The table shows ${s.what}. ${who} says: “Three of the four rows give ${$(k)} ${s.per.replace('dollars ', '')}, so it is proportional.”`, board: `\\text{3 of 4 rows match} \\Rightarrow\\ ?`,
    picture: { table: { cols: s.head, rows, money: [false, s.money], showQ: false }, graph: { ...axes(s, rows), points: ptsOf(rows, false) }, show: ['axes', ...rows.map((_, i) => 'pt:r' + i)], solve: rows.map((_, i) => 'ray:r' + i), breaks: ['r' + bad] } as unknown as Record<string, unknown>,
    solution: [`Row ${bad + 1}: ${qLine(s, rows[bad]!)}.`, `One row with another rate is enough: no single multiplier fits every row.`] }, R, [
    { t: `${who} is wrong: row ${bad + 1} gives ${qText(qb)}, and one row is enough to break it`, ok: true, say: `Right. One counterexample sinks the claim, however many rows match.` },
    { t: `${who} is right: most rows match`, mc: 'mc.ratio-rate.majority-matching-ratios-establishes-proportionality', say: `Most is not all. Row ${bad + 1} gives ${qText(qb)}: no single multiplier works.` },
    { t: `${who} is right: row ${bad + 1} is just an exception`, mc: 'mc.reasoning-language.counterexample-as-exception', say: `A rule with an exception is not the rule. Row ${bad + 1} shows the price is not proportional.` },
  ]);
};

// 15. a starting amount [starting-amount-counterexample]
const fixedFee: Gen = (R, n) => {
  const kind = pick(R, ['entry', 'taxi', 'phone', 'firstRow'] as const);
  if (kind === 'firstRow') {
    const k = pick(R, [3, 4, 5, 6, 2.5]), x1 = pick(R, [2, 3]), x2 = pick(R, [5, 6]);
    const it = mkNum({ id: `ff-f-${n}`, family: 'fixedFee', prompt: `A data plan charges the same amount for every gigabyte, with no monthly fee. ${A(`${x1} GB`)} cost ${B($(times(k, x1)))} and ${A(`${x2} GB`)} cost ${B($(times(k, x2)))}. What does it cost for 0 GB?`, board: `${fmt(k)} \\times 0 = \\,?`, unit: 'dollars',
      picture: { graph: { ...axes(skinBy('trail'), [{ x: x2, y: times(k, x2) }]), xName: 'GB', yName: 'dollars', points: [{ x: x1, y: times(k, x1), id: 'r0', label: true }, { x: x2, y: times(k, x2), id: 'r1', label: true }], lines: [{ id: 'L', k, ends: 'ray' }] }, show: ['axes', 'pt:r0', 'pt:r1'], solve: ['line:L', 'origin'] },
      solution: [`${fmt(times(k, x1))} ÷ ${x1} = ${fmt(k)} dollars per GB.`, `0 GB: ${fmt(k)} × 0 = $0. The first row is not a starting amount.`] }, 0, [
      { v: times(k, x1), mc: 'mc.linear-functions.first-output-as-intercept', say: `${$(times(k, x1))} is the cost of ${x1} GB, not of 0 GB. With no fee: ${fmt(k)} × 0 = 0.` },
    ], `No fee: ${fmt(k)} × 0 = 0.`);
    return it;
  }
  const f = pick(R, [3, 5, 8, 10]), r = pick(R, [2, 3, 4]);
  const [what, unit] = kind === 'entry' ? [`An arcade charges ${$(f)} to get in plus ${$(r)} per game`, 'games'] : kind === 'taxi' ? [`A taxi charges ${$(f)} to start plus ${$(r)} per mile`, 'miles'] : [`A phone plan costs ${$(f * 2)} a month plus ${$(r)} per GB`, 'GB'];
  const F = kind === 'phone' ? f * 2 : f;
  const a = pick(R, [2, 3]), b = a * 2;
  const ca = F + r * a, cb = F + r * b;
  const it = mkNum({ id: `ff-${kind}-${n}`, family: 'fixedFee', prompt: `${what}. ${A(`${a} ${unit}`)} cost ${B($(ca))}. What do ${A(`${b} ${unit}`)} cost?`, board: `${a} \\to \\$${ca},\\quad ${b} \\to\\ ?`, unit: 'dollars',
    picture: { graph: { xMax: 8, yMax: niceAxis((F + r * 8) * 1.08).max, xStep: 1, yStep: niceAxis((F + r * 8) * 1.08).step, xName: unit, yName: 'dollars', points: [{ x: a, y: ca, id: 'r0', label: true }], lines: [{ id: 'L', k: r, b: F, ends: 'ray' }] }, show: ['axes', 'pt:r0'], solve: ['line:L'], lines: [`${F} + ${r} \\times ${b} = ${cb}`] },
    solution: [`The ${$(F)} is paid once; only the per-unit part doubles.`, `${$(F)} + ${$(r)} × ${b} = ${$(cb)}, not 2 × ${$(ca)} = ${$(2 * ca)}.`] }, cb, [
    { v: 2 * ca, mc: 'mc.ratio-rate.scales-non-proportional', say: `Doubling only works for proportional costs. The ${$(F)} is paid once: ${F} + ${r} × ${b} = ${cb}.` },
  ], `Start with ${$(F)}, then add ${$(r)} for each of the ${b} ${unit}.`);
  return it;
};

// 16. a changing rate [changing-rate-counterexample]
const changingRate: Gen = (R, n) => {
  const kind = pick(R, ['bulk', 'tiles', 'pattern', 'workers'] as const);
  if (kind === 'tiles') {
    const p = pick(R, [2, 3, 4, 5]), sd = pick(R, [2, 3, 4]);
    return mkNum({ id: `cg-t-${n}`, family: 'changingRate', prompt: `Square tiles are priced by area: ${$(p)} per square foot. A tile 1 ft on a side (1 sq ft) costs ${$(p)}. A tile ${A(`${sd} ft`)} on a side has an area of ${sd * sd} sq ft. What does it cost?`, board: `${sd} \\times ${sd} = ${sd * sd}\\ \\text{sq ft}`, unit: 'dollars',
      solution: [`Price per square foot × area: ${p} × ${sd * sd} = ${p * sd * sd}.`, `Side × ${sd} gives cost × ${sd * sd}: cost is not proportional to the side length.`] }, p * sd * sd, [
      { v: p * sd, mc: 'mc.area-perimeter.area-scales-by-length-factor', say: `The side is ${sd} times as long, but the area is ${sd * sd} times as big: ${p} × ${sd * sd} = ${p * sd * sd}.` },
    ], `Multiply the price per square foot by the area.`);
  }
  if (kind === 'bulk') {
    const e = pick(R, [3, 4, 5]), m = pick(R, [4, 5, 6]), d = e * m - pick(R, [2, 3, 4]);
    const thing = pick(R, ['muffins', 'bagels', 'notebooks']);
    return choiceItem({ id: `cg-b-${n}`, family: 'changingRate', prompt: `${cap(thing)} cost ${$(e)} each, or ${m} for ${$(d)}. Is the cost proportional to the number of ${thing}?`, board: `1 \\to ${e},\\quad ${m} \\to ${d}`,
      solution: [`1 ${thing.replace(/s$/, '')}: ${$(e)} each. ${m} for ${$(d)}: ${d} ÷ ${m} ≈ ${(d / m).toFixed(2)} each.`, `The price per ${thing.replace(/s$/, '')} changes: not proportional.`] }, R, [
      { t: `No: 1 costs ${$(e)} each, but ${m} cost less than ${$(e)} each`, ok: true, say: `Right: the rate per ${thing.replace(/s$/, '')} changes, so no single multiplier.` },
      { t: `Yes: more ${thing} cost more`, mc: 'mc.ratio-rate.scales-non-proportional', say: `More costing more is not enough: ${m} for ${$(d)} is cheaper per ${thing.replace(/s$/, '')} than ${$(e)} each.` },
      { t: `Yes: 0 ${thing} cost $0`, mc: 'mc.ratio-rate.zero-and-doubling-prove-proportionality', say: `(0, 0) fits, but that can only rule proportionality out. The price per ${thing.replace(/s$/, '')} changes.` },
    ]);
  }
  if (kind === 'pattern') {
    const a = pick(R, [3, 4, 5]), dd = pick(R, [2, 3]);
    const t = [a, a + dd, a + 2 * dd];
    return choiceItem({ id: `cg-p-${n}`, family: 'changingRate', prompt: `A growing pattern: figure 1 has ${t[0]} squares, figure 2 has ${t[1]}, figure 3 has ${t[2]}. Is the number of squares proportional to the figure number?`, board: `${t[0]},\\ ${t[1]},\\ ${t[2]}`,
      solution: [`Squares ÷ figure: ${t[0]}, ${fmt(Math.round(t[1]! / 2 * 100) / 100)}, ${fmt(Math.round(t[2]! / 3 * 100) / 100)}.`, `The rate changes: not proportional.`] }, R, [
      { t: `No: ${t[0]} ÷ 1 and ${t[1]} ÷ 2 are different`, ok: true, say: `Right: the squares per figure change.` },
      { t: `Yes: it grows by ${dd} each time`, mc: 'mc.ratio-rate.scales-non-proportional', say: `Growing by the same amount is not one multiplier: ${t[0]} ÷ 1 = ${t[0]}, ${t[1]} ÷ 2 = ${fmt(t[1]! / 2)}.` },
      { t: `Yes: the figures get bigger as the number goes up`, mc: 'mc.ratio-rate.scales-non-proportional', say: `Getting bigger together is not enough. Divide: the squares per figure change.` },
    ]);
  }
  const h = pick(R, [12, 24, 18]);
  return choiceItem({ id: `cg-w-${n}`, family: 'changingRate', prompt: `1 worker builds a shed in ${h} hours; 2 workers take ${h / 2} hours; 3 workers take ${h / 3} hours. Is the time proportional to the number of workers?`, board: `1 \\to ${h},\\ 2 \\to ${h / 2},\\ 3 \\to ${h / 3}`,
    solution: [`Hours ÷ workers: ${h}, ${fmt(h / 4)}, ${fmt(Math.round(h / 9 * 100) / 100)}: they change.`, `More workers, fewer hours: not proportional.`] }, R, [
    { t: `No: the hours go down as the workers go up`, ok: true, say: `Right: hours ÷ workers is ${h}, then ${fmt(h / 4)}. Not one multiplier.` },
    { t: `Yes: the workers and the hours change together`, mc: 'mc.ratio-rate.scales-non-proportional', say: `Changing together is not enough. Here one goes up while the other goes down.` },
    { t: `Yes: double the workers, half the hours`, mc: 'mc.ratio-rate.scales-non-proportional', say: `Halving is not multiplying by one fixed k. ${h} ÷ 1 and ${h / 2} ÷ 2 differ.` },
  ]);
};

// 17. build a counterexample [premise-counterexample]
const buildCounter: Gen = (R, n) => {
  const kind = pick(R, ['origin', 'straight', 'increase', 'double'] as const);
  const a = int(R, 2, 4), b = int(R, 1, 5);
  let claim = '', opts: Opt[] = [];
  if (kind === 'origin') {
    claim = 'Any graph through (0, 0) is proportional.';
    opts = [
      { t: `y = ${a}x²: (0, 0) is on it, but (1, ${a}) and (2, ${4 * a}) give y ÷ x = ${a} and ${2 * a}`, ok: true, say: 'Yes: it meets the claim (through the origin) and still is not proportional.' },
      { t: `y = x + ${b}: it misses (0, 0)`, mc: 'mc.reasoning-language.counterexample-violates-premise', say: `That graph does not go through (0, 0), so it does not test the claim. A counterexample must meet the "if" part.` },
      { t: `A graph through (0, 0) can still be curved.`, mc: 'mc.reasoning-language.statement-instead-of-counterexample', say: 'True, but that is a statement. A counterexample is one specific graph that shows it.' },
    ];
  } else if (kind === 'straight') {
    claim = 'Any straight-line graph is proportional.';
    opts = [
      { t: `y = ${a}x + ${b}: straight, but at x = 0 it gives ${b}, not 0`, ok: true, say: 'Yes: straight (meets the claim), and not proportional.' },
      { t: `y = x²: it is not proportional`, mc: 'mc.reasoning-language.counterexample-violates-premise', say: 'y = x² is not straight, so it says nothing about straight lines.' },
      { t: `Straight lines that miss (0, 0) are not proportional.`, mc: 'mc.reasoning-language.statement-instead-of-counterexample', say: 'True, but name one: a specific straight line that misses (0, 0).' },
    ];
  } else if (kind === 'increase') {
    claim = 'If y goes up whenever x goes up, y is proportional to x.';
    opts = [
      { t: `y = x + ${b}: it goes up with x, but 1 → ${1 + b} and 2 → ${2 + b} give different y ÷ x`, ok: true, say: 'Yes: it meets the "goes up" part and is not proportional.' },
      { t: `y = ${10 + b} − x: it goes down`, mc: 'mc.reasoning-language.counterexample-violates-premise', say: 'That one goes down, so it does not meet the claim. Find one that goes up and still is not proportional.' },
      { t: `Going up together is not the same as one multiplier.`, mc: 'mc.reasoning-language.statement-instead-of-counterexample', say: 'True, but that is a statement. Give one specific example.' },
    ];
  } else {
    claim = 'If doubling x from 1 to 2 doubles y, then y is proportional to x.';
    opts = [
      { t: `1 → ${a}, 2 → ${2 * a}, 3 → ${3 * a + 1}: doubling works, but 3 gives ${3 * a + 1}, not ${3 * a}`, ok: true, say: 'Yes: it passes the doubling check and still is not proportional.' },
      { t: `1 → ${a}, 2 → ${2 * a + 1}: doubling x does not double y`, mc: 'mc.reasoning-language.counterexample-violates-premise', say: 'That one fails the doubling check, so it does not meet the claim.' },
      { t: `One doubling check does not prove it for every x.`, mc: 'mc.reasoning-language.statement-instead-of-counterexample', say: 'True, but give one specific table that shows it.' },
    ];
  }
  return choiceItem({ id: `bc-${kind}-${n}`, family: 'buildCounter', prompt: `Claim: “${claim}” Which is a counterexample?`, board: `\\text{meets the claim, but not proportional}`,
    solution: ['A counterexample meets the claim’s “if” part', 'and still is not proportional.'] }, R, opts);
};

// 18. use the rate [apply-model]
const applyModel: Gen = (R, n) => {
  const kind = pick(R, ['unit', 'speed', 'fee'] as const);
  if (kind === 'fee') {
    const F = pick(R, [5, 8, 10]), r = pick(R, [3, 4, 6]), a = 2, b = pick(R, [5, 6]);
    const ca = F + r * a, cb = F + r * b;
    return mkNum({ id: `am-f-${n}`, family: 'applyModel', prompt: `A bike rental is ${$(F)} plus ${$(r)} per hour. ${A(`${a} hours`)} cost ${B($(ca))}. What do ${A(`${b} hours`)} cost?`, board: `${a} \\to \\$${ca},\\quad ${b} \\to\\ ?`, unit: 'dollars',
      solution: [`Not proportional: there is a ${$(F)} fee.`, `${F} + ${r} × ${b} = ${cb}.`] }, cb, [
      { v: ca * b / a, mc: 'mc.ratio-rate.scales-non-proportional', say: `Scaling ${$(ca)} up only works without a fee. ${F} + ${r} × ${b} = ${cb}.` },
    ], `Add the fee to ${r} × ${b}.`);
  }
  if (kind === 'speed') {
    const v = pick(R, [40, 48, 50, 60]), t1 = pick(R, [1.5, 2, 2.5]), t2 = pick(R, [3, 4, 3.5].filter(x => x !== t1));
    const d1 = times(v, t1), d2 = times(v, t2);
    return mkNum({ id: `am-s-${n}`, family: 'applyModel', prompt: `A bus goes ${A(`${fmt(d1)} miles`)} in ${B(`${fmt(t1)} hours`)} at a steady speed. How far does it go in ${fmt(t2)} hours at the same speed?`, board: `d = rt`, unit: 'miles',
      solution: [`r = ${fmt(d1)} ÷ ${fmt(t1)} = ${v} miles per hour.`, `d = ${v} × ${fmt(t2)} = ${fmt(d2)} miles.`] }, d2, [
      { v: d1 + (t2 - t1), say: `Find the speed first: ${fmt(d1)} ÷ ${fmt(t1)} = ${v}.` },
    ], `Speed = ${fmt(d1)} ÷ ${fmt(t1)}, then multiply by ${fmt(t2)}.`);
  }
  const s = pick(R, SKINS.filter(x => x.money && !x.discrete));
  const k = pick(R, s.ks), tx = pick(R, [1.5, 2.5, 3.5, 0.5, 4.5].filter(v => timesExact(k, v)));
  const ty = times(k, tx);
  return mkNum({ id: `am-u-${n}`, family: 'applyModel', prompt: `${s.id === 'trail' ? 'Trail mix' : 'Gas'} costs ${$(k)} per ${s.x1}, for any amount. What do ${A(xAmt(s, tx))} cost? (check: between ${$(times(k, Math.floor(tx)))} and ${$(times(k, Math.ceil(tx)))})`, board: `c = ${fmt(k)}${s.L[0]}`, unit: 'dollars',
    solution: [`c = ${fmt(k)} × ${fmt(tx)} = ${money(ty)}.`] }, ty, [
    { v: k + tx, mc: 'mc.ratio-rate.wrong-form-proportional-equation', say: `Multiply the rate by the amount: ${fmt(k)} × ${fmt(tx)} = ${money(ty)}.` },
  ], `Multiply: ${fmt(k)} × ${fmt(tx)}.`);
};

// 19. proven, refuted, or only consistent [evidence-vs-guarantee]
const evidence: Gen = (R, n) => {
  const kind = pick(R, ['sample', 'rule', 'fee', 'bulk', 'twoPts', 'spring'] as const);
  const PR = 'Proven proportional: the situation fixes one rate', RF = 'Refuted: a counterexample shows it is not proportional', CO = 'Only consistent: the data fit, but nothing guarantees the rest';
  let prompt = '', right = '', board = '';
  const who = pick(R, NAMES);
  if (kind === 'sample') { const k = pick(R, [0.5, 1.5, 2]); prompt = `${who} timed a candle: after 1 hour it had burned ${fmt(k)} cm, after 2 hours ${fmt(2 * k)} cm, after 4 hours ${fmt(4 * k)} cm. Is the length burned proportional to the time?`; right = CO; board = `${fmt(k)},\\ ${fmt(2 * k)},\\ ${fmt(4 * k)}`; }
  else if (kind === 'rule') { const p = pick(R, [0.73, 0.68, 1.25]); prompt = `Stamps cost ${$(p)} each, with no other fees. Is the cost proportional to the number of stamps?`; right = PR; board = `c = ${money(p)}n`; }
  else if (kind === 'fee') { const f = pick(R, [15, 20, 25]), r = pick(R, [5, 10]); prompt = `A phone plan is ${$(f)} a month plus ${$(r)} per GB. Is the monthly cost proportional to the GB used?`; right = RF; board = `0 \\to ${f}`; }
  else if (kind === 'bulk') { const e = pick(R, [2, 3]), m = 10, d = e * m - 5; prompt = `Pens cost ${$(e)} each, or 10 for ${$(d)}. Is the cost proportional to the number of pens?`; right = RF; board = `1 \\to ${e},\\ 10 \\to ${d}`; }
  else if (kind === 'twoPts') { const k = pick(R, [3, 4, 6]); prompt = `${who} checked two points of a plant’s growth: (2 weeks, ${2 * k} cm) and (4 weeks, ${4 * k} cm). ${who} says the height is proportional to the time. Is that settled?`; right = CO; board = `(2, ${2 * k}),\\ (4, ${4 * k})`; }
  else { const k = pick(R, [2, 3]); prompt = `A spring stretched ${k} cm with 1 weight, ${2 * k} cm with 2 weights and ${3 * k} cm with 3 weights. Nobody tested more weights. Is the stretch proportional to the number of weights?`; right = CO; board = `${k},\\ ${2 * k},\\ ${3 * k}`; }
  const opts: Opt[] = [PR, RF, CO].map(t => ({ t, ok: t === right, say: '' }));
  for (const o of opts) {
    if (o.ok) { o.say = right === PR ? 'Right: a fixed price per item guarantees one multiplier for every amount.' : right === RF ? 'Right: one counterexample settles it.' : 'Right: the measured points fit, but nothing promises the rest.'; continue; }
    if (o.t === PR) { o.mc = 'mc.reasoning-language.examples-as-proof'; o.say = right === CO ? 'A few checked cases are not proof: nothing in the situation fixes the rate for amounts nobody measured.' : 'There is a fee or a discount: the rate is not the same for every amount.'; }
    else if (o.t === RF) o.say = right === CO ? 'Nothing in the data breaks the pattern. It fits, but is not proven.' : 'There is no counterexample here: every stamp costs the same.';
    else o.say = right === PR ? 'Here the rule itself fixes the price per item, so it is proven, not just consistent.' : 'There is a clear counterexample (the fee or the discount): refuted.';
    if (o.t === PR && right === RF) o.mc = 'mc.ratio-rate.scales-non-proportional';
  }
  return choiceItem({ id: `ev-${kind}-${n}`, family: 'evidence', prompt, board, solution: [right === PR ? 'A rule that fixes one rate per unit: proven.' : right === RF ? 'A fee or a changing rate is a counterexample: refuted.' : 'Data that fit, with no rule: only consistent.'] }, R, opts);
};

export const GENS: Record<FamilyId, Gen> = {
  tableTest: tableTest_, rowRate, zeroRow, situation, nameK, writeEq, plotPoint, readScale, domain,
  graphTest, interpret, kGraph, translate, counterRatio, fixedFee, changingRate, buildCounter, applyModel, evidence,
};
export const GENERATORS = GENS;
