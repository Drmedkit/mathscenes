// famA.ts: practice families for the first stage of "Scatter plots, correlation and the regression line": variable
// roles, exact vs statistical, observed vs predicted, fitting by eye, predictions, residuals, residuals in context, the
// residual plot and reading residual patterns. Pure: no DOM.
import { A } from '../../runtime/item';
import { type GItem } from '../linear-functions-slope/graphPic';
import {
  type Cand, type Opt, type RCtx, plausible, type RG, type RGen, a1, CTX, MC, ans, axisFor, calc, choice, ctxById, ctxPick, dataSet, dots, heads, int, lineItem,
  numItem, pairItem, pick, residG, scatterG, shuffle, sticks, tableCard, xv, yv,
} from './kit';
import { fx, fxT, lsrl, modelH, modelT, nH, nT, noise, onGrid, r9, rd, residuals, sg, spreadXs, sumSq, tieFree, until, yhat } from './regMaths';

const I = (s: string) => `<i>${s}</i>`;
/** a random element that passes the test, or null */
function pickWhere<T>(R: () => number, xs: readonly T[], ok: (t: T) => boolean): T | null { const c = xs.filter(ok); return c.length ? c[Math.floor(R() * c.length)]! : null; }
const idx = (n: number) => Array.from({ length: n }, (_, i) => i);
const cap = (s: string) => s[0]!.toUpperCase() + s.slice(1);
const mH = (A0: number, B0: number, c: RCtx) => modelH(fx(A0, c.da), fx(B0, c.db));
const mT = (A0: number, B0: number, c: RCtx) => modelT(fxT(A0, c.da), fxT(B0, c.db));
const intModelH = (a: number, b: number) => (b === 0 ? `ŷ = ${nH(a)}` : modelH(nH(a), nH(b)));
const intModelT = (a: number, b: number) => (b === 0 ? `\\hat{y} = ${nT(a)}` : modelT(nH(a), nH(b)));

// ===================== variable-roles =====================
/** which variable is explanatory: set by the prediction question, not by column order or by cause */
export const roles: RGen = (R, n) => {
  const c = ctxPick(R, ['arm', 'foot', 'study', 'mpg', 'drinks', 'growth', 'tree']);
  const reversed = ['arm', 'foot', 'tree', 'growth'].includes(c.id) && R() < 0.5;   // predict x from y: only where that question makes sense
  const E = reversed ? c.yWhat : c.xWhat, T = reversed ? c.xWhat : c.yWhat;
  const d = dataSet(R, c, 7);
  const swapCols = R() < 0.6;
  const first = swapCols ? c.yWhat : c.xWhat;
  const q = reversed ? `A researcher has ${a1(c.one)}'s ${T} missing and wants to predict it from the ${c.one}'s ${E}.` : `Someone wants to predict ${a1(c.one)}'s ${T} from ${c.poss} ${E}.`;
  const opts: Opt[] = [
    { t: `The ${E}`, ok: true, key: 'E', say: `Yes. We predict FROM the ${E}, so it is the explanatory variable (x). The ${T} is the response (y).` },
    { t: `The ${T}`, mc: first === T ? MC.colOrder : undefined, key: 'T', say: `The ${T} is what we want to predict: that makes it the response (y). The question, not the table, sets the roles.` },
    { t: 'Whichever variable the table lists first', mc: MC.colOrder, key: first === E ? 'E' : 'T', say: `Column order is just how someone typed the table. The question says what we predict from: the ${E}.` },
    { t: 'The variable that causes the other one', mc: MC.explCause, say: `Explanatory does not mean "cause". It only means the variable we predict from: here the ${E}.` },
  ];
  return choice(R, {
    id: `roles-${n}`, family: 'roles',
    prompt: `The table lists the ${heads(c)[swapCols ? 1 : 0].toLowerCase()} first and the ${heads(c)[swapCols ? 0 : 1].toLowerCase()} second for 7 ${c.who}. ${q} Which variable is the <b>explanatory</b> variable (${I('x')})?`,
    board: 'x = \\,?',
    solution: [`The question says what we predict from: the ${E}.`, `So the ${E} is x (explanatory) and the ${T} is y (response), whatever the column order.`],
    picture: { card: tableCard(c, d.xs, d.ys, { swap: swapCols }) },
  }, opts);
};
/** does the plot put the explanatory variable on the horizontal axis? */
export const rolesAxis: RGen = (R, n) => {
  const c = ctxPick(R, ['arm', 'foot', 'study', 'mpg', 'drinks', 'growth', 'bike', 'tree']);
  const d = dataSet(R, c, 8);
  const swapped = R() < 0.5;
  const g: RG = swapped
    ? { x: axisFor(d.ys, c.yAxis), y: axisFor(d.xs, c.xAxis), items: dots(d.ys, d.xs) }
    : scatterG(d);
  const opts: Opt[] = [
    { t: 'Yes: the variable we predict from is on the horizontal axis.', ok: !swapped, say: swapped ? `Look again: the ${c.yWhat} is on the horizontal axis, but we predict FROM the ${c.xWhat}.` : `Yes. We predict from the ${c.xWhat}, and it is on the horizontal axis.` },
    { t: 'No: the variable we predict from belongs on the horizontal axis.', ok: swapped, say: swapped ? `Yes. The ${c.xWhat} is the explanatory variable, so it goes across; the ${c.yWhat} goes up.` : `It is already there: the ${c.xWhat} is on the horizontal axis.` },
    { t: 'Either way is fine: the axes do not matter for a prediction.', say: 'They do: the line predicts the vertical variable from the horizontal one. Swap the axes and you get a different line.' },
    { t: 'The horizontal axis should show whichever variable causes the other.', mc: MC.explCause, say: `The roles come from the question: we predict the ${c.yWhat} from the ${c.xWhat}. Cause has nothing to do with it.` },
  ];
  return choice(R, {
    id: `rolesAxis-${n}`, family: 'rolesAxis',
    prompt: `We want to predict ${a1(c.one)}'s <b>${c.yWhat}</b> from ${c.poss} <b>${c.xWhat}</b>. Is this scatter plot set up the right way for that question?`,
    board: '',
    solution: [`We predict from the ${c.xWhat}: it is the explanatory variable and goes on the horizontal axis.`, swapped ? `Here the ${c.yWhat} is on the horizontal axis: the plot is swapped.` : `Here it is on the horizontal axis: the plot is right.`],
    picture: { g },
  }, opts, true);
};

// ===================== exact-vs-statistical =====================
const EXACT: { pair: string; rule: string; xs: number[]; f: (x: number) => number; hx: string; hy: string; linear: boolean }[] = [
  { pair: 'the number of gallons of gas bought and the cost, at a fixed price of $3.40 per gallon', rule: 'cost = 3.40 × gallons', xs: [4, 7, 9, 12, 15], f: x => r9(3.4 * x), hx: 'Gallons', hy: 'Cost ($)', linear: true },
  { pair: 'a length measured in feet and the same length in inches', rule: 'inches = 12 × feet', xs: [2, 3.5, 5, 6, 8.5], f: x => 12 * x, hx: 'Feet', hy: 'Inches', linear: true },
  { pair: 'a temperature in degrees Celsius and the same temperature in degrees Fahrenheit', rule: '°F = 1.8 × °C + 32', xs: [-10, 0, 15, 20, 35], f: x => r9(1.8 * x + 32), hx: '°C', hy: '°F', linear: true },
  { pair: 'the number of texts sent and the monthly bill on a plan that charges $25 plus $0.10 per text', rule: 'bill = 25 + 0.10 × texts', xs: [0, 40, 120, 200, 310], f: x => r9(25 + 0.1 * x), hx: 'Texts', hy: 'Bill ($)', linear: true },
  { pair: 'the side length of a square tile (inches) and its area (square inches)', rule: 'area = side²', xs: [2, 3, 4, 6, 8], f: x => x * x, hx: 'Side (in)', hy: 'Area (sq in)', linear: false },
  { pair: 'the radius of a round pizza (inches) and the length of its edge (inches)', rule: 'edge = 2π × radius', xs: [4, 5, 6, 7, 8], f: x => r9(2 * Math.PI * x), hx: 'Radius (in)', hy: 'Edge (in)', linear: true },
];
const KIND_OPTS = (exactRight: boolean, sayExact: string, sayStat: string, nonlinear = false): Opt[] => [
  { t: 'Exact: a rule fixes y for every x.', ok: exactRight, mc: exactRight ? undefined : MC.onLine, say: exactRight ? sayExact : sayStat },
  { t: 'Statistical: y only tends to change with x, with scatter.', ok: !exactRight, say: exactRight ? sayExact : sayStat },
  ...(nonlinear ? [{ t: 'Statistical: the points do not lie on a straight line.', say: 'Exact does not mean straight. A rule fixes the area for every side length; the rule is just not linear.' } as Opt] : []),
  { t: 'It cannot be decided from the context.', say: exactRight ? sayExact : sayStat },
];
export const exactStat: RGen = (R, n) => {
  const exact = R() < 0.5;
  if (exact) {
    const e = pick(R, EXACT);
    const sayE = `Yes. The rule ${e.rule} comes from the context itself, so every x gives exactly one y, with no scatter.`;
    return choice(R, {
      id: `exactStat-${n}`, family: 'exactStat',
      prompt: `Think about ${e.pair}. Is this relationship <b>exact</b> or <b>statistical</b>?`,
      board: '',
      solution: [`The context gives a rule: ${e.rule}.`, 'A rule from the context fixes y for every x: the relationship is exact.'],
      picture: { card: { cols: [{ head: e.hx, cells: e.xs.map(v => nH(v)) }, { head: e.hy, cells: e.xs.map(v => nH(e.f(v), 2)) }] } },
    }, KIND_OPTS(true, sayE, sayE, !e.linear), true);
  }
  const c = ctxPick(R, ['arm', 'study', 'mpg', 'drinks', 'foot', 'tree', 'bike']);
  const d = dataSet(R, c, 9, { rLo: 0.75, rHi: 0.95 });
  const sayS = `Yes. ${c.yWhat[0]!.toUpperCase() + c.yWhat.slice(1)} tends to change with ${c.xWhat}, but ${c.who} with the same ${c.xWhat} differ: there is a trend plus scatter, and no rule fixes y.`;
  return choice(R, {
    id: `exactStat-${n}`, family: 'exactStat',
    prompt: `Think about the ${c.xWhat} and the ${c.yWhat} of ${c.who}. Is this relationship <b>exact</b> or <b>statistical</b>?`,
    board: '',
    solution: [`No rule from the context fixes the ${c.yWhat} from the ${c.xWhat}: ${c.who} vary.`, 'The plot shows a trend with scatter: the relationship is statistical.'],
    picture: { g: scatterG(d) },
  }, KIND_OPTS(false, sayS, sayS), true);
};
/** a small sample exactly on a line with no rule given, or two cases with the same x and different y */
export const exactSample: RGen = (R, n) => {
  if (R() < 0.6) {
    const c = ctxPick(R, ['study', 'bike', 'tree']);
    const a = c.id === 'study' ? pick(R, [52, 55, 58, 60]) : c.id === 'bike' ? pick(R, [4, 5, 6]) : pick(R, [18, 20, 24]);
    const b = c.id === 'study' ? pick(R, [3, 4, 5]) : c.id === 'bike' ? pick(R, [4, 5]) : pick(R, [2, 3]);
    const xs = c.id === 'study' ? shuffle(R, [1, 2, 3, 4, 5, 6, 7]).slice(0, 4).sort((p, q) => p - q) : c.id === 'bike' ? shuffle(R, [2, 3, 4, 5, 6, 8, 10]).slice(0, 4).sort((p, q) => p - q) : shuffle(R, [6, 8, 10, 12, 14, 16, 18]).slice(0, 4).sort((p, q) => p - q);
    const ys = xs.map(x => a + b * x);
    const opts: Opt[] = [
      { t: `No: 4 points on a line could be chance. Only a rule from the context could make it exact.`, ok: true, say: `Right. Four ${c.who} lining up is not a law. A fifth ${c.one} would very likely sit off the line.` },
      { t: 'Yes: every point is on the line, so the relationship is exact.', mc: MC.examples, say: `Four examples do not prove a rule. Nothing about ${c.yWhat} forces it: other ${c.who} would scatter.` },
      { t: 'Yes: real data always lie exactly on their line of fit.', mc: MC.onLine, say: 'Real data scatter around a fitted line; points off the line are expected, not mistakes.' },
    ];
    return choice(R, {
      id: `exactSample-${n}`, family: 'exactSample',
      prompt: `For 4 ${c.who}, the ${c.xWhat} and ${c.yWhat} lie exactly on one line, ŷ = ${a} + ${b}${I('x')}. No rule about how ${c.yWhat} is set is given. Do these data show an <b>exact</b> relationship?`,
      board: '',
      solution: ['Data can show a pattern, but a handful of points cannot prove a rule.', `Exact needs a rule from the context (like a fixed price per gallon). Here ${c.yWhat} varies from ${c.one} to ${c.one}: we cannot call it exact from these data.`],
      picture: { g: { ...scatterG({ c, xs, ys }), items: [lineItem('fit', a, b), ...dots(xs, ys)] } },
    }, opts, true);
  }
  const c = ctxPick(R, ['arm', 'foot', 'study', 'growth']);
  const d = until(() => dataSet(R, c, 6, { rLo: 0.7, rHi: 0.97 }), s => true);
  // two cases share an x value with different y values
  const xs = d.xs.slice(), ys = d.ys.slice();
  const j = int(R, 1, 4);
  xs[j + 1] = xs[j]!;
  if (ys[j + 1] === ys[j]) ys[j + 1] = r9(ys[j]! + (c.yStep < 1 ? 1 : 2) * c.yStep * (R() < 0.5 ? 2 : 3));
  const sayS = `Yes. Two ${c.who} with the same ${c.xWhat} have different values of ${c.yWhat}, so no rule fixes y from x: the relationship is statistical.`;
  return choice(R, {
    id: `exactSample-${n}`, family: 'exactSample',
    prompt: `Look at rows ${j + 1} and ${j + 2} of the table. Is the relationship between ${c.xWhat} and ${c.yWhat} <b>exact</b> or <b>statistical</b>?`,
    board: '',
    solution: [`Rows ${j + 1} and ${j + 2}: the same ${c.xWhat}, ${nH(xs[j]!)}, but ${c.yWhat} ${nH(ys[j]!)} and ${nH(ys[j + 1]!)}.`, 'One x with two different y values: no rule fixes y, so it is statistical.'],
    picture: { card: tableCard(c, xs, ys, { ring: [j, j + 1] }) },
  }, KIND_OPTS(false, sayS, sayS), true);
};

// ===================== observed-vs-predicted =====================
interface IntModel { c: RCtx; a: number; b: number; xs: number[]; e: [number, number]; zero?: string }
function intModel(R: () => number): IntModel {
  const k = int(R, 0, 4);
  if (k === 0) return { c: ctxById('study'), a: pick(R, [54, 55, 58]), b: pick(R, [3, 4]), xs: [0, 1, 2, 3, 4, 5, 6, 7, 8], e: [1, 6] };
  if (k === 1) return { c: ctxById('drinks'), a: pick(R, [250, 260, 270]), b: -2, xs: [40, 45, 50, 55, 60, 65, 70, 75, 80, 85], e: [2, 12] };
  if (k === 2) return { c: ctxById('bike'), a: pick(R, [4, 5, 6]), b: pick(R, [4, 5]), xs: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], e: [1, 5] };
  if (k === 3) return { c: ctxById('tree'), a: pick(R, [18, 20, 22]), b: pick(R, [2, 3]), xs: [4, 6, 8, 10, 12, 14, 16, 18, 20], e: [2, 7] };
  return { c: { ...ctxById('study'), id: 'jersey', who: 'players', one: 'player', xWhat: 'jersey number', yWhat: 'points per game', xUnit: '', xOne: '', yUnit: 'points', yOne: 'point', xAxis: 'Jersey number', yAxis: 'Points per game', lo: 0, hi: 50, zeroIn: false, yMax: undefined }, a: pick(R, [11, 12, 14]), b: 0, xs: [3, 8, 11, 15, 21, 24, 30, 33, 42], e: [1, 5], zero: 'jersey' };
}
function intData(R: () => number, m: IntModel, n: number): { xs: number[]; ys: number[] } {
  const xs = shuffle(R, m.xs.slice()).slice(0, n).sort((p, q) => p - q);
  const ys = xs.map(x => m.a + m.b * x + (R() < 0.5 ? -1 : 1) * int(R, m.e[0], m.e[1]));
  return { xs, ys };
}
export const yhatRead: RGen = (R, n) => {
  const m = intModel(R), { c } = m;
  const { xs, ys } = intData(R, m, 7);
  const i = int(R, 1, 5), x0 = xs[i]!, y0 = ys[i]!, v = m.a + m.b * x0;
  const cands: Cand[] = [
    [y0, MC.onLine, `${nH(y0)} is the observed value of that ${c.one} (the dot). The prediction ŷ is the height of the LINE at x = ${nH(x0)}.`],
    [m.b + m.a * x0, MC.swapMB, `The ${nH(m.a)} is the starting value and ${nH(m.b)} the rate: ŷ = ${nH(m.a)} + ${nH(m.b)} × ${nH(x0)}.`],
  ];
  const g = scatterG({ c, xs, ys }, { line: [m.a, m.b], hot: [i], extraY: [v] });
  g.solveItems = [{ kind: 'point', key: 'on', x: x0, y: v, col: 'link' }, { kind: 'seg', key: 'gap', a: [x0, v], b: [x0, y0], col: 'second', w: 4 }];
  const calcLine = m.b === 0 ? `The slope is 0: the line predicts ${nH(m.a)} for EVERY x.` : `ŷ = ${nH(m.a)} ${m.b < 0 ? '−' : '+'} ${nH(Math.abs(m.b))} × ${nH(x0)} = ${ans(nH(v))}`;
  return numItem({
    id: `yhatRead-${n}`, family: 'yhatRead',
    prompt: `${calc(false)}The fitted line for these ${c.who} is ${intModelH(m.a, m.b)}, with ${I('x')} = ${c.xWhat} and ŷ = predicted ${c.yWhat}. The highlighted ${c.one} has ${I('x')} = ${nH(x0)} and ${I('y')} = ${nH(y0)}. What is the <b>predicted</b> value ŷ for this ${c.one}?`,
    board: intModelT(m.a, m.b), unit: c.yUnit,
    solution: m.b === 0 ? [calcLine, `So ŷ = ${ans(nH(v))}, while the observed y is ${nH(y0)}.`] : ['The prediction is the line\'s value at x, not the dot.', calcLine],
    picture: { g },
  }, v, `Yes: ŷ = ${nH(v)}. The dot (y = ${nH(y0)}) is off the line, and that is normal.`, cands, 'Put the x value into the line\'s rule: ŷ = a + b·x.');
};
export const obsPred: RGen = (R, n) => {
  const c = ctxPick(R, ['study', 'arm', 'growth', 'bike', 'foot']);
  const d = dataSet(R, c, 6);
  const xs = d.xs.slice(), ys = d.ys.slice();
  const j = int(R, 1, 3);
  xs[j + 1] = xs[j]!;
  if (ys[j + 1] === ys[j]) ys[j + 1] = r9(ys[j]! + 3 * c.yStep * (c.yStep < 1 ? 2 : 1));
  const A0 = d.A, B0 = d.B;
  const yh = xs.map(x => nH(rd(yhat(A0, B0, x), 1), 1));
  const opts: Opt[] = [
    { t: `${I('y')} is what was measured; ŷ is what the line predicts. They differ because ${c.who} scatter around the line.`, ok: true, say: 'Yes. Observed values scatter; the line gives the typical (predicted) value for each x.' },
    { t: `The ${c.who} whose ${I('y')} and ŷ differ were measured wrong.`, mc: MC.onLine, say: 'Points off the line are expected, not mistakes: the line is a summary of a trend with scatter.' },
    { t: `Rows ${j + 1} and ${j + 2} have the same ${c.xWhat}, so the line could give them different ŷ values.`, mc: MC.notFunction, say: 'The fitted line is a function: one x gives one ŷ. Look: both rows show the same ŷ.' },
    { t: `ŷ is what was measured; ${I('y')} is what the line predicts.`, say: 'The hat means "predicted": ŷ comes from the line. Plain y is the observed value.' },
  ];
  return choice(R, {
    id: `obsPred-${n}`, family: 'obsPred',
    prompt: `The table shows each ${c.one}'s ${c.xWhat}, the observed ${c.yWhat} (${I('y')}) and the value from the fitted line ${mH(A0, B0, c)} (ŷ, rounded to 1 decimal). Which statement is right?`,
    board: mT(A0, B0, c),
    solution: ['y is observed (measured); ŷ ("y-hat") is predicted by the line.', `Rows ${j + 1} and ${j + 2} share x = ${nH(xs[j]!)} and get the same ŷ = ${yh[j]}: the line is a function.`],
    picture: { card: tableCard(c, xs, ys, { yhat: yh }) },
  }, opts);
};

// ===================== fit-by-eye =====================
/** the equation of a drawn line from two grid points P and Q on it (not data points); the window may not start at 0 */
export const eyeEq: RGen = (R, n) => {
  const c = ctxPick(R, ['study', 'bike', 'tree', 'drinks', 'rent']);
  const d = dataSet(R, c, 9, { rLo: 0.85 });
  const g0 = scatterG(d);
  // a slope on the grid: rise / run with the grid steps, close to the least-squares slope
  const sx = g0.x.step, sy = g0.y.step;
  const cands = [] as { b: number; P: [number, number]; Q: [number, number] }[];
  for (let i = 1; i < 6; i++) for (let k = -10; k <= 10; k++) {
    if (!k) continue;
    const run = i * 2 * sx, rise = k * sy, b = rise / run;
    if (Math.abs(b - d.f.b) > Math.abs(d.f.b) * 0.12) continue;
    if (Math.abs(b * 100 - Math.round(b * 100)) > 1e-9) continue;
    // P: a grid x near the left of the data, its y on a grid line near the trend
    const px = Math.ceil(Math.min(...d.xs) / sx) * sx;
    const py = onGrid(d.f.a + d.f.b * px, sy);
    const Q: [number, number] = [r9(px + run), r9(py + rise)];
    if (Q[0] > g0.x.max || Q[1] > g0.y.max || Q[1] < g0.y.min || py < g0.y.min || py > g0.y.max) continue;
    cands.push({ b: r9(b), P: [r9(px), r9(py)], Q });
  }
  if (!cands.length) return eyeEq(R, n + 1000);
  const L = pick(R, cands);
  const a = r9(L.P[1] - L.b * L.P[0]);
  if (!tieFree(a, 2) || !Number.isFinite(a) || Math.abs(a * 100 - Math.round(a * 100)) > 1e-6) return eyeEq(R, n + 1000);
  const edgeY = r9(L.P[1] - L.b * (L.P[0] - g0.x.min));
  const g: RG = {
    ...g0, items: [lineItem('fit', a, L.b, { lo: g0.x.min, hi: g0.x.max, col: 'pick' }), ...g0.items,
      { kind: 'point', key: 'P', x: L.P[0], y: L.P[1], col: 'link', name: 'P' }, { kind: 'point', key: 'Q', x: L.Q[0], y: L.Q[1], col: 'link', name: 'Q' }],
  };
  const cand: [number, number, string | undefined, string][] = [
    [L.b, a, MC.swapMB, 'The first box is the intercept a, the second the slope b.'],
  ];
  if (g0.x.min !== 0 && Math.abs(edgeY - a) > 1e-6) cand.push([edgeY, L.b, MC.windowEdge, `The left edge of this window is x = ${nH(g0.x.min)}, not x = 0. The intercept is the line's value at x = 0: work it out from the slope.`]);
  if (Math.abs(a) > 1e-6) cand.push([0, L.b, MC.origin, 'The line does not have to pass through (0, 0). Use P to find a.']);
  return pairItem({
    id: `eyeEq-${n}`, family: 'eyeEq',
    prompt: `${calc(false)}Someone drew the lavender line by eye. P(${nH(L.P[0])}, ${nH(L.P[1])}) and Q(${nH(L.Q[0])}, ${nH(L.Q[1])}) lie on the line (they are grid points, not data). Write the line's equation.`,
    board: `P(${nT(L.P[0])},\\ ${nT(L.P[1])})\\quad Q(${nT(L.Q[0])},\\ ${nT(L.Q[1])})`,
    solution: [`Slope: b = (${nH(L.Q[1])} − ${nH(L.P[1])}) ÷ (${nH(L.Q[0])} − ${nH(L.P[0])}) = <b>${nH(L.b)}</b>.`, `Intercept: ${nH(L.P[1])} = a + ${L.b < 0 ? `(${nH(L.b)})` : nH(L.b)} × ${nH(L.P[0])}, so a = <b>${nH(a)}</b>.`, `So ŷ = ${ans(nH(a))} + (${ans(nH(L.b))})x.`],
    picture: { g },
  }, a, L.b, { lead: 'ŷ =', op: '+', tail: I('x') }, `Yes: ŷ = ${nH(a)} ${L.b < 0 ? '−' : '+'} ${nH(Math.abs(L.b))}x.`, cand, 'Slope from P to Q (rise ÷ run), then put P into ŷ = a + b·x to find a.');
};
type EyeKind = 'firstLast' | 'most' | 'counts' | 'good';
/** what is wrong with this line of fit? */
export const eyeCritique: RGen = (R, n) => {
  const kind = pick(R, ['firstLast', 'most', 'counts', 'good'] as EyeKind[]);
  const c = ctxPick(R, ['study', 'bike', 'tree', 'drinks', 'arm', 'growth', 'mpg']);
  const made = until(() => {
    const d0 = dataSet(R, c, 9, { rLo: 0.86, rHi: 0.97 });
    const xs = d0.xs.slice(), ys = d0.ys.slice(), N = xs.length;
    let a = 0, b = 0, ok = true;
    if (kind === 'most') {
      // three neighbouring dots made collinear (the middle one moved onto the line through the other two)
      const i = int(R, 0, 3), k = i + 1, j = i + 2;
      const mxk = r9((xs[i]! + xs[j]!) / 2), myk = r9((ys[i]! + ys[j]!) / 2);
      if (onGrid(mxk, c.xStep) !== mxk || onGrid(myk, c.yStep) !== myk || xs.includes(mxk) && mxk !== xs[k]) ok = false;
      xs[k] = mxk; ys[k] = myk;
      b = (ys[j]! - ys[i]!) / (xs[j]! - xs[i]!); a = ys[i]! - b * xs[i]!;
    }
    const f = lsrl(xs, ys);
    const sse0 = sumSq(residuals(xs, ys, f.a, f.b));
    if (kind === 'firstLast') {
      b = (ys[N - 1]! - ys[0]!) / (xs[N - 1]! - xs[0]!); a = ys[0]! - b * xs[0]!;
      const e = residuals(xs, ys, a, b).slice(1, -1), up = e.filter(v => v > 1e-9).length, dn = e.filter(v => v < -1e-9).length;
      ok = Math.max(up, dn) >= 5 && Math.min(up, dn) <= 1 && sumSq(residuals(xs, ys, a, b)) > 2 * sse0 && residuals(xs, ys, a, b).filter(e => Math.abs(e) < 1e-9).length === 2;
    } else if (kind === 'most') {
      const on = xs.filter((x, q) => Math.abs(ys[q]! - a - b * x) < 1e-9).length;
      ok = ok && on === 3 && sumSq(residuals(xs, ys, a, b)) > 3 * sse0 && Math.abs(b - f.b) > Math.abs(f.b) * 0.3 && Math.sign(b) === Math.sign(f.b);
    } else if (kind === 'counts') {
      // turn the least-squares line about the middle dot until the ends disagree: equal counts above / below, wrong tilt
      const mx = xs[Math.floor(N / 2)]!, my = f.a + f.b * mx;
      b = f.b * (R() < 0.5 ? 0.35 : 1.7); a = my - b * mx;
      const e = residuals(xs, ys, a, b);
      const up = e.filter(v => v > 1e-9).length, dn = e.filter(v => v < -1e-9).length;
      const left = e.slice(0, 3), right = e.slice(-3);
      const tilt = (left.every(v => v > 0) && right.every(v => v < 0)) || (left.every(v => v < 0) && right.every(v => v > 0));
      ok = Math.abs(up - dn) <= 1 && tilt && sumSq(e) > 2.5 * sse0 && e.filter(v => Math.abs(v) < 1e-9).length <= 1;
    } else if (kind === 'good') {
      a = f.a; b = f.b;
      const e = residuals(xs, ys, a, b);
      ok = e.filter(v => v > 0).length >= 3 && e.filter(v => v < 0).length >= 3 && e.filter(v => Math.abs(v) < 0.05).length <= 1;
    }
    return { d: { c, xs, ys }, a: r9(a), b: r9(b), ok };
  }, t => t.ok && t.d.xs.every(x => t.a + t.b * x >= 0 && (c.yMax === undefined || t.a + t.b * x <= c.yMax)));
  const { d, a, b } = made;
  const g0 = scatterG(d, { extraY: d.xs.map(x => a + b * x) });
  const g: RG = { ...g0, items: [lineItem('fit', a, b, { lo: g0.x.min, hi: g0.x.max, col: 'pick' }), ...g0.items], solveItems: sticks(d.xs, d.ys, a, b) };
  const right: Record<EyeKind, string> = {
    firstLast: 'It only joins the first and last points: most points sit on one side of it.',
    most: 'It passes through several points but misses the overall trend.',
    counts: 'It has about as many points above as below, but it tilts the wrong way: points are above at one end and below at the other.',
    good: 'Nothing: it follows the trend and stays close to the points all along.',
  };
  const mcOf: Record<EyeKind, string | undefined> = { firstLast: MC.firstLast, most: MC.mostPoints, counts: MC.equalCounts, good: undefined };
  const opts: Opt[] = (Object.keys(right) as EyeKind[]).map(k => ({
    t: right[k], ok: k === kind,
    mc: k === 'good' && kind !== 'good' ? mcOf[kind] : undefined,
    say: k === kind ? 'Yes. Look at the residual sticks: that is what the line gets wrong (or right).' : kind === 'good' ? 'This line is fine: points sit on both sides all along, close to it.' : `Look at where the points sit: ${right[kind].charAt(0).toLowerCase() + right[kind].slice(1)}`,
  }));
  return choice(R, {
    id: `eyeCritique-${n}`, family: 'eyeCritique',
    prompt: `Someone drew the lavender line by eye through these ${d.c.who}. What, if anything, is wrong with it as a line of fit?`,
    board: '',
    solution: ['A good line follows the overall trend and stays close to the points along the WHOLE range: points on both sides at the left, the middle and the right.', `Check the sticks from the line to each point: ${kind === 'good' ? 'they are short and on both sides everywhere.' : right[kind].charAt(0).toLowerCase() + right[kind].slice(1)}`],
    picture: { g },
  }, opts, true);
};

// ===================== predict-from-model =====================
export const predict: RGen = (R, n) => {
  const decimal = R() < 0.65;
  let c: RCtx, A0: number, B0: number, x0: number, xs: number[], ys: number[], y0: number;
  if (decimal) {
    c = ctxPick(R, ['rent', 'arm', 'mpg', 'growth', 'elev', 'screen', 'foot', 'tree']);
    const cc = c;
    const { d, v0 } = until(() => {
      const d = dataSet(R, cc, 8);
      const grid = idx(Math.round((d.xs[6]! - d.xs[1]!) / cc.xStep) + 1).map(k => r9(d.xs[1]! + k * cc.xStep));
      return { d, v0: pickWhere(R, grid, v => !d.xs.includes(v) && tieFree(d.A + d.B * v, 1, 0.05)) };
    }, t => t.v0 !== null);
    A0 = d.A; B0 = d.B; xs = d.xs; ys = d.ys; x0 = v0!;
    y0 = onGrid(yhat(A0, B0, x0) + c.sd * noise(R), c.yStep);
  } else {
    const m = intModel(R);
    if (m.b === 0) return predict(R, n + 1000);
    c = m.c; A0 = m.a; B0 = m.b;
    ({ xs, ys } = intData(R, m, 7));
    x0 = until(() => pick(R, m.xs), v => !xs.includes(v));
    y0 = m.a + m.b * x0 + (R() < 0.5 ? -1 : 1) * int(R, m.e[0], m.e[1]);
  }
  const v = yhat(A0, B0, x0), vr = decimal ? rd(v, 1) : v;
  const mh = decimal ? mH(A0, B0, c) : intModelH(A0, B0), mt = decimal ? mT(A0, B0, c) : intModelT(A0, B0);
  const g = scatterG({ c, xs, ys }, { line: [A0, B0], extraX: [x0], extraY: [v] });
  g.solveItems = [{ kind: 'point', key: 'on', x: x0, y: v, col: 'link' }];
  const cands: Cand[] = [
    [decimal ? rd(B0 + A0 * x0, 1) : B0 + A0 * x0, MC.swapMB, `The ${fx(A0, decimal ? c.da : 0)} is the intercept (the start) and ${fx(B0, decimal ? c.db : 0)} is the slope (multiplied by x).`],
    [y0, MC.onLine, `${nH(y0)} is this ${c.one}'s observed value. The model's prediction comes from the rule.`],
    [decimal ? rd(A0 + B0 * y0, 1) : A0 + B0 * y0, MC.yForX, `x is the ${c.xWhat}, ${xv(c, x0)}: put that in, not the observed ${c.yWhat}.`],
  ];
  return numItem({
    id: `predict-${n}`, family: 'predict',
    prompt: `${calc(decimal)}For ${c.who}, a model is ${mh}, where ${I('x')} = ${c.xWhat} (${c.xUnit === '°F' ? '°F' : c.xUnit}) and ŷ = predicted ${c.yWhat}. ${cap(a1(c.one))} has ${I('x')} = ${nH(x0)}; its actual ${c.yWhat} is ${yv(c, y0)}. What does the model <b>predict</b>?${decimal ? ' Round to the nearest tenth.' : ''}`,
    board: mt, unit: c.money ? 'dollars' : c.yUnit,
    solution: [`Put x = ${nH(x0)} into the model (the observed ${nH(y0)} plays no part).`, `ŷ = ${decimal ? fx(A0, c.da) : nH(A0)} ${B0 < 0 ? '−' : '+'} ${decimal ? fx(Math.abs(B0), c.db) : nH(Math.abs(B0))} × ${nH(x0)} = ${Math.abs(v - vr) > 1e-9 ? `${nH(v)}, about ${ans(nH(vr, 1))}` : ans(nH(v))}.`],
    picture: { g },
  }, vr, `Yes: ŷ = ${nH(vr, 1)}. That is an estimate for a typical ${c.one} with this ${c.xWhat}.`, cands, 'Multiply the slope by x, then add the intercept: ŷ = a + b·x.', { also: [v] });
};
/** fill one ŷ in a table of predictions (integer model, no calculator) */
export const predictTable: RGen = (R, n) => {
  const m = intModel(R);
  if (m.b === 0) return predictTable(R, n + 1000);
  const { c } = m;
  const xs = shuffle(R, m.xs.slice()).slice(0, 5).sort((p, q) => p - q);
  const j = int(R, 0, 4), v = m.a + m.b * xs[j]!;
  const cells = xs.map((x, i) => (i === j ? '?' : nH(m.a + m.b * x)));
  const card = { cols: [{ head: heads(c)[0], cells: xs.map(x => nH(x)) }, { head: 'ŷ', cells }], solveCells: [[1, j, nH(v)]] as [number, number, string][] };
  const cands: Cand[] = [
    [m.b + m.a * xs[j]!, MC.swapMB, `Multiply the slope ${nH(m.b)} by x, then add ${nH(m.a)}.`],
    [m.a - m.b * xs[j]!, MC.dropsSign, `Watch the sign of the slope: ŷ = ${nH(m.a)} ${m.b < 0 ? '−' : '+'} ${nH(Math.abs(m.b))} × ${nH(xs[j]!)}.`],
    [m.a * xs[j]! + m.b, MC.swapMB, 'The slope multiplies x; the intercept is added once.'],
  ];
  return numItem({
    id: `predictTable-${n}`, family: 'predictTable',
    prompt: `${calc(false)}The table lists predictions from ${intModelH(m.a, m.b)} for ${c.who} (${I('x')} = ${c.xWhat}, ŷ = predicted ${c.yWhat}). What number belongs in the cell marked ?`,
    board: intModelT(m.a, m.b), unit: c.yUnit,
    solution: [`Row ${j + 1}: x = ${nH(xs[j]!)}.`, `ŷ = ${nH(m.a)} ${m.b < 0 ? '−' : '+'} ${nH(Math.abs(m.b))} × ${nH(xs[j]!)} = ${ans(nH(v))}`],
    picture: { card },
  }, v, `Yes: ${nH(v)}.`, cands, 'ŷ = a + b·x with this row\'s x.');
};

// ===================== residual-compute =====================
export const residual: RGen = (R, n) => {
  const decimal = R() < 0.55;
  let c: RCtx, A0: number, B0: number, xs: number[], ys: number[], i: number;
  if (decimal) {
    c = ctxPick(R, ['rent', 'arm', 'mpg', 'growth', 'elev', 'screen', 'foot', 'tree', 'bike']);
    const d = until(() => dataSet(R, c, 8), s => residuals(s.xs, s.ys, s.A, s.B).some(e => Math.abs(e) > 1e-9));
    A0 = d.A; B0 = d.B; xs = d.xs; ys = d.ys;
    i = until(() => int(R, 0, 7), k => Math.abs(ys[k]! - yhat(A0, B0, xs[k]!)) > 1e-9 && tieFree(ys[k]! - yhat(A0, B0, xs[k]!), 1, 0.05));
  } else {
    const m = intModel(R);
    c = m.c; A0 = m.a; B0 = m.b; ({ xs, ys } = intData(R, m, 7));
    i = int(R, 0, 6);
    if (R() < 0.15) ys[i] = m.a + m.b * xs[i]!;   // a zero residual now and then
  }
  const v = r9(ys[i]! - yhat(A0, B0, xs[i]!)), vr = decimal ? rd(v, 1) : v;
  const yh = yhat(A0, B0, xs[i]!);
  const g = scatterG({ c, xs, ys }, { line: [A0, B0], hot: [i] });
  g.solveItems = sticks(xs, ys, A0, B0, [i]);
  const cands: Cand[] = [
    [decimal ? rd(-v, 1) : -v, MC.residSign, 'Residual = observed − predicted: y − ŷ. You did ŷ − y.'],
    [decimal ? rd(Math.abs(v), 1) : Math.abs(v), v < 0 ? MC.dropsSign : undefined, 'The size is right, but the point is BELOW the line: the residual is negative.'],
  ];
  return numItem({
    id: `residual-${n}`, family: 'residual',
    prompt: `${calc(decimal)}Model: ${decimal ? mH(A0, B0, c) : intModelH(A0, B0)} (${I('x')} = ${c.xWhat}, ŷ = predicted ${c.yWhat}). The highlighted ${c.one} has ${I('x')} = ${nH(xs[i]!)} and ${I('y')} = ${nH(ys[i]!)}. What is its residual?${decimal ? ' Round to the nearest tenth.' : ''}`,
    board: decimal ? mT(A0, B0, c) : intModelT(A0, B0), unit: c.money ? 'dollars' : c.yUnit,
    solution: [`ŷ = ${decimal ? fx(A0, c.da) : nH(A0)} ${B0 < 0 ? '−' : '+'} ${decimal ? fx(Math.abs(B0), c.db) : nH(Math.abs(B0))} × ${nH(xs[i]!)} = ${nH(yh)}.`, `Residual = y − ŷ = ${nH(ys[i]!)} − ${nH(yh)} = ${decimal && Math.abs(v - vr) > 1e-9 ? `${nH(v)}, about ${ans(nH(vr, 1))}` : ans(nH(v))}.`, v > 0 ? 'Positive: the point is above the line.' : v < 0 ? 'Negative: the point is below the line.' : 'Zero: the point is on the line.'],
    picture: { g },
  }, vr, `Yes: ${sg(vr, 1)}. ${v > 0 ? 'Above the line.' : v < 0 ? 'Below the line.' : 'On the line.'}`, cands, 'First ŷ from the model, then observed minus predicted: y − ŷ.', { also: [v] });
};
/** read a residual off the graph as a vertical distance (integer grid) */
export const residGraph: RGen = (R, n) => {
  const m = intModel(R), { c } = m;
  const { xs, ys } = intData(R, m, 7);
  const i = int(R, 1, 5), v = ys[i]! - (m.a + m.b * xs[i]!);
  const g = scatterG({ c, xs, ys }, { line: [m.a, m.b], hot: [i] });
  // a finer y grid so the gap can be counted: grid step = the gap unit when it fits
  const unit = Math.abs(v) <= 12 && (g.y.max - g.y.min) / 1 <= 20 ? 1 : g.y.step;
  if (unit === 1 && (g.y.max - g.y.min) <= 20) g.y = { ...g.y, step: 1 };
  g.items = [...g.items, { kind: 'text', key: 'Pn', x: xs[i]!, y: ys[i]! + (v > 0 ? 1 : -1) * (g.y.max - g.y.min) * 0.07, text: 'P', col: 'pick' }];
  g.solveItems = sticks(xs, ys, m.a, m.b, [i]);
  if (!g.items.every(it => it.kind !== 'text' || (it.y >= g.y.min && it.y <= g.y.max))) return residGraph(R, n + 1000);
  const cands: Cand[] = [[-v, MC.residSign, 'Observed minus predicted: the dot minus the line. Above the line is positive.'], [Math.abs(v), v < 0 ? MC.dropsSign : undefined, 'P is BELOW the line: its residual is negative.']];
  return numItem({
    id: `residGraph-${n}`, family: 'residGraph',
    prompt: `${calc(false)}The line is ${intModelH(m.a, m.b)}. Point P is the ${c.one} at ${I('x')} = ${nH(xs[i]!)}, ${I('y')} = ${nH(ys[i]!)}. What is P's residual (the signed vertical gap from the line to P)?`,
    board: intModelT(m.a, m.b), unit: c.yUnit,
    solution: [`On the line at x = ${nH(xs[i]!)}: ŷ = ${nH(m.a + m.b * xs[i]!)}.`, `The gap goes straight up or down from the line to P: ${nH(ys[i]!)} − ${nH(m.a + m.b * xs[i]!)} = ${ans(nH(v))}.`],
    picture: { g },
  }, v, `Yes: ${sg(v)}.`, cands, 'Go straight up or down from the line to P: residual = y − ŷ.');
};

// ===================== residual-in-context =====================
export const residMeaning: RGen = (R, n) => {
  const c = ctxPick(R, ['rent', 'study', 'mpg', 'growth', 'drinks', 'bike', 'tree', 'screen']);
  const { d, i } = until(() => {
    const d = dataSet(R, c, 8), es = residuals(d.xs, d.ys, d.A, d.B);
    return { d, i: pickWhere(R, idx(8), k => Math.abs(es[k]!) >= c.yStep * 2 && tieFree(es[k]!, 1, 0.05)) ?? -1 };
  }, t => t.i >= 0);
  const yh = yhat(d.A, d.B, d.xs[i]!), e = rd(d.ys[i]! - yh, 1), size = yv(c, Math.abs(e), c.money ? 0 : 1);
  const more = c.id === 'mpg' ? 'more miles per gallon' : c.id === 'drinks' ? 'more drinks sold' : c.id === 'screen' ? 'more sleep' : `a higher ${c.yWhat}`;
  const opts: Opt[] = [
    { t: `The model ${e > 0 ? 'under' : 'over'}-predicts this ${c.one}: ${c.poss} ${c.yWhat} is ${size} ${e > 0 ? 'above' : 'below'} the prediction.`, ok: true, say: `Yes. A ${e > 0 ? 'positive' : 'negative'} residual means the actual value is ${e > 0 ? 'above' : 'below'} the line.` },
    { t: `The model ${e > 0 ? 'over' : 'under'}-predicts this ${c.one}: ${c.poss} ${c.yWhat} is ${size} ${e > 0 ? 'below' : 'above'} the prediction.`, mc: MC.residSign, say: `Residual = actual − predicted. ${e > 0 ? 'Positive: the actual value is ABOVE the prediction.' : 'Negative: the actual value is BELOW the prediction.'}` },
    { t: `The residual is ${nH(e, 1)}.`, mc: MC.bare, say: `A bare number says nothing about the ${c.one}. Say who, which way and how much, in ${c.money ? 'dollars' : c.yUnit}.` },
    { t: `This ${c.one} has ${more} than the average ${c.one} by ${size}.`, say: 'A residual compares with the prediction for THIS x, not with the overall average.' },
  ];
  return choice(R, {
    id: `residMeaning-${n}`, family: 'residMeaning',
    prompt: `${calc(true)}Model: ${mH(d.A, d.B, c)} (${I('x')} = ${c.xWhat}, ŷ = predicted ${c.yWhat}). One ${c.one} has ${I('x')} = ${nH(d.xs[i]!)} and an actual ${c.yWhat} of ${yv(c, d.ys[i]!)}. Its residual is ${nH(e, 1)}. Which sentence interprets this residual?`,
    board: `e = y - \\hat{y} = ${nT(e, 1)}`,
    solution: [`ŷ = ${nH(yh)}; residual = ${nH(d.ys[i]!)} − ${nH(yh)} ≈ ${nH(e, 1)}.`, `${e > 0 ? 'Positive' : 'Negative'}: the actual ${c.yWhat} is ${e > 0 ? 'above' : 'below'} the prediction by ${size}.`],
    picture: { g: scatterG(d, { line: [d.A, d.B], hot: [i] }) },
  }, opts);
};
/** which case did better than predicted for its x? raw y and residual disagree */
export const residCompare: RGen = (R, n) => {
  const c = ctxPick(R, ['mpg', 'study', 'growth', 'drinks', 'tree']);
  const { d, pair } = until(() => {
    const d = dataSet(R, c, 8);
    const pairs = idx(64).map(k => [Math.floor(k / 8), k % 8] as [number, number]);
    return { d, pair: pickWhere(R, pairs, ([p, q]) => {
      if (p === q) return false;
      const yP = d.ys[p]!, yQ = d.ys[q]!, eP = d.ys[p]! - yhat(d.A, d.B, d.xs[p]!), eQ = d.ys[q]! - yhat(d.A, d.B, d.xs[q]!);
      return yP > yQ && eQ > 0 && eQ > eP + 2 * c.yStep && Math.abs(eP - eQ) > c.sd * 0.5 && tieFree(eP, 1, 0.05) && tieFree(eQ, 1, 0.05);
    }) };
  }, t => t.pair !== null);
  const [p, q] = pair!;
  const eP = rd(d.ys[p]! - yhat(d.A, d.B, d.xs[p]!), 1), eQ = rd(d.ys[q]! - yhat(d.A, d.B, d.xs[q]!), 1);
  const opts: Opt[] = [
    { t: `${c.one[0]!.toUpperCase() + c.one.slice(1)} B: ${c.poss} residual is larger.`, ok: true, say: `Yes. B's residual is ${sg(eQ, 1)}, A's is ${sg(eP, 1)}: compared with its own prediction, B did better.` },
    { t: `${c.one[0]!.toUpperCase() + c.one.slice(1)} A: ${c.poss} ${c.yWhat} is higher.`, mc: MC.rawY, say: `A's ${c.yWhat} is higher, but A also has a different ${c.xWhat}. Compare each with ITS prediction: the residuals.` },
    { t: 'They are equally far above: both are close to the line.', say: `Work out both residuals: ${sg(eP, 1)} and ${sg(eQ, 1)} are not the same.` },
  ];
  return choice(R, {
    id: `residCompare-${n}`, family: 'residCompare',
    prompt: `${calc(true)}Model: ${mH(d.A, d.B, c)} (${I('x')} = ${c.xWhat}). ${c.one[0]!.toUpperCase() + c.one.slice(1)} A: ${I('x')} = ${nH(d.xs[p]!)}, ${c.yWhat} ${yv(c, d.ys[p]!)}. ${c.one[0]!.toUpperCase() + c.one.slice(1)} B: ${I('x')} = ${nH(d.xs[q]!)}, ${c.yWhat} ${yv(c, d.ys[q]!)}. Which ${c.one} is further <b>above</b> the model's prediction for ${c.poss} ${c.xWhat}?`,
    board: mT(d.A, d.B, c),
    solution: [`A: ŷ = ${nH(yhat(d.A, d.B, d.xs[p]!))}, residual ≈ ${nH(eP, 1)}.`, `B: ŷ = ${nH(yhat(d.A, d.B, d.xs[q]!))}, residual ≈ ${nH(eQ, 1)}.`, `B is further above its prediction: compare residuals, not raw ${c.yWhat}s.`],
    picture: { g: scatterG(d, { line: [d.A, d.B], hot: [p, q], names: { [p]: 'A', [q]: 'B' } }) },
  }, opts);
};

// ===================== residual-plot-construct =====================
export const residPoint: RGen = (R, n) => {
  const c = ctxPick(R, ['study', 'arm', 'growth', 'bike', 'foot', 'tree', 'drinks']);
  const d = dataSet(R, c, 6);
  const yh = d.xs.map(x => rd(yhat(d.A, d.B, x), 1));
  const j = until(() => int(R, 0, 5), k => Math.abs(d.ys[k]! - yh[k]!) > 1e-9);
  const e = r9(d.ys[j]! - yh[j]!);
  const cands: [number, number, string | undefined, string][] = [
    [d.xs[j]!, d.ys[j]!, MC.levels, `That is the original point (x, y). A residual plot keeps x but plots the residual y − ŷ up the side.`],
    [d.xs[j]!, yh[j]!, MC.levels, `That is the point on the line (x, ŷ). Plot the residual y − ŷ instead.`],
    [d.xs[j]!, r9(-e), MC.residSign, 'Residual = y − ŷ (observed minus predicted).'],
  ];
  return pairItem({
    id: `residPoint-${n}`, family: 'residPoint',
    prompt: `${calc(false)}The table shows ${c.who}' ${c.xWhat} (${I('x')}), observed ${c.yWhat} (${I('y')}) and ŷ from the fitted line. Which point does row ${j + 1} become on the <b>residual plot</b>?`,
    board: '(x,\\ y - \\hat{y})',
    solution: [`Row ${j + 1}: x = ${nH(d.xs[j]!)}, y = ${nH(d.ys[j]!)}, ŷ = ${nH(yh[j]!)}.`, `Residual: ${nH(d.ys[j]!)} − ${nH(yh[j]!)} = ${nH(e)}.`, `The point is (${ans(nH(d.xs[j]!))}, ${ans(nH(e))}).`],
    picture: { card: tableCard(c, d.xs, d.ys, { yhat: yh.map(v => nH(v, 1)), ring: [j] }) },
  }, d.xs[j]!, e, { lead: '(', op: ',', tail: ')' }, `Yes: (${nH(d.xs[j]!)}, ${nH(e)}).`, cands, 'Keep x; the height is the residual y − ŷ.');
};
/** what a point on / above / below the 0 line of a residual plot means */
export const residZero: RGen = (R, n) => {
  const c = ctxPick(R, ['study', 'arm', 'growth', 'bike', 'tree', 'drinks', 'rent']);
  const want = pick(R, ['zero', 'pos', 'neg'] as const);
  const { d, i } = until(() => {
    const d = dataSet(R, c, 8), e0 = residuals(d.xs, d.ys, d.A, d.B);
    return { d, i: pickWhere(R, [1, 2, 3, 4, 5, 6], k => (want === 'pos' ? e0[k]! > c.sd * 0.4 : want === 'neg' ? e0[k]! < -c.sd * 0.4 : true)) ?? -1 };
  }, t => t.i >= 0);
  const ys = d.ys.slice();
  if (want === 'zero') ys[i] = yhat(d.A, d.B, d.xs[i]!);
  const es = residuals(d.xs, ys, d.A, d.B);
  const gS = scatterG({ c, xs: d.xs, ys }, { line: [d.A, d.B], hot: [i], extraY: [yhat(d.A, d.B, d.xs[i]!)] });
  const gR = residG(c, d.xs, es, { hot: [i], xAxis: gS.x });
  const where = { zero: 'on the 0 line', pos: 'above the 0 line', neg: 'below the 0 line' }[want];
  const opts: Opt[] = [
    { t: `That ${c.one} lies exactly on the fitted line: observed = predicted.`, ok: want === 'zero', say: want === 'zero' ? 'Yes. Residual 0 means y = ŷ: the dot is on the line.' : 'A point on the 0 line would mean that. This one is not on it.' },
    { t: `That ${c.one} is above the fitted line: the model under-predicts it.`, ok: want === 'pos', mc: want === 'neg' ? MC.residSign : undefined, say: want === 'pos' ? 'Yes. Positive residual: actual above predicted.' : 'Above the 0 line would mean a positive residual. Look again.' },
    { t: `That ${c.one} is below the fitted line: the model over-predicts it.`, ok: want === 'neg', mc: want === 'pos' ? MC.residSign : undefined, say: want === 'neg' ? 'Yes. Negative residual: actual below predicted.' : 'Below the 0 line would mean a negative residual. Look again.' },
    { t: want === 'zero' ? `That ${c.one}'s ${c.yWhat} is 0.` : `That ${c.one} has an unusually ${want === 'pos' ? 'high' : 'low'} ${c.yWhat}.`, mc: MC.levels, say: `The vertical axis of a residual plot is the residual, not the ${c.yWhat}.` },
    ...(want === 'zero' ? [{ t: `That ${c.one} was left out when the line was fitted.`, mc: MC.zeroDisconnected, say: 'Every point was used. A residual of 0 just means the line passes exactly through that point.' } as Opt] : []),
  ];
  return choice(R, {
    id: `residZero-${n}`, family: 'residZero',
    prompt: `Left: ${c.who} with their fitted line. Right: the residual plot. The highlighted ${c.one}'s point on the residual plot is <b>${where}</b>. What does that tell you?`,
    board: '',
    solution: ['A residual plot keeps x and plots y − ŷ: the 0 line IS the fitted line.', `${where[0]!.toUpperCase() + where.slice(1)} means the residual is ${want === 'zero' ? '0: on the line' : want === 'pos' ? 'positive: above the line' : 'negative: below the line'}.`],
    picture: { g: gS, g2: gR },
  }, opts, true);
};

// ===================== residual-pattern =====================
type Pat = 'random' | 'curve' | 'fan' | 'one';
/** data with a given residual pattern around a straight-line fit */
/** pattern measures of a residual list (x sorted): curvature (correlation of e with (x - mid)^2), lone (largest / next |e|),
 *  fan (mean |e| of the right third / of the left third, the larger way round) */
export function patternStats(xs: readonly number[], e: readonly number[]): { curve: number; lone: number; fan: number; fanUp: number } {
  const n = xs.length, mid = (xs[0]! + xs[n - 1]!) / 2, q = xs.map(x => (x - mid) ** 2);
  const mq = q.reduce((a, b) => a + b, 0) / n, me = e.reduce((a, b) => a + b, 0) / n;
  const sqe = Math.sqrt(e.reduce((a, v) => a + (v - me) ** 2, 0)), sqq = Math.sqrt(q.reduce((a, v) => a + (v - mq) ** 2, 0));
  const curve = q.reduce((a, v, i) => a + (v - mq) * (e[i]! - me), 0) / (sqe * sqq || 1);
  const abs = e.map(Math.abs), sorted = abs.slice().sort((a, b) => b - a), k = Math.floor(n / 3);
  const avg = (v: number[]) => v.reduce((a, b) => a + b, 0) / v.length;
  const left = avg(abs.slice(0, k)), right = avg(abs.slice(n - k));
  return { curve, lone: sorted[0]! / (sorted[1]! || 1e-9), fan: Math.max(left, right) / (Math.min(left, right) || 1e-9), fanUp: right / (left || 1e-9) };
}
/** data with a given residual pattern around a straight-line fit; each pattern is checked to show ONLY itself */
export function patterned(R: () => number, c: RCtx, kind: Pat, n = 12): { xs: number[]; ys: number[] } {
  return until(() => {
    const xs = spreadXs(R, n, c.lo, c.hi, c.xStep);
    const span = c.hi - c.lo, mid = (c.lo + c.hi) / 2;
    const ys = xs.map(x => {
      const t = (x - mid) / (span / 2);   // -1 .. 1
      let y = c.a + c.b * x;
      if (kind === 'random') y += c.sd * noise(R);
      if (kind === 'curve') y += c.sd * 3.2 * (t * t - 0.33) + c.sd * 0.25 * noise(R);
      if (kind === 'fan') y += c.sd * 2.4 * ((x - c.lo) / span + 0.05) * noise(R);
      if (kind === 'one') y += c.sd * 0.4 * noise(R);
      return onGrid(y, c.yStep);
    });
    if (kind === 'one') { const k = Math.floor(n / 2) + int(R, -1, 1); ys[k] = onGrid(ys[k]! + (R() < 0.5 ? -1 : 1) * c.sd * 4, c.yStep); }
    return { xs, ys };
  }, s => {
    if (new Set(s.xs).size !== n || !plausible(c, s.ys)) return false;
    const f = lsrl(s.xs, s.ys), e = residuals(s.xs, s.ys, f.a, f.b), P = patternStats(s.xs, e);
    if (kind === 'one') return P.lone >= 4 && Math.abs(P.curve) < 0.35 && P.fan < 2;
    if (kind === 'curve') { const ends = [...e.slice(0, 2), ...e.slice(-2)], mids = e.slice(Math.floor(n / 2) - 2, Math.floor(n / 2) + 2); return P.curve > 0.75 && P.lone < 1.6 && P.fan < 1.8 && ends.every(v => v > 0) && mids.every(v => v < 0); }
    if (kind === 'fan') return P.fanUp >= 3.5 && Math.abs(P.curve) < 0.3 && P.lone < 1.6 && e.slice(-5).some(v => v > 0) && e.slice(-5).some(v => v < 0);
    // random: no long runs of one sign, no lone big residual, no fan, no curvature
    let run = 1, maxRun = 1; for (let k = 1; k < n; k++) { run = (e[k]! > 0) === (e[k - 1]! > 0) ? run + 1 : 1; maxRun = Math.max(maxRun, run); }
    return maxRun <= 3 && P.lone < 1.6 && P.fan < 1.8 && Math.abs(P.curve) < 0.3;
  }, 20000);
}
export const pattern: RGen = (R, n) => {
  const kind = pick(R, ['random', 'curve', 'fan', 'one'] as Pat[]);
  const c = ctxPick(R, ['study', 'rent', 'growth', 'bike', 'tree', 'drinks', 'elev']);
  const { xs, ys } = patterned(R, c, kind);
  const f = lsrl(xs, ys), es = residuals(xs, ys, f.a, f.b).map(v => rd(v, 2));
  const gS = scatterG({ c, xs, ys }, { line: [f.a, f.b] });
  const gR = residG(c, xs, es, { xAxis: gS.x });
  const T: Record<Pat, string> = {
    random: 'Random scatter around 0: no evidence against a straight-line model.',
    curve: 'A curved (U or arch) pattern: the data bend, so a straight line is questionable.',
    fan: 'A fan shape: the spread of the errors grows with x, so predictions are less precise there.',
    one: 'One large residual: look into that case; on its own it does not condemn the model.',
  };
  const mcFor = (pick0: Pat): string | undefined => {
    if (pick0 === 'curve' && kind !== 'curve') return MC.anyCurve;
    if (pick0 === 'random' && kind === 'curve') return MC.smallIgnore;
    return undefined;
  };
  const opts: Opt[] = (Object.keys(T) as Pat[]).map(k => ({
    t: T[k], ok: k === kind, mc: k === kind ? undefined : mcFor(k),
    say: k === kind ? 'Yes. That is what this residual plot shows.' : k === 'curve' ? 'Not every pattern is a curve. Look at the shape: is it a bend, a widening fan, or one stray point?' : `Look at the residual plot again: ${T[kind].charAt(0).toLowerCase() + T[kind].slice(1)}`,
  }));
  return choice(R, {
    id: `pattern-${n}`, family: 'pattern',
    prompt: `Left: ${c.who} with their least-squares line. Right: the residual plot. What does the residual plot tell you about the straight-line model?`,
    board: '',
    solution: ['Read the residual plot\'s shape, not just the size of the residuals.', T[kind]],
    picture: { g: gS, g2: gR },
  }, opts, true);
};
/** steep but scattered vs gentle but tight, on the same vertical scale: which is the stronger linear association? */
export const strengthResid: RGen = (R, n) => {
  const c = ctxPick(R, ['bike', 'tree', 'rent']);
  const made = until(() => {
    const steep = dataSet(R, { ...c, a: c.a + c.b * (c.lo + c.hi) / 2 * (1 - 1.6), b: c.b * 1.6, sd: c.sd * 3.2 }, 9, { rLo: 0.55, rHi: 0.8 });
    const gentle = dataSet(R, { ...c, a: c.a + c.b * (c.lo + c.hi) / 2 * (1 - 0.55), b: c.b * 0.55, sd: c.sd * 0.45 }, 9, { rLo: 0.9, rHi: 0.995 });
    return { steep, gentle };
  }, m => Math.abs(m.gentle.f.r) - Math.abs(m.steep.f.r) >= 0.16 && Math.abs(m.steep.f.b) > 2 * Math.abs(m.gentle.f.b) && [m.steep, m.gentle].every(q => q.xs.every(x => q.f.a + q.f.b * x >= 0)));
  const steepFirst = R() < 0.5;
  const P = steepFirst ? made.steep : made.gentle, Q = steepFirst ? made.gentle : made.steep;
  const allY = [...P.ys, ...Q.ys, ...[P, Q].flatMap(q => q.xs.map(x => q.f.a + q.f.b * x))];
  const yAx = axisFor(allY, c.yAxis, { max: c.yMax });
  const mk = (s: typeof P, t: string): RG => { const g = scatterG(s, { line: [s.f.a, s.f.b] }); return { ...g, y: yAx, title: t, solveItems: sticks(s.xs, s.ys, s.f.a, s.f.b) }; };
  const gentleName = steepFirst ? 'B' : 'A', steepName = steepFirst ? 'A' : 'B';
  const opts: Opt[] = [
    { t: `Plot ${gentleName}: its points stay much closer to its line.`, ok: true, say: 'Yes. Strength is how close the points stay to the line (small residuals), not how steep the line is.' },
    { t: `Plot ${steepName}: its line is steeper.`, mc: MC.steepness, say: 'Steepness is the slope: how fast y changes. Strength is how tightly the points follow the line. Compare the residual sticks.' },
    { t: 'They are the same strength: both trends go up.', say: 'Same direction, different strength: one cloud is much tighter around its line.' },
  ];
  return choice(R, {
    id: `strengthResid-${n}`, family: 'strengthResid',
    prompt: `Two groups of ${c.who}, plotted on the same vertical scale, each with its least-squares line. Which plot shows the <b>stronger</b> linear association?`,
    board: '',
    solution: ['Strength = how small the residuals are compared with the spread of the y values.', `Plot ${gentleName}'s points hug its line; plot ${steepName}'s line is steeper but its points scatter far from it.`],
    picture: { g: mk(P, 'Plot A'), g2: mk(Q, 'Plot B') },
  }, opts);
};

export { CTX };
