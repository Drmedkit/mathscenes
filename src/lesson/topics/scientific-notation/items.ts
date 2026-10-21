// items.ts: exercise families for "scientific notation and order of magnitude" (grade 8, 8.EE.A.3 / 8.EE.A.4), made
// from templates, checked EXACTLY (sci.ts: BigInt decimals, never floats), and every wrong answer the classifier
// recognises tagged with its misconception id from math-curriculum-essentials/misconceptions.json (logged, never
// shown to the kid). A generator gets the SUB-GOAL it practises (plan.ts) and uses that sub-goal's cases.
// Pure: no DOM, no canvas. Pictures are data (PointHop / PowerLadder params, a calculator screen) the page draws.
import { type Gen as RtGen, type Item, type Response, type Verdict, A, B, S, int, pick, rng, shuffle } from '../../runtime/item';
import {
  type Dec, D, add, cmp, dec, div, eq, fromNumber, isCoef, isInt, mul, nH, nTex, neg, pH, pTex, plain, pow10, roundSig,
  sH, sTex, sciH, sciOf, sciTex, sciVal, sigDigits, sub, toNum,
} from './sci';
import { type HopParams, type HopStep, hopForSci } from './PointHop';
import type { Icon, LadderParams, LadderStep } from './PowerLadder';
export { rng };
export type { Response, Verdict };

export type FamilyId = 'isSci' | 'negMeaning' | 'toDecimal' | 'toSci' | 'renorm' | 'multiply' | 'divide' | 'addSame'
  | 'distribute' | 'align' | 'mixed' | 'sameNumber' | 'eNote' | 'eDecimal' | 'estimate' | 'times' | 'band'
  | 'bandVsRatio' | 'convertUnit' | 'pickUnit' | 'story' | 'storyOp' | 'report';
export const FAMILIES: readonly { id: FamilyId; name: string }[] = [
  { id: 'isSci', name: 'Is it scientific notation?' },
  { id: 'negMeaning', name: 'What the exponent tells' },
  { id: 'toDecimal', name: 'Scientific notation to decimal' },
  { id: 'toSci', name: 'Decimal to scientific notation' },
  { id: 'renorm', name: 'Fix the number in front' },
  { id: 'multiply', name: 'Multiply' },
  { id: 'divide', name: 'Divide' },
  { id: 'addSame', name: 'Add or subtract, same power' },
  { id: 'distribute', name: 'Why adding works' },
  { id: 'align', name: 'Line up the powers first' },
  { id: 'mixed', name: 'Decimal meets scientific' },
  { id: 'sameNumber', name: 'Same number, two forms' },
  { id: 'eNote', name: 'Read a calculator' },
  { id: 'eDecimal', name: 'Calculator to decimal' },
  { id: 'estimate', name: 'One digit times a power of 10' },
  { id: 'times', name: 'How many times as big?' },
  { id: 'band', name: 'Which powers of 10?' },
  { id: 'bandVsRatio', name: 'Band or exact ratio?' },
  { id: 'convertUnit', name: 'Change the unit' },
  { id: 'pickUnit', name: 'Pick a clear unit' },
  { id: 'story', name: 'Real-world calculation' },
  { id: 'storyOp', name: 'Which calculation?' },
  { id: 'report', name: 'Report the answer' },
];
export const FAMILY_NAMES: Record<string, string> = Object.fromEntries(FAMILIES.map(f => [f.id, f.name]));

export const MC = {
  negMakesNeg: 'mc.exponents-roots.negative-exponent-makes-negative',
  coefOut: 'mc.exponents-roots.coefficient-outside-one-to-ten',
  appendsZero: 'mc.decimals.appends-zero-to-multiply-by-ten',
  shiftDir: 'mc.exponents-roots.negative-exponent-shift-direction',
  sameDir: 'mc.exponents-roots.renormalizes-in-same-direction',
  prodMult: 'mc.exponents-roots.product-of-powers-multiplies-exponents',
  quotDiv: 'mc.exponents-roots.quotient-divides-exponents',
  divSubCoef: 'mc.exponents-roots.sci-divide-subtracts-coefficients',
  subNeg: 'mc.integers.subtract-negative-as-positive',
  addAddsExp: 'mc.exponents-roots.sci-add-adds-exponents',
  noAlign: 'mc.exponents-roots.sci-add-without-aligning-powers',
  notSame: 'mc.exponents-roots.sci-notation-not-seen-as-same-value',
  formsIncompat: 'mc.exponents-roots.decimal-scientific-forms-incompatible',
  eNote: 'mc.exponents-roots.e-notation-as-subtraction-or-coefficient-power',
  countZeros: 'mc.exponents-roots.power-of-ten-by-counting-zeros',
  countDigits: 'mc.exponents-roots.scientific-exponent-counts-all-digits',
  expOnly: 'mc.exponents-roots.compares-by-exponents-ignoring-coefficients',
  leadOnly: 'mc.exponents-roots.compares-by-leading-digit-only',
  additive: 'mc.exponents-roots.compares-powers-of-ten-additively',
  unitDir: 'mc.measurement-units.wrong-direction-for-quantity',
  unitPurpose: 'mc.measurement-units.unit-choice-ignores-size-purpose',
  convChanges: 'mc.measurement-units.conversion-changes-amount',
  visualExact: 'mc.data-displays.visual-estimate-as-exact',
  largerBySmaller: 'mc.reasoning-language.divides-larger-by-smaller-without-modeling',
  keyword: 'mc.reasoning-language.keyword-operation-choice',
  bare: 'mc.reasoning-language.bare-number-without-meaning',
} as const;

// ---------- pictures ----------
export interface HopPic { kind: 'hop'; p: HopParams; show: HopStep[]; solve: HopStep[] }
export interface LadderPic { kind: 'ladder'; p: LadderParams; show: LadderStep[]; solve: LadderStep[] }
export interface ScreenPic { kind: 'screen'; text: string; device: 'calculator' | 'spreadsheet' }
export interface SnItem extends Item {
  family: FamilyId;
  pic?: HopPic | LadderPic | ScreenPic;
  /** the picture appears only with the worked solution */
  bareFirst?: boolean;
  /** TeX lines the solution replay writes on the board, in order */
  solveTex: string[];
}
type Gen = (R: () => number, n: number, sg?: string) => SnItem;

// ---------- small helpers ----------
const SCI_OP = '× 10<span class="sci-op"></span>';
/** a coefficient with exactly `places` decimals (the last one not 0), 1 <= a < 10 */
function coef(R: () => number, places: number): Dec {
  if (places <= 0) return dec(int(R, 1, 9));
  const lo = 10 ** places, hi = 10 ** (places + 1) - 1;
  let c = int(R, lo, hi);
  while (c % 10 === 0) c = int(R, lo, hi);
  return dec(c, -places);
}
const sciAns = (a: Dec, n: number): Response => ({ kind: 'pair', x: toNum(a), y: n });
const numAns = (v: Dec): Response => ({ kind: 'num', v: toNum(v) });
const isDecimal = (a: Dec) => a.e < 0;
const words = (n: number) => ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'][n] ?? String(n);
const times = (n: number) => (n === 1 ? 'once' : `${words(n)} times`);
/** a kid's pair answer (coefficient, exponent) as exact values; y must be a whole number */
function readPair(r: Response): { x: Dec; y: number } | null {
  if (r.kind !== 'pair') return null;
  const x = fromNumber(r.x);
  if (!x || !Number.isInteger(r.y)) return null;
  return { x, y: r.y };
}
const readNum = (r: Response): Dec | null => (r.kind === 'num' ? fromNumber(r.v) : null);
/** check an answer in scientific notation; `why` classifies a wrong one (null = not recognised) */
function checkSci(target: Dec, r: Response, why: (x: Dec, y: number, v: Dec) => Verdict | null, right: string): Verdict {
  if (r.kind === 'pair' && Number.isFinite(r.x) && Number.isFinite(r.y) && !Number.isInteger(r.y)) {
    const w = why(fromNumber(r.x) ?? dec(0), r.y, dec(0));
    if (w) return w;
    return { ok: false, say: `The exponent of 10 is a whole number here. The answer is ${S(sciH(target))}.` };
  }
  const p = readPair(r);
  if (!p) return { ok: false, say: 'Fill in both boxes: the number in front and the power of 10.' };
  const v = sciVal(p.x, p.y);
  if (eq(v, target)) {
    if (isCoef(p.x)) return { ok: true, say: `Yes: ${right}` };
    return { ok: false, mc: MC.coefOut, say: `${sH(p.x, p.y)} has the right value, but it is not scientific notation yet: the number in front must be at least 1 and less than 10. Written properly it is ${S(sciH(target))}.` };
  }
  return why(p.x, p.y, v) ?? { ok: false, say: `Not this time. The answer is ${S(sciH(target))}.` };
}
/** the exponent a kid gets by moving the point the right number of places in the WRONG direction while renormalising */
const sameDirExp = (given: number, right: number) => 2 * given - right;
interface Opt { t: string; ok: boolean; mc?: string; say: string }
function choice(R: () => number, base: Omit<SnItem, 'input' | 'choices' | 'answer' | 'check'>, opts: Opt[]): SnItem {
  const o = shuffle(R, opts.slice());
  const right = o.findIndex(x => x.ok);
  return {
    ...base, input: 'choice', choices: o.map(x => x.t), answer: { kind: 'choice', i: right },
    check: r => {
      if (r.kind !== 'choice' || !o[r.i]) return { ok: false, say: 'Pick one of the answers.' };
      const x = o[r.i]!;
      return { ok: x.ok, mc: x.mc, say: x.say };
    },
  };
}
const hopPic = (p: HopParams, solve: HopStep[] = ['hop', 'read']): HopPic => ({ kind: 'hop', p, show: ['digits'], solve });
/** a ladder around one or two values (2 to 5 gaps) */
function ladderAround(vals: Dec[], extra = 0): { lo: number; hi: number } {
  const ns = vals.map(v => sciOf(v).n);
  let lo = Math.min(...ns), hi = Math.max(...ns) + 1 + extra;
  if (hi - lo < 2) { lo -= 1; }
  return { lo, hi };
}

// ===================== 1 sci-notation-structure =====================
const isSci: Gen = (R, n) => {
  const a = coef(R, pick(R, [0, 1, 1, 2])), e = int(R, -9, 9);
  const boundary = R() < 0.2;
  const aa = boundary ? dec(1) : a;
  const big = mul(aa, dec(10)), small = mul(aa, D('0.1'));
  const rule = `Scientific notation is ${B('a × 10<sup><i>n</i></sup>')} with ${B('1 ≤ a &lt; 10')} and a whole-number exponent <i>n</i>.`;
  if (R() < 0.5) {
    // which of these is in scientific notation?
    const opts: Opt[] = [
      { t: sH(aa, e), ok: true, say: `Yes: ${plain(aa)} is at least 1 and less than 10, and ${e} is a whole number. Negative or zero exponents are fine.` },
      { t: sH(big, e - 1), ok: false, mc: MC.coefOut, say: `${plain(big)} is 10 or more, so ${sH(big, e - 1)} is not scientific notation. It equals ${sH(aa, e)}.` },
      { t: sH(small, e + 1), ok: false, mc: MC.coefOut, say: `${plain(small)} is less than 1, so ${sH(small, e + 1)} is not scientific notation. It equals ${sH(aa, e)}.` },
    ];
    if (boundary) opts.push({ t: sH('10', e + 1), ok: false, mc: MC.coefOut, say: `10 is not less than 10, so ${sH('10', e + 1)} is not scientific notation: it is ${sH('1', e + 2)}.` });
    return choice(R, {
      id: `isSci-${n}`, family: 'isSci', prompt: 'Which one is written in scientific notation?', board: 'a \\times 10^{n}, \\quad 1 \\le a < 10',
      solution: [rule, `Only ${S(sH(aa, e))} has a number in front from 1 up to (not including) 10.`], solveTex: [`${sTex(aa, e)}`],
    }, opts);
  }
  // is this one in scientific notation?
  const form = pick(R, ['ok', 'big', 'small', 'ten'] as const);
  const [fa, fe] = form === 'ok' ? [aa, e] as const : form === 'big' ? [big, e - 1] as const : form === 'small' ? [small, e + 1] as const : [dec(10), e] as const;
  const okForm = form === 'ok';
  const opts: Opt[] = okForm ? [
    { t: 'Yes: the number in front is from 1 up to 10, and the exponent is a whole number.', ok: true, say: `Right: ${plain(fa)} is at least 1 and less than 10.${fe < 0 ? ' A negative exponent is allowed: it makes the number small, not negative.' : ''}` },
    fe < 0 ? { t: 'No: a negative exponent makes it a negative number, and that is not allowed.', ok: false, mc: MC.negMakesNeg, say: `A negative exponent does not make the number negative: ${sH(fa, fe)} is a small positive number. And it is in scientific notation.` }
      : { t: 'No: the number in front must be a whole number.', ok: false, say: `The number in front may have decimals; it only has to be at least 1 and less than 10. ${sH(fa, fe)} is in scientific notation.` },
    { t: 'No: the number in front must be bigger than 10.', ok: false, mc: MC.coefOut, say: `It is the other way: the number in front must be less than 10 (and at least 1). ${plain(fa)} fits, so this is scientific notation.` },
  ] : [
    { t: form === 'small' ? 'No: the number in front is less than 1.' : form === 'ten' ? 'No: the number in front must be less than 10, and 10 is not.' : 'No: the number in front is 10 or more.', ok: true, say: `Right. Written properly it is ${S(sciH(sciVal(fa, fe)))}.` },
    { t: 'Yes: it is a number times a power of 10.', ok: false, mc: MC.coefOut, say: `Any number can be written as something times a power of 10. Scientific notation needs the number in front from 1 up to 10: ${S(sciH(sciVal(fa, fe)))}.` },
    fe < 0 ? { t: 'No: the exponent is negative, so the number is negative.', ok: false, mc: MC.negMakesNeg, say: `A negative exponent makes a number small, not negative. The problem is the number in front: ${plain(fa)}.` }
      : { t: 'No: the exponent is too small.', ok: false, say: `Any whole-number exponent is fine. The problem is the number in front: ${plain(fa)}.` },
  ];
  const v = sciVal(fa, fe), s = sciOf(v);
  return choice(R, {
    id: `isSci-${n}`, family: 'isSci', prompt: `Is ${B(sH(fa, fe))} written in scientific notation?`, board: sTex(fa, fe),
    solution: [rule, okForm ? `${plain(fa)} is from 1 up to 10: yes.` : `${plain(fa)} is not from 1 up to 10, so no. It equals ${S(sciH(v))}.`],
    solveTex: okForm ? [`1 \\le ${plain(fa)} < 10`] : [`${sTex(fa, fe)} = ${sciTex(v)}`],
    pic: { kind: 'ladder', p: { ...ladderAround([v]), marks: [{ v, name: 'this number', col: 'first', icon: 'dot' }], band: s.n }, show: ['rungs', 'm0'], solve: ['band'] }, bareFirst: true,
  }, opts);
};

const negMeaning: Gen = (R, n) => {
  if (R() < 0.6) {
    const a = coef(R, pick(R, [0, 1, 1, 2])), e = -int(R, 2, 7), v = sciVal(a, e), big = sciVal(a, -e);
    return choice(R, {
      id: `negMeaning-${n}`, family: 'negMeaning', prompt: `What does ${B(sH(a, e))} tell you about the size of the number?`, board: sTex(a, e),
      solution: [`${pH(e)} means: divide by 10, ${times(-e)}.`, `${plain(a)} ÷ ${nH(pow10(-e))} = ${S(nH(v))}: a small positive number.`],
      solveTex: [`${sTex(a, e)} = ${nTex(v)}`],
      pic: hopPic(hopForSci(a, e)), bareFirst: true,
    }, [
      { t: `A small positive number: ${plain(a)} divided by 10, ${times(-e)}, is ${nH(v)}.`, ok: true, say: `Yes: the negative exponent makes it small, not negative. ${sH(a, e)} = ${S(nH(v))}.` },
      { t: `A negative number: −${nH(big)}.`, ok: false, mc: MC.negMakesNeg, say: `A negative exponent never makes the number negative. It divides by 10, ${times(-e)}: ${sH(a, e)} = ${nH(v)}.` },
      { t: `A big number: ${nH(big)}.`, ok: false, mc: MC.shiftDir, say: `That moves the point the wrong way: ${nH(big)} is ${sH(a, -e)}. A negative exponent divides by 10: ${nH(v)}.` },
    ]);
  }
  const a = coef(R, pick(R, [1, 2])), e = int(R, 2, 7), v = sciVal(a, e);
  const bt = mul(a, dec(e));
  return choice(R, {
    id: `negMeaning-${n}`, family: 'negMeaning', prompt: `What does the exponent ${B(String(e))} in ${B(sH(a, e))} tell you?`, board: sTex(a, e),
    solution: [`${pH(e)} means: multiply by 10, ${times(e)}.`, `Each factor of 10 moves the point one place right: ${S(nH(v))}.`],
    solveTex: [`${sTex(a, e)} = ${nTex(v)}`],
    pic: hopPic(hopForSci(a, e)), bareFirst: true,
  }, [
    { t: `Multiply ${plain(a)} by 10, ${times(e)}: ${nH(v)}.`, ok: true, say: `Yes: ${sH(a, e)} = ${S(nH(v))}.` },
    { t: `Write ${words(e)} zeros after ${plain(a)}: ${plain(a)}${'0'.repeat(e)}.`, ok: false, mc: MC.appendsZero, say: `Zeros after the last decimal digit change nothing: ${plain(a)}${'0'.repeat(e)} is still ${plain(a)}. Multiplying by 10 moves the point: ${nH(v)}.` },
    { t: `Multiply ${plain(a)} by ${e}: ${plain(bt)}.`, ok: false, say: `The exponent counts factors of 10, it does not multiply ${plain(a)}. ${sH(a, e)} = ${nH(v)}.` },
  ]);
};

// ===================== 2 convert-sci-to-decimal =====================
const toDecimal: Gen = (R, n) => {
  const a = coef(R, pick(R, [0, 1, 2, 2, 3])), e = R() < 0.08 ? 0 : (R() < 0.5 ? -1 : 1) * (R() < 0.75 ? int(R, 1, 6) : int(R, 7, 9));
  const v = sciVal(a, e);
  const big = e >= 4;
  return {
    id: `toDecimal-${n}`, family: 'toDecimal',
    prompt: `Write ${B(sH(a, e))} as an ordinary decimal.${big ? ' Type it without commas.' : ''}`,
    board: `${sTex(a, e)} = \\,?`, input: 'num',
    pic: hopPic(hopForSci(a, e)),
    solution: [e === 0 ? `${pH(0)} = 1, so the number does not change.` : `${pH(e)} ${e > 0 ? 'multiplies' : 'divides'} by 10, ${times(Math.abs(e))}: the point moves ${Math.abs(e)} place${Math.abs(e) === 1 ? '' : 's'} ${e > 0 ? 'right' : 'left'}.`, `Fill the empty places with zeros: ${S(nH(v))}.`],
    solveTex: [`${sTex(a, e)} = ${nTex(v)}`],
    answer: numAns(v),
    check: r => {
      const x = readNum(r);
      if (!x) return { ok: false, say: 'Type the number, without commas (like 45000 or 0.0032).' };
      if (eq(x, v)) return { ok: true, say: `Yes: ${sH(a, e)} = ${S(nH(v))}.` };
      if (e !== 0 && eq(x, sciVal(a, -e))) return { ok: false, mc: MC.shiftDir, say: `That moves the point the wrong way. A ${e > 0 ? 'positive' : 'negative'} exponent makes the number ${e > 0 ? 'bigger' : 'smaller'}: ${nH(v)}.` };
      if (e > 0 && isDecimal(a) && (eq(x, a) || eq(x, D(plain(a).replace('.', '') + '0'.repeat(e))))) return { ok: false, mc: MC.appendsZero, say: `Writing zeros after the digits does not multiply by 10 when there is a decimal point: move the point ${e} places right instead. ${sH(a, e)} = ${nH(v)}.` };
      if (e !== 0 && eq(x, a)) return { ok: false, mc: MC.notSame, say: `That is only the number in front. The ${pH(e)} is part of the number too: ${sH(a, e)} = ${nH(v)}.` };
      if (x.c < 0n && (eq(neg(x), v) || eq(neg(x), sciVal(a, -e)))) return { ok: false, mc: MC.negMakesNeg, say: `A negative exponent makes a number small, never negative: ${nH(v)}.` };
      if (eq(x, mul(v, dec(10))) || eq(x, mul(v, D('0.1')))) return { ok: false, say: `One place off. Count the hops: ${Math.abs(e)}. ${sH(a, e)} = ${nH(v)}.` };
      return { ok: false, say: `Move the point ${Math.abs(e)} place${Math.abs(e) === 1 ? '' : 's'} ${e >= 0 ? 'right' : 'left'}: ${nH(v)}.` };
    },
  };
};

// ===================== 3 convert-decimal-to-sci =====================
const toSci: Gen = (R, n) => {
  const pow = R() < 0.12;
  const a = pow ? dec(1) : coef(R, pick(R, [0, 1, 2, 3])), e = R() < 0.1 ? 0 : (R() < 0.5 ? -1 : 1) * int(R, 1, 9);
  const v = sciVal(a, e);
  const s = (a.c).toString();
  return {
    id: `toSci-${n}`, family: 'toSci', prompt: `Write ${B(nH(v))} in scientific notation.`, board: nTex(v), input: 'pair', pairLead: '', pairOp: SCI_OP,
    pic: hopPic({ digits: s, from: s.length + a.e + e, to: s.length + a.e }),
    solution: [`Move the point so that one non-zero digit is in front of it: ${plain(a)}.`, e === 0 ? `It did not move, so the power is ${pH(0)}.` : `It moved ${Math.abs(e)} place${Math.abs(e) === 1 ? '' : 's'} ${e > 0 ? 'left' : 'right'}, so ${nH(v)} = ${plain(a)} × ${pH(e)}.`, `Check by moving it back: ${S(sH(a, e))} = ${nH(v)}.`],
    solveTex: [`${nTex(v)} = ${sTex(a, e)}`],
    answer: sciAns(a, e),
    check: r => checkSci(v, r, (x, y) => {
      if (!eq(x, a)) return null;
      if (e !== 0 && y === -e) return { ok: false, mc: MC.shiftDir, say: `The exponent has the wrong sign. ${e < 0 ? `${nH(v)} is less than 1, so the exponent is negative` : `${nH(v)} is more than 10, so the exponent is positive`}: ${sH(a, e)}.` };
      if (e < 0 && y === e + 1) return { ok: false, mc: MC.countZeros, say: `Counting the zeros gives ${-e - 1}, but the point moves ${-e} places: to just past the first non-zero digit. ${sH(a, e)}.` };
      if (e > 0 && isInt(v) && y === e + 1) return { ok: false, mc: MC.countDigits, say: `${nH(v)} has ${e + 1} digits, but the point moves only ${e} places (one digit stays in front). ${sH(a, e)}.` };
      if (Math.abs(y - e) === 1) return { ok: false, say: `One place off: count the hops of the point again. ${sH(a, e)}.` };
      return null;
    }, `${nH(v)} = ${S(sH(a, e))}.`),
  };
};

// ===================== 4 renormalize =====================
const renorm: Gen = (R, n) => {
  const shift = R() < 0.75 ? pick(R, [1, -1]) : pick(R, [2, -2]);
  const a = coef(R, shift > 0 ? pick(R, [0, 1, 1]) : pick(R, [0, 1]));
  let target = int(R, -8, 8);
  if (target === shift) target += 2;   // never a given x 10^0
  const given = target - shift;
  const g = mul(a, pow10(shift));
  const v = sciVal(a, target);
  const gs = g.c.toString();
  const same = sameDirExp(given, target);
  const word = shift > 0 ? `${plain(g)} is ${shift === 1 ? '10' : '100'} times too big` : `${plain(g)} is ${shift === -1 ? '10' : '100'} times too small`;
  return {
    id: `renorm-${n}`, family: 'renorm', prompt: `${B(sH(g, given))} is not in scientific notation. Rewrite it.`, board: `${sTex(g, given)} = \\,? \\times 10^{?}`, input: 'pair', pairLead: '', pairOp: SCI_OP,
    pic: hopPic({ digits: gs, from: gs.length + g.e, to: gs.length + g.e - shift }),
    solution: [`${word}: ${plain(g)} = ${plain(a)} × ${pH(shift)}.`, `So ${sH(g, given)} = ${plain(a)} × ${pH(shift)} × ${pH(given)} = ${S(sH(a, target))}.`, `The number in front got ${shift > 0 ? 'smaller' : 'bigger'}, so the power got ${shift > 0 ? 'bigger' : 'smaller'}: the value stays the same.`],
    solveTex: [`${plain(g)} = ${sTex(a, shift)}`, `${sTex(g, given)} = ${sTex(a, target)}`],
    answer: sciAns(a, target),
    check: r => checkSci(v, r, (x, y) => {
      if (eq(x, a) && y === same) return { ok: false, mc: MC.sameDir, say: `The number in front got ${shift > 0 ? 'smaller' : 'bigger'}, so the power of 10 must get ${shift > 0 ? 'bigger' : 'smaller'} to make up for it: ${sH(a, target)}. Your answer is ${nH(pow10(2 * Math.abs(shift)))} times ${shift > 0 ? 'too small' : 'too big'}.` };
      if (eq(x, a)) return { ok: false, say: `The number in front is right. The power: ${plain(g)} = ${plain(a)} × ${pH(shift)}, so ${shift > 0 ? `add ${shift} to` : `take ${-shift} from`} the exponent ${String(given).replace('-', '−')}: ${sH(a, target)}.` };
      return null;
    }, `${sH(g, given)} = ${S(sH(a, target))}.`),
  };
};

// ===================== 5 multiply-sci =====================
const COEFS = ['1.2', '1.5', '2', '2.5', '3', '4', '5', '6', '7', '8', '9'];
const multiply: Gen = (R, n) => {
  const renormNeeded = R() < 0.5;
  let a1: Dec, a2: Dec, p: Dec;
  do { a1 = D(pick(R, COEFS)); a2 = D(pick(R, COEFS)); p = mul(a1, a2); } while ((cmp(p, dec(10)) >= 0) !== renormNeeded || sigDigits(p) > 3);
  const negs = R() < 0.5;
  let n1: number, n2: number;
  do { n1 = negs ? int(R, -9, 7) : int(R, 1, 9); n2 = negs ? int(R, -9, 7) : int(R, 1, 9); } while (n1 * n2 === n1 + n2 || n1 * n2 === n1 + n2 + 1 || Math.abs(n1 + n2) > 14 || (negs && n1 >= 0 && n2 >= 0));
  const v = sciVal(p, n1 + n2), s = sciOf(v);
  const pre = `(${sH(a1, n1)}) × (${sH(a2, n2)})`;
  return {
    id: `multiply-${n}`, family: 'multiply', prompt: `Multiply: ${B(pre)}. Give the answer in scientific notation.`,
    board: `(${sTex(a1, n1)}) \\times (${sTex(a2, n2)})`, input: 'pair', pairLead: '', pairOp: SCI_OP,
    solution: [`Group the numbers and the powers: (${plain(a1)} × ${plain(a2)}) × (${pH(n1)} × ${pH(n2)}).`, `${plain(a1)} × ${plain(a2)} = ${plain(p)}, and ${pH(n1)} × ${pH(n2)} = ${pH(n1 + n2)}: add the exponents.`, ...(renormNeeded ? [`${plain(p)} is 10 or more: ${plain(p)} × ${pH(n1 + n2)} = ${S(sH(s.a, s.n))}.`] : [`So the product is ${S(sH(s.a, s.n))}.`])],
    solveTex: [`(${plain(a1)} \\times ${plain(a2)}) \\times (10^{${n1}} \\times 10^{${n2}})`, `= ${sTex(p, n1 + n2)}`, ...(renormNeeded ? [`= ${sTex(s.a, s.n)}`] : [])],
    answer: sciAns(s.a, s.n),
    check: r => checkSci(v, r, (x, y) => {
      if (y === n1 * n2) return { ok: false, mc: MC.prodMult, say: `Powers of 10 multiply by ADDING exponents: ${pH(n1)} × ${pH(n2)} = ${pH(n1 + n2)}, not ${pH(n1 * n2)}. The product is ${sH(s.a, s.n)}.` };
      if (renormNeeded && eq(x, s.a) && y === n1 + n2 - 1) return { ok: false, mc: MC.sameDir, say: `${plain(p)} = ${plain(s.a)} × 10, so the power goes UP by one: ${sH(s.a, s.n)}.` };
      if (eq(x, add(a1, a2))) return { ok: false, say: `Multiply the numbers in front, don't add them: ${plain(a1)} × ${plain(a2)} = ${plain(p)}. The product is ${sH(s.a, s.n)}.` };
      return null;
    }, `${pre} = ${S(sH(s.a, s.n))}.`),
  };
};

// ===================== 6 divide-sci =====================
const DIVS = ['2', '4', '5', '8', '2.5', '1.6', '1.25'];
const QS = ['0.2', '0.25', '0.4', '0.5', '0.6', '0.75', '0.8', '1.5', '2', '2.5', '3', '3.5', '4'];
const divide: Gen = (R, n) => {
  let a1: Dec, a2: Dec, q: Dec;
  do { a2 = D(pick(R, DIVS)); q = D(pick(R, QS)); a1 = mul(q, a2); } while (!isCoef(a1) || sigDigits(a1) > 3 || eq(a1, a2));
  const negDiv = R() < 0.5;
  let n1: number, n2: number;
  do { n1 = int(R, -8, 9); n2 = negDiv ? -int(R, 1, 8) : int(R, 1, 8); } while (Math.abs(n1 - n2) > 14 || n1 === n2 || n1 + n2 === n1 - n2);
  const v = sciVal(q, n1 - n2), s = sciOf(v);
  const lt1 = cmp(q, dec(1)) < 0;
  return {
    id: `divide-${n}`, family: 'divide', prompt: `Divide: ${B(`(${sH(a1, n1)}) ÷ (${sH(a2, n2)})`)}. Give the answer in scientific notation.`,
    board: `\\dfrac{${sTex(a1, n1)}}{${sTex(a2, n2)}}`, input: 'pair', pairLead: '', pairOp: SCI_OP,
    solution: [`Divide the numbers in front: ${plain(a1)} ÷ ${plain(a2)} = ${plain(q)}.`, `Divide the powers by SUBTRACTING exponents: ${pH(n1)} ÷ ${pH(n2)} = ${pH(`${mi(n1)} − ${n2 < 0 ? `(${mi(n2)})` : n2}`)} = ${pH(n1 - n2)}.`, lt1 ? `${plain(q)} is less than 1: ${plain(q)} × ${pH(n1 - n2)} = ${S(sH(s.a, s.n))}.` : `So the quotient is ${S(sH(s.a, s.n))}.`],
    solveTex: [`\\dfrac{${plain(a1)}}{${plain(a2)}} = ${plain(q)}`, `\\dfrac{10^{${n1}}}{10^{${n2}}} = 10^{${n1} - ${n2 < 0 ? `(${n2})` : n2}} = 10^{${n1 - n2}}`, ...(lt1 ? [`${sTex(q, n1 - n2)} = ${sTex(s.a, s.n)}`] : [])],
    answer: sciAns(s.a, s.n),
    check: r => checkSci(v, r, (x, y) => {
      const ys = lt1 ? [n1 + n2, n1 + n2 - 1] : [n1 + n2];
      if (n2 < 0 && ys.includes(y)) return { ok: false, mc: MC.subNeg, say: `${mi(n1)} − (${mi(n2)}) = ${mi(n1)} + ${-n2} = ${n1 - n2}: subtracting a negative adds. The quotient is ${sH(s.a, s.n)}.` };
      if (n2 !== 0 && n1 / n2 !== s.n && Math.abs(y - n1 / n2) < 1e-9) return { ok: false, mc: MC.quotDiv, say: `Powers of 10 divide by SUBTRACTING exponents: ${pH(n1)} ÷ ${pH(n2)} = ${pH(n1 - n2)}. The quotient is ${sH(s.a, s.n)}.` };
      if (eq(x, sub(a1, a2)) || eq(x, sub(a2, a1))) return { ok: false, mc: MC.divSubCoef, say: `Divide the numbers in front, don't subtract them: ${plain(a1)} ÷ ${plain(a2)} = ${plain(q)}. The quotient is ${sH(s.a, s.n)}.` };
      const flip = div(a2, a1);
      if (flip && cmp(a2, a1) > 0 && (eq(x, flip) || (isCoef(x) && eq(x, sciOf(flip).a)))) return { ok: false, mc: MC.largerBySmaller, say: `That divides ${plain(a2)} by ${plain(a1)}. The first number is divided by the second, even when it is smaller: ${plain(a1)} ÷ ${plain(a2)} = ${plain(q)}.` };
      if (lt1 && eq(x, s.a) && y === n1 - n2 + 1) return { ok: false, mc: MC.sameDir, say: `${plain(q)} = ${plain(s.a)} × ${pH(-1)}, so the power goes DOWN by one: ${sH(s.a, s.n)}.` };
      return null;
    }, `the quotient is ${S(sH(s.a, s.n))}.`),
  };
};

// ===================== 7 add-subtract-same-power =====================
const oneDec = (R: () => number, lo = 11, hi = 99) => dec(int(R, lo, hi), -1);
const addSame: Gen = (R, n) => {
  const plus = R() < 0.6;
  let a1: Dec, a2: Dec;
  do { a1 = oneDec(R); a2 = oneDec(R); } while (eq(a1, a2) || (!plus && cmp(a1, a2) <= 0));
  const e = int(R, -9, 9) || 3;
  const c = plus ? add(a1, a2) : sub(a1, a2);
  const v = sciVal(c, e), s = sciOf(v);
  const op = plus ? '+' : '−', opT = plus ? '+' : '-';
  const ren = !eq(s.a, c);
  return {
    id: `addSame-${n}`, family: 'addSame', prompt: `Work out ${B(`${sH(a1, e)} ${op} ${sH(a2, e)}`)}. Give the answer in scientific notation.`,
    board: `${sTex(a1, e)} ${opT} ${sTex(a2, e)}`, input: 'pair', pairLead: '', pairOp: SCI_OP,
    solution: [`Both are a number of ${pH(e)}s, like ${plain(a1)} apples ${op} ${plain(a2)} apples.`, `(${plain(a1)} ${op} ${plain(a2)}) × ${pH(e)} = ${plain(c)} × ${pH(e)}: the power stays ${pH(e)}.`, ...(ren ? [`${plain(c)} is not from 1 up to 10: ${S(sH(s.a, s.n))}.`] : [])],
    solveTex: [`(${plain(a1)} ${opT} ${plain(a2)}) \\times 10^{${e}}`, `= ${sTex(c, e)}`, ...(ren ? [`= ${sTex(s.a, s.n)}`] : [])],
    answer: sciAns(s.a, s.n),
    check: r => checkSci(v, r, (x, y) => {
      if ((plus ? y === 2 * e || (ren && y === 2 * e + 1) : y === 0) && !(plus ? 2 * e === s.n : s.n === 0)) return { ok: false, mc: MC.addAddsExp, say: `${plus ? 'Adding' : 'Subtracting'} does not change the power: ${plain(a1)} of the ${pH(e)}s ${op} ${plain(a2)} of them is ${plain(c)} of them. The answer is ${sH(s.a, s.n)}.` };
      if (ren && eq(x, s.a) && y === (plus ? e - 1 : e + 1)) return { ok: false, mc: MC.sameDir, say: `${plain(c)} = ${plain(s.a)} × ${pH(plus ? 1 : -1)}, so the power goes ${plus ? 'up' : 'down'} by one: ${sH(s.a, s.n)}.` };
      return null;
    }, `${sH(a1, e)} ${op} ${sH(a2, e)} = ${S(sH(s.a, s.n))}.`),
  };
};
const distribute: Gen = (R, n) => {
  const e = int(R, 2, 9) * pick(R, [1, -1]);
  if (R() < 0.3) {
    const a = oneDec(R);
    return choice(R, {
      id: `distribute-${n}`, family: 'distribute', prompt: `What is ${B(`${sH(a, e)} − ${sH(a, e)}`)}?`, board: `${sTex(a, e)} - ${sTex(a, e)}`,
      solution: [`(${plain(a)} − ${plain(a)}) × ${pH(e)} = 0 × ${pH(e)}.`, `0 times anything is ${S('0')}.`], solveTex: [`(${plain(a)} - ${plain(a)}) \\times 10^{${e}} = 0`],
    }, [
      { t: '0', ok: true, say: `Yes: (${plain(a)} − ${plain(a)}) × ${pH(e)} = 0 × ${pH(e)} = ${S('0')}.` },
      { t: sH(a, 0), ok: false, mc: MC.addAddsExp, say: `Subtracting does not subtract the exponents. (${plain(a)} − ${plain(a)}) × ${pH(e)} = 0 × ${pH(e)} = 0.` },
      { t: pH(e), ok: false, say: `0 of the ${pH(e)}s is nothing: 0 × ${pH(e)} = 0.` },
    ]);
  }
  let a1: Dec, a2: Dec;
  do { a1 = oneDec(R, 11, 59); a2 = oneDec(R, 11, 39); } while (eq(a1, a2));
  const c = add(a1, a2);
  return choice(R, {
    id: `distribute-${n}`, family: 'distribute', prompt: `Which step shows why ${B(`${sH(a1, e)} + ${sH(a2, e)} = ${sH(c, e)}`)}?`, board: `${sTex(a1, e)} + ${sTex(a2, e)}`,
    solution: [`Both terms have the factor ${pH(e)}. Take it out once: (${plain(a1)} + ${plain(a2)}) × ${pH(e)}.`, `That is the distributive property: ${S(sH(c, e))}.`],
    solveTex: [`(${plain(a1)} + ${plain(a2)}) \\times 10^{${e}} = ${sTex(c, e)}`],
  }, [
    { t: `(${plain(a1)} + ${plain(a2)}) × ${pH(e)}`, ok: true, say: `Yes: the shared ${pH(e)} is taken out once (distributive property), like ${plain(a1)} apples + ${plain(a2)} apples.` },
    { t: `(${plain(a1)} + ${plain(a2)}) × ${pH(`${e} + ${e}`)}`, ok: false, mc: MC.addAddsExp, say: `Adding exponents is the rule for MULTIPLYING powers. In a sum the ${pH(e)} is a shared factor: (${plain(a1)} + ${plain(a2)}) × ${pH(e)}.` },
    { t: `(${plain(a1)} × ${plain(a2)}) × ${pH(e)}`, ok: false, say: `The terms are added, so the numbers in front are added: (${plain(a1)} + ${plain(a2)}) × ${pH(e)}.` },
  ]);
};

// ===================== 8 align-unequal-powers =====================
const align: Gen = (R, n) => {
  const d = int(R, 1, 3), plus = R() < 0.6;
  const a1 = R() < 0.5 ? dec(int(R, 2, 9)) : oneDec(R, 12, 98);
  const a2 = R() < 0.6 ? dec(int(R, 1, 9)) : oneDec(R, 11, 99);
  const n1 = int(R, -6, 9), n2 = n1 - d;
  const a2s = mul(a2, pow10(-d));
  const c = plus ? add(a1, a2s) : sub(a1, a2s);
  const v = sciVal(c, n1), s = sciOf(v);
  const op = plus ? '+' : '−', opT = plus ? '+' : '-';
  const naive = plus ? add(a1, a2) : sub(a1, a2);
  return {
    id: `align-${n}`, family: 'align', prompt: `Work out ${B(`${sH(a1, n1)} ${op} ${sH(a2, n2)}`)}. Give the answer in scientific notation.`,
    board: `${sTex(a1, n1)} ${opT} ${sTex(a2, n2)}`, input: 'pair', pairLead: '', pairOp: SCI_OP,
    solution: [`The powers differ, so rewrite the smaller one with ${pH(n1)}: ${sH(a2, n2)} = ${sH(a2s, n1)}.`, `(${plain(a1)} ${op} ${plain(a2s)}) × ${pH(n1)} = ${plain(c)} × ${pH(n1)}.`, `In scientific notation: ${S(sH(s.a, s.n))}.`],
    solveTex: [`${sTex(a2, n2)} = ${sTex(a2s, n1)}`, `(${plain(a1)} ${opT} ${plain(a2s)}) \\times 10^{${n1}}`, `= ${sTex(s.a, s.n)}`],
    answer: sciAns(s.a, s.n),
    check: r => checkSci(v, r, (x, y, val) => {
      if (naive.c > 0n && eq(val, sciVal(naive, n1))) return { ok: false, mc: MC.noAlign, say: `${plain(a1)} and ${plain(a2)} count different things: ${pH(n1)}s and ${pH(n2)}s. First write ${sH(a2, n2)} = ${sH(a2s, n1)}. Then the answer is ${sH(s.a, s.n)}.` };
      if (y === n1 + n2 && n1 + n2 !== s.n) return { ok: false, mc: MC.addAddsExp, say: `Adding exponents is for multiplying. For a ${plus ? 'sum' : 'difference'}, line up the powers: ${sH(a2, n2)} = ${sH(a2s, n1)}. The answer is ${sH(s.a, s.n)}.` };
      return null;
    }, `${sH(a1, n1)} ${op} ${sH(a2, n2)} = ${S(sH(s.a, s.n))}.`),
  };
};

// ===================== 9 mixed-notation-arithmetic =====================
const mixed: Gen = (R, n) => {
  const op = pick(R, ['+', '−', '×', '÷'] as const);
  let d1: Dec, a2: Dec, n2: number, v: Dec;
  if (op === '+' || op === '−') {
    let n1: number;
    do { n1 = int(R, -7, 6); n2 = n1 - pick(R, [0, 1]); } while (n2 === 0 || n1 === 0);
    d1 = sciVal(dec(int(R, 2, 9)), n1);
    a2 = R() < 0.5 ? dec(int(R, 1, 9)) : oneDec(R, 11, 95);
    const t2 = sciVal(a2, n2);
    v = op === '+' ? add(d1, t2) : sub(d1, t2);
    if (v.c <= 0n) { d1 = add(d1, sciVal(dec(5), n1 + 1)); v = op === '+' ? add(d1, t2) : sub(d1, t2); }
  } else if (op === '×') {
    d1 = sciVal(dec(pick(R, [2, 3, 4, 5, 6])), int(R, 2, 4));
    a2 = D(pick(R, ['1.5', '2', '3', '4', '5', '2.5']));
    n2 = -int(R, 2, 8);
    v = mul(d1, sciVal(a2, n2));
  } else {
    d1 = sciVal(dec(pick(R, [2, 4, 5])), int(R, 2, 4));
    a2 = D(pick(R, ['1.2', '1.5', '2', '3', '4', '4.5', '6', '8']));
    n2 = int(R, 4, 9);
    v = div(sciVal(a2, n2), d1)!;
  }
  const s = sciOf(v);
  const sciTerm = sH(a2, n2), decTerm = nH(d1);
  const order = op === '÷' ? `${sciTerm} ÷ ${decTerm}` : `${decTerm} ${op} ${sciTerm}`;
  const orderT = op === '÷' ? `${sTex(a2, n2)} \\div ${nTex(d1)}` : `${nTex(d1)} ${op === '−' ? '-' : op === '×' ? '\\times' : '+'} ${sTex(a2, n2)}`;
  const d1s = sciOf(d1);
  const wrongV = op === '+' ? add(d1, a2) : op === '−' ? sub(d1, a2) : op === '×' ? mul(d1, a2) : div(a2, d1);
  return {
    id: `mixed-${n}`, family: 'mixed', prompt: `Work out ${B(order)}. Give the answer in scientific notation.`, board: orderT, input: 'pair', pairLead: '', pairOp: SCI_OP,
    solution: [`Write both the same way first: ${decTerm} = ${sH(d1s.a, d1s.n)}.`, `Then ${op === '+' || op === '−' ? 'line up the powers and ' : ''}${op === '+' ? 'add' : op === '−' ? 'subtract' : op === '×' ? 'multiply' : 'divide'}: ${S(sH(s.a, s.n))} (that is ${nH(v)}).`],
    solveTex: [`${nTex(d1)} = ${sTex(d1s.a, d1s.n)}`, `${orderT.replace(nTex(d1), `(${sTex(d1s.a, d1s.n)})`)}`, `= ${sTex(s.a, s.n)}`],
    answer: sciAns(s.a, s.n),
    check: r => checkSci(v, r, (_x, _y, val) => {
      if (wrongV && wrongV.c > 0n && eq(val, wrongV)) return { ok: false, mc: MC.notSame, say: `That uses ${plain(a2)} for ${sciTerm}. The ${pH(n2)} is part of the number: write ${decTerm} as ${sH(d1s.a, d1s.n)} first. The answer is ${sH(s.a, s.n)}.` };
      return null;
    }, `${order} = ${S(sH(s.a, s.n))}.`),
  };
};
const sameNumber: Gen = (R, n) => {
  const a = coef(R, pick(R, [0, 1, 2])), e = R() < 0.6 ? -int(R, 2, 7) : int(R, 3, 8);
  const v = sciVal(a, e);
  if (R() < 0.5) {
    const opts: Opt[] = [
      { t: 'Yes: it is one number, written two ways.', ok: true, say: `Yes: ${sH(a, e)} = ${nH(v)}. Move the point ${Math.abs(e)} places to check.` },
      { t: 'No: a decimal and scientific notation can never be equal.', ok: false, mc: MC.formsIncompat, say: `Two ways of writing can name the same number, like ½ and 0.5. ${sH(a, e)} = ${nH(v)}.` },
      { t: `No: ${sH(a, e)} is just ${plain(a)}.`, ok: false, mc: MC.notSame, say: `The ${pH(e)} is part of the number: ${sH(a, e)} = ${nH(v)}, not ${plain(a)}.` },
    ];
    if (e < 0) opts.push({ t: `No: ${sH(a, e)} is a negative number.`, ok: false, mc: MC.negMakesNeg, say: `A negative exponent makes a number small, not negative: ${sH(a, e)} = ${nH(v)}.` });
    return choice(R, {
      id: `sameNumber-${n}`, family: 'sameNumber', prompt: `Is ${B(nH(v))} the same number as ${B(sH(a, e))}?`, board: `${nTex(v)} \\;\\overset{?}{=}\\; ${sTex(a, e)}`,
      solution: [`${pH(e)} moves the point ${Math.abs(e)} places ${e > 0 ? 'right' : 'left'}: ${sH(a, e)} = ${nH(v)}.`, 'So yes: one number, two ways of writing it.'], solveTex: [`${sTex(a, e)} = ${nTex(v)}`],
      pic: hopPic(hopForSci(a, e)), bareFirst: true,
    }, opts);
  }
  const a2 = coef(R, 1), e2 = e - pick(R, [0, 1]);
  const sum = add(v, sciVal(a2, e2)), s = sciOf(sum);
  return choice(R, {
    id: `sameNumber-${n}`, family: 'sameNumber', prompt: `Jordan says you can’t add ${B(nH(v))} and ${B(sH(a2, e2))}, because one is a decimal and the other is in scientific notation. Is Jordan right?`,
    board: `${nTex(v)} + ${sTex(a2, e2)}`,
    solution: [`Both are numbers, so they can be added. Write them the same way first: ${nH(v)} = ${sH(a, e)}.`, `The sum is ${S(sH(s.a, s.n))}.`], solveTex: [`${nTex(v)} = ${sTex(a, e)}`, `\\text{sum} = ${sTex(s.a, s.n)}`],
  }, [
    { t: 'No: both are numbers. Write them the same way, then add.', ok: true, say: `Right: ${nH(v)} = ${sH(a, e)}, so the sum is ${sH(s.a, s.n)}.` },
    { t: 'Yes: numbers written in different forms can’t be added.', ok: false, mc: MC.formsIncompat, say: `The form is only how a number is written. ${nH(v)} = ${sH(a, e)}, so they add like any two numbers: ${sH(s.a, s.n)}.` },
    { t: `No: just add the numbers you see: ${plain(v)} + ${plain(a2)}.`, ok: false, mc: MC.notSame, say: `${sH(a2, e2)} is not ${plain(a2)}: the ${pH(e2)} is part of it. Write both the same way first: the sum is ${sH(s.a, s.n)}.` },
  ]);
};

// ===================== 10 e-notation =====================
function eText(a: Dec, e: number, dev: 'calculator' | 'spreadsheet'): string {
  if (dev === 'calculator') return `${plain(a)}E${e}`;
  const [i, f = ''] = plain(a).split('.');
  return `${i}.${(f + '00').slice(0, 2)}E${e < 0 ? '-' : '+'}${String(Math.abs(e)).padStart(2, '0')}`;
}
const eNote: Gen = (R, n) => {
  const dev = pick(R, ['calculator', 'spreadsheet'] as const);
  const a = coef(R, pick(R, [1, 1, 2])), e = R() < 0.12 ? 0 : R() < 0.6 ? -int(R, 2, 12) : int(R, 2, 12);
  const txt = eText(a, e, dev);
  const right = e === 0 ? `${sH(a, 0)} = ${plain(a)}` : sH(a, e);
  const opts: Opt[] = [{ t: right, ok: true, say: `Yes: E means “times 10 to the power”. ${txt} = ${S(right)}.` }];
  if (e < 0) {
    opts.push({ t: `${plain(a)} − ${-e} = ${nH(sub(a, dec(-e)))}`, ok: false, mc: MC.eNote, say: `The E is not a minus sign. ${txt} means ${plain(a)} × ${pH(e)}.` });
    opts.push({ t: `−${plain(a)} × ${pH(-e)}`, ok: false, mc: MC.negMakesNeg, say: `The minus belongs to the exponent: the number is tiny, not negative. ${txt} = ${sH(a, e)}.` });
  } else if (e > 0) {
    opts.push({ t: `${plain(a)}<sup>${e}</sup>`, ok: false, mc: MC.eNote, say: `E does not make ${plain(a)} the base of a power. ${txt} means ${plain(a)} × ${pH(e)}.` });
    opts.push({ t: 'An error: the answer is too big to show.', ok: false, say: `E is not an error message. ${txt} means ${plain(a)} × ${pH(e)}.` });
  } else {
    opts.push({ t: `${plain(a)} × 0 = 0`, ok: false, mc: MC.eNote, say: `E0 means × ${pH(0)} = × 1, not × 0. ${txt} = ${plain(a)}.` });
    opts.push({ t: `${plain(mul(a, dec(10)))}`, ok: false, say: `E0 means × ${pH(0)}, and ${pH(0)} = 1. ${txt} = ${plain(a)}.` });
  }
  return choice(R, {
    id: `eNote-${n}`, family: 'eNote', prompt: `A ${dev} shows ${B(txt)}. What number is that?`, board: `\\texttt{${txt}}`,
    pic: { kind: 'screen', text: txt, device: dev },
    solution: [`On a ${dev}, E means “times 10 to the power”: ${txt} = ${plain(a)} × ${pH(e)}.`, e < 0 ? `A tiny positive number: ${nH(sciVal(a, e))}.` : e > 0 ? `A big number: ${nH(sciVal(a, e))}.` : `${pH(0)} = 1, so it is just ${plain(a)}.`],
    solveTex: [`\\texttt{${txt}} = ${sTex(a, e)}`],
  }, opts);
};
const eDecimal: Gen = (R, n) => {
  const dev = pick(R, ['calculator', 'spreadsheet'] as const);
  const a = coef(R, pick(R, [1, 1, 2])), e = R() < 0.5 ? -int(R, 1, 6) : int(R, 1, 6);
  const txt = eText(a, e, dev), v = sciVal(a, e);
  return {
    id: `eDecimal-${n}`, family: 'eDecimal', prompt: `A ${dev} shows ${B(txt)}. Type the number as an ordinary decimal (no commas).`, board: `\\texttt{${txt}}`, input: 'num',
    pic: { kind: 'screen', text: txt, device: dev },
    solution: [`${txt} means ${sH(a, e)}.`, `Move the point ${Math.abs(e)} places ${e > 0 ? 'right' : 'left'}: ${S(nH(v))}.`],
    solveTex: [`\\texttt{${txt}} = ${sTex(a, e)}`, `= ${nTex(v)}`],
    answer: numAns(v),
    check: r => {
      const x = readNum(r);
      if (!x) return { ok: false, say: 'Type the number, without commas.' };
      if (eq(x, v)) return { ok: true, say: `Yes: ${txt} = ${sH(a, e)} = ${S(nH(v))}.` };
      if (eq(x, sub(a, dec(Math.abs(e)))) || eq(x, add(a, dec(e)))) return { ok: false, mc: MC.eNote, say: `The E is not a minus or plus sign. ${txt} means ${sH(a, e)} = ${nH(v)}.` };
      if (x.c < 0n) return { ok: false, mc: MC.negMakesNeg, say: `The minus belongs to the exponent: a tiny number, not a negative one. ${txt} = ${nH(v)}.` };
      if (eq(x, sciVal(a, -e))) return { ok: false, mc: MC.shiftDir, say: `That moves the point the wrong way: ${txt} = ${sH(a, e)} = ${nH(v)}.` };
      return { ok: false, say: `${txt} = ${sH(a, e)}: move the point ${Math.abs(e)} places ${e > 0 ? 'right' : 'left'}. ${nH(v)}.` };
    },
  };
};

// ===================== 11 estimate-single-digit-power =====================
const FACTS: readonly { t: string; v: string; u: string }[] = [
  { t: 'In 2020 the United States had {v} people', v: '331449281', u: 'people' },
  { t: 'A sheet of printer paper is about {v} meters thick', v: '0.000104', u: 'm' },
  { t: 'Mount Everest is {v} meters tall', v: '8849', u: 'm' },
  { t: 'A human hair is about {v} meters wide', v: '0.000075', u: 'm' },
  { t: 'A red blood cell is about {v} meters across', v: '0.0000078', u: 'm' },
  { t: 'New York City has about {v} people', v: '8336817', u: 'people' },
  { t: 'The Sun is about {v} kilometers from Earth', v: '149600000', u: 'km' },
  { t: 'The Moon is about {v} kilometers from Earth', v: '384400', u: 'km' },
  { t: 'A grain of fine sand is about {v} meters wide', v: '0.00021', u: 'm' },
  { t: 'A flu virus is about {v} meters across', v: '0.00000012', u: 'm' },
  { t: 'Light travels {v} kilometers in one second', v: '299792', u: 'km' },
  { t: 'A blue whale can have a mass of {v} kilograms', v: '150000', u: 'kg' },
  { t: 'Texas has about {v} people', v: '30500000', u: 'people' },
  { t: 'A dust mite is about {v} meters long', v: '0.00025', u: 'm' },
  { t: 'There are {v} seconds in a day', v: '86400', u: 's' },
  { t: 'There are {v} seconds in a year', v: '31536000', u: 's' },
  { t: 'A paperclip has a mass of about {v} kilograms', v: '0.00098', u: 'kg' },
  { t: 'A marathon is {v} meters long', v: '42195', u: 'm' },
  { t: 'The world had about {v} people in 2023', v: '8045000000', u: 'people' },
  { t: 'A grain of rice has a mass of about {v} kilograms', v: '0.000029', u: 'kg' },
  { t: 'A bacterium is about {v} meters long', v: '0.0000021', u: 'm' },
  { t: 'The Pacific Ocean covers about {v} square kilometers', v: '165250000', u: 'km²' },
];
const estimate: Gen = (R, n) => {
  let v: Dec, ctx: string;
  if (R() < 0.55) { const f = pick(R, FACTS); v = D(f.v); ctx = f.t.replace('{v}', B(nH(v))) + '.'; }
  else {
    const nine = R() < 0.25;
    const a = nine ? dec(int(R, 95, 99), -1) : coef(R, pick(R, [1, 2, 3]));
    v = sciVal(a, R() < 0.5 ? -int(R, 1, 8) : int(R, 1, 9));
    ctx = `A measurement is ${B(nH(v))}.`;
  }
  const r1 = roundSig(v, 1), t = sciOf(r1), raw = sciOf(v);
  const digits = isInt(v) ? plain(v).length : 0;
  const lead0 = toNum(v) < 1 ? -raw.n - 1 : -1;
  const vs = v.c.toString();
  return {
    id: `estimate-${n}`, family: 'estimate', prompt: `${ctx} Estimate it as one digit times a power of 10.`, board: `${nTex(v)} \\approx \\,? \\times 10^{?}`, input: 'pair', pairLead: '≈', pairOp: SCI_OP,
    pic: hopPic({ digits: vs, from: vs.length + v.e, to: 1 }),
    solution: [`In scientific notation: ${nH(v)} = ${sH(raw.a, raw.n)}.`, `Round the number in front to one digit: ${plain(raw.a)} ≈ ${plain(roundSig(raw.a, 1))}.`, eq(roundSig(raw.a, 1), dec(10)) ? `10 × ${pH(raw.n)} is ${S(sH(t.a, t.n))}: the number in front must stay under 10.` : `So ${nH(v)} ≈ ${S(sH(t.a, t.n))}.`],
    solveTex: [`${nTex(v)} = ${sTex(raw.a, raw.n)}`, `\\approx ${sTex(t.a, t.n)}`],
    answer: sciAns(t.a, t.n),
    check: r => {
      const p = readPair(r);
      if (!p) return { ok: false, say: 'Fill in both boxes: one digit in front, and the power of 10.' };
      if (eq(sciVal(p.x, p.y), r1)) {
        if (isCoef(p.x)) return { ok: true, say: `Yes: ${nH(v)} ≈ ${S(sH(t.a, t.n))}.` };
        return { ok: false, mc: MC.coefOut, say: `${sH(p.x, p.y)} is the right size, but the number in front must be under 10: ${sH(t.a, t.n)}.` };
      }
      if (p.y === t.n && !isInt(p.x)) return { ok: false, say: `The power is right. Now round the number in front to ONE digit: ${sH(t.a, t.n)}.` };
      if (lead0 >= 0 && p.y === -lead0 && p.y !== t.n) return { ok: false, mc: MC.countZeros, say: `${nH(v)} has ${lead0} zero${lead0 === 1 ? '' : 's'} after the point, but the point moves ${-raw.n} places to get past the first non-zero digit: ${sH(t.a, t.n)}.` };
      if (digits && p.y === digits && p.y !== t.n) return { ok: false, mc: MC.countDigits, say: `${nH(v)} has ${digits} digits, but the point moves ${raw.n} places (one digit stays in front): ${sH(t.a, t.n)}.` };
      if (p.y === -t.n && t.n !== 0) return { ok: false, mc: MC.shiftDir, say: `The exponent has the wrong sign: ${nH(v)} is ${toNum(v) < 1 ? 'less than 1' : 'more than 10'}. ${sH(t.a, t.n)}.` };
      return { ok: false, say: `${nH(v)} = ${sH(raw.a, raw.n)} ≈ ${sH(t.a, t.n)}.` };
    },
  };
};

// ===================== 12 compare-times-as-much =====================
interface Thing { name: string; v: string; icon: Icon }
const SMALL: readonly Thing[] = [
  { name: 'a flu virus', v: '1e-7', icon: 'cell' }, { name: 'a bacterium', v: '2e-6', icon: 'cell' },
  { name: 'a red blood cell', v: '8e-6', icon: 'cell' }, { name: 'a pollen grain', v: '4e-5', icon: 'grain' },
  { name: 'a human hair', v: '8e-5', icon: 'dot' }, { name: 'a grain of sand', v: '2e-4', icon: 'grain' },
  { name: 'a flea', v: '2e-3', icon: 'dot' }, { name: 'an ant', v: '4e-3', icon: 'dot' },
];
const PEOPLE: readonly Thing[] = [
  { name: 'the world', v: '8e9', icon: 'town' }, { name: 'the United States', v: '3.2e8', icon: 'town' },
  { name: 'Texas', v: '3.2e7', icon: 'town' }, { name: 'New York City', v: '8e6', icon: 'town' },
  { name: 'a big stadium crowd', v: '8e4', icon: 'town' }, { name: 'a small town', v: '4e3', icon: 'town' },
  { name: 'a high school', v: '1.6e3', icon: 'town' },
];
const SPACE: readonly Thing[] = [
  { name: 'Earth to the Moon', v: '4e5', icon: 'planet' }, { name: 'Earth to the Sun', v: '1.5e8', icon: 'planet' },
  { name: 'Neptune to the Sun', v: '4.5e9', icon: 'planet' }, { name: 'around Earth', v: '4e4', icon: 'planet' },
  { name: 'New York to Los Angeles', v: '4e3', icon: 'dot' }, { name: 'Jupiter to the Sun', v: '7.5e8', icon: 'planet' },
];
const GROUPS = [
  { things: SMALL, what: 'long or wide', unit: 'meters', ask: (a: string, b: string) => `About how many times as long (or wide) as ${b} is ${a}?` },
  { things: PEOPLE, what: 'people', unit: 'people', ask: (a: string, b: string) => `About how many times as many people does ${a} have as ${b}?` },
  { things: SPACE, what: 'far', unit: 'km', ask: (a: string, b: string) => `About how many times as far is ${a} as ${b}?` },
];
/** the pairs (big, small) of a group whose ratio is a whole number from 2 to 100,000 and fits on a ladder */
function ratioPairs(things: readonly Thing[]): [Thing, Thing][] {
  const out: [Thing, Thing][] = [];
  for (const x of things) for (const y of things) {
    const r = div(D(x.v), D(y.v));
    if (!r || !isInt(r) || cmp(r, dec(2)) < 0 || cmp(r, dec(100000)) > 0) continue;
    if (sciOf(D(x.v)).n - sciOf(D(y.v)).n > 4) continue;
    out.push([x, y]);
  }
  return out;
}
export const PAIRS = GROUPS.map(g => ratioPairs(g.things));
function ladderFor(big: Dec, small: Dec, bigName: string, smallName: string, unit: string, icons: [Icon, Icon]): LadderPic {
  const sb = sciOf(big), ss = sciOf(small);
  const k = sb.n - ss.n;
  const q = div(sb.a, ss.a)!;
  const ghost = sciVal(ss.a, sb.n);
  const lo = ss.n, hi = Math.max(sb.n + 1, sciOf(ghost).n + 1);
  const p: LadderParams = {
    lo, hi, unit,
    marks: [{ v: small, name: smallName, col: 'first', icon: icons[1] }, { v: big, name: bigName, col: 'second', icon: icons[0] }],
    climb: { from: 0, rungs: k },
    ...(eq(q, dec(1)) ? {} : { within: { to: 1, label: `\\times ${plain(q)}` } }),
  };
  return { kind: 'ladder', p, show: ['rungs', 'm0', 'm1'], solve: eq(q, dec(1)) ? ['climb'] : ['climb', 'within'] };
}
const timesFam: Gen = (R, n) => {
  let big: Dec, small: Dec, prompt: string, bigName: string, smallName: string, unit: string, icons: [Icon, Icon];
  if (R() < 0.6) {
    const gi = int(R, 0, GROUPS.length - 1), g = GROUPS[gi]!;
    const [x, y] = pick(R, PAIRS[gi]!);
    big = D(x.v); small = D(y.v);
    const bx = sciOf(big), sy = sciOf(small);
    prompt = `${cap(x.name)}: about ${A(sH(bx.a, bx.n))} ${g.unit}. ${cap(y.name)}: about ${A(sH(sy.a, sy.n))} ${g.unit}. ${g.ask(x.name, y.name)}`;
    bigName = cap(x.name); smallName = cap(y.name); unit = g.unit; icons = [x.icon, y.icon];
  } else {
    const k = int(R, 1, 4), equal = R() < 0.3;
    const as = D(pick(R, ['1', '1.5', '2', '2.5', '3', '4', '5', '8']));
    let q: Dec = equal ? dec(1) : D(pick(R, ['0.25', '0.5', '1.5', '2', '2.5', '3', '4']));
    if (!isInt(mul(q, pow10(k)))) q = dec(2);
    const ns = int(R, -9, 5);
    small = sciVal(as, ns); big = mul(small, mul(q, pow10(k)));
    const bx = sciOf(big), sy = sciOf(small);
    prompt = `How many times as large as ${A(sH(sy.a, sy.n))} is ${B(sH(bx.a, bx.n))}?`;
    bigName = 'the larger'; smallName = 'the smaller'; unit = ''; icons = ['dot', 'dot'];
  }
  const r = div(big, small)!;
  const sb = sciOf(big), ss = sciOf(small);
  const k = sb.n - ss.n, q = div(sb.a, ss.a)!;
  const pic = ladderFor(big, small, bigName, smallName, unit, icons);
  return {
    id: `times-${n}`, family: 'times', prompt, board: `\\dfrac{${sTex(sb.a, sb.n)}}{${sTex(ss.a, ss.n)}} = \\,?`, input: 'num', unit: 'times',
    pic,
    solution: [`Divide the powers: ${pH(sb.n)} ÷ ${pH(ss.n)} = ${pH(k)}: ${k === 1 ? 'one rung' : `${words(k)} rungs`} up the ladder, ×10 each.`, `Divide the numbers in front: ${plain(sb.a)} ÷ ${plain(ss.a)} = ${plain(q)}.`, `${plain(q)} × ${pH(k)} = ${S(nH(r))} times as ${unit === 'people' ? 'many' : 'large'}.`],
    solveTex: [`10^{${sb.n}} \\div 10^{${ss.n}} = 10^{${k}}`, `${plain(sb.a)} \\div ${plain(ss.a)} = ${plain(q)}`, `${plain(q)} \\times 10^{${k}} = ${nTex(r)}`],
    answer: numAns(r),
    check: rr => {
      const x = readNum(rr);
      if (!x) return { ok: false, say: 'Type a number.' };
      if (eq(x, r)) return { ok: true, say: `Yes: ${plain(q)} × ${pH(k)} = ${S(nH(r))} times.` };
      if (!eq(q, dec(1)) && eq(x, pow10(k))) return { ok: false, mc: MC.expOnly, say: `${nH(pow10(k))} counts only the rungs. Inside the rung, ${plain(sb.a)} ÷ ${plain(ss.a)} = ${plain(q)} counts too: ${plain(q)} × ${pH(k)} = ${nH(r)}.` };
      if (k !== 0 && eq(x, q)) return { ok: false, mc: MC.leadOnly, say: `${plain(q)} compares only the numbers in front. The powers add ${pH(k)}: ${plain(q)} × ${pH(k)} = ${nH(r)}.` };
      if (k >= 2 && eq(x, dec(k))) return { ok: false, mc: MC.additive, say: `${pH(sb.n)} is not ${k} more than ${pH(ss.n)}: it is ${nH(pow10(k))} times as much, ${times(k)} ×10. The answer is ${nH(r)}.` };
      const inv = div(small, big);
      if (inv && eq(x, inv)) return { ok: false, say: `That is how many times as large the smaller one is. Divide the larger by the smaller: ${nH(r)}.` };
      return { ok: false, say: `${pH(k)} from the powers, ${plain(q)} from the numbers in front: ${nH(r)} times.` };
    },
  };
};
const mi = (n: number) => String(n).replace('-', '−');
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// ===================== 13 order-of-magnitude-convention =====================
const band: Gen = (R, n) => {
  const asDec = R() < 0.5;
  const a = R() < 0.3 ? pick(R, [dec(1), D('9.5'), dec(9)]) : coef(R, pick(R, [0, 1, 2]));
  const e = asDec ? (R() < 0.5 ? -int(R, 1, 6) : int(R, 1, 7)) : int(R, -8, 8);
  const v = sciVal(a, e);
  const shown = asDec ? nH(v) : sH(a, e);
  const bandT = (k: number) => `between ${pH(k)} and ${pH(k + 1)}`;
  const opts: Opt[] = [{ t: bandT(e), ok: true, say: `Yes: ${pH(e)} ≤ ${shown} &lt; ${pH(e + 1)}. ${eq(a, dec(1)) ? `A power of 10 itself starts its band.` : `The ${plain(a)} in front only says how far up the band it is.`}` }];
  if (asDec && e < 0) opts.push({ t: bandT(e + 1), ok: false, mc: MC.countZeros, say: `Counting the zeros after the point gives ${-e - 1}, but ${nH(v)} is ${sH(a, e)}: between ${pH(e)} and ${pH(e + 1)}.` });
  else if (asDec && e > 0) opts.push({ t: bandT(e + 1), ok: false, mc: MC.countDigits, say: `${nH(v)} has ${e + 1} digits, but it is ${sH(a, e)}: between ${pH(e)} and ${pH(e + 1)}.` });
  else opts.push({ t: bandT(e + 1), ok: false, mc: MC.coefOut, say: `${plain(a)} is less than 10, so the number has not reached ${pH(e + 1)} yet: it is between ${pH(e)} and ${pH(e + 1)}.` });
  opts.push({ t: bandT(e - 1), ok: false, say: `${shown} is at least ${pH(e)}, because the number in front is at least 1: between ${pH(e)} and ${pH(e + 1)}.` });
  const lo = e - 1, hi = e + 2;
  return choice(R, {
    id: `band-${n}`, family: 'band', prompt: `A number is in the band ${pH('<i>n</i>')} ≤ <i>x</i> &lt; ${pH('<i>n</i> + 1')}. Which band is ${B(shown)} in?`, board: asDec ? nTex(v) : sTex(a, e),
    pic: { kind: 'ladder', p: { lo, hi, marks: [{ v, name: 'the number', col: 'first', icon: 'dot' }], band: e }, show: ['rungs', 'm0'], solve: ['band'] },
    solution: [asDec ? `${shown} = ${sH(a, e)}.` : `The exponent is ${e} and 1 ≤ ${plain(a)} &lt; 10.`, `So ${pH(e)} ≤ ${shown} &lt; ${pH(e + 1)}: ${S(bandT(e))}.`],
    solveTex: [`${asDec ? nTex(v) : sTex(a, e)} \\ge 10^{${e}}`, `${asDec ? nTex(v) : sTex(a, e)} < 10^{${e + 1}}`],
  }, opts);
};
const bandVsRatio: Gen = (R, n) => {
  const kind = pick(R, ['edge', 'powers', 'cross'] as const);
  if (kind === 'powers') {
    const lo = int(R, -6, 6), d = int(R, 2, 6), hi = lo + d;
    return choice(R, {
      id: `bandVsRatio-${n}`, family: 'bandVsRatio', prompt: `How do ${B(pH(hi))} and ${A(pH(lo))} compare?`, board: `\\dfrac{10^{${hi}}}{10^{${lo}}} = \\,?`,
      solution: [`Each step up the ladder is ×10.`, `${d} steps: ${pH(d)} = ${S(nH(pow10(d)))} times.`], solveTex: [`\\dfrac{10^{${hi}}}{10^{${lo}}} = 10^{${d}} = ${nTex(pow10(d))}`],
      pic: { kind: 'ladder', p: { lo: lo, hi: Math.min(hi + 1, lo + 7), marks: [{ v: pow10(lo), name: 'the smaller', val: pTex(lo), col: 'first', icon: 'dot' }, { v: pow10(hi), name: 'the larger', val: pTex(hi), col: 'second', icon: 'dot' }], climb: { from: 0, rungs: d } }, show: ['rungs', 'm0', 'm1'], solve: ['climb'] },
    }, [
      { t: `${pH(hi)} is ${nH(pow10(d))} times ${pH(lo)}.`, ok: true, say: `Yes: ${d} rungs up, ×10 each: ${pH(d)} = ${nH(pow10(d))}.` },
      { t: `${pH(hi)} is ${d} more than ${pH(lo)}.`, ok: false, mc: MC.additive, say: `The exponents differ by ${d}, but the numbers differ by a factor: ${pH(hi)} = ${nH(pow10(d))} × ${pH(lo)}.` },
      { t: `${pH(hi)} is ${d} times ${pH(lo)}.`, ok: false, mc: MC.additive, say: `Each of the ${d} steps is ×10, so ${pH(hi)} is 10 × 10 ${d > 2 ? '× …' : ''} = ${nH(pow10(d))} times ${pH(lo)}.` },
    ]);
  }
  const e = int(R, -6, 7);
  let a1: Dec, a2: Dec, e2: number;
  if (kind === 'edge') { a1 = D(pick(R, ['8', '9', '9.5', '8.5'])); a2 = D(pick(R, ['1', '1.2', '1.5'])); e2 = e + 1; }
  else { a1 = D(pick(R, ['4', '5', '6', '8'])); a2 = D(pick(R, ['1', '1.2', '1.6', '2', '2.4', '3'])); e2 = e + 1; }
  const v1 = sciVal(a1, e), v2 = sciVal(a2, e2);
  const ratio = toNum(v2) / toNum(v1);
  const rs = ratio < 10 ? (Math.round(ratio * 10) / 10).toString() : String(Math.round(ratio));
  const exact = div(v2, v1);
  const about = exact && sigDigits(exact) <= 2 ? plain(exact) : rs;
  const aboutWord = exact && sigDigits(exact) <= 2 ? '' : 'about ';
  return choice(R, {
    id: `bandVsRatio-${n}`, family: 'bandVsRatio', prompt: `${A(`A = ${sH(a1, e)}`)} and ${B(`B = ${sH(a2, e2)}`)}. Which is true?`, board: `\\dfrac{${sTex(a2, e2)}}{${sTex(a1, e)}}`,
    pic: { kind: 'ladder', p: { lo: e - 1, hi: e2 + 1, marks: [{ v: v1, name: 'A', col: 'first', icon: 'dot' }, { v: v2, name: 'B', col: 'second', icon: 'dot' }], band: e }, show: ['rungs', 'm0', 'm1'], solve: ['band'] },
    solution: [`A is in the band ${pH(e)} to ${pH(e + 1)}; B is one band up.`, `But B ÷ A = (${plain(a2)} ÷ ${plain(a1)}) × ${pH(1)} ≈ ${S(about)}: the coefficients count too.`],
    solveTex: [`= \\dfrac{${plain(a2)}}{${plain(a1)}} \\times 10^{1} ${aboutWord ? '\\approx' : '='} ${about}`],
  }, [
    { t: `B is one band up, but only ${aboutWord}${about} times as big as A.`, ok: true, say: `Yes: the band is set by the exponent, the exact ratio needs the numbers in front too: ${aboutWord}${about}.` },
    { t: 'B is exactly 10 times as big as A: the exponents are one apart.', ok: false, mc: MC.expOnly, say: `One exponent apart is 10 times only when the numbers in front are equal. Here B ÷ A = ${aboutWord}${about}.` },
    kind === 'edge'
      ? { t: `B is just 1 more than A: ${mi(e2)} − ${e < 0 ? `(${mi(e)})` : mi(e)} = 1.`, ok: false, mc: MC.additive, say: `The exponents differ by 1, but the numbers differ by ${nH(sub(v2, v1))}. B is ${aboutWord}${about} times A.` }
      : { t: `A is bigger, because ${plain(a1)} is more than ${plain(a2)}.`, ok: false, mc: MC.leadOnly, say: `The power of 10 counts first: B has the bigger power, so B is bigger, ${aboutWord}${about} times A.` },
  ]);
};

// ===================== 14 choose-unit =====================
interface Conv { what: string; v: string; from: string; to: string; k: number; per?: string }
const CONVS: readonly Conv[] = [
  { what: 'The seafloor in the Atlantic spreads about', v: '0.000025', from: 'km', to: 'mm', k: 6, per: ' per year' },
  { what: 'A red blood cell is about', v: '0.000008', from: 'm', to: 'µm', k: 6 },
  { what: 'A flu virus is about', v: '0.00000012', from: 'm', to: 'nm', k: 9 },
  { what: 'Hair grows about', v: '0.00000035', from: 'km', to: 'mm', k: 6, per: ' per day' },
  { what: 'A bacterium is about', v: '0.000002', from: 'm', to: 'µm', k: 6 },
  { what: 'A fingernail grows about', v: '0.0000035', from: 'km', to: 'mm', k: 6, per: ' per month' },
  { what: 'A human hair is about', v: '0.00008', from: 'm', to: 'µm', k: 6 },
  { what: 'A road trip is', v: '4500000', from: 'm', to: 'km', k: -3 },
  { what: 'A water tank holds', v: '3000000', from: 'mL', to: 'L', k: -3 },
  { what: 'A ship has a mass of', v: '72000000', from: 'g', to: 't', k: -6 },
];
const uTex = (u: string) => (u === 'µm' ? '\\mu\\text{m}' : `\\text{${u}}`);
const unitName = (u: string) => ({ km: 'kilometers', mm: 'millimeters', m: 'meters', 'µm': 'micrometers', nm: 'nanometers', mL: 'milliliters', L: 'liters', g: 'grams', t: 'metric tons' } as Record<string, string>)[u] ?? u;
const convertUnit: Gen = (R, n) => {
  const c = pick(R, CONVS), v = D(c.v), per = c.per ?? '';
  const right = sciVal(v, c.k), wrongDir = sciVal(v, -c.k);
  const big = c.k > 0 ? c.from : c.to, small = c.k > 0 ? c.to : c.from, K = Math.abs(c.k);
  const show = (d: Dec) => (cmp(d, D('0.001')) < 0 || cmp(d, D(1e7)) > 0 ? sciH(d) : nH(d));
  return choice(R, {
    id: `convertUnit-${n}`, family: 'convertUnit', prompt: `${c.what} ${B(`${nH(v)} ${c.from}`)}${per}. Use 1 ${big} = ${pH(K)} ${small}. How much is that in ${unitName(c.to)}?`,
    board: `${nTex(v)}\\ ${uTex(c.from)} = \\,?\\ ${uTex(c.to)}`,
    pic: hopPic({ digits: v.c.toString(), from: v.c.toString().length + v.e, to: v.c.toString().length + v.e + c.k }), bareFirst: true,
    solution: [`${c.k > 0 ? `${unitName(c.to)} are smaller units, so there are MORE of them: multiply by ${pH(K)}.` : `${unitName(c.to)} are bigger units, so there are FEWER of them: divide by ${pH(K)}.`}`, `${nH(v)} ${c.k > 0 ? '×' : '÷'} ${pH(K)} = ${S(`${show(right)} ${c.to}`)}${per}.`],
    solveTex: [`${nTex(v)} ${c.k > 0 ? '\\times' : '\\div'} 10^{${K}} = ${nTex(right)}`],
  }, [
    { t: `${show(right)} ${c.to}${per}`, ok: true, say: `Yes: ${c.k > 0 ? 'smaller units, more of them' : 'bigger units, fewer of them'}: ${show(right)} ${c.to}${per}. The same amount, a friendlier number.` },
    { t: `${show(wrongDir)} ${c.to}${per}`, ok: false, mc: MC.unitDir, say: `That goes the wrong way. ${unitName(c.to)} are ${c.k > 0 ? 'smaller' : 'bigger'} than ${unitName(c.from)}, so you need ${c.k > 0 ? 'more' : 'fewer'} of them: ${show(right)} ${c.to}.` },
    { t: `${nH(v)} ${c.to}${per}`, ok: false, mc: MC.convChanges, say: `The same number in a different unit is a different amount. In ${unitName(c.to)} the number changes: ${show(right)} ${c.to}.` },
  ]);
};
interface UnitCtx { what: string; opts: [string, string, string]; sizeWord: string }
const UNITS: readonly UnitCtx[] = [
  { what: 'the width of a red blood cell', opts: ['8 micrometers', '0.000008 meters', '0.000000008 kilometers'], sizeWord: 'width' },
  { what: 'how fast the Atlantic seafloor spreads', opts: ['25 millimeters per year', '0.000025 kilometers per year', '0.025 meters per year'], sizeWord: 'speed' },
  { what: 'the size of a flu virus', opts: ['120 nanometers', '0.00000012 meters', '0.00012 millimeters'], sizeWord: 'size' },
  { what: 'the width of a human hair', opts: ['80 micrometers', '0.00008 meters', '0.00000008 kilometers'], sizeWord: 'width' },
  { what: 'the length of a marathon', opts: ['42.195 kilometers', '42,195,000 millimeters', '4,219,500 centimeters'], sizeWord: 'length' },
  { what: 'the mass of a ship', opts: ['72,000 metric tons', '72,000,000,000 grams', '72,000,000,000,000 milligrams'], sizeWord: 'mass' },
  { what: 'how much a fingernail grows in a month', opts: ['3.5 millimeters', '0.0000035 kilometers', '0.0035 meters'], sizeWord: 'growth' },
];
const pickUnit: Gen = (R, n) => {
  const u = pick(R, UNITS);
  if (R() < 0.65) {
    return choice(R, {
      id: `pickUnit-${n}`, family: 'pickUnit', prompt: `A science poster asks for ${u.what} as a number from 1 to 1,000, with a unit. All three are correct measurements. Which one fits the poster?`,
      board: '1 \\le \\text{number} \\le 1{,}000',
      solution: [`All three name the same ${u.sizeWord}; only the unit differs.`, `Only ${S(u.opts[0])} gives a number from 1 to 1,000.`], solveTex: [],
    }, [
      { t: u.opts[0], ok: true, say: `Yes: the same ${u.sizeWord}, and the number is easy to read and compare.` },
      { t: u.opts[1], ok: false, mc: MC.unitPurpose, say: `Correct, but the number is not from 1 to 1,000. The poster needs ${u.opts[0]}.` },
      { t: u.opts[2], ok: false, mc: MC.unitPurpose, say: `Correct, but the number is not from 1 to 1,000. The poster needs ${u.opts[0]}.` },
    ]);
  }
  const [x, y] = [u.opts[0], u.opts[1]];
  return choice(R, {
    id: `pickUnit-${n}`, family: 'pickUnit', prompt: `${cap(u.what)} can be written as ${B(x)} or as ${B(y)}. Which is true?`, board: `\\text{${x.replace(/,/g, '{,}')}} \\;?\\; \\text{${y.replace(/,/g, '{,}')}}`,
    solution: ['Changing the unit changes the number, not the thing measured.', `${x} and ${y} are ${S(`the same ${u.sizeWord}`)}.`], solveTex: [],
  }, [
    { t: `They are the same ${u.sizeWord}, written with different units.`, ok: true, say: `Yes: a smaller unit needs a bigger number for the same ${u.sizeWord}.` },
    { t: `${x} is more: its number is bigger.`, ok: false, mc: MC.convChanges, say: `The number is bigger because the unit is smaller. The ${u.sizeWord} itself does not change.` },
    { t: `${y} is more: its unit is bigger.`, ok: false, mc: MC.convChanges, say: `The unit is bigger, so the number is smaller. It is the same ${u.sizeWord}.` },
  ]);
};

// ===================== 15 sci-notation-word-problems =====================
type Op = 'mul' | 'div' | 'add';
interface Story { text: string; ask: string; a: Dec; b: Dec; op: Op; unit: string; aT: string; bT: string }
function story(R: () => number): Story {
  const t = pick(R, ['mass', 'light', 'fit', 'trip', 'budget', 'water'] as const);
  if (t === 'mass') {
    const N = sciVal(D(pick(R, ['6', '2', '3', '1.5', '4'])), int(R, 20, 24)), m = sciVal(D(pick(R, ['3', '2', '5', '1.5'])), -int(R, 24, 27));
    return { text: `One water molecule has a mass of about ${A(sciH(m) + ' kg')}. A drop has about ${B(sciH(N))} molecules.`, ask: 'What is the mass of the drop?', a: N, b: m, op: 'mul', unit: 'kg', aT: sciH(N), bT: sciH(m) };
  }
  if (t === 'light') {
    const d = pick(R, ['1.5e8', '2.25e8', '7.8e8', '4.5e9', '3.9e5', '6e7']);
    const c = D('3e5'), dd = D(d);
    return { text: `Light travels about ${A(sciH(c) + ' km')} every second. A planet is ${B(sciH(dd) + ' km')} away.`, ask: 'How many seconds does its light take to reach us?', a: dd, b: c, op: 'div', unit: 's', aT: sciH(dd), bT: sciH(c) };
  }
  if (t === 'fit') {
    const L = D(pick(R, ['1', '2', '0.5', '4'])), s = D(pick(R, ['2e-3', '4e-6', '5e-5', '8e-6', '2.5e-4', '2e-6']));
    return { text: `A cell is ${A(sciH(s) + ' m')} long. A row of these cells is ${B(nH(L) + ' m')} long.`, ask: 'How many cells are in the row?', a: L, b: s, op: 'div', unit: 'cells', aT: nH(L), bT: sciH(s) };
  }
  if (t === 'trip') {
    const a = sciVal(coef(R, 1), int(R, 5, 8)), b = sciVal(coef(R, 1), sciOf(a).n - int(R, 0, 2));
    return { text: `A space probe flies ${A(sciH(a) + ' km')}, then another ${B(sciH(b) + ' km')}.`, ask: 'How far does it fly in all?', a, b, op: 'add', unit: 'km', aT: sciH(a), bT: sciH(b) };
  }
  if (t === 'budget') {
    const people = D(pick(R, ['3e8', '4e7', '2e7', '8e6'])), per = D(pick(R, ['2e4', '1.5e4', '5e3', '1.2e4']));
    const tot = mul(people, per);
    return { text: `A government plans to spend ${A('$' + sciH(tot))} in a year. The country has ${B(sciH(people))} people.`, ask: 'How many dollars is that per person?', a: tot, b: people, op: 'div', unit: 'dollars', aT: '$' + sciH(tot), bT: sciH(people) };
  }
  const p = D(pick(R, ['3.3e8', '8e9', '4e7'])), w = D(pick(R, ['1.5e2', '3e2', '5e1', '2e2']));
  return { text: `Each person uses about ${A(sciH(w) + ' liters')} of water a day. A country has ${B(sciH(p))} people.`, ask: 'How many liters do they use in a day?', a: p, b: w, op: 'mul', unit: 'liters', aT: sciH(p), bT: sciH(w) };
}
/** an operand in a calculation: in parentheses when it is a product (1.5 × 10^8 ÷ 3 × 10^5 would be ambiguous) */
const par = (x: string) => (x.includes('×') ? `(${x})` : x);
const parT = (d: Dec) => (sciOf(d).n === 0 ? plain(d) : `(${sciTex(d)})`);
const run = (s: Story): Dec => (s.op === 'mul' ? mul(s.a, s.b) : s.op === 'add' ? add(s.a, s.b) : div(s.a, s.b)!);
const opSym = { mul: '×', div: '÷', add: '+' } as const;
const opTex = { mul: '\\times', div: '\\div', add: '+' } as const;
/** a two-step problem (after the single-step ones): three factors, or there and back at a speed */
function multiStep(R: () => number, n: number): SnItem {
  let text: string, ask: string, v: Dec, calc: string, calcT: string, unit: string, steps: string[], wrong: { v: Dec; mc?: string; say: string }[];
  if (R() < 0.5) {
    const drops = D(pick(R, ['4e3', '5e3', '4.8e3'])), per = D(pick(R, ['1.5e21', '2e21', '1.6e21'])), m = D('3e-26');
    const mols = mul(drops, per);
    v = mul(mols, m); unit = 'kg';
    text = `A cup of water holds about ${A(sciH(drops))} drops. Each drop has about ${B(sciH(per))} molecules, and one molecule has a mass of about ${sciH(m)} kg.`;
    ask = 'What is the mass of the water in the cup?';
    calc = `(${sciH(drops)}) × (${sciH(per)}) × (${sciH(m)})`; calcT = `(${sciTex(drops)}) \\times (${sciTex(per)}) \\times (${sciTex(m)})`;
    steps = [`Molecules in the cup: (${sciH(drops)}) × (${sciH(per)}) = ${sciH(mols)}.`, `Their mass: (${sciH(mols)}) × (${sciH(m)}) = ${S(sciH(v) + ' kg')}.`];
    wrong = [{ v: mul(drops, per), say: `That is the number of molecules. The question asks for their mass: multiply by ${sciH(m)} kg too.` }];
  } else {
    const d = D(pick(R, ['3.9e5', '1.5e8', '7.8e8', '2.25e8'])), c = D('3e5');
    const there = mul(d, D(2));
    v = div(there, c)!; unit = 's';
    const what = toNum(d) < 1e6 ? 'the Moon' : 'a planet';
    text = `A radio signal travels at the speed of light, about ${A(sciH(c) + ' km')} per second. ${cap(what)} is ${B(sciH(d) + ' km')} away. A signal goes there and its echo comes back.`;
    ask = 'How many seconds until the echo is back?';
    calc = `2 × (${sciH(d)}) ÷ (${sciH(c)})`; calcT = `2 \\times (${sciTex(d)}) \\div (${sciTex(c)})`;
    steps = [`There and back: 2 × (${sciH(d)}) = ${sciH(there)} km.`, `Time = distance ÷ speed: (${sciH(there)}) ÷ (${sciH(c)}) = ${S(sciH(v) + ' s')}.`];
    wrong = [{ v: div(d, c)!, mc: MC.keyword, say: `That is the time one way. The echo also has to come back: twice as far, so ${sciH(v)} s.` }];
  }
  const r = sciOf(v);
  return {
    id: `story-${n}`, family: 'story', prompt: `${text} ${ask} Answer in scientific notation.`, board: calcT, input: 'pair', pairLead: '', pairOp: SCI_OP, pairTail: unit,
    solution: [`Two steps: ${calc}.`, ...steps],
    solveTex: [calcT, `= ${sTex(r.a, r.n)}`],
    answer: sciAns(r.a, r.n),
    check: rr => checkSci(v, rr, (_x, _y, val) => { const w = wrong.find(x => eq(x.v, val)); return w ? { ok: false, mc: w.mc, say: w.say } : null; }, `${sH(r.a, r.n)} ${unit}.`),
  };
}
const storyFam: Gen = (R, n) => {
  if (R() < 0.3) return multiStep(R, n);
  const s = story(R), v = run(s), r = sciOf(v);
  const wrongMul = s.op === 'mul' ? null : mul(s.a, s.b);
  const wrongDiv = s.op === 'div' ? div(s.b, s.a) : div(s.a, s.b);
  return {
    id: `story-${n}`, family: 'story', prompt: `${s.text} ${s.ask} Answer in scientific notation.`, board: `${parT(s.a)} \\;?\\; ${parT(s.b)}`, input: 'pair', pairLead: '', pairOp: SCI_OP, pairTail: s.unit,
    solution: [`The calculation: ${par(s.aT)} ${opSym[s.op]} ${par(s.bT)}.`, `${s.op === 'add' ? 'Line up the powers, then add' : s.op === 'mul' ? 'Multiply the numbers in front, add the exponents' : 'Divide the numbers in front, subtract the exponents'}.`, `= ${S(`${sH(r.a, r.n)} ${s.unit}`)}.`],
    solveTex: [`${parT(s.a)} ${opTex[s.op]} ${parT(s.b)}`, `= ${sTex(r.a, r.n)}`],
    answer: sciAns(r.a, r.n),
    check: rr => checkSci(v, rr, (_x, _y, val) => {
      if (wrongMul && eq(val, wrongMul)) return { ok: false, mc: MC.keyword, say: `Multiplying does not fit here. ${s.ask.replace('?', '')}: ${par(s.aT)} ${opSym[s.op]} ${par(s.bT)} = ${sH(r.a, r.n)} ${s.unit}.` };
      if (s.op === 'div' && wrongDiv && eq(val, wrongDiv)) return { ok: false, mc: MC.largerBySmaller, say: `That divides the other way round. ${s.ask.replace('?', '')}: ${par(s.aT)} ÷ ${par(s.bT)} = ${sH(r.a, r.n)} ${s.unit}.` };
      if (s.op !== 'div' && wrongDiv && eq(val, wrongDiv)) return { ok: false, mc: MC.keyword, say: `Dividing does not fit here: ${par(s.aT)} ${opSym[s.op]} ${par(s.bT)} = ${sH(r.a, r.n)} ${s.unit}.` };
      return null;
    }, `${sH(r.a, r.n)} ${s.unit}.`),
  };
};
const storyOp: Gen = (R, n) => {
  const s = story(R);
  const A_ = par(s.aT), B_ = par(s.bT);
  const right = `${A_} ${opSym[s.op]} ${B_}`;
  const opts: Opt[] = [{ t: right, ok: true, say: `Yes: ${right}.` }];
  if (s.op === 'div') {
    opts.push({ t: `${B_} ÷ ${A_}`, ok: false, mc: MC.largerBySmaller, say: `Which amount is shared out? ${s.ask} needs ${right}.` });
    opts.push({ t: `${A_} × ${B_}`, ok: false, mc: MC.keyword, say: `Multiplying would make it bigger still. ${s.ask} needs ${right}.` });
  } else if (s.op === 'mul') {
    opts.push({ t: `${A_} ÷ ${B_}`, ok: false, mc: MC.largerBySmaller, say: `Each one adds the same amount, so it is a product: ${right}.` });
    opts.push({ t: `${A_} + ${B_}`, ok: false, mc: MC.keyword, say: `Adding counts one of each. ${s.ask} needs ${right}.` });
  } else {
    opts.push({ t: `${A_} × ${B_}`, ok: false, mc: MC.keyword, say: `The two parts are put together, so add: ${right}.` });
    opts.push({ t: `${A_} ÷ ${B_}`, ok: false, mc: MC.largerBySmaller, say: `Nothing is shared out here. The two parts are put together: ${right}.` });
  }
  const r = sciOf(run(s));
  return choice(R, {
    id: `storyOp-${n}`, family: 'storyOp', prompt: `${s.text} ${s.ask} Which calculation answers it?`, board: `${parT(s.a)} \\;?\\; ${parT(s.b)}`,
    solution: [`${s.ask} → ${S(right)}.`, `It comes to ${sH(r.a, r.n)} ${s.unit}.`], solveTex: [`${parT(s.a)} ${opTex[s.op]} ${parT(s.b)}`, `= ${sTex(r.a, r.n)}`],
  }, opts);
};
const report: Gen = (R, n) => {
  const s = story(R), v = run(s), r = sciOf(v);
  const two = roundSig(r.a, 2);
  const twoS = plain(two).includes('.') ? plain(two) : plain(two) + '.0';
  const big = mul(two, dec(10));
  const best = `${twoS} × ${pH(r.n)} ${s.unit}`;
  return choice(R, {
    id: `report-${n}`, family: 'report', prompt: `${s.text} ${s.ask} The measurements have two significant digits. Which is the best way to report the answer?`,
    board: `${parT(s.a)} ${opTex[s.op]} ${parT(s.b)}`,
    solution: [`${par(s.aT)} ${opSym[s.op]} ${par(s.bT)} = ${sH(r.a, r.n)}.`, `Two significant digits, scientific notation and the unit: ${S(best)}.`], solveTex: [`${parT(s.a)} ${opTex[s.op]} ${parT(s.b)}`, `= ${twoS} \\times 10^{${r.n}}\\ \\text{${s.unit}}`],
  }, [
    { t: best, ok: true, say: `Yes: in scientific notation, as precise as the measurements, with its unit.` },
    { t: `${twoS} × ${pH(r.n)}`, ok: false, mc: MC.bare, say: `The number is right, but ${twoS} × ${pH(r.n)} what? Say the unit: ${best}.` },
    { t: `${isInt(sciVal(two, r.n)) ? nH(sciVal(two, r.n)) + '.000' : nH(sciVal(two, r.n)) + '000'} ${s.unit}`, ok: false, mc: MC.visualExact, say: `The measurements only have two significant digits, so the answer can't be more precise than that. Report ${best}.` },
    { t: `${plain(big)} × ${pH(r.n - 1)} ${s.unit}`, ok: false, mc: MC.coefOut, say: `Same value, but ${plain(big)} is not from 1 up to 10. Report ${best}.` },
  ]);
};

export const GENERATORS: Record<FamilyId, Gen> = {
  isSci, negMeaning, toDecimal, toSci, renorm, multiply, divide, addSame, distribute, align, mixed, sameNumber, eNote,
  eDecimal, estimate, times: timesFam, band, bandVsRatio, convertUnit, pickUnit, story: storyFam, storyOp, report,
};
export const GENS: Readonly<Record<string, RtGen>> = GENERATORS;
