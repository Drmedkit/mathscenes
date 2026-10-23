// items.ts: exercise families for "rational and irrational numbers" (grade 8, 8.NS.A.1-2), generated from templates,
// checked exactly (realMaths, BigInt), and every wrong answer the classifier recognises tagged with its misconception
// id from math-curriculum-essentials/misconceptions.json (logged, never shown to the kid).
// A generator gets the SUB-GOAL it practises (plan.ts) and uses that sub-goal's number ranges from the topic JSON.
// Pure: no DOM, no canvas. Pictures are data (ZoomLine / DigitTape / RealSets / Calc params) the page draws.
import { type Gen as RtGen, type Item, type Response, type Verdict, A, B, S, fr, int, pick, rng, shuffle } from '../../runtime/item';
import type { ZoomParams, ZoomStep } from './ZoomLine';
import type { TapeParams, TapeStep } from './DigitTape';
import type { SetsParams, SetsStep, SetId } from './RealSets';
import { SET_NAME, innermost } from './RealSets';
import type { CalcParams, CalcStep } from './Calc';
import {
  type Real, type Rep, PI, cmpDec, cmpReal, decStr, digits, exactAt, fdiv, floorScaled, frac, fracToRep, gcd, isSquare, isqrt,
  parseDec, repDigits, repToFrac, repTex, roundTo, sqrt, fromTyped, decEq, approx, isRational, longDivision,
} from './realMaths';
import { type Num, Dc, Fr, I, Mx, PATTERNS, PIn, Pat, Pc, Rp, Sq, SqD, SqF, hNum, ov, rad, repDotsHtml, repHtml, MINUS } from './nums';
import { ans as mark, endOnChoice } from '../../runtime/explain';
export { rng };
export type { Response, Verdict };

export type FamilyId = 'asQuotient' | 'notRational' | 'remainders' | 'barNotation' | 'addressOf' | 'prefixWhere' | 'rOrI'
  | 'displayRead' | 'innermost' | 'setStatement' | 'whichRational' | 'rootFraction' | 'toFraction' | 'whichShift' | 'generalMethod'
  | 'bracket' | 'refine' | 'interpolate' | 'roundRoot' | 'settles' | 'locate' | 'compare' | 'order' | 'estimate' | 'exactOrNot'
  | 'maxError' | 'howClose' | 'boundExpr' | 'boundRound' | 'notEqual' | 'decide';
export const FAMILIES: readonly { id: FamilyId; name: string }[] = [
  { id: 'asQuotient', name: 'Write it as a quotient' },
  { id: 'notRational', name: 'Rational or not?' },
  { id: 'remainders', name: 'Remainders come back' },
  { id: 'barNotation', name: 'The repeat bar' },
  { id: 'addressOf', name: 'Decimal address' },
  { id: 'prefixWhere', name: 'What the digits pin down' },
  { id: 'rOrI', name: 'Rational or irrational?' },
  { id: 'displayRead', name: 'Reading a calculator' },
  { id: 'innermost', name: 'The smallest set' },
  { id: 'setStatement', name: 'True or false: sets' },
  { id: 'whichRational', name: 'Which root is rational?' },
  { id: 'rootFraction', name: 'Root of a fraction' },
  { id: 'toFraction', name: 'Repeating decimal to fraction' },
  { id: 'whichShift', name: 'Make the tails line up' },
  { id: 'generalMethod', name: 'Does it always work?' },
  { id: 'bracket', name: 'Between two whole numbers' },
  { id: 'refine', name: 'Zoom to tenths and hundredths' },
  { id: 'interpolate', name: 'Not evenly spread' },
  { id: 'roundRoot', name: 'Round it from the bounds' },
  { id: 'settles', name: 'Do the bounds settle it?' },
  { id: 'locate', name: 'Find it on the line' },
  { id: 'compare', name: 'Compare two numbers' },
  { id: 'order', name: 'Put them in order' },
  { id: 'estimate', name: 'Estimate an expression' },
  { id: 'exactOrNot', name: '= or ≈?' },
  { id: 'maxError', name: 'How big can the error be?' },
  { id: 'howClose', name: 'Is it that accurate?' },
  { id: 'boundExpr', name: 'Carry the bounds through' },
  { id: 'boundRound', name: 'Round from carried bounds' },
  { id: 'notEqual', name: 'Equal or not?' },
  { id: 'decide', name: 'Exact enough to decide' },
];
export const FAMILY_NAMES: Record<string, string> = Object.fromEntries(FAMILIES.map(f => [f.id, f.name]));

export const MC = {
  fracDisplay: 'mc.fractions-concept.rational-membership-by-fraction-display',
  notNested: 'mc.exponents-roots.number-sets-not-nested',
  negSize: 'mc.integers.negative-fraction-different-size',
  barBlock: 'mc.decimals.repeat-block-notation',
  remNoRepeat: 'mc.decimals.remainders-decide-repeat',
  discrete: 'mc.decimals.decimals-are-discrete',
  prefix: 'mc.decimals.prefix-digits-do-not-constrain-location',
  noExact: 'mc.exponents-roots.irrational-has-no-exact-value',
  pattern: 'mc.exponents-roots.any-decimal-pattern-implies-rational',
  repIrr: 'mc.exponents-roots.repeating-decimal-called-irrational',
  truncFull: 'mc.decimals.truncation-taken-as-full-decimal',
  fullDisplay: 'mc.decimals.full-calculator-display-implies-irrationality',
  radical: 'mc.exponents-roots.radical-sign-means-irrational',
  pi314: 'mc.circles.pi-is-exactly-3-14',
  approxInherits: 'mc.exponents-roots.approximation-inherits-irrationality',
  byNotation: 'mc.exponents-roots.number-set-membership-by-notation',
  misplaced: 'mc.exponents-roots.irrationals-misplaced-in-set-diagram',
  zeroCounting: 'mc.exponents-roots.zero-counted-as-counting-number',
  plusMinus: 'mc.exponents-roots.principal-root-as-plus-minus',
  negRoot: 'mc.exponents-roots.square-root-of-negative-as-negative',
  rootFirst: 'mc.exponents-roots.root-before-radicand-operations',
  unreduced: 'mc.exponents-roots.tests-unreduced-fraction-for-squares',
  unaligned: 'mc.decimals.cancels-unaligned-repeating-tails',
  asApprox: 'mc.decimals.decimals-seen-as-approximations',
  wrongDen: 'mc.decimals.repeating-to-fraction-wrong-denominator',
  oneExample: 'mc.reasoning-language.general-derivation-seen-as-one-example',
  squaresAsBounds: 'mc.exponents-roots.squares-as-root-bounds',
  halving: 'mc.exponents-roots.root-as-dividing-by-index',
  negMagnitude: 'mc.integers.order-negatives-by-magnitude',
  closeTrial: 'mc.exponents-roots.accepts-close-trial-either-side',
  interp: 'mc.exponents-roots.root-by-linear-interpolation',
  truncates: 'mc.decimals.truncates-instead-of-rounding',
  notSettled: 'mc.estimation.interval-does-not-settle-claim',
  roundedExact: 'mc.estimation.rounded-value-treated-as-exact',
  equalRounded: 'mc.estimation.equal-after-rounding-means-equal',
  radicandVsDec: 'mc.exponents-roots.compares-radicand-with-decimal',
  roundedInputs: 'mc.estimation.rounded-inputs-give-correctly-rounded-output',
  addsRadicands: 'mc.exponents-roots.adds-radicands',
  coefInside: 'mc.exponents-roots.coefficient-moved-under-radical',
  allDecInexact: 'mc.decimals.all-decimal-notations-classified-as-inexact',
  calcCertifies: 'mc.estimation.calculator-output-certifies-accuracy',
  decLength: 'mc.estimation.decimal-length-guarantees-accuracy',
  roundUpOver: 'mc.estimation.rounding-up-always-overestimates',
  centers: 'mc.estimation.different-estimate-centers-prove-inequality',
  visualExact: 'mc.data-displays.visual-estimate-as-exact',
  earlyRound: 'mc.decimals.intermediate-precision-always-invalid',
  powerTimes: 'mc.exponents-roots.power-as-base-times-exponent',
} as const;

// ---------- pictures ----------
export interface ZoomPic { kind: 'zoom'; p: ZoomParams; show: ZoomStep[]; solve: ZoomStep[] }
export interface TapePic { kind: 'tape'; p: TapeParams; show: TapeStep[]; solve: TapeStep[] }
export interface SetsPic { kind: 'sets'; p: SetsParams; show: SetsStep[]; solve: SetsStep[] }
export interface CalcPic { kind: 'calc'; p: CalcParams; show: CalcStep[]; solve: CalcStep[] }
export type Pic = ZoomPic | TapePic | SetsPic | CalcPic;
export interface IrItem extends Item {
  family: FamilyId;
  pic?: Pic;
  /** the picture appears only with the worked solution */
  bareFirst?: boolean;
  /** TeX lines the solution replay writes on the board, in order */
  solveTex: string[];
}
type Gen = (R: () => number, n: number, sg?: string) => IrItem;

// ---------- shared bits ----------
interface Opt { t: string; ok: boolean; mc?: string; say: string }
function choice(R: () => number, base: Omit<IrItem, 'input' | 'choices' | 'answer' | 'check'>, opts: Opt[], keepOrder = false): IrItem {
  const o = keepOrder ? opts.slice() : shuffle(R, opts.slice());
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
const NAMES = ['Kai', 'Jordan', 'Ava', 'Leo', 'Maya', 'Sam', 'Riley', 'Noah', 'Zoe', 'Eli', 'Mia', 'Omar', 'Priya', 'Luis', 'Nora', 'Theo'];
const P10 = (L: number) => 10n ** BigInt(L);
/** a / 10^L as HTML */
const dh = (a: bigint, L: number, trim = false) => hNum(decStr(a, L, trim));
const dt = (a: bigint, L: number, trim = false) => decStr(a, L, trim);
const sqStr = (a: bigint, L: number) => decStr(a * a, 2 * L, true);
const nonSquare = (R: () => number, lo: number, hi: number): number => { for (;;) { const n = int(R, lo, hi); if (!isSquare(n)) return n; } };
const SQUARES = Array.from({ length: 16 }, (_, k) => k * k);
const PLACE = ['whole number', 'tenth', 'hundredth', 'thousandth'];
const ROUNDW = (L: number) => (L === 0 ? 'the nearest whole number' : `the nearest ${PLACE[L]}`);
const zoomPic = (p: ZoomParams, show: ZoomStep[], solve: ZoomStep[]): ZoomPic => ({ kind: 'zoom', p, show, solve });
/** the steps that show the first `upto` lines of a zoom (bands and squares included) */
function zoomSteps(levels: number, sq: boolean, upto: number): ZoomStep[] {
  const s: ZoomStep[] = ['axis', 'name'];
  for (let i = 0; i < Math.min(levels, upto); i++) { if (i) s.push(`zoom${i}` as ZoomStep); s.push(`band${i}` as ZoomStep); if (sq) s.push(`sq${i}` as ZoomStep); }
  return s;
}

// =====================================================================================================
// define-rational
// =====================================================================================================
const QUOT: { n: Num; ex: [number, number]; say: string }[] = [
  { n: Dc('-0.75'), ex: [-3, 4], say: '−0.75 is 75 hundredths to the left of 0: (−75)/100 = (−3)/4.' },
  { n: Dc('1.25'), ex: [5, 4], say: '1.25 = 125/100 = 5/4.' },
  { n: Dc('0.125'), ex: [1, 8], say: '0.125 = 125/1000 = 1/8.' },
  { n: Dc('3.6'), ex: [18, 5], say: '3.6 = 36/10 = 18/5.' },
  { n: Dc('-2.5'), ex: [-5, 2], say: '−2.5 = (−25)/10 = (−5)/2.' },
  { n: Dc('0.04'), ex: [1, 25], say: '0.04 = 4/100 = 1/25.' },
  { n: Dc('-0.6'), ex: [-3, 5], say: '−0.6 = (−6)/10 = (−3)/5.' },
  { n: Dc('2.75'), ex: [11, 4], say: '2.75 = 275/100 = 11/4.' },
  { n: Dc('-1.2'), ex: [-6, 5], say: '−1.2 = (−12)/10 = (−6)/5.' },
  { n: Mx(2, 3, 4), ex: [11, 4], say: '2 3/4 = 8/4 + 3/4 = 11/4.' },
  { n: Mx(1, 1, 2), ex: [3, 2], say: '1 1/2 = 2/2 + 1/2 = 3/2.' },
  { n: Mx(3, 2, 5), ex: [17, 5], say: '3 2/5 = 15/5 + 2/5 = 17/5.' },
  { n: Pc(125), ex: [5, 4], say: '125% = 125/100 = 5/4.' },
  { n: Pc(40), ex: [2, 5], say: '40% = 40/100 = 2/5.' },
  { n: Pc(8), ex: [2, 25], say: '8% = 8/100 = 2/25.' },
  { n: I(-3), ex: [-3, 1], say: '−3 = (−3)/1 (or (−6)/2).' },
  { n: I(0), ex: [0, 1], say: '0 = 0/1 (or 0/5): 0 divided by any nonzero integer is 0.' },
  { n: I(7), ex: [7, 1], say: '7 = 7/1 (or 14/2).' },
  { n: I(-12), ex: [-12, 1], say: '−12 = (−12)/1.' },
  { n: Dc('-0.05'), ex: [-1, 20], say: '−0.05 = (−5)/100 = (−1)/20.' },
];
const asQuotient: Gen = (R, n) => {
  const q = pick(R, QUOT), v = q.n.x as Extract<Real, { kind: 'frac' }>;
  const ints = Number.isInteger;
  return {
    id: `asQuotient-${n}`, family: 'asQuotient',
    prompt: pick(R, [`Write ${A(q.n.html)} as a quotient of two integers.`, `${A(q.n.html)} is rational. Show it: write it as integer ÷ integer.`, `Fill in two integers so that the fraction equals ${A(q.n.html)}.`]),
    board: `${q.n.tex} = \\dfrac{\\,?\\,}{\\,?\\,}`, input: 'pair', pairLead: `${q.n.html} =`, pairOp: '/', solveTex: [`${q.n.tex} = \\dfrac{${q.ex[0]}}{${q.ex[1]}}`],
    solution: [q.say, `So ${q.n.html} = ${mark(hNum(q.ex[0]))}/${mark(hNum(q.ex[1]))}: integer on top, nonzero integer below. That is what “rational” means.`],
    answer: { kind: 'pair', x: q.ex[0], y: q.ex[1] },
    check: r => {
      if (r.kind !== 'pair' || !Number.isFinite(r.x) || !Number.isFinite(r.y)) return { ok: false, say: 'Type two integers.' };
      if (r.y === 0) return { ok: false, say: 'The bottom can never be 0: dividing by 0 has no value. Use a nonzero integer.' };
      if (!ints(r.x) || !ints(r.y)) return { ok: false, say: `Both must be integers (no decimals). ${q.say}` };
      if (r.x * v.q === v.p * r.y) return { ok: true, say: `Yes: ${hNum(r.x)}/${hNum(r.y)} = ${q.n.html}. Any equal quotient of integers works.` };
      if (r.x * v.q === -v.p * r.y && v.p !== 0) return { ok: false, mc: v.p < 0 ? MC.negSize : undefined, say: `That has the wrong sign: it is the opposite of ${q.n.html}. ${q.say}` };
      return { ok: false, say: `${hNum(r.x)}/${hNum(r.y)} is not ${q.n.html}. ${q.say}` };
    },
  };
};

const NONFRAC: Num[] = [I(-3), I(0), I(5), Dc('0.125'), Dc('-0.75'), Pc(125), Pc(60), Mx(2, 1, 3), Dc('4.2'), I(-8), Dc('0.06')];
const notRational: Gen = (R, n) => {
  const v = int(R, 0, 2), who = pick(R, NAMES);
  if (v === 0) {
    const zero = int(R, 1, 9), others = shuffle(R, NONFRAC.slice()).slice(0, 3);
    return choice(R, {
      id: `notRational-${n}`, family: 'notRational', prompt: 'Which one is NOT a rational number?', board: '\\text{rational} = \\dfrac{\\text{integer}}{\\text{nonzero integer}}',
      solveTex: [`\\dfrac{${zero}}{0} \\ \\text{has no value}`],
      solution: [`${others.map(o => o.html).join(', ')} can all be written as integer/integer.`, `${fr(zero, 0)} divides by 0, which has no value, so it is not a number at all.`],
    }, [
      { t: fr(zero, 0), ok: true, say: `Right: ${fr(zero, 0)} divides by 0, so it is not a number. The others are all quotients of integers.` },
      ...others.map(o => ({ t: o.html, ok: false, mc: MC.fracDisplay, say: `${o.html} is rational even without a fraction bar: it can be WRITTEN as integer/integer. The one that is not: ${fr(zero, 0)} (division by 0).` })),
    ]);
  }
  if (v === 1) {
    const k = pick(R, [-3, -7, -12, 4, 9, 0]);
    return choice(R, {
      id: `notRational-${n}`, family: 'notRational', prompt: `${who} says: “${hNum(k)} is an integer, so it is not a rational number: it is not a fraction.” Is ${who} right?`,
      board: `${k}\\ \\ \\text{rational?}`, solveTex: [`${k} = \\dfrac{${k}}{1} = \\dfrac{${2 * k}}{2}`],
      solution: [`${hNum(k)} = ${hNum(k)}/1 = ${hNum(2 * k)}/2: a quotient of integers.`, 'So every integer is also a rational number: the integers sit INSIDE the rationals.'],
    }, [
      { t: `No: ${hNum(k)} = ${hNum(k)}/1, a quotient of integers, so it is rational too.`, ok: true, say: 'Right: being an integer and being rational are not either-or.' },
      { t: 'Yes: a rational number has to be written as a fraction.', ok: false, mc: MC.fracDisplay, say: `“Rational” is about the value, not how it is written: ${hNum(k)} CAN be written as ${hNum(k)}/1.` },
      { t: 'Yes: integers and rational numbers are different kinds of number.', ok: false, mc: MC.notNested, say: `The sets are nested: every integer is rational, since ${hNum(k)} = ${hNum(k)}/1.` },
    ]);
  }
  const [p, q] = pick(R, [[3, 4], [1, 4], [2, 5], [3, 5], [5, 8], [3, 8], [1, 5], [4, 5]] as [number, number][]);
  const right = `${MINUS}${decStr(BigInt(p * 10000 / q), 4, true)}`;
  const wrongV = `${MINUS}${decStr(BigInt((q - p) * 10000 / q), 4, true)}`;
  return choice(R, {
    id: `notRational-${n}`, family: 'notRational', prompt: `Where is (${MINUS}${p})/${q} on the number line?`,
    board: `\\dfrac{-${p}}{${q}} = \\,?`, solveTex: [`\\dfrac{-${p}}{${q}} = -\\dfrac{${p}}{${q}} = ${right.replace(MINUS, '-')}`],
    solution: [`Share ${MINUS}${p} into ${q} equal parts: each part is ${MINUS}${fr(p, q)}.`, `${fr(p, q)} = ${right.replace(MINUS, '')}, so (${MINUS}${p})/${q} = ${right}: the same distance from 0 as ${fr(p, q)}, on the other side.`],
  }, [
    { t: `At ${right}: ${fr(p, q)} to the left of 0`, ok: true, say: `Yes: (${MINUS}${p})/${q} is the opposite of ${fr(p, q)}.` },
    { t: `At ${wrongV}: ${MINUS}1 plus ${fr(p, q)}`, ok: false, mc: MC.negSize, say: `${MINUS}1 + ${fr(p, q)} = ${wrongV} is a different number. (${MINUS}${p})/${q} is the OPPOSITE of ${fr(p, q)}: ${right}, the same size, left of 0.` },
    { t: `At ${right.replace(MINUS, '')}: the sign does not change the place`, ok: false, say: `The minus sign puts it on the other side of 0: ${right}.` },
  ]);
};

// =====================================================================================================
// decimals-repeat
// =====================================================================================================
const LONGQ: [number, number][] = [[1, 7], [3, 7], [2, 7], [1, 3], [2, 11], [1, 6], [5, 6], [3, 8], [1, 8], [2, 3], [5, 12], [7, 11], [4, 9], [1, 12], [5, 7], [1, 13]];
const remainders: Gen = (R, n) => {
  const v = int(R, 0, 2);
  if (v === 0) {
    const q = pick(R, [3, 6, 7, 8, 9, 11, 12, 13, 17, 19, 23]);
    return {
      id: `remainders-${n}`, family: 'remainders',
      prompt: `In long division by ${B(q)}, every remainder is a whole number smaller than ${q}. If the division never ends, how many different nonzero remainders can there be, at most?`,
      board: `\\text{remainder} \\in \\{1, 2, {\\ldots}, ${q - 1}\\}`, input: 'num', unit: 'remainders', solveTex: [`${q - 1} \\text{ possible remainders}`, '\\text{one must come back}'],
      solution: [`A nonzero remainder can only be 1, 2, …, ${q - 1}: that is ${mark(q - 1)} values.`, `So within ${q} steps a remainder comes back, and from there the same digits repeat.`],
      answer: { kind: 'num', v: q - 1 },
      check: r => {
        const x = needNum(r);
        if (x === null) return { ok: false, say: 'Type a whole number.' };
        if (x === q - 1) return { ok: true, say: `Yes: only ${q - 1}. So a remainder must come back, and then the digits repeat.` };
        if (x === q) return { ok: false, say: `A remainder must be SMALLER than ${q}, and 0 would end the division: 1 to ${q - 1}, so ${q - 1}.` };
        return { ok: false, mc: x > q ? MC.remNoRepeat : undefined, say: `The remainders can only be 1, 2, …, ${q - 1}: ${q - 1} values. There is no room for more.` };
      },
    };
  }
  const [p, q] = pick(R, LONGQ.filter(([a, b]) => fracToRep(a, b).rep.length >= 1 && !fracToRep(a, b).terminates));
  const d = longDivision(p, q);
  const rs = d.steps.map(s => s.r);
  const back = d.steps[d.steps.length - 1]!.next;
  if (v === 1) return choice(R, {
    id: `remainders-${n}`, family: 'remainders',
    prompt: `Long division of ${p} ÷ ${q}: the remainders are ${rs.join(', ')}, and then ${B(back)} again. What happens to the digits from there?`,
    board: `${p} \\div ${q} = ${d.int}.${d.steps.map(s => s.digit).join('')}{\\ldots}`, solveTex: [`\\text{remainder } ${back} \\text{ again}`, `\\dfrac{${p}}{${q}} = ${repTex(fracToRep(p, q))}`],
    solution: [`The same remainder gives the same next digit and the same next remainder.`, `So the digits from there repeat forever: ${fr(p, q)} = ${repHtml(fracToRep(p, q))}.`],
  }, [
    { t: 'They repeat: the same remainder starts the same digits again, forever.', ok: true, say: `Right: ${fr(p, q)} = ${repHtml(fracToRep(p, q))}.` },
    { t: 'They could still go on forever without repeating.', ok: false, mc: MC.remNoRepeat, say: `Once ${back} comes back, every step after it is a step you have already done: the digits MUST repeat.` },
    { t: 'The division stops there.', ok: false, say: `It only stops at a remainder of 0. Remainder ${back} means you keep going, and the same digits come again.` },
  ]);
  return choice(R, {
    id: `remainders-${n}`, family: 'remainders',
    prompt: `Why does the decimal of ${fr(p, q)}, or of any fraction, end or repeat?`,
    board: `\\dfrac{${p}}{${q}} = ${repTex(fracToRep(p, q))}`, solveTex: [`\\text{remainders} < ${q}`, `\\text{one comes back} \\Rightarrow \\text{repeat}`],
    solution: [`Dividing by ${q}, each remainder is one of 0, 1, …, ${q - 1}.`, 'A remainder of 0 ends the decimal; otherwise one remainder comes back, and the digits repeat from there.'],
  }, [
    { t: `There are only ${q - 1} nonzero remainders when you divide by ${q}, so one comes back (or one is 0).`, ok: true, say: 'Right: a limited supply of remainders forces the repeat.' },
    { t: 'Some fractions have decimals that never repeat; you just have to check each one.', ok: false, mc: MC.remNoRepeat, say: `No fraction can do that: the remainders of ÷${q} run out after ${q - 1} steps.` },
    { t: 'Because the calculator shows the same digits again.', ok: false, mc: MC.truncFull, say: 'A screen shows only a few digits, so it proves nothing. The remainders are the reason.' },
  ]);
};

const BARQ: [number, number][] = [[1, 6], [5, 6], [1, 12], [7, 12], [1, 15], [1, 22], [7, 30], [1, 18], [5, 18], [11, 30], [1, 45], [7, 15], [2, 15], [13, 30], [1, 36], [5, 22], [7, 18], [4, 15], [17, 30], [1, 30]];
const barNotation: Gen = (R, n) => {
  const [p, q] = pick(R, BARQ), r = fracToRep(p, q);
  if (!(r.pre.length >= 1 && r.rep.length >= 1)) throw new Error(`${p}/${q} is not delayed`);
  const right = repHtml(r);
  const wrong1 = `${r.int}.${ov(r.pre + r.rep)}`;              // the bar over the prefix too
  const wrong2 = `${r.int}.${r.pre}${r.rep}`;                   // no bar: cut off
  const wrong3 = `${r.int}.${ov(r.pre)}${r.rep}`;               // the bar on the wrong digits
  const opts: Opt[] = [
    { t: right, ok: true, say: `Yes: only ${r.rep} repeats, so only ${r.rep} gets the bar.` },
    { t: wrong1, ok: false, mc: MC.barBlock, say: `That bar says ${r.pre + r.rep} repeats: ${repDotsHtml({ int: r.int, pre: '', rep: r.pre + r.rep }, 8)}. But only ${r.rep} repeats: ${right}.` },
    { t: wrong2, ok: false, mc: MC.truncFull, say: `${wrong2} stops there: it is a different, smaller number. The ${r.rep} goes on forever: ${right}.` },
  ];
  if (wrong3 !== right && wrong3 !== wrong1) opts.push({ t: wrong3, ok: false, mc: MC.barBlock, say: `The bar goes over the digits that repeat: ${r.rep}. So ${right}.` });
  return choice(R, {
    id: `barNotation-${n}`, family: 'barNotation', prompt: `${fr(p, q)} = ${repDotsHtml(r, 7)} Which is the same number written with a bar?`,
    board: `\\dfrac{${p}}{${q}} = ${r.int}.${repDigits(r, 7)}{\\ldots}`, solveTex: [`\\dfrac{${p}}{${q}} = ${repTex(r)}`],
    solution: [`The digits after the point: ${r.pre} once, then ${r.rep} again and again.`, `The bar covers only the repeating block: ${right}.`],
  }, opts);
};

// =====================================================================================================
// decimal-address
// =====================================================================================================
const ADDR: [number, number][] = [[2, 3], [1, 3], [1, 8], [5, 8], [3, 7], [4, 9], [5, 6], [7, 12], [3, 11], [5, 3], [7, 3], [3, 8], [2, 7], [5, 9], [1, 6], [11, 8], [4, 7], [7, 9], [8, 11], [13, 6]];
const addressOf: Gen = (R, n) => {
  const [p, q] = pick(R, ADDR), x = frac(p, q);
  let L = R() < 0.5 ? 1 : 2;
  if (exactAt(x, L)) L = 1;
  const lo = floorScaled(x, L);
  const name = `\\tfrac{${p}}{${q}}`;
  const show = zoomSteps(3, false, L), solve: ZoomStep[] = [`zoom${L}` as ZoomStep, `band${L}` as ZoomStep, 'dot'];
  return {
    id: `addressOf-${n}`, family: 'addressOf',
    prompt: `${fr(p, q)} = ${digits(x, 5)}… Between which two ${PLACE[L]}s is it?`,
    board: `\\square < ${name} < \\square`, input: 'pair', pairLead: '', pairOp: `&lt; ${fr(p, q)} &lt;`,
    pic: zoomPic({ x, name, levels: 3 }, show, solve),
    solveTex: [`${dt(lo, L)} < ${name} < ${dt(lo + 1n, L)}`],
    solution: [`${fr(p, q)} = ${digits(x, L + 2)}…: its first ${L === 1 ? 'digit' : 'two digits'} after the point ${L === 1 ? 'is' : 'are'} ${digits(x, L).split('.')[1]}.`, `So it sits in the ${PLACE[L]} from ${dh(lo, L)} to ${dh(lo + 1n, L)}: ${mark(dh(lo, L))} &lt; ${fr(p, q)} &lt; ${mark(dh(lo + 1n, L))}.`],
    answer: { kind: 'pair', x: Number(dt(lo, L)), y: Number(dt(lo + 1n, L)) },
    check: r => {
      if (r.kind !== 'pair') return { ok: false, say: 'Type two decimals.' };
      const a = fromTyped(r.x, 6), b = fromTyped(r.y, 6);
      if (!a || !b) return { ok: false, say: 'Type two decimals.' };
      if (decEq(a[0], a[1], lo, L) && decEq(b[0], b[1], lo + 1n, L)) return { ok: true, say: `Yes: ${dh(lo, L)} < ${fr(p, q)} < ${dh(lo + 1n, L)}.` };
      const okLo = cmpDec(x, a[0], a[1]) > 0, okHi = cmpDec(x, b[0], b[1]) < 0;
      if (okLo && okHi) return { ok: false, mc: MC.prefix, say: `True, but that interval is wider than one ${PLACE[L]}. The digits pin it closer: ${dh(lo, L)} < ${fr(p, q)} < ${dh(lo + 1n, L)}.` };
      const up = roundTo(x, L);
      if (up !== lo && decEq(a[0], a[1], up, L)) return { ok: false, say: `${fr(p, q)} = ${digits(x, L + 2)}… is below ${dh(up, L)}: rounding up gives a bound that is too big for the left end. It sits between ${dh(lo, L)} and ${dh(lo + 1n, L)}.` };
      return { ok: false, say: `${fr(p, q)} = ${digits(x, L + 2)}…, so it lies between ${dh(lo, L)} and ${dh(lo + 1n, L)}.` };
    },
  };
};
const prefixWhere: Gen = (R, n) => {
  const v = int(R, 0, 2);
  const L = pick(R, [1, 2]), a = BigInt(int(R, L === 1 ? 1 : 11, L === 1 ? 8 : 98)), lo = dh(a, L), hi = dh(a + 1n, L);
  if (v === 0) return choice(R, {
    id: `prefixWhere-${n}`, family: 'prefixWhere', prompt: `A number's decimal starts ${B(`${lo}…`)} and you don't know the rest of its digits. Where can it be on the number line?`,
    board: `${dt(a, L)}{\\ldots}`, solveTex: [`${dt(a, L)} \\le x < ${dt(a + 1n, L)}`],
    solution: [`Whatever digits come next, the number is at least ${lo} and below ${hi}.`, 'Each new digit picks one tenth of the interval before it: the address only gets more exact.'],
  }, [
    { t: `Between ${lo} and ${hi}`, ok: true, say: 'Yes: the digits you know already fence it in.' },
    { t: 'Anywhere from 0 to 1: the next digits could move it anywhere', ok: false, mc: MC.prefix, say: `The next digits can only move it inside the ${PLACE[L]} from ${lo} to ${hi}: even ${lo}999… stays below ${hi}.` },
    { t: `Exactly at ${lo}`, ok: false, mc: MC.truncFull, say: `Only if every later digit is 0. Otherwise it is a bit past ${lo}, but still below ${hi}.` },
  ]);
  if (v === 1) return choice(R, {
    id: `prefixWhere-${n}`, family: 'prefixWhere', prompt: `How many numbers are there between ${B(lo)} and ${B(hi)}?`,
    board: `${dt(a, L)} < \\,?\\, < ${dt(a + 1n, L)}`, solveTex: [`${dt(a, L)}5,\\ ${dt(a, L)}55,\\ ${dt(a, L)}555,\\ {\\ldots}`],
    solution: [`${lo}5 is between them, so is ${lo}55, and ${lo}555…`, 'Zoom in and the interval splits into ten again, forever: there are infinitely many.'],
  }, [
    { t: `Infinitely many: ${lo}5, ${lo}55, ${lo}555, …`, ok: true, say: 'Yes: you can always zoom in and find more.' },
    { t: `None: ${hi} comes right after ${lo}`, ok: false, mc: MC.discrete, say: `${lo}5 is between them. Decimals are not a list of steps: there is always room for another digit.` },
    { t: `Nine: ${lo}1, ${lo}2, …, ${lo}9`, ok: false, mc: MC.discrete, say: `Those nine are there, but so are ${lo}15, ${lo}155, … Each zoom finds ten more: infinitely many.` },
  ]);
  const [p, q] = pick(R, [[2, 3], [1, 3], [5, 6], [4, 9], [7, 9], [1, 6]] as [number, number][]), r = fracToRep(p, q);
  return choice(R, {
    id: `prefixWhere-${n}`, family: 'prefixWhere', prompt: `${repDotsHtml(r, 6)} never ends. Does it have an exact place on the number line?`,
    board: `${repTex(r)} = \\,?`, solveTex: [`${repTex(r)} = \\tfrac{${p}}{${q}}`],
    solution: [`${repDotsHtml(r, 6)} = ${fr(p, q)}.`, `Every zoom keeps it inside a smaller interval; all of them hold the same single point, ${fr(p, q)}.`],
  }, [
    { t: `Yes: it is ${fr(p, q)}, one exact point.`, ok: true, say: 'Right: endless digits, one exact place.' },
    { t: 'No: its digits never end, so it never gets a place.', ok: false, mc: MC.noExact, say: `The endless digits are only its address, more and more exact. The point itself is ${fr(p, q)}.` },
    { t: `Only roughly: at about ${digits(frac(p, q), 2)}`, ok: false, mc: MC.roundedExact, say: `${digits(frac(p, q), 2)} is a rounded neighbour. The number itself is exactly ${fr(p, q)}.` },
  ]);
};

// =====================================================================================================
// rational or irrational (define-irrational, form-vs-value, perfect-square-test, root-of-fraction)
// =====================================================================================================
function rOrIOpts(N: Num, R: () => number): { opts: Opt[]; sol: string[]; tex: string[] } {
  const h = N.html;
  if (N.kind === 'rep') {
    const [p, q] = repToFrac(parseRepFromNum(N));
    return {
      opts: [
        { t: `Rational: it repeats, so it equals a fraction (${fr(p, q)}).`, ok: true, say: `Right: ${h} = ${fr(p, q)}.` },
        { t: 'Irrational: its digits go on forever.', ok: false, mc: MC.repIrr, say: `Going on forever is not enough: it REPEATS, and every repeating decimal is a fraction. ${h} = ${fr(p, q)}.` },
        { t: 'Neither: an endless decimal is never exact.', ok: false, mc: MC.asApprox, say: `${h} is exact: it IS ${fr(p, q)}. The bar means the block repeats forever, not that it is cut off.` },
      ], sol: [`${h} repeats one block forever.`, `Shift and subtract turns it into ${fr(p, q)}: rational.`], tex: [`${N.tex} = \\tfrac{${p}}{${q}}`],
    };
  }
  if (N.kind === 'pattern') return {
    opts: [
      { t: 'Irrational: it never settles into one block that repeats.', ok: true, say: 'Right: a rule is not a repeat. No fixed block comes back again and again.' },
      { t: 'Rational: its digits follow a pattern.', ok: false, mc: MC.pattern, say: 'A pattern is not enough. Rational decimals end or repeat ONE fixed block; here the gaps keep growing, so no block repeats.' },
      { t: `Rational: it starts ${N.html.slice(0, 4)}, so it is that fraction.`, ok: false, mc: MC.truncFull, say: 'The first digits are only the start of its address. The whole decimal never repeats a block: irrational.' },
    ], sol: ['Each stretch is longer than the one before, so no block of digits repeats forever.', 'It does not end or repeat: irrational.'], tex: [`${N.tex} \\ \\text{irrational}`],
  };
  if (N.kind === 'pi') return {
    opts: [
      { t: 'Irrational: its decimal never ends and never repeats.', ok: true, say: 'Right: π = 3.14159… with no end and no repeat.' },
      { t: 'Rational: π = 22/7.', ok: false, mc: MC.pi314, say: '22/7 = 3.142857…, but π = 3.141592…: they differ at the third decimal. 22/7 is only close to π.' },
      { t: 'Rational: π = 3.14, and 3.14 = 314/100.', ok: false, mc: MC.pi314, say: '3.14 is π cut off. π = 3.14159…, which never ends or repeats.' },
    ], sol: ['π = 3.14159265… (the circumference of any circle divided by its diameter).', 'Its decimal never ends and never repeats: irrational. 3.14 and 22/7 are only close to it.'], tex: ['\\pi = 3.14159{\\ldots}'],
  };
  if (N.kind === 'sqrt') {
    const x = N.x as Extract<Real, { kind: 'sqrt' }>, a = x.a, neg = x.sign < 0, sg = neg ? MINUS : '';
    if (isSquare(a)) {
      const k = isqrt(a);
      const o: Opt[] = [
        { t: `Rational: ${h} = ${sg}${k} = ${sg}${k}/1.`, ok: true, say: `Right: ${k} × ${k} = ${a}, so ${h} = ${sg}${k}.` },
        { t: 'Irrational: it has a root sign.', ok: false, mc: MC.radical, say: `Look at the value: ${k} × ${k} = ${a}, so ${h} = ${sg}${k}, an integer, and so rational.` },
      ];
      if (neg) o.push({ t: `Not a real number: it is the root of ${MINUS}${a}.`, ok: false, mc: MC.negRoot, say: `${h} is the OPPOSITE of ${rad(a)}: ${MINUS}${k}. The root of ${MINUS}${a} would be a different thing.` });
      else o.push({ t: `Two numbers, ${k} and ${MINUS}${k}, so it is not one rational number.`, ok: false, mc: MC.plusMinus, say: `The root sign means the one non-negative root: ${h} = ${k}, a single rational number.` });
      return { opts: o, sol: [`${k} × ${k} = ${a}, so ${h} = ${sg}${k}.`, `${sg}${k} = ${sg}${k}/1: rational. The root sign does not decide; the value does.`], tex: [`${N.tex} = ${neg ? '-' : ''}${k}`] };
    }
    const k = isqrt(a);
    return {
      opts: [
        { t: `Irrational: ${a} is not a perfect square, so its root never ends or repeats.`, ok: true, say: `Right: ${k}² = ${k * k} and ${k + 1}² = ${(k + 1) ** 2}; ${a} is between, so ${h} is irrational.` },
        { t: 'Irrational: every number with a root sign is.', ok: false, mc: MC.radical, say: `Right answer, wrong reason: ${rad(k * k)} = ${k} is rational. ${h} is irrational because ${a} is not a perfect square.` },
        { t: `Rational: ${h} = ${digits(x, 3)}, a decimal that ends.`, ok: false, mc: MC.roundedExact, say: `${digits(x, 3)} is ${h} cut off: ${digits(x, 3)}² ≠ ${a}. The real digits go on without repeating.` },
      ], sol: [`${k}² = ${k * k} < ${a} < ${(k + 1) ** 2} = ${k + 1}²: ${a} is not a perfect square.`, `So ${h} is irrational (a known fact for every whole number that is not a perfect square).`], tex: [`${k} < ${N.tex.replace(/^-/, '')} < ${k + 1}`],
    };
  }
  if (N.kind === 'sqrtfrac' || N.kind === 'sqrtdec') {
    const x = N.x as Extract<Real, { kind: 'sqrt' }>, g = gcd(x.a, x.b), a = x.a / g, b = x.b / g;
    const show = N.kind === 'sqrtdec' ? `${N.html.replace(/^.*?<span>(.*)<\/span><\/span>$/, '$1')} = ${fr(x.a, x.b)}${g > 1 ? ` = ${fr(a, b)}` : ''}` : g > 1 ? `${fr(x.a, x.b)} = ${fr(a, b)}` : `${fr(a, b)} is in lowest terms`;
    if (isSquare(a) && isSquare(b)) {
      const p = isqrt(a), q = isqrt(b);
      const o: Opt[] = [
        { t: `Rational: ${h} = ${fr(p, q)}.`, ok: true, say: `Right: (${fr(p, q)})² = ${fr(a, b)}.` },
        { t: 'Irrational: it has a root sign.', ok: false, mc: MC.radical, say: `${show}, and (${fr(p, q)})² = ${fr(a, b)}: so ${h} = ${fr(p, q)}, rational.` },
      ];
      if (g > 1) o.push({ t: `Irrational: ${x.a} and ${x.b} are not both perfect squares.`, ok: false, mc: MC.unreduced, say: `Reduce first: ${fr(x.a, x.b)} = ${fr(a, b)}, and ${a} and ${b} ARE perfect squares. ${h} = ${fr(p, q)}.` });
      else if (N.kind === 'sqrtdec') o.push({ t: `Rational: ${h} = ${decStr(BigInt(x.a * 5), String(x.b).length, true)}.`, ok: false, mc: MC.halving, say: `A root is not a half. ${show}, and ${h} = ${fr(p, q)} because (${fr(p, q)})² = ${fr(a, b)}.` });
      else o.push({ t: `Rational: ${h} = ${fr(p, b)}.`, ok: false, mc: MC.rootFirst, say: `The root covers the whole fraction: ${h} = ${fr(p, q)}, since (${fr(p, q)})² = ${fr(a, b)}. (${fr(p, b)})² is not ${fr(a, b)}.` });
      return { opts: o, sol: [`${show}.`, `${a} = ${p}² and ${b} = ${q}², so ${h} = ${fr(p, q)}: rational.`], tex: [`${N.tex} = \\tfrac{${p}}{${q}}`] };
    }
    const o: Opt[] = [
      { t: `Irrational: in lowest terms it is ${fr(a, b)}, and ${!isSquare(a) ? a : b} is not a perfect square.`, ok: true, say: `Right: ${show}; ${!isSquare(a) ? a : b} is not a perfect square.` },
      N.kind === 'sqrtdec'
        ? { t: `Rational: ${h} = ${decStr(BigInt(x.a * 5), String(x.b).length, true)}.`, ok: false, mc: MC.halving, say: `That halves it, and a root is not a half: (${decStr(BigInt(x.a * 5), String(x.b).length, true)})² ≠ ${decStr(BigInt(x.a), String(x.b).length - 1, true)}. ${show}, not a square over a square: irrational.` }
        : { t: 'Rational: it is written with a fraction.', ok: false, mc: MC.fracDisplay, say: `The fraction is under the root sign. ${show}, and ${!isSquare(a) ? a : b} is not a perfect square, so its root is irrational.` },
    ];
    if (isSquare(b) && !isSquare(a)) o.push({ t: `Rational: ${h} = ${fr(a, isqrt(b))}.`, ok: false, mc: MC.rootFirst, say: `The root covers the top too: (${fr(a, isqrt(b))})² = ${fr(a * a, b)}, not ${fr(a, b)}. ${a} is not a perfect square, so ${h} is irrational.` });
    else o.push({ t: 'Irrational: every number with a root sign is.', ok: false, mc: MC.radical, say: `Right answer, wrong reason: ${rad(fr(1, 4))} = ${fr(1, 2)} is rational. This one is irrational because in lowest terms ${fr(a, b)} is not a square over a square.` });
    return { opts: o, sol: [`${show}.`, `${!isSquare(a) ? `${a} is` : `${b} is`} not a perfect square, so ${h} is irrational.`], tex: [`${N.tex} \\ \\text{irrational}`] };
  }
  if (N.kind === 'frac') {
    // 22/7 or 355/113: a fraction that is close to pi
    const f = N.x as Extract<Real, { kind: 'frac' }>;
    return {
      opts: [
        { t: `Rational: it is a quotient of integers (it is only close to π).`, ok: true, say: `Right: ${h} = ${digits(N.x!, 6)}…, π = 3.141592…` },
        { t: 'Irrational: it is π.', ok: false, mc: MC.approxInherits, say: `${h} is close to π but not equal: ${h} = ${digits(N.x!, 6)}…, π = 3.141592… Being close to an irrational does not make it irrational.` },
        { t: `Irrational: ${h} = ${digits(N.x!, 4)}… goes on forever.`, ok: false, mc: MC.repIrr, say: `${f.p} ÷ ${f.q} repeats (every fraction does), and it IS a quotient of integers: rational.` },
      ], sol: [`${h} = ${f.p} ÷ ${f.q}: integer over nonzero integer, so rational.`, `It is close to π (${digits(N.x!, 6)}… vs 3.141592…) but not equal to it.`], tex: [`${N.tex} = ${digits(N.x!, 5)}{\\ldots} \\ne \\pi`],
    };
  }
  if (N.kind === 'dec' && !/^(3\.14|1\.41|1\.73|2\.23)/.test(N.tex)) {
    const [a, L] = parseDec(N.tex);
    return {
      opts: [
        { t: `Rational: it ends, so ${h} = ${dh(a, 0)}/${10 ** L}.`, ok: true, say: `Right: an ending decimal is a fraction over 10, 100, 1000, …` },
        { t: 'Irrational: a decimal is never an exact fraction.', ok: false, mc: MC.allDecInexact, say: `${h} = ${dh(a, 0)}/${10 ** L} exactly.` },
        { t: 'Irrational: it has no fraction bar.', ok: false, mc: MC.fracDisplay, say: `It doesn't need one: it CAN be written as ${dh(a, 0)}/${10 ** L}, so it is rational.` },
      ], sol: [`${h} = ${dh(a, 0)}/${10 ** L}.`, 'A quotient of integers: rational.'], tex: [`${N.tex} = \\tfrac{${a}}{${10 ** L}}`],
    };
  }
  // a terminating decimal that approximates an irrational: 3.14, 1.414
  const near = N.tex.startsWith('3.14') ? 'π' : N.tex.startsWith('1.41') ? rad(2) : N.tex.startsWith('1.73') ? rad(3) : rad(5);
  const [a, L] = parseDec(N.tex);
  return {
    opts: [
      { t: `Rational: it ends, so ${h} = ${dh(a, 0)}/${10 ** L}.`, ok: true, say: `Right: ${h} is rational. It is only CLOSE to ${near}.` },
      { t: `Irrational: it is ${near}.`, ok: false, mc: N.tex.startsWith('3.14') ? MC.pi314 : MC.approxInherits, say: `${h} stops; ${near} does not. ${h} is a rational number close to ${near}.` },
      { t: 'Neither: a decimal is never exact.', ok: false, mc: MC.allDecInexact, say: `${h} is exactly ${dh(a, 0)}/${10 ** L}: an ending decimal is an exact fraction.` },
    ], sol: [`${h} = ${dh(a, 0)}/${10 ** L}: rational.`, `${near} is irrational; ${h} is only close to it.`], tex: [`${N.tex} = \\tfrac{${a}}{${10 ** L}}`],
  };
}
/** a Rep back from a repeating Num (we keep it on the Num as data) */
const repOf = new WeakMap<Num, Rep>();
function RpK(r: Rep): Num { const N = Rp(r); repOf.set(N, r); return N; }
function parseRepFromNum(N: Num): Rep { const r = repOf.get(N); if (!r) throw new Error('not a repeating Num'); return r; }

function rOrIPool(R: () => number, sg: string | undefined): Num {
  if (sg === 'define-irrational') {
    const v = int(R, 0, 3);
    if (v === 0) return pick(R, [Sq(2), Sq(3), Sq(5), PIn]);
    if (v === 1) { const p = pick(R, PATTERNS); return Pat(p.d, p.rule); }
    return RpK(pick(R, [{ int: 0, pre: '', rep: '3' }, { int: 0, pre: '', rep: '27' }, { int: 0, pre: '', rep: '81' }, { int: 1, pre: '', rep: '6' }, { int: 0, pre: '1', rep: '6' }, { int: 2, pre: '', rep: '45' }, { int: 0, pre: '', rep: '142857' }, { int: 0, pre: '0', rep: '9' }].filter(r => !(r.pre === '0' && r.rep === '9')) as Rep[]));
  }
  if (sg === 'perfect-square-test') {
    const big = R() < 0.45, sign: 1 | -1 = R() < 0.25 ? -1 : 1;
    const a = R() < 0.5 ? pick(R, SQUARES.filter(s => (big ? s >= 100 : s >= 1 && s < 100))) : nonSquare(R, big ? 101 : 2, big ? 224 : 99);
    return Sq(a, sign);
  }
  if (sg === 'root-of-fraction') return pick(R, ROOTFRACS)();
  // form-vs-value
  const v = int(R, 0, 4);
  if (v === 0) return Sq(pick(R, [16, 25, 36, 49, 64, 81, 100, 121, 144]));
  if (v === 1) return pick(R, [Fr(22, 7), Fr(355, 113)]);
  if (v === 2) return pick(R, [Dc('3.14'), Dc('1.414'), Dc('3.1416'), Dc('1.732'), Dc('2.236')]);
  if (v === 3) return pick(R, [PIn, Sq(2), Sq(10)]);
  return pick(R, [Dc('0.125'), Dc('0.75'), RpK({ int: 0, pre: '', rep: '3' }), RpK({ int: 0, pre: '', rep: '6' }), Dc('2.5')]);
}
const ROOTFRACS: (() => Num)[] = [
  () => SqF(4, 9, true), () => SqF(9, 25, true), () => SqF(16, 49, true), () => SqF(1, 4, true), () => SqF(25, 36, true), () => SqF(49, 100, true),
  () => SqF(2, 8, true), () => SqF(8, 18, true), () => SqF(3, 12, true), () => SqF(18, 50, true), () => SqF(12, 27, true), () => SqF(20, 45, true), () => SqF(32, 50, true), () => SqF(27, 48, true),
  () => SqF(2, 9, false), () => SqF(3, 4, false), () => SqF(1, 2, false), () => SqF(5, 9, false), () => SqF(4, 7, false), () => SqF(9, 10, false), () => SqF(7, 16, false),
  () => SqD('0.09', true), () => SqD('0.25', true), () => SqD('0.36', true), () => SqD('0.49', true), () => SqD('0.04', true), () => SqD('1.44', true),
  () => SqD('0.4', false), () => SqD('0.9', false), () => SqD('0.5', false), () => SqD('0.1', false), () => SqD('1.6', false),
];
const rOrI: Gen = (R, n, sg) => {
  const N = rOrIPool(R, sg);
  const { opts, sol, tex } = rOrIOpts(N, R);
  const who = pick(R, NAMES);
  const prompt = pick(R, [`Is ${A(N.html)} rational or irrational? Pick the answer with the right reason.`, `${who} has to sort ${A(N.html)}. Rational or irrational, and why?`]);
  const pic: Pic | undefined = N.x && approx(N.x) > -16 && approx(N.x) < 16 && N.kind !== 'frac' && N.kind !== 'dec'
    ? { kind: 'sets', p: { tokens: [{ tex: N.tex, x: N.x }], focus: 0 }, show: ['real', 'rational', 'integer', 'whole', 'natural', 'irrational'], solve: ['tokens', 'focus'] } : undefined;
  return choice(R, { id: `rOrI-${n}`, family: 'rOrI', prompt, board: N.tex, solveTex: tex, solution: sol, pic, bareFirst: true }, opts);
};

// =====================================================================================================
// display-not-proof
// =====================================================================================================
const displayRead: Gen = (R, n) => {
  const v = int(R, 0, 2);
  if (v === 1) {
    const a = pick(R, [2, 3, 5, 7, 10]), x = sqrt(a), d = digits(x, a >= 10 ? 8 : 9), more = digits(x, 15).slice(d.length, d.length + 5);
    return choice(R, {
      id: `displayRead-${n}`, family: 'displayRead', prompt: `A calculator shows ${rad(a)} = ${B(d)}. Does the screen prove that ${rad(a)} is irrational?`,
      board: `\\sqrt{${a}} \\approx ${d}`, pic: { kind: 'calc', p: { keys: `\\sqrt{${a}}`, display: d, more }, show: ['calc', 'display'], solve: ['cut'] },
      solveTex: [`\\sqrt{${a}} = ${d}{\\ldots}`, `${a} \\text{ is not a square}`],
      solution: [`The screen shows only ${d.length - 2} digits; the digits after them (${more}…) are cut off.`, `No screen can show that digits NEVER repeat. We know ${rad(a)} is irrational because ${a} is not a perfect square.`],
    }, [
      { t: `No: a screen shows only the first digits. ${rad(a)} is irrational because ${a} is not a perfect square.`, ok: true, say: 'Right: the reason is the perfect-square test, not the screen.' },
      { t: 'Yes: the digits fill the whole screen without repeating.', ok: false, mc: MC.fullDisplay, say: `${fr(1, 17)} also fills a screen without a visible repeat, and it is rational. A full screen proves nothing.` },
      { t: `No: the screen shows ${rad(a)} = ${d} exactly, so it is rational.`, ok: false, mc: MC.truncFull, say: `The screen is cut off: ${d}² ≠ ${a}. ${rad(a)} = ${d}${more}…, and it never ends.` },
    ]);
  }
  const q = pick(R, [7, 13, 17, 19, 23, 29]), p = pick(R, Array.from({ length: q - 1 }, (_, i) => i + 1).filter(i => gcd(i, q) === 1)), x = frac(p, q);
  const d = digits(x, 10).slice(0, 12), more = digits(x, 20).slice(12, 17);
  const r = fracToRep(p, q);
  if (v === 0) return choice(R, {
    id: `displayRead-${n}`, family: 'displayRead', prompt: `A calculator shows ${p} ÷ ${q} = ${B(d)}, with no repeat in sight. Is ${fr(p, q)} rational or irrational?`,
    board: `${p} \\div ${q} = ${d}{\\ldots}`, pic: { kind: 'calc', p: { keys: `${p} \\div ${q}`, display: d, more }, show: ['calc', 'display'], solve: ['cut'] },
    solveTex: [`\\dfrac{${p}}{${q}} = ${p} \\div ${q}`, r.rep.length <= 6 ? `\\dfrac{${p}}{${q}} = ${repTex(r)}` : `\\text{repeat: ${r.rep.length} digits}`],
    solution: [`${fr(p, q)} is ${p} ÷ ${q}: a quotient of integers, so rational, whatever the screen shows.`, `Its repeating block is ${r.rep.length} digits long: longer than the screen.`],
  }, [
    { t: `Rational: it is ${p} ÷ ${q}. Its repeat is just longer than the screen.`, ok: true, say: `Right: the block of ${fr(p, q)} is ${r.rep.length} digits long.` },
    { t: 'Irrational: the digits fill the screen and never repeat.', ok: false, mc: MC.fullDisplay, say: `The screen shows 10 digits; the repeating block of ${fr(p, q)} has ${r.rep.length}. And ${p} ÷ ${q} is a quotient of integers: rational.` },
    { t: `Rational, because it is exactly ${d}.`, ok: false, mc: MC.truncFull, say: `Rational, yes, but not because of the screen: ${d} is cut off. ${fr(p, q)} = ${d}${more}…` },
  ]);
  return choice(R, {
    id: `displayRead-${n}`, family: 'displayRead', prompt: `A screen shows ${B(d)} and nothing else. Can you tell from the screen alone whether the number is rational?`,
    board: `${d}{\\ldots} ?`, pic: { kind: 'calc', p: { keys: '?', display: d, more }, show: ['calc', 'display'], solve: ['cut'] },
    solveTex: [`\\text{could be } \\dfrac{${p}}{${q}}`, `\\text{or an irrational}`],
    solution: [`It could be ${fr(p, q)} (rational) or an irrational number with the same first digits.`, 'Ten digits hold too little information: you need to know where the number came from.'],
  }, [
    { t: 'No: many numbers, rational and irrational, start with these digits.', ok: true, say: `Right: this one happens to be ${fr(p, q)}, but the screen can't tell you that.` },
    { t: 'Yes, irrational: no block repeats on the screen.', ok: false, mc: MC.fullDisplay, say: `It is ${fr(p, q)}: its repeating block (${r.rep.length} digits) is just longer than the screen.` },
    { t: 'Yes, rational: it ends after 10 digits.', ok: false, mc: MC.truncFull, say: `The screen ends, the number does not: ${d}${more}… The screen alone can't tell.` },
  ]);
};

// =====================================================================================================
// real-number-sets
// =====================================================================================================
const SETNUMS: (() => Num)[] = [() => I(7), () => I(0), () => I(-4), () => Fr(12, 4), () => Sq(16), () => Sq(25, -1), () => Dc('3.000'), () => Fr(2, 3), () => Dc('-0.75'),
  () => RpK({ int: 0, pre: '', rep: '3' }), () => Pc(125), () => Sq(2), () => Sq(10, -1), () => PIn, () => Pat('0.1010010001', ''), () => I(12), () => Fr(-6, 2), () => Sq(49), () => Sq(5)];
const innermostFam: Gen = (R, n) => {
  const N = pick(R, SETNUMS)();
  const where: SetId = N.x ? innermost(N.x) : 'irrational';
  const ALL: SetId[] = ['natural', 'whole', 'integer', 'rational', 'irrational'];
  const why = (s: SetId): Opt => {
    if (s === where) return { t: SET_NAME[s] + (s === 'integer' ? '' : ' numbers'), ok: true, say: `Yes: ${N.html} is ${valueWords(N)}.` };
    let mc: string | undefined;
    if (s === 'irrational' && N.kind === 'sqrt') mc = MC.byNotation;
    else if (s === 'irrational' && N.kind === 'rep') mc = MC.repIrr;
    else if ((s === 'rational') && (N.kind === 'frac' || N.kind === 'dec' || N.kind === 'pct') && where !== 'rational') mc = MC.byNotation;
    else if (s === 'natural' && where === 'whole') mc = MC.zeroCounting;
    else if (s !== 'irrational' && where === 'irrational') mc = MC.misplaced;
    else if (s === 'natural' && N.kind === 'pct') mc = MC.byNotation;
    const say = where === 'irrational' ? `${N.html} is irrational: it is in none of the rational sets.` : `${N.html} is ${valueWords(N)}, so its smallest set is ${SET_NAME[where]}${s === 'rational' ? ' (it is rational too, but that is not the smallest set)' : ''}.`;
    return { t: SET_NAME[s] + (s === 'integer' ? '' : ' numbers'), ok: false, mc, say };
  };
  const wrong = shuffle(R, ALL.filter(s => s !== where)).slice(0, 3);
  const opts = ALL.filter(s => s === where || wrong.includes(s)).map(why);
  return choice(R, {
    id: `innermost-${n}`, family: 'innermost', prompt: `Which is the SMALLEST set that contains ${A(N.html)}?`, board: N.tex,
    pic: N.x ? { kind: 'sets', p: { tokens: [{ tex: N.tex, x: N.x }], focus: 0 }, show: ['real', 'rational', 'integer', 'whole', 'natural', 'irrational'], solve: ['tokens', 'focus'] } : undefined,
    solveTex: [N.x && isRational(N.x)
      ? (N.tex === valueTex(N) ? `${N.tex}\\ \\text{is ${where === 'natural' ? 'a counting number' : where === 'whole' ? 'whole' : 'an integer'}}` : `${N.tex} = ${valueTex(N)}`)
      : `${N.tex}\\ \\text{is irrational}`],
    solution: [`First find the value: ${N.html} is ${valueWords(N)}.`, `It goes in the innermost region that holds that value: ${SET_NAME[where]}.`, where === 'irrational' ? 'The irrationals are a region of their own, beside the rationals.' : 'It also belongs to every region around that one.'],
  }, opts, true);
};
function valueWords(N: Num): string {
  if (!N.x) return 'a decimal that never ends or repeats: irrational';
  if (!isRational(N.x)) return 'irrational';
  const v = norm2(N.x);
  if (v.q !== 1) return `${hNum(v.p)}/${v.q}, a fraction that is not an integer`;
  if (v.p >= 1) return `${v.p}, a counting number`;
  if (v.p === 0) return '0: a whole number, but not a counting number';
  return `${hNum(v.p)}, a negative integer`;
}
function valueTex(N: Num): string { const v = norm2(N.x!); return v.q === 1 ? String(v.p) : `${v.p < 0 ? '-' : ''}\\tfrac{${Math.abs(v.p)}}{${v.q}}`; }
function norm2(x: Real): { p: number; q: number } {
  if (x.kind === 'frac') return x;
  if (x.kind === 'sqrt') { const k = isqrt(x.a); return { p: x.sign * k, q: 1 }; }
  throw new Error('pi');
}
const STATEMENTS: { s: string; opts: Opt[]; sol: string[] }[] = [
  { s: 'Every integer is a rational number.', opts: [
    { t: 'True: any integer n can be written as n/1.', ok: true, say: 'Right: the integers sit inside the rationals.' },
    { t: 'False: integers and rational numbers are different kinds.', ok: false, mc: MC.notNested, say: 'The sets are nested: −4 = −4/1, so every integer is rational too.' },
    { t: 'False: −4 is not a fraction.', ok: false, mc: MC.fracDisplay, say: '−4 can be WRITTEN as (−4)/1. Rational is about what it equals, not how it looks.' },
  ], sol: ['n = n/1 for every integer n.', 'So the integer region is drawn inside the rational region.'] },
  { s: 'Every whole number is a natural number.', opts: [
    { t: 'False: 0 is a whole number but not a counting number.', ok: true, say: 'Right: the natural numbers start at 1.' },
    { t: 'True: whole numbers are just the counting numbers.', ok: false, mc: MC.zeroCounting, say: 'Counting starts at 1. The whole numbers are 0, 1, 2, …: 0 is whole but not natural.' },
    { t: 'True: both are inside the integers.', ok: false, say: 'Both are inside the integers, but that does not make them equal: 0 is whole and not natural.' },
  ], sol: ['Natural (counting) numbers: 1, 2, 3, …', 'Whole numbers: 0, 1, 2, 3, …: one more number, 0.'] },
  { s: 'Some irrational numbers are also rational.', opts: [
    { t: 'False: irrational means NOT rational, so the two regions never overlap.', ok: true, say: 'Right: the irrationals are a separate region.' },
    { t: `True: ${rad(4)} has a root sign and equals 2.`, ok: false, mc: MC.misplaced, say: `${rad(4)} = 2 is simply rational. It was never irrational: the value decides.` },
    { t: 'True: π ≈ 3.14, and 3.14 is rational.', ok: false, mc: MC.pi314, say: 'π is only close to 3.14. π itself is irrational, 3.14 is rational: two different numbers.' },
  ], sol: ['“Irrational” is defined as “real but not rational”.', 'So nothing can be in both regions.'] },
  { s: 'Every real number is either rational or irrational.', opts: [
    { t: 'True: a real number that is not rational is, by definition, irrational.', ok: true, say: 'Right: the two regions together fill the real numbers.' },
    { t: `False: ${rad(2)} is neither, because it has no exact value.`, ok: false, mc: MC.noExact, say: `${rad(2)} has an exact value: the side of a square of area 2. It is irrational.` },
    { t: 'False: repeating decimals like 0.333… are neither.', ok: false, mc: MC.repIrr, say: '0.333… = 1/3: rational.' },
  ], sol: ['Every real number is rational or it is not.', 'If it is not, it is irrational: there is no third region.'] },
  { s: '5 is a natural number, a whole number, an integer and a rational number.', opts: [
    { t: 'True: the sets are nested, so 5 is in all four.', ok: true, say: 'Right: 5 sits in the innermost region and so inside every region around it.' },
    { t: 'False: each number belongs to just one set.', ok: false, mc: MC.notNested, say: 'The regions are nested inside each other: 5 is in the natural numbers AND every region around them.' },
    { t: 'False: 5 is not a fraction, so it is not rational.', ok: false, mc: MC.fracDisplay, say: '5 = 5/1: rational.' },
  ], sol: ['5 is a counting number, so it is in the innermost region.', 'Natural ⊂ whole ⊂ integers ⊂ rationals, so 5 is in all four.'] },
  { s: `${MINUS}${rad(9)} is an integer.`, opts: [
    { t: `True: ${MINUS}${rad(9)} = ${MINUS}3.`, ok: true, say: `Right: ${rad(9)} = 3, so ${MINUS}${rad(9)} = ${MINUS}3.` },
    { t: 'False: it has a root sign, so it is irrational.', ok: false, mc: MC.byNotation, say: `Find the value first: ${MINUS}${rad(9)} = ${MINUS}3, an integer.` },
    { t: `False: you can't take the root of a negative number.`, ok: false, mc: MC.negRoot, say: `The minus is outside: ${MINUS}${rad(9)} is the opposite of ${rad(9)} = 3, so ${MINUS}3.` },
  ], sol: [`${rad(9)} = 3, so ${MINUS}${rad(9)} = ${MINUS}3.`, `${MINUS}3 is a negative integer.`] },
];
const setStatement: Gen = (R, n) => {
  const S0 = pick(R, STATEMENTS);
  return choice(R, {
    id: `setStatement-${n}`, family: 'setStatement', prompt: `True or false: “${S0.s}”`, board: '\\mathbb{N} \\subset \\mathbb{W} \\subset \\mathbb{Z} \\subset \\mathbb{Q}',
    pic: { kind: 'sets', p: { tokens: [{ tex: '7', x: frac(7) }, { tex: '0', x: frac(0) }, { tex: '-4', x: frac(-4) }, { tex: '\\tfrac{2}{3}', x: frac(2, 3) }, { tex: '\\sqrt{2}', x: sqrt(2) }, { tex: '\\pi', x: PI }] },
      show: ['real', 'rational', 'integer', 'whole', 'natural', 'irrational'], solve: ['tokens'] },
    solveTex: [], solution: S0.sol,
  }, S0.opts);
};

// =====================================================================================================
// perfect-square-test
// =====================================================================================================
const whichRational: Gen = (R, n) => {
  const big = R() < 0.45;
  const sq = pick(R, SQUARES.filter(s => (big ? s >= 100 : s >= 4 && s < 100)));
  const k = isqrt(sq);
  const wrongs = new Set<number>();
  // near misses: one off the square, an even non-square, a number ending in a square's last digit
  for (const c of shuffle(R, [sq - 1, sq + 1, sq + 2, 2 * sq > 224 ? sq - 2 : 2 * sq, sq + 10, sq - 10].filter(x => x >= 2 && x <= 224 && !isSquare(x)))) { if (wrongs.size < 3) wrongs.add(c); }
  while (wrongs.size < 3) wrongs.add(nonSquare(R, big ? 101 : 2, big ? 224 : 99));
  return choice(R, {
    id: `whichRational-${n}`, family: 'whichRational', prompt: 'Which of these square roots is a rational number?', board: [sq, ...wrongs].sort((x, y) => x - y).map(x => `\\sqrt{${x}}`).join(',\\ \\ '),
    solveTex: [`\\sqrt{${sq}} = ${k}`], solution: [`${k} × ${k} = ${sq}: ${sq} is a perfect square, so ${rad(sq)} = ${k}.`, `${[...wrongs].join(', ')} are not perfect squares, so their roots are irrational.`],
  }, [
    { t: rad(sq), ok: true, say: `Yes: ${rad(sq)} = ${k}.` },
    ...[...wrongs].map(w => { const kk = isqrt(w); return { t: rad(w), ok: false, say: `${kk}² = ${kk * kk} and ${kk + 1}² = ${(kk + 1) ** 2}: ${w} is between, not a perfect square, so ${rad(w)} is irrational. ${rad(sq)} = ${k} is the rational one.` } as Opt; }),
  ]);
};

// =====================================================================================================
// root-of-fraction
// =====================================================================================================
const RF: [number, number][] = [[4, 9], [9, 25], [16, 49], [1, 4], [25, 36], [49, 100], [2, 8], [8, 18], [3, 12], [18, 50], [12, 27], [20, 45], [32, 50], [27, 48], [9, 16], [1, 9], [36, 49], [50, 72], [45, 80], [5, 20], [9, 100], [25, 100], [4, 100], [81, 100], [144, 100]];
const rootFraction: Gen = (R, n) => {
  const [a0, b0] = pick(R, RF), g = gcd(a0, b0), a = a0 / g, b = b0 / g, p = isqrt(a), q = isqrt(b);
  if (!isSquare(a) || !isSquare(b)) throw new Error('rootFraction pool');
  const dec = b0 === 100;
  const shown = dec ? decStr(BigInt(a0), 2, true) : '';
  const h = dec ? rad(shown) : rad(fr(a0, b0)), t = dec ? `\\sqrt{${shown}}` : `\\sqrt{\\tfrac{${a0}}{${b0}}}`;
  return {
    id: `rootFraction-${n}`, family: 'rootFraction', prompt: dec ? `Write ${A(h)} as a fraction.` : `Find ${A(h)}. (Any equal fraction counts.)`,
    board: `${t} = \\,?`, input: 'frac', solveTex: [dec ? `${shown} = \\tfrac{${a0}}{100}` : `\\tfrac{${a0}}{${b0}} = \\tfrac{${a}}{${b}}`, `\\left(\\tfrac{${p}}{${q}}\\right)^2 = \\tfrac{${a}}{${b}}`, `${t} = \\tfrac{${p}}{${q}}`],
    solution: [dec ? `${shown} = ${fr(a0, 100)}${g > 1 ? ` = ${fr(a, b)}` : ''}.` : g > 1 ? `Reduce first: ${fr(a0, b0)} = ${fr(a, b)}.` : `${fr(a, b)} is in lowest terms.`, `${a} = ${p}² and ${b} = ${q}², so ${h} = ${mark(fr(p, q))}. Check: ${fr(p, q)} × ${fr(p, q)} = ${fr(a, b)}.`],
    answer: { kind: 'frac', w: 0, n: p, d: q },
    check: r => {
      if (r.kind !== 'frac' || r.d <= 0 || !Number.isInteger(r.n) || !Number.isInteger(r.d)) return { ok: false, say: 'Type a fraction.' };
      const N = r.w * r.d + r.n, D = r.d;
      if (N * q === p * D) return { ok: true, say: `Yes: (${fr(p, q)})² = ${fr(a, b)}, so ${h} = ${fr(p, q)}.` };
      if ((N * b0 === p * D * (dec ? 1 : 1) && D === b0) || (isSquare(a0) && N === isqrt(a0) && D === b0)) return { ok: false, mc: MC.rootFirst, say: `The root covers the WHOLE fraction, top and bottom: ${h} = ${fr(p, q)}, because (${fr(p, q)})² = ${fr(a, b)}.` };
      if (N * 2 * b0 === a0 * D) return { ok: false, mc: MC.halving, say: `That halves it. A root asks: which number times itself makes ${fr(a, b)}? ${fr(p, q)} × ${fr(p, q)} = ${fr(a, b)}.` };
      return { ok: false, say: `Check by squaring: (${fr(N, D)})² = ${fr(N * N, D * D)}, not ${fr(a, b)}. ${h} = ${fr(p, q)}.` };
    },
  };
};

// =====================================================================================================
// convert-repeating-pure / convert-repeating-delayed
// =====================================================================================================
function repPool(R: () => number, sg: string | undefined): Rep {
  if (sg === 'convert-repeating-delayed') {
    const v = int(R, 0, 9);
    if (v < 7) {
      const pre = String(int(R, 0, 9)), rep = String(int(R, 1, 9));
      if (pre === rep) return { int: int(R, 0, 2), pre: pre === '9' ? '8' : String(Number(pre) + 1), rep };
      return { int: R() < 0.3 ? int(R, 1, 3) : 0, pre, rep };
    }
    const pre = String(int(R, 0, 9)), rep = String(int(R, 1, 9)) + String(int(R, 0, 9));
    const rep2 = rep[0] === rep[1] ? rep[0] + String((Number(rep[1]) + 3) % 10) : rep;
    // pre = the block's last digit would make it a pure repeat: 0.3 63 63… = 0.36 36…
    return { int: 0, pre: pre === rep2[1] ? String((Number(pre) + 1) % 10) : pre, rep: rep2 };
  }
  const v = int(R, 0, 9);
  if (v === 0) return { int: 0, pre: '', rep: '9' };
  if (v < 5) return { int: R() < 0.3 ? int(R, 1, 4) : 0, pre: '', rep: String(int(R, 1, 8)) };
  const d1 = int(R, 0, 9), d2 = (d1 + int(R, 1, 9)) % 10;
  return { int: R() < 0.25 ? int(R, 1, 3) : 0, pre: '', rep: `${d1}${d2}` };
}
const tapeOf = (r: Rep): TapeParams => ({ r, s1: r.pre.length + r.rep.length, s2: r.pre.length, cells: 7 });
const toFraction: Gen = (R, n, sg) => {
  const r = repPool(R, sg), [p, q] = repToFrac(r), tp = tapeOf(r);
  const m1 = 10 ** tp.s1, m2 = 10 ** tp.s2, diff = m1 - m2;
  const topInt = Math.floor((m1 * p) / q), botInt = Math.floor((m2 * p) / q), D = topInt - botInt;
  const mn = (m: number) => (m === 1 ? '' : String(m));
  const rowTex = (m: number) => `${digits(frac(m * p, q), 4)}{\\ldots}`;
  return {
    id: `toFraction-${n}`, family: 'toFraction',
    prompt: pick(R, [`Write ${A(repHtml(r))} = ${repDotsHtml(r, 6)} as a fraction.`, `Turn ${A(repDotsHtml(r, 6))} into a fraction of integers (any equal fraction counts).`]),
    board: `x = ${repTex(r)}`, input: 'frac',
    pic: { kind: 'tape', p: tp, show: ['bottom'], solve: ['top', 'align', 'subtract', 'cancel'] }, bareFirst: true,
    solveTex: [`${mn(m1)}x = ${rowTex(m1)}`, `${mn(m2)}x = ${rowTex(m2)}`, `${diff}x = ${D}`, `x = \\tfrac{${D}}{${diff}}${gcd(D, diff) > 1 ? ` = \\tfrac{${p}}{${q}}` : ''}`],
    solution: [`Let x = ${repDotsHtml(r, 6)}; then ${mn(m1)}x = ${hNum(rowTex(m1).replace('{\\ldots}', '…'))}${tp.s2 ? ` and ${mn(m2)}x = ${rowTex(m2).replace('{\\ldots}', '…')}` : ''}.`,
      `The tails line up, so subtracting cancels them: ${diff}x = ${D}.`, `x = ${gcd(D, diff) > 1 ? `${fr(D, diff)} = ${mark(fr(p, q))}` : mark(fr(D, diff))}.`],
    answer: { kind: 'frac', w: 0, n: p, d: q },
    check: rr => {
      if (rr.kind !== 'frac' || rr.d <= 0) return { ok: false, say: 'Type a fraction.' };
      const N = rr.w * rr.d + rr.n, Dd = rr.d;
      if (N * q === p * Dd) return { ok: true, say: `Yes: ${repHtml(r)} = ${fr(p, q)}.` };
      // cut off: digits over a power of ten
      const cut = Number(r.int + repDigits(r, tp.s1)), cutD = 10 ** tp.s1;
      if (N * cutD === cut * Dd || (r.pre === '' && r.rep === '9' && N * q < p * Dd)) return { ok: false, mc: MC.asApprox, say: `That is the decimal cut off after ${tp.s1} digit${tp.s1 > 1 ? 's' : ''}: a bit less than ${repHtml(r)}. The repeating tail must cancel: ${diff}x = ${D}, x = ${fr(p, q)}.` };
      if (r.pre !== '') {
        const wrongN = Number(r.pre + r.rep), wrongD = 10 ** (r.pre.length + r.rep.length) - 1;
        if (N * wrongD === wrongN * Dd || N * wrongD === (wrongN + r.int * wrongD) * Dd) return { ok: false, mc: MC.wrongDen, say: `Over-nines works only when the repeat starts right after the point. Here ${r.pre} comes first: ${shiftName(tp.s1, tp.s2)} gives ${diff}x = ${D}, so x = ${fr(p, q)}.` };
      }
      return { ok: false, say: `${fr(N, Dd)} = ${digits(frac(N, Dd), 5)}…, not ${repDotsHtml(r, 5)}. ${diff}x = ${D}, so x = ${fr(p, q)}.` };
    },
  };
};
/** two shifted copies 10^s1 x and 10^s2 x have the same tail exactly when the lower one starts at the repeat and the gap is whole blocks */
export const alignedShift = (r: Rep, s1: number, s2: number): boolean => s1 > s2 && s2 >= r.pre.length && (s1 - s2) % r.rep.length === 0;
const shiftName = (s1: number, s2: number) => `${s1 ? 10 ** s1 : ''}x − ${s2 ? 10 ** s2 : ''}x`;
const shiftTex = (s1: number, s2: number) => `${s1 ? 10 ** s1 : ''}x - ${s2 ? 10 ** s2 : ''}x`;
const whichShift: Gen = (R, n, sg) => {
  let r = repPool(R, sg);
  // a one-digit repeat right after the point lines up with ANY shift: no wrong option to diagnose, so use two digits
  if (r.pre === '' && r.rep.length === 1) r = { int: r.int, pre: '', rep: r.rep === '9' ? '18' : `${r.rep}${(Number(r.rep) + 4) % 10}` };
  const tp = tapeOf(r), right = shiftName(tp.s1, tp.s2);
  const cands: [number, number][] = [[tp.s1 + 1, tp.s2], [tp.s1 - 1, tp.s2], [tp.s1, tp.s2 + 1], [tp.s1, tp.s2 - 1], [tp.s1 + 1, tp.s2 + 1 + (r.rep.length > 1 ? 0 : 1)], [1, 0], [2, 0], [3, 0], [2, 1], [3, 1]];
  const wrongs: [number, number][] = [];
  for (const [a, b] of shuffle(R, cands)) if (a > b && b >= 0 && a <= 4 && !alignedShift(r, a, b) && shiftName(a, b) !== right && !wrongs.some(w => shiftName(w[0], w[1]) === shiftName(a, b))) wrongs.push([a, b]);
  const [p, q] = repToFrac(r), m1 = 10 ** tp.s1, m2 = 10 ** tp.s2, diff = m1 - m2;
  const D = Math.floor((m1 * p) / q) - Math.floor((m2 * p) / q);
  return choice(R, {
    id: `whichShift-${n}`, family: 'whichShift', prompt: `To turn x = ${A(repDotsHtml(r, 6))} into a fraction, which subtraction makes the endless tails cancel?`,
    board: `x = ${repTex(r)}`, pic: { kind: 'tape', p: tp, show: ['bottom'], solve: ['top', 'align', 'subtract', 'cancel'] },
    solveTex: [`${shiftTex(tp.s1, tp.s2)} = ${D}`, `x = \\tfrac{${D}}{${diff}}${gcd(D, diff) > 1 ? ` = \\tfrac{${p}}{${q}}` : ''}`],
    solution: [`The repeating block ${r.rep} is ${r.rep.length} digit${r.rep.length > 1 ? 's' : ''} long${r.pre ? `, after ${r.pre.length} digit${r.pre.length > 1 ? 's' : ''} that do not repeat` : ''}.`, `${right}: both copies have the same tail in every column, so ${diff}x = ${D} and x = ${fr(p, q)}.`],
  }, [
    { t: right, ok: true, say: `Yes: the tails line up digit for digit, so ${diff}x = ${D}.` },
    ...wrongs.slice(0, 2).map(([a, b]) => ({ t: shiftName(a, b), ok: false, mc: MC.unaligned, say: `Line up ${shiftName(a, b).split(' − ')[0]} = ${digits(frac(10 ** a * p, q), 5)}… over ${shiftName(a, b).split(' − ')[1]} = ${digits(frac(10 ** b * p, q), 5)}…: the digits after the point differ, so they don't cancel. ${right} lines them up.` })),
  ]);
};
const generalMethod: Gen = (R, n) => {
  const a = repPool(R, 'convert-repeating-delayed'), b = repPool(R, 'convert-repeating-delayed');
  if (repTex(a) === repTex(b)) b.rep = b.rep.length === 1 ? String((Number(b.rep) % 9) + 1) : b.rep;
  const [p, q] = repToFrac(a), [p2, q2] = repToFrac(b);
  return choice(R, {
    id: `generalMethod-${n}`, family: 'generalMethod', prompt: `You turned ${repDotsHtml(a, 6)} into ${fr(p, q)} by shifting and subtracting. Does the same method work for ${B(repDotsHtml(b, 6))}?`,
    board: `${repTex(b)} = \\,?`, solveTex: [`${repTex(b)} = \\tfrac{${p2}}{${q2}}`], pic: { kind: 'tape', p: tapeOf(b), show: ['bottom'], solve: ['top', 'align', 'subtract'] }, bareFirst: true,
    solution: ['Every eventually repeating decimal can be shifted so the two tails sit in the same columns.', `Then subtracting leaves a whole number, so the decimal is a fraction: here ${fr(p2, q2)}.`, 'So: rational ⇔ the decimal ends or repeats.'],
  }, [
    { t: 'Yes: any repeating tail can be lined up with a shifted copy, so every repeating decimal is a fraction.', ok: true, say: `Right: here it gives ${fr(p2, q2)}.` },
    { t: 'Not for sure: one example only shows it works for that one decimal.', ok: false, mc: MC.oneExample, say: 'The steps never used the particular digits, only that a block repeats. So the same steps work for every repeating decimal.' },
    { t: 'No: if the repeat starts later, the number may be irrational.', ok: false, mc: MC.repIrr, say: `A late start only changes the shifts (two shifts instead of one). It still repeats, so it is a fraction: ${fr(p2, q2)}.` },
  ]);
};

// =====================================================================================================
// bracket-root, refine-bounds, round-from-bounds, locate-number-line
// =====================================================================================================
const bracket: Gen = (R, n) => {
  const big = R() < 0.4, neg = R() < 0.25;
  const N = nonSquare(R, big ? 101 : 2, big ? 224 : 99), k = isqrt(N);
  const sign: 1 | -1 = neg ? -1 : 1, x = sqrt(N, 1, sign), name = `${neg ? '-' : ''}\\sqrt{${N}}`, nh = `${neg ? MINUS : ''}${rad(N)}`;
  const lo = neg ? -(k + 1) : k, hi = neg ? -k : k + 1;
  return {
    id: `bracket-${n}`, family: 'bracket', prompt: neg ? `Between which two consecutive integers is ${A(nh)}? (Smaller one first.)` : `Between which two consecutive whole numbers is ${A(nh)}?`,
    board: `\\square < ${name} < \\square`, input: 'pair', pairLead: '', pairOp: `&lt; ${nh} &lt;`,
    pic: zoomPic({ x, name, levels: 1, squares: true }, ['axis'], ['band0', 'sq0', 'name', 'dot']),
    solveTex: [`${k}^2 = ${k * k} < ${N} < ${(k + 1) ** 2} = ${k + 1}^2`, `${hNum(lo).replace(MINUS, '-')} < ${name} < ${hNum(hi).replace(MINUS, '-')}`],
    solution: [`${k}² = ${k * k} and ${k + 1}² = ${(k + 1) ** 2}, and ${k * k} &lt; ${N} &lt; ${(k + 1) ** 2}.`, neg ? `So ${k} &lt; ${rad(N)} &lt; ${k + 1}.` : `So ${mark(k)} &lt; ${rad(N)} &lt; ${mark(k + 1)}.`, ...(neg ? [`The opposite flips the order: ${mark(hNum(-(k + 1)))} &lt; ${nh} &lt; ${mark(hNum(-k))}.`] : [])],
    answer: { kind: 'pair', x: lo, y: hi },
    check: r => {
      if (r.kind !== 'pair' || !Number.isFinite(r.x) || !Number.isFinite(r.y)) return { ok: false, say: 'Type two numbers.' };
      if (r.x === lo && r.y === hi) return { ok: true, say: `Yes: ${hNum(lo)} < ${nh} < ${hNum(hi)}.` };
      if (Math.abs(r.x) === k * k && Math.abs(r.y) === (k + 1) ** 2 || Math.abs(r.x) === (k + 1) ** 2 && Math.abs(r.y) === k * k) return { ok: false, mc: MC.squaresAsBounds, say: `${k * k} and ${(k + 1) ** 2} are the squares around ${N}. The ROOTS are their sides: ${k} and ${k + 1}.` };
      if (neg && r.x === -k && r.y === -(k + 1)) return { ok: false, mc: MC.negMagnitude, say: `${hNum(-k)} is bigger than ${hNum(-(k + 1))} (it is closer to 0), so the order is ${hNum(-(k + 1))} < ${nh} < ${hNum(-k)}.` };
      if (N >= 20 && (Math.abs(Math.abs(r.x) - N / 2) <= 1 || Math.abs(Math.abs(r.y) - N / 2) <= 1)) return { ok: false, mc: MC.halving, say: `A root is not a half: ${Math.floor(N / 2)}² is far more than ${N}. ${k}² = ${k * k} < ${N} < ${(k + 1) ** 2} = ${k + 1}².` };
      if (neg && r.x === k && r.y === k + 1) return { ok: false, say: `That brackets ${rad(N)}. ${nh} is its opposite: ${hNum(-(k + 1))} < ${nh} < ${hNum(-k)}.` };
      return { ok: false, say: `${k}² = ${k * k} < ${N} < ${(k + 1) ** 2} = ${k + 1}², so ${neg ? `${hNum(-(k + 1))} < ${nh} < ${hNum(-k)}` : `${k} < ${nh} < ${k + 1}`}.` };
    },
  };
};
const REFINE_N = [2, 3, 5, 6, 7, 8, 10, 11, 12, 13, 14, 15, 17, 18, 19, 20, 21, 22, 23, 24, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 65, 66, 67, 68, 69, 70, 72, 75, 78, 80, 83, 85, 88, 90, 92, 95, 98, 99, 105, 110, 115, 120, 130, 140, 150, 160, 170, 180, 190, 200, 210, 220];
const refine: Gen = (R, n) => {
  const N = pick(R, REFINE_N), x = sqrt(N), L = N <= 12 && R() < 0.5 ? 2 : 1;
  const lo = floorScaled(x, L), hi = lo + 1n;
  const trials = [lo - 1n, lo, hi, hi + 1n].filter(t => t > 0n);
  const shownT = R() < 0.5 ? trials.slice(1) : trials.slice(0, 3);
  const name = `\\sqrt{${N}}`;
  const closestUp = (hi * hi - BigInt(N) * P10(2 * L)) < (BigInt(N) * P10(2 * L) - lo * lo);
  return {
    id: `refine-${n}`, family: 'refine',
    prompt: `${shownT.map(t => `${dh(t, L)}² = ${A(sqStr(t, L))}`).join(', ')}. Between which two ${PLACE[L]}s is ${rad(N)}?`,
    board: `\\square < ${name} < \\square`, input: 'pair', pairLead: '', pairOp: `&lt; ${rad(N)} &lt;`,
    pic: zoomPic({ x, name, levels: L + 1, squares: true }, zoomSteps(L + 1, true, L), [`zoom${L}` as ZoomStep, `band${L}` as ZoomStep, `sq${L}` as ZoomStep, 'dot']),
    solveTex: [`${dt(lo, L)}^2 = ${sqStr(lo, L)} < ${N} < ${sqStr(hi, L)} = ${dt(hi, L)}^2`, `${dt(lo, L)} < ${name} < ${dt(hi, L)}`],
    solution: [`${dh(lo, L)}² = ${sqStr(lo, L)} is less than ${N}; ${dh(hi, L)}² = ${sqStr(hi, L)} is more.`, `So ${mark(dh(lo, L))} &lt; ${rad(N)} &lt; ${mark(dh(hi, L))}. Only the square decides, not which trial is closest.`],
    answer: { kind: 'pair', x: Number(dt(lo, L)), y: Number(dt(hi, L)) },
    check: r => {
      if (r.kind !== 'pair') return { ok: false, say: 'Type two decimals.' };
      const a = fromTyped(r.x, 6), b = fromTyped(r.y, 6);
      if (!a || !b) return { ok: false, say: 'Type two decimals.' };
      if (decEq(a[0], a[1], lo, L) && decEq(b[0], b[1], hi, L)) return { ok: true, say: `Yes: ${sqStr(lo, L)} < ${N} < ${sqStr(hi, L)}, so ${dh(lo, L)} < ${rad(N)} < ${dh(hi, L)}.` };
      if (decEq(a[0], a[1], hi, L) && decEq(b[0], b[1], hi + 1n, L)) return { ok: false, mc: closestUp ? MC.closeTrial : undefined, say: `${dh(hi, L)}² = ${sqStr(hi, L)} is MORE than ${N}, so ${rad(N)} is below ${dh(hi, L)}${closestUp ? ', even though that square is the closest' : ''}. ${dh(lo, L)} < ${rad(N)} < ${dh(hi, L)}.` };
      if (decEq(a[0], a[1], lo * lo, 2 * L) || decEq(b[0], b[1], hi * hi, 2 * L)) return { ok: false, mc: MC.squaresAsBounds, say: `Those are the squares. The bounds of the root are the numbers you squared: ${dh(lo, L)} and ${dh(hi, L)}.` };
      return { ok: false, say: `Find the two trials whose squares are just under and just over ${N}: ${dh(lo, L)}² = ${sqStr(lo, L)} and ${dh(hi, L)}² = ${sqStr(hi, L)}.` };
    },
  };
};
const INTERP_N = Array.from({ length: 220 }, (_, i) => i + 2).filter(N => {
  if (isSquare(N)) return false;
  const k = isqrt(N), t = k + (N - k * k) / (2 * k + 1);
  return Math.floor(t * 10) !== Number(floorScaled(sqrt(N), 1)) && Math.abs(t * 10 - Math.round(t * 10)) > 0.05;
});
const interpolate: Gen = (R, n) => {
  const N = pick(R, INTERP_N), k = isqrt(N), x = sqrt(N), who = pick(R, NAMES);
  const lo = floorScaled(x, 1), dist = N - k * k, span = 2 * k + 1;
  const t = k + dist / span, tLo = Math.floor(t * 10);
  return choice(R, {
    id: `interpolate-${n}`, family: 'interpolate',
    prompt: `${who} says: “${N} is ${fr(dist, span)} of the way from ${k * k} to ${(k + 1) ** 2}, so ${rad(N)} is ${fr(dist, span)} of the way from ${k} to ${k + 1}: about ${(Math.round(t * 100) / 100).toFixed(2)}, so ${decStr(BigInt(tLo), 1)} < ${rad(N)} < ${decStr(BigInt(tLo + 1), 1)}.” Is ${who} right?`,
    board: `${decStr(BigInt(tLo), 1)} \\overset{?}{<} \\sqrt{${N}} \\overset{?}{<} ${decStr(BigInt(tLo + 1), 1)}`,
    pic: zoomPic({ x, name: `\\sqrt{${N}}`, levels: 2, squares: true }, ['axis', 'name', 'band0', 'sq0'], ['zoom1', 'band1', 'sq1', 'dot']), bareFirst: true,
    solveTex: [`${dt(lo, 1)}^2 = ${sqStr(lo, 1)} < ${N} < ${sqStr(lo + 1n, 1)} = ${dt(lo + 1n, 1)}^2`, `${dt(lo, 1)} < \\sqrt{${N}} < ${dt(lo + 1n, 1)}`],
    solution: [`Check by squaring: ${dh(lo, 1)}² = ${sqStr(lo, 1)} and ${dh(lo + 1n, 1)}² = ${sqStr(lo + 1n, 1)}.`, `So ${dh(lo, 1)} < ${rad(N)} < ${dh(lo + 1n, 1)}. Roots are not spread evenly between the squares, so “the same fraction of the way” misleads.`],
  }, [
    { t: `No: squaring shows ${dh(lo, 1)} < ${rad(N)} < ${dh(lo + 1n, 1)}.`, ok: true, say: `Right: ${dh(lo, 1)}² = ${sqStr(lo, 1)} < ${N} < ${sqStr(lo + 1n, 1)}.` },
    { t: `Yes: the root moves the same fraction of the way as ${N} does.`, ok: false, mc: MC.interp, say: `Test it by squaring: ${decStr(BigInt(tLo + 1), 1)}² = ${sqStr(BigInt(tLo + 1), 1)}, ${cmpDec(x, BigInt(tLo + 1), 1) > 0 ? `still under ${N}` : `over ${N}`}. Roots do not move in step with the number under them.` },
    { t: 'Yes: it is close enough to count.', ok: false, mc: MC.closeTrial, say: `Close is not a bound. A bound must be checked by squaring: ${dh(lo, 1)}² = ${sqStr(lo, 1)} < ${N} < ${sqStr(lo + 1n, 1)}.` },
  ]);
};
const roundRoot: Gen = (R, n) => {
  const v = int(R, 0, 2);
  if (v === 0) {
    // a root to the nearest whole number, by the midpoint square
    const N = nonSquare(R, 3, 224), k = isqrt(N), x = sqrt(N), up = roundTo(x, 0), mid = `${k}.5`, midSq = decStr(BigInt(2 * k + 1) ** 2n * 25n, 2, true);   // (k + 0.5)² = (2k + 1)² / 4
    return {
      id: `roundRoot-${n}`, family: 'roundRoot', prompt: `${k} < ${rad(N)} < ${k + 1}. Round ${A(rad(N))} to ${ROUNDW(0)}. (Hint: ${mid}² = ${midSq}.)`,
      board: `\\sqrt{${N}} \\approx \\,?`, input: 'num',
      pic: zoomPic({ x, name: `\\sqrt{${N}}`, levels: 2, squares: true }, ['axis', 'name', 'band0', 'sq0'], ['zoom1', 'mid', 'band1', 'dot']),
      solveTex: [`${mid}^2 = ${midSq} ${N < (k + 0.5) ** 2 ? '>' : '<'} ${N}`, `\\sqrt{${N}} \\approx ${up}`],
      solution: [`The halfway point between ${k} and ${k + 1} is ${mid}, and ${mid}² = ${midSq}.`, `${N} is ${N < (k + 0.5) ** 2 ? 'below' : 'above'} ${midSq}, so ${rad(N)} is ${N < (k + 0.5) ** 2 ? 'below' : 'above'} ${mid}: it rounds to ${up}.`],
      answer: { kind: 'num', v: Number(up) },
      check: r => {
        const a = needNum(r);
        if (a === null) return { ok: false, say: 'Type a whole number.' };
        if (a === Number(up)) return { ok: true, say: `Yes: ${rad(N)} ≈ ${up}.` };
        if (a === k && Number(up) === k + 1) return { ok: false, mc: MC.truncates, say: `${k} cuts the root off. Compare with the midpoint: ${mid}² = ${midSq} < ${N}, so ${rad(N)} > ${mid}: it rounds UP to ${k + 1}.` };
        if (a === k + 1 && Number(up) === k) return { ok: false, say: `${mid}² = ${midSq} > ${N}, so ${rad(N)} is below ${mid}: it rounds to ${k}.` };
        return { ok: false, say: `${k} < ${rad(N)} < ${k + 1}; ${mid}² = ${midSq} tells which half: ${rad(N)} ≈ ${up}.` };
      },
    };
  }
  // a fraction, a root or pi to the nearest tenth or hundredth (the next digit decides)
  const L = pick(R, [1, 2]);
  const pool: { x: Real; h: string; t: string }[] = [
    ...([[2, 3], [5, 6], [1, 6], [7, 9], [5, 7], [4, 7], [8, 9], [7, 12], [3, 7], [5, 11]] as [number, number][]).map(([p, q]) => ({ x: frac(p, q), h: fr(p, q), t: `\\tfrac{${p}}{${q}}` })),
    ...[2, 3, 5, 6, 7, 8, 10, 11, 13, 15, 17, 19].map(a => ({ x: sqrt(a), h: rad(a), t: `\\sqrt{${a}}` })),
    { x: PI, h: 'π', t: '\\pi' },
  ];
  let c = pick(R, pool), guard = 0;
  while ((roundTo(c.x, L) === floorScaled(c.x, L) && R() < 0.6) && guard++ < 20) c = pick(R, pool);   // more items where truncating is wrong
  const up = roundTo(c.x, L), lo = floorScaled(c.x, L);
  return {
    id: `roundRoot-${n}`, family: 'roundRoot', prompt: `${c.h} = ${digits(c.x, L + 2)}… Round it to ${ROUNDW(L)}.`,
    board: `${c.t} \\approx \\,?`, input: 'num',
    pic: zoomPic({ x: c.x, name: c.t, levels: 2, from: L }, ['axis', 'name', 'band0'], ['zoom1', 'mid', 'band1', 'dot']),
    solveTex: [`${c.t} = ${digits(c.x, L + 2)}{\\ldots}`, `${c.t} \\approx ${dt(up, L)}`],
    solution: [`Look at the digit after the ${PLACE[L]}s: ${digits(c.x, L + 1).slice(-1)}.`, `It is ${Number(digits(c.x, L + 1).slice(-1)) >= 5 ? '5 or more, so round up' : 'less than 5, so keep the digit'}: ${c.h} ≈ ${dh(up, L)}.`],
    answer: { kind: 'num', v: Number(dt(up, L)) },
    check: r => {
      const a = needNum(r);
      if (a === null) return { ok: false, say: 'Type a decimal.' };
      const t = fromTyped(a, 6);
      if (t && decEq(t[0], t[1], up, L)) return { ok: true, say: `Yes: ${c.h} ≈ ${dh(up, L)}.` };
      if (t && up !== lo && decEq(t[0], t[1], lo, L)) return { ok: false, mc: MC.truncates, say: `That cuts the digits off. The next digit is ${digits(c.x, L + 1).slice(-1)}, 5 or more, so round up: ${dh(up, L)}.` };
      return { ok: false, say: `${c.h} = ${digits(c.x, L + 2)}…, which rounds to ${dh(up, L)}.` };
    },
  };
};
const settles: Gen = (R, n) => {
  const a = pick(R, [2, 3, 5, 6, 7, 8, 10, 11, 12, 13, 14, 15, 17, 18, 19, 20]), x = sqrt(a), L = pick(R, [1, 2]);
  const fine = R() < 0.5;
  const M = fine ? L + 1 : L;
  const lo = floorScaled(x, M), hi = lo + 1n, up = roundTo(x, L);
  const midStr = decStr(floorScaled(x, L) * 10n + 5n, L + 1);
  const crosses = !fine;
  return choice(R, {
    id: `settles-${n}`, family: 'settles', prompt: `You know ${dh(lo, M)} < ${rad(a)} < ${dh(hi, M)}. Is that enough to round ${rad(a)} to ${ROUNDW(L)}?`,
    board: `${dt(lo, M)} < \\sqrt{${a}} < ${dt(hi, M)}`, solveTex: [`\\text{midpoint } ${midStr}`, crosses ? `${dt(lo, M)} < ${midStr} < ${dt(hi, M)}` : `\\sqrt{${a}} \\approx ${dt(up, L)}`],
    pic: zoomPic({ x, name: `\\sqrt{${a}}`, levels: 2, from: L }, ['axis', 'name', 'band0'], ['zoom1', 'mid', 'band1']), bareFirst: true,
    solution: [`Rounding to ${ROUNDW(L)} turns at the midpoint ${midStr}.`, crosses ? `The interval from ${dh(lo, M)} to ${dh(hi, M)} contains ${midStr}, so ${rad(a)} could be on either side: not settled. Zoom one more place.` : `The whole interval is on one side of ${midStr}, so every number in it rounds to ${dh(up, L)}.`],
  }, crosses ? [
    { t: `No: the interval crosses ${midStr}, so it could round either way.`, ok: true, say: 'Right: you need one more digit.' },
    { t: `Yes: it is ${dh(lo, M)}, the lower end.`, ok: false, mc: MC.truncates, say: `The lower end is ${rad(a)} cut off, not rounded. Both ${dh(lo, M)} and ${dh(hi, M)} are possible: the interval crosses ${midStr}.` },
    { t: `Yes: the interval is only one ${PLACE[L]} wide.`, ok: false, mc: MC.notSettled, say: `Narrow is not enough: the interval contains the rounding midpoint ${midStr}, so some of it rounds down and some up.` },
  ] : [
    { t: `Yes: ${dh(up, L)}. The whole interval is on one side of ${midStr}.`, ok: true, say: 'Right: the bounds settle it.' },
    { t: 'No: you can never round a number whose digits never end.', ok: false, mc: MC.noExact, say: `You can, once the bounds are on one side of the midpoint ${midStr}: here every number in the interval rounds to ${dh(up, L)}.` },
    { t: `Yes: ${dh(up === floorScaled(x, L) ? up + 1n : up - 1n, L)}.`, ok: false, mc: up === floorScaled(x, L) ? undefined : MC.truncates, say: `Compare with the midpoint ${midStr}: the interval is ${up === floorScaled(x, L) ? 'below' : 'above'} it, so ${rad(a)} ≈ ${dh(up, L)}.` },
  ]);
};
const locate: Gen = (R, n) => {
  const v = int(R, 0, 2);
  let x: Real, name: string, h: string, from = 0;
  if (v === 0) { const N = nonSquare(R, 3, 200), neg = R() < 0.3; x = sqrt(N, 1, neg ? -1 : 1); name = `${neg ? '-' : ''}\\sqrt{${N}}`; h = `${neg ? MINUS : ''}${rad(N)}`; }
  else if (v === 1) { x = PI; name = '\\pi'; h = 'π'; from = 1; }
  else { const N = pick(R, [2, 3, 5, 6, 7, 8, 10, 11, 12, 13, 14, 15]); x = sqrt(N); name = `\\sqrt{${N}}`; h = rad(N); from = 1; }
  const L = from, step = 10 ** -L, fv = approx(x), F = Number(floorScaled(x, L));
  // the line: 4 whole steps around x, or the tenths of [k, k+1]
  const w0 = L === 0 ? Math.max(-16, Math.min(F - int(R, 1, 2), 12)) : Math.floor(fv);
  const window: [number, number] | undefined = L === 0 ? [w0, w0 + 4] : undefined;
  const lineLo = w0, lineHi = L === 0 ? w0 + 4 : w0 + 1, span = lineHi - lineLo, gap = 0.09 * span;
  // wrong points: the nearest tick (the rounded value as if exact), the mirror in its interval, another interval
  const cands: { at: number; mc?: string; why: string }[] = [
    { at: Number(roundTo(x, L)) * step, mc: MC.roundedExact, why: `That point is exactly ${hNum(decStr(roundTo(x, L), L))}; ${h} only rounds to it.` },
    { at: (2 * F + 1) * step - fv, why: `That point is in the right interval but on the wrong side of its middle.` },
    { at: fv + step * (1 + R() * 0.6), why: 'That point is in the next interval up.' },
    { at: fv - step * (1 + R() * 0.6), why: 'That point is in the interval below.' },
    ...(fv < 0 ? [{ at: -fv, why: `That point is ${rad((x as { a: number }).a)}, the opposite.` }] : []),
  ];
  const inside = (at: number) => at > lineLo + 0.05 * span && at < lineHi - 0.05 * span;
  const kept: { at: number; ok: boolean; mc?: string; why?: string }[] = [{ at: fv, ok: true }];
  for (const c of shuffle(R, cands)) if (kept.length < 4 && inside(c.at) && kept.every(k => Math.abs(k.at - c.at) >= gap)) kept.push({ ...c, ok: false });
  for (let t = 0; kept.length < 3 && t < 40; t++) { const at = lineLo + span * (0.08 + 0.84 * R()); if (kept.every(k => Math.abs(k.at - at) >= gap)) kept.push({ at, ok: false, why: `That point is at about ${at.toFixed(L + 1)}.` }); }
  kept.sort((a, b) => a.at - b.at);
  const letters = ['A', 'B', 'C', 'D'];
  const marks = kept.map((p, i) => ({ t: letters[i]!, x: p.ok ? x : frac(Math.round(p.at * 1000), 1000), p }));
  const rightL = marks.find(m => m.p.ok)!.t;
  const bb = bounds2(x, L + 1);
  const opts: Opt[] = marks.map(m => (m.p.ok ? { t: `Point ${m.t}`, ok: true, say: `Yes: ${h} = ${digits(x, L + 2)}…, so it is at ${m.t}.` } : { t: `Point ${m.t}`, ok: false, mc: m.p.mc, say: `${m.p.why} ${h} = ${digits(x, L + 2)}…: it is at ${rightL}.` }));
  opts.push({ t: 'None: its digits never end, so it has no exact point', ok: false, mc: MC.noExact, say: `It has one exact point: every zoom closes in on it. ${h} is at ${rightL}.` });
  const k = Math.floor(Math.abs(fv));
  return choice(R, {
    id: `locate-${n}`, family: 'locate', prompt: `Which point is ${A(h)}?`, board: name,
    pic: zoomPic({ x, name, levels: 1, from, window, marks: marks.map(m => ({ t: m.t, x: m.x })) }, ['axis', 'marks'], ['dot']),
    solveTex: [`${bb[0]} < ${name} < ${bb[1]}`],
    solution: [x.kind === 'sqrt' ? `${k}² = ${k * k} and ${k + 1}² = ${(k + 1) ** 2}, and more exactly ${h} = ${digits(x, L + 2)}…` : `π = 3.14159…`, `So ${hNum(bb[0])} < ${h} < ${hNum(bb[1])}: on this line that is point ${rightL}.`],
  }, opts, true);
};
function bounds2(x: Real, L: number): [string, string] { const F = floorScaled(x, L); return [decStr(F, L), decStr(F + 1n, L)]; }

// =====================================================================================================
// order-reals
// =====================================================================================================
interface CmpCase { a: Num; b: Num; why: string }
function cmpCase(R: () => number): CmpCase {
  const v = int(R, 0, 5);
  if (v === 0) return { a: PIn, b: pick(R, [Fr(22, 7), Dc('3.14'), Dc('3.1416'), RpK({ int: 3, pre: '', rep: '1' }), Dc('3.142')]), why: 'π = 3.14159…' };
  if (v === 1 || v === 2) {
    // sqrt(N) against a nearby decimal on the other side of what comparing N with d suggests
    const N = nonSquare(R, 2, 120), x = sqrt(N), L = pick(R, [1, 2]), lo = floorScaled(x, L);
    const d = R() < 0.6 ? lo + 1n : lo;
    return { a: Sq(N), b: Dc(decStr(d, L)), why: `${dh(d, L)}² = ${sqStr(d, L)}` };
  }
  if (v === 3) {
    const N = nonSquare(R, 2, 99), x = sqrt(N), lo = floorScaled(x, 1), d = R() < 0.5 ? lo : lo + 1n;
    return { a: Sq(N, -1), b: Dc(`-${decStr(d, 1)}`), why: `${dh(d, 1)}² = ${sqStr(d, 1)}` };
  }
  if (v === 4) { const N = pick(R, [2, 3, 5]); const x = sqrt(N); const d = floorScaled(x, 2); return { a: Sq(N), b: Dc(decStr(R() < 0.5 ? d : d + 1n, 2)), why: `${rad(N)} = ${digits(x, 4)}…` }; }
  const [p, q] = pick(R, [[2, 3], [5, 6], [1, 3], [7, 9]] as [number, number][]), r = fracToRep(p, q);
  return { a: Fr(p, q), b: Dc(digits(frac(p, q), 2)), why: `${fr(p, q)} = ${repDotsHtml(r, 4)}` };
}
const compare: Gen = (R, n) => {
  const c = cmpCase(R), s = cmpReal(c.a.x!, c.b.x!), sym = s < 0 ? '<' : s > 0 ? '>' : '=';
  const opts: Opt[] = ['<', '=', '>'].map(t => {
    if (t === sym) return { t, ok: true, say: `Yes: ${c.a.html} ${t === '<' ? '&lt;' : t === '>' ? '&gt;' : '='} ${c.b.html}. ${c.why}.` };
    let mc: string | undefined;
    if (t === '=' && c.a.kind === 'pi') mc = MC.pi314;
    else if (t === '=' && (c.a.kind === 'sqrt' || c.a.kind === 'frac')) mc = MC.equalRounded;
    else if (c.a.kind === 'sqrt' && c.a.x!.kind === 'sqrt' && c.a.x!.sign > 0 && t === '>' && sym === '<') mc = MC.radicandVsDec;
    else if (c.a.kind === 'sqrt' && c.a.x!.kind === 'sqrt' && c.a.x!.sign < 0) mc = MC.negMagnitude;
    return { t, ok: false, mc, say: `${c.why}, so ${c.a.html} ${sym === '<' ? '&lt;' : sym === '>' ? '&gt;' : '='} ${c.b.html}.${mc === MC.radicandVsDec ? ` Compare the ROOT with ${c.b.html}, not ${(c.a.x as { a: number }).a}.` : ''}${mc === MC.negMagnitude ? ' For negatives, the one closer to 0 is bigger.' : ''}` };
  });
  return choice(R, {
    id: `compare-${n}`, family: 'compare', prompt: `Which sign goes in the box? ${A(c.a.html)} ☐ ${B(c.b.html)}`, board: `${c.a.tex} \\ \\square\\ ${c.b.tex}`,
    solveTex: [`${c.a.tex} ${sym} ${c.b.tex}`], solution: [`${c.why}.`, `So ${c.a.html} ${sym === '<' ? '&lt;' : sym === '>' ? '&gt;' : '='} ${c.b.html}.`],
  }, opts, true);
};
const order: Gen = (R, n) => {
  // three or four numbers between -15 and 15, mixed forms
  for (let tries = 0; tries < 50; tries++) {
    const pool: Num[] = [];
    const N1 = nonSquare(R, 2, 60), k1 = isqrt(N1);
    pool.push(Sq(N1));
    pool.push(Dc(decStr(floorScaled(sqrt(N1), 1) + (R() < 0.5 ? 1n : 0n), 1)));                                // a decimal next to the root
    pool.push(pick(R, [PIn, Fr(22, 7), RpK({ int: 0, pre: '', rep: '6' }), Fr(7, 3), Dc('-2.2'), Sq(5, -1), I(k1 + 1), Dc(String(N1 > 20 ? k1 - 2 : k1 + 2))]));
    if (R() < 0.5) pool.push(pick(R, [Sq(10, -1), Dc('-3.2'), Fr(-5, 2), Sq(3), Dc('1.7')]));
    const texs = new Set(pool.map(p => p.tex));
    if (texs.size !== pool.length) continue;
    const xs = pool.map(p => p.x!);
    let distinct = true;
    for (let i = 0; i < xs.length; i++) for (let j = i + 1; j < xs.length; j++) if (cmpReal(xs[i]!, xs[j]!) === 0) distinct = false;
    if (!distinct) continue;
    const right = pool.slice().sort((a, b) => cmpReal(a.x!, b.x!));
    // a wrong order from the radicand (sqrt n placed as if it were n), and from negative magnitudes
    const face = (p: Num) => (p.kind === 'sqrt' ? (p.x as { a: number; sign: number }).sign * (p.x as { a: number }).a : approx(p.x!));
    const byFace = pool.slice().sort((a, b) => face(a) - face(b));
    const byMag = pool.slice().sort((a, b) => Math.abs(approx(a.x!)) - Math.abs(approx(b.x!)));
    const str = (L: Num[]) => L.map(p => p.html).join(', &nbsp;');
    const lists: Opt[] = [{ t: str(right), ok: true, say: 'Yes: least to greatest.' }];
    if (str(byFace) !== str(right)) lists.push({ t: str(byFace), ok: false, mc: MC.radicandVsDec, say: `${rad(N1)} is about ${digits(sqrt(N1), 2)}, not ${N1}: compare the root, not the number under it.` });
    if (str(byMag) !== str(right) && !lists.some(l => l.t === str(byMag)) && pool.some(p => approx(p.x!) < 0)) lists.push({ t: str(byMag), ok: false, mc: MC.negMagnitude, say: 'For negative numbers, the one farther from 0 is SMALLER.' });
    while (lists.length < 3) {
      const sw = right.slice(); const i = int(R, 0, sw.length - 2); [sw[i], sw[i + 1]] = [sw[i + 1]!, sw[i]!];
      if (!lists.some(l => l.t === str(sw))) lists.push({ t: str(sw), ok: false, say: `Check ${sw[i]!.html} and ${sw[i + 1]!.html} again: write each as a decimal (${digits(sw[i]!.x!, 3)}… and ${digits(sw[i + 1]!.x!, 3)}…).` });
    }
    return choice(R, {
      id: `order-${n}`, family: 'order', prompt: 'Which list goes from least to greatest?', board: pool.map(p => p.tex).join(',\\ \\ '),
      solveTex: [right.map(p => p.tex).join(' < ')],
      solution: [`As decimals: ${pool.map(p => `${p.html} ≈ ${digits(p.x!, 3)}`).join(', ')}.`, `So: ${right.map(p => p.html).join(' &lt; ')}.`],
    }, lists.slice(0, 4));
  }
  throw new Error('order: no list found');
};

// =====================================================================================================
// estimate-expressions
// =====================================================================================================
const mulD = (a: [bigint, number], b: [bigint, number]): [bigint, number] => [a[0] * b[0], a[1] + b[1]];
const addD = (a: [bigint, number], b: [bigint, number]): [bigint, number] => { const L = Math.max(a[1], b[1]); return [a[0] * P10(L - a[1]) + b[0] * P10(L - b[1]), L]; };
const int2 = (k: number): [bigint, number] => [BigInt(k), 0];
const roundD = (d: [bigint, number], L: number): bigint => { if (d[1] <= L) return d[0] * P10(L - d[1]); const s = d[0] < 0n ? -1n : 1n, m = d[0] * s; return s * fdiv(m + 5n * P10(d[1] - L - 1), P10(d[1] - L)); };
const estimate: Gen = (R, n) => {
  const v = int(R, 0, 5);
  let e: { h: string; t: string; d: [bigint, number]; given: string; L: number; wrong: { v: [bigint, number]; mc: string; say: string }[]; steps: string[] };
  if (v === 0) {
    const L = pick(R, [0, 1]), pv: [bigint, number] = L === 0 ? [3n, 0] : [314n, 2];
    const sq = mulD(pv, pv);
    e = { h: 'π²', t: '\\pi^2', d: sq, given: `π ≈ ${decStr(pv[0], pv[1])}`, L, wrong: [{ v: mulD(pv, int2(2)), mc: MC.powerTimes, say: `π² means π × π, not 2 × π.` }], steps: [`${decStr(pv[0], pv[1])} × ${decStr(pv[0], pv[1])} = ${decStr(sq[0], sq[1])}`] };
  } else if (v === 1) {
    const m = int(R, 2, 5), a = pick(R, [2, 3, 5, 7]), c = int(R, 1, 9), av = parseDec(digits(sqrt(a), 2)) as [bigint, number];
    const d = addD(mulD(int2(m), av), int2(c));
    const inside = parseDec(digits(sqrt(m * a), 2)) as [bigint, number];
    e = { h: `${m}${rad(a)} + ${c}`, t: `${m}\\sqrt{${a}} + ${c}`, d, given: `${rad(a)} ≈ ${digits(sqrt(a), 2)}`, L: 1,
      wrong: [{ v: addD(inside, int2(c)), mc: MC.coefInside, say: `${m}${rad(a)} is ${m} × ${rad(a)}, not ${rad(m * a)}.` }], steps: [`${m} × ${digits(sqrt(a), 2)} = ${decStr(mulD(int2(m), av)[0], 2)}`, `${decStr(mulD(int2(m), av)[0], 2)} + ${c} = ${decStr(d[0], d[1])}`] };
  } else if (v === 2) {
    const [a, b] = pick(R, [[2, 3], [2, 5], [3, 5], [2, 7], [3, 7]] as [number, number][]);
    const av = parseDec(digits(sqrt(a), 2)) as [bigint, number], bv = parseDec(digits(sqrt(b), 2)) as [bigint, number], d = addD(av, bv);
    const wrongV = parseDec(digits(sqrt(a + b), 2)) as [bigint, number];
    e = { h: `${rad(a)} + ${rad(b)}`, t: `\\sqrt{${a}} + \\sqrt{${b}}`, d, given: `${rad(a)} ≈ ${digits(sqrt(a), 2)} and ${rad(b)} ≈ ${digits(sqrt(b), 2)}`, L: 1,
      wrong: [{ v: wrongV, mc: MC.addsRadicands, say: `${rad(a)} + ${rad(b)} is not ${rad(a + b)}: add the two roots, ${digits(sqrt(a), 2)} + ${digits(sqrt(b), 2)}.` }], steps: [`${digits(sqrt(a), 2)} + ${digits(sqrt(b), 2)} = ${decStr(d[0], d[1])}`] };
  } else if (v === 3) {
    const r = int(R, 2, 9), pv: [bigint, number] = [314n, 2], d = mulD(int2(r * r), pv);
    e = { h: `π × ${r}²`, t: `\\pi \\times ${r}^2`, d, given: 'π ≈ 3.14 (the area of a circle of radius ' + r + ' in is π × ' + r + '² sq in)', L: 1,
      wrong: [{ v: mulD(int2(2 * r), pv), mc: MC.powerTimes, say: `${r}² is ${r} × ${r} = ${r * r}, not ${2 * r}.` }], steps: [`${r}^2 = ${r * r}`, `${r * r} × 3.14 = ${decStr(d[0], d[1])}`] };
  } else if (v === 4) {
    const k = int(R, 2, 12), pv: [bigint, number] = [314n, 2], d = mulD(int2(k), pv);
    e = { h: `${k}π`, t: `${k}\\pi`, d, given: 'π ≈ 3.14', L: 0, wrong: [], steps: [`${k} × 3.14 = ${decStr(d[0], d[1])}`] };
  } else {
    const a = pick(R, [2, 3, 5]), c = int(R, 1, 6), av = parseDec(digits(sqrt(a), 2)) as [bigint, number], d = addD(av, int2(c));
    e = { h: `${rad(a)} + ${c}`, t: `\\sqrt{${a}} + ${c}`, d, given: `${rad(a)} ≈ ${digits(sqrt(a), 2)}`, L: 1, wrong: [{ v: parseDec(digits(sqrt(a + c), 2)) as [bigint, number], mc: MC.addsRadicands, say: `${rad(a)} + ${c} is not ${rad(a + c)}: add ${c} to the root.` }], steps: [`${digits(sqrt(a), 2)} + ${c} = ${decStr(d[0], d[1])}`] };
  }
  const ans = roundD(e.d, e.L);
  return {
    id: `estimate-${n}`, family: 'estimate', prompt: `Use ${e.given} to estimate ${A(e.h)} to ${ROUNDW(e.L)}.`,
    board: `${e.t} \\approx \\,?`, input: 'num', solveTex: [...e.steps.map(s => s.replace(/×/g, '\\times')), `${e.t} \\approx ${decStr(ans, e.L)}`],
    solution: [...e.steps.map(s => s.replace(/\^2/g, '²')), `To ${ROUNDW(e.L)}: ${e.h} ≈ ${decStr(ans, e.L)}. It is an estimate (≈), built from rounded inputs.`],
    answer: { kind: 'num', v: Number(decStr(ans, e.L)) },
    check: r => {
      const a = needNum(r); const t = a === null ? null : fromTyped(a, 8);
      if (!t) return { ok: false, say: 'Type a number.' };
      if (decEq(t[0], t[1], ans, e.L)) return { ok: true, say: `Yes: ${e.h} ≈ ${decStr(ans, e.L)}.` };
      if (decEq(t[0], t[1], e.d[0], e.d[1])) return { ok: false, say: `That is the unrounded estimate. To ${ROUNDW(e.L)} it is ${decStr(ans, e.L)}.` };
      for (const w of e.wrong) if (decEq(t[0], t[1], w.v[0], w.v[1]) || decEq(t[0], t[1], roundD(w.v, e.L), e.L)) return { ok: false, mc: w.mc, say: `${w.say} ${e.h} ≈ ${decStr(ans, e.L)}.` };
      return { ok: false, say: `${e.steps.join('; ').replace(/\^2/g, '²')}: ${e.h} ≈ ${decStr(ans, e.L)}.` };
    },
  };
};

// =====================================================================================================
// exact-vs-approx
// =====================================================================================================
interface EqCase { a: string; aT: string; b: string; bT: string; exact: boolean; why: string; mcEq?: string }
const EQS: EqCase[] = [
  { a: fr(1, 8), aT: '\\tfrac{1}{8}', b: '0.125', bT: '0.125', exact: true, why: '1 ÷ 8 = 0.125 exactly: the division ends' },
  { a: fr(3, 4), aT: '\\tfrac{3}{4}', b: '0.75', bT: '0.75', exact: true, why: '3 ÷ 4 = 0.75 exactly' },
  { a: fr(1, 3), aT: '\\tfrac{1}{3}', b: `0.${ov('3')}`, bT: '0.\\overline{3}', exact: true, why: 'the bar means the 3s never stop: 0.333… IS 1/3' },
  { a: fr(5, 11), aT: '\\tfrac{5}{11}', b: `0.${ov('45')}`, bT: '0.\\overline{45}', exact: true, why: '5 ÷ 11 = 0.454545… forever' },
  { a: rad(16), aT: '\\sqrt{16}', b: '4', bT: '4', exact: true, why: '4 × 4 = 16' },
  { a: fr(7, 20), aT: '\\tfrac{7}{20}', b: '0.35', bT: '0.35', exact: true, why: '7/20 = 35/100 = 0.35' },
  { a: fr(1, 3), aT: '\\tfrac{1}{3}', b: '0.333', bT: '0.333', exact: false, why: '0.333 stops; 1/3 = 0.333… goes on, so 0.333 is a bit less' },
  { a: fr(2, 3), aT: '\\tfrac{2}{3}', b: '0.667', bT: '0.667', exact: false, why: '2/3 = 0.666…; 0.667 is rounded' },
  { a: rad(2), aT: '\\sqrt{2}', b: '1.414', bT: '1.414', exact: false, why: '1.414² = 1.999396, not 2' },
  { a: rad(3), aT: '\\sqrt{3}', b: '1.732', bT: '1.732', exact: false, why: '1.732² = 2.999824, not 3' },
  { a: 'π', aT: '\\pi', b: '3.14', bT: '3.14', exact: false, why: 'π = 3.14159…; 3.14 is cut off', mcEq: MC.pi314 },
  { a: 'π', aT: '\\pi', b: fr(22, 7), bT: '\\tfrac{22}{7}', exact: false, why: '22/7 = 3.1428…, π = 3.1415…', mcEq: MC.pi314 },
  { a: rad(5), aT: '\\sqrt{5}', b: '2.236', bT: '2.236', exact: false, why: '2.236² = 4.999696, not 5' },
  { a: fr(5, 6), aT: '\\tfrac{5}{6}', b: '0.83', bT: '0.83', exact: false, why: '5/6 = 0.8333…; 0.83 is cut off' },
];
const exactOrNot: Gen = (R, n) => {
  const e = pick(R, EQS), irr = e.a.includes('rad') || e.a === 'π';
  const opts: Opt[] = e.exact ? [
    { t: `=: they are exactly the same number`, ok: true, say: `Yes: ${e.why}.` },
    { t: `≈: a decimal can never equal a fraction exactly`, ok: false, mc: MC.allDecInexact, say: `It can: ${e.why}. So ${e.a} = ${e.b}.` },
    { t: `≈: ${e.b} is only rounded`, ok: false, mc: e.b.includes('ov') ? MC.asApprox : MC.allDecInexact, say: `Nothing was rounded: ${e.why}. So ${e.a} = ${e.b}.` },
  ] : [
    { t: `≈: ${e.b} is only close to ${e.a}`, ok: true, say: `Yes: ${e.why}.` },
    { t: `=: they round to the same value`, ok: false, mc: e.mcEq ?? MC.roundedExact, say: `Rounding to the same value does not make them equal: ${e.why}.` },
    irr ? { t: `Neither: ${e.a} has no exact value at all`, ok: false, mc: MC.noExact, say: `${e.a} is an exact number (${e.a === 'π' ? 'circumference ÷ diameter' : 'the side of a square with that area'}); its decimal just never ends. ${e.b} is close to it: ≈.` }
      : { t: `=: ${e.b} is how you write ${e.a} as a decimal`, ok: false, mc: MC.truncFull, say: `${e.b} is a cut-off: ${e.why}. So ≈.` },
  ];
  return choice(R, {
    id: `exactOrNot-${n}`, family: 'exactOrNot', prompt: `Which sign is right between ${A(e.a)} and ${B(e.b)}?`, board: `${e.aT} \\ \\square\\ ${e.bT}`,
    solveTex: [`${e.aT} ${e.exact ? '=' : '\\approx'} ${e.bT}`], solution: [`${e.why.charAt(0).toUpperCase() + e.why.slice(1)}.`, e.exact ? `So ${e.a} = ${e.b}: exactly equal.` : `So ${e.a} ≈ ${e.b}: close, not equal.`],
  }, opts);
};

// =====================================================================================================
// error-from-bounds
// =====================================================================================================
const BOUNDED: { x: Real; h: string; t: string }[] = [
  { x: sqrt(2), h: rad(2), t: '\\sqrt{2}' }, { x: sqrt(3), h: rad(3), t: '\\sqrt{3}' }, { x: sqrt(5), h: rad(5), t: '\\sqrt{5}' }, { x: sqrt(7), h: rad(7), t: '\\sqrt{7}' },
  { x: sqrt(10), h: rad(10), t: '\\sqrt{10}' }, { x: sqrt(11), h: rad(11), t: '\\sqrt{11}' }, { x: PI, h: 'π', t: '\\pi' }, { x: sqrt(6), h: rad(6), t: '\\sqrt{6}' }, { x: sqrt(13), h: rad(13), t: '\\sqrt{13}' },
];
const maxError: Gen = (R, n) => {
  const c = pick(R, BOUNDED), L = pick(R, [1, 2, 3]), lo = floorScaled(c.x, L), who = pick(R, NAMES);
  const pad = int(R, 0, 2), use = decStr(lo * P10(pad), L + pad);
  const width = decStr(1n, L);
  return {
    id: `maxError-${n}`, family: 'maxError', prompt: `${who} knows ${dh(lo, L)} < ${c.h} < ${dh(lo + 1n, L)} and uses ${B(use)} for ${c.h}. The error is surely less than how much?`,
    board: `${dt(lo, L)} < ${c.t} < ${dt(lo + 1n, L)}`, input: 'num',
    pic: zoomPic({ x: c.x, name: c.t, levels: 1, from: L }, ['axis', 'name', 'band0'], ['dot']),
    solveTex: [`${dt(lo + 1n, L)} - ${dt(lo, L)} = ${width}`, `\\text{error} < ${width}`],
    solution: [`${c.h} is somewhere in the interval from ${dh(lo, L)} to ${dh(lo + 1n, L)}, and ${use} is its left end.`, `So the error is less than the width: ${dh(lo + 1n, L)} − ${dh(lo, L)} = ${mark(width)}.${pad ? ` The extra zeros in ${use} add no accuracy.` : ''}`],
    answer: { kind: 'num', v: Number(width) },
    check: r => {
      const a = needNum(r); const t = a === null ? null : fromTyped(a, 8);
      if (!t) return { ok: false, say: 'Type a decimal.' };
      if (decEq(t[0], t[1], 1n, L)) return { ok: true, say: `Yes: the interval is ${width} wide, so the error is less than ${width}.` };
      if (pad && decEq(t[0], t[1], 1n, L + pad)) return { ok: false, mc: MC.decLength, say: `Writing more digits (${use}) does not make it more accurate. The interval is ${width} wide: error < ${width}.` };
      if (decEq(t[0], t[1], 1n, L + 1) || decEq(t[0], t[1], 5n, L + 1)) return { ok: false, say: `The guarantee comes from the interval: from ${dh(lo, L)} to ${dh(lo + 1n, L)} is ${width}.` };
      return { ok: false, say: `${dh(lo + 1n, L)} − ${dh(lo, L)} = ${width}: the error is less than ${width}.` };
    },
  };
};
const howClose: Gen = (R, n) => {
  const v = int(R, 0, 1), who = pick(R, NAMES);
  if (v === 0) {
    const k = int(R, 4, 40), lo = BigInt(k * 314), hi = BigInt(k * 315), w = decStr(hi - lo, 2, true);
    return choice(R, {
      id: `howClose-${n}`, family: 'howClose', prompt: `${who} types ${k} × 3.14 for ${k}π, and the calculator shows ${B(decStr(lo, 2, true))}. Is that within 0.01 of ${k}π?`,
      board: `${decStr(lo, 2, true)} < ${k}\\pi < ${decStr(hi, 2, true)}`, solveTex: [`3.14 < \\pi < 3.15`, `${decStr(lo, 2, true)} < ${k}\\pi < ${decStr(hi, 2, true)}`],
      solution: [`3.14 < π < 3.15, so ${k} × 3.14 < ${k}π < ${k} × 3.15: ${decStr(lo, 2, true)} < ${k}π < ${decStr(hi, 2, true)}.`, `That interval is ${w} wide: the calculator's answer is only sure to be within ${w}.`],
    }, [
      { t: `Not for sure: 3.14 < π < 3.15 only puts ${k}π between ${decStr(lo, 2, true)} and ${decStr(hi, 2, true)}.`, ok: true, say: `Right: the error can be up to ${w}.` },
      { t: 'Yes: the calculator worked it out.', ok: false, mc: MC.calcCertifies, say: `The calculator only multiplied the 3.14 it was given. 3.14 is not π, so ${k} × 3.14 can be off by up to ${w}.` },
      { t: `Yes: it shows ${decStr(lo, 2, true).split('.')[1]?.length ?? 0} decimal places.`, ok: false, mc: MC.decLength, say: `How many digits are shown says nothing about how close it is: ${decStr(lo, 2, true)} < ${k}π < ${decStr(hi, 2, true)}.` },
    ]);
  }
  const c = pick(R, BOUNDED), lo = floorScaled(c.x, 2), use = decStr(lo * 100n + BigInt(int(R, 10, 99)), 4);
  return choice(R, {
    id: `howClose-${n}`, family: 'howClose', prompt: `${who} only knows ${dh(lo, 2)} < ${c.h} < ${dh(lo + 1n, 2)}, but writes ${c.h} ≈ ${B(use)}. How close is ${use} guaranteed to be?`,
    board: `${dt(lo, 2)} < ${c.t} < ${dt(lo + 1n, 2)}`, solveTex: [`\\text{width } 0.01`],
    solution: [`All ${who} knows is the interval from ${dh(lo, 2)} to ${dh(lo + 1n, 2)}, 0.01 wide.`, `${use} is inside it, so the error is under 0.01. The extra digits are not backed by anything.`],
  }, [
    { t: 'Within 0.01: that is all the interval guarantees.', ok: true, say: 'Right: digits beyond what you know add no accuracy.' },
    { t: 'Within 0.0001: it has four decimal places.', ok: false, mc: MC.decLength, say: `Four decimal places look precise, but ${who} only knows an interval 0.01 wide.` },
    { t: 'Exactly right: it is between the bounds.', ok: false, mc: MC.roundedExact, say: `Being inside the interval only makes it CLOSE: ${c.h} could be anywhere from ${dh(lo, 2)} to ${dh(lo + 1n, 2)}.` },
  ]);
};

// =====================================================================================================
// bound-expressions
// =====================================================================================================
interface BE { h: string; t: string; lo: [bigint, number]; hi: [bigint, number]; given: string; givenT: string; trueX: Real; steps: string[] }
function boundCase(R: () => number): BE {
  const v = int(R, 0, 3);
  if (v === 0) {
    const m = int(R, 2, 5), a = pick(R, [2, 3, 5, 7]), c = int(R, 1, 9), lo = floorScaled(sqrt(a), 3);
    const L: [bigint, number] = addD(mulD(int2(m), [lo, 3]), int2(c)), H: [bigint, number] = addD(mulD(int2(m), [lo + 1n, 3]), int2(c));
    return { h: `${m}${rad(a)} + ${c}`, t: `${m}\\sqrt{${a}} + ${c}`, lo: L, hi: H, given: `${dh(lo, 3)} < ${rad(a)} < ${dh(lo + 1n, 3)}`, givenT: `${dt(lo, 3)} < \\sqrt{${a}} < ${dt(lo + 1n, 3)}`, trueX: sqrt(a), steps: [`× ${m}: ${decStr(mulD(int2(m), [lo, 3])[0], 3)} < ${m}${rad(a)} < ${decStr(mulD(int2(m), [lo + 1n, 3])[0], 3)}`, `+ ${c}: ${decStr(L[0], L[1])} < ${m}${rad(a)} + ${c} < ${decStr(H[0], H[1])}`] };
  }
  if (v === 1) {
    const L: [bigint, number] = [314n * 314n, 4], H: [bigint, number] = [315n * 315n, 4];
    return { h: 'π²', t: '\\pi^2', lo: L, hi: H, given: '3.14 < π < 3.15', givenT: '3.14 < \\pi < 3.15', trueX: PI, steps: ['square both ends (they are positive): 3.14² = 9.8596 and 3.15² = 9.9225'] };
  }
  if (v === 2) {
    const k = int(R, 2, 30);
    return { h: `${k}π`, t: `${k}\\pi`, lo: [BigInt(k * 314), 2], hi: [BigInt(k * 315), 2], given: '3.14 < π < 3.15', givenT: '3.14 < \\pi < 3.15', trueX: PI, steps: [`× ${k}: ${decStr(BigInt(k * 314), 2)} < ${k}π < ${decStr(BigInt(k * 315), 2)}`] };
  }
  const [a, b] = pick(R, [[2, 3], [2, 5], [3, 5], [2, 7]] as [number, number][]), la = floorScaled(sqrt(a), 3), lb = floorScaled(sqrt(b), 3);
  return { h: `${rad(a)} + ${rad(b)}`, t: `\\sqrt{${a}} + \\sqrt{${b}}`, lo: [la + lb, 3], hi: [la + lb + 2n, 3], given: `${dh(la, 3)} < ${rad(a)} < ${dh(la + 1n, 3)} and ${dh(lb, 3)} < ${rad(b)} < ${dh(lb + 1n, 3)}`, givenT: `\\sqrt{${a}},\\ \\sqrt{${b}} \\text{ to 3 places}`, trueX: sqrt(a), steps: [`add the lower ends: ${dh(la, 3)} + ${dh(lb, 3)} = ${dh(la + lb, 3)}`, `add the upper ends: ${dh(la + 1n, 3)} + ${dh(lb + 1n, 3)} = ${dh(la + lb + 2n, 3)}`] };
}
const boundExpr: Gen = (R, n) => {
  const e = boundCase(R);
  const loS = decStr(e.lo[0], e.lo[1]), hiS = decStr(e.hi[0], e.hi[1]);
  return {
    id: `boundExpr-${n}`, family: 'boundExpr', prompt: `${e.given}. Carry the bounds through: between which two numbers is ${A(e.h)}?`,
    board: `\\square < ${e.t} < \\square`, input: 'pair', pairLead: '', pairOp: `&lt; ${e.h} &lt;`,
    solveTex: [`${loS} < ${e.t} < ${hiS}`], solution: [...e.steps, `So ${mark(loS)} &lt; ${e.h} &lt; ${mark(hiS)}.`, 'Multiplying by a positive number, adding, and squaring positive numbers keep the order, so the bounds carry through.'],
    answer: { kind: 'pair', x: Number(loS), y: Number(hiS) },
    check: r => {
      if (r.kind !== 'pair') return { ok: false, say: 'Type two decimals.' };
      const a = fromTyped(r.x, 8), b = fromTyped(r.y, 8);
      if (!a || !b) return { ok: false, say: 'Type two decimals.' };
      if (decEq(a[0], a[1], e.lo[0], e.lo[1]) && decEq(b[0], b[1], e.hi[0], e.hi[1])) return { ok: true, say: `Yes: ${loS} < ${e.h} < ${hiS}.` };
      if (decEq(a[0], a[1], e.hi[0], e.hi[1]) && decEq(b[0], b[1], e.lo[0], e.lo[1])) return { ok: false, mc: MC.roundUpOver, say: `Lower end with lower end: ${loS} < ${e.h} < ${hiS}.` };
      return { ok: false, say: `${e.steps.join('; ')}. So ${loS} < ${e.h} < ${hiS}.` };
    },
  };
};
const boundRound: Gen = (R, n) => {
  for (let t = 0; t < 40; t++) {
    const e = boundCase(R);
    const L = e.h.includes('π') && !e.h.includes('²') ? 0 : 1;
    // strict bounds: round a hair inside each end (31.40 < 10π < 31.50 all rounds to 31)
    const onMid = (d: [bigint, number]) => roundD([d[0] * 10n + 1n, d[1] + 1], L) !== roundD([d[0] * 10n - 1n, d[1] + 1], L);
    if (onMid(e.lo) || onMid(e.hi)) continue;   // an end exactly on a rounding midpoint (3.650, 31.50) is too fine a point for this item
    const rl = roundD([e.lo[0] * 10n + 1n, e.lo[1] + 1], L), rh = roundD([e.hi[0] * 10n - 1n, e.hi[1] + 1], L), loS = decStr(e.lo[0], e.lo[1]), hiS = decStr(e.hi[0], e.hi[1]);
    const settled = rl === rh;
    if (!settled && R() < 0.5) continue;
    const ans = decStr(rl, L);
    const opts: Opt[] = settled ? [
      { t: `${ans}: every number from ${loS} to ${hiS} rounds to ${ans}.`, ok: true, say: 'Right: the carried bounds settle it.' },
      { t: `Can't tell: the bounds are not the exact value.`, ok: false, mc: MC.noExact, say: `You don't need the exact value: the whole interval rounds the same way, to ${ans}.` },
    ] : [
      { t: `Can't tell yet: the interval crosses a rounding midpoint. Tighten the bounds.`, ok: true, say: `Right: ${loS} rounds to ${decStr(rl, L)} but ${hiS} rounds to ${decStr(rh, L)}.` },
      { t: `${decStr(rl, L)}: the lower bound rounds to it.`, ok: false, mc: MC.notSettled, say: `The upper bound rounds to ${decStr(rh, L)}: the interval crosses the midpoint, so it is not settled.` },
    ];
    // the rounded-inputs shortcut, when it gives another answer
    const quick = (() => {
      if (e.h.includes(rad(2)) || e.h.includes(rad(3)) || e.h.includes(rad(5)) || e.h.includes(rad(7))) {
        const m = /^(\d+)<span class="rad">√<span>(\d+)<\/span><\/span> \+ (\d+)$/.exec(e.h);
        if (m) { const a = Number(m[2]), mm = Number(m[1]), c = Number(m[3]); const ra = roundTo(sqrt(a), L); const val = addD(mulD(int2(mm), [ra, L]), int2(c)); return { v: roundD(val, L), say: `${rad(a)} ≈ ${decStr(ra, L)} gives ${mm} × ${decStr(ra, L)} + ${c} = ${decStr(val[0], val[1])}` }; }
      }
      if (e.h === 'π²') return { v: roundD(mulD([31n, 1], [31n, 1]), 1), say: 'π ≈ 3.1 gives 3.1² = 9.61' };
      return null;
    })();
    if (quick && decStr(quick.v, L) !== ans) opts.push({ t: `${decStr(quick.v, L)}: round the inputs first, then work it out.`, ok: false, mc: MC.roundedInputs, say: `${quick.say}, but rounding first loses accuracy. The carried bounds give ${loS} < ${e.h} < ${hiS}.` });
    else opts.push({ t: `${decStr(settled ? rl + 1n : rh + 1n, L)}: round up to be safe.`, ok: false, say: `Rounding goes to the NEAREST value: ${loS} < ${e.h} < ${hiS}.` });
    if (!opts.some(o => o.ok)) continue;
    const uniq = new Set(opts.map(o => o.t));
    if (uniq.size !== opts.length) continue;
    return choice(R, {
      id: `boundRound-${n}`, family: 'boundRound', prompt: `${e.given}, so ${loS} < ${e.h} < ${hiS}. What is ${A(e.h)} to ${ROUNDW(L)}?`,
      board: `${loS} < ${e.t} < ${hiS}`, solveTex: [settled ? `${e.t} \\approx ${ans}` : `${loS} \\to ${decStr(rl, L)},\\ ${hiS} \\to ${decStr(rh, L)}`],
      solution: [`Round both ends to ${ROUNDW(L)}: ${loS} → ${decStr(rl, L)} and ${hiS} → ${decStr(rh, L)}.`, settled ? `They agree, so ${e.h} ≈ ${ans}.` : 'They differ: the interval crosses a midpoint. Use tighter bounds (more decimal places) first.'],
    }, opts);
  }
  throw new Error('boundRound');
};
const notEqual: Gen = (R, n) => {
  const v = int(R, 0, 1);
  if (v === 0) {
    const [a, b] = pick(R, [[2, 3], [2, 5], [3, 5], [3, 7]] as [number, number][]), la = floorScaled(sqrt(a), 3), lb = floorScaled(sqrt(b), 3), lc = floorScaled(sqrt(a + b), 3);   // a + b never a square
    return choice(R, {
      id: `notEqual-${n}`, family: 'notEqual', prompt: `${dh(la, 3)} < ${rad(a)} < ${dh(la + 1n, 3)} and ${dh(lb, 3)} < ${rad(b)} < ${dh(lb + 1n, 3)}, and ${dh(lc, 3)} < ${rad(a + b)} < ${dh(lc + 1n, 3)}. Is ${A(`${rad(a)} + ${rad(b)}`)} equal to ${B(rad(a + b))}?`,
      board: `\\sqrt{${a}} + \\sqrt{${b}} \\overset{?}{=} \\sqrt{${a + b}}`, solveTex: [`${dt(la + lb, 3)} < \\sqrt{${a}} + \\sqrt{${b}} < ${dt(la + lb + 2n, 3)}`, `${dt(lc, 3)} < \\sqrt{${a + b}} < ${dt(lc + 1n, 3)}`],
      solution: [`Add the bounds: ${dh(la + lb, 3)} < ${rad(a)} + ${rad(b)} < ${dh(la + lb + 2n, 3)}.`, `${rad(a + b)} is below ${dh(lc + 1n, 3)}: the two intervals do not overlap, so the numbers are not equal.`],
    }, [
      { t: `No: ${rad(a)} + ${rad(b)} is above ${dh(la + lb, 3)}, and ${rad(a + b)} is below ${dh(lc + 1n, 3)}.`, ok: true, say: 'Right: intervals that do not overlap prove the numbers differ.' },
      { t: `Yes: ${rad(a)} + ${rad(b)} = ${rad(`${a} + ${b}`)}.`, ok: false, mc: MC.addsRadicands, say: `Roots don't add like that: ${rad(a)} + ${rad(b)} is more than ${dh(la + lb, 3)}, but ${rad(a + b)} is less than ${dh(lc + 1n, 3)}.` },
      { t: "Can't tell: the bounds are not exact values.", ok: false, mc: MC.noExact, say: 'Bounds are enough when the intervals do not overlap: every possible value of one is bigger than every possible value of the other.' },
    ]);
  }
  const c = int(R, 300, 900), w = int(R, 2, 6), d = int(R, 1, w - 1);
  const aLo = c - w, aHi = c + w, bLo = c + d - w, bHi = c + d + w;
  const s = (k: number) => decStr(BigInt(k), 3);
  const who = pick(R, NAMES);
  return choice(R, {
    id: `notEqual-${n}`, family: 'notEqual', prompt: `${who} knows ${s(aLo)} < A < ${s(aHi)} and ${s(bLo)} < B < ${s(bHi)}. The middles are ${s(c)} and ${s(c + d)}. Does that prove A ≠ B?`,
    board: `${s(aLo)} < A < ${s(aHi)},\\ \\ ${s(bLo)} < B < ${s(bHi)}`, solveTex: [`${s(bLo)} < ${s(aHi)}: \\text{overlap}`],
    solution: [`The intervals overlap from ${s(bLo)} to ${s(aHi)}.`, 'A and B could both be, say, in that overlap and be equal. Different middles prove nothing; only non-overlapping intervals prove ≠.'],
  }, [
    { t: `No: the intervals overlap (from ${s(bLo)} to ${s(aHi)}), so A and B could be equal.`, ok: true, say: 'Right.' },
    { t: 'Yes: their estimates are different.', ok: false, mc: MC.centers, say: `Different estimates are not enough: both could be ${s(Math.floor((bLo + aHi) / 2))}, inside both intervals.` },
    { t: 'Yes: B is always bigger, its interval starts higher.', ok: false, mc: MC.centers, say: `B's interval starts higher, but A can reach ${s(aHi)}, above B's start ${s(bLo)}: they overlap.` },
  ]);
};

// =====================================================================================================
// choose-precision
// =====================================================================================================
const decide: Gen = (R, n) => {
  const v = int(R, 0, 2), who = pick(R, NAMES);
  if (v === 0) {
    const a = pick(R, [2, 3, 5, 6, 7, 8, 10, 11, 12, 13]), x = sqrt(a), lo3 = floorScaled(x, 3);
    const fits = R() < 0.5, gap = fits ? lo3 + 1n + BigInt(int(R, 0, 3)) : lo3 - BigInt(int(R, 0, 2));
    const gapS = decStr(gap, 3, true), r2 = roundTo(x, 2);
    const early = decStr(r2, 2);
    const earlyFits = cmpDec(frac(Number(r2), 100), gap, 3) < 0;
    const opts: Opt[] = [
      { t: fits ? `Yes: ${rad(a)} < ${dh(lo3 + 1n, 3)} ≤ ${gapS}.` : `No: ${rad(a)} > ${dh(lo3, 3)} ≥ ${gapS}.`, ok: true, say: fits ? 'Right: the bound settles it.' : 'Right: the side is longer than the gap, even if only a little.' },
      { t: `${earlyFits ? 'Yes' : 'No'}: ${rad(a)} ≈ ${early}, and ${early} ${earlyFits ? '<' : '>'} ${gapS}.`, ok: false, mc: MC.earlyRound, say: `Rounding to hundredths too early hides the difference: you need ${rad(a)} to thousandths here (${dh(lo3, 3)} < ${rad(a)} < ${dh(lo3 + 1n, 3)}).` },
      { t: `Can't know: ${rad(a)} has no exact length.`, ok: false, mc: MC.noExact, say: `${rad(a)} ft is an exact length; you only need enough digits to compare: ${dh(lo3, 3)} < ${rad(a)} < ${dh(lo3 + 1n, 3)}.` },
    ];
    if (opts[1]!.t.startsWith(fits ? 'Yes' : 'No')) opts[1] = { t: `${fits ? 'No' : 'Yes'}: ${rad(a)} ≈ ${decStr(roundTo(x, 1), 1)}, close enough to ${gapS} to call it.`, ok: false, mc: MC.earlyRound, say: `Rounding to tenths throws away the digits that decide. ${dh(lo3, 3)} < ${rad(a)} < ${dh(lo3 + 1n, 3)} settles it.` };
    return choice(R, {
      id: `decide-${n}`, family: 'decide', prompt: `A square tabletop has an area of exactly ${A(`${a} sq ft`)}, so its side is ${rad(a)} ft. Will it slide through a gap ${B(`${gapS} ft`)} wide (edge first)?`,
      board: `\\sqrt{${a}}\\ \\text{ft} \\ \\square\\ ${gapS}\\ \\text{ft}`,
      pic: zoomPic({ x, name: `\\sqrt{${a}}`, levels: 1, from: 3 }, ['axis', 'name', 'band0'], ['dot']), bareFirst: true,
      solveTex: [`${dt(lo3, 3)} < \\sqrt{${a}} < ${dt(lo3 + 1n, 3)}`, `\\sqrt{${a}} ${fits ? '<' : '>'} ${gapS}`],
      solution: [`To compare with ${gapS}, you need ${rad(a)} to thousandths: ${dh(lo3, 3)} < ${rad(a)} < ${dh(lo3 + 1n, 3)}.`, fits ? `So the side is less than ${gapS} ft: it fits.` : `So the side is more than ${gapS} ft: it does not fit.`],
    }, opts);
  }
  if (v === 1) {
    const r = int(R, 3, 9), area = r * r, at314 = BigInt(area * 314), claim = decStr(at314, 2, true);
    return choice(R, {
      id: `decide-${n}`, family: 'decide', prompt: `A round pan has a radius of ${r} in, so its area is exactly ${A(`${area}π sq in`)} (A = πr²). Is the area more than ${B(`${claim} sq in`)}?`,
      board: `${area}\\pi \\ \\square\\ ${claim}`, solveTex: ['\\pi > 3.14', `${area}\\pi > ${area} \\times 3.14 = ${claim}`],
      solution: [`π = 3.14159…, so π > 3.14.`, `So ${area}π > ${area} × 3.14 = ${claim}: yes, a little more.`],
    }, [
      { t: `Yes: π > 3.14, so ${area}π > ${claim}.`, ok: true, say: 'Right: the exact area is a bit more than the 3.14 estimate.' },
      { t: `No: ${area}π = ${area} × 3.14 = ${claim} exactly.`, ok: false, mc: MC.pi314, say: `π is not 3.14: π = 3.14159…, so ${area}π is a little more than ${claim}.` },
      { t: "Can't know: π has no exact value.", ok: false, mc: MC.noExact, say: `π is exact; its digits just never end. π > 3.14 is enough to decide: ${area}π > ${claim}.` },
    ]);
  }
  const s10 = int(R, 12, 39), s = decStr(BigInt(s10), 1), sq = decStr(BigInt(s10 * s10), 2, true);
  const lo = decStr(BigInt(2 * s10 - 1) ** 2n, 4, true), hi = decStr(BigInt(2 * s10 + 1) ** 2n, 4, true);
  return choice(R, {
    id: `decide-${n}`, family: 'decide', prompt: `${who} measures the side of a square tile with a tape: ${B(`${s} ft`)}, to the nearest tenth. ${who} writes: “The area is exactly ${sq} sq ft.” Is that right?`,
    board: `${s}^2 = ${sq}`, solveTex: [`${decStr(BigInt(2 * s10 - 1), 2)} \\le \\text{side} < ${decStr(BigInt(2 * s10 + 1), 2)}`, `${lo} \\le \\text{area} < ${hi}`],
    solution: [`“${s} ft to the nearest tenth” means the side is somewhere from ${decStr(BigInt(2 * s10 - 1), 2)} to ${decStr(BigInt(2 * s10 + 1), 2)} ft.`, `So the area is somewhere from ${lo} to ${hi} sq ft: about ${sq}, not exactly.`],
  }, [
    { t: `No: ${s} ft is a rounded measurement, so the area is only about ${sq} sq ft.`, ok: true, say: 'Right: an exact answer needs exact inputs.' },
    { t: `Yes: ${s} × ${s} = ${sq}.`, ok: false, mc: MC.visualExact, say: `The arithmetic is right, but ${s} is a measurement rounded to tenths. The true area is between ${lo} and ${hi} sq ft.` },
    { t: `Yes, as long as it is rounded to ${decStr(roundTo(frac(s10 * s10, 100), 1), 1)}.`, ok: false, mc: MC.roundedExact, say: `Rounding does not make it exact either: the area is between ${lo} and ${hi} sq ft.` },
  ]);
};

const RAW_GENERATORS: Record<FamilyId, Gen> = {
  asQuotient, notRational, remainders, barNotation, addressOf, prefixWhere, rOrI, displayRead, innermost: innermostFam, setStatement,
  whichRational, rootFraction, toFraction, whichShift, generalMethod, bracket, refine, interpolate, roundRoot, settles, locate,
  compare, order, estimate, exactOrNot, maxError, howClose, boundExpr, boundRound, notEqual, decide,
};
/** the runtime's Gen type (practice.ts takes a record of these) */
/** "<" that does not open a tag, written as &lt; (the page shows the same; plain-text readers no longer cut the text) */
const ltSafe = (h: string) => h.replace(/<(?![a-zA-Z\/!])/g, '&lt;');
const safeText = (g: Gen): Gen => (R, n, sg) => {
  const it = g(R, n, sg);
  it.prompt = ltSafe(it.prompt);
  it.solution = it.solution.map(ltSafe);
  if (it.choices) it.choices = it.choices.map(ltSafe);
  if (it.pairLead) it.pairLead = ltSafe(it.pairLead);
  if (it.pairOp) it.pairOp = ltSafe(it.pairOp);
  return it;
};
export const GENERATORS = Object.fromEntries(Object.entries(RAW_GENERATORS).map(([k, g]) => [k, safeText(g)])) as Record<FamilyId, Gen>;
export const GENS: Readonly<Record<string, RtGen>> = GENERATORS;
export { S, isRational };
