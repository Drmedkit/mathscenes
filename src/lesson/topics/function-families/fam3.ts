// fam3.ts: stage 3 families of "Linear, quadratic or exponential?": choosing a model from a context (same amount,
// same percent, a product of two linear quantities, a rate that changes by the same amount), when a few points do
// not settle the family, noisy data with supplied candidate models and a tolerance, the domain of a model, and a
// complete justification. Pure: no DOM.
import { type Gen, MC, type Opt, ans, choice, int, numItem, pick, shuffle, tI } from './common';
import { type Fam, famOf, nH, nT, r9 } from './ff';
import { listLines, tpic, xsOf } from './tables';
import { nearTie, rnd, usd } from '../exponential-functions/expo';

const FAM3 = ['Linear', 'Quadratic', 'Exponential'] as const;
type F3 = (typeof FAM3)[number];
function famChoice(R: () => number, base: Parameters<typeof choice>[1], right: F3, says: Record<F3, string>, mcs: Partial<Record<F3, string>>): ReturnType<typeof choice> {
  return choice(R, base, FAM3.map(f => ({ t: f, ok: f === right, mc: f === right ? undefined : mcs[f], say: f === right ? `Right. ${says[f]}` : says[f] })), true);
}

// ===================== context-linear =====================
interface LinCtx { story: string; F: number; r: number; sign: 1 | -1; out: string; O: string; v: string; unit: string; money: boolean }
function linCtx(R: () => number): LinCtx {
  const k = int(R, 0, 3);
  if (k === 0) { const F = pick(R, [60, 75, 90, 120]), r = pick(R, [45, 55, 65, 80]); return { story: `A plumber charges a $${F} call-out fee plus $${r} per hour of work.`, F, r, sign: 1, out: 'cost C (dollars)', O: 'C', v: 'h', unit: 'hour', money: true }; }
  if (k === 1) { const F = pick(R, [300, 400, 480, 600]), r = pick(R, [12, 15, 20, 24]); return { story: `A water tank holds ${F} gallons and drains at a steady ${r} gallons per minute.`, F, r, sign: -1, out: 'gallons V left', O: 'V', v: 't', unit: 'minute', money: false }; }
  if (k === 2) { const F = pick(R, [25, 30, 35, 40]), r = pick(R, [5, 8, 10, 12]); return { story: `A phone plan costs $${F} a month plus $${r} for each gigabyte of data.`, F, r, sign: 1, out: 'monthly bill B (dollars)', O: 'B', v: 'g', unit: 'gigabyte', money: true }; }
  const F = pick(R, [10, 12, 15]), r = pick(R, [0.5, 0.75, 1, 1.5]);
  return { story: `A ${F}-inch candle burns down ${r} inch per hour.`, F, r, sign: -1, out: 'height H (inches)', O: 'H', v: 't', unit: 'hour', money: false };
}
export const contextLinModel: Gen = (R, n) => {
  const C = linCtx(R), { F, r } = C, s = C.sign, v = `<i>${C.v}</i>`, out = `<i>${C.O}</i>`;
  const right = `${out} = ${nH(F)} ${s > 0 ? '+' : '−'} ${nH(r)}${v}`;
  return choice(R, {
    id: `contextLinModel-${n}`, family: 'contextLinModel', prompt: `${C.story} Which model gives the ${C.out} after ${v} ${C.unit}s?`,
    board: `\\text{the same amount per ${C.unit}}`,
    solution: [`The same amount, ${nH(r)}, is ${s > 0 ? 'added' : 'taken off'} for every ${C.unit}: linear, with rate ${s > 0 ? '' : '−'}${nH(r)}.`, `The start value is ${nH(F)}: ${ans(right)}.`],
  }, [
    { t: right, ok: true, say: 'Right: a start value plus the same change per unit is linear.' },
    { t: `${out} = ${s > 0 ? '' : '−'}${nH(r)}${v}`, mc: s > 0 ? MC.nonProp : undefined, say: `That leaves out the ${nH(F)} you start with.${s > 0 ? ' Not proportional: even 0 units cost the fixed part.' : ''}` },
    { t: `${out} = ${nH(F)} · ${nH(r9(1 + s * r / 100))}<sup>${C.v}</sup>`, mc: MC.constAmount, say: `The same AMOUNT each ${C.unit}, not the same percent: linear, not exponential.` },
    { t: `${out} = ${nH(F)} ${s > 0 ? '+' : '−'} ${nH(r)}${v}<sup>2</sup>`, say: 'The change per unit stays the same, so there is no square.' },
  ]);
};
export const contextLinValue: Gen = (R, n) => {
  for (;;) {
    const C = linCtx(R);
    if (!C.money) continue;
    const { F, r } = C, a = pick(R, [1, 2, 3]), k = pick(R, [3, 2, 4]) * a;
    const ya = F + r * a, yk = F + r * k, U = (m: number) => `${m} ${C.unit}${m === 1 ? '' : 's'}`;
    return numItem({
      id: `contextLinValue-${n}`, family: 'contextLinValue',
      prompt: `${C.story} ${U(a)} cost${a === 1 ? 's' : ''} $${nH(ya)} in all. What do ${U(k)} cost in all?`,
      board: `${a}\\ \\to\\ \\$${nT(ya)}\\qquad ${k}\\ \\to\\ \\$\\,?`, unit: 'dollars',
      solution: [`Linear: a fixed $${nH(F)} plus $${nH(r)} per ${C.unit}.`, `${nH(F)} + ${nH(r)} × ${k} = ${ans('$' + nH(yk))}.`],
    }, yk, `Right: $${nH(F)} + $${nH(r)} × ${k} = $${nH(yk)}.`, [[ya * k / a, MC.nonProp, `Scaling $${nH(ya)} by ${k / a} also multiplies the fixed $${nH(F)}. Only the per-${C.unit} part grows.`]], `Start value + rate × ${k}.`);
  }
};


// ===================== context-exponential =====================
const EXP_STORIES: { t: (R: () => number) => string; fam: 'Linear' | 'Exponential' | 'Not enough information'; why: string; mcWrong?: Partial<Record<string, string>> }[] = [
  { t: R => `A savings account earns ${pick(R, [2, 3, 4, 5])}% interest per year on its current balance. The balance over the years:`, fam: 'Exponential', why: 'The same PERCENT of the current balance each year: the same factor every year.', mcWrong: { Linear: MC.constAmount } },
  { t: R => `A town’s population grows by ${pick(R, [1.5, 2, 3])}% every year. The population over the years:`, fam: 'Exponential', why: 'The same percent each year: multiply by the same factor.', mcWrong: { Linear: MC.constAmount } },
  { t: R => `A car loses ${pick(R, [10, 15, 20])}% of its current value every year. Its value over the years:`, fam: 'Exponential', why: 'The same percent of what is left each year: exponential decay.', mcWrong: { Linear: MC.constAmount } },
  { t: R => `A savings jar gets $${pick(R, [5, 10, 20])} added every week. The amount in the jar over the weeks:`, fam: 'Linear', why: 'The same AMOUNT each week: linear.' },
  { t: R => `A deposit earns simple interest: ${pick(R, [3, 4, 5])}% of the ORIGINAL deposit is added each year. The balance over the years:`, fam: 'Linear', why: 'A percent of the ORIGINAL amount is the same dollar amount every year: linear.' },
  { t: R => `A store adds ${pick(R, [6, 7, 8])}% sales tax once at checkout. The total you pay against the price of the item:`, fam: 'Linear', why: 'A one-time percent is one multiplication: total = (1 + the tax rate) × price, a line through 0. Nothing repeats.' },
  { t: R => `A video’s views “grow faster and faster” (${pick(R, ['says the creator', 'says a news post', 'says a friend'])}). The views over the days:`, fam: 'Not enough information', why: 'Faster and faster fits quadratic or exponential growth (or others). Without the same factor per day there is not enough to choose.', mcWrong: { Exponential: MC.roughShape } },
  { t: R => `Rent goes up $${pick(R, [25, 40, 50])} every year. The rent over the years:`, fam: 'Linear', why: 'The same amount each year: linear.' },
];
export const contextWhichFamily: Gen = (R, n) => {
  const S = pick(R, EXP_STORIES), story = S.t(R);
  const opts = ['Linear', 'Exponential', 'Not enough information'] as const;
  return choice(R, {
    id: `contextWhichFamily-${n}`, family: 'contextWhichFamily', prompt: `${story} which model fits?`, board: '\\text{same amount or same percent?}',
    solution: [S.why, `So: ${ans(S.fam)}.`],
  }, opts.map(o => ({ t: o, ok: o === S.fam, mc: o === S.fam ? undefined : S.mcWrong?.[o], say: o === S.fam ? `Right. ${S.why}` : S.why })), true);
};
export const contextExpValue: Gen = (R, n) => {
  for (;;) {
    const P = pick(R, [500, 1000, 1200, 2000, 2500, 5000]), r = pick(R, [3, 4, 5, 6, 8]), N = pick(R, [3, 4, 5, 6, 10]);
    const v = P * (1 + r / 100) ** N;
    if (nearTie(v, 2)) continue;
    const ans2 = rnd(v, 2), simple = r9(P * (1 + N * r / 100));
    return numItem({
      id: `contextExpValue-${n}`, family: 'contextExpValue',
      prompt: `$${nH(P)} is invested at ${r}% interest per year, compounded yearly. What is the balance after ${N} years, to the nearest cent? (Use a calculator.)`,
      board: `${nT(P)}\\cdot (1.${String(r).padStart(2, '0')})^{${N}}`, unit: 'dollars',
      solution: [`Each year multiplies the balance by 1 + ${r / 100} = ${nH(1 + r / 100)}.`, `${nH(P)} × ${nH(1 + r / 100)}<sup>${N}</sup> ≈ ${ans(usd(ans2, true))}.`],
    }, ans2, `Right: ${usd(ans2, true)}.`, [[simple, MC.addPct, `That adds ${r}% of $${nH(P)} ${N} times (${N * r}%). Each year’s ${r}% is of a bigger balance: multiply by ${nH(1 + r / 100)} ${N} times.`], [r9(P * r / 100 * N), undefined, 'That is only the interest, and as simple interest.']], 'Multiply by the factor once per year: P × (1 + r)ᴺ, round at the end.', 0.005);
  }
};

// ===================== context-quadratic-product =====================
const PRODUCT: { t: (R: () => number) => string; fam: F3; why: string; wrongMc?: Partial<Record<F3, string>> }[] = [
  { t: R => `A square patio has side length s feet; s can be anything from ${pick(R, [4, 6, 8])} to ${pick(R, [15, 20, 25])}. Its area (ft²) as a function of s:`, fam: 'Quadratic', why: 'Area = s · s: a product of two quantities that BOTH grow with s.', wrongMc: { Exponential: MC.roughShape } },
  { t: R => { const a = pick(R, [2, 3, 4]), b = pick(R, [12, 14, 16]); return `A rectangle has length x + ${a} and width ${b} − x (inches). Its area as a function of x:`; }, fam: 'Quadratic', why: 'Both dimensions change with x, so area = (x + a)(b − x) has an x² term.', wrongMc: { Linear: undefined } },
  { t: R => { const q = pick(R, [200, 300, 400]), k = pick(R, [4, 5, 10]); return `A theater sells ${q} − ${k}p tickets when the price is p dollars. Its revenue (price × tickets) as a function of p:`; }, fam: 'Quadratic', why: 'Revenue = p · (tickets), and the number of tickets also depends on p: a product of two linear expressions in p.' },
  { t: R => `Tickets cost a fixed $${pick(R, [8, 12, 15])} each. The revenue as a function of the number of tickets sold n:`, fam: 'Linear', why: 'Price × n with a FIXED price: only one factor changes, so it is linear.', wrongMc: { Quadratic: MC.product } },
  { t: R => `A rectangle has a fixed width of ${pick(R, [3, 5, 6])} ft and length x + ${pick(R, [2, 3, 4])} ft. Its area as a function of x:`, fam: 'Linear', why: 'One side is fixed, so area = (fixed) × (x + c): linear.', wrongMc: { Quadratic: MC.product } },
  { t: R => `A garden plot is x ft long and ${pick(R, [2, 3])} times as wide as it is long. Its area as a function of x:`, fam: 'Quadratic', why: 'Width = kx also changes with x, so area = x · kx = kx²: quadratic.' },
];
export const productFamily: Gen = (R, n) => {
  const S = pick(R, PRODUCT), story = S.t(R);
  return famChoice(R, { id: `productFamily-${n}`, family: 'productFamily', prompt: `${story} which family?`, board: '\\text{a product of two changing quantities?}', solution: [S.why, `So: ${ans(S.fam)}.`] },
    S.fam, { Linear: S.fam === 'Linear' ? S.why : `${S.why}`, Quadratic: S.fam === 'Quadratic' ? S.why : S.why, Exponential: S.fam === 'Exponential' ? S.why : `Nothing is multiplied by the same factor each step. ${S.why}` },
    S.wrongMc ?? {});
};
export const productModel: Gen = (R, n) => {
  if (R() < 0.5) {
    const q = pick(R, [200, 240, 300, 400]), k = pick(R, [4, 5, 8, 10]), p = pick(R, [5, 10, 15, 20]);
    const Rv = p * (q - k * p);
    return choice(R, {
      id: `productModel-${n}`, family: 'productModel', prompt: `A club sells ${q} − ${k}p shirts when the price is p dollars. Which model gives the revenue R (dollars) at price p? (Revenue = price × number sold.)`,
      board: `R = p\\cdot (\\text{shirts sold})`,
      solution: [`Revenue = price × shirts = p(${q} − ${k}p).`, `Check p = ${p}: ${p} × ${q - k * p} = $${nH(Rv)}. So: ${ans(`<i>R</i> = <i>p</i>(${q} − ${k}<i>p</i>)`)}.`],
    }, [
      { t: `<i>R</i> = <i>p</i>(${q} − ${k}<i>p</i>)`, ok: true, say: 'Right: price times the number sold, and both depend on p. Quadratic.' },
      { t: `<i>R</i> = ${q} − ${k}<i>p</i>`, say: 'That is the number of shirts sold, not the revenue.' },
      { t: `<i>R</i> = ${q}<i>p</i>`, mc: MC.nonProp, say: `That pretends ${q} shirts sell at every price. Fewer sell when p goes up.` },
      { t: `<i>R</i> = ${q} · ${k}<sup>p</sup>`, mc: MC.roughShape, say: 'Nothing is multiplied by the same factor per dollar. Revenue is a product of two linear expressions.' },
    ]);
  }
  const a = pick(R, [2, 3, 4]), b = pick(R, [10, 12, 14, 16]);
  return choice(R, {
    id: `productModel-${n}`, family: 'productModel', prompt: `A rectangle has length <i>x</i> + ${a} cm and width ${b} − <i>x</i> cm. Which expression gives its area?`,
    board: `\\text{area} = \\text{length}\\times\\text{width}`,
    solution: ['Area = length × width.', `So: ${ans(`(<i>x</i> + ${a})(${b} − <i>x</i>)`)}, a quadratic in x.`],
  }, [
    { t: `(<i>x</i> + ${a})(${b} − <i>x</i>)`, ok: true, say: 'Right: length times width. Both change with x, so the area is quadratic.' },
    { t: `2(<i>x</i> + ${a}) + 2(${b} − <i>x</i>)`, say: 'That is the perimeter (it is even constant here!). Area multiplies the sides.' },
    { t: `(<i>x</i> + ${a}) + (${b} − <i>x</i>)`, say: 'Adding the sides gives half the perimeter, not the area.' },
    { t: `${b}(<i>x</i> + ${a})`, mc: MC.product, say: `That keeps the width at ${b}, but the width is ${b} − x.` },
  ]);
};

// ===================== context-quadratic-rate =====================
const RATE_STORIES: { t: (R: () => number) => string; fam: F3; why: string; wrongMc?: Partial<Record<F3, string>> }[] = [
  { t: () => 'A rock falls from rest (no air resistance): its speed grows by 32 ft/s every second. The DISTANCE it has fallen against time:', fam: 'Quadratic', why: 'The rate (the speed) changes by the same amount, 32 ft/s, every second: the distance is quadratic (16t²).', wrongMc: { Exponential: MC.roughShape } },
  { t: () => 'A rock falls from rest (no air resistance): its speed grows by 32 ft/s every second. Its SPEED against time:', fam: 'Linear', why: 'The speed itself changes by the same amount each second: the speed is linear.' },
  { t: R => `Maya saves $${pick(R, [5, 10, 20])} in week 1, and each week she saves $2 more than the week before. Her TOTAL savings against the number of weeks:`, fam: 'Quadratic', why: 'The weekly amount (the rate) grows by the same $2 each week, so the total is quadratic.', wrongMc: { Exponential: MC.roughShape, Linear: MC.rateConst } },
  { t: R => `Maya saves $${pick(R, [5, 10, 20])} in week 1, and each week she saves $2 more than the week before. The amount she saves IN a given week against the week number:`, fam: 'Linear', why: 'The weekly amount goes up by the same $2 each week: linear.' },
  { t: R => `Each week Leo saves ${pick(R, [5, 10, 20])}% more than he saved the week before. The amount he saves IN a given week against the week number:`, fam: 'Exponential', why: 'The weekly amount is multiplied by the same factor each week: exponential.', wrongMc: { Quadratic: MC.diffOnly } },
  { t: R => `A cyclist rides at a steady ${pick(R, [12, 15, 18])} mi/h. The distance against time:`, fam: 'Linear', why: 'The rate (the speed) does not change: linear.' },
  { t: R => `A cart rolls from rest down a ramp; its speed grows by ${pick(R, [2, 3, 4])} m/s every second. The distance it has rolled against time:`, fam: 'Quadratic', why: 'The speed changes by the same amount every second, so the distance is quadratic.', wrongMc: { Exponential: MC.roughShape } },
];
export const rateChangeFamily: Gen = (R, n) => {
  const S = pick(R, RATE_STORIES), story = S.t(R);
  const say = { Linear: S.why, Quadratic: S.why, Exponential: S.why };
  return famChoice(R, { id: `rateChangeFamily-${n}`, family: 'rateChangeFamily', prompt: `${story} which family?`, board: '\\text{how does the rate change?}', solution: [S.why, `So: ${ans(S.fam)}.`] }, S.fam, say, S.wrongMc ?? {});
};
export const savingsTotal: Gen = (R, n) => {
  const d = pick(R, [5, 10, 15, 20]), inc = pick(R, [2, 3, 5]), N = pick(R, [6, 8, 10]);
  const week = (k: number) => d + inc * (k - 1), total = (k: number) => k * d + inc * k * (k - 1) / 2;
  const ws = xsOf(1, 1, 4), ts = ws.map(total), T = total(N);
  const linGuess = ts[3]! + (ts[3]! - ts[2]!) * (N - 4);
  return numItem({
    id: `savingsTotal-${n}`, family: 'savingsTotal',
    prompt: `Maya saves $${d} in week 1 and each week $${inc} more than the week before. The table shows her total. What is her total after ${N} weeks?`,
    board: `\\text{week } ${N}:\\ \\text{total} = \\,?`, unit: 'dollars', picture: { t: tpic(ws, ts, { xName: 'week', yName: 'total ($)', solve: ['d1', 'd2'] }) },
    solution: [`The 1st differences are the weekly amounts ${ws.map(k => week(k)).join(', ')}, ...: they grow by ${inc} (the 2nd difference).`, `Weeks 1 to ${N}: ${Array.from({ length: N }, (_, i) => week(i + 1)).join(' + ')} = ${ans('$' + nH(T))}.`],
  }, T, `Right: $${nH(T)}. The total is quadratic in the number of weeks.`, [
    [linGuess, MC.rateConst, `That keeps adding $${week(4)} a week. Each week adds $${inc} more than the week before.`],
    [d * N, undefined, `That is $${d} every week. The weekly amount grows by $${inc}.`],
  ], 'Add the weekly amounts: they go up by the same amount each week.');
};

// ===================== finite-data-nonunique =====================
/** y = Ax² + Bx + C in HTML (a 0 term left out) */
const quadH = (A: number, B: number, C: number) => `<i>y</i> = ${A === 1 ? '' : nH(A)}<i>x</i><sup>2</sup>${B ? ` ${B < 0 ? '−' : '+'} ${Math.abs(B) === 1 ? '' : nH(Math.abs(B))}<i>x</i>` : ''}${C ? ` + ${nH(C)}` : ''}`;
export const twoModelsAgree: Gen = (R, n) => {
  if (R() < 0.5) {
    const a = pick(R, [2, 3, 4, 5, 10]), b = pick(R, [2, 3]);
    const lin = (x: number) => a + a * (b - 1) * x, ex = (x: number) => a * b ** x, k = pick(R, [2, 3, 4]);
    const linH = `<i>y</i> = ${a} + ${a * (b - 1)}${'<i>x</i>'}`, expH = `<i>y</i> = ${a} · ${b}<sup>x</sup>`;
    return choice(R, {
      id: `twoModelsAgree-${n}`, family: 'twoModelsAgree', prompt: `Two observations: (0, ${a}) and (1, ${a * b}). Both ${linH} and ${expH} fit them. Which next observation would show which model is better?`,
      board: `(0,\\ ${a}),\\ (1,\\ ${a * b})`,
      solution: [`At x = 0 and x = 1 both models give ${a} and ${a * b}.`, `At x = ${k}: ${lin(k)} against ${ex(k)}. So: ${ans(`Measure y at x = ${k}`)}.`],
    }, [
      { t: `Measure y at x = ${k}`, ok: true, say: `Right: the line gives ${lin(k)}, the exponential ${ex(k)}.` },
      { t: 'Measure y at x = 0 again', say: `Both models give ${a} there.` },
      { t: 'Measure y at x = 1 again', say: `Both models give ${a * b} there.` },
      { t: 'No observation can: two models that agree twice agree everywhere', mc: MC.finite, say: `They only agree at the observed inputs: at x = ${k} they give ${lin(k)} and ${ex(k)}.` },
    ]);
  }
  // three points from an exponential, and the quadratic through them
  const a = pick(R, [1, 2, 3, 4]), b = pick(R, [2, 3]);
  const y = [a, a * b, a * b * b], A = (y[2]! - 2 * y[1]! + y[0]!) / 2, B = y[1]! - y[0]! - A;
  const q = (x: number) => A * x * x + B * x + a, ex = (x: number) => a * b ** x;
  const qH = quadH(A, B, a);
  const k = 3;
  return choice(R, {
    id: `twoModelsAgree-${n}`, family: 'twoModelsAgree', prompt: `Three observations: (0, ${y[0]}), (1, ${y[1]}), (2, ${y[2]}). Both <i>y</i> = ${a === 1 ? '' : a + ' · '}${b}<sup>x</sup> and ${qH} fit them. Which next observation would show which model is better?`,
    board: `(0,\\ ${y[0]}),\\ (1,\\ ${y[1]}),\\ (2,\\ ${y[2]})`,
    solution: ['At x = 0, 1, 2 both give the same values.', `At x = ${k}: ${ex(k)} against ${q(k)}. So: ${ans(`Measure y at x = ${k}`)}.`],
  }, [
    { t: `Measure y at x = ${k}`, ok: true, say: `Right: the exponential gives ${ex(k)}, the quadratic ${nH(q(k))}.` },
    { t: 'Measure y at x = 2 again', say: `Both give ${y[2]} there.` },
    { t: 'Measure y at x = 1 again', say: `Both give ${y[1]} there.` },
    { t: 'No observation can: three matching points fix the rule', mc: MC.finite, say: `Three points fit many rules: at x = ${k} these two give ${ex(k)} and ${nH(q(k))}.` },
  ]);
};
export const enoughData: Gen = (R, n) => {
  const a = pick(R, [1, 2, 3, 4, 5, 6, 8, 10]), b = pick(R, [2, 3]);
  const y = [a, a * b, a * b * b], A = (y[2]! - 2 * y[1]! + y[0]!) / 2, B = y[1]! - y[0]! - A;
  const qH = quadH(A, B, a);
  return choice(R, {
    id: `enoughData-${n}`, family: 'enoughData', prompt: `Only three points are known: (0, ${y[0]}), (1, ${y[1]}), (2, ${y[2]}). Each ratio is ×${b}. What can you conclude?`,
    board: `(0,\\ ${y[0]}),\\ (1,\\ ${y[1]})\\qquad (2,\\ ${y[2]})`, picture: { t: tpic([0, 1, 2], y, { show: ['rt'] }) },
    solution: [`${qH} gives ${y[0]}, ${y[1]}, ${y[2]} at x = 0, 1, 2 as well.`, 'Three points are consistent with an exponential, but they do not settle the family.'],
  }, [
    { t: `Not settled: ${qH} fits all three points too`, ok: true, say: `Right. Check it: x = 2 gives ${nH(A * 4 + B * 2 + a)}. More data (or the context) must decide.` },
    { t: 'Exponential for sure: the ratios are equal', mc: MC.finite, say: `Equal ratios make it CONSISTENT with exponential. The quadratic ${qH} passes through the same three points.` },
    { t: 'Quadratic for sure: a quadratic fits', mc: MC.finite, say: 'An exponential fits too. Three points cannot decide between them.' },
  ]);
};

// ===================== noisy-data =====================
export const noisyChoose: Gen = (R, n) => {
  for (;;) {
    const expTrue = R() < 0.5, tol = pick(R, [2, 3, 5]);
    const a = pick(R, [40, 50, 60, 80]), b = pick(R, [1.1, 1.2]), m = pick(R, [6, 8, 10, 12]);
    const ts = xsOf(0, 1, 6);
    const truth = (t: number) => (expTrue ? a * b ** t : a + m * t);
    const noise = ts.map(() => pick(R, [-1, 0, 1]) * (tol >= 3 ? 1 : 0.5));
    const meas = ts.map((t, i) => Math.round((truth(t) + noise[i]!) * 10) / 10);
    // A: the line through the first two measured points; B: the exponential with the true a, b (rounded predictions)
    const s0 = meas[1]! - meas[0]!;
    const A = ts.map(t => Math.round((meas[0]! + s0 * t) * 10) / 10);
    const B = ts.map(t => Math.round((expTrue ? a * b ** t : a * (1 + m / a) ** t) * 10) / 10);
    const okA = ts.every((_, i) => Math.abs(A[i]! - meas[i]!) <= tol + 1e-9), okB = ts.every((_, i) => Math.abs(B[i]! - meas[i]!) <= tol + 1e-9);
    if (okA === okB) continue;
    if (ts.every((_, i) => Math.abs(A[i]! - meas[i]!) < 1e-9) || ts.every((_, i) => Math.abs(B[i]! - meas[i]!) < 1e-9)) continue;
    const winner = okA ? 'A' : 'B', loser = okA ? 'B' : 'A';
    const bad = ts.findIndex((_, i) => Math.abs((okA ? B : A)[i]! - meas[i]!) > tol);
    const loserFirstOk = Math.abs((okA ? B : A)[0]! - meas[0]!) <= tol && Math.abs((okA ? B : A)[1]! - meas[1]!) <= tol;
    return choice(R, {
      id: `noisyChoose-${n}`, family: 'noisyChoose', prompt: `Measured values and two candidate models’ predictions (A is linear, B is exponential). A model is good enough if every prediction is within ±${tol} of the measurement. Which model is good enough?`,
      board: `\\text{within } \\pm ${tol}\\ ?`,
      picture: { t: { xName: 'year', xs: ts.map(String), cols: [{ name: 'measured', vals: meas.map(v => nH(v)), col: 'first' }, { name: 'A', vals: A.map(v => nH(v)), col: 'water' }, { name: 'B', vals: B.map(v => nH(v)), col: 'second' }] } },
      solution: [`Model ${loser} misses at year ${bad}: ${nH((okA ? B : A)[bad]!)} against ${nH(meas[bad]!)}, more than ${tol} off.`, `Model ${winner} is within ±${tol} in every year: ${ans('Model ' + winner)}.`],
    }, [
      { t: 'Model A', ok: okA, mc: okA ? undefined : loserFirstOk ? MC.initialRows : undefined, say: okA ? `Right: every prediction of A is within ${tol}.` : `A fits the first rows, but at year ${bad} it is ${nH(Math.abs(A[bad]! - meas[bad]!))} off. Check every row.` },
      { t: 'Model B', ok: okB, mc: okB ? undefined : loserFirstOk ? MC.initialRows : undefined, say: okB ? `Right: every prediction of B is within ${tol}.` : `At year ${bad} B is ${nH(Math.abs(B[bad]! - meas[bad]!))} off. Check every row.` },
      { t: 'Neither: no model hits every measurement exactly', mc: MC.exactFit, say: `Real data are noisy; that is why there is a tolerance. Model ${winner} stays within ±${tol}.` },
    ], true);
  }
};
export const noisyFormula: Gen = (R, n) => {
  for (;;) {
    const ts = pick(R, [[0, 1, 3, 4, 7], [0, 2, 3, 6], [0, 1, 2, 5, 8], [0, 3, 4, 6]]);
    const expTrue = R() < 0.5, tol = pick(R, [3, 5]);
    const a = pick(R, [50, 80, 100]), b = pick(R, [1.1, 1.2]), m = pick(R, [8, 10, 15]);
    const fA = (t: number) => a + m * t, fB = (t: number) => a * b ** t;
    const truth = expTrue ? fB : fA;
    const meas = ts.map(t => Math.round(truth(t) + pick(R, [-2, -1, 0, 1, 2]) * (tol / 5)));
    const okA = ts.every((t, i) => Math.abs(fA(t) - meas[i]!) <= tol + 1e-9), okB = ts.every((t, i) => Math.abs(fB(t) - meas[i]!) <= tol + 1e-9);
    if (okA === okB) continue;
    const winner = okA ? 'A' : 'B', lf = okA ? fB : fA;
    const bad = ts.findIndex((t, i) => Math.abs(lf(t) - meas[i]!) > tol);
    const fmt = (v: number) => nH(Math.round(v * 10) / 10);
    return choice(R, {
      id: `noisyFormula-${n}`, family: 'noisyFormula', prompt: `Measurements were taken at unequal times. Model A: <i>y</i> = ${a} + ${m}<i>t</i>. Model B: <i>y</i> = ${a} · ${b}<sup>t</sup>. A model is good enough if it is within ±${tol} at every measured time. Which one is? (Use a calculator.)`,
      board: `A:\\ y = ${a} + ${m}t\\qquad B:\\ y = ${a}\\cdot ${b}^{t}\\qquad \\pm ${tol}`,
      picture: { t: tpic(ts, meas, { xName: 't', yName: 'measured' }) },
      solution: [`At t = ${ts[bad]}: A gives ${fmt(fA(ts[bad]!))}, B gives ${fmt(fB(ts[bad]!))}, measured ${meas[bad]}.`, `Model ${winner} is within ±${tol} at every time: ${ans('Model ' + winner)}.`],
    }, [
      { t: 'Model A', ok: okA, say: okA ? `Right: A stays within ±${tol} at every measured time.` : `At t = ${ts[bad]} A gives ${fmt(fA(ts[bad]!))}: more than ${tol} from ${meas[bad]}.` },
      { t: 'Model B', ok: okB, say: okB ? `Right: B stays within ±${tol} at every measured time.` : `At t = ${ts[bad]} B gives ${fmt(fB(ts[bad]!))}: more than ${tol} from ${meas[bad]}.` },
      { t: 'Neither: the raw differences are not constant, so no model can be checked', mc: MC.inputStep, say: 'With unequal times, raw differences mean nothing. Compare each model’s prediction at the actual times instead.' },
    ], true);
  }
};

// ===================== model-domain =====================
export const domainChoice: Gen = (R, n) => {
  const k = int(R, 0, 3);
  if (k === 0) {
    const r = pick(R, [12, 15, 20, 24]), T = pick(R, [20, 25, 30]), G = r * T;
    return choice(R, {
      id: `domainChoice-${n}`, family: 'domainChoice', prompt: `A ${G}-gallon tank drains at ${r} gallons per minute: <i>V</i>(<i>t</i>) = ${G} − ${r}<i>t</i>. For which times <i>t</i> (minutes) does the model make sense?`,
      board: `V(t) = ${G} - ${r}t`, solution: [`The tank is empty when ${G} − ${r}t = 0, at t = ${T}.`, `So ${ans(`0 ≤ <i>t</i> ≤ ${T}`)}.`],
    }, [
      { t: `0 ≤ <i>t</i> ≤ ${T}`, ok: true, say: `Right: from the start until the tank is empty at t = ${T}.` },
      { t: '<i>t</i> ≥ 0', mc: MC.extrap, say: `After t = ${T} the model gives a negative volume: the tank is already empty.` },
      { t: 'all real numbers', mc: MC.allReals, say: 'Negative times and negative volumes make no sense here.' },
      { t: `0 ≤ <i>t</i> ≤ ${G}`, say: `${G} is the volume, not a time. The tank is empty at t = ${T}.` },
    ]);
  }
  if (k === 1) {
    const N = pick(R, [120, 150, 200, 250]), p = pick(R, [8, 10, 12]);
    return choice(R, {
      id: `domainChoice-${n}`, family: 'domainChoice', prompt: `A school play sells tickets at $${p} each; the hall has ${N} seats. Revenue <i>R</i>(<i>n</i>) = ${p}<i>n</i> for <i>n</i> tickets sold. Which domain makes sense?`,
      board: `R(n) = ${p}n`, solution: ['You sell whole tickets, from none up to the number of seats.', `So ${ans(`<i>n</i> = 0, 1, 2, …, ${N}`)}.`],
    }, [
      { t: `<i>n</i> = 0, 1, 2, …, ${N}`, ok: true, say: 'Right: whole numbers of tickets, at most one per seat.' },
      { t: `0 ≤ <i>n</i> ≤ ${N}`, mc: MC.discrete, say: 'That includes 2.5 tickets. Tickets are counted: whole numbers only.' },
      { t: '<i>n</i> ≥ 0', mc: MC.extrap, say: `The hall has ${N} seats: you cannot sell more.` },
    ]);
  }
  if (k === 2) {
    const v = pick(R, [32, 48, 64, 80]), T = v / 16;
    return choice(R, {
      id: `domainChoice-${n}`, family: 'domainChoice', prompt: `A ball is kicked up from the ground: <i>h</i>(<i>t</i>) = −16<i>t</i><sup>2</sup> + ${v}<i>t</i> feet after <i>t</i> seconds. For which times does the model describe the flight?`,
      board: `h(t) = -16t^{2} + ${v}t`, solution: [`h(t) = 0 at t = 0 and t = ${T} (it lands).`, `So ${ans(`0 ≤ <i>t</i> ≤ ${T}`)}.`],
    }, [
      { t: `0 ≤ <i>t</i> ≤ ${T}`, ok: true, say: `Right: from the kick until it lands at t = ${T}.` },
      { t: 'all real numbers', mc: MC.allReals, say: 'Before the kick and after the landing the formula does not describe the ball.' },
      { t: '<i>t</i> ≥ 0', mc: MC.extrap, say: `After t = ${T} the formula gives negative heights: the ball is on the ground.` },
    ]);
  }
  const P = pick(R, [100, 200, 500]), d = pick(R, [20, 25, 50]);
  return choice(R, {
    id: `domainChoice-${n}`, family: 'domainChoice', prompt: `Ana has $${P} and adds $${d} at the end of each month for one year: <i>S</i>(<i>m</i>) = ${P} + ${d}<i>m</i>, where <i>m</i> counts whole months. Which domain fits?`,
    board: `S(m) = ${P} + ${d}m`, solution: ['Whole months from 0 to 12.', `So ${ans('<i>m</i> = 0, 1, 2, …, 12')}.`],
  }, [
    { t: '<i>m</i> = 0, 1, 2, …, 12', ok: true, say: 'Right: she adds money once a month, for 12 months.' },
    { t: '0 ≤ <i>m</i> ≤ 12', mc: MC.discrete, say: 'Money is only added at the end of each month: m counts whole months.' },
    { t: 'all real numbers', mc: MC.allReals, say: 'Negative months and month 30 are outside the plan.' },
  ]);
};
const EXTRAP = [
  { s: (R: () => number) => `A sunflower grew about ${pick(R, [2, 3])} cm per day during the 30 days it was measured, and a line fits the data very well.`, q: 'Should the line be used to predict its height after 3 years?' },
  { s: (R: () => number) => `A child grew about ${pick(R, [2, 2.5])} inches per year from age 6 to 12, and a line fits the data well.`, q: 'Should the line be used to predict the child’s height at age 40?' },
  { s: (R: () => number) => `Bacteria in a dish doubled every ${pick(R, [20, 30])} minutes for the first 4 hours, and an exponential fits the counts well.`, q: 'Should the model be used to predict the count after 3 days?' },
  { s: (R: () => number) => { const r = pick(R, [8, 10, 12]); return `A phone battery starts at 100% and drops about ${r}% per hour during a 5-hour test; a line fits well. For 15 hours the line gives ${nH(100 - 15 * r)}% (below 0).`; }, q: 'Should the line be used to predict the charge after 15 hours?' },
  { s: (R: () => number) => `A town grew ${pick(R, [2, 3, 4])}% per year from 2010 to 2020, and an exponential fits the data well.`, q: 'Should the model be used to predict the population in the year 2300?' },
  { s: (R: () => number) => `A puppy gained about ${pick(R, [1.5, 2])} pounds per week over its first 10 weeks, and a line fits the data well.`, q: 'Should the line be used to predict its weight at 5 years old?' },
];
export const extrapolate: Gen = (R, n) => {
  const E = pick(R, EXTRAP), s = E.s(R);
  return choice(R, {
    id: `extrapolate-${n}`, family: 'extrapolate', prompt: `${s} ${E.q}`, board: '\\text{inside or outside the data?}',
    solution: ['The model was fitted to a limited range of inputs.', 'Far outside it, the change cannot simply continue (plants, people, pets, dishes, batteries and towns have limits): do not extrapolate that far.'],
  }, [
    { t: 'No: that is far outside the measured range, and this change cannot go on forever', ok: true, say: 'Right. A model is only trusted near the data it was fitted on.' },
    { t: 'Yes: the model fits the data well, so it works for any input', mc: MC.extrap, say: 'Fitting the data well says nothing about inputs far outside the data.' },
    { t: 'Yes, as long as the answer is rounded', say: 'Rounding does not fix a prediction from far outside the data.' },
  ]);
};

// ===================== justify-choice =====================
export const justification: Gen = (R, n) => {
  const kind = pick(R, ['lin', 'exp', 'quad'] as const);
  let story: string, pattern: string, mech: string, limit: string, fam: string, wrongMech: string;
  if (kind === 'exp') {
    const P = pick(R, [500, 800, 1000]), r = pick(R, [10, 20]);
    story = `A bank balance starts at $${P} and earns ${r}% per year on the current balance. Its balance for 5 years is in the table.`;
    pattern = `the ratios are all ×${nH(1 + r / 100)}`; mech = `each year adds ${r}% of the CURRENT balance`; limit = 'the rate may change after the years shown';
    fam = 'Exponential'; wrongMech = `each year adds the same $${nH(P * r / 100)}`;
  } else if (kind === 'lin') {
    const G = pick(R, [300, 400, 500]), r = pick(R, [10, 20, 25]);
    story = `A pool holds ${G} gallons and is drained by a pump at ${r} gallons per minute. The table shows the water left every minute.`;
    pattern = `the 1st differences are all −${r}`; mech = `the pump removes the same ${r} gallons every minute`; limit = `it only holds until the pool is empty (t ≤ ${G / r})`;
    fam = 'Linear'; wrongMech = 'the pump removes the same percent every minute';
  } else {
    const d = pick(R, [5, 10]);
    story = `Maya saves $${d} in week 1 and $2 more each week than the week before. The table shows her total.`;
    pattern = 'the 2nd differences are all +2'; mech = 'the weekly amount (the rate) grows by the same $2 each week'; limit = 'it only holds while she keeps the plan';
    fam = 'Quadratic'; wrongMech = 'the total is multiplied by the same factor each week';
  }
  const ts = xsOf(0, 1, 5);
  const ys = kind === 'exp' ? ts.map(t => rnd(Number(story.match(/\$(\d+)/)![1]) * (1 + Number(story.match(/(\d+)%/)![1]) / 100) ** t, 2))
    : kind === 'lin' ? ts.map(t => Number(story.match(/holds (\d+)/)![1]) - Number(story.match(/at (\d+) gallons/)![1]) * t)
      : xsOf(1, 1, 5).map(k => { const d = Number(story.match(/\$(\d+)/)![1]); return k * d + k * (k - 1); });
  const xs = kind === 'quad' ? xsOf(1, 1, 5) : ts;
  const opts: Opt[] = [
    { t: `${fam}: ${pattern}, because ${mech}; ${limit}`, ok: true, say: 'Right: the pattern, the reason in the story, and where the model stops.' },
    { t: `${fam}, because it looks like ${fam === 'Exponential' ? 'an' : 'a'} ${fam.toLowerCase()} graph`, mc: MC.asserts, say: 'That names the family but gives no reason: say which pattern and which mechanism.' },
    { t: `${fam}: ${pattern}, because ${wrongMech}; ${limit}`, say: `The mechanism is wrong: ${mech}.` },
    { t: `${fam === 'Linear' ? 'Exponential' : 'Linear'}: the values change every step, because ${mech}; ${limit}`, say: `Changing values do not pick a family; here ${pattern}.` },
  ];
  return choice(R, {
    id: `justification-${n}`, family: 'justification', prompt: `${story} Which is a complete, correct justification of the model?`, board: '\\text{pattern}\\qquad +\\ \\text{reason}\\qquad +\\ \\text{limit}',
    picture: { t: tpic(xs, ys, { xName: kind === 'lin' ? 'minute' : kind === 'quad' ? 'week' : 'year', yName: kind === 'lin' ? 'gallons' : '$', solve: kind === 'exp' ? ['rt'] : kind === 'lin' ? ['d1'] : ['d1', 'd2'] }) },
    solution: [`Pattern: ${pattern}. Mechanism: ${mech}. Limit: ${limit}.`],
  }, opts);
};
export const insufficientOrNone: Gen = (R, n) => {
  const kind = pick(R, ['two', 'none', 'quad', 'exp'] as const);
  let xs: number[], ys: number[], right: string, why: string;
  if (kind === 'two') {
    const a = pick(R, [40, 60, 80, 100]), b = pick(R, [0.5, 0.75]);
    xs = [0, 1]; ys = [a, r9(a * b)];
    right = 'Not enough data to decide'; why = `Two points fit a line (y = ${a} − ${nH(a - a * b)}x) AND an exponential (y = ${a} · ${b}ˣ). More points are needed.`;
  } else {
    const fam: Fam = kind === 'none' ? 'none' : kind === 'quad' ? 'quadratic' : 'exponential';
    const T = (() => { for (;;) { const xs0 = xsOf(0, 1, 5); const c = int(R, 1, 9); const y0 = fam === 'none' ? xs0.map(x => x * x * x + c) : fam === 'quadratic' ? xs0.map(x => 2 * x * x + c) : xs0.map(x => c * 3 ** x); if (famOf(y0) === fam) return { xs: xs0, ys: y0 }; } })();
    xs = T.xs; ys = T.ys;
    right = kind === 'none' ? 'None of the three fits' : kind === 'quad' ? 'Consistent with quadratic only' : 'Consistent with exponential only';
    why = kind === 'none' ? 'The 1st differences, the 2nd differences and the ratios all change.' : kind === 'quad' ? 'The 2nd differences are all +4.' : 'Every ratio is ×3.';
  }
  const all = ['Consistent with linear only', 'Consistent with quadratic only', 'Consistent with exponential only', 'None of the three fits', 'Not enough data to decide'];
  const opts: Opt[] = all.map(t => ({
    t, ok: t === right,
    mc: t === right ? undefined : kind === 'none' && t.startsWith('C') ? MC.forces : kind === 'two' && t.startsWith('C') ? MC.finite : undefined,
    say: t === right ? `Right. ${why}` : why,
  }));
  return choice(R, {
    id: `insufficientOrNone-${n}`, family: 'insufficientOrNone', prompt: `The x-values are ${xs.join(', ')}. Run the tests: what does this data support?`, board: listLines('y', ys),
    picture: { t: tpic(xs, ys, { solve: xs.length > 2 ? ['d1', 'd2', 'rt'] : ['rt'] }) },
    solution: [why, `So: ${ans(right)}.`],
  }, opts, true);
};
