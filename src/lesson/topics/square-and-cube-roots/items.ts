// items.ts: exercise families for "square roots and cube roots" (grade 8, 8.EE.A.2, 8.NS.A.1-2). Every family is one
// deep structure; items vary the numbers (in the ranges of the sub-goal they practise, see plan.ts), the form (whole
// numbers, fractions, decimals) and the context. Every wrong answer the classifier recognises carries its id from
// math-curriculum-essentials/misconceptions.json (logged, never shown). Pure: no DOM, no canvas; seeded.
//
// Pictures: an item can carry a square of tiles (seen from above), a cube of unit cubes (isometric) or a root ruler
// (number line); the page draws it and, after a miss, replays the worked solution on it.
import { type Item, type Response, type Verdict, type Gen, A, B, int, pick, shuffle, fr, fracValue, same, gcd } from '../../runtime/item';
import { endOnChoice } from '../../runtime/explain';
import type { RulerMark } from './RootRuler';

// ---------- pictures ----------
/** a square seen from above: `side` = the side label is shown, asked ('?') or written on solve */
export type SqPic = { kind: 'sq'; area: number; unit: string; tiles: 'show' | 'solve' | 'none'; side: 'show' | 'ask' | 'solve'; cut?: { a: number; b: number }; sideTex?: string; areaTex?: string };
/** a cube: `closed` starts as a closed box (filled on solve) */
export type CubePic = { kind: 'cube'; vol: number; unit: string; closed: boolean; edge: 'show' | 'ask' | 'solve'; ghosts?: boolean; edgeTex?: string; volTex?: string };
/** a root ruler; `solveMarks` = marks from this index on appear on solve; band / mid can wait for the solve too */
export type LinePic = { kind: 'line'; lo: number; hi: number; minor: number; labels: number[]; powers?: 2 | 3 | null; marks: RulerMark[]; solveMarks: number; /** TeX lines written on the board on solve */ solveTex?: string[]; band?: [number, number] | null; bandOnSolve?: boolean; mid?: number | null; midOnSolve?: boolean; arcs?: boolean };
/** the same number as a flat square layer and as a cube (64 cubes) */
export type BothPic = { kind: 'both'; n: number; unit: string };
export type Pic = SqPic | CubePic | LinePic | BothPic;
export interface RItem extends Item { picture?: Record<string, unknown> & Pic }

export type FamilyId = 'sqSide' | 'principal' | 'cubeEdge' | 'rootIndex' | 'signRoot' | 'evalSq' | 'evalCube' | 'ratRoot' | 'rational'
  | 'boundSq' | 'boundCube' | 'refine' | 'compare' | 'roundRoot' | 'solveSq' | 'countSol' | 'solveCube' | 'isolate' | 'context' | 'multistep';
export const FAMILY_NAMES: Record<FamilyId, string> = {
  sqSide: 'Undo squaring', principal: 'What √ names', cubeEdge: 'Undo cubing', rootIndex: 'The little 3', signRoot: 'Roots of negatives',
  evalSq: 'Square roots', evalCube: 'Cube roots', ratRoot: 'Roots of fractions and decimals', rational: 'Rational or irrational?',
  boundSq: 'Between two whole numbers', boundCube: 'Cube root between whole numbers', refine: 'Close in to tenths', compare: 'Compare and order',
  roundRoot: 'Round a root', solveSq: 'Solve x² = p', countSol: 'How many solutions?', solveCube: 'Solve x³ = p', isolate: 'One step, then the root',
  context: 'Real-world roots', multistep: 'Roots inside expressions',
};

/** the misconceptions each item should recognise (tests) */
export const PROBES = new WeakMap<Item, { r: Response; mc: string }[]>();

export const MC = {
  baseTimesExp: 'mc.exponents-roots.power-as-base-times-exponent',
  divIndex: 'mc.exponents-roots.root-as-dividing-by-index',
  plusMinus: 'mc.exponents-roots.principal-root-as-plus-minus',
  needApprox: 'mc.exponents-roots.squared-root-requires-approximation',
  ignoreIndex: 'mc.exponents-roots.ignores-root-index',
  indexMult: 'mc.exponents-roots.root-index-as-multiplier',
  sqrtNegNeg: 'mc.exponents-roots.square-root-of-negative-as-negative',
  oddNegUndef: 'mc.exponents-roots.odd-root-of-negative-undefined',
  negPower: 'mc.exponents-roots.confuses-negative-power-notation',
  guessed: 'mc.exponents-roots.root-guessed-without-squaring-check',
  pmOdd: 'mc.exponents-roots.plus-minus-on-odd-roots',
  rootFirst: 'mc.exponents-roots.root-before-radicand-operations',
  alwaysSmaller: 'mc.exponents-roots.square-root-always-smaller',
  truncFull: 'mc.decimals.truncation-taken-as-full-decimal',
  repeatIrr: 'mc.exponents-roots.repeating-decimal-called-irrational',
  noExact: 'mc.exponents-roots.irrational-has-no-exact-value',
  roundedExact: 'mc.estimation.rounded-value-treated-as-exact',
  interp: 'mc.exponents-roots.root-by-linear-interpolation',
  squaresBounds: 'mc.exponents-roots.squares-as-root-bounds',
  negMagnitude: 'mc.integers.order-negatives-by-magnitude',
  closeTrial: 'mc.exponents-roots.accepts-close-trial-either-side',
  byRadicand: 'mc.exponents-roots.compares-different-index-roots-by-radicands',
  truncate: 'mc.decimals.truncates-instead-of-rounding',
  onlyPos: 'mc.quadratic-polynomial.only-positive-root',
  doubleRoot: 'mc.quadratic-polynomial.repeated-root-two-solutions',
  sumRoot: 'mc.exponents-roots.distributes-root-over-sum',
  unitDim: 'mc.measurement-units.wrong-unit-dimension',
  precision: 'mc.decimals.intermediate-precision-always-invalid',
  allReals: 'mc.functions-concept.context-domain-all-reals',
} as const;

// ---------- numbers and notation ----------
/** the answer in the link colour (numbers too) */
const S = (s: string | number) => `<b class="s">${s}</b>`;
const fmt = (v: number): string => String(Number(v.toFixed(6)));
/** a number for the panel (real minus sign) */
const hn = (v: number): string => fmt(v).replace('-', '−');
const eqv = (a: number, b: number, tol = 1e-9) => Math.abs(a - b) <= tol;
/** √ and ∛ for the panel, the radicand under a bar */
export const sq = (r: string | number) => `√<span class="rad">${typeof r === 'number' ? hn(r) : r}</span>`;
export const cb = (r: string | number) => `∛<span class="rad">${typeof r === 'number' ? hn(r) : r}</span>`;
const isSquare = (n: number) => Number.isInteger(n) && n >= 0 && Math.round(Math.sqrt(n)) ** 2 === n;
const icbrt = (n: number): number | null => { const r = Math.round(Math.cbrt(n)); return r ** 3 === n ? r : null; };
/** the whole number k with k³ < n < (k+1)³ (n not a perfect cube, may be negative) */
export function cubeFloor(n: number): number { let k = Math.floor(Math.cbrt(n)); while (k ** 3 > n) k--; while ((k + 1) ** 3 <= n) k++; return k; }
/** the whole number k with k² ≤ n < (k+1)², n ≥ 0 (exact for decimals with up to 2 places) */
export function sqFloor(n: number): number { let k = Math.floor(Math.sqrt(n)); while (k * k > n + 1e-12) k--; while ((k + 1) ** 2 <= n + 1e-12) k++; return k; }
/** the tenths t with (t/10)² ≤ n < ((t+1)/10)²: exact in integers (100n is a whole number) */
export function tenthsFloor(n: number): number { const N = Math.round(n * 100); let t = Math.floor(Math.sqrt(N)); while (t * t > N) t--; while ((t + 1) ** 2 <= N) t++; return t; }
/** the square of the midpoint of two tenths t/10, (t+1)/10, exact as a decimal string */
export const midSquare = (t: number): number => (2 * t + 1) ** 2 / 400;
const tenth = (t: number) => Number((t / 10).toFixed(1));
const t1 = (v: number) => v.toFixed(1);
const trunc = (v: number, d: number) => Math.floor(v * 10 ** d) / 10 ** d;
const round = (v: number, d: number) => Math.round(v * 10 ** d) / 10 ** d;
const sqUnit = (u: string) => `sq ${u}`;
const cubic = (u: string) => (u === 'in' ? 'cubic inches' : u === 'ft' ? 'cubic feet' : u === 'yd' ? 'cubic yards' : u === 'cm' ? 'cubic centimeters' : 'cubic meters');
/** "1 cubic centimeter", "8 cubic centimeters" */
const cubicN = (V: number, u: string) => (V === 1 ? cubic(u).replace(/inches$/, 'inch').replace(/feet$/, 'foot').replace(/s$/, '') : cubic(u));
const longU = (u: string) => (u === 'in' ? 'inches' : u === 'ft' ? 'feet' : u === 'yd' ? 'yards' : u === 'cm' ? 'centimeters' : 'meters');
const tU = (u: string) => `\\text{ ${u}}`;
const nonSquare = (R: () => number, lo: number, hi: number): number => { let n = 0; do n = int(R, lo, hi); while (isSquare(n)); return n; };
const nonCube = (R: () => number, lo: number, hi: number): number => { let n = 0; do n = int(R, lo, hi); while (n === 0 || icbrt(n) !== null); return n; };

// ---------- shared checking ----------
const BAD_NUM = 'Type a number, like 12 or 3.5 (use the minus key for a negative).';
interface Wrong { v: number | null; mc?: string; say: string; tol?: number }
/** a typed number: the right value, the misconception answers (first match wins), a fallback message */
function typed(base: Omit<RItem, 'check' | 'answer' | 'input'>, right: number, rightSay: string, wrongs: Wrong[], other: string): RItem {
  const ws = wrongs.filter((w): w is Wrong & { v: number } => w.v !== null && Number.isFinite(w.v) && !eqv(w.v, right))
    .filter((w, i, a) => a.findIndex(x => eqv(x.v, w.v)) === i);
  const it: RItem = {
    ...base, input: 'num', answer: { kind: 'num', v: right },
    check(r: Response): Verdict {
      if (r.kind !== 'num' || !Number.isFinite(r.v)) return { ok: false, say: BAD_NUM };
      if (eqv(r.v, right)) return { ok: true, say: rightSay };
      for (const w of ws) if (eqv(r.v, w.v, w.tol ?? 1e-9)) return { ok: false, mc: w.mc, say: w.say };
      return { ok: false, say: other };
    },
  };
  PROBES.set(it, ws.filter(w => w.mc).map(w => ({ r: { kind: 'num', v: w.v }, mc: w.mc! })));
  return it;
}
interface WrongPair { p: [number, number]; mc?: string; say: string }
/** two typed numbers: ordered (bounds) or as a set (solutions) */
function paired(base: Omit<RItem, 'check' | 'answer' | 'input'>, right: [number, number], ordered: boolean, rightSay: string, wrongs: WrongPair[], other: string): RItem {
  const match = (x: number, y: number, p: [number, number]) => (eqv(x, p[0]) && eqv(y, p[1])) || (!ordered && eqv(x, p[1]) && eqv(y, p[0]));
  const ws = wrongs.filter(w => !match(w.p[0], w.p[1], right)).filter((w, i, a) => a.findIndex(x => match(x.p[0], x.p[1], w.p)) === i);
  const it: RItem = {
    ...base, input: 'pair', answer: { kind: 'pair', x: right[0], y: right[1] },
    check(r: Response): Verdict {
      if (r.kind !== 'pair' || !Number.isFinite(r.x) || !Number.isFinite(r.y)) return { ok: false, say: 'Type a number in both boxes.' };
      if (match(r.x, r.y, right)) return { ok: true, say: rightSay };
      for (const w of ws) if (match(r.x, r.y, w.p)) return { ok: false, mc: w.mc, say: w.say };
      return { ok: false, say: other };
    },
  };
  PROBES.set(it, ws.filter(w => w.mc).map(w => ({ r: { kind: 'pair', x: w.p[0], y: w.p[1] } as Response, mc: w.mc! })));
  return it;
}
interface WrongFrac { n: number; d: number; mc?: string; say: string }
/** a typed fraction (equivalent forms count) */
function fracTyped(base: Omit<RItem, 'check' | 'answer' | 'input'>, n: number, d: number, rightSay: string, wrongs: WrongFrac[], other: string): RItem {
  const ws = wrongs.filter(w => !same([w.n, w.d], n, d)).filter((w, i, a) => a.findIndex(x => same([x.n, x.d], w.n, w.d)) === i);
  const it: RItem = {
    ...base, input: 'frac', answer: { kind: 'frac', w: 0, n, d },
    check(r: Response): Verdict {
      const v = r.kind === 'frac' ? fracValue(r) : null;
      if (!v) return { ok: false, say: 'Fill in the top and the bottom box with whole numbers (the bottom cannot be 0).' };
      if (same(v, n, d)) return { ok: true, say: rightSay };
      for (const w of ws) if (same(v, w.n, w.d)) return { ok: false, mc: w.mc, say: w.say };
      return { ok: false, say: other };
    },
  };
  PROBES.set(it, ws.filter(w => w.mc).map(w => ({ r: { kind: 'frac', w: 0, n: w.n, d: w.d } as Response, mc: w.mc! })));
  return it;
}
interface Opt { html: string; ok: boolean; mc?: string; say: string }
/** a choice item: options shuffled (or kept in order), exactly one right */
function choose(base: Omit<RItem, 'check' | 'answer' | 'input' | 'choices'>, R: () => number, opts: Opt[], keep = false): RItem {
  const os = keep ? opts : shuffle(R, [...opts]);
  const it: RItem = {
    ...base, solution: endOnChoice(base.solution, os.find(o => o.ok)!.html), input: 'choice', choices: os.map(o => o.html), answer: { kind: 'choice', i: os.findIndex(o => o.ok) },
    check(r: Response): Verdict {
      if (r.kind !== 'choice' || !os[r.i]) return { ok: false, say: 'Pick one of the answers.' };
      const o = os[r.i]!;
      return { ok: o.ok, mc: o.ok ? undefined : o.mc, say: o.say };
    },
  };
  PROBES.set(it, os.map((o, i) => ({ o, i })).filter(x => !x.o.ok && x.o.mc).map(x => ({ r: { kind: 'choice', i: x.i } as Response, mc: x.o.mc! })));
  return it;
}
/** the item id: family and practice number (no module counter: the same seed gives the same item) */
const id = (f: string, n: number) => `${f}-${n}`;

// ---------- contexts ----------
/** square and cube things with the sides (in their unit) they believably have: a 3 in chessboard or a 14 ft solar
 *  panel is never asked (thingFor picks one whose range holds the side) */
interface Thing { t: string; u: string; r: readonly [number, number] }
const SQ_THINGS: readonly Thing[] = [
  { t: 'rug', u: 'ft', r: [2, 12] }, { t: 'patio', u: 'ft', r: [6, 30] }, { t: 'garden bed', u: 'ft', r: [2, 12] }, { t: 'floor tile', u: 'in', r: [4, 24] },
  { t: 'photo print', u: 'in', r: [3, 12] }, { t: 'quilt', u: 'ft', r: [3, 10] }, { t: 'chessboard', u: 'in', r: [8, 24] }, { t: 'solar panel', u: 'ft', r: [2, 6] },
  { t: 'dance floor', u: 'yd', r: [3, 15] }, { t: 'sticky note', u: 'cm', r: [3, 10] }, { t: 'postage stamp', u: 'cm', r: [1, 4] },
];
const CUBE_THINGS: readonly Thing[] = [
  { t: 'gift box', u: 'in', r: [3, 20] }, { t: 'storage cube', u: 'in', r: [10, 16] }, { t: 'fish tank', u: 'in', r: [8, 30] }, { t: 'shipping crate', u: 'ft', r: [2, 8] },
  { t: 'ice block', u: 'cm', r: [5, 30] }, { t: 'planter', u: 'in', r: [6, 24] }, { t: 'water tank', u: 'ft', r: [2, 10] }, { t: 'dice mold', u: 'cm', r: [1, 5] },
];
/** a thing whose believable side range holds this side (else the nearest one) */
export function thingFor(R: () => number, list: readonly Thing[], side: number): Thing {
  const ok = list.filter(x => side >= x.r[0] && side <= x.r[1]);
  if (ok.length) return pick(R, ok);
  const off = (x: Thing) => (side < x.r[0] ? x.r[0] / side : side / x.r[1]);
  return list.slice().sort((a, b) => off(a) - off(b))[0]!;
}
export { SQ_THINGS, CUBE_THINGS };
const sqPic = (area: number, unit: string, tiles: SqPic['tiles'], side: SqPic['side'], extra: Partial<SqPic> = {}): SqPic => ({ kind: 'sq', area, unit, tiles, side, ...extra });
const cubePic = (vol: number, unit: string, closed: boolean, edge: CubePic['edge'], extra: Partial<CubePic> = {}): CubePic => ({ kind: 'cube', vol, unit, closed, edge, ...extra });

// =====================================================================================================================
// undo-squaring: the side of a square from its area; squaring and its undo in both directions; halving does not undo it
// =====================================================================================================================
const sqSide: Gen = (R, n) => {
  const v = R();
  if (v < 0.45) {
    const k = int(R, 1, 12), p = k * k, th = thingFor(R, SQ_THINGS, k);
    return typed({
      id: id('sqSide', n), family: 'sqSide',
      prompt: `A square ${th.t} covers ${A(`${p} ${sqUnit(th.u)}`)}. How long is one side?`,
      board: `s \\times s = ${p}${tU(th.u)}^2`, unit: th.u,
      picture: sqPic(p, th.u, 'show', 'solve'),
      solution: [`A square with side s has area s × s.`, `${k} × ${k} = ${A(p)}, so the side is ${S(`${k} ${th.u}`)}.`, `The side undoes the squaring: ${sq(p)} = ${k}.`],
    }, k, `Yes: ${k} × ${k} = ${p}, so each side is ${k} ${th.u}.`, [
      { v: p / 2, mc: MC.divIndex, say: `Halving does not undo squaring: ${hn(p / 2)} × ${hn(p / 2)} is much more than ${p}. Find the number that, times itself, makes ${p}.` },
      { v: p / 4, say: `${hn(p / 4)} shares the area among 4 sides, but the area is side × side. Which number times itself makes ${p}?` },
    ], `Count the tiles along one side, or find the number that times itself makes ${p}.`);
  }
  if (v < 0.65) {
    const k = int(R, 0, 12);
    return typed({
      id: id('sqSide', n), family: 'sqSide', prompt: `Squaring turns ${B(k)} into what number?`,
      board: `${k} \\xrightarrow{\\ \\text{square}\\ } \\;?`,
      solution: [`Squaring multiplies a number by itself: ${k}² = ${k} × ${k}.`, `${k} × ${k} = ${S(k * k)}.`],
    }, k * k, `Yes: ${k}² = ${k} × ${k} = ${k * k}.`, [
      { v: 2 * k, mc: MC.baseTimesExp, say: `${k}² is not ${k} × 2: the little 2 says how many times ${k} is a factor. ${k} × ${k} = ${k * k}.` },
    ], `Squaring means ${k} × ${k}.`);
  }
  if (v < 0.85) {
    const k = int(R, 0, 12), p = k * k;
    return typed({
      id: id('sqSide', n), family: 'sqSide', prompt: `Squaring gave ${A(p)}. Which number, 0 or more, went in?`,
      board: `? \\xrightarrow{\\ \\text{square}\\ } ${p}`,
      solution: [`Undo squaring with the square root: which number times itself makes ${p}?`, `${k} × ${k} = ${p}, so ${sq(p)} = ${S(k)}.`],
    }, k, `Yes: ${k} × ${k} = ${p}, so ${sq(p)} = ${k}.`, [
      { v: p / 2, mc: MC.divIndex, say: `Halving undoes doubling, not squaring: ${hn(p / 2)} × ${hn(p / 2)} = ${hn((p / 2) ** 2)}, not ${p}.` },
    ], `Which number times itself makes ${p}?`);
  }
  const k = int(R, 3, 10), p = k * k;
  return choose({
    id: id('sqSide', n), family: 'sqSide',
    prompt: `${k}² = ${A(p)}, and ${p} ÷ 2 = ${hn(p / 2)}. Does halving undo squaring?`,
    board: `${k}^2 = ${p} \\qquad ${p} \\div 2 = ${fmt(p / 2)}`,
    solution: [`Undoing squaring must give back ${k}.`, `Halving gives ${hn(p / 2)}, not ${k}: ${hn(p / 2)} × ${hn(p / 2)} = ${hn((p / 2) ** 2)}.`, `The square root undoes it: ${sq(p)} = ${S(k)}.`],
  }, R, [
    { html: `No: halving gives ${hn(p / 2)}, not ${k}. The square root undoes squaring: ${sq(p)} = ${k}.`, ok: true, say: `Right. Only the square root brings back ${k}.` },
    { html: `Yes: halving undoes squaring.`, ok: false, mc: MC.divIndex, say: `Halving gives ${hn(p / 2)}, and ${hn(p / 2)} × ${hn(p / 2)} = ${hn((p / 2) ** 2)}, not ${p}. (It only looks right for 2, because 2 × 2 = 2 + 2.)` },
    { html: `Only for even numbers.`, ok: false, say: `Try it: ${p} ÷ 2 = ${hn(p / 2)}, but the number that went in was ${k}. Halving never undoes squaring (except for 2 by luck).` },
  ]);
};

// =====================================================================================================================
// radical-notation-principal: √p names ONE number, the one that is 0 or more; (√p)² = p exactly; √(k²) = k
// =====================================================================================================================
const principal: Gen = (R, n) => {
  const v = R();
  if (v < 0.4) {
    const k = int(R, 2, 12), p = k * k;
    return choose({
      id: id('principal', n), family: 'principal',
      prompt: `${k} × ${k} = ${p}, and (−${k}) × (−${k}) = ${p} as well. Which number does ${sq(p)} name?`,
      board: `\\sqrt{${p}} = \\,?`,
      picture: { kind: 'line', solveTex: [`\\sqrt{${p}} = ${k}`], lo: -(k + 1), hi: k + 1, minor: 1, labels: [-(k + 1), 0, k + 1], marks: [{ v: -k, tex: `-${k}`, col: 'second' }, { v: k, tex: `\\sqrt{${p}} = ${k}`, col: 'link' }], solveMarks: 0, arcs: true } satisfies LinePic,
      solution: [`Both ${k} and −${k} square to ${p}.`, `The symbol ${sq(p)} is the one that is 0 or more (the side of a square with area ${p}): ${S(k)}.`, `To name both, write ±${sq(p)} = ±${k}.`],
    }, R, [
      { html: `${k} only`, ok: true, say: `Yes. ${sq(p)} is the principal square root: the one that is 0 or more.` },
      { html: `${k} and −${k}`, ok: false, mc: MC.plusMinus, say: `Both square to ${p}, but the symbol ${sq(p)} names just one: the nonnegative one, ${k}. For both, write ±${sq(p)}.` },
      { html: `−${k} only`, ok: false, say: `${sq(p)} is never negative: it is the side of a square with area ${p}. It names ${k}.` },
    ]);
  }
  if (v < 0.7) {
    const m = nonSquare(R, 2, 40), ap = round(Math.sqrt(m), 2);
    return typed({
      id: id('principal', n), family: 'principal', prompt: `What is (${sq(m)})² exactly?`,
      board: `\\left(\\sqrt{${m}}\\right)^2 = \\,?`,
      solution: [`${sq(m)} is the number whose square is ${m}: that is what the symbol means.`, `So squaring it gives back exactly ${S(m)}. No decimals needed.`],
    }, m, `Yes: ${sq(m)} is defined as the number whose square is ${m}.`, [
      { v: ap * ap, tol: 0.4, mc: MC.needApprox, say: `A decimal like ${ap} is only close to ${sq(m)}, so its square is only close to ${m}. Squaring ${sq(m)} itself gives exactly ${m}.` },
      { v: m * m, say: `That squares ${m}. Here you square ${sq(m)}, which undoes the root: ${m}.` },
    ], `Squaring undoes the square root.`);
  }
  const k = int(R, 0, 15);
  return typed({
    id: id('principal', n), family: 'principal', prompt: `What is ${sq(`${k}²`)}?`,
    board: `\\sqrt{${k}^2} = \\,?`,
    solution: [`${k}² = ${k * k}.`, `The square root undoes the squaring for numbers 0 or more: ${sq(k * k)} = ${S(k)}.`],
  }, k, `Yes: ${sq(`${k}²`)} = ${sq(k * k)} = ${k}.`, [
    { v: k * k, say: `${k * k} is ${k}². Now take its square root: ${k}.` },
    { v: -k, mc: MC.plusMinus, say: `The √ sign names the root that is 0 or more: ${k}.` },
  ], `Square ${k}, then undo it.`);
};

// =====================================================================================================================
// undo-cubing: the edge of a cube from its volume; cubing and its undo; dividing by 3 does not undo it
// =====================================================================================================================
const cubeEdge: Gen = (R, n) => {
  const v = R();
  if (v < 0.45) {
    const k = pick(R, [1, 2, 3, 4, 5, 10, 2, 3, 4, 5]), V = k ** 3, th = thingFor(R, CUBE_THINGS, k);
    return typed({
      id: id('cubeEdge', n), family: 'cubeEdge',
      prompt: `A cube-shaped ${th.t} holds ${A(`${V} ${cubicN(V, th.u)}`)}. How long is each edge?`,
      board: `e \\times e \\times e = ${V}${tU(th.u)}^3`, unit: th.u,
      picture: cubePic(V, th.u, true, 'solve'),
      solution: [`A cube with edge e holds e × e × e.`, `${k} × ${k} × ${k} = ${A(V)}, so each edge is ${S(`${k} ${th.u}`)}.`, `The edge undoes the cubing: ${cb(V)} = ${k}.`],
    }, k, `Yes: ${k} × ${k} × ${k} = ${V}.`, [
      { v: V / 3, tol: 0.05, mc: MC.divIndex, say: `Dividing by 3 does not undo cubing: ${hn(round(V / 3, 2))} used 3 times is far more than ${V}. Which number used 3 times makes ${V}?` },
      { v: isSquare(V) ? Math.sqrt(V) : null, mc: MC.ignoreIndex, say: `${Math.sqrt(V)} × ${Math.sqrt(V)} = ${V} is a flat square. A cube uses its edge 3 times: ${k} × ${k} × ${k} = ${V}.` },
    ], `Find the number that, used as a factor 3 times, makes ${V}.`);
  }
  if (v < 0.7) {
    const k = pick(R, [0, 1, 2, 3, 4, 5, 6, 10]);
    return typed({
      id: id('cubeEdge', n), family: 'cubeEdge', prompt: `Cubing turns ${B(k)} into what number?`,
      board: `${k} \\xrightarrow{\\ \\text{cube}\\ } \\;?`,
      solution: [`Cubing uses the number as a factor 3 times: ${k}³ = ${k} × ${k} × ${k}.`, `${k} × ${k} × ${k} = ${S(k ** 3)}.`],
    }, k ** 3, `Yes: ${k} × ${k} × ${k} = ${k ** 3}.`, [
      { v: 3 * k, mc: MC.baseTimesExp, say: `${k}³ is not ${k} × 3: the little 3 says ${k} is a factor 3 times. ${k} × ${k} × ${k} = ${k ** 3}.` },
      { v: k * k, say: `${k} × ${k} = ${k * k} is squaring. Cubing needs one more factor of ${k}: ${k ** 3}.` },
    ], `Cubing means ${k} × ${k} × ${k}.`);
  }
  const k = pick(R, [0, 1, 2, 3, 4, 5, 10]), V = k ** 3;
  return typed({
    id: id('cubeEdge', n), family: 'cubeEdge', prompt: `Cubing gave ${A(V)}. Which number went in?`,
    board: `? \\xrightarrow{\\ \\text{cube}\\ } ${V}`,
    picture: k >= 1 ? cubePic(V, '', true, 'solve', { volTex: String(V) }) : undefined,
    solution: [`Undo cubing with the cube root: which number used 3 times makes ${V}?`, `${k} × ${k} × ${k} = ${V}, so ${cb(V)} = ${S(k)}.`],
  }, k, `Yes: ${k}³ = ${V}, so ${cb(V)} = ${k}.`, [
    { v: V / 3, tol: 0.05, mc: MC.divIndex, say: `Dividing by 3 undoes multiplying by 3, not cubing. ${k} × ${k} × ${k} = ${V}, so ${k} went in.` },
    { v: isSquare(V) && V > 1 ? Math.sqrt(V) : null, mc: MC.ignoreIndex, say: `${Math.sqrt(V)} is the square root of ${V}. Cubing needs 3 equal factors: ${k} × ${k} × ${k} = ${V}.` },
  ], `Which number times itself times itself makes ${V}?`);
};

// =====================================================================================================================
// cube-root-notation: the index 3; √64 vs ∛64
// =====================================================================================================================
const CUBES_CORE = [0, 1, 8, 27, 64, 125, 1000];
const rootIndex: Gen = (R, n) => {
  const v = R();
  if (v < 0.35) {
    const p = pick(R, [64, 64, 729]), s = Math.sqrt(p), c = Math.cbrt(p);
    return paired({
      id: id('rootIndex', n), family: 'rootIndex', prompt: `Fill in both: the square root and the cube root of ${A(p)}.`,
      board: `\\sqrt{${p}} \\qquad \\sqrt[3]{${p}}`, pairLead: `${sq(p)} =`, pairOp: `and ∛${p} =`,
      picture: p === 64 ? { kind: 'both', n: 64, unit: 'in' } : undefined,
      solution: [`${sq(p)}: which number used twice makes ${p}? ${s} × ${s} = ${p}, so ${S(s)}.`, `${cb(p)}: which number used 3 times makes ${p}? ${c} × ${c} × ${c} = ${p}, so ${S(c)}.`],
    }, [s, c], true, `Yes: ${s} × ${s} = ${p} and ${c} × ${c} × ${c} = ${p}.`, [
      { p: [s, s], mc: MC.ignoreIndex, say: `The little 3 changes the question: ${s} × ${s} × ${s} is ${s ** 3}, not ${p}. The cube root is ${c}.` },
      { p: [s, 3 * s], mc: MC.indexMult, say: `The 3 is not a multiplier. ${cb(p)} asks which number used 3 times makes ${p}: ${c}.` },
    ], `Square root: used twice. Cube root: used 3 times.`);
  }
  if (v < 0.75) {
    const p = pick(R, CUBES_CORE), c = Math.round(Math.cbrt(p));
    return typed({
      id: id('rootIndex', n), family: 'rootIndex', prompt: `What is ${cb(p)}?`, board: `\\sqrt[3]{${p}} = \\,?`,
      picture: c >= 1 && c <= 10 ? cubePic(p, '', true, 'solve', { volTex: String(p) }) : undefined,
      solution: [`The small 3 asks: which number, used as a factor 3 times, makes ${p}?`, `${c} × ${c} × ${c} = ${p}, so ${cb(p)} = ${S(c)}.`],
    }, c, `Yes: ${c} × ${c} × ${c} = ${p}.`, [
      { v: isSquare(p) ? 3 * Math.sqrt(p) : null, mc: MC.indexMult, say: `The 3 is not a multiplier. ${cb(p)} is the number used 3 times to make ${p}: ${c}.` },
      { v: isSquare(p) ? Math.sqrt(p) : null, mc: MC.ignoreIndex, say: `${Math.sqrt(p)} is ${sq(p)}. The little 3 asks for 3 equal factors: ${c} × ${c} × ${c} = ${p}.` },
      { v: p / 3, tol: 0.05, mc: MC.divIndex, say: `A cube root is not dividing by 3. Which number times itself times itself makes ${p}? ${c}.` },
    ], `Try small numbers: 1, 2, 3, … cubed.`);
  }
  const p = pick(R, [8, 27, 64, 125, 1000]), c = Math.round(Math.cbrt(p));
  return choose({
    id: id('rootIndex', n), family: 'rootIndex', prompt: `What does the small 3 in ${cb(p)} ask?`, board: `\\sqrt[\\cssId{i}{3}]{${p}}`,
    solution: [`The index 3 means: find the number that, used as a factor 3 times, makes ${p}.`, `${c} × ${c} × ${c} = ${p}, so ${cb(p)} = ${S(c)}.`],
  }, R, [
    { html: `Which number, used as a factor 3 times, makes ${p}?`, ok: true, say: `Yes. Here it is ${c}: ${c} × ${c} × ${c} = ${p}.` },
    { html: `Take ${sq(p)}, then multiply by 3.`, ok: false, mc: MC.indexMult, say: `The 3 is not a multiplier. It says how many equal factors: ${c} × ${c} × ${c} = ${p}.` },
    { html: `Divide ${p} by 3.`, ok: false, mc: MC.divIndex, say: `${p} ÷ 3 = ${hn(round(p / 3, 2))}, but ${cb(p)} = ${c}, since ${c} × ${c} × ${c} = ${p}.` },
  ]);
};

// =====================================================================================================================
// sign-domain (Florida; extension elsewhere): ∛(−8) = −2; √(−9) is not real; −√9 vs √(−9); −3² vs (−3)²
// =====================================================================================================================
const signRoot: Gen = (R, n) => {
  const v = R();
  const NOT = 'not a real number';
  if (v < 0.3) {
    const k = int(R, 1, 5), q = -(k ** 3);
    return choose({
      id: id('signRoot', n), family: 'signRoot', prompt: `What is ${cb(q)}?`, board: `\\sqrt[3]{${q}} = \\,?`,
      solution: [`Which number used 3 times makes ${hn(q)}?`, `(−${k}) × (−${k}) × (−${k}) = ${hn(q)}: three negatives make a negative.`, `So ${cb(q)} = ${S(`−${k}`)}. Odd roots keep the sign.`],
    }, R, [
      { html: `−${k}`, ok: true, say: `Yes: (−${k})³ = ${hn(q)}.` },
      { html: `${k}`, ok: false, say: `${k} × ${k} × ${k} = ${k ** 3}, positive. You need ${hn(q)}: (−${k})³.` },
      { html: NOT, ok: false, mc: MC.oddNegUndef, say: `A negative number has a real cube root: (−${k}) × (−${k}) × (−${k}) = ${hn(q)}. Only even roots of negatives are not real.` },
    ]);
  }
  if (v < 0.55) {
    const k = int(R, 1, 12), q = -(k * k);
    return choose({
      id: id('signRoot', n), family: 'signRoot', prompt: `What is ${sq(q)}?`, board: `\\sqrt{${q}} = \\,?`,
      solution: [`A square root of ${hn(q)} would be a number whose square is ${hn(q)}.`, `${k}² = ${k * k} and (−${k})² = ${k * k}: every square is 0 or more.`, `So ${sq(q)} is ${S(NOT)}.`],
    }, R, [
      { html: NOT, ok: true, say: `Right: no real number squares to a negative.` },
      { html: `−${k}`, ok: false, mc: MC.sqrtNegNeg, say: `(−${k})² = ${k * k}, not ${hn(q)}. No real number squares to a negative, so ${sq(q)} is not real.` },
      { html: `${k}`, ok: false, say: `${k}² = ${k * k}, not ${hn(q)}. No real number squares to a negative.` },
    ]);
  }
  if (v < 0.75) {
    const k = int(R, 1, 12);
    return choose({
      id: id('signRoot', n), family: 'signRoot', prompt: `What is −${sq(k * k)}? (The minus is outside the root.)`, board: `-\\sqrt{${k * k}} = \\,?`,
      solution: [`First the root: ${sq(k * k)} = ${k}.`, `Then the minus in front: −${k}. So −${sq(k * k)} = ${S(`−${k}`)}.`],
    }, R, [
      { html: `−${k}`, ok: true, say: `Yes: the root first, ${k}, then its opposite.` },
      { html: NOT, ok: false, say: `The radicand ${k * k} is positive, so the root exists: ${k}. The minus outside makes it −${k}. (${sq(`−${k * k}`)} would not be real.)` },
      { html: `${k}`, ok: false, say: `The minus in front takes the opposite of ${sq(k * k)} = ${k}: −${k}.` },
    ]);
  }
  const k = int(R, 2, 9), paren = R() < 0.35;
  if (paren) return typed({
    id: id('signRoot', n), family: 'signRoot', prompt: `What is (−${k})²?`, board: `(-${k})^2 = \\,?`,
    solution: [`The parentheses make −${k} the base: (−${k}) × (−${k}).`, `Negative times negative is positive: ${S(k * k)}.`],
  }, k * k, `Yes: (−${k}) × (−${k}) = ${k * k}.`, [
    { v: -(k * k), mc: MC.negPower, say: `With parentheses the base is −${k}: (−${k}) × (−${k}) = ${k * k}, positive.` },
  ], `Multiply (−${k}) by (−${k}).`);
  return typed({
    id: id('signRoot', n), family: 'signRoot', prompt: `What is −${k}²? (No parentheses.)`, board: `-${k}^2 = \\,?`,
    solution: [`Without parentheses the square applies to ${k} only: ${k}² = ${k * k}.`, `Then the minus: −${k}² = ${S(`−${k * k}`)}. Compare (−${k})² = ${k * k}.`],
  }, -(k * k), `Yes: square ${k} first, then take the opposite.`, [
    { v: k * k, mc: MC.negPower, say: `That is (−${k})². Without parentheses the minus is not part of the base: −${k}² = −(${k} × ${k}) = −${k * k}.` },
  ], `Square ${k} first, then put the minus in front.`);
};

// =====================================================================================================================
// eval-perfect-square-roots (0-144) and square-roots-to-225 (169, 196, 225 by multiplying)
// =====================================================================================================================
const GUESS: Record<number, number> = { 13: 17, 14: 16, 15: 25, 11: 21, 12: 22 };
const evalSq: Gen = (R, n, sg) => {
  const ext = sg === 'square-roots-to-225';
  const v = R();
  if (ext && v < 0.3) {
    const k = int(R, 13, 15);
    return typed({
      id: id('evalSq', n), family: 'evalSq', prompt: `Work out ${B(k)}² by multiplying (${k} × ${k} = ${k} × 10 + ${k} × ${k - 10}).`,
      board: `${k}^2 = ${k} \\times ${k} = \\,?`,
      solution: [`${k} × 10 = ${k * 10}.`, `${k} × ${k - 10} = ${k * (k - 10)}.`, `${k * 10} + ${k * (k - 10)} = ${S(k * k)}, so ${sq(k * k)} = ${k}.`],
    }, k * k, `Yes: ${k}² = ${k * k}. So ${sq(k * k)} = ${k}.`, [
      { v: 2 * k, mc: MC.baseTimesExp, say: `${k}² means ${k} × ${k}, not ${k} × 2: ${k * k}.` },
    ], `Split it: ${k} × 10 + ${k} × ${k - 10}.`);
  }
  if (ext && v < 0.6) {
    const k = int(R, 13, 15), p = k * k, g = GUESS[k]!;
    return choose({
      id: id('evalSq', n), family: 'evalSq', prompt: `Which number is ${sq(p)}? Check by squaring.`, board: `\\sqrt{${p}} = \\,?`,
      picture: sqPic(p, '', 'solve', 'solve', { areaTex: String(p), sideTex: String(k) }),
      solution: [`Square each choice.`, `${k} × ${k} = ${p} ✓, ${g} × ${g} = ${g * g} ✗.`, `So ${sq(p)} = ${S(k)}.`],
    }, R, [
      { html: String(k), ok: true, say: `Yes: ${k} × ${k} = ${p}.` },
      { html: String(g), ok: false, mc: MC.guessed, say: `A guess from the digits needs a check: ${g} × ${g} = ${g * g}, not ${p}. ${k} × ${k} = ${p}.` },
      { html: hn(p / 2), ok: false, mc: MC.divIndex, say: `That halves ${p}. Square roots are not halves: ${k} × ${k} = ${p}.` },
    ]);
  }
  const k = ext ? (R() < 0.6 ? int(R, 13, 15) : int(R, 0, 12)) : pick(R, [0, 1, 11, 12, ...Array.from({ length: 12 }, (_, i) => i + 1)]);
  const p = k * k;
  return typed({
    id: id('evalSq', n), family: 'evalSq', prompt: `What is ${sq(p)}?`, board: `\\sqrt{${p}} = \\,?`,
    picture: k >= 1 ? sqPic(p, '', 'solve', 'solve', { areaTex: String(p), sideTex: String(k) }) : undefined,
    solution: k === 0 ? [`0 × 0 = 0, so ${sq(0)} = ${S(0)}.`, `0 is the only number whose square is 0.`]
      : [`Which number, times itself, makes ${p}?`, `${k} × ${k} = ${p}, so ${sq(p)} = ${S(k)}.`],
  }, k, `Yes: ${k} × ${k} = ${p}.`, [
    { v: p / 2, mc: MC.divIndex, say: `That halves ${p}. ${sq(p)} is the number that times itself makes ${p}: ${k}.` },
    { v: -k, mc: MC.plusMinus, say: `${sq(p)} is the root that is 0 or more: ${k}.` },
  ], `Which number times itself makes ${p}? Check by squaring.`);
};

// =====================================================================================================================
// eval-perfect-cube-roots: cubes of 6-9 by multiplying, then roots of the cubes of 0-10 in mixed order
// =====================================================================================================================
const evalCube: Gen = (R, n) => {
  const v = R();
  if (v < 0.25) {
    const k = int(R, 6, 9);
    return typed({
      id: id('evalCube', n), family: 'evalCube', prompt: `Work out ${B(k)}³ (first ${k} × ${k}, then × ${k}).`, board: `${k}^3 = ${k} \\times ${k} \\times ${k} = \\,?`,
      solution: [`${k} × ${k} = ${k * k}.`, `${k * k} × ${k} = ${S(k ** 3)}.`, `So ${cb(k ** 3)} = ${k}.`],
    }, k ** 3, `Yes: ${k}³ = ${k ** 3}.`, [
      { v: 3 * k, mc: MC.baseTimesExp, say: `${k}³ is not ${k} × 3. It is ${k} × ${k} × ${k} = ${k ** 3}.` },
      { v: k * k, say: `${k * k} is ${k}². One more factor of ${k}: ${k ** 3}.` },
    ], `${k} × ${k} first, then times ${k} again.`);
  }
  if (v < 0.7) {
    const k = pick(R, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 6, 7, 8, 9]), p = k ** 3;
    return typed({
      id: id('evalCube', n), family: 'evalCube', prompt: `What is ${cb(p)}?`, board: `\\sqrt[3]{${p}} = \\,?`,
      picture: k >= 1 ? cubePic(p, '', true, 'solve', { volTex: String(p) }) : undefined,
      solution: [`Which number, used 3 times, makes ${p}?`, `${k} × ${k} × ${k} = ${p}, so ${cb(p)} = ${S(k)}.`],
    }, k, `Yes: ${k}³ = ${p}.`, [
      { v: p / 3, tol: 0.05, mc: MC.divIndex, say: `That divides ${p} by 3. The cube root is the number used 3 times: ${k} × ${k} × ${k} = ${p}.` },
      { v: isSquare(p) && p > 1 ? Math.sqrt(p) : null, mc: MC.ignoreIndex, say: `${Math.sqrt(p)} is the square root of ${p}. The little 3 asks for 3 equal factors: ${k}.` },
    ], `Cube 1, 2, 3, … until you reach ${p}.`);
  }
  const k = int(R, 2, 10), p = k ** 3;
  const third: Opt = isSquare(p) ? { html: hn(Math.sqrt(p)), ok: false, mc: MC.ignoreIndex, say: `${Math.sqrt(p)} is ${sq(p)}, the square root. The cube root is ${k}: ${k} × ${k} × ${k} = ${p}.` }
    : p % 3 === 0 ? { html: hn(p / 3), ok: false, mc: MC.divIndex, say: `That is ${p} ÷ 3. The cube root is ${k}: ${k} × ${k} × ${k} = ${p}.` }
      : { html: hn(k * k), ok: false, say: `${k * k} × ${k * k} × ${k * k} is far more than ${p}. ${k} × ${k} × ${k} = ${p}.` };
  return choose({
    id: id('evalCube', n), family: 'evalCube', prompt: `Which is ${cb(p)}?`, board: `\\sqrt[3]{${p}} = \\,?`,
    solution: [`${k} × ${k} × ${k} = ${p}.`, `(−${k}) × (−${k}) × (−${k}) = −${p}, so −${k} is not a cube root of ${p}.`, `${cb(p)} = ${S(k)}: one answer, no ±.`],
  }, R, [
    { html: String(k), ok: true, say: `Yes: ${k}³ = ${p}, and only ${k} works.` },
    { html: `±${k}`, ok: false, mc: MC.pmOdd, say: `(−${k})³ = −${p}, not ${p}. A cube root has one value: ${k}.` },
    third,
  ]);
};

// =====================================================================================================================
// rational-radicand-roots: √(9/16) = 3/4, √0.25 = 0.5, ∛(8/27) = 2/3; the root of a number between 0 and 1 is bigger
// =====================================================================================================================
const DEC_SQ: [number, number][] = [[0.25, 0.5], [0.49, 0.7], [0.09, 0.3], [0.01, 0.1], [0.04, 0.2], [0.36, 0.6], [0.64, 0.8], [0.81, 0.9], [1.44, 1.2], [2.25, 1.5], [1.21, 1.1], [1.69, 1.3], [0.0049, 0.07], [0.0016, 0.04], [0.0081, 0.09], [0.0025, 0.05], [0.0144, 0.12], [0.16, 0.4]];
const ratRoot: Gen = (R, n) => {
  const v = R();
  if (v < 0.3) {
    let a = 1, b = 2;
    do { b = int(R, 2, 12); a = int(R, 1, b - 1); } while (gcd(a, b) !== 1);
    const th = pick(R, ['ft', 'yd', 'm']);
    return fracTyped({
      id: id('ratRoot', n), family: 'ratRoot', prompt: `What is ${sq(fr(a * a, b * b))}? (A square with this area, in ${sqUnit(th)}.)`,
      board: `\\sqrt{\\tfrac{${a * a}}{${b * b}}} = \\,?`,
      picture: sqPic((a * a) / (b * b), th, 'show', 'solve', { cut: { a, b }, areaTex: `\\tfrac{${a * a}}{${b * b}}${tU(th)}^2`, sideTex: `\\tfrac{${a}}{${b}}${tU(th)}` }),
      solution: [`Which fraction times itself makes ${fr(a * a, b * b)}?`, `${fr(a, b)} × ${fr(a, b)} = ${fr(a * a, b * b)} (tops times tops, bottoms times bottoms).`, `So ${sq(fr(a * a, b * b))} = ${S(fr(a, b))}.`],
    }, a, b, `Yes: ${fr(a, b)} × ${fr(a, b)} = ${fr(a * a, b * b)}.`, [
      { n: a, d: b * b, mc: MC.rootFirst, say: `The root covers the whole fraction, the bottom too: ${fr(a, b * b)} × ${fr(a, b * b)} is not ${fr(a * a, b * b)}. ${fr(a, b)} × ${fr(a, b)} is.` },
      { n: a * a, d: b, mc: MC.rootFirst, say: `Take the root of the top AND the bottom: ${fr(a, b)}.` },
    ], `Find a fraction that times itself makes ${fr(a * a, b * b)}.`);
  }
  if (v < 0.58) {
    const [p, r] = pick(R, DEC_SQ);
    const shift = r < 0.1 ? r * 10 : r >= 1 ? null : r / 10;
    return typed({
      id: id('ratRoot', n), family: 'ratRoot', prompt: `What is ${sq(p)}?`, board: `\\sqrt{${fmt(p)}} = \\,?`,
      solution: [`Which decimal times itself makes ${hn(p)}?`, `${hn(r)} × ${hn(r)} = ${hn(p)} (check the decimal places: ${String(r).split('.')[1]?.length ?? 0} + ${String(r).split('.')[1]?.length ?? 0}).`, `So ${sq(p)} = ${S(hn(r))}.`],
    }, r, `Yes: ${hn(r)} × ${hn(r)} = ${hn(p)}.`, [
      { v: p / 2, mc: MC.divIndex, say: `That halves ${hn(p)}. The square root is the number that times itself makes ${hn(p)}: ${hn(r)}.` },
      { v: shift, say: `Count the decimal places: ${hn(shift ?? 0)} × ${hn(shift ?? 0)} = ${hn((shift ?? 0) ** 2)}, not ${hn(p)}. ${hn(r)} × ${hn(r)} = ${hn(p)}.` },
    ], `Find a decimal that times itself makes ${hn(p)}. Check by multiplying.`);
  }
  if (v < 0.73) {
    let a = 1, b = 2;
    do { b = int(R, 2, 5); a = int(R, 1, b - 1); } while (gcd(a, b) !== 1);
    if (R() < 0.25) { a = 1; b = 10; }
    return fracTyped({
      id: id('ratRoot', n), family: 'ratRoot', prompt: `What is ${cb(fr(a ** 3, b ** 3))}?`, board: `\\sqrt[3]{\\tfrac{${a ** 3}}{${b ** 3}}} = \\,?`,
      solution: [`Which fraction, used 3 times, makes ${fr(a ** 3, b ** 3)}?`, `${fr(a, b)} × ${fr(a, b)} × ${fr(a, b)} = ${fr(a ** 3, b ** 3)}.`, `So ${cb(fr(a ** 3, b ** 3))} = ${S(fr(a, b))}.`],
    }, a, b, `Yes: (${fr(a, b)})³ = ${fr(a ** 3, b ** 3)}.`, [
      { n: a, d: b ** 3, mc: MC.rootFirst, say: `The cube root covers the bottom too: ${cb(b ** 3)} = ${b}. So the root is ${fr(a, b)}.` },
      { n: a ** 3, d: b, mc: MC.rootFirst, say: `The cube root covers the top too: ${cb(a ** 3)} = ${a}. So the root is ${fr(a, b)}.` },
    ], `Take the cube root of the top and of the bottom, then check by cubing.`);
  }
  if (v < 0.9) {
    const [p, r] = pick(R, DEC_SQ.filter(([q]) => q < 1));
    return choose({
      id: id('ratRoot', n), family: 'ratRoot', prompt: `Which is greater: ${sq(p)} or ${hn(p)}?`, board: `\\sqrt{${fmt(p)}} \\;\\;?\\;\\; ${fmt(p)}`,
      picture: r <= 1 && p >= 0.04 ? { kind: 'line', solveTex: [`\\sqrt{${fmt(p)}} = ${fmt(r)} > ${fmt(p)}`], lo: 0, hi: 1, minor: 0.1, labels: [0, 0.5, 1], marks: [{ v: p, tex: fmt(p), col: 'first' }, { v: r, tex: `\\sqrt{${fmt(p)}}`, col: 'link' }], solveMarks: 1 } satisfies LinePic : undefined,
      solution: [`${sq(p)} = ${hn(r)}, because ${hn(r)} × ${hn(r)} = ${hn(p)}.`, `${hn(r)} > ${hn(p)}: for a number between 0 and 1, the square root is ${S('bigger')}.`, `(Multiplying by a number less than 1 makes it smaller, so ${hn(r)}² is less than ${hn(r)}.)`],
    }, R, [
      { html: `${sq(p)}, because it is ${hn(r)}`, ok: true, say: `Yes: ${hn(r)} × ${hn(r)} = ${hn(p)}, so the root is bigger here.` },
      { html: `${hn(p)}, because a square root always makes a number smaller`, ok: false, mc: MC.alwaysSmaller, say: `Not between 0 and 1: ${sq(p)} = ${hn(r)}, which is more than ${hn(p)}.` },
      { html: `They are equal`, ok: false, say: `${sq(p)} = ${hn(r)}, because ${hn(r)} × ${hn(r)} = ${hn(p)}. That is not ${hn(p)}.` },
    ]);
  }
  const [p, r] = pick(R, [[0.09, 0.3], [0.04, 0.2], [0.16, 0.4], [0.25, 0.5], [0.49, 0.7]] as [number, number][]);
  const claim = Number((p * 10).toFixed(1));
  return choose({
    id: id('ratRoot', n), family: 'ratRoot', prompt: `Riley says ${sq(claim)} = ${hn(r)}. Is Riley right?`, board: `\\sqrt{${fmt(claim)}} \\overset{?}{=} ${fmt(r)}`,
    solution: [`Check by squaring: ${hn(r)} × ${hn(r)} = ${hn(p)}.`, `So ${hn(r)} is ${sq(p)}, not ${sq(claim)}.`, `${sq(claim)} is not ${hn(r)}: ${S('Riley is wrong')}.`],
  }, R, [
    { html: `No: ${hn(r)} × ${hn(r)} = ${hn(p)}, so ${hn(r)} = ${sq(p)}`, ok: true, say: `Right: always check a root by squaring it.` },
    { html: `Yes: ${Math.round(r * 10)} × ${Math.round(r * 10)} = ${Math.round(claim * 10)}`, ok: false, mc: MC.guessed, say: `The digits look right, but check the decimal: ${hn(r)} × ${hn(r)} = ${hn(p)}, not ${hn(claim)}.` },
    { html: `Yes: it is too hard to check without a calculator`, ok: false, say: `It is easy to check: ${hn(r)} × ${hn(r)} = ${hn(p)}, not ${hn(claim)}.` },
  ]);
};

// =====================================================================================================================
// exact-vs-approximate: rational or irrational; √2 is exact, 1.414 is only close (≈)
// =====================================================================================================================
const REPEAT: [number, number][] = [[1, 3], [2, 3], [1, 6], [5, 6], [1, 9], [4, 9], [7, 9]];
const rational: Gen = (R, n) => {
  const v = R();
  if (v < 0.22) {
    const useDec = R() < 0.35;
    const [rad, root, html] = useDec ? (() => { const [p, r] = pick(R, DEC_SQ.filter(d => d[1] >= 0.1)); return [hn(p), hn(r), sq(p)] as const; })()
      : R() < 0.3 ? (() => { const k = int(R, 2, 10); return [String(k ** 3), String(k), cb(k ** 3)] as const; })()
        : (() => { const k = int(R, 2, 12); return [String(k * k), String(k), sq(k * k)] as const; })();
    return choose({
      id: id('rational', n), family: 'rational', prompt: `Is ${html} rational or irrational?`, board: `${html.startsWith('∛') ? '\\sqrt[3]' : '\\sqrt'}{${rad.replace('−', '-')}}`,
      solution: [`${html} = ${root}, exactly.`, `${root} is a fraction of whole numbers (${root} = ${root}/1${root.includes('.') ? ` = ${Math.round(Number(root) * 10 ** (root.split('.')[1]!.length))}/${10 ** (root.split('.')[1]!.length)}` : ''}).`, `So ${html} is ${S('rational')}.`],
    }, R, [
      { html: `Rational: it equals ${root}`, ok: true, say: `Yes: a root that comes out exactly is rational.` },
      { html: `Irrational: every square root is irrational`, ok: false, say: `Not every root: ${html} = ${root} exactly, so it is rational.` },
      { html: `Irrational: a root has no exact value`, ok: false, mc: MC.noExact, say: `${html} has the exact value ${root}. Even irrational roots like ${sq(2)} are exact numbers; they just have no finite decimal.` },
    ]);
  }
  if (v < 0.45) {
    const [a, b] = pick(R, REPEAT);
    const d = (a / b).toFixed(4).slice(0, 5) + '…';
    return choose({
      id: id('rational', n), family: 'rational', prompt: `${sq(fr(a * a, b * b))} = ${fr(a, b)} = ${d} Is it rational or irrational?`, board: `\\sqrt{\\tfrac{${a * a}}{${b * b}}} = \\tfrac{${a}}{${b}}`,
      solution: [`${fr(a, b)} × ${fr(a, b)} = ${fr(a * a, b * b)}, so the root is ${fr(a, b)}, a fraction of whole numbers.`, `Its decimal ${d} goes on forever, but it ${S('repeats')}.`, `Fractions are rational, so ${sq(fr(a * a, b * b))} is ${S('rational')}.`],
    }, R, [
      { html: `Rational: it equals the fraction ${fr(a, b)}`, ok: true, say: `Yes: a repeating decimal is a fraction, so it is rational.` },
      { html: `Irrational: its decimal never ends`, ok: false, mc: MC.repeatIrr, say: `Never ending is not enough: ${d} repeats, and it equals ${fr(a, b)}. Irrational decimals never end AND never repeat.` },
      { html: `Irrational: it has no exact value`, ok: false, mc: MC.noExact, say: `It has an exact value: ${fr(a, b)}.` },
    ]);
  }
  if (v < 0.75) {
    const cube = R() < 0.3;
    const m = cube ? nonCube(R, 2, 100) : nonSquare(R, 2, 150);
    const val = cube ? Math.cbrt(m) : Math.sqrt(m), h = cube ? cb(m) : sq(m);
    const r3 = round(val, 3), t8 = trunc(val, 8);
    return choose({
      id: id('rational', n), family: 'rational', prompt: `Is ${h} rational or irrational?`, board: cube ? `\\sqrt[3]{${m}}` : `\\sqrt{${m}}`,
      solution: [`${m} is not a perfect ${cube ? 'cube' : 'square'}: no whole number ${cube ? 'cubed' : 'squared'} makes it.`, `Then ${h} is irrational: its decimal never ends and never repeats.`, `A calculator shows only the first digits: ${h} ≈ ${t8}. The value ${h} itself is ${S('exact')}.`],
    }, R, [
      { html: `Irrational: ${m} is not a perfect ${cube ? 'cube' : 'square'}`, ok: true, say: `Yes: the ${cube ? 'cube' : 'square'} root of a whole number that is not a perfect ${cube ? 'cube' : 'square'} is irrational.` },
      { html: `Rational: it equals ${r3}`, ok: false, mc: MC.roundedExact, say: `${r3} is rounded: ${r3}${cube ? '³' : '²'} = ${round(r3 ** (cube ? 3 : 2), 6)}, not ${m}. ${h} ≈ ${r3}.` },
      { html: `Rational: a calculator shows ${t8}, a decimal that ends`, ok: false, mc: MC.truncFull, say: `The screen cuts the decimal off. The digits of ${h} go on forever without repeating.` },
    ]);
  }
  const cube = R() < 0.25;
  const m = cube ? nonCube(R, 2, 30) : nonSquare(R, 2, 30);
  const val = cube ? Math.cbrt(m) : Math.sqrt(m), h = cube ? cb(m) : sq(m), r3 = round(val, 3);
  return choose({
    id: id('rational', n), family: 'rational', prompt: `Which statement is true?`, board: `${cube ? '\\sqrt[3]' : '\\sqrt'}{${m}} \\;\\;?\\;\\; ${r3}`,
    solution: [`${r3}${cube ? '³' : '²'} = ${round(r3 ** (cube ? 3 : 2), 6)}, close to ${m} but not ${m}.`, `So ${r3} is only an approximation: ${h} ${S('≈')} ${r3}.`, `${h} is an exact number; use ≈ for its rounded decimal.`],
  }, R, [
    { html: `${h} ≈ ${r3}`, ok: true, say: `Yes: ${r3} is close, not equal, so the sign is ≈.` },
    { html: `${h} = ${r3}`, ok: false, mc: MC.roundedExact, say: `Square it: ${r3}${cube ? '³' : '²'} = ${round(r3 ** (cube ? 3 : 2), 6)}, not ${m}. A rounded decimal gets ≈, not =.` },
    { html: `${h} has no exact value, so neither = nor ≈ fits`, ok: false, mc: MC.noExact, say: `${h} is an exact number (it has an exact place on the number line). ${r3} is close to it: ${h} ≈ ${r3}.` },
  ]);
};

// =====================================================================================================================
// bound-square-root-integers: 49 < 50 < 64, so 7 < √50 < 8
// =====================================================================================================================
const boundSq: Gen = (R, n) => {
  const m = R() < 0.82 ? nonSquare(R, 2, 143) : nonSquare(R, 145, 224);
  const k = sqFloor(m);
  return paired({
    id: id('boundSq', n), family: 'boundSq', prompt: `${sq(m)} lies between which two whole numbers in a row?`,
    board: `\\square < \\sqrt{${m}} < \\square`, pairLead: '', pairOp: `< √${m} <`,
    picture: { kind: 'line', solveTex: [`${k * k} < ${m} < ${(k + 1) ** 2}`, `${k} < \\sqrt{${m}} < ${k + 1}`], lo: Math.max(0, k - 1), hi: k + 2, minor: 1, labels: Array.from({ length: k + 3 - Math.max(0, k - 1) }, (_, i) => Math.max(0, k - 1) + i), powers: 2, marks: [{ v: Math.sqrt(m), tex: `\\sqrt{${m}}`, col: 'link' }], solveMarks: 0, band: [k, k + 1], bandOnSolve: true } satisfies LinePic,
    solution: [`The perfect squares around ${A(m)}: ${k}² = ${k * k} and ${k + 1}² = ${(k + 1) ** 2}.`, `${k * k} < ${m} < ${(k + 1) ** 2}.`, `Take the square roots (the order stays): ${S(String(k))} < ${sq(m)} < ${S(String(k + 1))}.`],
  }, [k, k + 1], true, `Yes: ${k * k} < ${m} < ${(k + 1) ** 2}, so ${k} < ${sq(m)} < ${k + 1}.`, [
    { p: [k * k, (k + 1) ** 2], mc: MC.squaresBounds, say: `Those are the squares around ${m}. Their roots bound ${sq(m)}: ${k} < ${sq(m)} < ${k + 1}.` },
    { p: [k + 1, k], say: `Put the smaller number first: ${k} < ${sq(m)} < ${k + 1}.` },
    { p: [Math.floor(m / 2), Math.floor(m / 2) + 1], mc: MC.divIndex, say: `Halving does not give a square root. ${k}² = ${k * k} and ${k + 1}² = ${(k + 1) ** 2} are the squares around ${m}.` },
  ], `Find the perfect squares just below and just above ${m}.`);
};

// =====================================================================================================================
// bound-cube-root-integers: 64 < 100 < 125, so 4 < ∛100 < 5 (extension: negative radicands)
// =====================================================================================================================
const boundCube: Gen = (R, n) => {
  const neg = R() < 0.2;
  const m = neg ? -nonCube(R, 2, 999) : nonCube(R, 2, 999);
  const k = cubeFloor(m), lo3 = k ** 3, hi3 = (k + 1) ** 3;
  const s = m > 0 ? sqFloor(m) : 0;
  const pic: Pic | undefined = m > 0 && k >= 1 && k <= 4 ? cubePic(m, '', false, 'show', { ghosts: true, volTex: String(m), edgeTex: `\\sqrt[3]{${m}}` })
    : { kind: 'line', solveTex: [`${lo3} < ${m} < ${hi3}`, `${k} < \\sqrt[3]{${m}} < ${k + 1}`], lo: k - 1, hi: k + 2, minor: 1, labels: [k - 1, k, k + 1, k + 2], powers: 3, marks: [{ v: Math.cbrt(m), tex: `\\sqrt[3]{${m}}`, col: 'link' }], solveMarks: 0, band: [k, k + 1], bandOnSolve: true };
  return paired({
    id: id('boundCube', n), family: 'boundCube', prompt: `${cb(m)} lies between which two whole numbers in a row?`,
    board: `\\square < \\sqrt[3]{${m}} < \\square`, pairLead: '', pairOp: `< ∛${hn(m)} <`,
    picture: pic,
    solution: [`The perfect cubes around ${A(hn(m))}: ${hn(k)}³ = ${hn(lo3)} and ${hn(k + 1)}³ = ${hn(hi3)}.`, `${hn(lo3)} < ${hn(m)} < ${hn(hi3)}.`, `Take the cube roots (the order stays): ${S(hn(k))} < ${cb(m)} < ${S(hn(k + 1))}.`],
  }, [k, k + 1], true, `Yes: ${hn(lo3)} < ${hn(m)} < ${hn(hi3)}, so ${hn(k)} < ${cb(m)} < ${hn(k + 1)}.`, [
    ...(m > 0 ? [{ p: [s, s + 1] as [number, number], mc: MC.ignoreIndex, say: `${s} and ${s + 1} bound the SQUARE root (${s * s} < ${m} < ${(s + 1) ** 2}). For the cube root use cubes: ${lo3} < ${m} < ${hi3}.` }] : []),
    { p: [lo3, hi3], mc: MC.squaresBounds, say: `Those are the cubes around ${hn(m)}. Their cube roots bound ${cb(m)}: ${hn(k)} and ${hn(k + 1)}.` },
    { p: [k + 1, k], mc: k < 0 ? MC.negMagnitude : undefined, say: k < 0 ? `On the number line ${hn(k)} is left of ${hn(k + 1)}, so ${hn(k)} is the smaller one: ${hn(k)} < ${cb(m)} < ${hn(k + 1)}.` : `Put the smaller number first: ${k} < ${cb(m)} < ${k + 1}.` },
  ], `Find the perfect cubes just below and just above ${hn(m)}.`);
};

// =====================================================================================================================
// refine-decimal-bounds: 1.4² = 1.96 < 2 < 2.25 = 1.5², so 1.4 < √2 < 1.5 (bounding, not interpolation)
// =====================================================================================================================
const REFINE_EXTRA = [120, 150, 200];
const refine: Gen = (R, n) => {
  const m = R() < 0.85 ? nonSquare(R, 2, 99) : pick(R, REFINE_EXTRA);
  const k = sqFloor(m), t = tenthsFloor(m);
  const trials = [t - 1, t, t + 1, t + 2].filter(x => x >= 10 * k && x <= 10 * (k + 1));
  const sqr = (x: number) => fmt((x * x) / 100);
  const N = m * 100;
  const closest = Math.abs((t + 1) ** 2 - N) < Math.abs(t * t - N);
  const est = k + (m - k * k) / (2 * k + 1), ti = Math.floor(est * 10 + 1e-9);
  return paired({
    id: id('refine', n), family: 'refine',
    prompt: `${k} < ${sq(m)} < ${k + 1}. Trial squares: ${trials.map(x => `${t1(x / 10)}² = ${sqr(x)}`).join(', ')}. Between which two tenths is ${sq(m)}?`,
    board: `\\square < \\sqrt{${m}} < \\square`, pairLead: '', pairOp: `< √${m} <`,
    picture: { kind: 'line', solveTex: [`${sqr(t)} < ${m} < ${sqr(t + 1)}`, `${t1(t / 10)} < \\sqrt{${m}} < ${t1((t + 1) / 10)}`], lo: k, hi: k + 1, minor: 0.1, labels: [k, k + 1], marks: [{ v: Math.sqrt(m), tex: `\\sqrt{${m}}`, col: 'link' }], solveMarks: 0, band: [tenth(t), tenth(t + 1)], bandOnSolve: true },
    solution: [`Find the two trial squares that sit around ${A(m)}: ${t1(t / 10)}² = ${sqr(t)} < ${m} < ${sqr(t + 1)} = ${t1((t + 1) / 10)}².`, `Take the square roots: ${S(t1(t / 10))} < ${sq(m)} < ${S(t1((t + 1) / 10))}.`, `The closest square is not the point: the lower bound is the trial whose square is still BELOW ${m}.`],
  }, [tenth(t), tenth(t + 1)], true, `Yes: ${sqr(t)} < ${m} < ${sqr(t + 1)}.`, [
    ...(closest ? [{ p: [tenth(t + 1), tenth(t + 2)] as [number, number], mc: MC.closeTrial, say: `${t1((t + 1) / 10)}² = ${sqr(t + 1)} is closest to ${m}, but it is ABOVE ${m}, so ${t1((t + 1) / 10)} is the upper bound: ${t1(t / 10)} < ${sq(m)} < ${t1((t + 1) / 10)}.` }] : []),
    ...(ti !== t ? [{ p: [tenth(ti), tenth(ti + 1)] as [number, number], mc: MC.interp, say: `Going ${m - k * k} of the ${2 * k + 1} steps from ${k * k} to ${(k + 1) ** 2} is not exact for roots. Square the trials: ${sqr(t)} < ${m} < ${sqr(t + 1)}.` }] : []),
    { p: [(t * t) / 100, ((t + 1) * (t + 1)) / 100], mc: MC.squaresBounds, say: `Those are the trial squares. The roots are the bounds: ${t1(t / 10)} < ${sq(m)} < ${t1((t + 1) / 10)}.` },
  ], `Pick the two trials whose squares are just below and just above ${m}.`);
};

// =====================================================================================================================
// locate-compare-roots: √10 vs 3.2; √p vs ∛q (different index); order a set with roots, decimals, fractions
// =====================================================================================================================
type V = { v: number; html: string; rad?: number; idx?: 2 | 3; tex: string };
const compare: Gen = (R, n) => {
  const vv = R();
  if (vv < 0.35) {
    const m = nonSquare(R, 2, 99), t = tenthsFloor(m), d = tenth(R() < 0.5 ? t : t + 1), rootBig = d * d < m;
    const k = sqFloor(m);
    const isRound = eqv(d, round(Math.sqrt(m), 1));
    return choose({
      id: id('compare', n), family: 'compare', prompt: `Which is greater: ${sq(m)} or ${hn(d)}?`, board: `\\sqrt{${m}} \\;\\;?\\;\\; ${t1(d)}`,
      picture: { kind: 'line', solveTex: [`${t1(d)}^2 = ${fmt(d * d)}`, `\\sqrt{${m}} ${rootBig ? '>' : '<'} ${t1(d)}`], lo: k, hi: k + 1, minor: 0.1, labels: [k, k + 1], marks: [{ v: d, tex: t1(d), col: 'pick' }, { v: Math.sqrt(m), tex: `\\sqrt{${m}}`, col: 'link' }], solveMarks: 1 },
      solution: [`Square the decimal: ${t1(d)}² = ${fmt(d * d)}.`, `${fmt(d * d)} ${rootBig ? '<' : '>'} ${m}, so ${t1(d)} ${rootBig ? '<' : '>'} ${sq(m)}.`, `${S(rootBig ? `${sq(m)} is greater` : `${hn(d)} is greater`)}.`],
    }, R, [
      { html: sq(m), ok: rootBig, say: rootBig ? `Yes: ${t1(d)}² = ${fmt(d * d)} < ${m}.` : `${t1(d)}² = ${fmt(d * d)}, which is more than ${m}, so ${t1(d)} is greater.` },
      { html: hn(d), ok: !rootBig, say: !rootBig ? `Yes: ${t1(d)}² = ${fmt(d * d)} > ${m}.` : `${t1(d)}² = ${fmt(d * d)}, less than ${m}, so ${sq(m)} is greater.` },
      { html: 'They are equal', ok: false, mc: isRound ? MC.roundedExact : undefined, say: `${t1(d)}² = ${fmt(d * d)}, not ${m}. A rounded decimal is close to ${sq(m)}, never equal to it.` },
    ]);
  }
  if (vv < 0.65) {
    let p = 0, q = 0;
    for (let i = 0; i < 200; i++) {
      p = nonSquare(R, 5, 90); q = nonCube(R, p + 5, 999);
      if (Math.cbrt(q) < Math.sqrt(p) - 0.3 && cubeFloor(q) + 1 <= sqFloor(p)) break;
    }
    if (!(Math.cbrt(q) < Math.sqrt(p) - 0.3 && cubeFloor(q) + 1 <= sqFloor(p))) { p = 20; q = 30; }
    const a = Math.sqrt(p), b = Math.cbrt(q), lo = Math.floor(b), hi = Math.ceil(a);
    return choose({
      id: id('compare', n), family: 'compare', prompt: `Which is greater: ${sq(p)} or ${cb(q)}?`, board: `\\sqrt{${p}} \\;\\;?\\;\\; \\sqrt[3]{${q}}`,
      picture: hi - lo <= 12 ? { kind: 'line', solveTex: [`\\sqrt[3]{${q}} < ${cubeFloor(q) + 1}`, `\\sqrt{${p}} > ${sqFloor(p)}`], lo, hi, minor: hi - lo <= 4 ? 0.5 : 1, labels: Array.from({ length: hi - lo + 1 }, (_, i) => lo + i), marks: [{ v: b, tex: `\\sqrt[3]{${q}}`, col: 'second' }, { v: a, tex: `\\sqrt{${p}}`, col: 'link' }], solveMarks: 0 } satisfies LinePic : undefined,
      solution: [`Bound each one: ${sqFloor(p)}² = ${sqFloor(p) ** 2} < ${p}, so ${sq(p)} > ${sqFloor(p)}.`, `${cubeFloor(q) + 1}³ = ${(cubeFloor(q) + 1) ** 3} > ${q}, so ${cb(q)} < ${cubeFloor(q) + 1}.`, `${S(`${sq(p)} is greater`)}, even though ${q} > ${p}: the roots are different.`],
    }, R, [
      { html: sq(p), ok: true, say: `Yes: ${sq(p)} is more than ${sqFloor(p)}, ${cb(q)} is less than ${cubeFloor(q) + 1}.` },
      { html: cb(q), ok: false, mc: MC.byRadicand, say: `${q} is bigger than ${p}, but a cube root shrinks much more: ${cb(q)} < ${cubeFloor(q) + 1} while ${sq(p)} > ${sqFloor(p)}.` },
      { html: 'They are equal', ok: false, say: `Bound them: ${cb(q)} < ${cubeFloor(q) + 1} ≤ ${sqFloor(p)} < ${sq(p)}.` },
    ]);
  }
  // order a set: a whole number, a square root, a decimal or fraction, a cube root
  for (let tries = 0; ; tries++) {
    const k = int(R, 2, 5);
    const n2 = nonSquare(R, (k - 1) ** 2 + 1, (k + 1) ** 2 - 1);
    const q3 = nonCube(R, Math.max(2, (k - 1) ** 3 + 1), (k + 1) ** 3 - 1);
    const frac = R() < 0.3;
    const dv = frac ? (k - 1) + pick(R, [1, 3]) / 4 : round(k - 1 + int(R, 1, 19) / 10, 1);
    const neg = R() < 0.25;
    const items: V[] = [
      { v: k, html: String(k), tex: String(k) },
      { v: Math.sqrt(n2), html: sq(n2), rad: n2, idx: 2, tex: `\\sqrt{${n2}}` },
      frac ? { v: dv, html: fr((k - 1) * 4 + Math.round((dv - (k - 1)) * 4), 4), tex: `\\tfrac{${(k - 1) * 4 + Math.round((dv - (k - 1)) * 4)}}{4}` } : { v: dv, html: hn(dv), tex: fmt(dv) },
      neg ? { v: -1.5, html: '−1.5', tex: '-1.5' } : { v: Math.cbrt(q3), html: cb(q3), rad: q3, idx: 3, tex: `\\sqrt[3]{${q3}}` },
    ];
    const vals = items.map(x => x.v).sort((a, b) => a - b);
    const gapOk = vals.every((x, i) => i === 0 || x - vals[i - 1]! > 0.06);
    const key = (f: (x: V) => number) => [...items].sort((a, b) => f(a) - f(b)).map(x => x.html).join(' < ');
    const right = key(x => x.v);
    const byRad = key(x => x.rad ?? x.v);
    const byDiv = key(x => (x.rad ? x.rad / x.idx! : x.v));
    if (tries < 300 && (!gapOk || byRad === right || byDiv === right || byRad === byDiv)) continue;
    const lo = Math.floor(Math.min(...vals)), hi = Math.ceil(Math.max(...vals) + 1e-9);
    const opts: Opt[] = [
      { html: right, ok: true, say: `Yes. Place each on the number line using bounds: ${items.filter(x => x.rad).map(x => `${x.html} ≈ ${round(x.v, 2)}`).join(', ')}.` },
      { html: byRad, ok: false, mc: MC.byRadicand, say: `That orders the roots by the numbers under the sign. Compare their values: ${items.filter(x => x.rad).map(x => `${x.html} ≈ ${round(x.v, 2)}`).join(', ')}.` },
      { html: byDiv, ok: false, mc: MC.divIndex, say: `A root is not the radicand divided by 2 or 3. ${items.filter(x => x.rad).map(x => `${x.html} ≈ ${round(x.v, 2)}`).join(', ')}.` },
    ];
    if (byRad === right || byDiv === right || byRad === byDiv) {
      // fallback (never reached in practice): a plain reversed order as the second distractor
      opts.length = 1;
      opts.push({ html: key(x => -x.v), ok: false, say: 'That is greatest first.' }, { html: [...items].map(x => x.html).join(' < '), ok: false, say: 'Check the values on the number line.' });
    }
    return choose({
      id: id('compare', n), family: 'compare', prompt: `Order from least to greatest: ${items.map(x => x.html).join(', ')}`,
      board: items.map(x => x.tex).join(',\\;\\; '),
      picture: hi - lo <= 8 ? { kind: 'line', lo, hi, minor: hi - lo <= 4 ? 0.5 : 1, labels: Array.from({ length: hi - lo + 1 }, (_, i) => lo + i), marks: items.map(x => ({ v: x.v, tex: x.tex, col: x.rad ? 'link' as const : 'pick' as const })), solveMarks: 0 } satisfies LinePic : undefined,
      solution: [`Bound each root: ${items.filter(x => x.rad).map(x => `${x.html} ≈ ${round(x.v, 2)}`).join(', ')}.`, `Place them with the other numbers on the number line.`, `${S(right)}.`],
    }, R, opts);
  }
};

// =====================================================================================================================
// round-root-nearest-tenth: compare the radicand with the square of the midpoint
// =====================================================================================================================
const roundRoot: Gen = (R, n) => {
  if (R() < 0.55) {
    const m = R() < 0.85 ? nonSquare(R, 2, 99) : pick(R, REFINE_EXTRA);
    const k = sqFloor(m), t = tenthsFloor(m), ms = midSquare(t), up = ms < m, right = tenth(up ? t + 1 : t);
    const mid = (2 * t + 1) / 20;
    return typed({
      id: id('roundRoot', n), family: 'roundRoot',
      prompt: `${t1(t / 10)} < ${sq(m)} < ${t1((t + 1) / 10)}, and the midpoint squared is ${fmt(mid)}² = ${fmt(ms)}${m >= 100 ? ' (calculator)' : ''}. Round ${sq(m)} to the nearest tenth.`,
      board: `\\sqrt{${m}} \\approx \\,?`,
      picture: { kind: 'line', solveTex: [`${fmt(mid)}^2 = ${fmt(ms)} ${up ? '<' : '>'} ${m}`, `\\sqrt{${m}} \\approx ${t1(right)}`], lo: k, hi: k + 1, minor: 0.1, labels: [k, k + 1], marks: [{ v: Math.sqrt(m), tex: `\\sqrt{${m}}`, col: 'link' }], solveMarks: 0, band: [tenth(t), tenth(t + 1)], mid, midOnSolve: false },
      solution: [`The midpoint of ${t1(t / 10)} and ${t1((t + 1) / 10)} is ${fmt(mid)}, and ${fmt(mid)}² = ${fmt(ms)}.`, `${fmt(ms)} ${up ? '<' : '>'} ${m}, so ${sq(m)} is ${up ? 'above' : 'below'} the midpoint.`, `${sq(m)} ≈ ${S(t1(right))}.`],
    }, right, `Yes: ${fmt(ms)} ${up ? '<' : '>'} ${m}, so ${sq(m)} ≈ ${t1(right)}.`, [
      { v: up ? tenth(t) : null, mc: MC.truncate, say: `Cutting off after the tenths is not rounding. ${fmt(ms)} < ${m}, so ${sq(m)} is past the midpoint: ${t1(right)}.` },
      { v: up ? null : tenth(t + 1), say: `${fmt(ms)} > ${m}, so ${sq(m)} is below the midpoint ${fmt(mid)}: it rounds down to ${t1(right)}.` },
    ], `Compare ${m} with the midpoint square ${fmt(ms)}.`);
  }
  // nearest whole number: sometimes the "closer square" shortcut fails
  const k = int(R, 3, 11), tricky = R() < 0.5;
  const m = tricky ? round(k * k + k + pick(R, [0.3, 0.4]), 1) : nonSquare(R, k * k + 1, (k + 1) ** 2 - 1);
  const ms = (k + 0.5) ** 2, up = m > ms, right = up ? k + 1 : k;
  const closerLow = m - k * k < (k + 1) ** 2 - m;
  return choose({
    id: id('roundRoot', n), family: 'roundRoot', prompt: `Is ${sq(m)} nearer to ${k} or to ${k + 1}? (${k}.5² = ${fmt(ms)})`, board: `\\sqrt{${fmt(m)}} \\approx \\,?`,
    picture: { kind: 'line', solveTex: [`${k}.5^2 = ${fmt(ms)} ${up ? '<' : '>'} ${fmt(m)}`, `\\sqrt{${fmt(m)}} \\approx ${right}`], lo: k, hi: k + 1, minor: 0.1, labels: [k, k + 1], marks: [{ v: Math.sqrt(m), tex: `\\sqrt{${fmt(m)}}`, col: 'link' }], solveMarks: 0, mid: k + 0.5, midOnSolve: false },
    solution: [`The midpoint of ${k} and ${k + 1} is ${k}.5, and ${k}.5² = ${fmt(ms)}.`, `${hn(m)} ${up ? '>' : '<'} ${fmt(ms)}, so ${sq(m)} is ${up ? 'past' : 'before'} the midpoint.`, `${sq(m)} is nearer to ${S(right)}.${tricky ? ` (Even though ${hn(m)} is closer to ${k * k} than to ${(k + 1) ** 2}.)` : ''}`],
  }, R, [
    { html: String(k), ok: !up, mc: up && closerLow ? MC.interp : undefined, say: up ? `${hn(m)} is closer to ${k * k}, but roots do not spread evenly: ${k}.5² = ${fmt(ms)} < ${hn(m)}, so ${sq(m)} is nearer ${k + 1}.` : `Yes: ${hn(m)} < ${fmt(ms)}, so ${sq(m)} is below ${k}.5.` },
    { html: String(k + 1), ok: up, say: up ? `Yes: ${k}.5² = ${fmt(ms)} < ${hn(m)}, so ${sq(m)} is past ${k}.5.` : `${hn(m)} < ${k}.5² = ${fmt(ms)}, so ${sq(m)} is below ${k}.5: nearer ${k}.` },
    { html: 'Exactly halfway', ok: false, say: `${k}.5² = ${fmt(ms)}, not ${hn(m)}, so ${sq(m)} is not exactly ${k}.5.` },
  ], true);
};

// =====================================================================================================================
// square-equation-two-solutions: x² = p has two solutions ±√p; the symbol √p names one
// =====================================================================================================================
const solveSq: Gen = (R, n) => {
  const v = R();
  if (v < 0.4) {
    const k = int(R, 1, 12), p = k * k;
    return paired({
      id: id('solveSq', n), family: 'solveSq', prompt: `Solve ${B(`x² = ${p}`)}. List both solutions and check each.`, board: `x^2 = ${p}`,
      pairLead: 'x =', pairOp: 'or x =',
      picture: { kind: 'line', solveTex: [`x = \\pm\\sqrt{${p}} = \\pm ${k}`], lo: -(k + 1), hi: k + 1, minor: 1, labels: [-(k + 1), 0, k + 1], marks: [{ v: -k, tex: `-${k}`, col: 'link' }, { v: k, tex: String(k), col: 'link' }], solveMarks: 0, arcs: true },
      solution: [`${k}² = ${p} ✓ and (−${k})² = (−${k}) × (−${k}) = ${p} ✓.`, `So x = ${S(String(k))} or x = ${S(`−${k}`)}, written x = ±${sq(p)} = ±${k}.`, `${sq(p)} alone names only ${k}; the ± comes from the equation.`],
    }, [k, -k], false, `Yes: ${k}² = ${p} and (−${k})² = ${p}.`, [
      { p: [k, k], mc: MC.onlyPos, say: `${k} works, and so does −${k}: (−${k}) × (−${k}) = ${p}. The equation has two solutions.` },
      { p: [p / 2, -p / 2], mc: MC.divIndex, say: `Check: (${hn(p / 2)})² = ${hn((p / 2) ** 2)}, not ${p}. The solutions are ${k} and −${k}.` },
    ], `Which two numbers square to ${p}?`);
  }
  if (v < 0.62) {
    const fracCase = R() < 0.35;
    if (fracCase) {
      let a = 1, b = 2;
      do { b = int(R, 2, 9); a = int(R, 1, b - 1); } while (gcd(a, b) !== 1);
      const P = fr(a * a, b * b);
      return choose({
        id: id('solveSq', n), family: 'solveSq', prompt: `Solve x² = ${P}.`, board: `x^2 = \\tfrac{${a * a}}{${b * b}}`,
        solution: [`${fr(a, b)} × ${fr(a, b)} = ${P} ✓ and (−${fr(a, b)}) × (−${fr(a, b)}) = ${P} ✓.`, `${S(`x = ${fr(a, b)} or x = −${fr(a, b)}`)}.`],
      }, R, [
        { html: `x = ${fr(a, b)} or x = −${fr(a, b)}`, ok: true, say: `Yes: both square to ${P}.` },
        { html: `x = ${fr(a, b)} only`, ok: false, mc: MC.onlyPos, say: `−${fr(a, b)} works too: a negative times a negative is positive.` },
        { html: `x = ${fr(a * a, 2 * b * b)} or x = −${fr(a * a, 2 * b * b)}`, ok: false, mc: MC.divIndex, say: `That halves ${P}. Square it to check: it does not give ${P}. The solutions are ±${fr(a, b)}.` },
      ]);
    }
    const p = nonSquare(R, 2, 60), r2 = round(Math.sqrt(p), 2);
    return choose({
      id: id('solveSq', n), family: 'solveSq', prompt: `Solve x² = ${p}. Give exact answers.`, board: `x^2 = ${p}`,
      solution: [`(${sq(p)})² = ${p} and (−${sq(p)})² = ${p}.`, `${S(`x = ${sq(p)} or x = −${sq(p)}`)} (x = ±${sq(p)}).`, `${r2} is only close: ${r2}² = ${fmt(r2 * r2)}.`],
    }, R, [
      { html: `x = ${sq(p)} or x = −${sq(p)}`, ok: true, say: `Yes: exact, and both of them.` },
      { html: `x = ${sq(p)} only`, ok: false, mc: MC.onlyPos, say: `−${sq(p)} squares to ${p} as well. The equation has two solutions.` },
      { html: `x = ${r2} or x = −${r2}, exactly`, ok: false, mc: MC.roundedExact, say: `${r2}² = ${fmt(r2 * r2)}, not ${p}. Exact answers: ±${sq(p)} (≈ ±${r2}).` },
    ]);
  }
  if (v < 0.82) {
    const k = int(R, 2, 12), p = k * k;
    return choose({
      id: id('solveSq', n), family: 'solveSq', prompt: `True or false: ${sq(p)} = ±${k}?`, board: `\\sqrt{${p}} \\overset{?}{=} \\pm ${k}`,
      solution: [`${sq(p)} names one number: the nonnegative ${k}.`, `The EQUATION x² = ${p} has two solutions, ${k} and −${k}: x = ±${sq(p)}.`, `So ${sq(p)} = ±${k} is ${S('false')}.`],
    }, R, [
      { html: `False: ${sq(p)} = ${k}. It is x² = ${p} that has the two solutions ±${k}.`, ok: true, say: `Right: the symbol names one number; the equation has two solutions.` },
      { html: `True: (−${k})² = ${p} too, so ${sq(p)} is ${k} and −${k}.`, ok: false, mc: MC.plusMinus, say: `−${k} solves x² = ${p}, but the symbol ${sq(p)} names only the root that is 0 or more: ${k}.` },
      { html: `False: −${k} is not a solution of x² = ${p} at all.`, ok: false, mc: MC.onlyPos, say: `−${k} IS a solution: (−${k}) × (−${k}) = ${p}. It is just not the value of ${sq(p)}.` },
    ]);
  }
  const k = int(R, 2, 12), p = k * k;
  return choose({
    id: id('solveSq', n), family: 'solveSq', prompt: `Is x = −${k} a solution of x² = ${p}?`, board: `(-${k})^2 \\overset{?}{=} ${p}`,
    solution: [`Substitute: (−${k})² = (−${k}) × (−${k}) = ${p}.`, `${p} = ${p} ✓, so ${S(`yes`)}: x = −${k} is a solution, next to x = ${k}.`],
  }, R, [
    { html: `Yes: (−${k})² = (−${k}) × (−${k}) = ${p}`, ok: true, say: `Yes: substitute and check. Both ${k} and −${k} solve it.` },
    { html: `No: (−${k})² = −${p}`, ok: false, mc: MC.onlyPos, say: `(−${k}) × (−${k}) is positive: ${p}. So −${k} is a solution.` },
    { html: `No: ${sq(p)} is only ${k}`, ok: false, mc: MC.onlyPos, say: `${sq(p)} is only ${k}, true, but the equation asks for EVERY x with x² = ${p}, and (−${k})² = ${p}.` },
  ]);
};

// =====================================================================================================================
// square-equation-boundary-cases (Florida): x² = 0 has one solution; x² = −9 has none. Mixed with positive p and cubes
// =====================================================================================================================
/** what each wrong count says, by case (K = k, K2 = k², K3 = k³); index = No real / Exactly one / Two */
const WRONG: Record<'zero' | 'neg' | 'pos' | 'cubePos' | 'cubeNeg', (string | undefined)[]> = {
  zero: ['x = 0 works: 0 × 0 = 0. That is one solution.', undefined, '0 and −0 are the same number, so x = 0 is ONE solution.'],
  neg: [undefined, '(−K)² = K2, not −K2: a negative number squared is positive. No real number squares to −K2.', 'K² and (−K)² are both +K2. No real number squares to −K2.'],
  pos: ['K² = K2, so x = K works, and so does x = −K.', '−K works too: (−K) × (−K) = K2. Two solutions.', undefined],
  cubePos: ['K³ = K3, so x = K works.', undefined, '(−K)³ = −K3, so −K does not work. Only x = K.'],
  cubeNeg: ['(−K)³ = −K3, so x = −K works. Odd powers keep the sign.', undefined, 'K³ = K3 is positive, so only x = −K works.'],
};
const countSol: Gen = (R, n) => {
  const kind = pick(R, ['zero', 'neg', 'pos', 'cubePos', 'cubeNeg', 'zero', 'neg'] as const);
  const k = int(R, 1, kind.startsWith('cube') ? 5 : 12);
  const eq = kind === 'zero' ? 'x² = 0' : kind === 'neg' ? `x² = −${k * k}` : kind === 'pos' ? `x² = ${k * k}` : kind === 'cubePos' ? `x³ = ${k ** 3}` : `x³ = −${k ** 3}`;
  const tex = eq.replace('²', '^2').replace('³', '^3').replace('−', '-');
  const right = kind === 'neg' ? 0 : kind === 'pos' ? 2 : 1;
  const why = kind === 'zero' ? `Only 0 × 0 = 0: x = 0 is the one solution (0 and −0 are the same number).`
    : kind === 'neg' ? `Every real number squared is 0 or more, so nothing squares to −${k * k}: no real solution.`
      : kind === 'pos' ? `${k}² = ${k * k} and (−${k})² = ${k * k}: two solutions, ±${k}.`
        : kind === 'cubePos' ? `${k}³ = ${k ** 3}, but (−${k})³ = −${k ** 3}: one solution, x = ${k}.`
          : `(−${k})³ = −${k ** 3}: one solution, x = −${k}. Cube roots of negatives are real.`;
  const mcs: (string | undefined)[] = [
    kind === 'cubeNeg' ? MC.oddNegUndef : undefined,
    kind === 'pos' ? MC.onlyPos : kind === 'neg' ? MC.sqrtNegNeg : undefined,
    kind === 'zero' ? MC.doubleRoot : kind === 'cubePos' || kind === 'cubeNeg' ? MC.pmOdd : kind === 'neg' ? MC.sqrtNegNeg : undefined,
  ];
  const labels = ['No real solution', 'Exactly one', 'Two'];
  return choose({
    id: id('countSol', n), family: 'countSol', prompt: `How many real solutions does ${B(eq)} have?`, board: tex,
    solution: [why, `So: ${S(labels[right]!.toLowerCase())}.`],
  }, R, labels.map((h, i) => ({ html: h, ok: i === right, mc: i === right ? undefined : mcs[i], say: i === right ? `Yes. ${why}` : (WRONG[kind][i] ?? why).replace(/K3/g, String(k ** 3)).replace(/K2/g, String(k * k)).replace(/K/g, String(k)) })), true);
};

// =====================================================================================================================
// cube-equation-one-solution: x³ = p has exactly one real solution, ∛p (no ±)
// =====================================================================================================================
const solveCube: Gen = (R, n) => {
  const v = R();
  if (v < 0.4) {
    const k = int(R, 2, 10), p = k ** 3;
    const third: Opt = isSquare(p) ? { html: `x = ${Math.sqrt(p)}`, ok: false, mc: MC.ignoreIndex, say: `${Math.sqrt(p)}² = ${p}, but the equation has x³: ${Math.sqrt(p)}³ is much bigger. x = ${k}.` }
      : p % 3 === 0 ? { html: `x = ${p / 3}`, ok: false, mc: MC.divIndex, say: `That divides by 3. Which number used 3 times makes ${p}? ${k}.` }
        : { html: `x = ${k * k}`, ok: false, say: `${k * k}³ is far more than ${p}. ${k}³ = ${p}, so x = ${k}.` };
    return choose({
      id: id('solveCube', n), family: 'solveCube', prompt: `Solve ${B(`x³ = ${p}`)}.`, board: `x^3 = ${p}`,
      solution: [`${k}³ = ${p} ✓.`, `(−${k})³ = −${p}, not ${p} ✗.`, `So there is one solution: ${S(`x = ${cb(p)} = ${k}`)}.`],
    }, R, [
      { html: `x = ${k}`, ok: true, say: `Yes: one solution, because (−${k})³ = −${p}.` },
      { html: `x = ${k} or x = −${k}`, ok: false, mc: MC.pmOdd, say: `Check −${k}: (−${k}) × (−${k}) × (−${k}) = −${p}. Only x = ${k} works.` },
      third,
    ]);
  }
  if (v < 0.6) {
    const k = int(R, 2, 6), p = k ** 3;
    return choose({
      id: id('solveCube', n), family: 'solveCube', prompt: `Is x = −${k} a solution of x³ = ${p}?`, board: `(-${k})^3 \\overset{?}{=} ${p}`,
      solution: [`Substitute: (−${k}) × (−${k}) = ${k * k}, then ${k * k} × (−${k}) = −${p}.`, `−${p} ≠ ${p}, so ${S('no')}. x³ = ${p} has only x = ${k}.`],
    }, R, [
      { html: `No: (−${k})³ = −${p}`, ok: true, say: `Right: three negative factors make a negative.` },
      { html: `Yes: a negative times a negative is positive, so (−${k})³ = ${p}`, ok: false, mc: MC.pmOdd, say: `Two negatives make a positive, but the third factor makes it negative again: (−${k})³ = −${p}.` },
      { html: `Yes: power equations always have two solutions`, ok: false, mc: MC.pmOdd, say: `Only even powers do. (−${k})³ = −${p}, so x³ = ${p} has just x = ${k}.` },
    ]);
  }
  if (v < 0.8) {
    const q = nonCube(R, 2, 100);
    return choose({
      id: id('solveCube', n), family: 'solveCube', prompt: `Solve x³ = ${q}. Give the exact answer.`, board: `x^3 = ${q}`,
      solution: [`(${cb(q)})³ = ${q} ✓; (−${cb(q)})³ = −${q} ✗.`, `${S(`x = ${cb(q)}`)}, between ${cubeFloor(q)} and ${cubeFloor(q) + 1}.`],
    }, R, [
      { html: `x = ${cb(q)}`, ok: true, say: `Yes: one exact solution.` },
      { html: `x = ${cb(q)} or x = −${cb(q)}`, ok: false, mc: MC.pmOdd, say: `(−${cb(q)})³ = −${q}. A cube equation has one real solution.` },
      { html: `x = ${sq(q)} or x = −${sq(q)}`, ok: false, mc: MC.ignoreIndex, say: `That solves x² = ${q}. For x³ = ${q} take the cube root: x = ${cb(q)}.` },
    ]);
  }
  const frac = R() < 0.3;
  if (frac) {
    let a = 1, b = 2;
    do { b = int(R, 2, 5); a = int(R, 1, b - 1); } while (gcd(a, b) !== 1);
    return fracTyped({
      id: id('solveCube', n), family: 'solveCube', prompt: `Solve x³ = ${fr(a ** 3, b ** 3)}.`, board: `x^3 = \\tfrac{${a ** 3}}{${b ** 3}}`,
      solution: [`${fr(a, b)} × ${fr(a, b)} × ${fr(a, b)} = ${fr(a ** 3, b ** 3)} ✓.`, `One solution: x = ${S(fr(a, b))}.`],
    }, a, b, `Yes: (${fr(a, b)})³ = ${fr(a ** 3, b ** 3)}.`, [
      { n: a ** 3, d: 3 * b ** 3, mc: MC.divIndex, say: `That divides by 3. Find the fraction used 3 times: ${fr(a, b)}.` },
    ], `Cube root of the top and of the bottom.`);
  }
  const k = pick(R, [2, 3, 4, 5, 6, 10]), p = k ** 3;
  return typed({
    id: id('solveCube', n), family: 'solveCube', prompt: `Solve x³ = ${p}.`, board: `x^3 = ${p}`,
    solution: [`${k}³ = ${p}, and no other real number cubes to ${p}.`, `So x = ${S(String(k))}.`],
  }, k, `Yes: x = ${cb(p)} = ${k}.`, [
    { v: p / 3, tol: 0.05, mc: MC.divIndex, say: `That divides by 3. ${k} × ${k} × ${k} = ${p}, so x = ${k}.` },
    { v: -k, mc: MC.pmOdd, say: `(−${k})³ = −${p}. The solution is ${k}.` },
  ], `Which number used 3 times makes ${p}?`);
};

// =====================================================================================================================
// isolate-then-root (extension): 3x² = 48, x² + 9 = 25, 2x³ = 54
// =====================================================================================================================
const TRIPLES: [number, number, number][] = [[3, 4, 5], [4, 3, 5], [6, 8, 10], [8, 6, 10], [5, 12, 13], [12, 5, 13], [9, 12, 15], [12, 9, 15]];
const isolate: Gen = (R, n) => {
  const v = R();
  if (v < 0.35) {
    const a = int(R, 2, 5), k = int(R, 1, 8), p = a * k * k;
    return paired({
      id: id('isolate', n), family: 'isolate', prompt: `Solve ${B(`${a}x² = ${p}`)}. List both solutions.`, board: `${a}x^2 = ${p}`,
      pairLead: 'x =', pairOp: 'or x =',
      solution: [`Divide both sides by ${a}: x² = ${k * k}.`, `Then the roots: x = ${S(String(k))} or x = ${S(`−${k}`)}.`, `Check: ${a} × ${k}² = ${p} ✓, ${a} × (−${k})² = ${p} ✓.`],
    }, [k, -k], false, `Yes: x² = ${k * k}, so x = ±${k}.`, [
      { p: [k, k], mc: MC.onlyPos, say: `x = −${k} works too: ${a} × (−${k})² = ${p}.` },
    ], `First divide both sides by ${a} to get x² alone.`);
  }
  if (v < 0.75) {
    const [a, b, c] = pick(R, TRIPLES), minus = R() < 0.4;
    // x² + b² = c²  ->  x = ±a      or      x² − a² = b²  ->  x² = c²  ->  x = ±c
    if (!minus) return paired({
      id: id('isolate', n), family: 'isolate', prompt: `Solve ${B(`x² + ${b * b} = ${c * c}`)}. List both solutions.`, board: `x^2 + ${b * b} = ${c * c}`,
      pairLead: 'x =', pairOp: 'or x =',
      solution: [`Take ${b * b} from both sides first: x² = ${c * c} − ${b * b} = ${a * a}.`, `Then the roots: x = ${S(String(a))} or x = ${S(`−${a}`)}.`, `You cannot take roots term by term: ${sq(`x² + ${b * b}`)} is not x + ${b}.`],
    }, [a, -a], false, `Yes: x² = ${a * a}, so x = ±${a}.`, [
      { p: [c - b, -(c - b)], mc: MC.sumRoot, say: `Roots do not split over a sum: ${sq(`x² + ${b * b}`)} is not x + ${b}. Subtract first: x² = ${a * a}, so x = ±${a}.` },
      { p: [a, a], mc: MC.onlyPos, say: `x = −${a} works too: (−${a})² + ${b * b} = ${c * c}.` },
    ], `Get x² alone first: subtract ${b * b} from both sides.`);
    return paired({
      id: id('isolate', n), family: 'isolate', prompt: `Solve ${B(`x² − ${a * a} = ${b * b}`)}. List both solutions.`, board: `x^2 - ${a * a} = ${b * b}`,
      pairLead: 'x =', pairOp: 'or x =',
      solution: [`Add ${a * a} to both sides first: x² = ${b * b} + ${a * a} = ${c * c}.`, `Then the roots: x = ${S(String(c))} or x = ${S(`−${c}`)}.`],
    }, [c, -c], false, `Yes: x² = ${c * c}, so x = ±${c}.`, [
      { p: [a + b, -(a + b)], mc: MC.sumRoot, say: `Roots do not split over a difference: ${sq(`x² − ${a * a}`)} is not x − ${a}. Add first: x² = ${c * c}, so x = ±${c}.` },
      { p: [c, c], mc: MC.onlyPos, say: `x = −${c} works too.` },
    ], `Get x² alone first: add ${a * a} to both sides.`);
  }
  const a = int(R, 2, 4), k = int(R, 1, 5), p = a * k ** 3;
  return typed({
    id: id('isolate', n), family: 'isolate', prompt: `Solve ${B(`${a}x³ = ${p}`)}.`, board: `${a}x^3 = ${p}`,
    solution: [`Divide both sides by ${a}: x³ = ${k ** 3}.`, `Then the cube root: x = ${S(String(k))} (one solution).`],
  }, k, `Yes: x³ = ${k ** 3}, so x = ${k}.`, [
    { v: k ** 3, say: `${k ** 3} is x³. Now take the cube root: ${k}.` },
    { v: -k, mc: MC.pmOdd, say: `(−${k})³ is negative, so −${k} does not work: x = ${k}.` },
  ], `Divide by ${a}, then take the cube root.`);
};

// =====================================================================================================================
// context-select-root: area and volume contexts keep the meaningful (nonnegative) solution, with units
// =====================================================================================================================
const context: Gen = (R, n) => {
  const v = R();
  if (v < 0.25) {
    const k = int(R, 3, 15), p = k * k, th = thingFor(R, SQ_THINGS, k);
    return typed({
      id: id('context', n), family: 'context', prompt: `A square ${th.t} has an area of ${A(`${p} ${sqUnit(th.u)}`)}. How long is each side?`,
      board: `s^2 = ${p}${tU(th.u)}^2`, unit: th.u,
      picture: sqPic(p, th.u, 'solve', 'solve'),
      solution: [`s² = ${p}, and s is a length, so s is 0 or more.`, `s = ${sq(p)} = ${S(`${k} ${th.u}`)} (−${k} solves s² = ${p} but is no length).`],
    }, k, `Yes: ${k} ${th.u}, since ${k} × ${k} = ${p}.`, [
      { v: p / 2, mc: MC.divIndex, say: `Halving is not the square root: ${k} × ${k} = ${p}, so the side is ${k} ${th.u}.` },
      { v: -k, mc: MC.allReals, say: `A length cannot be negative: the side is ${k} ${th.u}.` },
    ], `The side times itself makes ${p}.`);
  }
  if (v < 0.47) {
    const m = R() < 0.6 ? nonSquare(R, 20, 99) : pick(R, [120, 150, 200, 250]);
    const t = tenthsFloor(m), ms = midSquare(t), up = ms < m, right = tenth(up ? t + 1 : t), mid = (2 * t + 1) / 20;
    const th = thingFor(R, SQ_THINGS.filter(x => x.u === 'ft'), Math.sqrt(m));
    return typed({
      id: id('context', n), family: 'context',
      prompt: `A square ${th.t} covers ${A(`${m} ${sqUnit('ft')}`)}. The side is ${sq(m)} ft exactly, between ${t1(t / 10)} and ${t1((t + 1) / 10)}; ${fmt(mid)}² = ${fmt(ms)}${m >= 100 ? ' (calculator)' : ''}. Round the side to the nearest tenth of a foot.`,
      board: `s = \\sqrt{${m}} \\approx \\,?\\text{ ft}`, unit: 'ft',
      picture: sqPic(m, 'ft', 'none', 'solve', { sideTex: `\\sqrt{${m}} \\approx ${t1(right)}\\text{ ft}` }),
      solution: [`${t1(t / 10)} < ${sq(m)} < ${t1((t + 1) / 10)}; the midpoint ${fmt(mid)} squares to ${fmt(ms)}.`, `${fmt(ms)} ${up ? '<' : '>'} ${m}, so the side is ${up ? 'past' : 'before'} the midpoint.`, `s = ${sq(m)} ft ≈ ${S(`${t1(right)} ft`)}.`],
    }, right, `Yes: s = ${sq(m)} ≈ ${t1(right)} ft.`, [
      { v: up ? tenth(t) : null, mc: MC.truncate, say: `Cutting off the digits is not rounding: ${fmt(ms)} < ${m}, so it rounds up to ${t1(right)} ft.` },
      { v: m / 2, mc: MC.divIndex, say: `The side is ${sq(m)} ft, not half the area. ${sq(m)} ≈ ${t1(right)}.` },
    ], `Compare ${m} with the midpoint square ${fmt(ms)}.`);
  }
  if (v < 0.65) {
    const k = int(R, 3, 12), p = k * k, area = R() < 0.65;
    if (area) {
      const th = thingFor(R, SQ_THINGS, k);
      return choose({
        id: id('context', n), family: 'context', prompt: `For a square ${th.t} of ${p} ${sqUnit(th.u)}, s² = ${p} gives s = ${k} or s = −${k}. Which is the side length?`, board: `s^2 = ${p}`,
        picture: sqPic(p, th.u, 'show', 'solve'),
        solution: [`Both numbers solve s² = ${p}.`, `A side is a length: 0 or more. The side is ${S(`${k} ${th.u}`)}.`],
      }, R, [
        { html: `${k} ${th.u}`, ok: true, say: `Yes: a length is never negative.` },
        { html: `${k} ${th.u} or −${k} ${th.u}`, ok: false, mc: MC.allReals, say: `−${k} solves the equation, but a side of −${k} ${th.u} makes no sense. The side is ${k} ${th.u}.` },
        { html: `−${k} ${th.u}`, ok: false, say: `A length cannot be negative: ${k} ${th.u}.` },
      ]);
    }
    return choose({
      id: id('context', n), family: 'context', prompt: `A number squared is ${p}. What could the number be?`, board: `x^2 = ${p}`,
      solution: [`Here x is any number, not a length.`, `${k}² = ${p} and (−${k})² = ${p}: ${S(`${k} or −${k}`)}.`],
    }, R, [
      { html: `${k} or −${k}`, ok: true, say: `Yes: nothing says the number must be positive.` },
      { html: `only ${k}`, ok: false, mc: MC.onlyPos, say: `(−${k})² = ${p} too, and here the number may be negative.` },
      { html: `only −${k}`, ok: false, say: `${k}² = ${p} as well: the number could be ${k} or −${k}.` },
    ]);
  }
  if (v < 0.78) {
    const k = int(R, 3, 12), p = k * k, th = thingFor(R, SQ_THINGS, k);
    return choose({
      id: id('context', n), family: 'context', prompt: `A square ${th.t} has an area of ${p} ${sqUnit(th.u)}. Its side is:`, board: `s^2 = ${p}${tU(th.u)}^2`,
      solution: [`${k} × ${k} = ${p}, so the side is ${k}.`, `A side is a length, in ${longU(th.u)}: ${S(`${k} ${th.u}`)}. Square units are for the area.`],
    }, R, [
      { html: `${k} ${th.u}`, ok: true, say: `Yes: a length in ${longU(th.u)}.` },
      { html: `${k} ${sqUnit(th.u)}`, ok: false, mc: MC.unitDim, say: `${sqUnit(th.u)} measures area. The side is a length: ${k} ${th.u}.` },
      { html: `${hn(p / 2)} ${th.u}`, ok: false, mc: MC.divIndex, say: `That halves the area. The side is ${sq(p)} = ${k} ${th.u}.` },
    ]);
  }
  if (v < 0.92) {
    const perfect = R() < 0.55;
    if (perfect) {
      const k = int(R, 2, 10), V = k ** 3, th = thingFor(R, CUBE_THINGS, k);
      return typed({
        id: id('context', n), family: 'context', prompt: `A cube-shaped ${th.t} holds ${A(`${V} ${cubicN(V, th.u)}`)}. How long is each edge?`,
        board: `e^3 = ${V}${tU(th.u)}^3`, unit: th.u,
        picture: cubePic(V, th.u, true, 'solve'),
        solution: [`e³ = ${V}: e = ${cb(V)}.`, `${k} × ${k} × ${k} = ${V}, so the edge is ${S(`${k} ${th.u}`)}.`],
      }, k, `Yes: ${k} × ${k} × ${k} = ${V}.`, [
        { v: V / 3, tol: 0.05, mc: MC.divIndex, say: `That divides by 3. The edge used 3 times makes ${V}: ${k} ${th.u}.` },
        { v: isSquare(V) && V > 1 ? Math.sqrt(V) : null, mc: MC.ignoreIndex, say: `${Math.sqrt(V)} is the side of a flat square of ${V}. The cube's edge is ${cb(V)} = ${k} ${th.u}.` },
      ], `Which number used 3 times makes ${V}?`);
    }
    const V = nonCube(R, 20, 999), k = cubeFloor(V), s = sqFloor(V), th = thingFor(R, CUBE_THINGS, Math.cbrt(V));
    return choose({
      id: id('context', n), family: 'context', prompt: `A cube-shaped ${th.t} holds ${V} ${cubic(th.u)}. Its edge is:`, board: `e^3 = ${V}${tU(th.u)}^3`,
      picture: k >= 1 && k <= 4 ? cubePic(V, th.u, false, 'show', { ghosts: true, edgeTex: `\\sqrt[3]{${V}}${tU(th.u)}` }) : undefined,
      solution: [`e = ${cb(V)} ${th.u} exactly.`, `${k}³ = ${k ** 3} < ${V} < ${(k + 1) ** 3} = ${k + 1}³, so ${S(`${k} < ${cb(V)} < ${k + 1}`)}.`],
    }, R, [
      { html: `${cb(V)} ${th.u}, between ${k} and ${k + 1} ${th.u}`, ok: true, say: `Yes: ${k ** 3} < ${V} < ${(k + 1) ** 3}.` },
      { html: `${sq(V)} ${th.u}, between ${s} and ${s + 1} ${th.u}`, ok: false, mc: MC.ignoreIndex, say: `That is the side of a flat square of ${V}. A cube's edge is the cube root: ${cb(V)}, between ${k} and ${k + 1}.` },
      { html: `${hn(round(V / 3, 1))} ${th.u}`, ok: false, mc: MC.divIndex, say: `A cube root is not a third. ${k}³ = ${k ** 3} < ${V} < ${(k + 1) ** 3}, so the edge is between ${k} and ${k + 1} ${th.u}.` },
    ]);
  }
  const m = pick(R, [200, 150, 120, 250]), t = tenthsFloor(m), mid = (2 * t + 1) / 20, ms = midSquare(t);
  return choose({
    id: id('context', n), family: 'context', prompt: `To round the side of a square patio of ${m} ${sqUnit('ft')}, Ana squares ${fmt(mid)} and gets ${fmt(ms)}. Should she keep all those digits?`, board: `${fmt(mid)}^2 = ${fmt(ms)}`,
    solution: [`Working digits are allowed: only the final answer is rounded.`, `${fmt(ms)} ${ms < m ? '<' : '>'} ${m}, so the side ≈ ${S(`${t1((ms < m ? t + 1 : t) / 10)} ft`)}.`],
  }, R, [
    { html: `Yes: keep extra digits while working, round only the answer`, ok: true, say: `Right: rounding early can flip the answer.` },
    { html: `No: she may only use as many decimal places as the answer has`, ok: false, mc: MC.precision, say: `Working steps may keep more digits. Only the final side is given to the tenth.` },
    { html: `No: she should round ${fmt(ms)} to ${Math.round(ms)} first`, ok: false, mc: MC.precision, say: `Rounding ${fmt(ms)} to ${Math.round(ms)} could hide which side of ${m} it is on. Keep the digits, round at the end.` },
  ]);
};

// =====================================================================================================================
// multistep-expressions-radicals (Florida): the radical groups its radicand; signed powers; mixed expressions
// =====================================================================================================================
const multistep: Gen = (R, n) => {
  const v = R();
  if (v < 0.4) {
    const [a, b, c] = pick(R, TRIPLES);
    const diff = R() < 0.3;
    if (diff) return typed({
      id: id('multistep', n), family: 'multistep', prompt: `Evaluate ${sq(`${c * c} − ${b * b}`)}.`, board: `\\sqrt{${c * c} - ${b * b}} = \\,?`,
      solution: [`The radical groups: work out the radicand first, ${c * c} − ${b * b} = ${a * a}.`, `Then the root: ${sq(a * a)} = ${S(a)}.`],
    }, a, `Yes: ${sq(a * a)} = ${a}.`, [
      { v: c - b, mc: MC.sumRoot, say: `A root does not split over a difference: ${sq(`${c * c} − ${b * b}`)} = ${sq(a * a)} = ${a}, not ${c} − ${b}.` },
    ], `Subtract under the root first.`);
    return typed({
      id: id('multistep', n), family: 'multistep', prompt: `Evaluate ${sq(`${a * a} + ${b * b}`)}.`, board: `\\sqrt{${a * a} + ${b * b}} = \\,?`,
      solution: [`The radical groups: add first, ${a * a} + ${b * b} = ${c * c}.`, `Then the root: ${sq(c * c)} = ${S(c)}.`],
    }, c, `Yes: ${sq(c * c)} = ${c}.`, [
      { v: a + b, mc: MC.sumRoot, say: `A root does not split over a sum: ${a} + ${b} = ${a + b}, but ${a + b}² = ${(a + b) ** 2}, not ${c * c}. Add first: ${sq(c * c)} = ${c}.` },
      { v: a + b * b, mc: MC.rootFirst, say: `The whole sum is under the root: add first, ${c * c}, then the root: ${c}.` },
    ], `Add under the root first, then take the root.`);
  }
  if (v < 0.65) {
    const p = int(R, 1, 9), q = int(R, 2, 4), k = int(R, 2, 9), m = int(R, 1, 5);
    const val = p + q * k + m;
    return typed({
      id: id('multistep', n), family: 'multistep', prompt: `Evaluate ${p} + ${q} · ${sq(k * k)} − ${cb(`−${m ** 3}`)}.`, board: `${p} + ${q}\\sqrt{${k * k}} - \\sqrt[3]{-${m ** 3}} = \\,?`,
      solution: [`Roots first: ${sq(k * k)} = ${k}, ${cb(`−${m ** 3}`)} = −${m}.`, `${p} + ${q} · ${k} − (−${m}) = ${p} + ${q * k} + ${m}.`, `= ${S(val)}.`],
    }, val, `Yes: ${p} + ${q * k} + ${m} = ${val}.`, [
      { v: p + q * k - m, say: `${cb(`−${m ** 3}`)} = −${m}, and subtracting −${m} adds ${m}: ${val}.` },
      { v: (p + q) * k + m, say: `Multiply before adding: ${q} · ${k} = ${q * k}, then ${p} + ${q * k} + ${m} = ${val}.` },
    ], `Work out the roots, then multiply, then add and subtract.`);
  }
  if (v < 0.85) {
    const d = pick(R, [0.5, 0.3, 0.4, 1.5, 0.2, 1.2]), paren = R() < 0.4;
    if (paren) return typed({
      id: id('multistep', n), family: 'multistep', prompt: `Evaluate (−${hn(d)})².`, board: `(-${fmt(d)})^2 = \\,?`,
      solution: [`The base is −${hn(d)}: (−${hn(d)}) × (−${hn(d)}).`, `Negative times negative: ${S(hn(d * d))}.`],
    }, round(d * d, 6), `Yes: (−${hn(d)})² = ${hn(round(d * d, 6))}.`, [
      { v: -round(d * d, 6), mc: MC.negPower, say: `With parentheses the minus is part of the base: (−${hn(d)}) × (−${hn(d)}) = ${hn(round(d * d, 6))}.` },
    ], `Multiply (−${hn(d)}) by itself.`);
    return typed({
      id: id('multistep', n), family: 'multistep', prompt: `Evaluate −${hn(d)}². (No parentheses.)`, board: `-${fmt(d)}^2 = \\,?`,
      solution: [`The square applies to ${hn(d)} only: ${hn(d)}² = ${hn(round(d * d, 6))}.`, `Then the minus: ${S(`−${hn(round(d * d, 6))}`)}.`],
    }, -round(d * d, 6), `Yes: −(${hn(d)}²) = −${hn(round(d * d, 6))}.`, [
      { v: round(d * d, 6), mc: MC.negPower, say: `Without parentheses the minus is not part of the base: −${hn(d)}² = −${hn(round(d * d, 6))}.` },
    ], `Square ${hn(d)} first, then put the minus in front.`);
  }
  const k = int(R, 2, 6), V = k ** 3, th = thingFor(R, CUBE_THINGS, k);
  return typed({
    id: id('multistep', n), family: 'multistep', prompt: `A cube-shaped ${th.t} holds ${V} ${cubic(th.u)}. What is the area of one face?`, board: `\\left(\\sqrt[3]{${V}}\\right)^2 = \\,?`, unit: sqUnit(th.u),
    picture: cubePic(V, th.u, true, 'solve'),
    solution: [`Edge: ${cb(V)} = ${k} ${th.u}.`, `A face is a ${k} by ${k} square: ${k}² = ${S(`${k * k} ${sqUnit(th.u)}`)}.`],
  }, k * k, `Yes: (${cb(V)})² = ${k}² = ${k * k}.`, [
    { v: V / 6, tol: 0.05, say: `${V} ÷ 6 shares the volume, not the area. Edge ${k}, so a face is ${k} × ${k} = ${k * k}.` },
    { v: k, say: `${k} is the edge. A face is ${k} × ${k} = ${k * k} ${sqUnit(th.u)}.` },
    { v: V / 3, tol: 0.05, mc: MC.divIndex, say: `A cube root is not a third. Edge ${cb(V)} = ${k}, face ${k * k}.` },
  ], `Find the edge first, then square it.`);
};

const FAMS: Record<FamilyId, Gen> = {
  sqSide, principal, cubeEdge, rootIndex, signRoot, evalSq, evalCube, ratRoot, rational,
  boundSq, boundCube, refine, compare, roundRoot, solveSq, countSol, solveCube, isolate, context, multistep,
};
/** a "less than" in panel text as &lt;: "10 < √120 < 11" stays text for every HTML reader (a bare "<" before a tag
 *  reads as the start of that tag when the text is stripped of its markup) */
export const lt = (s: string) => s.replace(/<(?=[\s=\d.−-])/g, '&lt;');
const withLt = (g: Gen): Gen => (R, n, sg) => {
  const it = g(R, n, sg) as RItem;
  const check = it.check;
  it.prompt = lt(it.prompt);
  it.solution = it.solution.map(lt);
  if (it.choices) it.choices = it.choices.map(lt);
  if (it.pairLead) it.pairLead = lt(it.pairLead);
  if (it.pairOp) it.pairOp = lt(it.pairOp);
  if (it.pairTail) it.pairTail = lt(it.pairTail);
  it.check = r => { const v = check(r); return { ...v, say: lt(v.say) }; };
  return it;   // the same object: PROBES is keyed on it
};
export const GENS = Object.fromEntries(Object.entries(FAMS).map(([k, g]) => [k, withLt(g)])) as Record<FamilyId, Gen>;
