// items.ts: practice families for "Read a map: map key, scale, and estimating distance"
// (primary.geometry.read-map-scale-legend-distance). Every family builds its own map picture (mapGen.compose) with
// the overlays the question needs (ask: id 'a') and the worked solution replays (ids 's0', 's1', ...), checks the
// answer exactly, and maps typical slips to misconception ids from math-curriculum-essentials/misconceptions.json.
// Pure: no DOM, no canvas; a seeded rng makes sessions repeatable.
import { type Item, type Response, type Verdict, A, B, int, pick, shuffle } from '../../runtime/item';
import { type BarSpec, type LinePic, type MapPic, type MapUnit, type Overlay, type PlaceKind, type Pt, type RealUnit, type RoadKind, DIRS, FIELD, add,
  bigBarOrigin, dist, fh, fp, ft, fx, lineProblems, near, parts } from './mapMaths';
import { type ComposeSpec, type Geo, type Leg, bentLegs, compose, dirOf, fits, windingLegs } from './mapGen';
import type { Evidence } from './Evidence';

export type FamilyId = 'keyLookup' | 'symbolSize' | 'measurePoint' | 'sameEverywhere' | 'biggerMap' | 'barInterval' | 'barPoint'
  | 'whichDistance' | 'compareDist' | 'layBar' | 'countIntervals' | 'halfBar' | 'leftSub' | 'rulerRead' | 'shiftedRuler'
  | 'roundRuler' | 'roundCm' | 'unitScale' | 'unitPick' | 'barToUnit' | 'halfSections' | 'fracScale' | 'roundFirst'
  | 'estimateRange' | 'benchmarkName' | 'routeSum' | 'routeBar' | 'pickEvidence' | 'plausible' | 'whichReasonable'
  | 'errorSize' | 'whichMapWorse' | 'agree' | 'gapRead' | 'findError' | 'fixIt';
export const FAMILIES: readonly { id: FamilyId; name: string }[] = [
  { id: 'keyLookup', name: 'Read the map key' },
  { id: 'symbolSize', name: 'What a symbol shows' },
  { id: 'measurePoint', name: 'Where to measure from' },
  { id: 'sameEverywhere', name: 'One scale for the whole map' },
  { id: 'biggerMap', name: 'A bigger copy of the map' },
  { id: 'barInterval', name: 'One interval of the bar' },
  { id: 'barPoint', name: 'A mark on the bar' },
  { id: 'whichDistance', name: 'Road or straight line?' },
  { id: 'compareDist', name: 'Compare the two distances' },
  { id: 'layBar', name: 'Lay the whole bar along' },
  { id: 'countIntervals', name: 'Count the intervals' },
  { id: 'halfBar', name: 'Part of an interval' },
  { id: 'leftSub', name: 'The divided end of the bar' },
  { id: 'rulerRead', name: 'Measure with a ruler' },
  { id: 'shiftedRuler', name: 'A ruler not at 0' },
  { id: 'roundRuler', name: 'Nearest quarter inch' },
  { id: 'roundCm', name: 'Nearest half centimeter' },
  { id: 'unitScale', name: 'Use the verbal scale' },
  { id: 'unitPick', name: 'Which unit?' },
  { id: 'barToUnit', name: 'What one inch stands for' },
  { id: 'halfSections', name: 'Half-inch sections' },
  { id: 'fracScale', name: 'Fractions of an inch' },
  { id: 'roundFirst', name: 'Round now or later?' },
  { id: 'estimateRange', name: 'Estimate by eye' },
  { id: 'benchmarkName', name: 'Name your benchmark' },
  { id: 'routeSum', name: 'Add up the road' },
  { id: 'routeBar', name: 'A winding road' },
  { id: 'pickEvidence', name: 'Choose a fair check' },
  { id: 'plausible', name: 'Does it make sense?' },
  { id: 'whichReasonable', name: 'Which answer is reasonable?' },
  { id: 'errorSize', name: 'A small slip, a big error' },
  { id: 'whichMapWorse', name: 'Which map hurts more?' },
  { id: 'agree', name: 'Close enough?' },
  { id: 'gapRead', name: 'How far apart?' },
  { id: 'findError', name: 'Find the mistake' },
  { id: 'fixIt', name: 'Fix the work' },
];
export const FAMILY_NAMES: Record<string, string> = Object.fromEntries(FAMILIES.map(f => [f.id, f.name]));

// ---------- misconception ids (all in misconceptions.json; the test checks) ----------
export const MC = {
  edge: 'mc.measurement-units.measures-from-symbol-edge',
  symbol: 'mc.data-displays.symbol-appearance-as-object-property',
  equality: 'mc.ratio-rate.scale-statement-as-equality',
  enlarge: 'mc.ratio-rate.map-enlargement-changes-real-distance',
  drawing: 'mc.ratio-rate.drawing-length-used-as-actual',
  additive: 'mc.ratio-rate.additive-keep-difference',
  diffScale: 'mc.ratio-rate.different-segments-different-scale',
  points: 'mc.count.counts-points-not-intervals',
  barTotal: 'mc.measurement-units.scale-bar-total-as-one-interval',
  straight: 'mc.measurement-units.straight-line-for-route',
  subdiv: 'mc.fractions-concept.subdivision-read-as-whole-unit',
  roundsWrong: 'mc.measurement-units.rounds-reading-wrongly',
  partial: 'mc.estimation.partial-span-fixed-rounding',
  endReading: 'mc.measurement-units.end-reading-as-length',
  rulerEdge: 'mc.measurement-units.aligns-at-ruler-end-or-1',
  tenths: 'mc.measurement-units.fractional-ruler-spaces-as-tenths',
  roundWhole: 'mc.measurement-units.rounds-to-whole-unit-ignoring-increment',
  wrongUnit: 'mc.ratio-rate.wrong-unit-on-scale-result',
  wrongForm: 'mc.ratio-rate.wrong-form-proportional-equation',
  divRate: 'mc.ratio-rate.divides-by-rate-when-multiplying-needed',
  rateRev: 'mc.ratio-rate.unit-rate-division-reversed',
  wholePart: 'mc.decimals.operates-on-whole-part-only',
  roundFirst: 'mc.decimals.intermediate-precision-always-invalid',
  closeEnough: 'mc.estimation.close-estimate-always-good-enough',
  guess: 'mc.estimation.estimate-as-unanchored-guess',
  exact: 'mc.data-displays.visual-estimate-as-exact',
  oneLeg: 'mc.ratio-rate.scales-only-one-length-component',
  lostTrack: 'mc.area-perimeter.loses-track-around-the-boundary',
  repeat: 'mc.reasoning-language.check-by-repeating-same-steps',
  noSize: 'mc.estimation.accepts-result-without-size-check',
  ctxBench: 'mc.estimation.ignores-context-benchmark',
  errNotScaled: 'mc.estimation.error-not-scaled-through-operation',
  roughMatch: 'mc.measurement-units.rough-match-as-confirmation',
  allOrNothing: 'mc.reasoning-language.model-judged-all-or-nothing',
  changeAnswer: 'mc.reasoning-language.changes-answer-without-locating-error',
  singleCause: 'mc.reasoning-language.assumes-single-cause-for-mismatch',
} as const;

// ---------- the picture an item carries ----------
export type RmPic = {
  map?: MapPic;
  line?: LinePic;
  ev?: Evidence;
  /** more TeX lines on the board under item.board (recorded work, a second scale) */
  work?: string[];
  /** written on the board at the end of the worked solution (lime) */
  answer: string;
  /** solve steps s0 .. s(steps-1) */
  steps: number;
};
export interface RmItem extends Item { family: FamilyId; picture: RmPic }
type Gen = (R: () => number, n: number, sg?: string) => RmItem;

// ---------- words ----------
const realW = (v: number, u: RealUnit) => `${fh(v)} ${u === 'mi' ? (v === 1 ? 'mile' : 'miles') : (v === 1 ? 'kilometer' : 'kilometers')}`;
const mapW = (v: number, u: MapUnit) => `${fh(v)} ${u === 'in' ? (v === 1 ? 'inch' : 'inches') : (v === 1 ? 'centimeter' : 'centimeters')}`;
const realT = (u: RealUnit) => (u === 'mi' ? '\\text{ mi}' : '\\text{ km}');
const mapT = (u: MapUnit) => (u === 'in' ? '\\text{ in}' : '\\text{ cm}');
const oneU = (u: MapUnit) => (u === 'in' ? '1 inch' : '1 centimeter');
const realOf = (u: MapUnit): RealUnit => (u === 'in' ? 'mi' : 'km');
const capT = (s: string) => s.replace(/[\\{}$%#&_^~]/g, '');

// ---------- item makers ----------
interface Opt { t: string; ok?: boolean; mc?: string; say: string }
type Base = Omit<RmItem, 'input' | 'choices' | 'answer' | 'check' | 'unit'>;
function choiceItem(R: () => number, base: Base, opts: Opt[]): RmItem {
  const o = shuffle(R, [...opts]);
  const i = o.findIndex(x => x.ok);
  return {
    ...base, input: 'choice', choices: o.map(x => x.t), answer: { kind: 'choice', i },
    check: (r: Response): Verdict => {
      if (r.kind !== 'choice' || !o[r.i]) return { ok: false, say: 'Pick one answer.' };
      const x = o[r.i]!;
      return x.ok ? { ok: true, say: x.say } : { ok: false, mc: x.mc, say: x.say };
    },
  };
}
interface Slip { v: number; mc?: string; say: string }
const valueOf = (r: Response): number => {
  if (r.kind === 'num') return r.v;
  if (r.kind === 'frac') {
    if (!Number.isFinite(r.w) || !Number.isFinite(r.n) || !Number.isFinite(r.d) || r.d <= 0 || r.n < 0 || r.w < 0) return NaN;
    return r.w + r.n / r.d;
  }
  return NaN;
};
function numItem(base: Base, input: 'num' | 'frac', unit: string, ans: number, okSay: string, slips: Slip[], general: string): RmItem {
  const p = parts(ans);
  return {
    ...base, input, unit,
    answer: input === 'num' ? { kind: 'num', v: ans } : { kind: 'frac', w: p.w, n: p.n, d: p.d },
    check: (r: Response): Verdict => {
      const v = valueOf(r);
      if (!Number.isFinite(v)) return { ok: false, say: 'Type a number first.' };
      if (near(v, ans)) return { ok: true, say: okSay };
      const s = slips.find(x => near(x.v, v) && !near(x.v, ans));
      return s ? { ok: false, mc: s.mc, say: s.say } : { ok: false, say: general };
    },
  };
}

// ---------- map helpers ----------
const ov = (o: Overlay): Overlay => o;
/** the ruler's far corners relative to A, so compose keeps the whole ruler on the map */
function rulerReach(d: Pt, start: number, len: number, unit: MapUnit): Pt[] {
  const w = 92 / (unit === 'in' ? 120 : 80) + 0.08, n: Pt = [-d[1], d[0]];
  const s0 = -(start + 0.3), s1 = len - start + 0.3;
  return [s0, s1].flatMap(s => [-1, 1].map(k => [d[0] * s + n[0] * w * k, d[1] * s + n[1] * w * k] as Pt));
}
const straightLeg = (R: () => number, L: number, axis = false): Leg[] => [{ d: dirOf(R, axis), L }];
const BAR_MI = (step: number, len = 1, n = 3): BarSpec => ({ step, len, n, real: 'mi' });
/** a map with only a big scale bar (bar items) */
function barOnly(bar: BarSpec, unit: MapUnit, ovs: (o: Pt) => Overlay[]): MapPic {
  // a bar alone is drawn big: it fills most of the field width
  const tot = (bar.n + (bar.leftSub ? 1 : 0)) * bar.len, uw = 180;
  const px = Math.min(2 * (unit === 'in' ? 120 : 80), (FIELD.w - 110 - uw) / tot);
  const m: MapPic = { unit, px, places: [], roads: [], areas: [], key: [], bar: { ...bar, big: true }, ov: [] };
  m.ov = ovs(bigBarOrigin(m));
  return m;
}
const words = (u: RealUnit) => (u === 'mi' ? 'miles' : 'kilometers');

// ===================== legend-locate =====================
const keyLookup: Gen = (R, n) => {
  const mode = pick(R, ['symbol', 'line', 'which'] as const);
  const kinds: [PlaceKind, PlaceKind] = [pick(R, ['town', 'city'] as const), pick(R, ['camp', 'school', 'tower'] as const)];
  const roadKind = pick(R, ['road', 'trail', 'highway'] as const);
  const extra = pick(R, (['camp', 'school', 'tower'] as const).filter(k => k !== kinds[1]));
  const NAME: Record<string, string> = { town: 'Town', city: 'City', camp: 'Camp', school: 'School', tower: 'Lookout', road: 'Road', trail: 'Trail', highway: 'Highway' };
  let target = '';
  const m = compose(R, {
    unit: 'in', legs: bentLegs(R, [pick(R, [2, 2.5, 3]), pick(R, [1.5, 2])]), roadKind, kinds, extra, deco: [pick(R, ['lake', 'forest'] as const)],
    ov: g => {
      if (mode === 'symbol') { target = R() < 0.5 ? 'B' : 'C'; return [ov({ id: 'a', k: 'ring', t: { place: target }, col: 'pick' }), ov({ id: 's0', k: 'ring', t: { key: target === 'B' ? kinds[1] : extra }, col: 'link' })]; }
      if (mode === 'line') { const a = g.route[0]!, b = g.route[1]!; return [ov({ id: 'a', k: 'ring', t: { pt: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], r: 0.28 * 120 }, col: 'pick' }), ov({ id: 's0', k: 'ring', t: { key: roadKind }, col: 'link' })]; }
      return [ov({ id: 's0', k: 'ring', t: { key: kinds[1] }, col: 'link' }), ov({ id: 's0', k: 'ring', t: { place: 'B' }, col: 'link' })];
    },
  });
  const nm = (id: string) => m.places.find(p => p.id === id)!.name;
  let opts: Opt[], prompt: string, board: string, answer: string;
  if (mode === 'symbol') {
    const k = target === 'B' ? kinds[1] : extra;
    const others = (['camp', 'school', 'tower', 'town'] as const).filter(x => x !== k);
    const [o1, o2] = shuffle(R, [...others]);
    opts = [{ t: NAME[k]!, ok: true, say: `Yes. The map key shows that symbol for a ${NAME[k]!.toLowerCase()}.` },
      { t: NAME[o1!]!, say: `Find the same symbol in the map key: it stands for a ${NAME[k]!.toLowerCase()}.` },
      { t: NAME[o2!]!, say: `Find the same symbol in the map key: it stands for a ${NAME[k]!.toLowerCase()}.` }];
    prompt = `On this map of the ${nm('A')} area, what does the <b>ringed symbol</b> stand for? Use the map key.`; board = '\\text{ringed} = \\,?'; answer = `\\text{${NAME[k]}}`;
  } else if (mode === 'line') {
    const others = (['road', 'trail', 'highway'] as const).filter(x => x !== roadKind);
    opts = [{ t: NAME[roadKind]!, ok: true, say: `Yes. That line style is a ${NAME[roadKind]!.toLowerCase()} in the key.` },
      ...others.map(o => ({ t: NAME[o]!, say: `Match the line's style (width, dashes) with the key: it is a ${NAME[roadKind]!.toLowerCase()}.` }))];
    prompt = `What kind of path is the <b>ringed line</b> out of ${nm('A')}? Use the map key.`; board = '\\text{line} = \\,?'; answer = `\\text{${NAME[roadKind]}}`;
  } else {
    const k = kinds[1];
    opts = [{ t: nm('B'), ok: true, say: `Yes. ${nm('B')} has the ${NAME[k]!.toLowerCase()} symbol from the key.` },
      { t: nm('A'), say: `${nm('A')} has the ${NAME[kinds[0]]!.toLowerCase()} symbol. Look for the ${NAME[k]!.toLowerCase()} symbol in the key.` },
      { t: nm('C'), say: `${nm('C')} has the ${NAME[extra]!.toLowerCase()} symbol. Look for the ${NAME[k]!.toLowerCase()} symbol in the key.` }];
    prompt = `Which place on this map is a <b>${NAME[k]!.toLowerCase()}</b>? Use the map key.`; board = `\\text{${NAME[k]}} = \\,?`; answer = `\\text{${capT(nm('B'))}}`;
  }
  return choiceItem(R, { id: `keyLookup-${n}`, family: 'keyLookup', prompt, board, picture: { map: m, answer, steps: 1 },
    solution: ['Find the symbol or line style in the map key, then read its name next to it.', `So: ${opts[0]!.t}.`] }, opts);
};

const symbolSize: Gen = (R, n) => {
  if (R() < 0.5) {
    const N = pick(R, [4, 8]);
    const m = compose(R, {
      unit: 'in', legs: straightLeg(R, pick(R, [2, 2.5, 3])), roadKind: 'road', kinds: ['town', 'town'], verbal: { per: N, real: 'mi' }, deco: [pick(R, ['forest', 'lake'] as const)],
      ov: () => [ov({ id: 'a', k: 'ring', t: { place: 'A' }, col: 'pick' }), ov({ id: 's0', k: 'ring', t: { key: 'town' }, col: 'link' })],
    });
    const t = m.places[0]!.name;
    return choiceItem(R, {
      id: `symbolSize-${n}`, family: 'symbolSize', picture: { map: m, answer: '\\text{not to scale}', steps: 1 },
      prompt: `On this map ${A('1 inch')} represents ${B(`${N} miles`)}. The dot for <b>${t}</b> is about ${A(`${fh(0.25)} inch`)} wide. How wide is the town of ${t}?`,
      board: `\\text{dot} \\approx \\tfrac14\\text{ in}`,
      solution: ['A town dot is a symbol: the key says "town". It marks where the town is.', 'Its size is chosen so you can see it, not drawn to scale. The map does not tell you how wide the town is.'],
    }, [
      { t: `The map does not say: the dot only marks where ${t} is`, ok: true, say: 'Right. A symbol shows what kind of place it is and where, not how big it is.' },
      { t: `About ${N / 4} ${N / 4 === 1 ? 'mile' : 'miles'} wide`, mc: MC.symbol, say: 'The dot is not drawn to scale. Every town gets the same dot, big or small.' },
      { t: `About ${fh(0.25)} mile wide`, mc: MC.drawing, say: 'A quarter inch is a map length, and the dot is not to scale anyway.' },
    ]);
  }
  const m = (() => {
    for (let t = 0; t < 12; t++) {
      const mm = compose(R, { unit: 'in', legs: bentLegs(R, [pick(R, [2, 2.5]), pick(R, [1.5, 2])]), roadKind: 'highway', kinds: ['town', 'city'], deco: ['lake'], ov: () => [] });
      if (mm.areas.some(a => a.kind === 'lake')) return mm;
    }
    return compose(R, { unit: 'in', legs: bentLegs(R, [2, 1.5]), roadKind: 'highway', kinds: ['town', 'city'], deco: ['lakeInBend'], ov: () => [] });
  })();
  if (m.areas.some(a => a.kind === 'lake')) m.ov.push(ov({ id: 's0', k: 'ring', t: { key: 'lake' }, col: 'link' }));
  return choiceItem(R, {
    id: `symbolSize-${n}`, family: 'symbolSize', picture: { map: m, answer: '\\text{lake: to scale}', steps: 1 },
    prompt: 'Which of these is drawn <b>to scale</b> on this map?', board: '\\text{to scale?}',
    solution: ['Dots and road lines are symbols: they have one size so you can see them.', 'An area like a lake is drawn with its real outline, shrunk by the scale.'],
  }, [
    { t: 'The outline of the lake', ok: true, say: 'Right. Areas such as lakes keep their real shape and size, shrunk by the scale.' },
    { t: 'The size of the town dots', mc: MC.symbol, say: 'A dot is a symbol. A big city and a small town can look almost the same.' },
    { t: 'The width of the highway line', mc: MC.symbol, say: 'A highway line is drawn wide so you can see it. A real highway is far narrower than that.' },
  ]);
};

const measurePoint: Gen = (R, n) => {
  const D = pick(R, [2, 2.5, 3, 3.5, 4]), d = dirOf(R), r = 13 / 120;
  const len = Math.ceil(D);
  const m = compose(R, {
    unit: 'in', legs: [{ d, L: D }], roadKind: 'road', kinds: ['town', 'town'], reach: rulerReach(d, 0, len, 'in').map(p => add(p, d, r)),
    ov: g => [ov({ id: 'a', k: 'ruler', a: add(g.A, g.dirs[0]!, r), dir: g.dirs[0]!, start: 0, len }),
      ov({ id: 's0', k: 'straight', a: g.A, b: g.B, col: 'link' }), ov({ id: 's0', k: 'leg', a: g.A, b: g.B, text: `${fx(D)} in`, col: 'first' })],
  });
  const [a, b] = [m.places[0]!.name, m.places[1]!.name];
  return choiceItem(R, {
    id: `measurePoint-${n}`, family: 'measurePoint', picture: { map: m, answer: `\\text{centers: } ${ft(D)}\\text{ in}`, steps: 1 },
    prompt: `Kim lines up the 0 of her ruler with the edge of the ${a} dot and reads about ${A(`${fh(D - 0.25)} in`)} at the edge of the ${b} dot. What is the map distance from ${a} to ${b}?`,
    board: `\\text{edges: } ${ft(D - 0.25)}\\text{ in}`,
    solution: ['The key says a dot is a town. Its location point is the center of the dot.', `Measure center to center: that adds about half a dot at each end, about ${fh(D)} in.`],
  }, [
    { t: `About ${fh(D)} in: from the center of one dot to the center of the other`, ok: true, say: 'Right. Distances are measured between the location points, the centers.' },
    { t: `${fh(D - 0.25)} in: the gap between the dots is the distance`, mc: MC.edge, say: 'The gap misses half a dot at each end. Measure from center to center.' },
    { t: `About ${fh(D - 0.5)} in: leave out both dots`, say: 'The dots are not extra. Measure from the center of one dot to the center of the other.' },
  ]);
};

// ===================== uniform-scale =====================
const sameEverywhere: Gen = (R, n) => {
  const N = pick(R, [2, 5, 10]), k = pick(R, [2, 3, 4]);
  const legs = bentLegs(R, [1, k]);
  const m = compose(R, {
    unit: 'in', legs, roadKind: 'road', kinds: ['town', 'town'], midPlaces: true,
    ov: g => [ov({ id: 'a', k: 'leg', a: g.route[0]!, b: g.route[1]!, text: '1 in', col: 'first' }), ov({ id: 'a', k: 'leg', a: g.route[1]!, b: g.route[2]!, text: `${k} in`, col: 'first' }),
      ov({ id: 's0', k: 'copies', pts: [g.route[1]!, g.route[2]!], len: 1 }), ov({ id: 's1', k: 'leg', a: g.route[1]!, b: g.route[2]!, text: `${k * N} mi`, col: 'second' })],
  });
  const [a, mid, b] = [m.places[0]!.name, m.places[2]!.name, m.places[1]!.name];
  return numItem({
    id: `sameEverywhere-${n}`, family: 'sameEverywhere', picture: { map: m, work: [`${k}\\text{ in} \\to \\,?`], answer: `${k} \\times ${N} = ${k * N}\\text{ mi}`, steps: 2 },
    prompt: `On this map the road from ${a} to ${mid} is ${A('1 inch')} long, and it is ${B(`${N} miles`)}. The road from ${mid} to ${b} is ${A(`${k} inches`)}. How far is it from ${mid} to ${b}?`,
    board: `1\\text{ in} \\to ${N}\\text{ mi}`,
    solution: [`One scale holds everywhere on the map: every inch represents ${N} miles.`, `${k} inches is ${k} copies of that inch: ${k} × ${N} = ${k * N} miles.`],
  }, 'num', 'miles', k * N, `Yes: each of the ${k} inches represents ${N} miles.`, [
    { v: N + k - 1, mc: MC.additive, say: `One more inch is not one more mile. Each inch represents ${N} miles: ${k} × ${N}.` },
    { v: k, mc: MC.drawing, say: `${k} is the map length in inches. Each inch represents ${N} miles.` },
    { v: N, mc: MC.diffScale, say: 'A longer road on the same map is a longer real road. The scale is the same everywhere.' },
  ], `Every inch on this map represents ${N} miles. How many inches is the second road?`);
};

const biggerMap: Gen = (R, n) => {
  const d = pick(R, [1, 1.5, 2]), N = pick(R, [2, 4, 5]);
  const m = compose(R, {
    unit: 'in', legs: straightLeg(R, d), roadKind: 'road', kinds: ['town', 'camp'], bar: BAR_MI(N, 1, 3), zoom: 2,
    ov: g => [ov({ id: 's0', k: 'copies', pts: [g.A, g.B], len: 1 })],
  });
  const [a, b] = [m.places[0]!.name, m.places[1]!.name];
  const real = d * N;
  return choiceItem(R, {
    id: `biggerMap-${n}`, family: 'biggerMap', picture: { map: m, work: [`${ft(2 * d)}\\text{ in} \\to \\,?`], answer: `${ft(real)}\\text{ mi}`, steps: 1 },
    prompt: `Lena enlarges this map to twice its size: every length on it doubles, the scale bar too. On the small map, ${a} to ${b} is ${A(`${fh(d)} in`)}, which is ${B(`${fh(real)} mi`)}. On the big map it is ${A(`${fh(2 * d)} in`)}. How far apart are ${a} and ${b} in real life?`,
    board: `${ft(d)}\\text{ in} \\to ${ft(real)}\\text{ mi}`,
    solution: ['Enlarging the map changes the picture, not the places. The scale bar grows with it.', `On the big map each interval is twice as long but still says ${N} miles. ${a} to ${b} is still ${fh(real)} miles.`],
  }, [
    { t: `${fp(real)} miles: the real places did not move`, ok: true, say: 'Right. The picture got bigger; the towns stayed where they are.' },
    { t: `${fp(2 * real)} miles: the map doubled, so the distance doubled`, mc: MC.enlarge, say: 'The map doubled, but the real road did not. The bar doubled too, so it still measures the same miles.' },
    { t: `${fp(2 * real)} miles: 1 inch is still ${N} miles`, mc: MC.equality, say: `"1 inch represents ${N} miles" belonged to the small map. On the big map 1 inch represents half as much.` },
  ]);
};

// ===================== scale-bar-read =====================
const barInterval: Gen = (R, n) => {
  const real: RealUnit = R() < 0.75 ? 'mi' : 'km';
  const step = pick(R, [1, 2, 5, 10]), nn = pick(R, [3, 4]), ends = R() < 0.4;
  const total = step * nn;
  const m = barOnly({ step, len: 1, n: nn, real, labels: ends ? [0, nn] : undefined }, 'in', () => [
    ov({ id: 'a', k: 'ring', t: { span: [0, 1] }, col: 'pick' }), ov({ id: 's0', k: 'ring', t: { span: [0, 1] }, col: 'link' })]);
  const slips: Slip[] = [{ v: total, mc: MC.barTotal, say: `${total} is the whole bar. The bar has ${nn} equal intervals, so one is ${total} ÷ ${nn}.` }];
  if (Number.isInteger(total / (nn + 1))) slips.push({ v: total / (nn + 1), mc: MC.points, say: `Count the spaces, not the marks: ${nn + 1} marks make ${nn} intervals.` });
  slips.push({ v: 1, mc: MC.subdiv, say: `An interval is not 1 ${real === 'mi' ? 'mile' : 'kilometer'} just because it is one box. Read the numbers.` });
  return numItem({
    id: `barInterval-${n}`, family: 'barInterval', picture: { map: m, answer: `1\\text{ interval} = ${step}${realT(real)}`, steps: 1 },
    prompt: ends ? `This scale bar has ${nn} equal intervals, from ${B('0')} to ${B(`${total} ${real === 'mi' ? 'mi' : 'km'}`)}. What real distance does <b>one interval</b> represent?`
      : `What real distance does <b>one interval</b> of this scale bar represent?`,
    board: '1\\text{ interval} = \\,?',
    solution: [ends ? `The bar runs from 0 to ${total} in ${nn} equal intervals.` : `Read it like a number line: 0, ${step}, ${2 * step}, …`, `One interval: ${ends ? `${total} ÷ ${nn}` : `from 0 to ${step}`} = ${step} ${words(real)}.`],
  }, 'num', words(real), step, `Yes: from 0 to ${step} is one interval.`, slips, 'Read the bar like a number line: what number comes after 0?');
};

const barPoint: Gen = (R, n) => {
  const real: RealUnit = R() < 0.75 ? 'mi' : 'km';
  const step = pick(R, [2, 4, 5, 10]), nn = pick(R, [3, 4]), i = int(R, 2, nn);
  const m = barOnly({ step, len: 1, n: nn, real, labels: [0, 1] }, 'in', () => [
    ov({ id: 'a', k: 'ring', t: { mark: i }, col: 'pick' }), ov({ id: 's0', k: 'ring', t: { span: [0, i] }, col: 'link' })]);
  return numItem({
    id: `barPoint-${n}`, family: 'barPoint', picture: { map: m, answer: `${i} \\times ${step} = ${i * step}${realT(real)}`, steps: 1 },
    prompt: `This scale bar has ${nn} equal intervals, and only the first one is labeled. What real distance does the <b>ringed mark</b> stand for?`,
    board: `1\\text{ interval} = ${step}${realT(real)}`,
    solution: [`Each interval is ${step} ${words(real)} (0 to ${step}).`, `The ringed mark is ${i} intervals from 0: ${i} × ${step} = ${i * step} ${words(real)}.`],
  }, 'num', words(real), i * step, `Yes: ${i} intervals of ${step}.`, [
    { v: (i + 1) * step, mc: MC.points, say: `Count intervals from 0, not marks. The 0 mark is not an interval.` },
    { v: i, mc: MC.subdiv, say: `${i} is the number of intervals. Each interval is ${step} ${words(real)}.` },
  ], `Count the intervals from 0 to the ringed mark, then use ${step} per interval.`);
};

// ===================== straight-vs-route =====================
const ROUTE_CTX = [
  { who: 'Jay drives', road: 'road' as RoadKind }, { who: 'Mia bikes', road: 'road' as RoadKind }, { who: 'Ben hikes', road: 'trail' as RoadKind },
];
const AIR_CTX = ['A drone flies', 'A crow flies', 'A small plane flies'];
const whichDistance: Gen = (R, n) => {
  const byRoad = R() < 0.6, c = pick(R, ROUTE_CTX);
  const legs = bentLegs(R, [pick(R, [2, 2.5, 3]), pick(R, [1.5, 2, 2.5])]);
  const m = compose(R, {
    unit: 'in', legs, roadKind: c.road, kinds: ['town', pick(R, ['camp', 'town'] as const)], deco: ['lakeInBend'],
    ov: g => [ov({ id: 'a', k: 'route', pts: g.route }), ov({ id: 'a', k: 'straight', a: g.A, b: g.B, col: 'ink' }),
      byRoad ? ov({ id: 's0', k: 'route', pts: g.route, col: 'link' }) : ov({ id: 's0', k: 'straight', a: g.A, b: g.B, col: 'link' })],
  });
  const [a, b] = [m.places[0]!.name, m.places[1]!.name];
  const path = c.road === 'trail' ? 'trail' : 'road';
  const who = byRoad ? `${c.who} from ${a} to ${b} on the ${path}` : `${pick(R, AIR_CTX)} straight from ${a} to ${b}`;
  const opts: Opt[] = byRoad ? [
    { t: `Along the ${path}, part by part`, ok: true, say: `Right. On the ${path} you follow every bend.` },
    { t: 'The straight dashed line', mc: MC.straight, say: `Nobody on the ${path} goes straight across. Follow the ${path} around the bends.` },
    { t: 'The shorter of the two', mc: MC.straight, say: `The shorter one is the straight line, but the trip follows the ${path}.` },
  ] : [
    { t: 'The straight dashed line', ok: true, say: 'Right. Flying, it goes straight: "as the crow flies".' },
    { t: `Along the ${path}, part by part`, say: `It does not follow the ${path}. It flies straight over everything.` },
    { t: `The ${path} and the line added together`, say: 'Only one path is travelled. Flying, that is the straight line.' },
  ];
  return choiceItem(R, {
    id: `whichDistance-${n}`, family: 'whichDistance', picture: { map: m, answer: byRoad ? `\\text{along the ${path}}` : '\\text{the straight line}', steps: 1 },
    prompt: `${who}. Which distance do you measure on the map?`, board: '\\text{which distance?}',
    solution: [byRoad ? `The trip follows the ${path}, so measure along it, bend by bend.` : 'A flight goes straight, so measure the straight line between the two location points.'],
  }, opts);
};

const compareDist: Gen = (R, n) => {
  const bent = R() < 0.7;
  const legs = bent ? (R() < 0.5 ? bentLegs(R, [pick(R, [2, 2.5, 3]), pick(R, [1.5, 2])]) : bentLegs(R, [pick(R, [1.5, 2]), pick(R, [1, 1.5]), pick(R, [1, 1.5])])) : straightLeg(R, pick(R, [3, 3.5, 4]));
  const m = compose(R, {
    unit: 'in', legs, roadKind: 'road', kinds: ['town', 'town'], bar: BAR_MI(2), deco: bent ? ['lakeInBend'] : [pick(R, ['forest', 'lake'] as const)],
    ov: g => [ov({ id: 'a', k: 'route', pts: g.route }), ov({ id: 'a', k: 'straight', a: g.A, b: g.B, col: 'ink' }),
      ov({ id: 's0', k: 'copies', pts: g.route, len: 1 }), ...(bent ? [ov({ id: 's1', k: 'copies', pts: [g.A, g.B], len: 1 })] : [])],
  });
  const opts: Opt[] = [
    { t: 'The road is longer', ok: bent, say: bent ? 'Right. The road bends; the straight line is the shortest way.' : 'Here the road IS the straight line. They are the same.' },
    { t: 'They are the same', ok: !bent, mc: bent ? MC.straight : undefined, say: !bent ? 'Right. A straight road is the straight line, so the two distances match.' : 'The road bends away from the straight line, so it is longer. Lay the bar along both.' },
    { t: 'The straight line is longer', say: 'A straight line is the shortest way between two points. A road can only be as long or longer.' },
  ];
  return choiceItem(R, {
    id: `compareDist-${n}`, family: 'compareDist', picture: { map: m, answer: bent ? '\\text{road} > \\text{straight line}' : '\\text{road} = \\text{straight line}', steps: bent ? 2 : 1 },
    prompt: `Compare the distance <b>along the road</b> with the <b>straight-line</b> distance from ${m.places[0]!.name} to ${m.places[1]!.name}.`, board: '\\text{road} \\;?\\; \\text{straight line}',
    solution: bent ? ['Lay copies of a bar interval along the road, then along the straight line.', 'The road needs more copies: it is longer.'] : ['The road runs straight from town to town.', 'So the road and the straight line are the same distance.'],
  }, opts);
};

// ===================== bar-iterate =====================
const LAY_BARS: { b: BarSpec; dual?: boolean }[] = [
  { b: BAR_MI(2, 0.5, 3) }, { b: BAR_MI(5, 1, 2) }, { b: BAR_MI(2, 1, 2), dual: true }, { b: BAR_MI(10, 1, 1) }, { b: BAR_MI(1, 0.5, 4) },
];
const layBar: Gen = (R, n) => {
  const pickB = pick(R, LAY_BARS), bar: BarSpec = { ...pickB.b };
  const barLen = bar.len * bar.n, total = bar.step * bar.n;
  const kMax = Math.min(5, Math.floor(5 / barLen), Math.floor(50 / total));
  const k = int(R, 2, Math.max(2, kMax));
  const dual = pickB.dual && R() < 0.5;
  if (dual) bar.second = { step: 2, len: 0.625, n: 3, real: 'km' };
  const m = compose(R, {
    unit: 'in', legs: straightLeg(R, k * barLen), roadKind: 'road', kinds: ['town', pick(R, ['town', 'camp'] as const)], bar, deco: [pick(R, ['forest', 'lake'] as const)],
    ov: g => [ov({ id: 'a', k: 'copies', pts: [g.A, g.B], len: barLen, sub: bar.n })],
  });
  const [a, b] = [m.places[0]!.name, m.places[1]!.name];
  return numItem({
    id: `layBar-${n}`, family: 'layBar', picture: { map: m, answer: `${k} \\times ${total} = ${k * total}\\text{ mi}`, steps: 0 },
    prompt: `Copies of the <b>whole</b> scale bar are laid end to end along the road from ${a} to ${b}.${dual ? ' Use the miles bar.' : ''} How far is it?`,
    board: `\\text{one bar} = ${total}\\text{ mi}`,
    solution: [`One whole bar is ${total} miles. ${k} copies fit along the road with no gaps.`, `${k} × ${total} = ${k * total} miles.`],
  }, 'num', 'miles', k * total, `Yes: ${k} bars of ${total} miles.`, [
    { v: (k + 1) * total, mc: MC.points, say: `Count the copies, not the joints: ${k + 1} marks, but ${k} copies.` },
    { v: k * bar.step, mc: MC.subdiv, say: `Each copy is the whole bar, ${total} miles, not one interval.` },
    { v: k, say: `${k} is how many copies. Each copy represents ${total} miles.` },
  ], `How many whole bars fit, and how many miles is one bar?`);
};

const countIntervals: Gen = (R, n) => {
  const small = R() < 0.4;
  const len = small ? 0.5 : 1, step = small ? pick(R, [1, 2]) : pick(R, [1, 2, 5, 10]);
  const nBar = small ? 4 : pick(R, [3, 4]);
  let c = int(R, 3, small ? 10 : 7);
  while (c * step > 50) c--;
  const two = c * len > 4.5 || R() < 0.5;
  const c1 = two ? Math.max(1, Math.floor(c / 2) + int(R, -1, 0)) : c;
  const legs = two ? bentLegs(R, [c1 * len, (c - c1) * len]) : straightLeg(R, c * len);
  const kind: RoadKind = pick(R, ['trail', 'road'] as const);
  const m = compose(R, {
    unit: 'in', legs, roadKind: kind, kinds: ['town', pick(R, ['camp', 'tower'] as const)], bar: { step, len, n: nBar, real: 'mi' },
    ov: g => [ov({ id: 'a', k: 'copies', pts: g.route, len })],
  });
  const [a, b] = [m.places[0]!.name, m.places[1]!.name];
  const path = kind === 'trail' ? 'trail' : 'road';
  return numItem({
    id: `countIntervals-${n}`, family: 'countIntervals', picture: { map: m, answer: `${c} \\times ${step} = ${c * step}\\text{ mi}`, steps: 0 },
    prompt: `Copies of <b>one interval</b> of the scale bar are laid along the ${path} from ${a} to ${b}. How long is the ${path}?`,
    board: `1\\text{ interval} = ${step}\\text{ mi}`,
    solution: [`One interval is ${step} ${step === 1 ? 'mile' : 'miles'}. Count the copies along the ${path}: ${c}.`, `${c} × ${step} = ${c * step} miles.`],
  }, 'num', 'miles', c * step, `Yes: ${c} intervals of ${step}.`, [
    { v: (c + 1) * step, mc: MC.points, say: 'Count the pieces, not the tick marks: the first mark starts the count at 0.' },
    { v: c, mc: MC.subdiv, say: `${c} is the number of intervals. Each one represents ${step} miles.` },
    { v: c * step * nBar, mc: MC.barTotal, say: `Each copy is ONE interval (${step} mi), not the whole bar.` },
  ], `Count the copies, then multiply by ${step} miles each.`);
};

// ===================== bar-fraction-intervals =====================
const halfBar: Gen = (R, n) => {
  const halves = R() < 0.5;
  const f = halves ? 0.5 : pick(R, [0.25, 0.75]), w = int(R, 1, 4);
  const cnt = w + f;
  const step = pick(R, [2, 4, 8]);
  const sub = halves ? 2 : 4;
  const legs = cnt > 3.5 && R() < 0.6 ? bentLegs(R, [w - 1 >= 1 ? 2 : 1, cnt - (w - 1 >= 1 ? 2 : 1)]) : straightLeg(R, cnt);
  const m = compose(R, {
    unit: 'in', legs, roadKind: 'road', kinds: ['town', 'town'], bar: { step, len: 1, n: 3, real: 'mi', sub },
    ov: g => [ov({ id: 'a', k: 'copies', pts: g.route, len: 1, sub })],
  });
  const [a, b] = [m.places[0]!.name, m.places[1]!.name];
  const ans = cnt * step;
  return numItem({
    id: `halfBar-${n}`, family: 'halfBar', picture: { map: m, answer: `${ft(cnt)} \\times ${step} = ${ft(ans)}\\text{ mi}`, steps: 0 },
    prompt: `Copies of one bar interval are laid along the road from ${a} to ${b}. The last copy only fits in part. How far is it?`,
    board: `1\\text{ interval} = ${step}\\text{ mi}`,
    solution: [`${w} whole intervals and ${fh(f)} of one more: ${fh(cnt)} intervals.`, `${fh(cnt)} × ${step} = ${fh(ans)} miles (${fh(f)} of ${step} is ${fh(f * step)}).`],
  }, 'frac', 'miles', ans, `Yes: ${fh(cnt)} intervals of ${step} miles.`, [
    { v: Math.ceil(cnt) * step, mc: MC.partial, say: `The last piece is only ${fh(f)} of an interval: ${fh(f)} of ${step} miles, not a whole ${step}.` },
    { v: Math.floor(cnt) * step, mc: MC.partial, say: `Don't drop the last piece: ${fh(f)} of an interval is ${fh(f * step)} more miles.` },
    { v: cnt, mc: MC.subdiv, say: `${fh(cnt)} is the number of intervals. Each interval is ${step} miles.` },
  ], `Count whole intervals, then the part of one more, and use ${step} miles per interval.`);
};

const leftSub: Gen = (R, n) => {
  const sub = pick(R, [2, 4]), step = pick(R, [2, 4, 8]), nn = 3, mk = int(R, 1, nn), q = int(R, 1, sub - 1);
  const ans = mk * step + (q / sub) * step;
  const m = barOnly({ step, len: 1, n: nn, real: 'mi', leftSub: sub }, 'in', () => [ov({ id: 'a', k: 'strip', from: -q / sub, to: mk })]);
  return numItem({
    id: `leftSub-${n}`, family: 'leftSub', picture: { map: m, answer: `${mk * step} + ${ft((q / sub) * step)} = ${ft(ans)}\\text{ mi}`, steps: 0 },
    prompt: `A paper strip shows the length of a road on the map. Its right end is on the ${B(String(mk * step))} mark; its left end reaches into the divided part left of 0, which is cut into ${sub} equal pieces. How long is the road?`,
    board: `1\\text{ interval} = ${step}\\text{ mi}`,
    solution: [`From 0 to the right end: ${mk * step} miles.`, `Left of 0, the divided part is one interval (${step} mi) cut into ${sub}: the strip covers ${q} of them, ${fh((q / sub) * step)} mi.`, `${mk * step} + ${fh((q / sub) * step)} = ${fh(ans)} miles.`],
  }, 'frac', 'miles', ans, 'Yes: the whole part right of 0, plus the part left of 0.', [
    { v: (mk + 1) * step, mc: MC.rulerEdge, say: 'The bar starts at 0, not at its left edge. Read the left part in its small pieces.' },
    { v: mk * step, mc: MC.partial, say: `Add the part left of 0 too: ${q} small ${q === 1 ? 'piece' : 'pieces'} of ${fh(step / sub)} mi.` },
    { v: mk * step + ((sub - q) / sub) * step, say: 'Count the small pieces from 0 out to the left end of the strip.' },
  ], 'Read the right end from 0, then count the small pieces left of 0.');
};

// ===================== ruler-map-measure =====================
const rulerRead: Gen = (R, n, sg) => {
  void sg;
  const cm = R() < 0.35, unit: MapUnit = cm ? 'cm' : 'in';
  const w = cm ? int(R, 2, 6) : int(R, 1, 4), f = cm ? pick(R, [0, 0.5]) : pick(R, [0, 0.5, 0.25, 0.75]);
  const L = w + f, len = Math.ceil(L), d = dirOf(R);
  const m = compose(R, {
    unit, legs: [{ d, L }], roadKind: 'road', kinds: ['town', pick(R, ['town', 'school'] as const)], reach: rulerReach(d, 0, len, unit),
    ov: g => [ov({ id: 'a', k: 'ruler', a: g.A, dir: g.dirs[0]!, start: 0, len, mark: L, markId: 's0' } )],
  });
  const [a, b] = [m.places[0]!.name, m.places[1]!.name];
  const slips: Slip[] = [];
  if (!cm && f) slips.push({ v: w + (f * 4) / 10, mc: MC.tenths, say: `The small spaces are quarter inches, not tenths: ${f * 4} of them make ${fh(f)} inch.` });
  slips.push({ v: L + 1, mc: MC.points, say: 'Read the number at the mark, starting from 0. Do not count the 0 mark as one.' });
  return numItem({
    id: `rulerRead-${n}`, family: 'rulerRead', picture: { map: m, answer: `${ft(L)}${mapT(unit)}`, steps: 1 },
    prompt: `The ruler's 0 is on the location point of ${a}. What is the map distance from ${a} to ${b}?`,
    board: `\\text{distance} = \\,?${mapT(unit)}`,
    solution: [`Read the ruler at ${b}'s location point.`, cm ? `Each centimeter has a half mark in the middle: ${fh(L)} cm.` : `Each inch is cut into 4 quarters: ${fh(L)} in.`],
  }, 'frac', cm ? 'cm' : 'in', L, `Yes: ${fh(L)} ${cm ? 'cm' : 'in'}.`, slips, cm ? 'Count whole centimeters, then the half.' : 'Count whole inches, then the quarters.');
};

const shiftedRuler: Gen = (R, n) => {
  const s = int(R, 1, 3), w = int(R, 1, 3), f = pick(R, [0, 0.25, 0.5, 0.75]), L = w + f, e = s + L;
  if (e > 4.75) return shiftedRuler(R, n);
  const len = Math.ceil(e), d = len >= 5 ? pick(R, DIRS.slice(4)) : dirOf(R);
  const m = compose(R, {
    unit: 'in', legs: [{ d, L }], roadKind: 'road', kinds: ['town', 'town'], reach: rulerReach(d, s, len, 'in'),
    ov: g => [ov({ id: 'a', k: 'ruler', a: g.A, dir: g.dirs[0]!, start: s, len, mark: e, markId: 's0' } )],
  });
  const [a, b] = [m.places[0]!.name, m.places[1]!.name];
  return numItem({
    id: `shiftedRuler-${n}`, family: 'shiftedRuler', picture: { map: m, answer: `${ft(e)} - ${s} = ${ft(L)}\\text{ in}`, steps: 1 },
    prompt: `The ruler's ${A(String(s))} mark is on the location point of ${a}, not its 0. What is the map distance from ${a} to ${b}?`,
    board: `\\text{start at } ${s}`,
    solution: [`At ${b} the ruler reads ${fh(e)}.`, `Count from ${s}, not from 0: ${fh(e)} − ${s} = ${fh(L)} in.`],
  }, 'frac', 'in', L, `Yes: from ${s} to ${fh(e)} is ${fh(L)} in.`, [
    { v: e, mc: MC.endReading, say: `${fh(e)} is the reading at the end. The ruler starts at ${s}, so take ${s} away.` },
    { v: L + 1, mc: MC.points, say: `Count the inches between ${s} and the end, not the marks.` },
  ], `Count from the ${s} mark to the end: whole inches, then quarters.`);
};

// ===================== ruler-round =====================
const roundRuler: Gen = (R, n) => {
  const Q = int(R, 4, 19) / 4, dl = pick(R, [1 / 32, 1 / 16]) * (R() < 0.5 ? -1 : 1), t = Q + dl, len = Math.ceil(t), d = dirOf(R);
  const m = compose(R, {
    unit: 'in', legs: [{ d, L: t }], roadKind: 'road', kinds: ['town', pick(R, ['town', 'tower'] as const)], reach: rulerReach(d, 0, len, 'in'),
    ov: g => [ov({ id: 'a', k: 'ruler', a: g.A, dir: g.dirs[0]!, start: 0, len, sub: 4, mark: Q, markId: 's0' } )],
  });
  const [a, b] = [m.places[0]!.name, m.places[1]!.name];
  const slips: Slip[] = [];
  if (dl < 0) slips.push({ v: Q - 0.25, mc: MC.roundsWrong, say: `${b} is just before the ${fh(Q)} mark, so ${fh(Q)} is nearer. Pick the nearest mark, not the one below.` });
  else slips.push({ v: Q + 0.25, say: `${b} is just past the ${fh(Q)} mark. That mark is nearer.` });
  if (Math.round(t) !== Q) slips.push({ v: Math.round(t), mc: MC.roundWhole, say: 'Record it to the nearest quarter inch, not the nearest inch.' });
  return numItem({
    id: `roundRuler-${n}`, family: 'roundRuler', picture: { map: m, answer: `\\approx ${ft(Q)}\\text{ in}`, steps: 1 },
    prompt: `${b} falls between two marks of the ruler. Round the map distance from ${a} to ${b} to the <b>nearest quarter inch</b>.`,
    board: `\\text{distance} \\approx \\,?\\text{ in}`,
    solution: [`The location point of ${b} is between two quarter-inch marks.`, `It is nearer to ${fh(Q)}: record ${fh(Q)} in.`],
  }, 'frac', 'in', Q, `Yes: ${fh(Q)} in is the nearest quarter.`, slips, 'Find the two quarter marks on either side, and take the nearer one.');
};

const roundCm: Gen = (R, n) => {
  const H = int(R, 4, 13) / 2, dl = 0.1 * (R() < 0.5 ? -1 : 1), t = H + dl, len = Math.ceil(t), d = dirOf(R);
  const m = compose(R, {
    unit: 'cm', legs: [{ d, L: t }], roadKind: 'road', kinds: ['town', 'town'], reach: rulerReach(d, 0, len, 'cm'),
    ov: g => [ov({ id: 'a', k: 'ruler', a: g.A, dir: g.dirs[0]!, start: 0, len, sub: 10, mark: H, markId: 's0' } )],
  });
  const [a, b] = [m.places[0]!.name, m.places[1]!.name];
  const slips: Slip[] = [];
  if (dl < 0) slips.push({ v: H - 0.5, mc: MC.roundsWrong, say: `${b} is 1 mm before ${fh(H)} cm, so ${fh(H)} is the nearest half.` });
  else slips.push({ v: H + 0.5, say: `${b} is 1 mm past ${fh(H)} cm. That mark is nearer.` });
  if (Math.round(t) !== H) slips.push({ v: Math.round(t), mc: MC.roundWhole, say: 'Record it to the nearest half centimeter, not the nearest centimeter.' });
  slips.push({ v: Math.round(t * 10) / 10, say: `That is the exact millimeter reading. Round it to the nearest half centimeter, written as a fraction.` });
  return numItem({
    id: `roundCm-${n}`, family: 'roundCm', picture: { map: m, answer: `\\approx ${ft(H)}\\text{ cm}`, steps: 1 },
    prompt: `Round the map distance from ${a} to ${b} to the <b>nearest half centimeter</b>.`,
    board: `\\text{distance} \\approx \\,?\\text{ cm}`,
    solution: ['The small ticks are millimeters; the longer middle tick is the half centimeter.', `${b} is 1 mm from ${fh(H)} cm: record ${fh(H)} cm.`],
  }, 'frac', 'cm', H, `Yes: ${fh(H)} cm.`, slips, 'Which half-centimeter mark is nearest: a whole number or a half?');
};

// ===================== unit-scale-whole =====================
const unitScale: Gen = (R, n) => {
  const cm = R() < 0.4, unit: MapUnit = cm ? 'cm' : 'in', real = realOf(unit);
  const d = cm ? int(R, 2, 6) : int(R, 1, 4), N = pick(R, [2, 4, 5, 8, 10]);
  if (d + N === d * N) return unitScale(R, n);
  const dir = dirOf(R);
  const m = compose(R, {
    unit, legs: [{ d: dir, L: d }], roadKind: 'road', kinds: ['town', pick(R, ['town', 'camp'] as const)], verbal: { per: N, real }, reach: rulerReach(dir, 0, d, unit),
    ov: g => [ov({ id: 'a', k: 'ruler', a: g.A, dir: g.dirs[0]!, start: 0, len: d, mark: d, markId: 's0' } ), ov({ id: 's1', k: 'leg', a: g.A, b: g.B, text: `${d * N} ${real}`, col: 'second' })],
  });
  const [a, b] = [m.places[0]!.name, m.places[1]!.name];
  return numItem({
    id: `unitScale-${n}`, family: 'unitScale', picture: { map: m, answer: `${d} \\times ${N} = ${d * N}${realT(real)}`, steps: 2 },
    prompt: `On this map ${A(oneU(unit))} represents ${B(realW(N, real))}. Read the ruler. How far apart are ${a} and ${b} in real life?`,
    board: `1${mapT(unit)} \\to ${N}${realT(real)}`,
    solution: [`The ruler reads ${d} ${cm ? 'cm' : 'in'}.`, `Each ${cm ? 'centimeter' : 'inch'} represents ${N} ${words(real)}: ${d} × ${N} = ${d * N} ${words(real)}.`],
  }, 'num', words(real), d * N, `Yes: ${d} × ${N}.`, [
    { v: d / N, mc: MC.divRate, say: `Each ${cm ? 'centimeter' : 'inch'} is ${N} ${words(real)}, so multiply: ${d} × ${N}.` },
    { v: d + N, mc: MC.wrongForm, say: `Adding ${N} is not the scale. Every ${cm ? 'centimeter' : 'inch'} represents ${N}: multiply.` },
    { v: d, mc: MC.drawing, say: `${d} is the map length. Turn it into real ${words(real)} with the scale.` },
  ], `Read the ruler, then use the scale for every ${cm ? 'centimeter' : 'inch'}.`);
};

const unitPick: Gen = (R, n) => {
  const cm = R() < 0.4, unit: MapUnit = cm ? 'cm' : 'in', real = realOf(unit);
  const d = cm ? int(R, 2, 7) : int(R, 2, 5), N = pick(R, [2, 4, 5, 10]);
  if (d + N === d * N) return unitPick(R, n);
  const m = compose(R, {
    unit, legs: straightLeg(R, d), roadKind: pick(R, ['road', 'highway'] as const), kinds: ['town', 'city'], verbal: { per: N, real }, deco: [pick(R, ['forest', 'lake'] as const)],
    ov: g => [ov({ id: 'a', k: 'leg', a: g.A, b: g.B, text: `${d} ${unit}`, col: 'first' })],
  });
  const [a, b] = [m.places[0]!.name, m.places[1]!.name];
  const uw = cm ? 'centimeters' : 'inches';
  return choiceItem(R, {
    id: `unitPick-${n}`, family: 'unitPick', picture: { map: m, answer: `${d} \\times ${N} = ${d * N}${realT(real)}`, steps: 0 },
    prompt: `On this map ${A(oneU(unit))} represents ${B(realW(N, real))}. ${a} to ${b} is ${A(`${d} ${unit}`)} on the map. Which answer is right?`,
    board: `${d}${mapT(unit)} \\to \\,?`,
    solution: [`${d} × ${N} = ${d * N}, and the answer is a real distance, so it is in ${words(real)}.`],
  }, [
    { t: `${d * N} ${words(real)}`, ok: true, say: `Right: ${d} × ${N} real ${words(real)}.` },
    { t: `${d * N} ${uw}`, mc: MC.wrongUnit, say: `${d * N} is right, but it is a real distance: ${words(real)}, not ${uw} on the map.` },
    { t: `${d + N} ${words(real)}`, mc: MC.wrongForm, say: `Don't add the scale. Each ${cm ? 'centimeter' : 'inch'} represents ${N}: multiply.` },
  ]);
};

// ===================== bar-to-unit-scale =====================
const barToUnit: Gen = (R, n) => {
  const cm = R() < 0.35, unit: MapUnit = cm ? 'cm' : 'in', real = realOf(unit);
  const [b, nn] = pick(R, (cm ? [[2, 2], [4, 4], [4, 2], [5, 5]] : [[1, 1], [2, 2], [4, 4], [4, 2], [2, 1]]) as readonly [number, number][]);
  const per = pick(R, [2, 4, 5, 10]), T = per * b, step = T / nn;
  const m = barOnly({ step, len: b / nn, n: nn, real }, unit, o => [ov({ id: 'a', k: 'ruler', a: o, dir: [1, 0], start: 0, len: b, side: 1 })]);
  const slips: Slip[] = [{ v: b / T, mc: MC.rateRev, say: `That is ${cm ? 'centimeters' : 'inches'} per ${real === 'mi' ? 'mile' : 'kilometer'}. Asked: ${words(real)} for ONE ${cm ? 'centimeter' : 'inch'}: ${T} ÷ ${b}.` }];
  if (b !== 1) slips.push({ v: T, mc: MC.barTotal, say: `${T} is the whole bar, which is ${b} ${cm ? 'cm' : 'in'} long. Share it out: ${T} ÷ ${b}.` });
  if (nn !== b) slips.push({ v: step, say: `${step} is one interval of the bar, but one interval is ${fh(b / nn)} ${cm ? 'cm' : 'in'} long here.` });
  return numItem({
    id: `barToUnit-${n}`, family: 'barToUnit', picture: { map: m, answer: `${T} \\div ${b} = ${per}\\;\\Rightarrow\\; 1${mapT(unit)} \\to ${per}${realT(real)}`, steps: 0 },
    prompt: `The ruler shows how long this scale bar is. How many ${words(real)} does ${A(oneU(unit))} represent on this map?`,
    board: `\\text{whole bar} = ${T}${realT(real)}`,
    solution: [`The bar is ${b} ${cm ? 'cm' : 'in'} long and runs to ${T} ${words(real)}.`, `One ${cm ? 'centimeter' : 'inch'}: ${T} ÷ ${b} = ${per} ${words(real)}.`],
  }, 'num', words(real), per, `Yes: ${T} ÷ ${b} = ${per}.`, slips, `Divide the bar's ${words(real)} by its length in ${cm ? 'centimeters' : 'inches'}.`);
};

const halfSections: Gen = (R, n) => {
  const cm = R() < 0.35, unit: MapUnit = cm ? 'cm' : 'in', real = realOf(unit);
  const v = pick(R, [1, 2, 3, 5, 10]), nn = pick(R, [4, 6]);
  // labels on every section only when they fit (single digits on half-inch sections); otherwise every other mark
  const every = !cm && v * nn < 10;
  const labels = every ? undefined : Array.from({ length: nn / 2 + 1 }, (_, i) => 2 * i);
  const m = barOnly({ step: v, len: 0.5, n: nn, real, labels }, unit, o => [ov({ id: 'a', k: 'ruler', a: o, dir: [1, 0], start: 0, len: nn / 2, side: 1 })]);
  const uw = cm ? 'centimeter' : 'inch';
  return numItem({
    id: `halfSections-${n}`, family: 'halfSections', picture: { map: m, answer: `1${mapT(unit)} \\to ${2 * v}${realT(real)}`, steps: 0 },
    prompt: `This bar has ${nn} sections. Each section is ${A(`${fh(0.5)} ${uw}`)} long (see the ruler) and represents ${B(realW(v, real))}. What does ${A(`1 ${uw}`)} represent?`,
    board: `1${mapT(unit)} \\to \\,?${realT(real)}`,
    solution: [`One ${uw} holds two half-${uw} sections.`, `2 × ${v} = ${2 * v} ${words(real)}.`],
  }, 'num', words(real), 2 * v, `Yes: two sections of ${v} make one ${uw}.`, [
    { v, mc: MC.subdiv, say: `A section is only half a ${uw}. One ${uw} is two sections.` },
    { v: nn * v, mc: MC.barTotal, say: `${nn * v} is the whole bar, ${fh(nn / 2)} ${uw}${nn / 2 === 1 ? '' : (cm ? 's' : 'es')} long. One ${uw} is two sections.` },
    { v: v / 2, mc: MC.rateRev, say: `A ${uw} is longer than a section, so it represents more, not less.` },
  ], `How many half-${uw} sections make one ${uw}?`);
};

// ===================== unit-scale-fraction =====================
const fracScale: Gen = (R, n) => {
  const cm = R() < 0.3, unit: MapUnit = cm ? 'cm' : 'in', real = realOf(unit);
  const l = cm ? int(R, 1, 6) + 0.5 : (() => { let x = 0; while (!x || Number.isInteger(x)) x = int(R, 3, 19) / 4; return x; })();
  const N = cm ? pick(R, [2, 4]) : pick(R, [2, 4, 8, 10]);
  const m = compose(R, {
    unit, legs: straightLeg(R, l), roadKind: 'road', kinds: ['town', pick(R, ['town', 'camp'] as const)], verbal: { per: N, real },
    ov: g => [ov({ id: 'a', k: 'leg', a: g.A, b: g.B, text: `${fx(l)} ${unit}`, col: 'first' }), ov({ id: 's0', k: 'copies', pts: [g.A, g.B], len: 1 })],
  });
  const [a, b] = [m.places[0]!.name, m.places[1]!.name];
  const ans = l * N;
  const slips: Slip[] = [{ v: Math.floor(l) * N, mc: MC.wholePart, say: `Don't drop the ${fh(l - Math.floor(l))}: it is ${fh((l - Math.floor(l)) * N)} more ${words(real)}.` }];
  if (Math.round(l) !== Math.floor(l)) slips.push({ v: Math.round(l) * N, mc: MC.roundFirst, say: `Keep the exact ${fh(l)} until the end. Rounding first adds an error.` });
  slips.push({ v: l + N, mc: MC.wrongForm, say: `Multiply by the scale, don't add it: ${fh(l)} × ${N}.` });
  return numItem({
    id: `fracScale-${n}`, family: 'fracScale', picture: { map: m, answer: `${ft(l)} \\times ${N} = ${ft(ans)}${realT(real)}`, steps: 1 },
    prompt: `On this map ${A(oneU(unit))} represents ${B(realW(N, real))}. ${a} to ${b} is ${A(`${fh(l)} ${unit}`)}. How far is it in real life?`,
    board: `${ft(l)}${mapT(unit)} \\to \\,?${realT(real)}`,
    solution: [`${Math.floor(l)} whole ${cm ? 'cm' : 'in'}: ${Math.floor(l)} × ${N} = ${Math.floor(l) * N}. The ${fh(l - Math.floor(l))}: ${fh(l - Math.floor(l))} of ${N} = ${fh((l - Math.floor(l)) * N)}.`, `Together ${fh(ans)} ${words(real)}.`],
  }, 'frac', words(real), ans, `Yes: ${fh(l)} × ${N} = ${fh(ans)}.`, slips, `Multiply the whole ${cm ? 'centimeters' : 'inches'} AND the fraction by ${N}.`);
};

const roundFirst: Gen = (R, n) => {
  const w = int(R, 1, 4), f = pick(R, [0.25, 0.5, 0.75]), l = w + f, N = pick(R, [4, 8, 10]);
  const whole = R() < 0.4, jo = (whole ? Math.floor(l) : Math.round(l)) * N, mx = l * N;
  const m = compose(R, {
    unit: 'in', legs: straightLeg(R, l), roadKind: pick(R, ['road', 'trail'] as const), kinds: ['town', 'camp'], verbal: { per: N, real: 'mi' },
    ov: g => [ov({ id: 'a', k: 'leg', a: g.A, b: g.B, text: `${fx(l)} in`, col: 'first' })],
  });
  return choiceItem(R, {
    id: `roundFirst-${n}`, family: 'roundFirst', picture: { map: m, work: [`\\text{Max: } ${ft(l)} \\times ${N} = ${ft(mx)}\\text{ mi}`], answer: `${ft(l)} \\times ${N} = ${ft(mx)}\\text{ mi}`, steps: 0 },
    prompt: `The road is ${A(`${fh(l)} in`)} on a map where ${A('1 inch')} represents ${B(`${N} miles`)}. Jo ${whole ? 'uses only the whole inches' : 'rounds to a whole number of inches first'} and gets ${fp(jo)} miles. Max gets ${fp(mx)} miles. Who is right?`,
    board: `\\text{Jo: } ${whole ? Math.floor(l) : Math.round(l)} \\times ${N} = ${jo}\\text{ mi}`,
    solution: [`Keep the exact map length: ${fh(l)} × ${N} = ${fh(mx)} miles.`, `${whole ? 'Dropping' : 'Rounding'} the ${fh(f)} inch changes the answer by ${fh(Math.abs(mx - jo))} miles.`],
  }, [
    { t: `Max: keep the exact ${fp(l)} inches until the end`, ok: true, say: 'Right. Round, if at all, only the final answer.' },
    whole ? { t: 'Jo: the whole inches are enough', mc: MC.wholePart, say: `The ${fp(f)} inch is part of the road too: ${fp(f)} × ${N} = ${fp(f * N)} miles.` }
      : { t: 'Jo: round the inches to a whole number first', mc: MC.roundFirst, say: `Rounding first changes the length, and the scale multiplies that change by ${N}.` },
    { t: `Both: ${fp(jo)} and ${fp(mx)} miles are close enough`, mc: MC.closeEnough, say: `They differ by ${fp(Math.abs(mx - jo))} miles, and only one used the measured length.` },
  ]);
};

// ===================== estimate-with-bar =====================
const estimateRange: Gen = (R, n) => {
  const km = R() < 0.3, real: RealUnit = km ? 'km' : 'mi', s = pick(R, [1, 2, 5, 10]), j = int(R, 1, 4), f = pick(R, [0.3, 0.4, 0.6, 0.7]), L = j + f;
  const m = compose(R, {
    unit: 'in', legs: straightLeg(R, L), roadKind: 'road', kinds: ['town', pick(R, ['town', 'camp'] as const)], bar: { step: s, len: 1, n: 3, real }, deco: [pick(R, ['forest', 'lake'] as const)],
    ov: g => [ov({ id: 's0', k: 'copies', pts: [g.A, g.B], len: 1 })],
  });
  const [a, b] = [m.places[0]!.name, m.places[1]!.name];
  const ex = Math.round((L * s + 0.1 * s) * 10) / 10;
  return choiceItem(R, {
    id: `estimateRange-${n}`, family: 'estimateRange', picture: { map: m, answer: `${j}\\text{ to }${j + 1}\\text{ intervals} \\to ${j * s}\\text{ to }${(j + 1) * s}${realT(real)}`, steps: 1 },
    prompt: `No ruler: use the scale bar by eye. About how far is it from ${a} to ${b} along the straight road?`, board: `1\\text{ interval} = ${s}${realT(real)}`,
    solution: [`By eye, the road is more than ${j} bar intervals and less than ${j + 1}.`, `So it is between ${j * s} and ${(j + 1) * s} ${words(real)}.`],
  }, [
    { t: `Between ${j * s} and ${(j + 1) * s} ${words(real)}`, ok: true, say: `Right: between ${j} and ${j + 1} intervals of ${s}.` },
    { t: `Exactly ${ex} ${words(real)}`, mc: MC.exact, say: 'By eye you can give a range or "about", not an exact decimal.' },
    { t: `Between ${(j + 1) * s} and ${(j + 2) * s} ${words(real)}`, say: `Lay the bar along in your mind: it fits ${j} times and a bit, not ${j + 1}.` },
  ]);
};

const benchmarkName: Gen = (R, n) => {
  const km = R() < 0.35, real: RealUnit = km ? 'km' : 'mi', u = km ? 'km' : 'mi', s = pick(R, [2, 5, 10]), j = int(R, 2, 4), L = j + pick(R, [-0.1, 0, 0.1]);
  const m = compose(R, {
    unit: 'in', legs: straightLeg(R, L), roadKind: pick(R, ['road', 'trail'] as const), kinds: ['town', 'tower'], bar: { step: s, len: 1, n: 3, real },
    ov: g => [ov({ id: 's0', k: 'copies', pts: [g.A, g.B], len: 1 })],
  });
  return choiceItem(R, {
    id: `benchmarkName-${n}`, family: 'benchmarkName', picture: { map: m, answer: `\\approx ${j} \\times ${s} = ${j * s}${realT(real)}`, steps: 1 },
    prompt: `Three students estimate the distance from ${m.places[0]!.name} to ${m.places[1]!.name}. Which estimate is backed by the scale bar?`, board: `1\\text{ interval} = ${s}${realT(real)}`,
    solution: [`Name the benchmark: about ${j} intervals fit, and each is ${s} ${u}.`, `So about ${j * s} ${u}.`],
  }, [
    { t: `About ${j} intervals of ${s} ${u}, so about ${j * s} ${u}`, ok: true, say: 'Right: the bar interval is the benchmark, and it is named.' },
    { t: `About ${j * s} ${u}: it just looks that far`, mc: MC.guess, say: 'The number may be fine, but "it looks that far" names no benchmark. Say how many intervals fit.' },
    { t: `About ${j} ${u}: it is ${j} intervals long`, mc: MC.subdiv, say: `${j} intervals, yes, but each interval is ${s} ${u}.` },
  ]);
};

// ===================== route-length =====================
const routeSum: Gen = (R, n) => {
  const N = pick(R, [1, 2, 4]);
  const pool = N === 1 ? [1, 2, 3] : N === 2 ? [1, 1.5, 2, 2.5] : [0.75, 1, 1.25, 1.5];
  let Ls: number[] = [], legs: Leg[] = [];
  for (let t = 0; t < 200; t++) {
    const k = int(R, 2, 4);
    Ls = Array.from({ length: k }, () => pick(R, pool));
    const tot = Ls.reduce((s, x) => s + x, 0) * N;
    legs = R() < 0.5 ? bentLegs(R, Ls) : windingLegs(R, Ls);
    if (tot <= 10 && tot >= 4 && fits(legs, 'in', 1.3)) break;
  }
  const m = compose(R, {
    unit: 'in', legs, roadKind: 'road', kinds: ['town', pick(R, ['camp', 'school'] as const)], verbal: { per: N, real: 'mi' },
    ov: g => [ov({ id: 'a', k: 'route', pts: g.route }), ...g.route.slice(1).map((p, i) => ov({ id: 'a', k: 'leg', a: g.route[i]!, b: p, text: `${fx(Ls[i]!)} in`, col: 'first' })),
      ov({ id: 's0', k: 'route', pts: g.route, col: 'link' })],
  });
  const tot = Ls.reduce((s, x) => s + x * N, 0), sumIn = Ls.reduce((s, x) => s + x, 0);
  const slips: Slip[] = [];
  if (N !== 1) slips.push({ v: sumIn, mc: MC.drawing, say: `${fh(sumIn)} is the map length in inches. Each inch represents ${N} miles.` });
  if (N !== 1) slips.push({ v: Ls[0]! * N + Ls.slice(1).reduce((s, x) => s + x, 0), mc: MC.oneLeg, say: 'Convert EVERY part, not just the first one.' });
  Ls.forEach(x => slips.push({ v: tot - x * N, mc: MC.lostTrack, say: `One part of the road is missing. There are ${Ls.length} parts.` }));
  const termT = Ls.map(x => ft(x * N)).join(' + ');
  return numItem({
    id: `routeSum-${n}`, family: 'routeSum', picture: { map: m, answer: `${termT} = ${tot}\\text{ mi}`, steps: 1 },
    prompt: `On this map ${A('1 inch')} represents ${B(realW(N, 'mi'))}. The road from ${m.places[0]!.name} to ${m.places[1]!.name} has ${Ls.length} straight parts. How long is the road?`,
    board: `1\\text{ in} \\to ${N}\\text{ mi}`,
    solution: [`Convert each part: ${Ls.map(x => `${fh(x)} × ${N} = ${fh(x * N)}`).join(', ')}.`, `Add them: ${tot} miles.`],
  }, 'num', 'miles', tot, `Yes: every part converted, then added.`, slips, 'Convert each part to miles, then add all the parts.');
};

const routeBar: Gen = (R, n) => {
  const step = pick(R, [1, 2]), len = step === 1 ? 1 : 0.5;
  let cs: number[] = [];
  for (let t = 0; t < 40; t++) {
    cs = Array.from({ length: int(R, 3, 4) }, () => pick(R, [1, 1.5, 2]));
    const c = cs.reduce((s, x) => s + x, 0);
    if (c * step <= 10 && c * len <= 5.5) break;
  }
  const c = cs.reduce((s, x) => s + x, 0);
  const legs = windingLegs(R, cs.map(x => x * len));
  const m = compose(R, {
    unit: 'in', legs, roadKind: 'road', kinds: ['town', pick(R, ['camp', 'tower'] as const)], bar: { step, len, n: 4, real: 'mi' },
    ov: g => [ov({ id: 'a', k: 'copies', pts: g.route, len, sub: 2 })],
  });
  return numItem({
    id: `routeBar-${n}`, family: 'routeBar', picture: { map: m, answer: `${ft(c)} \\times ${step} = ${ft(c * step)}\\text{ mi}`, steps: 0 },
    prompt: `The road from ${m.places[0]!.name} to ${m.places[1]!.name} winds. Copies of one bar interval are laid along it, part after part. How long is the road?`,
    board: `1\\text{ interval} = ${step}\\text{ mi}`,
    solution: [`Count the intervals along every part: ${fh(c)} in all.`, `${fh(c)} × ${step} = ${fh(c * step)} miles.`],
  }, 'frac', 'miles', c * step, `Yes: ${fh(c)} intervals.`, step === 1 ? [] : [
    { v: c, mc: MC.subdiv, say: `${fh(c)} is the number of intervals. Each one is ${step} miles.` },
  ], 'Count the intervals around every bend (halves too), then use the miles per interval.');
};

// ===================== select-evidence =====================
const PYTH: [number, number, number][] = [[1.5, 2, 2.5], [2, 1.5, 2.5], [2.25, 3, 3.75], [3, 2.25, 3.75]];
const pickEvidence: Gen = (R, n) => {
  const byRoad = R() < 0.6, [l1, l2, h] = pick(R, PYTH), N = 2;
  const m = compose(R, {
    unit: 'in', legs: bentLegs(R, [l1, l2]), roadKind: 'road', kinds: ['town', pick(R, ['town', 'camp'] as const)], bar: BAR_MI(N), deco: ['lakeInBend'],
    ov: g => [byRoad ? ov({ id: 'a', k: 'route', pts: g.route }) : ov({ id: 'a', k: 'straight', a: g.A, b: g.B, col: 'pick' })],
  });
  const [a, b] = [m.places[0]!.name, m.places[1]!.name];
  const X = (byRoad ? l1 + l2 : h) * N;
  const opts: Opt[] = byRoad ? [
    { t: `The trip meter on a drive from ${a} to ${b} along this road`, ok: true, say: 'Right: same endpoints, same road, measured a different way.' },
    { t: 'Measuring the road on the map again', mc: MC.repeat, say: 'Repeating the same map work can repeat the same mistake. Use evidence from the real world.' },
    { t: `A flight app's straight-line distance from ${a} to ${b}`, mc: MC.straight, say: 'A straight-line distance is a different distance: the road bends.' },
  ] : [
    { t: `A GPS app's "as the crow flies" distance from ${a} to ${b}`, ok: true, say: 'Right: same endpoints, the same straight-line distance, measured another way.' },
    { t: `The trip meter after driving the road from ${a} to ${b}`, mc: MC.straight, say: 'The road bends, so the trip meter measures a longer, different distance.' },
    { t: 'Working out the same map distance again', mc: MC.repeat, say: 'Doing the same steps again is not independent evidence.' },
  ];
  return choiceItem(R, {
    id: `pickEvidence-${n}`, family: 'pickEvidence', picture: { map: m, answer: byRoad ? '\\text{the trip meter}' : '\\text{the GPS line}', steps: 0 },
    prompt: `From the map, the ${byRoad ? '<b>distance by road</b>' : '<b>straight-line distance</b>'} from ${a} to ${b} is ${B(`${fh(X)} miles`)}. Which is the best check of it?`,
    board: `\\text{${byRoad ? 'by road' : 'straight'}} = ${ft(X)}\\text{ mi}`,
    solution: ['A fair check measures the SAME distance: same endpoints, same kind of path, same unit.', 'And it comes from somewhere else, not from the same map work.'],
  }, opts);
};

// ===================== benchmark-check =====================
const TRIPS = [
  { who: 'Ava walks from home to the park', name: 'Ava', trip: 'a short walk to the park', lo: 1, hi: 2 },
  { who: 'Noah bikes to school', name: 'Noah', trip: 'a bike ride to school', lo: 2, hi: 3 },
  { who: 'The Lee family drives to the next town', name: 'Mr. Lee', trip: 'a drive to the next town', lo: 10, hi: 30 },
  { who: 'Sam hikes to the lookout', name: 'Sam', trip: 'a hike to the lookout', lo: 2, hi: 4 },
];
const plausible: Gen = (R, n) => {
  const T = pick(R, TRIPS);
  let d = 1, N = 1;
  for (let t = 0; t < 50; t++) { d = pick(R, [1, 1.5, 2, 2.5, 3]); N = pick(R, [1, 2, 4, 5, 10]); if (d * N >= T.lo && d * N <= T.hi && Number.isInteger(d * N)) break; }
  const tru = d * N, bad = R() < 0.65, X = bad ? tru * 10 : tru;
  const m = compose(R, {
    unit: 'in', legs: straightLeg(R, d), roadKind: T.trip.includes('hike') ? 'trail' : 'road', kinds: ['town', T.trip.includes('lookout') ? 'tower' : T.trip.includes('school') ? 'school' : 'town'], verbal: { per: N, real: 'mi' },
    ov: g => [ov({ id: 'a', k: 'route', pts: g.route }), ov({ id: 's0', k: 'leg', a: g.A, b: g.B, text: `${fx(d)} in`, col: 'first' })],
  });
  const name = T.name;
  const opts: Opt[] = bad ? [
    { t: `No: ${X} miles is far too far for ${T.trip}. Check the scale.`, ok: true, say: `Right. It should be about ${tru} miles: the answer is off by a factor of 10.` },
    { t: 'Yes: the multiplication was done right', mc: MC.noSize, say: `A right-looking calculation can still be off by 10. ${X} miles is a very long way for ${T.trip}.` },
    { t: 'Yes: a map can show any distance', mc: MC.ctxBench, say: `The map can, but the trip can't: ${T.trip} is not ${X} miles.` },
  ] : [
    { t: `Yes: ${X} ${X === 1 ? 'mile' : 'miles'} fits ${T.trip}`, ok: true, say: 'Right. The size makes sense for the trip.' },
    { t: `No: it should be ${X * 10} miles`, say: `${X * 10} miles would be far too long for ${T.trip}.` },
    { t: "No: you can't check a map answer", say: 'You can: compare it with what you know about such trips.' },
  ];
  return choiceItem(R, {
    id: `plausible-${n}`, family: 'plausible', picture: { map: m, answer: `${ft(d)} \\times ${N} = ${tru}\\text{ mi}`, steps: 1 },
    prompt: `${T.who}. ${name} works out the distance on this map and gets ${B(`${X} miles`)}. Is that reasonable?`,
    board: `\\text{${name}: } ${X}\\text{ mi}`,
    solution: [`Think of the trip: ${T.trip} is about ${T.lo} to ${T.hi} miles.`, `On the map: ${fh(d)} in × ${N} = ${tru} miles.`],
  }, opts);
};

const whichReasonable: Gen = (R, n) => {
  const blocks = pick(R, [20, 40, 60, 80, 100]), tru = blocks / 20;
  const N = tru % 2 === 0 ? pick(R, [1, 2]) : 1, d = tru / N;
  if (d > 5) return whichReasonable(R, n);
  const m = compose(R, {
    unit: 'in', legs: bentLegs(R, d >= 2 ? [d / 2, d / 2] : [d]), roadKind: 'road', kinds: ['town', 'school'], verbal: { per: N, real: 'mi' },
    ov: g => [ov({ id: 'a', k: 'route', pts: g.route })],
  });
  const tenth = tru / 10;
  return choiceItem(R, {
    id: `whichReasonable-${n}`, family: 'whichReasonable', picture: { map: m, answer: `${blocks} \\times \\tfrac{1}{20} = ${tru}\\text{ mi}`, steps: 0 },
    prompt: `A city block is about ${B(`${fh(1 / 20)} mile`)}. The walk from ${m.places[0]!.name} to ${m.places[1]!.name} is about ${blocks} blocks. Three map answers: which one is reasonable?`,
    board: `1\\text{ block} \\approx \\tfrac{1}{20}\\text{ mi}`,
    solution: [`${blocks} blocks × ${fh(1 / 20)} mile = ${tru} ${tru === 1 ? 'mile' : 'miles'}.`, 'The answer that matches the benchmark is the reasonable one.'],
  }, [
    { t: `${tru} ${tru === 1 ? 'mile' : 'miles'}`, ok: true, say: `Right: ${blocks} blocks is about ${tru} ${tru === 1 ? 'mile' : 'miles'}.` },
    { t: `${tru * 10} miles`, mc: MC.noSize, say: `${tru * 10} miles would be ${blocks * 10} blocks. Ten times too big.` },
    { t: `${tenth} mile`, mc: MC.noSize, say: `${tenth} mile is only ${blocks / 10} blocks. Ten times too small.` },
  ]);
};

// ===================== error-scaling =====================
const errorSize: Gen = (R, n) => {
  const N = pick(R, [2, 4, 8, 10, 20]), L = int(R, 4, 14) / 4, len = Math.ceil(L + 0.25), d = dirOf(R, true);
  const m = compose(R, {
    unit: 'in', legs: [{ d, L }], roadKind: 'road', kinds: ['town', 'town'], verbal: { per: N, real: 'mi' }, reach: rulerReach(d, 0, len, 'in'),
    ov: g => [ov({ id: 'a', k: 'ruler', a: g.A, dir: g.dirs[0]!, start: 0, len }), ov({ id: 'a', k: 'brace', a: g.B, b: add(g.B, g.dirs[0]!, 0.25), text: `${fx(0.25)} in`, col: 'first' })],
  });
  return numItem({
    id: `errorSize-${n}`, family: 'errorSize', picture: { map: m, answer: `\\tfrac14 \\times ${N} = ${ft(N / 4)}\\text{ mi}`, steps: 0 },
    prompt: `Your ruler reading from ${m.places[0]!.name} to ${m.places[1]!.name} could be off by ${A(`${fh(0.25)} inch`)}. On this map ${A('1 inch')} represents ${B(`${N} miles`)}. By how many miles could the real distance be off?`,
    board: `\\text{slip} = \\tfrac14\\text{ in}`,
    solution: ['A slip on the map is a map length too: it gets the scale like every other length.', `${fh(0.25)} × ${N} = ${fh(N / 4)} miles.`],
  }, 'frac', 'miles', N / 4, `Yes: ${fh(0.25)} × ${N} = ${fh(N / 4)} miles.`, [
    { v: 0.25, mc: MC.errNotScaled, say: `The slip is ${fh(0.25)} inch on the MAP. In real life each inch is ${N} miles, so the slip is ${fh(0.25)} × ${N}.` },
    { v: N, say: `${N} miles is a whole inch. The slip is only a quarter of that.` },
    { v: 4 * N, mc: MC.divRate, say: `A quarter inch is less than an inch: ${fh(0.25)} × ${N}, not ${N} ÷ ${fh(0.25)}.` },
  ], `Treat the slip like any map length: multiply by ${N}.`);
};

const whichMapWorse: Gen = (R, n) => {
  const a = pick(R, [1, 2]), b = pick(R, [10, 20, 40]);
  const L = int(R, 6, 14) / 4, len = Math.ceil(L + 0.25), d = dirOf(R, true);
  const m = compose(R, {
    unit: 'in', legs: [{ d, L }], roadKind: 'road', kinds: ['town', 'town'], reach: rulerReach(d, 0, len, 'in'),
    ov: g => [ov({ id: 'a', k: 'ruler', a: g.A, dir: g.dirs[0]!, start: 0, len })],
  });
  return choiceItem(R, {
    id: `whichMapWorse-${n}`, family: 'whichMapWorse', picture: { map: m, work: [`\\text{Map B: } 1\\text{ in} \\to ${b}\\text{ mi}`], answer: `\\tfrac14 \\times ${b} = ${ft(b / 4)}\\text{ mi}`, steps: 0 },
    prompt: `You measure ${m.places[0]!.name} to ${m.places[1]!.name} and slip by ${A(`${fh(0.25)} inch`)}. On Map A ${A('1 inch')} represents ${B(realW(a, 'mi'))}; on Map B it represents ${B(`${b} miles`)}. On which map does the slip cause the bigger real error?`,
    board: `\\text{Map A: } 1\\text{ in} \\to ${a}\\text{ mi}`,
    solution: [`Map A: ${fh(0.25)} × ${a} = ${fh(a / 4)} mile. Map B: ${fh(0.25)} × ${b} = ${fh(b / 4)} miles.`, 'The more miles each inch represents, the more a slip costs.'],
  }, [
    { t: `Map B: there ${fp(0.25)} inch stands for ${fp(b / 4)} miles, on Map A only ${fp(a / 4)} mile`, ok: true, say: 'Right. Each inch carries more miles on Map B, so a slip does too.' },
    { t: `The same: both slips are ${fp(0.25)} inch`, mc: MC.errNotScaled, say: 'Same slip on paper, but the scale multiplies it into very different real errors.' },
    { t: 'Map A: its scale number is smaller, so it is less exact', say: `A smaller number of miles per inch means a slip costs fewer miles: ${fp(a / 4)} vs ${fp(b / 4)}.` },
  ]);
};

// ===================== tolerance-agreement =====================
function linePic(R: () => number, within: boolean): { L: LinePic; ev: Evidence; M: number; E: number; d: number; tol: number } {
  for (;;) {
    const sign = R() < 0.5, tol = within ? pick(R, [1, 2]) : pick(R, [0.5, 1, 2]);
    const ds = within ? [0.5, 1, 1.5].filter(x => x < tol) : [tol + 0.5, tol + 1];
    const d = pick(R, ds);
    const M = int(R, 8, 90) / 2;
    let E = M + d * (R() < 0.5 ? -1 : 1);
    if (!sign && !Number.isInteger(E)) continue;   // trip meters show whole miles
    if (E < 1) E = M + d;
    const from = Math.floor(Math.min(M, E)) - 2, to = Math.ceil(Math.max(M, E)) + 2;
    const L: LinePic = { from, to, marks: [{ v: M, name: 'map', col: 'first' }, { v: E, name: sign ? 'sign' : 'trip meter', col: 'second' }], tol, ask: 'none', real: 'mi' };
    if (lineProblems(L).length) continue;
    const ev: Evidence = sign ? { kind: 'sign', title: pick(R, ['Fox Camp', 'Oakdale', 'Riverton', 'Pine Camp']), value: fx(E), unit: 'mi' } : { kind: 'meter', title: 'Trip meter', value: fx(E), unit: 'mi' };
    return { L, ev, M, E, d, tol };
  }
}
const agree: Gen = (R, n) => {
  const within = R() < 0.5, { L, ev, M, E, d, tol } = linePic(R, within);
  const src = ev.kind === 'sign' ? 'the road sign' : 'the trip meter';
  const tw = `${fp(tol)} ${tol === 1 ? 'mile' : 'miles'}`;
  const opts: Opt[] = within ? [
    { t: `Yes: they are within ${tw} of each other`, ok: true, say: `Right: ${fh(d)} mile apart, inside the ${tw}.` },
    { t: `No: the gap is more than ${tw}`, say: `Read the gap on the line: it is ${fh(d)} mile.` },
    { t: 'No: they would have to match exactly', mc: MC.allOrNothing, say: `The question allows ${tw}. A gap of ${fh(d)} mile is inside that.` },
  ] : [
    { t: `No: the gap is more than ${tw}`, ok: true, say: `Right: they are ${fh(d)} miles apart, more than ${tw}.` },
    { t: `Yes: they are within ${tw} of each other`, mc: MC.roughMatch, say: `Read the gap on the line: ${fh(d)} miles. That is more than ${tw}.` },
    { t: 'Yes: the numbers look about the same', mc: MC.roughMatch, say: `"About the same" is not the test. The gap, ${fh(d)} miles, is more than ${tw}.` },
  ];
  return choiceItem(R, {
    id: `agree-${n}`, family: 'agree', picture: { line: L, ev, answer: `\\text{gap } ${ft(d)}\\text{ mi} ${within ? '<' : '>'} ${ft(tol)}\\text{ mi}`, steps: 2 },
    prompt: `The map gives ${A(`${fh(M)} miles`)}; ${src} says ${B(`${fh(E)} miles`)}. Do they agree <b>within ${tw}</b>?`,
    board: `\\text{within } ${ft(tol)}\\text{ mi?}`,
    solution: [`On the line, the two values are ${fh(d)} ${d === 1 ? 'mile' : 'miles'} apart.`, `${fh(d)} is ${within ? 'not more than' : 'more than'} ${fh(tol)}: they ${within ? 'agree' : 'do not agree'}.`],
  }, opts);
};

const gapRead: Gen = (R, n) => {
  const { L, ev, M, E, d } = linePic(R, R() < 0.5);
  const src = ev.kind === 'sign' ? 'the road sign' : 'the trip meter';
  return numItem({
    id: `gapRead-${n}`, family: 'gapRead', picture: { line: { ...L, tol: undefined }, ev, answer: `${ft(Math.max(M, E))} - ${ft(Math.min(M, E))} = ${ft(d)}\\text{ mi}`, steps: 1 },
    prompt: `The map gives ${A(`${fh(M)} miles`)}; ${src} says ${B(`${fh(E)} miles`)}. How far apart are they? Read the gap on the number line.`,
    board: '\\text{gap} = \\,?\\text{ mi}',
    solution: ['Each small step on the line is half a mile.', `From one pin to the other: ${fh(d)} ${d === 1 ? 'mile' : 'miles'}.`],
  }, 'frac', 'miles', d, `Yes: ${fh(d)} apart.`, [
    { v: 2 * d, mc: MC.subdiv, say: 'Each small step is half a mile, not a whole mile.' },
    { v: d + 0.5, mc: MC.points, say: 'Count the spaces between the pins, not the tick marks.' },
  ], 'Count the half-mile steps from one pin to the other.');
};

// ===================== diagnose-discrepancy =====================
type Case = 'endpoint' | 'section' | 'additive' | 'unit' | 'bar10' | 'zero' | 'none';
const CAUSE: Record<Case, string> = {
  endpoint: 'Sam measured to the wrong place',
  section: 'Sam left out one part of the road',
  additive: 'Sam added the scale instead of multiplying',
  unit: 'Sam wrote inches, the map unit, instead of miles',
  bar10: 'Sam read the bar wrong: each interval is 2 miles, not 20',
  zero: 'Sam used the end reading, but the ruler did not start at 0',
  none: 'No mistake shows: the work checks out. A sign can round, or measure from a different point',
};
interface Diag { m: MapPic; work: string[]; wrong: number; right: number; ev: Evidence; why: string }
function diagCase(R: () => number, c: Case, fixIt: boolean): Diag {
  const N = pick(R, [2, 4]);
  const evFor = (v: number, name: string): Evidence => ({ kind: 'sign', title: name, value: fx(v), unit: 'mi' });
  const shift = fixIt && R() < 0.5 ? 0.5 * (R() < 0.5 ? -1 : 1) : 0;
  if (c === 'endpoint') {
    const d = pick(R, [1.5, 2, 2.5]);
    const m = compose(R, { unit: 'in', legs: straightLeg(R, d), roadKind: 'road', kinds: ['town', 'camp'], extra: 'town', verbal: { per: N, real: 'mi' }, ov: g => [ov({ id: 'a', k: 'leg', a: g.A, b: g.B, text: `${fx(d)} in`, col: 'first' })] });
    const C = m.places.find(p => p.id === 'C')!, A0 = m.places[0]!;
    const dc = Math.max(0.5, Math.round(dist(A0.at, C.at) * 4) / 4);
    return { m, work: [`\\text{to ${capT(C.name)}: } ${ft(dc)}\\text{ in}`, `${ft(dc)} \\times ${N} = ${ft(dc * N)}\\text{ mi}`], wrong: dc * N, right: d * N, ev: evFor(d * N + shift, m.places[1]!.name), why: `The question was ${A0.name} to ${m.places[1]!.name}, not to ${C.name}.` };
  }
  if (c === 'section') {
    const Ls = [pick(R, [1, 1.5]), pick(R, [1, 1.5, 2]), pick(R, [0.5, 1])];
    const m = compose(R, { unit: 'in', legs: bentLegs(R, Ls), roadKind: 'road', kinds: ['town', 'camp'], verbal: { per: N, real: 'mi' },
      ov: g => g.route.slice(1).map((p, i) => ov({ id: 'a', k: 'leg', a: g.route[i]!, b: p, text: `${fx(Ls[i]!)} in`, col: 'first' })) });
    const right = (Ls[0]! + Ls[1]! + Ls[2]!) * N, wrong = (Ls[0]! + Ls[1]!) * N;
    return { m, work: [`(${ft(Ls[0]!)} + ${ft(Ls[1]!)}) \\times ${N} = ${ft(wrong)}\\text{ mi}`], wrong, right, ev: evFor(right + shift, m.places[1]!.name), why: `The road has three parts: (${fh(Ls[0]!)} + ${fh(Ls[1]!)} + ${fh(Ls[2]!)}) × ${N} = ${fh(right)} miles.` };
  }
  if (c === 'additive' || c === 'unit') {
    const d = pick(R, [2, 3, 4].filter(x => x + N !== x * N));
    const m = compose(R, { unit: 'in', legs: straightLeg(R, d), roadKind: 'road', kinds: ['town', 'town'], verbal: { per: N, real: 'mi' }, ov: g => [ov({ id: 'a', k: 'leg', a: g.A, b: g.B, text: `${d} in`, col: 'first' })] });
    if (c === 'additive') return { m, work: [`${d} + ${N} = ${d + N}\\text{ mi}`], wrong: d + N, right: d * N, ev: evFor(d * N + shift, m.places[1]!.name), why: `Every inch represents ${N} miles: ${d} × ${N} = ${d * N}.` };
    return { m, work: [`${d} \\times ${N} = ${d * N}\\text{ in}`], wrong: d * N, right: d * N, ev: evFor(d * N, m.places[1]!.name), why: `The result is a real distance: ${d * N} miles, not inches.` };
  }
  if (c === 'bar10') {
    const k = int(R, 2, 4);
    const m = compose(R, { unit: 'in', legs: straightLeg(R, k), roadKind: 'road', kinds: ['town', 'camp'], bar: BAR_MI(2), ov: g => [ov({ id: 'a', k: 'copies', pts: [g.A, g.B], len: 1 })] });
    return { m, work: [`${k} \\times 20 = ${20 * k}\\text{ mi}`], wrong: 20 * k, right: 2 * k, ev: evFor(2 * k + shift, m.places[1]!.name), why: `Each interval goes from 0 to 2: ${k} × 2 = ${2 * k} miles.` };
  }
  if (c === 'zero') {
    const L = pick(R, [2, 2.5, 3, 3.5]), s = 1, len = Math.ceil(L + s), d = dirOf(R, true);
    const m = compose(R, { unit: 'in', legs: [{ d, L }], roadKind: 'road', kinds: ['town', 'town'], verbal: { per: N, real: 'mi' }, reach: rulerReach(d, s, len, 'in'),
      ov: g => [ov({ id: 'a', k: 'ruler', a: g.A, dir: g.dirs[0]!, start: s, len })] });
    return { m, work: [`\\text{ruler: } ${ft(L + s)}\\text{ in}`, `${ft(L + s)} \\times ${N} = ${ft((L + s) * N)}\\text{ mi}`], wrong: (L + s) * N, right: L * N, ev: evFor(L * N + shift, m.places[1]!.name), why: `The ruler starts at 1 at the first town: ${fh(L + s)} − 1 = ${fh(L)} in, × ${N} = ${fh(L * N)} miles.` };
  }
  const d = pick(R, [2, 2.5, 3]);
  const m = compose(R, { unit: 'in', legs: straightLeg(R, d), roadKind: 'road', kinds: ['town', 'camp'], verbal: { per: N, real: 'mi' }, ov: g => [ov({ id: 'a', k: 'leg', a: g.A, b: g.B, text: `${fx(d)} in`, col: 'first' })] });
  return { m, work: [`${ft(d)} \\times ${N} = ${ft(d * N)}\\text{ mi}`], wrong: d * N, right: d * N, ev: evFor(d * N + 0.5 * (R() < 0.5 ? -1 : 1), m.places[1]!.name), why: 'The map work is right. A half mile can come from the sign rounding, or measuring from the edge of town.' };
}
const findError: Gen = (R, n) => {
  const c = pick(R, ['endpoint', 'section', 'additive', 'unit', 'bar10', 'zero', 'none'] as const);
  const D = diagCase(R, c, false);
  const others = shuffle(R, (Object.keys(CAUSE) as Case[]).filter(x => x !== c && x !== 'none'));
  const [a0, b0] = [D.m.places[0]!.name, D.m.places[1]!.name];
  const opts: Opt[] = c === 'none' ? [
    { t: CAUSE.none, ok: true, say: 'Right. The work is correct, and a small gap is not enough evidence of a mistake.' },
    { t: CAUSE[others[0]!], mc: MC.singleCause, say: 'Nothing in the work shows that. Check each step: they are all right.' },
    { t: CAUSE[others[1]!], mc: MC.singleCause, say: 'Nothing in the work shows that. Check each step: they are all right.' },
  ] : [
    { t: CAUSE[c], ok: true, say: `Right. ${D.why}` },
    { t: CAUSE[others[0]!], say: `Check that step in the work: it is fine. ${D.why}` },
    { t: "Change the answer to the sign's number", mc: MC.changeAnswer, say: 'That hides the mistake instead of finding it. Find the step that went wrong.' },
  ];
  return choiceItem(R, {
    id: `findError-${n}`, family: 'findError', picture: { map: D.m, ev: D.ev, work: D.work.slice(1), answer: `\\text{right: } ${ft(D.right)}\\text{ mi}`, steps: 0 },
    prompt: `Sam found the distance from ${a0} to ${b0} (his work is on the board). The road sign says ${B(`${fh(valueSign(D.ev))} mi`)}. What is the most likely cause of the difference?`,
    board: D.work[0]!,
    solution: [D.why],
  }, opts);
};
function valueSign(ev: Evidence): number { const t = ev.value; const w = parseInt(t, 10) || 0; return w + (t.includes('½') ? 0.5 : t.includes('¼') ? 0.25 : t.includes('¾') ? 0.75 : 0); }

const fixIt: Gen = (R, n) => {
  const c = pick(R, ['endpoint', 'section', 'additive', 'bar10', 'zero'] as const);
  const D = diagCase(R, c, true);
  const [a0, b0] = [D.m.places[0]!.name, D.m.places[1]!.name];
  const ev = valueSign(D.ev);
  const slips: Slip[] = [{ v: D.wrong, say: "That is Sam's answer. Find the step that went wrong, then redo it." }];
  if (!near(ev, D.right)) slips.push({ v: ev, mc: MC.changeAnswer, say: "That copies the sign. Fix Sam's work from the map instead: the sign can round." });
  return numItem({
    id: `fixIt-${n}`, family: 'fixIt', picture: { map: D.m, ev: D.ev, work: D.work.slice(1), answer: `${ft(D.right)}\\text{ mi}`, steps: 0 },
    prompt: `Sam's work for the distance from ${a0} to ${b0} is on the board, next to the road sign. Find his mistake and fix it. What is the right distance from the map?`,
    board: D.work[0]!,
    solution: [D.why],
  }, 'frac', 'miles', D.right, `Yes: ${fh(D.right)} miles. ${D.why}`, slips, 'Check each step of the work against the map: endpoints, every part of the road, the scale.');
};

export const GENERATORS: Record<FamilyId, Gen> = {
  keyLookup, symbolSize, measurePoint, sameEverywhere, biggerMap, barInterval, barPoint, whichDistance, compareDist, layBar, countIntervals,
  halfBar, leftSub, rulerRead, shiftedRuler, roundRuler, roundCm, unitScale, unitPick, barToUnit, halfSections, fracScale, roundFirst,
  estimateRange, benchmarkName, routeSum, routeBar, pickEvidence, plausible, whichReasonable, errorSize, whichMapWorse, agree, gapRead, findError, fixIt,
};
export type { ComposeSpec, Geo };
