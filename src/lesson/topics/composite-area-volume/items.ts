// items.ts: practice families for "composite area, volume and surface area" (grade 7, 7.G.B.6 + TEKS / B.E.S.T.).
// One family per sub-goal of the topic JSON (21), each a deep structure with free skins (contexts, numbers, units);
// a generator gets the sub-goal id. Every wrong answer the classifier recognises carries its misconception id
// (math-curriculum-essentials/misconceptions.json). Pure: no DOM, no canvas. Every number comes from measure.ts and
// every picture is a Solids or Plan parameter set the page draws. PROBES lists, per item, typical wrong responses and
// the id they must get (tests).
import { type Gen, type Item, type Response, type Verdict, A, B, S, int, pick, shuffle } from '../../runtime/item';
import {
  type BoxSpec, type NumStyle, type P2, type V3, box3, boxSurface, boxVolume, clean, contactArea, cylSurfPi, cylVolPi, fmt, fmtT, near,
  polyArea, prismVolume, pyramidVolume, quarters, unionSurface, unionVolume, trapArea, triArea,
} from './measure';
import type { Body, Glow, Label, Measure, SolidsParams } from './Solids';
import type { PlanLabel, PlanSeg, PlanSpec } from './FloorPlan';
import { endOnChoice } from '../../runtime/explain';

export type FamilyId =
  | 'split' | 'hidden' | 'areaAdd' | 'areaSub' | 'volAdd' | 'volSub' | 'prismBh' | 'tent' | 'third' | 'pyrVol' | 'twoWays'
  | 'classify' | 'faces' | 'joinSA' | 'partialSA' | 'cutJoin' | 'which' | 'cylVol' | 'cylSA' | 'missing' | 'cost';
export const FAMILY_NAMES: Record<FamilyId, string> = {
  split: 'Does the split work?',
  hidden: 'The missing length',
  areaAdd: 'Area by adding parts',
  areaSub: 'Area by taking away',
  volAdd: 'Volume by adding blocks',
  volSub: 'Volume with a part removed',
  prismBh: 'Prism volume: V = Bh',
  tent: 'One prism, a composite base',
  third: 'Pyramid and prism',
  pyrVol: 'Pyramid volume',
  twoWays: 'Two ways, one answer',
  classify: 'Inside or outside?',
  faces: 'Count the outside faces',
  joinSA: 'Joined blocks: surface area',
  partialSA: 'A small block on a big one',
  cutJoin: 'Cut it, join it',
  which: 'Fill, cover or coat?',
  cylVol: 'Cylinder volume',
  cylSA: 'Cylinder surface from its net',
  missing: 'Find the missing height',
  cost: 'How much to buy?',
};

export const MC = {
  gapsOverlaps: 'mc.area-perimeter.accepts-gaps-or-overlaps-in-covering',
  notDeduce: 'mc.area-perimeter.does-not-deduce-unlabeled-lengths',
  wholeForPart: 'mc.area-perimeter.uses-whole-length-for-a-part',
  enclosing: 'mc.area-perimeter.ignores-cutout-uses-enclosing-area',
  unitDim: 'mc.measurement-units.wrong-unit-dimension',
  slantHeight: 'mc.area-perimeter.uses-slant-side-as-height',
  addsCutout: 'mc.area-perimeter.adds-cutout-area',
  perimInArea: 'mc.area-perimeter.mixes-lengths-into-area-sums',
  copiesNearby: 'mc.area-perimeter.copies-a-nearby-length',
  boundingBox: 'mc.volume.uses-bounding-box-for-composite-solid',
  contactFromVol: 'mc.area-perimeter.subtracts-contact-face-area-from-volume',
  keepsEnclosing: 'mc.area-perimeter.keeps-enclosing-volume-after-removal',
  openingArea: 'mc.volume.subtracts-opening-area-instead-of-cavity-volume',
  bhOnlyBoxes: 'mc.volume.bh-only-for-boxes',
  slantEdge: 'mc.volume.uses-nonperpendicular-edge-as-height',
  baseBottom: 'mc.shapes.base-is-the-bottom-face',
  methodsDisagree: 'mc.reasoning-language.methods-can-disagree',
  baseProduct: 'mc.volume.base-length-product-regardless-of-shape',
  thirdAny: 'mc.volume.one-third-for-any-pair',
  coneHalf: 'mc.volume.cone-half-of-cylinder',
  baseTriHeight: 'mc.area-perimeter.uses-base-triangle-height-as-pyramid-height',
  dropsCoef: 'mc.volume.drops-formula-coefficient',
  totalMatches: 'mc.area-perimeter.accepts-work-because-total-matches',
  onlyVisible: 'mc.shapes.counts-only-visible-parts-of-solid',
  hiddenContact: 'mc.area-perimeter.counts-hidden-contact-faces',
  removesOnce: 'mc.area-perimeter.removes-shared-part-only-once',
  wholeFace: 'mc.area-perimeter.removes-whole-face-under-partial-contact',
  cutPreserves: 'mc.area-perimeter.cutting-preserves-total-surface-area',
  changeTogether: 'mc.area-perimeter.area-and-perimeter-change-together',
  excludesBottom: 'mc.area-perimeter.always-excludes-bottom-faces',
  saVsVolume: 'mc.area-perimeter.confuses-surface-area-with-volume',
  cubicLength: 'mc.measurement-units.labels-length-with-cubic-units',
  diameter: 'mc.circles.diameter-for-radius',
  expBeyond: 'mc.properties.exponent-applied-beyond-base',
  circTimesH: 'mc.volume.circumference-times-height',
  sideIncrease: 'mc.area-perimeter.adds-side-increase-directly-to-area',
  ignoresContext: 'mc.area-perimeter.ignores-context-on-which-surfaces-count',
  piR2Curved: 'mc.area-perimeter.uses-pi-r-squared-for-curved-surface',
  aroundAcross: 'mc.circles.distance-around-as-across',
  unitFraction: 'mc.linear-equations.divides-to-undo-unit-fraction-factor',
  partOfBase: 'mc.volume.divides-by-part-of-base',
  keepsPi: 'mc.volume.keeps-pi-in-length',
  unconverted: 'mc.measurement-units.arithmetic-on-unconverted-unit-numerals',
  fracItems: 'mc.mul-div.fractional-answer-for-whole-items',
  roundsNearest: 'mc.estimation.rounds-nearest-when-context-needs-direction',
  unitCostDiv: 'mc.ratio-rate.divides-unit-cost-by-quantity',
} as const;

/** what the page draws for an item: a Solids or Plan block, the keys it starts with, the solution's beats, the board */
export interface CavPicture {
  kind: 'solids' | 'plan';
  solids?: SolidsParams;
  plan?: PlanSpec;
  /** progress keys on when the item appears */ show: string[];
  /** the worked solution: groups of keys that go on one after another */ solve: string[][];
  /** keys that go off as the solution starts (the whole solid fades when its pieces come apart) */ hide?: string[];
  /** the solution on the board (TeX lines, short) */ hero: string[];
  /** a small note under the model ("Not to scale") */ note?: string;
}

export const PROBES = new WeakMap<Item, { r: Response; mc: string }[]>();
const probe = (it: Item, r: Response, mc: string) => { const l = PROBES.get(it) ?? []; l.push({ r, mc }); PROBES.set(it, l); };

type Rn = () => number;
const P = (s: string | number) => `<b class="p">${s}</b>`;
const tt = (s: string) => `\\text{${s}}`;

// ---------- number items ----------
interface Wrong { v: number; mc?: string; say: string }
interface Base { id: string; family: FamilyId; prompt: string; board: string; solution: string[]; picture: CavPicture; unit: string }
function valueOf(r: Response): number | null {
  if (r.kind === 'num') return Number.isFinite(r.v) ? r.v : null;
  if (r.kind === 'frac') { if (!Number.isInteger(r.w) || !Number.isInteger(r.n) || !Number.isInteger(r.d) || r.d <= 0 || r.n < 0) return null; return r.w + (r.w < 0 ? -1 : 1) * r.n / r.d; }
  return null;
}
/** the response that has the value x: whole numbers and decimals in the num box, quarters and thirds as mixed numbers */
function respOf(x: number, input: 'num' | 'frac'): Response {
  if (input === 'num') return { kind: 'num', v: x };
  const w = Math.floor(x + 1e-9), f = x - w;
  for (const d of [2, 3, 4, 6, 8, 9, 12]) { const n = Math.round(f * d); if (near(f, n / d) && n < d) return n === 0 ? { kind: 'frac', w, n: 0, d: 1 } : { kind: 'frac', w, n, d }; }
  return { kind: 'frac', w, n: 0, d: 1 };
}
const isThirds = (x: number) => !Number.isInteger(clean(x)) && near(x * 3, Math.round(x * 3)) && !quarters(x);
/** "an" where the next word is read with a vowel sound: an ice block, an oatmeal tub, an 18 in base, an 8 ft wall */
const art = (t: string) => t.replace(/\b([Aa]) ((?:<[^>]*>)*)(?=[aeioAEIO]|8|1[18](?![\d.,]))/g, '$1n $2');
const artBase = <T extends { prompt: string; solution: string[] }>(b: T): T => ({ ...b, prompt: art(b.prompt), solution: b.solution.map(art) });
/** a number answer: equal values are right (tol for answers rounded from 3.14) */
function numItem(b0: Base, ans: number, okSay: string, wrongs: Wrong[], fallback: string, o: { style?: NumStyle; tol?: number } = {}): Item {
  ans = clean(ans);
  const b = artBase(b0);
  const frac = !Number.isInteger(ans) && (isThirds(ans) || (o.style === 'frac' && quarters(ans)));
  const input: 'num' | 'frac' = frac ? 'frac' : 'num';
  const tol = o.tol ?? 1e-6;
  const eq = (v: number, w: number) => (o.tol ? Math.abs(v - w) <= tol : near(v, w, 1e-7));
  const kept: Wrong[] = [];
  for (const w of wrongs) { const v = clean(w.v); if (!Number.isFinite(v) || eq(v, ans) || kept.some(k => eq(k.v, v))) continue; kept.push({ ...w, v }); }
  const it: Item = {
    ...b, picture: b.picture as unknown as Item['picture'], input, answer: respOf(ans, input),
    check(r: Response): Verdict {
      const v = valueOf(r);
      if (v === null) return { ok: false, say: input === 'frac' ? 'Type a number: a whole number, a fraction or a mixed number.' : 'Type a number.' };
      if (eq(v, ans)) return { ok: true, say: okSay };
      for (const w of kept) if (eq(v, w.v)) return { ok: false, mc: w.mc, say: w.say };
      return { ok: false, say: fallback };
    },
  };
  for (const w of kept) if (w.mc) probe(it, w.v > 0 && !Number.isInteger(w.v) && input === 'frac' && (quarters(w.v) || isThirds(w.v)) ? respOf(w.v, 'frac') : { kind: 'num', v: w.v }, w.mc);
  return it;
}
interface Opt { t: string; ok?: boolean; say: string; mc?: string }
function choiceItem(b0: Omit<Base, 'unit'>, R: Rn, opts: Opt[]): Item {
  const b = artBase(b0), o = shuffle(R, opts.map(x => ({ ...x, t: art(x.t), say: art(x.say) })));
  const right = o.findIndex(x => x.ok);
  const it: Item = {
    ...b, picture: b.picture as unknown as Item['picture'], input: 'choice', choices: o.map(x => x.t), answer: { kind: 'choice', i: right }, solution: endOnChoice(b.solution, o[right]!.t),
    check(r: Response): Verdict {
      if (r.kind !== 'choice' || !o[r.i]) return { ok: false, say: 'Pick one answer.' };
      const x = o[r.i]!;
      return { ok: r.i === right, mc: r.i === right ? undefined : x.mc, say: x.say };
    },
  };
  o.forEach((x, i) => { if (!x.ok && x.mc) probe(it, { kind: 'choice', i }, x.mc); });
  return it;
}
const uniq = (xs: string[]) => new Set(xs).size === xs.length;

// ---------- contexts (US units first; metric where science uses it) ----------
const PLANS = [
  { what: 'patio', u: 'ft' }, { what: 'deck', u: 'ft' }, { what: 'bedroom floor', u: 'ft' }, { what: 'garden bed', u: 'ft' },
  { what: 'stage floor', u: 'ft' }, { what: 'skate park pad', u: 'ft' }, { what: 'classroom floor', u: 'ft' }, { what: 'lawn', u: 'yd' },
  { what: 'kitchen counter top', u: 'in' }, { what: 'quilt', u: 'in' }, { what: 'poster board', u: 'in' }, { what: 'lab bench top', u: 'm' },
];
const STEPS = [
  { what: 'concrete step', u: 'ft' }, { what: 'foam gym step', u: 'ft' }, { what: 'wooden podium', u: 'ft' }, { what: 'stack of wooden blocks', u: 'in' },
  { what: 'clay model', u: 'cm' }, { what: 'bookshelf base', u: 'in' }, { what: 'stone bench', u: 'ft' }, { what: 'raised planter', u: 'ft' },
];
const BLOCKS = [
  { what: 'wooden block', u: 'in' }, { what: 'block of clay', u: 'in' }, { what: 'concrete block', u: 'in' }, { what: 'foam block', u: 'in' },
  { what: 'block of cheese', u: 'cm' }, { what: 'stone block', u: 'ft' }, { what: 'ice block', u: 'in' },
];
/** two of them: "blocks of cheese", "wooden blocks" */
const plural = (what: string) => (/^block of /.test(what) ? what.replace(/^block/, 'blocks') : `${what}s`);
const PRISMS = ['tent', 'doorstop', 'ramp', 'chocolate box', 'cheese wedge', 'roof attic', 'trough', 'skate ramp'];
const PYRS = ['glass paperweight', 'stone pyramid model', 'pyramid tent', 'roof cap', 'pyramid candle', 'crystal'];
/** units that fit each pyramid's size (a pyramid tent is feet, not 8 inches tall; a paperweight is not feet) */
const PYR_U: Record<string, string[]> = { 'glass paperweight': ['cm', 'in'], 'stone pyramid model': ['in', 'cm'], 'pyramid tent': ['ft'], 'roof cap': ['ft'], 'pyramid candle': ['cm', 'in'], crystal: ['cm'] };
const CYLS = [
  { what: 'water tank', u: 'ft' }, { what: 'soup can', u: 'in' }, { what: 'oatmeal tub', u: 'in' }, { what: 'rain barrel', u: 'ft' },
  { what: 'candle', u: 'cm' }, { what: 'drum', u: 'in' }, { what: 'paint can', u: 'in' }, { what: 'round pool', u: 'ft' },
];
const sqU = (u: string) => `${u}²`, cuU = (u: string) => `${u}³`;
const sqT = (u: string) => `\\text{ ${u}}^2`, cuT = (u: string) => `\\text{ ${u}}^3`;
const L = (x: number, u: string, st: NumStyle = 'dec') => `${fmt(x, st)} ${u}`;
/** a style for the sub-goal's number ranges: whole numbers, then halves as decimals or fractions */
function styleFor(R: Rn, sg: string | undefined, own: string): { st: NumStyle; k: number } {
  if (sg !== own) return { st: 'dec', k: 1 };
  const r = R();
  // fractions (halves, answers in quarters) only for areas; volumes of halves would need eighths: decimals there
  const frac = own.startsWith('area');
  return r < 0.5 ? { st: 'dec', k: 1 } : r < 0.75 || !frac ? { st: 'dec', k: 0.5 } : { st: 'frac', k: 0.5 };
}
const TRIPLES: [number, number, number][] = [[3, 4, 5], [4, 3, 5], [6, 8, 10], [8, 6, 10], [5, 12, 13], [9, 12, 15], [12, 9, 15], [12, 5, 13]];

// ---------- picture helpers ----------
const lab = (text: string, a: V3, b: V3, o: Partial<Label> = {}): Label => ({ text, a, b, ...o });
// labels on the edges that are on the solid's outline in this view (front-left-top camera): a length on the bottom
// front edge (floor boxes) or the top back edge (raised boxes), a depth on the bottom right edge, a height on the left
const lenLab = (b: BoxSpec, text: string, o: Partial<Label> = {}): Label => {
  const [x, y, z] = b.at, [l, w, h] = b.size;
  return z <= 1e-9 ? lab(text, [x, y, z], [x + l, y, z], o) : lab(text, [x, y + w, z + h], [x + l, y + w, z + h], o);
};
const depLab = (b: BoxSpec, text: string, o: Partial<Label> = {}): Label => { const [x, y, z] = b.at, [l, w] = b.size; return lab(text, [x + l, y, z], [x + l, y + w, z], o); };
const hLab = (b: BoxSpec, text: string, o: Partial<Label> = {}): Label => { const [x, y, z] = b.at, [, , h] = b.size; return lab(text, [x, y, z], [x, y, z + h], o); };
/** the right outline of an upright cylinder in this view (the camera's azimuth is 30 degrees) */
const CYL_SIL = Math.PI / 6;
const cylH = (r: number, h: number, text: string, o: Partial<Label> = {}): Label => lab(text, [r * Math.cos(CYL_SIL), r * Math.sin(CYL_SIL), 0], [r * Math.cos(CYL_SIL), r * Math.sin(CYL_SIL), h], o);
const solidsPic = (p: SolidsParams, show: string[], solve: string[][], hero: string[], hide?: string[]): CavPicture => ({ kind: 'solids', solids: p, show, solve, hero, hide });
const planPic = (p: PlanSpec, show: string[], solve: string[][], hero: string[], note?: string): CavPicture => ({ kind: 'plan', plan: p, show, solve, hero, note });
const pl = (text: string, a: P2, b: P2, o: Partial<PlanLabel> = {}): PlanLabel => ({ text, a, b, ...o });
const rect = (x: number, y: number, w: number, h: number): P2[] => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
/** an L-shaped plan: W x H with an a x b notch at the top right */
const lPlan = (W: number, H: number, a: number, b: number): P2[] => [[0, 0], [W, 0], [W, H - b], [W - a, H - b], [W - a, H], [0, H]];
const times = (...xs: string[]) => xs.join(' \\cdot ');

// =====================================================================================================
// 1. split: does a proposed split cover the figure exactly once?                                 [comp-partition]
function split(R: Rn, n: number): Item {
  const ctx = pick(R, PLANS.filter(p => p.u !== 'in'));
  const u = ctx.u;
  const kind = pick(R, ['valid', 'overlap', 'gap'] as const);
  const shape = pick(R, ['L', 'stairs'] as const);
  let outer: P2[] = [], pieces: P2[][] = [], bad: P2[] | null = null, W = 0, H = 0;
  if (shape === 'L') {
    W = int(R, 9, 16); H = int(R, 7, 12);
    const a = int(R, 3, W - 4), b = int(R, 3, H - 3);
    outer = lPlan(W, H, a, b);
    if (kind === 'valid') pieces = R() < 0.5 ? [rect(0, 0, W - a, H), rect(W - a, 0, a, H - b)] : [rect(0, 0, W, H - b), rect(0, H - b, W - a, b)];
    else if (kind === 'overlap') { pieces = [rect(0, 0, W, H - b), rect(0, 0, W - a, H)]; bad = rect(0, 0, W - a, H - b); }
    else { const g = Math.max(2, Math.round((W - a) / 3)); pieces = [rect(0, 0, W - a - g, H), rect(W - a, 0, a, H - b)]; bad = rect(W - a - g, 0, g, H); }
  } else {
    const w = [int(R, 3, 5), int(R, 3, 5), int(R, 3, 5)], h = [int(R, 2, 3), 0, 0];
    h[1] = h[0]! + int(R, 2, 3); h[2] = h[1]! + int(R, 2, 3);
    W = w[0]! + w[1]! + w[2]!; H = h[2]!;
    outer = [[0, 0], [W, 0], [W, h[0]!], [w[0]! + w[1]!, h[0]!], [w[0]! + w[1]!, h[1]!], [w[0]!, h[1]!], [w[0]!, H], [0, H]];
    const cols = [rect(0, 0, w[0]!, H), rect(w[0]!, 0, w[1]!, h[1]!), rect(w[0]! + w[1]!, 0, w[2]!, h[0]!)];
    if (kind === 'valid') pieces = R() < 0.5 ? cols : [rect(0, 0, W, h[0]!), rect(0, h[0]!, w[0]! + w[1]!, h[1]! - h[0]!), rect(0, h[1]!, w[0]!, H - h[1]!)];
    else if (kind === 'overlap') { pieces = [cols[0]!, rect(0, 0, w[0]! + w[1]!, h[1]!), cols[2]!]; bad = rect(0, 0, w[0]!, h[1]!); }
    else { const g = 1; pieces = [cols[0]!, rect(w[0]!, 0, w[1]! - g, h[1]!), cols[2]!]; bad = rect(w[0]! + w[1]! - g, 0, g, h[1]!); }
  }
  const names = ['A', 'B', 'C'].slice(0, pieces.length).join(', ');
  const roles = ['second', 'pick', 'link'] as const;
  const plan: PlanSpec = {
    outer, labels: [pl(L(W, u), [0, 0], [W, 0]), pl(L(H, u), [0, H], [0, 0])],
    pieces: [...pieces.map((pts, i) => ({ pts, role: roles[i]! })), ...(bad ? [{ pts: bad, role: 'wrong' as const, key: 'bad' }] : [])],
  };
  const badArea = bad ? polyArea(bad) : 0;
  const hero = kind === 'valid' ? [tt('every part once')] : kind === 'overlap' ? [tt('counted twice:'), `${fmtT(badArea)}${sqT(u)}`] : [tt('left out:'), `${fmtT(badArea)}${sqT(u)}`];
  const verdict = kind === 'valid' ? 'covers every part exactly once' : kind === 'overlap' ? `has two pieces that overlap: ${badArea} ${sqU(u)} would be counted twice` : `leaves a gap: ${badArea} ${sqU(u)} would be left out`;
  return choiceItem({
    id: `split-${n}`, family: 'split',
    prompt: `Rae wants the area of this ${A(ctx.what)}. She splits it into the pieces ${B(names)} and will add their areas. Does her split work?`,
    board: `${tt('split')} = \\,?`,
    solution: [`Look for a part that two pieces both cover, and a part no piece covers.`, `Her split ${verdict}.`, 'A split works only when the pieces cover the figure exactly once: no overlaps and no gaps. Sharing a side is fine.'],
    picture: planPic(plan, ['fig', 'dims', ...pieces.map((_, i) => `p${i}`)], [['bad']], hero),
  }, R, [
    { t: 'Yes: the pieces cover it exactly once', ok: kind === 'valid', say: kind === 'valid' ? 'Yes. Every part is covered once: no overlap, no gap.' : `Look again: the split ${verdict}.`, mc: kind === 'valid' ? undefined : MC.gapsOverlaps },
    { t: 'No: two pieces overlap', ok: kind === 'overlap', say: kind === 'overlap' ? `Yes. ${badArea} ${sqU(u)} sit under two pieces, so they would be counted twice.` : `No two pieces cover the same part. The split ${verdict}.` },
    { t: 'No: a part is left out', ok: kind === 'gap', say: kind === 'gap' ? `Yes. A strip of ${badArea} ${sqU(u)} is not in any piece, so it would be left out.` : `Every part is inside some piece. The split ${verdict}.` },
  ]);
}

// 2. hidden: an unlabeled length from a total and a part                                    [comp-hidden-dimension]
function hidden(R: Rn, n: number): Item {
  const mode = pick(R, ['L', 'L', 'stairs', 'solid'] as const);
  if (mode === 'solid') {
    const ctx = pick(R, STEPS);
    const u = ctx.u;
    const Lt = int(R, 8, 20), l2 = int(R, 3, Lt - 3), D = int(R, 3, 7), h1 = int(R, 2, 6), h2 = int(R, 2, 6);
    const H = h1 + h2, askLen = R() < 0.5;
    const ans = askLen ? Lt - l2 : h2;
    const lower = box3(0, 0, 0, Lt, D, h1), upper = box3(0, 0, h1, l2, D, h2);
    const labels: Label[] = askLen
      ? [lenLab(lower, L(Lt, u)), lenLab(upper, L(l2, u)), lab('?', [l2, D, h1], [Lt, D, h1], { col: 'pick' }), hLab(lower, L(h1, u)), hLab(upper, L(h2, u)), depLab(lower, L(D, u))]
      : [lenLab(lower, L(Lt, u)), lab(L(H, u), [Lt, D, 0], [Lt, D, H]), lab(L(h1, u), [Lt, 0, 0], [Lt, 0, h1]), hLab(upper, '?', { col: 'pick' }), lenLab(upper, L(l2, u)), depLab(lower, L(D, u))];
    const sol = askLen
      ? [`The bottom block is ${L(Lt, u)} long. The top block covers ${L(l2, u)} of it.`, `So the step left over is ${Lt} − ${l2} = ${S(L(ans, u))}.`]
      : [`The whole step is ${L(H, u)} tall. The bottom block is ${L(h1, u)} of it.`, `So the top block is ${H} − ${h1} = ${S(L(ans, u))} tall.`];
    return numItem({
      id: `hidden-${n}`, family: 'hidden', unit: u,
      prompt: `This ${A(ctx.what)} is two blocks with square corners. How long is the side marked ${P('?')}?`,
      board: '? = \\,\\square',
      solution: [...sol, 'Never measure the drawing: use a total and the part you know.'],
      picture: solidsPic({ bodies: [{ kind: 'boxes', add: [lower, upper], role: 'first' }], labels }, ['solid', 'dims'], [['g']], [askLen ? `? = ${Lt} - ${l2}` : `? = ${H} - ${h1}`, `= ${ans}${tt(' ' + u)}`]),
    }, ans, `Yes: ${askLen ? `${Lt} − ${l2}` : `${H} − ${h1}`} = ${ans} ${u}.`, [
      { v: askLen ? Lt : H, mc: MC.wholeForPart, say: `That is the ${askLen ? 'whole length' : 'whole height'}. The ? is only the part left after taking away ${askLen ? l2 : h1} ${u}.` },
      { v: askLen ? l2 : h1, mc: MC.copiesNearby, say: 'That copies a length next to it. Use the total and take away the part you know.' },
      { v: askLen ? Lt + l2 : H + h1, say: 'The ? is a part of the total, so it is smaller: subtract, do not add.' },
    ], `The ? is the total minus the part you know: ${askLen ? `${Lt} − ${l2}` : `${H} − ${h1}`}.`);
  }
  const ctx = pick(R, PLANS);
  const u = ctx.u;
  if (mode === 'stairs') {
    const w = [int(R, 2, 7), int(R, 2, 7), int(R, 2, 7)], h0 = int(R, 2, 4), h1 = h0 + int(R, 2, 4), H = h1 + int(R, 2, 4);
    const W = w[0]! + w[1]! + w[2]!;
    const outer: P2[] = [[0, 0], [W, 0], [W, h0], [w[0]! + w[1]!, h0], [w[0]! + w[1]!, h1], [w[0]!, h1], [w[0]!, H], [0, H]];
    const ans = w[2]!;
    const plan: PlanSpec = {
      outer, labels: [
        pl(L(W, u), [0, 0], [W, 0]), pl(L(w[0]!, u), [0, H], [w[0]!, H]), pl(L(w[1]!, u), [w[0]!, h1], [w[0]! + w[1]!, h1]),
        pl('?', [w[0]! + w[1]!, h0], [W, h0], { col: 'pick' }), pl(L(H, u), [0, H], [0, 0]),
      ],
      segs: [{ a: [0, -0.01], b: [W, -0.01], key: 'g', col: 'link', dash: false }],
    };
    return numItem({
      id: `hidden-${n}`, family: 'hidden', unit: u,
      prompt: `A ${A(ctx.what)} has steps with square corners. How long is the side marked ${P('?')}?`,
      board: '? = \\,\\square',
      solution: [`The bottom side is ${L(W, u)}: the three step widths together.`, `So ? = ${W} − ${w[0]} − ${w[1]} = ${S(L(ans, u))}.`],
      picture: planPic(plan, ['fig', 'dims'], [['g']], [`? = ${W} - ${w[0]} - ${w[1]}`, `= ${ans}${tt(' ' + u)}`]),
    }, ans, `Yes: ${W} − ${w[0]} − ${w[1]} = ${ans} ${u}.`, [
      { v: W, mc: MC.wholeForPart, say: `That is the whole bottom side. The ? is only the last step: take away ${w[0]} and ${w[1]}.` },
      { v: W - w[0]!, say: `Take away both step widths above it: ${w[0]} and ${w[1]}.` },
      { v: w[1]!, mc: MC.copiesNearby, say: 'That copies the step next to it. The steps are not equal: use the total.' },
    ], `The bottom side is all three widths: ? = ${W} − ${w[0]} − ${w[1]}.`);
  }
  // L-shape: the notch's step, from a total and a part
  const W = int(R, 8, 20), H = int(R, 7, 18);
  const a = int(R, 2, W - 3), b = int(R, 2, H - 3);
  const horiz = R() < 0.5;
  const notScale = R() < 0.4;
  // not to scale: the ? side is drawn as long as the labelled part beside it, so the drawing invites a copy
  const part = horiz ? W - a : H - b, ans = horiz ? a : b;
  if (ans === part) return hidden(R, n);
  const dW = notScale && horiz ? 2 * part : W, dH = notScale && !horiz ? 2 * part : H;
  const da = notScale && horiz ? part : a, db = notScale && !horiz ? part : b;
  const outer = lPlan(dW, dH, da, db);
  const labels = [pl(L(W, u), [0, 0], [dW, 0]), pl(L(H, u), [0, dH], [0, 0])];
  if (horiz) labels.push(pl(L(part, u), [0, dH], [dW - da, dH]), pl('?', [dW - da, dH - db], [dW, dH - db], { col: 'pick' }), pl(L(H - b, u), [dW, 0], [dW, dH - db]));
  else labels.push(pl(L(part, u), [dW, 0], [dW, dH - db]), pl('?', [dW - da, dH - db], [dW - da, dH], { col: 'pick' }), pl(L(W - a, u), [0, dH], [dW - da, dH]));
  const tot = horiz ? W : H;
  return numItem({
    id: `hidden-${n}`, family: 'hidden', unit: u,
    prompt: `A ${A(ctx.what)} has square corners. How long is the side marked ${P('?')}?${notScale ? ' The drawing is not to scale.' : ''}`,
    board: '? = \\,\\square',
    solution: [`The ${horiz ? 'bottom' : 'left'} side, ${L(tot, u)}, runs the whole ${horiz ? 'width' : 'height'}. The ${L(part, u)} side covers part of it.`, `So ? = ${tot} − ${part} = ${S(L(ans, u))}.`, notScale ? 'The drawing is not to scale: it only looks the same as its neighbour.' : 'Use the numbers, not the look of the drawing.'],
    picture: planPic({ outer, labels, segs: [{ a: horiz ? [0, 0] : [0, 0], b: horiz ? [dW, 0] : [0, dH], key: 'g', col: 'link', dash: false }] }, ['fig', 'dims'], [['g']], [`? = ${tot} - ${part}`, `= ${ans}${tt(' ' + u)}`], notScale ? 'Not to scale' : undefined),
  }, ans, `Yes: ${tot} − ${part} = ${ans} ${u}.`, [
    { v: tot, mc: MC.wholeForPart, say: `${tot} ${u} is the whole ${horiz ? 'width' : 'height'}. The ? is only the part left after the ${part} ${u}.` },
    { v: part, mc: notScale ? MC.notDeduce : MC.copiesNearby, say: notScale ? 'It only looks the same in the drawing, which is not to scale. Work it out from the numbers.' : 'That copies the side next to it. Use the total and take away the part you know.' },
    { v: tot + part, say: 'The ? is part of the total, so subtract.' },
  ], `The ? is the total minus the part: ${tot} − ${part}.`);
}

// 3. areaAdd: composite area by adding parts (one plan, several formulas)                          [area-additive]
function areaAdd(R: Rn, n: number, sg?: string): Item {
  const { st, k } = styleFor(R, sg, 'area-additive');
  const ctx = pick(R, PLANS.filter(p => p.u !== 'm'));
  const u = ctx.u;
  const shape = pick(R, ['L', 'L', 'house', 'trap'] as const);
  let plan: PlanSpec, ans = 0, wrongs: Wrong[] = [], hero: string[] = [], sol: string[] = [], enclosing = 0, per = 0;
  if (shape === 'L') {
    const W = int(R, 8, 18) * k, H = int(R, 6, 14) * k, a = int(R, 2, Math.round(W / k) - 3) * k, b = int(R, 2, Math.round(H / k) - 3) * k;
    const p = clean(W - a), q = clean(H - b);
    ans = clean(p * H + a * q); enclosing = clean(W * H); per = clean(2 * (W + H));
    plan = {
      outer: lPlan(W, H, a, b), labels: [pl(L(W, u, st), [0, 0], [W, 0]), pl(L(H, u, st), [0, H], [0, 0]), pl(L(p, u, st), [0, H], [p, H]), pl(L(q, u, st), [W, 0], [W, q])],
      pieces: [{ pts: rect(0, 0, p, H), role: 'second' }, { pts: rect(p, 0, a, q), role: 'pick' }],
    };
    sol = [`Split it into two rectangles: ${L(p, u, st)} × ${L(H, u, st)} and the part on the right.`, `The right part is ${W} − ${p} = ${fmt(a, st)} ${u} wide (a hidden length) and ${L(q, u, st)} tall.`, `${fmt(p * H, st)} + ${fmt(a * q, st)} = ${S(`${fmt(ans, st)} ${sqU(u)}`)}.`];
    hero = [`${times(fmtT(p, st), fmtT(H, st))} + ${times(fmtT(a, st), fmtT(q, st))}`, `= ${fmtT(ans, st)}${sqT(u)}`];
    wrongs = [
      { v: enclosing, mc: MC.enclosing, say: `${fmt(W, st)} × ${fmt(H, st)} is the whole rectangle around the figure. The corner piece is missing: it is not part of the ${ctx.what}.` },
      { v: p * H + W * q, mc: MC.wholeForPart, say: `The right part is not ${fmt(W, st)} ${u} wide: that is the whole width. Take away the ${fmt(p, st)} ${u} part first.` },
    ];
  } else {
    const [hb, t, s] = pick(R, TRIPLES).map(x => x * k) as [number, number, number];
    const W = clean(2 * hb), h = int(R, 3, 10) * k;
    if (shape === 'house') {
      ans = clean(W * h + triArea(W, t)); enclosing = clean(W * (h + t));
      plan = {
        outer: [[0, 0], [W, 0], [W, h], [hb, h + t], [0, h]],
        labels: [pl(L(W, u, st), [0, 0], [W, 0]), pl(L(h, u, st), [0, h], [0, 0]), pl(L(s, u, st), [0, h], [hb, h + t]), pl(L(t, u, st), [hb, h], [hb, h + t], { col: 'pick', inside: true })],
        segs: [{ a: [hb, h + t], b: [hb, h], key: 'ht', right: [1, 0] }],
        pieces: [{ pts: rect(0, 0, W, h), role: 'second' }, { pts: [[0, h], [W, h], [hb, h + t]], role: 'pick' }],
      };
      sol = [`A rectangle ${L(W, u, st)} × ${L(h, u, st)} and a triangle on top.`, `The triangle's height is the dashed ${L(t, u, st)}, square to its base, not the slanted ${L(s, u, st)} side.`, `${fmt(W * h, st)} + ½ × ${fmt(W, st)} × ${fmt(t, st)} = ${S(`${fmt(ans, st)} ${sqU(u)}`)}.`];
      hero = [`${times(fmtT(W, st), fmtT(h, st))} + \\tfrac12 \\cdot ${times(fmtT(W, st), fmtT(t, st))}`, `= ${fmtT(ans, st)}${sqT(u)}`];
      wrongs = [
        { v: W * h + triArea(W, s), mc: MC.slantHeight, say: `${fmt(s, st)} ${u} is the slanted side. The triangle's height is the dashed line, square to the base: ${fmt(t, st)} ${u}.` },
        { v: enclosing, mc: MC.enclosing, say: 'That fills the whole rectangle around the house shape, corners and all. The roof is a triangle.' },
        { v: W * h + W * t, say: 'A triangle is half of the rectangle around it: ½ × base × height.' },
      ];
    } else {
      // the slanted sides come from the triple: off, t, s
      const off = hb, top = int(R, 2, 8) * k, Wt = clean(top + 2 * off), sl = s, slOk = true;
            ans = clean(Wt * h + trapArea(Wt, top, t)); enclosing = clean(Wt * (h + t));
      plan = {
        outer: [[0, 0], [Wt, 0], [Wt, h], [Wt - off, h + t], [off, h + t], [0, h]],
        labels: [pl(L(Wt, u, st), [0, 0], [Wt, 0]), pl(L(h, u, st), [0, h], [0, 0]), pl(L(top, u, st), [off, h + t], [Wt - off, h + t]), pl(L(t, u, st), [off, h], [off, h + t], { col: 'pick', inside: true }), ...(slOk ? [pl(L(sl, u, st), [Wt, h], [Wt - off, h + t])] : [])],
        segs: [{ a: [off, h + t], b: [off, h], key: 'ht', right: [1, 0] }],
        pieces: [{ pts: rect(0, 0, Wt, h), role: 'second' }, { pts: [[0, h], [Wt, h], [Wt - off, h + t], [off, h + t]], role: 'pick' }],
      };
      sol = [`A rectangle ${L(Wt, u, st)} × ${L(h, u, st)} with a trapezoid on top: parallel sides ${fmt(Wt, st)} and ${fmt(top, st)}, height ${fmt(t, st)}.`, `Trapezoid: ½ × (${fmt(Wt, st)} + ${fmt(top, st)}) × ${fmt(t, st)} = ${fmt(trapArea(Wt, top, t), st)}.`, `${fmt(Wt * h, st)} + ${fmt(trapArea(Wt, top, t), st)} = ${S(`${fmt(ans, st)} ${sqU(u)}`)}.`];
      hero = [`${times(fmtT(Wt, st), fmtT(h, st))} + ${fmtT(trapArea(Wt, top, t), st)}`, `= ${fmtT(ans, st)}${sqT(u)}`];
      wrongs = [
        ...(slOk ? [{ v: Wt * h + trapArea(Wt, top, sl), mc: MC.slantHeight, say: `${fmt(sl, st)} ${u} is a slanted side. The trapezoid's height is the dashed ${fmt(t, st)} ${u}, square to the parallel sides.` }] : []),
        { v: enclosing, mc: MC.enclosing, say: 'That fills the whole rectangle around the figure. The top corners are not part of it.' },
        { v: Wt * h + (Wt + top) * t, say: 'A trapezoid is ½ × (the two parallel sides) × the height.' },
      ];
    }
    per = clean(2 * (plan.outer.reduce((m, q) => Math.max(m, q[0]), 0) + h));
  }
  const base = { id: `areaAdd-${n}`, family: 'areaAdd' as const, board: `A = \\,?`, solution: sol, picture: planPic(plan, ['fig', 'dims'], [['p0', 'p1', 'ht']], hero) };
  const prompt = `What is the area of this ${A(ctx.what)}?`;
  if (R() < 0.25 && sg === 'area-additive') {
    const opts: Opt[] = [
      { t: `${fmt(ans, st)} ${sqU(u)}`, ok: true, say: `Yes: the parts add to ${fmt(ans, st)}, and an area is in square units.` },
      { t: `${fmt(ans, st)} ${u}`, mc: MC.unitDim, say: `The number is right, but ${u} measures a length. An area counts squares: ${sqU(u)}.` },
      { t: `${fmt(enclosing, st)} ${sqU(u)}`, mc: MC.enclosing, say: 'That is the whole rectangle around the figure, with the missing corner counted in.' },
    ];
    if (!near(per, ans) && !near(per, enclosing)) opts.push({ t: `${fmt(per, st)} ${u}`, say: 'That is a distance around, not the space inside.' });
    if (!uniq(opts.map(o => o.t))) return areaAdd(R, n, sg);
    return choiceItem({ ...base, prompt: `${prompt} Pick the answer with its unit.` }, R, opts);
  }
  return numItem({ ...base, prompt, unit: sqU(u) }, ans, `Yes: ${fmt(ans, st)} ${sqU(u)}.`, wrongs, 'Split the figure into shapes you know, find each area, then add.', { style: st });
}

// 4. areaSub: composite area by subtracting a removed region                                   [area-subtractive]
function areaSub(R: Rn, n: number, sg?: string): Item {
  const { st, k } = styleFor(R, sg, 'area-subtractive');
  const mode = pick(R, ['notch', 'walk', 'frame', 'tri'] as const);
  const unitOf = (u: string) => u;
  if (mode === 'walk') {
    const Lp = int(R, 8, 20) * k, Wp = int(R, 5, 12) * k, w = int(R, 2, 4) * k;
    const u = unitOf('ft');
    const OL = clean(Lp + 2 * w), OW = clean(Wp + 2 * w), ans = clean(OL * OW - Lp * Wp);
    const plan: PlanSpec = {
      outer: rect(0, 0, OL, OW), holes: [rect(w, w, Lp, Wp)],
      labels: [pl(L(Lp, u, st), [w, w + Wp], [w + Lp, w + Wp], { col: 'second' }), pl(L(Wp, u, st), [w + Lp, w], [w + Lp, w + Wp], { col: 'second' }), pl(L(w, u, st), [w + Lp, w / 2], [OL, w / 2], { inside: true })],
      segs: [{ a: [w + Lp, w / 2], b: [OL, w / 2], key: 'dims', col: 'first', dash: false }],
      rightAngles: false,
    };
    return numItem({
      id: `areaSub-${n}`, family: 'areaSub', unit: sqU(u),
      prompt: `A ${A(`walkway ${L(w, u, st)} wide`)} goes all the way around a ${B(`${L(Lp, u, st)} × ${L(Wp, u, st)}`)} pool. What is the area of the walkway?`,
      board: 'A = \\,?',
      solution: [`The outer edge is ${fmt(Lp, st)} + 2 × ${fmt(w, st)} = ${fmt(OL, st)} by ${fmt(Wp, st)} + 2 × ${fmt(w, st)} = ${fmt(OW, st)}: the walkway is on both sides.`, `Whole: ${fmt(OL * OW, st)}. Take away the pool: ${fmt(Lp * Wp, st)}.`, `${fmt(OL * OW, st)} − ${fmt(Lp * Wp, st)} = ${S(`${fmt(ans, st)} ${sqU(u)}`)}.`],
      picture: planPic(plan, ['fig', 'dims'], [['hole']], [`${times(fmtT(OL, st), fmtT(OW, st))} - ${times(fmtT(Lp, st), fmtT(Wp, st))}`, `= ${fmtT(ans, st)}${sqT(u)}`]),
    }, ans, `Yes: ${fmt(ans, st)} ${sqU(u)}.`, [
      { v: OL * OW + Lp * Wp, mc: MC.addsCutout, say: 'The pool is not walkway. Take its area away, do not add it.' },
      { v: OL * OW, mc: MC.enclosing, say: 'That is the walkway and the pool together. Take away the pool.' },
      { v: (Lp + w) * (Wp + w) - Lp * Wp, mc: MC.copiesNearby, say: `The walkway is on both sides, so the outside is ${fmt(Lp, st)} + ${fmt(w, st)} + ${fmt(w, st)} long.` },
      { v: OL * OW - 2 * (Lp + Wp), mc: MC.perimInArea, say: 'That takes away the distance around the pool. Take away its area: length × width.' },
    ], 'Find the outer rectangle (the walkway is on both sides), then take away the pool.', { style: st });
  }
  const ctx = pick(R, PLANS.filter(p => p.u !== 'm'));
  const u = ctx.u;
  if (mode === 'tri') {
    const W = int(R, 10, 16) * k, H = int(R, 8, 12) * k;
    const b = int(R, 3, Math.round(W / k) - 4) * k, t = int(R, 3, Math.round(H / k) - 2) * k;
    const x = clean((W - b) / 2), y = clean((H - t) / 2);
    const ans = clean(W * H - triArea(b, t));
    const plan: PlanSpec = {
      outer: rect(0, 0, W, H), holes: [[[x, y], [x + b, y], [x + b / 2, y + t]]],
      labels: [pl(L(W, u, st), [0, 0], [W, 0]), pl(L(H, u, st), [0, H], [0, 0])],
      segs: [{ a: [x + b / 2, y + t], b: [x + b / 2, y], key: 'dims', right: [1, 0] }],
    };
    return numItem({
      id: `areaSub-${n}`, family: 'areaSub', unit: sqU(u),
      prompt: `A triangle with a base of ${L(b, u, st)} and a height of ${P(L(t, u, st))} (dashed) is cut out of a ${A(`${L(W, u, st)} × ${L(H, u, st)}`)} ${ctx.what}. What area is left?`,
      board: 'A = \\,?',
      solution: [`Whole rectangle: ${fmt(W, st)} × ${fmt(H, st)} = ${fmt(W * H, st)}.`, `The hole: ½ × ${fmt(b, st)} × ${fmt(t, st)} = ${fmt(triArea(b, t), st)}.`, `${fmt(W * H, st)} − ${fmt(triArea(b, t), st)} = ${S(`${fmt(ans, st)} ${sqU(u)}`)}.`],
      picture: planPic(plan, ['fig', 'dims'], [['hole']], [`${times(fmtT(W, st), fmtT(H, st))} - ${fmtT(triArea(b, t), st)}`, `= ${fmtT(ans, st)}${sqT(u)}`]),
    }, ans, `Yes: ${fmt(ans, st)} ${sqU(u)}.`, [
      { v: W * H + triArea(b, t), mc: MC.addsCutout, say: 'The hole is gone: take its area away from the rectangle.' },
      { v: W * H, mc: MC.enclosing, say: 'That still counts the hole. Take the triangle away.' },
      { v: W * H - b * t, say: 'The hole is a triangle: half of b × h.' },
      { v: W * H - (b + 2 * Math.hypot(b / 2, t)), mc: MC.perimInArea, say: 'Take away the area of the hole, not the distance around it.' },
    ], 'Whole rectangle minus the triangle cut out.', { style: st });
  }
  if (mode === 'frame') {
    const OL = int(R, 10, 24) * k, OW = int(R, 8, 20) * k, fw = int(R, 1, 3) * k, fh = int(R, 1, 3) * k;
    const IL = clean(OL - 2 * fw), IW = clean(OW - 2 * fh);
    if (IL <= 2 * k || IW <= 2 * k) return areaSub(R, n, sg);
    const ans = clean(OL * OW - IL * IW);
    const plan: PlanSpec = {
      outer: rect(0, 0, OL, OW), holes: [rect(fw, fh, IL, IW)],
      labels: [pl(L(OL, u === 'yd' ? 'in' : 'in', st), [0, 0], [OL, 0]), pl(L(OW, 'in', st), [0, OW], [0, 0]), pl(L(IL, 'in', st), [fw, fh + IW], [fw + IL, fh + IW], { col: 'second' }), pl(L(IW, 'in', st), [fw + IL, fh], [fw + IL, fh + IW], { col: 'second' })],
      rightAngles: false,
    };
    return numItem({
      id: `areaSub-${n}`, family: 'areaSub', unit: sqU('in'),
      prompt: `A picture frame is ${A(`${L(OL, 'in', st)} × ${L(OW, 'in', st)}`)} on the outside. The opening for the picture is ${B(`${L(IL, 'in', st)} × ${L(IW, 'in', st)}`)}. What is the area of the frame itself?`,
      board: 'A = \\,?',
      solution: [`Outside: ${fmt(OL, st)} × ${fmt(OW, st)} = ${fmt(OL * OW, st)}.`, `Opening: ${fmt(IL, st)} × ${fmt(IW, st)} = ${fmt(IL * IW, st)}.`, `${fmt(OL * OW, st)} − ${fmt(IL * IW, st)} = ${S(`${fmt(ans, st)} in²`)}.`],
      picture: planPic(plan, ['fig', 'dims'], [['hole']], [`${times(fmtT(OL, st), fmtT(OW, st))} - ${times(fmtT(IL, st), fmtT(IW, st))}`, `= ${fmtT(ans, st)}${sqT('in')}`]),
    }, ans, `Yes: ${fmt(ans, st)} in².`, [
      { v: OL * OW + IL * IW, mc: MC.addsCutout, say: 'The opening is empty. Take its area away, do not add it.' },
      { v: OL * OW - 2 * (IL + IW), mc: MC.perimInArea, say: 'That takes away the distance around the opening. Take away its area.' },
      { v: OL * OW, mc: MC.enclosing, say: 'That is the frame and the opening together.' },
    ], 'Outside rectangle minus the opening.', { style: st });
  }
  // a rectangle with a notch cut from its top edge; sometimes the notch's width must be found first
  const W = int(R, 10, 20) * k, H = int(R, 6, 14) * k;
  const a = int(R, 2, Math.round(W / k) - 6) * k, b = int(R, 2, Math.round(H / k) - 3) * k;
  const left = int(R, 2, Math.round((W - a) / k) - 2) * k, right = clean(W - a - left);
  const hideA = sg === 'area-subtractive' ? R() < 0.5 : false;
  if (hideA && (near(left, a) || near(right, a))) return areaSub(R, n, sg);
  const ans = clean(W * H - a * b);
  const outer: P2[] = [[0, 0], [W, 0], [W, H], [left + a, H], [left + a, H - b], [left, H - b], [left, H], [0, H]];
  const labels = [pl(L(W, u, st), [0, 0], [W, 0]), pl(L(H, u, st), [0, H], [0, 0]), pl(L(b, u, st), [left + a, H - b], [left + a, H], { col: 'second' })];
  labels.push(hideA ? pl('?', [left, H - b], [left + a, H - b], { col: 'pick' }) : pl(L(a, u, st), [left, H - b], [left + a, H - b], { col: 'second' }));
  if (hideA) labels.push(pl(L(left, u, st), [0, H], [left, H]), pl(L(right, u, st), [left + a, H], [W, H]));
  const plan: PlanSpec = { outer, labels, pieces: [{ pts: rect(left, H - b, a, b), role: 'wrong', key: 'hole' }] };
  return numItem({
    id: `areaSub-${n}`, family: 'areaSub', unit: sqU(u),
    prompt: `A ${A(ctx.what)} is a rectangle with a notch cut out of one side. What is its area?`,
    board: 'A = \\,?',
    solution: [...(hideA ? [`The notch is ${fmt(W, st)} − ${fmt(left, st)} − ${fmt(right, st)} = ${fmt(a, st)} ${u} wide.`] : []), `Whole rectangle: ${fmt(W, st)} × ${fmt(H, st)} = ${fmt(W * H, st)}. The notch: ${fmt(a, st)} × ${fmt(b, st)} = ${fmt(a * b, st)}.`, `${fmt(W * H, st)} − ${fmt(a * b, st)} = ${S(`${fmt(ans, st)} ${sqU(u)}`)}.`],
    picture: planPic(plan, ['fig', 'dims'], [['hole']], [`${times(fmtT(W, st), fmtT(H, st))} - ${times(fmtT(a, st), fmtT(b, st))}`, `= ${fmtT(ans, st)}${sqT(u)}`]),
  }, ans, `Yes: ${fmt(ans, st)} ${sqU(u)}.`, [
    { v: W * H + a * b, mc: MC.addsCutout, say: 'The notch is missing from the shape. Take its area away, do not add it.' },
    { v: W * H, mc: MC.enclosing, say: 'That is the rectangle before the notch was cut. Take the notch away.' },
    { v: W * H - 2 * (a + b), mc: MC.perimInArea, say: 'That takes away a distance around the notch. Take away its area: width × depth.' },
    ...(hideA ? [{ v: W * H - left * b, mc: MC.copiesNearby, say: `The notch is not ${fmt(left, st)} wide: that is the side next to it. ${fmt(W, st)} − ${fmt(left, st)} − ${fmt(right, st)}.` }] : []),
  ], 'Whole rectangle minus the notch.', { style: st });
}

// 5. volAdd: composite volume by adding non-overlapping boxes                                       [vol-additive]
function stepBoxes(R: Rn, k: number, three: boolean): { boxes: BoxSpec[]; L: number; D: number; hs: number[]; ws: number[] } {
  const D = int(R, 2, 6) * k;
  if (!three) {
    const Lt = int(R, 6, 14) * k, l2 = int(R, 2, Math.round(Lt / k) - 3) * k, h1 = int(R, 2, 5) * k, h2 = int(R, 2, 5) * k;
    return { boxes: [box3(0, 0, 0, Lt, D, h1), box3(0, 0, h1, l2, D, h2)], L: Lt, D, hs: [h1, h2], ws: [Lt, l2] };
  }
  const w = [int(R, 2, 4) * k, int(R, 2, 4) * k, int(R, 2, 4) * k], h = [int(R, 1, 3) * k, int(R, 1, 3) * k, int(R, 1, 3) * k];
  const Lt = clean(w[0]! + w[1]! + w[2]!);
  return { boxes: [box3(0, 0, 0, Lt, D, h[0]!), box3(0, 0, h[0]!, clean(w[0]! + w[1]!), D, h[1]!), box3(0, 0, clean(h[0]! + h[1]!), w[0]!, D, h[2]!)], L: Lt, D, hs: h, ws: [Lt, clean(w[0]! + w[1]!), w[0]!] };
}
function volAdd(R: Rn, n: number, sg?: string): Item {
  const { st, k } = styleFor(R, sg, 'vol-additive');
  const ctx = pick(R, STEPS);
  const u = ctx.u;
  const three = R() < 0.4;
  const g = stepBoxes(R, k, three);
  const { boxes, D } = g;
  const vols = boxes.map(boxVolume), ans = clean(vols.reduce((x, y) => x + y, 0));
  if (!near(ans, unionVolume(boxes))) throw new Error('volAdd: pieces overlap');
  const Ht = clean(g.hs.reduce((x, y) => x + y, 0));
  const bound = clean(g.L * D * Ht);
  const contacts = clean(boxes.slice(1).reduce((s, b, i) => s + contactArea(boxes[i]!, b), 0));
  const labels: Label[] = [lenLab(boxes[0]!, L(g.L, u, st)), depLab(boxes[0]!, L(D, u, st))];
  boxes.forEach((b, i) => {
    labels.push(hLab(b, L(b.size[2], u, st)));
    if (i > 0) labels.push(lenLab(b, L(b.size[0], u, st)));
  });
  const roles = ['second', 'pick', 'link'] as const;
  const bodies: Body[] = [{ kind: 'boxes', add: boxes, role: 'first', show: 'whole' }, ...boxes.map((b, i): Body => ({ kind: 'boxes', add: [b], role: roles[i]!, show: 'pieces', off: [0, 0, i * 0.9 * k * 2] }))];
  const terms = boxes.map(b => times(fmtT(b.size[0], st), fmtT(b.size[1], st), fmtT(b.size[2], st)));
  return numItem({
    id: `volAdd-${n}`, family: 'volAdd', unit: cuU(u),
    prompt: `This ${A(ctx.what)} is built from ${three ? 'three' : 'two'} rectangular blocks, all ${L(D, u, st)} deep. What is its volume?`,
    board: 'V = \\,?',
    solution: [`Split it into the blocks: ${boxes.map(b => `${fmt(b.size[0], st)} × ${fmt(b.size[1], st)} × ${fmt(b.size[2], st)}`).join(', ')}.`, `They fill the solid exactly once, so add: ${vols.map(v => fmt(v, st)).join(' + ')} = ${S(`${fmt(ans, st)} ${cuU(u)}`)}.`, `Check: the box around it holds ${fmt(bound, st)}, more than ${fmt(ans, st)}, as it should.`],
    picture: solidsPic({ bodies, labels }, ['whole', 'dims'], [['pieces'], ['explode']], [three ? `${vols.map(v => fmtT(v, st)).join(' + ')}` : `${terms.join(' + ')}`, `= ${fmtT(ans, st)}${cuT(u)}`], ['whole']),
  }, ans, `Yes: ${fmt(ans, st)} ${cuU(u)}.`, [
    { v: bound, mc: MC.boundingBox, say: `${fmt(g.L, st)} × ${fmt(D, st)} × ${fmt(Ht, st)} fills the whole box around the solid, the empty corner too. Add the blocks instead.` },
    { v: ans - contacts, mc: MC.contactFromVol, say: 'Where two blocks touch there is no lost space: the faces have no thickness. Just add the volumes.' },
    { v: three ? vols[0]! + g.L * D * (g.hs[1]! + g.hs[2]!) : vols[0]! + g.L * D * g.hs[1]!, mc: MC.wholeForPart, say: `The block on top is not ${fmt(g.L, st)} long: that is the whole length. Use its own length.` },
  ], 'Find each block\'s volume (length × width × height), then add.', { style: st });
}

// 6. volSub: remaining volume after a rectangular part is removed                                 [vol-subtractive]
function volSub(R: Rn, n: number, sg?: string): Item {
  const { st, k } = styleFor(R, sg, 'vol-subtractive');
  const ctx = pick(R, BLOCKS);
  const u = ctx.u;
  const mode = pick(R, ['notch', 'cavity', 'tunnel'] as const);
  const Lx = int(R, 6, 12) * k, D = int(R, 4, 9) * k, H = int(R, 4, 9) * k;
  let cut: BoxSpec, off: V3, words = '', open = 0;
  if (mode === 'notch') { const a = int(R, 2, Math.round(Lx / k) - 3) * k, b = int(R, 2, Math.round(H / k) - 2) * k; cut = box3(clean(Lx - a), 0, clean(H - b), a, D, b); off = [0.6 * Lx, 0, 0.5 * H]; words = `a notch ${L(a, u, st)} long and ${L(b, u, st)} deep cut along its whole width`; open = a * b; }
  else if (mode === 'cavity') { const a = int(R, 2, Math.round(Lx / k) - 2) * k, c = int(R, 2, Math.round(D / k) - 2) * k, d = int(R, 1, Math.round(H / k) - 2) * k; cut = box3(clean((Lx - a) / 2), clean((D - c) / 2), clean(H - d), a, c, d); off = [0, 0, 1.25 * H]; words = `a ${L(a, u, st)} × ${L(c, u, st)} hole cut ${L(d, u, st)} deep into its top`; open = a * c; }
  else { const a = int(R, 2, Math.round(Lx / k) - 2) * k, b = int(R, 2, Math.round(H / k) - 2) * k; cut = box3(clean((Lx - a) / 2), 0, clean((H - b) / 2), a, D, b); off = [0, -1.3 * D, 0]; words = `a ${L(a, u, st)} × ${L(b, u, st)} tunnel cut straight through it, front to back`; open = a * b; }
  const outer = box3(0, 0, 0, Lx, D, H);
  const Vo = boxVolume(outer), Vc = boxVolume(cut), ans = clean(Vo - Vc);
  if (!near(ans, unionVolume([outer], [cut]))) throw new Error('volSub mismatch');
  const [cx, cy, cz] = cut.at, [cl, cw, ch] = cut.size;
  const labels: Label[] = [lenLab(outer, L(Lx, u, st)), depLab(outer, L(D, u, st)), hLab(outer, L(H, u, st))];
  if (mode === 'notch') labels.push(lab(L(cl, u, st), [cx, 0, cz], [Lx, 0, cz], { col: 'second', inside: true, optional: true }), lab(L(ch, u, st), [cx, 0, cz], [cx, 0, H], { col: 'second', inside: true, optional: true }));
  else if (mode === 'tunnel') labels.push(lab(L(cl, u, st), [cx, 0, cz], [cx + cl, 0, cz], { col: 'second', inside: true, optional: true }), lab(L(ch, u, st), [cx + cl, 0, cz], [cx + cl, 0, cz + ch], { col: 'second', inside: true, optional: true }));
  const bodies: Body[] = [{ kind: 'boxes', add: [outer], cut: [cut], role: 'first' }, { kind: 'boxes', add: [cut], role: 'wrong', show: 'lift', off, offKey: 'out' }];
  return numItem({
    id: `volSub-${n}`, family: 'volSub', unit: cuU(u),
    prompt: `A ${A(`${ctx.what} ${L(Lx, u, st)} × ${L(D, u, st)} × ${L(H, u, st)}`)} has ${words}. How much ${ctx.what.split(' ').pop()} is left?`,
    board: 'V = \\,?',
    solution: [`The whole block: ${fmt(Lx, st)} × ${fmt(D, st)} × ${fmt(H, st)} = ${fmt(Vo, st)}.`, `The part removed: ${fmt(cl, st)} × ${fmt(cw, st)} × ${fmt(ch, st)} = ${fmt(Vc, st)}. It has a depth too, not just an opening.`, `${fmt(Vo, st)} − ${fmt(Vc, st)} = ${S(`${fmt(ans, st)} ${cuU(u)}`)}.`],
    picture: solidsPic({ bodies, labels }, ['solid', 'dims'], [['lift'], ['out']], [`${fmtT(Vo, st)} - ${times(fmtT(cl, st), fmtT(cw, st), fmtT(ch, st))}`, `= ${fmtT(ans, st)}${cuT(u)}`]),
  }, ans, `Yes: ${fmt(ans, st)} ${cuU(u)}.`, [
    { v: Vo, mc: MC.keepsEnclosing, say: 'That is the block before anything was cut. Take the removed part away.' },
    { v: Vo - open, mc: MC.openingArea, say: `${fmt(open, st)} is only the area of the opening. The removed part is a solid: its area × its depth.` },
    { v: Vo + Vc, mc: MC.addsCutout, say: 'The removed part is gone: subtract it.' },
  ], 'Whole block minus the removed block.', { style: st });
}

// 7. prismBh: V = Bh for a right prism with a triangle or trapezoid base                              [vol-prism-bh]
function prismBh(R: Rn, n: number, sg?: string): Item {
  const { st, k } = styleFor(R, sg, 'vol-prism-bh');
  const what = pick(R, PRISMS);
  const u = pick(R, ['in', 'ft', 'cm']);
  const mode = pick(R, ['iso', 'ramp', 'trap', 'stand'] as const);
  const len = int(R, 4, 12) * k;
  let body: Body, labels: Label[], measures: Measure[] = [], B = 0, wrongs: Wrong[] = [], bWords = '', lying = true, boxProd = 0, slantV = 0, extra = 0, glowPts: V3[];
  if (mode === 'iso') {
    const [hb, t, s] = pick(R, TRIPLES).map(x => x * k) as [number, number, number];
    const w = clean(2 * hb);
    body = { kind: 'prism', axis: 1, base: [[0, 0], [w, 0], [hb, t]], at: 0, len, role: 'first' };
    B = triArea(w, t); boxProd = w * t * len; slantV = triArea(w, s) * len;
    labels = [lab(L(w, u, st), [0, 0, 0], [w, 0, 0]), lab(L(s, u, st), [0, 0, 0], [hb, 0, t]), lab(L(t, u, st), [hb, 0, 0], [hb, 0, t], { col: 'pick', inside: true }), lab(L(len, u, st), [w, 0, 0], [w, len, 0])];
    measures = [{ a: [hb, 0, t], b: [hb, 0, 0], key: 'dims', right: [1, 0, 0] }];
    bWords = `½ × ${fmt(w, st)} × ${fmt(t, st)}`; glowPts = [[0, 0, 0], [w, 0, 0], [hb, 0, t]];
  } else if (mode === 'ramp') {
    const [run, rise, c] = pick(R, TRIPLES).map(x => x * k) as [number, number, number];
    body = { kind: 'prism', axis: 1, base: [[0, 0], [run, 0], [0, rise]], at: 0, len, role: 'first' };
    B = triArea(run, rise); boxProd = run * rise * len; slantV = triArea(run, c) * len;
    labels = [lab(L(run, u, st), [0, 0, 0], [run, 0, 0]), lab(L(rise, u, st), [0, 0, 0], [0, 0, rise]), lab(L(c, u, st), [run, len, 0], [0, len, rise]), lab(L(len, u, st), [run, 0, 0], [run, len, 0])];
    bWords = `½ × ${fmt(run, st)} × ${fmt(rise, st)}`; glowPts = [[0, 0, 0], [run, 0, 0], [0, 0, rise]];
  } else if (mode === 'trap') {
    const [off, t, s] = pick(R, TRIPLES.filter(x => x[0] <= 6)).map(x => x * k) as [number, number, number];
    const top = int(R, 2, 6) * k, bot = clean(top + 2 * off);
    // a trough: the wide side up
    body = { kind: 'prism', axis: 1, base: [[off, 0], [off + top, 0], [bot, t], [0, t]], at: 0, len, role: 'first' };
    B = trapArea(top, bot, t); boxProd = top * t * len; extra = bot * t * len; slantV = trapArea(top, bot, s) * len;
    labels = [lab(L(bot, u, st), [0, len, t], [bot, len, t]), lab(L(top, u, st), [off, 0, 0], [off + top, 0, 0]), lab(L(s, u, st), [off + top, len, 0], [bot, len, t]), lab(L(t, u, st), [off, 0, 0], [off, 0, t], { col: 'pick', inside: true }), lab(L(len, u, st), [off + top, 0, 0], [off + top, len, 0])];
    measures = [{ a: [off, 0, t], b: [off, 0, 0], key: 'dims', right: [1, 0, 0] }];
    bWords = `½ × (${fmt(top, st)} + ${fmt(bot, st)}) × ${fmt(t, st)}`; glowPts = [[off, 0, 0], [off + top, 0, 0], [bot, 0, t], [0, 0, t]];
  } else {
    // standing on its triangle: a right-triangle base on the floor
    const [a, b, c] = pick(R, TRIPLES).map(x => x * k) as [number, number, number];
    body = { kind: 'prism', axis: 2, base: [[0, 0], [a, 0], [0, b]], at: 0, len, role: 'first' };
    B = triArea(a, b); boxProd = a * b * len; slantV = triArea(a, c) * len; lying = false;
    labels = [lab(L(a, u, st), [0, 0, 0], [a, 0, 0]), lab(L(b, u, st), [0, 0, 0], [0, b, 0]), lab(L(c, u, st), [a, 0, len], [0, b, len]), lab(L(len, u, st), [0, 0, 0], [0, 0, len])];
    bWords = `½ × ${fmt(a, st)} × ${fmt(b, st)}`; glowPts = [[0, 0, 0], [a, 0, 0], [0, b, 0]];
  }
  const ans = prismVolume(B, len);
  wrongs = [
    { v: boxProd, mc: lying ? MC.baseBottom : MC.baseProduct, say: lying ? `That treats the face it lies on as the base, like a box. The bases are the two ${mode === 'trap' ? 'trapezoid' : 'triangle'} ends: B = ${bWords}.` : `B is the area of the triangle, not a product of two of its sides: ${bWords}.` },
    { v: slantV, mc: MC.slantEdge, say: 'That uses a slanted edge. A height must be square to the side it stands on.' },
    ...(extra ? [{ v: extra, mc: MC.baseProduct, say: `B is the area of the trapezoid end, not the rectangle around it: ${bWords}.` }] : []),
  ];
  const glows: Glow[] = [{ pts: glowPts, key: 'gB', col: 'link' }];
  const pic = solidsPic({ bodies: [body], labels, measures, glows }, ['solid', 'dims'], [['gB']], [`B = ${fmtT(B, st)}`, `V = ${times(fmtT(B, st), fmtT(len, st))} = ${fmtT(ans, st)}`]);
  const base = {
    id: `prismBh-${n}`, family: 'prismBh' as const, board: 'V = Bh = \\,?', picture: pic,
    solution: [`The bases are the two ${mode === 'trap' ? 'trapezoid' : 'triangle'} ends${lying ? ': the prism lies on its side, so the base is not the bottom' : ''}.`, `B = ${bWords} = ${fmt(B, st)} ${sqU(u)}; h = the length between the bases, ${L(len, u, st)}.`, `V = ${fmt(B, st)} × ${fmt(len, st)} = ${S(`${fmt(ans, st)} ${cuU(u)}`)}.`],
  };
  if (R() < 0.25 && sg === 'vol-prism-bh') {
    return choiceItem({ ...base, prompt: `How can you find the volume of this ${A(what)}?` }, R, [
      { t: `B × h: B is the area of a ${mode === 'trap' ? 'trapezoid' : 'triangle'} end, h the length between the ends`, ok: true, say: 'Yes. Every slice parallel to the ends is the same shape, so V = Bh works for any prism.' },
      { t: 'You can\'t use V = Bh: it only works for boxes', mc: MC.bhOnlyBoxes, say: 'V = Bh works for every prism: it is layers of the base, stacked h deep. Here B is the end shape.' },
      { t: 'The bottom face × the height', mc: MC.baseBottom, say: 'The base of a prism is one of its two matching ends, not the face it rests on.' },
    ]);
  }
  return numItem({ ...base, prompt: `What is the volume of this ${A(what)}, a right prism?`, unit: cuU(u) }, ans, `Yes: ${fmt(ans, st)} ${cuU(u)}.`, wrongs, `Find B, the area of the ${mode === 'trap' ? 'trapezoid' : 'triangle'} end, then multiply by the length between the ends.`, { style: st });
}

// 8. tent: one prism whose base is a composite polygon                                    [vol-composite-base-prism]
function tent(R: Rn, n: number, sg?: string): Item {
  const { st, k } = styleFor(R, sg, 'vol-composite-base-prism');
  const u = pick(R, ['ft', 'in', 'm']);
  const mode = pick(R, ['house', 'house', 'L'] as const);
  const len = int(R, 4, 12) * k;
  if (mode === 'L') {
    const what = pick(R, ['bleacher step', 'stair block', 'L-shaped beam', 'shelf bracket']);
    const W = int(R, 4, 9) * k, H = int(R, 4, 9) * k, a = int(R, 2, Math.round(W / k) - 2) * k, b = int(R, 2, Math.round(H / k) - 2) * k;
    const base: P2[] = [[0, 0], [W, 0], [W, H - b], [W - a, H - b], [W - a, H], [0, H]];
    const B = polyArea(base), ans = prismVolume(B, len);
    const labels = [lab(L(W, u, st), [0, 0, 0], [W, 0, 0]), lab(L(H, u, st), [0, 0, 0], [0, 0, H]), lab(L(clean(W - a), u, st), [0, len, H], [clean(W - a), len, H]), lab(L(clean(H - b), u, st), [W, len, 0], [W, len, clean(H - b)]), lab(L(len, u, st), [W, 0, 0], [W, len, 0])];
    const glows: Glow[] = [{ pts: base.map(p => [p[0], 0, p[1]] as V3), key: 'gB', col: 'link' }];
    return numItem({
      id: `tent-${n}`, family: 'tent', unit: cuU(u),
      prompt: `This ${A(what)} has the same L-shaped end all along its ${L(len, u, st)} length. What is its volume?`,
      board: 'V = Bh = \\,?',
      solution: [`It is one prism lying on its side: the base is the L-shaped end, not the bottom.`, `B = ${fmt(clean(W - a), st)} × ${fmt(H, st)} + ${fmt(a, st)} × ${fmt(clean(H - b), st)} = ${fmt(B, st)} ${sqU(u)}.`, `V = ${fmt(B, st)} × ${fmt(len, st)} = ${S(`${fmt(ans, st)} ${cuU(u)}`)}.`],
      picture: solidsPic({ bodies: [{ kind: 'prism', axis: 1, base, at: 0, len, role: 'first' }], labels, glows }, ['solid', 'dims'], [['gB']], [`B = ${fmtT(B, st)}`, `V = ${times(fmtT(B, st), fmtT(len, st))} = ${fmtT(ans, st)}`]),
    }, ans, `Yes: ${fmt(ans, st)} ${cuU(u)}.`, [
      { v: W * H * len, mc: MC.baseBottom, say: 'That treats the bottom as the base and fills the whole box. The base is the L-shaped end: it has a corner missing.' },
      { v: (clean(W - a) * H + W * clean(H - b)) * len, mc: MC.wholeForPart, say: `The lower part is not ${fmt(W, st)} wide all the way up: split the L into two rectangles that do not overlap.` },
    ], 'B is the area of the L-shaped end. Then V = B × the length.', { style: st });
  }
  const what = pick(R, ['tent', 'shed', 'barn', 'doghouse', 'cabin model']);
  const [hb, hr, s] = pick(R, TRIPLES).map(x => x * k) as [number, number, number];
  const w = clean(2 * hb), hw = int(R, 2, 8) * k, Ht = clean(hw + hr);
  const base: P2[] = [[0, 0], [w, 0], [w, hw], [hb, Ht], [0, hw]];
  const Bbox = clean(w * hw), Btri = triArea(w, hr), B = clean(Bbox + Btri), ans = prismVolume(B, len);
  if (!near(B, polyArea(base))) throw new Error('tent base');
  const labels = [lab(L(w, u, st), [0, 0, 0], [w, 0, 0]), lab(L(hw, u, st), [0, 0, 0], [0, 0, hw]), lab(L(s, u, st), [0, 0, hw], [hb, 0, Ht]), lab(L(Ht, u, st), [hb, 0, 0], [hb, 0, Ht], { col: 'pick', inside: true }), lab(L(len, u, st), [w, 0, 0], [w, len, 0])];
  const measures: Measure[] = [{ a: [hb, 0, Ht], b: [hb, 0, 0], key: 'dims', right: [1, 0, 0] }];
  const glows: Glow[] = [{ pts: base.map(p => [p[0], 0, p[1]] as V3), key: 'gB', col: 'link' }];
  const pic = solidsPic({ bodies: [{ kind: 'prism', axis: 1, base, at: 0, len, role: 'first' }], labels, measures, glows }, ['solid', 'dims'], [['gB']], [`B = ${fmtT(Bbox, st)} + ${fmtT(Btri, st)}`, `V = ${times(fmtT(B, st), fmtT(len, st))} = ${fmtT(ans, st)}`]);
  const sol = [`The ${what} is one prism: the house-shaped end is the base, and it lies along ${L(len, u, st)}.`, `B = rectangle + triangle = ${fmt(w, st)} × ${fmt(hw, st)} + ½ × ${fmt(w, st)} × ${fmt(hr, st)} = ${fmt(B, st)} ${sqU(u)} (the roof is ${fmt(Ht, st)} − ${fmt(hw, st)} = ${fmt(hr, st)} tall).`, `V = ${fmt(B, st)} × ${fmt(len, st)} = ${S(`${fmt(ans, st)} ${cuU(u)}`)}. A box plus a triangular prism gives the same.`];
  if (R() < 0.3 && sg === 'vol-composite-base-prism') {
    const boxV = clean(Bbox * len);
    return choiceItem({ id: `tent-${n}`, family: 'tent', board: 'V = \\,?', picture: pic, solution: sol, prompt: `Ana finds the volume of this ${A(what)} as one prism with a house-shaped base: ${fmt(ans, st)} ${cuU(u)}. Ben splits it into a box and a triangular prism and adds. What does Ben get?` }, R, [
      { t: `${fmt(ans, st)} ${cuU(u)}, the same`, ok: true, say: 'Yes. Both methods count every part of the solid exactly once, so they must agree.' },
      { t: `${fmt(clean(ans + boxV), st)} ${cuU(u)}: two pieces hold more`, mc: MC.methodsDisagree, say: 'Splitting does not add space. The two pieces fill the same solid exactly once.' },
      { t: 'A different number: a different method gives a different answer', mc: MC.methodsDisagree, say: 'Two correct methods for the same volume always agree. If they don\'t, one has a mistake.' },
    ]);
  }
  return numItem({ id: `tent-${n}`, family: 'tent', unit: cuU(u), board: 'V = Bh = \\,?', picture: pic, solution: sol, prompt: `What is the volume of this ${A(what)}? Its end is a rectangle with a triangle on top.` }, ans, `Yes: ${fmt(ans, st)} ${cuU(u)}.`, [
    { v: w * Ht * len, mc: MC.baseProduct, say: `${fmt(w, st)} × ${fmt(Ht, st)} is not the area of the end: the roof is a triangle, not a rectangle. B = rectangle + triangle.` },
    { v: (Bbox + triArea(w, s)) * len, mc: MC.slantEdge, say: `The roof's height is ${fmt(Ht, st)} − ${fmt(hw, st)} = ${fmt(hr, st)}, square to its base. ${fmt(s, st)} is the slanted edge.` },
    { v: (Bbox + w * hr) * len, say: 'The roof triangle is half of the rectangle around it.' },
  ], 'B = the rectangle + the roof triangle. Then V = B × the length.', { style: st });
}

// 9. third: a pyramid holds one third of the prism with the same base and height            [pyramid-one-third-prism]
function third(R: Rn, n: number): Item {
  const u = pick(R, ['in', 'cm']);
  const l = int(R, 3, 6), w = int(R, 3, 6), h = int(R, 3, 7) * (R() < 0.5 ? 1 : 1);
  const mode = pick(R, ['count', 'value', 'height', 'slant'] as const);
  const gap = Math.max(l, w) * 0.5;
  const prism: Body = { kind: 'boxes', add: [box3(0, 0, 0, l, w, h)], role: 'second' };
  let hp = h;
  if (mode === 'height') { hp = h + pick(R, [-2, -1, 1, 2, 3]); if (hp < 2) hp = h + 2; }
  let slant = 0;
  if (mode === 'slant') { const tr = pick(R, [[3, 4, 5], [4, 3, 5], [6, 8, 10], [5, 12, 13]] as const); const ww = 2 * tr[0]; hp = tr[1]; slant = tr[2]; return thirdSlant(R, n, u, ww, hp, slant); }
  const pyr: Body = { kind: 'pyramid', base: [[l + gap, 0, 0], [2 * l + gap, 0, 0], [2 * l + gap, w, 0], [l + gap, w, 0]], apex: [l + gap + l / 2, w / 2, hp], role: 'first' };
  const labels = [lab(L(l, u), [0, 0, 0], [l, 0, 0]), lab(L(h, u), [0, 0, 0], [0, 0, h]), lab(L(hp, u), [l + gap + l / 2, w / 2, hp], [l + gap + l / 2, w / 2, 0], { col: 'pick', inside: true })];
  const measures: Measure[] = [{ a: [l + gap + l / 2, w / 2, hp], b: [l + gap + l / 2, w / 2, 0], key: 'dims', right: [1, 0, 0] }];
  const Vp = l * w * h, Vy = pyramidVolume(l * w, hp);
  const pic = solidsPic({ bodies: [prism, pyr], labels, measures }, ['solid', 'dims'], [[]], mode === 'height' ? [`\\tfrac13 \\cdot ${l * w} \\cdot ${hp}`, `= ${fmtT(Vy)}`] : [`V_{\\text{pyr}} = \\tfrac13 V_{\\text{prism}}`]);
  const solution = mode === 'height'
    ? [`The two have the same ${l} × ${w} base, but different heights: ${h} and ${hp} ${u}.`, `The ⅓ rule only compares a pyramid with a prism of the same base AND the same height.`, `Here: ⅓ × ${l * w} × ${hp} = ${S(`${fmt(Vy)} ${cuU(u)}`)}.`]
    : ['Same base, same height: the pyramid is filled and poured into the prism three times.', `So a pyramid holds ${S('one third')} of its prism: V = ⅓ Bh.`];
  const base = { id: `third-${n}`, family: 'third' as const, board: `V_{\\text{pyr}} = \\,?`, picture: pic, solution };
  if (mode === 'count') return choiceItem({ ...base, prompt: `The ${A('pyramid')} and the ${B('prism')} have the same ${l} ${u} × ${w} ${u} base and the same height. You fill the pyramid with sand and pour it into the prism. How many pyramids-full fill the prism?` }, R, [
    { t: '3', ok: true, say: 'Yes: three pyramids-full. A pyramid holds one third of the prism with the same base and height.' },
    { t: '2', mc: MC.coneHalf, say: 'It is not a half, as with a triangle and its rectangle. A pyramid narrows in every direction: it takes three.' },
    { t: '1: they hold the same', say: 'The pyramid narrows to a point, so it holds much less than the prism.' },
  ]);
  if (mode === 'value') {
    const opts: Opt[] = [
      { t: `${fmt(Vp / 3)} ${cuU(u)}`, ok: true, say: `Yes: one third of ${Vp}.` },
      { t: `${fmt(Vp / 2)} ${cuU(u)}`, mc: MC.coneHalf, say: 'That is a half. Same base and height: the pyramid is one third of the prism.' },
      { t: `${fmt(Vp)} ${cuU(u)}`, mc: MC.dropsCoef, say: 'That is the prism. The pyramid holds one third of it.' },
    ];
    return choiceItem({ ...base, prompt: `The ${B('prism')} holds ${Vp} ${cuU(u)}. The ${A('pyramid')} has the same base and the same height. How much does the pyramid hold?` }, R, opts);
  }
  return choiceItem({ ...base, prompt: `The ${B('prism')} holds ${Vp} ${cuU(u)}. The ${A('pyramid')} has the same ${l} × ${w} base but is ${hp} ${u} tall. Kai says the pyramid holds ⅓ of ${Vp}. Is he right?` }, R, [
    { t: `No: the heights differ. It holds ⅓ × ${l * w} × ${hp} = ${fmt(Vy)} ${cuU(u)}`, ok: true, say: 'Yes. The ⅓ rule needs the same base and the same height.' },
    { t: `Yes: a pyramid always holds ⅓ of a prism, ${fmt(Vp / 3)} ${cuU(u)}`, mc: MC.thirdAny, say: `Only of a prism with the same base and the same height. This prism is ${h} ${u} tall, the pyramid ${hp} ${u}.` },
    { t: `No: it holds half, ${fmt(Vp / 2)} ${cuU(u)}`, mc: MC.coneHalf, say: 'A pyramid is never half its prism: with the same base and height it is one third.' },
  ]);
}
function thirdSlant(R: Rn, n: number, u: string, ww: number, hp: number, slant: number): Item {
  const l = ww, gap = ww * 0.5;
  const prism: Body = { kind: 'boxes', add: [box3(0, 0, 0, l, ww, slant)], role: 'second' };
  const apex: V3 = [l + gap + l / 2, ww / 2, hp];
  const pyr: Body = { kind: 'pyramid', base: [[l + gap, 0, 0], [2 * l + gap, 0, 0], [2 * l + gap, ww, 0], [l + gap, ww, 0]], apex, role: 'first' };
  const labels = [lab(L(l, u), [0, 0, 0], [l, 0, 0]), lab(L(slant, u), [0, 0, 0], [0, 0, slant]), lab(L(slant, u), [2 * l + gap, ww / 2, 0], apex, { col: 'first', inside: true, optional: true })];
  const measures: Measure[] = [{ a: [2 * l + gap, ww / 2, 0], b: apex, key: 'dims', col: 'first' }, { a: apex, b: [l + gap + l / 2, ww / 2, 0], key: 'ht', right: [1, 0, 0] }];
  const Vp = l * ww * slant, Vy = pyramidVolume(l * ww, hp);
  return choiceItem({
    id: `third-${n}`, family: 'third', board: `V_{\\text{pyr}} = \\,?`,
    prompt: `The ${B('prism')} is ${slant} ${u} tall. The ${A('pyramid')} has the same ${l} × ${l} base, and its slanted face is ${slant} ${u} from the base edge to the top. Kai says the pyramid holds ⅓ of the prism. Is he right?`,
    solution: [`${slant} ${u} runs up a slanted face. The pyramid's height is straight up from the base: ${hp} ${u}.`, `So the heights are not equal, and the ⅓ rule does not apply: ⅓ × ${l * ww} × ${hp} = ${S(`${fmt(Vy)} ${cuU(u)}`)}.`],
    picture: solidsPic({ bodies: [prism, pyr], labels, measures }, ['solid', 'dims'], [['ht']], [`h = ${hp}`, `\\tfrac13 \\cdot ${l * ww} \\cdot ${hp} = ${fmtT(Vy)}`]),
  }, R, [
    { t: `No: its height is straight up, shorter than ${slant} ${u}. It holds less than ⅓`, ok: true, say: 'Yes. The slant height is longer than the height, so the heights do not match.' },
    { t: `Yes: same base, and it is ${slant} ${u} tall too`, mc: MC.slantEdge, say: `${slant} ${u} is the slant height, along a face. The pyramid's height is measured straight up: ${hp} ${u}.` },
    { t: 'No: it holds half the prism', mc: MC.coneHalf, say: 'With the same base and height it would be one third, never half. Here the heights differ.' },
  ]);
}

// 10. pyrVol: V = (1/3)Bh for rectangular and triangular pyramids                                  [pyramid-volume]
function pyrVol(R: Rn, n: number, sg?: string): Item {
  const what = pick(R, PYRS);
  const u = pick(R, PYR_U[what]!);
  const tri = R() < 0.4;
  if (!tri) {
    const [hl, h, s] = pick(R, TRIPLES);
    const l = 2 * hl, w = sg === 'pyramid-volume' && R() < 0.3 ? int(R, 3, 12) : l, hw = w / 2;
    const apex: V3 = [l / 2, hw, h];
    const body: Body = { kind: 'pyramid', base: [[0, 0, 0], [l, 0, 0], [l, w, 0], [0, w, 0]], apex, role: 'first' };
    const labels = [lab(L(l, u), [0, 0, 0], [l, 0, 0]), lab(L(w, u), [l, 0, 0], [l, w, 0]), lab(L(s, u), [l, hw, 0], apex, { col: 'first', inside: true }), lab(L(h, u), apex, [l / 2, hw, 0], { col: 'pick', inside: true })];
    const measures: Measure[] = [{ a: [l, hw, 0], b: apex, key: 'dims', col: 'first' }, { a: apex, b: [l / 2, hw, 0], key: 'dims', right: [1, 0, 0] }];
    const B = l * w, ans = pyramidVolume(B, h);
    return numItem({
      id: `pyrVol-${n}`, family: 'pyrVol', unit: cuU(u),
      prompt: `This ${A(what)} is a pyramid with a ${l} ${u} × ${w} ${u} rectangle for a base. What is its volume?`,
      board: 'V = \\tfrac13 Bh = \\,?',
      solution: [`B = ${l} × ${w} = ${B} ${sqU(u)}. The height is straight up from the base to the top: ${h} ${u} (${s} ${u} is the slant height, along a face).`, `V = ⅓ × ${B} × ${h} = ${S(`${fmt(ans)} ${cuU(u)}`)}.`],
      picture: solidsPic({ bodies: [body], labels, measures }, ['solid', 'dims'], [['ht']], [`\\tfrac13 \\cdot ${B} \\cdot ${h}`, `= ${fmtT(ans)}${cuT(u)}`]),
    }, ans, `Yes: ${fmt(ans)} ${cuU(u)}${Number.isInteger(ans) ? '' : ' (a fraction is fine)'}.`, [
      { v: B * h, mc: MC.dropsCoef, say: `${B} × ${h} is the box with the same base and height. A pyramid holds one third of it.` },
      { v: B * h / 2, mc: MC.coneHalf, say: 'A pyramid is one third of its prism, not half.' },
      { v: pyramidVolume(B, s), mc: MC.slantEdge, say: `${s} ${u} runs along a slanted face. Use the height straight up: ${h} ${u}.` },
    ], 'V = ⅓ × base area × height (straight up).');
  }
  // a triangular pyramid: the base triangle has its own height, the pyramid another
  // b × t even: B is whole, so V = ⅓ B H is a whole number or thirds (an odd b × t with H not a multiple of 3 gave
  // sixths, 45.833… ft³, typed with no rounding asked)
  const b = int(R, 3, 10);
  let t = int(R, 2, 8);
  if ((b * t) % 2) t += 1;
  let H = int(R, 3, 12);
  if (H === t) H = t + 2;
  const base: V3[] = [[0, 0, 0], [b, 0, 0], [b / 2, t, 0]];
  const apex: V3 = [b / 2, t / 3, H];
  const body: Body = { kind: 'pyramid', base, apex, role: 'first' };
  const labels = [lab(L(b, u), [0, 0, 0], [b, 0, 0]), lab(L(t, u), [b / 2, 0, 0], [b / 2, t, 0], { col: 'second', inside: true }), lab(L(H, u), apex, [b / 2, t / 3, 0], { col: 'pick', inside: true })];
  const measures: Measure[] = [{ a: [b / 2, t, 0], b: [b / 2, 0, 0], key: 'dims', col: 'second', right: [1, 0, 0] }, { a: apex, b: [b / 2, t / 3, 0], key: 'dims', right: [1, 0, 0] }];
  const Bv = triArea(b, t), ans = pyramidVolume(Bv, H);
  return numItem({
    id: `pyrVol-${n}`, family: 'pyrVol', unit: cuU(u),
    prompt: `This ${A(what)} is a pyramid with a triangle for a base: base ${b} ${u}, triangle height ${t} ${u}. The pyramid is ${H} ${u} tall. What is its volume?`,
    board: 'V = \\tfrac13 Bh = \\,?',
    solution: [`Two heights: the triangle's ${t} ${u} is for B, the pyramid's ${H} ${u} is for V.`, `B = ½ × ${b} × ${t} = ${fmt(Bv)} ${sqU(u)}.`, `V = ⅓ × ${fmt(Bv)} × ${H} = ${S(`${fmt(ans)} ${cuU(u)}`)}.`],
    picture: solidsPic({ bodies: [body], labels, measures }, ['solid', 'dims'], [['ht']], [`B = \\tfrac12 \\cdot ${b} \\cdot ${t} = ${fmtT(Bv)}`, `\\tfrac13 \\cdot ${fmtT(Bv)} \\cdot ${H} = ${fmtT(ans)}`]),
  }, ans, `Yes: ${fmt(ans)} ${cuU(u)}.`, [
    { v: pyramidVolume(Bv, t), mc: MC.baseTriHeight, say: `${t} ${u} is the height of the base triangle. The pyramid's height is ${H} ${u}, straight up from the base.` },
    { v: Bv * H, mc: MC.dropsCoef, say: 'That is the prism. A pyramid holds one third: ⅓ × B × h.' },
    { v: Bv * H / 2, mc: MC.coneHalf, say: 'A pyramid is one third of its prism, not half.' },
    { v: pyramidVolume(b * t, H), say: 'B is a triangle: ½ × base × height.' },
  ], 'B = ½ × base × the triangle\'s height; V = ⅓ × B × the pyramid\'s height.');
}

// 11. twoWays: different valid splits (or add vs subtract) must agree                          [partition-independence]
function twoWays(R: Rn, n: number): Item {
  const ctx = pick(R, PLANS.filter(p => p.u !== 'in'));
  const u = ctx.u;
  const mode = pick(R, ['split', 'subtract', 'luck'] as const);
  const W = int(R, 9, 16), H = int(R, 7, 12), a = int(R, 3, W - 4), b = int(R, 3, H - 3);
  const area = W * H - a * b;
  if (mode === 'luck') {
    // Eli's pieces overlap AND leave a gap of the same size (H - b = a makes g(a - g) = (a - g)g): a lucky match
    const a2 = int(R, 3, 7), W2 = a2 + int(R, 5, 9), b2 = int(R, 3, 6), H2 = a2 + b2, g = int(R, 1, a2 - 2), x1 = W2 - a2;
    const area2 = W2 * H2 - a2 * b2;
    const p0 = rect(0, 0, x1 + g, H2 - b2), p1 = rect(0, H2 - b2, x1, b2), p2 = rect(x1, 0, a2, H2 - b2 - g);
    const over = rect(x1, 0, g, H2 - b2 - g), gap = rect(x1 + g, H2 - b2 - g, a2 - g, g);
    const tot = polyArea(p0) + polyArea(p1) + polyArea(p2);
    if (!near(tot, area2 + polyArea(over) - polyArea(gap)) || !near(polyArea(over), polyArea(gap))) throw new Error('twoWays luck');
    return choiceItem({
      id: `twoWays-${n}`, family: 'twoWays', board: `A = ${area2}${sqT(u)}\\,?`,
      prompt: `Eli split this ${A(ctx.what)} into the three pieces shown and got ${area2} ${sqU(u)}, the same as the answer key. Is his method right?`,
      solution: [`Two of his pieces overlap (${polyArea(over)} ${sqU(u)}), and a strip of ${polyArea(gap)} ${sqU(u)} is in no piece.`, 'The overlap and the gap happen to be the same size, so the total matches by luck.', 'A method is right only when the pieces cover the figure exactly once.'],
      picture: planPic({ outer: lPlan(W2, H2, a2, b2), labels: [pl(L(W2, u), [0, 0], [W2, 0]), pl(L(H2, u), [0, H2], [0, 0])], pieces: [{ pts: p0, role: 'second' }, { pts: p1, role: 'pick' }, { pts: p2, role: 'link' }, { pts: over, role: 'wrong', key: 'bad' }, { pts: gap, role: 'wrong', key: 'bad' }] }, ['fig', 'dims', 'p0', 'p1', 'p2'], [['bad']], [`${tt('overlap')} = ${tt('gap')}`, tt('a lucky match')]),
    }, R, [
      { t: 'No: his pieces overlap and leave a gap; the total only matches by luck', ok: true, say: 'Yes. A matching number does not make a method right: the pieces must cover the figure exactly once.' },
      { t: 'Yes: his total matches the answer key', mc: MC.totalMatches, say: 'A matching total can hide two mistakes that cancel. Check the pieces: they overlap and leave a gap.' },
      { t: 'No: his total is wrong', say: `His total is ${area2} ${sqU(u)}, which is right. It is his pieces that are wrong.` },
    ]);
  }
  const vert = R() < 0.5;
  const pieces = mode === 'split'
    ? (vert ? [rect(0, 0, W - a, H), rect(W - a, 0, a, H - b)] : [rect(0, 0, W, H - b), rect(0, H - b, W - a, b)])
    : [rect(W - a, H - b, a, b)];
  const first = mode === 'split' ? (vert ? `${W - a} × ${H} + ${a} × ${H - b}` : `${W} × ${H - b} + ${W - a} × ${b}`) : `${W} × ${H} − ${a} × ${b}`;
  const otherWay = mode === 'split' ? 'splits it the other way' : 'adds two rectangles';
  const wrongVal = mode === 'split' ? area + (vert ? a * b : a * b) : W * H;
  const opts: Opt[] = [
    { t: `${area} ${sqU(u)}: any split that covers it exactly once gives the same area`, ok: true, say: `Yes. Both ways count every square of the ${ctx.what} exactly once.` },
    { t: `A different area: a different method gives a different answer`, mc: MC.methodsDisagree, say: 'Two correct methods for the same area always agree. If they disagree, one has a mistake.' },
    { t: `${wrongVal} ${sqU(u)}`, say: `That counts a ${a} × ${b} corner that is not part of the ${ctx.what}.` },
  ];
  return choiceItem({
    id: `twoWays-${n}`, family: 'twoWays', board: 'A = \\,?',
    prompt: `Mo finds the area of this ${A(ctx.what)} as ${first} = ${area} ${sqU(u)}. Jess ${otherWay}. What does Jess get?`,
    solution: [`Mo: ${first} = ${area}.`, `Jess's pieces also cover every part exactly once, so she gets ${S(`${area} ${sqU(u)}`)} too.`, 'Different correct methods for one area must agree.'],
    picture: planPic({ outer: lPlan(W, H, a, b), labels: [pl(L(W, u), [0, 0], [W, 0]), pl(L(H, u), [0, H], [0, 0]), pl(L(W - a, u), [0, H], [W - a, H]), pl(L(H - b, u), [W, 0], [W, H - b])], pieces: pieces.map((pts, i) => ({ pts, role: mode === 'subtract' ? 'wrong' as const : (i ? 'pick' as const : 'second' as const) })) }, ['fig', 'dims', ...pieces.map((_, i) => `p${i}`)], [[]], [mode === 'split' ? (vert ? `${W} \\cdot ${H - b} + ${W - a} \\cdot ${b}` : `${W - a} \\cdot ${H} + ${a} \\cdot ${H - b}`) : `${W - a} \\cdot ${H} + ${a} \\cdot ${H - b}`, `= ${area}${sqT(u)}`]),
  }, R, opts);
}

// ---------- two joined blocks (sa sub-goals) ----------
interface Pair { A: BoxSpec; B: BoxSpec; u: string; what: string; how: 'top' | 'side' }
function joinedPair(R: Rn, whole: boolean, where: 'center' | 'offset' | 'flush' | 'any' = 'any'): Pair {
  const c = pick(R, BLOCKS);
  const u = c.u;
  const L1 = int(R, 5, 10), W1 = int(R, 3, 6), H1 = int(R, 2, 5);
  const side = whole && R() < 0.35;
  if (side) {
    const L2 = int(R, 2, 5);
    return { A: box3(0, 0, 0, L1, W1, H1), B: box3(L1, 0, 0, L2, W1, H1), u, what: c.what, how: 'side' };
  }
  if (whole) { const H2 = int(R, 2, 5); return { A: box3(0, 0, 0, L1, W1, H1), B: box3(0, 0, H1, L1, W1, H2), u, what: c.what, how: 'top' }; }
  const l2 = int(R, 2, L1 - 2), w2 = int(R, 1, W1 - 1), h2 = int(R, 2, 5);
  const wh = where === 'any' ? pick(R, ['center', 'offset', 'flush'] as const) : where;
  let x = 0, y = 0;
  if (wh === 'center') { x = (L1 - l2) / 2; y = (W1 - w2) / 2; }
  else if (wh === 'offset') { x = int(R, 1, L1 - l2); y = int(R, 0, W1 - w2); }
  else { x = 0; y = 0; }
  return { A: box3(0, 0, 0, L1, W1, H1), B: box3(x, y, H1, l2, w2, h2), u, what: c.what, how: 'top' };
}
const dimsOf = (b: BoxSpec) => b.size;
function pairBodies(pr: Pair, lift = 1.0): Body[] {
  const h = pr.how === 'top' ? [0, 0, pr.A.size[2] * 0.9 * lift + 0.6] : [pr.A.size[0] * 0.35 * lift + 0.8, 0, 0];
  return [{ kind: 'boxes', add: [pr.A], role: 'first' }, { kind: 'boxes', add: [pr.B], role: 'second', off: h as V3 }];
}
/** the contact region on each block (the footprint of B), pulled apart with its block */
function pairGlows(pr: Pair, key: string): Glow[] {
  const [x, y, z] = pr.B.at, [l, w] = pr.B.size;
  if (pr.how === 'side') { const [, W1, H1] = pr.A.size; const X = pr.A.size[0]; const q: V3[] = [[X, 0, 0], [X, W1, 0], [X, W1, H1], [X, 0, H1]]; return [{ pts: q, body: 0, key }, { pts: q, body: 1, key }]; }
  const q: V3[] = [[x, y, z], [x + l, y, z], [x + l, y + w, z], [x, y + w, z]];
  return [{ pts: q, body: 0, key }, { pts: q, body: 1, key }];
}
function pairLabels(pr: Pair): Label[] {
  const [L1, W1, H1] = pr.A.size, [l2, w2, h2] = pr.B.size, [x, y, z] = pr.B.at, u = pr.u;
  const out = [lenLab(pr.A, L(L1, u)), depLab(pr.A, L(W1, u)), hLab(pr.A, L(H1, u))];
  if (pr.how === 'side') out.push(lab(L(l2, u), [L1, 0, 0], [L1 + l2, 0, 0], { col: 'second' }));
  else {
    if (l2 !== L1) out.push(lenLab(pr.B, L(l2, u), { col: 'second', optional: true }));
    if (w2 !== W1) out.push(lab(L(w2, u), [x + l2, y, z + h2], [x + l2, y + w2, z + h2], { col: 'second', optional: true }));
    out.push(x <= 1e-9 ? hLab(pr.B, L(h2, u), { col: 'second', optional: true }) : lab(L(h2, u), [x + l2, y + w2, z], [x + l2, y + w2, z + h2], { col: 'second', optional: true }));
  }
  return out;
}

// 12. classify: contact regions are inside; hidden faces can still be outside                     [sa-contact-classify]
function classify(R: Rn, n: number): Item {
  const pr = joinedPair(R, R() < 0.6);
  const [L1, W1, H1] = pr.A.size;
  const kind = pick(R, ['contact', 'contact', 'bottom', 'back', 'front'] as const);
  let pts: V3[], which = '';
  const g = pairGlows(pr, 'gm');
  if (kind === 'contact') { pts = g[0]!.pts; which = 'where the blocks touch'; }
  else if (kind === 'bottom') { pts = [[0, 0, 0], [L1, 0, 0], [L1, W1, 0], [0, W1, 0]]; which = 'the bottom of the big block'; }
  else if (kind === 'back') { pts = [[0, W1, 0], [L1, W1, 0], [L1, W1, H1], [0, W1, H1]]; which = 'the back of the big block'; }
  else { const [x, y, z] = pr.B.at, [l, , h] = pr.B.size; pts = [[x, y, z], [x + l, y, z], [x + l, y, z + h], [x, y, z + h]]; which = 'the front of the small block'; }
  const glows: Glow[] = [{ pts, key: 'mk' }];
  const out = kind !== 'contact', seen = kind === 'front';
  const say = kind === 'contact' ? 'It is glued between the blocks: inside the solid, so no paint reaches it.' : seen ? 'It faces out and you can see it: it gets paint.' : 'You cannot see it from here, but it still faces the outside: it gets paint.';
  return choiceItem({
    id: `classify-${n}`, family: 'classify', board: `${tt('outside?')}`,
    prompt: `Two ${A(plural(pr.what))} are glued together, and the new solid is painted all over, bottom included. Does the ${P('marked region')} get paint?`,
    solution: [`The marked region is ${which}.`, say, 'Only the regions where blocks touch become inside. Hidden from view is not the same as inside.'],
    picture: solidsPic({ bodies: [{ kind: 'boxes', add: [pr.A], role: 'first' }, { kind: 'boxes', add: [pr.B], role: 'second' }], glows, labels: pairLabels(pr) }, ['solid', 'dims', 'mk'], [[]], [out ? tt('outside: painted') : tt('inside: no paint')]),
  }, R, [
    { t: 'Yes: it is on the outside, and you can see it', ok: kind === 'front', say: kind === 'front' ? 'Yes: it faces out and is in view.' : (out ? 'It is on the outside, but it is hidden from this view. It still gets paint.' : 'It is glued between the blocks, inside the solid.'), mc: kind === 'contact' ? MC.hiddenContact : undefined },
    { t: 'Yes: it is on the outside, just hidden from this view', ok: out && !seen, say: out && !seen ? 'Yes: hidden from view, but still outside.' : (kind === 'contact' ? 'It is not just hidden: it is glued between the blocks, inside the solid.' : 'You can see this one: it faces you.'), mc: kind === 'contact' ? MC.hiddenContact : undefined },
    { t: 'No: it is inside, where the blocks touch', ok: kind === 'contact', say: kind === 'contact' ? 'Yes: where the blocks touch is inside the solid.' : 'It does not touch the other block. It faces the outside, so it gets paint, even if you cannot see it.', mc: kind === 'bottom' || kind === 'back' ? MC.onlyVisible : undefined },
  ]);
}

// 13. faces: composite surface area by summing exposed faces (whole-face contact)                       [sa-whole-face]
function faces(R: Rn, n: number): Item {
  const mode = pick(R, ['cubes', 'cubes', 'stack', 'roof'] as const);
  if (mode === 'cubes') {
    const k = int(R, 2, 7), s = pick(R, [1, 1, 2, 3]), u = pick(R, ['in', 'cm']);
    const boxes = Array.from({ length: k }, (_, i) => box3(i * s, 0, 0, s, s, s));
    const ans = unionSurface(boxes), f = s * s;
    if (!near(ans, (4 * k + 2) * f)) throw new Error('cubes surface');
    return numItem({
      id: `faces-${n}`, family: 'faces', unit: sqU(u),
      prompt: `${A(`${k} cubes`)}, each ${L(s, u)} on a side, are glued in a row. What is the surface area of the row?`,
      board: 'S = \\,?',
      solution: [`Count the outside faces: ${k} on the front, ${k} on the back, ${k} on top, ${k} underneath, and 1 at each end: ${4 * k + 2} faces.`, `The ${2 * (k - 1)} faces glued together are inside, so they do not count.`, `${4 * k + 2} × ${f} = ${S(`${ans} ${sqU(u)}`)}.`],
      picture: solidsPic({ bodies: [{ kind: 'boxes', add: boxes, role: 'first', seams: true }], labels: [lab(L(s, u), [0, 0, 0], [s, 0, 0])] }, ['solid', 'dims'], [[]], [`(4 \\cdot ${k} + 2) \\cdot ${f}`, `= ${ans}${sqT(u)}`]),
    }, ans, `Yes: ${4 * k + 2} faces of ${f} ${sqU(u)}: ${ans} ${sqU(u)}.`, [
      { v: 6 * k * f, mc: MC.hiddenContact, say: `${k} × 6 counts the faces glued together too. They are inside: ${2 * (k - 1)} faces drop out.` },
      { v: (2 * k + 1) * f, mc: MC.onlyVisible, say: 'That counts only the faces you can see. The back, the bottom and the far end are outside too.' },
    ], `Count every outside face: top, bottom, front, back and the two ends.`);
  }
  if (mode === 'stack') {
    const pr = joinedPair(R, true);
    const S1 = boxSurface(pr.A), S2 = boxSurface(pr.B), A2 = contactArea(pr.A, pr.B), ans = unionSurface([pr.A, pr.B]);
    if (!near(ans, S1 + S2 - 2 * A2)) throw new Error('stack surface');
    const [L1, W1, H1] = dimsOf(pr.A), [l2, , h2] = dimsOf(pr.B);
    return numItem({
      id: `faces-${n}`, family: 'faces', unit: sqU(pr.u),
      prompt: `Two ${A(plural(pr.what))} are glued face to face. What is the surface area of the new solid, bottom included?`,
      board: 'S = \\,?',
      solution: [pr.how === 'top' ? `Outside faces: the bottom and the top (${L1} × ${W1} each), and the four sides, now ${H1 + h2} ${pr.u} tall.` : `Outside faces: the two ends (${W1} × ${H1}), and the top, bottom, front and back, now ${L1 + l2} ${pr.u} long.`, `The two glued faces are inside and drop out.`, `S = ${S(`${ans} ${sqU(pr.u)}`)}.`],
      picture: solidsPic({ bodies: pairBodies(pr), labels: pairLabels(pr), glows: pairGlows(pr, 'gc') }, ['solid', 'dims'], [['explode'], ['gc']], [`${S1} + ${S2} - 2 \\cdot ${A2}`, `= ${ans}${sqT(pr.u)}`]),
    }, ans, `Yes: ${ans} ${sqU(pr.u)}.`, [
      { v: S1 + S2, mc: MC.hiddenContact, say: 'That counts the two glued faces. They are inside now: take both away.' },
      { v: S1 + S2 - A2, mc: MC.removesOnce, say: 'Both blocks lost a face where they meet, so the glued area comes off twice.' },
    ], 'Add up the outside faces of the new solid only.');
  }
  // a triangular-prism roof on a box
  const [hb, r, s] = pick(R, TRIPLES.filter(x => x[0] <= 6));
  const w = 2 * hb, d = int(R, 3, 8), h = int(R, 2, 6), u = pick(R, ['ft', 'in']);
  const what = pick(R, ['birdhouse', 'toy barn', 'shed model', 'mailbox']);
  const boxS = boxSurface(box3(0, 0, 0, w, d, h)), roofS = 2 * triArea(w, r) + 2 * s * d + w * d;
  const ans = clean(boxS - w * d + roofS - w * d);
  const bodies: Body[] = [{ kind: 'boxes', add: [box3(0, 0, 0, w, d, h)], role: 'first' }, { kind: 'prism', axis: 1, base: [[0, h], [w, h], [hb, h + r]], at: 0, len: d, role: 'second', off: [0, 0, h * 0.6 + 1] }];
  const labels = [lab(L(w, u), [0, 0, 0], [w, 0, 0]), lab(L(d, u), [w, 0, 0], [w, d, 0]), lab(L(h, u), [0, 0, 0], [0, 0, h]), lab(L(s, u), [w, d, h], [hb, d, h + r], { col: 'second' }), lab(L(r, u), [hb, 0, h], [hb, 0, h + r], { col: 'pick', inside: true })];
  const measures: Measure[] = [{ a: [hb, 0, h + r], b: [hb, 0, h], key: 'dims', right: [1, 0, 0] }];
  const glows: Glow[] = [{ pts: [[0, 0, h], [w, 0, h], [w, d, h], [0, d, h]], body: 0, key: 'gc' }, { pts: [[0, 0, h], [w, 0, h], [w, d, h], [0, d, h]], body: 1, key: 'gc' }];
  return numItem({
    id: `faces-${n}`, family: 'faces', unit: sqU(u),
    prompt: `A ${A(what)} is a box with a triangular-prism roof. Every outside surface gets painted, bottom included. What area is painted?`,
    board: 'S = \\,?',
    solution: [`Box: the bottom (${w} × ${d}) and 4 walls; its top is glued under the roof. Roof: 2 triangles (½ × ${w} × ${r}) and 2 slanted rectangles (${s} × ${d}).`, `${w * d} + ${2 * (w * h + d * h)} + ${2 * triArea(w, r)} + ${2 * s * d} = ${S(`${ans} ${sqU(u)}`)}.`],
    picture: solidsPic({ bodies, labels, measures, glows }, ['solid', 'dims'], [['explode'], ['gc']], [`${w * d} + ${2 * (w * h + d * h)} + ${2 * triArea(w, r)} + ${2 * s * d}`, `= ${ans}${sqT(u)}`]),
  }, ans, `Yes: ${ans} ${sqU(u)}.`, [
    { v: ans + 2 * w * d, mc: MC.hiddenContact, say: `The box's top and the roof's bottom are glued together: neither is outside. Leave out both ${w} × ${d} faces.` },
    { v: ans + w * d, mc: MC.removesOnce, say: 'Two faces are glued there: the box top and the roof bottom. Leave out both.' },
    { v: ans - 2 * triArea(w, r) + 2 * w * r, say: 'The roof ends are triangles: ½ × base × height.' },
  ], 'List every outside face of the box and the roof, then add.');
}

// 14. joinSA: S = S1 + S2 - 2A                                                                   [sa-double-subtraction]
function joinSA(R: Rn, n: number): Item {
  const pr = joinedPair(R, R() < 0.5);
  const S1 = boxSurface(pr.A), S2 = boxSurface(pr.B), A2 = contactArea(pr.A, pr.B), ans = unionSurface([pr.A, pr.B]);
  if (!near(ans, S1 + S2 - 2 * A2)) throw new Error('joinSA');
  const [l2, w2] = pr.how === 'side' ? [pr.A.size[1], pr.A.size[2]] : [pr.B.size[0], pr.B.size[1]];
  const pic = solidsPic({ bodies: pairBodies(pr), labels: pairLabels(pr), glows: pairGlows(pr, 'gc') }, ['solid', 'dims'], [['explode'], ['gc']], [`${S1} + ${S2} - 2 \\cdot ${A2}`, `= ${ans}${sqT(pr.u)}`]);
  const sol = [`Where the blocks touch, a ${l2} × ${w2} = ${A2} ${sqU(pr.u)} region was part of BOTH surfaces: once on each block.`, `Glued, neither copy is outside, so it comes off twice.`, `${S1} + ${S2} − 2 × ${A2} = ${S(`${ans} ${sqU(pr.u)}`)}.`];
  if (R() < 0.3) return choiceItem({ id: `joinSA-${n}`, family: 'joinSA', board: `S = S_1 + S_2 - 2A`, picture: pic, solution: sol, prompt: `Two ${A(plural(pr.what))} are glued together. Why does the surface area lose ${P(`2 × ${A2} ${sqU(pr.u)}`)}, not just ${A2}?` }, R, [
    { t: `Each block had its own ${A2} ${sqU(pr.u)} face there, and both are now inside`, ok: true, say: 'Yes: counted once on each block, and neither is outside any more.' },
    { t: `It should be just ${A2}: only one face is covered`, mc: MC.removesOnce, say: 'Both blocks lose a face where they meet: the top one\'s and the bottom one\'s.' },
    { t: `Because the volume also drops by ${A2}`, mc: MC.contactFromVol, say: 'The volume does not drop at all: faces have no thickness. Volumes just add.' },
  ]);
  return numItem({
    id: `joinSA-${n}`, family: 'joinSA', unit: sqU(pr.u), board: 'S = \\,?', picture: pic, solution: sol,
    prompt: `Block ${A('A')} (${pr.A.size.join(' × ')} ${pr.u}) has a surface area of ${A(`${S1} ${sqU(pr.u)}`)} and block ${B('B')} (${pr.B.size.join(' × ')} ${pr.u}) of ${B(`${S2} ${sqU(pr.u)}`)}. They are glued as shown. What is the surface area of the new solid?`,
  }, ans, `Yes: ${S1} + ${S2} − 2 × ${A2} = ${ans} ${sqU(pr.u)}.`, [
    { v: S1 + S2, mc: MC.hiddenContact, say: 'That still counts the glued faces. They are inside now.' },
    { v: S1 + S2 - A2, mc: MC.removesOnce, say: `The ${A2} ${sqU(pr.u)} region was counted on both blocks, so it comes off twice.` },
  ], `S = S₁ + S₂ − 2 × the contact area.`);
}

// 15. partialSA: a smaller block on a larger face: subtract twice the footprint                    [sa-partial-contact]
function partialSA(R: Rn, n: number): Item {
  const pr = joinedPair(R, false);
  const [L1, W1] = pr.A.size, [l2, w2] = pr.B.size;
  const S1 = boxSurface(pr.A), S2 = boxSurface(pr.B), A2 = l2 * w2;
  const noBottom = R() < 0.3;
  const full = unionSurface([pr.A, pr.B]), ans = clean(noBottom ? full - L1 * W1 : full);
  if (!near(full, S1 + S2 - 2 * A2)) throw new Error('partialSA');
  return numItem({
    id: `partialSA-${n}`, family: 'partialSA', unit: sqU(pr.u),
    prompt: `A small ${B(`${l2} × ${w2} × ${pr.B.size[2]} ${pr.u} ${pr.what}`)} sits glued on top of a big one. The big block's surface area is ${A(`${S1} ${sqU(pr.u)}`)}, the small one's ${B(`${S2} ${sqU(pr.u)}`)}. ${noBottom ? 'Everything is painted except the bottom, which stands on the table.' : 'Everything is painted, bottom included.'} How much area is painted?`,
    board: 'S = \\,?',
    solution: [`Only the small block's footprint, ${l2} × ${w2} = ${A2} ${sqU(pr.u)}, is covered: the rest of the big block's top is still outside.`, `${S1} + ${S2} − 2 × ${A2} = ${full}.`, ...(noBottom ? [`Take away the bottom, ${L1} × ${W1} = ${L1 * W1}: ${S(`${ans} ${sqU(pr.u)}`)}.`] : [`So ${S(`${ans} ${sqU(pr.u)}`)}.`])],
    picture: solidsPic({ bodies: pairBodies(pr), labels: pairLabels(pr), glows: pairGlows(pr, 'gc') }, ['solid', 'dims'], [['explode'], ['gc']], [`${S1} + ${S2} - 2 \\cdot ${A2}${noBottom ? ` - ${L1 * W1}` : ''}`, `= ${ans}${sqT(pr.u)}`]),
  }, ans, `Yes: ${ans} ${sqU(pr.u)}.`, [
    { v: S1 + S2 - A2 - L1 * W1 - (noBottom ? L1 * W1 : 0), mc: MC.wholeFace, say: `The small block covers only ${l2} × ${w2} of the big top. The rest of the top is still outside.` },
    { v: S1 + S2 - A2 - (noBottom ? L1 * W1 : 0), mc: MC.removesOnce, say: `The footprint was counted on both blocks: take ${A2} away twice.` },
    { v: S1 + S2 - (noBottom ? L1 * W1 : 0), mc: MC.hiddenContact, say: 'The two glued regions are inside now: take them away.' },
    ...(noBottom ? [{ v: full, mc: MC.ignoresContext, say: 'The bottom stands on the table and is not painted: leave it out.' }] : [{ v: full - L1 * W1, mc: MC.excludesBottom, say: 'This time the bottom is painted too: keep it.' }]),
  ], 'S₁ + S₂ − 2 × the footprint of the small block.');
}

// 16. cutJoin: volume stays, surface area changes                                         [sa-cut-join-invariance]
function cutJoin(R: Rn, n: number): Item {
  const c = pick(R, BLOCKS);
  const u = c.u;
  const mode = pick(R, ['cutNum', 'cutChoice', 'rearrange', 'join'] as const);
  if (mode === 'rearrange') {
    const k = pick(R, [4, 6, 8, 12]);
    const rows = k === 4 ? 2 : k === 6 ? 2 : k === 8 ? 2 : 3;
    const row = Array.from({ length: k }, (_, i) => box3(i, 0, 0, 1, 1, 1));
    const blk = Array.from({ length: k }, (_, i) => box3(k + 1.5 + (i % (k / rows)), 0, Math.floor(i / (k / rows)), 1, 1, 1));
    const Sa = unionSurface(row), Sb = unionSurface(blk.map(b => ({ at: [b.at[0] - (k + 1.5), b.at[1], b.at[2]] as V3, size: b.size })));
    return choiceItem({
      id: `cutJoin-${n}`, family: 'cutJoin', board: `V_1 = V_2,\\ S_1 \\ne S_2`,
      prompt: `The same ${A(`${k} cubes`)} are glued into a long row, then into a block. Compare the two solids.`,
      solution: [`Both use ${k} cubes, so both have a volume of ${k} cubic units.`, `The row has ${Sa} square units of surface, the block ${Sb}: more cubes touch in the block, so more faces are inside.`, 'Same volume does not mean the same surface area.'],
      picture: solidsPic({ bodies: [{ kind: 'boxes', add: row, role: 'first', seams: true }, { kind: 'boxes', add: blk, role: 'second', seams: true }] }, ['solid'], [[]], [`V: ${k} = ${k}`, `S: ${Sa} \\ne ${Sb}`]),
    }, R, [
      { t: 'Same volume, but the row has more surface area', ok: true, say: `Yes: ${k} = ${k} cubic units, but ${Sa} > ${Sb} square units.` },
      { t: 'Same volume, so the same surface area', mc: MC.changeTogether, say: `The volume matches, but the row has ${Sa} square units of surface and the block ${Sb}.` },
      { t: 'The block has more volume and more surface area', mc: MC.changeTogether, say: `Both are ${k} cubes: same volume. And the block has less surface: ${Sb}.` },
    ]);
  }
  const Lx = int(R, 6, 12), W = int(R, 3, 6), H = int(R, 3, 6), at = int(R, 2, Lx - 2);
  const S0 = boxSurface(box3(0, 0, 0, Lx, W, H)), V0 = Lx * W * H, A2 = W * H;
  const a = box3(0, 0, 0, at, W, H), b = box3(at, 0, 0, Lx - at, W, H);
  const Snew = boxSurface(a) + boxSurface(b);
  if (!near(Snew, S0 + 2 * A2)) throw new Error('cut');
  const bodies: Body[] = [{ kind: 'boxes', add: [a], role: 'first' }, { kind: 'boxes', add: [b], role: 'second', off: [Lx * 0.3 + 1, 0, 0] }];
  const cutFace: V3[] = [[at, 0, 0], [at, W, 0], [at, W, H], [at, 0, H]];
  const glows: Glow[] = [{ pts: cutFace, body: 0, key: 'gc', col: 'link' }, { pts: cutFace, body: 1, key: 'gc', col: 'link' }];
  const labels = [lab(L(Lx, u), [0, 0, 0], [Lx, 0, 0]), lab(L(W, u), [Lx, 0, 0], [Lx, W, 0]), lab(L(H, u), [0, 0, 0], [0, 0, H])];
  const pic = solidsPic({ bodies, glows, labels }, ['solid', 'dims'], [['explode'], ['gc']], mode === 'join' ? [`V = ${V0}`, `S = ${Snew} - 2 \\cdot ${A2} = ${S0}`] : [`V = ${V0}`, `S = ${S0} + 2 \\cdot ${A2} = ${Snew}`]);
  if (mode === 'cutNum') return numItem({
    id: `cutJoin-${n}`, family: 'cutJoin', unit: sqU(u), board: 'S_{\\text{new}} = \\,?', picture: pic,
    prompt: `A ${A(`${c.what} ${Lx} × ${W} × ${H} ${u}`)} has a surface area of ${S0} ${sqU(u)}. It is cut straight through, parallel to its ends, into two pieces. What is the total surface area of the two pieces?`,
    solution: [`The cut makes two new ${W} × ${H} faces, one on each piece.`, `${S0} + 2 × ${A2} = ${S(`${Snew} ${sqU(u)}`)}. The volume stays ${V0} ${cuU(u)}.`],
  }, Snew, `Yes: ${Snew} ${sqU(u)}.`, [
    { v: S0, mc: MC.cutPreserves, say: 'Nothing is lost, so the volume stays the same. But the cut makes two new faces that were inside before.' },
    { v: S0 + A2, mc: MC.removesOnce, say: 'Each piece gets its own new face: two of them.' },
  ], 'Old surface + the two new faces the cut makes.');
  if (mode === 'join') return choiceItem({
    id: `cutJoin-${n}`, family: 'cutJoin', board: `V,\\ S\\ ?`, picture: { ...pic, show: ['solid', 'dims', 'explode'], solve: [['explode0'], ['gc']] },
    prompt: `Two pieces of ${A(c.what)} are pushed together end to end (they meet across a ${W} × ${H} ${u} face). What happens?`,
    solution: [`The volumes just add: ${V0} ${cuU(u)}.`, `The two touching ${W} × ${H} faces are inside now: the surface drops by 2 × ${A2} = ${2 * A2} ${sqU(u)}.`],
  }, R, [
    { t: `The volume adds; the surface area drops by ${2 * A2} ${sqU(u)}`, ok: true, say: 'Yes: volume adds, and two faces go inside.' },
    { t: 'The volume adds, and so does the surface area', mc: MC.changeTogether, say: 'Volume and surface area do not move together: two touching faces drop out of the surface.' },
    { t: `The volume drops by ${A2}, and so does the surface area`, mc: MC.contactFromVol, say: 'No space is lost where the pieces meet: the volumes add. Only the surface loses the two faces.' },
  ]);
  return choiceItem({
    id: `cutJoin-${n}`, family: 'cutJoin', board: `V,\\ S\\ ?`, picture: pic,
    prompt: `A ${A(c.what)} is cut into two pieces. What happens to the total volume and the total surface area?`,
    solution: ['The two pieces fill the same space: the volume does not change.', `The cut makes two new faces (one on each piece): the surface area grows by 2 × ${A2} ${sqU(u)}.`],
  }, R, [
    { t: 'The volume stays the same; the surface area grows', ok: true, say: 'Yes. Same material, but two new faces.' },
    { t: 'Both stay the same: nothing is lost', mc: MC.cutPreserves, say: 'No material is lost, so the volume stays. But each piece gets a new face where the cut went.' },
    { t: 'Both grow', mc: MC.changeTogether, say: 'The pieces hold the same material as before: the volume cannot grow.' },
  ]);
}

// 17. which: choose area, surface area or volume, and the region counted                       [apply-choose-measure]
function which(R: Rn, n: number): Item {
  const mode = pick(R, ['fill', 'coat', 'coatTop', 'depth'] as const);
  const u = pick(R, ['ft', 'in']);
  const what = pick(R, ['planter', 'raised garden bed', 'concrete step', 'storage chest', 'fish tank stand']);
  const Lx = int(R, 3, 8), W = int(R, 2, 5), H = int(R, 2, 5);
  if (mode === 'depth') {
    const Bv = Lx * W, h = int(R, 2, 6), V = Bv * h;
    return choiceItem({
      id: `which-${n}`, family: 'which', board: 'h = V \\div B',
      prompt: `A ${A('tank')} holds ${V} ${cuU(u)} of water. Its base is ${Bv} ${sqU(u)}. How deep is the water when it is full?`,
      solution: [`V = B × h, so h = ${V} ÷ ${Bv} = ${h}.`, `A depth is a length: ${S(`${h} ${u}`)}, not cubic or square units.`],
      picture: solidsPic({ bodies: [{ kind: 'boxes', add: [box3(0, 0, 0, Lx, W, h)], role: 'second' }], labels: [lab(L(Lx, u), [0, 0, 0], [Lx, 0, 0]), lab(L(W, u), [Lx, 0, 0], [Lx, W, 0]), lab('?', [0, 0, 0], [0, 0, h], { col: 'pick' })] }, ['solid', 'dims'], [[]], [`h = ${V} \\div ${Bv}`, `= ${h}${tt(' ' + u)}`]),
    }, R, [
      { t: `${h} ${u}`, ok: true, say: 'Yes: a depth is a length.' },
      { t: `${h} ${cuU(u)}`, mc: MC.cubicLength, say: `${cuU(u)} measure space. Dividing ${cuU(u)} by ${sqU(u)} leaves ${u}: a length.` },
      { t: `${h} ${sqU(u)}`, mc: MC.unitDim, say: `${sqU(u)} measure area. A depth is a length, in ${u}.` },
    ]);
  }
  // an L-shaped solid: two boxes
  const top = box3(0, 0, H, int(R, 1, Lx - 1), W, int(R, 1, 3));
  const boxes = [box3(0, 0, 0, Lx, W, H), top];
  const V = unionVolume(boxes), Sall = unionSurface(boxes), bottom = Lx * W, Ssum = boxSurface(boxes[0]!) + boxSurface(top);
  const pic = (hero: string[]) => solidsPic({ bodies: [{ kind: 'boxes', add: boxes, role: 'first' }], labels: [lenLab(boxes[0]!, L(Lx, u)), depLab(boxes[0]!, L(W, u)), hLab(boxes[0]!, L(H, u)), lenLab(top, L(top.size[0], u)), hLab(top, L(top.size[2], u))] }, ['solid', 'dims'], [[]], hero);
  if (mode === 'fill') return choiceItem({
    id: `which-${n}`, family: 'which', board: `${tt('sand')} = \\,?`, picture: pic([`V = ${V}${cuT(u)}`]),
    prompt: `This ${A(what)} is hollow and gets filled to the top with sand. Which measure tells how much sand?`,
    solution: ['Filling is about space inside: volume.', `V = ${S(`${V} ${cuU(u)}`)}.`],
  }, R, [
    { t: `${V} ${cuU(u)}`, ok: true, say: 'Yes: filling means volume, in cubic units.' },
    { t: `${Sall} ${sqU(u)}`, mc: MC.saVsVolume, say: 'That is the surface: what you would paint or wrap. Sand fills the space inside: volume.' },
    { t: `${V} ${sqU(u)}`, mc: MC.unitDim, say: `A volume is counted in cubes: ${cuU(u)}.` },
  ]);
  const withBottom = mode === 'coat';
  const ans = withBottom ? Sall : Sall - bottom;
  if (!uniq([ans, Sall - bottom, Sall, V, withBottom ? Ssum : Ssum - bottom].map(String).filter((x, i) => withBottom ? i !== 2 : i !== 1))) return which(R, n);
  return choiceItem({
    id: `which-${n}`, family: 'which', board: `${tt('paint')} = \\,?`, picture: pic([`S = ${Sall}${withBottom ? '' : ` - ${bottom}`}`, `= ${ans}${sqT(u)}`]),
    prompt: `This ${A(what)} gets a coat of paint on ${withBottom ? 'every outside surface, bottom included (it is lifted to paint)' : 'every outside surface except the bottom, which stands on the floor'}. How much area is painted?`,
    solution: ['Coating is about the outside: surface area.', withBottom ? `Every outside face counts: ${S(`${Sall} ${sqU(u)}`)}.` : `Leave out the bottom (${Lx} × ${W} = ${bottom}): ${Sall} − ${bottom} = ${S(`${ans} ${sqU(u)}`)}.`],
  }, R, [
    { t: `${ans} ${sqU(u)}`, ok: true, say: 'Yes: the faces that get paint, in square units.' },
    withBottom
      ? { t: `${Sall - bottom} ${sqU(u)}`, mc: MC.excludesBottom, say: 'This time the bottom is painted too: keep it in.' }
      : { t: `${Sall} ${sqU(u)}`, mc: MC.ignoresContext, say: 'The bottom stands on the floor and gets no paint: leave it out.' },
    { t: `${V} ${cuU(u)}`, mc: MC.saVsVolume, say: 'That is the space inside. Paint covers the outside: surface area.' },
    { t: `${withBottom ? Ssum : Ssum - bottom} ${sqU(u)}`, mc: MC.hiddenContact, say: 'That adds both blocks\' full surfaces, so the faces where they touch are counted. Those are inside.' },
  ]);
}

// 18. cylVol: V = Bh with B = pi r^2                                                                  [cyl-volume-bh]
function cylVol(R: Rn, n: number): Item {
  const c = pick(R, CYLS);
  const u = c.u;
  const r = int(R, 2, 9), h = int(R, 2, 12), useD = R() < 0.45, exact = R() < 0.5;
  if (r === 2 && !useD) return cylVol(R, n);
  const k = cylVolPi(r, h);
  const body: Body = { kind: 'cyl', c: [0, 0, 0], r, h, role: 'second' };
  const labels = [useD ? lab(L(2 * r, u), [-r, 0, h], [r, 0, h], { inside: true, col: 'first' }) : lab(L(r, u), [0, 0, h], [r, 0, h], { inside: true, col: 'first' }), cylH(r, h, L(h, u))];
  const measures: Measure[] = useD ? [{ a: [-r, 0, h], b: [r, 0, h], key: 'dims', col: 'first' }] : [{ a: [0, 0, h], b: [r, 0, h], key: 'dims', col: 'first' }];
  const glows: Glow[] = [{ pts: Array.from({ length: 48 }, (_, i) => [r * Math.cos(i / 48 * Math.PI * 2), r * Math.sin(i / 48 * Math.PI * 2), 0] as V3), key: 'gB', col: 'link' }];
  const pic = solidsPic({ bodies: [body], labels, measures, glows }, ['solid', 'dims'], [['gB']], exact ? [`B = \\pi \\cdot ${r}^2 = ${r * r}\\pi`, `V = ${r * r}\\pi \\cdot ${h} = ${k}\\pi`] : [`V = 3.14 \\cdot ${r}^2 \\cdot ${h}`, `\\approx ${fmtT(Math.round(3.14 * k * 10) / 10)}`]);
  const sol = [useD ? `The diameter is ${2 * r} ${u}, so the radius is ${r} ${u}.` : `The radius is ${r} ${u}.`, `Every slice is the same circle: B = π × ${r}² = ${r * r}π ${sqU(u)}. V = B × h = ${r * r}π × ${h}.`, exact ? `V = ${S(`${k}π ${cuU(u)}`)}.` : `V ≈ 3.14 × ${k} = ${S(`${fmt(Math.round(3.14 * k * 10) / 10)} ${cuU(u)}`)}. Check: between 3 × ${k} = ${3 * k} and 3.2 × ${k} = ${fmt(3.2 * k)}.`];
  const prompt = `A ${A(c.what)} is a cylinder ${useD ? `${2 * r} ${u} across (diameter)` : `with a radius of ${r} ${u}`} and ${h} ${u} tall. What is its volume? ${exact ? 'Give it in terms of π: type the number in front of π.' : 'Use 3.14 for π and round to the nearest tenth.'}`;
  if (exact) return numItem({ id: `cylVol-${n}`, family: 'cylVol', unit: `π ${cuU(u)}`, board: 'V = Bh = \\,?', picture: pic, solution: sol, prompt }, k, `Yes: ${k}π ${cuU(u)}.`, [
    ...(useD ? [{ v: 4 * r * r * h, mc: MC.diameter, say: `${2 * r} ${u} is the diameter. The radius is half of it: ${r}.` }] : []),
    { v: 2 * r * h, mc: MC.circTimesH, say: `2π × ${r} × ${h} is the label around the side (the lateral area). The volume uses the base area: π r².` },
    { v: 2 * r * h * (useD ? 2 : 1) / (useD ? 2 : 1) + 0.0001 * 0, say: 'B is a circle\'s area, π r², not its distance around.' },
  ], `V = π r² h with r = ${r}.`);
  const ans = Math.round(3.14 * k * 10) / 10;
  return numItem({ id: `cylVol-${n}`, family: 'cylVol', unit: cuU(u), board: 'V = Bh = \\,?', picture: pic, solution: sol, prompt }, ans, `Yes: about ${fmt(ans)} ${cuU(u)}.`, [
    ...(useD ? [{ v: Math.round(3.14 * 4 * r * r * h * 10) / 10, mc: MC.diameter, say: `${2 * r} ${u} is the diameter. Use the radius, ${r}.` }] : []),
    { v: Math.round(3.14 * 3.14 * r * r * h * 10) / 10, mc: MC.expBeyond, say: 'Only the radius is squared: π × r × r, not (π × r)².' },
    { v: Math.round(2 * 3.14 * r * h * 10) / 10, mc: MC.circTimesH, say: 'That is the label around the side. The volume is the base area π r² times h.' },
  ], `V = 3.14 × ${r}² × ${h}.`, { tol: 0.051 });
}

// 19. cylSA: surface area from the net, choosing the parts the context needs                    [cyl-surface-area-net]
function cylSA(R: Rn, n: number): Item {
  const mode = pick(R, ['tank', 'can', 'label', 'taller', 'strip'] as const);
  const r = int(R, 2, 8), h = int(R, 3, 12), u = pick(R, ['in', 'cm', 'ft']);
  const body: Body = { kind: 'cyl', c: [0, 0, 0], r, h, role: 'second' };
  const labels = [lab(L(r, u), [0, 0, h], [r, 0, h], { inside: true, col: 'first' }), cylH(r, h, L(h, u))];
  const measures: Measure[] = [{ a: [0, 0, h], b: [r, 0, h], key: 'dims', col: 'first' }];
  const pic = (hero: string[]) => solidsPic({ bodies: [body], labels, measures }, ['solid', 'dims'], [[]], hero);
  if (mode === 'strip') {
    const ans = Math.round(3.14 * 2 * r * 10) / 10;
    return numItem({
      id: `cylSA-${n}`, family: 'cylSA', unit: u, board: '2\\pi r = \\,?', picture: pic([`2 \\cdot 3.14 \\cdot ${r}`, `\\approx ${fmtT(ans)}${tt(' ' + u)}`]),
      prompt: `A paper label wraps once around a ${A(`can with a radius of ${r} ${u}`)}. Unrolled, it is a rectangle. How long is the label? Use 3.14 for π and round to the nearest tenth.`,
      solution: ['The label goes all the way around: its length is the circle\'s circumference, 2πr.', `2 × 3.14 × ${r} ≈ ${S(`${fmt(ans)} ${u}`)}.`],
    }, ans, `Yes: about ${fmt(ans)} ${u}.`, [
      { v: 2 * r, mc: MC.aroundAcross, say: `${2 * r} ${u} is straight across the can. The label goes all the way around: 2πr.` },
      { v: r, mc: MC.aroundAcross, say: 'That is the radius. The label goes all the way around: 2πr.' },
      { v: Math.round(3.14 * r * r * 10) / 10, mc: MC.piR2Curved, say: 'π r² is the area of the lid. The label\'s length is the distance around: 2πr.' },
    ], 'The label\'s length is the distance around the can: 2 × 3.14 × r.', { tol: 0.051 });
  }
  if (mode === 'taller') {
    const d = int(R, 1, 4), k0 = 2 * r * h, k1 = 2 * r * (h + d);
    return numItem({
      id: `cylSA-${n}`, family: 'cylSA', unit: `π ${sqU(u)}`, board: '2\\pi r h = \\,?', picture: pic([`2\\pi \\cdot ${r} \\cdot ${h + d}`, `= ${k1}\\pi`]),
      prompt: `The label on a ${A(`can with a radius of ${r} ${u}`)} and ${h} ${u} tall has an area of ${k0}π ${sqU(u)}. The can is made ${d} ${u} taller, and the label still covers the whole side. What is the new label area, in terms of π?`,
      solution: [`The label is a rectangle 2π × ${r} = ${2 * r}π long and as tall as the can.`, `New: ${2 * r}π × ${h + d} = ${S(`${k1}π ${sqU(u)}`)}: the extra strip is ${2 * r}π × ${d}, not just ${d}.`],
    }, k1, `Yes: ${k1}π ${sqU(u)}.`, [
      { v: k0 + d, mc: MC.sideIncrease, say: `The label grows by a whole strip, ${2 * r}π long and ${d} ${u} tall, not by ${d}.` },
      { v: k0, say: 'The label must cover the taller side, so it grows.' },
    ], 'The label is (2πr) × height: use the new height.');
  }
  const bases = mode === 'tank' ? 2 : mode === 'can' ? 1 : 0;
  const ans = cylSurfPi(r, h, bases as 0 | 1 | 2);
  const what = mode === 'tank' ? `closed ${A('water tank')}` : mode === 'can' ? `${A('can with no lid')} (open on top)` : `${A('label')} that covers only the side of a can`;
  const parts = mode === 'tank' ? 'two circles and the side' : mode === 'can' ? 'one circle (the bottom) and the side' : 'only the side';
  return numItem({
    id: `cylSA-${n}`, family: 'cylSA', unit: `π ${sqU(u)}`, board: 'S = \\,?', picture: pic([bases ? `${bases} \\cdot ${r * r}\\pi + ${2 * r * h}\\pi` : `2\\pi \\cdot ${r} \\cdot ${h}`, `= ${ans}\\pi`]),
    prompt: `The cylinder has a radius of ${r} ${u} and is ${h} ${u} tall. How much material for a ${what}? Give it in terms of π: type the number in front of π.`,
    solution: [`The net: two circles (π × ${r}² = ${r * r}π each) and a rectangle ${2 * r}π long (around the circle) and ${h} tall (${2 * r * h}π).`, `A ${mode === 'tank' ? 'closed tank' : mode === 'can' ? 'can with no lid' : 'label'} needs ${parts}: ${S(`${ans}π ${sqU(u)}`)}.`],
  }, ans, `Yes: ${ans}π ${sqU(u)}.`, [
    ...(mode !== 'tank' ? [{ v: cylSurfPi(r, h, 2), mc: MC.ignoresContext, say: `That counts every part of the net. A ${mode === 'can' ? 'can with no lid has only one circle' : 'label covers only the side'}.` }] : []),
    { v: bases * r * r + r * r * h, mc: MC.piR2Curved, say: 'π r² is a circle. The curved side unrolls into a rectangle: 2πr long, h tall.' },
    ...(mode === 'tank' ? [{ v: cylSurfPi(r, h, 1), mc: MC.ignoresContext, say: 'A closed tank has a top and a bottom: two circles.' }] : []),
    { v: bases * r * r + r * h, say: 'The side is 2πr long, not πr.' },
  ], `Use only the parts of the net this object has: ${parts}.`);
}

// 20. missing: a missing height or base area from a volume                                        [vol-missing-dimension]
function missing(R: Rn, n: number): Item {
  const mode = pick(R, ['prism', 'pyr', 'pyrB', 'cyl'] as const);
  const u = pick(R, ['in', 'ft', 'cm']);
  if (mode === 'cyl') {
    const r = int(R, 2, 6), h = int(R, 2, 12), k = r * r * h;
    const c = pick(R, CYLS);
    return numItem({
      id: `missing-${n}`, family: 'missing', unit: c.u, board: `${k}\\pi = \\pi \\cdot ${r}^2 \\cdot h`,
      prompt: `A ${A(c.what)} holds ${k}π ${cuU(c.u)}. Its radius is ${r} ${c.u}. How tall is it?`,
      solution: [`V = π r² h: ${k}π = π × ${r * r} × h.`, `Divide by the whole base area, ${r * r}π: h = ${k}π ÷ ${r * r}π = ${S(`${h} ${c.u}`)}. The π cancels.`],
      picture: solidsPic({ bodies: [{ kind: 'cyl', c: [0, 0, 0], r, h, role: 'second' }], labels: [lab(L(r, c.u), [0, 0, h], [r, 0, h], { inside: true }), cylH(r, h, '?', { col: 'pick' })], measures: [{ a: [0, 0, h], b: [r, 0, h], key: 'dims', col: 'first' }] }, ['solid', 'dims'], [[]], [`h = ${k}\\pi \\div ${r * r}\\pi`, `= ${h}${tt(' ' + c.u)}`]),
    }, h, `Yes: ${h} ${c.u}.`, [
      { v: k / r, mc: MC.partOfBase, say: `Divide by the base area, π × ${r}², not by the radius.` },
      { v: Math.round(Math.PI * h * 100) / 100, mc: MC.keepsPi, say: `${k}π ÷ ${r * r} still has π in it. Divide by the whole base area, ${r * r}π: the π cancels.` },
      { v: Math.round(3.14 * h * 100) / 100, mc: MC.keepsPi, say: `Divide by the whole base area, ${r * r}π, so the π cancels.` },
    ], `h = V ÷ (π r²).`, { tol: 0.011 });
  }
  if (mode === 'prism') {
    const l = int(R, 2, 9), w = int(R, 2, 9), h = int(R, 2, 12), V = l * w * h;
    if (l === w) return missing(R, n);
    return numItem({
      id: `missing-${n}`, family: 'missing', unit: u, board: `${V} = ${l} \\cdot ${w} \\cdot h`,
      prompt: `A ${A('box')} has a ${l} ${u} × ${w} ${u} base and holds ${V} ${cuU(u)}. How tall is it?`,
      solution: [`V = B × h with B = ${l} × ${w} = ${l * w}.`, `h = ${V} ÷ ${l * w} = ${S(`${h} ${u}`)}.`],
      picture: solidsPic({ bodies: [{ kind: 'boxes', add: [box3(0, 0, 0, l, w, h)], role: 'first' }], labels: [lab(L(l, u), [0, 0, 0], [l, 0, 0]), lab(L(w, u), [l, 0, 0], [l, w, 0]), lab('?', [0, 0, 0], [0, 0, h], { col: 'pick' })] }, ['solid', 'dims'], [[]], [`h = ${V} \\div ${l * w}`, `= ${h}${tt(' ' + u)}`]),
    }, h, `Yes: ${h} ${u}.`, [
      { v: V / l, mc: MC.partOfBase, say: `Divide by the whole base area, ${l} × ${w}, not by one edge.` },
      { v: V / w, mc: MC.partOfBase, say: `Divide by the whole base area, ${l} × ${w}, not by one edge.` },
    ], 'h = V ÷ B, with B = length × width.');
  }
  const what = pick(R, PYRS.filter(p => PYR_U[p]!.includes(u)));
  const l = int(R, 2, 9), w = int(R, 2, 9), h = int(R, 2, 12), Bv = l * w, V = pyramidVolume(Bv, h);
  if (!Number.isInteger(V)) return missing(R, n);
  const apex: V3 = [l / 2, w / 2, h];
  const body: Body = { kind: 'pyramid', base: [[0, 0, 0], [l, 0, 0], [l, w, 0], [0, w, 0]], apex, role: 'first' };
  if (mode === 'pyrB') return numItem({
    id: `missing-${n}`, family: 'missing', unit: sqU(u), board: `${V} = \\tfrac13 \\cdot B \\cdot ${h}`,
    prompt: `A ${A(what)} is a pyramid ${h} ${u} tall that holds ${V} ${cuU(u)}. What is the area of its base?`,
    solution: [`V = ⅓ × B × h: ${V} = ⅓ × B × ${h}.`, `Undo the ⅓ by multiplying by 3, then divide by ${h}: B = 3 × ${V} ÷ ${h} = ${S(`${Bv} ${sqU(u)}`)}.`],
    picture: solidsPic({ bodies: [body], labels: [lab(L(h, u), apex, [l / 2, w / 2, 0], { col: 'pick', inside: true })], measures: [{ a: apex, b: [l / 2, w / 2, 0], key: 'dims', right: [1, 0, 0] }] }, ['solid', 'dims'], [[]], [`B = 3 \\cdot ${V} \\div ${h}`, `= ${Bv}${sqT(u)}`]),
  }, Bv, `Yes: ${Bv} ${sqU(u)}.`, [
    { v: V / h, mc: MC.dropsCoef, say: 'That forgets the ⅓. A pyramid is ⅓ × B × h: multiply by 3 first.' },
    { v: V / (3 * h), mc: MC.unitFraction, say: 'To undo × ⅓, multiply by 3. Dividing by 3 goes the wrong way.' },
  ], 'B = 3V ÷ h.');
  return numItem({
    id: `missing-${n}`, family: 'missing', unit: u, board: `${V} = \\tfrac13 \\cdot ${Bv} \\cdot h`,
    prompt: `A ${A(what)} is a pyramid with a ${l} ${u} × ${w} ${u} base. It holds ${V} ${cuU(u)}. How tall is it?`,
    solution: [`V = ⅓ × B × h with B = ${Bv}: ${V} = ⅓ × ${Bv} × h.`, `Multiply by 3, divide by ${Bv}: h = 3 × ${V} ÷ ${Bv} = ${S(`${h} ${u}`)}.`],
    picture: solidsPic({ bodies: [body], labels: [lab(L(l, u), [0, 0, 0], [l, 0, 0]), lab(L(w, u), [l, 0, 0], [l, w, 0]), lab('?', apex, [l / 2, w / 2, 0], { col: 'pick', inside: true })], measures: [{ a: apex, b: [l / 2, w / 2, 0], key: 'dims', right: [1, 0, 0] }] }, ['solid', 'dims'], [[]], [`h = 3 \\cdot ${V} \\div ${Bv}`, `= ${h}${tt(' ' + u)}`]),
  }, h, `Yes: ${h} ${u}.`, [
    { v: V / Bv, mc: MC.dropsCoef, say: 'That forgets the ⅓. Multiply by 3 first: h = 3V ÷ B.' },
    { v: V / (3 * Bv), mc: MC.unitFraction, say: 'To undo × ⅓, multiply by 3, not divide.' },
    { v: 3 * V / l, mc: MC.partOfBase, say: `Divide by the whole base area, ${Bv}, not by one edge.` },
  ], 'h = 3V ÷ B.');
}

// 21. cost: turn a measure into a purchase with a rate                                          [apply-cost-coverage]
function cost(R: Rn, n: number): Item {
  const mode = pick(R, ['paint', 'sod', 'concrete'] as const);
  if (mode === 'paint') {
    const pr = joinedPair(R, true);
    const Sx = unionSurface([pr.A, pr.B]);
    const cover = pick(R, [25, 30, 40, 50]);
    const sc = int(R, 4, 12);
    const S0 = Sx * sc;
    const cans = Math.ceil(S0 / cover - 1e-9);
    if (Number.isInteger(S0 / cover) || cans < 2) return cost(R, n);
    return numItem({
      id: `cost-${n}`, family: 'cost', unit: 'cans',
      prompt: `A set of ${A('stage blocks')} has ${S0} ft² of outside surface to paint. One can of paint covers ${B(`${cover} ft²`)}, and the store sells whole cans only. How many cans do you need?`,
      board: `${S0} \\div ${cover} = \\,?`,
      solution: [`${S0} ÷ ${cover} = ${fmt(Math.round(S0 / cover * 100) / 100)} cans.`, `You can only buy whole cans, and ${Math.floor(S0 / cover)} would not be enough, so round up: ${S(`${cans} cans`)}.`],
      picture: solidsPic({ bodies: [{ kind: 'boxes', add: [pr.A], role: 'first' }, { kind: 'boxes', add: [pr.B], role: 'first' }] }, ['solid'], [[]], [`${S0} \\div ${cover} \\approx ${fmtT(Math.round(S0 / cover * 100) / 100)}`, `\\to ${cans}${tt(' cans')}`]),
    }, cans, `Yes: ${cans} cans (${Math.floor(S0 / cover)} would leave some unpainted).`, [
      { v: Math.round(S0 / cover * 100) / 100, mc: MC.fracItems, say: 'The store sells whole cans: you cannot buy part of one. Round up.' },
      { v: Math.floor(S0 / cover), mc: MC.roundsNearest, say: `${Math.floor(S0 / cover)} cans cover only ${Math.floor(S0 / cover) * cover} ft². You need enough: round up.` },
    ], `${S0} ÷ ${cover}, then round UP to a whole can.`, { tol: 0.006 });
  }
  if (mode === 'sod') {
    const W = int(R, 8, 16), H = int(R, 6, 12), a = int(R, 2, W - 4), b = int(R, 2, H - 3);
    const A0 = W * H - a * b, p = pick(R, [0.5, 0.75, 1.25, 1.5, 2]);
    const ans = clean(A0 * p);
    return numItem({
      id: `cost-${n}`, family: 'cost', unit: 'dollars',
      prompt: `Sod for this ${A('L-shaped yard')} costs ${B(`$${p.toFixed(2)} per ft²`)}. How much does the sod cost, in dollars?`,
      board: `${A0} \\cdot ${p.toFixed(2)} = \\,?`,
      solution: [`Area: ${W} × ${H} − ${a} × ${b} = ${A0} ft².`, `Cost: ${A0} × $${p.toFixed(2)} = ${S(`$${ans.toFixed(2)}`)}.`],
      picture: planPic({ outer: lPlan(W, H, a, b), labels: [pl(L(W, 'ft'), [0, 0], [W, 0]), pl(L(H, 'ft'), [0, H], [0, 0]), pl(L(a, 'ft'), [W - a, H - b], [W, H - b], { col: 'second' }), pl(L(b, 'ft'), [W - a, H - b], [W - a, H], { col: 'second' })], pieces: [{ pts: rect(W - a, H - b, a, b), role: 'wrong', key: 'hole' }] }, ['fig', 'dims'], [['hole']], [`(${W} \\cdot ${H} - ${a} \\cdot ${b}) \\cdot ${p.toFixed(2)}`, `= ${ans.toFixed(2)}`]),
    }, ans, `Yes: $${ans.toFixed(2)}.`, [
      { v: Math.round(p / A0 * 10000) / 10000, mc: MC.unitCostDiv, say: `Each ft² costs $${p.toFixed(2)}, so ${A0} ft² cost ${A0} times as much: multiply.` },
      { v: Math.round(A0 / p * 100) / 100, mc: MC.unitCostDiv, say: `Each square foot costs $${p.toFixed(2)}: multiply the area by the price.` },
      { v: clean(W * H * p), mc: MC.enclosing, say: 'The yard has a corner missing: take it out of the area first.' },
    ], 'Area × price per square foot.', { tol: 0.006 });
  }
  const yd = pick(R, [1, 2, 3, 4]), price = pick(R, [90, 110, 120, 135, 150]);
  const V = 27 * yd;
  const dims = (() => { for (let t = 0; t < 60; t++) { const l = int(R, 3, 12), w = int(R, 2, 9); const hh = V / (l * w); if (Number.isInteger(hh) && hh >= 1 && hh <= 6) return [l, w, hh] as const; } return [9, 3, yd] as const; })();
  const [l, w, h] = dims;
  return numItem({
    id: `cost-${n}`, family: 'cost', unit: 'dollars',
    prompt: `A ${A(`concrete slab ${l} ft × ${w} ft × ${h} ft`)} is poured. Concrete costs ${B(`$${price} per cubic yard`)}, and 27 ft³ = 1 yd³. How much does the concrete cost, in dollars?`,
    board: `${V} \\div 27 \\cdot ${price}`,
    solution: [`Volume: ${l} × ${w} × ${h} = ${V} ft³.`, `In cubic yards: ${V} ÷ 27 = ${yd} yd³.`, `Cost: ${yd} × $${price} = ${S(`$${yd * price}`)}.`],
    picture: solidsPic({ bodies: [{ kind: 'boxes', add: [box3(0, 0, 0, l, w, h)], role: 'first' }], labels: [lab(L(l, 'ft'), [0, 0, 0], [l, 0, 0]), lab(L(w, 'ft'), [l, 0, 0], [l, w, 0]), lab(L(h, 'ft'), [0, 0, 0], [0, 0, h])] }, ['solid', 'dims'], [[]], [`${V} \\div 27 = ${yd}`, `${yd} \\cdot ${price} = ${yd * price}`]),
  }, yd * price, `Yes: $${yd * price}.`, [
    { v: V * price, mc: MC.unconverted, say: `${V} is in cubic feet, but the price is per cubic yard. Convert first: ${V} ÷ 27 = ${yd} yd³.` },
    { v: Math.round(V / 3 * price), say: 'A yard is 3 feet, but a cubic yard is 3 × 3 × 3 = 27 cubic feet.' },
  ], 'Volume in ft³ → ÷ 27 → yd³ → × the price.');
}

export const GENS: Record<FamilyId, Gen> = {
  split, hidden, areaAdd, areaSub, volAdd, volSub, prismBh, tent, third, pyrVol, twoWays,
  classify, faces, joinSA, partialSA, cutJoin, which, cylVol, cylSA, missing, cost,
};
