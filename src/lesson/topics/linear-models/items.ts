// items.ts: exercise families for "Linear equations from a context" (secondary-t6-32, Algebra 1), generated from
// real constant-rate situations (contexts.ts), checked exactly, every typical slip classified against the
// misconception catalogue. A generator gets the SUB-GOAL it practises (plan.ts) and uses that sub-goal's cases from
// the topic JSON. Pictures are data (modelPic.ts): the model on the kit's Plane (a line, a ray, or dots at whole
// numbers; a threshold with its allowed side), a table (TableCard), or a stack of restrictions (Restrictions). Parts
// that would give the answer away come in only on the worked solution. Pure: no DOM, no canvas; a seeded rng.
import { type Item, type Response, type Verdict, int, pick, shuffle } from '../../runtime/item';
import { ans, endOnChoice } from '../../runtime/explain';
import { nH } from '../linear-functions-slope/lineMaths';
import { type MItem, type MPic, type Pic, axis, money } from './modelPic';
import type { RPic } from './Restrictions';
import { type Ctx, DEC, INC, at, cnt, decCtx, defined, exprH, exprT, incCtx, modelH, modelT, out, outU, rateAmt, rateU, startFirstH, startFirstT, vH } from './contexts';

export type FamilyId =
  | 'isLinearStory' | 'unevenTable' | 'startValue' | 'startGraph' | 'propOrNot' | 'doubleTest' | 'rateWords' | 'bothNumbers'
  | 'defineVars' | 'restartClock' | 'buildModel' | 'modelPair' | 'drainModel' | 'rateTwoPoints' | 'rateTable' | 'backStart'
  | 'twoPointModel' | 'unitCheck' | 'pointCheck' | 'targetEq' | 'targetValue' | 'phraseIneq' | 'budgetIneq' | 'discreteOrNot'
  | 'graphForm' | 'boundIneq' | 'emptyTime' | 'feasible' | 'feasibleMax' | 'wholeBoundary' | 'boundaryWhy' | 'exactOrNot'
  | 'reachable' | 'validInterval' | 'extrapolate';
export const FAMILIES: readonly { id: FamilyId; name: string }[] = [
  { id: 'isLinearStory', name: 'Linear or not?' },
  { id: 'unevenTable', name: 'Uneven steps' },
  { id: 'startValue', name: 'Find the start' },
  { id: 'startGraph', name: 'Back to zero on the graph' },
  { id: 'propOrNot', name: 'Proportional or not?' },
  { id: 'doubleTest', name: 'The doubling test' },
  { id: 'rateWords', name: 'What the rate says' },
  { id: 'bothNumbers', name: 'Both numbers, both units' },
  { id: 'defineVars', name: 'Name the variables' },
  { id: 'restartClock', name: 'Restart the clock' },
  { id: 'buildModel', name: 'Story to model' },
  { id: 'modelPair', name: 'Rate and start' },
  { id: 'drainModel', name: 'Going down' },
  { id: 'rateTwoPoints', name: 'Rate from two data points' },
  { id: 'rateTable', name: 'Rate from a table' },
  { id: 'backStart', name: 'Walk back to the start' },
  { id: 'twoPointModel', name: 'Model from two data points' },
  { id: 'unitCheck', name: 'Check the units' },
  { id: 'pointCheck', name: 'Check with a data point' },
  { id: 'targetEq', name: 'Equation for a target' },
  { id: 'targetValue', name: 'Hit the target' },
  { id: 'phraseIneq', name: 'Words to a symbol' },
  { id: 'budgetIneq', name: 'Inequality for a limit' },
  { id: 'discreteOrNot', name: 'Whole numbers or any?' },
  { id: 'graphForm', name: 'Dots or a line?' },
  { id: 'boundIneq', name: 'Values that make sense' },
  { id: 'emptyTime', name: 'When the model stops' },
  { id: 'feasible', name: 'All restrictions at once' },
  { id: 'feasibleMax', name: 'The most that is allowed' },
  { id: 'wholeBoundary', name: 'Round which way?' },
  { id: 'boundaryWhy', name: 'Which whole number, and why' },
  { id: 'exactOrNot', name: 'Exactly, or not at all' },
  { id: 'reachable', name: 'Totals you can hit' },
  { id: 'validInterval', name: 'Where the model holds' },
  { id: 'extrapolate', name: 'Far past the data' },
];
export const FAMILY_NAMES: Record<string, string> = Object.fromEntries(FAMILIES.map(f => [f.id, f.name]));

export interface LItem extends Item { family: FamilyId; picture?: Pic; /** the typical wrong responses the check classifies (tests) */ slips?: Response[] }
type Gen = (R: () => number, n: number, sg?: string) => LItem;

// ---------- misconception ids ----------
export const MC = {
  illusion: 'mc.linear-functions.illusion-of-linearity',
  startLinear: 'mc.linear-functions.starting-amount-implies-linear',
  ignoresStep: 'mc.linear-functions.ignores-input-step',
  firstOut: 'mc.linear-functions.first-output-as-intercept',
  scalesNonProp: 'mc.ratio-rate.scales-non-proportional',
  perUnit: 'mc.linear-functions.rate-without-per-unit',
  reassign: 'mc.linear-functions.reassigns-start-without-coordinate-adjustment',
  letterLabel: 'mc.expressions.letter-as-object-label',
  rolesCue: 'mc.functions-concept.roles-by-surface-cue',
  wordOrder: 'mc.expressions.writes-operations-in-word-order',
  feeTimes: 'mc.linear-functions.multiplies-fee-by-input',
  swapMB: 'mc.linear-functions.swaps-m-and-b',
  negStart: 'mc.linear-functions.negative-start-for-decrease',
  dropsSign: 'mc.linear-functions.drops-slope-sign',
  yOverX: 'mc.linear-functions.slope-as-y-over-x',
  unitsDeco: 'mc.reasoning-language.units-as-decoration',
  formulaAns: 'mc.linear-equations.formula-as-answer',
  strict: 'mc.linear-equations.bound-phrase-strictness-wrong',
  reversed: 'mc.linear-equations.bound-phrase-direction-reversed',
  eqBound: 'mc.linear-equations.equation-for-a-bound',
  keyword: 'mc.linear-equations.bound-symbol-from-keyword-alone',
  wholeOnly: 'mc.functions-concept.continuous-quantity-as-whole-only',
  fractions: 'mc.functions-concept.discrete-quantity-allows-fractions',
  rejects: 'mc.reasoning-language.rejects-valid-context-solutions',
  allReals: 'mc.functions-concept.context-domain-all-reals',
  remainder: 'mc.mul-div.drops-remainder',
  nearest: 'mc.estimation.rounds-nearest-when-context-needs-direction',
  roundsExact: 'mc.linear-equations.rounds-non-integer-exact-solution',
  extrap: 'mc.functions-concept.extrapolates-model',
} as const;

// ---------- building blocks ----------
const near = (a: number, b: number) => Math.abs(a - b) < 1e-6;
const r2 = (v: number) => Math.round(v * 100) / 100;
/** a decimal for the text, at most 2 places ("14.8", "16.67") */
const d2 = (v: number) => nH(r2(v));
const ceilW = (v: number) => Math.ceil(v - 1e-9), floorW = (v: number) => Math.floor(v + 1e-9);
const isWhole = (v: number) => Math.abs(v - Math.round(v)) < 1e-9;
interface Base { id: string; family: FamilyId; prompt: string; board: string; solution: string[]; picture?: Pic; unit?: string }
interface Opt { t: string; mc?: string; say: string }
/** a choice item: the right option and the slips (duplicates of another option are dropped), shuffled */
function choice(R: () => number, b: Base, right: string, okSay: string, wrongs: Opt[], max = 4): LItem {
  const seen = new Set([right]), ws: Opt[] = [];
  for (const w of wrongs) if (!seen.has(w.t) && ws.length < max - 1) { seen.add(w.t); ws.push(w); }
  if (!ws.length) throw new Error(`${b.family}: no wrong option`);
  const opts = shuffle(R, [{ t: right, ok: true, say: okSay } as Opt & { ok?: boolean }, ...ws]);
  const i = opts.findIndex(o => (o as { ok?: boolean }).ok);
  return {
    ...b, input: 'choice', choices: opts.map(o => o.t), answer: { kind: 'choice', i }, solution: endOnChoice(b.solution, right),
    check(r: Response): Verdict {
      if (r.kind !== 'choice' || !opts[r.i]) return { ok: false, say: 'Pick one of the options.' };
      if (r.i === i) return { ok: true, say: okSay };
      const o = opts[r.i]!;
      return { ok: false, mc: o.mc, say: o.say };
    },
  };
}
interface NumSlip { v: number; mc?: string; say: string; tol?: number }
function numItem(b: Base, v: number, okSay: string, slips: NumSlip[], other: string): LItem {
  return {
    ...b, input: 'num', answer: { kind: 'num', v }, slips: slips.filter(s => !near(s.v, v)).map(s => ({ kind: 'num', v: s.v }) as Response),
    check(r: Response): Verdict {
      if (r.kind !== 'num' || !Number.isFinite(r.v)) return { ok: false, say: 'Type a number.' };
      if (near(r.v, v)) return { ok: true, say: okSay };
      const s = slips.find(s => !near(s.v, v) && Math.abs(r.v - s.v) < (s.tol ?? 1e-6));
      return s ? { ok: false, mc: s.mc, say: s.say } : { ok: false, say: other };
    },
  };
}
interface PairSlip { x: number; y: number; mc?: string; say: string }
function pairItem(b: Base, x: number, y: number, lead: string, op: string, okSay: string, slips: PairSlip[], other: string): LItem {
  return {
    ...b, input: 'pair', pairLead: lead, pairOp: op, answer: { kind: 'pair', x, y }, slips: slips.filter(s => !(near(s.x, x) && near(s.y, y))).map(s => ({ kind: 'pair', x: s.x, y: s.y }) as Response),
    check(r: Response): Verdict {
      if (r.kind !== 'pair' || !Number.isFinite(r.x) || !Number.isFinite(r.y)) return { ok: false, say: 'Fill in both boxes.' };
      if (near(r.x, x) && near(r.y, y)) return { ok: true, say: okSay };
      const s = slips.find(s => !(near(s.x, x) && near(s.y, y)) && near(r.x, s.x) && near(r.y, s.y));
      return s ? { ok: false, mc: s.mc, say: s.say } : { ok: false, say: other };
    },
  };
}
const ctxOf = (R: () => number, sg?: string): Ctx => (sg === 's2-negative-rate' ? decCtx(R) : R() < 0.5 ? incCtx(R) : decCtx(R));
/** a plane for a model over 0..xMax: the line keyed 'L' (a ray from 0), axes named with units */
function planeFor(C: Ctx, xMax: number, extraYs: number[], items: MItem[], show: string[], solve: string[], o: { lineKey?: string; xMin?: number; yMin?: number } = {}): MPic {
  const ys = [C.b, at(C, xMax), ...extraYs];
  const x = axis([xMax, o.xMin ?? 0], { name: `${C.xw} (${C.x})`, max: 12, pad: 0 });
  const y = axis(ys, { name: `${C.yw} (${C.y}${C.unit === 'money' ? ', $' : C.unit === '%' ? ', %' : ''})`, money: C.unit === 'money', max: 10, min: o.yMin });
  return { x, y, items: [{ kind: 'line', key: o.lineKey ?? 'L', m: C.m, b: C.b, lo: 0 }, ...items], show: ['axes', ...show], solve };
}
const pt = (key: string, x: number, y: number, name?: string, col?: MItem['col']): MItem => ({ kind: 'point', key, x, y, name, col });
const xy = (C: Ctx, x: number, y: number) => `(${nH(x)}, ${C.unit === 'money' ? money(y) : nH(y)})`;
/** short table headers (a table with its changes must fit 940 px): the letter and the unit */
const UNIT_SHORT: Record<string, string> = { money: '$', '%': '%', gallons: 'gal', inches: 'in', cm: 'cm', miles: 'mi' };
const tabX = (C: Ctx) => (C.many.length <= 9 ? C.many : C.x);
const tabY = (C: Ctx) => `${C.y} (${UNIT_SHORT[C.unit] ?? C.unit})`;
/** the domain a story allows when it runs out (decreasing stories): 0 to the input where the output hits 0 */
const runsOut = (C: Ctx) => C.b / -C.m;

// ===================== stage 1 =====================
// ---------- s1-linear-criterion ----------
const isLinearStory: Gen = (R, n) => {
  const kind = pick(R, ['lin', 'lin', 'const', 'pct', 'speed', 'double'] as const);
  let story: string, xs = [0, 1, 2, 3], ys: number[], xName: string, yName: string;
  const C = kind === 'lin' ? (R() < 0.5 ? incCtx(R, ['gym', 'savings', 'pool', 'tickets']) : decCtx(R, ['tank', 'loan', 'trip'])) : null;
  if (C) { story = C.story; ys = xs.map(x => at(C, x)); xName = tabX(C); yName = tabY(C); }
  else if (kind === 'const') { const p = pick(R, [10, 12, 15, 18]); story = `A streaming plan costs ${money(p)} a month, no matter how many hours you watch. Look at the monthly cost against the hours watched.`; xs = [0, 5, 10, 15]; ys = xs.map(() => p); xName = 'hours'; yName = 'cost ($)'; }
  else if (kind === 'pct') { const p = pick(R, [400, 500, 800]), r = pick(R, [5, 10]); story = `A savings account starts at ${money(p)} and earns ${r}% of its balance every year.`; ys = xs.map(x => r2(p * (1 + r / 100) ** x)); xName = 'years'; yName = 'dollars'; }
  else if (kind === 'speed') { const a = pick(R, [2, 3, 4]); story = `A sled starts at rest and speeds up: it slides ${a} ft in the first second, ${3 * a} ft in the next, ${5 * a} ft in the one after that.`; ys = xs.map(x => a * x * x); xName = 'seconds'; yName = 'feet'; }
  else { const p = pick(R, [20, 25, 30]); story = `A video has ${p} views, and its views double every day.`; ys = xs.map(x => p * 2 ** x); xName = 'days'; yName = 'views'; }
  const linear = kind === 'lin' || kind === 'const';
  const L = 'Linear: the output changes by the same amount for each equal step of the input';
  const N = 'Not linear: the change for each equal step is not the same';
  const S = 'Linear: it starts from a fixed amount';
  const G = 'Linear: the output keeps changing in one direction';
  const d = ys.slice(1).map((y, i) => r2(y - ys[i]!));
  const ws: Opt[] = linear
    ? [{ t: N, say: 'Check the changes: they are all the same, so it is linear.' }, { t: S, mc: MC.startLinear, say: 'A starting amount says nothing about linearity: a doubling video also starts somewhere. The test is a constant change.' }, { t: G, mc: MC.illusion, say: 'Going one way is not enough (doubling goes one way too). Linear means the SAME change per step.' }]
    : [{ t: L, mc: MC.illusion, say: `It ${kind === 'speed' ? 'speeds up' : 'grows'}, but by a different amount each step: ${d.join(', ')}.` }, { t: S, mc: MC.startLinear, say: 'Every situation starts somewhere. The test is whether the change per step stays the same.' }, { t: G, mc: MC.illusion, say: `It changes in one direction, but not by the same amount: ${d.join(', ')}.` }];
  return choice(R, {
    id: `isLinearStory-${n}`, family: 'isLinearStory', board: '\\Delta y\\ \\text{per step} = \\,?',
    prompt: `${story} Which statement is correct, with the right reason?`,
    picture: { t: { xName, yName, xs, ys: ys.map(v => nH(v)), diffs: true } },
    solution: [`The changes for each step: ${d.map(v => (v >= 0 ? '+' : '−') + nH(Math.abs(v))).join(', ')}.`, linear ? 'All the same: a constant change per step, so the situation is linear.' : 'Not all the same: the change itself changes, so it is not linear.'],
  }, linear ? L : N, linear ? 'Yes: the same change every step.' : 'Yes: the change is not constant.', ws, 4);
};
const unevenTable: Gen = (R, n) => {
  const xs = pick(R, [[0, 2, 5, 6], [1, 3, 4, 7], [0, 1, 4, 6], [2, 4, 5, 8]] as const).slice();
  const linear = R() < 0.5;
  const m = pick(R, [2, 3, 4, 5]) * (R() < 0.3 ? -1 : 1), b = int(R, 5, 20) + (m < 0 ? 40 : 0);
  // the trap: the same change per ROW, over unequal steps
  const step = pick(R, [3, 4, 6, 8]);
  const ys = linear ? xs.map(x => m * x + b) : xs.map((_, i) => b + step * i);
  const dx = xs.slice(1).map((x, i) => x - xs[i]!), dy = ys.slice(1).map((y, i) => y - ys[i]!);
  const per = dy.map((v, i) => v / dx[i]!);
  const rate = (v: number) => `${nH(r2(v))} per unit of ${vH('x')}`;
  const rightT = linear ? `Linear, with a rate of ${rate(m)}` : 'Not linear: the change per unit of x is not constant';
  const ws: Opt[] = linear
    ? [{ t: 'Not linear: the changes in y are not equal', mc: MC.ignoresStep, say: `The steps in x are not equal (${dx.join(', ')}). Divide each change by its step: ${per.map(v => nH(r2(v))).join(', ')}, all the same.` },
       { t: `Linear, with a rate of ${rate(dy[0]!)}`, mc: MC.ignoresStep, say: `${nH(dy[0]!)} is the change over ${dx[0]} units of x. Per unit: ${nH(dy[0]!)} ÷ ${dx[0]} = ${nH(m)}.` }]
    : [{ t: `Linear, with a rate of ${rate(step)}`, mc: MC.ignoresStep, say: `Each row adds ${step}, but the x steps are ${dx.join(', ')}. Per unit that is ${per.map(v => nH(r2(v))).join(', ')}: not constant.` },
       { t: `Linear, with a rate of ${rate(per[0]!)}`, mc: MC.ignoresStep, say: `That is only the first step. The next steps give ${per.slice(1).map(v => nH(r2(v))).join(', ')} per unit.` }];
  return choice(R, {
    id: `unevenTable-${n}`, family: 'unevenTable', board: '\\frac{\\Delta y}{\\Delta x} = \\,?',
    prompt: `A table: ${xs.map((x, i) => `${vH('x')} = ${x} gives ${vH('y')} = ${nH(ys[i]!)}`).join('; ')}. The x steps are not equal. Is the relationship linear?`,
    picture: { t: { xName: 'x', yName: 'y', xs, ys: ys.map(v => nH(v)), diffs: true } },
    solution: [`Divide each change in y by its step in x: ${dy.map((v, i) => `${nH(v)} ÷ ${dx[i]} = ${nH(r2(per[i]!))}`).join(', ')}.`, linear ? `The same every time: linear, ${nH(m)} per unit of x.` : 'Not the same: not linear (equal changes per ROW mean nothing when the steps differ).'],
  }, rightT, linear ? 'Yes: per unit of x the change is constant.' : 'Yes: per unit of x the change is not constant.', ws, 3);
};
// ---------- s1-initial-value ----------
const startValue: Gen = (R, n) => {
  const kind = pick(R, ['table1', 'table2', 'words', 'zero'] as const);
  if (kind === 'zero') {
    const p = pick(R, [1.5, 1.75, 2.25, 2.5]), what = pick(R, ['apples', 'grapes', 'cherries']);
    return numItem({
      id: `startValue-${n}`, family: 'startValue', board: 'C = mx + b,\\ b = \\,?', unit: 'dollars',
      prompt: `At a farm stand, ${what} cost ${money(p)} per pound, with no other charge. In the model C = m${vH('x')} + b (C in dollars, ${vH('x')} in pounds), what is the initial value b?`,
      picture: { g: { x: axis([6], { name: 'pounds (x)', pad: 0 }), y: axis([6 * p], { name: 'cost (C, $)', money: true }), items: [{ kind: 'line', key: 'L', m: p, b: 0, lo: 0 }, pt('Z', 0, 0, '(0, $0)', 'link')], show: ['axes'], solve: ['L', 'Z'] } },
      solution: ['The initial value is the output when the input is 0.', `0 pounds cost ${ans('0')} dollars: a proportional relationship.`],
    }, 0, 'Yes: 0 pounds cost $0.', [{ v: p, mc: MC.swapMB, say: `${money(p)} is the price per pound: the rate. At 0 pounds you pay nothing.` }], 'Ask: what does 0 pounds cost?');
  }
  const C = kind === 'words' ? incCtx(R, ['tickets', 'posters', 'gym', 'plumber']) : R() < 0.5 ? incCtx(R, ['savings', 'pool', 'gym']) : decCtx(R, ['tank', 'loan', 'trip']);
  if (kind === 'words') {
    // the rate is the first number in the text, the start comes second
    const story = `Each ${C.one} costs ${money(C.m)}; on top of that, ${C.startW}.`;
    return numItem({
      id: `startValue-${n}`, family: 'startValue', board: `${C.y} = m${C.x} + b,\\ b = \\,?`, unit: 'dollars',
      prompt: `${story} In the model ${vH(C.y)} = m${vH(C.x)} + b (${vH(C.y)} = ${C.yw} in dollars, ${vH(C.x)} = number of ${C.xw}), what is b, the initial value?`,
      picture: { g: planeFor(C, 6, [], [pt('Y', 0, C.b, money(C.b), 'link')], [], ['L', 'Y']) },
      solution: ['The initial value is the output when the input is 0.', `With 0 ${C.many}, the cost is the one-time charge: ${ans(money(C.b))}.`],
    }, C.b, 'Yes: the cost before any of them.', [{ v: C.m, mc: MC.swapMB, say: `${money(C.m)} comes with EACH one: it is the rate. The start is what you pay with 0 ${C.many}.` }], 'Find the output when the input is 0.');
  }
  const k = kind === 'table1' ? 1 : 2, xs = [k, 2 * k, 3 * k, 4 * k], ys = xs.map(x => at(C, x));
  return numItem({
    id: `startValue-${n}`, family: 'startValue', board: `${C.y}\\ \\text{at}\\ ${C.x} = 0`, unit: outU(C),
    prompt: `The ${C.yw} changes at a steady rate. A log of the ${C.yw} (${outU(C)}) after a number of ${C.many}: ${xs.map((x, i) => `${x} → ${nH(ys[i]!)}`).join(', ')}. What was the ${C.yw} at ${vH(C.x)} = 0 ${C.many}?`,
    picture: { t: { xName: tabX(C), yName: tabY(C), xs: [0, ...xs], ys: ['?', ...ys.map(v => nH(v))], hide: [0], ysSolved: [nH(C.b), ...ys.map(v => nH(v))], diffs: false } },
    solution: [`Each step of ${k} ${k === 1 ? C.one : C.many} changes the ${C.yw} by ${nH(ys[1]! - ys[0]!)}.`, `One step back from ${vH(C.x)} = ${k}: ${nH(ys[0]!)} − (${nH(ys[1]! - ys[0]!)}) = ${ans(nH(C.b))}.`],
  }, C.b, 'Yes: one step back to 0.', [
    { v: ys[0]!, mc: MC.firstOut, say: `${nH(ys[0]!)} is the first row, at ${vH(C.x)} = ${k}, not at 0. Go one step back.` },
    { v: ys[0]! + (ys[1]! - ys[0]!), say: 'Going back undoes the change: subtract the step change, do not add it.' },
  ], 'Use the change per step and go back one step to 0.');
};
const startGraph: Gen = (R, n) => {
  const C = R() < 0.5 ? incCtx(R, ['savings', 'gym', 'pool', 'plant']) : decCtx(R, ['tank', 'trip', 'candle', 'loan']);
  const k0 = pick(R, [1, 2]), xs = [k0, k0 + 1, k0 + 2, k0 + 3];
  const items: MItem[] = [...xs.map((x, i) => pt('D' + i, x, at(C, x), undefined, 'first')), { kind: 'seg', key: 'back', a: [xs[0]!, at(C, xs[0]!)], b: [0, C.b], dash: true, col: 'pick' }, pt('Y', 0, C.b, undefined, 'link')];
  const g = planeFor(C, xs[3]! + 1, [], items, xs.map((_, i) => 'D' + i), ['back', 'Y']);
  g.items = g.items.filter(i => i.key !== 'L');
  return numItem({
    id: `startGraph-${n}`, family: 'startGraph', board: `${C.y}\\ \\text{at}\\ ${C.x} = 0 = \\,?`, unit: outU(C),
    prompt: `The graph shows the ${C.yw} after ${xs.join(', ')} ${C.many}: ${xs.map(x => xy(C, x, at(C, x))).join(', ')}. The points lie on a line. What is the initial value (the ${C.yw} at ${vH(C.x)} = 0)?`,
    picture: { g },
    solution: [`From point to point the ${C.yw} changes by ${nH(C.m)} per ${C.one}.`, `Back ${xs[0]} ${xs[0] === 1 ? C.one : C.many} from ${xy(C, xs[0]!, at(C, xs[0]!))}: ${nH(at(C, xs[0]!))} − (${nH(C.m)})(${xs[0]}) = ${ans(nH(C.b))}.`],
  }, C.b, 'Yes: the line meets the vertical axis there.', [
    { v: at(C, xs[0]!), mc: MC.firstOut, say: `That is the first point, at ${vH(C.x)} = ${xs[0]}. The initial value is at ${vH(C.x)} = 0.` },
    { v: at(C, xs[0]!) + C.m * xs[0]!, say: 'Going back to 0 undoes the change: subtract the rate times the steps.' },
  ], 'Follow the line back to the vertical axis (input 0).');
};
// ---------- s1-proportional-contrast ----------
const PROP = [
  (R: () => number) => { const p = pick(R, [1.5, 1.75, 2.25, 2.5]); return { t: `Grapes cost ${money(p)} per pound, with no other charge.`, m: p, b: 0, x: 'pounds', y: 'cost ($)' }; },
  (R: () => number) => { const p = pick(R, [12, 14, 15, 16]); return { t: `A lifeguard earns ${money(p)} per hour, with no base pay.`, m: p, b: 0, x: 'hours', y: 'pay ($)' }; },
  (R: () => number) => { const p = pick(R, [20, 25, 30]); return { t: `A printer prints ${p} pages per minute, starting from an empty tray.`, m: p, b: 0, x: 'minutes', y: 'pages' }; },
  (R: () => number) => { const p = pick(R, [8, 10, 12, 15]); return { t: `A parking garage charges a flat ${money(p)} per day, however many hours you stay.`, m: 0, b: p, x: 'hours parked', y: 'cost ($)' }; },
] as const;
const propOrNot: Gen = (R, n) => {
  const useCtx = R() < 0.5;
  const S = useCtx ? (() => { const C = incCtx(R, ['ride', 'gym', 'plumber', 'posters', 'tickets']); return { t: C.story, m: C.m, b: C.b, x: C.many, y: `${C.yw} ($)` }; })() : pick(R, PROP)(R);
  const P = 'Proportional: the output is 0 when the input is 0, and doubling the input doubles the output';
  const NP = 'Linear but not proportional: there is a nonzero start';
  const NL = 'Not linear';
  const right = S.b === 0 ? P : NP;
  const xMax = 6;
  return choice(R, {
    id: `propOrNot-${n}`, family: 'propOrNot', board: 'y = kx\\ \\ \\text{or}\\ \\ y = mx + b',
    prompt: `${S.t} Is the relationship between the ${S.x} and the ${S.y.replace(/ \(.*\)/, '')} proportional?`,
    picture: { g: { x: axis([xMax], { name: S.x, pad: 0 }), y: axis([S.b, S.m * xMax + S.b], { name: S.y, money: S.y.includes('$') }), items: [{ kind: 'line', key: 'L', m: S.m, b: S.b, lo: 0 }, pt('Y', 0, S.b, undefined, 'link')], show: ['axes'], solve: ['L', 'Y'] } },
    solution: [`At 0 ${S.x} the output is ${nH(S.b)}.`, S.b === 0 ? 'It starts at 0 and grows at a constant rate: proportional.' : `A nonzero start (${nH(S.b)})${S.m === 0 ? ' and a rate of 0' : ''}: linear, not proportional. Doubling the input does not double the output.`],
  }, right, 'Yes.', S.b === 0
    ? [{ t: NP, say: `At 0 ${S.x} the output is 0: the start is 0. That is exactly proportional.` }, { t: NL, say: 'The rate is the same for every unit: it is linear.' }]
    : [{ t: P, mc: MC.scalesNonProp, say: `There is a start of ${nH(S.b)}: double the input and the output does not double.` }, { t: NL, say: S.m === 0 ? 'A flat rate is linear with rate 0: the output stays the same.' : 'The rate is the same for every unit: it is linear.' }], 3);
};
const doubleTest: Gen = (R, n) => {
  const prop = R() < 0.3;
  const C0 = incCtx(R, ['ride', 'plumber', 'gym', 'tickets', 'posters', 'kayak']);
  const P = pick(R, [{ one: 'notebook', p: [2.5, 3.5, 4] }, { one: 'gift card', p: [25, 30] }, { one: 'bag of ice', p: [2.5, 3] }] as const);
  const C = prop ? { ...C0, m: pick(R, P.p), b: 0, one: P.one, many: P.one === 'bag of ice' ? 'bags of ice' : `${P.one}s` } : C0;
  const b = C.b, k = pick(R, [2, 3, 4]);
  const y1 = C.m * k + b, y2 = C.m * 2 * k + b;
  const story = prop ? `A store sells ${C.many} for ${money(C.m)} each, with no other charge.` : C.story;
  const one = C.one, many = C.many;
  return numItem({
    id: `doubleTest-${n}`, family: 'doubleTest', board: `${k}\\ \\to\\ ${money(y1).replace('$', '\\$')},\\quad ${2 * k}\\ \\to\\ \\,?`, unit: 'dollars',
    prompt: `${story} ${k} ${many} cost ${money(y1)}. What do ${2 * k} ${many} cost?`,
    picture: { g: { x: axis([2 * k + 1], { name: many, pad: 0 }), y: axis([0, y2], { money: true, name: 'cost ($)' }), items: [{ kind: 'line', key: 'L', m: C.m, b, lo: 0 }, pt('A', k, y1, undefined, 'first'), pt('Q', 2 * k, y2, undefined, 'link'), pt('Y', 0, b, undefined, 'link')], show: ['axes', 'A'], solve: ['L', 'Y', 'Q'] } },
    solution: prop ? [`No other charge: the cost is proportional, so double the ${many}, double the cost.`, `2 × ${money(y1)} = ${ans(money(y2))}.`]
      : [`The ${money(b)} is paid once. Only the ${money(C.m)} per ${one} doubles.`, `${money(b)} + ${money(C.m)} × ${2 * k} = ${ans(money(y2))}, not 2 × ${money(y1)}.`],
  }, y2, 'Yes.', prop ? [] : [{ v: 2 * y1, mc: MC.scalesNonProp, say: `Doubling ${money(y1)} pays the ${money(b)} twice. It is paid once.` }], 'Start plus rate times the input.');
};
// ---------- s1-interpret-rate-units ----------
const rateWords: Gen = (R, n) => {
  const C = R() < 0.5 ? incCtx(R) : decCtx(R);
  const r = Math.abs(C.m), up = C.m > 0;
  const right = `Each ${C.one} ${up ? 'adds' : 'takes away'} ${out(C, r)}: the rate is ${C.m > 0 ? '' : '−'}${nH(r)} ${rateU(C)}`;
  return choice(R, {
    id: `rateWords-${n}`, family: 'rateWords', board: modelT(C),
    prompt: `${defined(C)}. What does the ${nH(C.m)} tell you?`,
    picture: { g: planeFor(C, Math.min(10, C.m < 0 ? floorW(runsOut(C)) : 8), [], [], ['L'], []) },
    solution: [`${nH(C.m)} multiplies ${vH(C.x)}: it is the change in the ${C.yw} for each ${C.one}.`, `Its unit is output per input: ${rateU(C)}. ${up ? 'Positive: it goes up.' : 'Negative: it goes down.'}`],
  }, right, 'Yes: a rate, with its unit.', [
    { t: `The ${C.yw} is ${out(C, r)}`, mc: MC.perUnit, say: `${nH(C.m)} is not an amount: it is a change PER ${C.one}.` },
    { t: `Each ${C.one} ${up ? 'takes away' : 'adds'} ${out(C, r)}`, mc: MC.dropsSign, say: `The sign shows the direction: ${nH(C.m)} means the ${C.yw} ${up ? 'grows' : 'shrinks'}.` },
    { t: `At the start, the ${C.yw} is ${out(C, r)}`, mc: MC.swapMB, say: `The start is the number added on its own, ${nH(C.b)}. ${nH(C.m)} goes with ${vH(C.x)}.` },
  ]);
};
const bothNumbers: Gen = (R, n) => {
  const C = R() < 0.5 ? incCtx(R) : decCtx(R);
  const S = (a: string, b: string) => `${a}; ${b}`;
  const xv = vH(C.x);
  const bText = `${nH(C.b)} ${outU(C)} is the ${C.yw} at ${xv} = 0`;
  const mText = (u: string) => `the ${C.yw} changes by ${nH(C.m)} ${u}`;
  return choice(R, {
    id: `bothNumbers-${n}`, family: 'bothNumbers', board: modelT(C),
    prompt: `${defined(C)}. Which sentence gives both numbers with the right units?`,
    picture: { g: planeFor(C, Math.min(10, C.m < 0 ? floorW(runsOut(C)) : 8), [], [pt('Y', 0, C.b, undefined, 'link')], ['L'], ['Y']) },
    solution: [`${nH(C.b)} stands alone: the output at input 0, in ${outU(C)}.`, `${nH(C.m)} multiplies ${vH(C.x)}: ${rateU(C)}.`],
  }, S(bText, mText(rateU(C))), 'Yes: the start has the output unit, the rate has output per input.', [
    { t: S(`${nH(C.m)} ${outU(C)} is the ${C.yw} at ${xv} = 0`, `the ${C.yw} changes by ${nH(C.b)} ${rateU(C)}`), mc: MC.swapMB, say: `The number on its own (${nH(C.b)}) is the start; the one with ${xv} (${nH(C.m)}) is the rate.` },
    { t: S(bText, mText(outU(C))), mc: MC.perUnit, say: `A rate needs "per ${C.one}": ${rateU(C)}.` },
    { t: S(`${nH(C.b)} ${C.many} is the ${C.yw} at ${xv} = 0`, mText(rateU(C))), mc: MC.unitsDeco, say: `The start is an output: it is in ${outU(C)}, not ${C.many}.` },
  ]);
};

// ===================== stage 2 =====================
// ---------- s2-define-variables ----------
const defineVars: Gen = (R, n) => {
  const C = R() < 0.4 ? incCtx(R, ['pool', 'arcade', 'kayak']) : decCtx(R, ['tank', 'battery', 'trip', 'candle']);
  // the output is mentioned first in some texts
  const outFirst = R() < 0.5;
  const text = outFirst ? `The ${C.yw} depends on the ${C.xw}: ${C.story[0]!.toLowerCase() + C.story.slice(1)}` : C.story;
  const askIn = R() < 0.6;
  const inDef = `${vH(C.x)} = the number of ${C.xw}, counted from when ${C.zero.replace(/^the /, 'the ')}`;
  const outDef = `${vH(C.y)} = the ${C.yw}, in ${outU(C)}`;
  const right = askIn ? inDef : outDef;
  return choice(R, {
    id: `defineVars-${n}`, family: 'defineVars', board: `${C.y} = m${C.x} + b`,
    prompt: `${text} In the model ${vH(C.y)} = m${vH(C.x)} + b, which is the right definition of ${vH(askIn ? C.x : C.y)}?`,
    solution: [`The input is what you choose or what passes (${C.xw}); the output is what you get (${C.yw}).`, `A definition names the quantity and its unit${askIn ? ', and what 0 means' : ''}.`],
  }, right, 'Yes: a quantity, its unit, and what 0 means.', [
    { t: askIn ? `${vH(C.x)} = the ${C.yw}, in ${outU(C)}` : `${vH(C.y)} = the number of ${C.xw}`, mc: MC.rolesCue, say: `The ${C.yw} depends on the ${C.xw}, whichever is mentioned first. The ${C.xw} are the input.` },
    { t: askIn ? `${vH(C.x)} = the ${C.one}` : `${vH(C.y)} = the ${({ tank: 'tank', battery: 'phone', candle: 'candle', trip: 'car', pool: 'pool', arcade: 'card', kayak: 'kayak' } as Record<string, string>)[C.key] ?? 'thing'}`, mc: MC.letterLabel, say: `A variable stands for a NUMBER (an amount with a unit), not for a thing.` },
    ...(askIn ? [{ t: `${vH(C.x)} = the time on the clock`, say: `The input counts ${C.many} from a stated moment (${C.zero}), not the clock time.` }] : []),
  ]);
};
const restartClock: Gen = (R, n) => {
  const C = R() < 0.65 ? decCtx(R, ['tank', 'battery', 'trip']) : incCtx(R, ['pool']);
  const s = pick(R, [1, 2, 3]), b2 = at(C, s), hr = pick(R, [1, 2, 3]);
  const clock = C.one === 'minute' ? [`${hr}:00 pm`, `${hr}:0${s} pm`] : [`${hr}:00 pm`, `${hr + s}:00 pm`];
  const xMax = C.m < 0 ? Math.min(s + 4, floorW(runsOut(C))) : s + 4;
  const e = (bb: number) => `${vH(C.y)} = ${startFirstH(C.m, bb, 'u')}`;
  return choice(R, {
    id: `restartClock-${n}`, family: 'restartClock', board: modelT(C),
    prompt: `${modelH(C)} gives the ${C.yw} (${outU(C)}), with ${vH(C.x)} = ${C.many} after ${clock[0]}. A new model counts <i>u</i> = ${C.many} after ${clock[1]} instead. Which is the new model?`,
    picture: { g: planeFor(C, xMax, [], [{ kind: 'vline', key: 'V', x: s }, pt('N', s, b2, undefined, 'link')], ['L', 'V'], ['N']) },
    solution: [`At ${clock[1]} (${vH(C.x)} = ${s}) the ${C.yw} is ${nH(C.b)} ${C.m < 0 ? '−' : '+'} ${nH(Math.abs(C.m))} × ${s} = ${nH(b2)}.`, `That is the new start; the rate stays ${nH(C.m)} per ${C.one}: ${e(b2)}.`],
  }, e(b2), 'Yes: new start, same rate.', [
    { t: e(C.b), mc: MC.reassign, say: `${nH(C.b)} was the ${C.yw} at ${clock[0]}. At ${clock[1]} it is ${nH(b2)}.` },
    { t: e(at(C, -s)), say: `Moving the clock later moves the start along the story: ${nH(C.b)} ${C.m < 0 ? '−' : '+'} ${nH(Math.abs(C.m) * s)}, not the other way.` },
    { t: `${vH(C.y)} = ${startFirstH(-C.m, b2, 'u')}`, mc: MC.dropsSign, say: `The rate keeps its sign: the ${C.yw} still ${C.m < 0 ? 'goes down' : 'goes up'}.` },
  ]);
};
// ---------- s2-equation-given-parameters / s2-negative-rate ----------
const buildModel: Gen = (R, n, sg) => {
  const C = sg === 's2-negative-rate' ? decCtx(R) : sg === 's2-equation-given-parameters' ? incCtx(R) : ctxOf(R);
  const startFirst = R() < 0.4;
  const right = startFirst ? `${vH(C.y)} = ${startFirstH(C.m, C.b, C.x)}` : `${vH(C.y)} = ${exprH(C.m, C.b, C.x)}`;
  const e = (m: number, b: number) => `${vH(C.y)} = ${exprH(m, b, C.x)}`;
  const feeFirst = /fee|already|starts|has|is \d|A \$|-gallon|-inch|miles from|phone loan/.test(C.story.split(/[,;]/)[0]!);
  const ws: Opt[] = [
    { t: e(C.b, C.m), mc: feeFirst ? MC.wordOrder : MC.swapMB, say: `The ${nH(Math.abs(C.m))} comes with every ${C.one}, so it multiplies ${vH(C.x)}. The start (${nH(C.b)}) is added once.` },
  ];
  if (C.m > 0) ws.push({ t: `${vH(C.y)} = ${nH(C.m + C.b)}${vH(C.x)}`, mc: MC.feeTimes, say: `The ${out(C, C.b)} is paid once, not with every ${C.one}.` }, { t: `${vH(C.y)} = ${nH(C.b)}(${vH(C.x)} + ${nH(C.m)})`, mc: MC.feeTimes, say: 'That multiplies the start by the input too. Only the rate multiplies the input.' });
  else ws.push({ t: e(-C.m, C.b), mc: MC.dropsSign, say: `The ${C.yw} goes down, so the rate is negative: −${nH(-C.m)}.` }, { t: e(C.m, -C.b), mc: MC.negStart, say: `It goes down, but it STARTS at +${nH(C.b)}. Only the rate is negative.` });
  return choice(R, {
    id: `buildModel-${n}`, family: 'buildModel', board: `${C.y} = m${C.x} + b`,
    prompt: `${C.story} Let ${vH(C.x)} be the number of ${C.xw} and ${vH(C.y)} the ${C.yw} (${outU(C)}). Which equation models it?`,
    picture: { g: planeFor(C, Math.min(8, C.m < 0 ? floorW(runsOut(C)) : 8), [], [pt('Y', 0, C.b, undefined, 'link')], [], ['L', 'Y']) },
    solution: [`Start (input 0): ${out(C, C.b)}. Rate: ${C.m < 0 ? '−' : ''}${rateAmt(C)}${C.m < 0 ? ' (it goes down)' : ''}.`, `${vH(C.y)} = rate · ${vH(C.x)} + start: ${right}.`],
  }, right, 'Yes: the rate times the input, plus the start.', ws);
};
const modelPair: Gen = (R, n) => {
  const C = incCtx(R);
  return pairItem({
    id: `modelPair-${n}`, family: 'modelPair', board: `${C.y} = \\square\\,${C.x} + \\square`,
    prompt: `${C.story} Write the model with ${vH(C.x)} = number of ${C.xw} and ${vH(C.y)} = ${C.yw} (${outU(C)}).`,
    picture: { g: planeFor(C, 8, [], [pt('Y', 0, C.b, undefined, 'link')], [], ['L', 'Y']) },
    solution: [`Rate: ${rateAmt(C)}, so m = ${nH(C.m)}. Start: ${out(C, C.b)}, so b = ${nH(C.b)}.`, `${vH(C.y)} = ${ans(nH(C.m))}${vH(C.x)} + ${ans(nH(C.b))}.`],
  }, C.m, C.b, `${vH(C.y)} =`, `${vH(C.x)} +`, 'Yes.', [
    { x: C.b, y: C.m, mc: MC.swapMB, say: `The one that comes with each ${C.one} (${nH(C.m)}) multiplies ${vH(C.x)}; the start (${nH(C.b)}) stands alone.` },
    { x: C.m + C.b, y: 0, mc: MC.feeTimes, say: 'The start is paid once, so it does not multiply the input.' },
  ], 'The rate goes in front of the input; the start stands alone.');
};
const drainModel: Gen = (R, n) => {
  const C = decCtx(R);
  return pairItem({
    id: `drainModel-${n}`, family: 'drainModel', board: `${C.y} = \\square\\,${C.x} + \\square`,
    prompt: `${C.story} Write the model with ${vH(C.x)} = number of ${C.xw} and ${vH(C.y)} = ${C.yw} (${outU(C)}).`,
    picture: { g: planeFor(C, floorW(runsOut(C)), [], [pt('Y', 0, C.b, undefined, 'link')], [], ['L', 'Y']) },
    solution: [`The ${C.yw} goes DOWN by ${rateAmt(C)}: m = ${nH(C.m)}.`, `It starts at ${out(C, C.b)}: b = ${nH(C.b)}. ${vH(C.y)} = ${ans(nH(C.m))}${vH(C.x)} + ${ans(nH(C.b))}.`],
  }, C.m, C.b, `${vH(C.y)} =`, `${vH(C.x)} +`, 'Yes: a negative rate, a positive start.', [
    { x: -C.m, y: C.b, mc: MC.dropsSign, say: `"${C.rateW}" is a decrease: the rate is −${nH(-C.m)}.` },
    { x: C.m, y: -C.b, mc: MC.negStart, say: `It decreases, but it starts at ${out(C, C.b)}: the start stays positive.` },
    { x: C.b, y: C.m, mc: MC.swapMB, say: 'The rate multiplies the input; the start stands alone.' },
  ], 'Decreasing: the rate is negative; the start is the amount at input 0.');
};
// ---------- s2-rate-from-two-points ----------
const rateTwoPoints: Gen = (R, n) => {
  const C = R() < 0.55 ? incCtx(R, ['plumber', 'savings', 'pool', 'gym', 'ride']) : decCtx(R, ['tank', 'trip', 'loan', 'battery']);
  const top = C.m < 0 ? floorW(runsOut(C)) : 10;
  const x1 = int(R, 1, Math.max(1, Math.min(4, top - 3))), x2 = x1 + int(R, 2, Math.max(2, Math.min(6, top - x1)));
  const y1 = at(C, x1), y2 = at(C, x2), dy = y2 - y1, dx = x2 - x1;
  const later = R() < 0.4;
  const say1 = `after ${cnt(C, x1)} the ${C.yw} is ${out(C, y1)}`, say2 = `after ${cnt(C, x2)} it is ${out(C, y2)}`;
  return numItem({
    id: `rateTwoPoints-${n}`, family: 'rateTwoPoints', board: 'm = \\frac{\\Delta y}{\\Delta x} = \\,?', unit: rateU(C),
    prompt: `${C.yw[0]!.toUpperCase() + C.yw.slice(1)} over time: ${later ? `${say2.replace('it is', `the ${C.yw} is`)}, and ${say1.replace(`the ${C.yw} is`, 'it is')}` : `${say1}, and ${say2}`}. The change is steady. What is the rate?`,
    picture: { g: planeFor(C, Math.max(x2 + 1, 6), [], [pt('A', x1, y1, undefined, 'first'), pt('Q', x2, y2, undefined, 'first'), { kind: 'seg', key: 'run', a: [x1, y1], b: [x2, y1], col: 'first', arrow: true }, { kind: 'seg', key: 'rise', a: [x2, y1], b: [x2, y2], col: 'second', arrow: true }], ['A', 'Q'], ['run', 'rise', 'L']) },
    solution: [`Input change: ${x2} − ${x1} = ${dx} ${C.many}. Output change: ${nH(y2)} − ${nH(y1)} = ${nH(dy)} ${outU(C)}.`, `Rate: ${nH(dy)} ÷ ${dx} = ${ans(nH(C.m))} ${rateU(C)}.`],
  }, C.m, `Yes: ${nH(C.m)} ${rateU(C)}.`, [
    { v: dy, mc: MC.ignoresStep, say: `${nH(dy)} is the change over ${dx} ${C.many}. Per ${C.one}: divide by ${dx}.` },
    { v: r2(y2 / x2), tol: 0.02, mc: MC.yOverX, say: `${nH(y2)} ÷ ${x2} uses one point only (the start is not 0). Divide the CHANGES.` },
    { v: -C.m, mc: MC.dropsSign, say: `The ${C.yw} goes ${C.m > 0 ? 'up' : 'down'}, so the rate is ${C.m > 0 ? 'positive' : 'negative'}.` },
  ], 'Change in output divided by change in input.');
};
const rateTable: Gen = (R, n) => {
  const C = R() < 0.55 ? incCtx(R, ['savings', 'pool', 'gym', 'plumber']) : decCtx(R, ['tank', 'trip', 'loan']);
  const top = C.m < 0 ? floorW(runsOut(C)) : 12;
  const st = pick(R, [2, 3, 4, 5]), x0 = int(R, 1, 3);
  const xs = [x0, x0 + st, x0 + 2 * st, x0 + 3 * st].filter(x => x <= top);
  if (xs.length < 3) return rateTable(R, n);
  const ys = xs.map(x => at(C, x)), dy = ys[1]! - ys[0]!;
  return numItem({
    id: `rateTable-${n}`, family: 'rateTable', board: `\\text{rate} = \\,?\\ \\text{${rateU(C)}}`, unit: rateU(C),
    prompt: `A log of the ${C.yw}: ${xs.map((x, i) => `${cnt(C, x)} → ${out(C, ys[i]!)}`).join(', ')}. What is the rate per ${C.one}?`,
    picture: { t: { xName: tabX(C), yName: tabY(C), xs, ys: ys.map(v => nH(v)), diffs: true } },
    solution: [`Each row: ${st} more ${C.many}, ${nH(dy)} ${outU(C)}.`, `Per ${C.one}: ${nH(dy)} ÷ ${st} = ${ans(nH(C.m))} ${rateU(C)}.`],
  }, C.m, 'Yes: the change per one unit.', [
    { v: dy, mc: MC.ignoresStep, say: `The rows are ${st} ${C.many} apart: divide the change by ${st}.` },
    { v: r2(ys[0]! / xs[0]!), tol: 0.02, mc: MC.yOverX, say: 'One row divided by itself is not a rate here: the start is not 0. Use the changes.' },
    { v: -C.m, mc: MC.dropsSign, say: `The ${C.yw} goes ${C.m > 0 ? 'up' : 'down'}: the sign of the rate shows that.` },
  ], 'Change in output divided by change in input (the rows are several units apart).');
};
// ---------- s2-back-solve-start ----------
const backStart: Gen = (R, n) => {
  const C = R() < 0.6 ? incCtx(R, ['plumber', 'savings', 'gym', 'pool', 'ride', 'tickets']) : decCtx(R, ['tank', 'trip', 'loan', 'card']);
  const top = C.m < 0 ? floorW(runsOut(C)) - 1 : 8;
  const x1 = int(R, 2, Math.max(2, Math.min(6, top))), y1 = at(C, x1);
  return numItem({
    id: `backStart-${n}`, family: 'backStart', board: `b = ${C.y} - m${C.x}`, unit: outU(C),
    prompt: `The ${C.yw} changes by ${C.m < 0 ? '−' : ''}${rateAmt(C)}. After ${cnt(C, x1)} it is ${out(C, y1)}. What was it at the start (${vH(C.x)} = 0)?`,
    picture: { g: planeFor(C, Math.max(x1 + 2, 6), [], [pt('P', x1, y1, undefined, 'first'), { kind: 'seg', key: 'back', a: [x1, y1], b: [0, C.b], dash: true, col: 'pick' }, pt('Y', 0, C.b, undefined, 'link')], ['P'], ['back', 'Y']) },
    solution: [`Undo ${x1} ${C.many} of change: ${nH(y1)} − (${nH(C.m)})(${x1}).`, `= ${nH(y1)} ${C.m > 0 ? '−' : '+'} ${nH(Math.abs(C.m * x1))} = ${ans(nH(C.b))} ${outU(C)}.`],
  }, C.b, 'Yes: the change undone, back to 0.', [
    { v: y1, mc: MC.firstOut, say: `${out(C, y1)} is after ${cnt(C, x1)}, not at the start.` },
    { v: y1 + C.m * x1, say: `Going back undoes the change: ${C.m > 0 ? 'take it away' : 'add it back'}.` },
    { v: y1 - C.m, mc: MC.ignoresStep, say: `That goes back only one ${C.one}. Go back all ${x1}.` },
  ], 'b = y − m·x: undo the change from 0 to the known point.');
};
const twoPointModel: Gen = (R, n) => {
  const C = R() < 0.6 ? incCtx(R, ['plumber', 'savings', 'gym', 'pool', 'ride']) : decCtx(R, ['tank', 'trip', 'loan']);
  const top = C.m < 0 ? floorW(runsOut(C)) : 10;
  const x1 = int(R, 2, Math.max(2, Math.min(4, top - 3))), x2 = x1 + int(R, 2, Math.max(2, Math.min(5, top - x1)));
  const y1 = at(C, x1), y2 = at(C, x2);
  return pairItem({
    id: `twoPointModel-${n}`, family: 'twoPointModel', board: `${C.y} = \\square\\,${C.x} + \\square`,
    prompt: `After ${cnt(C, x1)} the ${C.yw} is ${out(C, y1)}; after ${cnt(C, x2)} it is ${out(C, y2)}. The change is steady. Write the model (${vH(C.x)} = ${C.xw}, ${vH(C.y)} = ${C.yw} in ${outU(C)}).`,
    picture: { g: planeFor(C, Math.max(x2 + 1, 6), [], [pt('A', x1, y1, undefined, 'first'), pt('Q', x2, y2, undefined, 'first'), pt('Y', 0, C.b, undefined, 'link')], ['A', 'Q'], ['L', 'Y']) },
    solution: [`Rate: (${nH(y2)} − ${nH(y1)}) ÷ (${x2} − ${x1}) = ${nH(C.m)}.`, `Start: ${nH(y1)} − (${nH(C.m)})(${x1}) = ${nH(C.b)}. So ${vH(C.y)} = ${ans(nH(C.m))}${vH(C.x)} + ${ans(nH(C.b))}.`],
  }, C.m, C.b, `${vH(C.y)} =`, `${vH(C.x)} +`, 'Yes: rate from the two points, start by walking back.', [
    { x: C.m, y: y1, mc: MC.firstOut, say: `${out(C, y1)} is at ${vH(C.x)} = ${x1}, not at 0. Walk back ${x1} ${C.many}.` },
    { x: y2 - y1, y: y1 - (y2 - y1) * x1, mc: MC.ignoresStep, say: `${nH(y2 - y1)} is the change over ${x2 - x1} ${C.many}: divide by ${x2 - x1}.` },
    { x: r2(y1 / x1), y: 0, mc: MC.yOverX, say: `${nH(y1)} ÷ ${x1} assumes the line starts at 0. Divide the changes, then find b.` },
  ], 'Rate = change ÷ change; then b = y − m·x with one of the points.');
};
// ---------- s2-unit-check ----------
const unitCheck: Gen = (R, n) => {
  const C = R() < 0.6 ? incCtx(R, ['ride', 'plumber', 'gym', 'posters', 'tickets', 'pool']) : decCtx(R, ['tank', 'trip', 'candle', 'loan']);
  const bad = `${vH(C.y)} = ${C.m > 0 ? exprH(C.b, C.m, C.x) : startFirstH(-C.b, -C.m, C.x)}`;
  return choice(R, {
    id: `unitCheck-${n}`, family: 'unitCheck', board: `\\tfrac{\\text{${outU(C)}}}{\\text{${C.one}}} \\cdot \\text{${C.many}} = \\text{${outU(C)}}`,
    prompt: `${C.story} Sam writes ${bad} (${vH(C.x)} = ${C.xw}, ${vH(C.y)} = ${C.yw} in ${outU(C)}). What does a unit check say?`,
    solution: [`In ${bad}, ${nH(C.b)} is in ${outU(C)}, so ${nH(C.b)}${vH(C.x)} would be ${outU(C)} × ${C.many}: not ${outU(C)}.`, `Only a rate (${rateU(C)}) times ${C.many} gives ${outU(C)}. The right model is ${modelH(C)}.`],
  }, `It fails: ${nH(C.b)} is in ${outU(C)}, so ${nH(C.b)}${vH(C.x)} is not in ${outU(C)}; the rate in ${rateU(C)} must multiply ${vH(C.x)}`, 'Yes: the units catch the swap.', [
    { t: `It passes: both numbers are in ${outU(C)}, so either can go with ${vH(C.x)}`, mc: MC.unitsDeco, say: `They are not both plain ${outU(C)}: one is ${rateU(C)}. Units decide where each number goes.` },
    { t: 'It passes: the units only matter in the final answer', mc: MC.unitsDeco, say: 'Units are a check on the whole equation: every term must be in the output unit.' },
    { t: `It fails: ${vH(C.x)} should be in ${outU(C)} too`, say: `${vH(C.x)} counts ${C.many}; the rate turns ${C.many} into ${outU(C)}.` },
  ]);
};
const pointCheck: Gen = (R, n) => {
  const C = R() < 0.6 ? incCtx(R, ['arcade', 'ride', 'plumber', 'gym', 'posters', 'tickets']) : decCtx(R, ['tank', 'trip', 'card', 'loan']);
  const top = C.m < 0 ? floorW(runsOut(C)) - 1 : 9;
  const x = int(R, 2, Math.max(2, Math.min(9, top))), yTrue = at(C, x), fits = R() < 0.45;
  const y = fits ? yTrue : r2(yTrue + pick(R, [1, 2, -1, -2]) * (Math.abs(C.m) >= 20 ? 5 : 1));
  const yes = `Yes: ${nH(C.b)} ${C.m < 0 ? '−' : '+'} ${nH(Math.abs(C.m))} · ${x} = ${nH(yTrue)}, the data point`;
  const no = `No: ${nH(C.b)} ${C.m < 0 ? '−' : '+'} ${nH(Math.abs(C.m))} · ${x} = ${nH(yTrue)}, not ${nH(y)}`;
  return choice(R, {
    id: `pointCheck-${n}`, family: 'pointCheck', board: modelT(C),
    prompt: `${defined(C)}. A record says: ${cnt(C, x)} → ${out(C, y)}. Does the model fit this data point?`,
    picture: { g: planeFor(C, Math.max(x + 2, 6), [y], [pt('P', x, y, undefined, 'first'), pt('M', x, yTrue, undefined, 'link')], ['P'], ['L', 'M']) },
    solution: [`Put ${vH(C.x)} = ${x} into the model: ${nH(C.b)} ${C.m < 0 ? '−' : '+'} ${nH(Math.abs(C.m))} · ${x} = ${nH(yTrue)}.`, fits ? `It matches ${out(C, y)}: the model fits.` : `The record says ${out(C, y)}: the model does not fit this point.`],
  }, fits ? yes : no, 'Yes: substitute and compare.', fits ? [
    { t: `No: ${nH(Math.abs(C.m))} · ${x} = ${nH(Math.abs(C.m) * x)}, not ${nH(y)}`, say: `The start ${nH(C.b)} belongs in the check too: ${nH(C.b)} ${C.m < 0 ? '−' : '+'} ${nH(Math.abs(C.m * x))} = ${nH(yTrue)}.` },
    { t: `No: ${nH(C.b)} ${C.m < 0 ? '+' : '−'} ${nH(Math.abs(C.m))} · ${x} = ${nH(C.b - C.m * x)}, not ${nH(y)}`, say: 'Keep the sign of the rate when you substitute.' },
  ] : [
    { t: `Yes: both sides are in ${outU(C)}, so the units check`, mc: MC.unitsDeco, say: 'Matching units is necessary, not enough. The numbers must match too.' },
    { t: `Yes: ${nH(y)} is close to ${nH(yTrue)}`, say: 'A model through real data has to hit it. A record that misses means the model or the record is wrong.' },
  ]);
};
// ---------- s2-target-equation ----------
const targetEq: Gen = (R, n) => {
  const C = R() < 0.5 ? incCtx(R, ['arcade', 'gym', 'posters', 'tickets', 'savings', 'plumber']) : decCtx(R, ['tank', 'card', 'loan', 'trip', 'battery']);
  const k = C.m < 0 ? int(R, 2, floorW(runsOut(C)) - 1) : int(R, 3, 9), T = at(C, k);
  const lhs = C.m < 0 ? startFirstH(C.m, C.b, C.x) : exprH(C.m, C.b, C.x);
  const goal = C.m < 0 ? `exactly ${out(C, T)} is left` : `the ${C.yw} is exactly ${out(C, T)}`;
  return choice(R, {
    id: `targetEq-${n}`, family: 'targetEq', board: modelT(C),
    prompt: `${defined(C)}. Which equation finds the number of ${C.many} when ${goal}?`,
    picture: { g: planeFor(C, Math.max(k + 2, 6), [T], [{ kind: 'hline', key: 'T', y: T }], ['L', 'T'], []) },
    solution: [`The target is an OUTPUT: set ${vH(C.y)} = ${nH(T)}.`, `${lhs} = ${nH(T)}, one equation in ${vH(C.x)} alone.`],
  }, `${lhs} = ${nH(T)}`, 'Yes: the model with the target as its output.', [
    { t: `${vH(C.y)} = ${lhs}`, mc: MC.formulaAns, say: `That is the general model. Put the target ${nH(T)} in for ${vH(C.y)} to get an equation for ${vH(C.x)}.` },
    { t: `${vH(C.y)} = ${C.m < 0 ? `${nH(C.b)} − ${nH(-C.m)} · ${nH(T)}` : `${nH(C.m)} · ${nH(T)} + ${nH(C.b)}`}`, say: `${nH(T)} is the ${C.yw}, an output. It goes where ${vH(C.y)} is, not into ${vH(C.x)}.` },
    { t: `${lhs} ${C.m < 0 ? '≥' : '≤'} ${nH(T)}`, say: '"Exactly" asks for an equation, not an inequality.' },
  ]);
};
const targetValue: Gen = (R, n) => {
  const C = R() < 0.5 ? incCtx(R, ['arcade', 'gym', 'posters', 'tickets', 'savings', 'plumber', 'pool']) : decCtx(R, ['tank', 'card', 'loan', 'trip', 'battery']);
  const k = C.m < 0 ? int(R, 2, floorW(runsOut(C)) - 1) : int(R, 3, 12), T = at(C, k);
  const lhs = C.m < 0 ? startFirstH(C.m, C.b, C.x) : exprH(C.m, C.b, C.x);
  return numItem({
    id: `targetValue-${n}`, family: 'targetValue', board: `${C.m < 0 ? startFirstT(C.m, C.b, C.x) : exprT(C.m, C.b, C.x)} = ${T}`, unit: C.many,
    prompt: `${defined(C)}. After how many ${C.many} is the ${C.yw} exactly ${out(C, T)}? Solve ${lhs} = ${nH(T)}.`,
    picture: { g: planeFor(C, Math.max(k + 2, 6), [T], [{ kind: 'hline', key: 'T', y: T }, pt('K', k, T, undefined, 'link')], ['L'], ['T', 'K']) },
    solution: [`${C.m < 0 ? `${nH(C.b)} − ${nH(T)} = ${nH(C.b - T)}` : `${nH(T)} − ${nH(C.b)} = ${nH(T - C.b)}`}: the change from the start.`, `${nH(Math.abs(T - C.b))} ÷ ${nH(Math.abs(C.m))} = ${ans(String(k))} ${C.many}.`],
  }, k, `Yes: ${cnt(C, k)}.`, [
    { v: r2(T / Math.abs(C.m)), tol: 0.02, say: `Take the start away first: the rate only explains the change from ${nH(C.b)} to ${nH(T)}.` },
    { v: at(C, T), mc: MC.formulaAns, say: `That puts ${nH(T)} in as the input. ${nH(T)} is the output: solve for ${vH(C.x)}.` },
  ], 'Undo the start, then divide by the rate.');
};
// ---------- s2-threshold-inequality ----------
type Sym = '≥' | '>' | '≤' | '<';
const PHRASES: readonly { p: string; s: Sym; key?: Sym }[] = [
  { p: 'at least', s: '≥' }, { p: 'at most', s: '≤' }, { p: 'no more than', s: '≤', key: '>' }, { p: 'more than', s: '>' },
  { p: 'more than', s: '>' }, { p: 'fewer than', s: '<' }, { p: 'does not exceed', s: '≤', key: '>' }, { p: 'less than', s: '<' }, { p: 'no less than', s: '≥', key: '<' },
];
const flipStrict = (s: Sym): Sym => ({ '≥': '>', '>': '≥', '≤': '<', '<': '≤' } as const)[s];
const flipDir = (s: Sym): Sym => ({ '≥': '≤', '>': '<', '≤': '≥', '<': '>' } as const)[s];
function symOpts(right: Sym, key: Sym | undefined, lhs: string, T: string): Opt[] {
  const w: Opt[] = [{ t: `${lhs} ${flipStrict(right)} ${T}`, mc: MC.strict, say: `Check the end: ${right === '≥' || right === '≤' ? 'the target itself is allowed here' : 'the target itself is not allowed here'}.` }];
  if (key && key !== flipStrict(right)) w.push({ t: `${lhs} ${key} ${T}`, mc: MC.keyword, say: 'Read the whole phrase, not just one word: a "no" or a "not" turns it around.' });
  w.push({ t: `${lhs} ${flipDir(right)} ${T}`, mc: MC.reversed, say: `The phrase points the other way: think about which side of ${T} is allowed.` });
  w.push({ t: `${lhs} = ${T}`, mc: MC.eqBound, say: 'A limit allows a whole range of values, not one: use an inequality.' });
  return w;
}
const phraseIneq: Gen = (R, n) => {
  const C = R() < 0.5 ? incCtx(R, ['arcade', 'gym', 'posters', 'tickets', 'savings', 'plumber', 'pool']) : decCtx(R, ['tank', 'card', 'trip', 'battery']);
  const P = pick(R, PHRASES);
  if (P.p === 'fewer than') {
    // "fewer than" is about a count: a limit on the input
    const D = incCtx(R, ['arcade', 'posters', 'tickets']), K = int(R, 5, 12), xv = vH(D.x);
    return choice(R, {
      id: `phraseIneq-${n}`, family: 'phraseIneq', board: `${D.x}\\ \\square\\ ${K}`,
      prompt: `${defined(D)}. Write the condition "there must be fewer than ${K} ${D.many}" with a symbol.`,
      picture: { g: planeFor(D, K + 3, [], [{ kind: 'vline', key: 'K', x: K, col: 'first', dash: false }, { kind: 'dots', key: 'W', m: D.m, b: D.b, xs: Array.from({ length: K }, (_, i) => i) }], ['L', 'K'], ['W']) },
      solution: [`"fewer than ${K}" allows only counts below ${K}, not ${K} itself.`, `So ${xv} < ${K}.`],
    }, `${xv} < ${K}`, 'Yes: below the limit, the limit itself excluded.', symOpts('<', undefined, xv, String(K)));
  }
  const k = C.m < 0 ? int(R, 2, floorW(runsOut(C)) - 1) : int(R, 3, 9);
  const T = C.unit === 'money' ? Math.round(at(C, k) + pick(R, [0, 1, 2])) : at(C, k);
  const sentence = /^does /.test(P.p) ? `the ${C.yw} ${P.p} ${out(C, T)}` : `the ${C.yw} must be ${P.p} ${out(C, T)}`;
  const yv = vH(C.y);
  return choice(R, {
    id: `phraseIneq-${n}`, family: 'phraseIneq', board: `${C.y}\\ \\square\\ ${T}`,
    prompt: `${defined(C)}. Write the condition "${sentence}" with a symbol.`,
    picture: { g: planeFor(C, Math.max(k + 3, 6), [T], [{ kind: 'hline', key: 'T', y: T }, { kind: 'band', key: 'S', y: T, side: P.s === '≤' || P.s === '<' ? 'below' : 'above', lo: 0, hi: Math.max(k + 3, 6) }], ['L', 'T'], ['S']) },
    solution: [`"${P.p}" ${P.s === '≥' ? `allows ${nH(T)} and everything above it` : P.s === '>' ? `allows only values above ${nH(T)}, not ${nH(T)} itself` : P.s === '≤' ? `allows ${nH(T)} and everything below it` : `allows only values below ${nH(T)}, not ${nH(T)} itself`}.`, `So ${yv} ${P.s} ${nH(T)}.`],
  }, `${yv} ${P.s} ${nH(T)}`, 'Yes: the right side, the right end.', symOpts(P.s, P.key, yv, nH(T)));
};
const budgetIneq: Gen = (R, n) => {
  const C = R() < 0.55 ? incCtx(R, ['arcade', 'gym', 'posters', 'tickets', 'plumber', 'ride', 'kayak']) : decCtx(R, ['tank', 'card', 'battery']);
  const k = C.m < 0 ? int(R, 2, floorW(runsOut(C)) - 1) : int(R, 4, 10);
  const T = C.unit === 'money' ? Math.round(at(C, k) + pick(R, [0, 1, 3])) : at(C, k);
  const lhs = C.m < 0 ? startFirstH(C.m, C.b, C.x) : exprH(C.m, C.b, C.x);
  const ph = C.m > 0 ? pick(R, [{ w: `can spend at most ${out(C, T)}`, s: '≤' as Sym, key: undefined }, { w: `has a budget: the ${C.yw} must not exceed ${out(C, T)}`, s: '≤' as Sym, key: '>' as Sym }, { w: `gets a discount only if the ${C.yw} is more than ${out(C, T)}, and wants the discount`, s: '>' as Sym, key: undefined }])
    : pick(R, [{ w: `needs at least ${out(C, T)} left`, s: '≥' as Sym, key: undefined }, { w: `needs more than ${out(C, T)} left`, s: '>' as Sym, key: undefined }, { w: `wants no less than ${out(C, T)} left`, s: '≥' as Sym, key: '<' as Sym }]);
  return choice(R, {
    id: `budgetIneq-${n}`, family: 'budgetIneq', board: `${C.m < 0 ? startFirstT(C.m, C.b, C.x) : exprT(C.m, C.b, C.x)}\\ \\square\\ ${T}`,
    prompt: `${defined(C)}. Someone ${ph.w}. Which inequality in ${vH(C.x)} says that?`,
    picture: { g: planeFor(C, Math.max(k + 3, 6), [T], [{ kind: 'hline', key: 'T', y: T }, { kind: 'band', key: 'S', y: T, side: ph.s === '≤' || ph.s === '<' ? 'below' : 'above', lo: 0, hi: Math.max(k + 3, 6) }], ['L', 'T'], ['S']) },
    solution: [`The limit is on the output, the ${C.yw}: replace ${vH(C.y)} by the model.`, `${lhs} ${ph.s} ${nH(T)}.`],
  }, `${lhs} ${ph.s} ${nH(T)}`, 'Yes: the model, the symbol, the limit.', symOpts(ph.s, ph.key, lhs, nH(T)));
};

// ===================== stage 3 =====================
// ---------- s3-discrete-continuous ----------
const DISC = [
  { t: (R: () => number) => `A print shop charges ${money(pick(R, [0.5, 0.75, 1.25]))} per poster plus a setup fee. The input is the number of posters.`, whole: true },
  { t: (R: () => number) => `Concert tickets cost ${money(pick(R, [28, 32, 45]))} each plus a fee per order. The input is the number of tickets.`, whole: true },
  { t: (R: () => number) => `A gift card pays for coffees at ${money(pick(R, [3.5, 4.25, 5]))} each. The input is the number of coffees bought.`, whole: true },
  { t: (R: () => number) => `A moving company charges ${money(pick(R, [12, 15, 18]))} per box packed. The input is the number of boxes.`, whole: true },
  { t: (R: () => number) => `A plumber bills ${money(pick(R, [55, 65, 85]))} per hour, and every started hour is billed as a whole hour. The input is the number of hours billed.`, whole: true },
  { t: (R: () => number) => `A tank drains ${pick(R, [2, 3, 4])} gallons per minute. The input is the time since the drain was opened, in minutes.`, whole: false },
  { t: (R: () => number) => `Gas costs ${money(pick(R, [3.25, 3.5, 3.75]))} per gallon. The input is the number of gallons pumped.`, whole: false },
  { t: (R: () => number) => `A rideshare charges ${money(pick(R, [1.5, 1.75, 2]))} per mile plus a pickup fee. The input is the distance driven, in miles.`, whole: false },
  { t: (R: () => number) => `A candle burns down ${pick(R, ['0.5', '0.75', '1.25'])} inches per hour. The input is the time since it was lit, in hours.`, whole: false },
  { t: (R: () => number) => `Cherries cost ${money(pick(R, [4.5, 5, 6.5]))} per pound at a market. The input is the weight bought, in pounds.`, whole: false },
] as const;
const discreteOrNot: Gen = (R, n) => {
  const D = pick(R, DISC), t = D.t(R);
  const W = 'Whole numbers only: 0, 1, 2, 3, …', A = 'Any number from 0 up, decimals too', ALL = 'Any real number, negatives included';
  return choice(R, {
    id: `discreteOrNot-${n}`, family: 'discreteOrNot', board: 'x \\in \\{0, 1, 2, \\dots\\}\\ \\ \\text{or}\\ \\ x \\ge 0',
    prompt: `${t} Which input values make sense?`,
    solution: [D.whole ? 'You count it: there is no half of one (or the billing rule only uses whole ones).' : 'You measure it: it can stop at any moment or amount, like 2.4.', 'Money in the story does not decide it: the input quantity does.'],
  }, D.whole ? W : A, D.whole ? 'Yes: a count.' : 'Yes: a measurement.', [
    D.whole ? { t: A, mc: MC.fractions, say: 'Could the input be 2.5? Not for something you count (or bill in whole units).' } : { t: W, mc: MC.wholeOnly, say: 'Time, distance, weight and volume can be any amount: 2.4 makes sense here.' },
    { t: ALL, mc: MC.allReals, say: 'The formula takes any number, but the situation does not: the input cannot be negative here.' },
  ], 3);
};
const graphForm: Gen = (R, n) => {
  const C = R() < 0.5 ? incCtx(R) : decCtx(R);
  const xMax = C.m < 0 ? Math.min(10, floorW(runsOut(C))) : 8;
  const xs = Array.from({ length: xMax + 1 }, (_, i) => i);
  const D = 'Only separate dots, at 0, 1, 2, …', RAY = 'A solid line from x = 0 on', LINE = 'A solid line through every x, to the left of 0 too';
  const right = C.discrete ? D : RAY;
  const g = planeFor(C, xMax, [], [{ kind: 'dots', key: 'W', m: C.m, b: C.b, xs }], ['L'], C.discrete ? ['W'] : []);
  return choice(R, {
    id: `graphForm-${n}`, family: 'graphForm', board: modelT(C),
    prompt: `${C.story} The graph draws the model ${modelH(C)} as a solid line. How should it look, given what ${vH(C.x)} (the ${C.xw}) means?`,
    picture: { g },
    solution: [C.discrete ? `${vH(C.x)} counts ${C.many}: only whole numbers.` : `${vH(C.x)} measures ${C.xw}: any amount from 0 up.`, C.discrete ? 'So the graph is separate dots, one per whole number.' : 'So the graph is a solid line (a ray) starting at x = 0.'],
  }, right, 'Yes: the meaning of the input decides it.', [
    C.discrete ? { t: RAY, mc: MC.fractions, say: `Between the dots would be 2.5 ${C.many}: not possible.` } : { t: D, mc: MC.wholeOnly, say: `${C.xw} can be 2.5: every point between the dots is real.` },
    { t: LINE, mc: MC.allReals, say: `Negative ${C.many} make no sense: the model starts at 0.` },
  ], 3);
};
// ---------- s3-context-bounds ----------
const boundIneq: Gen = (R, n) => {
  const kind = pick(R, ['empty', 'empty', 'seats', 'temp'] as const);
  if (kind === 'temp') {
    const r = pick(R, [1.5, 2]), b = pick(R, [4, 6, 8]), H = pick(R, [8, 10]), lo = b - r * H;
    const g: MPic = { x: axis([H + 1], { name: 'hours after 8 pm (t)', pad: 0 }), y: axis([b, lo], { name: 'temperature (T, °F)' }), items: [{ kind: 'line', key: 'L', m: -r, b, lo: 0, hi: H, ends: ['closed', 'closed'] }, { kind: 'hline', key: 'Z', y: 0, col: 'dim', dash: true }], show: ['axes', 'L'], solve: [] };
    return choice(R, {
      id: `boundIneq-${n}`, family: 'boundIneq', board: `T = ${b} - ${r}t,\\ 0 \\le t \\le ${H}`,
      prompt: `On a winter night in Minnesota, T = ${b} − ${r}t gives the temperature in °F, t hours after 8 pm, for 0 ≤ t ≤ ${H}. Which temperatures does the model give?`,
      picture: { g },
      solution: [`At t = 0, T = ${b}; at t = ${H}, T = ${b} − ${r * H} = ${lo}.`, `Temperatures below 0 °F are real, so all of ${lo} ≤ T ≤ ${b} make sense.`],
    }, `${nH(lo)} ≤ T ≤ ${b}`, 'Yes: below zero is a real temperature.', [
      { t: `0 ≤ T ≤ ${b}`, mc: MC.rejects, say: `Negative temperatures happen: ${nH(lo)} °F is a cold night, not an error.` },
      { t: `${nH(lo)} < T < ${b}`, mc: MC.strict, say: `t = 0 and t = ${H} are in the model, so both end temperatures are reached.` },
      { t: 'Every number T', mc: MC.allReals, say: `The model only runs for 0 ≤ t ≤ ${H}, so T stays between its two end values.` },
    ]);
  }
  if (kind === 'seats') {
    const S = pick(R, [250, 300, 400, 450]), p = pick(R, [12, 15, 18, 20]);
    return choice(R, {
      id: `boundIneq-${n}`, family: 'boundIneq', board: `R = ${p}n`,
      prompt: `A school theater has ${S} seats. Ticket revenue is R = ${p}n dollars for n tickets sold. Which values of n make sense?`,
      picture: { r: { min: 0, max: S + S / 5, step: S / 5, name: 'tickets sold (n)', rows: [{ label: 'a count from 0', lo: { v: 0, open: false } }, { label: `at most ${S} seats`, hi: { v: S, open: false } }], result: { lo: { v: 0, open: false }, hi: { v: S, open: false } }, resLabel: 'Makes sense (whole numbers)' } },
      solution: ['n counts tickets: whole numbers from 0.', `There are ${S} seats, so n can reach ${S} but not more: 0 ≤ n ≤ ${S}, whole numbers.`],
    }, `Whole numbers with 0 ≤ n ≤ ${S}`, 'Yes: the seats cap it, the count starts at 0.', [
      { t: 'Whole numbers with n ≥ 0', mc: MC.allReals, say: `The formula keeps going, but the theater stops at ${S} seats.` },
      { t: `Whole numbers with 0 < n < ${S}`, mc: MC.strict, say: `Selling out (${S}) is possible, and so is selling none.` },
      { t: `Any number with 0 ≤ n ≤ ${S}`, mc: MC.fractions, say: 'Half a ticket is not sold: n is a count.' },
    ]);
  }
  const C = decCtx(R, ['tank', 'battery', 'trip', 'candle']), E = runsOut(C);
  const tv = vH(C.x);
  return choice(R, {
    id: `boundIneq-${n}`, family: 'boundIneq', board: modelT(C),
    prompt: `${defined(C)}. Which inputs ${tv} does the model make sense for?`,
    picture: { g: { ...planeFor(C, ceilW(E) + 1, [], [{ kind: 'line', key: 'V', m: C.m, b: C.b, lo: 0, hi: E, ends: ['closed', 'closed'], col: 'link' }], ['L'], ['V'], { lineKey: 'L' }), items: [{ kind: 'line', key: 'L', m: C.m, b: C.b, lo: 0, hi: E + 0.5, dash: true, col: 'dim' }, { kind: 'line', key: 'V', m: C.m, b: C.b, lo: 0, hi: E, ends: ['closed', 'closed'], col: 'link' }] } },
    solution: [`It starts at ${tv} = 0 and stops when ${C.stop}: ${nH(C.b)} ÷ ${nH(-C.m)} = ${d2(E)} ${C.many}.`, `Both ends happen, so 0 ≤ ${tv} ≤ ${d2(E)}.`],
  }, `0 ≤ ${tv} ≤ ${d2(E)}`, 'Yes: from the start until it runs out, ends included.', [
    { t: `${tv} ≥ 0`, mc: MC.allReals, say: `After ${d2(E)} ${C.many} the model goes negative: ${C.stop} by then.` },
    { t: `0 < ${C.x} < ${d2(E)}`, mc: MC.strict, say: 'The start and the moment it runs out are both real moments: include the ends.' },
    { t: `0 ≤ ${tv} ≤ ${nH(C.b)}`, say: `${nH(C.b)} is the starting ${C.yw}, an output. The input bound is when it reaches 0.` },
  ]);
};
const emptyTime: Gen = (R, n) => {
  const C = decCtx(R, ['tank', 'battery', 'trip', 'candle']), E = runsOut(C);
  return numItem({
    id: `emptyTime-${n}`, family: 'emptyTime', board: `0 \\le ${C.x} \\le \\,?`, unit: C.many,
    prompt: `${defined(C)}. The model holds from ${vH(C.x)} = 0 until ${C.stop}. What is the upper bound on ${vH(C.x)}?`,
    picture: { g: planeFor(C, ceilW(E) + 1, [], [pt('Y', 0, C.b, undefined, 'first'), pt('E', E, 0, undefined, 'link')], ['Y'], ['L', 'E']) },
    solution: [`It stops when ${vH(C.y)} = 0: ${startFirstH(C.m, C.b, C.x)} = 0.`, `${nH(C.b)} ÷ ${nH(-C.m)} = ${ans(d2(E))} ${C.many}.`],
  }, r2(E), `Yes: 0 ≤ ${vH(C.x)} ≤ ${d2(E)}.`, [
    { v: C.b, say: `${nH(C.b)} is the ${C.yw} at the start (an output). The bound on ${vH(C.x)} is when it reaches 0.` },
  ], 'Set the output to 0 and solve for the input.');
};
// ---------- s3-feasible-set ----------
const feasible: Gen = (R, n) => {
  const C = incCtx(R, ['plumber', 'kayak']);
  // a budget gives x ≤ a; a second restriction: a time cap x ≤ c, a minimum x ≥ d (overlapping, disjoint or one value)
  const a = pick(R, [4, 5, 6, 8]), budget = at(C, a);
  const kind = pick(R, ['cap', 'cap', 'min', 'min', 'empty', 'single'] as const);
  const xv = vH(C.x), pl = C.key === 'plumber';
  let row2: { label: string; lo?: { v: number; open: boolean }; hi?: { v: number; open: boolean } }, right: string, res: RPic['result'], text2: string;
  if (kind === 'cap') { const c = pick(R, [2, 3]); row2 = { label: `${C.x} ≤ ${c}`, hi: { v: c, open: false } }; text2 = pl ? `the plumber has only ${c} hours free that day` : `the shop closes in ${c} hours`; right = `0 ≤ ${xv} ≤ ${c}`; res = { lo: { v: 0, open: false }, hi: { v: c, open: false } }; }
  else if (kind === 'min') { const d = pick(R, [1, 2, 3]); row2 = { label: `${C.x} ≥ ${d}`, lo: { v: d, open: false } }; text2 = pl ? `the job needs at least ${cnt(C, d)} of work` : `you want to paddle at least ${cnt(C, d)}`; right = `${d} ≤ ${xv} ≤ ${a}`; res = { lo: { v: d, open: false }, hi: { v: a, open: false } }; }
  else if (kind === 'empty') { const d = a + pick(R, [1, 2]); row2 = { label: `${C.x} ≥ ${d}`, lo: { v: d, open: false } }; text2 = pl ? `the job needs at least ${cnt(C, d)} of work` : `you want to paddle at least ${cnt(C, d)}`; right = 'No value works: the restrictions do not overlap'; res = { empty: true }; }
  else { row2 = { label: `${C.x} ≥ ${a}`, lo: { v: a, open: false } }; text2 = pl ? `the job needs at least ${a} hours of work` : `you want to paddle at least ${a} hours`; right = `Only ${xv} = ${a}`; res = { lo: { v: a, open: false }, hi: { v: a, open: false } }; }
  const opts: Opt[] = [
    { t: `0 ≤ ${xv} ≤ ${a}`, mc: MC.allReals, say: `That is the budget alone. The other restriction (${text2}) has to hold too.` },
    { t: `${xv} ≤ ${a}`, mc: MC.allReals, say: `The hours cannot be negative, and ${text2}.` },
    { t: 'No value works: the restrictions do not overlap', say: 'Look again: some values pass every restriction.' },
    { t: `${xv} ≥ 0`, mc: MC.allReals, say: 'Every restriction counts, the budget included.' },
  ];
  return choice(R, {
    id: `feasible-${n}`, family: 'feasible', board: `${exprT(C.m, C.b, C.x)} \\le ${budget}`,
    prompt: `${defined(C)}. You can pay at most ${money(budget)}, so ${exprH(C.m, C.b, C.x)} ≤ ${nH(budget)}, which gives ${xv} ≤ ${a}. Also, ${text2}, and ${xv} ≥ 0. Which values of ${xv} are feasible?`,
    picture: { r: { min: 0, max: 12, step: 1, name: `${C.xw} (${C.x})`, rows: [{ label: `${C.x} ≥ 0`, lo: { v: 0, open: false } }, { label: `budget: ${C.x} ≤ ${a}`, hi: { v: a, open: false } }, row2], result: res } },
    solution: [`A value is feasible only if it passes EVERY restriction: ${xv} ≥ 0, ${xv} ≤ ${a}, and ${row2.label.replace(C.x, xv)}.`, kind === 'empty' ? `${row2.label.replace(C.x, xv)} and ${xv} ≤ ${a} never hold together: no feasible value.` : `Where all of them overlap: ${right}.`],
  }, right, 'Yes: the overlap of every restriction.', opts.filter(o => o.t !== right));
};
const feasibleMax: Gen = (R, n) => {
  const C = incCtx(R, ['arcade', 'tickets', 'posters', 'gym']);
  const k = int(R, 6, 14), B = Math.round(at(C, k) + C.m * pick(R, [0.3, 0.5, 0.7]));
  const raw = (B - C.b) / C.m, afford = floorW(raw);
  const capped = R() < 0.6, cap = capped ? afford - int(R, 1, 3) : afford + int(R, 1, 4);
  const best = Math.min(afford, cap);
  const capText = C.key === 'tickets' ? `only ${cap} tickets are left` : C.key === 'posters' ? `the shop has paper for only ${cap} posters today` : C.key === 'gym' ? `the membership offer runs for at most ${cap} months` : `the card holds at most ${cap} games`;
  return numItem({
    id: `feasibleMax-${n}`, family: 'feasibleMax', board: `${exprT(C.m, C.b, C.x)} \\le ${B},\\ ${C.x} \\le ${cap}`, unit: C.many,
    prompt: `${defined(C)}. The budget is ${money(B)}, and ${capText}. What is the greatest number of ${C.many} that fits every restriction?`,
    picture: { r: { min: 0, max: Math.max(cap, ceilW(raw)) + 2 + ((Math.max(cap, ceilW(raw)) + 2) % 2), step: 2, name: `${C.xw} (${C.x})`, rows: [{ label: `budget: ${C.x} ≤ ${d2(raw)}`, lo: { v: 0, open: false }, hi: { v: r2(raw), open: false } }, { label: `${C.x} ≤ ${cap}`, lo: { v: 0, open: false }, hi: { v: cap, open: false } }], result: { lo: { v: 0, open: false }, hi: { v: best, open: false }, whole: true }, resLabel: 'All at once, whole numbers' } },
    solution: [`Budget: ${exprH(C.m, C.b, C.x)} ≤ ${nH(B)} gives ${vH(C.x)} ≤ ${d2(raw)}, so at most ${afford} whole ${C.many}.`, `The other limit: at most ${cap}. Both at once: ${ans(String(best))} ${C.many}.`],
  }, best, `Yes: ${cnt(C, best)}.`, [
    { v: afford, mc: MC.allReals, say: `The budget allows ${afford}, but ${capText}.` },
    { v: r2(raw), tol: 0.02, mc: MC.fractions, say: `${C.many} come whole: ${d2(raw)} is not a number you can buy.` },
    { v: Math.round(raw), mc: MC.nearest, say: `Rounding ${d2(raw)} to the nearest whole number can break the budget. Take the greatest that fits.` },
  ], 'Find the limit from each restriction; the smallest upper limit wins.');
};
// ---------- s3-boundary-direction ----------
interface Bd { story: string; ineq: string; raw: number; ans: number; up: boolean; strictInt?: boolean; unit: string; check: string }
function boundary(R: () => number): Bd {
  const kind = pick(R, ['afford', 'afford', 'enough', 'enough', 'strict'] as const);
  if (kind === 'afford') {
    for (;;) {
      const p = pick(R, [3.5, 4.25, 4.5, 5.75, 6.5]), F = pick(R, [0, 2, 5]), B = pick(R, [40, 45, 50, 60]);
      const raw = (B - F) / p;
      if (isWhole(raw)) continue;
      const a = floorW(raw);
      return { story: `Coffees cost ${money(p)} each${F ? `, after a ${money(F)} one-time card fee` : ''}. You can spend at most ${money(B)}. How many coffees can you buy?`, ineq: `${F ? `${p}c + ${F}` : `${p}c`} \\le ${B}`, raw, ans: a, up: false, unit: 'coffees', check: `${a + 1} coffees would cost ${money(F + p * (a + 1))}, over ${money(B)}; ${a} cost ${money(F + p * a)}.` };
    }
  }
  if (kind === 'enough') {
    for (;;) {
      const p = pick(R, [6, 8, 12, 15]), c = pick(R, [40, 60, 90, 120]), G = pick(R, [250, 300, 400, 500]);
      const raw = (G + c) / p;
      if (isWhole(raw)) continue;
      const a = ceilW(raw);
      return { story: `A club sells candles at ${money(p)} profit each and already spent ${money(c)} on supplies. Profit is P = ${p}s − ${c}. They need a profit of at least ${money(G)}. How many candles must they sell?`, ineq: `${p}s - ${c} \\ge ${G}`, raw, ans: a, up: true, unit: 'candles', check: `${a - 1} candles give ${money(p * (a - 1) - c)}, short of ${money(G)}; ${a} give ${money(p * a - c)}.` };
    }
  }
  const p = pick(R, [3, 4, 5, 6]), k = int(R, 9, 18), T = p * k;
  return { story: `Each raffle ticket sold raises ${money(p)}. The team must raise MORE than ${money(T)}. How many tickets must they sell?`, ineq: `${p}t > ${T}`, raw: k, ans: k + 1, up: true, strictInt: true, unit: 'tickets', check: `${k} tickets raise exactly ${money(T)}, not more; ${k + 1} raise ${money(p * (k + 1))}.` };
}
const wholeBoundary: Gen = (R, n) => {
  const B = boundary(R);
  const slips: NumSlip[] = [{ v: r2(B.raw), tol: 0.02, mc: MC.fractions, say: `You cannot have ${d2(B.raw)} ${B.unit}: pick a whole number.` }];
  if (B.strictInt) slips.push({ v: B.raw, mc: MC.strict, say: `${B.raw} ${B.unit} raise exactly the target, and the story needs MORE than it.` });
  else {
    const nr = Math.round(B.raw);
    if (nr !== B.ans) slips.push({ v: nr, mc: MC.nearest, say: `${d2(B.raw)} rounds to ${nr}, but the story decides the direction: ${B.up ? 'enough means round UP' : 'afford means round DOWN'}.` });
    if (B.up) slips.push({ v: floorW(B.raw), mc: MC.remainder, say: 'Dropping the decimal leaves you short of the target: go up to the next whole number.' });
    else slips.push({ v: ceilW(B.raw), say: 'That is over the budget: go down to the whole number below.' });
  }
  return numItem({
    id: `wholeBoundary-${n}`, family: 'wholeBoundary', board: B.ineq, unit: B.unit,
    prompt: `${B.story} (Solving gives ${B.strictInt ? `t > ${B.raw}` : `the boundary ${d2(B.raw)}`}; a calculator is fine.)`,
    picture: boundPic(B),
    solution: [`The boundary is ${d2(B.raw)}. ${B.up ? 'The story needs at least the target, so go UP to the next whole number' : 'The story caps the spending, so go DOWN to the whole number below'}${B.strictInt ? ' (the boundary itself is not enough: the inequality is strict)' : ''}.`, `${B.check} So ${ans(String(B.ans))} ${B.unit}.`],
  }, B.ans, `Yes: ${B.ans} ${B.unit}.`, slips, 'The inequality decides the direction: check the whole numbers on both sides of the boundary.');
};
/** a zoomed plane around the boundary: the target line and the whole-number dots on both sides of it */
function boundPic(B: Bd): Pic {
  const lo = Math.max(0, floorW(B.raw) - 3), hi = lo + 7;
  // the model as a line through (raw, target); slope and target from the inequality text
  const m = Number(B.ineq.match(/^([\d.]+)/)![1]), rest = B.ineq.match(/([+-]) (\d+) \\/), c = rest ? (rest[1] === '+' ? 1 : -1) * Number(rest[2]) : 0;
  const T = Number(B.ineq.match(/(\d+)$/)![1]);
  const f = (x: number) => m * x + c;
  const xs = Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
  const y = axis([f(lo), f(hi), T], { name: B.unit === 'coffees' ? 'cost ($)' : 'money ($)', money: true, max: 10, zero: false });
  return { g: { x: { min: lo, max: hi, step: 1, name: B.unit }, y, items: [{ kind: 'line', key: 'L', m, b: c, dash: true, col: 'dim' }, { kind: 'hline', key: 'T', y: T }, { kind: 'dots', key: 'W', m, b: c, xs }, pt('A', B.ans, f(B.ans), undefined, 'link')], show: ['axes', 'L', 'T'], solve: ['W', 'A'] } };
}
const boundaryWhy: Gen = (R, n) => {
  const B = boundary(R);
  const right = `${B.ans}, because ${B.check.split(';')[0]}`;
  const ws: Opt[] = [];
  const nr = Math.round(B.raw), fl = floorW(B.raw), ce = ceilW(B.raw);
  if (B.strictInt) ws.push({ t: `${B.raw}, because that raises the target`, mc: MC.strict, say: `${B.raw} raises exactly the target. The story says MORE than.` });
  else if (nr !== B.ans) ws.push({ t: `${nr}, the nearest whole number to ${d2(B.raw)}`, mc: MC.nearest, say: `Nearest is not the rule: ${B.up ? 'the target must be reached' : 'the budget must not be broken'}.` });
  if (B.up && fl !== B.ans && fl !== nr) ws.push({ t: `${fl}, because you always drop the decimal part`, mc: MC.remainder, say: 'Dropping the decimal leaves you short of the target.' });
  if (!B.up && ce !== nr) ws.push({ t: `${ce}, because you should always round up to be safe`, say: `${ce} breaks the budget: ${B.check.split(';')[0]}.` });
  ws.push({ t: `${d2(B.raw)} ${B.unit}, the exact solution`, mc: MC.fractions, say: `${B.unit} are counted: ${d2(B.raw)} is not possible.` });
  return choice(R, {
    id: `boundaryWhy-${n}`, family: 'boundaryWhy', board: B.ineq,
    prompt: `${B.story.replace(/ [^.]*\?$/, '')} Solving gives the boundary ${d2(B.raw)}. How many ${B.unit}, and why?`,
    picture: boundPic(B),
    solution: [`${B.up ? 'Enough means reaching the target: the least whole number past the boundary' : 'Afford means staying in budget: the greatest whole number under the boundary'}${B.strictInt ? ' (not the boundary itself: the inequality is strict)' : ''}.`, `Check the neighbour: ${B.check}`],
  }, right, 'Yes: and the check on the excluded neighbour proves it.', ws);
};
// ---------- s3-exact-no-solution ----------
const exactOrNot: Gen = (R, n) => {
  const kind = pick(R, ['frac', 'frac', 'whole', 'neg', 'inv'] as const);
  let C = incCtx(R, kind === 'inv' ? ['arcade', 'posters', 'tickets'] : ['arcade', 'posters', 'tickets', 'gym']);
  // a negative solution: a whole number of items BELOW zero (a total less than the start), never a fraction of an item
  while (kind === 'neg' && C.b - C.m <= 0) C = incCtx(R, ['arcade', 'posters', 'gym']);
  let T = 0, x = 0, inv = 0;
  if (kind === 'whole') { x = int(R, 3, 14); T = at(C, x); }
  else if (kind === 'neg') { const k = C.b - 2 * C.m > 0 && R() < 0.5 ? 2 : 1; T = C.b - k * C.m; x = -k; }
  else if (kind === 'inv') { x = int(R, 8, 16); T = at(C, x); inv = x - int(R, 2, 4); }
  else for (let tries = 0; ; tries++) {
    // a whole-dollar target when one misses every whole count; else (a 50¢ rate hits every whole dollar) a cents target
    const k = int(R, 3, 14);
    T = tries < 12 ? Math.round(at(C, k) + C.m * pick(R, [0.2, 0.4, 0.6, 0.8])) : r2(at(C, k) + 0.25);
    x = (T - C.b) / C.m;
    if (!isWhole(x) && x > 1) break;
  }
  const xv = vH(C.x), lhs = exprH(C.m, C.b, C.x);
  const invText = inv ? (C.key === 'tickets' ? ` Only ${inv} tickets are left.` : C.key === 'posters' ? ` The shop has paper for only ${inv} posters.` : ` The card holds at most ${inv} games.`) : '';
  const yes = (k: number) => `Yes: ${cnt(C, k)} ${k === 1 ? 'costs' : 'cost'} exactly ${money(T)}`;
  let right: string; const ws: Opt[] = [];
  if (kind === 'whole') { right = yes(x); ws.push({ t: `No: ${money(T)} cannot be reached exactly`, say: `Check: ${nH(C.b)} + ${nH(C.m)} · ${x} = ${nH(T)}. A whole number works.` }, { t: yes(x + 1), say: `Check: ${cnt(C, x + 1)} cost ${money(at(C, x + 1))}.` }); }
  else if (kind === 'inv') { right = `No: it takes ${cnt(C, x)}, and only ${inv} are available`; ws.push({ t: yes(x), mc: MC.allReals, say: `The equation works, but only ${inv} ${C.many} are available: ${x} is not possible.` }, { t: yes(inv), say: `${cnt(C, inv)} cost ${money(at(C, inv))}.` }); }
  else if (kind === 'neg') { right = `No: it would take ${cnt(C, x)}, a negative count`; ws.push({ t: yes(0), say: `${cnt(C, 0)} still cost ${money(C.b)}: the start alone is more than ${money(T)}.` }, { t: yes(Math.max(1, Math.round(-x))), say: 'Check the sign: the solution is negative, so no count works.' }); }
  else { right = `No: it would take ${d2(x)} ${C.many}, not a whole number`; ws.push({ t: yes(Math.round(x)), mc: MC.roundsExact, say: `${cnt(C, Math.round(x))} cost ${money(at(C, Math.round(x)))}, not ${money(T)}. Rounding does not make it exact.` }, { t: `Yes: ${d2(x)} ${C.many} cost exactly ${money(T)}`, mc: MC.fractions, say: `You cannot buy ${d2(x)} ${C.many}.` }); }
  const lo = Math.max(0, floorW(Math.max(0, x)) - 2), hi = lo + 6;
  const xs = Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
  return choice(R, {
    id: `exactOrNot-${n}`, family: 'exactOrNot', board: `${exprT(C.m, C.b, C.x)} = ${T}`,
    prompt: `${defined(C)}. Can the total be exactly ${money(T)}?${invText} (Solve ${lhs} = ${nH(T)}.)`,
    picture: { g: { x: { min: lo, max: hi, step: 1, name: C.many }, y: axis([at(C, lo), at(C, hi), T], { money: true, name: 'cost ($)', max: 10, zero: false }), items: [{ kind: 'line', key: 'L', m: C.m, b: C.b, dash: true, col: 'dim' }, { kind: 'hline', key: 'T', y: T }, { kind: 'dots', key: 'W', m: C.m, b: C.b, xs }], show: ['axes', 'L', 'T'], solve: ['W'] } },
    solution: [`${lhs} = ${nH(T)} gives ${xv} = (${nH(T)} − ${nH(C.b)}) ÷ ${nH(C.m)} = ${d2(x)}.`, kind === 'whole' ? `${x} is a whole number: ${cnt(C, x)} cost exactly ${money(T)}.` : kind === 'inv' ? `${x} is more than the ${inv} available: not possible.` : kind === 'neg' ? 'A negative count is impossible: no.' : `${C.many[0]!.toUpperCase() + C.many.slice(1)} are counted, and ${d2(x)} is not whole: no whole number hits ${money(T)} exactly.`],
  }, right, kind === 'whole' ? 'Yes: a whole-number solution.' : 'Yes: no allowed input hits it exactly.', ws, 3);
};
const reachable: Gen = (R, n) => {
  const C = incCtx(R, ['arcade', 'posters', 'tickets']);
  const k = int(R, 4, 12), good = at(C, k);
  const ds: number[] = [];
  for (let d = -3; d <= 3; d += 0.25) if (d !== 0) ds.push(d);
  // totals near the right one that no whole count reaches; whole and half dollars first, quarters when the rate needs them
  const bads = shuffle(R, ds.map(d => r2(good + d)).filter(v => v > C.b && !isWhole((v - C.b) / C.m))).sort((p, q) => Number(!isWhole(p * 2)) - Number(!isWhole(q * 2))).slice(0, 3);
  return choice(R, {
    id: `reachable-${n}`, family: 'reachable', board: `${exprT(C.m, C.b, C.x)} = \\,?`,
    prompt: `${defined(C)}. Which of these could be the exact total of an order?`,
    solution: [`A total works only if (total − ${nH(C.b)}) ÷ ${nH(C.m)} is a whole number.`, `(${nH(good)} − ${nH(C.b)}) ÷ ${nH(C.m)} = ${k}: ${cnt(C, k)} cost ${money(good)}. The others give decimals.`],
  }, money(good), 'Yes: a whole number of them.', bads.map(v => ({ t: money(v), mc: MC.roundsExact, say: `(${nH(v)} − ${nH(C.b)}) ÷ ${nH(C.m)} = ${d2((v - C.b) / C.m)}: not a whole number, so no order totals ${money(v)}.` })));
};
// ---------- s3-validity-justify ----------
const validInterval: Gen = (R, n) => {
  const kind = pick(R, ['empty', 'empty', 'price', 'stock'] as const);
  if (kind === 'price') {
    const p = pick(R, [1.25, 1.5, 2]), F = pick(R, [3, 3.5, 4]), L = pick(R, [20, 25, 30]);
    const g: MPic = { x: axis([L + 10], { name: 'miles (d)', pad: 0 }), y: axis([F, F + p * (L + 10)], { name: 'fare (C, $)', money: true }), items: [{ kind: 'line', key: 'L', m: p, b: F, dash: true, col: 'dim' }, { kind: 'line', key: 'V', m: p, b: F, lo: 0, hi: L, ends: ['closed', 'closed'], col: 'link' }, { kind: 'vline', key: 'S', x: L }], show: ['axes', 'L', 'S'], solve: ['V'] };
    return choice(R, {
      id: `validInterval-${n}`, family: 'validInterval', board: `C = ${p}d + ${F}`,
      prompt: `A shuttle charges ${money(F)} plus ${money(p)} per mile for the first ${L} miles; after ${L} miles the rate per mile changes. The model is C = ${nH(p)}d + ${nH(F)}. Which statement justifies where the model is valid?`,
      picture: { g },
      solution: [`The constant rate ${money(p)} per mile is promised only up to ${L} miles.`, `So the model holds for 0 ≤ d ≤ ${L} miles; past ${L} the rate changes and the line no longer describes the fare.`],
    }, `0 ≤ d ≤ ${L} miles: the ${money(p)} rate holds only for the first ${L} miles, and d cannot be negative`, 'Yes: an interval, units, and the reason.', [
      { t: 'd ≥ 0 miles: distance cannot be negative', mc: MC.extrap, say: `The rate changes after ${L} miles: past that, the line is the wrong model.` },
      { t: 'Every d: a linear equation works for any input', mc: MC.allReals, say: 'The equation takes any number; the situation does not.' },
      { t: `0 ≤ d ≤ ${nH(F + p * L)} miles: that is the fare at the change`, say: `${money(F + p * L)} is a fare (an output). The bound is on the miles.` },
    ]);
  }
  if (kind === 'stock') {
    const per = pick(R, [20, 25]), S = pick(R, [500, 600, 750]), b = 0, E = S / per;
    const g: MPic = { x: axis([E + 5], { name: 'minutes (t)', pad: 0 }), y: axis([0, S + per * 5], { name: 'sheets used (N)' }), items: [{ kind: 'line', key: 'L', m: per, b, dash: true, col: 'dim' }, { kind: 'line', key: 'V', m: per, b, lo: 0, hi: E, ends: ['closed', 'closed'], col: 'link' }, { kind: 'hline', key: 'S', y: S }], show: ['axes', 'L', 'S'], solve: ['V'] };
    return choice(R, {
      id: `validInterval-${n}`, family: 'validInterval', board: `N = ${per}t`,
      prompt: `A printer uses ${per} sheets per minute from a tray of ${S} sheets; nobody refills it. N = ${per}t models the sheets used after t minutes. Which statement justifies where the model is valid?`,
      picture: { g },
      solution: [`The tray runs out when ${per}t = ${S}: t = ${nH(E)} minutes.`, `After that no sheets are used, so N = ${per}t holds for 0 ≤ t ≤ ${nH(E)} minutes.`],
    }, `0 ≤ t ≤ ${nH(E)} minutes: at t = ${nH(E)} the ${S} sheets are used up and printing stops`, 'Yes: the resource sets the end.', [
      { t: 't ≥ 0 minutes: time only goes forward', mc: MC.extrap, say: `After ${nH(E)} minutes the tray is empty: the model would count sheets that do not exist.` },
      { t: 'Every t: the equation has no restriction', mc: MC.allReals, say: 'The situation restricts it: no negative time, no sheets past the tray.' },
      { t: `0 ≤ t ≤ ${S} minutes: the tray holds ${S}`, say: `${S} is a number of sheets. Divide by the rate to get the minutes.` },
    ]);
  }
  const C = decCtx(R, ['tank', 'battery', 'trip', 'candle']), E = runsOut(C), xv = vH(C.x);
  return choice(R, {
    id: `validInterval-${n}`, family: 'validInterval', board: modelT(C),
    prompt: `${defined(C)}. Which statement justifies where the model is valid?`,
    picture: { g: { ...planeFor(C, ceilW(E) + 2, [C.m * (ceilW(E) + 2) + C.b], [], [], []), items: [{ kind: 'line', key: 'L', m: C.m, b: C.b, dash: true, col: 'dim' }, { kind: 'line', key: 'V', m: C.m, b: C.b, lo: 0, hi: E, ends: ['closed', 'closed'], col: 'link' }], show: ['axes', 'L'], solve: ['V'] } },
    solution: [`The ${C.yw} reaches 0 at ${xv} = ${nH(C.b)} ÷ ${nH(-C.m)} = ${d2(E)} ${C.many}: ${C.stop}.`, `After that it cannot keep dropping, so the model holds for 0 ≤ ${xv} ≤ ${d2(E)} ${C.many}.`],
  }, `0 ≤ ${xv} ≤ ${d2(E)} ${C.many}: at ${d2(E)} ${C.stop}, and the ${C.yw} cannot go below 0`, 'Yes: an interval, with units and the reason it ends.', [
    { t: `${xv} ≥ 0 ${C.many}: time cannot be negative`, mc: MC.extrap, say: `Past ${d2(E)} ${C.many} the model gives a negative ${C.yw}: ${C.stop} by then.` },
    { t: `Every ${xv}: a line goes on forever`, mc: MC.allReals, say: 'The line does; the situation does not.' },
    { t: `0 ≤ ${xv} ≤ ${nH(C.b)} ${C.many}: it starts at ${nH(C.b)}`, say: `${nH(C.b)} is the starting ${C.yw}, not a number of ${C.many}.` },
  ]);
};
const extrapolate: Gen = (R, n) => {
  const kind = pick(R, ['pop', 'neg'] as const);
  const y0 = pick(R, [2016, 2017, 2018]), span = pick(R, [6, 7, 8]), far = pick(R, [30, 35, 40]);
  if (kind === 'pop') {
    const b = pick(R, [1200, 1500, 2400]), m = pick(R, [35, 40, 60]);
    const g: MPic = { x: { min: 0, max: 40, step: 5, name: `years since ${y0} (t)` }, y: axis([b, b + m * 40], { name: 'students (N)', max: 10 }), items: [{ kind: 'line', key: 'L', m, b, dash: true, col: 'dim', lo: 0 }, { kind: 'dots', key: 'D', m, b, xs: Array.from({ length: span + 1 }, (_, i) => i) }, { kind: 'vline', key: 'F', x: far }], show: ['axes', 'D', 'L', 'F'], solve: [] };
    return choice(R, {
      id: `extrapolate-${n}`, family: 'extrapolate', board: `N = ${m}t + ${b}`,
      prompt: `A school's enrollment from ${y0} to ${y0 + span} fits N = ${m}t + ${b} (t = years since ${y0}). Someone uses it to predict ${y0 + far} (t = ${far}). What is the best judgment?`,
      picture: { g },
      solution: [`The data only cover 0 ≤ t ≤ ${span}.`, `t = ${far} is ${far - span} years past the data: a steady +${m} per year is an assumption there, not something the data show.`],
    }, `Not reliable: the data cover only t = 0 to ${span}, and nothing shows the rate stays ${m} per year for ${far - span} more years`, 'Yes: the model is checked only where the data are.', [
      { t: 'Reliable: the model fits the data, so it works for any year', mc: MC.extrap, say: `It fits ${y0}–${y0 + span}. Rates change: new housing, a new school nearby, a smaller generation.` },
      { t: 'Reliable: t = ' + far + ' is a positive number of years', mc: MC.allReals, say: 'Positive is not enough: the model is only tested on the years of data.' },
      { t: 'Impossible: the model cannot be used for any year after ' + (y0 + span), say: `A year or two past the data is a reasonable estimate. ${far - span} years is the problem.` },
    ]);
  }
  const b = pick(R, [120, 150, 180]), m = -pick(R, [2, 3, 4]), z = b / -m;
  return choice(R, {
    id: `extrapolate-${n}`, family: 'extrapolate', board: `F = ${b} - ${-m}t`,
    prompt: `A lake's fish count (in hundreds) from ${y0} to ${y0 + span} fits F = ${b} − ${-m}t (t = years since ${y0}). At t = ${Math.ceil(z) + 10} the model gives ${nH(b + m * (Math.ceil(z) + 10))}. What does that tell you?`,
    picture: { g: { x: axis([Math.ceil(z) + 10], { name: `years since ${y0} (t)`, pad: 0 }), y: axis([b, b + m * (Math.ceil(z) + 10)], { name: 'fish (F, hundreds)', max: 10 }), items: [{ kind: 'line', key: 'L', m, b, dash: true, col: 'dim', lo: 0 }, { kind: 'dots', key: 'D', m, b, xs: Array.from({ length: span + 1 }, (_, i) => i) }], show: ['axes', 'D', 'L'], solve: [] } },
    solution: ['A negative fish count is impossible.', `The steady drop is only checked for 0 ≤ t ≤ ${span}; far past the data the model does not describe the lake.`],
  }, `The model has been used far outside its data (0 ≤ t ≤ ${span}); a negative count shows it no longer applies`, 'Yes: the impossible value is the warning.', [
    { t: `The lake will owe fish: the count really goes negative`, mc: MC.extrap, say: 'A count cannot be negative: the model has left the range where it works.' },
    { t: 'The model is fine; just round the answer up to 0', mc: MC.extrap, say: `Patching the number hides the real issue: the steady drop is not known past t = ${span}.` },
    { t: 'Nothing: any t ≥ 0 is a valid input', mc: MC.allReals, say: 'Time is not the only restriction: the output has to make sense too.' },
  ]);
};

export const GENERATORS: Record<FamilyId, Gen> = {
  isLinearStory, unevenTable, startValue, startGraph, propOrNot, doubleTest, rateWords, bothNumbers, defineVars, restartClock,
  buildModel, modelPair, drainModel, rateTwoPoints, rateTable, backStart, twoPointModel, unitCheck, pointCheck, targetEq, targetValue,
  phraseIneq, budgetIneq, discreteOrNot, graphForm, boundIneq, emptyTime, feasible, feasibleMax, wholeBoundary, boundaryWhy,
  exactOrNot, reachable, validInterval, extrapolate,
};
export { at, INC, DEC };
