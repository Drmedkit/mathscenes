// famB.ts: practice families for the middle of "Scatter plots, correlation and the regression line": the least-squares
// criterion, paired lists in a tool, the regression line from technology, slope and intercept in context, r (reading
// it, its sign, its size) and what r cannot show. Pure: no DOM.
import {
  type Cand, type Opt, type PCand, type RCtx, type RG, type RGen, a1, MC, ans, axisFor, calc, choice, ctxPick, dataSet, dots, int,
  numItem, pairItem, pick, residG, scatterG, shuffle, tableCard, yv,
} from './kit';
import { patterned } from './famA';
import { fx, fxT, lsrl, modelH, modelT, nH, nT, onGrid, r9, rd, residuals, sum, sumSq, ti, tieFree, until } from './regMaths';

const I = (s: string) => `<i>${s}</i>`;
const cap = (s: string) => s[0]!.toUpperCase() + s.slice(1);

// ===================== least-squares-criterion =====================
/** integer residuals that add to `total` */
function resList(R: () => number, k: number, total: number, spread: number, zeros = 0): number[] {
  return until(() => {
    const e = Array.from({ length: k }, (_, i) => (i < zeros ? 0 : (R() < 0.5 ? -1 : 1) * int(R, 1, spread)));
    const fix = total - e.reduce((s, v) => s + v, 0);
    e[k - 1] = e[k - 1]! + fix;
    return shuffle(R, e);
  }, e => e.filter(v => v === 0).length === zeros && Math.abs(e[e.length - 1]!) <= spread + 2 && e.some(v => v !== 0));
}
export const sseCompare: RGen = (R, n) => {
  const k = int(R, 4, 5);
  const made = until(() => {
    const zerosP = R() < 0.5 ? 2 : 0;
    const P = resList(R, k, 0, 6, zerosP), Q = resList(R, k, 0, 3);
    return { P, Q, zerosP };
  }, m => Math.abs(sumSq(m.P) - sumSq(m.Q)) >= 6);
  const flip = R() < 0.5;   // which name the better line gets
  const better = sumSq(made.P) < sumSq(made.Q) ? 'P' : 'Q';
  const L1 = flip ? made.Q : made.P, L2 = flip ? made.P : made.Q;
  const name = (orig: 'P' | 'Q') => (flip ? (orig === 'P' ? 'Q' : 'P') : orig);
  const right = name(better), wrong = right === 'P' ? 'Q' : 'P';
  const moreZeros = made.zerosP > 0 ? name('P') : null;
  const opts: Opt[] = [
    { t: `Line ${right}`, ok: true, say: `Yes. Square each residual and add: line ${right} has the smaller sum of squared residuals.` },
    { t: `Line ${wrong}`, say: `Square the residuals first: line ${wrong}'s sum of squares is larger.` },
    { t: 'They fit equally well: both residual sums are 0.', mc: MC.signedTotal, say: 'Signed residuals cancel: a sum of 0 says nothing about fit. Square them first.' },
    ...(moreZeros === wrong ? [{ t: `Line ${wrong}: it passes exactly through more of the points.`, mc: MC.mostPoints, say: 'Hitting a few points exactly does not make a line fit. The other residuals of that line are big.' } as Opt] : []),
  ];
  const sP = sumSq(L1), sQ = sumSq(L2);
  return choice(R, {
    id: `sseCompare-${n}`, family: 'sseCompare',
    prompt: `${calc(false)}The table lists the residuals of the same ${k} data points from two candidate lines, P and Q. Which line fits better by the <b>least-squares</b> criterion?`,
    board: '\\min \\sum e^2',
    solution: [`Line P: ${L1.map(v => `(${nH(v)})²`).join(' + ')} = ${nH(sP)}.`, `Line Q: ${L2.map(v => `(${nH(v)})²`).join(' + ')} = ${nH(sQ)}.`, `The smaller sum of squares wins: line ${right}.`],
    picture: { card: { cols: [{ head: 'Point', cells: L1.map((_, i) => String(i + 1)) }, { head: 'Line P', cells: L1.map(v => nH(v)) }, { head: 'Line Q', cells: L2.map(v => nH(v)) }] } },
  }, opts, true);
};
export const sseCompute: RGen = (R, n) => {
  const dec = R() < 0.4, k = int(R, 3, 5);
  const e = until(() => Array.from({ length: k }, () => (R() < 0.5 ? -1 : 1) * (dec ? rd(int(R, 1, 30) / 10, 1) : int(R, 1, 9))), es => es.some(v => v < 0) && es.some(v => v > 0) && Math.abs(sum(es)) > 1e-9);
  const v = sumSq(e);
  const cands: Cand[] = [
    [sum(e), MC.signedTotal, 'That is the signed sum: positive and negative residuals cancel. Square each one first.'],
    [r9(e.reduce((s, x) => s + Math.abs(x), 0)), undefined, 'That adds the sizes. Least squares adds the SQUARES of the residuals.'],
    [r9(sum(e) ** 2), undefined, 'Square each residual, then add (not add, then square).'],
  ];
  return numItem({
    id: `sseCompute-${n}`, family: 'sseCompute',
    prompt: `${calc(dec)}A line's residuals for ${k} points are ${e.map(x => nH(x)).join(', ')}. What is its sum of squared residuals?`,
    board: '\\sum e^2 = \\,?',
    solution: [`Square each: ${e.map(x => nH(r9(x * x))).join(', ')}.`, `Add: ${ans(nH(v))}`],
    picture: { card: { cols: [{ head: 'e', cells: e.map(x => nH(x)) }, { head: 'e²', cells: e.map(() => '?') }], solveCells: e.map((x, i) => [1, i, nH(r9(x * x))] as [number, number, string]) } },
  }, v, `Yes: ${nH(v)}.`, cands, 'Square every residual (a negative squared is positive), then add.');
};

// ===================== enter-paired-data =====================
export const pairedLists: RGen = (R, n) => {
  const c = ctxPick(R, ['study', 'arm', 'drinks', 'mpg', 'growth', 'bike', 'tree']);
  const kind = pick(R, ['shift', 'sort', 'ok'] as const);
  const d = dataSet(R, c, int(R, 6, 7));
  // the table order: not sorted by x (as collected)
  const order = until(() => shuffle(R, d.xs.map((_, i) => i)), o => o.some((v, i) => i > 0 && v < o[i - 1]!));
  const X = order.map(i => d.xs[i]!), Y = order.map(i => d.ys[i]!);
  let L1 = X.map(v => nH(v)), L2 = Y.map(v => nH(v)), k = -1;
  if (kind === 'shift') { k = int(R, 1, X.length - 2); L2 = [...Y.slice(0, k), ...Y.slice(k + 1)].map(v => nH(v)).concat(['']); }
  if (kind === 'sort') {
    const xs = X.slice().sort((p, q) => p - q), ys = Y.slice().sort((p, q) => p - q);
    // the independent sort must break pairs
    const broken = xs.some((x, i) => d.ys[d.xs.indexOf(x)] !== ys[i]);
    if (!broken) return pairedLists(R, n + 1000);
    L1 = xs.map(v => nH(v)); L2 = ys.map(v => nH(v));
  }
  const opts: Opt[] = [
    { t: 'Nothing is wrong: every row keeps an x with its own y.', ok: kind === 'ok', mc: kind === 'shift' ? MC.indepCols : kind === 'sort' ? MC.sortsLists : undefined, say: kind === 'ok' ? 'Yes. Row by row, each L1 value sits next to its own L2 value.' : 'Check row by row: some x values now sit next to another case\'s y.' },
    { t: 'A y value was skipped in L2, so from that row down the pairs are wrong.', ok: kind === 'shift', say: kind === 'shift' ? `Yes. L2 lost row ${k + 1}'s value, so every y below moved up one row, and L2 is one entry short.` : 'Count the entries: both lists are the same length.' },
    { t: 'Each list was sorted on its own, so the pairs are broken.', ok: kind === 'sort', say: kind === 'sort' ? 'Yes. Sorting one list on its own moves y values away from their x. Sort the pairs together, or not at all.' : 'Compare with the table: the lists are in the table\'s order.' },
    { t: 'The lists only need the same numbers as the table, in any order.', mc: MC.indepCols, say: 'Each row is one case: its x and its y must stay side by side.' },
  ];
  return choice(R, {
    id: `pairedLists-${n}`, family: 'pairedLists',
    prompt: `${calc(true)}Data for ${X.length} ${c.who} (${c.xWhat}, ${c.yWhat}): ${X.map((x, i) => `(${nH(x)}, ${nH(Y[i]!)})`).join(', ')}. The card shows the lists L1 and L2 as entered for LinReg. What is wrong, if anything?`,
    board: '',
    solution: ['Check the lists row by row against the pairs: each row is one case.', kind === 'ok' ? 'Every row matches a pair.' : kind === 'shift' ? `Row ${k + 1}: L2 has the next case's y; the lists have different lengths.` : 'The x values and the y values were sorted separately: rows no longer match the pairs.'],
    picture: { card: { title: 'STAT EDIT', cols: [{ head: 'L1', cells: L1 }, { head: 'L2', cells: L2 }] } },
  }, opts, true);
};

// ===================== technology-lsrl =====================
type Form = 'abx' | 'axb' | 'desmos' | 'sheet';
/** output lines of a regression in a given tool format (4 decimals, TI style without the leading zero) */
function outLines(form: Form, a: number, b: number, r: number): { title: string; lines?: string[]; cols?: { head: string; cells: string[] }[] } {
  if (form === 'abx') return { title: 'LinReg', lines: ['y=a+bx', `a=${ti(a)}`, `b=${ti(b)}`, `r²=${ti(r * r)}`, `r=${ti(r)}`] };
  if (form === 'axb') return { title: 'LinReg', lines: ['y=ax+b', `a=${ti(b)}`, `b=${ti(a)}`, `r²=${ti(r * r)}`, `r=${ti(r)}`] };
  if (form === 'desmos') return { title: 'y₁ ~ mx₁ + b', lines: [`m = ${nH(b, 4)}`, `b = ${nH(a, 4)}`, `r² = ${nH(r * r, 4)}`, `r = ${nH(r, 4)}`] };
  return { title: 'Spreadsheet', cols: [{ head: 'Function', cells: ['SLOPE', 'INTERCEPT', 'RSQ', 'CORREL'] }, { head: 'Value', cells: [nH(b, 4), nH(a, 4), nH(r * r, 4), nH(r, 4)] }] };
}
/** a data set whose 4-decimal output rounds to 2 decimals without a tie */
const tidy = (v: number) => tieFree(rd(v, 4), 2, 0.05) && tieFree(v, 2, 0.05);
export const readOutput: RGen = (R, n) => {
  const form = pick(R, ['abx', 'axb', 'axb', 'desmos', 'sheet'] as Form[]);
  const c = ctxPick(R, ['study', 'arm', 'growth', 'elev', 'screen', 'foot', 'bike', 'tree', 'drinks', 'mpg']);
  const d = until(() => dataSet(R, c, 9), s => tidy(s.f.a) && tidy(s.f.b) && Math.abs(rd(s.f.a, 2)) !== Math.abs(rd(s.f.b, 2)));
  const a = rd(d.f.a, 2), b = rd(d.f.b, 2);
  const out = outLines(form, d.f.a, d.f.b, d.f.r);
  const cands: PCand[] = [[b, a, MC.swapAB, form === 'axb' ? 'In LinReg(ax+b), a is the SLOPE and b is the intercept: the letters swap roles.' : 'The intercept goes in the first box and the slope (the number times x) in the second.']];
  return pairItem({
    id: `readOutput-${n}`, family: 'readOutput',
    prompt: `${calc(true)}Regression output for ${c.yWhat} (${I('y')}) against ${c.xWhat} (${I('x')}) of 9 ${c.who}. Write the least-squares line, coefficients rounded to 2 decimal places.`,
    board: '',
    solution: [form === 'axb' ? 'This screen is y = ax + b: a is the slope, b the intercept.' : form === 'abx' ? 'This screen is y = a + bx: a is the intercept, b the slope.' : form === 'desmos' ? 'Desmos: m is the slope, b the intercept.' : 'SLOPE is the slope, INTERCEPT the intercept.', `Rounded: intercept ${ans(fx(a, 2))}, slope ${ans(fx(b, 2))}.`],
    picture: { g: scatterG(d), card: out },
  }, a, b, { lead: 'ŷ =', op: '+', tail: I('x') }, `Yes: ŷ = ${fx(a, 2)} ${b < 0 ? '−' : '+'} ${fx(Math.abs(b), 2)}x.`, cands, 'Find which output number is the slope (it multiplies x) and which is the intercept.');
};
export const lsrlData: RGen = (R, n) => {
  const c = ctxPick(R, ['study', 'bike', 'tree', 'growth', 'arm', 'drinks']);
  const k = int(R, 5, 6);
  const d = until(() => dataSet(R, c, k, { rLo: 0.8 }), s => {
    const back = lsrl(s.ys, s.xs);
    return tidy(s.f.a) && tidy(s.f.b) && Math.abs(rd(s.f.b, 2)) > 0 && Math.abs(rd(back.a, 2) - rd(s.f.a, 2)) > 0.05;
  });
  const a = rd(d.f.a, 2), b = rd(d.f.b, 2), back = lsrl(d.ys, d.xs);
  const cands: PCand[] = [
    [rd(back.a, 2), rd(back.b, 2), MC.swapLists, `That regresses ${c.xWhat} on ${c.yWhat}: the lists are swapped. Put ${c.xWhat} in L1 (x) and ${c.yWhat} in L2 (y).`],
    [b, a, MC.swapAB, 'The intercept goes in the first box and the slope in the second.'],
  ];
  return pairItem({
    id: `lsrlData-${n}`, family: 'lsrlData',
    prompt: `${calc(true)}Use a calculator, Desmos or a spreadsheet: find the least-squares line predicting ${c.yWhat} (${I('y')}) from ${c.xWhat} (${I('x')}) for these ${k} ${c.who}. Round the coefficients to 2 decimal places.`,
    board: '',
    solution: [`Enter ${c.xWhat} as x (L1) and ${c.yWhat} as y (L2), keeping each row's pair together, and run the linear regression.`, `ŷ = ${ans(fx(a, 2))} + (${ans(fx(b, 2))})x`],
    picture: { g: scatterG(d), card: tableCard(c, d.xs, d.ys) },
  }, a, b, { lead: 'ŷ =', op: '+', tail: I('x') }, `Yes: ŷ = ${fx(a, 2)} ${b < 0 ? '−' : '+'} ${fx(Math.abs(b), 2)}x.`, cands, `Regress ${c.yWhat} (y) on ${c.xWhat} (x).`, 0.0051);
};

// ===================== slope-interpret =====================
export const slopeSentence: RGen = (R, n) => {
  const c = ctxPick(R);
  const d = dataSet(R, c, 9);
  const B = d.B, size = yv(c, Math.abs(B), c.db), up = B > 0;
  const hi = up ? 'higher' : 'lower';
  const unitPart = c.per.split(' of ')[0]!, byOne = /^\d/.test(unitPart) ? unitPart : `one ${unitPart}`;
  const opts: Opt[] = [
    { t: `For each additional ${c.per}, the predicted ${c.yWhat} is ${size} ${hi}, on average.`, ok: true, say: 'Yes: a predicted (average) change per one unit of x, with units.' },
    { t: `For every single ${c.one}, each additional ${c.per} means ${a1(c.yWhat)} exactly ${size} ${hi}.`, mc: MC.slopeExact, say: `The slope describes the trend, not each ${c.one}: individual ${c.who} scatter around it.` },
    { t: `Increasing ${a1(c.one)}'s ${c.xWhat} by ${byOne} causes ${c.poss} ${c.yWhat} to ${up ? 'rise' : 'drop'} by ${size}.`, mc: MC.causation, say: 'These are observational data: the slope describes an association, not a cause.' },
    { t: `The predicted ${c.yWhat} is ${yv(c, d.A, c.da)} for each additional ${c.per}.`, mc: MC.swapMB, say: `${fx(d.A, c.da)} is the intercept, not the change per unit. The change per unit is the slope.` },
  ];
  return choice(R, {
    id: `slopeSentence-${n}`, family: 'slopeSentence',
    prompt: `For ${c.source}, the least-squares line is ${modelH(fx(d.A, c.da), fx(B, c.db))}, where ${I('x')} = ${c.xWhat} (${c.xUnit}) and ŷ = predicted ${c.yWhat}. Which sentence interprets the <b>slope</b>?`,
    board: modelT(fxT(d.A, c.da), fxT(B, c.db)),
    solution: [`The slope ${fx(B, c.db)} is the change in ŷ per one unit of x: ${perUnitText(c)}.`, `In words: predicted, on average, and ${hi} because the slope is ${up ? 'positive' : 'negative'}.`],
    picture: { g: scatterG(d, { line: [d.A, B] }) },
  }, opts);
};
const perUnitText = (c: RCtx) => `${c.money ? 'dollars' : c.yUnit} per ${c.per.replace(/ of .*/, '')}`;
export const slopeChange: RGen = (R, n) => {
  const c = ctxPick(R, ['rent', 'study', 'mpg', 'growth', 'elev', 'screen', 'bike', 'tree', 'drinks']);
  const d = dataSet(R, c, 9);
  const [x1, x2] = until(() => [onGrid(c.lo + R() * (c.hi - c.lo), c.xStep), onGrid(c.lo + R() * (c.hi - c.lo), c.xStep)] as [number, number], ([p, q]) => q - p >= (c.hi - c.lo) * 0.25);
  const dx = r9(x2 - x1), v = r9(d.B * dx);
  const cands: Cand[] = [
    [d.B, undefined, `That is the change for ONE unit. From ${nH(x1)} to ${nH(x2)} is ${nH(dx)} units.`],
    [r9(-v), MC.dropsSign, `The slope is ${d.B < 0 ? 'negative' : 'positive'}: the prediction goes ${d.B < 0 ? 'down' : 'up'}.`],
    [r9(d.A + d.B * dx), MC.swapMB, 'The intercept plays no part in a CHANGE: only slope × change in x.'],
  ];
  return numItem({
    id: `slopeChange-${n}`, family: 'slopeChange',
    prompt: `${calc(true)}For ${c.source}, ${modelH(fx(d.A, c.da), fx(d.B, c.db))} (${I('x')} = ${c.xWhat}, ŷ = predicted ${c.yWhat}). By how much does the <b>predicted</b> ${c.yWhat} change from ${I('x')} = ${nH(x1)} to ${I('x')} = ${nH(x2)}? (A decrease is negative.)`,
    board: modelT(fxT(d.A, c.da), fxT(d.B, c.db)), unit: c.money ? 'dollars' : c.yUnit,
    solution: [`Change in x: ${nH(x2)} − ${nH(x1)} = ${nH(dx)}.`, `Change in ŷ = slope × change in x = ${fx(d.B, c.db)} × ${nH(dx)} = ${ans(nH(v))}`],
    picture: { g: scatterG(d, { line: [d.A, d.B] }) },
  }, v, `Yes: ${nH(v)} ${c.money ? 'dollars' : c.yUnit}, on average.`, cands, 'Multiply the slope by how far x moves.');
};

// ===================== intercept-interpret =====================
export const interceptMeaning: RGen = (R, n) => {
  const zin = R() < 0.4;
  const c = ctxPick(R, zin ? ['study', 'elev'] : ['rent', 'arm', 'mpg', 'foot', 'tree', 'drinks']);
  // 'outside' cases: x = 0 lies at least as far below the data as the data are wide x 0.15 (far, not one step away)
  const d = until(() => dataSet(R, c, 9), s => (zin ? Math.min(...s.xs) === 0 : Math.min(...s.xs) >= 0.15 * (Math.max(...s.xs) - Math.min(...s.xs)) && Math.min(...s.xs) >= 2));
  const lo = Math.min(...d.xs), hi = Math.max(...d.xs);
  const A0 = fx(d.A, c.da);
  const opts: Opt[] = [
    { t: `It is the predicted ${c.yWhat} for ${c.zeroWord}, and that is meaningful here: x = 0 is inside the data.`, ok: zin, mc: zin ? undefined : MC.intercept, say: zin ? 'Yes. x = 0 was observed, so the intercept is a real prediction.' : `x = 0 is not in the data (${nH(lo)} to ${nH(hi)}): reading ${A0} as a real value is an extrapolation.` },
    { t: `It would be the predicted ${c.yWhat} for ${c.zeroWord}, but x = 0 is far outside the data, so it has no real meaning here.`, ok: !zin, say: zin ? 'Here x = 0 IS in the data: the intercept is a fair prediction.' : 'Yes. The intercept only anchors the line; x = 0 is far from every case measured.' },
    { t: `It is the ${c.yWhat} of the first ${c.one} measured.`, mc: MC.intercept, say: 'The intercept is not an observed value: it is the line\'s value at x = 0.' },
    { t: `It is how much the predicted ${c.yWhat} changes for each additional ${c.per}.`, mc: MC.swapMB, say: 'That is the slope. The intercept is the prediction at x = 0.' },
  ];
  return choice(R, {
    id: `interceptMeaning-${n}`, family: 'interceptMeaning',
    prompt: `For ${c.source}, the least-squares line is ${modelH(A0, fx(d.B, c.db))}, with ${I('x')} = ${c.xWhat} (${c.xUnit}), observed from ${nH(lo)} to ${nH(hi)}. What does the intercept ${A0} mean here?`,
    board: modelT(fxT(d.A, c.da), fxT(d.B, c.db)),
    solution: [`The intercept is ŷ at x = 0: ${c.zeroWord}.`, zin ? 'x = 0 is in the data, so it is a meaningful prediction.' : `x = 0 is outside the data (${nH(lo)} to ${nH(hi)}): no real meaning here.`],
    picture: { g: scatterG(d, { line: [d.A, d.B], zeroX: zin }) },
  }, opts);
};
export const whichCoef: RGen = (R, n) => {
  const c = ctxPick(R, ['rent', 'study', 'mpg', 'growth', 'elev', 'bike', 'tree']);
  const d = until(() => dataSet(R, c, 8), s => Math.abs(s.A - s.B) > 0.5 && Math.abs(s.A + s.B - s.A) > 1e-9);
  const askZero = R() < 0.5;
  const sA = fx(d.A, c.da), sB = fx(d.B, c.db), sAB = nH(r9(d.A + d.B), 2);
  const opts: Opt[] = [
    { t: sA, ok: askZero, mc: askZero ? undefined : MC.swapMB, say: askZero ? `Yes: at x = 0 the slope term is 0, so ŷ = ${sA}.` : `${sA} is the intercept: the prediction at x = 0, not a change.` },
    { t: sB, ok: !askZero, mc: askZero ? MC.swapMB : undefined, say: askZero ? `${sB} is the slope: the change per unit of x. At x = 0, ŷ = ${sA}.` : `Yes: the slope ${sB} is the change in ŷ per one unit of x.` },
    { t: sAB, say: `${sAB} is the prediction at x = 1. Neither question asks for that.` },
  ];
  return choice(R, {
    id: `whichCoef-${n}`, family: 'whichCoef',
    prompt: `${calc(false)}${modelH(sA, sB)} (${I('x')} = ${c.xWhat} in ${c.xUnit}, ŷ = predicted ${c.yWhat}). Which number gives ${askZero ? `the predicted ${c.yWhat} for ${c.zeroWord}` : `the predicted change in ${c.yWhat} for each additional ${c.per}`}?`,
    board: modelT(fxT(d.A, c.da), fxT(d.B, c.db)),
    solution: ['In ŷ = a + bx: a is ŷ at x = 0 (the intercept), b is the change in ŷ per unit of x (the slope).', askZero ? `So the prediction at x = 0 is ${sA}.` : `So the change per unit is ${sB}.`],
  }, opts);
};

// ===================== r-obtain =====================
export const readR: RGen = (R, n) => {
  const form = pick(R, ['abx', 'axb', 'desmos', 'sheet'] as Form[]);
  const c = ctxPick(R);
  const d = until(() => dataSet(R, c, 10, { rLo: 0.55, rHi: 0.97 }), s => tieFree(rd(s.f.r, 4), 2, 0.05) && Math.abs(rd(s.f.r * s.f.r, 2) - Math.abs(rd(s.f.r, 2))) > 0.04 && Math.abs(rd(s.f.b, 2) - rd(s.f.r, 2)) > 0.04);
  const r = rd(d.f.r, 2), out = outLines(form, d.f.a, d.f.b, d.f.r);
  const cands: Cand[] = [
    [rd(d.f.r * d.f.r, 2), MC.summaries, 'That is r², not r. r is the line labelled r (or CORREL).'],
    [rd(d.f.b, 2), MC.summaries, 'That is the slope. r has its own line in the output.'],
    [Math.abs(r), r < 0 ? MC.dropsSign : undefined, 'Keep the sign: this association is negative, so r is negative.'],
  ];
  return numItem({
    id: `readR-${n}`, family: 'readR',
    prompt: `${calc(true)}Regression output for the ${c.yWhat} and ${c.xWhat} of 10 ${c.who}. What is the correlation coefficient ${I('r')}? Round to 2 decimal places.`,
    board: '', unit: '',
    solution: [`The output lists r² = ${nH(d.f.r * d.f.r, 4)} and r = ${nH(d.f.r, 4)}: r has its own line, and its sign matches the slope.`, `r ≈ ${ans(fx(r, 2))}`],
    picture: { g: scatterG(d), card: out },
  }, r, `Yes: r ≈ ${fx(r, 2)}.`, cands, 'Find the line labelled r (CORREL in a spreadsheet), not r².');
};
export const rData: RGen = (R, n) => {
  const c = ctxPick(R, ['study', 'bike', 'tree', 'growth', 'arm', 'drinks', 'screen', 'mpg']);
  const k = int(R, 5, 7);
  const d = until(() => dataSet(R, c, k, { rLo: 0.6, rHi: 0.98 }), s => tieFree(s.f.r, 2, 0.05) && Math.abs(rd(s.f.r * s.f.r, 2) - Math.abs(rd(s.f.r, 2))) > 0.04);
  const r = rd(d.f.r, 2);
  const cands: Cand[] = [[rd(d.f.r * d.f.r, 2), MC.summaries, 'That is r². Take r itself (with its sign).'], [r9(-r), undefined, 'Check the sign against the plot.']];
  return numItem({
    id: `rData-${n}`, family: 'rData',
    prompt: `${calc(true)}Use a calculator, Desmos or a spreadsheet: find the correlation coefficient ${I('r')} between ${c.xWhat} and ${c.yWhat} for these ${k} ${c.who}. Round to 2 decimal places.`,
    board: '', unit: '',
    solution: [`Enter the pairs (x = ${c.xWhat}, y = ${c.yWhat}) and run the linear regression with r shown.`, `r ≈ ${ans(fx(r, 2))} (${r < 0 ? 'negative: the points go down' : 'positive: the points go up'}).`],
    picture: { g: scatterG(d), card: tableCard(c, d.xs, d.ys) },
  }, r, `Yes: r ≈ ${fx(r, 2)}.`, cands, 'Run the linear regression; read r (not r², not the slope).', { tol: 0.0051 });
};
const UNIT_SWITCH: { pair: string; what: string; from: string; to: string; k: number }[] = [
  { pair: 'foot length and height of adults', what: 'both lengths are', from: 'inches', to: 'centimeters', k: 2.54 },
  { pair: 'arm span and height of adults', what: 'both lengths are', from: 'inches', to: 'centimeters', k: 2.54 },
  { pair: 'weight and highway gas mileage of cars', what: 'the weights are', from: 'pounds', to: 'kilograms', k: 0.4536 },
  { pair: 'daily high temperature and number of hot drinks sold', what: 'the temperatures are', from: 'degrees Fahrenheit', to: 'degrees Celsius', k: 0.5556 },
  { pair: 'commute distance and commute time', what: 'the distances are', from: 'miles', to: 'kilometers', k: 1.609 },
];
export const rUnits: RGen = (R, n) => {
  const u = pick(R, UNIT_SWITCH);
  const r = rd((R() < 0.5 ? -1 : 1) * (0.55 + R() * 0.4), 2);
  const rr = u.pair.includes('mileage') || u.pair.includes('drinks') ? -Math.abs(r) : Math.abs(r);
  const conv = rd(rr * u.k, 2);
  const opts: Opt[] = [
    { t: `r stays ${fx(rr, 2)}: r has no units, so changing units does not change it.`, ok: true, say: 'Yes. r is computed from standardized values: rescaling a variable leaves it unchanged.' },
    { t: `r becomes ${fx(conv, 2)}: multiply r by the conversion factor.`, mc: MC.rUnits, say: 'r is not measured in any unit, so there is nothing to convert.' },
    { t: `r stays ${fx(rr, 2)} ${u.from}, or ${fx(conv, 2)} ${u.to}.`, mc: MC.rUnits, say: 'r has no units at all: it is a pure number between −1 and 1.' },
    { t: 'r cannot be known until the data are re-entered in the new units.', say: 'No re-entering needed: rescaling a variable never changes r.' },
  ];
  return choice(R, {
    id: `rUnits-${n}`, family: 'rUnits',
    prompt: `For the ${u.pair}, technology gives ${I('r')} = ${fx(rr, 2)}. Then ${u.what} converted from ${u.from} to ${u.to}. What is ${I('r')} now?`,
    board: `r = ${nT(rr, 2)}`,
    solution: ['r measures how tightly points follow a line, on standardized scales: it has no units.', `Changing the units of a variable stretches its axis but does not change r: still ${fx(rr, 2)}.`],
  }, opts);
};

// ===================== r-direction =====================
export const rSign: RGen = (R, n) => {
  const none = R() < 0.25;
  const c = ctxPick(R, none ? ['study', 'tree', 'bike', 'arm'] : undefined);
  const d = none ? until(() => dataSet(R, { ...c, a: c.a + c.b * (c.lo + c.hi) / 2, b: 0, sd: c.sd * 1.5 }, 10, { rLo: 0, rHi: 0.12 }), s => true) : dataSet(R, c, 10, { rLo: 0.75, rHi: 0.97 });
  const r = rd(d.f.r, 2);
  const other = none ? rd(0.7 + R() * 0.2, 2) : rd(R() < 0.5 ? 0.04 : -0.06, 2);
  const opts: Opt[] = none ? [
    { t: `r = ${fx(r, 2)}`, ok: true, say: 'Yes: no clear uphill or downhill pattern, so r is near 0.' },
    { t: `r = ${fx(other, 2)}`, say: 'An r that size needs a clear uphill pattern. These points show none.' },
    { t: `r = ${fx(-other, 2)}`, say: 'An r that size needs a clear downhill pattern. These points show none.' },
  ] : [
    { t: `r = ${fx(r, 2)}`, ok: true, say: `Yes: the points go ${r < 0 ? 'down' : 'up'} to the right and stay fairly close to a line.` },
    { t: `r = ${fx(-r, 2)}`, say: `The sign of r is the direction: these points go ${r < 0 ? 'DOWN' : 'UP'} to the right.` },
    { t: `r = ${fx(other, 2)}`, mc: r < 0 ? MC.negWeak : undefined, say: r < 0 ? 'A downhill pattern is still an association: negative r can be strong. These points follow a line closely.' : 'r near 0 means no linear pattern. These points clearly rise.' },
  ];
  return choice(R, {
    id: `rSign-${n}`, family: 'rSign',
    prompt: `Which correlation coefficient matches this scatter plot of ${c.xWhat} and ${c.yWhat} for 10 ${c.who}?`,
    board: 'r = \\,?',
    solution: ['Sign of r = direction: uphill positive, downhill negative.', '|r| = how tightly the points follow a straight line (near 1 tight, near 0 no linear pattern).'],
    picture: { g: scatterG(d) },
  }, opts);
};
export const rMismatch: RGen = (R, n) => {
  const c = ctxPick(R, ['drinks', 'mpg', 'elev', 'screen', 'study', 'tree', 'bike', 'growth']);
  const d = dataSet(R, c, 10, { rLo: 0.8, rHi: 0.97 });
  const r = rd(d.f.r, 2), mismatch = R() < 0.6, report = mismatch ? -r : r;
  const opts: Opt[] = [
    { t: `The sign is wrong: these points go ${r < 0 ? 'down' : 'up'} to the right, so r must be ${r < 0 ? 'negative' : 'positive'}.`, ok: mismatch, say: mismatch ? 'Yes. The sign of r always matches the direction of the pattern (and of the slope).' : `The report's sign already matches: ${fx(report, 2)}.` },
    { t: 'Nothing: the reported r matches the plot.', ok: !mismatch, say: mismatch ? `Check the direction: the points go ${r < 0 ? 'down' : 'up'}, but the report gives r = ${fx(report, 2)}.` : 'Yes: the sign and the size fit the plot.' },
    { t: 'A downhill pattern cannot have r this far from 0: negative associations are weak.', mc: MC.negWeak, say: 'Negative r can be just as strong as positive r: −0.9 is as strong as 0.9.' },
    { t: `It means ${Math.round(Math.abs(report) * 100)}% of the points lie on the line, which is too many.`, mc: MC.rPercent, say: 'r is not a percent of points or of correct predictions.' },
  ];
  return choice(R, {
    id: `rMismatch-${n}`, family: 'rMismatch',
    prompt: `A report shows this scatter plot of ${c.xWhat} and ${c.yWhat} for 10 ${c.who} and says ${I('r')} = ${fx(report, 2)}. What is wrong with the report, if anything?`,
    board: `r = ${nT(report, 2)}`,
    solution: [`The points go ${r < 0 ? 'down' : 'up'} to the right: r must be ${r < 0 ? 'negative' : 'positive'}.`, mismatch ? `The report's ${fx(report, 2)} has the wrong sign.` : 'The report has the right sign.'],
    picture: { g: scatterG(d) },
  }, opts, true);
};

// ===================== r-strength =====================
export const rStrongest: RGen = (R, n) => {
  const strongest = R() < 0.65;
  const rs = until(() => {
    const top = rd(0.8 + R() * 0.17, 2), mid = rd(0.45 + R() * 0.2, 2), low = rd(0.05 + R() * 0.2, 2), mid2 = rd(0.3 + R() * 0.15, 2);
    // signs: the strongest is negative more often than not (the signed-order trap)
    return [-top, mid, low * (R() < 0.5 ? -1 : 1), mid2 * (R() < 0.5 ? -1 : 1)].map(v => rd(v, 2));
  }, v => {
    const abs = v.map(Math.abs).sort((p, q) => q - p);
    return abs[0]! - abs[1]! >= 0.15 && abs[abs.length - 2]! - abs[abs.length - 1]! >= 0.1 && new Set(abs).size === 4;
  });
  if (!strongest || R() < 0.3) rs[0] = Math.abs(rs[0]!) * (R() < 0.3 ? 1 : -1);
  const target = strongest ? rs.reduce((p, q) => (Math.abs(q) > Math.abs(p) ? q : p)) : rs.reduce((p, q) => (Math.abs(q) < Math.abs(p) ? q : p));
  const signedPick = strongest ? Math.max(...rs) : Math.min(...rs);
  const opts: Opt[] = rs.map(v => ({
    t: `r = ${fx(v, 2)}`, ok: v === target,
    mc: v !== target && v === signedPick ? MC.signedOrder : undefined,
    say: v === target ? `Yes: |${fx(v, 2)}| = ${fx(Math.abs(v), 2)} is the ${strongest ? 'largest' : 'smallest'} size.` : `Strength is the size |r|, ignoring the sign: compare ${rs.map(x => fx(Math.abs(x), 2)).join(', ')}.`,
  }));
  return choice(R, {
    id: `rStrongest-${n}`, family: 'rStrongest',
    prompt: `Four data sets have these correlation coefficients. Which one shows the <b>${strongest ? 'strongest' : 'weakest'}</b> linear association?`,
    board: rs.map(v => `r = ${nT(v, 2)}`).join('\\qquad '),
    solution: [`Strength = |r|: ${rs.map(x => fx(Math.abs(x), 2)).join(', ')}.`, `The ${strongest ? 'largest' : 'smallest'} is ${fx(Math.abs(target), 2)}, so r = ${fx(target, 2)}.`],
  }, opts, true);
};
export const steepTight: RGen = (R, n) => {
  const c = ctxPick(R, ['bike', 'tree', 'rent']);
  const made = until(() => {
    const steep = dataSet(R, { ...c, a: c.a + c.b * (c.lo + c.hi) / 2 * (1 - 1.6), b: c.b * 1.6, sd: c.sd * 3.2 }, 9, { rLo: 0.5, rHi: 0.8 });
    const gentle = dataSet(R, { ...c, a: c.a + c.b * (c.lo + c.hi) / 2 * (1 - 0.55), b: c.b * 0.55, sd: c.sd * 0.45 }, 9, { rLo: 0.9, rHi: 0.995 });
    return { steep, gentle };
  }, m => Math.abs(m.gentle.f.r) - Math.abs(m.steep.f.r) >= 0.16 && Math.abs(m.steep.f.b) > 2 * Math.abs(m.gentle.f.b));
  const steepFirst = R() < 0.5;
  const P = steepFirst ? made.steep : made.gentle, Q = steepFirst ? made.gentle : made.steep;
  const yAx = axisFor([...P.ys, ...Q.ys], c.yAxis, { max: c.yMax });
  const rP = rd(P.f.r, 2), rQ = rd(Q.f.r, 2);
  const opts: Opt[] = [
    { t: `A: r = ${fx(rP, 2)}; B: r = ${fx(rQ, 2)}`, ok: true, say: 'Yes. The tighter cloud has the larger r, however steep or gentle its trend.' },
    { t: `A: r = ${fx(rQ, 2)}; B: r = ${fx(rP, 2)}`, mc: MC.steepness, say: 'r measures how closely the points follow a line, not how steep the line is.' },
    { t: `A: r = ${fx(rP, 2)}; B: r = ${fx(rP, 2)}`, say: 'The two clouds are not equally tight: one hugs its trend much more closely.' },
  ];
  return choice(R, {
    id: `steepTight-${n}`, family: 'steepTight',
    prompt: `Two groups of ${c.who}, on the same scales. One plot has ${I('r')} = ${fx(rP, 2)}, the other ${I('r')} = ${fx(rQ, 2)}. Which matches which?`,
    board: '',
    solution: ['|r| is about how tightly the points follow a straight line; steepness is the slope.', `Plot ${steepFirst ? 'B' : 'A'} is tighter, so it has the larger r: A has ${fx(rP, 2)}, B has ${fx(rQ, 2)}.`],
    picture: { g: { ...scatterG(P), y: yAx, title: 'Plot A' }, g2: { ...scatterG(Q), y: yAx, title: 'Plot B' } },
  }, opts);
};

// ===================== r-linear-only =====================
/** points exactly on a curve, symmetric about its middle (so r = 0 exactly) */
function curveOf(R: () => number): { what: string; xName: string; yName: string; xs: number[]; f: (x: number) => number } {
  const k = int(R, 0, 2);
  if (k === 0) { const m = int(R, 2, 4), a = int(R, 1, 3); return { what: `points on the curve y = ${a === 1 ? '' : a}x² for x = −${m} to ${m}`, xName: 'x', yName: 'y', xs: Array.from({ length: 2 * m + 1 }, (_, i) => i - m), f: x => a * x * x }; }
  if (k === 1) { const v = pick(R, [32, 48, 64, 80]), T = v / 16; return { what: `the height (feet) of a ball thrown straight up at ${v} ft/s, against time (seconds) until it lands`, xName: 'Time (s)', yName: 'Height (ft)', xs: Array.from({ length: 2 * T + 1 }, (_, i) => i / 2), f: t => r9(v * t - 16 * t * t) }; }
  const p0 = int(R, 4, 7), top = int(R, 8, 15);
  return { what: `a store's weekly profit (hundreds of $) against the price it charges ($), from $${p0 - 3} to $${p0 + 3}`, xName: 'Price ($)', yName: 'Profit ($100s)', xs: Array.from({ length: 7 }, (_, i) => p0 - 3 + i), f: p => r9(-(p - p0) * (p - p0) + top) };
}
export const rZero: RGen = (R, n) => {
  const cv = curveOf(R);
  const ys = cv.xs.map(cv.f), f = lsrl(cv.xs, ys);
  const r = rd(f.r, 2);
  const g: RG = { x: axisFor(cv.xs, cv.xName), y: axisFor(ys, cv.yName), items: dots(cv.xs, ys) };
  const opts: Opt[] = [
    { t: 'There is no LINEAR association, but y depends on x completely: the points lie on a curve.', ok: true, say: 'Yes. r only measures straight-line association. A perfect curve can have r = 0.' },
    { t: 'There is no relationship between x and y.', mc: MC.rAny, say: 'Look at the plot: every point lies on one curve. r = 0 only rules out a straight-line pattern.' },
    { t: 'Knowing x tells you nothing about y.', mc: MC.rAny, say: 'Knowing x tells you y exactly here, through the curve. r just cannot see curves.' },
    { t: 'The calculator is wrong: points on one curve must have r = 1.', say: 'r = 1 needs points on a straight line with positive slope. These are on a curve, symmetric about the middle.' },
  ];
  return choice(R, {
    id: `rZero-${n}`, family: 'rZero',
    prompt: `${cap(cv.what)}: technology gives ${I('r')} = ${fx(Math.abs(r) < 0.005 ? 0 : r, 2)}. What can you conclude?`,
    board: `r = ${nT(Math.abs(r) < 0.005 ? 0 : r, 2)}`,
    solution: ['r measures only how close the points are to a straight line.', 'These points fall on a curve: y depends on x exactly, yet r = 0. No LINEAR association, not no relationship.'],
    picture: { g },
  }, opts);
};
export const highRCurve: RGen = (R, n) => {
  const c = ctxPick(R, ['rent', 'growth', 'bike', 'elev', 'tree']);
  const { xs, ys } = until(() => patterned(R, c, 'curve'), s => Math.abs(lsrl(s.xs, s.ys).r) >= 0.9 && tieFree(lsrl(s.xs, s.ys).r, 2));
  const f = lsrl(xs, ys), r = rd(f.r, 2), es = residuals(xs, ys, f.a, f.b).map(v => rd(v, 2));
  const gS = scatterG({ c, xs, ys }, { line: [f.a, f.b] });
  const opts: Opt[] = [
    { t: 'No: the residual plot curves, so a straight line is the wrong form; a high r does not fix that.', ok: true, say: 'Yes. Always look at the residual plot: r alone cannot show whether a line is the right model.' },
    { t: `Yes: r = ${fx(r, 2)} is very close to ${r < 0 ? '−1' : '1'}.`, mc: MC.highR, say: 'A curved pattern can still give r close to ±1. The residual plot shows the line misses in a system.' },
    { t: 'Yes: the residuals are small compared with the values themselves.', mc: MC.smallIgnore, say: 'Small residuals with a clear pattern still mean the line is systematically off.' },
    { t: 'No: a line is only a good model when r is exactly 1.', say: 'A good linear model needs patternless residuals, not r = 1. Real data always scatter.' },
  ];
  return choice(R, {
    id: `highRCurve-${n}`, family: 'highRCurve',
    prompt: `For ${c.who}, technology gives ${I('r')} = ${fx(r, 2)} for ${c.yWhat} against ${c.xWhat}. Left: the data and the least-squares line. Right: the residual plot. Is a straight line a good model for these data?`,
    board: '',
    solution: [`r = ${fx(r, 2)} only says the points are close to SOME straight line.`, 'The residual plot shows a clear curve (positive at the ends, negative in the middle): the line is the wrong form.'],
    picture: { g: gS, g2: residG(c, xs, es, { xAxis: gS.x }) },
  }, opts);
};

