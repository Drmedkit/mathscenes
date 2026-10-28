// famC.ts: stage-3 families of "Quadratic and exponential regression": interpolation vs extrapolation, a qualified
// domain of use, models that fit alike but diverge outside the data, (x, ln y) linearization, a written justification
// for a model choice, and why observed residuals are no guaranteed bound. Pure: no DOM.
import { noise } from '../linear-regression/regMaths';
import {
  type NCtx, type NG, type NGen, type NItem, type Opt, type PCand, MC, a1, ans, axisFor, calc, cap, choice, ctxById, ctxOf, dataOf, int, pairItem, pick, residPlot,
  scatter, until, xv, yv,
} from './nkit';
import { modelHT, truckTruth } from './famA';
import { type Model, evalM, expReg, fx, linReg, nH, nT, patterned, patternless, quadReg, r9, rd, resid, sst, tieFree, ti } from './nlMaths';

const t4 = (v: number) => ti(v, 4);
const dataFor = (R: () => number, c: NCtx) => dataOf(R, c, { truth: c.id === 'truck' ? truckTruth(R) : undefined });
const fitOf = (f: 'quad' | 'exp' | 'lin', xs: readonly number[], ys: readonly number[]): Model => (f === 'quad' ? quadReg(xs, ys).model : f === 'exp' ? expReg(xs, ys).model : linReg(xs, ys).model);
const R2of = (m: Model, xs: readonly number[], ys: readonly number[]) => 1 - resid(m, xs, ys).reduce((s, e) => s + e * e, 0) / sst(ys);

// ===================== interp-vs-extrap =====================
export const interpExtrap: NGen = (R, n) => {
  const coded = R() < 0.4, kind = pick(R, ['in', 'end', 'near', 'far'] as const);
  if (coded) {
    const Y0 = pick(R, [2010, 2012, 2015]), first = int(R, 1, 2), N = int(R, 6, 8), years = Array.from({ length: N }, (_, i) => Y0 + first + i);
    const lo = years[0]!, hi = years[N - 1]!;
    const Y = kind === 'in' ? int(R, lo + 1, hi - 1) : kind === 'end' ? pick(R, [lo, hi]) : kind === 'near' ? pick(R, [lo - 1, hi + 1]) : hi + int(R, 10, 20);
    const inside = Y >= lo && Y <= hi;
    const opts: Opt[] = [
      { t: `Interpolation: x = ${Y - Y0} is within the observed inputs, ${lo - Y0} to ${hi - Y0}`, ok: inside, key: 'in', say: inside ? 'Right. Endpoints count as inside the observed inputs.' : `x = ${Y - Y0} is outside ${lo - Y0} to ${hi - Y0}.` },
      { t: `Extrapolation: x = ${Y - Y0} is outside the observed inputs, ${lo - Y0} to ${hi - Y0}`, ok: !inside, key: 'out', say: !inside ? `Right. ${Y} is beyond the years measured.` : `x = ${Y - Y0} lies within ${lo - Y0} to ${hi - Y0}.` },
      inside ? { t: 'Interpolation, so the prediction is guaranteed to be accurate', mc: MC.interpSafe, say: 'Inside the range is safer, but no prediction is guaranteed: real values scatter around the model.' }
        : { t: 'Neither: the model fits so well that the range does not matter', mc: MC.noLimit, say: 'A good fit inside the data says nothing certain about inputs outside it.' },
    ];
    return choice(R, {
      id: `interpExtrap-${n}`, family: 'interpExtrap',
      prompt: `A model uses <i>x</i> = years since ${Y0}. The data cover the years ${lo} to ${hi}. You predict the value for ${Y}. Is that interpolation or extrapolation?`,
      board: `x = ${Y} - ${Y0} = ${Y - Y0}`,
      solution: [`${Y} gives x = ${Y - Y0}; the observed inputs run from x = ${lo - Y0} to x = ${hi - Y0}.`, inside ? 'Inside that range (endpoints included): interpolation.' : 'Outside that range: extrapolation.'],
    }, opts, true);
  }
  const c = ctxOf(R, ['drug', 'car', 'cells', 'ball', 'mpg', 'power', 'truck', 'decay']), d = dataFor(R, c);
  const lo = d.xs[0]!, hi = d.xs[d.xs.length - 1]!, w = hi - lo, st = d.xs[1]! - d.xs[0]!;
  const x0 = kind === 'in' ? r9(d.xs[int(R, 1, d.xs.length - 3)]! + st / 2) : kind === 'end' ? pick(R, [lo, hi]) : kind === 'near' ? r9(hi + st / 2) : r9(hi + w * pick(R, [1, 2, 3]));
  const inside = x0 >= lo && x0 <= hi;
  const opts: Opt[] = [
    { t: `Interpolation: ${xv(c, x0)} is within the observed inputs, ${xv(c, lo)} to ${xv(c, hi)}`, ok: inside, key: 'in', say: inside ? 'Right. Endpoints count as inside.' : `${xv(c, x0)} is beyond ${xv(c, hi)}.` },
    { t: `Extrapolation: ${xv(c, x0)} is outside the observed inputs, ${xv(c, lo)} to ${xv(c, hi)}`, ok: !inside, key: 'out', say: !inside ? 'Right. No data were collected there.' : `${xv(c, x0)} lies within ${xv(c, lo)} to ${xv(c, hi)}.` },
    inside ? { t: 'Interpolation, so the prediction is guaranteed to be accurate', mc: MC.interpSafe, say: 'Inside the range is safer, but real values scatter around any model.' }
      : { t: 'Neither: the model fits so well that the range does not matter', mc: MC.noLimit, say: 'A good fit inside the data says nothing certain about inputs outside it.' },
  ];
  return choice(R, {
    id: `interpExtrap-${n}`, family: 'interpExtrap',
    prompt: `A fitted model for the ${c.yWhat} (${c.source}). You use it at ${xv(c, x0)}. Is that interpolation or extrapolation?`,
    board: '',
    solution: [`The observed inputs run from ${xv(c, lo)} to ${xv(c, hi)}.`, inside ? `${xv(c, x0)} is inside (endpoints included): interpolation.` : `${xv(c, x0)} is outside: extrapolation.`],
    picture: { g: scatter(d) },
  }, opts, true);
};

// ===================== context-domain =====================
export const domainQuad: NGen = (R, n) => {
  const c = ctxOf(R, ['truck', 'mpg', 'power', 'views', 'cells']), d = dataFor(R, c);
  const lo = d.xs[0]!, hi = d.xs[d.xs.length - 1]!;
  const m = c.fam === 'quad' ? quadReg(d.xs, d.ys).model : expReg(d.xs, d.ys).model;
  let far = '';
  if (c.fam === 'quad') {
    const [a, b, cc] = m.p as [number, number, number], D = b * b - 4 * a * cc;
    const z = D > 0 ? Math.max((-b - Math.sqrt(D)) / (2 * a), (-b + Math.sqrt(D)) / (2 * a)) : NaN;
    far = a < 0 && Number.isFinite(z) && z > hi ? `Any ${c.xWhat} from ${xv(c, lo)} up to ${xv(c, rd(z, 0), 0)}, where the model reaches 0` : `Any ${c.xWhat} of ${xv(c, lo)} or more: the trend continues`;
  } else far = `Any ${c.xWhat} of ${xv(c, lo)} or more: the growth goes on at the same rate`;
  const why = c.id === 'truck' ? 'Past its peak the parabola falls and would soon predict negative revenue.' : c.id === 'mpg' ? 'Far outside, the parabola would predict negative gas mileage.' : c.id === 'power' ? 'Far outside, the parabola keeps rising faster than any real house could use.' : 'An exponential grows without limit, but views and cells run into limits (people, food, space).';
  const opts: Opt[] = [
    { t: `About ${xv(c, lo)} to ${xv(c, hi)} (the data), with caution just beyond`, ok: true, say: `Right. That is what the evidence supports. ${why}` },
    { t: `Every real number: the formula works for any input`, mc: MC.allReals, say: `The formula computes for any x, but ${why.toLowerCase()}` },
    { t: far, mc: MC.noLimit, say: `Nothing was measured beyond ${xv(c, hi)}. ${why}` },
    { t: `Only the ${d.xs.length} inputs that were measured`, say: 'Between the measured inputs the model is supported too: that is interpolation.' },
  ];
  return choice(R, {
    id: `domainQuad-${n}`, family: 'domainQuad',
    prompt: `${c.fam === 'quad' ? 'QuadReg' : 'ExpReg'} is fitted to ${d.xs.length} measurements of ${c.yWhat} (${c.source}), from ${xv(c, lo)} to ${xv(c, hi)}. Over which inputs can the model reasonably be used?`,
    board: '',
    solution: [`The data cover ${xv(c, lo)} to ${xv(c, hi)}.`, `${why} Use the model on about that interval, with caution just beyond it.`],
    picture: { g: scatter(d, { curves: [{ m, key: 'fit' }] }) },
  }, opts);
};
const POP: Record<string, { pop: string; other: string; kind: string }> = {
  drug: { pop: 'adult patients', other: 'a 6-year-old child', kind: 'population' },
  car: { pop: 'one sedan model', other: 'a pickup truck of a different brand', kind: 'population' },
  mpg: { pop: 'a hybrid on a flat test track', other: 'the same hybrid towing a trailer up a mountain road', kind: 'condition' },
  cells: { pop: 'a culture kept at 98°F', other: 'the same bacteria in a refrigerator at 40°F', kind: 'condition' },
  power: { pop: 'one house in Ohio', other: 'a 40-unit apartment building', kind: 'population' },
};
export const domainPop: NGen = (R, n) => {
  const id = pick(R, Object.keys(POP)), P = POP[id]!, c = ctxById(id), d = dataFor(R, c);
  const x0 = r9((d.xs[int(R, 1, d.xs.length - 3)]! + d.xs[int(R, 2, d.xs.length - 2)]!) / 2);
  const opts: Opt[] = [
    { t: `Not without more data: ${xv(c, x0)} is inside the range, but this case comes from a different ${P.kind}`, ok: true, say: `Right. The model describes ${P.pop}. Being inside the input range does not make it fit ${P.other}.` },
    { t: `Yes: ${xv(c, x0)} lies inside the data range, so the prediction is trustworthy`, mc: MC.interpSafe, say: `Inside the input range is not enough: the data came from ${P.pop}, not from ${P.other}.` },
    { t: 'Yes: a model that fits its data well works for every case', mc: MC.truth, say: 'A model only describes the population and conditions its data came from.' },
    { t: 'No: a fitted model can never be used for predictions', say: 'It can, for cases like the ones in the data. This case is different.' },
  ];
  return choice(R, {
    id: `domainPop-${n}`, family: 'domainPop',
    prompt: `A model for the ${c.yWhat} was fitted to data from ${P.pop}, with ${c.xWhat} from ${xv(c, d.xs[0]!)} to ${xv(c, d.xs[d.xs.length - 1]!)}. Can it predict the ${c.yWhat} for ${P.other} at ${xv(c, x0)}?`,
    board: '',
    solution: [`${xv(c, x0)} is inside the observed inputs.`, `But the data came from ${P.pop}; ${P.other} is a different ${P.kind}, so the model may not apply. Get data for that case first.`],
    picture: { g: scatter(d) },
  }, opts);
};

// ===================== model-divergence =====================
function earlyGrowth(R: () => number) {
  return until(() => {
    const c = ctxOf(R, ['views', 'cells']), d = dataOf(R, c, { xs: c.id === 'views' ? [1, 2, 3, 4, 5, 6, 7, 8] : [0, 1, 2, 3, 4, 5, 6], sd: 0.5 });
    const q = quadReg(d.xs, d.ys), e = expReg(d.xs, d.ys);
    const Q: Model = { fam: 'quad', p: [rd(q.a, 3), rd(q.b, 3), rd(q.c, 3)] }, E: Model = { fam: 'exp', p: [rd(e.a, 3), rd(e.b, 4)] };
    const eq = resid(Q, d.xs, d.ys), ee = resid(E, d.xs, d.ys), k = Math.max(...eq.map(Math.abs), ...ee.map(Math.abs));
    const X = d.xs[d.xs.length - 1]! + 15, vq = evalM(Q, X), ve = evalM(E, X);
    return { c, d, Q, E, k, X, vq, ve, ok: k < 0.1 * Math.max(...d.ys) && ve > 2 * vq && vq > 0 && tieFree(vq, 0) && tieFree(ve, 0) && Q.p[0]! > 0 };
  }, t => t.ok);
}
export const divergePair: NGen = (R, n) => {
  const { c, d, Q, E, k, X, vq, ve } = earlyGrowth(R), q = rd(vq, 0), e = rd(ve, 0), MQ = modelHT(Q), ME = modelHT(E);
  const cands: PCand[] = [[e, q, undefined, 'The two values are swapped: the quadratic goes in the first box.']];
  return pairItem({
    id: `divergePair-${n}`, family: 'divergePair',
    prompt: `${calc(true)}Two models fit the ${d.xs.length} measurements of ${c.yWhat} (${c.source}) about equally well, every residual within ±${nH(rd(k, 1) + 0.1, 1)}: ${MQ.h} and ${ME.h}. Predict the ${c.yWhat} at <i>x</i> = ${X} (${c.xUnit}) with each model. Round to whole numbers.`,
    board: `x = ${X}`, unit: c.yUnit,
    solution: [`Quadratic: ${MQ.h.replace(/<i>x<\/i>/g, `(${X})`)} ≈ ${ans(nH(q, 0))}.`, `Exponential: ${nH(E.p[0]!)}(${nH(E.p[1]!)})<sup>${X}</sup> ≈ ${ans(nH(e, 0))}. Fifteen steps beyond the data the two predictions are far apart.`],
    picture: { g: scatter(d, { curves: [{ m: Q, key: 'cQ', col: 'water', name: 'Q' }, { m: E, key: 'cE', col: 'first', name: 'E' }] }) },
  }, q, e, { lead: 'Quadratic:', op: 'Exponential:' }, `Right: about ${nH(q, 0)} against ${nH(e, 0)}. Equal fits inside the data, very different predictions outside.`, cands, 'Put the x-value into each model separately.', 0.5 + 1e-9);
};
export const divergeClaim: NGen = (R, n) => {
  const { c, d, Q, E, k, X, vq, ve } = earlyGrowth(R), q = rd(vq, 0), e = rd(ve, 0), MQ = modelHT(Q), ME = modelHT(E);
  const K = rd(k, 1) + 0.1;
  const opts: Opt[] = [
    { t: `No: at x = ${X} the quadratic predicts about ${nH(q, 0)} and the exponential about ${nH(e, 0)}`, ok: true, say: 'Right. Outside the data, adding a growing amount and multiplying by a factor split apart fast.' },
    { t: 'Yes: models that fit the same data equally well predict alike everywhere', mc: MC.equalFits, say: `Work them out at x = ${X}: about ${nH(q, 0)} and ${nH(e, 0)}. Equal fits inside the data say nothing about outside.` },
    { t: `Yes: both stay within ±${nH(K, 1)} of the data, so they stay within ±${nH(K, 1)} of each other`, mc: MC.bounds, say: `The ±${nH(K, 1)} only describes the observed points. At x = ${X} the two models are far apart.` },
    { t: `No: the quadratic predicts more at x = ${X}`, say: `Compute both: the exponential predicts more (about ${nH(e, 0)} against ${nH(q, 0)}).` },
  ];
  return choice(R, {
    id: `divergeClaim-${n}`, family: 'divergeClaim',
    prompt: `${calc(true)}${ME.h} and ${MQ.h} both fit the ${d.xs.length} measurements of ${c.yWhat} (${c.source}) with every residual within ±${nH(K, 1)}. Dana: “Since they fit equally well, they will predict about the same at <i>x</i> = ${X}.” Is Dana right?`,
    board: `x = ${X}`,
    solution: [`Quadratic at x = ${X}: about ${nH(q, 0)}. Exponential: about ${nH(e, 0)}.`, 'The predictions are far apart: fitting the data equally well does not make models agree outside it.'],
    picture: { g: scatter(d, { curves: [{ m: Q, key: 'cQ', col: 'water', name: 'Q' }, { m: E, key: 'cE', col: 'first', name: 'E' }] }) },
  }, opts);
};

// ===================== log-linearization =====================
const lnG = (c: NCtx, xs: readonly number[], ys: readonly number[], line?: { a: number; b: number }): NG => {
  const ly = ys.map(y => rd(Math.log(y), 4));
  const x = axisFor(xs, c.xAxis), y = axisFor(ly, `ln(${c.yAxis.replace(/ \(.*\)$/, '')})`);
  const items: NItem[] = [];
  if (line) items.push({ kind: 'line', key: 'fit', m: line.b, b: line.a, lo: x.min, hi: x.max, col: 'link' });
  xs.forEach((xx, i) => items.push({ kind: 'point', key: `pts#${i}`, x: xx, y: ly[i]!, col: 'first' }));
  return { x, y, items };
};
export const linRecover: NGen = (R, n) => {
  const t = until(() => {
    const c = ctxOf(R, ['drug', 'car', 'cells', 'views', 'decay']), d = dataOf(R, c), l = linReg(d.xs, d.ys.map(Math.log));
    const A = rd(l.a, 4), B = rd(l.b, 4), da = c.money ? 0 : 2, a = Math.exp(A), b = Math.exp(B);
    return { c, d, l, A, B, da, a, b };
  }, t => t.d.ys.every(y => y > 0) && tieFree(t.l.a, 4) && tieFree(t.l.b, 4) && tieFree(t.a, t.da) && tieFree(t.b, 3) && rd(t.a, t.da) === rd(Math.exp(t.l.a), t.da) && rd(t.b, 3) === rd(Math.exp(t.l.b), 3));
  const { c, d, l, A, B, da, a, b } = t, ra = rd(a, da), rb = rd(b, 3);
  const cands: PCand[] = [[rd(A, da), rd(B, 3), MC.notExp, 'Those are the intercept and slope of the ln y line. The model y = a·b^x needs a = e^A and b = e^B.'], [rb, ra, undefined, 'Swapped: a comes from the intercept, b from the slope.']];
  return pairItem({
    id: `linRecover-${n}`, family: 'linRecover',
    prompt: `${calc(true)}For ${c.yWhat} data (${c.source}) a ln <i>y</i> column was made, and LinReg(a+bx) on (<i>x</i>, ln <i>y</i>) gives the output shown: ln ŷ = A + B<i>x</i>. Recover y = a·b<sup>x</sup>: a to ${da === 0 ? 'the nearest whole number' : '2 decimal places'}, b to 3 decimal places.`,
    board: `\\ln \\hat{y} = ${nT(A)} ${B < 0 ? '-' : '+'} ${nT(Math.abs(B))}x`, unit: '',
    solution: [`a = e<sup>A</sup> = e<sup>${nH(A)}</sup> ≈ ${ans(nH(ra, da))}.`, `b = e<sup>B</sup> = e<sup>${nH(B)}</sup> ≈ ${ans(nH(rb, 3))}. So ŷ = ${nH(ra, da)}(${nH(rb, 3)})<sup>x</sup>, the same model ExpReg gives.`],
    picture: { g: lnG(c, d.xs, d.ys, { a: l.a, b: l.b }), card: { title: 'LinReg (x, ln y)', lines: ['y=a+bx', `a=${t4(l.a)}`, `b=${t4(l.b)}`, `r=${t4(l.r)}`] } },
  }, ra, rb, { lead: 'a =', op: 'b =' }, `Right: ŷ = ${nH(ra, da)}(${nH(rb, 3)})<sup>x</sup>.`, cands, 'Undo the ln: a = e^A and b = e^B.', Math.max(0.5 * 10 ** -da, 0.0005) + 1e-9);
};
export const linCurved: NGen = (R, n) => {
  const expCase = R() < 0.5;
  const t = until(() => {
    const c = expCase ? ctxOf(R, ['drug', 'car', 'cells', 'decay']) : ctxById('stop'), d = dataOf(R, c);
    const ly = d.ys.map(Math.log), l = linReg(d.xs, ly), es = resid(l.model, d.xs, ly);
    return { c, d, l, es };
  }, t => t.d.ys.every(y => y > 0) && (expCase ? patternless(t.d.xs, t.es) : patterned(t.d.xs, t.es)));
  const { c, d, l, es } = t;
  const opts: Opt[] = [
    { t: 'Yes: the (x, ln y) points follow a line with no pattern in its residuals, so y = a·b<sup>x</sup> fits', ok: expCase, say: expCase ? 'Right. A straight (x, ln y) plot is what an exponential looks like on the ln scale.' : 'Look at the residuals of the ln y line: they follow a curve.' },
    { t: 'No: the (x, ln y) points still bend (their residuals form a pattern), so an exponential is not the right form', ok: !expCase, say: !expCase ? 'Right. Exponential data become straight on the ln scale. These do not: the form is wrong.' : 'The ln y residuals scatter with no pattern: the points do follow a line.' },
    { t: 'Yes: taking ln always makes data straight, so ExpReg is right', say: 'Only exponential data become straight on the ln scale. Check the plot, do not assume it.' },
  ];
  return choice(R, {
    id: `linCurved-${n}`, family: 'linCurved',
    prompt: `${d.xs.length} measurements of ${c.yWhat} (${c.source}), the first one ${yv(c, d.ys[0]!)}. The plots show (<i>x</i>, ln <i>y</i>) with its least-squares line, and the residuals of that line. Does an exponential model y = a·b<sup>x</sup> fit these data?`,
    board: '',
    solution: [`The residuals of the ln y line ${expCase ? 'scatter with no pattern' : 'form a curve'}.`, expCase ? 'Straight on the ln scale: an exponential fits.' : 'Still bent on the ln scale: an exponential is not the right form.'],
    picture: { g: lnG(c, d.xs, d.ys, { a: l.a, b: l.b }), g2: { ...residPlot(c, d.xs, es), y: axisFor(es.map(e => rd(e, 3)), 'Residual (ln units)', { sym: true }) } },
  }, opts);
};

// ===================== model-choice-argument =====================
const MECH: Record<string, string> = {
  drug: 'a body clears a steady percent per hour', car: 'cars lose a steady percent of value per year', decay: 'a sample decays by a steady fraction per day',
  cells: 'cells divide, so the culture grows by a steady percent', ball: 'gravity makes the height rise, turn and fall', rocket: 'gravity makes the height rise, turn and fall',
  truck: 'revenue rises, then falls as prices climb', power: 'use is lowest at mild temperatures',
};
function twoFits(R: () => number, ids: string[]) {
  return until(() => {
    const c = ctxOf(R, ids), d = dataFor(R, c), F: 'quad' | 'exp' = c.fam === 'exp' ? 'exp' : 'quad', G: 'quad' | 'exp' = F === 'exp' ? 'quad' : 'exp';
    if (d.ys.some(y => y <= 0)) return null;
    const mF = fitOf(F, d.xs, d.ys), mG = fitOf(G, d.xs, d.ys), eF = resid(mF, d.xs, d.ys), eG = resid(mG, d.xs, d.ys);
    return { c, d, F, G, mF, mG, eF, eG, r2F: R2of(mF, d.xs, d.ys), r2G: R2of(mG, d.xs, d.ys) };
  }, t => !!t && patternless(t.d.xs, t.eF) && patterned(t.d.xs, t.eG) && tieFree(t.r2F, 3) && tieFree(t.r2G, 3) && rd(t.r2F, 3) !== rd(t.r2G, 3), 8000)!;
}
const W = { quad: 'quadratic', exp: 'exponential' } as const;
export const cerPick: NGen = (R, n) => {
  const { c, d, F, G, eF, eG, r2F, r2G } = twoFits(R, ['drug', 'car', 'decay', 'ball', 'rocket', 'truck', 'power']);
  const lo = d.xs[0]!, hi = d.xs[d.xs.length - 1]!, r = linReg(d.xs, d.ys).r;
  const gHigher = r2G > r2F;
  const opts: Opt[] = [
    { t: `Choose the ${W[F]}: no residual pattern (the ${W[G]}’s curve); ${MECH[c.id]}; past the data it is extrapolation`, ok: true, say: 'Right: a claim, two kinds of evidence (residuals and a mechanism) and a limitation.' },
    gHigher ? { t: `Choose the ${W[G]}: its R² is higher (${fx(r2G, 3)} against ${fx(r2F, 3)})`, mc: MC.highR, say: `A higher R² does not show the right form: the ${W[G]}'s residuals form a curve.` }
      : { t: r2G > 0 ? `Choose the ${W[F]}: its R² is higher (${fx(r2F, 3)} against ${fx(r2G, 3)}), and that settles it` : `Choose the ${W[F]}: its R² is higher, and that settles it`, mc: MC.highR, say: 'R² alone settles nothing: it says nothing about the pattern, the mechanism or the limits.' },
    { t: `Choose the ${W[F]}: r for the original (x, y) data is ${fx(r, 3)}, close to ${r < 0 ? '−1' : '1'}`, mc: MC.pearson, say: 'r measures how close the points are to a straight line. It is no fit score for a curve.' },
    { t: `Choose the ${W[F]}: the ${c.xWhat} causes the ${c.yWhat}, so the model must be right`, mc: MC.causation, say: 'A cause does not tell you which curve fits. The residuals and the mechanism do.' },
  ];
  return choice(R, {
    id: `cerPick-${n}`, family: 'cerPick',
    prompt: `${d.xs.length} measurements of ${c.yWhat} (${c.source}), the first one ${yv(c, d.ys[0]!)}, with ${a1(W[F])} and ${a1(W[G])} fit; their residual plots are shown. Which written justification for a model choice is the strongest?`,
    board: '',
    solution: [`The ${W[F]}'s residuals scatter with no pattern; the ${W[G]}'s follow a curve.`, `Context: ${MECH[c.id]}. A good justification cites both and states a limit (the data run from ${xv(c, lo)} to ${xv(c, hi)}).`],
    picture: { g: residPlot(c, d.xs, eF, { title: cap(W[F]) }), g2: residPlot(c, d.xs, eG, { title: cap(W[G]) }) },
  }, opts);
};
export const cerVerdict: NGen = (R, n) => {
  const cs = pick(R, ['none', 'more', 'clear', 'clear'] as const);
  const SUN: NCtx = { ...ctxById('candle'), id: 'sun', source: 'one sunflower, measured once a week', xWhat: 'weeks since sprouting', yWhat: 'height', xAxis: 'Weeks', yAxis: 'Height (inches)', hx: 'Week', hy: 'Height (in)', yUnit: 'inches', xUnit: 'weeks', xOne: 'week' };
  const GAME: NCtx = { ...ctxById('views'), id: 'game', source: 'a new video game in its first 4 weeks', xWhat: 'weeks since release', yWhat: 'total copies sold', xAxis: 'Weeks since release', yAxis: 'Copies (thousands)', hx: 'Week', hy: 'Copies (1,000s)', yUnit: 'thousand copies', xUnit: 'weeks', xOne: 'week' };
  let c: NCtx, xs: number[], ys: number[], eQ: number[], eE: number[], extra = '', right: 'quad' | 'exp' | 'none' | 'more';
  if (cs === 'none') {
    const t = until(() => {
      const K = int(R, 90, 110), r = 0.6 + R() * 0.2, t0 = 6 + R(), xs0 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
      const ys0 = xs0.map(x => Math.max(0.5, rd(K / (1 + Math.exp(-r * (x - t0))) + 1.2 * noise(R), 1)));
      return { xs0, ys0, eQ0: resid(fitOf('quad', xs0, ys0), xs0, ys0), eE0: resid(fitOf('exp', xs0, ys0), xs0, ys0) };
    }, t => patterned(t.xs0, t.eQ0) && patterned(t.xs0, t.eE0));
    c = SUN; xs = t.xs0; ys = t.ys0; eQ = t.eQ0; eE = t.eE0; right = 'none';
  } else if (cs === 'more') {
    const t = until(() => {
      const xs0 = [1, 2, 3, 4], a = 2 + R() * 2, b = 1.3 + R() * 0.2, ys0 = xs0.map(x => rd(a * b ** x * (1 + 0.01 * noise(R)), 1));
      const Q = fitOf('quad', xs0, ys0), E = fitOf('exp', xs0, ys0), X = 12, vq = evalM(Q, X), ve = evalM(E, X);
      return { xs0, ys0, eQ0: resid(Q, xs0, ys0), eE0: resid(E, xs0, ys0), X, vq, ve };
    }, t => t.ve > 1.6 * t.vq && t.vq > 0 && Math.max(...t.eE0.map(Math.abs), ...t.eQ0.map(Math.abs)) < 0.4);
    c = GAME; xs = t.xs0; ys = t.ys0; eQ = t.eQ0; eE = t.eE0; right = 'more';
    extra = ` Only 4 weeks of data so far. At week ${t.X} the quadratic predicts about ${nH(rd(t.vq, 0), 0)} thousand copies and the exponential about ${nH(rd(t.ve, 0), 0)} thousand.`;
  } else {
    const t = twoFits(R, ['drug', 'car', 'decay', 'ball', 'rocket', 'power']);
    c = t.c; xs = t.d.xs; ys = t.d.ys; right = t.F as 'quad' | 'exp';
    eQ = right === 'quad' ? t.eF : t.eG; eE = right === 'exp' ? t.eF : t.eG;
  }
  const r2 = (e: number[]) => 1 - e.reduce((s, v) => s + v * v, 0) / sst(ys);
  const qHigher = r2(eQ) > r2(eE);
  const opts: Opt[] = [
    { t: 'Choose the quadratic model', ok: right === 'quad', key: 'q', mc: right === 'none' ? MC.mustChoose : right === 'exp' && qHigher ? MC.highR : undefined, say: right === 'quad' ? 'Right. Its residuals show no pattern, the exponential\'s do.' : right === 'none' ? 'Its residuals form a pattern too. No model is better than a wrong one.' : right === 'more' ? 'With 4 points nothing separates the two, and they disagree far beyond them.' : 'The quadratic\'s residuals follow a curve: wrong form, whatever its R².' },
    { t: 'Choose the exponential model', ok: right === 'exp', key: 'e', mc: right === 'none' ? MC.mustChoose : right === 'quad' && !qHigher ? MC.highR : undefined, say: right === 'exp' ? 'Right. Its residuals show no pattern, the quadratic\'s do.' : right === 'none' ? 'Its residuals form a pattern too. No model is better than a wrong one.' : right === 'more' ? 'With 4 points nothing separates the two, and they disagree far beyond them.' : 'The exponential\'s residuals follow a curve: wrong form.' },
    { t: 'Recommend neither: both residual plots show a pattern', ok: right === 'none', key: 'n', say: right === 'none' ? 'Right. Both forms are wrong for these data: the height levels off, which neither family does.' : 'At least one residual plot scatters with no pattern.' },
    { t: 'Ask for more data first: the evidence cannot separate the models, and they disagree beyond the data', ok: right === 'more', key: 'm', say: right === 'more' ? 'Right. Four points cannot tell these two apart, yet their predictions split apart. Collect more data.' : 'The residual plots already separate the models (or rule both out).' },
  ];
  return choice(R, {
    id: `cerVerdict-${n}`, family: 'cerVerdict',
    prompt: `${xs.length} measurements of ${c.yWhat} (${c.source}), with a quadratic and an exponential fit; their residual plots are shown.${extra} What do you recommend?`,
    board: '',
    solution: right === 'more' ? ['With 4 points both models fit; the residuals cannot separate them.', 'Beyond the data they disagree a lot: get more data before choosing.']
      : right === 'none' ? ['Both residual plots follow a curve.', 'Neither form fits: recommend neither and look for another model.']
      : [`The ${W[right]}'s residuals scatter with no pattern; the other's follow a curve.`, `Choose the ${W[right]} model.`],
    picture: { g: residPlot(c, xs, eQ, { title: 'Quadratic' }), g2: residPlot(c, xs, eE, { title: 'Exponential' }) },
  }, opts, true);
};

// ===================== no-guaranteed-bounds =====================
export const boundsClaim: NGen = (R, n) => {
  const far = R() < 0.4;
  const t = until(() => {
    const c = ctxOf(R, ['drug', 'car', 'ball', 'mpg', 'power', 'cells']), d = dataFor(R, c);
    const m = c.fam === 'exp' ? fitOf('exp', d.xs, d.ys) : fitOf('quad', d.xs, d.ys), es = resid(m, d.xs, d.ys);
    return { c, d, m, es };
  }, t => t.d.ys.every(y => y > 0) && patternless(t.d.xs, t.es));
  const { c, d, m, es } = t, dp = c.money ? 0 : c.yd === 0 ? 0 : 1;
  const step = c.money ? 100 : dp === 0 ? 1 : 0.1, k = r9(Math.ceil(Math.max(...es.map(Math.abs)) / step) * step);
  const lo = d.xs[0]!, hi = d.xs[d.xs.length - 1]!, st = d.xs[1]! - d.xs[0]!;
  const x0 = far ? r9(hi + (hi - lo) * 2) : r9(d.xs[int(R, 1, d.xs.length - 3)]! + st / 2);
  const K = c.money ? `$${nH(k, 0)}` : `${nH(k, 1)} ${c.yUnit}`;
  const opts: Opt[] = [
    { t: `No: ±${K} only describes the misses in these data; a new case can miss by more${far ? ', and far outside the data by much more' : ''}`, ok: true, say: `Right. The observed residuals are a guide, not a guarantee${far ? '; far outside the data the model itself may be wrong' : ''}.` },
    { t: `Yes: the largest residual is the largest error the model can make`, mc: MC.bounds, say: 'A new observation was not in the data, so nothing stops it from missing by more than any observed residual.' },
    { t: `Yes: the same ±${K} holds for any input, however far from the data`, mc: MC.noLimit, say: 'Outside the data nothing was checked: the misses there can be much larger.' },
    { t: `No: the next miss will be exactly ${K}`, say: 'Nobody can say what the next miss will be exactly. ±K only describes the data so far.' },
  ];
  return choice(R, {
    id: `boundsClaim-${n}`, family: 'boundsClaim',
    prompt: `A fitted model for the ${c.yWhat} (${c.source}) has residuals that all lie within ±${K}, with no pattern. Lee: “So the next ${c.id === 'car' ? 'car' : 'measurement'}, at ${xv(c, x0)}, is guaranteed to be within ${K} of the model's prediction.” Is Lee right?`,
    board: `|e| \\le ${c.money ? `\\$${nT(k, 0)}` : nT(k, 1)}`,
    solution: [`The residuals within ±${K} describe the ${d.xs.length} observed cases only.`, far ? `${xv(c, x0)} is far outside the data (${xv(c, lo)} to ${xv(c, hi)}): the miss there could be much larger. No guarantee.` : 'A new case can still miss by more: there is no guaranteed bound.'],
    picture: { g: residPlot(c, d.xs, es) },
  }, opts);
};
