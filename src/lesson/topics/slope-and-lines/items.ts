// items.ts: practice families for "Proportional and linear relationships: slope, graphs, and equations"
// (secondary-t5-29). Every family is a template checked exactly (slopeMaths: exact rationals) and every wrong answer
// the classifier recognises carries its misconception id from math-curriculum-essentials/misconceptions.json.
// A generator gets the SUB-GOAL it practises (plan.ts) and uses that sub-goal's number ranges and cases.
// Pictures: most items carry a SlopeGrid (graph) or a TableCard (table); `hide` lists the steps that appear only in
// the worked solution after a miss (never the answer before the kid answers). Pure: no DOM.
import { type Item, type Response, type Verdict, fr, int, pick, shuffle } from '../../runtime/item';
import { endOnChoice } from '../../runtime/explain';
import { frame } from '../../../blocks/block';
import type { Theme } from '../../../core/theme';
import * as S from './slopeMaths';
import { type Q, rat, qNum, qEq, qMul, qDiv, qAdd } from './slopeMaths';
import { SlopeGrid, type SlopeGridParams, type SGLine, type SGPoint, type SGTri } from './SlopeGrid';
import { TableCard, type TableParams } from './TableCard';

export type Pic = { graph?: SlopeGridParams; table?: TableParams; hide?: string[]; solveTex?: string[] };
export interface SlItem extends Item { picture?: Pic }
type G = (R: () => number, n: number, sg?: string) => SlItem;

export const MC = {
  outVal: 'mc.linear-functions.output-value-as-change', order: 'mc.linear-functions.inconsistent-subtraction-order',
  step: 'mc.linear-functions.ignores-input-step', inverted: 'mc.linear-functions.rise-run-inverted',
  interval: 'mc.measurement-units.misjudges-interval-value', steep: 'mc.linear-functions.steepness-ignores-scale',
  hypo: 'mc.geometric-proof.cites-theorem-without-checking-hypotheses', looks: 'mc.transformations.similarity-judged-by-appearance',
  parallelTri: 'mc.transformations.slope-triangles-not-similar', depends: 'mc.linear-functions.slope-depends-on-points',
  sign: 'mc.linear-functions.drops-slope-sign', height: 'mc.linear-functions.slope-as-height',
  flatZero: 'mc.data-displays.flat-segment-as-zero', kOver0: 'mc.calculus.zero-over-k-vs-k-over-zero',
  noSlope: 'mc.linear-functions.no-slope-conflates-zero-and-undefined', swapXY: 'mc.coordinate-geometry.reverses-coordinate-order',
  sketch: 'mc.linear-functions.point-membership-from-sketch', template: 'mc.linear-functions.template-without-meaning',
  propB: 'mc.ratio-rate.proportional-equation-allows-nonzero-intercept', kInv: 'mc.ratio-rate.scale-factor-inverted',
  multNotDiv: 'mc.ratio-rate.multiplies-by-rate-when-dividing-needed', only1k: 'mc.linear-functions.graphs-only-through-1-k',
  interceptSwap: 'mc.linear-functions.intercept-zero-swap', firstOut: 'mc.linear-functions.first-output-as-intercept',
  swapMB: 'mc.linear-functions.swaps-m-and-b', linProp: 'mc.linear-functions.linear-means-proportional',
  dropB: 'mc.linear-functions.drops-start-value', fracCount: 'mc.functions-concept.discrete-quantity-allows-fractions',
  beyond: 'mc.functions-concept.graphs-beyond-restricted-interval', perUnit: 'mc.linear-functions.rate-without-per-unit',
  scalesNP: 'mc.ratio-rate.scales-non-proportional', dichotomy: 'mc.linear-functions.linear-proportional-dichotomy',
  origin: 'mc.ratio-rate.origin-alone-means-proportional', constProp: 'mc.ratio-rate.constant-present-means-proportional',
  divForm: 'mc.ratio-rate.division-form-rejected-as-proportional', examples: 'mc.reasoning-language.examples-as-proof',
  backSolve: 'mc.linear-functions.intercept-sign-error-back-solve', negAmount: 'mc.linear-functions.negative-rate-as-negative-amount',
  feeTimes: 'mc.linear-functions.multiplies-fee-by-input', inputUnits: 'mc.linear-functions.intercept-has-input-units',
  illusion: 'mc.linear-functions.illusion-of-linearity',
} as const;

// ---------- picture fit (the page draws the same layout; a picture that does not fit falls back to a slate) ----------
export const PIC_FRAME = frame(60, 70, 940, 940);
const TH = {} as Theme;
/** the last layout error (for debugging a family whose pictures do not fit) */
export const FIT = { last: '' };
export function picFits(p: Pic): boolean {
  try { if (p.graph) SlopeGrid(p.graph, PIC_FRAME, TH); if (p.table) TableCard(p.table, PIC_FRAME, TH); return true; } catch (e) { FIT.last = (e as Error).message; return false; }
}
/** retry a builder until its picture fits (a few numbers rarely crowd a label out); the last try keeps no picture */
function fitted(make: () => SlItem): SlItem {
  let it = make();
  for (let t = 0; t < 40 && it.picture && !picFits(it.picture); t++) it = make();
  if (it.picture && !picFits(it.picture)) it.picture = undefined;
  return it;
}

// ---------- numbers and text ----------
const F = S.fmt, Qh = S.qHtml, Qt = S.qTex;
const X = '<i>x</i>', Yv = '<i>y</i>';
const a = (s: string | number) => `<b class="a">${s}</b>`, b = (s: string | number) => `<b class="b">${s}</b>`, sOk = (s: string | number) => `<b class="s">${s}</b>`;
const EPS = 1e-9;
const eqv = (v: number, t: number | Q) => Math.abs(v - (typeof t === 'number' ? t : qNum(t))) < EPS;
function val(r: Response): number | null {
  if (r.kind === 'num') return Number.isFinite(r.v) ? r.v : null;
  if (r.kind === 'frac') {
    if (![r.w, r.n, r.d].every(Number.isFinite) || r.d === 0) return null;
    return r.w < 0 ? r.w - r.n / r.d : r.w + r.n / r.d;
  }
  return null;
}
type Cand = [number | Q | null, string | undefined, string];
interface Base { id: string; family: string; prompt: string; board: string; solution: string[]; picture?: Pic; unit?: string }
/** a number answer (input 'num', or 'frac' for a positive rational) with misconception candidates */
function numAns(base: Base, ans: number | Q, input: 'num' | 'frac', ok: string, cands: Cand[], other: string): SlItem {
  const A = typeof ans === 'number' ? S.q(ans) : ans;
  if (input === 'frac' && A.p < 0) throw new Error('numAns: a fraction box takes positive answers only');
  return {
    ...base, input, answer: input === 'frac' ? { kind: 'frac', w: 0, n: A.p, d: A.q } : { kind: 'num', v: qNum(A) },
    check: (r: Response): Verdict => {
      const v = val(r);
      if (v === null) return { ok: false, say: input === 'frac' ? 'Type a number or a fraction.' : 'Type a number (a decimal is fine).' };
      if (eqv(v, A)) return { ok: true, say: ok };
      for (const [c, mc, say] of cands) if (c !== null && !eqv(qNum(typeof c === 'number' ? S.q(c) : c), A) && eqv(v, c)) return { ok: false, mc, say };
      return { ok: false, say: other };
    },
  };
}
type PCand = [[number, number], string | undefined, string];
function pairAns(base: Base & { pairLead: string; pairOp: string; pairTail?: string }, ans: [number, number], ok: string, cands: PCand[], other: string): SlItem {
  return {
    ...base, input: 'pair', answer: { kind: 'pair', x: ans[0], y: ans[1] },
    check: (r: Response): Verdict => {
      if (r.kind !== 'pair' || !Number.isFinite(r.x) || !Number.isFinite(r.y)) return { ok: false, say: 'Fill in both boxes with numbers.' };
      if (eqv(r.x, ans[0]) && eqv(r.y, ans[1])) return { ok: true, say: ok };
      for (const [[cx, cy], mc, say] of cands) if (!(eqv(cx, ans[0]) && eqv(cy, ans[1])) && eqv(r.x, cx) && eqv(r.y, cy)) return { ok: false, mc, say };
      return { ok: false, say: other };
    },
  };
}
interface Opt { t: string; ok?: boolean; mc?: string; say: string }
function choice(R: () => number, base: Base, opts: Opt[], keepOrder = false): SlItem {
  const o = keepOrder ? opts.slice() : shuffle(R, opts.slice());
  const i = o.findIndex(x => x.ok);
  return {
    ...base, input: 'choice', choices: o.map(x => x.t), answer: { kind: 'choice', i }, solution: endOnChoice(base.solution, o[i]!.t),
    check: (r: Response): Verdict => {
      if (r.kind !== 'choice' || !o[r.i]) return { ok: false, say: 'Pick one of the answers.' };
      const c = o[r.i]!;
      return { ok: !!c.ok, mc: c.mc, say: c.say };
    },
  };
}
const pt = (id: string, x: number, y: number, label: boolean | string = true, role?: SGPoint['role']): SGPoint => ({ id, x, y, label, role });
const tri = (id: string, A: S.P2, B: S.P2, run?: string, rise?: string): SGTri => ({ id, a: A, b: B, run, rise });
const triSteps = (id: string, labels = true) => ['tri:' + id, ...(labels ? ['run:' + id, 'rise:' + id] : [])];
/** axes that hold the values with a friendly step (<= 14 cells), from 0 when everything is >= 0 */
const STEPS = [0.5, 1, 2, 5, 10, 20, 25, 50, 100, 200];
function axis(vals: number[], o: { pad?: boolean; minCells?: number } = {}): [number, number, number] {
  const lo = Math.min(0, ...vals), hi = Math.max(0, ...vals);
  const step = STEPS.find(s => s >= 1 && (hi - lo) / s <= 12) ?? 200;
  let a0 = Math.floor(lo / step + EPS) * step, a1 = Math.ceil(hi / step - EPS) * step;
  if (lo < 0 && a0 === lo) a0 -= step;
  if (a1 === hi && hi > 0) a1 += step;
  if (hi === 0 && a1 === 0) a1 = step;
  while ((a1 - a0) / step < (o.minCells ?? 6)) { a1 += step; if ((a1 - a0) / step < (o.minCells ?? 6) && a0 < 0) a0 -= step; }
  return [a0, a1, step];
}
function grid(xs: number[], ys: number[], o: { xName?: string; yName?: string; xStep?: number; yStep?: number } = {}): SlopeGridParams {
  let [x0, x1, xs_] = axis(xs), [y0, y1, ys_] = axis(ys);
  if (o.xStep) { xs_ = o.xStep; x0 = Math.floor(Math.min(0, ...xs) / xs_) * xs_; x1 = Math.ceil(Math.max(0, ...xs) / xs_ + EPS) * xs_ + xs_; }
  if (o.yStep) { ys_ = o.yStep; y0 = Math.floor(Math.min(0, ...ys) / ys_) * ys_; y1 = Math.ceil(Math.max(0, ...ys) / ys_ + EPS) * ys_ + ys_; }
  return { x0, x1, y0, y1, xStep: xs_, yStep: ys_, xName: o.xName, yName: o.yName };
}
const signedH = (v: number | Q) => S.signed(v);
const sgnWord = (v: number) => (v < 0 ? 'down' : 'up');

// ---------- contexts ----------
interface Ctx { xn: string; yn: string; xu: string; xus: string; yus: string; per: string; money?: boolean; what: string }
const CTX: Record<string, Ctx> = {
  drive: { xn: 'time (h)', yn: 'distance (mi)', xu: 'hour', xus: 'hours', yus: 'miles', per: 'miles per hour', what: 'A car on the highway' },
  fill: { xn: 'time (min)', yn: 'water (gal)', xu: 'minute', xus: 'minutes', yus: 'gallons', per: 'gallons per minute', what: 'A pool filling up' },
  buy: { xn: 'weight (lb)', yn: 'cost ($)', xu: 'pound', xus: 'pounds', yus: 'dollars', per: 'dollars per pound', money: true, what: 'Grapes at the market' },
  pay: { xn: 'time (h)', yn: 'pay ($)', xu: 'hour', xus: 'hours', yus: 'dollars', per: 'dollars per hour', money: true, what: 'A summer job' },
  print: { xn: 'time (min)', yn: 'pages', xu: 'minute', xus: 'minutes', yus: 'pages', per: 'pages per minute', what: 'A printer' },
};

// =====================================================================================================================
// 1 unit-rate-run-one
const unitRate: G = (R, n) => fitted(() => {
  const kind = pick(R, ['whole', 'frac', 'money'] as const);
  let k: Q, d = 1;
  if (kind === 'whole') k = rat(int(R, 2, 5));
  else if (kind === 'frac') { const [p, qq] = pick(R, [[2, 3], [1, 2], [3, 4], [3, 2], [1, 3], [5, 2]] as const); k = rat(p, qq); d = qq; }
  else k = S.q(pick(R, [1.25, 1.5, 2.5, 0.75, 2.25]));
  const money = kind === 'money';
  const x1 = kind === 'whole' ? int(R, 2, 3) : kind === 'frac' ? d : 4, x2 = kind === 'whole' ? x1 + int(R, 1, 2) : 2 * x1;
  const y1 = qNum(qMul(k, rat(x1))), y2 = qNum(qMul(k, rat(x2)));
  const g = grid([x2 + 1], [y2], money ? { xName: 'weight (lb)', yName: 'cost ($)' } : {});
  const ky = qNum(k);
  g.lines = [{ id: 'L', m: ky, b: 0, ends: money ? 'ray' : 'full', from: money ? 0 : undefined }];
  g.points = [pt('p1', x1, y1), pt('p2', x2, y2), pt('one', 1, ky, `(1, ${S.qText(k)})`, 'pick')];
  g.tris = [tri('u', [x1, y1], [x1 + 1, qNum(qMul(k, rat(x1 + 1)))], '1', S.qText(k))];
  const prompt = money
    ? `Grapes cost the same amount per pound. The graph shows ${a('weight')} and ${b('cost')}. What is the unit rate, the slope of the line: dollars per ${a('1 pound')}?`
    : `The line goes through (0, 0). How far does it go ${b('up')} for each ${a('1')} it goes to the right? That unit rate is its slope.`;
  return numAns({
    id: `unitRate-${n}`, family: 'unitRate', prompt, board: `${S.ptTex(x1, y1)},\\ ${S.ptTex(x2, y2)}:\\quad \\text{rise for a run of } 1 = \\,?`, unit: money ? 'dollars per pound' : '',
    solution: [`From ${S.ptHtml(x1, y1)} to ${S.ptHtml(x2, y2)}: ${a(`${x2 - x1} across`)}, ${b(`${F(y2 - y1)} up`)}.`,
      `For ${a('1 across')}: ${F(y2 - y1)} ÷ ${x2 - x1} = ${sOk(Qh(k))}. That is the slope.`],
    picture: { graph: g, hide: ['pt:one', 'ptl:one', ...triSteps('u')], solveTex: [`\\frac{${F(y2 - y1).replace('−', '-')}}{${x2 - x1}} = ${Qt(k, true)}`] },
  }, k, 'frac', `Yes: the slope is ${Qh(k)}${money ? ' dollars per pound' : ''}. Each 1 to the right, the line goes up ${Qh(k)}.`, [
    [y2, MC.outVal, `${F(y2)} is the height of the line at ${X} = ${x2}, not how much it climbs for a run of 1.`],
    [y1, MC.outVal, `${F(y1)} is the height at ${X} = ${x1}. The slope is the climb for 1 step right.`],
    [S.qDiv(rat(1), k), MC.kInv, `That is ${a('run')} ÷ ${b('rise')}. Slope is rise ÷ run: how far up for 1 across.`],
  ], `Look at the climb for 1 step to the right: ${F(y2 - y1)} up for ${x2 - x1} across.`);
});
const rateTable: G = (R, n, sg) => fitted(() => {
  if (sg === 'unit-rate-run-one') {
    const c = pick(R, [CTX.buy!, CTX.pay!, CTX.print!]);
    const k = c === CTX.buy ? pick(R, [1.25, 1.5, 2.5, 0.75, 3.5]) : c === CTX.pay ? pick(R, [12, 14, 15, 16, 18]) : pick(R, [6, 8, 12, 15]);
    const x0 = int(R, 1, 3), xs = [x0, x0 + 1, x0 + 2, x0 + 3], money = !!c.money;
    const cell = (v: number) => (money ? '$' : '') + F(v, money);
    const table: TableParams = { heads: [c.xus, c === CTX.buy ? 'cost ($)' : c === CTX.pay ? 'pay ($)' : c.yus], rows: xs.map(x => [String(x), cell(k * x)]), gaps: [{ i: 0, j: 1, dx: '+1', dy: '+' + F(k, money) }] };
    const unitTxt = (v: number) => `${money ? '$' : ''}${F(v, money)} per ${c.xu}`;
    return choice(R, {
      id: `rateTable-${n}`, family: 'rateTable', prompt: `${c.what}: the table goes up by ${a(`1 ${c.xu}`)} each row. What is the unit rate, the slope of its graph?`,
      board: `(${xs[0]},\\ ${S.tnum(k * xs[0]!, money)}),\\ (${xs[1]},\\ ${S.tnum(k * xs[1]!, money)}),\\ \\dots`,
      solution: [`Each row: ${a(`+1 ${c.xu}`)} and ${b(`+${cell(k)}`)}.`, `The change for 1 ${c.xu} is the unit rate: ${sOk(unitTxt(k))}. On the graph, that is the slope.`],
      picture: { table, hide: ['gap:0'] },
    }, [
      { t: unitTxt(k), ok: true, say: `Yes: ${unitTxt(k)}. The unit rate is the slope of the graph.` },
      { t: unitTxt(k * xs[3]!), mc: MC.outVal, say: `${cell(k * xs[3]!)} is the total for ${xs[3]} ${c.xus}, not the change for 1.` },
      { t: `${F(Math.round(1000 / k) / 1000)} ${c.xus} per ${c.money ? 'dollar' : c.yus.replace(/s$/, '')}`, mc: MC.kInv, say: `That is ${c.xus} for each one of the outputs: run ÷ rise. The slope is the output change for 1 ${c.xu}.` },
    ]);
  }
  if (sg === 'nonlinear-varying-rate') {
    const sh = pick(R, ['sq', 'sq2', 'sqc'] as const), c0 = sh === 'sqc' ? int(R, 1, 5) : 0, A2 = sh === 'sq2' ? 2 : 1;
    const xs = pick(R, [[0, 1, 3, 4], [0, 2, 3, 5], [1, 2, 4, 5], [0, 1, 2, 4]]);
    const f = (x: number) => A2 * x * x + c0;
    const i = int(R, 0, 2), j = i + 1, x1 = xs[i]!, x2 = xs[j]!, dy = f(x2) - f(x1), dx = x2 - x1, r = dy / dx;
    const table: TableParams = { heads: ['x', 'y'], rows: xs.map(x => [String(x), String(f(x))]), gaps: xs.slice(1).map((x, k) => ({ i: k, j: k + 1, dx: '+' + (x - xs[k]!), dy: '+' + (f(x) - f(xs[k]!)) })) };
    const others = xs.slice(1).map((x, k) => (f(x) - f(xs[k]!)) / (x - xs[k]!));
    return numAns({
      id: `rateTable-${n}`, family: 'rateTable', prompt: `Find the rate of change from ${X} = ${a(x1)} to ${X} = ${a(x2)}: change in ${Yv} ÷ change in ${X}.`,
      board: `${S.ptTex(x1, f(x1))} \\ \\to\\ ${S.ptTex(x2, f(x2))}:\\quad \\frac{\\Delta y}{\\Delta x} = \\,?`,
      solution: [`From ${X} = ${x1} to ${x2}: ${a(`+${dx}`)} across, ${b(`+${dy}`)} up.`, `${dy} ÷ ${dx} = ${sOk(F(r))}.`,
        `The other rows give ${others.map(v => F(v)).join(', ')}. The rate changes, so the table is not linear.`],
      picture: { table, hide: table.gaps!.map((_, k) => 'gap:' + k) },
    }, r, 'num', `Yes: ${dy} ÷ ${dx} = ${F(r)}. Compare it with the other rows: ${others.map(v => F(v)).join(', ')}. A changing rate means not linear.`, [
      [dx === 1 ? null : dy, MC.step, `${dy} is the change in ${Yv} for ${dx} steps of ${X}. Divide by the change in ${X}.`],
      [f(x2) / x2, MC.outVal, `That is ${Yv} ÷ ${X} at one row. The rate uses the CHANGES between two rows.`],
    ], `Subtract the ${Yv}-values and the ${X}-values of the two rows, then divide.`);
  }
  // negative-slope and uneven-table-rate: a linear table, maybe uneven, unsorted or decreasing
  const neg = sg === 'negative-slope' || R() < 0.4;
  const m = neg ? -pick(R, [1, 1.5, 2, 2.5, 3, 4, 5]) : pick(R, [1.5, 2, 2.5, 3, 4, 5, 6]);
  const xs = sg === 'negative-slope' ? pick(R, [[0, 1, 2, 3], [0, 2, 4, 6], [0, 1, 2, 3, 4]]) : pick(R, [[0, 3, 4, 10], [0, 2, 4, 6], [0, 5, 10, 15], [1, 3, 4, 8], [0, 2, 3, 7], [2, 4, 5, 9]]);
  const b0 = neg ? int(R, 20, 40) : int(R, 0, 12);
  const rows = xs.map(x => [x, m * x + b0] as [number, number]);
  if (rows.some(r => !Number.isInteger(r[1] * 2))) return rateTable(R, n, sg);
  const shown = sg === 'uneven-table-rate' && R() < 0.4 ? shuffle(R, rows.slice()) : rows;
  const c = neg ? pick(R, ['tank', 'battery', 'x'] as const) : pick(R, ['x', 'pages', 'x'] as const);
  const heads = c === 'tank' ? ['minutes', 'gallons'] : c === 'battery' ? ['hours', 'charge (%)'] : c === 'pages' ? ['minutes', 'pages'] : ['x', 'y'];
  const table: TableParams = { heads, rows: shown.map(r => [F(r[0]), F(r[1])]), gaps: [{ i: 0, j: 1, dx: signedH(shown[1]![0] - shown[0]![0]), dy: signedH(shown[1]![1] - shown[0]![1]) }] };
  const d0 = rows[1]![1] - rows[0]![1], dx0 = rows[1]![0] - rows[0]![0];
  const unit = c === 'tank' ? 'gallons per minute' : c === 'battery' ? 'percent per hour' : c === 'pages' ? 'pages per minute' : '';
  const sorted = shown !== rows;
  return numAns({
    id: `rateTable-${n}`, family: 'rateTable',
    prompt: `${c === 'tank' ? 'A tank drains at a steady rate.' : c === 'battery' ? 'A phone battery runs down at a steady rate.' : c === 'pages' ? 'A printer prints at a steady rate.' : 'The table shows a linear relationship.'} What is the rate of change, the slope? ${sorted ? 'Careful: the rows are not in order.' : xs[1]! - xs[0]! !== 1 ? `Careful: ${X} does not go up by 1.` : ''}`,
    board: `${S.ptTex(shown[0]![0], shown[0]![1])},\\ ${S.ptTex(shown[1]![0], shown[1]![1])},\\ \\dots\\quad m = \\,?`, unit,
    solution: [`Take two rows: ${S.ptHtml(shown[0]![0], shown[0]![1])} and ${S.ptHtml(shown[1]![0], shown[1]![1])}.`,
      `Change in ${X}: ${a(signedH(shown[1]![0] - shown[0]![0]))}. Change in ${Yv}: ${b(signedH(shown[1]![1] - shown[0]![1]))}.`,
      `Slope = ${F(shown[1]![1] - shown[0]![1])} ÷ ${F(shown[1]![0] - shown[0]![0])} = ${sOk(F(m))}${unit ? ' ' + unit : ''}.`],
    picture: { table, hide: ['gap:0'] },
  }, m, 'num', `Yes: ${F(m)}${unit ? ' ' + unit : ''}. ${m < 0 ? 'The minus sign says the output goes down.' : ''}`, [
    [d0, dx0 === 1 ? undefined : MC.step, dx0 === 1 ? '' : `${F(d0)} is the change for ${dx0} steps of ${X}. Divide by the change in ${X}.`],
    [shown[1]![1] - shown[0]![1], MC.step, `${F(shown[1]![1] - shown[0]![1])} is the change in ${Yv} for a change of ${F(shown[1]![0] - shown[0]![0])} in ${X}. Divide by it.`],
    [-m, MC.sign, `The output goes ${m < 0 ? 'down' : 'up'} as ${X} goes up, so the slope is ${m < 0 ? 'negative' : 'positive'}.`],
  ], `Change in ${Yv} ÷ change in ${X}, between any two rows.`);
});

// 2 paired-changes
const changes: G = (R, n, sg) => fitted(() => {
  const A: [number, number] = [int(R, -8, 8), int(R, -8, 12)];
  let B: [number, number] = [int(R, -8, 14), int(R, -8, 14)];
  if (R() < 0.3) B[0] = 0; else if (R() < 0.3) A[0] = 0;
  if (B[0] === A[0] || B[1] === A[1] || Math.abs(B[0] - A[0]) < 2 || Math.abs(B[1] - A[1]) < 2) return changes(R, n, sg);
  const back = R() < 0.4;
  const [P, Qp] = back ? [B, A] : [A, B];
  const dx = Qp[0] - P[0], dy = Qp[1] - P[1];
  const g = grid([A[0], B[0]], [A[1], B[1]]);
  if ((g.x1 - g.x0) / g.xStep > 24 || (g.y1 - g.y0) / g.yStep > 24) return changes(R, n, sg);
  g.points = [pt('A', A[0], A[1], `A (${F(A[0])}, ${F(A[1])})`), pt('B', B[0], B[1], `B (${F(B[0])}, ${F(B[1])})`)];
  g.tris = [tri('t', P, Qp, signedH(dx), signedH(dy))];
  const from = back ? 'B' : 'A', to = back ? 'A' : 'B';
  return pairAns({
    id: `changes-${n}`, family: 'changes', prompt: `Go from point ${from} to point ${to}. What is the change in ${a(X)} and the change in ${b(Yv)}? Use a minus sign for a decrease.`,
    board: `${from}${S.ptTex(...P)} \\ \\to\\ ${to}${S.ptTex(...Qp)}`, pairLead: 'change in <i>x</i>:', pairOp: 'change in <i>y</i>:',
    solution: [`Always END minus START, for both: ${to} minus ${from}.`, `Change in ${X}: ${F(Qp[0])} − ${F(P[0]) .replace(/^−/, '(−') + (P[0] < 0 ? ')' : '')} = ${a(signedH(dx))}.`,
      `Change in ${Yv}: ${F(Qp[1])} − ${F(P[1]).replace(/^−/, '(−') + (P[1] < 0 ? ')' : '')} = ${b(signedH(dy))}.`],
    picture: { graph: g, hide: triSteps('t') },
  }, [dx, dy], `Yes: ${signedH(dx)} across and ${signedH(dy)} up or down, both measured ${to} minus ${from}.`, [
    [[dx, -dy], MC.order, `Use the same order for both changes. The ${X}-change is ${to} minus ${from}, so the ${Yv}-change is too.`],
    [[-dx, dy], MC.order, `Use the same order for both changes: ${to} minus ${from} for ${X} AND for ${Yv}.`],
    [[-dx, -dy], undefined, `Those are the changes from ${to} to ${from}. The question goes from ${from} to ${to}.`],
    [[Qp[0], Qp[1]], MC.outVal, `Those are the coordinates of ${to}. A change is end minus start.`],
  ], `End minus start: ${to} minus ${from}, for ${X} and for ${Yv}.`);
});
const tableChanges: G = (R, n, sg) => fitted(() => {
  const uneven = sg === 'uneven-table-rate';
  const m = pick(R, [-3, -2, -1.5, 2, 3, 4, 0.5, 1.5]), b0 = int(R, -6, 10);
  const xs = uneven ? pick(R, [[0, 3, 4, 10], [1, 2, 5, 9], [0, 2, 6, 8], [-2, 0, 4, 6]]) : pick(R, [[0, 1, 2, 3], [-1, 0, 1, 2], [2, 3, 4, 5], [-2, -1, 0, 1]]);
  const rows = xs.map(x => [x, m * x + b0] as [number, number]);
  if (rows.some(r => !Number.isInteger(r[1]))) return tableChanges(R, n, sg);
  let i = int(R, 0, 3), j = int(R, 0, 3);
  if (i === j || (!uneven && Math.abs(i - j) > 2)) return tableChanges(R, n, sg);
  if (uneven && Math.abs(i - j) === 1 && R() < 0.5) return tableChanges(R, n, sg);
  const dx = rows[j]![0] - rows[i]![0], dy = rows[j]![1] - rows[i]![1];
  const table: TableParams = { heads: ['x', 'y'], rows: rows.map(r => [F(r[0]), F(r[1])]), gaps: [{ i, j, dx: signedH(dx), dy: signedH(dy) }] };
  return pairAns({
    id: `tableChanges-${n}`, family: 'tableChanges',
    prompt: `Go from the row ${X} = ${a(F(rows[i]![0]))} to the row ${X} = ${a(F(rows[j]![0]))}. What are the change in ${X} and the change in ${Yv}?`,
    board: `x = ${S.tnum(rows[i]![0])} \\ \\to\\ x = ${S.tnum(rows[j]![0])}`, pairLead: 'change in <i>x</i>:', pairOp: 'change in <i>y</i>:',
    solution: [`End row minus start row, for both columns.`, `${X}: ${F(rows[j]![0])} − (${F(rows[i]![0])}) = ${a(signedH(dx))}. ${Yv}: ${F(rows[j]![1])} − (${F(rows[i]![1])}) = ${b(signedH(dy))}.`,
      ...(uneven ? [`So the rate is ${F(dy)} ÷ ${F(dx)} = ${F(m)} per 1 step of ${X}.`] : [])],
    picture: { table, hide: ['gap:0'] },
  }, [dx, dy], `Yes: ${signedH(dx)} in ${X} and ${signedH(dy)} in ${Yv}.`, [
    [[dx, -dy], MC.order, `Same order for both columns: the end row minus the start row.`],
    [[-dx, dy], MC.order, `Same order for both columns: the end row minus the start row.`],
    [[rows[j]![0], rows[j]![1]], MC.outVal, `Those are the values in the end row. The change is end minus start.`],
  ], `End row minus start row, in both columns.`);
});

// 3 change-quotient (and 7 negative-slope): slope from two points
const slopePts: G = (R, n, sg) => fitted(() => {
  const neg = sg === 'negative-slope';
  let run: number, rise: number;
  if (neg) { run = pick(R, [1, 2, 2, 4, 3]); const mm = -pick(R, [0.5, 1, 1.5, 2, 2.5, 3]); rise = mm * run; if (!Number.isInteger(rise)) return slopePts(R, n, sg); }
  else { run = pick(R, [2, 3, 4, 5, 10]); rise = int(R, 1, 3 * run); if (rise === run) rise++; }
  const m = rat(rise, run);
  if (!neg && m.q > 5) return slopePts(R, n, sg);
  const A: [number, number] = neg ? [int(R, -6, 2), int(R, 0, 8)] : [int(R, 0, 6), int(R, 0, 8)];
  const B: [number, number] = [A[0] + run, A[1] + rise];
  if (neg && (A[0] >= 0 && B[1] >= 0) && R() < 0.7) return slopePts(R, n, sg);
  const flip = R() < 0.4, [P, Qp] = flip ? [B, A] : [A, B];
  const g = grid([A[0], B[0]], [A[1], B[1]]);
  if ((g.x1 - g.x0) / g.xStep > 22 || (g.y1 - g.y0) / g.yStep > 22) return slopePts(R, n, sg);
  g.lines = [{ id: 'L', m: qNum(m), b: A[1] - qNum(m) * A[0], role: 'link', ends: 'full' }];
  g.points = [pt('P', P[0], P[1]), pt('Q', Qp[0], Qp[1])];
  g.tris = [tri('t', A, B, String(run), F(rise))];
  const base: Base = {
    id: `slopePts-${n}`, family: 'slopePts', prompt: `A line goes through ${S.ptHtml(P[0], P[1])} and ${S.ptHtml(Qp[0], Qp[1])}. What is its slope?${neg ? '' : ' A fraction is fine.'}`,
    board: `m = \\frac{\\text{change in } y}{\\text{change in } x} = \\,?`,
    solution: [`Change in ${X}: ${a(signedH(Qp[0] - P[0]))}. Change in ${Yv}: ${b(signedH(Qp[1] - P[1]))} (same order).`,
      `Slope = ${F(Qp[1] - P[1])} ÷ ${F(Qp[0] - P[0])} = ${sOk(neg ? F(qNum(m)) : Qh(m))}${neg ? `: down ${F(-qNum(m))} for each 1 across.` : ` for each 1 across.`}`],
    picture: { graph: g, hide: triSteps('t'), solveTex: [`m = \\frac{${S.tnum(Qp[1] - P[1])}}{${S.tnum(Qp[0] - P[0])}} = ${Qt(m, true)}`] },
  };
  return numAns(base, m, neg ? 'num' : 'frac', `Yes: the slope is ${neg ? F(qNum(m)) : Qh(m)}. ${neg ? 'Negative: the line goes down to the right.' : ''}`, [
    [neg ? null : rat(run, rise), MC.inverted, `That is change in ${X} ÷ change in ${Yv}. Slope is ${b('rise')} ÷ ${a('run')}.`],
    [neg ? rat(-run, -rise) : null, MC.inverted, `That is change in ${X} ÷ change in ${Yv}. Slope is ${b('rise')} ÷ ${a('run')}.`],
    [run === 1 ? null : rise, MC.step, `${F(rise)} is the change in ${Yv} for ${run} across. Divide by the run.`],
    [neg ? -qNum(m) : null, MC.sign, `The line goes DOWN as ${X} goes up: the change in ${Yv} is negative, so the slope is too.`],
  ], `Divide the change in ${Yv} by the change in ${X}, both in the same order.`);
});
// 3 change-quotient, 4 scaled-axes-slope: a slope triangle drawn on a graph
const slopeTri: G = (R, n, sg) => fitted(() => {
  const scaled = sg === 'scaled-axes-slope';
  const xs = scaled ? pick(R, [5, 2, 10, 0.5]) : 1, ys = scaled ? pick(R, xs === 5 ? [10, 20, 2] : xs === 2 ? [10, 5, 0.5] : xs === 10 ? [20, 50, 5] : [2, 1, 5]) : 1;
  const cr = int(R, 2, 4), cu = int(R, 1, 5);
  if (cr === cu) return slopeTri(R, n, sg);
  const run = cr * xs, rise = cu * ys, m = S.q(rise / run);
  if (scaled && ![1, 2, 4, 5, 10, 20, 25, 50, 100].includes(m.q)) return slopeTri(R, n, sg);
  if (!scaled && m.q > 4) return slopeTri(R, n, sg);
  const ax = int(R, 0, 3) * xs, ay = int(R, 0, 3) * ys;
  const A: [number, number] = [ax, ay], B: [number, number] = [ax + run, ay + rise];
  const c = scaled ? pick(R, [CTX.drive!, CTX.fill!, CTX.pay!, CTX.print!]) : null;
  const g: SlopeGridParams = { x0: 0, x1: B[0] + 2 * xs, y0: 0, y1: B[1] + 2 * ys, xStep: xs, yStep: ys, xName: c?.xn, yName: c?.yn };
  if (scaled) { while ((g.x1 - g.x0) / xs < 7) g.x1 += xs; while ((g.y1 - g.y0) / ys < 7) g.y1 += ys; }
  g.lines = [{ id: 'L', m: qNum(m), b: ay - qNum(m) * ax, ends: scaled ? 'ray' : 'full', from: scaled ? 0 : undefined }];
  if (scaled && g.lines[0]!.b! < 0) return slopeTri(R, n, sg);
  g.points = [pt('A', A[0], A[1], false), pt('B', B[0], B[1], false)];
  g.tris = [tri('t', A, B, F(run), F(rise))];
  const squares = rat(cu, cr);
  const ans = scaled ? qNum(m) : m;
  return numAns({
    id: `slopeTri-${n}`, family: 'slopeTri',
    prompt: scaled ? `Read the axes carefully: each square across is ${a(F(xs))} and each square up is ${b(F(ys))}. What is the slope of the line${c ? `, in ${c.per}` : ''}?`
      : `Count the slope triangle on the line: how far ${a('across')}, how far ${b('up')}. What is the slope? A fraction is fine.`,
    board: `\\text{from } ${S.ptTex(ax, ay)}:\\quad m = \\frac{\\text{rise}}{\\text{run}} = \\,?`, unit: c ? c.per : '',
    solution: scaled ? [`The run is ${cr} ${cr === 1 ? 'square' : 'squares'} of ${F(xs)}: ${a(F(run))}. The rise is ${cu} ${cu === 1 ? 'square' : 'squares'} of ${F(ys)}: ${b(F(rise))}.`, `Slope = ${F(rise)} ÷ ${F(run)} = ${sOk(F(qNum(m)))}${c ? ' ' + c.per : ''}. Counting squares (${cu} ÷ ${cr}) ignores the scales.`]
      : [`Run: ${a(String(run))} across. Rise: ${b(String(rise))} up.`, `Slope = rise ÷ run = ${rise} ÷ ${run} = ${sOk(Qh(m))}.`],
    picture: { graph: g, hide: ['run:t', 'rise:t'], solveTex: [`m = \\frac{${S.tnum(rise)}}{${S.tnum(run)}} = ${scaled ? S.tnum(qNum(m)) : Qt(m, true)}`] },
  }, ans, scaled ? 'num' : 'frac', `Yes: ${scaled ? F(qNum(m)) : Qh(m)}${c ? ' ' + c.per : ''}.`, [
    [scaled ? squares : null, MC.steep, `${cu} ÷ ${cr} counts squares. Each square across is ${F(xs)} and each square up is ${F(ys)}: use the axis numbers.`],
    [scaled ? S.q(rise / cr) : null, MC.interval, `The run is ${cr} squares of ${F(xs)} each, so ${F(run)}, not ${cr}.`],
    [scaled ? S.q(cu / run) : null, MC.interval, `The rise is ${cu} squares of ${F(ys)} each, so ${F(rise)}, not ${cu}.`],
    [S.qDiv(rat(1), m), MC.inverted, `That is run ÷ rise. Slope is ${b('rise')} ÷ ${a('run')}.`],
    [run === 1 ? null : rise, MC.step, `${F(rise)} is the whole rise. Divide by the run, ${F(run)}.`],
  ], scaled ? 'Use the numbers on the axes, not the squares: rise ÷ run.' : 'Count the run across and the rise up, then divide rise by run.');
});
const slopeMeaning: G = (R, n, sg) => fitted(() => {
  if (sg === 'interpret-m-b-in-context') {
    const v = pick(R, ['temp', 'tank', 'save', 'hike'] as const);
    const m = v === 'temp' ? -int(R, 2, 5) : v === 'tank' ? -int(R, 2, 6) : v === 'save' ? int(R, 5, 15) : int(R, 2, 4);
    const bb = v === 'temp' ? int(R, 60, 80) : v === 'tank' ? int(R, 40, 60) : v === 'save' ? int(R, 20, 60) : int(R, 1, 3);
    const W: Record<typeof v, [string, string, string, string, string]> = {
      temp: ['°F', 'hour', 'time (h)', 'temp (°F)', 'The temperature after sunset'],
      tank: ['gallons', 'minute', 'time (min)', 'water (gal)', 'Water in a tank'],
      save: ['dollars', 'week', 'time (wk)', 'savings ($)', 'Savings in a jar'],
      hike: ['miles', 'hour', 'time (h)', 'distance (mi)', 'A hike'],
    };
    const [yu, xu, xn, yn, what] = W[v];
    const g = grid([8], [bb + 8 * m, bb], { xName: xn, yName: yn });
    g.lines = [{ id: 'L', m, b: bb, ends: 'ray', from: 0 }];
    const mm = Math.abs(m), dir = m < 0 ? (v === 'temp' ? 'drops' : 'goes down') : 'goes up';
    return choice(R, {
      id: `slopeMeaning-${n}`, family: 'slopeMeaning', prompt: `${what}: ${Yv} = ${F(m)}${X} + ${bb}, with ${X} in ${xu}s. What does the slope ${b(F(m))} tell you?`,
      board: `y = ${S.tnum(m)}x + ${bb}`,
      solution: [`The slope is the change in ${Yv} for each 1 ${xu}: output units per input unit.`, `${F(m)} means the amount ${sOk(`${dir} ${mm} ${yu} each ${xu}`)}.`],
      picture: { graph: g },
    }, [
      { t: `It ${dir} ${mm} ${yu} each ${xu}.`, ok: true, say: `Yes: ${mm} ${yu} per ${xu}, ${m < 0 ? 'down' : 'up'}.` },
      { t: m < 0 ? `The amount is ${F(m)} ${yu}.` : `The amount is ${mm} ${yu}.`, mc: m < 0 ? MC.negAmount : MC.perUnit, say: `The slope is not an amount. It is a change per ${xu}: ${mm} ${yu} each ${xu}.` },
      { t: `It ${dir} ${mm} ${yu} in all.`, mc: MC.perUnit, say: `Not in all: EACH ${xu}. A slope is always per 1 unit of the input.` },
      { t: `It ${dir} 1 ${yu.replace(/s$/, '')} every ${mm} ${xu}s.`, mc: MC.inverted, say: `That flips it. The slope is ${yu} per ${xu}: ${mm} ${yu} each ${xu}.` },
    ]);
  }
  const c = pick(R, [CTX.drive!, CTX.pay!, CTX.fill!, CTX.print!]);
  const k = c === CTX.drive ? pick(R, [45, 50, 55, 60, 65]) : c === CTX.pay ? pick(R, [12, 14, 15, 16]) : c === CTX.fill ? pick(R, [4, 6, 8, 12]) : pick(R, [10, 15, 20]);
  const x1 = int(R, 1, 3), x2 = x1 + int(R, 2, 4), y1 = k * x1, y2 = k * x2;
  const g = grid([x2 + 1], [y2], { xName: c.xn, yName: c.yn });
  g.lines = [{ id: 'L', m: k, b: 0, ends: 'ray', from: 0 }];
  g.points = [pt('p', x1, y1, 'P'), pt('q', x2, y2, 'Q')];
  g.tris = [tri('t', [x1, y1], [x2, y2], `${x2 - x1}`, `${y2 - y1}`)];
  const money = !!c.money, M = (v: number) => (money ? '$' + v : `${v} ${c.yus}`);
  return choice(R, {
    id: `slopeMeaning-${n}`, family: 'slopeMeaning', prompt: `${c.what}: the line goes through P${S.ptHtml(x1, y1)} and Q${S.ptHtml(x2, y2)}. What is the slope, and what does it mean?`,
    board: `m = \\frac{${y2} - ${y1}}{${x2} - ${x1}} = \\,?`,
    solution: [`Rise ÷ run = ${y2 - y1} ÷ ${x2 - x1} = ${k}.`, `Its units: ${c.yus} per ${c.xu}. So ${sOk(`${k} ${c.per}`)}: each 1 ${c.xu} adds ${M(k)}.`],
    picture: { graph: g, hide: triSteps('t') },
  }, [
    { t: `${k} ${c.per}`, ok: true, say: `Yes: ${y2 - y1} ÷ ${x2 - x1} = ${k}, so ${k} ${c.per}.` },
    { t: `${y2} ${c.yus}`, mc: MC.outVal, say: `${y2} is a value on the line, not the change for each ${c.xu}.` },
    { t: `${y2 - y1} ${c.per}`, mc: MC.step, say: `${y2 - y1} ${c.yus} is the change over ${x2 - x1} ${c.xus}. Divide by ${x2 - x1} to get the change per ${c.xu}.` },
    { t: `1/${k} ${c.xu} per ${c.yus.replace(/s$/, '')}`, mc: MC.inverted, say: `That is run ÷ rise. The slope is ${c.yus} per ${c.xu}: rise ÷ run.` },
  ]);
});
// 4 scaled-axes-slope: squares counted, then converted with the scales
const squaresToScale: G = (R, n) => fitted(() => {
  const xs = pick(R, [2, 5, 10]), ys = pick(R, [5, 10, 20, 0.5]);
  const cr = int(R, 2, 4), cu = int(R, 1, 5);
  if (cr === cu) return squaresToScale(R, n);
  const m = (cu * ys) / (cr * xs);
  if (!Number.isInteger(m * 100) || m === cu / cr) return squaresToScale(R, n);
  const g: SlopeGridParams = { x0: 0, x1: (cr + 4) * xs, y0: 0, y1: Math.max(7, cu + 3) * ys, xStep: xs, yStep: ys };
  const A: [number, number] = [xs, ys], B: [number, number] = [xs + cr * xs, ys + cu * ys];
  g.lines = [{ id: 'L', m, b: ys - m * xs, ends: 'full' }];
  g.tris = [tri('t', A, B, `${cr} square${cr === 1 ? '' : 's'}`, `${cu} square${cu === 1 ? '' : 's'}`)];
  return numAns({
    id: `squaresToScale-${n}`, family: 'squaresToScale', prompt: `Jada counts the slope triangle: ${a(`${cr} ${cr === 1 ? 'square' : 'squares'} across`)} and ${b(`${cu} ${cu === 1 ? 'square' : 'squares'} up`)}. One square across is ${F(xs)}; one square up is ${F(ys)}. What is the slope?`,
    board: `m = \\frac{${cu} \\times ${S.tnum(ys)}}{${cr} \\times ${xs}} = \\,?`,
    solution: [`Run: ${cr} × ${xs} = ${a(F(cr * xs))}. Rise: ${cu} × ${F(ys)} = ${b(F(cu * ys))}.`, `Slope = ${F(cu * ys)} ÷ ${F(cr * xs)} = ${sOk(F(m))}.`],
    picture: { graph: g, hide: [] },
  }, m, 'num', `Yes: ${F(cu * ys)} ÷ ${F(cr * xs)} = ${F(m)}.`, [
    [cu / cr, MC.steep, `${cu} ÷ ${cr} counts squares. Turn squares into axis units first.`],
    [(cu * ys) / cr, MC.interval, `The run is ${cr} squares of ${xs}: ${cr * xs}, not ${cr}.`],
    [cu / (cr * xs), MC.interval, `The rise is ${cu} squares of ${F(ys)}: ${F(cu * ys)}, not ${cu}.`],
    [(cr * xs) / (cu * ys), MC.inverted, `That is run ÷ rise. Slope is rise ÷ run.`],
  ], 'Turn both counts into axis units, then divide rise by run.');
});

// 5 slope-triangles-similar
const whySimilar: G = (R, n) => fitted(() => {
  const par = R() < 0.35;
  const [p, qq] = pick(R, [[1, 2], [2, 3], [3, 4], [1, 1], [3, 2], [2, 1]] as const);
  const m = p / qq;
  const k1 = 1, k2 = int(R, 2, 3);
  const A: [number, number] = [par ? 0 : int(R, 0, 1) * qq, par ? 0 : int(R, 0, 1) * p];
  const B: [number, number] = [A[0] + qq * k1, A[1] + p * k1];
  const shift = par ? int(R, 2, 4) : 0;
  const C: [number, number] = par ? [qq, p + shift] : [B[0] + int(R, 0, 1) * qq, B[1] + int(R, 0, 1) * p];
  const D: [number, number] = [C[0] + qq * k2, C[1] + p * k2];
  const g = grid([D[0], B[0]], [D[1], B[1]]);
  g.lines = par ? [{ id: 'L', m, b: 0, ends: 'full' }, { id: 'M', m, b: shift, ends: 'full' }] : [{ id: 'L', m, b: A[1] - m * A[0], ends: 'full' }];
  g.tris = [tri('s', A, B, String(qq * k1), String(p * k1)), tri('t', C, D, String(qq * k2), String(p * k2))];
  return choice(R, {
    id: `whySimilar-${n}`, family: 'whySimilar',
    prompt: par ? `The two slope triangles sit on two ${b('parallel')} lines. Are they similar, and why?` : `The two slope triangles sit on the same line. Which reason shows they are similar?`,
    board: `\\text{run } ${qq * k1},\\ \\text{rise } ${p * k1} \\qquad \\text{run } ${qq * k2},\\ \\text{rise } ${p * k2}`,
    solution: [`Right angles, and the ${par ? 'parallel lines cross' : 'line crosses'} the parallel horizontal legs at equal corresponding angles.`,
      `AA: ${sOk('similar')}, so ${p * k1}/${qq * k1} = ${p * k2}/${qq * k2}.`],
    picture: { graph: g, hide: ['ang:s', 'ang:t'] },
  }, [
    { t: 'Similar: right angles, and equal corresponding angles at the parallel legs.', ok: true, say: 'Yes: two equal angles (AA).' },
    { t: 'Similar: they look like the same shape.', mc: MC.looks, say: 'Looks can fool you. Name two equal angles.' },
    { t: 'Similar: all right triangles are similar.', mc: MC.hypo, say: 'Not all: legs 1, 2 and legs 1, 3 differ. You need a second equal angle.' },
    { t: par ? 'Not similar: their long sides are on different lines.' : 'Not similar: one is bigger, so its slope is bigger.', mc: par ? MC.parallelTri : MC.depends, say: par ? 'Parallel lines cross the horizontal legs at the same angle.' : 'Similar triangles can differ in size: same angles, same ratio.' },
  ]);
});
const similarOrNot: G = (R, n) => fitted(() => {
  const yes = R() < 0.5;
  let r1: number, u1: number, r2: number, u2: number;
  if (yes) { [r1, u1] = pick(R, [[1, 2], [2, 3], [3, 1], [2, 1], [3, 4], [1, 3]] as const); const k = int(R, 2, 3); r2 = r1 * k; u2 = u1 * k; }
  else { [r1, u1, r2, u2] = pick(R, [[1, 2, 1, 3], [2, 3, 3, 4], [3, 4, 4, 5], [2, 1, 3, 2], [1, 2, 2, 3], [3, 2, 4, 3], [2, 3, 4, 5]] as const); if (R() < 0.5) [r1, u1, r2, u2] = [r2, u2, r1, u1]; }
  const A: [number, number] = [0, 1], B: [number, number] = [r1, u1 + 1];
  const C: [number, number] = [r1 + 1 + int(R, 0, 1), 1], D: [number, number] = [C[0] + r2, u2 + 1];
  const g = grid([D[0]], [Math.max(u1, u2) + 1]);
  g.lines = [{ id: 'L', m: u1 / r1, b: 1, ends: 'plain', from: 0, to: r1 }, { id: 'M', m: u2 / r2, b: 1 - C[0] * (u2 / r2), ends: 'plain', from: C[0], to: D[0] }];
  g.tris = [tri('s', A, B, String(r1), String(u1)), tri('t', C, D, String(r2), String(u2))];
  const s1 = rat(u1, r1), s2 = rat(u2, r2);
  return choice(R, {
    id: `similarOrNot-${n}`, family: 'similarOrNot', prompt: `Two right triangles: legs ${a(r1)} across and ${b(u1)} up, and legs ${a(r2)} across and ${b(u2)} up. Are they similar?`,
    board: `\\frac{${u1}}{${r1}} \\quad\\text{and}\\quad \\frac{${u2}}{${r2}}`,
    solution: [`Compare rise ÷ run: ${u1}/${r1} = ${Qh(s1)} and ${u2}/${r2} = ${Qh(s2)}.`, yes ? `The same, so the slanted sides make the same angle: ${sOk('similar')}.` : `Different, so the acute angles differ: ${sOk('not similar')}, even though both are right triangles.`],
    picture: { graph: g, hide: ['ang:s', 'ang:t'] },
  }, [
    { t: 'Yes: rise ÷ run is the same, so the angles match.', ok: yes, mc: yes ? undefined : MC.looks, say: yes ? `Yes: ${Qh(s1)} = ${Qh(s2)}.` : `Check the numbers: ${Qh(s1)} is not ${Qh(s2)}. They only look alike.` },
    { t: 'No: rise ÷ run is different, so the angles differ.', ok: !yes, mc: !yes ? undefined : MC.depends, say: !yes ? `Right: ${Qh(s1)} and ${Qh(s2)} differ.` : `Divide again: ${u1}/${r1} and ${u2}/${r2} are both ${Qh(s1)}. Size does not change the ratio.` },
    { t: 'Yes: both are right triangles.', mc: MC.hypo, say: 'A right angle is only one angle. Similar needs a second equal angle too: compare rise ÷ run.' },
    { t: 'No: one triangle is bigger.', mc: MC.looks, say: 'Size alone does not decide it. Similar triangles can be different sizes: compare rise ÷ run.' },
  ], true);
});

// 6 slope-invariance (and 7 negative-slope): the big triangle's rise from the small one
const bigTriangle: G = (R, n, sg) => fitted(() => {
  const neg = sg === 'negative-slope';
  const [p, qq] = pick(R, [[1, 2], [2, 3], [3, 2], [1, 3], [3, 4], [2, 1], [3, 1]] as const);
  const m = (neg ? -p : p) / qq;
  const k = int(R, 2, 3), bb = neg ? int(R, 8, 12) : int(R, 0, 3);
  const x0 = int(R, 0, 2) * qq;
  const A: [number, number] = [x0, bb + m * x0], B: [number, number] = [x0 + qq, bb + m * (x0 + qq)];
  const C: [number, number] = [B[0] + int(R, 0, 1) * qq, bb + m * (B[0])], D: [number, number] = [C[0] + k * qq, 0];
  C[1] = bb + m * C[0]; D[1] = bb + m * D[0];
  if (neg && D[1] < 0) return bigTriangle(R, n, sg);
  const rise1 = neg ? -p : p, run2 = k * qq, rise2 = rise1 * k;
  const g = grid([D[0] + 1], [bb, D[1], A[1]]);
  g.lines = [{ id: 'L', m, b: bb, ends: 'full' }];
  g.tris = [tri('s', A, B, String(qq), F(rise1)), tri('t', C, D, String(run2), F(rise2))];
  return numAns({
    id: `bigTriangle-${n}`, family: 'bigTriangle', prompt: `On this line the small slope triangle has run ${a(qq)} and rise ${b(F(rise1))}. The big one has run ${a(run2)}. What is its rise?${neg ? ' Use a minus sign if it goes down.' : ''}`,
    board: `\\frac{${S.tnum(rise1)}}{${qq}} = \\frac{?}{${run2}}`,
    solution: [`Both triangles are on one line, so they are similar: rise ÷ run is the same, ${F(rise1)}/${qq}.`, `The run is ${k} times as long, so the rise is too: ${F(rise1)} × ${k} = ${sOk(F(rise2))}.`],
    picture: { graph: g, hide: ['rise:t'] },
  }, rise2, 'num', `Yes: ${F(rise2)}. ${F(rise2)}/${run2} = ${F(rise1)}/${qq}: the same slope anywhere on the line.`, [
    [rise1, MC.depends, `With the same rise and a longer run, the slope would be smaller. On one line the slope never changes: scale the rise by ${k}.`],
    [rise1 + (run2 - qq), MC.depends, `Adding does not keep the ratio. Similar triangles scale: ${k} times the run, ${k} times the rise.`],
    [neg ? -rise2 : null, MC.sign, `The line goes down to the right, so the rise is negative: ${F(rise2)}.`],
    [run2 * (qq / rise1), MC.inverted, `Keep rise over run the same: ${F(rise1)}/${qq} = ?/${run2}.`],
  ], `Same line, same slope: ${F(rise1)} ÷ ${qq} = ? ÷ ${run2}.`);
});
const brokenPath: G = (R, n) => fitted(() => {
  const line = R() < 0.4;
  const [p, qq] = pick(R, [[1, 2], [2, 3], [3, 2], [1, 1], [2, 1], [1, 3]] as const);
  const A: [number, number] = [1, int(R, 1, 2)], kk = p === 1 && qq === 1 ? 2 : 1, k1 = int(R, 1, 2) * kk, k2 = int(R, 1, 2) * kk;
  const B: [number, number] = [A[0] + qq * k1, A[1] + p * k1];
  let C: [number, number] = [B[0] + qq * k2, B[1] + p * k2];
  if (!line) C = [C[0], C[1] + pick(R, [-1, 1, 2])];
  if (C[1] <= B[1]) C = [C[0], B[1] + 1];
  const s1 = S.slopeQ(A, B)!, s2 = S.slopeQ(B, C)!;
  const isLine = qEq(s1, s2);
  const g = grid([C[0] + 1], [C[1]]);
  g.paths = [{ id: 'p', pts: [A, B, C], role: 'pick' }];
  g.points = [pt('A', A[0], A[1], 'A'), pt('B', B[0], B[1], 'B'), pt('C', C[0], C[1], 'C')];
  g.tris = [tri('s', A, B, F(B[0] - A[0]), F(B[1] - A[1])), tri('t', B, C, F(C[0] - B[0]), F(C[1] - B[1]))];
  return choice(R, {
    id: `brokenPath-${n}`, family: 'brokenPath', prompt: `Are the points A${S.ptHtml(...A)}, B${S.ptHtml(...B)} and C${S.ptHtml(...C)} on one straight line? Compare the slopes.`,
    board: `m_{AB} = \\,? \\qquad m_{BC} = \\,?`,
    solution: [`A to B: ${F(B[1] - A[1])} ÷ ${F(B[0] - A[0])} = ${Qh(s1)}. B to C: ${F(C[1] - B[1])} ÷ ${F(C[0] - B[0])} = ${Qh(s2)}.`,
      isLine ? `The same slope, so ${sOk('one straight line')}.` : `Different slopes, so ${sOk('not one line')}: a line has the same slope between any two of its points.`],
    picture: { graph: g, hide: ['tri:s', 'run:s', 'rise:s', 'tri:t', 'run:t', 'rise:t'] },
  }, [
    { t: `Yes: the slope is ${S.qText(s1)} from A to B and from B to C.`, ok: isLine, mc: isLine ? undefined : MC.examples, say: isLine ? 'Yes: the same slope both times.' : `Check B to C too: it is ${S.qText(s2)}, not ${S.qText(s1)}.` },
    { t: `No: the slope from A to B is ${S.qText(s1)}, but from B to C it is ${S.qText(s2)}.`, ok: !isLine, mc: !isLine ? undefined : MC.depends, say: !isLine ? 'Right: the slope changes, so it is not one line.' : `Work it out again: B to C is ${S.qText(s2)} too.` },
    { t: 'Yes: a line can change its slope when the triangles get bigger.', mc: MC.depends, say: 'A straight line has ONE slope: any slope triangle on it gives the same rise ÷ run.' },
    { t: 'Yes: every piece goes up.', mc: MC.illusion, say: 'Going up is not enough. The rise ÷ run must be the same for every piece.' },
  ].filter((o, i, all) => all.findIndex(x => x.t === o.t) === i), true);
});

// 8 zero-slope, 9 vertical-undefined
const specialSlope: G = (R, n, sg) => fitted(() => {
  const vert = sg === 'vertical-undefined';
  const cst = int(R, -5, 6), u = int(R, -6, 0), v = u + int(R, 3, 8);
  const P: [number, number] = vert ? [cst, u] : [u, cst], Qp: [number, number] = vert ? [cst, v] : [v, cst];
  const g = grid([u, v, cst], [u, v, cst]);
  g.lines = [vert ? { id: 'L', vx: cst } : { id: 'L', m: 0, b: cst }];
  g.points = [pt('P', ...P), pt('Q', ...Qp)];
  const d = v - u;
  const opts: Opt[] = vert ? [
    { t: 'undefined', ok: true, say: `Yes: the run is ${F(cst)} − ${F(cst)} = 0, and you cannot divide by 0. A vertical line has an undefined slope.` },
    { t: '0', mc: MC.kOver0, say: `${d} ÷ 0 is not 0. Zero divided by a number is 0, but a number divided by 0 has no value: undefined.` },
    { t: String(d), say: `${d} is the rise. The slope divides it by the run, and the run is 0.` },
    { t: 'zero, like a flat line', mc: MC.noSlope, say: 'A flat line has slope 0 (rise 0). A vertical line has run 0: its slope is undefined. They are different.' },
  ] : [
    { t: '0', ok: true, say: `Yes: the rise is 0, and 0 ÷ ${d} = 0. The output does not change.` },
    { t: 'undefined', mc: MC.noSlope, say: `The run is ${d}, not 0. Here the RISE is 0: 0 ÷ ${d} = 0. Undefined is for vertical lines.` },
    ...(cst !== 0 && cst !== 1 && cst !== d ? [{ t: F(cst), mc: MC.height, say: `${F(cst)} is the height of the line, not its slope. Slope is the change: here no change at all.` }] : []),
    { t: '1', say: `Slope is rise ÷ run: 0 ÷ ${d} = 0.` },
  ];
  return choice(R, {
    id: `specialSlope-${n}`, family: 'specialSlope', prompt: `What is the slope of the line through ${S.ptHtml(...P)} and ${S.ptHtml(...Qp)}?`,
    board: `m = \\frac{${S.tnum(Qp[1])} - ${P[1] < 0 ? `(${S.tnum(P[1])})` : S.tnum(P[1])}}{${S.tnum(Qp[0])} - ${P[0] < 0 ? `(${S.tnum(P[0])})` : S.tnum(P[0])}}`,
    solution: vert ? [`Rise: ${b(String(d))}. Run: ${a('0')} (both points have ${X} = ${F(cst)}).`, `${d} ÷ 0 has no value, so the slope is ${sOk('undefined')}. (Not "no slope": say undefined.)`]
      : [`Rise: ${b('0')}. Run: ${a(String(d))}.`, `0 ÷ ${d} = ${sOk('0')}: every pair of points on a flat line gives 0. The output stays ${F(cst)}.`],
    picture: { graph: g },
  }, opts);
});
const flatMeaning: G = (R, n) => fitted(() => {
  const v = pick(R, ['parked', 'fee', 'temp'] as const);
  const c = v === 'parked' ? int(R, 6, 20) : v === 'fee' ? pick(R, [25, 30, 35, 40, 45]) : int(R, 60, 72);
  const T = int(R, 4, 8);
  const [xn, yn, sub, unit, xu] = v === 'parked' ? ['time (h)', 'distance (mi)', 'A car is parked at the mall', 'miles from home', 'hour']
    : v === 'fee' ? ['data (GB)', 'bill ($)', 'An unlimited phone plan', 'dollars a month', 'gigabyte'] : ['time (h)', 'temp (°F)', 'A room with a thermostat', '°F', 'hour'];
  const g = grid([T + 1], [c], { xName: xn, yName: yn });
  g.lines = [{ id: 'L', m: 0, b: c, ends: 'segment', from: 0, to: T }];
  const val_ = v === 'fee' ? `$${c}` : `${c} ${unit}`;
  return choice(R, {
    id: `flatMeaning-${n}`, family: 'flatMeaning', prompt: `${sub}. The graph is a flat line at ${b(v === 'fee' ? `$${c}` : c)}. What does the flat line tell you?`,
    board: `m = 0`,
    solution: [`Flat means the rise is 0 for any run: slope 0.`, `So the output ${sOk(`stays ${val_}`)} while the input changes.`],
    picture: { graph: g },
  }, [
    { t: `It stays ${val_}: it does not change.`, ok: true, say: `Yes: slope 0 means no change. It stays ${val_}.` },
    { t: v === 'fee' ? 'The bill is $0.' : v === 'parked' ? 'The car is 0 miles from home.' : 'The temperature is 0 °F.', mc: MC.flatZero, say: `Flat does not mean zero. The line is at ${val_}: the amount stays there.` },
    { t: `The slope is ${c} ${unit.split(' ')[0]} per ${xu}.`, mc: MC.height, say: `${c} is the height of the line. Its slope is 0: no change per ${xu}.` },
    { t: 'It goes up at a steady rate.', say: 'A steady increase slants up. Flat means no change at all.' },
  ]);
});
const hvMatch: G = (R, n) => fitted(() => {
  const ask = pick(R, ['zero', 'undefined'] as const);
  const h = int(R, -4, 5), v = int(R, -5, 6);
  const horizFirst = R() < 0.5;
  const g = grid([-6, 7, v], [-6, 7, h]);
  const lineH: SGLine = { id: 'H', m: 0, b: h, name: horizFirst ? 'A' : 'B' }, lineV: SGLine = { id: 'V', vx: v, name: horizFirst ? 'B' : 'A' };
  g.lines = [lineH, lineV];
  const right = ask === 'zero' ? lineH.name! : lineV.name!, wrong = ask === 'zero' ? lineV.name! : lineH.name!;
  return choice(R, {
    id: `hvMatch-${n}`, family: 'hvMatch', prompt: `Line A and line B. Which one has ${ask === 'zero' ? 'a slope of 0' : 'an undefined slope'}?`,
    board: `${lineH.name}{:}\\ y = ${S.tnum(h)} \\qquad ${lineV.name}{:}\\ x = ${S.tnum(v)}`,
    solution: [`The flat line: rise 0, so slope 0 ÷ run = 0.`, `The vertical line: run 0, so rise ÷ 0 is undefined.`, `${ask === 'zero' ? 'Slope 0' : 'Undefined'}: ${sOk('line ' + right)}.`],
    picture: { graph: g },
  }, [
    { t: `Line ${right}`, ok: true, say: ask === 'zero' ? 'Yes: a flat line has rise 0, so slope 0.' : 'Yes: a vertical line has run 0, and you cannot divide by 0.' },
    { t: `Line ${wrong}`, mc: ask === 'zero' ? MC.kOver0 : MC.noSlope, say: ask === 'zero' ? 'A vertical line has run 0: rise ÷ 0 is undefined, not 0.' : 'A flat line has rise 0: 0 ÷ run = 0. That is a real slope, zero.' },
    { t: 'Both: neither one slants', mc: MC.noSlope, say: 'They are different: flat has slope 0, vertical has an undefined slope.' },
    { t: 'Neither', say: `One of them does: the ${ask === 'zero' ? 'flat' : 'vertical'} one.` },
  ], true);
});

// 11 point-on-line-check
function lineFor(R: () => number, kx: boolean): { m: Q; b: Q } {
  const m = pick(R, kx ? [rat(2), rat(3), rat(-2), rat(1, 2), rat(-1, 2), rat(4)] : [rat(2), rat(-3), rat(1, 2), rat(-1, 2), rat(3), rat(-1), rat(3, 2)]);
  return { m, b: kx ? rat(0) : rat(int(R, -5, 6) || 3) };
}
const onLine: G = (R, n) => fitted(() => {
  const kx = R() < 0.35, { m, b: bq } = lineFor(R, kx);
  const x = pick(R, [-4, -2, -1, 1, 2, 3, 4, 0.5, -0.5].filter(v => Number.isInteger(qNum(S.yAt(m, bq, v)) * 2)));
  const y = qNum(S.yAt(m, bq, x));
  const kind = pick(R, ['on', 'on', 'swap', 'off'] as const);
  let P: [number, number] = [x, y];
  if (kind === 'swap') P = [y, x];
  if (kind === 'off') P = [x, y + pick(R, [1, -1, 0.5])];
  const on = S.onLine(m, bq, P[0], P[1]);
  if (kind === 'swap' && (on || x === y)) return onLine(R, n);
  const g = grid([-6, 6, P[0]], [-7, 7, P[1]]);
  if (Math.abs(P[1]) > 12 || Math.abs(P[0]) > 12) return onLine(R, n);
  g.lines = [{ id: 'L', m: qNum(m), b: qNum(bq) }];
  g.points = [pt('P', P[0], P[1], true, 'pick')];
  const eq = S.eqHtml(m, bq), yP = S.yAt(m, bq, P[0]);
  const sub = `${S.qHtml(m)} · ${P[0] < 0 ? `(${F(P[0])})` : F(P[0])}${qNum(bq) ? ` ${qNum(bq) < 0 ? '−' : '+'} ${F(Math.abs(qNum(bq)))}` : ''} = ${S.qDecHtml(yP)}`;
  return choice(R, {
    id: `onLine-${n}`, family: 'onLine', prompt: `Is the point ${S.ptHtml(...P)} on the line ${eq}? Put it in and check.`,
    board: `${S.eqTex(m, bq)} \\qquad ${S.ptTex(...P)}`,
    solution: [`Put ${X} = ${F(P[0])} in: ${Yv} = ${sub}.`, on ? `That is the ${Yv} of the point, so ${sOk('it is on the line')}.` : `The point has ${Yv} = ${F(P[1])}, not ${S.qDecHtml(yP)}: ${sOk('not on the line')}${kind === 'off' ? ', even though it looks close' : ''}.`],
    picture: { graph: g },
  }, [
    { t: 'Yes: it makes the equation true.', ok: on, mc: on ? undefined : kind === 'swap' ? MC.swapXY : MC.sketch, say: on ? `Yes: ${sub}.` : kind === 'swap' ? `Careful: the first number is ${X}. With ${X} = ${F(P[0])}, ${Yv} would be ${S.qDecHtml(yP)}.` : `It looks close, but check: ${sub}, not ${F(P[1])}.` },
    { t: 'No: it does not make the equation true.', ok: !on, say: on ? `Check again: ${sub}. That matches.` : `Right: ${sub}.` },
  ], true);
});
const whichPoint: G = (R, n) => fitted(() => {
  const { m, b: bq } = lineFor(R, false);
  const xs = [-3, -2, -1, 1, 2, 3, 4].filter(v => Number.isInteger(qNum(S.yAt(m, bq, v))));
  const x = pick(R, xs), y = qNum(S.yAt(m, bq, x));
  const x2 = pick(R, xs.filter(v => v !== x)), y2 = qNum(S.yAt(m, bq, x2));
  const opts: Opt[] = [
    { t: S.ptHtml(x, y), ok: true, say: `Yes: ${X} = ${F(x)} gives ${Yv} = ${F(y)}.` },
    { t: S.ptHtml(y2, x2), mc: MC.swapXY, say: `The first number is ${X}: with ${X} = ${F(y2)}, ${Yv} = ${S.qDecHtml(S.yAt(m, bq, y2))}. Swapped coordinates.` },
    { t: S.ptHtml(x2, y2 + pick(R, [1, -1])), mc: MC.sketch, say: `Close is not on: with ${X} = ${F(x2)}, ${Yv} must be exactly ${F(y2)}.` },
    { t: S.ptHtml(-x, y), say: `With ${X} = ${F(-x)}, ${Yv} = ${S.qDecHtml(S.yAt(m, bq, -x))}. Watch the sign of ${X}.` },
  ];
  if (new Set(opts.map(o => o.t)).size < 4 || opts.slice(1).some(o => { const mm = /\(([^,]+), ([^)]+)\)/.exec(o.t)!; return S.onLine(m, bq, Number(mm[1]!.replace('−', '-')), Number(mm[2]!.replace('−', '-'))); })) return whichPoint(R, n);
  const g = grid([-6, 6], [-8, 8]);
  g.lines = [{ id: 'L', m: qNum(m), b: qNum(bq) }];
  g.points = [pt('P', x, y, true, 'pick')];
  return choice(R, {
    id: `whichPoint-${n}`, family: 'whichPoint', prompt: `Which point is on the line ${S.eqHtml(m, bq)}? Check each one in the equation.`,
    board: S.eqTex(m, bq),
    solution: [`A point is on the line exactly when its ${X} and ${Yv} make the equation true.`, `${X} = ${F(x)}: ${Yv} = ${F(y)}. So ${sOk(S.ptHtml(x, y))} is on the line.`],
    picture: { graph: g, hide: ['pt:P', 'ptl:P'] },
  }, opts);
});

// 12 write-y-equals-kx, 15 write-y-mx-plus-b: the equation of a line on a graph
const writeFromGraph: G = (R, n, sg) => fitted(() => {
  const kx = sg === 'write-y-equals-kx';
  const m = kx ? pick(R, [rat(2), rat(3), rat(1, 2), rat(2, 3), rat(3, 4), rat(3, 2), rat(4)]) : pick(R, [rat(2), rat(-2), rat(1, 2), rat(-1, 2), rat(2, 3), rat(-2, 3), rat(3), rat(-1), rat(1), rat(0)]);
  const bq = kx ? rat(0) : rat(int(R, -4, 5) || -2);
  const run = m.q, x1 = kx && R() < 0.4 ? -run * int(R, 1, 2) : run * int(R, 1, 2);
  const y1 = qNum(S.yAt(m, bq, x1));
  const g = grid([-6, 6, x1], [-6, 7, y1, qNum(bq)]);
  g.lines = [{ id: 'L', m: qNum(m), b: qNum(bq) }];
  const start: [number, number] = [0, qNum(bq)];
  g.points = [pt('B', 0, qNum(bq)), pt('P', x1, y1)];
  g.tris = qNum(m) === 0 ? [] : [tri('t', x1 > 0 ? start : [x1, y1], x1 > 0 ? [x1, y1] : start, F(Math.abs(x1)), F(x1 > 0 ? y1 - qNum(bq) : qNum(bq) - y1))];
  const right = S.eqHtml(m, bq);
  const inv = qNum(m) !== 0 ? S.qDiv(rat(1), m) : null;
  const cands: Opt[] = [{ t: right, ok: true, say: `Yes: slope ${S.qHtml(m)}${kx ? ' through (0, 0)' : `, and it crosses the ${Yv}-axis at ${S.qHtml(bq)}`}.` }];
  if (kx) {
    if (inv && !qEq(inv, m)) cands.push({ t: S.eqHtml(inv, rat(0)), mc: MC.kInv, say: `That is run ÷ rise. The slope is rise ÷ run: ${S.qHtml(m)}.` });
    cands.push({ t: S.eqHtml(rat(1), m), mc: MC.propB, say: `A line through (0, 0) has nothing added: ${Yv} = ${S.qHtml(m)}${X}.` });
    cands.push({ t: S.eqHtml(m, m), mc: MC.template, say: 'The line goes through (0, 0): at x = 0 the output is 0, so nothing is added.' });
  } else {
    if (!qEq(m, bq) && qNum(m) !== 0) cands.push({ t: S.eqHtml(bq, m), mc: MC.swapMB, say: `The number times ${X} is the slope; the number added is where it crosses the ${Yv}-axis.` });
    if (qNum(bq) !== 0) cands.push({ t: S.eqHtml(m, rat(0)), mc: MC.dropB, say: `This line does not go through (0, 0): it crosses the ${Yv}-axis at ${S.qHtml(bq)}.` });
    if (qNum(m) !== 0) cands.push({ t: S.eqHtml(S.qNeg(m), bq), mc: MC.sign, say: `The line goes ${qNum(m) < 0 ? 'down' : 'up'} to the right, so the slope is ${qNum(m) < 0 ? 'negative' : 'positive'}.` });
    if (qNum(bq) !== 0) cands.push({ t: S.eqHtml(m, S.qNeg(bq)), mc: MC.interceptSwap, say: `Read where the line crosses the ${Yv}-axis: at ${S.qHtml(bq)}.` });
  }
  const uniq = cands.filter((o, i) => cands.findIndex(x => x.t === o.t) === i).slice(0, 4);
  if (uniq.length < 3) return writeFromGraph(R, n, sg);
  return choice(R, {
    id: `writeFromGraph-${n}`, family: 'writeFromGraph', prompt: `Which equation is this line? Find its slope with a slope triangle${kx ? '' : `, and where it crosses the ${Yv}-axis`}.`,
    board: `${S.ptTex(0, qNum(bq))},\\ ${S.ptTex(x1, y1)}:\\quad y = \\,?`,
    solution: [qNum(m) === 0 ? 'The line is flat: slope 0.' : `Slope triangle: run ${a(F(Math.abs(x1)))}, rise ${b(F(Math.abs(x1) * qNum(m)))}: slope ${S.qHtml(m)}.`,
      kx ? `It goes through (0, 0), so nothing is added: ${sOk(right)}.` : `It crosses the ${Yv}-axis at (0, ${S.qHtml(bq)}): ${sOk(right)}.`],
    picture: { graph: g, hide: qNum(m) === 0 ? [] : triSteps('t') },
  }, uniq);
});
const directVar: G = (R, n) => fitted(() => {
  const v = pick(R, ['plain', 'drive', 'tickets'] as const);
  const k = v === 'drive' ? pick(R, [45, 50, 55, 60]) : v === 'tickets' ? pick(R, [2.5, 3.5, 4, 6.5]) : pick(R, [2, 3, 4, 5, 1.5, 2.5]);
  const x1 = v === 'drive' ? int(R, 2, 4) : int(R, 2, 6), y1 = k * x1;
  const findX = R() < 0.45;
  const x2 = x1 + int(R, 2, 6), y2 = k * x2;
  const [xv, yv, xw, yw] = v === 'drive' ? ['t', 'd', 'hours', 'miles'] : v === 'tickets' ? ['n', 'c', 'tickets', 'dollars'] : ['x', 'y', '', ''];
  const money = v === 'tickets';
  const Y = (z: number) => (money ? '$' + F(z, true) : F(z));
  const g = grid([x2 + 1], [y2], v === 'plain' ? {} : { xName: v === 'drive' ? 'time (h)' : 'tickets', yName: v === 'drive' ? 'distance (mi)' : 'cost ($)' });
  g.lines = [{ id: 'L', m: k, b: 0, ends: v === 'tickets' ? 'points' : v === 'drive' ? 'ray' : 'full', from: v === 'plain' ? undefined : 0 }];
  g.points = [pt('P', x1, y1), pt('Q', x2, y2, findX ? `(?, ${F(y2)})` : `(${x2}, ?)`, 'pick')];
  const intro = v === 'drive' ? `A car drives at a steady speed: distance ${yv} varies directly with time ${xv}. It goes ${y1} miles in ${x1} hours.`
    : v === 'tickets' ? `The cost ${yv} varies directly with the number of tickets ${xv}. ${x1} tickets cost ${Y(y1)}.`
      : `${Yv} varies directly with ${X}, and ${Yv} = ${F(y1)} when ${X} = ${x1}.`;
  const ask = findX ? (v === 'drive' ? `How many hours for ${y2} miles?` : v === 'tickets' ? `How many tickets cost ${Y(y2)}?` : `Find ${X} when ${Yv} = ${F(y2)}.`)
    : (v === 'drive' ? `How far in ${x2} hours?` : v === 'tickets' ? `What do ${x2} tickets cost?` : `Find ${Yv} when ${X} = ${x2}.`);
  const kt = `<i>${yv}</i> = ${F(k)}<i>${xv}</i>`;
  return numAns({
    id: `directVar-${n}`, family: 'directVar', prompt: `${intro} ${ask}`, unit: findX ? xw : yw,
    board: `${yv} = k${xv},\\quad ${S.tnum(y1)} = k \\cdot ${x1}`,
    solution: [`Find k from the pair: k = ${F(y1)} ÷ ${x1} = ${F(k)}. So ${kt}.`, findX ? `Solve ${F(y2)} = ${F(k)}<i>${xv}</i>: ${F(y2)} ÷ ${F(k)} = ${sOk(F(x2))}.` : `${F(k)} × ${x2} = ${sOk(Y(y2))}.`],
    picture: { graph: g, hide: ['pt:Q', 'ptl:Q'], solveTex: [`k = \\frac{${S.tnum(y1)}}{${x1}} = ${S.tnum(k)}`, findX ? `${S.tnum(y2)} = ${S.tnum(k)}${xv} \\Rightarrow ${xv} = ${x2}` : `${yv} = ${S.tnum(k)} \\cdot ${x2} = ${S.tnum(y2)}`] },
  }, findX ? x2 : y2, 'num', `Yes: ${kt}, so ${findX ? `${xv} = ${x2}` : `${yv} = ${F(y2)}`}.`, findX ? [
    [y2 * k, MC.multNotDiv, `You know the output, so undo the × ${F(k)}: divide ${F(y2)} by ${F(k)}.`],
    [y2 / x1, MC.kInv, `First find k = ${F(y1)} ÷ ${x1} = ${F(k)}, then divide ${F(y2)} by k.`],
  ] : [
    [x2 / k, MC.kInv, `k is output ÷ input: ${F(y1)} ÷ ${x1} = ${F(k)}. Multiply: ${F(k)} × ${x2}.`],
    [y1 + (x2 - x1), MC.scalesNP, `Adding does not keep the ratio. Each 1 more adds ${F(k)}, so use ${yv} = ${F(k)}${xv}.`],
  ], `Find k = ${F(y1)} ÷ ${x1} first, then use ${kt}.`);
});

// 13 graph-y-equals-kx, 16 graph-y-mx-plus-b: one slope step from the start point
const graphStep: G = (R, n, sg) => fitted(() => {
  const kx = sg === 'graph-y-equals-kx';
  const opts = kx ? [[2, 3], [5, 2], [1, 2], [3, 4], [2, 1], [4, 3], [3, 2]] : [[2, 3], [-2, 3], [1, 2], [-1, 2], [3, 1], [-2, 1], [-3, 4], [3, 2], [0, 1]];
  const [p, qq] = pick(R, opts as [number, number][]);
  const bq = kx ? 0 : int(R, -4, 5) || 2;
  const run = qq === 1 ? int(R, 2, 3) : qq * (kx ? int(R, 1, 2) : 1), rise = (p / qq) * run;
  const ans: [number, number] = [run, bq + rise];
  const m = rat(p, qq), mT = Qt(m);
  const g = grid([-1, run + 3], [bq, ans[1], -1, 5]);
  g.points = [pt('S', 0, bq, false), pt('E', ans[0], ans[1], true, 'pick')];
  g.lines = [{ id: 'L', m: p / qq, b: bq }];
  g.tris = p === 0 ? [] : [tri('t', [0, bq], ans, String(run), F(rise))];
  const eq = S.eqHtml(m, rat(bq));
  return pairAns({
    id: `graphStep-${n}`, family: 'graphStep',
    prompt: `Graph ${eq}. Start at ${kx ? '(0, 0)' : `the ${Yv}-intercept (0, ${F(bq)})`} and use the slope with a run of ${a(run)}. Which point do you reach?`,
    board: `${S.eqTex(m, rat(bq))} \\quad \\text{run } ${run}`, pairLead: '(', pairOp: ',', pairTail: ')',
    solution: [`Slope ${S.qHtml(m)}: for a run of ${a(run)}, the rise is ${S.qHtml(m)} × ${run} = ${b(F(rise))}.`, `From (0, ${F(bq)}): ${run} right, ${F(Math.abs(rise))} ${sgnWord(rise)}: ${sOk(S.ptHtml(...ans))}. Join the points with a line.`],
    picture: { graph: g, hide: ['pt:E', 'ptl:E', 'line:L', ...(p === 0 ? [] : triSteps('t'))] },
  }, ans, `Yes: ${S.ptHtml(...ans)}. Join it to (0, ${F(bq)}) and you have the line.`, [
    [[rise, bq + run], MC.inverted, `The run goes across: ${run} to the right. The rise goes up or down: ${F(rise)}.`],
    [[ans[1], ans[0]], MC.swapXY, `Write ${X} first: (${run}, ${F(ans[1])}).`],
    [[run, bq - rise], MC.sign, `The slope is ${S.qHtml(m)}: ${rise < 0 ? 'down' : 'up'} ${F(Math.abs(rise))}, not ${rise < 0 ? 'up' : 'down'}.`],
    [[run, rise], kx ? MC.only1k : MC.dropB, kx ? `Start at (0, 0) and go ${run} across.` : `Start at (0, ${F(bq)}), not at (0, 0): add the rise to ${F(bq)}.`],
    [[bq + run, rise], MC.interceptSwap, `The start (0, ${F(bq)}) is on the ${Yv}-axis, not (${F(bq)}, 0).`],
    [[1, bq + p / qq], MC.only1k, `The question asks for a run of ${run}, not 1.`],
  ], `From the start point: ${run} to the right, then rise ${S.qHtml(m)} × ${run}.`);
});
const whichGraph: G = (R, n, sg) => fitted(() => {
  const kx = sg === 'graph-y-equals-kx';
  const m = kx ? pick(R, [rat(2), rat(3), rat(1, 2), rat(2, 3), rat(3, 2), rat(-2), rat(-1, 2), rat(4), rat(1, 3), rat(3, 4), rat(-3, 2), rat(-3), rat(5, 2), rat(-2, 3)]) : pick(R, [rat(2), rat(-2), rat(1, 2), rat(-1, 2), rat(-1), rat(3), rat(1)]);
  const bq = kx ? 0 : pick(R, [-3, -2, 2, 3, 4, -4]);
  const right: SGLine = { id: 'R', m: qNum(m), b: bq };
  const cands: [SGLine, string, string][] = kx ? [
    [{ id: 'I', m: 1 / qNum(m), b: 0 }, MC.inverted, `That line has slope ${S.qText(S.qDiv(rat(1), m))}: run and rise swapped.`],
    [{ id: 'P', m: 1, b: qNum(m) }, MC.propB, `That line does not go through (0, 0), so it is not y = kx.`],
    [{ id: 'D', m: qNum(m), b: 2 }, MC.propB, `Right slope, but it crosses the y-axis at 2: y = kx must go through (0, 0).`],
  ] : [
    [{ id: 'S', m: -qNum(m), b: bq }, MC.sign, `That line slants the other way: its slope has the wrong sign.`],
    [{ id: 'Z', m: qNum(m), b: -qNum(m) * bq }, MC.interceptSwap, `That line crosses the x-axis at ${F(bq)}. The intercept b is on the y-axis.`],
    [{ id: 'W', m: bq, b: qNum(m) }, MC.swapMB, `That line has slope ${F(bq)} and crosses at ${S.qText(m)}: m and b swapped.`],
    [{ id: 'O', m: qNum(m), b: 0 }, MC.dropB, `That line goes through (0, 0): the + b is missing.`],
  ];
  const two = shuffle(R, cands.filter(c => !(Math.abs(c[0].m! - right.m!) < EPS && Math.abs((c[0].b ?? 0) - (right.b ?? 0)) < EPS))).slice(0, 2);
  const names = shuffle(R, ['A', 'B', 'C']);
  const at = shuffle(R, [0.9, 0.12, 0.72]);
  const all = [right, ...two.map(c => c[0])].map((L, i) => ({ ...L, name: names[i]!, nameAt: at[i]! }));
  const g = grid([-6, 6], [-7, 7]);
  g.lines = all;
  return choice(R, {
    id: `whichGraph-${n}`, family: 'whichGraph', prompt: `Which line is the graph of ${S.eqHtml(m, rat(bq))}?`,
    board: S.eqTex(m, rat(bq)),
    solution: [kx ? `${S.eqHtml(m, rat(0))} goes through (0, 0).` : `It crosses the ${Yv}-axis at (0, ${F(bq)}).`, `From there, slope ${S.qHtml(m)}: run ${m.q}, rise ${F(m.p)}. That is ${sOk('line ' + all[0]!.name)}.`],
    picture: { graph: g },
  }, [
    { t: `Line ${all[0]!.name}`, ok: true, say: `Yes: line ${all[0]!.name}.` },
    ...two.map((c, i) => ({ t: `Line ${all[i + 1]!.name}`, mc: c[1], say: c[2] })),
  ].sort((u, v) => u.t.localeCompare(v.t)), true);
});

// 14 initial-value
const readB: G = (R, n) => fitted(() => {
  const m = pick(R, [1, 2, -1, -2, 0.5, -0.5, 3]), xi = pick(R, [-4, -3, -2, 2, 3, 4, 6]);
  const bb = -m * xi;
  if (!Number.isInteger(bb) || Math.abs(bb) > 7 || bb === xi || bb === 0) return readB(R, n);
  const zero = R() < 0.15;
  const B = zero ? 0 : bb;
  const g = grid([-6, 7], [-7, 7, B]);
  g.lines = [{ id: 'L', m, b: B }];
  g.points = [pt('I', 0, B, true, 'pick')];
  return numAns({
    id: `readB-${n}`, family: 'readB', prompt: `What is the initial value of this line: the output ${Yv} when the input ${X} is 0?`, board: `m = ${S.tnum(m)},\\quad ${S.ptTex(zero ? 0 : xi, 0)} \\text{ on the line},\\quad b = \\,?`,
    solution: [`Input 0 means on the ${Yv}-axis (the vertical axis).`, `The line crosses it at ${sOk(F(B))}: the point (0, ${F(B)}).`],
    picture: { graph: g, hide: ['pt:I', 'ptl:I'] },
  }, B, 'num', `Yes: it crosses the ${Yv}-axis at ${F(B)}. That is b, the ${Yv}-intercept.`, [
    [zero ? null : xi, MC.interceptSwap, `${F(xi)} is where the line crosses the ${X}-axis (output 0). The initial value is on the ${Yv}-axis (input 0).`],
  ], `Find where the line meets the ${Yv}-axis, the vertical one.`);
});
const tableB: G = (R, n) => fitted(() => {
  const words = R() < 0.4;
  const m = pick(R, [2, 3, 4, 5, -2, -3]), bb = words ? int(R, 2, 6) : int(R, -6, 12);
  if (words) {
    const rate = Math.abs(m), xs = [1, 2, 3, 4];
    const table: TableParams = { heads: ['miles', 'fare ($)'], rows: xs.map(x => [String(x), '$' + (bb + rate * x)]) };
    return numAns({
      id: `tableB-${n}`, family: 'tableB', prompt: `A taxi fare is a fixed amount to start plus ${b(`$${rate}`)} per mile. What is the starting fee, the initial value?`, board: `\\$${rate} \\text{ per mile},\\quad x = 0:\\ y = \\,?`, unit: 'dollars',
      solution: [`The initial value is the fare at ${X} = 0 miles.`, `Go back one row: ${'$' + (bb + rate)} − $${rate} = ${sOk('$' + bb)}.`],
      picture: { table, solveTex: [`${bb + rate} - ${rate} = ${bb}`] },
    }, bb, 'num', `Yes: $${bb} at 0 miles. Each mile adds $${rate}.`, [
      [bb + rate, MC.firstOut, `$${bb + rate} is the fare for 1 mile. The initial value is at 0 miles: take one $${rate} off.`],
      [rate, MC.swapMB, `$${rate} is the rate per mile. The start is the fare at 0 miles.`],
    ], `Work back to 0 miles: subtract $${rate} from the 1-mile fare.`);
  }
  const xs = shuffle(R, [0, ...pick(R, [[2, 4, 6], [1, 3, 5], [-2, 2, 4], [3, 5, 8]])]);
  if (xs[0] === 0) [xs[0], xs[1]] = [xs[1]!, xs[0]!];
  const rows = xs.map(x => [x, m * x + bb] as [number, number]);
  const i0 = xs.indexOf(0);
  const table: TableParams = { heads: ['x', 'y'], rows: rows.map(r => [F(r[0]), F(r[1])]) };
  return numAns({
    id: `tableB-${n}`, family: 'tableB', prompt: `This table is linear. What is its initial value (the output when ${X} = 0)? The rows are not in order.`, board: `x:\\ ${xs.map(v => S.tnum(v)).join(',\\ ')}\\quad y(0) = \\,?`,
    solution: [`Find the row where ${X} = 0. It is not the first row.`, `There ${Yv} = ${sOk(F(bb))}.`],
    picture: { table, hide: ['hl:' + i0] },
  }, bb, 'num', `Yes: when ${X} = 0, ${Yv} = ${F(bb)}.`, [
    [rows[0]![1], MC.firstOut, `${F(rows[0]![1])} is in the first row, but there ${X} = ${F(rows[0]![0])}. Find the row with ${X} = 0.`],
  ], `Look for the row with ${X} = 0.`);
});

// 15 write-y-mx-plus-b: from words
const wordsToMB: G = (R, n) => fitted(() => {
  const v = pick(R, ['gym', 'battery', 'plant', 'cab'] as const);
  const m = v === 'gym' ? pick(R, [20, 25, 30, 35]) : v === 'battery' ? -pick(R, [5, 6, 8, 10]) : v === 'plant' ? pick(R, [1.5, 2, 2.5, 3]) : pick(R, [2, 2.5, 3]);
  const bb = v === 'gym' ? pick(R, [40, 50, 60, 75]) : v === 'battery' ? pick(R, [80, 90, 100]) : v === 'plant' ? int(R, 3, 9) : pick(R, [3, 4, 5]);
  const text = v === 'gym' ? `A gym costs ${b(`$${bb}`)} to join plus ${a(`$${m}`)} per month. Write the total cost ${Yv} after ${X} months.`
    : v === 'battery' ? `A phone battery starts at ${b(`${bb}%`)} and drops ${a(`${-m}%`)} each hour. Write the charge ${Yv} after ${X} hours.`
      : v === 'plant' ? `A plant is ${b(`${bb} inches`)} tall and grows ${a(`${m} inches`)} each week. Write its height ${Yv} after ${X} weeks.`
        : `A taxi ride costs ${b(`$${bb}`)} plus ${a(`$${m}`)} per mile. Write the fare ${Yv} for ${X} miles.`;
  const xMax = v === 'battery' ? bb / -m : 8;
  const g = grid([xMax], [bb, bb + m * Math.min(8, xMax)], { xName: v === 'gym' ? 'months' : v === 'battery' ? 'time (h)' : v === 'plant' ? 'weeks' : 'miles', yName: v === 'gym' ? 'cost ($)' : v === 'battery' ? 'charge (%)' : v === 'plant' ? 'height (in)' : 'fare ($)' });
  if (!picFits({ graph: g })) g.xName = undefined;
  g.lines = [{ id: 'L', m, b: bb, ends: v === 'battery' ? 'segment' : 'ray', from: 0, to: v === 'battery' ? xMax : undefined }];
  g.points = [pt('B', 0, bb, true, 'pick')];
  return pairAns({
    id: `wordsToMB-${n}`, family: 'wordsToMB', prompt: text, board: `y = mx + b`, pairLead: '<i>y</i> =', pairOp: '<i>x</i> +',
    solution: [`The rate per ${v === 'gym' ? 'month' : v === 'battery' ? 'hour' : v === 'plant' ? 'week' : 'mile'} is the slope: ${a(`m = ${F(m)}`)}${m < 0 ? ' (it goes down)' : ''}.`, `The amount at ${X} = 0 is the start: ${b(`b = ${F(bb)}`)}. So ${sOk(`${Yv} = ${F(m)}${X} + ${F(bb)}`)}.`],
    picture: { graph: g, hide: ['line:L', 'pt:B', 'ptl:B'] },
  }, [m, bb], `Yes: ${Yv} = ${F(m)}${X} + ${F(bb)}. The start plus the change for ${X} ${v === 'gym' ? 'months' : 'steps'}.`, [
    [[bb, m], MC.swapMB, `The number times ${X} is the rate (it grows with ${X}); the added number is the start.`],
    [[m, 0], MC.dropB, `That leaves out the start: at ${X} = 0 the amount is ${F(bb)}, not 0.`],
    [[-m, bb], MC.sign, `It ${m < 0 ? 'goes down' : 'goes up'} each step, so the slope is ${m < 0 ? 'negative' : 'positive'}.`],
    [[m + bb, 0], MC.feeTimes, `The ${F(bb)} is paid once, not every step: ${Yv} = ${F(m)}${X} + ${F(bb)}.`],
  ], `Slope = the change per step; b = the amount at the start.`);
});

// 17 contextual-domain
interface Dom { text: string; kind: 'points' | 'segment' | 'ray' | 'line'; m: number; b: number; from?: number; to?: number; xn?: string; yn?: string; ask?: [number, boolean, string] }
function domCase(R: () => number): Dom {
  const v = pick(R, ['tickets', 'shirts', 'rental', 'parking', 'candle', 'fill', 'rule'] as const);
  if (v === 'tickets') { const k = pick(R, [3, 4, 5, 6]); return { text: `Movie tickets cost $${k} each. ${Yv} is the cost of ${X} tickets.`, kind: 'points', m: k, b: 0, from: 0, to: 8, xn: 'tickets', yn: 'cost ($)', ask: [pick(R, [2.5, 1.5, 3.5]), false, 'you cannot buy part of a ticket'] }; }
  if (v === 'shirts') { const k = pick(R, [8, 10, 12]); return { text: `A club orders T-shirts at $${k} each plus a $${k * 2} setup fee. ${Yv} is the cost of ${X} shirts, up to 6.`, kind: 'points', m: k, b: k * 2, from: 0, to: 6, xn: 'shirts', yn: 'cost ($)', ask: [pick(R, [4.5, 2.5]), false, 'shirts come whole'] }; }
  if (v === 'rental') { const k = pick(R, [6, 8, 10]); return { text: `A kayak rents for $${k} per hour, from 0 up to 8 hours. ${Yv} is the cost for ${X} hours.`, kind: 'segment', m: k, b: 0, from: 0, to: 8, xn: 'time (h)', yn: 'cost ($)', ask: pick(R, [[2.5, true, 'any time from 0 to 8 hours is allowed'], [10, false, 'the rental stops at 8 hours']] as [number, boolean, string][]) }; }
  if (v === 'parking') { return { text: `Parking costs $5 plus $2 per hour, for 1 to 6 hours. ${Yv} is the cost for ${X} hours.`, kind: 'segment', m: 2, b: 5, from: 1, to: 6, xn: 'time (h)', yn: 'cost ($)', ask: pick(R, [[0.5, false, 'you park at least 1 hour'], [3.5, true, 'any time from 1 to 6 hours is allowed']] as [number, boolean, string][]) }; }
  if (v === 'candle') { return { text: `A pool starts filling at noon and keeps filling: 4 gallons per minute. ${Yv} is the water after ${X} minutes.`, kind: 'ray', m: 4, b: 0, from: 0, xn: 'time (min)', yn: 'water (gal)', ask: pick(R, [[-2, false, 'the time starts at 0'], [7.5, true, 'any time from 0 on is allowed']] as [number, boolean, string][]) }; }
  if (v === 'fill') { return { text: `A hiker starts 3 miles from camp and walks away at 2 miles per hour, with no end time given. ${Yv} is her distance after ${X} hours.`, kind: 'ray', m: 2, b: 3, from: 0, xn: 'time (h)', yn: 'distance (mi)', ask: [-1, false, 'the time starts at 0'] }; }
  const m = pick(R, [2, -1, 0.5, 3]), b0 = int(R, -3, 3);
  return { text: `The rule ${Yv} = ${F(m)}${X} ${b0 < 0 ? '−' : '+'} ${Math.abs(b0)}, for any number ${X}, with no story.`, kind: 'line', m, b: b0, ask: [-2.5, true, 'every number is allowed'] };
}
const KIND_TXT = { points: 'separate points', segment: 'a segment (closed ends)', ray: 'a ray from the start', line: 'a full line' } as const;
function domGraph(d: Dom, show: boolean): SlopeGridParams {
  const xmax = d.to ?? 8, ys = [d.b, d.m * xmax + d.b, d.m * (d.from ?? -6) + d.b];
  const g = d.kind === 'line' ? grid([-6, 6], [-7, 7]) : grid([xmax + 1], ys, { xName: d.xn, yName: d.yn });
  g.lines = [{ id: 'L', m: d.m, b: d.b, from: d.from, to: d.kind === 'ray' ? undefined : d.to, ends: d.kind === 'line' ? 'full' : d.kind, role: show ? 'link' : 'link' }];
  return g;
}
const domainShape: G = (R, n) => fitted(() => {
  const d = domCase(R);
  const opts: Opt[] = (['points', 'segment', 'ray', 'line'] as const).map(k => ({
    t: KIND_TXT[k], ok: k === d.kind,
    mc: k === d.kind ? undefined : d.kind === 'points' && k !== 'points' ? MC.fracCount : (d.kind === 'segment' && (k === 'ray' || k === 'line')) || (d.kind === 'ray' && k === 'line') ? MC.beyond : undefined,
    say: k === d.kind ? `Yes: ${KIND_TXT[k]}.` : d.kind === 'points' ? 'You count whole things here: only whole-number inputs, so only separate points.'
      : d.kind === 'segment' ? `The inputs stop at both ends (${d.from} to ${d.to}): a segment.` : d.kind === 'ray' ? 'The input starts at 0 and has no end: a ray.' : 'With no story, every number is allowed: the full line.',
  }));
  return choice(R, {
    id: `domainShape-${n}`, family: 'domainShape', prompt: `${d.text} How much of the line should the graph show?`, board: `y = ${S.tnum(d.m)}x ${d.b < 0 ? '-' : '+'} ${Math.abs(d.b)}`,
    solution: [`Which inputs make sense? ${d.kind === 'points' ? 'Only whole numbers.' : d.kind === 'segment' ? `Everything from ${d.from} to ${d.to}.` : d.kind === 'ray' ? 'Everything from 0 on.' : 'Every number.'}`, `So the graph is ${sOk(KIND_TXT[d.kind])}.`],
    picture: { graph: domGraph(d, true), hide: ['line:L'] },
  }, opts, true);
});
const allowedInput: G = (R, n) => fitted(() => {
  const d = domCase(R), [x, ok, why] = d.ask!;
  return choice(R, {
    id: `allowedInput-${n}`, family: 'allowedInput', prompt: `${d.text} Is ${X} = ${a(F(x))} an allowed input?`, board: `x = ${S.tnum(x)}\\,?`,
    solution: [`Ask what ${X} stands for in the story.`, `${ok ? sOk('Allowed') : sOk('Not allowed')}: ${why}.`],
    picture: { graph: domGraph(d, true), hide: ['line:L'] },
  }, [
    { t: `Yes: ${F(x)} makes sense here.`, ok, mc: ok ? undefined : d.kind === 'points' ? MC.fracCount : MC.beyond, say: ok ? `Yes: ${why}.` : `No: ${why}. The rule gives a number, but the story does not allow it.` },
    { t: `No: ${F(x)} does not make sense here.`, ok: !ok, say: !ok ? `Right: ${why}.` : `It is allowed: ${why}.` },
  ], true);
});

// 18 recover-b
const bFromPoint: G = (R, n) => fitted(() => {
  const m = pick(R, [2, 3, -2, -3, 0.5, -0.5, 1.5, 4]), x1 = pick(R, [2, 4, -2, 6, 3, -4].filter(x => Number.isInteger(m * x))), bb = int(R, -5, 6);
  const y1 = m * x1 + bb;
  if (bb === y1 || bb === y1 + m * x1 || Math.abs(y1) > 12) return bFromPoint(R, n);
  const g = grid([-6, 7, x1], [-7, 7, y1, bb]);
  g.points = [pt('P', x1, y1), pt('B', 0, bb, true, 'pick')];
  g.lines = [{ id: 'L', m, b: bb }];
  g.tris = [tri('t', x1 > 0 ? [0, bb] : [x1, y1], x1 > 0 ? [x1, y1] : [0, bb], F(Math.abs(x1)), F(Math.abs(x1) * (x1 > 0 ? m : -m)))];
  return numAns({
    id: `bFromPoint-${n}`, family: 'bFromPoint', prompt: `A line has slope ${a(F(m))} and goes through ${S.ptHtml(x1, y1)}. What is b, where it crosses the ${Yv}-axis?`,
    board: `y = ${S.tnum(m)}x + b,\\quad ${S.ptTex(x1, y1)}`,
    solution: [`From ${X} = 0 to ${X} = ${F(x1)} the line changes by ${F(m)} × ${F(x1)} = ${F(m * x1)}.`, `Take that change back off: b = ${F(y1)} − (${F(m * x1)}) = ${sOk(F(bb))}.`],
    picture: { graph: g, hide: ['line:L', 'pt:B', 'ptl:B', ...triSteps('t')], solveTex: [`b = y - mx`, `b = ${S.tnum(y1)} - (${S.tnum(m * x1)}) = ${S.tnum(bb)}`] },
  }, bb, 'num', `Yes: b = ${F(bb)}. Check: ${F(m)} × ${F(x1)} + ${F(bb)} = ${F(y1)}.`, [
    [y1, MC.firstOut, `${F(y1)} is the output at ${X} = ${F(x1)}, not at ${X} = 0. Remove the change ${F(m)} × ${F(x1)} first.`],
    [y1 + m * x1, MC.backSolve, `Subtract the change, don't add it: b = ${F(y1)} − (${F(m * x1)}).`],
  ], `b = ${Yv} − m${X}: take the change from ${X} = 0 back off.`);
});
const lineFromTwo: G = (R, n) => fitted(() => {
  const m = pick(R, [2, -2, 3, -1, 0.5, -0.5, 1.5, -3]), bb = int(R, -5, 6);
  const xs = shuffle(R, [-4, -2, 2, 4, 6, 1, 3].filter(x => Number.isInteger(m * x))).slice(0, 2).sort((u, v) => u - v);
  const P: [number, number] = [xs[0]!, m * xs[0]! + bb], Qp: [number, number] = [xs[1]!, m * xs[1]! + bb];
  if (Math.abs(P[1]) > 12 || Math.abs(Qp[1]) > 12 || P[1] === bb || Qp[1] === bb) return lineFromTwo(R, n);
  const g = grid([-6, 7, ...xs], [-7, 7, P[1], Qp[1], bb]);
  g.points = [pt('P', ...P), pt('Q', ...Qp), pt('B', 0, bb, true, 'pick')];
  g.lines = [{ id: 'L', m, b: bb }];
  g.tris = [tri('t', P, Qp, F(Qp[0] - P[0]), F(Qp[1] - P[1]))];
  return pairAns({
    id: `lineFromTwo-${n}`, family: 'lineFromTwo', prompt: `Write the equation of the line through ${S.ptHtml(...P)} and ${S.ptHtml(...Qp)}: first the slope, then b.`,
    board: `${S.ptTex(...P)},\\ ${S.ptTex(...Qp)}`, pairLead: '<i>y</i> =', pairOp: '<i>x</i> +',
    solution: [`Slope: ${F(Qp[1] - P[1])} ÷ ${F(Qp[0] - P[0])} = ${a(F(m))}.`, `b = ${F(P[1])} − ${m < 0 ? `(${F(m)})` : F(m)} × ${P[0] < 0 ? `(${F(P[0])})` : F(P[0])} = ${b(F(bb))}.`, `${sOk(`${Yv} = ${F(m)}${X} ${bb < 0 ? '−' : '+'} ${F(Math.abs(bb))}`)}. Check it with the other point.`],
    picture: { graph: g, hide: ['line:L', 'pt:B', 'ptl:B', ...triSteps('t')] },
  }, [m, bb], `Yes: ${Yv} = ${F(m)}${X} ${bb < 0 ? '−' : '+'} ${F(Math.abs(bb))}. Both points check.`, [
    [[m, P[1]], MC.firstOut, `${F(P[1])} is the output at ${X} = ${F(P[0])}, not at 0. b = ${Yv} − m${X}.`],
    [[m, Qp[1]], MC.firstOut, `${F(Qp[1])} is the output at ${X} = ${F(Qp[0])}, not at 0. b = ${Yv} − m${X}.`],
    [[m, P[1] + m * P[0]], MC.backSolve, `Subtract m${X}, don't add it: b = ${F(P[1])} − (${F(m * P[0])}).`],
    [[1 / m, bb], MC.inverted, `Slope is change in ${Yv} ÷ change in ${X}.`],
    [[bb, m], MC.swapMB, `The slope goes in front of ${X}; b is added.`],
  ], `Find the slope first, then b = ${Yv} − m${X} with one of the points.`);
});

// 19 missing-coordinate
const missingY: G = (R, n) => fitted(() => {
  const m = pick(R, [2, 3, -2, -3, 0.5, -0.5, 1.5]), bb = int(R, -5, 5), x = pick(R, [-4, -2, -1, 1, 2, 3, 4, 6].filter(v => Number.isInteger(m * v)));
  const y = m * x + bb;
  if (Math.abs(y) > 12) return missingY(R, n);
  const g = grid([-6, 7, x], [-7, 7, y]);
  g.lines = [{ id: 'L', m, b: bb }];
  g.points = [pt('P', x, y, `(${F(x)}, ?)`, 'pick')];
  const wrongSwap = (x - bb) / m;
  return numAns({
    id: `missingY-${n}`, family: 'missingY', prompt: `The point (${F(x)}, ?) is on the line ${S.eqHtml(S.q(m), S.q(bb))}. What is its ${Yv}-coordinate?`,
    board: `${S.eqTex(S.q(m), S.q(bb))},\\quad (${S.tnum(x)},\\ ?)`,
    solution: [`The first number is ${X}: put ${X} = ${F(x)} in.`, `${Yv} = ${F(m)} · ${x < 0 ? `(${F(x)})` : F(x)} ${bb < 0 ? '−' : '+'} ${Math.abs(bb)} = ${sOk(F(y))}.`],
    picture: { graph: g },
  }, y, 'num', `Yes: (${F(x)}, ${F(y)}) is on the line.`, [
    [Number.isFinite(wrongSwap) ? wrongSwap : null, MC.swapXY, `${F(x)} is the ${X}-coordinate (first number). Put it in for ${X}, not ${Yv}.`],
    [m * x - bb, undefined, `Watch the sign of b: ${bb < 0 ? '−' : '+'} ${Math.abs(bb)}.`],
  ], `Put ${X} = ${F(x)} into the equation.`);
});
const missingX: G = (R, n) => fitted(() => {
  const m = pick(R, [2, 3, -2, -3, 0.5, -0.5, 4]), bb = int(R, -5, 5), x = pick(R, [-4, -3, -2, 1, 2, 3, 4, 5]);
  const y = m * x + bb;
  if (!Number.isInteger(y) || Math.abs(y) > 12 || y === x) return missingX(R, n);
  const g = grid([-6, 7, x], [-7, 7, y]);
  g.lines = [{ id: 'L', m, b: bb }];
  g.points = [pt('P', x, y, `(?, ${F(y)})`, 'pick')];
  return numAns({
    id: `missingX-${n}`, family: 'missingX', prompt: `The point (?, ${F(y)}) is on the line ${S.eqHtml(S.q(m), S.q(bb))}. What is its ${X}-coordinate?`,
    board: `${S.tnum(y)} = ${S.eqTex(S.q(m), S.q(bb)).replace('y = ', '')}`,
    solution: [`Put ${Yv} = ${F(y)} in and solve: ${F(y)} = ${F(m)}${X} ${bb < 0 ? '−' : '+'} ${Math.abs(bb)}.`, `${bb < 0 ? 'Add' : 'Subtract'} ${Math.abs(bb)}: ${F(m)}${X} = ${F(y - bb)}. Divide by ${F(m)}: ${X} = ${sOk(F(x))}.`],
    picture: { graph: g },
  }, x, 'num', `Yes: ${X} = ${F(x)}. Check: ${F(m)} · ${x < 0 ? `(${F(x)})` : F(x)} ${bb < 0 ? '−' : '+'} ${Math.abs(bb)} = ${F(y)}.`, [
    [m * y + bb, MC.swapXY, `${F(y)} is the ${Yv}-coordinate (second number). Put it in for ${Yv} and solve for ${X}.`],
    [y - bb, MC.multNotDiv, `${F(y - bb)} is ${F(m)}${X}. One more step: divide by ${F(m)}.`],
    [(y + bb) / m, undefined, `Undo the ${bb < 0 ? '−' : '+'} ${Math.abs(bb)} with its opposite.`],
  ], `Put ${Yv} = ${F(y)} in and solve the two-step equation.`);
});

// 20 interpret-m-b-in-context
const meaningMB: G = (R, n) => fitted(() => {
  const v = pick(R, ['plan', 'plan', 'plant'] as const);
  if (v === 'plant') {
    // the start differs from the slope, so "what does the b tell you" asks about one number only
    const m = int(R, 2, 4), b0 = int(R, 3, 8), bb = b0 === m ? b0 + 4 : b0, w0 = int(R, 2, 4);
    const g = grid([12], [bb + 12 * m], { xName: 'week', yName: 'height (cm)' });
    g.lines = [{ id: 'L', m, b: bb, ends: 'segment', from: w0, to: 10 }];
    return choice(R, {
      id: `meaningMB-${n}`, family: 'meaningMB', prompt: `A plant was measured from week ${w0} to week 10. Its height fits ${Yv} = ${m}${X} + ${b(bb)} (cm, ${X} in weeks). What does the ${b(bb)} tell you?`,
      board: `y = ${m}x + ${bb},\\quad ${w0} \\le x \\le 10`,
      solution: [`${bb} is the output when ${X} = 0: week 0.`, `Week 0 is outside the measured weeks, so it is ${sOk('what the rule gives at week 0, not a measured height')}.`],
      picture: { graph: g },
    }, [
      { t: `The rule gives ${bb} cm at week 0, but week 0 was never measured.`, ok: true, say: `Yes: ${bb} is the value at input 0, and 0 is outside the measured weeks.` },
      { t: `The plant was ${bb} cm tall at week ${w0}.`, mc: MC.firstOut, say: `At week ${w0} the rule gives ${m * w0 + bb} cm. b is the value at week 0.` },
      { t: `The plant grows ${bb} cm each week.`, mc: MC.swapMB, say: `The growth per week is the slope, ${m}. The added number is the value at week 0.` },
      { t: `The plant is ${bb} weeks old.`, mc: MC.inputUnits, say: `b is an output, a height in cm, not a number of weeks.` },
    ]);
  }
  const m = pick(R, [15, 20, 25, 30]), bb = pick(R, [40, 50, 60, 35]), askM = R() < 0.5;
  const g = grid([10], [bb + 10 * m], { xName: 'months', yName: 'total ($)' });
  g.lines = [{ id: 'L', m, b: bb, ends: 'ray', from: 0 }];
  return choice(R, {
    id: `meaningMB-${n}`, family: 'meaningMB', prompt: `A music lesson plan: total cost ${Yv} = ${a(m)}${X} + ${b(bb)}, after ${X} months. What does the ${askM ? a(m) : b(bb)} mean?`,
    board: `y = ${m}x + ${bb}`,
    solution: [`${m} multiplies ${X}: it is added once per month, the slope in dollars per month.`, `${bb} is added once: the cost at 0 months.`, `So the ${askM ? m : bb} means ${sOk(askM ? `$${m} more each month` : `$${bb} at the start`)}.`],
    picture: { graph: g },
  }, askM ? [
    { t: `$${m} more for each month`, ok: true, say: `Yes: the slope, $${m} per month.` },
    { t: `$${m} to start`, mc: MC.swapMB, say: `The start is the number added on its own: $${bb}. ${m} multiplies the months.` },
    { t: `$${m} in total`, mc: MC.perUnit, say: `Not in total: $${m} for EACH month.` },
    { t: `${m} months for each dollar`, mc: MC.inverted, say: 'Slope units are output per input: dollars per month.' },
  ] : [
    { t: `$${bb} at the start, at 0 months`, ok: true, say: `Yes: the initial value, the cost when ${X} = 0.` },
    { t: `$${bb} more each month`, mc: MC.swapMB, say: `Each month adds $${m}, the number times ${X}. The $${bb} is paid once.` },
    { t: `$${bb} after the first month`, mc: MC.firstOut, say: `After 1 month the total is $${bb + m}. The $${bb} is at 0 months.` },
    { t: `${bb} months`, mc: MC.inputUnits, say: `b is an output: dollars, not months.` },
  ]);
});

// 21 compare-two-relationships
const compareRates: G = (R, n) => fitted(() => {
  const form = pick(R, ['table', 'graph', 'words'] as const);
  const prop = R() < 0.5;
  const mA = pick(R, [3, 3.5, 4, 4.5, 5, 6]), mB = pick(R, [2.5, 3, 4, 5, 5.5, 7].filter(x => x !== mA));
  const bA = prop ? 0 : pick(R, [0, 5, 10]), bB = prop ? 0 : pick(R, [10, 15, 20]);
  const who = ['Ava', 'Ben'];
  let pic: Pic;
  let bText: string;
  if (form === 'table') {
    const xs = pick(R, [[2, 5, 6, 10], [1, 4, 5, 8], [0, 3, 4, 9]]);
    pic = { table: { heads: ['hours', 'dollars'], rows: xs.map(x => [String(x), F(mB * x + bB)]), gaps: [{ i: 0, j: 1, dx: '+' + (xs[1]! - xs[0]!), dy: '+' + F(mB * (xs[1]! - xs[0]!)) }] }, hide: ['gap:0'] };
    bText = `${who[1]}'s pay is in the table.`;
  } else if (form === 'graph') {
    const g = grid([8], [mB * 8 + bB], { xName: 'hours', yName: 'dollars' });
    g.lines = [{ id: 'L', m: mB, b: bB, ends: 'ray', from: 0 }];
    g.points = [pt('P', 2, mB * 2 + bB), pt('Q', 6, mB * 6 + bB)];
    pic = { graph: g };
    bText = `${who[1]}'s pay is on the graph.`;
  } else {
    const g = grid([8], [mA * 8 + bA, mB * 8 + bB], { xName: 'hours', yName: 'dollars' });
    g.lines = [{ id: 'L', m: mB, b: bB, ends: 'ray', from: 0 }];
    pic = { graph: g, hide: ['line:L'] };
    bText = `${who[1]} earns ${bB ? `$${bB} to start plus ` : ''}$${F(mB, true)} for each hour.`;
  }
  const faster = mA > mB ? who[0]! : who[1]!;
  return choice(R, {
    id: `compareRates-${n}`, family: 'compareRates', prompt: `${who[0]}'s pay is ${Yv} = ${F(mA)}${X}${bA ? ` + ${bA}` : ''} (${X} in hours). ${bText} Whose pay grows faster per hour?`,
    board: `\\text{${who[0]}: } y = ${S.tnum(mA)}x${bA ? ` + ${bA}` : ''}`,
    solution: [`${who[0]}: slope ${F(mA)} dollars per hour.`, `${who[1]}: change in dollars ÷ change in hours = ${F(mB)} dollars per hour.`, `${sOk(faster)} grows faster: the bigger slope.`],
    picture: pic,
  }, [
    { t: who[0]!, ok: mA > mB, mc: mA > mB ? undefined : MC.height, say: mA > mB ? `Yes: ${F(mA)} per hour beats ${F(mB)}.` : `Compare the rates, not the amounts: ${who[1]} gets ${F(mB)} per hour, ${who[0]} ${F(mA)}.` },
    { t: who[1]!, ok: mB > mA, mc: mB > mA ? undefined : MC.height, say: mB > mA ? `Yes: ${F(mB)} per hour beats ${F(mA)}.` : `Compare the rates, not the amounts: ${who[0]} gets ${F(mA)} per hour, ${who[1]} ${F(mB)}.` },
    { t: 'They grow at the same rate', say: `${F(mA)} and ${F(mB)} per hour are different.` },
  ], true);
});
const compareGraphs: G = (R, n) => fitted(() => {
  const mHigh = pick(R, [1, 1.5, 2]), mSteep = mHigh + pick(R, [1, 1.5, 2]), bHigh = pick(R, [8, 10, 12]), bSteep = pick(R, [0, 2]);
  const askFaster = R() < 0.7;
  const g = grid([8], [bHigh + 8 * mHigh, bSteep + 8 * mSteep], { xName: 'months', yName: 'cost ($)' });
  const nH = R() < 0.5 ? 'A' : 'B', nS = nH === 'A' ? 'B' : 'A';
  g.lines = [{ id: 'H', m: mHigh, b: bHigh, ends: 'ray', from: 0, name: nH }, { id: 'S', m: mSteep, b: bSteep, ends: 'ray', from: 0, name: nS }];
  return choice(R, {
    id: `compareGraphs-${n}`, family: 'compareGraphs', prompt: askFaster ? `Two streaming plans: plan ${nH} starts at $${bHigh}, plan ${nS} at $${bSteep}. Whose cost grows faster each month?` : `Two plans: plan ${nS} adds $${F(mSteep)} a month, plan ${nH} $${F(mHigh)}. Which one has the bigger starting fee?`,
    board: askFaster ? `\\text{compare the slopes}` : `\\text{compare } y \\text{ at } x = 0`,
    solution: askFaster ? [`Plan ${nH} starts higher, but rises ${F(mHigh)} per month. Plan ${nS} rises ${F(mSteep)} per month.`, `Faster growth = bigger slope: ${sOk('plan ' + nS)}.`]
      : [`At 0 months, plan ${nH} is at ${bHigh} and plan ${nS} at ${bSteep}.`, `Bigger starting fee: ${sOk('plan ' + nH)}.`],
    picture: { graph: g },
  }, [
    { t: `Plan ${askFaster ? nS : nH}`, ok: true, say: askFaster ? `Yes: steeper means faster, ${F(mSteep)} a month.` : `Yes: it starts at $${bHigh}.` },
    { t: `Plan ${askFaster ? nH : nS}`, mc: askFaster ? MC.height : MC.height, say: askFaster ? `Plan ${nH} is higher at first, but it rises only ${F(mHigh)} a month. Faster is about steepness, not height.` : `Plan ${nS} grows faster, but it starts lower: $${bSteep} at 0 months.` },
    { t: 'Both the same', say: askFaster ? 'Compare the slopes: they are different.' : 'Compare the values at 0 months: they are different.' },
  ].sort((u, v) => u.t.localeCompare(v.t)), true);
});

// 22 ratio-vs-slope
const ratioOrSlope: G = (R, n) => fitted(() => {
  const prop = R() < 0.4, m = pick(R, [2, 3, 4, 5]), bb = prop ? 0 : pick(R, [2, 3, 4, 6, -2]);
  const xs = pick(R, [[1, 2, 4, 5], [0, 2, 3, 6], [1, 3, 4, 6], [2, 4, 5, 8]]);
  const rows = xs.map(x => [x, m * x + bb] as [number, number]);
  const yx = (r: [number, number]) => (r[0] === 0 ? '—' : S.qText(S.ratioQ(r[0], r[1])!));
  const table: TableParams = { heads: ['x', 'y', 'y/x'], rows: rows.map(r => [F(r[0]), F(r[1]), yx(r)]), gaps: [{ i: 0, j: 1, dx: '+' + (xs[1]! - xs[0]!), dy: '+' + m * (xs[1]! - xs[0]!) }, { i: 2, j: 3, dx: '+' + (xs[3]! - xs[2]!), dy: '+' + m * (xs[3]! - xs[2]!) }] };
  return choice(R, {
    id: `ratioOrSlope-${n}`, family: 'ratioOrSlope', prompt: `Work out ${Yv}/${X} in each row (skip ${X} = 0) and the slope between rows. Which one stays the same?`,
    board: `${rows.slice(0, 3).map(r => S.ptTex(r[0], r[1])).join(',\\ ')},\\ \\dots`,
    solution: [`Slope between rows: always ${m}.`, prop ? `${Yv}/${X}: ${m} in every row too, because the line goes through (0, 0).` : `${Yv}/${X}: ${rows.filter(r => r[0]).map(yx).join(', ')}. It changes, because of the ${bb < 0 ? '−' : '+'} ${Math.abs(bb)}.`,
      `So ${sOk(prop ? 'both stay the same' : 'only the slope stays the same')}.`],
    picture: { table, hide: ['col:2', 'gap:0', 'gap:1'] },
  }, [
    { t: 'Both y/x and the slope', ok: prop, mc: prop ? undefined : MC.scalesNP, say: prop ? `Yes: y/x = ${m} and the slope is ${m}. That is a proportional table.` : `Work out y/x: ${rows.filter(r => r[0]).map(yx).join(', ')}. Not the same: the start of ${F(bb)} spoils it.` },
    { t: 'Only the slope', ok: !prop, mc: !prop ? undefined : MC.dichotomy, say: !prop ? `Right: the slope is always ${m}, but y/x changes.` : `Check y/x: it is ${m} in every row too. Proportional tables have both.` },
    { t: 'Only y/x', say: `The slope between rows is ${m} every time. It stays the same too.` },
    { t: 'Neither', say: `The slope between rows is ${m} every time.` },
  ], true);
});
const yOverX: G = (R, n, sg) => fitted(() => {
  const m = pick(R, [2, 3, 4, -2]), bb = sg === 'justify-b-zero' || R() < 0.75 ? pick(R, [2, 3, 4, 6, 8, 12]) : 0;
  const divs = [1, 2, 3, 4, 6].filter(x => bb % x === 0);
  const sel = shuffle(R, divs.slice()).slice(0, 2).sort((u, v) => u - v);
  if (sel.length < 2) return yOverX(R, n, sg);
  const [x1, x2] = sel as [number, number];
  const r1 = m + bb / x1, r2 = m + bb / x2;
  const g = grid([x2 + 1], [m * x2 + bb, bb, m * x1 + bb]);
  g.lines = [{ id: 'L', m, b: bb }];
  g.points = [pt('P', x1, m * x1 + bb), pt('Q', x2, m * x2 + bb)];
  g.rays = [{ id: 'p', through: [x1, m * x1 + bb], role: 'pick' }, { id: 'q', through: [x2, m * x2 + bb], role: 'second' }];
  return pairAns({
    id: `yOverX-${n}`, family: 'yOverX', prompt: `On the line ${S.eqHtml(S.q(m), S.q(bb))}, find ${Yv}/${X} at ${X} = ${a(x1)} and at ${X} = ${a(x2)}. The slope is ${m} everywhere: is ${Yv}/${X}?`,
    board: `${S.eqTex(S.q(m), S.q(bb))}:\\quad \\frac{y}{x} \\text{ at } x = ${x1},\\ x = ${x2}`, pairLead: `at <i>x</i> = ${x1}:`, pairOp: `at <i>x</i> = ${x2}:`,
    solution: [`At ${X} = ${x1}: ${Yv} = ${F(m * x1 + bb)}, so ${Yv}/${X} = ${F(m * x1 + bb)} ÷ ${x1} = ${a(F(r1))}.`, `At ${X} = ${x2}: ${Yv} = ${F(m * x2 + bb)}, so ${Yv}/${X} = ${b(F(r2))}.`,
      bb === 0 ? `The same: the line goes through (0, 0), so ${Yv}/${X} = the slope.` : `${sOk('Different')}: one counterexample shows a constant slope does NOT give a constant ${Yv}/${X} when b ≠ 0.`],
    picture: { graph: g, hide: ['ray:p', 'ray:q'] },
  }, [r1, r2], bb === 0 ? `Yes: both ${F(r1)}, the slope. Through (0, 0), ${Yv}/${X} is constant.` : `Yes: ${F(r1)} and ${F(r2)}. Different, even though the slope is ${m} everywhere.`, [
    [[m, m], MC.scalesNP, `The slope is ${m}, but ${Yv}/${X} uses the values: ${F(m * x1 + bb)} ÷ ${x1}. Work it out at each point.`],
    [[x1 / (m * x1 + bb), x2 / (m * x2 + bb)], MC.kInv, `That is ${X}/${Yv}. Divide ${Yv} by ${X}.`],
  ], `Find ${Yv} at each ${X}, then divide ${Yv} by ${X}.`);
});

// 23 nonlinear-varying-rate
const varyingRate: G = (R, n) => fitted(() => {
  const kind = pick(R, ['sq', 'sq0', 'lin', 'prop'] as const);
  const xs = pick(R, [[0, 1, 2, 4], [0, 2, 3, 5], [1, 2, 4, 5], [0, 1, 3, 4]]);
  const k = int(R, 2, 3), c = int(R, 1, 5);
  const f = (x: number) => (kind === 'sq' ? x * x + c : kind === 'sq0' ? x * x : kind === 'lin' ? k * x + c : k * x);
  const rows = xs.map(x => [x, f(x)] as [number, number]);
  const rates = S.rowRates(rows).map(q => q!);
  const linear = rates.every(r => qEq(r, rates[0]!));
  const through0 = rows.some(r => r[0] === 0 && r[1] === 0);
  const table: TableParams = { heads: ['x', 'y'], rows: rows.map(r => [String(r[0]), String(r[1])]), gaps: rows.slice(1).map((r, i) => ({ i, j: i + 1, dx: '+' + (r[0] - rows[i]![0]), dy: '+' + (r[1] - rows[i]![1]) })) };
  const rTxt = rates.map(q => S.qText(q)).join(', ');
  return choice(R, {
    id: `varyingRate-${n}`, family: 'varyingRate', prompt: `Find the rate of change between each pair of rows (the ${X}-steps are not all equal). Is the relationship linear?`,
    board: `${rows.map(r => S.ptTex(r[0], r[1])).join(',\\ ')}`,
    solution: [`Rates: ${rTxt}.`, linear ? `All the same, so the points are on ${sOk('one line: linear')}.` : `They change, so ${sOk('not linear')}${through0 ? ', even though it goes through (0, 0)' : ''}.`],
    picture: { table, hide: table.gaps!.map((_, i) => 'gap:' + i) },
  }, [
    { t: linear ? `Linear: the rate is ${rTxt.split(', ')[0]} every time` : `Not linear: the rates are ${rTxt}`, ok: true, say: linear ? 'Yes: a constant rate means linear.' : 'Yes: a changing rate means not linear.' },
    { t: linear ? `Not linear: the outputs grow by different amounts` : 'Linear: the outputs keep going up', mc: linear ? MC.step : MC.illusion, say: linear ? 'The outputs grow by different amounts because the x-steps differ. Divide: the rate is the same.' : `Going up is not enough: the rates are ${rTxt}.` },
    // for a proportional table "y/x is the same in every row" is TRUE: then the distractor says it is not linear
    kind === 'prop' ? { t: 'Not linear: y/x is the same in every row, so it is proportional instead', mc: MC.dichotomy, say: 'Proportional relationships are linear too: the rate is the same between every two rows.' } :
    { t: through0 && !linear ? 'Proportional: it goes through (0, 0)' : 'Proportional: y/x is the same in every row', mc: through0 && !linear ? MC.origin : MC.scalesNP, ok: false, say: through0 && !linear ? 'Through (0, 0) is not enough: the rate must be constant too.' : `Check y/x: it is not the same in every row.` },
    { t: linear ? 'Not linear: it is not proportional' : 'Linear: it is not proportional', mc: MC.dichotomy, say: 'Not proportional does not decide it. Linear means a constant rate of change; check the rates.' },
  ].filter((o, i, all) => all.findIndex(x => x.t === o.t) === i));
});

// 24 three-way-classification
const CLASS = ['proportional', 'linear, not proportional', 'nonlinear'] as const;
type Cls = (typeof CLASS)[number];
function clsOpts(right: Cls, says: Record<Cls, [string | undefined, string]>): Opt[] {
  return CLASS.map(c => ({ t: c[0]!.toUpperCase() + c.slice(1), ok: c === right, mc: c === right ? undefined : says[c][0], say: c === right ? `Yes: ${c}.` : says[c][1] }));
}
const classify3: G = (R, n) => fitted(() => {
  const k = int(R, 2, 6), c = int(R, 1, 9);
  const v = pick(R, ['kx', 'xk', 'kxc', 'kOverX', 'sq', 'fee', 'area', 'perlb'] as const);
  const T: Record<typeof v, [string, string, Cls, Record<Cls, [string | undefined, string]>]> = {
    kx: [`${Yv} = ${k}${X}`, `y = ${k}x`, 'proportional', { proportional: [undefined, ''], 'linear, not proportional': [MC.dichotomy, `It is linear AND proportional: through (0, 0) with y/x = ${k}.`], nonlinear: [undefined, 'Its graph is a straight line.'] }],
    xk: [`${Yv} = ${X}/${k}`, `y = \\frac{x}{${k}}`, 'proportional', { proportional: [undefined, ''], 'linear, not proportional': [MC.divForm, `Dividing by ${k} is multiplying by 1/${k}: y = (1/${k})x, proportional.`], nonlinear: [MC.divForm, `x/${k} is (1/${k})x: a straight line through (0, 0).`] }],
    kxc: [`${Yv} = ${k}${X} − ${c}`, `y = ${k}x - ${c}`, 'linear, not proportional', { proportional: [MC.constProp, `The − ${c} means it misses (0, 0): y/x is not constant.`], 'linear, not proportional': [undefined, ''], nonlinear: [undefined, `Its rate is always ${k}: linear.`] }],
    kOverX: [`${Yv} = ${k}/${X} (${X} ≠ 0)`, `y = \\frac{${k}}{x}`, 'nonlinear', { proportional: [MC.divForm, `${k}/${X} divides BY ${X}: doubling ${X} halves ${Yv}. Not a constant multiple of ${X}.`], 'linear, not proportional': [MC.dichotomy, 'Its rate changes (try x = 1, 2, 4): not linear.'], nonlinear: [undefined, ''] }],
    sq: [`${Yv} = ${X}²`, `y = x^2`, 'nonlinear', { proportional: [MC.origin, 'It goes through (0, 0), but the rate changes: 1, 3, 5, ...'], 'linear, not proportional': [MC.dichotomy, 'Not proportional does not make it linear: its rate changes.'], nonlinear: [undefined, ''] }],
    fee: [`a phone plan: $${c * 5} a month plus $${k} per gigabyte`, `y = ${k}x + ${c * 5}`, 'linear, not proportional', { proportional: [MC.scalesNP, 'The monthly fee means 0 GB still costs money: not proportional.'], 'linear, not proportional': [undefined, ''], nonlinear: [undefined, `Each gigabyte adds the same $${k}: linear.`] }],
    area: ['the area of a square with side length x', 'A = x^2', 'nonlinear', { proportional: [MC.origin, 'Doubling the side makes the area 4 times as big, not 2.'], 'linear, not proportional': [MC.dichotomy, 'The area grows faster and faster: 1, 4, 9, 16. Not linear.'], nonlinear: [undefined, ''] }],
    perlb: [`apples at $${k} per pound`, `y = ${k}x`, 'proportional', { proportional: [undefined, ''], 'linear, not proportional': [MC.dichotomy, `It is linear AND proportional: 0 pounds cost $0, and y/x = ${k}.`], nonlinear: [undefined, `Each pound adds $${k}: a straight line.`] }],
  };
  const [html_, tex_, right, says] = T[v];
  return choice(R, {
    id: `classify3-${n}`, family: 'classify3', prompt: `Classify ${html_}: proportional, linear but not proportional, or nonlinear?`, board: tex_,
    solution: [`Linear: the rate of change is constant. Proportional: linear AND through (0, 0) (b = 0).`, `${html_}: ${sOk(right)}.`],
  }, clsOpts(right, says), true);
});
const classifyGraph: G = (R, n) => fitted(() => {
  const v = pick(R, ['prop', 'lin', 'curve0', 'curve'] as const);
  const k = pick(R, [0.5, 1, 1.5, 2]), c = int(R, 2, 5);
  const g = grid([8], [9]);
  g.x1 = 8; g.y1 = 10; g.yStep = 1; g.xStep = 1; g.x0 = 0; g.y0 = 0;
  g.lines = [v === 'prop' ? { id: 'L', m: k, b: 0, ends: 'ray', from: 0 } : v === 'lin' ? { id: 'L', m: k / 2, b: c, ends: 'ray', from: 0 }
    : { id: 'L', curve: { a: v === 'curve0' ? 0.15 : 0.12, c: v === 'curve0' ? 0 : c }, from: 0, ends: 'plain' }];
  const L0 = g.lines[0]!, fy = (x: number) => (L0.curve ? L0.curve.a * x * x + L0.curve.c : L0.m! * x + L0.b!), x1 = 2, x2 = 4;
  const right: Cls = v === 'prop' ? 'proportional' : v === 'lin' ? 'linear, not proportional' : 'nonlinear';
  const says: Record<Cls, [string | undefined, string]> = v === 'prop' ? { proportional: [undefined, ''], 'linear, not proportional': [MC.dichotomy, 'A straight line through (0, 0) is proportional (and linear).'], nonlinear: [undefined, 'It is a straight line.'] }
    : v === 'lin' ? { proportional: [MC.linProp, `A straight line, but it starts at ${c}, not at (0, 0): not proportional.`], 'linear, not proportional': [undefined, ''], nonlinear: [undefined, 'It is a straight line.'] }
      : { proportional: [v === 'curve0' ? MC.origin : MC.scalesNP, v === 'curve0' ? 'Through (0, 0) is not enough: it curves, so its rate changes.' : 'It curves: its rate changes.'], 'linear, not proportional': [MC.dichotomy, 'It curves: the rate changes, so it is not linear.'], nonlinear: [undefined, ''] };
  return choice(R, {
    id: `classifyGraph-${n}`, family: 'classifyGraph', prompt: `Classify the graph: proportional, linear but not proportional, or nonlinear?`, board: `${S.ptTex(x1, Math.round(fy(x1) * 100) / 100)},\\ ${S.ptTex(x2, Math.round(fy(x2) * 100) / 100)}`,
    solution: [`Straight line = constant rate = linear. Through (0, 0) too = proportional.`, `This one: ${sOk(right)}.`],
    picture: { graph: g },
  }, clsOpts(right, says), true);
});

// 25 justify-b-zero
const bZero: G = (R, n) => fitted(() => {
  const k = pick(R, [2, 3, 4, 1.5, 2.5]), x = int(R, 2, 5), y = k * x;
  const suff = R() < 0.5;
  const g = grid([x + 2], [y + 1]);
  g.lines = [{ id: 'L', m: k, b: 0 }];
  g.points = [pt('O', 0, 0, false), pt('P', x, y, '(x, y)')];
  g.tris = [tri('t', [0, 0], [x, y], 'x', 'y')];
  if (!suff) return choice(R, {
    id: `bZero-${n}`, family: 'bZero', prompt: `A proportional relationship ${Yv} = ${F(k)}${X} is also linear, ${Yv} = m${X} + b. What must b be, and why?`, board: `y = ${S.tnum(k)}x \\quad\\text{as}\\quad y = mx + b`,
    solution: [`At ${X} = 0 the proportional rule gives ${Yv} = ${F(k)} · 0 = 0.`, `y = m${X} + b gives b at ${X} = 0. They agree, so ${sOk('b = 0')}.`],
    picture: { graph: g, hide: ['tri:t', 'run:t', 'rise:t', 'pt:P', 'ptl:P'] },
  }, [
    { t: `b = 0, because at x = 0 the output is ${F(k)} · 0 = 0.`, ok: true, say: 'Yes: the output at input 0 is b, and a proportional rule gives 0 there.' },
    { t: 'b can be any number: the slope makes it proportional.', mc: MC.propB, say: `With b ≠ 0, the output at x = 0 is not 0, and y/x changes. Proportional needs b = 0.` },
    { t: `b = ${F(k)}, the same number as the slope.`, mc: MC.swapMB, say: `${F(k)} is the slope m. b is the output at x = 0, which is 0.` },
    { t: 'There is no b: proportional is not linear.', mc: MC.dichotomy, say: 'Every proportional relationship IS linear: it is the case b = 0.' },
  ]);
  return choice(R, {
    id: `bZero-${n}`, family: 'bZero', prompt: `On a line through (0, 0) with slope ${F(k)}, why is ${Yv}/${X} the same at every point (${X} ≠ 0)?`, board: `${S.ptTex(x, y)}:\\quad \\frac{y}{x} = \\,?`,
    solution: [`Draw the slope triangle from (0, 0) to (${X}, ${Yv}): run ${a(X)}, rise ${b(Yv)}.`, `Rise ÷ run is the slope, so ${sOk(`${Yv}/${X} = ${F(k)}`)} at every point. A proof for all points, not a few examples.`],
    picture: { graph: g, hide: ['tri:t', 'run:t', 'rise:t'] },
  }, [
    { t: `The slope triangle from (0, 0) to (x, y) has rise y and run x, so y/x is the slope, ${F(k)}.`, ok: true, say: 'Yes: that works for every point, so it is a proof.' },
    { t: `I checked two points and both gave ${F(k)}.`, mc: MC.examples, say: 'Two checks are examples, not a proof for every point. The slope triangle from (0, 0) works for all of them.' },
    { t: 'Every line has the same y/x at every point.', mc: MC.scalesNP, say: 'Not every line: y = 2x + 3 has y/x = 5 at x = 1 and 3 at x = 3. It works here because the line goes through (0, 0).' },
    { t: 'Because y/x = 0 at (0, 0).', say: 'y/x is not even defined at x = 0. Use the slope triangle from (0, 0) to any point.' },
  ]);
});

// 26 choose-model-in-context
const chooseModel: G = (R, n) => fitted(() => {
  const rate = pick(R, [4, 5, 6, 8, 12]), fee = R() < 0.55 ? pick(R, [10, 15, 20, 25]) : 0;
  const thing = pick(R, ['bike', 'boat', 'tutor'] as const);
  const what = thing === 'bike' ? 'A bike rental' : thing === 'boat' ? 'A paddle-boat rental' : 'A math tutor';
  const text = `${what} costs ${fee ? `a $${fee} fee plus ` : ''}$${rate} per hour${fee ? '' : ', with no other fee'}.`;
  const xs = [1, 2, 3, 4];
  const table: TableParams = { heads: ['hours', 'cost ($)'], rows: xs.map(x => [String(x), String(rate * x + fee)]) };
  const opts: Opt[] = [
    { t: `y = ${rate}x`, ok: !fee, mc: fee ? MC.scalesNP : undefined, say: fee ? `That leaves out the $${fee} fee: 1 hour costs $${rate + fee}, not $${rate}.` : 'Yes: no fee, so 0 hours cost $0. Doubling the hours doubles the cost.' },
    { t: `y = ${rate}x + ${fee || rate}`, ok: !!fee, mc: fee ? undefined : MC.propB, say: fee ? `Yes: the $${fee} is paid once, then $${rate} per hour. Doubling the hours does NOT double the cost.` : 'There is no fee, so nothing is added: 0 hours cost $0.' },
    { t: `y = ${fee || rate}x + ${rate}`, mc: MC.swapMB, say: `The per-hour amount multiplies x; a one-time fee is added.` },
    { t: `y = ${rate + (fee || rate)}x`, mc: MC.feeTimes, say: 'A one-time fee is not paid every hour.' },
  ];
  return choice(R, {
    id: `chooseModel-${n}`, family: 'chooseModel', prompt: `${text} Which equation models the cost ${Yv} for ${X} hours?`, board: `y = mx \\quad\\text{or}\\quad y = mx + b\\,?`,
    solution: [`Doubling test: 2 hours cost $${2 * rate + fee}, 1 hour $${rate + fee}. ${fee ? 'Not double: there is a fixed fee.' : 'Exactly double: proportional.'}`, `So ${sOk(fee ? `y = ${rate}x + ${fee}` : `y = ${rate}x`)}.`],
    picture: { table },
  }, opts.filter((o, i, all) => all.findIndex(x => x.t === o.t) === i));
});
const doubling: G = (R, n) => fitted(() => {
  const rate = pick(R, [3, 4, 5, 6]), fee = R() < 0.65 ? pick(R, [6, 8, 10, 12]) : 0, h = int(R, 2, 3);
  const c1 = rate * h + fee, c2 = rate * 2 * h + fee;
  const g = grid([8], [rate * 8 + fee], { xName: 'time (h)', yName: 'cost ($)' });
  g.lines = [{ id: 'L', m: rate, b: fee, ends: 'segment', from: 0, to: 8 }];
  g.points = [pt('P', h, c1), pt('Q', 2 * h, c2, `(${2 * h}, ?)`, 'pick')];
  return numAns({
    id: `doubling-${n}`, family: 'doubling', prompt: `A rental costs ${fee ? `a $${fee} fee plus ` : ''}$${rate} per hour (0 to 8 hours). ${h} hours cost $${c1}. What do ${2 * h} hours cost?`, unit: 'dollars',
    board: `${h} \\text{ h} \\to \\$${c1},\\quad ${2 * h} \\text{ h} \\to \\,?`,
    solution: fee ? [`The $${fee} fee is paid once, so doubling the hours does not double the cost.`, `${2 * h} hours: $${fee} + $${rate} × ${2 * h} = ${sOk('$' + c2)}.`] : [`No fee: the cost is proportional, so double the hours, double the cost.`, `$${c1} × 2 = ${sOk('$' + c2)}.`],
    picture: { graph: g, hide: ['ptl:Q'] },
  }, c2, 'num', `Yes: $${c2}.${fee ? ` Not $${2 * c1}: the fee is not doubled.` : ''}`, [
    [fee ? 2 * c1 : null, MC.scalesNP, `Doubling $${c1} doubles the $${fee} fee too, but the fee is paid only once: $${fee} + $${rate} × ${2 * h}.`],
    [fee ? rate * 2 * h : null, MC.dropB, `Add the $${fee} fee: it is paid once.`],
  ], `Cost = fee + rate × hours.`);
});

// 27 evidence-limits
const evidence: G = (R, n) => fitted(() => {
  const v = pick(R, ['obs', 'obs', 'rule', 'broken'] as const);
  const m = int(R, 2, 5), c = int(R, 1, 10), xs = pick(R, [[1, 2, 4], [0, 3, 5], [2, 4, 7], [1, 3, 6, 7]]);
  const f = (x: number, i: number) => m * x + c + (v === 'broken' && i === xs.length - 1 ? pick(R, [1, 2, -1]) : 0);
  const rows = xs.map((x, i) => [x, f(x, i)] as [number, number]);
  const rates = S.rowRates(rows).map(q => S.qText(q!));
  const table: TableParams = { heads: ['minutes', 'gallons'], rows: rows.map(r => [String(r[0]), String(r[1])]), gaps: rows.slice(1).map((r, i) => ({ i, j: i + 1, dx: '+' + (r[0] - rows[i]![0]), dy: signedH(r[1] - rows[i]![1]) })) };
  const intro = v === 'rule' ? `A tank fills from a hose that ${b(`always adds ${m} gallons each minute`)}. A student also measured the table.` : `A student measured the water in a tank at a few times. Nothing else is known about how it fills.`;
  const right = v === 'rule' ? 'proven' : v === 'broken' ? 'not' : 'consistent';
  return choice(R, {
    id: `evidence-${n}`, family: 'evidence', prompt: `${intro} What can you say about whether the relationship is linear?`, board: `\\text{rates: } ${rates.map(t => t.replace('−', '-')).join(',\\ ')}`.replace(/,\\ $/, ''),
    solution: [`Rates between the rows: ${rates.join(', ')}.`, v === 'rule' ? `The stated rule (${m} gallons EVERY minute) guarantees a constant rate: ${sOk('proven linear')}.`
      : v === 'broken' ? `The rates differ: one break is enough, ${sOk('proven not linear')}.` : `Same rate for these rows, but the times in between were never measured: ${sOk('consistent with linear, not proven')}.`],
    picture: { table, hide: table.gaps!.map((_, i) => 'gap:' + i) },
  }, [
    { t: 'Proven linear', ok: right === 'proven', mc: right === 'consistent' ? MC.examples : undefined, say: right === 'proven' ? 'Yes: the rule says the rate is the same every minute.' : right === 'consistent' ? 'A few rows that fit are examples, not a proof: the times in between were never measured.' : `The rates are ${rates.join(', ')}: they differ.` },
    { t: 'Consistent with linear, but not proven', ok: right === 'consistent', say: right === 'consistent' ? 'Yes: the data fit a line, but data alone cannot prove it.' : right === 'proven' ? 'Here the stated rule guarantees it: a constant rate every minute is linear.' : `One break is enough: the rates are ${rates.join(', ')}.` },
    { t: 'Proven not linear', ok: right === 'not', say: right === 'not' ? 'Yes: the rate changes, so no line fits every row.' : `The rates are all ${rates[0]}: nothing breaks the pattern.` },
  ], true);
});

// ---------- registry ----------
export const GENERATORS: Record<string, G> = {
  unitRate, rateTable, changes, tableChanges, slopePts, slopeTri, slopeMeaning, squaresToScale, whySimilar, similarOrNot, bigTriangle, brokenPath,
  specialSlope, flatMeaning, hvMatch, onLine, whichPoint, writeFromGraph, directVar, graphStep, whichGraph, readB, tableB, wordsToMB, domainShape,
  allowedInput, bFromPoint, lineFromTwo, missingY, missingX, meaningMB, compareRates, compareGraphs, ratioOrSlope, yOverX, varyingRate, classify3,
  classifyGraph, bZero, chooseModel, doubling, evidence,
};
export const FAMILY_NAMES: Record<string, string> = {
  unitRate: 'Unit rate on a graph', rateTable: 'Rate from a table', changes: 'Changes between points', tableChanges: 'Changes between rows',
  slopePts: 'Slope from two points', slopeTri: 'Read a slope triangle', slopeMeaning: 'What the slope means', squaresToScale: 'Squares to scale',
  whySimilar: 'Why the triangles are similar', similarOrNot: 'Similar or not?', bigTriangle: 'Same line, bigger triangle', brokenPath: 'One line or not?',
  specialSlope: 'Flat and vertical lines', flatMeaning: 'A flat line in a story', hvMatch: 'Zero or undefined?', onLine: 'Is it on the line?',
  whichPoint: 'Which point fits?', writeFromGraph: 'Equation from a graph', directVar: 'Direct variation', graphStep: 'Graph with the slope',
  whichGraph: 'Which line is it?', readB: 'Initial value on a graph', tableB: 'Initial value in a table', wordsToMB: 'Words to y = mx + b',
  domainShape: 'Points, segment, ray or line', allowedInput: 'Allowed inputs', bFromPoint: 'Find b from a point', lineFromTwo: 'Line through two points',
  missingY: 'Missing y', missingX: 'Missing x', meaningMB: 'What m and b mean', compareRates: 'Compare two rates', compareGraphs: 'Steeper or higher?',
  ratioOrSlope: 'y/x or slope?', yOverX: 'y/x along a line', varyingRate: 'Constant rate or not?', classify3: 'Three kinds of relationship',
  classifyGraph: 'Classify the graph', bZero: 'Why b = 0', chooseModel: 'Choose the model', doubling: 'The doubling test', evidence: 'Proof or evidence?',
};
// re-exported for the page's worked example (exact maths, not typed numbers)
export { qDiv, qAdd };
export { fr };
