// items.ts: exercise families for "Scale calculations: drawing lengths and actual lengths"
// (primary.ratios.scale-drawing-reality-calculations, grade 7, 7.G.A.1). Every family gets the SUB-GOAL it practises
// (plan.ts) and uses that sub-goal's number ranges from the topic JSON ('cases'). Every wrong answer the classifier
// recognises carries its catalogue id (math-curriculum-essentials/misconceptions.json, checked in the test).
// Pure: no DOM, no canvas. Pictures are ScaleLines params (the page draws them; a miss replays the `solve` steps).
import { type Item, type Response, type Verdict, A, B, S, int, pick, shuffle } from '../../runtime/item';
import type { LinesParams, LineStep } from './ScaleLines';
import { type Scale, type U, factorOf, normalized, fmt, fmtT, isMetric, mixH, mixS, mixT, near, per, r9, ratioN, scale, scaleT, toActual as actualOf } from './scaleCalc';
import { ans as mark, endOnChoice } from '../../runtime/explain';

export type FamilyId = 'table' | 'order' | 'unitless' | 'unitlessCalc' | 'predict' | 'reverse' | 'toActual' | 'toDrawing' | 'rulerRead' | 'fracForm'
  | 'normalize' | 'toUnitless' | 'convertIn' | 'convertOut' | 'findScale' | 'reasonable' | 'diagnoseRev' | 'diagnoseConv' | 'audit'
  | 'whichPair' | 'sameUnitPick' | 'arrowBack' | 'roomCalc' | 'mixedPick' | 'fitPaper' | 'normTable' | 'unitsBack' | 'convertFirst'
  | 'sensibleUnit' | 'pairPick' | 'plausible' | 'fixRev' | 'sizeError' | 'auditFix';
export const FAMILIES: readonly { id: FamilyId; name: string }[] = [
  { id: 'table', name: 'Extend the ratio table' },
  { id: 'order', name: 'Drawing first' },
  { id: 'unitless', name: 'What a scale with no units means' },
  { id: 'unitlessCalc', name: 'One unit on both sides' },
  { id: 'predict', name: 'Predict before you calculate' },
  { id: 'reverse', name: 'The step back' },
  { id: 'toActual', name: 'Plan to actual' },
  { id: 'toDrawing', name: 'Actual to plan' },
  { id: 'rulerRead', name: 'Read the ruler, then scale' },
  { id: 'fracForm', name: 'Decimal inches on a ruler' },
  { id: 'normalize', name: 'Make it per one unit' },
  { id: 'toUnitless', name: 'Units to no units' },
  { id: 'convertIn', name: 'Convert the length first' },
  { id: 'convertOut', name: 'A sensible unit for the answer' },
  { id: 'findScale', name: 'Find the scale' },
  { id: 'reasonable', name: 'Is it reasonable?' },
  { id: 'diagnoseRev', name: 'Find the reversed step' },
  { id: 'diagnoseConv', name: 'Find the unit slip' },
  { id: 'audit', name: 'Check the whole solution' },
  { id: 'whichPair', name: 'Which pair fits the scale?' },
  { id: 'sameUnitPick', name: 'The same unit, both sides' },
  { id: 'arrowBack', name: 'The arrow back' },
  { id: 'roomCalc', name: 'A room on the plan' },
  { id: 'mixedPick', name: 'Multiply every part' },
  { id: 'fitPaper', name: 'Will it fit on the paper?' },
  { id: 'normTable', name: 'Per one unit, in the table' },
  { id: 'unitsBack', name: 'No units back to units' },
  { id: 'convertFirst', name: 'Which conversion first?' },
  { id: 'sensibleUnit', name: 'Feet, not inches' },
  { id: 'pairPick', name: 'Which lengths belong together?' },
  { id: 'plausible', name: 'Which answer can be true?' },
  { id: 'fixRev', name: 'Fix the reversed step' },
  { id: 'sizeError', name: 'How far off?' },
  { id: 'auditFix', name: 'Check it, then fix it' },
];
export const FAMILY_NAMES: Record<string, string> = Object.fromEntries(FAMILIES.map(f => [f.id, f.name]));

export const MC = {
  reverse: 'mc.ratio-rate.reverses-scale-ratio-order',
  additive: 'mc.ratio-rate.additive-keep-difference',
  mixedUnitless: 'mc.ratio-rate.assigns-mixed-units-to-unitless-scale',
  sameFactor: 'mc.ratio-rate.same-factor-both-scale-directions',
  wrongOp: 'mc.ratio-rate.scale-factor-wrong-operation',
  divides: 'mc.ratio-rate.divides-by-rate-when-multiplying-needed',
  partByPart: 'mc.fraction-ops.mixed-numbers-multiplied-part-by-part',
  wholeQuot: 'mc.mul-div.forces-whole-number-quotient',
  tenths: 'mc.decimals.fraction-conversion-keeps-only-tenths',
  unplaceable: 'mc.measurement-units.decimal-length-unplaceable-on-fraction-ruler',
  interval: 'mc.measurement-units.misjudges-interval-value',
  nonunit: 'mc.ratio-rate.nonunit-scale-reference-treated-as-one',
  notConverted: 'mc.ratio-rate.mixed-unit-scale-not-converted',
  unconverted: 'mc.measurement-units.arithmetic-on-unconverted-unit-numerals',
  convDir: 'mc.measurement-units.wrong-direction-for-quantity',
  relabel: 'mc.measurement-units.relabels-without-converting',
  base10: 'mc.measurement-units.customary-as-base-ten',
  noncorr: 'mc.ratio-rate.forms-ratios-from-noncorresponding-lengths',
  benchmark: 'mc.estimation.ignores-context-benchmark',
  arithOnly: 'mc.reasoning-language.arithmetic-only-error-repair',
  rule: 'mc.reasoning-language.memorized-rule-as-justification',
  doubleConv: 'mc.measurement-units.double-conversion',
  oneOrder: 'mc.measurement-units.one-valid-order-convert-scale',
  stopsAudit: 'mc.reasoning-language.stops-audit-after-first-repair',
  everyError: 'mc.reasoning-language.assumes-every-example-has-error',
  drawingAsActual: 'mc.ratio-rate.drawing-length-used-as-actual',
  sizeErr: 'mc.measurement-units.cannot-size-conversion-error',
  diffFactor: 'mc.mul-div.factor-reported-as-difference',
} as const;

/** a ScaleLines picture: shown at the start, `solve` steps played on a miss; `quiet` hides a row's tick labels */
export interface LinesPic { p: LinesParams; show: LineStep[]; solve: LineStep[]; quiet?: number }
export interface SCItem extends Item { family: FamilyId; picture?: { lines: LinesPic }; work?: string[] }
type Gen = (R: () => number, n: number, sg?: string) => SCItem;

// ---------- words ----------
const WORD: Record<U, [string, string]> = { in: ['inch', 'inches'], ft: ['foot', 'feet'], yd: ['yard', 'yards'], mm: ['millimeter', 'millimeters'], cm: ['centimeter', 'centimeters'], m: ['meter', 'meters'] };
/** a length as HTML: 2 1/2 in (customary halves / quarters as fractions) */
const len = (v: number, u: U) => `${isMetric(u) ? fmt(v) : mixH(v)} ${u}`;
const PLAN_THINGS = ['wall', 'hallway', 'kitchen', 'deck', 'porch', 'garage', 'patio', 'bedroom wall', 'driveway', 'fence'];
/** parts of a house and yard on a plan (PLAN_THINGS and the longer ones) */
const HOUSE = [...PLAN_THINGS, 'path', 'hedge', 'backyard', 'kitchen counter'];
const MODEL_THINGS = ['fire truck', 'school bus', 'sailboat', 'race car', 'pickup truck', 'locomotive', 'jet', 'tractor'];
/** things a model can be made of, from a dog house to a ship */
const MODELS = [...MODEL_THINGS, 'dog house', 'canoe', 'car', 'go-kart', 'motorcycle', 'shed', 'tree house', 'boat', 'barn', 'bridge', 'tower', 'ship', 'bus', 'train car'];
const BIG = ['bridge', 'barn', 'ship', 'stage', 'tower', 'shed', 'tree house', 'boat', 'dock', 'park bench'];
const GARDEN = ['garden bed', 'soccer field', 'parking lot', 'running track', 'basketball court', 'playground', 'pool', 'skate park', 'planter'];
const FURNITURE = ['couch', 'table', 'bed', 'desk', 'bookshelf', 'rug', 'piano', 'shelf'];
const BUGS = ['ant', 'ladybug', 'bee', 'beetle', 'flea', 'mosquito'];
/** real lengths in meters: a story never makes a 60 cm school bus, a 54 ft piano or a 9 mm flea */
const SIZE: Record<string, [number, number]> = {
  flea: [0.001, 0.005], ant: [0.001, 0.03], mosquito: [0.002, 0.02], bee: [0.003, 0.04], ladybug: [0.002, 0.012], beetle: [0.001, 0.12],
  'bedroom wall': [2, 9], kitchen: [2, 12], 'living room': [3, 15], classroom: [4, 20], basement: [3, 25], gym: [15, 50], warehouse: [10, 200],
  garage: [3, 15], shed: [1.5, 10], deck: [1.5, 25], porch: [1.2, 25], patio: [1.5, 15], hallway: [1, 25], wall: [1, 40],
  'side wall': [2, 40], 'front wall': [3, 40], driveway: [3, 60], fence: [1, 400], hedge: [0.5, 150], garden: [1, 150],
  'garden bed': [0.5, 15], planter: [0.3, 3], path: [1, 300], dock: [2, 150], backyard: [5, 150], playground: [8, 250], pool: [2, 60],
  'skate park': [8, 250], 'parking lot': [10, 400], 'soccer field': [40, 130], 'running track': [50, 500],
  'basketball court': [12, 32], 'garage door': [2, 6], 'kitchen counter': [0.5, 7], counter: [0.5, 7], sofa: [1, 4],
  couch: [1, 4], bathtub: [1.2, 2.2], bed: [1.4, 2.6], bookcase: [0.4, 4], bookshelf: [0.4, 4], desk: [0.6, 2.6], shelf: [0.3, 3],
  table: [0.5, 4], rug: [0.5, 7], piano: [1, 3.2], 'park bench': [1, 3],
  'fire truck': [5, 16], 'school bus': [6, 15], bus: [6, 19], tractor: [1.8, 9], 'pickup truck': [4.3, 7.5], 'race car': [3.5, 6.5],
  jet: [8, 80], locomotive: [8, 35], sailboat: [3, 50], boat: [2, 100], ship: [20, 450], car: [3, 6.5], 'train car': [10, 30],
  'dog house': [0.6, 1.5], canoe: [3, 6], 'go-kart': [1.5, 2.5], motorcycle: [1.8, 2.6],
  bridge: [2, 3000], tower: [5, 900], barn: [6, 70], stage: [3, 40], 'tree house': [1.5, 8],
};
const M_OF: Record<U, number> = { in: 0.0254, ft: 0.3048, yd: 0.9144, mm: 0.001, cm: 0.01, m: 1 };
/** a thing from the list whose real length range holds v u (picked after the numbers); the closest when none does */
export function sized(R: () => number, list: readonly string[], v: number, u: U): string {
  const m = v * M_OF[u], range = (t: string) => SIZE[t] ?? [0, Infinity];
  const fits = list.filter(t => m >= range(t)[0] && m <= range(t)[1]);
  if (fits.length) return pick(R, fits);
  const off = (t: string) => Math.max(range(t)[0] / m, m / range(t)[1]);
  return list.reduce((a, b) => (off(b) < off(a) ? b : a));
}
export const realSize = (t: string): [number, number] | undefined => SIZE[t];
/** a thing whose real size range holds both lengths (a room's length and width) */
function sizedBoth(R: () => number, list: readonly string[], a: number, b: number, u: U): string {
  const ok = list.filter(t => SIZE[t] && [a, b].every(v => v * M_OF[u] >= SIZE[t]![0] && v * M_OF[u] <= SIZE[t]![1]));
  return ok.length ? pick(R, ok) : sized(R, list, Math.max(a, b), u);
}

const r2 = (x: number) => Math.round(x * 1000) / 1000;
/** TeX "= 0.25" when exact to 3 decimals, else "≈ 0.083" (how a student writes a long quotient) */
const eqT = (x: number) => (near(r2(x), x) ? `= ${fmtT(x)}` : `\\approx ${fmtT(r2(x))}`);

// ---------- item builders ----------
interface Wrong { v: number; mc?: string; say: string }
function numItem(o: {
  family: FamilyId; n: number; prompt: string; board: string; unit: string; ans: number; solution: string[];
  wrongs?: Wrong[]; miss: string; ok?: string; pic?: LinesPic; work?: string[];
}): SCItem {
  const wr = (o.wrongs ?? []).filter(w => Number.isFinite(w.v) && !near(w.v, o.ans));
  return {
    id: `${o.family}-${o.n}`, family: o.family, prompt: o.prompt, board: o.board, input: 'num', unit: o.unit,
    answer: { kind: 'num', v: o.ans }, solution: o.solution, work: o.work,
    picture: o.pic ? { lines: o.pic } : undefined,
    check(r: Response): Verdict {
      if (r.kind !== 'num' || !Number.isFinite(r.v)) return { ok: false, say: 'Type a number.' };
      if (near(r.v, o.ans)) return { ok: true, say: o.ok ?? `Right: ${fmt(o.ans)} ${o.unit}.` };
      const w = wr.find(x => near(x.v, r.v));
      return w ? { ok: false, mc: w.mc, say: w.say } : { ok: false, say: o.miss };
    },
  };
}
interface Opt { t: string; ok?: boolean; mc?: string; say: string }
function choiceItem(R: () => number, o: { family: FamilyId; n: number; prompt: string; board: string; opts: Opt[]; solution: string[]; pic?: LinesPic; work?: string[] }): SCItem {
  const opts = shuffle(R, [...o.opts]);
  const right = opts.findIndex(x => x.ok);
  if (right < 0 || opts.filter(x => x.ok).length !== 1) throw new Error(`${o.family}: needs exactly one right choice`);
  return {
    id: `${o.family}-${o.n}`, family: o.family, prompt: o.prompt, board: o.board, input: 'choice', choices: opts.map(x => x.t),
    answer: { kind: 'choice', i: right }, solution: endOnChoice(o.solution, opts[right]!.t), work: o.work, picture: o.pic ? { lines: o.pic } : undefined,
    check(r: Response): Verdict {
      if (r.kind !== 'choice' || !opts[r.i]) return { ok: false, say: 'Pick one.' };
      const x = opts[r.i]!;
      return x.ok ? { ok: true, say: x.say } : { ok: false, mc: x.mc, say: x.say };
    },
  };
}

// ---------- pictures ----------
/** the smallest tick step multiple so the longest mark fits in at most 12 intervals */
function linesFor(rows: { unit: U; step: number }[], marks: number[], o: { sub?: number; frac?: boolean } = {}): { rows: LinesParams['rows']; n: number; sub: number } {
  const pos = Math.max(...marks);
  let m = 1;
  for (const c of [1, 2, 5, 10, 20, 50, 100]) { m = c; if (pos / c <= 12) break; }
  const n = Math.max(3, Math.min(14, Math.ceil(pos / m - 1e-9) + 1));
  return { rows: rows.map(r => ({ unit: r.unit, step: r9(r.step * m) })), n, sub: m === 1 ? (o.sub ?? 1) : 1 };
}
/** drawing row + actual row for a scale; `given` / `ask` on row 0 (drawing) or 1 (actual) */
function pic2(s: Scale, given: { row: 0 | 1; v: number }, ask: { row: 0 | 1; v: number }, o: { sub?: number; quiet?: boolean; ops?: boolean; obj?: string; cap?: string } = {}): LinesPic {
  const steps = [s.d, s.a];
  const L = linesFor([{ unit: s.dU, step: s.d }, { unit: s.aU, step: s.a }], [given.v / steps[given.row]!, ask.v / steps[ask.row]!], o);
  const k = per(s), up = given.row === 1;
  const ops: [string, string] | undefined = o.ops === false ? undefined : k >= 1 ? [`\\times ${fmtT(k)}`, `\\div ${fmtT(k)}`] : [`\\div ${fmtT(r9(1 / k))}`, `\\times ${fmtT(r9(1 / k))}`];
  // customary halves and quarters read as on a ruler (5 1/4), the same way the prompt writes them
  const mk = (m: { row: 0 | 1; v: number }) => ({ ...m, tex: isMetric(m.row === 0 ? s.dU : s.aU) ? undefined : mixT(m.v) });
  given = mk(given); ask = mk(ask);
  const p: LinesParams = { ...L, tag: scaleT(s), ops, given, ask, obj: o.obj ? { name: o.obj, len: given.row === 0 ? given.v : ask.v } : undefined,
    cap: o.cap ?? (s.dU === s.aU ? (ratioN(s) < 1 ? 'drawing' : s.dU === 'in' ? 'model' : 'plan') : 'plan') };
  return { p, show: ['card', 'lines', 'ref', 'given', 'ask'], solve: [up ? 'up' : 'down', 'drop', 'answer', ...(o.obj ? ['obj' as const] : [])], quiet: o.quiet === false ? undefined : ask.row };
}

// ---------- 1 scale-as-ordered-ratio ----------
const UNIT_SCALES: [U, U, number][] = [['in', 'ft', 8], ['cm', 'm', 5], ['in', 'ft', 10], ['in', 'ft', 4], ['cm', 'm', 2], ['in', 'ft', 6]];
const table: Gen = (R, n) => {
  const [dU, aU, k] = pick(R, UNIT_SCALES), s = scale(1, dU, k, aU);
  const d = int(R, 3, 10), y = d * k, words = R() < 0.3;
  const intro = words ? `On this plan, ${B(`${k} ${WORD[aU][1]}`)} are shown as ${A(`1 ${WORD[dU][0]}`)}.` : `A plan uses the scale ${A(`1 ${dU}`)} : ${B(`${k} ${aU}`)}.`;
  return numItem({
    family: 'table', n, unit: aU, ans: y,
    prompt: `${intro} In its ratio table, 1 ${dU} goes with ${k} ${aU} and 2 ${dU} with ${2 * k} ${aU}. A ${sized(R, HOUSE, y, aU)} is ${A(`${d} ${dU}`)} on the plan. How long is it actually?`,
    board: `\\begin{array}{c|c} \\text{${dU}} & \\text{${aU}} \\\\ \\hline 1 & ${k} \\\\ 2 & ${2 * k} \\\\ ${d} & ? \\end{array}`,
    solution: [`Every ${dU} on the plan stands for ${k} ${aU}: the table multiplies by ${k} going across.`, `${d} × ${k} = ${y}, so the actual length is ${y} ${aU}.`],
    work: [`${d} \\times ${k} = ${y}\\text{ ${aU}}`],
    wrongs: [
      { v: d + k - 1, mc: MC.additive, say: `That keeps the difference (${k} − 1 = ${k - 1}). A scale multiplies: 2 ${dU} is ${2 * k} ${aU}, not ${k + 1}.` },
      { v: r9(d / k), mc: MC.reverse, say: `That divides. The plan is the small one: each ${dU} stands for ${k} ${aU}, so multiply.` },
    ],
    miss: `Go across the table: × ${k}. ${d} × ${k} = ?`,
    pic: pic2(s, { row: 0, v: d }, { row: 1, v: y }),
  });
};
const order: Gen = (R, n) => {
  const [dU, aU] = pick(R, [['in', 'ft'], ['cm', 'm'], ['in', 'yd']] as [U, U][]);
  const k = pick(R, [4, 5, 8, 10, 12, 20]);
  const style = int(R, 0, 2);
  const prompt = style === 0 ? `On a plan, ${B(`${k} ${WORD[aU][1]}`)} are shown as ${A(`1 ${WORD[dU][0]}`)}. Which is the scale, written drawing : actual?`
    : style === 1 ? `A designer says: “Each ${A(`1 ${WORD[dU][0]}`)} on my plan is ${B(`${k} ${WORD[aU][1]}`)} of the real ${pick(R, GARDEN)}.” Which is the scale, drawing : actual?`
      : `${B(`${k} ${WORD[aU][1]}`)} of real ${pick(R, PLAN_THINGS)} take up ${A(`1 ${WORD[dU][0]}`)} on the plan. Which is the scale, drawing : actual?`;
  return choiceItem(R, {
    family: 'order', n, prompt, board: `\\text{drawing} : \\text{actual}`,
    opts: [
      { t: `1 ${dU} : ${k} ${aU}`, ok: true, say: `Right: the drawing's ${dU} first, the actual ${aU} second.` },
      { t: `${k} ${aU} : 1 ${dU}`, mc: MC.reverse, say: `That puts the actual length first. A scale is always drawing : actual.` },
      { t: `1 : ${k}`, mc: MC.notConverted, say: `With no units, 1 : ${k} would mean 1 ${dU} to ${k} ${dU}. The units are different here, so keep them.` },
    ],
    solution: [`The drawing length comes first: 1 ${dU}.`, `The actual length second: ${k} ${aU}. Scale 1 ${dU} : ${k} ${aU}.`],
  });
};

// ---------- 2 unitless-scale-meaning ----------
const unitless: Gen = (R, n) => {
  if (R() < 0.35) {
    const N = pick(R, [3, 5, 10]), bug = pick(R, BUGS);
    return choiceItem(R, {
      family: 'unitless', n, prompt: `A science book draws a ${bug} at the scale ${S(`${N} : 1`)}. Which is true?`, board: `${N} : 1`,
      opts: [
        { t: `The drawing is ${N} times as long as the real ${bug}.`, ok: true, say: `Right: drawing first. ${N} mm of drawing for every 1 mm of ${bug}: an enlargement.` },
        { t: `The real ${bug} is ${N} times as long as the drawing.`, mc: MC.reverse, say: `That reads it actual : drawing. The first number is the drawing: ${N} mm drawn for 1 mm of ${bug}.` },
        { t: `${N} mm on the drawing stands for 1 m of the ${bug}.`, mc: MC.mixedUnitless, say: `No units means ONE unit on both sides: ${N} mm for 1 mm.` },
      ],
      solution: [`${N} : 1 is drawing : actual, in one unit.`, `${N} mm drawn for 1 mm real: the drawing is ${N} times as long.`],
    });
  }
  const N = pick(R, [5, 8, 10, 24, 50, 100]), u: U = R() < 0.5 ? 'cm' : 'in', big = u === 'cm' ? 'm' : 'ft';
  const thing = N >= 24 && N <= 50 ? pick(R, MODEL_THINGS) : pick(R, ['garage', 'tree house', 'shed', 'classroom', 'bridge', 'boat']);
  return choiceItem(R, {
    family: 'unitless', n, prompt: `A ${N >= 24 && N <= 50 ? 'model' : 'plan'} of a ${thing} is made at ${S(`1 : ${N}`)}, measured in ${WORD[u][1]}. What does 1 : ${N} mean?`, board: `1 : ${N}`,
    opts: [
      { t: `1 ${u} on the ${N >= 24 && N <= 50 ? 'model' : 'plan'} stands for ${N} ${u} of the real ${thing}.`, ok: true, say: `Right: no units means one unit on both sides. The real ${thing} is ${N} times as long.` },
      { t: `1 ${u} on the ${N >= 24 && N <= 50 ? 'model' : 'plan'} stands for ${N} ${big} of the real ${thing}.`, mc: MC.mixedUnitless, say: `A scale with no units uses ONE unit on both sides: ${N} ${u}, not ${N} ${big}.` },
      { t: `${N} ${u} on the ${N >= 24 && N <= 50 ? 'model' : 'plan'} stands for 1 ${u} of the real ${thing}.`, mc: MC.reverse, say: `That swaps the order. The first number is the drawing: 1 ${u} drawn for ${N} ${u} real.` },
    ],
    solution: [`1 : ${N} is drawing : actual in one unit.`, `1 ${u} drawn stands for ${N} ${u} real.`],
  });
};
const unitlessCalc: Gen = (R, n) => {
  const N = pick(R, [20, 25, 50, 100]), u: U = R() < 0.6 ? 'cm' : 'in', d = int(R, Math.max(2, Math.ceil((u === 'cm' ? 60 : 24) / N)), 9);   // real things from 60 cm up
  const s = scale(1, u, N, u), y = d * N, thing = sized(R, MODELS, y, u);
  return numItem({
    family: 'unitlessCalc', n, unit: u, ans: y,
    prompt: `A model ${thing} is built at ${S(`1 : ${N}`)}. The model is ${A(`${d} ${u}`)} long. How long is the real ${thing}, in ${WORD[u][1]}?`,
    board: `1 : ${N}, \\quad ${d}\\text{ ${u}} \\to\\ ?\\text{ ${u}}`,
    solution: [`1 : ${N}: every ${u} of model stands for ${N} ${u} of the real ${thing}.`, `${d} × ${N} = ${fmt(y)} ${u}.`],
    work: [`${d} \\times ${N} = ${fmtT(y)}\\text{ ${u}}`],
    wrongs: [
      { v: r9(d / N), mc: MC.reverse, say: `That divides. The model is the small one: the real ${thing} is ${N} times as long.` },
      { v: d + N - 1, mc: MC.additive, say: `A scale multiplies. 1 : ${N} means ${N} times as long, not ${N - 1} more.` },
    ],
    miss: `The real one is ${N} times as long: ${d} × ${N} = ?`,
    pic: pic2(s, { row: 0, v: d }, { row: 1, v: y }, { cap: 'model' }),
  });
};

// ---------- 3 reverse-direction ----------
const predict: Gen = (R, n) => {
  if (R() < 0.5) {
    const k = pick(R, [2, 4, 5, 8, 10, 12]), y = k * int(R, 2, 9), thing = pick(R, PLAN_THINGS);
    return choiceItem(R, {
      family: 'predict', n, prompt: `Predict before you calculate. At ${A('1 in')} : ${B(`${k} ft`)}, a ${thing} is ${B(`${y} ft`)} long. On the plan, is the number of inches greater or less than ${y}?`,
      board: `1\\text{ in} : ${k}\\text{ ft}, \\quad ${y}\\text{ ft} \\to\\ ?\\text{ in}`,
      opts: [
        { t: `Less: each inch stands for ${k} feet, so it takes ${y} ÷ ${k} inches.`, ok: true, say: `Right: going back from feet to plan inches undoes × ${k}: divide.` },
        { t: `Greater: you multiply by the scale, ${y} × ${k}.`, mc: MC.wrongOp, say: `× ${k} turns plan inches INTO feet. Going back from feet to inches undoes it: ÷ ${k}.` },
        { t: `The same: it is the same ${thing}.`, say: `Same ${thing}, but different units: ${k} feet fit in each plan inch, so fewer inches.` },
      ],
      solution: [`Plan → actual is × ${k}.`, `Actual → plan undoes it: ÷ ${k}. Fewer inches than feet.`],
    });
  }
  const sc = pick(R, [[1, 5], [1, 10], [1, 8], [1, 1], [5, 1], [3, 1], [10, 1]] as [number, number][]);
  const [a, b] = sc, thing = a < b ? pick(R, ['house', 'boat', 'tree frog', 'bike']) : a > b ? pick(R, BUGS) : pick(R, ['key', 'leaf', 'coin', 'feather']);
  const right = a < b ? 0 : a > b ? 1 : 2;
  const texts = [`Smaller than the real ${thing}`, `Larger than the real ${thing}`, `The same size as the real ${thing}`];
  return choiceItem(R, {
    family: 'predict', n, prompt: `A drawing of a ${thing} uses the scale ${S(`${a} : ${b}`)} (drawing : actual, one unit). Is the drawing physically larger or smaller than the real ${thing}?`,
    board: `${a} : ${b}`,
    opts: texts.map((t, i) => i === right ? { t, ok: true, say: a === b ? `Right: 1 : 1 means every length is drawn at its real size.` : `Right: ${a} drawn for ${b} real, so the drawing is ${a < b ? 'smaller' : 'larger'}.` }
      : { t, mc: (i === 0 && right === 1) || (i === 1 && right === 0) ? MC.reverse : undefined, say: `The first number is the drawing. ${a} : ${b} means ${a} units drawn for every ${b} real.` }),
    solution: [`First number = drawing, second = actual.`, `${a} : ${b}: ${a < b ? 'the drawing is smaller' : a > b ? 'the drawing is larger' : 'same size'}.`],
  });
};
const reverse: Gen = (R, n) => {
  const t = int(R, 0, 2);
  if (t === 0) {
    const k = int(R, 2, 9), q = int(R, 2, 9), y = k * q, s = scale(1, 'in', k, 'ft');
    return numItem({
      family: 'reverse', n, unit: 'in', ans: q,
      prompt: `At ${A('1 in')} : ${B(`${k} ft`)}, plan → actual is × ${k}. A ${sized(R, HOUSE, y, 'ft')} is ${B(`${y} ft`)} long. How long is it on the plan?`,
      board: `\\text{plan} \\xrightarrow{\\times ${k}} \\text{actual}`,
      solution: [`Actual → plan undoes × ${k}: ÷ ${k}, the same factor.`, `${y} ÷ ${k} = ${q} in.`], work: [`${y} \\div ${k} = ${q}\\text{ in}`],
      wrongs: [{ v: y * k, mc: MC.wrongOp, say: `× ${k} goes from the plan to the actual length. Going back undoes it: ÷ ${k}.` }],
      miss: `Undo × ${k}: ${y} ÷ ${k} = ?`, pic: pic2(s, { row: 1, v: y }, { row: 0, v: q }),
    });
  }
  const s = scale(5, 'mm', 1, 'mm'), q = int(R, 2, 9), bug = sized(R, BUGS, q, 'mm');
  if (t === 1) return numItem({
    family: 'reverse', n, unit: 'mm', ans: q,
    prompt: `A ${bug} is drawn at ${S('5 : 1')}. The drawing is ${A(`${5 * q} mm`)} long. How long is the real ${bug}?`,
    board: `5 : 1, \\quad ${5 * q}\\text{ mm} \\to\\ ?`,
    solution: [`5 : 1: the drawing is 5 times as long as the ${bug}.`, `Drawing → actual: ${5 * q} ÷ 5 = ${q} mm.`], work: [`${5 * q} \\div 5 = ${q}\\text{ mm}`],
    wrongs: [{ v: 25 * q, mc: MC.sameFactor, say: `At 5 : 1 the drawing is the big one. Going to the real ${bug} makes it smaller: ÷ 5.` }],
    miss: `The real ${bug} is 5 times smaller: ${5 * q} ÷ 5 = ?`, pic: pic2(s, { row: 0, v: 5 * q }, { row: 1, v: q }),
  });
  return numItem({
    family: 'reverse', n, unit: 'mm', ans: 5 * q,
    prompt: `A real ${bug} is ${B(`${q} mm`)} long. It is drawn at ${S('5 : 1')}. How long is the drawing?`,
    board: `5 : 1, \\quad ${q}\\text{ mm} \\to\\ ?`,
    solution: [`5 : 1: every mm of ${bug} is drawn as 5 mm.`, `${q} × 5 = ${5 * q} mm.`], work: [`${q} \\times 5 = ${5 * q}\\text{ mm}`],
    wrongs: [{ v: r9(q / 5), mc: MC.sameFactor, say: `This time we go from the ${bug} to the drawing, and the drawing is the big one: × 5.` }],
    miss: `The drawing is 5 times as long: ${q} × 5 = ?`, pic: pic2(s, { row: 1, v: q }, { row: 0, v: 5 * q }),
  });
};

// ---------- 4, 5 compute-actual ----------
const toActual: Gen = (R, n, sg) => {
  if (sg === 'compute-actual-nonwhole') {
    if (R() < 0.45) {
      const k = pick(R, [2, 5, 10]), w = int(R, 1, 9), t = int(R, 1, 9), d = r9(w + t / 10), s = scale(1, 'cm', k, 'm'), y = actualOf(s, d);
      return numItem({
        family: 'toActual', n, unit: 'm', ans: y,
        prompt: `A ${sized(R, GARDEN, y, 'm')} plan uses ${A('1 cm')} : ${B(`${k} m`)}. A side is ${A(`${fmt(d)} cm`)} on the plan. How long is it actually?`,
        board: `1\\text{ cm} : ${k}\\text{ m}, \\quad ${fmtT(d)}\\text{ cm} \\to\\ ?\\text{ m}`,
        solution: [`Each cm stands for ${k} m: × ${k}.`, `${fmt(d)} × ${k} = ${fmt(w * k)} + ${fmt(r9(t / 10 * k))} = ${fmt(y)} m.`], work: [`${fmtT(d)} \\times ${k} = ${fmtT(y)}\\text{ m}`],
        wrongs: [
          { v: r9(w * k + t / 10), mc: MC.partByPart, say: `The .${t} needs the × ${k} too: ${fmt(t / 10)} × ${k} = ${fmt(r9(t / 10 * k))}.` },
          { v: r9(d / k), mc: MC.divides, say: `Plan → actual multiplies: each cm is ${k} m.` },
        ],
        miss: `Multiply the whole length: ${fmt(d)} × ${k} = ?`, pic: pic2(s, { row: 0, v: d }, { row: 1, v: y }),
      });
    }
    const k = pick(R, [4, 8, 12]), w = int(R, 1, 5), f = pick(R, [0.5, 0.25, 0.75]), d = w + f, s = scale(1, 'in', k, 'ft'), y = actualOf(s, d);
    return numItem({
      family: 'toActual', n, unit: 'ft', ans: y,
      prompt: `A house plan uses ${A('1 in')} : ${B(`${k} ft`)}. The ${sized(R, HOUSE, y, 'ft')} is ${A(len(d, 'in'))} on the plan. How long is it actually?`,
      board: `1\\text{ in} : ${k}\\text{ ft}, \\quad ${mixT(d)}\\text{ in} \\to\\ ?\\text{ ft}`,
      solution: [`Each inch stands for ${k} ft: × ${k}.`, `${w} × ${k} = ${w * k}, and ${mixS(f)} × ${k} = ${fmt(f * k)}. Together ${fmt(y)} ft.`], work: [`${mixT(d)} \\times ${k} = ${w * k} + ${fmtT(f * k)} = ${fmtT(y)}\\text{ ft}`],
      wrongs: [
        { v: r9(w * k + f), mc: MC.partByPart, say: `The ${mixS(f)} inch needs the × ${k} too: ${mixS(f)} × ${k} = ${fmt(f * k)} ft.` },
        { v: r9(d / k), mc: MC.divides, say: `Plan → actual multiplies: each inch is ${k} ft.` },
      ],
      miss: `Multiply both parts: ${w} × ${k} and ${mixS(f)} × ${k}.`, pic: pic2(s, { row: 0, v: d }, { row: 1, v: y }, { sub: 4 }),
    });
  }
  const t = int(R, 0, 9);
  if (t <= 2) {
    const [dU, aU, k] = pick(R, [['in', 'ft', 8], ['in', 'ft', 12], ['cm', 'm', 5]] as [U, U, number][]), d = int(R, 2, 9), s = scale(1, dU, k, aU), y = d * k;
    return numItem({
      family: 'toActual', n, unit: aU, ans: y,
      prompt: `At ${A(`1 ${dU}`)} : ${B(`${k} ${aU}`)}, a ${sized(R, HOUSE, y, aU)} is ${A(`${d} ${dU}`)} on the plan. How long is it actually?`,
      board: `1\\text{ ${dU}} : ${k}\\text{ ${aU}}, \\quad ${d}\\text{ ${dU}} \\to\\ ?\\text{ ${aU}}`,
      solution: [`Each ${dU} stands for ${k} ${aU}: × ${k}.`, `${d} × ${k} = ${y} ${aU}.`], work: [`${d} \\times ${k} = ${y}\\text{ ${aU}}`],
      wrongs: [{ v: r9(d / k), mc: MC.divides, say: `Plan → actual multiplies: the real thing is the big one.` }],
      miss: `× ${k}: ${d} × ${k} = ?`, pic: pic2(s, { row: 0, v: d }, { row: 1, v: y }),
    });
  }
  if (t <= 7) {
    const N = pick(R, [24, 48, 50, 64, 100, 200]), u: U = N === 24 || N === 48 || N === 64 ? 'in' : 'cm';
    const d = N === 50 && R() < 0.4 ? int(R, 12, 18) : int(R, 2, 9), s = scale(1, u, N, u), y = d * N;
    const thing = u === 'in' ? sized(R, MODELS, y, u) : sized(R, ['hallway', 'classroom', 'stage', 'bridge', 'deck'], y, u);
    return numItem({
      family: 'toActual', n, unit: u, ans: y,
      prompt: `${u === 'in' ? 'A model' : 'A plan'} at ${S(`1 : ${N}`)} shows a ${thing} ${A(`${d} ${u}`)} long. How long is the real ${thing}, in ${WORD[u][1]}?`,
      board: `1 : ${N}, \\quad ${d}\\text{ ${u}} \\to\\ ?\\text{ ${u}}`,
      solution: [`1 : ${N}: the real ${thing} is ${N} times as long.`, N === 50 && d > 9 ? `${d} × 50 = ${d} × 5 × 10 = ${fmt(y)} ${u}.` : `${d} × ${N} = ${fmt(y)} ${u}.`], work: [`${d} \\times ${N} = ${fmtT(y)}\\text{ ${u}}`],
      wrongs: [{ v: r9(d / N), mc: MC.divides, say: `The real ${thing} is the big one: multiply by ${N}.` }],
      miss: `${N} times as long: ${d} × ${N} = ?`, pic: pic2(s, { row: 0, v: d }, { row: 1, v: y }),
    });
  }
  const k = pick(R, [5, 10]), q = k === 5 ? int(R, 2, 9) : int(R, 2, 45), dl = k * q, s = scale(k, 'mm', 1, 'mm'), bug = sized(R, BUGS, q, 'mm');
  return numItem({
    family: 'toActual', n, unit: 'mm', ans: q,
    prompt: `A ${bug} is drawn at ${S(`${k} : 1`)}. The drawing is ${A(`${dl} mm`)} long. How long is the real ${bug}?`,
    board: `${k} : 1, \\quad ${dl}\\text{ mm} \\to\\ ?\\text{ mm}`,
    solution: [`${k} : 1: the drawing is ${k} times as long as the ${bug}.`, `${dl} ÷ ${k} = ${q} mm.`], work: [`${dl} \\div ${k} = ${q}\\text{ mm}`],
    wrongs: [{ v: dl * k, mc: MC.wrongOp, say: `At ${k} : 1 the drawing is the big one, so the real ${bug} is smaller: ÷ ${k}.` }],
    miss: `The real ${bug} is ${k} times smaller: ${dl} ÷ ${k} = ?`, pic: pic2(s, { row: 0, v: dl }, { row: 1, v: q }),
  });
};

// ---------- 6 compute-drawing-from-actual ----------
const toDrawing: Gen = (R, n) => {
  const t = int(R, 0, 9);
  if (t <= 4) {
    const [dU, aU] = pick(R, [['in', 'ft'], ['in', 'ft'], ['cm', 'm']] as [U, U][]);
    const k = pick(R, [2, 4, 5, 8, 8, 6, 3]);
    const fr = k === 2 ? [0.5] : k === 4 ? [0.25, 0.5, 0.75] : k === 8 ? [0.25, 0.5, 0.75] : k === 5 ? [0.2, 0.4, 0.6, 0.8] : [0];
    const exact = R() < 0.35 || fr[0] === 0;
    const q = r9(int(R, 1, 8) + (exact ? 0 : pick(R, fr))), y = r9(q * k), s = scale(1, dU, k, aU);
    const whole = Math.floor(y / k), rem = r9(y - whole * k);
    return numItem({
      family: 'toDrawing', n, unit: dU, ans: q,
      prompt: `At ${A(`1 ${dU}`)} : ${B(`${k} ${aU}`)}, how long is a ${B(`${fmt(y)} ${aU}`)} ${sized(R, HOUSE, y, aU)} on the plan? Give a decimal.`,
      board: `1\\text{ ${dU}} : ${k}\\text{ ${aU}}, \\quad ${fmtT(y)}\\text{ ${aU}} \\to\\ ?\\text{ ${dU}}`,
      solution: [`Actual → plan undoes × ${k}: ÷ ${k}.`, `${fmt(y)} ÷ ${k} = ${fmt(q)} ${dU}.`], work: [`${fmtT(y)} \\div ${k} = ${fmtT(q)}\\text{ ${dU}}`],
      wrongs: [
        { v: r9(y * k), mc: MC.wrongOp, say: `× ${k} goes from the plan to the real length. Back to the plan: ÷ ${k}.` },
        ...(rem > 0 ? [{ v: whole, mc: MC.wholeQuot, say: `${fmt(y)} ÷ ${k} does not stop at ${whole}: the ${fmt(rem)} left over is ${fmt(r9(rem / k))} more.` },
          { v: r9(whole + rem / 10), mc: MC.wholeQuot, say: `${whole} remainder ${fmt(rem)} is not ${whole}.${fmt(rem)}. Keep dividing: ${fmt(rem)} ÷ ${k} = ${fmt(r9(rem / k))}.` }] : []),
      ],
      miss: `Divide: ${fmt(y)} ÷ ${k}, and keep going after the decimal point.`, pic: pic2(s, { row: 1, v: y }, { row: 0, v: q }, { sub: dU === 'in' ? 4 : 1 }),
    });
  }
  if (t <= 5) {
    const q = int(R, 2, 9), y = 12 * q, s = scale(1, 'in', 12, 'ft');
    return numItem({
      family: 'toDrawing', n, unit: 'in', ans: q,
      prompt: `At ${A('1 in')} : ${B('12 ft')}, how long is a ${B(`${y} ft`)} ${sized(R, HOUSE, y, 'ft')} on the plan?`,
      board: `1\\text{ in} : 12\\text{ ft}, \\quad ${y}\\text{ ft} \\to\\ ?\\text{ in}`,
      solution: [`Actual → plan: ÷ 12.`, `${y} ÷ 12 = ${q} in.`], work: [`${y} \\div 12 = ${q}\\text{ in}`],
      wrongs: [{ v: y * 12, mc: MC.wrongOp, say: `Back to the plan undoes × 12: ÷ 12.` }],
      miss: `${y} ÷ 12 = ?`, pic: pic2(s, { row: 1, v: y }, { row: 0, v: q }),
    });
  }
  if (t <= 7) {
    const N = pick(R, [50, 100, 200]), q = r9(int(R, 2, 9) + (R() < 0.4 ? 0.5 : 0)), y = r9(q * N), s = scale(1, 'cm', N, 'cm');
    return numItem({
      family: 'toDrawing', n, unit: 'cm', ans: q,
      prompt: `A plan is drawn at ${S(`1 : ${N}`)}. A ${sized(R, ['hallway', 'stage', 'deck', 'classroom', 'bridge'], y, 'cm')} is ${B(`${fmt(y)} cm`)} long. How long is it on the plan?`,
      board: `1 : ${N}, \\quad ${fmtT(y)}\\text{ cm} \\to\\ ?\\text{ cm}`,
      solution: [`Actual → plan: ÷ ${N}.`, `${fmt(y)} ÷ ${N} = ${fmt(q)} cm.`], work: [`${fmtT(y)} \\div ${N} = ${fmtT(q)}\\text{ cm}`],
      wrongs: [{ v: r9(y * N), mc: MC.wrongOp, say: `The plan is the small one. Actual → plan: ÷ ${N}.` }],
      miss: `${fmt(y)} ÷ ${N} = ?`, pic: pic2(s, { row: 1, v: y }, { row: 0, v: q }),
    });
  }
  const s = scale(5, 'mm', 1, 'mm');
  if (t === 8) {
    const q = int(R, 2, 9), bug = sized(R, BUGS, q, 'mm');
    return numItem({
      family: 'toDrawing', n, unit: 'mm', ans: 5 * q,
      prompt: `A real ${bug} is ${B(`${q} mm`)} long. How long is its drawing at ${S('5 : 1')}?`,
      board: `5 : 1, \\quad ${q}\\text{ mm} \\to\\ ?\\text{ mm}`,
      solution: [`5 : 1 is an enlargement: actual → drawing is × 5.`, `${q} × 5 = ${5 * q} mm.`], work: [`${q} \\times 5 = ${5 * q}\\text{ mm}`],
      wrongs: [{ v: r9(q / 5), mc: MC.sameFactor, say: `At 5 : 1 the drawing is the BIG one: × 5 to draw it.` }],
      miss: `${q} × 5 = ?`, pic: pic2(s, { row: 1, v: q }, { row: 0, v: 5 * q }),
    });
  }
  const dl = pick(R, [6, 7, 8, 9, 11, 12, 13, 14, 16, 17, 18, 19]), q = r9(dl / 5), bug = sized(R, BUGS, q, 'mm');
  return numItem({
    family: 'toDrawing', n, unit: 'mm', ans: q,
    prompt: `A ${bug} is drawn at ${S('5 : 1')}. Its drawing is ${A(`${dl} mm`)} long. How long is the real ${bug}? Give a decimal.`,
    board: `5 : 1, \\quad ${dl}\\text{ mm} \\to\\ ?\\text{ mm}`,
    solution: [`Drawing → actual at 5 : 1: ÷ 5.`, `${dl} ÷ 5 = ${fmt(q)} mm.`], work: [`${dl} \\div 5 = ${fmtT(q)}\\text{ mm}`],
    wrongs: [{ v: dl * 5, mc: MC.wrongOp, say: `The drawing is the big one, so the ${bug} is smaller: ÷ 5.` }, { v: Math.floor(q), mc: MC.wholeQuot, say: `${dl} ÷ 5 does not stop at ${Math.floor(q)}: keep going after the decimal point.` }],
    miss: `${dl} ÷ 5 = ?`, pic: pic2(s, { row: 0, v: dl }, { row: 1, v: q }),
  });
};

// ---------- 7 decimal-to-ruler-mark ----------
const rulerRead: Gen = (R, n) => {
  const k = pick(R, [2, 4, 6, 8, 10, 12]), Lw = int(R, 1, 4), half = R() < 0.75, L = Lw + (half ? 0.5 : 0), s = scale(1, 'in', k, 'ft'), y = L * k;
  const thing = sized(R, [...FURNITURE, 'deck', 'patio', 'garage'], y, 'ft');
  const pc = pic2(s, { row: 0, v: L }, { row: 1, v: y }, { sub: 2, obj: thing });
  pc.p.n = Math.max(pc.p.n, 5);
  pc.show = ['card', 'obj', 'lines', 'ref', 'nums', 'ask'];
  pc.solve = ['given', 'down', 'drop', 'answer'];
  return numItem({
    family: 'rulerRead', n, unit: 'ft', ans: y,
    prompt: `The plan shows a ${thing}, left end on 0. Read its length on the half-inch ruler. The scale is ${A('1 in')} : ${B(`${k} ft`)}. How long is the real ${thing}?`,
    board: `1\\text{ in} : ${k}\\text{ ft}`,
    solution: [`The ${thing} ends at the ${mixS(L)} in mark: each small step is half an inch.`, `${mixS(L)} × ${k} = ${fmt(y)} ft.`], work: [`${mixT(L)} \\times ${k} = ${fmtT(y)}\\text{ ft}`],
    wrongs: [
      { v: 2 * L * k, mc: MC.interval, say: `Each small step on this ruler is half an inch, not a whole one. Count inches, not marks.` },
      ...(half ? [{ v: Lw * k, say: `The ${thing} goes half an inch past ${Lw}: it is ${mixS(L)} in.` }] : []),
    ],
    miss: `Read the inches first (${mixS(L)}?), then × ${k}.`, pic: pc,
  });
};
const fracForm: Gen = (R, n) => {
  const k = pick(R, [4, 8, 12]), w = int(R, 0, 3), f = pick(R, [0.25, 0.75, 0.5]), x = w + f, y = r9(x * k);
  const thing = sized(R, [...HOUSE, ...FURNITURE], y, 'ft'), lead = w ? `${w} ` : '';
  const right = `${lead}${mixS(f)} in`;
  const tenth = Math.round(f * 10);
  const opts: Opt[] = [
    { t: right, ok: true, say: `Right: ${fmt(x)} = ${mixS(x)}. ${f === 0.5 ? 'Half an inch' : f === 0.25 ? 'A quarter inch' : 'Three quarters of an inch'} past ${w}.` },
    f === 0.5 ? { t: `${lead}1/5 in`, say: `.5 is five tenths, that is one half, not one fifth.` }
      : { t: `${lead}${tenth}/10 in`, mc: MC.tenths, say: `.${f === 0.25 ? '25' : '75'} is ${f === 0.25 ? '25' : '75'} hundredths, not ${tenth} tenths: it is ${mixS(f)}.` },
    { t: `It can't be drawn: a ruler shows fractions, not decimals`, mc: MC.unplaceable, say: `${fmt(x)} in IS a ruler length: ${mixS(x)} in. Decimals and fractions name the same marks.` },
  ];
  return choiceItem(R, {
    family: 'fracForm', n, prompt: `At ${A('1 in')} : ${B(`${k} ft`)}, a ${B(`${fmt(y)} ft`)} ${thing} is ${A(`${fmt(x)} in`)} on the plan. Which ruler length is that?`,
    board: `${fmtT(y)} \\div ${k} = ${fmtT(x)}\\text{ in}`, opts,
    solution: [`${fmt(f)} = ${mixS(f)}.`, `So ${fmt(x)} in = ${mixS(x)} in on the ruler.`],
  });
};

// ---------- 8 normalize-nonunit-scale ----------
const normalize: Gen = (R, n) => {
  const t = int(R, 0, 3);
  if (t === 0) {
    const fd = pick(R, [0.25, 0.5]), s = scale(fd, 'in', 1, 'ft'), k = per(s), d = int(R, 2, 9), ask = R() < 0.4;
    return numItem({
      family: 'normalize', n, unit: 'ft', ans: ask ? k : d * k,
      prompt: ask ? `An architect's plan uses ${A(`${mixH(fd)} in`)} = ${B('1 ft')}. How many feet does ${A('1 in')} on the plan stand for?`
        : `An architect's plan uses ${A(`${mixH(fd)} in`)} = ${B('1 ft')}. A ${sized(R, HOUSE, d * k, 'ft')} is ${A(`${d} in`)} on the plan. How long is it actually?`,
      board: `${mixT(fd)}\\text{ in} : 1\\text{ ft}`,
      solution: [`${mixS(fd)} in → 1 ft. Scale the table × ${k}: 1 in → ${ask ? mark(`${k} ft`) : `${k} ft`}.`, ask ? `Check: ${k} × ${mixS(fd)} in = 1 in.` : `${d} × ${k} = ${mark(`${d * k} ft`)}.`],
      work: [`1\\text{ in} : ${k}\\text{ ft}`, ...(ask ? [] : [`${d} \\times ${k} = ${d * k}\\text{ ft}`])],
      wrongs: [{ v: ask ? 1 : d, mc: MC.nonunit, say: `${mixS(fd)} in, not 1 in, stands for 1 ft. A whole inch is ${k} of those: ${k} ft.` }, { v: ask ? fd : d * fd, mc: MC.wrongOp, say: `A whole inch is MORE than ${mixS(fd)} in, so it stands for more than 1 ft: × ${k}.` }],
      miss: `How many ${mixS(fd)} inches make 1 inch? That many feet.`,
      pic: (() => { const pc = pic2(normalized(s), { row: 0, v: ask ? 1 : d }, { row: 1, v: ask ? k : d * k }); pc.p.tag = scaleT(s); return pc; })(),
    });
  }
  const sc = pick(R, [[2, 5], [2, 3], [4, 5], [2, 7], [4, 3]] as [number, number][]), s = scale(sc[0], 'cm', sc[1], 'm'), k = per(s);
  if (t <= 2) {
    const d = int(R, 2, 9), y = actualOf(s, d);
    return numItem({
      family: 'normalize', n, unit: 'm', ans: y,
      prompt: `A park plan uses ${A(`${sc[0]} cm`)} : ${B(`${sc[1]} m`)}. A path is ${A(`${d} cm`)} on the plan. How long is the real path?`,
      board: `${sc[0]}\\text{ cm} : ${sc[1]}\\text{ m}`,
      solution: [`Per one cm: ${sc[1]} ÷ ${sc[0]} = ${fmt(k)}, so 1 cm : ${fmt(k)} m.`, `${d} × ${fmt(k)} = ${fmt(y)} m.`], work: [`1\\text{ cm} : ${fmtT(k)}\\text{ m}`, `${d} \\times ${fmtT(k)} = ${fmtT(y)}\\text{ m}`],
      wrongs: [{ v: d * sc[1], mc: MC.nonunit, say: `${sc[1]} m goes with ${sc[0]} cm, not with 1 cm. One cm is ${fmt(k)} m.` }, { v: r9(d / k), mc: MC.divides, say: `Plan → actual multiplies by ${fmt(k)} m per cm.` }],
      miss: `First 1 cm : ? m (halve the table${sc[0] === 4 ? ' twice' : ''}), then × ${d}.`,
      pic: (() => { const pc = pic2(s, { row: 0, v: d }, { row: 1, v: y }); return pc; })(),
    });
  }
  const g = int(R, 2, 6), y = sc[1] * g, q = sc[0] * g;
  return numItem({
    family: 'normalize', n, unit: 'cm', ans: q,
    prompt: `A park plan uses ${A(`${sc[0]} cm`)} : ${B(`${sc[1]} m`)}. A real fence is ${B(`${y} m`)} long. How long is it on the plan?`,
    board: `${sc[0]}\\text{ cm} : ${sc[1]}\\text{ m}`,
    solution: [`${y} m is ${g} groups of ${sc[1]} m.`, `Each group is ${sc[0]} cm on the plan: ${g} × ${sc[0]} = ${q} cm.`], work: [`${y} \\div ${sc[1]} = ${g}`, `${g} \\times ${sc[0]} = ${q}\\text{ cm}`],
    wrongs: [{ v: g, mc: MC.nonunit, say: `${g} counts groups of ${sc[1]} m, and each group is ${sc[0]} cm on the plan, not 1 cm.` }, { v: y * sc[0], mc: MC.wrongOp, say: `Count groups of ${sc[1]} m first: ${y} ÷ ${sc[1]} = ${g}.` }],
    miss: `How many groups of ${sc[1]} m are in ${y} m? Each one is ${sc[0]} cm.`,
    pic: pic2(s, { row: 1, v: y }, { row: 0, v: q }),
  });
};

// ---------- 9 scale-with-units-to-unitless ----------
const toUnitless: Gen = (R, n) => {
  const t = int(R, 0, 5);
  const [dU, aU, k] = t <= 2 ? ['in', 'ft', int(R, 2, 9)] as [U, U, number] : t <= 4 ? ['cm', 'm', int(R, 1, 9)] as [U, U, number] : ['in', 'yd', int(R, 1, 3)] as [U, U, number];
  const s = scale(1, dU, k, aU), N = ratioN(s), f = factorOf(aU, dU), help = R() < 0.5;
  const rows = [{ unit: dU, step: 1 }, { unit: aU, step: k }, { unit: dU, step: N }];
  const pc: LinesPic = {
    p: { rows, n: 3, tag: scaleT(s), ops: [`\\times ${k}`, `\\div ${k}`], conv: [`\\times ${fmtT(f)}`, `\\div ${fmtT(f)}`], given: { row: 0, v: 1 }, ask: { row: 2, v: N } },
    show: ['card', 'lines', 'ref', 'alt', 'given', 'ask'], solve: ['conv', 'drop', 'answer'], quiet: 2,
  };
  return numItem({
    family: 'toUnitless', n, unit: '', ans: N,
    prompt: `Write the scale ${A(`1 ${dU}`)} : ${B(`${k} ${aU}`)} with no units, as ${S('1 : ?')}${help ? ` (1 ${aU} = ${f} ${dU})` : ''}.`,
    board: `1\\text{ ${dU}} : ${k}\\text{ ${aU}} = 1 : \\ ?`,
    solution: [`Write the actual part in ${WORD[dU][1]}: ${k} ${aU} = ${k} × ${f} = ${fmt(N)} ${dU}.`, `1 ${dU} : ${fmt(N)} ${dU} = 1 : ${fmt(N)}.`], work: [`${k}\\text{ ${aU}} = ${fmtT(N)}\\text{ ${dU}}`, `1 : ${fmtT(N)}`],
    wrongs: [
      { v: k, mc: MC.notConverted, say: `1 : ${k} would mean 1 ${dU} for ${k} ${dU}. Turn the ${k} ${aU} into ${WORD[dU][1]} first.` },
      ...(aU === 'ft' ? [{ v: 10 * k, mc: MC.base10, say: `A foot is 12 inches, not 10.` }] : []),
      ...(aU === 'yd' ? [{ v: 12 * k, say: `A yard is 3 feet, that is 36 inches.` }] : []),
    ],
    miss: `How many ${WORD[dU][1]} are in ${k} ${aU}?`, pic: pc,
  });
};

// ---------- 10 convert-input-unit ----------
const convertIn: Gen = (R, n) => {
  if (R() < 0.5) {
    const k = pick(R, [2, 3, 4, 6, 8]);
    let Y = 0, q = 0;
    for (let i = 0; i < 40; i++) { Y = int(R, 1, 8); q = r9(3 * Y / k); if (Number.isInteger(q * 4) && q <= 12) break; }
    const s = scale(1, 'in', k, 'ft'), ft = 3 * Y, m = k % 3 === 0 ? 1 : 3;
    const rows = [{ unit: 'in', step: m }, { unit: 'ft', step: m * k }, { unit: 'yd', step: r9(m * k / 3) }];
    const nn = Math.max(3, Math.ceil(q / m - 1e-9) + 1);
    const pc: LinesPic = { p: { rows, n: nn, sub: m === 3 ? 3 : 4, tag: scaleT(s), ops: [`\\times ${k}`, `\\div ${k}`], conv: ['\\div 3', '\\times 3'], given: { row: 2, v: Y }, ask: { row: 0, v: q } }, show: ['card', 'lines', 'ref', 'alt', 'given', 'ask'], solve: ['conv', 'up', 'drop', 'answer'], quiet: 0 };
    return numItem({
      family: 'convertIn', n, unit: 'in', ans: q,
      prompt: `A plan uses ${A('1 in')} : ${B(`${k} ft`)}. A real ${sized(R, ['fence', 'hedge', 'wall', 'counter', 'dock'], Y, 'yd')} is ${B(`${Y} yd`)} long. How long is it on the plan? Give a decimal.`,
      board: `1\\text{ in} : ${k}\\text{ ft}, \\quad ${Y}\\text{ yd} \\to\\ ?\\text{ in}`,
      solution: [`Put the length in the scale's unit: ${Y} yd = ${Y} × 3 = ${ft} ft.`, `${ft} ÷ ${k} = ${fmt(q)} in.`], work: [`${Y}\\text{ yd} = ${ft}\\text{ ft}`, `${ft} \\div ${k} = ${fmtT(q)}\\text{ in}`],
      wrongs: [
        { v: r9(Y / k), mc: MC.unconverted, say: `The scale counts feet, but ${Y} is yards. Change ${Y} yd into feet first.` },
        { v: r9(Y / 3 / k), mc: MC.convDir, say: `A foot is smaller than a yard, so there are MORE feet: ${Y} yd = ${Y} × 3 ft.` },
        { v: r9(ft * k), mc: MC.wrongOp, say: `Feet → plan inches undoes × ${k}: ÷ ${k}.` },
      ],
      miss: `First ${Y} yd → ft (× 3), then ÷ ${k}.`, pic: pc,
    });
  }
  const N = pick(R, [25, 50, 100, 200]);
  let M = 0, q = 0;
  for (let i = 0; i < 40; i++) { M = pick(R, [1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8, 10, 12, 14, 16]); q = r9(M * 100 / N); if (q >= 1 && q <= 16 && Number.isInteger(q * 2)) break; }
  const s = scale(1, 'cm', N, 'cm'), cm = r9(M * 100);
  const rows = [{ unit: 'cm', step: 1 }, { unit: 'cm', step: N }, { unit: 'm', step: r9(N / 100) }];
  const L = linesFor(rows as { unit: U; step: number }[], [q]);
  const pc: LinesPic = { p: { rows: L.rows, n: L.n, cap: 'model', tag: scaleT(s, false), ops: [`\\times ${N}`, `\\div ${N}`], conv: ['\\div 100', '\\times 100'], given: { row: 2, v: M }, ask: { row: 0, v: q } }, show: ['card', 'lines', 'ref', 'alt', 'given', 'ask'], solve: ['conv', 'up', 'drop', 'answer'], quiet: 0 };
  return numItem({
    family: 'convertIn', n, unit: 'cm', ans: q,
    prompt: `A model is built at ${S(`1 : ${N}`)}. The real ${sized(R, BIG, M, 'm')} is ${B(`${fmt(M)} m`)} long. How long is the model, in centimeters?`,
    board: `1 : ${N}, \\quad ${fmtT(M)}\\text{ m} \\to\\ ?\\text{ cm}`,
    solution: [`One way: ${fmt(M)} m = ${fmt(cm)} cm, then ${fmt(cm)} ÷ ${N} = ${fmt(q)} cm.`, `Or: ${fmt(M)} ÷ ${N} = ${fmt(r9(M / N))} m = ${fmt(q)} cm. Both orders work.`],
    work: [`${fmtT(M)}\\text{ m} = ${fmtT(cm)}\\text{ cm}`, `${fmtT(cm)} \\div ${N} = ${fmtT(q)}\\text{ cm}`],
    wrongs: [
      { v: r9(M / N), mc: MC.relabel, say: `${fmt(r9(M / N))} is in METERS. In centimeters it is 100 times as many: ${fmt(q)} cm.` },
      { v: r9(M / 100 / N), mc: MC.convDir, say: `A centimeter is smaller than a meter, so there are more of them: × 100, not ÷ 100.` },
      { v: r9(cm * N), mc: MC.wrongOp, say: `The model is the small one: ÷ ${N}.` },
    ],
    miss: `${fmt(M)} m = ? cm, then ÷ ${N}.`, pic: pc,
  });
};

// ---------- 11 convert-output-unit ----------
const convertOut: Gen = (R, n) => {
  if (R() < 0.6) {
    const N = pick(R, [12, 24, 48]), d = N === 48 ? int(R, 1, 3) : N === 24 ? int(R, 2, 6) : int(R, 2, 12), inches = d * N, ft = inches / 12;
    const s = scale(1, 'in', N, 'in'), thing = sized(R, MODELS, inches, 'in');
    const rows = [{ unit: 'in', step: 1 }, { unit: 'in', step: N }, { unit: 'ft', step: N / 12 }];
    const L = linesFor(rows as { unit: U; step: number }[], [d]);
    const pc: LinesPic = { p: { rows: L.rows, n: L.n, cap: 'model', tag: scaleT(s, false), ops: [`\\times ${N}`, `\\div ${N}`], conv: ['\\div 12', '\\times 12'], given: { row: 0, v: d }, ask: { row: 2, v: ft } }, show: ['card', 'lines', 'ref', 'alt', 'given', 'ask'], solve: ['down', 'conv', 'drop', 'answer'], quiet: 2 };
    return numItem({
      family: 'convertOut', n, unit: 'ft', ans: ft,
      prompt: `A model ${thing} is built at ${S(`1 : ${N}`)}. The model is ${A(`${d} in`)} long. How long is the real ${thing}, in feet?`,
      board: `1 : ${N}, \\quad ${d}\\text{ in} \\to\\ ?\\text{ ft}`,
      solution: [`${d} × ${N} = ${inches} in (one unit on both sides).`, `${inches} in ÷ 12 = ${ft} ft.`], work: [`${d} \\times ${N} = ${inches}\\text{ in}`, `${inches} \\div 12 = ${ft}\\text{ ft}`],
      wrongs: [
        { v: inches, mc: MC.relabel, say: `${inches} is in INCHES (1 : ${N} keeps one unit). In feet: ${inches} ÷ 12.` },
        { v: r9(inches / 10), mc: MC.base10, say: `A foot is 12 inches, not 10: divide by 12.` },
      ],
      miss: `First the inches (${d} × ${N}), then ÷ 12 for feet.`, pic: pc,
    });
  }
  const N = pick(R, [50, 100, 200]), d = int(R, 2, 9), cm = d * N, m = r9(cm / 100), s = scale(1, 'cm', N, 'cm');
  const rows = [{ unit: 'cm', step: 1 }, { unit: 'cm', step: N }, { unit: 'm', step: r9(N / 100) }];
  const L = linesFor(rows as { unit: U; step: number }[], [d]);
  const pc: LinesPic = { p: { rows: L.rows, n: L.n, cap: 'plan', tag: scaleT(s, false), ops: [`\\times ${N}`, `\\div ${N}`], conv: ['\\div 100', '\\times 100'], given: { row: 0, v: d }, ask: { row: 2, v: m } }, show: ['card', 'lines', 'ref', 'alt', 'given', 'ask'], solve: ['down', 'conv', 'drop', 'answer'], quiet: 2 };
  return numItem({
    family: 'convertOut', n, unit: 'm', ans: m,
    prompt: `A plan is drawn at ${S(`1 : ${N}`)}. A ${sized(R, GARDEN, m, 'm')} is ${A(`${d} cm`)} on the plan. How long is it really, in meters?`,
    board: `1 : ${N}, \\quad ${d}\\text{ cm} \\to\\ ?\\text{ m}`,
    solution: [`${d} × ${N} = ${fmt(cm)} cm.`, `${fmt(cm)} cm ÷ 100 = ${fmt(m)} m.`], work: [`${d} \\times ${N} = ${fmtT(cm)}\\text{ cm}`, `${fmtT(cm)} \\div 100 = ${fmtT(m)}\\text{ m}`],
    wrongs: [{ v: cm, mc: MC.relabel, say: `${fmt(cm)} is in CENTIMETERS. In meters: ÷ 100.` }, { v: r9(cm / 10), say: `100 cm make a meter, not 10.` }],
    miss: `First the centimeters (${d} × ${N}), then ÷ 100.`, pic: pc,
  });
};

// ---------- 12 find-scale-from-pair ----------
const findScale: Gen = (R, n) => {
  const t = int(R, 0, 2);
  if (t === 0) {
    const k = pick(R, [2, 4, 6, 8, 10, 12]), d = int(R, 2, 6), y = d * k;
    const eMin = Math.max(2, Math.ceil(8 / k));   // the side wall is a real wall, at least 8 ft
    let e = int(R, eMin, Math.max(eMin + 1, 7)); if (e === d) e = d + 1;
    const thing = sized(R, ['garage door', 'front wall', 'porch', 'kitchen counter', 'driveway'], y, 'ft');
    return numItem({
      family: 'findScale', n, unit: 'ft', ans: k,
      prompt: `On a house plan, the ${thing} is ${A(`${d} in`)} long and the side wall is ${A(`${e} in`)}. The real ${thing} is ${B(`${y} ft`)}. Complete the scale: 1 in : ? ft.`,
      board: `1\\text{ in} : \\ ?\\text{ ft}`,
      solution: [`Use the matching pair: the ${thing}, ${d} in on the plan and ${y} ft real.`, `${y} ÷ ${d} = ${k}, so 1 in : ${k} ft.`], work: [`${d}\\text{ in} : ${y}\\text{ ft}`, `1\\text{ in} : ${k}\\text{ ft}`],
      wrongs: [
        { v: r9(y / e), mc: MC.noncorr, say: `The side wall is a different part. The ${y} ft goes with the ${thing}'s ${d} in.` },
        { v: r9(d / y), mc: MC.reverse, say: `Drawing first: ${d} in stands for ${y} ft, so each inch stands for ${y} ÷ ${d} ft.` },
      ],
      miss: `Which plan length goes with ${y} ft? Divide.`,
    });
  }
  if (t === 1) {
    const N = pick(R, [20, 25, 50, 100, 200]);
    let d = 0, M = 0;
    for (let i = 0; i < 40; i++) { d = int(R, 2, 8); M = r9(N * d / 100); if (Number.isInteger(M * 2)) break; }
    const k = r9(M / d);
    return numItem({
      family: 'findScale', n, unit: '', ans: N,
      prompt: `A ${sized(R, GARDEN, M, 'm')} is ${B(`${fmt(M)} m`)} long. On the plan it is ${A(`${d} cm`)}. Write the scale with no units: 1 : ?`,
      board: `${d}\\text{ cm} : ${fmtT(M)}\\text{ m} = 1 : \\ ?`,
      solution: [`One unit first: ${fmt(M)} m = ${fmt(M * 100)} cm.`, `${fmt(M * 100)} ÷ ${d} = ${N}, so 1 : ${N}.`], work: [`${d}\\text{ cm} : ${fmtT(r9(M * 100))}\\text{ cm}`, `1 : ${N}`],
      wrongs: [{ v: k, mc: MC.notConverted, say: `That mixes cm and m. Write ${fmt(M)} m in centimeters first.` }, { v: r9(d / (M * 100)), mc: MC.reverse, say: `Drawing first: 1 : ${N}, the actual is the big one.` }],
      miss: `${fmt(M)} m = ? cm, then divide by ${d}.`,
    });
  }
  const k = pick(R, [2, 4, 6, 8]), w = int(R, 1, 3), d = w + 0.5, y = r9(d * k);
  const thing = sized(R, ['sofa', 'bed', 'bookcase', 'counter', 'bathtub', 'rug', 'deck', 'patio'], y, 'ft');
  return numItem({
    family: 'findScale', n, unit: 'ft', ans: k,
    prompt: `A ${B(`${fmt(y)}-ft`)} ${thing} is drawn ${A(`${mixH(d)} in`)} long. Complete the scale: 1 in : ? ft.`,
    board: `${mixT(d)}\\text{ in} : ${fmtT(y)}\\text{ ft} = 1\\text{ in} : \\ ?\\text{ ft}`,
    solution: [`Double both: ${2 * d} in : ${fmt(2 * y)} ft (whole numbers).`, `÷ ${2 * d}: 1 in : ${k} ft.`], work: [`${2 * d}\\text{ in} : ${fmtT(2 * y)}\\text{ ft}`, `1\\text{ in} : ${k}\\text{ ft}`],
    wrongs: [{ v: r9(y / w), mc: MC.partByPart, say: `The ${thing} is ${mixS(d)} in, not ${w} in. Double both to get whole inches first.` }, { v: r9(d / y), mc: MC.reverse, say: `Drawing first: how many feet for ONE inch?` }],
    miss: `Double both lengths, then divide.`,
  });
};

// ---------- 13 magnitude-direction-check ----------
interface Bench { name: string; v: number; u: U; about: string }
const BENCH: Bench[] = [
  { name: 'door', v: 7, u: 'ft', about: 'A door is about 7 ft tall.' },
  { name: 'car', v: 15, u: 'ft', about: 'A car is about 15 ft long.' },
  { name: 'bedroom', v: 12, u: 'ft', about: 'A bedroom is usually 10 to 15 ft long.' },
  { name: 'garden bed', v: 3, u: 'm', about: 'A garden bed is about 3 m long.' },
  { name: 'school bus', v: 40, u: 'ft', about: 'A school bus is about 40 ft long.' },
  { name: 'kitchen table', v: 6, u: 'ft', about: 'A kitchen table is about 6 ft long.' },
];
const reasonable: Gen = (R, n) => {
  const b = pick(R, BENCH);
  const k = pick(R, (b.u === 'm' ? [2, 5] : [4, 8, 12]).filter(c => Number.isInteger(r9(b.v / c * 8))));
  // kinds: 0 plausible, 1 reversed factor (divided: k x k too small), 2 a unit left unconverted (12 or 100 too big),
  // 3 a decimal slip (10 too small); a claim always has at most 2 decimals
  let kind = int(R, 0, 3);
  if (kind === 1 && !Number.isInteger(r9(b.v / (k * k) * 100))) kind = 2;
  const realV = b.v, drawn = r9(realV / k);
  const off = kind === 0 ? 1 : kind === 1 ? k * k : kind === 2 ? (b.u === 'm' ? 100 : 12) : 10;
  const big = kind === 2;
  const claim = kind === 0 ? realV : kind === 2 ? r9(realV * off) : r9(realV / off);
  const scaleTxt = b.u === 'm' ? `1 cm : ${k} m` : `1 in : ${k} ft`, dU = b.u === 'm' ? 'cm' : 'in';
  const fx = kind === 0 ? (b.u === 'm' ? 100 : 12) : off;
  const opts: Opt[] = [
    { t: `Reasonable: it is close to the size of a real ${b.name}.`, ok: kind === 0, mc: kind === 0 ? undefined : MC.benchmark, say: kind === 0 ? `Right: ${fmt(claim)} ${b.u} fits a ${b.name}. And ${fmt(drawn)} × ${k} = ${fmt(realV)} checks it.` : `${b.about} ${fmt(claim)} ${b.u} is far off: check the answer against the benchmark.` },
    { t: `Not reasonable: about ${fx} times too big.`, ok: kind !== 0 && big, mc: kind !== 0 && !big ? MC.sizeErr : undefined, say: kind !== 0 && big ? `Right: ${fmt(claim)} is about ${fx} times ${fmt(realV)} ${b.u}.` : `Compare with the ${b.name}: ${b.about}` },
    { t: `Not reasonable: about ${fx} times too small.`, ok: kind !== 0 && !big, mc: kind !== 0 && big ? MC.sizeErr : undefined, say: kind !== 0 && !big ? `Right: ${fmt(claim)} is about 1/${fx} of ${fmt(realV)} ${b.u}.` : `Compare with the ${b.name}: ${b.about}` },
  ];
  return choiceItem(R, {
    family: 'reasonable', n,
    prompt: `A plan uses ${A(scaleTxt)}. The ${b.name} is ${A(`${isMetric(b.u) ? fmt(drawn) : fmt(drawn)} ${dU}`)} on the plan. Kai says the real ${b.name} is ${B(`${fmt(claim)} ${b.u}`)} long. ${b.about} Is Kai's answer reasonable?`,
    board: `\\text{Kai: } ${fmtT(claim)}\\text{ ${b.u}}`, opts,
    solution: [`${fmt(drawn)} × ${k} = ${fmt(realV)} ${b.u}, about the size of a real ${b.name}.`, kind === 0 ? `Kai's answer matches.` : `Kai's ${fmt(claim)} ${b.u} is about ${fx} times too ${big ? 'big' : 'small'}.`],
  });
};

// ---------- 14 diagnose-reversed-factor ----------
const diagnoseRev: Gen = (R, n) => {
  const t = int(R, 0, 3);
  let prompt = '', board = '', right = '', rightV = '', keep = '', ruleT = '';
  if (t === 0) {
    const k = pick(R, [4, 8, 12]), q = pick(R, [1.5, 2, 2.5, 3, 3.5, 4, 5]), y = r9(q * k);
    prompt = `Ana's plan uses ${A('1 in')} : ${B(`${k} ft`)}. To draw a ${B(`${fmt(y)} ft`)} ${sized(R, HOUSE, y, 'ft')}, she wrote this. What is wrong?`;
    board = `${fmtT(y)} \\times ${k} = ${fmtT(y * k)}\\text{ in}`;
    right = `${fmt(y)} ÷ ${k}`; rightV = `${fmt(q)} in`; keep = `Keep ${fmt(y)} × ${k}, but the unit is feet: ${fmt(y * k)} ft.`; ruleT = `Nothing: with a scale you always multiply by the scale number.`;
  } else if (t === 1) {
    const k = pick(R, [4, 8]), d = int(R, 2, 6), y = d * k;
    prompt = `Ana's plan uses ${A('1 in')} : ${B(`${k} ft`)}. A ${sized(R, HOUSE, y, 'ft')} is ${A(`${d} in`)} on the plan. She wrote this. What is wrong?`;
    board = `${d} \\div ${k} = ${fmtT(r9(d / k))}\\text{ ft}`;
    right = `${d} × ${k}`; rightV = `${y} ft`; keep = `Keep ${d} ÷ ${k}, but the unit is inches: ${fmt(r9(d / k))} in.`; ruleT = `Nothing: from the plan to the real thing you always divide.`;
  } else if (t === 2) {
    const q = int(R, 2, 9), dl = 5 * q, bug = sized(R, BUGS, q, 'mm');
    prompt = `A ${bug} is drawn at ${S('5 : 1')}, ${A(`${dl} mm`)} long. Ana found the real ${bug} like this. What is wrong?`;
    board = `${dl} \\times 5 = ${dl * 5}\\text{ mm}`;
    right = `${dl} ÷ 5`; rightV = `${q} mm`; keep = `Keep ${dl} × 5, but write it in cm: ${fmt(r9(dl / 2))} cm.`; ruleT = `Nothing: with a scale you always multiply by the scale number.`;
  } else {
    const N = pick(R, [20, 50, 100]), d = int(R, 2, 9), bigV = d * N;
    prompt = `A model is built at ${S(`1 : ${N}`)}. The model is ${A(`${d} cm`)} long. Ana read the scale as actual : model and wrote this. What is wrong?`;
    board = `${d} \\div ${N} = ${fmtT(r9(d / N))}\\text{ cm}`;
    right = `${d} × ${N}`; rightV = `${fmt(bigV)} cm`; keep = `Keep ${d} ÷ ${N}, but write it in mm: ${fmt(r9(d / N * 10))} mm.`; ruleT = `Nothing: the bigger number in a scale is always the model.`;
  }
  return choiceItem(R, {
    family: 'diagnoseRev', n, prompt, board,
    opts: [
      { t: `The step goes the wrong way: it should be ${right} = ${rightV}.`, ok: true, say: `Right: ${right} = ${rightV}. Check it by going back the other way.` },
      { t: keep, mc: MC.arithOnly, say: `The arithmetic was fine; the OPERATION is wrong. Which way does this step go: to the bigger or the smaller length?` },
      { t: ruleT, mc: MC.rule, say: `A rule is not a reason. Ask: should the answer be bigger or smaller? That tells you × or ÷.` },
    ],
    solution: [`Ask first: should the answer be bigger or smaller?`, `The right step: ${right} = ${rightV}.`],
  });
};

// ---------- 15 diagnose-missing-conversion ----------
const diagnoseConv: Gen = (R, n) => {
  const t = int(R, 0, 4);
  if (t === 0) {
    const N = pick(R, [50, 100, 200]), d = int(R, 2, 9), cm = d * N, m = r9(cm / 100);
    return choiceItem(R, {
      family: 'diagnoseConv', n, prompt: `A plan at ${S(`1 : ${N}`)} shows a ${sized(R, GARDEN, m, 'm')} ${A(`${d} cm`)} long. Ben found its real length like this. Is it right?`,
      board: `${d} \\times ${N} = ${fmtT(cm)}\\text{ m}`,
      opts: [
        { t: `Wrong, 100 times too big: ${fmt(cm)} cm = ${fmt(m)} m.`, ok: true, say: `Right: 1 : ${N} keeps one unit, so ${fmt(cm)} is centimeters. ÷ 100 for meters.` },
        { t: `Wrong, 10 times too big: ${fmt(r9(cm / 10))} m.`, mc: MC.sizeErr, say: `A meter is 100 cm, so the slip is a factor of 100, not 10.` },
        { t: `Right: ${d} × ${N} = ${fmt(cm)}.`, mc: MC.relabel, say: `The product is right, but the unit is not: ${fmt(cm)} CENTIMETERS. The label changed without converting.` },
      ],
      solution: [`1 : ${N} in one unit: ${d} cm → ${fmt(cm)} cm.`, `${fmt(cm)} cm = ${fmt(m)} m. Ben's answer is 100 times too big.`],
    });
  }
  if (t === 1) {
    const N = pick(R, [24, 48]), d = N === 48 ? int(R, 1, 3) : int(R, 2, 6), inch = d * N, ft = inch / 12, thing = sized(R, MODELS, inch, 'in');
    return choiceItem(R, {
      family: 'diagnoseConv', n, prompt: `A model ${thing} at ${S(`1 : ${N}`)} is ${A(`${d} in`)} long. Ben found the real length like this. Is it right?`,
      board: `${d} \\times ${N} = ${inch}\\text{ ft}`,
      opts: [
        { t: `Wrong, 12 times too big: ${inch} in = ${ft} ft.`, ok: true, say: `Right: 1 : ${N} keeps inches. ${inch} in ÷ 12 = ${ft} ft.` },
        { t: `Wrong, 10 times too big: ${fmt(r9(inch / 10))} ft.`, mc: MC.base10, say: `Feet and inches are 12 apart, not 10.` },
        { t: `Right: ${d} × ${N} = ${inch}.`, mc: MC.relabel, say: `${inch} is inches, not feet. The label changed without converting.` },
      ],
      solution: [`${d} × ${N} = ${inch} in.`, `${inch} ÷ 12 = ${ft} ft: Ben's answer is 12 times too big.`],
    });
  }
  if (t === 2) {
    const k = pick(R, [2, 4]);
    let Y = 2, q = 0;
    for (let i = 0; i < 30; i++) { Y = int(R, 1, 6); q = r9(3 * Y / k); if (Number.isInteger(q * 4)) break; }
    return choiceItem(R, {
      family: 'diagnoseConv', n, prompt: `A plan uses ${A('1 in')} : ${B(`${k} ft`)}. A real hedge is ${B(`${Y} yd`)} long. Ben drew it like this. Is it right?`,
      board: `${Y} \\div ${k} = ${fmtT(r9(Y / k))}\\text{ in}`,
      opts: [
        { t: `Wrong, 3 times too small: ${Y} yd = ${3 * Y} ft, so ${fmt(q)} in.`, ok: true, say: `Right: the scale counts feet. ${Y} yd = ${3 * Y} ft, and ${3 * Y} ÷ ${k} = ${fmt(q)} in.` },
        { t: `Wrong, 10 times too small: ${fmt(r9(Y * 10 / k))} in.`, mc: MC.base10, say: `A yard is 3 feet, not 10.` },
        { t: `Right: ${Y} ÷ ${k} = ${fmt(r9(Y / k))}.`, mc: MC.unconverted, say: `The ${Y} is yards, but the scale is in feet. Convert first.` },
      ],
      solution: [`${Y} yd = ${3 * Y} ft.`, `${3 * Y} ÷ ${k} = ${fmt(q)} in. Ben's answer is 3 times too small.`],
    });
  }
  if (t === 3) {
    // a correct solution that scales first and converts after
    const N = pick(R, [50, 100, 200]);
    let M = 0, q = 0;
    for (let i = 0; i < 30; i++) { M = pick(R, [2, 3, 4, 5, 6, 8, 10, 12]); q = r9(M * 100 / N); if (q >= 1 && Number.isInteger(q * 2)) break; }
    const mm = r9(M / N);
    return choiceItem(R, {
      family: 'diagnoseConv', n, prompt: `A model at ${S(`1 : ${N}`)}. The real ${sized(R, BIG, M, 'm')} is ${B(`${M} m`)}. Ben scaled first, then converted. Is it right?`,
      board: `${M} \\div ${N} = ${fmtT(mm)}\\text{ m} = ${fmtT(q)}\\text{ cm}`,
      opts: [
        { t: `Right: scaling first, then converting, works too.`, ok: true, say: `Right: with a scale in one unit, either order works. ${fmt(mm)} m = ${fmt(q)} cm.` },
        { t: `Wrong: you must convert to centimeters before you scale.`, mc: MC.oneOrder, say: `Both orders are fine: ${M} m = ${fmt(M * 100)} cm, ÷ ${N} = ${fmt(q)} cm. Same answer.` },
        { t: `Wrong, 100 times too small: ${fmt(q * 100)} cm.`, mc: MC.everyError, say: `${fmt(mm)} m is ${fmt(q)} cm (× 100). Ben did convert.` },
      ],
      solution: [`${M} ÷ ${N} = ${fmt(mm)} m.`, `${fmt(mm)} m = ${fmt(q)} cm. Converting after scaling is fine.`],
    });
  }
  // converted twice
  // (feet a multiple of 3, so the extra ÷ 12 ends in a short decimal)
  const [N, d] = pick(R, [[12, 3], [12, 6], [12, 9], [24, 3], [24, 6], [48, 3], [48, 6], [36, 2], [36, 4]] as [number, number][]), inch = d * N, ft = inch / 12, thing = sized(R, MODELS, inch, 'in');
  return choiceItem(R, {
    family: 'diagnoseConv', n, prompt: `A model ${thing} at ${S(`1 : ${N}`)} is ${A(`${d} in`)} long. Ben found the real length in feet like this. Is it right?`,
    board: `\\begin{array}{l} ${d} \\times ${N} = ${inch}\\text{ in} = ${fmtT(ft)}\\text{ ft} \\\\ ${fmtT(ft)} \\div 12 = ${fmtT(r9(ft / 12))}\\text{ ft} \\end{array}`,
    opts: [
      { t: `Wrong, 12 times too small: it converts twice. ${fmt(ft)} ft.`, ok: true, say: `Right: ${inch} in was already ${fmt(ft)} ft. Dividing by 12 again is one conversion too many.` },
      { t: `Right: inches to feet is ÷ 12.`, mc: MC.doubleConv, say: `It is ÷ 12, but only once. ${inch} in = ${fmt(ft)} ft already.` },
      { t: `Wrong, 10 times too small: ${fmt(r9(ft / 12 * 10))} ft.`, mc: MC.sizeErr, say: `The extra step was ÷ 12, so it is 12 times too small.` },
    ],
    solution: [`${d} × ${N} = ${inch} in = ${fmt(ft)} ft.`, `The second ÷ 12 converts again: ${fmt(ft)} ft is the answer.`],
  });
};

// ---------- 16 audit-scale-solution ----------
const audit: Gen = (R, n) => {
  if (R() < 0.3) {
    const k = pick(R, [4, 6, 8]), w = int(R, 1, 3), f = pick(R, [0.25, 0.5, 0.75]), W = w + f, real = r9(W * k);
    const couch = pick(R, [5, 6, 7, 8, 9, 10, 12].filter(c => Math.abs(c - real) >= 1));
    const fits = real >= couch;
    return choiceItem(R, {
      family: 'audit', n,
      prompt: `A wall is drawn ${A(`${mixH(W)} in`)} long on a plan at ${A('1 in')} : ${B(`${k} ft`)}. Does a ${B(`${couch}-ft`)} couch fit along it?`,
      board: `${mixT(W)}\\text{ in} \\times ${k} = \\ ?\\text{ ft}`,
      opts: [
        { t: `${fits ? 'Yes' : 'No'}: the wall is ${fmt(real)} ft, ${fits ? 'long enough' : 'too short'} for ${couch} ft.`, ok: true, say: `Right: ${mixS(W)} × ${k} = ${fmt(real)} ft, and ${couch} ft ${fits ? 'fits' : 'does not fit'}.` },
        { t: `${fits ? 'No' : 'Yes'}: the wall is ${fmt(real)} ft, ${fits ? 'too short' : 'long enough'} for ${couch} ft.`, say: `Compare again: ${fmt(real)} ft against ${couch} ft.` },
        { t: `No: the wall is only ${mixS(W)} ft long.`, mc: MC.drawingAsActual, say: `${mixS(W)} is the PLAN length, in inches. The real wall is ${mixS(W)} × ${k} = ${fmt(real)} ft.` },
      ],
      solution: [`${mixS(W)} × ${k} = ${fmt(real)} ft.`, `${fmt(real)} ft ${fits ? '≥' : '<'} ${couch} ft: it ${fits ? 'fits' : 'does not fit'}.`],
    });
  }
  // a model in inches at 1 : N, answer wanted in feet: correct (either order), reversed, missing conversion, both
  const N = pick(R, [24, 48]), d = N === 48 ? int(R, 1, 3) : int(R, 2, 6), inch = d * N, ft = inch / 12, kind = int(R, 0, 3);
  const thing = sized(R, MODELS, inch, 'in');
  const lines = kind === 0 ? (R() < 0.5 ? `${d} \\times ${N} = ${inch}\\text{ in} = ${ft}\\text{ ft}` : `\\begin{array}{l} ${N} \\div 12 = ${N / 12}\\text{, so } 1\\text{ in} : ${N / 12}\\text{ ft} \\\\ ${d} \\times ${N / 12} = ${ft}\\text{ ft} \\end{array}`)
    : kind === 1 ? `${d} \\div ${N} ${eqT(d / N)}\\text{ in} ${eqT(d / N / 12)}\\text{ ft}`
      : kind === 2 ? `${d} \\times ${N} = ${inch}\\text{ ft}`
        : `${d} \\div ${N} ${eqT(d / N)}\\text{ ft}`;
  const L = ['It is correct.', 'Wrong: the scale step goes the wrong way.', 'Wrong: a unit conversion is missing.', 'Wrong: both of those.'];
  const say = [
    `${d} × ${N} = ${inch} in = ${ft} ft.`,
    `Check the direction: the real ${thing} is bigger, so × ${N}.`,
    `Check the units: 1 : ${N} keeps inches, so convert to feet.`,
    `Check both: the direction (× ${N}) AND the unit (÷ 12 for feet).`,
  ];
  return choiceItem(R, {
    family: 'audit', n, prompt: `A model ${thing} at ${S(`1 : ${N}`)} is ${A(`${d} in`)} long. Here is a solution for the real length in feet. Check all of it.`,
    board: lines,
    opts: L.map((t, i) => i === kind ? { t, ok: true, say: kind === 0 ? `Right: it is correct. ${say[0]}` : `Right. ${say[i]} The real ${thing} is ${ft} ft.` }
      : { t, mc: kind === 0 ? MC.everyError : kind === 3 && (i === 1 || i === 2) ? MC.stopsAudit : undefined, say: kind === 0 ? `Not every solution has a slip. Check: ${say[0]}` : say[kind]! }),
    solution: [`Direction: the real ${thing} is bigger, × ${N}: ${inch} in.`, `Units: ${inch} in ÷ 12 = ${ft} ft.`],
  });
};

// ================= second and third families per sub-goal (different structure, not just new numbers) =================

// 1: pick the pair that fits (additive and reversed pairs as distractors)
const whichPair: Gen = (R, n) => {
  const [dU, aU, k] = pick(R, UNIT_SCALES), d = int(R, 2, 9), y = d * k;
  return choiceItem(R, {
    family: 'whichPair', n, prompt: `A plan uses ${A(`1 ${dU}`)} : ${B(`${k} ${aU}`)}. Which pair could be a length on the plan and the matching real length?`,
    board: `1\\text{ ${dU}} : ${k}\\text{ ${aU}}`,
    opts: [
      { t: `${d} ${dU} on the plan, ${y} ${aU} real`, ok: true, say: `Right: ${d} × ${k} = ${y}. Every pair has the same factor, × ${k}.` },
      { t: `${d} ${dU} on the plan, ${d + k - 1} ${aU} real`, mc: MC.additive, say: `That adds ${k - 1}. A scale multiplies: ${d} ${dU} is ${d} × ${k} = ${y} ${aU}.` },
      { t: `${y} ${dU} on the plan, ${d} ${aU} real`, mc: MC.reverse, say: `That swaps them. The plan length is the small number: ${d} ${dU} for ${y} ${aU}.` },
    ],
    solution: [`Each ${dU} stands for ${k} ${aU}: multiply the plan length by ${k}.`, `${d} ${dU} → ${y} ${aU}.`],
  });
};

// 2: a unitless scale, which real length (one unit on both sides)
const sameUnitPick: Gen = (R, n) => {
  const N = pick(R, [20, 50, 100]), d = int(R, N === 20 ? 3 : 2, 9), u: U = R() < 0.6 ? 'cm' : 'in', big = u === 'cm' ? 'm' : 'ft', y = d * N;
  const thing = sized(R, [...BIG, 'dog house', 'canoe'], y, u);
  return choiceItem(R, {
    family: 'sameUnitPick', n, prompt: `A model ${thing} is built at ${S(`1 : ${N}`)}. The model is ${A(`${d} ${u}`)} long. Which is the length of the real ${thing}?`,
    board: `1 : ${N}`,
    opts: [
      { t: `${fmt(y)} ${u}`, ok: true, say: `Right: no units means one unit on both sides. ${d} × ${N} = ${fmt(y)} ${u}.` },
      { t: `${fmt(y)} ${big}`, mc: MC.mixedUnitless, say: `1 : ${N} has no units, so it is ${u} for ${u}: ${fmt(y)} ${u}, not ${big}.` },
      { t: `${fmt(r9(d / N))} ${u}`, mc: MC.reverse, say: `The real ${thing} is the big one: × ${N}, not ÷ ${N}.` },
    ],
    solution: [`1 : ${N}: 1 ${u} of model for ${N} ${u} real.`, `${d} × ${N} = ${fmt(y)} ${u}.`],
  });
};

// 3: the arrow back on an arrow diagram
const arrowBack: Gen = (R, n) => {
  const t = int(R, 0, 2), k = int(R, 2, 12);
  const [sc, from, to, fw, bw] = t === 0 ? [`1 in : ${k} ft`, 'plan inches', 'real feet', `× ${k}`, `÷ ${k}`]
    : t === 1 ? [`1 : ${k}`, 'model', 'real thing', `× ${k}`, `÷ ${k}`]
      : [`${k} : 1`, 'drawing', 'real insect', `÷ ${k}`, `× ${k}`];
  return choiceItem(R, {
    family: 'arrowBack', n, prompt: `On the arrow diagram for the scale ${S(sc)}, the arrow from the ${from} to the ${to} says ${S(fw)}. What does the arrow back say?`,
    board: `\\text{${from}} \\xrightarrow{${fw.replace('×', '\\times').replace('÷', '\\div')}} \\text{${to}}`,
    opts: [
      { t: bw, ok: true, say: `Right: the step back undoes ${fw} with the same factor: ${bw}.` },
      { t: fw, mc: MC.sameFactor, say: `${fw} again would go further, not back. The step back undoes it: ${bw}.` },
      { t: `${fw.startsWith('×') ? '−' : '+'} ${k}`, mc: MC.additive, say: `A scale multiplies or divides; it does not add or take away. Undo ${fw} with ${bw}.` },
    ],
    solution: [`Forward: ${fw}.`, `Back: undo it with the same factor, ${bw}.`],
  });
};

// 4: a room on the plan: the real perimeter, or how much longer than wide
const roomCalc: Gen = (R, n) => {
  const k = pick(R, [4, 6, 8, 10, 12]), Wmin = Math.max(2, Math.ceil(10 / k)), L = int(R, Math.max(3, Wmin + 1), 8), W = int(R, Wmin, L - 1), per = R() < 0.5;
  const thing = sizedBoth(R, ['living room', 'garage', 'classroom', 'kitchen', 'basement', 'shed', 'gym', 'warehouse'], L * k, W * k, 'ft');   // a room at least 10 ft wide
  const ans = per ? 2 * (L + W) * k : (L - W) * k;
  return numItem({
    family: 'roomCalc', n, unit: 'ft', ans,
    prompt: per ? `A ${thing} is drawn ${A(`${L} in`)} by ${A(`${W} in`)} on a plan at ${A('1 in')} : ${B(`${k} ft`)}. How far is it all the way around the real ${thing}?`
      : `A ${thing} is drawn ${A(`${L} in`)} by ${A(`${W} in`)} on a plan at ${A('1 in')} : ${B(`${k} ft`)}. How much longer is the real ${thing} than it is wide?`,
    board: `${L}\\text{ in} \\times ${W}\\text{ in}, \\quad 1\\text{ in} : ${k}\\text{ ft}`,
    solution: per ? [`Real sides: ${L} × ${k} = ${L * k} ft and ${W} × ${k} = ${W * k} ft.`, `Around: 2 × (${L * k} + ${W * k}) = ${mark(`${ans} ft`)}.`]
      : [`Real sides: ${L * k} ft and ${W * k} ft.`, `${L * k} − ${W * k} = ${mark(`${ans} ft`)} (or ${L - W} in × ${k}).`],
    work: per ? [`2 \\times (${L * k} + ${W * k}) = ${ans}\\text{ ft}`] : [`${L * k} - ${W * k} = ${ans}\\text{ ft}`],
    wrongs: per ? [{ v: 2 * (L + W), mc: MC.drawingAsActual, say: `${2 * (L + W)} is the way around the PLAN, in inches. Each inch is ${k} ft.` }, { v: (L + W) * k, say: `That is two sides. The way around has four: two lengths and two widths.` }]
      : [{ v: L - W, mc: MC.drawingAsActual, say: `${L - W} in is the difference on the PLAN. In real feet: × ${k}.` }, { v: L * k, say: `${L * k} ft is the real length. How much longer is it than the real width, ${W * k} ft?` }],
    miss: `Turn each side into real feet (× ${k}) first.`,
  });
};

// 5: which calculation multiplies every part of a mixed number
const mixedPick: Gen = (R, n) => {
  const k = pick(R, [4, 8, 12]), w = int(R, 1, 6), f = pick(R, [0.25, 0.5, 0.75]), d = w + f;
  const thing = sized(R, HOUSE, d * k, 'ft');
  return choiceItem(R, {
    family: 'mixedPick', n, prompt: `On a plan at ${A('1 in')} : ${B(`${k} ft`)}, a ${thing} is ${A(`${mixH(d)} in`)} long. Which calculation gives its real length?`,
    board: `${mixT(d)}\\text{ in} \\to\\ ?\\text{ ft}`,
    opts: [
      { t: `${w} × ${k} + ${mixS(f)} × ${k}`, ok: true, say: `Right: every part of ${mixS(d)} gets × ${k}: ${w * k} + ${fmt(f * k)} = ${fmt(d * k)} ft.` },
      { t: `${w} × ${k} + ${mixS(f)}`, mc: MC.partByPart, say: `The ${mixS(f)} inch stands for feet too: it needs × ${k} as well.` },
      { t: `${mixS(d)} ÷ ${k}`, mc: MC.divides, say: `Plan → real multiplies: each inch is ${k} ft.` },
    ],
    solution: [`${mixS(d)} = ${w} + ${mixS(f)}.`, `${w} × ${k} + ${mixS(f)} × ${k} = ${fmt(d * k)} ft.`],
  });
};

// 6: compute a drawing length, then decide whether it fits on the paper
const fitPaper: Gen = (R, n) => {
  const k = pick(R, [4, 8]), P = pick(R, [8.5, 11]), q = r9(P + pick(R, [-1.5, -1, -0.5, -0.25, 0.25, 0.5, 1])), y = r9(q * k), fits = q <= P;
  const thing = sized(R, ['soccer field', 'parking lot', 'backyard', 'basketball court', 'garden', 'barn'], y, 'ft');
  return choiceItem(R, {
    family: 'fitPaper', n, prompt: `A ${thing} is ${B(`${fmt(y)} ft`)} long. Can it be drawn at ${A('1 in')} : ${B(`${k} ft`)} across a sheet of paper ${A(`${fmt(P)} in`)} wide?`,
    board: `${fmtT(y)}\\text{ ft} \\to\\ ?\\text{ in}`,
    opts: [
      { t: `${fits ? 'Yes' : 'No'}: it is ${fmt(q)} in on the plan, ${fits ? 'less' : 'more'} than ${fmt(P)} in.`, ok: true, say: `Right: ${fmt(y)} ÷ ${k} = ${fmt(q)} in, and that ${fits ? 'fits' : 'does not fit'} across ${fmt(P)} in.` },
      { t: `${fits ? 'No' : 'Yes'}: it is ${fmt(q)} in on the plan, ${fits ? 'more' : 'less'} than ${fmt(P)} in.`, say: `Compare again: ${fmt(q)} in against ${fmt(P)} in.` },
      { t: `No: it is ${fmt(y * k)} in on the plan.`, mc: MC.wrongOp, say: `Real → plan undoes × ${k}: ${fmt(y)} ÷ ${k}, not × ${k}.` },
    ],
    solution: [`Real → plan: ${fmt(y)} ÷ ${k} = ${fmt(q)} in.`, `${fmt(q)} in ${fits ? '≤' : '>'} ${fmt(P)} in.`],
  });
};

// 8: the ratio-table row per ONE drawing unit
const NONUNIT: [number, U, number, U][] = [[0.25, 'in', 1, 'ft'], [0.5, 'in', 1, 'ft'], [0.5, 'in', 3, 'ft'], [0.25, 'in', 2, 'ft'], [0.25, 'in', 3, 'ft'], [2, 'cm', 5, 'm'], [2, 'cm', 3, 'm'], [4, 'cm', 5, 'm'], [4, 'cm', 10, 'm']];
const normTable: Gen = (R, n) => {
  const [d, dU, a, aU] = pick(R, NONUNIT), s = scale(d, dU, a, aU), k = per(s), cust = !isMetric(dU);
  const dTxt = cust ? mixS(d) : fmt(d), both = r9(a * d);
  const style = R() < 0.5;
  return choiceItem(R, {
    family: 'normTable', n,
    prompt: style ? `A plan uses ${A(`${cust ? mixH(d) : fmt(d)} ${dU}`)} : ${B(`${a} ${aU}`)}. Which row of its ratio table is right?`
      : `On a plan, ${A(`${cust ? mixH(d) : fmt(d)} ${dU}`)} stands for ${B(`${a} ${aU}`)}. What does ${A(`1 ${dU}`)} stand for?`,
    board: `${cust ? mixT(d) : fmtT(d)}\\text{ ${dU}} : ${a}\\text{ ${aU}}`,
    opts: [
      { t: `1 ${dU} → ${fmt(k)} ${aU}`, ok: true, say: `Right: scale both by the same factor: ${dTxt} ${dU} → ${a} ${aU} becomes 1 ${dU} → ${fmt(k)} ${aU}.` },
      { t: `1 ${dU} → ${a} ${aU}`, mc: MC.nonunit, say: `${a} ${aU} goes with ${dTxt} ${dU}, not with 1 ${dU}. Scale both to get 1 ${dU}.` },
      { t: `1 ${dU} → ${fmt(both)} ${aU}`, mc: MC.wrongOp, say: `To get from ${dTxt} ${dU} to 1 ${dU} you ${d < 1 ? 'multiply' : 'divide'} by ${fmt(d < 1 ? 1 / d : d)}. Do the same to the ${a} ${aU}.` },
    ],
    solution: [`${dTxt} ${dU} → ${a} ${aU}.`, `${d < 1 ? '×' : '÷'} ${fmt(d < 1 ? 1 / d : d)} on both sides: 1 ${dU} → ${fmt(k)} ${aU}.`],
  });
};

// 9: from a unitless scale back to a scale with units
const unitsBack: Gen = (R, n) => {
  const t = int(R, 0, 5);
  const [dU, aU, k] = t <= 2 ? ['in', 'ft', int(R, 2, 10)] as [U, U, number] : t <= 4 ? ['cm', 'm', int(R, 1, 9)] as [U, U, number] : ['in', 'yd', int(R, 1, 3)] as [U, U, number];
  const f = factorOf(aU, dU), N = k * f;
  return numItem({
    family: 'unitsBack', n, unit: aU, ans: k,
    prompt: `A plan is drawn at ${S(`1 : ${fmt(N)}`)}. Write it with units: ${A(`1 ${dU}`)} stands for how many ${WORD[aU][1]}?`,
    board: `1 : ${fmtT(N)} = 1\\text{ ${dU}} : \\ ?\\text{ ${aU}}`,
    solution: [`1 : ${fmt(N)}: 1 ${dU} stands for ${fmt(N)} ${dU}.`, `${fmt(N)} ${dU} ÷ ${f} = ${k} ${aU}.`], work: [`${fmtT(N)}\\text{ ${dU}} \\div ${f} = ${k}\\text{ ${aU}}`],
    wrongs: [
      { v: N, mc: MC.notConverted, say: `${fmt(N)} is in ${WORD[dU][1]}, the same unit as the 1. Turn it into ${WORD[aU][1]}.` },
      ...(aU === 'ft' ? [{ v: r9(N / 10), mc: MC.base10, say: `A foot is 12 inches, not 10: ÷ 12.` }] : []),
      { v: r9(N * f), mc: MC.convDir, say: `A ${WORD[aU][0]} is bigger than a ${WORD[dU][0]}, so there are FEWER of them: ÷ ${f}.` },
    ],
    miss: `How many ${WORD[aU][1]} are ${fmt(N)} ${WORD[dU][1]}?`,
  });
};

// 10: which conversion makes the given length fit the scale
const convertFirst: Gen = (R, n) => {
  if (R() < 0.55) {
    const k = pick(R, [2, 3, 4, 6, 8]), Y = pick(R, [3, 6, 9, 12]);
    return choiceItem(R, {
      family: 'convertFirst', n, prompt: `A plan uses ${A('1 in')} : ${B(`${k} ft`)}. A real fence is ${B(`${Y} yd`)} long. Which first step makes the length fit the scale?`,
      board: `1\\text{ in} : ${k}\\text{ ft}, \\quad ${Y}\\text{ yd}`,
      opts: [
        { t: `${Y} yd = ${3 * Y} ft`, ok: true, say: `Right: the scale counts feet. A yard is 3 feet, so ${Y} yd = ${3 * Y} ft. Then ÷ ${k}.` },
        { t: `${Y} yd = ${Y} ft`, mc: MC.relabel, say: `The number has to change when the unit does: a yard is 3 feet.` },
        { t: `${Y} yd = ${fmt(Y / 3)} ft`, mc: MC.convDir, say: `A foot is smaller than a yard, so there are MORE feet: × 3.` },
      ],
      solution: [`The scale is in feet: change ${Y} yd to feet.`, `${Y} × 3 = ${3 * Y} ft, then ${3 * Y} ÷ ${k} = ${fmt(r9(3 * Y / k))} in.`],
    });
  }
  const N = pick(R, [20, 50, 100, 200]), M = pick(R, [2, 3, 4, 5, 6, 8, 10, 12]);
  return choiceItem(R, {
    family: 'convertFirst', n, prompt: `A model is built at ${S(`1 : ${N}`)} and measured in centimeters. The real ${sized(R, BIG, M, 'm')} is ${B(`${M} m`)} long. Which first step works?`,
    board: `1 : ${N}, \\quad ${M}\\text{ m}`,
    opts: [
      { t: `${M} m = ${M * 100} cm`, ok: true, say: `Right: ${M} m = ${M * 100} cm, then ${M * 100} ÷ ${N} = ${fmt(r9(M * 100 / N))} cm.` },
      { t: `${M} m = ${M} cm`, mc: MC.relabel, say: `The number has to change with the unit: a meter is 100 cm.` },
      { t: `${M} m = ${fmt(r9(M / 100))} cm`, mc: MC.convDir, say: `A centimeter is smaller than a meter, so there are MORE of them: × 100.` },
    ],
    solution: [`A meter is 100 cm.`, `${M} m = ${M * 100} cm; then ÷ ${N}.`],
  });
};

// 11: the same length in a sensible unit
const sensibleUnit: Gen = (R, n) => {
  if (R() < 0.6) {
    const N = pick(R, [12, 24, 48]), d = N === 48 ? int(R, 1, 3) : N === 24 ? int(R, 2, 6) : int(R, 2, 12), I = d * N, thing = sized(R, MODELS, I, 'in');
    return choiceItem(R, {
      family: 'sensibleUnit', n, prompt: `A ${A(`${d} in`)} model ${thing} at ${S(`1 : ${N}`)} gives a real length of ${B(`${I} in`)}. Which is the same length in feet?`,
      board: `${d} \\times ${N} = ${I}\\text{ in}`,
      opts: [
        { t: `${I / 12} ft`, ok: true, say: `Right: 12 inches make a foot, so ${I} ÷ 12 = ${I / 12} ft.` },
        { t: `${fmt(r9(I / 10))} ft`, mc: MC.base10, say: `A foot is 12 inches, not 10: ÷ 12.` },
        { t: `${I} ft`, mc: MC.relabel, say: `${I} INCHES is not ${I} feet: the number changes with the unit.` },
      ],
      solution: [`${I} in ÷ 12 = ${I / 12} ft.`, `Check: ${I / 12} × 12 = ${I} in.`],
    });
  }
  const N = pick(R, [50, 100, 200]), d = int(R, 2, 9), C = d * N;
  return choiceItem(R, {
    family: 'sensibleUnit', n, prompt: `A ${A(`${d} cm`)} line on a ${S(`1 : ${N}`)} plan gives a real length of ${B(`${fmt(C)} cm`)}. Which is the same length in meters?`,
    board: `${d} \\times ${N} = ${fmtT(C)}\\text{ cm}`,
    opts: [
      { t: `${fmt(C / 100)} m`, ok: true, say: `Right: 100 cm make a meter, so ${fmt(C)} ÷ 100 = ${fmt(C / 100)} m.` },
      { t: `${fmt(C / 10)} m`, mc: MC.sizeErr, say: `A meter is 100 cm, not 10: ÷ 100.` },
      { t: `${fmt(C)} m`, mc: MC.relabel, say: `${fmt(C)} CENTIMETERS is not ${fmt(C)} meters: the number changes with the unit.` },
    ],
    solution: [`${fmt(C)} cm ÷ 100 = ${fmt(C / 100)} m.`, `Check: ${fmt(C / 100)} × 100 = ${fmt(C)} cm.`],
  });
};

// 12: which two lengths make the scale (a distractor length in the story)
const pairPick: Gen = (R, n) => {
  const k = pick(R, [2, 4, 6, 8, 10, 12]), d = int(R, 2, 6), y = d * k;
  let e = int(R, 2, 8); if (e === d) e = d + 1;
  const [a, b] = pick(R, [['garage door', 'side wall'], ['porch', 'driveway'], ['kitchen', 'hallway'], ['deck', 'fence'], ['pool', 'patio']] as [string, string][]);
  return choiceItem(R, {
    family: 'pairPick', n, prompt: `On a house plan, the ${a} is ${A(`${d} in`)} and the ${b} is ${A(`${e} in`)}. The real ${a} is ${B(`${y} ft`)}. Which two lengths give the scale?`,
    board: `\\text{drawing} : \\text{actual}`,
    opts: [
      { t: `The plan's ${a}, ${d} in, and the real ${a}, ${y} ft`, ok: true, say: `Right: the same part on the plan and in real life. ${d} in : ${y} ft = 1 in : ${k} ft.` },
      { t: `The plan's ${b}, ${e} in, and the real ${a}, ${y} ft`, mc: MC.noncorr, say: `Those are different parts of the house. Pair the ${a} with the ${a}.` },
      { t: `The real ${a}, ${y} ft, first, then the plan's ${a}, ${d} in`, mc: MC.reverse, say: `Right parts, wrong order: a scale is drawing first, actual second.` },
    ],
    solution: [`Match the same part: the ${a}.`, `${d} in : ${y} ft = 1 in : ${k} ft.`],
  });
};

// 13: which answer can be true (direction and unit sense)
const plausible: Gen = (R, n) => {
  const N = pick(R, [20, 25, 50, 100]), M = int(R, 4, 20), r = r9(100 * M / N);
  const thing = sized(R, ['bus', 'boat', 'barn', 'bridge', 'fire truck', 'train car'], M, 'm');
  return choiceItem(R, {
    family: 'plausible', n, prompt: `A model ${thing} is built at ${S(`1 : ${N}`)}. The real ${thing} is ${B(`${M} m`)} long. Which model length makes sense?`,
    board: `1 : ${N}, \\quad ${M}\\text{ m}`,
    opts: [
      { t: `${fmt(r)} cm`, ok: true, say: `Right: smaller than the real ${thing}, and the right size: ${M} m = ${M * 100} cm, ÷ ${N} = ${fmt(r)} cm.` },
      { t: `${fmt(M * N)} m`, mc: MC.wrongOp, say: `A model ${fmt(M * N)} m long would be bigger than the real ${thing}. A model is smaller: ÷ ${N}.` },
      { t: `${fmt(r9(M / N))} cm`, mc: MC.relabel, say: `${M} ÷ ${N} = ${fmt(r9(M / N))} is in METERS. In centimeters it is ${fmt(r)} cm.` },
    ],
    solution: [`The model must be smaller than the ${thing}: ÷ ${N}.`, `${M} m = ${M * 100} cm; ${M * 100} ÷ ${N} = ${fmt(r)} cm.`],
  });
};

// 14: fix a reversed step (type the corrected value)
const fixRev: Gen = (R, n) => {
  const k = pick(R, [4, 8, 10]);
  if (R() < 0.5) {
    const q = pick(R, [1.5, 2, 2.5, 3, 3.5, 4, 5]), y = r9(q * k), s = scale(1, 'in', k, 'ft');
    return numItem({
      family: 'fixRev', n, unit: 'in', ans: q,
      prompt: `Ana's plan uses ${A('1 in')} : ${B(`${k} ft`)}. For a ${B(`${fmt(y)} ft`)} wall she wrote ${fmt(y)} × ${k} = ${fmt(y * k)} in. Fix it: how long is the wall on the plan?`,
      board: `${fmtT(y)} \\times ${k} = ${fmtT(y * k)}\\text{ in}`,
      solution: [`Feet → plan inches undoes × ${k}: ÷ ${k}.`, `${fmt(y)} ÷ ${k} = ${mark(`${fmt(q)} in`)}. Check: ${fmt(q)} × ${k} = ${fmt(y)} ft.`], work: [`${fmtT(y)} \\div ${k} = ${fmtT(q)}\\text{ in}`],
      wrongs: [{ v: r9(y * k), mc: MC.arithOnly, say: `That keeps Ana's × ${k}. The operation is the slip: going back to the plan divides.` }],
      miss: `Divide: ${fmt(y)} ÷ ${k}.`, pic: pic2(s, { row: 1, v: y }, { row: 0, v: q }),
    });
  }
  const d = int(R, 2, 6), s = scale(1, 'in', k, 'ft');
  return numItem({
    family: 'fixRev', n, unit: 'ft', ans: d * k,
    prompt: `Ana's plan uses ${A('1 in')} : ${B(`${k} ft`)}. A wall is ${A(`${d} in`)} on the plan, and she wrote ${d} ÷ ${k} = ${fmt(r9(d / k))} ft. Fix it: how long is the real wall?`,
    board: `${d} \\div ${k} = ${fmtT(r9(d / k))}\\text{ ft}`,
    solution: [`Plan → real multiplies: each inch is ${k} ft.`, `${d} × ${k} = ${d * k} ft.`], work: [`${d} \\times ${k} = ${d * k}\\text{ ft}`],
    wrongs: [{ v: r9(d / k), mc: MC.arithOnly, say: `That keeps Ana's ÷ ${k}. The real wall is the long one: × ${k}.` }],
    miss: `Multiply: ${d} × ${k}.`, pic: pic2(s, { row: 0, v: d }, { row: 1, v: d * k }),
  });
};

// 15: how many times too big or too small (the size of a conversion slip)
const sizeError: Gen = (R, n) => {
  const t = int(R, 0, 3);
  let prompt = '', board = '', F = 0, wrongV = 0, rightV = 0, unit = '';
  if (t === 0) {
    const N = pick(R, [50, 100, 200]), d = int(R, 2, 9); F = 100; wrongV = d * N; rightV = r9(wrongV / 100); unit = 'm';
    prompt = `At ${S(`1 : ${N}`)}, Ben turned a ${A(`${d} cm`)} plan line into ${B(`${fmt(wrongV)} m`)}. The real length is ${fmt(rightV)} m. How many times too big is Ben's answer?`;
    board = `${d} \\times ${N} = ${fmtT(wrongV)}\\text{ m}`;
  } else if (t === 1) {
    const N = pick(R, [12, 24, 48]), d = int(R, 1, 4); F = 12; wrongV = d * N; rightV = wrongV / 12; unit = 'ft';
    prompt = `A model at ${S(`1 : ${N}`)} is ${A(`${d} in`)}. Ben wrote the real length as ${B(`${wrongV} ft`)}, but it is ${rightV} ft. How many times too big is Ben's answer?`;
    board = `${d} \\times ${N} = ${wrongV}\\text{ ft}`;
  } else if (t === 2) {
    const k = pick(R, [2, 4]), Y = pick(R, [2, 4, 6, 8, 10]); F = 3; wrongV = r9(Y / k); rightV = r9(3 * Y / k); unit = 'in';
    prompt = `At ${A('1 in')} : ${B(`${k} ft`)}, Ben drew a ${B(`${Y} yd`)} hedge ${A(`${fmt(wrongV)} in`)} long, without changing yards to feet. It should be ${fmt(rightV)} in. How many times too small is Ben's line?`;
    board = `${Y} \\div ${k} = ${fmtT(wrongV)}\\text{ in}`;
  } else {
    const N = pick(R, [5, 10, 20]), d = int(R, 2, 9); F = 10; wrongV = d * N; rightV = d * N / 10; unit = 'cm';
    prompt = `A model at ${S(`1 : ${N}`)} is ${A(`${d} mm`)} long. Ben wrote the real length as ${B(`${wrongV} cm`)}, but it is ${fmt(rightV)} cm. How many times too big is Ben's answer?`;
    board = `${d} \\times ${N} = ${wrongV}\\text{ cm}`;
  }
  const big = Math.max(wrongV, rightV), small = Math.min(wrongV, rightV);
  return numItem({
    family: 'sizeError', n, unit: 'times', ans: F, prompt, board,
    solution: [`Compare by dividing: ${fmt(big)} ÷ ${fmt(small)} = ${F}.`, `That is the missing conversion: ${t === 0 ? '100 cm in a meter' : t === 1 ? '12 in in a foot' : t === 2 ? '3 ft in a yard' : '10 mm in a centimeter'}.`],
    wrongs: [
      { v: r9(big - small), mc: MC.diffFactor, say: `That is how much bigger, not how many times. Divide: ${fmt(big)} ÷ ${fmt(small)}.` },
      ...(F !== 10 ? [{ v: 10, mc: t === 0 ? MC.sizeErr : MC.base10, say: `The units here are ${t === 0 ? 'cm and m: 100' : t === 1 ? 'inches and feet: 12' : 'yards and feet: 3'} apart, not 10.` }] : []),
    ],
    miss: `How many times does ${fmt(small)} fit into ${fmt(big)}?`, ok: `Right: ${F} times. ${t === 0 ? 'Ben forgot that 100 cm make a meter.' : t === 1 ? 'Ben forgot that 12 in make a foot.' : t === 2 ? 'Ben forgot that a yard is 3 feet.' : 'Ben forgot that 10 mm make a centimeter.'}`,
  });
};

// 16: check a whole solution, then type the right answer
const auditFix: Gen = (R, n) => {
  const N = pick(R, [24, 48]), d = N === 48 ? int(R, 1, 3) : int(R, 2, 6), inch = d * N, ft = inch / 12, kind = int(R, 0, 3);
  const thing = sized(R, MODELS, inch, 'in');
  const shown = kind === 0 ? ft : kind === 1 ? r2(d / N / 12) : kind === 2 ? inch : r2(d / N);
  const lines = kind === 0 ? `${d} \\times ${N} = ${inch}\\text{ in} = ${ft}\\text{ ft}`
    : kind === 1 ? `${d} \\div ${N} ${eqT(d / N)}\\text{ in} ${eqT(d / N / 12)}\\text{ ft}`
      : kind === 2 ? `${d} \\times ${N} = ${inch}\\text{ ft}` : `${d} \\div ${N} ${eqT(d / N)}\\text{ ft}`;
  const wr: Wrong[] = [];
  if (kind !== 0) wr.push({ v: shown, mc: MC.benchmark, say: `That keeps the solution as it is. A real ${thing} ${fmt(shown)} ft long? Check the direction and the units.` });
  if (kind === 3) wr.push({ v: inch, mc: MC.stopsAudit, say: `The direction is fixed now, but ${inch} is still inches. Check the units too.` }, { v: r2(d / N / 12), mc: MC.stopsAudit, say: `The units are fixed now, but the step still goes the wrong way. The real ${thing} is bigger: × ${N}.` });
  if (kind === 2) wr.push({ v: inch * 12, mc: MC.convDir, say: `Feet are bigger than inches, so there are fewer of them: ÷ 12.` });
  return numItem({
    family: 'auditFix', n, unit: 'ft', ans: ft, wrongs: wr,
    prompt: `A model ${thing} at ${S(`1 : ${N}`)} is ${A(`${d} in`)} long. Here is a solution for the real length in feet. Check all of it, then type the right real length.`,
    board: lines,
    solution: [`Direction: the real ${thing} is bigger, × ${N}: ${inch} in.`, `Units: ${inch} in ÷ 12 = ${ft} ft.`], work: [`${d} \\times ${N} = ${inch}\\text{ in}`, `${inch} \\div 12 = ${ft}\\text{ ft}`],
    miss: `Check the direction (× ${N}) and the unit (÷ 12 for feet).`, ok: kind === 0 ? `Right: ${ft} ft. That solution was correct already.` : `Right: ${ft} ft.`,
  });
};

/** "a 8 ft rope" → "an 8 ft rope", "A $80 jacket" → "An $80 jacket", "a 18% tip" → "an 18% tip": the article as the number is spoken */
const anFix = (h: string) => h
  .replace(/(^|[.?!:]\s+|“)A ((?:<b[^>]*>)*\$?(?:8|1[18](?![\d])))/g, '$1An $2')
  .replace(/(\s|\()a ((?:<b[^>]*>)*\$?(?:8|1[18](?![\d])))/g, '$1an $2')
  .replace(/(^|[.?!:]\s+|“)A ((?:<b[^>]*>)*ant\b)/g, '$1An $2').replace(/(\s|\()a ((?:<b[^>]*>)*ant\b)/g, '$1an $2');
/** every generator's text reads its articles right (prompt, choices, worked solution) */
const withArticles = <G extends (R: () => number, n: number, sg?: string) => Item>(g: G): G => ((R: () => number, n: number, sg?: string) => {
  const it = g(R, n, sg);
  it.prompt = anFix(it.prompt);
  it.solution = it.solution.map(anFix);
  if (it.choices) it.choices = it.choices.map(anFix);
  return it;
}) as G;
const RAW_GENERATORS: Record<FamilyId, Gen> = {
  table, order, unitless, unitlessCalc, predict, reverse, toActual, toDrawing, rulerRead, fracForm,
  normalize, toUnitless, convertIn, convertOut, findScale, reasonable, diagnoseRev, diagnoseConv, audit,
  whichPair, sameUnitPick, arrowBack, roomCalc, mixedPick, fitPaper, normTable, unitsBack, convertFirst,
  sensibleUnit, pairPick, plausible, fixRev, sizeError, auditFix,
};
export const GENERATORS = Object.fromEntries(Object.entries(RAW_GENERATORS).map(([k, g]) => [k, withArticles(g)])) as Record<FamilyId, Gen>;
