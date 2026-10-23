// items.ts: exercise families for "square roots of perfect squares" (grade 8, 8.EE.A.2 / 8.NS.A.2), generated from
// templates, checked exactly, and every wrong answer the classifier recognises tagged with its misconception id from
// math-curriculum-essentials/misconceptions.json (logged, never shown to the kid).
// A generator gets the SUB-GOAL it practises (plan.ts) and uses that sub-goal's number ranges from the topic JSON.
// Pure: no DOM, no canvas. The pictures are data (TileSquare / RootLine params) the page knows how to draw.
import { type Gen as RtGen, type Item, type Response, type Verdict, A, B, S, int, pick, rng, shuffle } from '../../runtime/item';
import { ans, endOnChoice } from '../../runtime/explain';
import { type TileParams, type TileStep, isqrt, isSquare } from './TileSquare';
import type { LineStep } from './RootLine';
export { rng, isqrt, isSquare };
export type { Response, Verdict };

export type FamilyId = 'squareOf' | 'arrangement' | 'sideFromArea' | 'sideUnits' | 'translate' | 'evalRoot' | 'zeroRoot'
  | 'checkRoot' | 'whichSquare' | 'isSquare' | 'between' | 'boundRoot' | 'nearer' | 'halving' | 'counterexample' | 'context';
export const FAMILIES: readonly { id: FamilyId; name: string }[] = [
  { id: 'squareOf', name: 'Square a number' },
  { id: 'arrangement', name: 'Rectangle or square?' },
  { id: 'sideFromArea', name: 'Side from the area' },
  { id: 'sideUnits', name: 'Side, with its unit' },
  { id: 'translate', name: 'Read the root sign' },
  { id: 'evalRoot', name: 'Find the root' },
  { id: 'zeroRoot', name: 'Zero and never negative' },
  { id: 'checkRoot', name: 'Check it by squaring' },
  { id: 'whichSquare', name: 'Which is a perfect square?' },
  { id: 'isSquare', name: 'Perfect square or not?' },
  { id: 'between', name: 'Between two squares' },
  { id: 'boundRoot', name: 'Between two whole numbers' },
  { id: 'nearer', name: 'Which whole number is nearer?' },
  { id: 'halving', name: 'Root or half?' },
  { id: 'counterexample', name: 'One counterexample' },
  { id: 'context', name: 'Side of a real square' },
];
export const FAMILY_NAMES: Record<string, string> = Object.fromEntries(FAMILIES.map(f => [f.id, f.name]));

// ---------- pictures ----------
export interface TilePic { kind: 'tiles'; p: TileParams; show: TileStep[]; solve: TileStep[] }
export interface LinePic { kind: 'line'; n: number; show: LineStep[]; solve: LineStep[] }
export interface SqItem extends Item {
  family: FamilyId;
  pic?: TilePic | LinePic;
  /** the picture appears only with the worked solution (recall items stay bare until then) */
  bareFirst?: boolean;
  /** TeX lines written on the board by the solution replay, in order */
  solveTex: string[];
}
type Gen = (R: () => number, n: number, sg?: string) => SqItem;

// ---------- HTML / TeX bits ----------
/** a radical in the panel: √ with its bar over the radicand (CSS .rad in the page) */
export const rad = (x: number | string) => `<span class="rad">√<span>${x}</span></span>`;
const MC = {
  baseTimesExp: 'mc.exponents-roots.power-as-base-times-exponent',
  arrangement: 'mc.exponents-roots.perfect-square-depends-on-arrangement',
  wrongUnit: 'mc.measurement-units.wrong-unit-dimension',
  halving: 'mc.exponents-roots.root-as-dividing-by-index',
  perimeter: 'mc.area-perimeter.confuses-area-with-perimeter',
  ignores: 'mc.exponents-roots.ignores-square-root-symbol',
  misreads: 'mc.exponents-roots.misreads-radical-sign',
  swap: 'mc.exponents-roots.swaps-radicand-and-root-value',
  zeroUndef: 'mc.exponents-roots.square-root-of-zero-undefined',
  noCheck: 'mc.exponents-roots.root-guessed-without-squaring-check',
  plusMinus: 'mc.exponents-roots.principal-root-as-plus-minus',
  eleven: 'mc.exponents-roots.multiple-of-eleven-implies-perfect-square',
  anyPair: 'mc.exponents-roots.perfect-square-wrong-criterion',
  even: 'mc.exponents-roots.evenness-implies-perfect-square',
  nonConsec: 'mc.exponents-roots.nonconsecutive-square-bounds-for-consecutive-request',
  neighbours: 'mc.exponents-roots.wrong-neighboring-squares',
  squaresAsBounds: 'mc.exponents-roots.squares-as-root-bounds',
  midpoint: 'mc.exponents-roots.nearer-integer-by-wrong-criterion',
  tensDigit: 'mc.exponents-roots.rounds-root-from-radicand-tens-digit',
  roundedExact: 'mc.estimation.rounded-value-treated-as-exact',
  partByPart: 'mc.expressions.multiplies-sums-part-by-part',
  differEverywhere: 'mc.reasoning-language.different-rules-differ-everywhere',
  examplesProof: 'mc.reasoning-language.examples-as-proof',
} as const;
export { MC };

const half = (x: number) => (x % 2 === 0 ? String(x / 2) : `${(x - 1) / 2}.5`);
const NAMES = ['Kai', 'Jordan', 'Ava', 'Leo', 'Maya', 'Sam', 'Riley', 'Noah', 'Zoe', 'Eli', 'Mia', 'Omar', 'Priya', 'Luis', 'Nora', 'Theo'];
/** a factor pair a x b = n with a < b, the most square-like one; [1, n] when n is prime */
export function factorPair(n: number): [number, number] {
  let best: [number, number] = [1, n];
  for (let a = 2; a * a < n; a++) if (n % a === 0) best = [a, n / a];
  return best;
}
/** a whole-number range of k from a sub-goal */
function kRange(sg: string | undefined, lo: number, hi: number): [number, number] {
  if (sg === 'evaluate-roots-to-225' || sg === 'apply-side-from-area') return [Math.max(lo, 3), Math.max(hi, 15)];
  return [lo, hi];
}

// ---------- choice items ----------
interface Opt { t: string; ok: boolean; mc?: string; say: string }
function choice(R: () => number, base: Omit<SqItem, 'input' | 'choices' | 'answer' | 'check'>, opts: Opt[]): SqItem {
  const o = shuffle(R, opts.slice());
  const right = o.findIndex(x => x.ok);
  return {
    ...base, input: 'choice', choices: o.map(x => x.t), answer: { kind: 'choice', i: right }, solution: endOnChoice(base.solution, o[right]!.t),
    check: r => {
      if (r.kind !== 'choice' || !o[r.i]) return { ok: false, say: 'Pick one of the answers.' };
      const x = o[r.i]!;
      return { ok: x.ok, mc: x.mc, say: x.say };
    },
  };
}
const needNum = (r: Response): number | null => (r.kind === 'num' && Number.isFinite(r.v) ? r.v : null);

// ---------- the shared classifier for "the side of a square of area A" / "sqrt(A)" ----------
export function classifyRoot(v: number, ar: number, o: { unit?: string; context?: boolean } = {}): Verdict {
  const k = isqrt(ar), u = o.unit ? ' ' + o.unit : '';
  if (v === k) return { ok: true, say: `Yes: ${k} × ${k} = ${ar}, so ${rad(ar)} = ${S(String(k))}${u}.` };
  if (ar > 4 && ar % 2 === 0 && v === ar / 2) return { ok: false, mc: MC.halving, say: `${v} is half of ${ar}. Check by squaring: ${v} × ${v} = ${v * v}, far more than ${ar}. The side is ${k}: ${k} × ${k} = ${ar}.` };
  if (o.context && ar > 16 && ar % 4 === 0 && v === ar / 4) return { ok: false, mc: MC.perimeter, say: `${ar} ÷ 4 = ${v} would be the side if ${ar} were the distance around. But ${ar} is the AREA: it counts the unit squares inside. ${k} × ${k} = ${ar}, so the side is ${k}.` };
  if (ar > 1 && v === ar) return { ok: false, mc: o.context ? MC.wrongUnit : MC.ignores, say: `${ar} is the area itself. The square root asks for the side: which number times itself makes ${ar}? ${k} × ${k} = ${ar}.` };
  if (ar > 1 && v === ar * ar) return { ok: false, mc: MC.misreads, say: `That squares ${ar}. The root sign goes the other way: ${rad(ar)} is the number whose square is ${ar}, so ${k}.` };
  if (k > 0 && v === -k) return { ok: false, mc: MC.plusMinus, say: `${rad(ar)} names a side length, so it is never negative: ${rad(ar)} = ${k}.` };
  if (Math.abs(v - k) === 1) return { ok: false, mc: MC.noCheck, say: `Close. Check by squaring: ${v} × ${v} = ${v * v}, not ${ar}. ${k} × ${k} = ${ar}.` };
  return { ok: false, say: `Check by squaring: ${v} × ${v} = ${v * v}, not ${ar}. ${k} × ${k} = ${ar}, so the side is ${k}.` };
}
const rootSolution = (ar: number, unit = '') => {
  const k = isqrt(ar), u = unit ? ' ' + unit : '';
  return [`Which whole number times itself makes ${A(ar)}?`, `${k} × ${k} = ${A(ar)}.`, `So ${rad(ar)} = ${S(String(k))}${u}. Check: ${k} × ${k} = ${ar}.`];
};
const tilesPic = (n: number, words: TileParams['words'], show: TileStep[], solve: TileStep[], extra: Partial<TileParams> = {}): TilePic => ({ kind: 'tiles', p: { n, words, ...extra }, show, solve });

// ===================== families =====================

/** k^2 from a picture or bare; 11..15 for the 225 sub-goal (generated by multiplying) */
const squareOf: Gen = (R, n, sg) => {
  const big = sg === 'evaluate-roots-to-225';
  const k = big ? int(R, 11, 15) : pick(R, [1, 3, 4, 5, 6, 7, 8, 9, 10]);
  const sq = k * k;
  const pictured = !big && R() < 0.55;
  const prompt = big ? pick(R, [`Find ${B(`${k}²`)} by multiplying.`, `What is ${B(`${k} × ${k}`)}?`, `A square has sides of ${S(`${k} units`)}. What is its area, in square units?`])
    : pictured ? `This square has sides of ${S(`${k} unit${k === 1 ? '' : 's'}`)}. How many unit squares cover it?`
      : pick(R, [`What is ${B(`${k}²`)}?`, `Evaluate ${B(`${k}²`)}.`, `${B(`${k}²`)} means ${k} × ${k}. How much is it?`]);
  const sol = big ? [`${k}² = ${k} × ${k}.`, `${k} × 10 = ${k * 10} and ${k} × ${k - 10} = ${k * (k - 10)}.`, `${k * 10} + ${k * (k - 10)} = ${ans(sq)}, so ${k}² = ${sq} and ${rad(sq)} = ${k}.`]
    : [`${k}² means ${k} × ${k}: ${k} row${k === 1 ? '' : 's'} of ${k}.`, `${k} × ${k} = ${ans(sq)}.`];
  return {
    id: `squareOf-${n}`, family: 'squareOf', prompt, board: `${k}^2 = \\,?`, input: 'num', unit: pictured ? 'unit squares' : '',
    pic: tilesPic(sq, { side: `${k}`, area: `${sq} unit squares`, rows: `${k} rows` }, pictured ? ['tiles', 'side'] : ['tiles', 'side'], ['rows', 'area']),
    bareFirst: !pictured, solveTex: [`${k} \\times ${k} = ${sq}`],
    solution: sol, answer: { kind: 'num', v: sq },
    check: r => {
      const v = needNum(r);
      if (v === null) return { ok: false, say: 'Type a whole number.' };
      if (v === sq) return { ok: true, say: `Yes: ${k} × ${k} = ${sq}.` };
      if (v === 2 * k) return { ok: false, mc: MC.baseTimesExp, say: `${k}² is ${k} × ${k}, not ${k} × 2. ${k} row${k === 1 ? '' : 's'} of ${k} make${k === 1 ? 's' : ''} ${sq}.` };
      return { ok: false, say: `${k} × ${k} = ${sq}.` };
    },
  };
};

/** tiles laid out as a rectangle: is the number a perfect square anyway? (16 = 2 x 8 = 4 x 4) */
const RECTS: [number, [number, number]][] = [
  [16, [2, 8]], [16, [1, 16]], [36, [3, 12]], [36, [4, 9]], [64, [4, 16]], [144, [9, 16]], [4, [1, 4]], [9, [1, 9]], [100, [5, 20]],
  [24, [3, 8]], [24, [4, 6]], [12, [3, 4]], [18, [3, 6]], [20, [4, 5]], [30, [5, 6]], [32, [4, 8]], [40, [5, 8]], [48, [6, 8]], [28, [4, 7]],
  [45, [5, 9]], [60, [6, 10]], [72, [8, 9]], [54, [6, 9]], [42, [6, 7]], [56, [7, 8]], [27, [3, 9]], [35, [5, 7]], [63, [7, 9]], [80, [8, 10]],
  [90, [9, 10]], [15, [3, 5]], [10, [2, 5]], [8, [2, 4]], [50, [5, 10]], [6, [2, 3]],
];
const arrangement: Gen = (R, n) => {
  const squares = RECTS.filter(([N, [, c]]) => isSquare(N) && c <= 16), others = RECTS.filter(([N]) => !isSquare(N));
  const [N, [a, b]] = R() < 0.45 ? pick(R, squares) : pick(R, others);
  const k = isqrt(N), sq = isSquare(N);
  const prompt = `${A(`${N} square tiles`)} are laid out as a ${a} × ${b} rectangle. Is ${N} a perfect square?`;
  const opts: Opt[] = sq ? [
    { t: `Yes: ${k} × ${k} = ${N} too, so the same tiles make a square.`, ok: true, say: `Yes. Slide the tiles: ${k} rows of ${k}. Being a perfect square is about the number, not how the tiles happen to lie.` },
    { t: 'No: the tiles make a rectangle, not a square.', ok: false, mc: MC.arrangement, say: `The same ${N} tiles can be moved into ${k} rows of ${k}. ${N} = ${k} × ${k}, so ${N} is a perfect square however it is laid out.` },
    { t: `Yes: ${a} × ${b} = ${N}, and any two factors prove it.`, ok: false, mc: MC.anyPair, say: `Every number has factor pairs; that proves nothing. It needs two EQUAL factors: ${k} × ${k} = ${N}.` },
  ] : [
    { t: `No: ${k} × ${k} = ${k * k} and ${k + 1} × ${k + 1} = ${(k + 1) ** 2}, and nothing in between.`, ok: true, say: `Right. ${N} tiles fill ${k} rows of ${k} with ${N - k * k} left over, and not enough to finish the next square.` },
    { t: `Yes: ${a} × ${b} = ${N}.`, ok: false, mc: MC.anyPair, say: `A factor pair only makes a rectangle. A perfect square needs two EQUAL factors, and ${k} × ${k} = ${k * k}, ${k + 1} × ${k + 1} = ${(k + 1) ** 2}.` },
    N % 2 === 0
      ? { t: `Yes: ${N} is even.`, ok: false, mc: MC.even, say: `Even is not enough: ${N} is even but no whole number times itself makes ${N}.` }
      : { t: 'No: the tiles make a rectangle, not a square.', ok: false, mc: MC.arrangement, say: `The answer is no, but not for that reason: 16 tiles in a 2 × 8 rectangle are still a perfect square (4 × 4). ${N} is not, because ${k} × ${k} = ${k * k} and ${k + 1} × ${k + 1} = ${(k + 1) ** 2}.` },
  ];
  return choice(R, {
    id: `arrangement-${n}`, family: 'arrangement', prompt, board: `${N} = ${a} \\times ${b}`,
    pic: tilesPic(N, { area: `${N} tiles`, side: `${k}` }, ['tiles', 'area'], sq ? ['morph', 'side'] : ['morph', 'extra', 'ghost'], { rect: [a, b], ...(sq ? {} : { ghost: k + 1 }) }),
    solveTex: sq ? [`${N} = ${k} \\times ${k}`] : [`${k} \\times ${k} = ${k * k}`, `${k + 1} \\times ${k + 1} = ${(k + 1) ** 2}`],
    solution: sq ? [`Move the tiles: ${k} rows of ${k} use all ${N}.`, `${N} = ${k} × ${k}, so ${N} is a perfect square.`] : [`${k} rows of ${k} use ${k * k} tiles; ${N - k * k} are left over.`, `${k + 1} rows of ${k + 1} would need ${(k + 1) ** 2}. ${N} is not a perfect square.`],
  }, opts);
};

/** the side of a square from its area (a tiled square, then only the area) */
const sideFromArea: Gen = (R, n, sg) => {
  const [lo, hi] = kRange(sg, 1, 10);
  const k = R() < 0.12 ? pick(R, [1, 10]) : int(R, lo, hi), Ar = k * k;
  const tiled = R() < 0.35;
  const sqU = Ar === 1 ? 'square unit' : 'square units', lU = k === 1 ? 'unit' : 'units';
  return {
    id: `sideFromArea-${n}`, family: 'sideFromArea', prompt: pick(R, [`A square has an area of ${A(`${Ar} ${sqU}`)}. How long is each side?`, `The area of a square is ${A(`${Ar} ${sqU}`)}. What is the length of one side?`, `${A(`${Ar} unit squares`)} cover a square exactly. How many units long is a side?`]),
    board: `\\text{area} = ${Ar}`, input: 'num', unit: lU,
    pic: tilesPic(Ar, { area: `${Ar} ${sqU}`, side: `${k} ${lU}`, ask: 'side = ?' }, tiled ? ['tiles', 'area', 'side'] : ['slab', 'area', 'side'], tiled ? ['reveal', 'rows'] : ['tiles', 'reveal']),
    solveTex: [`${k} \\times ${k} = ${Ar}`, `\\sqrt{${Ar}} = ${k}`],
    solution: rootSolution(Ar, lU), answer: { kind: 'num', v: k },
    check: r => { const v = needNum(r); return v === null ? { ok: false, say: 'Type a whole number.' } : classifyRoot(v, Ar, { unit: lU, context: true }); },
  };
};

// contexts: US units first (sq ft, sq yd, sq in), then metric; [thing, area unit, length unit, k range]
const CONTEXTS: [string, string, string, number, number][] = [
  ['patio', 'sq ft', 'ft', 7, 15], ['room', 'sq ft', 'ft', 8, 15], ['rug', 'sq ft', 'ft', 3, 10], ['garden plot', 'sq yd', 'yd', 3, 10],
  ['quilt block', 'sq in', 'in', 6, 15], ['chessboard', 'sq in', 'in', 12, 15], ['sticky note', 'sq in', 'in', 3, 4], ['window', 'sq ft', 'ft', 3, 6],
  ['sticker', 'cm²', 'cm', 3, 10], ['floor tile', 'cm²', 'cm', 10, 15], ['stage', 'm²', 'm', 6, 12], ['classroom', 'm²', 'm', 7, 11],
];
/** a square unit on the board: ft -> ft^2 */
const texSq = (u: string) => `\\text{${u}}^2`;
function context(R: () => number, sg?: string): { thing: string; ua: string; u: string; k: number } {
  const usOnly = sg === 'side-from-area';
  const pool = usOnly ? CONTEXTS.slice(0, 8) : CONTEXTS;
  const [thing, ua, u, lo, hi] = pick(R, pool);
  return { thing, ua, u, k: int(R, Math.max(3, lo), sg === 'side-from-area' ? Math.min(10, hi) : hi) };
}

/** the side with its unit: linear units for a side, square units for an area */
const sideUnits: Gen = (R, n, sg) => {
  const { thing, ua, u, k } = context(R, sg);
  const Ar = k * k;
  const third: Opt = Ar % 4 === 0 && Ar / 4 !== k && R() < 0.5
    ? { t: `${Ar / 4} ${u}`, ok: false, mc: MC.perimeter, say: `${Ar} ÷ 4 shares the area among 4 sides, as if it were the distance around. ${k} × ${k} = ${Ar}, so each side is ${k} ${u}.` }
    : { t: `${half(Ar)} ${u}`, ok: false, mc: MC.halving, say: `That is half of ${Ar}. A side of ${half(Ar)} ${u} would give a far bigger area. ${k} × ${k} = ${Ar}, so ${k} ${u}.` };
  return choice(R, {
    id: `sideUnits-${n}`, family: 'sideUnits', prompt: `A square ${thing} has an area of ${A(`${Ar} ${ua}`)}. How long is each side?`,
    board: `\\text{area} = ${Ar}\\ ${texSq(u)}`,
    pic: tilesPic(Ar, { area: `${Ar} ${ua}`, side: `${k} ${u}`, ask: 'side = ?' }, ['slab', 'area', 'side'], ['tiles', 'reveal']),
    solveTex: [`${k}\\ \\text{${u}} \\times ${k}\\ \\text{${u}} = ${Ar}\\ ${texSq(u)}`],
    solution: [`${k} × ${k} = ${A(Ar)}, so each side is ${S(`${k} ${u}`)}.`, `A side is a length: ${u}, not ${ua}. Check: ${k} ${u} × ${k} ${u} = ${Ar} ${ua}.`],
  }, [
    { t: `${k} ${u}`, ok: true, say: `Yes: ${k} ${u} × ${k} ${u} = ${Ar} ${ua}. A side is a length, so ${u}.` },
    { t: `${k} ${ua}`, ok: false, mc: MC.wrongUnit, say: `The number is right, but a side is a LENGTH: ${k} ${u}. Square units (${ua}) measure the area.` },
    third,
  ]);
};

/** read and write the radical sign: picture <-> k x k = A <-> sqrt(A) = k */
const translate: Gen = (R, n) => {
  const k = int(R, 2, 10), Ar = k * k;
  const v = int(R, 0, 3);
  const pic = tilesPic(Ar, { area: `${Ar} tiles`, side: `${k}` }, ['tiles', 'area', 'side'], ['rows']);
  const base = { id: `translate-${n}`, family: 'translate' as const, solveTex: [`${k} \\times ${k} = ${Ar}`, `\\sqrt{${Ar}} = ${k}`], solution: [`The area ${A(Ar)} goes under the root sign; the side ${S(String(k))} is its value.`, `${k} × ${k} = ${Ar} says the same as ${rad(Ar)} = ${k}.`] };
  if (v === 0) return choice(R, { ...base, prompt: `A square of ${A(`${Ar} tiles`)} has sides of ${S(String(k))}. Which equation goes with it?`, board: '\\sqrt{\\ ?\\ } = \\ ?', pic, solveTex: [`\\sqrt{${Ar}} = ${k}`] }, [
    { t: `${rad(Ar)} = ${k}`, ok: true, say: `Yes: the area goes under the sign, the side is the value.` },
    { t: `${rad(k)} = ${Ar}`, ok: false, mc: MC.swap, say: `That is swapped. The AREA (${Ar}) goes under the sign; the root is the side: ${rad(Ar)} = ${k}.` },
    { t: `${rad(Ar)} = ${Ar}`, ok: false, mc: MC.ignores, say: `The root sign changes the number: ${rad(Ar)} is the side, ${k}, not ${Ar}.` },
  ]);
  if (v === 1) return choice(R, { ...base, prompt: `${k} × ${k} = ${Ar}. Which says the same thing?`, board: `${k} \\times ${k} = ${Ar}`, pic, bareFirst: true }, [
    { t: `${rad(Ar)} = ${k}`, ok: true, say: `Yes: ${k} times itself makes ${Ar}, so the square root of ${Ar} is ${k}.` },
    { t: `${rad(k)} = ${Ar}`, ok: false, mc: MC.swap, say: `Swapped: the bigger number, the area ${Ar}, goes under the sign. ${rad(Ar)} = ${k}.` },
    { t: `${rad(Ar)} = ${Ar * Ar}`, ok: false, mc: MC.misreads, say: `${Ar * Ar} is ${Ar} × ${Ar}: that squares ${Ar}. The root goes back to the side: ${rad(Ar)} = ${k}.` },
  ]);
  if (v === 2) {
    const askSide = R() < 0.5;
    return choice(R, { ...base, prompt: `In ${rad(Ar)} = ${k}, what does ${askSide ? k : Ar} stand for?`, board: `\\sqrt{${Ar}} = ${k}`, pic, bareFirst: true, solveTex: [`${k} \\times ${k} = ${Ar}`] }, askSide ? [
      { t: `The side of a square with area ${Ar}`, ok: true, say: `Yes: ${k} is the side, and ${k} × ${k} = ${Ar}.` },
      { t: `The area of a square with side ${Ar}`, ok: false, mc: MC.swap, say: `Swapped: ${Ar} is the area (under the sign), ${k} is the side.` },
      { t: `Half of ${Ar}`, ok: false, mc: MC.halving, say: `Half of ${Ar} is ${half(Ar)}. ${k} is the side: ${k} × ${k} = ${Ar}.` },
    ] : [
      { t: 'The area of the square', ok: true, say: `Yes: the number under the sign is the area; ${k} is the side.` },
      { t: 'The side of the square', ok: false, mc: MC.swap, say: `Swapped: under the sign is the area, ${Ar}. The side is the value, ${k}.` },
      { t: `${Ar} times ${Ar}`, ok: false, mc: MC.misreads, say: `The root sign does not square. ${Ar} is the area, and ${rad(Ar)} is its side, ${k}.` },
    ]);
  }
  return choice(R, { ...base, prompt: `How do you read ${rad(Ar)} aloud?`, board: `\\sqrt{${Ar}}`, pic, bareFirst: true, solveTex: [`${k} \\times ${k} = ${Ar}`, `\\sqrt{${Ar}} = ${k}`] }, [
    { t: `“the square root of ${Ar}”`, ok: true, say: `Yes. It means the side of a square of area ${Ar}: ${k}.` },
    { t: `“${Ar} squared”`, ok: false, mc: MC.misreads, say: `“${Ar} squared” is ${Ar}². ${rad(Ar)} is “the square root of ${Ar}”, which is ${k}.` },
    { t: `“${Ar} divided by 2”`, ok: false, mc: MC.halving, say: `The root sign does not halve. ${rad(Ar)} is “the square root of ${Ar}”: ${k}, since ${k} × ${k} = ${Ar}.` },
  ]);
};

/** sqrt(A) for a perfect square A, typed */
const evalRoot: Gen = (R, n, sg) => {
  let k: number;
  if (sg === 'evaluate-roots-to-225') k = R() < 0.7 ? int(R, 11, 15) : int(R, 0, 10);
  else if (sg === 'radical-notation') k = int(R, 1, 10);
  else k = R() < 0.1 ? 0 : int(R, 1, 10);
  const Ar = k * k;
  const prompt = pick(R, [`Find ${rad(A(Ar))}.`, `What is the square root of ${A(Ar)}?`, `${rad(A(Ar))} = ?`]);
  return {
    id: `evalRoot-${n}`, family: 'evalRoot', prompt, board: `\\sqrt{${Ar}} = \\,?`, input: 'num', unit: '',
    pic: k > 0 ? tilesPic(Ar, { area: `${Ar} tiles`, side: `${k}` }, ['tiles', 'area'], ['side', 'rows']) : undefined,
    bareFirst: true, solveTex: [`${k} \\times ${k} = ${Ar}`, `\\sqrt{${Ar}} = ${k}`],
    solution: k === 0 ? ['0 × 0 = 0.', `So ${rad(0)} = ${S('0')}: a square with side 0 has area 0.`] : rootSolution(Ar), answer: { kind: 'num', v: k },
    check: r => { const v = needNum(r); return v === null ? { ok: false, say: 'Type a whole number.' } : classifyRoot(v, Ar); },
  };
};

/** sqrt(0) = 0, and sqrt(A) is never negative */
const zeroRoot: Gen = (R, n) => {
  const v = int(R, 0, 3);
  const base = { id: `zeroRoot-${n}`, family: 'zeroRoot' as const, solveTex: ['0 \\times 0 = 0', '\\sqrt{0} = 0'], solution: ['0 × 0 = 0, so ' + rad(0) + ' = 0.', `${rad('A')} is a side length: 0 or more, never negative.`] };
  if (v === 0) return choice(R, { ...base, prompt: `What is ${rad(0)}?`, board: '\\sqrt{0} = \\,?' }, [
    { t: '0, because 0 × 0 = 0', ok: true, say: `Yes: 0 × 0 = 0, so ${rad(0)} = 0. A square with side 0 has area 0.` },
    { t: 'It has no value: there is no square with side 0.', ok: false, mc: MC.zeroUndef, say: `It has a value: 0 × 0 = 0, so ${rad(0)} = 0. The value of a square root can be 0.` },
    { t: `1, like ${rad(1)}`, ok: false, say: `1 × 1 = 1, not 0. 0 × 0 = 0, so ${rad(0)} = 0.` },
  ]);
  if (v === 1) return choice(R, { ...base, prompt: 'Which is true?', board: '\\sqrt{0} \\quad \\sqrt{1}' }, [
    { t: `${rad(0)} = 0 and ${rad(1)} = 1`, ok: true, say: 'Yes: 0 × 0 = 0 and 1 × 1 = 1.' },
    { t: `${rad(0)} has no value, and ${rad(1)} = 1`, ok: false, mc: MC.zeroUndef, say: `${rad(0)} has a value: 0 × 0 = 0, so it is 0.` },
    { t: `${rad(0)} = 0 and ${rad(1)} = 0.5`, ok: false, mc: MC.halving, say: `The root is not half: 0.5 × 0.5 = 0.25. 1 × 1 = 1, so ${rad(1)} = 1.` },
  ]);
  if (v === 2) return choice(R, { ...base, prompt: `Which is true for every whole number A?`, board: '\\sqrt{A}\\ ?\\ 0' }, [
    { t: `${rad('A')} is 0 or more.`, ok: true, say: `Yes: it is a side length. It can be 0 (${rad(0)} = 0) but never negative.` },
    { t: `${rad('A')} is always more than 0.`, ok: false, mc: MC.zeroUndef, say: `Not always: ${rad(0)} = 0, because 0 × 0 = 0. So the value can be 0.` },
    { t: `${rad('A')} can be negative, like ${rad(49)} = −7.`, ok: false, mc: MC.plusMinus, say: `The root sign names one number, the side: ${rad(49)} = 7. It is never negative.` },
  ]);
  const k = int(R, 3, 10), Ar = k * k;
  return choice(R, { ...base, prompt: `${rad(A(Ar))} = ?`, board: `\\sqrt{${Ar}} = \\,?`, solveTex: [`${k} \\times ${k} = ${Ar}`, `\\sqrt{${Ar}} = ${k}`], solution: rootSolution(Ar), pic: tilesPic(Ar, { area: `${Ar} tiles`, side: `${k}` }, ['tiles', 'area'], ['side']), bareFirst: true }, [
    { t: String(k), ok: true, say: `Yes: ${k} × ${k} = ${Ar}. One number, the side.` },
    { t: `${k} or −${k}`, ok: false, mc: MC.plusMinus, say: `The root sign names ONE number, the side length: ${rad(Ar)} = ${k}, never negative.` },
    { t: half(Ar), ok: false, mc: MC.halving, say: `That is half of ${Ar}. ${k} × ${k} = ${Ar}, so ${rad(Ar)} = ${k}.` },
  ]);
};

/** someone's root, checked by squaring */
const VISIBLE: Record<number, number> = { 16: 1, 25: 2, 36: 3, 49: 4, 64: 6, 81: 8, 121: 12, 144: 14, 169: 16, 196: 19, 225: 22 };
const checkRoot: Gen = (R, n, sg) => {
  const k = sg === 'evaluate-roots-to-225' ? int(R, 11, 15) : int(R, 4, 10), Ar = k * k;
  const who = pick(R, NAMES);
  const truth = R() < 0.35;
  const vis = VISIBLE[Ar];
  const g = truth ? k : vis !== undefined && vis !== k && R() < 0.65 ? vis : pick(R, [k - 1, k + 1]);
  const fromDigits = !truth && g === vis;
  const ghost = !truth && g <= 18 && g !== k ? g : undefined;
  const opts: Opt[] = truth ? [
    { t: `Yes: ${k} × ${k} = ${Ar}.`, ok: true, say: `Right: squaring ${k} gives back ${Ar}.` },
    { t: `No: ${rad(Ar)} is half of ${Ar}, so ${half(Ar)}.`, ok: false, mc: MC.halving, say: `Check: ${half(Ar)} × ${half(Ar)} is far more than ${Ar}. ${k} × ${k} = ${Ar}, so ${who} is right.` },
    { t: `No: ${k} × 2 = ${2 * k}, not ${Ar}.`, ok: false, mc: MC.baseTimesExp, say: `Squaring is ${k} × ${k}, not ${k} × 2. ${k} × ${k} = ${Ar}, so ${who} is right.` },
  ] : [
    { t: `No: ${g} × ${g} = ${g * g}, not ${Ar}. ${rad(Ar)} = ${k}.`, ok: true, say: `Right: the check fails, so ${g} is not the root. ${k} × ${k} = ${Ar}.` },
    { t: fromDigits ? `Yes: ${Ar} starts with ${g}.` : `Yes: ${g} is close enough.`, ok: false, mc: MC.noCheck, say: `Check it by squaring: ${g} × ${g} = ${g * g}, not ${Ar}. ${k} × ${k} = ${Ar}, so ${rad(Ar)} = ${k}.` },
    { t: `No: ${rad(Ar)} = ${half(Ar)}, half of ${Ar}.`, ok: false, mc: MC.halving, say: `Half does not check either: ${half(Ar)} × ${half(Ar)} is far more than ${Ar}. ${k} × ${k} = ${Ar}.` },
  ];
  return choice(R, {
    id: `checkRoot-${n}`, family: 'checkRoot', prompt: `${who} says ${rad(A(Ar))} = ${g}. Check it by squaring.`, board: `\\sqrt{${Ar}} \\overset{?}{=} ${g}`,
    pic: tilesPic(Ar, { area: `${Ar} tiles`, side: `${k}` }, ['tiles', 'area'], ghost ? ['ghost', 'side'] : ['side'], ghost ? { ghost } : {}), bareFirst: true,
    solveTex: truth ? [`${k} \\times ${k} = ${Ar}`] : [`${g} \\times ${g} = ${g * g}`, `${k} \\times ${k} = ${Ar}`],
    solution: truth ? [`Square the claim: ${k} × ${k} = ${A(Ar)}. It checks.`] : [`Square the claim: ${g} × ${g} = ${g * g}, not ${A(Ar)}.`, `${k} × ${k} = ${Ar}, so ${rad(Ar)} = ${S(String(k))}.`],
  }, opts);
};

/** pick the perfect square among near misses (multiples of 11 for 121..225, even numbers otherwise) */
const whichSquare: Gen = (R, n, sg) => {
  const big = sg === 'evaluate-roots-to-225';
  const k = big ? int(R, 11, 15) : int(R, 4, 15), Sq = k * k;
  let ds: number[];
  if (big) ds = shuffle(R, [110, 132, 154, 165, 176, 187, 198, 209, 220].filter(x => Math.abs(x - Sq) <= 40)).slice(0, 2);
  else {
    const up = [Sq + 1, Sq + 2].find(x => x % 2 === 0 && !isSquare(x))!, dn = [Sq - 1, Sq - 2].find(x => x % 2 === 0 && !isSquare(x))!;
    ds = [up, dn];
  }
  const opts: Opt[] = [{ t: String(Sq), ok: true, say: `Yes: ${k} × ${k} = ${Sq}.` }, ...ds.map(d => {
    const kd = isqrt(d);
    return big
      ? { t: String(d), ok: false, mc: MC.eleven, say: `${d} = 11 × ${d / 11}, but being a multiple of 11 doesn't make a square: ${kd} × ${kd} = ${kd * kd} and ${kd + 1} × ${kd + 1} = ${(kd + 1) ** 2}. ${Sq} = ${k} × ${k}.` }
      : { t: String(d), ok: false, mc: MC.even, say: `${d} is even, but even is not enough: ${kd} × ${kd} = ${kd * kd} and ${kd + 1} × ${kd + 1} = ${(kd + 1) ** 2}. ${Sq} = ${k} × ${k}.` };
  })];
  return choice(R, {
    id: `whichSquare-${n}`, family: 'whichSquare', prompt: 'Which of these is a perfect square?', board: `${opts.map(o => o.t).sort((a, b) => Number(a) - Number(b)).join(',\\ \\ ')}`,
    pic: tilesPic(Sq, { area: `${Sq} tiles`, side: `${k}` }, ['tiles', 'area'], ['side']), bareFirst: true,
    solveTex: [`${k} \\times ${k} = ${Sq}`],
    solution: [`Run through the squares: … ${(k - 1) ** 2}, ${A(Sq)}, ${(k + 1) ** 2} …`, `${k} × ${k} = ${Sq}. The others fall between two squares.`],
  }, opts);
};

/** perfect square or not, with the reason */
const NEAR: number[] = [];
for (let k = 3; k <= 15; k++) for (const d of [-2, -1, 1, 2]) { const x = k * k + d; if (x >= 5 && x <= 224 && !isSquare(x)) NEAR.push(x); }
const isSquareFam: Gen = (R, n) => {
  const sq = R() < 0.45;
  const N = sq ? int(R, 4, 15) ** 2 : R() < 0.6 ? pick(R, NEAR) : (() => { let x; do x = int(R, 10, 224); while (isSquare(x)); return x; })();
  const k = isqrt(N), [a, b] = factorPair(N);
  const opts: Opt[] = sq ? [
    { t: `Yes: ${k} × ${k} = ${N}.`, ok: true, say: `Yes: two equal whole-number factors, ${k} × ${k}.` },
    { t: `No: ${N} = ${a} × ${b}, a rectangle.`, ok: false, mc: MC.arrangement, say: `${a} × ${b} is one way to lay out ${N} tiles; ${k} × ${k} is another, and it is a square. So ${N} IS a perfect square.` },
    N % 2 === 0
      ? { t: 'Yes: every even number is a perfect square.', ok: false, mc: MC.even, say: `Yes, but not because it is even (${N + 2} is even and not a square). It is a square because ${k} × ${k} = ${N}.` }
      : { t: `Yes: ${a} × ${b} = ${N}.`, ok: false, mc: MC.anyPair, say: `Yes, but a factor pair is not the reason: every number has one. The reason is ${k} × ${k} = ${N}.` },
  ] : [
    { t: `No: ${k} × ${k} = ${k * k} and ${k + 1} × ${k + 1} = ${(k + 1) ** 2}; ${N} is in between.`, ok: true, say: `Right: no whole number lands between ${k} and ${k + 1}, so no whole number times itself makes ${N}.` },
    { t: `Yes: ${a} × ${b} = ${N}.`, ok: false, mc: MC.anyPair, say: `A factor pair only makes a rectangle. A square needs EQUAL factors: ${k} × ${k} = ${k * k}, ${k + 1} × ${k + 1} = ${(k + 1) ** 2}.` },
    N % 2 === 0 ? { t: `Yes: ${N} is even.`, ok: false, mc: MC.even, say: `Even is not enough: ${N} sits between ${k * k} and ${(k + 1) ** 2}.` }
      : N % 11 === 0 ? { t: `Yes: ${N} is a multiple of 11, like 121.`, ok: false, mc: MC.eleven, say: `121 is a square because 11 × 11 = 121, not because of the 11s. ${N} sits between ${k * k} and ${(k + 1) ** 2}.` }
        : { t: 'No: odd numbers are never perfect squares.', ok: false, say: `The answer is no, but odd squares exist: 9, 25, 49. ${N} is not a square because it sits between ${k * k} and ${(k + 1) ** 2}.` },
  ];
  return choice(R, {
    id: `isSquare-${n}`, family: 'isSquare', prompt: `Is ${A(N)} a perfect square?`, board: `${N}`,
    pic: tilesPic(N, { area: `${N} tiles`, side: `${k}` }, ['tiles', 'area'], sq ? ['side'] : ['extra', 'ghost'], sq ? {} : { ghost: k + 1 }), bareFirst: true,
    solveTex: sq ? [`${k} \\times ${k} = ${N}`] : [`${k} \\times ${k} = ${k * k}`, `${k + 1} \\times ${k + 1} = ${(k + 1) ** 2}`],
    solution: sq ? [`${k} × ${k} = ${A(N)}: yes.`] : [`${k} × ${k} = ${k * k} < ${N} < ${(k + 1) ** 2} = ${k + 1} × ${k + 1}.`, `No whole number lies between ${k} and ${k + 1}, so ${N} is not a perfect square.`],
  }, opts);
};

/** a non-square n between consecutive perfect squares */
const nonSquare = (R: () => number, lo = 2, hi = 224) => {
  if (R() < 0.4) { const near = NEAR.filter(x => x >= lo && x <= hi); if (near.length) return pick(R, near); }
  let x; do x = int(R, lo, hi); while (isSquare(x)); return x;
};
const between: Gen = (R, n) => {
  const N = nonSquare(R), k = isqrt(N), lo = k * k, hi = (k + 1) ** 2;
  return {
    id: `between-${n}`, family: 'between', prompt: `Which two <b>consecutive</b> perfect squares is ${A(N)} between?`, board: `?\\ < ${N} < \\ ?`,
    input: 'pair', pairLead: '', pairOp: `< ${N} <`,
    pic: tilesPic(N, { area: `${N} tiles`, side: `${k}` }, ['tiles', 'area'], ['extra', 'ghost'], { ghost: k + 1 }),
    solveTex: [`${k} \\times ${k} = ${lo}`, `${k + 1} \\times ${k + 1} = ${hi}`, `${lo} < ${N} < ${hi}`],
    solution: [`${k} × ${k} = ${A(lo)}: a full ${k} by ${k} square, and ${N - lo} tile${N - lo === 1 ? '' : 's'} left over.`, `${k + 1} × ${k + 1} = ${A(hi)}: the next square needs more tiles than ${N}.`, `So ${ans(lo)} &lt; ${N} &lt; ${ans(hi)}.`],
    answer: { kind: 'pair', x: lo, y: hi },
    check: r => {
      if (r.kind !== 'pair') return { ok: false, say: 'Fill in both boxes.' };
      const { x, y } = r;
      if (x === lo && y === hi) return { ok: true, say: `Yes: ${k} × ${k} = ${lo} and ${k + 1} × ${k + 1} = ${hi}.` };
      if (x === N - 1 && y === N + 1) return { ok: false, mc: MC.neighbours, say: `${N - 1} and ${N + 1} are the numbers next to ${N}, not perfect squares. The squares around it: ${k} × ${k} = ${lo} and ${k + 1} × ${k + 1} = ${hi}.` };
      if (isSquare(x) && isSquare(y) && x < N && N < y) return { ok: false, mc: MC.nonConsec, say: `Both are squares, but not consecutive: ${isqrt(x)} and ${isqrt(y)} are not next to each other. The closest pair: ${lo} < ${N} < ${hi}.` };
      if (x === k && y === k + 1) return { ok: false, say: `${k} and ${k + 1} are the SIDES. The question asks for the squares: ${k} × ${k} = ${lo} and ${k + 1} × ${k + 1} = ${hi}.` };
      return { ok: false, say: `Find the squares on both sides: ${k} × ${k} = ${lo} < ${N} < ${hi} = ${k + 1} × ${k + 1}.` };
    },
  };
};

/** k < sqrt(n) < k + 1 on the number line */
const boundRoot: Gen = (R, n) => {
  const N = nonSquare(R), k = isqrt(N), lo = k * k, hi = (k + 1) ** 2;
  return {
    id: `boundRoot-${n}`, family: 'boundRoot', prompt: `${rad(A(N))} is between which two consecutive whole numbers?`, board: `?\\ < \\sqrt{${N}} < \\ ?`,
    input: 'pair', pairLead: '', pairOp: `< √${N} <`,
    pic: { kind: 'line', n: N, show: ['axis'], solve: ['squares', 'bracket'] },
    solveTex: [`${lo} < ${N} < ${hi}`, `${k} < \\sqrt{${N}} < ${k + 1}`],
    solution: [`The squares around ${N}: ${k} × ${k} = ${A(lo)} and ${k + 1} × ${k + 1} = ${A(hi)}.`, `${lo} < ${N} < ${hi}, so the side lies between ${k} and ${k + 1}.`, `${ans(k)} &lt; ${rad(N)} &lt; ${ans(k + 1)}.`],
    answer: { kind: 'pair', x: k, y: k + 1 },
    check: r => {
      if (r.kind !== 'pair') return { ok: false, say: 'Fill in both boxes.' };
      const { x, y } = r;
      if (x === k && y === k + 1) return { ok: true, say: `Yes: ${lo} < ${N} < ${hi}, so ${k} < ${rad(N)} < ${k + 1}.` };
      if (x === lo && y === hi) return { ok: false, mc: MC.squaresAsBounds, say: `${lo} and ${hi} are the squares around ${N}. The ROOT lies between their roots: ${k} and ${k + 1}.` };
      if (N >= 8 && x <= N / 2 && N / 2 <= y && y - x <= 1) return { ok: false, mc: MC.halving, say: `That is about half of ${N}. The root is much smaller: ${k} × ${k} = ${lo} and ${k + 1} × ${k + 1} = ${hi}, so ${k} < ${rad(N)} < ${k + 1}.` };
      return { ok: false, say: `Check by squaring: ${x} × ${x} = ${x * x} and ${y} × ${y} = ${y * y}. The squares around ${N} are ${lo} and ${hi}, so ${k} < ${rad(N)} < ${k + 1}.` };
    },
  };
};

/** which whole number the root is nearer to: compare the distances to the two squares */
const nearer: Gen = (R, n) => {
  let N: number, k: number;
  do { N = nonSquare(R, 5, 224); k = isqrt(N); } while (k < 2);
  const lo = k * k, hi = (k + 1) ** 2, dLo = N - lo, dHi = hi - N, near = dLo < dHi ? k : k + 1, far = near === k ? k + 1 : k;
  const opts: Opt[] = [
    { t: `${near}: ${N} − ${lo} = ${dLo} and ${hi} − ${N} = ${dHi}`, ok: true, say: `Yes: ${N} is closer to ${near === k ? lo : hi} = ${near} × ${near}, so ${rad(N)} is nearer ${near}.` },
    near === k
      ? { t: `${k + 1}: ${N} is more than ${k}.5`, ok: false, mc: MC.midpoint, say: `${N} is compared with the wrong thing. Compare ${N} with the squares: ${N} − ${lo} = ${dLo}, ${hi} − ${N} = ${dHi}. It is closer to ${lo}, so nearer ${k}.` }
      // (a distractor must name the wrong number: "k + 1, because N is more than k.5" named the right one too)
      : { t: `${k}: the gap ${N} − ${lo} = ${dLo} is the bigger one`, ok: false, mc: MC.midpoint, say: `Nearer means the SMALLER gap: ${hi} − ${N} = ${dHi} is smaller than ${dLo}, so ${rad(N)} is nearer ${k + 1}.` },
    { t: `${rad(N)} = ${near} exactly`, ok: false, mc: MC.roundedExact, say: `Nearer is not equal: ${near} × ${near} = ${near * near}, not ${N}. ${rad(N)} is only near ${near}.` },
  ];
  const t = Math.floor(N / 10);
  if (N >= 10 && N < 100 && t !== k && t !== k + 1) opts.push({ t: `${t}: the tens digit of ${N}`, ok: false, mc: MC.tensDigit, say: `The tens digit does not give the root: ${t} × ${t} = ${t * t}. ${rad(N)} is between ${k} and ${k + 1}, nearer ${near}.` });
  void far;
  return choice(R, {
    id: `nearer-${n}`, family: 'nearer', prompt: `${rad(A(N))} is between ${k} and ${k + 1}. Which whole number is it nearer to?`, board: `${k} < \\sqrt{${N}} < ${k + 1}`,
    pic: { kind: 'line', n: N, show: ['axis', 'bracket'], solve: ['squares', 'near'] },
    solveTex: [`${N} - ${lo} = ${dLo}`, `${hi} - ${N} = ${dHi}`],
    solution: [`The squares: ${k} × ${k} = ${A(lo)} and ${k + 1} × ${k + 1} = ${A(hi)}.`, `${N} − ${lo} = ${dLo} and ${hi} − ${N} = ${dHi}.`, `${N} is closer to ${near === k ? lo : hi}, so ${rad(N)} is nearer ${S(String(near))}.`],
  }, opts);
};

/** the square root is not half */
const halving: Gen = (R, n) => {
  const N = pick(R, [16, 36, 64, 100]), k = isqrt(N), h = N / 2;
  const who = pick(R, NAMES), v = int(R, 0, 2);
  const ghost = h <= 18 ? { ghost: h } : {};
  const pic = tilesPic(N, { area: `${N} tiles`, side: `${k}` }, ['tiles', 'area'], h <= 18 ? ['side', 'ghost'] : ['side'], ghost);
  if (v === 1) {
    const kk = int(R, 3, 10);
    return choice(R, {
      id: `halving-${n}`, family: 'halving', prompt: `${who} says ${kk}² = ${2 * kk}. Is that right?`, board: `${kk}^2 \\overset{?}{=} ${2 * kk}`,
      pic: tilesPic(kk * kk, { area: `${kk * kk} tiles`, side: `${kk}`, rows: `${kk} rows` }, ['tiles', 'area'], ['side', 'rows']), bareFirst: true,
      solveTex: [`${kk}^2 = ${kk} \\times ${kk} = ${kk * kk}`], solution: [`${kk}² means ${kk} × ${kk}: ${kk} rows of ${kk}.`, `${kk} × ${kk} = ${kk * kk}, not ${2 * kk}. Squaring is not doubling.`],
    }, [
      { t: `No: ${kk}² = ${kk} × ${kk} = ${kk * kk}.`, ok: true, say: `Right: squaring is ${kk} × ${kk}. Doubling is ${kk} × 2.` },
      { t: `Yes: ${kk}² means ${kk} × 2.`, ok: false, mc: MC.baseTimesExp, say: `The 2 says how many ${kk}s to multiply: ${kk} × ${kk} = ${kk * kk}.` },
      { t: `No: ${kk}² = ${kk} + 2 = ${kk + 2}.`, ok: false, say: `${kk}² is ${kk} × ${kk} = ${kk * kk}.` },
    ]);
  }
  if (v === 2) return choice(R, {
    id: `halving-${n}`, family: 'halving', prompt: `Which is bigger: ${rad(A(N))} or ${A(N)} ÷ 2?`, board: `\\sqrt{${N}} \\quad ${N} \\div 2`, pic, bareFirst: true,
    solveTex: [`\\sqrt{${N}} = ${k}`, `${N} \\div 2 = ${h}`], solution: [`${rad(N)} = ${k}, because ${k} × ${k} = ${N}.`, `${N} ÷ 2 = ${h}, because 2 × ${h} = ${N}.`, `${h} > ${k}: they are different operations.`],
  }, [
    { t: `${N} ÷ 2: it is ${h}, and ${rad(N)} is only ${k}.`, ok: true, say: `Yes: ${k} × ${k} = ${N}, while 2 × ${h} = ${N}. Different questions, different answers.` },
    { t: `${rad(N)}`, ok: false, say: `${rad(N)} = ${k} (${k} × ${k} = ${N}), and ${N} ÷ 2 = ${h}. ${h} is bigger.` },
    { t: 'They are the same.', ok: false, mc: MC.halving, say: `Taking the root is not halving: ${rad(N)} = ${k}, but ${N} ÷ 2 = ${h}.` },
  ]);
  return choice(R, {
    id: `halving-${n}`, family: 'halving', prompt: `${who} says ${rad(A(N))} = ${h}, because half of ${N} is ${h}. Check it by squaring.`, board: `\\sqrt{${N}} \\overset{?}{=} ${h}`, pic, bareFirst: true,
    solveTex: [`${h} \\times ${h} = ${h * h}`, `${k} \\times ${k} = ${N}`],
    solution: [`Square the claim: ${h} × ${h} = ${h * h}, not ${A(N)}.`, `${k} × ${k} = ${N}, so ${rad(N)} = ${S(String(k))}. Half answers a different question: 2 × ? = ${N}.`],
  }, [
    { t: `No: ${h} × ${h} = ${h * h}, not ${N}. ${rad(N)} = ${k}.`, ok: true, say: `Right: halving undoes doubling, not squaring.` },
    { t: `Yes: 2 × ${h} = ${N}, so it checks out.`, ok: false, mc: MC.halving, say: `2 × ${h} checks a HALF. A root is checked by squaring: ${h} × ${h} = ${h * h}, not ${N}. ${rad(N)} = ${k}.` },
    { t: 'Yes: the square root always means half.', ok: false, mc: MC.halving, say: `It means the number whose square is ${N}: ${k} × ${k} = ${N}, so ${rad(N)} = ${k}, not ${h}.` },
  ]);
};

/** one counterexample breaks an "always" rule; agreeing at 0 and 4 proves nothing */
const SUMS: [number, number][] = [[9, 16], [36, 64], [25, 144], [81, 144], [16, 9], [64, 36], [144, 25], [144, 81]];
const counterexample: Gen = (R, n) => {
  const Nc = pick(R, [16, 36, 64, 100]), kc = isqrt(Nc), hc = Nc / 2, who = pick(R, NAMES), v = int(R, 0, 2);
  const pic = tilesPic(Nc, { area: `${Nc} tiles`, side: `${kc}` }, ['tiles', 'area'], hc <= 18 ? ['side', 'ghost'] : ['side'], hc <= 18 ? { ghost: hc } : {});
  if (v === 0) {
    const N0 = pick(R, [0, 4]);
    return choice(R, {
      id: `counterexample-${n}`, family: 'counterexample',
      prompt: `${who} notices ${rad(N0)} = ${N0 / 2} and ${N0} ÷ 2 = ${N0 / 2}, and says: “The square root of a number is always half of it.” Is that always, sometimes, or never true?`,
      board: `\\sqrt{N} \\overset{?}{=} N \\div 2`, pic, bareFirst: true, solveTex: [`\\sqrt{${Nc}} = ${kc}`, `${Nc} \\div 2 = ${hc}`],
      solution: [`It works for 0 and 4: ${rad(0)} = 0 = 0 ÷ 2 and ${rad(4)} = 2 = 4 ÷ 2.`, `It fails for ${Nc}: ${rad(Nc)} = ${kc}, but ${Nc} ÷ 2 = ${hc}.`, 'One counterexample is enough: the rule is only sometimes true.'],
    }, [
      { t: `Sometimes: it works for 0 and 4, but ${rad(Nc)} = ${kc} and ${Nc} ÷ 2 = ${hc}.`, ok: true, say: `Right: one counterexample (${Nc}) breaks the “always”.` },
      { t: `Always: it worked when ${who} checked.`, ok: false, mc: MC.examplesProof, say: `A case that works can't prove “always”. Try ${Nc}: ${rad(Nc)} = ${kc}, but ${Nc} ÷ 2 = ${hc}. One failure breaks the rule.` },
      { t: 'Never: two different rules can never give the same answer.', ok: false, mc: MC.differEverywhere, say: `They can meet: at ${N0} both give ${N0 / 2}. Different rules can agree at a few numbers and still be different, like at ${Nc}.` },
    ]);
  }
  if (v === 1) return choice(R, {
    id: `counterexample-${n}`, family: 'counterexample', prompt: `Which number shows that “${rad('N')} = N ÷ 2” is NOT always true?`,
    board: `\\sqrt{N} \\overset{?}{=} N \\div 2`, pic, bareFirst: true, solveTex: [`\\sqrt{${Nc}} = ${kc}`, `${Nc} \\div 2 = ${hc}`],
    solution: [`Test each: ${rad(0)} = 0 = 0 ÷ 2, ${rad(4)} = 2 = 4 ÷ 2: those agree.`, `${rad(Nc)} = ${kc} but ${Nc} ÷ 2 = ${hc}: ${Nc} is a counterexample.`],
  }, [
    { t: String(Nc), ok: true, say: `Yes: ${rad(Nc)} = ${kc}, but ${Nc} ÷ 2 = ${hc}.` },
    { t: '4', ok: false, mc: MC.examplesProof, say: `At 4 the rule works: ${rad(4)} = 2 = 4 ÷ 2. A counterexample is a case where it FAILS, like ${Nc}.` },
    { t: '0', ok: false, mc: MC.examplesProof, say: `At 0 the rule works: ${rad(0)} = 0 = 0 ÷ 2. A counterexample is a case where it FAILS, like ${Nc}.` },
  ]);
  const [a2, b2] = pick(R, SUMS), a = isqrt(a2), b = isqrt(b2), c2 = a2 + b2, c = isqrt(c2);
  return choice(R, {
    id: `counterexample-${n}`, family: 'counterexample', prompt: `${who} says ${rad(`${a2} + ${b2}`)} = ${rad(a2)} + ${rad(b2)}. Is that right?`,
    board: `\\sqrt{${a2} + ${b2}} \\overset{?}{=} \\sqrt{${a2}} + \\sqrt{${b2}}`, solveTex: [`\\sqrt{${a2} + ${b2}} = \\sqrt{${c2}} = ${c}`, `\\sqrt{${a2}} + \\sqrt{${b2}} = ${a} + ${b} = ${a + b}`],
    solution: [`Add first: ${a2} + ${b2} = ${c2}, and ${rad(c2)} = ${c}.`, `Root first: ${rad(a2)} + ${rad(b2)} = ${a} + ${b} = ${a + b}.`, `${c} ≠ ${a + b}: the root of a sum is not the sum of the roots.`],
  }, [
    { t: `No: ${rad(c2)} = ${c}, but ${a} + ${b} = ${a + b}.`, ok: true, say: `Right: this one pair is a counterexample, so the rule is not always true.` },
    { t: 'Yes: take the root of each part.', ok: false, mc: MC.partByPart, say: `Test it: ${a2} + ${b2} = ${c2} and ${rad(c2)} = ${c}, but ${a} + ${b} = ${a + b}. The root does not split over a +.` },
    { t: `Yes: ${rad('0 + 9')} = ${rad(0)} + ${rad(9)}, so it always works.`, ok: false, mc: MC.examplesProof, say: `One case that works (with a 0) proves nothing. Here: ${rad(c2)} = ${c}, but ${a} + ${b} = ${a + b}.` },
  ]);
};

/** the side of a real square, from its area, in linear units with an area check */
const contextFam: Gen = (R, n, sg) => {
  const { thing, ua, u, k } = context(R, sg);
  const Ar = k * k;
  return {
    id: `context-${n}`, family: 'context', prompt: `A square ${thing} has an area of ${A(`${Ar} ${ua}`)}. How long is each side?`,
    board: `\\text{area} = ${Ar}\\ ${texSq(u)}`, input: 'num', unit: u,
    pic: tilesPic(Ar, { area: `${Ar} ${ua}`, side: `${k} ${u}`, ask: 'side = ?' }, ['slab', 'area', 'side'], ['tiles', 'reveal']),
    solveTex: [`${k} \\times ${k} = ${Ar}`, `\\text{side} = ${k}\\ \\text{${u}}`],
    solution: [`Which length times itself makes ${A(Ar)}? ${k} × ${k} = ${Ar}.`, `Each side is ${S(`${k} ${u}`)}. Check: ${k} ${u} × ${k} ${u} = ${Ar} ${ua}.`],
    answer: { kind: 'num', v: k },
    check: r => { const v = needNum(r); return v === null ? { ok: false, say: 'Type a whole number.' } : classifyRoot(v, Ar, { unit: u, context: true }); },
  };
};

export const GENERATORS: Record<FamilyId, Gen> = {
  squareOf, arrangement, sideFromArea, sideUnits, translate, evalRoot, zeroRoot, checkRoot, whichSquare,
  isSquare: isSquareFam, between, boundRoot, nearer, halving, counterexample, context: contextFam,
};
/** the runtime's Gen type (practice.ts takes a record of these) */
export const GENS: Readonly<Record<string, RtGen>> = GENERATORS;
