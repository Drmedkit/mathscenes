// famC.ts: stage 3 families (the effect of an extreme value on center and spread, choosing measures, comparing
// distributions, handling unusual values). Pure: no DOM.
import { type Gen, type Opt, MC, RULE, CTX, H, axisOf, choice, ctxPick, int, listH, listT, numItem, phrase, pick, shuffle, tenth, until, val, groupsOf, manyOf, un } from './common';
import type { DMark, DPanel } from './DataPlot';
import { fromCounts, shapeCounts } from './famA';
import { five, fences, iqrOf, isOutlier, mean, median, range, sdPop, sorted, stacks, sum, r9, fmt, fmtT } from './stats';

const dotP = (key: string, data: number[], label?: string): DPanel => ({ key, kind: 'dot', data, label });
const vline = (key: string, x: number, label: string, col: DMark['col'] = 'link', panels?: string[]): DMark => ({ kind: 'vline', key, x, label, col, panels });
const ints = (R: () => number, N: number, lo: number, hi: number) => Array.from({ length: N }, () => int(R, lo, hi));

// ===================== outlier-effect-center =====================
export const effectCenter: Gen = (R, n) => {
  const v = pick(R, ['replace', 'replace', 'add', 'tail']);
  const c = ctxPick(R, v === 'tail' ? ['points', 'quiz'] : ['commute', 'test']), u = c.unit;
  if (v === 'tail') {
    const k = int(R, 0, 9), xs = [3, 3, 3, 5, 5, 5, 5, 10].map(x => x + k);
    const m = mean(xs), md = median(xs);
    return choice(R, {
      id: `effectCenter-${n}`, family: 'effectCenter',
      prompt: `These 8 values have a long tail to the right: ${listH(xs)}. Which statement is true?`,
      board: `\\bar{x} = \\,?\\qquad \\text{median} = \\,?`,
      picture: { plot: { axis: { min: k, max: k + 12, step: 1, name: 'Value' }, panels: [dotP('A', xs)], solveMarks: [vline('m', m, `mean ${fmt(m)}`, 'link'), vline('md', md, `median ${fmt(md)}`, 'second')] } },
      solution: [`Mean: ${sum(xs)} ÷ 8 = ${fmt(m)}. Median: the mean of the 4th and 5th values, ${fmt(md)}.`, `Here the mean is BELOW the median, even with a right tail: “mean above median” is a common tendency, not a rule.`],
    }, [
      { t: `The mean (${fmt(m)}) is below the median (${fmt(md)}).`, ok: true, say: 'Yes: a right tail usually pulls the mean above the median, but not always, as this set shows.' },
      { t: `The mean is above the median, because a right tail always pulls it there.`, mc: MC.rightTail, say: `Compute them: mean ${fmt(m)}, median ${fmt(md)}. The tendency does not hold here.` },
      { t: `The mean equals the median (${fmt(md)}).`, say: `The mean is ${fmt(m)}: add the values and divide by 8.` },
      { t: `The median is ${fmt(k + 4)}, halfway between ${k + 3} and ${k + 5}.`, say: 'Count in to the middle: the 4th and 5th values are both ' + fmt(md) + '.' },
    ]);
  }
  if (v === 'replace') {
    const N = int(R, 5, 8), top = c.lo + (c.id === 'test' ? 26 : 16), maxB = c.id === 'test' ? 100 : 55, k = int(R, 2, Math.max(2, Math.floor((maxB - top) / N))), d = N * k;
    const xs = sorted(until(() => ints(R, N, c.lo + 2, top), x => new Set(x).size >= N - 1 && Number.isInteger(mean(x)) && (c.id !== 'test' || sorted(x).every((v, i, s) => i === 0 || v === s[i - 1] || v - s[i - 1]! >= 2))));
    const a = xs[N - 1]!, b = a + d, m = mean(xs), md = median(xs);
    return choice(R, {
      id: `effectCenter-${n}`, family: 'effectCenter',
      prompt: `Here are ${phrase(c, N)}: ${listH(xs)}. The largest value, ${a}, is changed to ${b}. What happens to the mean and the median?`,
      board: `${a} \\to ${b}\\qquad n = ${N}`,
      picture: { plot: { axis: axisOf(c, xs[0]!, b, { ticks: [8, 20] }), panels: [dotP('A', xs, 'Before'), dotP('B', sorted([...xs.slice(0, -1), b]), 'After')], solveMarks: [vline('m0', m, `mean ${fmt(m)}`, 'link', ['A']), vline('m1', m + k, `mean ${fmt(m + k)}`, 'link', ['B'])] } },
      solution: [`The total grows by ${b} − ${a} = ${d}, shared by ${N} values: the mean rises by ${d} ÷ ${N} = ${k}.`, `The middle of the ordered list does not move: the median stays ${fmt(md)}.`],
    }, [
      { t: `The mean rises by ${k} ${u}; the median stays ${fmt(md)}.`, ok: true, say: 'Yes: the mean feels every value; the median only feels the middle.' },
      { t: `Both the mean and the median rise by ${k} ${u}.`, mc: MC.equalEffect, say: 'The median is the middle of the ordered list, and the middle values did not change.' },
      { t: `The mean rises by ${d} ${u}; the median stays ${fmt(md)}.`, mc: MC.meanIgnoresN, say: `The extra ${d} is shared by all ${N} values: the mean rises by ${d} ÷ ${N}.` },
      { t: 'Neither changes: one value cannot move a summary.', mc: MC.meanIgnoresExtreme, say: 'The mean uses every value, so one big change moves it.' },
    ]);
  }
  // add a value: odd n becomes even, the median moves a little, the mean a lot
  const N = 5;
  const [xs, V] = until(() => { const x = sorted(ints(R, N, c.lo + 2, c.lo + (c.id === 'test' ? 26 : 18))); return [x, c.lo + int(R, 30, 40)] as const; }, ([x, V]) => new Set(x).size === N && Number.isInteger(mean(x)) && Number.isInteger(mean([...x, V])) && V <= c.hi && (c.id !== 'test' || x.every((v, i) => i === 0 || v - x[i - 1]! >= 2)));
  const m0 = mean(xs), m1 = mean([...xs, V]), md0 = median(xs), md1 = median([...xs, V]);
  return choice(R, {
    id: `effectCenter-${n}`, family: 'effectCenter',
    prompt: `Here are ${phrase(c, N)}: ${listH(xs)}. A sixth value, ${V}, is added. What happens to the mean and the median?`,
    board: `+\\,${V}\\qquad n: 5 \\to 6`,
    picture: { plot: { axis: axisOf(c, xs[0]!, V, { ticks: [8, 20] }), panels: [dotP('A', xs, 'Before'), dotP('B', sorted([...xs, V]), 'After')], solveMarks: [vline('m0', md0, `median ${fmt(md0)}`, 'second', ['A']), vline('m1', md1, `median ${fmt(md1)}`, 'second', ['B'])] } },
    solution: [`Mean: ${sum(xs)} ÷ 5 = ${fmt(m0)} becomes ${sum([...xs, V])} ÷ 6 = ${fmt(m1)}.`, `Median: the 3rd value ${fmt(md0)} becomes the mean of the 3rd and 4th, ${fmt(md1)}.`],
  }, [
    { t: `Mean ${fmt(m0)} → ${fmt(m1)}; median ${fmt(md0)} → ${fmt(md1)}.`, ok: true, say: 'Yes: the mean jumps; the median only shifts a little, because the count became even.' },
    { t: `Mean ${fmt(m0)} → ${fmt(m1)}; the median stays ${fmt(md0)}.`, mc: MC.medNever, say: `With 6 values the median is the mean of the two middle ones: ${fmt(md1)}. Adding a value can move it.` },
    ...(Math.abs((md1 - md0) - (m1 - m0)) > 1e-9 ? [{ t: `Both rise by ${fmt(m1 - m0)}.`, mc: MC.equalEffect, say: `The median only moves from ${fmt(md0)} to ${fmt(md1)}.` }] : []),
    { t: 'Neither changes much: one value cannot move them.', mc: MC.meanIgnoresExtreme, say: `The mean moves from ${fmt(m0)} to ${fmt(m1)}.` },
  ]);
};

export const meanShift: Gen = (R, n) => {
  const c = ctxPick(R, ['commute', 'test']);
  const N = int(R, 8, 12), k = int(R, 2, 3), up = R() < 0.6;
  const xs = sorted(ints(R, N, c.lo + 2, c.lo + 16));
  const a = up ? xs[N - 1]! : xs[N - 1]! + N * k, b = up ? a + N * k : xs[N - 1]!;
  const before = sorted([...xs.slice(0, -1), a]);
  const story = up ? `The largest value, ${a}, is changed to ${b}.` : `The largest value, ${a}, was a typo: it is fixed to ${b}.`;
  return numItem({
    id: `meanShift-${n}`, family: 'meanShift',
    prompt: `A data set holds ${phrase(c, N)}. ${story} By how much does the mean ${up ? 'go up' : 'go down'}?`,
    board: `${a} \\to ${b}\\qquad n = ${N}`, unit: c.unit,
    picture: { plot: { axis: axisOf(c, before[0]!, Math.max(a, b), { ticks: [8, 22] }), panels: [dotP('A', before)] } },
    solution: [`The total changes by ${Math.abs(b - a)}.`, `Shared by ${N} values: ${Math.abs(b - a)} ÷ ${N} = <b class="s">${k}</b> ${c.unit}.`],
  }, k, 'Yes: the change in the total, divided by n.', [
    [Math.abs(b - a), MC.meanIgnoresN, `The ${Math.abs(b - a)} is shared by all ${N} values: divide by ${N}.`],
    [-k, undefined, `Type the size of the change: ${k}.`],
  ], `How much does the total change? Then divide by ${N}.`);
};

// ===================== outlier-effect-spread =====================
export const effectSpread: Gen = (R, n) => {
  const add = R() < 0.4;
  const N = int(R, 7, 11);
  const xs = sorted(until(() => ints(R, N - 1, 42, 96), x => new Set(x).size === N - 1));
  const ceo0 = int(R, 140, 190), ceo1 = ceo0 * 10;
  const before = [...xs, ceo0];
  if (!add) {
    const after = [...xs, ceo1], f0 = five(before), f1 = five(after);
    if (iqrOf(f0) !== iqrOf(f1)) throw new Error('effectSpread: IQR moved');
    return choice(R, {
      id: `effectSpread-${n}`, family: 'effectSpread',
      prompt: `A small company has ${N} employees. Their salaries (thousands of dollars): ${listH(before)}. The CEO’s salary, ${ceo0}, is raised to ${ceo1}. What happens to the SD and the IQR?`,
      board: `${ceo0} \\to ${ceo1}`,
      solution: [`The quartiles come from the middle of the ordered list; the CEO stays the largest, so Q1 and Q3 do not move: IQR stays ${fmt(iqrOf(f0))}.`, `The SD uses every distance from the mean: it jumps from about ${fmt(sdPop(before), 0)} to about ${fmt(sdPop(after), 0)}.`],
    }, [
      { t: 'The SD gets much larger; the IQR stays the same.', ok: true, say: 'Yes: the IQR only looks at the middle half, so it resists one extreme value.' },
      { t: 'The SD and the IQR grow by the same amount.', mc: MC.equallySensitive, say: 'The IQR ignores the extremes: Q1 and Q3 do not move. The SD feels every value.' },
      { t: 'The IQR gets much larger; the SD stays the same.', say: 'It is the other way around: the SD feels every value, the IQR only the middle half.' },
      { t: 'Neither changes: the order of the salaries stays the same.', say: 'The order stays, but the SD uses the distances from the mean, and one distance got huge.' },
    ]);
  }
  const V = ceo1, after = [...before, V], q0 = iqrOf(five(before)), q1 = iqrOf(five(after));
  if (q0 === q1) return effectSpread(R, n + 911, undefined);
  return choice(R, {
    id: `effectSpread-${n}`, family: 'effectSpread',
    prompt: `A company has ${N} employees. Salaries (thousands of dollars): ${listH(before)}. It hires a new employee at ${V}. What happens to the SD and the IQR? ${RULE.quart}`,
    board: `+\\,${V}\\qquad n: ${N} \\to ${N + 1}`,
    solution: [`With ${N + 1} values the halves change: the IQR goes from ${fmt(q0)} to ${fmt(q1)}.`, `The SD jumps, from about ${fmt(sdPop(before), 0)} to about ${fmt(sdPop(after), 0)}: one huge distance from the mean.`],
  }, [
    { t: `Both change: the SD a lot, the IQR a little (${fmt(q0)} to ${fmt(q1)}).`, ok: true, say: 'Yes: adding a value moves the quartiles a little; the SD feels the extreme value a lot.' },
    { t: 'The SD changes; the IQR cannot change.', mc: MC.iqrImmune, say: `Adding a value changes which values sit in each half: the IQR goes from ${fmt(q0)} to ${fmt(q1)}.` },
    { t: 'Both change by about the same amount.', mc: MC.equallySensitive, say: 'The SD changes far more: it uses the distance of the new value from the mean.' },
    { t: 'Neither changes: one salary cannot matter.', say: 'One huge salary moves the SD a lot.' },
  ]);
};

export const iqrAfter: Gen = (R, n) => {
  const c = ctxPick(R, ['commute', 'points', 'battery', 'test']);
  const N = pick(R, [8, 9, 10, 11]);
  const [xs, V] = until(() => { const x = sorted(ints(R, N - 1, c.lo + 2, c.lo + 16)); return [x, x[x.length - 1]! + int(R, 14, 22)] as const; }, ([x, V]) => { const a = [...x, V]; return iqrOf(five(a)) !== iqrOf(five(x)) && isOutlier(V, fences(five(a))) && V <= (c.id === 'test' ? 100 : c.hi + 10); });
  const all = sorted([...xs, V]), q0 = iqrOf(five(all)), f1 = five(xs), q1 = iqrOf(f1);
  return numItem({
    id: `iqrAfter-${n}`, family: 'iqrAfter',
    prompt: `Here are ${phrase(c, N)}: ${listH(all)}. Its IQR is ${fmt(q0)}. You remove the outlier ${V}. What is the new IQR? ${RULE.quart}`,
    board: listT(all), unit: c.unit, picture: { list: { name: c.axis, data: all } },
    solution: [`Without ${V}: ${listH(xs)} (${N - 1} values).`, `Q1 = ${fmt(f1.q1)}, Q3 = ${fmt(f1.q3)}: IQR = <b class="s">${fmt(q1)}</b>.`],
  }, q1, 'Yes: the halves change when the count changes.', [
    [q0, MC.iqrImmune, `With one value fewer, the halves hold different values: work out Q1 and Q3 again.`],
    [range(xs), undefined, 'That is the new range. The IQR is Q3 − Q1.'],
  ], `Remove ${V}, split the ${N - 1} values into halves, and find Q3 − Q1.`);
};

// ===================== choose-measures =====================
const PAIRS = ['Mean and SD', 'Median and IQR', 'No single pair: describe each cluster', 'Mode and range'];
export const choosePair: Gen = (R, n) => {
  const k = pick(R, ['sym', 'skew', 'outlier', 'bimodal', 'total']);
  let plot: { axis: { min: number; max: number; step: number; name: string }; panels: DPanel[] }, prompt: string, right: number, why: string;
  if (k === 'sym') {
    const cs = shapeCounts(R, 'mound'), d = fromCounts(R, cs, 56, 2), N = d.length;
    plot = { axis: { min: 56, max: 72, step: 2, name: 'Height (inches)' }, panels: [{ key: 'A', kind: 'hist', data: sorted(d), bins: { start: 56, width: 2 } }] };
    prompt = `The histogram shows the heights of ${N} adult women. Which center-and-spread pair describes them best?`; right = 0; why = 'One peak, symmetric, no outliers: the mean and SD use every value and describe it well.';
  } else if (k === 'skew' || k === 'total') {
    const cs = shapeCounts(R, 'right'), d = fromCounts(R, cs, 40, 40), N = d.length;
    plot = { axis: { min: 40, max: 360, step: 40, name: k === 'skew' ? 'Home price ($1,000s)' : 'Salary ($1,000s)' }, panels: [{ key: 'A', kind: 'hist', data: sorted(d), bins: { start: 40, width: 40 } }] };
    if (k === 'skew') { prompt = `The histogram shows the prices of ${N} homes sold in a town. You want to describe a typical home price. Which pair fits best?`; right = 1; why = 'Strongly skewed right: the expensive homes pull the mean and SD up. The median and IQR resist the tail.'; }
    else { prompt = `The histogram shows the salaries of ${N} employees. The owner wants to plan the total payroll for next year. Which center fits that question best?`; right = 0; why = 'The total is mean × n, so the mean answers this question, even though the data are skewed.'; }
  } else if (k === 'outlier') {
    const c = ctxPick(R, ['commute', 'battery', 'points']);
    const N = int(R, 10, 14), base = c.lo + 2;
    const xs = sorted([...ints(R, N - 1, base, base + 9), base + int(R, 24, 30)]);
    if (Math.max(...stacks(xs).values()) > 5) return choosePair(R, n + 919, undefined);
    plot = { axis: axisOf(c, xs[0]!, xs[N - 1]!, { ticks: [8, 20] }) as never, panels: [dotP('A', xs)] };
    prompt = `The dot plot shows ${phrase(c, N)}. One value is far from the rest. Which center-and-spread pair describes the typical value best?`; right = 1; why = 'One value far from the rest pulls the mean and inflates the SD. The median and IQR barely notice it.';
  } else {
    const cs = shapeCounts(R, 'bimodal'), d = fromCounts(R, cs, 34, 5), N = d.length;
    plot = { axis: { min: 34, max: 34 + 5 * cs.length, step: 5, name: 'Height (inches)' }, panels: [{ key: 'A', kind: 'hist', data: sorted(d), bins: { start: 34, width: 5 } }] };
    prompt = `The histogram shows the heights of ${N} people at a family picnic, adults and kids. How should you summarize them?`; right = 2; why = 'Two clusters (kids and adults): one center would sit in the gap where almost nobody is. Describe each cluster.';
  }
  const opts: Opt[] = PAIRS.map((t, i) => ({
    t, ok: i === right,
    mc: i === right ? undefined : (k === 'skew' || k === 'outlier') && i === 0 ? MC.meanBest : k === 'total' && i === 1 ? MC.purpose : k === 'bimodal' && (i === 0 || i === 1) ? MC.clusters : i === 3 ? undefined : undefined,
    say: i === right ? why : i === 3 ? 'The mode and range use only the most common value and the two extremes.' : why,
  }));
  return choice(R, { id: `choosePair-${n}`, family: 'choosePair', prompt, board: `\\text{center} + \\text{spread}`, picture: { plot: plot as never }, solution: [why] }, opts, true);
};

// ===================== compare-distributions =====================
export const compareClaim: Gen = (R, n) => {
  const c = ctxPick(R, ['commute', 'points', 'quiz', 'battery']), u = c.unit;
  const [N0, N1] = groupsOf(R, c);
  const mk = (lo: number, w: number) => ints(R, int(R, 9, 12), lo, lo + w);
  const lo = c.lo + int(R, 0, 3);
  const [a, b] = until(() => [mk(lo, int(R, 6, 12)), mk(lo + int(R, 3, 6), int(R, 6, 12))], ([a, b]) => {
    const fa = five(a!), fb = five(b!), d = fb.med - fa.med, dm = r9(fb.med - mean(a!)), dmin = Math.min(...b!) - Math.min(...a!);
    return d >= 2 && Math.min(...b!) <= Math.max(...a!) && iqrOf(fa) !== iqrOf(fb) && Math.abs(dm - d) >= 0.5 && Math.abs(dm - r9(mean(b!) - mean(a!))) >= 0.5 && Math.abs(dmin - d) >= 1 && dmin > 0 && Number.isInteger(mean(a!) * 10) && Math.max(...stacks([...a!]).values()) <= 4 && Math.max(...stacks([...b!]).values()) <= 4;
  });
  const fa = five(a!), fb = five(b!), d = r9(fb.med - fa.med), mA = mean(a!), dm = r9(fb.med - mA), dmin = Math.min(...b!) - Math.min(...a!);
  const wider = iqrOf(fb) > iqrOf(fa) ? N1 : N0;
  const opts: Opt[] = [
    { t: `${N1}’s median is ${fmt(d)} ${u} higher, and ${wider} has the larger IQR (${fmt(iqrOf(fa))} vs. ${fmt(iqrOf(fb))} ${u} for ${N0} vs. ${N1}).`, ok: true, say: 'Yes: same measures for both groups, center and spread.' },
    { t: `Every ${N1} value is higher than every ${N0} value.`, mc: MC.everyHigher, say: 'The plots overlap: a higher center does not make every value higher.' },
    { t: `${N0}’s mean is ${fmt(mA, 2)} and ${N1}’s median is ${fmt(fb.med)}, so ${N1} is ${fmt(dm, 2)} ${u} higher.`, mc: MC.meanVsMedian, say: 'That compares a mean with a median. Compare the same measure for both groups.' },
    { t: `${N1}’s lowest value is ${fmt(dmin)} ${dmin === 1 ? c.u1 : u} above ${N0}’s lowest, so ${N1} is typically ${fmt(dmin)} ${dmin === 1 ? c.u1 : u} higher.`, mc: MC.singledOut, say: 'One value from each group does not show what is typical. Compare the medians.' },
  ];
  const all = [...a!, ...b!];
  return choice(R, {
    id: `compareClaim-${n}`, family: 'compareClaim',
    prompt: `The dot plots show ${manyOf(c)} for ${N0} (n = ${a!.length}) and ${N1} (n = ${b!.length}) on one scale. Which comparison is correct and fair? ${RULE.quart}`,
    board: `\\text{${N0} vs. ${N1}}`,
    picture: { plot: { axis: axisOf(c, Math.min(...all), Math.max(...all), { step: Math.max(...all) - Math.min(...all) > 18 ? 2 : 1, ticks: [8, 20] }), panels: [dotP('A', sorted(a!), N0), dotP('B', sorted(b!), N1)], solveMarks: [vline('mA', fa.med, `median ${fmt(fa.med)}`, 'link', ['A']), vline('mB', fb.med, `median ${fmt(fb.med)}`, 'link', ['B'])] } },
    solution: [`Medians: ${N0} ${fmt(fa.med)}, ${N1} ${fmt(fb.med)}: ${N1} is ${fmt(d)} higher.`, `IQRs: ${N0} ${fmt(iqrOf(fa))}, ${N1} ${fmt(iqrOf(fb))}. The plots overlap.`],
  }, opts);
};

// ===================== outlier-handling =====================
const HANDLE = [
  {
    s: 'Heights (inches) of {n} ninth graders. One entry reads 610; all the others are between 58 and 74.',
    right: 'Check the record: it is almost surely 61 in. typed wrong. Fix it, recompute, and note the fix.',
    wrong: [['Delete 610 and do not mention it.', MC.alwaysDelete, 'Never remove a value silently. Here the record shows what it should be: fix it and say so.'], ['Keep 610: data must stay exactly as recorded.', undefined, 'A height of 610 inches (50 feet) is impossible. It is an entry error to fix, with a note.'], ['Delete 610 and also the tallest real height, so the data look even.', MC.cherryPick, 'Removing real values to get a nicer result is cherry-picking.']],
    why: 'An impossible value with an obvious source (a slipped digit) is fixed, and the fix is reported.',
  },
  {
    s: '5K race times (minutes) of {n} runners. One runner took 48 minutes; the others took 21 to 33. The race log confirms she walked the last mile after a sprained ankle.',
    right: 'Keep it: it is a real time. Report the summaries with and without it.',
    wrong: [['Delete it: an outlier must be a mistake.', MC.mustBeError, 'The log confirms it is real. An unusual value is not automatically an error.'], ['Delete it so the mean time looks better.', MC.cherryPick, 'Removing a real value to get a preferred result is cherry-picking.'], ['Replace it with the median time.', undefined, 'Changing a real value hides what happened. Keep it and show its effect.']],
    why: 'A verified real value stays. Showing the summaries with and without it lets readers see its effect.',
  },
  {
    s: 'Birth weights (pounds) of {n} newborns in a hospital. One reads 2.4 lb; the others are 6 to 9 lb. Nobody knows whether the scale was misread.',
    right: 'Investigate the source; until it is resolved, report the results with and without it.',
    wrong: [['Delete it quietly.', MC.alwaysDelete, 'Never delete a value without saying so. Its origin is unknown: investigate.'], ['It must be an error: change it to 7.4 lb.', MC.mustBeError, 'Very small babies do exist. Guessing a “fix” invents data.'], ['Ignore it: one value never changes the summaries.', MC.meanIgnoresExtreme, 'One extreme value can move the mean and the SD a lot.']],
    why: 'When you cannot tell whether a value is real, check its source and be open about its effect.',
  },
  {
    s: 'A bank studies {n} card charges to look for fraud. One charge is $9,800; almost all others are under $200.',
    right: 'Keep it and flag it: unusual charges are exactly what the study is looking for.',
    wrong: [['Delete it: outliers spoil the average.', MC.alwaysDelete, 'Here the outlier is the point of the study: deleting it would hide possible fraud.'], ['It must be a typo: change it to $98.', MC.mustBeError, 'Nothing says it is a typo. Large real charges happen, and some are fraud.'], ['Delete every charge above $200 to clean the data.', MC.cherryPick, 'Removing real values that do not fit is cherry-picking.']],
    why: 'When the unusual value is what the study is about, it is kept and examined, never removed.',
  },
] as const;
export const handleOutlier: Gen = (R, n) => {
  const c0 = pick(R, HANDLE), N = c0.s.startsWith('A bank') ? pick(R, ['1,500', '2,000', '2,400', '3,000', '5,000']) : String(int(R, 15, 40));
  const cs = { ...c0, s: c0.s.replace('{n}', N) };
  const opts: Opt[] = [{ t: cs.right, ok: true, say: `Yes. ${cs.why}` }, ...cs.wrong.map(([t, mc, say]) => ({ t, mc, say }))];
  return choice(R, { id: `handleOutlier-${n}`, family: 'handleOutlier', prompt: `${cs.s} What should you do with the unusual value?`, board: `\\text{investigate, then decide}`, solution: [cs.why] }, opts);
};

export const typoFix: Gen = (R, n) => {
  const N = int(R, 6, 9);
  const [xs, i] = until(() => { const x = ints(R, N, 58, 74); return [x, int(R, 0, N - 1)] as const; }, ([x, i]) => { const g = x[i]!; return g >= 59 && g <= 69 && tenth(mean(x)) !== null && tenth((sum(x) - g) / (N - 1)) !== null && tenth((sum(x) - g + g * 10) / N) !== null; });
  const good = xs[i]!, shown = xs.slice(); shown[i] = good * 10;
  const mGood = tenth(mean(xs))!;
  return numItem({
    id: `typoFix-${n}`, family: 'typoFix',
    prompt: `Heights (inches) of ${N} ninth graders: ${listH(shown)}. The value ${good * 10} is a typo for ${good}. Fix it. What is the mean height, to the nearest tenth?`,
    board: listT(shown), unit: 'inches', picture: { list: { name: 'Height (inches)', data: shown } },
    solution: [`Fixed list: ${listH(xs)}. Total ${sum(xs)}.`, `Mean: ${sum(xs)} ÷ ${N} ≈ <b class="s">${fmt(mGood)}</b> inches.`],
  }, mGood, 'Yes: fixed, then recomputed.', [
    [tenth(mean(shown))!, MC.trustCalc, `That mean still contains ${good * 10}. Replace it with ${good} first.`],
    [tenth((sum(xs) - good) / (N - 1))!, MC.alwaysDelete, `That deletes the student. The height is known: it is ${good}. Fix it and keep all ${N}.`],
  ], `Replace ${good * 10} by ${good}, add all ${N} heights, divide by ${N}.`);
};
