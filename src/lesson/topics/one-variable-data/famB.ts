// famB.ts: stage 2 families (building displays, quartiles and fences, modified box plots, choosing and reading
// displays, entering data, SD from technology, weighted averages, summaries of one and two data sets). Pure: no DOM.
import { type Ctx, type Gen, type Opt, type PCand, groupsOf, manyOf, MC, RULE, CTX, H, axisOf, choice, ctxPick, int, listH, listT, numItem, pairItem, phrase, pick, pl, shuffle, tenth, until, val, withU, roundD, un } from './common';
import type { DMark, DPanel } from './DataPlot';
import { binCounts, five, fences, halves, iqrOf, isOutlier, mean, median, range, sdPop, sdSample, sorted, stacks, sum, whiskers, r9, fmt, fmtT, weightedMean } from './stats';

const dotP = (key: string, data: number[], label?: string): DPanel => ({ key, kind: 'dot', data, label });
const vline = (key: string, x: number, label: string, col: DMark['col'] = 'link', panels?: string[]): DMark => ({ kind: 'vline', key, x, label, col, panels });
const ints = (R: () => number, N: number, lo: number, hi: number) => Array.from({ length: N }, () => int(R, lo, hi));

// ===================== supplied-scale-displays / histogram-intervals =====================
export const binCount: Gen = (R, n, sg) => {
  const edges = sg === 'histogram-intervals';
  const c = ctxPick(R, ['test', 'commute', 'height', 'reaction']);
  const w = c.id === 'reaction' ? 20 : c.id === 'height' ? 2 : c.id === 'test' ? 10 : 5;
  const nB = int(R, 4, 6), start = c.id === 'test' ? 100 - nB * w : c.id === 'reaction' ? 200 : c.id === 'height' ? 60 : 5;
  const N = edges ? int(R, 12, 24) : int(R, 10, 18), k = int(R, 1, nB - 2);
  const a = start + k * w, b = a + w;
  const mk = () => {
    const xs = Array.from({ length: N }, () => { let v: number; do v = int(R, start, start + nB * w - 1); while (v % w === start % w); return v; });
    if (edges) { xs[0] = a; xs[1] = b; if (R() < 0.6) xs[2] = a; }
    else { const inBin = xs.filter(v => v > a && v < b); if (inBin.length) xs[xs.length - 1] = inBin[0]!; }
    return shuffle(R, xs);
  };
  const xs = until(mk, x => { const cnt = x.filter(v => v >= a && v < b).length; return cnt >= 2 && new Set(x.filter(v => v >= a && v < b)).size < cnt; });
  const cnt = xs.filter(v => v >= a && v < b).length, distinct = new Set(xs.filter(v => v >= a && v < b)).size;
  const withUpper = xs.filter(v => v >= a && v <= b).length, upperConv = xs.filter(v => v > a && v <= b).length;
  const axis = { min: start, max: start + nB * w, step: w, name: c.axis };
  return numItem({
    id: `binCount-${n}`, family: 'binCount',
    prompt: `Make a histogram of ${phrase(c, N)} with bins of ${w}, starting at ${start}. ${edges ? RULE.bins + ' ' : ''}How tall is the bar for ${a} to ${b}?`,
    board: listT(xs), unit: c.id === 'test' || c.id === 'commute' ? 'students' : c.id === 'height' ? '9th graders' : 'players',
    picture: { list: { name: c.axis, data: xs }, plot: { axis, panels: [{ key: 'A', kind: 'hist', data: sorted(xs), bins: { start, width: w } }], empty: ['A'], marks: [{ kind: 'band', key: 'bin', a, b, col: 'pick', label: `${a} to ${b}` }] } },
    solution: [
      `Values from ${a} up to ${b}${edges ? ` (${a} counts, ${b} goes in the next bin)` : ''}: ${sorted(xs.filter(v => v >= a && v < b)).join(', ')}.`,
      `Every value counts, repeats too: the bar is <b class="s">${cnt}</b> tall.`,
    ],
  }, cnt, `Yes: ${cnt} values fall from ${a} up to ${b}.`, [
    [distinct, MC.repeatedOnce, 'Repeated values each count: a value that appears twice adds 2 to the bar.'],
    ...(edges ? [[withUpper, MC.bothBins, `${b} sits on the edge. It belongs to the bin it starts, ${b} to ${b + w}, not to this one.`] as [number, string, string], [upperConv, MC.bothBins, `${a} is the lower end of this bin, so it counts here; ${b} goes in the next bin.`] as [number, string, string]] : []),
  ], `Go through the list and count every value from ${a} up to (not including) ${b}.`);
};

export const dotStack: Gen = (R, n) => {
  const c = ctxPick(R, ['quiz', 'points', 'battery', 'commute']);
  const N = int(R, 8, 15), lo = c.lo + int(R, 0, 4);
  const xs = until(() => ints(R, N, lo, lo + int(R, 6, 10)), x => { const st = stacks(x), top = Math.max(...st.values()); return top >= 3 && top <= 5 && [...st.values()].filter(k => k === top).length === 1; });
  const st = stacks(xs), top = Math.max(...st.values()), mode = [...st.entries()].find(([, k]) => k === top)![0];
  const s = sorted(xs);
  return pairItem({
    id: `dotStack-${n}`, family: 'dotStack',
    prompt: `Make a dot plot of ${phrase(c, N)}: one dot per value, stacked. Which value gets the tallest stack, and how many dots are in it?`,
    board: listT(shuffle(R, xs.slice())), picture: { list: { name: c.axis, data: xs }, plot: { axis: axisOf(c, s[0]!, s[N - 1]!, { step: 1, ticks: [8, 16] }), panels: [dotP('A', s)], empty: ['A'] } },
    solution: [`Ordered: ${listH(s)}.`, `The value ${mode} appears ${top} times, more than any other value: a stack of <b class="s">${mode}</b> with <b class="s">${top}</b> dots.`],
  }, mode, top, { lead: 'Tallest stack at', op: 'with', tail: 'dots' }, 'Yes: one dot for every value, repeats stacked.', [
    [mode, 1, MC.repeatedOnce, `Every copy of ${mode} gets its own dot: they stack up.`],
  ], 'Order the list and count how often each value appears.');
};

// ===================== dotplot-scale =====================
export const scaleChoice: Gen = (R, n) => {
  const c = pick(R, [CTX.temp!, CTX.sleep!, CTX.sprint!, CTX.apple!]);
  const N = int(R, 8, 12);
  const xs = until(() => Array.from({ length: N }, () => val(R, c.lo, c.hi - (c.id === 'temp' ? 6 : 1.5), c.dec)), x => new Set(x).size === N && range(x) > (c.id === 'temp' ? 15 : 2.5) && (c.id !== 'temp' || Math.min(...x) < -2));
  const s = sorted(xs), ax = axisOf(c, s[0]!, s[N - 1]!, { ticks: [6, 12], step: c.id === 'temp' ? 5 : 0.5 });
  const t = (v: number) => fmt(v);
  const right = `${t(ax.min)} to ${t(ax.max)}, a tick every ${t(ax.step)}`;
  const cut = r9(Math.floor(s[0]! / ax.step + 1e-9) * ax.step + ax.step);   // the first tick above the smallest value: it falls off
  const firsts = s.slice(0, 5).map(t).join(', ');
  const k = Math.round((ax.max - ax.min) / ax.step), uneven = [ax.min, r9(ax.min + ax.step), r9(ax.min + 3 * ax.step), r9(ax.min + 4 * ax.step), r9(ax.min + 7 * ax.step), ax.max].filter(v => v <= ax.max);
  const opts: Opt[] = [
    { t: right, ok: true, say: 'Yes: equal steps, and every value fits between the ends.' },
    { t: `A tick at each data value, evenly spaced: ${firsts}, …`, mc: MC.equalTicks, say: 'Equal spacing must mean equal differences. Data values are not evenly apart, so they cannot sit on evenly spaced ticks.' },
    { t: `${t(cut)} to ${t(ax.max)}, a tick every ${t(ax.step)}`, say: `${t(s[0]!)} is below ${t(cut)}: it would fall off the scale.` },
    { t: `Ticks at ${uneven.map(t).join(', ')}`, say: 'The steps between those ticks are not equal, so distances on the plot would lie.' },
  ];
  if (k < 4) throw new Error('scaleChoice: short axis');
  return choice(R, {
    id: `scaleChoice-${n}`, family: 'scaleChoice',
    prompt: `You want a dot plot of ${phrase(c, N)}: ${listH(xs)}. Which number line works?`,
    board: listT(xs), picture: { list: { name: c.axis, data: xs } },
    solution: [`The values run from ${t(s[0]!)} to ${t(s[N - 1]!)}.`, `A scale needs equal steps and room for every value: ${right}.`],
  }, opts);
};

export const scaleRead: Gen = (R, n) => {
  const c = pick(R, [CTX.temp!, CTX.sleep!, CTX.sprint!]);
  const step = c.id === 'temp' ? 2 : c.id === 'sleep' ? 0.5 : 0.2, every = c.id === 'temp' ? 2 : c.id === 'sleep' ? 2 : 5;
  const N = int(R, 8, 13);
  const grid = (v: number) => roundD(Math.round(v / step) * step, 1);
  const xs = until(() => Array.from({ length: N }, () => grid(val(R, c.lo, c.hi - (c.id === 'temp' ? 8 : 1), 1))), x => range(x) >= step * 8 && range(x) <= step * 22 && Math.max(...stacks(x).values()) <= 4 && (c.id !== 'temp' || Math.min(...x) < 0));
  const s = sorted(xs);
  const cand = s.map((v, i) => [v, i] as const).filter(([v]) => (((Math.round(v / step) % every) + every) % every) !== 0 && (c.id !== 'temp' || v < 0 || R() < 0.3));
  if (!cand.length) return scaleRead(R, n + 977, undefined);
  const [v] = pick(R, cand), idx = s.indexOf(v);
  const lo = r9(Math.floor(Math.min(...s) / (step * every)) * step * every), hi = r9(Math.ceil(Math.max(...s) / (step * every)) * step * every);
  const axis = { min: lo === s[0] ? r9(lo - step * every) : lo, max: hi === s[N - 1] ? r9(hi + step * every) : hi, step, name: c.axis, every };
  const below = r9(Math.floor(v / (step * every)) * step * every);
  return numItem({
    id: `scaleRead-${n}`, family: 'scaleRead',
    prompt: `The dot plot shows ${phrase(c, N)}. Only some ticks are labeled. What value does the colored dot show?`,
    board: `\\text{tick} = ${fmtT(step)}`, unit: c.unit,
    picture: { plot: { axis, panels: [dotP('A', s)], hot: { panel: 'A', idx: [idx] } } },
    solution: [`The ticks go up by ${fmt(step)}: there are ${every - 1} unlabeled ticks between labels.`, `Count up from ${fmt(below)}: the dot is at <b class="s">${fmt(v)}</b>.`],
  }, v, 'Yes.', [[below, undefined, `${fmt(below)} is the label to the left. Count the ticks from there: each one is ${fmt(step)}.`], [-v, undefined, 'Check the sign: is the dot left or right of 0?']], `Find the labels on each side and count the ticks: each is ${fmt(step)}.`);
};

// ===================== histogram-intervals / bin width =====================
export const boundaryBin: Gen = (R, n) => {
  const dec = R() < 0.35;
  const c = dec ? CTX.sleep! : ctxPick(R, ['test', 'commute', 'height']);
  const w = dec ? 0.5 : c.id === 'test' ? 10 : c.id === 'height' ? 2 : 5;
  const start = dec ? 5 : c.id === 'test' ? 50 : c.id === 'height' ? 60 : 5, nB = dec ? 8 : 5;
  const e = r9(start + int(R, 1, nB - 1) * w), N = int(R, 12, 20);
  const xs = until(() => [e, ...Array.from({ length: N - 1 }, () => roundD(start + R() * nB * w * 0.999, dec ? 1 : 0))], x => x.every(v => v < start + nB * w));
  const lowT = `The ${fmt(r9(e - w))} to ${fmt(e)} bar`, highT = `The ${fmt(e)} to ${fmt(r9(e + w))} bar`;
  const opts: Opt[] = [
    { t: highT, ok: true, say: `Yes: ${fmt(e)} is the lower end of that bin, so it counts there.` },
    { t: lowT, say: `${fmt(e)} is the upper end of that bin, and upper ends are left out.` },
    { t: 'Both bars', mc: MC.bothBins, say: 'A value is counted once: the rule puts it in exactly one bin.' },
    { t: 'Neither bar', say: 'Every value must be in some bar. The rule says which one.' },
  ];
  return choice(R, {
    id: `boundaryBin-${n}`, family: 'boundaryBin',
    prompt: `A histogram of ${phrase(c, N)} uses bins of ${fmt(w)} starting at ${fmt(start)}. ${RULE.bins} Which bar does the value ${fmt(e)} go in?`,
    board: `\\text{value: } ${fmtT(e)}`,
    picture: { plot: { axis: { min: start, max: r9(start + nB * w), step: w, name: c.axis, ...(dec ? { every: 2 } : {}) }, panels: [{ key: 'A', kind: 'hist', data: sorted(xs), bins: { start, width: w } }], marks: [vline('v', e, fmt(e), 'pick')] } },
    solution: [`${fmt(e)} sits on the edge between two bins.`, `Lower end in, upper end out: it goes in the ${fmt(e)} to ${fmt(r9(e + w))} bin.`],
  }, opts);
};

export const binWidth: Gen = (R, n) => {
  const N1 = int(R, 10, 14), N2 = int(R, 10, 14), N3 = int(R, 3, 5);
  const mk = () => sorted([...ints(R, N1, 6, 14), ...ints(R, N2, 21, 29), ...Array.from({ length: N3 }, () => 31 + Math.floor(R() * R() * 14))]);
  const narrow = 5, wide = 25, start = 5;
  const peaks = (cs: number[]) => cs.filter((k, i) => k > 0 && (i === 0 || k > cs[i - 1]!) && (i === cs.length - 1 || k >= cs[i + 1]!)).length;
  const data = until(mk, d => { const cn = binCounts(d, start, narrow, 10), cw = binCounts(d, start, wide, 2); return peaks(cn) === 2 && cn[2]! <= 1 && peaks(cw) === 1 && cw[0]! > cw[1]! + 4; });
  const N = data.length, statement = R() < 0.4;
  const axis = { min: 5, max: 55, step: 5, name: 'Commute (minutes)' };
  const panels: DPanel[] = [{ key: 'W', kind: 'hist', data, bins: { start, width: wide }, label: `Bins of ${wide}` }, { key: 'N', kind: 'hist', data, bins: { start, width: narrow }, label: `Bins of ${narrow}` }];
  if (R() < 0.5) panels.reverse();
  const opts: Opt[] = statement ? [
    { t: 'Both show the same data; only the bins differ.', ok: true, say: `Yes: the same ${N} commutes, grouped two ways.` },
    { t: `The bins of ${wide} histogram has fewer students.`, mc: MC.layout, say: `Both bars add up to ${N}: wider bins hold more students each, but nobody is lost.` },
    { t: 'The two histograms must come from different data.', mc: MC.layout, say: 'Regrouping the same values into other bins changes the picture, not the data.' },
    { t: `The bins of ${narrow} histogram has a larger median.`, mc: MC.layout, say: 'The median comes from the data, and the data did not change.' },
  ] : [
    { t: `Bins of ${narrow}`, ok: true, say: `Yes: with bins of ${narrow} you see the walkers around 10 minutes and the bus riders around 25, with a dip between.` },
    { t: `Bins of ${wide}`, mc: MC.hidden, say: `Bins of ${wide} lump both groups into one bar: the two peaks disappear.` },
    { t: 'Both show two peaks', say: `With bins of ${wide}, both groups land in the same bar.` },
    { t: 'Neither shows two peaks', say: `Look at the bins of ${narrow}: two humps with a gap between them.` },
  ];
  return choice(R, {
    id: `binWidth-${n}`, family: 'binWidth',
    prompt: statement ? `Both histograms show the commute times of the same ${N} students (minutes), one with bins of ${wide} and one with bins of ${narrow}. Which statement is true?` : `Some students walk to school and some take a long bus ride. Both histograms show the same ${N} commute times (minutes). Which bin width shows the two groups as two peaks?`,
    board: `n = ${N}`, picture: { plot: { axis, panels } },
    solution: statement ? ['Changing the bin width regroups the same values.', `Each histogram still holds all ${N} students.`] : [`Bins of ${wide}: one tall bar for 5 to 30 minutes. One peak.`, `Bins of ${narrow}: a hump near 10, a dip at 15 to 20, a hump near 25. Two peaks.`],
  }, opts, !statement);
};

// ===================== five-number-summary / IQR =====================
function quartileData(R: () => number): { c: Ctx; xs: number[] } {
  const kind = pick(R, ['int', 'int', 'dec', 'neg']);
  const c = kind === 'dec' ? pick(R, [CTX.sleep!, CTX.sprint!]) : kind === 'neg' ? CTX.temp! : ctxPick(R, ['test', 'commute', 'points', 'height']);
  const N = int(R, 7, 12);
  const xs = until(() => Array.from({ length: N }, () => val(R, c.lo, c.hi, c.dec)), x => {
    const f = five(x), sr = [r9(f.min + range(x) / 4), r9(f.min + 3 * range(x) / 4)];
    return (kind !== 'neg' || (f.q1 < 0 && f.q3 > 0)) && Math.abs(sr[0]! - f.q1) > 0.01 && Math.abs(sr[1]! - f.q3) > 0.01 && iqrOf(f) > 0;
  });
  return { c, xs };
}
export const quartiles: Gen = (R, n) => {
  const { c, xs } = quartileData(R), N = xs.length, s = sorted(xs), f = five(xs), [lo, hi] = halves(xs);
  const sr: PCand = [r9(f.min + range(xs) / 4), r9(f.min + 3 * range(xs) / 4), MC.splitRange, 'Quartiles split the COUNT of values into quarters, not the distance from min to max.'];
  const u0 = xs.slice(0, Math.floor(N / 2)), u1 = xs.slice(N - Math.floor(N / 2));
  const cands: PCand[] = [sr, [median(u0), median(u1), MC.noSort, 'Order the list first, then split it into halves.']];
  if (N % 2) { const h = (N + 1) / 2; cands.push([median(s.slice(0, h)), median(s.slice(h - 1)), undefined, 'For an odd count, leave the median out of both halves.']); }
  return pairItem({
    id: `quartiles-${n}`, family: 'quartiles',
    prompt: `Find Q1 and Q3 of ${phrase(c, N)}: ${listH(xs)}. ${RULE.quart}`,
    board: listT(xs), unit: '', picture: { list: { name: c.axis, data: xs } },
    solution: [`Ordered: ${listH(s)}.${N % 2 ? ` The median, ${fmt(f.med)}, is left out.` : ''}`, `Lower half ${listH(lo)}: Q1 = <b class="s">${fmt(f.q1)}</b>.`, `Upper half ${listH(hi)}: Q3 = <b class="s">${fmt(f.q3)}</b>.`],
  }, f.q1, f.q3, { lead: 'Q1 =', op: ', Q3 =' }, 'Yes: the medians of the two halves.', cands, 'Order the list, split it into a lower and an upper half, and find the median of each.');
};

export const iqr: Gen = (R, n) => {
  const c = ctxPick(R, ['quiz', 'points', 'commute', 'battery', 'height']);
  const N = int(R, 9, 15), lo = c.lo + int(R, 0, 3);
  const xs = sorted(until(() => ints(R, N, lo, lo + int(R, 9, 14)), x => { const f = five(x), q = iqrOf(f); return q > 0 && Math.abs(q - range(x)) > 0.5 && Math.abs(q - x.filter(v => v >= f.q1 && v <= f.q3).length) > 0.5 && Math.max(...stacks(x).values()) <= 4; }));
  const f = five(xs), q = iqrOf(f), [h0, h1] = halves(xs);
  return numItem({
    id: `iqr-${n}`, family: 'iqr',
    prompt: `The dot plot shows ${phrase(c, N)}. Find the IQR. ${RULE.quart}`,
    board: `n = ${N}\\qquad \\text{IQR} = Q_3 - Q_1 = \\,?`, unit: c.unit,
    picture: { plot: { axis: axisOf(c, xs[0]!, xs[N - 1]!, { step: 1, ticks: [8, 18] }), panels: [dotP('A', xs)], solveMarks: [vline('q1', f.q1, `Q1 ${fmt(f.q1)}`, 'second'), vline('q3', f.q3, `Q3 ${fmt(f.q3)}`, 'second')] } },
    solution: [`Lower half (${h0.length} dots): Q1 = ${fmt(f.q1)}. Upper half: Q3 = ${fmt(f.q3)}.`, `IQR = ${fmt(f.q3)} − ${fmt(f.q1)} = <b class="s">${fmt(q)}</b> ${c.unit}.`],
  }, q, 'Yes: the spread of the middle half.', [
    [range(xs), MC.rangeSpread, 'That is the range (max − min). The IQR uses the quartiles: Q3 − Q1.'],
    [xs.filter(v => v >= f.q1 && v <= f.q3).length, MC.iqrCount, 'That counts the dots between the quartiles. The IQR is a distance on the axis: Q3 − Q1.'],
  ], 'Find Q1 and Q3 (medians of the halves), then subtract.');
};

// ===================== outlier-fence-rule =====================
export const fencesFam: Gen = (R, n) => {
  const kind = pick(R, ['int', 'int', 'dec', 'negfence']);
  const c = kind === 'dec' ? pick(R, [CTX.sleep!, CTX.sprint!]) : ctxPick(R, kind === 'negfence' ? ['commute', 'points'] : ['commute', 'points', 'battery', 'test']);
  const N = int(R, 9, 15);
  const xs = until(() => Array.from({ length: N }, () => val(R, kind === 'negfence' ? c.lo : c.lo + (c.hi - c.lo) * 0.2, kind === 'negfence' ? c.lo + (c.hi - c.lo) * 0.6 : c.hi * 0.9, c.dec)), x => {
    const f = five(x), F = fences(f);
    return iqrOf(f) > 0 && (kind !== 'negfence' || F.lo < 0) && (kind !== 'dec' || !Number.isInteger(f.q1 * 2));
  });
  const f = five(xs), q = iqrOf(f), F = fences(f);
  return pairItem({
    id: `fences-${n}`, family: 'fences',
    prompt: `For ${phrase(c, N)}, Q1 = ${fmt(f.q1)} and Q3 = ${fmt(f.q3)}. ${RULE.fence} Find the lower fence and the upper fence.`,
    board: `Q_1 = ${fmtT(f.q1)}\\qquad Q_3 = ${fmtT(f.q3)}`, unit: '',
    picture: { plot: { axis: axisOf(c, Math.min(f.min, F.lo), Math.max(f.max, F.hi), { ticks: [6, 16] }), panels: [{ key: 'B', kind: 'box', data: xs }], solveMarks: [vline('flo', F.lo, `fence ${fmt(F.lo)}`, 'pick'), vline('fhi', F.hi, `fence ${fmt(F.hi)}`, 'pick')] } },
    solution: [`IQR = ${fmt(f.q3)} − ${fmt(f.q1)} = ${fmt(q)}; 1.5 × ${fmt(q)} = ${fmt(F.step)}.`, `Lower fence: ${fmt(f.q1)} − ${fmt(F.step)} = <b class="s">${fmt(F.lo)}</b>.`, `Upper fence: ${fmt(f.q3)} + ${fmt(F.step)} = <b class="s">${fmt(F.hi)}</b>.${F.lo < 0 && f.min >= 0 ? ' The lower fence is below 0, so no low value can be an outlier.' : ''}`],
  }, F.lo, F.hi, { lead: 'Lower fence', op: ', upper fence' }, 'Yes: 1.5 IQR beyond each quartile.', [
    [r9(f.q1 - q), r9(f.q3 + q), undefined, `Use 1.5 × IQR = ${fmt(F.step)}, not the IQR itself.`],
    [r9(f.min - F.step), r9(f.max + F.step), undefined, 'The fences start from the quartiles, not from the min and max.'],
  ], `IQR = Q3 − Q1. Then go 1.5 × IQR below Q1 and above Q3.`);
};

/** a data set with a chosen outlier case: 'high', 'low', 'none' (an extreme-looking max inside the fence), 'fence' (max exactly on the fence) */
function outlierData(R: () => number, kind: 'high' | 'low' | 'none' | 'fence' | 'both', c: Ctx): number[] {
  const N = int(R, 9, 13), span = c.id === 'test' ? 24 : 10, lo = c.id === 'test' ? 60 : c.lo + 3;
  return until(() => {
    const xs = sorted(ints(R, N, lo, lo + span));
    const f = five(xs), F = fences(f);
    if (kind === 'high') xs[N - 1] = Math.ceil(F.hi) + int(R, 2, 8);
    if (kind === 'low') xs[0] = Math.floor(F.lo) - int(R, 2, 6);
    if (kind === 'both') { xs[N - 1] = Math.ceil(F.hi) + int(R, 2, 6); xs[0] = Math.floor(F.lo) - int(R, 2, 5); }
    if (kind === 'none') xs[N - 1] = Math.floor(F.hi) - int(R, 0, 1);
    if (kind === 'fence') xs[N - 1] = F.hi;
    return sorted(xs);
  }, x => {
    const f = five(x), F = fences(f), out = x.filter(v => isOutlier(v, F));
    const ok = kind === 'high' ? out.length === 1 && out[0] === x[x.length - 1] : kind === 'low' ? out.length === 1 && out[0] === x[0] : kind === 'both' ? out.length === 2 && out[0] === x[0] && out[1] === x[x.length - 1] : out.length === 0;
    const fenceOk = kind !== 'fence' || (Number.isInteger(F.hi) && x[x.length - 1] === F.hi);
    return ok && fenceOk && Number.isInteger(x[x.length - 1]!) && x[0]! >= (c.id === 'temp' ? -30 : 0) && x[x.length - 1]! <= (c.id === 'test' ? 100 : 99) && (kind !== 'none' || x[x.length - 1]! - x[x.length - 2]! >= 3);
  });
}
export const isOutlierFam: Gen = (R, n) => {
  const c = ctxPick(R, ['commute', 'points', 'battery']);
  const kind = pick(R, ['high', 'low', 'none', 'fence', 'both'] as const);
  const xs = outlierData(R, kind, c), N = xs.length, f = five(xs), F = fences(f);
  const lo = xs[0]!, hi = xs[N - 1]!;
  const out = xs.filter(v => isOutlier(v, F));
  const key = (vs: number[]) => vs.join(',');
  const opts: Opt[] = [
    { t: 'None', key: '' },
    { t: `Only ${fmt(hi)}`, key: key([hi]) },
    { t: `Only ${fmt(lo)}`, key: key([lo]) },
    { t: `${fmt(lo)} and ${fmt(hi)}`, key: key([lo, hi]) },
  ].map(o => ({ ...o, ok: o.key === key(out), say: '' }));
  for (const o of opts) {
    o.say = o.ok ? 'Yes: only values strictly beyond a fence are outliers.' : kind === 'fence' && o.key === key([hi]) ? `${fmt(hi)} is exactly on the upper fence. Only values beyond a fence are outliers.` : (kind === 'none' && o.key === key([hi])) ? `${fmt(hi)} is the largest value, but it is inside the upper fence (${fmt(F.hi)}).` : `Compare each end with the fences: ${fmt(F.lo)} and ${fmt(F.hi)}.`;
    if (!o.ok && (o.key === key([hi]) || o.key === key([lo, hi])) && (kind === 'none' || kind === 'fence' || kind === 'low')) o.mc = MC.extreme;
  }
  return choice(R, {
    id: `isOutlier-${n}`, family: 'isOutlier',
    prompt: `Here are ${phrase(c, N)}, in order: ${listH(xs)}. Q1 = ${fmt(f.q1)}, Q3 = ${fmt(f.q3)}. ${RULE.fence} Which values are outliers?`,
    board: `Q_1 = ${fmtT(f.q1)}\\qquad Q_3 = ${fmtT(f.q3)}`,
    picture: { list: { name: c.axis, data: xs }, plot: { axis: axisOf(c, Math.min(lo, F.lo), Math.max(hi, F.hi), { ticks: [6, 16] }), panels: [dotP('A', xs)], solveMarks: [vline('flo', F.lo, `fence ${fmt(F.lo)}`, 'pick'), vline('fhi', F.hi, `fence ${fmt(F.hi)}`, 'pick')] } },
    solution: [`IQR = ${fmt(iqrOf(f))}, 1.5 × IQR = ${fmt(F.step)}. Fences: ${fmt(F.lo)} and ${fmt(F.hi)}.`, out.length ? `Beyond a fence: ${listH(out)}.` : `${fmt(lo)} and ${fmt(hi)} are both inside the fences${kind === 'fence' ? ` (${fmt(hi)} is exactly on one, which does not count)` : ''}.`],
  }, opts, true);
};

// ===================== modified-boxplot =====================
export const whiskerEnd: Gen = (R, n) => {
  const c = ctxPick(R, ['commute', 'points', 'battery']);
  const side = pick(R, ['high', 'low'] as const);
  const xs = outlierData(R, R() < 0.3 ? 'both' : side, c), N = xs.length, f = five(xs), F = fences(f), [w0, w1] = whiskers(xs);
  const end = side === 'high' ? w1 : w0, fence = side === 'high' ? F.hi : F.lo, ext = side === 'high' ? xs[N - 1]! : xs[0]!;
  return numItem({
    id: `whiskerEnd-${n}`, family: 'whiskerEnd',
    prompt: `Here are ${phrase(c, N)}, in order: ${listH(xs)}. Q1 = ${fmt(f.q1)}, Q3 = ${fmt(f.q3)}. ${RULE.fence} In the modified box plot, where does the ${side === 'high' ? 'upper' : 'lower'} whisker end?`,
    board: `Q_1 = ${fmtT(f.q1)}\\qquad Q_3 = ${fmtT(f.q3)}`, unit: c.unit,
    picture: { list: { name: c.axis, data: xs }, plot: { axis: axisOf(c, Math.min(xs[0]!, F.lo), Math.max(xs[N - 1]!, F.hi), { ticks: [6, 16] }), panels: [dotP('A', xs), { key: 'B', kind: 'box', data: xs, modified: true }], empty: ['B'], solveMarks: [vline('f', fence, `fence ${fmt(fence)}`, 'pick')] } },
    solution: [`The ${side === 'high' ? 'upper' : 'lower'} fence is ${fmt(f[side === 'high' ? 'q3' : 'q1'])} ${side === 'high' ? '+' : '−'} 1.5 × ${fmt(iqrOf(f))} = ${fmt(fence)}; ${fmt(ext)} is beyond it, so it is plotted as a point.`, `The whisker ends at the most extreme value that is not an outlier: <b class="s">${fmt(end)}</b>.`],
  }, end, 'Yes: the whisker stops at the last value inside the fence.', [
    [fence, MC.atFences, 'The fence is a cutoff, not a data value. The whisker ends at an actual value: the most extreme one inside the fence.'],
    [ext, undefined, `${fmt(ext)} is an outlier: it is plotted as its own point, and the whisker stops before it.`],
  ], 'Find the fence, then the most extreme data value on the inside of it.');
};

export const modPlotPick: Gen = (R, n) => {
  const c = ctxPick(R, ['commute', 'points', 'battery', 'test']);
  const xs = outlierData(R, pick(R, ['high', 'both', 'low'] as const), c), N = xs.length, f = five(xs), F = fences(f), [w0, w1] = whiskers(xs);
  const outs = xs.filter(v => isOutlier(v, F));
  const lowOut = outs.some(v => v < f.q1), highOut = outs.some(v => v > f.q3);
  if ((highOut && F.hi === w1) || (lowOut && F.lo === w0)) return modPlotPick(R, n + 1009, undefined);   // the wrong plot would equal the right one
  const plots = [
    { id: 'right', five: { ...f, min: w0, max: w1 }, outs },
    { id: 'standard', five: f, outs: [] as number[] },
    { id: 'fence', five: { ...f, min: lowOut ? F.lo : w0, max: highOut ? F.hi : w1 }, outs },
  ];
  const ord = shuffle(R, [0, 1, 2]), L = ['A', 'B', 'C'];
  const panels: DPanel[] = ord.map((k, i) => ({ key: L[i]!, kind: 'box', five: plots[k]!.five, outs: plots[k]!.outs, label: `Plot ${L[i]}` }));
  const opts: Opt[] = ord.map((k, i) => ({
    t: `Plot ${L[i]}`, ok: plots[k]!.id === 'right',
    mc: plots[k]!.id === 'fence' ? MC.atFences : undefined,
    say: plots[k]!.id === 'right' ? 'Yes: the whiskers stop at the last values inside the fences, and the outliers are points.' : plots[k]!.id === 'fence' ? 'Those whiskers run to the fences. A fence is a cutoff, not a data value: the whisker stops at a real value.' : 'That is the standard box plot: its whiskers run to the min and max, so the outliers are hidden in the whiskers.',
  }));
  return choice(R, {
    id: `modPlotPick-${n}`, family: 'modPlotPick',
    prompt: `Here are ${phrase(c, N)}, in order: ${listH(xs)}. Q1 = ${fmt(f.q1)}, Q3 = ${fmt(f.q3)}. ${RULE.fence} Which plot is the modified box plot of these data?`,
    board: `\\text{fences: } ${fmtT(F.lo)},\\ ${fmtT(F.hi)}`,
    picture: { list: { name: c.axis, data: xs }, plot: { axis: axisOf(c, Math.min(xs[0]!, F.lo), Math.max(xs[N - 1]!, F.hi), { ticks: [6, 16] }), panels } },
    solution: [`Fences: ${fmt(F.lo)} and ${fmt(F.hi)}. Outliers: ${listH(outs)}.`, `Whiskers end at the last values inside: ${fmt(w0)} and ${fmt(w1)}; outliers are points.`],
  }, opts, true);
};

// ===================== choose-display / data-structure-displays =====================
const DISPLAYS = ['Dot plot', 'Histogram', 'Box plots on one scale', 'Pie chart'];
const DISPLAY_CASES = [
  { s: 'the commute times of {big} students, to see the shape of the distribution', right: 1, why: 'With {big} values, single dots pile up into an unreadable mass; a histogram groups them and shows the shape.' },
  { s: 'the heights of the {small} players on a basketball team, to see every single value', right: 0, why: 'A small data set: a dot plot keeps every value visible.' },
  { s: 'the test scores of {k} classes of about 30 students, to compare their medians and spreads side by side', right: 2, why: 'Box plots on one scale line up the medians and IQRs of the groups.' },
  { s: 'the daily step counts of {big} people, to see whether there are two peaks (runners and everyone else)', right: 1, why: 'A box plot hides peaks; a histogram with good bins shows them.' },
  { s: 'the resting heart rates of {small} students, to spot any gaps or repeated values', right: 0, why: 'With {small} values, a dot plot shows every value, every gap and every repeat.' },
  { s: 'the commute times of students at {k} schools, to compare the schools quickly', right: 2, why: 'Several groups: box plots on one scale compare their centers and spreads at a glance.' },
];
export const displayChoice: Gen = (R, n) => {
  const c0 = pick(R, DISPLAY_CASES), big = pick(R, [300, 400, 500, 600, 800, 1200]), small = int(R, 10, 16), k = int(R, 3, 5);
  const fill = (t: string) => t.replace(/\{big\}/g, String(big)).replace(/\{small\}/g, String(small)).replace(/\{k\}/g, ['', '', '', 'three', 'four', 'five'][k]!);
  const cs = { ...c0, s: fill(c0.s), why: fill(c0.why) };
  const opts: Opt[] = DISPLAYS.map((t, i) => ({
    t, ok: i === cs.right,
    mc: i === cs.right ? undefined : i === 3 ? MC.everyType : (cs.right === 1 && i === 2 && /peaks/.test(cs.s)) ? MC.hidden : MC.samePurpose,
    say: i === cs.right ? cs.why : i === 3 ? 'A pie chart shows parts of a whole for categories, not numerical measurements.' : cs.why,
  }));
  return choice(R, {
    id: `displayChoice-${n}`, family: 'displayChoice',
    prompt: `Which display fits best: ${cs.s}?`,
    board: `\\text{dot plot, histogram or box plot?}`, solution: [cs.why],
  }, opts, true);
};

const TYPES = ['Numerical, one variable', 'Numerical, two variables', 'Categorical, one variable', 'Categorical, two variables'];
const TYPE_CASES = [
  { s: 'the zip code of each of {n} customers', right: 2, mc: [MC.codes, 'A zip code is a number used as a name: averaging zip codes means nothing. It is categorical.'] },
  { s: 'the jersey number of each of the {n} players in a league', right: 2, mc: [MC.codes, 'A jersey number is a label, not an amount. It is categorical.'] },
  { s: 'the height and the arm span of each of {n} students', right: 1 },
  { s: 'the favorite sport of each of {n} students', right: 2 },
  { s: 'the grade level and the preferred lunch of each of {n} students', right: 3, mc: [MC.twoAsOne, 'Two things are recorded about each student: grade level and lunch. That is two categorical variables.'] },
  { s: 'the minutes of homework each of {n} students did last night', right: 0 },
  { s: 'the hours studied and the test score of each of {n} students', right: 1 },
  { s: 'the phone brand and the color of each of {n} phones', right: 3, mc: [MC.twoAsOne, 'Brand and color are two separate categorical variables.'] },
];
export const dataType: Gen = (R, n) => {
  const c0 = pick(R, TYPE_CASES), cs = { ...c0, s: c0.s.replace('{n}', String(int(R, 20, 150))) };
  const why = ['amounts you can measure, one per case', 'two measurements per case', 'labels or groups, one per case', 'two labels per case'][cs.right]!;
  const opts: Opt[] = TYPES.map((t, i) => {
    const mcHit = cs.mc && ((cs.mc[0] === MC.codes && i === 0) || (cs.mc[0] === MC.twoAsOne && i === 2));
    return { t, ok: i === cs.right, mc: mcHit ? cs.mc![0] : undefined, say: i === cs.right ? `Yes: ${why}.` : mcHit ? cs.mc![1]! : `Ask two things: is it an amount (numerical) or a label (categorical), and how many things are recorded per case?` };
  });
  return choice(R, {
    id: `dataType-${n}`, family: 'dataType',
    prompt: `A study records ${cs.s}. What kind of data is this?`,
    board: `\\text{numerical or categorical?}`, solution: [`It records ${why}.`],
  }, opts, true);
};

export const stemLeaf: Gen = (R, n) => {
  const c = ctxPick(R, ['commute', 'test', 'points']);
  const N = int(R, 10, 16), lo = c.id === 'test' ? 50 : 10, hi = c.id === 'test' ? 99 : c.id === 'points' ? 34 : 45;
  const xs = sorted(until(() => ints(R, N, lo, hi), x => new Set(x.map(v => Math.floor(v / 10))).size >= 3 && Math.floor(Math.max(...x) / 10) - Math.floor(Math.min(...x) / 10) <= 4));
  const stems: number[] = [];
  for (let s = Math.floor(xs[0]! / 10); s <= Math.floor(xs[N - 1]! / 10); s++) stems.push(s);
  const leaves = stems.map(s => xs.filter(v => Math.floor(v / 10) === s).map(v => v % 10));
  const ask = pick(R, ['median', 'max', 'count']);
  const s0 = pick(R, stems.filter((_, i) => leaves[i]!.length > 0));
  const ex = xs[Math.floor(N / 3)]!;
  const keyT = `${Math.floor(ex / 10)}\\,|\\,${ex % 10} = ${ex}`;
  const arr = `\\begin{array}{r|l} ${stems.map((s, i) => `${s} & ${leaves[i]!.join('\\ ')}`).join(' \\\\ ')} \\end{array}`;
  const m = median(xs), mx = xs[N - 1]!, cnt = xs.filter(v => Math.floor(v / 10) === s0).length;
  const base = { id: `stemLeaf-${n}`, family: 'stemLeaf', board: `${arr} \\qquad \\text{Key: } ${keyT}\\ \\text{${c.unit}}`, unit: ask === 'count' ? (c.id === 'points' ? 'games' : 'students') : c.unit, picture: { stem: { stems, leaves, key: `${Math.floor(ex / 10)} | ${ex % 10} = ${ex} ${c.unit}` } } };
  if (ask === 'count') return numItem({ ...base, prompt: `The stem-and-leaf plot shows ${phrase(c, N)}. How many values are in the ${s0}0s?`, solution: [`The stem ${s0} holds the values from ${s0}0 to ${s0}9.`, `Its leaves: ${leaves[stems.indexOf(s0)]!.join(', ')}: <b class="s">${cnt}</b> values.`] }, cnt, 'Yes: one leaf per value.', [[new Set(leaves[stems.indexOf(s0)]).size, MC.repeatedOnce, 'Repeated leaves are separate values: count every leaf.']], `Count the leaves on the ${s0} stem.`);
  if (ask === 'max') return numItem({ ...base, prompt: `The stem-and-leaf plot shows ${phrase(c, N)}. What is the largest value?`, solution: [`The last stem is ${Math.floor(mx / 10)}; its last leaf is ${mx % 10}.`, `Read it with the key: <b class="s">${mx}</b>.`] }, mx, 'Yes.', [[Math.floor(mx / 10) + (mx % 10), MC.addStemLeaf, `The stem and leaf are digits, not numbers to add: ${Math.floor(mx / 10)} | ${mx % 10} means ${mx}.`]], 'Read the bottom row with the key: stem = tens digit, leaf = ones digit.');
  return numItem({ ...base, prompt: `The stem-and-leaf plot shows ${phrase(c, N)}. What is the median?`, solution: [`The leaves are already in order: ${N} values.`, `${N % 2 ? `The ${(N + 1) / 2}th value` : `The mean of the ${N / 2}th and ${N / 2 + 1}th values`}: <b class="s">${fmt(m)}</b>.`] }, m, 'Yes: the plot keeps the values in order.', [[mx, undefined, 'That is the largest value. Count in to the middle.']], 'Count the leaves in from both ends to the middle; read the value with the key.');
};

// ===================== data-list-entry / sd-technology =====================
export const entryCheck: Gen = (R, n) => {
  const v = pick(R, ['count', 'mean', 'header']);
  if (v === 'count') {
    const N = int(R, 10, 16);
    return choice(R, {
      id: `entryCheck-${n}`, family: 'entryCheck', prompt: `You enter ${N} quiz scores into list L1. 1-Var Stats shows n = ${N + 1}. What should you do?`,
      board: `n = ${N + 1}`, solution: [`The source has ${N} scores, the list has ${N + 1}: something extra is in it.`],
    }, [
      { t: `Check the list against the ${N} scores: an extra value (maybe left from an old list) is in it.`, ok: true, say: 'Yes: n must match the source before any result can be trusted.' },
      { t: `Use the results: n counts the scores plus the mean, so ${N + 1} is fine.`, mc: MC.leftover, say: 'n counts the values in the list, nothing else.' },
      { t: 'Use the results: the calculator does the math, so it is right.', mc: MC.trustCalc, say: 'The calculator computes exactly what you typed. A wrong list gives wrong results.' },
      { t: 'Use the results: one extra value cannot change the mean.', mc: MC.leftover, say: 'One extra value changes the total and the count, so the mean usually changes.' },
    ]);
  }
  if (v === 'mean') {
    const N = int(R, 8, 14), lo = int(R, 58, 62), hi = lo + int(R, 10, 14), bad = int(R, 105, 140);
    return choice(R, {
      id: `entryCheck-${n}`, family: 'entryCheck', prompt: `The heights of ${N} students are all between ${lo} and ${hi} inches. After you enter them, 1-Var Stats shows a mean of ${bad} inches. What does that tell you?`,
      board: `\\bar{x} = ${bad}`, solution: [`A mean must lie between the smallest and largest value: ${lo} to ${hi}.`, `${bad} is impossible, so a value was mistyped.`],
    }, [
      { t: `A value was mistyped (for example 610 instead of 61): find it and fix it.`, ok: true, say: `Yes: a mean of ${bad} cannot come from values between ${lo} and ${hi}.` },
      { t: `The mean is ${bad} inches: the calculator is right.`, mc: MC.trustCalc, say: 'A mean always lies between the smallest and the largest value. Check the entries.' },
      { t: 'Some students must be very tall.', say: `All the heights are between ${lo} and ${hi} inches.` },
      { t: 'The mean is always bigger than the data, so it is fine.', say: 'The mean is a balance point: it sits between the smallest and largest values.' },
    ]);
  }
  const N = int(R, 12, 25);
  return choice(R, {
    id: `entryCheck-${n}`, family: 'entryCheck', prompt: `A spreadsheet has the header “Minutes” in cell A1 and ${N} commute times in A2 to A${N + 1}. Which formula gives the mean of the ${N} times?`,
    board: `\\text{A2 to A${N + 1}}`, solution: [`The data are in A2 to A${N + 1}; A1 is a header, and A${N + 2} is empty.`],
  }, [
    { t: `=AVERAGE(A2:A${N + 1})`, ok: true, say: 'Yes: the range holds exactly the data.' },
    { t: `=AVERAGE(A1:A${N + 1})`, mc: MC.leftover, say: 'A1 holds the header, not a commute time. Start the range at A2.' },
    { t: `=AVERAGE(A2:A${N})`, say: `That stops one row early and leaves out A${N + 1}.` },
    { t: `=SUM(A2:A${N + 1})`, say: 'SUM gives the total, not the mean.' },
  ]);
};

export const entryFix: Gen = (R, n) => {
  const c = pick(R, [CTX.sleep!, CTX.sprint!, CTX.apple!]);
  const N = 10;
  const xs = Array.from({ length: N }, () => val(R, c.lo, c.hi, 1));
  const i = int(R, 0, N - 1);
  let good = xs[i]!;
  if (Number.isInteger(good)) good = r9(good + 0.5);
  xs[i] = good;
  const typo = r9(good * 10), sGood = sum(xs), sBad = r9(sGood - good + typo);
  const mBad = r9(sBad / N), mGood = r9(sGood / N);
  return numItem({
    id: `entryFix-${n}`, family: 'entryFix',
    prompt: `You entered ${phrase(c, N)}, but typed ${fmt(typo)} instead of ${fmt(good)}. The calculator showed a mean of ${fmt(mBad)}. What is the correct mean?`,
    board: `\\bar{x}_{\\text{wrong}} = ${fmtT(mBad)}\\qquad n = ${N}`, unit: c.unit,
    solution: [`Wrong total: ${N} × ${fmt(mBad)} = ${fmt(sBad)}.`, `Fix it: ${fmt(sBad)} − ${fmt(typo)} + ${fmt(good)} = ${fmt(sGood)}.`, `Correct mean: ${fmt(sGood)} ÷ ${N} = <b class="s">${fmt(mGood)}</b>.`],
  }, mGood, 'Yes: fix the total, then divide again.', [
    [mBad, MC.trustCalc, 'That is the mean of the list with the typo in it. Fix the total first.'],
    [r9((sBad - typo) / (N - 1)), MC.alwaysDelete, `That deletes the value. It was a real ${c.what}: fix it to ${fmt(good)} instead.`],
  ], `Mean × n gives the wrong total. Take out ${fmt(typo)}, put in ${fmt(good)}, divide by ${N}.`);
};

function calcData(R: () => number): { c: Ctx; xs: number[] } {
  const c = ctxPick(R, ['test', 'commute', 'battery', 'height', 'points']);
  const N = int(R, 8, 16), lo = c.id === 'test' ? 60 : c.lo, hi = Math.min(c.hi, lo + 30);
  // no shown statistic within 0.001 of a .x5 tie at the tenths (the board shows 4 decimals)
  const safe = (v: number) => Math.abs((v * 10 - Math.floor(v * 10)) - 0.5) > 0.01;
  const xs = until(() => Array.from({ length: N }, () => val(R, lo, hi, 0)), x => safe(sdPop(x)) && safe(sdSample(x)) && safe(mean(x)) && tenth(sdPop(x)) !== tenth(sdSample(x)));
  return { c, xs };
}
const d4 = (v: number) => (Math.round(v * 10000) / 10000).toString();
export const sdOutput: Gen = (R, n) => {
  const { c, xs } = calcData(R), N = xs.length, sp = sdPop(xs), ss = sdSample(xs);
  const out = [`\\bar{x} = ${d4(mean(xs))}`, `\\Sigma x = ${sum(xs)}`, `\\Sigma x^2 = ${sum(xs.map(v => v * v))}`, `Sx = ${d4(ss)}`, `\\sigma x = ${d4(sp)}`, `n = ${N}`];
  return numItem({
    id: `sdOutput-${n}`, family: 'sdOutput',
    prompt: `You enter ${phrase(c, N)} and run 1-Var Stats (on the board). ${RULE.sd} Report the SD to the nearest tenth.`,
    board: out.join(' \\qquad '), unit: c.unit, picture: { plot: { axis: axisOf(c, Math.min(...xs), Math.max(...xs), { ticks: [6, 16] }), panels: [dotP('A', sorted(xs))] } },
    solution: [`The population SD is the σx line: ${d4(sp)}.`, `To the nearest tenth: <b class="s">${fmt(tenth(sp)!)}</b> ${c.unit}.`],
  }, tenth(sp)!, 'Yes: σx, rounded.', [
    [tenth(ss)!, MC.sampleSd, 'That is Sx, the SAMPLE standard deviation (it divides by n − 1). The stated convention is σx.'],
    [tenth(mean(xs))!, MC.spreadAsCenter, 'That is the mean, a center. The SD is the spread: the σx line.'],
  ], 'Find the σx line and round it to one decimal place.');
};

export const sdPlausible: Gen = (R, n) => {
  const { c, xs } = calcData(R), sp = tenth(sdPop(xs))!, rg = range(xs);
  const big = tenth(rg * 0.8)!;
  const opts: Opt[] = [
    { t: `${fmt(sp)} ${c.unit}`, ok: true, say: `Yes: it is between 0 and half the range (${fmt(rg / 2)}), like a typical distance from the mean should be.` },
    { t: `${fmt(rg)} ${c.unit}`, mc: MC.sdRange, say: `That is the range. A typical distance from the mean is much smaller: at most half the range (${fmt(rg / 2)}).` },
    { t: `−${fmt(sp)} ${c.unit}`, mc: MC.sdNeg, say: 'An SD is built from distances: it can never be negative.' },
    { t: `${fmt(big)} ${c.unit}`, say: `No value is that far from the mean on average: the SD is at most half the range, ${fmt(rg / 2)}.` },
  ];
  return choice(R, {
    id: `sdPlausible-${n}`, family: 'sdPlausible',
    prompt: `Four classmates report the SD of ${phrase(c, xs.length)} (the dot plot). Only one could be right. Which one?`,
    board: `\\min = ${Math.min(...xs)}\\qquad \\max = ${Math.max(...xs)}`,
    picture: { plot: { axis: axisOf(c, Math.min(...xs), Math.max(...xs), { ticks: [6, 16] }), panels: [dotP('A', sorted(xs))] } },
    solution: [`The range is ${fmt(rg)}, so the SD is at most ${fmt(rg / 2)}, and never negative.`, `Only ${fmt(sp)} ${c.unit} passes.`],
  }, opts);
};

// ===================== weighted-average =====================
export const weighted: Gen = (R, n) => {
  const v = pick(R, ['grade', 'grade', 'gpa', 'cost']);
  if (v === 'grade') {
    const W = pick(R, [[50, 30, 20], [40, 35, 25], [60, 25, 15], [45, 35, 20]]);
    const names = ['tests', 'quizzes', 'homework'];
    const [xs, wa] = until(() => { const x = [int(R, 62, 92), int(R, 70, 96), int(R, 80, 100)]; return [x, weightedMean(x, W)] as const; }, ([x, w]) => tenth(w) !== null && Math.abs(tenth(mean(x))! - tenth(w)!) >= 0.5 && tenth(mean(x)) !== null);
    const ansV = tenth(wa)!;
    return numItem({
      id: `weighted-${n}`, family: 'weighted',
      prompt: `A course grade counts ${names.map((nm, i) => `${nm} ${W[i]}%`).join(', ')}. Maya’s averages are ${names.map((nm, i) => `${nm} ${xs[i]}`).join(', ')}. What is her course grade, to the nearest tenth?`,
      board: names.map((nm, i) => `${xs[i]}\\ (${W[i]}\\%)`).join('\\quad '), unit: 'points',
      solution: [`Weighted: ${xs.map((x, i) => `${W[i]! / 100} × ${x}`).join(' + ')} = ${fmt(wa, 4)}.`, `To the nearest tenth: <b class="s">${fmt(ansV)}</b>.`],
    }, ansV, 'Yes: each average counts by its weight.', [
      [tenth(mean(xs))!, MC.unweighted, 'That is the plain average of the three. Tests count more than homework here: use the weights.'],
      [r9(xs.reduce((s, x, i) => s + x * W[i]!, 0)), MC.pctNumeral, 'The weights are percents: 50% is 0.50, so divide by 100 (or by the total 100).'],
      [tenth(xs.reduce((s, x, i) => s + x * W[i]! / 100, 0) / 3)!, MC.overCount, 'The weights already add to 100%: do not divide by the number of categories.'],
    ], 'Multiply each average by its weight as a decimal, then add.');
  }
  if (v === 'gpa') {
    const k = int(R, 3, 4), cr = Array.from({ length: k }, () => int(R, 1, 4)), gp = Array.from({ length: k }, () => pick(R, [4, 3.7, 3.3, 3, 2.7, 2.3, 2]));
    const g = weightedMean(gp, cr), r2 = Math.round(g * 100) / 100;
    if (Math.abs(g * 100 - Math.floor(g * 100) - 0.5) < 1e-4 || Math.abs(mean(gp) - g) < 0.01 || new Set(cr).size === 1) return weighted(R, n + 991, undefined);
    return numItem({
      id: `weighted-${n}`, family: 'weighted',
      prompt: `Jordan’s courses: ${cr.map((c, i) => `${pl(c, 'credit')} with grade points ${fmt(gp[i]!)}`).join('; ')}. GPA = total of (credits × grade points) ÷ total credits. What is Jordan’s GPA, to the nearest hundredth?`,
      board: cr.map((c, i) => `${c} \\times ${gp[i]}`).join(' + '), unit: '',
      solution: [`Credits × grade points: ${cr.map((c, i) => `${c} × ${fmt(gp[i]!)}`).join(' + ')} = ${fmt(sum(cr.map((c, i) => c * gp[i]!)))}.`, `Total credits: ${sum(cr)}. GPA = ${fmt(sum(cr.map((c, i) => c * gp[i]!)))} ÷ ${sum(cr)} ≈ <b class="s">${r2.toFixed(2)}</b>.`],
    }, r2, 'Yes: each course counts by its credits.', [
      [Math.round(mean(gp) * 100) / 100, MC.unweighted, 'That treats every course the same. A 4-credit course counts 4 times as much as a 1-credit course.'],
      [Math.round(sum(cr.map((c, i) => c * gp[i]!)) / k * 100) / 100, MC.overCount, `Divide by the total credits (${sum(cr)}), not by the number of courses (${k}).`],
    ], 'Multiply each course’s grade points by its credits, add, and divide by the total credits.');
  }
  const lb = [int(R, 2, 6), int(R, 2, 8)], pr = [r9(int(R, 120, 260) / 100), r9(int(R, 120, 260) / 100)];
  if (lb[0] === lb[1] || pr[0] === pr[1]) return weighted(R, n + 997, undefined);
  const tot = r9(lb[0]! * pr[0]! + lb[1]! * pr[1]!), avg = tot / (lb[0]! + lb[1]!), cents = Math.round(avg * 100) / 100;
  if (Math.abs(avg * 100 - Math.floor(avg * 100) - 0.5) < 1e-4 || Math.abs(cents - Math.round(mean(pr) * 100) / 100) < 0.005) return weighted(R, n + 993, undefined);
  return numItem({
    id: `weighted-${n}`, family: 'weighted',
    prompt: `You buy ${lb[0]} lb of apples at $${pr[0]!.toFixed(2)} per lb and ${lb[1]} lb at $${pr[1]!.toFixed(2)} per lb. What is the average price per pound of all the apples, to the nearest cent?`,
    board: `${lb[0]} \\times ${pr[0]!.toFixed(2)} + ${lb[1]} \\times ${pr[1]!.toFixed(2)}`, unit: 'per lb',
    solution: [`Total cost: ${lb[0]} × $${pr[0]!.toFixed(2)} + ${lb[1]} × $${pr[1]!.toFixed(2)} = $${tot.toFixed(2)}.`, `Total weight: ${lb[0]! + lb[1]!} lb. $${tot.toFixed(2)} ÷ ${lb[0]! + lb[1]!} ≈ <b class="s">$${cents.toFixed(2)}</b> per lb.`],
  }, cents, 'Yes: total cost over total pounds.', [[Math.round(mean(pr) * 100) / 100, MC.unweighted, 'That averages the two prices as if you bought the same amount of each. Weight them by the pounds.']], 'Total cost ÷ total pounds.', { tol: 0.001 });
};

export const weightedSense: Gen = (R, n) => {
  const lo = int(R, 60, 78), hi = lo + 2 * int(R, 6, 11), mid = (lo + hi) / 2;
  const wl = int(R, 1, 2), wh = wl + int(R, 1, 3), heavyHigh = R() < 0.6;
  const [w1, w2] = heavyHigh ? [wl, wh] : [wh, wl];
  const heavy = heavyHigh ? hi : lo, light = heavyHigh ? lo : hi;
  const t = (a: number, b: number) => `Between ${Math.min(a, b)} and ${Math.max(a, b)}`;
  const opts: Opt[] = [
    { t: t(mid, heavy), ok: true, say: `Yes: it lies between the two scores, pulled toward ${heavy}, the one with more weight.` },
    { t: `Exactly ${mid}`, mc: MC.unweighted, say: `${mid} is the plain average: it treats both scores the same. The weights differ.` },
    { t: t(light, mid), mc: MC.pushAway, say: 'A bigger weight pulls the average TOWARD its value, not away from it.' },
    { t: `${heavyHigh ? 'Above' : 'Below'} ${heavy}`, say: 'A weighted average always lies between the smallest and largest value.' },
  ];
  return choice(R, {
    id: `weightedSense-${n}`, family: 'weightedSense',
    prompt: `Without calculating: a project score of ${lo} counts with weight ${w1}, and an exam score of ${hi} counts with weight ${w2}. Where is the weighted average?`,
    board: `\\frac{${w1}\\cdot ${lo} + ${w2}\\cdot ${hi}}{${w1} + ${w2}}`,
    solution: [`The plain average is ${mid}.`, `${heavy} has the larger weight, so the weighted average is pulled toward it: between ${Math.min(mid, heavy)} and ${Math.max(mid, heavy)} (it is ${fmt(weightedMean([lo, hi], [w1, w2]), 2)}).`],
  }, opts);
};

// ===================== context-summary / two-set-summary =====================
export const summaryPick: Gen = (R, n) => {
  const skew = R() < 0.55;
  const c = skew ? CTX.commute! : pick(R, [CTX.height!, CTX.quiz!]);
  const N = int(R, 14, 20);
  const xs = sorted(until(() => skew ? Array.from({ length: N }, () => 8 + Math.round(-Math.log(1 - R() * 0.93) * 7)) : Array.from({ length: N }, () => Math.round((c.id === 'quiz' ? 6 : 61) + (R() + R() + R()) / 3 * (c.id === 'quiz' ? 12 : 12))), x => {
    const f = five(x), m = mean(x), s = sdPop(x);
    return Math.max(...stacks(x).values()) <= 4 && (skew ? (m - f.med > 0.25 * s && (f.max - f.med) > 2.2 * (f.med - f.min) && Math.max(...x) <= 45) : (Math.abs(m - f.med) < 0.15 * s && Math.abs((f.max - f.med) - (f.med - f.min)) <= 2 && x.every(v => !isOutlier(v, fences(f))))) && tenth(m) !== null && tenth(s) !== null;
  }));
  const f = five(xs), q = iqrOf(f), m = tenth(mean(xs))!, s = tenth(sdPop(xs))!, u = c.unit;
  const who = c.id === 'commute' ? 'students' : c.id === 'quiz' ? 'students' : '9th graders';
  const shape = skew ? 'Skewed right' : 'Roughly symmetric';
  const nums = skew ? `median ${fmt(f.med)} ${u}, IQR ${fmt(q)} ${u}` : `mean ${fmt(m)} ${u}, SD ${fmt(s)} ${u}`;
  const opts: Opt[] = [
    { t: `${shape}, with ${nums} (n = ${N} ${who}).`, ok: true, say: 'Yes: shape, center, spread, units and n.' },
    { t: skew ? `Median ${fmt(f.med)}, IQR ${fmt(q)}.` : `Mean ${fmt(m)}, SD ${fmt(s)}.`, mc: MC.bare, say: 'Bare numbers: no shape, no units, no n. A reader cannot tell what they describe.' },
    { t: `One student’s value was ${fmt(f.min)} ${u} and another’s was ${fmt(f.max)} ${u}.`, mc: MC.singleCase, say: 'That describes two single cases. A summary describes the whole group: shape, center, spread.' },
    { t: `${skew ? 'Skewed left' : 'Skewed right'}, with ${nums} (n = ${N} ${who}).`, mc: skew ? MC.peak : undefined, say: skew ? 'The long tail runs to the right (the long commutes): skewed right. Skew is named by the tail.' : 'The two sides roughly mirror each other: no long tail.' },
  ];
  return choice(R, {
    id: `summaryPick-${n}`, family: 'summaryPick',
    prompt: `The dot plot shows ${phrase(c, N)}. Which is the best summary of this distribution?`,
    board: `n = ${N}`,
    picture: { plot: { axis: axisOf(c, xs[0]!, xs[N - 1]!, { step: c.id === 'commute' ? 2 : 1, ticks: [8, 22] }), panels: [dotP('A', xs)], solveMarks: skew ? [vline('m', f.med, `median ${fmt(f.med)}`)] : [vline('m', mean(xs), `mean ${fmt(m)}`)] } },
    solution: [`Shape: ${shape.toLowerCase()}, so ${skew ? 'the median and IQR' : 'the mean and SD'} describe it best.`, `A full summary names the shape, center, spread, units and n.`],
  }, opts);
};

export const twoSet: Gen = (R, n) => {
  const c = ctxPick(R, ['commute', 'points', 'quiz', 'battery']);
  const stat = pick(R, ['median', 'iqr'] as const);
  const [N0, N1] = groupsOf(R, c);
  const mk = () => { const lo = c.lo + int(R, 0, 4); return ints(R, int(R, 6, 12), lo, lo + int(R, 8, 14)); };
  const [a, b] = until(() => [mk(), mk()], ([a, b]) => {
    const fa = five(a!), fb = five(b!);
    return stat === 'median' ? Math.abs(fa.med - fb.med) >= 1 : iqrOf(fa) !== iqrOf(fb) && iqrOf(fa) > 0 && iqrOf(fb) > 0;
  });
  const fa = five(a!), fb = five(b!);
  const va = stat === 'median' ? fa.med : iqrOf(fa), vb = stat === 'median' ? fb.med : iqrOf(fb);
  const all = [...a!, ...b!];
  return pairItem({
    id: `twoSet-${n}`, family: 'twoSet',
    prompt: `The dot plots show ${manyOf(c)} for ${N0} (n = ${a!.length}) and ${N1} (n = ${b!.length}) on one scale. Find the ${stat === 'median' ? 'median' : 'IQR'} of each.${stat === 'iqr' ? ' ' + RULE.quart : ''}`,
    board: `\\text{${stat === 'median' ? 'median' : 'IQR'}}_A,\\ \\text{${stat === 'median' ? 'median' : 'IQR'}}_B`, unit: '',
    picture: { plot: { axis: axisOf(c, Math.min(...all), Math.max(...all), { step: Math.max(...all) - Math.min(...all) > 18 ? 2 : 1, ticks: [8, 20] }), panels: [dotP('A', sorted(a!), N0), dotP('B', sorted(b!), N1)] } },
    solution: stat === 'median'
      ? [`${N0}: ${a!.length} values, median <b class="s">${fmt(va)}</b>.`, `${N1}: ${b!.length} values, median <b class="s">${fmt(vb)}</b>.`]
      : [`${N0}: Q1 = ${fmt(fa.q1)}, Q3 = ${fmt(fa.q3)}, IQR <b class="s">${fmt(va)}</b>.`, `${N1}: Q1 = ${fmt(fb.q1)}, Q3 = ${fmt(fb.q3)}, IQR <b class="s">${fmt(vb)}</b>.`],
  }, va, vb, { lead: `${N0}:`, op: `, ${N1}:`, tail: c.unit }, 'Yes: the same statistic for both groups.', [[vb, va, undefined, `Swapped: the first box is ${N0}.`]], stat === 'median' ? 'Count in to the middle of each plot separately.' : 'Find Q1 and Q3 of each plot (medians of the halves), then subtract.');
};

export const comparableRow: Gen = (R, n) => {
  const c = CTX.commute!;
  const mk = () => { const lo = int(R, 6, 12); return ints(R, int(R, 7, 11), lo, lo + int(R, 10, 18)); };
  const [a, b] = until(() => [mk(), mk()], ([a, b]) => Math.abs(median(a!) - median(b!)) >= 2 && tenth(mean(a!)) !== null && Math.abs(mean(a!) - median(a!)) >= 0.5);
  const fa = five(a!), fb = five(b!), [N0, N1] = ['School A', 'School B'];
  const row = (x: string, y: string) => `${N0}: ${x}. ${N1}: ${y}.`;
  const opts: Opt[] = [
    { t: row(`median ${fmt(fa.med)} min, IQR ${fmt(iqrOf(fa))} min (n = ${a!.length})`, `median ${fmt(fb.med)} min, IQR ${fmt(iqrOf(fb))} min (n = ${b!.length})`), ok: true, say: 'Yes: the same center and spread measures for both groups, with units and n.' },
    { t: row(`mean ${fmt(tenth(mean(a!))!)} min (n = ${a!.length})`, `median ${fmt(fb.med)} min (n = ${b!.length})`), mc: MC.meanVsMedian, say: 'A mean of one group against a median of the other is not a fair comparison. Use the same measure for both.' },
    { t: row(`median ${fmt(fa.med)} min`, `median ${fmt(r9(fb.med / 60), 3)} h`), mc: MC.unlike, say: 'Minutes against hours: put both in the same units before comparing.' },
    { t: row(`median ${fmt(fa.med)} min (n = ${a!.length})`, `median ${fmt(fb.med)} min (n = ${b!.length})`), mc: MC.centerAlone, say: 'Centers alone hide the spread. Add a spread measure (the IQR) for each.' },
  ];
  const all = [...a!, ...b!];
  return choice(R, {
    id: `comparableRow-${n}`, family: 'comparableRow',
    prompt: `The dot plots show the commute times (minutes) of ${a!.length} students at ${N0} and ${b!.length} students at ${N1}. Which summary compares the two schools fairly and completely?`,
    board: `\\text{${N0} vs. ${N1}}`,
    picture: { plot: { axis: axisOf(c, Math.min(...all), Math.max(...all), { step: 2, ticks: [8, 18] }), panels: [dotP('A', sorted(a!), N0), dotP('B', sorted(b!), N1)] } },
    solution: ['A fair comparison uses the same center and spread measures for both groups, in the same units, with n.', `${N0}: median ${fmt(fa.med)}, IQR ${fmt(iqrOf(fa))}. ${N1}: median ${fmt(fb.med)}, IQR ${fmt(iqrOf(fb))}.`],
  }, opts);
};
