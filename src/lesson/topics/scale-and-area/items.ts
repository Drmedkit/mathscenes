// items.ts: practice families for "scale factor and area" (primary.ratios.scale-area, grade 7, 7.G.A.1).
// Every family gets the SUB-GOAL it practises (plan.ts) and uses that sub-goal's cases from the topic JSON; every
// typical wrong answer is classified with its catalogue id (math-curriculum-essentials/misconceptions.json) and
// registered as a probe (the test checks the classifier). Pure: no DOM, no canvas.
import { type Item, type Response, type Verdict, A, B, S, fr, fracValue, int, pick, shuffle } from '../../runtime/item';
import { type Q, qMul, rat, toQ } from '../../../core/math';
import { frame } from '../../../blocks/block';
import { type AreaPic, type Shape, type V, areaOf, fitsArea } from './areaMaths';
import type { AreaStep, LabelKey } from './AreaGrid';
import { endOnChoice } from '../../runtime/explain';

export type FamilyId =
  | 'stretchOne' | 'stretchTimes' | 'fillCopy' | 'copyArea' | 'twoFactors' | 'isScaled' | 'tileCount' | 'onlyRects'
  | 'unitSquares' | 'noWholeCopies' | 'areaFactor' | 'squaredMeans' | 'areaGiven' | 'areaFromDims' | 'fracFactor'
  | 'decFactor' | 'shrinkOrGrow' | 'areaRatio' | 'planRatio' | 'legendArea' | 'legendUnit' | 'rootK' | 'planBack'
  | 'whyFour' | 'onlyLength' | 'eachFactor' | 'twoStretches' | 'triFormula' | 'triWhy' | 'whichMeasure' | 'fieldJobs'
  | 'costArea' | 'pizzaDeal';
export const FAMILY_NAMES: Record<FamilyId, string> = {
  stretchOne: 'Stretch one side', stretchTimes: 'How many times as large?', fillCopy: 'Fill the copy', copyArea: 'Area of the copy',
  twoFactors: 'Two factors', isScaled: 'Scaled copy or not?', tileCount: 'Triangles and parallelograms', onlyRects: 'Not just rectangles',
  unitSquares: 'Figures made of squares', noWholeCopies: 'When whole copies don’t fit', areaFactor: 'The area factor', squaredMeans: 'What “squared” means',
  areaGiven: 'New area from the old', areaFromDims: 'New area from the sides', fracFactor: 'Fraction factors', decFactor: 'Decimal factors',
  shrinkOrGrow: 'Smaller or larger?', areaRatio: 'Length ratio to area ratio', planRatio: 'Drawing scale to area scale',
  legendArea: 'Real area from a plan', legendUnit: 'One square inch stands for…', rootK: 'Back to the length factor', planBack: 'Real area back to the plan',
  whyFour: 'Why four times?', onlyLength: 'Only one side doubles', eachFactor: 'Why k × k for any k', twoStretches: 'Two stretches',
  triFormula: 'Triangles by the formula', triWhy: 'Which line proves it?', whichMeasure: 'Times k or times k²?', fieldJobs: 'Walk around or cover?',
  costArea: 'What it costs', pizzaDeal: 'The better deal',
};

/** a picture the page draws: the AreaGrid model, the steps shown at the start, and what the worked solution adds */
export interface ItemPic {
  pic: AreaPic;
  show: AreaStep[];
  solve: { show: AreaStep[]; tex: string; swap?: { at: LabelKey; t: string }[]; rows?: boolean };
}
export interface AreaItem extends Item { family: FamilyId; pict?: ItemPic }
type Gen = (R: () => number, n: number, sg?: string) => AreaItem;

/** the practice picture frame (wider than the lesson's: the practice board is narrower) */
export const PF = frame(60, 70, 1180, 940);
/** typical wrong answers with the misconception each must be classified as (tests) */
export const PROBES = new WeakMap<Item, { r: Response; mc: string }[]>();

export const MC = {
  addSide: 'mc.area-perimeter.adds-side-increase-directly-to-area',
  additive: 'mc.area-perimeter.additive-reasoning-for-area-growth',
  byK: 'mc.area-perimeter.area-scales-by-length-factor',
  nonUniform: 'mc.area-perimeter.squares-factor-for-nonuniform-resize',
  onlyRects: 'mc.area-perimeter.limits-k-squared-rule-to-special-figures',
  pieces: 'mc.area-perimeter.counts-component-pieces-as-copies',
  wholeCopies: 'mc.area-perimeter.requires-whole-copy-tiling-for-area-scaling',
  makeSquare: 'mc.area-perimeter.reads-k-squared-as-making-a-square',
  timesTwo: 'mc.exponents-roots.power-as-base-times-exponent',
  factorAsArea: 'mc.area-perimeter.misapplies-area-factor-to-the-area',
  squareArea: 'mc.area-perimeter.squares-original-area-when-scaling',
  omitDigits: 'mc.decimals.omits-internal-fractional-digits',
  squareBigger: 'mc.exponents-roots.squaring-enlarges-rooting-shrinks',
  reverseRatio: 'mc.ratio-rate.reverses-scale-ratio-order',
  oneTerm: 'mc.area-perimeter.squares-only-one-term-of-area-ratio',
  linearUnits: 'mc.measurement-units.linear-factor-for-area',
  unitDim: 'mc.measurement-units.wrong-unit-dimension',
  rootHalf: 'mc.exponents-roots.root-as-dividing-by-index',
  ruleAsWhy: 'mc.reasoning-language.memorized-rule-as-justification',
  examples: 'mc.reasoning-language.examples-as-proof',
  drawnCase: 'mc.geometric-proof.proof-covers-only-drawn-case',
  someSides: 'mc.transformations.scales-only-some-sides',
  halfConst: 'mc.area-perimeter.scales-formula-constant',
  areaToLength: 'mc.area-perimeter.applies-area-factor-to-lengths',
} as const;

/** the scale factor (lime) */
const K = (v: string | number) => S(String(v));

// ---------- numbers ----------
const EPS = 1e-9;
const near = (a: number, b: number) => Math.abs(a - b) < EPS * Math.max(1, Math.abs(a), Math.abs(b));
const r3 = (v: number) => Math.round(v * 1000) / 1000;
/** a number as text: up to 3 decimals, thousands commas from 10,000 */
export const fmt = (v: number): string => { const r = r3(v); return Math.abs(r) >= 10000 ? r.toLocaleString('en-US') : String(r); };
/** a number in TeX ({,} keeps the comma tight) */
export const tn = (v: number): string => fmt(v).replace(/,/g, '{,}');
const money = (v: number) => (Number.isInteger(v) ? `$${fmt(v)}` : `$${v.toFixed(2)}`);
const qv = (q: Q) => q.p / q.q;
const qh = (q: Q) => (q.q === 1 ? String(q.p) : fr(q.p, q.q));
const qt = (q: Q) => (q.q === 1 ? String(q.p) : `\\tfrac{${q.p}}{${q.q}}`);
const sq = (q: Q) => qMul(q, q);
/** the value of a typed answer (a number box or a fraction box) */
export function valueOf(r: Response): number | null {
  if (r.kind === 'num') return Number.isFinite(r.v) ? r.v : null;
  if (r.kind === 'frac') { const v = fracValue(r); return v ? v[0] / v[1] : null; }
  return null;
}
const respOf = (v: number, input: 'num' | 'frac'): Response => {
  if (input === 'num') return { kind: 'num', v };
  const q = toQ(v, 400) ?? rat(Math.round(v * 1000), 1000);
  return { kind: 'frac', w: 0, n: q.p, d: q.q };
};

// ---------- item builders ----------
interface Wrong { v: number; mc?: string; say: string }
interface NumSpec {
  id: string; family: FamilyId; prompt: string; board: string; unit: string; ans: number; input?: 'num' | 'frac';
  wrongs: Wrong[]; ok: string; hint: string; solution: string[]; pict?: ItemPic | null;
}
function numItem(o: NumSpec): AreaItem {
  const input = o.input ?? 'num';
  // a wrong answer that equals the right one, or an earlier wrong one, is not a separate case
  const ws: Wrong[] = [];
  for (const w of o.wrongs) if (Number.isFinite(w.v) && w.v > 0 && !near(w.v, o.ans) && !ws.some(x => near(x.v, w.v))) ws.push(w);
  const item: AreaItem = {
    id: o.id, family: o.family, prompt: o.prompt, board: o.board, input, unit: o.unit,
    answer: respOf(o.ans, input), solution: o.solution, ...(o.pict ? { pict: o.pict } : {}),
    check(r: Response): Verdict {
      const v = valueOf(r);
      if (v === null) return { ok: false, say: 'Type a number first.' };
      if (near(v, o.ans)) return { ok: true, say: o.ok };
      const w = ws.find(x => near(x.v, v));
      if (w) return { ok: false, mc: w.mc, say: w.say };
      return { ok: false, say: o.hint };
    },
  };
  PROBES.set(item, ws.filter(w => w.mc).map(w => ({ r: respOf(w.v, input), mc: w.mc! })));
  return item;
}
interface Opt { t: string; ok?: boolean; mc?: string; say: string }
function choiceItem(R: () => number, o: { id: string; family: FamilyId; prompt: string; board: string; opts: Opt[]; solution: string[]; pict?: ItemPic | null }): AreaItem {
  const opts = shuffle(R, [...o.opts]);
  const item: AreaItem = {
    id: o.id, family: o.family, prompt: o.prompt, board: o.board, input: 'choice', choices: opts.map(x => x.t),
    answer: { kind: 'choice', i: opts.findIndex(x => x.ok) }, solution: endOnChoice(o.solution, opts.find(x => x.ok)!.t), ...(o.pict ? { pict: o.pict } : {}),
    check(r: Response): Verdict {
      if (r.kind !== 'choice') return { ok: false, say: 'Pick one answer.' };
      const x = opts[r.i];
      if (!x) return { ok: false, say: 'Pick one answer.' };
      return x.ok ? { ok: true, say: x.say } : { ok: false, mc: x.mc, say: x.say };
    },
  };
  PROBES.set(item, opts.map((x, i) => ({ x, i })).filter(({ x }) => !x.ok && x.mc).map(({ x, i }) => ({ r: { kind: 'choice', i } as Response, mc: x.mc! })));
  return item;
}
/** a ratio a : b; any equivalent ratio is right */
function pairItem(o: { id: string; family: FamilyId; prompt: string; board: string; ans: [number, number]; wrongs: { x: number; y: number; mc?: string; say: string }[]; prop: { x: number; y: number; mc: string; say: string }[]; ok: string; hint: string; solution: string[]; pict?: ItemPic | null }): AreaItem {
  const [ax, ay] = o.ans;
  const same = (x: number, y: number, p: number, q: number) => near(x * q, y * p);
  const ws = o.wrongs.filter((w, i) => !same(w.x, w.y, ax, ay) && !o.wrongs.slice(0, i).some(z => z.x === w.x && z.y === w.y));
  const ps = o.prop.filter(p => !same(p.x, p.y, ax, ay));
  const item: AreaItem = {
    id: o.id, family: o.family, prompt: o.prompt, board: o.board, input: 'pair', pairLead: '', pairOp: ':',
    answer: { kind: 'pair', x: ax, y: ay }, solution: o.solution, ...(o.pict ? { pict: o.pict } : {}),
    check(r: Response): Verdict {
      if (r.kind !== 'pair' || !Number.isFinite(r.x) || !Number.isFinite(r.y)) return { ok: false, say: 'Type both numbers.' };
      if (r.x > 0 && r.y > 0 && same(r.x, r.y, ax, ay)) return { ok: true, say: o.ok };
      const w = ws.find(z => near(z.x, r.x) && near(z.y, r.y));
      if (w) return { ok: false, mc: w.mc, say: w.say };
      const p = r.x > 0 && r.y > 0 ? ps.find(z => same(r.x, r.y, z.x, z.y)) : undefined;
      if (p) return { ok: false, mc: p.mc, say: p.say };
      return { ok: false, say: o.hint };
    },
  };
  const probes: { r: Response; mc: string }[] = [];
  for (const w of ws) if (w.mc && !ps.some(p => same(w.x, w.y, p.x, p.y) && p.mc !== w.mc)) probes.push({ r: { kind: 'pair', x: w.x, y: w.y }, mc: w.mc });
  for (const p of ps) if (!ws.some(w => same(w.x, w.y, p.x, p.y))) probes.push({ r: { kind: 'pair', x: p.x, y: p.y }, mc: p.mc });
  PROBES.set(item, probes);
  return item;
}

// ---------- pictures ----------
/** the picture if it is honest and readable in the practice frame (numbers dropped first, then null) */
function fit(pic0: AreaPic, show: AreaStep[], solve0: ItemPic['solve']): ItemPic | null {
  // the copy's squares are hidden until the worked solution (counting them would give the answer away)
  const pic: AreaPic = { ...pic0, hideCopyGrid: true }, solve = { ...solve0, show: ['cG' as const, ...solve0.show] };
  if (fitsArea(pic, PF)) return { pic, show, solve };
  if (pic.count) { const p2 = { ...pic, count: false }; if (fitsArea(p2, PF)) return { pic: p2, show, solve: { ...solve, show: solve.show.filter(s => s !== 'n') } }; }
  return null;
}
const rect = (w: number, h: number): Shape => ({ kind: 'rect', w, h });
const tilesSteps = (pic: AreaPic): AreaStep[] => (pic.count ? ['tiles', 'n'] : ['tiles']);
/** a rectangle and its kx-by-ky copy; the copies fly in only in the worked solution */
function rectPic(w: number, h: number, kx: number, ky: number, tex: string): ItemPic | null {
  const pic: AreaPic = { shape: rect(w, h), kx, ky, labels: { ow: `${w}`, oh: `${h}`, cw: fmt(kx * w), ch: fmt(ky * h) }, tile: Number.isInteger(kx) && Number.isInteger(ky) ? 'copies' : (kx === ky && Number.isInteger(1 / kx) ? 'reverse' : null), count: true };
  return fit(pic, ['grid', 'o', 'oL', 'c', 'cL'], { show: pic.tile ? tilesSteps(pic) : [], tex });
}
/** the schematic for any figure: ONE square unit and its k-by-k copy (the k x k unit squares fill it in the solution) */
function unitPic(k: number, tex: string, tilesOnSolve = true): ItemPic | null {
  const pic: AreaPic = { shape: rect(1, 1), kx: k, ky: k, labels: { ow: '1', oh: '1', cw: `${k}`, ch: `${k}` }, tile: 'copies', count: true };
  return fit(pic, ['grid', 'o', 'oL', 'c', 'cL'], { show: tilesOnSolve ? tilesSteps(pic) : [], tex });
}
/** a fraction factor p/q: a q-by-q square of grid units and its p-by-p copy; the copy's square count shows in the solution */
function fracPic(k: Q, tex: string): ItemPic | null {
  const { p, q } = k;
  const pic: AreaPic = { shape: rect(q, q), kx: p / q, ky: p / q, labels: { ow: `${q}`, cw: `${p}` }, area: { o: `${q * q}`, c: `${p * p}` }, tile: q === 1 ? 'copies' : p === 1 ? 'reverse' : null };
  return fit(pic, ['grid', 'o', 'oL', 'oA', 'c', 'cL'], { show: [...(pic.tile ? ['tiles' as const] : []), 'cA'], tex });
}
/** a length ratio a : b: a b-by-b square and an a-by-a square; both areas show only in the solution */
function ratioPic(a: number, b: number, tex: string): ItemPic | null {
  const pic: AreaPic = { shape: rect(b, b), kx: a / b, ky: a / b, labels: { ow: `${b}`, cw: `${a}` }, area: { o: `${b * b}`, c: `${a * a}` }, tile: a % b === 0 ? 'copies' : b % a === 0 ? 'reverse' : null };
  return fit(pic, ['grid', 'o', 'oL', 'c', 'cL'], { show: [...(pic.tile ? ['tiles' as const] : []), 'oA', 'cA'], tex });
}
/** a sketch (no grid, not to scale): one square unit of a drawing and the real square it stands for */
function sketchPic(oT: string, cT: string, cArea: string, tex: string): ItemPic | null {
  const pic: AreaPic = { shape: rect(1, 1), kx: 5, ky: 5, grid: false, labels: { ow: oT, oh: oT, cw: cT, ch: cT }, area: { c: cArea } };
  return fit(pic, ['grid', 'o', 'oL', 'c', 'cL'], { show: ['cA'], tex });
}

// ---------- contexts ----------
// lo / hi: the areas (square units) such a thing really has: no 14 sq ft patio, no 160 sq ft tablecloth
const THINGS = [
  { n: 'rug', u: 'ft', lo: 20, hi: 200 }, { n: 'garden bed', u: 'ft', lo: 10, hi: 150 }, { n: 'poster', u: 'in', lo: 300, hi: 1200 }, { n: 'photo', u: 'in', lo: 24, hi: 150 },
  { n: 'patio', u: 'ft', lo: 60, hi: 400 }, { n: 'banner', u: 'ft', lo: 6, hi: 100 }, { n: 'tablecloth', u: 'ft', lo: 15, hi: 60 }, { n: 'sticker', u: 'in', lo: 2, hi: 30 },
] as const;
const NAMES = ['Maya', 'Jordan', 'Riley', 'Sam', 'Ava', 'Leo', 'Nora', 'Eli', 'Zoe', 'Mateo'] as const;
const sqU = (u: string) => `sq ${u}`;

// =================== 1. stretch one dimension ===================
const stretchOne: Gen = (R, n) => {
  const w = int(R, 1, 6), h = int(R, 1, 6), k = pick(R, [2, 3] as const), along = R() < 0.5, th = pick(R, THINGS);
  const A0 = w * h, side = along ? w : h, ans = k * A0;
  const word = along ? 'length' : 'width', other = along ? 'width' : 'length';
  const story = R() < 0.5;
  const prompt = story
    ? `A ${th.n} is ${A(w)} ${th.u} long and ${A(h)} ${th.u} wide. A new one keeps the ${other} but makes the ${word} ${B(k * side)} ${th.u}. What is the new area?`
    : `A rectangle is ${A(w)} unit${w === 1 ? '' : 's'} long and ${A(h)} unit${h === 1 ? '' : 's'} wide. Only its ${word} is multiplied by ${K(k)}. What is the new area?`;
  const unit = story ? sqU(th.u) : 'sq units';
  const pic: AreaPic = { shape: rect(w, h), kx: along ? k : 1, ky: along ? 1 : k, labels: { ow: `${w}`, oh: `${h}`, cw: `${along ? k * w : w}`, ch: `${along ? h : k * h}` }, area: { o: `${A0}` }, tile: 'copies', count: true };
  return numItem({
    id: `stretchOne-${n}`, family: 'stretchOne', prompt, board: along ? `${w} \\times ${h} \\;\\to\\; ${k * w} \\times ${h}` : `${w} \\times ${h} \\;\\to\\; ${w} \\times ${k * h}`, unit, ans,
    wrongs: [
      { v: A0 + (k - 1) * side, mc: MC.addSide, say: `That adds the ${word}’s growth, ${(k - 1) * side}, to the area. But the new strip is ${(k - 1) * side} by ${along ? h : w}: it holds more than ${(k - 1) * side} squares.` },
      { v: k * k * A0, mc: MC.nonUniform, say: `Only the ${word} changed, so there is only one factor of ${k}: the new rectangle is ${k} copies of the old one, not ${k * k}.` },
    ],
    ok: `Yes: ${k} copies of the old ${A0}, so ${k} × ${A0} = ${ans} ${unit}.`, hint: `The new rectangle is ${k} copies of the old one, side by side. Count them.`,
    solution: [`Only the ${word} is × ${k}, so the new rectangle is ${k} copies of the old one in a ${along ? 'row' : 'column'}.`, `Area: ${k} × ${A0} = <b class="s">${ans}</b> ${unit}.`],
    pict: fit(pic, ['grid', 'o', 'oL', 'oA', 'c', 'cL'], { show: tilesSteps(pic), tex: `${k} \\times ${A0} = ${ans}` }),
  });
};
const stretchTimes: Gen = (R, n) => {
  const w = int(R, 1, 6), h = int(R, 1, 6), k = pick(R, [2, 3] as const), along = R() < 0.5;
  const word = along ? 'length' : 'width';
  const pic: AreaPic = { shape: rect(w, h), kx: along ? k : 1, ky: along ? 1 : k, labels: { ow: `${w}`, oh: `${h}`, cw: `${along ? k * w : w}`, ch: `${along ? h : k * h}` }, tile: 'copies', count: true };
  return numItem({
    id: `stretchTimes-${n}`, family: 'stretchTimes', prompt: `A ${A(w)} by ${A(h)} rectangle. Its ${word} is multiplied by ${K(k)}, the other side stays. How many times as large is the new area?`,
    board: `\\text{${word}} \\times ${k}`, unit: 'times as large', ans: k,
    wrongs: [{ v: k * k, mc: MC.nonUniform, say: `Squaring needs BOTH sides × ${k}. Here one side stays, so the area is × ${k}: ${k} copies side by side.` }],
    ok: `Yes: ${k} copies of the old rectangle fit, so the area is × ${k}.`, hint: 'Count how many copies of the old rectangle fit in the new one.',
    solution: [`One side × ${k}: the new rectangle is ${k} copies of the old one.`, `The area is multiplied by <b class="s">${k}</b>.`],
    pict: fit(pic, ['grid', 'o', 'oL', 'c', 'cL'], { show: tilesSteps(pic), tex: `\\text{area} \\times ${k}` }),
  });
};

// =================== 2. scale both dimensions ===================
function bothDims(R: () => number) {
  for (;;) {
    const k = pick(R, [2, 3, 4] as const), w = int(R, 1, 4), h = R() < 0.25 ? w : int(R, 1, 4);
    const pic: AreaPic = { shape: rect(w, h), kx: k, ky: k, labels: { ow: `${w}`, oh: `${h}`, cw: `${k * w}`, ch: `${k * h}` }, tile: 'copies', count: true };
    if (fitsArea({ ...pic, count: false }, PF)) return { k, w, h, pic };
  }
}
const fillCopy: Gen = (R, n) => {
  const { k, w, h, pic } = bothDims(R);
  return numItem({
    id: `fillCopy-${n}`, family: 'fillCopy', prompt: `A ${A(w)} by ${A(h)} rectangle is scaled by ${K(k)}: the copy is ${B(k * w)} by ${B(k * h)}. How many copies of the original fill the copy?`,
    board: `${w} \\times ${h} \\xrightarrow{\\times ${k}} ${k * w} \\times ${k * h}`, unit: 'copies', ans: k * k,
    wrongs: [
      { v: k, mc: MC.byK, say: `${k} copies make only one row: the length. The width is × ${k} too, so there are ${k} rows of ${k}.` },
      { v: 2 * k, mc: MC.additive, say: `That adds the factors, ${k} + ${k}. The copies come in ${k} rows of ${k}: multiply.` },
    ],
    ok: `Yes: ${k} rows of ${k} copies, ${k} × ${k} = ${k * k}.`, hint: `How many copies fit along the bottom? How many rows are there?`,
    solution: [`Along the length: ${k * w} ÷ ${w} = ${k} copies in a row.`, `Up the width: ${k * h} ÷ ${h} = ${k} rows.`, `${k} rows of ${k}: <b class="s">${k * k}</b> copies.`],
    pict: fit(pic, ['grid', 'o', 'oL', 'c', 'cL'], { show: tilesSteps(pic), tex: `${k} \\times ${k} = ${k * k}` }),
  });
};
const copyArea: Gen = (R, n) => {
  const { k, w, h, pic } = bothDims(R), A0 = w * h, ans = k * k * A0;
  const p2: AreaPic = { ...pic, area: { o: `${A0}` }, count: false };
  return numItem({
    id: `copyArea-${n}`, family: 'copyArea', prompt: `A ${A(w)} by ${A(h)} rectangle (area ${A(A0)} square units) is scaled by ${K(k)}. What is the area of the copy?`,
    board: `${w} \\times ${h} = ${A0},\\quad k = ${k}`, unit: 'sq units', ans,
    wrongs: [
      { v: k * A0, mc: MC.byK, say: `${k} × ${A0} fills only one row of copies. The copy has ${k} rows: ${k} × ${k} × ${A0}.` },
      { v: 2 * k * A0, mc: MC.additive, say: `That adds the factors, ${k} + ${k}. The length and the width each multiply the area by ${k}: ${k} × ${k}.` },
      { v: k * k, mc: MC.factorAsArea, say: `${k * k} is how many copies fit, not the area. Each copy has an area of ${A0}.` },
    ],
    ok: `Yes: ${k * k} copies of ${A0} square units.`, hint: `The copy is ${k * w} by ${k * h}. Or count copies of the original: ${k} rows of ${k}.`,
    solution: [`The copy is ${k * w} by ${k * h}: ${k} rows of ${k} copies of the original.`, `${k * k} × ${A0} = <b class="s">${ans}</b> square units (check: ${k * w} × ${k * h} = ${ans}).`],
    pict: fit(p2, ['grid', 'o', 'oL', 'oA', 'c', 'cL'], { show: ['tiles'], tex: `${k}^2 \\times ${A0} = ${ans}` }),
  });
};

// =================== 3. uniform scaling check ===================
function factorPair(R: () => number): [number, number] {
  const kind = int(R, 0, 2);
  if (kind === 0) { const a = int(R, 2, 4); return [a, a]; }
  if (kind === 1) { const a = int(R, 2, 4); return R() < 0.5 ? [a, 1] : [1, a]; }
  const a = int(R, 2, 4); let b = int(R, 2, 4); if (b === a) b = a === 4 ? 2 : a + 1;
  return R() < 0.5 ? [a, b] : [b, a];
}
const cps = (v: number) => (v === 1 ? '1 copy' : `${v} copies`), rws = (v: number) => (v === 1 ? '1 row' : `${v} rows`);
const twoFactors: Gen = (R, n) => {
  let a: number, b: number, w: number, h: number, pic: AreaPic;
  do { [a, b] = factorPair(R); w = int(R, 1, 3); h = int(R, 1, 3); pic = { shape: rect(w, h), kx: a, ky: b, labels: { ow: `${w}`, oh: `${h}`, cw: `${a * w}`, ch: `${b * h}` }, tile: 'copies', count: true }; } while (!fitsArea({ ...pic, count: false }, PF));
  const ans = a * b, big = Math.max(a, b);
  return numItem({
    id: `twoFactors-${n}`, family: 'twoFactors', prompt: `A ${A(w)} by ${A(h)} rectangle. Its length is multiplied by ${K(a)} and its width by ${K(b)}. The area is multiplied by what number?`,
    board: `\\text{length} \\times ${a},\\ \\text{width} \\times ${b}`, unit: '', ans,
    wrongs: [
      ...(a !== b ? [{ v: big * big, mc: MC.nonUniform, say: `Squaring works only when both sides use the same factor. Here it is ${a} × ${b}.` }] : []),
      { v: a + b, mc: MC.additive, say: `The factors multiply, they don’t add: ${cps(a)} in a row, ${rws(b)}.` },
    ],
    ok: `Yes: ${a} × ${b} = ${ans}.${a === b ? ' Both factors are the same, so it is a scaled copy.' : ' The factors differ, so it is stretched, not a scaled copy.'}`,
    hint: 'Count copies of the original: how many in a row, how many rows?',
    solution: [`The length gives ${cps(a)} in a row; the width gives ${rws(b)}.`, `The area factor is ${a} × ${b} = <b class="s">${ans}</b>.`, a === b ? 'Same factor both ways: a scaled copy.' : 'Different factors: not a scaled copy.'],
    pict: fit(pic, ['grid', 'o', 'oL', 'c', 'cL'], { show: tilesSteps(pic), tex: `${a} \\times ${b} = ${ans}` }),
  });
};
const isScaled: Gen = (R, n) => {
  let [a, b] = factorPair(R);
  const w = int(R, 1, 4), h = int(R, 1, 4);
  const uni = a === b;
  if (uni && a === 2) { a = b = pick(R, [3, 4] as const); }
  const opts: Opt[] = uni ? [
    { t: `A scaled copy; the area is × ${a * a}`, ok: true, say: `Yes: one factor, ${a}, for every length, and ${a} × ${a} = ${a * a}.` },
    { t: `Not a scaled copy; the area is × ${a * a}`, say: `Both sides use the same factor, ${a}: that IS a scaled copy.` },
    { t: `A scaled copy; the area is × ${a}`, mc: MC.byK, say: `The length multiplies the area by ${a}, and the width by ${a} again: × ${a * a}.` },
    { t: `A scaled copy; the area is × ${2 * a}`, mc: MC.additive, say: `The two factors multiply: ${a} × ${a}, not ${a} + ${a}.` },
  ] : [
    { t: `Not a scaled copy; the area is × ${a * b}`, ok: true, say: `Yes: the factors differ, so it is stretched. The area is × ${a} × ${b} = ${a * b}.` },
    { t: `A scaled copy; the area is × ${a * b}`, say: `A scaled copy needs ONE factor for every length. ${a} and ${b} differ.` },
    { t: `Not a scaled copy; the area is × ${Math.max(a, b) ** 2}`, mc: MC.nonUniform, say: `Squaring only works when both sides use the same factor. Multiply the two: ${a} × ${b}.` },
    { t: `Not a scaled copy; the area is × ${a + b}`, mc: MC.additive, say: `The factors multiply, they don’t add: ${a} × ${b} = ${a * b}.` },
  ];
  return choiceItem(R, {
    id: `isScaled-${n}`, family: 'isScaled', pict: rectPic(w, h, a, b, `${a} \\times ${b} = ${a * b}`), prompt: `A ${A(w)} by ${A(h)} rectangle is resized: the length × ${K(a)}, the width × ${K(b)}. Which is true?`,
    board: `${w} \\times ${h} \\;\\to\\; ${a * w} \\times ${b * h}`, opts,
    solution: [`Area factor = length factor × width factor = ${a} × ${b} = <b class="s">${a * b}</b>.`, uni ? `One factor for both: a scaled copy.` : `Two different factors: stretched, not a scaled copy.`],
  });
};

// =================== 4. triangles and parallelograms ===================
function shapeK(R: () => number): { S: Shape; k: number; name: string; names: string; pic: AreaPic } {
  for (;;) {
    const k = pick(R, [2, 3] as const), t = int(R, 0, 2);
    const S: Shape = t === 0 ? { kind: 'tri', w: int(R, 2, 4), h: int(R, 2, 3), a: 0 }
      : t === 1 ? (() => { const w = int(R, 2, 4); return { kind: 'tri', w, h: int(R, 2, 3), a: int(R, 1, w - 1) } as Shape; })()
        : { kind: 'para', w: int(R, 2, 3), h: int(R, 1, 2), s: int(R, 1, 2) };
    const pic: AreaPic = { shape: S, kx: k, ky: k, tile: 'copies', count: true };
    if (fitsArea({ ...pic, count: false }, PF)) return { S, k, pic, name: S.kind === 'tri' ? 'triangle' : 'parallelogram', names: S.kind === 'tri' ? 'triangles' : 'parallelograms' };
  }
}
const tileCount: Gen = (R, n) => {
  const { S: Sh, k, name, names, pic } = shapeK(R);
  return numItem({
    id: `tileCount-${n}`, family: 'tileCount', prompt: `This ${name} (area ${A(areaOf(Sh))} square units) is scaled by ${K(k)}. How many copies of the small ${name} fill the big one?`,
    board: `k = ${k}`, unit: names, ans: k * k,
    wrongs: [
      { v: k, mc: MC.byK, say: `${k} copies only reach along the bottom. The copies fill ${k} rows up the ${name}${Sh.kind === 'tri' ? ', some turned around' : ''}: ${k} × ${k}.` },
      { v: 2 * k, mc: MC.additive, say: `The factors multiply: ${k} × ${k}, not ${k} + ${k}.` },
    ],
    ok: `Yes: ${k * k} copies, ${k} × ${k}. Not just rectangles work this way.`, hint: `Fill the big ${name} with copies of the small one${Sh.kind === 'tri' ? '; some copies are turned upside down' : ''}.`,
    solution: [`Every length × ${k}: ${k} copies along the bottom, ${k} rows in all${Sh.kind === 'tri' ? ' (the gaps are copies turned upside down)' : ''}.`, `${k} × ${k} = <b class="s">${k * k}</b> copies.`],
    pict: fit(pic, ['grid', 'o', 'c'], { show: tilesSteps(pic), tex: `${k} \\times ${k} = ${k * k}` }),
  });
};
const onlyRects: Gen = (R, n) => {
  const { S: Sh, k, name, names, pic } = shapeK(R), who = pick(R, NAMES), A0 = areaOf(Sh);
  return choiceItem(R, {
    id: `onlyRects-${n}`, family: 'onlyRects', prompt: `${who} scales this ${name} (area ${A(A0)} square units) by ${K(k)} and says: “The k × k rule is only for rectangles, so my ${name}’s area is × ${k}.” What is the area of the copy?`,
    board: `k = ${k}`, opts: [
      { t: `${k * k * A0} square units: ${k * k} copies fill it`, ok: true, say: `Yes: ${k * k} small ${names} fill the big one, so the area is × ${k * k} for this shape too.` },
      { t: `${k * A0} square units: the k × k rule is only for rectangles`, mc: MC.onlyRects, say: `Watch the copies fill it: ${k * k} small ${names}. The rule holds for every shape, not only rectangles.` },
      { t: `${2 * k * A0} square units: ${k} + ${k} times as much`, mc: MC.additive, say: `The factors multiply, they don’t add: ${k} × ${k} = ${k * k} copies.` },
    ], solution: [`${k * k} copies of the small ${name} fill the big one.`, `${k * k} × ${A0} = <b class="s">${k * k * A0}</b> square units.`],
    pict: fit({ ...pic, area: undefined }, ['grid', 'o', 'c'], { show: tilesSteps(pic), tex: `${k * k} \\times ${A0} = ${k * k * A0}` }),
  });
};

// =================== 5. figures made of parts ===================
const POLYS: { name: string; cells: V[] }[] = [
  { name: 'L-shape', cells: [[0, 0], [1, 0], [0, 1]] },
  { name: 'L-shape', cells: [[0, 0], [1, 0], [2, 0], [0, 1]] },
  { name: 'L-shape', cells: [[0, 0], [1, 0], [0, 1], [0, 2]] },
  { name: 'T-shape', cells: [[0, 1], [1, 1], [2, 1], [1, 0]] },
  { name: 'step shape', cells: [[0, 0], [1, 0], [1, 1], [2, 1]] },
  { name: 'L-shape', cells: [[0, 0], [1, 0], [2, 0], [2, 1]] },
  { name: 'T-shape', cells: [[0, 0], [1, 0], [2, 0], [1, 1]] },
  { name: 'plus shape', cells: [[1, 0], [0, 1], [1, 1], [2, 1], [1, 2]] },
];
const unitSquares: Gen = (R, n) => {
  let P = pick(R, POLYS), k = pick(R, [2, 3] as const);
  let pic: AreaPic = { shape: { kind: 'cells', cells: P.cells }, kx: k, ky: k, tile: 'groups' };
  while (!fitsArea(pic, PF)) { P = pick(R, POLYS); k = 2; pic = { shape: { kind: 'cells', cells: P.cells }, kx: k, ky: k, tile: 'groups' }; }
  const c = P.cells.length, askCount = R() < 0.5;
  if (askCount) return numItem({
    id: `unitSquares-${n}`, family: 'unitSquares', prompt: `This ${P.name} is made of ${A(c)} unit squares. It is scaled by ${K(k)}. How many unit squares make the copy?`,
    board: `${c}\\text{ squares},\\ k = ${k}`, unit: 'unit squares', ans: c * k * k,
    wrongs: [
      { v: c * k, mc: MC.byK, say: `Each unit square becomes a ${k} by ${k} group, not ${k} squares: ${k} × ${k} = ${k * k} each.` },
      { v: c + 2 * k, mc: MC.additive, say: `Each unit square becomes ${k} × ${k} squares. Multiply, then count all ${c} groups.` },
    ],
    ok: `Yes: every one of the ${c} squares becomes ${k * k}: ${c} × ${k * k} = ${c * k * k}.`, hint: `Each unit square of the ${P.name} becomes a ${k} by ${k} group in the copy.`,
    solution: [`Each unit square becomes a ${k}-by-${k} group: ${k * k} squares.`, `${c} groups × ${k * k} = <b class="s">${c * k * k}</b> unit squares.`],
    pict: fit(pic, ['grid', 'o', 'c'], { show: ['groups'], tex: `${c} \\times ${k}^2 = ${c * k * k}` }),
  });
  return numItem({
    id: `unitSquares-${n}`, family: 'unitSquares', prompt: `This ${P.name} (${A(c)} unit squares) is scaled by ${K(k)}. The area of the copy is how many times the area of the ${P.name}?`,
    board: `${c}\\text{ squares},\\ k = ${k}`, unit: 'times as large', ans: k * k,
    wrongs: [
      { v: c * k * k, mc: MC.pieces, say: `${c * k * k} counts unit squares, not ${P.name}s. Each of the ${c} squares became ${k * k}, so the whole area is × ${k * k}.` },
      { v: k, mc: MC.byK, say: `Each square became a ${k} by ${k} group: × ${k * k}, not × ${k}.` },
    ],
    ok: `Yes: every part is × ${k * k}, so the whole ${P.name} is × ${k * k}.`, hint: 'Every unit square grows the same way. How many squares does one become?',
    solution: [`Each unit square becomes ${k} × ${k} = ${k * k} squares.`, `Every part is × ${k * k}, so the whole area is × <b class="s">${k * k}</b> (${c} → ${c * k * k} squares).`],
    pict: fit(pic, ['grid', 'o', 'c'], { show: ['groups'], tex: `${c * k * k} \\div ${c} = ${k * k}` }),
  });
};
const noWholeCopies: Gen = (R, n) => {
  const th = pick(R, [{ s: 'circle', p: 'circles' }, { s: 'heart-shaped sticker', p: 'hearts' }, { s: 'round mirror', p: 'mirrors' }, { s: 'star-shaped logo', p: 'stars' }, { s: 'leaf-shaped tile', p: 'leaves' }] as const);
  const A0 = int(R, 3, 20), k = pick(R, [2, 3, 4] as const), u = pick(R, ['in', 'cm', 'ft'] as const);
  return choiceItem(R, {
    id: `noWholeCopies-${n}`, family: 'noWholeCopies', pict: unitPic(k, `${k}^2 \\times ${A0} = ${k * k * A0}`), prompt: `A ${th.s} has an area of ${A(A0)} sq ${u}. Every length is multiplied by ${K(k)}. Whole ${th.p} can’t fill the big one without gaps. What is its area?`,
    board: `${A0}\\text{ sq ${u}},\\ k = ${k}`, opts: [
      { t: `${k * k * A0} sq ${u}`, ok: true, say: `Yes. Cut it into tiny squares: each one grows to ${k} by ${k}, so the area is × ${k * k}.` },
      { t: `${k * A0} sq ${u}`, mc: MC.byK, say: `The length and the width both grow: × ${k} and × ${k} again, so × ${k * k}.` },
      { t: 'You can’t tell, because whole copies don’t fit', mc: MC.wholeCopies, say: `You can tell: think of it as tiny squares. Each grows to ${k} by ${k}, so the area is × ${k * k}, copies or not.` },
    ], solution: [`Think of the ${th.s} as many tiny squares. Every tiny square becomes ${k} × ${k} = ${k * k} squares.`, `${k * k} × ${A0} = <b class="s">${k * k * A0}</b> sq ${u}.`],
  });
};

// =================== 6. area factor (whole k) ===================
const SCALED = ['a photo', 'a logo', 'a garden plan', 'a map', 'a poster', 'a floor plan', 'a flag'] as const;
const areaFactor: Gen = (R, n) => {
  const k = R() < 0.08 ? pick(R, [11, 12] as const) : int(R, 1, 10), what = pick(R, SCALED);
  return numItem({
    id: `areaFactor-${n}`, family: 'areaFactor', pict: unitPic(k, `${k} \\times ${k} = ${k * k}`), prompt: `Every length of ${what} is multiplied by ${K(k)}. The area is multiplied by what number?`,
    board: `k = ${k}`, unit: '', ans: k * k,
    wrongs: [
      { v: k, mc: MC.byK, say: k === 1 ? 'Here it happens to match.' : `The length multiplies the area by ${k}, and the width by ${k} again: ${k} × ${k}.` },
      { v: 2 * k, mc: MC.timesTwo, say: `k² means ${k} × ${k}, not ${k} × 2.` },
    ],
    ok: `Yes: ${k}² = ${k} × ${k} = ${k * k}.${k === 1 ? ' Same size, same area.' : ''}`, hint: `The area factor is k × k.`,
    solution: [`The length is × ${k}, and the width is × ${k} again.`, `Area factor = k × k = ${k} × ${k} = <b class="s">${k * k}</b>.`],
  });
};
const squaredMeans: Gen = (R, n) => {
  const k = int(R, 3, 9), w = int(R, 2, 9), h = int(R, 2, 9), th = pick(R, THINGS);
  return choiceItem(R, {
    id: `squaredMeans-${n}`, family: 'squaredMeans', pict: unitPic(k, `${k}^2 = ${k} \\times ${k} = ${k * k}`), prompt: `A ${A(w)} ${th.u} by ${A(h)} ${th.u} ${th.n} is scaled by ${K(k)}. Its area is multiplied by ${k}². What does ${k}² mean here?`,
    board: `\\text{area} \\times ${k}^2`, opts: [
      { t: `${k} × ${k} = ${k * k}: the area is ${k * k} times as large`, ok: true, say: `Yes: ${k}² = ${k} × ${k} = ${k * k}.` },
      { t: `The ${th.n} becomes a square`, mc: MC.makeSquare, say: `A scaled copy keeps its shape: it stays ${w} by ${h} in shape. “Squared” means ${k} × ${k}.` },
      { t: `${k} × 2 = ${2 * k}: the area is ${2 * k} times as large`, mc: MC.timesTwo, say: `${k}² means ${k} × ${k} = ${k * k}, not ${k} × 2.` },
    ], solution: [`${k}² = ${k} × ${k} = <b class="s">${k * k}</b>: one ${k} for the length, one for the width.`],
  });
};

// =================== 7. area of the copy ===================
const areaGiven: Gen = (R, n) => {
  // big factors (× 6 and up) keep the area small enough to multiply by hand
  const k = int(R, 2, 10), th = pick(R, k <= 5 ? THINGS : THINGS.filter(t => t.lo <= 40));
  const A0 = int(R, th.lo, k <= 5 ? th.hi : Math.min(th.hi, 40)), ans = k * k * A0, u = sqU(th.u);
  return numItem({
    id: `areaGiven-${n}`, family: 'areaGiven', pict: unitPic(k, `${k}^2 \\times ${A0} = ${tn(ans)}`), prompt: `A ${th.n} has an area of ${A(A0)} ${u}. A scaled copy has every length × ${K(k)}. What is the area of the copy?`,
    board: `${A0}\\text{ ${u}},\\ k = ${k}`, unit: u, ans,
    wrongs: [
      { v: k * A0, mc: MC.byK, say: `That multiplies the area by ${k}. Lengths × ${k} multiply the area by ${k} × ${k} = ${k * k}.` },
      { v: k * k, mc: MC.factorAsArea, say: `${k * k} is the area factor, not the area. Multiply it by the old area, ${A0}.` },
      { v: A0 * A0, mc: MC.squareArea, say: `Square the scale factor, not the area: ${k}² × ${A0}.` },
      { v: 2 * k * A0, mc: MC.timesTwo, say: `${k}² means ${k} × ${k} = ${k * k}, not ${k} × 2.` },
    ],
    ok: `Yes: ${k * k} × ${A0} = ${ans} ${u}.`, hint: `New area = k² × old area.`,
    solution: [`Area factor: ${k}² = ${k * k}.`, `${k * k} × ${A0} = <b class="s">${fmt(ans)}</b> ${u}.`],
  });
};
const areaFromDims: Gen = (R, n) => {
  const k = int(R, 2, 5), w = int(R, 2, 9), h = int(R, 2, 9), A0 = w * h, ans = k * k * A0;
  const pic: AreaPic = { shape: rect(w, h), kx: k, ky: k, labels: { ow: `${w}`, oh: `${h}` }, area: { o: `${A0}` }, tile: 'copies' };
  return numItem({
    id: `areaFromDims-${n}`, family: 'areaFromDims', prompt: `A rectangle is ${A(w)} in by ${A(h)} in. It is scaled by ${K(k)}. What is the area of the copy?`,
    board: `${w} \\times ${h},\\ k = ${k}`, unit: 'sq in', ans,
    wrongs: [
      { v: k * A0, mc: MC.byK, say: `${k} × ${A0} counts one row of copies. There are ${k} rows: ${k * k} × ${A0}.` },
      { v: k * k, mc: MC.factorAsArea, say: `${k * k} is the area factor. Multiply it by the old area, ${w} × ${h} = ${A0}.` },
      { v: A0 * A0, mc: MC.squareArea, say: `Square the scale factor, not the area: ${k}² × ${A0}.` },
      { v: k * w + k * h, say: `That adds the new sides. Area is length × width: ${k * w} × ${k * h}.` },
    ],
    ok: `Yes: ${k * w} × ${k * h} = ${ans}, and ${k * k} × ${A0} = ${ans}.`, hint: `Find the old area first, then multiply by k².`,
    solution: [`Old area: ${w} × ${h} = ${A0} sq in.`, `× ${k}² = × ${k * k}: <b class="s">${ans}</b> sq in (or ${k * w} × ${k * h}).`],
    pict: fit(pic, ['grid', 'o', 'oL', 'oA'], { show: ['c', 'tiles'], tex: `${k * k} \\times ${A0} = ${ans}` }),
  });
};

// =================== 8. fraction and decimal factors ===================
const FRACS: Q[] = [rat(1, 2), rat(1, 3), rat(2, 3), rat(3, 4), rat(3, 2), rat(4, 3), rat(5, 2)];
const fracFactor: Gen = (R, n) => {
  const k = pick(R, FRACS), k2 = sq(k), what = pick(R, SCALED), red = qv(k) < 1;
  if (R() < 0.5) {
    return numItem({
      id: `fracFactor-${n}`, family: 'fracFactor', pict: fracPic(k, `(${qt(k)})^2 = ${qt(k2)}`), prompt: `Every length of ${what} is multiplied by ${K(qh(k))} (${red ? 'a reduction' : 'an enlargement'}). The area is multiplied by what number?`,
      board: `k = ${qt(k)}`, unit: '', input: 'frac', ans: qv(k2),
      wrongs: [
        { v: qv(k), mc: MC.byK, say: `Lengths × ${qh(k)} multiply the area by ${qh(k)} and by ${qh(k)} again.` },
        { v: 2 * qv(k), mc: MC.timesTwo, say: `(${qh(k)})² means ${qh(k)} × ${qh(k)}, not ${qh(k)} × 2.` },
        { v: (k.p * k.p) / k.q, say: `Square the whole fraction: the top AND the bottom. (${qh(k)})² = ${qh(k2)}.` },
      ],
      ok: `Yes: ${qh(k)} × ${qh(k)} = ${qh(k2)}.${red ? ' Squaring a number less than 1 makes it smaller.' : ''}`, hint: 'Multiply the fraction by itself: top × top, bottom × bottom.',
      solution: [`The length is × ${qh(k)}, and the width is × ${qh(k)} again.`, `(${qh(k)})² = ${qh(k)} × ${qh(k)} = <b class="s">${qh(k2)}</b>${k2.q !== 1 ? ` (= ${fmt(qv(k2))})` : ''}.`],
    });
  }
  // a whole number of k² denominators, inside the thing's real size
  const th = pick(R, THINGS.filter(t => Math.floor(t.hi / k2.q) >= Math.max(1, Math.ceil(t.lo / k2.q))));
  const A0 = k2.q * int(R, Math.max(1, Math.ceil(th.lo / k2.q)), Math.min(Math.floor(th.hi / k2.q), Math.max(Math.ceil(th.lo / k2.q), 12))), ans = A0 * qv(k2), u = sqU(th.u);
  return numItem({
    id: `fracFactor-${n}`, family: 'fracFactor', pict: fracPic(k, `${qt(k2)} \\times ${A0} = ${tn(ans)}`), prompt: `A ${th.n} has an area of ${A(A0)} ${u}. Every length is multiplied by ${K(qh(k))}. What is the new area?`,
    board: `${A0}\\text{ ${u}},\\ k = ${qt(k)}`, unit: u, ans,
    wrongs: [
      { v: A0 * qv(k), mc: MC.byK, say: `That multiplies the area by ${qh(k)} once. It is × ${qh(k)} × ${qh(k)} = ${qh(k2)}.` },
      { v: A0 * 2 * qv(k), mc: MC.timesTwo, say: `(${qh(k)})² means ${qh(k)} × ${qh(k)} = ${qh(k2)}, not ${qh(k)} × 2.` },
    ],
    ok: `Yes: ${qh(k2)} × ${A0} = ${fmt(ans)} ${u}.`, hint: `New area = k² × old area, and k² = ${qh(k)} × ${qh(k)}.`,
    solution: [`Area factor: (${qh(k)})² = ${qh(k2)}.`, `${qh(k2)} × ${A0} = <b class="s">${fmt(ans)}</b> ${u}.`],
  });
};
const DECS = [0.5, 1.5, 2.5, 0.2, 0.3, 0.4, 0.6, 1.2, 1.1, 0.8] as const;
/** the slip that drops fractional digits before the last one (2.25 -> 2.5) */
const omitInner = (v: number): number => { const s = fmt(v), m = /^(\d+)\.(\d+)$/.exec(s); return m && m[2]!.length >= 2 ? Number(`${m[1]}.${m[2]!.slice(-1)}`) : NaN; };
const decFactor: Gen = (R, n) => {
  const k = pick(R, DECS), k2 = r3(k * k), what = pick(R, SCALED);
  return numItem({
    id: `decFactor-${n}`, family: 'decFactor', pict: fracPic(toQ(k)!, `${k}^2 = ${tn(k2)}`), prompt: `Every length of ${what} is multiplied by ${K(k)}. The area is multiplied by what number?`,
    board: `k = ${k}`, unit: '', ans: k2,
    wrongs: [
      { v: k, mc: MC.byK, say: `The area is × ${k} for the length and × ${k} again for the width: ${k} × ${k}.` },
      { v: 2 * k, mc: MC.timesTwo, say: `${k}² means ${k} × ${k}, not ${k} × 2.` },
      { v: omitInner(k2), mc: MC.omitDigits, say: `Check the decimal places: ${k} × ${k} has two decimal places, ${fmt(k2)}.` },
    ],
    ok: `Yes: ${k} × ${k} = ${fmt(k2)}.${k < 1 ? ' Smaller than the factor: squaring a number below 1 shrinks it.' : ''}`, hint: `Multiply ${k} × ${k}. One decimal place times one decimal place gives two.`,
    solution: [`${k} × ${k}: ${Math.round(k * 10)} × ${Math.round(k * 10)} = ${Math.round(k * 10) ** 2}, with two decimal places.`, `The area is × <b class="s">${fmt(k2)}</b>.`],
  });
};
const shrinkOrGrow: Gen = (R, n) => {
  const k = pick(R, [rat(1, 2), rat(1, 3), rat(2, 3), rat(3, 4), rat(2, 5), rat(3, 2), rat(5, 2), rat(4, 3)]), k2 = sq(k), red = qv(k) < 1, th = pick(R, THINGS);
  const opts: Opt[] = red ? [
    { t: `Smaller: the area is × ${qh(k2)}`, ok: true, say: `Yes: ${qh(k)} × ${qh(k)} = ${qh(k2)}, less than 1, so the area shrinks.` },
    { t: `Larger: squaring makes a number bigger`, mc: MC.squareBigger, say: `Squaring a number less than 1 makes it smaller: ${qh(k)} × ${qh(k)} = ${qh(k2)}.` },
    { t: `Smaller: the area is × ${qh(k)}`, mc: MC.byK, say: `Both the length and the width shrink: × ${qh(k)} twice, so × ${qh(k2)}.` },
  ] : [
    { t: `Larger: the area is × ${qh(k2)}`, ok: true, say: `Yes: ${qh(k)} × ${qh(k)} = ${qh(k2)}, more than 1, so the area grows.` },
    { t: `Smaller: a fraction makes it smaller`, say: `${qh(k)} is more than 1, so every length grows, and the area too.` },
    { t: `Larger: the area is × ${qh(k)}`, mc: MC.byK, say: `Both the length and the width grow: × ${qh(k)} twice, so × ${qh(k2)}.` },
  ];
  return choiceItem(R, {
    id: `shrinkOrGrow-${n}`, family: 'shrinkOrGrow', pict: fracPic(k, `(${qt(k)})^2 = ${qt(k2)}`), prompt: `A ${th.n} is scaled by ${K(qh(k))}. Is the copy’s area smaller or larger, and by what factor?`,
    board: `k = ${qt(k)}`, opts,
    solution: [`k = ${qh(k)} is ${red ? 'less' : 'more'} than 1: a${red ? ' reduction' : 'n enlargement'}.`, `Area factor (${qh(k)})² = <b class="s">${qh(k2)}</b>.`],
  });
};

// =================== 9. ratios ===================
const RATIOS: [number, number][] = [[1, 2], [2, 3], [3, 2], [2, 1], [3, 4], [4, 3], [1, 3], [3, 1], [2, 5], [5, 2], [3, 5], [4, 5]];
const areaRatio: Gen = (R, n) => {
  const [a, b] = pick(R, RATIOS), th = pick(R, ['two similar triangles', 'two scaled rectangles', 'a photo and its print', 'a model and the real patio', 'two similar flags'] as const);
  return pairItem({
    id: `areaRatio-${n}`, family: 'areaRatio', pict: ratioPic(a, b, `${a}^2 : ${b}^2 = ${a * a} : ${b * b}`), prompt: `For ${th}, lengths compare new : original = ${B(a)} : ${A(b)}. What is new area : original area?`,
    board: `\\text{lengths } ${a} : ${b}`, ans: [a * a, b * b],
    wrongs: [
      { x: a * a, y: b, mc: MC.oneTerm, say: `Square both terms: ${a}² : ${b}² = ${a * a} : ${b * b}.` },
      { x: a, y: b * b, mc: MC.oneTerm, say: `Square both terms: ${a}² : ${b}² = ${a * a} : ${b * b}.` },
      { x: 2 * a, y: 2 * b, mc: MC.timesTwo, say: `Squaring means ${a} × ${a} and ${b} × ${b}, not × 2.` },
    ],
    prop: [
      { x: a, y: b, mc: MC.byK, say: `Areas don’t keep the length ratio. Each term is squared: ${a * a} : ${b * b}.` },
      { x: b * b, y: a * a, mc: MC.reverseRatio, say: `Keep the order: new first, then original. ${a * a} : ${b * b}.` },
    ],
    ok: `Yes: ${a}² : ${b}² = ${a * a} : ${b * b}.`, hint: 'Square each term of the length ratio, and keep the order.',
    solution: [`Areas compare as the squares of the lengths.`, `${a}² : ${b}² = <b class="s">${a * a}</b> : <b class="s">${b * b}</b> (new : original).`],
  });
};
const planRatio: Gen = (R, n) => {
  const s = pick(R, [100, 50, 10, 20, 25, 200] as const), th = pick(R, ['A floor plan', 'A model of a park', 'A school map', 'A model train layout'] as const);
  return pairItem({
    id: `planRatio-${n}`, family: 'planRatio', pict: sketchPic('1', fmt(s), tn(s * s), `1 : ${tn(s)}^2 = 1 : ${tn(s * s)}`), prompt: `${th} has the scale drawing : actual = ${B(1)} : ${A(fmt(s))}. What is drawing area : actual area?`,
    board: `1 : ${tn(s)}`, ans: [1, s * s],
    wrongs: [{ x: 1, y: 2 * s, mc: MC.timesTwo, say: `${fmt(s)}² means ${fmt(s)} × ${fmt(s)}, not × 2.` }],
    prop: [
      { x: 1, y: s, mc: MC.byK, say: `1 unit of length stands for ${fmt(s)}, so 1 square unit stands for ${fmt(s)} × ${fmt(s)}.` },
      { x: s * s, y: 1, mc: MC.reverseRatio, say: `Keep the order: drawing first, then actual. 1 : ${fmt(s * s)}.` },
    ],
    ok: `Yes: 1 : ${fmt(s)}² = 1 : ${fmt(s * s)}.`, hint: 'Square both terms of the scale.',
    solution: [`One square unit on the drawing is ${fmt(s)} by ${fmt(s)} real units.`, `Drawing : actual area = <b class="s">1</b> : <b class="s">${fmt(s * s)}</b>.`],
  });
};

// =================== 10. legends ===================
interface Legend { d: string; a: string; s: number; du: string; au: string; plan: string }
const LEGENDS: Legend[] = [
  { d: '1 in', a: '4 ft', s: 4, du: 'in', au: 'ft', plan: 'floor plan' },
  { d: '1 in', a: '8 ft', s: 8, du: 'in', au: 'ft', plan: 'floor plan' },
  { d: '¼ in', a: '1 ft', s: 4, du: 'in', au: 'ft', plan: 'floor plan' },
  { d: '1 in', a: '50 mi', s: 50, du: 'in', au: 'mi', plan: 'map' },
  { d: '1 cm', a: '2 m', s: 2, du: 'cm', au: 'm', plan: 'plan' },
  { d: '1 in', a: '10 ft', s: 10, du: 'in', au: 'ft', plan: 'yard plan' },
  { d: '1 in', a: '3 ft', s: 3, du: 'in', au: 'ft', plan: 'room plan' },
];
const legendArea: Gen = (R, n) => {
  const L = pick(R, LEGENDS), big = L.s >= 50, w = int(R, 1, big ? 4 : 6), h = int(R, 1, big ? 3 : 5), ans = w * L.s * h * L.s;
  const what = L.plan === 'map' ? 'A lake region' : L.plan === 'yard plan' ? 'A lawn' : 'A room';
  const pic: AreaPic = { shape: rect(w, h), kx: 1, ky: 1, solo: true, labels: { ow: `${w}\\text{ ${L.du}}`, oh: `${h}\\text{ ${L.du}}` } };
  return numItem({
    id: `legendArea-${n}`, family: 'legendArea', prompt: `A ${L.plan} has the legend ${B(`${L.d} : ${L.a}`)}. ${what} on it is a ${A(w)} ${L.du} by ${A(h)} ${L.du} rectangle. What is its actual area?`,
    board: `${L.d.replace('¼', '\\tfrac14').replace(/ (\w+)$/, '\\text{ $1}')} : ${L.a.replace(/ (\w+)$/, '\\text{ $1}')}`, unit: `sq ${L.au}`, ans,
    wrongs: [
      { v: w * h * L.s, mc: MC.linearUnits, say: `The length factor counts once per side: 1 sq ${L.du} stands for ${L.s} × ${L.s} = ${L.s * L.s} sq ${L.au}, not ${L.s}.` },
      { v: w * h, say: `That is the area on the ${L.plan}, in sq ${L.du}. Turn each side into real ${L.au} first.` },
    ],
    ok: `Yes: ${w * L.s} ${L.au} × ${h * L.s} ${L.au} = ${fmt(ans)} sq ${L.au}.`, hint: `Turn each side into ${L.au} with the legend, then multiply.`,
    solution: [`Real sides: ${w} × ${L.s} = ${w * L.s} ${L.au} and ${h} × ${L.s} = ${h * L.s} ${L.au}.`, `Area: ${w * L.s} × ${h * L.s} = <b class="s">${fmt(ans)}</b> sq ${L.au}. (1 sq ${L.du} stands for ${L.s * L.s} sq ${L.au}.)`],
    pict: fit(pic, ['grid', 'o', 'oL'], { show: [], tex: `${w * L.s} \\times ${h * L.s} = ${tn(ans)}` }),
  });
};
const legendUnit: Gen = (R, n) => {
  const L = pick(R, [...LEGENDS, { d: '1 in', a: '5 ft', s: 5, du: 'in', au: 'ft', plan: 'deck plan' }, { d: '1 in', a: '20 ft', s: 20, du: 'in', au: 'ft', plan: 'site plan' }, { d: '1 in', a: '100 mi', s: 100, du: 'in', au: 'mi', plan: 'state map' }]);
  const one = L.d === '¼ in' ? `1 in (that is ${L.s} ft)` : L.d;
  const opts: Opt[] = [
    { t: `${fmt(L.s * L.s)} sq ${L.au}`, ok: true, say: `Yes: a 1 by 1 square on the ${L.plan} is ${L.s} by ${L.s} for real: ${fmt(L.s * L.s)} sq ${L.au}.` },
    { t: `${fmt(L.s)} sq ${L.au}`, mc: MC.linearUnits, say: `${L.s} is for ONE length. A square has two: ${L.s} × ${L.s}.` },
    { t: `${fmt(L.s * L.s)} ${L.au}`, mc: MC.unitDim, say: `The number is right, but area is in square units: sq ${L.au}.` },
  ];
  if (2 * L.s !== L.s * L.s) opts.push({ t: `${fmt(2 * L.s)} sq ${L.au}`, mc: MC.timesTwo, say: `Squared means ${L.s} × ${L.s}, not ${L.s} × 2.` });
  return choiceItem(R, {
    id: `legendUnit-${n}`, family: 'legendUnit', pict: sketchPic(`1\\text{ ${L.du}}`, `${L.s}\\text{ ${L.au}}`, `${tn(L.s * L.s)}\\text{ sq ${L.au}}`, `${L.s} \\times ${L.s} = ${tn(L.s * L.s)}`), prompt: `${pick(R, NAMES)}’s ${L.plan} has the legend ${B(`${L.d} : ${L.a}`)}. One square ${L.du === 'in' ? 'inch' : 'centimeter'} on the ${L.plan} stands for how much real area?${L.d === '¼ in' ? ' (Hint: 1 in stands for 4 ft.)' : ''}`,
    board: `1\\text{ sq ${L.du}} \\to \\,?`, opts,
    solution: [`${one} : ${L.a} for each length.`, `A 1 by 1 square is ${L.s} by ${L.s} for real: <b class="s">${fmt(L.s * L.s)} sq ${L.au}</b>.`],
  });
};

// =================== 11. back to k ===================
const rootK: Gen = (R, n) => {
  const frac = R() < 0.3;
  if (frac) {
    const k = pick(R, [rat(1, 2), rat(2, 3), rat(3, 4), rat(1, 3), rat(3, 2), rat(2, 5)]), F = sq(k);
    return numItem({
      id: `rootK-${n}`, family: 'rootK', prompt: `A scaled copy has ${K(qh(F))} of the original’s area. What was the length scale factor?`,
      board: `k^2 = ${qt(F)},\\ k = \\,?`, unit: '', input: 'frac', ans: qv(k),
      wrongs: [{ v: qv(F) / 2, mc: MC.rootHalf, say: `A square root is not half. Which number times itself gives ${qh(F)}?` }, { v: qv(F), mc: MC.byK, say: `${qh(F)} is the AREA factor. The length factor times itself makes it.` }],
      ok: `Yes: ${qh(k)} × ${qh(k)} = ${qh(F)}.`, hint: `Find a fraction that times itself gives ${qh(F)}.`,
      solution: [`${k.p} × ${k.p} = ${F.p} and ${k.q} × ${k.q} = ${F.q}.`, `k = <b class="s">${qh(k)}</b>.`],
    });
  }
  const k = int(R, 2, 10), F = k * k, what = pick(R, SCALED);
  return numItem({
    id: `rootK-${n}`, family: 'rootK', prompt: `After scaling ${what}, its area is multiplied by ${K(F)}. What is the length scale factor?`,
    board: `k^2 = ${F},\\ k = \\,?`, unit: '', ans: k,
    wrongs: [{ v: F / 2, mc: MC.rootHalf, say: `A square root is not half of ${F}. Which number times itself gives ${F}?` }, { v: F, mc: MC.byK, say: `${F} is the AREA factor. The length factor times itself makes ${F}.` }],
    ok: `Yes: ${k} × ${k} = ${F}.`, hint: `Which number times itself gives ${F}?`,
    solution: [`The area factor is k × k = ${F}: which number times itself gives ${F}?`, `${k} × ${k} = ${F}, so k = <b class="s">${k}</b>.`],
  });
};
/** what a plan of each kind shows: a yard plan has a lawn, not a room */
const REAL_ON: Record<string, string> = { map: 'region', 'state map': 'region', 'yard plan': 'lawn', 'deck plan': 'deck', 'site plan': 'parking lot' };
const planBack: Gen = (R, n) => {
  const L = pick(R, LEGENDS.filter(l => l.s <= 10)), w = int(R, 1, 6), h = int(R, 1, 5), actual = w * h * L.s * L.s;
  return numItem({
    id: `planBack-${n}`, family: 'planBack', prompt: `A ${L.plan} has the legend ${B(`${L.d} : ${L.a}`)}. A real ${REAL_ON[L.plan] ?? 'room'} has an area of ${A(fmt(actual))} sq ${L.au}. What is its area on the ${L.plan}?`,
    board: `${tn(actual)}\\text{ sq ${L.au}} \\to \\,?`, unit: `sq ${L.du}`, ans: w * h,
    wrongs: [{ v: actual / L.s, mc: MC.linearUnits, say: `1 sq ${L.du} stands for ${L.s} × ${L.s} = ${L.s * L.s} sq ${L.au}, so divide by ${L.s * L.s}, not ${L.s}.` }],
    ok: `Yes: ${fmt(actual)} ÷ ${L.s * L.s} = ${w * h} sq ${L.du}.`, hint: `How many sq ${L.au} does 1 sq ${L.du} stand for? Divide by that.`,
    solution: [`1 sq ${L.du} stands for ${L.s} × ${L.s} = ${L.s * L.s} sq ${L.au}.`, `${fmt(actual)} ÷ ${L.s * L.s} = <b class="s">${w * h}</b> sq ${L.du}.`],
  });
};

// =================== 12. why doubling quadruples ===================
const whyFour: Gen = (R, n) => {
  const w = int(R, 2, 8), h = int(R, 2, 8);
  const pic: AreaPic = { shape: rect(w, h), kx: 2, ky: 2, labels: { ow: `${w}`, oh: `${h}`, cw: `${2 * w}`, ch: `${2 * h}` }, tile: 'copies', count: true };
  return choiceItem(R, {
    id: `whyFour-${n}`, family: 'whyFour', prompt: `Both sides of a ${A(w)} by ${A(h)} rectangle are doubled. Which explanation shows WHY the area is 4 times as large, for any rectangle?`,
    board: `${w} \\times ${h} \\;\\to\\; ${2 * w} \\times ${2 * h}`, opts: [
      { t: 'It splits into 2 rows of 2 copies of the original: 4 copies.', ok: true, say: 'Yes: that works for every rectangle, whatever its sides.' },
      { t: 'The rule says the area is × k², and 2² = 4.', mc: MC.ruleAsWhy, say: 'That repeats the rule. WHY is it k²? Show where the 4 copies come from.' },
      { t: `I checked: ${w * h} became ${2 * w} × ${2 * h} = ${4 * w * h}.`, mc: MC.examples, say: 'That checks one rectangle. An explanation must work for every rectangle.' },
      { t: 'Doubling the sides doubles the area.', mc: MC.byK, say: 'Doubling the length doubles the area; doubling the width doubles it again: 4 times.' },
    ], solution: ['Double the length: 2 copies of the original in a row.', 'Double the width: 2 such rows. 2 rows of 2 = <b class="s">4 copies</b>, for any rectangle.'],
    pict: fit(pic, ['grid', 'o', 'oL', 'c', 'cL'], { show: ['tiles', 'n'], tex: '2 \\times 2 = 4' }),
  });
};
const onlyLength: Gen = (R, n) => {
  const w = int(R, 2, 6), h = int(R, 2, 6), who = pick(R, NAMES), k = pick(R, [2, 3] as const), A0 = w * h;
  return choiceItem(R, {
    id: `onlyLength-${n}`, family: 'onlyLength', pict: rectPic(w, h, k, 1, `${k * w} \\times ${h} = ${k} \\times ${A0}`), prompt: `Only the length of a ${A(w)} by ${A(h)} rectangle is multiplied by ${K(k)}. ${who} says: “Scaling makes the area ${k * k} times as large.” Is ${who} right?`,
    board: `${w} \\times ${h} \\;\\to\\; ${k * w} \\times ${h}`, opts: [
      { t: `No: it is ${k} copies side by side, so the area is × ${k}.`, ok: true, say: `Yes: only one side changed, so only one factor of ${k}. It isn’t a scaled copy.` },
      { t: `Yes: scaling always multiplies the area by k × k.`, mc: MC.nonUniform, say: `k × k needs BOTH sides × ${k}. Here the width stays, so the area is × ${k}.` },
      { t: `No: the area grows by ${(k - 1) * w} square units.`, mc: MC.addSide, say: `The new part is a ${(k - 1) * w} by ${h} strip: ${(k - 1) * w * h} square units. The area is × ${k}.` },
    ], solution: [`New area: ${k * w} × ${h} = ${k * A0} = ${k} × ${A0}.`, `Only one side × ${k}: the area is × <b class="s">${k}</b>, not × ${k * k}.`],
  });
};

// =================== 13. any k ===================
const ANYK: Q[] = [rat(3), rat(3, 2), rat(1, 2), rat(5, 2), rat(2, 3), rat(4)];
const eachFactor: Gen = (R, n) => {
  const k = pick(R, ANYK), whole = k.q === 1, k2 = sq(k), w = k.q * int(R, k.q === 1 ? 2 : 1, k.q === 3 ? 1 : 3), h = k.q * int(R, 1, k.q === 3 ? 1 : 2);
  return choiceItem(R, {
    id: `eachFactor-${n}`, family: 'eachFactor', pict: rectPic(w, h, qv(k), qv(k), `${qt(k)} \\times ${qt(k)} = ${qt(k2)}`), prompt: `Any rectangle is scaled by ${K(qh(k))} (a ${w} by ${h} one is drawn). Which argument shows the area is × ${qh(k)} × ${qh(k)} for EVERY rectangle?`,
    board: `k = ${qt(k)}`, opts: [
      { t: `The length multiplies the area by ${qh(k)}, the width by ${qh(k)} again.`, ok: true, say: `Yes: one factor for each dimension, whatever the rectangle and whatever k is.` },
      whole
        ? { t: `It works for the one drawn; a thinner one might differ.`, mc: MC.drawnCase, say: 'The argument never used the drawn sides. It works for any length and width.' }
        : { t: `It only works when whole copies fit, so it fails for k = ${qh(k)}.`, mc: MC.wholeCopies, say: `Copies are one way to see it, not the reason. Each side still multiplies the area by ${qh(k)}.` },
      { t: `It worked for a 2 by 3 rectangle, so it always works.`, mc: MC.examples, say: 'One example can’t show it for every rectangle.' },
      { t: `Every length is × ${qh(k)}, so the area is × ${qh(k)} too.`, mc: MC.byK, say: `Two lengths make an area: × ${qh(k)} for the length, × ${qh(k)} again for the width.` },
    ], solution: [`Length × ${qh(k)}, then width × ${qh(k)}: the area is × <b class="s">${qh(k2)}</b>, for any rectangle.`],
  });
};
const twoStretches: Gen = (R, n) => {
  const k = pick(R, [rat(3), rat(3, 2), rat(1, 2), rat(2)]);
  const step = k.q === 1 ? 1 : 2, w = step * int(R, 1, k.p === 3 && k.q === 1 ? 3 : 4), h = step * int(R, 1, 3), A0 = w * h;
  const mid = A0 * qv(k), ans = A0 * qv(sq(k));
  const pic: AreaPic = { shape: rect(w, h), kx: qv(k), ky: qv(k), labels: { ow: `${w}`, oh: `${h}`, cw: `${fmt(w * qv(k))}`, ch: `${fmt(h * qv(k))}` }, area: { o: `${A0}` },
    tile: k.q === 1 ? 'copies' : k.p === 1 ? 'reverse' : null };
  return numItem({
    id: `twoStretches-${n}`, family: 'twoStretches', prompt: `A ${A(w)} by ${A(h)} rectangle (area ${A(A0)}) is scaled by ${K(qh(k))}. Scaling only the length makes the area ${fmt(mid)}. What is the area once the width is scaled too?`,
    board: `${A0} \\xrightarrow{\\text{length}} ${tn(mid)} \\xrightarrow{\\text{width}} \\,?`, unit: 'sq units', ans,
    wrongs: [
      { v: mid, mc: MC.byK, say: `That is after the length only. Scaling the width multiplies the area by ${qh(k)} again.` },
      { v: A0 * qv(k) * 2, mc: MC.timesTwo, say: `Each dimension multiplies by ${qh(k)}: × ${qh(k)} × ${qh(k)}, not × ${qh(k)} × 2.` },
    ],
    ok: `Yes: ${fmt(mid)} × ${qh(k)} = ${fmt(ans)}: the area is × ${qh(sq(k))}.`, hint: `The width multiplies the area by ${qh(k)} again.`,
    solution: [`Length × ${qh(k)}: ${A0} → ${fmt(mid)}.`, `Width × ${qh(k)}: ${fmt(mid)} → <b class="s">${fmt(ans)}</b>. In all × ${qh(sq(k))} (check: ${fmt(w * qv(k))} × ${fmt(h * qv(k))}).`],
    pict: fit(pic, ['grid', 'o', 'oL', 'oA', 'c', 'cL'], { show: pic.tile ? ['tiles'] : [], tex: `${tn(mid)} \\times ${qt(k)} = ${tn(ans)}` }),
  });
};

// =================== 14. triangles by the formula ===================
const triFormula: Gen = (R, n) => {
  const k = pick(R, [rat(2), rat(3), rat(1, 2)]), half = k.q === 2;
  let b: number, h: number;
  do { b = (half ? 2 : 1) * int(R, 1, half ? 4 : 5); h = (half ? 2 : 1) * int(R, 2, half ? 3 : 4); } while ((b * h) % 2);
  const A0 = (b * h) / 2, kv = qv(k), ans = kv * kv * A0;
  const pic: AreaPic = { shape: { kind: 'tri', w: b, h, a: 0 }, kx: kv, ky: kv, labels: { ow: `${b}`, oh: `${h}` }, area: undefined, tile: half ? 'reverse' : 'copies' };
  return numItem({
    id: `triFormula-${n}`, family: 'triFormula', prompt: `A triangle has base ${A(b)} and height ${A(h)} (area ${A(A0)}). It is scaled by ${K(qh(k))}. Use ½ × base × height: what is the area of the copy?`,
    board: `\\tfrac12 \\times ${b} \\times ${h} = ${A0},\\ k = ${qt(k)}`, unit: 'sq units', ans,
    wrongs: [
      { v: kv * A0, mc: MC.someSides, say: `Scale BOTH the base and the height: ½ × ${fmt(kv * b)} × ${fmt(kv * h)}.` },
      { v: kv * kv * kv * A0, mc: MC.halfConst, say: `The ½ is part of the formula, not a length: it stays ½. ½ × ${fmt(kv * b)} × ${fmt(kv * h)}.` },
      { v: kv * kv * b * h, say: `Don’t forget the ½: ½ × ${fmt(kv * b)} × ${fmt(kv * h)}.` },
    ],
    ok: `Yes: ½ × ${fmt(kv * b)} × ${fmt(kv * h)} = ${fmt(ans)} = ${qh(sq(k))} × ${A0}.`, hint: 'Scale the base and the height, keep the ½, then multiply.',
    solution: [`New base ${fmt(kv * b)}, new height ${fmt(kv * h)}; the ½ stays.`, `½ × ${fmt(kv * b)} × ${fmt(kv * h)} = <b class="s">${fmt(ans)}</b> = ${qh(sq(k))} × ${A0}.`],
    pict: fit(pic, ['grid', 'o', 'oL'], { show: ['c', 'tiles'], tex: `\\tfrac12 \\times ${tn(kv * b)} \\times ${tn(kv * h)} = ${tn(ans)}` }),
  });
};
const triWhy: Gen = (R, n) => {
  const k = pick(R, ['2', '3', '½'] as const), kk = k === '2' ? '4' : k === '3' ? '9' : '¼', kkk = k === '2' ? '8' : k === '3' ? '27' : '⅛';
  const half = k === '½', b = (half ? 2 : 1) * int(R, half ? 1 : 2, half ? 3 : 5), h = (half ? 2 : 1) * int(R, half ? 1 : 2, half ? 3 : 4), what = pick(R, ['triangle', 'triangular sail', 'triangular garden', 'pennant'] as const);
  const kv = half ? 0.5 : Number(k);
  const tpic: AreaPic = { shape: { kind: 'tri', w: b, h, a: 0 }, kx: kv, ky: kv, labels: { ow: `${b}`, oh: `${h}`, cw: fmt(kv * b), ch: fmt(kv * h) }, tile: half ? 'reverse' : 'copies', count: true };
  const kb = `(${k} × ${b})`, kh = `(${k} × ${h})`, old = `(½ × ${b} × ${h})`;
  return choiceItem(R, {
    id: `triWhy-${n}`, family: 'triWhy', pict: fit(tpic, ['grid', 'o', 'oL', 'c', 'cL'], { show: tilesSteps(tpic), tex: half ? '\\tfrac12 \\times \\tfrac12 = \\tfrac14' : `${k} \\times ${k} = ${kk}` }), prompt: `A ${what} has base ${A(b)} and height ${A(h)}. It is scaled by ${K(k)}. Which line shows why its area is × ${kk}?`,
    board: `\\text{area} = \\tfrac12 \\times \\text{base} \\times \\text{height}`, opts: [
      { t: `½ × ${kb} × ${kh} = ${kk} × ${old}`, ok: true, say: `Yes: both the base and the height get a factor ${k}; the ½ stays.` },
      { t: `½ × ${kb} × ${h} = ${k} × ${old}`, mc: MC.someSides, say: `The height is a length too: it is × ${k} as well.` },
      { t: `(${k} × ½) × ${kb} × ${kh} = ${kkk} × ${old}`, mc: MC.halfConst, say: 'The ½ is part of the formula, not a length: it is not scaled.' },
    ], solution: [`Scale the base and the height; the ½ stays: ½ × ${kb} × ${kh}.`, `= ${k} × ${k} × ${old} = <b class="s">${kk}</b> × the old area. The same works for any base, height and k.`],
  });
};

// =================== 15. times k or times k² ===================
const whichMeasure: Gen = (R, n) => {
  // never a square: the question may ask for the copy's long side
  const k = pick(R, [2, 3, 4] as const), w = int(R, 2, 6), h0 = int(R, 1, 5), h = h0 === w ? w - 1 : h0, A0 = w * h, P0 = 2 * (w + h), ask = int(R, 0, 2);
  const pic: AreaPic = { shape: rect(w, h), kx: k, ky: k, labels: { ow: `${w}`, oh: `${h}`, cw: `${k * w}`, ch: `${k * h}` }, tile: 'copies' };
  const base = `A ${A(w)} cm by ${A(h)} cm rectangle (perimeter ${A(P0)} cm, area ${A(A0)} sq cm) is scaled by ${K(k)}.`;
  const common = { family: 'whichMeasure' as const, id: `whichMeasure-${n}`, board: `${w} \\times ${h},\\ k = ${k}` };
  const pict = fit(pic, ['grid', 'o', 'oL'], { show: ['c', 'cL', ...(ask === 2 ? ['tiles' as const] : [])], tex: ask === 0 ? `${w} \\times ${k} = ${k * w}` : ask === 1 ? `${P0} \\times ${k} = ${k * P0}` : `${A0} \\times ${k}^2 = ${k * k * A0}` });
  const rule = `Scale factor ${k}: lengths and the perimeter are × ${k}, the area is × ${k}² = ${k * k}.`;
  if (ask === 0) return numItem({ ...common, prompt: `${base} How long is the copy’s long side?`, unit: 'cm', ans: k * Math.max(w, h),
    wrongs: [{ v: k * k * Math.max(w, h), mc: MC.areaToLength, say: `A length is × ${k}, not × ${k * k}. Only areas get k².` }],
    ok: `Yes: a length is × ${k}.`, hint: `Lengths are multiplied by k.`, solution: [rule, `Lengths × k: ${Math.max(w, h)} × ${k} = <b class="s">${k * Math.max(w, h)}</b> cm.`], pict });
  if (ask === 1) return numItem({ ...common, prompt: `${base} What is the copy’s perimeter?`, unit: 'cm', ans: k * P0,
    wrongs: [{ v: k * k * P0, mc: MC.areaToLength, say: `A perimeter is a length: × ${k}, not × ${k * k}.` }, { v: P0 + 4 * (k - 1), say: `Every side is × ${k}, so the perimeter is × ${k}.` }],
    ok: `Yes: the perimeter is a length, × ${k}.`, hint: 'The perimeter is a length: lengths are × k.', solution: [rule, `The perimeter is a length: ${P0} × ${k} = <b class="s">${k * P0}</b> cm.`], pict });
  return numItem({ ...common, prompt: `${base} What is the copy’s area?`, unit: 'sq cm', ans: k * k * A0,
    wrongs: [{ v: k * A0, mc: MC.byK, say: `Area is × k², not × k: ${k} × ${k} × ${A0}.` }],
    ok: `Yes: area is × ${k}² = ${k * k}.`, hint: 'Areas are multiplied by k².', solution: [rule, `Area × k²: ${A0} × ${k * k} = <b class="s">${k * k * A0}</b> sq cm.`], pict });
};
const fieldJobs: Gen = (R, n) => {
  const k = pick(R, [2, 3, 4] as const), m = int(R, 3, 12), bags = int(R, 1, 5), walk = R() < 0.5;
  const base = `Walking around a square field takes ${A(m)} min; fertilizing it takes ${A(bags)} bag${bags > 1 ? 's' : ''}. A square field has sides ${K(k)} times as long (same speed, same fertilizer per sq ft).`;
  if (walk) return numItem({ id: `fieldJobs-${n}`, family: 'fieldJobs', pict: unitPic(k, `${m} \\times ${k} = ${k * m}`, false), prompt: `${base} How many minutes to walk around it?`, board: `\\text{sides} \\times ${k}`, unit: 'minutes', ans: k * m,
    wrongs: [{ v: k * k * m, mc: MC.areaToLength, say: `Walking around is a length, the perimeter: × ${k}, not × ${k * k}.` }],
    ok: `Yes: the walk is a perimeter, × ${k}.`, hint: 'Walking around is a perimeter. Perimeters are × k.', solution: [`The walk is the perimeter: × ${k}.`, `${m} × ${k} = <b class="s">${k * m}</b> minutes.`] });
  return numItem({ id: `fieldJobs-${n}`, family: 'fieldJobs', pict: unitPic(k, `${bags} \\times ${k}^2 = ${k * k * bags}`), prompt: `${base} How many bags to fertilize it?`, board: `\\text{sides} \\times ${k}`, unit: 'bags', ans: k * k * bags,
    wrongs: [{ v: k * bags, mc: MC.byK, say: `Fertilizer covers the area: × ${k}² = × ${k * k}, not × ${k}.` }],
    ok: `Yes: fertilizer covers the area, × ${k * k}.`, hint: 'Fertilizer covers the area. Areas are × k².', solution: [`Fertilizer covers the area: × ${k}² = × ${k * k}.`, `${bags} × ${k * k} = <b class="s">${k * k * bags}</b> bags.`] });
};

// =================== 16. multi-step ===================
const costArea: Gen = (R, n) => {
  const kind = int(R, 0, 2);
  if (kind === 0) {
    // a real room, yard or kitchen floor: at least 40 sq ft
    const w = int(R, 6, 10), h0 = int(R, 4, 8), h = w * h0 < 40 ? Math.ceil(40 / w) : h0, k = pick(R, [2, 3] as const), p = pick(R, [2, 3, 4, 5, 6, 1.5, 2.5] as const), ans = r3(p * k * k * w * h);
    const what = pick(R, [{ t: 'carpet', r: 'room' }, { t: 'sod', r: 'yard' }, { t: 'tile', r: 'kitchen floor' }] as const);
    return numItem({ id: `costArea-${n}`, family: 'costArea', pict: rectPic(w, h, k, k, `${w * h} \\times ${k}^2 = ${k * k * w * h}`), prompt: `A ${what.r} is ${A(w)} ft by ${A(h)} ft. A bigger ${what.r} has every length ${K(k)} times as long. ${what.t[0]!.toUpperCase() + what.t.slice(1)} costs ${money(p)} per sq ft. What does ${what.t} for the bigger ${what.r} cost?`,
      board: `${w} \\times ${h},\\ k = ${k},\\ \\$${p}\\text{ per sq ft}`, unit: 'dollars', ans,
      wrongs: [{ v: r3(p * k * w * h), mc: MC.byK, say: `The area is × ${k * k}, not × ${k}: the bigger ${what.r} is ${k * w} by ${k * h} ft.` }, { v: r3(p * w * h), say: `That is the cost for the small ${what.r}. Find the bigger area first.` }],
      ok: `Yes: ${k * w} × ${k * h} = ${k * k * w * h} sq ft, × ${money(p)} = ${money(ans)}.`, hint: 'Find the bigger area first (× k²), then the cost.',
      solution: [`Bigger area: ${w * h} × ${k}² = ${k * k * w * h} sq ft.`, `${k * k * w * h} × ${money(p)} = <b class="s">${money(ans)}</b>.`] });
  }
  if (kind === 1) {
    const cans = int(R, 1, 4), k = pick(R, [2, 3] as const);
    return numItem({ id: `costArea-${n}`, family: 'costArea', pict: unitPic(k, `${cans} \\times ${k}^2 = ${cans * k * k}`), prompt: `Painting a poster takes ${A(cans)} can${cans > 1 ? 's' : ''} of paint. A mural copy of it is enlarged ${K(k)} times (every length). How many cans does the mural take?`,
      board: `${cans}\\text{ can${cans > 1 ? 's' : ''}},\\ k = ${k}`, unit: 'cans', ans: cans * k * k,
      wrongs: [{ v: cans * k, mc: MC.byK, say: `Paint covers the area: × ${k}² = ${k * k}, not × ${k}.` }],
      ok: `Yes: ${k * k} times the area, ${k * k} times the paint.`, hint: 'Paint covers area. The area is × k².',
      solution: [`Area × ${k}² = × ${k * k}.`, `${cans} × ${k * k} = <b class="s">${cans * k * k}</b> cans.`] });
  }
  const c = pick(R, [8, 10, 12, 15, 20, 30, 45] as const), k = pick(R, [2, 3] as const), item = pick(R, ['rug', 'tablecloth', 'banner', 'sail'] as const);
  return numItem({ id: `costArea-${n}`, family: 'costArea', pict: unitPic(k, `${c} \\times ${k}^2 = ${c * k * k}`), prompt: `A small ${item} costs ${money(c)}. A big ${item} has every length ${K(k)} times as long, made of the same cloth at the same price per square foot. What does the big ${item} cost?`,
    board: `\\$${c},\\ k = ${k}`, unit: 'dollars', ans: c * k * k,
    wrongs: [{ v: c * k, mc: MC.byK, say: `The cloth is an area: × ${k}² = × ${k * k}, not × ${k}.` }],
    ok: `Yes: ${k * k} times the cloth, ${k * k} times the price.`, hint: 'The price follows the cloth, and the cloth is an area.',
    solution: [`Cloth (area) × ${k}² = × ${k * k}.`, `${money(c)} × ${k * k} = <b class="s">${money(c * k * k)}</b>.`] });
};
const pizzaDeal: Gen = (R, n) => {
  const [d, k] = pick(R, [[6, 2], [7, 2], [8, 2], [9, 2], [10, 2], [5, 3], [6, 3]] as const);
  const s = pick(R, [4, 5, 6, 8] as const), f = k === 2 ? pick(R, [2.5, 3, 3.5] as const) : pick(R, [4, 5, 6, 7] as const), big = r3(s * f);
  return choiceItem(R, {
    id: `pizzaDeal-${n}`, family: 'pizzaDeal', pict: unitPic(k, `${k}^2 = ${k * k} > ${f}`), prompt: `${d === 8 ? 'An' : 'A'} ${A(d)}-inch pizza costs ${money(s)}. ${d * k === 18 || d * k === 8 ? 'An' : 'A'} ${B(d * k)}-inch pizza (same thickness) costs ${money(big)}. Which is the better deal?`,
    board: `${d}\\text{ in} \\to ${d * k}\\text{ in}`, opts: [
      { t: `The ${d * k}-inch: ${k * k} times the pizza for ${f} times the price`, ok: true, say: `Yes: the width is × ${k}, so the pizza (an area) is × ${k * k}, but the price is only × ${f}.` },
      { t: `The ${d}-inch: the big one is only ${k} times the pizza for ${f} times the price`, mc: MC.byK, say: `The amount of pizza is an area: × ${k}² = ${k * k}, not × ${k}.` },
      { t: 'They are the same deal', say: `Compare: the pizza is × ${k * k}, the price is × ${f}.` },
    ], solution: [`Diameter × ${k}: area × ${k}² = × ${k * k}.`, `Price × ${f} (${money(big)} ÷ ${money(s)}). ${k * k} > ${f}: the <b class="s">${d * k}-inch</b> is the better deal.`],
  });
};

export const GENERATORS: Record<FamilyId, Gen> = {
  stretchOne, stretchTimes, fillCopy, copyArea, twoFactors, isScaled, tileCount, onlyRects, unitSquares, noWholeCopies,
  areaFactor, squaredMeans, areaGiven, areaFromDims, fracFactor, decFactor, shrinkOrGrow, areaRatio, planRatio,
  legendArea, legendUnit, rootK, planBack, whyFour, onlyLength, eachFactor, twoStretches, triFormula, triWhy,
  whichMeasure, fieldJobs, costArea, pizzaDeal,
};
