// items.ts: exercise families for "Pythagorean theorem" (secondary-t5-38-pythagorean-theorem, grade 8): the theorem
// and its converse, distance on the coordinate plane, diagonals in boxes, applied problems and critique. Templates
// with exact maths (theoremMaths.ts); every wrong answer the classifier recognises carries its misconception id from
// math-curriculum-essentials/misconceptions.json (the MC table, checked in the test). A generator gets the SUB-GOAL it
// practises (plan.ts) and uses that sub-goal's cases from the topic JSON. Pure: no DOM, no canvas.
import { type Item, type Response, type Verdict, int, pick, shuffle } from '../../runtime/item';
import type { Pt } from '../../../core/math';
import type { SideId } from '../pythagoras-intro/SideSquares';
import { rightPts } from '../pythagoras-intro/pythag';
import { type SketchPic, boxSketch, converseSketch, isoSketch, lineSketch, rectSketch, rtSketch, squareSketch, sssSketch, type Shape } from './sketches';
import {
  MIDWAY_BOXES, type V, WHOLE_BOXES, baseDiag2, bracket, dist2, fmt, isSquare, isqrt, kind3, near, roundMid, round1, rise, run,
  sorted3, spaceDiag2, sq, tenth, tilted, trunc1, wholeCellsInside,
} from './theoremMaths';

// ---------- families ----------
export const FAMILIES = [
  { id: 'hypOpp', name: 'Find the hypotenuse' },
  { id: 'embedded', name: 'A right triangle inside a figure' },
  { id: 'tiltArea', name: 'A tilted square' },
  { id: 'tiltSteps', name: 'Surround and subtract' },
  { id: 'missingSq', name: 'The missing square' },
  { id: 'unitsAreas', name: 'Lengths and areas' },
  { id: 'writeEq', name: 'Write the equation' },
  { id: 'legOrHyp', name: 'Which equation finds x?' },
  { id: 'holdsOrNot', name: 'Does it hold?' },
  { id: 'counterEx', name: 'One counterexample' },
  { id: 'hyp', name: 'Find the hypotenuse' },
  { id: 'rootFinish', name: 'Finish with the root' },
  { id: 'leg', name: 'Find a leg' },
  { id: 'bracketRt', name: 'Between two whole numbers' },
  { id: 'tenthRt', name: 'To the nearest tenth' },
  { id: 'squareCheck', name: 'Check a rounded root' },
  { id: 'exactLen', name: 'Exact length' },
  { id: 'lenTenth', name: 'Length to the nearest tenth' },
  { id: 'isRight', name: 'Is it a right triangle?' },
  { id: 'whereRight', name: 'Where is the right angle?' },
  { id: 'story', name: 'Solve the situation' },
  { id: 'whichTri', name: 'Model the situation' },
  { id: 'dist', name: 'Distance between two points' },
  { id: 'distLegs', name: 'The legs on the plane' },
  { id: 'perp3d', name: 'Right angles in a box' },
  { id: 'whichTri3d', name: 'The triangle in the box' },
  { id: 'faceOrSpace', name: 'Face or space diagonal?' },
  { id: 'spaceDiag', name: 'The space diagonal' },
  { id: 'keepExact', name: 'Keep it exact' },
  { id: 'findError', name: 'Find the mistake' },
  { id: 'sizeCheck', name: 'Is it a sensible size?' },
  { id: 'enough', name: 'Is there a right angle?' },
  { id: 'deckBrace', name: 'The deck brace' },
  { id: 'refute', name: 'Prove it is not right' },
  { id: 'whySquare', name: 'Why it is a square' },
  { id: 'innerAngle', name: 'The corner angle' },
  { id: 'equalRemainders', name: 'Equal remainders' },
  { id: 'proofLogic', name: 'Why it is a proof' },
  { id: 'converseStep', name: 'The converse, step by step' },
  { id: 'converseWhy', name: 'Does a rule work backward?' },
] as const;
export type FamilyId = (typeof FAMILIES)[number]['id'];
export const FAMILY_NAMES: Record<string, string> = Object.fromEntries(FAMILIES.map(f => [f.id, f.name]));

// ---------- pictures the page knows how to draw ----------
/** a triangle (the intro's SideSquares): `squares` grow in the replay unless `now` */
export interface TriPic {
  kind: 'tri'; pts: [Pt, Pt, Pt]; right: boolean;
  labels?: Partial<Record<SideId, string>>; verts?: [string, string, string];
  squares?: SideId[]; areas?: Partial<Record<SideId, string>>; now?: boolean;
}
export interface TiltPic { kind: 'tilt'; p: number; q: number; corners?: boolean }
/** two points on the plane; the right triangle and the labels come in the replay unless `now` */
export interface PlanePic { kind: 'plane'; A: V; B: V; run?: string; rise?: string; hyp?: string; hyp2?: string; now?: boolean }
export interface ProofPic { kind: 'proof'; a: number; b: number; stage: 'mid' | 'left' }
export type Pic = TriPic | TiltPic | PlanePic | ProofPic | SketchPic;
export interface PtItem extends Item { family: FamilyId; picture?: { pic: Pic }; steps?: string[] }
type Gen = (R: () => number, n: number, sg?: string) => PtItem;

// ---------- misconception ids ----------
export const MC = {
  hypC: 'mc.right-triangles-trig.hypotenuse-always-labeled-c',
  visual: 'mc.right-triangles-trig.hypotenuse-from-visual-cues',
  tiltRun: 'mc.coordinate-geometry.tilted-square-area-from-horizontal-run',
  partial: 'mc.area-perimeter.ignores-partial-squares',
  unitDim: 'mc.measurement-units.wrong-unit-dimension',
  addLengths: 'mc.right-triangles-trig.adds-lengths-not-squares',
  triArea: 'mc.right-triangles-trig.theorem-about-triangle-area',
  partByPart: 'mc.expressions.multiplies-sums-part-by-part',
  examples: 'mc.reasoning-language.examples-as-proof',
  noRight: 'mc.right-triangles-trig.pythagorean-without-right-angle',
  rSquared: 'mc.circles.r-squared-read-as-radius',
  legAdds: 'mc.right-triangles-trig.missing-leg-adds-squares',
  decSquare: 'mc.decimals.squares-decimal-wrongly',
  timesTwo: 'mc.exponents-roots.power-as-base-times-exponent',
  trunc: 'mc.decimals.truncates-instead-of-rounding',
  halfRoot: 'mc.exponents-roots.root-as-dividing-by-index',
  roundedExact: 'mc.estimation.rounded-value-treated-as-exact',
  roundGap: 'mc.estimation.rounding-gap-treated-as-error',
  display: 'mc.decimals.full-calculator-display-implies-irrationality',
  roundWhole: 'mc.ratio-rate.whole-number-rates-factors-only',
  lastListed: 'mc.right-triangles-trig.converse-last-listed-side',
  nearRight: 'mc.right-triangles-trig.near-equality-proves-right',
  roleSwap: 'mc.right-triangles-trig.context-role-swap',
  coordLen: 'mc.coordinate-geometry.coordinate-as-length',
  signFlip: 'mc.circles.center-sign-flip',
  spacePerp: 'mc.shapes.space-diagonal-perpendicular-to-base',
  pic3d: 'mc.shapes.reads-3d-relations-from-picture',
  faceDiag: 'mc.right-triangles-trig.face-diagonal-as-space-diagonal',
  midRound: 'mc.decimals.intermediate-precision-always-invalid',
  sizeCheck: 'mc.estimation.accepts-result-without-size-check',
  reasonNot: 'mc.reasoning-language.reason-not-linked-to-task',
  looks: 'mc.geometric-proof.diagram-appearance-as-given',
  converse: 'mc.geometric-proof.converse-assumed-true',
  unknownHyp: 'mc.right-triangles-trig.unknown-always-hypotenuse',
  knownLegHyp: 'mc.right-triangles-trig.known-leg-as-hypotenuse',
  rootUnsquared: 'mc.right-triangles-trig.roots-sum-of-unsquared-components',
} as const;

// ---------- text helpers ----------
const A = (s: string | number) => `<b class="a">${s}</b>`;
const B = (s: string | number) => `<b class="b">${s}</b>`;
const S = (s: string | number) => `<b class="s">${s}</b>`;
const I = (s: string) => `<i>${s}</i>`;
const p2 = (s: string | number) => `${s}<sup>2</sup>`;
const rt = (n: number | string) => `√<span style="border-top:1.5px solid currentColor;padding:1px 1px 0">${n}</span>`;
type Unit = 'in' | 'ft' | 'yd' | 'm' | 'cm' | 'mi';
const SQW: Record<Unit, string> = { in: 'sq in', ft: 'sq ft', yd: 'sq yd', m: 'sq m', cm: 'sq cm', mi: 'sq mi' };
const tu = (v: number | string, u: Unit) => `${v}\\text{ ${u}}`;
/** TeX of x - y with a negative y in brackets */
const minus = (x: number, y: number) => `${x < 0 ? `-${-x}` : x} - ${y < 0 ? `(-${-y})` : y}`;
const neg = (v: number) => (v < 0 ? `−${-v}` : String(v));
const ptH = (n: string, p: V) => `${n}(${neg(p[0])}, ${neg(p[1])})`;

interface Opt { t: string; ok?: boolean; mc?: string; say: string }
/** a choice item: the options are shuffled; exactly one is right; a repeated text is dropped */
function choiceItem(R: () => number, base: Omit<PtItem, 'input' | 'choices' | 'answer' | 'check'>, opts: Opt[]): PtItem {
  const kept: Opt[] = [];
  for (const x of [...opts.filter(y => y.ok), ...opts.filter(y => !y.ok)]) if (!kept.some(k => k.t === x.t)) kept.push(x);
  const o = shuffle(R, kept);
  const right = o.findIndex(x => x.ok);
  if (right < 0 || o.filter(x => x.ok).length !== 1) throw new Error(`${base.family}: exactly one right option`);
  return {
    ...base, input: 'choice', choices: o.map(x => x.t), answer: { kind: 'choice', i: right },
    check: (r: Response): Verdict => {
      const x = r.kind === 'choice' ? o[r.i] : undefined;
      if (!x) return { ok: false, say: 'Pick one of the options.' };
      return x.ok ? { ok: true, say: x.say } : { ok: false, mc: x.mc, say: x.say };
    },
  };
}
interface Slip { v: number; mc?: string; say: string; tol?: number }
/** a number item: exact, or within `tol` (a tenth answer is exact to the tenth); known slips are classified in order */
function numItem(base: Omit<PtItem, 'input' | 'answer' | 'check'>, ans: number, okSay: string, slips: Slip[], other: string): PtItem {
  return {
    ...base, input: 'num', answer: { kind: 'num', v: ans },
    check: (r: Response): Verdict => {
      if (r.kind !== 'num' || !Number.isFinite(r.v)) return { ok: false, say: 'Type a number.' };
      if (near(r.v, ans)) return { ok: true, say: okSay };
      const s = slips.find(x => Number.isFinite(x.v) && !near(x.v, ans, Math.max(1e-6, (x.tol ?? 0) * 0.999)) && Math.abs(x.v - r.v) <= (x.tol ?? 1e-6));
      return s ? { ok: false, mc: s.mc, say: s.say } : { ok: false, say: other };
    },
  };
}

// ---------- triangles in a pose ----------
type Pose = 'q0' | 'q1' | 'q2' | 'q3' | 'f0' | 'f1' | 'f2' | 'f3' | 'apex';
const POSES: readonly Pose[] = ['q0', 'q1', 'q2', 'q3', 'f0', 'f1', 'f2', 'f3', 'apex'];
function posed(a: number, b: number, pose: Pose): [Pt, Pt, Pt] {
  if (pose === 'apex') {
    // the hypotenuse flat at the bottom, the right angle on top
    const P = rightPts(a, b);
    const ang = Math.atan2(P[2][1] - P[1][1], P[2][0] - P[1][0]);
    const rot = (p: Pt): Pt => [p[0] * Math.cos(-ang) - p[1] * Math.sin(-ang), p[0] * Math.sin(-ang) + p[1] * Math.cos(-ang)];
    let Q = P.map(rot) as [Pt, Pt, Pt];
    if (Q[0][1] < Q[1][1]) Q = Q.map(p => [-p[0], -p[1]] as Pt) as [Pt, Pt, Pt];
    return Q;
  }
  return rightPts(a, b, { rot: Number(pose[1]) as 0 | 1 | 2 | 3, flip: pose[0] === 'f' });
}
/** drawn legs: the ratio stays between 0.42 and 2.4 (labels carry the numbers) */
function drawn(a: number, b: number): [number, number] {
  const r = Math.min(2.4, Math.max(0.42, a / b));
  return r >= 1 ? [5, 5 / r] : [5 * r, 5];
}
const triPic = (a: number, b: number, pose: Pose, labels: Partial<Record<SideId, string>>, extra: Partial<TriPic> = {}): TriPic => {
  const [da, db] = drawn(a, b);
  return { kind: 'tri', pts: posed(da, db, pose), right: true, labels, ...extra };
};

// ---------- number sets from the topic JSON cases ----------
const FLUENT: readonly [number, number, number][] = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15]];
const APPLIED: readonly [number, number, number][] = [[8, 15, 17], [7, 24, 25], [20, 21, 29], [12, 16, 20], [15, 20, 25], [10, 24, 26]];
const DECIMAL: readonly [number, number, number][] = [[0.6, 0.8, 1], [0.3, 0.4, 0.5], [1.5, 2, 2.5], [0.9, 1.2, 1.5], [1.2, 1.6, 2], [0.5, 1.2, 1.3], [2.4, 3.2, 4]];
const NONRIGHT: readonly [number, number, number][] = [[4, 5, 6], [5, 6, 7], [6, 7, 8], [7, 8, 9], [5, 5, 6], [6, 6, 6], [4, 5, 8], [3, 5, 7], [5, 7, 10], [6, 8, 12], [4, 6, 9], [7, 9, 13], [6, 8, 11], [5, 7, 9], [8, 10, 13], [9, 10, 14]];
const NEARMISS_BIG: readonly [number, number, number][] = [[10, 20, 23], [12, 16, 21], [15, 20, 26], [9, 12, 16], [5, 12, 14], [8, 15, 18], [7, 24, 26], [20, 21, 30], [16, 30, 33]];
const decimals = (x: number) => (String(x).split('.')[1] ?? '').length;
/** the "keep the base's decimal places" slip: 0.6² -> 3.6 */
const wrongSq = (x: number) => { const d = decimals(x); return d ? sq(x * 10 ** d) / 10 ** d : sq(x); };
const UNITS_US: readonly Unit[] = ['in', 'ft', 'yd'];

// ===================== 1. identify-hyp-legs =====================
const VSETS: readonly [string, string, string][] = [['P', 'Q', 'R'], ['D', 'E', 'F'], ['J', 'K', 'L'], ['X', 'Y', 'Z'], ['M', 'N', 'T'], ['G', 'H', 'K'], ['S', 'U', 'V'], ['A', 'B', 'C']];
const LETTERS: readonly [string, string, string][] = [['a', 'b', 'c'], ['x', 'y', 'z'], ['d', 'e', 'f'], ['p', 'q', 'r'], ['r', 's', 't'], ['m', 'n', 'k'], ['c', 'd', 'e'], ['a', 'c', 'x']];
const hypOpp: Gen = (R, n) => {
  const [a, b] = pick(R, [[3, 4], [4, 3], [2, 5], [5, 2], [3, 3], [1, 3], [3, 1], [4, 6], [2, 2]] as const);
  const pose = pick(R, POSES);
  const base = { id: `hypOpp-${n}`, family: 'hypOpp' as const, board: `\\text{hypotenuse} = \\,?` };
  if (R() < 0.5) {
    const vs = shuffle(R, [...pick(R, VSETS)]) as [string, string, string];   // vs[0] = the right angle
    const nm = (x: string, y: string) => [x, y].sort().join('');
    const hyp = nm(vs[1], vs[2]), l1 = nm(vs[0], vs[1]), l2 = nm(vs[0], vs[2]);
    const legSay = (l: string) => `${l} touches the right angle at ${vs[0]}, so it is a leg. The hypotenuse is the side ACROSS from the right angle.`;
    return choiceItem(R, {
      ...base, prompt: `Triangle ${[...vs].sort().join('')} has its right angle at ${vs[0]} (marked). Which side is the hypotenuse?`,
      picture: { pic: { kind: 'tri', pts: posed(a, b, pose), right: true, verts: vs } },
      solution: [`The right angle is at ${vs[0]}.`, `The hypotenuse is across from it: the side that does not touch ${vs[0]}, ${S(hyp)}.`, `${l1} and ${l2} make the right angle: they are the legs.`],
    }, [
      { t: hyp, ok: true, say: `Yes: ${hyp} is across from the right angle at ${vs[0]}.` },
      { t: l1, mc: MC.visual, say: legSay(l1) }, { t: l2, mc: MC.visual, say: legSay(l2) },
    ]);
  }
  // side letters in any order: the hypotenuse is often NOT c
  const L = shuffle(R, [...pick(R, LETTERS)]) as [string, string, string];   // L[0] on leg a, L[1] on leg b, L[2] on the hypotenuse
  const legSay = (l: string) => l === 'c'
    ? `The letter c does not make a side the hypotenuse. Side ${I('c')} touches the right angle, so it is a leg.`
    : `Side ${I(l)} touches the right angle, so it is a leg. The hypotenuse is across from the right angle.`;
  return choiceItem(R, {
    ...base, prompt: `The sides of this right triangle are named ${I(L[0])}, ${I(L[1])} and ${I(L[2])}. Which one is the hypotenuse?`,
    picture: { pic: triPic(a, b, pose, { a: L[0], b: L[1], c: L[2] }) },
    solution: [`Find the right-angle mark.`, `The hypotenuse is the side across from it (it does not touch the mark): ${S(I(L[2]))}.`, `Its name does not matter: any letter can name any side.`],
  }, [
    { t: L[2], ok: true, say: `Yes: ${I(L[2])} is across from the right angle.` },
    { t: L[0], mc: L[0] === 'c' ? MC.hypC : MC.visual, say: legSay(L[0]) },
    { t: L[1], mc: L[1] === 'c' ? MC.hypC : MC.visual, say: legSay(L[1]) },
  ]);
};
const embedded: Gen = (R, n) => {
  if (R() < 0.55) {
    const letters = pick(R, [['A', 'B', 'C', 'D'], ['P', 'Q', 'R', 'S'], ['K', 'L', 'M', 'N'], ['E', 'F', 'G', 'H']] as const) as unknown as [string, string, string, string];
    const [w, h] = pick(R, [[6, 3], [3, 6], [5, 4], [4, 5], [7, 3], [3, 7]] as const);
    const diag = R() < 0.5 ? 'AC' : 'BD';
    const [i0, i1] = diag === 'AC' ? [0, 2] : [1, 3];
    const third = pick(R, [0, 1, 2, 3].filter(i => i !== i0 && i !== i1));
    const tri = [i0, third, i1].sort().map(i => letters[i]!).join('');
    const D = letters[i0]! + letters[i1]!, l1 = [letters[i0]!, letters[third]!].sort().join(''), l2 = [letters[third]!, letters[i1]!].sort().join('');
    const legSay = (l: string) => `${l} is a side of the rectangle. It meets the other side at the square corner ${letters[third]}, so it is a leg.`;
    return choiceItem(R, {
      id: `embedded-${n}`, family: 'embedded',
      prompt: `${letters.join('')} is a rectangle with the diagonal ${D}. In triangle ${tri}, which side is the hypotenuse?`,
      board: `\\triangle ${tri}:\\ \\text{hypotenuse} = \\,?`,
      picture: { pic: rectSketch(w, h, diag, tri, letters) },
      solution: [`A rectangle has four right angles. Triangle ${tri} has its right angle at ${letters[third]}.`, `The side across from ${letters[third]} is the diagonal ${S(D)}: the hypotenuse.`],
    }, [
      { t: D, ok: true, say: `Yes: the diagonal ${D} is across from the square corner at ${letters[third]}.` },
      { t: l1, mc: MC.visual, say: legSay(l1) }, { t: l2, mc: MC.visual, say: legSay(l2) },
    ]);
  }
  const letters = pick(R, [['P', 'Q', 'R', 'M'], ['A', 'B', 'C', 'D'], ['T', 'U', 'V', 'W'], ['K', 'L', 'N', 'H']] as const) as unknown as [string, string, string, string];
  const [P, Q, Rr, M] = letters;
  const [base, height] = pick(R, [[6, 4], [8, 3], [4, 5], [10, 4], [6, 6]] as const);
  const left = R() < 0.5, X = left ? Q : Rr, tri = [P, X, M].join('');
  const hyp = P + X;
  return choiceItem(R, {
    id: `embedded-${n}`, family: 'embedded',
    prompt: `${P}${Q}${Rr} is an isosceles triangle. The height ${P}${M} meets ${Q}${Rr} at a right angle. In triangle ${tri}, which side is the hypotenuse?`,
    board: `\\triangle ${tri}:\\ \\text{hypotenuse} = \\,?`,
    picture: { pic: isoSketch(base, height, letters) },
    solution: [`The height makes a right angle at ${M}.`, `In triangle ${tri}, the side across from ${M} is ${S(hyp)}: the hypotenuse.`, `${P}${M} and ${X}${M} touch the right angle: they are the legs.`],
  }, [
    { t: hyp, ok: true, say: `Yes: ${hyp} is across from the right angle at ${M}.` },
    { t: P + M, mc: MC.visual, say: `${P}${M} stands straight up, but it touches the right angle at ${M}: it is a leg.` },
    { t: X === Q ? Q + M : M + Rr, mc: MC.visual, say: `That side lies along the bottom and touches the right angle: it is a leg.` },
    { t: Q + Rr, mc: MC.visual, say: `${Q}${Rr} is the bottom of the big triangle, not a side of triangle ${tri}.` },
  ]);
};

// ===================== 2. tilted-square-area =====================
const TILTS: readonly [number, number][] = [[1, 2], [2, 1], [1, 3], [3, 1], [2, 3], [3, 2], [1, 4], [4, 1], [3, 4], [4, 3], [2, 4], [4, 2], [1, 5], [5, 1], [2, 5], [5, 2]];
const tiltArea: Gen = (R, n) => {
  const [p, q] = pick(R, TILTS);
  const T = tilted(p, q), cor = 2 * p * q;
  return numItem({
    id: `tiltArea-${n}`, family: 'tiltArea',
    prompt: `The tilted square is drawn on grid paper (each grid square is 1 square unit). Each of its sides goes ${q} across and ${p} up or down. What is its area?`,
    board: `\\text{area} = \\,?`, unit: 'square units',
    picture: { pic: { kind: 'tilt', p, q } },
    solution: [`Surround it with an upright ${T.n} by ${T.n} square: ${T.surround} square units.`, `Take away the 4 corner triangles, each ${p} by ${q}: 4 × ${fmt(T.corner)} = ${cor}.`, `${T.surround} − ${cor} = ${S(T.area)} square units.`],
    steps: [`\\text{surround} = ${T.n}^2 = ${T.surround}`, `\\text{corners} = 4 \\times ${fmt(T.corner)} = ${cor}`, `\\text{area} = ${T.surround} - ${cor} = ${T.area}`],
  }, T.area, `Yes: ${T.surround} − ${cor} = ${T.area} square units.`, [
    { v: q * q, mc: MC.tiltRun, say: `${q} × ${q} uses the run along the grid as the side. The tilted side is longer than ${q}: surround it and take away the corners.` },
    { v: wholeCellsInside(p, q), mc: MC.partial, say: `That counts only the whole grid squares inside. The cut squares on the edges have area too.` },
    { v: T.surround, say: `${T.surround} is the whole upright square. Take away the 4 corner triangles.` },
  ], 'Surround the tilted square with an upright square, then take away the 4 corner triangles.');
};
const tiltSteps: Gen = (R, n) => {
  const [p, q] = pick(R, TILTS);
  const T = tilted(p, q);
  return choiceItem(R, {
    id: `tiltSteps-${n}`, family: 'tiltSteps',
    prompt: `Which calculation gives the area of the tilted square? (Each corner triangle has legs ${p} and ${q}.)`,
    board: `\\text{area} = \\,?`,
    picture: { pic: { kind: 'tilt', p, q, corners: true } },
    solution: [`The upright square around it is ${T.n} by ${T.n}: ${T.surround}.`, `Each corner triangle is half of ${p} × ${q}: ${fmt(T.corner)}.`, `Area = ${S(`${T.n} × ${T.n} − 4 × ${fmt(T.corner)} = ${T.area}`)}.`],
    steps: [`${T.n} \\times ${T.n} - 4 \\times ${fmt(T.corner)}`, `= ${T.surround} - ${2 * p * q} = ${T.area}`],
  }, [
    { t: `${T.n} × ${T.n} − 4 × ${fmt(T.corner)}`, ok: true, say: `Yes: the surround, minus the 4 corners: ${T.area} square units.` },
    { t: `${T.n} × ${T.n}`, say: `That is the whole upright square. The 4 corner triangles are not part of the tilted square.` },
    { t: `${q} × ${q}`, mc: MC.tiltRun, say: `${q} is the run of one side along the grid. The tilted side itself is longer.` },
    { t: `4 × ${fmt(T.corner)}`, say: `That is the area of the 4 corners, the part to take AWAY.` },
  ]);
};

// ===================== 3. area-relationship =====================
const AREA_SETS: readonly [number, number][] = [[3, 4], [1, 2], [2, 3], [1, 3], [2, 4], [6, 8], [5, 12], [1, 1], [2, 2]];
const missingSq: Gen = (R, n) => {
  const [a, b] = pick(R, AREA_SETS);
  const A2 = a * a, B2 = b * b, C2 = A2 + B2;
  const miss = pick(R, ['c', 'c', 'a', 'b'] as const);
  const areas: Partial<Record<SideId, string>> = { a: miss === 'a' ? '?' : String(A2), b: miss === 'b' ? '?' : String(B2), c: miss === 'c' ? '?' : String(C2) };
  const ans = miss === 'c' ? C2 : miss === 'a' ? A2 : B2, known = miss === 'a' ? B2 : A2;
  const u = pick(R, UNITS_US);
  return numItem({
    id: `missingSq-${n}`, family: 'missingSq',
    prompt: miss === 'c'
      ? `Squares are built on the sides of a right triangle. The squares on the legs have areas ${A(A2)} and ${B(B2)} ${SQW[u]}. What is the area of the square on the hypotenuse?`
      : `Squares are built on the sides of a right triangle. The square on the hypotenuse has area ${S(C2)} ${SQW[u]}, one leg's square ${A(known)} ${SQW[u]}. What is the area of the other leg's square?`,
    board: miss === 'c' ? `${A2} + ${B2} = \\,?` : `${known} + \\,? = ${C2}`, unit: SQW[u],
    picture: { pic: triPic(a, b, pick(R, POSES), {}, { squares: ['a', 'b', 'c'], areas, now: true }) },
    solution: miss === 'c'
      ? [`The two leg squares together cover the hypotenuse square exactly.`, `${A2} + ${B2} = ${S(C2)} ${SQW[u]}.`]
      : [`The two leg squares together make the hypotenuse square: ${known} + ? = ${C2}.`, `? = ${C2} − ${known} = ${S(ans)} ${SQW[u]}.`],
    steps: miss === 'c' ? [`${A2} + ${B2} = ${C2}`] : [`${C2} - ${known} = ${ans}`],
  }, ans, `Yes: ${ans} ${SQW[u]}.`, [
    ...(miss !== 'c' ? [{ v: C2 + known, mc: MC.legAdds, say: `The hypotenuse square is the BIGGEST one. A leg square is what is left: ${C2} − ${known}.` }] : []),
    { v: Math.sqrt(ans), mc: MC.unitDim, say: `${fmt(Math.sqrt(ans))} would be the side length. The question asks for the AREA of the square.` },
  ], miss === 'c' ? 'Add the areas of the two leg squares.' : 'Take the known leg square away from the hypotenuse square.');
};
const unitsAreas: Gen = (R, n) => {
  const [a, b, c] = pick(R, [...FLUENT, [8, 15, 17]] as [number, number, number][]);
  const u = pick(R, UNITS_US);
  const v = int(R, 0, 2);
  const pic = { pic: triPic(a, b, pick(R, POSES), { a: tu(a, u), b: tu(b, u), c: '?' }, { squares: ['a', 'b', 'c'] as SideId[], areas: { a: String(a * a), b: String(b * b), c: String(c * c) } }) };
  if (v === 0) return choiceItem(R, {
    id: `unitsAreas-${n}`, family: 'unitsAreas',
    prompt: `The legs are ${A(`${a} ${u}`)} and ${B(`${b} ${u}`)}. The squares on the sides have areas ${a * a}, ${b * b} and ${c * c}. What does ${S(c * c)} measure?`,
    board: `${a * a} + ${b * b} = ${c * c}`, picture: pic,
    solution: [`${c * c} is the area of the square built on the hypotenuse, in ${SQW[u]}.`, `The hypotenuse itself is the side of that square: ${c} ${u}.`, `The triangle is only half of an ${a} by ${b} rectangle: ${fmt(a * b / 2)} ${SQW[u]}.`],
  }, [
    { t: `The area of the square on the hypotenuse, in ${SQW[u]}`, ok: true, say: `Yes: a square's area, in ${SQW[u]}.` },
    { t: `The length of the hypotenuse, in ${u}`, mc: MC.rSquared, say: `${c * c} is a SQUARE's area. The hypotenuse is its side: √${c * c} = ${c} ${u}.` },
    { t: `The area of the triangle, in ${SQW[u]}`, mc: MC.triArea, say: `The theorem is about the squares ON the sides. The triangle's area is ${fmt(a * b / 2)} ${SQW[u]}.` },
  ]);
  if (v === 1) return choiceItem(R, {
    id: `unitsAreas-${n}`, family: 'unitsAreas',
    prompt: `For this right triangle, ${a * a} + ${b * b} = ${c * c}. What does that say?`,
    board: `${a * a} + ${b * b} = ${c * c}`, picture: pic,
    solution: [`${a * a} and ${b * b} are the areas of the squares on the legs, ${c * c} the area of the square on the hypotenuse.`, `So the two leg squares together cover the hypotenuse square exactly.`],
  }, [
    { t: `The squares on the legs together have the same area as the square on the hypotenuse`, ok: true, say: `Yes: it is about the areas of the three squares.` },
    { t: `The triangle has an area of ${c * c} ${SQW[u]}`, mc: MC.triArea, say: `The triangle is much smaller: ${fmt(a * b / 2)} ${SQW[u]}. The numbers are the areas of the squares on the sides.` },
    { t: `The legs are ${a * a} ${u} and ${b * b} ${u} long`, mc: MC.unitDim, say: `${a * a} and ${b * b} are AREAS of squares, in ${SQW[u]}. The legs are ${a} ${u} and ${b} ${u}.` },
  ]);
  return choiceItem(R, {
    id: `unitsAreas-${n}`, family: 'unitsAreas',
    prompt: `The legs of a right triangle are ${A(`${a} ${u}`)} and ${B(`${b} ${u}`)}. What is the area of the square built on the hypotenuse?`,
    board: `${a}^2 + ${b}^2 = \\,?`, picture: { pic: triPic(a, b, pick(R, POSES), { a: tu(a, u), b: tu(b, u), c: '?' }, { squares: ['a', 'b', 'c'] }) },
    solution: [`The leg squares are ${a * a} and ${b * b} ${SQW[u]}.`, `Together they cover the hypotenuse square: ${S(`${c * c} ${SQW[u]}`)}.`],
  }, [
    { t: `${c * c} ${SQW[u]}`, ok: true, say: `Yes: ${a * a} + ${b * b} = ${c * c} ${SQW[u]}.` },
    { t: `${c * c} ${u}`, mc: MC.unitDim, say: `An area is in square units: ${SQW[u]}, not ${u}.` },
    { t: `${c} ${SQW[u]}`, mc: MC.unitDim, say: `${c} ${u} is the hypotenuse's LENGTH. Its square has area ${c * c} ${SQW[u]}.` },
    { t: `${fmt(a * b / 2)} ${SQW[u]}`, mc: MC.triArea, say: `${fmt(a * b / 2)} is the area of the triangle, not of the square on the hypotenuse.` },
  ]);
};

// ===================== 4. symbolic-equation =====================
const writeEq: Gen = (R, n) => {
  const [a, b] = pick(R, [[3, 4], [4, 3], [2, 5], [5, 2], [3, 3], [4, 6], [6, 4]] as const);
  const pose = pick(R, POSES);
  if (R() < 0.5) {
    const L = shuffle(R, [...pick(R, LETTERS)]) as [string, string, string];
    const [l0, l1, h] = L;
    const wrong1 = `${I(l0)}<sup>2</sup> + ${I(h)}<sup>2</sup> = ${I(l1)}<sup>2</sup>`;
    return choiceItem(R, {
      id: `writeEq-${n}`, family: 'writeEq',
      prompt: `Which equation is true for this right triangle?`,
      board: `?^2 + ?^2 = ?^2`,
      picture: { pic: triPic(a, b, pose, { a: l0, b: l1, c: h }) },
      solution: [`The hypotenuse is across from the right angle: ${I(h)}.`, `Its square goes alone on one side: ${S(`${p2(I(l0))} + ${p2(I(l1))} = ${p2(I(h))}`)}.`, `The letters can be anything; the hypotenuse decides the equation.`],
      steps: [`${l0}^2 + ${l1}^2 = ${h}^2`],
    }, [
      { t: `${p2(I(l0))} + ${p2(I(l1))} = ${p2(I(h))}`, ok: true, say: `Yes: the two legs squared add up to the hypotenuse squared.` },
      { t: wrong1, mc: l1 === 'c' ? MC.hypC : MC.knownLegHyp, say: `${I(l1)} touches the right angle: it is a leg, so its square cannot be alone on one side.` },
      { t: `${I(l0)} + ${I(l1)} = ${I(h)}`, mc: MC.addLengths, say: `The lengths do not add up. Their SQUARES do: ${p2(I(l0))} + ${p2(I(l1))} = ${p2(I(h))}.` },
    ]);
  }
  const vs = shuffle(R, [...pick(R, VSETS)]) as [string, string, string];
  const [v0, v1, v2] = vs;
  const s = (x: string, y: string) => x + y;
  return choiceItem(R, {
    id: `writeEq-${n}`, family: 'writeEq',
    prompt: `Triangle ${v0}${v1}${v2} has its right angle at ${v0}. Which equation is true?`,
    board: `?^2 + ?^2 = ?^2`,
    picture: { pic: { kind: 'tri', pts: posed(a, b, pose), right: true, verts: vs } },
    solution: [`The right angle is at ${v0}, so the hypotenuse is ${v1}${v2} (it does not touch ${v0}).`, `${S(`${p2(s(v0, v1))} + ${p2(s(v0, v2))} = ${p2(s(v1, v2))}`)}.`],
    steps: [`${v0}${v1}^2 + ${v0}${v2}^2 = ${v1}${v2}^2`],
  }, [
    { t: `${p2(s(v0, v1))} + ${p2(s(v0, v2))} = ${p2(s(v1, v2))}`, ok: true, say: `Yes: ${v1}${v2} is across from the right angle at ${v0}.` },
    { t: `${p2(s(v0, v1))} + ${p2(s(v1, v2))} = ${p2(s(v0, v2))}`, mc: MC.knownLegHyp, say: `${v0}${v2} touches the right angle at ${v0}: it is a leg. The hypotenuse is ${v1}${v2}.` },
    { t: `${s(v0, v1)} + ${s(v0, v2)} = ${s(v1, v2)}`, mc: MC.addLengths, say: `The lengths do not add up; their squares do.` },
  ]);
};
const legOrHyp: Gen = (R, n, sg) => {
  const [a, b, c] = pick(R, sg === 'find-leg' ? [...FLUENT, ...APPLIED] : FLUENT);
  const u = pick(R, UNITS_US), pose = pick(R, POSES);
  const legUnknown = R() < 0.6;
  if (legUnknown) {
    // x is a leg: c and a are known
    return choiceItem(R, {
      id: `legOrHyp-${n}`, family: 'legOrHyp',
      prompt: `A right triangle has sides ${a} ${u} and ${c} ${u}, and an unknown side ${I('x')}. Which equation finds ${I('x')}?`,
      board: `x = \\,?`,
      picture: { pic: triPic(a, b, pose, { a: tu(a, u), b: 'x', c: tu(c, u) }) },
      solution: [`${c} ${u} is across from the right angle: it is the hypotenuse; ${I('x')} is a leg.`, `${p2(a)} + ${p2(I('x'))} = ${p2(c)}, so ${S(`${p2(I('x'))} = ${p2(c)} − ${p2(a)}`)}.`, `${p2(I('x'))} = ${c * c} − ${a * a} = ${b * b}, ${I('x')} = ${b} ${u}.`],
      steps: [`${a}^2 + x^2 = ${c}^2`, `x^2 = ${c}^2 - ${a}^2 = ${b * b}`, `x = ${b}`],
    }, [
      { t: `${p2(I('x'))} = ${p2(c)} − ${p2(a)}`, ok: true, say: `Yes: ${I('x')} is a leg, so take the other leg's square away from the hypotenuse's square.` },
      { t: `${p2(I('x'))} = ${p2(a)} + ${p2(c)}`, mc: MC.unknownHyp, say: `That treats ${I('x')} as the hypotenuse. But ${c} is across from the right angle: ${I('x')} is a leg.` },
      { t: `${I('x')} = ${c} − ${a}`, mc: MC.addLengths, say: `Lengths do not subtract like that. Work with the squares: ${p2(I('x'))} = ${p2(c)} − ${p2(a)}.` },
    ]);
  }
  return choiceItem(R, {
    id: `legOrHyp-${n}`, family: 'legOrHyp',
    prompt: `The legs of a right triangle are ${a} ${u} and ${b} ${u}; ${I('x')} is the third side. Which equation finds ${I('x')}?`,
    board: `x = \\,?`,
    picture: { pic: triPic(a, b, pose, { a: tu(a, u), b: tu(b, u), c: 'x' }) },
    solution: [`${I('x')} is across from the right angle: it is the hypotenuse.`, `${S(`${p2(I('x'))} = ${p2(a)} + ${p2(b)}`)} = ${a * a + b * b}, so ${I('x')} = ${c} ${u}.`],
    steps: [`x^2 = ${a}^2 + ${b}^2 = ${c * c}`, `x = ${c}`],
  }, [
    { t: `${p2(I('x'))} = ${p2(a)} + ${p2(b)}`, ok: true, say: `Yes: ${I('x')} is the hypotenuse, so add the squares of the legs.` },
    { t: `${p2(I('x'))} = ${p2(b)} − ${p2(a)}`, mc: MC.knownLegHyp, say: `That puts the leg ${b} where the hypotenuse goes. ${I('x')} is across from the right angle.` },
    { t: `${I('x')} = ${a} + ${b}`, mc: MC.addLengths, say: `The legs do not add up to the hypotenuse; their squares do.` },
  ]);
};

// ===================== 5. right-triangles-only =====================
const holdsOrNot: Gen = (R, n) => {
  const right = R() < 0.4;
  const s = right ? pick(R, FLUENT) : pick(R, NONRIGHT);
  const [a, b, c] = sorted3(s);
  const sum = a * a + b * b, k = kind3(s);
  const shown = shuffle(R, [a, b, c]) as [number, number, number];
  const pic = { pic: sssSketch(shown, shown.map(String) as [string, string, string], right ? { mark: 'now' } : {}) };
  const verdict = k === 'right' ? `${sum} = ${c * c}: it holds.` : `${sum} ≠ ${c * c}: it fails (the triangle is ${k === 'acute' ? 'acute' : 'obtuse'}).`;
  if (R() < 0.55) return numItem({
    id: `holdsOrNot-${n}`, family: 'holdsOrNot',
    prompt: `A triangle has sides ${shown.join(', ')}${right ? ' (a right triangle)' : ''}. Work out ${p2('a')} + ${p2('b')} for its two shorter sides, a = ${a} and b = ${b}.`,
    board: `${a}^2 + ${b}^2 = \\,?`, picture: pic,
    solution: [`Square each side first, then add: ${p2(a)} + ${p2(b)} = ${a * a} + ${b * b} = ${S(sum)}.`, `The longest side: ${p2(c)} = ${c * c}. ${verdict}`],
    steps: [`${a}^2 + ${b}^2 = ${a * a} + ${b * b} = ${sum}`, `${c}^2 = ${c * c}`],
  }, sum, `Yes: ${sum}. And ${p2(c)} = ${c * c}, so ${verdict}`, [
    { v: 2 * a + 2 * b, mc: MC.timesTwo, say: `${p2(a)} means ${a} × ${a}, not ${a} × 2.` },
    { v: a + b, mc: MC.addLengths, say: `That adds the sides. Square each one first: ${a} × ${a} and ${b} × ${b}.` },
    { v: (a + b) ** 2, say: `That squares the sum. Square each side first, then add.` },
  ], `Square each side first, then add: ${a} × ${a} + ${b} × ${b}.`);
  return choiceItem(R, {
    id: `holdsOrNot-${n}`, family: 'holdsOrNot',
    prompt: `A triangle has sides ${shown.join(', ')}${right ? ' and a right angle (marked)' : ', and no right angle'}. Is ${p2('a')} + ${p2('b')} = ${p2('c')} true for it (c the longest side)?`,
    board: `${a}^2 + ${b}^2 \\overset{?}{=} ${c}^2`, picture: pic,
    solution: [`${p2(a)} + ${p2(b)} = ${sum}, ${p2(c)} = ${c * c}.`, `${verdict}`, `The theorem promises the equation only for RIGHT triangles.`],
    steps: [`${a}^2 + ${b}^2 = ${sum}`, `${c}^2 = ${c * c}`],
  }, [
    { t: 'Yes: it is a right triangle, so the squares match', ok: k === 'right', say: k === 'right' ? `Yes: ${sum} = ${c * c}.` : `It has no right angle: ${sum} ≠ ${c * c}.` },
    { t: 'No: the squares do not match', ok: k !== 'right', say: k !== 'right' ? `Right: ${sum} ≠ ${c * c}.` : `Check: ${sum} = ${c * c}. In a right triangle the squares always match.` },
    { t: 'Yes: it is true for every triangle', mc: MC.noRight, say: k === 'right' ? `True here, but not for every triangle: try 4, 5, 6 (41 ≠ 36). It needs the right angle.` : `Not for this one: ${sum} ≠ ${c * c}. The equation needs a right angle.` },
  ]);
};
const counterEx: Gen = (R, n) => {
  const ex = shuffle(R, [...FLUENT]).slice(0, int(R, 2, 3)) as [number, number, number][];
  const bad = pick(R, NONRIGHT);
  const [a, b, c] = sorted3(bad);
  const name = pick(R, ['Kai', 'Rosa', 'Theo', 'Nia', 'Omar', 'Lena']);
  const exT = ex.map(t => t.join('-')).join(', ');
  const [e0, e1, e2] = ex[0]!;
  return choiceItem(R, {
    id: `counterEx-${n}`, family: 'counterEx',
    prompt: `${name} checked the triangles ${exT}: ${p2('a')} + ${p2('b')} = ${p2('c')} worked every time. ${name} says it works for EVERY triangle. What settles the question?`,
    board: `a^2 + b^2 = c^2\\ \\text{always?}`,
    picture: { pic: sssSketch([e0, e1, e2], [String(e0), String(e1), String(e2)], { mark: 'now' }) },
    solution: [`All of ${name}'s triangles are RIGHT triangles.`, `One triangle where it fails is enough: ${a}, ${b}, ${c} gives ${a * a} + ${b * b} = ${a * a + b * b}, but ${p2(c)} = ${c * c}.`, `So the equation is not true for every triangle: it needs the right angle.`],
    steps: [`${a}^2 + ${b}^2 = ${a * a + b * b}`, `${c}^2 = ${c * c}`],
  }, [
    { t: `One triangle where it fails: ${a}, ${b}, ${c} gives ${a * a + b * b}, but ${p2(c)} = ${c * c}`, ok: true, say: `Yes: one counterexample is enough to show it is not true for every triangle.` },
    { t: `The ${ex.length} examples prove it`, mc: MC.examples, say: `Examples that work cannot prove "every". And all of them are right triangles.` },
    { t: `It is true: the Pythagorean theorem says so`, mc: MC.noRight, say: `The theorem is only about RIGHT triangles. Try ${a}, ${b}, ${c}: it fails.` },
  ]);
};

// ===================== 6-8. find-hypotenuse, find-leg, decimal-sides =====================
function sideSet(R: () => number, sg?: string): { t: [number, number, number]; u: Unit; calc: boolean } {
  if (sg === 'decimal-sides') return { t: pick(R, DECIMAL), u: pick(R, ['in', 'ft', 'm', 'cm'] as Unit[]), calc: false };
  const applied = R() < (sg === 'find-hypotenuse' || sg === 'find-leg' ? 0.35 : 0.2);
  return { t: pick(R, applied ? APPLIED : FLUENT), u: pick(R, UNITS_US), calc: applied };
}
const hyp: Gen = (R, n, sg) => {
  const { t: [x, y, c], u, calc } = sideSet(R, sg);
  const [a, b] = R() < 0.5 ? [x, y] : [y, x];
  const A2 = sq(a), B2 = sq(b), S2 = A2 + B2;
  const dec = decimals(a) + decimals(b) > 0;
  const wrong = Math.sqrt(wrongSq(a) + wrongSq(b));
  return numItem({
    id: `hyp-${n}`, family: 'hyp',
    prompt: `The legs of a right triangle are ${A(`${a} ${u}`)} and ${B(`${b} ${u}`)}. How long is the hypotenuse?${calc ? ' (Calculator allowed.)' : ''}`,
    board: `c^2 = ${a}^2 + ${b}^2`, unit: u,
    picture: { pic: triPic(a, b, pick(R, POSES), { a: tu(a, u), b: tu(b, u), c: '?' }, { squares: ['a', 'b', 'c'], areas: { a: fmt(A2), b: fmt(B2), c: fmt(S2) } }) },
    solution: [`Square the legs: ${p2(a)} = ${fmt(A2)}, ${p2(b)} = ${fmt(B2)}.`, `Add: ${p2('c')} = ${fmt(A2)} + ${fmt(B2)} = ${fmt(S2)}.`, `Take the root: c = ${rt(fmt(S2))} = ${S(`${fmt(c)} ${u}`)}.`],
    steps: [`c^2 = ${fmt(A2)} + ${fmt(B2)} = ${fmt(S2)}`, `c = \\sqrt{${fmt(S2)}} = ${fmt(c)}`],
  }, c, `Yes: ${rt(fmt(S2))} = ${fmt(c)} ${u}.`, [
    { v: a + b, mc: MC.addLengths, say: `The legs do not add up to the hypotenuse; their squares do. ${fmt(A2)} + ${fmt(B2)} = ${fmt(S2)}.` },
    { v: S2, mc: MC.rSquared, say: `${fmt(S2)} is ${p2('c')}, the square's area. The hypotenuse is its root.` },
    { v: Math.sqrt(a + b), mc: MC.rootUnsquared, say: `Square the legs BEFORE adding: ${p2(a)} + ${p2(b)}, not ${a} + ${b}.`, tol: 0.06 },
    ...(dec ? [{ v: wrong, mc: MC.decSquare, say: `Check the decimal squares: ${a} × ${a} = ${fmt(A2)} (two decimal places when the side has one).`, tol: 0.06 }] : []),
    { v: S2 / 2, mc: MC.halfRoot, say: `A square root is not half: ${fmt(c)} × ${fmt(c)} = ${fmt(S2)}.` },
  ], `Square the legs, add, then take the square root.`);
};
const rootFinish: Gen = (R, n) => {
  const [a, b, c] = pick(R, [...FLUENT, ...APPLIED]);
  const S2 = c * c;
  const split = R() < 0.5;
  return numItem({
    id: `rootFinish-${n}`, family: 'rootFinish',
    prompt: split ? `A right triangle gives ${p2('c')} = ${a * a} + ${b * b}. How long is c?` : `The square on the hypotenuse has area ${S(S2)}. How long is the hypotenuse c?`,
    board: split ? `c^2 = ${a * a} + ${b * b}` : `c^2 = ${S2}`,
    picture: { pic: squareSketch(String(S2), 'c', `c = ${c}`) },
    solution: [...(split ? [`Add first: ${a * a} + ${b * b} = ${S2}.`] : []), `c is the number whose square is ${S2}: ${c} × ${c} = ${S2}.`, `c = ${rt(S2)} = ${S(c)}.`],
    steps: [...(split ? [`c^2 = ${S2}`] : []), `c = \\sqrt{${S2}} = ${c}`],
  }, c, `Yes: ${c} × ${c} = ${S2}.`, [
    { v: S2, mc: MC.rSquared, say: `${S2} is ${p2('c')}, the area of the square. Its side c is the square root.` },
    { v: S2 / 2, mc: MC.halfRoot, say: `A square root is not half: ${fmt(S2 / 2)} × ${fmt(S2 / 2)} is much more than ${S2}.` },
    ...(split ? [{ v: a + b, mc: MC.partByPart, say: `The root of a sum is not the sum of the roots: ${rt(a * a)} + ${rt(b * b)} = ${a + b}, but ${rt(S2)} = ${c}.` }] : []),
  ], `Which number times itself makes ${S2}?`);
};
const leg: Gen = (R, n, sg) => {
  const { t: [x, y, c], u, calc } = sideSet(R, sg);
  const [k, b] = R() < 0.5 ? [x, y] : [y, x];   // k known leg, b unknown leg
  const C2 = sq(c), K2 = sq(k), D2 = C2 - K2;
  const dec = decimals(c) + decimals(k) > 0;
  return numItem({
    id: `leg-${n}`, family: 'leg',
    prompt: `A right triangle has hypotenuse ${S(`${c} ${u}`)} and one leg ${A(`${k} ${u}`)}. How long is the other leg?${calc ? ' (Calculator allowed.)' : ''}`,
    board: `${k}^2 + x^2 = ${c}^2`, unit: u,
    picture: { pic: triPic(k, b, pick(R, POSES), { a: tu(k, u), b: 'x', c: tu(c, u) }, { squares: ['a', 'b', 'c'], areas: { a: fmt(K2), b: fmt(D2), c: fmt(C2) } }) },
    solution: [`${c} ${u} is the hypotenuse, so ${p2(k)} + ${p2(I('x'))} = ${p2(c)}.`, `${p2(I('x'))} = ${fmt(C2)} − ${fmt(K2)} = ${fmt(D2)}.`, `${I('x')} = ${rt(fmt(D2))} = ${S(`${fmt(b)} ${u}`)}.`],
    steps: [`x^2 = ${fmt(C2)} - ${fmt(K2)} = ${fmt(D2)}`, `x = \\sqrt{${fmt(D2)}} = ${fmt(b)}`],
  }, b, `Yes: ${rt(fmt(D2))} = ${fmt(b)} ${u}.`, [
    { v: Math.sqrt(C2 + K2), mc: MC.legAdds, say: `For a LEG, subtract: the hypotenuse's square is the biggest. ${p2(I('x'))} = ${fmt(C2)} − ${fmt(K2)}.`, tol: 0.06 },
    { v: c - k, mc: MC.addLengths, say: `Lengths do not subtract like that. Subtract the squares: ${fmt(C2)} − ${fmt(K2)}.` },
    { v: D2, mc: MC.rSquared, say: `${fmt(D2)} is ${p2(I('x'))}. Take its square root.` },
    ...(dec ? [{ v: Math.sqrt(Math.abs(wrongSq(c) - wrongSq(k))), mc: MC.decSquare, say: `Check the decimal squares: ${c} × ${c} = ${fmt(C2)}.`, tol: 0.06 }] : []),
  ], `Subtract the squares (hypotenuse squared minus leg squared), then take the square root.`);
};

// ===================== 9-10. approximate-root, irrational-lengths =====================
const NONSQ: readonly number[] = [2, 3, 5, 6, 7, 8, 10, 11, 12, 13, 15, 17, 18, 19, 20, 24, 27, 29, 30, 32, 34, 35, 40, 41, 45, 50, 55, 60, 65, 70, 75, 80, 90, 99, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200, 210, 220];
const bracketRt: Gen = (R, n) => {
  const N = pick(R, NONSQ);
  const [k] = bracket(N);
  const h = Math.floor(N / 2);
  return choiceItem(R, {
    id: `bracketRt-${n}`, family: 'bracketRt',
    prompt: `${rt(N)} lies between which two whole numbers? (No calculator.)`,
    board: `\\,? < \\sqrt{${N}} < \\,?`,
    picture: { pic: lineSketch(k, `\\sqrt{${N}}`, Math.sqrt(N)) },
    solution: [`${p2(k)} = ${k * k} and ${p2(k + 1)} = ${(k + 1) ** 2}.`, `${N} is between them, so ${S(`${k} < ${rt(N)} < ${k + 1}`)}.`],
    steps: [`${k}^2 = ${k * k} < ${N} < ${(k + 1) ** 2} = ${k + 1}^2`, `${k} < \\sqrt{${N}} < ${k + 1}`],
  }, [
    { t: `${k} and ${k + 1}`, ok: true, say: `Yes: ${k * k} < ${N} < ${(k + 1) ** 2}.` },
    ...(k >= 2 ? [{ t: `${k - 1} and ${k}`, say: `${p2(k)} = ${k * k}, still less than ${N}, so ${rt(N)} is more than ${k}.` }] : []),
    { t: `${k + 1} and ${k + 2}`, say: `${p2(k + 1)} = ${(k + 1) ** 2}, already more than ${N}.` },
    ...(h > k + 2 ? [{ t: `${h} and ${h + 1}`, mc: MC.halfRoot, say: `A square root is not half the number: ${h} × ${h} = ${h * h}, far more than ${N}.` }] : []),
  ]);
};
const TENTH_N: readonly number[] = [2, 3, 5, 6, 7, 8, 10, 11, 12, 13, 14, 15, 17, 18, 19, 20, 22, 24, 27, 28, 30, 31, 33, 35, 37, 40, 42, 45, 48, 50, 52, 54, 58, 60, 63, 66, 70, 75, 80, 85, 90, 95, 99];
const tenthRt: Gen = (R, n) => {
  const cut = TENTH_N.filter(x => trunc1(Math.sqrt(x)) !== round1(Math.sqrt(x)));
  const N = R() < 0.6 ? pick(R, cut) : pick(R, TENTH_N);
  const v = Math.sqrt(N), disp = v.toFixed(7), ans = round1(v), [k] = bracket(N);
  return numItem({
    id: `tenthRt-${n}`, family: 'tenthRt',
    prompt: `A calculator shows ${rt(N)} = ${disp}… Round it to the nearest tenth.`,
    board: `\\sqrt{${N}} = ${disp}\\ldots`,
    picture: { pic: lineSketch(k, `\\sqrt{${N}}`, v) },
    solution: [`Look at the hundredths digit of ${disp}: ${disp.split('.')[1]![1]}.`, `${Number(disp.split('.')[1]![1]) >= 5 ? 'It is 5 or more, so round the tenths up' : 'It is less than 5, so the tenths stay'}: ${rt(N)} ≈ ${S(tenth(v))}.`, `Check: ${p2(tenth(v))} = ${fmt(ans * ans)}, close to ${N}.`],
    steps: [`\\sqrt{${N}} \\approx ${tenth(v)}`, `${tenth(v)}^2 = ${fmt(ans * ans)} \\approx ${N}`],
  }, ans, `Yes: ${rt(N)} ≈ ${tenth(v)}.`, [
    { v: trunc1(v), mc: MC.trunc, say: `Cutting off the digits is not rounding. Look at the next digit (hundredths): it is 5 or more, so round up.` },
    { v: Math.round(v), mc: MC.roundWhole, say: `That is the nearest WHOLE number. The question asks for the nearest tenth: one decimal place.` },
    { v: N / 2, mc: MC.halfRoot, say: `A square root is not half the number. Use the √ key: ${disp}…` },
  ], `Round ${disp}… to one decimal place.`);
};
const squareCheck: Gen = (R, n) => {
  const N = pick(R, TENTH_N.filter(x => x < 100));
  const v = Math.sqrt(N), t = round1(v), T2 = Math.round(t * t * 100) / 100;
  const name = pick(R, ['Ana', 'Ben', 'Mei', 'Leo', 'Ivy', 'Sam']);
  const pic = { pic: squareSketch(String(N), '?', `\\sqrt{${N}} \\approx ${tenth(v)}`) };
  if (R() < 0.45) return numItem({
    id: `squareCheck-${n}`, family: 'squareCheck',
    prompt: `${name} rounded ${rt(N)} to ${tenth(v)}. Check it: what is ${p2(tenth(v))}?`,
    board: `${tenth(v)}^2 = \\,?`, picture: pic,
    solution: [`${tenth(v)} × ${tenth(v)}: ${tenth(v).replace('.', '')} × ${tenth(v).replace('.', '')} = ${Math.round(t * 10) ** 2}, and tenths × tenths make hundredths.`, `${p2(tenth(v))} = ${S(fmt(T2))}, close to ${N}, so ${tenth(v)} is a good rounding.`],
    steps: [`${tenth(v)}^2 = ${fmt(T2)} \\approx ${N}`],
  }, T2, `Yes: ${fmt(T2)}, close to ${N}.`, [
    { v: 2 * t, mc: MC.timesTwo, say: `Squaring is ${tenth(v)} × ${tenth(v)}, not ${tenth(v)} × 2.` },
    { v: Math.round(t * 10) ** 2 / 10, mc: MC.decSquare, say: `Tenths times tenths make hundredths: the answer has two decimal places.` },
  ], `Multiply ${tenth(v)} × ${tenth(v)}.`);
  return choiceItem(R, {
    id: `squareCheck-${n}`, family: 'squareCheck',
    prompt: `${name} writes ${rt(N)} = ${tenth(v)}. But ${p2(tenth(v))} = ${fmt(T2)}, not ${N}. What is true?`,
    board: `${tenth(v)}^2 = ${fmt(T2)}`, picture: pic,
    solution: [`${rt(N)} is irrational: no decimal that stops is exactly equal to it.`, `${tenth(v)} is ${rt(N)} rounded to the nearest tenth, so write ${S(`${rt(N)} ≈ ${tenth(v)}`)}.`, `${fmt(T2)} is close to ${N}: the rounding is good, but it is not exact.`],
  }, [
    { t: `${rt(N)} ≈ ${tenth(v)}: a good rounding, not an exact value`, ok: true, say: `Yes: write it with ≈. ${fmt(T2)} is close to ${N}, not equal.` },
    { t: `${rt(N)} = ${tenth(v)} exactly`, mc: MC.roundedExact, say: `If it were exact, ${p2(tenth(v))} would be ${N}. It is ${fmt(T2)}: ${tenth(v)} is only a rounding.` },
    { t: `${tenth(v)} is wrong, because ${fmt(T2)} ≠ ${N}`, mc: MC.roundGap, say: `A rounded root never squares back exactly. ${fmt(T2)} is close to ${N}, so ${tenth(v)} is the right rounding.` },
  ]);
};
const IRR_HYP: readonly [number, number][] = [[1, 1], [1, 2], [2, 3], [1, 3], [2, 4], [3, 5], [4, 5], [2, 5], [3, 3], [5, 5], [1, 4], [4, 7], [3, 7], [5, 6], [2, 7], [6, 7]];
const IRR_LEG: readonly [number, number][] = [[7, 3], [6, 2], [4, 1], [5, 2], [8, 5], [9, 4], [10, 3], [6, 4], [7, 5], [9, 7]];   // [hypotenuse, leg]
function irrCase(R: () => number): { a: number; b: number | null; c: number | null; S2: number; legAsk: boolean } {
  if (R() < 0.6) { const [a, b] = pick(R, IRR_HYP); return { a, b, c: null, S2: a * a + b * b, legAsk: false }; }
  const [c, a] = pick(R, IRR_LEG);
  return { a, b: null, c, S2: c * c - a * a, legAsk: true };
}
const exactLen: Gen = (R, n) => {
  const k = irrCase(R), u = pick(R, UNITS_US);
  const v = Math.sqrt(k.S2);
  const lab = k.legAsk ? { a: tu(k.a, u), b: 'x', c: tu(k.c!, u) } : { a: tu(k.a, u), b: tu(k.b!, u), c: 'x' };
  const pic = { pic: triPic(k.a, k.legAsk ? v : k.b!, pick(R, POSES), lab) };
  if (R() < 0.25) return choiceItem(R, {
    id: `exactLen-${n}`, family: 'exactLen',
    prompt: `The side is ${I('x')} = ${rt(k.S2)} ${u}. Why is ${rt(k.S2)} irrational?`,
    board: `x = \\sqrt{${k.S2}}`, picture: pic,
    solution: [`${k.S2} is not a perfect square (${p2(isqrt(k.S2))} = ${isqrt(k.S2) ** 2}, ${p2(isqrt(k.S2) + 1)} = ${(isqrt(k.S2) + 1) ** 2}).`, `The square root of a whole number that is not a perfect square is irrational: its decimals never stop and never repeat.`],
  }, [
    { t: `${k.S2} is not a perfect square, and the root of such a whole number is irrational`, ok: true, say: `Yes: that is the known fact about square roots of whole numbers.` },
    { t: `Its decimals fill the whole calculator display`, mc: MC.display, say: `A full display proves nothing: 1 ÷ 3 = 0.3333333… fills it too, and 1/3 is rational.` },
    { t: `It has a square root sign`, say: `${rt(16)} has a root sign too, and it is 4. What matters is whether ${k.S2} is a perfect square.` },
  ]);
  const wrongAdd = k.legAsk ? k.c! - k.a : k.a + k.b!;
  return choiceItem(R, {
    id: `exactLen-${n}`, family: 'exactLen',
    prompt: `Give the EXACT length of ${I('x')}.`,
    board: k.legAsk ? `x^2 = ${k.c}^2 - ${k.a}^2` : `x^2 = ${k.a}^2 + ${k.b}^2`, picture: pic,
    solution: [k.legAsk ? `${p2(I('x'))} = ${k.c! * k.c!} − ${k.a * k.a} = ${k.S2}.` : `${p2(I('x'))} = ${k.a * k.a} + ${k.b! * k.b!} = ${k.S2}.`, `${k.S2} is not a perfect square, so the exact length is ${S(`${rt(k.S2)} ${u}`)}.`, `Rounded, ${rt(k.S2)} ≈ ${tenth(v)} ${u}: close, but not exact.`],
    steps: [`x^2 = ${k.S2}`, `x = \\sqrt{${k.S2}} \\approx ${tenth(v)}`],
  }, [
    { t: `${rt(k.S2)} ${u}`, ok: true, say: `Yes: ${rt(k.S2)} is exact; ${tenth(v)} would only be a rounding.` },
    { t: `${k.S2} ${u}`, mc: MC.rSquared, say: `${k.S2} is ${p2(I('x'))}. The length is its square root.` },
    { t: `${tenth(v)} ${u}`, mc: MC.roundedExact, say: `${tenth(v)} is rounded: ${p2(tenth(v))} = ${fmt(round1(v) ** 2)}, not ${k.S2}. The exact length is ${rt(k.S2)}.` },
    { t: `${wrongAdd} ${u}`, mc: MC.addLengths, say: `Lengths do not ${k.legAsk ? 'subtract' : 'add'} like that; their squares do.` },
  ]);
};
const lenTenth: Gen = (R, n) => {
  const k = irrCase(R), u = pick(R, [...UNITS_US, 'm', 'cm'] as Unit[]);
  const v = Math.sqrt(k.S2), ans = round1(v);
  const lab = k.legAsk ? { a: tu(k.a, u), b: 'x', c: tu(k.c!, u) } : { a: tu(k.a, u), b: tu(k.b!, u), c: 'x' };
  return numItem({
    id: `lenTenth-${n}`, family: 'lenTenth',
    prompt: `Find ${I('x')} to the nearest tenth. (Calculator allowed.)`,
    board: k.legAsk ? `x^2 = ${k.c}^2 - ${k.a}^2` : `x^2 = ${k.a}^2 + ${k.b}^2`, unit: u,
    picture: { pic: triPic(k.a, k.legAsk ? v : k.b!, pick(R, POSES), lab) },
    solution: [k.legAsk ? `${p2(I('x'))} = ${k.c! * k.c!} − ${k.a * k.a} = ${k.S2}.` : `${p2(I('x'))} = ${k.a * k.a} + ${k.b! * k.b!} = ${k.S2}.`, `${I('x')} = ${rt(k.S2)} = ${v.toFixed(4)}…`, `To the nearest tenth: ${I('x')} ≈ ${S(`${tenth(v)} ${u}`)}.`],
    steps: [`x^2 = ${k.S2}`, `x = \\sqrt{${k.S2}} \\approx ${tenth(v)}`],
  }, ans, `Yes: ${rt(k.S2)} ≈ ${tenth(v)} ${u}.`, [
    { v: k.legAsk ? k.c! - k.a : k.a + k.b!, mc: MC.addLengths, say: `Lengths do not ${k.legAsk ? 'subtract' : 'add'} like that; work with the squares.` },
    { v: k.S2, mc: MC.rSquared, say: `${k.S2} is ${p2(I('x'))}. Take its square root.` },
    { v: trunc1(v), mc: MC.trunc, say: `${v.toFixed(4)}…: the hundredths digit is 5 or more, so round the tenths UP.` },
    { v: Math.round(v), mc: MC.roundWhole, say: `Give one decimal place: ${rt(k.S2)} = ${v.toFixed(4)}…` },
  ], `Find ${p2(I('x'))}, take the square root, round to one decimal place.`);
};

// ===================== 11. converse-test =====================
const isRight: Gen = (R, n, sg) => {
  const big = sg === 'disprove-right-angle' ? R() < 0.6 : R() < 0.35;
  const right = R() < 0.5;
  const s = right ? pick(R, big ? APPLIED : FLUENT) : pick(R, big ? NEARMISS_BIG : NONRIGHT.filter(t => kind3(t) !== 'right'));
  const [a, b, c] = sorted3(s);
  // half the time the longest side is NOT listed last
  let shown = shuffle(R, [a, b, c]) as [number, number, number];
  if (R() < 0.5 && shown[2] === c) shown = [shown[2], shown[0], shown[1]];
  const sum = a * a + b * b, C2 = c * c;
  const [x, y, z] = shown;
  const lastSum = x * x + y * y, lastSays = lastSum === z * z;
  const carp = R() < 0.3;
  const prompt = carp
    ? `A carpenter checks a corner. She marks ${a} ft along one board and ${b} ft along the other; the diagonal between the marks is exactly ${c} ft. Is the corner a right angle?`
    : `A triangle has sides of exactly ${x}, ${y} and ${z} units. Is it a right triangle?${big ? ' (Calculator allowed.)' : ''}`;
  const near10 = Math.abs(sum - C2) <= 0.1 * C2;
  return choiceItem(R, {
    id: `isRight-${n}`, family: 'isRight', prompt,
    board: carp ? `${a},\\ ${b},\\ ${c}` : `${x},\\ ${y},\\ ${z}`,
    picture: { pic: carp ? rtSketch('deck', b, a, { h: tu(b, 'ft'), v: tu(a, 'ft'), c: tu(c, 'ft') }, { mark: false, ask: true }) : sssSketch(shown, shown.map(String) as [string, string, string], { ask: true, mark: right ? 'solve' : undefined }) },
    solution: [`The longest side is ${c}: it is the only one that can be the hypotenuse.`, `${p2(a)} + ${p2(b)} = ${a * a} + ${b * b} = ${sum}; ${p2(c)} = ${C2}.`, right ? `They are equal, so by the converse the triangle ${S('is a right triangle')} (the right angle is across from ${c}).` : `${sum} ≠ ${C2}, so it is ${S('not a right triangle')}.`],
    steps: [`${a}^2 + ${b}^2 = ${sum}`, `${c}^2 = ${C2}`, right ? `${sum} = ${C2}\\ \\checkmark` : `${sum} \\neq ${C2}`],
  }, [
    { t: carp ? 'Yes, the corner is a right angle' : 'Yes, it is a right triangle', ok: right, say: right ? `Yes: ${sum} = ${C2}.` : `${sum} ≠ ${C2}.${near10 ? ' Close is not equal: the lengths are exact.' : ''}`, mc: right ? undefined : near10 ? MC.nearRight : undefined },
    { t: carp ? 'No, the corner is not a right angle' : 'No, it is not a right triangle', ok: !right, say: !right ? `Right: ${sum} ≠ ${C2}.` : `Use the LONGEST side as c: ${a * a} + ${b * b} = ${sum} = ${p2(c)}.`, mc: !right ? undefined : !lastSays && z !== c ? MC.lastListed : undefined },
  ]);
};
const whereRight: Gen = (R, n) => {
  const [a, b, c] = pick(R, [...FLUENT, ...APPLIED]);
  const vs = shuffle(R, [...pick(R, VSETS)]) as [string, string, string];
  const [P, Q, Rr] = vs;   // the right angle is at Rr: PQ = c, QR = a, PR = b
  const sides = shuffle(R, [{ n: P + Q, v: c, opp: Rr }, { n: Q + Rr, v: a, opp: P }, { n: P + Rr, v: b, opp: Q }]);
  const last = sides[2]!;
  return choiceItem(R, {
    id: `whereRight-${n}`, family: 'whereRight',
    prompt: `Triangle ${[...vs].sort().join('')} has ${sides.map(s => `${s.n} = ${s.v}`).join(', ')}. ${p2(a)} + ${p2(b)} = ${p2(c)}, so it is a right triangle. Where is the right angle?`,
    board: `${a}^2 + ${b}^2 = ${c}^2`,
    // not to scale: drawn true to its lengths the right angle would show before the kid answers
    picture: { pic: sssSketch([0.78 * c, 0.86 * c, c], [`${a}`, `${b}`, `${c}`], { verts: [Rr, Q, P], mark: 'solve' }) },
    solution: [`The longest side, ${P}${Q} = ${c}, is the hypotenuse.`, `The right angle is across from it: at the corner that ${P}${Q} does not touch, ${S(Rr)}.`],
  }, [
    { t: `At ${Rr}`, ok: true, say: `Yes: ${Rr} is across from the longest side ${P}${Q}.` },
    { t: `At ${P}`, mc: last.opp === P && last.v !== c ? MC.lastListed : undefined, say: `The right angle is across from the LONGEST side, ${P}${Q} = ${c}. ${P} touches it.` },
    { t: `At ${Q}`, mc: last.opp === Q && last.v !== c ? MC.lastListed : undefined, say: `The right angle is across from the LONGEST side, ${P}${Q} = ${c}. ${Q} touches it.` },
  ]);
};

// ===================== 12. model-2d-context =====================
interface Ctx { shape: Shape; text: (h: string, v: string, c: string) => string; ask: 'h' | 'v' | 'c'; u: Unit; h: number; v: number; c: number; what: string }
function context(R: () => number): Ctx {
  const k = int(R, 0, 4);
  const pickT = (sets: readonly [number, number, number][]) => { const [x, y, z] = pick(R, sets); return R() < 0.5 ? [x, y, z] : [y, x, z]; };
  if (k === 0) {
    // ladder: the foot is h from the wall, the top is v up the wall, the ladder c; asked: v
    const [f, t, L] = R() < 0.25 ? [3, Math.sqrt(91), 10] : R() < 0.2 ? [1.5, 2, 2.5] : pick(R, [[5, 12, 13], [6, 8, 10], [7, 24, 25], [9, 12, 15], [8, 15, 17]] as const);
    const u: Unit = f === 1.5 ? 'm' : 'ft';
    return { shape: 'ladder', u, h: f, v: t, c: L, ask: 'v', what: 'the height the ladder reaches', text: (h, v, c) => `A ${c} ladder leans against a wall. Its foot is ${h} from the wall. How high up the wall does it reach?${!isSquare(sq(L) - sq(f)) && u === 'ft' ? ' Round to the nearest tenth.' : ''}` };
  }
  if (k === 1) {
    const [w, hh, d] = R() < 0.25 ? [40, 22, Math.sqrt(40 * 40 + 22 * 22)] : pick(R, [[32, 24, 40], [48, 36, 60], [16, 12, 20], [40, 30, 50], [24, 18, 30]] as const);
    return { shape: 'tv', u: 'in', h: w, v: hh, c: d, ask: 'c', what: 'the diagonal of the screen', text: (h, v) => `A TV screen is ${h} wide and ${v} tall. Screens are sold by their diagonal. How long is the diagonal?${!Number.isInteger(d) ? ' Round to the nearest tenth.' : ''}` };
  }
  if (k === 2) {
    const [e, nn, d] = R() < 0.3 ? [2, 3, Math.sqrt(13)] : R() < 0.25 ? [0.6, 0.8, 1] : pickT([[3, 4, 5], [5, 12, 13], [6, 8, 10], [9, 12, 15]]);
    return { shape: 'walk', u: 'mi', h: e!, v: nn!, c: d!, ask: 'c', what: 'the straight-line distance', text: (h, v) => `Jo walks ${h} east, then ${v} north. How far is Jo from the start in a straight line?${!Number.isInteger(d! * 10) ? ' Round to the nearest tenth.' : ''}` };
  }
  if (k === 3) {
    const [r, up, L] = R() < 0.25 ? [11, Math.sqrt(23), 12] : pick(R, [[12, 5, 13], [8, 6, 10], [24, 7, 25], [15, 8, 17]] as const);
    return { shape: 'ramp', u: 'ft', h: r, v: up, c: L, ask: 'v', what: 'the height of the ramp', text: (h, _v, c) => `A wheelchair ramp is ${c} long and covers ${h} along the ground. How high does it rise?${!Number.isInteger(up) ? ' Round to the nearest tenth.' : ''}` };
  }
  const [w, l, d] = pick(R, [[60, 80, 100], [30, 40, 50], [90, 120, 150], [50, 120, 130], [80, 150, 170]] as const);
  return { shape: 'park', u: 'yd', h: l, v: w, c: d, ask: 'c', what: 'the shortcut', text: (h, v) => `A park is a rectangle, ${h} by ${v}. How long is the straight path across it, from one corner to the opposite corner?` };
}
const story: Gen = (R, n) => {
  const x = context(R);
  const H = tu(fmt(x.h), x.u), Vt = tu(fmt(x.v), x.u), Ct = tu(fmt(x.c), x.u);
  const asked = x.ask === 'c' ? x.c : x.v;
  const exact = Math.abs(asked * 10 - Math.round(asked * 10)) < 1e-9;
  const ans = exact ? Math.round(asked * 10) / 10 : round1(asked);
  const labels = x.ask === 'c' ? { h: H, v: Vt, c: '?', c2: exact ? Ct : `\\approx ${tenth(asked)}\\text{ ${x.u}}` } : { h: H, v: '?', c: Ct };
  const plainT = (s: number) => `${fmt(s)} ${x.u}`;
  const S2 = x.ask === 'c' ? sq(x.h) + sq(x.v) : sq(x.c) - sq(x.h);
  return numItem({
    id: `story-${n}`, family: 'story',
    prompt: x.text(A(plainT(x.h)), B(plainT(x.v)), S(plainT(x.c))),
    board: x.ask === 'c' ? `${fmt(x.h)}^2 + ${fmt(x.v)}^2 = c^2` : `${fmt(x.h)}^2 + h^2 = ${fmt(x.c)}^2`, unit: x.u,
    picture: { pic: rtSketch(x.shape, x.h, x.v, labels) },
    solution: [
      x.ask === 'c' ? `The two given lengths meet at a right angle: they are the legs; ${x.what} is the hypotenuse.` : `The ${x.shape === 'ladder' ? 'ladder' : 'ramp'} is across from the right angle: it is the hypotenuse; ${x.what} is a leg.`,
      x.ask === 'c' ? `${p2('c')} = ${fmt(sq(x.h))} + ${fmt(sq(x.v))} = ${fmt(S2)}.` : `${p2('h')} = ${fmt(sq(x.c))} − ${fmt(sq(x.h))} = ${fmt(S2)}.`,
      `${rt(fmt(S2))} ${exact ? '=' : '≈'} ${S(`${fmt(ans)} ${x.u}`)}.`,
    ],
    steps: x.ask === 'c' ? [`c^2 = ${fmt(sq(x.h))} + ${fmt(sq(x.v))} = ${fmt(S2)}`, `c = \\sqrt{${fmt(S2)}} ${exact ? '=' : '\\approx'} ${fmt(ans)}`] : [`h^2 = ${fmt(sq(x.c))} - ${fmt(sq(x.h))} = ${fmt(S2)}`, `h = \\sqrt{${fmt(S2)}} ${exact ? '=' : '\\approx'} ${fmt(ans)}`],
  }, ans, `Yes: ${fmt(ans)} ${x.u}.`, x.ask === 'c' ? [
    { v: x.h + x.v, mc: MC.addLengths, say: `Going around the corner is ${fmt(x.h + x.v)} ${x.u}. The straight line is shorter: add the SQUARES.` },
    { v: S2, mc: MC.rSquared, say: `${fmt(S2)} is ${p2('c')}. Take its square root.` },
    { v: trunc1(asked), mc: MC.trunc, say: `Round, do not cut off: look at the hundredths digit.` },
  ] : [
    { v: Math.sqrt(sq(x.c) + sq(x.h)), mc: MC.roleSwap, say: `That makes the ${x.shape === 'ladder' ? 'ladder' : 'ramp'} a leg. It is across from the right angle: it is the hypotenuse, so subtract.`, tol: 0.06 },
    { v: x.c - x.h, mc: MC.addLengths, say: `Lengths do not subtract like that. Subtract the squares: ${fmt(sq(x.c))} − ${fmt(sq(x.h))}.` },
    { v: S2, mc: MC.rSquared, say: `${fmt(S2)} is ${p2('h')}. Take its square root.` },
    { v: trunc1(asked), mc: MC.trunc, say: `Round, do not cut off: look at the hundredths digit.` },
  ], `Find the right angle first: the side across from it is the hypotenuse.`);
};
const whichTri: Gen = (R, n) => {
  const x = context(R);
  const h = fmt(x.h), v = fmt(x.v), c = fmt(x.c);
  const ul = (s: string) => `${s} ${x.u}`;
  const labels = x.ask === 'c' ? { h: tu(h, x.u), v: tu(v, x.u), c: 'c' } : { h: tu(h, x.u), v: 'h', c: tu(c, x.u) };
  const P = rtSketch(x.shape, x.h, x.v, labels);
  // the labels come with the worked solution: the kid models the situation first
  for (const l of P.spec.labels ?? []) l.step = 'lab';
  P.solve = ['lab', ...P.solve];
  const prompt = x.text(ul(h), ul(v), ul(c)).replace(/ How .*$| Round .*$/, '') + ` Which equation finds ${x.what}?`;
  if (x.ask === 'c') return choiceItem(R, {
    id: `whichTri-${n}`, family: 'whichTri', prompt, board: `c = \\,?`, picture: { pic: P },
    solution: [`The two given lengths meet at a right angle: they are the legs.`, `${x.what[0]!.toUpperCase() + x.what.slice(1)} is across from the right angle: ${S(`${p2(h)} + ${p2(v)} = ${p2('c')}`)}.`],
    steps: [`${h}^2 + ${v}^2 = c^2`],
  }, [
    { t: `${p2(h)} + ${p2(v)} = ${p2(I('c'))}`, ok: true, say: `Yes: the legs squared add up to the hypotenuse squared.` },
    { t: `${p2(I('c'))} + ${p2(v)} = ${p2(h)}`, mc: MC.knownLegHyp, say: `That makes ${h} ${x.u} the hypotenuse. It meets the other side at the right angle: it is a leg.` },
    { t: `${I('c')} = ${h} + ${v}`, mc: MC.addLengths, say: `That is the walk around the corner. The straight line is shorter.` },
  ]);
  return choiceItem(R, {
    id: `whichTri-${n}`, family: 'whichTri', prompt, board: `h = \\,?`, picture: { pic: P },
    solution: [`The ${x.shape === 'ladder' ? 'ladder' : 'ramp'} is across from the right angle (${x.shape === 'ladder' ? 'wall and ground' : 'ground and the rise'}): it is the hypotenuse, ${c} ${x.u}.`, `${S(`${p2(h)} + ${p2(I('h'))} = ${p2(c)}`)}.`],
    steps: [`${h}^2 + h^2 = ${c}^2`],
  }, [
    { t: `${p2(h)} + ${p2(I('h'))} = ${p2(c)}`, ok: true, say: `Yes: the ${x.shape === 'ladder' ? 'ladder' : 'ramp'} is the hypotenuse.` },
    { t: `${p2(h)} + ${p2(c)} = ${p2(I('h'))}`, mc: MC.roleSwap, say: `That makes the ${x.shape === 'ladder' ? 'ladder' : 'ramp'} a leg. It is across from the right angle: it is the hypotenuse.` },
    { t: `${I('h')} = ${c} − ${h}`, mc: MC.addLengths, say: `Lengths do not subtract like that. Use the squares.` },
  ]);
};

// ===================== 13. coordinate-distance =====================
const LEG_PAIRS: readonly [number, number][] = [[3, 4], [4, 3], [6, 8], [8, 6], [5, 12], [12, 5], [9, 12], [12, 9], [8, 15]];
const IRR_PAIRS: readonly [number, number][] = [[2, 3], [3, 5], [1, 4], [4, 7], [2, 5], [5, 6], [3, 7], [6, 7], [4, 9], [2, 9], [5, 8], [7, 8]];
function points(R: () => number, dx: number, dy: number, mixed: boolean): [V, V] | null {
  for (let t = 0; t < 60; t++) {
    const sx = R() < 0.5 ? 1 : -1, sy = R() < 0.5 ? 1 : -1;
    const lo = mixed ? -10 : 1;
    const A0: V = [int(R, lo, 10), int(R, lo, 10)];
    const B0: V = [A0[0] + sx * dx, A0[1] + sy * dy];
    if (B0[0] < lo || B0[0] > 10 || B0[1] < lo || B0[1] > 10) continue;
    if (mixed && (A0[0] === 0 || A0[1] === 0 || B0[0] === 0 || B0[1] === 0)) continue;
    // a mixed pair crosses an axis; the slips (coordinates as lengths, added coordinates) must differ from the answer
    if (mixed && Math.sign(A0[0]) === Math.sign(B0[0]) && Math.sign(A0[1]) === Math.sign(B0[1])) continue;
    return [A0, B0];
  }
  return null;
}
const dist: Gen = (R, n) => {
  const mode = R() < 0.18 ? 'line' : R() < 0.4 ? 'irr' : 'whole';
  let A0: V, B0: V;
  const mixed = R() < 0.6;
  if (mode === 'line') {
    const y = int(R, -8, 8), x1 = int(R, -9, -1), x2 = int(R, 1, 9);
    [A0, B0] = R() < 0.5 ? [[x1, y], [x2, y]] : [[y, x1], [y, x2]];
  } else {
    const [dx, dy] = pick(R, mode === 'irr' ? IRR_PAIRS : LEG_PAIRS);
    const pp = points(R, dx, dy, mixed) ?? points(R, dx, dy, false) ?? [[1, 1], [1 + dx, 1 + dy]] as [V, V];
    [A0, B0] = pp;
  }
  const rn = run(A0, B0), rs = rise(A0, B0), D2 = dist2(A0, B0), d = Math.sqrt(D2);
  const ans = mode === 'irr' ? round1(d) : d;
  const coordWrong = Math.sqrt(sq(B0[0]) + sq(B0[1]));
  const addWrong = Math.sqrt(sq(A0[0] + B0[0]) + sq(A0[1] + B0[1]));
  const flatX = A0[1] === B0[1];
  return numItem({
    id: `dist-${n}`, family: 'dist',
    prompt: `How far apart are ${ptH('A', A0)} and ${ptH('B', B0)}?${mode === 'irr' ? ' Round to the nearest tenth. (Calculator allowed.)' : ''}`,
    board: `\\text{AB} = \\,?`, unit: 'units',
    picture: { pic: { kind: 'plane', A: A0, B: B0, run: rn ? String(rn) : undefined, rise: rs ? String(rs) : undefined, hyp: mode === 'line' ? undefined : (mode === 'irr' ? `\\sqrt{${D2}}` : String(d)) } },
    solution: mode === 'line'
      ? [`The points are on one ${flatX ? 'horizontal' : 'vertical'} line: no triangle is needed.`, `Distance = ${flatX ? `${neg(B0[0])} − ${A0[0] < 0 ? `(${neg(A0[0])})` : A0[0]}` : `${neg(B0[1])} − ${A0[1] < 0 ? `(${neg(A0[1])})` : A0[1]}`} = ${S(d)} units.`]
      : [`Draw the right triangle: across from A, then ${B0[1] > A0[1] ? 'up' : 'down'} to B.`, `Run = ${rn}, rise = ${rs} (subtract the coordinates).`, `AB² = ${rn * rn} + ${rs * rs} = ${D2}, AB = ${rt(D2)} ${mode === 'irr' ? '≈' : '='} ${S(mode === 'irr' ? tenth(d) : d)} units.`],
    steps: mode === 'line' ? [flatX ? `\\text{AB} = ${minus(B0[0], A0[0])} = ${(B0[0] - A0[0])}` : `\\text{AB} = ${minus(B0[1], A0[1])} = ${B0[1] - A0[1]}`].map(s => s.replace(/= -(\d+)$/, '= $1'))
      : [`\\text{run} = \\lvert ${minus(B0[0], A0[0])} \\rvert = ${rn}`, `\\text{rise} = \\lvert ${minus(B0[1], A0[1])} \\rvert = ${rs}`, `\\text{AB}^2 = ${rn * rn} + ${rs * rs} = ${D2}`, `\\text{AB} = \\sqrt{${D2}} ${mode === 'irr' ? '\\approx' : '='} ${mode === 'irr' ? tenth(d) : d}`],
  }, ans, `Yes: ${mode === 'irr' ? `${rt(D2)} ≈ ${tenth(d)}` : d} units.`, mode === 'line' ? [
    { v: Math.abs(A0[0] + B0[0] + A0[1] + B0[1] - (flatX ? 2 * A0[1] : 2 * A0[0])), mc: MC.signFlip, say: `Distance is the DIFFERENCE of the coordinates: from ${flatX ? neg(A0[0]) : neg(A0[1])} to ${flatX ? neg(B0[0]) : neg(B0[1])} is ${d} steps.` },
    { v: Math.abs(flatX ? B0[0] : B0[1]), mc: MC.coordLen, say: `${flatX ? neg(B0[0]) : neg(B0[1])} is where B is, not how far it is from A. Count from A to B.` },
  ] : [
    { v: rn + rs, mc: MC.addLengths, say: `${rn + rs} is the walk along the grid. The straight line is shorter: add the SQUARES.` },
    { v: D2, mc: MC.rSquared, say: `${D2} is AB². Take its square root.` },
    { v: mode === 'irr' ? round1(coordWrong) : coordWrong, mc: MC.coordLen, say: `${neg(B0[0])} and ${neg(B0[1])} say where B is, not how far it is from A. The legs are the differences: ${rn} and ${rs}.`, tol: mode === 'irr' ? 0.06 : 1e-6 },
    { v: mode === 'irr' ? round1(addWrong) : addWrong, mc: MC.signFlip, say: `Subtract the coordinates to find the legs: from ${neg(A0[0])} to ${neg(B0[0])} is ${rn} across.`, tol: mode === 'irr' ? 0.06 : 1e-6 },
    ...(mode === 'irr' ? [{ v: trunc1(d), mc: MC.trunc, say: `Round, do not cut off: ${rt(D2)} = ${d.toFixed(3)}…` }] : []),
  ], `Draw the right triangle under AB: its legs are the run and the rise.`);
};
const distLegs: Gen = (R, n) => {
  const [dx, dy] = pick(R, [...LEG_PAIRS, ...IRR_PAIRS]);
  const pp = points(R, dx, dy, true) ?? points(R, dx, dy, false)!;
  const [A0, B0] = pp;
  const rn = run(A0, B0), rs = rise(A0, B0);
  const sa = Math.abs(A0[0] + B0[0]), sb = Math.abs(A0[1] + B0[1]);
  return {
    id: `distLegs-${n}`, family: 'distLegs',
    prompt: `To find the distance from ${ptH('A', A0)} to ${ptH('B', B0)}, draw a right triangle. How long are its legs?`,
    board: `\\text{run},\\ \\text{rise} = \\,?`,
    input: 'pair', pairLead: 'run, rise = (', pairOp: ',', pairTail: ')',
    picture: { pic: { kind: 'plane', A: A0, B: B0, run: String(rn), rise: String(rs) } },
    solution: [`Run: from x = ${neg(A0[0])} to x = ${neg(B0[0])} is ${neg(B0[0])} − ${A0[0] < 0 ? `(${neg(A0[0])})` : A0[0]}, so ${S(rn)} across.`, `Rise: from y = ${neg(A0[1])} to y = ${neg(B0[1])} is ${S(rs)} ${B0[1] > A0[1] ? 'up' : 'down'}.`, `Then AB² = ${rn * rn} + ${rs * rs} = ${rn * rn + rs * rs}.`],
    steps: [`\\text{run} = \\lvert ${minus(B0[0], A0[0])} \\rvert = ${rn}`, `\\text{rise} = \\lvert ${minus(B0[1], A0[1])} \\rvert = ${rs}`],
    answer: { kind: 'pair', x: rn, y: rs },
    check: (r: Response): Verdict => {
      if (r.kind !== 'pair' || !Number.isFinite(r.x) || !Number.isFinite(r.y)) return { ok: false, say: 'Type two numbers.' };
      const x = Math.abs(r.x), y = Math.abs(r.y);
      if (x === rn && y === rs) return { ok: true, say: `Yes: ${rn} across and ${rs} ${B0[1] > A0[1] ? 'up' : 'down'}.` };
      if (x === rs && y === rn && rn !== rs) return { ok: false, say: 'Those are swapped: the run goes across (x), the rise up or down (y).' };
      if (x === Math.abs(B0[0]) && y === Math.abs(B0[1])) return { ok: false, mc: MC.coordLen, say: `Those are B's coordinates: where B is, not how far it is from A. Subtract A's coordinates.` };
      if (x === sa && y === sb) return { ok: false, mc: MC.signFlip, say: `Subtract the coordinates, do not add them: ${neg(B0[0])} − ${A0[0] < 0 ? `(${neg(A0[0])})` : A0[0]}.` };
      return { ok: false, say: 'Count the steps across from A to B, then the steps up or down.' };
    },
  };
};

// ===================== 14-16. prism-perpendicularity, locate-3d-triangle, chain-3d =====================
const BOXES: readonly [number, number, number][] = [[3, 4, 12], [6, 8, 5], [4, 3, 6], [5, 12, 4], [6, 8, 10], [9, 12, 8], [2, 3, 6], [4, 6, 3], [8, 6, 7], [3, 4, 5]];
const perp3d: Gen = (R, n) => {
  const [l, w, h] = pick(R, BOXES);
  const u = pick(R, UNITS_US);
  const v = int(R, 0, 2);
  const dims = `${l} ${u} by ${w} ${u} by ${h} ${u}`;
  if (v === 0) return choiceItem(R, {
    id: `perp3d-${n}`, family: 'perp3d',
    prompt: `A box is ${dims}. In the real box, what is the angle between the edge CG (straight up) and the floor diagonal AC?`,
    board: `\\angle \\text{ACG} = \\,?`,
    picture: { pic: boxSketch(l, w, h, { now: ['AC', 'CG'], verts: ['A', 'C', 'G'], mark: 'solve' }) },
    solution: [`CG stands straight up from the floor: it is perpendicular to the whole floor.`, `So it makes a right angle with EVERY line on the floor through C, the diagonal AC too: ${S('90°')}.`, `In the drawing the angle looks smaller; a flat drawing of a box changes how angles look.`],
  }, [
    { t: '90°', ok: true, say: `Yes: the edge up is perpendicular to every floor line through its foot.` },
    { t: 'Less than 90°, as it looks in the drawing', mc: MC.pic3d, say: `The drawing is flat, so it squeezes angles. CG is straight up from the floor: 90° with every floor line through C.` },
    { t: 'More than 90°', mc: MC.pic3d, say: `CG is straight up and AC lies flat on the floor: the angle between them is 90°.` },
  ]);
  if (v === 1) return choiceItem(R, {
    id: `perp3d-${n}`, family: 'perp3d',
    prompt: `A box is ${dims}. Is the space diagonal AG perpendicular to the floor?`,
    board: `\\text{AG} \\perp \\text{floor?}`,
    picture: { pic: boxSketch(l, w, h, { now: ['AG', 'CG'], verts: ['A', 'C', 'G'], mark: 'solve' }) },
    solution: [`Only lines straight up (like the edge CG) are perpendicular to the floor.`, `AG starts at A on the floor but leans across to G: it is ${S('not')} perpendicular to the floor.`, `It is the hypotenuse of the right triangle ACG, with the right angle at C.`],
  }, [
    { t: 'No: it leans; only the edges straight up are perpendicular to the floor', ok: true, say: `Yes: AG leans across the box. The right angle is at C, between AC and CG.` },
    { t: 'Yes: it goes from the floor to the top', mc: MC.spacePerp, say: `Going from the floor to the top is not enough: AG leans. CG goes straight up; AG ends right above C, not above A.` },
    { t: 'Yes: every segment that starts at a corner is', mc: MC.spacePerp, say: `The floor diagonal AC starts at a corner too, and it lies IN the floor. Only lines straight up are perpendicular to it.` },
  ]);
  return choiceItem(R, {
    id: `perp3d-${n}`, family: 'perp3d',
    prompt: `A box is ${dims}. Why is triangle ACG a right triangle, with the right angle at C?`,
    board: `\\angle \\text{ACG} = 90^{\\circ}`,
    picture: { pic: boxSketch(l, w, h, { now: ['AC', 'CG', 'AG'], verts: ['A', 'C', 'G'], mark: 'now' }) },
    solution: [`CG stands straight up from the floor, so it is perpendicular to the whole floor.`, `AC lies on the floor and passes through C, so ${S('CG ⊥ AC')}: the angle at C is 90°.`],
  }, [
    { t: 'CG stands straight up from the floor, so it is perpendicular to every floor line through C, like AC', ok: true, say: `Yes: that is why the angle at C is 90°, even though it does not look like it in the drawing.` },
    { t: 'AC and CG look perpendicular in the drawing', mc: MC.pic3d, say: `In the drawing the angle at C does not even look like 90°. The reason is in the real box: CG is straight up.` },
    { t: 'Any two edges of a box are perpendicular', mc: MC.reasonNot, say: `AC is not an edge: it is a diagonal of the floor. The reason has to say why CG and AC meet at 90°.` },
  ]);
};
const whichTri3d: Gen = (R, n) => {
  const [l, w, h] = pick(R, BOXES);
  const u = pick(R, UNITS_US);
  const space = R() < 0.65;
  if (space) return choiceItem(R, {
    id: `whichTri3d-${n}`, family: 'whichTri3d',
    prompt: `A box is ${l} ${u} by ${w} ${u} by ${h} ${u}. Which right triangle has the space diagonal AG as its hypotenuse?`,
    board: `\\text{AG} = \\,?`,
    picture: { pic: boxSketch(l, w, h, { now: ['AG'], solve: ['ACG', 'AC', 'CG'], verts: ['A', 'B', 'C', 'F', 'G'], mark: 'solve' }) },
    solution: [`AG goes through the inside of the box, from A on the floor to G at the top.`, `G is straight above C. So ${S('triangle ACG')}: the floor diagonal AC, the edge CG, and AG.`, `The right angle is at C: CG is straight up, AC lies on the floor.`],
  }, [
    { t: 'Triangle ACG', ok: true, say: `Yes: AC on the floor, CG straight up, AG across the inside.` },
    { t: 'Triangle ABC', mc: MC.faceDiag, say: `ABC lies flat on the floor: its hypotenuse is the floor diagonal AC, not AG.` },
    { t: 'Triangle ABF', mc: MC.faceDiag, say: `ABF lies on the front face: its hypotenuse is the face diagonal AF, not AG.` },
  ]);
  return choiceItem(R, {
    id: `whichTri3d-${n}`, family: 'whichTri3d',
    prompt: `A box is ${l} ${u} by ${w} ${u} by ${h} ${u}. To find the floor diagonal AC, which right triangle do you use?`,
    board: `\\text{AC} = \\,?`,
    picture: { pic: boxSketch(l, w, h, { now: ['AC'], solve: ['ABC'], verts: ['A', 'B', 'C', 'F', 'G'] }) },
    solution: [`AC lies on the floor. The floor is a ${l} by ${w} rectangle.`, `${S('Triangle ABC')}: legs AB = ${l} and BC = ${w}, right angle at B.`],
  }, [
    { t: 'Triangle ABC', ok: true, say: `Yes: AB and BC meet at a square corner of the floor.` },
    { t: 'Triangle ACG', say: `In ACG, AC is a LEG (the right angle is at C). Its hypotenuse is AG.` },
    { t: 'Triangle ABF', say: `ABF is on the front face; it does not contain AC.` },
  ]);
};
const faceOrSpace: Gen = (R, n) => {
  const [l, w, h] = pick(R, BOXES);
  const u = pick(R, UNITS_US);
  return choiceItem(R, {
    id: `faceOrSpace-${n}`, family: 'faceOrSpace',
    prompt: `A box is ${l} ${u} by ${w} ${u} by ${h} ${u}. Which segment goes through the INSIDE of the box from corner to corner (the space diagonal)?`,
    board: `\\text{space diagonal} = \\,?`,
    picture: { pic: boxSketch(l, w, h, { now: ['AC', 'AF', 'AG', 'BG'], verts: ['A', 'B', 'C', 'F', 'G'] }) },
    solution: [`AC lies on the floor, AF on the front face, BG on the right face: face diagonals.`, `${S('AG')} leaves the floor at A and ends at the top corner G: it goes through the inside.`, `It is the longest of them: AG² = AC² + CG².`],
  }, [
    { t: 'AG', ok: true, say: `Yes: AG is the space diagonal. It is longer than every face diagonal.` },
    { t: 'AC', mc: MC.faceDiag, say: `AC lies flat on the floor: a face diagonal. The space diagonal also climbs the height.` },
    { t: 'AF', mc: MC.faceDiag, say: `AF lies on the front face: a face diagonal.` },
    { t: 'BG', mc: MC.faceDiag, say: `BG lies on the right face: a face diagonal.` },
  ]);
};
const spaceDiag: Gen = (R, n) => {
  const pool = [[3, 4, 12, 13], ...WHOLE_BOXES.filter(b => b[3] <= 26 && Math.min(b[0], b[1], b[2]) >= 2)] as [number, number, number, number][];
  const [l, w, h, d] = pick(R, pool);
  const u = pick(R, ['in', 'ft', 'cm'] as Unit[]);
  const B2 = baseDiag2(l, w), D2 = spaceDiag2(l, w, h);
  const baseT = isSquare(B2) ? String(isqrt(B2)) : `\\sqrt{${B2}}`;
  return numItem({
    id: `spaceDiag-${n}`, family: 'spaceDiag',
    prompt: `A box is ${A(`${l} ${u}`)} long, ${A(`${w} ${u}`)} wide and ${B(`${h} ${u}`)} tall. How long is the space diagonal AG?${l > 9 || h > 15 ? ' (Calculator allowed.)' : ''}`,
    board: `\\text{AG} = \\,?`, unit: u,
    picture: { pic: boxSketch(l, w, h, { l: tu(l, u), w: tu(w, u), h: tu(h, u), now: ['AG'], solve: ['AC', 'CG'], verts: ['A', 'C', 'G'], mark: 'solve' }) },
    solution: [`Floor triangle ABC: AC² = ${p2(l)} + ${p2(w)} = ${B2}${isSquare(B2) ? `, AC = ${isqrt(B2)}` : ' (keep it as AC² = ' + B2 + ')'}.`, `Standing triangle ACG (right angle at C): AG² = AC² + ${p2(h)} = ${B2} + ${h * h} = ${D2}.`, `AG = ${rt(D2)} = ${S(`${d} ${u}`)}.`],
    steps: [`\\text{AC}^2 = ${l}^2 + ${w}^2 = ${B2}`, `\\text{AC} = ${baseT}`, `\\text{AG}^2 = ${B2} + ${h}^2 = ${D2}`, `\\text{AG} = \\sqrt{${D2}} = ${d}`],
  }, d, `Yes: ${rt(D2)} = ${d} ${u}.`, [
    { v: Math.sqrt(B2), mc: MC.faceDiag, say: `${fmt(Math.sqrt(B2))} is the FLOOR diagonal AC. The space diagonal also climbs the height: AG² = AC² + ${p2(h)}.`, tol: 0.06 },
    { v: l + w + h, mc: MC.addLengths, say: `Adding the edges is the path along the edges. Add the squares: ${p2(l)} + ${p2(w)} + ${p2(h)}.` },
    { v: Math.sqrt(B2) + h, mc: MC.addLengths, say: `AC and the height meet at a right angle: add their SQUARES, not their lengths.`, tol: 0.06 },
    { v: D2, mc: MC.rSquared, say: `${D2} is AG². Take its square root.` },
  ], `Two right triangles: first the floor diagonal AC, then AG with AC and the height as legs.`);
};
const keepExact: Gen = (R, n) => {
  const [l, w, h] = pick(R, MIDWAY_BOXES);
  const u = pick(R, ['in', 'ft', 'cm'] as Unit[]);
  const B2 = baseDiag2(l, w), D2 = spaceDiag2(l, w, h), d = Math.sqrt(D2), ans = round1(d);
  const mid = roundMid(l, w, h);
  return numItem({
    id: `keepExact-${n}`, family: 'keepExact',
    prompt: `A box is ${A(`${l} ${u}`)} by ${A(`${w} ${u}`)} by ${B(`${h} ${u}`)}. Find the space diagonal to the nearest tenth. (Calculator allowed.)`,
    board: `\\text{AG} = \\,?`, unit: u,
    picture: { pic: boxSketch(l, w, h, { l: tu(l, u), w: tu(w, u), h: tu(h, u), now: ['AG'], solve: ['AC', 'CG'], verts: ['A', 'C', 'G'], mark: 'solve' }) },
    solution: [`AC² = ${p2(l)} + ${p2(w)} = ${B2}. Keep it exact: do not round AC.`, `AG² = ${B2} + ${p2(h)} = ${D2}.`, `AG = ${rt(D2)} = ${d.toFixed(4)}… ≈ ${S(`${tenth(d)} ${u}`)}.`],
    steps: [`\\text{AC}^2 = ${l}^2 + ${w}^2 = ${B2}`, `\\text{AG}^2 = ${B2} + ${h}^2 = ${D2}`, `\\text{AG} = \\sqrt{${D2}} \\approx ${tenth(d)}`],
  }, ans, `Yes: ${rt(D2)} ≈ ${tenth(d)} ${u}.`, [
    { v: mid, mc: MC.midRound, say: `Rounding AC to ${tenth(Math.sqrt(B2))} first changed the answer. Keep AC² = ${B2} exact until the end.` },
    { v: round1(Math.sqrt(B2)), mc: MC.faceDiag, say: `That is the floor diagonal AC. AG also climbs the height ${h}.` },
    { v: trunc1(d), mc: MC.trunc, say: `Round, do not cut off: ${rt(D2)} = ${d.toFixed(4)}…` },
    { v: D2, mc: MC.rSquared, say: `${D2} is AG². Take its square root.` },
  ], `Keep AC² = ${B2} exact, add ${p2(h)}, then take the root and round.`);
};

// ===================== 17. critique-hypotenuse-assignment =====================
const findError: Gen = (R, n) => {
  const [x, y, c] = pick(R, [...FLUENT, ...APPLIED]);
  const [a, b] = R() < 0.5 ? [x, y] : [y, x];   // a known leg, b the leg Jo should get
  const name = pick(R, ['Jo', 'Max', 'Priya', 'Dev', 'Zoe', 'Luis']);
  const u = pick(R, UNITS_US);
  const wrong = Math.sqrt(a * a + c * c);
  const ctx = pick(R, ['tri', 'ladder', 'ramp'] as const);
  const lead = ctx === 'ladder' ? `A ${c} ${u} ladder leans on a wall with its foot ${a} ${u} out. ${name} finds the height x like this:`
    : ctx === 'ramp' ? `A ramp is ${c} ${u} long and covers ${a} ${u} along the ground. ${name} finds its rise x like this:`
      : `A right triangle has sides ${a} ${u} and ${c} ${u}, and x (see the picture). ${name} writes:`;
  const pic = ctx === 'tri' ? triPic(a, b, 'apex', { a: tu(a, u), b: 'x', c: tu(c, u) }) : rtSketch(ctx, a, b, { h: tu(a, u), v: 'x', c: tu(c, u) });
  return choiceItem(R, {
    id: `findError-${n}`, family: 'findError',
    prompt: `${lead} ${p2(I('x'))} = ${p2(a)} + ${p2(c)} = ${a * a + c * c}, so ${I('x')} ≈ ${tenth(wrong)} ${u}. What is wrong?`,
    board: `x^2 = ${a}^2 + ${c}^2`, picture: { pic },
    solution: [`${c} ${u} is across from the right angle: it is the hypotenuse, and x is a leg.`, `Check the size: a leg of ${tenth(wrong)} ${u} would be longer than the hypotenuse, ${c} ${u}. Impossible.`, `Repair: ${p2(I('x'))} = ${p2(c)} − ${p2(a)} = ${b * b}, ${I('x')} = ${S(`${b} ${u}`)}.`],
    steps: [`x^2 = ${c}^2 - ${a}^2 = ${b * b}`, `x = ${b}`],
  }, [
    { t: `${c} is the hypotenuse (across from the right angle), so ${p2(I('x'))} = ${p2(c)} − ${p2(a)} and ${I('x')} = ${b}`, ok: true, say: `Yes: and ${b} ${u} is shorter than ${c} ${u}, as a leg must be.` },
    { t: `Nothing: the work is right`, mc: MC.sizeCheck, say: `Check the size: x is a leg, and ${tenth(wrong)} is longer than the hypotenuse ${c}. That cannot be.` },
    { t: `${name} should add the lengths: ${I('x')} = ${a} + ${c}`, mc: MC.addLengths, say: `Lengths do not add like that, and ${a + c} would be even longer than ${c}.` },
  ]);
};
const sizeCheck: Gen = (R, n) => {
  const t1 = pick(R, [...FLUENT, ...APPLIED]), t2 = pick(R, [...FLUENT, ...APPLIED].filter(t => t !== t1)), t3 = pick(R, FLUENT.filter(t => t !== t1 && t !== t2));
  const u = pick(R, UNITS_US);
  const who = pick(R, ['Ms. Diaz', 'Mr. Okafor', 'Ms. Lund', 'Mr. Reyes', 'Ms. Chen', 'Mr. Shah']);
  const bad = t1[2] + int(R, 1, 4);
  const opts = shuffle(R, [
    { t: `A leg of ${bad} ${u}, with a hypotenuse of ${t1[2]} ${u}`, ok: true, say: `Yes: a leg can never be longer than the hypotenuse.` },
    { t: `A hypotenuse of ${t2[2]} ${u}, with legs ${t2[0]} ${u} and ${t2[1]} ${u}`, say: `That one is fine: ${t2[2]} is longer than each leg (and ${t2[0] * t2[0]} + ${t2[1] * t2[1]} = ${t2[2] * t2[2]}).` },
    { t: `A leg of ${t3[1]} ${u}, with a hypotenuse of ${t3[2]} ${u}`, say: `That one passes the size check: ${t3[1]} < ${t3[2]}.` },
  ]);
  return choiceItem(R, {
    id: `sizeCheck-${n}`, family: 'sizeCheck',
    prompt: `Three students in ${who}'s class each found a side of a right triangle (in ${u}). Which result MUST be wrong, without redoing any work?`,
    board: `\\text{leg} < \\text{hypotenuse}`,
    picture: { pic: triPic(t1[0], t1[1], pick(R, POSES), { a: '\\text{leg}', b: '\\text{leg}', c: '\\text{hypotenuse}' }) },
    solution: [`The hypotenuse is the longest side of a right triangle.`, `So a leg of ${bad} ${u} with a hypotenuse of ${t1[2]} ${u} ${S('must be wrong')}.`],
  }, [
    ...opts,
    { t: `None: you have to redo the work to tell`, mc: MC.sizeCheck, say: `A size check catches it at once: a leg of ${bad} cannot be longer than a hypotenuse of ${t1[2]}.` },
  ]);
};

// ===================== 18-19. insufficient-information, disprove-right-angle =====================
const ENOUGH_OPTS = ['Yes: the right angle is established', 'No: it only looks like a right angle', 'No: the angle is known not to be 90°'];
const enough: Gen = (R, n) => {
  const v = pick(R, ['mark', 'looks', 'rect', 'perp', 'known', 'looks', 'perp'] as const);
  const [a, b, c] = pick(R, FLUENT);
  const u = pick(R, UNITS_US);
  const ok = v === 'looks' ? 1 : v === 'known' ? 2 : 0;
  const ang = pick(R, [80, 85, 95, 100, 75]);
  let pic: Pic, givens: string;
  if (v === 'mark') { pic = rtSketch('plain', b, a, { h: tu(b, u), v: tu(a, u), c: '?' }); givens = `The corner is marked as a right angle.`; }
  else if (v === 'looks') { pic = rtSketch('plain', b, a, { h: tu(b, u), v: tu(a, u), c: '?' }, { mark: false, ask: true }); givens = `The sketch has no right-angle mark and nothing says the corner is square.`; }
  else if (v === 'rect') { pic = rectSketch(b, a, 'AC', 'ABC', ['A', 'B', 'C', 'D']); givens = `ABCD is a rectangle, AB = ${b} ${u}, BC = ${a} ${u}; the third side is the diagonal AC.`; }
  else if (v === 'perp') { pic = rtSketch('plain', b, a, { h: tu(b, u), v: tu(a, u), c: '?' }, { mark: false, ask: true }); givens = `The problem says the two sides are perpendicular.`; }
  else {
    const s = Math.sin((ang * Math.PI) / 180), co = Math.cos((ang * Math.PI) / 180);
    const [x, y] = [5, 3.6];
    pic = { kind: 'sketch', now: [], solve: [], spec: { pts: { K: [0, 0], H: [x, 0], V: [y * co, y * s] }, polys: [{ pts: ['K', 'H', 'V'], col: '#4A4580', alpha: 0.9 }], segs: [{ a: 'K', b: 'H', col: 'first', w: 6 }, { a: 'K', b: 'V', col: 'second', w: 6 }, { a: 'H', b: 'V', col: 'link', w: 6 }], angles: [{ at: 'K', a: 'H', b: 'V', t: `${ang}^{\\circ}` }], labels: [{ a: 'K', b: 'H', t: tu(b, u), col: 'first', ref: 'V' }, { a: 'K', b: 'V', t: tu(a, u), col: 'second', ref: 'H' }, { a: 'H', b: 'V', t: '?', col: 'link', ref: 'K' }], maxUnit: 120 } };
    givens = `The angle between the two sides is ${ang}°.`;
  }
  const say = [
    ok === 0 ? `Yes: ${v === 'rect' ? 'a rectangle has four right angles' : v === 'perp' ? 'perpendicular sides meet at 90°' : 'the mark says so'}. Then the third side is ${c} ${u}.` : `Nothing ${ok === 1 ? 'shows' : 'allows'} a right angle here.`,
    ok === 1 ? `Right: looking square is not a reason. Without a right angle, a² + b² = c² may be false.` : `It does not only look right: ${v === 'known' ? `it is ${ang}°, so it is NOT a right angle` : 'the right angle is given'}.`,
    ok === 2 ? `Right: ${ang}° is not 90°, so the theorem does not apply.` : `Nothing says the angle is not 90°.`,
  ];
  return choiceItem(R, {
    id: `enough-${n}`, family: 'enough',
    prompt: `Two sides of a triangle are ${A(`${b} ${u}`)} and ${B(`${a} ${u}`)}. ${givens} Can you use ${p2('a')} + ${p2('b')} = ${p2('c')} to find the third side?`,
    board: `\\text{third side} = \\,?`, picture: { pic },
    solution: [`The theorem needs a right angle that is GIVEN: a mark, a rectangle's corner, perpendicular sides, or a converse check.`, ok === 0 ? `Here it is given, so ${S('yes')}: ${a * a} + ${b * b} = ${c * c}, the third side is ${c} ${u}.` : ok === 1 ? `Here nothing gives it, so ${S('no')}: a picture that looks square is not enough.` : `Here the angle is ${ang}°, so ${S('no')}: it is not a right triangle.`],
  }, ENOUGH_OPTS.map((t, i) => ({ t, ok: i === ok, say: say[i]!, mc: i === ok ? undefined : i === 0 ? (ok === 1 ? MC.looks : MC.noRight) : undefined })));
};
const deckBrace: Gen = (R, n) => {
  const [a, b, c] = pick(R, [[6, 8, 10], [9, 12, 15], [12, 16, 20], [5, 12, 13], [8, 15, 17]] as const);
  const v = pick(R, ['square', 'checked', 'looks', 'off', 'looks'] as const);
  const name = pick(R, ['Rosa', 'Mr. Kim', 'Dana', 'Ali']);
  const why = v === 'square' ? `She checked the corner with a carpenter's square: it is 90°.`
    : v === 'checked' ? `Before, she measured exactly ${a} ft and ${b} ft from the corner and exactly ${c} ft between the marks.`
      : v === 'looks' ? `Nobody checked the corner; it looks square.` : `The corner was measured: it is ${pick(R, [85, 95, 93, 87])}°.`;
  const ok = v === 'square' || v === 'checked' ? 0 : v === 'looks' ? 1 : 2;
  return choiceItem(R, {
    id: `deckBrace-${n}`, family: 'deckBrace',
    prompt: `${name} builds a deck. Two boards meet at a corner, ${a} ft and ${b} ft long. ${why} ${name} says the brace between their ends is ${rt(`${a * a} + ${b * b}`)} = ${c} ft. Is that justified?`,
    board: `\\sqrt{${a}^2 + ${b}^2} = ${c}`,
    picture: { pic: rtSketch('deck', b, a, { h: tu(b, 'ft'), v: tu(a, 'ft'), c: '?' }, { mark: ok === 0, ask: ok !== 0 }) },
    solution: [`The brace length comes from a² + b² = c² only if the corner is a right angle.`, ok === 0 ? `${v === 'square' ? 'The square checked it' : `${a * a} + ${b * b} = ${c * c}, so by the converse the corner is 90°`}: ${S('justified')}.` : ok === 1 ? `Looking square is not enough: ${S('not justified')} until the corner is checked.` : `The corner is not 90°: ${S('not justified')}; the brace is a different length.`],
  }, [
    { t: 'Yes: the corner is known to be a right angle', ok: ok === 0, mc: ok === 1 ? MC.looks : ok === 2 ? MC.noRight : undefined, say: ok === 0 ? `Yes: the right angle is established, so the theorem applies.` : ok === 1 ? `Looking square is not knowing. Check the corner first.` : `The corner is not 90°, so a² + b² = c² does not give the brace.` },
    { t: 'No: nobody knows the corner is a right angle', ok: ok === 1, say: ok === 1 ? `Right: check the corner first (for example ${a}, ${b}, ${c} with a tape).` : ok === 0 ? `It is known: ${v === 'square' ? 'the carpenter\'s square showed 90°' : 'the exact check proves it'}.` : `It is known, and it is NOT 90°.` },
    { t: 'No: the corner is known not to be a right angle', ok: ok === 2, say: ok === 2 ? `Right: so the theorem does not apply.` : `Nothing says the corner is off.` },
  ]);
};
const refute: Gen = (R, n) => {
  const measured = R() < 0.35;
  const name = pick(R, ['Lee', 'Ava', 'Raj', 'Kim', 'Eli']);
  if (measured) {
    const [a, b, c] = pick(R, [[3, 4, 5], [6, 8, 10], [9, 12, 15], [5, 12, 13]] as const);
    return choiceItem(R, {
      id: `refute-${n}`, family: 'refute',
      prompt: `${name} measures a frame with a tape (to the nearest inch): ${a} ft, ${b} ft, and ${c} ft across the corner. What can ${name} say about the corner?`,
      board: `${a}^2 + ${b}^2 = ${c}^2\\ (\\text{measured})`,
      picture: { pic: rtSketch('deck', b, a, { h: tu(b, 'ft'), v: tu(a, 'ft'), c: tu(c, 'ft') }, { mark: false, ask: true }) },
      solution: [`Measured lengths are rounded: the real ones can be a little off.`, `${a * a} + ${b * b} = ${c * c} with the measured numbers, so the corner is ${S('very close to 90°')}.`, `A measurement cannot prove an EXACT right angle; exact lengths can.`],
    }, [
      { t: 'It is very close to a right angle; a rounded measurement cannot prove it is exactly 90°', ok: true, say: `Yes: good enough for building, but not a proof.` },
      { t: 'It is exactly 90°', mc: MC.roundedExact, say: `The tape rounds to the nearest inch: the real lengths could be a little off, so it could be 89.8°.` },
      { t: 'It is not a right angle', say: `The measured numbers fit a² + b² = c². Nothing shows it is off.` },
    ]);
  }
  const s = pick(R, [[6, 8, 11], [5, 7, 9], [20, 21, 30], [10, 20, 23], [7, 8, 11], [9, 12, 16], [8, 15, 18], [12, 16, 21], [5, 12, 14], [7, 24, 26], [15, 20, 26]] as const);
  const [a, b, c] = sorted3([...s]);
  const sum = a * a + b * b, C2 = c * c;
  return choiceItem(R, {
    id: `refute-${n}`, family: 'refute',
    prompt: `${name} claims the triangle with sides of exactly ${a}, ${b} and ${c} units has a right angle. What can you conclude?${c > 15 ? ' (Calculator allowed.)' : ''}`,
    board: `${a}^2 + ${b}^2 \\overset{?}{=} ${c}^2`,
    picture: { pic: sssSketch([a, b, c], [String(a), String(b), String(c)], { ask: true }) },
    solution: [`If it had a right angle, the theorem would force ${p2(a)} + ${p2(b)} = ${p2(c)}.`, `But ${a * a} + ${b * b} = ${sum} and ${p2(c)} = ${C2}.`, `${sum} ≠ ${C2}, so it ${S('cannot have a right angle')}: ${name}'s claim is false.`],
    steps: [`${a}^2 + ${b}^2 = ${sum}`, `${c}^2 = ${C2}`, `${sum} \\neq ${C2}`],
  }, [
    { t: `It has no right angle: ${sum} ≠ ${C2}`, ok: true, say: `Yes: an exact failure proves it is not a right triangle.` },
    { t: `It is a right angle: ${sum} is close to ${C2}`, mc: MC.nearRight, say: `The lengths are exact, so close is not enough: ${sum} ≠ ${C2}.` },
    { t: `Not enough information to tell`, say: `The three exact lengths ARE enough: if it were right, ${sum} would equal ${C2}.` },
  ]);
};

// ===================== 20-22. inner-square-justification, dissection-area-argument, converse-proof =====================
const PROOF_AB: readonly [number, number][] = [[3, 4], [2, 5], [3, 5], [2, 3], [4, 5], [1, 3], [3, 7], [2, 7], [4, 7], [5, 7], [1, 4]];
const whySquare: Gen = (R, n) => {
  const [a, b] = pick(R, PROOF_AB);
  if (R() < 0.6) return choiceItem(R, {
    id: `whySquare-${n}`, family: 'whySquare',
    prompt: `Four copies of a right triangle (legs ${a} and ${b}) sit in a big square of side ${a} + ${b}. Why is the shape in the middle a square?`,
    board: `\\text{middle} = c \\times c\\,?`,
    picture: { pic: { kind: 'proof', a, b, stage: 'mid' } },
    solution: [`Its four sides are the four hypotenuses: all c long.`, `At each corner, a straight side of the big square (180°) is split into the triangle's two sharp angles and the middle corner.`, `The two sharp angles add to 90°, so the middle corner is 180° − 90° = 90°: ${S('four equal sides and four right angles')}.`],
  }, [
    { t: 'Its sides are the four hypotenuses (all c), and each corner is 180° − 90° = 90°', ok: true, say: `Yes: equal sides AND right angles, both from the triangles.` },
    { t: 'It looks like a square', mc: MC.looks, say: `Looks can fool you; a proof uses what is given: the four sides are hypotenuses, and the corners come out 90°.` },
    { t: 'It has four equal sides', mc: MC.reasonNot, say: `Four equal sides only makes a rhombus. You also need the corners: 180° − 90° = 90°.` },
  ]);
  return choiceItem(R, {
    id: `whySquare-${n}`, family: 'whySquare',
    prompt: `After the triangles (legs ${a} and ${b}) slide, two shapes are left uncovered in the big square. Why is the smaller one a square of side ${a}?`,
    board: `\\text{left over} = ${a}^2 + ${b}^2\\,?`,
    picture: { pic: { kind: 'proof', a: Math.min(a, b), b: Math.max(a, b), stage: 'left' } },
    solution: [`Its sides are a leg of a triangle and a piece of the big square's side: all ${a} long.`, `Its corners are a corner of the big square and the right angles of the triangles: all 90°.`, `So it is ${S(`a square of side ${a}`)}, area ${a * a}.`],
  }, [
    { t: `Its sides are all ${a} long, and its corners come from the big square's corner and the triangles' right angles`, ok: true, say: `Yes: equal sides and right angles, both from the pieces.` },
    { t: 'It looks like a square', mc: MC.looks, say: `A proof cannot rest on looks. Use the pieces: sides of length ${a}, right-angle corners.` },
    { t: `It has four equal sides`, mc: MC.reasonNot, say: `Equal sides alone could make a rhombus. The corners must be 90° too.` },
  ]);
};
const innerAngle: Gen = (R, n) => {
  const x = int(R, 22, 68);
  const askOther = R() < 0.45;
  return numItem({
    id: `innerAngle-${n}`, family: 'innerAngle',
    prompt: askOther
      ? `One sharp angle of the right triangle is ${x}°. What is the other sharp angle?`
      : `The right triangle's sharp angles are ${x}° and ${90 - x}°. At a corner of the middle shape, the straight side (180°) is split into these two angles and the middle corner. How big is the middle corner?`,
    board: askOther ? `${x}^{\\circ} + \\,? + 90^{\\circ} = 180^{\\circ}` : `${x}^{\\circ} + ${90 - x}^{\\circ} + \\,? = 180^{\\circ}`, unit: '°',
    picture: { pic: { kind: 'proof', a: 3, b: 4, stage: 'mid' } },
    solution: askOther
      ? [`The angles of a triangle add to 180°; the right angle takes 90°.`, `180° − 90° − ${x}° = ${S(`${90 - x}°`)}.`, `So the two sharp angles always add to 90°.`]
      : [`Along a straight side: ${x}° + ${90 - x}° + middle = 180°.`, `Middle = 180° − 90° = ${S('90°')}: the middle shape has right angles.`],
    steps: askOther ? [`180 - 90 - ${x} = ${90 - x}`] : [`180 - ${x} - ${90 - x} = 90`],
  }, askOther ? 90 - x : 90, askOther ? `Yes: ${90 - x}°, so the sharp angles add to 90°.` : `Yes: 90°, every corner of the middle shape.`, askOther ? [
    { v: 180 - x, say: `The triangle also has the 90° angle: 180° − 90° − ${x}°.` },
  ] : [
    { v: 180 - x, say: `Both sharp angles are on the straight side: 180° − ${x}° − ${90 - x}°.` },
  ], askOther ? `Angles in a triangle add to 180°.` : `Angles along a straight side add to 180°.`);
};
const equalRemainders: Gen = (R, n) => {
  const [a, b] = pick(R, PROOF_AB);
  const s = a + b, tri = (a * b) / 2, left = s * s - 4 * tri;
  const v = int(R, 0, 2);
  const prompt = v === 0
    ? `The big square has side ${a} + ${b} = ${s}. Four triangles with legs ${a} and ${b} lie in it around the middle square. What area is NOT covered by the triangles?`
    : v === 1 ? `After sliding, the same four triangles leave two squares uncovered, of sides ${a} and ${b}. What is their total area?`
      : `Both arrangements use the same big square (side ${s}) and the same four triangles (legs ${a} and ${b}). The middle square has area ${p2('c')}. What is ${p2('c')}?`;
  return numItem({
    id: `equalRemainders-${n}`, family: 'equalRemainders', prompt,
    board: v === 1 ? `${a}^2 + ${b}^2 = \\,?` : `${s}^2 - 4 \\times ${fmt(tri)} = \\,?`, unit: 'square units',
    picture: { pic: { kind: 'proof', a: Math.min(a, b), b: Math.max(a, b), stage: v === 1 ? 'left' : 'mid' } },
    solution: [`Big square: ${s} × ${s} = ${s * s}. Four triangles: 4 × ${fmt(tri)} = ${2 * a * b}.`, `Uncovered: ${s * s} − ${2 * a * b} = ${left} in BOTH arrangements.`, `Arrangement 1 leaves c², arrangement 2 leaves ${a * a} + ${b * b} = ${S(left)}: so c² = a² + b².`],
    steps: [`${s}^2 - 4 \\times ${fmt(tri)} = ${left}`, `${a}^2 + ${b}^2 = ${left}`],
  }, left, `Yes: ${left}, the same in both arrangements.`, [
    { v: s * s, say: `${s * s} is the whole big square. Take away the four triangles.` },
    { v: s * s - tri, say: `There are FOUR triangles: take away 4 × ${fmt(tri)}.` },
    { v: (a + b) ** 2 - a * b, say: `Each triangle is HALF of ${a} × ${b}: 4 × ${fmt(tri)} = ${2 * a * b}.` },
  ], `Big square minus the four triangles.`);
};
const proofLogic: Gen = (R, n) => {
  const [a, b] = pick(R, PROOF_AB);
  const name = pick(R, ['Mia', 'Jon', 'Tess', 'Noah', 'Aria']);
  return choiceItem(R, {
    id: `proofLogic-${n}`, family: 'proofLogic',
    prompt: `${name} draws the two arrangements with legs ${a} and ${b} and finds c² = ${a * a + b * b} = ${p2(a)} + ${p2(b)}. Why does the same picture prove a² + b² = c² for EVERY right triangle?`,
    board: `a^2 + b^2 = c^2\\ \\text{for all?}`,
    picture: { pic: { kind: 'proof', a: Math.min(a, b), b: Math.max(a, b), stage: 'left' } },
    solution: [`The steps never use the numbers ${a} and ${b}: for ANY legs a and b, the same big square holds the same four triangles.`, `Equal totals minus equal parts leave equal remainders: c² in one, a² + b² in the other.`, `So it is a proof for every right triangle, not just an example.`],
  }, [
    { t: 'The steps work for any legs a and b: equal squares minus equal triangles leave equal remainders', ok: true, say: `Yes: the argument never used the particular numbers.` },
    { t: `Because it worked for ${a}-${b} and for 3-4-5 too`, mc: MC.examples, say: `Examples cannot prove "every". The proof works because no step depends on the numbers.` },
    { t: 'Because the two pictures look the same size', mc: MC.looks, say: `They ARE the same size, by construction: both big squares have side a + b. That is the reason, not the look.` },
  ]);
};
const CONV: readonly [number, number, number][] = [[5, 12, 13], [3, 4, 5], [8, 15, 17], [6, 8, 10], [7, 24, 25], [9, 12, 15], [20, 21, 29]];
const converseStep: Gen = (R, n) => {
  const [a, b, c] = pick(R, CONV);
  const k = int(R, 0, 2);
  const claims = [`Build a right triangle with legs ${a} and ${b}.`, `Its hypotenuse is ${c}.`, `The given triangle has a right angle across from the side ${c}.`];
  const reasons = [
    { t: 'Two perpendicular sides of any lengths can always be drawn', say: `Yes: draw a right angle, then mark ${a} and ${b} along its sides.` },
    { t: `The theorem applies to the new right triangle: ${a * a} + ${b * b} = ${c * c} = ${p2(c)}`, say: `Yes: the new triangle IS right, so its hypotenuse squared is ${c * c}, and the hypotenuse is ${c}.` },
    { t: 'Triangles with the same three side lengths are copies, so their angles match', say: `Yes: the given triangle and the new one have sides ${a}, ${b}, ${c}: the same triangle, so the same right angle.` },
  ];
  return choiceItem(R, {
    id: `converseStep-${n}`, family: 'converseStep',
    prompt: `The converse: a triangle has sides ${a}, ${b}, ${c} and ${p2(a)} + ${p2(b)} = ${p2(c)}. Proof step ${k + 1}: “${claims[k]}” Which reason makes this step true?`,
    board: `${a}^2 + ${b}^2 = ${c}^2 \\Rightarrow \\text{right?}`,
    picture: { pic: converseSketch(a, b, String(c), String(a), String(b)) },
    solution: [`1. ${claims[0]} (Two perpendicular sides of any lengths can be drawn.)`, `2. ${claims[1]} (The theorem applies to it: ${a * a} + ${b * b} = ${c * c}.)`, `3. ${claims[2]} (Same three sides: the same triangle, so the same angles.)`],
  }, [
    ...reasons.map((r, i) => ({ t: r.t, ok: i === k, say: i === k ? r.say : `True, but that is the reason for step ${i + 1}.` })),
    { t: 'Every rule also works backward', mc: MC.converse, say: `Not every rule works backward ("if it is a square, it has four right angles"; a rectangle does too). The converse needs this proof.` },
  ]);
};
const RULES: readonly { rule: string; back: string; ce: string }[] = [
  { rule: 'If a shape is a square, it has four right angles.', back: 'If a shape has four right angles, it is a square.', ce: 'a 2 by 5 rectangle has four right angles and is not a square' },
  { rule: 'If x = 3, then x² = 9.', back: 'If x² = 9, then x = 3.', ce: 'x = −3 also gives x² = 9' },
  { rule: 'If a number ends in 0, it is even.', back: 'If a number is even, it ends in 0.', ce: '14 is even and ends in 4' },
  { rule: 'If an animal is a dog, it has four legs.', back: 'If an animal has four legs, it is a dog.', ce: 'a cat has four legs' },
  { rule: 'If a triangle is equilateral, it has two equal sides.', back: 'If a triangle has two equal sides, it is equilateral.', ce: 'a 5, 5, 8 triangle has two equal sides and is not equilateral' },
];
const converseWhy: Gen = (R, n) => {
  const r = pick(R, RULES);
  const name = pick(R, ['Lena', 'Omar', 'Ruby', 'Cole', 'Sofi']);
  const [a, b, c] = pick(R, CONV);
  return choiceItem(R, {
    id: `converseWhy-${n}`, family: 'converseWhy',
    prompt: `${name}: “Right triangle → ${p2('a')} + ${p2('b')} = ${p2('c')}, so ${p2('a')} + ${p2('b')} = ${p2('c')} → right triangle: rules work backward.” Try it on “${r.rule}” Is ${name}'s reason good?`,
    board: `\\text{right} \\Rightarrow a^2 + b^2 = c^2`,
    picture: { pic: converseSketch(a, b, String(c), String(a), String(b)) },
    solution: [`A rule does not always work backward: ${r.ce}.`, `The converse of the Pythagorean theorem IS true, but it needs its own proof:`, `build a right triangle with legs a and b, its hypotenuse is c (theorem), same three sides, so the same right angle.`],
  }, [
    { t: `No: rules do not always flip (${r.ce})`, ok: true, say: `Yes: the converse is true, but because of a proof, not because rules flip.` },
    { t: 'Yes: every rule works backward', mc: MC.converse, say: `Try it: “${r.back}” is false, because ${r.ce}.` },
    { t: `Yes: ${a}, ${b}, ${c} is a right triangle, so it always works`, mc: MC.examples, say: `One example that works proves nothing about every triangle. The converse needs a proof.` },
  ]);
};

// ---------- the table ----------
export const GENERATORS: Record<FamilyId, Gen> = {
  hypOpp, embedded, tiltArea, tiltSteps, missingSq, unitsAreas, writeEq, legOrHyp, holdsOrNot, counterEx, hyp, rootFinish, leg,
  bracketRt, tenthRt, squareCheck, exactLen, lenTenth, isRight, whereRight, story, whichTri, dist, distLegs, perp3d, whichTri3d,
  faceOrSpace, spaceDiag, keepExact, findError, sizeCheck, enough, deckBrace, refute, whySquare, innerAngle, equalRemainders,
  proofLogic, converseStep, converseWhy,
};
