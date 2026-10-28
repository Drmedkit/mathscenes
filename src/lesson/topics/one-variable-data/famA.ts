// famA.ts: stage 1 families (median review, center and spread, shape, box-plot quarters, unusual values, deviation,
// MAD, the meaning of SD). Pure: no DOM.
import { type Gen, type Opt, MC, RULE, A, H, axisOf, choice, ctxPick, int, listH, listT, numItem, phrase, pick, pl, shuffle, tenth, until, val, withU, CTX, roundD, groupsOf, manyOf, un } from './common';
import type { DMark, DPanel } from './DataPlot';
import { five, halves, mad, mean, median, range, sdPop, sorted, stacks, sum, r9, iqrOf, fences, isOutlier, fmt } from './stats';

const dotP = (key: string, data: number[], label?: string): DPanel => ({ key, kind: 'dot', data, label });
const vline = (key: string, x: number, label: string, col: DMark['col'] = 'link', panels?: string[]): DMark => ({ kind: 'vline', key, x, label, col, panels });
const maxStack = (xs: number[]) => Math.max(...stacks(xs).values());

// ===================== median-review =====================
export const medianList: Gen = (R, n) => {
  const c = ctxPick(R, ['test', 'commute', 'points', 'quiz', 'height']);
  const odd = (n + int(R, 0, 1)) % 2 === 0;
  const N = odd ? pick(R, [5, 7, 9, 11]) : pick(R, [6, 8, 10]);
  const mk = () => {
    const xs = Array.from({ length: N }, () => val(R, c.lo, c.hi, 0));
    if (R() < 0.5) xs[int(R, 0, N - 1)] = xs[int(R, 0, N - 1)]!;
    return shuffle(R, xs);
  };
  const xs = until(mk, x => { const m = median(x); const um = N % 2 ? x[(N - 1) / 2]! : (x[N / 2 - 1]! + x[N / 2]!) / 2; return Math.abs(um - m) > 0.4 && (N % 2 === 1 || sorted(x)[N / 2 - 1] !== sorted(x)[N / 2]); });
  const s = sorted(xs), m = median(xs);
  const um = N % 2 ? xs[(N - 1) / 2]! : r9((xs[N / 2 - 1]! + xs[N / 2]!) / 2);
  const mid = N % 2 ? `the ${ord((N + 1) / 2)} value: <b class="s">${H(m)}</b>` : `the mean of the ${ord(N / 2)} and ${ord(N / 2 + 1)} values: (${s[N / 2 - 1]} + ${s[N / 2]}) ÷ 2 = <b class="s">${H(m)}</b>`;
  return numItem({
    id: `medianList-${n}`, family: 'medianList',
    prompt: `Here are ${phrase(c, N)}: ${listH(xs)}. What is the median?`,
    board: listT(xs), unit: c.unit, picture: { list: { name: c.axis, data: xs } },
    solution: [`Order first: ${listH(s)}.`, `${N} values, so the median is ${mid}.`],
  }, m, `Yes: ordered, the middle is ${H(m)}.`, [
    [um, MC.noSort, `${H(um)} is the middle of the list as written. Order the values first.`],
    ...(N % 2 ? [] : [[s[N / 2 - 1]!, MC.eitherMiddle, `With an even count there are two middle values. The median is halfway between them.`] as [number, string, string], [s[N / 2]!, MC.eitherMiddle, `With an even count there are two middle values. The median is halfway between them.`] as [number, string, string]]),
    [mean(xs), undefined, 'That is the mean. The median is the middle of the ordered list.'],
  ], 'Order the values, then count in from both ends to the middle.');
};
const ord = (k: number) => k + (k % 10 === 1 && k % 100 !== 11 ? 'st' : k % 10 === 2 && k % 100 !== 12 ? 'nd' : k % 10 === 3 && k % 100 !== 13 ? 'rd' : 'th');

export const medianDots: Gen = (R, n) => {
  const c = ctxPick(R, ['quiz', 'points', 'commute', 'battery']);
  const N = int(R, 8, 15);
  const lo = int(R, c.lo, c.lo + 6), w = int(R, 6, 10);
  const xs = until(() => Array.from({ length: N }, () => lo + Math.round((R() + R()) / 2 * w + (R() < 0.25 ? R() * 4 : 0))),
    x => { const st = stacks(x); const top = [...st.entries()].filter(([, k]) => k === maxStack(x)); return top.length === 1 && Math.abs(top[0]![0] - median(x)) > 0.4 && maxStack(x) <= 5 && Math.max(...x) <= c.hi; });
  const s = sorted(xs), m = median(xs), ax = axisOf(c, s[0]!, s[N - 1]!, { step: 1, ticks: [8, 16] });
  const mode = [...stacks(xs).entries()].find(([, k]) => k === maxStack(xs))![0];
  return numItem({
    id: `medianDots-${n}`, family: 'medianDots',
    prompt: `The dot plot shows ${phrase(c, N)}. What is the median?`,
    board: `n = ${N}\\qquad \\text{median} = \\,?`, unit: c.unit,
    picture: { plot: { axis: ax, panels: [dotP('A', xs)], solveMarks: [vline('m', m, `median ${H(m)}`)] } },
    solution: [`${N} dots. Count in from both ends: ${N % 2 ? `the ${ord((N + 1) / 2)} dot is the middle` : `the ${ord(N / 2)} and ${ord(N / 2 + 1)} dots are the middle pair`}.`, `The median is <b class="s">${H(m)}</b>.`],
  }, m, `Yes: ${H(m)} is in the middle of the ${N} dots.`, [
    [mode, MC.tallest, `${H(mode)} has the tallest stack: that is the mode. The median is the middle dot when you count in from both ends.`],
    [r9((ax.min + ax.max) / 2), MC.midScale, 'That is the middle of the axis, not of the data. Count the dots in from both ends.'],
    [r9((s[0]! + s[N - 1]!) / 2), MC.midrange, 'That is halfway between the smallest and largest values. The median is the middle dot by count.'],
  ], 'Count the dots in from both ends until you meet in the middle.');
};

// ===================== center-location / spread-along-axis / compare-distributions =====================
/** a set symmetric about c: pairs c ± o (and c itself when n is odd) */
function symSet(R: () => number, c: number, n: number, oMax: number, oMin = 0): number[] {
  const xs: number[] = n % 2 ? [c] : [];
  while (xs.length < n) { const o = int(R, oMin, oMax); xs.push(c - o, c + o); }
  return xs;
}
const DIFF = ['Only in center', 'Only in spread', 'In both center and spread', 'In neither: same center and spread'];
export const differIn: Gen = (R, n, sg) => {
  const c = ctxPick(R, ['quiz', 'points', 'commute']);
  const kinds = sg === 'center-location' ? ['shift', 'spread'] : sg === 'spread-along-axis' ? ['shift', 'spread', 'range'] : ['shift', 'spread', 'both'];
  const kind = pick(R, kinds);
  const lo = Math.max(c.lo, 2), hi = Math.min(c.hi, 30);
  const names = groupsOf(R, c);
  let a: number[] = [], b: number[] = [];
  const nA = int(R, 6, 11), nB = int(R, 6, 11);
  if (kind === 'shift') { const d = int(R, 3, 7); a = until(() => Array.from({ length: nA }, () => int(R, lo, hi - d)), x => range(x) >= 3 && range(x) <= 12); b = a.map(v => v + d); }
  else if (kind === 'spread') { const m = int(R, lo + 9, hi - 9); a = symSet(R, m, nA, 2); b = until(() => symSet(R, m, nB, 8, 2), x => sdPop(x) > sdPop(a) + 1 && iqrOf(five(x)) > iqrOf(five(a))); }
  else if (kind === 'range') { const m = int(R, lo + 6, hi - 6), d = int(R, 4, 6), k = pick(R, [3, 4]); a = [m - d, ...Array(2 * k - 2).fill(m), m + d]; b = [...Array(k).fill(m - d), ...Array(k).fill(m + d)]; }
  else { const m1 = int(R, lo + 3, lo + 6), m2 = m1 + int(R, 4, 6), om = Math.min(7, hi - m2, m2 - lo); a = symSet(R, m1, nA, 2); b = until(() => symSet(R, m2, nB, om, 2), x => sdPop(x) > sdPop(a) + 1 && iqrOf(five(x)) > iqrOf(five(a))); }
  if (R() < 0.5) [a, b] = [b, a];
  const centerDiff = Math.abs(mean(a) - mean(b)) > 1e-9, spreadDiff = Math.abs(sdPop(a) - sdPop(b)) > 1e-6;
  const right = centerDiff && spreadDiff ? 2 : centerDiff ? 0 : spreadDiff ? 1 : 3;
  const ax = axisOf(c, Math.min(...a, ...b), Math.max(...a, ...b), { step: kind === 'range' || range([...a, ...b]) > 14 ? 2 : 1, ticks: [8, 16] });
  const [fa, fb] = [five(a), five(b)];
  const sol = [
    `Center: ${names[0]} mean ${H(mean(a), 2)}, median ${H(fa.med)}; ${names[1]} mean ${H(mean(b), 2)}, median ${H(fb.med)}. ${centerDiff ? 'Different.' : 'The same.'}`,
    `Spread: ${names[0]} SD ${H(sdPop(a), 1)}, IQR ${H(iqrOf(fa))}; ${names[1]} SD ${H(sdPop(b), 1)}, IQR ${H(iqrOf(fb))}. ${spreadDiff ? 'Different.' : 'The same: one plot is the other slid along the axis.'}`,
  ];
  const opts: Opt[] = DIFF.map((t, i) => ({
    t, ok: i === right,
    mc: i === right ? undefined : right === 0 && (i === 1 || i === 2) ? MC.shiftSpread : right === 1 && i === 3 ? (kind === 'range' ? MC.rangeSpread : MC.centerAlone) : right === 2 && i === 0 ? MC.shiftSpread : undefined,
    say: i === right ? 'Yes.' : right === 0 ? 'Sliding every value the same distance moves the center but keeps the spread: the shapes match exactly.'
      : right === 1 ? (kind === 'range' ? 'Same range, but the values sit at different distances from the center: look at how far the dots are from the middle.' : 'The centers match, but one set’s values sit farther from the center.')
        : 'Look at both: where the middle is, and how far the values sit from it.',
  }));
  return choice(R, {
    id: `differIn-${n}`, family: 'differIn',
    prompt: `The dot plots show ${manyOf(c)} for ${names[0]} (n = ${a.length}) and ${names[1]} (n = ${b.length}). How do the two distributions differ? Compare center (mean and median) and spread (SD and IQR).`,
    board: `\\text{center?}\\qquad \\text{spread?}`, unit: '',
    picture: { plot: { axis: ax, panels: [dotP('A', sorted(a), names[0]), dotP('B', sorted(b), names[1])], solveMarks: [vline('mA', mean(a), `mean ${H(mean(a), 2)}`, 'link', ['A']), vline('mB', mean(b), `mean ${H(mean(b), 2)}`, 'link', ['B'])] } },
    solution: sol,
  }, opts, true);
};

export const sameCenter: Gen = (R, n) => {
  const c = ctxPick(R, ['quiz', 'points', 'commute']);
  const shift = R() < 0.4, lo = Math.max(c.lo, 2), hi = Math.min(c.hi, 30);
  const [N0, N1] = groupsOf(R, c);
  let a: number[], b: number[];
  if (shift) { const d = int(R, 3, 6); a = until(() => Array.from({ length: int(R, 6, 10) }, () => int(R, lo, hi - d - 3)), x => range(x) > d + 1 && range(x) <= 12); b = a.map(v => v + d); }
  else {
    const m = int(R, lo + 9, hi - 9);
    a = until(() => symSet(R, m, int(R, 7, 11), 2), x => maxStack(x) >= 3);
    b = until(() => symSet(R, m, int(R, 6, 10), 8, 3), x => maxStack(x) < maxStack(a) && Math.max(...x) > Math.max(...a));
  }
  const ma = mean(a), mb = mean(b), d = r9(mb - ma), u = c.unit;
  const opts: Opt[] = shift ? [
    { t: `${N1}’s center is ${fmt(d)} ${u} higher; the spreads are the same.`, ok: true, say: `Yes: every value moved up ${fmt(d)}, so the center moved ${fmt(d)} and the spread stayed.` },
    { t: `${N1} is more spread out, because its values are larger.`, mc: MC.shiftSpread, say: 'Larger values are not more spread out. Spread is how far the values sit from each other, and the two shapes match.' },
    { t: `Every ${N1} value is higher than every ${N0} value.`, mc: MC.everyHigher, say: 'The two plots overlap: some values in the lower set are higher than some in the higher set.' },
    { t: `${N1}’s center is ${fmt(2 * d)} ${u} higher; the spreads are the same.`, say: `Compare the medians: they are ${fmt(d)} apart.` },
  ] : [
    { t: `Same center (mean and median ${fmt(ma)}), but ${N1}’s values are more spread out.`, ok: true, say: 'Yes: the same middle, but the values sit farther from it.' },
    { t: `Same center, so the two distributions are the same.`, mc: MC.centerAlone, say: 'A center is only the location. The spreads differ.' },
    { t: `${N1} has the higher center, because its largest value is higher.`, mc: 'mc.statistics.compares-groups-by-extreme-case', say: 'One extreme value is not the center. Both means and medians match.' },
    { t: `${N0} is more spread out, because its stacks are taller.`, mc: MC.heights, say: 'Tall stacks mean values pile up in one place: that is LESS spread. Spread is width along the axis.' },
  ];
  if (!shift && Math.abs(mb - ma) > 1e-9) throw new Error('sameCenter: means differ');
  const ax = axisOf(c, Math.min(...a, ...b), Math.max(...a, ...b), { step: 1, ticks: [8, 22] });
  if (ax.max - ax.min > 22) ax.step = 2;
  return choice(R, {
    id: `sameCenter-${n}`, family: 'sameCenter',
    prompt: `The dot plots show ${manyOf(c)} for ${N0} (n = ${a.length}) and ${N1} (n = ${b.length}). Which statement is true?`,
    board: `\\text{${N0}}\\ \\text{vs.}\\ \\text{${N1}}`,
    picture: { plot: { axis: ax, panels: [dotP('A', sorted(a), N0), dotP('B', sorted(b), N1)], solveMarks: [vline('mA', median(a), `median ${H(median(a))}`, 'link', ['A']), vline('mB', median(b), `median ${H(median(b))}`, 'link', ['B'])] } },
    solution: [`Medians: ${N0} ${H(median(a))}, ${N1} ${H(median(b))}. Means: ${H(ma, 2)} and ${H(mb, 2)}.`, shift ? `${N1} is ${N0} slid ${fmt(d)} to the right: the same shape and spread.` : `Spread: ${N0} SD ${H(sdPop(a), 1)}, ${N1} SD ${H(sdPop(b), 1)}: ${N1} is wider along the axis.`],
  }, opts);
};

/** histogram data from bin counts: whole values strictly inside each bin */
export function fromCounts(R: () => number, counts: number[], start: number, w: number, dec = 0): number[] {
  const out: number[] = [];
  counts.forEach((k, i) => { for (let j = 0; j < k; j++) { let v: number; do v = roundD(start + i * w + R() * w, dec); while (v <= start + i * w || v >= start + (i + 1) * w); out.push(v); } });
  return out;
}
export const spreadMore: Gen = (R, n) => {
  const start = 40, w = 10;
  const k = int(R, 3, 5);
  const flat = Array(6).fill(k);
  const mound = pick(R, [[1, 2, 2 * k - 1, 2 * k - 1, 2, 1], [1, k - 1, k + 2, k + 2, k - 1, 1]]);
  const mk = () => { const f = fromCounts(R, flat, start, w), m = fromCounts(R, mound, start, w); const lo = Math.min(...f, ...m), hi = Math.max(...f, ...m); f[f.indexOf(Math.min(...f))] = lo; m[m.indexOf(Math.min(...m))] = lo; f[f.indexOf(Math.max(...f))] = hi; m[m.indexOf(Math.max(...m))] = hi; return [f, m]; };
  const [f, m] = until(mk, ([f, m]) => sdPop(f!) > sdPop(m!) + 2 && iqrOf(five(f!)) > iqrOf(five(m!)));
  const flatFirst = R() < 0.5;
  const [N0, N1] = ['Class A', 'Class B'];
  const A0 = flatFirst ? f! : m!, B0 = flatFirst ? m! : f!;
  const wide = flatFirst ? N0 : N1, peaked = flatFirst ? N1 : N0;
  const opts: Opt[] = [
    { t: `${wide}`, ok: true, say: `Yes: ${wide}’s scores are spread evenly across the whole range, while ${peaked}’s pile up in the middle.` },
    { t: `${peaked}`, mc: MC.heights, say: 'Tall bars in the middle mean the scores crowd near the center: less spread, not more.' },
    { t: 'Neither: they have the same range', mc: MC.rangeSpread, say: 'The range only uses the two extremes. Look at where the rest of the scores sit.' },
  ];
  return choice(R, {
    id: `spreadMore-${n}`, family: 'spreadMore',
    prompt: `Two classes took the same 100-point test: ${N0} (n = ${A0.length}) and ${N1} (n = ${B0.length}). Both have the same lowest score (${Math.min(...f!)}) and highest score (${Math.max(...f!)}). Which class’s scores are more spread out?`,
    board: `\\text{range}_A = \\text{range}_B`,
    picture: { plot: { axis: { min: 40, max: 100, step: 10, name: 'Test score (points)' }, panels: [{ key: 'A', kind: 'hist', data: sorted(A0), bins: { start, width: w }, label: N0 }, { key: 'B', kind: 'hist', data: sorted(B0), bins: { start, width: w }, label: N1 }] } },
    solution: [`Same range: ${fmt(range(f!))} points.`, `SD: ${wide} ${H(sdPop(flatFirst ? A0 : B0), 1)}, ${peaked} ${H(sdPop(flatFirst ? B0 : A0), 1)} points. Typical distance from the center is larger for ${wide}.`],
  }, opts, true);
};

// ===================== shape-skew-by-tail =====================
const SHAPES = { right: 'Skewed right', left: 'Skewed left', mound: 'Symmetric, one peak', uniform: 'Uniform (flat)', bimodal: 'Bimodal (two peaks)' } as const;
export type Shape = keyof typeof SHAPES;
export function shapeCounts(R: () => number, s: Shape): number[] {
  const j = (k: number) => Math.max(1, k + int(R, -1, 1));
  switch (s) {
    case 'right': { const t = pick(R, [[5, 11, 13, 8, 5, 3, 2, 1], [8, 14, 9, 6, 4, 3, 1, 1], [3, 9, 12, 10, 6, 4, 2, 1]]); return t.map((k, i) => (i < 3 ? j(k) : k)); }
    case 'left': return shapeCounts(R, 'right').reverse();
    case 'mound': { const h = pick(R, [[1, 3, 7, 11], [2, 4, 8, 10], [1, 4, 9, 12]]).map(j); return [...h, ...h.slice().reverse()]; }
    case 'uniform': { const k = int(R, 6, 9); return Array.from({ length: 6 }, () => k + int(R, -1, 1)); }
    case 'bimodal': { const h = pick(R, [[1, 7, 11, 4, 1], [2, 8, 10, 3, 1]]).map(j); h[4] = 1; return [...h, ...h.slice(0, 4).reverse().map(j)]; }
  }
}
const SHAPE_CTX: Record<Shape, { what: string; axis: string; start: number; w: number }[]> = {
  right: [{ what: 'commute times of {n} students (minutes)', axis: 'Commute (minutes)', start: 5, w: 5 }, { what: 'prices of {n} used cars (thousands of dollars)', axis: 'Price ($1,000s)', start: 4, w: 4 }],
  left: [{ what: 'scores of {n} students on an easy 100-point test', axis: 'Test score (points)', start: 20, w: 10 }, { what: 'ages of {n} people when they retired (years)', axis: 'Age (years)', start: 40, w: 4 }],
  mound: [{ what: 'heights of {n} adult women (inches)', axis: 'Height (inches)', start: 56, w: 2 }, { what: 'reaction times of {n} players (milliseconds)', axis: 'Reaction time (ms)', start: 180, w: 20 }],
  uniform: [{ what: 'minutes past the hour of {n} calls to a help line', axis: 'Minutes past the hour', start: 0, w: 10 }],
  bimodal: [{ what: 'heights of {n} people at a family picnic, adults and kids (inches)', axis: 'Height (inches)', start: 34, w: 5 }],
};
export const shapeName: Gen = (R, n) => {
  const s = pick(R, ['right', 'left', 'mound', 'uniform', 'bimodal', 'right', 'left'] as Shape[]);
  const cx = pick(R, SHAPE_CTX[s]), counts = shapeCounts(R, s), N = counts.reduce((a, b) => a + b, 0);
  const data = fromCounts(R, counts, cx.start, cx.w);
  const end = cx.start + counts.length * cx.w;
  const axis = { min: cx.start, max: end, step: cx.w, name: cx.axis };
  const others = (Object.keys(SHAPES) as Shape[]).filter(k => k !== s);
  const wrong = shuffle(R, others).slice(0, 3);
  if (s === 'right' && !wrong.includes('left')) wrong[0] = 'left';
  if (s === 'left' && !wrong.includes('right')) wrong[0] = 'right';
  if ((s === 'uniform' || s === 'bimodal') && !wrong.includes('mound')) wrong[0] = 'mound';
  const why: Record<Shape, string> = {
    right: 'Most values are low and a long tail stretches to the right (the high values): skewed right.',
    left: 'Most values are high and a long tail stretches to the left (the low values): skewed left.',
    mound: 'One peak in the middle, and the two sides mirror each other: symmetric with one peak.',
    uniform: 'All the bars are about the same height: uniform. It is symmetric, but it has no peak.',
    bimodal: 'Two separate peaks with a dip between them: bimodal (here two groups, kids and adults).',
  };
  const opts: Opt[] = [s, ...wrong].map(k => ({
    t: SHAPES[k], ok: k === s,
    mc: k === s ? undefined : (s === 'right' && k === 'left') || (s === 'left' && k === 'right') ? MC.peak : s === 'uniform' && k === 'mound' ? MC.bell : s === 'bimodal' && k === 'mound' ? MC.clusters : undefined,
    say: k === s ? why[s] : (s === 'right' && k === 'left') || (s === 'left' && k === 'right') ? 'Skew is named by the long TAIL, not by the peak. Which side does the tail stretch to?' : why[s],
  }));
  return choice(R, {
    id: `shapeName-${n}`, family: 'shapeName',
    prompt: `The histogram shows the ${cx.what.replace('{n}', String(N))}. How would you describe its shape?`,
    board: `n = ${N}\\qquad \\text{shape?}`,
    picture: { plot: { axis, panels: [{ key: 'A', kind: 'hist', data: sorted(data), bins: { start: cx.start, width: cx.w } }] } },
    solution: [why[s]],
  }, opts);
};

export const shapeFeature: Gen = (R, n) => {
  const c = ctxPick(R, ['commute', 'points', 'quiz']);
  const n1 = int(R, 5, 9), n2 = int(R, 3, 7), a = c.id === 'quiz' ? int(R, 2, 4) : int(R, c.lo, c.lo + 3), w1 = int(R, 3, 5), gap = int(R, 5, 8), w2 = int(R, 2, 4);
  const b = a + w1 + gap;
  if (b + w2 > c.hi) return shapeFeature(R, n + 1, undefined);
  const cl = (lo: number, w: number, k: number) => until(() => Array.from({ length: k }, () => int(R, lo, lo + w)), x => { const s = [...new Set(x)].sort((p, q) => p - q); return s[0] === lo && s[s.length - 1] === lo + w && s.every((v, i) => i === 0 || v - s[i - 1]! <= 2); });
  const lower = cl(a, w1, n1), upper = cl(b, w2, n2);
  const askUpper = R() < 0.6, data = sorted([...lower, ...upper]), N = data.length;
  const ax = axisOf(c, data[0]!, data[N - 1]!, { step: 1, ticks: [10, 26] });
  if (ax.max - ax.min > 26) ax.step = 2;
  const ansV = askUpper ? n2 : n1;
  return numItem({
    id: `shapeFeature-${n}`, family: 'shapeFeature',
    prompt: `The dot plot shows ${phrase(c, N)}. There is a gap with no values. How many ${c.id === 'points' ? 'games' : 'students'} are in the cluster ${askUpper ? 'above' : 'below'} the gap?`,
    board: `\\text{gap: } ${a + w1} \\text{ to } ${b}`, unit: c.id === 'points' ? 'games' : 'students',
    picture: { plot: { axis: ax, panels: [dotP('A', data)], marks: [{ kind: 'band', key: 'gap', a: a + w1, b, col: 'pick', label: 'gap' }] } },
    solution: [`No values between ${a + w1} and ${b}: that is the gap.`, `The cluster ${askUpper ? 'above' : 'below'} it has <b class="s">${ansV}</b> dots.`],
  }, ansV, 'Yes.', [[N, undefined, 'That counts every dot. Count only the cluster on one side of the gap.'], [askUpper ? n1 : n2, undefined, `That is the other cluster. Count the dots ${askUpper ? 'above' : 'below'} the gap.`]], 'Find the empty stretch, then count the dots on that side.');
};

// ===================== boxplot-approx-quarters =====================
const QUART_SPANS: [keyof ReturnType<typeof five>, keyof ReturnType<typeof five>, number][] = [
  ['min', 'q1', 25], ['q1', 'med', 25], ['med', 'q3', 25], ['q3', 'max', 25], ['q1', 'q3', 50], ['med', 'max', 50], ['min', 'med', 50], ['q1', 'max', 75], ['min', 'q3', 75],
];
const NAMEOF = { min: 'the minimum', q1: 'Q1', med: 'the median', q3: 'Q3', max: 'the maximum' } as const;
function unevenSet(R: () => number, N: number, lo: number, hi: number, grid = 1): number[] {
  return until(() => { const xs = new Set<number>(); while (xs.size < N) xs.add(grid * int(R, Math.ceil(lo / grid), Math.floor(hi / grid))); return sorted([...xs]); }, x => {
    const f = five(x), L = [f.q1 - f.min, f.med - f.q1, f.q3 - f.med, f.max - f.q3];
    return Math.max(...L) >= 2.2 * Math.min(...L) && Math.min(...L) >= 1 && Number.isInteger(f.q1) && Number.isInteger(f.q3);
  });
}
export const boxPercent: Gen = (R, n) => {
  const c = ctxPick(R, ['test', 'height', 'commute', 'reaction']);
  const N = pick(R, [7, 11, 15]);
  const data = unevenSet(R, N, c.lo, Math.min(c.hi, c.lo + (c.id === 'reaction' ? 140 : 30)), c.id === 'reaction' ? 5 : 1);
  const f = five(data);
  const [p, q, pct] = pick(R, QUART_SPANS);
  const ax = axisOf(c, f.min, f.max, { ticks: [8, 16] });
  const L = { min: f.q1 - f.min, q1: f.med - f.q1, med: f.q3 - f.med, q3: f.max - f.q3 } as Record<string, number>;
  const single = pct === 25, longest = single && L[p as string]! === Math.max(...Object.values(L));
  const opts: Opt[] = [25, 50, 75, 100].map(v => ({
    t: `About ${v}%`, ok: v === pct,
    mc: v === pct ? undefined : single && v > pct && longest ? MC.lenCount : v === 100 ? undefined : undefined,
    say: v === pct ? `Yes: the five numbers cut the ordered data into four groups of about the same count. That stretch is ${pct / 25} of them.` : single && longest && v > pct ? 'A long section is not a big group. Each section holds about a quarter of the values; a long one is just more spread out.' : 'Count the sections between the two numbers: each holds about a quarter of the values.',
  }));
  return choice(R, {
    id: `boxPercent-${n}`, family: 'boxPercent',
    prompt: `The box plot (with its dot plot) shows ${phrase(c, N)}. About what percent of the values lie between ${NAMEOF[p]} (${H(f[p])}) and ${NAMEOF[q]} (${H(f[q])})?`,
    board: `${H(f[p])} \\text{ to } ${H(f[q])}`,
    picture: { plot: { axis: ax, panels: [dotP('D', data), { key: 'B', kind: 'box', data }] } },
    solution: [`The box plot’s five numbers cut the data into four groups of about equal count, a quarter each.`, `From ${NAMEOF[p]} to ${NAMEOF[q]} is ${pct / 25} section${pct > 25 ? 's' : ''}: about ${pct}%.`],
  }, opts, true);
};

export const boxTruth: Gen = (R, n) => {
  const c = ctxPick(R, ['test', 'height', 'commute', 'reaction', 'homerun']);
  const N = pick(R, [7, 11, 15]);
  const data = unevenSet(R, N, c.lo, Math.min(c.hi, c.lo + (c.id === 'reaction' || c.id === 'homerun' ? 120 : 30)), c.id === 'reaction' || c.id === 'homerun' ? 5 : 1);
  const f = five(data), loW = f.q1 - f.min, hiW = f.max - f.q3;
  if (Math.abs(loW - hiW) < 1e-9) return boxTruth(R, n + 1000, undefined);
  const longer = hiW > loW ? 'upper' : 'lower', shorter = longer === 'upper' ? 'lower' : 'upper';
  const rightV = pick(R, ['half', 'tail', 'peaks']);
  const right: Opt = rightV === 'half' ? { t: `About half of the values lie between ${H(f.q1)} and ${H(f.q3)}.`, ok: true, say: 'Yes: Q1 to Q3 is two of the four sections, about half the data.' }
    : rightV === 'tail' ? { t: `The ${longer} quarter of the values is more spread out than the ${shorter} quarter.`, ok: true, say: 'Yes: a longer whisker means the same share of values spread over a longer stretch.' }
      : { t: 'The box plot cannot show whether the data has two peaks.', ok: true, say: 'Yes: a box plot keeps only five numbers. Peaks, gaps and clusters are hidden.' };
  const wrongs: Opt[] = [
    { t: `The ${longer} whisker holds more values than the ${shorter} whisker.`, mc: MC.lenCount, say: 'Each whisker covers about a quarter of the values. Longer means more spread out, not more values.' },
    { t: 'The line inside the box is the mean.', mc: MC.hidden, say: 'The line inside the box is the median. A box plot does not show the mean.' },
    { t: `Exactly 25% of the ${N} values are below Q1.`, mc: MC.quarter, say: `With ${N} values, a quarter is not a whole number of values: the sections hold ABOUT a quarter each.` },
    ...(rightV !== 'peaks' ? [{ t: 'The box plot shows that the data has one peak.', mc: MC.hidden, say: 'A box plot hides the number of peaks: two very different data sets can have the same box plot.' }] : []),
  ];
  return choice(R, {
    id: `boxTruth-${n}`, family: 'boxTruth',
    prompt: `The box plot summarizes ${phrase(c, N)}. Which statement is true?`,
    board: `n = ${N}`,
    picture: { plot: { axis: axisOf(c, f.min, f.max, { ticks: [8, 16] }), panels: [{ key: 'B', kind: 'box', data, weight: 1 }] } },
    solution: ['A box plot shows five numbers: min, Q1, median, Q3, max. They cut the ordered data into four groups of about equal count.', 'Section lengths show spread, not counts; peaks and the mean are hidden.'],
  }, [right, ...shuffle(R, wrongs).slice(0, 3)]);
};

// ===================== unusual-value-informal =====================
export const unusualWhere: Gen = (R, n) => {
  const c = ctxPick(R, ['commute', 'points', 'quiz']);
  const top = Math.min(c.hi, 30);
  const V = int(R, Math.max(c.lo + 12, 14), top - 2);
  const cA = V - int(R, 10, 12);
  const a = until(() => [...Array.from({ length: int(R, 7, 10) }, () => cA + int(R, -3, 3)), V], x => isOutlier(V, fences(five(x))) && sorted(x)[x.length - 2]! <= V - 7);
  const b = until(() => [...Array.from({ length: int(R, 7, 10) }, () => V + int(R, -6, 3)), V], x => !outs(x).length && sorted(x).filter(v => Math.abs(v - V) <= 2).length >= 3);
  const isoFirst = R() < 0.5;
  const [N0, N1] = groupsOf(R, c);
  const A0 = isoFirst ? a : b, B0 = isoFirst ? b : a, iso = isoFirst ? N0 : N1;
  const opts: Opt[] = [
    { t: `Only in ${N0}`, ok: isoFirst, say: isoFirst ? `Yes: in ${N0} it sits far from all the other values; in ${N1} it is right among them.` : `In ${N0}, ${V} sits among the other values.` },
    { t: `Only in ${N1}`, ok: !isoFirst, say: !isoFirst ? `Yes: in ${N1} it sits far from all the other values; in ${N0} it is right among them.` : `In ${N1}, ${V} sits among the other values.` },
    { t: 'In both: it is the same value', mc: MC.statusFixed, say: 'Unusual is relative to the rest of the data. The same value can be ordinary in one set and far out in another.' },
    { t: 'In neither', say: `In ${iso}, ${V} is far from every other value.` },
  ];
  const all = [...a, ...b];
  const ax = axisOf(c, Math.min(...all), Math.max(...all), { step: Math.max(...all) - Math.min(...all) > 22 ? 2 : 1, ticks: [8, 20] });
  return choice(R, {
    id: `unusualWhere-${n}`, family: 'unusualWhere',
    prompt: `Both dot plots show ${manyOf(c)}, and both contain the value ${V}. In which data set is ${V} unusual?`,
    board: `\\text{value } ${V}`,
    picture: { plot: { axis: ax, panels: [dotP('A', sorted(A0), N0), dotP('B', sorted(B0), N1)] } },
    solution: [`In ${iso}, the next value below ${V} is ${H(sorted(a)[a.length - 2]!)}: a wide empty stretch.`, `In the other set, ${V} sits among the other values.`],
  }, opts, true);
};
const outs = (x: number[]) => { const F = fences(five(x)); return x.filter(v => isOutlier(v, F)); };

export const unusualMax: Gen = (R, n) => {
  const c = ctxPick(R, ['commute', 'points']);
  const iso = R() < 0.5, base = int(R, c.lo + 1, c.lo + 5), N = int(R, 8, 12);
  const data = until(() => {
    const xs = Array.from({ length: N - 1 }, () => base + int(R, 0, 7));
    const mx = Math.max(...xs);
    xs.push(iso ? mx + int(R, 9, 12) : mx + int(R, 0, 1));
    return sorted(xs);
  }, x => x[x.length - 1]! <= c.hi && (iso ? outs(x).length === 1 && x[x.length - 1]! - x[x.length - 2]! >= 8 : outs(x).length === 0 && x[x.length - 1]! - x[x.length - 2]! <= 1));
  const M = data[N - 1]!;
  const opts: Opt[] = [
    { t: 'Yes: it is far from all the other values', ok: iso, say: iso ? `Yes: the next value is ${data[N - 2]}, far below ${M}.` : `${M} is right next to the other values.` },
    { t: 'No: it sits close to the other values', ok: !iso, say: !iso ? `Yes: ${M} is the largest, but it sits right next to ${data[N - 2]}.` : `Look at the empty stretch between ${data[N - 2]} and ${M}.` },
    ...(iso ? [] : [{ t: 'Yes: the largest value of a data set is always unusual', mc: MC.extreme, say: 'Every data set has a largest value. It is unusual only when it sits far from the rest.' }]),
    { t: 'Only if it is a mistake', mc: MC.mustBeError, say: 'Unusual values can be real (a long bus ride, a great game). Unusual is about distance from the rest, not about being an error.' },
  ];
  return choice(R, {
    id: `unusualMax-${n}`, family: 'unusualMax',
    prompt: `The dot plot shows ${phrase(c, N)}. Is the largest value, ${M}, unusual compared with the rest?`,
    board: `\\max = ${M}`,
    picture: { plot: { axis: axisOf(c, data[0]!, M, { step: M - data[0]! > 22 ? 2 : 1, ticks: [8, 22] }), panels: [dotP('A', data)], hot: { panel: 'A', idx: [N - 1] } } },
    solution: [`The next largest value is ${data[N - 2]}, ${M - data[N - 2]!} ${un(c, M - data[N - 2]!)} below ${M}.`, iso ? `${M} sits far from all the rest: unusual.` : `${M} sits right next to the others: not unusual, just the largest.`],
  }, opts);
};

// ===================== deviation-from-mean =====================
/** n whole values in [lo, hi] with a whole mean (and a median different from it) */
function wholeMeanSet(R: () => number, N: number, lo: number, hi: number, extra: (x: number[]) => boolean = () => true): number[] {
  return until(() => Array.from({ length: N }, () => int(R, lo, hi)), x => Number.isInteger(mean(x)) && extra(x));
}
export const devOne: Gen = (R, n) => {
  const c = ctxPick(R, ['quiz', 'points', 'commute']);
  const N = int(R, 4, 8), lo = Math.max(c.lo, 2), hi = Math.min(c.hi, 20);
  const data = sorted(wholeMeanSet(R, N, lo, hi, x => Math.abs(median(x) - mean(x)) >= 1 && range(x) >= 6));
  const m = mean(data), md = median(data);
  const v = until(() => pick(R, data), x => x !== m && Math.abs(Math.abs(x - md) - Math.abs(x - m)) > 1e-9);
  const d = Math.abs(v - m), idx = data.indexOf(v);
  return numItem({
    id: `devOne-${n}`, family: 'devOne',
    prompt: `The dot plot shows ${phrase(c, N)}. Their mean is ${m} (the triangle). How far is the colored dot, ${v}, from the mean?`,
    board: `\\bar{x} = ${m}\\qquad |${v} - ${m}| = \\,?`, unit: c.unit,
    picture: { plot: { axis: axisOf(c, Math.min(...data, m), Math.max(...data, m), { step: 1, ticks: [8, 20] }), panels: [dotP('A', data)], marks: [{ kind: 'fulcrum', key: 'f', panel: 'A', x: m, col: 'link', label: `mean ${m}` }], hot: { panel: 'A', idx: [idx] }, solveMarks: [{ kind: 'devs', key: 'dv', panel: 'A', about: m, col: 'pick' }] } },
    solution: [`Count along the axis from ${v} to the mean ${m}.`, `The distance is <b class="s">${d}</b> ${un(c, d)}: a distance is never negative.`],
  }, d, `Yes: ${v} is ${d} from the mean.`, [
    [-d, MC.signedCancel, `A distance is never negative: ${v} is ${d} ${un(c, d)} ${v < m ? 'below' : 'above'} the mean.`],
    [Math.abs(v - md), MC.otherRef, `That is the distance to the median (${H(md)}). Measure from the mean, ${m}.`],
  ], `Count the steps along the axis from ${v} to ${m}.`);
};

export const devBalance: Gen = (R, n) => {
  const c = ctxPick(R, ['quiz', 'points', 'commute', 'battery']);
  const N = int(R, 5, 8), lo = Math.max(c.lo, 2), hi = Math.min(c.hi, 20);
  const full = wholeMeanSet(R, N, lo, hi, x => range(x) >= 5);
  const m = mean(full), miss = until(() => pick(R, full), x => Math.abs(x - m) >= 2);
  const known = full.slice(); known.splice(known.indexOf(miss), 1);
  const ks = sorted(known), mk = mean(known);
  const above = sum(ks.filter(v => v > m).map(v => v - m)), below = sum(ks.filter(v => v < m).map(v => m - v));
  return numItem({
    id: `devBalance-${n}`, family: 'devBalance',
    prompt: `${N} values have mean ${m}: ${phrase(c, N)}. The dot plot shows ${N - 1} of them. What is the missing value?`,
    board: `\\bar{x} = ${m}\\qquad ${listT(ks, 8).replace(/ \\qquad /g, ',\\ ')},\\ ?`, unit: c.unit,
    picture: { plot: { axis: axisOf(c, Math.min(...full), Math.max(...full), { step: 1, ticks: [8, 20] }), panels: [dotP('A', ks)], marks: [{ kind: 'fulcrum', key: 'f', panel: 'A', x: m, col: 'link', label: `mean ${m}` }], solveMarks: [{ kind: 'devs', key: 'dv', panel: 'A', about: m, col: 'pick' }] } },
    solution: [
      `The mean is the balance point: the total distance above it equals the total distance below it.`,
      `Known values: ${fmt(above)} above and ${fmt(below)} below. The missing value must make up the difference: it is ${fmt(Math.abs(above - below))} ${miss > m ? 'above' : 'below'} ${m}.`,
      `Missing value: <b class="s">${miss}</b> (check: the ${N} values add to ${N} × ${m} = ${N * m}).`,
    ],
  }, miss, `Yes: with ${miss}, the plot balances at ${m}.`, [
    [mk, MC.missMeanKnown, 'That is the mean of the values you can see. The missing value has to pull the balance point to the given mean.'],
    [m, MC.missIsMean, `If the missing value were ${m}, the others would still have to balance at ${m}. They don’t.`],
  ], `The total of all ${N} values is ${N} × ${m} = ${N * m}. Subtract the values you know.`);
};

// ===================== mad-typical-distance =====================
function madSet(R: () => number, lo: number, hi: number): number[] {
  return until(() => Array.from({ length: int(R, 4, 8) }, () => int(R, lo, hi)), x => Number.isInteger(mean(x)) && Number.isInteger(mad(x)) && mad(x) >= 1 && Math.abs(mad(x) - range(x) / 2) > 1e-9 && range(x) >= 4);
}
export const madCompute: Gen = (R, n) => {
  const c = ctxPick(R, ['quiz', 'points', 'commute', 'battery']);
  const lo = Math.max(c.lo, 2), hi = Math.min(c.hi, 20);
  const data = sorted(madSet(R, lo, hi)), N = data.length, m = mean(data), D = data.map(v => Math.abs(v - m)), M = mad(data);
  const uniq = [...new Set(data)], uD = uniq.map(v => Math.abs(v - m));
  return numItem({
    id: `madCompute-${n}`, family: 'madCompute',
    prompt: `The dot plot shows ${phrase(c, N)}: ${listH(data)}. The mean is ${m}. Find the MAD (the mean of the distances from the mean).`,
    board: `\\bar{x} = ${m}\\qquad \\text{MAD} = \\,?`, unit: c.unit,
    picture: { plot: { axis: axisOf(c, data[0]!, data[N - 1]!, { step: 1, ticks: [8, 20] }), panels: [dotP('A', data)], marks: [{ kind: 'fulcrum', key: 'f', panel: 'A', x: m, col: 'link', label: `mean ${m}` }], solveMarks: [{ kind: 'devs', key: 'dv', panel: 'A', about: m, col: 'pick' }] } },
    solution: [`Distances from ${m}: ${D.join(', ')}.`, `Their total is ${sum(D)}; there are ${N} of them.`, `MAD = ${sum(D)} ÷ ${N} = <b class="s">${M}</b> ${un(c, M)}.`],
  }, M, `Yes: the values are typically ${M} ${un(c, M)} from the mean.`, [
    [sum(D), MC.madSum, `${sum(D)} is the total distance. The MAD is its mean: divide by ${N}.`],
    [range(data) / 2, MC.madHalfRange, 'That is half the range. The MAD averages the distance of EVERY value from the mean.'],
    ...(uniq.length < N ? [[r9(sum(uD) / uniq.length), MC.repeatedOnce, `Repeated values each count: there are ${N} values, not ${uniq.length}.`] as [number, string, string]] : []),
  ], `Find each value’s distance from ${m}, add them, and divide by ${N}.`);
};

export const madMeaning: Gen = (R, n) => {
  const c = ctxPick(R, ['quiz', 'points', 'commute']);
  const lo = Math.max(c.lo, 2), hi = Math.min(c.hi, 26);
  const m = int(R, lo + 8, hi - 8);
  const a = until(() => symSet(R, m, int(R, 5, 8), 3), x => Number.isInteger(mad(x)) && mad(x) >= 2);
  const b = until(() => symSet(R, m, int(R, 5, 8), 8, 2), x => Number.isInteger(mad(x)) && mad(x) >= mad(a) + 2 && Math.abs(range(x) - 2 * mad(x)) > 1e-9);
  const swap = R() < 0.5;
  const [N0, N1] = ['Class A', 'Class B'];
  const A0 = swap ? b : a, B0 = swap ? a : b, wide = swap ? N0 : N1, narrow = swap ? N1 : N0;
  const mw = mad(b), mn = mad(a), u = c.unit;
  const opts: Opt[] = [
    { t: `${wide}’s values are typically about ${mw} ${u} from the mean, ${narrow}’s about ${mn}: ${wide} is more spread out.`, ok: true, say: 'Yes: the MAD is a typical distance from the mean.' },
    { t: `A typical ${wide} value is ${mw} ${u}.`, mc: MC.spreadAsCenter, say: `The MAD is a distance from the mean, not a typical value. A typical ${wide} value is near ${m}.` },
    { t: `${narrow} is more spread out, because its MAD is smaller.`, say: 'A smaller MAD means the values sit closer to the mean: less spread.' },
    { t: `${wide}’s range is ${2 * mw} ${u}, because the MAD is half the range.`, mc: MC.madHalfRange, say: `The MAD is not half the range. ${wide}’s range is ${range(b)} ${u}.` },
  ];
  return choice(R, {
    id: `madMeaning-${n}`, family: 'madMeaning',
    prompt: `Both data sets have mean ${m} ${u}. ${N0} has MAD ${mad(A0)} ${u}; ${N1} has MAD ${mad(B0)} ${u}. Which statement is true?`,
    board: `\\text{MAD}_A = ${mad(A0)}\\qquad \\text{MAD}_B = ${mad(B0)}`,
    picture: { plot: { axis: axisOf(c, Math.min(...a, ...b), Math.max(...a, ...b), { step: Math.max(...b) - Math.min(...b) > 22 ? 2 : 1, ticks: [8, 22] }), panels: [dotP('A', sorted(A0), N0), dotP('B', sorted(B0), N1)] } },
    solution: [`The MAD is the typical distance of a value from the mean.`, `${wide}: ${mw} ${u}; ${narrow}: ${mn} ${u}. Larger MAD, more spread.`],
  }, opts);
};

// ===================== sd-meaning =====================
export const sdRank: Gen = (R, n) => {
  const c = ctxPick(R, ['quiz', 'points', 'commute']);
  if (R() < 0.35) {
    // the curated contrast: same mean, same MAD, different SD ({m ± d, m ± d} vs {m − 2d, m, m, m + 2d})
    const d = int(R, 2, 4), m = int(R, Math.max(c.lo, 2) + 2 * d + 1, Math.min(c.hi, 26) - 2 * d - 1);
    const a = [m - d, m - d, m + d, m + d], b = [m - 2 * d, m, m, m + 2 * d];
    const swap = R() < 0.5, [P0, P1] = swap ? [b, a] : [a, b], big = swap ? 'Set A' : 'Set B';
    const opts: Opt[] = [
      { t: 'Set A has the larger SD', ok: swap, say: swap ? 'Yes: its distances (0, 0 and two of 2d) are less even, and the SD weights the large ones more.' : 'Set A’s distances are all equal; Set B has two large distances, and the SD weights large distances more.' },
      { t: 'Set B has the larger SD', ok: !swap, say: !swap ? 'Yes: two values sit far out and two sit on the mean. The SD weights the large distances more.' : 'Set B’s distances are all equal; Set A has two large distances, and the SD weights large distances more.' },
      { t: 'The SDs are equal, because the MADs are equal', mc: MC.sdIsMad, say: 'The SD is a different measure from the MAD: it squares the distances, so large distances count more.' },
    ];
    return choice(R, {
      id: `sdRank-${n}`, family: 'sdRank',
      prompt: `Set A: ${listH(P0)}. Set B: ${listH(P1)}. Both have mean ${m} and MAD ${d}. Which has the larger SD (${RULE.sd.replace('SD means ', '')})?`,
      board: `\\bar{x} = ${m}\\qquad \\text{MAD} = ${d}`,
      picture: { plot: { axis: axisOf(c, m - 2 * d, m + 2 * d, { step: 1, ticks: [8, 20] }), panels: [dotP('A', sorted(P0), 'Set A'), dotP('B', sorted(P1), 'Set B')] } },
      solution: [`Distances: one set has ${d}, ${d}, ${d}, ${d}; the other ${2 * d}, 0, 0, ${2 * d}.`, `SD: ${d} for the even distances, about ${H(d * Math.SQRT2, 1)} for the uneven ones. ${big} is larger.`],
    }, opts, true);
  }
  const m = int(R, Math.max(c.lo, 2) + 9, Math.min(c.hi, 28) - 9);
  const sets = until(() => [symSet(R, m, int(R, 6, 9), 2), symSet(R, m, int(R, 6, 9), 5, 1), symSet(R, m, int(R, 6, 9), 9, 4)],
    s => sdPop(s[1]!) > 1.4 * sdPop(s[0]!) && sdPop(s[2]!) > 1.3 * sdPop(s[1]!) && s.every(x => Math.min(...x) >= 0));
  const order = shuffle(R, [0, 1, 2]);   // panel i shows sets[order[i]]
  const names = ['A', 'B', 'C'];
  const byRank = [0, 1, 2].map(r => names[order.indexOf(r)]!);   // smallest to largest SD
  const perms = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]].map(p => p.map(i => byRank[i]!).join(', '));
  const rightT = perms[0]!;
  const tallest = [0, 1, 2].map(i => maxStack(sets[order[i]!]!));
  const opts: Opt[] = shuffle(R, perms.slice(1)).slice(0, 3).map(t => ({ t, say: 'Look at how far the dots sit from the middle, not at how tall the stacks are.', mc: t === perms[5] && tallest.every(Boolean) ? MC.heights : undefined }));
  opts.push({ t: rightT, ok: true, say: `Yes: ${byRank[0]} hugs the mean, ${byRank[2]} spreads widest.` });
  return choice(R, {
    id: `sdRank-${n}`, family: 'sdRank',
    prompt: `All three data sets have mean ${m}. Without calculating, order them from smallest SD to largest SD.`,
    board: `\\sigma:\\ \\text{smallest} \\to \\text{largest}`,
    picture: { plot: { axis: axisOf(c, m - 9, m + 9, { step: 2, ticks: [8, 12] }), panels: names.map((nm, i) => dotP(nm, sorted(sets[order[i]!]!), `Set ${nm}`)) } },
    solution: [`SD: ${names.map((nm, i) => `${nm} ${H(sdPop(sets[order[i]!]!), 1)}`).join(', ')}.`, `The SD grows as the values sit farther from the mean.`],
  }, opts.map(o => ({ ...o, t: o.t.replace(/(\w), (\w), (\w)/, '$1, $2, $3') })));
};

export const sdTransform: Gen = (R, n) => {
  const kind = pick(R, ['shift', 'shift', 'scale', 'unit']);
  const C = kind === 'shift' ? pick(R, [CTX.temp!, CTX.quiz!]) : kind === 'scale' ? CTX.sneaker! : pick(R, [CTX.sleep!, CTX.commute!]);
  const N = int(R, 6, 10);
  const grid = C.id === 'sleep' ? 0.5 : C.id === 'sneaker' ? 5 : 1;
  const data = until(() => Array.from({ length: N }, () => roundD(Math.round(val(R, C.id === 'quiz' ? 4 : C.lo, C.id === 'quiz' ? 16 : C.hi - (C.id === 'sneaker' ? 60 : 0), 1) / grid) * grid, 1)), x => tenth(sdPop(x)) !== null && tenth(sdPop(x)) !== 1 && sdPop(x) > (C.id === 'sleep' ? 0.4 : 1));
  const s = tenth(sdPop(data))!;
  const k = kind === 'shift' ? (C.id === 'temp' ? int(R, 3, 6) : int(R, 2, 3)) : kind === 'scale' ? 2 : C.id === 'sleep' ? 60 : 60;
  const story = kind === 'shift' ? (C.id === 'temp' ? `The thermometer read ${k}°F too low, so every reading is raised by ${k}°F.` : `The teacher adds ${k} bonus points to every score.`)
    : kind === 'scale' ? 'The store doubles every price.' : C.id === 'sleep' ? 'Every value is changed from hours to minutes (× 60).' : 'Every value is changed from minutes to seconds (× 60).';
  const newU = kind === 'unit' ? (C.id === 'sleep' ? 'minutes' : 'seconds') : C.unit;
  const ansV = kind === 'shift' ? s : r9(k * s), alt = kind === 'shift' ? s : tenth(k * sdPop(data)) ?? r9(k * s);
  const ax = axisOf(C, Math.min(...data), Math.max(...data) + (kind === 'shift' ? k : 0), { ticks: [8, 16] });
  const panels: DPanel[] = [dotP('A', sorted(data), 'Before')];
  if (kind === 'shift') panels.push(dotP('B', sorted(data.map(v => r9(v + k))), 'After'));
  return numItem({
    id: `sdTransform-${n}`, family: 'sdTransform',
    prompt: `The SD of ${phrase(C, N)} is ${C.id === 'temp' ? H(s) + '°F' : H(s) + ' ' + C.unit}. ${story} What is the new SD${kind === 'unit' ? ` in ${newU}` : ''}?`,
    board: `\\sigma = ${H(s)}\\qquad \\sigma_{\\text{new}} = \\,?`, unit: newU,
    picture: { plot: { axis: ax, panels, ...(kind === 'shift' ? { solveMarks: [vline('mA', mean(data), 'mean', 'link', ['A']), vline('mB', r9(mean(data) + k), 'mean', 'link', ['B'])] } : {}) } },
    solution: kind === 'shift'
      ? [`Every value moves up ${k}, and so does the mean: each distance to the mean stays the same.`, `The SD is built from those distances: it stays <b class="s">${H(s)}</b> ${C.unit}.`]
      : [`Multiplying every value by ${k} multiplies every distance from the mean by ${k}.`, `New SD: ${k} × ${H(s)} = <b class="s">${H(ansV)}</b> ${newU}.`],
  }, ansV, kind === 'shift' ? 'Yes: sliding every value keeps the spread.' : `Yes: the spread stretches by the factor ${k}.`, [
    ...(kind === 'shift' ? [[r9(s + k), MC.shiftSpread, `Adding ${k} to every value moves the whole plot; the distances between the values do not change.`] as [number, string, string]] : [[s, MC.shiftSpread, `Multiplying by ${k} stretches the distances too: the SD is multiplied by ${k}.`] as [number, string, string]]),
  ], kind === 'shift' ? 'Does adding the same number to every value change how far apart they are?' : `Each distance from the mean is multiplied by ${k}.`, { also: [alt] });
};
