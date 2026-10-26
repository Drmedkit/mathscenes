// items.ts: exercise families for "Linear functions and slope" (secondary-t6-09, Algebra 1), generated from templates,
// checked exactly, and every wrong answer that a typical slip produces classified against the misconception catalogue
// (math-curriculum-essentials ids). A generator gets the SUB-GOAL it practises (plan.ts) and uses that sub-goal's
// cases from the topic JSON. Pictures are data (graphPic.ts): a plane, a table or a number line, with the parts that
// would give the answer away held back for the worked solution. Pure: no DOM, no canvas; a seeded rng.
import { type Item, type Response, type Verdict, int, pick, shuffle } from '../../runtime/item';
import { ans, endOnChoice } from '../../runtime/explain';
import {
  type Lin, type Pt2, type Q, at, exprH, exprT, nH, nT, onLin, psH, psT, pt, q, qAdd, qDec, qDiv, qEq, qH, qMul, qNeg, qNum, qP, qSub, qT,
  sameLin, siDecH, siDecT, siH, siT, slope, stdH, stdNorm, stdOf, stdT, through, toQ, zeroOf,
} from './lineMaths';
import { type GAxis, type GItem, type GPic, type Pic, fitAxis, riseRun, squareWin } from './graphPic';

export type FamilyId =
  | 'tableLinear' | 'changeTable' | 'graphSlope' | 'twoPointSlope' | 'scaledSlope' | 'steeperScaled' | 'flatOrSteep' | 'hvLine'
  | 'evalF' | 'readNotation' | 'yIntercept' | 'readMB' | 'matchGraph' | 'zeroGraph' | 'zeroCount' | 'solveZero' | 'phraseToIneq'
  | 'domainGraph' | 'contextDomain' | 'rangeInterval' | 'mixedFeature' | 'buildMB' | 'bFromPoint' | 'writePS' | 'eqTwoPoints'
  | 'twoPointsStory' | 'tableRule' | 'tableCheck' | 'graphRule' | 'exactPoints' | 'storyEq' | 'storyValue' | 'readPS' | 'stdSlope'
  | 'stdIntercepts' | 'toSlopeInt' | 'siToStd' | 'stepFrom' | 'transformPoint' | 'transformWords' | 'enoughInfo' | 'sameLineForms'
  | 'slopeSentence' | 'bMeaning' | 'zeroWhen' | 'isZero' | 'firstWhole';
export const FAMILIES: readonly { id: FamilyId; name: string }[] = [
  { id: 'tableLinear', name: 'Linear or not?' },
  { id: 'changeTable', name: 'Change over change' },
  { id: 'graphSlope', name: 'Slope from the graph' },
  { id: 'twoPointSlope', name: 'Slope from two points' },
  { id: 'scaledSlope', name: 'Mind the scale' },
  { id: 'steeperScaled', name: 'Which is steeper?' },
  { id: 'flatOrSteep', name: 'Zero or undefined' },
  { id: 'hvLine', name: 'Flat and upright lines' },
  { id: 'evalF', name: 'Evaluate f' },
  { id: 'readNotation', name: 'Read f(x) on a graph' },
  { id: 'yIntercept', name: 'Find the y-intercept' },
  { id: 'readMB', name: 'Spot m and b' },
  { id: 'matchGraph', name: 'Equation for the graph' },
  { id: 'zeroGraph', name: 'Find the zero' },
  { id: 'zeroCount', name: 'How many zeros?' },
  { id: 'solveZero', name: 'Solve for the zero' },
  { id: 'phraseToIneq', name: 'Bounds in symbols' },
  { id: 'domainGraph', name: 'Name the domain' },
  { id: 'contextDomain', name: 'Domain in context' },
  { id: 'rangeInterval', name: 'Name the range' },
  { id: 'mixedFeature', name: 'Which feature?' },
  { id: 'buildMB', name: 'Build from m and b' },
  { id: 'bFromPoint', name: 'Slope and a point' },
  { id: 'writePS', name: 'Write point-slope form' },
  { id: 'eqTwoPoints', name: 'Line through two points' },
  { id: 'twoPointsStory', name: 'Two data points' },
  { id: 'tableRule', name: 'Rule from a table' },
  { id: 'tableCheck', name: 'Check every row' },
  { id: 'graphRule', name: 'Equation from a scaled graph' },
  { id: 'exactPoints', name: 'Exact points only' },
  { id: 'storyEq', name: 'Story to equation' },
  { id: 'storyValue', name: 'The starting amount' },
  { id: 'readPS', name: 'Read point-slope form' },
  { id: 'stdSlope', name: 'Slope from standard form' },
  { id: 'stdIntercepts', name: 'Intercepts from standard form' },
  { id: 'toSlopeInt', name: 'To slope-intercept form' },
  { id: 'siToStd', name: 'To standard form' },
  { id: 'stepFrom', name: 'Graph it: start and step' },
  { id: 'transformPoint', name: 'Where does the point go?' },
  { id: 'transformWords', name: 'Describe the move' },
  { id: 'enoughInfo', name: 'Enough to pin a line?' },
  { id: 'sameLineForms', name: 'Same line?' },
  { id: 'slopeSentence', name: 'What the slope says' },
  { id: 'bMeaning', name: 'What b says' },
  { id: 'zeroWhen', name: 'When it reaches zero' },
  { id: 'isZero', name: 'Real feature or not?' },
  { id: 'firstWhole', name: 'Whole-number break-even' },
];
export const FAMILY_NAMES: Record<string, string> = Object.fromEntries(FAMILIES.map(f => [f.id, f.name]));

export interface LItem extends Item { family: FamilyId; picture?: Pic; /** the typical wrong responses the check classifies (tests) */ slips?: Response[] }
type Gen = (R: () => number, n: number, sg?: string) => LItem;

// ---------- misconception ids ----------
export const MC = {
  illusion: 'mc.linear-functions.illusion-of-linearity',
  scalesNonProp: 'mc.ratio-rate.scales-non-proportional',
  ignoresStep: 'mc.linear-functions.ignores-input-step',
  yOverX: 'mc.linear-functions.slope-as-y-over-x',
  asHeight: 'mc.linear-functions.slope-as-height',
  inverted: 'mc.linear-functions.rise-run-inverted',
  order: 'mc.linear-functions.inconsistent-subtraction-order',
  interval: 'mc.measurement-units.misjudges-interval-value',
  steepLook: 'mc.linear-functions.steepness-ignores-scale',
  constNotFn: 'mc.functions-concept.constant-rule-not-function',
  kOverZero: 'mc.calculus.zero-over-k-vs-k-over-zero',
  noSlope: 'mc.linear-functions.no-slope-conflates-zero-and-undefined',
  coordOrder: 'mc.coordinate-geometry.reverses-coordinate-order',
  misreadInput: 'mc.functions-concept.misreads-input-in-notation',
  fTimes: 'mc.functions-concept.f-of-x-as-multiplication',
  swapIZ: 'mc.linear-functions.intercept-zero-swap',
  firstOut: 'mc.linear-functions.first-output-as-intercept',
  signDrop: 'mc.linear-functions.term-sign-dropped',
  position: 'mc.linear-functions.position-based-slope-intercept',
  implicit: 'mc.linear-functions.implicit-coefficient-as-zero',
  oneZero: 'mc.linear-functions.exactly-one-zero-including-constants',
  endStyle: 'mc.linear-equations.endpoint-style-convention',
  strict: 'mc.linear-equations.bound-phrase-strictness-wrong',
  between: 'mc.linear-equations.between-chain-points-toward-variable',
  endPoints: 'mc.functions-concept.domain-as-endpoint-points',
  domRange: 'mc.functions-concept.domain-range-swap',
  cropped: 'mc.data-displays.cropped-graph-is-whole',
  allReals: 'mc.functions-concept.context-domain-all-reals',
  fractions: 'mc.functions-concept.discrete-quantity-allows-fractions',
  copyDomain: 'mc.functions-concept.copies-domain-as-range',
  rangeAll: 'mc.functions-concept.range-defaults-to-all-reals',
  beyond: 'mc.functions-concept.graphs-beyond-restricted-interval',
  window: 'mc.functions-concept.vertical-window-as-range',
  spans: 'mc.functions-concept.interval-spans-break',
  reversed: 'mc.functions-concept.interval-endpoints-reversed',
  swapMB: 'mc.linear-functions.swaps-m-and-b',
  mixes: 'mc.linear-functions.mixes-coordinates-of-points',
  rowsOnly: 'mc.functions-concept.initial-rows-only-model-check',
  estimated: 'mc.data-displays.estimated-points-for-slope',
  edge: 'mc.data-displays.window-edge-as-axis',
  dropsSign: 'mc.linear-functions.drops-slope-sign',
  wrongSign: 'mc.quadratic-polynomial.wrong-sign-zero-factor',
  slots: 'mc.linear-functions.point-in-variable-slots',
  stdFractions: 'mc.linear-functions.standard-form-fractions',
  stdShortcut: 'mc.linear-functions.standard-form-slope-shortcuts',
  stdYAlone: 'mc.linear-functions.standard-form-y-alone',
  partialDist: 'mc.properties.partial-distribution',
  noSignChange: 'mc.linear-equations.moves-term-without-sign-change',
  someTerms: 'mc.linear-equations.scales-only-some-terms',
  vhSwap: 'mc.linear-functions.vertical-horizontal-line-swap',
  uniqueEq: 'mc.functions-concept.unique-equation-for-graph',
  negShift: 'mc.functions-concept.negative-factor-as-shift',
  shiftSlope: 'mc.linear-functions.vertical-shift-changes-slope',
  twoPoints: 'mc.linear-functions.two-points-always-determine-function',
  perUnit: 'mc.linear-functions.rate-without-per-unit',
  units: 'mc.linear-functions.feature-units-wrong',
  inverseUnits: 'mc.functions-concept.inverse-output-units',
  rejects: 'mc.linear-functions.rejects-valid-intercept',
  declared: 'mc.functions-concept.declared-domain-proves-model-validity',
} as const;

// ---------- building blocks ----------
const X = '<i>x</i>', Yv = '<i>y</i>';
const near = (a: number, b: number) => Math.abs(a - b) < 1e-6;
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
    ...b, input: 'num', answer: { kind: 'num', v }, slips: slips.map(s => ({ kind: 'num', v: s.v }) as Response),
    check(r: Response): Verdict {
      if (r.kind !== 'num' || !Number.isFinite(r.v)) return { ok: false, say: 'Type a number.' };
      if (near(r.v, v)) return { ok: true, say: okSay };
      const s = slips.find(s => !near(s.v, v) && Math.abs(r.v - s.v) < (s.tol ?? 1e-6));
      return s ? { ok: false, mc: s.mc, say: s.say } : { ok: false, say: other };
    },
  };
}
interface PairSlip { x: number; y: number; mc?: string; say: string }
interface PairIO { lead: string; op: string; tail?: string }
const PT: PairIO = { lead: '(', op: ',', tail: ')' };
const MB: PairIO = { lead: `${Yv} =`, op: `${X} +` };
function pairItem(b: Base, x: number, y: number, io: PairIO, okSay: string, slips: PairSlip[], other: string): LItem {
  return {
    ...b, input: 'pair', pairLead: io.lead, pairOp: io.op, pairTail: io.tail, answer: { kind: 'pair', x, y }, slips: slips.map(s => ({ kind: 'pair', x: s.x, y: s.y }) as Response),
    check(r: Response): Verdict {
      if (r.kind !== 'pair' || !Number.isFinite(r.x) || !Number.isFinite(r.y)) return { ok: false, say: 'Fill in both boxes.' };
      if (near(r.x, x) && near(r.y, y)) return { ok: true, say: okSay };
      const s = slips.find(s => !(near(s.x, x) && near(s.y, y)) && near(r.x, s.x) && near(r.y, s.y));
      return s ? { ok: false, mc: s.mc, say: s.say } : { ok: false, say: other };
    },
  };
}
/** a value that a number box takes exactly (a terminating decimal) */
const typable = (a: Q) => qDec(a) !== null;
const dec = (v: number) => Math.round(v * 1000) / 1000;
/** "(−2)" for a negative number inside a sum */
const par = (v: number) => (v < 0 ? `(${nH(v)})` : nH(v));
const parT = (v: number) => (v < 0 ? `(${nT(v)})` : nT(v));
/** the outputs of a table on the board (the data, so every item reads differently) */
const rowT = (x: number, y: number, f = 'f') => (f === 'y' ? `x = ${nT(x)}:\ y = ${nT(y)}` : `${f}(${nT(x)}) = ${nT(y)}`);
const STEPS = [0.5, 1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000];
/** an axis with the smallest friendly step that keeps the grid at most `max` lines */
function axisFor(vals: readonly number[], o: { zero?: boolean; name?: string; max?: number; min?: number; pad?: number; steps?: number[] } = {}): GAxis {
  for (const s of o.steps ?? STEPS) {
    const a = fitAxis(vals, s, { zero: o.zero, name: o.name, pad: o.pad, min: o.min });
    if ((a.max - a.min) / s <= (o.max ?? 12)) return a;
  }
  return fitAxis(vals, 1000, { zero: o.zero, name: o.name });
}
/** a unit-grid picture of y = mx + b through the given points (square cells), the line keyed 'L' */
function gUnit(m: number, b: number, pts: Pt2[], items: GItem[], show: string[], solve: string[], o: { line?: Partial<Extract<GItem, { kind: 'line' }>>; zero?: boolean } = {}): GPic {
  // room for word labels (run / rise): about 3 units on the side they run to
  const room: Pt2[] = pts.slice();
  for (const it of items) if (it.kind === 'text') room.push([it.x + (it.align === 'left' ? 3 : it.align === 'right' ? -3 : 1.5), it.y], [it.x - (it.align ? 0 : 1.5), it.y]);
  const w = squareWin(room.map(p => p[0]), room.map(p => p[1]), 1, o.zero ?? true);
  return { ...w, equal: true, items: [{ kind: 'line', key: 'L', m, b, ...o.line }, ...items], show: ['axes', ...show], solve };
}
const point = (key: string, P: Pt2, name?: string, col?: GItem['col']): GItem => ({ kind: 'point', key, x: P[0], y: P[1], name, col });
const slp = (m: Q) => qNum(m);
/** a friendly nonzero slope: integers, then halves, thirds, quarters */
function slopeQ(R: () => number, o: { frac?: boolean; maxInt?: number } = {}): Q {
  const s = R() < 0.5 ? -1 : 1;
  if (o.frac && R() < 0.5) { const [p, d] = pick(R, [[1, 2], [3, 2], [1, 3], [2, 3], [3, 4], [1, 4], [5, 2], [4, 3]] as const); return q(s * p, d); }
  return q(s * int(R, 1, o.maxInt ?? 5));
}

// ---------- 1 linear-constant-rate ----------
const tableLinear: Gen = (R, n) => {
  if (R() < 0.35) {
    // which situation is linear (words)
    const a = int(R, 2, 9) * 5, r = int(R, 2, 9), c = int(R, 10, 30);
    const LIN = [
      `A plumber charges $${a} to come out plus $${r} per hour.`,
      `A ${c}-inch candle burns down ${r === 2 ? 'half an inch' : `${r} tenths of an inch`} every hour.`,
      `You start with $${a} and save $${r} every week.`,
      `A car rental costs $${r * 5} per day plus a $${a} fee.`,
    ];
    const NON = [
      `A video's views double every day, starting at ${c}.`,
      `The area of a square, for a side of s inches.`,
      `An account earns 5% of its balance every year.`,
      `A bacteria count triples every hour.`,
    ];
    const right = pick(R, LIN), ws = shuffle(R, NON.slice()).slice(0, 2);
    return choice(R, {
      id: `tableLinear-${n}`, family: 'tableLinear', board: '\\Delta y\\ \\text{per step}\\ =\\ ?',
      prompt: 'Which situation is <b>linear</b>: the same change in output for each equal step of input?',
      solution: [`Linear means a constant <b>additive</b> change: the same amount added (or taken away) at every equal step.`, `Doubling, tripling, a percent of the balance or s² change by a different amount each step.`],
    }, right, 'Yes: the same amount is added at every equal step.', ws.map(t => ({ t, mc: MC.illusion, say: 'It grows, but not by the same amount each step: the change itself keeps changing. That is not linear.' })), 3);
  }
  const kind = pick(R, ['prop', 'nonprop', 'nonprop', 'const', 'square', 'double'] as const);
  const x0 = kind === 'double' ? 0 : int(R, -3, 0), xs = Array.from({ length: 5 }, (_, i) => x0 + i);
  const m = (R() < 0.5 ? -1 : 1) * int(R, 1, 6), b = (R() < 0.5 ? -1 : 1) * int(R, 1, 9), c = int(R, 1, 3);
  const f = (x: number) => kind === 'prop' ? m * x : kind === 'nonprop' ? m * x + b : kind === 'const' ? b : kind === 'square' ? x * x + b : c * 2 ** x;
  const ys = xs.map(f);
  const L = 'Linear and proportional', NP = 'Linear, not proportional', NL = 'Not linear';
  const right = kind === 'prop' ? L : kind === 'nonprop' || kind === 'const' ? NP : NL;
  const d = ys.slice(1).map((y, i) => y - ys[i]!);
  const sol = [`The changes in ${Yv} for each step of 1: ${d.map(v => (v >= 0 ? '+' : '−') + Math.abs(v)).join(', ')}.`,
    right === NL ? 'They are not all equal, so it is not linear (one unequal change is enough).'
      : `All equal: linear (a table is only a sample, but every row here fits). ${kind === 'prop' ? 'The row (0, 0) is in the table: proportional.' : `At ${X} = 0 the output is ${nH(f(0))}, not 0: not proportional.`}`];
  const wrongs: Opt[] = [L, NP, NL].filter(t => t !== right).map(t => ({
    t,
    mc: right === NL ? MC.illusion : t === L && right === NP ? MC.scalesNonProp : undefined,
    say: right === NL ? 'Look at the changes, not just the direction: they are not equal, so it is not linear.'
      : t === L ? `Proportional needs the output 0 at input 0. Here ${X} = 0 gives ${nH(f(0))}.`
        : t === NL ? 'Every step of 1 changes the output by the same amount: that is linear.' : 'The row (0, 0) is in the table, so it is proportional too.',
  }));
  return choice(R, {
    id: `tableLinear-${n}`, family: 'tableLinear', board: rowT(xs[0]!, ys[0]!, 'y'),
    prompt: 'Is this table linear? If so, is it proportional?',
    picture: { t: { xName: 'x', yName: 'y', xs, ys: ys.map(nH), diffs: true } }, solution: sol,
  }, right, right === NL ? 'Right: the changes are not equal.' : 'Right: equal changes at every step.', wrongs, 3);
};
const changeTable: Gen = (R, n, sg) => {
  if (sg === 'linear-constant-rate') {
    const m = (R() < 0.15 ? 0 : (R() < 0.5 ? -1 : 1) * int(R, 1, 8)), b = int(R, -9, 9), x0 = int(R, -3, 1), xs = Array.from({ length: 5 }, (_, i) => x0 + i);
    const ys = xs.map(x => m * x + b);
    return numItem({
      id: `changeTable-${n}`, family: 'changeTable', board: rowT(xs[0]!, ys[0]!, 'y'),
      prompt: `The table is linear. By how much does ${Yv} change each time ${X} goes up by 1?`,
      picture: { t: { xName: 'x', yName: 'y', xs, ys: ys.map(nH), diffs: true } },
      solution: [`Subtract each output from the next: ${nH(ys[1]!)} − ${par(ys[0]!)} = ${nH(m)}, and every row gives the same.`, `So ${Yv} changes by ${ans(nH(m))} for each step of 1.`],
    }, m, `Yes: ${nH(m)} every step.`, [{ v: -m, mc: MC.dropsSign, say: 'Watch the direction: the outputs go the other way.' }], 'Subtract one output from the next one.');
  }
  // uneven input steps: change in y over change in x
  const m = pick(R, [2, 3, 4, -2, -3, -4, 0.5, -0.5, 1.5, -1.5, 2.5, -2.5]);
  const half = !Number.isInteger(m);
  let x = (half ? 2 : 1) * int(R, -2, 1);
  const xs = [x];
  for (let i = 0; i < 3; i++) { x += (half ? 2 : 1) * pick(R, [1, 2, 3]); xs.push(x); }
  if (xs.slice(1).every((v, i) => v - xs[i]! === xs[1]! - xs[0]!)) xs[3] = xs[3]! + (half ? 2 : 1);
  const b = int(R, -6, 8), ys = xs.map(v => m * v + b);
  const dx = xs[1]! - xs[0]!, dy = ys[1]! - ys[0]!;
  const slips: NumSlip[] = [];
  if (dx !== 1) slips.push({ v: dy, mc: MC.ignoresStep, say: `${nH(dy)} is the change in ${Yv}, but ${X} went up by ${dx}, not 1. Divide by the change in ${X}.` });
  if (xs[0] !== 0) slips.push({ v: ys[0]! / xs[0]!, mc: MC.yOverX, say: `That is ${Yv} ÷ ${X} of one row. Slope compares CHANGES between two rows.` });
  if (dy !== 0) slips.push({ v: dx / dy, mc: MC.inverted, say: 'Change in output goes on top: Δy ÷ Δx.' });
  slips.push({ v: -m, mc: MC.dropsSign, say: `Keep the sign: ${Yv} goes ${m > 0 ? 'up' : 'down'} as ${X} goes up.` });
  return numItem({
    id: `changeTable-${n}`, family: 'changeTable', board: 'm = \\frac{\\Delta y}{\\Delta x}',
    prompt: `The inputs ${xs.map(nH).join(', ')} are not evenly spaced. What is the slope of this linear table? (A decimal is fine.)`,
    picture: { t: { xName: 'x', yName: 'y', xs, ys: ys.map(nH), diffs: true } },
    solution: [`First two rows: Δ${X} = ${nH(dx)}, Δ${Yv} = ${nH(dy)}.`, `m = Δ${Yv} ÷ Δ${X} = ${nH(dy)} ÷ ${nH(dx)} = ${ans(nH(m))}. Any two rows give the same.`],
  }, m, `Yes: ${nH(dy)} ÷ ${nH(dx)} = ${nH(m)}.`, slips, 'Divide the change in y by the change in x between two rows.');
};

// ---------- 2-4 slope ----------
/** two lattice points on a line with slope m (|run| small), inside ±8 */
function twoPts(R: () => number, m: Q, o: { span?: number } = {}): [Pt2, Pt2] {
  for (let t = 0; t < 60; t++) {
    const k = int(R, 1, Math.max(1, Math.floor((o.span ?? 6) / m.q))), run = m.q * k * (R() < 0.3 ? -1 : 1), rise = m.p * k * Math.sign(run);
    const A: Pt2 = [int(R, -6, 4), int(R, -6, 6)], Bp: Pt2 = [A[0] + run, A[1] + rise];
    if (Math.abs(Bp[0]) <= 8 && Math.abs(Bp[1]) <= 8 && Math.abs(rise) <= 10) return [A, Bp];
  }
  return [[0, 0], [m.q, m.p]];
}
const graphSlope: Gen = (R, n, sg) => {
  const m = slopeQ(R, { frac: true, maxInt: 4 });
  const [A, Bp] = twoPts(R, m);
  const Lb = qNum(qSub(toQ(A[1]), qMul(m, toQ(A[0]))));
  const named = true, twoPt = sg === 'slope-two-points';
  const opts: Opt[] = [];
  if (!(Math.abs(m.p) === 1 && m.q === 1)) opts.push({ t: qH(q(m.q, m.p)), mc: MC.inverted, say: 'Rise goes over run: the change in y on top.' });
  opts.push({ t: qH(qNeg(m)), mc: twoPt ? MC.order : MC.dropsSign, say: `Read the direction left to right: the line goes ${m.p > 0 ? 'up' : 'down'}, so the slope is ${m.p > 0 ? 'positive' : 'negative'}.` });
  if (Bp[0] !== 0) opts.push({ t: qH(q(Bp[1], Bp[0])), mc: MC.yOverX, say: 'That is y ÷ x of one point. Slope divides the change in y by the change in x between two points.' });
  opts.push({ t: nH(Bp[1]), mc: MC.asHeight, say: 'That is a height on the graph, not a rate. Slope is how much y changes per 1 of x.' });
  const run = Bp[0] - A[0], rise = Bp[1] - A[1];
  return choice(R, {
    id: `graphSlope-${n}`, family: 'graphSlope', board: 'm = \\frac{\\text{rise}}{\\text{run}}',
    prompt: twoPt ? `What is the slope of the line through ${pt(A)} and ${pt(Bp)}?` : `On the graph, go from ${pt(A)} to ${pt(Bp)}. What is the slope: rise over run?`,
    picture: { g: gUnit(slp(m), Lb, [A, Bp], [point('A', A, named ? pt(A) : undefined), point('B', Bp, named ? pt(Bp) : undefined), ...riseRun('t', A, Bp, 1, 1, `run ${nH(run)}`, `rise ${nH(rise)}`)], ['L', 'A', 'B'], ['trun', 'trise', 'trunT', 'triseT']) },
    solution: [`From one point to the other: run ${nH(run)}, rise ${nH(rise)}.`, `m = rise ÷ run = ${nH(rise)} ÷ ${nH(run)} = ${qP(m)}.`],
  }, qH(m), `Yes: rise ${nH(rise)} over run ${nH(run)}.`, opts);
};
const twoPointSlope: Gen = (R, n) => {
  const zero = R() < 0.15;
  const m = zero ? q(0) : slopeQ(R, { frac: true, maxInt: 5 });
  let [P1, P2] = zero ? (() => { const y = int(R, -7, 7), a = int(R, -7, 0); return [[a, y], [a + int(R, 2, 8), y]] as [Pt2, Pt2]; })() : twoPts(R, m);
  if (!zero && R() < 0.6) { const neg = (p: Pt2): Pt2 => [p[0] - 3, p[1] - 4]; if (Math.abs(neg(P1)[0]) <= 8 && Math.abs(neg(P2)[1]) <= 8 && Math.abs(neg(P1)[1]) <= 8 && Math.abs(neg(P2)[0]) <= 8) { P1 = neg(P1); P2 = neg(P2); } }
  const rev = R() < 0.4;
  const [Pa, Pb] = rev ? [P2, P1] : [P1, P2];
  const [x1, y1] = Pa, [x2, y2] = Pb;
  const Lb = qNum(qSub(toQ(y1), qMul(m, toQ(x1))));
  const pic: Pic = { g: gUnit(slp(m), Lb, [Pa, Pb], [point('A', Pa, pt(Pa)), point('B', Pb, pt(Pb))], ['A', 'B'], ['L']) };
  const setup = R() < 0.4 && !zero;
  const sol = [`m = (${Yv}₂ − ${Yv}₁) ÷ (${X}₂ − ${X}₁), the same point first in both: (${nH(y2)} − ${par(y1)}) ÷ (${nH(x2)} − ${par(x1)}).`,
    `= ${nH(y2 - y1)} ÷ ${nH(x2 - x1)} = ${qP(m)}. Taking the points the other way round gives the same.`];
  const base: Base = { id: `twoPointSlope-${n}`, family: 'twoPointSlope', board: 'm = \\frac{y_2 - y_1}{x_2 - x_1}', prompt: '', picture: pic, solution: sol };
  if (setup) {
    const f = (a: string, b: string) => `(${a}) ÷ (${b})`;
    return choice(R, { ...base, prompt: `Which set-up gives the slope from ${pt(Pa)} to ${pt(Pb)}?` },
      f(`${nH(y2)} − ${par(y1)}`, `${nH(x2)} − ${par(x1)}`), 'Yes: second minus first, top and bottom.', [
        { t: f(`${nH(y2)} − ${par(y1)}`, `${nH(x1)} − ${par(x2)}`), mc: MC.order, say: 'The top starts from the second point, the bottom from the first: the order must match, or the sign flips.' },
        // a set-up that happens to give the slope too (m = ±1, mirrored points) is not offered
        ...[{ t: f(`${nH(x2)} − ${par(x1)}`, `${nH(y2)} − ${par(y1)}`), v: (x2 - x1) / (y2 - y1), mc: MC.inverted, say: 'The change in y goes on top.' },
          { t: f(`${nH(y2)} − ${par(x2)}`, `${nH(y1)} − ${par(x1)}`), v: (y2 - x2) / (y1 - x1), mc: MC.mixes, say: 'Subtract y from y and x from x: the changes between the two points.' }]
          .filter(o => !(Math.abs(o.v - qNum(m)) < 1e-9)).map(({ v: _v, ...o }) => o),
      ]);
  }
  if (zero) return choice(R, { ...base, prompt: `What is the slope of the line through ${pt(Pa)} and ${pt(Pb)}?` }, '0', 'Yes: no change in y, so 0 ÷ run = 0.', [
    { t: 'undefined', mc: MC.noSlope, say: 'Undefined is for a change in x of 0. Here x changes and y does not: 0 ÷ run = 0, a flat line.' },
    { t: nH(x2 - x1), mc: MC.inverted, say: 'That is the run. The rise (change in y) goes on top, and it is 0.' },
  ]);
  const opts: Opt[] = [{ t: qH(qNeg(m)), mc: MC.order, say: 'Subtract in the same order on top and bottom (second minus first), or the sign flips.' }];
  if (!(Math.abs(m.p) === 1 && m.q === 1)) opts.push({ t: qH(q(m.q, m.p)), mc: MC.inverted, say: 'The change in y goes on top.' });
  if (x1 !== 0) opts.push({ t: qH(q(y1, x1)), mc: MC.yOverX, say: 'That is y ÷ x of one point. Slope uses the changes between the two points.' });
  opts.push({ t: qH(qAdd(m, q(1))), say: 'Check the subtraction: subtracting a negative adds.' });
  return choice(R, { ...base, prompt: `What is the slope of the line through ${pt(Pa)} and ${pt(Pb)}?` }, qH(m), `Yes: ${nH(y2 - y1)} ÷ ${nH(x2 - x1)} = ${qP(m)}.`, opts);
};
const CTX_AX = [['time (s)', 'distance (m)', 'meters per second'], ['hours', 'miles', 'miles per hour'], ['minutes', 'gallons', 'gallons per minute'], ['days', 'height (cm)', 'cm per day'], ['x', 'y', '']] as const;
const scaledSlope: Gen = (R, n) => {
  for (;;) {
    const sx = pick(R, [2, 5, 10, 0.5, 1]), sy = pick(R, [5, 10, 20, 50, 2, 25]);
    if (sx === sy) continue;
    const a = int(R, 1, 4), c = (R() < 0.3 ? -1 : 1) * int(R, 1, 4);
    const m = (c * sy) / (a * sx);
    if (Math.abs(m * 1000 - Math.round(m * 1000)) > 1e-6) continue;
    const ctx = pick(R, CTX_AX);
    const i0 = int(R, 1, 4), j0 = c > 0 ? int(R, 1, 3) : int(R, 5, 7);
    const A: Pt2 = [i0 * sx, j0 * sy], Bp: Pt2 = [(i0 + a) * sx, (j0 + c) * sy];
    const xA: GAxis = { min: 0, max: 10 * sx, step: sx, name: ctx[0] }, yA: GAxis = { min: 0, max: 10 * sy, step: sy, name: ctx[1] };
    const b = A[1] - m * A[0];
    return numItem({
      id: `scaledSlope-${n}`, family: 'scaledSlope', board: 'm = \\frac{\\Delta y}{\\Delta x}', unit: ctx[2],
      prompt: `Point A is at ${pt(A)}. Read point B with the axis scales. What is the slope from A to B?${ctx[2] ? ` (in ${ctx[2]})` : ''}`,
      picture: { g: { x: xA, y: yA, items: [{ kind: 'line', key: 'L', m, b }, point('A', A, 'A'), point('B', Bp, 'B'), ...riseRun('t', A, Bp, sx, sy, `${a} × ${nH(sx)}`, `${nH(c)} × ${nH(sy)}`)], show: ['axes', 'L', 'A', 'B'], solve: ['trun', 'trise', 'trunT', 'triseT'] } },
      solution: [`Run: ${a} square${a === 1 ? '' : 's'} × ${nH(sx)} = ${nH(a * sx)}. Rise: ${nH(c)} square${Math.abs(c) === 1 ? '' : 's'} × ${nH(sy)} = ${nH(c * sy)}.`, `m = ${nH(c * sy)} ÷ ${nH(a * sx)} = ${ans(nH(m))}.`],
    }, dec(m), `Yes: ${nH(c * sy)} ÷ ${nH(a * sx)}.`, [
      { v: c / a, mc: MC.interval, say: `Counting squares gives ${nH(c)} ÷ ${a}, but one square is ${nH(sx)} across and ${nH(sy)} up. Use the values.` },
      { v: (a * sx) / (c * sy), mc: MC.inverted, say: 'The change in y goes on top.' },
    ], 'Turn squares into values with each axis scale, then divide rise by run.');
  }
};
const steeperScaled: Gen = (R, n) => {
  for (;;) {
    const flatLook = R() < 0.5;
    const sx = flatLook ? 1 : pick(R, [5, 10]), sy = flatLook ? pick(R, [5, 10]) : 1;
    const a = int(R, 1, 3), c = int(R, 1, 3) * (flatLook ? 1 : 2);
    const mA = (c * sy) / (a * sx), look = c / a, mB = int(R, 1, 4);
    if (near(mA, mB) || near(look, mB) || (mA > mB) === (look > mB)) { if (R() < 0.85) continue; }
    if (near(mA, mB)) continue;
    const b = 0;
    const right = mA > mB ? 'Line A' : 'Line B', wrong = mA > mB ? 'Line B' : 'Line A';
    const ax = pick(R, [['x', 'y'], ['hours', 'miles'], ['minutes', 'liters'], ['days', 'inches'], ['weeks', 'dollars']] as const);
    const looksA = look > mB;
    return choice(R, {
      id: `steeperScaled-${n}`, family: 'steeperScaled', board: 'm_A\\ \\text{vs}\\ m_B',
      prompt: `Line A (${ax[1]} against ${ax[0]}) is drawn here. Line B has slope ${mB}: on a 1-by-1 grid it rises ${mB} square${mB > 1 ? 's' : ''} for each square across. Which line has the greater slope?`,
      picture: { g: { x: { min: 0, max: 8 * sx, step: sx, name: ax[0] }, y: { min: 0, max: 8 * sy, step: sy, name: ax[1] }, items: [{ kind: 'line', key: 'L', m: mA, b, name: 'A' }, point('P', [a * sx, c * sy]), ...riseRun('t', [0, 0], [a * sx, c * sy], sx, sy, `run ${nH(a * sx)}`, `rise ${nH(c * sy)}`).filter(i => i.key !== 'trunT')], show: ['axes', 'L', 'P'], solve: ['trun', 'trise', 'triseT'] } },
      solution: [`Line A: rise ${nH(c * sy)} over run ${nH(a * sx)}, slope ${nH(dec(mA))} (the axes have different scales).`, `Line B: slope ${mB}. ${nH(dec(mA))} ${mA > mB ? '>' : '<'} ${mB}.`],
    }, right, `Yes: A has slope ${nH(dec(mA))}, B has ${mB}.`, [
      { t: wrong, mc: (wrong === 'Line A') === looksA ? MC.steepLook : undefined, say: `Read the scales: A rises ${nH(c * sy)} over ${nH(a * sx)}, slope ${nH(dec(mA))}. How steep it looks depends on the grid.` },
      { t: 'They are equal', say: `Compute A: ${nH(c * sy)} ÷ ${nH(a * sx)} = ${nH(dec(mA))}, not ${mB}.` },
    ], 3);
  }
};

// ---------- 5 zero vs undefined ----------
const flatOrSteep: Gen = (R, n, sg) => {
  const vert = R() < 0.5;
  const c = (R() < 0.5 ? -1 : 1) * int(R, 1, 6), u = int(R, -6, 0), v = u + int(R, 2, 7);
  const P1: Pt2 = vert ? [c, u] : [u, c], P2: Pt2 = vert ? [c, v] : [v, c];
  const w = squareWin([P1[0], P2[0]], [P1[1], P2[1]]);
  const g: GPic = { ...w, equal: true, items: [vert ? { kind: 'vline', key: 'L', x: c } : { kind: 'line', key: 'L', m: 0, b: c }, point('A', P1, pt(P1)), point('B', P2, pt(P2))], show: ['axes', 'A', 'B'], solve: ['L'] };
  const sol = [`Change in ${X}: ${nH(P2[0])} − ${par(P1[0])} = ${nH(P2[0] - P1[0])}. Change in ${Yv}: ${nH(P2[1])} − ${par(P1[1])} = ${nH(P2[1] - P1[1])}.`,
    vert ? `${nH(v - u)} ÷ 0 has no value: the slope is undefined. The line is ${X} = ${nH(c)}, vertical, and not a function (one input, many outputs).`
      : `0 ÷ ${nH(v - u)} = 0: slope 0. The line is ${Yv} = ${nH(c)}, horizontal, and a function (every input has the one output ${nH(c)}).`];
  const base: Base = { id: `flatOrSteep-${n}`, family: 'flatOrSteep', board: 'm = \\frac{y_2 - y_1}{x_2 - x_1}', prompt: '', picture: { g }, solution: sol };
  if (sg !== 'zero-vs-undefined-slope' || R() < 0.5) {
    const H0 = 'Slope 0: a horizontal line, and a function', V0 = 'Undefined slope: a vertical line, not a function';
    return choice(R, { ...base, prompt: `The line through ${pt(P1)} and ${pt(P2)}: which is true?` }, vert ? V0 : H0, vert ? 'Yes: the run is 0, so the slope is undefined.' : 'Yes: the rise is 0, so the slope is 0.', vert ? [
      { t: 'Slope 0: a horizontal line, and a function', mc: MC.noSlope, say: `The x's are equal, so the RUN is 0. Dividing by 0 is undefined; slope 0 is a flat line.` },
      { t: 'Undefined slope: a vertical line, but still a function', say: `The input ${nH(c)} has two outputs, ${nH(u)} and ${nH(v)}: not a function.` },
      { t: 'Slope 0: a vertical line, not a function', mc: MC.vhSwap, say: 'A vertical line has run 0, so its slope is undefined, not 0.' },
    ] : [
      { t: 'Undefined slope: a vertical line, not a function', mc: MC.vhSwap, say: `The y's are equal: the line is flat (horizontal), and its rise is 0.` },
      { t: 'Slope 0: a horizontal line, but not a function', mc: MC.constNotFn, say: `${Yv} = ${nH(c)} gives every input the same one output: that IS a function, a constant one.` },
      { t: 'Undefined slope: a horizontal line, and a function', mc: MC.noSlope, say: '0 divided by a nonzero run is 0, not undefined.' },
    ]);
  }
  return choice(R, { ...base, prompt: `What is the slope of the line through ${pt(P1)} and ${pt(P2)}?` }, vert ? 'undefined' : '0', vert ? `Yes: ${nH(v - u)} ÷ 0 has no value.` : `Yes: 0 ÷ ${nH(v - u)} = 0.`, vert ? [
    { t: '0', mc: MC.kOverZero, say: `${nH(v - u)} ÷ 0 is not 0: no number times 0 gives ${nH(v - u)}. The slope is undefined.` },
    { t: nH(v - u), say: 'That is the rise alone. Divide it by the run, which is 0.' },
  ] : [
    { t: 'undefined', mc: MC.noSlope, say: '0 ÷ a nonzero number is 0. Undefined is the other way round, a run of 0.' },
    { t: nH(v - u), mc: MC.inverted, say: 'That is the run. The rise goes on top, and it is 0.' },
  ], 3);
};
const hvLine: Gen = (R, n, sg) => {
  const vert = sg === 'range-linear-function' ? false : R() < 0.5;
  const c = (R() < 0.5 ? -1 : 1) * int(R, 1, 7);
  const w = squareWin([c, 0, 2], [c, 0, -2]);
  const g: GPic = { ...w, equal: true, items: [vert ? { kind: 'vline', key: 'L', x: c } : { kind: 'line', key: 'L', m: 0, b: c }, point('P', vert ? [c, 0] : [0, c], vert ? `(${nH(c)}, 0)` : `(0, ${nH(c)})`)], show: ['axes'], solve: ['L', 'P'] };
  const eq = vert ? `${X} = ${nH(c)}` : `${Yv} = ${nH(c)}`;
  const H = `A horizontal line through (0, ${nH(c)}); domain all real numbers, range {${nH(c)}}`;
  const V = `A vertical line through (${nH(c)}, 0); not a function`;
  return choice(R, {
    id: `hvLine-${n}`, family: 'hvLine', board: vert ? `x = ${nT(c)}` : `y = ${nT(c)}`,
    prompt: `Graph ${eq}. Which description is right?`, picture: { g },
    solution: vert ? [`${X} = ${nH(c)} holds for every point with first coordinate ${nH(c)}, whatever ${Yv} is: (${nH(c)}, 0), (${nH(c)}, 1), (${nH(c)}, −5)…`, 'Those points stand in a vertical line. One input, many outputs: not a function.']
      : [`${Yv} = ${nH(c)} holds for every point with second coordinate ${nH(c)}, whatever ${X} is.`, `Those points lie on a horizontal line. Every real input is allowed; the only output is ${nH(c)}.`],
  }, vert ? V : H, 'Yes.', vert ? [
    { t: `A horizontal line through (0, ${nH(c)}); domain all real numbers, range {${nH(c)}}`, mc: MC.vhSwap, say: `${X} = ${nH(c)} fixes the INPUT: every point has ${X} = ${nH(c)}, so the line stands up.` },
    { t: `A vertical line through (${nH(c)}, 0); a function with domain {${nH(c)}}`, say: `A function gives each input one output. The input ${nH(c)} gets every output here.` },
    { t: `The single point (${nH(c)}, 0)`, say: `(${nH(c)}, 1) and (${nH(c)}, 7) fit too: it is a whole line.` },
  ] : [
    { t: `A vertical line through (${nH(c)}, 0); not a function`, mc: MC.vhSwap, say: `${Yv} = ${nH(c)} fixes the OUTPUT: every point has height ${nH(c)}, so the line lies flat.` },
    { t: `A horizontal line through (0, ${nH(c)}); domain and range all real numbers`, mc: MC.rangeAll, say: `Every output is ${nH(c)}: the range is just {${nH(c)}}.` },
    { t: `A horizontal line through (0, ${nH(c)}); not a function`, mc: MC.constNotFn, say: 'Each input has exactly one output, the same one: a constant function.' },
  ]);
};

// ---------- 6-8 notation, intercept, m and b ----------
const evalF: Gen = (R, n, sg) => {
  const m = (R() < 0.5 ? -1 : 1) * int(R, 1, 6), b = int(R, -9, 9);
  const a = sg === 'y-intercept-input-zero' ? 0 : pick(R, [int(R, -5, -1), int(R, 1, 6), 0.5, int(R, 2, 4)]);
  const v = m * a + b, L: Lin = { m: q(m), b: q(b) };
  const slips: NumSlip[] = [];
  if (m !== 0 && Number.isInteger((a - b) / m * 2)) slips.push({ v: (a - b) / m, mc: MC.misreadInput, say: `That is the input whose OUTPUT is ${nH(a)}. f(${nH(a)}) asks for the output when the input is ${nH(a)}.` });
  if (a === 0 && m !== 0) slips.push({ v: -b / m, mc: MC.swapIZ, say: `That is where f(x) = 0 (the zero). f(0) is the output at input 0: the y-intercept.` });
  slips.push({ v: m * a, say: `You multiplied, now add the ${nH(b)} too.` });
  slips.push({ v: m * a - b, mc: MC.signDrop, say: 'Keep the sign of b.' });
  const pts: Pt2[] = [[a, v], [0, b], [a + 1, v + m]];
  const yA = axisFor(pts.map(p => p[1]), { zero: true, max: 14, steps: [1, 2, 5] }), xA = fitAxis(pts.map(p => p[0]), 1, { zero: true });
  const g: GPic = { x: xA, y: yA, items: [{ kind: 'line', key: 'L', m, b, name: `f(x) = ${exprPlain(q(m), q(b))}` }, { kind: 'seg', key: 'up', a: [a, 0], b: [a, v], col: 'pick', dash: true }, point('P', [a, v], `(${nH(a)}, ${nH(v)})`, 'link')], show: ['axes', 'L'], solve: ['up', 'P'] };
  return numItem({
    id: `evalF-${n}`, family: 'evalF', board: `f(${nT(a)}) = \\,?`, picture: { g, tex: [`f(${nT(a)}) = ${nT(v)}`] },
    prompt: `f(${X}) = ${exprH(L.m, L.b)}. What is f(${nH(a)})?`,
    solution: [`f(${nH(a)}) means: put ${nH(a)} in for ${X}.`, `f(${nH(a)}) = ${nH(m)} · ${par(a)} ${b < 0 ? '−' : '+'} ${Math.abs(b)} = ${ans(nH(v))}. On the graph: the point (${nH(a)}, ${nH(v)}).`],
  }, v, `Yes: f(${nH(a)}) = ${nH(v)}.`, slips, `Replace ${X} by ${nH(a)} and work it out.`);
};
/** plain text of mx + b for canvas names */
function exprPlain(m: Q, b: Q): string { return exprH(m, b).replace(/<span class="fr"><span>([^<]*)<\/span><span>([^<]*)<\/span><\/span>/g, '$1/$2').replace(/<[^>]+>/g, ''); }
const readNotation: Gen = (R, n) => {
  const m = (R() < 0.5 ? -1 : 1) * int(R, 1, 3), b = int(R, -4, 4);
  const v = R();
  if (v < 0.3) {
    const a = int(R, -3, 4), c = m * a + b;
    if (a === c || Math.abs(c) > 7) return readNotation(R, n);
    return choice(R, {
      id: `readNotation-${n}`, family: 'readNotation', board: `f(${nT(a)}) = ${nT(c)}`,
      prompt: `f(${nH(a)}) = ${nH(c)}. What does that say?`,
      picture: { g: gUnit(m, b, [[a, c], [0, b]], [point('P', [a, c], `(${nH(a)}, ${nH(c)})`, 'link')], ['L'], ['P']) },
      solution: [`f(input) = output. The input is ${nH(a)}, the output is ${nH(c)}.`, `As a point: (input, output) = (${nH(a)}, ${nH(c)}).`],
    }, `The point (${nH(a)}, ${nH(c)}) is on the graph of f`, 'Yes: input first, output second.', [
      { t: `The point (${nH(c)}, ${nH(a)}) is on the graph of f`, mc: MC.coordOrder, say: 'The input comes first in a point: (input, output).' },
      { t: `f times ${par(a)} equals ${nH(c)}`, mc: MC.fTimes, say: 'f is the name of the function, not a number. f(…) means "the output of f at …".' },
      { t: `When the input is ${nH(c)}, the output is ${nH(a)}`, mc: MC.misreadInput, say: `The number inside the brackets is the input: ${nH(a)}.` },
    ]);
  }
  const askOut = v < 0.65;
  const a = int(R, -3, 4), c = m * a + b;
  if (a === c || Math.abs(c) > 7) return readNotation(R, n);
  const g = gUnit(m, b, [[a, c], [a + 1, c + m], [0, b]], [point('P', [a, c], `(${nH(a)}, ${nH(c)})`, 'link'), { kind: 'seg', key: 'up', a: [a, 0], b: [a, c], col: 'pick', dash: true }], ['L'], ['up', 'P'], { line: { name: 'f' } });
  return numItem({
    id: `readNotation-${n}`, family: 'readNotation', board: askOut ? `f(${nT(a)}) = \\,?` : `f(x) = ${nT(c)}\\ \\Rightarrow\\ x = \\,?`, picture: { g },
    prompt: askOut ? `Use the graph of f. What is f(${nH(a)})?` : `Use the graph of f. For which input ${X} is f(${X}) = ${nH(c)}?`,
    solution: askOut ? [`Go to the input ${nH(a)} on the ${X}-axis, then up or down to the line.`, `The line is at height ${ans(nH(c))} there: f(${nH(a)}) = ${nH(c)}.`]
      : [`Find the height ${nH(c)} on the line, then read its input.`, `The line reaches ${nH(c)} at ${X} = ${ans(nH(a))}.`],
  }, askOut ? c : a, 'Yes.', [{ v: askOut ? a : c, mc: MC.misreadInput, say: askOut ? `f(${nH(a)}) is the OUTPUT at input ${nH(a)}: read the height.` : `${nH(c)} is the output here; the question asks for its input.` }], askOut ? `Go across to ${X} = ${nH(a)}, then read the height of the line.` : `Find where the line is at height ${nH(c)}, then read across to the ${X}-axis.`);
};
const yIntercept: Gen = (R, n) => {
  const m = (R() < 0.5 ? -1 : 1) * int(R, 1, 4), b = (R() < 0.15 ? 0 : (R() < 0.5 ? -1 : 1) * int(R, 1, 8));
  const z = -b / m;
  const slips: PairSlip[] = [];
  const common = (x0: number, y0: number): PairSlip[] => [
    ...(x0 !== 0 ? [{ x: x0, y: y0, mc: MC.firstOut, say: `That is the first row, at ${X} = ${nH(x0)}. The y-intercept is where ${X} = 0.` }] : []),
    ...(Number.isFinite(z) && b !== 0 ? [{ x: z, y: 0, mc: MC.swapIZ, say: `That point has ${Yv} = 0: it is the x-intercept (the zero). The y-intercept has ${X} = 0.` }] : []),
    { x: b, y: 0, mc: MC.coordOrder, say: `The y-intercept sits on the ${Yv}-axis: its ${X}-coordinate is 0, so it is (0, ${nH(b)}).` },
  ];
  if (R() < 0.5) {
    const x0 = int(R, -3, -1), xs = Array.from({ length: 5 }, (_, i) => x0 + i), ys = xs.map(x => m * x + b);
    const i0 = xs.indexOf(0);
    slips.push(...common(x0, ys[0]!));
    return pairItem({
      id: `yIntercept-${n}`, family: 'yIntercept', board: 'f(0) = \\,?', prompt: `The table of a linear function f starts with f(${nH(x0)}) = ${nH(ys[0]!)}. Give its y-intercept as a point.`,
      picture: { t: { xName: 'x', yName: 'f(x)', xs, ys: ys.map(nH), ring: [i0] } },
      solution: [`The y-intercept is the output at input 0. Find the row with ${X} = 0 (not the first row).`, `There f(0) = ${nH(b)}: the point (${ans('0')}, ${ans(nH(b))}).`],
    }, 0, b, PT, `Yes: (0, ${nH(b)}).`, slips, `Find the row where the input is 0.`);
  }
  const P2: Pt2 = [2, 2 * m + b];
  slips.push(...common(Infinity, 0).filter(s => Number.isFinite(s.x)));
  return pairItem({
    id: `yIntercept-${n}`, family: 'yIntercept', board: '(0,\\ ?)', prompt: `This line passes through ${pt(P2)}. Where does it cross the y-axis? Give the point.`,
    picture: { g: gUnit(m, b, [[0, b], P2, [Number.isFinite(z) ? z : 0, 0]], [point('P', P2, pt(P2)), point('Y', [0, b], `(0, ${nH(b)})`, 'link')], ['L', 'P'], ['Y']) },
    solution: [`On the ${Yv}-axis every point has ${X} = 0.`, `The line crosses it at height ${nH(b)}: (${ans('0')}, ${ans(nH(b))}).`],
  }, 0, b, PT, `Yes: (0, ${nH(b)}).`, slips, 'Look where the line meets the vertical axis.');
};
const readMB: Gen = (R, n) => {
  const look = pick(R, ['std', 'bFirst', 'bFirst', 'neg1', 'frac', 'dec', 'const'] as const);
  let m: Q, b: Q, html: string, tex: string;
  const k = int(R, 2, 7), c = (R() < 0.5 ? -1 : 1) * int(R, 1, 9);
  switch (look) {
    case 'std': m = q((R() < 0.5 ? -1 : 1) * k); b = q(c); html = siH(m, b); tex = siT(m, b); break;
    case 'bFirst': { const s = R() < 0.6 ? -1 : 1; m = q(s * k); b = q(Math.abs(c) + 1); html = `${Yv} = ${nH(qNum(b))} ${s < 0 ? '−' : '+'} ${k}${X}`; tex = `y = ${nT(qNum(b))} ${s < 0 ? '-' : '+'} ${k}x`; break; }
    case 'neg1': m = q(-1); b = R() < 0.5 ? q(0) : q(c); html = siH(m, b); tex = siT(m, b); break;
    case 'frac': { const d = pick(R, [2, 4, 5]); m = q(1, d); b = q(c); html = `${Yv} = ${X}/${d} ${c < 0 ? '−' : '+'} ${Math.abs(c)}`; tex = `y = \\frac{x}{${d}} ${c < 0 ? '-' : '+'} ${Math.abs(c)}`; break; }
    case 'dec': m = q(pick(R, [1, 3, -1, -3, 5]), 2); b = q(0); html = `f(${X}) = ${nH(qNum(m))}${X}`; tex = `f(x) = ${nT(qNum(m))}x`; break;
    default: m = q(0); b = q(c); html = `${Yv} = ${nH(c)}`; tex = `y = ${nT(c)}`;
  }
  const mv = qNum(m), bv = qNum(b);
  const slips: PairSlip[] = [{ x: bv, y: mv, mc: MC.swapMB, say: 'm is the number multiplying x; b is the number on its own.' }];
  if (look === 'bFirst') slips.push({ x: bv, y: mv, mc: MC.position, say: `The order on the page does not matter: ${nH(mv)} multiplies ${X}, so m = ${nH(mv)}; ${nH(bv)} stands alone, so b = ${nH(bv)}.` });
  if (mv < 0) slips.push({ x: -mv, y: bv, mc: MC.signDrop, say: `The minus belongs to the x-term: m = ${nH(mv)}.` });
  if (bv < 0) slips.push({ x: mv, y: -bv, mc: MC.signDrop, say: `"− ${Math.abs(bv)}" means b = ${nH(bv)}.` });
  if (look === 'neg1') slips.push({ x: 0, y: bv, mc: MC.implicit, say: '−x means −1 · x: m = −1.' });
  if (look === 'const') slips.push({ x: bv, y: 0, mc: MC.position, say: `There is no x-term: m = 0 and the line is flat at ${nH(bv)}.` });
  const solution = [
    look === 'bFirst' ? `Reorder: ${siH(m, b)}.` : look === 'frac' ? `${X}/${m.q} is ${qP(m)} · ${X}.` : look === 'const' ? `${Yv} = ${nH(bv)} is ${Yv} = 0${X} ${bv < 0 ? '−' : '+'} ${nH(Math.abs(bv))}.` : look === 'neg1' ? `−${X} is −1 · ${X}.` : `Match ${Yv} = m${X} + b.`,
    `m = ${ans(nH(mv))}, b = ${ans(nH(bv))}.`,
  ];
  // picture: the line, and on the solve the y-intercept and one slope step
  const run = m.q * (m.q === 1 ? 1 : 1), rise = m.p;
  const A: Pt2 = [0, bv], Bp: Pt2 = [run, bv + rise];
  return pairItem({
    id: `readMB-${n}`, family: 'readMB', board: tex, prompt: `${html}. What are the slope m and the y-intercept b? (Decimals are fine.)`,
    picture: { g: gUnit(mv, bv, [A, Bp, [-1, bv - mv]], [point('Y', A, `(0, ${nH(bv)})`, 'link'), ...(mv !== 0 ? riseRun('t', A, Bp, 1, 1, `${run}`, `${nH(rise)}`) : [])], ['L'], ['Y', ...(mv !== 0 ? ['trun', 'trise'] : [])]) },
    solution,
  }, mv, bv, { lead: 'm =', op: ', b =' }, 'Yes.', slips, 'm multiplies the input; b is the output at input 0.');
};
const matchGraph: Gen = (R, n) => {
  const m = slopeQ(R, { frac: true, maxInt: 3 }), b = int(R, -5, 5) || 2;
  const A: Pt2 = [0, b], Bp: Pt2 = [m.q, b + m.p];
  const opts: Opt[] = [];
  if (!(qNum(m) === b)) opts.push({ t: siH(q(b), m), mc: MC.swapMB, say: `The slope multiplies ${X}; the y-intercept stands alone.` });
  opts.push({ t: siH(qNeg(m), q(b)), mc: MC.dropsSign, say: `Left to right the line goes ${m.p > 0 ? 'up' : 'down'}: the slope is ${m.p > 0 ? 'positive' : 'negative'}.` });
  if (!(Math.abs(m.p) === 1 && m.q === 1)) opts.push({ t: siH(q(m.q, m.p), q(b)), mc: MC.inverted, say: 'Rise over run, not run over rise.' });
  if (b !== 0) opts.push({ t: siH(m, q(-b)), mc: MC.signDrop, say: `The line crosses the y-axis at ${nH(b)}.` });
  return choice(R, {
    id: `matchGraph-${n}`, family: 'matchGraph', board: 'y = mx + b', prompt: `This line passes through ${pt(Bp)}. Which equation is it?`,
    picture: { g: gUnit(qNum(m), b, [A, Bp, [-m.q, b - m.p]], [point('B', Bp, pt(Bp)), point('Y', A, undefined, 'link'), ...riseRun('t', A, Bp, 1, 1, `${m.q}`, nH(m.p))], ['L', 'B'], ['Y', 'trun', 'trise', 'trunT', 'triseT']) },
    solution: [`It crosses the ${Yv}-axis at (0, ${nH(b)}): b = ${nH(b)}.`, `From there: run ${m.q}, rise ${nH(m.p)}, so m = ${qP(m)}.`],
  }, siH(m, q(b)), 'Yes.', opts);
};

// ---------- 9-10 zeros ----------
const zeroGraph: Gen = (R, n) => {
  const m = (R() < 0.5 ? -1 : 1) * int(R, 1, 3), z = R() < 0.15 ? 0 : int(R, -6, 6) || 3, b = -m * z;
  const slips: PairSlip[] = [];
  if (b !== 0) slips.push({ x: 0, y: b, mc: MC.swapIZ, say: `(0, ${nH(b)}) is where it crosses the ${Yv}-axis. A zero is an input where the output is 0.` });
  if (z !== 0) slips.push({ x: 0, y: z, mc: MC.coordOrder, say: `The zero is on the ${X}-axis: (${nH(z)}, 0), input first.` });
  if (R() < 0.45) {
    const x0 = z - int(R, 1, 3), xs = Array.from({ length: 5 }, (_, i) => x0 + i), ys = xs.map(x => m * x + b);
    return pairItem({
      id: `zeroGraph-${n}`, family: 'zeroGraph', board: rowT(x0, ys[0]!), prompt: `Find the zero of this linear function (inputs ${nH(x0)} to ${nH(x0 + 4)}). Give the x-intercept as a point.`,
      picture: { t: { xName: 'x', yName: 'f(x)', xs, ys: ys.map(nH), ring: [xs.indexOf(z)] } },
      solution: [`A zero is an input whose output is 0. Find the row with f(${X}) = 0.`, `It is at ${X} = ${nH(z)}: the x-intercept (${ans(nH(z))}, ${ans('0')}).`],
    }, z, 0, PT, `Yes: (${nH(z)}, 0).`, slips, 'Look for the output 0.');
  }
  return pairItem({
    id: `zeroGraph-${n}`, family: 'zeroGraph', board: 'f(x) = 0', prompt: `This line passes through ${pt([z + 2, 2 * m])}. Where is its zero? Give the x-intercept as a point.`,
    picture: { g: gUnit(m, b, [[z, 0], [0, b], [z + 2, 2 * m]], [point('P', [z + 2, 2 * m], pt([z + 2, 2 * m])), point('Z', [z, 0], `(${nH(z)}, 0)`, 'link')], ['L', 'P'], ['Z']) },
    solution: [`The zero is where the output is 0: the line meets the ${X}-axis.`, `That is at ${X} = ${nH(z)}: (${ans(nH(z))}, ${ans('0')}).`],
  }, z, 0, PT, `Yes: (${nH(z)}, 0).`, slips, `Look where the line meets the horizontal axis.`);
};
const zeroCount: Gen = (R, n) => {
  const kind = pick(R, ['const', 'const', 'zeroFn', 'prop', 'gen'] as const);
  const m = kind === 'const' || kind === 'zeroFn' ? 0 : (R() < 0.5 ? -1 : 1) * int(R, 1, 5);
  const b = kind === 'const' ? (R() < 0.5 ? -1 : 1) * int(R, 1, 8) : kind === 'gen' ? (R() < 0.5 ? -1 : 1) * int(R, 1, 8) * (m === 0 ? 1 : 1) : 0;
  const L: Lin = { m: q(m), b: q(b) }, z = zeroOf(L);
  const NONE = 'No zero', ONE = 'Exactly one zero', ALL = 'Every input is a zero';
  const right = z === 'none' ? NONE : z === 'all' ? ALL : ONE;
  const zx = typeof z === 'object' ? qNum(z) : 0;
  const pts: Pt2[] = [[0, b], [zx, 0], [2, 2 * m + b], [-2, -2 * m + b]];
  const yA = axisFor(pts.map(p => p[1]), { zero: true, max: 14, steps: [1, 2, 5] }), xA = fitAxis(pts.map(p => p[0]), 1, { zero: true });
  return choice(R, {
    id: `zeroCount-${n}`, family: 'zeroCount', board: `f(x) = ${exprT(L.m, L.b)}`, prompt: `How many zeros does f(${X}) = ${exprH(L.m, L.b)} have?`,
    picture: { g: { x: xA, y: yA, items: [{ kind: 'line', key: 'L', m, b }, ...(typeof z === 'object' ? [point('Z', [zx, 0], undefined, 'link')] : [])], show: ['axes', 'L'], solve: typeof z === 'object' ? ['Z'] : [] } },
    solution: z === 'none' ? [`Solve ${nH(b)} = 0: never true.`, 'The flat line never meets the x-axis: no zero.']
      : z === 'all' ? ['0 = 0 is true for every input.', 'The graph IS the x-axis: every input is a zero.']
        : [`Solve ${exprH(L.m, L.b)} = 0: one solution, ${X} = ${qP(z as Q)}.`, 'A slanted line crosses the x-axis exactly once.'],
  }, right, 'Yes.', [NONE, ONE, ALL].filter(t => t !== right).map(t => ({
    t, mc: t === ONE && m === 0 ? MC.oneZero : undefined,
    say: m === 0 ? (b === 0 ? 'The output is 0 for every input.' : `The output is always ${nH(b)}, never 0.`) : `A line with slope ${nH(m)} crosses the x-axis once${b === 0 ? ', here at the origin' : ''}.`,
  })), 3);
};
const solveZero: Gen = (R, n) => {
  const flat = R() < 0.12;
  const m = flat ? q(0) : pick(R, [q(int(R, 2, 6)), q(-int(R, 2, 6)), q(1, 2), q(-1, 2), q(2, 3), q(3, 4)]);
  const b = q((R() < 0.5 ? -1 : 1) * int(R, 1, 12));
  const L: Lin = { m, b }, z = zeroOf(L);
  const NONE = 'No zero';
  const sol = flat ? [`${exprH(m, b)} = 0 means ${nH(qNum(b))} = 0: impossible.`, 'So there is no zero, and no x-intercept.']
    : [`Set f(${X}) = 0: ${exprH(m, b)} = 0.`, `${qH(m)}${X} = ${qH(qNeg(b))}, so ${X} = ${qH(qNeg(b))} ÷ ${par(qNum(m))} = ${qP(z as Q)}.`];
  const zq = z as Q;
  const opts: Opt[] = flat ? [
    { t: '0', mc: MC.oneZero, say: `f(0) = ${nH(qNum(b))}, not 0. The output is ${nH(qNum(b))} for every input.` },
    { t: qH(b), mc: MC.swapIZ, say: `${nH(qNum(b))} is the output, the y-intercept. A zero needs output 0.` },
  ] : [
    { t: qH(qDiv(b, m)), mc: MC.noSignChange, say: `Moving ${qP(b)} to the other side changes its sign: ${qH(m)}${X} = ${qH(qNeg(b))}.` },
    { t: qH(b), mc: MC.swapIZ, say: `${qP(b)} is the y-intercept, the output at 0. The zero is the INPUT that gives output 0.` },
    { t: NONE, say: 'A slanted line always crosses the x-axis once.' },
    { t: qH(qDiv(m, qNeg(b))), mc: MC.inverted, say: `Divide −b by m, not the other way round.` },
  ];
  return choice(R, {
    id: `solveZero-${n}`, family: 'solveZero', board: `f(x) = ${exprT(m, b)}`, prompt: `Find the zero of f(${X}) = ${exprH(m, b)}.`,
    picture: { g: { x: axisFor([flat ? 0 : qNum(zq), 0, 3], { zero: true, max: 14, steps: [1, 2, 5] }), y: axisFor([qNum(b), 0, at(L, 3)], { zero: true, max: 14, steps: [1, 2, 5] }), items: [{ kind: 'line', key: 'L', m: qNum(m), b: qNum(b) }, ...(flat ? [] : [point('Z', [qNum(zq), 0], `(${qP(zq)}, 0)`, 'link')])], show: ['axes'], solve: ['L', ...(flat ? [] : ['Z'])] } },
    solution: sol,
  }, flat ? NONE : qH(zq), 'Yes.', opts);
};

// ---------- 11-14 bounds, domain, range ----------
const LT = '&lt;', LE = '≤';
const ineqH = (lo: number | null, loOpen: boolean, v: string, hi: number | null, hiOpen: boolean) =>
  lo !== null && hi !== null ? `${nH(lo)} ${loOpen ? LT : LE} ${v} ${hiOpen ? LT : LE} ${nH(hi)}`
    : lo !== null ? `${v} ${loOpen ? '&gt;' : '≥'} ${nH(lo)}` : `${v} ${hiOpen ? LT : LE} ${nH(hi!)}`;
const phraseToIneq: Gen = (R, n) => {
  const ctx = pick(R, [
    { v: '<i>h</i>', w: 'height', unit: 'inches', lo: [36, 54], hi: [60, 78], s: (a: string, b: string) => `A ride is open to riders ${a} and ${b} tall.` },
    { v: '<i>t</i>', w: 'time', unit: 'minutes', lo: [5, 15], hi: [30, 60], s: (a: string, b: string) => `The quiz can take ${a} and ${b}.` },
    { v: '<i>n</i>', w: 'guests', unit: 'guests', lo: [10, 20], hi: [40, 80], s: (a: string, b: string) => `The hall needs ${a} and allows ${b}.` },
  ]);
  const lo = int(R, ctx.lo[0]!, ctx.lo[1]!), hi = int(R, ctx.hi[0]!, ctx.hi[1]!);
  const loOpen = R() < 0.4, hiOpen = R() < 0.5;
  const loW = loOpen ? `more than ${lo} ${ctx.unit}` : `at least ${lo} ${ctx.unit}`;
  const hiW = hiOpen ? pick(R, [`fewer than ${hi}`, `less than ${hi}`]) + ` ${ctx.unit}` : pick(R, [`at most ${hi}`, `up to and including ${hi}`]) + ` ${ctx.unit}`;
  const lineV = R() < 0.4;
  const right = ineqH(lo, loOpen, ctx.v, hi, hiOpen);
  const npic = { min: Math.max(0, lo - (hi - lo > 40 ? 10 : 5)), max: hi + (hi - lo > 40 ? 10 : 5), step: hi - lo > 40 ? 10 : 5, name: ctx.w === ctx.unit ? ctx.w : `${ctx.w} (${ctx.unit})`, lo: { v: lo, open: loOpen }, hi: { v: hi, open: hiOpen }, given: lineV };
  // the window must start and end on a tick
  npic.min = Math.floor(npic.min / npic.step) * npic.step; npic.max = Math.ceil(npic.max / npic.step) * npic.step;
  const wrongs: Opt[] = lineV ? [
    { t: ineqH(lo, !loOpen, ctx.v, hi, !hiOpen), mc: MC.endStyle, say: 'A closed (filled) dot includes the end: ≤ or ≥. An open dot leaves it out: < or >.' },
    { t: ineqH(lo, !loOpen, ctx.v, hi, hiOpen), mc: MC.endStyle, say: `Look at the dot at ${lo}: ${loOpen ? 'open, so < (not included)' : 'filled, so ≤ (included)'}.` },
    { t: `${ctx.v} ≥ ${lo} and ${ctx.v} ≥ ${hi}`, mc: MC.between, say: `Between means at least the low end AND at most the high end.` },
  ] : [
    { t: ineqH(lo, !loOpen, ctx.v, hi, !hiOpen), mc: MC.strict, say: '"At least" and "at most" include the end (≤); "more than" and "fewer than" leave it out (<).' },
    { t: ineqH(lo, loOpen, ctx.v, hi, !hiOpen), mc: MC.strict, say: `"${hiW.split(' ').slice(0, -1).join(' ')}" ${hiOpen ? 'leaves the end out: <' : 'includes the end: ≤'}.` },
    { t: `${ctx.v} ≥ ${lo} and ${ctx.v} ≥ ${hi}`, mc: MC.between, say: 'Between two bounds: at least the low one AND at most the high one.' },
  ];
  return choice(R, {
    id: `phraseToIneq-${n}`, family: 'phraseToIneq', board: `${lo}\\ \\square\\ ${ctx.v.replace(/<\/?i>/g, '')}\\ \\square\\ ${hi}`,
    prompt: lineV ? `The number line shows the allowed ${ctx.w}. Which inequality says the same?` : `${ctx.s(loW, hiW)} Which inequality fits?`,
    picture: { n: npic },
    solution: [`Low end ${lo}: ${loOpen ? 'not included (<, open dot)' : 'included (≤, closed dot)'}. High end ${hi}: ${hiOpen ? 'not included (<, open dot)' : 'included (≤, closed dot)'}.`, `Both bounds in one chain, the variable in the middle.`],
  }, right, 'Yes.', wrongs);
};
const segText = (lo: number, loOpen: boolean, hi: number, hiOpen: boolean, v: string) => `${nH(lo)} ${loOpen ? LT : LE} ${v} ${hiOpen ? LT : LE} ${nH(hi)}`;
const domainGraph: Gen = (R, n) => {
  const kind = pick(R, ['seg', 'seg', 'all', 'list', 'builder'] as const);
  const m = (R() < 0.5 ? -1 : 1) * int(R, 1, 2), b = int(R, -3, 3);
  if (kind === 'list') {
    const x0 = int(R, -2, 1), k = int(R, 3, 5), xs = Array.from({ length: k }, (_, i) => x0 + i), ys = xs.map(x => m * x + b);
    const right = `{${xs.map(nH).join(', ')}}`;
    return choice(R, {
      id: `domainGraph-${n}`, family: 'domainGraph', board: '\\text{domain} = \\,?', prompt: 'The function is only these points. What is its domain?',
      picture: { g: { ...squareWin(xs, ys), equal: true, items: [{ kind: 'dots', key: 'D', m, b, xs }], show: ['axes', 'D'], solve: [] } },
      solution: ['The domain is the set of inputs: the x-coordinates of the points.', `Only these inputs, nothing between them: ${right}.`],
    }, right, 'Yes: only those inputs.', [
      { t: `${nH(x0)} ≤ ${X} ≤ ${nH(x0 + k - 1)}`, mc: MC.spans, say: `There are no points between the dots: ${nH(x0 + 0.5)} is not an input.` },
      { t: `{${[...ys].sort((a, c) => a - c).map(nH).join(', ')}}`, mc: MC.domRange, say: 'Those are the outputs (the range). The domain is the inputs.' },
      { t: 'all real numbers', mc: MC.cropped, say: 'Only the dots are the function: their x-coordinates.' },
    ]);
  }
  const lo = int(R, -4, 0), hi = lo + int(R, 3, 6);
  const ends: ['open' | 'closed', 'open' | 'closed'] = kind === 'all' ? ['closed', 'closed'] : pick(R, [['closed', 'closed'], ['closed', 'open'], ['open', 'closed'], ['open', 'open']] as const).slice() as ['open' | 'closed', 'open' | 'closed'];
  const f = (x: number) => m * x + b;
  const w = squareWin([lo - 2, hi + 2], [f(lo), f(hi)]);
  if (kind === 'all') {
    return choice(R, {
      id: `domainGraph-${n}`, family: 'domainGraph', board: `f(x) = ${exprT(q(m), q(b))}`, prompt: `Here is f(${X}) = ${exprH(q(m), q(b))}, with no restriction stated. What is its domain?`,
      picture: { g: { ...w, equal: true, items: [{ kind: 'line', key: 'L', m, b }], show: ['axes', 'L'], solve: [] } },
      solution: ['Any number can go into the rule: nothing restricts the input.', 'The window only shows part of the line; the line goes on.'],
    }, 'all real numbers', 'Yes.', [
      { t: `${nH(w.x.min)} ≤ ${X} ≤ ${nH(w.x.max)}`, mc: MC.cropped, say: 'That is just the window. The line continues past the edges.' },
      { t: `${X} ≥ 0`, say: `Negative inputs work too: f(−1) = ${nH(f(-1))}.` },
      { t: `${nH(w.y.min)} ≤ ${X} ≤ ${nH(w.y.max)}`, mc: MC.domRange, say: 'That is the vertical window, the outputs side. The domain is the inputs.' },
    ]);
  }
  const lO = ends[0] === 'open', hO = ends[1] === 'open';
  const right = kind === 'builder' ? `{${X} | ${segText(lo, lO, hi, hO, X)}}` : segText(lo, lO, hi, hO, X);
  const yl = Math.min(f(lo), f(hi)), yh = Math.max(f(lo), f(hi));
  return choice(R, {
    id: `domainGraph-${n}`, family: 'domainGraph', board: '\\text{domain} = \\,?', prompt: `The graph is this piece of a line, with its end dots. What is the domain?${kind === 'builder' ? ' (in set-builder form)' : ''}`,
    picture: { g: { ...w, equal: true, items: [{ kind: 'line', key: 'L', m, b, lo, hi, ends }], show: ['axes', 'L'], solve: [] } },
    solution: [`Inputs run from ${nH(lo)} (${lO ? 'open dot: not included' : 'closed dot: included'}) to ${nH(hi)} (${hO ? 'open: not included' : 'closed: included'}).`, `In symbols: ${segText(lo, lO, hi, hO, X)}.`],
  }, right, 'Yes.', [
    { t: `(${nH(lo)}, ${nH(f(lo))}) and (${nH(hi)}, ${nH(f(hi))})`, mc: MC.endPoints, say: 'Those are the two end points. The domain is every input between them, a set of numbers.' },
    { t: kind === 'builder' ? `{${X} | ${segText(yl, false, yh, false, X)}}` : segText(yl, false, yh, false, X), mc: MC.domRange, say: 'Those numbers are the outputs (heights). The domain reads the inputs, left to right.' },
    { t: kind === 'builder' ? `{${X} | ${segText(lo, !lO, hi, !hO, X)}}` : segText(lo, !lO, hi, !hO, X), mc: MC.endStyle, say: 'A filled dot is included (≤); an open dot is not (<).' },
  ]);
};
const contextDomain: Gen = (R, n) => {
  const discrete = R() < 0.5, draw = R() < 0.4;
  let prompt: string, right: string, wrongs: Opt[], sol: string[], items: GItem[], xA: GAxis, yA: GAxis, solve: string[];
  if (discrete) {
    const price = int(R, 3, 9), N = int(R, 5, 9), cash = price * N;
    const thing = pick(R, ['tickets', 'notebooks', 'tacos', 'game passes']);
    prompt = `${thing[0]!.toUpperCase() + thing.slice(1)} cost $${price} each, and you have $${cash}. C(<i>n</i>) = ${price}<i>n</i> is the cost of <i>n</i> ${thing}. ` + (draw ? 'How should the graph of C be drawn?' : 'What is the domain in this situation?');
    right = draw ? `Dots at <i>n</i> = 0, 1, 2, …, ${N}` : `{0, 1, 2, …, ${N}}`;
    wrongs = draw ? [
      { t: `A solid segment from <i>n</i> = 0 to ${N}`, mc: MC.fractions, say: `You cannot buy 2.5 ${thing}: only whole numbers, so separate dots.` },
      { t: 'A whole line, with arrows both ways', mc: MC.allReals, say: `Negative ${thing} and more than ${N} are not possible here.` },
    ] : [
      { t: `0 ≤ <i>n</i> ≤ ${N}`, mc: MC.fractions, say: `That allows 2.5 ${thing}. A count takes whole numbers only.` },
      { t: 'all real numbers', mc: MC.allReals, say: `The formula takes any number, but you cannot buy −3 or ${N + 4} ${thing} with $${cash}.` },
      { t: `0 ≤ <i>n</i> ≤ ${cash}`, mc: MC.domRange, say: `${cash} is dollars, an output. The input is the number of ${thing}.` },
    ];
    sol = [`<i>n</i> counts ${thing}: whole numbers only, from 0 (buy none) up to $${cash} ÷ $${price} = ${N}.`, 'Drawn as separate dots, one for each whole number.'];
    xA = { min: 0, max: N + 1, step: 1, name: thing }; yA = axisFor([0, cash], { zero: true, max: 10, name: 'cost ($)', steps: [5, 10, 20, 25, 50], min: 0 });
    items = [{ kind: 'dots', key: 'D', m: price, b: 0, xs: Array.from({ length: N + 1 }, (_, i) => i) }]; solve = ['D'];
  } else {
    const cap = pick(R, [40, 60, 30, 50, 80]), rate = pick(R, [2, 4, 5, 10].filter(r => cap % r === 0)), T = cap / rate;
    prompt = `An empty ${cap}-gallon tank fills at ${rate} gallons per minute until it is full. V(<i>t</i>) = ${rate}<i>t</i>. ` + (draw ? 'How should the graph of V be drawn?' : 'What is the domain in this situation?');
    right = draw ? `A solid segment from <i>t</i> = 0 to ${T}` : `0 ≤ <i>t</i> ≤ ${T}`;
    wrongs = draw ? [
      { t: `Dots at <i>t</i> = 0, 1, 2, …, ${T}`, say: 'Time flows: 2.5 minutes is a real moment, so the graph is solid.' },
      { t: 'A whole line, with arrows both ways', mc: MC.allReals, say: `The filling starts at 0 and stops at ${T} minutes, when the tank is full.` },
      { t: `A ray from <i>t</i> = 0 that keeps going past ${T}`, mc: MC.beyond, say: `After ${T} minutes the tank is full: the model stops there, so the graph ends with a closed dot.` },
    ] : [
      { t: 'all real numbers', mc: MC.allReals, say: `Before 0 nothing fills, and after ${T} minutes the tank is full.` },
      { t: `0 ≤ <i>t</i> ≤ ${cap}`, mc: MC.domRange, say: `${cap} is gallons, an output. The tank is full at ${cap} ÷ ${rate} = ${T} minutes.` },
      { t: `{0, 1, 2, …, ${T}}`, say: 'Time is not only whole minutes: every moment from 0 to the end counts.' },
    ];
    sol = [`Time runs from 0 (empty) to full: ${cap} ÷ ${rate} = ${T} minutes, and every moment between counts.`, `Domain 0 ≤ <i>t</i> ≤ ${T}, drawn as a solid segment.`];
    xA = axisFor([0, T], { zero: true, max: 12, name: 'minutes', steps: [1, 2, 5], min: 0 }); yA = axisFor([0, cap], { zero: true, max: 10, name: 'gallons', steps: [5, 10, 20], min: 0 });
    items = [{ kind: 'line', key: 'L', m: rate, b: 0, lo: 0, hi: T, ends: ['closed', 'closed'] }]; solve = ['L'];
  }
  return choice(R, {
    id: `contextDomain-${n}`, family: 'contextDomain', board: '\\text{domain} = \\,?', prompt, solution: sol,
    picture: { g: { x: xA, y: yA, items, show: ['axes'], solve } },
  }, right, 'Yes.', wrongs);
};
const rangeInterval: Gen = (R, n) => {
  const kind = pick(R, ['seg', 'seg', 'seg', 'list', 'const'] as const);
  const m = pick(R, [-3, -2, -1, 1, 2, 3, -2]), b = int(R, 2, 10);
  const f = (x: number) => m * x + b;
  if (kind === 'list') {
    const xs = [0, 1, 2, 3, 4].slice(0, int(R, 3, 5)), ys = xs.map(f), sorted = [...ys].sort((a, c) => a - c);
    return choice(R, {
      id: `rangeInterval-${n}`, family: 'rangeInterval', board: `f(x) = ${exprT(q(m), q(b))}`,
      prompt: `f(${X}) = ${exprH(q(m), q(b))} with domain {${xs.join(', ')}}. What is the range?`,
      picture: { g: { ...squareWin(xs, ys), equal: true, items: [{ kind: 'dots', key: 'D', m, b, xs }], show: ['axes'], solve: ['D'] } },
      solution: [`Put in each input: ${xs.map(x => `f(${x}) = ${nH(f(x))}`).join(', ')}.`, `The range is the list of outputs: {${sorted.map(nH).join(', ')}}.`],
    }, `{${sorted.map(nH).join(', ')}}`, 'Yes: just those outputs.', [
      { t: `${nH(sorted[0]!)} ≤ <i>y</i> ≤ ${nH(sorted[sorted.length - 1]!)}`, mc: MC.spans, say: 'Only these inputs exist, so only their outputs: no values in between.' },
      { t: `{${xs.join(', ')}}`, mc: MC.copyDomain, say: 'That is the domain. The range is what comes OUT.' },
      { t: 'all real numbers', mc: MC.rangeAll, say: 'With only a few inputs there are only a few outputs.' },
    ]);
  }
  if (kind === 'const') {
    const c = int(R, -6, 6) || 4;
    return choice(R, {
      id: `rangeInterval-${n}`, family: 'rangeInterval', board: `f(x) = ${nT(c)}`, prompt: `f(${X}) = ${nH(c)} for all real ${X}. What is the range?`,
      picture: { g: { ...squareWin([-3, 3], [c, 0]), equal: true, items: [{ kind: 'line', key: 'L', m: 0, b: c }], show: ['axes', 'L'], solve: [] } },
      solution: [`Every input gives the output ${nH(c)}.`, `So the range is the single value {${nH(c)}}.`],
    }, `{${nH(c)}}`, 'Yes.', [
      { t: 'all real numbers', mc: MC.rangeAll, say: `The domain is all real numbers; the outputs are all ${nH(c)}.` },
      { t: `<i>y</i> ≥ ${nH(c)}`, say: `No output is bigger than ${nH(c)}: they all equal ${nH(c)}.` },
      { t: 'no range: it is not a function', mc: MC.constNotFn, say: 'A constant rule gives each input one output: it is a function.' },
    ]);
  }
  const lo = 0, hi = int(R, 2, 5);
  const ends = pick(R, [['open', 'closed'], ['closed', 'open'], ['closed', 'closed']] as const);
  const lO = ends[0] === 'open', hO = ends[1] === 'open';
  const yLo = m > 0 ? f(lo) : f(hi), yHi = m > 0 ? f(hi) : f(lo), yLoO = m > 0 ? lO : hO, yHiO = m > 0 ? hO : lO;
  const right = segText(yLo, yLoO, yHi, yHiO, Yv);
  const w = squareWin([lo, hi], [f(lo), f(hi)]);
  return choice(R, {
    id: `rangeInterval-${n}`, family: 'rangeInterval', board: `f(x) = ${exprT(q(m), q(b))}`,
    prompt: `f(${X}) = ${exprH(q(m), q(b))} on ${segText(lo, lO, hi, hO, X)}. What is the range?`,
    picture: { g: { ...w, equal: true, items: [{ kind: 'line', key: 'L', m, b, lo, hi, ends: [ends[0], ends[1]] }, { kind: 'seg', key: 'Rg', a: [w.x.min === 0 ? 0 : 0, yLo], b: [0, yHi], col: 'second', w: 10 }], show: ['axes', 'L'], solve: ['Rg'] } },
    solution: [`Ends: f(${lo}) = ${nH(f(lo))} (${lO ? 'not included' : 'included'}), f(${hi}) = ${nH(f(hi))} (${hO ? 'not included' : 'included'}).`, `${m < 0 ? 'The slope is negative, so the order flips: ' : ''}smallest to largest, ${segText(yLo, yLoO, yHi, yHiO, Yv)}.`],
  }, right, 'Yes.', [
    { t: segText(lo, lO, hi, hO, Yv), mc: MC.copyDomain, say: 'That is the domain with a y. Put the end inputs into f.' },
    { t: m < 0 ? `${nH(f(lo))} ${lO ? LT : LE} ${Yv} ${hO ? LT : LE} ${nH(f(hi))}` : segText(yLo, !yLoO, yHi, !yHiO, Yv), mc: m < 0 ? MC.reversed : MC.endStyle, say: m < 0 ? 'Write the smaller output first: with a negative slope the left end is the top.' : 'An included input gives an included output, and an open end stays open.' },
    { t: 'all real numbers', mc: MC.rangeAll, say: 'Only the piece is drawn: its outputs run between the two end heights.' },
    { t: segText(w.y.min, false, w.y.max, false, Yv), mc: MC.window, say: 'That is the window, not the outputs of the piece.' },
  ]);
};

// ---------- 15 feature discrimination ----------
const mixedFeature: Gen = (R, n) => {
  for (;;) {
    const m = (R() < 0.5 ? -1 : 1) * pick(R, [1, 2, 3, 4, 5]), z = (R() < 0.5 ? -1 : 1) * int(R, 1, 5), b = -m * z;
    if (new Set([m, z, b]).size < 3) continue;
    const ask = pick(R, ['slope', 'b', 'zero'] as const);
    const v = ask === 'slope' ? m : ask === 'b' ? b : z;
    const Q_ = ask === 'slope' ? 'What is the slope?' : ask === 'b' ? 'What is the y-intercept? (Its y-value.)' : 'What is the zero? (The input.)';
    const slips: NumSlip[] = [];
    if (ask === 'zero') slips.push({ v: b, mc: MC.swapIZ, say: `${nH(b)} is where it crosses the y-axis. The zero is the input with output 0.` });
    if (ask === 'b') slips.push({ v: z, mc: MC.swapIZ, say: `${nH(z)} is the zero (on the x-axis). The y-intercept is the output at input 0.` });
    if (ask === 'slope') slips.push({ v: b, mc: MC.asHeight, say: 'That is a height. Slope is the change in y per 1 of x.' });
    const table = R() < 0.45;
    if (table) {
      const x0 = Math.min(0, z) - int(R, 0, 2), xs = Array.from({ length: Math.max(Math.abs(z), 0) + 2 > 6 ? 6 : 5 }, (_, i) => x0 + i);
      if (!xs.includes(0) || !xs.includes(z)) continue;
      const ys = xs.map(x => m * x + b);
      if (ask === 'b' && xs[0] !== 0) slips.push({ v: ys[0]!, mc: MC.firstOut, say: `That is the first row (${X} = ${xs[0]}). The y-intercept is the row with ${X} = 0.` });
      return numItem({
        id: `mixedFeature-${n}`, family: 'mixedFeature', board: rowT(xs[0]!, ys[0]!), prompt: Q_,
        picture: { t: { xName: 'x', yName: 'y', xs, ys: ys.map(nH), diffs: ask === 'slope', ring: ask === 'b' ? [xs.indexOf(0)] : ask === 'zero' ? [xs.indexOf(z)] : [] } },
        solution: [ask === 'slope' ? `Each step of 1 in ${X} changes ${Yv} by ${nH(m)}.` : ask === 'b' ? `The y-intercept is the output at ${X} = 0.` : `The zero is the input where the output is 0.`, `So: ${ans(nH(v))}.`],
      }, v, 'Yes.', slips, 'Find the feature that question names: slope = change per 1, y-intercept = output at 0, zero = input with output 0.');
    }
    const sy = pick(R, [1, 2, 5]), sx = Math.abs(z) > 4 ? 2 : 1;
    const yA = axisFor([b, 0, m * (z + 2) + b, m * (z - 2) + b], { zero: true, max: 14, steps: [sy, sy * 2, sy * 5] }), xA = fitAxis([z, 0, z + 2, z - 2], sx, { zero: true });
    if ((xA.max - xA.min) / xA.step > 14 || b % yA.step !== 0) continue;
    return numItem({
      id: `mixedFeature-${n}`, family: 'mixedFeature', board: `f(${nT(z + 2)}) = ${nT(2 * m)}`, prompt: `${Q_} Mind the scales.`,
      picture: { g: { x: xA, y: yA, items: [{ kind: 'line', key: 'L', m, b }, point('Y', [0, b], undefined, ask === 'b' ? 'link' : 'first'), point('Z', [z, 0], undefined, ask === 'zero' ? 'link' : 'first'), ...riseRun('t', [z, 0], [z + 1, m], sx, yA.step, '1', nH(m))], show: ['axes', 'L', 'Y', 'Z'], solve: ask === 'slope' ? ['trun', 'trise', 'triseT'] : [] } },
      solution: [ask === 'slope' ? `From the zero (${nH(z)}, 0) to the y-intercept (0, ${nH(b)}): rise ${nH(b)} over run ${nH(-z)}.` : ask === 'b' ? `The line crosses the y-axis at (0, ${nH(b)}).` : `The line crosses the x-axis at (${nH(z)}, 0).`, `So: ${ans(nH(v))}.`],
    }, v, 'Yes.', slips, 'Slope = change per 1; y-intercept = output at input 0; zero = input with output 0.');
  }
};

// ---------- 16-21 building equations ----------
const buildMB: Gen = (R, n) => {
  const kind = pick(R, ['gen', 'gen', 'point', 'm0', 'b0'] as const);
  const m = kind === 'm0' ? q(0) : slopeQ(R, { frac: R() < 0.3, maxInt: 6 }), b = kind === 'b0' ? q(0) : q((R() < 0.5 ? -1 : 1) * int(R, 1, 9));
  const given = kind === 'point' ? `the y-intercept is the point (0, ${qH(b)})` : `the y-intercept is ${qH(b)}`;
  const opts: Opt[] = [];
  if (!qEq(m, b)) opts.push({ t: siH(b, m), mc: MC.swapMB, say: `The slope multiplies ${X}: ${qP(m)}${X}. The y-intercept is added on.` });
  if (m.p !== 0) opts.push({ t: siH(qNeg(m), b), mc: MC.dropsSign, say: `The slope is ${qP(m)}: keep its sign.` });
  if (b.p !== 0 && m.p !== 0 && !qEq(m, q(-1))) opts.push({ t: psH(m, b, q(0)), mc: MC.swapIZ, say: `That line crosses the x-axis at ${qP(b)}. The y-intercept is on the y-axis: (0, ${qP(b)}).` });
  if (b.p !== 0) opts.push({ t: siH(m, qNeg(b)), mc: MC.signDrop, say: `b = ${qP(b)}: keep its sign.` });
  if (m.p === 0) opts.push({ t: `${X} = ${qH(b)}`, mc: MC.vhSwap, say: `Slope 0 is a flat line: ${Yv} stays ${qP(b)}.` });
  return choice(R, {
    id: `buildMB-${n}`, family: 'buildMB', board: 'y = mx + b', prompt: `The slope is ${qH(m)} and ${given}. Which equation is the line?`,
    picture: { g: gUnit(qNum(m), qNum(b), [[0, qNum(b)], [m.q, qNum(b) + m.p]], [point('Y', [0, qNum(b)], undefined, 'link')], ['axes'], ['L', 'Y']) },
    solution: [`In ${Yv} = m${X} + b, m is the slope and b the y-intercept.`, `m = ${qP(m)}, b = ${qP(b)}.`],
  }, siH(m, b), 'Yes.', opts);
};
const bFromPoint: Gen = (R, n) => {
  const frac = R() < 0.35;
  const m = frac ? q((R() < 0.5 ? -1 : 1) * pick(R, [1, 3, 5]), 2) : q((R() < 0.5 ? -1 : 1) * int(R, 1, 5));
  const x1 = (frac ? 2 : 1) * ((R() < 0.5 ? -1 : 1) * int(R, 1, frac ? 3 : 5)), y1 = int(R, -7, 9);
  const b = y1 - qNum(m) * x1;
  return numItem({
    id: `bFromPoint-${n}`, family: 'bFromPoint', board: `y = ${qT(m)}x + b`, picture: { g: gUnit(qNum(m), b, [[x1, y1], [0, b]], [point('P', [x1, y1], pt([x1, y1])), point('Y', [0, b], `(0, ${nH(b)})`, 'link')], ['P'], ['L', 'Y']), tex: [`${nT(y1)} = ${qT(m)}\\cdot ${parT(x1)} + b`, `b = ${nT(b)}`] },
    prompt: `A line has slope ${qH(m)} and passes through ${pt([x1, y1])}. In ${Yv} = ${qH(m)}${X} + b, what is b?`,
    solution: [`Put the point in: ${nH(y1)} = ${qP(m)} · ${par(x1)} + b, so ${nH(y1)} = ${nH(qNum(m) * x1)} + b.`, `b = ${nH(y1)} − ${par(qNum(m) * x1)} = ${ans(nH(b))}. Check: ${qP(m)} · ${par(x1)} + ${par(b)} = ${nH(y1)}.`],
  }, b, `Yes: b = ${nH(b)}.`, [
    { v: y1, mc: MC.firstOut, say: `${nH(y1)} is the output at ${X} = ${nH(x1)}, not at 0. Substitute the point and solve for b.` },
    { v: y1 + qNum(m) * x1, mc: MC.noSignChange, say: `Moving ${nH(qNum(m) * x1)} to the other side changes its sign.` },
  ], 'Substitute the point into y = mx + b and solve for b.');
};
const writePS: Gen = (R, n, sg) => {
  const m = slopeQ(R, { frac: true, maxInt: 5 });
  const x1 = (R() < 0.5 ? -1 : 1) * int(R, 1, 6), y1 = (R() < 0.5 ? -1 : 1) * int(R, 1, 7);
  const two = sg === 'point-slope-form' && R() < 0.5;
  const x2 = x1 + m.q * (R() < 0.5 ? 1 : 2), p2: Pt2 = [x2, y1 + qNum(m) * (x2 - x1)];
  const given = two ? `the line through ${pt([x1, y1])} and ${pt(p2)}` : `the line with slope ${qH(m)} through ${pt([x1, y1])}`;
  const opts: Opt[] = [
    { t: psH(m, q(-x1), q(-y1)), mc: MC.wrongSign, say: `In ${Yv} − ${Yv}₁ the sign flips: through ${pt([x1, y1])} you write ${Yv} ${y1 < 0 ? '+' : '−'} ${Math.abs(y1)} and ${X} ${x1 < 0 ? '+' : '−'} ${Math.abs(x1)}.` },
    { t: `${nH(y1)} − ${Yv}₁ = ${qIs1(m)}(${nH(x1)} − ${X}₁)`, mc: MC.slots, say: `The point goes into the slots ${X}₁ and ${Yv}₁; ${X} and ${Yv} stay letters for every point of the line.` },
  ];
  const onL = (P: Pt2) => Math.abs(qNum(m) * (P[0] - x1) - (P[1] - y1)) < 1e-9;
  if (onL([-x1, -y1])) opts.shift();
  if (x1 !== y1 && !onL([y1, x1])) opts.push({ t: psH(m, q(y1), q(x1)), mc: MC.mixes, say: `Keep the point together: ${X}₁ = ${nH(x1)} goes with ${X}, ${Yv}₁ = ${nH(y1)} with ${Yv}.` });
  return choice(R, {
    id: `writePS-${n}`, family: 'writePS', board: 'y - y_1 = m(x - x_1)', prompt: `Write ${given} in point-slope form.`,
    picture: { g: gUnit(qNum(m), qNum(qSub(toQ(y1), qMul(m, toQ(x1)))), [[x1, y1], ...(two ? [p2] : [])], [point('P', [x1, y1], pt([x1, y1])), ...(two ? [point('Q', p2, pt(p2))] : [])], ['P', ...(two ? ['Q'] : [])], ['L']) },
    solution: [two ? `Slope first: (${nH(p2[1])} − ${par(y1)}) ÷ (${nH(p2[0])} − ${par(x1)}) = ${qP(m)}.` : `m = ${qP(m)}, (${X}₁, ${Yv}₁) = ${pt([x1, y1])}.`, `${Yv} − ${par(y1)} = ${qP(m)}(${X} − ${par(x1)}), tidied up.`],
  }, psH(m, q(x1), q(y1)), 'Yes.', opts);
};
/** B·y with a real minus and no 1 */
const byH = (B: number) => (B === 1 ? Yv : B === -1 ? '−' + Yv : nH(B) + Yv);
const qIs1 = (m: Q) => (m.p === m.q ? '' : m.p === -m.q ? '−' : qH(m));
const eqTwoPoints: Gen = (R, n) => {
  const kind = pick(R, ['gen', 'gen', 'yint', 'flat'] as const);
  const m = kind === 'flat' ? q(0) : pick(R, [q(int(R, 1, 4)), q(-int(R, 1, 4)), q(1, 2), q(-1, 2), q(3, 2)]);
  const b = int(R, -6, 6);
  const L: Lin = { m, b: q(b) };
  const xa = kind === 'yint' ? 0 : (m.q === 2 ? 2 : 1) * int(R, -3, -1), xb = xa + (m.q === 2 ? 2 : 1) * int(R, 1, 3) + (kind === 'yint' ? 0 : 1) * (m.q === 2 ? 2 : 1);
  const A: Pt2 = [xa, at(L, xa)], Bp: Pt2 = [xb, at(L, xb)];
  const [P, Qp] = R() < 0.5 ? [A, Bp] : [Bp, A];
  const mv = qNum(m);
  const slips: PairSlip[] = [];
  if (P[0] !== 0) slips.push({ x: mv, y: P[1], mc: MC.firstOut, say: `${nH(P[1])} is the output at ${X} = ${nH(P[0])}, not at 0. Solve for b.` });
  slips.push({ x: mv, y: Qp[1] - mv * P[0], mc: MC.mixes, say: `Use one whole point for b: its ${X} and its own ${Yv}.` });
  if (mv !== 0) slips.push({ x: -mv, y: P[1] + mv * P[0], mc: MC.order, say: 'Subtract in the same order on top and bottom.' });
  return pairItem({
    id: `eqTwoPoints-${n}`, family: 'eqTwoPoints', board: 'y = mx + b', prompt: `Write the line through ${pt(P)} and ${pt(Qp)} as ${Yv} = m${X} + b.`,
    picture: { g: gUnit(mv, b, [P, Qp, [0, b]], [point('A', P, pt(P)), point('B', Qp, pt(Qp)), point('Y', [0, b], `(0, ${nH(b)})`, 'link')], ['A', 'B'], ['L', 'Y']) },
    solution: [`m = (${nH(Qp[1])} − ${par(P[1])}) ÷ (${nH(Qp[0])} − ${par(P[0])}) = ${nH(mv)}.`, `${nH(P[1])} = ${nH(mv)} · ${par(P[0])} + b, so b = ${nH(b)}: m = ${ans(nH(mv))}, b = ${ans(nH(b))}. Both points check.`],
  }, mv, b, MB, `Yes: ${siH(m, q(b))}.`, slips, 'Slope first (change over change), then put one point in to find b.');
};
const STORY2 = [
  { what: 'A car trip', x: 'hours', y: 'miles left', yu: 'miles', per: 'miles per hour', rate: [-70, -40], y0: [200, 480], xs: [1, 2, 3, 4, 5] },
  { what: 'A phone plan', x: 'months', y: 'total paid ($)', yu: 'dollars', per: 'dollars per month', rate: [15, 45], y0: [20, 90], xs: [2, 3, 4, 5, 6] },
  { what: 'A pool being filled', x: 'minutes', y: 'gallons', yu: 'gallons', per: 'gallons per minute', rate: [8, 25], y0: [30, 200], xs: [2, 4, 5, 6, 10] },
  { what: 'A melting ice block', x: 'hours', y: 'pounds', yu: 'pounds', per: 'pounds per hour', rate: [-6, -2], y0: [50, 90], xs: [1, 2, 3, 4, 5] },
] as const;
const twoPointsStory: Gen = (R, n, sg) => {
  const S = pick(R, STORY2), r = int(R, S.rate[0], S.rate[1]), y0 = int(R, S.y0[0], S.y0[1]) - (int(R, S.y0[0], S.y0[1]) % 5);
  const [x1, x2] = shuffle(R, S.xs.slice()).slice(0, 2).sort((a, c) => a - c) as [number, number];
  if (y0 + r * x2 < 0) return twoPointsStory(R, n, sg);
  const y1 = y0 + r * x1, y2 = y0 + r * x2;
  const askRate = sg === 'interpret-slope-units' || (sg !== 'build-from-verbal' && R() < 0.4);
  const xA = fitAxis([0, x2], 1, { zero: true, name: S.x, min: 0 }), yA = axisFor([0, y0, y1, y2], { zero: true, max: 10, name: S.y, steps: [5, 10, 20, 25, 50, 100], min: 0 });
  const g: GPic = { x: xA, y: yA, items: [{ kind: 'line', key: 'L', m: r, b: y0, lo: 0 }, point('A', [x1, y1], `(${x1}, ${y1})`), point('B', [x2, y2], `(${x2}, ${y2})`), point('Y', [0, y0], undefined, 'link')], show: ['axes', 'A', 'B'], solve: ['L', 'Y'] };
  const story = `${S.what}: after ${x1} ${S.x} the ${S.y.replace(' ($)', '')} is ${y1}; after ${x2} ${S.x} it is ${y2}.`;
  const sol = [`Rate = (${y2} − ${y1}) ÷ (${x2} − ${x1}) = ${nH(r)} ${S.per}.`, `Start: ${y1} − (${nH(r)}) · ${x1} = ${y0} ${S.yu} at 0 ${S.x}.`];
  if (askRate) return numItem({
    id: `twoPointsStory-${n}`, family: 'twoPointsStory', board: 'm = \\frac{\\Delta y}{\\Delta x}', unit: S.per, picture: { g },
    prompt: `${story} What is the rate of change? (Negative if it goes down.)`, solution: [`Change in output: ${y2} − ${y1} = ${nH(y2 - y1)}. Change in input: ${x2} − ${x1} = ${x2 - x1} ${S.x}.`, `Rate = ${nH(y2 - y1)} ÷ ${x2 - x1} = ${ans(nH(r))} ${S.per}.`],
  }, r, `Yes: ${nH(r)} ${S.per}.`, [
    { v: -r, mc: MC.dropsSign, say: `The amount goes ${r < 0 ? 'down' : 'up'}: the rate is ${r < 0 ? 'negative' : 'positive'}.` },
    { v: y2 - y1, mc: MC.ignoresStep, say: `That is the change over ${x2 - x1} ${S.x}. Per 1: divide by ${x2 - x1}.` },
  ], 'Change in output ÷ change in input.');
  return numItem({
    id: `twoPointsStory-${n}`, family: 'twoPointsStory', board: 'y = mx + b', unit: S.yu, picture: { g },
    prompt: `${story} The change is linear. What was it at 0 ${S.x}?`, solution: [sol[0]!, sol[1]!.replace(`${y0} ${S.yu}`, `${ans(String(y0))} ${S.yu}`)],
  }, y0, `Yes: ${y0} ${S.yu}.`, [
    { v: y1, mc: MC.firstOut, say: `${y1} is after ${x1} ${S.x}. Walk back to 0 with the rate.` },
    { v: y1 + r * x1, mc: MC.dropsSign, say: `Walking back undoes the change: ${r < 0 ? 'add' : 'take away'} ${Math.abs(r)} per ${S.x.replace(/s$/, '')}.` },
  ], 'Find the rate, then walk back from a data point to 0.');
};
const tableRule: Gen = (R, n) => {
  const kind = pick(R, ['from0', 'step3', 'uneven', 'reordered', 'noZero'] as const);
  const m = (R() < 0.5 ? -1 : 1) * int(R, 1, 5), b = int(R, -8, 9);
  let xs: number[];
  switch (kind) {
    case 'from0': xs = [0, 1, 2, 3, 4]; break;
    case 'step3': { const s = pick(R, [2, 3]); xs = [s, s + 3, s + 6, s + 9]; break; }
    case 'uneven': xs = [1, 2, 4, 7]; break;
    case 'reordered': xs = shuffle(R, [-1, 0, 1, 2, 3]); break;
    default: xs = [2, 4, 6, 8].map(x => x + int(R, -1, 0));
  }
  const ys = xs.map(x => m * x + b);
  const i1 = 0, i2 = 1, dx = xs[i2]! - xs[i1]!, dy = ys[i2]! - ys[i1]!;
  const slips: PairSlip[] = [];
  if (dx !== 1) slips.push({ x: dy, y: ys[0]! - dy * xs[0]!, mc: MC.ignoresStep, say: `${nH(dy)} is the change for a step of ${dx}. Per 1: ${nH(dy)} ÷ ${dx}.` });
  if (xs[0] !== 0) slips.push({ x: m, y: ys[0]!, mc: MC.firstOut, say: `${nH(ys[0]!)} is the output at ${X} = ${xs[0]}, not at 0.` });
  return pairItem({
    id: `tableRule-${n}`, family: 'tableRule', board: rowT(xs[0]!, ys[0]!, 'y'), prompt: `Find the linear rule for this table (inputs ${xs.map(nH).join(', ')}), and make sure it fits every row.`,
    picture: { t: { xName: 'x', yName: 'y', xs, ys: ys.map(nH), diffs: kind !== 'reordered' } },
    solution: [`Two rows: Δ${Yv} ÷ Δ${X} = ${nH(dy)} ÷ ${nH(dx)} = ${nH(m)}.`, `${nH(ys[0]!)} = ${nH(m)} · ${par(xs[0]!)} + b gives b = ${nH(b)}. Every row checks: m = ${ans(nH(m))}, b = ${ans(nH(b))}.`],
  }, m, b, MB, `Yes, and it fits every row.`, slips, 'Slope from two rows (change over change), then b from one row; check the rest.');
};
const tableCheck: Gen = (R, n) => {
  const m = (R() < 0.5 ? -1 : 1) * int(R, 1, 5), b = int(R, -6, 9), x0 = int(R, 0, 2), step = pick(R, [1, 2]);
  const xs = Array.from({ length: 5 }, (_, i) => x0 + i * step);
  const ys = xs.map(x => m * x + b);
  const bad = R() < 0.55, k = int(R, 2, 4);
  if (bad) ys[k] = ys[k]! + (R() < 0.5 ? -1 : 1) * int(R, 1, 3);
  const rule = siH(q(m), q(b));
  const right = bad ? `No: at ${X} = ${xs[k]} the rule gives ${nH(m * xs[k]! + b)}, not ${nH(ys[k]!)}` : 'Yes: it fits every row';
  return choice(R, {
    id: `tableCheck-${n}`, family: 'tableCheck', board: rule.replace(/<\/?i>/g, '').replace(/−/g, '-'),
    prompt: `Lee builds ${rule} from the first two rows. Does it describe the whole table?`,
    picture: { t: { xName: 'x', yName: 'y', xs, ys: ys.map(nH), ring: bad ? [k] : [] } },
    solution: [`Test every row in ${rule}: ${xs.map((x, i) => `${X} = ${x} → ${nH(m * x + b)}${m * x + b === ys[i] ? ' ✓' : ` (table: ${nH(ys[i]!)}) ✗`}`).join(', ')}.`, bad ? 'One row breaks it, and no single line fits every row.' : 'Every row fits.'],
  }, right, 'Yes: a rule must fit every row.', [
    { t: 'Yes: two rows are enough to check a rule', mc: MC.rowsOnly, say: 'Any two rows fit some line. The test is the OTHER rows.' },
    bad ? { t: 'Yes: it fits every row', mc: MC.rowsOnly, say: `Check the row ${X} = ${xs[k]}: the rule gives ${nH(m * xs[k]! + b)}.` }
      : { t: `No: the table has no row with ${X} = 0, so there is no rule`, say: 'A rule does not need x = 0 in the table; b can be found from any row.' },
  ], 3);
};
/** a line through two lattice points of a scaled grid, with an integer b; window may leave out x = 0 */
function scaledLine(R: () => number): { sx: number; sy: number; A: Pt2; B: Pt2; m: number; b: number; xA: GAxis; yA: GAxis } {
  for (;;) {
    const sx = pick(R, [1, 2, 5]), sy = pick(R, [2, 5, 10]);
    const a = int(R, 1, 3), c = (R() < 0.35 ? -1 : 1) * int(R, 1, 4);
    const m = (c * sy) / (a * sx);
    if (Math.abs(m * 100 - Math.round(m * 100)) > 1e-9) continue;
    const xmin = R() < 0.5 ? 0 : sx * int(R, 1, 3), i0 = int(R, 1, 3);
    const A: Pt2 = [xmin + i0 * sx, sy * int(R, c > 0 ? 1 : 5, c > 0 ? 3 : 7)], Bp: Pt2 = [A[0] + a * sx, A[1] + c * sy];
    const b = A[1] - m * A[0];
    if (!Number.isInteger(b) || Math.abs(b) > 60) continue;
    const xA: GAxis = { min: xmin, max: xmin + 10 * sx, step: sx, name: 'x' }, yA: GAxis = { min: 0, max: 10 * sy, step: sy, name: 'y' };
    if (Bp[1] <= 0 || Bp[1] >= yA.max || A[1] >= yA.max) continue;
    return { sx, sy, A, B: Bp, m, b, xA, yA };
  }
}
const graphRule: Gen = (R, n) => {
  const { sx, sy, A, B: Bp, m, b, xA, yA } = scaledLine(R);
  const slips: PairSlip[] = [{ x: (Bp[1] - A[1]) / sy / ((Bp[0] - A[0]) / sx), y: b, mc: MC.interval, say: `Count values, not squares: one square is ${nH(sx)} across and ${nH(sy)} up.` }];
  if (xA.min !== 0) slips.push({ x: m, y: m * xA.min + b, mc: MC.edge, say: `The left edge is ${X} = ${xA.min}, not the y-axis. Find b by working back to ${X} = 0.` });
  return pairItem({
    id: `graphRule-${n}`, family: 'graphRule', board: 'y = mx + b', prompt: `Point A is at ${pt(A)}. Read point B with the scales, then write the equation of the line.${xA.min !== 0 ? ' (The y-axis is off the picture.)' : ''}`,
    picture: { g: { x: xA, y: yA, items: [{ kind: 'line', key: 'L', m, b }, point('A', A, 'A'), point('B', Bp, 'B'), ...riseRun('t', A, Bp, sx, sy, `run ${nH(Bp[0] - A[0])}`, `rise ${nH(Bp[1] - A[1])}`)], show: ['axes', 'L', 'A', 'B'], solve: ['trun', 'trise', 'trunT', 'triseT'] } },
    solution: [`The points read ${pt(A)} and ${pt(Bp)}: m = ${nH(Bp[1] - A[1])} ÷ ${nH(Bp[0] - A[0])} = ${nH(m)}.`, `${nH(A[1])} = ${nH(m)} · ${nH(A[0])} + b, so b = ${nH(b)}: m = ${ans(nH(m))}, b = ${ans(nH(b))}.`],
  }, m, b, MB, 'Yes.', slips, 'Read two exact grid points (with the scales), slope first, then b.');
};
const exactPoints: Gen = (R, n) => {
  for (;;) {
    const { sx, sy, A, B: Bp, m, b, xA, yA } = scaledLine(R);
    if (xA.min !== 0 || b % sy === 0 || b <= 0 || b >= yA.max) continue;
    const approx = Math.round(b / sy) * sy;
    return choice(R, {
      id: `exactPoints-${n}`, family: 'exactPoints', board: 'm = \\frac{\\Delta y}{\\Delta x}', prompt: `The x-axis starts at ${xA.min} and counts by ${sx}; the y-axis counts by ${sy}. It meets the y-axis between gridlines, near ${approx}. To write the equation exactly, which two points should you read?`,
      picture: { g: { x: xA, y: yA, items: [{ kind: 'line', key: 'L', m, b }, point('A', A, pt(A), 'link'), point('B', Bp, pt(Bp), 'link')], show: ['axes', 'L'], solve: ['A', 'B'] } },
      solution: [`Read points where the line passes exactly through grid crossings: ${pt(A)} and ${pt(Bp)}.`, `The y-axis crossing sits between gridlines (about ${approx}), so reading it would only be an estimate. Exact: m = ${nH(m)}, b = ${nH(b)}.`],
    }, `${pt(A)} and ${pt(Bp)}`, 'Yes: exact grid points.', [
      { t: `(0, ${approx}) and ${pt(Bp)}`, mc: MC.estimated, say: `The line crosses the y-axis between gridlines; ${approx} is a guess. Use grid crossings.` },
      { t: `${pt([A[0] + sx / 2, A[1] + (m * sx) / 2 + sy / 3])} and ${pt(Bp)}`, mc: MC.estimated, say: 'That point is read between gridlines: an estimate. Pick points on grid crossings.' },
      { t: `(${nH(Bp[0] + sx)}, 0) and ${pt(A)}`, say: `Check: (${nH(Bp[0] + sx)}, 0) is not on the line.` },
    ]);
  }
};
const STORIES = [
  (R: () => number) => { const F = int(R, 2, 9) * 5, r = int(R, 8, 40); return { t: `A gym charges a $${F} sign-up fee plus $${r} per month.`, y: 'C', x: 'n', m: r, b: F, xw: 'months', yw: 'cost', yu: '$' }; },
  (R: () => number) => { const V = pick(R, [40, 50, 60, 80]), d = pick(R, [2.5, 2, 4, 1.5, 5]); return { t: `A ${V}-gallon tank starts full and drains ${nH(d)} gallons per minute.`, y: 'V', x: 't', m: -d, b: V, xw: 'minutes', yw: 'gallons left', yu: 'gal' }; },
  (R: () => number) => { const d = int(R, 2, 6), k = int(R, 2, 6), left = int(R, 5, 30); return { t: `A tank drains ${d} gallons per minute. After ${k} minutes, ${left} gallons are left.`, y: 'V', x: 't', m: -d, b: left + d * k, xw: 'minutes', yw: 'gallons', yu: 'gal', obs: { x: k, y: left } }; },
  (R: () => number) => { const r = int(R, 3, 12), k = int(R, 2, 6), have = int(R, 40, 90); return { t: `Maya saves $${r} every week. After ${k} weeks she has $${have + r * k}.`, y: 'S', x: 'w', m: r, b: have, xw: 'weeks', yw: 'savings', yu: '$', obs: { x: k, y: have + r * k } }; },
  (R: () => number) => { const p = int(R, 4, 9), k = int(R, 2, 5), left = Math.min(int(R, 30, 60), 100 - p * k - int(R, 0, 10)); return { t: `A phone battery loses ${p}% per hour. After ${k} hours it shows ${left}%.`, y: 'B', x: 'h', m: -p, b: left + p * k, xw: 'hours', yw: 'battery', yu: '%', obs: { x: k, y: left } }; },
] as const;
const vH = (s: string) => `<i>${s}</i>`;
const storyEq: Gen = (R, n) => {
  const S = pick(R, STORIES)(R) as { t: string; y: string; x: string; m: number; b: number; obs?: { x: number; y: number } };
  const e = (m: number, b: number) => siDecH(m, b, vH(S.y), vH(S.x));
  const opts: Opt[] = [
    { t: e(S.b, S.m), mc: MC.swapMB, say: `The rate per ${S.x === 't' ? 'minute' : 'step'} multiplies ${vH(S.x)}; the starting amount is added once.` },
    { t: e(-S.m, S.b), mc: MC.dropsSign, say: `The amount goes ${S.m < 0 ? 'down' : 'up'}: the rate is ${S.m < 0 ? 'negative' : 'positive'}.` },
  ];
  if (S.obs) opts.push({ t: e(S.m, S.obs.y), mc: MC.firstOut, say: `${nH(S.obs.y)} is after ${S.obs.x}, not at the start. Walk back ${S.obs.x} steps.` });
  else opts.push({ t: e(S.m + S.b, 0), say: 'The fee is paid once, not every time.' });
  return choice(R, {
    id: `storyEq-${n}`, family: 'storyEq', board: `${S.y} = m${S.x} + b`, prompt: `${S.t} Which equation models it?`,
    solution: [`Rate: ${nH(S.m)} per 1 of ${vH(S.x)}.${S.obs ? ` Start: ${nH(S.obs.y)} − (${nH(S.m)})(${S.obs.x}) = ${nH(S.b)}.` : ` Start: ${nH(S.b)}.`}`, `${vH(S.y)} = rate · ${vH(S.x)} + start.`],
  }, e(S.m, S.b), 'Yes.', opts);
};
const storyValue: Gen = (R, n) => {
  const S = pick(R, STORIES.slice(2))(R) as unknown as { t: string; y: string; x: string; m: number; b: number; obs: { x: number; y: number }; yu: string; xw: string };
  const g: GPic = { x: fitAxis([0, S.obs.x + 1], 1, { zero: true, name: S.xw, min: 0 }), y: axisFor([0, S.b, S.obs.y], { zero: true, max: 10, steps: [5, 10, 20, 25, 50], min: 0 }), items: [{ kind: 'line', key: 'L', m: S.m, b: S.b, lo: 0 }, point('O', [S.obs.x, S.obs.y], `(${S.obs.x}, ${nH(S.obs.y)})`), point('Y', [0, S.b], undefined, 'link')], show: ['axes', 'O'], solve: ['L', 'Y'] };
  return numItem({
    id: `storyValue-${n}`, family: 'storyValue', board: `${S.y} = ${nT(S.m)}${S.x} + b`, unit: S.yu === '$' ? 'dollars' : S.yu === '%' ? '%' : 'gallons', picture: { g },
    prompt: `${S.t} What was the amount at the start (${vH(S.x)} = 0)?`,
    solution: [`Walk back ${S.obs.x} steps at ${nH(S.m)} each: ${nH(S.obs.y)} − (${nH(S.m)})(${S.obs.x}).`, `= ${ans(nH(S.b))}. That is b, the initial value.`],
  }, S.b, 'Yes.', [
    { v: S.obs.y, mc: MC.firstOut, say: `${nH(S.obs.y)} is after ${S.obs.x}. Go back to 0.` },
    { v: S.obs.y + S.m * S.obs.x, mc: MC.dropsSign, say: `Going back undoes the change: ${S.m < 0 ? 'add the losses back' : 'take the savings away'}.` },
  ], 'Start from the observation and undo the rate back to 0.');
};

// ---------- 22-25 forms ----------
const readPS: Gen = (R, n) => {
  const m = slopeQ(R, { frac: true, maxInt: 5 });
  const x1 = (R() < 0.5 ? -1 : 1) * int(R, 1, 7), y1 = (R() < 0.5 ? -1 : 1) * int(R, 1, 7);
  const S = (mm: Q, P: Pt2) => `slope ${qH(mm)}, through ${pt(P)}`;
  const opts: Opt[] = [
    { t: S(m, [-x1, -y1]), mc: MC.wrongSign, say: `${Yv} ${y1 < 0 ? '+' : '−'} ${Math.abs(y1)} is ${Yv} − ${par(y1)}: the point's ${Yv} is ${nH(y1)}. Same for ${X}.` },
    { t: S(m, [-x1, y1]), mc: MC.wrongSign, say: `${X} ${x1 < 0 ? '+' : '−'} ${Math.abs(x1)} = ${X} − ${par(x1)}: the point's ${X} is ${nH(x1)}.` },
  ];
  const onL = (P: Pt2) => Math.abs(qNum(m) * (P[0] - x1) - (P[1] - y1)) < 1e-9;
  for (let i = opts.length - 1; i >= 0; i--) { const mm = opts[i]!.t.match(/through \((−?\d+), (−?\d+)\)/); if (mm && onL([Number(mm[1]!.replace('−', '-')), Number(mm[2]!.replace('−', '-'))])) opts.splice(i, 1); }
  if (x1 !== y1 && !onL([y1, x1])) opts.push({ t: S(m, [y1, x1]), mc: MC.coordOrder, say: 'Write the point as (x, y): the number with x first.' });
  opts.push({ t: S(qNeg(m), [x1, y1]), mc: MC.signDrop, say: `The slope is the factor in front of the bracket, sign included: ${qP(m)}.` });
  return choice(R, {
    id: `readPS-${n}`, family: 'readPS', board: psT(m, q(x1), q(y1)), prompt: `${psH(m, q(x1), q(y1))}. What does this point-slope equation tell you?`,
    picture: { g: gUnit(qNum(m), qNum(qSub(toQ(y1), qMul(m, toQ(x1)))), [[x1, y1]], [point('P', [x1, y1], pt([x1, y1]), 'link')], ['axes'], ['L', 'P']) },
    solution: [`Match ${Yv} − ${Yv}₁ = m(${X} − ${X}₁): ${y1 < 0 ? `${Yv} + ${-y1} = ${Yv} − (${y1})` : `${Yv} − ${y1}`} and ${x1 < 0 ? `${X} + ${-x1} = ${X} − (${x1})` : `${X} − ${x1}`}.`, `So m = ${qP(m)} and the point is ${pt([x1, y1])}.`],
  }, S(m, [x1, y1]), 'Yes: the signs inside flip.', opts);
};
const stdSlope: Gen = (R, n) => {
  let A = int(R, 1, 6), B = (R() < 0.5 ? -1 : 1) * int(R, 1, 6);
  if (A === Math.abs(B)) B = B > 0 ? B + 1 : B - 1;
  const C = A * B * (R() < 0.5 ? -1 : 1) * int(R, 1, 2);
  const s = stdNorm({ A, B, C }); A = s.A; B = s.B;
  const m = q(-A, B);
  const L = { m, b: q(s.C, B) };
  const opts: Opt[] = [
    { t: qH(q(A, B)), mc: MC.stdShortcut, say: `Solve for ${Yv}: ${byH(B)} = ${exprH(q(-A), q(s.C))}: the slope is −A ÷ B, with the minus.` },
    { t: nH(A), mc: MC.stdShortcut, say: `A is not the slope in standard form; ${Yv} is not alone yet. Slope = −A ÷ B.` },
    { t: qH(q(-B, A)), mc: MC.inverted, say: 'The coefficient of x goes on top: −A ÷ B.' },
  ];
  return choice(R, {
    id: `stdSlope-${n}`, family: 'stdSlope', board: stdT(s), prompt: `What is the slope of ${stdH(s)}?`,
    picture: { g: gUnit(qNum(m), qNum(L.b), [[0, qNum(L.b)], [s.C / A, 0]], [point('Y', [0, qNum(L.b)], `(0, ${qP(L.b)})`), point('Z', [s.C / A, 0], `(${qP(q(s.C, A))}, 0)`)], ['axes'], ['L', 'Y', 'Z']) },
    solution: [`Solve for ${Yv}: ${byH(B)} = ${exprH(q(-A), q(s.C))}, so ${siH(m, L.b)}.`, `Slope = −A ÷ B = ${qP(m)}. Check with the intercepts: (0, ${qP(L.b)}) and (${qP(q(s.C, A))}, 0).`],
  }, qH(m), 'Yes: −A ÷ B.', opts);
};
const stdIntercepts: Gen = (R, n) => {
  const ctx = R() < 0.45;
  let A: number, B: number, C: number, xv = 'x', yv = 'y', pre = '';
  if (ctx) {
    const pa = int(R, 3, 12), pc = int(R, 2, 9);
    if (pa === pc) return stdIntercepts(R, n);
    A = pa; B = pc; C = pa * pc * int(R, 2, 6); xv = 'a'; yv = 'c';
    pre = `Adult tickets cost $${pa} and child tickets $${pc}; the total is $${C}: ${pa}<i>a</i> + ${pc}<i>c</i> = ${C}. `;
  } else {
    A = int(R, 1, 6); B = (R() < 0.5 ? -1 : 1) * int(R, 1, 6); C = A * B * (R() < 0.5 ? -1 : 1) * int(R, 1, 3);
    if (A === Math.abs(B)) return stdIntercepts(R, n);
  }
  const s = { A, B, C };
  const xi = C / A, yi = C / B;
  const tex = stdT(s, xv, yv);
  return pairItem({
    id: `stdIntercepts-${n}`, family: 'stdIntercepts', board: tex,
    prompt: ctx ? `${pre}With <i>a</i> across and <i>c</i> up, where does the graph meet each axis?` : `Find both intercepts of ${stdH(s)}.`,
    picture: { g: { ...squareWin([0, xi], [0, yi]), equal: !ctx, x: ctx ? axisFor([0, xi], { zero: true, max: 10, name: 'adult (a)', steps: [1, 2, 5, 10, 20], min: 0 }) : squareWin([0, xi], [0, yi]).x, y: ctx ? axisFor([0, yi], { zero: true, max: 10, name: 'child (c)', steps: [1, 2, 5, 10, 20, 25], min: 0 }) : squareWin([0, xi], [0, yi]).y, items: [{ kind: 'line', key: 'L', m: -A / B, b: yi, ...(ctx ? { lo: 0, hi: xi } : {}) }, point('X', [xi, 0], `(${nH(xi)}, 0)`, 'link'), point('Y', [0, yi], `(0, ${nH(yi)})`, 'link')], show: ['axes'], solve: ['X', 'Y', 'L'] } },
    solution: [`Set ${yv === 'y' ? Yv : vH(yv)} = 0: ${A}${vH(xv)} = ${C}, so ${vH(xv)} = ${nH(xi)}. Set ${vH(xv)} = 0: ${nH(B)}${vH(yv)} = ${C}, so ${vH(yv)} = ${nH(yi)}.`, `The intercepts: (${ans(nH(xi))}, 0) and (0, ${ans(nH(yi))}).${ctx ? ` Only adult tickets: ${nH(xi)}; only child tickets: ${nH(yi)}.` : ''}`],
  }, xi, yi, { lead: '(', op: ', 0) and (0,', tail: ')' }, 'Yes: set each variable to 0 in turn.', [
    { x: yi, y: xi, mc: MC.swapIZ, say: `The x-intercept has ${yv} = 0, so it uses A: ${C} ÷ ${A}.` },
    { x: C, y: C, say: 'Set the other variable to 0, then divide by the coefficient that is left.' },
  ], 'Set one variable to 0 and solve for the other, then swap.');
};
const toSlopeInt: Gen = (R, n) => {
  if (R() < 0.5) {
    const m = (R() < 0.5 ? -1 : 1) * int(R, 2, 6), x1 = (R() < 0.5 ? -1 : 1) * int(R, 1, 6), y1 = int(R, -8, 8);
    const b = y1 - m * x1;
    return pairItem({
      id: `toSlopeInt-${n}`, family: 'toSlopeInt', board: psT(q(m), q(x1), q(y1)), prompt: `Rewrite ${psH(q(m), q(x1), q(y1))} in slope-intercept form.`,
      picture: { tex: [`${y1 === 0 ? 'y' : `y ${y1 < 0 ? '+' : '-'} ${Math.abs(y1)}`} = ${exprT(q(m), q(-m * x1))}`, siT(q(m), q(b))] },
      solution: [`Distribute ${nH(m)} to BOTH terms: ${Yv} − ${par(y1)} = ${exprH(q(m), q(-m * x1))}.`, `${y1 < 0 ? 'Subtract' : 'Add'} ${Math.abs(y1)}: m = ${ans(nH(m))}, b = ${ans(nH(b))}.`],
    }, m, b, MB, 'Yes.', [
      { x: m, y: y1 - x1, mc: MC.partialDist, say: `${nH(m)} multiplies the whole bracket: ${nH(m)} · ${par(-x1)} = ${nH(-m * x1)}.` },
      { x: m, y: -m * x1 - y1, mc: MC.noSignChange, say: `Moving ${par(-y1)} across changes its sign.` },
    ], 'Distribute m to both terms in the bracket, then get y alone.');
  }
  let A = int(R, 1, 6), B = pick(R, [1, 2, -1, -2, 3, -3]);
  const C = B * int(R, -6, 6);
  if (A % Math.abs(B) !== 0) A = A * Math.abs(B);
  const s = stdNorm({ A, B, C });
  if (s.B === 0) return toSlopeInt(R, n);
  const m = -s.A / s.B, b = s.C / s.B;
  if (!Number.isInteger(m * 2) || !Number.isInteger(b * 2)) return toSlopeInt(R, n);
  return pairItem({
    id: `toSlopeInt-${n}`, family: 'toSlopeInt', board: stdT(s), prompt: `Rewrite ${stdH(s)} in slope-intercept form.`,
    picture: { tex: [`${s.B === 1 ? '' : s.B === -1 ? '-' : nT(s.B)}y = ${exprT(q(-s.A), q(s.C))}`, siT(toQ(m), toQ(b))] },
    solution: [`Subtract ${s.A === 1 ? '' : s.A}${X}: ${byH(s.B)} = ${exprH(q(-s.A), q(s.C))}.`, `Divide EVERY term by ${nH(s.B)}: m = ${ans(nH(m))}, b = ${ans(nH(b))}.`],
  }, m, b, MB, 'Yes.', [
    { x: -m, y: b, mc: MC.noSignChange, say: `Moving ${s.A}${X} across makes it ${nH(-s.A)}${X}.` },
    { x: m, y: s.C, mc: MC.someTerms, say: `Divide the constant by ${nH(s.B)} too.` },
    { x: s.A, y: b, mc: MC.stdShortcut, say: 'A alone is not the slope; get y alone first.' },
  ], 'Move the x-term, then divide every term by the coefficient of y.');
};
const siToStd: Gen = (R, n) => {
  const d = pick(R, [2, 3, 4, 5]), p = (R() < 0.5 ? -1 : 1) * pick(R, [1, 2, 3, 5].filter(v => v % d !== 0)), b = (R() < 0.5 ? -1 : 1) * int(R, 1, 8);
  const m = q(p, d), L: Lin = { m, b: q(b) };
  if (m.q === 1) return siToStd(R, n);
  const s = stdOf(L);
  const two = R() < 0.3;
  const P1: Pt2 = [0, b], P2: Pt2 = [m.q, b + m.p];
  const fr2 = `${m.p > 0 ? '−' : ''}${qH(q(Math.abs(m.p), m.q))}${X} + ${Yv} = ${nH(b)}`;
  return choice(R, {
    id: `siToStd-${n}`, family: 'siToStd', board: two ? `${'(' + nT(P1[0]) + ',' + nT(P1[1]) + ')'},\\ (${nT(P2[0])}, ${nT(P2[1])})` : siT(m, q(b)),
    prompt: two ? `Write the line through ${pt(P1)} and ${pt(P2)} in standard form A${X} + B${Yv} = C (integers, A ≥ 0).` : `Write ${siH(m, q(b))} in standard form A${X} + B${Yv} = C (integers, A ≥ 0).`,
    picture: { tex: [`${m.q}y = ${exprT(q(m.p), q(b * m.q))}`, stdT(s)] },
    solution: [two ? `Slope ${qP(m)}, b = ${nH(b)}: ${siH(m, q(b))}.` : `Clear the fraction: multiply EVERY term by ${m.q}.`, `${m.q}${Yv} = ${exprH(q(m.p), q(b * m.q))}; move the ${X}-term over and make A positive.`],
  }, stdH(s), 'Yes: integers, A ≥ 0.', [
    { t: fr2, mc: MC.stdFractions, say: 'Standard form uses integers: multiply through to clear the fraction.' },
    { t: stdH({ A: s.A, B: s.B, C: b }), mc: MC.someTerms, say: `Multiply the constant by ${m.q} too.` },
    { t: stdH({ A: s.A, B: -s.B, C: -s.C }), mc: MC.noSignChange, say: 'Moving a term across the = sign changes its sign.' },
    { t: `${m.q}${Yv} = ${exprH(q(m.p), q(b * m.q))}`, mc: MC.stdYAlone, say: 'That is a step on the way. Standard form has both variables on one side: Ax + By = C.' },
  ], 5);
};
const stepFrom: Gen = (R, n) => {
  const m = pick(R, [q(1, 2), q(-1, 2), q(2, 3), q(-2, 3), q(3, 4), q(-3, 4), q(3, 2), q(-3, 2), q(2), q(-3)]);
  const ps = R() < 0.5;
  const x1 = ps ? (R() < 0.5 ? -1 : 1) * int(R, 1, 4) : 0, y1 = (R() < 0.5 ? -1 : 1) * int(R, 1, 5);
  const L = through(m, [x1, y1]);
  const end: Pt2 = [x1 + m.q, y1 + m.p];
  const eqH = ps ? psH(m, q(x1), q(y1)) : siH(m, q(y1)), eqT = ps ? psT(m, q(x1), q(y1)) : siT(m, q(y1));
  const slips: PairSlip[] = [];
  if (m.q !== Math.abs(m.p)) slips.push({ x: x1 + Math.abs(m.p), y: y1 + Math.sign(m.p) * m.q, mc: MC.inverted, say: `Run is the bottom of the slope (${m.q}), rise the top (${nH(m.p)}).` });
  if (ps) slips.push({ x: -x1 + m.q, y: -y1 + m.p, mc: MC.wrongSign, say: `The equation's point is ${pt([x1, y1])}: the signs inside the brackets flip.` });
  else slips.push({ x: y1 + m.q, y: m.p, mc: MC.swapIZ, say: `Start on the y-axis at (0, ${nH(y1)}), not at (${nH(y1)}, 0).` });
  return pairItem({
    id: `stepFrom-${n}`, family: 'stepFrom', board: eqT, prompt: `Graph ${eqH}: start at the point the equation names and take one slope step to the right (run ${m.q}). Where do you land?`,
    picture: { g: gUnit(qNum(m), qNum(L.b), [[x1, y1], end], [point('S', [x1, y1], pt([x1, y1])), ...riseRun('t', [x1, y1], end, 1, 1, `${m.q}`, nH(m.p)), point('E', end, pt(end), 'link')], ['axes'], ['S', 'trun', 'trise', 'E', 'L']) },
    solution: [ps ? `Point-slope names the point ${pt([x1, y1])}.` : `Slope-intercept names the start (0, ${nH(y1)}).`, `Slope ${qP(m)}: right ${m.q}, ${m.p > 0 ? 'up' : 'down'} ${Math.abs(m.p)}: (${ans(nH(end[0]))}, ${ans(nH(end[1]))}).`],
  }, end[0], end[1], PT, 'Yes.', slips, 'Plot the named point first, then run right by the bottom of the slope and rise by the top.');
};

// ---------- 26 transformations ----------
const transformPoint: Gen = (R, n) => {
  const a0 = pick(R, [2, 2, 3, 4, -2]);
  const kind = pick(R, ['af', 'af', 'shiftUp', 'shiftIn', 'fb'] as const);
  let g: string, gT: string, img: Pt2, slips: PairSlip[] = [], sol: string, lineM: number, lineB: number;
  if (kind === 'af') {
    const a = pick(R, [3, 2, 0.5, -1, -2, -3]); g = `${nH(a)}f(${X})`; gT = `${nT(a)}f(x)`; img = [a0, a * a0]; lineM = a; lineB = 0;
    sol = `${nH(a)}f(${X}) multiplies every OUTPUT by ${nH(a)}: (${a0}, ${a0}) → (${a0}, ${nH(a * a0)}).`;
    slips = [{ x: a * a0, y: a0, say: 'A factor outside f changes the output (the y-coordinate), not the input.' }];
    if (a < 0) slips.push({ x: a0, y: a0 + a, mc: MC.negShift, say: `${nH(a)}f(${X}) multiplies by ${nH(a)}; it does not subtract ${Math.abs(a)}.` });
  } else if (kind === 'shiftUp') {
    const d = (R() < 0.5 ? -1 : 1) * int(R, 1, 5); g = `f(${X}) ${d < 0 ? '−' : '+'} ${Math.abs(d)}`; gT = `f(x) ${d < 0 ? '-' : '+'} ${Math.abs(d)}`; img = [a0, a0 + d]; lineM = 1; lineB = d;
    sol = `Adding ${nH(d)} to the output moves every point ${d > 0 ? 'up' : 'down'} ${Math.abs(d)}: (${a0}, ${a0}) → (${a0}, ${nH(a0 + d)}).`;
    slips = [{ x: a0 + d, y: a0, say: 'Added outside f: it changes the output, so the point moves up or down.' }];
  } else if (kind === 'shiftIn') {
    const c = (R() < 0.5 ? -1 : 1) * int(R, 1, 5); g = `f(${X} ${c > 0 ? '−' : '+'} ${Math.abs(c)})`; gT = `f(x ${c > 0 ? '-' : '+'} ${Math.abs(c)})`; img = [a0 + c, a0]; lineM = 1; lineB = -c;
    sol = `g(${nH(a0 + c)}) = f(${nH(a0 + c)} ${c > 0 ? '−' : '+'} ${Math.abs(c)}) = f(${a0}) = ${a0}: the point moves ${c > 0 ? 'right' : 'left'} ${Math.abs(c)}, to (${nH(a0 + c)}, ${a0}).`;
    slips = [{ x: a0 - c, y: a0, mc: MC.wrongSign, say: `f(${X} − c) moves RIGHT by c: the input must be ${Math.abs(c)} ${c > 0 ? 'bigger' : 'smaller'} to reach the same output.` }, { x: a0, y: a0 - c, say: 'Inside the brackets is an input change: the point moves sideways.' }];
  } else {
    const b = pick(R, [2, -1, -2, 0.5]); g = `f(${nH(b)}${X})`; gT = `f(${nT(b)}x)`; img = [a0 / b, a0]; lineM = b; lineB = 0;
    sol = `g(${nH(a0 / b)}) = f(${nH(b)} · ${par(a0 / b)}) = f(${a0}) = ${a0}: inputs are divided by ${nH(b)}, so (${a0}, ${a0}) → (${nH(a0 / b)}, ${a0}).`;
    slips = [{ x: a0 * b, y: a0, say: `Inside f the input is multiplied by ${nH(b)}, so to get the same output the x-coordinate is DIVIDED by ${nH(b)}.` }, { x: a0, y: a0 * b, say: 'That would be the output stretched. The factor is inside, on the input.' }];
  }
  const w = squareWin([a0, img[0], 0], [a0, img[1], 0]);
  return pairItem({
    id: `transformPoint-${n}`, family: 'transformPoint', board: `g(x) = ${gT}`, prompt: `f(${X}) = ${X} passes through (${a0}, ${a0}). Where does that point go on g(${X}) = ${g}?`,
    picture: { g: { ...w, equal: true, items: [{ kind: 'line', key: 'L', m: 1, b: 0, name: 'f' }, { kind: 'line', key: 'G', m: lineM, b: lineB, col: 'water', dash: true }, point('P', [a0, a0], `(${a0}, ${a0})`), point('Q', img, pt(img), 'link')], show: ['axes', 'L', 'P'], solve: ['G', 'Q'] } },
    solution: [kind === 'af' || kind === 'shiftUp' ? 'Outside f: the change acts on the OUTPUT (the y-coordinate); the input stays.' : 'Inside f: the change acts on the INPUT, so the point moves sideways (the opposite way to the sign or factor).', sol.replace(/\(([^()]*), ([^()]*)\)\.$/, (_m0, x, y) => `(${ans(x)}, ${ans(y)}).`)],
  }, img[0], img[1], PT, 'Yes.', slips, 'Outside f changes outputs (up/down, stretch); inside f changes inputs (sideways, the opposite way).');
};
const transformWords: Gen = (R, n) => {
  const v = pick(R, ['left', 'right', 'up', 'neg', 'same', 'same3'] as const);
  const c = int(R, 2, 6);
  const base: Base = { id: `transformWords-${n}`, family: 'transformWords', board: '', prompt: '', solution: [] };
  const pic = (m: number, b: number): Pic => ({ g: { ...squareWin([-4, 4], [-4, 4, b]), equal: true, items: [{ kind: 'line', key: 'L', m: 1, b: 0, name: 'f' }, { kind: 'line', key: 'G', m, b, col: 'water', name: 'g' }], show: ['axes', 'L'], solve: ['G'] } });
  if (v === 'left' || v === 'right') {
    const s = v === 'left' ? '+' : '−';
    return choice(R, { ...base, board: `g(x) = f(x ${s === '+' ? '+' : '-'} ${c})`, prompt: `f(${X}) = ${X}. Describe g(${X}) = f(${X} ${s} ${c}).`, picture: pic(1, v === 'left' ? c : -c),
      solution: [`Inside the brackets: an input change. f(${X} ${s} ${c}) reaches each output when ${X} is ${c} ${v === 'left' ? 'smaller' : 'bigger'}.`, `So the graph shifts ${v} ${c}.`] },
    `A shift ${v} ${c}`, 'Yes.', [
      { t: `A shift ${v === 'left' ? 'right' : 'left'} ${c}`, mc: MC.wrongSign, say: `${X} ${s} ${c} is zero at ${X} = ${v === 'left' ? '−' : ''}${c}: the old origin moves there, ${v}.` },
      { t: `The slope changes to ${v === 'left' ? 1 + c : 1 - c}`, mc: MC.shiftSlope, say: 'A shift moves the line; its slope stays 1.' },
      { t: `A stretch by ${c}`, say: `Adding inside shifts; multiplying would stretch.` },
    ]);
  }
  if (v === 'up') {
    const d = (R() < 0.5 ? -1 : 1) * c;
    return choice(R, { ...base, board: `g(x) = f(x) ${d < 0 ? '-' : '+'} ${c}`, prompt: `f(${X}) = ${X}. Describe g(${X}) = f(${X}) ${d < 0 ? '−' : '+'} ${c}.`, picture: pic(1, d),
      solution: [`Outside f: every output changes by ${nH(d)}.`, `A shift ${d > 0 ? 'up' : 'down'} ${c}; the slope stays 1.`] },
    `A shift ${d > 0 ? 'up' : 'down'} ${c}, slope still 1`, 'Yes.', [
      { t: `A shift ${d > 0 ? 'up' : 'down'} ${c}, and the slope becomes ${1 + d}`, mc: MC.shiftSlope, say: 'Every point moves the same amount, so the steepness is unchanged.' },
      { t: `A shift ${d > 0 ? 'right' : 'left'} ${c}, slope still 1`, say: `Outside f is an output change: up or down. (For a line, ${d > 0 ? 'left' : 'right'} ${c} gives the same graph; ${d > 0 ? 'right' : 'left'} does not.)` },
    ], 3);
  }
  if (v === 'neg') {
    const a = -int(R, 2, 4);
    return choice(R, { ...base, board: `g(x) = ${a}f(x)`, prompt: `f(${X}) = ${X}. Describe g(${X}) = ${nH(a)}f(${X}).`, picture: pic(a, 0),
      solution: [`Every output is multiplied by ${nH(a)}.`, `The minus reflects across the ${X}-axis, the ${-a} stretches: slope ${a}.`] },
    `A reflection across the x-axis and a vertical stretch by ${-a}`, 'Yes.', [
      { t: `A shift down ${-a}`, mc: MC.negShift, say: `${nH(a)}f(${X}) multiplies outputs by ${nH(a)}; f(${X}) − ${-a} would shift down.` },
      { t: `A shift left ${-a}`, say: 'A factor outside f stretches outputs; it does not move sideways.' },
      { t: `A vertical stretch by ${-a}, no reflection`, say: 'The negative factor also flips the line across the x-axis.' },
    ]);
  }
  const k = c;
  const same3 = v === 'same3';
  return choice(R, { ...base, board: same3 ? `f(${k}x)` : `f(x - ${k})`, prompt: same3 ? `For f(${X}) = ${X}, which has the same graph as f(${k}${X})?` : `For f(${X}) = ${X}, which has the same graph as f(${X} − ${k})?`, picture: pic(same3 ? k : 1, same3 ? 0 : -k),
    solution: same3 ? [`f(${k}${X}) = ${k}${X} and ${k}f(${X}) = ${k}${X}: the same rule.`, 'For a line through the origin, a horizontal squeeze and a vertical stretch can give one graph.'] : [`f(${X} − ${k}) = ${X} − ${k}, and f(${X}) − ${k} = ${X} − ${k}: the same rule.`, `For a line, shifting right ${k} and shifting down ${k} land on the same graph.`] },
  same3 ? `${k}f(${X})` : `f(${X}) − ${k}`, 'Yes: one graph, two descriptions.', [
    { t: same3 ? `f(${X}) + ${k}` : `f(${X}) + ${k}`, mc: same3 ? undefined : MC.wrongSign, say: same3 ? `f(${X}) + ${k} = ${X} + ${k}: a different line.` : `f(${X} − ${k}) = ${X} − ${k}: down, not up.` },
    { t: 'None: a different equation always means a different graph', mc: MC.uniqueEq, say: 'Two equations can describe the same set of points. Simplify both and compare.' },
    { t: same3 ? `f(${X} + ${k})` : `f(${X} + ${k})`, mc: same3 ? undefined : MC.wrongSign, say: same3 ? `f(${X} + ${k}) = ${X} + ${k}: a shift, not a stretch.` : `f(${X} + ${k}) = ${X} + ${k}: left, not right.` },
  ]);
};

// ---------- 27 uniqueness ----------
const enoughInfo: Gen = (R, n) => {
  const kind = pick(R, ['one', 'two', 'repeat', 'sameX', 'slopePt', 'three', 'threeBad'] as const);
  const m = (R() < 0.5 ? -1 : 1) * int(R, 1, 3), b = int(R, -3, 3), L: Lin = { m: q(m), b: q(b) };
  const xa = int(R, -3, 0), xb = xa + int(R, 1, 3), xc = xb + int(R, 1, 2);
  const A: Pt2 = [xa, at(L, xa)], Bp: Pt2 = [xb, at(L, xb)], Cp: Pt2 = [xc, at(L, xc) + (kind === 'threeBad' ? int(R, 1, 2) : 0)];
  const ONE = 'Exactly one linear function', MANY = 'Infinitely many', NONE = 'No linear function';
  let info: string, right: string, pts: Pt2[], why: string;
  switch (kind) {
    case 'one': info = `It passes through ${pt(A)}.`; right = MANY; pts = [A]; why = 'Through one point you can draw lines of any slope.'; break;
    case 'two': info = `It passes through ${pt(A)} and ${pt(Bp)}.`; right = ONE; pts = [A, Bp]; why = 'Two points with different inputs fix the slope, then b.'; break;
    case 'repeat': info = `It passes through ${pt(A)} and ${pt(A)}.`; right = MANY; pts = [A]; why = 'That is the same point twice: still only one point.'; break;
    case 'sameX': { const y2 = A[1] + int(R, 2, 5); info = `It passes through ${pt(A)} and ${pt([xa, y2])}.`; right = NONE; pts = [A, [xa, y2]]; why = `One input, ${nH(xa)}, with two outputs: a function cannot do that (the line would be vertical).`; break; }
    case 'slopePt': info = `Its slope is ${nH(m)} and it passes through ${pt(A)}.`; right = ONE; pts = [A]; why = 'A point and a slope fix the line (point-slope form).'; break;
    case 'three': info = `It passes through ${pt(A)}, ${pt(Bp)} and ${pt(Cp)}.`; right = ONE; pts = [A, Bp, Cp]; why = 'The third point lies on the line through the first two.'; break;
    default: info = `It passes through ${pt(A)}, ${pt(Bp)} and ${pt(Cp)}.`; right = NONE; pts = [A, Bp, Cp]; why = `The line through the first two misses ${pt(Cp)}: the information is inconsistent.`;
  }
  const items: GItem[] = pts.map((P, i) => point('P' + i, P, pt(P)));
  const solve: string[] = [];
  if (kind === 'two' || kind === 'slopePt' || kind === 'three' || kind === 'threeBad') { items.push({ kind: 'line', key: 'L', m, b, dash: kind === 'threeBad' }); solve.push('L'); }
  if (kind === 'one' || kind === 'repeat') { items.push({ kind: 'line', key: 'L1', m: 1, b: A[1] - A[0], dash: true, col: 'water' }, { kind: 'line', key: 'L2', m: -2, b: A[1] + 2 * A[0], dash: true, col: 'water' }); solve.push('L1', 'L2'); }
  return choice(R, {
    id: `enoughInfo-${n}`, family: 'enoughInfo', board: '\\text{how many lines?}', prompt: `A linear function: ${info} How many linear functions fit?`,
    picture: { g: { ...squareWin(pts.map(p => p[0]).concat([0]), pts.map(p => p[1]).concat([0])), equal: true, items, show: ['axes', ...pts.map((_, i) => 'P' + i)], solve } },
    solution: [why],
  }, right, 'Yes.', [ONE, MANY, NONE].filter(t => t !== right).map(t => ({
    t, mc: t === ONE && (kind === 'sameX' || kind === 'threeBad') ? MC.twoPoints : undefined,
    say: kind === 'sameX' ? 'Two points with the same input give a vertical line, which is not a function.' : kind === 'threeBad' ? 'Check the third point against the line through the first two.' : why,
  })), 3);
};
const sameLineForms: Gen = (R, n) => {
  const m = pick(R, [q(2), q(-3), q(1, 2), q(-2, 3), q(3), q(-1)]), b = int(R, -5, 5);
  const L: Lin = { m, b: q(b) };
  const P: Pt2 = [m.q * int(R, 1, 3), 0]; const Pp: Pt2 = [P[0], at(L, P[0])];
  const same = R() < 0.55;
  const L2: Lin = same ? L : pick(R, [{ m, b: q(b + pick(R, [1, -1, 2])) }, { m: qNeg(m), b: q(b) }]);
  const f1 = psH(m, q(Pp[0]), q(Pp[1])), useStd = R() < 0.5, f2 = useStd ? stdH(stdOf(L2)) : siH(L2.m, L2.b);
  const right = same ? 'Yes: the same line' : 'No: different lines';
  return choice(R, {
    id: `sameLineForms-${n}`, family: 'sameLineForms', board: '\\text{same line?}', prompt: `Do ${f1} and ${f2} describe the same line?`,
    picture: { g: { ...squareWin([0, Pp[0], 3], [b, Pp[1], at(L2, 3)]), equal: true, items: [{ kind: 'line', key: 'L', m: qNum(m), b }, { kind: 'line', key: 'G', m: qNum(L2.m), b: qNum(L2.b), col: 'water', dash: true }], show: ['axes'], solve: ['L', 'G'] } },
    solution: [`First: distribute and get ${Yv} alone: ${siH(m, q(b))}.`, `Second: ${useStd ? 'solve for y: ' : ''}${siH(L2.m, L2.b)}. ${same ? 'Same slope, same intercept: one line.' : 'Different slope or intercept: two lines.'}`],
  }, right, 'Yes.', [
    { t: same ? 'No: different lines' : 'Yes: the same line', say: 'Put both in slope-intercept form and compare m and b.' },
    { t: 'No: different-looking equations can never be the same line', mc: MC.uniqueEq, say: 'One line has many equations. Rewrite both in the same form to compare.' },
  ], 3);
};

// ---------- 28-31 meaning in context ----------
const CTX = [
  { y: 'C', x: 'd', yw: 'cost', xw: 'miles', one: 'mile', u: (v: number) => `$${v < 0 ? '−' : ''}${Math.abs(v).toFixed(2)}`, m: [0.45, 1.25, 2.5, 0.6], b: [3, 2.5, 4], up: 'rises', down: 'drops' },
  { y: 'V', x: 't', yw: 'water in the tank', xw: 'minutes', one: 'minute', u: (v: number) => `${nH(v)} gallons`, m: [-2.5, -4, -1.5, 3], b: [40, 60, 0], up: 'rises', down: 'drops' },
  { y: 'h', x: 'd', yw: 'snow depth', xw: 'days', one: 'day', u: (v: number) => `${nH(v)} inches`, m: [0.04, -0.5, 1.5], b: [12, 0, 6], up: 'rises', down: 'drops' },
  { y: 'D', x: 't', yw: 'distance from the start line', xw: 'seconds', one: 'second', u: (v: number) => `${nH(v)} meters`, m: [6, 7.5, -3], b: [20, 5, 30], up: 'grows', down: 'shrinks' },
  { y: 'T', x: 'h', yw: 'temperature', xw: 'hours after midnight', one: 'hour', u: (v: number) => `${nH(v)} °F`, m: [2, -1.5, 0], b: [-5, 30, 12], up: 'rises', down: 'drops' },
] as const;
const slopeSentence: Gen = (R, n) => {
  const S = pick(R, CTX), m = pick(R, S.m as readonly number[]), b = pick(R, S.b as readonly number[]);
  const eq = siDecH(m, b, vH(S.y), vH(S.x));
  const dir = m > 0 ? S.up : S.down;
  const right = m === 0 ? `The ${S.yw} stays the same each ${S.one}` : `The ${S.yw} ${dir} ${S.u(Math.abs(m))} each ${S.one}`;
  return choice(R, {
    id: `slopeSentence-${n}`, family: 'slopeSentence', board: siDecT(m, b, S.y, S.x), prompt: `${eq} models the ${S.yw} (${vH(S.x)} = ${S.xw}). What does the slope say?`,
    solution: [`The slope is ${nH(m)}: the change in ${S.yw} per 1 ${S.one}.`, `Unit: output unit per input unit. ${m === 0 ? 'Zero: no change.' : m > 0 ? 'Positive: it goes up.' : 'Negative: it goes down.'}`],
  }, right, 'Yes: a rate, per one input unit.', [
    { t: `The ${S.yw} is ${S.u(Math.abs(m === 0 ? b : m))}`, mc: MC.perUnit, say: `A slope is a change PER ${S.one}, not an amount.` },
    ...(m !== 0 ? [{ t: `The ${S.yw} ${m > 0 ? S.down : S.up} ${S.u(Math.abs(m))} each ${S.one}`, mc: MC.dropsSign, say: `The sign shows direction: ${nH(m)} means it ${dir}.` }] : []),
    ...(Math.abs(b) === Math.abs(m) || b === 0 ? [] : [{ t: `It takes 1 ${S.one} for the ${S.yw} to change by ${S.u(Math.abs(b))}`, mc: MC.swapMB, say: `${nH(b)} is the starting value, not the rate.` }]),
  ]);
};
const bMeaning: Gen = (R, n) => {
  const S = pick(R, CTX), m = pick(R, (S.m as readonly number[]).filter(v => v !== 0)), b = pick(R, (S.b as readonly number[]).filter(v => v !== m));
  const eq = siDecH(m, b, vH(S.y), vH(S.x));
  return choice(R, {
    id: `bMeaning-${n}`, family: 'bMeaning', board: siDecT(m, b, S.y, S.x), prompt: `${eq} models the ${S.yw} (${vH(S.x)} = ${S.xw}, starting at ${vH(S.x)} = 0). What does the ${nH(b)} say?`,
    solution: [`b is the output when the input is 0.`, `At 0 ${S.xw}, the ${S.yw} is ${S.u(b)}, in output units.`],
  }, `At 0 ${S.xw}, the ${S.yw} is ${S.u(b)}`, 'Yes: the initial value.', [
    { t: `The ${S.yw} changes by ${S.u(b)} per ${S.one}`, mc: MC.units, say: `b has the output unit only; "per ${S.one}" belongs to the slope.` },
    { t: `The ${S.yw} ${m > 0 ? S.up : S.down} ${S.u(Math.abs(b))} each ${S.one}`, mc: MC.swapMB, say: `The change each ${S.one} is the slope, ${nH(m)}.` },
    { t: `After 1 ${S.one}, the ${S.yw} is ${S.u(b)}`, mc: MC.firstOut, say: `After 1 ${S.one} it is ${S.u(b + m)}. b is at 0.` },
  ]);
};
const ZCTX = [
  (R: () => number) => { const d = pick(R, [2, 2.5, 4, 5]), V = d * int(R, 6, 20); return { eq: siDecH(-d, V, vH('V'), vH('t')), t: `A tank drains: V = ${nH(V)} − ${nH(d)}t gallons after t minutes.`, z: V / d, b: V, xu: 'minutes', yu: 'gallons', event: 'the tank is empty' }; },
  (R: () => number) => { const p = pick(R, [12, 15, 20, 25]), F = p * int(R, 10, 30); return { eq: siDecH(p, -F, vH('P'), vH('n')), t: `A bake sale's profit is P = ${p}n − ${F} dollars for n boxes sold.`, z: F / p, b: -F, xu: 'boxes', yu: 'dollars', event: 'the sale breaks even' }; },
  (R: () => number) => { const r = pick(R, [0.5, 1.5, 2]), L = r * int(R, 4, 12); return { eq: siDecH(-r, L, vH('L'), vH('h')), t: `A candle is L = ${nH(L)} − ${nH(r)}h inches tall after h hours.`, z: L / r, b: L, xu: 'hours', yu: 'inches', event: 'the candle has burned down' }; },
  (R: () => number) => { const p = pick(R, [50, 75, 100, 125]), B = p * int(R, 4, 16); return { eq: siDecH(-p, B, vH('B'), vH('m')), t: `A loan balance is B = ${B} − ${p}m dollars after m monthly payments.`, z: B / p, b: B, xu: 'payments', yu: 'dollars', event: 'the loan is paid off' }; },
] as const;
const zeroWhen: Gen = (R, n) => {
  const S = pick(R, ZCTX)(R);
  if (R() < 0.4) return choice(R, {
    id: `zeroWhen-${n}`, family: 'zeroWhen', board: '\\text{output} = 0', prompt: `${S.t} The zero of this model is ${nH(S.z)}. What does it mean?`,
    solution: [`The zero is the input where the output is 0.`, `So after ${nH(S.z)} ${S.xu}, ${S.event}. It is measured in INPUT units (${S.xu}).`],
  }, `After ${nH(S.z)} ${S.xu}, ${S.event}`, 'Yes: an input, in input units.', [
    { t: `There are ${nH(S.z)} ${S.yu} at that moment`, mc: MC.inverseUnits, say: `${nH(S.z)} is an input: it counts ${S.xu}, not ${S.yu}.` },
    { t: `At the start there are ${nH(S.z)} ${S.yu}`, mc: MC.swapIZ, say: `The start (input 0) gives the y-intercept, ${nH(S.b)}. The zero is where the OUTPUT is 0.` },
  ], 3);
  return numItem({
    id: `zeroWhen-${n}`, family: 'zeroWhen', board: '\\text{output} = 0', unit: S.xu, prompt: `${S.t} When does it reach 0 (${S.event})?`,
    solution: [`Set the output to 0 and solve.`, `${nH(Math.abs(S.b))} ÷ ${nH(Math.abs(S.b) / S.z)} = ${ans(nH(S.z))} ${S.xu}.`],
  }, S.z, `Yes: ${nH(S.z)} ${S.xu}.`, [{ v: S.b, mc: MC.swapIZ, say: `${nH(S.b)} is the output at input 0 (the y-intercept). Find the input that makes the output 0.` }, { v: -S.z, say: 'The input is positive here: count forward from the start.' }], 'Set the output to 0 and solve for the input.');
};
const isZero: Gen = (R, n) => {
  const kind = pick(R, ['outside', 'noZeroInput', 'plant'] as const);
  if (kind === 'outside') {
    const a = pick(R, [2, 3, 4]), up = int(R, 3, 5), root = up + int(R, 1, 3), c = a * root;
    return choice(R, {
      id: `isZero-${n}`, family: 'isZero', board: `T = ${a}t - ${c}`, prompt: `T = ${a}t − ${c} (°F) models the temperature t hours after 6 pm, for 0 ≤ t ≤ ${up}. Does the model have a zero?`,
      solution: [`The line's root is t = ${c} ÷ ${a} = ${root}.`, `${root} is outside 0 ≤ t ≤ ${up}: a feature of the extended line, not a zero of the model.`],
    }, `No: the root t = ${root} lies outside 0 ≤ t ≤ ${up}`, 'Yes: a zero must be in the domain.', [
      { t: `Yes: t = ${root}, because ${a}(${root}) − ${c} = 0`, mc: MC.allReals, say: `The formula works at ${root}, but the model only covers 0 ≤ t ≤ ${up}.` },
      { t: `Yes: t = ${up}, the end of the domain`, say: `At t = ${up}, T = ${a * up - c}, not 0.` },
    ], 3);
  }
  if (kind === 'noZeroInput') {
    const p = int(R, 4, 9), f = int(R, 10, 30);
    return choice(R, {
      id: `isZero-${n}`, family: 'isZero', board: `C = ${p}n + ${f}`, prompt: `C = ${p}n + ${f} dollars is the cost of a party for n guests, for n ≥ 1. Is (0, ${f}) a y-intercept of this model?`,
      solution: [`A y-intercept needs input 0 in the domain. Here n ≥ 1.`, `${f} is only the formula's value at 0 (a fee built into the price), not a point of the model.`],
    }, `No: n = 0 is not in the domain, so ${f} is only the formula's value at 0`, 'Yes.', [
      { t: `Yes: b = ${f} is always the y-intercept`, mc: MC.allReals, say: 'Only when 0 is an allowed input. Here the domain starts at 1.' },
      { t: `No: the y-intercept is (${f}, 0)`, mc: MC.swapIZ, say: 'That point would be on the x-axis; a y-intercept has input 0.' },
    ], 3);
  }
  const r = pick(R, [1.5, 2, 2.5]), d = pick(R, [2, 3, 1]);
  return choice(R, {
    id: `isZero-${n}`, family: 'isZero', board: `h = ${nT(r)}t - ${d}`, prompt: `A seedling's height is modeled by h = ${nH(r)}t − ${d} (cm, t weeks after planting), domain t ≥ 0. What is true about its y-intercept?`,
    solution: [`t = 0 is in the domain, so (0, −${d}) IS the model's y-intercept.`, `But a height of −${d} cm is not plausible: existence and plausibility are separate questions, and a stated domain does not prove the model is right.`],
  }, `It exists, (0, −${d}), but a height of −${d} cm is not plausible`, 'Yes: it exists, and it is implausible.', [
    { t: 'There is none: a height cannot be negative', mc: MC.rejects, say: 'The domain includes t = 0, so the model has that point; the point just does not make sense.' },
    { t: `It is (0, −${d}), and since the domain is t ≥ 0 the model is right for every t ≥ 0`, mc: MC.declared, say: 'Stating a domain does not make the model accurate there. This one even gives a negative height.' },
  ], 3);
};
const firstWhole: Gen = (R, n) => {
  const a = pick(R, [3, 4, 6, 7, 8]), c = a * int(R, 2, 9) + int(R, 1, a - 1);
  const root = c / a, first = Math.floor(root) + 1;
  return numItem({
    id: `firstWhole-${n}`, family: 'firstWhole', board: `P = ${a}n - ${c}`, unit: 'items',
    prompt: `P(<i>n</i>) = ${a}<i>n</i> − ${c} is the profit (dollars) for <i>n</i> items sold, whole numbers only. What is the first <i>n</i> that makes a profit (P > 0)?`,
    solution: [`P = 0 at n = ${c}/${a} ≈ ${nH(Math.round(root * 100) / 100)}: not a whole number, so there is no exact break-even sale.`, `Next whole number: n = ${ans(String(first))} gives P = ${a * first - c} > 0.`],
  }, first, `Yes: ${first} items, P = $${a * first - c}.`, [
    { v: root, tol: 0.06, mc: MC.fractions, say: `You cannot sell ${nH(Math.round(root * 100) / 100)} items: n is a count. Take the next whole number.` },
    { v: Math.floor(root), say: `At n = ${Math.floor(root)}, P = ${a * Math.floor(root) - c}: still a loss.` },
  ], 'Solve P = 0, then take the first whole number past it.');
};

export const GENERATORS: Record<FamilyId, Gen> = {
  tableLinear, changeTable, graphSlope, twoPointSlope, scaledSlope, steeperScaled, flatOrSteep, hvLine, evalF, readNotation, yIntercept,
  readMB, matchGraph, zeroGraph, zeroCount, solveZero, phraseToIneq, domainGraph, contextDomain, rangeInterval, mixedFeature, buildMB,
  bFromPoint, writePS, eqTwoPoints, twoPointsStory, tableRule, tableCheck, graphRule, exactPoints, storyEq, storyValue, readPS, stdSlope,
  stdIntercepts, toSlopeInt, siToStd, stepFrom, transformPoint, transformWords, enoughInfo, sameLineForms, slopeSentence, bMeaning, zeroWhen,
  isZero, firstWhole,
};
// keep the helpers the page and the tests use in one place
export { onLin, sameLin, slope, stdOf, zeroOf, through, at };
