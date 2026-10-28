// famC.ts: practice families for the last stage of "The normal distribution": is a normal model appropriate,
// standardizing does not make data normal, data facts versus model estimates, sample-to-sample variation (simulated
// samples on dot plots), explaining model-data gaps (with a coin transfer case), and precision versus model
// uncertainty. Pure: no DOM.
import { type Gen, type Opt, A, B, MC, NN, a4, choice, cnt, ctxById, ctxPick, fix, fmt, int, modelPick, normalCurve, numItem, pick, sdAxis, shuffle, until, withU } from './common';
import { Phi, normalcdf, r9, roundTo, safeRound, tableArea } from './normMaths';

const S = (s: string | number) => `<b class="s">${s}</b>`;

// ===================== judge a normal fit =====================
const GOOD = [
  'heights of 400 adult women', 'weights of 500 newborns', 'weights of 300 apples from one orchard', 'May daily highs in Atlanta over 20 years',
  'weights of 250 adult golden retrievers', 'scores of 2,000 students on a well-designed reading test',
];
const BAD: { t: string; why: string }[] = [
  { t: 'times 400 patients waited at a clinic (they can not be negative; most waits are short, a few are very long)', why: 'skewed right and bounded at 0' },
  { t: 'household incomes in a large city', why: 'strongly skewed right' },
  { t: 'heights of everyone at an elementary school family night (children and parents)', why: 'two groups: two peaks' },
  { t: 'number of siblings of 30 students (0, 1, 2 or 3)', why: 'only a few whole values, and a small sample' },
  { t: 'prices of 300 homes for sale, including a few mansions', why: 'skewed right with extreme outliers' },
];
export const fitContext: Gen = (R, n) => {
  const best = R() < 0.6;
  const good = shuffle(R, GOOD.slice()), bad = shuffle(R, BAD.slice());
  const opts: Opt[] = best ? [
    { t: good[0]!, ok: true, say: 'Yes: one peak, roughly symmetric, no hard bound nearby: a normal model is a fair candidate.' },
    ...bad.slice(0, 3).map(b => ({ t: b.t, mc: MC.anyNormal, say: `Not a good fit: ${b.why}. Having a mean and SD does not make data normal.` })),
  ] : [
    { t: bad[0]!.t, ok: true, say: `Yes: ${bad[0]!.why}. A normal model would misplace much of the data.` },
    ...good.slice(0, 3).map(g => ({ t: g, mc: MC.anyNormal, say: 'Those data are usually close to normal: one peak, roughly symmetric.' })),
  ];
  const who = pick(R, ['Jo', 'Ravi', 'Mei', 'Luis', 'Ada', 'Tom', 'Zoe', 'Kofi']);
  return choice(R, {
    id: `fit-ctx-${n}`, family: 'fitContext',
    prompt: `Before using a normal model, ${who} looks at four data sets. For which one is a normal model ${best ? B('most reasonable') : B('least reasonable')}?`,
    board: best ? '\\text{most normal?}' : '\\text{least normal?}',
    solution: ['Check the shape: one peak and symmetric? Natural bounds? Outliers? Two groups mixed? Only a few values?', best ? `${good[0]} passes these checks.` : `${bad[0]!.t.split(' (')[0]}: ${bad[0]!.why}.`],
  }, opts);
};

export const fitBound: Gen = (R, n) => {
  const V = pick(R, [
    { who: 'patients at a clinic', what: 'wait time', unit: 'min', m: [12, 14, 15, 18, 20], k: [0.8, 0.85, 0.9, 1.0, 0.75] },
    { who: 'customers at a phone help line', what: 'call length', unit: 'min', m: [6, 7, 8, 9, 10], k: [0.75, 0.8, 0.9, 1.0] },
    { who: 'commuters', what: 'delay', unit: 'min', m: [5, 6, 8, 10], k: [0.8, 0.9, 1.0] },
  ]);
  const { m, s, z } = until(() => { const m = pick(R, V.m), s = roundTo(m * pick(R, V.k), 1), z = roundTo(-m / s, 2); return { m, s, z }; }, t => safeRound(t.m / t.s, 2, 0.04) && t.z > -1.9);
  const below = tableArea(z), P = fmt(below * 100, 2);
  const N = pick(R, [200, 400, 800]);
  const opts: Opt[] = [
    { t: `No: the model puts about ${P}% of ${V.what}s below 0 ${V.unit}, which is impossible; the data are likely skewed right`, ok: true, say: `Right: 0 is only ${fix(-z, 2)} SDs below the mean, so a normal model leaves a large share below 0.` },
    { t: 'Yes: any data with a mean and an SD can be modeled as normal', mc: MC.anyNormal, say: 'A mean and an SD exist for every data set. The shape decides whether a normal model fits.' },
    { t: `Yes: with ${N} values the data must be close to normal`, mc: MC.anyNormal, say: 'A large sample shows the true shape more clearly; it does not make skewed data normal.' },
    { t: `No: an SD of ${fmt(s)} ${V.unit} is too large for any normal model`, say: 'Any SD is allowed. The problem is the bound at 0, which sits close to the mean.' },
  ];
  return choice(R, {
    id: `fit-bound-${n}`, family: 'fitBound',
    prompt: `${N} ${V.who}: mean ${V.what} ${A(`${fmt(m)} ${V.unit}`)}, SD ${A(`${fmt(s)} ${V.unit}`)}. A ${V.what} can not be negative. Is ${B(NN(m, s))} a reasonable model? (z for 0 rounded to 2 places, table)`,
    board: `z = \\dfrac{0 - ${fmt(m)}}{${fmt(s)}} \\approx ${fix(z, 2).replace('−', '-')}`,
    picture: { card: { x: sdAxis(`${V.what[0]!.toUpperCase() + V.what.slice(1)} (${V.unit})`, m, s), curves: [normalCurve(m, s)], shades: [{ key: 'sh', lo: m - 6 * s, hi: 0, on: 'C', col: 'wrong' }] } },
    solution: [`0 ${V.unit} has z ≈ ${fix(z, 2)}; the table gives ${a4(below)} to its left.`, `The model puts about ${P}% below 0: impossible values. Not a good model.`],
  }, opts);
};

export const fitCheck: Gen = (R, n) => {
  const c = ctxPick(R, ['women', 'men', 'newborn', 'dog', 'apple', 'run']);
  const N = pick(R, [100, 120, 150, 200, 300, 400]);
  const close = R() < 0.5;
  // close: both shares within 5 / 3 points AND within 1.4 standard errors of 68% / 95%;
  // far: both beyond 8 / 4.5 points AND beyond 3.5 / 3 standard errors (more than sample variation explains)
  const se1 = 100 * Math.sqrt(0.68 * 0.32 / N), se2 = 100 * Math.sqrt(0.95 * 0.05 / N);
  const lim1 = close ? Math.min(5, 1.4 * se1) : Math.max(8, 3.5 * se1), lim2 = close ? Math.min(3, 1.4 * se2) : Math.max(4.5, 3 * se2);
  const { w1, w2 } = until(() => {
    const d1 = close ? (R() * 2 - 1) * lim1 : (R() < 0.5 ? -1 : 1) * lim1 * (1 + R() * 0.3), d2 = close ? (R() * 2 - 1) * lim2 : -lim2 * (1 + R() * 0.3);
    return { w1: Math.round((68 + d1) / 100 * N), w2: Math.round((95 + d2) / 100 * N) };
  }, t => {
    const g1 = Math.abs(t.w1 / N * 100 - 68), g2 = Math.abs(t.w2 / N * 100 - 95);
    return t.w2 > t.w1 && t.w2 <= N && (close ? g1 <= lim1 && g2 <= lim2 : g1 >= lim1 && g2 >= lim2);
  });
  const P1 = fmt(w1 / N * 100, 1), P2 = fmt(w2 / N * 100, 1);
  const opts: Opt[] = close ? [
    { t: 'Close to 68% and 95%: a normal model looks reasonable (if the histogram also has one peak and no big outliers)', ok: true, say: 'Yes: the shares are near the benchmarks; check the shape too.' },
    { t: 'Not normal: the shares should be exactly 68% and 95%', mc: MC.mirror, say: 'A real sample never matches exactly. Being close is what we look for.' },
    { t: 'Normal for sure: the shares prove the data are exactly normal', mc: MC.humpNormal, say: 'Agreement makes a normal model reasonable; it does not prove the data are normal.' },
  ] : [
    { t: 'Far from 68% and 95%: a normal model does not look reasonable', ok: true, say: `Right: with n = ${N}, sample variation moves these shares only a few points; ${P1}% and ${P2}% are much farther off.` },
    { t: 'A normal model is fine: every data set with a mean and an SD is normal', mc: MC.anyNormal, say: 'Every data set has a mean and SD. The shares within 1 and 2 SD test the shape.' },
    { t: 'A normal model is fine: the shares never match exactly anyway', mc: MC.anyNormal, say: `Small gaps are normal, but ${P1}% against 68% is too far.` },
  ];
  return choice(R, {
    id: `fit-check-${n}`, family: 'fitCheck',
    prompt: `A sample of ${N} ${c.who} (${c.what}): ${A(`${w1} of ${N}`)} values lie within 1 SD of the mean and ${B(`${w2} of ${N}`)} within 2 SD. What does that suggest about a normal model?`,
    board: `\\tfrac{${w1}}{${N}} \\approx ${P1}\\% \\qquad \\tfrac{${w2}}{${N}} \\approx ${P2}\\%`,
    solution: [`Within 1 SD: ${w1} ÷ ${N} ≈ ${P1}% (normal: about 68%). Within 2 SD: ${w2} ÷ ${N} ≈ ${P2}% (about 95%).`, close ? 'Both are close: consistent with a normal model.' : 'At least one is far off: a normal model does not fit well.'],
  }, opts);
};

// ===================== standardizing keeps the shape =====================
/** the SD-scaled axis of a skewed context, never below 0 (waits and prices can not be negative) */
const skAxis = (name: string, m: number, s: number) => { const k = Math.min(4, Math.floor(m / s)); return { min: r9(m - k * s), max: r9(m + 4 * s), step: s, name }; };
const SKEW = [
  { who: 'patients at a clinic', what: 'wait time', unit: 'min', kind: 'skewR' as const, m: 15, s: 6, word: 'skewed right' },
  { who: 'houses in a town', what: 'price', unit: 'thousand dollars', kind: 'skewR' as const, m: 300, s: 60, word: 'skewed right' },
  { who: 'students on an easy quiz', what: 'score', unit: 'points', kind: 'skewL' as const, m: 85, s: 5, word: 'skewed left' },
  { who: 'people at a family night (children and parents)', what: 'height', unit: 'in', kind: 'bimodal' as const, m: 58, s: 6, word: 'two-peaked' },
];
export const stdShape: Gen = (R, n) => {
  const V = pick(R, SKEW), N = pick(R, [80, 120, 200, 300, 500]);
  const opts: Opt[] = [
    { t: `Still ${V.word}, now with mean 0 and SD 1`, ok: true, say: 'Yes: subtracting the mean and dividing by the SD slides and rescales; the shape stays.' },
    { t: 'A normal (bell) shape', mc: MC.stdNormal, say: 'z-scores keep the shape of the data. Only the axis changes.' },
    { t: 'Symmetric around 0, since z-scores are centered at 0', mc: MC.stdNormal, say: 'Centered at 0, yes; symmetric, no: a skewed shape stays skewed.' },
    { t: V.kind === 'skewL' ? 'Skewed right: dividing flips the tail' : V.kind === 'skewR' ? 'Skewed left: subtracting flips the tail' : 'One peak: the two groups merge', say: 'Standardizing never flips or merges anything; it only slides and rescales.' },
  ];
  return choice(R, {
    id: `std-shape-${n}`, family: 'stdShape',
    prompt: `The ${V.what}s of ${cnt(N)} ${V.who} have a ${B(V.word)} histogram. Each value is turned into its z-score. What shape do the ${cnt(N)} z-scores have?`,
    board: `z = \\dfrac{x - \\bar{x}}{s}`,
    picture: { card: { x: skAxis(`${V.what[0]!.toUpperCase() + V.what.slice(1)} (${V.unit})`, V.m, V.s), curves: [{ key: 'C', kind: V.kind, m: V.m, s: V.s, col: 'link' }] } },
    solution: ['Standardizing subtracts one number and divides by one positive number.', `That slides and rescales the axis: the shape stays ${V.word}.`],
  }, opts);
};

export const stdTable: Gen = (R, n) => {
  const V = pick(R, SKEW.filter(v => v.kind !== 'skewL'));
  const z = pick(R, [1.2, 1.5, 1.8, 2, 2.2, -0.8]), x = roundTo(V.m + z * V.s, 0);
  const zz = roundTo((x - V.m) / V.s, 2), P = fmt(tableArea(zz) * 100, 2);
  const who = pick(R, ['Lee', 'Sam', 'Ari', 'Kim']);
  const opts: Opt[] = [
    { t: `The z-score is right, but the table percent assumes a normal shape, which these data do not have`, ok: true, say: 'Yes: z is a fine distance in SDs; the table areas belong to a normal curve.' },
    { t: 'Yes: once data are standardized, the standard normal table applies', mc: MC.stdNormal, say: 'Standardizing does not make data normal, so normal-table areas do not apply.' },
    { t: 'Yes: any data set with a mean and an SD follows the table', mc: MC.anyNormal, say: 'The table describes a normal curve. These data are not normal.' },
    { t: 'No: the z-score itself is wrong, because z needs normal data', say: `z = (x − mean) ÷ SD works for any data: ${fix(zz, 2)} is a correct distance in SDs.` },
  ];
  return choice(R, {
    id: `std-table-${n}`, family: 'stdTable',
    prompt: `${cnt(pick(R, [120, 200, 400]))} ${V.who}: ${B(V.word)} data, mean ${A(`${fmt(V.m)} ${V.unit}`)}, SD ${A(`${fmt(V.s)} ${V.unit}`)}. A value of ${fmt(x)} ${V.unit} has z = ${fix(zz, 2)}. ${who} says: "The table gives ${P}% below z = ${fix(zz, 2)}, so ${P}% of the values are below ${fmt(x)}." Is that justified?`,
    board: `z = ${fix(zz, 2).replace('−', '-')} \\qquad \\text{table: } ${P}\\%\\ ?`,
    picture: { card: { x: skAxis(`${V.what[0]!.toUpperCase() + V.what.slice(1)} (${V.unit})`, V.m, V.s), curves: [{ key: 'C', kind: V.kind, m: V.m, s: V.s, col: 'link' }], vlines: [{ key: 'v', x, col: 'pick' }] } },
    solution: ['The z-score is a valid distance in SDs for any data.', `The table's ${P}% is an area under a NORMAL curve; these data are ${V.word}, so that percent is not justified.`],
  }, opts);
};

// ===================== data facts versus model estimates =====================
export const factModel: Gen = (R, n) => {
  const N = pick(R, [25, 30, 32, 40]), m = pick(R, [72, 74, 76, 78]), s = pick(R, [7, 8, 9]), cut = m + pick(R, [5, 6, 7, 8, 10]);
  const pM = roundTo(1 - normalcdf(-1e9, cut, m, s), 2), k = until(() => int(R, 2, Math.round(N * 0.45)), k => Math.abs(k / N - pM) > 0.03);
  const est = roundTo(N * pM, 1);
  const fact = R() < 0.5;
  const opts: Opt[] = fact ? [
    { t: `${k} of the ${N} students scored above ${cut}`, ok: true, say: 'Yes: counted from the recorded scores.' },
    { t: `About ${fmt(pM * 100)}% of students score above ${cut}`, mc: MC.modelTruth, say: 'That comes from the model, not from counting the class. It is an estimate.' },
    { t: `Exactly ${fmt(est, 1)} students scored above ${cut}`, mc: MC.approxExact, say: 'That is the model estimate N × area; no class has a fraction of a student.' },
    { t: `Every class of ${N} will have ${k} students above ${cut}`, mc: MC.mirror, say: 'Another class will differ: samples vary.' },
  ] : [
    { t: `About ${fmt(pM * 100)}% of students score above ${cut}`, ok: true, say: 'Yes: that comes from the model\'s area; it is an estimate.' },
    { t: `${k} of the ${N} students scored above ${cut}`, mc: MC.modelTruth, say: 'That is a fact: counted from the recorded data.' },
    { t: `The class mean was ${m} points`, mc: MC.modelTruth, say: 'The class mean is computed from the recorded data: a fact about these scores.' },
    { t: `${N} students took the test`, say: 'That is a recorded fact.' },
  ];
  return choice(R, {
    id: `fact-${n}`, family: 'factModel',
    prompt: `${N} students took a test: mean ${A(m)} points, SD ${A(s)}; ${k} of them scored above ${cut}. A model ${NN(m, s)} gives P(X > ${cut}) = ${fix(pM, 2)}. Which statement is ${B(fact ? 'a fact about the recorded data' : 'a model estimate')}?`,
    board: `\\text{data: } ${k}/${N} \\qquad \\text{model: } ${fix(pM, 2)}`,
    picture: { card: { x: sdAxis('Test score (points)', m, s), curves: [normalCurve(m, s)], shades: [{ key: 'sh', lo: cut, hi: m + 6 * s, on: 'C' }] } },
    solution: ['Facts: counted or computed from the recorded data.', 'Estimates: read from the model (areas, N × area).'],
  }, opts);
};

export const factDiscrete: Gen = (R, n) => {
  const N = pick(R, [150, 200, 240, 300]), m = pick(R, [72, 74, 75, 76]), s = pick(R, [8, 9, 10]), v = m + pick(R, [-6, -4, -2, 2, 4, 6]);
  const area = roundTo(normalcdf(v - 0.5, v + 0.5, m, s), 4), k = Math.max(2, Math.round(N * area) + int(R, -2, 2));
  const opts: Opt[] = [
    { t: `Scores are whole numbers: "scored ${v}" matches the model's area from ${v - 0.5} to ${v + 0.5}, about ${fix(area, 4)}`, ok: true, say: `Yes: about ${fmt(N * area, 1)} of ${N} expected; ${k} is close to that.` },
    { t: `The model is broken: it says no one can score exactly ${v}`, mc: MC.modelTruth, say: `A continuous model treats "${v}" as an interval of width 1 for whole-number scores; it does not forbid them.` },
    { t: `The ${k} scores of ${v} must be recording mistakes`, mc: MC.law, say: 'The data are facts. The model is the approximation.' },
    { t: `P(X = ${v}) is the curve's height at ${v}, so it is not 0`, mc: MC.heightProb, say: 'Height is a density. The share for a whole-number score is an area of width 1.' },
  ];
  return choice(R, {
    id: `fact-disc-${n}`, family: 'factDiscrete',
    prompt: `${N} students' whole-number test scores are modeled by ${A(NN(m, s))}. ${B(`${k} students scored exactly ${v}`)}, yet in the model P(X = ${v}) = 0. How do these fit together?`,
    board: `P(X = ${v}) = 0 \\qquad \\text{data: } ${k}`,
    picture: { card: { x: sdAxis('Test score (points)', m, s), curves: [normalCurve(m, s)], vlines: [{ key: 'v', x: v, col: 'pick' }] } },
    solution: ['The data are whole numbers; the model is continuous.', `"Scored ${v}" corresponds to ${v - 0.5} ≤ X < ${v + 0.5}: area ≈ ${fix(area, 4)}, about ${fmt(N * area, 1)} students.`],
  }, opts);
};

// ===================== sample-to-sample variation =====================
/** shares (percent) of `k` simulated samples of size `nS` that fall within 1 SD (p = 0.6827) or below the mean (0.5) */
function simShares(R: () => number, k: number, nS: number, p: number, round: number): number[] {
  return Array.from({ length: k }, () => { let c = 0; for (let i = 0; i < nS; i++) if (R() < p) c++; return roundTo(Math.round((c / nS * 100) / round) * round, 1); });
}
const sdOf = (xs: number[]) => { const m = xs.reduce((a, b) => a + b, 0) / xs.length; return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / xs.length); };
function samplesPic(R: () => number, within: boolean) {
  const p = within ? 0.6827 : 0.5, k = 25;
  const lo = within ? 30 : 15, hi = within ? 100 : 85;
  const { small, big } = until(() => ({ small: simShares(R, k, 20, p, 5), big: simShares(R, k, 200, p, 2) }), t => [...t.small, ...t.big].every(v => v >= lo && v <= hi) && Math.abs(t.small.reduce((a, b) => a + b, 0) / k - (within ? 68.27 : 50)) <= 3 && Math.abs(t.big.reduce((a, b) => a + b, 0) / k - (within ? 68.27 : 50)) <= 1.5 && sdOf(t.small) >= 2 * sdOf(t.big));
  const mid = within ? 68 : 50;
  return {
    small, big, mid,
    samples: { axis: { min: lo, max: hi, step: 5, name: within ? 'Share within 1 SD (%)' : 'Share below the mean (%)' }, panels: [{ key: 'S', label: 'Samples of n = 20', data: small }, { key: 'L', label: 'Samples of n = 200', data: big }], mark: mid },
  };
}
export const sampSpread: Gen = (R, n) => {
  const within = R() < 0.6;
  const P = samplesPic(R, within);
  const c = ctxPick(R, ['women', 'men', 'newborn', 'dog', 'apple']), [m, s] = modelPick(R, c);
  const target = within ? '68%' : '50%';
  const opts: Opt[] = [
    { t: `Both scatter around ${target}; the n = 20 shares scatter much more widely`, ok: true, say: 'Yes: small samples bounce around more. Neither size hits the model value every time.' },
    { t: `Each sample should show exactly ${target}; the others were drawn wrong`, mc: MC.mirror, say: 'Random samples vary; even from a perfect model, few land exactly on the model value.' },
    { t: 'The n = 200 shares scatter more, because there are more values', mc: MC.marginN, say: 'Larger samples vary LESS from sample to sample. Look at the widths of the two plots.' },
    { t: `The n = 20 samples show that the model ${NN(m, s)} is wrong`, mc: MC.modelTruth, say: 'They were drawn FROM this model. Wide scatter for n = 20 is just sampling variation.' },
  ];
  return choice(R, {
    id: `samp-${n}`, family: 'sampSpread',
    prompt: `A computer drew 25 random samples of n = 20 and 25 samples of n = 200 from the model ${A(NN(m, s))} (${c.what} of ${c.who}). Each dot is one sample's share ${within ? 'within 1 SD of the mean' : 'below the mean'}. Which statement fits the dot plots?`,
    board: `\\text{model: } ${target.replace('%', '\\%')}`,
    picture: { samples: P.samples },
    solution: [`Both plots center near the model's ${target}.`, 'The n = 20 dots spread much wider: small samples vary more.'],
  }, opts);
};

export const sampRead: Gen = (R, n) => {
  const within = R() < 0.6;
  const { P, t, k } = until(() => {
    const P = samplesPic(R, within), hi = R() < 0.5;
    const t = within ? (hi ? pick(R, [75, 80]) : pick(R, [55, 60])) : (hi ? pick(R, [60, 65]) : pick(R, [35, 40]));
    const k = P.small.filter(v => (hi ? v >= t : v <= t)).length;
    return { P, t: { v: t, hi }, k };
  }, x => x.k >= 1 && x.k <= 12);
  const kBig = P.big.filter(v => (t.hi ? v >= t.v : v <= t.v)).length;
  const c = ctxPick(R, ['women', 'men', 'newborn', 'dog', 'apple']), [m, s] = modelPick(R, c);
  return numItem({
    id: `samp-read-${n}`, family: 'sampRead',
    prompt: `25 random samples of n = 20 and 25 of n = 200 were drawn from the model ${NN(m, s)} for the ${c.what} of ${c.who}; each dot is one sample's share ${within ? 'within 1 SD of the mean' : 'below the mean'} (the model says ${within ? '68%' : '50%'}). How many of the ${B('n = 20')} samples have a share of ${A(`${t.v}% or ${t.hi ? 'more' : 'less'}`)}?`,
    board: `n = 20: \\text{share} ${t.hi ? '\\ge' : '\\le'} ${t.v}\\%`,
    unit: 'samples',
    picture: { samples: P.samples },
    solution: [`Count the dots in the n = 20 plot at ${t.v}% or ${t.hi ? 'above' : 'below'}: ${S(k)}`, `In the n = 200 plot only ${kBig}: big samples stay closer to the model value.`],
    ex: { k },
  }, k, 'plain', `Yes: ${k} of 25 small samples, against ${kBig} of the large ones.`, [[kBig, undefined, 'That is the n = 200 plot. Count the n = 20 dots.']], `Count the n = 20 dots at ${t.v}% or ${t.hi ? 'more' : 'less'}.`);
};

// ===================== explaining model-data gaps =====================
export const discExplain: Gen = (R, n) => {
  const c = ctxPick(R, ['women', 'men']), [m, s] = modelPick(R, c);
  const kind = pick(R, ['vary', 'bias', 'fit', 'agree'] as const);
  const nS = kind === 'vary' ? pick(R, [15, 20, 25]) : pick(R, [800, 1200, 2000]);
  const share = kind === 'vary' ? pick(R, [56, 60, 76, 80]) : kind === 'fit' ? pick(R, [78, 81, 84]) : kind === 'agree' ? pick(R, [67, 68, 69]) : 68;
  const story = kind === 'vary' ? `A random sample of ${nS} ${c.who}: ${share}% are within 1 SD of the model's mean (the model says about 68%).`
    : kind === 'bias' ? `Heights of the ${pick(R, [12, 14, 15])} players on a college basketball team: their mean is ${fmt(m + pick(R, [6, 7, 8]))} in, far above the model's ${fmt(m)} in.`
      : kind === 'fit' ? `A random sample of ${cnt(nS)} ${c.who}: ${share}% within 1 SD of the mean, a high sharp peak and long tails on both sides.`
        : `A random sample of ${cnt(nS)} ${c.who}: ${share}% within 1 SD of the mean, close to the model's 68%.`;
  const right = { vary: 'Ordinary sample-to-sample variation: small random samples often miss 68% by this much', bias: 'Selection bias: the group was not chosen at random from the population', fit: 'A real mismatch in shape: with this many values, the normal model does not fit well', agree: 'The data are consistent with the model, though agreement alone does not prove the sample is representative' }[kind];
  const opts: Opt[] = [
    { t: right, ok: true, say: 'Yes.' },
    ...(kind !== 'vary' ? [{ t: 'Ordinary sample-to-sample variation: small random samples often miss 68% by this much', mc: kind === 'agree' ? undefined : MC.mirror, say: kind === 'bias' ? 'Variation in random samples cannot explain a whole team far above the mean: the team is not a random sample.' : kind === 'fit' ? `With ${cnt(nS)} values, chance alone would land very near 68%.` : 'Nothing needs explaining here: the data agree with the model.' }] : []),
    ...(kind !== 'bias' ? [{ t: 'Selection bias: the group was not chosen at random from the population', say: 'The sample was random, so this is not selection bias.' }] : []),
    ...(kind !== 'fit' ? [{ t: 'A real mismatch in shape: with this many values, the normal model does not fit well', mc: kind === 'vary' ? MC.mirror : undefined, say: kind === 'vary' ? `With only ${nS} values, a gap like this is common even when the model is right.` : 'The data were chosen in a biased way; that says nothing about the model\'s shape.' }] : []),
    ...(kind === 'agree' ? [{ t: 'The close agreement proves the sample is representative', mc: MC.agreeProves, say: 'A biased sample can still match one number by luck. Agreement is consistent with a good sample; it is not proof.' }] : [{ t: 'The model is a law, so the data must contain mistakes', mc: MC.law, say: 'The data are the facts; the model is an approximation.' }]),
  ];
  return choice(R, {
    id: `disc-${n}`, family: 'discExplain',
    prompt: `The model for the ${c.what} of ${c.who} is ${A(NN(m, s))}. ${story} What is the best explanation?`,
    board: kind === 'bias' ? `\\text{a team, not a random sample?}` : `${share}\\%\\ \\text{vs}\\ 68\\% \\qquad n = ${cnt(nS).replace(/,/g, '{,}')}`,
    solution: ['Ask: random sample or not? How large? Does the shape itself differ?', `Here: ${right}.`],
  }, opts);
};

export const discCoin: Gen = (R, n) => {
  const k = pick(R, [4, 5, 6]), runs = pick(R, [500, 1000, 2000]);
  const p = 0.5 ** k;
  const hits = until(() => { let h = 0; for (let i = 0; i < runs; i++) { let all = true; for (let j = 0; j < k; j++) if (R() >= 0.5) { all = false; break; } if (all) h++; } return h; }, h => h > 0);
  const P = fmt(hits / runs * 100, 2);
  const opts: Opt[] = [
    { t: `No: ${k} in a row happened in about ${P}% of the simulated runs, so one such result is not strong evidence against a fair coin`, ok: true, say: `Yes: unusual, but it happens about 1 time in ${2 ** k}.` },
    { t: `Yes: a fair coin can never give ${k} tails in a row`, mc: MC.modelTruth, say: `The simulation shows it does happen: ${hits} times in ${cnt(runs)} runs.` },
    { t: `Yes: a fair coin must give about half tails in every ${k} flips`, mc: MC.mirror, say: 'Short runs vary a lot. "About half" describes many flips, not every handful.' },
    { t: 'No: the next flip is now very likely to be heads', mc: MC.evExact, say: 'The coin has no memory: the next flip is still 50-50. The conclusion is right, the reason is not.' },
  ];
  return choice(R, {
    id: `coin-${n}`, family: 'discCoin',
    prompt: `Model: a fair coin. A computer simulated ${cnt(runs)} runs of ${k} flips: ${A(`${hits} runs`)} gave ${k} tails in a row. Jordan flips a real coin ${k} times and gets ${B(`${k} tails`)}. Should Jordan doubt that the coin is fair?`,
    board: `\\dfrac{${hits}}{${cnt(runs).replace(/,/g, '{,}')}} \\approx ${P}\\% \\qquad \\left(\\tfrac{1}{2}\\right)^{${k}} \\approx ${fmt(p * 100, 1)}\\%`,
    picture: { calc: { title: 'Simulation', lines: [`runs: ${cnt(runs)}`, `flips per run: ${k}`, `all tails: ${hits}`, `share: ${P}%`] } },
    solution: [`${hits} of ${cnt(runs)} ≈ ${P}% of runs (the model says ${fmt(p * 100, 2)}%).`, 'Unusual, but not rare enough for one result to overturn the model.'],
  }, opts);
};

// ===================== precision versus model uncertainty =====================
export const precReport: Gen = (R, n) => {
  const c = ctxPick(R, ['women', 'men', 'newborn', 'dog', 'apple']);
  const [m0, s0] = modelPick(R, c), nS = pick(R, [30, 40, 50, 60]);
  const x = roundTo(m0 + pick(R, [0.8, 1, 1.2, 1.5, -1.3, -0.9]) * s0, c.dx);
  const above = x > m0, raw = above ? 1 - Phi((x - m0) / s0) : Phi((x - m0) / s0);
  const six = fix(raw, 6), whole = Math.round(raw * 100);
  if (!safeRound(raw * 100, 0, 0.06)) return precReport(R, n + 1000);
  const opts: Opt[] = [
    { t: `About ${whole}% of ${c.who} are ${above ? c.more : c.less} than ${withU(c, x)} (a model estimate)`, ok: true, say: 'Yes: sensible precision and a hedge; the model came from a sample of ' + nS + '.' },
    { t: `Exactly ${fmt(raw * 100, 4)}% of ${c.who} are ${above ? c.more : c.less} than ${withU(c, x)}`, mc: MC.approxExact, say: 'Four decimals claim a precision the model does not have: its mean and SD are estimates from ' + nS + ' values.' },
    { t: `About ${six}% of ${c.who} are ${above ? c.more : c.less} than ${withU(c, x)}`, mc: MC.pctSign, say: `${six} is a proportion. As a percent it is about ${whole}%.` },
    { t: `Exactly ${fmt(raw * nS, 4)} of the ${nS} sampled ${c.who} are ${above ? c.more : c.less} than ${withU(c, x)}`, mc: MC.modelTruth, say: 'That is a model estimate, and a fraction of a person: count the sample if you want a fact.' },
  ];
  return choice(R, {
    id: `prec-${n}`, family: 'precReport',
    prompt: `From a sample of ${nS} ${c.who}, the model ${A(NN(m0, s0))} was estimated. A calculator gives ${B(`P(X ${above ? '>' : '<'} ${fmt(x)}) = ${six}`)}. Which is the best report?`,
    board: `P(X ${above ? '>' : '<'} ${fmt(x)}) \\qquad = ${six}`,
    picture: { card: { x: sdAxis(c, m0, s0), curves: [normalCurve(m0, s0)], shades: [{ key: 'sh', lo: above ? x : m0 - 6 * s0, hi: above ? m0 + 6 * s0 : x, on: 'C' }] } },
    solution: ['The mean and SD are estimates, so the area is an estimate too.', `Keep the digits while computing, then report sensibly: about ${whole}%.`],
  }, opts);
};

export const precTableCalc: Gen = (R, n) => {
  const c = ctxPick(R, ['women', 'men', 'newborn', 'dog', 'apple', 'temp']);
  const { m, s, x, z, At, Ac } = until(() => {
    const [m, s] = modelPick(R, c), x = roundTo(m + (R() * 2 - 1) * 2 * s, c.dx), z = (x - m) / s;
    return { m, s, x, z, At: tableArea(roundTo(z, 2)), Ac: roundTo(Phi(z), 4) };
  }, t => safeRound(t.z, 2, 0.04) && Math.abs(t.At - t.Ac) >= 0.0002 && Math.abs(t.z) > 0.2 && safeRound(Phi(t.z), 4, 0.03));
  const who = pick(R, ['Rosa', 'Theo', 'Nia', 'Eli']);
  const opts: Opt[] = [
    { t: 'Both are fine: the gap is far smaller than the uncertainty in the model itself', ok: true, say: `Yes: ${a4(At)} and ${a4(Ac)} both say about ${fmt(Ac * 100, 0)}%.` },
    { t: `Only the calculator's ${a4(Ac)} is right; the table answer is wrong`, mc: MC.approxExact, say: 'The table rounds z to 2 places; the result is a fine approximation of an estimate.' },
    { t: `The true share of ${c.who} is exactly ${fmt(Ac * 100, 2)}%`, mc: MC.modelTruth, say: 'The model is an approximation; no area from it is the exact real share.' },
    { t: `Round z to 1 decimal place to make the answer more accurate`, say: 'Rounding more makes it less precise, not more accurate.' },
  ];
  return choice(R, {
    id: `prec-tc-${n}`, family: 'precTableCalc',
    prompt: `X ~ ${A(NN(m, s))} (${c.what} of ${c.who}). For P(X < ${fmt(x)}), ${who} used the table with z rounded to ${fix(roundTo(z, 2), 2)} and got ${B(a4(At))}; normalcdf gives ${B(a4(Ac))}. What should we make of the difference?`,
    board: `\\text{table: } ${a4(At)} \\qquad \\text{normalcdf: } ${a4(Ac)}`,
    picture: { card: { x: sdAxis(c, m, s), curves: [normalCurve(m, s)], shades: [{ key: 'sh', lo: m - 6 * s, hi: x, on: 'C' }] } },
    solution: [`The table used z = ${fix(roundTo(z, 2), 2)} instead of ${fmt(z, 4)}; the gap is ${fmt(Math.abs(At - Ac), 4)}.`, 'The model itself is only approximate, so both values support the same report.'],
  }, opts);
};

export const FAM_C: Record<string, Gen> = {
  fitContext, fitBound, fitCheck, stdShape, stdTable, factModel, factDiscrete, sampSpread, sampRead, discExplain, discCoin, precReport, precTableCalc,
};
export const NAMES_C: Record<string, string> = {
  fitContext: 'Which data are normal?', fitBound: 'A bound at 0', fitCheck: 'Check 68 and 95', stdShape: 'z keeps the shape', stdTable: 'z is not a table license',
  factModel: 'Fact or estimate?', factDiscrete: 'Whole-number data', sampSpread: 'Samples vary', sampRead: 'Read the simulation', discExplain: 'Why the gap?',
  discCoin: 'A coin model', precReport: 'Report with sense', precTableCalc: 'Table versus calculator',
};
void ctxById; void r9;
