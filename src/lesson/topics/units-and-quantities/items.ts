// items.ts: exercise families for "Reasoning with units" (secondary-t6-02, HSN-Q.A.1/A.3), generated from templates,
// checked exactly, and every typical wrong answer classified against the misconception catalogue.
// A generator gets the sub-goal it practises (plan.ts); number ranges follow the sub-goal's `cases` in the topic JSON.
// Pictures (item.picture) are plain data the page draws: a unit-factor chain, a ruler with a rounding band, a grid of
// square units, a two-scale thermometer, or one or two coordinate planes (kit Plane).
// Pure: no DOM, no canvas.
import { type Item, type Response, type Verdict, A, B, fracValue, int, pick, shuffle } from '../../runtime/item';
import { endOnChoice } from '../../runtime/explain';
import {
  type Pair, type Q, PAIRS, UNIT_WORD, agreePlace, cToF, fmt, fmtT, mixedH, mixedP, mixedT, money, moneyT, near, qadd, qeq, qn, qsub, qT,
  qval, report, roundTo, roundsTo, unitT,
} from './units';

// ---------- pictures ----------
/** a term of a unit chain: n top-unit over (bn) bottom-unit; hide shows "?" */
export interface CTerm { n: number | string; u: string; bn?: number | string; bu?: string; hide?: boolean; hideUnit?: boolean }
export interface ChainPic { start: CTerm; factors: CTerm[]; result: CTerm }
export interface RulerPic { lo: number; hi: number; minor: number; major: number; v: number; res: number; unit: string; den?: number; dp?: number; probe?: number; scaled?: { lo: number; hi: number; unit: string; by: string; dp: number } }
export interface GridPic { n: number; big: string; small: string; cube?: boolean }
export interface ThermoPic { cLo: number; cHi: number; cStep: number; fStep: number; mark?: number; rise?: [number, number]; hide: 'F' | 'C' }
export interface PAx { min: number; max: number; step: number; name: string; labels?: string[] }
export interface PlanePic { x: PAx; y: PAx; title?: string; line?: [number, number][]; dots?: [number, number][]; bars?: { x: number; v: number }[]; ring?: number }
export type Pic = { chain?: ChainPic; ruler?: RulerPic; grid?: GridPic; thermo?: ThermoPic; planes?: PlanePic[]; reveal?: string };
export interface UItem extends Item { picture?: Pic }
type Gen = (R: () => number, n: number, sg?: string) => UItem;

// ---------- misconception ids (math-curriculum-essentials/misconceptions.json) ----------
export const MC = {
  decor: 'mc.reasoning-language.units-as-decoration',
  numerals: 'mc.measurement-units.compares-numerals-without-units',
  purpose: 'mc.measurement-units.unit-choice-ignores-size-purpose',
  mislabel: 'mc.ratio-rate.mislabels-computed-quantity',
  dimSwap: 'mc.measurement-units.wrong-unit-dimension',
  interval: 'mc.measurement-units.misjudges-interval-value',
  steep: 'mc.linear-functions.steepness-ignores-scale',
  anyBase: 'mc.data-displays.any-baseline-fair-for-every-chart',
  layout: 'mc.data-displays.layout-change-changes-data',
  zero: 'mc.data-displays.axis-must-start-at-zero',
  allInexact: 'mc.measurement-units.every-conversion-factor-inexact',
  byForm: 'mc.measurement-units.exactness-by-number-form',
  asExact: 'mc.measurement-units.measurement-treated-as-exact',
  precAcc: 'mc.measurement-units.precision-as-accuracy',
  divisor: 'mc.fraction-ops.multiplies-by-divisor-without-inverting',
  whole: 'mc.measurement-units.uncertainty-whole-increment',
  wrongOp: 'mc.ratio-rate.scale-factor-wrong-operation',
  flip: 'mc.measurement-units.unit-factor-upside-down',
  addMixed: 'mc.measurement-units.adds-lengths-without-matching-units',
  mismatch: 'mc.measurement-units.combine-mismatched-units',
  oneUnit: 'mc.measurement-units.converts-one-unit-of-rate',
  linear: 'mc.measurement-units.linear-factor-for-area',
  offset: 'mc.measurement-units.temperature-change-with-offset',
  proportional: 'mc.ratio-rate.scales-non-proportional',
  unconverted: 'mc.measurement-units.uses-unconverted-inputs-in-unit-specific-formula',
  unweighted: 'mc.statistics.unweighted-average',
  noMidDigits: 'mc.decimals.intermediate-precision-always-invalid',
  decLen: 'mc.estimation.decimal-length-guarantees-accuracy',
  moreDigits: 'mc.estimation.more-digits-more-accurate',
  roundPlace: 'mc.decimals.wrong-rounding-place',
  labelRepair: 'mc.measurement-units.unit-label-repairs-invalid-dimensions',
  labelsDim: 'mc.measurement-units.labels-mean-different-dimensions',
  superficial: 'mc.measurement-units.superficial-check-as-proof',
  roundCount: 'mc.statistics.rounds-expectation-to-possible-count',
  looksRight: 'mc.reasoning-language.accepts-answer-that-looks-right',
} as const;

// ---------- families ----------
export type FamilyId =
  | 'attribute' | 'sameAmount' | 'pickUnit' | 'compareMixed' | 'deriveUnit' | 'productUnit' | 'readTick' | 'steeper' | 'cropBar'
  | 'chooseStart' | 'exactOrMeasured' | 'whichExact' | 'intervalRead' | 'couldBe' | 'boundsFrac' | 'boundsDec' | 'twoScales'
  | 'whatDigitsSay' | 'convert' | 'pickFactor' | 'addMixed' | 'unitResult' | 'rateTime' | 'rateConvert' | 'fracRate'
  | 'areaConvert' | 'powerFactor' | 'tempReading' | 'tempChange' | 'tripCost' | 'avgSpeed' | 'formulaUnits' | 'scaleRange'
  | 'rangePair' | 'reportPick' | 'purposeRound' | 'mapArea' | 'dimCheck' | 'repair' | 'mismatchKind' | 'consistentWrong'
  | 'critique' | 'exactMean' | 'audit';
export const FAMILIES: readonly { id: FamilyId; name: string }[] = [
  { id: 'attribute', name: 'What is measured?' }, { id: 'sameAmount', name: 'Same amount, other unit' },
  { id: 'pickUnit', name: 'A unit that fits' }, { id: 'compareMixed', name: 'Compare in one unit' },
  { id: 'deriveUnit', name: 'Name the rate' }, { id: 'productUnit', name: 'Square and cubic units' },
  { id: 'readTick', name: 'Read the scale' }, { id: 'steeper', name: 'Steep is not big' },
  { id: 'cropBar', name: 'A cropped bar chart' }, { id: 'chooseStart', name: 'Where should the axis start?' },
  { id: 'exactOrMeasured', name: 'Exact or measured?' }, { id: 'whichExact', name: 'Which one is exact?' },
  { id: 'intervalRead', name: 'What a rounded value stands for' }, { id: 'couldBe', name: 'Could it be?' },
  { id: 'boundsFrac', name: 'Bounds in fractions of an inch' }, { id: 'boundsDec', name: 'Bounds in decimals' },
  { id: 'twoScales', name: 'Digits vs accuracy' }, { id: 'whatDigitsSay', name: 'What the display really says' },
  { id: 'convert', name: 'Convert with a unit factor' }, { id: 'pickFactor', name: 'Turn the factor the right way' },
  { id: 'addMixed', name: 'Same unit before adding' }, { id: 'unitResult', name: 'Units cancel' },
  { id: 'rateTime', name: 'Rate times time' }, { id: 'rateConvert', name: 'Convert a rate' },
  { id: 'fracRate', name: 'Rates from fractions' }, { id: 'areaConvert', name: 'Square and cubic conversions' },
  { id: 'powerFactor', name: 'Square the factor' }, { id: 'tempReading', name: 'Convert a temperature' },
  { id: 'tempChange', name: 'Convert a temperature change' }, { id: 'tripCost', name: 'Plan with units' },
  { id: 'avgSpeed', name: 'Average speed' }, { id: 'formulaUnits', name: 'Formulas want their units' },
  { id: 'scaleRange', name: 'Carry the range' }, { id: 'rangePair', name: 'Both ends of the range' },
  { id: 'reportPick', name: 'Report what you know' }, { id: 'purposeRound', name: 'Round for the purpose' },
  { id: 'mapArea', name: 'Scale: k, k², k³' }, { id: 'dimCheck', name: 'Dimension check' },
  { id: 'repair', name: 'Repair the formula' }, { id: 'mismatchKind', name: 'Unit or dimension mismatch?' },
  { id: 'consistentWrong', name: 'Units check, still wrong' }, { id: 'critique', name: 'False precision' },
  { id: 'exactMean', name: 'Exact, not false precision' }, { id: 'audit', name: 'Audit a model' },
];
export const FAMILY_NAMES: Record<string, string> = Object.fromEntries(FAMILIES.map(f => [f.id, f.name]));

// ---------- item helpers ----------
interface Opt { t: string; ok?: boolean; mc?: string; say: string }
type Base = Omit<UItem, 'input' | 'choices' | 'answer' | 'check'>;
function choiceItem(R: () => number, base: Base, opts: Opt[]): UItem {
  const o = shuffle(R, opts.slice());
  const i = o.findIndex(x => x.ok);
  return {
    ...base, input: 'choice', choices: o.map(x => x.t), answer: { kind: 'choice', i }, solution: endOnChoice(base.solution, o[i]!.t),
    check: (r: Response) => {
      if (r.kind !== 'choice' || !o[r.i]) return { ok: false, say: 'Pick one of the answers.' };
      const c = o[r.i]!;
      return { ok: !!c.ok, mc: c.mc, say: c.say };
    },
  };
}
interface Wrong { v: number; mc?: string; say: string }
/** a typed number: right within tol (relative), else the first matching typical slip, else the hint */
function numItem(base: Omit<UItem, 'input' | 'answer' | 'check'>, ans: number, ok: string, wrongs: Wrong[], hint: string, tol = 1e-6): UItem {
  const isNear = (a: number, b: number) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
  return {
    ...base, input: 'num', answer: { kind: 'num', v: ans },
    check: (r: Response): Verdict => {
      if (r.kind !== 'num' || !Number.isFinite(r.v)) return { ok: false, say: 'Type a number.' };
      if (isNear(r.v, ans)) return { ok: true, say: ok };
      const w = wrongs.find(x => !isNear(x.v, ans) && isNear(r.v, x.v));
      return w ? { ok: false, mc: w.mc, say: w.say } : { ok: false, say: hint };
    },
  };
}
const ord = (k: number) => ['zeroth', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth'][k] ?? `${k}th`;
const fr = (n: string | number, d: string | number) => `<span class="fr"><span>${n}</span><span>${d}</span></span>`;
/** a unit factor in HTML: 12 in over 1 ft */
const facH = (tn: string | number, tu: string, bn: string | number, bu: string) => fr(`${typeof tn === 'number' ? fmt(tn) : tn} ${tu}`, `${typeof bn === 'number' ? fmt(bn) : bn} ${bu}`);
/** a unit factor in TeX */
const facT = (tn: number | string, tu: string, bn: number | string, bu: string) => `\\dfrac{${qT(tn, tu)}}{${qT(bn, bu)}}`;
const S = (s: string | number) => `<b class="s">${s}</b>`;
/** 2 significant figures, for "what this unit would give" */
function sig2(x: number): string {
  if (x === 0) return '0';
  const e = Math.floor(Math.log10(Math.abs(x))), p = 10 ** (e - 1);
  const r = Math.round(x / p) * p;
  return e >= 1 ? fmt(Math.round(r)) : fmt(roundTo(r, 1 - e));
}
const dpOf = (v: number) => { const s = String(roundTo(v, 6)); return s.includes('.') ? s.split('.')[1]!.length : 0; };

// =====================================================================================================
// 1. quantity-number-unit
// =====================================================================================================
const ATTR: ((R: () => number) => { text: string; q: [number, string, string][] })[] = [
  R => { const n = int(R, 8, 40), w = int(R, 41, 90), s = int(R, 45, 65) + 30; return { text: `A truck carries ${A(n)} crates, each weighing ${A(w + ' lb')}, at ${A(s + ' mi/h')}.`, q: [[n, 'a count of crates (no unit)', 'crates'], [w, 'a weight, in pounds', 'lb'], [s, 'a speed, in miles per hour', 'mi/h']] }; },
  R => { const p = int(R, 4, 12), c = int(R, 2, 3), m = int(R, 15, 45); return { text: `A recipe for ${A(p)} people uses ${A(c + ' lb')} of rice and simmers for ${A(m + ' min')}.`, q: [[p, 'a count of people (no unit)', 'people'], [c, 'a weight, in pounds', 'lb'], [m, 'a time, in minutes', 'min']] }; },
  R => { const k = pick(R, [12000, 24000, 50000, 63360]), d = int(R, 3, 9), g = int(R, 10, 18); return { text: `A trail map has scale ${A('1 : ' + fmt(k))}. The trail is ${A(d + ' in')} long on the map and climbs at a ${A(g + '%')} grade.`, q: [[k, 'a scale ratio: real length per map length (no unit)', 'ratio'], [d, 'a length on the map, in inches', 'in'], [g, 'a steepness: rise per run, as a percent', '%']] }; },
  R => { const g = int(R, 12, 30) * 1000, r = int(R, 8, 20) * 5, t = int(R, 2, 7); return { text: `A pool holds ${A(fmt(g) + ' gal')}. A pump fills it at ${A(r + ' gal/min')} for the first ${A(t + ' h')}.`, q: [[g, 'a volume, in gallons', 'gal'], [r, 'a rate: gallons per minute', 'gal/min'], [t, 'a time, in hours', 'h']] }; },
  R => { const L = int(R, 20, 60), p = int(R, 2, 9), n = int(R, 61, 90); return { text: `A ${A(L + ' ft')} rope costs ${A('$' + p + ' per foot')}. ${A(n)} campers share it.`, q: [[L, 'a length, in feet', 'ft'], [p, 'a price per length, in dollars per foot', '$/ft'], [n, 'a count of campers (no unit)', 'campers']] }; },
];
const attribute: Gen = (R, n) => {
  const T = pick(R, ATTR)(R), i = int(R, 0, 2), [v, desc] = T.q[i]!;
  return choiceItem(R, {
    id: `attribute-${n}`, family: 'attribute', prompt: `${T.text} What does the number ${B(fmt(v))} measure?`,
    board: `${fmtT(v)}\\ \\to\\ \\text{number} + \\text{unit} + \\text{what}`,
    solution: [`Every number in a model is a quantity: a number, a unit, and what is measured.`, `${fmt(v)} goes with "${T.q[i]![2]}" in the sentence: it is ${desc}.`],
  }, T.q.map(([w, d], j) => j === i ? { t: d, ok: true, say: `Yes: ${fmt(v)} is ${d}.` }
    : { t: d, mc: MC.decor, say: `That describes ${fmt(w)}, not ${fmt(v)}. Read the unit that sits next to ${fmt(v)}.` }));
};

const SAME: Pair[] = PAIRS.filter(p => ['ft', 'yd', 'h', 'lb', 'gal', 'm', 'min'].includes(p.big) && p.system !== 'cross' && p.f <= 100);
const sameAmount: Gen = (R, n) => {
  const p = pick(R, SAME), v = int(R, 2, 9), right = v * p.f;
  const w2 = v + p.f;
  const w3 = p.f === 10 ? v * 100 : v * 10;
  const opts: Opt[] = [
    { t: `${fmt(right)} ${p.small}`, ok: true, say: `Yes: each ${p.big} is ${p.f} ${p.small}, so ${v} ${p.big} = ${fmt(right)} ${p.small}.` },
    { t: `${v} ${p.small}`, mc: MC.decor, say: `${v} ${p.small} keeps the number and swaps the unit, but a ${p.small} is much smaller than a ${p.big}. The unit is part of the amount.` },
    { t: `${fmt(w2)} ${p.small}`, say: `That adds ${p.f}. Each of the ${v} ${UNIT_WORD[p.big]} is ${p.f} ${p.small}: multiply.` },
  ];
  if (![right, v, w2].includes(w3)) opts.push({ t: `${fmt(w3)} ${p.small}`, say: `There are ${p.f} ${p.small} in 1 ${p.big}, not 10.` });
  return choiceItem(R, {
    id: `sameAmount-${n}`, family: 'sameAmount', prompt: `Which is the same ${p.attr} as ${A(v + ' ' + p.big)}?`,
    board: `${qT(v, p.big)} = \\,?\\ \\text{${p.small}}`,
    picture: { chain: { start: { n: v, u: p.big }, factors: [{ n: p.f, u: p.small, bn: 1, bu: p.big, hide: true }], result: { n: right, u: p.small, hide: true } } },
    solution: [`One ${p.big} is ${p.f} ${p.small}: the unit factor ${facH(p.f, p.small, 1, p.big)} is 1.`, `${v} ${p.big} × ${facH(p.f, p.small, 1, p.big)} = ${S(fmt(right) + ' ' + p.small)}.`],
  }, opts);
};

// =====================================================================================================
// 2. purpose-unit-choice
// =====================================================================================================
const PURPOSE: ((R: () => number) => { what: string; u: [string, number][] })[] = [
  R => { const v = int(R, 24, 40); return { what: `the width of a classroom, about ${v} ft, on a floor plan`, u: [['feet', v], ['miles', v / 5280], ['millimeters', v * 304.8]] }; },
  R => { const v = int(R, 20, 60); return { what: `how fast a tectonic plate creeps, about ${v} mm each year`, u: [['millimeters per year', v], ['miles per year', v / 1609344], ['kilometers per year', v / 1e6]] }; },
  R => { const v = int(R, 12, 40) * 10; return { what: `the driving distance between two cities, about ${v} mi`, u: [['miles', v], ['feet', v * 5280], ['inches', v * 63360]] }; },
  R => { const v = int(R, 5, 8); return { what: `the length of a pencil, about ${v} in`, u: [['inches', v], ['miles', v / 63360], ['yards', v / 36]] }; },
  R => { const v = pick(R, [3.1, 6.2, 13.1, 26.2]); return { what: `the length of a ${v === 26.2 ? 'marathon' : v === 13.1 ? 'half marathon' : 'road race'}, ${v} mi`, u: [['miles', v], ['inches', v * 63360], ['feet', v * 5280]] }; },
  R => { const v = int(R, 7, 10); return { what: `the thickness of a phone, about ${v} mm`, u: [['millimeters', v], ['feet', v / 304.8], ['kilometers', v / 1e6]] }; },
  R => { const v = int(R, 5, 14) * 5; return { what: `a speed limit sign for a ${v} mi/h road`, u: [['miles per hour', v], ['miles per second', v / 3600], ['inches per hour', v * 63360]] }; },
];
const ABBR: Record<string, string> = { feet: 'ft', miles: 'mi', millimeters: 'mm', 'millimeters per year': 'mm/yr', 'miles per year': 'mi/yr', 'kilometers per year': 'km/yr', inches: 'in', yards: 'yd', kilometers: 'km', 'miles per hour': 'mi/h', 'miles per second': 'mi/s', 'inches per hour': 'in/h' };
const pickUnit: Gen = (R, n) => {
  const T = pick(R, PURPOSE)(R);
  return choiceItem(R, {
    id: `pickUnit-${n}`, family: 'pickUnit', prompt: `Which unit fits ${T.what}? Each choice shows the number that unit would give.`,
    board: `\\text{a unit that fits the size and the purpose}`,
    solution: [`A good unit gives a number people can picture and compare, usually between about 1 and 1,000, and matches what others use.`, `${T.u.map(([u, v]) => `${sig2(v)} ${ABBR[u]}`).join(', ')}: only ${T.u[0]![0]} gives a handy number.`],
  }, T.u.map(([u, v], j) => {
    const t = `${u} (${sig2(v)} ${ABBR[u]})`;
    return j === 0 ? { t, ok: true, say: `Yes: ${sig2(v)} ${ABBR[u]} is a number you can picture, and it is the usual unit here.` }
      : { t, mc: MC.purpose, say: `${sig2(v)} ${ABBR[u]} is correct, but ${v < 1 ? 'tiny' : 'huge'}: hard to read and compare. The unit should fit the size and the purpose.` };
  }));
};

const SETS: { units: [string, string, string]; size: [number, number, number]; word: string; big: string; small: string }[] = [
  { units: ['mi', 'yd', 'ft'], size: [5280, 3, 1], word: 'distance', big: 'longest', small: 'shortest' },
  { units: ['h', 'min', 's'], size: [3600, 60, 1], word: 'time', big: 'longest', small: 'shortest' },
  { units: ['km', 'm', 'cm'], size: [100000, 100, 1], word: 'distance', big: 'longest', small: 'shortest' },
  { units: ['gal', 'qt', 'pt'], size: [8, 2, 1], word: 'amount', big: 'most', small: 'least' },
  { units: ['ton', 'lb', 'oz'], size: [32000, 16, 1], word: 'weight', big: 'heaviest', small: 'lightest' },
];
const compareMixed: Gen = (R, n) => {
  for (;;) {
    const S0 = pick(R, SETS), askBig = R() < 0.5;
    const a = int(R, 1, 4), T0 = a * S0.size[0];
    // the biggest unit has the smallest numeral; the quantity order goes against the numeral order
    const r1 = askBig ? 0.55 + 0.35 * R() : 0.55 + 0.35 * R(), r2 = askBig ? 0.55 + 0.35 * R() : 0.2 + 0.3 * R();
    const v1 = Math.max(1, Math.round((T0 * r1) / S0.size[1] / 10) * 10 || Math.round((T0 * r1) / S0.size[1]));
    const v2 = Math.max(1, Math.round((T0 * r2) / S0.size[2] / 10) * 10 || Math.round((T0 * r2) / S0.size[2]));
    const vals = [a, v1, v2], qs = vals.map((v, i) => v * S0.size[i]!);
    const target = askBig ? qs.indexOf(Math.max(...qs)) : qs.indexOf(Math.min(...qs));
    const bait = askBig ? vals.indexOf(Math.max(...vals)) : vals.indexOf(Math.min(...vals));
    if (new Set(qs).size < 3 || new Set(vals).size < 3 || target === bait || (askBig && target !== 0) || (!askBig && target !== 2)) continue;
    const un = (i: number) => (S0.units[i] === 'ton' && vals[i] !== 1 ? 'tons' : S0.units[i]!);
    const t = (i: number) => `${fmt(vals[i]!)} ${un(i)}`;
    const base = S0.units[2];
    return choiceItem(R, {
      id: `compareMixed-${n}`, family: 'compareMixed', prompt: `Which ${S0.word} is the ${askBig ? S0.big : S0.small}: ${t(0)}, ${t(1)} or ${t(2)}?`,
      board: `${qT(vals[0]!, un(0))},\\ ${qT(vals[1]!, un(1))},\\ ${qT(vals[2]!, un(2))}`,
      solution: [`Compare in ONE unit. In ${base}: ${[0, 1, 2].map(i => `${t(i)} = ${fmt(qs[i]!)} ${base}`).join('; ')}.`, `The ${askBig ? S0.big : S0.small} is ${S(t(target))}.`],
    }, [0, 1, 2].map(i => i === target ? { t: t(i), ok: true, say: `Yes: in ${base} it is ${fmt(qs[i]!)}, the ${askBig ? S0.big : S0.small}.` }
      : { t: t(i), mc: i === bait ? MC.numerals : undefined, say: i === bait ? `${fmt(vals[i]!)} is the ${askBig ? 'biggest' : 'smallest'} number, but the units differ: ${t(i)} is ${fmt(qs[i]!)} ${base}. Convert first, then compare.` : `${t(i)} is ${fmt(qs[i]!)} ${base}. Convert all three to ${base}.` }));
  }
};

// =====================================================================================================
// 3. derived-unit-meaning
// =====================================================================================================
const RATES: { a: string; b: string; ctx: (x: number, y: number) => string; rate: string; flip: string }[] = [
  { a: 'mi', b: 'gal', ctx: (x, y) => `A car goes ${A(x + ' mi')} on ${B(y + ' gal')} of gas.`, rate: 'mi/gal', flip: 'gal/mi' },
  { a: '$', b: 'gal', ctx: (x, y) => `Filling up costs ${A('$' + x)} for ${B(y + ' gal')}.`, rate: '$/gal', flip: 'gal/$' },
  { a: 'lb', b: 'ft³', ctx: (x, y) => `A block of oak weighs ${A(x + ' lb')} and takes up ${B(y + ' ft³')}.`, rate: 'lb/ft³', flip: 'ft³/lb' },
  { a: 'people', b: 'mi²', ctx: (x, y) => `${A(fmt(x * 10) + ' people')} live on ${B(y * 10 + ' mi²')}.`, rate: 'people/mi²', flip: 'mi²/people' },
  { a: 'mi', b: 'h', ctx: (x, y) => `A train covers ${A(x + ' mi')} in ${B(y + ' h')}.`, rate: 'mi/h', flip: 'h/mi' },
  { a: '$', b: 'lb', ctx: (x, y) => `${B(y + ' lb')} of cherries cost ${A('$' + x)}.`, rate: '$/lb', flip: 'lb/$' },
];
const deriveUnit: Gen = (R, n) => {
  const T = pick(R, RATES), y = int(R, 2, 12), r = int(R, 3, 45), x = r * y;
  const xs = T.a === 'people' ? x * 10 : x, ys = T.a === 'people' ? y * 10 : y;
  const aw = T.a === '$' ? 'dollars' : T.a;
  return choiceItem(R, {
    id: `deriveUnit-${n}`, family: 'deriveUnit', prompt: `${T.ctx(x, y)} You divide: ${fmt(xs)} ÷ ${fmt(ys)} = ${fmt(r)}. ${fmt(r)} what?`,
    board: `\\dfrac{${qT(xs, T.a === '$' ? '$' : T.a)}}{${qT(ys, T.b)}} = ${r}\\ ?`,
    solution: [`Units divide like the numbers: ${aw} ÷ ${T.b} is "${aw} per ${T.b}".`, `${r} ${S(T.rate)}: ${r} ${aw} for each 1 ${T.b}.`],
  }, [
    { t: T.rate, ok: true, say: `Yes: ${aw} divided by ${T.b} is ${T.rate}, ${aw} per ${T.b}.` },
    { t: T.flip, say: `That is upside down: you divided ${aw} by ${T.b}, so ${aw} goes on top.` },
    { t: T.a === '$' ? 'dollars' : T.a, mc: MC.mislabel, say: `A quotient gets a quotient unit: ${r} is ${aw} PER ${T.b}, not a plain amount of ${aw}.` },
  ]);
};
const productUnit: Gen = (R, n) => {
  const u = pick(R, ['ft', 'yd', 'm', 'in']), kind = int(R, 0, 2);
  if (kind === 0) {
    const l = int(R, 4, 20), w = int(R, 3, 15);
    return choiceItem(R, {
      id: `productUnit-${n}`, family: 'productUnit', prompt: `A floor is ${A(l + ' ' + u)} by ${A(w + ' ' + u)}. Its area is ${l} × ${w} = ${l * w}. ${l * w} what?`,
      board: `${qT(l, u)} \\times ${qT(w, u)} = ${l * w}\\ ?`,
      solution: [`Units multiply like numbers: ${u} × ${u} = ${u}², a square ${u} on each side.`, `The area is ${l * w} ${S(u + '²')}.`],
    }, [
      { t: `${u}²`, ok: true, say: `Yes: ${u} × ${u} = ${u}², square ${UNIT_WORD[u]}.` },
      { t: u, mc: MC.dimSwap, say: `${u} measures a length. Length × length is an area: ${u}².` },
      { t: `${u}³`, say: `Only two lengths were multiplied: ${u} × ${u} = ${u}², not ${u}³.` },
    ]);
  }
  if (kind === 1) {
    const a = int(R, 4, 30), h = int(R, 2, 9);
    return choiceItem(R, {
      id: `productUnit-${n}`, family: 'productUnit', prompt: `A tank has a base of ${A(a + ' ' + u + '²')} and a height of ${A(h + ' ' + u)}. Its volume is ${a} × ${h} = ${a * h}. ${a * h} what?`,
      board: `${qT(a, u + '²')} \\times ${qT(h, u)} = ${a * h}\\ ?`,
      solution: [`${u}² × ${u} = ${u}³: an area times a length is a volume.`, `The volume is ${a * h} ${S(u + '³')}.`],
    }, [
      { t: `${u}³`, ok: true, say: `Yes: ${u}² × ${u} = ${u}³, cubic ${UNIT_WORD[u]}.` },
      { t: `${u}²`, mc: MC.dimSwap, say: `${u}² is an area. Times a height in ${u} it becomes a volume: ${u}³.` },
      { t: u, mc: MC.dimSwap, say: `A volume needs three lengths multiplied: ${u}² × ${u} = ${u}³.` },
    ]);
  }
  const d = int(R, 30, 60), v = int(R, 2, 12);
  return choiceItem(R, {
    id: `productUnit-${n}`, family: 'productUnit', prompt: `Concrete weighs ${A(d * 3 + ' lb/ft³')}. A slab takes up ${B(v + ' ft³')}. ${d * 3} × ${v} = ${fmt(d * 3 * v)}. ${fmt(d * 3 * v)} what?`,
    board: `${qT(d * 3, 'lb/ft³')} \\times ${qT(v, 'ft³')} = ${fmtT(d * 3 * v)}\\ ?`,
    solution: [`lb/ft³ × ft³: the ft³ on the bottom cancels the ft³ you multiply by.`, `What is left is ${fmt(d * 3 * v)} ${S('lb')}.`],
  }, [
    { t: 'lb', ok: true, say: `Yes: the ft³ cancel, and a weight in pounds is left.` },
    { t: 'lb/ft³', mc: MC.mislabel, say: `lb/ft³ was the density. Times ft³, the ft³ cancel: pounds are left.` },
    { t: 'ft³', say: `ft³ is the slab's volume. The density's ft³ cancels it, leaving lb.` },
  ]);
};

// =====================================================================================================
// 4. graph-interval-scale
// =====================================================================================================
const TICK_CTX: { name: string; unit: string; steps: number[] }[] = [
  { name: 'rainfall (in)', unit: 'in', steps: [0.5, 0.25] }, { name: 'visitors', unit: 'visitors', steps: [100, 1000, 10] },
  { name: 'height (ft)', unit: 'ft', steps: [2, 5, 10] }, { name: 'sales ($)', unit: '$', steps: [100, 1000, 5] },
  { name: 'temperature rise (°F)', unit: '°F', steps: [0.5, 2, 5] },
];
const readTick: Gen = (R, n) => {
  const C = pick(R, TICK_CTX), step = pick(R, C.steps), ny = int(R, 5, 8), j = int(R, 2, ny - 1), xi = int(R, 1, 5);
  const top = step * ny, val = step * j;
  const labels = Array.from({ length: ny + 1 }, (_, i) => (i === 0 || i === ny ? fmt(i * step) : ''));
  const vs = C.unit === '$' ? money(val).replace('.00', '') : `${fmt(val)} ${C.unit}`;
  return numItem({
    id: `readTick-${n}`, family: 'readTick', prompt: `The vertical axis is labeled only at 0 and ${fmt(top)}, with equal gridlines between. On day ${xi}, the dot sits on the ${ord(j)} gridline. What value does it show?`,
    board: `\\text{one gridline} = \\dfrac{${fmtT(top)}}{${ny}} = \\,?`, unit: C.unit === '$' ? 'dollars' : C.unit,
    picture: { planes: [{ x: { min: 0, max: 6, step: 1, name: 'day' }, y: { min: 0, max: top, step, name: C.name, labels }, dots: [[xi, val]] }] },
    solution: [`From 0 to ${fmt(top)} there are ${ny} equal steps, so one gridline is ${fmt(top)} ÷ ${ny} = ${fmt(step)}.`, `The dot is ${j} steps up: ${j} × ${fmt(step)} = ${S(fmt(val))}.`],
  }, val, `Yes: each gridline is ${fmt(step)}, and ${j} × ${fmt(step)} = ${vs}.`,
  [{ v: j, mc: MC.interval, say: `${j} counts gridlines, but each gridline is worth ${fmt(top)} ÷ ${ny} = ${fmt(step)}, not 1.` },
    { v: j * 10, mc: MC.interval, say: `Each gridline is ${fmt(step)}, not 10: ${fmt(top)} split into ${ny} equal steps.` }],
  `Find one gridline first: ${fmt(top)} ÷ ${ny}. Then count ${j} of them.`);
};
const steeper: Gen = (R, n) => {
  const MA = pick(R, [100, 200, 1000, 50]), MB = MA / 2, sA = MA / 10, sB = MB / 10;
  const ra = sA * int(R, 3, 5), rb = sB * Math.round((ra * (0.6 + 0.2 * R())) / sB);
  const a0 = sA * int(R, 1, 4), b0 = sB * int(R, 1, 3);
  if (b0 + rb > MB || rb * 2 <= ra || rb >= ra) return steeper(R, n);
  const swap = R() < 0.5, [nA, nB] = swap ? ['Store B', 'Store A'] : ['Store A', 'Store B'];
  const lineA: [number, number][] = [[0, a0], [4, a0 + ra]], lineB: [number, number][] = [[0, b0], [4, b0 + rb]];
  const pA: PlanePic = { title: nA, x: { min: 0, max: 4, step: 1, name: 'month' }, y: { min: 0, max: MA, step: sA, name: 'sales ($)', labels: Array.from({ length: 11 }, (_, i) => (i % 2 === 0 ? fmt(i * sA) : '')) }, line: lineA };
  const pB: PlanePic = { title: nB, x: { min: 0, max: 4, step: 1, name: 'month' }, y: { min: 0, max: MB, step: sB, name: 'sales ($)', labels: Array.from({ length: 11 }, (_, i) => (i % 2 === 0 ? fmt(i * sB) : '')) }, line: lineB };
  return choiceItem(R, {
    id: `steeper-${n}`, family: 'steeper', prompt: `Two graphs show monthly sales of two stores. Which store's sales grew more from month 0 to month 4?`,
    board: `\\text{${nA}:}\\ ${fmtT(a0)} \\to ${fmtT(a0 + ra)} \\qquad \\text{${nB}:}\\ ${fmtT(b0)} \\to ${fmtT(b0 + rb)}`,
    picture: { planes: swap ? [pB, pA] : [pA, pB] },
    solution: [`Read the scales: ${nA} goes from $${fmt(a0)} to $${fmt(a0 + ra)}, up $${fmt(ra)}; ${nB} goes from $${fmt(b0)} to $${fmt(b0 + rb)}, up $${fmt(rb)}.`, `${S(nA)} grew more, even though ${nB}'s line looks steeper: its axis only goes to ${fmt(MB)}.`],
  }, [
    { t: nA, ok: true, say: `Yes: up $${fmt(ra)} against $${fmt(rb)}. The axes have different scales.` },
    { t: nB, mc: MC.steep, say: `${nB}'s line looks steeper because its axis only reaches ${fmt(MB)}. In dollars it grew $${fmt(rb)}, less than $${fmt(ra)}.` },
    { t: 'They grew the same', say: `Read the numbers: up $${fmt(ra)} and up $${fmt(rb)}.` },
  ]);
};

// =====================================================================================================
// 5. graph-origin
// =====================================================================================================
const cropBar: Gen = (R, n) => {
  const b0 = pick(R, [50, 100, 200, 70, 500, 150]), d1 = int(R, 1, 3), k = int(R, 2, 5), d2 = d1 * k;
  const a = b0 + d1, b = b0 + d2, top = b0 + Math.max(10, d2 + 2 - (d2 % 2));
  const step = top - b0 > 10 ? 2 : 1;
  const ratio = fmt(b / a, 2);
  return choiceItem(R, {
    id: `cropBar-${n}`, family: 'cropBar', prompt: `Bar B looks ${k} times as tall as bar A. A is ${a}, B is ${b}. Is B about ${k} times A?`,
    board: `\\dfrac{${b}}{${a}} \\approx \\,?`,
    picture: { planes: [{ x: { min: 0, max: 3, step: 1, name: 'product', labels: ['', 'A', 'B', ''] }, y: { min: b0, max: top, step, name: 'units sold', labels: Array.from({ length: (top - b0) / step + 1 }, (_, i) => (i % 2 === 0 ? fmt(b0 + i * step) : '')) }, bars: [{ x: 1, v: a }, { x: 2, v: b }] }] },
    solution: [`The axis starts at ${b0}, not 0, so the bars only show the part above ${b0}: ${d1} and ${d2}.`, `${b} ÷ ${a} ≈ ${ratio}: B is only about ${ratio} times A.`],
  }, [
    { t: `No: B is only about ${ratio} times A. The axis starts at ${b0}.`, ok: true, say: `Yes: the bars are cut off at ${b0}, so their heights exaggerate the gap.` },
    { t: `Yes: the bars show it`, mc: MC.anyBase, say: `A bar chart compares sizes by bar height, so its axis must start at 0. Here it starts at ${b0}: ${b} is not ${k} times ${a}.` },
    { t: `No: B is less than A`, say: `B is ${b} and A is ${a}: B is a bit more, not ${k} times as much.` },
  ]);
};
const chooseStart: Gen = (R, n) => {
  const kind = int(R, 0, 3);
  if (kind === 0) {
    const lo = roundTo(97.4 + 0.1 * int(R, 0, 4), 1), hi = roundTo(lo + 0.8 + 0.1 * int(R, 0, 6), 1), st = Math.floor(lo - 0.4);
    return choiceItem(R, {
      id: `chooseStart-${n}`, family: 'chooseStart', prompt: `A line graph shows one person's body temperature through a day, from ${lo} °F to ${hi} °F. The purpose: see the small rise and fall. Where should the vertical axis start?`,
      board: `${lo}^\\circ\\mathrm{F} \\ \\text{to}\\ ${hi}^\\circ\\mathrm{F}`,
      solution: [`A line graph of small changes reads the changes, not the size, so cropping the axis helps.`, `Start just below the data: ${S(`at ${st} °F`)}.`],
    }, [
      { t: `at ${st} °F`, ok: true, say: `Yes: just below the lowest value, so the changes fill the graph.` },
      { t: `at 0 °F`, mc: MC.zero, say: `From 0 °F the line would be flat: the changes would vanish. A line graph of small changes may start near the data.` },
      { t: `at ${hi} °F`, say: `That cuts off every value below ${hi} °F.` },
    ]);
  }
  if (kind === 1) {
    const a = int(R, 110, 125) * 10, b = a + int(R, 4, 9) * 10;
    return choiceItem(R, {
      id: `chooseStart-${n}`, family: 'chooseStart', prompt: `A bar chart compares two schools: ${fmt(a)} students and ${fmt(b)} students. The purpose: compare their sizes. Where should the vertical axis start?`,
      board: `${fmtT(a)}\\ \\text{vs}\\ ${fmtT(b)}`,
      solution: [`A bar chart compares sizes by bar height, so a bar must start at 0.`, `Start the axis ${S('at 0')}.`],
    }, [
      { t: `at 0`, ok: true, say: `Yes: then the bar heights compare the real sizes.` },
      { t: `at ${fmt(a - 50)}`, mc: MC.anyBase, say: `Cut at ${fmt(a - 50)}, the bars would show 50 and ${b - a + 50}: one looks far bigger. Bars need a zero baseline.` },
      { t: `at ${fmt(b)}`, say: `Then neither bar would show.` },
    ]);
  }
  if (kind === 2) {
    const v = int(R, 2, 4), t = int(R, 10, 30), first = roundTo(v * 2 / 60, 2);
    return choiceItem(R, {
      id: `chooseStart-${n}`, family: 'chooseStart', prompt: `A graph shows a ${t}-minute walk at ${v} mi/h, distance against time. The purpose: show the walk from its start. The first reading after 2 min is ${first} mi. Where should the distance axis start?`,
      board: `\\text{distance from } ? \\text{ mi}`,
      solution: [`The walk starts at 0 mi at 0 min; a graph meant to show it from the start must include that point.`, `Start the distance axis ${S('at 0 mi')}.`],
    }, [
      { t: `at 0 mi`, ok: true, say: `Yes: the walk starts at 0 mi, so the graph must show it.` },
      { t: `at ${first} mi`, mc: MC.anyBase, say: `Starting at the first reading hides where the walk began, which is the point of this graph.` },
      { t: `at ${roundTo(v * t / 60, 2)} mi`, say: `That is where the walk ends: everything before would be cut off.` },
    ]);
  }
  const lo = int(R, 101, 140), hi = lo + int(R, 4, 9), st = lo % 5 === 0 ? lo - 5 : lo - (lo % 5);
  return choiceItem(R, {
    id: `chooseStart-${n}`, family: 'chooseStart', prompt: `A line graph shows a share price over a week, between $${lo} and $${hi}. The purpose: see the day-to-day changes. Where should the vertical axis start?`,
    board: `\\$${lo}\\ \\text{to}\\ \\$${hi}`,
    solution: [`A line graph of small changes may start near the data, so the changes are visible.`, `Start ${S(`at $${st}`)}.`],
  }, [
    { t: `at $${st}`, ok: true, say: `Yes: just below the lowest price, so the changes show.` },
    { t: `at $0`, mc: MC.zero, say: `From $0 the line would look flat. For changes on a line graph, start near the data.` },
    { t: `at $${hi}`, say: `That cuts off every price below $${hi}.` },
  ]);
};

// =====================================================================================================
// 6. exact-vs-measured
// =====================================================================================================
type EKind = 'count' | 'defined' | 'measured';
interface EVal { t: string; kind: EKind; dec: boolean }
const EXACTS = (R: () => number): EVal[] => [
  { t: `${int(R, 18, 34)} students in a class`, kind: 'count', dec: false },
  { t: `${int(R, 8, 24)} cars in a parking lot`, kind: 'count', dec: false },
  { t: `a price of $${int(R, 2, 9)}.${int(R, 10, 99)}`, kind: 'count', dec: true },
  { t: `12 in in 1 ft`, kind: 'defined', dec: false }, { t: `2.54 cm in 1 in`, kind: 'defined', dec: true },
  { t: `5,280 ft in 1 mi`, kind: 'defined', dec: false }, { t: `16 oz in 1 lb`, kind: 'defined', dec: false },
  { t: `60 s in 1 min`, kind: 'defined', dec: false }, { t: `1,000 g in 1 kg`, kind: 'defined', dec: false },
];
const MEASURED = (R: () => number): EVal[] => [
  { t: `a board ${int(R, 6, 16)} ft long`, kind: 'measured', dec: false },
  { t: `a sprint timed at ${int(R, 10, 14)}.${int(R, 1, 9)} s`, kind: 'measured', dec: true },
  { t: `1 mi ≈ 1.609 km`, kind: 'measured', dec: true },
  { t: `a town of about ${int(R, 3, 40)},000 people`, kind: 'measured', dec: false },
  { t: `a puppy weighing ${int(R, 5, 30)} lb`, kind: 'measured', dec: false },
  { t: `a room ${int(R, 10, 18)}.${int(R, 1, 9)} ft wide`, kind: 'measured', dec: true },
];
const KIND_T: Record<EKind, string> = { count: 'Exact: a count or an amount of money', defined: 'Exact: true by definition of the units', measured: 'Measured or rounded' };
function exactMc(truth: EVal, said: EKind): string | undefined {
  if (truth.kind === 'measured' && said !== 'measured') return truth.dec ? MC.asExact : MC.byForm;
  if (truth.kind === 'defined' && said === 'measured') return truth.dec ? MC.byForm : MC.allInexact;
  if (truth.kind === 'count' && said === 'measured') return truth.dec ? MC.byForm : MC.asExact;
  return undefined;
}
const WHY: Record<EKind, string> = { count: 'you can count it (or it is money, exact to the cent)', defined: 'the units are defined that way, so no measuring is involved', measured: 'it came from a measurement or a rounding, so it is only as good as that' };
const exactOrMeasured: Gen = (R, n) => {
  const pool = R() < 0.5 ? EXACTS(R) : MEASURED(R), v = pick(R, pool);
  return choiceItem(R, {
    id: `exactOrMeasured-${n}`, family: 'exactOrMeasured', prompt: `Exact or measured: ${A(v.t)}?`,
    board: `\\text{exact or measured?}`,
    solution: [`Exact: a count, money, or a factor fixed by definition. Measured: anything read off an instrument or rounded.`, `${v.t}: ${WHY[v.kind]}. So: ${S(KIND_T[v.kind])}.`],
  }, (['count', 'defined', 'measured'] as EKind[]).map(k => k === v.kind ? { t: KIND_T[k], ok: true, say: `Yes: ${WHY[k]}.` }
    : { t: KIND_T[k], mc: exactMc(v, k), say: v.kind === 'measured' ? `This one was measured or rounded: ${WHY.measured}. A whole number can still be measured.` : v.kind === 'defined' ? `This is a definition of the units: ${v.t} exactly${v.dec ? ', even with its decimal' : ''}.` : `This is ${WHY.count}.` }));
};
const whichExact: Gen = (R, n) => {
  const e = pick(R, EXACTS(R)), ms = shuffle(R, MEASURED(R)).slice(0, 2);
  return choiceItem(R, {
    id: `whichExact-${n}`, family: 'whichExact', prompt: `Three values: ${shuffle(R, [e.t, ...ms.map(m => m.t)]).map(t => A(t)).join(', ')}. Which one is exact?`,
    board: `\\text{exact: counted, money, or defined}`,
    solution: [`Exact values come from counting, from money, or from the definition of a unit. Everything read off an instrument, or rounded, is measured.`, `${e.t}: ${WHY[e.kind]}. So: ${S(e.t)}.`],
  }, [
    { t: e.t, ok: true, say: `Yes: ${WHY[e.kind]}.` },
    ...ms.map(m => ({ t: m.t, mc: m.dec ? MC.asExact : MC.byForm, say: `${m.t} was measured or rounded${m.dec ? '' : ', even though it is a whole number'}. It is only as good as the instrument.` })),
  ]);
};

// =====================================================================================================
// 7-8. measurement-interval, measurement-bounds-calculation
// =====================================================================================================
interface Rec { v: number; res: number; unit: string; noun: string; inst: string; resH: string; den?: number; dp?: number; vQ?: Q }
const fracRec = (R: () => number, dens: number[]): Rec => {
  const d = pick(R, dens), w = int(R, 2, 30), k = int(R, 1, d - 1), vQ = qn(w * d + k, d);
  return { v: qval(vQ), res: 1 / d, unit: 'in', noun: 'length', inst: 'a ruler', resH: `to the nearest ${fr(1, d)} in`, den: d, vQ };
};
const decRec = (R: () => number): Rec => pick(R, [
  () => ({ v: roundTo(int(R, 2, 9) + int(R, 1, 9) / 10, 1), res: 0.1, unit: 'lb', noun: 'weight', inst: 'a scale', resH: 'to the nearest 0.1 lb', dp: 2 }),
  () => ({ v: int(R, 120, 190), res: 1, unit: 'cm', noun: 'length', inst: 'a tape', resH: 'to the nearest cm', dp: 1 }),
  () => ({ v: roundTo(int(R, 9, 12) + int(R, 1, 99) / 100, 2), res: 0.01, unit: 's', noun: 'time', inst: 'a stopwatch', resH: 'to the nearest 0.01 s', dp: 3 }),
] as (() => Rec)[])();
const cap = (t: string) => t[0]!.toUpperCase() + t.slice(1);
/** a value of a record as HTML: a mixed number in fourths of the resolution, or a trimmed decimal */
const showV = (r: Rec, x: number) => (r.den ? mixedH(qn(Math.round(x * r.den * 4), r.den * 4)) : fmt(roundTo(x, (r.dp ?? 2) + 1)));
const recT = (r: Rec) => (r.den ? mixedT(r.vQ!) : fmtT(r.v));
function rulerOf(r: Rec, extra: Partial<RulerPic> = {}): RulerPic {
  return { lo: r.v - 2 * r.res, hi: r.v + 2 * r.res, minor: r.res / (r.den ? 4 : 10), major: r.res, v: r.v, res: r.res, unit: r.unit, den: r.den ? r.den * 4 : undefined, dp: r.dp, ...extra };
}
const intervalRead: Gen = (R, n) => {
  const r = R() < 0.5 ? fracRec(R, [4, 8]) : decRec(R), [lo, hi] = [r.v - r.res / 2, r.v + r.res / 2];
  const V = (x: number) => `${showV(r, x)} ${r.unit}`;
  return choiceItem(R, {
    id: `intervalRead-${n}`, family: 'intervalRead', prompt: `A ${r.noun} is read off ${r.inst}, ${r.resH}, and recorded as ${A(V(r.v))}. Assume rounding is the only error. Which true values could it be?`,
    board: `\\text{recorded: } ${recT(r)}\\,${unitT(r.unit)}`,
    picture: { ruler: rulerOf(r) },
    solution: [`Anything that rounds to ${V(r.v)} could be the true value: up to half a step (${r.den ? fr(1, Math.round(2 / r.res)) : fmt(r.res / 2)} ${r.unit}) either side.`, `So the true value is ${S(`from ${V(lo)} up to ${V(hi)}`)} (a value exactly at ${V(hi)} rounds up).`],
  }, [
    { t: `from ${V(lo)} up to ${V(hi)}`, ok: true, say: `Yes: half a step either side of ${V(r.v)}.` },
    { t: `from ${V(r.v - r.res)} up to ${V(r.v + r.res)}`, mc: MC.whole, say: `That is a whole step either side. Values more than half a step away round to a different mark.` },
    { t: `only ${V(r.v)} exactly`, mc: MC.asExact, say: `A recorded measurement stands for a whole interval: every value that rounds to it.` },
  ]);
};
const couldBe: Gen = (R, n) => {
  const r = R() < 0.4 ? fracRec(R, [4]) : decRec(R), h = r.res / 2;
  const inside = pick(R, [r.v - h * 0.5, r.v + h * 0.5, r.v - h]);
  const V = (x: number) => `${showV(r, x)} ${r.unit}`;
  return choiceItem(R, {
    id: `couldBe-${n}`, family: 'couldBe', prompt: `${cap(r.inst)} reads ${A(V(r.v))}, ${r.resH}. Which true ${r.noun} could it be? (A value exactly halfway rounds up.)`,
    board: `\\text{recorded: } ${recT(r)}\\,${unitT(r.unit)}`,
    picture: { ruler: { ...rulerOf(r), probe: inside } },
    solution: [`Values from ${V(r.v - h)} up to (not including) ${V(r.v + h)} round to it.`, `${S(V(inside))} is in that interval.`],
  }, [
    { t: V(inside), ok: true, say: `Yes: it is within half a step of the recorded value, so it rounds to it.` },
    { t: V(r.v + h), say: `Exactly halfway rounds UP, to the next mark. So ${V(r.v + h)} would be recorded differently.` },
    { t: V(r.v - h * 1.5), mc: MC.whole, say: `That is more than half a step below, so it rounds to the mark below.` },
  ]);
};
const boundsFrac: Gen = (R, n) => {
  const d = pick(R, [4, 8, 16]), w = int(R, 2, 40), k = int(R, 1, d - 1), v = qn(w * d + k, d), lower = R() < 0.5;
  const half = qn(1, 2 * d), ans = lower ? qsub(v, half) : qadd(v, half);
  const wholeQ = lower ? qsub(v, qn(1, d)) : qadd(v, qn(1, d)), divQ = lower ? qsub(v, qn(2, d)) : qadd(v, qn(2, d));
  const [an, ad] = ans, aw = Math.floor(an / ad);
  return {
    id: `boundsFrac-${n}`, family: 'boundsFrac', prompt: `A length is recorded as ${A(mixedH(v) + ' in')}, measured to the nearest ${fr(1, d)} in. What is the ${lower ? 'lower' : 'upper'} bound of the true length?`,
    board: `${mixedT(v)} ${lower ? '-' : '+'} \\tfrac{1}{2}\\cdot\\tfrac{1}{${d}} = \\,?`,
    input: 'frac', unit: 'in',
    picture: { ruler: rulerOf({ v: qval(v), res: 1 / d, unit: 'in', noun: 'length', inst: '', resH: '', den: d, vQ: v }) },
    solution: [`Half of ${fr(1, d)} in is ${fr(1, 2 * d)} in.`, `${mixedH(v)} ${lower ? '−' : '+'} ${fr(1, 2 * d)} = ${S(mixedH(ans) + ' in')}.`],
    answer: { kind: 'frac', w: aw, n: an - aw * ad, d: ad },
    check: (r: Response): Verdict => {
      if (r.kind !== 'frac') return { ok: false, say: 'Type a mixed number.' };
      const p = fracValue(r);
      if (!p) return { ok: false, say: 'Type a whole number and a fraction.' };
      const pq: Q = [p[0], p[1]];
      if (qeq(pq, ans)) return { ok: true, say: `Yes: ${mixedH(v)} ${lower ? '−' : '+'} ${fr(1, 2 * d)} = ${mixedH(ans)} in.` };
      if (qeq(pq, wholeQ)) return { ok: false, mc: MC.whole, say: `That moves a whole ${fr(1, d)} in. The bound is HALF a step away: ${fr(1, 2 * d)} in.` };
      if (qeq(pq, divQ)) return { ok: false, mc: MC.divisor, say: `Half of ${fr(1, d)} is ${fr(1, d)} ÷ 2 = ${fr(1, 2 * d)}, not ${fr(1, d)} × 2.` };
      if (qeq(pq, v)) return { ok: false, mc: MC.asExact, say: `${mixedH(v)} is the recorded value. The true length can be up to half a step ${lower ? 'below' : 'above'} it.` };
      return { ok: false, say: `Take half of ${fr(1, d)} in and ${lower ? 'subtract it from' : 'add it to'} ${mixedH(v)} in. Rename to ${2 * d}ths first.` };
    },
  };
};
const boundsDec: Gen = (R, n) => {
  const kind = int(R, 0, 3);
  const r: Rec = kind === 3
    ? (() => { const res = pick(R, [100, 1000]); return { v: res * int(R, 12, 60), res, unit: 'people', noun: 'count', inst: 'a report', resH: `to the nearest ${fmt(res)}`, dp: 0 }; })()
    : kind === 2 ? { v: int(R, 8, 30), res: 1, unit: 'ft', noun: 'length', inst: 'a tape', resH: 'to the nearest foot', dp: 1 } : decRec(R);
  const lo = roundTo(r.v - r.res / 2, 6), hi = roundTo(r.v + r.res / 2, 6);
  const near6 = (a: number, b: number) => Math.abs(a - b) < 1e-6 * Math.max(1, Math.abs(b));
  return {
    id: `boundsDec-${n}`, family: 'boundsDec', prompt: `${kind === 3 ? `A crowd is reported as ${A(`about ${fmt(r.v)} people`)}, rounded to the nearest ${fmt(r.res)}` : `${cap(r.inst)} reads ${A(fmt(r.v) + ' ' + r.unit)}, ${r.resH}`}. Between which two values is the true ${r.noun}?`,
    board: `${fmtT(r.v)} \\pm \\tfrac{1}{2}(${fmtT(r.res)})`,
    input: 'pair', pairLead: 'from', pairOp: 'up to', pairTail: r.unit,
    picture: kind === 3 ? undefined : { ruler: rulerOf(r) },
    solution: [`Half of the step ${fmt(r.res)} is ${fmt(r.res / 2)}.`, `From ${fmt(r.v)} − ${fmt(r.res / 2)} = ${S(fmt(lo))} up to ${fmt(r.v)} + ${fmt(r.res / 2)} = ${S(fmt(hi))} ${r.unit}.`],
    answer: { kind: 'pair', x: lo, y: hi },
    check: (q: Response): Verdict => {
      if (q.kind !== 'pair') return { ok: false, say: 'Type both ends.' };
      if (near6(q.x, lo) && near6(q.y, hi)) return { ok: true, say: `Yes: half a step either side, ${fmt(lo)} up to ${fmt(hi)}.` };
      if (near6(q.x, r.v - r.res) && near6(q.y, r.v + r.res)) return { ok: false, mc: MC.whole, say: `That is a whole step either side. The true value is within HALF a step: ± ${fmt(r.res / 2)}.` };
      if (near6(q.x, r.v) && near6(q.y, r.v)) return { ok: false, mc: MC.asExact, say: `The recorded value is rounded: the true value could be up to ${fmt(r.res / 2)} either side.` };
      return { ok: false, say: `Half of ${fmt(r.res)} is ${fmt(r.res / 2)}: subtract it for the lower end, add it for the upper end.` };
    },
  };
};

// =====================================================================================================
// 9. digits-vs-accuracy
// =====================================================================================================
const twoScales: Gen = (R, n) => {
  const M = pick(R, [100, 200, 500, 1000]), eA = roundTo((R() < 0.5 ? -1 : 1) * (2 + int(R, 10, 290) / 100), 2), eB = pick(R, [0, 1, -1]);
  const dA = fmt(M + eA, 2), dB = fmt(M + eB), digitsFirst = R() < 0.5;
  const [nD, nF] = digitsFirst ? ['Scale A', 'Scale B'] : ['Scale B', 'Scale A'];
  return choiceItem(R, {
    id: `twoScales-${n}`, family: 'twoScales', prompt: `A certified ${A(`${M}.000 g`)} test weight goes on two scales. ${nD} shows ${A(dA + ' g')}. ${nF} shows ${A(dB + ' g')}. Which scale is more accurate?`,
    board: `\\text{true: } ${M}\\,\\text{g}\\qquad \\text{A: } ${digitsFirst ? fmtT(M + eA, 2) : fmtT(M + eB)}\\qquad \\text{B: } ${digitsFirst ? fmtT(M + eB) : fmtT(M + eA, 2)}`,
    solution: [`Accuracy is closeness to the true value; digits only show how finely the display reads.`, `${nD} is off by ${fmt(Math.abs(eA), 2)} g, ${nF} by ${Math.abs(eB)} g. So: ${S(nF)}.`],
  }, [
    { t: nF, ok: true, say: `Yes: ${nF} is ${eB === 0 ? 'right on' : 'only 1 g off'}; ${nD} is ${fmt(Math.abs(eA), 2)} g off, however many digits it shows.` },
    { t: nD, mc: MC.precAcc, say: `${nD} shows more digits, but it is ${fmt(Math.abs(eA), 2)} g away from the true ${M} g. Digits are not accuracy.` },
    { t: 'They are equally accurate', say: `Compare each reading with the true ${M} g: one is much closer.` },
  ]);
};
const DEVICES: { what: string; unit: string; e: number; dp: number; lo: number; hi: number }[] = [
  { what: 'A laser tape shows', unit: 'ft', e: 0.05, dp: 3, lo: 8, hi: 40 },
  { what: 'A hand-timed sprint shows', unit: 's', e: 0.2, dp: 2, lo: 10, hi: 14 },
  { what: 'A bathroom scale shows', unit: 'lb', e: 1, dp: 1, lo: 100, hi: 200 },
  { what: 'A kitchen scale shows', unit: 'g', e: 2, dp: 1, lo: 150, hi: 900 },
];
const whatDigitsSay: Gen = (R, n) => {
  const D = pick(R, DEVICES), v = roundTo(D.lo + R() * (D.hi - D.lo), D.dp), lo = roundTo(v - D.e, D.dp), hi = roundTo(v + D.e, D.dp);
  const half = 0.5 * 10 ** -D.dp;
  return choiceItem(R, {
    id: `whatDigitsSay-${n}`, family: 'whatDigitsSay', prompt: `${D.what} ${A(fmt(v, D.dp) + ' ' + D.unit)}. Its maker says it can be off by up to ${fmt(D.e)} ${D.unit}. What can you claim?`,
    board: `${fmtT(v, D.dp)} \\pm ${fmtT(D.e)}\\,${unitT(D.unit)}`,
    solution: [`The display reads to ${fmt(10 ** -D.dp)} ${D.unit}, but the device can be off by ${fmt(D.e)} ${D.unit}: the error is what limits the claim.`, `So the true value is ${S(`between ${fmt(lo, D.dp)} and ${fmt(hi, D.dp)} ${D.unit}`)}.`],
  }, [
    { t: `between ${fmt(lo, D.dp)} and ${fmt(hi, D.dp)} ${D.unit}`, ok: true, say: `Yes: the stated error, ${fmt(D.e)} ${D.unit}, sets the range, not the number of digits.` },
    { t: `exactly ${fmt(v, D.dp)} ${D.unit}`, mc: MC.precAcc, say: `The display shows ${D.dp} decimals, but the device can be off by ${fmt(D.e)} ${D.unit}.` },
    { t: `between ${fmt(v - half, D.dp + 1)} and ${fmt(v + half, D.dp + 1)} ${D.unit}`, mc: MC.precAcc, say: `That is only the display's rounding. The device itself can be off by ${fmt(D.e)} ${D.unit}, far more.` },
  ]);
};

// =====================================================================================================
// 10. unit-factor-orientation
// =====================================================================================================
const CONV: Pair[] = PAIRS.slice();
function convertNums(R: () => number, p: Pair): { from: string; to: string; v: number; ans: number; mult: boolean } {
  const mult = p.system === 'cross' ? true : R() < 0.55;
  if (mult) {
    const v = p.system === 'cross' ? int(R, 2, 20) : p.big === 'mi' && p.small === 'ft' ? int(R, 1, 4) : p.f >= 1000 ? int(R, 2, 9) + (R() < 0.3 ? 0.5 : 0) : int(R, 2, 12);
    return { from: p.big, to: p.small, v, ans: roundTo(v * p.f, 6), mult };
  }
  const k = p.f >= 1000 ? int(R, 2, 9) : int(R, 2, 12), v = k * p.f;
  return { from: p.small, to: p.big, v, ans: k, mult };
}
const convert: Gen = (R, n) => {
  const p = pick(R, CONV), c = convertNums(R, p);
  const facTop = c.mult ? [p.f, p.small] as const : [1, p.big] as const, facBot = c.mult ? [1, p.big] as const : [p.f, p.small] as const;
  const flipV = c.mult ? roundTo(c.v / p.f, 6) : roundTo(c.v * p.f, 6);
  return numItem({
    id: `convert-${n}`, family: 'convert', prompt: `Convert ${A(fmt(c.v) + ' ' + c.from)} to ${UNIT_WORD[c.to] ?? c.to}.${p.approx ? ' Use 1 mi ≈ 1.609 km (rounded).' : p.system === 'cross' ? ' 1 in = 2.54 cm exactly.' : ''}`,
    board: `${qT(c.v, c.from)} = \\,?\\ ${unitT(c.to)}`, unit: c.to,
    picture: { chain: { start: { n: c.v, u: c.from }, factors: [{ n: facTop[0], u: facTop[1], bn: facBot[0], bu: facBot[1], hide: true }], result: { n: c.ans, u: c.to, hide: true } } },
    solution: [`1 ${p.big} = ${fmt(p.f)} ${p.small}. Put ${c.from} on the bottom so it cancels: ${facH(facTop[0], facTop[1], facBot[0], facBot[1])}.`, `${fmt(c.v)} ${c.from} × ${facH(facTop[0], facTop[1], facBot[0], facBot[1])} = ${S(fmt(c.ans))} ${c.to}.`],
  }, c.ans, `Yes: ${fmt(c.v)} ${c.from} = ${fmt(c.ans)} ${c.to}.`,
  [{ v: flipV, mc: MC.flip, say: `The factor is upside down: ${c.from} must be on the BOTTOM to cancel. ${c.mult ? `${c.to} are smaller, so there are more of them.` : `${c.to} are bigger, so there are fewer of them.`}` },
    { v: c.v, mc: MC.decor, say: `Same number, new unit? A ${c.to} is not the same size as a ${c.from}: multiply by the unit factor.` }],
  `Write 1 ${p.big} = ${fmt(p.f)} ${p.small} as a fraction with ${c.from} on the bottom, then multiply.`, p.approx ? 1e-3 : 1e-6);
};
const pickFactor: Gen = (R, n) => {
  const p = pick(R, CONV.filter(q => q.system !== 'cross')), c = convertNums(R, p);
  const right = c.mult ? facH(p.f, p.small, 1, p.big) : facH(1, p.big, p.f, p.small);
  const flip = c.mult ? facH(1, p.big, p.f, p.small) : facH(p.f, p.small, 1, p.big);
  const odd = facH(p.f, p.big, 1, p.small);
  return choiceItem(R, {
    id: `pickFactor-${n}`, family: 'pickFactor', prompt: `Convert ${A(fmt(c.v) + ' ' + c.from)} to ${UNIT_WORD[c.to] ?? c.to}. Which unit factor do you multiply by?`,
    board: `${qT(c.v, c.from)} \\times \\dfrac{?}{?} = \\,?\\ ${unitT(c.to)}`,
    picture: { chain: { start: { n: c.v, u: c.from }, factors: [{ n: c.mult ? p.f : 1, u: c.mult ? p.small : p.big, bn: c.mult ? 1 : p.f, bu: c.mult ? p.big : p.small, hide: true }], result: { n: c.ans, u: c.to, hide: true } } },
    solution: [`The factor must equal 1 (1 ${p.big} = ${fmt(p.f)} ${p.small}) and have ${c.from} on the bottom, so ${c.from} cancels and ${c.to} is left.`, `So: ${S(right)}, and ${fmt(c.v)} ${c.from} = ${fmt(c.ans)} ${c.to}.`],
  }, [
    { t: right, ok: true, say: `Yes: ${c.from} on the bottom cancels, ${c.to} is left.` },
    { t: flip, mc: MC.flip, say: `That one is upside down: ${c.from} on top would give ${c.from}² / ${c.to}, not ${c.to}.` },
    { t: odd, say: `That is not 1: ${fmt(p.f)} ${p.big} is not 1 ${p.small}.` },
  ]);
};

// =====================================================================================================
// 11. common-unit-before-adding
// =====================================================================================================
const ADD: { big: string; small: string; f: number; ctx: string }[] = [
  { big: 'ft', small: 'in', f: 12, ctx: 'Two boards laid end to end' }, { big: 'h', small: 'min', f: 60, ctx: 'A drive plus a stop' },
  { big: 'lb', small: 'oz', f: 16, ctx: 'A package plus its box' }, { big: 'gal', small: 'qt', f: 4, ctx: 'Two jugs of water poured together' },
  { big: 'yd', small: 'ft', f: 3, ctx: 'Two pieces of fabric' }, { big: 'm', small: 'cm', f: 100, ctx: 'Two shelves side by side' },
];
const addMixed: Gen = (R, n) => {
  const T = pick(R, ADD), a = int(R, 2, 9), b = int(R, 1, T.f - 1), ans = a * T.f + b;
  return numItem({
    id: `addMixed-${n}`, family: 'addMixed', prompt: `${T.ctx}: ${A(a + ' ' + T.big)} and ${B(b + ' ' + T.small)}. How much is that in ${UNIT_WORD[T.small]}?`,
    board: `${qT(a, T.big)} + ${qT(b, T.small)} = \\,?\\ ${unitT(T.small)}`, unit: T.small,
    solution: [`Only quantities in the same unit add. ${a} ${T.big} = ${a} × ${T.f} = ${a * T.f} ${T.small}.`, `${a * T.f} + ${b} = ${S(ans)} ${T.small}.`],
  }, ans, `Yes: ${a * T.f} ${T.small} + ${b} ${T.small} = ${ans} ${T.small}.`,
  [{ v: a + b, mc: MC.addMixed, say: `${a} + ${b} adds ${T.big} to ${T.small}, like adding apples to grapes. Change ${a} ${T.big} to ${T.small} first.` },
    { v: a * T.f, say: `That is only the ${a} ${T.big}. Add the ${b} ${T.small} too.` }],
  `Change ${a} ${T.big} to ${T.small} (× ${T.f}), then add ${b}.`);
};

// =====================================================================================================
// 12. unit-algebra
// =====================================================================================================
const unitResult: Gen = (R, n) => {
  const kind = int(R, 0, 3);
  const T = kind === 0 ? (() => { const r = int(R, 20, 70), t = int(R, 2, 6); return { tex: `${facT(r, 'mi', 1, 'h')} \\times ${qT(t, 'h')}`, ch: { start: { n: r, u: 'mi', bn: 1, bu: 'h' }, factors: [{ n: t, u: 'h' }], result: { n: r * t, u: 'mi', hide: true, hideUnit: true } }, right: 'mi', wrongs: [['mi/h', MC.mislabel], ['mi·h', undefined]] as [string, string | undefined][], why: `h cancels h: miles are left.` }; })()
    : kind === 1 ? (() => { const p = int(R, 30, 49) / 10, g = int(R, 5, 15); return { tex: `${facT(fmtT(p, 2), '$', 1, 'gal')} \\times ${qT(g, 'gal')}`, ch: { start: { n: fmt(p, 2), u: '$', bn: 1, bu: 'gal' }, factors: [{ n: g, u: 'gal' }], result: { n: fmt(p * g, 2), u: '$', hide: true, hideUnit: true } }, right: 'dollars', wrongs: [['$/gal', MC.mislabel], ['gal', undefined]] as [string, string | undefined][], why: `gal cancels gal: dollars are left.` }; })()
      : kind === 2 ? (() => { const m = int(R, 20, 40), g = int(R, 3, 12); return { tex: `${qT(m * g, 'mi')} \\div ${facT(m, 'mi', 1, 'gal')}`, ch: { start: { n: m * g, u: 'mi' }, factors: [{ n: 1, u: 'gal', bn: m, bu: 'mi' }], result: { n: g, u: 'gal', hide: true, hideUnit: true } }, right: 'gal', wrongs: [['mi', MC.mislabel], ['mi²/gal', undefined]] as [string, string | undefined][], why: `Dividing by mi/gal multiplies by gal/mi: mi cancels, gallons are left.` }; })()
        : (() => { const d = int(R, 30, 60) * 3, v = int(R, 2, 12); return { tex: `${facT(d, 'lb', 1, 'ft³')} \\times ${qT(v, 'ft³')}`, ch: { start: { n: d, u: 'lb', bn: 1, bu: 'ft³' }, factors: [{ n: v, u: 'ft³' }], result: { n: d * v, u: 'lb', hide: true, hideUnit: true } }, right: 'lb', wrongs: [['lb/ft³', MC.mislabel], ['ft³', undefined]] as [string, string | undefined][], why: `ft³ cancels ft³: pounds are left.` }; })();
  return choiceItem(R, {
    id: `unitResult-${n}`, family: 'unitResult', prompt: `Work out only the unit: what unit does the answer have?`,
    board: T.tex, picture: { chain: T.ch as ChainPic },
    solution: [`Treat units like numbers: a unit on top cancels the same unit on the bottom.`, `${T.why} The unit is ${S(T.right)}.`],
  }, [
    { t: T.right, ok: true, say: `Yes: ${T.why}` },
    ...T.wrongs.map(([t, mc]) => ({ t, mc, say: `Cancel first: ${T.why}` })),
  ]);
};
const rateTime: Gen = (R, n) => {
  const kind = int(R, 0, 2);
  if (kind === 0) {
    // realistic actors: a cyclist at 10-18 mi/h, a car at 30-60 mi/h
    const bike = R() < 0.5, r = bike ? pick(R, [10, 12, 15, 18]) : pick(R, [30, 36, 45, 48, 60]), t = pick(R, r % 3 ? [15, 30, 45, 90] : [15, 20, 30, 40, 45, 90]), ans = roundTo(r * t / 60, 4);
    return numItem({
      id: `rateTime-${n}`, family: 'rateTime', prompt: bike ? `A cyclist rides at ${A(r + ' mi/h')} for ${B(t + ' min')}. How far does she go?` : `A car drives at ${A(r + ' mi/h')} for ${B(t + ' min')}. How far does it go?`,
      board: `${facT(r, 'mi', 1, 'h')} \\times ${qT(t, 'min')} \\times ${facT(1, 'h', 60, 'min')}`, unit: 'mi',
      picture: { chain: { start: { n: r, u: 'mi', bn: 1, bu: 'h' }, factors: [{ n: t, u: 'min' }, { n: 1, u: 'h', bn: 60, bu: 'min' }], result: { n: ans, u: 'mi', hide: true } } },
      solution: [`mi/h × min does not cancel: change ${t} min to hours with ${facH(1, 'h', 60, 'min')}: ${fmt(t / 60)} h.`, `${r} × ${fmt(roundTo(t / 60, 4))} = ${S(fmt(ans))} mi.`],
    }, ans, `Yes: ${t} min is ${fmt(roundTo(t / 60, 4))} h, and ${r} mi/h × ${fmt(roundTo(t / 60, 4))} h = ${fmt(ans)} mi.`,
    [{ v: r * t, mc: MC.mismatch, say: `${r} × ${t} multiplies miles PER HOUR by MINUTES: the units do not cancel. Change ${t} min to hours first.` }],
    `Minutes and hours must match: ${t} min = ${t}/60 h.`);
  }
  if (kind === 1) {
    const p = int(R, 30, 49) / 10, g = int(R, 5, 15), ans = roundTo(p * g, 2);
    return numItem({
      id: `rateTime-${n}`, family: 'rateTime', prompt: `Gas costs ${A(money(p) + '/gal')}. You buy ${B(g + ' gal')}. What do you pay?`,
      board: `${facT(fmtT(p, 2), '$', 1, 'gal')} \\times ${qT(g, 'gal')}`, unit: 'dollars',
      picture: { chain: { start: { n: fmt(p, 2), u: '$', bn: 1, bu: 'gal' }, factors: [{ n: g, u: 'gal' }], result: { n: fmt(ans, 2), u: '$', hide: true } } },
      solution: [`$/gal × gal: the gallons cancel, dollars are left.`, `${money(p)} × ${g} = ${S(money(ans))}.`],
    }, ans, `Yes: ${money(ans)}.`, [{ v: roundTo(p / g, 6), mc: MC.flip, say: `Dividing gives $/gal ÷ gal = $/gal²: no. Multiply, so the gallons cancel.` }], `Multiply the price per gallon by the gallons.`);
  }
  const m = int(R, 20, 40), g = int(R, 3, 12), d = m * g;
  return numItem({
    id: `rateTime-${n}`, family: 'rateTime', prompt: `A car gets ${A(m + ' mi/gal')}. How many gallons does a ${B(d + ' mi')} trip use?`,
    board: `${qT(d, 'mi')} \\times ${facT(1, 'gal', m, 'mi')}`, unit: 'gal',
    picture: { chain: { start: { n: d, u: 'mi' }, factors: [{ n: 1, u: 'gal', bn: m, bu: 'mi' }], result: { n: g, u: 'gal', hide: true } } },
    solution: [`You want gallons, so put mi on the bottom: ${facH(1, 'gal', m, 'mi')}.`, `${d} ÷ ${m} = ${S(g)} gal.`],
  }, g, `Yes: ${d} mi ÷ ${m} mi/gal = ${g} gal.`, [{ v: d * m, mc: MC.flip, say: `${d} × ${m} gives mi²/gal. To get gallons, divide by ${m} mi/gal.` }], `Which way round makes miles cancel?`);
};

// =====================================================================================================
// 13. compound-rate-conversion
// =====================================================================================================
const RC: { from: string; to: string; vs: number[]; num: [number, string, number, string]; den: [number, string, number, string]; ctx: string }[] = [
  // num factor converts the top unit, den factor the bottom unit; value * nf / df
  { from: 'mi/h', to: 'ft/s', vs: [15, 30, 45, 60, 75], num: [5280, 'ft', 1, 'mi'], den: [1, 'h', 3600, 's'], ctx: 'A car drives' },
  { from: 'mi/h', to: 'ft/min', vs: [5, 6, 8, 10, 12], num: [5280, 'ft', 1, 'mi'], den: [1, 'h', 60, 'min'], ctx: 'A runner goes' },
  { from: '$/lb', to: '¢/oz', vs: [1.6, 2.4, 3.2, 4, 4.8, 6.4], num: [100, '¢', 1, '$'], den: [1, 'lb', 16, 'oz'], ctx: 'Cheese costs' },
  { from: 'gal/min', to: 'qt/s', vs: [3, 6, 9, 12], num: [4, 'qt', 1, 'gal'], den: [1, 'min', 60, 's'], ctx: 'A hose pours' },
  { from: 'km/h', to: 'm/s', vs: [18, 36, 54, 72, 90, 108], num: [1000, 'm', 1, 'km'], den: [1, 'h', 3600, 's'], ctx: 'A train runs' },
];
const rateConvert: Gen = (R, n) => {
  const T = pick(R, RC), v = pick(R, T.vs), nf = T.num[0] / T.num[2], df = T.den[2] / T.den[0];
  const ans = roundTo(v * nf / df, 6), [tu, bu] = T.from.split('/') as [string, string], [tu2, bu2] = T.to.split('/') as [string, string];
  return numItem({
    id: `rateConvert-${n}`, family: 'rateConvert', prompt: `${T.ctx} ${A(T.from.startsWith('$') ? `$${fmt(v, 2)} per lb` : `${fmt(v)} ${T.from}`)}. What is that in ${T.to}?`,
    board: `${T.from.startsWith('$') ? `\\$${fmtT(v, 2)}/\\text{lb}` : qT(v, T.from)} = \\,?\\ ${unitT(T.to)}`, unit: T.to,
    picture: { chain: { start: { n: T.from.startsWith('$') ? fmt(v, 2) : v, u: tu, bn: 1, bu }, factors: [{ n: T.num[0], u: T.num[1], bn: T.num[2], bu: T.num[3], hide: true }, { n: T.den[0], u: T.den[1], bn: T.den[2], bu: T.den[3], hide: true }], result: { n: ans, u: tu2, bn: 1, bu: bu2, hide: true } } },
    solution: [`Convert BOTH units: ${tu} → ${tu2} on top with ${facH(T.num[0], T.num[1], T.num[2], T.num[3])}, and ${bu} → ${bu2} on the bottom with ${facH(T.den[0], T.den[1], T.den[2], T.den[3])}.`, `${fmt(v)} × ${fmt(nf)} ÷ ${fmt(df)} = ${S(fmt(ans))} ${T.to}.`],
  }, ans, `Yes: ${fmt(ans)} ${T.to}.`,
  [{ v: roundTo(v * nf, 6), mc: MC.oneUnit, say: `That converts only the top unit (${tu} → ${tu2}). The bottom unit must change too: ${bu} → ${bu2}.` },
    { v: roundTo(v / df, 6), mc: MC.oneUnit, say: `That converts only the bottom unit. The top unit must change too: ${tu} → ${tu2}.` },
    { v: roundTo(v * nf * df, 6), mc: MC.flip, say: `The time factor is upside down: ${bu} sits on the bottom of the rate, so put ${bu} on TOP of its factor to cancel it.` }],
  `Two factors: one for the top unit, one for the bottom unit. Each must cancel a unit.`);
};
const FR_A: Q[] = [[1, 2], [3, 4], [1, 3], [2, 3], [3, 2], [5, 4]], FR_B: Q[] = [[1, 4], [1, 3], [1, 2], [1, 6], [3, 4], [2, 3]];
const fracRate: Gen = (R, n) => {
  const a = pick(R, FR_A), b = pick(R, FR_B), ans = qn(a[0] * b[1], a[1] * b[0]);
  // the actor fits the speed: walking 2-4 mi/h, an easy bike ride above 4 mi/h; a pump can move any of these gal/min
  const rate = ans[0] / ans[1];
  const ctx = (rate < 2 || R() < 0.35 ? ['pumps', 'gal', 'min', 'gal/min'] : rate <= 4 ? ['walks', 'mi', 'h', 'mi/h'] : ['bikes', 'mi', 'h', 'mi/h']) as readonly [string, string, string, string];
  const prod = qn(a[0] * b[0], a[1] * b[1]), inv = qn(b[0] * a[1], b[1] * a[0]);
  const aw = Math.floor(ans[0] / ans[1]);
  return {
    id: `fracRate-${n}`, family: 'fracRate', prompt: `Maya ${ctx[0]} ${A(mixedH(a) + ' ' + ctx[1])} in ${B(mixedH(b) + ' ' + ctx[2])}. What is her rate in ${ctx[3]}?`,
    board: `\\dfrac{${mixedT(a)}\\,\\text{${ctx[1]}}}{${mixedT(b)}\\,\\text{${ctx[2]}}} = \\,?\\ \\text{${ctx[3]}}`,
    input: 'frac', unit: ctx[3],
    solution: [`A rate per 1 ${ctx[2]}: divide ${mixedH(a)} by ${mixedH(b)}, which is multiplying by ${mixedH([b[1], b[0]])}.`, `${mixedH(a)} × ${mixedH([b[1], b[0]])} = ${S(mixedH(ans) + ' ' + ctx[3])}.`],
    answer: { kind: 'frac', w: aw, n: ans[0] - aw * ans[1], d: ans[1] },
    check: (r: Response): Verdict => {
      if (r.kind !== 'frac') return { ok: false, say: 'Type a fraction or mixed number.' };
      const p = fracValue(r);
      if (!p) return { ok: false, say: 'Type a whole number and a fraction.' };
      const pq: Q = [p[0], p[1]];
      if (qeq(pq, ans)) return { ok: true, say: `Yes: ${mixedH(ans)} ${ctx[3]}.` };
      if (qeq(pq, prod)) return { ok: false, mc: MC.divisor, say: `That multiplies by ${mixedH(b)}. A rate per ${ctx[2]} DIVIDES by ${mixedH(b)}: multiply by ${mixedH([b[1], b[0]])}.` };
      if (qeq(pq, inv)) return { ok: false, mc: MC.flip, say: `That is ${ctx[2]} per ${ctx[1]}. You want ${ctx[1]} per ${ctx[2]}: ${ctx[1]} on top.` };
      return { ok: false, say: `Divide ${mixedH(a)} by ${mixedH(b)}: flip the divisor and multiply.` };
    },
  };
};

// =====================================================================================================
// 14. powered-unit-conversion
// =====================================================================================================
const POW: { big: string; small: string; f: number; p: 2 | 3 }[] = [
  { big: 'ft', small: 'in', f: 12, p: 2 }, { big: 'yd', small: 'ft', f: 3, p: 2 }, { big: 'm', small: 'cm', f: 100, p: 2 },
  { big: 'yd', small: 'ft', f: 3, p: 3 }, { big: 'ft', small: 'in', f: 12, p: 3 },
];
const sup = (p: number) => (p === 2 ? '²' : '³');
const areaConvert: Gen = (R, n) => {
  const T = pick(R, POW), F = T.f ** T.p, up = R() < 0.65, v = T.p === 3 && T.f === 12 ? int(R, 1, 3) : int(R, 2, 9);
  const bigU = T.big + sup(T.p), smallU = T.small + sup(T.p);
  const [from, to, x, ans] = up ? [bigU, smallU, v, v * F] : [smallU, bigU, v * F, v];
  const lin = up ? v * T.f : roundTo((v * F) / T.f, 6), sq = T.p === 3 ? (up ? v * T.f ** 2 : roundTo((v * F) / T.f ** 2, 6)) : NaN;
  return numItem({
    id: `areaConvert-${n}`, family: 'areaConvert', prompt: `Convert ${A(fmt(x) + ' ' + from)} to ${to}.${T.f === 12 && T.p === 3 ? ' (A calculator is fine.)' : ''}`,
    board: `${qT(x, from)} = \\,?\\ ${unitT(to)}`, unit: to,
    picture: T.f <= 12 ? { grid: { n: T.f, big: T.big, small: T.small, cube: T.p === 3 } } : undefined,
    solution: [`1 ${T.big} = ${T.f} ${T.small} on EACH side, so 1 ${bigU} = ${Array(T.p).fill(T.f).join(' × ')} = ${fmt(F)} ${smallU}.`, `${fmt(x)} ${up ? '×' : '÷'} ${fmt(F)} = ${S(fmt(ans))} ${to}.`],
  }, ans, `Yes: 1 ${bigU} = ${fmt(F)} ${smallU}, so ${fmt(x)} ${from} = ${fmt(ans)} ${to}.`,
  [{ v: lin, mc: MC.linear, say: `${T.f} is the factor for a LENGTH. ${T.p === 2 ? 'An area' : 'A volume'} has ${T.p} lengths, so the factor is ${Array(T.p).fill(T.f).join(' × ')} = ${fmt(F)}.` },
    ...(T.p === 3 ? [{ v: sq, mc: MC.linear, say: `${fmt(T.f ** 2)} is the factor for an AREA. A volume needs ${T.f} × ${T.f} × ${T.f} = ${fmt(F)}.` }] : [])],
  `How many ${smallU} fit in 1 ${bigU}? ${T.f} along each side.`);
};
const powerFactor: Gen = (R, n) => {
  const T = pick(R, POW.filter(q => q.f <= 12)), F = T.f ** T.p, v = int(R, 2, 12);
  const bigU = T.big + sup(T.p), smallU = T.small + sup(T.p);
  const opts: Opt[] = [
    { t: fmt(F), ok: true, say: `Yes: ${Array(T.p).fill(T.f).join(' × ')} = ${fmt(F)} ${smallU} in each ${bigU}.` },
    { t: fmt(T.f), mc: MC.linear, say: `${T.f} fills only one row along one side. ${T.p === 2 ? `There are ${T.f} rows` : `There are ${T.f} rows in each of ${T.f} layers`}: ${fmt(F)}.` },
  ];
  if (T.p * T.f !== T.f ** 2) opts.push({ t: fmt(T.p * T.f), say: `${T.p} × ${T.f} adds the sides; the small squares multiply: ${Array(T.p).fill(T.f).join(' × ')}.` });
  if (T.p === 3) opts.push({ t: fmt(T.f ** 2), mc: MC.linear, say: `${fmt(T.f ** 2)} is one layer. A cube has ${T.f} layers: ${fmt(F)}.` });
  return choiceItem(R, {
    id: `powerFactor-${n}`, family: 'powerFactor', prompt: `To convert ${A(v + ' ' + bigU)} to ${smallU}, you multiply by which number?`,
    board: `${qT(v, bigU)} \\times \\,? = \\ ?\\ ${unitT(smallU)}`,
    picture: { grid: { n: T.f, big: T.big, small: T.small, cube: T.p === 3 } },
    solution: [`The side of 1 ${T.big} is ${T.f} ${T.small}. ${T.p === 2 ? 'A square' : 'A cube'} has ${T.p} directions: ${Array(T.p).fill(T.f).join(' × ')} = ${fmt(F)}.`, `So multiply by ${S(fmt(F))}.`],
  }, opts);
};

// =====================================================================================================
// 15. temperature-affine-conversion
// =====================================================================================================
const tempReading: Gen = (R, n) => {
  const toF = R() < 0.6;
  if (toF) {
    const c = 5 * int(R, -3, 8), f = cToF(c);
    return numItem({
      id: `tempReading-${n}`, family: 'tempReading', prompt: `The thermometer reads ${A(fmt(c) + ' °C')}. What is that in °F? Use F = ${fr(9, 5)}C + 32.`,
      board: `F = \\tfrac{9}{5}(${fmtT(c)}) + 32`, unit: '°F',
      picture: { thermo: { cLo: -20, cHi: 50, cStep: 10, fStep: 20, mark: c, hide: 'F' } },
      solution: [`${fr(9, 5)} × ${fmt(c)} = ${fmt(c * 9 / 5)}: the size of the degrees changes.`, `+ 32, because 0 °C sits at 32 °F: ${fmt(c * 9 / 5)} + 32 = ${S(fmt(f))} °F.`],
    }, f, `Yes: ${fmt(c)} °C = ${fmt(f)} °F.`,
    [{ v: c * 9 / 5, mc: MC.proportional, say: `${fr(9, 5)} × ${fmt(c)} alone is not enough: the scales do not start together (0 °C is 32 °F). Add 32.` },
      { v: c + 32, say: `Scale first: ${fr(9, 5)} × ${fmt(c)}, then add 32.` }],
    `Multiply by ${fr(9, 5)}, then add 32.`);
  }
  const k = int(R, -2, 9), f = 32 + 9 * k, c = 5 * k;
  return numItem({
    id: `tempReading-${n}`, family: 'tempReading', prompt: `The thermometer reads ${A(fmt(f) + ' °F')}. What is that in °C? Use C = ${fr(5, 9)}(F − 32).`,
    board: `C = \\tfrac{5}{9}(${fmtT(f)} - 32)`, unit: '°C',
    picture: { thermo: { cLo: -20, cHi: 50, cStep: 10, fStep: 20, mark: c, hide: 'C' } },
    solution: [`First take off the offset: ${fmt(f)} − 32 = ${fmt(f - 32)} °F above freezing.`, `${fr(5, 9)} × ${fmt(f - 32)} = ${S(fmt(c))} °C.`],
  }, c, `Yes: ${fmt(f)} °F = ${fmt(c)} °C.`,
  [{ v: roundTo(f * 5 / 9, 6), mc: MC.proportional, say: `${fr(5, 9)} × ${fmt(f)} skips the offset. Subtract 32 first: 32 °F is 0 °C.` }],
  `Subtract 32, then multiply by ${fr(5, 9)}.`);
};
const tempChange: Gen = (R, n) => {
  const toF = R() < 0.6, c0 = 5 * int(R, -2, 3);
  if (toF) {
    const d = 5 * int(R, 1, 3), ans = d * 9 / 5;   // a morning warms by 5-15 °C
    return numItem({
      id: `tempChange-${n}`, family: 'tempChange', prompt: `At dawn it was ${fmt(c0)} °C. By noon the temperature had risen by ${A(d + ' °C')}. By how many °F did it rise?`,
      board: `\\Delta F = \\tfrac{9}{5}\\,\\Delta C`, unit: '°F',
      picture: { thermo: { cLo: -20, cHi: 50, cStep: 10, fStep: 20, rise: [c0, c0 + d], hide: 'F' } },
      solution: [`A rise is a stretch of the tube, the same on both scales: no + 32, because both ends of the rise carry the same offset.`, `${fr(9, 5)} × ${d} = ${S(fmt(ans))} °F.`],
    }, ans, `Yes: a rise of ${d} °C is a rise of ${fmt(ans)} °F.`,
    [{ v: ans + 32, mc: MC.offset, say: `+ 32 is for READINGS. A rise has the offset at both ends, so it cancels: only × ${fr(9, 5)}.` },
      { v: d, say: `A Fahrenheit degree is smaller, so the same rise is more °F: × ${fr(9, 5)}.` }],
    `A change only scales: × ${fr(9, 5)}.`);
  }
  const w0 = 5 * int(R, 2, 4), df = 9 * int(R, 1, 6), ans = df * 5 / 9;   // tap water at 50-68 °F, warmed by 9-54 °F
  return numItem({
    id: `tempChange-${n}`, family: 'tempChange', prompt: `A pot of water at ${fmt(cToF(w0))} °F warmed by ${A(df + ' °F')}. By how many °C did it warm?`,
    board: `\\Delta C = \\tfrac{5}{9}\\,\\Delta F`, unit: '°C',
    picture: { thermo: { cLo: -20, cHi: 50, cStep: 10, fStep: 20, rise: [w0, w0 + ans], hide: 'C' } },
    solution: [`A change has no offset: only the size of the degree changes.`, `${fr(5, 9)} × ${df} = ${S(fmt(ans))} °C.`],
  }, ans, `Yes: ${df} °F of warming is ${fmt(ans)} °C.`,
  [{ v: roundTo((df - 32) * 5 / 9, 6), mc: MC.offset, say: `− 32 is for READINGS. A change is a difference, so the offset cancels: only × ${fr(5, 9)}.` }],
  `A change only scales: × ${fr(5, 9)}.`);
};

// =====================================================================================================
// 16. multistep-unit-planning
// =====================================================================================================
const tripCost: Gen = (R, n) => {
  const m = pick(R, [20, 24, 25, 30, 32, 40]), k = int(R, 4, 15), D = m * k, p = pick(R, [3.2, 3.4, 3.5, 3.6, 3.8, 4]), ans = roundTo(k * p, 2);
  return numItem({
    id: `tripCost-${n}`, family: 'tripCost', prompt: `A ${A(D + ' mi')} trip in a car that gets ${B(m + ' mi/gal')}, with gas at ${A(money(p) + '/gal')}. What does the gas cost? (Estimate first.)`,
    board: `${qT(D, 'mi')} \\times \\dfrac{?}{?} \\times \\dfrac{?}{?} = \\$\\,?`, unit: 'dollars',
    picture: { chain: { start: { n: D, u: 'mi' }, factors: [{ n: 1, u: 'gal', bn: m, bu: 'mi', hide: true }, { n: fmt(p, 2), u: '$', bn: 1, bu: 'gal', hide: true }], result: { n: fmt(ans, 2), u: '$', hide: true } } },
    solution: [`Plan with units: mi → gal with ${facH(1, 'gal', m, 'mi')}, then gal → $ with ${facH(money(p), '', 1, 'gal')}.`, `${D} ÷ ${m} = ${k} gal; ${k} × ${money(p)} = ${S(money(ans))}. Estimate: about ${k} × $${Math.round(p)} ≈ $${k * Math.round(p)}. ✓`],
  }, ans, `Yes: ${k} gal × ${money(p)} = ${money(ans)}.`,
  [{ v: roundTo(D * m * p, 2), mc: MC.flip, say: `Multiplying by ${m} mi/gal gives mi²/gal: the miles do not cancel. Use ${m} mi on the bottom: ${D} ÷ ${m}.` },
    { v: roundTo(D * p, 2), say: `That pays per MILE, but the price is per GALLON. Find the gallons first: ${D} ÷ ${m}.` }],
  `Miles → gallons → dollars. Which factor turns miles into gallons?`);
};
const AVG: [number, number][] = [[30, 60], [20, 30], [40, 60], [60, 90], [45, 90], [30, 45], [50, 75], [24, 40], [36, 45]];
const lcm = (a: number, b: number) => { let x = a, y = b; while (y) [x, y] = [y, x % y]; return (a * b) / x; };
const avgSpeed: Gen = (R, n) => {
  const [a, b] = pick(R, AVG), eqDist = R() < 0.65;
  if (eqDist) {
    const D = lcm(a, b), t1 = D / a, t2 = D / b, ans = (2 * D) / (t1 + t2);
    return numItem({
      id: `avgSpeed-${n}`, family: 'avgSpeed', prompt: `Ana drives ${A(D + ' mi')} at ${B(a + ' mi/h')}, then the same ${D} mi back at ${B(b + ' mi/h')}. What is her average speed for the round trip?`,
      board: `\\text{average speed} = \\dfrac{\\text{total distance}}{\\text{total time}}`, unit: 'mi/h',
      solution: [`Times: ${D} ÷ ${a} = ${t1} h and ${D} ÷ ${b} = ${t2} h, so ${t1 + t2} h in all for ${2 * D} mi.`, `${2 * D} mi ÷ ${t1 + t2} h = ${S(fmt(ans))} mi/h. (Less than ${(a + b) / 2}: she spends more time at the slow speed.)`],
    }, ans, `Yes: ${2 * D} mi in ${t1 + t2} h is ${fmt(ans)} mi/h.`,
    [{ v: (a + b) / 2, mc: MC.unweighted, say: `${(a + b) / 2} averages the two speeds as if each lasted the same TIME. She spends ${t1} h at ${a} but only ${t2} h at ${b}: total distance ÷ total time.` }],
    `Total distance ÷ total time. Find each leg's time first.`);
  }
  const t = int(R, 1, 3), ans = (a + b) / 2;
  return numItem({
    id: `avgSpeed-${n}`, family: 'avgSpeed', prompt: `Ben drives ${B(t + ' h')} at ${A(a + ' mi/h')}, then another ${t} h at ${A(b + ' mi/h')}. What is his average speed?`,
    board: `\\text{average speed} = \\dfrac{\\text{total distance}}{\\text{total time}}`, unit: 'mi/h',
    solution: [`Distances: ${a * t} mi and ${b * t} mi, so ${(a + b) * t} mi in ${2 * t} h.`, `${(a + b) * t} ÷ ${2 * t} = ${S(fmt(ans))} mi/h. (Equal TIMES, so the plain average works here.)`],
  }, ans, `Yes: ${(a + b) * t} mi in ${2 * t} h is ${fmt(ans)} mi/h.`,
  [{ v: (2 * a * b) / (a + b), say: `That would be right for equal DISTANCES. Here the times are equal: ${(a + b) * t} mi ÷ ${2 * t} h.` }],
  `Total distance ÷ total time.`);
};
const formulaUnits: Gen = (R, n) => {
  if (R() < 0.55) {
    // the actor fits the speed: a rowing shell 4-8 mi/h, a cyclist 12-18 mi/h, a city bus 24-36 mi/h
    const [who, rs, ts] = pick(R, [['A rower', [4, 6, 8], [15, 30, 45]], ['A cyclist', [12, 15, 18], [10, 20, 30, 40, 45, 50]], ['A city bus', [24, 30, 36], [10, 20, 30, 40, 45, 50]]] as [string, number[], number[]][]);
    const r = pick(R, rs), t = pick(R, ts), ans = roundTo(r * t / 60, 4);
    return numItem({
      id: `formulaUnits-${n}`, family: 'formulaUnits', prompt: `Use d = rt. ${who} keeps ${A(r + ' mi/h')} for ${B(t + ' min')}. How far is that?`,
      board: `d = rt,\\quad r = ${qT(r, 'mi/h')},\\ t = ${qT(t, 'min')}`, unit: 'mi',
      solution: [`r is per HOUR, so t must be in hours: ${t} min = ${fr(t, 60)} h = ${fmt(roundTo(t / 60, 4))} h.`, `d = ${r} × ${fmt(roundTo(t / 60, 4))} = ${S(fmt(ans))} mi.`],
    }, ans, `Yes: d = ${fmt(ans)} mi.`, [{ v: r * t, mc: MC.unconverted, say: `${r} × ${t} puts minutes into a rate per hour: ${r * t} mi is far too far. Change ${t} min to hours first.` }],
    `Write ${t} min in hours before you substitute.`, 1e-3);
  }
  const p = pick(R, [3.2, 4.8, 6.4, 8, 9.6]), w = pick(R, [4, 6, 8, 10, 12, 20]), ans = roundTo((p * w) / 16, 2);
  return numItem({
    id: `formulaUnits-${n}`, family: 'formulaUnits', prompt: `Use cost = price × weight. Cheese is ${A(money(p) + ' per lb')}; you buy ${B(w + ' oz')}. What does it cost?`,
    board: `\\text{cost} = (${moneyT(p)}/\\text{lb}) \\times ${qT(w, 'oz')}`, unit: 'dollars',
    solution: [`The price is per POUND, so change ${w} oz to pounds: ${w} ÷ 16 = ${fmt(w / 16)} lb.`, `${money(p)} × ${fmt(w / 16)} = ${S(money(ans))}.`],
  }, ans, `Yes: ${money(ans)}.`, [{ v: roundTo(p * w, 2), mc: MC.unconverted, say: `${money(p)} × ${w} prices ounces at the pound price. Change ${w} oz to ${fmt(w / 16)} lb first.` }],
  `Ounces must become pounds before you multiply.`);
};

// =====================================================================================================
// 17-18. range-through-exact-scaling, justified-reporting-precision
// =====================================================================================================
interface Scl { L: number; res: number; unit: string; by: number; div: boolean; to: string; ctx: string; byT: string }
function scaling(R: () => number): Scl {
  const kind = int(R, 0, 2);
  if (kind === 0) { const nP = pick(R, [2, 4, 5, 8]), L = roundTo(int(R, 60, 160) / 10, 1); return { L, res: 0.1, unit: 'ft', by: nP, div: true, to: 'ft', ctx: `A rope measured as ${A(fmt(L, 1) + ' ft')} (to the nearest 0.1 ft) is cut into ${B(nP)} equal pieces.`, byT: `\\div ${nP}` }; }
  if (kind === 1) { const L = roundTo(int(R, 40, 120) / 10, 1); return { L, res: 0.1, unit: 'in', by: 2.54, div: false, to: 'cm', ctx: `A phone is measured as ${A(fmt(L, 1) + ' in')} long (to the nearest 0.1 in). 1 in = 2.54 cm exactly.`, byT: '\\times 2.54' }; }
  const L = roundTo(int(R, 20, 90) / 10, 1);
  return { L, res: 0.1, unit: 'ft', by: 12, div: false, to: 'in', ctx: `A shelf is measured as ${A(fmt(L, 1) + ' ft')} (to the nearest 0.1 ft). 1 ft = 12 in exactly.`, byT: '\\times 12' };
}
const apply = (s: Scl, x: number) => roundTo(s.div ? x / s.by : x * s.by, 8);
const scRuler = (s: Scl, withScaled: boolean): RulerPic => ({ lo: s.L - 0.2, hi: s.L + 0.2, minor: 0.01, major: 0.1, v: s.L, res: s.res, unit: s.unit, dp: 2,
  scaled: withScaled ? { lo: apply(s, s.L - 0.05), hi: apply(s, s.L + 0.05), unit: s.to, by: s.byT, dp: 5 } : undefined });
const scaleRange: Gen = (R, n) => {
  const s = scaling(R), lowSide = R() < 0.5, b = lowSide ? s.L - 0.05 : s.L + 0.05, ans = apply(s, b);
  const what = s.div ? `${lowSide ? 'shortest' : 'longest'} one piece could be` : `${lowSide ? 'smallest' : 'largest'} the length in ${s.to} could be`;
  return numItem({
    id: `scaleRange-${n}`, family: 'scaleRange', prompt: `${s.ctx} What is the ${what}?`,
    board: `(${fmtT(s.L, 1)} ${lowSide ? '-' : '+'} 0.05)\\ ${s.byT}`, unit: s.to,
    picture: { ruler: scRuler(s, true) },
    solution: [`The true length is from ${fmt(s.L - 0.05, 2)} up to ${fmt(s.L + 0.05, 2)} ${s.unit}. The factor ${s.div ? `(${s.by} pieces)` : `(${s.by})`} is exact, so it scales both ends.`, `${fmt(b, 2)} ${s.div ? '÷' : '×'} ${s.by} = ${S(fmt(ans))} ${s.to}.`],
  }, ans, `Yes: ${fmt(b, 2)} ${s.div ? '÷' : '×'} ${s.by} = ${fmt(ans)} ${s.to}.`,
  [{ v: apply(s, s.L), mc: MC.asExact, say: `That scales the recorded ${fmt(s.L, 1)} as if it were exact. The true length can be 0.05 ${s.unit} ${lowSide ? 'less' : 'more'}: scale that end.` },
    { v: apply(s, lowSide ? s.L - 0.1 : s.L + 0.1), mc: MC.whole, say: `The bound is HALF of 0.1 away: ${fmt(b, 2)}, not ${fmt(lowSide ? s.L - 0.1 : s.L + 0.1, 1)}.` },
    { v: b, say: `${fmt(b, 2)} is the bound of the measurement; now ${s.div ? `divide by ${s.by}` : `multiply by ${s.by}`}.` }],
  `Find the ${lowSide ? 'lower' : 'upper'} bound of the measurement, then scale it.`, 4e-4);
};
const rangePair: Gen = (R, n) => {
  const s = scaling(R), lo = apply(s, s.L - 0.05), hi = apply(s, s.L + 0.05);
  const close = (a: number, b: number) => Math.abs(a - b) <= 4e-4 * Math.max(1, Math.abs(b));
  return {
    id: `rangePair-${n}`, family: 'rangePair', prompt: `${s.ctx} Between which two values is the ${s.div ? 'length of one piece' : `length in ${s.to}`}?`,
    board: `(${fmtT(s.L, 1)} \\pm 0.05)\\ ${s.byT}`,
    input: 'pair', pairLead: 'from', pairOp: 'up to', pairTail: s.to,
    picture: { ruler: scRuler(s, true) },
    solution: [`True length: ${fmt(s.L - 0.05, 2)} up to ${fmt(s.L + 0.05, 2)} ${s.unit}. Scale both ends by the exact ${s.div ? `÷ ${s.by}` : `× ${s.by}`}.`, `From ${S(fmt(lo))} up to ${S(fmt(hi))} ${s.to}.`],
    answer: { kind: 'pair', x: lo, y: hi },
    check: (q: Response): Verdict => {
      if (q.kind !== 'pair') return { ok: false, say: 'Type both ends.' };
      if (close(q.x, lo) && close(q.y, hi)) return { ok: true, say: `Yes: ${fmt(lo)} up to ${fmt(hi)} ${s.to}.` };
      if (close(q.x, apply(s, s.L)) || close(q.y, apply(s, s.L))) return { ok: false, mc: MC.asExact, say: `${fmt(apply(s, s.L))} scales the recorded value. Scale the two ENDS: ${fmt(s.L - 0.05, 2)} and ${fmt(s.L + 0.05, 2)}.` };
      if (close(q.x, apply(s, s.L - 0.1)) && close(q.y, apply(s, s.L + 0.1))) return { ok: false, mc: MC.whole, say: `The ends are half of 0.1 away: ${fmt(s.L - 0.05, 2)} and ${fmt(s.L + 0.05, 2)}.` };
      return { ok: false, say: `Ends of the measurement: ${fmt(s.L - 0.05, 2)} and ${fmt(s.L + 0.05, 2)}. ${s.div ? `Divide each by ${s.by}` : `Multiply each by ${s.by}`}.` };
    },
  };
};
const reportPick: Gen = (R, n) => {
  for (;;) {
    const s = scaling(R), lo = apply(s, s.L - 0.05), hi = apply(s, s.L + 0.05), mid = apply(s, s.L), k = agreePlace(lo, hi);
    if (k === null || k > 1) continue;
    const right = report(mid, k), full = fmt(mid), fine = report(mid, k - 1), finer = report(mid, k - 2);
    const over = fine === full ? finer : fine;
    if (new Set([right, full, over]).size < 3 || dpOf(mid) <= dpOf(Number(over.replace(/,/g, '')))) continue;
    return choiceItem(R, {
      id: `reportPick-${n}`, family: 'reportPick', prompt: `${s.ctx} The calculator gives ${A(full + ' ' + s.to)}; the true value is somewhere from ${fmt(lo)} up to ${fmt(hi)} ${s.to}. Which report is justified?`,
      board: `${fmtT(lo)} \\le \\text{true} < ${fmtT(hi)}`,
      solution: [`Report only digits the whole range agrees on: every value from ${fmt(lo)} up to (not including) ${fmt(hi)} rounds to ${right}; at the next place they no longer agree.`, `So report ${S(`${right} ${s.to}`)}.`],
    }, [
      { t: `${right} ${s.to}`, ok: true, say: `Yes: every possible true value rounds to ${right}.` },
      { t: `${full} ${s.to}`, mc: MC.moreDigits, say: `Those are the calculator's digits, but the true value could be anywhere from ${fmt(lo)} to ${fmt(hi)}. Most of these digits are not known.` },
      { t: `${over} ${s.to}`, mc: MC.moreDigits, say: `The ends of the range round to different values at that place: that digit is not known. One place less.` },
    ]);
  }
};
const purposeRound: Gen = (R, n) => {
  for (;;) {
    const g = roundTo(int(R, 80, 159) / 10, 1), p = roundTo(int(R, 319, 459) / 100 - 0.001, 3), exact = roundTo(g * p, 6), ans = roundTo(exact, 2);
    if (Math.abs(exact - ans) < 1e-6 || Math.abs(roundTo(exact, 1) - ans) < 1e-9) continue;
    return numItem({
      id: `purposeRound-${n}`, family: 'purposeRound', prompt: `The pump shows ${A(fmt(g, 1) + ' gal')} at ${A('$' + fmt(p, 3) + '/gal')}. What do you pay? (Money is paid to the cent.)`,
      board: `${fmtT(g, 1)} \\times \\$${fmtT(p, 3)} = \\$${fmtT(exact)}`, unit: 'dollars',
      solution: [`${fmt(g, 1)} × $${fmt(p, 3)} = $${fmt(exact)}: keep every digit until the end.`, `Money is paid in cents: round to hundredths, ${S(money(ans))}.`],
    }, ans, `Yes: $${fmt(exact)} rounds to ${money(ans)}.`,
    [{ v: exact, mc: MC.moreDigits, say: `Nobody pays a fraction of a cent. The purpose (paying) sets the precision: round to the cent.` },
      { v: roundTo(exact, 1), mc: MC.roundPlace, say: `That rounds to dimes. Money is paid to the CENT: two decimals.` },
      { v: Math.round(exact), mc: MC.roundPlace, say: `That rounds to whole dollars. The pump charges to the cent.` },
      { v: Math.floor(exact * 100) / 100, say: `Round, don't cut off: look at the third decimal.` }],
    `Multiply, then round to the cent.`);
  }
};

// =====================================================================================================
// 19. model-scale-powers
// =====================================================================================================
const mapArea: Gen = (R, n) => {
  const kind = int(R, 0, 2);
  if (kind === 0) {
    const k = pick(R, [2, 3, 4, 5, 10]), a = pick(R, [2, 3, 4, 5, 6, 1.5, 2.5]), ans = roundTo(a * k * k, 4);
    return numItem({
      id: `mapArea-${n}`, family: 'mapArea', prompt: `A map's scale is ${A(`1 in : ${k} mi`)}. A park covers ${B(fmt(a) + ' in²')} on the map. What is its real area?`,
      board: `1\\,\\text{in} : ${k}\\,\\text{mi},\\quad ${fmtT(a)}\\,\\text{in}^2 \\to \\,?\\,\\text{mi}^2`, unit: 'mi²',
      solution: [`Each map inch is ${k} mi in BOTH directions, so 1 in² on the map is ${k} × ${k} = ${k * k} mi².`, `${fmt(a)} × ${k * k} = ${S(fmt(ans))} mi².`],
    }, ans, `Yes: ${fmt(ans)} mi².`, [{ v: roundTo(a * k, 4), mc: MC.linear, say: `× ${k} scales one direction only. An area scales in two: × ${k} × ${k} = × ${k * k}.` }],
    `How many mi² does 1 in² on the map stand for?`);
  }
  const k = pick(R, [12, 18, 24, 32]), vol = kind === 2, ans = vol ? k ** 3 : k ** 2;
  return numItem({
    id: `mapArea-${n}`, family: 'mapArea', prompt: `A ${A('1 : ' + k)} model car is built exactly to scale. The real car needs how many times as much ${vol ? 'space inside (volume)' : 'paint (surface area)'} as the model?`,
    board: `\\text{length} \\times ${k}\\ \\Rightarrow\\ ${vol ? '\\text{volume}' : '\\text{area}'} \\times \\,?`, unit: 'times',
    solution: [`Every length is ${k} times as long. ${vol ? 'A volume has three lengths' : 'An area has two lengths'}.`, `${Array(vol ? 3 : 2).fill(k).join(' × ')} = ${S(fmt(ans))} times.`],
  }, ans, `Yes: ${fmt(ans)} times.`,
  [{ v: k, mc: MC.linear, say: `${k} is the factor for lengths. ${vol ? 'Volume' : 'Area'} multiplies ${vol ? 'three' : 'two'} lengths: ${Array(vol ? 3 : 2).fill(k).join(' × ')}.` },
    ...(vol ? [{ v: k * k, mc: MC.linear, say: `${k * k} is the AREA factor. Volume needs one more × ${k}.` }] : [])],
  `Count the lengths that multiply.`);
};

// =====================================================================================================
// 20-21. dimension checks
// =====================================================================================================
const BAD: { f: string; why: string }[] = [
  { f: 'd = v + t', why: 'v + t adds a speed (mi/h) to a time (h)' },
  { f: 'P = l·w', why: 'l·w is ft², but a perimeter is a length in ft' },
  { f: 'A = 2l + 2w', why: '2l + 2w is ft, but an area is in ft²' },
  { f: 'V = l·w + h', why: 'l·w + h adds ft² to ft' },
  { f: 'cost = price + gallons', why: 'price ($/gal) + gallons adds two different kinds of quantity' },
];
const GOOD = ['d = v·t', 'A = l·w', 'P = 2l + 2w', 'V = l·w·h', 't = d / v', 'cost = price·gallons'];
const dimCheck: Gen = (R, n) => {
  const bad = pick(R, BAD), goods = shuffle(R, GOOD.filter(g => g.split(' = ')[0] !== bad.f.split(' = ')[0])).slice(0, 2);
  const tex = (s: string) => s.replace(/·/g, '\\cdot ').replace('cost', '\\text{cost}').replace('price', '\\text{price}').replace('gallons', '\\text{gallons}');
  return choiceItem(R, {
    id: `dimCheck-${n}`, family: 'dimCheck', prompt: `l, w, h are lengths (ft), v a speed (mi/h), t a time (h), d a distance (mi), price in $/gal. Which formula cannot be right, just from its units?`,
    board: [bad.f, ...goods].sort().map(tex).join('\\qquad '),
    solution: [`Check each side: you can only add quantities of the same kind, and both sides must be the same kind.`, `In ${bad.f}, ${bad.why}. So: ${S(bad.f)}.`],
  }, [
    { t: bad.f, ok: true, say: `Yes: ${bad.why}.` },
    ...goods.map(g => ({ t: g, say: `${g} checks out: both sides are the same kind of quantity. Look for a sum of two different kinds.` })),
  ]);
};
const repair: Gen = (R, n) => {
  const r = pick(R, [12, 24, 30, 36, 45, 60]), t = pick(R, [10, 20, 30, 40, 50]), wrong = r * t, right = roundTo(r * t / 60, 4);
  return choiceItem(R, {
    id: `repair-${n}`, family: 'repair', prompt: `Kai used d = rt with r = ${A(r + ' mi/h')} and t = ${B(t + ' min')} and got ${fmt(wrong)} mi. How should he repair it?`,
    board: `d = ${qT(r, 'mi/h')} \\times ${qT(t, 'min')} = ${fmtT(wrong)}\\ ?`,
    solution: [`mi/h × min does not cancel: the time must be in hours.`, `${t} min = ${fr(t, 60)} h, so d = ${r} × ${fr(t, 60)} = ${fmt(right)} mi. So: ${S(`Change ${t} min to hours first: d = ${fmt(right)} mi`)}.`],
  }, [
    { t: `Change ${t} min to hours first: d = ${fmt(right)} mi`, ok: true, say: `Yes: then hours cancel hours, and miles are left.` },
    { t: `Keep ${fmt(wrong)} and write the unit as mi·min/h`, mc: MC.labelRepair, say: `A label does not repair it: mi·min/h is not a distance in miles. Convert the minutes.` },
    { t: `Nothing: the number is right, only the unit is off`, mc: MC.decor, say: `The units decide the number: ${fmt(wrong)} mi is ${60}× too far.` },
  ]);
};
const MIX_SAME: [string, string, string][] = [['ft', 'in', 'length'], ['h', 'min', 'time'], ['lb', 'oz', 'weight'], ['km', 'm', 'length'], ['gal', 'qt', 'volume']];
const MIX_DIFF: [string, string][] = [['ft', 's'], ['lb', 'ft'], ['gal', 'h'], ['mi', 'lb'], ['min', 'in']];
const mismatchKind: Gen = (R, n) => {
  const same = R() < 0.5, a = int(R, 2, 9), b = int(R, 2, 11);
  const [u1, u2] = same ? pick(R, MIX_SAME) : pick(R, MIX_DIFF);
  const UNIT = 'Unit mismatch: same kind of quantity, convert one, then add', DIM = 'Dimension mismatch: different kinds of quantity, the sum means nothing', NONE = 'No problem: just add the numbers';
  return choiceItem(R, {
    id: `mismatchKind-${n}`, family: 'mismatchKind', prompt: `What is wrong with ${A(`${a} ${u1} + ${b} ${u2}`)}?`,
    board: `${qT(a, u1)} + ${qT(b, u2)}`,
    solution: [`Ask first: same kind of quantity? ${u1} and ${u2} ${same ? 'both measure ' + (MIX_SAME.find(m => m[0] === u1)![2]) : 'measure different things'}.`, `So: ${S(same ? UNIT : DIM)}.`],
  }, [
    { t: UNIT, ok: same, mc: same ? undefined : MC.decor, say: same ? `Yes: ${u1} and ${u2} measure the same thing; convert, then add.` : `No unit factor turns ${u1} into ${u2}: they measure different things.` },
    { t: DIM, ok: !same, mc: same ? MC.labelsDim : undefined, say: same ? `Different labels, same dimension: ${u1} and ${u2} both measure ${MIX_SAME.find(m => m[0] === u1)![2]}. Convert and add.` : `Yes: ${u1} and ${u2} are different dimensions; no conversion fixes that.` },
    { t: NONE, mc: same ? MC.addMixed : MC.decor, say: same ? `${a} + ${b} adds ${u1} to ${u2}: convert first.` : `${a} ${u1} and ${b} ${u2} measure different things: the sum means nothing.` },
  ]);
};
const consistentWrong: Gen = (R, n) => {
  const kind = int(R, 0, 2), l = int(R, 3, 9), w = int(R, 2, 8);
  if (l === w) return consistentWrong(R, n);
  const UT = ['\\text{ft}\\times\\text{ft} = \\text{ft}^2', '\\text{ft} + \\text{ft} = \\text{ft}', '\\tfrac{\\text{mi}}{\\text{h}}\\times\\text{h} = \\text{mi}'][kind]!;
  const T = kind === 0 ? { f: 'A = 2lw', units: 'ft × ft = ft²', test: `a ${l} ft by ${w} ft rectangle`, gives: `${2 * l * w} ft²`, truth: `${l * w} ft² (count the squares)` }
    : kind === 1 ? { f: 'P = l + w', units: 'ft + ft = ft', test: `a ${l} ft by ${w} ft rectangle`, gives: `${l + w} ft`, truth: `${2 * (l + w)} ft (four sides)` }
      : { f: 'd = rt/2', units: 'mi/h × h = mi', test: `${l * 10} mi/h for ${w} h`, gives: `${l * 5 * w} mi`, truth: `${l * 10 * w} mi (${l * 10} mi in each of ${w} hours)` };
  return choiceItem(R, {
    id: `consistentWrong-${n}`, family: 'consistentWrong', prompt: `Sam claims ${A(T.f)}. "The units work: ${T.units}, so it must be right." Is he right? Test it on ${T.test}.`,
    board: `${T.f.replace('rt/2', '\\tfrac{rt}{2}')}\\qquad ${UT}`,
    solution: [`Units can catch a wrong formula, but matching units do not prove it: a number like 2 or ½ has no unit.`, `On ${T.test} it gives ${T.gives}, but the truth is ${T.truth}. So: ${S(`No: it gives ${T.gives}, but the truth is ${T.truth}`)}.`],
  }, [
    { t: `No: it gives ${T.gives}, but the truth is ${T.truth}`, ok: true, say: `Yes: one counterexample is enough. Units are a check, not a proof.` },
    { t: `Yes: the units check out, so it is right`, mc: MC.superficial, say: `Matching units are necessary, not enough: a factor like 2 has no unit. The test case gives ${T.gives}, not ${T.truth.split(' (')[0]}.` },
    { t: `No: its units do not work`, say: `The units do work (${T.units}). It fails on the numbers: test it.` },
  ]);
};

// =====================================================================================================
// 22. false-precision-critique
// =====================================================================================================
const critique: Gen = (R, n) => {
  const kind = int(R, 0, 2);
  if (kind === 0) {
    const m = pick(R, [3, 5, 10, 20, 25, 50, 100]), km = m * 1.609344, fair = Math.round(km);
    return choiceItem(R, {
      id: `critique-${n}`, family: 'critique', prompt: `A trail sign says: "about ${m} miles (${fmt(km)} km)". What is a fair metric version?`,
      board: `\\text{about } ${m}\\,\\text{mi} \\times 1.609344`,
      solution: [`"About ${m} miles" is rounded: the km value can't be more precise than that.`, `A fair version: ${S(`about ${fmt(fair)} km`)}.`],
    }, [
      { t: `about ${fmt(fair)} km`, ok: true, say: `Yes: as rough as the miles it came from.` },
      { t: `${fmt(km)} km`, mc: MC.moreDigits, say: `The factor is exact, but "about ${m} miles" is not. Those digits claim a precision nobody measured.` },
      { t: `${fmt(roundTo(km, 2))} km`, mc: MC.decLen, say: `Still far more precise than "about ${m} miles". Round to match the original.` },
    ]);
  }
  if (kind === 1) {
    for (;;) {
      const L = roundTo(int(R, 40, 140) / 10, 1), lo = (L - 0.05) * 2.54, hi = (L + 0.05) * 2.54, mid = L * 2.54, k = agreePlace(lo, hi);
      if (k === null) continue;
      const right = report(mid, k), full = fmt(roundTo(mid, 4)), over = report(mid, k - 1);
      if (new Set([right, full, over]).size < 3) continue;
      return choiceItem(R, {
        id: `critique-${n}`, family: 'critique', prompt: `A report says a part measured ${A(fmt(L, 1) + ' in')} (to the nearest 0.1 in) is "${full} cm long". The true length is between ${fmt(roundTo(lo, 4))} and ${fmt(roundTo(hi, 4))} cm. What should it say?`,
        board: `${fmtT(L, 1)} \\times 2.54 = ${fmtT(roundTo(mid, 4))}`,
        solution: [`Every value from ${fmt(roundTo(lo, 4))} up to (not including) ${fmt(roundTo(hi, 4))} cm rounds to ${right} cm; at the next place they no longer agree.`, `It should say ${S(`${right} cm`)}.`],
      }, [
        { t: `${right} cm`, ok: true, say: `Yes: every possible true length rounds to ${right} cm.` },
        { t: `${full} cm`, mc: MC.moreDigits, say: `Calculator digits. The true length could be anywhere from ${fmt(roundTo(lo, 3))} to ${fmt(roundTo(hi, 3))} cm.` },
        { t: `${over} cm`, mc: MC.precAcc, say: `The two ends of the range disagree at that digit, so it is not known.` },
      ]);
    }
  }
  const h = int(R, 300, 1500) + int(R, 1, 99) / 100;
  return choiceItem(R, {
    id: `critique-${n}`, family: 'critique', prompt: `A post says a tower is ${A(fmt(h, 2) + ' ft')} tall. It gives no source and no way it was measured. What precision is justified?`,
    board: `${fmtT(h, 2)}\\,\\text{ft}\\ ?`,
    solution: [`Precision has to come from how a value was measured. With no source, we cannot tell how good the digits are.`, `So: ${S('Not enough information to choose a precision')}.`],
  }, [
    { t: 'Not enough information to choose a precision', ok: true, say: `Yes: without knowing how it was measured, the digits prove nothing.` },
    { t: `${fmt(h, 2)} ft: that many digits means it was measured carefully`, mc: MC.precAcc, say: `Anyone can type two decimals. Digits are not evidence of accuracy.` },
    { t: `Round to ${fmt(Math.round(h / 10) * 10)} ft`, say: `Why tens? Without a source there is no basis for any particular precision.` },
  ]);
};
const exactMean: Gen = (R, n) => {
  const hh = pick(R, [3, 6, 7, 9]), c = (() => { let x; do x = int(R, hh + 1, hh * 5); while (x % hh === 0 || (hh === 6 && x % 3 === 0) || (hh === 9 && x % 3 === 0)); return x; })();
  const q = qn(c, hh), dec = fmt(roundTo(c / hh, 2), 2);
  return choiceItem(R, {
    id: `exactMean-${n}`, family: 'exactMean', prompt: `${A(c + ' children')} live in ${B(hh + ' households')}. A report gives the mean as ${A(mixedH(q))} children per household. Someone calls that false precision. Are they right?`,
    board: `\\text{mean} = \\dfrac{${c}}{${hh}} = ${mixedT(q)}`,
    solution: [`Counts are exact, so ${c} ÷ ${hh} = ${mixedH(q)} is exact too: no measurement limits it.`, `So: ${S(`No: counts are exact, so ${mixedP(q)} is exact`)}.`],
  }, [
    { t: `No: counts are exact, so ${mixedP(q)} is exact`, ok: true, say: `Yes: a mean of exact counts is exact. It is not false precision.` },
    { t: `Yes: round to ${Math.round(c / hh)} children, since you can't have part of a child`, mc: MC.roundCount, say: `A mean is not one household's count. ${mixedH(q)} per household is exact, even though no household has it.` },
    { t: `Yes: write ${dec} instead`, say: `${dec} is a rounding of the exact ${mixedH(q)}: it is LESS exact, not more honest.` },
  ]);
};

// =====================================================================================================
// 23. model-audit
// =====================================================================================================
type Part = 'unit' | 'ticks' | 'start' | 'report';
const PART_T: Record<Part, string> = { unit: 'The unit work', ticks: 'The time axis tick labels', start: 'Where the distance axis starts', report: 'The reported precision' };
const audit: Gen = (R, n) => {
  const s = pick(R, [2, 3, 4]), t = pick(R, [3, 4, 5, 6]), d = (s * t) / 60;
  const lo = (s * (t - 0.05)) / 60, hi = (s * (t + 0.05)) / 60, k = agreePlace(lo, hi) ?? -2, good = report(d, k);
  const planted = pick(R, ['unit', 'ticks', 'start', 'report'] as Part[]);
  const unitLine = planted === 'unit' ? `d = ${s} mi/h × ${t}.0 min = ${s * t}.0 mi` : `d = ${s} mi/h × ${t}.0 min × ${fr('1 h', '60 min')} = ${fmt(roundTo(d, 4))} mi`;
  const rep = planted === 'report' ? `about ${fmt(roundTo(d, 5), 5)} mi` : `about ${good} mi`;
  const ymax = Math.ceil((d * 1.1) / 0.05) * 0.05, ystep = 0.05, y0 = planted === 'start' ? Math.max(0.05, Math.floor(d / 2 / 0.05) * 0.05) : 0;
  const tickLabels = Array.from({ length: t + 1 }, (_, i) => String(planted === 'ticks' && i >= 2 ? i + 1 : i));
  const ny = Math.round((ymax - y0) / ystep);
  const others = shuffle(R, (['unit', 'ticks', 'start', 'report'] as Part[]).filter(p => p !== planted)).slice(0, 2);
  return choiceItem(R, {
    id: `audit-${n}`, family: 'audit', prompt: `A walk: ${A(s + ' mi/h')} for ${B(t + '.0 min')} (to the nearest 0.1 min). The graph should show it from the start. Unit work: <b>${unitLine}</b>. Report: <b>${rep}</b>. Which part has a planted error?`,
    board: `\\text{audit: units, ticks, start, precision}`,
    picture: { planes: [{ x: { min: 0, max: t, step: 1, name: 'time (min)', labels: tickLabels }, y: { min: roundTo(y0, 2), max: roundTo(ymax, 2), step: ystep, name: 'distance (mi)', labels: Array.from({ length: ny + 1 }, (_, i) => (i % 2 === 0 ? fmt(roundTo(y0 + i * ystep, 2)) : '')) }, line: [[0, 0], [t, d]] }] },
    solution: [`Units: min must cancel min. Ticks: 1 min apart. Start: 0 mi, where the walk begins.`, `Precision: the true distance is ${fmt(roundTo(lo, 4))} to ${fmt(roundTo(hi, 4))} mi, so report ${good} mi.`, `The planted error: ${S(PART_T[planted])}.`],
  }, [
    { t: PART_T[planted], ok: true, say: planted === 'unit' ? `Yes: mi/h × min doesn't cancel. With 1 h / 60 min: ${fmt(roundTo(d, 4))} mi.` : planted === 'ticks' ? `Yes: the ticks skip a minute, so equal spaces are not equal times.` : planted === 'start' ? `Yes: the walk starts at 0 mi at 0 min; the graph must show that point.` : `Yes: the range only supports ${good} mi.` },
    ...others.map(p => ({ t: PART_T[p], say: `Check it again: ${p === 'unit' ? 'the units cancel properly' : p === 'ticks' ? 'the ticks go up by 1 min each' : p === 'start' ? 'the distance axis starts at 0' : `${good} mi is what the range supports`}. Look at the other parts.` })),
    { t: 'Nothing: it all checks out', mc: MC.looksRight, say: `It looks fine at a glance, but one part fails its check. Go through units, ticks, start and precision one by one.` },
  ]);
};

// =====================================================================================================
export const GENERATORS: Record<FamilyId, Gen> = {
  attribute, sameAmount, pickUnit, compareMixed, deriveUnit, productUnit, readTick, steeper, cropBar, chooseStart, exactOrMeasured,
  whichExact, intervalRead, couldBe, boundsFrac, boundsDec, twoScales, whatDigitsSay, convert, pickFactor, addMixed, unitResult,
  rateTime, rateConvert, fracRate, areaConvert, powerFactor, tempReading, tempChange, tripCost, avgSpeed, formulaUnits, scaleRange,
  rangePair, reportPick, purposeRound, mapArea, dimCheck, repair, mismatchKind, consistentWrong, critique, exactMean, audit,
};
export { near, roundsTo };
