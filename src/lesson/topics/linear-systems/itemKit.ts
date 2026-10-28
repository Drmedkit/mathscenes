// itemKit.ts: the shared building blocks of the "Systems of equations" families (famA/famB/famC.ts): misconception
// ids, the choice / number / pair item makers, and the system picture. EVERY choice list goes through `choice` or
// `fixedChoice`: an option whose meaning (`sem`: the same line, the same solution set, the same value, the same point)
// equals the answer's is dropped, so a distractor can never be secretly right; `fixedChoice` checks the same with
// the `sem` of each option. Pure: no DOM, no canvas.
import { type Item, type Response, type Verdict, shuffle } from '../../runtime/item';
import { endOnChoice } from '../../runtime/explain';
import type { Paint } from '../../../core/theme';
import { type Eq, type Form, eqOf, fH, fT, lineKey, nH, solve } from './sysMaths';
import { type GItem, type GPic, type Pic, winAround } from './sysPic';

export type FamilyId =
  | 'pairCheck' | 'whichPair' | 'readCross' | 'markedPoint' | 'ctxMeaning' | 'ctxRead' | 'siMatch' | 'stdIntercepts' | 'stdSlope'
  | 'hvWhich' | 'hvCross' | 'hvSlope' | 'toSI' | 'estimateExact' | 'roundedFails' | 'techExact' | 'techWindow'
  | 'subStep' | 'subSolve' | 'backSub' | 'fullSub' | 'isolate' | 'isoSubSolve' | 'whereSub' | 'replaceSum' | 'recover'
  | 'elimAdd' | 'elimSub' | 'scaleRow' | 'scaleSolve' | 'bothMult' | 'anyMultiple' | 'clearFrac' | 'ratSolve'
  | 'chooseMethod' | 'methodsAgree' | 'classifyGraph' | 'cannotTell' | 'termsCI' | 'predictSlopes' | 'contraMeaning'
  | 'contraSub' | 'identityMeaning' | 'identityMember' | 'scaledConst' | 'sameLineForms' | 'inspect' | 'proofDir'
  | 'proofReverse' | 'writeVerbal' | 'fromGraph' | 'fromTable' | 'writeSolve' | 'viable' | 'planMeaning';

export interface SItem extends Item { family: FamilyId; picture?: Pic; slips?: Response[] }
export type SGen = (R: () => number, n: number, sg?: string) => SItem;

// ---------- misconception ids (all in math-curriculum-essentials/misconceptions.json) ----------
export const MC = {
  oneCond: 'mc.systems.one-condition-enough',
  unpaired: 'mc.systems.reports-unpaired-coordinate-values',
  stops: 'mc.systems.stops-before-all-variables',
  intercept: 'mc.systems.one-graph-intercept-as-system-solution',
  picture: 'mc.functions-concept.graph-as-picture',
  swapIO: 'mc.functions-concept.swaps-input-output-positions',
  fixedX: 'mc.coordinate-geometry.fixed-x-read-as-horizontal',
  stdSlopeA: 'mc.linear-functions.standard-form-slope-is-a',
  hvSwap: 'mc.linear-functions.vertical-horizontal-line-swap',
  zeroK: 'mc.calculus.zero-over-k-vs-k-over-zero',
  divSign: 'mc.integers.divide-by-coefficient-without-sign',
  divOne: 'mc.expressions.divides-only-one-term-of-numerator',
  approx: 'mc.quadratic-polynomial.approximation-as-exact',
  sketch: 'mc.systems.decides-from-sketch',
  grouping: 'mc.properties.ignores-grouping-symbols',
  order: 'mc.coordinate-geometry.reverses-coordinate-order',
  moveSign: 'mc.linear-equations.moves-term-without-sign-change',
  divSel: 'mc.expressions.divides-a-selected-numerator-term-only',
  needSolved: 'mc.systems.substitution-needs-solved-form',
  backSource: 'mc.systems.back-substitutes-into-source',
  keepsOnly: 'mc.systems.keeps-only-combined-equation',
  newSol: 'mc.linear-equations.transformed-equation-new-solution',
  negSub: 'mc.integers.subtract-negative-as-positive',
  oneSide: 'mc.linear-equations.one-side-only',
  someTerms: 'mc.linear-equations.scales-only-some-terms',
  lcmOnly: 'mc.linear-equations.only-one-multiplier-clears',
  mismatch: 'mc.systems.multipliers-dont-match',
  fracApprox: 'mc.systems.fractional-coefficients-approximate',
  habit: 'mc.estimation.method-not-chosen-from-numbers',
  byEye: 'mc.shapes.judges-parallel-perpendicular-by-eye',
  coincOne: 'mc.systems.coincident-lines-one-solution',
  equalDistinct: 'mc.linear-functions.equal-slopes-always-distinct',
  contraValue: 'mc.linear-equations.contradiction-constant-as-variable-value',
  noSolError: 'mc.linear-equations.no-solution-means-error',
  cancelInf: 'mc.linear-equations.cancellation-always-infinitely-many',
  zeroNo: 'mc.linear-equations.zero-vs-no-solution',
  everyPoint: 'mc.systems.infinite-means-every-point',
  unscaled: 'mc.systems.parallel-test-compares-unscaled-constants',
  manyCross: 'mc.systems.infinite-means-many-crossings',
  uniqueEq: 'mc.functions-concept.unique-equation-for-graph',
  negMult: 'mc.systems.misses-negative-multiple',
  oneDir: 'mc.geometric-proof.iff-one-direction-only',
  revMult: 'mc.expressions.reverses-multiplicative-comparison',
  label: 'mc.expressions.letter-as-object-label',
  oneLetter: 'mc.expressions.one-letter-for-two-quantities',
  firstRows: 'mc.functions-concept.initial-rows-only-model-check',
  domainAll: 'mc.functions-concept.context-domain-all-reals',
  rounds: 'mc.linear-equations.rounds-non-integer-exact-solution',
  izSwap: 'mc.linear-functions.intercept-zero-swap',
  addsEqual: 'mc.systems.adds-when-coefficients-equal',
  methodsDiffer: 'mc.systems.methods-give-different-answers',
  swapRates: 'mc.expressions.swaps-rates-between-variables',
  partialDist: 'mc.properties.partial-distribution',
} as const;

// ---------- item makers ----------
export interface Base { id: string; family: FamilyId; prompt: string; board: string; solution: string[]; picture?: Pic; unit?: string }
/** sem = what the option MEANS (a line key, a solution-set key, a value, a point): an option meaning the same as the
 *  answer is dropped */
export interface Opt { t: string; mc?: string; say: string; sem?: string }
export const near = (a: number, b: number) => Math.abs(a - b) < 1e-6;

/** a choice item: the right option and the slips; a slip with the same text or the same `sem` as the answer (or as an
 *  earlier slip) is dropped; shuffled unless `fixed` */
export function choice(R: () => number, b: Base, right: string, okSay: string, wrongs: Opt[], o: { max?: number; fixed?: boolean; sem?: string } = {}): SItem {
  const max = o.max ?? 4;
  const seenT = new Set([right]), seenS = new Set(o.sem ? [o.sem] : []), ws: Opt[] = [];
  for (const w of wrongs) {
    if (seenT.has(w.t) || (w.sem && seenS.has(w.sem)) || ws.length >= max - 1) continue;
    seenT.add(w.t); if (w.sem) seenS.add(w.sem); ws.push(w);
  }
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
/** fixed options in a fixed order (a scale of answers: one / none / infinitely many); `right` is the index. An option
 *  with the same `sem` as the right one is dropped. */
export function fixedChoice(b: Base, opts: Opt[], right: number): SItem {
  const rs = opts[right]!.sem;
  const keep = opts.filter((o, j) => j === right || !(rs && o.sem === rs));
  const ri = keep.indexOf(opts[right]!);
  return {
    ...b, input: 'choice', choices: keep.map(x => x.t), answer: { kind: 'choice', i: ri }, solution: endOnChoice(b.solution, keep[ri]!.t),
    check(r: Response): Verdict {
      if (r.kind !== 'choice' || !keep[r.i]) return { ok: false, say: 'Pick one of the options.' };
      if (r.i === ri) return { ok: true, say: keep[ri]!.say };
      return { ok: false, mc: keep[r.i]!.mc, say: keep[r.i]!.say };
    },
  };
}
export interface NumSlip { v: number; mc?: string; say: string }
export function numItem(b: Base, v: number, okSay: string, slips: NumSlip[], other: string): SItem {
  const sl = slips.filter(s => !near(s.v, v));
  return {
    ...b, input: 'num', answer: { kind: 'num', v }, slips: sl.map(s => ({ kind: 'num', v: s.v }) as Response),
    check(r: Response): Verdict {
      if (r.kind !== 'num' || !Number.isFinite(r.v)) return { ok: false, say: 'Type a number.' };
      if (near(r.v, v)) return { ok: true, say: okSay };
      const s = sl.find(s => near(r.v, s.v));
      return s ? { ok: false, mc: s.mc, say: s.say } : { ok: false, say: other };
    },
  };
}
export interface PairSlip { x: number; y: number; mc?: string; say: string }
export const PTIO = { lead: '(', op: ',', tail: ')' };
export function pairItem(b: Base, x: number, y: number, io: { lead: string; op: string; tail?: string }, okSay: string, slips: PairSlip[], other: string): SItem {
  const sl = slips.filter(s => !(near(s.x, x) && near(s.y, y)));
  return {
    ...b, input: 'pair', pairLead: io.lead, pairOp: io.op, pairTail: io.tail, answer: { kind: 'pair', x, y }, slips: sl.map(s => ({ kind: 'pair', x: s.x, y: s.y }) as Response),
    check(r: Response): Verdict {
      if (r.kind !== 'pair' || !Number.isFinite(r.x) || !Number.isFinite(r.y)) return { ok: false, say: 'Fill in both boxes.' };
      if (near(r.x, x) && near(r.y, y)) return { ok: true, say: okSay };
      const s = sl.find(s => near(r.x, s.x) && near(r.y, s.y));
      return s ? { ok: false, mc: s.mc, say: s.say } : { ok: false, say: other };
    },
  };
}
/** the reversed pair as a slip (none when x = y) */
export const revSlip = (x: number, y: number): PairSlip[] => (near(x, y) ? [] : [{ x: y, y: x, mc: MC.order, say: `Swapped: the first number is ${'<i>x</i>'}, the second is ${'<i>y</i>'}.` }]);

// ---------- meaning keys ----------
export const semLine = (F: Form | Eq) => lineKey('f' in F ? eqOf(F) : F);
export const semSys = (E1: Eq, E2: Eq) => {
  const S = solve(E1, E2);
  return S.k === 'one' ? `S P ${S.x.p}/${S.x.q} ${S.y.p}/${S.y.q}` : S.k === 'none' ? 'S none' : `S ${lineKey(S.L)}`;
};
export const semPt = (x: number, y: number) => `P ${Math.round(x * 1e6)} ${Math.round(y * 1e6)}`;
export const semV = (v: number) => `V ${Math.round(v * 1e6)}`;

// ---------- pictures ----------
export const line = (key: string, E: Eq, col?: Paint, o: { dash?: boolean; name?: string; w?: number } = {}): GItem => ({ kind: 'line', key, E, col, ...o });
export const dot = (key: string, x: number, y: number, col: Paint = 'pick', name?: string, open?: boolean): GItem => ({ kind: 'point', key, x, y, col, name, open });
export const text = (key: string, x: number, y: number, t: string, col: Paint = 'ink', align: 'left' | 'center' | 'right' = 'center'): GItem => ({ kind: 'text', key, x, y, text: t, col, align });
/** a system on the plane: line 1 amber, line 2 teal (dashed when it is the same line), the window around the points
 *  that matter */
/** the points a window must hold so both lines show: the solution, else each line's point nearest the origin */
export function keyPts(E1: Eq, E2: Eq): [number, number][] {
  const S = solve(E1, E2);
  if (S.k === 'one') return [[S.x.p / S.x.q, S.y.p / S.y.q]];
  const near0 = (E: Eq): [number, number] => { const d = E.a * E.a + E.b * E.b; return [E.a * E.c / d, E.b * E.c / d]; };
  return [near0(E1), near0(E2)];
}
export function sysG(E1: Eq, E2: Eq, pts: readonly (readonly [number, number])[], show: string[], solve: string[], extra: GItem[] = [], win?: Pick<GPic, 'x' | 'y' | 'equal'>): GPic {
  const same = lineKey(E1) === lineKey(E2);
  return { ...(win ?? winAround([...pts, ...keyPts(E1, E2)])), items: [line('L1', E1, 'first'), line('L2', E2, 'second', { dash: same, w: same ? 6 : 5 }), ...extra], show, solve };
}
/** the board of a system: equation 1 (amber) on the board line, equation 2 (teal) under it */
export const sysBoard = (F1: Form, F2: Form, more: string[] = [], L?: Parameters<typeof fT>[1]): { board: string; bd: string[]; cols: (Paint | undefined)[] } =>
  ({ board: fT(F1, L), bd: [fT(F2, L), ...more], cols: ['first', 'second'] });
export const sysH = (F1: Form, F2: Form, L?: Parameters<typeof fH>[1]) => `${fH(F1, L)} and ${fH(F2, L)}`;
export { nH };
export const NAMES = ['Ana', 'Ben', 'Chloe', 'Diego', 'Eli', 'Fatima', 'Grace', 'Hugo', 'Isla', 'Jamal', 'Kenji', 'Lena', 'Marco', 'Nora', 'Owen', 'Priya', 'Quinn', 'Rosa', 'Sam', 'Tariq'];
export const LETTERS = ['A', 'B', 'C', 'D'];
