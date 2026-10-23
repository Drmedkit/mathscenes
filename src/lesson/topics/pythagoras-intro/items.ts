// items.ts: exercise families for "Pythagorean theorem: introduction and use" (primary.geometry.pythagorean-theorem-
// introduction, grade 8). Templates with exact maths (pythag.ts), and every wrong answer the classifier recognises
// carries its misconception id from math-curriculum-essentials/misconceptions.json (the MC table, checked in the test).
// A generator gets the SUB-GOAL it practises (plan.ts) and uses that sub-goal's cases from the topic JSON.
// Pure: no DOM, no canvas; a seeded rng makes sessions repeatable.
import { type Item, type Response, type Verdict, int, pick, shuffle } from '../../runtime/item';
import type { Pt } from '../../../core/math';
import type { SideId } from './SideSquares';
import { endOnChoice } from '../../runtime/explain';
import { TRIPLES, bracket, hyp2, isSquare, isqrt, leg2, rootHtml, rootTex, round1, rightPts, sideLen2, tilted, triKind } from './pythag';

export type FamilyId = 'findHyp' | 'letterC' | 'squareArea' | 'areaUnit' | 'tilted' | 'surroundCalc' | 'missingArea' | 'eqTrue' | 'meaning'
  | 'nonRight' | 'rightFirst' | 'exactSide' | 'bracketRoot' | 'writeEq' | 'hypWhole' | 'missingLeg' | 'mixedSides' | 'exactRoot'
  | 'roundTenth' | 'contextHyp' | 'story' | 'mixedUnits' | 'unitName' | 'subCheck' | 'sizeCheck' | 'roundCheck' | 'proofStep';
export const FAMILIES: readonly { id: FamilyId; name: string }[] = [
  { id: 'findHyp', name: 'Find the hypotenuse' },
  { id: 'letterC', name: 'Is c the hypotenuse?' },
  { id: 'squareArea', name: 'The square on a side' },
  { id: 'areaUnit', name: 'Area and its unit' },
  { id: 'tilted', name: 'A tilted square' },
  { id: 'surroundCalc', name: 'Surround and subtract' },
  { id: 'missingArea', name: 'The missing square' },
  { id: 'eqTrue', name: 'True or false?' },
  { id: 'meaning', name: 'What the equation says' },
  { id: 'nonRight', name: 'Not a right triangle' },
  { id: 'rightFirst', name: 'Right angle first' },
  { id: 'exactSide', name: 'Side of a square, exactly' },
  { id: 'bracketRoot', name: 'Between two whole numbers' },
  { id: 'writeEq', name: 'Write the equation' },
  { id: 'hypWhole', name: 'Find the hypotenuse' },
  { id: 'missingLeg', name: 'Find a leg' },
  { id: 'mixedSides', name: 'Leg or hypotenuse?' },
  { id: 'exactRoot', name: 'Exact answer' },
  { id: 'roundTenth', name: 'To the nearest tenth' },
  { id: 'contextHyp', name: 'Find the right triangle' },
  { id: 'story', name: 'Solve the situation' },
  { id: 'mixedUnits', name: 'One unit first' },
  { id: 'unitName', name: 'Which unit?' },
  { id: 'subCheck', name: 'Check by substituting' },
  { id: 'sizeCheck', name: 'Is it a sensible size?' },
  { id: 'roundCheck', name: 'Check a rounded answer' },
  { id: 'proofStep', name: 'Why the proof works' },
];
export const FAMILY_NAMES: Record<string, string> = Object.fromEntries(FAMILIES.map(f => [f.id, f.name]));

// ---------- pictures the page knows how to draw ----------
/** a triangle (SideSquares): `squares` are part of the layout; `now` = drawn at once, else they grow in the replay */
export interface TriPic {
  kind: 'tri'; pts: [Pt, Pt, Pt]; right: boolean; grid?: boolean;
  labels?: Partial<Record<SideId, string>>; verts?: [string, string, string];
  squares?: SideId[]; areas?: Partial<Record<SideId, string>>; now?: boolean;
  /** show the picture only in the worked solution (the kid models the situation first) */
  after?: boolean;
}
/** a tilted square on grid paper with side steps (p, q): drawn as the c-square of the right triangle with legs p, q */
export interface TiltPic { kind: 'tilt'; p: number; q: number; corners?: boolean }
/** the rearrangement proof square, drawn at a stage */
export interface ProofPic { kind: 'proof'; a: number; b: number; stage: 'mid' | 'left' }
/** a lone upright square of a given area (side from area) */
export interface SqPic { kind: 'sq'; area: number; unit: string; /** TeX under the square, before / after the solve */ ask: string; root: string }
const sqPic = (area: number, unit: string): SqPic => ({ kind: 'sq', area, unit, ask: `\\text{side} = \\,?`, root: `\\text{side} = ${rootTex(area)}` });
export type Pic = TriPic | TiltPic | ProofPic | SqPic;
export interface PyItem extends Item { family: FamilyId; picture?: { pic: Pic }; steps?: string[] }
type Gen = (R: () => number, n: number, sg?: string) => PyItem;

// ---------- misconception ids ----------
export const MC = {
  hypC: 'mc.right-triangles-trig.hypotenuse-always-labeled-c',
  visual: 'mc.right-triangles-trig.hypotenuse-from-visual-cues',
  areaPerim: 'mc.area-perimeter.confuses-area-with-perimeter',
  timesTwo: 'mc.exponents-roots.power-as-base-times-exponent',
  bundle: 'mc.place-value.bundle-counted-as-one',
  addLengths: 'mc.right-triangles-trig.adds-lengths-not-squares',
  afterEquals: 'mc.equal-sign.answer-must-come-after-equals',
  triArea: 'mc.right-triangles-trig.theorem-about-triangle-area',
  noRight: 'mc.right-triangles-trig.pythagorean-without-right-angle',
  halfRoot: 'mc.exponents-roots.root-as-dividing-by-index',
  onlyWhole: 'mc.exponents-roots.only-whole-lengths-exact',
  squaresBounds: 'mc.exponents-roots.squares-as-root-bounds',
  neighbors: 'mc.exponents-roots.wrong-neighboring-squares',
  unknownHyp: 'mc.right-triangles-trig.unknown-always-hypotenuse',
  knownLegHyp: 'mc.right-triangles-trig.known-leg-as-hypotenuse',
  noRoot: 'mc.exponents-roots.stops-before-taking-root',
  legAdds: 'mc.right-triangles-trig.missing-leg-adds-squares',
  legReversed: 'mc.right-triangles-trig.missing-leg-subtraction-reversed',
  partByPart: 'mc.expressions.multiplies-sums-part-by-part',
  rootUnsquared: 'mc.right-triangles-trig.roots-sum-of-unsquared-components',
  roundWhole: 'mc.ratio-rate.whole-number-rates-factors-only',
  roleSwap: 'mc.right-triangles-trig.context-role-swap',
  wholeNotHalf: 'mc.right-triangles-trig.whole-instead-of-half',
  unconverted: 'mc.measurement-units.arithmetic-on-unconverted-unit-numerals',
  unitDim: 'mc.measurement-units.wrong-unit-dimension',
  looksRight: 'mc.reasoning-language.accepts-answer-that-looks-right',
  repeatSteps: 'mc.reasoning-language.check-by-repeating-same-steps',
  calcTrust: 'mc.estimation.trusts-calculator-display',
  boundsOnly: 'mc.statistics.mean-check-by-bounds-only',
  roundGap: 'mc.estimation.rounding-gap-treated-as-error',
  examples: 'mc.reasoning-language.examples-as-proof',
  looksSquare: 'mc.geometric-proof.diagram-appearance-as-given',
  noClaim: 'mc.geometric-proof.work-without-stated-claim',
} as const;

// ---------- text helpers ----------
const A = (s: string | number) => `<b class="a">${s}</b>`;
const B = (s: string | number) => `<b class="b">${s}</b>`;
const S = (s: string | number) => `<b class="s">${s}</b>`;
const I = (s: string) => `<i>${s}</i>`;
const sq = (s: string | number) => `${s}<sup>2</sup>`;
type Unit = 'in' | 'ft' | 'yd';
const UNITS: readonly Unit[] = ['in', 'ft', 'yd'];
const WORD: Record<Unit, string> = { in: 'inches', ft: 'feet', yd: 'yards' };
const SQU = (u: Unit) => `sq ${u}`;
/** a number as text: whole, or up to 2 decimals */
export const fmt = (v: number): string => String(Math.round(v * 100) / 100);
/** a tenth as text, always one decimal (17.0) */
const tenth = (v: number): string => round1(v).toFixed(1);
const tu = (v: number | string, u: Unit) => `${v}\\text{ ${u}}`;
const near = (a: number, b: number) => Math.abs(a - b) < 1e-6;

interface Opt { t: string; ok?: boolean; mc?: string; say: string }
/** a choice item: the options are shuffled; exactly one is right */
function choiceItem(R: () => number, base: Omit<PyItem, 'input' | 'choices' | 'answer' | 'check'>, opts: Opt[]): PyItem {
  // an option whose text repeats an earlier one is dropped (a slip that happens to give the same text)
  const kept: Opt[] = [];
  for (const x of [...opts.filter(y => y.ok), ...opts.filter(y => !y.ok)]) if (!kept.some(k => k.t === x.t)) kept.push(x);
  const o = shuffle(R, kept);
  const right = o.findIndex(x => x.ok);
  if (right < 0 || o.filter(x => x.ok).length !== 1) throw new Error(`${base.family}: exactly one right option`);
  return {
    ...base, input: 'choice', choices: o.map(x => x.t), answer: { kind: 'choice', i: right }, solution: endOnChoice(base.solution, o[right]!.t),
    check: (r: Response): Verdict => {
      if (r.kind !== 'choice') return { ok: false, say: 'Pick one of the options.' };
      const x = o[r.i];
      if (!x) return { ok: false, say: 'Pick one of the options.' };
      return x.ok ? { ok: true, say: x.say } : { ok: false, mc: x.mc, say: x.say };
    },
  };
}
interface Slip { v: number; mc?: string; say: string }
/** a number item: exact (or to the tenth); known slips are classified, in order */
function numItem(base: Omit<PyItem, 'input' | 'answer' | 'check'>, ans: number, okSay: string, slips: Slip[], other: string): PyItem {
  return {
    ...base, input: 'num', answer: { kind: 'num', v: ans },
    check: (r: Response): Verdict => {
      if (r.kind !== 'num' || !Number.isFinite(r.v)) return { ok: false, say: 'Type a number.' };
      if (near(r.v, ans)) return { ok: true, say: okSay };
      const s = slips.find(x => !near(x.v, ans) && near(x.v, r.v));
      return s ? { ok: false, mc: s.mc, say: s.say } : { ok: false, say: other };
    },
  };
}

// ---------- triangle shapes for pictures ----------
type Pose = 'q0' | 'q1' | 'q2' | 'q3' | 'f0' | 'f1' | 'f2' | 'f3' | 'apex';
const POSES: readonly Pose[] = ['q0', 'q1', 'q2', 'q3', 'f0', 'f1', 'f2', 'f3', 'apex'];
/** the drawn legs (ratio kept between 0.42 and 2.4 so a picture never gets needle-thin; labels carry the numbers) */
function drawn(a: number, b: number): [number, number] {
  let r = a / b;
  r = Math.min(2.4, Math.max(0.42, r));
  return r >= 1 ? [5, 5 / r] : [5 * r, 5];
}
/** [R, A, B] of a right triangle with legs a (R–A) and b (R–B), in a pose */
export function posed(a: number, b: number, pose: Pose): [Pt, Pt, Pt] {
  if (pose === 'apex') {
    // the hypotenuse lies flat at the bottom, the right angle on top
    const P = rightPts(a, b);
    const ang = Math.atan2(P[2][1] - P[1][1], P[2][0] - P[1][0]);
    const rot = (p: Pt): Pt => [p[0] * Math.cos(-ang) - p[1] * Math.sin(-ang), p[0] * Math.sin(-ang) + p[1] * Math.cos(-ang)];
    let Q = P.map(rot) as [Pt, Pt, Pt];
    if (Q[0][1] < Q[1][1]) Q = Q.map(p => [-p[0], -p[1]] as Pt) as [Pt, Pt, Pt];
    return Q;
  }
  return rightPts(a, b, { rot: Number(pose[1]) as 0 | 1 | 2 | 3, flip: pose[0] === 'f' });
}
const legPic = (a: number, b: number, pose: Pose, labels: Partial<Record<SideId, string>>, extra: Partial<TriPic> = {}): TriPic => {
  const [da, db] = drawn(a, b);
  return { kind: 'tri', pts: posed(da, db, pose), right: true, labels, squares: ['a', 'b', 'c'], ...extra };
};
const triple = (R: () => number, max = 25): [number, number, number] => pick(R, TRIPLES.filter(t => t[2] <= max)) as [number, number, number];

// ===================== 1. name-legs-hypotenuse =====================
const VSETS: readonly [string, string, string][] = [['P', 'Q', 'R'], ['D', 'E', 'F'], ['J', 'K', 'L'], ['X', 'Y', 'Z'], ['M', 'N', 'T'], ['G', 'H', 'K'], ['S', 'U', 'V'], ['A', 'B', 'C']];
const findHyp: Gen = (R, n) => {
  const vs = shuffle(R, [...pick(R, VSETS)]) as [string, string, string];   // vs[0] = the right angle
  const [a, b] = pick(R, [[3, 4], [4, 3], [2, 5], [5, 3], [3, 3], [5, 2], [4, 6]] as const);
  const pose = pick(R, POSES);
  const nm = (x: string, y: string) => [x, y].sort().join('');
  const hyp = nm(vs[1], vs[2]), l1 = nm(vs[0], vs[1]), l2 = nm(vs[0], vs[2]);
  const tri = [...vs].sort().join('');
  const legSay = (l: string) => `The hypotenuse is the side ACROSS from the right angle. The square corner is at ${vs[0]}, and ${l} touches it, so it is a leg.`;
  return choiceItem(R, {
    id: `findHyp-${n}`, family: 'findHyp',
    prompt: `Triangle ${tri} has its right angle at ${vs[0]} (marked). Which side is the hypotenuse?`,
    board: `\\text{hypotenuse} = \\,?`,
    picture: { pic: { kind: 'tri', pts: posed(a, b, pose), right: true, verts: vs } },
    solution: [`The square corner (the right angle) is at ${vs[0]}.`, `The hypotenuse is the side across from it, the one that does not touch ${vs[0]}: ${S(hyp)}.`, `${l1} and ${l2} make the right angle: they are the legs.`],
  }, [
    { t: hyp, ok: true, say: `Yes: ${hyp} is across from the right angle at ${vs[0]}.` },
    { t: l1, mc: MC.visual, say: legSay(l1) },
    { t: l2, mc: MC.visual, say: legSay(l2) },
  ]);
};
const LETTERS: readonly [string, string, string][] = [['a', 'b', 'c'], ['x', 'y', 'z'], ['p', 'q', 'r'], ['r', 's', 't'], ['d', 'e', 'f'], ['k', 'm', 'n']];
const letterC: Gen = (R, n) => {
  const set = pick(R, LETTERS);
  // which letter sits on the hypotenuse: for a, b, c it is often NOT c (the trap)
  const L = shuffle(R, [...set]) as [string, string, string];   // L[0] on side a, L[1] on side b, L[2] on side c
  if (set[2] === 'c' && L[2] === 'c' && R() < 0.6) { const j = R() < 0.5 ? 0 : 1; [L[j], L[2]] = [L[2], L[j]]; }
  const vs = shuffle(R, [...pick(R, VSETS)]) as [string, string, string];
  const [a, b] = pick(R, [[3, 4], [4, 3], [2, 5], [5, 3], [4, 6]] as const);
  const hyp = L[2];
  const opts: Opt[] = [{ t: I(hyp), ok: true, say: `Yes: ${I(hyp)} is across from the right angle, whatever its letter is.` }];
  for (const x of [L[0], L[1]]) opts.push(x === 'c'
    ? { t: I(x), mc: MC.hypC, say: `The letter ${I('c')} is often used for the hypotenuse, but here it is on a leg: it touches the right angle. Find the side across from the square corner.` }
    : { t: I(x), mc: MC.visual, say: `${I(x)} touches the right angle, so it is a leg. The hypotenuse is across from the square corner.` });
  return choiceItem(R, {
    id: `letterC-${n}`, family: 'letterC',
    prompt: `In triangle ${[...vs].sort().join('')} the right angle is at ${vs[0]}. The sides are labeled ${I(set[0])}, ${I(set[1])} and ${I(set[2])}. Which letter names the hypotenuse?`,
    board: `${set[0]},\\ ${set[1]},\\ ${set[2]}\\,?`,
    picture: { pic: { kind: 'tri', pts: posed(a, b, pick(R, POSES)), right: true, verts: vs, labels: { a: L[0], b: L[1], c: L[2] } } },
    solution: [`The right angle is at ${vs[0]}.`, `The side across from it is labeled ${S(I(hyp))}: that is the hypotenuse.`, `A letter does not decide it: the right angle does.`],
  }, opts);
};

// ===================== 2. square-area-labels =====================
const squareArea: Gen = (R, n) => {
  const grid = R() < 0.5;
  if (grid) {
    const [a, b, c] = pick(R, [[3, 4, 5], [6, 8, 10]] as const);
    const u = pick(R, ['in', 'ft'] as const);
    const s: SideId = pick(R, ['a', 'b', 'c'] as const), len = { a, b, c }[s];
    const labels: Partial<Record<SideId, string>> = { a: tu(a, u), b: tu(b, u), c: tu(c, u) };
    return numItem({
      id: `squareArea-${n}`, family: 'squareArea', unit: SQU(u),
      prompt: `A square is drawn on the ${len} ${u} side of this right triangle (each grid square is 1 ${u} long). What is the area of that square?`,
      board: `\\text{area} = \\,?`,
      picture: { pic: { kind: 'tri', pts: rightPts(a, b), right: true, grid: true, labels, squares: [s], areas: { [s]: '?' }, now: true } },
      steps: [`${len}^2 = ${len} \\times ${len} = ${len * len}`],
      solution: [`A square on a ${len} ${u} side is ${len} by ${len}.`, `Its area is ${len} × ${len} = ${S(len * len)} ${SQU(u)}: the side, squared.`],
    }, len * len, `Yes: ${len} × ${len} = ${len * len} ${SQU(u)}.`, [
      { v: 2 * len, mc: MC.timesTwo, say: `${len}<sup>2</sup> means ${len} × ${len}, not ${len} × 2.` },
      { v: 4 * len, mc: MC.areaPerim, say: `${4 * len} ${u} is the distance around the square. The area counts the 1 ${u} squares inside: ${len} rows of ${len}.` },
    ], `Count the rows: ${len} rows of ${len} small squares.`);
  }
  const L = pick(R, ['a', 'b', 'c', 'x', 'h', 'k'] as const), len = int(R, 2, 25), u = pick(R, UNITS);
  return numItem({
    id: `squareArea-${n}`, family: 'squareArea', unit: SQU(u),
    prompt: `Side ${I(L)} of a right triangle is ${len} ${WORD[u]} long. What is the area of the square drawn on side ${I(L)}?`,
    board: `${L} = ${len},\\ \\ ${L}^2 = \\,?`,
    steps: [`${L}^2 = ${len} \\times ${len} = ${len * len}`],
    solution: [`The square on side ${I(L)} is ${len} by ${len}.`, `Its area is ${sq(I(L))} = ${len} × ${len} = ${S(len * len)} ${SQU(u)}.`],
  }, len * len, `Yes: ${sq(I(L))} = ${len} × ${len} = ${len * len} ${SQU(u)}.`, [
    { v: 2 * len, mc: MC.timesTwo, say: `${sq(len)} means ${len} × ${len}, not ${len} × 2.` },
    { v: 4 * len, mc: MC.areaPerim, say: `${4 * len} is the distance around the square. The area is ${len} × ${len}.` },
  ], `Multiply the side by itself: ${len} × ${len}.`);
};
const areaUnit: Gen = (R, n) => {
  const len = pick(R, [3, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]), u = pick(R, UNITS);
  return choiceItem(R, {
    id: `areaUnit-${n}`, family: 'areaUnit',
    picture: { pic: { kind: 'tri', pts: posed(...drawn(len, Math.round(len * 1.4)), pick(R, POSES)), right: true, labels: { a: tu(len, u) }, squares: ['a'], areas: { a: '?' }, now: true } },
    prompt: `One side of a right triangle is ${len} ${WORD[u]}. What is the area of the square drawn on that side?`,
    board: `${tu(len, u)}\\ \\to\\ \\text{area} = \\,?`,
    solution: [`The square is ${len} ${u} by ${len} ${u}.`, `Area = ${len} × ${len} = ${S(`${len * len} ${SQU(u)}`)}: an area is counted in square units.`],
  }, [
    { t: `${len * len} ${SQU(u)}`, ok: true, say: `Yes: ${len} × ${len} = ${len * len}, in square ${WORD[u]}.` },
    { t: `${len * len} ${u}`, mc: MC.unitDim, say: `The number is right, but an area is in square units: ${SQU(u)}.` },
    { t: `${2 * len} ${SQU(u)}`, mc: MC.timesTwo, say: `${sq(len)} is ${len} × ${len}, not ${len} × 2.` },
    { t: `${4 * len} ${SQU(u)}`, mc: MC.areaPerim, say: `${4 * len} ${u} is the distance around the square, not its area.` },
  ]);
};

// ===================== 3. tilted-square-area =====================
const STEPS: readonly [number, number][] = [[1, 1], [1, 2], [2, 1], [1, 3], [3, 1], [2, 3], [3, 2], [3, 4], [4, 3]];
const GRIDU = ['1 inch', '1 foot', '1 unit'] as const;
const tiltedF: Gen = (R, n) => {
  const [p, q] = pick(R, STEPS), T = tilted(p, q), g = pick(R, GRIDU);
  const unit = g === '1 inch' ? 'sq in' : g === '1 foot' ? 'sq ft' : 'square units';
  const nCorner = T.corner;
  return numItem({
    id: `tilted-${n}`, family: 'tilted', unit,
    prompt: `Each grid square is ${g} on a side. Each side of the tilted square goes ${p} across and ${q} up. What is the area of the tilted square?`,
    board: `\\text{area} = \\,?`,
    picture: { pic: { kind: 'tilt', p, q } },
    steps: [`${T.n} \\times ${T.n} = ${T.surround}`, `4 \\times ${fmt(nCorner)} = ${fmt(4 * nCorner)}`, `${T.surround} - ${fmt(4 * nCorner)} = ${T.area}`],
    solution: [`Draw the upright square around it: ${T.n} by ${T.n} = ${T.surround}.`, `Take away the 4 corner triangles. Each is half of a ${p} by ${q} rectangle: ${fmt(nCorner)}.`, `${T.surround} − 4 × ${fmt(nCorner)} = ${S(T.area)} ${unit}.`],
  }, T.area, `Yes: ${T.surround} − 4 × ${fmt(nCorner)} = ${T.area}.`, [
    { v: T.touched, mc: MC.bundle, say: `${T.touched} counts every grid square the tilted square touches as a whole one, but many are only partly inside. Surround it and subtract the corners instead.` },
    { v: p + q, mc: MC.addLengths, say: `${p} + ${q} = ${p + q} adds the steps of one side. The area is a whole square: surround it, then take away the corners.` },
    { v: T.surround, say: `${T.surround} is the upright square around it. Now take away the 4 corner triangles.` },
    { v: T.surround - 4 * p * q, say: `Each corner triangle is HALF of a ${p} by ${q} rectangle: ${fmt(nCorner)}, not ${p * q}.` },
  ], `Surround it with an upright square, then take away the 4 corner triangles.`);
};
const surroundCalc: Gen = (R, n) => {
  const [p, q] = pick(R, STEPS.filter(s => s[0] !== s[1])), T = tilted(p, q), g = pick(R, GRIDU);
  return choiceItem(R, {
    id: `surroundCalc-${n}`, family: 'surroundCalc',
    prompt: `A tilted square on grid paper (each grid square is ${g} on a side): each side goes ${p} across and ${q} up. Which calculation gives its area?`,
    board: `\\text{area} = \\,?`,
    picture: { pic: { kind: 'tilt', p, q, corners: true } },
    steps: [`${T.n}^2 - 4 \\times ${fmt(T.corner)} = ${T.area}`],
    solution: [`The upright square around it is ${T.n} by ${T.n}: ${T.surround}.`, `The 4 corner triangles are each half of ${p} × ${q}: ${fmt(T.corner)}.`, `${T.surround} − 4 × ${fmt(T.corner)} = ${S(T.area)}.`],
  }, [
    { t: `${T.n} × ${T.n} − 4 × ${fmt(T.corner)} = ${T.area}`, ok: true, say: `Yes: the surrounding square minus the 4 corner triangles.` },
    { t: `${T.n} × ${T.n} = ${T.surround}`, say: `That is the whole upright square. The 4 corner triangles are outside the tilted square: take them away.` },
    { t: `${T.n} × ${T.n} − 4 × ${p * q} = ${T.surround - 4 * p * q}`, say: `A corner triangle is half of a ${p} by ${q} rectangle: ${fmt(T.corner)}, not ${p * q}.` },
    { t: `${p} + ${q} = ${p + q}`, mc: MC.addLengths, say: `${p} + ${q} adds the steps along one side. The area is the whole tilted square.` },
  ]);
};

// ===================== 4. area-relation-right =====================
const missingArea: Gen = (R, n) => {
  const useTriple = R() < 0.7;
  let a: number, b: number;
  if (useTriple) { const t = triple(R); const k = R() < 0.5; a = k ? t[0] : t[1]; b = k ? t[1] : t[0]; }
  else { a = int(R, 2, 6); b = int(R, 2, 7); if (a === b) b = a + 1; }
  const A2 = a * a, B2 = b * b, C2 = A2 + B2;
  const miss: SideId = R() < 0.55 ? 'c' : R() < 0.5 ? 'a' : 'b';
  const areas: Record<SideId, string> = { a: String(A2), b: String(B2), c: String(C2) };
  areas[miss] = '?';
  const ans = { a: A2, b: B2, c: C2 }[miss];
  const known = miss === 'c' ? `${A(A2)} and ${B(B2)}` : miss === 'a' ? `${B(B2)} and ${S(C2)}` : `${A(A2)} and ${S(C2)}`;
  const board = miss === 'c' ? `\\cssId{a}{${A2}} + \\cssId{b}{${B2}} = \\cssId{c}{?}` : miss === 'a' ? `\\cssId{a}{?} + \\cssId{b}{${B2}} = \\cssId{c}{${C2}}` : `\\cssId{a}{${A2}} + \\cssId{b}{?} = \\cssId{c}{${C2}}`;
  const other = miss === 'c' ? 0 : miss === 'a' ? B2 : A2;
  return numItem({
    id: `missingArea-${n}`, family: 'missingArea', unit: 'square units',
    prompt: `Squares are drawn on the sides of a right triangle. Two of them have areas ${known} square units. What is the area of the square marked ?`,
    board,
    picture: { pic: legPic(a, b, pick(R, POSES), {}, { areas, now: true }) },
    steps: miss === 'c' ? [`${A2} + ${B2} = ${C2}`] : [`? = ${C2} - ${other} = ${ans}`],
    solution: miss === 'c'
      ? [`The two leg squares together cover the square on the hypotenuse.`, `${A2} + ${B2} = ${S(C2)} square units.`]
      : [`The two leg squares together make the hypotenuse square: ? + ${other} = ${C2}.`, `So ? = ${C2} − ${other} = ${S(ans)} square units.`],
  }, ans, miss === 'c' ? `Yes: ${A2} + ${B2} = ${C2}.` : `Yes: ${C2} − ${other} = ${ans}.`, miss === 'c' ? [
    { v: B2 - A2, say: `The hypotenuse square is the BIGGEST one: the two leg squares add up to it. ${A2} + ${B2} = ?` },
    { v: a + b, mc: MC.addLengths, say: `${a + b} adds the side lengths. The relation is about the AREAS of the squares: ${A2} + ${B2}.` },
  ] : [
    { v: C2 + other, mc: MC.legAdds, say: `The hypotenuse square is the biggest, so the missing leg square is SMALLER: ${C2} − ${other}.` },
  ], `The two smaller squares together make the biggest square.`);
};
const eqTrue: Gen = (R, n) => {
  const t = triple(R), [a, b, c] = t, A2 = a * a, B2 = b * b, C2 = c * c;
  const form = int(R, 0, 3);
  const wrongC = C2 + pick(R, [-2, -1, 1, 2, 5]) * (R() < 0.5 ? 1 : 2);
  const isTrue = form !== 3;
  const shown = form === 0 ? `${C2} = ${A2} + ${B2}` : form === 1 ? `${A2} + ${B2} = ${C2}` : form === 2 ? `${C2} = ${B2} + ${A2}` : `${wrongC} = ${A2} + ${B2}`;

  const opts: Opt[] = isTrue ? [
    { t: `True: both sides are ${C2}.`, ok: true, say: `Yes: = says both sides have the same value. ${A2} + ${B2} is ${C2}.` },
    { t: form === 1 ? `False: ${A2} + ${B2} is not ${C2}.` : `False: the sum must come before the =.`, mc: form === 1 ? undefined : MC.afterEquals, say: form === 1 ? `Add again: ${A2} + ${B2} = ${C2}.` : `The = sign does not mean "the answer comes next". It says both sides are the same amount: ${C2} and ${A2} + ${B2} are both ${C2}.` },
    { t: `False: ${C2} is a hypotenuse, not a sum.`, say: `${C2} is the AREA of the hypotenuse square, and it does equal the two leg squares together.` },
  ] : [
    { t: `False: ${A2} + ${B2} = ${C2}, not ${wrongC}.`, ok: true, say: `Yes: the two sides have different values, so it is false.` },
    { t: `True: the sum is on the right, so it fits.`, mc: MC.afterEquals, say: `Where the sum stands does not matter. What matters: is ${wrongC} the same as ${A2} + ${B2}? It is ${C2}, so no.` },
    { t: `False: the answer must come after the =.`, mc: MC.afterEquals, say: `An answer can stand on either side of =. This one is false because ${A2} + ${B2} = ${C2}, not ${wrongC}.` },
  ];
  return choiceItem(R, {
    id: `eqTrue-${n}`, family: 'eqTrue',
    picture: { pic: legPic(a, b, pick(R, POSES), {}, { areas: { a: String(A2), b: String(B2), c: String(C2) }, now: true }) },
    prompt: `The squares on the legs of a right triangle have areas ${A(A2)} and ${B(B2)}. True or false: ${shown}?`,
    board: shown,
    solution: [`= means both sides have the same value.`, `${A2} + ${B2} = ${C2}.`, isTrue ? `Both sides are ${C2}: ${S('true')}.` : `${wrongC} is not ${C2}: ${S('false')}.`],
  }, opts);
};
const meaning: Gen = (R, n) => {
  const t = triple(R), k = R() < 0.5, a = k ? t[0] : t[1], b = k ? t[1] : t[0], c = t[2], u = pick(R, UNITS);
  return choiceItem(R, {
    id: `meaning-${n}`, family: 'meaning',
    prompt: `A right triangle has legs ${A(`${a} ${u}`)} and ${B(`${b} ${u}`)} and hypotenuse ${S(`${c} ${u}`)}. What does ${a * a} + ${b * b} = ${c * c} say?`,
    board: `\\cssId{a}{${a}^2} + \\cssId{b}{${b}^2} = \\cssId{c}{${c}^2}`,
    picture: { pic: legPic(a, b, pick(R, POSES), { a: tu(a, u), b: tu(b, u), c: tu(c, u) }) },
    solution: [`${sq(a)} = ${a * a} is the area of the square on the ${a} ${u} leg, ${sq(b)} = ${b * b} on the other leg.`, `Together they have the same area as the square on the hypotenuse: ${S(`${c * c} ${SQU(u)}`)}.`],
  }, [
    { t: `The squares on the two legs together have the same area as the square on the hypotenuse.`, ok: true, say: `Yes: ${a * a} + ${b * b} = ${c * c} square ${WORD[u]}, three squares, one relation.` },
    { t: `The triangle has an area of ${c * c} ${SQU(u)}.`, mc: MC.triArea, say: `${c * c} is the area of the SQUARE on the hypotenuse. The triangle itself is only ${fmt(a * b / 2)} ${SQU(u)}.` },
    { t: `The legs, ${a} ${u} and ${b} ${u}, add up to the hypotenuse.`, mc: MC.addLengths, say: `${a} + ${b} = ${a + b}, not ${c}. The relation adds the SQUARES of the sides, not the sides.` },
  ]);
};

// ===================== 5. relation-fails-nonright =====================
/** grid triangles [R, A, B] with their kind (right / acute / obtuse); the squares stay readable */
const GRID_TRIS: readonly [Pt, Pt, Pt][] = [
  [[0, 0], [0, 3], [4, 0]], [[0, 0], [0, 4], [3, 0]], [[0, 0], [0, 2], [4, 0]], [[0, 0], [0, 3], [3, 0]],
  [[1, 3], [0, 0], [4, 0]], [[2, 3], [0, 0], [4, 0]], [[1, 4], [0, 0], [4, 0]], [[3, 3], [0, 0], [5, 0]],
  [[-1, 2], [0, 0], [4, 0]], [[-2, 2], [0, 0], [3, 0]], [[-1, 3], [0, 0], [3, 0]], [[-2, 3], [0, 0], [3, 0]], [[5, 2], [0, 0], [3, 0]],
];
const nonRight: Gen = (R, n) => {
  const eq = R() < 0.2;
  let pts: [Pt, Pt, Pt], kind: 'right' | 'acute' | 'obtuse' | 'equilateral', sq3: [number, number, number], grid = true;
  if (eq) { const s = int(R, 3, 6); pts = [[s / 2, s * Math.sqrt(3) / 2], [0, 0], [s, 0]]; kind = 'equilateral'; sq3 = [s * s, s * s, s * s]; grid = false; }
  else {
    const T0 = pick(R, GRID_TRIS);
    pts = T0;
    kind = triKind(T0);
    sq3 = [sideLen2(T0[0], T0[1]), sideLen2(T0[0], T0[2]), sideLen2(T0[1], T0[2])];
  }
  // order the squares: the largest one is "the biggest square"; label the sides a, b, c by size so c is the largest
  const ids: SideId[] = ['a', 'b', 'c'];
  const order = [0, 1, 2].sort((i, j) => sq3[i]! - sq3[j]!);
  const big = sq3[order[2]!]!, s1 = sq3[order[0]!]!, s2 = sq3[order[1]!]!;
  const areas: Partial<Record<SideId, string>> = {};
  ids.forEach((id, i) => { areas[id] = String(sq3[i]); });
  const kindWord = kind === 'right' ? 'has a right angle (marked)' : kind === 'equilateral' ? `is equilateral: all three sides are equal and every angle is 60°` : kind === 'acute' ? 'has no right angle: every angle is less than 90°' : 'has no right angle: one angle is more than 90°';
  const sum = s1 + s2;
  const opts: Opt[] = kind === 'right' ? [
    { t: `Yes: ${s1} + ${s2} = ${big}. It is a right triangle.`, ok: true, say: `Yes: with a right angle, the two leg squares always add up to the hypotenuse square.` },
    { t: `No: only a 3, 4, 5 triangle works.`, say: `Every right triangle works: ${s1} + ${s2} = ${big} here.` },
    { t: `No: you can never tell without measuring.`, say: `It has a right angle, so the relation holds: ${s1} + ${s2} = ${big}.` },
  ] : [
    { t: `No: ${s1} + ${s2} = ${sum}, not ${big}. It is not a right triangle.`, ok: true, say: `Yes: without a right angle there is no reason for the squares to match, and here they do not.` },
    { t: `Yes: the two smaller squares always add up to the biggest.`, mc: MC.noRight, say: `Only with a right angle. Here ${s1} + ${s2} = ${sum}, and the biggest square is ${big}.` },
    { t: `Yes: the longest side is a hypotenuse, so it works.`, mc: MC.noRight, say: `A hypotenuse is across from a RIGHT angle, and this triangle has none. ${s1} + ${s2} = ${sum}, not ${big}.` },
  ];
  return choiceItem(R, {
    id: `nonRight-${n}`, family: 'nonRight',
    prompt: `This triangle ${kindWord}. Its squares have areas ${s1}, ${s2} and ${big}. Do the two smaller squares add up to the biggest one?`,
    board: `${s1} + ${s2} \\;\\overset{?}{=}\\; ${big}`,
    picture: { pic: { kind: 'tri', pts, right: kind === 'right', grid, squares: ['a', 'b', 'c'], areas, now: true } },
    solution: [`Add the two smaller squares: ${s1} + ${s2} = ${sum}.`, sum === big ? `That is the biggest square, ${S(big)}: it is a right triangle.` : `The biggest square is ${big}, not ${sum}. The relation is only sure for a ${S('right')} triangle.`],
  }, opts);
};
const rightFirst: Gen = (R, n) => {
  const v = int(R, 0, 2);
  if (v === 0) {
    const s = int(R, 3, 12);
    return choiceItem(R, {
      id: `rightFirst-${n}`, family: 'rightFirst',
      picture: { pic: { kind: 'tri', pts: [[s / 2, (s * Math.sqrt(3)) / 2], [0, 0], [s, 0]], right: false, labels: { a: tu(s, 'in'), b: tu(s, 'in'), c: tu(s, 'in') } } },
      prompt: `Every side of an equilateral triangle is ${s} in, and every angle is 60°. Kai uses ${sq(s)} + ${sq(s)} = ${sq(I('c'))} and says the third side is ${rootHtml(2 * s * s)} in. Is Kai right?`,
      board: `${s}^2 + ${s}^2 = c^2\\ ?`,
      solution: [`a² + b² = c² is only sure when the triangle has a right angle.`, `This triangle has three 60° angles, so it does not apply. Every side is ${S(`${s} in`)}.`],
    }, [
      { t: `No: there is no right angle, so a² + b² = c² does not apply. Every side is ${s} in.`, ok: true, say: `Yes: check for the right angle first.` },
      { t: `Yes: a² + b² = c² works for every triangle.`, mc: MC.noRight, say: `Only for right triangles. Here every side is ${s} in, and ${rootHtml(2 * s * s)} is not ${s}.` },
      { t: `Yes: any side can be called the hypotenuse.`, mc: MC.noRight, say: `A hypotenuse is across from a right angle, and this triangle has none.` },
    ]);
  }
  const [x, y] = [int(R, 3, 9), int(R, 4, 12)], ang = v === 1 ? int(R, 95, 140) : int(R, 50, 85);
  const words = `two sides of ${x} ft and ${y} ft with an angle of ${ang}° between them`;
  return choiceItem(R, {
    id: `rightFirst-${n}`, family: 'rightFirst',
    picture: { pic: { kind: 'tri', pts: [[0, 0], [x * Math.cos((ang * Math.PI) / 180), x * Math.sin((ang * Math.PI) / 180)], [y, 0]], right: false, labels: { a: tu(x, 'ft'), b: tu(y, 'ft'), c: '?' } } },
    prompt: `A triangle has ${words}. Can you find the third side with a² + b² = c²?`,
    board: `\\angle = ${ang}^{\\circ}`,
    solution: [`a² + b² = c² needs a right angle: 90° exactly.`, `${ang}° is not 90°, so ${S('no')}: the relation is not sure here.`],
  }, [
    { t: `No: the angle between them is ${ang}°, not 90°.`, ok: true, say: `Yes: the relation needs a right angle between the two legs.` },
    { t: `Yes: it works for any two sides of a triangle.`, mc: MC.noRight, say: `Only when the angle between them is 90°. Here it is ${ang}°.` },
    { t: `Yes: if ${ang}° is close enough to 90°.`, mc: MC.noRight, say: `Close is not enough: with ${ang}° the squares do not add up exactly.` },
  ]);
};

// ===================== 6. side-from-area =====================
const NONSQ = Array.from({ length: 624 }, (_, i) => i + 2).filter(x => !isSquare(x) && x !== 4 && x !== 16);
const exactSide: Gen = (R, n) => {
  const warm = R() < 0.2, tiltedA = !warm && R() < 0.4;
  const Ar = warm ? pick(R, [25, 36, 49, 64, 81, 100, 121, 144, 169, 196, 225]) : tiltedA ? pick(R, [2, 5, 10, 13]) : pick(R, NONSQ);
  const u = pick(R, ['in', 'ft'] as const);
  const side = isSquare(Ar) ? `${isqrt(Ar)} ${u}` : `${rootHtml(Ar)} ${u}`;
  const opts: Opt[] = [
    { t: side, ok: true, say: isSquare(Ar) ? `Yes: ${isqrt(Ar)} × ${isqrt(Ar)} = ${Ar}.` : `Yes: ${rootHtml(Ar)} is the exact number that times itself makes ${Ar}.` },
    { t: `${fmt(Ar / 2)} ${u}`, mc: MC.halfRoot, say: `${fmt(Ar / 2)} is half of ${Ar}. A square root is not half: it is the number that times itself makes ${Ar}.` },
    { t: `${fmt(Ar / 4)} ${u}`, mc: MC.areaPerim, say: `${Ar} ÷ 4 shares ${Ar} among 4 sides, as if ${Ar} were the distance around. ${Ar} is the AREA.` },
  ];
  if (!isSquare(Ar)) opts.push({ t: `It has no exact length.`, mc: MC.onlyWhole, say: `${rootHtml(Ar)} ${u} IS exact: it is the number whose square is ${Ar}. Only its decimal goes on forever.` });
  const pic: Pic | undefined = tiltedA ? (() => { const st = { 2: [1, 1], 5: [1, 2], 10: [1, 3], 13: [2, 3] }[Ar as 2 | 5 | 10 | 13]!; return { kind: 'tilt', p: st[0]!, q: st[1]! } as TiltPic; })() : undefined;
  return choiceItem(R, {
    id: `exactSide-${n}`, family: 'exactSide',
    prompt: `${tiltedA ? 'This tilted square' : 'A square'} has an area of ${Ar} ${SQU(u)}. How long is one side, exactly?`,
    board: `\\text{area} = ${Ar}:\\ \\text{side} = \\,?`,
    picture: { pic: pic ?? sqPic(Ar, SQU(u)) },
    solution: isSquare(Ar)
      ? [`The side times itself makes the area.`, `${isqrt(Ar)} × ${isqrt(Ar)} = ${Ar}, so the side is ${S(side)}.`]
      : [`The side times itself must make ${Ar}.`, `No whole number does, so the side is written exactly as ${S(side)}.`],
  }, opts);
};
const bracketRoot: Gen = (R, n) => {
  const Ar = pick(R, NONSQ.filter(x => x >= 3));
  const [k, k1] = bracket(Ar);
  return {
    id: `bracketRoot-${n}`, family: 'bracketRoot', input: 'pair',
    picture: { pic: sqPic(Ar, 'square units') },
    prompt: `A square has an area of ${Ar} square units. Its side is ${rootHtml(Ar)}. Between which two whole numbers in a row does it lie?`,
    board: `?\\ < \\sqrt{${Ar}} < \\ ?`,
    pairLead: `${rootHtml(Ar)} is between`, pairOp: 'and',
    answer: { kind: 'pair', x: k, y: k1 },
    steps: [`${k}^2 = ${k * k} < ${Ar} < ${k1 * k1} = ${k1}^2`, `${k} < \\sqrt{${Ar}} < ${k1}`],
    solution: [`Find the perfect squares around ${Ar}: ${k * k} = ${k} × ${k} and ${k1 * k1} = ${k1} × ${k1}.`, `${k * k} < ${Ar} < ${k1 * k1}, so the side is between ${S(k)} and ${S(k1)}.`],
    check: (r: Response): Verdict => {
      if (r.kind !== 'pair') return { ok: false, say: 'Fill in both boxes.' };
      if (r.x === k && r.y === k1) return { ok: true, say: `Yes: ${k * k} < ${Ar} < ${k1 * k1}, so ${k} < ${rootHtml(Ar)} < ${k1}.` };
      if (r.x === k1 && r.y === k) return { ok: false, say: `Those are the right numbers: write the smaller one first.` };
      if (r.x === k * k && r.y === k1 * k1) return { ok: false, mc: MC.squaresBounds, say: `${k * k} and ${k1 * k1} are the AREAS around ${Ar}. The sides are their roots: ${k} and ${k1}.` };
      if (r.x === Ar - 1 && r.y === Ar + 1) return { ok: false, mc: MC.neighbors, say: `${Ar - 1} and ${Ar + 1} are next to ${Ar}, but the side is much smaller. Which whole number times itself is just under ${Ar}?` };
      return { ok: false, say: `Which whole number times itself is just under ${Ar}, and which is just over?` };
    },
  };
};

// ===================== 7. write-equation =====================
const UNKNOWN = ['x', 'h', 'n', 'd', 'w'] as const;
const writeEq: Gen = (R, n) => {
  const [a, b, c] = triple(R);
  const pose = pick(R, POSES);
  const v = int(R, 0, 2);   // 0: unknown hypotenuse, 1: unknown leg, 2: letters with c on a leg
  if (v === 2) {
    // sides lettered: the hypotenuse is labeled a, the legs c (known) and b (unknown)
    const legKnown = a, hyp = c;   // the leg labeled c is `legKnown`, the hypotenuse labeled a is `hyp`
    const right = `${sq(legKnown)} + ${sq(I('b'))} = ${sq(hyp)}`;
    return choiceItem(R, {
      id: `writeEq-${n}`, family: 'writeEq',
      prompt: `The sides are labeled ${I('a')} = ${hyp}, ${I('b')} and ${I('c')} = ${legKnown}. The right angle is marked. Which equation fits?`,
      board: `a = ${hyp},\\ c = ${legKnown},\\ b = \\,?`,
      picture: { pic: { kind: 'tri', pts: posed(...drawn(legKnown, b), pose), right: true, labels: { a: `c = ${legKnown}`, b: 'b', c: `a = ${hyp}` } } },
      solution: [`The side across from the right angle is labeled ${I('a')}: it is the hypotenuse, ${hyp}.`, `The legs are ${I('c')} = ${legKnown} and ${I('b')}.`, `Legs squared, added, make the hypotenuse squared: ${S(right)}.`],
    }, [
      { t: right, ok: true, say: `Yes: the hypotenuse is across from the right angle, whatever letter it has.` },
      { t: `${sq(hyp)} + ${sq(I('b'))} = ${sq(legKnown)}`, mc: MC.hypC, say: `That puts ${I('c')} = ${legKnown} on the hypotenuse side because of its letter. But ${I('c')} touches the right angle here: it is a leg.` },
      { t: `${legKnown} + ${I('b')} = ${hyp}`, mc: MC.addLengths, say: `The relation adds the SQUARES of the legs, not the lengths.` },
    ]);
  }
  const x = pick(R, UNKNOWN);
  if (v === 0) {
    const right = `${sq(a)} + ${sq(b)} = ${sq(I(x))}`;
    return choiceItem(R, {
      id: `writeEq-${n}`, family: 'writeEq',
      prompt: `The sides are labeled ${a}, ${b} and ${I(x)}. Which equation fits?`,
      board: `${a},\\ ${b},\\ ${x}`,
      picture: { pic: { kind: 'tri', pts: posed(...drawn(a, b), pose), right: true, labels: { a: String(a), b: String(b), c: x } } },
      solution: [`${I(x)} is across from the right angle: it is the hypotenuse.`, `${a} and ${b} are the legs.`, `So ${S(right)}.`],
    }, [
      { t: right, ok: true, say: `Yes: ${I(x)} is across from the right angle, so ${sq(I(x))} stands alone.` },
      { t: `${sq(a)} + ${sq(I(x))} = ${sq(b)}`, mc: MC.knownLegHyp, say: `${b} touches the right angle: it is a leg, so ${sq(b)} cannot stand alone. The side across from the right angle is ${I(x)}.` },
      { t: `${a} + ${b} = ${I(x)}`, mc: MC.addLengths, say: `The relation adds the SQUARES of the legs, not the lengths.` },
    ]);
  }
  // unknown leg
  const known = R() < 0.5 ? a : b, other = known === a ? b : a;
  const right = `${sq(known)} + ${sq(I(x))} = ${sq(c)}`;
  return choiceItem(R, {
    id: `writeEq-${n}`, family: 'writeEq',
    prompt: `The sides are labeled ${known}, ${c} and ${I(x)}. Which equation fits?`,
    board: `${known},\\ ${c},\\ ${x}`,
    picture: { pic: { kind: 'tri', pts: posed(...drawn(known, other), pose), right: true, labels: { a: String(known), b: x, c: String(c) } } },
    solution: [`${c} is across from the right angle: it is the hypotenuse.`, `${known} and ${I(x)} are the legs.`, `So ${S(right)}.`],
  }, [
    { t: right, ok: true, say: `Yes: ${c} is across from the right angle, so ${sq(c)} stands alone.` },
    { t: `${sq(known)} + ${sq(c)} = ${sq(I(x))}`, mc: MC.unknownHyp, say: `The unknown is not always the hypotenuse. ${I(x)} touches the right angle here: it is a leg. The hypotenuse is ${c}.` },
    { t: `${known} + ${I(x)} = ${c}`, mc: MC.addLengths, say: `The relation adds the SQUARES of the legs, not the lengths.` },
  ]);
};

// ===================== 8. hypotenuse-whole / 9. missing-leg =====================
interface Solve { a: number; b: number; c: number; unknown: SideId; u: Unit; pose: Pose }
function solveItem(fam: FamilyId, n: number, s: Solve, R: () => number): PyItem {
  const { a, b, c, unknown: k, u, pose } = s;
  const lab: Partial<Record<SideId, string>> = { a: tu(a, u), b: tu(b, u), c: tu(c, u) };
  lab[k] = k === 'c' ? 'c' : k === 'a' ? 'a' : 'b';
  const pic = legPic(a, b, pose, lab, { areas: { a: String(a * a), b: String(b * b), c: String(c * c) } });
  if (k === 'c') {
    const C2 = hyp2(a, b);
    return numItem({
      id: `${fam}-${n}`, family: fam, unit: u,
      prompt: `The legs of a right triangle are ${A(`${a} ${u}`)} and ${B(`${b} ${u}`)}. How long is the hypotenuse?`,
      board: `c^2 = ${a}^2 + ${b}^2`,
      picture: { pic },
      steps: [`c^2 = ${a * a} + ${b * b} = ${C2}`, `c = \\sqrt{${C2}} = ${c}`],
      solution: [`Square the legs: ${sq(a)} = ${a * a}, ${sq(b)} = ${b * b}.`, `Add: ${sq(I('c'))} = ${a * a} + ${b * b} = ${C2}.`, `Take the square root: ${I('c')} = ${rootHtml(C2)} = ${S(`${c} ${u}`)}.`],
    }, c, `Yes: ${a * a} + ${b * b} = ${C2}, and ${c} × ${c} = ${C2}.`, [
      { v: a + b, mc: MC.addLengths, say: `${a} + ${b} walks along both legs. The hypotenuse is a shortcut, shorter than ${a + b}: square, add, then take the root.` },
      { v: C2, mc: MC.noRoot, say: `${C2} is ${sq(I('c'))}, the area of the hypotenuse square. The side is its square root.` },
      { v: 2 * a + 2 * b, mc: MC.timesTwo, say: `${sq(a)} means ${a} × ${a}, not ${a} × 2.` },
      { v: round1(Math.sqrt(2 * a + 2 * b)), mc: MC.timesTwo, say: `${sq(a)} means ${a} × ${a}, not ${a} × 2.` },
    ], `Square both legs, add, then take the square root.`);
  }
  const leg = k === 'a' ? a : b, kn = k === 'a' ? b : a;
  const L2 = leg2(c, kn), X = k;
  void R;
  return numItem({
    id: `${fam}-${n}`, family: fam, unit: u,
    prompt: `A right triangle has hypotenuse ${S(`${c} ${u}`)} and one leg ${k === 'a' ? B(`${kn} ${u}`) : A(`${kn} ${u}`)}. How long is the other leg?`,
    board: `${X}^2 + ${kn}^2 = ${c}^2`,
    picture: { pic },
    steps: [`${X}^2 = ${c * c} - ${kn * kn} = ${L2}`, `${X} = \\sqrt{${L2}} = ${leg}`],
    solution: [`The leg squares add up to the hypotenuse square: ${sq(I(X))} + ${kn * kn} = ${c * c}.`, `So ${sq(I(X))} = ${c * c} − ${kn * kn} = ${L2}.`, `${I(X)} = ${rootHtml(L2)} = ${S(`${leg} ${u}`)}.`],
  }, leg, `Yes: ${c * c} − ${kn * kn} = ${L2}, and ${leg} × ${leg} = ${L2}.`, [
    { v: round1(Math.sqrt(c * c + kn * kn)), mc: MC.legAdds, say: `Adding the squares gives a side LONGER than the hypotenuse. A leg is shorter: subtract, ${c * c} − ${kn * kn}.` },
    { v: c * c + kn * kn, mc: MC.legAdds, say: `The hypotenuse square is the biggest; the missing leg square is what is left: ${c * c} − ${kn * kn}.` },
    { v: c - kn, mc: MC.addLengths, say: `${c} − ${kn} subtracts the lengths. Subtract the SQUARES, then take the root.` },
    { v: L2, mc: MC.noRoot, say: `${L2} is ${sq(I(X))}, the area of the leg's square. The leg is its square root.` },
    { v: -L2, mc: MC.legReversed, say: `${kn * kn} − ${c * c} is the wrong way round: the hypotenuse square is the bigger one. ${c * c} − ${kn * kn}.` },
    { v: -leg, mc: MC.legReversed, say: `A length is never negative. Subtract the smaller square from the bigger one: ${c * c} − ${kn * kn}.` },
  ], `Hypotenuse squared minus the known leg squared, then the square root.`);
}
const hypWhole: Gen = (R, n) => {
  const [a, b, c] = triple(R), k = R() < 0.5;
  return solveItem('hypWhole', n, { a: k ? a : b, b: k ? b : a, c, unknown: 'c', u: pick(R, UNITS), pose: pick(R, POSES) }, R);
};
const missingLeg: Gen = (R, n) => {
  const [a, b, c] = triple(R), k = R() < 0.5;
  return solveItem('missingLeg', n, { a: k ? a : b, b: k ? b : a, c, unknown: R() < 0.5 ? 'a' : 'b', u: pick(R, UNITS), pose: pick(R, POSES) }, R);
};
const mixedSides: Gen = (R, n) => {
  const [a, b, c] = triple(R), k = R() < 0.5;
  return solveItem('mixedSides', n, { a: k ? a : b, b: k ? b : a, c, unknown: pick(R, ['a', 'b', 'c'] as const), u: pick(R, UNITS), pose: pick(R, POSES) }, R);
};

// ===================== 10. irrational-exact-approx =====================
/** a right triangle whose unknown side is not a whole number: [legA, legB, hyp2, unknown] (hyp2 = c²) */
function irr(R: () => number): { a: number; b: number; C2: number; unknown: 'c' | 'leg' } {
  for (;;) {
    if (R() < 0.6) { const a = int(R, 1, 9), b = int(R, a, 12); if (!isSquare(a * a + b * b)) return { a, b, C2: a * a + b * b, unknown: 'c' }; }
    else { const c = int(R, 4, 20), a = int(R, 1, c - 1), L2 = c * c - a * a; if (!isSquare(L2)) return { a, b: Math.sqrt(L2), C2: c * c, unknown: 'leg' }; }
  }
}
const exactRoot: Gen = (R, n) => {
  const t = irr(R), u = pick(R, ['in', 'ft'] as const);
  if (t.unknown === 'c') {
    const { a, b, C2 } = t;
    return choiceItem(R, {
      id: `exactRoot-${n}`, family: 'exactRoot',
      prompt: `The legs of a right triangle are ${A(`${a} ${u}`)} and ${B(`${b} ${u}`)}. What is the exact length of the hypotenuse?`,
      board: `c^2 = ${a}^2 + ${b}^2`,
      picture: { pic: legPic(a, b, pick(R, POSES), { a: tu(a, u), b: tu(b, u), c: 'c' }) },
      steps: [`c^2 = ${a * a} + ${b * b} = ${C2}`, `c = \\sqrt{${C2}}`],
      solution: [`${sq(I('c'))} = ${a * a} + ${b * b} = ${C2}.`, `${C2} is not a perfect square, so the exact answer is ${S(`${rootHtml(C2)} ${u}`)}.`],
    }, [
      { t: `${rootHtml(C2)} ${u}`, ok: true, say: `Yes: ${rootHtml(C2)} is exact. Its decimal goes on forever, but the number is exact.` },
      { t: `${a + b} ${u}`, mc: MC.partByPart, say: `${rootHtml(`${a}² + ${b}²`)} is not ${a} + ${b}: a square root does not split over a sum. Add first: ${C2}.` },
      { t: `${C2} ${u}`, mc: MC.noRoot, say: `${C2} is ${sq(I('c'))}, the area of the square. The side is its root, ${rootHtml(C2)}.` },
      { t: `${rootHtml(a + b)} ${u}`, mc: MC.rootUnsquared, say: `Square the legs before adding: ${a * a} + ${b * b} = ${C2}, not ${a} + ${b}.` },
    ]);
  }
  const c = Math.sqrt(t.C2), a = t.a, L2 = t.C2 - a * a;
  return choiceItem(R, {
    id: `exactRoot-${n}`, family: 'exactRoot',
    picture: { pic: legPic(a, Math.sqrt(L2), pick(R, POSES), { a: tu(a, u), b: 'b', c: tu(c, u) }) },
    prompt: `A right triangle has hypotenuse ${S(`${c} ${u}`)} and one leg ${A(`${a} ${u}`)}. What is the exact length of the other leg?`,
    board: `b^2 = ${c}^2 - ${a}^2`,
    steps: [`b^2 = ${c * c} - ${a * a} = ${L2}`, `b = \\sqrt{${L2}}`],
    solution: [`${sq(I('b'))} = ${c * c} − ${a * a} = ${L2}.`, `${L2} is not a perfect square, so the exact answer is ${S(`${rootHtml(L2)} ${u}`)}.`],
  }, [
    { t: `${rootHtml(L2)} ${u}`, ok: true, say: `Yes: ${rootHtml(L2)} is exact.` },
    { t: `${c - a} ${u}`, mc: MC.partByPart, say: `${rootHtml(`${c}² − ${a}²`)} is not ${c} − ${a}: subtract the squares first, ${c * c} − ${a * a} = ${L2}.` },
    { t: `${L2} ${u}`, mc: MC.noRoot, say: `${L2} is ${sq(I('b'))}, an area. The leg is its square root.` },
    { t: `${rootHtml(c * c + a * a)} ${u}`, mc: MC.legAdds, say: `For a leg, subtract: the hypotenuse square is the biggest. ${c * c} − ${a * a}.` },
  ]);
};
const roundTenth: Gen = (R, n) => {
  const t = irr(R), u = pick(R, ['in', 'ft'] as const);
  const isC = t.unknown === 'c';
  const c = Math.sqrt(t.C2), a = t.a;
  const N = isC ? t.C2 : t.C2 - a * a;
  const val = Math.sqrt(N), ans = round1(val), [k, k1] = bracket(N);
  const trunc = Math.floor(val * 10) / 10;
  return numItem({
    id: `roundTenth-${n}`, family: 'roundTenth', unit: u,
    picture: { pic: legPic(a, isC ? t.b : val, pick(R, POSES), isC ? { a: tu(a, u), b: tu(t.b, u), c: 'c' } : { a: tu(a, u), b: 'b', c: tu(c, u) }) },
    prompt: isC
      ? `The legs of a right triangle are ${A(`${a} ${u}`)} and ${B(`${t.b} ${u}`)}. The hypotenuse is ${rootHtml(N)} ${u}. How long is that to the nearest tenth? (Calculator allowed.)`
      : `A right triangle has hypotenuse ${S(`${c} ${u}`)} and a leg ${A(`${a} ${u}`)}. The other leg is ${rootHtml(N)} ${u}. How long is that to the nearest tenth? (Calculator allowed.)`,
    board: `\\sqrt{${N}} \\approx \\,?`,
    steps: [`${k} < \\sqrt{${N}} < ${k1}`, `\\sqrt{${N}} = ${val.toFixed(3)}\\ldots \\approx ${tenth(val)}`],
    solution: [`First the bracket: ${k * k} < ${N} < ${k1 * k1}, so it is between ${k} and ${k1}.`, `The calculator shows ${val.toFixed(4)}…`, `To the nearest tenth: ${S(`${tenth(val)} ${u}`)}.`],
  }, ans, `Yes: ${rootHtml(N)} ≈ ${tenth(val)} ${u}.`, [
    { v: Math.round(val), mc: MC.roundWhole, say: `That is the nearest WHOLE number. The nearest tenth keeps one decimal: ${tenth(val)}.` },
    { v: N, mc: MC.noRoot, say: `${N} is under the root sign. The length is ${rootHtml(N)}, about ${k}-point-something.` },
    { v: N / 2, mc: MC.halfRoot, say: `${fmt(N / 2)} is half of ${N}. The square root is the number that times itself makes ${N}.` },
    { v: trunc, say: `Round, don't chop: ${val.toFixed(3)}… rounds to ${tenth(val)}.` },
  ], `It is between ${k} and ${k1}. Find ${rootHtml(N)} on a calculator, then round to one decimal.`);
};

// ===================== 11. model-context =====================
interface Ctx { text: string; ask: string; legs: [string, string]; hyp: string; a: number; b: number; c2: number; unknown: 'c' | 'b'; u: Unit; half?: number; slip?: Slip[] }
function context(R: () => number): Ctx {
  const kind = int(R, 0, 4);
  if (kind === 0) {   // ladder: the ladder is the hypotenuse, the height is the unknown leg
    const [d, h, L] = pick(R, [[5, 12, 13], [6, 8, 10], [8, 15, 17], [7, 24, 25], [9, 12, 15], [4, 0, 12], [3, 0, 10], [6, 0, 14]] as const);
    const H2 = L * L - d * d;
    void h;
    return { text: `A ${L} ft ladder leans against a wall. Its foot is ${d} ft from the wall, on level ground.`, ask: 'How high up the wall does it reach?', legs: ['the distance from the wall', 'the height up the wall'], hyp: 'the ladder', a: d, b: Math.sqrt(H2), c2: L * L, unknown: 'b', u: 'ft',
      slip: [{ v: round1(Math.sqrt(L * L + d * d)), mc: MC.roleSwap, say: `That treats the ladder as a leg. The ladder is the slanted side, across from the right angle where the wall meets the ground: it is the hypotenuse.` }] };
  }
  if (kind === 1) {   // a TV screen sold by its diagonal
    const [w, h] = pick(R, [[16, 12], [20, 15], [12, 9], [24, 7], [15, 8], [10, 7], [14, 8]] as const);
    return { text: `A screen is ${w} in wide and ${h} in tall. Screens are sold by their diagonal.`, ask: 'How long is the diagonal?', legs: ['the width', 'the height'], hyp: 'the diagonal', a: h, b: w, c2: w * w + h * h, unknown: 'c', u: 'in' };
  }
  if (kind === 2) {   // walking north then east
    const [N, E] = pick(R, [[6, 8], [5, 12], [9, 12], [8, 15], [5, 7], [4, 9], [7, 7]] as const);
    return { text: `Maya walks ${N} blocks north, then ${E} blocks east. (North and east make a right angle.)`, ask: 'How far is she from her start, in a straight line, in blocks?', legs: ['the walk north', 'the walk east'], hyp: 'the straight line back to the start', a: N, b: E, c2: N * N + E * E, unknown: 'c', u: 'ft' };
  }
  if (kind === 3) {   // isosceles triangle height: half the base
    const [s, base] = pick(R, [[13, 10], [10, 12], [17, 16], [25, 14], [5, 6], [15, 18], [10, 16]] as const);
    const half = base / 2, H2 = s * s - half * half;
    return { text: `A roof truss is an isosceles triangle: two equal sides of ${s} ft and a base of ${base} ft. Its height goes from the top down to the middle of the base, at a right angle.`, ask: 'How tall is it?', legs: ['half the base', 'the height'], hyp: `a ${s} ft side`, a: half, b: Math.sqrt(H2), c2: s * s, unknown: 'b', u: 'ft', half,
      slip: s <= base ? [] : [{ v: round1(Math.sqrt(s * s - base * base)), mc: MC.wholeNotHalf, say: `The right triangle uses HALF the base: the height meets the base in its middle. The leg is ${half} ft, not ${base} ft.` }] };
  }
  const [side, u] = pick(R, [[15, 'ft'], [12, 'in'], [10, 'ft'], [9, 'in'], [11, 'ft']] as const);
  return { text: `A square ${u === 'ft' ? 'patio' : 'quilt block'} is ${side} ${u} on each side.`, ask: 'How long is its diagonal, from corner to corner?', legs: ['one side', 'the next side'], hyp: 'the diagonal', a: side, b: side, c2: 2 * side * side, unknown: 'c', u };
}
const contextHyp: Gen = (R, n) => {
  const x = context(R);
  const opts: Opt[] = [
    { t: x.hyp[0]!.toUpperCase() + x.hyp.slice(1), ok: true, say: `Yes: it is across from the right angle.` },
    ...x.legs.map(l => ({ t: l[0]!.toUpperCase() + l.slice(1), mc: MC.roleSwap, say: `${l[0]!.toUpperCase() + l.slice(1)} makes the right angle with the other leg, so it is a leg. The hypotenuse is across from the right angle: ${x.hyp}.` })),
  ];
  return choiceItem(R, {
    id: `contextHyp-${n}`, family: 'contextHyp',
    prompt: `${x.text} Sketch the right triangle. Which length is its hypotenuse?`,
    board: `\\text{hypotenuse} = \\,?`,
    solution: [`The right angle is between ${x.legs[0]} and ${x.legs[1]}.`, `Across from it: ${S(x.hyp)}, the hypotenuse.`],
  }, opts);
};
const story: Gen = (R, n) => {
  const x = context(R);
  const N = x.unknown === 'c' ? x.c2 : x.c2 - x.a * x.a;
  const exact = isSquare(N), ans = exact ? isqrt(N) : round1(Math.sqrt(N));
  const unit = x.text.includes('blocks') ? 'blocks' : x.u;
  const pic: TriPic = { kind: 'tri', pts: posed(...drawn(x.a, x.b), 'q0'), right: true, after: true, labels: x.unknown === 'c' ? { a: String(x.a), b: String(x.b), c: '?' } : { a: String(x.a), b: '?', c: String(Math.sqrt(x.c2)) } };
  return numItem({
    id: `story-${n}`, family: 'story', unit,
    prompt: `${x.text} ${x.ask}${exact ? '' : ' Round to the nearest tenth.'}`,
    board: x.unknown === 'c' ? `c^2 = ${x.a}^2 + ${x.b}^2` : `b^2 = ${fmt(Math.sqrt(x.c2))}^2 - ${x.a}^2`,
    picture: { pic },
    steps: [x.unknown === 'c' ? `c^2 = ${x.a * x.a} + ${x.b * x.b} = ${N}` : `b^2 = ${x.c2} - ${x.a * x.a} = ${N}`, `${x.unknown} = ${rootTex(N)}${exact ? '' : ` \\approx ${tenth(Math.sqrt(N))}`}`],
    solution: [`The right angle is between ${x.legs[0]} and ${x.legs[1]}; the hypotenuse is ${x.hyp}.`,
      x.unknown === 'c' ? `${sq(I('c'))} = ${x.a * x.a} + ${x.b * x.b} = ${N}.` : `The unknown is a leg: ${x.c2} − ${x.a * x.a} = ${N}.`,
      `${rootHtml(N)} ${exact ? '=' : '≈'} ${S(`${exact ? ans : tenth(ans)} ${unit}`)}.`],
  }, ans, `Yes: ${rootHtml(N)} ${exact ? '=' : '≈'} ${exact ? ans : tenth(ans)} ${unit}.`, [
    ...(x.slip ?? []),
    { v: x.a + x.b, mc: MC.addLengths, say: `Adding the lengths goes around the corner. The diagonal is a shortcut: square, add, take the root.` },
    { v: N, mc: MC.noRoot, say: `${N} is the area of a square. The length is its square root.` },
    ...(exact ? [] : [{ v: Math.round(Math.sqrt(N)), mc: MC.roundWhole, say: `Round to the nearest TENTH: one decimal, ${tenth(Math.sqrt(N))}.` }]),
  ], `Sketch it: where is the right angle? Then square, add or subtract, and take the root.`);
};

// ===================== 12. unit-consistency =====================
const UNIT_CASES: readonly { a: [number, Unit]; b: [number, Unit]; to: Unit; ramp?: boolean }[] = [
  { a: [1, 'ft'], b: [5, 'in'], to: 'in' }, { a: [2, 'ft'], b: [7, 'in'], to: 'in' }, { a: [1, 'yd'], b: [4, 'ft'], to: 'ft' },
  { a: [2, 'ft'], b: [6, 'in'], to: 'in', ramp: true }, { a: [1, 'ft'], b: [9, 'in'], to: 'in' }, { a: [1, 'ft'], b: [16, 'in'], to: 'in' },
  { a: [2, 'yd'], b: [8, 'ft'], to: 'ft' }, { a: [1, 'ft'], b: [8, 'in'], to: 'in' }, { a: [2, 'ft'], b: [5, 'in'], to: 'in' },
  { a: [1, 'yd'], b: [2, 'ft'], to: 'ft' }, { a: [1, 'ft'], b: [7, 'in'], to: 'in' }, { a: [2, 'ft'], b: [3, 'in'], to: 'in' },
  { a: [1, 'yd'], b: [5, 'ft'], to: 'ft' }, { a: [1, 'yd'], b: [1, 'ft'], to: 'ft' },
];
const conv = (v: number, from: Unit, to: Unit): number => v * ({ in: 1, ft: 12, yd: 36 }[from] / { in: 1, ft: 12, yd: 36 }[to]);
const mixedUnits: Gen = (R, n) => {
  const cs = pick(R, UNIT_CASES.filter(c => conv(c.a[0], c.a[1], c.to) <= 25));
  const A1 = conv(cs.a[0], cs.a[1], cs.to), B1 = conv(cs.b[0], cs.b[1], cs.to), N = A1 * A1 + B1 * B1;
  const exact = isSquare(N), ans = exact ? isqrt(N) : round1(Math.sqrt(N));
  const raw = cs.a[0] * cs.a[0] + cs.b[0] * cs.b[0];
  const ramp = cs.ramp || (cs.to === 'in' && R() < 0.35);
  const text = ramp
    ? `A ramp rises ${cs.b[0]} ${WORD[cs.b[1]]} over a level run of ${cs.a[0]} ${WORD[cs.a[1]]}. How long is the ramp's surface, in ${WORD[cs.to]}?`
    : `The legs of a right triangle are ${A(`${cs.a[0]} ${cs.a[1]}`)} and ${B(`${cs.b[0]} ${cs.b[1]}`)}. How long is the hypotenuse, in ${WORD[cs.to]}?`;
  return numItem({
    id: `mixedUnits-${n}`, family: 'mixedUnits', unit: cs.to,
    prompt: text + (exact ? '' : ' Round to the nearest tenth.'),
    board: `${tu(cs.a[0], cs.a[1])},\\ ${tu(cs.b[0], cs.b[1])}`,
    picture: { pic: { kind: 'tri', pts: posed(...drawn(B1, A1), 'q0'), right: true, labels: { a: tu(cs.b[0], cs.b[1]), b: tu(cs.a[0], cs.a[1]), c: '?' } } },
    steps: [`${tu(cs.a[0], cs.a[1])} = ${tu(A1, cs.to)}`, `c^2 = ${A1 * A1} + ${B1 * B1} = ${N}`, `c = ${rootTex(N)}${exact ? '' : ` \\approx ${tenth(Math.sqrt(N))}`}`],
    solution: [`One unit first: ${cs.a[0]} ${cs.a[1]} = ${A1} ${cs.to}.`, `${sq(I('c'))} = ${A1 * A1} + ${B1 * B1} = ${N}.`, `${I('c')} = ${rootHtml(N)} ${exact ? '=' : '≈'} ${S(`${exact ? ans : tenth(ans)} ${cs.to}`)}.`],
  }, ans, `Yes: ${A1} ${cs.to} and ${B1} ${cs.to} give ${rootHtml(N)} ${exact ? '=' : '≈'} ${exact ? ans : tenth(ans)} ${cs.to}.`, [
    { v: round1(Math.sqrt(raw)), mc: MC.unconverted, say: `${cs.a[0]} and ${cs.b[0]} are in different units. Change ${cs.a[0]} ${cs.a[1]} into ${A1} ${cs.to} first.` },
    { v: raw, mc: MC.unconverted, say: `Change ${cs.a[0]} ${cs.a[1]} into ${A1} ${cs.to} first, then square.` },
    { v: N, mc: MC.noRoot, say: `${N} is ${sq(I('c'))}, an area. The length is its square root.` },
    { v: A1 + B1, mc: MC.addLengths, say: `Adding the lengths goes around the corner. Square, add, then take the root.` },
  ], `Change ${cs.a[0]} ${cs.a[1]} into ${cs.to} first, then square, add and take the root.`);
};
const unitName: Gen = (R, n) => {
  const [a, b, c] = triple(R), u = pick(R, UNITS), area = R() < 0.4;
  const q = area ? `The square on the hypotenuse has an area of ${c * c} ___.` : `The hypotenuse is ${c} ___ long.`;
  const opts: Opt[] = area ? [
    { t: SQU(u), ok: true, say: `Yes: an area is counted in square units.` },
    { t: u, mc: MC.unitDim, say: `${c * c} is an AREA (${c} × ${c}), so it is in square ${WORD[u]}.` },
    { t: `cubic ${u}`, mc: MC.unitDim, say: `An area is flat: square ${WORD[u]}, not cubic.` },
  ] : [
    { t: u, ok: true, say: `Yes: a side is a length, in ${WORD[u]}.` },
    { t: SQU(u), mc: MC.unitDim, say: `${c} is a LENGTH, the side of the square. Only its area, ${c * c}, is in ${SQU(u)}.` },
    { t: `cubic ${u}`, mc: MC.unitDim, say: `A side is a length: just ${WORD[u]}.` },
  ];
  return choiceItem(R, {
    id: `unitName-${n}`, family: 'unitName',
    picture: { pic: legPic(a, b, pick(R, POSES), { a: tu(a, u), b: tu(b, u), c: 'c' }) },
    prompt: `The legs of a right triangle are ${a} ${u} and ${b} ${u}. ${q} Which unit fills the gap?`,
    board: area ? `c^2 = ${c * c}\\ \\, ?` : `c = ${c}\\ \\, ?`,
    solution: area ? [`${c} × ${c} = ${c * c}: the area of a square with sides of ${c} ${u}.`, `An area is counted in square units: ${S(SQU(u))}.`] : [`${c} is the length of a side: ${S(u)}.`, `Its square, ${c * c}, would be in ${SQU(u)}.`],
  }, opts);
};

// ===================== 13. substitution-check =====================
const subCheck: Gen = (R, n) => {
  const [a, b, c] = triple(R);
  const v = int(R, 0, 4);
  // the proposed answer and what it is for
  if (v <= 1) {   // hypotenuse: right (whole) or "forgot the root"
    const good = v === 0, prop = good ? c : c * c;
    const lhs = a * a + b * b, rhs = prop * prop;
    return choiceItem(R, {
      id: `subCheck-${n}`, family: 'subCheck',
      picture: { pic: legPic(a, b, pick(R, POSES), { a: String(a), b: String(b), c: 'c' }) },
      prompt: `Legs ${A(a)} and ${B(b)}. Jo says the hypotenuse is ${S(prop)}. Check it by putting ${prop} into ${sq(a)} + ${sq(b)} = ${sq(I('c'))}.`,
      board: `${a}^2 + ${b}^2 \\overset{?}{=} ${prop}^2`,
      steps: [`${a * a} + ${b * b} = ${lhs}`, `${prop}^2 = ${rhs}`],
      solution: [`Left side: ${a * a} + ${b * b} = ${lhs}.`, `Right side: ${sq(prop)} = ${rhs}.`, good ? `They match: ${S(`${prop} checks`)}.` : `${lhs} ≠ ${rhs}: ${S(`${prop} is wrong`)}. ${prop} is ${sq(I('c'))}; the side is ${c}.`],
    }, good ? [
      { t: `It checks: ${a * a} + ${b * b} = ${lhs}, and ${sq(prop)} = ${rhs}.`, ok: true, say: `Yes: both sides are ${lhs}.` },
      { t: `It fails: ${sq(prop)} is not ${lhs}.`, say: `Work it out: ${prop} × ${prop} = ${rhs}, the same as ${lhs}.` },
      { t: `You can only check it by solving again the same way.`, mc: MC.repeatSteps, say: `Putting the answer back into the ORIGINAL equation is a real check: the same slip can't sneak through twice.` },
    ] : [
      { t: `It fails: ${a * a} + ${b * b} = ${lhs}, but ${sq(prop)} = ${rhs}.`, ok: true, say: `Yes: ${prop} is ${sq(I('c'))}. Jo forgot the square root: ${I('c')} = ${c}.` },
      { t: `It checks: ${prop} looks right, it came from ${a * a} + ${b * b}.`, mc: MC.looksRight, say: `Looking right is not a check. Put ${prop} in: ${sq(prop)} = ${rhs}, not ${lhs}.` },
      { t: `It checks if you redo ${a * a} + ${b * b} and get ${prop} again.`, mc: MC.repeatSteps, say: `Redoing the same steps repeats the same slip. Put ${prop} back into the equation: ${sq(prop)} = ${rhs}.` },
    ]);
  }
  if (v === 3) {   // an exact square-root candidate that is right
    const t = irr(R), isC = t.unknown === 'c';
    const N = isC ? t.C2 : t.C2 - t.a * t.a, c0 = Math.sqrt(t.C2);
    const legs = isC ? `${A(t.a)} and ${B(t.b)}` : `${A(t.a)} and the unknown`;
    const lhs = isC ? t.a * t.a + t.b * t.b : t.a * t.a + N;
    return choiceItem(R, {
      id: `subCheck-${n}`, family: 'subCheck',
      picture: { pic: legPic(t.a, isC ? t.b : Math.sqrt(N), pick(R, POSES), isC ? { a: String(t.a), b: String(t.b), c: 'c' } : { a: String(t.a), b: 'b', c: String(c0) }) },
      prompt: isC ? `Legs ${legs}. Jo says the hypotenuse is exactly ${S(rootHtml(N))}. Check it by substituting.` : `Hypotenuse ${S(c0)}, one leg ${A(t.a)}. Jo says the other leg is exactly ${B(rootHtml(N))}. Check it by substituting.`,
      board: isC ? `${t.a}^2 + ${t.b}^2 \\overset{?}{=} (\\sqrt{${N}})^2` : `${t.a}^2 + (\\sqrt{${N}})^2 \\overset{?}{=} ${c0}^2`,
      steps: [`(\\sqrt{${N}})^2 = ${N}`, isC ? `${t.a * t.a} + ${t.b * t.b} = ${lhs}` : `${t.a * t.a} + ${N} = ${lhs} = ${c0}^2`],
      solution: [`Squaring ${rootHtml(N)} gives back ${N}.`, isC ? `${t.a * t.a} + ${t.b * t.b} = ${lhs}: they match, ${S('it checks')}.` : `${t.a * t.a} + ${N} = ${lhs} = ${sq(c0)}: ${S('it checks')}.`],
    }, [
      { t: `It checks: (${rootHtml(N)})<sup>2</sup> = ${N}, and the equation balances.`, ok: true, say: `Yes: squaring a square root gives back the number under it.` },
      { t: `It fails: a side can't be written with a root sign.`, mc: MC.onlyWhole, say: `${rootHtml(N)} is an exact length. Square it: ${N}, and the equation balances.` },
      { t: `You can only check it by solving again the same way.`, mc: MC.repeatSteps, say: `Substituting into the original equation is the real check: (${rootHtml(N)})<sup>2</sup> = ${N}.` },
    ]);
  }
  // a leg: right (whole) or "added the squares instead of subtracting"
  const kn = R() < 0.5 ? a : b, leg = kn === a ? b : a;
  const good = v === 2, rootN = c * c + kn * kn;
  const shownH = good ? String(leg) : rootHtml(String(rootN));
  const val2 = good ? leg * leg : rootN;
  const lhs = kn * kn + val2;
  return choiceItem(R, {
    id: `subCheck-${n}`, family: 'subCheck',
    picture: { pic: legPic(kn, leg, pick(R, POSES), { a: String(kn), b: 'b', c: String(c) }) },
    prompt: `Hypotenuse ${S(c)}, one leg ${A(kn)}. Ali says the other leg is ${B(shownH)}. Check it in ${sq(kn)} + ${sq(I('b'))} = ${sq(c)}.`,
    board: `${kn}^2 + ${good ? `${leg}^2` : `(\\sqrt{${rootN}})^2`} \\overset{?}{=} ${c}^2`,
    steps: [`${kn * kn} + ${val2} = ${lhs}`, `${c}^2 = ${c * c}`],
    solution: [`Squaring ${shownH} gives ${val2}.`, `${kn * kn} + ${val2} = ${lhs}; ${sq(c)} = ${c * c}.`, good ? `They match: ${S('it checks')}.` : `${lhs} ≠ ${c * c}: ${S('wrong')}. Ali added the squares; a leg needs ${c * c} − ${kn * kn}.`],
  }, good ? [
    { t: `It checks: ${kn * kn} + ${val2} = ${c * c} = ${sq(c)}.`, ok: true, say: `Yes: both sides are ${c * c}.` },
    { t: `It fails: ${kn} + ${leg} is not ${c}.`, mc: MC.addLengths, say: `The equation adds the SQUARES: ${kn * kn} + ${val2} = ${c * c}. It checks.` },
    { t: `You can only check it by solving again the same way.`, mc: MC.repeatSteps, say: `Substituting into the original equation is the check: ${kn * kn} + ${val2} = ${c * c}.` },
  ] : [
    { t: `It fails: ${kn * kn} + ${val2} = ${lhs}, not ${c * c}.`, ok: true, say: `Yes: the leg came out longer than the hypotenuse. Ali added the squares instead of subtracting.` },
    { t: `It checks: it looks like a careful answer.`, mc: MC.looksRight, say: `Looks are not a check. Square it and put it in: ${kn * kn} + ${val2} = ${lhs}, not ${c * c}.` },
    { t: `It checks if you add ${c * c} + ${kn * kn} again and get ${rootN}.`, mc: MC.repeatSteps, say: `Redoing the same steps repeats the same slip. The original equation says ${kn * kn} + ${sq(I('b'))} = ${c * c}.` },
  ]);
};

// ===================== 14. size-check =====================
const sizeCheck: Gen = (R, n) => {
  const [a, b, c] = triple(R);
  const v = int(R, 0, 3);
  if (v === 0) {   // a "leg" longer than the hypotenuse
    const kn = R() < 0.5 ? a : b, bad = round1(Math.sqrt(c * c + kn * kn));
    return choiceItem(R, {
      id: `sizeCheck-${n}`, family: 'sizeCheck',
      picture: { pic: legPic(kn, kn === a ? b : a, pick(R, POSES), { a: tu(kn, 'in'), b: '?', c: tu(c, 'in') }) },
      prompt: `Hypotenuse ${S(c)} in, one leg ${A(kn)} in. Lee's calculator says the other leg is ${bad} in. Is that a sensible size?`,
      board: `c = ${c},\\ \\text{leg} \\approx ${bad}`,
      solution: [`The hypotenuse is the longest side.`, `${bad} in is longer than ${c} in, so it ${S('cannot be a leg')}. Lee added the squares instead of subtracting.`],
    }, [
      { t: `No: a leg can't be longer than the hypotenuse, ${c} in.`, ok: true, say: `Yes: the hypotenuse is always the longest side.` },
      { t: `Yes: the calculator worked it out.`, mc: MC.calcTrust, say: `A calculator does what you type. ${bad} is longer than the hypotenuse, ${c}, so something went wrong.` },
      { t: `Yes: ${bad} is between ${kn} and ${c + kn}.`, mc: MC.boundsOnly, say: `Being between two numbers is not enough: a leg must be SHORTER than the hypotenuse, ${c}.` },
    ]);
  }
  if (v === 1) {   // c = a + b
    return choiceItem(R, {
      id: `sizeCheck-${n}`, family: 'sizeCheck',
      picture: { pic: legPic(a, b, pick(R, POSES), { a: tu(a, 'ft'), b: tu(b, 'ft'), c: '?' }) },
      prompt: `Legs ${A(a)} ft and ${B(b)} ft. Rosa says the hypotenuse is ${a + b} ft. Is that a sensible size?`,
      board: `${a} + ${b} = ${a + b}\\ ?`,
      solution: [`Going straight across is shorter than walking along both legs.`, `So the hypotenuse is shorter than ${a} + ${b} = ${a + b}: ${S(`${a + b} is too long`)}. It is ${c} ft.`],
    }, [
      { t: `No: the hypotenuse must be shorter than ${a} + ${b} = ${a + b}.`, ok: true, say: `Yes: a straight line is shorter than the way around the corner. It is ${c} ft.` },
      { t: `Yes: ${a + b} is longer than both legs.`, mc: MC.boundsOnly, say: `Longer than both legs is needed, but it must ALSO be shorter than ${a} + ${b}.` },
      { t: `Yes: the hypotenuse is the two legs put together.`, mc: MC.addLengths, say: `Putting the legs end to end goes around the corner. The hypotenuse cuts across: shorter.` },
    ]);
  }
  if (v === 2) {   // passes both size checks but is wrong
    const bad = c + (c + 2 < a + b && R() < 0.5 ? 2 : 1);
    const fine = bad > Math.max(a, b) && bad < a + b;   // always true for the topic's triples: it passes both size checks
    return choiceItem(R, {
      id: `sizeCheck-${n}`, family: 'sizeCheck',
      picture: { pic: legPic(a, b, pick(R, POSES), { a: String(a), b: String(b), c: '?' }) },
      prompt: `Legs ${A(a)} and ${B(b)}. Ben says the hypotenuse is ${bad}: it is longer than both legs and shorter than ${a + b}. Is ${bad} right?`,
      board: `${Math.max(a, b)} < ${bad} < ${a + b}`,
      solution: [`The size checks only say the answer COULD be right.`, `Substitute: ${a * a} + ${b * b} = ${c * c}, but ${sq(bad)} = ${bad * bad}.`, `So ${bad} is wrong; the hypotenuse is ${S(c)}.`],
    }, [
      { t: `No: ${fine ? 'it passes the size checks, but ' : ''}${sq(a)} + ${sq(b)} = ${c * c} and ${sq(bad)} = ${bad * bad}.`, ok: true, say: `Yes: size checks catch big slips; substitution decides.` },
      { t: `Yes: it passes both size checks.`, mc: MC.boundsOnly, say: `Passing the size checks only means it COULD be right. Substitute: ${sq(bad)} = ${bad * bad}, not ${c * c}.` },
      { t: `Yes: it is close to the legs, so it looks right.`, mc: MC.looksRight, say: `Looking right is not enough. ${sq(bad)} = ${bad * bad}, but ${sq(a)} + ${sq(b)} = ${c * c}.` },
    ]);
  }
  // correct, and it passes
  return choiceItem(R, {
    id: `sizeCheck-${n}`, family: 'sizeCheck',
    picture: { pic: legPic(a, b, pick(R, POSES), { a: String(a), b: String(b), c: '?' }) },
    prompt: `Legs ${A(a)} and ${B(b)}. Dev says the hypotenuse is ${c}. Do the size checks and the substitution agree?`,
    board: `${Math.max(a, b)} < ${c} < ${a + b}`,
    solution: [`${c} is longer than both legs and shorter than ${a + b}: sensible.`, `${a * a} + ${b * b} = ${c * c} = ${sq(c)}: ${S('right')}.`],
  }, [
    { t: `Yes: ${c} is between ${Math.max(a, b)} and ${a + b}, and ${a * a} + ${b * b} = ${c * c}.`, ok: true, say: `Yes: sensible size AND it checks.` },
    { t: `No: the hypotenuse must be longer than ${a + b}.`, mc: MC.addLengths, say: `The hypotenuse is SHORTER than the two legs together: it cuts across the corner.` },
    { t: `No: ${c} is too close to ${Math.max(a, b)}.`, say: `It only has to be longer than ${Math.max(a, b)}, and it is. ${a * a} + ${b * b} = ${c * c} = ${sq(c)}.` },
  ]);
};

// ===================== 15. rounding-aware-check =====================
const roundCheck: Gen = (R, n) => {
  const t = irr(R);
  const N = t.unknown === 'c' ? t.C2 : t.C2 - t.a * t.a;
  const val = Math.sqrt(N), good = R() < 0.6;
  const r10 = Math.round(val * 10) + (good ? 0 : pick(R, [-2, 2]));   // tenths, as a whole number
  const rr = r10 / 10, sq100 = r10 * r10;                                 // (r10 / 10)² = sq100 / 100 exactly
  const rs = rr.toFixed(1), sqs = (sq100 / 100).toFixed(2);
  const [k, k1] = bracket(N);
  return choiceItem(R, {
    id: `roundCheck-${n}`, family: 'roundCheck',
    picture: { pic: legPic(t.a, t.unknown === 'c' ? t.b : Math.sqrt(N), pick(R, POSES), t.unknown === 'c' ? { a: String(t.a), b: String(t.b), c: 'c' } : { a: String(t.a), b: 'b', c: String(Math.sqrt(t.C2)) }) },
    prompt: `The exact side is ${rootHtml(N)}. Pat rounded it to ${rs}. Checking: ${rs}<sup>2</sup> = ${sqs}, but ${N} was needed. Is ${rs} a good answer to the nearest tenth?`,
    board: `${rs}^2 = ${sqs}\\ \\ \\text{vs}\\ \\ ${N}`,
    steps: [`${k} < \\sqrt{${N}} < ${k1}`, `\\sqrt{${N}} = ${val.toFixed(3)}\\ldots`],
    solution: [`A rounded answer never squares back exactly. Compare with the unrounded value.`, `${rootHtml(N)} = ${val.toFixed(3)}…, which rounds to ${(Math.round(val * 10) / 10).toFixed(1)}.`, good ? `So ${S(`${rs} is right`)}: ${sqs} is close to ${N}.` : `So ${S(`${rs} is wrong`)}: ${sqs} is too far from ${N}.`],
  }, good ? [
    { t: `Yes: it was rounded, so ${sqs} only has to be close to ${N}, and it is.`, ok: true, say: `Yes: with ≈, a small gap is expected.` },
    { t: `No: ${sqs} is not exactly ${N}, so it is wrong.`, mc: MC.roundGap, say: `A rounded answer can't square back exactly. ${rootHtml(N)} = ${val.toFixed(3)}…, and ${rs} is that to the nearest tenth.` },
    { t: `No: the answer must be the whole number ${Math.round(val)}.`, mc: MC.roundWhole, say: `The side is between ${k} and ${k1}, not a whole number. ${rs} is right to the tenth.` },
  ] : [
    { t: `No: ${sqs} is too far from ${N}. ${rootHtml(N)} is ${val.toFixed(3)}…`, ok: true, say: `Yes: a gap that big is more than rounding.` },
    { t: `Yes: a rounded answer never checks exactly, so any close number is fine.`, mc: MC.looksRight, say: `Small gaps are fine, but this one is too big: ${rootHtml(N)} rounds to ${(Math.round(val * 10) / 10).toFixed(1)}, not ${rs}.` },
    { t: `No: only an exact ${N} would make it right.`, mc: MC.roundGap, say: `That rule would reject every rounded answer. It is wrong for a different reason: ${rootHtml(N)} rounds to ${(Math.round(val * 10) / 10).toFixed(1)}.` },
  ]);
};

// ===================== 16. explain-proof =====================
const proofStep: Gen = (R, n) => {
  let a = int(R, 2, 8), b = int(R, 3, 12);
  if (a === b) b++;
  if (a > b) [a, b] = [b, a];
  const v = int(R, 0, 3), s = a + b;
  const head = `Four copies of a right triangle with legs ${A(a)} and ${B(b)} sit in a big square of side ${a} + ${b} = ${s}.`;
  const pic: ProofPic = { kind: 'proof', a, b, stage: v === 1 ? 'left' : 'mid' };
  if (v === 0) return choiceItem(R, {
    id: `proofStep-${n}`, family: 'proofStep',
    prompt: `${head} Why is the shape in the middle a square of area ${sq(I('c'))}?`,
    board: `\\text{middle} = c^2\\ ?`, picture: { pic },
    solution: [`Its four sides are hypotenuses, all ${I('c')} long.`, `At each corner, the triangle's two sharp angles add up to 90°, and the straight side of the big square is 180°: 180° − 90° = 90°.`, `Four equal sides and four right angles: ${S('a square')}, area ${sq(I('c'))}.`],
  }, [
    { t: `Its sides are 4 hypotenuses of length c, and each corner is 180° − 90° = 90°.`, ok: true, say: `Yes: equal sides AND right angles, both for a reason.` },
    { t: `It looks like a square in the picture.`, mc: MC.looksSquare, say: `A picture can fool you. The reason is the angles: the two sharp angles add to 90°, so each corner is 180° − 90° = 90°.` },
    { t: `It worked for the ${a}, ${b} triangle when we measured.`, mc: MC.examples, say: `Measuring one case is an example, not a reason. The angle facts make every corner 90°, for any right triangle.` },
  ]);
  if (v === 1) return choiceItem(R, {
    id: `proofStep-${n}`, family: 'proofStep',
    prompt: `${head} The triangles slide into two rectangles, leaving squares of ${sq(a)} and ${sq(b)}. Why is ${sq(a)} + ${sq(b)} the same area as the middle square before?`,
    board: `${a}^2 + ${b}^2 = c^2\\ ?`, picture: { pic },
    solution: [`The big square did not change: ${s} by ${s}.`, `The 4 triangles did not change; they only slid.`, `So the area NOT covered by triangles is the same before and after: ${S(`${sq(I('c'))} = ${sq(a)} + ${sq(b)}`)}.`],
  }, [
    { t: `The big square and the 4 triangles did not change, so the uncovered area stayed the same.`, ok: true, say: `Yes: equal wholes minus equal parts leave equal areas.` },
    { t: `It worked for 3, 4, 5, so it works here too.`, mc: MC.examples, say: `One example does not prove another. The reason is that the big square and the 4 triangles stay the same.` },
    { t: `The triangles' area is ${sq(a)} + ${sq(b)}.`, mc: MC.triArea, say: `${sq(a)} and ${sq(b)} are the uncovered SQUARES, not the triangles.` },
  ]);
  if (v === 2) {
    const big = s * s, tri4 = 2 * a * b;
    return choiceItem(R, {
      id: `proofStep-${n}`, family: 'proofStep',
      prompt: `${head} The big square is ${big}. The 4 triangles cover 4 × ${fmt(a * b / 2)} = ${tri4}. How much is left uncovered, and what is it?`,
      board: `${big} - ${tri4} = \\,?`, picture: { pic: { ...pic, stage: 'left' } },
      solution: [`${big} − ${tri4} = ${big - tri4}.`, `Slid one way, the uncovered part is ${sq(a)} + ${sq(b)} = ${a * a + b * b}; the other way it is ${sq(I('c'))}. Both are ${S(big - tri4)}.`],
    }, [
      { t: `${big - tri4}: it is ${sq(a)} + ${sq(b)} and also ${sq(I('c'))}.`, ok: true, say: `Yes: ${a * a} + ${b * b} = ${big - tri4}, so ${sq(I('c'))} = ${big - tri4} too.` },
      { t: `${big - tri4}: it is the area of the triangle.`, mc: MC.triArea, say: `One triangle is only ${fmt(a * b / 2)}. ${big - tri4} is the area of the uncovered SQUARES.` },
      { t: `${tri4}: the triangles are what is left.`, say: `${tri4} is what the triangles COVER. Uncovered is ${big} − ${tri4}.` },
    ]);
  }
  return choiceItem(R, {
    id: `proofStep-${n}`, family: 'proofStep',
    prompt: `${head} What does this argument show?`,
    board: `a^2 + b^2 = c^2`, picture: { pic: { ...pic, stage: 'left' } },
    solution: [`Nothing in the argument depends on ${a} and ${b}: any legs work the same way.`, `So it shows ${S(`${sq(I('a'))} + ${sq(I('b'))} = ${sq(I('c'))} for every right triangle`)}.`],
  }, [
    { t: `a² + b² = c² for every right triangle, because it works the same for any legs.`, ok: true, say: `Yes: a general argument, not one example.` },
    { t: `Only that ${sq(a)} + ${sq(b)} = ${sq(I('c'))} for this one triangle.`, mc: MC.examples, say: `The steps never used the numbers ${a} and ${b}, so the same argument works for every right triangle.` },
    { t: `Nothing yet: we only moved some pieces.`, mc: MC.noClaim, say: `Moving the pieces IS the argument: same big square, same triangles, so the same uncovered area: ${sq(I('c'))} = ${sq(I('a'))} + ${sq(I('b'))}.` },
  ]);
};

export const GENERATORS: Record<FamilyId, Gen> = {
  findHyp, letterC, squareArea, areaUnit, tilted: tiltedF, surroundCalc, missingArea, eqTrue, meaning, nonRight, rightFirst,
  exactSide, bracketRoot, writeEq, hypWhole, missingLeg, mixedSides, exactRoot, roundTenth, contextHyp, story, mixedUnits,
  unitName, subCheck, sizeCheck, roundCheck, proofStep,
};
