// items.ts: practice families for "area and perimeter of composite figures" (grade 7, 7.G.B.4 / 7.G.B.6).
// Each family is one deep structure; a generator gets the sub-goal id and uses that sub-goal's cases (topic JSON).
// Every wrong answer the classifier recognises carries its misconception id (math-curriculum-essentials).
// Pure: no DOM, no canvas. The picture (FigPicture) is drawn by the page with the PlanFigure block; every number on
// it comes from figMaths.ts. PROBES records, per item, typical wrong responses and the id they must get (tests).
import { type Gen, type Item, type Response, type Verdict, A, B, S, int, pick, shuffle } from '../../runtime/item';
import {
  type Fig, type PN, type Piece, approx, circleOnly, cornerCut, edgeNotch, fmt, lShape, pn, pnAdd, pnEq, pnTex, pnText, pnVal,
  quarterOnly, rectHole, rectQuarter, rectSemi, ring, rotFig, semiOnly, squareInscribed, track, trapSemi, triSemi,
} from './figMaths';
import type { DimShow } from './PlanFigure';

export type FamilyId =
  | 'shown' | 'measure' | 'inventory' | 'arcVs' | 'arcEst' | 'exact' | 'readPi' | 'partArea' | 'arcLen' | 'infer'
  | 'combine' | 'likeTerms' | 'areaAdd' | 'perimAdd' | 'cutArea' | 'cutPick' | 'notch' | 'round' | 'approx' | 'hole'
  | 'critique' | 'counter' | 'which' | 'job';
export const FAMILY_NAMES: Record<FamilyId, string> = {
  shown: 'What does the teal show?',
  measure: 'Perimeter or area?',
  inventory: 'Which lengths go around?',
  arcVs: 'Curved or straight?',
  arcEst: 'Estimate a curved edge',
  exact: 'Exactly, with π',
  readPi: 'What does kπ mean?',
  partArea: 'Half and quarter circles',
  arcLen: 'Curved edges',
  infer: 'The missing length',
  combine: 'Combine the π terms',
  likeTerms: 'As simple as possible',
  areaAdd: 'Add the areas',
  perimAdd: 'Walk the edge',
  cutArea: 'Cut it out',
  cutPick: 'Which expression is left?',
  notch: 'A notch and the perimeter',
  round: 'Exact, then round',
  approx: 'Equals or about?',
  hole: 'A hole in the middle',
  critique: 'Spot the slip',
  counter: 'Up, down, or the same?',
  which: 'What does the job need?',
  job: 'How much for the job?',
};

/** what the page draws for an item: the PlanFigure's parameters, what the question shows, and the worked solution */
export interface FigPicture {
  kind: 'fig';
  fig: Fig; unit: string; dims: DimShow[]; seam?: 'dashed' | 'solid' | 'none';
  /** a fixed candidate trace (teal) the question asks about */ cand?: string[];
  /** the region is shaded (the area) */ shade?: boolean;
  /** the figure is shown BEFORE the cut (the removed part sits in place, ringed) */ before?: boolean;
  /** what the worked solution animates, in order */ solve: ('parts' | 'trace' | 'holes' | 'cut' | 'shade' | 'seam')[];
  /** the solution's lines on the board (TeX) */ hero: string[];
}

export const PROBES = new WeakMap<Item, { r: Response; mc: string }[]>();
const probe = (it: Item, r: Response, mc: string) => { const l = PROBES.get(it) ?? []; l.push({ r, mc }); PROBES.set(it, l); };

export const MC = {
  omitsCurve: 'mc.area-perimeter.omits-curved-edges-from-perimeter',
  sameAttr: 'mc.area-perimeter.thinks-area-and-perimeter-are-the-same-attribute',
  sizeWord: 'mc.area-perimeter.size-word-selects-area',
  unitDim: 'mc.measurement-units.wrong-unit-dimension',
  seam: 'mc.area-perimeter.includes-inside-segments-in-perimeter',
  cutShrinks: 'mc.area-perimeter.cutting-out-shrinks-perimeter',
  arcLonger: 'mc.circles.arc-always-longer',
  arcAddsStraight: 'mc.circles.arc-length-adds-straight-edges',
  aroundAsAcross: 'mc.circles.distance-around-as-across',
  piMultiply: 'mc.circles.pi-must-be-multiplied-out',
  piSum: 'mc.circles.pi-coefficient-read-as-sum',
  halvesRadius: 'mc.circles.part-circle-halves-radius',
  skipsDiameter: 'mc.area-perimeter.skips-part-of-curved-boundary',
  areaPerim: 'mc.area-perimeter.confuses-area-with-perimeter',
  diamForRad: 'mc.circles.diameter-for-radius',
  unlike: 'mc.expressions.combines-unlike-terms',
  multiplies: 'mc.expressions.multiplies-when-adding-like-terms',
  fullCircle: 'mc.circles.full-circle-for-part',
  bothPerims: 'mc.area-perimeter.adds-full-perimeters-of-joined-parts',
  addsCutout: 'mc.area-perimeter.adds-cutout-area',
  lengthsInArea: 'mc.area-perimeter.mixes-lengths-into-area-sums',
  ringRadii: 'mc.circles.ring-area-subtract-radii-first',
  oneRadius: 'mc.area-perimeter.removes-only-one-radius-at-corner-cut',
  earlyRound: 'mc.decimals.intermediate-precision-always-invalid',
  roundedExact: 'mc.estimation.rounded-value-treated-as-exact',
  noCoverCheck: 'mc.area-perimeter.omits-required-decomposition-coverage-check',
  sharedOnce: 'mc.area-perimeter.removes-shared-part-only-once',
  together: 'mc.area-perimeter.area-and-perimeter-change-together',
  ignoresContext: 'mc.area-perimeter.ignores-context-on-which-surfaces-count',
  fixedBoundary: 'mc.area-perimeter.fixed-boundary-set-regardless-of-context',
} as const;

// =========================================================================================== answer machinery
interface Opt { t: string; ok?: boolean; say: string; mc?: string }
function choiceItem(base: Omit<Item, 'input' | 'choices' | 'answer' | 'check'>, R: () => number, opts: Opt[]): Item {
  const seen = new Set<string>();
  const o = shuffle(R, opts.filter(x => (seen.has(x.t) ? false : (seen.add(x.t), true))));
  const right = o.findIndex(x => x.ok);
  const it: Item = {
    ...base, input: 'choice', choices: o.map(x => x.t), answer: { kind: 'choice', i: right },
    check: r => {
      if (r.kind !== 'choice' || !o[r.i]) return { ok: false, say: 'Pick one answer.' };
      const x = o[r.i]!;
      return { ok: r.i === right, mc: r.i === right ? undefined : x.mc, say: x.say };
    },
  };
  o.forEach((x, i) => { if (!x.ok && x.mc) probe(it, { kind: 'choice', i }, x.mc); });
  return it;
}
interface NumWrong { v: number; mc?: string; say: string; tol?: number }
function numItem(base: Omit<Item, 'input' | 'answer' | 'check'>, right: number, okSay: string, wrongs: NumWrong[], fallback: string): Item {
  const ws: NumWrong[] = [];
  for (const w of wrongs) if (Number.isFinite(w.v) && Math.abs(w.v - right) > 1e-6 && !ws.some(x => Math.abs(x.v - w.v) < 1e-6)) ws.push(w);
  const it: Item = {
    ...base, input: 'num', answer: { kind: 'num', v: right },
    check: r => {
      if (r.kind !== 'num' || !Number.isFinite(r.v)) return { ok: false, say: 'Type a number.' };
      if (Math.abs(r.v - right) < 1e-6) return { ok: true, say: okSay };
      for (const w of ws) if (Math.abs(r.v - w.v) < (w.tol ?? 1e-6)) return { ok: false, mc: w.mc, say: w.say };
      return { ok: false, say: fallback };
    },
  };
  for (const w of ws) if (w.mc && !ws.some(x => x !== w && Math.abs(x.v - w.v) < Math.max(x.tol ?? 0, w.tol ?? 0))) probe(it, { kind: 'num', v: w.v }, w.mc);
  return it;
}
interface PairWrong { v: [number, number]; mc?: string; say: string }
function pairItem(base: Omit<Item, 'input' | 'answer' | 'check'>, right: [number, number], okSay: string, wrongs: PairWrong[], fallback: string): Item {
  const same = (p: [number, number], q: [number, number]) => Math.abs(p[0] - q[0]) < 1e-6 && Math.abs(p[1] - q[1]) < 1e-6;
  const ws: PairWrong[] = [];
  for (const w of wrongs) if (w.v.every(Number.isFinite) && !same(w.v, right) && !ws.some(x => same(x.v, w.v))) ws.push(w);
  const it: Item = {
    ...base, input: 'pair', answer: { kind: 'pair', x: right[0], y: right[1] },
    check: r => {
      if (r.kind !== 'pair' || !Number.isFinite(r.x) || !Number.isFinite(r.y)) return { ok: false, say: 'Type a number in both boxes (0 if there is none).' };
      if (same([r.x, r.y], right)) return { ok: true, say: okSay };
      for (const w of ws) if (same([r.x, r.y], w.v)) return { ok: false, mc: w.mc, say: w.say };
      return { ok: false, say: fallback };
    },
  };
  for (const w of ws) if (w.mc) probe(it, { kind: 'pair', x: w.v[0], y: w.v[1] }, w.mc);
  return it;
}
const pairOf = (x: PN): [number, number] => [x.a, x.b];

// =========================================================================================== words and TeX
const u2 = (u: string) => `${u}²`;
const uT = (u: string) => `\\ \\text{${u}}`, u2T = (u: string) => `\\ \\text{${u}}^2`;
const PI = 'π';
const piW = (b: number) => (b === 1 ? PI : `${fmt(b)}${PI}`);
/** a piece's length as the kid writes it in a perimeter sum: 12, or ½ · 8π for a half circle of diameter 8 */
function pieceTex(p: Piece): string { return pnTex(p.len); }
/** P = (each piece once) = a + bπ */
function perimHero(F: Fig, which: 'all' | 'outer' = 'all'): string[] {
  // long sums go on two lines (the board is narrow)
  const L = (which === 'all' ? [...F.outer, ...F.holes.flat()] : F.outer).map(pieceTex);
  const tot = which === 'all' ? F.perimeter : F.outerPerimeter;
  const head = L.length > 4 ? [`P = ${L.slice(0, 4).join(' + ')}`, `+ ${L.slice(4).join(' + ')}`] : [`P = ${L.join(' + ')}`];
  return [...head, `\\cssId{s}{= ${pnTex(tot)}}`];
}
function areaHero(F: Fig): string[] {
  // two half circles of the same size make one whole circle (a track)
  let parts = F.parts.map(p => ({ sign: p.sign, tex: p.areaTex }));
  const semis = F.parts.filter(p => p.kind === 'semi' && p.sign > 0);
  if (semis.length === 2 && semis[0]!.r === semis[1]!.r) parts = [...F.parts.filter(p => p.kind !== 'semi').map(p => ({ sign: p.sign, tex: p.areaTex })), { sign: 1 as const, tex: `\\pi \\cdot ${fmt(semis[0]!.r!)}^2` }];
  const t = parts.map((p, i) => `${i === 0 ? (p.sign < 0 ? '-' : '') : p.sign < 0 ? '- ' : '+ '}${p.tex}`);
  const head = t.length > 2 ? [`A = ${t[0]} ${t[1]}`, t.slice(2).join(' ')] : [`A = ${t.join(' ')}`];
  return [...head, `\\cssId{s}{= ${pnTex(F.area)}}`];
}
const sayPN = (x: PN, u: string) => `${pnText(x)} ${u}`;

// =========================================================================================== contexts (US units, no money)
const UNITS_FT = ['ft', 'ft', 'ft', 'yd', 'm'];
const SEMI_SKINS = ['patio with a rounded end', 'garden bed with a rounded end', 'stage with a rounded front', 'rug with one round end', 'pool with a rounded end', 'deck with a rounded end'];
const TRACK_SKINS = ['flower bed shaped like a running track', 'rug shaped like a running track', 'pool with two round ends', 'table with two round ends', 'lawn with two round ends'];
const QUARTER_SKINS = ['room with a quarter-circle bay', 'deck with a quarter-circle corner', 'garden with a quarter-circle bed'];
const HOLE_SKINS = [
  { what: 'deck', hole: 'a round hole for a tree' }, { what: 'table top', hole: 'a round hole for an umbrella' },
  { what: 'lawn', hole: 'a round pond' }, { what: 'sheet of plywood', hole: 'a round hole for a pipe' }, { what: 'patio', hole: 'a round fire pit' },
];
const NOTCH_SKINS = ['craft table top', 'stage', 'counter top', 'board', 'desk top'];
const CORNER_SKINS = ['counter top', 'garden lot', 'board', 'desk top', 'lawn'];
const name = (R: () => number) => pick(R, ['Dana', 'Luis', 'Priya', 'Sam', 'Nia', 'Marco', 'Aiden', 'Lena']);

// figure makers (number ranges the picture can draw; tests lay every item out)
function mkRectSemi(R: () => number, opts: { even?: boolean } = {}) {
  const h = 2 * int(R, 2, 5), w = int(R, Math.max(h, 6), 14);
  void opts;
  return { w, h, r: h / 2, F: rectSemi(w, h) };
}
function mkTrack(R: () => number) { const h = 2 * int(R, 2, 4), w = int(R, h + 2, 14); return { w, h, r: h / 2, F: track(w, h) }; }
function mkRectQuarter(R: () => number) { const h = int(R, 4, 9), w = int(R, h, 13); return { w, h, r: h, F: rectQuarter(w, h) }; }
const TRIPLES: [number, number, number][] = [[3, 4, 5], [4, 3, 5], [6, 8, 10], [5, 12, 13], [8, 6, 10], [9, 12, 15], [8, 15, 17], [12, 9, 15]];
function mkTriSemi(R: () => number) {
  for (;;) {
    const [hb, t, leg] = pick(R, TRIPLES);
    if (t >= hb * 0.9 && t <= hb * 2.6) return { b: 2 * hb, t, leg, r: hb, F: triSemi(2 * hb, t, leg) };
  }
}
function mkTrapSemi(R: () => number) {
  const [o, t, leg] = pick(R, [[3, 4, 5], [4, 3, 5], [6, 8, 10], [5, 12, 13]] as [number, number, number][]);
  const b2 = 2 * int(R, 2, 5), b1 = b2 + 2 * o;
  return { b1, b2, t, leg, r: b2 / 2, F: trapSemi(b1, b2, t, leg) };
}
function mkHole(R: () => number) {
  const w = int(R, 10, 16), h = int(R, 7, Math.min(10, w - 2)), d = 2 * int(R, 1, Math.min(3, Math.floor((h - 2) / 2)));
  const r = d / 2;
  const cx = int(R, Math.ceil(r + 2), Math.floor(w - r - 2)), cy = h / 2;
  return { w, h, r, d, cx, cy, F: rectHole(w, h, r, cx, cy) };
}
function mkNotch(R: () => number) {
  const w = int(R, 9, 15), h = int(R, 5, 9), r = int(R, 1, Math.min(3, Math.floor((h - 1) / 2), Math.floor((w - 4) / 2)));
  return { w, h, r, F: edgeNotch(w, h, r) };
}
function mkCorner(R: () => number) {
  const w = int(R, 8, 14), h = int(R, 6, 10), r = int(R, 2, Math.min(5, h - 2, w - 4));
  return { w, h, r, F: cornerCut(w, h, r) };
}

// =========================================================================================== 1. shown   [s1-region-vs-boundary, s1-seam-exclusion, s1-hole-boundary]
const genShown: Gen = (R, n, sg) => {
  const hole = sg === 's1-hole-boundary' || (sg === undefined && R() < 0.25);
  if (hole) {
    const m = mkHole(R), withSeam = R() < 0.5;
    const F = withSeam ? rectHole(m.w, m.h, m.r, m.cx, m.cy, m.cx - m.r - 1 > 1 ? Math.max(1, Math.floor((m.cx - m.r) / 2)) : Math.min(m.w - 1, Math.ceil((m.cx + m.r + m.w) / 2))) : m.F;
    const v = pick(R, withSeam ? ['all', 'outer', 'seam'] as const : ['all', 'outer'] as const);
    const outerIds = F.outer.map(p => p.id);
    const cand = v === 'outer' ? outerIds : v === 'all' ? [...outerIds, 'hole'] : [...outerIds, 'hole', 'seam'];
    const sk = pick(R, HOLE_SKINS);
    const opts: Opt[] = [
      { t: 'The perimeter: the outside edge and the hole’s edge', ok: v === 'all', say: v === 'all' ? 'Yes. The hole’s edge is an edge of the surface too, so the perimeter goes around it as well.' : v === 'outer' ? 'Look at the hole: no teal goes around it. This is only the outside edge.' : 'The teal also runs along the dashed seam, and a seam is inside the surface: not an edge.', mc: v === 'seam' ? MC.seam : undefined },
      { t: 'The outer perimeter: the outside edge only', ok: v === 'outer', say: v === 'outer' ? 'Yes: only the outside edge. The perimeter would also go around the hole.' : 'The teal goes around the hole too. The hole’s edge is part of the boundary: that makes it the whole perimeter, not the outer one.', mc: v === 'all' ? MC.cutShrinks : undefined },
      { t: 'Not a perimeter: it runs along a seam inside', ok: v === 'seam', say: v === 'seam' ? 'Yes. The dashed seam is inside the surface. No edge of the surface runs there.' : 'No teal runs along the seam here.' },
      { t: 'The area: the surface itself', say: 'A line is a length, not a surface. The area would be the whole surface shaded.', mc: MC.sameAttr },
    ];
    const pic: FigPicture = { kind: 'fig', fig: F, unit: '', dims: [], seam: 'dashed', cand, solve: ['trace', 'holes'], hero: ['P = \\text{outside} + \\text{hole}', '\\text{outer } P = \\text{outside}'] };
    return choiceItem({ id: `shown-h-${n}`, family: 'shown', prompt: `A ${sk.what} with ${sk.hole}${withSeam ? ' (the dashed line is a seam between two sections)' : ''}. What does the ${B('teal line')} show?`, board: '\\text{teal} = \\,?', picture: pic as never, solution: ['The perimeter is every edge of the surface: the outside edge and the edge around the hole.', 'The outer perimeter is the outside edge only.', 'A seam is inside the surface, so it is never part of either.'] }, R, opts);
  }
  const seamCase = sg === 's1-seam-exclusion';
  const tpl = seamCase ? pick(R, ['semi', 'semiPart', 'track'] as const) : pick(R, ['semi', 'quarter', 'tri', 'semi'] as const);
  let F: Fig;
  if (tpl === 'semi') F = mkRectSemi(R).F;
  else if (tpl === 'semiPart') { const h = 2 * int(R, 4, 5), w = int(R, h, 14); F = rectSemi(w, h, h - 4); }
  else if (tpl === 'track') F = mkTrack(R).F;
  else if (tpl === 'quarter') F = mkRectQuarter(R).F;
  else F = mkTriSemi(R).F;
  if (!seamCase) F = rotFig(F, int(R, 0, 3));
  const v = pick(R, seamCase ? ['all', 'seam', 'seam', 'noArc'] as const : ['all', 'noArc', 'area', 'all'] as const);
  const all = F.outer.map(p => p.id), straight = F.outer.filter(p => p.kind === 'seg').map(p => p.id);
  const cand = v === 'all' ? all : v === 'noArc' ? straight : v === 'seam' ? [...all, 'seam'] : undefined;
  const opts: Opt[] = [
    { t: 'The perimeter: all of the edge', ok: v === 'all', say: v === 'all' ? 'Yes. The teal goes all the way around, curved edge included, and never inside.' : v === 'noArc' ? 'The curved edge is part of the edge too. Walking around the figure, you walk along the curve.' : v === 'seam' ? 'The teal also runs along the seam, and the seam is inside the figure: walking around the edge you never step on it.' : 'The colour covers the surface: that is the area. The perimeter is only the edge around it.', mc: v === 'noArc' ? MC.omitsCurve : v === 'seam' ? MC.seam : v === 'area' ? MC.sameAttr : undefined },
    { t: 'Not the perimeter: a curved edge is missing', ok: v === 'noArc', say: v === 'noArc' ? 'Yes. The straight edges are traced, but the curved edge is part of the boundary too.' : 'Follow the teal: it goes along the curved edge too.' },
    { t: 'Not the perimeter: it runs along a seam inside', ok: v === 'seam', say: v === 'seam' ? 'Yes. The seam is where the parts meet, inside the figure. It is not an edge.' : 'No teal runs along the seam inside here.' },
    { t: 'The area: the surface it covers', ok: v === 'area', say: v === 'area' ? 'Yes. The whole surface is shaded: that is what the area measures.' : 'A line around the edge is a length: that is a perimeter, not an area.', mc: v === 'area' ? undefined : MC.sameAttr },
  ];
  const pic: FigPicture = { kind: 'fig', fig: F, unit: '', dims: [], seam: seamCase ? pick(R, ['dashed', 'solid', 'none'] as const) : 'dashed', cand, shade: v === 'area', solve: v === 'area' ? ['shade'] : ['seam', 'trace'], hero: v === 'area' ? ['\\text{the area}'] : ['\\text{every edge, once}'] };
  return choiceItem({ id: `shown-${n}`, family: 'shown', prompt: v === 'area' ? `What does the ${A('shading')} show?` : `What does the ${B('teal line')} show?`, board: v === 'area' ? '\\text{shading} = \\,?' : '\\text{teal} = \\,?', picture: pic as never, solution: ['The perimeter walks the boundary once: every straight edge and every curved edge.', 'A seam, where two parts meet, is inside the figure, so it is not part of the perimeter.', 'The area is the surface inside, measured in square units.'] }, R, opts);
};

// =========================================================================================== 2. measure   [s1-context-measure-unit]
const PERIM_JOBS = [
  { job: 'fencing to go around', obj: 'garden', u: ['ft', 'yd', 'm'] }, { job: 'edging to go around', obj: 'patio', u: ['ft', 'm'] },
  { job: 'trim to go around the edge of', obj: 'window', u: ['in', 'cm'] }, { job: 'ribbon to go around the edge of', obj: 'tablecloth', u: ['in', 'cm'] },
  { job: 'string lights to run along the edge of', obj: 'deck', u: ['ft', 'm'] }, { job: 'a rubber bumper to go around', obj: 'table top', u: ['in', 'cm'] },
  { job: 'binding tape to go around', obj: 'rug', u: ['ft', 'in'] }, { job: 'a railing to go around', obj: 'deck', u: ['ft', 'm'] },
];
const AREA_JOBS = [
  { job: 'mulch to cover', obj: 'garden', u: ['ft', 'yd', 'm'] }, { job: 'paint to cover', obj: 'stage floor', u: ['ft', 'm'] },
  { job: 'carpet to cover', obj: 'floor', u: ['ft', 'yd'] }, { job: 'sod to cover', obj: 'lawn', u: ['ft', 'yd', 'm'] },
  { job: 'tiles to cover', obj: 'patio', u: ['ft', 'm'] }, { job: 'fabric for', obj: 'tablecloth', u: ['in', 'cm'] },
  { job: 'glass for', obj: 'window', u: ['in', 'cm'] }, { job: 'stain to cover', obj: 'deck', u: ['ft', 'm'] },
];
const genMeasure: Gen = (R, n) => {
  const perim = R() < 0.5;
  const c = pick(R, perim ? PERIM_JOBS : AREA_JOBS), u = pick(R, c.u);
  const size = perim && R() < 0.5 ? pick(R, ['huge', 'really big', 'large']) : '';
  const F = pick(R, [() => mkRectSemi(R).F, () => mkTrack(R).F, () => mkRectQuarter(R).F, () => rotFig(mkRectSemi(R).F, 1)])();
  const right = perim ? 0 : 2;
  const ch: Opt[] = [
    { t: `Perimeter, in ${u}`, ok: right === 0, say: right === 0 ? `Yes. It goes around the edge: a length, in ${u}.` : `${cap(c.job)} the ${c.obj} covers the surface: that is the area.`, mc: right === 0 ? undefined : MC.areaPerim },
    { t: `Perimeter, in ${u2(u)}`, say: right === 0 ? `It is the perimeter, but a perimeter is a length: ${u}, not ${u2(u)}.` : 'Covering a surface is area, and area is in square units.', mc: right === 0 ? MC.unitDim : MC.areaPerim },
    { t: `Area, in ${u2(u)}`, ok: right === 2, say: right === 2 ? `Yes. It covers the surface: an area, in square units, ${u2(u)}.` : size ? `“${size}” is about the ${c.obj}, but the job only runs along its edge: a perimeter.` : `It only goes along the edge: that is a perimeter, a length.`, mc: right === 2 ? undefined : size ? MC.sizeWord : MC.areaPerim },
    { t: `Area, in ${u}`, say: right === 2 ? `It is the area, but area is counted in squares: ${u2(u)}, not ${u}.` : 'Going around the edge is a perimeter, in plain units.', mc: right === 2 ? MC.unitDim : MC.areaPerim },
  ];
  const pic: FigPicture = { kind: 'fig', fig: F, unit: u, dims: [], solve: perim ? ['trace'] : ['shade'], hero: [perim ? `\\text{perimeter, in ${u}}` : `\\text{area, in ${u}}^2`] };
  const prompt = `${size ? `The ${c.obj} is ${size}. ` : ''}You need ${c.job} this ${c.obj}. What do you measure, and in which unit?`;
  return choiceItem({ id: `measure-${n}`, family: 'measure', prompt, board: '\\text{perimeter or area?}', picture: pic as never, solution: ['Around the edge (fence, edging, trim, ribbon, railing): the perimeter, a length in ft, in, yd or m.', 'Covering the surface (mulch, paint, carpet, tiles, glass): the area, in square units such as ft².'] }, R, ch);
};
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// =========================================================================================== 3. inventory   [s1-seam-exclusion, s1-hole-boundary, s3-parts-inventory-justification]
const genInventory: Gen = (R, n, sg) => {
  const u = pick(R, UNITS_FT);
  const hole = sg === 's1-hole-boundary' ? true : sg === 's1-seam-exclusion' ? false : R() < 0.25;
  if (hole) {
    const m = mkHole(R), outer = R() < 0.4;
    const base = `${m.w} + ${m.h} + ${m.w} + ${m.h}`;
    const opts: Opt[] = [
      { t: base, ok: outer, say: outer ? 'Yes: the outer perimeter is only the outside edge.' : 'That leaves out the edge around the hole, and the hole’s edge is part of the boundary.', mc: outer ? undefined : MC.cutShrinks },
      { t: `${base} + the hole’s edge`, ok: !outer, say: !outer ? 'Yes. The hole’s edge belongs to the boundary too, so the perimeter goes around it.' : 'The OUTER perimeter is asked: only the outside edge, not the hole.', mc: outer ? MC.fixedBoundary : undefined },
      { t: `${base} − the hole’s edge`, say: 'Cutting a hole takes away area, not edge: the hole adds a new edge around it.', mc: MC.cutShrinks },
      { t: `${m.w} + ${m.h} + the hole’s edge`, say: 'Walk all the way around the outside: that is four sides.' },
    ];
    const pic: FigPicture = { kind: 'fig', fig: m.F, unit: u, dims: [{ id: 'w' }, { id: 'h' }, { id: 'd' }], solve: outer ? ['trace'] : ['trace', 'holes'], hero: perimHero(m.F, outer ? 'outer' : 'all') };
    return choiceItem({ id: `inv-h-${n}`, family: 'inventory', prompt: `This ${pick(R, HOLE_SKINS).what} has a round hole cut through it. Which sum gives its ${outer ? S('outer perimeter') : S('perimeter')} (in ${u})?`, board: outer ? '\\text{outer } P = \\,?' : 'P = \\,?', picture: pic as never, solution: ['The perimeter is every edge of the surface, the hole’s edge too.', 'The outer perimeter is the outside edge only.'] }, R, opts);
  }
  const tpl = pick(R, ['semi', 'semiPart', 'track', 'quarter'] as const);
  let F: Fig, right: string[], seamLen: number, dims: DimShow[], curves = 'the curve';
  if (tpl === 'semi') { const m = mkRectSemi(R); F = m.F; right = [`${m.w}`, curves, `${m.w}`, `${m.h}`]; seamLen = m.h; dims = [{ id: 'w' }, { id: 'h' }]; }
  else if (tpl === 'semiPart') {
    const h = 2 * int(R, 4, 5), g = 2, w = int(R, h, 14), d = h - 2 * g;
    F = rectSemi(w, h, d); right = [`${w}`, `${g}`, curves, `${g}`, `${w}`, `${h}`]; seamLen = d; dims = [{ id: 'w' }, { id: 'h' }, { id: 'gapLow' }, { id: 'gapHigh' }];
  } else if (tpl === 'track') { const m = mkTrack(R); F = m.F; curves = 'the two curves'; right = [`${m.w}`, `${m.w}`, curves]; seamLen = m.h; dims = [{ id: 'w' }, { id: 'h' }]; }
  else { const m = mkRectQuarter(R); F = m.F; right = [`${m.w}`, `${m.h}`, curves, `${m.w}`, `${m.h}`]; seamLen = m.h; dims = [{ id: 'w' }, { id: 'h' }, { id: 'base2' }]; }
  const seams = tpl === 'track' ? 2 : 1;
  const plus = (k: number) => [...right, ...Array.from({ length: k * seams }, () => `${seamLen}`)];
  const noCurve = right.filter(x => x !== curves);
  const opts: Opt[] = [
    { t: right.join(' + '), ok: true, say: 'Yes. Every outside edge once, the curve included, and no seam.' },
    { t: plus(1).join(' + '), say: `The ${seamLen} ${u} seam${seams > 1 ? 's are' : ' is'} inside the figure, where the parts meet. Walking around the edge you never step on ${seams > 1 ? 'them' : 'it'}.`, mc: MC.seam },
    { t: plus(2).join(' + '), say: 'That adds the whole perimeter of each part, so the seam is in there twice. A seam is not on the edge at all.', mc: MC.bothPerims },
    { t: noCurve.join(' + '), say: `The curved edge is part of the boundary: it has to be in the sum.`, mc: MC.omitsCurve },
  ];
  const seam = sg === 's1-seam-exclusion' ? pick(R, ['dashed', 'solid', 'none'] as const) : 'dashed';
  const pic: FigPicture = { kind: 'fig', fig: F, unit: u, dims, seam, solve: ['parts', 'trace'], hero: perimHero(F) };
  return choiceItem({ id: `inv-${n}`, family: 'inventory', prompt: `Which sum is the ${S('perimeter')} of this ${pick(R, tpl === 'track' ? TRACK_SKINS : tpl === 'quarter' ? QUARTER_SKINS : SEMI_SKINS)} (in ${u})?`, board: 'P = \\,?', picture: pic as never, solution: ['Walk around the edge once and list every piece you walk along: each straight edge and each curve, once.', 'The seam where two parts are joined is inside the figure: it is not in the list.'] }, R, opts);
};

// =========================================================================================== 4. arcVs   [s1-arc-part-of-circumference]
const genArcVs: Gen = (R, n) => {
  const u = pick(R, UNITS_FT), r = int(R, 2, 9);
  const v = pick(R, ['semi', 'quarter2', 'quarter1', 'frac', 'frac'] as const);
  if (v === 'frac') {
    const tpl = pick(R, ['semi', 'quarter', 'rectSemi', 'rectQuarter'] as const);
    const F = tpl === 'semi' ? semiOnly(r) : tpl === 'quarter' ? quarterOnly(r) : tpl === 'rectSemi' ? mkRectSemi(R).F : mkRectQuarter(R).F;
    const half = tpl === 'semi' || tpl === 'rectSemi';
    const opts: Opt[] = [
      { t: '½ of it', ok: half, say: half ? 'Yes: a half circle’s curved edge is half of the whole circle’s circumference.' : 'This curve is a quarter of a circle: four of them make the whole circle.' },
      { t: '¼ of it', ok: !half, say: !half ? 'Yes: a quarter circle’s curved edge is a quarter of the circumference.' : 'Two of these curves make a whole circle: it is a half.' },
      { t: '¾ of it', say: 'Count how many of these curves fit around a whole circle.' },
      { t: 'All of it', say: 'Only part of a circle is drawn, so the curved edge is only part of the circumference.', mc: MC.fullCircle },
    ];
    const arcId = F.outer.find(p => p.kind === 'arc')!.id;
    const pic: FigPicture = { kind: 'fig', fig: F, unit: u, dims: [], cand: [arcId], solve: ['trace'], hero: [half ? '\\text{curve} = \\tfrac12\\,\\pi d' : '\\text{curve} = \\tfrac14\\,\\pi d'] };
    return choiceItem({ id: `arcvs-f-${n}`, family: 'arcVs', prompt: `The ${B('curved edge')} is what part of the whole circle’s circumference?`, board: '\\text{curve} = \\,?\\ \\text{of}\\ \\pi d', picture: pic as never, solution: ['A half circle is half of a circle, so its curved edge is ½ of the circumference πd.', 'A quarter circle’s curved edge is ¼ of πd.'] }, R, opts);
  }
  const semi = v === 'semi';
  const F = semi ? semiOnly(r) : quarterOnly(r);
  const arcLonger = v !== 'quarter2';
  const straightName = semi ? 'the straight edge (the diameter)' : v === 'quarter2' ? 'the two straight edges together' : 'one straight edge';
  const arcV = semi ? Math.PI * r : (Math.PI * r) / 2, stV = semi ? 2 * r : v === 'quarter2' ? 2 * r : r;
  const opts: Opt[] = [
    { t: 'The curved edge', ok: arcLonger, say: arcLonger ? `Yes: the curve is about ${Math.round(arcV * 10) / 10} ${u}, the straight path ${stV} ${u}.` : `Here the straight path wins: the two radii make ${2 * r} ${u}, the quarter curve only about ${Math.round(arcV * 10) / 10} ${u}. A curve is not always longer.`, mc: arcLonger ? undefined : MC.arcLonger },
    { t: semi ? 'The diameter' : v === 'quarter2' ? 'The two straight edges' : 'The straight edge', ok: !arcLonger, say: !arcLonger ? `Yes: 2 × ${r} = ${2 * r} ${u}, while the quarter curve is about ${Math.round(arcV * 10) / 10} ${u}.` : `The curve bends out, so it is longer: about ${Math.round(arcV * 10) / 10} ${u} against ${stV} ${u}.` },
    { t: 'They are the same length', say: `The distance around and the distance across are different: the curve is about ${Math.round(arcV * 10) / 10} ${u}, the straight path ${stV} ${u}.`, mc: MC.aroundAsAcross },
  ];
  const arcId = 'arc';
  const cand = semi ? ['arc', 'diam'] : v === 'quarter2' ? ['arc', 'base', 'side'] : ['arc', 'base'];
  const pic: FigPicture = { kind: 'fig', fig: F, unit: u, dims: semi ? [{ id: 'diam' }] : [{ id: 'base' }], cand, solve: ['trace'], hero: [semi ? `\\tfrac12\\cdot ${2 * r}\\pi \\approx ${Math.round(arcV * 10) / 10}` : `\\tfrac14\\cdot ${2 * r}\\pi \\approx ${Math.round(arcV * 10) / 10}`] };
  void arcId;
  return choiceItem({ id: `arcvs-${n}`, family: 'arcVs', prompt: `Which is longer: the ${B('curved edge')} or ${straightName}?`, board: '\\text{curve} \\ \\text{or} \\ \\text{straight?}', picture: pic as never, solution: [`The curve is ${semi ? 'half' : 'a quarter'} of a circle of diameter ${2 * r}: about ${semi ? '½' : '¼'} × 3.14 × ${2 * r} ≈ ${Math.round(arcV * 10) / 10} ${u}.`, `The straight path is ${stV} ${u}.`, 'A curve is longer than the straight line between its ends, but a quarter curve is shorter than the two radii that go round the corner.'] }, R, opts);
};

// =========================================================================================== 5. arcEst   [s1-arc-part-of-circumference]
const ARC_SKINS_SEMI = ['a half-circle rug', 'a half-circle garden bed', 'a half-circle stage', 'a half-circle window', 'a half-circle table top'];
const ARC_SKINS_QUARTER = ['a quarter-circle flower bed', 'a quarter-circle corner shelf', 'a quarter-circle patio', 'a quarter-circle lawn'];
const genArcEst: Gen = (R, n) => {
  const u = pick(R, UNITS_FT), semi = R() < 0.55;
  const r = semi ? int(R, 2, 12) : 2 * int(R, 1, 6);
  const d = 2 * r;
  const F = semi ? semiOnly(r) : quarterOnly(r);
  const right = semi ? 1.5 * d : 0.75 * d;
  const wr: NumWrong[] = [
    { v: semi ? d : r, mc: MC.aroundAsAcross, say: `That is the straight distance ${semi ? 'across' : 'from the corner'}. The curve bends, so it is longer: ${semi ? '½' : '¼'} × 3 × ${d}.` },
    { v: 3 * d, mc: MC.fullCircle, say: `3 × ${d} is the whole circle. The curved edge is only ${semi ? 'half' : 'a quarter'} of it.` },
    { v: right + (semi ? d : 2 * r), mc: MC.arcAddsStraight, say: 'Only the curved edge is asked, not the straight edges with it.' },
  ];
  const pic: FigPicture = { kind: 'fig', fig: F, unit: u, dims: semi ? [{ id: 'diam' }] : [{ id: 'base' }], cand: ['arc'], solve: ['trace'], hero: [`${semi ? '\\tfrac12' : '\\tfrac14'}\\cdot 3 \\cdot ${d} = ${fmt(right)}`] };
  const skin = pick(R, semi ? ARC_SKINS_SEMI : ARC_SKINS_QUARTER);
  return numItem({ id: `arcest-${n}`, family: 'arcEst', prompt: `This is ${skin}. About how long is its ${B('curved edge')}? Use ${A('π ≈ 3')}.`, board: `\\text{curve} \\approx \\,?`, unit: u, picture: pic as never, solution: [`The whole circle would be about 3 × ${d} = ${3 * d} ${u}.`, `The curve is ${semi ? 'half' : 'a quarter'} of it: about ${fmt(right)} ${u}.`] }, right, `Yes: about ${fmt(right)} ${u}, ${semi ? 'half' : 'a quarter'} of 3 × ${d}.`, wr, `The whole circle is about 3 × ${d}; take ${semi ? 'half' : 'a quarter'} of that.`);
};

// =========================================================================================== 6. exact   [s2-exact-pi-notation]
const genExact: Gen = (R, n) => {
  const u = pick(R, ['in', 'ft', 'cm', 'm']), r = int(R, 2, 10), giveD = R() < 0.4, area = R() < 0.55;
  const F = circleOnly(r);
  const right = area ? r * r : 2 * r;
  const d = 2 * r;
  const wr: NumWrong[] = [
    { v: area ? 2 * r : r * r, mc: MC.areaPerim, say: area ? 'That is the circumference (2πr), the distance around. The area is πr².' : 'That is the area (πr²). The circumference is the distance around: 2πr, or πd.' },
    ...(giveD ? [{ v: area ? d * d : 2 * d, mc: MC.diamForRad, say: `${d} ${u} is the diameter; the radius is half of it, ${r} ${u}.` }] : []),
    { v: right * Math.PI, tol: 0.06, mc: MC.piMultiply, say: `The π is already written after the box: ${right}π is exact and finished. Type just the number in front of π.` },
    { v: right * 3.14, tol: 0.06, mc: MC.piMultiply, say: `The π is already written after the box: ${right}π is exact and finished. Type just the number in front of π.` },
  ];
  const pic: FigPicture = { kind: 'fig', fig: F, unit: u, dims: [{ id: giveD ? 'd' : 'r' }], solve: area ? ['shade'] : ['trace'], hero: area ? [`A = \\pi \\cdot ${r}^2`, `\\cssId{s}{= ${r * r}\\pi}${u2T(u)}`] : [`C = 2\\pi \\cdot ${r}`, `\\cssId{s}{= ${2 * r}\\pi}${uT(u)}`] };
  return numItem({ id: `exact-${n}`, family: 'exact', prompt: `Find the ${area ? A('area') : B('circumference')} of this circle exactly, in terms of π.`, board: area ? 'A = \\,?\\,\\pi' : 'C = \\,?\\,\\pi', unit: area ? `π ${u2(u)}` : `π ${u}`, picture: pic as never, solution: [giveD ? `The diameter is ${d} ${u}, so the radius is ${r} ${u}.` : `The radius is ${r} ${u}.`, area ? `A = π × ${r}² = ${r * r}π ${u2(u)}: exact, finished.` : `C = 2π × ${r} = ${2 * r}π ${u}: exact, finished.`] }, right, `Yes: ${right}π ${area ? u2(u) : u}, exact.`, wr, area ? 'Area: π times the radius squared.' : 'Circumference: 2 times π times the radius.');
};

// =========================================================================================== 7. readPi   [s2-exact-pi-notation]
const genReadPi: Gen = (R, n) => {
  const u = pick(R, ['in', 'ft', 'cm', 'm']), r = int(R, 2, 10), k = r * r, area = R() < 0.6;
  const kk = area ? k : 2 * r;
  const opts: Opt[] = [
    { t: `${kk} × π: an exact, finished answer`, ok: true, say: `Yes: ${kk}π means ${kk} times π. It is exact, and it is finished.` },
    { t: `${kk} + π`, say: `A number written right next to π multiplies it, like 3x means 3 times x: ${kk}π is ${kk} × π.`, mc: MC.piSum },
    { t: 'Not finished: π still has to be multiplied out', say: `${kk}π is an exact answer. A decimal is only an approximation of it.`, mc: MC.piMultiply },
    { t: `Exactly ${fmt(Math.round(kk * 3.14 * 100) / 100)}`, say: `${fmt(Math.round(kk * 3.14 * 100) / 100)} uses π ≈ 3.14, so it is only about ${kk}π, not exactly.`, mc: MC.roundedExact },
  ];
  return choiceItem({ id: `readpi-${n}`, family: 'readPi', prompt: `A circle’s ${area ? 'area' : 'circumference'} is ${S(`${kk}π ${area ? u2(u) : u}`)}. What does that mean?`, board: `${area ? 'A' : 'C'} = ${kk}\\pi${area ? u2T(u) : uT(u)}`, solution: [`${kk}π means ${kk} × π.`, 'It is the exact answer: nothing more needs doing unless a decimal is asked for.', `A decimal like ${fmt(Math.round(kk * 3.14 * 100) / 100)} is an approximation, written with ≈.`] }, R, opts);
};

// =========================================================================================== 8. partArea   [s2-fraction-circle-area]
const genPartArea: Gen = (R, n) => {
  const u = pick(R, ['in', 'ft', 'cm', 'm']), semi = R() < 0.6;
  const halfUnit = semi && R() < 0.3;
  const r = halfUnit ? int(R, 2, 9) + 0.5 : int(R, 2, 10);
  const giveD = semi && (halfUnit || R() < 0.4);
  const F = semi ? semiOnly(r) : quarterOnly(r);
  const q = semi ? 2 : 4, right = (r * r) / q;
  const wr: NumWrong[] = [
    { v: r * r, mc: MC.fullCircle, say: `πr² is the whole circle. This is ${semi ? 'half' : 'a quarter'} of a circle: take ${semi ? '½' : '¼'} of it.` },
    { v: semi ? (r / 2) ** 2 : (r / 4) ** 2, mc: MC.halvesRadius, say: `The radius stays ${fmt(r)}: take ${semi ? 'half' : 'a quarter'} of the whole area, not of the radius.` },
    ...(giveD ? [{ v: (4 * r * r) / q, mc: MC.diamForRad, say: `${fmt(2 * r)} is the diameter; the radius is half of it, ${fmt(r)}.` }] : []),
    { v: semi ? r : r / 2, mc: MC.areaPerim, say: 'That is the length of the curved edge. The area is the surface: a fraction of πr².' },
  ];
  const pic: FigPicture = { kind: 'fig', fig: F, unit: u, dims: [{ id: semi ? (giveD ? 'diam' : 'r') : 'base' }], solve: ['shade'], hero: [`A = ${semi ? '\\tfrac12' : '\\tfrac14'}\\pi \\cdot ${fmt(r)}^2`, `\\cssId{s}{= ${pnTex(pn(0, right))}}${u2T(u)}`] };
  return numItem({ id: `partarea-${n}`, family: 'partArea', prompt: `Find the ${A('area')} of this ${semi ? 'half circle' : 'quarter circle'} exactly, in terms of π.${halfUnit ? ' A calculator is fine.' : ''}`, board: 'A = \\,?\\,\\pi', unit: `π ${u2(u)}`, picture: pic as never, solution: [giveD ? `The diameter is ${fmt(2 * r)}, so r = ${fmt(r)}.` : `r = ${fmt(r)}.`, `The whole circle would be π × ${fmt(r)}² = ${fmt(r * r)}π.`, `${semi ? 'Half' : 'A quarter'} of it: ${fmt(right)}π ${u2(u)}.`] }, right, `Yes: ${semi ? '½' : '¼'} × ${fmt(r * r)}π = ${fmt(right)}π ${u2(u)}.`, wr, `Take ${semi ? 'half' : 'a quarter'} of the whole circle’s area πr².`);
};

// =========================================================================================== 9. arcLen   [s2-arc-length]
const genArcLen: Gen = (R, n) => {
  const u = pick(R, ['in', 'ft', 'cm', 'm']), semi = R() < 0.6;
  const halfUnit = semi && R() < 0.3;
  const r = halfUnit ? int(R, 2, 9) + 0.5 : int(R, 2, 10);
  const full = R() < 0.5, giveD = semi && (halfUnit || R() < 0.5);
  const F = semi ? semiOnly(r) : quarterOnly(r);
  const b = semi ? r : r / 2, straight = 2 * r;
  const right: [number, number] = full ? [straight, b] : [0, b];
  const wr: PairWrong[] = [
    full ? { v: [0, b], mc: MC.skipsDiameter, say: `That is only the curved edge. The ${semi ? 'diameter' : 'two radii'} close the shape and belong to its perimeter too: + ${fmt(straight)}.` }
      : { v: [straight, b], mc: MC.arcAddsStraight, say: `Only the curved edge is asked: leave the ${semi ? 'diameter' : 'two radii'} out (0 in the first box).` },
    { v: [full ? straight : 0, semi ? 2 * r : r], mc: MC.fullCircle, say: `${semi ? '2' : ''}πr would be the whole circle. The curve is ${semi ? 'half' : 'a quarter'} of it.` },
    { v: [0, (r * r) / (semi ? 2 : 4)], mc: MC.areaPerim, say: 'That is the area (a fraction of πr²). A length is a fraction of the circumference 2πr.' },
    ...(full && !semi ? [{ v: [r, b] as [number, number], say: 'A quarter circle has two straight edges, each a radius long.' }] : []),
  ];
  const pic: FigPicture = { kind: 'fig', fig: F, unit: u, dims: [{ id: semi ? (giveD ? 'diam' : 'r') : 'base' }, ...(full ? [] : [{ id: 'arc', text: '?' }])], cand: undefined, solve: ['trace'], hero: [full ? `P = ${fmt(straight)} + ${semi ? '\\tfrac12' : '\\tfrac14'}\\cdot 2\\pi\\cdot ${fmt(r)}` : `\\text{curve} = ${semi ? '\\tfrac12' : '\\tfrac14'}\\cdot 2\\pi\\cdot ${fmt(r)}`, `\\cssId{s}{= ${pnTex(pn(right[0], right[1]))}}${uT(u)}`] };
  const what = full ? `the ${B('whole perimeter')} of this ${semi ? 'half circle' : 'quarter circle'}` : `the length of the ${B('curved edge')} only`;
  return pairItem({ id: `arclen-${n}`, family: 'arcLen', prompt: `Find ${what}, exactly. Write 0 in the first box if there is no number part.${halfUnit ? ' A calculator is fine.' : ''}`, board: full ? 'P = \\,? + \\,?\\,\\pi' : '\\text{curve} = \\,?\\,\\pi', pairLead: '', pairOp: '+', pairTail: `π ${u}`, picture: pic as never, solution: [`The whole circle’s circumference is 2π × ${fmt(r)} = ${fmt(2 * r)}π.`, `The curve is ${semi ? 'half' : 'a quarter'} of it: ${piW(b)}.`, full ? `The perimeter adds the straight ${semi ? 'diameter' : 'radii'}: ${fmt(straight)} + ${piW(b)} ${u}.` : `Only the curve: ${piW(b)} ${u}.`] }, right, `Yes: ${pnText(pn(right[0], right[1]))} ${u}.`, wr, full ? 'Curve: a fraction of 2πr. Then add the straight edges.' : 'The curve is a fraction (½ or ¼) of 2πr.');
};

// =========================================================================================== 10. infer   [s2-infer-dimensions]
const genInfer: Gen = (R, n) => {
  const u = pick(R, UNITS_FT);
  const v = pick(R, ['semiR', 'quarterR', 'inscribed', 'partialD', 'partialR'] as const);
  let F: Fig, dims: DimShow[], right: number, wr: NumWrong[], ask: string, sol: string[];
  if (v === 'semiR') {
    const m = mkRectSemi(R); F = m.F; dims = [{ id: 'w' }, { id: 'h' }, { id: 'r', text: '?' }]; right = m.r; ask = 'the radius of the half circle';
    wr = [{ v: m.h, mc: MC.diamForRad, say: `${m.h} ${u} is the whole side the half circle sits on: its diameter. The radius is half: ${m.r} ${u}.` }];
    sol = [`The half circle sits on the ${m.h} ${u} side, so its diameter is ${m.h} ${u}.`, `The radius is half the diameter: ${m.r} ${u}.`];
  } else if (v === 'quarterR') {
    const m = mkRectQuarter(R); F = m.F; dims = [{ id: 'w' }, { id: 'h' }, { id: 'base2', text: '?' }]; right = m.h; ask = 'the length marked ?';
    wr = [{ v: m.h / 2, say: `The quarter circle’s centre is the corner, so both of its straight edges are radii, as long as the ${m.h} ${u} side.` }];
    sol = [`The quarter circle shares the ${m.h} ${u} side with the rectangle: that side is a radius.`, `The edge marked ? is the other radius: ${m.h} ${u}.`];
  } else if (v === 'inscribed') {
    const s = 2 * int(R, 3, 7); F = squareInscribed(s); dims = [{ id: 'w' }, { id: 'r', text: '?' }]; right = s / 2; ask = 'the radius of the circle';
    wr = [{ v: s, mc: MC.diamForRad, say: `The circle touches both sides, so ${s} ${u} is its diameter. The radius is half: ${s / 2} ${u}.` }];
    sol = [`The circle touches opposite sides of the square, so its diameter is the side: ${s} ${u}.`, `The radius is half: ${s / 2} ${u}.`];
  } else {
    const h = 2 * int(R, 4, 6), g = int(R, 2, h / 2 - 2), w = int(R, h, 14), d = h - 2 * g;
    F = rectSemi(w, h, d);
    const r2 = v === 'partialR';
    dims = [{ id: 'w' }, { id: 'h' }, { id: 'gapLow' }, { id: 'gapHigh' }, { id: r2 ? 'r' : 'd', text: '?' }];
    right = r2 ? d / 2 : d; ask = r2 ? 'the radius of the half circle' : 'the diameter of the half circle';
    wr = r2 ? [{ v: d, mc: MC.diamForRad, say: `${d} ${u} is the diameter (${h} − ${g} − ${g}). The radius is half of it.` }, { v: h / 2, say: `The half circle does not cover the whole ${h} ${u} side: take off the two ${g} ${u} pieces first.` }]
      : [{ v: h - g, say: `There is a ${g} ${u} piece above AND below the half circle: take off both.` }, { v: h, say: `The half circle does not cover the whole ${h} ${u} side: ${g} ${u} is left at each end.` }, { v: d / 2, mc: undefined, say: 'That is the radius; the diameter is asked.' }];
    sol = [`The side is ${h} ${u}; ${g} ${u} at each end is not covered.`, `Diameter: ${h} − ${g} − ${g} = ${d} ${u}.`, ...(r2 ? [`Radius: ${d} ÷ 2 = ${fmt(d / 2)} ${u}.`] : [])];
  }
  const pic: FigPicture = { kind: 'fig', fig: F, unit: u, dims, solve: ['parts'], hero: [`? = ${fmt(right)}${uT(u)}`] };
  return numItem({ id: `infer-${n}`, family: 'infer', prompt: `Find ${S(ask)}. Use the lengths, not the look of the drawing.`, board: '\\text{find } ?', unit: u, picture: pic as never, solution: sol }, right, `Yes: ${fmt(right)} ${u}.`, wr, 'Look at what the round part shares with the straight parts.');
};

// =========================================================================================== 11. combine   [s2-combine-pi-terms]
const genCombine: Gen = (R, n) => {
  const coef = () => pick(R, [int(R, 1, 12), int(R, 1, 12), int(R, 1, 9) + 0.5, int(R, 1, 9) + 0.5, int(R, 1, 6) + 0.25]);
  const nums = Array.from({ length: int(R, 1, 2) }, () => int(R, 2, 30));
  const pis = Array.from({ length: int(R, 2, 3) }, coef);
  const minus = pis.length === 2 && R() < 0.3 && pis[0]! > pis[1]!;
  const a = nums.reduce((s, x) => s + x, 0), b = minus ? pis[0]! - pis[1]! : pis.reduce((s, x) => s + x, 0);
  // the units of the expression; a difference keeps its two π terms side by side
  const units = shuffle(R, [...nums.map(fmt), ...(minus ? [`${fmt(pis[0]!)}\\pi - ${fmt(pis[1]!)}\\pi`] : pis.map(x => `${fmt(x)}\\pi`))]);
  const tex = units.join(' + ');
  const right: [number, number] = [a, b];
  const wr: PairWrong[] = [
    { v: [0, a + b], mc: MC.unlike, say: 'Number terms and π terms are unlike: they cannot join. Add the numbers, add the π terms, and keep both.' },
    { v: [a + b, 0], mc: MC.unlike, say: 'The π terms stay π terms: the numbers in front of π add, the π stays.' },
    ...(minus ? [{ v: [a, pis[0]! + pis[1]!] as [number, number], say: 'One π term is taken away, not added.' }] : []),
  ];
  return pairItem({ id: `combine-${n}`, family: 'combine', prompt: `Write it as ${A('one number term')} plus ${B('one π term')}. Combine the π terms; keep the number term separate.`, board: tex, pairLead: '', pairOp: '+', pairTail: 'π', solution: [`Number terms: ${nums.map(fmt).join(' + ')} = ${fmt(a)}.`, `π terms: ${minus ? `${fmt(pis[0]!)}π − ${fmt(pis[1]!)}π` : pis.map(x => `${fmt(x)}π`).join(' + ')} = ${piW(b)}.`, `Together: ${pnText(pn(a, b))}. They do not combine further.`] }, right, `Yes: ${pnText(pn(a, b))}.`, wr, 'Add the numbers on their own and the π terms on their own.');
};

// =========================================================================================== 12. likeTerms   [s2-combine-pi-terms]
const genLikeTerms: Gen = (R, n) => {
  const simplest = R() < 0.35;
  if (simplest) {
    const a = int(R, 8, 40), b = int(R, 2, 12);
    const opts: Opt[] = [
      { t: `${a} + ${b}π: it does not combine`, ok: true, say: `Yes. ${a} and ${b}π are unlike terms, so ${a} + ${b}π is already as simple as it gets.` },
      { t: `${a + b}π`, say: `${a} is a number term and ${b}π is a π term: they cannot be added into one term.`, mc: MC.unlike },
      { t: `${a * b}π`, say: 'Adding never multiplies. And a number term and a π term do not combine.', mc: MC.unlike },
      { t: `${a + b}`, say: `The π cannot just disappear: ${b}π is about ${fmt(Math.round(b * Math.PI * 10) / 10)}, not ${b}.` },
    ];
    return choiceItem({ id: `like-s-${n}`, family: 'likeTerms', prompt: 'Write it as simply as possible.', board: `${a} + ${b}\\pi`, solution: [`${a} is a number term, ${b}π a π term: unlike terms.`, `So ${a} + ${b}π stays as it is.`] }, R, opts);
  }
  const p = pick(R, [int(R, 2, 12), int(R, 2, 9) + 0.5]), q = int(R, 2, 12), a = int(R, 4, 40);
  const opts: Opt[] = [
    { t: `${a} + ${piW(p + q)}`, ok: true, say: `Yes: ${fmt(p)}π + ${q}π = ${piW(p + q)}, and the ${a} stays on its own.` },
    { t: `${fmt(a + p + q)}π`, say: `${a} is not a π term, so it cannot join the π terms.`, mc: MC.unlike },
    { t: `${a} + ${fmt(p * q)}π²`, say: `Adding like terms adds the numbers in front: ${fmt(p)}π + ${q}π = ${piW(p + q)}. Nothing is multiplied.`, mc: MC.multiplies },
    { t: `${a} + ${piW(Math.max(p, q))}`, say: 'Both π terms count: add them.' },
  ];
  return choiceItem({ id: `like-${n}`, family: 'likeTerms', prompt: 'Write it as simply as possible.', board: `${fmt(p)}\\pi + ${a} + ${q}\\pi`, solution: [`Like terms: ${fmt(p)}π + ${q}π = ${piW(p + q)}.`, `The number term stays: ${a} + ${piW(p + q)}.`] }, R, opts);
};

// =========================================================================================== 13. areaAdd   [s2-composite-area-add]
function compositeFig(R: () => number, kind: 'area' | 'perim') {
  const tpl = kind === 'area' ? pick(R, ['semi', 'semi', 'quarter', 'tri', 'track', 'trap'] as const) : pick(R, ['semi', 'semi', 'semiPart', 'track', 'quarter', 'tri', 'detached'] as const);
  if (tpl === 'semi') { const m = mkRectSemi(R); const rot = int(R, 0, 3); return { tpl, F: rotFig(m.F, rot), dims: [{ id: 'w' }, { id: 'h' }] as DimShow[], skin: rot === 1 ? 'window: a rectangle with a half circle on top' : pick(R, SEMI_SKINS), seamLen: m.h, seams: 1, semis: 1, quarters: 0, r: m.r }; }
  if (tpl === 'semiPart') { const h = 2 * int(R, 4, 5), g = 2, w = int(R, h, 14), d = h - 2 * g; return { tpl, F: rectSemi(w, h, d), dims: [{ id: 'w' }, { id: 'h' }, { id: 'gapLow' }, { id: 'gapHigh' }] as DimShow[], skin: pick(R, SEMI_SKINS), seamLen: d, seams: 1, semis: 1, quarters: 0, r: d / 2 }; }
  if (tpl === 'quarter') { const m = mkRectQuarter(R); return { tpl, F: m.F, dims: [{ id: 'w' }, { id: 'h' }] as DimShow[], skin: pick(R, QUARTER_SKINS), seamLen: m.h, seams: 1, semis: 0, quarters: 1, r: m.r }; }
  if (tpl === 'tri') { const m = mkTriSemi(R); return { tpl, F: m.F, dims: (kind === 'area' ? [{ id: 'd' }, { id: 't' }] : [{ id: 'legR' }, { id: 'd' }]) as DimShow[], skin: 'sign shaped like an ice cream cone', seamLen: m.b, seams: 1, semis: 1, quarters: 0, r: m.r }; }
  if (tpl === 'track') { const m = mkTrack(R); return { tpl, F: m.F, dims: [{ id: 'w' }, { id: 'h' }] as DimShow[], skin: pick(R, TRACK_SKINS), seamLen: m.h, seams: 2, semis: 2, quarters: 0, r: m.r }; }
  if (tpl === 'trap') { const m = mkTrapSemi(R); return { tpl, F: m.F, dims: [{ id: 'bottom' }, { id: 't' }, { id: 'd' }] as DimShow[], skin: 'stage: a trapezoid with a half circle on its front', seamLen: m.b2, seams: 1, semis: 1, quarters: 0, r: m.r }; }
  const r = int(R, 3, 8); return { tpl, F: semiOnly(r), dims: [{ id: 'diam' }] as DimShow[], skin: 'half-circle rug', seamLen: 0, seams: 0, semis: 1, quarters: 0, r };
}
const genAreaAdd: Gen = (R, n) => {
  const u = pick(R, UNITS_FT);
  const c = compositeFig(R, 'area');
  const F = c.F, A0 = F.area;
  const roundB = A0.b;
  const fullB = c.quarters ? roundB * 4 : c.tpl === 'track' ? roundB * 2 : roundB * 2;
  const wr: PairWrong[] = [
    { v: [A0.a, fullB], mc: MC.fullCircle, say: c.tpl === 'track' ? 'Two half circles make ONE whole circle, not two.' : `πr² is a whole circle. The round part is only ${c.quarters ? 'a quarter' : 'half'} of one.` },
    { v: [A0.a, c.quarters ? roundB / 4 : roundB / 2], mc: MC.halvesRadius, say: `Keep the radius ${fmt(c.r)}: take ${c.quarters ? 'a quarter' : 'half'} of the whole circle’s area, not of the radius.` },
    ...(c.quarters ? [] : [{ v: [A0.a, roundB * 4] as [number, number], mc: MC.diamForRad, say: `${fmt(2 * c.r)} is the diameter of the half circle; the radius is ${fmt(c.r)}.` }]),
    { v: pairOf(F.perimeter), mc: MC.areaPerim, say: 'That is the perimeter, the distance around. The area adds up the surfaces of the parts.' },
  ];
  const pic: FigPicture = { kind: 'fig', fig: F, unit: u, dims: c.dims, solve: ['parts', 'shade'], hero: areaHero(F) };
  return pairItem({ id: `area-${n}`, family: 'areaAdd', prompt: `A ${c.skin}. Find its ${A('area')} exactly.`, board: 'A = \\,? + \\,?\\,\\pi', pairLead: '', pairOp: '+', pairTail: `π ${u2(u)}`, picture: pic as never, solution: [`Split it: ${F.parts.map(p => (p.kind === 'rect' ? 'a rectangle' : p.kind === 'tri' ? 'a triangle' : p.kind === 'trap' ? 'a trapezoid' : p.kind === 'semi' ? 'a half circle' : p.kind === 'quarter' ? 'a quarter circle' : 'a circle')).join(', ')}.`, `Add the areas: ${F.parts.map(p => texToText(p.areaTex)).join(' + ')}.`, `A = ${sayPN(A0, u2(u))}.`] }, pairOf(A0), `Yes: ${sayPN(A0, u2(u))}.`, wr, 'Split the figure into parts, find each area, then add them.');
};
const texToText = (t: string) => t.replace(/\\tfrac12/g, '½').replace(/\\tfrac14/g, '¼').replace(/\\cdot/g, '×').replace(/\\pi/g, 'π').replace(/\^2/g, '²').replace(/\s+/g, ' ').replace(/\(\s*/g, '(').trim();

// =========================================================================================== 14. perimAdd   [s2-composite-perimeter]
const genPerimAdd: Gen = (R, n) => {
  const u = pick(R, UNITS_FT);
  const c = compositeFig(R, 'perim');
  const F = c.F, P0 = F.perimeter;
  const wr: PairWrong[] = c.tpl === 'detached' ? [
    { v: [0, P0.b], mc: MC.skipsDiameter, say: `That is only the curved edge. The straight diameter closes the half circle and is part of its edge: + ${fmt(2 * c.r)}.` },
    { v: [2 * c.r, 2 * P0.b], mc: MC.fullCircle, say: 'The curved edge is half a circumference, not a whole one.' },
    { v: pairOf(F.area), mc: MC.areaPerim, say: 'That is the area. The perimeter is the distance around.' },
  ] : [
    { v: [P0.a + c.seams * c.seamLen, P0.b], mc: MC.seam, say: `The ${fmt(c.seamLen)} ${u} seam${c.seams > 1 ? 's are' : ' is'} inside, where the parts meet: not on the edge.` },
    { v: [P0.a + 2 * c.seams * c.seamLen, P0.b], mc: MC.bothPerims, say: 'Adding both parts’ whole perimeters puts the seam in twice. A seam is not on the edge at all.' },
    { v: [P0.a, 0], mc: MC.omitsCurve, say: 'The curved edge is part of the edge too: add its length.' },
    { v: [P0.a, c.quarters ? 4 * P0.b : 2 * P0.b], mc: MC.fullCircle, say: c.tpl === 'track' ? 'The two curves together make one circumference, not two.' : `The curve is only ${c.quarters ? 'a quarter' : 'half'} of a circumference.` },
    { v: pairOf(F.area), mc: MC.areaPerim, say: 'That is the area. The perimeter is the distance around.' },
  ];
  const pic: FigPicture = { kind: 'fig', fig: F, unit: u, dims: c.dims, solve: ['parts', 'trace'], hero: perimHero(F) };
  const legsNote = c.tpl === 'tri' ? ' Both slanted sides are the same length.' : '';
  return pairItem({ id: `perim-${n}`, family: 'perimAdd', prompt: `A ${c.skin}. Find its ${B('perimeter')} exactly.${legsNote}`, board: 'P = \\,? + \\,?\\,\\pi', pairLead: '', pairOp: '+', pairTail: `π ${u}`, picture: pic as never, solution: [`Walk the edge once: ${F.outer.map(p => (p.kind === 'seg' ? fmt(p.len.a) : `the ${p.frac === 0.5 ? 'half' : 'quarter'} circle ${piW(p.len.b)}`)).join(', ')}.`, c.seams ? 'The seam is inside: leave it out.' : 'The diameter closes the shape: it counts.', `P = ${sayPN(P0, u)}.`] }, pairOf(P0), `Yes: ${sayPN(P0, u)}.`, wr, 'List every edge piece once (straight and curved), then add.');
};

// =========================================================================================== 15. cutArea   [s2-cutout-area, s3-hole-area-and-boundary]
function cutFig(R: () => number) {
  const tpl = pick(R, ['corner', 'notch', 'hole', 'inscribed', 'ring'] as const);
  if (tpl === 'corner') { const m = mkCorner(R); return { tpl, F: m.F, dims: [{ id: 'w' }, { id: 'h' }, { id: 'r' }] as DimShow[], skin: pick(R, CORNER_SKINS), what: `a quarter circle of radius ${m.r}`, r: m.r, q: 4 }; }
  if (tpl === 'notch') { const m = mkNotch(R); return { tpl, F: m.F, dims: [{ id: 'top' }, { id: 'h' }, { id: 'd' }] as DimShow[], skin: pick(R, NOTCH_SKINS), what: `a half circle`, r: m.r, q: 2 }; }
  if (tpl === 'hole') { const m = mkHole(R); return { tpl, F: m.F, dims: [{ id: 'w' }, { id: 'h' }, { id: 'd' }] as DimShow[], skin: pick(R, HOLE_SKINS).what, what: 'a round hole', r: m.r, q: 1 }; }
  if (tpl === 'inscribed') { const s = 2 * int(R, 3, 7); return { tpl, F: squareInscribed(s), dims: [{ id: 'w' }, { id: 'h' }] as DimShow[], skin: 'square tile with a round inlay', what: 'the circle that touches all four sides', r: s / 2, q: 1 }; }
  const Rr = int(R, 6, 10), r = int(R, 2, Rr - 4); return { tpl, F: ring(Rr, r), dims: [{ id: 'R' }, { id: 'r' }] as DimShow[], skin: 'round path around a pond', what: 'the pond', r, q: 1, R: Rr };
}
const genCutArea: Gen = (R, n) => {
  const u = pick(R, UNITS_FT);
  const c = cutFig(R);
  const F = c.F;
  const cutB = -F.area.b;     // what is taken away, as a multiple of π (ring: the area itself is all π)
  const circB = c.q === 4 ? c.r / 2 : c.q === 2 ? c.r : 2 * c.r;
  const pic: FigPicture = { kind: 'fig', fig: F, unit: u, dims: c.dims, before: true, solve: ['cut', 'shade'], hero: areaHero(F) };
  const sol = [`Start with the whole shape: ${texToText(F.parts[0]!.areaTex)}${c.tpl === 'ring' ? 'π' : ''}.`, `Take away ${c.what}: ${texToText(F.parts[1]!.areaTex)}.`, `A = ${sayPN(F.area, u2(u))}.`];
  if (c.tpl === 'ring') {
    const Rr = c.R!, right = Rr * Rr - c.r * c.r;
    const wr: NumWrong[] = [
      { v: (Rr - c.r) ** 2, mc: MC.ringRadii, say: `Subtract the two whole circle areas: π × ${Rr}² − π × ${c.r}². Taking the radii away first loses most of the ring.` },
      { v: Rr * Rr + c.r * c.r, mc: MC.addsCutout, say: 'The pond is taken away, so its area is subtracted, not added.' },
      { v: Rr * Rr - 2 * c.r, mc: MC.lengthsInArea, say: `2π × ${c.r} is the pond’s edge, a length. Subtract its AREA, π × ${c.r}².` },
    ];
    return numItem({ id: `cut-r-${n}`, family: 'cutArea', prompt: `A ${c.skin}: the path is the ring between the two circles. Find the ${A('area of the path')} exactly.`, board: 'A = \\,?\\,\\pi', unit: `π ${u2(u)}`, picture: pic as never, solution: [`Big circle: π × ${Rr}² = ${Rr * Rr}π.`, `Pond: π × ${c.r}² = ${c.r * c.r}π.`, `Path: ${Rr * Rr}π − ${c.r * c.r}π = ${right}π ${u2(u)}.`] }, right, `Yes: ${Rr * Rr}π − ${c.r * c.r}π = ${right}π ${u2(u)}.`, wr, 'Find both circle areas, then subtract.');
  }
  const right: [number, number] = [F.area.a, cutB];
  const wr: PairWrong[] = [
    { v: [F.area.a, circB], mc: MC.lengthsInArea, say: `${piW(circB)} is the length around the cut-out. Take away its AREA: ${piW(cutB)}.` },
    ...(c.q > 1 ? [{ v: [F.area.a, c.r * c.r] as [number, number], mc: MC.fullCircle, say: `πr² is a whole circle; only ${c.q === 4 ? 'a quarter' : 'half'} of one is cut out.` }] : []),
    { v: pairOf(F.perimeter), mc: MC.areaPerim, say: 'That is the perimeter. The area is the surface that is left.' },
  ];
  return pairItem({ id: `cut-${n}`, family: 'cutArea', prompt: `A ${c.skin} with ${c.what} cut out. Find the ${A('area that is left')} exactly.`, board: 'A = \\,? - \\,?\\,\\pi', pairLead: '', pairOp: '−', pairTail: `π ${u2(u)}`, picture: pic as never, solution: sol }, right, `Yes: ${sayPN(F.area, u2(u))}.`, wr, 'Whole shape minus the part cut out.');
};

// =========================================================================================== 16. cutPick   [s2-cutout-area]
const genCutPick: Gen = (R, n) => {
  const u = pick(R, UNITS_FT);
  let c = cutFig(R);
  for (let k = 0; c.tpl === 'ring' && k < 20; k++) c = cutFig(R);
  if (c.tpl === 'ring') c = { ...cutFig(() => 0.1) };
  const F = c.F, a = F.area.a, b = -F.area.b;
  const circB = c.q === 4 ? c.r / 2 : c.q === 2 ? c.r : 2 * c.r;
  const opts: Opt[] = [
    { t: `${fmt(a)} − ${piW(b)} ${u2(u)}`, ok: true, say: `Yes: the whole ${fmt(a)} ${u2(u)}, minus the ${piW(b)} ${u2(u)} cut out.` },
    { t: `${fmt(a)} + ${piW(b)} ${u2(u)}`, say: 'The cut-out is gone, so its area is taken away, not added.', mc: MC.addsCutout },
    { t: `${fmt(a)} − ${piW(circB)} ${u2(u)}`, say: `${piW(circB)} is the length of the cut’s curved edge. Take away the cut-out’s AREA.`, mc: MC.lengthsInArea },
    { t: `${fmt(a - b)}π ${u2(u)}`, say: `${fmt(a)} and ${piW(b)} are unlike terms: they cannot be joined into one π term.`, mc: MC.unlike },
  ];
  const pic: FigPicture = { kind: 'fig', fig: F, unit: u, dims: c.dims, before: true, solve: ['cut', 'shade'], hero: areaHero(F) };
  return choiceItem({ id: `cutpick-${n}`, family: 'cutPick', prompt: `A ${c.skin} with ${c.what} cut out. Which is the ${A('area that is left')}?`, board: 'A = \\,?', picture: pic as never, solution: [`Whole: ${texToText(F.parts[0]!.areaTex)} = ${fmt(a)}.`, `Cut out: ${texToText(F.parts[1]!.areaTex)} = ${piW(b)}.`, `Left: ${fmt(a)} − ${piW(b)} ${u2(u)}.`] }, R, opts);
};

// =========================================================================================== 17. notch   [s2-notch-perimeter]
const genNotch: Gen = (R, n) => {
  const u = pick(R, UNITS_FT), corner = R() < 0.5;
  const m = corner ? mkCorner(R) : mkNotch(R);
  const F = m.F, P0 = F.perimeter, before = 2 * (m.w + m.h);
  const wr: PairWrong[] = [
    { v: [before - 2 * m.r, 0], mc: MC.cutShrinks, say: `The cut takes away straight edge, but it also makes a NEW curved edge: add ${piW(P0.b)}.` },
    { v: [before, P0.b], say: `The straight edge where the cut is (${2 * m.r} ${u} in all) is gone: take it off.` },
    ...(corner ? [{ v: [before - m.r, P0.b] as [number, number], mc: MC.oneRadius, say: `The corner cut takes ${m.r} ${u} off BOTH sides that meet at the corner: ${2 * m.r} ${u} in all.` }] : []),
    { v: [before - 2 * m.r, corner ? m.r : 2 * m.r], mc: MC.fullCircle, say: `The new edge is ${corner ? 'a quarter' : 'half'} of a circumference.` },
    { v: pairOf(F.area), mc: MC.areaPerim, say: 'That is the area. The perimeter is the distance around.' },
  ];
  const pic: FigPicture = { kind: 'fig', fig: F, unit: u, dims: corner ? [{ id: 'w' }, { id: 'h' }, { id: 'r' }] : [{ id: 'top' }, { id: 'h' }, { id: 'd' }], before: true, solve: ['cut', 'trace'], hero: [`P = ${before} - ${2 * m.r} + ${piW(P0.b).replace('π', '\\pi')}`, `\\cssId{s}{= ${pnTex(P0)}}${uT(u)}`] };
  return pairItem({ id: `notch-${n}`, family: 'notch', prompt: corner ? `A ${m.w} by ${m.h} ${u} ${pick(R, CORNER_SKINS)} gets a rounded corner: a quarter circle of radius ${m.r} ${u} is cut away, centred on the corner. Find the new ${B('perimeter')} exactly.` : `A ${m.w} by ${m.h} ${u} ${pick(R, NOTCH_SKINS)} gets a half-circle notch cut into one long side. Find the new ${B('perimeter')} exactly.`, board: 'P = \\,? + \\,?\\,\\pi', pairLead: '', pairOp: '+', pairTail: `π ${u}`, picture: pic as never, solution: [`Before: 2 × (${m.w} + ${m.h}) = ${before} ${u}.`, `The cut removes ${corner ? `${m.r} from each of two sides` : `the ${2 * m.r} ${u} diameter`}: − ${2 * m.r}.`, `It adds the curved edge: + ${piW(P0.b)}.`, `P = ${sayPN(P0, u)}.`] }, pairOf(P0), `Yes: ${before} − ${2 * m.r} + ${piW(P0.b)} = ${sayPN(P0, u)}.`, wr, 'Start from the old perimeter: take away the straight edge that is gone, add the new curve.');
};

// =========================================================================================== 18. round   [s2-exact-and-approx]
const genRound: Gen = (R, n) => {
  const u = pick(R, UNITS_FT), area = R() < 0.4;
  const a = int(R, 6, 60), b = pick(R, [int(R, 2, 16), int(R, 2, 9) + 0.5]), minus = area && R() < 0.4 && a > b * 3.2 + 2;
  const key = R() < 0.5, dp = R() < 0.7 ? 1 : 0;
  const PIv = key ? Math.PI : 3.14;
  const rd = (x: number) => Math.round(x * 10 ** dp + 1e-9) / 10 ** dp;
  const val = (p: number) => (minus ? a - b * p : a + b * p);
  const right = rd(val(PIv));
  const X = pn(a, minus ? -b : b);
  const unit = area ? u2(u) : u;
  const wr: NumWrong[] = [
    { v: rd((minus ? a - b : a + b) * PIv), mc: MC.unlike, say: `${a} is not a π term: only ${fmt(b)} is multiplied by π. Work out ${fmt(b)}π first, then ${minus ? 'subtract it from' : 'add'} ${a}.` },
    { v: rd(val(dp ? 3.1 : 3)), mc: MC.earlyRound, say: `π was rounded to ${dp ? '3.1' : '3'} first. Keep the full value (${key ? 'the π key' : '3.14'}) and round only the final answer.` },
    { v: rd(val(key ? 3.14 : Math.PI)), say: key ? 'Use the π key, not 3.14, for this one.' : 'Use 3.14 for π in this one.' },
  ];
  return numItem({ id: `round-${n}`, family: 'round', prompt: `The exact ${area ? 'area' : 'perimeter'} is ${S(`${pnText(X)} ${unit}`)}. Use ${key ? 'the π key on a calculator' : 'π ≈ 3.14'} and round to the nearest ${dp ? 'tenth' : 'whole number'}, once, at the end.`, board: `${area ? 'A' : 'P'} = ${pnTex(X)} \\approx \\,?`, unit, solution: [`${fmt(b)}π ≈ ${fmt(Math.round(b * PIv * 10000) / 10000)}.`, `${a} ${minus ? '−' : '+'} ${fmt(Math.round(b * PIv * 10000) / 10000)} = ${fmt(Math.round(val(PIv) * 10000) / 10000)}.`, `Rounded once, at the end: ≈ ${fmt(right)} ${unit}.`] }, right, `Yes: ≈ ${fmt(right)} ${unit}.`, wr, `Multiply only ${fmt(b)} by π, ${minus ? 'subtract' : 'add'} ${a}, and round once at the end.`);
};

// =========================================================================================== 19. approx   [s2-exact-and-approx]
const genApprox: Gen = (R, n) => {
  const a = int(R, 6, 60), b = int(R, 2, 16);
  const X = pn(a, b), v = approx(X, 1), u = pick(R, UNITS_FT);
  const wrongSum = Math.round((a + b) * Math.PI * 10) / 10;
  const opts: Opt[] = [
    { t: `${pnText(X)} ≈ ${fmt(v)} ${u}`, ok: true, say: `Yes: ${pnText(X)} is exact; ${fmt(v)} is a rounded value, so ≈.` },
    { t: `${pnText(X)} = ${fmt(v)} ${u}`, say: `${fmt(v)} is rounded: it is close to ${pnText(X)}, not equal. Use ≈ for a rounded value.`, mc: MC.roundedExact },
    { t: `${pnText(X)} ≈ ${fmt(wrongSum)} ${u}`, say: `Only ${b} is multiplied by π, not ${a} + ${b}.`, mc: MC.unlike },
    { t: `${pnText(X)} = ${fmt(Math.round(pnVal(X) * 100) / 100)} ${u}`, say: 'Still rounded, however many decimals: π never ends, so a decimal is only ≈.', mc: MC.roundedExact },
  ];
  return choiceItem({ id: `approx-${n}`, family: 'approx', prompt: 'Which one is written correctly?', board: `P = ${pnTex(X)}${uT(u)}`, solution: [`${pnText(X)} is the exact answer.`, `With π: ${a} + ${b} × 3.14159… ≈ ${fmt(v)}.`, 'A rounded value gets ≈, never =.'] }, R, opts);
};

// =========================================================================================== 20. hole   [s3-hole-area-and-boundary, s1-hole-boundary]
const genHole: Gen = (R, n) => {
  const u = pick(R, UNITS_FT), m = mkHole(R), sk = pick(R, HOLE_SKINS);
  const ask = pick(R, ['area', 'perim', 'perim', 'outer'] as const);
  const F = m.F, outer = 2 * (m.w + m.h);
  let right: [number, number], wr: PairWrong[], op = '+', what: string, sol: string[], solve: FigPicture['solve'], hero: string[];
  if (ask === 'area') {
    right = [m.w * m.h, m.r * m.r]; op = '−'; what = `the ${A('area')} of the ${sk.what} that is left`;
    wr = [{ v: [m.w * m.h, 2 * m.r], mc: MC.lengthsInArea, say: `${piW(2 * m.r)} is the hole’s edge, a length. Take away its AREA: ${piW(m.r * m.r)}.` },
      { v: [outer, 2 * m.r], mc: MC.areaPerim, say: 'That is the perimeter. The area is the surface that is left.' }];
    sol = [`Whole: ${m.w} × ${m.h} = ${m.w * m.h}.`, `Hole: π × ${fmt(m.r)}² = ${piW(m.r * m.r)}.`, `Left: ${m.w * m.h} − ${piW(m.r * m.r)} ${u2(u)}.`];
    solve = ['cut', 'shade']; hero = areaHero(F);
  } else if (ask === 'perim') {
    right = [outer, 2 * m.r]; what = `the ${B('perimeter')} (every edge, the hole’s edge too)`;
    wr = [{ v: [outer, 0], mc: MC.cutShrinks, say: `The hole adds an edge: ${piW(2 * m.r)} around it. It belongs to the perimeter.` },
      { v: [outer, m.r * m.r], mc: MC.areaPerim, say: `π × ${fmt(m.r)}² is the hole’s area. Its edge is π × ${fmt(2 * m.r)}.` },
      { v: [outer, m.r], mc: MC.fullCircle, say: 'The hole is a whole circle: its edge is the full circumference πd.' }];
    sol = [`Outside: 2 × (${m.w} + ${m.h}) = ${outer}.`, `The hole’s edge: π × ${2 * m.r} = ${piW(2 * m.r)}.`, `P = ${outer} + ${piW(2 * m.r)} ${u}.`];
    solve = ['cut', 'trace', 'holes']; hero = perimHero(F);
  } else {
    right = [outer, 0]; what = `the ${B('outer perimeter')} (the outside edge only)`;
    wr = [{ v: [outer, 2 * m.r], mc: MC.fixedBoundary, say: 'The outer perimeter is only the outside edge: leave the hole out this time.' },
      { v: [outer - 2 * m.r, 0], mc: MC.cutShrinks, say: 'A hole in the middle does not touch the outside edge: it stays the same.' }];
    sol = [`The outside edge is not touched by the hole.`, `Outer perimeter: 2 × (${m.w} + ${m.h}) = ${outer} ${u} (0 in the π box).`];
    solve = ['cut', 'trace']; hero = perimHero(F, 'outer');
  }
  const pic: FigPicture = { kind: 'fig', fig: F, unit: u, dims: [{ id: 'w' }, { id: 'h' }, { id: 'd' }], before: true, solve, hero };
  return pairItem({ id: `hole-${n}`, family: 'hole', prompt: `A ${sk.what} with ${sk.hole}. Find ${what}, exactly.`, board: ask === 'area' ? 'A = \\,? - \\,?\\,\\pi' : ask === 'outer' ? '\\text{outer } P = \\,?' : 'P = \\,? + \\,?\\,\\pi', pairLead: '', pairOp: op, pairTail: `π ${ask === 'area' ? u2(u) : u}`, picture: pic as never, solution: sol }, right, `Yes: ${pnText(pn(right[0], op === '−' ? -right[1] : right[1]))} ${ask === 'area' ? u2(u) : u}.`, wr, ask === 'area' ? 'Whole rectangle minus the hole’s area.' : ask === 'perim' ? 'The outside edge plus the edge around the hole.' : 'Only the outside edge.');
};

// =========================================================================================== 21. critique   [s3-parts-inventory-justification]
const genCritique: Gen = (R, n) => {
  const who = name(R), u = pick(R, UNITS_FT);
  const v = pick(R, ['seam', 'seam', 'overlap', 'overlap', 'fine'] as const);
  if (v === 'seam') {
    const m = mkRectSemi(R), F = m.F, rp = 2 * (m.w + m.h);
    const opts: Opt[] = [
      { t: `The ${m.h} ${u} seam was in BOTH perimeters, so it has to come off twice`, ok: true, say: `Yes. The rectangle’s perimeter and the half circle’s perimeter each contain the ${m.h} ${u} seam: take off 2 × ${m.h}. P = ${sayPN(F.perimeter, u)}.` },
      { t: 'Nothing: there is one seam, so it comes off once', say: `There is one seam, but it was counted twice (once in each part’s perimeter), so it must come off twice.`, mc: MC.sharedOnce },
      { t: 'The curved edge should not be in the perimeter', say: 'The curved edge is on the outside: it belongs to the perimeter.', mc: MC.omitsCurve },
      { t: `The ${m.h} ${u} seam should stay in: it is a side of the rectangle`, say: 'In the joined figure the seam is inside: it is no longer an edge of anything.', mc: MC.seam },
    ];
    const pic: FigPicture = { kind: 'fig', fig: F, unit: u, dims: [{ id: 'w' }, { id: 'h' }], solve: ['parts', 'seam', 'trace'], hero: perimHero(F) };
    const board = `${rp} + (${m.h} + ${piW(m.r).replace('π', '\\pi')}) - ${m.h}`;
    return choiceItem({ id: `crit-s-${n}`, family: 'critique', prompt: `${who} finds the perimeter: the rectangle’s perimeter (${rp}) plus the half circle’s perimeter (${m.h} + ${piW(m.r)}), minus the seam once. What went wrong?`, board, picture: pic as never, solution: ['A parts table: rectangle edges: bottom, top, left are on the boundary; its right side is the seam (not on it).', 'Half circle: the curve is on the boundary; its diameter is the seam (not on it).', `P = ${m.w} + ${m.w} + ${m.h} + ${piW(m.r)} = ${sayPN(F.perimeter, u)}.`] }, R, opts);
  }
  const a = int(R, 8, 14), b = int(R, 3, 6), c = int(R, 3, a - 4), d = int(R, 3, 6);
  const F = lShape(a, b, c, d);
  const overlap = v === 'overlap';
  const t1 = `${a} \\times ${b}`, t2 = overlap ? `${c} \\times ${b + d}` : `${c} \\times ${d}`;
  const sum2 = a * b + (overlap ? c * (b + d) : c * d);
  const opts: Opt[] = [
    { t: `The ${c} × ${b} corner is in both parts: it is counted twice`, ok: overlap, say: overlap ? `Yes. The ${c} × ${b + d} part reaches down into the ${a} × ${b} part: ${c} × ${b} = ${c * b} is counted twice. Area = ${a * b} + ${c * d} = ${a * b + c * d}.` : `The ${c} × ${d} part sits on top of the ${a} × ${b} part: they only share a line, no surface.` },
    { t: 'Nothing: the parts cover the whole shape', ok: !overlap, say: !overlap ? `Yes: ${a} × ${b} and ${c} × ${d} cover the shape once each, so ${sum2} is right.` : `They cover it, but they overlap: check that every bit is covered exactly ONCE. The ${c} × ${b} corner is in both.`, mc: overlap ? MC.noCoverCheck : undefined },
    { t: `The seam must be subtracted: − ${c}`, say: 'The seam is a length, not a surface: it has no area to take away.', mc: MC.lengthsInArea },
    { t: 'The two areas should be multiplied, not added', say: 'Areas of parts that do not overlap add up to the whole area.' },
  ];
  const pic: FigPicture = { kind: 'fig', fig: F, unit: u, dims: [{ id: 'bottom' }, { id: 'right' }, { id: 'top' }, { id: 'left' }], solve: ['parts', 'shade'], hero: [`A = ${a}\\cdot ${b} + ${c}\\cdot ${d}`, `\\cssId{s}{= ${a * b + c * d}}${u2T(u)}`] };
  return choiceItem({ id: `crit-o-${n}`, family: 'critique', prompt: `${who} splits the L into two rectangles and adds: ${t1.replace('\\times', '×')} + ${t2.replace('\\times', '×')} = ${sum2} ${u2(u)}. What went wrong?`, board: `${t1} + ${t2} = ${sum2}`, picture: pic as never, solution: [`The left side is ${b + d}; the top part is ${c} wide and ${d} tall.`, `Parts that cover the L once each: ${a} × ${b} and ${c} × ${d}.`, `Area = ${a * b} + ${c * d} = ${a * b + c * d} ${u2(u)}.`] }, R, opts);
};

// =========================================================================================== 22. counter   [s3-counterexample-area-perimeter]
const genCounter: Gen = (R, n) => {
  const u = pick(R, UNITS_FT);
  const v = pick(R, ['hole', 'notch', 'corner', 'circles'] as const);
  if (v === 'circles') {
    const r = int(R, 1, 4);
    const opts: Opt[] = [
      { t: 'The same area, and the four small circles have MORE perimeter', ok: true, say: `Yes: both are ${4 * r * r}π ${u2(u)}, but the edges are ${4 * r}π ${u} for the big circle and 4 × ${2 * r}π = ${8 * r}π ${u} for the four small ones.` },
      { t: 'The same area, so the same perimeter', say: `Equal areas do not force equal perimeters: ${4 * r}π against ${8 * r}π ${u}.`, mc: MC.together },
      { t: 'The big circle has more area and more perimeter', say: `π × ${2 * r}² = ${4 * r * r}π and 4 × π × ${r}² = ${4 * r * r}π: the areas are equal.` },
    ];
    return choiceItem({ id: `counter-c-${n}`, family: 'counter', prompt: `Compare one circle of radius ${2 * r} ${u} with four separate circles of radius ${r} ${u}.`, board: `\\pi\\cdot ${2 * r}^2 \\quad\\text{vs}\\quad 4\\cdot\\pi\\cdot ${r}^2`, solution: [`Areas: ${4 * r * r}π and ${4 * r * r}π: equal.`, `Perimeters: 2π × ${2 * r} = ${4 * r}π against 4 × 2π × ${r} = ${8 * r}π.`, 'So the same area can come with different perimeters.'] }, R, opts);
  }
  const m = v === 'hole' ? mkHole(R) : v === 'notch' ? mkNotch(R) : mkCorner(R);
  const F = m.F;
  const up = v !== 'corner';
  const before = 2 * (m.w + m.h);
  const opts: Opt[] = [
    { t: 'The area goes down and the perimeter goes UP', ok: up, say: up ? (v === 'hole' ? `Yes: the hole takes away area but adds its edge, ${piW(2 * m.r)} ${u}, to the perimeter.` : `Yes: the notch removes ${2 * m.r} ${u} of straight edge but adds a curve of ${piW(m.r)} ≈ ${fmt(Math.round(m.r * Math.PI * 10) / 10)} ${u}.`) : `Here the new curve, ${piW(m.r / 2)} ≈ ${fmt(Math.round((m.r * Math.PI) / 2 * 10) / 10)} ${u}, is shorter than the ${2 * m.r} ${u} of edge it replaces: the perimeter goes down.` },
    { t: 'Both go down', ok: !up, say: !up ? `Yes, this time: the curve ${piW(m.r / 2)} ≈ ${fmt(Math.round((m.r * Math.PI) / 2 * 10) / 10)} ${u} is shorter than the ${2 * m.r} ${u} it replaces. So neither direction is a rule.` : 'Less area does not mean less perimeter: the cut makes a new edge.', mc: up ? MC.together : undefined },
    { t: 'The area goes down, the perimeter stays the same', say: v === 'hole' ? `The outer edge stays the same, but the hole adds its own edge, ${piW(2 * m.r)} ${u}.` : 'The cut takes away straight edge and adds a curved one: the two are not the same length.', mc: MC.cutShrinks },
  ];
  const pic: FigPicture = { kind: 'fig', fig: F, unit: u, dims: v === 'hole' ? [{ id: 'w' }, { id: 'h' }, { id: 'd' }] : v === 'notch' ? [{ id: 'top' }, { id: 'h' }, { id: 'd' }] : [{ id: 'w' }, { id: 'h' }, { id: 'r' }], before: true, solve: ['cut', 'trace', 'holes'], hero: [`P: ${before} \\to ${pnTex(F.perimeter)}`, `A: ${m.w * m.h} \\to ${pnTex(F.area)}`] };
  const what = v === 'hole' ? 'a round hole is cut through the middle' : v === 'notch' ? 'a half-circle notch is cut into one side' : 'a quarter circle is cut off one corner';
  return choiceItem({ id: `counter-${n}`, family: 'counter', prompt: `A ${m.w} by ${m.h} ${u} board: ${what}. What happens to its area and its perimeter?`, board: 'A\\ ?\\quad P\\ ?', picture: pic as never, solution: [`Before: A = ${m.w * m.h}, P = ${before}.`, `After: A = ${pnText(F.area)} ≈ ${fmt(approx(F.area))}, P = ${pnText(F.perimeter)} ≈ ${fmt(approx(F.perimeter))}.`, up ? 'Area down, perimeter up: less area does not mean less perimeter.' : 'Both down here, but a hole or a notch sends the perimeter up: no rule ties them.'] }, R, opts);
};

// =========================================================================================== 23. which   [s3-context-model]
const genWhich: Gen = (R, n) => {
  const u = pick(R, UNITS_FT);
  const v = pick(R, ['deck', 'window', 'path'] as const);
  let F: Fig, jobs: { job: string; right: number }[], labels: string[], dims: DimShow[], prompt0: string;
  if (v === 'deck') {
    const m = mkHole(R); F = m.F; dims = [{ id: 'w' }, { id: 'h' }, { id: 'd' }]; prompt0 = 'A deck has a round hole for a tree.';
    labels = ['The outside edge only', 'The outside edge and the hole’s edge', 'The surface of the deck'];
    jobs = [{ job: 'a railing around the outside of the deck', right: 0 }, { job: 'rubber edging along every edge, around the tree hole too', right: 1 }, { job: 'stain to cover the deck', right: 2 }];
  } else if (v === 'window') {
    const m = mkRectSemi(R); F = rotFig(m.F, 1); dims = [{ id: 'w' }, { id: 'h' }]; prompt0 = 'A window is a rectangle with a half circle on top.';
    labels = ['All the way around the window', 'The curved top only', 'The surface of the window'];
    jobs = [{ job: 'trim all the way around the window', right: 0 }, { job: 'a weather strip along the curved top only', right: 1 }, { job: 'glass to fill the window', right: 2 }];
  } else {
    const Rr = int(R, 6, 10), r = int(R, 2, Rr - 4); F = ring(Rr, r); dims = [{ id: 'R' }, { id: 'r' }]; prompt0 = 'A round path goes around a round pond.';
    labels = ['Both edges of the path', 'The inside edge only, along the pond', 'The surface of the path'];
    jobs = [{ job: 'edging stones along both edges of the path', right: 0 }, { job: 'a low fence along the pond’s edge only', right: 1 }, { job: 'gravel to cover the path', right: 2 }];
  }
  const j = pick(R, jobs);
  const edgeSets = [0, 1];
  const opts: Opt[] = labels.map((t, i) => {
    if (i === j.right) return { t, ok: true, say: 'Yes: that is exactly what the job touches.' };
    if (i === 2 || j.right === 2) return { t, say: j.right === 2 ? 'Covering the surface is an area, not an edge.' : 'This job runs along edges: a length, not a surface.', mc: MC.areaPerim };
    // both are edge sets: more than needed, or a different set
    const more = (v === 'deck' && i === 1) || (v === 'window' && i === 0) || (v === 'path' && i === 0);
    return { t, say: more ? 'The job does not need all of those edges: read what it touches.' : 'The job needs other edges than these: read what it touches.', mc: more ? MC.ignoresContext : MC.fixedBoundary };
  });
  void edgeSets;
  const pic: FigPicture = { kind: 'fig', fig: F, unit: u, dims, solve: j.right === 2 ? ['shade'] : ['trace', 'holes'], hero: [j.right === 2 ? '\\text{area}' : '\\text{the edges the job touches}'] };
  return choiceItem({ id: `which-${n}`, family: 'which', prompt: `${prompt0} You need ${S(j.job)}. What do you measure?`, board: '\\text{which part?}', picture: pic as never, solution: ['Read the job: does it cover a surface (area) or run along edges (a length)?', 'If it runs along edges: which ones? Only those count.'] }, R, opts);
};

// =========================================================================================== 24. job   [s3-context-model]
const genJob: Gen = (R, n) => {
  const u = pick(R, ['ft', 'm', 'yd']);
  const v = pick(R, ['deckAll', 'deckOut', 'window', 'path'] as const);
  let F: Fig, right: number, wr: NumWrong[], prompt: string, dims: DimShow[], sol: string[], solve: FigPicture['solve'];
  const r1 = (x: number) => Math.round(x * 10 + 1e-9) / 10;
  if (v === 'deckAll' || v === 'deckOut') {
    const m = mkHole(R); F = m.F; dims = [{ id: 'w' }, { id: 'h' }, { id: 'd' }];
    const all = v === 'deckAll';
    right = all ? r1(pnVal(F.perimeter)) : 2 * (m.w + m.h);
    prompt = all ? `A deck with a round hole for a tree gets rubber edging along EVERY edge, around the hole too. How much edging? Round to the nearest tenth.` : `A deck with a round hole for a tree gets a railing around the OUTSIDE only. How much railing?`;
    wr = all ? [{ v: 2 * (m.w + m.h), mc: MC.fixedBoundary, say: 'The job says every edge, around the hole too: add the hole’s edge, π × d.' }, { v: r1(pnVal(F.area)), mc: MC.areaPerim, say: 'That is the area. Edging runs along edges: a length.' }]
      : [{ v: r1(pnVal(F.perimeter)), mc: MC.ignoresContext, say: 'The railing only goes around the outside: leave the hole’s edge out.' }, { v: m.w * m.h, mc: MC.areaPerim, say: 'That is the area. A railing runs along an edge.' }];
    sol = all ? [`Outside: 2 × (${m.w} + ${m.h}) = ${2 * (m.w + m.h)}.`, `Hole: π × ${2 * m.r} ≈ ${r1(2 * m.r * Math.PI)}.`, `Edging ≈ ${right} ${u}.`] : [`Only the outside: 2 × (${m.w} + ${m.h}) = ${right} ${u}.`];
    solve = all ? ['trace', 'holes'] : ['trace'];
  } else if (v === 'window') {
    const m = mkRectSemi(R); F = rotFig(m.F, 1); dims = [{ id: 'w' }, { id: 'h' }];
    right = r1(pnVal(F.perimeter));
    prompt = `A window is a rectangle with a half circle on top. Trim goes all the way around the outside. How much trim? Round to the nearest tenth.`;
    wr = [{ v: r1(pnVal(F.perimeter) + m.h), mc: MC.seam, say: 'The line where the half circle meets the rectangle is inside the window: no trim there.' }, { v: r1(pnVal(F.area)), mc: MC.areaPerim, say: 'That is the glass, an area. Trim runs along the edge.' }];
    sol = [`Straight edges: ${m.w} + ${m.h} + ${m.w} = ${2 * m.w + m.h}.`, `Curved top: ½ × π × ${m.h} ≈ ${r1(m.r * Math.PI)}.`, `Trim ≈ ${right} ${u}.`];
    solve = ['parts', 'trace'];
  } else {
    const Rr = int(R, 6, 10), r = int(R, 2, Rr - 4); F = ring(Rr, r); dims = [{ id: 'R' }, { id: 'r' }];
    right = r1(pnVal(F.perimeter));
    prompt = `A round path goes around a round pond. Edging stones go along BOTH edges of the path. How long is the edging? Round to the nearest tenth.`;
    wr = [{ v: r1(2 * Rr * Math.PI), mc: MC.fixedBoundary, say: 'Both edges, the job says: the inside edge along the pond counts too.' }, { v: r1(pnVal(F.area)), mc: MC.areaPerim, say: 'That is the area of the path. Edging runs along its edges.' }];
    sol = [`Outside edge: 2π × ${Rr} ≈ ${r1(2 * Rr * Math.PI)}.`, `Inside edge: 2π × ${r} ≈ ${r1(2 * r * Math.PI)}.`, `Edging ≈ ${right} ${u}.`];
    solve = ['trace', 'holes'];
  }
  const pic: FigPicture = { kind: 'fig', fig: F, unit: u, dims, solve, hero: [`\\approx ${fmt(right)}${uT(u)}`] };
  return numItem({ id: `job-${n}`, family: 'job', prompt, board: '\\text{length} \\approx \\,?', unit: u, picture: pic as never, solution: sol }, right, `Yes: about ${fmt(right)} ${u}.`, wr.map(w => ({ ...w, tol: 0.051 })), 'Decide which edges the job runs along, add them, and round at the end.');
};

export const GENS: Record<FamilyId, Gen> = {
  shown: genShown, measure: genMeasure, inventory: genInventory, arcVs: genArcVs, arcEst: genArcEst, exact: genExact, readPi: genReadPi,
  partArea: genPartArea, arcLen: genArcLen, infer: genInfer, combine: genCombine, likeTerms: genLikeTerms, areaAdd: genAreaAdd,
  perimAdd: genPerimAdd, cutArea: genCutArea, cutPick: genCutPick, notch: genNotch, round: genRound, approx: genApprox, hole: genHole,
  critique: genCritique, counter: genCounter, which: genWhich, job: genJob,
};
void pnAdd; void pnEq;
