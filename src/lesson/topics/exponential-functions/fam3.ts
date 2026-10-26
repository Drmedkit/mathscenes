// fam3.ts: stage 3 families (factor over k periods, factor from two points, the exponent as a count of periods,
// rewriting the exponent, compounding n times a year, the constant-ratio proof, testing a model on more data, noisy
// data, meaningful inputs and outputs, limits of extrapolation). Pure: no DOM.
import { type Base, type Gen, type Opt, type PCand, MC, MODEL_FORM, ans, choice, int, numItem, pairItem, pick, sup, tI, xI } from './common';
import { firstOver, nH, nT, nearTie, pw, r9, rnd, usd, usdT, vals } from './expo';
import { niceAxis } from './pictures';
import { ratioLabels, tab } from './fam1';

const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

// ===== multi-period-factor: the factor over k periods =====
export const kFactor: Gen = (R, n) => {
  for (;;) {
    const up = R() < 0.7, r = pick(R, up ? [2, 3, 4, 5, 6, 8, 10, 12] : [5, 10, 20]), k = int(R, 2, up ? 12 : 4);
    const b = r9(up ? 1 + r / 100 : 1 - r / 100), per = pick(R, ['year', 'month', 'week']);
    const exact = b ** k;
    if (nearTie(exact, 3)) continue;
    const v = rnd(exact, 3), lin = rnd(1 + (b - 1) * k, 3);
    if (v === lin) continue;
    const b0: Base = {
      id: `kFactor-${n}`, family: 'kFactor',
      prompt: `An amount ${up ? 'grows' : 'shrinks'} by ${r}% per ${per}. By what factor does it change over ${k} ${per}s? Round to the nearest thousandth.`,
      board: `(${nT(b)})^{${k}}`,
      solution: [`One ${per}: ×${nH(b)}. ${k} ${per}s: ${k} factors of ${nH(b)} multiplied.`, `${nH(b)}${sup(k)} = ${nH(exact, 6)}… ≈ ${ans(nH(v, 3, true))}.`],
    };
    return numItem(b0, v, `Yes: ${nH(b)}${sup(k)} ≈ ${nH(v, 3, true)}${up ? `, a ${nH(rnd((v - 1) * 100, 1))}% increase, more than ${k} × ${r}%` : ''}.`, [
      [lin, MC.addPct, `That adds ${k} × ${r}%. But each ${per}’s ${r}% is of the new amount: multiply ${k} factors, ${nH(b)}${sup(k)}.`],
      [rnd(b * k, 3), MC.powTimes, `${nH(b)}${sup(k)} means ${k} factors of ${nH(b)} multiplied, not ${nH(b)} × ${k}.`],
    ], `Multiply ${k} factors of ${nH(b)}: ${nH(b)}${sup(k)}.`);
  }
};

// ===== multi-period-factor: the percent over k periods =====
export const kPercent: Gen = (R, n) => {
  for (;;) {
    const up = R() < 0.6, r = pick(R, up ? [1, 2, 3, 5] : [5, 10, 20]), k = up ? pick(R, [12, 6, 4]) : int(R, 2, 4);
    const per = up && k === 12 ? 'month' : up ? 'quarter' : 'year', over = up && k === 12 ? 'a year (12 months)' : up && k === 4 ? 'a year (4 quarters)' : up ? '6 quarters' : `${k} years`;
    const b = r9(up ? 1 + r / 100 : 1 - r / 100), f = b ** k, exact = Math.abs(f - 1) * 100;
    if (nearTie(exact, 1)) continue;
    const v = rnd(exact, 1);
    const b0: Base = {
      id: `kPercent-${n}`, family: 'kPercent',
      prompt: `A price ${up ? 'rises' : 'falls'} ${r}% every ${per}. By what percent does it ${up ? 'rise' : 'fall'} over ${over}? Round to the nearest tenth of a percent.`,
      board: `(${nT(b)})^{${k}}`, unit: '%',
      solution: [`Factor over ${k} ${per}s: ${nH(b)}${sup(k)} = ${nH(f, 5)}…`, `${up ? `${nH(f, 5)} − 1` : `1 − ${nH(f, 5)}`} ≈ ${nH(exact / 100, 4)}, so ${ans(nH(v, 1, true) + '%')}.`],
    };
    return numItem(b0, v, `Yes: ${nH(b)}${sup(k)} ≈ ${nH(f, 4)}, a ${nH(v, 1, true)}% ${up ? 'rise' : 'fall'}.`, [
      [r * k, MC.addPct, `${k} × ${r}% adds the percents. Each ${per}’s ${r}% is of the NEW price: multiply the factors, ${nH(b)}${sup(k)}.`],
      [rnd(f * 100, 1), MC.rate, `${nH(f * 100, 1)}% is what the price ${up ? 'becomes' : 'keeps'}. The change is the difference from 100%.`],
    ], `Find the factor ${nH(b)}${sup(k)}, then compare it with 1.`);
  }
};

// ===== two-point-factor: b from two points 2 or 3 apart =====
const TP: { b: number; k: number }[] = [{ b: 3, k: 2 }, { b: 2, k: 3 }, { b: 0.5, k: 2 }, { b: 3, k: 3 }, { b: 2, k: 2 }, { b: 5, k: 2 }, { b: 0.5, k: 3 }, { b: 1.5, k: 2 }];
export const twoPt: Gen = (R, n) => {
  const { b, k } = pick(R, TP), t1 = int(R, 0, 1);
  const y1 = b < 1 ? pick(R, [64, 128, 256]) : b === 1.5 ? pick(R, [16, 32, 64]) : pick(R, [2, 4, 5, 10, 100]);
  if (b > 1 && y1 * b ** k > 1000) return twoPt(R, n);
  const y2 = pw(y1, b, k), t2 = t1 + k, ratio = r9(y2 / y1);
  const b0: Base = {
    id: `twoPt-${n}`, family: 'twoPt',
    prompt: `An exponential function passes through (${t1}, ${nH(y1)}) and (${t2}, ${nH(y2)}). What is its factor <i>b</i> per unit of <i>x</i>?`,
    board: `b^{${k}} = \\dfrac{${nT(y2)}}{${nT(y1)}}`,
    solution: [`From x = ${t1} to x = ${t2} is ${k} steps: <i>b</i>${sup(k)} = ${nH(y2)} ÷ ${nH(y1)} = ${nH(ratio)}.`, `The number whose ${k === 2 ? 'square' : 'cube'} is ${nH(ratio)}: <i>b</i> = ${ans(nH(b))}.`],
    picture: { g: { x: { min: 0, max: t2 + 1, step: 1, name: 'x' }, y: { ...niceAxis(0, Math.max(y1, y2), 10), name: 'y' }, items: [{ kind: 'dots', key: 'P', pts: [[t1, y1], [t2, y2]], named: [0, 1] }], solveItems: [{ kind: 'pts', key: 'S', a: y1 / b ** t1, b, xs: range(t1, t2).filter(x => x !== t1 && x !== t2), col: 'link' }] } },
  };
  return numItem(b0, b, `Yes: ${nH(b)}${sup(k)} = ${nH(ratio)}, so each step is ×${nH(b)}.`, [
    [ratio, MC.perUnit, `${nH(ratio)} is the factor over ${k} steps. Per step you need the number that gives ${nH(ratio)} when used ${k} times.`],
    [r9(ratio / k), MC.divide, `Dividing by ${k} works for differences, not factors: ${nH(ratio / k)}${sup(k)} is not ${nH(ratio)}. Take the ${k === 2 ? 'square' : 'cube'} root.`],
  ], `The total factor over ${k} steps is ${nH(y2)} ÷ ${nH(y1)}. Which number, used ${k} times, makes it?`);
};

// ===== two-point-factor: the whole model from two points =====
export const twoPtModel: Gen = (R, n) => {
  const b = pick(R, [2, 3]), a = int(R, 1, 9), t2 = b === 3 ? 3 : pick(R, [3, 4]);
  const y1 = a * b, y2 = a * b ** t2, k = t2 - 1;
  const b0: Base = {
    id: `twoPtModel-${n}`, family: 'twoPtModel',
    prompt: `An exponential function <i>y</i> = <i>a</i> · <i>b</i>${sup(xI)} passes through (1, ${nH(y1)}) and (${t2}, ${nH(y2)}). Find <i>a</i> and <i>b</i>.`,
    board: `b^{${k}} = \\dfrac{${nT(y2)}}{${nT(y1)}}`,
    solution: [`<i>b</i>${sup(k)} = ${nH(y2)} ÷ ${nH(y1)} = ${nH(b ** k)}, so <i>b</i> = ${b}.`, `Back one step from x = 1: <i>a</i> = ${nH(y1)} ÷ ${b} = ${a}.`, `So <i>y</i> = ${ans(a)} · (${ans(b)})${sup(xI)}.`],
    picture: { g: { x: { min: 0, max: t2 + 1, step: 1, name: 'x' }, y: { ...niceAxis(0, y2, 10), name: 'y' }, items: [{ kind: 'dots', key: 'P', pts: [[1, y1], [t2, y2]], named: [0, 1] }], solveItems: [{ kind: 'pts', key: 'S', a, b, xs: [0, ...range(2, t2 - 1)], col: 'link' }] } },
  };
  const cands: PCand[] = [
    [y1, b, MC.firstOut, `${nH(y1)} is the value at x = 1, not at x = 0. Go back one step: divide by ${b}.`],
    [a, b ** k, MC.perUnit, `${nH(b ** k)} is the factor over ${k} steps. Per step: the number whose ${k === 2 ? 'square' : 'cube'} is ${nH(b ** k)}.`],
    [b, a, MC.aAsB, 'The start goes in front, the factor in the brackets.'],
  ];
  return pairItem(b0, a, b, MODEL_FORM('<i>y</i>', xI), `Yes: <i>y</i> = ${a} · ${b}<sup>x</sup>. Check: ${a} · ${b}${sup(t2)} = ${nH(y2)}.`, cands, 'Find b from the ratio first (it covers several steps), then step back to x = 0 for a.');
};

// ===== exponent-period-count: a·b^(t/k) at whole periods =====
export const periodEval: Gen = (R, n) => {
  const kd = int(R, 0, 2);
  let a: number, b: number, k: number, m: number, s: string, bt: string, unit: string;
  if (kd === 0) { a = pick(R, [80, 160, 320, 640]); b = 0.5; k = pick(R, [5, 8, 12, 30]); m = int(R, 1, 3); unit = 'grams'; s = `A substance has a half-life of ${k} years: <i>A</i>(${tI}) = ${nH(a)}(½)<sup>(t/${k})</sup>, ${tI} in years.`; bt = '\\left(\\tfrac{1}{2}\\right)'; }
  else if (kd === 1) { a = pick(R, [500, 1000, 2500]); b = 1.2; k = 10; m = int(R, 1, 3); unit = 'dollars'; s = `A collectible’s price grows 20% per decade: <i>P</i>(${tI}) = ${nH(a)}(1.2)<sup>(t/10)</sup>, ${tI} in years.`; bt = '(1.2)'; }
  else { a = pick(R, [50, 100, 300]); b = 2; k = pick(R, [3, 4, 6]); m = int(R, 1, 3); unit = 'cells'; s = `A culture doubles every ${k} hours: <i>N</i>(${tI}) = ${nH(a)} · 2<sup>(t/${k})</sup>, ${tI} in hours.`; bt = '\\cdot 2'; }
  const t = k * m, v = pw(a, b, m);
  const f = kd === 0 ? 'A' : kd === 1 ? 'P' : 'N';
  const b0: Base = {
    id: `periodEval-${n}`, family: 'periodEval',
    prompt: `${s} Find <i>${f}</i>(${t}).`,
    board: `${f}(${t}) = ${nT(a)}${bt}^{${t}/${k}}`, unit,
    solution: [`${t}/${k} = ${m}: in ${t} ${kd === 2 ? 'hours' : 'years'} the factor acts ${m} time${m > 1 ? 's' : ''}.`, `${nH(a)} · ${nH(b)}${sup(m)} = ${ans(nH(v))}.`],
  };
  return numItem(b0, v, `Yes: ${m} period${m > 1 ? 's' : ''} of ${k}, so ${nH(a)} · ${nH(b)}${sup(m)} = ${nH(v)}.`, [
    [pw(a, b, t), MC.perUnit, `The factor ${nH(b)} is per ${k} ${kd === 2 ? 'hours' : 'years'}, not per ${kd === 2 ? 'hour' : 'year'}. The exponent is ${t}/${k} = ${m}.`],
    [pw(a, b, t * k), MC.period, `The exponent is ${t} ÷ ${k}, not ${t} × ${k}: ${m} period${m > 1 ? 's' : ''} have passed.`],
  ], `Count the periods: the exponent is ${t}/${k}.`);
};

// ===== exponent-period-count: how many times does the factor act =====
export const periodCount: Gen = (R, n) => {
  const kd = int(R, 0, 1);
  if (kd === 0) {
    const n12 = pick(R, [12, 4, 2]), y = int(R, 2, 10), r = pick(R, [6, 4.8, 3]);
    const per = n12 === 12 ? 'month' : n12 === 4 ? 'quarter' : 'half year';
    const v = n12 * y;
    const b0: Base = {
      id: `periodCount-${n}`, family: 'periodCount',
      prompt: `<i>B</i>(${tI}) = 1000(1 + ${nH(r / 100 / n12, 4)})<sup>${n12}t</sup> is a balance with interest added every ${per}, ${tI} in years. How many times has interest been added after ${y} years?`,
      board: `(1 + ${nT(r / 100 / n12, 4)})^{${n12}t},\\ t = ${y}`, unit: 'times',
      solution: [`The exponent ${n12}${tI} counts ${per}s: ${n12} per year.`, `${n12} · ${y} = ${ans(v)} times.`],
    };
    return numItem(b0, v, `Yes: ${n12} times a year for ${y} years.`, [
      [y, MC.nPeriods, `${y} is the number of years. Interest is added ${n12} times each year.`],
      [r9(y / n12), MC.period, `The exponent is ${n12} × ${tI}, not ${tI} ÷ ${n12}.`],
    ], `The exponent ${n12}${tI} is the number of ${per}s.`);
  }
  const k = pick(R, [2, 3, 4, 5]), m = int(R, 2, 6), H = k * m;
  const b0: Base = {
    id: `periodCount-${n}`, family: 'periodCount',
    prompt: `<i>N</i>(${tI}) = 40 · 2<sup>(t/${k})</sup> (${tI} in hours). How many times does the population double in ${H} hours?`,
    board: `2^{t/${k}},\\ t = ${H}`, unit: 'times',
    solution: [`The exponent ${tI}/${k} counts doublings: one every ${k} hours.`, `${H} ÷ ${k} = ${ans(m)} doublings.`],
  };
  return numItem(b0, m, `Yes: one doubling every ${k} hours, so ${m} in ${H} hours.`, [
    [H, MC.perUnit, `That would be a doubling every hour. Here it doubles every ${k} hours.`],
    [H * k, MC.period, `The exponent is ${tI} ÷ ${k}, not ${tI} × ${k}.`],
  ], `The exponent t/${k} is the number of doublings.`);
};

// ===== rewrite-exponent-form: a·b^(mt+k) → A·B^t =====
export const rewritePair: Gen = (R, n) => {
  const kd = int(R, 0, 3);
  let a: number, b: number, m = 1, k = 0, src: string, srcT: string;
  if (kd === 0) { a = pick(R, [2, 3, 5]); b = pick(R, [2, 3]); k = int(R, 1, 3); src = `${a} · ${b}<sup>(t + ${k})</sup>`; srcT = `${a}\\cdot ${b}^{t+${k}}`; }
  else if (kd === 1) { a = pick(R, [200, 400, 120]); b = pick(R, [0.8, 0.5]); k = -1; src = `${nH(a)}(${nH(b)})<sup>(t − 1)</sup>`; srcT = `${nT(a)}(${nT(b)})^{t-1}`; }
  else if (kd === 2) { a = pick(R, [3, 5, 10]); b = pick(R, [2, 3]); m = b === 3 ? 2 : pick(R, [2, 3]); src = `${a} · ${b}<sup>${m}t</sup>`; srcT = `${a}\\cdot ${b}^{${m}t}`; }
  else { a = 1; b = pick(R, [1.5, 2]); m = pick(R, [2, 3]); k = pick(R, [1, 2]); src = `${nH(b)}<sup>(${m}t + ${k})</sup>`; srcT = `${nT(b)}^{${m}t+${k}}`; }
  const A = pw(a, b, k), B = pw(1, b, m);
  const cands: PCand[] = [];
  if (k !== 0) cands.push([a, B, MC.reassign, `${nH(a)} is not the value at t = 0: there the exponent is ${k}, not 0. Split it off: ${nH(b)}${sup(m === 1 ? 't' : m + 't')} · ${nH(b)}${sup(k)}.`]);
  if (m > 1) { cands.push([A, r9(b * m), MC.powTimes, `(${nH(b)}${sup(m)}) is ${nH(b)} multiplied ${m} times, ${nH(B)}, not ${nH(b)} × ${m}.`]); cands.push([r9(A * m), b, MC.coefOut, `${nH(b)}${sup(m + 't')} is (${nH(b)}${sup(m)})${sup('t')}, not ${m} · ${nH(b)}${sup('t')}.`]); }
  if (k > 0) cands.push([r9(a * b * k), B, MC.powTimes, `${nH(b)}${sup(k)} means ${k} factors of ${nH(b)}, not ${nH(b)} × ${k}.`]);
  if (k < 0) cands.push([r9(a * b), B, MC.forward, `The exponent t − 1 is one step BEHIND t, so the value at t = 0 is ${nH(a)} ÷ ${nH(b)}, not × ${nH(b)}.`]);
  return pairItem({
    id: `rewritePair-${n}`, family: 'rewritePair',
    prompt: `Rewrite <i>y</i> = ${src} in the form <i>y</i> = <i>A</i> · (<i>B</i>)${sup(tI)}.`,
    board: `${srcT} = A\\cdot B^{t}`,
    solution: [
      k !== 0 ? `Split the exponent: ${nH(b)}${sup(`${m === 1 ? '' : m}t ${k > 0 ? '+' : '−'} ${Math.abs(k)}`)} = ${nH(b)}${sup(`${m === 1 ? '' : m}t`)} · ${nH(b)}${sup(k)}, and ${nH(b)}${sup(k)} = ${nH(pw(1, b, k))}, so <i>A</i> = ${nH(a)} · ${nH(pw(1, b, k))} = ${ans(nH(A))}.` : `Nothing to split off: <i>A</i> = ${ans(nH(A))}.`,
      m > 1 ? `Regroup: ${nH(b)}${sup(m + 't')} = (${nH(b)}${sup(m)})${sup('t')} = ${ans(nH(B))}${sup('t')}.` : `The base stays: <i>B</i> = ${ans(nH(B))}.`,
    ],
  }, A, B, MODEL_FORM(), `Yes: <i>y</i> = ${nH(A)}(${nH(B)})<sup>t</sup>: ${nH(A)} at t = 0, ×${nH(B)} per unit of t.`, cands, 'Split off the constant part of the exponent (product rule), then regroup m·t as (b^m)^t.');
};

// ===== rewrite-exponent-form: monthly factor → yearly =====
export const rewriteRate: Gen = (R, n) => {
  for (;;) {
    const r = pick(R, [0.25, 0.3, 0.4, 0.5, 0.6, 0.75, 0.8, 1, 1.25, 1.5]), b = r9(1 + r / 100), P0 = pick(R, [500, 800, 1200, 2000]);
    const exact = b ** 12;
    if (nearTie(exact, 4) || nearTie((exact - 1) * 100, 2)) continue;
    const asPct = R() < 0.5;
    const v = asPct ? rnd((exact - 1) * 100, 2) : rnd(exact, 4);
    const lin = asPct ? r9(12 * r) : r9(1 + 12 * r / 100);
    const b0: Base = {
      id: `rewriteRate-${n}`, family: 'rewriteRate',
      prompt: `<i>B</i>(${tI}) = ${nH(P0)}(${nH(b)})<sup>12t</sup>, with ${tI} in years (the factor ${nH(b)} acts every month). Rewrite it as ${nH(P0)} · <i>Y</i>${sup(tI)}. ${asPct ? 'What is the percent growth per year? Round to the nearest hundredth of a percent.' : 'What is <i>Y</i>, the factor per year? Round to 4 decimal places.'}`,
      board: `(${nT(b)})^{12t} = \\left((${nT(b)})^{12}\\right)^{t}`, unit: asPct ? '%' : '',
      solution: [`Power of a power: (${nH(b)})${sup('12t')} = ((${nH(b)})${sup(12)})${sup('t')}.`, `(${nH(b)})${sup(12)} = ${nH(exact, 6)}…`, asPct ? `That is ${ans(nH(v, 2, true) + '%')} per year.` : `<i>Y</i> ≈ ${ans(nH(v, 4, true))}.`],
    };
    return numItem(b0, v, `Yes: (${nH(b)})${sup(12)} ≈ ${nH(rnd(exact, 4), 4, true)}, a ${nH(rnd((exact - 1) * 100, 2), 2, true)}% yearly increase.`, [
      [lin, MC.addPct, `12 × ${nH(r)}% adds the monthly percents. Each month’s ${nH(r)}% is of the new balance: (${nH(b)})${sup(12)}.`],
      [asPct ? rnd(exact * 100, 2) : r9(12 * b), asPct ? MC.rate : MC.powTimes, asPct ? 'That is what the balance becomes; the increase is the part above 100%.' : `(${nH(b)})${sup(12)} is 12 factors multiplied, not ${nH(b)} × 12.`],
    ], `Work out (${nH(b)})${sup(12)} with a calculator.`);
  }
};

// ===== periodic-compounding: the balance =====
const NN: [number, string][] = [[2, 'semiannually'], [4, 'quarterly'], [12, 'monthly'], [365, 'daily']];
export const compoundBalance: Gen = (R, n) => {
  for (;;) {
    const [N, word] = pick(R, NN), P = pick(R, [800, 1500, 2500, 4000, 6000]), r = pick(R, [3, 4, 4.5, 5, 6, 8]), t = int(R, 2, 10);
    const loan = R() < 0.25;
    const exact = P * (1 + r / 100 / N) ** (N * t);
    if (nearTie(exact, 2)) continue;
    const v = rnd(exact, 2);
    const b0: Base = {
      id: `compoundBalance-${n}`, family: 'compoundBalance',
      prompt: loan
        ? `A loan of ${usd(P)} charges ${nH(r)}% per year, compounded ${word}. If nothing is paid, how much is owed after ${t} years? Round only at the end, to the nearest cent.`
        : `${usd(P)} is deposited at ${nH(r)}% per year, compounded ${word}. What is the balance after ${t} years? Round only at the end, to the nearest cent.`,
      board: `A = P\\left(1 + \\tfrac{r}{n}\\right)^{nt}`, unit: 'dollars',
      solution: [`Period rate: ${nH(r / 100)} ÷ ${N}; periods: ${N} · ${t} = ${N * t}.`, `${nH(P)}(1 + ${nH(r / 100)}/${N})${sup(N * t)} = ${nH(exact, 4)}…`, `${ans(usd(v, true))}.`],
    };
    return numItem(b0, v, `Yes: ${N * t} periods at ${nH(r / N, 4)}% each: ${usd(v, true)}.`, [
      [rnd(P * (1 + r / 100) ** (N * t), 2), MC.annual, `${nH(r)}% is per YEAR. Each of the ${N} periods a year gets ${nH(r)}% ÷ ${N}.`],
      [rnd(P * (1 + r / 100 / N) ** t, 2), MC.nPeriods, `In ${t} years there are ${N} × ${t} = ${N * t} periods, not ${t}.`],
      [rnd(P * (1 + r / 100 * t), 2), MC.addPct, `That is simple interest on the original ${usd(P)}. Compound interest is on the growing balance.`],
    ], `Use A = P(1 + r/n)^(nt) with n = ${N}.`);
  }
};

// ===== periodic-compounding: APY =====
export const apy: Gen = (R, n) => {
  for (;;) {
    const [N, word] = pick(R, NN), r = pick(R, [3, 4, 5, 6, 7.5, 9, 12]);
    const exact = ((1 + r / 100 / N) ** N - 1) * 100;
    if (nearTie(exact, 2)) continue;
    const v = rnd(exact, 2);
    if (v === r) continue;
    const b0: Base = {
      id: `apy-${n}`, family: 'apy',
      prompt: `An account pays ${nH(r)}% per year, compounded ${word}. What is its annual percentage yield (APY), the actual growth over one year? Round to the nearest hundredth of a percent.`,
      board: `\\text{APY} = \\left(1 + \\tfrac{${nT(r / 100)}}{${N}}\\right)^{${N}} - 1`, unit: '%',
      solution: [`Over one year: (1 + ${nH(r / 100)}/${N})${sup(N)} = ${nH(1 + exact / 100, 6)}…`, `Minus 1: APY ≈ ${ans(nH(v, 2, true) + '%')}.`],
    };
    return numItem(b0, v, `Yes: compounding ${word} gives a bit more than ${nH(r)}%: ${nH(v, 2, true)}%.`, [
      [r, MC.apr, `${nH(r)}% is the stated yearly rate. Because interest also earns interest within the year, the actual yield is higher.`],
      [rnd(100 + exact, 2), MC.rate, 'That is what the balance becomes (as a percent of the start). The yield is the part above 100%.'],
    ], `Find (1 + r/n)^n − 1.`);
  }
};

// ===== periodic-compounding: the principal for a target =====
export const principalNeeded: Gen = (R, n) => {
  for (;;) {
    const [N, word] = pick(R, NN.slice(0, 3)), A = pick(R, [5000, 10000, 20000, 25000]), r = pick(R, [3, 4, 5, 6]), t = int(R, 3, 18);
    const exact = A / (1 + r / 100 / N) ** (N * t);
    if (nearTie(exact, 2)) continue;
    const v = rnd(exact, 2);
    const b0: Base = {
      id: `principalNeeded-${n}`, family: 'principalNeeded',
      prompt: `How much must be deposited now at ${nH(r)}% per year, compounded ${word}, to have ${usd(A)} in ${t} years? Round to the nearest cent.`,
      board: `P\\left(1 + \\tfrac{${nT(r / 100)}}{${N}}\\right)^{${N * t}} = ${usdT(A)}`, unit: 'dollars',
      solution: [`The factor over ${t} years: (1 + ${nH(r / 100)}/${N})${sup(N * t)} = ${nH((1 + r / 100 / N) ** (N * t), 6)}…`, `<i>P</i> = ${usd(A)} ÷ that factor ≈ ${ans(usd(v, true))}.`],
    };
    return numItem(b0, v, `Yes: ${usd(v, true)} grows to ${usd(A)}.`, [
      [rnd(A * (1 + r / 100 / N) ** (N * t), 2), MC.forward, `That grows ${usd(A)} even further. To find the start, DIVIDE the target by the factor.`],
      [rnd(A / (1 + r / 100) ** (N * t), 2), MC.annual, `${nH(r)}% is per year; each period gets ${nH(r)}% ÷ ${N}.`],
    ], `Divide the target by (1 + r/n)^(nt).`);
  }
};

// ===== constant-ratio-proof: which argument proves it =====
export const ratioProof: Gen = (R, n) => {
  const a = int(R, 2, 9), b = pick(R, [2, 3, 5, 1.5]);
  const f = pick(R, ['f', 'g']);
  const opts: Opt[] = [
    { t: `${f}(t + 1) ÷ ${f}(t) = ${a} · ${nH(b)}<sup>(t + 1)</sup> ÷ (${a} · ${nH(b)}<sup>t</sup>) = ${nH(b)}<sup>(t + 1 − t)</sup> = ${nH(b)}, for every t`, ok: true, say: `Yes: the algebra works for any t at once, not just the ones you tried.` },
    { t: `${f}(1) ÷ ${f}(0) = ${nH(b)}, ${f}(2) ÷ ${f}(1) = ${nH(b)} and ${f}(3) ÷ ${f}(2) = ${nH(b)}, so the ratio is always ${nH(b)}`, mc: MC.examples, say: 'Three checked cases are examples. The claim is about every t, so you need an argument that works for all t at once.' },
    { t: `${f}(t + 1) = ${a} · ${nH(b)}<sup>t</sup> + ${a} · ${nH(b)}, so the outputs change by the same amount`, mc: MC.distrib, say: `${nH(b)}<sup>(t + 1)</sup> is ${nH(b)}<sup>t</sup> · ${nH(b)} (a product), not ${nH(b)}<sup>t</sup> + ${nH(b)}.` },
    { t: `${f}(t + 1) = ${f}(t) + 1, so each step adds 1 to the output`, mc: MC.shiftAdd, say: `${f}(t + 1) means: put t + 1 into the formula. It is not ${f}(t) plus 1.` },
  ];
  return choice(R, {
    id: `ratioProof-${n}`, family: 'ratioProof',
    prompt: `Claim: for <i>${f}</i>(${tI}) = ${a} · ${nH(b)}${sup(tI)}, the ratio <i>${f}</i>(${tI} + 1) ÷ <i>${f}</i>(${tI}) is ${nH(b)} for <b>every</b> ${tI}. Which argument proves it?`,
    board: `\\dfrac{${f}(t+1)}{${f}(t)} = \\,?`,
    solution: [`Put t + 1 in: ${f}(t + 1) = ${a} · ${nH(b)}<sup>(t + 1)</sup> = ${a} · ${nH(b)}<sup>t</sup> · ${nH(b)}.`, `Divide by ${f}(t) = ${a} · ${nH(b)}<sup>t</sup> (never 0): the ratio is ${nH(b)} for every t.`],
  }, opts);
};

// ===== constant-ratio-proof: the ratio over h steps =====
export const ratioOverH: Gen = (R, n) => {
  const a = int(R, 2, 9), b = pick(R, [2, 3, 0.5, 1.5, 10]), h = int(R, 2, b === 10 ? 3 : 4);
  const v = pw(1, b, h);
  const b0: Base = {
    id: `ratioOverH-${n}`, family: 'ratioOverH',
    prompt: `<i>f</i>(${tI}) = ${a}(${nH(b)})${sup(tI)}. What is <i>f</i>(${tI} + ${h}) ÷ <i>f</i>(${tI}), for any ${tI}?`,
    board: `\\dfrac{f(t+${h})}{f(t)} = \\dfrac{${a}(${nT(b)})^{t+${h}}}{${a}(${nT(b)})^{t}}`,
    solution: [`(${nH(b)})${sup(`t + ${h}`)} = (${nH(b)})${sup('t')} · (${nH(b)})${sup(h)}, and the ${a}(${nH(b)})${sup('t')} cancels.`, `The ratio is (${nH(b)})${sup(h)} = ${ans(nH(v))}, whatever ${tI} is.`],
  };
  return numItem(b0, v, `Yes: ${h} steps of ×${nH(b)} make ×${nH(v)}, for every ${tI}.`, [
    [r9(b * h), MC.powTimes, `${h} steps of ×${nH(b)} multiply: (${nH(b)})${sup(h)}, not ${nH(b)} × ${h}.`],
    [pw(a, b, h), undefined, `The ${a} is in both the top and the bottom: it cancels.`],
  ], `Split (${nH(b)})^(t + ${h}) into (${nH(b)})^t · (${nH(b)})^${h} and cancel.`);
};

// ===== test-extra-observations: linear or exponential through two points =====
export const twoModels: Gen = (R, n) => {
  const a = int(R, 2, 6), b = pick(R, [2, 3]);
  const lin = (x: number) => a + a * (b - 1) * x, ex = (x: number) => a * b ** x;
  const kd = int(R, 0, 2);
  const y2 = kd === 0 ? ex(2) : kd === 1 ? lin(2) : ex(2) + a;
  const ok = kd === 0 ? 'e' : kd === 1 ? 'l' : 'n';
  const opts: Opt[] = [
    { t: 'Only the exponential model fits all three', ok: ok === 'e', say: ok === 'e' ? `Yes: ${a} · ${b}² = ${ex(2)}, the line gives ${lin(2)}.` : `At x = 2 the exponential gives ${ex(2)}, not ${y2}.` },
    { t: 'Only the linear model fits all three', ok: ok === 'l', say: ok === 'l' ? `Yes: the line gives ${lin(2)}; the exponential gives ${ex(2)}.` : `At x = 2 the line gives ${lin(2)}, not ${y2}.` },
    { t: 'Both fit: each passes through two of the observations', mc: MC.examples, say: 'Any two points fit both a line and an exponential. Only a further observation can tell them apart.' },
    { t: 'Neither fits all three', ok: ok === 'n', say: ok === 'n' ? `Yes: the line gives ${lin(2)} and the exponential ${ex(2)}, but the observation is ${y2}.` : `Check x = 2: ${ok === 'e' ? `${a} · ${b}² = ${ex(2)}` : `the line gives ${lin(2)}`}, which matches.` },
  ];
  return choice(R, {
    id: `twoModels-${n}`, family: 'twoModels',
    prompt: `Both <i>L</i>(${xI}) = ${a} + ${a * (b - 1)}${xI} and <i>E</i>(${xI}) = ${a} · ${b}${sup(xI)} pass through the observations (0, ${a}) and (1, ${a * b}). A third observation is (2, ${y2}). Which is true?`,
    board: `L(x) = ${a} + ${a * (b - 1)}x\\qquad E(x) = ${a}\\cdot ${b}^{x}`,
    solution: [`At x = 2: L(2) = ${lin(2)}, E(2) = ${ex(2)}.`, `The observation is ${y2}: ${ok === 'e' ? 'only E fits.' : ok === 'l' ? 'only L fits.' : 'neither fits.'}`],
    picture: { g: { x: { min: 0, max: 3, step: 1, name: 'x' }, y: { ...niceAxis(0, Math.max(ex(2), y2, lin(2)) * 1.15, 10), name: 'y' }, items: [
      { kind: 'line', key: 'L', m: a * (b - 1), c: a, lo: 0, hi: 2.6, col: 'water', name: 'L' }, { kind: 'exp', key: 'E', a, b, lo: 0, hi: 2.6, col: 'link', name: 'E' },
      { kind: 'dots', key: 'O', pts: [[0, a], [1, a * b], [2, y2]] },
    ] } },
  }, opts, true);
};

// ===== test-extra-observations: a model from the first two rows =====
export const modelCheck: Gen = (R, n) => {
  const a = pick(R, [4, 5, 10, 20, 50]), b = pick(R, [2, 3, 1.5]);
  const ts = range(0, 3), model = vals(a, b, ts);
  const kd = int(R, 0, 2);
  const obs = model.slice();
  if (kd === 1) obs[2] = r9(obs[2]! + pick(R, [1, -1]) * a * pick(R, [1, 2]));
  if (kd === 2) obs[3] = r9(obs[3]! + pick(R, [1, -1]) * a * pick(R, [1, 2]));
  const right = kd === 0 ? 'all' : kd === 1 ? '2' : '3';
  const opts: Opt[] = [
    { t: 'It fits every observation', ok: right === 'all', mc: right !== 'all' ? MC.examples : undefined, say: right === 'all' ? 'Yes: it predicts every row.' : `It was built from the first two rows, so of course they fit. Check t = ${right}: the model gives ${nH(model[Number(right)]!)}, the table ${nH(obs[Number(right)]!)}.` },
    { t: 'It first fails at <i>t</i> = 2', ok: right === '2', say: right === '2' ? `Yes: the model gives ${nH(model[2]!)}, the observation is ${nH(obs[2]!)}.` : `At t = 2 the model gives ${nH(model[2]!)}, which is the observation.` },
    { t: 'It first fails at <i>t</i> = 3', ok: right === '3', say: right === '3' ? `Yes: t = 2 fits, but at t = 3 the model gives ${nH(model[3]!)} and the observation is ${nH(obs[3]!)}.` : right === '2' ? 'It already fails earlier.' : `At t = 3 the model gives ${nH(model[3]!)}, which is the observation.` },
  ];
  return choice(R, {
    id: `modelCheck-${n}`, family: 'modelCheck',
    prompt: `Rows <i>t</i> = 0 and 1 were used to build the model <i>y</i> = ${nH(a)}(${nH(b)})${sup(tI)}. Test it on the other rows.`,
    board: `y = ${nT(a)}(${nT(b)})^{t}`,
    solution: [`Model: ${model.map(v => nH(v)).join(', ')}. Table: ${obs.map(v => nH(v)).join(', ')}.`, right === 'all' ? 'Every row matches.' : `The first mismatch is at t = ${right}.`],
    picture: { t: { tName: 't', ts: ts.map(x => nH(x)), cols: [{ name: 'observed', vals: obs.map(v => nH(v)) }] } },
  }, opts, true);
};

// ===== noisy-data-fit: within the tolerance? =====
export const noisyFit: Gen = (R, n) => {
  for (;;) {
    const a = pick(R, [100, 200, 400]), b = pick(R, [1.5, 1.2, 1.3]), T = pick(R, [5, 10, 20]);
    const ts = range(0, 4), pred = vals(a, b, ts);
    const kd = int(R, 0, 2);   // 0 clean noise, 1 levelling off, 2 a straight line
    const obs = pred.map((p, i) => {
      if (kd === 0) return Math.round(p + (i === 0 ? 0 : pick(R, [-1, 1]) * int(R, 1, Math.max(1, T - 2))));
      if (kd === 1) return i < 2 ? Math.round(p + int(R, -1, 1)) : Math.round(p * (1 - 0.06 * (i - 1) ** 1.5));
      return i < 2 ? Math.round(p) : Math.round(pred[0]! + (pred[1]! - pred[0]!) * i);
    });
    const res = obs.map((o, i) => r9(o - pred[i]!));
    const out = res.map(Math.abs).map(x => x > T);
    const bad = out.some(Boolean);
    if (kd === 0 && bad) continue;
    if (kd !== 0 && (!bad || out[0] || out[1])) continue;
    if (res.some(x => Math.abs(Math.abs(x) - T) < 0.6)) continue;
    if (kd === 0 && res.every(x => x === 0)) continue;
    const okT = `Supports the model: every observation is within ${T} of its prediction`;
    const noT = `Does not support it: some observation is more than ${T} from its prediction`;
    const first = res.findIndex(x => Math.abs(x) > T);
    const opts: Opt[] = bad ? [
      { t: noT, ok: true, say: `Yes: at t = ${first} the observation is ${nH(obs[first]!)} and the model says ${nH(pred[first]!)}, ${nH(Math.abs(res[first]!))} apart.` },
      { t: `Supports the model: the first two observations are within ${T}`, mc: MC.endpoint, say: `The model was likely fitted to the start. It has to work for every observation: at t = ${first} it is off by ${nH(Math.abs(res[first]!))}.` },
      { t: okT, say: `Check t = ${first}: ${nH(obs[first]!)} vs ${nH(pred[first]!)}, more than ${T} apart.` },
    ] : [
      { t: okT, ok: true, say: `Yes: the largest gap is ${nH(Math.max(...res.map(Math.abs)))}, within ${T}. Real data never sit exactly on a model.` },
      { t: 'Does not support it: the observations do not match the predictions exactly', mc: MC.exact, say: `Real measurements scatter. The test is the stated tolerance: every gap is at most ${T}.` },
      { t: noT, say: `Check each row: the largest gap is ${nH(Math.max(...res.map(Math.abs)))}, not more than ${T}.` },
    ];
    return choice(R, {
      id: `noisyFit-${n}`, family: 'noisyFit',
      prompt: `Model: <i>P</i>(${tI}) = ${nH(a)}(${nH(b)})${sup(tI)}. The data support it if every observation is within <b>${T}</b> of the model’s prediction. Do they?`,
      board: `|\\text{observed} - \\text{predicted}|\\qquad \\le ${T}\\ ?`,
      solution: [`Gaps (observed − predicted): ${res.map(x => (x >= 0 ? '+' : '−') + nH(Math.abs(x), 2)).join(', ')}.`, bad ? `At t = ${first} the gap is more than ${T}: not supported.` : `All gaps are within ${T}: supported.`],
      picture: { t: { tName: 't', ts: ts.map(x => nH(x)), cols: [{ name: 'observed', vals: obs.map(v => nH(v)) }, { name: 'predicted', vals: pred.map(v => nH(v, 2)), col: 'water' }] } },
    }, opts);
  }
};

// ===== noisy-data-fit: successive ratios drift =====
export const ratioDrift: Gen = (R, n) => {
  for (;;) {
    const kd = int(R, 0, 2);
    const a = pick(R, [100, 200, 500]), b = pick(R, [1.5, 1.4, 1.6]);
    const ts = range(0, 4);
    let vs: number[];
    if (kd === 0) vs = ts.map(t => Math.round(a * b ** t * (1 + (R() - 0.5) * 0.02)));
    else if (kd === 1) vs = ts.map(t => Math.round(a * b ** t * (1 - 0.15 * t)));
    else { const d = Math.round(a * (b - 1)); vs = ts.map(t => Math.round(a + d * t + (R() - 0.5) * 4)); }
    const rr = vs.slice(1).map((v, i) => v / vs[i]!);
    const spread = Math.max(...rr) - Math.min(...rr);
    if (kd === 0 && spread > 0.04) continue;
    if (kd !== 0 && !(rr.every((r, i) => i === 0 || r < rr[i - 1]! - 0.02))) continue;
    const opts: Opt[] = [
      { t: 'Roughly exponential: the ratios stay close to one value', ok: kd === 0, say: kd === 0 ? 'Yes: the ratios wobble a little (real data) but do not drift.' : 'The ratios keep falling: the growth factor is not steady.' },
      { t: 'Not exponential: the ratios keep falling (the percent growth is slowing)', ok: kd !== 0, say: kd !== 0 ? `Yes: ${rr.map(r => nH(rnd(r, 2), 2)).join(', ')} drift down steadily. A constant factor would not do that.` : `The ratios ${rr.map(r => nH(rnd(r, 2), 2)).join(', ')} do not drift: up and down a little.` },
      { t: 'Not exponential: the ratios are not exactly equal', mc: kd === 0 ? MC.exact : undefined, say: kd === 0 ? 'Real data are never exact. Small wobbles around one value still support an exponential model.' : 'Not being exactly equal is not the point; the point is the steady drift down.' },
    ];
    return choice(R, {
      id: `ratioDrift-${n}`, family: 'ratioDrift',
      prompt: 'Measured data, one row per year (the ratios are rounded to 2 decimals). Do the ratios support an exponential model?',
      board: `\\text{ratios:}\\qquad ${rr.slice(0, 2).map(r => nT(rnd(r, 2), 2, true)).join(',\\ ')},\\qquad ${rr.slice(2).map(r => nT(rnd(r, 2), 2, true)).join(',\\ ')}`,
      solution: [`Ratios: ${rr.map(r => nH(rnd(r, 2), 2, true)).join(', ')}.`, kd === 0 ? 'They stay close to one value: roughly exponential.' : 'They fall steadily: growth is slowing, not exponential.'],
      picture: { t: { tName: 'year', ts: ts.map(x => nH(x)), cols: [{ name: 'count', vals: vs.map(v => nH(v)) }], ratios: rr.map(r => '×' + nH(rnd(r, 2), 2, true)) } },
    }, opts, true);
  }
};

// ===== time-domain: the meaningful inputs =====
export const contextDomain: Gen = (R, n) => {
  const kd = int(R, 0, 2), N = int(R, 4, 12);
  let s: string, right: string;
  const V = kd === 2 ? 't' : 'n', disc = `<i>${V}</i> = 0, 1, 2, …, ${N}`;
  if (kd === 0) { s = `A bank adds interest only at the end of each year, so the balance is ${usd(2000)}(1.05)<sup>n</sup> after <i>n</i> years. You follow the account from the deposit (<i>n</i> = 0) to the end of year ${N}.`; right = 'disc'; }
  else if (kd === 1) { s = `A town counts its population once a year, on January 1: <i>P</i>(<i>n</i>) = 8,000(1.03)<sup>n</sup> people, <i>n</i> years after the first count. The model is used from the first count (<i>n</i> = 0) to the count in year <i>n</i> = ${N}.`; right = 'disc'; }
  else { s = `Medicine leaves the blood all the time: <i>M</i>(<i>t</i>) = 500(0.8)<sup>t</sup> mg, <i>t</i> in hours, for the first ${N} hours after the dose (<i>t</i> = 0); it is measured once an hour.`; right = 'cont'; }
  const opts: Opt[] = [
    { t: disc, ok: right === 'disc', say: right === 'disc' ? 'Yes: the quantity only changes at whole steps, so in-between values of the formula mean nothing here.' : 'The medicine exists between the hourly measurements too: every time from 0 to the end counts.' },
    { t: `0 ≤ <i>${V}</i> ≤ ${N}`, ok: right === 'cont', mc: right === 'disc' ? MC.allReals : undefined, say: right === 'cont' ? 'Yes: the amount is there at every moment, measured or not.' : 'Between year ends the formula gives a number, but nothing happens then: only whole years count.' },
    { t: 'All real numbers', mc: MC.allReals, say: 'The formula accepts any input, but negative times and times past the end of the story mean nothing here.' },
  ];
  return choice(R, {
    id: `contextDomain-${n}`, family: 'contextDomain',
    prompt: `${s} For which inputs does the formula give a meaningful value in this situation?`,
    board: `\\text{meaningful inputs?}`,
    solution: [kd === 2 ? 'The medicine is in the blood at every moment, not just at the measurements.' : 'The quantity only changes once per step: in between, the formula’s value never happens.', kd === 2 ? `So every t from 0 to ${N}.` : `So whole numbers from 0 to ${N}.`],
  }, opts, true);
};

// ===== time-domain: the meaningful outputs =====
export const contextRange: Gen = (R, n) => {
  const a = pick(R, [150, 200, 250, 300, 400, 500, 600, 800]), b = pick(R, [0.8, 0.75, 0.9, 0.85]);
  const opts: Opt[] = [
    { t: `0 &lt; <i>M</i> ≤ ${nH(a)}`, ok: true, say: `Yes: it starts at ${nH(a)} (t = 0) and keeps shrinking toward 0 without reaching it.` },
    { t: `0 ≤ <i>M</i> ≤ ${nH(a)}`, mc: MC.reached, say: `0 is never reached: ${nH(b)} times a positive amount is positive.` },
    { t: '<i>M</i> > 0', mc: MC.allReals, say: `For negative t the formula gives more than ${nH(a)}, but those times are before the dose. Here t ≥ 0, so M ≤ ${nH(a)}.` },
    { t: `${nH(a)} ≤ <i>M</i>`, say: `The amount shrinks from ${nH(a)}: every later value is smaller.` },
  ];
  return choice(R, {
    id: `contextRange-${n}`, family: 'contextRange',
    prompt: `<i>M</i>(${tI}) = ${nH(a)}(${nH(b)})${sup(tI)} gives the mg of a medicine in the blood ${tI} hours after the dose, for all ${tI} ≥ 0. What is the range in this situation?`,
    board: `M(t) = ${nT(a)}(${nT(b)})^{t}\\qquad t \\ge 0`,
    solution: [`At t = 0: M = ${nH(a)}, the largest value.`, `As t grows M shrinks toward 0 and never reaches it: 0 &lt; M ≤ ${nH(a)}.`],
    picture: { g: { x: { min: 0, max: 12, step: 1, name: 't (hours)' }, y: { ...niceAxis(0, a, 8), name: 'M (mg)' }, items: [{ kind: 'exp', key: 'C', a, b, lo: 0, ends: ['closed', 'none'] }] } },
  }, opts);
};

// ===== extrapolation-limits: when does the model pass a capacity =====
export const horizon: Gen = (R, n) => {
  for (;;) {
    const a = pick(R, [200, 500, 1000, 50]), b = pick(R, [2, 1.5, 3]), C = pick(R, [100000, 1000000, 500000]);
    const T = firstOver(t => a * b ** t, () => C, 0, 80);
    if (T === null || T < 3) continue;
    if (Math.abs(a * b ** T - C) < 1 || Math.abs(a * b ** (T - 1) - C) < 1) continue;
    const b0: Base = {
      id: `horizon-${n}`, family: 'horizon',
      prompt: `Bacteria in a dish follow <i>N</i>(${tI}) = ${nH(a)}(${nH(b)})${sup(tI)}, ${tI} in hours. The dish can hold at most ${nH(C)} bacteria. After how many whole hours does the model first predict more than the dish can hold (so the model stops being trustworthy)?`,
      board: `N(t) = ${nT(a)}(${nT(b)})^{t}\\qquad N(t) > ${nT(C)}`, unit: 'hours',
      solution: [`t = ${T - 1}: ${nH(rnd(a * b ** (T - 1), 1))} (still fits).`, `t = ${T}: ${nH(rnd(a * b ** T, 1))} > ${nH(C)}. First whole hour: ${ans(T)}.`],
      picture: { t: tab('hour', range(0, 3), 'bacteria', vals(a, b, range(0, 3)), { ratios: 'q' }) },
    };
    return numItem(b0, T, `Yes: at ${tI} = ${T} the model predicts ${nH(rnd(a * b ** T, 0))}, more than the dish holds. Beyond that the real count must level off.`, [
      [T - 1, undefined, `At ${tI} = ${T - 1} the model gives ${nH(rnd(a * b ** (T - 1), 1))}, still within ${nH(C)}.`],
    ], `Make a table of N for whole hours and find the first one above ${nH(C)}.`);
  }
};

// ===== extrapolation-limits: can we trust it far out =====
export const trustModel: Gen = (R, n) => {
  const kd = int(R, 0, 1);
  if (kd === 0) {
    const T0 = pick(R, [180, 190, 200]), room = pick(R, [68, 70, 72]);
    const opts: Opt[] = [
      { t: `It predicts temperatures near 0°F, but the coffee can only cool to the room’s ${room}°F: the model fails for large <i>t</i>`, ok: true, say: `Yes: real coffee levels off at room temperature. A better model lets the DIFFERENCE from ${room}°F decay.` },
      { t: 'It predicts temperatures near 0°F, and that is fine: coffee keeps cooling', mc: MC.cooling, say: `Coffee cannot get colder than the room around it (${room}°F). Only the difference from room temperature shrinks toward 0.` },
      { t: 'It predicts negative temperatures after a few hours', mc: MC.negOut, say: `${T0}(0.9)<sup>t</sup> is positive for every t. The problem is different: it heads to 0°F instead of ${room}°F.` },
      { t: `It predicts the coffee levels off at ${room}°F`, say: `The model has no ${room} in it: it heads to 0°F.` },
    ];
    return choice(R, {
      id: `trustModel-${n}`, family: 'trustModel',
      prompt: `Coffee at ${T0}°F sits in a ${room}°F room. Someone models its temperature as <i>T</i>(${tI}) = ${T0}(0.9)${sup(tI)}, ${tI} in minutes. What does the model say after a long time, and is it believable?`,
      board: `T(t) = ${T0}(0.9)^{t}`,
      solution: [`As t grows, ${T0}(0.9)<sup>t</sup> approaches 0.`, `Real coffee approaches the room’s ${room}°F, so this model fails for large t.`],
      picture: { g: { x: { min: 0, max: 40, step: 5, name: 't (minutes)' }, y: { min: 0, max: 200, step: 20, name: 'T (°F)' }, items: [{ kind: 'exp', key: 'C', a: T0, b: 0.9, lo: 0, col: 'link' }], solveItems: [{ kind: 'hline', key: 'room', y: room, col: 'first' }] } },
    }, opts);
  }
  const P0 = pick(R, [12000, 25000, 40000]), r = pick(R, [2, 3, 4]), Y = pick(R, [2100, 2150, 2200]);
  const opts: Opt[] = [
    { t: `Not trustworthy: ${Y} is far beyond the data, and steady ${r}% growth needs unlimited space, food and jobs`, ok: true, say: 'Yes: a model is evidence only where there are data. Far beyond them, the assumptions behind it (unlimited resources) are unlikely to hold.' },
    { t: 'Trustworthy: the model fit the data from 2000 to 2020 well', mc: MC.extrap, say: `A good fit on 2000 to 2020 says nothing certain about ${Y}. The growth would need to stay ${r}% for ${Y - 2020} more years.` },
    { t: 'Trustworthy: exponential models are always right once they fit', mc: MC.extrap, say: 'No model is always right. Exponential growth always meets a limit in the real world.' },
  ];
  return choice(R, {
    id: `trustModel-${n}`, family: 'trustModel',
    prompt: `<i>P</i>(${tI}) = ${nH(P0)}(1.0${r})${sup(tI)} fits a town’s population from 2000 (${tI} = 0) to 2020 well. Can it be trusted to predict the population in ${Y}?`,
    board: `P(t) = ${nT(P0)}(1.0${r})^{t}\\qquad t = ${Y - 2000}\\ ?`,
    solution: ['The data cover 2000 to 2020 only.', `Predicting ${Y} assumes ${r}% growth for ${Y - 2020} more years, with no limit on resources: not trustworthy.`],
  }, opts);
};
void ratioLabels;
