// famB.ts: stage-2 families of "Quadratic and exponential regression": QuadReg (predict, precision, lists, 3 chosen
// points), the ln response scale, ExpReg (output, predict, a zero response, two tools), re-coding years, interpreting
// fitted parameters, comparing self-fitted families, solving model = target, reporting in context, square-root models.
// Technology output is shown as a TI-84 screen (coefficients rounded to 4 decimal places). Pure: no DOM.
import { noise } from '../linear-regression/regMaths';
import {
  type Card, type NCtx, type NG, type NGen, type NItem, type Opt, type PCand, CTX, EXP, I, MC, QUAD, a1, ans, calc, cap, choice, ctxById, ctxOf, curve, dataOf, int,
  numItem, pairItem, pick, residPlot, scatter, tableCard, until, xv, yv, axisFor,
} from './nkit';
import { modelHT, truckTruth } from './famA';
import {
  type Model, evalM, expH, expReg, expRegOrig, expSolve, expT, fx, linReg, nH, nT, patterned, patternless, pwrReg, quadReg, quadSolve, r9, rd, resid, sci, sig, sqrtReg,
  sse, tieFree, ti,
} from './nlMaths';

const out = (title: string, lines: string[]): Card => ({ title, lines });
const t4 = (v: number) => ti(v, 4);
const tie4 = (...vs: number[]) => vs.every(v => tieFree(v, 4));
const mid = (xs: readonly number[], R: () => number) => { const i = int(R, 1, xs.length - 3); return r9((xs[i]! + xs[i + 1]!) / 2); };
const dpOf = (c: NCtx) => (c.money ? 0 : c.yd === 0 ? 1 : 1);
const dpWord = (d: number) => (d === 0 ? 'the nearest whole number' : d === 1 ? 'the nearest tenth' : d === 2 ? 'the nearest hundredth' : `${d} decimal places`);
const quadOut = (A: number, B: number, C: number, r2: number) => out('QuadReg', ['y=ax²+bx+c', `a=${t4(A)}`, `b=${t4(B)}`, `c=${t4(C)}`, `R²=${t4(r2)}`]);
const expOut = (a: number, b: number, r2: number, r: number) => out('ExpReg', ['y=a*b^x', `a=${t4(a)}`, `b=${t4(b)}`, `r²=${t4(r2)}`, `r=${t4(r)}`]);
const quadData = (R: () => number, ids = QUAD) => { const c = ctxOf(R, ids); return dataOf(R, c, { truth: c.id === 'truck' ? truckTruth(R) : undefined }); };
/** signed term text: " − 5.3" / " + 5.3" */
const term = (v: string) => (v.startsWith('−') ? ` − ${v.slice(1)}` : ` + ${v}`);

// ===================== quadratic-regression =====================
export const quadPredict: NGen = (R, n) => {
  const t = until(() => {
    const d = quadData(R), q = quadReg(d.xs, d.ys), x0 = mid(d.xs, R), dp = dpOf(d.c);
    const A = rd(q.a, 4), B = rd(q.b, 4), C = rd(q.c, 4), v = A * x0 * x0 + B * x0 + C, vf = q.a * x0 * x0 + q.b * x0 + q.c;
    return { d, q, x0, dp, A, B, C, v, vf };
  }, t => tie4(t.q.a, t.q.b, t.q.c, t.q.r2) && tieFree(t.v, t.dp, 0.1) && tieFree(t.vf, t.dp, 0.1) && rd(t.v, t.dp) === rd(t.vf, t.dp) && t.q.r2 > 0.9);
  const { d, q, x0, dp, A, B, C, v, vf } = t, c = d.c, V = rd(v, dp);
  return numItem({
    id: `quadPredict-${n}`, family: 'quadPredict',
    prompt: `${calc(true)}QuadReg on the ${d.xs.length} measurements of ${c.yWhat} (${c.source}) gives the output shown. Use the coefficients as shown to predict the ${c.yWhat} at ${xv(c, x0)}. Round to ${dpWord(dp)}.`,
    board: `\\hat{y} = ax^2 + bx + c`, unit: c.money ? 'dollars' : c.yUnit,
    solution: [`ŷ = ${nH(A)}(${nH(x0)})² ${term(nH(B)).trim()}(${nH(x0)}) ${term(nH(C)).trim()}.`, `ŷ ≈ ${nH(v, 4)}, so about ${ans(nH(V, dp))}${c.money ? ' dollars' : ` ${c.yUnit}`}.`],
    picture: { g: scatter(d, { curves: [{ m: q.model, key: 'fit', solve: true }] }), card: quadOut(q.a, q.b, q.c, q.r2) },
  }, V, `Right: about ${yv(c, V, dp)} at ${xv(c, x0)}.`, [[rd(C, dp), undefined, 'That is c alone: the value at x = 0. Put the x-value into every term.']],
  'Put the x-value into ax² + bx + c with the three coefficients from the screen.', { tol: 0.5 * 10 ** -dp + 1e-9, also: [rd(vf, dp)] });
};
/** a suspension-bridge cable: a tiny a needs scientific notation */
export const quadPrecision: NGen = (R, n) => {
  const t = until(() => {
    const span = pick(R, [1600, 1800, 2000]), step = span / 5, xs = Array.from({ length: 11 }, (_, i) => -span + step * i);
    const a = (0.9 + R() * 0.5) * 1e-4, b = (R() - 0.5) * 6e-3, c0 = int(R, 8, 20);
    const ys = xs.map(x => rd(a * x * x + b * x + c0 + 0.6 * noise(R), 1));
    const q = quadReg(xs, ys);
    const rA = sig(q.a, 3), rB = sig(q.b, 3), rC = rd(q.c, 1);
    const maxDiff = (f: (x: number) => number) => Math.max(...xs.map(x => Math.abs(f(x) - (q.a * x * x + q.b * x + q.c))));
    const good = maxDiff(x => rA * x * x + rB * x + rC);
    const w2 = maxDiff(x => rd(q.a, 2) * x * x + rd(q.b, 2) * x + rd(q.c, 2)), w4 = maxDiff(x => rd(q.a, 4) * x * x + rd(q.b, 4) * x + rd(q.c, 1));
    return { span, xs, ys, q, rA, rB, rC, good, w2, w4 };
  }, t => t.good < 0.5 && t.w4 > 5 && t.w2 > 50 && Math.abs(t.q.b) > 2e-4 && rd(t.q.a, 4) !== 0 && tieFree(t.q.c, 1));
  const { span, xs, ys, q, rA, rB, rC } = t;
  const sA = sci(q.a, 3), sB = sci(q.b, 3);
  const right = `ŷ = ${sA.h}<i>x</i>²${term(sB.h)}<i>x</i>${term(nH(rC, 1))}`;
  const opts: Opt[] = [
    { t: right, ok: true, say: 'Right. Three significant digits keep every prediction within a foot of the stored model.' },
    { t: `ŷ = ${fx(q.a, 2)}<i>x</i>²${term(fx(q.b, 2))}<i>x</i>${term(fx(q.c, 2))}`, mc: MC.precision, say: 'Rounding every coefficient to 2 places, like a final answer, wipes out the x² term: the cable becomes flat. Keep enough digits while you use the model.' },
    { t: `ŷ = ${fx(q.a, 4)}<i>x</i>²${term(fx(q.b, 4))}<i>x</i>${term(nH(rC, 1))}`, mc: MC.precision, say: `At 4 decimal places a keeps only one digit. At x = ${nH(span)} feet that misses by many feet.` },
    { t: `ŷ = ${sA.h.split(' ×')[0]}<i>x</i>²${term(sB.h.split(' ×')[0]!)}<i>x</i>${term(nH(rC, 1))}`, say: 'The powers of ten were dropped: a is about ten thousand times too big.' },
  ];
  return choice(R, {
    id: `quadPrecision-${n}`, family: 'quadPrecision',
    prompt: `${calc(true)}The height of a bridge cable above the road (feet) was measured at 11 points, <i>x</i> = −${nH(span)} to ${nH(span)} feet from the middle (lowest reading ${nH(Math.min(...ys), 1)} feet). QuadReg gives the output shown. Which recorded equation reproduces the stored model’s predictions to within 1 foot across the bridge?`,
    board: '',
    solution: [`a ≈ ${sA.h} is tiny, but x² reaches ${nH(span * span)}: a needs significant digits, not decimal places.`, `Three significant digits for a and b keep every prediction within 1 foot: ${right}.`],
    picture: { g: { ...scatter({ c: { ...ctxById('ball'), xAxis: 'Distance from the middle (feet)', yAxis: 'Cable height (feet)' } as NCtx, xs, ys }) }, card: out('QuadReg', ['y=ax²+bx+c', `a=${sci(q.a, 5).ti}`, `b=${sci(q.b, 5).ti}`, `c=${t4(q.c)}`, `R²=${ti(q.r2, 6)}`]) },
  }, opts);
};
export const quadLists: NGen = (R, n) => {
  const d0 = quadData(R), c = d0.c, xFirst = R() < 0.5;
  const keep = d0.xs.map((_, i) => i).filter(i => d0.xs.length <= 9 || !(i === 1 || (d0.xs.length > 10 && i === d0.xs.length - 2)));
  const d = { ...d0, xs: keep.map(i => d0.xs[i]!), ys: keep.map(i => d0.ys[i]!) };
  const L = (x: boolean) => (x === xFirst ? 'L1' : 'L2');
  const opts: Opt[] = [
    { t: `QuadReg ${L(true)}, ${L(false)}`, ok: true, say: `Right. The x-list (${c.xWhat}) comes first, then the y-list (${c.yWhat}).` },
    { t: `QuadReg ${L(false)}, ${L(true)}`, mc: MC.swapLists, say: `That predicts the ${c.xWhat} from the ${c.yWhat}. QuadReg takes the x-list first.` },
    { t: `LinReg(ax+b) ${L(true)}, ${L(false)}`, say: 'LinReg fits a line. We want a quadratic.' },
    { t: `ExpReg ${L(true)}, ${L(false)}`, say: 'ExpReg fits an exponential. We want a quadratic.' },
  ];
  const yMax = Math.max(...d.ys);
  return choice(R, {
    id: `quadLists-${n}`, family: 'quadLists',
    prompt: `You typed ${d.xs.length} measurements (${c.source}) into two lists: one holds the ${c.xWhat} (${c.xUnit}), the other the ${c.yWhat} (largest: ${yv(c, yMax)}). Which command fits a quadratic that predicts the ${c.yWhat} from the ${c.xWhat}?`,
    board: '\\text{QuadReg}\\ \\square,\\ \\square',
    solution: [`The ${c.xWhat} values are in ${L(true)}, the ${c.yWhat} values in ${L(false)}.`, `QuadReg takes the x-list first, then the y-list: QuadReg ${L(true)}, ${L(false)}.`],
    picture: { card: { cols: xFirst ? [{ head: 'L1', cells: d.xs.map(v => nH(v)) }, { head: 'L2', cells: d.ys.map(v => nH(v)) }] : [{ head: 'L1', cells: d.ys.map(v => nH(v)) }, { head: 'L2', cells: d.xs.map(v => nH(v)) }] } },
  }, opts);
};
/** the exact parabola through 3 chosen points vs QuadReg */
function through3(px: number[], py: number[]): Model {
  const [x1, x2, x3] = px as [number, number, number], [y1, y2, y3] = py as [number, number, number];
  const a = ((y3 - y1) / (x3 - x1) - (y2 - y1) / (x2 - x1)) / (x3 - x2), b = (y2 - y1) / (x2 - x1) - a * (x1 + x2), c = y1 - a * x1 * x1 - b * x1;
  return { fam: 'quad', p: [a, b, c] };
}
export const quad3pts: NGen = (R, n) => {
  const t = until(() => {
    const d = quadData(R), N = d.xs.length, idx = [0, int(R, 2, N - 3), N - 1];
    const J = through3(idx.map(i => d.xs[i]!), idx.map(i => d.ys[i]!)), q = quadReg(d.xs, d.ys);
    const yr = Math.max(...d.ys) - Math.min(...d.ys);
    const gap = Math.max(...d.xs.map(x => Math.abs(evalM(J, x) - evalM(q.model, x))));
    return { d, idx, J, q, ok: sse(J, d.xs, d.ys) > 1.5 * q.sse && gap > 0.04 * yr };
  }, t => t.ok);
  const { d, idx, J, q } = t, c = d.c, qA = R() < 0.5;
  const opts: Opt[] = [
    { t: `Curve ${qA ? 'A' : 'B'}: it makes the sum of squared residuals over all ${d.xs.length} points as small as possible`, ok: true, say: 'Right. QuadReg uses every point; it need not pass through any of them.' },
    { t: `Curve ${qA ? 'B' : 'A'}: it passes exactly through three of the data points`, mc: MC.threePts, say: 'Passing through three chosen points ignores the others. Least squares weighs all the misses.' },
    { t: 'Either one: any parabola through data points is a regression', mc: MC.threePts, say: 'A regression is the one curve with the smallest sum of squared residuals over all the points.' },
  ];
  return choice(R, {
    id: `quad3pts-${n}`, family: 'quad3pts',
    prompt: `${d.xs.length} measurements of ${c.yWhat} (${c.source}). Jordan picks the points at ${idx.map(i => xv(c, d.xs[i]!)).join(', ')} and finds the exact parabola through them. The calculator runs QuadReg. Which curve is the quadratic regression?`,
    board: '',
    solution: ['A regression curve makes Σ(y − ŷ)² over ALL points as small as possible.', `Jordan's parabola hits three points but misses the rest more: Σe² ≈ ${nH(sse(J, d.xs, d.ys), 1)} against ${nH(q.sse, 1)} for QuadReg.`],
    picture: { g: scatter(d, { curves: qA ? [{ m: q.model, key: 'cA', col: 'link', name: 'A' }, { m: J, key: 'cB', col: 'water', name: 'B' }] : [{ m: J, key: 'cA', col: 'water', name: 'A' }, { m: q.model, key: 'cB', col: 'link', name: 'B' }] }) },
  }, opts);
};

// ===================== log-response-scale =====================
export const lnStep: NGen = (R, n) => {
  const t = until(() => {
    const b = pick(R, [2, 3, 1.5, 0.5, 0.8, 1.2, 2.5, 4, 0.6, 1.25]), a = pick(R, [2, 3, 5, 8, 10, 40, 64, 100, 250]);
    const ys = [0, 1, 2, 3, 4].map(k => r9(a * b ** k));
    return { a, b, ys };
  }, t => t.ys.every(y => rd(y, 4) === y) && tieFree(Math.log(t.b), 3) && Math.min(...t.ys) >= 0.5);
  const { b, ys } = t, L = Math.log(b), Lr = rd(L, 3);
  return numItem({
    id: `lnStep-${n}`, family: 'lnStep',
    prompt: `${calc(true)}Each row multiplies y by ${nH(b)}. The calculator made the ln <i>y</i> column. By how much does ln <i>y</i> change from one row to the next? Round to 3 decimal places.`,
    board: `y:\\ ${ys.map(v => nT(v)).join(',\\ ')}`, unit: '',
    solution: [`ln ${nH(ys[1]!)} − ln ${nH(ys[0]!)} = ${nH(Math.log(ys[1]!), 4)} − ${nH(Math.log(ys[0]!), 4)}.`, `Every step is the same: ln ${nH(b)} ≈ ${ans(nH(Lr, 3))}. Equal factors in y become equal steps in ln y.`],
    picture: { card: { cols: [{ head: 'x', cells: ['0', '1', '2', '3', '4'] }, { head: 'y', cells: ys.map(v => nH(v)) }, { head: 'ln y', cells: ys.map(v => fx(Math.log(v), 4)) }] } },
  }, Lr, `Right: about ${nH(Lr, 3)} every row. A factor of ${nH(b)} in y is a step of ln ${nH(b)} in ln y.`,
  [[b, undefined, `That is the factor on y. On the ln scale a factor turns into a step: subtract two neighbouring ln y values.`], [rd(b - 1, 3), undefined, 'Subtract two neighbouring ln y values.']],
  'Subtract two neighbouring values of the ln y column.', { tol: 0.0011 });
};
export const lnNonpos: NGen = (R, n) => {
  const neg = R() < 0.4;
  const c = neg ? ctxById('decay') : ctxOf(R, ['drug', 'cells']);
  const d = dataOf(R, c, { xs: c.id === 'cells' ? [0, 1, 2, 3, 4, 5, 6] : c.xs(R).slice(0, 8) });
  const i = c.id === 'cells' ? 0 : d.xs.length - 1, bad = neg ? -int(R, 2, 5) : 0;
  const ys = d.ys.slice();
  if (c.id === 'decay' && !neg) ys[i] = 0; else ys[i] = bad;
  if (c.id === 'decay') for (let k = 0; k < ys.length - 1; k++) ys[k] = Math.max(3, rd(ys[k]! / 6, 0));
  const why = neg ? 'after the background was subtracted, the count rate came out negative' : c.id === 'cells' ? 'the first count was below what the counter can detect and was recorded as 0' : c.id === 'drug' ? 'the last sample was below what the lab can detect and was recorded as 0' : 'the last reading was recorded as 0';
  const lnWrong = neg ? `ln(${nH(bad)}) = −ln ${nH(-bad)} ≈ −${nH(rd(Math.log(-bad), 3), 3)}` : 'ln 0 = 0';
  const opts: Opt[] = [
    { t: `An error: ln is defined only for y > 0, so ln(${nH(bad)}) has no value`, ok: true, say: 'Right. The calculator shows ERR:DOMAIN. No logarithm exists for 0 or a negative number.' },
    { t: lnWrong, mc: MC.logNonpos, say: 'The natural log is only defined for positive numbers. ln of 0 or a negative value does not exist.' },
    { t: neg ? `ln(${nH(bad)}) = 1` : 'ln 0 = 1', mc: MC.logNonpos, say: 'ln 1 = 0, and ln of 0 or a negative value does not exist at all.' },
    { t: 'A very large negative number, which ExpReg can still use', mc: MC.logNonpos, say: 'ln y falls without end as y shrinks toward 0, but at 0 itself there is no value: the calculator stops with an error.' },
  ];
  return choice(R, {
    id: `lnNonpos-${n}`, family: 'lnNonpos',
    prompt: `${cap(c.yWhat)} data (${c.source}, ${i === 0 ? 'the last reading' : 'the first reading'} ${yv(c, ys[i === 0 ? ys.length - 1 : 0]!)}): ${why}. You make a column of ln <i>y</i> on the calculator. What happens in the row at ${xv(c, d.xs[i]!)}, with <i>y</i> = ${nH(bad)}?`,
    board: `\\ln(${nT(bad)})`,
    solution: ['The natural log ln y is defined only for y > 0.', `y = ${nH(bad)} is not positive: the calculator gives an error (ERR:DOMAIN).`],
    picture: { card: tableCard({ c, xs: d.xs, ys }, { ring: [i] }) },
  }, opts);
};
export const lnRelative: NGen = (R, n) => {
  const t = until(() => {
    const Y1 = pick(R, [80, 100, 120, 150, 200, 250]), k = pick(R, [5, 8, 10]), m = pick(R, [6, 8, 10, 12, 15]);
    const Y2 = Y1 * k, which = R() < 0.5 ? 1 : 2, Y = which === 1 ? Y1 : Y2;
    const v = Math.log(Y) - Math.log(Y - m);
    return { Y1, Y2, m, which, Y, v };
  }, t => tieFree(t.v, 3) && t.m < t.Y1 / 4);
  const { Y1, Y2, m, which, Y, v } = t, V = rd(v, 3);
  const other = which === 1 ? Math.log(Y2) - Math.log(Y2 - m) : Math.log(Y1) - Math.log(Y1 - m);
  return numItem({
    id: `lnRelative-${n}`, family: 'lnRelative',
    prompt: `${calc(true)}A model of video views (thousands) misses two days by the same amount: ${nH(m)} thousand below the observed ${nH(Y1)} and ${nH(Y2)} thousand. What is the residual on the ln scale, ln <i>y</i> − ln ŷ, on the day with <i>y</i> = ${nH(Y)}? Round to 3 decimal places.`,
    board: `\\ln ${nT(Y)} - \\ln ${nT(Y - m)}`, unit: '',
    solution: [`ŷ = ${nH(Y)} − ${nH(m)} = ${nH(Y - m)}.`, `ln ${nH(Y)} − ln ${nH(Y - m)} ≈ ${ans(nH(V, 3))}. The same miss of ${nH(m)} is ${which === 1 ? 'larger' : 'smaller'} on the ln scale (${nH(rd(other, 3), 3)} on the other day): it measures relative error.`],
    picture: { card: { cols: [{ head: 'y', cells: [nH(Y1), nH(Y2)] }, { head: 'ŷ', cells: [nH(Y1 - m), nH(Y2 - m)] }, { head: 'y − ŷ', cells: [nH(m), nH(m)] }] } },
  }, V, `Right: about ${nH(V, 3)}. On the ln scale the same ${nH(m)}-thousand miss counts ${which === 1 ? 'more' : 'less'} at ${nH(Y)} than at ${nH(which === 1 ? Y2 : Y1)}.`,
  [[m, MC.logResid, `${nH(m)} is the residual on the original scale. The ln-scale residual is ln y − ln ŷ.`], [rd(other, 3), undefined, `That is the other day. Use y = ${nH(Y)}.`]],
  'Take ln of the observed value and ln of the predicted value, then subtract.', { tol: 0.0005 + 1e-9 });
};

// ===================== exponential-regression =====================
const expData = (R: () => number, ids = EXP) => until(() => { const c = ctxOf(R, ids); return dataOf(R, c); }, d => d.ys.every(y => y > 0));
export const expOutF: NGen = (R, n) => {
  const t = until(() => { const d = expData(R), e = expReg(d.xs, d.ys); return { d, e }; }, t => tie4(t.e.a, t.e.b, t.e.r2, t.e.r) && tieFree(t.e.a, t.d.c.money ? 0 : 2, 0.1) && Math.abs(rd(t.e.r2, 4) - rd(t.e.b, 4)) > 0.02);
  const { d, e } = t, c = d.c, da = c.money ? 0 : 2, A = fx(e.a, da), B = fx(e.b, 4), Rr = fx(e.r2, 4);
  const opts: Opt[] = [
    { t: `ŷ = ${A}(${B})<sup><i>x</i></sup>`, ok: true, say: `Right. a = ${A} is the starting value and b = ${B} the factor per ${c.xOne}.` },
    { t: `ŷ = ${A} + ${B}<i>x</i>`, mc: MC.addsBase, say: `b is a factor: each ${c.xOne} multiplies ŷ by ${B}. Adding ${B} each step would be a line.` },
    { t: `ŷ = ${B}(${A})<sup><i>x</i></sup>`, say: 'a and b are swapped: a is the multiplier in front, b is the base.' },
    { t: `ŷ = ${A}(${Rr})<sup><i>x</i></sup>`, say: 'r² describes the fit of ln y on x; it is not the growth factor. The base is b.' },
  ];
  return choice(R, {
    id: `expOut-${n}`, family: 'expOut',
    prompt: `ExpReg on ${d.xs.length} measurements of ${c.yWhat} (${c.source}, the first one ${yv(c, d.ys[0]!)}) gives the output shown. Which equation records the model (a to ${da === 0 ? 'the nearest whole number' : '2 decimal places'}, b to 4)?`,
    board: '\\hat{y} = a \\cdot b^{x}',
    solution: ['ExpReg fits y = a·b^x: a is the value at x = 0, b the factor per unit of x.', `From the screen: ŷ = ${A}(${B})<sup>x</sup>.`],
    picture: { g: scatter(d), card: expOut(e.a, e.b, e.r2, e.r) },
  }, opts);
};
export const expPredict: NGen = (R, n) => {
  const t = until(() => {
    const d = expData(R), e = expReg(d.xs, d.ys), x0 = mid(d.xs, R), dp = dpOf(d.c);
    const a = rd(e.a, 4), b = rd(e.b, 4), v = a * b ** x0, vf = e.a * e.b ** x0;
    return { d, e, x0, dp, a, b, v, vf };
  }, t => tie4(t.e.a, t.e.b, t.e.r2, t.e.r) && tieFree(t.v, t.dp, 0.1) && tieFree(t.vf, t.dp, 0.1) && rd(t.v, t.dp) === rd(t.vf, t.dp));
  const { d, e, x0, dp, a, b, v, vf } = t, c = d.c, V = rd(v, dp);
  return numItem({
    id: `expPredict-${n}`, family: 'expPredict',
    prompt: `${calc(true)}ExpReg on the ${c.yWhat} data (${c.source}) gives the output shown. Use a and b as shown to predict the ${c.yWhat} at ${xv(c, x0)}. Round to ${dpWord(dp)}.`,
    board: `\\hat{y} = a \\cdot b^{x}`, unit: c.money ? 'dollars' : c.yUnit,
    solution: [`ŷ = ${nH(a)}(${nH(b)})<sup>${nH(x0)}</sup>.`, `ŷ ≈ ${nH(v, 4)}, so about ${ans(nH(V, dp))}${c.money ? ' dollars' : ` ${c.yUnit}`}.`],
    picture: { g: scatter(d, { curves: [{ m: e.model, key: 'fit', solve: true }] }), card: expOut(e.a, e.b, e.r2, e.r) },
  }, V, `Right: about ${yv(c, V, dp)}.`, [[rd(a + b * x0, dp), MC.addsBase, 'That adds b once per unit of x. In a·b^x, b is a factor: raise it to the power x.'], [rd(a * b * x0, dp), undefined, 'b is raised to the power x, not multiplied by x.']],
  'Raise b to the power x, then multiply by a.', { tol: 0.5 * 10 ** -dp + 1e-9, also: [rd(vf, dp)] });
};
export const expZero: NGen = (R, n) => {
  const c = ctxOf(R, ['drug', 'decay']);
  const d = dataOf(R, c, { xs: c.id === 'drug' ? [0, 2, 4, 6, 8, 10, 12, 14] : [0, 2, 4, 6, 8, 10, 12, 14] });
  const i = d.xs.length - 1, ys = d.ys.slice(); ys[i] = 0;
  const what = c.id === 'drug' ? 'the last sample was below what the lab can detect and was recorded as 0' : 'the last reading was recorded as 0 counts per minute';
  const opts: Opt[] = [
    { t: 'Keep the 0, check how it was measured, and fit y = a·b<sup>x</sup> on the original scale (Desmos default), which can still give a positive curve', ok: true, say: 'Right. The 0 is real information about the measurement. A fit that minimizes squared residuals of y itself can run with it.' },
    { t: 'Delete the 0 so ExpReg runs, and report the fit without mentioning it', mc: MC.deletes, say: 'Silently dropping a real observation hides what happened. Check the measurement and report what you did.' },
    { t: 'An exponential model is impossible: the data contain a 0', mc: MC.zeroRules, say: 'Only the log-response method fails at 0. An exponential curve can still come very close to 0, and an original-scale fit can run.' },
    { t: 'Change the 0 to 1 so that ln works, and fit as usual', mc: MC.deletes, say: 'Inventing a value changes the data. Keep the observation and use a method that can handle it.' },
  ];
  return choice(R, {
    id: `expZero-${n}`, family: 'expZero',
    prompt: `${cap(c.yWhat)} at ${d.xs.length} times (${c.source}), starting at ${yv(c, ys[0]!)}. The ${c.xWhat} runs to ${xv(c, d.xs[i]!)}, and ${what}. ExpReg stops with ERR:DOMAIN. What is the best next step?`,
    board: '\\text{ExpReg:}\\ \\ln 0\\ ?',
    solution: ['ExpReg fits ln y, and ln 0 does not exist, so it cannot run.', 'The 0 is a real observation: keep it, check the measurement, and fit on the original scale (a positive curve can still come close to 0).'],
    picture: { g: scatter({ c, xs: d.xs, ys }, { hot: [i], zeroY: true }), card: tableCard({ c, xs: d.xs, ys }, { ring: [i] }) },
  }, opts);
};
export const expTools: NGen = (R, n) => {
  const which = R() < 0.5;
  const t = until(() => {
    const d = expData(R, ['drug', 'cells', 'views', 'decay']), e = expReg(d.xs, d.ys), o = expRegOrig(d.xs, d.ys);
    const ta = rd(e.a, 3), tb = rd(e.b, 4), oa = rd(o.a, 3), ob = rd(o.b, 4);
    const sT = sse({ fam: 'exp', p: [ta, tb] }, d.xs, d.ys), sO = sse({ fam: 'exp', p: [oa, ob] }, d.xs, d.ys);
    return { d, ta, tb, oa, ob, sT, sO };
  }, t => t.sO < 0.97 * t.sT && Math.abs(t.ta - t.oa) / t.ta > 0.004 && t.tb !== t.ob);
  const { d, ta, tb, oa, ob, sT, sO } = t, c = d.c;
  const card = out('Two tools, same data', ['TI-84 ExpReg:', `a=${nH(ta, 3)}  b=${nH(tb, 4)}`, 'Desmos y₁ ~ ab^x₁:', `a=${nH(oa, 3)}  b=${nH(ob, 4)}`]);
  const opts: Opt[] = which ? [
    { t: 'They minimize different sums: ExpReg the squared residuals of ln y, Desmos the squared residuals of y itself', ok: true, say: 'Right. Two fitting conventions, two slightly different best curves.' },
    { t: 'One tool made a mistake: the best-fitting exponential is unique', mc: MC.sameFit, say: '“Best” depends on what is minimized. ExpReg works on ln y, Desmos on y: both are right for their own criterion.' },
    { t: 'They round differently; with more digits they would match', mc: MC.sameFit, say: 'The difference is bigger than rounding: the two tools minimize different sums.' },
    { t: 'ExpReg uses only the first and the last point', say: 'ExpReg uses every point, but it fits ln y instead of y.' },
  ] : [
    { t: 'The Desmos fit', ok: true, say: `Right. Desmos minimizes exactly that sum: about ${nH(sO, 2)} against ${nH(sT, 2)} for ExpReg.` },
    { t: 'The ExpReg fit', say: `ExpReg minimizes squared residuals of ln y, not of y. On the original scale its sum is about ${nH(sT, 2)}, Desmos’s ${nH(sO, 2)}.` },
    { t: 'Neither: the best fit is the same, so the sums are equal', mc: MC.sameFit, say: 'The two tools minimize different sums, so their curves and their sums differ.' },
  ];
  return choice(R, {
    id: `expTools-${n}`, family: 'expTools',
    prompt: which ? `The same ${d.xs.length} measurements of ${c.yWhat} (${c.source}, the first one ${yv(c, d.ys[0]!)}) go into a TI-84 (ExpReg) and into Desmos (y₁ ~ a·b<sup>x₁</sup>, default settings). The two outputs differ. Why?`
      : `${calc(true)}The same ${d.xs.length} measurements of ${c.yWhat} (${c.source}, the first one ${yv(c, d.ys[0]!)}), fitted by TI-84 ExpReg and by Desmos (y₁ ~ a·b<sup>x₁</sup>, default settings). Which fit has the smaller sum of squared residuals of <i>y</i> itself (the original scale)?`,
    board: which ? '' : '\\sum (y - \\hat{y})^2',
    solution: which ? ['TI-84 ExpReg minimizes Σ(ln y − ln ŷ)²; Desmos by default minimizes Σ(y − ŷ)².', 'Different criteria give slightly different curves; compare them with original-scale residuals.']
      : [`Σ(y − ŷ)²: ExpReg ≈ ${nH(sT, 2)}, Desmos ≈ ${nH(sO, 2)}.`, 'Desmos minimizes exactly this sum, so its fit is smaller here.'],
    picture: { g: scatter(d), card },
  }, opts, true);
};

// ===================== recode-input =====================
interface Pop { name: string; unit: string; y0: number; b: number; Y0: number; years: number[]; ys: number[] }
function popData(R: () => number): Pop {
  const money = R() < 0.4, Y0 = pick(R, [2008, 2010, 2012]), years = Array.from({ length: 7 }, (_, i) => Y0 + 2 * i);
  const y0 = money ? int(R, 90, 140) * 100 : int(R, 120, 480), b = 1.015 + R() * 0.03;
  const ys = years.map(y => rd(y0 * b ** (y - Y0) * (1 + 0.006 * noise(R)), money ? 0 : 1));
  return { name: money ? 'yearly tuition at a state college' : 'population of a growing city', unit: money ? 'dollars' : 'thousand people', y0, b, Y0, years, ys };
}
export const recodeA: NGen = (R, n) => {
  const raw = R() < 0.5;
  const t = until(() => { const p = popData(R), e = expReg(p.years.map(y => y - p.Y0), p.ys); return { p, e }; }, t => tie4(t.e.a, t.e.b));
  const { p, e } = t, Araw = e.A - p.Y0 * e.B, sa = sci(Math.exp(Araw), 3);
  const aTxt = p.unit === 'dollars' ? `$${rd(e.a, 0).toLocaleString('en-US')}` : `${nH(rd(e.a, 1), 1)} thousand people`;
  const opts: Opt[] = raw ? [
    { t: 'The model’s value extrapolated back to the year 0: it has no real meaning here', ok: true, say: 'Right. With calendar years, x = 0 is the year 0, two thousand years outside the data. The curve and its predictions are the same; only a is useless.' },
    { t: `The ${p.name.split(' of ')[0]} in ${p.Y0}`, mc: MC.calendar, say: `With calendar years, x = 0 means the year 0, not ${p.Y0}. Re-code x as years since ${p.Y0} to get a value at ${p.Y0}.` },
    { t: 'An error: calendar years cannot be used in ExpReg', say: 'Calendar years work: the curve and its predictions are fine. Only a, the value at x = 0, has no meaning.' },
    { t: 'The yearly growth factor', say: `The growth factor is b = ${t4(e.b)}. a is the value at x = 0.` },
  ] : [
    { t: `The model’s estimate for ${p.Y0} (x = 0): about ${aTxt}`, ok: true, say: `Right. x counts years since ${p.Y0}, so a is the model's value in ${p.Y0}.` },
    { t: 'The value in the year 0', mc: MC.calendar, say: `Here x = years since ${p.Y0}, so x = 0 is ${p.Y0}, not the year 0.` },
    { t: `Exactly the value recorded in ${p.Y0}`, mc: MC.truth, say: `a is the model's estimate. The recorded ${p.Y0} value was ${p.unit === 'dollars' ? '$' + nH(p.ys[0]!, 0) : nH(p.ys[0]!, 1) + ' thousand'}.` },
    { t: 'The amount added each year', mc: MC.addsBase, say: 'Nothing is added in an exponential model. a is the value at x = 0; b is the yearly factor.' },
  ];
  return choice(R, {
    id: `recodeA-${n}`, family: 'recodeA',
    prompt: raw ? `ExpReg on the ${p.name} with <i>x</i> = the calendar year gives a = ${sa.h} (and b = ${t4(e.b)}). What does this a tell you?`
      : `ExpReg on the ${p.name} with <i>x</i> = years since ${p.Y0} gives a = ${t4(e.a)} (and b = ${t4(e.b)}). What does a tell you?`,
    board: raw ? `a = ${sa.t}` : `x = \\text{years since } ${p.Y0}`,
    solution: raw ? ['With calendar years, a is the value at x = 0: the year 0.', 'That is far outside the data, so a has no real meaning (the curve is still fine).'] : [`x = 0 is ${p.Y0}.`, `a = ${t4(e.a)} is the model's estimate for ${p.Y0}: about ${aTxt}.`],
    picture: { card: { cols: [{ head: 'Year', cells: p.years.map(String) }, { head: p.unit === 'dollars' ? 'Tuition ($)' : 'People (1,000s)', cells: p.ys.map(v => (p.unit === 'dollars' ? v.toLocaleString('en-US') : nH(v, 1))) }] },
      card2: out('ExpReg', [raw ? 'x = year' : `x = years since ${p.Y0}`, `a=${raw ? sci(Math.exp(Araw), 4).ti : t4(e.a)}`, `b=${t4(e.b)}`]) },
  }, opts);
};
export const recodePredict: NGen = (R, n) => {
  const t = until(() => {
    const p = popData(R), e = expReg(p.years.map(y => y - p.Y0), p.ys), a = rd(e.a, p.unit === 'dollars' ? 0 : 1), b = rd(e.b, 4);
    const Y = p.Y0 + int(R, 1, 11), x = Y - p.Y0, dp = p.unit === 'dollars' ? 0 : 1, v = a * b ** x;
    return { p, a, b, Y, x, dp, v };
  }, t => tieFree(t.v, t.dp) && !t.p.years.includes(t.Y));
  const { p, a, b, Y, x, dp, v } = t, V = rd(v, dp);
  return numItem({
    id: `recodePredict-${n}`, family: 'recodePredict',
    prompt: `${calc(true)}The ${p.name} is modeled by ŷ = ${nH(a)}(${nH(b)})<sup><i>x</i></sup>, with <i>x</i> = years since ${p.Y0} and ŷ in ${p.unit}. Predict the value for ${Y}. Round to ${dpWord(dp)}.`,
    board: `x = ${Y} - ${p.Y0}`, unit: p.unit,
    solution: [`x = ${Y} − ${p.Y0} = ${x}.`, `ŷ = ${nH(a)}(${nH(b)})<sup>${x}</sup> ≈ ${ans(nH(V, dp))} ${p.unit}.`],
    picture: { g: { ...scatter({ c: { ...ctxById('car'), xAxis: `Years since ${p.Y0}`, yAxis: p.unit === 'dollars' ? 'Tuition ($)' : 'Population (thousands)' } as NCtx, xs: p.years.map(y => y - p.Y0), ys: p.ys }) } },
  }, V, `Right: about ${nH(V, dp)} ${p.unit} in ${Y}.`, [[rd(a * b ** Y, dp), MC.calendar, `x is years since ${p.Y0}, not the calendar year. For ${Y}, x = ${x}.`], [rd(a * b ** (x + 1), dp), undefined, `Count again: ${Y} − ${p.Y0} = ${x}.`]],
  `First turn ${Y} into x = years since ${p.Y0}.`, { tol: 0.5 * 10 ** -dp + 1e-9 });
};

// ===================== interpret-parameters =====================
export const interpB: NGen = (R, n) => {
  const c = ctxOf(R, ['drug', 'car', 'cells', 'views', 'decay']);
  const t = until(() => { const d = dataOf(R, c), e = expReg(d.xs, d.ys); return { d, e }; }, t => t.d.ys.every(y => y > 0) && tie4(t.e.a, t.e.b) && tieFree(t.e.b, 3) && Math.abs(rd(t.e.b, 3) - 1) > 0.01);
  const { e } = t, b = rd(e.b, 3), grow = b > 1, p = rd(Math.abs(b - 1) * 100, 1);
  const per = c.xOne;
  const opts: Opt[] = [
    { t: `The model predicts the ${c.yWhat} ${grow ? 'grows' : 'falls'} by about ${nH(p, 1)}% per ${per}`, ok: true, say: `Right. b = ${nH(b)} means × ${nH(b)} each ${per}: ${grow ? 'up' : 'down'} about ${nH(p, 1)}%.` },
    { t: `The model predicts the ${c.yWhat} ${grow ? 'grows' : 'falls'} by about ${nH(grow ? b : rd(b * 100, 1), 3)}% per ${per}`, mc: MC.factorPct, say: `b is a factor, not a percent. The percent change is ${grow ? 'b − 1' : '1 − b'} = ${nH(p, 1)}%.` },
    { t: `The model predicts the ${c.yWhat} ${grow ? 'rises' : 'falls'} by ${nH(grow ? b : rd(1 - b, 3))} ${c.money ? 'dollars' : c.yUnit} each ${per}`, mc: MC.addsBase, say: `In a·b^x the ${c.yWhat} is multiplied by b each ${per}; nothing fixed is added.` },
    { t: `The ${c.yWhat} changes by exactly ${nH(p, 1)}% every ${per}, for every case`, mc: MC.truth, say: 'A fitted b is an estimate from data: real cases vary around it. Say “about” and “predicted”.' },
  ];
  return choice(R, {
    id: `interpB-${n}`, family: 'interpB',
    prompt: `ExpReg on ${c.yWhat} data (${c.source}, <i>x</i> in ${c.xUnit}) gives a = ${t4(e.a)} and b = ${nH(b)} (rounded). What does b say?`,
    board: `b = ${nT(b)}`,
    solution: [`b = ${nH(b)}: each ${per}, ŷ is multiplied by ${nH(b)}.`, `${grow ? 'b − 1' : '1 − b'} = ${nH(rd(Math.abs(b - 1), 3))} = ${nH(p, 1)}%: the model predicts about ${nH(p, 1)}% ${grow ? 'growth' : 'decrease'} per ${per}.`],
    picture: { g: scatter(t.d, { curves: [{ m: e.model, key: 'fit' }] }) },
  }, opts);
};
export const interpVertex: NGen = (R, n) => {
  const t = until(() => {
    const d = quadData(R, ['mpg', 'truck', 'power']), q = quadReg(d.xs, d.ys);
    const A = rd(q.a, 4), B = rd(q.b, 4), h = -B / (2 * A), dp = d.c.id === 'truck' ? 1 : 0;
    return { d, q, A, B, h, dp };
  }, t => tie4(t.q.a, t.q.b, t.q.c, t.q.r2) && tieFree(t.h, t.dp) && t.h > t.d.xs[1]! && t.h < t.d.xs[t.d.xs.length - 2]! && rd(t.h, t.dp) === rd(-t.q.b / (2 * t.q.a), t.dp));
  const { d, q, A, B, h, dp } = t, c = d.c, H = rd(h, dp), top = A < 0;
  const what = c.id === 'mpg' ? 'speed gives the highest predicted gas mileage' : c.id === 'truck' ? 'meal price gives the highest predicted weekly revenue' : 'outdoor temperature gives the lowest predicted electricity use';
  return numItem({
    id: `interpVertex-${n}`, family: 'interpVertex',
    prompt: `${calc(true)}QuadReg on the data (${c.source}, R² = ${ti(q.r2, 4)}) gives the output shown. Which ${what}? Round to ${dp === 1 ? 'the nearest 10 cents' : 'the nearest whole number'}.`,
    board: `x = -\\dfrac{b}{2a}`, unit: c.money ? 'dollars' : c.xUnit,
    solution: [`The ${top ? 'peak' : 'valley'} of the parabola is at x = −b ÷ (2a) = −(${nH(B)}) ÷ (2 × ${nH(A)}).`, `x ≈ ${nH(h, 4)}, so about ${ans(nH(H, dp))} ${c.money ? 'dollars' : c.xUnit} (an estimate from the data).`],
    picture: { g: scatter(d, { curves: [{ m: q.model, key: 'fit', solve: true }] }), card: quadOut(q.a, q.b, q.c, q.r2) },
  }, H, `Right: about ${xv(c, H, dp)}, the model's estimate.`, [[rd(-B / A, dp), undefined, 'The vertex is at −b ÷ (2a): divide by 2a, not by a.'], [rd(B / (2 * A), dp), undefined, 'Mind the sign: x = −b ÷ (2a).']],
  'The vertex of y = ax² + bx + c is at x = −b ÷ (2a).', { tol: 0.5 * 10 ** -dp + 1e-9 });
};
export const interpC: NGen = (R, n) => {
  const inside = R() < 0.45;
  const t = until(() => {
    const d = inside ? dataOf(R, ctxOf(R, ['drug', 'car', 'decay'])) : quadData(R, ['mpg', 'stop', 'power']);
    const m = inside ? expReg(d.xs, d.ys).model : quadReg(d.xs, d.ys).model, k = inside ? m.p[0]! : m.p[2]!;
    return { d, m, k };
  }, t => (inside ? t.d.xs[0] === 0 : t.d.xs[0]! > 0) && tieFree(t.k, 1) && Math.abs(t.k) > 0.3);
  const { d, m, k } = t, c = d.c, nm = inside ? 'a' : 'c', [lo, hi] = [d.xs[0]!, d.xs[d.xs.length - 1]!];
  const opts: Opt[] = [
    { t: `An estimate of the ${c.yWhat} at x = 0, which is inside the data range`, ok: inside, say: inside ? `Right. x = 0 (${xv(c, 0)}) is one of the measured inputs, so ${nm} is the model's estimate there.` : `x = 0 is not in the data: the inputs run from ${xv(c, lo)} to ${xv(c, hi)}.` },
    { t: `Nothing reliable: x = 0 is outside the data range, so ${nm} only anchors the curve`, ok: !inside, say: !inside ? `Right. The data run from ${xv(c, lo)} to ${xv(c, hi)}; at x = 0 the model is extrapolating.` : 'x = 0 is in the data here: the model was fitted there.' },
    { t: `The exact ${c.yWhat} measured at x = 0`, mc: MC.intercept, say: inside ? `${nm} is the model's estimate, not an observation: the measured value at 0 was ${yv(c, d.ys[0]!)}.` : 'Nothing was measured at x = 0, and a model value is an estimate, not a measurement.' },
    { t: `The change in the ${c.yWhat} per ${c.xOne}`, say: `${nm} is the model's value at x = 0, not a rate of change.` },
  ];
  return choice(R, {
    id: `interpC-${n}`, family: 'interpC',
    prompt: `${inside ? 'ExpReg' : 'QuadReg'} on ${d.xs.length} measurements of ${c.yWhat} against ${c.xWhat} (${c.source}) gives ${nm} = ${nH(rd(k, 1), 1)}. What does ${nm} tell you?`,
    board: inside ? `\\hat{y}(0) = a` : `\\hat{y}(0) = c`,
    solution: [`${nm} is the model's value at x = 0.`, inside ? `x = 0 is inside the data (${xv(c, lo)} to ${xv(c, hi)}): ${nm} estimates the ${c.yWhat} there.` : `x = 0 is outside the data (${xv(c, lo)} to ${xv(c, hi)}): ${nm} means nothing reliable here.`],
    picture: { g: scatter(d, { curves: [{ m, key: 'fit' }] }) },
  }, opts, true);
};

// ===================== compare-own-fits =====================
function seasonal(R: () => number) {
  const xs = Array.from({ length: 10 }, (_, i) => i + 1), A = int(R, 30, 45), B = int(R, 12, 20), ph = R() * 2;
  return { xs, ys: xs.map(x => rd(A + B * Math.sin((2 * Math.PI * x) / 6 + ph) + 1.5 * noise(R), 1)) };
}
export const compareFits: NGen = (R, n) => {
  const cs = pick(R, ['quad', 'exp', 'none'] as const);
  const SEAS: NCtx = { ...ctxById('candle'), id: 'ice', source: 'one ice-cream stand, every second month', xWhat: 'time', yWhat: 'monthly sales', xAxis: 'Time (2-month steps)', yAxis: 'Sales ($ hundreds)', hx: 'Step', hy: 'Sales ($100s)', yUnit: 'hundred dollars', xUnit: 'steps', xOne: 'step' };
  const t = until(() => {
    let c: NCtx, xs: number[], ys: number[];
    if (cs === 'none') { c = SEAS; ({ xs, ys } = seasonal(R)); }
    else if (cs === 'quad') { const d = quadData(R, ['ball', 'rocket', 'mpg', 'power']); ({ c, xs, ys } = d); }
    else { const d = expData(R, ['drug', 'car', 'decay', 'cells']); ({ c, xs, ys } = d); }
    if (ys.some(y => y <= 0)) return null;
    if (xs.length > 9) { const keep = xs.map((_, i) => i).filter(i => !(i === 1 || (xs.length > 10 && i === xs.length - 2))); xs = keep.map(i => xs[i]!); ys = keep.map(i => ys[i]!); }
    const ms = { lin: linReg(xs, ys).model, quad: quadReg(xs, ys).model, exp: expReg(xs, ys).model };
    const es = { lin: resid(ms.lin, xs, ys), quad: resid(ms.quad, xs, ys), exp: resid(ms.exp, xs, ys) };
    return { c, xs, ys, es };
  }, t => {
    if (!t) return false;
    const P = (k: 'lin' | 'quad' | 'exp') => patterned(t.xs, t.es[k]), L = (k: 'lin' | 'quad' | 'exp') => patternless(t.xs, t.es[k]);
    return cs === 'none' ? P('lin') && P('quad') && P('exp')
      : cs === 'quad' ? L('quad') && P('lin') && P('exp') : L('exp') && P('lin') && P('quad');
  }, 8000)!;
  const { c, xs, ys, es } = t, dp = c.money ? 0 : 1;
  const word = { lin: 'linear', quad: 'quadratic', exp: 'exponential' };
  const opt = (k: 'lin' | 'quad' | 'exp'): Opt => ({ t: `The ${word[k]} model`, ok: cs === k, mc: cs === 'none' ? MC.mustChoose : undefined, say: cs === k ? `Right. Only the ${word[k]} residuals change sign at random; the others run in long stretches.` : `The ${word[k]} residuals run in long stretches of one sign: a pattern.` });
  const opts: Opt[] = [opt('lin'), opt('quad'), opt('exp'),
    { t: 'None of them: every model leaves a pattern in its residuals', ok: cs === 'none', say: cs === 'none' ? 'Right. The data go up and down again and again; none of the three families can follow that.' : `One model's residuals do scatter at random: the ${word[cs as 'quad']}.` },
    { t: 'All three: the calculator fitted each one without an error', mc: MC.software, say: 'A calculator fits any family you ask for. Whether the family is right is what the residuals tell you.' },
  ];
  return choice(R, {
    id: `compareFits-${n}`, family: 'compareFits',
    prompt: `${xs.length} measurements of ${c.yWhat} (${c.source}), the first one ${yv(c, ys[0]!)}. A linear, a quadratic and an exponential model were fitted; the table gives each model’s residuals on the original scale. Which model is adequate?`,
    board: '',
    solution: (['lin', 'quad', 'exp'] as const).map(k => `${cap(word[k])}: residuals ${es[k].map(e => (e > 0 ? '+' : '−')).join(' ')}${patternless(xs, es[k]) ? ' (no pattern)' : ' (long runs: a pattern)'}.`),
    picture: { g: scatter({ c, xs, ys }), card: { cols: [{ head: 'x', cells: xs.map(v => nH(v)) }, { head: 'Linear', cells: es.lin.map(e => nH(rd(e, dp), dp)) }, { head: 'Quadratic', cells: es.quad.map(e => nH(rd(e, dp), dp)) }, { head: 'Exponential', cells: es.exp.map(e => nH(rd(e, dp), dp)) }] } },
  }, opts, true);
};

// ===================== solve-for-input =====================
/** a fitted model over its context's input range with a target line (with the question, or on the solve) */
function modelPlot(c: NCtx, m: Model, T: number, tgtOnSolve: boolean, sols: number[]): NG {
  const [lo, hi] = c.id === 'ball' ? [0, quadSolve(m.p[0]!, m.p[1]!, m.p[2]!, 0).filter(v => v > 0)[0] ?? 3] : c.id === 'mpg' ? [25, 75] : [6, 14];
  const x = axisFor([lo, hi], c.xAxis, { zero: c.id === 'ball' });
  const ys: number[] = [T]; for (let i = 0; i <= 40; i++) ys.push(evalM(m, lo + ((hi - lo) * i) / 40));
  const y = axisFor(ys, c.yAxis, { zero: c.id === 'ball' || c.id === 'truck' });
  const tgt: NItem = { kind: 'hline', key: 'tgt', y: T, col: 'pick', dash: true };
  const pts = sols.filter(v => v >= x.min && v <= x.max).map((v, i) => ({ kind: 'point', key: `hit#${i}`, x: rd(v, 4), y: T, col: 'link' }) as NItem);
  return { x, y, items: [curve('fit', m, { lo, hi }), ...(tgtOnSolve ? [] : [tgt])], solveItems: [...(tgtOnSolve ? [tgt] : []), ...pts] };
}
/** a fitted quadratic written in vertex-friendly numbers: a(x − h)² + k with nice a, h, k */
function niceQuad(R: () => number) {
  const c = ctxOf(R, ['ball', 'mpg', 'truck']);
  if (c.id === 'ball') { const v = pick(R, [32, 40, 48]), h0 = pick(R, [3, 4, 5, 6]); return { c, m: { fam: 'quad', p: [-16, v, h0] } as Model, lo: 0 }; }
  if (c.id === 'mpg') { const a = pick(R, [-0.01, -0.012, -0.008]), h = pick(R, [45, 50, 55]), k = int(R, 44, 52); return { c, m: { fam: 'quad', p: [a, rd(-2 * a * h, 6), rd(a * h * h + k, 6)] } as Model, lo: 25 }; }
  const k = pick(R, [20, 24]), h = pick(R, [9.5, 10, 10.5]); return { c, m: { fam: 'quad', p: [-k, rd(2 * k * h, 6), 0] } as Model, lo: 6 };
}
export const solveCount: NGen = (R, n) => {
  const cs = pick(R, [2, 2, 1, 0]);
  const { c, m } = niceQuad(R), [a, b, cc] = m.p as [number, number, number];
  void cc;
  const h = -b / (2 * a), k = rd(evalM(m, h), 6);
  const unitStep = c.money ? 50 : c.id === 'ball' ? 2 : 1;
  const T = cs === 1 ? k : cs === 0 ? rd(k + unitStep * int(R, 2, 4), 6) : rd(k - unitStep * int(R, 3, 8), 6);
  const sols = quadSolve(a, b, cc, T);
  const M = modelHT(m);
  const word = cs === 2 ? 'two' : cs === 1 ? 'one' : 'none';
  const opts: Opt[] = [
    { t: 'Two inputs', ok: cs === 2, key: '2', say: cs === 2 ? 'Right. The level lies below the peak, so the line crosses the parabola on both sides of it.' : cs === 1 ? 'The line only touches the parabola at its peak: one input.' : 'The level is above the peak: the line misses the parabola.' },
    { t: 'One input', ok: cs === 1, key: '1', mc: cs === 2 ? MC.oneSol : undefined, say: cs === 1 ? 'Right. The target is exactly the peak value: the line touches the parabola once, at the vertex.' : cs === 2 ? 'A parabola is symmetric: a level below the peak is reached once on each side.' : 'The level is above the peak: the model never gets there.' },
    { t: 'No input: the model never reaches this value', ok: cs === 0, key: '0', say: cs === 0 ? `Right. The model peaks at about ${nH(k, 2)}; the target is higher.` : 'The model does reach this level: look where the line meets the curve.' },
    { t: 'No intersection means the model or the calculator is broken', mc: MC.noSolError, say: 'No intersection is a real answer: the model never reaches that value.' },
  ];
  return choice(R, {
    id: `solveCount-${n}`, family: 'solveCount',
    prompt: `${calc(true)}A fitted model for the ${c.yWhat} (${c.source}): ${M.h}. At how many inputs does the model reach ${yv(c, T, c.money ? 0 : 1)}?`,
    board: `\\hat{y} = ${c.money ? nT(T, 0) : nT(T, 2)}`,
    solution: [`The vertex is at x = ${nH(h, 3)}, where the model gives its ${a < 0 ? 'maximum' : 'minimum'}: ${nH(k, 2)}.`, `The target ${nH(T, 2)} is ${cs === 2 ? 'below' : cs === 1 ? 'exactly at' : 'above'} that peak: ${word === 'none' ? 'no input' : word === 'one' ? 'one input' : 'two inputs'}${sols.length === 2 ? ` (x ≈ ${nH(sols[0]!, 2)} and x ≈ ${nH(sols[1]!, 2)})` : ''}.`],
    picture: { g: modelPlot(c, m, T, true, sols) },
  }, opts, true);
};
export const solveExp: NGen = (R, n) => {
  const t = until(() => {
    const c = ctxOf(R, ['drug', 'car', 'cells', 'views', 'decay']), d = dataOf(R, c), e = expReg(d.xs, d.ys);
    const a = c.money ? rd(e.a, 0) : sig(e.a, 3), b = rd(e.b, 3), lo = d.xs[0]!, hi = d.xs[d.xs.length - 1]!;
    const xt = lo + (0.2 + 0.6 * R()) * (hi - lo), T0 = a * b ** xt, step = c.money ? 500 : c.yd === 0 ? 10 : 0.5;
    const T = rd(Math.round(T0 / step) * step, 2), x = expSolve(a, b, T)!;
    return { c, d, a, b, T, x };
  }, t => t.d.ys.every(y => y > 0) && tieFree(t.x, 1) && t.x > t.d.xs[0]! && t.x < t.d.xs[t.d.xs.length - 1]!);
  const { c, d, a, b, T, x } = t, X = rd(x, 1), m: Model = { fam: 'exp', p: [a, b] };
  return numItem({
    id: `solveExp-${n}`, family: 'solveExp',
    prompt: `${calc(true)}A fitted model for the ${c.yWhat} (${c.source}): ŷ = ${nH(a)}(${nH(b)})<sup><i>x</i></sup>, with <i>x</i> in ${c.xUnit}. Graph it with the line y = ${nH(T)} and find the intersection: when does the model reach ${yv(c, T, c.money ? 0 : 2)}? Round to the nearest tenth.`,
    board: `${nT(a)}(${nT(b)})^{x} = ${nT(T)}`, unit: c.xUnit,
    solution: [`Intersect ŷ = ${nH(a)}(${nH(b)})<sup>x</sup> with y = ${nH(T)} (or search the table).`, `x ≈ ${nH(x, 3)}: about ${ans(nH(X, 1))} ${c.xUnit}.`],
    picture: { g: { ...scatter(d, { curves: [{ m, key: 'fit' }] }), items: [...scatter(d, { curves: [{ m, key: 'fit' }] }).items, { kind: 'hline', key: 'tgt', y: T, col: 'pick', dash: true } as NItem], solveItems: [{ kind: 'point', key: 'hit', x: rd(x, 4), y: T, col: 'link' } as NItem] } },
  }, X, `Right: about ${nH(X, 1)} ${c.xUnit}.`, [], 'Find where the curve meets the horizontal line y = target (intersect, or a table search).', { tol: 0.05 + 1e-9 });
};

// ===================== report-in-context =====================
export const reportBall: NGen = (R, n) => {
  const t = until(() => {
    const c = ctxOf(R, ['ball', 'rocket']), d = dataOf(R, c), q = quadReg(d.xs, d.ys);
    const A = rd(q.a, 2), B = rd(q.b, 2), C = rd(q.c, 2), top = C - (B * B) / (4 * A);
    const both = R() < 0.5;
    const T = both ? rd(C + (top - C) * (0.3 + 0.5 * R()), 0) : (R() < 0.5 ? 0 : rd(C * (0.2 + 0.5 * R()), 1));
    const s = quadSolve(A, B, C, T);
    return { c, d, A, B, C, T, s, both };
  }, t => t.C > 0.2 && t.s.length === 2 && t.s.every(v => tieFree(v, 2)) && (t.both ? t.s[0]! > 0.05 : t.s[0]! < -0.02) && rd(t.s[0]!, 2) !== 0);
  const { c, d, A, B, C, T, s, both } = t, [t1, t2] = [rd(s[0]!, 2), rd(s[1]!, 2)];
  const m: Model = { fam: 'quad', p: [A, B, C] };
  const opts: Opt[] = [
    { t: `t ≈ ${nH(t1, 2)} s and t ≈ ${nH(t2, 2)} s`, ok: both, mc: both ? undefined : MC.allReals, say: both ? 'Right. Both times are during the flight: once on the way up, once on the way down.' : `t ≈ ${nH(t1, 2)} s is before the launch: the model is only about the flight, from t = 0 on.` },
    { t: `Only t ≈ ${nH(t2, 2)} s`, ok: !both, mc: both ? MC.oneSol : undefined, say: !both ? `Right. The negative solution is before the ${c.id === 'ball' ? 'throw' : 'launch'}; only ${nH(t2, 2)} s is in the event.` : `There is a second admissible time: ${nH(t1, 2)} s, on the way up.` },
    { t: `Only t ≈ ${nH(t1, 2)} s`, say: both ? `${nH(t2, 2)} s is during the flight too, on the way down.` : 'A negative time is before the event started.' },
    { t: 'Never', say: `The model does reach ${nH(T)} ${c.yUnit}: the graph crosses that level.` },
  ];
  return choice(R, {
    id: `reportBall-${n}`, family: 'reportBall',
    prompt: `${calc(true)}QuadReg on ${c.source} gives h = ${nH(A)}t² ${B < 0 ? '−' : '+'} ${nH(Math.abs(B))}t + ${nH(C)} (h in ${c.yUnit}, t in seconds). Solving h = ${nH(T)} gives t ≈ ${nH(t1, 2)} and t ≈ ${nH(t2, 2)}. What do you report?`,
    board: `${nT(A)}t^2 ${B < 0 ? '-' : '+'} ${nT(Math.abs(B))}t + ${nT(C)} = ${nT(T)}`,
    solution: [`The event runs from t = 0 until the ${c.id === 'ball' ? 'ball' : 'rocket'} lands.`, both ? `Both ${nH(t1, 2)} s and ${nH(t2, 2)} s lie in it: report both (up and down).` : `${nH(t1, 2)} s is before t = 0: drop it. Report only t ≈ ${nH(t2, 2)} s.`],
    picture: { g: scatter(d, { curves: [{ m, key: 'fit' }], extraY: [0] }) },
  }, opts, true);
};
export const reportNever: NGen = (R, n) => {
  const quad = R() < 0.6;
  if (quad) {
    const { c, m } = niceQuad(R), [a, b] = m.p as [number, number, number], h = -b / (2 * a), k = evalM(m, h);
    const step = c.money ? 100 : c.id === 'ball' ? 4 : 2, T = rd(k + step * int(R, 1, 4), 0), M = modelHT(m);
    const opts: Opt[] = [
      { t: `The model never reaches ${yv(c, T, 0)}: its highest value is about ${yv(c, rd(k, 1), c.money ? 0 : 1)}`, ok: true, say: 'Right. No solution, and it means something: the model tops out below the target.' },
      { t: 'No solution, so the model or the calculator must be wrong', mc: MC.noSolError, say: 'No solution is a real result. The model simply never gets that high.' },
      { t: `Just write “no solution”: the context adds nothing`, mc: MC.noSolBare, say: `Say what it means: the model never reaches ${yv(c, T, 0)}, because it tops out at about ${yv(c, rd(k, 1), c.money ? 0 : 1)}.` },
      { t: `At the peak, x ≈ ${nH(rd(h, 2), 2)}`, say: `At the peak the model gives about ${nH(rd(k, 1), 1)}, still short of ${nH(T)}.` },
    ];
    return choice(R, {
      id: `reportNever-${n}`, family: 'reportNever',
      prompt: `${calc(true)}A fitted model for the ${c.yWhat} (${c.source}): ${M.h}. The question: when does it reach ${yv(c, T, 0)}? The calculator finds no intersection. What do you report?`,
      board: `\\hat{y} = ${nT(T)}`,
      solution: [`The model's ${a < 0 ? 'highest' : 'lowest'} value is at the vertex: about ${nH(rd(k, 1), 1)}.`, `${nH(T)} is beyond it: the model never reaches ${yv(c, T, 0)}.`],
      picture: { g: modelPlot(c, m, T, false, []) },
    }, opts);
  }
  const c = ctxOf(R, ['drug', 'decay', 'car']), d = dataOf(R, c), e = expReg(d.xs, d.ys);
  const a = c.money ? rd(e.a, 0) : sig(e.a, 3), b = rd(e.b, 3);
  const opts: Opt[] = [
    { t: `Never: the model only gets closer and closer to 0`, ok: true, say: 'Right. a·b^x with 0 < b < 1 stays positive for every x: it approaches 0 but never reaches it.' },
    { t: 'No solution, so the model or the calculator must be wrong', mc: MC.noSolError, say: 'No solution is a real result: an exponential decay never reaches 0.' },
    { t: `Just write “no solution”: the context adds nothing`, mc: MC.noSolBare, say: 'Say what it means: the model never predicts 0; it only keeps getting smaller.' },
    { t: `After about ${nH(rd(Math.log(0.01) / Math.log(b), 0))} ${c.xUnit}, when it is all gone`, mc: MC.truth, say: 'The model has no such time: every power of b is positive.' },
  ];
  return choice(R, {
    id: `reportNever-${n}`, family: 'reportNever',
    prompt: `${calc(true)}A fitted model for the ${c.yWhat} (${c.source}): ŷ = ${nH(a)}(${nH(b)})<sup><i>x</i></sup>, <i>x</i> in ${c.xUnit}. When does the model predict a value of 0? The calculator finds no intersection.`,
    board: `${nT(a)}(${nT(b)})^{x} = 0`,
    solution: [`${nH(a)}(${nH(b)})<sup>x</sup> is a positive number times a positive power: it is never 0.`, 'The model only gets closer to 0: report that it never reaches 0.'],
    picture: { g: scatter(d, { curves: [{ m: { fam: 'exp', p: [a, b] }, key: 'fit' }], zeroY: true }) },
  }, opts);
};
export const reportWords: NGen = (R, n) => {
  const t = until(() => {
    const c = ctxOf(R, ['drug', 'car', 'cells', 'mpg', 'power', 'ball']), d = c.fam === 'quad' ? quadData(R, [c.id]) : dataOf(R, c);
    const m = c.fam === 'quad' ? quadReg(d.xs, d.ys).model : expReg(d.xs, d.ys).model, x0 = mid(d.xs, R), dp = c.money ? 0 : 1, v = evalM(m, x0);
    return { c, d, m, x0, dp, v };
  }, t => tieFree(t.v, t.dp, 0.1) && t.d.ys.every(y => y > 0));
  const { c, d, m, x0, dp, v } = t, V = rd(v, dp), Y = yv(c, V, dp);
  const opts: Opt[] = [
    { t: `The model predicts about ${Y} at ${xv(c, x0)}`, ok: true, say: 'Right: a number, its unit, where it applies, and the word “predicts”.' },
    { t: `The ${c.yWhat} will be exactly ${Y} at ${xv(c, x0)}`, mc: MC.truth, say: 'A fitted model gives an estimate. Real values scatter around it, as the data did.' },
    { t: `${nH(V, dp)}`, mc: 'mc.reasoning-language.bare-number-without-meaning', say: 'A bare number says nothing about what or where. Give the unit and the input, as a prediction.' },
    { t: `The model predicts about ${nH(V, dp)} ${c.money ? 'percent' : c.xUnit} at ${xv(c, x0)}`, say: `The unit is wrong: ŷ is the ${c.yWhat}, in ${c.money ? 'dollars' : c.yUnit}.` },
  ];
  return choice(R, {
    id: `reportWords-${n}`, family: 'reportWords',
    prompt: `The fitted model for the ${c.yWhat} (${c.source}) gives ŷ ≈ ${nH(v, 3)} at ${xv(c, x0)}. Which sentence reports this best?`,
    board: `\\hat{y}(${nT(x0)}) \\approx ${nT(v, 3)}`,
    solution: ['A report gives the value with its unit and the input, rounded sensibly.', `It says “predicts” or “about”: ${Y} is an estimate.`],
    picture: { g: scatter(d, { curves: [{ m, key: 'fit' }] }) },
  }, opts);
};

// ===================== square-root-regression =====================
export const sqrtFit: NGen = (R, n) => {
  const pend = R() < 0.5;
  const t = until(() => {
    const c = ctxById(pend ? 'pend' : 'skid'), d = dataOf(R, c);
    if (pend) {
      const p = pwrReg(d.xs, d.ys), a = rd(p.a, 4), b = rd(p.b, 4), T = pick(R, [1.5, 2, 2.5, 2.8]), L = (T / a) ** (1 / b);
      return { c, d, kind: 'pwr' as const, a, b, k: 0, T, v: L, dp: 1, out: out('PwrReg', ['y=a*x^b', `a=${t4(p.a)}`, `b=${t4(p.b)}`]), m: p.model };
    }
    const s = sqrtReg(d.xs, d.ys), a = rd(s.a, 4), k = rd(s.k, 4), T = pick(R, [35, 40, 45, 50, 55]), L = ((T - k) / a) ** 2;
    return { c, d, kind: 'sqrt' as const, a, b: 0.5, k, T, v: L, dp: 0, out: out('Desmos', ['y₁ ~ a√x₁ + k', `a=${t4(s.a)}`, `k=${t4(s.k)}`]), m: s.model };
  }, t => tieFree(t.v, t.dp) && t.v > t.d.xs[0]! && t.v < t.d.xs[t.d.xs.length - 1]! && tieFree(t.a, 4));
  const { c, d, kind, a, b, k, T, v, dp } = t, V = rd(v, dp);
  return numItem({
    id: `sqrtFit-${n}`, family: 'sqrtFit',
    prompt: kind === 'pwr' ? `${calc(true)}PwrReg on the pendulum data gives the output shown (b near 0.5: square-root-like). Use it to find the string length that gives a period of ${nH(T)} seconds. Round to the nearest tenth of a foot.`
      : `${calc(true)}A square-root model ŷ = a√x + k (h fixed at 0) fitted to skid tests gives the output shown. What skid length does the model predict for a speed of ${nH(T)} mph? Round to the nearest foot.`,
    board: kind === 'pwr' ? `${nT(a)}x^{${nT(b)}} = ${nT(T)}` : `${nT(a)}\\sqrt{x} ${k < 0 ? '-' : '+'} ${nT(Math.abs(k))} = ${nT(T)}`, unit: 'feet',
    solution: kind === 'pwr' ? [`Solve ${nH(a)}·x<sup>${nH(b)}</sup> = ${nH(T)}: intersect the curve with y = ${nH(T)}, or x = (${nH(T)} ÷ ${nH(a)})<sup>1/${nH(b)}</sup>.`, `x ≈ ${nH(v, 3)}: about ${ans(nH(V, 1))} feet.`]
      : [`Solve ${nH(a)}√x ${k < 0 ? '−' : '+'} ${nH(Math.abs(k))} = ${nH(T)}: √x = (${nH(T)} ${k < 0 ? '+' : '−'} ${nH(Math.abs(k))}) ÷ ${nH(a)}.`, `x ≈ ${nH(v, 2)}: about ${ans(nH(V, 0))} feet.`],
    picture: { g: scatter(d, { curves: [{ m: t.m, key: 'fit', solve: true }] }), card: t.out },
  }, V, `Right: about ${nH(V, dp)} feet.`, [[rd((T - k) / a, dp), undefined, 'That is √x. Square it to get x.']], 'Set the model equal to the target and solve (intersect with a horizontal line).', { tol: 0.5 * 10 ** -dp + 1e-9 });
};
export const sqrtShape: NGen = (R, n) => {
  const v = pick(R, ['levels', 'domain', 'theory'] as const);
  if (v === 'theory') {
    const t = until(() => { const d = dataOf(R, ctxById('pend')), p = pwrReg(d.xs, d.ys); return { d, p }; }, t => Math.abs(t.p.b - 0.5) > 0.004 && Math.abs(t.p.b - 0.5) < 0.03 && tie4(t.p.a, t.p.b));
    const { d, p } = t;
    const opts: Opt[] = [
      { t: 'Close to 0.5: the data are consistent with a square-root model; keep the fitted values and check the residuals', ok: true, say: 'Right. Measured data never give exactly 0.5. A value this close supports the square-root model.' },
      { t: `Not 0.5, so a square-root model is ruled out`, mc: MC.rejectsNear, say: `${t4(p.b)} differs from 0.5 by a measurement-sized amount. That does not rule the model out.` },
      { t: 'Replace b by 0.5 and keep a as it is, without checking anything', mc: MC.forcesTheory, say: 'Swapping in a theory value changes the fit. If you do it, refit a with b fixed and check the residuals.' },
    ];
    return choice(R, {
      id: `sqrtShape-${n}`, family: 'sqrtShape',
      prompt: `PwrReg on ${d.xs.length} pendulum measurements (period against string length) gives b = ${t4(p.b)}. Theory says the period grows like √(length), so b = 0.5. What do you conclude?`,
      board: `b = ${nT(rd(p.b, 4))}\\ \\text{vs}\\ 0.5`,
      solution: [`b = ${t4(p.b)} is within a few hundredths of 0.5.`, 'Real data never match a theory value exactly: this supports a square-root model. Keep the fit and check the residuals.'],
      picture: { g: scatter(d, { curves: [{ m: p.model, key: 'fit' }] }) },
    }, opts);
  }
  const c = ctxById('skid'), d = dataOf(R, c), s = sqrtReg(d.xs, d.ys), a = rd(s.a, 2), k = rd(s.k, 1);
  if (v === 'levels') {
    const opts: Opt[] = [
      { t: 'It keeps increasing, more and more slowly, with no ceiling', ok: true, say: 'Right. √x grows without end, just ever more slowly. There is no horizontal asymptote.' },
      { t: 'It levels off at a maximum speed', mc: MC.levelsOff, say: 'Slowing growth is not a ceiling: √x passes any value you name if x is large enough.' },
      { t: 'It starts to decrease after a while', say: '√x never decreases: each longer skid gives a higher predicted speed.' },
      { t: 'It increases at a constant rate', say: 'A constant rate would be a line. √x adds less and less for each extra foot.' },
    ];
    return choice(R, {
      id: `sqrtShape-${n}`, family: 'sqrtShape',
      prompt: `A fitted model for skid tests: ŷ = ${nH(a)}√<i>x</i> ${k < 0 ? '−' : '+'} ${nH(Math.abs(k))} (speed in mph, <i>x</i> = skid length in feet). As the skid length grows, what does the model's predicted speed do?`,
      board: `\\hat{y} = ${nT(a)}\\sqrt{x} ${k < 0 ? '-' : '+'} ${nT(Math.abs(k))}`,
      solution: ['√x keeps growing: √100 = 10, √400 = 20, √1600 = 40.', 'Each step adds less, but there is no ceiling.'],
      picture: { g: scatter(d, { curves: [{ m: { fam: 'sqrt', p: [a, k] }, key: 'fit' }] }) },
    }, opts);
  }
  const h = pick(R, [5, 10, 12, 15]);
  const opts: Opt[] = [
    { t: `x ≥ ${h}`, ok: true, say: `Right. The radicand x − ${h} must not be negative: x ≥ ${h}.` },
    { t: 'Every real number x', mc: MC.negRadicand, say: `For x below ${h} the radicand x − ${h} is negative, and the square root has no real value.` },
    { t: `x ≥ 0`, mc: MC.negRadicand, say: `Between 0 and ${h} the radicand x − ${h} is still negative.` },
    { t: `x ≥ ${-h}`, say: `x − ${h} ≥ 0 means x ≥ ${h}, not x ≥ ${-h}.` },
  ];
  return choice(R, {
    id: `sqrtShape-${n}`, family: 'sqrtShape',
    prompt: `Desmos fits ŷ = ${nH(a)}√(<i>x</i> − ${h}) ${k < 0 ? '−' : '+'} ${nH(Math.abs(k))} to speed against skid length (feet), with h fixed at ${h} for the skid the brakes need before the marks start. For which inputs is the model defined?`,
    board: `\\sqrt{x - ${h}}`,
    solution: [`A square root needs a radicand ≥ 0: x − ${h} ≥ 0.`, `So x ≥ ${h} (and in context, skids of at least ${h} feet).`],
    picture: { g: scatter(d) },
  }, opts);
};
