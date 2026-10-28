// famA.ts: practice families for the first stage of "The normal distribution": density scale, density curves, event
// notation, the shape and the two parameters, the SD-scaled axis, reporting a model area, and the 68-95-99.7 benchmarks
// (central, halves, tails, bands). Pure: no DOM.
import {
  type Gen, type NBar, type NCtx, type NItem, type NPic, type Opt, A, B, CTX, MC, NN, NT, a4, choice, cnt, ctxById, ctxPick, fix, fmt,
  int, modelPick, normalCurve, numItem, pick, sdAxis, shuffle, until, withU,
} from './common';
import { CENTRAL, HALF, bandPct, benchPct, dnorm, normalcdf, r9, roundTo } from './normMaths';

const S = (s: string | number) => `<b class="s">${s}</b>`;
const PCT_OK = 'Yes.';

// ===================== density histograms =====================
interface Hist { c: NCtx; start: number; w: number; k: number; per: string; who: string; m: number; s: number }
const HISTS: Omit<Hist, 'm' | 's'>[] = [
  { c: ctxById('women'), start: 56, w: 2, k: 8, per: 'per inch', who: 'adult women' },
  { c: ctxById('newborn'), start: 3, w: 1, k: 9, per: 'per pound', who: 'newborns' },
  { c: ctxById('dog'), start: 45, w: 5, k: 8, per: 'per pound', who: 'golden retrievers' },
  { c: ctxById('temp'), start: 64, w: 4, k: 8, per: 'per °F', who: 'May days' },
];
/** units per bin (density = units x 0.01, relative frequency = units x 0.01 x w), from the model's areas + noise */
function histUnits(R: () => number, H: Hist, noise: number): number[] {
  const U = Math.round(100 / H.w);
  const edges = Array.from({ length: H.k + 1 }, (_, i) => H.start + i * H.w);
  const areas = edges.slice(0, -1).map((a, i) => normalcdf(i === 0 ? -1e9 : a, i === H.k - 1 ? 1e9 : edges[i + 1]!, H.m, H.s));
  const u = areas.map(p => Math.max(1, Math.round(p * U + (noise ? (R() * 2 - 1) * noise : 0))));
  let diff = U - u.reduce((a, b) => a + b, 0);
  while (diff !== 0) { const i = u.indexOf(Math.max(...u)) + (diff < 0 ? 0 : int(R, -1, 1)); const j = Math.min(H.k - 1, Math.max(0, i)); if (u[j]! + Math.sign(diff) >= 1) { u[j]! += Math.sign(diff); diff -= Math.sign(diff); } }
  return u;
}
function histOf(R: () => number): Hist {
  const h = pick(R, HISTS);
  const [m, s] = modelPick(R, h.c);
  return { ...h, m, s };
}
const dens = (u: number) => roundTo(u * 0.01, 2);
function histCard(H: Hist, u: number[], o: { labels?: boolean; skip?: number; cols?: Record<number, 'pick' | 'water' | 'first' | 'second'>; curve?: boolean; shade?: [number, number] } = {}): NPic['card'] {
  const top = Math.max(...u.map(dens));
  const want = top * (o.labels ? 1.3 : 1.12);
  const step = [0.01, 0.02, 0.05, 0.1].find(st => Math.ceil(r9(want / st)) <= 12) ?? 0.1;
  const max = r9(Math.ceil(r9(want / step)) * step);
  const bars: NBar[] = u.map((v, i) => ({ lo: H.start + i * H.w, hi: H.start + (i + 1) * H.w, h: dens(v), col: o.cols?.[i] })).filter((_, i) => i !== o.skip);
  const texts = o.labels ? u.map((v, i) => ({ key: `t${i}`, x: H.start + (i + 0.5) * H.w, at: (dens(v) + max * 0.07) / max, text: i === o.skip ? '?' : fix(dens(v), 2) })) : [];
  if (o.skip !== undefined) texts[o.skip] = { key: `t${o.skip}`, x: H.start + (o.skip + 0.5) * H.w, at: 0.1, text: '?' };
  return {
    x: { min: H.start, max: H.start + H.k * H.w, step: H.w, name: H.c.axis },
    y: { max, step, name: `Density (${H.per})`, dec: 2 },
    bars, texts,
    curves: o.curve ? [normalCurve(H.m, H.s, 'C', 'link')] : undefined,
    shades: o.curve && o.shade ? [{ key: 'sh', lo: o.shade[0], hi: o.shade[1], on: 'C', col: 'pick' }] : undefined,
  };
}
/** a density histogram card for a context (model + noise): the data picture of "a roughly symmetric histogram" */
export function histCardFor(R: () => number, id: string): { card: NonNullable<NPic['card']>; m: number; s: number } {
  const h = HISTS.find(x => x.c.id === id) ?? HISTS[0]!;
  const [m, s] = modelPick(R, h.c), H = { ...h, m, s };
  return { card: histCard(H, histUnits(R, H, 1.5))!, m, s };
}
const rangeW = (H: Hist, i: number) => `${fmt(H.start + i * H.w)} to ${fmt(H.start + (i + 1) * H.w)}`;
const uLabel = (H: Hist) => (H.c.unit === '°F' ? '°F' : ` ${H.c.unit}`);

export const densArea: Gen = (R, n) => {
  const H = histOf(R), u = histUnits(R, H, 1.5);
  const i = int(R, 1, H.k - 2), d = dens(u[i]!), p = roundTo(d * H.w, 2), N = pick(R, H.c.Ns);
  const lo = H.start + i * H.w, hi = lo + H.w;
  return numItem({
    id: `dens-area-${n}`, family: 'densArea',
    prompt: `A density-scaled histogram of the ${H.c.what}s of ${cnt(N)} ${H.who}: bins ${H.w}${uLabel(H)} wide, and each bar's height is the relative frequency ${H.per} (the number on top). What proportion of the ${H.who} fall in the bin from ${A(withU(H.c, lo))} up to (not including) ${A(withU(H.c, hi))}?`,
    board: `\\text{width} \\times \\text{height} = \\,?`,
    picture: { card: histCard(H, u, { labels: true, cols: { [i]: 'pick' } }) },
    solution: [`On a density scale a bar's <b>area</b> is the proportion: width × height.`, `${H.w} × ${fix(d, 2)} = ${S(fix(p, 2))}`],
    ex: { w: H.w, d, p },
  }, p, 'plain', `Yes: ${H.w} × ${fix(d, 2)} = ${fix(p, 2)}, so ${fmt(p * 100)}% of them.`, [
    [d, MC.heightProb, `${fix(d, 2)} is the bar's height, a density ${H.per}. The proportion is the bar's area: width × height.`],
    [roundTo(d / H.w, 4), MC.heightProb, 'Multiply, do not divide: area = width × height.'],
  ], `On a density scale the proportion is the bar's area: ${H.w} × ${fix(d, 2)}.`, 1e-6);
};

export const densTotal: Gen = (R, n) => {
  const H = histOf(R), u = histUnits(R, H, 1.5);
  const i = int(R, 1, H.k - 2), d = dens(u[i]!);
  const others = u.filter((_, j) => j !== i).reduce((a, b) => a + b, 0);
  const restArea = roundTo(others * 0.01 * H.w, 2);
  return numItem({
    id: `dens-total-${n}`, family: 'densTotal',
    prompt: `A density-scaled histogram (relative frequency ${H.per}, bins ${H.w}${uLabel(H)} wide) of the ${H.c.what}s of ${H.who}. The bar from ${A(rangeW(H, i))} is missing. The other bars have a total area of ${B(fix(restArea, 2))}. How tall must the missing bar be?`,
    board: `\\text{all areas} = 1 \\qquad \\text{height} = \\,?`,
    picture: { card: histCard(H, u, { labels: true, skip: i }) },
    solution: [`All the bar areas add to 1, so the missing area is 1 − ${fix(restArea, 2)} = ${fix(1 - restArea, 2)}.`, `Height = area ÷ width = ${fix(1 - restArea, 2)} ÷ ${H.w} = ${S(fix(d, 2))}`],
    ex: { rest: restArea, w: H.w, d },
  }, d, 'plain', `Yes: area ${fix(1 - restArea, 2)} ÷ width ${H.w} = ${fix(d, 2)} ${H.per}.`, [
    [roundTo(1 - restArea, 2), MC.heightProb, `${fix(1 - restArea, 2)} is the missing bar's area (a proportion). Its height is that area ÷ the width ${H.w}.`],
    [roundTo((1 - restArea) * H.w, 4), undefined, 'Height = area ÷ width, not area × width.'],
  ], 'The areas add to 1. Find the missing area, then divide by the bin width.');
};

/** unequal bins: widths w0 x [3, 1, 1, 1, 3], density n x d0 with sum n x mult = 100 */
const UNEQ = [
  { c: ctxById('women'), start: 54, w0: 2, d0: 0.005, per: 'per inch', who: 'adult women' },
  { c: ctxById('newborn'), start: 2, w0: 1, d0: 0.01, per: 'per pound', who: 'newborns' },
  { c: ctxById('dog'), start: 40, w0: 5, d0: 0.002, per: 'per pound', who: 'golden retrievers' },
];
export const densUnequal: Gen = (R, n) => {
  const S0 = pick(R, UNEQ);
  const mult = [3, 1, 1, 1, 3];
  const { a, e, b, c, d } = until(() => {
    const a = int(R, 4, 9), e = int(R, 4, 9), rest = 100 - 3 * (a + e);
    const c = int(R, Math.ceil(rest / 3) + 2, Math.floor(rest / 2)), b = int(R, 8, rest - c - 8), d = rest - c - b;
    return { a, e, b, c, d };
  }, t => t.d >= 8 && t.b > t.a && t.d > t.e && t.c > t.b && t.c > t.d);
  const ns = [a, b, c, d, e];
  const edges = [0, 3, 4, 5, 6, 9].map(k => S0.start + k * S0.w0);
  const wide = R() < 0.5 ? 0 : 4, narrow = pick(R, wide === 0 ? [1, 3] : [3, 1]);
  const share = (i: number) => ns[i]! * mult[i]!;   // percent
  const sw = share(wide), sn = share(narrow);
  if (sw === sn) return densUnequal(R, n);
  const nm = (i: number) => `${fmt(edges[i]!)}–${fmt(edges[i + 1]!)}${uLabel({ c: S0.c } as Hist)} bin`;
  const dv = (i: number) => roundTo(ns[i]! * S0.d0, 3);
  const top = Math.max(...ns.map((_, i) => dv(i)));
  const step = top <= 0.06 ? 0.01 : top <= 0.12 ? 0.02 : 0.05;
  const card: NPic['card'] = {
    x: { min: edges[0]!, max: edges[5]!, step: S0.w0, name: S0.c.axis },
    y: { max: r9(Math.ceil(r9(top * 1.15 / step)) * step), step, name: `Density (${S0.per})`, dec: 2 },
    bars: ns.map((_, i) => ({ lo: edges[i]!, hi: edges[i + 1]!, h: dv(i), col: i === wide ? 'pick' : i === narrow ? 'water' : 'dim' })),
  };
  const wideWins = sw > sn;
  const opts: Opt[] = [
    { t: `The ${nm(wide)}`, ok: wideWins, mc: wideWins ? undefined : undefined, say: wideWins ? `Yes: its bar is lower but ${3 * S0.w0} wide: area ${fix(dv(wide), 3)} × ${3 * S0.w0} = ${fix(sw / 100, 2)}, more than ${fix(sn / 100, 2)}.` : `Its area is ${fix(dv(wide), 3)} × ${3 * S0.w0} = ${fix(sw / 100, 2)}, less than the other bin's ${fix(sn / 100, 2)}.` },
    { t: `The ${nm(narrow)}`, ok: !wideWins, mc: wideWins ? MC.heightProb : undefined, say: wideWins ? `Its bar is taller, but height is a density. Area = ${fix(dv(narrow), 3)} × ${S0.w0} = ${fix(sn / 100, 2)}, less than the wide bin's ${fix(sw / 100, 2)}.` : `Yes: area ${fix(dv(narrow), 3)} × ${S0.w0} = ${fix(sn / 100, 2)}, more than ${fix(sw / 100, 2)}.` },
    { t: 'They hold the same share', say: `Compare the areas: ${fix(sw / 100, 2)} and ${fix(sn / 100, 2)}.` },
  ];
  return choice(R, {
    id: `dens-uneq-${n}`, family: 'densUnequal',
    prompt: `A density-scaled histogram of the ${S0.c.what}s of ${S0.who}, with bins of unequal width. The ${A(nm(wide))} has height ${fix(dv(wide), 3)} ${S0.per}; the ${B(nm(narrow))} has height ${fix(dv(narrow), 3)} ${S0.per}. Which bin holds the larger share of the ${S0.who}?`,
    board: `\\text{share} = \\text{width} \\times \\text{height}`,
    picture: { card },
    solution: [`Share = width × height. Wide bin: ${3 * S0.w0} × ${fix(dv(wide), 3)} = ${fix(sw / 100, 2)}. Narrow bin: ${S0.w0} × ${fix(dv(narrow), 3)} = ${fix(sn / 100, 2)}.`],
    ex: { sw, sn },
  }, opts, true);
};

// ===================== density curves =====================
export const curveHeight: Gen = (R, n) => {
  const c = ctxPick(R, ['women', 'men', 'newborn', 'dog', 'apple']), [m, s] = modelPick(R, c);
  const k = pick(R, [0, 0, 1, -1]), x = r9(m + k * s), h = roundTo(dnorm(x, m, s), 3);
  const P = fmt(h * 100, 1);
  const opts: Opt[] = [
    { t: `It is a density (per ${c.unit === 'in' ? 'inch' : c.unit === '°F' ? 'degree' : 'unit'}), not a share; a share is an area over an interval`, ok: true, say: 'Yes. Height tells how crowded the values are there; only an area over an interval is a proportion.' },
    { t: `About ${P}% of ${c.who} are exactly ${withU(c, x)}`, mc: MC.heightProb, say: 'The height is not a proportion, and in a continuous model the share at one exact value is 0.' },
    ...(Math.abs(h - normalcdf(-1e9, x, m, s)) > 0.06 ? [{ t: `About ${P}% of ${c.who} are ${withU(c, x)} or less`, mc: MC.heightProb, say: `The share at or below ${withU(c, x)} is the area to its left, not the curve's height there.` }] : []),
    { t: `The model is right about ${P}% of the time at ${withU(c, x)}`, mc: MC.heightProb, say: 'The height is not an accuracy or a chance. It is a density; areas give shares.' },
  ];
  return choice(R, {
    id: `curve-h-${n}`, family: 'curveHeight',
    prompt: `The model ${A(NN(m, s))} for the ${c.what} of ${c.who}. At ${B(withU(c, x))}, the curve's height is about ${fix(h, 3)}. What does ${fix(h, 3)} tell you?`,
    board: `${NT(m, s)} \\qquad f(${fmt(x)}) \\approx ${fix(h, 3)}`,
    picture: { card: { x: sdAxis(c, m, s), curves: [normalCurve(m, s)], vlines: [{ key: 'v', x, col: 'pick' }] } },
    solution: ['A density curve shows proportions as <b>areas</b> (total area 1).', 'Its height is a density, not a proportion.'],
  }, opts);
};

export const curveVsBars: Gen = (R, n) => {
  const H = histOf(R);
  const { u, i, model, bars } = until(() => {
    const u = histUnits(R, H, 2.5), i = int(R, 2, H.k - 4);
    const lo = H.start + i * H.w, hi = lo + 2 * H.w;
    const model = roundTo(normalcdf(lo, hi, H.m, H.s), 2), bars = roundTo((u[i]! + u[i + 1]!) * 0.01 * H.w, 2);
    return { u, i, model, bars };
  }, t => Math.abs(t.model - t.bars) >= 0.02 && Math.abs(t.model - t.bars) <= 0.06);
  const lo = H.start + i * H.w, hi = lo + 2 * H.w, N = pick(R, H.c.Ns);
  const opts: Opt[] = [
    { t: 'The curve is a model: its areas come close to the data\'s proportions, but not exactly', ok: true, say: 'Yes. A model smooths the data; close, not equal, is what a good model gives.' },
    { t: 'The bars must be wrong, because the data have to follow the curve', mc: MC.law, say: 'The data are the facts. The curve is a model we chose; it can only approximate them.' },
    { t: 'With narrower and narrower bins the bars would turn into this exact curve', mc: MC.narrowBins, say: `Narrow bins on ${cnt(N)} values make a spiky histogram, not a smooth curve. The curve is a chosen model.` },
    { t: 'The curve\'s area must equal the bars\' area, so the curve is drawn wrong', mc: MC.modelTruth, say: 'A model\'s areas approximate the data\'s proportions; we never expect them to match exactly.' },
  ];
  return choice(R, {
    id: `curve-bars-${n}`, family: 'curveVsBars',
    prompt: `A density-scaled histogram of the ${H.c.what}s of ${cnt(N)} ${H.who}, with the model ${A(NN(H.m, H.s))} drawn over it. From ${withU(H.c, lo)} to ${withU(H.c, hi)} the bars hold ${B(fix(bars, 2))} of the data; the curve's area there is ${fix(model, 2)}. Which statement is right?`,
    board: `\\text{bars: } ${fix(bars, 2)} \\qquad \\text{curve: } ${fix(model, 2)}`,
    picture: { card: histCard(H, u, { curve: true, shade: [lo, hi], cols: { [i]: 'water', [i + 1]: 'water' } }) },
    solution: ['The bars are the data; the curve is a model with total area 1.', 'Its areas approximate the observed proportions: close, not equal.'],
  }, opts);
};

// ===================== event notation =====================
type Ev = { kind: 'lt' | 'gt' | 'btw'; a: number; b?: number };
const evT = (e: Ev) => (e.kind === 'lt' ? `P(X < ${fmt(e.a)})` : e.kind === 'gt' ? `P(X > ${fmt(e.a)})` : `P(${fmt(e.a)} < X < ${fmt(e.b!)})`);
function evWords(c: NCtx, e: Ev): string {
  if (e.kind === 'lt') return `${c.less} than ${withU(c, e.a)}`;
  if (e.kind === 'gt') return `${c.more} than ${withU(c, e.a)}`;
  return `between ${withU(c, e.a)} and ${withU(c, e.b!)}`;
}
export const eventWords: Gen = (R, n) => {
  const c = ctxPick(R, ['women', 'men', 'newborn', 'dog', 'temp', 'sat']), [m, s] = modelPick(R, c);
  const kind = pick(R, ['lt', 'gt', 'btw'] as const);
  const shaded = R() < 0.5;
  const k1 = pick(R, [-2, -1.5, -1, -0.5, 0.5, 1, 1.5]), k2 = pick(R, [1, 1.5, 2].filter(k => k > k1));
  const a = r9(m + k1 * s), b = r9(m + k2 * s);
  const e: Ev = kind === 'btw' ? { kind, a, b } : { kind, a };
  const opts: Opt[] = [
    { t: evT(e), ok: true, say: 'Yes.' },
    { t: evT({ kind: kind === 'lt' ? 'gt' : 'lt', a }), mc: kind === 'gt' ? MC.leftDefault : undefined, say: kind === 'gt' ? `${c.more[0]!.toUpperCase() + c.more.slice(1)} than ${withU(c, a)} is the area to the RIGHT: X > ${fmt(a)}.` : `${c.less[0]!.toUpperCase() + c.less.slice(1)} than ${withU(c, a)} is the area to the LEFT: X < ${fmt(a)}.` },
    kind === 'btw' ? { t: `P(X < ${fmt(b)})`, say: 'That area also includes everything below the lower end.' } : { t: `P(X = ${fmt(a)})`, mc: MC.pointMass, say: 'X = a is one single value (area 0). The event is a whole side of the curve.' },
    { t: kind === 'btw' ? `P(X) between ${fmt(a)} and ${fmt(b)}` : `P(X) ${kind === 'lt' ? '<' : '>'} ${fmt(a)}`, mc: MC.eventIneq, say: 'The inequality belongs inside: it describes the values of X. P( ) is the area of that event.' },
  ];
  return choice(R, {
    id: `event-${n}`, family: 'eventWords',
    prompt: shaded
      ? `X is the ${c.what} of a randomly chosen ${c.one}, modeled by ${A(NN(m, s))}. Which notation names the ${B('shaded area')}?`
      : `X is the ${c.what} of a randomly chosen ${c.one}, modeled by ${A(NN(m, s))}. Which notation means "the share of ${c.who} that are ${B(evWords(c, e))}"?`,
    board: `X \\sim ${NT(m, s)}`,
    picture: { card: { x: sdAxis(c, m, s), curves: [normalCurve(m, s)], shades: shaded ? [{ key: 'sh', lo: kind === 'gt' ? a : kind === 'btw' ? a : m - 5 * s, hi: kind === 'lt' ? a : kind === 'btw' ? b : m + 5 * s, on: 'C', col: 'link' }] : undefined } },
    solution: [shaded ? 'Read the shaded region: where it starts and ends on the axis.' : 'Turn the words into an inequality on X.', `Area of that event: ${evT(e)}`],
  }, opts);
};

export const eventMeaning: Gen = (R, n) => {
  const c = ctxPick(R, ['women', 'men', 'newborn', 'dog', 'sat', 'apple']), [m, s] = modelPick(R, c);
  const k = pick(R, [-1.6, -1.4, -1.2, -0.8, -0.6, 0.6, 0.8, 1.2]);
  const a = r9(m + k * s), p = roundTo(normalcdf(-1e9, a, m, s), 4), P = fmt(p * 100, 2);
  const opts: Opt[] = [
    { t: `About ${P}% of ${c.who} are ${c.less} than ${withU(c, a)}; a randomly chosen ${c.one} has about a ${P}% chance of that`, ok: true, say: 'Yes: one area, two readings: a population share and a probability for one random pick.' },
    { t: `X is one fixed ${c.what} we can solve for: X = ${fmt(a)} − ${fix(p, 4)}`, mc: MC.rvFixed, say: `X is not one number to solve for. It is the ${c.what} of a random ${c.one}, so it varies.` },
    { t: `About ${P}% of ${c.who} are exactly ${withU(c, a)}`, mc: MC.pointMass, say: `X < ${fmt(a)} is everything to the left of ${fmt(a)}, not the single value.` },
    { t: `About ${P}% of ${c.who} are ${c.more} than ${withU(c, a)}`, mc: MC.leftDefault, say: `X < ${fmt(a)} is the left side: ${c.less} than ${withU(c, a)}.` },
  ];
  return choice(R, {
    id: `event-mean-${n}`, family: 'eventMeaning',
    prompt: `X is the ${c.what} of a randomly chosen ${c.one}, modeled by ${A(NN(m, s))}, and the model gives ${B(`P(X < ${fmt(a)}) = ${fix(p, 4)}`)}. What does this say?`,
    board: `P(X < ${fmt(a)}) = ${fix(p, 4)}`,
    picture: { card: { x: sdAxis(c, m, s), curves: [normalCurve(m, s)], shades: [{ key: 'sh', lo: m - 5 * s, hi: a, on: 'C' }] } },
    solution: [`P(X < ${fmt(a)}) is the area left of ${fmt(a)}.`, 'That area is the share of the population, and the chance for one randomly chosen individual.'],
  }, opts);
};

// ===================== a single value has zero area =====================
export const pointEq: Gen = (R, n) => {
  const c = ctxPick(R, ['women', 'men', 'newborn', 'dog', 'apple', 'temp']), [m, s] = modelPick(R, c);
  const a = r9(m + pick(R, [-1, -0.5, 0, 0.5, 1, 1.5]) * s);
  const mode = R() < 0.5 ? 'eq' : 'le';
  const h = roundTo(dnorm(a, m, s), 3);
  const opts: Opt[] = mode === 'eq' ? [
    { t: '0', ok: true, say: 'Yes: a single value is a line with no width, so its area is 0.' },
    { t: `${fix(h, 3)}, the curve's height at ${fmt(a)}`, mc: MC.pointMass, say: 'The height is a density. The area above one point has zero width, so it is 0.' },
    { t: 'A small positive number, because some do measure exactly that', mc: MC.pointMass, say: 'In a continuous model, exactly one value has zero area. Shares come from intervals.' },
    { t: `The same as P(X < ${fmt(a)})`, mc: MC.pointMass, say: 'P(X < a) is a whole region to the left; X = a is one line.' },
  ] : [
    { t: 'They are equal', ok: true, say: 'Yes: the two regions differ by one line, which has area 0.' },
    { t: `P(X ≤ ${fmt(a)}) is larger, by P(X = ${fmt(a)}) > 0`, mc: MC.pointMass, say: `P(X = ${fmt(a)}) is 0 in a continuous model, so the two are equal.` },
    { t: `P(X ≤ ${fmt(a)}) is smaller`, say: 'Including the end point cannot remove area. They are equal.' },
    { t: 'You cannot compare them without a table', say: 'No table needed: the regions differ by one line of zero area.' },
  ];
  return choice(R, {
    id: `point-${n}`, family: 'pointEq',
    prompt: mode === 'eq'
      ? `X is the ${c.what} of a randomly chosen ${c.one}, modeled by ${A(NN(m, s))}. In this model, what is ${B(`P(X = ${fmt(a)})`)}?`
      : `X is the ${c.what} of a randomly chosen ${c.one}, modeled by ${A(NN(m, s))}. How do ${B(`P(X < ${fmt(a)})`)} and ${B(`P(X ≤ ${fmt(a)})`)} compare?`,
    board: mode === 'eq' ? `P(X = ${fmt(a)}) = \\,?` : `P(X < ${fmt(a)}) \\qquad \\text{vs}\\ P(X \\le ${fmt(a)})`,
    picture: { card: { x: sdAxis(c, m, s), curves: [normalCurve(m, s)], vlines: [{ key: 'v', x: a, col: 'pick' }] } },
    solution: ['In a continuous model probabilities are areas.', `A single value is a line of width 0: P(X = ${fmt(a)}) = 0.`],
  }, opts);
};

export const pointRound: Gen = (R, n) => {
  const V = pick(R, [
    { c: ctxById('women'), to: 'the nearest inch', step: 1 }, { c: ctxById('men'), to: 'the nearest inch', step: 1 },
    { c: ctxById('dog'), to: 'the nearest pound', step: 1 }, { c: ctxById('temp'), to: 'the nearest degree', step: 1 },
    { c: ctxById('newborn'), to: 'the nearest tenth of a pound', step: 0.1 },
  ]);
  const [m, s] = modelPick(R, V.c);
  const r = roundTo(m + int(R, -2, 2) * V.step * (V.step === 1 ? 2 : 6), V.step === 1 ? 0 : 1);
  const h = V.step / 2, lo = roundTo(r - h, 2), hi = roundTo(r + h, 2), d = V.step === 1 ? 1 : 2;
  const opts: Opt[] = [
    { t: `${fmt(lo, d)} ≤ X < ${fmt(hi, d)}`, ok: true, say: `Yes: every true value that rounds to ${fmt(r)} counts.` },
    { t: `X = ${fmt(r)} exactly`, mc: MC.pointMass, say: `A recorded ${fmt(r)} stands for a whole interval of true values; exactly ${fmt(r)} has area 0.` },
    { t: `${fmt(r)} ≤ X < ${fmt(roundTo(r + V.step, 1))}`, say: 'Rounding to the nearest goes half a step each way.' },
    { t: `${fmt(roundTo(r - V.step, 1))} < X < ${fmt(roundTo(r + V.step, 1))}`, say: 'That is a full step each way; rounding to the nearest covers half a step each way.' },
  ];
  return choice(R, {
    id: `point-round-${n}`, family: 'pointRound',
    prompt: `${V.c.what[0]!.toUpperCase() + V.c.what.slice(1)}s of ${V.c.who} are recorded to ${V.to}, modeled by ${A(NN(m, s))}. Which true values X does a recorded ${B(withU(V.c, r))} stand for?`,
    board: `\\text{recorded } ${fmt(r)} \\qquad ? \\le X < \\,?`,
    picture: { card: { x: sdAxis(V.c, m, s), curves: [normalCurve(m, s)] } },
    solution: [`Values from ${fmt(lo, d)} up to (not including) ${fmt(hi, d)} round to ${fmt(r)}.`, 'So the model share "recorded as ' + fmt(r) + '" is the area over that interval, not 0.'],
  }, opts);
};

// ===================== shape =====================
const SHAPES = { normal: 'symmetric, one peak', skewR: 'skewed right', skewL: 'skewed left', bimodal: 'two peaks', uniform: 'flat' } as const;
export const shapeFit: Gen = (R, n) => {
  const c = ctxPick(R, ['women', 'men', 'newborn', 'dog', 'temp', 'run']), [m, s] = modelPick(R, c);
  const kind = pick(R, ['normal', 'skewR', 'skewL', 'bimodal', 'uniform', 'normal'] as const);
  const N = pick(R, c.Ns);
  const any: Opt = { t: 'Yes: any data with a mean and an SD can be modeled as normal', mc: MC.anyNormal, say: 'Every data set has a mean and SD; that does not make its shape normal.' };
  const opts: Opt[] = kind === 'normal' ? [
    { t: 'Yes, as a candidate: one peak, symmetric, tails that taper off', ok: true, say: 'Yes. Looking right makes it a candidate model; it does not prove the data are normal.' },
    { t: 'Yes, and the bell shape proves the data are exactly normal', mc: MC.humpNormal, say: 'A bell look makes a normal model reasonable to try; it does not prove normality.' },
    { t: 'No: real data never fit a smooth curve', say: 'A model never fits perfectly. Symmetric, one peak and tapering tails make a normal model a fair candidate.' },
    { t: 'No: "normal" data must all be close to the mean', mc: MC.typical, say: 'Statistical "normal" names a curve shape, not "ordinary" values.' },
  ] : [
    { t: `No: it is ${SHAPES[kind]}`, ok: true, say: `Right: a normal curve has one peak and is symmetric with tapering tails; this one is ${SHAPES[kind]}.` },
    kind === 'bimodal' || kind === 'uniform'
      ? { t: 'Yes: it is symmetric', mc: MC.humpNormal, say: 'Symmetry alone is not enough: a normal curve also has a single peak and tails that taper.' }
      : { t: 'Yes: it has a single peak', mc: MC.humpNormal, say: 'One peak is not enough: a normal curve is also symmetric. This one has a long tail on one side.' },
    any,
    { t: `Yes, if we collect more than ${cnt(N)} values`, mc: MC.anyNormal, say: 'More data shows the true shape more clearly; it does not turn a skewed or two-peaked shape into a normal one.' },
  ];
  return choice(R, {
    id: `shape-${n}`, family: 'shapeFit',
    prompt: `A smooth curve traces the histogram of the ${c.what}s of ${cnt(N)} ${c.who} (the curve's mean is near ${withU(c, m)}). Could a normal model describe this shape?`,
    board: `\\text{normal model?}`,
    picture: { card: { x: sdAxis(c, m, s), curves: [{ key: 'C', kind, m, s, col: 'link' }] } },
    solution: ['Normal shape: one peak, symmetric about the mean, tails that taper toward the axis.', kind === 'normal' ? 'This curve has all three: a candidate model.' : `This curve is ${SHAPES[kind]}: not normal.`],
  }, opts);
};

export const shapeFacts: Gen = (R, n) => {
  const c = ctxPick(R), [m, s] = modelPick(R, c);
  const T = pick(R, [
    'The mean and the median are equal, at the center of the curve',
    'The curve is symmetric about its mean',
    'The tails get closer and closer to the axis but never touch it',
    'It has exactly one peak, at the mean',
  ]);
  const F: Opt[] = shuffle(R, [
    { t: 'The curve touches the axis 3 SD from the mean', mc: MC.within3, say: 'The tails never touch the axis: values beyond 3 SD are rare, not impossible.' },
    { t: '"Normal" means most values are ordinary, and the rest are abnormal', mc: MC.typical, say: 'In statistics "normal" names the bell-shaped model, not what is ordinary.' },
    { t: 'The mean is to the right of the median', say: 'A normal curve is symmetric: the mean and the median are equal.' },
    { t: 'A larger mean makes the curve taller', mc: MC.meanHeight, say: 'The mean only slides the curve; height and width stay the same.' },
    { t: 'Every hump-shaped data set is exactly normal', mc: MC.humpNormal, say: 'A hump makes a normal model worth trying; it does not make the data normal.' },
  ]).slice(0, 3);
  return choice(R, {
    id: `shape-facts-${n}`, family: 'shapeFacts',
    prompt: `The ${c.what} of ${c.who} is modeled by ${A(NN(m, s))}. Which statement is true of this curve, and of every normal curve?`,
    board: `${NT(m, s)}`,
    picture: { card: { x: sdAxis(c, m, s), curves: [normalCurve(m, s)] } },
    solution: ['Every normal curve: one peak at the mean, symmetric, mean = median, tails that taper and never touch the axis.'],
  }, [{ t: T, ok: true, say: 'Yes: true of every normal curve.' }, ...F]);
};

// ===================== the mean locates, the SD scales =====================
const LET = ['A', 'B', 'C'];
export const meanMatch: Gen = (R, n) => {
  const V = pick(R, [
    { c: ctxById('temp'), what: 'daily highs in July in three cities', ms: [[68, 4], [75, 4], [82, 4], [72, 5], [80, 5], [64, 4]] },
    { c: { ...ctxById('temp'), axis: 'Daily low (°F)' }, what: 'January lows in three northern cities', ms: [[-6, 4], [2, 4], [10, 4], [-2, 5], [6, 5], [-10, 4]] },
    { c: ctxById('men'), what: 'heights of adult men in three countries', ms: [[66, 3], [69, 3], [72, 3], [67, 3], [70, 3]] },
  ]);
  const s = V.ms[0]![1]!;
  const base = pick(R, V.ms.filter(x => x[1] === s))[0]!;
  const gap = pick(R, [1.5, 2]) * s;
  const means = [base, r9(base + gap), r9(base + 2 * gap)];
  const order = shuffle(R, [0, 1, 2]);   // letter j names the curve with mean means[order[j]]
  const ask = int(R, 0, 2);
  const right = order.indexOf(ask);
  const cols = ['first', 'pick', 'second'] as const;
  const curves = order.map((mi, j) => ({ key: `C${j}`, kind: 'normal' as const, m: means[mi]!, s, col: cols[j] }));
  const texts = order.map((mi, j) => ({ key: `L${j}`, x: means[mi]!, at: 0.8 + 0.09, text: LET[j]!, col: cols[j] }));
  const opts: Opt[] = LET.map((L, j) => ({ t: `Curve ${L}`, ok: j === right, say: j === right ? `Yes: its peak sits over ${fmt(means[ask]!)}; the mean locates the curve.` : `Curve ${L} peaks over ${fmt(means[order[j]!]!)}. The mean is where the peak sits.` }));
  return choice(R, {
    id: `mean-match-${n}`, family: 'meanMatch',
    prompt: `Three normal models for ${V.what}, all with SD ${withU(V.c, s)}. Which curve has mean ${A(withU(V.c, means[ask]!))}?`,
    board: `\\sigma = ${fmt(s)} \\qquad \\mu = ${fmt(means[ask]!).replace('−', '-')}`,
    picture: { card: { x: { min: r9(means[0]! - 3 * s), max: r9(means[2]! + 3 * s), step: s, name: V.c.axis }, curves, texts } },
    solution: ['Same SD: the three curves have the same shape and height.', `The mean is the center: the curve whose peak is over ${fmt(means[ask]!)}.`],
  }, opts, true);
};

export const meanShift: Gen = (R, n) => {
  const c = ctxPick(R, ['temp', 'women', 'men', 'dog', 'apple']), [m, s] = modelPick(R, c);
  const d = r9(pick(R, [1, 1.5, 2, 2.5, 3]) * s * (R() < 0.75 ? 1 : -1)), m2 = r9(m + d);
  const dir = d > 0 ? 'right' : 'left';
  const opts: Opt[] = [
    { t: `It slides ${fmt(Math.abs(d))} ${c.unit === '°F' ? 'degrees' : c.unit} to the ${dir}, same width and height`, ok: true, say: 'Yes: the mean only moves the curve along the axis.' },
    { t: `It slides ${dir} and gets ${d > 0 ? 'taller' : 'shorter'}`, mc: MC.meanHeight, say: 'The height depends only on the SD, which did not change.' },
    { t: `It slides ${dir} and gets ${d > 0 ? 'wider' : 'narrower'}`, mc: MC.meanHeight, say: 'The width depends only on the SD, which did not change.' },
    { t: `It stays in place and gets ${d > 0 ? 'wider' : 'narrower'}`, mc: MC.meanHeight, say: 'Changing the mean moves the center; the SD sets the width.' },
  ];
  return choice(R, {
    id: `mean-shift-${n}`, family: 'meanShift',
    prompt: `The model for the ${c.what} of ${c.who} changes from ${A(NN(m, s))} to ${B(NN(m2, s))}. What happens to the curve?`,
    board: `${NT(m, s)} \\to ${NT(m2, s)}`,
    picture: { card: { x: { min: r9(Math.min(m, m2) - 4 * s), max: r9(Math.min(m, m2) - 4 * s + Math.ceil(r9((Math.abs(d) + 8 * s) / s)) * s), step: s, name: c.axis }, curves: [normalCurve(m, s)] } },
    solution: [`Only the mean changes, by ${fmt(d)}.`, 'The mean is the location: the curve slides; the SD (width, and so height) stays.'],
  }, opts);
};

export const sdMatch: Gen = (R, n) => {
  const c = ctxPick(R, ['women', 'dog', 'temp', 'apple']), [m] = modelPick(R, c);
  const set = pick(R, c.id === 'apple' ? [[0.25, 0.5, 1], [0.3, 0.6, 1.2]] : [[0.5, 1, 2], [1, 2, 4], [2, 4, 8], [1.5, 3, 6]]);
  const order = shuffle(R, [0, 1, 2]);
  const ask = int(R, 0, 2), right = order.indexOf(ask);
  const cols = ['first', 'pick', 'second'] as const;
  const curves = order.map((si, j) => ({ key: `C${j}`, kind: 'normal' as const, m, s: set[si]!, col: cols[j] }));
  // a label just above each peak (peaks 0.8, 0.4, 0.2 of the card's height: the narrowest curve peaks at 1/1.25)
  // the narrowest curve's label sits on its peak; the others on their right shoulder (1 SD out), where no other curve runs
  const texts = order.map((si, j) => ({ key: `L${j}`, x: r9(m + (si === 0 ? 0 : 1.15 * set[si]!)), at: 0.8 * (set[0]! / set[si]!) * (si === 0 ? 1 : 0.5157) + 0.07, text: LET[j]!, col: cols[j] }));
  const big = set[2]!;
  const opts: Opt[] = LET.map((L, j) => ({ t: `Curve ${L}`, ok: j === right, mc: j === right ? undefined : (set[order[j]!]! < set[ask]! ? MC.sdTaller : undefined),
    say: j === right ? `Yes: SD ${fmt(set[ask]!)} gives the ${ask === 0 ? 'narrowest, tallest' : ask === 1 ? 'middle' : 'widest, lowest'} curve.` : set[order[j]!]! < set[ask]! ? 'A larger SD makes the curve wider, and so LOWER (the area stays 1), not taller.' : 'That curve is wider than SD ' + fmt(set[ask]!) + ' would make it.' }));
  return choice(R, {
    id: `sd-match-${n}`, family: 'sdMatch',
    prompt: `Three normal models for the ${c.what} of ${c.who}, all with mean ${withU(c, m)}, and SDs ${set.map(v => fmt(v)).join(', ')}. Which curve has SD ${A(fmt(set[ask]!))}?`,
    board: `\\mu = ${fmt(m)} \\qquad \\sigma = ${fmt(set[ask]!)}`,
    picture: { card: { x: { min: r9(m - 3.5 * big), max: r9(m + 3.5 * big), step: big / 2, name: c.axis }, curves, texts } },
    solution: ['The SD sets the width. Each curve has area 1, so a wider curve is lower.', `SD ${fmt(set[ask]!)} is the ${ask === 0 ? 'smallest: the narrowest, tallest curve' : ask === 1 ? 'middle one: the middle curve' : 'largest: the widest, lowest curve'}.`],
  }, opts, true);
};

export const sdHeight: Gen = (R, n) => {
  const c = ctxPick(R, ['women', 'men', 'dog', 'temp', 'apple']), [m, s] = modelPick(R, c);
  const mode = pick(R, ['x2', 'x3', 'half', 'neg']);
  const f = mode === 'x2' ? 2 : mode === 'x3' ? 3 : 0.5, s2 = r9(s * f);
  const opts: Opt[] = mode === 'neg' ? [
    { t: 'No: an SD is a typical distance, so it is never negative', ok: true, say: 'Right: σ > 0 always.' },
    { t: 'Yes: it is the same curve flipped to the left', mc: MC.sdNeg, say: 'A normal curve is already symmetric, and an SD is a distance: it cannot be negative.' },
    { t: 'Yes: a negative SD makes the curve narrower', mc: MC.sdNeg, say: 'A narrower curve has a smaller POSITIVE SD. An SD is never negative.' },
    { t: 'Yes: it makes the curve open downward', mc: MC.sdNeg, say: 'A density is never below the axis, and an SD is never negative.' },
  ] : [
    { t: f > 1 ? `${f === 2 ? 'Twice' : 'Three times'} as wide, and the peak ${f === 2 ? 'half' : 'a third'} as tall` : 'Half as wide, and the peak twice as tall', ok: true, say: 'Yes: the total area stays 1, so width and height trade off.' },
    { t: f > 1 ? 'Wider and taller' : 'Narrower and shorter', mc: MC.sdTaller, say: 'The area under the curve stays 1. Wider must mean lower.' },
    { t: f > 1 ? 'Wider, with the same peak height' : 'Narrower, with the same peak height', mc: MC.sdTaller, say: 'Same height and wider would make the area bigger than 1.' },
    { t: f > 1 ? 'It moves right, same shape' : 'It moves left, same shape', mc: MC.meanHeight, say: 'Moving is the mean\'s job. The SD changes the width.' },
  ];
  return choice(R, {
    id: `sd-h-${n}`, family: 'sdHeight',
    prompt: mode === 'neg'
      ? `Kai wants the curve for the ${c.what} of ${c.who} to lean left, so he writes ${A(`N(${fmt(m)}, −${fmt(s)})`)}. Is that a normal model?`
      : `The model for the ${c.what} of ${c.who} changes from ${A(NN(m, s))} to ${B(NN(m, s2))}. What happens to the curve?`,
    board: mode === 'neg' ? `N(${fmt(m)},\\ -${fmt(s)})\\ ?` : `${NT(m, s)} \\to ${NT(m, s2)}`,
    picture: { card: { x: sdAxis(c, m, mode === 'x3' ? s * 1.5 : mode === 'x2' ? s : s), curves: [normalCurve(m, s)] } },
    solution: mode === 'neg' ? ['σ is a distance (a typical distance from the mean): σ > 0.'] : [`The SD is multiplied by ${fmt(f)}: the curve is ${fmt(f)} times as wide.`, `The total area stays 1, so the peak is ${f > 1 ? '1/' + f : '2'} times as tall.`],
  }, opts);
};

// ===================== the SD-scaled axis =====================
export const axisTick: Gen = (R, n) => {
  const c = ctxPick(R), [m, s] = modelPick(R, c);
  const k = pick(R, [-3, -2, -1, 1, 2, 3]), x = r9(m + k * s);
  return numItem({
    id: `axis-tick-${n}`, family: 'axisTick',
    prompt: `The axis under ${A(NN(m, s))} (${c.what} of ${c.who}) has a tick every SD. What value goes at the tick marked ${B('?')}?`,
    board: `${NT(m, s)} \\qquad \\mu ${k < 0 ? '-' : '+'} ${Math.abs(k) === 1 ? '' : Math.abs(k)}\\sigma = \\,?`,
    unit: c.unit,
    picture: { card: { x: sdAxis(c, m, s, { hide: [x], show: [m, x] }), curves: [normalCurve(m, s)] } },
    solution: [`The ? tick is ${Math.abs(k)} SD ${k < 0 ? 'below' : 'above'} the mean: each tick is one step of ${fmt(s)}.`, `${fmt(m)} ${k < 0 ? '−' : '+'} ${Math.abs(k)} × ${fmt(s)} = ${S(fmt(x))}`],
    ex: { m, s, k, x },
  }, x, 'plain', `Yes: ${fmt(m)} ${k < 0 ? '−' : '+'} ${Math.abs(k)} × ${fmt(s)} = ${fmt(x)}.`, [
    [r9(Math.abs(k) * s), MC.sdEndpoint, `${fmt(Math.abs(k) * s)} is the distance from the mean. The tick sits at the mean ${k < 0 ? 'minus' : 'plus'} that distance.`],
    [r9(m - k * s), MC.dropSign, `That is ${Math.abs(k)} SD on the other side of the mean. The ? is ${k < 0 ? 'left' : 'right'} of the mean.`],
    [r9(m + k), MC.sdEndpoint, `Each tick is one SD (${fmt(s)}), not one unit.`],
  ], `Start at the mean ${fmt(m)} and take ${Math.abs(k)} step${Math.abs(k) === 1 ? '' : 's'} of ${fmt(s)} ${k < 0 ? 'down' : 'up'}.`);
};

export const axisParam: Gen = (R, n) => {
  const c = ctxPick(R), [m, s] = modelPick(R, c);
  const v = roundTo(s * s, 4), N = pick(R, c.Ns);
  const opts: Opt[] = [
    { t: NN(m, s), ok: true, say: `Yes: the second number is the SD, √${fmt(v)} = ${fmt(s)}.` },
    { t: NN(m, v), mc: MC.variance, say: `${fmt(v)} is the variance. N(μ, σ) takes the SD: √${fmt(v)} = ${fmt(s)}.` },
    { t: `N(${fmt(s)}, ${fmt(m)})`, mc: MC.toolArgs, say: 'The mean comes first, then the SD.' },
    { t: NN(m, roundTo(v / 2, 4)), mc: MC.variance, say: `The SD is the square root of the variance, not half of it.` },
  ];
  return choice(R, {
    id: `axis-param-${n}`, family: 'axisParam',
    prompt: `A study of ${cnt(N)} ${c.who} reports a mean ${c.what} of ${A(withU(c, m))} and a ${B(`variance of ${fmt(v)}`)} (squared units). How is the normal model written?`,
    board: `\\mu = ${fmt(m)} \\qquad \\sigma^2 = ${fmt(v)}`,
    picture: { card: { x: sdAxis(c, m, s, { show: [m] }), curves: [normalCurve(m, s)] } },
    solution: ['N(μ, σ): the mean, then the standard deviation (not the variance).', `σ = √${fmt(v)} = ${fmt(s)}, so ${NN(m, s)}.`],
  }, opts);
};

// ===================== reporting a model area =====================
type Reg = 'below' | 'above' | 'between' | 'outside';
function regWords(c: NCtx, r: Reg, a: number, b: number): string {
  return r === 'below' ? `${c.less} than ${withU(c, a)}` : r === 'above' ? `${c.more} than ${withU(c, a)}` : r === 'between' ? `between ${withU(c, a)} and ${withU(c, b)}` : `${c.less} than ${withU(c, a)} or ${c.more} than ${withU(c, b)}`;
}
function regShades(r: Reg, a: number, b: number, m: number, s: number) {
  const L = m - 6 * s, Rr = m + 6 * s;
  return r === 'below' ? [{ key: 'sh', lo: L, hi: a, on: 'C' }] : r === 'above' ? [{ key: 'sh', lo: a, hi: Rr, on: 'C' }]
    : r === 'between' ? [{ key: 'sh', lo: a, hi: b, on: 'C' }] : [{ key: 'sh', lo: L, hi: a, on: 'C' }, { key: 'sh2', lo: b, hi: Rr, on: 'C' }];
}
const regP = (r: Reg, a: number, b: number) => (r === 'below' ? `P(X < ${fmt(a)})` : r === 'above' ? `P(X > ${fmt(a)})` : r === 'between' ? `P(${fmt(a)} < X < ${fmt(b)})` : `P(X < ${fmt(a)}\\ \\text{or}\\ X > ${fmt(b)})`);
/** a friendly model area for a region: a 2-decimal p with N x p whole */
function friendly(R: () => number, c: NCtx) {
  const [m, s] = modelPick(R, c);
  const r = pick(R, ['below', 'above', 'between', 'outside'] as Reg[]);
  const ka = pick(R, [-1.5, -1.2, -0.8, -0.5]), kb = pick(R, [0.5, 0.8, 1, 1.4]);
  const a = roundTo(r === 'above' ? m - ka * s : m + ka * s, c.dx), b = roundTo(m + kb * s, c.dx);
  const exact = r === 'below' ? normalcdf(-1e9, a, m, s) : r === 'above' ? 1 - normalcdf(-1e9, a, m, s) : r === 'between' ? normalcdf(a, b, m, s) : 1 - normalcdf(a, b, m, s);
  const p = roundTo(exact, 2);
  return { m, s, r, a, b, p };
}
export const popCount: Gen = (R, n) => {
  const c = ctxPick(R), F = friendly(R, c), N = pick(R, [100, 200, 300, 400, 500, 600, 800, 1000, 2000]);
  const k = Math.round(N * F.p);
  const comp = F.r === 'above' || F.r === 'below' ? Math.round(N * (1 - F.p)) : NaN;
  return numItem({
    id: `pop-count-${n}`, family: 'popCount',
    prompt: `The ${c.what} of ${c.who} is modeled by ${A(NN(F.m, F.s))}, and the model's area for ${B(regWords(c, F.r, F.a, F.b))} is ${fix(F.p, 2)}. About how many of ${cnt(N)} ${c.who} does the model expect in that region?`,
    board: `${regP(F.r, F.a, F.b)} = ${fix(F.p, 2)} \\qquad N = ${cnt(N).replace(/,/g, '{,}')}`,
    unit: c.noun,
    picture: { card: { x: sdAxis(c, F.m, F.s), curves: [normalCurve(F.m, F.s)], shades: regShades(F.r, F.a, F.b, F.m, F.s) } },
    solution: [`The area is the share: ${fix(F.p, 2)} = ${fmt(F.p * 100)}%.`, `${cnt(N)} × ${fix(F.p, 2)} = ${S(cnt(k))} (a model estimate: about ${cnt(k)})`],
    ex: { N, p: F.p, k },
  }, k, 'plain', `Yes: about ${cnt(k)} (${cnt(N)} × ${fix(F.p, 2)}), a model estimate.`, [
    [comp, MC.leftDefault, `${cnt(comp)} is the count for the other side. The shaded region holds ${fix(F.p, 2)} of the area.`],
    [roundTo(F.p * 100, 2), MC.pctSign, `${fmt(F.p * 100)} is the percent. The count is ${cnt(N)} × ${fix(F.p, 2)}.`],
  ], `Count = N × area = ${cnt(N)} × ${fix(F.p, 2)}.`);
};

export const popStatement: Gen = (R, n) => {
  const c = ctxPick(R), F = friendly(R, c), N = pick(R, [200, 400, 500, 800, 1000]);
  if (F.r === 'outside' || F.r === 'between') F.r = R() < 0.5 ? 'below' : 'above';
  const p = roundTo(F.r === 'below' ? normalcdf(-1e9, F.a, F.m, F.s) : 1 - normalcdf(-1e9, F.a, F.m, F.s), 2);
  const k = Math.round(N * p), P = fmt(p * 100);
  const w = regWords(c, F.r, F.a, F.b), wo = regWords(c, F.r === 'below' ? 'above' : 'below', F.a, F.b);
  const opts: Opt[] = [
    { t: `The model estimates that about ${P}% of the ${c.who} are ${w}, about ${cnt(k)} of ${cnt(N)}`, ok: true, say: 'Yes: a percent and a count, with "about": it is a model estimate.' },
    { t: `Exactly ${cnt(k)} of the ${cnt(N)} ${c.who} are ${w}`, mc: MC.modelTruth, say: 'A model gives an estimate, not an exact count of the real group.' },
    { t: `About ${fix(p, 2)}% of the ${c.who} are ${w}`, mc: MC.pctSign, say: `${fix(p, 2)} is a proportion; as a percent it is ${P}%.` },
    { t: `The model estimates that about ${P}% of the ${c.who} are ${wo}`, mc: MC.leftDefault, say: `The area ${fix(p, 2)} belongs to the region ${w}.` },
  ];
  return choice(R, {
    id: `pop-st-${n}`, family: 'popStatement',
    prompt: `The ${c.what} of ${c.who} is modeled by ${A(NN(F.m, F.s))}, and the model gives ${B(`${regP(F.r, F.a, F.b)} = ${fix(p, 2)}`)}. Which sentence reports this well for a group of ${cnt(N)} ${c.who}?`,
    board: `${regP(F.r, F.a, F.b)} = ${fix(p, 2)}`,
    picture: { card: { x: sdAxis(c, F.m, F.s), curves: [normalCurve(F.m, F.s)], shades: regShades(F.r, F.a, F.b, F.m, F.s) } },
    solution: [`${fix(p, 2)} of the area is ${P}%; of ${cnt(N)} that is about ${cnt(k)}.`, 'Say "about" or "the model estimates": the real group will not match exactly.'],
  }, opts);
};

// ===================== the 68-95-99.7 rule =====================
const kWord = (k: number) => (k === 1 ? 'one' : k === 2 ? 'two' : 'three');
export const erCentral: Gen = (R, n) => {
  const c = ctxPick(R), [m, s] = modelPick(R, c), k = pick(R, [1, 2, 3]);
  const a = r9(m - k * s), b = r9(m + k * s), p = CENTRAL[k]!;
  return numItem({
    id: `er-c-${n}`, family: 'erCentral',
    prompt: `The ${c.what} of ${c.who} is modeled by ${A(NN(m, s))}. ${RULE_ABOUT} About what percent of ${c.who} are between ${B(withU(c, a))} and ${B(withU(c, b))}?`,
    board: `P(${fmt(a)} < X < ${fmt(b)}) \\approx \\,?\\%`,
    unit: '%',
    picture: { card: { x: sdAxis(c, m, s), curves: [normalCurve(m, s)], shades: [{ key: 'sh', lo: a, hi: b, on: 'C' }] } },
    solution: [`${fmt(a)} and ${fmt(b)} are ${k} SD below and above the mean (${fmt(m)} ∓ ${k} × ${fmt(s)}).`, `Within ${k} SD of the mean: about ${S(fmt(p) + '%')}`],
    ex: { k, p },
  }, p, 'pct', `Yes: within ${kWord(k)} SD, about ${fmt(p)}%.`,
    [1, 2, 3].filter(j => j !== k).map(j => [CENTRAL[j]!, MC.wrongDist, `${fmt(CENTRAL[j]!)}% goes with ${j} SD. ${fmt(a)} to ${fmt(b)} is ${k} SD each side.`] as [number, string, string]).concat([[HALF[k]!, MC.oneSided, `${fmt(HALF[k]!)}% is one side only. The region runs ${k} SD on BOTH sides.`]]),
    `Count the SD steps from the mean to each end, then use 68-95-99.7.`);
};
const RULE_ABOUT = 'Use the 68-95-99.7 rule.';

export const erCount: Gen = (R, n) => {
  const c = ctxPick(R), [m, s] = modelPick(R, c), k = pick(R, [1, 2, 3]);
  const N = k === 3 ? pick(R, [1000, 2000, 3000, 5000]) : pick(R, [200, 300, 400, 500, 600, 800, 1000, 2000]);
  const a = r9(m - k * s), b = r9(m + k * s), cntv = Math.round(N * CENTRAL[k]! / 100);
  return numItem({
    id: `er-n-${n}`, family: 'erCount',
    prompt: `${cnt(N)} ${c.who}; the ${c.what} is modeled by ${A(NN(m, s))}. ${RULE_ABOUT} About how many of them does the model put between ${B(withU(c, a))} and ${B(withU(c, b))}?`,
    board: `N = ${cnt(N).replace(/,/g, '{,}')} \\qquad ${fmt(a)} < X < ${fmt(b)}`,
    unit: c.noun,
    picture: { card: { x: sdAxis(c, m, s), curves: [normalCurve(m, s)], shades: [{ key: 'sh', lo: a, hi: b, on: 'C' }] } },
    solution: [`${fmt(a)} to ${fmt(b)} is within ${k} SD of the mean: about ${fmt(CENTRAL[k]!)}%.`, `${fmt(CENTRAL[k]! / 100, 3)} × ${cnt(N)} = ${S(cnt(cntv))}`],
    ex: { k, N, cntv },
  }, cntv, 'plain', `Yes: about ${fmt(CENTRAL[k]!)}% of ${cnt(N)}, about ${cnt(cntv)}.`,
    [1, 2, 3].filter(j => j !== k).map(j => [Math.round(N * CENTRAL[j]! / 100), MC.wrongDist, `That uses ${fmt(CENTRAL[j]!)}%, the share within ${j} SD. This region is ${k} SD each side.`] as [number, string, string]).concat([[CENTRAL[k]!, MC.pctSign, `${fmt(CENTRAL[k]!)} is the percent. Take ${fmt(CENTRAL[k]!)}% of ${cnt(N)}.`]]),
    `Find the percent with 68-95-99.7, then take that percent of ${cnt(N)}.`);
};

export const erBeyond: Gen = (R, n) => {
  const c = ctxPick(R, ['women', 'men', 'newborn', 'dog', 'iq']), [m, s] = modelPick(R, c);
  const z = pick(R, [3.2, 3.4, 3.6, 4]) * (R() < 0.7 ? 1 : -1), x = roundTo(m + z * s, c.dx);
  const opts: Opt[] = [
    { t: 'Possible but very rare: the model leaves about 0.3% beyond 3 SD (both sides together)', ok: true, say: 'Yes: the tails never reach 0. Rare is not impossible.' },
    { t: 'Impossible: all values lie within 3 SD of the mean', mc: MC.within3, say: 'About 99.7% lie within 3 SD, not 100%. The model allows rare values farther out.' },
    { t: `It must be a measuring mistake, because the model forbids it`, mc: MC.law, say: 'A model does not forbid anything. A value this far out is rare; check it, but it can be real.' },
    { t: `It is about as common as a value 1 SD from the mean`, say: 'Values beyond 3 SD are far rarer than values near 1 SD.' },
  ];
  return choice(R, {
    id: `er-beyond-${n}`, family: 'erBeyond',
    prompt: `The ${c.what} of ${c.who} is modeled by ${A(NN(m, s))}. One ${c.one} measures ${B(withU(c, x))}, more than 3 SD from the mean. What does the model say about such a value?`,
    board: `${NT(m, s)} \\qquad x = ${fmt(x)}`,
    picture: { card: { x: sdAxis(c, m, s, { k: 5 }), curves: [normalCurve(m, s)], vlines: [{ key: 'v', x, col: 'pick' }] } },
    solution: ['About 99.7% lie within 3 SD, so about 0.3% lie beyond, split between the two tails.', 'The curve never touches the axis: rare, not impossible.'],
  }, opts);
};

/** a percent or a count of N for a benchmark percent p (N chosen so the count is whole) */
function pctOrCount(R: () => number, p: number): { N: number | null } {
  if (R() < 0.6) return { N: null };
  const Ns = [200, 400, 500, 800, 1000, 2000, 4000, 5000, 10000].filter(N => Math.abs(N * p / 100 - Math.round(N * p / 100)) < 1e-9);
  return { N: pick(R, Ns) };
}
export const halfPct: Gen = (R, n) => {
  const c = ctxPick(R), [m, s] = modelPick(R, c), k = pick(R, [1, 2, 3]), up = R() < 0.5;
  const a = up ? m : r9(m - k * s), b = up ? r9(m + k * s) : m, p = HALF[k]!;
  const { N } = pctOrCount(R, p);
  const v = N === null ? p : Math.round(N * p / 100);
  const conv = (q: number) => (N === null ? q : Math.round(N * q / 100));
  return numItem({
    id: `half-${n}`, family: 'halfPct',
    prompt: `The ${c.what} of ${c.who} is modeled by ${A(NN(m, s))}. ${RULE_ABOUT} ${N === null ? 'About what percent of them are' : `Of ${cnt(N)} ${c.who}, about how many are`} between ${B(withU(c, a))} and ${B(withU(c, b))}?`,
    board: `P(${fmt(a)} < X < ${fmt(b)}) \\approx \\,?`,
    unit: N === null ? '%' : c.noun,
    picture: { card: { x: sdAxis(c, m, s), curves: [normalCurve(m, s)], shades: [{ key: 'sh', lo: a, hi: b, on: 'C' }] } },
    solution: [`The region runs from the mean to ${k} SD ${up ? 'above' : 'below'} it: one half of the central ${fmt(CENTRAL[k]!)}%.`, `${fmt(CENTRAL[k]!)} ÷ 2 = ${N === null ? S(fmt(p) + '%') : fmt(p) + '%'}${N === null ? '' : `, and ${fmt(p / 100, 4)} × ${cnt(N)} = ${S(cnt(v))}`}`],
    ex: { k, p, N },
  }, v, N === null ? 'pct' : 'plain', `Yes: half of ${fmt(CENTRAL[k]!)}% is ${fmt(p)}%${N === null ? '' : `, about ${cnt(v)}`}.`, [
    [conv(CENTRAL[k]!), MC.oneSided, `${fmt(CENTRAL[k]!)}% covers BOTH sides of the mean. This region is one side: half of it.`],
    [conv(100 - CENTRAL[k]!), MC.centralToTail, 'That is the share outside the central region, not between the mean and the line.'],
  ], 'The curve is symmetric: the central region splits into two equal halves at the mean.');
};

export const halfSide: Gen = (R, n) => {
  const c = ctxPick(R), [m, s] = modelPick(R, c), k = pick(R, [1, 2, 3]), below = R() < 0.5;
  // below mu + k sigma, or above mu - k sigma: 50 + half
  const a = below ? r9(m + k * s) : r9(m - k * s), p = r9(50 + HALF[k]!);
  return numItem({
    id: `half-side-${n}`, family: 'halfSide',
    prompt: `The ${c.what} of ${c.who} is modeled by ${A(NN(m, s))}. ${RULE_ABOUT} About what percent of ${c.who} are ${below ? c.less : c.more} than ${B(withU(c, a))}?`,
    board: `P(X ${below ? '<' : '>'} ${fmt(a)}) \\approx \\,?\\%`,
    unit: '%',
    picture: { card: { x: sdAxis(c, m, s), curves: [normalCurve(m, s)], shades: [{ key: 'sh', lo: below ? m - 6 * s : a, hi: below ? a : m + 6 * s, on: 'C' }] } },
    solution: [`50% lies on the ${below ? 'left' : 'right'} of the mean.`, `Add the half from the mean to ${k} SD: 50 + ${fmt(HALF[k]!)} = ${S(fmt(p) + '%')}`],
    ex: { k, p },
  }, p, 'pct', `Yes: 50% + ${fmt(HALF[k]!)}% = ${fmt(p)}%.`, [
    [HALF[k]!, MC.centered, `${fmt(HALF[k]!)}% is only the piece from the mean to ${fmt(a)}. The other 50% is on the far side of the mean.`],
    [CENTRAL[k]!, MC.centered, `${fmt(CENTRAL[k]!)}% is the central region, centered at the mean. This region runs all the way out on one side.`],
    [r9(100 - p), MC.leftDefault, `That is the other side of ${fmt(a)}.`],
  ], 'Half of the area is on each side of the mean; add the piece from the mean to the line.');
};

export const tailPct: Gen = (R, n) => {
  const c = ctxPick(R), [m, s] = modelPick(R, c), k = pick(R, [1, 2, 3]), up = R() < 0.5;
  const a = up ? r9(m + k * s) : r9(m - k * s), p = r9((100 - CENTRAL[k]!) / 2);
  const { N } = pctOrCount(R, p);
  const conv = (q: number) => (N === null ? q : Math.round(N * q / 100));
  return numItem({
    id: `tail-${n}`, family: 'tailPct',
    prompt: `The ${c.what} of ${c.who} is modeled by ${A(NN(m, s))}. ${RULE_ABOUT} ${N === null ? 'About what percent of them are' : `Of ${cnt(N)} ${c.who}, about how many are`} ${up ? c.more : c.less} than ${B(withU(c, a))}?`,
    board: `P(X ${up ? '>' : '<'} ${fmt(a)}) \\approx \\,?`,
    unit: N === null ? '%' : c.noun,
    picture: { card: { x: sdAxis(c, m, s), curves: [normalCurve(m, s)], shades: [{ key: 'sh', lo: up ? a : m - 6 * s, hi: up ? m + 6 * s : a, on: 'C' }] } },
    solution: [`Outside ${k} SD: 100 − ${fmt(CENTRAL[k]!)} = ${fmt(100 - CENTRAL[k]!)}%, split equally between the two tails.`, `${fmt(100 - CENTRAL[k]!)} ÷ 2 = ${N === null ? S(fmt(p) + '%') : fmt(p) + '%'}${N === null ? '' : `, and ${fmt(p / 100, 4)} × ${cnt(N)} = ${S(cnt(conv(p)))}`}`],
    ex: { k, p, N },
  }, conv(p), N === null ? 'pct' : 'plain', `Yes: (100 − ${fmt(CENTRAL[k]!)}) ÷ 2 = ${fmt(p)}%.`, [
    [conv(r9(100 - CENTRAL[k]!)), MC.centralToTail, `${fmt(100 - CENTRAL[k]!)}% is BOTH tails together. One tail is half of it.`],
    [conv(r9(CENTRAL[k]! / 2)), MC.tailHalf, `${fmt(CENTRAL[k]! / 2)}% is half of the CENTRAL region. The tail is half of what is left: (100 − ${fmt(CENTRAL[k]!)}) ÷ 2.`],
    [conv(CENTRAL[k]!), MC.leftDefault, `${fmt(CENTRAL[k]!)}% is the middle. The tail is outside it.`],
  ], `The tail is half of what lies outside the central ${fmt(CENTRAL[k]!)}%.`);
};

export const tailOutside: Gen = (R, n) => {
  const c = ctxPick(R), [m, s] = modelPick(R, c), k = pick(R, [1, 2, 3]);
  const a = r9(m - k * s), b = r9(m + k * s), p = r9(100 - CENTRAL[k]!);
  return numItem({
    id: `tail-out-${n}`, family: 'tailOutside',
    prompt: `The ${c.what} of ${c.who} is modeled by ${A(NN(m, s))}. ${RULE_ABOUT} About what percent of ${c.who} are ${c.less} than ${B(withU(c, a))} or ${c.more} than ${B(withU(c, b))}?`,
    board: `P(X < ${fmt(a)}\\ \\text{or}\\ X > ${fmt(b)}) \\approx \\,?\\%`,
    unit: '%',
    picture: { card: { x: sdAxis(c, m, s), curves: [normalCurve(m, s)], shades: [{ key: 'sh', lo: m - 6 * s, hi: a, on: 'C' }, { key: 'sh2', lo: b, hi: m + 6 * s, on: 'C' }] } },
    solution: [`Within ${k} SD: about ${fmt(CENTRAL[k]!)}%.`, `Outside = 100 − ${fmt(CENTRAL[k]!)} = ${S(fmt(p) + '%')}`],
    ex: { k, p },
  }, p, 'pct', `Yes: 100 − ${fmt(CENTRAL[k]!)} = ${fmt(p)}% in the two tails together.`, [
    [r9(p / 2), undefined, `${fmt(p / 2)}% is one tail. The question asks for both tails together.`],
    [CENTRAL[k]!, MC.leftDefault, `${fmt(CENTRAL[k]!)}% is the middle region. This is outside it.`],
  ], 'Outside the central region = 100% minus the region.');
};

export const bandPctF: Gen = (R, n) => {
  const c = ctxPick(R), [m, s] = modelPick(R, c);
  const [ka, kb] = pick(R, [[1, 2], [2, 3], [1, 3], [1, 2], [2, 3]] as [number, number][]), up = R() < 0.5;
  const a = up ? r9(m + ka * s) : r9(m - kb * s), b = up ? r9(m + kb * s) : r9(m - ka * s), p = bandPct(ka, kb);
  return numItem({
    id: `band-${n}`, family: 'bandPct',
    prompt: `The ${c.what} of ${c.who} is modeled by ${A(NN(m, s))}. ${RULE_ABOUT} About what percent of ${c.who} are between ${B(withU(c, a))} and ${B(withU(c, b))}?`,
    board: `P(${fmt(a)} < X < ${fmt(b)}) \\approx \\,?\\%`,
    unit: '%',
    picture: { card: { x: sdAxis(c, m, s), curves: [normalCurve(m, s)], shades: [{ key: 'sh', lo: a, hi: b, on: 'C' }] } },
    solution: [`Both ends are on the ${up ? 'right' : 'left'}: ${ka} and ${kb} SD from the mean.`, `Two bands hold ${fmt(CENTRAL[kb]!)} − ${fmt(CENTRAL[ka]!)} = ${fmt(CENTRAL[kb]! - CENTRAL[ka]!)}%; one band is half: ${S(fmt(p) + '%')}`],
    ex: { ka, kb, p },
  }, p, 'pct', `Yes: (${fmt(CENTRAL[kb]!)} − ${fmt(CENTRAL[ka]!)}) ÷ 2 = ${fmt(p)}%.`, [
    [r9(CENTRAL[kb]! - CENTRAL[ka]!), MC.oneSided, `${fmt(CENTRAL[kb]! - CENTRAL[ka]!)}% is the band on BOTH sides. One side is half of it.`],
    [CENTRAL[kb]!, MC.centered, 'That is the central region around the mean. This band does not contain the mean.'],
    [HALF[kb]!, MC.centered, `${fmt(HALF[kb]!)}% runs from the mean. This band starts ${ka} SD out.`],
  ], 'A band = (bigger central region − smaller central region) ÷ 2.');
};

export const bandSum: Gen = (R, n) => {
  const c = ctxPick(R), [m, s] = modelPick(R, c);
  const [ka, kb] = pick(R, [[-1, 2], [-2, 1], [-3, 1], [-1, 3], [-2, 3], [-3, 2], [-1, Infinity], [-2, Infinity], [-Infinity, 1], [-Infinity, 2]] as [number, number][]);
  const p = benchPct(ka, kb);
  const Ns = [200, 400, 1000, 2000, 4000].filter(N => Math.abs(N * p / 100 - Math.round(N * p / 100)) < 1e-9);
  const N = R() < 0.5 && Ns.length ? pick(R, Ns) : null;
  const v = N === null ? p : Math.round(N * p / 100);
  const a = r9(m + ka * s), b = r9(m + kb * s);
  const desc = ka === -Infinity ? `${c.less} than ${withU(c, b)}` : kb === Infinity ? `${c.more} than ${withU(c, a)}` : `between ${withU(c, a)} and ${withU(c, b)}`;
  const piece = (k: number) => (Math.abs(k) === Infinity ? '50' : fmt(HALF[Math.abs(k)]!));
  const conv = (q: number) => (N === null ? q : Math.round(N * q / 100));
  const wrongC = Math.abs(ka) === Infinity || Math.abs(kb) === Infinity ? CENTRAL[Math.min(Math.abs(ka), Math.abs(kb))]! : CENTRAL[Math.max(Math.abs(ka), Math.abs(kb))]!;
  return numItem({
    id: `band-sum-${n}`, family: 'bandSum',
    prompt: `The ${c.what} of ${c.who} is modeled by ${A(NN(m, s))}. ${RULE_ABOUT} ${N === null ? 'About what percent of them are' : `Of ${cnt(N)} ${c.who}, about how many are`} ${B(desc)}?`,
    board: `\\mu = ${fmt(m)},\\ \\sigma = ${fmt(s)}`,
    unit: N === null ? '%' : c.noun,
    picture: { card: { x: sdAxis(c, m, s), curves: [normalCurve(m, s)], shades: [{ key: 'sh', lo: ka === -Infinity ? m - 6 * s : a, hi: kb === Infinity ? m + 6 * s : b, on: 'C' }] } },
    solution: [`Split at the mean: the left piece is ${piece(ka)}%, the right piece ${piece(kb)}%.`, `${piece(ka)} + ${piece(kb)} = ${N === null ? S(fmt(p) + '%') : fmt(p) + '%'}${N === null ? '' : `; ${fmt(p / 100, 4)} × ${cnt(N)} = ${S(cnt(v))}`}`],
    ex: { ka, kb, p, N },
  }, v, N === null ? 'pct' : 'plain', `Yes: ${piece(ka)}% + ${piece(kb)}% = ${fmt(p)}%${N === null ? '' : `, about ${cnt(v)}`}.`, [
    [conv(wrongC), MC.centered, 'That central percent assumes the interval is centered at the mean. This one is not: add the two sides separately.'],
    [conv(r9(100 - p)), MC.leftDefault, 'That is the area outside the region.'],
  ], 'Split the region at the mean, find each side from the benchmarks, and add.');
};

export const FAM_A: Record<string, Gen> = {
  densArea, densTotal, densUnequal, curveHeight, curveVsBars, eventWords, eventMeaning, pointEq, pointRound, shapeFit, shapeFacts,
  meanMatch, meanShift, sdMatch, sdHeight, axisTick, axisParam, popCount, popStatement, erCentral, erCount, erBeyond, halfPct, halfSide,
  tailPct, tailOutside, bandPct: bandPctF, bandSum,
};
export const NAMES_A: Record<string, string> = {
  densArea: 'Bar area is the share', densTotal: 'All bar areas add to 1', densUnequal: 'Unequal bins', curveHeight: 'Height is not a share',
  curveVsBars: 'Model versus bars', eventWords: 'Event notation', eventMeaning: 'Reading P( )', pointEq: 'One exact value', pointRound: 'Rounded measurements',
  shapeFit: 'Could it be normal?', shapeFacts: 'Every normal curve', meanMatch: 'Match the mean', meanShift: 'Change the mean', sdMatch: 'Match the SD',
  sdHeight: 'Change the SD', axisTick: 'The SD-scaled axis', axisParam: 'N(mean, SD)', popCount: 'Model count', popStatement: 'Report a model area',
  erCentral: '68-95-99.7', erCount: '68-95-99.7 counts', erBeyond: 'Beyond 3 SD', halfPct: 'Half a central region', halfSide: 'One whole side',
  tailPct: 'One tail', tailOutside: 'Both tails', bandPct: 'A band', bandSum: 'Add the pieces',
};
