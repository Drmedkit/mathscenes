// fam1.ts: stage 1 families (repeated factor, decay factor, the ratio test, equal intervals, percent situations,
// the long run). Pure: no DOM.
import { type Base, type Gen, type Opt, type QItem, MC, ans, choice, int, numItem, pick, sup, tI, xI } from './common';
import { diffs, firstOver, kind, nH, nT, plus, pw, r9, ratios, rnd, times, usd, vals } from './expo';
import { type TPic, niceAxis } from './pictures';

// ---------- table helpers ----------
/** a ratio label: exact when it terminates within 3 decimals, else ≈ to 2 decimals */
export const rlab = (r: number): string => (Math.abs(r9(r * 1000) - Math.round(r * 1000)) < 1e-6 ? times(r, 3) : '×≈' + nH(rnd(r, 2), 2));
export const ratioLabels = (vs: readonly number[]) => ratios(vs).map(rlab);
export const diffLabels = (vs: readonly number[]) => diffs(vs).map(d => plus(d, 3));
/** a one-column table; values from index `hideFrom` on are '?' and come in on the replay */
export function tab(tName: string, ts: readonly number[], name: string, vs: readonly number[], o: { hideFrom?: number; ratios?: 'q' | 's'; diffs?: 'q' | 's'; dec?: number } = {}): TPic {
  const h = o.hideFrom ?? vs.length, d = o.dec ?? 3;
  const R = ratioLabels(vs), D = diffLabels(vs);
  return {
    tName, ts: ts.map(t => nH(t)),
    cols: [{ name, vals: vs.map((v, i) => (i < h ? nH(v, d) : null)), reveal: h < vs.length ? vs.map((v, i) => (i < h ? null : nH(v, d))) : undefined }],
    // question labels only between shown rows; the rest come with the replay
    ratios: o.ratios === 'q' ? R.map((x, i) => (i < h - 1 ? x : null)) : undefined, solveRatios: o.ratios === 's' || (o.ratios === 'q' && h < vs.length) ? R : undefined,
    diffs: o.diffs === 'q' ? D.map((x, i) => (i < h - 1 ? x : null)) : undefined, solveDiffs: o.diffs === 's' || (o.diffs === 'q' && h < vs.length) ? D : undefined,
  };
}
const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

// ===== repeated-factor / decay-factor: continue a multiplying table =====
export const continueTable: Gen = (R, n, sg) => {
  const decay = sg === 'decay-factor';
  let a: number, b: number, T: number;
  if (!decay) {
    b = pick(R, [2, 3, 1.5, 2, 3]);
    a = b === 1.5 ? pick(R, [16, 32, 48, 64]) : int(R, 2, 12);
    T = b === 3 ? 4 + int(R, 0, 1) : 5;
  } else {
    b = pick(R, [0.5, 0.8, 0.9]);
    a = b === 0.5 ? pick(R, [64, 96, 128, 160, 192, 320, 640]) : b === 0.8 ? pick(R, [625, 1250, 2500, 5000]) : pick(R, [1000, 2000, 10000]);
    T = b === 0.5 ? 5 : 4;
  }
  const ts = range(0, T), vs = vals(a, b, ts), shown = 4;
  const v = vs[T]!;
  const d1 = vs[1]! - vs[0]!, dl = vs[shown - 1]! - vs[shown - 2]!;
  const linFirst = r9(vs[shown - 1]! + d1 * (T - shown + 1)), linLast = r9(vs[shown - 1]! + dl * (T - shown + 1));
  const word = decay ? 'step' : pick(R, ['week', 'day', 'hour']);
  const b0: Base = {
    id: `continueTable-${n}`, family: 'continueTable',
    prompt: `Each ${word}, the amount is <b>multiplied by the same number</b>. The table shows ${word}s 0 to ${shown - 1}, starting at ${nH(vs[0]!)}. What is the amount in ${word} ${T}?`,
    board: `\\text{${word} ${T}} = \\,?`,
    solution: [
      `Divide neighbours: ${nH(vs[1]!)} ÷ ${nH(vs[0]!)} = ${nH(b)}, and every other pair gives ${nH(b)} too. The factor is ×${nH(b)}.`,
      `The differences are not equal (${diffLabels(vs.slice(0, shown)).join(', ')}): adding a fixed amount does not continue this table.`,
      `Keep multiplying: ${vs.slice(shown - 1).map(x => nH(x)).join(' → ')}. ${word[0]!.toUpperCase() + word.slice(1)} ${T}: ${ans(nH(v))}.`,
    ],
    picture: { t: tab(word, ts, 'amount', vs, { hideFrom: shown, diffs: 'q', ratios: 's' }) },
  };
  return numItem(b0, v, `Yes: ×${nH(b)} every ${word}, so ${word} ${T} is ${nH(v)}.`, [
    [linFirst, MC.constAmount, `That adds the first change (${plus(d1)}) again and again. The table multiplies: divide ${nH(vs[1]!)} by ${nH(vs[0]!)} to find the factor.`],
    [linLast, MC.constAmount, `That keeps adding the last change (${plus(dl)}). But the change itself changes: the table multiplies by ${nH(b)} each ${word}.`],
  ], `Find the factor first (divide one value by the one before it), then keep multiplying to ${word} ${T}.`);
};

// ===== repeated-factor: two cultures, same start and same first change =====
export const twoPlans: Gen = (R, n) => {
  const b = pick(R, [2, 3, 1.5]);
  const s = b === 1.5 ? pick(R, [32, 64, 160, 320]) : pick(R, [100, 200, 300, 400, 500]);
  const t = b === 3 ? 3 : int(R, 3, 4);
  const g = r9(s * (b - 1));
  const B = pw(s, b, t), A = r9(s + g * t), v = r9(B - A);
  const ts = range(0, t);
  const b0: Base = {
    id: `twoPlans-${n}`, family: 'twoPlans',
    prompt: `Two bacteria cultures both start with ${nH(s)} cells and both gain ${nH(g)} cells in the first hour. Culture A keeps gaining <b>${nH(g)} cells every hour</b>. Culture B keeps <b>multiplying by ${nH(b)}</b> every hour. After ${t} hours, how many more cells does B have than A?`,
    board: `A:\\ +${nT(g)}\\ \\text{per hour}\\qquad B:\\ \\times ${nT(b)}\\ \\text{per hour}`, unit: 'cells',
    solution: [
      `A adds ${nH(g)} each hour: ${nH(s)} + ${t} · ${nH(g)} = ${nH(A)}.`,
      `B multiplies by ${nH(b)} each hour: ${nH(s)} · ${nH(b)}${sup(t)} = ${nH(B)}.`,
      `Difference: ${nH(B)} − ${nH(A)} = ${ans(nH(v))} cells.`,
    ],
    picture: { t: { tName: 'hour', ts: ts.map(x => nH(x)), cols: [
      { name: 'A', vals: ts.map(x => (x <= 1 ? nH(r9(s + g * x)) : null)), reveal: ts.map(x => (x <= 1 ? null : nH(r9(s + g * x)))), col: 'water' },
      { name: 'B', vals: ts.map(x => (x <= 1 ? nH(pw(s, b, x)) : null)), reveal: ts.map(x => (x <= 1 ? null : nH(pw(s, b, x)))) },
    ], solveRatios: ratioLabels(vals(s, b, ts)) } },
  };
  return numItem(b0, v, `Yes: ${nH(B)} − ${nH(A)} = ${nH(v)}. Same start, same first hour, and B is already far ahead.`, [
    [0, MC.constAmount, `They match after hour 1, but not after that: B multiplies its CURRENT count by ${nH(b)}, so its gain grows every hour.`],
    [B, undefined, `${nH(B)} is all of culture B. The question asks how many MORE than A.`],
  ], `Work out A (add ${nH(g)} per hour) and B (multiply by ${nH(b)} per hour) at hour ${t}, then subtract.`);
};

// ===== decay-factor: losing a percent of what is left vs a fixed amount =====
const DECAY_CTX = [
  { what: 'A water tank', unit: 'gallons', per: 'hour', starts: [1000, 2000, 5000, 10000] },
  { what: 'A patient’s dose of medicine', unit: 'mg', per: 'hour', starts: [400, 500, 800, 1000] },
  { what: 'A sample of a radioactive element', unit: 'grams', per: 'day', starts: [200, 400, 800, 1000] },
];
export const decaySubtract: Gen = (R, n) => {
  const C = pick(R, DECAY_CTX), p = pick(R, [10, 20, 50]), b = r9(1 - p / 100);
  const a = pick(R, C.starts), t = p === 50 ? int(R, 2, 4) : int(R, 2, 3);
  const v = pw(a, b, t), loss1 = r9(a * p / 100), lin = r9(a - loss1 * t), tiny = pw(a, p / 100, t);
  const ts = range(0, t), vs = vals(a, b, ts);
  const b0: Base = {
    id: `decaySubtract-${n}`, family: 'decaySubtract',
    prompt: `${C.what} holds ${nH(a)} ${C.unit}. Every ${C.per}, it loses <b>${p}% of what is left</b>. How many ${C.unit} are left after ${t} ${C.per}s?`,
    board: `${nT(a)}\\ \\text{${C.unit}}\\qquad -${p}\\%\\ \\text{of what is left}`, unit: C.unit,
    solution: [
      `Losing ${p}% leaves ${100 - p}%, so each ${C.per} the amount is multiplied by ${nH(b)}.`,
      `${nH(a)} · ${nH(b)}${sup(t)} = ${vs.slice(1).map(x => nH(x)).join(' → ')}.`,
      `After ${t} ${C.per}s: ${ans(nH(v))} ${C.unit}.`,
    ],
    picture: { t: tab(C.per, ts, C.unit, vs, { hideFrom: 2, ratios: 's', diffs: 's' }) },
  };
  return numItem(b0, v, `Yes: ×${nH(b)} each ${C.per}, ${nH(v)} ${C.unit} left. The loss shrinks as the amount shrinks.`, [
    [lin, MC.constAmount, `That takes away ${nH(loss1)} every ${C.per}. But ${p}% is of what is LEFT: the second loss is ${p}% of ${nH(vs[1]!)}, smaller than ${nH(loss1)}.`],
    [tiny, MC.rate, `${p}% is what is lost. What is left each ${C.per} is ${100 - p}%: multiply by ${nH(b)}, not ${nH(p / 100)}.`],
  ], `Each ${C.per}, multiply by what is left: ${100 - p}% = ${nH(b)}.`);
};

// ===== decay-factor: which b makes y = a·b^t decay =====
export const decayPick: Gen = (R, n) => {
  const b = pick(R, [0.5, 0.8, 0.9, 0.25, 0.6, 0.75]), a = pick(R, [40, 60, 80, 120, 150, 200, 250, 300, 500, 640, 1000]);
  const [Y, what, per] = pick(R, [['M', 'mg of medicine', 'hours'], ['A', 'grams of a sample', 'days'], ['V', 'a value in dollars', 'years'], ['y', 'an amount', 'steps']] as const);
  const grow = r9(2 - b);
  const opts: Opt[] = [
    { t: `<i>b</i> = ${nH(b)}`, ok: true, say: `Yes: multiplying by ${nH(b)} (between 0 and 1) keeps the same fraction each step, so the amount shrinks and stays positive.` },
    { t: `<i>b</i> = −${nH(b)}`, mc: MC.negFactor, say: `A negative factor flips the sign every step: ${nH(a)}, −${nH(a * b)}, ${nH(pw(a, b, 2))}, … That is not a shrinking amount. Decay needs 0 < b < 1.` },
    { t: '<i>b</i> = 1', mc: MC.constRatio, say: `Times 1 changes nothing: ${nH(a)}, ${nH(a)}, ${nH(a)}, … A constant, not decay.` },
    { t: `<i>b</i> = ${nH(grow)}`, say: `${nH(grow)} is more than 1: every step makes the amount bigger. That is growth.` },
  ];
  return choice(R, {
    id: `decayPick-${n}`, family: 'decayPick',
    prompt: `In <i>${Y}</i> = ${nH(a)} · <i>b</i>${sup(tI)} (${what}, ${tI} in ${per}), the amount should <b>decay</b>: shrink by the same fraction each step and stay positive. Which <i>b</i> works?`,
    board: `${Y} = ${nT(a)}\\cdot b^{\\,t}\\quad\\text{decay?}`,
    solution: [`Each step multiplies by <i>b</i>. To shrink and stay positive, <i>b</i> must be between 0 and 1.`, `Of the choices, only <i>b</i> = ${nH(b)} is between 0 and 1.`],
  }, opts);
};

// ===== ratio-test: linear, exponential or neither =====
export const classifyTable: Gen = (R, n) => {
  const k = int(R, 0, 5);
  let vs: number[];
  if (k === 0) { const b = pick(R, [2, 3]); vs = vals(int(R, 1, 9), b, range(0, 4)); }
  else if (k === 1) { const b = pick(R, [1.5, 0.5, 0.8]); const a = b === 1.5 ? pick(R, [16, 32, 48]) : b === 0.5 ? pick(R, [32, 48, 64, 80, 96]) : pick(R, [625, 1250]); vs = vals(a, b, range(0, 4)); }
  else if (k === 2) { const d = int(R, 2, 12) * (R() < 0.6 ? 1 : -1); const a = d > 0 ? int(R, 1, 20) : int(R, 50, 90); vs = range(0, 4).map(t => a + d * t); }
  else if (k === 3) { const c = int(R, 1, 4), s = int(R, 0, 2); vs = range(0, 4).map(t => c * (t + 1 + s) ** 2); }
  else if (k === 4) { const a = int(R, 10, 40), d = int(R, 8, 20); const wob = [0, 0, 1, 0, 1]; vs = range(0, 4).map(t => a + d * t + (t ? wob[t]! : 0)); if (kind(vs) !== 'neither') vs[4] = vs[4]! + 1; }
  else { const b = pick(R, [2, 3]); vs = vals(int(R, 2, 6), b, range(0, 4)); vs = vs.map((v, i) => v + i); }
  const K = kind(vs);
  const curving = diffs(vs).every((d, i, D) => i === 0 || d > D[i - 1]!);
  const opts: Opt[] = [
    { t: 'Linear: the differences are all equal', ok: K === 'linear', say: K === 'linear' ? 'Yes: the same amount is added every step.' : `The differences are ${diffLabels(vs).join(', ')}: not all equal.` },
    { t: 'Exponential: the ratios are all equal', ok: K === 'exponential', mc: K === 'neither' && curving ? MC.roughShape : undefined, say: K === 'exponential' ? `Yes: every value is ${rlab(ratios(vs)[0]!)} the one before.` : `${K === 'neither' && curving ? 'Curving up is not enough: divide neighbours. ' : 'Divide neighbours: '}${ratioLabels(vs).join(', ')} are not all equal.` },
    { t: 'Neither', ok: K === 'neither', mc: K === 'exponential' ? MC.stopsDiffs : undefined, say: K === 'neither' ? 'Yes: neither the differences nor the ratios are constant.' : K === 'exponential' ? `The differences are not equal, so it is not linear, but test the ratios too: they are all ${rlab(ratios(vs)[0]!)}.` : 'Check the differences: they are all equal.' },
  ];
  return choice(R, {
    id: `classifyTable-${n}`, family: 'classifyTable',
    prompt: `The inputs go up by 1 each row, and the outputs start ${nH(vs[0]!)}, ${nH(vs[1]!)}, … Is the table linear, exponential, or neither?`,
    board: '\\text{same difference}\\qquad \\text{or same ratio?}',
    solution: [`Differences: ${diffLabels(vs).join(', ')}. Ratios: ${ratioLabels(vs).join(', ')}.`, K === 'linear' ? 'The differences are equal: linear.' : K === 'exponential' ? 'The ratios are equal: exponential.' : 'Neither is constant: neither.'],
    picture: { t: tab('x', range(0, 4), 'y', vs, { ratios: 's', diffs: 's' }) },
  }, opts, true);
};

// ===== ratio-test: matching rounded ratios are not proof =====
export const roundedRatios: Gen = (R, n) => {
  for (;;) {
    const b = pick(R, [1.5, 1.2, 1.25, 0.8]), a = pick(R, [80, 100, 200, 400, 500]);
    const vs = vals(a, b, range(0, 3));
    const off = R() < 0.6;
    const obs = vs.slice();
    if (off) { const i = int(R, 2, 3); obs[i] = r9(obs[i]! + pick(R, [0.1, -0.1, 0.2])); }
    const rr = ratios(obs);
    if (!rr.every(r => nH(rnd(r, 2), 2) === nH(rnd(rr[0]!, 2), 2))) continue;
    if (rr.some(r => Math.abs(r * 100 - Math.floor(r * 100) - 0.5) < 0.05)) continue;
    const exact = kind(obs) === 'exponential';
    const r2 = nH(rnd(rr[0]!, 2), 2, true);
    const bad = obs.findIndex((v, i) => i >= 2 && Math.abs(obs[i - 2]! * v - obs[i - 1]! ** 2) > 1e-9);
    return choice(R, {
      id: `roundedRatios-${n}`, family: 'roundedRatios',
      prompt: `Every ratio of neighbouring outputs, <b>rounded to 2 decimal places</b>, is ${r2}. The outputs are ${obs.map(v => nH(v)).join(', ')}. Is the table exactly exponential?`,
      board: `\\text{ratios} \\approx ${r2}\\qquad \\text{exactly equal?}`,
      solution: exact
        ? [`Check exactly: ${nH(obs[0]!)} × ${nH(obs[2]!)} = ${nH(obs[1]! ** 2)} = ${nH(obs[1]!)}${sup(2)}${obs.length > 3 ? `, and ${nH(obs[1]!)} × ${nH(obs[3]!)} = ${nH(obs[2]! ** 2)} = ${nH(obs[2]!)}${sup(2)}` : ''}.`, `The ratios are exactly ${nH(b)}: exponential.`]
        : [`Check exactly with cross products: ${nH(obs[bad - 2]!)} × ${nH(obs[bad]!)} = ${nH(r9(obs[bad - 2]! * obs[bad]!))}, but ${nH(obs[bad - 1]!)}${sup(2)} = ${nH(r9(obs[bad - 1]! ** 2))}.`, 'Not equal, so the ratios are close but not exactly equal: not exactly exponential.'],
      picture: { t: { tName: 'x', ts: ['0', '1', '2', '3'], cols: [{ name: 'y', vals: obs.map(v => nH(v)) }], solveRatios: rr.map(r => (Math.abs(r - rnd(r, 3)) < 1e-9 ? times(r, 3) : '×' + nH(rnd(r, 5), 5))), hot: exact ? [] : rr.map((_, i) => i).filter(i => Math.abs(rr[i]! - b) > 1e-9) } },
    }, [
      { t: 'Yes: equal ratios mean exponential', ok: exact, mc: exact ? undefined : MC.rounded, say: exact ? `Yes, and you can check it exactly: the cross products match, so the ratios are exactly ${nH(b)}.` : `Rounded ratios can hide a difference. Check exactly: ${nH(obs[bad - 2]!)} × ${nH(obs[bad]!)} is not ${nH(obs[bad - 1]!)}${sup(2)}.` },
      { t: 'No: the ratios are close but not exactly equal', ok: !exact, say: exact ? `Check exactly: ${nH(obs[0]!)} × ${nH(obs[2]!)} = ${nH(obs[1]!)}${sup(2)}. These ratios are exactly ${nH(b)}.` : `Right: ${nH(obs[bad - 2]!)} × ${nH(obs[bad]!)} ≠ ${nH(obs[bad - 1]!)}${sup(2)}, so one ratio is a little off.` },
    ], true);
  }
};

// ===== equal-intervals: x goes up by 2 =====
export const stepTwo: Gen = (R, n) => {
  const b = pick(R, [2, 3, 0.5, 2, 3]);
  const a = b === 0.5 ? pick(R, [64, 128, 192]) : int(R, 1, 6);
  const xs = [0, 2, 4, 6], vs = vals(a, b, xs), b2 = r9(b * b);
  const b0: Base = {
    id: `stepTwo-${n}`, family: 'stepTwo',
    prompt: `This table comes from an exponential function <i>y</i> = <i>a</i> · <i>b</i>${sup(xI)}. Notice that <i>x</i> goes up by <b>2</b> each row. By what factor does <i>y</i> change when <i>x</i> goes up by <b>1</b>?`,
    board: `x:\\ 0,\\ 2,\\ 4,\\ 6\\qquad y:\\ ${vs.map(v => nT(v)).join(',\\ ')}`,
    solution: [`From row to row the ratio is ${nH(b2)}, but each row is 2 steps of <i>x</i>.`, `Two equal steps multiply to ${nH(b2)}: <i>b</i> · <i>b</i> = ${nH(b2)}, so <i>b</i> = ${ans(nH(b))}.`],
    picture: { t: tab('x', xs, 'y', vs, { ratios: 'q' }) },
  };
  return numItem(b0, b, `Yes: ${nH(b)} × ${nH(b)} = ${nH(b2)} over two steps, so ×${nH(b)} per step.`, [
    [b2, MC.gaps, `${nH(b2)} is the factor over 2 units of x (one row). Per 1 unit, find the number that multiplies twice to ${nH(b2)}.`],
    [r9(b2 / 2), MC.divide, `Halving ${nH(b2)} does not work for factors: ${nH(b2 / 2)} × ${nH(b2 / 2)} is not ${nH(b2)}. Find b with b · b = ${nH(b2)}.`],
  ], `Each row is 2 steps of x. Which factor, used twice, gives ${nH(b2)}?`);
};

// ===== equal-intervals: unequal gaps =====
export const unequalGaps: Gen = (R, n) => {
  const b = pick(R, [2, 3]), a = int(R, 2, 9);
  const xs = pick(R, [[0, 1, 3], [0, 2, 3], [1, 2, 4]]);
  const real = R() < 0.5;
  // the fake case: the raw ratios between neighbouring rows are equal, but the gaps are not
  const vs = real ? vals(a, b, xs) : [a, a * b, a * b * b];
  const rr = ratios(vs);
  const gaps = xs.slice(1).map((x, i) => x - xs[i]!);
  const per = rr.map((r, i) => r ** (1 / gaps[i]!));
  const same = Math.abs(per[0]! - per[1]!) < 1e-9;
  const opts: Opt[] = [
    { t: 'Yes: per 1 unit of x, the factor is the same everywhere', ok: same, say: same ? `Yes: ${rr.map((r, i) => `×${nH(r)} over ${gaps[i]} unit${gaps[i]! > 1 ? 's' : ''}`).join(' and ')} are both ×${nH(per[0]!)} per unit.` : `Per unit: ${rr.map((r, i) => `×${nH(r)} over ${gaps[i]} unit${gaps[i]! > 1 ? 's' : ''}`).join(', ')}. Those are not the same factor per unit.` },
    { t: 'No: the ratios between neighbouring rows are not equal', ok: false, mc: same ? MC.gaps : undefined, say: same ? `The rows are not equally spaced, so their raw ratios need not match. Per 1 unit of x, both gaps give ×${nH(per[0]!)}.` : `Look again: the raw ratios are both ×${nH(rr[0]!)}.` },
    { t: 'Yes: the ratios between neighbouring rows are equal', ok: false, mc: same ? undefined : MC.gaps, say: same ? `Look again: the raw ratios are ${rr.map(r => '×' + nH(r)).join(' and ')}.` : `Equal raw ratios over UNEQUAL gaps: ×${nH(rr[0]!)} in ${gaps[0]} unit${gaps[0]! > 1 ? 's' : ''} and in ${gaps[1]} unit${gaps[1]! > 1 ? 's' : ''}. An exponential would need different ratios here.` },
    { t: 'No: per 1 unit of x, the factor is not the same everywhere', ok: !same, say: !same ? `Right: ×${nH(rr[0]!)} over ${gaps[0]} unit${gaps[0]! > 1 ? 's' : ''} but also ×${nH(rr[1]!)} over ${gaps[1]} unit${gaps[1]! > 1 ? 's' : ''}: not one factor per unit.` : `Per unit both gaps give ×${nH(per[0]!)}: the same factor.` },
  ];
  return choice(R, {
    id: `unequalGaps-${n}-${real}`, family: 'unequalGaps',
    prompt: `Look at the <i>x</i> values: the gaps are not equal. Could this table come from one exponential function <i>y</i> = <i>a</i> · <i>b</i>${sup(xI)}?`,
    board: `x:\\ ${xs.join(',\\ ')}\\qquad y:\\ ${vs.map(v => nT(v)).join(',\\ ')}`,
    solution: [`Gaps in x: ${gaps.join(' and ')}. Ratios: ${rr.map(r => '×' + nH(r)).join(' and ')}.`, `Per 1 unit of x: ${per.map(p => '×' + nH(rnd(p, 3))).join(' and ')}. ${same ? 'The same: it could be exponential.' : 'Not the same: it cannot be one exponential.'}`],
    picture: { t: tab('x', xs, 'y', vs, { ratios: 'q' }) },
  }, opts, true);
};

// ===== percent-situations: what kind of change =====
const SIT: { t: (R: () => number) => string; k: 'lg' | 'ld' | 'eg' | 'ed'; trap?: boolean }[] = [
  { t: R => `A savings jar gets ${usd(pick(R, [20, 25, 50, 75]))} added every month.`, k: 'lg' },
  { t: R => `A savings account earns ${pick(R, [2, 3, 4, 5])}% interest every month on its current balance.`, k: 'eg', trap: true },
  { t: R => `A town loses ${pick(R, [150, 200, 300])} residents every year.`, k: 'ld' },
  { t: R => `A town loses ${pick(R, [2, 3, 4])}% of its residents every year.`, k: 'ed', trap: true },
  { t: R => `A bond pays ${pick(R, [3, 4, 5])}% simple interest each year, always on the original ${usd(1000)}.`, k: 'lg' },
  { t: R => `A deposit earns ${pick(R, [3, 4, 5])}% interest compounded yearly.`, k: 'eg', trap: true },
  { t: R => `The number of people who have heard a rumor doubles every ${pick(R, [2, 3, 4])} hours.`, k: 'eg' },
  { t: R => `A car’s value drops by ${usd(pick(R, [1200, 1500, 2000]))} every year.`, k: 'ld' },
  { t: R => `A car’s value drops by ${pick(R, [12, 15, 20])}% every year.`, k: 'ed', trap: true },
  { t: R => `A candle burns ${pick(R, ['0.5', '0.75', '1.5'])} inches shorter every hour.`, k: 'ld' },
  { t: R => `Each hour, the body removes ${pick(R, [15, 20, 25])}% of the medicine that is left.`, k: 'ed', trap: true },
  { t: R => `A video’s view count grows by ${pick(R, [10, 20, 30])}% every day.`, k: 'eg', trap: true },
];
export const situationType: Gen = (R, n) => {
  const S = pick(R, SIT), txt = S.t(R);
  const lab = { lg: 'Linear growth: the same amount is added each period', ld: 'Linear decay: the same amount is taken away each period', eg: 'Exponential growth: multiplied by the same factor (more than 1) each period', ed: 'Exponential decay: multiplied by the same factor (between 0 and 1) each period' };
  const why = { lg: 'a fixed amount is added each time', ld: 'a fixed amount is taken away each time', eg: 'a percent of the CURRENT amount is added (or it doubles), so it is multiplied by the same factor', ed: 'a percent of what is LEFT goes, so it is multiplied by the same factor below 1' };
  const opts: Opt[] = (['lg', 'ld', 'eg', 'ed'] as const).map(k => ({
    t: lab[k], ok: k === S.k,
    mc: S.trap && ((S.k === 'eg' && k === 'lg') || (S.k === 'ed' && k === 'ld')) ? MC.addPct : undefined,
    say: k === S.k ? `Yes: ${why[k]}.` : S.trap && k[0] === 'l' ? 'The percent is of the CURRENT amount, which changes. So the amount added or lost changes too: that is multiplying, not adding a fixed amount.' : `Not quite: here ${why[S.k]}.`,
  }));
  return choice(R, {
    id: `situationType-${n}`, family: 'situationType',
    prompt: `${txt} What kind of change is this?`,
    board: `\\text{same amount}\\ \\text{or}\\ \\text{same factor?}`,
    solution: [`Ask: is the change a fixed amount, or a percent of the current amount?`, `Here ${why[S.k]}.`],
  }, opts, true);
};

// ===== percent-situations: simple vs compound interest =====
export const simpleVsCompound: Gen = (R, n) => {
  const P = int(R, 2, 20) * 500, r = pick(R, [2, 3, 4, 5, 6, 8, 10]), T = 2;
  const i = r / 100;
  const simple = r9(P * (1 + i * T)), comp = pw(P, 1 + i, T), v = r9(comp - simple);
  const ts = range(0, T);
  const b0: Base = {
    id: `simpleVsCompound-${n}`, family: 'simpleVsCompound',
    prompt: `Ava deposits ${usd(P)} at <b>${r}% simple interest</b> per year (interest on the original deposit only). Ben deposits ${usd(P)} at <b>${r}% compounded yearly</b> (interest on the current balance). After ${T} years, how many dollars more does Ben have than Ava? (Give the exact amount.)`,
    board: `\\text{Ava: simple } ${r}\\%\\qquad \\text{Ben: compound } ${r}\\%`, unit: 'dollars',
    solution: [
      `Ava: ${usd(P)} + ${T} · ${usd(P * i)} = ${usd(simple, true)}.`,
      `Ben: ${usd(P)} · ${nH(1 + i)}${sup(T)} = ${usd(comp, true)}.`,
      `Ben has ${usd(comp, true)} − ${usd(simple, true)} = ${ans(usd(v, true))} more.`,
    ],
    picture: { t: { tName: 'year', ts: ts.map(x => nH(x)), cols: [
      { name: 'Ava ($)', vals: ts.map(x => (x <= 1 ? nH(r9(P * (1 + i * x)), 2) : null)), reveal: ts.map(x => (x <= 1 ? null : nH(r9(P * (1 + i * x)), 2))), col: 'water' },
      { name: 'Ben ($)', vals: ts.map(x => (x <= 1 ? nH(pw(P, 1 + i, x), 2) : null)), reveal: ts.map(x => (x <= 1 ? null : nH(pw(P, 1 + i, x), 2))) },
    ] } },
  };
  return numItem(b0, v, `Yes: after year 1 they are equal, but then Ben also earns interest on his interest: ${usd(v, true)} more.`, [
    [0, MC.addPct, `They are equal after year 1 only. In year 2 Ben earns ${r}% of ${usd(P * (1 + i), true)}, not of ${usd(P)}.`],
  ], `Work out both balances after ${T} years (Ava adds the same interest each year; Ben multiplies by ${nH(1 + i)}), then subtract.`, 0.005);
};

// ===== long-run-comparison: when does the exponential pass the line =====
export const overtake: Gen = (R, n) => {
  for (;;) {
    const kd = int(R, 0, 2);
    let a: number, b: number, m: number, c: number, unit: string;
    if (kd === 0) { a = pick(R, [2, 3, 5]); b = 2; m = pick(R, [100, 500, 1000]); c = pick(R, [500, 1000]); unit = 'day'; }
    else if (kd === 1) { a = pick(R, [2, 3, 5]); b = pick(R, [1.5, 1.8]); m = pick(R, [20, 30, 40]); c = pick(R, [50, 100]); unit = 'week'; }
    else { a = pick(R, [100, 200]); b = pick(R, [1.05, 1.1]); m = pick(R, [20, 25, 40]); c = pick(R, [500, 1000]); unit = 'year'; }
    const E = (t: number) => a * b ** t, L = (t: number) => m * t + c;
    if (!(E(0) < L(0))) continue;
    const T = firstOver(E, L, 0, 120);
    if (T === null || T < 3) continue;
    if (Math.abs(E(T) - L(T)) < 0.5 || Math.abs(E(T - 1) - L(T - 1)) < 0.5) continue;
    const Et = kd === 0 ? `${a} · 2${sup(tI)}` : `${nH(a)}(${nH(b)})${sup(tI)}`;
    const Lt = c ? `${nH(m)}${tI} + ${nH(c)}` : `${nH(m)}${tI}`;
    const ts = range(0, 3);
    const b0: Base = {
      id: `overtake-${n}`, family: 'overtake',
      prompt: `Two models of an amount: <i>E</i>(${tI}) = ${Et} and <i>L</i>(${tI}) = ${Lt}, with ${tI} in ${unit}s. <i>E</i> starts lower. What is the first whole number ${tI} at which <i>E</i>(${tI}) is greater than <i>L</i>(${tI})? (A table on a calculator is fine.)`,
      board: `E(t) = ${kd === 0 ? `${a}\\cdot 2^t` : `${nT(a)}(${nT(b)})^t`}\\qquad L(t) = ${nT(m)}t${c ? ` + ${nT(c)}` : ''}`, unit: `${unit}s`,
      solution: [
        `At ${tI} = ${T - 1}: <i>E</i> = ${nH(rnd(E(T - 1), 2))}, <i>L</i> = ${nH(L(T - 1))}. <i>E</i> is still behind.`,
        `At ${tI} = ${T}: <i>E</i> = ${nH(rnd(E(T), 2))}, <i>L</i> = ${nH(L(T))}. <i>E</i> is ahead, and since it multiplies while <i>L</i> only adds, it stays ahead.`,
        `First whole ${tI}: ${ans(T)}.`,
      ],
      picture: { t: { tName: unit, ts: ts.map(x => nH(x)), cols: [{ name: 'L', vals: ts.map(x => nH(L(x))), col: 'water' }, { name: 'E', vals: ts.map(x => nH(rnd(E(x), 2))) }] } },
    };
    return numItem(b0, T, `Yes: at ${tI} = ${T}, ${nH(rnd(E(T), 2))} > ${nH(L(T))}. Growth by a factor always wins in the end.`, [
      [T - 1, undefined, `At ${tI} = ${T - 1}, E is ${nH(rnd(E(T - 1), 2))}, still not more than L = ${nH(L(T - 1))}.`],
    ], `Make a table of E and L for whole ${unit}s and find the first ${tI} where E is bigger.`);
  }
};

// ===== long-run-comparison: is the line ahead forever =====
export const aheadForever: Gen = (R, n) => {
  for (;;) {
    const a = pick(R, [1, 2, 5, 10]), b = pick(R, [1.1, 1.2, 1.5, 2]), m = pick(R, [50, 100, 200]), c = pick(R, [500, 1000, 2000]);
    const E = (t: number) => a * b ** t, L = (t: number) => m * t + c;
    const T = firstOver(E, L, 0, 200);
    if (T === null || T < 5) continue;
    const W = Math.min(10, T - 1);
    const opts: Opt[] = [
      { t: `<i>L</i> stays ahead for every ${tI} ≥ 0: it starts far ahead and keeps growing`, mc: MC.oneInput, say: `Ahead at the start is not ahead forever. E multiplies by ${nH(b)} each step, so its gains keep growing; L only adds ${nH(m)}. E passes L at ${tI} = ${T}.` },
      { t: `<i>E</i> passes <i>L</i> at some ${tI}, and stays ahead after that`, ok: true, say: `Yes: E passes L at ${tI} = ${T}. After that E’s gains (${nH(b - 1, 2)} × its size) beat L’s fixed ${nH(m)} every step.` },
      { t: `<i>E</i> passes <i>L</i>, and later <i>L</i> catches up again`, say: `Once E is ahead its step-to-step gain only grows, while L’s gain stays ${nH(m)}. L never catches up again.` },
    ];
    opts.push({ t: `They never meet: <i>E</i> is still below <i>L</i> at ${tI} = ${W}`, mc: MC.oneInput, say: `At ${tI} = ${W}, yes, but that is one input. Keep going: at ${tI} = ${T}, E = ${nH(rnd(E(T), 1))} is above L = ${nH(L(T))}.` });
    return choice(R, {
      id: `aheadForever-${n}`, family: 'aheadForever',
      prompt: `<i>L</i>(${tI}) = ${nH(m)}${tI} + ${nH(c)} and <i>E</i>(${tI}) = ${nH(a)}(${nH(b)})${sup(tI)}. At ${tI} = 0, <i>L</i> is far ahead (${nH(c)} vs ${nH(a)}). Which is true for ${tI} ≥ 0?`,
      board: `L(t) = ${nT(m)}t + ${nT(c)}\\qquad E(t) = ${nT(a)}(${nT(b)})^t`,
      solution: [`E multiplies by ${nH(b)} each step, so its gains grow; L adds the same ${nH(m)} each step.`, `A table shows E first passes L at ${tI} = ${T} and stays ahead.`],
      picture: { g: { x: { min: 0, max: W, step: 1, name: 't' }, y: niceY([0, L(W)]), items: [
        { kind: 'line', key: 'L', m, c, col: 'water', name: 'L' },
        { kind: 'exp', key: 'E', a, b, col: 'link', name: 'E' },
      ] } },
    }, opts);
  }
};
const niceY = (vs: number[]) => ({ ...niceAxis(Math.min(0, ...vs), Math.max(...vs), 10), name: 'y' });

// ===== long-run-comparison: a linear decrease hits 0, a decay does not =====
export const decayVsLinear: Gen = (R, n) => {
  const k = pick(R, [4, 5, 8, 10]), s = k * pick(R, [40, 50, 60, 80, 100, 150, 200]);
  const d = s / k;
  const ts = range(0, 3);
  const opts: Opt[] = [
    { t: `A is empty after ${k} hours; B is never exactly empty`, ok: true, say: `Yes: ${nH(s)} ÷ ${nH(d)} = ${k} hours for A. B keeps halving: ${nH(s / 2)}, ${nH(s / 4)}, … always half of something positive.` },
    { t: `Both are empty after ${k} hours`, mc: MC.constAmount, say: `Only A loses the same ${nH(d)} every hour. B loses half of what is LEFT, so its losses shrink: ${nH(s / 2)}, then ${nH(s / 4)}, …` },
    { t: 'B is empty after 2 hours: two halves make a whole', mc: MC.addPct, say: `The second half is half of what is left (${nH(s / 2)}), not half of the start. After 2 hours B still has ${nH(s / 4)}.` },
    { t: `A is never empty; B is empty after ${k} hours`, say: `A loses the same ${nH(d)} every hour, so it reaches 0 after ${k} hours. B never does.` },
  ];
  return choice(R, {
    id: `decayVsLinear-${n}`, family: 'decayVsLinear',
    prompt: `Two pools each hold ${nH(s)} gallons. Pool A drains <b>${nH(d)} gallons every hour</b>. Pool B loses <b>half of its water every hour</b>. Which is true (in the model)?`,
    board: `A:\\ -${nT(d)}\\ \\text{per hour}\\qquad B:\\ \\times 0.5\\ \\text{per hour}`,
    solution: [`A: ${nH(s)} − ${nH(d)}${tI} = 0 at ${tI} = ${k}.`, `B: ${nH(s)}(0.5)${sup(tI)} is half of a positive number every hour, so it is never 0.`],
    picture: { t: { tName: 'hour', ts: ts.map(x => nH(x)), cols: [{ name: 'A', vals: ts.map(x => nH(s - d * x)), col: 'water' }, { name: 'B', vals: ts.map(x => nH(s * 0.5 ** x)) }] } },
  }, opts);
};
