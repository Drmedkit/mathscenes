// items.ts: exercise families for "Graphing inequalities in two variables" (secondary-t6-33, Algebra 1, lesson 7),
// generated from templates, checked exactly, and every wrong answer a typical slip produces classified against the
// misconception catalogue (math-curriculum-essentials ids). A generator gets the SUB-GOAL it practises (plan.ts) and
// uses that sub-goal's cases from the topic JSON. Pictures are data (ineqPic.ts): the plane with what is DRAWN (lines,
// shaded regions, points), the parts that would give the answer away held back for the worked solution.
// Pure: no DOM, no canvas; a seeded rng, no module state.
import { type Item, type Response, type Verdict, gcd, int, pick, shuffle } from '../../runtime/item';
import { ans, endOnChoice } from '../../runtime/explain';
import type { Paint } from '../../../core/theme';
import {
  type Form, type Op, type Q, OPS, P, PT, cmp, eqH, eqT, exprH, fH, fT, flip, greater, halfOf, holds, lhs, nH, nT, onLine, opH, opT,
  otherSide, par, q, qH, qNeg, qNum, rel, side, strict, subSI, subStd, toggleIncl, withOp, r3,
} from './ineq';
import { stdH, stdT } from '../linear-functions-slope/lineMaths';
import { type GAxis, type GItem, type GPic, type Pic, win } from './ineqPic';

export type FamilyId =
  | 'readPoint' | 'evalExpr' | 'compareTF' | 'isSolution' | 'whichSolution' | 'hvMember' | 'hvGraph' | 'regionShape' | 'farPoint'
  | 'boundaryOf' | 'inclusionPair' | 'lineStyle' | 'intercepts' | 'throughOrigin' | 'matchBoundary' | 'wrongStyle' | 'testPointSide'
  | 'siGraph' | 'writeGraph' | 'axisSide' | 'stdSide' | 'isolateY' | 'bZero' | 'psRead' | 'psToSI' | 'sysPoint' | 'sysRegion'
  | 'sysCorner' | 'specialKind' | 'multiPoint' | 'addConstraint' | 'whyIncluded' | 'oneTestWhy' | 'vertCompare' | 'writeTable'
  | 'critique' | 'critiqueSystem' | 'viablePlan' | 'phraseIneq' | 'psContext' | 'wholeOnly' | 'countBoundary' | 'vertexPair'
  | 'notVertex' | 'lpBest' | 'lpSpecial';
export const FAMILIES: readonly { id: FamilyId; name: string }[] = [
  { id: 'readPoint', name: 'Read a point' },
  { id: 'evalExpr', name: 'Put the numbers in' },
  { id: 'compareTF', name: 'True or false?' },
  { id: 'isSolution', name: 'Solution or not?' },
  { id: 'whichSolution', name: 'Which point works?' },
  { id: 'hvMember', name: 'On the line x = a' },
  { id: 'hvGraph', name: 'x = a in the plane' },
  { id: 'regionShape', name: 'What the solutions form' },
  { id: 'farPoint', name: 'Off the grid' },
  { id: 'boundaryOf', name: 'Name the boundary' },
  { id: 'inclusionPair', name: 'On the line: in or out?' },
  { id: 'lineStyle', name: 'Dashed or solid' },
  { id: 'intercepts', name: 'Intercepts of the boundary' },
  { id: 'throughOrigin', name: 'Through the origin' },
  { id: 'matchBoundary', name: 'Which line is it?' },
  { id: 'wrongStyle', name: 'Spot the line style' },
  { id: 'testPointSide', name: 'Test a point' },
  { id: 'siGraph', name: 'Graph y < mx + b' },
  { id: 'writeGraph', name: 'Read the graph back' },
  { id: 'axisSide', name: 'Flat and upright boundaries' },
  { id: 'stdSide', name: 'Which side? (Ax + By)' },
  { id: 'isolateY', name: 'Get y alone' },
  { id: 'bZero', name: 'No y at all' },
  { id: 'psRead', name: 'Point-slope boundary' },
  { id: 'psToSI', name: 'Point-slope to y = mx + b' },
  { id: 'sysPoint', name: 'Both at once?' },
  { id: 'sysRegion', name: 'Pick the region' },
  { id: 'sysCorner', name: 'The corner point' },
  { id: 'specialKind', name: 'Strips, lines and nothing' },
  { id: 'multiPoint', name: 'Three or four constraints' },
  { id: 'addConstraint', name: 'Add a constraint' },
  { id: 'whyIncluded', name: 'Why solid, why dashed' },
  { id: 'oneTestWhy', name: 'Why one test point' },
  { id: 'vertCompare', name: 'Straight up from the line' },
  { id: 'writeTable', name: 'Inequality from a table' },
  { id: 'critique', name: 'Find the mistake' },
  { id: 'critiqueSystem', name: 'Find the mistake (systems)' },
  { id: 'viablePlan', name: 'Does the plan work?' },
  { id: 'phraseIneq', name: 'Words to an inequality' },
  { id: 'psContext', name: 'A plan in point-slope form' },
  { id: 'wholeOnly', name: 'Whole numbers only' },
  { id: 'countBoundary', name: 'Count the whole-number points' },
  { id: 'vertexPair', name: 'Find the vertex' },
  { id: 'notVertex', name: 'Vertex or not?' },
  { id: 'lpBest', name: 'Best plan' },
  { id: 'lpSpecial', name: 'Max, edge, none' },
];
export const FAMILY_NAMES: Record<string, string> = Object.fromEntries(FAMILIES.map(f => [f.id, f.name]));
export interface IItem extends Item { family: FamilyId; picture?: Pic; slips?: Response[] }
type Gen = (R: () => number, n: number, sg?: string) => IItem;

// ---------- misconception ids ----------
export const MC = {
  order: 'mc.coordinate-geometry.reverses-coordinate-order',
  negSub: 'mc.integers.subtract-negative-as-positive',
  lattice: 'mc.linear-equations.inequality-solutions-must-be-lattice-points',
  strictIn: 'mc.linear-equations.strict-includes-boundary',
  inclOut: 'mc.linear-equations.inclusive-excludes-boundary',
  fixedX: 'mc.coordinate-geometry.fixed-x-read-as-horizontal',
  nlObject: 'mc.coordinate-geometry.one-variable-graph-as-number-line-object',
  bOnly: 'mc.linear-equations.boundary-only-solution',
  gridEdge: 'mc.systems.grid-edge-bounds-inequality-region',
  styleMeaning: 'mc.linear-equations.boundary-style-meaning-confused',
  styleConv: 'mc.linear-equations.endpoint-style-convention',
  dashedNone: 'mc.linear-equations.dashed-boundary-treated-as-nonexistent',
  ignoresIncl: 'mc.linear-equations.ignores-boundary-inclusion',
  izSwap: 'mc.linear-functions.intercept-zero-swap',
  izOrigin: 'mc.linear-functions.intercept-method-through-origin',
  tpSide: 'mc.linear-equations.always-shades-test-point-side',
  tpMisused: 'mc.linear-equations.test-point-misused',
  aboveGreater: 'mc.linear-equations.shades-above-for-greater',
  noRev: 'mc.linear-equations.no-reversal-for-negative',
  divZero: 'mc.linear-equations.omits-nonzero-divisor-condition',
  partial: 'mc.properties.partial-distribution',
  zeroSign: 'mc.quadratic-polynomial.wrong-sign-zero-factor',
  oneCond: 'mc.systems.one-condition-enough',
  alwaysRegion: 'mc.systems.inequality-system-always-region',
  replaces: 'mc.systems.new-constraint-replaces',
  memorized: 'mc.reasoning-language.memorized-rule-as-justification',
  tpDistrust: 'mc.linear-equations.test-point-distrusted',
  tpTrick: 'mc.linear-equations.test-point-as-unjustified-trick',
  examples: 'mc.reasoning-language.examples-as-proof',
  finite: 'mc.reasoning-language.finite-data-fixes-unique-rule',
  swapRates: 'mc.expressions.swaps-rates-between-variables',
  phraseRev: 'mc.linear-equations.bound-phrase-direction-reversed',
  eqBound: 'mc.linear-equations.equation-for-a-bound',
  fracCount: 'mc.functions-concept.discrete-quantity-allows-fractions',
  everyCross: 'mc.systems.every-boundary-intersection-vertex',
  lpFar: 'mc.systems.lp-optimum-farthest-vertex',
  lpInside: 'mc.systems.lp-optimum-inside-region',
  lpUnbounded: 'mc.systems.lp-max-on-unbounded-region',
} as const;

// ---------- building blocks ----------
const X = '<i>x</i>', Yv = '<i>y</i>';
const near = (a: number, b: number) => Math.abs(a - b) < 1e-6;
interface Base { id: string; family: FamilyId; prompt: string; board: string; solution: string[]; picture?: Pic; unit?: string }
/** sem = a key of what the option MEANS (a line, a set): an option that means the same as the answer is dropped */
interface Opt { t: string; mc?: string; say: string; sem?: string }
const kn = (v: number) => String(Math.round(v * 1e6) / 1e6 + 0);
/** the line A x + B y = C, scaled so the first nonzero coefficient is 1 */
export function lineKey(A: number, B: number, C: number): string { const g = Math.abs(A) > 1e-12 ? A : B; return `L ${kn(A / g)} ${kn(B / g)} ${kn(C / g)}`; }
/** the solution set of a form: its line, and the operator as seen with the first coefficient positive */
export function relKey(F: Form): string {
  const r = rel(F), g = Math.abs(r.A) > 1e-12 ? r.A : r.B;
  return `${lineKey(r.A, r.B, r.C)} ${g < 0 ? flip(r.op) : r.op}`;
}
/** the line through (x, y) with slope m */
const ptSlopeKey = (x: number, y: number, m: number) => lineKey(-m, 1, y - m * x);
/** a choice item: the right option and the slips (duplicates are dropped), shuffled unless `fixed` */
function choice(R: () => number, b: Base, right: string, okSay: string, wrongs: Opt[], o: { max?: number; fixed?: boolean; sem?: string } = {}): IItem {
  const max = o.max ?? 4;
  const seen = new Set([right]), ws: Opt[] = [];
  for (const w of wrongs) if (!seen.has(w.t) && ws.length < max - 1 && !(o.sem && w.sem === o.sem)) { seen.add(w.t); ws.push(w); }
  if (!ws.length) throw new Error(`${b.family}: no wrong option`);
  const all = [{ t: right, say: okSay, ok: true }, ...ws.map(w => ({ ...w, ok: false }))];
  const opts = o.fixed ? all : shuffle(R, all);
  const i = opts.findIndex(x => x.ok);
  return {
    ...b, input: 'choice', choices: opts.map(x => x.t), answer: { kind: 'choice', i }, solution: endOnChoice(b.solution, right),
    check(r: Response): Verdict {
      if (r.kind !== 'choice' || !opts[r.i]) return { ok: false, say: 'Pick one of the options.' };
      if (r.i === i) return { ok: true, say: okSay };
      const x = opts[r.i] as Opt;
      return { ok: false, mc: x.mc, say: x.say };
    },
  };
}
/** a choice among fixed options in a fixed order; `right` is the index, `opts[j].mc` the slip of each wrong one */
function fixedChoice(b: Base, opts: Opt[], right: number): IItem {
  return {
    ...b, input: 'choice', choices: opts.map(x => x.t), answer: { kind: 'choice', i: right }, solution: endOnChoice(b.solution, opts[right]!.t),
    check(r: Response): Verdict {
      if (r.kind !== 'choice' || !opts[r.i]) return { ok: false, say: 'Pick one of the options.' };
      if (r.i === right) return { ok: true, say: opts[right]!.say };
      return { ok: false, mc: opts[r.i]!.mc, say: opts[r.i]!.say };
    },
  };
}
interface NumSlip { v: number; mc?: string; say: string }
function numItem(b: Base, v: number, okSay: string, slips: NumSlip[], other: string): IItem {
  return {
    ...b, input: 'num', answer: { kind: 'num', v }, slips: slips.map(s => ({ kind: 'num', v: s.v }) as Response),
    check(r: Response): Verdict {
      if (r.kind !== 'num' || !Number.isFinite(r.v)) return { ok: false, say: 'Type a number.' };
      if (near(r.v, v)) return { ok: true, say: okSay };
      const s = slips.find(s => !near(s.v, v) && near(r.v, s.v));
      return s ? { ok: false, mc: s.mc, say: s.say } : { ok: false, say: other };
    },
  };
}
interface PairSlip { x: number; y: number; mc?: string; say: string }
function pairItem(b: Base, x: number, y: number, io: { lead: string; op: string; tail?: string }, okSay: string, slips: PairSlip[], other: string): IItem {
  return {
    ...b, input: 'pair', pairLead: io.lead, pairOp: io.op, pairTail: io.tail, answer: { kind: 'pair', x, y }, slips: slips.map(s => ({ kind: 'pair', x: s.x, y: s.y }) as Response),
    check(r: Response): Verdict {
      if (r.kind !== 'pair' || !Number.isFinite(r.x) || !Number.isFinite(r.y)) return { ok: false, say: 'Fill in both boxes.' };
      if (near(r.x, x) && near(r.y, y)) return { ok: true, say: okSay };
      const s = slips.find(s => !(near(s.x, x) && near(s.y, y)) && near(r.x, s.x) && near(r.y, s.y));
      return s ? { ok: false, mc: s.mc, say: s.say } : { ok: false, say: other };
    },
  };
}
const PTIO = { lead: '(', op: ',', tail: ')' };
const NAMES = ['Ana', 'Ben', 'Chloe', 'Diego', 'Eli', 'Fatima', 'Grace', 'Hugo', 'Isla', 'Jamal', 'Kenji', 'Lena', 'Marco', 'Nora', 'Owen', 'Priya', 'Quinn', 'Rosa', 'Sam', 'Tariq'];
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'K', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W'];

// ---------- picture pieces ----------
/** the boundary of a form, dashed when the inequality is strict (or as `dash` says) */
function bl(key: string, F: Form, o: { col?: Paint; dash?: boolean; name?: string } = {}): GItem {
  const r = rel(F);
  return { kind: 'bline', key, A: r.A, B: r.B, C: r.C, dash: o.dash ?? strict(r.op), col: o.col, name: o.name };
}
const sh = (key: string, Fs: readonly Form[], col?: Paint, alpha?: number): GItem => ({ kind: 'shade', key, parts: Fs.map(halfOf), col, alpha });
const dot = (key: string, x: number, y: number, col: Paint = 'pick', name?: string, open?: boolean): GItem => ({ kind: 'point', key, x, y, col, name, open });
const pic = (g: Omit<GPic, 'x' | 'y' | 'equal'> & Partial<Pick<GPic, 'x' | 'y' | 'equal'>>, extra: Omit<Pic, 'g'> = {}): Pic => ({ g: { ...win(), ...g } as GPic, ...extra });

// ---------- random forms ----------
const SLOPES_SI: readonly Q[] = [q(0), q(1), q(-1), q(2), q(-2), q(1, 2), q(-1, 2)];
const SLOPES_INT: readonly Q[] = [q(1), q(-1), q(2), q(-2), q(3), q(-3)];
const randOp = (R: () => number): Op => pick(R, OPS);
function randSI(R: () => number, slopes: readonly Q[] = SLOPES_SI, bLo = -4, bHi = 4): Form & { f: 'si' } {
  return { f: 'si', m: pick(R, slopes), b: q(int(R, bLo, bHi)), op: randOp(R) };
}
/** Ax + By op C with integer intercepts (both inside ±maxI), A, B in ±1..±4, not both of size 1 too often */
function randStd(R: () => number, o: { cZero?: boolean; bNeg?: boolean; maxI?: number } = {}): Form & { f: 'std' } {
  const maxI = o.maxI ?? 5;
  for (let t = 0; t < 200; t++) {
    const A = pick(R, [1, 2, 3, 4, -1, -2, -3, -4]);
    let B = pick(R, [1, 2, 3, 4, -1, -2, -3, -4]);
    if (o.bNeg !== undefined) B = o.bNeg ? -Math.abs(B) : Math.abs(B);
    if (Math.abs(A) === 1 && Math.abs(B) === 1 && R() < 0.6) continue;
    if (o.cZero) { const g = gcd(A, B); return { f: 'std', A: A / g, B: B / g, C: 0, op: randOp(R) }; }
    const L = Math.abs(A * B) / gcd(A, B), C = L * pick(R, [1, -1, 2, -2]);
    if (Math.abs(C / A) > maxI || Math.abs(C / B) > maxI) continue;
    const g = gcd(gcd(A, B), C);
    return { f: 'std', A: A / g, B: B / g, C: C / g, op: randOp(R) };
  }
  return { f: 'std', A: 2, B: 3, C: 6, op: randOp(R) };
}
const randXY = (R: () => number, lo = -5, hi = 5): Form => (R() < 0.5 ? { f: 'x', c: int(R, lo, hi), op: randOp(R) } : { f: 'y', c: int(R, lo, hi), op: randOp(R) });
function randAny(R: () => number): Form {
  const k = R();
  return k < 0.4 ? randSI(R) : k < 0.75 ? randStd(R) : randXY(R, -4, 4);
}
/** the side in words: "above", "to the right of" */
const sideW = (s: string) => (s === 'above' || s === 'below' ? s : `to the ${s} of`);
const styleW = (F: Form) => (strict(F.op) ? 'dashed' : 'solid');
const Style = (F: Form) => (strict(F.op) ? 'Dashed' : 'Solid');
/** check of a form at a point, HTML: "3(2) − (−1) = 7, and 7 ≥ 6 is true" */
function checkAt(F: Form, x: number, y: number): string {
  const r = rel(F), ok = holds(F, x, y), tf = ok ? 'true' : 'false';
  if (F.f === 'si') { const v = r3(qNum(F.m) * x + qNum(F.b)); return `the right side is ${subSI(F.m, F.b, x)} = ${nH(v)}, and ${nH(y)} ${opH(F.op)} ${nH(v)} is ${tf}`; }
  if (F.f === 'ps') { const L = r3(y - F.y1), Rr = r3(qNum(F.m) * (x - F.x1)); return `the left side is ${nH(L)}, the right side ${nH(Rr)}, and ${nH(L)} ${opH(F.op)} ${nH(Rr)} is ${tf}`; }
  if (F.f === 'std') { const v = r3(lhs(r, x, y)); return `${subStd(F.A, F.B, x, y)} = ${nH(v)}, and ${nH(v)} ${opH(F.op)} ${nH(F.C)} is ${tf}`; }
  const v = F.f === 'x' ? x : y;
  return `${F.f === 'x' ? X : Yv} = ${nH(v)}, and ${nH(v)} ${opH(F.op)} ${nH(F.c)} is ${tf}`;
}
const tex = (...t: string[]) => t;

// =====================================================================================================================
// entry-check
// =====================================================================================================================
const readPoint: Gen = (R, n) => {
  let x = 0, y = 0;
  do {
    x = int(R, -5, 5); y = int(R, -5, 5);
    if (R() < 0.35) { if (R() < 0.5) x += x >= 0 ? 0.5 : -0.5; else y += y >= 0 ? 0.5 : -0.5; }
  } while (x === y || (x === 0 && y === 0) || Math.abs(x) > 5.5 || Math.abs(y) > 5.5);
  const Lt = pick(R, LETTERS);
  const items: GItem[] = [dot('P', x, y, 'first', Lt)];
  const solve: string[] = [];
  if (y !== 0) { items.unshift({ kind: 'seg', key: 'sx', a: [x, 0], b: [x, y], col: 'second', dash: true }); solve.push('sx'); }
  if (x !== 0) { items.unshift({ kind: 'seg', key: 'sy', a: [0, y], b: [x, y], col: 'first', dash: true }); solve.push('sy'); }
  return pairItem({
    id: `readPoint-${n}`, family: 'readPoint', prompt: `What are the coordinates of point ${Lt}?`, board: `${Lt} = (\\,?\\,,\\ ?\\,)`,
    solution: [`Across first: ${Lt} is straight above or below ${ans(nH(x))} on the ${X}-axis.`, `Then up or down: ${Lt} is level with ${ans(nH(y))} on the ${Yv}-axis.`],
    picture: pic({ items, show: ['P'], solve }, { tex: tex(`${Lt} = ${PT(x, y)}`) }),
  }, x, y, PTIO, `Yes: ${Lt} = ${P(x, y)}. Across first, then up or down.`,
  [{ x: y, y: x, mc: MC.order, say: `That is the order swapped. The first number is the ${X}-coordinate (across): ${Lt} = ${P(x, y)}.` }],
  `Read across to the ${X}-axis first, then up or down to the ${Yv}-axis.`);
};

const EXPRS: readonly [number, number][] = [[3, -1], [2, 5], [-2, 3], [4, -3], [1, -2], [-3, -2], [5, -1], [2, -4], [3, 2], [-1, -3]];
const exprAB = (A: number, B: number) => stdH({ A, B, C: 0 }).replace(' = 0', '');
const exprABT = (A: number, B: number) => stdT({ A, B, C: 0 }).replace(' = 0', '');
const evalExpr: Gen = (R, n) => {
  const [A, B] = pick(R, EXPRS);
  let x = int(R, -4, 4), y = R() < 0.65 ? -int(R, 1, 5) : int(R, 0, 5);
  if (R() < 0.3) x += x >= 0 ? 0.5 : -0.5;
  if (x === y) x = x === 0 ? 2 : -x;
  const v = r3(A * x + B * y), t1 = r3(A * x), t2 = r3(B * y);
  const slips: NumSlip[] = [];
  if (B < 0 && y < 0) slips.push({ v: r3(t1 - Math.abs(t2)), mc: MC.negSub, say: `${nH(B)} times ${nH(y)} is ${nH(t2)}: subtracting a negative ADDS. So it is ${nH(t1)} + ${nH(t2)}.` });
  if (A < 0 && x < 0) slips.push({ v: r3(-Math.abs(t1) + t2), mc: MC.negSub, say: `${nH(A)} times ${par(x)} is ${nH(t1)}: a negative times a negative is positive.` });
  const sw = r3(A * y + B * x);
  if (!near(sw, v)) slips.push({ v: sw, mc: MC.order, say: `The first number of ${P(x, y)} is ${X}, the second is ${Yv}. You put them in the other way round.` });
  return numItem({
    id: `evalExpr-${n}`, family: 'evalExpr', prompt: `Evaluate ${exprAB(A, B)} at ${P(x, y)}.`, board: `${exprABT(A, B)}\\ \\text{at}\\ ${PT(x, y)}`,
    solution: [`Put ${X} = ${nH(x)} and ${Yv} = ${nH(y)} in: ${subStd(A, B, x, y)}.`, `= ${nH(t1)} ${t2 < 0 ? '−' : '+'} ${nH(Math.abs(t2))} = ${ans(nH(v))}`],
    picture: { tex: tex(`= ${nT(v)}`) },
  }, v, `Yes: ${nH(v)}.`, slips, `Put ${X} = ${nH(x)} and ${Yv} = ${nH(y)} in, one term at a time, minding the signs.`);
};

const compareTF: Gen = (R, n) => {
  const a = int(R, -15, 15), k = R();
  const b = k < 0.4 ? a : a + pick(R, [-3, -2, -1, 1, 2, 3]);
  const op = randOp(R), truth = cmp(a, op, b);
  const eq = a === b;
  const opts: Opt[] = [
    { t: 'True', say: truth ? 'Yes, it is true.' : eq ? `The two sides are equal, and ${opH(op)} needs a strict difference: false.` : `On the number line ${nH(a)} is to the ${a < b ? 'left' : 'right'} of ${nH(b)}, so it is ${a < b ? 'less' : 'greater'}: false.`, mc: !truth && eq && strict(op) ? MC.strictIn : undefined },
    { t: 'False', say: !truth ? 'Yes, it is false.' : eq ? `The two sides are equal, and ${opH(op)} allows equal: true.` : `On the number line ${nH(a)} is to the ${a < b ? 'left' : 'right'} of ${nH(b)}, so it is ${a < b ? 'less' : 'greater'}: true.`, mc: truth && eq && !strict(op) ? MC.inclOut : undefined },
  ];
  const sol = eq
    ? [`Both sides are ${nH(a)}: they are equal.`, strict(op) ? `${opH(op)} needs a strict difference, so equal sides make it false.` : `${opH(op)} allows equal, so equal sides make it true.`]
    : [`On the number line ${nH(a)} is to the ${a < b ? 'left' : 'right'} of ${nH(b)}: ${nH(a)} is ${a < b ? 'less' : 'greater'} than ${nH(b)}.`, `So ${nH(a)} ${opH(op)} ${nH(b)} is ${truth ? 'true' : 'false'}.`];
  return fixedChoice({ id: `compareTF-${n}`, family: 'compareTF', prompt: `True or false: ${nH(a)} ${opH(op)} ${nH(b)}`, board: `${nT(a)} ${opT(op)} ${nT(b)}`, solution: sol }, opts, truth ? 0 : 1);
};

// =====================================================================================================================
// point-membership
// =====================================================================================================================
/** a point on the given side of a form (or on its line), halves allowed, inside ±5 */
function pointFor(R: () => number, F: Form, kind: 'on' | 'in' | 'out', halves = true): [number, number] | null {
  const r = rel(F);
  for (let t = 0; t < 120; t++) {
    let x = int(R, -5, 5), y: number;
    if (halves && R() < 0.25) x += 0.5;
    if (Math.abs(r.B) > 1e-9) {
      const yl = (r.C - r.A * x) / r.B;
      if (kind === 'on') y = yl;
      else { y = r3(yl + (R() < 0.5 ? 1 : -1) * pick(R, [1, 1.5, 2, 3])); }
    } else {
      if (kind === 'on') { x = r.C / r.A; }
      y = int(R, -5, 5);
      if (kind !== 'on' && near(x, r.C / r.A)) continue;
    }
    if (Math.abs(y * 2 - Math.round(y * 2)) > 1e-9 || Math.abs(x) > 5.5 || Math.abs(y) > 5.5) continue;
    const isOn = onLine(F, x, y), ok = holds(F, x, y);
    if (kind === 'on' ? isOn : !isOn && ok === (kind === 'in')) return [x + 0, y + 0];
  }
  return null;
}
const isSolution: Gen = (R, n) => {
  for (let t = 0; ; t++) {
    const F: Form = R() < 0.5 ? randSI(R, SLOPES_INT, -3, 3) : randStd(R);
    const kind = pick(R, ['on', 'in', 'out', 'on'] as const);
    const p = pointFor(R, F, kind);
    if (!p) continue;
    const [x, y] = p, ok = holds(F, x, y), on = kind === 'on', swapV = holds(F, y, x);
    if (t < 40 && !on && swapV === ok && R() < 0.6) continue;    // prefer points whose swapped order changes the verdict
    const opts: Opt[] = [
      { t: 'Yes: it makes the inequality true', say: '', mc: undefined },
      { t: 'No: it makes the inequality false', say: '', mc: undefined },
    ];
    const wrong = ok ? 1 : 0;
    opts[wrong]!.mc = on ? (strict(F.op) ? MC.strictIn : MC.inclOut) : swapV !== ok ? MC.order : undefined;
    opts[wrong]!.say = on ? (strict(F.op) ? `On the boundary the two sides are EQUAL, and ${opH(F.op)} leaves equal out.` : `On the boundary the two sides are equal, and ${opH(F.op)} lets equal in.`)
      : swapV !== ok ? `Check the order: ${X} = ${nH(x)}, ${Yv} = ${nH(y)}. Swapped, the answer changes.` : `Put the numbers in: ${checkAt(F, x, y)}.`;
    opts[1 - wrong]!.say = `Yes: ${checkAt(F, x, y)}.`;
    const items: GItem[] = [sh('sh', [F]), bl('bd', F), dot('P', x, y, 'pick', P(x, y)), dot('Pv', x, y, ok ? 'link' : 'wrong')];
    return fixedChoice({
      id: `isSolution-${n}`, family: 'isSolution', prompt: `Is ${P(x, y)} a solution of ${fH(F)}?`, board: fT(F),
      solution: [`Put in ${X} = ${nH(x)}, ${Yv} = ${nH(y)}: ${checkAt(F, x, y)}.`, on ? (strict(F.op) ? 'The point is on the boundary: equal sides, and a strict sign leaves them out.' : 'The point is on the boundary: equal sides, and ≤ or ≥ lets them in.') : `So ${P(x, y)} is ${ok ? '' : 'not '}a solution.`],
      picture: pic({ items, show: ['P'], solve: ['sh', 'bd', 'Pv'] }),
    }, opts, ok ? 0 : 1);
  }
};

const whichSolution: Gen = (R, n) => {
  for (;;) {
    const F: Form = R() < 0.5 ? randSI(R, SLOPES_INT, -3, 3) : randStd(R);
    const st = strict(F.op);
    const right = pointFor(R, F, st ? 'in' : 'on');
    const outs = [pointFor(R, F, 'out'), pointFor(R, F, 'out')];
    if (!right || outs.some(p => !p)) continue;
    const ws: Opt[] = [];
    if (st) { const b = pointFor(R, F, 'on'); if (!b) continue; ws.push({ t: P(b[0], b[1]), mc: MC.strictIn, say: `${P(b[0], b[1])} is ON the boundary: the two sides are equal, and ${opH(F.op)} leaves equal out.` }); }
    const sw: [number, number] = [right[1], right[0]];
    if (!holds(F, sw[0], sw[1]) && !near(sw[0], right[0])) ws.push({ t: P(sw[0], sw[1]), mc: MC.order, say: `${P(sw[0], sw[1])} has the numbers of ${P(right[0], right[1])} swapped: ${checkAt(F, sw[0], sw[1])}.` });
    for (const o of outs) ws.push({ t: P(o![0], o![1]), say: `Put it in: ${checkAt(F, o![0], o![1])}.` });
    const cand = [right, ...ws.map(w => w.t)];
    if (new Set(cand.map(c => (typeof c === 'string' ? c : P(c[0], c[1])))).size < 4) continue;
    const pts: [number, number][] = [right, ...ws.slice(0, 3).map(w => { const m = w.t.replace(/[()−]/g, s => (s === '−' ? '-' : '')).split(',').map(Number); return [m[0]!, m[1]!] as [number, number]; })];
    // the dots must be told apart on the plane
    if (pts.some((p, i) => pts.some((r, j) => j > i && Math.hypot(p[0] - r[0], p[1] - r[1]) < 1.2))) continue;
    const items: GItem[] = [sh('sh', [F]), bl('bd', F), ...pts.map((p, i) => dot(`c${i}`, p[0], p[1], 'pick')), dot('ok', right[0], right[1], 'link', P(right[0], right[1]))];
    return choice(R, {
      id: `whichSolution-${n}`, family: 'whichSolution', prompt: `Which point is a solution of ${fH(F)}?`, board: fT(F),
      solution: [`Test each point. ${P(right[0], right[1])}: ${checkAt(F, right[0], right[1])}.`, st ? 'A point on the boundary does not count for a strict sign.' : 'It is on the boundary, and ≤ or ≥ lets equal in; the other points make it false.'],
      picture: pic({ items, show: ['c0', 'c1', 'c2', 'c3'], solve: ['sh', 'bd', 'ok'] }),
    }, P(right[0], right[1]), `Yes: ${checkAt(F, right[0], right[1])}.`, ws);
  }
};

// =====================================================================================================================
// vertical-horizontal-lines
// =====================================================================================================================
const FAR = [-100, -20, 7, -3, 12, 50, 4, -6, 0, 2];
const hvMember: Gen = (R, n) => {
  const vert = R() < 0.6, a = int(R, -5, 5);
  const others = shuffle(R, FAR.filter(k => k !== a));
  const k = others[0]!, k2 = others[1]!, j = pick(R, [-4, -2, 1, 3, 5, 6].filter(v => v !== a));
  const right: [number, number] = vert ? [a, k] : [k, a];
  const sw: [number, number] = vert ? [k2, a] : [a, k2];
  const ws: Opt[] = [
    { t: P(sw[0], sw[1]), mc: MC.fixedX, say: `${vert ? X : Yv} = ${nH(a)} fixes the ${vert ? 'FIRST' : 'SECOND'} coordinate. In ${P(sw[0], sw[1])} the ${vert ? 'first' : 'second'} number is ${nH(vert ? sw[0] : sw[1])}.` },
    { t: vert ? P(j, a) : P(a, j), mc: MC.fixedX, say: `That point has ${vert ? X : Yv} = ${nH(j)}, not ${nH(a)}.` },
    { t: vert ? P(j, k) : P(k, j), say: `Its ${vert ? 'first' : 'second'} coordinate is ${nH(j)}, not ${nH(a)}.` },
  ];
  const L: Form = vert ? { f: 'x', c: a, op: '>=' } : { f: 'y', c: a, op: '>=' };
  const inWin = Math.abs(right[0]) <= 6 && Math.abs(right[1]) <= 6;
  const items: GItem[] = [bl('ln', L, { dash: false }), ...(inWin ? [dot('pt', right[0], right[1], 'link', P(right[0], right[1]))] : [])];
  return choice(R, {
    id: `hvMember-${n}`, family: 'hvMember', prompt: `Which point lies on the line ${vert ? X : Yv} = ${nH(a)}?`, board: `${vert ? 'x' : 'y'} = ${nT(a)}`,
    solution: [`${vert ? X : Yv} = ${nH(a)} is every point whose ${vert ? 'FIRST' : 'SECOND'} coordinate is ${nH(a)}, whatever the other one is${Math.abs(k) > 6 ? ', even far off the grid' : ''}.`, `Only ${P(right[0], right[1])} has ${vert ? X : Yv} = ${nH(a)}.`],
    picture: pic({ items, show: ['ln'], solve: inWin ? ['pt'] : [] }),
  }, P(right[0], right[1]), `Yes: its ${vert ? 'first' : 'second'} coordinate is ${nH(a)}.`, ws);
};

const hvGraph: Gen = (R, n) => {
  const vert = R() < 0.55, a = int(R, -5, 5), v = vert ? X : Yv;
  const L: Form = vert ? { f: 'x', c: a, op: '>=' } : { f: 'y', c: a, op: '>=' };
  const right = vert ? `A vertical line through ${P(a, 0)}` : `A horizontal line through ${P(0, a)}`;
  const ws: Opt[] = [
    { t: vert ? `A horizontal line through ${P(0, a)}` : `A vertical line through ${P(a, 0)}`, mc: MC.fixedX, say: `${v} = ${nH(a)} fixes ${v}. ${vert ? 'Points with the same x stack up: a vertical line.' : 'Points with the same y sit side by side: a horizontal line.'}` },
    { t: vert ? `The single point ${P(a, 0)}` : `The single point ${P(0, a)}`, mc: MC.nlObject, say: `On a number line ${v} = ${nH(a)} is one point. In the plane every point with ${v} = ${nH(a)} counts, and there is a whole line of them.` },
  ];
  return choice(R, {
    id: `hvGraph-${n}`, family: 'hvGraph', prompt: `In the coordinate plane, what is the graph of ${v} = ${nH(a)}?`, board: `${vert ? 'x' : 'y'} = ${nT(a)}`,
    solution: [`In the plane, ${v} = ${nH(a)} means every point whose ${vert ? 'first' : 'second'} coordinate is ${nH(a)}: ${vert ? `${P(a, -2)}, ${P(a, 0)}, ${P(a, 5)}` : `${P(-2, a)}, ${P(0, a)}, ${P(5, a)}`}, and so on.`, `They line up ${vert ? 'straight up and down' : 'side by side'}.`],
    picture: pic({ items: [bl('ln', L, { dash: false })], show: [], solve: ['ln'] }),
  }, right, `Yes: ${vert ? 'a vertical' : 'a horizontal'} line, every point with ${v} = ${nH(a)}.`, ws, { max: 3 });
};

// =====================================================================================================================
// region-discovery, boundary-equation, boundary-inclusion
// =====================================================================================================================
const regionShape: Gen = (R, n, sg) => {
  const F = sg === 'boundary-equation' ? (R() < 0.5 ? randStd(R) : randAny(R)) : randAny(R);
  const sw = sideW(side(F)), eq = eqH(F);
  const right = `Every point ${sw} the line ${eq} (${strict(F.op) ? 'the line itself left out' : 'the line itself included'}), with no end`;
  const ws: Opt[] = [
    { t: `Only the whole-number grid points ${sw} the line ${eq}`, mc: MC.lattice, say: 'Points between the grid lines work too: (0.5, 2.25) is as good a point as (1, 2).' },
    { t: `Only the points on the line ${eq}`, mc: MC.bOnly, say: `The line is where the two sides are EQUAL. ${opH(F.op)} asks for ${greater(F.op) ? 'more' : 'less'}, and a whole side of points gives that.` },
    { t: `The points ${sw} the line ${eq}, but only as far as the grid goes`, mc: MC.gridEdge, say: 'The grid is just the part we drew. A point far off the grid on the same side works just the same.' },
  ];
  const tp: [number, number] = onLine(F, 0, 0) ? pointFor(R, F, 'in', false) ?? [1, 1] : [0, 0];
  return choice(R, {
    id: `regionShape-${n}`, family: 'regionShape', prompt: `Which describes ALL the solutions of ${fH(F)}?`, board: fT(F),
    solution: [`The boundary is ${eq}: there the two sides are equal.`, `Test ${P(tp[0], tp[1])}: ${checkAt(F, tp[0], tp[1])}. So the solutions are ${sw} the line: every point there, decimals and far-away points too.`],
    picture: pic({ items: [sh('sh', [F]), bl('bd', F)], show: ['bd'], solve: ['sh'] }),
  }, right, 'Yes: a whole half-plane, with no gaps and no edge.', ws);
};

const farPoint: Gen = (R, n) => {
  for (;;) {
    const F: Form = R() < 0.6 ? randSI(R, SLOPES_INT, -3, 3) : randStd(R);
    const far = R() < 0.55, want = R() < 0.7;
    let x: number, y: number;
    if (far) { x = pick(R, [40, -60, 25, 100, -30, 75]); y = pick(R, [-100, 80, 30, -45, 120, -20]); }
    else { x = int(R, -4, 4) + pick(R, [0.5, 0.25, 0.75]); y = int(R, -4, 4) + pick(R, [0.5, 0.25]); }
    if (onLine(F, x, y) || holds(F, x, y) !== want) continue;
    const ok = want;
    const opts: Opt[] = [
      { t: 'Yes: it is a solution', say: '', mc: undefined },
      { t: 'No: it is not a solution', say: '', mc: undefined },
    ];
    opts[ok ? 0 : 1]!.say = `Yes: ${checkAt(F, x, y)}.`;
    opts[ok ? 1 : 0]!.say = ok ? (far ? `It is far off the grid, but ${checkAt(F, x, y)}. The region goes on forever.` : `It is not on a grid crossing, but ${checkAt(F, x, y)}. Every point counts.`) : `Put it in: ${checkAt(F, x, y)}.`;
    if (ok) opts[1]!.mc = far ? MC.gridEdge : MC.lattice;
    const inWin = Math.abs(x) <= 6 && Math.abs(y) <= 6;
    return fixedChoice({
      id: `farPoint-${n}`, family: 'farPoint', prompt: `The graph shows ${fH(F)}. Is ${P(x, y)} a solution?`, board: fT(F),
      solution: [`Do not judge by the grid: put the point in. ${checkAt(F, x, y)}.`, ok ? `So ${P(x, y)} is a solution${far ? ', far off the drawn grid' : ', between the grid lines'}.` : `So ${P(x, y)} is not a solution.`],
      picture: pic({ items: [sh('sh', [F]), bl('bd', F), ...(inWin ? [dot('pv', x, y, ok ? 'link' : 'wrong', P(x, y))] : [])], show: ['sh', 'bd'], solve: inWin ? ['pv'] : [] }),
    }, opts, ok ? 0 : 1);
  }
};

const boundaryOf: Gen = (R, n) => {
  const F = randAny(R);
  const right = eqH(F);
  const ws: Opt[] = [];
  if (F.f === 'x') ws.push({ t: `${Yv} = ${nH(F.c)}`, sem: lineKey(0, 1, F.c), mc: MC.fixedX, say: `The inequality is about ${X}, so the boundary is ${X} = ${nH(F.c)}: a vertical line.` }, { t: `${X} = 0`, sem: lineKey(1, 0, 0), say: 'The boundary keeps the numbers: replace the sign by =.' });
  if (F.f === 'y') ws.push({ t: `${X} = ${nH(F.c)}`, sem: lineKey(1, 0, F.c), mc: MC.fixedX, say: `The inequality is about ${Yv}, so the boundary is ${Yv} = ${nH(F.c)}: a horizontal line.` }, { t: `${Yv} = 0`, sem: lineKey(0, 1, 0), say: 'The boundary keeps the numbers: replace the sign by =.' });
  if (F.f === 'si') {
    ws.push({ t: `${X} = ${exprH(F.m, F.b, Yv)}`, sem: lineKey(1, -qNum(F.m), qNum(F.b)), say: `${Yv} and ${X} keep their places: only the sign becomes =.` });
    if (F.b.p !== 0) ws.push({ t: `${Yv} = ${exprH(F.m, q(0))}`, sem: lineKey(-qNum(F.m), 1, 0), say: 'Keep every term: the boundary is the same expression with = in place of the sign.' });
    if (F.m.p !== 0) ws.push({ t: `${Yv} = ${qH(F.b)}`, sem: lineKey(0, 1, qNum(F.b)), say: `Keep the ${X}-term too: the boundary has the same slope.` });
    ws.push({ t: `${Yv} = ${exprH(qNeg(F.m), F.b)}`, sem: lineKey(qNum(F.m), 1, qNum(F.b)), say: `The slope keeps its sign: only the inequality sign becomes =.` });
  }
  if (F.f === 'std') {
    ws.push({ t: stdH({ A: F.A, B: F.B, C: 0 }), sem: lineKey(F.A, F.B, 0), say: `Keep the right side: the boundary is ${right}.` });
    if (F.A !== F.B) ws.push({ t: stdH({ A: F.B, B: F.A, C: F.C }), sem: lineKey(F.B, F.A, F.C), say: `The coefficients stay with their letters: ${right}.` });
    ws.push({ t: stdH({ A: F.A, B: F.B, C: -F.C }), sem: lineKey(F.A, F.B, -F.C), say: `Only the inequality sign changes, not the number: ${right}.` });
  }
  return choice(R, {
    id: `boundaryOf-${n}`, family: 'boundaryOf', prompt: `What is the boundary line of ${fH(F)}?`, board: fT(F),
    solution: ['The boundary is the related EQUATION: the same two sides with = in place of the inequality sign.', `There the two sides are equal; on one side of it the inequality holds.`],
    picture: pic({ items: [sh('sh', [F]), bl('bd', F)], show: [], solve: ['bd', 'sh'] }),
  }, right, 'Yes: replace the sign by = and keep everything else.', ws, { sem: (() => { const r = rel(F); return lineKey(r.A, r.B, r.C); })() });
};

const inclusionPair: Gen = (R, n) => {
  for (;;) {
    const base: Form = R() < 0.55 ? randSI(R, SLOPES_INT, -3, 3) : randStd(R);
    const p = pointFor(R, base, 'on');
    if (!p) continue;
    const [x, y] = p;
    const inc: Op = pick(R, ['<=', '>='] as const);
    const right = withOp(base, inc);
    const ws: Opt[] = (['<', '>'] as const).map(o => ({ t: fH(withOp(base, o)), mc: MC.strictIn, say: `On the line the two sides are EQUAL, and ${opH(o)} needs a strict difference: false.` }));
    return choice(R, {
      id: `inclusionPair-${n}`, family: 'inclusionPair', prompt: `The point ${P(x, y)} lies on the line ${eqH(base)}. For which inequality is ${P(x, y)} a solution?`, board: eqT(base),
      solution: [`On the line both sides are equal: ${checkAt(withOp(base, '<='), x, y).replace(/, and .*$/, '')}.`, 'A strict sign (&lt; or &gt;) is false for equal sides; ≤ or ≥ lets equal in.'],
      picture: pic({ items: [bl('ln', base, { dash: false, col: 'dim' }), dot('P', x, y, 'pick', P(x, y)), dot('Pv', x, y, 'link')], show: ['ln', 'P'], solve: ['Pv'] }),
    }, fH(right), `Yes: ${opH(inc)} lets equal in, so the boundary point counts.`, ws);
  }
};

const lineStyle: Gen = (R, n) => {
  const F = randAny(R), st = strict(F.op);
  const yes = 'points on the line are solutions', no = 'points on the line are not solutions';
  const right = st ? `Dashed: ${no}` : `Solid: ${yes}`;
  const ws: Opt[] = st
    ? [{ t: `Solid: ${no}`, mc: MC.styleConv, say: 'Solid means the boundary points ARE in. Left out is drawn dashed.' },
      { t: `Solid: ${yes}`, mc: MC.strictIn, say: `On the line the sides are equal, and ${opH(F.op)} leaves equal out.` }]
    : [{ t: `Dashed: ${yes}`, mc: MC.styleConv, say: 'Dashed means the boundary points are LEFT OUT. Included is drawn solid.' },
      { t: `Dashed: ${no}`, mc: MC.inclOut, say: `${opH(F.op)} means ${greater(F.op) ? 'greater than' : 'less than'} OR EQUAL: the line counts.` }];
  ws.push({ t: 'Solid when you shade above the line, dashed when you shade below', mc: MC.styleMeaning, say: 'The style is about the LINE, not the side: it shows whether equal counts.' });
  ws.push({ t: 'No line at all: only the shaded side matters', mc: MC.dashedNone, say: 'The boundary is always drawn: it shows where the region stops, and dashed or solid tells whether its points count.' });
  return choice(R, {
    id: `lineStyle-${n}`, family: 'lineStyle', prompt: `How do you draw the boundary of ${fH(F)}?`, board: fT(F),
    solution: [`On the boundary ${eqH(F)} the two sides are equal.`, st ? `${opH(F.op)} leaves equal out, so the line is not part of the graph: dashed.` : `${opH(F.op)} lets equal in, so the line is part of the graph: solid.`],
    picture: pic({ items: [sh('sh', [F]), bl('bd', F)], show: [], solve: ['bd', 'sh'] }),
  }, right, st ? 'Yes: dashed, the boundary is left out.' : 'Yes: solid, the boundary is included.', ws, { max: 5 });
};

// =====================================================================================================================
// boundary-lines
// =====================================================================================================================
const cx = (c: number, v: string) => (c === 1 ? v : c === -1 ? `−${v}` : `${nH(c)}${v}`);
const intercepts: Gen = (R, n) => {
  for (;;) {
    const A = pick(R, [1, 2, 3, 4, -1, -2, -3, -4]), B = pick(R, [1, 2, 3, 4, -1, -2, -3, -4]), C = pick(R, [1, 2, 3, 4, 6, 8, 12, -2, -3, -4, -6, -8, -12]);
    const xi = C / A, yi = C / B;
    if (Math.abs(xi * 2 - Math.round(xi * 2)) > 1e-9 || Math.abs(yi * 2 - Math.round(yi * 2)) > 1e-9) continue;
    if (Math.abs(xi) > 6 || Math.abs(yi) > 6 || near(xi, yi) || gcd(gcd(A, B), C) > 2) continue;
    const L: Form = { f: 'std', A, B, C, op: '<=' };
    return pairItem({
      id: `intercepts-${n}`, family: 'intercepts', prompt: `Where does the line ${stdH({ A, B, C })} cross the axes?`, board: stdT({ A, B, C }),
      solution: [`x-intercept: put ${Yv} = 0. ${cx(A, X)} = ${nH(C)}, so ${X} = ${ans(nH(xi))}.`, `y-intercept: put ${X} = 0. ${cx(B, Yv)} = ${nH(C)}, so ${Yv} = ${ans(nH(yi))}.`],
      picture: pic({ items: [bl('bd', L, { dash: false }), dot('pX', xi, 0, 'first', P(xi, 0)), dot('pY', 0, yi, 'second', P(0, yi))], show: [], solve: ['bd', 'pX', 'pY'] }),
    }, xi, yi, { lead: 'x-intercept (', op: ', 0) &nbsp; y-intercept (0,', tail: ')' }, `Yes: ${P(xi, 0)} and ${P(0, yi)}.`,
    [{ x: yi, y: xi, mc: MC.izSwap, say: `Swapped. The x-intercept is where ${Yv} = 0: ${cx(A, X)} = ${nH(C)}.` }],
    `For the x-intercept set ${Yv} = 0; for the y-intercept set ${X} = 0.`);
  }
};

const throughOrigin: Gen = (R, n) => {
  for (;;) {
    let A = pick(R, [1, 2, 3, 4, -1, -2, -3, -4]), B = pick(R, [1, 2, 3, 4, -1, -2, -3, -4]);
    if (Math.abs(A) === Math.abs(B)) continue;
    const g = gcd(A, B); A /= g; B /= g;
    let p = B, qq = -A;
    if (p < 0) { p = -p; qq = -qq; }
    if (Math.abs(qq) > 5 || p > 5) continue;
    const L: Form = { f: 'std', A, B, C: 0, op: '<=' };
    const right = `Plot a second point of the line, such as ${P(p, qq)}, and draw the line through both`;
    const ws: Opt[] = [
      { t: `Plot ${P(qq, p)} and draw the line through it and (0, 0)`, mc: MC.order, say: `${P(qq, p)} is not on the line: ${subStd(A, B, qq, p)} = ${nH(A * qq + B * p)}, not 0.` },
      { t: 'Nothing: (0, 0) is enough to draw the line', mc: MC.izOrigin, say: 'One point does not fix a line: many lines pass through (0, 0). A second point is needed.' },
      { t: 'Draw the y-axis: both intercepts are on it', say: `Check: (0, 5) gives ${subStd(A, B, 0, 5)} = ${nH(5 * B)}, not 0. The y-axis is not this line.` },
    ];
    return choice(R, {
      id: `throughOrigin-${n}`, family: 'throughOrigin', prompt: `To graph ${stdH({ A, B, C: 0 })}, Lee sets ${X} = 0 and then ${Yv} = 0 and gets (0, 0) both times. What should Lee do next?`, board: stdT({ A, B, C: 0 }),
      solution: ['Both intercepts are the same point (0, 0): the line passes through the origin.', `One point is not enough. Put ${X} = ${nH(p)}: ${cx(B, Yv)} = ${nH(-A * p)}, so ${Yv} = ${nH(qq)}. Draw the line through (0, 0) and ${P(p, qq)}.`],
      picture: pic({ items: [bl('bd', L, { dash: false }), dot('O', 0, 0, 'first', '(0, 0)'), dot('Q', p, qq, 'second', P(p, qq))], show: [], solve: ['O', 'Q', 'bd'] }),
    }, right, 'Yes: a second point (or the slope) fixes the line.', ws);
  }
};

function normStd(A: number, B: number, C: number): { A: number; B: number; C: number } {
  const g = gcd(gcd(A, B), C) || 1; let a = A / g, b = B / g, c = C / g;
  if (a < 0 || (a === 0 && b < 0)) { a = -a; b = -b; c = -c; }
  return { A: a + 0, B: b + 0, C: c + 0 };
}
const matchBoundary: Gen = (R, n) => {
  for (;;) {
    const p = pick(R, [1, 2, 3, 4, 5, -1, -2, -3, -4, -5]), r = pick(R, [1, 2, 3, 4, 5, -1, -2, -3, -4, -5]);
    if (Math.abs(p) === Math.abs(r)) continue;
    const S = normStd(r, p, p * r), sw = normStd(p, r, p * r), sg = normStd(r, -p, p * r), neg = normStd(r, p, -p * r);
    const L: Form = { f: 'std', ...S, op: '<=' };
    const ws: Opt[] = [
      { t: stdH(sw), sem: lineKey(sw.A, sw.B, sw.C), mc: MC.izSwap, say: `That line crosses at ${P(r, 0)} and ${P(0, p)}: the intercepts swapped. Set ${Yv} = 0 to find the x-intercept.` },
      { t: stdH(sg), sem: lineKey(sg.A, sg.B, sg.C), say: `That line crosses the y-axis at ${P(0, -r)}. Check ${P(0, r)} in each equation.` },
      { t: stdH(neg), sem: lineKey(neg.A, neg.B, neg.C), say: `That line crosses at ${P(-p, 0)} and ${P(0, -r)}: the signs are off.` },
    ];
    return choice(R, {
      id: `matchBoundary-${n}`, family: 'matchBoundary', prompt: `${pick(R, NAMES)} drew this boundary line through the two marked points. Which equation is it?`, board: '\\text{the line: }\\ ?',
      solution: [`The line crosses the axes at ${P(p, 0)} and ${P(0, r)}.`, `Check both in ${stdH(S)}: ${subStd(S.A, S.B, p, 0)} = ${nH(S.C)} and ${subStd(S.A, S.B, 0, r)} = ${nH(S.C)}.`],
      picture: pic({ items: [bl('bd', L, { dash: false }), dot('pX', p, 0, 'first'), dot('pY', 0, r, 'second')], show: ['bd', 'pX', 'pY'], solve: [] }, { tex: tex(stdT(S)) }),
    }, stdH(S), `Yes: it passes through ${P(p, 0)} and ${P(0, r)}.`, ws, { sem: lineKey(S.A, S.B, S.C) });
  }
};

// =====================================================================================================================
// dashed-solid, test-point-side
// =====================================================================================================================
function lhsRhs(F: Form): [string, string] {
  if (F.f === 'si') return [Yv, exprH(F.m, F.b)];
  if (F.f === 'std') return [exprAB(F.A, F.B), nH(F.C)];
  if (F.f === 'x') return [X, nH(F.c)];
  if (F.f === 'y') return [Yv, nH(F.c)];
  return [Yv, '…'];
}
const wrongStyle: Gen = (R, n) => {
  const F = randAny(R), st = strict(F.op);
  const right = st ? `The line should be dashed: on it the two sides are equal, and ${opH(F.op)} leaves equal out` : `The line should be solid: on it the two sides are equal, and ${opH(F.op)} lets equal in`;
  const ws: Opt[] = [
    { t: 'Nothing: dashed and solid mean the same thing', mc: MC.ignoresIncl, say: 'They do not: solid says the boundary points are solutions, dashed says they are not.' },
    { t: 'Nothing: the line style only shows which side is shaded', mc: MC.styleMeaning, say: 'The style is about the line itself: does equal count or not?' },
    { t: 'The shading should be on the other side', say: `Test a point in the shading: the side is right. The line is the problem.` },
  ];
  const tp = pointFor(R, F, 'in', false) ?? [0, 0];
  return choice(R, {
    id: `wrongStyle-${n}`, family: 'wrongStyle', prompt: `Sam graphed ${fH(F)} like this. What is wrong with the graph?`, board: fT(F),
    solution: [`The side is right: ${P(tp[0], tp[1])} is shaded, and ${checkAt(F, tp[0], tp[1])}.`, `But on the line the sides are equal, and ${opH(F.op)} ${st ? 'leaves equal out: dashed' : 'lets equal in: solid'}. Sam drew it ${st ? 'solid' : 'dashed'}.`],
    picture: pic({ items: [sh('sh', [F]), bl('bw', F, { dash: !st }), bl('bc', F, { col: 'pick' })], show: ['sh', 'bw'], solve: ['bc'] }),
  }, right, 'Yes: the side is right, the line style is not.', ws);
};

const testPointSide: Gen = (R, n, sg) => {
  const throughO = sg !== 'standard-form-inequalities' && R() < 0.35;
  if (throughO) {
    for (;;) {
      const F: Form = R() < 0.5 ? { f: 'si', m: pick(R, SLOPES_INT), b: q(0), op: randOp(R) } : randStd(R, { cZero: true });
      const r = rel(F);
      // a second point of the line, and an off-line test point
      const onP: [number, number] = Math.abs(r.B) > 1e-9 ? [r.B, -r.A].map(v => v + 0) as [number, number] : [0, 3];
      if (Math.abs(onP[0]) > 5 || Math.abs(onP[1]) > 5 || (onP[0] === 0 && onP[1] === 0)) continue;
      const tps: [number, number][] = [[1, 0], [0, 1], [-1, 0], [0, -1], [2, 1], [1, 3]];
      const tp = tps.find(t => !onLine(F, t[0], t[1]) && P(t[0], t[1]) !== P(onP[0], onP[1]))!;
      const ok = holds(F, tp[0], tp[1]);
      return choice(R, {
        id: `testPointSide-${n}`, family: 'testPointSide', prompt: `The boundary of ${fH(F)} passes through (0, 0). Which point can you test to choose the side?`, board: fT(F),
        solution: ['(0, 0) is ON the line: both sides are equal there, so it cannot tell the two sides apart.', `${P(tp[0], tp[1])} is off the line: ${checkAt(F, tp[0], tp[1])}, so shade the side ${ok ? 'with' : 'without'} it.`],
        picture: pic({ items: [sh('sh', [F]), bl('bd', F), dot('tp', tp[0], tp[1], ok ? 'link' : 'wrong', P(tp[0], tp[1]))], show: ['bd'], solve: ['tp', 'sh'] }),
      }, P(tp[0], tp[1]), `Yes: it is off the line, so its verdict holds for its whole side.`, [
        { t: '(0, 0)', mc: MC.tpMisused, say: '(0, 0) is on the line: the two sides are equal there, so it says nothing about either side.' },
        { t: P(onP[0], onP[1]), mc: MC.tpMisused, say: `${P(onP[0], onP[1])} is on the line too: ${checkAt(withOp(F, '<='), onP[0], onP[1]).replace(/, and .*$/, '')}. Pick a point OFF the line.` },
      ]);
    }
  }
  for (;;) {
    const F: Form = R() < 0.65 ? randStd(R) : randSI(R, SLOPES_SI, -4, 4);
    if (onLine(F, 0, 0)) continue;
    const ok = holds(F, 0, 0);
    const opts: Opt[] = [
      { t: 'Shade the side that contains (0, 0)', say: ok ? `Yes: ${checkAt(F, 0, 0)}.` : `(0, 0) gives ${checkAt(F, 0, 0)}. A false test point means: shade the OTHER side.`, mc: ok ? undefined : MC.tpSide },
      { t: 'Shade the side that does not contain (0, 0)', say: ok ? `(0, 0) gives ${checkAt(F, 0, 0)}: a true test point means its own side is shaded.` : `Yes: ${checkAt(F, 0, 0)}, so the solutions are on the other side.` },
      { t: 'Test a point on the line instead: (0, 0) cannot decide', mc: MC.tpMisused, say: 'A point ON the line makes the two sides equal, so it cannot pick a side. (0, 0) is off this line: it decides.' },
    ];
    const O2 = pointFor(R, F, ok ? 'out' : 'in', false);
    return fixedChoice({
      id: `testPointSide-${n}`, family: 'testPointSide', prompt: `Test (0, 0) in ${fH(F)}. Which side of the boundary do you shade?`, board: fT(F),
      solution: [`(0, 0) is off the line. Put it in: ${checkAt(F, 0, 0)}.`, ok ? 'True: shade the side with (0, 0).' : 'False: shade the other side.', ...(O2 ? [`Check with ${P(O2[0], O2[1])} on the other side: ${checkAt(F, O2[0], O2[1])}.`] : [])],
      picture: pic({ items: [sh('sh', [F]), bl('bd', F), dot('O', 0, 0, 'pick', '(0, 0)'), dot('Ov', 0, 0, ok ? 'link' : 'wrong')], show: ['bd', 'O'], solve: ['Ov', 'sh'] }),
    }, opts, ok ? 0 : 1);
  }
};

// =====================================================================================================================
// graph-slope-intercept, axis-aligned, standard form, isolate y, point-slope
// =====================================================================================================================
const siGraph: Gen = (R, n) => {
  const F = randSI(R);
  const sd = side(F), st = strict(F.op);
  const combo = (d: boolean, s: string) => `${d ? 'Dashed' : 'Solid'} line, shade ${s} it`;
  const right = combo(st, sd);
  const ws: Opt[] = [
    { t: combo(!st, sd), mc: MC.ignoresIncl, say: `The side is right, but ${opH(F.op)} ${st ? 'leaves the line out: dashed' : 'includes the line: solid'}.` },
    { t: combo(st, otherSide(sd)), say: `With ${Yv} alone (coefficient 1), ${opH(F.op)} means ${Yv} is ${greater(F.op) ? 'bigger' : 'smaller'} than the line's value: ${sd}.` },
    { t: 'Draw the line only, no shading', mc: MC.bOnly, say: 'The line is only where the sides are equal. The solutions fill a whole side.' },
  ];
  const run = qNum(F.m) === 0 ? 2 : F.m.q, rise = qNum(F.m) * run;
  return choice(R, {
    id: `siGraph-${n}`, family: 'siGraph', prompt: `How do you graph ${fH(F)}?`, board: fT(F),
    solution: [`Boundary ${eqH(F)}: start at ${P(0, qNum(F.b))}, then ${qNum(F.m) === 0 ? 'flat' : `over ${run}, ${rise > 0 ? 'up' : 'down'} ${nH(Math.abs(rise))}`}. ${opH(F.op)} → ${styleW(F)}.`, `${Yv} ${opH(F.op)} the line's value means ${sd} the line. Test (0, ${nH(qNum(F.b) + (sd === 'above' ? 1 : -1))}) to be sure.`],
    picture: pic({ items: [sh('sh', [F]), bl('bd', F), dot('p0', 0, qNum(F.b), 'first'), dot('p1', run, qNum(F.b) + rise, 'first')], show: ['p0', 'p1'], solve: ['bd', 'sh'] }),
  }, right, `Yes: ${styleW(F)}, ${sd}.`, ws);
};

const writeGraph: Gen = (R, n, sg) => {
  for (;;) {
    let F: Form;
    if (sg === 'axis-aligned-inequalities') F = randXY(R, -4, 4);
    else if (sg === 'graph-slope-intercept') F = randSI(R);
    else { const k = R(); F = k < 0.35 ? randSI(R, [q(2, 3), q(-2, 3), q(1, 2), q(-1, 2), q(2), q(-1), q(3)], -3, 3) : k < 0.7 ? randStd(R, { bNeg: R() < 0.5 }) : randXY(R, -4, 4); }
    if (F.f === 'std' && F.B < 0 && R() < 0.2) continue;
    const ws: Opt[] = [
      { t: fH(withOp(F, toggleIncl(F.op))), sem: relKey(withOp(F, toggleIncl(F.op))), mc: MC.ignoresIncl, say: `Look at the line: it is ${styleW(F)}, so the boundary is ${strict(F.op) ? 'left out' : 'included'}.` },
      { t: fH(withOp(F, flip(F.op))), sem: relKey(withOp(F, flip(F.op))), mc: F.f === 'std' && F.B < 0 ? MC.aboveGreater : undefined, say: `Test a shaded point in it: the sign must make that point true.` },
    ];
    if (F.f === 'x') ws.push({ t: `${Yv} ${opH(F.op)} ${nH(F.c)}`, mc: MC.fixedX, say: `The line is vertical: every point on it has ${X} = ${nH(F.c)}.` });
    if (F.f === 'y') ws.push({ t: `${X} ${opH(F.op)} ${nH(F.c)}`, mc: MC.fixedX, say: `The line is horizontal: every point on it has ${Yv} = ${nH(F.c)}.` });
    if (F.f === 'si' && F.m.p !== 0) ws.push({ t: fH({ ...F, m: qNeg(F.m) }), sem: relKey({ ...F, m: qNeg(F.m) }), say: 'Check the slope: does the line rise or fall from left to right?' });
    if (F.f === 'std') ws.push({ t: fH({ ...F, C: -F.C }), sem: relKey({ ...F, C: -F.C }), say: 'Check an intercept of the line in each choice.' });
    const tp = pointFor(R, F, 'in', false);
    if (!tp) continue;
    return choice(R, {
      id: `writeGraph-${n}`, family: 'writeGraph', prompt: `${pick(R, NAMES)} graphed an inequality. Which inequality does the graph show?`, board: '\\text{the graph: }\\ ?',
      solution: [`The boundary is ${eqH(F)}, drawn ${styleW(F)}: ${strict(F.op) ? 'a strict sign' : '≤ or ≥'}.`, `${P(tp[0], tp[1])} is shaded: ${checkAt(F, tp[0], tp[1])}.`],
      picture: pic({ items: [sh('sh', [F]), bl('bd', F), dot('tp', tp[0], tp[1], 'link', P(tp[0], tp[1]))], show: ['sh', 'bd'], solve: ['tp'] }, { tex: tex(fT(F)) }),
    }, fH(F), 'Yes: the style gives the strictness, a shaded test point gives the direction.', ws, { sem: relKey(F) });
  }
};

const axisSide: Gen = (R, n) => {
  const vert = R() < 0.6, c = int(R, -4, 4), op = randOp(R);
  const F: Form = vert ? { f: 'x', c, op } : { f: 'y', c, op };
  const sd = side(F), sty = Style(F);
  const right = vert ? `${sty} vertical line ${X} = ${nH(c)}, shade to the ${sd} of it` : `${sty} horizontal line ${Yv} = ${nH(c)}, shade ${sd} it`;
  const ws: Opt[] = vert
    ? [{ t: `${sty} horizontal line ${Yv} = ${nH(c)}, shade ${greater(op) ? 'above' : 'below'} it`, mc: MC.aboveGreater, say: `${X} ${opH(op)} ${nH(c)} is about ${X}: the boundary is vertical, and ${greater(op) ? 'bigger x is to the right' : 'smaller x is to the left'}.` },
      { t: `Only a ray on the ${X}-axis, starting at ${nH(c)}`, mc: MC.nlObject, say: `On a number line that is a ray. In the plane, ${Yv} can be anything: a whole half-plane.` },
      { t: `${sty} vertical line ${X} = ${nH(c)}, shade to the ${otherSide(sd)} of it`, say: `${greater(op) ? 'Bigger' : 'Smaller'} values of ${X} are to the ${sd}.` }]
    : [{ t: `${sty} vertical line ${X} = ${nH(c)}, shade to the ${greater(op) ? 'right' : 'left'} of it`, mc: MC.fixedX, say: `${Yv} = ${nH(c)} is a HORIZONTAL line: every point on it has ${Yv} = ${nH(c)}.` },
      { t: `Only a ray on the ${Yv}-axis, starting at ${nH(c)}`, mc: MC.nlObject, say: `On a number line that is a ray. In the plane, ${X} can be anything: a whole half-plane.` },
      { t: `${sty} horizontal line ${Yv} = ${nH(c)}, shade ${otherSide(sd)} it`, say: `${greater(op) ? 'Bigger' : 'Smaller'} values of ${Yv} are ${sd} the line.` }];
  return choice(R, {
    id: `axisSide-${n}`, family: 'axisSide', prompt: `How do you graph ${fH(F)} in the coordinate plane?`, board: fT(F),
    solution: [`The boundary ${eqH(F)} is a ${vert ? 'vertical' : 'horizontal'} line, drawn ${styleW(F)}.`, `${vert ? X : Yv} ${opH(op)} ${nH(c)}: ${greater(op) ? 'bigger' : 'smaller'} values, so shade ${sideW(sd)} it; the other coordinate can be anything.`],
    picture: pic({ items: [sh('sh', [F]), bl('bd', F)], show: [], solve: ['bd', 'sh'] }),
  }, right, `Yes: ${vert ? 'vertical' : 'horizontal'} boundary, ${sd}.`, ws);
};

const stdSide: Gen = (R, n) => {
  for (;;) {
    const F = randStd(R, { bNeg: R() < 0.55 });
    if (onLine(F, 0, 0)) continue;
    const sd = side(F), ok0 = holds(F, 0, 0);
    const yl = F.C / F.B, oAbove = 0 > yl;
    const symbolSide = greater(F.op) ? 'above' : 'below';
    const opts: Opt[] = [
      { t: 'Above the line', say: '', mc: undefined },
      { t: 'Below the line', say: '', mc: undefined },
      { t: 'Only on the line', say: 'The line is where the two sides are equal. The solutions fill a whole side.', mc: MC.bOnly },
    ];
    const ri = sd === 'above' ? 0 : 1, wi = 1 - ri;
    opts[ri]!.say = `Yes: (0, 0) gives ${checkAt(F, 0, 0)}, and (0, 0) is ${oAbove ? 'above' : 'below'} the line.`;
    opts[wi]!.say = `Test (0, 0): ${checkAt(F, 0, 0)}. With ${Yv} not alone, the sign does not say above or below.`;
    if ((wi === 0 ? 'above' : 'below') === symbolSide) opts[wi]!.mc = MC.aboveGreater;
    return fixedChoice({
      id: `stdSide-${n}`, family: 'stdSide', prompt: `On which side of its boundary line are the solutions of ${fH(F)}?`, board: fT(F),
      solution: [`Test (0, 0) in the original: ${checkAt(F, 0, 0)}.`, `(0, 0) is ${oAbove ? 'above' : 'below'} the line, so shade the side ${ok0 ? 'with' : 'without'} it: ${sd} the line.`],
      picture: pic({ items: [sh('sh', [F]), bl('bd', F), dot('O', 0, 0, ok0 ? 'link' : 'wrong', '(0, 0)')], show: ['bd'], solve: ['O', 'sh'] }),
    }, opts, ri);
  }
};

const isolateY: Gen = (R, n) => {
  for (;;) {
    const kind = R();
    const F = randStd(R, { bNeg: kind < 0.75 });
    if (kind < 0.25) { (F as { B: number }).B = -1; }
    if (F.C === 0 || F.A === 0) continue;
    const m = q(-F.A, F.B), b = q(F.C, F.B), op2 = F.B < 0 ? flip(F.op) : F.op;
    const right: Form = { f: 'si', m, b, op: op2 };
    const ws: Opt[] = [
      { t: fH({ f: 'si', m, b, op: flip(op2) }), sem: relKey({ f: 'si', m, b, op: flip(op2) }), mc: F.B < 0 ? MC.noRev : undefined, say: F.B < 0 ? `Dividing by ${nH(F.B)}, a negative number, turns the sign.` : `Dividing by ${nH(F.B)}, a positive number, keeps the sign.` },
      { t: fH({ f: 'si', m: qNeg(m), b, op: op2 }), sem: relKey({ f: 'si', m: qNeg(m), b, op: op2 }), say: `Moving ${cx(F.A, X)} to the other side makes it ${cx(-F.A, X)}.` },
      { t: fH({ f: 'si', m, b: qNeg(b), op: op2 }), sem: relKey({ f: 'si', m, b: qNeg(b), op: op2 }), say: `${nH(F.C)} divided by ${nH(F.B)} is ${qH(b)}.` },
    ];
    const step1 = `${cx(F.B, Yv)} ${opH(F.op)} ${exprH(q(-F.A), q(F.C))}`;
    return choice(R, {
      id: `isolateY-${n}`, family: 'isolateY', prompt: `Rewrite ${fH(F)} with ${Yv} alone.`, board: fT(F),
      solution: [`Move the ${X}-term: ${step1}.`, F.B < 0 ? `Divide every term by ${nH(F.B)}. It is negative, so ${opH(F.op)} turns into ${opH(op2)}.` : `Divide every term by ${nH(F.B)}. It is positive, so the sign stays.`],
      picture: pic({ items: [sh('sh', [F]), bl('bd', F)], show: [], solve: ['bd', 'sh'] }, { tex: tex(fT(right)) }),
    }, fH(right), F.B < 0 ? 'Yes: dividing by a negative turned the sign.' : 'Yes: a positive divisor keeps the sign.', ws, { sem: relKey(right) });
  }
};

const bZero: Gen = (R, n) => {
  const A = pick(R, [-2, -3, -4, -5, 2, 3, -2, -3]), c = int(R, -4, 4) || 2, op = randOp(R);
  const F: Form = { f: 'std', A, B: 0, C: A * c, op };
  const op2 = A < 0 ? flip(op) : op, sty = strict(op) ? 'dashed' : 'solid';
  const sd = greater(op2) ? 'right' : 'left';
  const right = `${X} ${opH(op2)} ${nH(c)}: the half-plane to the ${sd} of the ${sty} line ${X} = ${nH(c)}`;
  const ws: Opt[] = [
    { t: `${X} ${opH(flip(op2))} ${nH(c)}: the half-plane to the ${otherSide(sd)} of the ${sty} line ${X} = ${nH(c)}`, mc: A < 0 ? MC.noRev : undefined, say: A < 0 ? `Dividing by ${nH(A)}, a negative number, turns the sign.` : `Dividing by ${nH(A)}, a positive number, keeps the sign.` },
    { t: `Divide both sides by the coefficient of ${Yv} to get ${Yv} alone`, mc: MC.divZero, say: `The coefficient of ${Yv} is 0, and you cannot divide by 0. Solve for ${X} instead.` },
    { t: `${X} ${opH(op2)} ${nH(c)}: only a ray on the ${X}-axis`, mc: MC.nlObject, say: `In the plane ${Yv} can be anything: every point with ${X} ${opH(op2)} ${nH(c)}, a whole half-plane.` },
  ];
  return choice(R, {
    id: `bZero-${n}`, family: 'bZero', prompt: `${fH(F)} has no ${Yv}. How does its graph look in the plane?`, board: fT(F),
    solution: [`There is no ${Yv} to get alone (its coefficient is 0). Solve for ${X}: divide by ${nH(A)}${A < 0 ? ', a negative number, so the sign turns' : ''}.`, `${X} ${opH(op2)} ${nH(c)}: a vertical ${sty} boundary, shaded to the ${sd}.`],
    picture: pic({ items: [sh('sh', [F]), bl('bd', F)], show: [], solve: ['bd', 'sh'] }, { tex: tex(`x ${opT(op2)} ${nT(c)}`) }),
  }, right, `Yes: ${X} ${opH(op2)} ${nH(c)}, a vertical boundary.`, ws);
};

const PS_SLOPES: readonly Q[] = [q(2), q(-1, 2), q(-1), q(3), q(1, 2), q(-2), q(2, 3), q(-3)];
const psRead: Gen = (R, n) => {
  for (;;) {
    const m = pick(R, PS_SLOPES), x1 = int(R, -4, 4), y1 = int(R, -4, 4);
    if (x1 === y1 || x1 === -y1) continue;
    const F: Form = { f: 'ps', m, x1, y1, op: randOp(R) };
    const ws: Opt[] = [
      { t: `${P(-x1, -y1)}, slope ${qH(m)}`, sem: ptSlopeKey(-x1, -y1, qNum(m)), mc: MC.zeroSign, say: `Point-slope form SUBTRACTS the point: ${Yv} − ${par(y1)} and ${X} − ${par(x1)}. So the point is ${P(x1, y1)}.` },
      { t: `${P(y1, x1)}, slope ${qH(m)}`, sem: ptSlopeKey(y1, x1, qNum(m)), mc: MC.order, say: `The number with ${X} is the first coordinate: ${P(x1, y1)}.` },
      { t: `${P(x1, y1)}, slope ${qH(qNeg(m))}`, say: `The slope is the number in front of the bracket: ${qH(m)}.` },
    ];
    return choice(R, {
      id: `psRead-${n}`, family: 'psRead', prompt: `Which point and slope give the boundary of ${fH(F)}?`, board: fT(F),
      solution: [`Point-slope form is ${Yv} − ${Yv}₁ = m(${X} − ${X}₁): it subtracts the point.`, `${eqH(F)} has ${X}₁ = ${nH(x1)}, ${Yv}₁ = ${nH(y1)}, m = ${qH(m)}.`],
      picture: pic({ items: [sh('sh', [F]), bl('bd', F), dot('pt', x1, y1, 'first', P(x1, y1))], show: [], solve: ['bd', 'pt', 'sh'] }),
    }, `${P(x1, y1)}, slope ${qH(m)}`, `Yes: through ${P(x1, y1)} with slope ${qH(m)}.`, ws, { sem: ptSlopeKey(x1, y1, qNum(m)) });
  }
};

const psToSI: Gen = (R, n) => {
  for (;;) {
    const m = pick(R, PS_SLOPES.filter(s => qNum(s) !== 1)), x1 = int(R, -4, 4), y1 = int(R, -4, 4);
    if (x1 === 0 || y1 === 0) continue;
    const b = qNum(m) * -x1 + y1;
    if (Math.abs(b) > 6 || Math.abs(b * 6 - Math.round(b * 6)) > 1e-9) continue;
    const op = randOp(R), F: Form = { f: 'ps', m, x1, y1, op };
    const toQ6 = (v: number) => q(Math.round(v * 6), 6);
    const right: Form = { f: 'si', m, b: toQ6(b), op };
    const ws: Opt[] = [
      { t: fH({ f: 'si', m, b: toQ6(y1 - x1), op }), sem: relKey({ f: 'si', m, b: toQ6(y1 - x1), op }), mc: MC.partial, say: `${qH(m)} multiplies BOTH terms in the bracket: ${qH(m)} times ${par(-x1)} is ${nH(r3(-qNum(m) * x1))}.` },
      { t: fH({ f: 'si', m, b: toQ6(-y1 - qNum(m) * x1), op }), sem: relKey({ f: 'si', m, b: toQ6(-y1 - qNum(m) * x1), op }), say: `Move ${y1 > 0 ? '−' : '+'} ${nH(Math.abs(y1))} across: it becomes ${y1 > 0 ? '+' : '−'} ${nH(Math.abs(y1))}.` },
      { t: fH({ f: 'si', m, b: toQ6(b), op: flip(op) }), sem: relKey({ f: 'si', m, b: toQ6(b), op: flip(op) }), say: `The coefficient of ${Yv} is 1, so nothing turns the sign.` },
    ];
    const dist = r3(-qNum(m) * x1);
    return choice(R, {
      id: `psToSI-${n}`, family: 'psToSI', prompt: `Write ${fH(F)} in slope-intercept form.`, board: fT(F),
      solution: [`Distribute ${qH(m)} to both terms: ${Yv} ${y1 > 0 ? '−' : '+'} ${nH(Math.abs(y1))} ${opH(op)} ${exprH(m, q(Math.round(dist * 6), 6))}.`, `${y1 > 0 ? 'Add' : 'Subtract'} ${nH(Math.abs(y1))} on both sides: ${fH(right)}. (No sign turns: ${Yv} has coefficient 1.)`],
      picture: pic({ items: [sh('sh', [F]), bl('bd', F), dot('pt', x1, y1, 'first', P(x1, y1)), dot('yi', 0, b, 'link', P(0, r3(b)))], show: [], solve: ['bd', 'pt', 'yi', 'sh'] }),
    }, fH(right), 'Yes: distribute to both terms, then move the number.', ws, { sem: relKey(right) });
  }
};

// =====================================================================================================================
// systems
// =====================================================================================================================
/** two lines y = m1 x + b1, y = m2 x + b2 crossing at an integer point (h, k) near the middle, at a good angle */
function twoLines(R: () => number): { F1: Form & { f: 'si' }; F2: Form & { f: 'si' }; h: number; k: number } {
  for (;;) {
    const m1 = pick(R, [q(2), q(1), q(1, 2), q(0), q(-1, 2), q(-1), q(-2), q(3)]), m2 = pick(R, [q(2), q(1), q(1, 2), q(0), q(-1, 2), q(-1), q(-2), q(-3)]);
    const a1 = Math.atan(qNum(m1)), a2 = Math.atan(qNum(m2));
    let d = Math.abs(a1 - a2); if (d > Math.PI / 2) d = Math.PI - d;
    if (d < 0.6) continue;
    const h = int(R, -2, 2), k = int(R, -2, 2);
    const b1 = k - qNum(m1) * h, b2 = k - qNum(m2) * h;
    if (Math.abs(b1 * 2 - Math.round(b1 * 2)) > 1e-9 || Math.abs(b2 * 2 - Math.round(b2 * 2)) > 1e-9) continue;
    return { F1: { f: 'si', m: m1, b: q(Math.round(b1 * 2), 2), op: randOp(R) }, F2: { f: 'si', m: m2, b: q(Math.round(b2 * 2), 2), op: randOp(R) }, h, k };
  }
}
const sysPoint: Gen = (R, n) => {
  for (;;) {
    const F1: Form = R() < 0.6 ? randSI(R, SLOPES_INT, -3, 3) : randStd(R);
    const F2: Form = R() < 0.5 ? randStd(R) : randXY(R, -3, 3);
    const want = int(R, 0, 3);   // 0 both, 1 fails only F1, 2 fails only F2, 3 fails both
    let pt: [number, number] | null = null;
    for (let t = 0; t < 200 && !pt; t++) {
      const x = int(R, -5, 5), y = int(R, -5, 5);
      if (onLine(F1, x, y) || onLine(F2, x, y)) continue;
      const a = holds(F1, x, y), b = holds(F2, x, y);
      const cat = a && b ? 0 : !a && b ? 1 : a && !b ? 2 : 3;
      if (cat === want) pt = [x, y];
    }
    if (!pt) continue;
    const [x, y] = pt, a = holds(F1, x, y), b = holds(F2, x, y);
    const opts: Opt[] = [
      { t: 'Yes: it makes both inequalities true', say: '', mc: undefined },
      { t: `No: it makes only ${fH(F1)} false`, say: '' },
      { t: `No: it makes only ${fH(F2)} false`, say: '' },
      { t: 'No: it makes both inequalities false', say: '' },
    ];
    const both = `${fH(F1)}: ${checkAt(F1, x, y)}. ${fH(F2)}: ${checkAt(F2, x, y)}.`;
    opts.forEach((o, i) => { o.say = i === want ? `Yes. ${both}` : `Check each one. ${both}`; });
    if (want === 1 || want === 2) opts[0]!.mc = MC.oneCond;
    return fixedChoice({
      id: `sysPoint-${n}`, family: 'sysPoint', prompt: `Is ${P(x, y)} a solution of the system ${fH(F1)} and ${fH(F2)}?`, board: fT(F1),
      solution: [`${fH(F1)}: ${checkAt(F1, x, y)}.`, `${fH(F2)}: ${checkAt(F2, x, y)}.`, a && b ? 'Both true: a solution of the system.' : 'A system needs BOTH true at the same point.'],
      picture: pic({ items: [sh('s1', [F1], 'first', 0.22), sh('s2', [F2], 'second', 0.22), bl('b1', F1, { col: 'first' }), bl('b2', F2, { col: 'second' }), dot('P', x, y, 'pick', P(x, y))], show: ['s1', 's2', 'b1', 'b2', 'P'], solve: [] }, { bd: [fT(F2)] }),
    }, opts, want);
  }
};

const sysRegion: Gen = (R, n) => {
  for (;;) {
    const { F1, F2, h, k } = twoLines(R);
    const u = (m: Q) => { const v = qNum(m), L = Math.hypot(1, v); return [1 / L, v / L]; };
    const u1 = u(F1.m), u2 = u(F2.m);
    const labs: { x: number; y: number; ok1: boolean; ok2: boolean }[] = [];
    for (const [s1, s2] of [[1, 1], [1, -1], [-1, -1], [-1, 1]] as const) {
      const dx = s1 * u1[0]! + s2 * u2[0]!, dy = s1 * u1[1]! + s2 * u2[1]!, L = Math.hypot(dx, dy);
      const x = r3(h + 3.4 * dx / L), y = r3(k + 3.4 * dy / L);
      labs.push({ x, y, ok1: holds(F1, x, y), ok2: holds(F2, x, y) });
    }
    if (labs.some(l => Math.abs(l.x) > 5.2 || Math.abs(l.y) > 5.2) || labs.filter(l => l.ok1 && l.ok2).length !== 1) continue;
    // a letter keeps clear of both lines (distance in grid units; the window has equal axes)
    const dist = (F: typeof F1, x: number, y: number) => Math.abs(qNum(F.m) * x + qNum(F.b) - y) / Math.hypot(1, qNum(F.m));
    if (labs.some(l => dist(F1, l.x, l.y) < 1.1 || dist(F2, l.x, l.y) < 1.1)) continue;
    labs.sort((a, b) => Math.atan2(b.y - k, b.x - h) - Math.atan2(a.y - k, a.x - h));
    const L4 = ['A', 'B', 'C', 'D'];
    const ri = labs.findIndex(l => l.ok1 && l.ok2);
    const opts: Opt[] = labs.map((l, i) => ({
      t: `Region ${L4[i]}`,
      mc: l.ok1 !== l.ok2 ? MC.oneCond : undefined,
      say: i === ri ? `Yes: region ${L4[i]} makes both true.` : l.ok1 !== l.ok2 ? `Region ${L4[i]} makes only ${fH(l.ok1 ? F1 : F2)} true. A system needs both.` : `Region ${L4[i]} makes both false.`,
    }));
    const T = labs[ri]!;
    let tp: [number, number] | null = null, bd = 99;
    for (let x = -5; x <= 5; x++) for (let y = -5; y <= 5; y++) {
      if (!holds(F1, x, y) || !holds(F2, x, y) || onLine(F1, x, y) || onLine(F2, x, y)) continue;
      const d = Math.hypot(x - T.x, y - T.y);
      if (d < bd) { bd = d; tp = [x, y]; }
    }
    if (!tp) continue;
    const items: GItem[] = [sh('sh', [F1, F2]), bl('b1', F1, { col: 'first' }), bl('b2', F2, { col: 'second' }), ...labs.map((l, i) => ({ kind: 'text', key: `L${L4[i]}`, x: l.x, y: l.y, text: L4[i]!, col: 'ink', size: 54 }) as GItem)];
    return fixedChoice({
      id: `sysRegion-${n}`, family: 'sysRegion', prompt: `Which region is the solution set of the system ${fH(F1)} and ${fH(F2)}?`, board: fT(F1),
      solution: [`Test a point of each region in both. ${P(tp[0], tp[1])} in region ${L4[ri]}: ${checkAt(F1, tp[0], tp[1])}; ${checkAt(F2, tp[0], tp[1])}.`, 'The solution set is where BOTH are true: the overlap of the two half-planes.'],
      picture: pic({ items, show: ['b1', 'b2', 'LA', 'LB', 'LC', 'LD'], solve: ['sh'] }, { bd: [fT(F2)] }),
    }, opts, ri);
  }
};

const sysCorner: Gen = (R, n) => {
  const { F1, F2, h, k } = twoLines(R);
  if (R() < 0.35) { F1.op = pick(R, ['<=', '>='] as const); F2.op = pick(R, ['<=', '>='] as const); }
  const ok = !strict(F1.op) && !strict(F2.op);
  const opts: Opt[] = [
    { t: `Yes: ${P(h, k)} makes both inequalities true`, say: ok ? 'Yes: both lines are solid, so equal counts in both.' : `On ${strict(F1.op) ? fH(F1) : fH(F2)} it makes the sides equal, and a strict sign leaves equal out.`, mc: ok ? undefined : MC.strictIn },
    { t: `No: ${P(h, k)} makes at least one inequality false`, say: ok ? 'Both boundaries are solid: equal counts in both, so the corner is a solution.' : `Yes: it is on the dashed boundary of ${strict(F1.op) ? fH(F1) : fH(F2)}.`, mc: ok ? MC.inclOut : undefined },
    { t: 'Yes: the corner of a shaded region always belongs to it', mc: MC.strictIn, say: 'Not always: a corner on a dashed line is left out.' },
  ];
  return fixedChoice({
    id: `sysCorner-${n}`, family: 'sysCorner', prompt: `The boundaries of ${fH(F1)} and ${fH(F2)} cross at ${P(h, k)}. Is ${P(h, k)} a solution of the system?`, board: fT(F1),
    solution: [`${P(h, k)} is on both lines: both inequalities have equal sides there.`, `${fH(F1)} ${strict(F1.op) ? 'leaves equal out' : 'lets equal in'}; ${fH(F2)} ${strict(F2.op) ? 'leaves equal out' : 'lets equal in'}.`],
    picture: pic({ items: [sh('sh', [F1, F2]), bl('b1', F1, { col: 'first' }), bl('b2', F2, { col: 'second' }), dot('C', h, k, 'pick', P(h, k)), dot('Cv', h, k, ok ? 'link' : 'wrong', undefined, !ok)], show: ['sh', 'b1', 'b2', 'C'], solve: ['Cv'] }, { bd: [fT(F2)] }),
  }, opts, ok ? 0 : 1);
};

const KINDS = ['A strip between two parallel lines', 'A single line: only the points on it', 'No points at all: the system has no solution', 'A half-plane: one of the two inequalities does all the work'];
const specialKind: Gen = (R, n) => {
  const t = pick(R, ['strip', 'empty', 'line', 'emptyEq', 'oStrip', 'oEmpty', 'nested', 'xStrip', 'xEmpty'] as const);
  let F1: Form, F2: Form, kind: number;
  const a = int(R, -3, 1), d = int(R, 2, 4);
  const m = pick(R, [q(2), q(-1), q(1, 2), q(1), q(-2)]);
  switch (t) {
    case 'strip': F1 = { f: 'y', c: a, op: pick(R, ['>', '>='] as const) }; F2 = { f: 'y', c: a + d, op: pick(R, ['<', '<='] as const) }; kind = 0; break;
    case 'empty': F1 = { f: 'y', c: a + d, op: pick(R, ['>', '>='] as const) }; F2 = { f: 'y', c: a, op: pick(R, ['<', '<='] as const) }; kind = 2; break;
    case 'line': F1 = { f: 'y', c: a + 1, op: '>=' }; F2 = { f: 'y', c: a + 1, op: '<=' }; kind = 1; break;
    case 'emptyEq': F1 = { f: 'y', c: a + 1, op: pick(R, ['>', '>='] as const) }; F2 = { f: 'y', c: a + 1, op: F1.op === '>' ? pick(R, ['<', '<='] as const) : '<' }; kind = 2; break;
    case 'oStrip': F1 = { f: 'si', m, b: q(a), op: pick(R, ['>', '>='] as const) }; F2 = { f: 'si', m, b: q(a + d), op: pick(R, ['<', '<='] as const) }; kind = 0; break;
    case 'oEmpty': F1 = { f: 'si', m, b: q(a + d), op: pick(R, ['>', '>='] as const) }; F2 = { f: 'si', m, b: q(a), op: pick(R, ['<', '<='] as const) }; kind = 2; break;
    case 'nested': { const up = R() < 0.5; F1 = { f: 'si', m, b: q(a), op: up ? '>' : '<' }; F2 = { f: 'si', m, b: q(a + d), op: up ? '>=' : '<=' }; kind = 3; break; }
    case 'xStrip': F1 = { f: 'x', c: a, op: pick(R, ['>', '>='] as const) }; F2 = { f: 'x', c: a + d, op: pick(R, ['<', '<='] as const) }; kind = 0; break;
    default: F1 = { f: 'x', c: a + d, op: pick(R, ['>', '>='] as const) }; F2 = { f: 'x', c: a, op: pick(R, ['<', '<='] as const) }; kind = 2; break;
  }
  if (R() < 0.5) [F1, F2] = [F2, F1];
  const opts: Opt[] = KINDS.map((k, i) => ({
    t: k,
    mc: i === 0 && kind === 2 ? MC.alwaysRegion : undefined,
    say: i === kind ? 'Yes.' : kind === 2 ? 'Each one alone has solutions, but no point is on the right side of both lines: they point away from each other.' : kind === 0 ? 'Both lines are parallel and the two sides face each other: the band between them.' : kind === 1 ? 'Only the points where both sides allow EQUAL: the one line itself.' : 'One half-plane sits inside the other: the smaller one is the answer.',
  }));
  const sol = kind === 2 ? 'The two sides point away from each other: no point is on the right side of both.' : kind === 0 ? 'The two sides face each other: the band between the lines.' : kind === 1 ? 'Both lines are the same line, and both signs allow equal: only that line.' : 'Both sides point the same way: the stricter half-plane is inside the other.';
  const items: GItem[] = [sh('sh', [F1, F2]), bl('b1', F1, { col: 'first' }), bl('b2', F2, { col: 'second' })];
  if (kind === 1) items.push(bl('only', F1, { dash: false, col: 'link' }));
  return fixedChoice({
    id: `specialKind-${n}`, family: 'specialKind', prompt: `What is the solution set of the system ${fH(F1)} and ${fH(F2)}?`, board: fT(F1),
    solution: [`Boundaries: ${eqH(F1)} and ${eqH(F2)}, ${eqH(F1) === eqH(F2) ? 'the same line' : 'parallel'}.`, sol],
    picture: pic({ items, show: ['b1', 'b2'], solve: kind === 1 ? ['only'] : ['sh'] }, { bd: [fT(F2)] }),
  }, opts, kind);
};

/** a cap a x + b y ≤ c with integer intercepts inside 3..7 */
function cap(R: () => number): Form & { f: 'std' } {
  const t = pick(R, [[1, 1], [2, 1], [1, 2], [3, 2], [2, 3]] as const);
  for (;;) {
    const c = t[0] * t[1] * int(R, 1, 6);
    if (c / t[0] >= 3 && c / t[0] <= 7 && c / t[1] >= 3 && c / t[1] <= 7) return { f: 'std', A: t[0], B: t[1], C: c, op: '<=' };
    if (t[0] * t[1] === 6) return { f: 'std', A: t[0], B: t[1], C: 12, op: '<=' };
  }
}
const QX: Form = { f: 'x', c: 0, op: '>=' }, QY: Form = { f: 'y', c: 0, op: '>=' };
const multiPoint: Gen = (R, n) => {
  for (;;) {
    const L = cap(R);
    const extra: Form | null = R() < 0.5 ? (R() < 0.5 ? { f: 'y', c: int(R, 1, Math.floor(L.C / L.B) - 1), op: '<=' } : { f: 'x', c: int(R, 1, Math.floor(L.C / L.A) - 1), op: '<=' }) : null;
    const cons: Form[] = extra ? [QX, QY, L, extra] : [QX, QY, L];
    const fails = (x: number, y: number) => cons.map(F => !holds(F, x, y));
    const nOn = (x: number, y: number) => cons.some(F => onLine(F, x, y));
    const grab = (test: (f: boolean[]) => boolean): [number, number] | null => {
      for (let t = 0; t < 300; t++) { const x = int(R, -3, 6) + (R() < 0.2 ? 0.5 : 0), y = int(R, -3, 7); if (!nOn(x, y) && test(fails(x, y))) return [x, y]; }
      return null;
    };
    const right = grab(f => f.every(v => !v));
    const lastOnly = grab(f => !f[f.length - 1] && f.slice(0, -1).some(v => v));
    const oneFail = grab(f => f.filter(v => v).length === 1 && f[f.length - 1]!);
    const other = grab(f => f.filter(v => v).length >= 1);
    if (!right || !lastOnly || !oneFail || !other) continue;
    const names = cons.map(fH);
    const why = (p: [number, number]) => { const f = fails(p[0], p[1]); return `It breaks ${f.map((v, i) => (v ? names[i] : '')).filter(Boolean).join(' and ')}.`; };
    const ws: Opt[] = [
      { t: P(lastOnly[0], lastOnly[1]), mc: MC.replaces, say: `${why(lastOnly)} The last constraint is not the only one: every constraint must hold.` },
      { t: P(oneFail[0], oneFail[1]), mc: MC.oneCond, say: `${why(oneFail)} Meeting most constraints is not enough.` },
      { t: P(other[0], other[1]), say: why(other) },
    ];
    const pts = [right, lastOnly, oneFail, other];
    if (new Set(pts.map(p => P(p[0], p[1]))).size < 4) continue;
    if (pts.some((p, i) => pts.some((r, j) => j > i && Math.hypot(p[0] - r[0], p[1] - r[1]) < 1.2))) continue;
    const items: GItem[] = [sh('sh', cons), ...cons.map((F, i) => bl(`b${i}`, F, { col: i < 2 ? 'dim' : i === 2 ? 'first' : 'second' })), ...pts.map((p, i) => dot(`c${i}`, p[0], p[1], 'pick')), dot('ok', right[0], right[1], 'link', P(right[0], right[1]))];
    return choice(R, {
      id: `multiPoint-${n}`, family: 'multiPoint', prompt: `Which point is in the feasible region of ${names.join(', ')}?`, board: fT(cons[2]!),
      solution: [`Check every constraint for each point. ${P(right[0], right[1])}: ${cons.map(F => `${fH(F)} ✓`).join(', ')}.`, 'Each other point breaks at least one constraint.'],
      picture: pic({ x: { min: -3, max: 7, step: 1, name: 'x' }, y: { min: -3, max: 7, step: 1, name: 'y' }, items, show: ['b0', 'b1', 'b2', ...(extra ? ['b3'] : []), 'c0', 'c1', 'c2', 'c3'], solve: ['sh', 'ok'] }, { bd: [extra ? `${fT(QX)},\\ ${fT(QY)},\\ ${fT(extra)}` : `${fT(QX)},\\ ${fT(QY)}`] }),
    }, P(right[0], right[1]), 'Yes: it meets every constraint.', ws);
  }
};

const ADD = ['Nothing changes: the region stays the same', 'The region gets smaller but is not empty', 'The region becomes empty: no point meets every constraint'];
const addConstraint: Gen = (R, n) => {
  const L = cap(R), Y0 = L.C / L.B, X0 = L.C / L.A;
  const t = pick(R, ['redundant', 'cuts', 'cutsUp', 'empty', 'emptyX', 'redundantX'] as const);
  let K: Form, res: number;
  switch (t) {
    case 'redundant': K = { f: 'y', c: Math.ceil(Y0) + int(R, 1, 2), op: '<=' }; res = 0; break;
    case 'redundantX': K = { f: 'x', c: -int(R, 1, 2), op: '>=' }; res = 0; break;
    case 'cuts': K = { f: 'y', c: int(R, 1, Math.max(1, Math.floor(Y0) - 1)), op: '<=' }; res = 1; break;
    case 'cutsUp': K = { f: 'x', c: int(R, 1, Math.max(1, Math.floor(X0) - 1)), op: '>=' }; res = 1; break;
    case 'empty': K = { f: 'y', c: Math.floor(Y0) + int(R, 1, 2), op: '>=' }; res = 2; break;
    default: K = { f: 'x', c: Math.floor(X0) + int(R, 1, 2), op: '>=' }; res = 2; break;
  }
  const opts: Opt[] = [...ADD.map((t2, i) => ({ t: t2, say: i === res ? 'Yes.' : res === 0 ? `Every point of the triangle already meets ${fH(K)}.` : res === 1 ? `Part of the triangle breaks ${fH(K)}, part keeps it.` : `No point of the triangle meets ${fH(K)}.` })),
    { t: `The region becomes all the points with ${fH(K)}`, mc: MC.replaces, say: 'The old constraints still hold. The new one cuts the OLD region down; it does not replace it.' }];
  const base: Form[] = [QX, QY, L];
  const lo = Math.min(-2, ...[K].map(F => (F.f === 'x' ? F.c - 1 : -2))), hi = Math.max(8, (K.f === 'y' || K.f === 'x') ? K.c + 1 : 8);
  return fixedChoice({
    id: `addConstraint-${n}`, family: 'addConstraint', prompt: `The shaded triangle is the region of ${fH(QX)}, ${fH(QY)} and ${fH(L)}. Add the constraint ${fH(K)}. What happens to the region?`, board: fT(L),
    solution: [`The triangle reaches up to ${Yv} = ${nH(Y0)} and across to ${X} = ${nH(X0)}.`, res === 0 ? `Every point of it already meets ${fH(K)}: the region stays the same.` : res === 1 ? `${fH(K)} cuts off part of it: smaller, not empty.` : `No point of it meets ${fH(K)}: the region is empty.`],
    picture: pic({ x: { min: lo, max: hi, step: 1, name: 'x' }, y: { min: lo, max: hi, step: 1, name: 'y' }, items: [sh('sh0', base, 'first', 0.25), sh('shK', [...base, K], 'link', 0.45), bl('b0', QX, { col: 'dim' }), bl('b1', QY, { col: 'dim' }), bl('b2', L, { col: 'first' }), bl('bK', K, { col: 'second' })], show: ['sh0', 'b0', 'b1', 'b2', 'bK'], solve: ['shK'] }, { bd: [fT(K)] }),
  }, opts, res);
};

// =====================================================================================================================
// justify-boundary, justify-test-point
// =====================================================================================================================
const whyIncluded: Gen = (R, n) => {
  const F = randAny(R), st = strict(F.op), [Lh, Rh] = lhsRhs(F);
  const right = st ? `On the line, ${Lh} equals ${Rh} exactly, and ${opH(F.op)} does not allow equal` : `On the line, ${Lh} equals ${Rh} exactly, and ${opH(F.op)} allows equal`;
  const ws: Opt[] = [
    { t: `Only because the rule says ${opH(F.op)} is drawn ${styleW(F)}: there is no other reason`, mc: MC.memorized, say: 'The rule has a reason: on the line the two sides are EQUAL. Does the sign allow equal?' },
    { t: `On the line, ${Lh} is ${greater(F.op) ? 'greater' : 'less'} than ${Rh}`, say: `On the line the two sides are EQUAL: that is what ${eqH(F)} says.` },
    { t: `Because the shading is ${sideW(side(F))} the line`, mc: MC.styleMeaning, say: 'The side does not decide the style. Equal or not decides it.' },
  ];
  const p = pointFor(R, F, 'on', false) ?? [0, 0];
  return choice(R, {
    id: `whyIncluded-${n}`, family: 'whyIncluded', prompt: `Why are the points on the line ${eqH(F)} ${st ? 'left out of' : 'part of'} the graph of ${fH(F)}?`, board: fT(F),
    solution: [`Take a point on the line, ${P(p[0], p[1])}: ${checkAt(F, p[0], p[1])}.`, `On the line the two sides are equal, and ${opH(F.op)} ${st ? 'needs a strict difference' : 'allows equal'}.`],
    picture: pic({ items: [sh('sh', [F]), bl('bd', F), dot('pt', p[0], p[1], st ? 'wrong' : 'link', P(p[0], p[1]), st)], show: ['sh', 'bd'], solve: ['pt'] }),
  }, right, 'Yes: equal sides on the line, and the sign decides whether equal counts.', ws);
};

const oneTestWhy: Gen = (R, n) => {
  for (;;) {
    const F: Form = R() < 0.4 ? randStd(R) : R() < 0.6 ? randSI(R) : randXY(R, -4, 4);
    if (onLine(F, 0, 0)) continue;
    const ok = holds(F, 0, 0);
    const [Lh, Rh] = lhsRhs(F);
    const right = `Moving from (0, 0) to any point on its side never crosses the line, and only on the line can ${Lh} equal ${Rh}, so the comparison cannot switch on the way`;
    const ws: Opt[] = [
      { t: 'It is just the rule for graphing inequalities: always test one point', mc: MC.tpTrick, say: `There is a reason: ${Lh} can only switch from bigger to smaller than ${Rh} by being equal to it, and that only happens on the line.` },
      { t: 'It does not: you have to test several points on that side to be sure', mc: MC.tpDistrust, say: 'Every point on one side gives the same answer: to change, you would have to cross the line.' },
      { t: 'Because (0, 0) worked, and one example that works proves the rule', mc: MC.examples, say: 'One example proves nothing by itself. The proof is that you cannot switch sides of the comparison without crossing the line.' },
    ];
    const q2 = pointFor(R, F, ok ? 'in' : 'out', false);
    if (!q2) continue;
    return choice(R, {
      id: `oneTestWhy-${n}`, family: 'oneTestWhy', prompt: `(0, 0) makes ${fH(F)} ${ok ? 'true' : 'false'}, so the side ${ok ? 'with' : 'without'} (0, 0) is shaded. Why does ONE test point settle the whole side?`, board: fT(F),
      solution: [`${Lh} and ${Rh} can only change order by being equal somewhere in between, and they are equal only on the line.`, `A path from (0, 0) to ${P(q2[0], q2[1])} stays on one side, so the answer stays ${ok ? 'true' : 'false'}: ${checkAt(F, q2[0], q2[1])}.`],
      picture: pic({ items: [sh('sh', [F]), bl('bd', F), dot('tp', 0, 0, ok ? 'link' : 'wrong', '(0, 0)'), { kind: 'seg', key: 'path', a: [0, 0], b: [q2[0], q2[1]], col: 'pick', dash: true, arrow: true }, dot('q2', q2[0], q2[1], 'pick')], show: ['sh', 'bd', 'tp'], solve: ['path', 'q2'] }),
    }, right, 'Yes: no crossing, no switch. That is why one test point is enough.', ws);
  }
};

const vertCompare: Gen = (R, n) => {
  for (;;) {
    const F = randSI(R, [q(1), q(-1), q(2), q(-2), q(1, 2), q(-1, 2)], -3, 3);
    const a = int(R, -3, 3), r = qNum(F.m) * a + qNum(F.b);
    if (!Number.isInteger(r) || Math.abs(r) > 4) continue;
    const up = greater(F.op), dir = up ? 1 : -1;
    const right = `Every point (${nH(a)}, ${Yv}) with ${Yv} ${opH(F.op)} ${nH(r)}`;
    const ws: Opt[] = [
      { t: `Only the point ${P(a, r)}`, mc: MC.bOnly, say: `${P(a, r)} is where the two sides are equal. ${opH(F.op)} wants ${Yv} ${up ? 'bigger' : 'smaller'}: a whole ray of points.` },
      { t: `Every point (${nH(a)}, ${Yv}) with ${Yv} ${opH(flip(F.op))} ${nH(r)}`, say: `${opH(F.op)} wants ${Yv} ${up ? 'bigger' : 'smaller'} than the line's value ${nH(r)}.` },
      { t: `Only the whole-number points ${P(a, r + dir)}, ${P(a, r + 2 * dir)}, ${P(a, r + 3 * dir)} and so on`, mc: MC.lattice, say: `${P(a, r + 0.5 * dir)} works too: any ${Yv} ${up ? 'above' : 'below'} ${nH(r)}, not just whole numbers.` },
    ];
    return choice(R, {
      id: `vertCompare-${n}`, family: 'vertCompare', prompt: `For ${fH(F)}: at ${X} = ${nH(a)} the boundary is at ${Yv} = ${nH(r)}. Which points with ${X} = ${nH(a)} are solutions?`, board: fT(F),
      solution: [`At ${X} = ${nH(a)} the right side is ${subSI(F.m, F.b, a)} = ${nH(r)}.`, `So the inequality says ${Yv} ${opH(F.op)} ${nH(r)}: every point ${up ? 'above' : 'below'} the line on that vertical${strict(F.op) ? '' : ', the line point too'}. The same holds at every ${X}: a half-plane.`],
      picture: pic({ items: [sh('sh', [F]), bl('bd', F), { kind: 'seg', key: 'vl', a: [a, -6], b: [a, 6], col: 'pick', dash: true, w: 3 }, dot('bp', a, r, 'first', P(a, r)), { kind: 'seg', key: 'arrow', a: [a, r], b: [a, Math.max(-5.5, Math.min(5.5, r + 2.5 * dir))], col: 'link', arrow: true, w: 6 }], show: ['bd', 'vl', 'bp'], solve: ['sh', 'arrow'] }),
    }, right, `Yes: ${Yv} ${opH(F.op)} ${nH(r)} on that vertical.`, ws);
  }
};

// =====================================================================================================================
// write-from-graph (table), critique
// =====================================================================================================================
const writeTable: Gen = (R, n) => {
  for (;;) {
  const F = randSI(R, [q(1), q(-1), q(2), q(-2), q(1, 2)], -3, 3);
  const mm = qNum(F.m), bb = qNum(F.b);
  const xs = shuffle(R, [-2, -1, 0, 1, 2, 3]);
  const on1: [number, number] = [xs[0]!, mm * xs[0]! + bb], on2: [number, number] = [xs[1]!, mm * xs[1]! + bb], on3: [number, number] = [xs[2]!, mm * xs[2]! + bb];
  const up = greater(F.op) ? 1 : -1;
  const inP: [number, number] = [xs[3]!, mm * xs[3]! + bb + up * int(R, 1, 3)], outP: [number, number] = [xs[4]!, mm * xs[4]! + bb - up * int(R, 1, 3)];
  if ([on1, on2, on3, inP, outP].some(p => Math.abs(p[1]) > 5.5 || !Number.isInteger(p[1]))) continue;
  if (R() < 0.3) {
    // a finite list of solutions does not fix the inequality
    const right = 'Many different inequalities have all three as solutions, so the table alone cannot tell which one';
    const sol3 = [on1, on2, on3];
    const L: Form = { ...F, op: '>=' };
    return choice(R, {
      id: `writeTable-${n}`, family: 'writeTable', prompt: `The pairs ${sol3.map(p => P(p[0], p[1])).join(', ')} are all solutions of one inequality. What can you say about the inequality?`, board: '\\text{all solutions:}',
      solution: [`All three lie on ${eqH(F)}: they are solutions of ${fH(L)}, and of ${fH(withOp(L, '<='))} too.`, `They are also solutions of ${Yv} ≥ ${nH(Math.min(...sol3.map(p => p[1])))}. Three points cannot pick out one inequality.`],
      picture: pic({ items: [bl('bd', L, { dash: false, col: 'dim' }), ...sol3.map((p, i) => dot(`s${i}`, p[0], p[1], 'link'))], show: [], solve: ['s0', 's1', 's2', 'bd'] }, { bd: sol3.map(p => PT(p[0], p[1])) }),
    }, right, 'Yes: a few solutions never fix the rule on their own.', [
      { t: `It must be ${fH(L)}: the three points fit that line`, mc: MC.finite, say: `They also make ${fH(withOp(L, '<='))} true, and ${Yv} ≥ ${nH(Math.min(...sol3.map(p => p[1])))}. A few points do not fix one rule.` },
      { t: `It must be ${fH(withOp(L, '<='))}: the three points fit that line`, mc: MC.finite, say: `They also make ${fH(L)} true. A few points do not fix one rule.` },
      { t: 'No inequality has all three as solutions', say: `${fH(L)} has all three: they are on its boundary, and ≥ lets equal in.` },
    ]);
  }
  const incl = !strict(F.op);
  const sols = [inP, ...(incl ? [on3] : [])], nons = [outP, ...(incl ? [] : [on3])];
  const ws: Opt[] = [
    { t: fH(withOp(F, toggleIncl(F.op))), sem: relKey(withOp(F, toggleIncl(F.op))), mc: MC.ignoresIncl, say: `${P(on3[0], on3[1])} is on the boundary and is ${incl ? '' : 'NOT '}a solution: the sign must ${incl ? 'allow' : 'leave out'} equal.` },
    { t: fH(withOp(F, flip(F.op))), sem: relKey(withOp(F, flip(F.op))), say: `${P(inP[0], inP[1])} is a solution: it must make the inequality true.` },
    { t: fH({ ...F, m: qNeg(F.m) }), sem: relKey({ ...F, m: qNeg(F.m) }), say: `Check the boundary points: ${P(on1[0], on1[1])} must make the two sides equal.` },
  ];
  return choice(R, {
    id: `writeTable-${n}`, family: 'writeTable', prompt: `The table gives two points on the boundary line, and which pairs are solutions. Which inequality fits?`, board: 'y\\ \\square\\ ?',
    solution: [`Boundary through ${P(on1[0], on1[1])} and ${P(on2[0], on2[1])}: ${eqH(F)}.`, `${P(on3[0], on3[1])} is on the line and is ${incl ? '' : 'not '}a solution: ${incl ? '≤ or ≥' : '&lt; or &gt;'}. ${P(inP[0], inP[1])} is a solution: ${checkAt(F, inP[0], inP[1])}.`],
    picture: pic({ items: [sh('sh', [F]), bl('bd', F), dot('o1', on1[0], on1[1], 'first'), dot('o2', on2[0], on2[1], 'first'), dot('o3', on3[0], on3[1], incl ? 'link' : 'wrong', undefined, !incl), dot('pi', inP[0], inP[1], 'link'), dot('po', outP[0], outP[1], 'wrong')], show: [], solve: ['o1', 'o2', 'bd', 'o3', 'pi', 'po', 'sh'] },
      { bd: [`\\text{boundary: } ${PT(on1[0], on1[1])},\\ ${PT(on2[0], on2[1])}`, `\\text{solutions: } ${sols.map(p => PT(p[0], p[1])).join(',\\ ')}`, `\\text{not solutions: } ${nons.map(p => PT(p[0], p[1])).join(',\\ ')}`] }),
  }, fH(F), 'Yes: the line from the boundary points, the sign from the labeled pairs.', ws, { sem: relKey(F) });
  }
};

const CRIT = ['The line style is wrong (dashed vs solid)', 'The wrong side is shaded', 'The boundary line is in the wrong place', 'Nothing is wrong'];
const critique: Gen = (R, n) => {
  for (;;) {
    const err = pick(R, ['style', 'side', 'line', 'none'] as const);
    const F: Form = R() < 0.6 ? randStd(R, { bNeg: err === 'side' ? R() < 0.8 : undefined }) : randSI(R, SLOPES_INT, -3, 3);
    if (onLine(F, 0, 0)) continue;
    let drawn: Form = F, dash = strict(F.op);
    if (err === 'style') dash = !dash;
    if (err === 'side') drawn = withOp(F, flip(F.op));
    if (err === 'line') {
      if (F.f === 'std') {
        const xi = F.C / F.A, yi = F.C / F.B;
        if (near(Math.abs(xi), Math.abs(yi))) continue;
        // the line through the swapped intercepts (yi, 0) and (0, xi), shaded on the side that agrees with (0, 0)
        const S = normStd(xi, yi, xi * yi);
        const base: Form = { f: 'std', ...S, op: F.op };
        drawn = holds(base, 0, 0) === holds(F, 0, 0) ? base : withOp(base, flip(F.op));
      } else {
        if (F.f !== 'si' || F.b.p === 0) continue;
        const base: Form = { ...F, b: qNeg(F.b) };
        if (onLine(base, 0, 0)) continue;
        drawn = holds(base, 0, 0) === holds(F, 0, 0) ? base : withOp(base, flip(F.op));
      }
    }
    const ri = err === 'style' ? 0 : err === 'side' ? 1 : err === 'line' ? 2 : 3;
    const ok0 = holds(F, 0, 0);
    const opts: Opt[] = CRIT.map((t, i) => ({ t, say: i === ri ? 'Yes.' : ri === 3 ? 'Check it: the line, its style and a test point all agree with the inequality.' : `Check with evidence: ${err === 'style' ? `the sign is ${opH(F.op)}, so the line should be ${styleW(F)}` : err === 'side' ? `(0, 0) gives ${checkAt(F, 0, 0)}` : `the boundary ${eqH(F)} goes through other points`}.` }));
    if (ri !== 3) opts[3]!.mc = err === 'side' && F.f === 'std' && F.B < 0 ? MC.noRev : err === 'style' ? MC.ignoresIncl : undefined;
    const p1 = F.f === 'std' ? [F.C / F.A, 0] : [0, qNum((F as { b: Q }).b)];
    return fixedChoice({
      id: `critique-${n}`, family: 'critique', prompt: `Mia graphed ${fH(F)}. What is wrong with her graph?`, board: fT(F),
      solution: [`The boundary should be ${eqH(F)}, through ${P(p1[0]!, p1[1]!)}, drawn ${styleW(F)}.`, `Test (0, 0): ${checkAt(F, 0, 0)}, so (0, 0) should be ${ok0 ? 'shaded' : 'unshaded'}.`],
      picture: pic({ items: [sh('sh', [drawn]), bl('bd', drawn, { dash }), sh('shc', [F], 'second', 0.18), bl('bc', F, { col: 'second' }), dot('O', 0, 0, ok0 ? 'link' : 'wrong')], show: ['sh', 'bd'], solve: ['bc', 'O'] }),
    }, opts, ri);
  }
};

const CRITS = ['It shades points that make only one of the inequalities true', 'The corner point should not be included', 'The system has no solution, so nothing should be shaded', 'Nothing is wrong'];
const critiqueSystem: Gen = (R, n) => {
  const err = pick(R, ['union', 'corner', 'empty', 'none'] as const);
  let F1: Form, F2: Form;
  const items: GItem[] = [];
  const show: string[] = [];
  let h = 0, k = 0;
  if (err === 'empty') {
    const m = pick(R, [q(1), q(-1), q(2), q(1, 2), q(-2)]), a = int(R, -3, 0), d = int(R, 2, 3);
    F1 = { f: 'si', m, b: q(a + d), op: pick(R, ['>', '>='] as const) }; F2 = { f: 'si', m, b: q(a), op: pick(R, ['<', '<='] as const) };
    items.push(sh('sh', [withOp(F1, '<='), withOp(F2, '>=')]));
    show.push('sh');
  } else {
    const T = twoLines(R); F1 = T.F1; F2 = T.F2; h = T.h; k = T.k;
    if (err === 'corner' && !strict(F1.op) && !strict(F2.op)) F1 = withOp(F1, strict(F1.op) ? F1.op : F1.op === '<=' ? '<' : '>');
    if (err === 'union') { items.push(sh('sh', [F1]), sh('sh2', [F2])); show.push('sh', 'sh2'); }
    else {
      items.push(sh('sh', [F1, F2])); show.push('sh');
      const incl = !strict(F1.op) && !strict(F2.op);
      items.push(dot('C', h, k, 'link', P(h, k), err === 'corner' ? false : !incl)); show.push('C');
    }
  }
  items.push(bl('b1', F1, { col: 'first' }), bl('b2', F2, { col: 'second' }));
  show.push('b1', 'b2');
  const ri = err === 'union' ? 0 : err === 'corner' ? 1 : err === 'empty' ? 2 : 3;
  const opts: Opt[] = CRITS.map((t, i) => ({ t, say: i === ri ? 'Yes.' : 'Test points: a shaded point must make BOTH inequalities true, and a corner counts only if both lines are solid.' }));
  if (ri !== 3) opts[3]!.mc = err === 'union' ? MC.oneCond : err === 'empty' ? MC.alwaysRegion : MC.strictIn;
  const sol = err === 'union' ? 'Some shaded points make only one inequality true. The system needs the OVERLAP only.' : err === 'corner' ? `The corner ${P(h, k)} is on a dashed boundary: equal sides, and a strict sign leaves it out.` : err === 'empty' ? 'The two sides point away from each other: no point makes both true, so nothing is shaded.' : 'The overlap is shaded, and the corner is drawn the way the two signs say.';
  return fixedChoice({
    id: `critiqueSystem-${n}`, family: 'critiqueSystem', prompt: `Noah graphed the system ${fH(F1)} and ${fH(F2)}. What is wrong with his graph?`, board: fT(F1),
    solution: ['Test a shaded point in both inequalities, and check the corner against the line styles.', sol],
    picture: pic({ items, show, solve: [] }, { bd: [fT(F2)] }),
  }, opts, ri);
};

// =====================================================================================================================
// context: interpret-feasible, formulate-constraints, discrete-domain
// =====================================================================================================================
interface Ctx2 { xs: string; ys: string; a: number; b: number; T: number; L: number; xn: string; yn: string; c1: string; c2: string; f1: Form; f2: Form; step: number; max: number; unit: string }
function jobsCtx(R: () => number): Ctx2 {
  const a = pick(R, [15, 18, 20]), b = pick(R, [10, 12]), H = pick(R, [16, 20, 24]), E = pick(R, [200, 240, 250, 300]);
  return { xs: 'hours tutoring', ys: 'hours at the café', a, b, T: E, L: H, xn: 'tutoring (h)', yn: 'café (h)', c1: 'hours limit', c2: 'earnings target',
    f1: { f: 'std', A: 1, B: 1, C: H, op: '<=' }, f2: { f: 'std', A: a, B: b, C: E, op: '>=' }, step: 2, max: Math.max(H, Math.ceil(E / b)) + 2, unit: 'h' };
}
function fenceCtx(R: () => number): Ctx2 {
  const a = pick(R, [8, 10, 12]), b = pick(R, [3, 4, 5]), Lf = pick(R, [80, 100, 120]), Bd = pick(R, [600, 800, 900, 1000]);
  return { xs: 'feet of wood fence', ys: 'feet of wire fence', a, b, T: Bd, L: Lf, xn: 'wood (ft)', yn: 'wire (ft)', c1: 'budget', c2: 'length needed',
    f1: { f: 'std', A: a, B: b, C: Bd, op: '<=' }, f2: { f: 'std', A: 1, B: 1, C: Lf, op: '>=' }, step: 20, max: Math.max(Lf, Math.ceil(Bd / b)) + 20, unit: 'ft' };
}
const viablePlan: Gen = (R, n) => {
  for (;;) {
    const jobs = R() < 0.5, C = jobs ? jobsCtx(R) : fenceCtx(R);
    const want = int(R, 0, 3);
    let pt: [number, number] | null = null;
    const hi = Math.min(C.max, 20 * C.step) - C.step;
    for (let t = 0; t < 300 && !pt; t++) {
      const x = r3(int(R, 1, Math.floor(hi / (C.step / 4))) * (C.step / 4)), y = r3(int(R, 1, Math.floor(hi / (C.step / 4))) * (C.step / 4));
      if (onLine(C.f1, x, y) || onLine(C.f2, x, y)) continue;
      const a = holds(C.f1, x, y), b = holds(C.f2, x, y);
      if ((a && b ? 0 : !a && b ? 1 : a && !b ? 2 : 3) === want) pt = [x, y];
    }
    if (!pt) continue;
    const [x, y] = pt;
    const opts: Opt[] = [
      { t: 'It works: it meets both conditions', say: '' },
      { t: `It breaks the ${C.c1} only`, say: '' },
      { t: `It breaks the ${C.c2} only`, say: '' },
      { t: 'It breaks both conditions', say: '' },
    ];
    const both = `${fH(C.f1)}: ${checkAt(C.f1, x, y)}. ${fH(C.f2)}: ${checkAt(C.f2, x, y)}.`;
    opts.forEach((o, i) => { o.say = i === want ? `Yes. ${both}` : `Check both. ${both}`; });
    if (want === 1 || want === 2) opts[0]!.mc = MC.oneCond;
    const story = jobs
      ? `Kai tutors for $${C.a} an hour and works at a café for $${C.b} an hour. He can work at most ${C.L} hours a week and wants to earn at least $${C.T}. With ${X} = ${C.xs} and ${Yv} = ${C.ys}: ${fH(C.f1)} and ${fH(C.f2)}. Plan: ${nH(x)} hours tutoring and ${nH(y)} hours at the café.`
      : `A fence uses wood at $${C.a} a foot and wire at $${C.b} a foot. The budget is at most $${C.T}, and at least ${C.L} feet are needed. With ${X} = ${C.xs} and ${Yv} = ${C.ys}: ${fH(C.f1)} and ${fH(C.f2)}. Plan: ${nH(x)} feet of wood and ${nH(y)} feet of wire.`;
    const ax: GAxis = { min: 0, max: Math.ceil((hi + C.step) / C.step) * C.step, step: C.step };
    return fixedChoice({
      id: `viablePlan-${n}`, family: 'viablePlan', prompt: `${story} Does the plan work?`, board: fT(C.f1),
      solution: [`${C.c1[0]!.toUpperCase()}${C.c1.slice(1)}: ${checkAt(C.f1, x, y)}.`, `${C.c2[0]!.toUpperCase()}${C.c2.slice(1)}: ${checkAt(C.f2, x, y)}.`],
      picture: pic({ x: { ...ax, name: C.xn }, y: { ...ax, name: C.yn }, equal: true, items: [sh('sh', [C.f1, C.f2, QX, QY]), bl('b1', C.f1, { col: 'first' }), bl('b2', C.f2, { col: 'second' }), dot('P', x, y, 'pick')], show: ['b1', 'b2', 'P'], solve: ['sh'] }, { bd: [fT(C.f2)] }),
    }, opts, want);
  }
};

const PHR: readonly { w: string; op: Op }[] = [{ w: 'at least', op: '>=' }, { w: 'more than', op: '>' }, { w: 'at most', op: '<=' }, { w: 'no more than', op: '<=' }, { w: 'less than', op: '<' }];
const phraseIneq: Gen = (R, n) => {
  const k = int(R, 0, 3);
  let a = 0, b = 0, T = 0, text = '';
  const ph = (ops: Op[]) => pick(R, PHR.filter(p => ops.includes(p.op)));
  let P0 = PHR[0]!;
  if (k === 0) { a = pick(R, [15, 18, 20, 22]); b = pick(R, [11, 12, 13]); T = pick(R, [200, 250, 300, 360]); P0 = ph(['>=', '>']); text = `Maya tutors for $${a} an hour (${X} hours) and lifeguards for $${b} an hour (${Yv} hours). She wants to earn ${P0.w} $${T} this month.`; }
  else if (k === 1) { a = pick(R, [9, 12, 14]); b = pick(R, [3, 4, 5]); T = pick(R, [600, 750, 900]); P0 = ph(['<=', '<']); text = `A garden fence uses ${X} feet of wood at $${a} a foot and ${Yv} feet of wire at $${b} a foot. The cost must be ${P0.w} $${T}.`; }
  else if (k === 2) { a = pick(R, [8, 9, 10]); b = pick(R, [3, 4, 5]); T = pick(R, [40, 50, 60]); P0 = ph(['<=', '<']); text = `Trail mix: ${X} pounds of almonds at $${a} a pound and ${Yv} pounds of raisins at $${b} a pound. The total must be ${P0.w} $${T}.`; }
  else { a = pick(R, [5, 6, 7]); b = pick(R, [12, 14, 15]); T = pick(R, [40, 50, 60]); P0 = ph(['>=', '>']); text = `Leo runs for ${X} hours at ${a} miles per hour and bikes for ${Yv} hours at ${b} miles per hour. He wants to cover ${P0.w} ${T} miles.`; }
  const F: Form = { f: 'std', A: a, B: b, C: T, op: P0.op };
  const ws: Opt[] = [
    { t: fH({ ...F, A: b, B: a }), sem: relKey({ ...F, A: b, B: a }), mc: MC.swapRates, say: `Each rate goes with its own amount: $${a} goes with ${X}.`.replace('$', k === 3 ? '' : '$') },
    { t: fH(withOp(F, flip(P0.op))), sem: relKey(withOp(F, flip(P0.op))), mc: MC.phraseRev, say: `"${P0.w}" means the total is ${greater(P0.op) ? 'bigger' : 'smaller'} than ${T}${strict(P0.op) ? '' : ' or equal'}: ${opH(P0.op)}.` },
    { t: stdH({ A: a, B: b, C: T }), mc: MC.eqBound, say: `"${P0.w}" is a limit, not an exact amount: an inequality, not an equation.` },
  ];
  return choice(R, {
    id: `phraseIneq-${n}`, family: 'phraseIneq', prompt: `${text} Which inequality says this?`, board: '\\text{the inequality: }\\ ?',
    solution: [`Each part: rate times amount, ${nH(a)}${X} and ${nH(b)}${Yv}. Total: ${exprAB(a, b)}.`, `"${P0.w}" → ${opH(P0.op)}.`],
    picture: { tex: tex(fT(F)) },
  }, fH(F), `Yes: ${fH(F)}.`, ws, { sem: relKey(F) });
};

const psContext: Gen = (R, n) => {
  const sav = R() < 0.6;
  const X0 = sav ? int(R, 2, 6) : int(R, 2, 5), Y0 = sav ? pick(R, [150, 200, 240, 300]) : pick(R, [12, 15, 18, 20]), r = sav ? pick(R, [15, 20, 25, 30]) : pick(R, [2, 3, 4]);
  const atLeast = R() < 0.6, op: Op = atLeast ? '>=' : '<=';
  const F: Form = { f: 'ps', m: q(r), x1: X0, y1: Y0, op };
  const text = sav
    ? `A savings plan: $${Y0} by week ${X0}, then $${r} more each week. Let ${X} = the week and ${Yv} = the dollars saved. Which inequality says the savings are ${atLeast ? 'at least' : 'at most'} the plan?`
    : `A plant should be ${Y0} cm tall on day ${X0} and grow ${r} cm a day after that. Let ${X} = the day and ${Yv} = the height in cm. Which inequality says the height is ${atLeast ? 'at least' : 'at most'} the plan?`;
  const ws: Opt[] = [
    { t: fH({ ...F, x1: Y0, y1: X0 }), sem: relKey({ ...F, x1: Y0, y1: X0 }), mc: MC.order, say: `The point is (week, dollars) = ${P(X0, Y0)}: ${X0} goes with ${X}.`.replace('week, dollars', sav ? 'week, dollars' : 'day, cm') },
    { t: fH({ ...F, x1: -X0, y1: -Y0 }), sem: relKey({ ...F, x1: -X0, y1: -Y0 }), mc: MC.zeroSign, say: `Point-slope form SUBTRACTS the point: ${Yv} − ${Y0} and ${X} − ${X0}.` },
    { t: fH(withOp(F, flip(op))), sem: relKey(withOp(F, flip(op))), mc: MC.phraseRev, say: `"${atLeast ? 'at least' : 'at most'}" means ${atLeast ? '≥' : '≤'}.` },
  ];
  return choice(R, {
    id: `psContext-${n}`, family: 'psContext', prompt: text, board: `${sav ? `\\$${Y0}\\ \\text{by week}\\ ${X0},\\ +\\$${r}\\text{/week}` : `${Y0}\\text{ cm on day }${X0},\\ +${r}\\text{ cm/day}`}`,
    solution: [`The plan's line passes through ${P(X0, Y0)} with slope ${r} per ${sav ? 'week' : 'day'}: ${eqH(F)}.`, `"${atLeast ? 'at least' : 'at most'}" → ${atLeast ? '≥' : '≤'}.`],
    picture: { tex: tex(fT(F)) },
  }, fH(F), `Yes: ${fH(F)}.`, ws, { sem: relKey(F) });
};

const TICKETS: readonly [number, number, number][] = [[12, 8, 96], [15, 10, 120], [10, 6, 60], [12, 6, 72], [9, 6, 54], [14, 7, 84]];
const wholeOnly: Gen = (R, n) => {
  for (;;) {
    const [a, b, c] = pick(R, TICKETS);
    const place = pick(R, ['the zoo', 'a museum', 'a concert', 'the aquarium', 'a ball game', 'a science center']);
    const F: Form = { f: 'std', A: a, B: b, C: c, op: '<=' };
    const X0 = c / a, Y0 = c / b;
    const x1 = int(R, 0, Math.floor(X0)), y1 = int(R, 0, Math.floor((c - a * x1) / b));
    if (y1 < 0 || x1 + y1 < 2) continue;
    const xf = int(R, 1, Math.floor(X0) - 1), yf = Math.floor((c - a * xf) / b) - 1 + 0.5;
    const xo = int(R, 1, Math.floor(X0)), yo = Math.floor((c - a * xo) / b) + int(R, 1, 2);
    const yn = int(R, 1, Math.floor(Y0) - 1);
    if (yf <= 0 || holds(F, xo, yo)) continue;
    const ws: Opt[] = [
      { t: P(xf, yf), mc: MC.fracCount, say: `${nH(yf)} child tickets? Tickets come in whole numbers.` },
      { t: P(-1, yn), say: 'You cannot buy −1 tickets: counts are not negative.' },
      { t: P(xo, yo), say: `${nH(a)}(${xo}) + ${nH(b)}(${yo}) = ${nH(a * xo + b * yo)}: over $${c}.` },
    ];
    const dots: GItem[] = [];
    for (let i = 0; i <= Math.floor(X0); i++) for (let j = 0; j <= Math.floor(Y0); j++) if (a * i + b * j <= c) dots.push(dot(`d${i}_${j}`, i, j, 'link'));
    return choice(R, {
      id: `wholeOnly-${n}`, family: 'wholeOnly', prompt: `At ${place}, adult tickets cost $${a} and child tickets cost $${b}. A group can spend at most $${c}. Let ${X} = adult tickets and ${Yv} = child tickets. Which (${X}, ${Yv}) is a possible purchase?`, board: fT(F),
      solution: [`Possible means: whole numbers, not negative, and ${fH(F)}.`, `${P(x1, y1)}: ${nH(a)}(${x1}) + ${nH(b)}(${y1}) = ${nH(a * x1 + b * y1)} ≤ ${c}, whole and not negative.`],
      picture: pic({ x: { min: -2, max: Math.floor(X0) + 2, step: 1, name: 'adult' }, y: { min: -2, max: Math.floor(Y0) + 2, step: 1, name: 'child' }, equal: false, items: [sh('sh', [F, QX, QY], 'link', 0.18), bl('bd', F), ...dots], show: ['bd', 'sh'], solve: dots.map(d => d.key) }),
    }, P(x1, y1), 'Yes: whole numbers, none negative, inside the budget.', ws);
  }
};

const BOTTLES: readonly [number, number][] = [[1, 2], [1, 3], [2, 3], [1, 4], [2, 5]];
const countBoundary: Gen = (R, n) => {
  for (;;) {
    const [a, b] = pick(R, BOTTLES), T = int(R, 6, 14);
    const sols: [number, number][] = [];
    for (let x = 0; a * x <= T; x++) if ((T - a * x) % b === 0) sols.push([x, (T - a * x) / b]);
    if (sols.length < 2 || T / a > 14) continue;
    const L: Form = { f: 'std', A: a, B: b, C: T, op: '<=' };
    const dots = sols.map((p, i) => dot(`d${i}`, p[0], p[1], 'link'));
    return numItem({
      id: `countBoundary-${n}`, family: 'countBoundary', prompt: `Juice comes in ${a}-cup and ${b}-cup bottles. You want exactly ${T} cups, using ${X} small bottles and ${Yv} large ones (whole numbers, 0 allowed). How many pairs (${X}, ${Yv}) make ${stdH({ A: a, B: b, C: T })} true?`, board: stdT({ A: a, B: b, C: T }), unit: 'pairs',
      solution: [`Try ${X} = 0, 1, 2, … and keep the ones where ${Yv} comes out whole: ${sols.map(p => P(p[0], p[1])).join(', ')}.`, `That is ${ans(sols.length)} pairs.`],
      picture: pic({ x: { min: 0, max: Math.ceil(T / a) + 1, step: 1, name: 'small' }, y: { min: 0, max: Math.ceil(T / b) + 1, step: 1, name: 'large' }, equal: false, items: [bl('bd', L, { dash: false }), ...dots], show: ['bd'], solve: dots.map(d => d.key) }),
    }, sols.length, `Yes: ${sols.map(p => P(p[0], p[1])).join(', ')}.`, [{ v: sols.length - 1, say: 'Did you count the pair with 0 small bottles?' }], `List them: ${X} = 0, 1, 2, … and keep the whole ${Yv}'s.`);
  }
};

// =====================================================================================================================
// feasible-vertices, linear-programming
// =====================================================================================================================
const COEF2: readonly [number, number][] = [[1, 1], [2, 1], [1, 2], [3, 1], [1, 3], [3, 2], [2, 3]];
const vertexPair: Gen = (R, n) => {
  for (;;) {
    const p = int(R, 1, 5) + (R() < 0.25 ? 0.5 : 0), qv = int(R, 1, 5);
    const [a1, b1] = pick(R, COEF2), [a2, b2] = pick(R, COEF2);
    if (a1 * b2 - a2 * b1 === 0 || near(p, qv)) continue;
    const c1 = a1 * p + b1 * qv, c2 = a2 * p + b2 * qv;
    if (!Number.isInteger(c1) || !Number.isInteger(c2)) continue;
    const L1: Form = { f: 'std', A: a1, B: b1, C: c1, op: '<=' }, L2: Form = { f: 'std', A: a2, B: b2, C: c2, op: '<=' };
    const hi = Math.ceil(Math.max(c1 / a1, c1 / b1, c2 / a2, c2 / b2));
    if (hi > 14) continue;
    const det = a1 * b2 - a2 * b1, nx = c1 * b2 - c2 * b1;
    return pairItem({
      id: `vertexPair-${n}`, family: 'vertexPair', prompt: `The feasible region of ${X} ≥ 0, ${Yv} ≥ 0, ${fH(L1)} and ${fH(L2)} has a vertex where ${stdH(L1 as never)} and ${stdH(L2 as never)} meet. Find it.`, board: stdT({ A: a1, B: b1, C: c1 }),
      solution: [`Multiply ${stdH({ A: a1, B: b1, C: c1 })} by ${b2} and ${stdH({ A: a2, B: b2, C: c2 })} by ${b1}, then subtract: the ${Yv}-terms cancel.`, `${nH(det)}${X} = ${nH(nx)}, so ${X} = ${ans(nH(p))}.`, `Put it in: ${cx(b1, Yv)} = ${nH(c1)} − ${nH(a1 * p)} = ${nH(c1 - a1 * p)}, so ${Yv} = ${ans(nH(qv))}.`],
      picture: pic({ x: { min: 0, max: hi + 1, step: 1, name: 'x' }, y: { min: 0, max: hi + 1, step: 1, name: 'y' }, items: [sh('sh', [L1, L2, QX, QY]), bl('b1', L1, { col: 'first' }), bl('b2', L2, { col: 'second' }), dot('V', p, qv, 'pick'), dot('Vn', p, qv, 'link', P(p, qv))], show: ['sh', 'b1', 'b2', 'V'], solve: ['Vn'] }, { bd: [stdT({ A: a2, B: b2, C: c2 })] }),
    }, p, qv, PTIO, `Yes: ${P(p, qv)}, on both lines.`, [{ x: qv, y: p, mc: MC.order, say: `Swapped: ${X} = ${nH(p)}, ${Yv} = ${nH(qv)}.` }], `Solve the two equations together (elimination or substitution), then check the point in both.`);
  }
};

const notVertex: Gen = (R, n) => {
  for (;;) {
    const p = int(R, 1, 4), qv = int(R, 1, 4);
    const [a1, b1] = pick(R, COEF2), [a2, b2] = pick(R, COEF2);
    if (a1 * b2 - a2 * b1 === 0) continue;
    const L1: Form = { f: 'std', A: a1, B: b1, C: a1 * p + b1 * qv, op: '<=' }, L2: Form = { f: 'std', A: a2, B: b2, C: a2 * p + b2 * qv, op: '<=' };
    const cand: { pt: [number, number]; lines: [Form, Form] }[] = [
      { pt: [p, qv], lines: [L1, L2] },
      { pt: [0, L1.f === 'std' ? L1.C / b1 : 0], lines: [L1, QX] }, { pt: [0, (L2 as { C: number }).C / b2], lines: [L2, QX] },
      { pt: [(L1 as { C: number }).C / a1, 0], lines: [L1, QY] }, { pt: [(L2 as { C: number }).C / a2, 0], lines: [L2, QY] },
    ];
    const c = pick(R, cand);
    if (c.pt.some(v => Math.abs(v * 2 - Math.round(v * 2)) > 1e-9)) continue;
    const cons = [QX, QY, L1, L2];
    const broken = cons.find(F => !holds(F, c.pt[0], c.pt[1]));
    const isV = !broken;
    if (!isV && R() < 0.2) continue;
    const named = broken ?? (c.lines.includes(L1) ? L2 : L1);
    const opts: Opt[] = [
      { t: 'Yes: it lies on two boundary lines and meets every constraint', say: isV ? 'Yes.' : `It breaks ${fH(named)}: ${checkAt(named, c.pt[0], c.pt[1])}.` },
      { t: 'Yes: every point where two boundary lines cross is a vertex', mc: MC.everyCross, say: 'A crossing outside the region is not a vertex: it must meet every constraint too.' },
      { t: `No: it breaks ${fH(named)}`, say: isV ? `${checkAt(named, c.pt[0], c.pt[1])}: it meets it.` : 'Yes.' },
    ];
    const hi = Math.ceil(Math.max(L1.f === 'std' ? L1.C / Math.min(a1, b1) : 0, (L2 as { C: number }).C / Math.min(a2, b2)));
    if (hi > 14) continue;
    const eq = (F: Form) => (F === QX ? `${X} = 0` : F === QY ? `${Yv} = 0` : eqH(F));
    return fixedChoice({
      id: `notVertex-${n}`, family: 'notVertex', prompt: `Feasible region: ${X} ≥ 0, ${Yv} ≥ 0, ${fH(L1)}, ${fH(L2)}. The lines ${eq(c.lines[0])} and ${eq(c.lines[1])} cross at ${P(c.pt[0], c.pt[1])}. Is it a vertex of the region?`, board: fT(L1),
      solution: [`A vertex is a crossing of two boundary lines that ALSO meets every constraint.`, `Check ${fH(named)} at ${P(c.pt[0], c.pt[1])}: ${checkAt(named, c.pt[0], c.pt[1])}.`],
      picture: pic({ x: { min: 0, max: hi + 1, step: 1, name: 'x' }, y: { min: 0, max: hi + 1, step: 1, name: 'y' }, items: [sh('sh', cons), bl('b1', L1, { col: 'first' }), bl('b2', L2, { col: 'second' }), dot('Q', c.pt[0], c.pt[1], 'pick', P(c.pt[0], c.pt[1])), dot('Qv', c.pt[0], c.pt[1], isV ? 'link' : 'wrong')], show: ['sh', 'b1', 'b2', 'Q'], solve: ['Qv'] }, { bd: [fT(L2)] }),
    }, opts, isV ? 0 : 2);
  }
};

const lpBest: Gen = (R, n) => {
  for (;;) {
    const p = int(R, 2, 6), qv = int(R, 2, 6);
    const [a, b] = pick(R, [[2, 1], [1, 2], [3, 1], [1, 3]] as const);
    const S = p + qv, D = a * p + b * qv;
    const xc = Math.min(S, D / a), yc = Math.min(S, D / b);
    if (!Number.isInteger(xc) || !Number.isInteger(yc)) continue;
    const corners: [number, number][] = [[xc, 0], [p, qv], [0, yc]];
    const c1 = int(R, 2, 8), c2 = int(R, 2, 8);
    const val = (pt: [number, number]) => c1 * pt[0] + c2 * pt[1];
    const vals = corners.map(val), best = Math.max(...vals);
    if (vals.filter(v => v === best).length !== 1) continue;
    const bi = vals.indexOf(best);
    const dist = corners.map(pt => Math.hypot(pt[0], pt[1])), far = dist.indexOf(Math.max(...dist));
    if (far === bi || dist.filter(d => near(d, dist[far]!)).length > 1) continue;
    const ins: [number, number] = [Math.round((xc + p) / 3), Math.round((qv + yc) / 3)];
    if (ins[0] < 1 || ins[1] < 1 || !(ins[0] + ins[1] < S && a * ins[0] + b * ins[1] < D)) continue;
    const L1: Form = { f: 'std', A: 1, B: 1, C: S, op: '<=' }, L2: Form = { f: 'std', A: a, B: b, C: D, op: '<=' };
    const ws: Opt[] = corners.map((c, i) => ({ c, i })).filter(o => o.i !== bi).map(o => ({ t: P(o.c[0], o.c[1]), mc: o.i === far ? MC.lpFar : undefined, say: `P = ${c1}(${o.c[0]}) + ${c2}(${o.c[1]}) = ${val(o.c)}, less than ${best}.${o.i === far ? ' Farthest from (0, 0) is not the same as most profit.' : ''}` }));
    ws.push({ t: P(ins[0], ins[1]), mc: MC.lpInside, say: `Inside the region you can always move toward an edge and gain: P = ${val(ins)}. The best is at a corner.` });
    const hi = Math.max(xc, yc) + 1;
    return choice(R, {
      id: `lpBest-${n}`, family: 'lpBest', prompt: `A bakery makes ${X} trays of muffins and ${Yv} trays of bagels a day. The oven fits ${fH(L1)}, the dough allows ${fH(L2)}, and ${X}, ${Yv} ≥ 0. Profit: P = ${c1}${X} + ${c2}${Yv} dollars. Which plan gives the most profit?`, board: `P = ${c1}x + ${c2}y`,
      solution: [`The corners: (0, 0), ${corners.map(c => P(c[0], c[1])).join(', ')}.`, `P there: 0, ${vals.join(', ')}. The most is ${best}, at ${P(corners[bi]![0], corners[bi]![1])}.`],
      picture: pic({ x: { min: 0, max: hi, step: 1, name: 'muffins' }, y: { min: 0, max: hi, step: 1, name: 'bagels' }, items: [sh('sh', [L1, L2, QX, QY]), bl('b1', L1, { col: 'first' }), bl('b2', L2, { col: 'second' }), ...corners.map((c, i) => dot(`k${i}`, c[0], c[1], 'pick')), dot('in', ins[0], ins[1], 'pick'), dot('best', corners[bi]![0], corners[bi]![1], 'link', `P = ${best}`)], show: ['sh', 'b1', 'b2', 'k0', 'k1', 'k2', 'in'], solve: ['best'] }, { bd: [fT(L1), fT(L2)] }),
    }, P(corners[bi]![0], corners[bi]![1]), `Yes: P = ${best} there, the most of all corners.`, ws);
  }
};

const LPS = ['The maximum is at exactly one corner', 'Every point along one edge gives the same maximum', 'There is no maximum: P keeps growing in the region', 'There is no solution: no point meets every constraint'];
const lpSpecial: Gen = (R, n) => {
  for (;;) {
    const t = pick(R, ['unique', 'edge', 'unbounded', 'empty'] as const);
    const [a, b] = pick(R, COEF2);
    const c = a * b * int(R, 1, 3);
    if (c / a > 8 || c / b > 8) continue;
    let cons: Form[], Pc: [number, number], res: number;
    if (t === 'unique') { cons = [QX, QY, { f: 'std', A: a, B: b, C: c, op: '<=' }]; Pc = [int(R, 1, 6), int(R, 1, 6)]; if (Pc[0] * b === Pc[1] * a) continue; res = 0; }
    else if (t === 'edge') { const k = int(R, 1, 3); cons = [QX, QY, { f: 'std', A: a, B: b, C: c, op: '<=' }]; Pc = [k * a, k * b]; res = 1; }
    else if (t === 'unbounded') { cons = [QX, QY, { f: 'std', A: a, B: b, C: c, op: '>=' }]; Pc = [int(R, 1, 6), int(R, 1, 6)]; res = 2; }
    else { const s = int(R, 2, 3); cons = [QX, QY, { f: 'std', A: 1, B: 1, C: s, op: '<=' }, { f: 'std', A: 1, B: 1, C: s + int(R, 2, 3), op: '>=' }]; Pc = [int(R, 1, 6), int(R, 1, 6)]; res = 3; }
    const opts: Opt[] = LPS.map((t2, i) => ({ t: t2, say: i === res ? 'Yes.' : res === 2 ? 'The region has no far edge: moving right or up stays inside, and P keeps growing.' : res === 3 ? 'No point meets every constraint: there is nothing to maximize.' : res === 1 ? 'P is parallel to the slanted edge: the whole edge ties.' : 'One corner beats the others.' }));
    if (res === 2) opts[0]!.mc = MC.lpUnbounded;
    if (res === 3) opts[0]!.mc = undefined;
    const sol = res === 0 ? `P at the corners: (0, 0) gives 0, ${P(c / a, 0)} gives ${Pc[0] * c / a}, ${P(0, c / b)} gives ${Pc[1] * c / b}: one corner wins.`
      : res === 1 ? `P = ${Pc[0]}${X} + ${Pc[1]}${Yv} is ${Pc[0] / a} times ${exprAB(a, b)}, which is at most ${c}: every point of that edge gives P = ${Pc[0] / a * c}.`
        : res === 2 ? `The region goes on forever up and to the right, and P grows there. There is a minimum, but no maximum.`
          : 'The constraints ask for x + y to be small and big at once: no point meets them all.';
    return fixedChoice({
      id: `lpSpecial-${n}`, family: 'lpSpecial', prompt: `Maximize P = ${Pc[0]}${X} + ${Pc[1]}${Yv} over ${cons.map(fH).join(', ')}. Which is true?`, board: `P = ${Pc[0]}x + ${Pc[1]}y`,
      solution: ['Look at the region first: is it empty, bounded, or open on one side?', sol],
      picture: pic({ x: { min: -1, max: 9, step: 1, name: 'x' }, y: { min: -1, max: 9, step: 1, name: 'y' }, items: [sh('sh', cons), ...cons.map((F, i) => bl(`b${i}`, F, { col: i < 2 ? 'dim' : i === 2 ? 'first' : 'second' }))], show: ['sh', ...cons.map((_, i) => `b${i}`)], solve: [] }, { bd: cons.slice(2).map(fT) }),
    }, opts, res);
  }
};

export const GENERATORS: Record<FamilyId, Gen> = {
  readPoint, evalExpr, compareTF, isSolution, whichSolution, hvMember, hvGraph, regionShape, farPoint, boundaryOf, inclusionPair, lineStyle,
  intercepts, throughOrigin, matchBoundary, wrongStyle, testPointSide, siGraph, writeGraph, axisSide, stdSide, isolateY, bZero, psRead, psToSI,
  sysPoint, sysRegion, sysCorner, specialKind, multiPoint, addConstraint, whyIncluded, oneTestWhy, vertCompare, writeTable, critique,
  critiqueSystem, viablePlan, phraseIneq, psContext, wholeOnly, countBoundary, vertexPair, notVertex, lpBest, lpSpecial,
};
