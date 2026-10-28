// fam1.ts: stage 1 families of "Linear, quadratic or exponential?": the three table tests (equal x-steps first, 1st
// differences, 2nd differences, ratios), why they work, factor to percent, the boundary tables and the mixed
// classification. Every table comes from tables.ts makeTab (exactly one family fits it). Pure: no DOM.
import { type Gen, MC, type Opt, ans, choice, int, numItem, pick, shuffle, xI } from './common';
import { type Fam, allEq, d1, d2, eq, famOf, nH, nT, plusL, r9, rts } from './ff';
import { type Tab, DECAY, GROW, NEG, listLines, makeTab, ratioL, tpic, xsOf } from './tables';

const famWord: Record<Fam, string> = { linear: 'linear', quadratic: 'quadratic', exponential: 'exponential', none: 'none of these' };
const hI = '<i>h</i>';
/** "+2, +2, +4" */
const dl = (vs: readonly number[]) => vs.map(plusL).join(', ');
const rl = (ys: readonly number[]) => rts(ys).map(ratioL).join(', ');
/** "7 + 3", "7 − 3" (never "+ −") */
const addH = (a: number, b: number) => `${nH(a)} ${b < 0 ? '−' : '+'} ${nH(Math.abs(b))}`;
/** "7 − 3", "7 − (−3)" */
export const subH = (a: number, b: number) => `${nH(a)} − ${b < 0 ? `(${nH(b)})` : nH(b)}`;

// ===================== equal-spacing =====================
const UNEQUAL: readonly number[][] = [[0, 1, 3, 4], [0, 2, 3, 5, 6], [1, 2, 4, 8], [0, 5, 10, 20], [0, 0.5, 1, 2], [0, 1, 2, 4, 5], [10, 20, 30, 50], [0, 3, 4, 8]];
function ysAt(R: () => number, xs: readonly number[], lin: boolean): number[] {
  if (lin) { const m = pick(R, [2, 3, 4, 5, -2, -3, 1.5]), c = int(R, 1, 20); return xs.map(x => r9(m * x + c)); }
  const A = pick(R, [1, 2, -1]), c = int(R, 0, 12); return xs.map(x => r9(A * x * x + c));
}
export const spacingCheck: Gen = (R, n) => {
  const equal = R() < 0.55;
  let xs: number[];
  if (equal) { const h = pick(R, [1, 2, 5, 0.5, 10]); xs = xsOf(h >= 5 ? pick(R, [0, 10]) : pick(R, [0, 1, -2]), h, int(R, 4, 6)); }
  else xs = [...pick(R, UNEQUAL)];
  const ys = ysAt(R, xs, R() < 0.5);
  const steps = d1(xs), h0 = steps[0]!;
  const E = (h: number, ok: boolean, say: string): Opt => ({ t: `Equal steps of ${plusL(h)}: the raw tests apply`, ok, say, key: 'E' + h });
  const U = (ok: boolean, say: string): Opt => ({ t: 'Unequal steps: the raw difference and ratio tests do not apply', ok, say, key: 'U' });
  const okSay = equal ? `Yes. Every x-step is ${plusL(h0)}, so neighbouring rows are equally far apart and the tests compare like with like.`
    : `Right. The x-steps are ${dl(steps)}: not all equal, so a bigger change could just come from a bigger gap.`;
  const opts: Opt[] = equal
    ? [E(h0, true, okSay), U(false, `Look again: every x-step is ${plusL(h0)}.`), E(h0 === 1 ? 2 : 1, false, `The steps are equal, but they are ${plusL(h0)}, not ${plusL(h0 === 1 ? 2 : 1)}. Equal steps of any size are fine.`)]
    : [U(true, okSay), E(h0, false, `The first step is ${plusL(h0)}, but the steps are ${dl(steps)}: not all equal.`), E(h0 === 1 ? 2 : 1, false, `The x-steps are ${dl(steps)}: not all equal.`)];
  return choice(R, {
    id: `spacingCheck-${n}`, family: 'spacingCheck', prompt: 'Check the inputs before any test. Which is true for this table?',
    board: listLines('x', xs), picture: { t: tpic(xs, ys, { solve: ['dx'] }) },
    solution: [`The x-steps are ${dl(steps)}.`, equal ? 'They are all equal, so the raw tests may be used.' : 'They are not all equal, so raw differences and ratios do not compare equal intervals.'],
  }, opts);
};
const UNEQ_LIN: readonly number[][] = [[0, 1, 3, 4, 7], [0, 2, 3, 6], [1, 2, 5, 6, 10], [0, 1, 4, 5], [0, 3, 4, 8], [2, 3, 6, 7, 9]];
export const unequalSlope: Gen = (R, n) => {
  const xs = [...pick(R, UNEQ_LIN)], m = pick(R, [1.5, 2, 3, 4, 5, 0.5, -2, -3, 2.5]), c = int(R, 0, 20);
  const ys = xs.map(x => r9(m * x + c));
  const gaps = d1(xs), idx = gaps.map((g, i) => (g > 1 ? i : -1)).filter(i => i >= 0);
  const i = pick(R, idx), a = xs[i]!, b = xs[i + 1]!, dy = r9(ys[i + 1]! - ys[i]!), dx = r9(b - a);
  return numItem({
    id: `unequalSlope-${n}`, family: 'unequalSlope',
    prompt: `The x-steps are not equal. What is Δy/Δx from ${xI} = ${nH(a)} to ${xI} = ${nH(b)}?`,
    board: `\\dfrac{\\Delta y}{\\Delta x} = \\,?`, picture: { t: tpic(xs, ys, { show: ['dx'], solve: ['d1'] }) },
    solution: [`Δy = ${subH(ys[i + 1]!, ys[i]!)} = ${nH(dy)}, and Δx = ${subH(b, a)} = ${nH(dx)}.`, `Δy/Δx = ${nH(dy)} ÷ ${nH(dx)} = ${ans(nH(m))}.`],
  }, m, `Right: ${nH(dy)} ÷ ${nH(dx)} = ${nH(m)}. With unequal steps, Δy/Δx still checks linearity.`,
  [[dy, MC.inputStep, `That is Δy alone. The step from ${nH(a)} to ${nH(b)} is ${nH(dx)} wide: divide by it.`]], 'Divide the change in y by the change in x over that interval.');
};
export const unequalVerdict: Gen = (R, n) => {
  const lin = R() < 0.5;
  const xs = [...pick(R, UNEQ_LIN)];
  const m = pick(R, [2, 3, 4, -2, 1.5]), c = int(R, 1, 15), A = pick(R, [1, 2]);
  const ys = lin ? xs.map(x => r9(m * x + c)) : xs.map(x => r9(A * x * x + c));
  const sl = d1(ys).map((d, i) => r9(d / (xs[i + 1]! - xs[i]!)));
  const opts: Opt[] = lin ? [
    { t: `Linear: Δy/Δx = ${nH(m)} on every interval`, ok: true, say: `Right. Δy/Δx is ${nH(m)} on every interval, so the points lie on one line.` },
    { t: 'Not linear: the raw 1st differences are not all equal', mc: MC.inputStep, say: 'The raw differences differ only because the x-gaps differ. Divide each by its x-gap: Δy/Δx is the same every time.' },
    { t: 'Nothing can be decided: the x-steps are unequal', say: 'Raw differences and ratios do not apply, but Δy/Δx over each interval still checks linearity.' },
  ] : [
    { t: 'Not linear (Δy/Δx changes); with unequal steps the raw 2nd-difference and ratio tests do not apply', ok: true, say: `Right. Δy/Δx is ${sl.map(v => nH(v)).join(', ')}: not linear, and the other raw tests need equal steps.` },
    { t: 'Linear: Δy/Δx is the same on every interval', say: `Work it out: Δy/Δx is ${sl.map(v => nH(v)).join(', ')}. Not the same.` },
    { t: 'None of the three: even after dividing each difference by its x-gap, the values are unequal', mc: MC.gapRepair, say: 'Dividing by the x-gap repairs only the linear test. Unequal Δy/Δx rules out linear, nothing more.' },
  ];
  return choice(R, {
    id: `unequalVerdict-${n}`, family: 'unequalVerdict', prompt: 'The x-steps in this table are not equal. What can you conclude?',
    board: `\\dfrac{\\Delta y}{\\Delta x}\\qquad \\text{on each interval}`, picture: { t: tpic(xs, ys, { show: ['dx'], solve: ['d1'] }) },
    solution: [`Δy/Δx on the intervals: ${sl.map(v => nH(v)).join(', ')}.`, lin ? 'All the same: consistent with a linear function.' : 'Not all the same: not linear. With unequal steps the raw 2nd-difference and ratio tests say nothing.'],
  }, opts);
};

// ===================== first-differences =====================
export const slopeFromDiff: Gen = (R, n) => {
  const h = R() < 0.2 ? 1 : pick(R, [2, 5, 0.5, 4, 10]);
  const m = pick(R, h === 0.5 ? [2, 4, 6, -4, 10, 3] : [1.5, 2, 3, -2, -3, 0.5, 4, 2.5, -1.5]);
  const d = r9(m * h), x0 = pick(R, [0, 1, 2, -2]), c = int(R, -10, 40);
  const xs = xsOf(x0, h, 5), ys = xs.map((_, i) => r9(c + d * i));
  return numItem({
    id: `slopeFromDiff-${n}`, family: 'slopeFromDiff',
    prompt: `Every 1st difference is ${plusL(d)} and every x-step is ${plusL(h)}. What is the slope: the change in ${'<i>y</i>'} for each 1 unit of ${xI}?`,
    board: `m = \\dfrac{\\Delta y}{\\Delta x} = \\,?`, picture: { t: tpic(xs, ys, { show: ['dx', 'd1'] }) },
    solution: [`Each step of ${nH(h)} in x changes y by ${nH(d)}.`, `Slope = ${nH(d)} ÷ ${nH(h)} = ${ans(nH(m))}.`],
  }, m, `Right: ${nH(d)} per ${nH(h)} units of x is ${nH(m)} per unit.`,
  h === 1 ? [] : [[d, MC.inputStep, `${nH(d)} is the change per step of ${nH(h)}, not per 1 unit. Divide by the step.`]], 'Slope = (1st difference) ÷ (x-step).');
};
export const isLinear: Gen = (R, n) => {
  const truth = R() < 0.5;
  const h = pick(R, [1, 1, 2]);
  let T: Tab;
  if (truth) T = makeTab(R, 'linear', { n: 5, x0: pick(R, [0, 1]), h });
  else if (R() < 0.5) T = makeTab(R, 'quadratic', { n: 5, x0: 0, h });
  else {
    // a linear table with one value nudged: "almost" linear
    const L = makeTab(R, 'linear', { n: 5, x0: 0, h }), j = int(R, 1, 3), ys = L.ys.slice();
    ys[j] = r9(ys[j]! + pick(R, [1, 2, -1, -2]));
    T = { xs: L.xs, ys, fam: famOf(ys) };
  }
  const D = d1(T.ys);
  const opts: Opt[] = [
    { t: `Consistent with a linear function: every 1st difference is ${plusL(D[0]!)}`, ok: truth, say: truth ? `Right. Every 1st difference is ${plusL(D[0]!)}: consistent with a linear function.` : `Not every one: the 1st differences are ${dl(D)}.` },
    { t: 'Not linear: the 1st differences are not all equal', ok: !truth, say: !truth ? `Right: ${dl(D)}. One unequal difference is enough.` : `They are all ${plusL(D[0]!)}. Look again.` },
    { t: 'Proved linear for every x: the table settles it', mc: truth ? MC.finite : undefined, say: truth ? 'A table shows only some rows. It is consistent with a line; another rule could pass through the same points.' : `The differences are ${dl(D)}, so it is not linear at all.` },
  ];
  return choice(R, {
    id: `isLinear-${n}`, family: 'isLinear', prompt: `The x-steps are all ${plusL(h)}. Which conclusion does the table support?`,
    board: listLines('y', T.ys), picture: { t: tpic(T.xs, T.ys, { solve: ['d1'] }) },
    solution: [`1st differences: ${dl(D)}.`, truth ? 'All equal: consistent with a linear function (a table cannot prove more).' : 'Not all equal: not linear.'],
  }, opts);
};

// ===================== second-differences =====================
export const secondDiffClassify: Gen = (R, n) => {
  const r = R();
  let T: Tab;
  if (r < 0.15) { const A = pick(R, [1, 3]); const xs = xsOf(0, 1, 5); T = { xs, ys: xs.map(x => A * x * x), fam: 'quadratic' }; }
  else if (r < 0.3) { const xs = xsOf(-2, 2, 5); T = { xs, ys: xs.map(x => r9(-x * x + 4 * x)), fam: 'quadratic' }; }
  else if (r < 0.55) T = makeTab(R, 'quadratic', { n: 5, x0: pick(R, [0, 1, -1]), h: pick(R, [1, 2]), zero: R() < 0.4 });
  else if (r < 0.78) T = makeTab(R, 'linear', { n: 5, x0: 0, h: pick(R, [1, 2]) });
  else T = makeTab(R, 'exponential', { n: 5, sign: 'grow' });
  const D2 = d2(T.ys), quad = T.fam === 'quadratic', lin = T.fam === 'linear';
  const opts: Opt[] = [
    { t: 'Constant and not 0: consistent with a quadratic function', ok: quad, say: quad ? `Right: every 2nd difference is ${plusL(D2[0]!)}.` : `The 2nd differences are ${dl(D2)}.` },
    { t: 'All 0: linear, not quadratic', ok: lin, say: lin ? 'Right. 2nd differences of 0 mean the 1st differences are constant: a line. A quadratic needs a ≠ 0.' : `The 2nd differences are ${dl(D2)}, not all 0.` },
    { t: 'Not constant: not quadratic', ok: !quad && !lin, say: !quad && !lin ? `Right: ${dl(D2)}.` : `Look again: they are ${dl(D2)}.` },
    { t: 'All 0: consistent with a quadratic function', mc: MC.zeroD2, say: 'A quadratic has a ≠ 0, so its 2nd differences are constant and NOT 0. All 0 means linear.' },
  ];
  return choice(R, {
    id: `secondDiffClassify-${n}`, family: 'secondDiffClassify', prompt: 'The 1st differences are shown. Work out the 2nd differences. What do they tell you?',
    board: listLines('y', T.ys), picture: { t: tpic(T.xs, T.ys, { show: ['d1'], solve: ['d2'] }) },
    solution: [`1st differences: ${dl(d1(T.ys))}.`, `2nd differences: ${dl(D2)}.`, quad ? 'Constant and not 0: consistent with a quadratic function.' : lin ? 'All 0: the table is linear.' : 'Not constant: not quadratic.'],
  }, opts, true);
};
export const nextValue: Gen = (R, n) => {
  const T = makeTab(R, 'quadratic', { n: 5, x0: pick(R, [0, 1, 2]), h: pick(R, [1, 1, 2]) });
  const D = d1(T.ys), D2 = d2(T.ys), y = T.ys[4]!, lastD = D[2]!, lin = r9(T.ys[3]! + lastD);
  return numItem({
    id: `nextValue-${n}`, family: 'nextValue',
    prompt: `The 2nd differences of this table are constant. Use them to find the missing value at ${xI} = ${nH(T.xs[4]!)}.`,
    board: `y(${nT(T.xs[4]!)}) = \\,?`, picture: { t: tpic(T.xs, T.ys, { hide: [4], solve: ['d1', 'd2'] }) },
    solution: [`1st differences so far: ${dl(D.slice(0, 3))}; 2nd differences: ${dl(D2.slice(0, 2))}.`, `Next 1st difference: ${addH(lastD, D2[0]!)} = ${nH(D[3]!)}.`, `Missing value: ${addH(T.ys[3]!, D[3]!)} = ${ans(nH(y))}.`],
  }, y, `Right: the 1st difference grows by ${nH(D2[0]!)} to ${nH(D[3]!)}, so ${nH(y)}.`,
  [[lin, MC.rateConst, `That repeats the last 1st difference (${plusL(lastD)}). In a quadratic table it changes by ${plusL(D2[0]!)} every step.`]], 'Add the 2nd difference to the last 1st difference, then add that to the last value.');
};

// ===================== ratio-test =====================
export const ratioClassify: Gen = (R, n) => {
  const r = R(), h = pick(R, [1, 1, 2]);
  let T: Tab;
  if (r < 0.55) T = makeTab(R, 'exponential', { n: 5, x0: 0, h, sign: pick(R, ['grow', 'decay', 'neg', 'grow'] as const) });
  else if (r < 0.8) { const A = pick(R, [1, 2, 3]), B = int(R, 0, 4), C = int(R, 1, 9); const xs = xsOf(pick(R, [0, 1]), h, 5); T = { xs, ys: xs.map(x => A * x * x + B * x + C), fam: 'quadratic' }; }
  else T = makeTab(R, 'linear', { n: 5, x0: 0, h });
  if (T.fam === 'linear' && T.ys.some(v => v <= 0)) { const ys = T.ys.map(v => r9(v - Math.min(...T.ys) + int(R, 2, 9))); T = { xs: T.xs, ys, fam: 'linear' }; }
  const exp = T.fam === 'exponential', D = d1(T.ys), b = rts(T.ys)[0]!;
  const down = T.ys[1]! < T.ys[0]!;
  const opts: Opt[] = exp ? [
    { t: `Consistent with exponential: every ratio is ${ratioL(b)}`, ok: true, say: `Right: every ratio is ${ratioL(b)}. Equal factors over equal steps.` },
    { t: 'Not exponential: the 1st differences are not equal', mc: MC.expDiffs, say: 'Unequal differences only rule out linear. The exponential test uses ratios: divide neighbours.' },
    ...(down ? [{ t: 'Not exponential: the values go down', mc: MC.allUp, say: 'Exponential functions can decrease: a factor between 0 and 1 (or a negative a) does that.' }] : []),
  ] : [
    { t: 'Not exponential: the ratios are not all equal', ok: true, say: `Right: the ratios are ${rl(T.ys)}.` },
    T.fam === 'linear'
      ? { t: `Exponential: every 1st difference is ${plusL(D[0]!)}`, mc: MC.expDiffs, say: 'Equal differences make a line. Exponential means equal RATIOS.' }
      : { t: 'Exponential: the 1st differences keep growing', mc: MC.roughShape, say: `Growing differences only rule out linear. The ratios are ${rl(T.ys)}: not equal.` },
  ];
  return choice(R, {
    id: `ratioClassify-${n}`, family: 'ratioClassify', prompt: `Run the ratio test (the x-steps are all ${plusL(h)}). Is the table consistent with an exponential function?`,
    board: `\\dfrac{y_{\\text{next}}}{y}\\ =\\ ?`, picture: { t: tpic(T.xs, T.ys, { solve: ['d1', 'rt'] }) },
    solution: [`Ratios of neighbours: ${rl(T.ys)}.`, exp ? 'All equal: consistent with an exponential function.' : 'Not all equal: not exponential.'],
  }, opts);
};
export const ratioDirection: Gen = (R, n) => {
  const kind = pick(R, ['neg', 'neg', 'decay', 'grow'] as const);
  const T = makeTab(R, 'exponential', { n: 4, x0: 0, h: 1, sign: kind });
  const a = T.ys[0]!, b = rts(T.ys)[0]!, up = T.ys[1]! > T.ys[0]!;
  const wrongMc = a < 0 ? MC.factorDir : b < 1 ? MC.allUp : undefined;
  const why = a < 0 ? `a is negative: ${ratioL(b)} ${b < 1 ? 'shrinks the size, so the values climb toward 0' : 'grows the size, so the values fall further below 0'}.` : b < 1 ? `a > 0 and ${ratioL(b)} shrinks each value.` : `a > 0 and ${ratioL(b)} grows each value.`;
  const opts: Opt[] = [
    { t: 'The values increase', ok: up, mc: up ? undefined : wrongMc, say: up ? `Right. ${why}` : `Look at the values: ${T.ys.map(v => nH(v)).join(', ')}. ${why}` },
    { t: 'The values decrease', ok: !up, mc: !up ? undefined : wrongMc, say: !up ? `Right. ${why}` : `Look at the values: ${T.ys.map(v => nH(v)).join(', ')}. ${why}` },
    { t: 'The values stay the same size', say: `Every ratio is ${ratioL(b)}, not ×1.` },
  ];
  return choice(R, {
    id: `ratioDirection-${n}`, family: 'ratioDirection', prompt: `Every ratio in this table is ${ratioL(b)}. As ${xI} increases, what do the values do?`,
    board: `y = ${nT(a)}\\cdot (${nT(b)})^{x}`, picture: { t: tpic(T.xs, T.ys, { show: ['rt'] }) },
    solution: [`The values: ${T.ys.map(v => nH(v)).join(', ')}.`, why],
  }, opts, true);
};
export const ratioValue: Gen = (R, n) => {
  const h = pick(R, [1, 2, 5]), x0 = h === 5 ? pick(R, [5, 10]) : pick(R, [1, 2, 3]);
  const sign = pick(R, ['grow', 'decay'] as const);
  for (let k = 0; ; k++) {
    const T = makeTab(R, 'exponential', { n: 4, x0, h, sign });
    const b = rts(T.ys)[0]!, row = r9(T.ys[0]! / T.xs[0]!), D = d1(T.ys)[0]!;
    if (k < 50 && (eq(row, b) || eq(D, b))) continue;
    return numItem({
      id: `ratioValue-${n}`, family: 'ratioValue',
      prompt: `The x-steps are all ${plusL(h)}. What is the factor from one row to the next (the ratio of neighbouring y-values)?`,
      board: `\\dfrac{y_{\\text{next}}}{y} = \\,?`, picture: { t: tpic(T.xs, T.ys, { solve: ['rt'] }) },
      solution: [`Divide neighbouring y-values: ${nH(T.ys[1]!)} ÷ ${nH(T.ys[0]!)} = ${nH(b)}.`, `Every ratio is the same, so the factor per step of ${nH(h)} is ${ans(nH(b))}.`],
    }, b, `Right: ×${nH(b)} for every step of ${nH(h)}.`,
    [[row, MC.rowRatio, `${nH(T.ys[0]!)} ÷ ${nH(T.xs[0]!)} divides y by x in one row. The factor compares neighbouring y-values.`], [D, MC.expDiffs, 'That is a difference. The factor is a ratio: divide neighbouring y-values.']],
    'Divide a y-value by the y-value just before it.');
  }
};

// ===================== explain-signatures =====================
export const genericStep: Gen = (R, n) => {
  if (R() < 0.5) {
    const m = pick(R, [2, 3, 4, 5, 7, -3, -2, 6]), c = pick(R, [-9, -5, -3, 1, 2, 4, 6, 8]);
    const mh = `${m === -1 ? '−' : nH(m)}${hI}`;
    return choice(R, {
      id: `genericStep-${n}`, family: 'genericStep', prompt: `For <i>f</i>(${xI}) = ${nH(m)}${xI} ${c < 0 ? '−' : '+'} ${Math.abs(c)}, what is <i>f</i>(${xI} + ${hI}) − <i>f</i>(${xI}) for an x-step of size ${hI}?`,
      board: `f(x + h) - f(x) = \\,?`,
      solution: [`f(x + h) − f(x) = ${nH(m)}(x + h) ${c < 0 ? '−' : '+'} ${Math.abs(c)} − (${nH(m)}x ${c < 0 ? '−' : '+'} ${Math.abs(c)}).`, `The ${nH(m)}x and the ${Math.abs(c)} cancel: ${ans(mh)}, the same for every x.`],
    }, [
      { t: mh, ok: true, say: `Right. ${nH(m)}x and ${nH(c)} cancel: ${nH(m)}h for every x. Equal steps, equal differences.`, key: 'mh' },
      { t: nH(m), mc: MC.inputStep, say: `${nH(m)} is the change for a step of 1. A step of h changes f by ${nH(m)} times h.`, key: 'm' },
      { t: hI, mc: MC.shiftAdd, say: 'f(x + h) is not f(x) + h: put x + h into the rule.', key: 'h' },
      { t: `${mh} ${c < 0 ? '−' : '+'} ${Math.abs(c)}`, say: `The constant ${nH(c)} appears in f(x + h) and in f(x), so it cancels.`, key: 'mhc' },
    ]);
  }
  const a = pick(R, [2, 3, 5, 10, 4]), b = pick(R, [2, 3, 5, 1.5]);
  const bh = `${nH(b)}<sup>h</sup>`;
  return choice(R, {
    id: `genericStep-${n}`, family: 'genericStep', prompt: `For <i>f</i>(${xI}) = ${a} · ${nH(b)}<sup>x</sup>, what is <i>f</i>(${xI} + ${hI}) ÷ <i>f</i>(${xI}) for an x-step of size ${hI}?`,
    board: `\\dfrac{f(x + h)}{f(x)} = \\,?`,
    solution: [`f(x + h) = ${a} · ${nH(b)}<sup>(x + h)</sup> = ${a} · ${nH(b)}<sup>x</sup> · ${nH(b)}<sup>h</sup>.`, `Divide by f(x) = ${a} · ${nH(b)}<sup>x</sup>: ${ans(bh)}, the same for every x.`],
  }, [
    { t: bh, ok: true, say: `Right. ${nH(b)}^(x + h) = ${nH(b)}^x · ${nH(b)}^h, and ${a} · ${nH(b)}^x cancels: equal steps, equal factors.`, key: 'bh' },
    { t: nH(b), mc: MC.inputStep, say: `${nH(b)} is the factor for a step of 1. A step of h multiplies by ${nH(b)} h times.`, key: 'b' },
    { t: `${nH(b)} · ${hI}`, say: `Exponents multiply factors: ${nH(b)}^h, not ${nH(b)} times h.`, key: 'b*h' },
    { t: `${a} · ${bh}`, say: `The ${a} is in f(x + h) and in f(x), so it cancels.`, key: 'abh' },
  ]);
};
export const directionImplication: Gen = (R, n) => {
  const lin = R() < 0.5;
  const T = lin ? makeTab(R, 'linear', { n: 4 }) : makeTab(R, 'exponential', { n: 4, sign: 'grow' });
  const fam = lin ? 'linear' : 'exponential', test = lin ? '1st differences' : 'ratios';
  const opts: Opt[] = [
    lin ? { t: 'If f(x) = mx + c, every x-step of size h changes f by the same amount, mh', ok: true, say: 'Right. That follows from the rule for EVERY x. The other direction (table to rule) only gives consistency.' }
      : { t: 'If f(x) = a · bˣ, every x-step of size h multiplies f by the same factor, bʰ', ok: true, say: 'Right. That follows from the rule for EVERY x. The other direction (table to rule) only gives consistency.' },
    { t: `If a table’s ${test} are all equal, the function must be ${fam} for every x`, mc: MC.finite, say: `A table shows a few rows. Many rules pass through the same rows: it is only consistent with ${fam}.` },
    { t: `Checking three rows with equal ${test} proves the rule is ${fam}`, mc: MC.examples, say: 'Three checks are three examples. They say nothing about the inputs between or beyond them.' },
    lin ? { t: 'If f is linear, its ratios are all equal too', say: 'Not in general: 3, 5, 7 has ratios 5/3 and 7/5.' }
      : { t: 'If f is exponential, its 1st differences are all equal too', say: 'No: 2, 4, 8 has differences 2 and 4.' },
  ];
  return choice(R, {
    id: `directionImplication-${n}`, family: 'directionImplication',
    prompt: `Lee’s table (y: ${T.ys.map(v => nH(v)).join(', ')}) has equal ${test}. Which statement is guaranteed to be true?`,
    board: lin ? `f(x) = mx + c\\qquad \\Rightarrow\\ \\text{equal differences}` : `f(x) = a\\cdot b^{x}\\qquad \\Rightarrow\\ \\text{equal ratios}`,
    picture: { t: tpic(T.xs, T.ys, { show: lin ? ['d1'] : ['rt'] }) },
    solution: [`The rule guarantees the table pattern for every step: f(x + h) ${lin ? '− f(x) = mh' : '÷ f(x) = bʰ'}.`, 'A finite table showing the pattern is only consistent with the family.'],
  }, opts);
};

// ===================== factor-to-percent =====================
// factors that fit the story: towns and savings change a few percent a year, a car loses 10-25% a year, only
// bacteria, app users and viral views grow by large factors
const PCT_CTX: { s: string; step: string; per: string; bs: number[] }[] = [
  { s: 'A town’s population is multiplied by', step: 'every year', per: 'per year', bs: [1.01, 1.02, 1.03, 1.04, 1.05, 1.06, 0.98, 0.99] },
  { s: 'The balance of a savings account is multiplied by', step: 'every year', per: 'per year', bs: [1.01, 1.02, 1.03, 1.04, 1.05, 1.06] },
  { s: 'The amount of a medicine in the blood is multiplied by', step: 'every hour', per: 'per hour', bs: [0.5, 0.6, 0.75, 0.8, 0.85, 0.9] },
  { s: 'A used car’s value is multiplied by', step: 'every year', per: 'per year', bs: [0.75, 0.8, 0.85, 0.9] },
  { s: 'The number of bacteria in a dish is multiplied by', step: 'every 5 hours', per: 'per 5-hour step', bs: [1.5, 2, 2.5, 3] },
  { s: 'The number of users of a new app is multiplied by', step: 'every month', per: 'per month', bs: [1.1, 1.2, 1.25, 1.5, 2] },
  { s: 'The views of a viral video are multiplied by', step: 'every day', per: 'per day', bs: [1.5, 2, 3] },
  { s: 'The mass of a melting ice sculpture is multiplied by', step: 'every hour', per: 'per hour', bs: [0.85, 0.9, 0.95] },
];
export const factorToPercent: Gen = (R, n) => {
  const C = pick(R, PCT_CTX);
  const b = pick(R, C.bs);
  const p = r9((b - 1) * 100), size = r9(Math.abs(p));
  return numItem({
    id: `factorToPercent-${n}`, family: 'factorToPercent',
    prompt: `${C.s} ${nH(b)} ${C.step}. What is the percent change ${C.per}? (Type a negative number for a decrease.)`,
    board: `b = ${nT(b)}\\ \\to\\ \\,?\\,\\%`, unit: '%',
    solution: [`The factor ${nH(b)} = 1 ${p < 0 ? '−' : '+'} ${nH(size / 100)}.`, `So the quantity ${p < 0 ? 'loses' : 'gains'} ${nH(size)}% ${C.per}: ${ans(nH(p) + '%')}.`],
  }, p, `Right: ×${nH(b)} is ${p < 0 ? '' : '+'}${nH(p)}% ${C.per}.`, [
    [r9(b * 100), b > 1 ? MC.bAsPct : MC.pctOf, `${nH(b * 100)}% is what is LEFT (or what it becomes), not the change. The change is ${nH(b)} − 1.`],
    [b, MC.bAsPct, `${nH(b)} is the factor, not a percent. Subtract 1 and write it as a percent.`],
    [-p, undefined, p < 0 ? 'The quantity shrinks, so the change is negative.' : 'The quantity grows, so the change is positive.'],
  ], 'Percent change = (factor − 1) × 100.');
};
/** realistic tables: [what, step word, starts, factors per step]; every value terminates (cents at most) */
const PCT_TABLES: { what: string; unit: string; five: boolean; as: number[]; bs: number[] }[] = [
  { what: 'the number of fish in a lake', unit: 'fish', five: false, as: [1000, 2000, 5000], bs: [1.1, 1.2, 0.9, 0.8] },
  { what: 'a deer population', unit: 'deer', five: false, as: [625, 1250], bs: [1.2, 0.8] },
  { what: 'an investment', unit: 'dollars', five: false, as: [8000, 16000], bs: [1.05] },
  { what: 'an investment', unit: 'dollars', five: false, as: [15625], bs: [1.04] },
  { what: 'an investment', unit: 'dollars', five: true, as: [8000, 4096], bs: [1.25] },
  { what: 'a colony of ants', unit: 'ants', five: false, as: [1600, 3200], bs: [1.5] },
];
export const tableToPercent: Gen = (R, n) => {
  const P = pick(R, PCT_TABLES), a = pick(R, P.as), b = pick(R, P.bs), five = P.five;
  const xs = xsOf(five ? 2000 : 0, five ? 5 : 1, 4), ys = xs.map((_, i) => r9(a * b ** i));
  const p = r9((b - 1) * 100), per = five ? 'per 5-year step' : 'per year';
  return numItem({
    id: `tableToPercent-${n}`, family: 'tableToPercent',
    prompt: `The table shows ${P.what} (in ${P.unit})${five ? ' every 5 years' : ' each year'}. By what percent does it change ${per}? (Negative for a decrease.)`,
    board: `\\text{percent change}\\qquad ${five ? '\\text{per 5 years}' : '\\text{per year}'} = \\,?`, unit: '%',
    picture: { t: tpic(xs, ys, { xName: 'year', yName: P.unit, solve: ['rt'] }) },
    solution: [`Ratio of neighbours: ${nH(ys[1]!)} ÷ ${nH(ys[0]!)} = ${nH(b)} (the same every step).`, `Factor ${nH(b)} means ${ans(nH(p) + '%')} ${per}.`],
  }, p, `Right: the factor is ${nH(b)}, so ${nH(p)}% ${per}.`, [
    [r9(b * 100), b > 1 ? MC.bAsPct : MC.pctOf, `${nH(b * 100)}% is the new amount as a percent of the old one. The CHANGE is ${nH(p)}%.`],
    [d1(ys)[0]!, MC.expDiffs, 'That is the amount added in the first step. A percent comes from the ratio of neighbours.'],
  ], 'Find the ratio of neighbouring values, then subtract 1.');
};
export const negativeContrast: Gen = (R, n) => {
  const [a, b] = pick(R, NEG.filter(([a0, b0]) => !(a0 === -100 && b0 === 0.85) || true));
  const xs = xsOf(0, 1, 4), ys = xs.map((_, i) => r9(a * b ** i));
  if (ys.some(v => String(v).length > 9)) return negativeContrast(R, n);
  const pc = r9(Math.abs(1 - b) * 100), up = b < 1;
  const opts: Opt[] = up ? [
    { t: `The values go up (toward 0); only their size shrinks by ${nH(pc)}% each step`, ok: true, say: `Right. ${nH(a)} → ${nH(ys[1]!)} is an increase; the size ${nH(-a)} shrinks to ${nH(-ys[1]!)}. "Decay" language fits the size, not the values.` },
    { t: `The values decay: they go down by ${nH(pc)}% each step`, mc: MC.factorDir, say: `A factor below 1 shrinks the size, but these values are negative: ${nH(a)} → ${nH(ys[1]!)} goes UP.` },
    { t: `The values go up by the same amount, ${nH(r9(ys[1]! - a))}, each step`, mc: MC.constAmount, say: `The increases are ${dl(d1(ys))}: they shrink. Only the ratio is constant.` },
  ] : [
    { t: `The values go down; only their size grows by ${nH(pc)}% each step`, ok: true, say: `Right. ${nH(a)} → ${nH(ys[1]!)} goes down, while the size grows by ${nH(pc)}%.` },
    { t: `The values grow by ${nH(pc)}% each step`, mc: MC.factorDir, say: `A factor above 1 grows the size, but these values are negative: ${nH(a)} → ${nH(ys[1]!)} goes DOWN.` },
    { t: `The values go down by the same amount, ${nH(r9(a - ys[1]!))}, each step`, mc: MC.constAmount, say: `The changes are ${dl(d1(ys))}: not equal. Only the ratio is constant.` },
  ];
  return choice(R, {
    id: `negativeContrast-${n}`, family: 'negativeContrast', prompt: `This exponential table has a negative start, ${nH(a)}, and every ratio is ${ratioL(b)}. Which description is correct?`,
    board: `y = ${nT(a)}\\cdot (${nT(b)})^{x}`, picture: { t: tpic(xs, ys, { show: ['rt'], solve: ['d1'] }) },
    solution: [`Values: ${ys.map(v => nH(v)).join(', ')}.`, up ? 'They go up toward 0: the size shrinks, the values increase. Percent decay describes the size only.' : 'They go down: the size grows, the values decrease.'],
  }, opts);
};

// ===================== degenerate-cases =====================
export const constantTable: Gen = (R, n) => {
  const c = pick(R, [0, 0, 5, -3, 12, 7.5, 40, -8]), h = pick(R, [1, 2]);
  const xs = xsOf(pick(R, [0, 1]), h, int(R, 4, 5)), ys = xs.map(() => c);
  return choice(R, {
    id: `constantTable-${n}`, family: 'constantTable', prompt: `Every output in this table is ${nH(c)}. Which family is the table consistent with?`,
    board: `y = ${nT(c)}\\ \\text{in every row}`, picture: { t: tpic(xs, ys, { solve: ['d1', 'd2', 'rt'] }) },
    solution: ['1st differences are all 0: consistent with a linear function with slope 0.', `Not quadratic (2nd differences must not be 0). Not exponential (b ≠ 1${c === 0 ? ', and a ratio with a 0 denominator has no value' : ''}).`],
  }, [
    { t: 'Linear only: a constant function with slope 0', ok: true, say: 'Right. Equal 1st differences (all 0). A quadratic needs a ≠ 0, an exponential needs b ≠ 1.' },
    { t: 'Exponential with factor 1', mc: MC.constRatio, say: `${c === 0 ? 'The ratios 0 ÷ 0 have no value. And ' : ''}an exponential a·bˣ needs b ≠ 1; ×1 never changes anything.` },
    { t: 'Quadratic: the 2nd differences are constant', mc: MC.zeroD2, say: 'They are constant, but 0. A quadratic needs a ≠ 0, so NONZERO 2nd differences.' },
    { t: 'Linear, quadratic and exponential all fit', say: 'Each family has a restriction: a ≠ 0 for quadratic, b ≠ 1 for exponential. Only linear is left.' },
  ]);
};
export const zeroOutput: Gen = (R, n) => {
  const quad = R() < 0.6;
  const T = makeTab(R, quad ? 'quadratic' : 'linear', { n: 5, x0: pick(R, [0, 1, -2]), h: pick(R, [1, 2]), zero: true });
  const z = T.ys.findIndex((v, i) => v === 0 && i >= 1 && T.ys[i - 1] !== 0);
  if (z < 0) return zeroOutput(R, n + 1000);
  const prev = T.ys[z - 1]!, D = quad ? d2(T.ys)[0]! : d1(T.ys)[0]!;
  return choice(R, {
    id: `zeroOutput-${n}`, family: 'zeroOutput', prompt: 'This table has an output of 0. Which statement is true?',
    board: listLines('y', T.ys), picture: { t: tpic(T.xs, T.ys, { solve: quad ? ['d1', 'd2', 'rt'] : ['d1', 'rt'] }) },
    solution: [`${quad ? '2nd' : '1st'} differences: all ${plusL(D)} (a 0 output is fine for differences).`, `0 ÷ ${nH(prev)} = 0 is a ratio; only dividing by 0 has no value. An exponential never outputs 0.`],
  }, [
    { t: `The difference tests still apply: the ${quad ? '2nd' : '1st'} differences are all ${plusL(D)}, so it is consistent with a ${quad ? 'quadratic' : 'linear'} function`, ok: true, say: 'Right. Subtracting works fine with 0. Only an exponential is ruled out: a·bˣ is never 0.' },
    { t: 'The 0 breaks every test, so no family fits', mc: MC.zeroBreaks, say: `Differences do not care about a 0: they are all ${plusL(D)}.` },
    { t: `0 ÷ ${nH(prev)} has no value, so the table cannot be tested`, mc: MC.zeroNum, say: `0 ÷ ${nH(prev)} = 0. Only dividing BY 0 has no value.` },
    { t: 'It could be exponential: a · bˣ can equal 0', say: 'With a ≠ 0 and b > 0, a·bˣ is never 0. A zero output rules exponential out.' },
  ]);
};

// ===================== mixed-classification =====================
const FAM4: Fam[] = ['linear', 'quadratic', 'exponential', 'none'];
function mixedTab(R: () => number, f: Fam): Tab {
  const h = pick(R, [1, 1, 2]), x0 = pick(R, [0, 0, 1, -1]);
  if (f === 'exponential') return makeTab(R, f, { n: 5, x0, h, sign: pick(R, ['grow', 'decay', 'grow', 'neg'] as const) });
  return makeTab(R, f, { n: 5, x0, h, zero: R() < 0.2 });
}
function wrongFamMc(truth: Fam, picked: Fam): string | undefined {
  if (truth === 'exponential' && picked === 'quadratic') return MC.diffOnly;
  if (truth === 'exponential' && picked === 'none') return MC.stopsDiffs;
  if (truth === 'quadratic' && picked === 'exponential') return MC.roughShape;
  if (truth === 'none' && picked !== 'none') return MC.forces;
  return undefined;
}
function verdictLines(T: Tab): string[] {
  const D1 = d1(T.ys), D2 = d2(T.ys);
  const L = [`1st differences: ${dl(D1)}${allEq(D1) ? ' (constant)' : ''}.`];
  if (!allEq(D1)) L.push(`2nd differences: ${dl(D2)}${allEq(D2) ? ' (constant)' : ''}.`);
  if (!allEq(D1) && !allEq(D2)) L.push(`Ratios: ${rl(T.ys)}${T.fam === 'exponential' ? ' (constant)' : ''}.`);
  L.push(T.fam === 'none' ? 'No test passes: none of these.' : `Consistent with ${T.fam === 'exponential' ? 'an' : 'a'} ${T.fam} function.`);
  return L;
}
export const classifyMixed: Gen = (R, n) => {
  const f = pick(R, [...FAM4, 'exponential', 'quadratic'] as Fam[]);
  const T = mixedTab(R, f);
  const names: Record<Fam, string> = { linear: 'Linear', quadratic: 'Quadratic', exponential: 'Exponential', none: 'None of these' };
  const say: Record<Fam, string> = {
    linear: 'Linear needs equal 1st differences.', quadratic: 'Quadratic needs equal, nonzero 2nd differences.',
    exponential: 'Exponential needs equal ratios (and no zero outputs).', none: 'One of the three tests passes here.',
  };
  return choice(R, {
    id: `classifyMixed-${n}`, family: 'classifyMixed', prompt: `Run the three tests (the x-steps are all ${plusL(d1(T.xs)[0]!)}). Which family is the table consistent with?`,
    board: listLines('y', T.ys), picture: { t: tpic(T.xs, T.ys, { solve: ['d1', 'd2', 'rt'] }) },
    solution: verdictLines(T),
  }, FAM4.map(g => ({ t: names[g], ok: g === T.fam, mc: g === T.fam ? undefined : wrongFamMc(T.fam, g), say: g === T.fam ? `Right. ${verdictLines(T).slice(0, -1).join(' ')}` : `${say[g]} ${verdictLines(T).slice(0, -1).join(' ')}` })), true);
};
const SMALL_EXP: readonly [number, number][] = [[3, 2], [5, 2], [2, 3], [1, 3], [16, 1.5], [64, 0.5], [96, 0.5], [256, 0.75], [4, 2.5], [6, 2], [7, 2]];
export const whichTable: Gen = (R, n) => {
  const target = pick(R, ['linear', 'quadratic', 'exponential'] as Fam[]);
  const xs = xsOf(0, 1, 5);
  const col = (f: Fam): number[] => {
    if (f === 'exponential') { const [a, b] = pick(R, SMALL_EXP); return xs.map((_, i) => r9(a * b ** i)); }
    for (;;) { const T = makeTab(R, f, { n: 5 }); if (T.ys.every(v => Math.abs(v) < 400)) return T.ys; }
  };
  const fams = shuffle(R, FAM4.slice());
  const ys = fams.map(col), L = ['A', 'B', 'C', 'D'];
  const i0 = fams.indexOf(target);
  const lines = verdictLines({ xs, ys: ys[i0]!, fam: target });
  return choice(R, {
    id: `whichTable-${n}`, family: 'whichTable', prompt: `The inputs are ${xI} = 0, 1, 2, 3, 4. Which column is consistent with ${target === 'exponential' ? 'an' : 'a'} <b>${target}</b> function?`,
    board: `\\text{${target}?}`,
    picture: { t: { xName: 'x', xs: xs.map(v => nH(v)), cols: ys.map((c, j) => ({ name: L[j]!, vals: c.map(v => nH(v)), col: j % 2 ? 'second' as const : 'first' as const })) } },
    solution: [`Column ${L[i0]}: ${lines.join(' ')}`],
  }, fams.map((f, j) => ({ t: `Column ${L[j]}`, ok: f === target, mc: f === target ? undefined : f === 'none' ? MC.forces : target === 'quadratic' && f === 'exponential' ? MC.diffOnly : target === 'exponential' && f === 'quadratic' ? MC.roughShape : undefined,
    say: f === target ? `Right. ${lines.join(' ')}` : `Column ${L[j]} is ${f === 'none' ? 'none of the three' : f}. ${target === 'linear' ? 'Look for equal 1st differences.' : target === 'quadratic' ? 'Look for equal, nonzero 2nd differences.' : 'Look for equal ratios.'}` })), true);
};
export { famWord, GROW, DECAY };
