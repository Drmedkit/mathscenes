// items.ts: exercise families for "Use a map scale" (primary.ratios.use-map-scale), generated from templates, checked
// exactly, and every wrong answer the classifier recognises carries its misconception id (misconceptions.json).
// A generator gets the SUB-GOAL it practises (plan.ts) and uses that sub-goal's number ranges from the topic JSON.
// Pure: no DOM, no canvas. Pictures are plain params for MapSheet.ts (the page draws them through tryBlock).
import { type Item, type Response, type Verdict, fracValue, int, pick, shuffle } from '../../runtime/item';
import type { CardSpec, BarParams, MapLinesParams, RangeParams, RulerParams, StripsParams } from './MapSheet';
import type { Mark } from '../scale-calculations/ScaleLines';
import { IN_PER_MI, conv, drawnInches, fmt, fmtT, ground, mapLen, possible, r9, range, roundTo } from './mapMaths';

// ---------- families ----------
export type FamilyId =
  | 'verbalTimes' | 'verbalMeaning' | 'ratioTable' | 'zeroPair' | 'barCount' | 'barExt' | 'rfUnit' | 'rfJudge'
  | 'verbalCalc' | 'verbalMixed' | 'decompose' | 'splitPick' | 'rfCalc' | 'metricRoute' | 'customaryFt' | 'customaryMi'
  | 'whyMile' | 'rulerInch' | 'rulerMm' | 'measureCalc' | 'measureKm' | 'mapFromVerbal' | 'mapFromRf' | 'whichWay'
  | 'largerScale' | 'sameRoad' | 'enlarge' | 'enlargeScale' | 'rangePossible' | 'rangeEdge' | 'errorScale'
  | 'errorCompare' | 'reportRound' | 'reportClaim' | 'chooseScale' | 'fitLength';
export const FAMILIES: readonly { id: FamilyId; name: string }[] = [
  { id: 'verbalTimes', name: 'Every inch stands for' },
  { id: 'verbalMeaning', name: 'What the scale says' },
  { id: 'ratioTable', name: 'One scale, every pair' },
  { id: 'zeroPair', name: 'Which table is a scale?' },
  { id: 'barCount', name: 'Count the bar' },
  { id: 'barExt', name: 'The bit left of zero' },
  { id: 'rfUnit', name: 'Same unit both sides' },
  { id: 'rfJudge', name: 'Who reads 1 : n right?' },
  { id: 'verbalCalc', name: 'Part of an inch' },
  { id: 'verbalMixed', name: 'Mixed-number lengths' },
  { id: 'decompose', name: 'Split the big number' },
  { id: 'splitPick', name: 'Pick the split' },
  { id: 'rfCalc', name: 'Map to ground with 1 : n' },
  { id: 'metricRoute', name: 'Centimeters to meters and kilometers' },
  { id: 'customaryFt', name: 'Inches to feet' },
  { id: 'customaryMi', name: 'Inches to miles' },
  { id: 'whyMile', name: 'Why 63,360?' },
  { id: 'rulerInch', name: 'Read the inch ruler' },
  { id: 'rulerMm', name: 'Read the centimeter ruler' },
  { id: 'measureCalc', name: 'Measure, then scale' },
  { id: 'measureKm', name: 'Measure in centimeters, answer in kilometers' },
  { id: 'mapFromVerbal', name: 'Ground to map' },
  { id: 'mapFromRf', name: 'Ground to map with 1 : n' },
  { id: 'whichWay', name: 'Multiply or divide?' },
  { id: 'largerScale', name: 'Which scale is larger?' },
  { id: 'sameRoad', name: 'One road, two maps' },
  { id: 'enlarge', name: 'A bigger copy' },
  { id: 'enlargeScale', name: 'The scale of a copy' },
  { id: 'rangePossible', name: 'Could it be?' },
  { id: 'rangeEdge', name: 'Edge of the range' },
  { id: 'errorScale', name: 'A slip on the map, on the ground' },
  { id: 'errorCompare', name: 'Which slip costs more?' },
  { id: 'reportRound', name: 'How many digits?' },
  { id: 'reportClaim', name: 'Precise is not the same as right' },
  { id: 'chooseScale', name: 'Pick a map for the trip' },
  { id: 'fitLength', name: 'Will it fit the sheet?' },
];
export const FAMILY_NAMES: Record<string, string> = Object.fromEntries(FAMILIES.map(f => [f.id, f.name]));

// ---------- pictures ----------
export type Pic =
  | { kind: 'lines'; p: MapLinesParams; show: string[]; solve: string[]; quiet?: number }
  | { kind: 'ruler'; p: RulerParams; show: string[]; solve: string[] }
  | { kind: 'bar'; p: BarParams; show: string[]; solve: string[] }
  | { kind: 'strips'; p: StripsParams; show: string[]; solve: string[] }
  | { kind: 'range'; p: RangeParams; show: string[]; solve: string[] };
export interface MSItem extends Item { family: FamilyId; picture?: { pic: Pic }; work?: string[] }
type Gen = (R: () => number, n: number, sg?: string) => MSItem;

// ---------- misconception ids ----------
export const MC = {
  equality: 'mc.ratio-rate.scale-statement-as-equality',
  addK: 'mc.ratio-rate.wrong-form-proportional-equation',
  nonProp: 'mc.ratio-rate.scales-non-proportional',
  additive: 'mc.ratio-rate.additive-keep-difference',
  barEdge: 'mc.measurement-units.aligns-at-ruler-end-or-1',
  points: 'mc.count.counts-points-not-intervals',
  mixedUnits: 'mc.ratio-rate.assigns-mixed-units-to-unitless-scale',
  cmOnly: 'mc.ratio-rate.same-unit-scale-depends-on-unit',
  reversed: 'mc.transformations.scale-factor-direction-reversed',
  wholePart: 'mc.decimals.operates-on-whole-part-only',
  addsGroups: 'mc.mul-div.adds-groups-and-group-size',
  wrongPow: 'mc.place-value.recombines-coefficient-with-wrong-scale',
  relabel: 'mc.measurement-units.relabels-without-converting',
  metric100: 'mc.measurement-units.wrong-power-of-ten-metric',
  omitMiddle: 'mc.measurement-units.omits-middle-conversion-factor',
  eighths: 'mc.measurement-units.misreads-fraction-inch-marks',
  endReading: 'mc.measurement-units.end-reading-as-length',
  notConverted: 'mc.ratio-rate.mixed-unit-scale-not-converted',
  wrongOp: 'mc.ratio-rate.scale-factor-wrong-operation',
  bigCoverage: 'mc.ratio-rate.large-scale-means-large-coverage',
  bigNumber: 'mc.ratio-rate.large-scale-means-large-number',
  enlargeDetail: 'mc.ratio-rate.enlarging-map-adds-detail',
  wholeInc: 'mc.measurement-units.uncertainty-whole-increment',
  exact: 'mc.measurement-units.measurement-treated-as-exact',
  exactScale: 'mc.measurement-units.exact-scaling-erases-uncertainty',
  notScaled: 'mc.estimation.error-not-scaled-through-operation',
  digits: 'mc.estimation.decimal-length-guarantees-accuracy',
  srcAccuracy: 'mc.measurement-units.small-reading-error-proves-source-accuracy',
  detailOver: 'mc.ratio-rate.map-detail-overrides-coverage',
} as const;

// ---------- helpers ----------
const A = (s: string | number) => `<b class="a">${s}</b>`;      // map lengths (amber)
const B = (s: string | number) => `<b class="b">${s}</b>`;      // ground lengths (teal)
const same = (a: number, b: number, tol = 1e-6) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
const hit = (v: number, ...xs: number[]) => xs.some(x => Number.isFinite(x) && same(v, x));
/** a quarter-inch length as HTML / TeX / plain (2 3/4) or the decimal */
function q4(x: number): { w: number; n: number; d: number } | null {
  const e = Math.round(x * 4);
  if (Math.abs(e / 4 - x) > 1e-9 || Number.isInteger(x)) return null;
  const w = Math.floor(e / 4), r = e - 4 * w;
  return r === 2 ? { w, n: 1, d: 2 } : { w, n: r, d: 4 };
}
const mixH = (x: number) => { const f = q4(x); return f ? `${f.w ? f.w + '&#8202;' : ''}<span class="fr"><span>${f.n}</span><span>${f.d}</span></span>` : fmt(x); };
const mixT = (x: number) => { const f = q4(x); return f ? `${f.w ? f.w : ''}\\tfrac{${f.n}}{${f.d}}` : fmtT(x); };
const fracAns = (x: number): Response => { const e = Math.round(x * 4), w = Math.floor(e / 4), r = e - 4 * w; return r === 0 ? { kind: 'frac', w, n: 0, d: 1 } : r === 2 ? { kind: 'frac', w, n: 1, d: 2 } : { kind: 'frac', w, n: r, d: 4 }; };
const rfH = (n: number) => `1&#8202;:&#8202;${fmt(n)}`;
const rfT = (n: number) => `1 : ${fmtT(n)}`;
const uT = (u: string) => `\\text{ ${u}}`;
const PLACES: readonly [string, string][] = [['trailhead', 'lake'], ['camp', 'falls'], ['town', 'mine'], ['dock', 'island'], ['farm', 'bridge'], ['parking', 'summit'], ['ranger station', 'tower'], ['school', 'park']];
const AREAS = ['the coast', 'a state park', 'the valley', 'the lake country', 'the river delta', 'the islands'] as const;
const UNIT_NAME: Record<string, string> = { in: 'inches', ft: 'feet', mi: 'miles', cm: 'centimeters', mm: 'millimeters', m: 'meters', km: 'kilometers' };

function choiceItem(R: () => number, base: Omit<MSItem, 'input' | 'choices' | 'answer' | 'check'>, opts: { t: string; ok?: boolean; mc?: string; say: string }[]): MSItem {
  const o = shuffle(R, opts.slice());
  const i = o.findIndex(x => x.ok);
  return {
    ...base, input: 'choice', choices: o.map(x => x.t), answer: { kind: 'choice', i },
    check: (r: Response) => {
      if (r.kind !== 'choice' || !o[r.i]) return { ok: false, say: 'Pick one of the answers.' };
      const c = o[r.i]!;
      return { ok: !!c.ok, mc: c.mc, say: c.say };
    },
  };
}
const numItem = (base: Omit<MSItem, 'input' | 'answer' | 'check'>, ans: number, check: (v: number) => Verdict): MSItem => ({
  ...base, input: 'num', answer: { kind: 'num', v: ans },
  check: (r: Response) => (r.kind === 'num' && Number.isFinite(r.v) ? check(r.v) : { ok: false, say: 'Type a number.' }),
});
const fracItem = (base: Omit<MSItem, 'input' | 'answer' | 'check'>, ans: number, check: (v: number) => Verdict): MSItem => ({
  ...base, input: 'frac', answer: fracAns(ans),
  check: (r: Response) => {
    if (r.kind !== 'frac') return { ok: false, say: 'Type a whole number and a fraction.' };
    const p = fracValue(r);
    return p ? check(p[0] / p[1]) : { ok: false, say: 'Type a whole number, and the fraction as top over bottom.' };
  },
});
/** a lines picture: the map card (optional) over aligned number lines */
function lines(o: {
  rows: [string, number][]; n: number; sub?: number; given?: Mark; via?: Mark; ask?: Mark; wrong?: Mark; ops?: [string, string];
  card?: CardSpec & { len: number };
}, show: string[], solve: string[], quiet?: number): { pic: Pic } {
  const p: MapLinesParams = {
    lines: { rows: o.rows.map(([unit, step]) => ({ unit, step })), n: o.n, sub: o.sub, given: o.given, via: o.via, ask: o.ask, wrong: o.wrong, ops: o.ops },
    card: o.card,
  };
  return { pic: { kind: 'lines', p, show, solve, quiet } };
}
/** intervals for a line that must reach `pos` (in units of the first row) */
const nFor = (pos: number, min = 3) => Math.max(min, Math.ceil(pos + 0.35));
const SHOW2 = ['map', 'seg', 'lines', 'ref', 'nums', 'given', 'ask'], SOLVE2 = ['drop', 'answer'];
const SHOW3 = ['map', 'seg', 'lines', 'ref', 'nums', 'alt', 'given', 'ask'], SOLVE3 = ['drop', 'via', 'answer'];

// ===================== 1. verbal-scale-meaning =====================
function verbalScale(R: () => number): { mu: 'in' | 'cm'; gu: 'mi' | 'km'; s: number } {
  return R() < 0.72 ? { mu: 'in', gu: 'mi', s: pick(R, [2, 3, 4, 5, 10]) } : { mu: 'cm', gu: 'km', s: pick(R, [2, 5]) };
}
const verbalTimes: Gen = (R, k) => {
  const { mu, gu, s } = verbalScale(R), L = int(R, 2, 6), ans = L * s, [a, b] = pick(R, PLACES);
  return numItem({
    id: `verbalTimes-${k}`, family: 'verbalTimes', unit: gu,
    prompt: `The map says ${A(`1 ${mu}`)} = ${B(`${s} ${gu}`)}. The straight line from the ${a} to the ${b} is ${A(`${L} ${mu}`)} on the map. How far is that on the ground?`,
    board: `1${uT(mu)} = ${s}${uT(gu)}`,
    solution: [`Every ${mu} on the map stands for ${s} ${gu}.`, `${L} ${mu} stand for ${L} × ${s} = ${ans} ${gu}.`],
    work: [`${L} \\times ${s} = ${ans}${uT(gu)}`],
    picture: lines({ rows: [[`map, ${mu}`, 1], [`ground, ${gu}`, s]], n: nFor(L + 1, 4), given: { row: 0, v: L }, ask: { row: 1, v: ans }, card: { tag: `1${uT(mu)} = ${s}${uT(gu)}`, len: L, from: a, to: b } }, SHOW2, SOLVE2, 1),
  }, ans, v => same(v, ans) ? { ok: true, say: `Yes: ${L} × ${s} = ${ans} ${gu}.` }
    : hit(v, L) ? { ok: false, mc: MC.equality, say: `${L} ${mu} is the line on the paper. The scale says each ${mu} STANDS FOR ${s} ${gu} of ground.` }
      : hit(v, L + s) ? { ok: false, mc: MC.addK, say: `Adding ${s} once is not the scale. Every ${mu} brings ${s} ${gu}: multiply, ${L} × ${s}.` }
        : { ok: false, say: `Each ${mu} stands for ${s} ${gu}. How many ${mu} are there?` });
};
const verbalMeaning: Gen = (R, k) => {
  const v = int(R, 0, 2), { mu, gu, s } = verbalScale(R);
  if (v === 0) return choiceItem(R, {
    id: `verbalMeaning-${k}`, family: 'verbalMeaning', board: `1${uT(mu)} = ${s}${uT(gu)}`,
    prompt: `A hiking map says ${A(`1 ${mu}`)} = ${B(`${s} ${gu}`)}. What does that mean?`,
    solution: [`Each ${mu} on the map stands for ${s} ${gu} on the ground, so 2 ${mu} stand for ${2 * s} ${gu}, 3 ${mu} for ${3 * s} ${gu}.`],
    picture: lines({ rows: [[`map, ${mu}`, 1], [`ground, ${gu}`, s]], n: 4 }, ['lines', 'ref'], ['nums']),
  }, [
    { t: `Every ${mu} on the map stands for ${s} ${gu} on the ground.`, ok: true, say: `Yes: one ${mu} of map for every ${s} ${gu} of ground, again and again.` },
    { t: `The 1-${mu === 'in' ? 'inch' : 'centimeter'} line on the paper is ${s} ${gu} long.`, mc: MC.equality, say: `The paper line is only 1 ${mu}. It stands for ${s} ${gu}; it is not that long.` },
    { t: `Add ${s} to the map ${UNIT_NAME[mu]} to get the ${UNIT_NAME[gu]}.`, mc: MC.addK, say: `2 ${mu} stand for ${2 * s} ${gu}, not ${2 + s}. Each ${mu} brings ${s} ${gu}: multiply.` },
  ]);
  if (v === 1) {
    const where = pick(R, ['Alaska', 'a national park', 'a county']);
    return choiceItem(R, {
      id: `verbalMeaning-${k}`, family: 'verbalMeaning', board: `1${uT('in')} = 1${uT('mi')}`,
      prompt: `A map of ${where} says ${A('1 in')} = ${B('1 mi')}. Is the 1-inch line on the paper as long as a mile?`,
      solution: ['The 1-inch line stays 1 inch long. It STANDS FOR 1 mile of ground: 63,360 inches.'],
      picture: lines({ rows: [['map, in', 1], ['ground, mi', 1]], n: 4 }, ['lines', 'ref'], ['nums']),
    }, [
      { t: 'No: the 1-inch line stands for a mile of ground.', ok: true, say: 'Right. The = in a scale means "stands for", not "is as long as".' },
      { t: 'Yes: the scale says 1 in = 1 mi, so they are equal.', mc: MC.equality, say: 'A mile of paper would not fit in a backpack! The inch stands for the mile.' },
      { t: 'Only on the ground, not on the map.', say: 'On the paper it is 1 inch. It stands for 1 mile of ground.' },
    ]);
  }
  const L = int(R, 2, 6);
  return choiceItem(R, {
    id: `verbalMeaning-${k}`, family: 'verbalMeaning', board: `${L}${uT(mu)} \\to \\,?${uT(gu)}`,
    prompt: `A line is ${A(`${L} ${mu}`)} long on a map with ${A(`1 ${mu}`)} = ${B(`${s} ${gu}`)}. Which calculation gives the ${UNIT_NAME[gu]} on the ground?`,
    solution: [`Each of the ${L} ${UNIT_NAME[mu]} stands for ${s} ${gu}: ${L} × ${s} = ${L * s} ${gu}.`],
    picture: lines({ rows: [[`map, ${mu}`, 1], [`ground, ${gu}`, s]], n: nFor(L + 1, 4), given: { row: 0, v: L } }, ['lines', 'ref', 'given'], ['nums']),
  }, [
    { t: `${L} × ${s}`, ok: true, say: `Yes: ${L} groups of ${s} ${gu}, ${L * s} ${gu}.` },
    { t: `${L} + ${s}`, mc: MC.addK, say: `Adding ${s} once counts only one inch's worth. Every ${mu} brings ${s} ${gu}.` },
    { t: `${L} ÷ ${s}`, mc: MC.reversed, say: `Map to ground makes lengths bigger: multiply by ${s}.` },
  ]);
};

// ===================== 2. scale-invariance =====================
const ratioTable: Gen = (R, k) => {
  const { mu, gu } = R() < 0.6 ? { mu: 'in', gu: 'mi' } : { mu: 'cm', gu: 'km' };
  const s = mu === 'in' ? pick(R, [3, 4, 2]) : 5;
  const ask = pick(R, [3, 4, 5, 6]), area = pick(R, AREAS);
  const ans = ask * s;
  const rows = [0, 1, 2, ask].filter((x, i, a) => a.indexOf(x) === i).sort((x, y) => x - y);
  const cells = rows.map(x => (x === ask ? '?' : x === 2 ? String(2 * s) : x === 1 ? '' : '0'));
  const tab = `\\begin{array}{c|c} \\text{map, ${mu}} & \\text{ground, ${gu}} \\\\ \\hline ${rows.map((x, i) => `${x} & ${cells[i] === '' ? '\\,' : cells[i]}`).join(' \\\\ ')} \\end{array}`;
  return numItem({
    id: `ratioTable-${k}`, family: 'ratioTable', unit: gu,
    prompt: `On a map of ${area}, ${A(`2 ${mu}`)} stand for ${B(`${2 * s} ${gu}`)}, and ${A(`0 ${mu}`)} for ${B(`0 ${gu}`)}. What do ${A(`${ask} ${mu}`)} stand for?`,
    board: tab,
    solution: [`2 ${mu} → ${2 * s} ${gu}, so 1 ${mu} → ${s} ${gu}.`, `${ask} ${mu} → ${ask} × ${s} = ${ans} ${gu}. The same factor (× ${s}) works for every pair.`],
    work: [`${ask} \\times ${s} = ${ans}${uT(gu)}`],
    picture: lines({ rows: [[`map, ${mu}`, 1], [`ground, ${gu}`, s]], n: 6, given: { row: 0, v: ask }, ask: { row: 1, v: ans } }, ['lines', 'given', 'ask'], ['ref', 'nums', 'drop', 'answer'], 1),
  }, ans, v => same(v, ans) ? { ok: true, say: `Yes: × ${s} for every pair, so ${ask} ${mu} → ${ans} ${gu}.` }
    : hit(v, 2 * s + (ask - 2)) ? { ok: false, mc: MC.additive, say: `Adding ${ask - 2} to both keeps the difference, not the scale. Each ${mu} is ${s} ${gu}: ${ask} × ${s}.` }
      : { ok: false, say: `First find what 1 ${mu} stands for: ${2 * s} ÷ 2.` });
};
const zeroPair: Gen = (R, k) => {
  const s = pick(R, [2, 3, 4, 5]), c = pick(R, [1, 2]), m = pick(R, [4, 6]), area = pick(R, AREAS);
  const row = (f: (x: number) => number) => [0, 1, 2, m].map(x => `${x}→${f(x)}`).join(', ');
  return choiceItem(R, {
    id: `zeroPair-${k}`, family: 'zeroPair', board: `1${uT('in')} \\to ${s}${uT('mi')}`,
    prompt: `Three tables for a map of ${area} pair map inches with ground miles. Which one could come from <b>one</b> map scale?`,
    solution: [`A scale multiplies every map length by the same number: 0 → 0, 1 → ${s}, 2 → ${2 * s}, ${m} → ${m * s}.`, 'Adding the same amount, or starting above 0, is not one scale.'],
    picture: lines({ rows: [['map, in', 1], ['ground, mi', s]], n: 6 }, ['lines', 'ref'], ['nums']),
  }, [
    { t: row(x => x * s), ok: true, say: `Yes: × ${s} every time, and 0 in stands for 0 mi.` },
    { t: row(x => (x === 0 ? 0 : x - 1 + s)), mc: MC.additive, say: `From 1 in on, this adds 1 each time instead of multiplying. 2 in should be twice 1 in.` },
    { t: row(x => (s - c) * x + c), mc: MC.nonProp, say: `0 in of map must stand for 0 mi of ground. This table starts at ${c}.` },
  ]);
};

// ===================== 3. bar-scale =====================
const barCount: Gen = (R, k) => {
  const unit = R() < 0.6 ? 'mi' : 'km', step = pick(R, unit === 'mi' ? [1, 2, 5] : [2, 5, 10]), n = int(R, 4, 6), j = int(R, 2, n - 1);
  const total = n * step, ans = j * step, [a, b] = pick(R, PLACES);
  const ex = A(`0`), ey = A(`${total} ${unit}`);
  return numItem({
    id: `barCount-${k}`, family: 'barCount', unit,
    prompt: `The bar scale runs from ${ex} to ${ey} in ${n} equal blocks. The line from the ${a} to the ${b} covers ${j} blocks, starting at 0. How far is it on the ground?`,
    board: `${n}\\text{ blocks} = ${total}${uT(unit)}`,
    solution: [`One block is ${total} ÷ ${n} = ${step} ${unit}.`, `${j} blocks: ${j} × ${step} = ${ans} ${unit}. Count the blocks (spaces), not the marks.`],
    work: [`${total} \\div ${n} = ${step}`, `${j} \\times ${step} = ${ans}${uT(unit)}`],
    picture: { pic: { kind: 'bar', p: { unit: unit as 'mi' | 'km', step, n, ext: 0, labels: 'ends', a: 0, b: ans, from: a, to: b, ans: `${ans}${uT(unit)}` }, show: ['map', 'seg', 'bar'], solve: ['read', 'answer'] } },
  }, ans, v => same(v, ans) ? { ok: true, say: `Yes: ${j} blocks of ${step} ${unit}.` }
    : hit(v, (j + 1) * step) ? { ok: false, mc: MC.points, say: `${j + 1} counts the marks. The line covers ${j} spaces between them.` }
      : hit(v, j) ? { ok: false, say: `${j} is the number of blocks. Each block is ${step} ${unit}.` }
        : { ok: false, say: `How long is one block? ${total} ÷ ${n}.` });
};
const barExt: Gen = (R, k) => {
  const unit = R() < 0.6 ? 'mi' : 'km', ext = (unit === 'mi' ? pick(R, [4, 2]) : pick(R, [2, 5])) as 2 | 4 | 5, n = 4;
  const m = int(R, 1, 3), j = int(R, 1, ext - 1), f = r9(j / ext), ans = r9(m + f), [a, b] = pick(R, PLACES);
  const fH = ext === 5 ? fmt(f) : mixH(f), ansH = ext === 5 ? fmt(ans) : mixH(ans);
  return numItem({
    id: `barExt-${k}`, family: 'barExt', unit,
    prompt: `The line from the ${a} to the ${b} is laid on the bar scale: its right end sits on the ${A(m)} mark. Its left end reaches into the 1-${unit} part left of 0, which is split into ${ext} equal pieces. How far is it on the ground? (A decimal is fine.)`,
    board: `${m} + \\,?`,
    solution: [`Right of 0: ${m} ${unit}. Left of 0: ${j} of the ${ext} pieces = ${fH} ${unit}.`, `Together: ${ansH} ${unit} = ${fmt(ans)} ${unit}.`],
    work: [`${m} + ${ext === 5 ? fmtT(f) : mixT(f)} = ${ext === 5 ? fmtT(ans) : mixT(ans)}${uT(unit)}`],
    picture: { pic: { kind: 'bar', p: { unit: unit as 'mi' | 'km', step: 1, n, ext, labels: 'all', a: -f, b: m, from: a, to: b, ans: `${ext === 5 ? fmtT(ans) : mixT(ans)}${uT(unit)}` }, show: ['map', 'seg', 'bar'], solve: ['read', 'answer'] } },
  }, ans, v => same(v, ans) ? { ok: true, say: `Yes: ${m} plus ${fH}, ${fmt(ans)} ${unit}.` }
    : hit(v, m + 1) ? { ok: false, mc: MC.barEdge, say: `The bar's left edge is not 0. Zero is the mark where the pieces end; only ${j} of the ${ext} pieces are covered.` }
      : hit(v, m) ? { ok: false, mc: MC.endReading, say: `${m} is where the line ends. The bit left of 0 counts too: ${j} of ${ext} pieces.` }
        : { ok: false, say: `Add the whole ${unit} right of 0 and the pieces left of 0.` });
};

// ===================== 4. ratio-scale-same-unit =====================
const RF = [1000, 24000, 63360, 100000, 25000] as const;
const rfUnit: Gen = (R, k, sg) => {
  if (sg === 'ratio-scale-calc') {
    // the answer stays in the map unit
    const mu = pick(R, ['in', 'cm'] as const), N = pick(R, [24000, 25000, 100000]), L = pick(R, [1.5, 2.5, 3, 0.5, 4]), g = ground(L, N);
    const others = mu === 'in' ? ['feet', 'miles'] : ['meters', 'kilometers'];
    return choiceItem(R, {
      id: `rfUnit-${k}`, family: 'rfUnit', board: `${fmtT(L)}${uT(mu)} \\times ${fmtT(N)} = ${fmtT(g)}\\ \\,?`,
      prompt: `A line is ${A(`${fmt(L)} ${mu}`)} on a ${rfH(N)} map. ${fmt(L)} × ${fmt(N)} = ${fmt(g)}. ${fmt(g)} what?`,
      solution: [`1 : ${fmt(N)} pairs a ${mu === 'in' ? 'inch' : 'centimeter'} with ${fmt(N)} ${UNIT_NAME[mu]}. The answer is still in ${UNIT_NAME[mu]}: ${fmt(g)} ${mu}.`, 'Change to a bigger unit only by converting (÷ 12, ÷ 100, ...).'],
      picture: lines({ rows: [['map', 1], ['ground', N]], n: nFor(L, 3), given: { row: 0, v: L } }, ['lines', 'ref', 'given'], ['nums']),
    }, [
      { t: UNIT_NAME[mu]!, ok: true, say: `Yes: same unit on both sides, ${fmt(g)} ${UNIT_NAME[mu]}.` },
      { t: others[0]!, mc: MC.relabel, say: `Writing "${others[0]}" without converting changes the length. It is ${fmt(g)} ${UNIT_NAME[mu]}.` },
      { t: others[1]!, mc: MC.relabel, say: `The number is ${UNIT_NAME[mu]}. ${others[1]} would need a conversion first.` },
    ]);
  }
  const N = pick(R, RF), mu = pick(R, ['in', 'cm', 'mm'] as const);
  const wrongs = mu === 'cm' ? [['meters', MC.mixedUnits], ['kilometers', MC.mixedUnits]] : [['feet', MC.mixedUnits], ['centimeters, because 1 : n works only in centimeters', MC.cmOnly]];
  return choiceItem(R, {
    id: `rfUnit-${k}`, family: 'rfUnit', board: rfT(N),
    prompt: `On a ${rfH(N)} map, ${A(`1 ${mu}`)} on the map stands for ${B(fmt(N))} ___ on the ground.`,
    solution: [`1 : ${fmt(N)} has no units, so both sides use the SAME unit: 1 ${mu} → ${fmt(N)} ${mu}.`],
    picture: lines({ rows: [['map', 1], ['ground', N]], n: 3 }, ['lines', 'ref'], ['nums']),
  }, [
    { t: UNIT_NAME[mu]!, ok: true, say: `Yes: one unit on both sides, ${fmt(N)} ${UNIT_NAME[mu]}.` },
    { t: wrongs[0]![0]!, mc: wrongs[0]![1]!, say: `A scale without units uses one unit on both sides: 1 ${mu} stands for ${fmt(N)} ${UNIT_NAME[mu]}.` },
    { t: wrongs[1]![0]!, mc: wrongs[1]![1]!, say: `1 : ${fmt(N)} works in any unit, as long as both sides use it: ${fmt(N)} ${UNIT_NAME[mu]}.` },
  ]);
};
const rfJudge: Gen = (R, k) => {
  const N = pick(R, [24000, 100000, 63360, 25000]), who = pick(R, ['Ana', 'Ben', 'Kai', 'Mia', 'Leo']), v = int(R, 0, 1);
  if (v === 0) {
    const wu = pick(R, ['ft', 'mi'] as const);
    return choiceItem(R, {
      id: `rfJudge-${k}`, family: 'rfJudge', board: `${rfT(N)}\\ \\overset{?}{=}\\ 1${uT('in')} : ${fmtT(N)}${uT(wu)}`,
      prompt: `${who} says ${rfH(N)} means 1 in on the map is ${fmt(N)} ${UNIT_NAME[wu]} on the ground. Is ${who} right?`,
      solution: [`1 : ${fmt(N)} uses one unit on both sides: 1 in → ${fmt(N)} in.`, `${fmt(N)} ${UNIT_NAME[wu]} would be ${wu === 'ft' ? '12' : '63,360'} times too much.`],
      picture: lines({ rows: [['map, in', 1], ['ground, in', N]], n: 3 }, ['lines', 'ref'], ['nums']),
    }, [
      { t: `No: 1 : ${fmt(N)} pairs inches with inches, so 1 in is ${fmt(N)} in.`, ok: true, say: 'Right: no units in the scale means the same unit on both sides.' },
      { t: `Yes: ground distances are measured in ${UNIT_NAME[wu]}.`, mc: MC.mixedUnits, say: `You may change to ${UNIT_NAME[wu]} later, by converting. The scale itself pairs inches with inches.` },
      { t: 'No: a ratio scale only works with centimeters.', mc: MC.cmOnly, say: 'A ratio scale works in any unit: inches with inches, centimeters with centimeters.' },
    ]);
  }
  return choiceItem(R, {
    id: `rfJudge-${k}`, family: 'rfJudge', board: `${rfT(N)}\\ \\text{in inches?}`,
    prompt: `${who} says a ${rfH(N)} map can't be measured with an inch ruler, because ratio scales are for centimeters. Is ${who} right?`,
    solution: [`1 : ${fmt(N)} works in any unit: 1 in → ${fmt(N)} in, 1 cm → ${fmt(N)} cm.`],
    picture: lines({ rows: [['map, in', 1], ['ground, in', N]], n: 3 }, ['lines', 'ref'], ['nums']),
  }, [
    { t: `No: 1 in on the map is ${fmt(N)} in on the ground.`, ok: true, say: 'Right: any unit works, as long as both sides use it.' },
    { t: 'Yes: ratio scales only work in centimeters.', mc: MC.cmOnly, say: `Try it: 1 in on the map, ${fmt(N)} in on the ground. Inches work just as well.` },
    { t: `No, but then 1 in stands for ${fmt(N)} ft.`, mc: MC.mixedUnits, say: 'Inches on the map pair with inches on the ground, not feet.' },
  ]);
};

// ===================== 5. verbal-scale-calc =====================
const verbalCalc: Gen = (R, k) => {
  const metric = R() < 0.3;
  const mu = metric ? 'cm' : 'in', gu = metric ? 'km' : 'mi', s = metric ? 5 : pick(R, [2, 5, 10]);
  const L = metric ? r9(int(R, 5, 95) / 10) : r9(int(R, 1, 31) / 4);
  const ans = ground(L, s), [a, b] = pick(R, PLACES), whole = Math.floor(L);
  const LH = metric || R() < 0.5 ? fmt(L) : mixH(L), LT = metric ? fmtT(L) : mixT(L);
  const n = nFor(L + 0.01, 3);
  return numItem({
    id: `verbalCalc-${k}`, family: 'verbalCalc', unit: gu,
    prompt: `On a map with ${A(`1 ${mu}`)} = ${B(`${s} ${gu}`)}, the ${a} and the ${b} are ${A(`${LH} ${mu}`)} apart. How far apart are they on the ground?`,
    board: `${LT}${uT(mu)} \\times ${s}`,
    solution: [`Every ${mu} stands for ${s} ${gu}, the part of an inch too.`, `${fmt(L)} × ${s} = ${fmt(ans)} ${gu}.`],
    work: [`${fmtT(L)} \\times ${s} = ${fmtT(ans)}${uT(gu)}`],
    picture: lines({ rows: [[`map, ${mu}`, 1], [`ground, ${gu}`, s]], n, sub: metric ? 2 : 4, given: { row: 0, v: L, tex: LT }, ask: { row: 1, v: ans }, card: { tag: `1${uT(mu)} = ${s}${uT(gu)}`, len: L, from: a, to: b } }, SHOW2, SOLVE2, 1),
  }, ans, v => same(v, ans) ? { ok: true, say: `Yes: ${fmt(L)} × ${s} = ${fmt(ans)} ${gu}.` }
    : whole > 0 && whole !== L && hit(v, whole * s) ? { ok: false, mc: MC.wholePart, say: `${whole * s} uses only the ${whole} whole ${UNIT_NAME[mu]}. The extra ${fmt(r9(L - whole))} ${mu} stands for ground too.` }
      : hit(v, L / s) ? { ok: false, mc: MC.reversed, say: `Map to ground gets bigger: multiply by ${s}, don't divide.` }
        : { ok: false, say: `Multiply the map length by ${s}: ${fmt(L)} × ${s}.` });
};
const verbalMixed: Gen = (R, k) => {
  const s = pick(R, [2, 4, 10, 3]), L = r9(int(R, 1, 7) + pick(R, [0.25, 0.5, 0.75])), ans = ground(L, s), whole = Math.floor(L);
  const [a, b] = pick(R, PLACES);
  return fracItem({
    id: `verbalMixed-${k}`, family: 'verbalMixed', unit: 'mi',
    prompt: `On a ${A('1 in')} = ${B(`${s} mi`)} map, the trail from the ${a} to the ${b} measures ${A(`${mixH(L)} in`)} in a straight line. How many miles is that? Write it as a mixed number.`,
    board: `${mixT(L)}${uT('in')} \\times ${s}`,
    solution: [`${mixH(L)} = ${whole} + ${mixH(r9(L - whole))}.`, `${whole} × ${s} = ${whole * s}, and ${mixH(r9(L - whole))} × ${s} = ${mixH(r9((L - whole) * s))}.`, `Together: ${mixH(ans)} mi.`],
    work: [`${whole} \\times ${s} + ${mixT(r9(L - whole))} \\times ${s}`, `= ${mixT(ans)}${uT('mi')}`],
    picture: lines({ rows: [['map, in', 1], ['ground, mi', s]], n: nFor(L + 0.01, 3), sub: 4, given: { row: 0, v: L, tex: mixT(L) }, ask: { row: 1, v: ans }, card: { tag: `1${uT('in')} = ${s}${uT('mi')}`, len: L, from: a, to: b } }, SHOW2, SOLVE2, 1),
  }, ans, v => same(v, ans) ? { ok: true, say: `Yes: ${mixH(ans)} mi.` }
    : hit(v, whole * s) ? { ok: false, mc: MC.wholePart, say: `That counts only the ${whole} whole inches. The ${mixH(r9(L - whole))} in is ground too: × ${s}.` }
      : { ok: false, say: `Split it: ${whole} × ${s}, then ${mixH(r9(L - whole))} × ${s}, then add.` });
};

// ===================== 6. decompose-large-multiplier =====================
const DEC_L = [0.5, 1.5, 2.5, 3.5, 0.25, 0.4, 1.2] as const, DEC_N = [1000, 24000, 25000, 100000] as const;
function splitOf(L: number, N: number): { small: number; pow: number; part: number } {
  const pow = N % 100000 === 0 ? 100000 : 1000, small = N / pow;
  return { small, pow, part: r9(L * small) };
}
const decompose: Gen = (R, k, sg) => {
  const L = pick(R, DEC_L), N = sg === 'ratio-scale-calc' ? pick(R, [24000, 25000, 100000]) : pick(R, DEC_N), g = ground(L, N), { small, pow, part } = splitOf(L, N);
  const whole = Math.floor(L);
  return numItem({
    id: `decompose-${k}`, family: 'decompose', unit: 'in',
    prompt: `A line is ${A(`${fmt(L)} in`)} on a ${rfH(N)} map. How many inches is that on the ground? Split ${fmt(N)} into ${fmt(small)} × ${fmt(pow)} first.`,
    board: `${fmtT(L)} \\times ${fmtT(N)}`,
    solution: [`${fmt(N)} = ${fmt(small)} × ${fmt(pow)}.`, `${fmt(L)} × ${fmt(small)} = ${fmt(part)}.`, `${fmt(part)} × ${fmt(pow)} = ${fmt(g)} in.`],
    work: [`${fmtT(L)} \\times ${fmtT(small)} = ${fmtT(part)}`, `${fmtT(part)} \\times ${fmtT(pow)} = ${fmtT(g)}`],
    picture: lines({ rows: [['map, in', 1], ['ground, in', N]], n: 4, sub: 4, given: { row: 0, v: L }, ask: { row: 1, v: g }, card: { tag: rfT(N), len: L } }, SHOW2, SOLVE2, 1),
  }, g, v => same(v, g) ? { ok: true, say: `Yes: ${fmt(part)} × ${fmt(pow)} = ${fmt(g)} in.` }
    : whole > 0 && hit(v, whole * N) ? { ok: false, mc: MC.wholePart, say: `${fmt(whole * N)} uses only the ${whole} whole inch${whole > 1 ? 'es' : ''}. The ${fmt(r9(L - whole))} in counts too.` }
      : whole === 0 && hit(v, N) ? { ok: false, mc: MC.wholePart, say: `${fmt(L)} in is less than 1 in, so the answer is less than ${fmt(N)}.` }
        : hit(v, g * 10, g / 10, g * 100, g / 100) ? { ok: false, mc: MC.wrongPow, say: `${fmt(L)} × ${fmt(small)} = ${fmt(part)} is right; now × ${fmt(pow)} exactly: ${pow === 1000 ? 'three' : 'five'} places.` }
          : hit(v, L + N) ? { ok: false, mc: MC.addsGroups, say: `${fmt(L)} in of map means ${fmt(L)} groups of ${fmt(N)}: multiply.` }
            : { ok: false, say: `First ${fmt(L)} × ${fmt(small)}, then × ${fmt(pow)}.` });
};
const splitPick: Gen = (R, k) => {
  const L = pick(R, [1.5, 2.5, 3.5, 4.5]), N = pick(R, [24000, 25000, 48000, 36000]), { small, pow, part } = splitOf(L, N), g = ground(L, N), whole = Math.floor(L);
  const okText = R() < 0.5 ? `${fmt(L)} × ${small} = ${fmt(part)}, then × ${fmt(pow)} = ${fmt(g)}` : `${whole} × ${fmt(N)} + half of ${fmt(N)} = ${fmt(whole * N)} + ${fmt(N / 2)} = ${fmt(g)}`;
  return choiceItem(R, {
    id: `splitPick-${k}`, family: 'splitPick', board: `${fmtT(L)} \\times ${fmtT(N)}`,
    prompt: `A ${A(`${fmt(L)} in`)} line on a ${rfH(N)} map: which way of working out ${fmt(L)} × ${fmt(N)} is right?`,
    solution: [`${fmt(L)} × ${fmt(N)} = ${fmt(L)} × ${small} × ${fmt(pow)} = ${fmt(part)} × ${fmt(pow)} = ${fmt(g)}.`, `Check by bounds: ${whole} × ${fmt(N)} = ${fmt(whole * N)} < ${fmt(g)} < ${fmt((whole + 1) * N)}.`],
    picture: lines({ rows: [['map, in', 1], ['ground, in', N]], n: nFor(L, 4), sub: 2, given: { row: 0, v: L }, card: { tag: rfT(N), len: L } }, ['map', 'seg', 'lines', 'ref', 'nums', 'given'], []),
  }, [
    { t: okText, ok: true, say: `Yes: ${fmt(g)} in, between ${fmt(whole * N)} and ${fmt((whole + 1) * N)}.` },
    { t: `${whole} × ${fmt(N)} = ${fmt(whole * N)}, and the .5 is too small to matter`, mc: MC.wholePart, say: `Half an inch at this scale is ${fmt(N / 2)} in of ground: it matters.` },
    { t: `${fmt(L)} × ${small} = ${fmt(part)}, then × 100 = ${fmt(part * 100)}`, mc: MC.wrongPow, say: `${fmt(N)} is ${small} × ${fmt(pow)}, not × 100. The answer must be more than ${fmt(whole * N)}.` },
  ]);
};

// ===================== 7. ratio-scale-calc =====================
const rfCalc: Gen = (R, k) => {
  const mu = pick(R, ['in', 'cm'] as const), N = pick(R, [1000, 24000, 25000, 100000]);
  const L = mu === 'in' ? pick(R, [0.5, 1.5, 2.5, 3.5, 4.5, 1.25, 2.75, 0.75, 2, 3]) : pick(R, [0.5, 1.2, 2.5, 3.4, 4.5, 1.6, 2, 3]);
  const g = ground(L, N), whole = Math.floor(L);
  return numItem({
    id: `rfCalc-${k}`, family: 'rfCalc', unit: mu,
    prompt: `A line is ${A(`${fmt(L)} ${mu}`)} on a ${rfH(N)} map. How long is it on the ground, in ${UNIT_NAME[mu]}?`,
    board: `${fmtT(L)}${uT(mu)} \\times ${fmtT(N)}`,
    solution: [`1 : ${fmt(N)}: every ${mu} stands for ${fmt(N)} ${mu}.`, `${fmt(L)} × ${fmt(N)} = ${fmt(g)} ${mu}.`],
    work: [`${fmtT(L)} \\times ${fmtT(N)} = ${fmtT(g)}${uT(mu)}`],
    picture: lines({ rows: [[`map, ${mu}`, 1], [`ground, ${mu}`, N]], n: nFor(L + 0.01, 3), sub: 4, given: { row: 0, v: L }, ask: { row: 1, v: g }, card: { tag: rfT(N), len: L } }, SHOW2, SOLVE2, 1),
  }, g, v => same(v, g) ? { ok: true, say: `Yes: ${fmt(g)} ${mu}, still in ${UNIT_NAME[mu]}.` }
    : hit(v, L) ? { ok: false, mc: MC.equality, say: `${fmt(L)} ${mu} is the paper line. Each ${mu} STANDS FOR ${fmt(N)} ${mu}.` }
      : hit(v, N / L, L / N) ? { ok: false, mc: MC.reversed, say: `Map to ground: multiply by ${fmt(N)}.` }
        : whole > 0 && whole !== L && hit(v, whole * N) ? { ok: false, mc: MC.wholePart, say: `The part after the point counts too: ${fmt(L)}, not ${whole}.` }
          : hit(v, g * 10, g / 10) ? { ok: false, mc: MC.wrongPow, say: `Check the size: between ${fmt(whole * N)} and ${fmt((whole + 1) * N)}.` }
            : { ok: false, say: `${fmt(L)} × ${fmt(N)}: split ${fmt(N)} into a small number × a power of ten.` });
};

// ===================== 8. metric-route =====================
const metricRoute: Gen = (R, k) => {
  const N = pick(R, [24000, 25000, 100000]), L = pick(R, [0.5, 1.5, 2, 2.5, 3, 3.5, 4, 1.2, 4.5]);
  const to = N === 100000 ? pick(R, ['km', 'm'] as const) : pick(R, ['m', 'km'] as const);
  const gcm = ground(L, N), ans = conv(gcm, 'cm', to), m = conv(gcm, 'cm', 'm');
  const step2 = to === 'km' ? r9(N / 100000) : r9(N / 100);
  return numItem({
    id: `metricRoute-${k}`, family: 'metricRoute', unit: to,
    prompt: `A path is ${A(`${fmt(L)} cm`)} on a ${rfH(N)} map. How long is it on the ground, in ${UNIT_NAME[to]}?`,
    board: `${fmtT(L)}${uT('cm')} \\to \\,?${uT(to)}`,
    solution: [`${fmt(L)} × ${fmt(N)} = ${fmt(gcm)} cm.`, `÷ 100: ${fmt(m)} m.${to === 'km' ? ` ÷ 1,000: ${fmt(ans)} km.` : ''}`, N === 100000 ? 'Shortcut: at 1 : 100,000, 1 cm on the map is exactly 1 km.' : ''].filter(Boolean),
    work: [`${fmtT(L)} \\times ${fmtT(N)} = ${fmtT(gcm)}${uT('cm')}`, to === 'km' ? `= ${fmtT(m)}${uT('m')} = ${fmtT(ans)}${uT('km')}` : `= ${fmtT(m)}${uT('m')}`],
    picture: lines({ rows: [['map, cm', 1], ['ground, cm', N], [`ground, ${to}`, step2]], n: nFor(L + 0.01, 3), sub: 2, given: { row: 0, v: L }, via: { row: 1, v: gcm }, ask: { row: 2, v: ans }, card: { tag: rfT(N), len: L } }, SHOW3, SOLVE3, 2),
  }, ans, v => same(v, ans) ? { ok: true, say: `Yes: ${fmt(ans)} ${to}.` }
    : hit(v, gcm) ? { ok: false, mc: MC.relabel, say: `${fmt(gcm)} is in centimeters. Convert: ÷ 100 for meters${to === 'km' ? ', then ÷ 1,000 for kilometers' : ''}.` }
      : to === 'km' && hit(v, m) ? { ok: false, mc: MC.relabel, say: `${fmt(m)} is meters. 1,000 m make 1 km.` }
        : to === 'km' && hit(v, m / 100, gcm / 100 / 100 / 100) ? { ok: false, mc: MC.metric100, say: `1 km is 1,000 m, not 100 m: ${fmt(m)} ÷ 1,000.` }
          : to === 'm' && hit(v, gcm / 1000, gcm / 10) ? { ok: false, mc: MC.metric100, say: '100 cm make 1 m: divide by 100.' }
            : { ok: false, say: `First the ground in cm: ${fmt(L)} × ${fmt(N)}. Then convert.` });
};

// ===================== 9. customary-route =====================
const customaryFt: Gen = (R, k, sg) => {
  const L = sg === 'measure-then-calc' ? pick(R, [1.25, 2.75, 3.5]) : pick(R, [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 0.75, 1.25, 2.25, 3.75]);
  const gin = ground(L, 24000), ft = conv(gin, 'in', 'ft'), [a, b] = pick(R, PLACES);
  return numItem({
    id: `customaryFt-${k}`, family: 'customaryFt', unit: 'ft',
    prompt: `On a ${rfH(24000)} topo map, the ${a} and the ${b} are ${A(`${mixH(L)} in`)} apart. How far apart are they on the ground, in feet?`,
    board: `${mixT(L)}${uT('in')} \\to \\,?${uT('ft')}`,
    solution: [`${fmt(L)} × 24,000 = ${fmt(gin)} in.`, `÷ 12: ${fmt(ft)} ft.`, 'Shortcut printed on USGS maps: 1 in = 2,000 ft.'],
    work: [`${fmtT(L)} \\times 24{,}000 = ${fmtT(gin)}${uT('in')}`, `${fmtT(gin)} \\div 12 = ${fmtT(ft)}${uT('ft')}`],
    picture: lines({ rows: [['map, in', 1], ['ground, in', 24000], ['ground, ft', 2000]], n: nFor(L + 0.01, 3), sub: 4, given: { row: 0, v: L, tex: mixT(L) }, via: { row: 1, v: gin }, ask: { row: 2, v: ft }, card: { tag: rfT(24000), len: L, from: a, to: b } }, SHOW3, SOLVE3, 2),
  }, ft, v => same(v, ft) ? { ok: true, say: `Yes: ${fmt(ft)} ft${ft > 5280 ? ', a bit over a mile' : ''}.` }
    : hit(v, gin) ? { ok: false, mc: MC.relabel, say: `${fmt(gin)} is inches. 12 in make 1 ft: divide by 12.` }
      : hit(v, gin * 12) ? { ok: false, mc: MC.reversed, say: 'Feet are bigger than inches, so there are fewer of them: divide by 12.' }
        : { ok: false, say: `${fmt(L)} × 24,000 in, then ÷ 12. Or the shortcut: ${fmt(L)} × 2,000 ft.` });
};
const customaryMi: Gen = (R, k) => {
  const v = int(R, 0, 2), [a, b] = pick(R, PLACES);
  if (v === 0) {
    const L = pick(R, [1.5, 2.5, 3.25, 4.75, 0.75, 5.5, 2.25]), gin = ground(L, 63360), ft = conv(gin, 'in', 'ft');
    return numItem({
      id: `customaryMi-${k}`, family: 'customaryMi', unit: 'mi',
      prompt: `On a ${rfH(63360)} map of Alaska, a river crossing is ${A(`${mixH(L)} in`)} from the ${a}. How many miles is that on the ground?`,
      board: `${mixT(L)}${uT('in')} \\times 63{,}360`,
      solution: [`${fmt(L)} × 63,360 = ${fmt(gin)} in.`, `÷ 12 = ${fmt(ft)} ft, ÷ 5,280 = ${fmt(L)} mi.`, '63,360 in is exactly 1 mi, so 1 : 63,360 is 1 in = 1 mi.'],
      work: [`${fmtT(gin)}${uT('in')} \\div 12 = ${fmtT(ft)}${uT('ft')}`, `${fmtT(ft)} \\div 5{,}280 = ${fmtT(L)}${uT('mi')}`],
      picture: lines({ rows: [['map, in', 1], ['ground, in', 63360], ['ground, mi', 1]], n: nFor(L + 0.01, 3), sub: 4, given: { row: 0, v: L, tex: mixT(L) }, via: { row: 1, v: gin }, ask: { row: 2, v: L }, card: { tag: rfT(63360), len: L, from: a, to: 'crossing' } }, SHOW3, SOLVE3, 2),
    }, L, x => same(x, L) ? { ok: true, say: `Yes: ${fmt(L)} mi. At 1 : 63,360, every inch is one mile.` }
      : hit(x, L * 12) ? { ok: false, mc: MC.omitMiddle, say: `${fmt(L * 12)} skips the ÷ 12: inches go to feet first, then feet to miles.` }
        : hit(x, gin, ft) ? { ok: false, mc: MC.relabel, say: `That is ${hit(x, gin) ? 'inches' : 'feet'}, not miles. Keep converting.` }
          : { ok: false, say: '63,360 in make 1 mi. How many miles?' });
  }
  // 1 : 24,000 -> miles: exact (2.64 in = 1 mi) or rounded to the hundredth
  const exact = v === 1;
  const L = exact ? pick(R, [2.64, 5.28, 1.32, 3.96, 7.92]) : pick(R, [3, 1.5, 4, 2.5, 3.5, 1.25, 4.5, 6]);
  const ft = r9(L * 2000), mi = ft / 5280, ans = exact ? r9(mi) : roundTo(mi, 2);
  return numItem({
    id: `customaryMi-${k}`, family: 'customaryMi', unit: 'mi',
    prompt: `On a ${rfH(24000)} map, the ${a} is ${A(`${fmt(L)} in`)} from the ${b}. How many miles apart are they on the ground?${exact ? '' : ' Round to the nearest hundredth (a calculator is fine for ÷ 5,280).'}`,
    board: `${fmtT(L)}${uT('in')} \\to \\,?${uT('mi')}`,
    solution: [`${fmt(L)} × 24,000 = ${fmt(r9(L * 24000))} in, ÷ 12 = ${fmt(ft)} ft.`, `${fmt(ft)} ÷ 5,280 = ${exact ? fmt(ans) : `${fmt(roundTo(mi, 5))}… ≈ ${fmt(ans)}`} mi.`, 'Benchmark: 5,280 ft is 1 mi.'],
    work: [`${fmtT(L)} \\times 2{,}000 = ${fmtT(ft)}${uT('ft')}`, `${fmtT(ft)} \\div 5{,}280 ${exact ? '=' : '\\approx'} ${fmtT(ans)}${uT('mi')}`],
    picture: lines({ rows: [['map, in', 1], ['ground, ft', 2000]], n: nFor(L + 0.01, 3), sub: 4, given: { row: 0, v: L }, ask: { row: 1, v: ft }, card: { tag: rfT(24000), len: L, from: a, to: b } }, SHOW2, SOLVE2, 1),
  }, ans, x => Math.abs(x - ans) <= (exact ? 1e-6 : 0.005 + 1e-9) ? { ok: true, say: `Yes: about ${fmt(ans)} mi.` }
    : Math.abs(x - roundTo((L * 24000) / 5280, 2)) <= 0.01 ? { ok: false, mc: MC.omitMiddle, say: `That divides inches by 5,280. Inches → feet (÷ 12) first, then feet → miles.` }
      : hit(x, ft, L * 24000) ? { ok: false, mc: MC.relabel, say: `${fmt(x)} is ${hit(x, ft) ? 'feet' : 'inches'}. Divide by 5,280 to get miles.` }
        : { ok: false, say: `${fmt(L)} in → ${fmt(ft)} ft (1 in = 2,000 ft). Then ÷ 5,280.` });
};
const whyMile: Gen = (R, k) => {
  const v = int(R, 0, 3), src = pick(R, ['a USGS map of Alaska', 'an old county map', 'a state park map', 'a bike map']);
  if (v === 3) {
    const L = pick(R, [1.5, 2, 2.5, 3, 4, 5]);
    return choiceItem(R, {
      id: `whyMile-${k}`, family: 'whyMile', board: `${fmtT(L)}${uT('in')}\\ \\text{at}\\ 1 : 63{,}360`,
      prompt: `On ${src} at ${rfH(63360)}, a lake is ${A(`${fmt(L)} in`)} across. What does that stand for?`,
      solution: [`1 : 63,360: 1 in → 63,360 in, and 63,360 in = 5,280 ft = 1 mi.`, `So ${fmt(L)} in → ${fmt(L)} mi.`],
      picture: lines({ rows: [['map, in', 1], ['ground, in', 63360]], n: nFor(L, 3), given: { row: 0, v: L } }, ['lines', 'ref', 'given'], ['nums']),
    }, [
      { t: `${fmt(L)} mi`, ok: true, say: `Yes: at 1 : 63,360 every inch is one mile.` },
      { t: `${fmt(r9(L * 63360))} ft`, mc: MC.mixedUnits, say: `${fmt(r9(L * 63360))} is inches, not feet: the scale pairs inches with inches. That is ${fmt(L)} mi.` },
      { t: `${fmt(L * 12)} mi`, mc: MC.omitMiddle, say: 'That skips inches → feet. 63,360 in = 5,280 ft = 1 mi.' },
    ]);
  }
  if (v === 0) return choiceItem(R, {
    id: `whyMile-${k}`, family: 'whyMile', board: `1 : 63{,}360 \\;=\\; 1${uT('in')} = 1${uT('mi')}`,
    prompt: `Why is ${src} at ${rfH(63360)} the same as ${A('1 in')} = ${B('1 mi')}?`,
    solution: ['1 mi = 5,280 ft, and 1 ft = 12 in.', '5,280 × 12 = 63,360, so 1 mi = 63,360 in: 1 in → 63,360 in = 1 mi.'],
    picture: lines({ rows: [['map, in', 1], ['ground, in', 63360], ['ground, mi', 1]], n: 3 }, ['lines', 'ref', 'alt'], ['nums']),
  }, [
    { t: 'A mile is 5,280 ft × 12 = 63,360 inches.', ok: true, say: 'Yes: 63,360 inches of ground is exactly one mile.' },
    { t: 'A mile is 63,360 feet.', mc: MC.mixedUnits, say: 'A mile is 5,280 ft. The 63,360 are inches: the same unit as the map inch.' },
    { t: '63,360 ÷ 5,280 = 12, so 1 in stands for 12 mi.', mc: MC.omitMiddle, say: 'That skips inches → feet. 63,360 in ÷ 12 = 5,280 ft = 1 mi.' },
  ]);
  if (v === 1) return choiceItem(R, {
    id: `whyMile-${k}`, family: 'whyMile', board: `1${uT('in')} = 1${uT('mi')} \\;\\to\\; 1 : \\,?`,
    prompt: `The legend of ${src} says ${A('1 in')} = ${B('1 mi')}. Which ratio scale says the same thing?`,
    solution: ['1 mi = 5,280 × 12 in = 63,360 in.', 'So 1 in : 1 mi = 1 in : 63,360 in = 1 : 63,360.'],
    picture: lines({ rows: [['map, in', 1], ['ground, mi', 1]], n: 3 }, ['lines', 'ref'], ['nums']),
  }, [
    { t: '1 : 63,360', ok: true, say: 'Yes: 1 mi is 63,360 in.' },
    { t: '1 : 5,280', mc: MC.mixedUnits, say: '5,280 is feet. A ratio scale needs the same unit: 63,360 in.' },
    { t: '1 : 1', mc: MC.equality, say: '1 : 1 would make the map as big as the ground. 1 mi is 63,360 in.' },
  ]);
  return choiceItem(R, {
    id: `whyMile-${k}`, family: 'whyMile', board: `1 : 24{,}000:\\ 1${uT('in')} \\to \\,?${uT('ft')}`,
    prompt: `${src[0]!.toUpperCase() + src.slice(1)} is at ${rfH(24000)}. What does ${A('1 in')} on it stand for, in feet?`,
    solution: ['1 in → 24,000 in on the ground.', '24,000 ÷ 12 = 2,000 ft.'],
    picture: lines({ rows: [['map, in', 1], ['ground, in', 24000]], n: 3 }, ['lines', 'ref'], ['nums']),
  }, [
    { t: '2,000 ft', ok: true, say: 'Yes: 24,000 in ÷ 12 = 2,000 ft. Handy to remember.' },
    { t: '24,000 ft', mc: MC.mixedUnits, say: '1 : 24,000 pairs inches with inches: 24,000 in, which is 2,000 ft.' },
    { t: '288,000 ft', mc: MC.reversed, say: 'Feet are bigger than inches: divide by 12, don\'t multiply.' },
  ]);
};

// ===================== 10. ruler-subdivisions =====================
const rulerInch: Gen = (R, k) => {
  const start = pick(R, [0, 0, 1, 2]), L = r9(int(R, 3, 18) / 4), [a, b] = pick(R, PLACES);
  const fixedL = start + L > 6 ? r9(L - 2) : L;
  const whole = Math.floor(fixedL), f = r9(fixedL - whole);
  const misread = r9(whole + 2 * f);
  return fracItem({
    id: `rulerInch-${k}`, family: 'rulerInch', unit: 'in',
    prompt: `Measure the line from the ${a} to the ${b} to the nearest quarter inch. ${start ? `It starts at the ${start} mark.` : ''} (The small marks are eighths.)`,
    board: `\\text{length} = \\,?${uT('in')}`,
    solution: [start ? `End reading minus start: subtract ${start}.` : 'It starts at 0, so the end mark is the length.', 'Between two inch marks: the longest mark is 1/2, the next are 1/4 and 3/4, the shortest are eighths.', `Length: ${mixH(fixedL)} in.`],
    work: [start ? `${mixT(start + fixedL)} - ${start} = ${mixT(fixedL)}${uT('in')}` : `${mixT(fixedL)}${uT('in')}`],
    picture: { pic: { kind: 'ruler', p: { unit: 'in', start, len: fixedL, total: 6, from: a, to: b, ans: `${mixT(fixedL)}${uT('in')}` }, show: ['map', 'seg', 'ruler'], solve: ['read', 'answer'] } },
  }, fixedL, v => same(v, fixedL) ? { ok: true, say: `Yes: ${mixH(fixedL)} in.` }
    : start > 0 && hit(v, start + fixedL) ? { ok: false, mc: MC.endReading, say: `${mixH(start + fixedL)} is where it ends. It starts at ${start}: subtract.` }
      : start === 0 && whole > 0 && hit(v, fixedL + 1) ? { ok: false, mc: MC.points, say: 'Count the spaces between the inch marks, not the marks.' }
        : f > 0 && f < 0.5 && hit(v, misread) ? { ok: false, mc: MC.eighths, say: 'The small spaces are eighths. Two eighths make a quarter.' }
          : { ok: false, say: 'Count whole inches first, then the quarters past the last inch mark.' });
};
const rulerMm: Gen = (R, k) => {
  const start = pick(R, [0, 0, 2]), mm = int(R, 18, 75), L = r9(mm / 10), fixedL = start + L > 10 ? r9(L - 2) : L, [a, b] = pick(R, PLACES);
  const inMm = R() < 0.4, ans = inMm ? r9(fixedL * 10) : fixedL, unit = inMm ? 'mm' : 'cm';
  return numItem({
    id: `rulerMm-${k}`, family: 'rulerMm', unit,
    prompt: `Measure the line from the ${a} to the ${b} to the nearest millimeter.${start ? ` It starts at the ${start} cm mark.` : ''} Give it in ${UNIT_NAME[unit]}.`,
    board: `\\text{length} = \\,?${uT(unit)}`,
    solution: [start ? `End reading minus ${start} cm.` : 'It starts at 0.', `Each small mark is 1 mm; 10 mm make 1 cm. Length: ${fmt(fixedL)} cm = ${fmt(r9(fixedL * 10))} mm.`],
    work: [`${fmtT(fixedL)}${uT('cm')} = ${fmtT(r9(fixedL * 10))}${uT('mm')}`],
    picture: { pic: { kind: 'ruler', p: { unit: 'cm', start, len: fixedL, total: 10, from: a, to: b, ans: `${fmtT(ans)}${uT(unit)}` }, show: ['map', 'seg', 'ruler'], solve: ['read', 'answer'] } },
  }, ans, v => same(v, ans) ? { ok: true, say: `Yes: ${fmt(ans)} ${unit}.` }
    : start > 0 && hit(v, inMm ? (start + fixedL) * 10 : start + fixedL) ? { ok: false, mc: MC.endReading, say: `That is where it ends. Subtract the start, ${start} cm.` }
      : inMm && hit(v, fixedL * 100) ? { ok: false, mc: MC.metric100, say: '1 cm is 10 mm, not 100 mm.' }
        : !inMm && hit(v, fixedL * 10) ? { ok: false, mc: MC.relabel, say: `${fmt(fixedL * 10)} is millimeters. In centimeters: ÷ 10.` }
          : { ok: false, say: 'Whole centimeters first, then count the millimeter marks past the last one.' });
};

// ===================== 11. measure-then-calc =====================
const measureCalc: Gen = (R, k) => {
  const sc = pick(R, [{ tag: '1\\text{ in} = 2\\text{ mi}', per: 2, h: `${A('1 in')} = ${B('2 mi')}` }, { tag: '1\\text{ in} = 10\\text{ mi}', per: 10, h: `${A('1 in')} = ${B('10 mi')}` }, { tag: rfT(63360), per: 1, h: rfH(63360) }, { tag: '1\\text{ in} = 5\\text{ mi}', per: 5, h: `${A('1 in')} = ${B('5 mi')}` }]);
  const start = pick(R, [0, 1]), L = r9(int(R, 3, 18) / 4), fixedL = start + L > 6 ? r9(L - 1) : L, ans = ground(fixedL, sc.per), [a, b] = pick(R, PLACES);
  return numItem({
    id: `measureCalc-${k}`, family: 'measureCalc', unit: 'mi',
    prompt: `The map's scale is ${sc.h}. Measure the line from the ${a} to the ${b} (nearest quarter inch${start ? `; it starts at the ${start} mark` : ''}), then find the straight-line ground distance.`,
    board: `\\text{measure} \\times ${sc.per}`,
    solution: [`The line is ${mixH(fixedL)} in.`, `${fmt(fixedL)} × ${sc.per} = ${fmt(ans)} mi${sc.per === 1 ? ' (1 : 63,360 is 1 in = 1 mi)' : ''}.`],
    work: [`${mixT(fixedL)}${uT('in')} \\times ${sc.per} = ${fmtT(ans)}${uT('mi')}`],
    picture: { pic: { kind: 'ruler', p: { unit: 'in', start, len: fixedL, total: 6, tag: sc.tag, from: a, to: b, ans: `${mixT(fixedL)}${uT('in')}` }, show: ['map', 'seg', 'ruler'], solve: ['read', 'answer'] } },
  }, ans, v => same(v, ans) ? { ok: true, say: `Yes: ${mixH(fixedL)} in on the map, ${fmt(ans)} mi on the ground.` }
    : start > 0 && hit(v, (start + fixedL) * sc.per) ? { ok: false, mc: MC.endReading, say: `The line starts at ${start}, not 0: it is ${mixH(fixedL)} in long.` }
      : sc.per > 1 && hit(v, fixedL) ? { ok: false, mc: MC.equality, say: `${mixH(fixedL)} in is the map length. Now use the scale: × ${sc.per}.` }
        : { ok: false, say: `Measure first (${start ? `end minus ${start}` : 'from 0'}), then × ${sc.per}.` });
};
const measureKm: Gen = (R, k) => {
  const N = pick(R, [100000, 50000, 25000]), start = pick(R, [0, 2]), mm = int(R, 15, 70), fixedL = start + mm / 10 > 10 ? r9(mm / 10 - 2) : r9(mm / 10);
  const km = conv(ground(fixedL, N), 'cm', 'km'), [a, b] = pick(R, PLACES);
  return numItem({
    id: `measureKm-${k}`, family: 'measureKm', unit: 'km',
    prompt: `This map is ${rfH(N)}. Measure the line from the ${a} to the ${b} to the nearest millimeter${start ? ` (it starts at the ${start} cm mark)` : ''}. How many kilometers is it on the ground?`,
    board: `${rfT(N)}`,
    solution: [`The line is ${fmt(fixedL)} cm.`, `${fmt(fixedL)} × ${fmt(N)} = ${fmt(ground(fixedL, N))} cm = ${fmt(km)} km (100,000 cm in 1 km).`],
    work: [`${fmtT(fixedL)} \\times ${fmtT(N)} = ${fmtT(ground(fixedL, N))}${uT('cm')}`, `= ${fmtT(km)}${uT('km')}`],
    picture: { pic: { kind: 'ruler', p: { unit: 'cm', start, len: fixedL, total: 10, tag: rfT(N), from: a, to: b, ans: `${fmtT(fixedL)}${uT('cm')}` }, show: ['map', 'seg', 'ruler'], solve: ['read', 'answer'] } },
  }, km, v => same(v, km) ? { ok: true, say: `Yes: ${fmt(fixedL)} cm on the map, ${fmt(km)} km on the ground.` }
    : start > 0 && hit(v, conv(ground(start + fixedL, N), 'cm', 'km')) ? { ok: false, mc: MC.endReading, say: `The line starts at ${start} cm: it is ${fmt(fixedL)} cm long.` }
      : hit(v, ground(fixedL, N)) ? { ok: false, mc: MC.relabel, say: `${fmt(ground(fixedL, N))} is centimeters. 100,000 cm make 1 km.` }
        : hit(v, km * 10, km / 10, km * 100, km / 100) ? { ok: false, mc: MC.metric100, say: 'cm → m is ÷ 100, m → km is ÷ 1,000.' }
          : { ok: false, say: `Measure in cm, × ${fmt(N)}, then ÷ 100,000 for km.` });
};

// ===================== 12. map-from-ground =====================
const mapFromVerbal: Gen = (R, k) => {
  const s = pick(R, [2, 5, 10, 4]), L = pick(R, [1.5, 2, 2.5, 3, 3.5, 4, 4.5, 1.25, 2.75, 3.25]), G = ground(L, s), [a, b] = pick(R, PLACES);
  return numItem({
    id: `mapFromVerbal-${k}`, family: 'mapFromVerbal', unit: 'in',
    prompt: `The ${a} is ${B(`${fmt(G)} mi`)} from the ${b}. How long a line do you draw on a ${A('1 in')} = ${B(`${s} mi`)} map?`,
    board: `${fmtT(G)}${uT('mi')} \\to \\,?${uT('in')}`,
    solution: [`Each inch stands for ${s} mi. How many ${s}s fit in ${fmt(G)}?`, `${fmt(G)} ÷ ${s} = ${fmt(L)} in.`],
    work: [`${fmtT(G)} \\div ${s} = ${fmtT(L)}${uT('in')}`],
    picture: lines({ rows: [['map, in', 1], ['ground, mi', s]], n: nFor(L + 0.01, 3), sub: 4, given: { row: 1, v: G }, ask: { row: 0, v: L, tex: mixT(L) }, card: { tag: `1${uT('in')} = ${s}${uT('mi')}`, len: L, from: b, to: a } }, ['map', 'lines', 'ref', 'nums', 'given', 'ask'], ['drop', 'answer', 'seg'], 0),
  }, L, v => same(v, L) ? { ok: true, say: `Yes: ${fmt(L)} in on the map.` }
    : hit(v, G * s) ? { ok: false, mc: MC.wrongOp, say: 'Ground to map makes lengths smaller: divide by the scale, don\'t multiply.' }
      : { ok: false, say: `${fmt(G)} ÷ ${s}.` });
};
const mapFromRf: Gen = (R, k) => {
  const N = pick(R, [24000, 25000, 100000, 50000]);
  const L = N === 100000 ? pick(R, [2, 3.5, 4, 1.5, 2.5]) : pick(R, [2, 3, 4, 5, 6, 2.5, 3.5]);
  const gcm = ground(L, N), useM = N !== 100000 && R() < 0.5, G = conv(gcm, 'cm', useM ? 'm' : 'km'), gu = useM ? 'm' : 'km';
  return numItem({
    id: `mapFromRf-${k}`, family: 'mapFromRf', unit: 'cm',
    prompt: `A lake trail is ${B(`${fmt(G)} ${gu}`)} long, straight. How long is it on a ${rfH(N)} map, in centimeters?`,
    board: `${fmtT(G)}${uT(gu)} \\to \\,?${uT('cm')}`,
    solution: [`Change the ground to the map unit first: ${fmt(G)} ${gu} = ${fmt(gcm)} cm.`, `Then ÷ ${fmt(N)}: ${fmt(L)} cm.`],
    work: [`${fmtT(G)}${uT(gu)} = ${fmtT(gcm)}${uT('cm')}`, `${fmtT(gcm)} \\div ${fmtT(N)} = ${fmtT(L)}${uT('cm')}`],
    picture: lines({ rows: [['map, cm', 1], ['ground, cm', N], [`ground, ${gu}`, conv(N, 'cm', gu)]], n: nFor(L + 0.01, 3), sub: 2, given: { row: 2, v: G }, via: { row: 1, v: gcm }, ask: { row: 0, v: L }, card: { tag: rfT(N), len: L } }, ['map', 'lines', 'ref', 'nums', 'alt', 'given', 'ask'], ['drop', 'via', 'answer', 'seg'], 0),
  }, L, v => same(v, L) ? { ok: true, say: `Yes: ${fmt(L)} cm on the map.` }
    : hit(v, G / N) ? { ok: false, mc: MC.notConverted, say: `${fmt(G)} is ${UNIT_NAME[gu]}, the map is in cm. Convert to cm before dividing.` }
      : hit(v, G * N, gcm * N) ? { ok: false, mc: MC.wrongOp, say: 'Ground to map: divide by the scale number.' }
        : hit(v, L * 10, L / 10, L * 100, L / 100) ? { ok: false, mc: MC.metric100, say: `Check the conversion: 1 m = 100 cm, 1 km = 100,000 cm.` }
          : { ok: false, say: `${fmt(G)} ${gu} in cm, then ÷ ${fmt(N)}.` });
};
const whichWay: Gen = (R, k) => {
  const toMap = R() < 0.5, N = pick(R, [24000, 63360, 100000, 25000]), what = pick(R, ['a lake', 'a ridge', 'a runway', 'a beach']);
  const ops: [string, string] = [`\\times ${fmtT(N)}`, `\\div ${fmtT(N)}`];
  return choiceItem(R, {
    id: `whichWay-${k}`, family: 'whichWay', board: toMap ? `\\text{ground} \\to \\text{map}` : `\\text{map} \\to \\text{ground}`,
    prompt: toMap ? `You know how long ${what} is on the ground, in inches. To draw it on a ${rfH(N)} map, you…` : `${what[0]!.toUpperCase() + what.slice(1)} measures some inches on a ${rfH(N)} map. To find its real length in inches, you…`,
    solution: [toMap ? `Ground → map: the map is smaller, so divide by ${fmt(N)}.` : `Map → ground: the ground is bigger, so multiply by ${fmt(N)}.`],
    picture: lines({ rows: [['map, in', 1], ['ground, in', N]], n: 4, ops }, ['lines', 'ref', 'down', 'up'], ['nums']),
  }, toMap ? [
    { t: `divide by ${fmt(N)}`, ok: true, say: `Yes: every ${fmt(N)} in of ground shrinks to 1 in of map.` },
    { t: `multiply by ${fmt(N)}`, mc: MC.wrongOp, say: `Multiplying makes it ${fmt(N)} times bigger, not smaller. Ground → map: divide.` },
    { t: `subtract ${fmt(N)}`, mc: MC.addK, say: 'A scale multiplies or divides; it never adds or takes away.' },
  ] : [
    { t: `multiply by ${fmt(N)}`, ok: true, say: `Yes: each map inch stands for ${fmt(N)} in.` },
    { t: `divide by ${fmt(N)}`, mc: MC.reversed, say: `Dividing makes it smaller than the map. Map → ground: multiply.` },
    { t: `add ${fmt(N)}`, mc: MC.addK, say: `Adding ${fmt(N)} once counts only one inch. Every inch stands for ${fmt(N)}: multiply.` },
  ]);
};

// ===================== 13. compare-denominators =====================
const largerScale: Gen = (R, k) => {
  const pool = shuffle(R, [24000, 48000, 63360, 100000, 250000]).slice(0, 3).sort((a, b) => a - b);
  const [s, m, l] = pool as [number, number, number];
  const v = int(R, 0, 1);
  const strips = (show: string[]) => ({ pic: { kind: 'strips' as const, p: { ns: pool, mi: 1, name: 'a 1-mile road at each scale' }, show, solve: ['lines'] } });
  if (v === 0) return choiceItem(R, {
    id: `largerScale-${k}`, family: 'largerScale', board: `\\tfrac{1}{${fmtT(s)}},\\ \\tfrac{1}{${fmtT(m)}},\\ \\tfrac{1}{${fmtT(l)}}`,
    prompt: `Three maps: ${rfH(s)}, ${rfH(m)}, ${rfH(l)}. Which has the <b>largest</b> scale?`,
    solution: [`Read 1 : n as the fraction 1/n. 1/${fmt(s)} is the biggest fraction.`, `So ${rfH(s)} is the largest scale: a 1-mile road is drawn longest on it.`],
    picture: strips(['rows']),
  }, [
    { t: `1 : ${fmt(s)}`, ok: true, say: `Yes: the smallest denominator, the least shrinking, the longest road.` },
    { t: `1 : ${fmt(l)}`, mc: MC.bigNumber, say: `${fmt(l)} is the biggest number, but 1/${fmt(l)} is the smallest fraction: things are drawn tiny.` },
    { t: `1 : ${fmt(m)}`, say: `In the middle. The largest scale has the smallest denominator.` },
  ]);
  return choiceItem(R, {
    id: `largerScale-${k}`, family: 'largerScale', board: `${rfT(s)}\\ \\text{vs}\\ ${rfT(l)}`,
    prompt: `Map P is ${rfH(s)}, map Q is ${rfH(l)}, on the same size sheet. Which is true?`,
    solution: ['Large scale = small denominator: P. Things are drawn bigger on P.', 'Q shrinks more, so the same sheet holds more ground: Q covers more.'],
    picture: strips(['rows']),
  }, [
    { t: 'P is the larger scale; Q covers more ground.', ok: true, say: 'Yes: larger scale, more room for detail; smaller scale, more ground on the sheet.' },
    { t: 'Q is the larger scale, because it covers more ground.', mc: MC.bigCoverage, say: '"Large scale" is about how big things are drawn, not how much ground fits. Q draws the road shorter.' },
    { t: `Q is the larger scale, because ${fmt(l)} is bigger.`, mc: MC.bigNumber, say: `1/${fmt(l)} is a smaller fraction than 1/${fmt(s)}: Q draws everything smaller.` },
  ]);
};
const sameRoad: Gen = (R, k) => {
  const pair = pick(R, [[24000, 48000], [25000, 100000], [24000, 72000], [50000, 100000], [100000, 25000], [48000, 24000]] as const);
  const [a, b] = pair, L = pick(R, a < b ? [1, 1.5, 2, 2.5, 3] : [0.5, 1, 1.5, 2]);
  const ans = r9(L * a / b), mi = r9(L * a / IN_PER_MI);
  return numItem({
    id: `sameRoad-${k}`, family: 'sameRoad', unit: 'in',
    prompt: `A straight road is ${A(`${fmt(L)} in`)} long on a ${rfH(a)} map. How long is the same road on a ${rfH(b)} map?`,
    board: `${rfT(a)} \\to ${rfT(b)}`,
    solution: [`On the ground: ${fmt(L)} × ${fmt(a)} = ${fmt(r9(L * a))} in.`, `On the other map: ${fmt(r9(L * a))} ÷ ${fmt(b)} = ${fmt(ans)} in.`, b < a ? 'Smaller denominator, larger scale: the line gets longer.' : 'Bigger denominator, smaller scale: the line gets shorter.'],
    work: [`${fmtT(L)} \\times ${fmtT(a)} = ${fmtT(r9(L * a))}${uT('in')}`, `${fmtT(r9(L * a))} \\div ${fmtT(b)} = ${fmtT(ans)}${uT('in')}`],
    picture: { pic: { kind: 'strips', p: { ns: [a, b], mi, name: 'the same road on both maps', ans: [`${fmtT(L)}${uT('in')}`, `${fmtT(ans)}${uT('in')}`] }, show: ['rows', 'lines'], solve: ['answer'] } },
  }, ans, v => same(v, ans) ? { ok: true, say: `Yes: ${fmt(ans)} in.` }
    : hit(v, r9(L * b / a)) ? { ok: false, mc: MC.bigNumber, say: `A bigger denominator draws things SMALLER. ${b > a ? 'Shorter' : 'Longer'} on the ${rfH(b)} map.` }
      : { ok: false, say: `Find the road on the ground (× ${fmt(a)}), then put it on the other map (÷ ${fmt(b)}).` });
};

// ===================== 14. detail-vs-information =====================
const enlarge: Gen = (R, k) => {
  const n = pick(R, [48000, 100000, 50000]), f = pick(R, [2, 2, 4].filter(x => n % x === 0)), v = int(R, 0, 1), pct = f * 100, kind = pick(R, ['trail', 'park', 'canoe', 'bike']);
  const pic = { pic: { kind: 'strips' as const, p: { ns: [n, n / f], mi: 1, name: 'a 1-mile road', tags: [rfT(n), `\\text{copy at } ${pct}\\%`] }, show: ['rows', 'lines'], solve: [] } };
  if (v === 0) return choiceItem(R, {
    id: `enlarge-${k}`, family: 'enlarge', board: `${rfT(n)} \\xrightarrow{\\times ${f}} \\text{copy}`,
    prompt: `A ${rfH(n)} ${kind} map is copied at ${pct}%, so every length is ${f} times as long. Does the copy show trails the original did not?`,
    solution: ['Copying makes every mark bigger, but it adds no new marks.', 'New trails need a map MADE at a larger scale, from the ground.'],
    picture: pic,
  }, [
    { t: 'No: the same trails, just drawn bigger.', ok: true, say: 'Right: an enlarged map gives you room, not new information.' },
    { t: 'Yes: a bigger map always shows more detail.', mc: MC.enlargeDetail, say: 'The copier can only stretch what is already printed. No new trails appear.' },
    { t: `Yes: it is now as detailed as a real ${rfH(n / f)} map.`, mc: MC.enlargeDetail, say: `It has the scale ${rfH(n / f)}, but only the marks of the original. A map made at that scale shows more.` },
  ]);
  return choiceItem(R, {
    id: `enlarge-${k}`, family: 'enlarge', board: `\\text{copy at } ${pct}\\% \\ \\text{vs}\\ ${rfT(n / f)}`,
    prompt: `Which shows more for your ${kind} trip: a ${rfH(n)} map copied at ${pct}%, or a map made at ${rfH(n / f)}?`,
    solution: [`Both draw a mile the same length now (${rfH(n / f)}).`, 'Only the map made at that scale was drawn with room for more trails and details.'],
    picture: pic,
  }, [
    { t: `The map made at ${rfH(n / f)}`.replace(/&#8202;/g, ' '), ok: true, say: 'Yes: it was surveyed and drawn at that scale. The copy just stretches the old marks.' },
    { t: 'The enlarged copy, because it is bigger', mc: MC.enlargeDetail, say: 'Bigger marks are not more marks. The copy has only what the original had.' },
    { t: 'They show the same, because the scales match', mc: MC.enlargeDetail, say: 'Same scale, different information: the copy adds nothing new.' },
  ]);
};
const enlargeScale: Gen = (R, k) => {
  const n = pick(R, [48000, 100000, 50000, 63360, 250000]), f = pick(R, [2, 4, 5].filter(x => n % x === 0)), ans = n / f;
  return numItem({
    id: `enlargeScale-${k}`, family: 'enlargeScale', unit: '',
    prompt: `A ${rfH(n)} map is enlarged so every length is ${f} times as long. Its new scale is 1 : ?`,
    board: `${rfT(n)} \\xrightarrow{\\times ${f}} 1 : \\,?`,
    solution: [`1 in on the old map stands for ${fmt(n)} in. After the copy, that inch is ${f} in long.`, `So ${f} in stand for ${fmt(n)} in: 1 in stands for ${fmt(n)} ÷ ${f} = ${fmt(ans)} in.`],
    work: [`${fmtT(n)} \\div ${f} = ${fmtT(ans)}`],
    picture: { pic: { kind: 'strips', p: { ns: [n, ans], mi: 1, name: 'a 1-mile road', tags: [rfT(n), `\\times ${f}\\ \\text{copy}`], ans: ['', `1 : ${fmtT(ans)}`] }, show: ['rows', 'lines'], solve: ['answer'] } },
  }, ans, v => same(v, ans) ? { ok: true, say: `Yes: 1 : ${fmt(ans)}, a larger scale (but no new information).` }
    : hit(v, n * f) ? { ok: false, mc: MC.reversed, say: `Bigger lengths mean each inch stands for LESS ground: ${fmt(n)} ÷ ${f}.` }
      : { ok: false, say: `${f} in now stand for ${fmt(n)} in. What does 1 in stand for?` });
};

// ===================== 15. reading-as-range =====================
interface Prec { unit: string; step: number; frac?: boolean; dp: number }
const PRECS: Prec[] = [{ unit: 'cm', step: 0.1, dp: 2 }, { unit: 'mm', step: 1, dp: 1 }, { unit: 'in', step: 0.25, frac: true, dp: 3 }];
function rangeSetup(R: () => number): { p: Prec; reading: number; lo: number; hi: number; minor: number; major: number } {
  const p = pick(R, PRECS);
  const reading = p.unit === 'cm' ? r9(int(R, 31, 79) / 10) : p.unit === 'mm' ? int(R, 25, 90) : r9(int(R, 5, 19) / 4);
  const lo = r9(reading - 2 * p.step), hi = r9(reading + 2 * p.step);
  const minor = p.unit === 'in' ? 0.125 / 2 : r9(p.step / 10), major = p.step;
  return { p, reading, lo, hi, minor, major };
}
const rText = (x: number, pr: Prec) => (pr.frac ? mixH(x) : fmt(x));
/** a sixteenth-inch length as plain text: 2 11/16 */
function plain16(x: number): string {
  const e = Math.round(x * 16), w = Math.floor(e / 16); let r = e - 16 * w, d = 16;
  while (r && r % 2 === 0) { r /= 2; d /= 2; }
  return r ? `${w ? w + ' ' : ''}${r}/${d}` : String(w);
}
const rangePossible: Gen = (R, k) => {
  const { p, reading, lo, hi, minor, major } = rangeSetup(R);
  const half = p.step / 2, [a, b] = range(reading, p.step);
  const side = R() < 0.5 ? -1 : 1;
  const inside = p.frac ? r9(reading + side * 0.0625) : r9(reading + side * (p.unit === 'mm' ? pick(R, [0.2, 0.3, 0.4]) : pick(R, [0.02, 0.03, 0.04])));
  const outside = p.frac ? r9(reading - side * 0.1875) : r9(reading - side * (p.unit === 'mm' ? pick(R, [0.7, 0.8]) : pick(R, [0.07, 0.08])));
  const fmtv = (x: number) => (p.frac ? plain16(x) : fmt(x));
  const nearest = p.frac ? 'quarter inch' : p.unit === 'cm' ? 'tenth of a centimeter' : 'millimeter';
  return choiceItem(R, {
    id: `rangePossible-${k}`, family: 'rangePossible', board: `\\text{reading: } ${p.frac ? mixT(reading) : fmtT(reading)}${uT(p.unit)}`,
    prompt: `A map line measures ${A(`${rText(reading, p)} ${p.unit}`)}, to the nearest ${nearest}. Which true length is possible?`,
    solution: [`To the nearest ${nearest} means within half a ${nearest} either way: ${p.frac ? `${fmtv(a)} to ${fmtv(b)}` : `${fmt(a)} to ${fmt(b)}`} ${p.unit}.`, `${fmtv(inside)} is inside that range; ${fmtv(outside)} is not.`],
    picture: { pic: { kind: 'range', p: { lo, hi, minor, major, reading, unitStep: p.step, unit: p.unit, frac: p.frac, cands: [{ v: inside }, { v: outside }], ends: !p.frac }, show: ['line', 'reading', 'cands'], solve: ['band', 'ends'] } },
  }, [
    { t: `${fmtv(inside)} ${p.unit}`, ok: true, say: `Yes: it rounds to ${rText(reading, p)}. Half a ${nearest} either way is allowed.` },
    { t: `${fmtv(outside)} ${p.unit}`, mc: MC.wholeInc, say: `That would round to a different reading. The range is only half a ${nearest} each way, ${fmt(half)} ${p.unit}.` },
    { t: `Only exactly ${fmtv(reading)} ${p.unit}`, mc: MC.exact, say: 'A ruler reading is rounded. Many true lengths give the same reading.' },
  ]);
};
const rangeEdge: Gen = (R, k) => {
  let s = rangeSetup(R);
  while (s.p.frac) s = rangeSetup(R);
  const { p, reading, lo, hi, minor, major } = s;
  const top = R() < 0.6, [a, b] = range(reading, p.step), ans = top ? b : a;
  const nearest = p.unit === 'cm' ? 'tenth of a centimeter' : 'millimeter';
  return numItem({
    id: `rangeEdge-${k}`, family: 'rangeEdge', unit: p.unit,
    prompt: `A trail measures ${A(`${fmt(reading)} ${p.unit}`)} on the map, to the nearest ${nearest}. What is the ${top ? 'longest' : 'shortest'} the true map length could be (the edge of the range)?`,
    board: `${fmtT(reading)} \\pm \\,?`,
    solution: [`Half of ${fmt(p.step)} ${p.unit} is ${fmt(p.step / 2)} ${p.unit}.`, `${fmt(reading)} ${top ? '+' : '−'} ${fmt(p.step / 2)} = ${fmt(ans)} ${p.unit}.`],
    work: [`${fmtT(reading)} ${top ? '+' : '-'} ${fmtT(p.step / 2)} = ${fmtT(ans)}`],
    picture: { pic: { kind: 'range', p: { lo, hi, minor, major, reading, unitStep: p.step, unit: p.unit, ends: true }, show: ['line', 'reading'], solve: ['band', 'ends'] } },
  }, ans, v => same(v, ans) ? { ok: true, say: `Yes: half a ${nearest} ${top ? 'above' : 'below'}, ${fmt(ans)} ${p.unit}.` }
    : hit(v, top ? reading + p.step : reading - p.step) ? { ok: false, mc: MC.wholeInc, say: `That is a whole ${nearest} away; it would round to the next reading. Only half: ${fmt(p.step / 2)}.` }
      : hit(v, reading) ? { ok: false, mc: MC.exact, say: `The reading is rounded: the true length can be a little ${top ? 'more' : 'less'}.` }
        : { ok: false, say: `Half a ${nearest} either way: ${fmt(reading)} ${top ? '+' : '−'} ${fmt(p.step / 2)}.` });
};

// ===================== 16. error-propagation =====================
const ERRS = [
  { e: 1, eu: 'mm', n: 24000, to: 'm' }, { e: 0.5, eu: 'mm', n: 24000, to: 'm' }, { e: 1, eu: 'mm', n: 48000, to: 'm' }, { e: 0.5, eu: 'mm', n: 48000, to: 'm' },
  { e: 1, eu: 'mm', n: 100000, to: 'm' }, { e: 1, eu: 'mm', n: 25000, to: 'm' }, { e: 0.1, eu: 'in', n: 24000, to: 'ft' }, { e: 0.1, eu: 'in', n: 63360, to: 'ft' },
  { e: 0.05, eu: 'cm', n: 24000, to: 'm' }, { e: 0.2, eu: 'mm', n: 50000, to: 'm' },
] as const;
const errorScale: Gen = (R, k) => {
  const E = pick(R, ERRS), g = conv(E.e * E.n, E.eu, E.to), raw = r9(E.e * E.n);
  const [a] = pick(R, PLACES);
  return numItem({
    id: `errorScale-${k}`, family: 'errorScale', unit: E.to,
    prompt: `You might misread the map line to the ${a} by ${A(`${fmt(E.e)} ${E.eu}`)}. On a ${rfH(E.n)} map, how big is that slip on the ground, in ${UNIT_NAME[E.to]}?`,
    board: `${fmtT(E.e)}${uT(E.eu)} \\times ${fmtT(E.n)}`,
    solution: [`The slip is scaled like any map length: ${fmt(E.e)} × ${fmt(E.n)} = ${fmt(raw)} ${E.eu}.`, `= ${fmt(g)} ${E.to}.`],
    work: [`${fmtT(E.e)} \\times ${fmtT(E.n)} = ${fmtT(raw)}${uT(E.eu)}`, `= ${fmtT(g)}${uT(E.to)}`],
    picture: lines({ rows: [[`map, ${E.eu}`, E.e], [`ground, ${E.to}`, g]], n: 4, given: { row: 0, v: E.e }, ask: { row: 1, v: g } }, ['lines', 'ref', 'given', 'ask'], ['drop', 'answer'], 1),
  }, g, v => same(v, g) ? { ok: true, say: `Yes: a ${fmt(E.e)} ${E.eu} slip is ${fmt(g)} ${E.to} of ground.` }
    : hit(v, E.e) ? { ok: false, mc: MC.notScaled, say: `The slip is on the MAP. On the ground it is ${fmt(E.n)} times as big.` }
      : v === 0 ? { ok: false, mc: MC.exactScale, say: 'Multiplying by an exact scale does not remove the reading slip; it scales it up.' }
        : hit(v, raw) ? { ok: false, mc: MC.relabel, say: `${fmt(raw)} is in ${UNIT_NAME[E.eu]}. Convert to ${UNIT_NAME[E.to]}.` }
          : { ok: false, say: `× ${fmt(E.n)}, then convert ${E.eu} to ${E.to}.` });
};
const errorCompare: Gen = (R, k) => {
  const [a, b] = pick(R, [[24000, 48000], [25000, 100000], [24000, 100000], [50000, 25000]] as const), e = pick(R, [1, 0.5]);
  const ga = conv(e * a, 'mm', 'm'), gb = conv(e * b, 'mm', 'm'), big = a > b ? a : b, what = pick(R, ['a bridge', 'a dam', 'a pier', 'a tunnel']);
  return choiceItem(R, {
    id: `errorCompare-${k}`, family: 'errorCompare', board: `${fmtT(e)}${uT('mm')}\\ \\text{at}\\ ${rfT(a)}\\ \\text{and}\\ ${rfT(b)}`,
    prompt: `Measuring ${what}, you might misread by ${A(`${fmt(e)} mm`)} on a ${rfH(a)} map and on a ${rfH(b)} map. Which slip is bigger on the ground?`,
    solution: [`${rfH(a)}: ${fmt(e)} mm → ${fmt(ga)} m. ${rfH(b)}: ${fmt(e)} mm → ${fmt(gb)} m.`, 'The bigger the denominator, the more ground a small slip stands for.'],
  }, [
    { t: `On the ${rfH(big)} map: ${fmt(Math.max(ga, gb))} m against ${fmt(Math.min(ga, gb))} m`.replace(/&#8202;/g, ' '), ok: true, say: 'Yes: the same slip stands for more ground on the smaller-scale map.' },
    { t: `The same: both are ${fmt(e)} mm`, mc: MC.notScaled, say: `${fmt(e)} mm on the paper, but it is scaled to the ground: × ${fmt(a)} versus × ${fmt(b)}.` },
    { t: 'Neither: the scale is exact, so the ground distance is exact', mc: MC.exactScale, say: 'An exact scale scales the slip too. The ground answer is only as good as the reading.' },
  ]);
};

// ===================== 17. report-precision =====================
const reportRound: Gen = (R, k) => {
  const L = pick(R, [3, 2.5, 4.5, 1.25, 3.75, 5.5]), ft = r9(L * 2000), mi = ft / 5280, shown = mi.toFixed(7);
  const tenth = roundTo(mi, 1), errFt = 200, errMi = 0.04, what = pick(R, ['trail', 'creek', 'ridge line', 'fire road']);
  return choiceItem(R, {
    id: `reportRound-${k}`, family: 'reportRound', board: `${fmtT(ft)} \\div 5{,}280 = ${shown}\\ldots`,
    prompt: `A ${what} measures ${A(`${mixH(L)} in`)} on a ${rfH(24000)} map, give or take 0.1 in (that is ${errFt} ft, about ${errMi} mi, of ground). The calculator says ${B(`${shown} mi`)}. How should you report it?`,
    solution: [`The reading could be off by about ${errMi} mi, so the hundredths and beyond are not known.`, `Report about ${fmt(tenth)} mi.`],
  }, [
    { t: `About ${fmt(tenth)} mi`, ok: true, say: `Yes: the slip is about ${errMi} mi, so only the tenths are worth keeping.` },
    { t: `${shown} mi: all the digits make it accurate`, mc: MC.digits, say: `The digits come from the calculator, not the ruler. The reading is only good to about ${errMi} mi.` },
    { t: `Exactly ${fmt(roundTo(mi, 2))} mi, since the map is accurate to the hundredth`, mc: MC.srcAccuracy, say: 'A careful reading does not make the map itself that accurate, and the reading is only good to about 0.04 mi.' },
  ]);
};
const reportClaim: Gen = (R, k) => {
  const who = pick(R, ['Sam', 'Ivy', 'Noah', 'Zoe']), [cm, n] = pick(R, [[3.5, 24000], [4, 25000], [2.5, 48000], [6, 25000]] as const);
  const m = conv(cm * n, 'cm', 'm'), err = conv(0.05 * n, 'cm', 'm');
  return choiceItem(R, {
    id: `reportClaim-${k}`, family: 'reportClaim', board: `${fmtT(m)}${uT('m')} \\pm ${fmtT(err)}${uT('m')}`,
    prompt: `${who} measured ${A(`${fmt(cm)} cm`)} very carefully on a ${rfH(n)} map: the reading is good to ±${fmt(err)} m of ground. ${who} says: "So the real path is surely ${fmt(m)}.000 m, give or take ${fmt(err)} m." Is that right?`,
    solution: [`±${fmt(err)} m is only the READING slip.`, 'The map itself may be drawn a little off, and the path may not be straight: a careful reading cannot fix that.'],
  }, [
    { t: 'No: the reading slip says nothing about how accurate the map is.', ok: true, say: 'Right: precise reading, but the map and the real path can still differ.' },
    { t: 'Yes: a small reading error proves the map is right.', mc: MC.srcAccuracy, say: 'A careful reading of a map cannot check the map itself.' },
    { t: `Yes: ${fmt(m)}.000 has three decimals, so it is accurate.`, mc: MC.digits, say: 'Extra zeros do not make a number accurate. The evidence is the slip size.' },
  ]);
};

// ===================== 18. choose-scale =====================
const chooseScale: Gen = (R, k) => {
  const hike = R() < 0.5;
  if (hike) {
    const T = pick(R, [2, 2.5, 3, 3.5]), park = pick(R, ['a canyon', 'a lakeshore', 'a forest', 'a ridge']);
    return choiceItem(R, {
      id: `chooseScale-${k}`, family: 'chooseScale', board: `${fmtT(T)}${uT('mi')}\\ \\text{on } 7.5 \\times 10${uT('in')}`,
      prompt: `You will hike a ${B(`${fmt(T)}-mile`)} trail in ${park} and want to see every bend. Your sheet has 7.5 in × 10 in of room. Which map scale is best?`,
      solution: [`At 1 : 24,000, ${fmt(T)} mi is ${fmt(roundTo(drawnInches(T, 24000), 2))} in: it fits, and it is drawn big.`, `At 1 : 1,000,000 it would be only ${fmt(roundTo(drawnInches(T, 1e6), 2))} in: too small to see the bends.`],
    }, [
      { t: '1 : 24,000', ok: true, say: `Yes: about ${fmt(roundTo(drawnInches(T, 24000), 1))} in long, it fits, with room for detail.` },
      { t: '1 : 1,000,000', say: `The whole trail would be ${fmt(roundTo(drawnInches(T, 1e6), 2))} in: a dot. You want the larger scale here.` },
      { t: '1 : 250,000', say: `About ${fmt(roundTo(drawnInches(T, 250000), 1))} in: it fits, but you would lose the bends. 1 : 24,000 still fits.` },
    ]);
  }
  const D = pick(R, [60, 80, 100, 120, 150]), trip = pick(R, ['to the coast', 'across the state', 'to a national park']);
  return choiceItem(R, {
    id: `chooseScale-${k}`, family: 'chooseScale', board: `${D}${uT('mi')}\\ \\text{on } 7.5 \\times 10${uT('in')}`,
    prompt: `A road trip ${trip} goes ${B(`${D} miles`)} in a straight line. The whole route must fit on a 7.5 in × 10 in sheet. Which map scale works?`,
    solution: [`At 1 : 24,000 the trip is ${fmt(roundTo(drawnInches(D, 24000), 0))} in long: far too big.`, `At 1 : 250,000 it is ${fmt(roundTo(drawnInches(D, 250000), 1))} in: still too long.`, `At 1 : 1,000,000 it is ${fmt(roundTo(drawnInches(D, 1e6), 1))} in: it fits.`],
  }, [
    { t: '1 : 1,000,000', ok: true, say: `Yes: about ${fmt(roundTo(drawnInches(D, 1e6), 1))} in, it fits the sheet.` },
    { t: '1 : 24,000, it shows the most detail', mc: MC.detailOver, say: `Detail does not help if the route needs ${fmt(roundTo(drawnInches(D, 24000), 0))} in of paper.` },
    { t: '1 : 250,000, more detail than 1 : 1,000,000', mc: MC.detailOver, say: `It would need ${fmt(roundTo(drawnInches(D, 250000), 1))} in: more than 10 in. Coverage first.` },
  ]);
};
const fitLength: Gen = (R, k) => {
  const N = pick(R, [24000, 24000, 63360, 100000]), T = pick(R, [1, 1.5, 2, 2.5, 3, 3.5, 4]);
  const exact = drawnInches(T, N), ans = N === 100000 ? roundTo(exact, 2) : exact;
  return numItem({
    id: `fitLength-${k}`, family: 'fitLength', unit: 'in',
    prompt: `How long is a straight ${B(`${fmt(T)}-mile`)} trail on a ${rfH(N)} map?${N === 100000 ? ' Round to the nearest hundredth.' : ''} Will it fit across a 10 in sheet? (Calculator allowed.)`,
    board: `${fmtT(T)}${uT('mi')} = ${fmtT(T * IN_PER_MI)}${uT('in')}`,
    solution: [`${fmt(T)} mi = ${fmt(T)} × 63,360 = ${fmt(T * IN_PER_MI)} in.`, `÷ ${fmt(N)} = ${fmt(ans)} in on the map${ans <= 10 ? ': it fits' : ''}.`],
    work: [`${fmtT(T * IN_PER_MI)} \\div ${fmtT(N)} ${N === 100000 ? '\\approx' : '='} ${fmtT(ans)}${uT('in')}`],
    picture: { pic: { kind: 'strips', p: { ns: N === 63360 ? [63360, 24000] : [N, 63360], mi: T, name: `a ${fmt(T)}-mile trail`, ans: [`${fmtT(ans)}${uT('in')}`, ''] }, show: ['rows', 'lines'], solve: ['answer'] } },
  }, ans, v => Math.abs(v - ans) <= (N === 100000 ? 0.005 + 1e-9 : 1e-6) ? { ok: true, say: `Yes: ${fmt(ans)} in.` }
    : Math.abs(v - (T * 5280) / N) < 0.01 ? { ok: false, mc: MC.mixedUnits, say: `${fmt(T * 5280)} is feet; the scale needs inches: × 63,360, not × 5,280.` }
      : hit(v, T * IN_PER_MI * N) ? { ok: false, mc: MC.wrongOp, say: 'Ground → map: divide by the scale number.' }
        : { ok: false, say: `Change the miles to inches (× 63,360), then ÷ ${fmt(N)}.` });
};

export const GENERATORS: Record<FamilyId, Gen> = {
  verbalTimes, verbalMeaning, ratioTable, zeroPair, barCount, barExt, rfUnit, rfJudge, verbalCalc, verbalMixed,
  decompose, splitPick, rfCalc, metricRoute, customaryFt, customaryMi, whyMile, rulerInch, rulerMm, measureCalc,
  measureKm, mapFromVerbal, mapFromRf, whichWay, largerScale, sameRoad, enlarge, enlargeScale, rangePossible, rangeEdge,
  errorScale, errorCompare, reportRound, reportClaim, chooseScale, fitLength,
};
export { possible, mapLen };
