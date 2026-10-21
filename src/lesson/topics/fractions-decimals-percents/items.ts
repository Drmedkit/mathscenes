// items.ts: practice families for "Convert fractions, decimals, and percents: extended" (grade 7, 7.NS.A.2.d,
// 7.EE.B.3). Every family is one deep structure; a generator receives the sub-goal id and uses that sub-goal's number
// ranges (topic JSON `cases`). Every wrong answer the classifier recognises carries its id from
// math-curriculum-essentials/misconceptions.json (logged, never shown). All maths is exact (fdpMaths.ts: integers).
// Repeating decimals cannot be typed, so items that need a bar are choices (the bar is CSS: <span class="rep">).
// Pure: no DOM, no canvas.
import { type Gen, type Item, type Response, type Verdict, fr, gcd, int, pick, shuffle } from '../../runtime/item';
import type { LadderParams, LadderStep } from './DivisionLadder';
import type { CalcParams } from './Calculator';
import {
  type Dec, type Fin, cmpFinFrac, decHtml, decLong, decTex, digitAt, expand, finFrac, finStr, fracFin, isFin, longDivide,
  mixedOf, otherFactors, pctOf, reduce, roundFrac,
} from './fdpMaths';

// ---------- what the page draws for an item ----------
export type FdpPicture =
  /** the division ladder (or its digit strip): `pre` steps with the problem, `post` steps in the worked solution;
   *  `unshift` plays the × 100 backwards (percent → decimal); `rems` rings remainders */
  | { kind: 'ladder'; p: LadderParams; pre: LadderStep[]; post: LadderStep[]; unshift?: boolean; rems?: number[]; work: string[] }
  | { kind: 'calc'; p: CalcParams; work: string[] }
  | { kind: 'bare'; work: string[] };

export const MC = {
  wrongPlace: 'mc.decimals.names-wrong-place-unit',
  moreDigits: 'mc.decimals.more-fractional-positions-means-greater',
  ellipsisTerm: 'mc.decimals.ellipsis-excludes-terminating-value',
  lengthRepeat: 'mc.decimals.finite-decimal-length-implies-repetition',
  renaming: 'mc.fractions-concept.renaming-changes-amount',
  barLast: 'mc.decimals.repeat-bar-only-on-final-cycle-digit',
  prefixPattern: 'mc.exponents-roots.pattern-or-prefix-taken-as-repeating',
  truncFull: 'mc.decimals.truncation-taken-as-full-decimal',
  barAll: 'mc.decimals.repeat-block-notation',
  approxRep: 'mc.decimals.decimals-seen-as-approximations',
  shiftDigits: 'mc.percent.shifts-point-wrong-number-of-places',
  reversed: 'mc.fractions-concept.fraction-division-order-reversed',
  zeroOmitted: 'mc.decimals.quotient-zero-omitted',
  stopsEarly: 'mc.decimals.stops-before-repeat-appears',
  digitCycle: 'mc.decimals.repeated-quotient-digit-declares-cycle',
  alwaysEnds: 'mc.decimals.every-rational-division-eventually-terminates',
  familiarUnit: 'mc.decimals.familiar-unit-fraction-decides-termination',
  wholePct: 'mc.percent.percent-numerals-must-be-whole',
  noDiv100: 'mc.percent.percent-numeral-without-dividing-by-100',
  pointOne: 'mc.decimals.dollars-cents-point-misplaced',
  nonIntFrac: 'mc.percent.mishandles-non-integer-percent-fraction',
  onePth: 'mc.percent.reads-p-percent-as-one-pth',
  misreadMixed: 'mc.percent.misreads-mixed-number-percents',
  lessThanOne: 'mc.fractions-concept.fraction-must-be-less-than-one',
  barAfterShift: 'mc.decimals.repeat-bar-after-shift',
  barAnchored: 'mc.decimals.repeat-bar-anchored-during-shift',
  roundedExact: 'mc.estimation.rounded-value-treated-as-exact',
  bothTerms: 'mc.fraction-ops.multiplies-both-terms-by-whole-number',
  denOnly: 'mc.fraction-ops.multiplies-denominator-by-whole-number',
  appendPct: 'mc.percent.appends-percent-sign-to-unscaled-value',
  eighthsSixths: 'mc.decimals.confuses-eighths-and-sixths',
  tenthsUnit: 'mc.percent.reads-tenths-as-unit-fractions',
  noRepeatForever: 'mc.decimals.remainders-decide-repeat',
  periodIsDen: 'mc.decimals.repeat-period-equals-denominator',
  testUnreduced: 'mc.decimals.terminating-test-misapplied',
  oddRepeats: 'mc.decimals.odd-denominator-implies-repeating',
  allInexact: 'mc.decimals.all-decimal-notations-classified-as-inexact',
  intermediate: 'mc.decimals.intermediate-precision-always-invalid',
  truncates: 'mc.decimals.truncates-instead-of-rounding',
  calcInexact: 'mc.decimals.every-calculator-display-is-inexact',
  errorNotScaled: 'mc.estimation.error-not-scaled-through-operation',
  falsePrecision: 'mc.data-displays.visual-estimate-as-exact',
  measuredExact: 'mc.measurement-units.measurement-treated-as-exact',
  ignoresMinus: 'mc.integers.ignores-minus-sign-of-number',
  byMagnitude: 'mc.integers.order-negatives-by-magnitude',
  splitMixed: 'mc.integers.negative-mixed-number-split',
} as const;

export const FAMILY_NAMES: Record<string, string> = {
  placeValue: 'Place value to ten-thousandths',
  compareDec: 'Which decimal is greater?',
  terminates: 'Does it stop?',
  barForm: 'Bar notation',
  approx: 'Equal or only close?',
  ladderStep: 'The next division step',
  divide: 'Fraction to decimal',
  digitTrap: 'Digit or remainder?',
  classify: 'Stops or repeats?',
  decToFrac: 'Decimal to fraction',
  decPct: 'Small and decimal percents',
  pctToFrac: 'Percent to fraction',
  beyondOne: 'Beyond one whole',
  repPct: 'Repeating percents',
  mixedPct: 'Mixed-number percents',
  recall: 'Eighths, thirds, sixths',
  remainders: 'Why it must stop or repeat',
  twoFive: 'The 2-and-5 test',
  roundFinal: 'Round at the end',
  calcDisplay: 'Read the calculator',
  roundingError: 'Rounding errors grow',
  roundEnd: 'Sensible precision',
  signed: 'Negative forms',
  signedCompare: 'Compare negatives',
};

// ---------- small helpers ----------
const NOCALC = '<span class="calc">No calculator.</span>';
const fT = (n: number, d: number) => `\\tfrac{${n}}{${d}}`;
const FT = (n: number, d: number) => `\\frac{${n}}{${d}}`;
/** a fraction or mixed number in HTML / TeX (p >= 0) */
const mixH = (p: number, q: number) => { const [w, a, b] = mixedOf(p, q); return a === 0 ? String(w) : `${w ? w + '&#8202;' : ''}${fr(a, b)}`; };
const mixT = (p: number, q: number) => { const [w, a, b] = mixedOf(p, q); return a === 0 ? String(w) : `${w || ''}${fT(a, b)}`; };
const pctH = (e: Dec) => `${decHtml(e)}%`;
const pctT = (e: Dec) => `${decTex(e)}\\%`;
const fin = (N: number, k: number): Fin => ({ N, k });
const fs = (f: Fin) => finStr(f), fh = (f: Fin) => finStr(f, true);
/** an expansion written with a bar over the given range of fraction digits (for wrong bar forms) */
function barAt(whole: string, digits: string, a: number, b: number, html = true): string {
  // a..b: 0-based indexes into `digits` that carry the bar (b exclusive); a === b: no bar
  const pre = digits.slice(0, a), bar = digits.slice(a, b), post = digits.slice(b);
  return `${whole}${digits ? '.' : ''}${pre}${bar ? (html ? `<span class="rep">${bar}</span>` : `\\overline{${bar}}`) : ''}${post}`;
}
const LONG = 7;   // digits written out in "0.1666666…"

// ---------- item builders ----------
interface Opt { t: string; ok: boolean; mc?: string; say: string }
function choiceItem(R: () => number, o: Omit<Item, 'input' | 'answer' | 'check' | 'choices'> & { opts: Opt[] }): Item {
  const { opts, ...rest } = o;
  const uniq: Opt[] = [];
  for (const x of opts) if (!uniq.some(u => u.t === x.t)) uniq.push(x);
  const sh = shuffle(R, uniq);
  return {
    ...rest, input: 'choice', choices: sh.map(c => c.t), answer: { kind: 'choice', i: sh.findIndex(c => c.ok) },
    check(r: Response): Verdict {
      if (r.kind !== 'choice' || !sh[r.i]) return { ok: false, say: 'Pick one answer.' };
      const c = sh[r.i]!;
      return { ok: c.ok, mc: c.ok ? undefined : c.mc, say: c.say };
    },
  };
}
interface NWrong { f?: Fin; test?: (v: number) => boolean; mc?: string; say: string }
function numItem(o: Omit<Item, 'input' | 'answer' | 'check'> & { f: Fin; wrongs: NWrong[]; right: string; hint: string }): Item {
  const { f, wrongs, right, hint, ...rest } = o;
  return {
    ...rest, input: 'num', answer: { kind: 'num', v: Number(fs(f)) },
    check(r: Response): Verdict {
      if (r.kind !== 'num' || !Number.isFinite(r.v)) return { ok: false, say: 'Type a number, like 0.375 (no % sign).' };
      if (isFin(r.v, f)) return { ok: true, say: right };
      const w = wrongs.find(x => (x.f && isFin(r.v, x.f)) || (x.test && x.test(r.v)));
      return w ? { ok: false, mc: w.mc, say: w.say } : { ok: false, say: hint };
    },
  };
}
interface FWrong { test: (r: { w: number; n: number; d: number }) => boolean; mc?: string; say: string }
/** a fraction answer: any equal value, or (simplest) only the reduced one; mixed numbers and improper both count */
function fracItem(o: Omit<Item, 'input' | 'answer' | 'check'> & { p: number; q: number; simplest: boolean; wrongs: FWrong[]; right: string; hint: string }): Item {
  const { p, q, simplest, wrongs, right, hint, ...rest } = o;
  const [w, a, b] = mixedOf(p, q);
  return {
    ...rest, input: 'frac', answer: { kind: 'frac', w, n: a, d: a === 0 ? 1 : b },
    check(r: Response): Verdict {
      if (r.kind !== 'frac') return { ok: false, say: 'Fill in the fraction.' };
      const ints = [r.w, r.n, r.d].every(Number.isInteger) && r.d > 0 && r.n >= 0 && r.w >= 0;
      if (ints && (r.w * r.d + r.n) * q === p * r.d) {
        if (simplest && gcd(r.n, r.d) !== 1 && r.n !== 0) return { ok: false, say: `Equal, but not in simplest form yet: divide the top and bottom by ${gcd(r.n, r.d)}.` };
        return { ok: true, say: right };
      }
      const x = wrongs.find(t => t.test(r));
      return x ? { ok: false, mc: x.mc, say: x.say } : { ok: false, say: hint };
    },
  };
}
const val = (r: { w: number; n: number; d: number }) => (r.w * r.d + r.n) / r.d;
const near = (v: number, t: number, tol = 1e-9) => Math.abs(v - t) <= tol * Math.max(1, Math.abs(t));

// ---------- number pools (from the topic JSON cases) ----------
/** terminating fractions whose simplest denominator is NOT a factor of 100 (8, 16, 40, 80), at most 4 places */
const TERM: [number, number][] = [];
for (const d of [8, 16, 40, 80]) for (let n = 1; n < d; n++) {
  const [, rd] = reduce(n, d);
  if (100 % rd === 0) continue;
  const L = longDivide(n, d);
  if (L.stop === 'zero' && L.at <= 4 && (gcd(n, d) === 1 || (d === 16 && n === 6) || (d === 80 && n === 6) || (d === 40 && n === 6))) TERM.push([n, d]);
}
/** repeating fractions, denominators up to 30, prefix and block of at most 2 digits, drawable in 6 ladder rows */
const REP: [number, number][] = [];
for (let d = 3; d <= 30; d++) for (let n = 1; n < d; n++) {
  if (gcd(n, d) !== 1) continue;
  const L = longDivide(n, d);
  if (L.stop === 'repeat' && L.at <= 5 && L.rep.length <= 2 && L.pre.length <= 2) REP.push([n, d]);
}
const REP_CORE: [number, number][] = [[1, 3], [2, 3], [2, 9], [1, 6], [5, 6], [1, 12], [5, 12], [7, 12], [7, 22], [2, 11], [5, 11], [1, 15], [2, 15]];
const repPick = (R: () => number): [number, number] => (R() < 0.55 ? pick(R, REP_CORE) : pick(R, REP));
/** a random finite decimal of k places below 1, often with a zero right after the point */
function decN(R: () => number, k: number): number {
  for (;;) {
    const lead = R() < 0.45;
    const N = lead ? int(R, 1, 10 ** (k - 1) - 1) : int(R, 10 ** (k - 1), 10 ** k - 1);
    if (N % 10 !== 0) return N;
  }
}
const ladder = (n: number, d: number, extra: Partial<LadderParams> = {}): LadderParams => ({ n, d, ...extra });
/** the ladder steps that write the whole division */
const rowsOf = (n: number, d: number, max = 6): LadderStep[] => {
  const L = longDivide(n, d);
  return Array.from({ length: Math.min(max, L.rows.length) }, (_, i) => `row${i}` as LadderStep);
};
const drawable = (n: number, d: number) => { const L = longDivide(n, d); return L.whole <= 9 && L.rows.length <= 6; };
const endSteps = (n: number, d: number): LadderStep[] => (longDivide(n, d).stop === 'zero' ? ['stop', 'zeros'] : ['loop', 'more', 'groups']);
/** the division as panel lines: "30 ÷ 8 = 3, remainder 6" */
function divLines(n: number, d: number, max = 6): string[] {
  const L = longDivide(n, d);
  const out = L.rows.slice(0, max).map((w, i) => `${i === 0 ? '' : ''}${w.x} ÷ ${d} = ${w.q}, remainder ${w.r}${i === 0 ? ' (the whole part)' : ''}`);
  out.push(L.stop === 'zero' ? `Remainder 0: the division stops. ${fr(n, d)} = ${decHtml(expand(n, d))}.`
    : `The remainder ${L.rows[L.at]!.r} came back, so the digits from there repeat: ${fr(n, d)} = ${decHtml(expand(n, d))}.`);
  return out;
}

// ===================== 1. place value to ten-thousandths =====================
const PLACE = ['', 'tenths', 'hundredths', 'thousandths', 'ten-thousandths'];
const placeValue: Gen = (R, n) => {
  const k = pick(R, [3, 4, 4]), N = decN(R, k), f = fin(N, k), digs = String(N).length;
  if (R() < 0.6) {
    const wrongs: NWrong[] = [];
    if (digs < k) wrongs.push({ f: fin(N, digs), mc: MC.wrongPlace, say: `That is ${N} ${PLACE[digs]}: you counted only the digits ${N}. ${PLACE[k]} need ${k} places after the point, so zeros fill the gap: ${fs(f)}.` });
    wrongs.push({ f: fin(N, k + 1), say: `One place too far: ${PLACE[k]} are the ${k === 3 ? '3rd' : '4th'} place after the point.` });
    return numItem({
      id: `placeValue-${n}`, family: 'placeValue',
      prompt: `Write <b>${N.toLocaleString('en-US')} ${PLACE[k]}</b> as a decimal. ${NOCALC}`,
      board: `\\frac{${N}}{${(10 ** k).toLocaleString('en-US').replace(',', '{,}')}} = \\ ?`, f, wrongs,
      right: `Yes: the last digit sits in the ${PLACE[k]} place: ${fs(f)}.`,
      hint: `${PLACE[k]} are the ${k === 3 ? '3rd' : '4th'} place after the point. Write ${N} so its last digit lands there.`,
      solution: [`Each place is ${fr(1, 10)} of the place to its left: 0.${'0'.repeat(k - 1)}1 = ${fr(1, 10 ** k)}.`, `${N} ${PLACE[k]} ends in the ${k === 3 ? '3rd' : '4th'} place: ${fh(f)}.`],
      picture: { kind: 'ladder', p: ladder(N, 10 ** k, { ladder: false }), pre: ['cells'], post: ['digits'], work: [`\\frac{${N}}{${(10 ** k).toLocaleString('en-US').replace(',', '{,}')}} = ${fs(f)}`] } satisfies FdpPicture,
    });
  }
  const j = int(R, 1, k), D = digitAt({ pre: String(N).padStart(k, '0'), rep: '' }, j);
  const other = [1, 2, 3, 4].filter(x => x !== j && x <= k).map(x => digitAt({ pre: String(N).padStart(k, '0'), rep: '' }, x)).filter(x => x !== D);
  return numItem({
    id: `placeValue-${n}`, family: 'placeValue',
    prompt: `Which digit of <b>${fs(f)}</b> is in the <b>${PLACE[j]}</b> place? ${NOCALC}`,
    board: `${fs(f)}`, f: fin(D, 0),
    wrongs: other.map(o2 => ({ f: fin(o2, 0), mc: j > 1 ? MC.wrongPlace : undefined, say: `Count the places after the point: tenths, hundredths, thousandths, ten-thousandths. The ${PLACE[j]} digit is the ${j === 1 ? '1st' : j === 2 ? '2nd' : j === 3 ? '3rd' : '4th'}.` })),
    right: `Yes: ${D} is the ${j === 1 ? '1st' : j === 2 ? '2nd' : j === 3 ? '3rd' : '4th'} digit after the point.`,
    hint: `Count from the point: tenths, hundredths, thousandths, ten-thousandths.`,
    solution: [`After the point: tenths, hundredths, thousandths, ten-thousandths.`, `The ${PLACE[j]} digit of ${fh(f)} is ${D}.`],
    picture: { kind: 'ladder', p: ladder(N, 10 ** k, { ladder: false }), pre: ['cells', 'digits'], post: [], work: [] } satisfies FdpPicture,
  });
};

// ===================== 1. compare decimals =====================
const compareDec: Gen = (R, n) => {
  const t = int(R, 0, 4);
  let a: Fin, b: Fin;
  if (t === 0) { const N = int(R, 11, 99) * 10 + int(R, 1, 9); a = fin(N, 4); b = fin(N, 3); }                    // 0.0375 vs 0.375
  else if (t === 1) { const N = decN(R, 4); const T = Math.floor(N / 100); a = fin(N, 4); b = fin(T + (R() < 0.5 ? 1 : 0), 2); if (b.N === 0) b = fin(1, 2); }   // 0.0625 vs 0.06 / 0.07
  else if (t === 2) { const x = int(R, 1, 9), y = int(R, 1, 9); a = fin(x * 100 + y, 3); b = fin(x * 10 + y, 2); }   // 0.305 vs 0.35
  else if (t === 3) { const N = int(R, 1001, 9999); a = fin(N, 4); b = fin(Math.ceil(N / 100) === N / 100 ? N / 100 + 1 : Math.ceil(N / 100), 2); }   // 0.4375 vs 0.44
  else { const N = int(R, 1, 99); const kk = N < 10 ? 1 : 2; a = fin(N * 10 ** (4 - kk), 4); b = fin(N, kk); }       // 0.5000 vs 0.5
  if (a.N === b.N * 10 ** (a.k - b.k) && t !== 4) b = fin(b.N + 1, b.k);
  const cmp = a.N * 10 ** (4 - a.k) - b.N * 10 ** (4 - b.k);
  const [x, y] = R() < 0.5 ? [a, b] : [b, a];
  const big = cmp === 0 ? null : (cmp > 0 ? a : b), small = cmp === 0 ? null : (cmp > 0 ? b : a);
  const longer = (u: Fin, v: Fin) => u.k > v.k;
  const opts: Opt[] = [];
  for (const u of [x, y]) {
    const ok = big !== null && u === big;
    opts.push({
      t: `${fh(u)} is greater`, ok,
      mc: ok ? undefined : big === null ? MC.renaming : longer(u, u === a ? b : a) ? MC.moreDigits : undefined,
      say: ok ? `Yes. Line up the places: ${fh(pad(big!))} vs ${fh(pad(small!))}.`
        : big === null ? `Extra zeros at the end do not change a decimal: ${fh(x)} = ${fh(y)}.`
          : `More digits do not mean bigger. Line up the places: ${fh(pad(big))} is more than ${fh(pad(small!))}.`,
    });
  }
  opts.push({ t: 'They are equal', ok: big === null, mc: big === null ? undefined : undefined, say: big === null ? `Yes: zeros at the end do not change the value: ${fh(x)} = ${fh(y)}.` : `They are not equal: compare place by place, ${fh(pad(big))} vs ${fh(pad(small!))}.` });
  return choiceItem(R, {
    id: `compareDec-${n}`, family: 'compareDec',
    prompt: `Which is greater: <b>${fh(x)}</b> or <b>${fh(y)}</b>? ${NOCALC}`,
    board: `${fs(x)}\\quad\\text{or}\\quad ${fs(y)}`, opts,
    solution: [`Write both with 4 places: ${fh(pad(x))} and ${fh(pad(y))}.`, big === null ? 'The same digits in every place: equal.' : `Compare from the left: ${fh(pad(big))} is greater.`],
    picture: { kind: 'bare', work: [`${fs(pad(x))}\\quad\\text{vs}\\quad ${fs(pad(y))}`] } satisfies FdpPicture,
  });
};
const pad = (f: Fin): Fin => ({ N: f.N * 10 ** (4 - f.k), k: 4 });

// ===================== 2. terminating: all later digits are 0 =====================
const TERM_SHOWN: Fin[] = [fin(5, 1), fin(25, 2), fin(125, 3), fin(625, 4), fin(375, 3), fin(175, 2), fin(4375, 4), fin(75, 3), fin(375, 4), fin(3125, 4), fin(8, 1), fin(2, 1), fin(1875, 4), fin(5625, 4)];
const terminates: Gen = (R, n) => {
  const base = pick(R, TERM_SHOWN), f = R() < 0.25 ? fin(base.N + 10 ** base.k, base.k) : base;   // values 0-2
  const [p, q] = finFrac(f);
  const pic: FdpPicture = drawable(p, q) && q > 1
    ? { kind: 'ladder', p: ladder(p, q), pre: [], post: ['cells', ...rowsOf(p, q), 'stop', 'zeros'], work: [`${FT(p, q)} = ${fs(f)}`] }
    : { kind: 'bare', work: [`${fs(f)} = ${fs(f)}000\\ldots`] };
  if (R() < 0.5) {
    const z = '0'.repeat(int(R, 2, 3));
    return choiceItem(R, {
      id: `terminates-${n}`, family: 'terminates',
      prompt: `A decimal is written <b>${fh(f)}${z}…</b>, and the rule is: <b>only zeros come after this</b>. Which is true?`,
      board: `${fs(f)}${z}\\ldots`,
      opts: [
        { t: `It terminates: it is exactly ${fh(f)}`, ok: true, say: `Yes. Every later digit is 0, so the decimal stops at ${fh(f)}: ${fh(f)} = ${fh(f)}${z}…` },
        { t: 'It repeats, because the zeros go on forever', ok: false, mc: MC.ellipsisTerm, say: `Zeros forever change nothing: ${fh(f)}${z}… = ${fh(f)}. A decimal whose later digits are all 0 terminates.` },
        { t: `It is a tiny bit more than ${fh(f)}`, ok: false, mc: MC.renaming, say: `Zeros at the end add nothing: ${fh(f)}${z}… is exactly ${fh(f)}.` },
      ],
      solution: [`Only zeros come after ${fh(f)}.`, `So it is exactly ${fh(f)}: a terminating decimal.`, ...(pic.kind === 'ladder' ? [`It is ${fr(p, q)}: the division reaches remainder 0.`] : [])],
      picture: pic,
    });
  }
  const digs = f.k;
  return choiceItem(R, {
    id: `terminates-${n}`, family: 'terminates',
    prompt: `Is <b>${fh(f)}</b> a terminating or a repeating decimal?`,
    board: `${fs(f)}`,
    opts: [
      { t: `Terminating: every digit after the last ${String(f.N).slice(-1)} is 0`, ok: true, say: `Yes: ${fh(f)} = ${fh(f)}000…, all zeros after it. It stops.` },
      { t: `Repeating: it has ${digs === 1 ? 'a digit' : digs + ' digits'} after the point`, ok: false, mc: MC.lengthRepeat, say: `Length is not the test. A decimal repeats only if a block of digits goes on forever; ${fh(f)} is followed by zeros only.` },
      { t: `Terminating, but ${fh(f)}0 would be a bigger number`, ok: false, mc: MC.renaming, say: `Half right: it terminates. But ${fh(f)}0 = ${fh(f)}: a zero at the end changes nothing.` },
    ],
    solution: [`${fh(f)} = ${fh(f)}000…: only zeros after the last digit.`, 'So it terminates (however many places it has).', ...(pic.kind === 'ladder' ? [`It is ${fr(p, q)}: the division reaches remainder 0.`] : [])],
    picture: pic,
  });
};

// ===================== 3, 4. bar notation (with and without a prefix) =====================
function block(R: () => number, len: number): string {
  for (;;) {
    let s = '';
    for (let i = 0; i < len; i++) s += int(R, 0, 9);
    if (/^0+$/.test(s) || /^9+$/.test(s)) continue;
    if (len > 1 && s === s[0]!.repeat(len)) continue;
    if (len === 4 && s.slice(0, 2) === s.slice(2)) continue;
    return s;
  }
}
/** the fraction of 0.pre(rep) (for the strip picture) */
function fracOfRep(pre: string, rep: string): [number, number] {
  const a = Number(pre + rep), b = pre ? Number(pre) : 0;
  return reduce(a - b, 10 ** pre.length * (10 ** rep.length - 1));
}
const barForm: Gen = (R, n, sg) => {
  const withPre = sg === 'prefix-and-block';
  let pre = '', rep = '';
  if (withPre) {
    for (;;) { pre = block(R, int(R, 1, 2)); rep = block(R, int(R, 1, 2)); if (pre.slice(-1) !== rep.slice(-1) && !(rep.length === 2 && rep[0] === rep[1])) break; }
  } else rep = block(R, pick(R, [1, 2, 2, 3]));
  const e: Dec = { neg: false, whole: 0, pre, rep };
  const digits = pre + rep;
  const [p, q] = fracOfRep(pre, rep);
  const pic: FdpPicture = { kind: 'ladder', p: ladder(p, q, { ladder: false }), pre: ['cells', 'digits', 'more'], post: ['groups'], work: [`${decTex(e)}`] };
  const picHidden: FdpPicture = { ...pic, pre: ['cells'], post: ['digits', 'more', 'groups'] };
  const long = decLong(e, LONG), rule = withPre ? `only ${rep.length === 1 ? 'the ' + rep : 'the block ' + rep} repeats` : `the block ${rep} repeats forever`;
  const v = int(R, 0, 2);
  if (v === 0 || (v === 2 && !withPre) || (!withPre && rep.length === 1)) {
    // written out -> bar form
    const opts: Opt[] = [
      { t: decHtml(e), ok: true, say: `Yes: the bar goes over the whole block ${rep}, and only over it.` },
      { t: barAt('0', digits, 0, digits.length), ok: false, mc: withPre ? MC.barAll : MC.barLast, say: withPre ? `That bar says ${pre}${rep} repeats from the point on: ${decLong({ ...e, pre: '', rep: digits }, LONG)} The ${pre} comes once, so it stays out of the bar.` : 'Same thing.' },
      { t: barAt('0', digits, digits.length - 1, digits.length), ok: false, mc: MC.barLast, say: `A bar over only the last digit repeats just that digit: ${decLong({ neg: false, whole: 0, pre: digits.slice(0, -1), rep: digits.slice(-1) }, LONG)} The bar covers the whole block ${rep}.` },
      { t: `0.${digits}`, ok: false, mc: MC.truncFull, say: `0.${digits} stops after ${digits.length} digit${digits.length > 1 ? 's' : ''}. The ${rep} goes on forever, so it needs a bar.` },
      { t: `0.${digits}…`, ok: false, mc: MC.prefixPattern, say: `“…” alone does not say which digits repeat. The bar says it: ${decHtml(e)}.` },
    ];
    return choiceItem(R, {
      id: `barForm-${n}`, family: 'barForm',
      prompt: `<b>${long}</b> (${rule}). Which is the same number in bar notation?`,
      board: `${decLong(e, LONG, false).replace('…', '\\ldots')}`,
      opts: opts.filter(o => !(o.t === decHtml(e) && !o.ok)).slice(0, 4),
      solution: [`The digits that repeat: ${rep}${withPre ? `, after ${pre}` : ''}.`, `The bar goes over that block once: ${decHtml(e)}.`],
      picture: pic,
    });
  }
  // bar form -> written out
  const opts: Opt[] = [
    { t: long, ok: true, say: `Yes: ${pre ? pre + ' once, then ' : ''}${rep} again and again.` },
    { t: decLong({ ...e, pre: '', rep: digits }, LONG), ok: false, mc: MC.barAll, say: `That repeats ${digits}. Under the bar is only ${rep}${pre ? `; the ${pre} is written once` : ''}.` },
    { t: `0.${digits}`, ok: false, mc: MC.truncFull, say: `0.${digits} stops. The bar means ${rep} never stops.` },
  ];
  if (rep.length > 1) opts.push({ t: decLong({ neg: false, whole: 0, pre: digits.slice(0, -1), rep: digits.slice(-1) }, LONG), ok: false, mc: MC.barLast, say: `That repeats only the last digit. The bar covers ${rep}, so the whole block repeats.` });
  return choiceItem(R, {
    id: `barForm-${n}`, family: 'barForm',
    prompt: `Which is <b>${decHtml(e)}</b> written out?`,
    board: decTex(e), opts,
    solution: [`Under the bar: ${rep}. ${pre ? `Before it, once: ${pre}.` : ''}`, `So ${decHtml(e)} = ${long}`],
    picture: picHidden,
  });
};

// ===================== 5, 18. equal or only close (= and ≈) =====================
const TARGETS: [number, number][] = [[1, 3], [2, 3], [1, 6], [5, 6], [1, 9], [4, 9], [2, 11], [1, 12]];
const approx: Gen = (R, n, sg) => {
  if (sg === 'exact-vs-approx-symbols') return approxTarget(R, n);
  const [p, q] = pick(R, TARGETS), e = expand(p, q);
  const v = int(R, 0, 2);
  if (v === 0) {
    // which sign between the bar form and the fraction
    return choiceItem(R, {
      id: `approx-${n}`, family: 'approx', prompt: `Which sign goes between <b>${decHtml(e)}</b> and <b>${fr(p, q)}</b>?`,
      board: `${decTex(e)}\\quad ?\\quad ${FT(p, q)}`,
      opts: [
        { t: `${decHtml(e)} = ${fr(p, q)}`, ok: true, say: `Yes: the bar means the digits never stop, so ${decHtml(e)} is exactly ${fr(p, q)}.` },
        { t: `${decHtml(e)} ≈ ${fr(p, q)}`, ok: false, mc: MC.approxRep, say: `The bar is not a cut-off: it says the block repeats forever. That makes it exactly ${fr(p, q)}.` },
        { t: `${decHtml(e)} &lt; ${fr(p, q)}`, ok: false, mc: MC.approxRep, say: `Nothing is cut off under a bar, so nothing is missing: ${decHtml(e)} = ${fr(p, q)}.` },
      ],
      solution: [`${fr(p, q)} by long division: a remainder comes back, so the digits repeat forever.`, `The bar shows exactly that: ${fr(p, q)} = ${decHtml(e)}.`],
      picture: drawable(p, q) ? { kind: 'ladder', p: ladder(p, q), pre: [], post: ['cells', ...rowsOf(p, q), ...endSteps(p, q)], work: [`${FT(p, q)} = ${decTex(e)}`] } : { kind: 'bare', work: [`${FT(p, q)} = ${decTex(e)}`] },
    });
  }
  // a finite decimal (cut off or rounded) against the repeating value
  const k = int(R, 1, 3), rounded = R() < 0.4;
  let f = roundFrac(p, q, k, rounded ? 'round' : 'trunc');
  if (f.N === 0) f = roundFrac(p, q, k + 1, 'trunc');
  const c = cmpFinFrac(f, p, q);
  const sym = c < 0 ? '&lt;' : '&gt;';
  const how = rounded && roundFrac(p, q, f.k, 'trunc').N !== f.N ? 'rounded up' : 'cut off';
  return choiceItem(R, {
    id: `approx-${n}`, family: 'approx', prompt: `Compare <b>${fh(f)}</b> with <b>${decHtml(e)}</b>. Which is true?`,
    board: `${fs(f)}\\quad ?\\quad ${decTex(e)}`,
    opts: [
      { t: `${fh(f)} ${sym} ${decHtml(e)}, so ${fh(f)} ≈ ${fr(p, q)}`, ok: true, say: `Yes: ${fh(f)} is ${decHtml(e)} ${how} after ${f.k} place${f.k > 1 ? 's' : ''}, a different number, close but not equal.` },
      { t: `${fh(f)} = ${decHtml(e)}`, ok: false, mc: how === 'cut off' ? MC.truncFull : MC.roundedExact, say: `${fh(f)} stops; ${decHtml(e)} goes on forever. They differ, so only ≈.` },
      { t: `${fh(f)} ${c < 0 ? '&gt;' : '&lt;'} ${decHtml(e)}`, ok: false, mc: c < 0 ? MC.moreDigits : undefined, say: `Write ${decHtml(e)} out: ${decLong(e, f.k + 2)} Compare place by place: ${fh(f)} is ${c < 0 ? 'smaller' : 'bigger'}.` },
    ],
    solution: [`${decHtml(e)} = ${decLong(e, f.k + 2)}`, `${fh(f)} is ${how} after ${f.k} place${f.k > 1 ? 's' : ''}: ${fh(f)} ${sym} ${decHtml(e)}.`, `So ${fh(f)} ≈ ${fr(p, q)}, and only ${decHtml(e)} = ${fr(p, q)}.`],
    picture: { kind: 'ladder', p: ladder(p, q, { ladder: false }), pre: ['cells', 'digits', 'more'], post: ['groups'], work: [`${fs(f)} \\approx ${decTex(e)}`] },
  });
};
function approxTarget(R: () => number, n: number): Item {
  const [p, q] = pick(R, [[1, 3], [2, 3], [1, 8], [3, 8], [1, 6], [5, 6], [5, 8]] as [number, number][]);
  const e = expand(p, q), pc = pctOf(p, q), term = !e.rep;
  const [w, a, b] = mixedOf(100 * p, q);
  const mixPct = a ? `(${w}${fr(a, b)})%` : `${w}%`;
  if (R() < 0.3) {
    // the money context: $100 shared
    const share = roundFrac(100 * p, q, 2);
    const tot = fin(share.N * q / p, 2);
    if (!term && Number.isInteger(q / p)) {
      return choiceItem(R, {
        id: `approx-${n}`, family: 'approx', prompt: `$100 is shared equally by ${q / p} people. Is <b>$${fs(share)}</b> each exactly ${fr(p, q)} of $100?`,
        board: `${FT(p, q)}\\ \\text{of}\\ \\$100 \\ \\ ?\\ \\ \\$${fs(share)}`,
        opts: [
          { t: `No: ${q / p} × $${fh(share)} = $${fh(tot)}, so $${fh(share)} ≈ ${fr(p, q)} of $100`, ok: true, say: `Yes. ${fr(p, q)} of $100 is $${decHtml(expand(100 * p, q))}; $${fh(share)} is that rounded to the cent.` },
          { t: `Yes: $${fh(share)} is exactly ${fr(p, q)} of $100`, ok: false, mc: MC.roundedExact, say: `Check it: ${q / p} × $${fh(share)} = $${fh(tot)}, not $100. The cents were rounded.` },
          { t: 'No amount written with a decimal point can be exact', ok: false, mc: MC.allInexact, say: `Many are exact: $12.50 is exactly ${fr(1, 8)} of $100. This one is rounded: ${q / p} × $${fh(share)} = $${fh(tot)}.` },
        ],
        solution: [`${fr(p, q)} of $100 = $${decHtml(expand(100 * p, q))}, a repeating decimal.`, `$${fh(share)} is rounded: ${q / p} × $${fh(share)} = $${fh(tot)} ≠ $100.`, `So $${fh(share)} ≈ ${fr(p, q)} of $100.`],
        picture: { kind: 'bare', work: [`${q / p} \\times \\$${fs(share)} = \\$${fs(tot)}`] },
      });
    }
  }
  // which one is exactly the target / which one is only approximate
  const exact: string[] = term ? [decHtml(e), pctH(pc), mixPct] : [decHtml(e), pctH(pc), mixPct];
  const rd = roundFrac(p, q, 2), rp = roundFrac(100 * p, q, 0);
  const approxs: string[] = [fh(rd), `${fh(rp)}%`];
  if (term) approxs.push(fh(roundFrac(p, q, 1)));
  else approxs.push(fh(roundFrac(p, q, 3, 'trunc')));
  const askExact = R() < 0.6;
  const right = askExact ? pick(R, [...new Set(exact)]) : pick(R, [...new Set(approxs)].filter(x => !exact.includes(x)));
  const pool = askExact ? approxs.filter(x => !exact.includes(x)) : [...new Set(exact)];
  const opts: Opt[] = [{ t: right, ok: true, say: askExact ? `Yes: ${right} is exactly ${fr(p, q)}.` : `Yes: ${right} is rounded, so it is only close to ${fr(p, q)}.` }];
  for (const x of shuffle(R, pool.filter(x => x !== right)).slice(0, 3)) opts.push({
    t: x, ok: false,
    mc: askExact ? MC.roundedExact : x.includes('rep') ? MC.approxRep : MC.allInexact,
    say: askExact ? `${x} is rounded: close to ${fr(p, q)}, not equal (${x} ≈ ${fr(p, q)}).` : `${x} is exactly ${fr(p, q)}${x.includes('rep') ? ': a bar means the digits never stop' : term && !x.includes('(') ? `: ${fr(p, q)} stops at ${decHtml(e)}` : ''}.`,
  });
  return choiceItem(R, {
    id: `approx-${n}`, family: 'approx',
    prompt: askExact ? `Which of these is <b>exactly</b> equal to ${fr(p, q)}?` : `Which of these is <b>only approximately</b> equal to ${fr(p, q)}?`,
    board: askExact ? `?\\ = ${FT(p, q)}` : `?\\ \\approx ${FT(p, q)}`, opts,
    solution: [`Exact: ${fr(p, q)} = ${decHtml(e)} = ${pctH(pc)}${a ? ` = ${mixPct}` : ''}.`, `Rounded, so only ≈: ${[...new Set(approxs)].filter(x => !exact.includes(x)).join(', ')}.`],
    picture: { kind: 'bare', work: [`${FT(p, q)} = ${decTex(e)} = ${pctT(pc)}`] },
  });
}

// ===================== 6, 7. the next step of the division =====================
const ladderStep: Gen = (R, n, sg) => {
  const term = sg !== 'fraction-to-repeating-by-remainders';
  const [p, q] = term ? pick(R, TERM) : repPick(R);
  const L = longDivide(p, q);
  // prefer a step that makes a quotient 0 (3/80: 30 ÷ 80 = 0) when there is one
  const zeroSteps = L.rows.map((w, i) => (i > 0 && w.q === 0 ? i : -1)).filter(i => i > 0);
  const k = zeroSteps.length && R() < 0.5 ? pick(R, zeroSteps) : int(R, 1, L.at);
  const row = L.rows[k]!;
  const wrongs: { x: number; y: number; mc?: string; say: string }[] = [];
  if (row.q === 0 && k + 1 < L.rows.length) {
    const nx = L.rows[k + 1]!;
    wrongs.push({ x: nx.q, y: nx.r, mc: MC.zeroOmitted, say: `That is the step after. ${row.x} ÷ ${q} is 0 (${q} does not fit), and that 0 is a digit of the decimal: it holds the place.` });
  }
  const pairs: Item = {
    id: `ladderStep-${n}`, family: 'ladderStep',
    prompt: `Long division of ${fr(p, q)}. The remainder was ${L.rows[k - 1]!.r}, so the next line is <b>${row.x} ÷ ${q}</b>. What digit does it give, and what is the remainder? ${NOCALC}`,
    board: `${row.x} \\div ${q} = \\ ?\\ \\ \\text{r}\\ ?`, input: 'pair', pairLead: `${row.x} ÷ ${q} =`, pairOp: 'r',
    answer: { kind: 'pair', x: row.q, y: row.r },
    check(r: Response): Verdict {
      if (r.kind !== 'pair' || !Number.isInteger(r.x) || !Number.isInteger(r.y)) return { ok: false, say: 'Type two whole numbers: the digit and the remainder.' };
      if (r.x === row.q && r.y === row.r) return { ok: true, say: `Yes: ${row.q} × ${q} = ${row.q * q}, and ${row.x} − ${row.q * q} = ${row.r}.${row.r === 0 ? ' Remainder 0: it stops.' : L.stop === 'repeat' && k === L.at ? ` Remainder ${row.r} came before: from here it repeats.` : ''}` };
      const w = wrongs.find(x => x.x === r.x && x.y === r.y);
      if (w) return { ok: false, mc: w.mc, say: w.say };
      if (r.x * q > row.x) return { ok: false, say: `${r.x} × ${q} = ${r.x * q} is more than ${row.x}. Try a smaller digit.` };
      if (r.y >= q || row.x - r.x * q >= q) return { ok: false, say: `A remainder must be less than ${q}. ${q} fits into ${row.x} more times.` };
      return { ok: false, say: `Check: digit × ${q}, then ${row.x} minus that is the remainder.` };
    },
    solution: [`${row.x} ÷ ${q}: ${q} fits ${row.q} time${row.q === 1 ? '' : 's'} (${row.q} × ${q} = ${row.q * q}).`, `${row.x} − ${row.q * q} = ${row.r}: the remainder.`, `So the next digit of ${fr(p, q)} is ${row.q}.`],
    picture: {
      kind: 'ladder', p: ladder(p, q), pre: ['cells', ...rowsOf(p, q, k)], post: [`row${k}` as LadderStep, ...(k === L.at ? (L.stop === 'zero' ? ['stop'] as LadderStep[] : ['loop'] as LadderStep[]) : [])],
      work: [`${row.x} \\div ${q} = ${row.q}\\ \\text{r}\\ ${row.r}`],
    } satisfies FdpPicture,
  };
  return pairs;
};

// ===================== 6, 7. fraction to decimal =====================
const divide: Gen = (R, n, sg) => {
  if (sg === 'fraction-to-repeating-by-remainders') {
    const [p, q] = repPick(R), e = expand(p, q), digits = e.pre + e.rep;
    const opts: Opt[] = [{ t: decHtml(e), ok: true, say: `Yes: the remainder ${longDivide(p, q).rows[longDivide(p, q).at]!.r} comes back, so ${e.rep} repeats${e.pre ? ` after ${e.pre}` : ''}.` }];
    if (e.pre) opts.push({ t: barAt('0', digits, 0, digits.length), ok: false, mc: MC.barAll, say: `The ${e.pre} comes only once: its remainder never comes back. Only ${e.rep} goes under the bar.` });
    if (e.rep.length > 1) opts.push({ t: barAt('0', digits, digits.length - 1, digits.length), ok: false, mc: MC.barLast, say: `The whole block ${e.rep} repeats, so the bar covers all of it.` });
    opts.push({ t: decHtml(expand(q, p)), ok: false, mc: MC.reversed, say: `That is ${q} ÷ ${p}. ${fr(p, q)} means ${p} ÷ ${q}: the top divided by the bottom.` });
    opts.push({ t: `0.${digits.slice(0, 2).padEnd(2, digits[0]!)}`, ok: false, mc: MC.stopsEarly, say: `The remainder is not 0 after two digits, so the decimal does not stop there. Keep dividing until a remainder comes back.` });
    const L = longDivide(p, q);
    return choiceItem(R, {
      id: `divide-${n}`, family: 'divide', prompt: `Write <b>${fr(p, q)}</b> as a decimal. Divide until a remainder comes back. ${NOCALC}`,
      board: `${FT(p, q)} = \\ ?`, opts: opts.slice(0, 4),
      solution: divLines(p, q),
      picture: drawable(p, q) ? { kind: 'ladder', p: ladder(p, q), pre: ['cells'], post: [...rowsOf(p, q), 'loop', 'more', 'groups'], work: [`${FT(p, q)} = ${decTex(e)}`] }
        : { kind: 'bare', work: [`${FT(p, q)} = ${decTex(e)}`, `\\text{remainder ${L.rows[L.at]!.r} again}`] },
    });
  }
  const [p, q] = pick(R, TERM), f = fracFin(p, q)!, s = fs(f).slice(2);
  const wrongs: NWrong[] = [];
  // a quotient zero left out: 0.0375 -> 0.375
  const zi = s.indexOf('0');
  if (zi >= 0 && zi < s.length - 1) { const t = s.slice(0, zi) + s.slice(zi + 1); wrongs.push({ f: fin(Number(t), t.length), mc: MC.zeroOmitted, say: `A 0 went missing: when ${q} does not fit, the digit is 0 and it holds its place. ${fr(p, q)} = ${fs(f)}.` }); }
  wrongs.push({ test: v => near(v, q / p, 0.006) || (q % p === 0 && isFin(v, fin(q / p, 0))), mc: MC.reversed, say: `That is ${q} ÷ ${p}. A fraction ${fr(p, q)} means ${p} ÷ ${q}: the top divided by the bottom.` });
  wrongs.push({ test: v => isFin(v, fin(Number(`${p}${q}`), String(q).length)) || isFin(v, fin(Number(`${q}${p}`), String(p).length)), mc: MC.shiftDigits, say: `The bar of a fraction is not a decimal point. Divide: ${p} ÷ ${q} = ${fs(f)}.` });
  if (f.k > 2) wrongs.push({ f: roundFrac(p, q, 2, 'trunc'), mc: MC.stopsEarly, say: `The remainder is not 0 yet after two digits. Keep dividing until it is: ${fs(f)}.` });
  return numItem({
    id: `divide-${n}`, family: 'divide', prompt: `Write <b>${fr(p, q)}</b> as a decimal by long division. ${NOCALC}`,
    board: `${FT(p, q)} = \\ ?`, f, wrongs,
    right: `Yes: the remainder reaches 0 after ${f.k} digits: ${fr(p, q)} = ${fs(f)}.`,
    hint: `Divide ${p} by ${q}: ${p}.0000 ÷ ${q}, one digit at a time, until the remainder is 0.`,
    solution: divLines(p, q),
    picture: { kind: 'ladder', p: ladder(p, q), pre: ['cells'], post: [...rowsOf(p, q), 'stop', 'zeros'], work: [`${FT(p, q)} = ${p} \\div ${q}`, `= ${fs(f)}`] },
  });
};

// ===================== 7. a repeated digit is not a repeated remainder =====================
/** fractions where a digit shows up twice before any remainder comes back (1/17: 0.0588…) */
const TRAPS: { p: number; q: number; i: number; j: number }[] = [];
for (let q = 7; q <= 30; q++) for (let p = 1; p < q; p++) {
  if (gcd(p, q) !== 1) continue;
  const L = longDivide(p, q);
  for (let j = 2; j <= Math.min(5, L.rows.length - 1); j++) {
    if (L.stop === 'repeat' && L.at <= j) break;
    const i = L.rows.slice(1, j).findIndex(w => w.q === L.rows[j]!.q) + 1;
    if (i > 0 && L.rows[i]!.r !== L.rows[j]!.r) { TRAPS.push({ p, q, i, j }); break; }
  }
}
const digitTrap: Gen = (R, n) => {
  if (R() < 0.4) {
    // a real repeat: what does a returning remainder mean?
    const [p, q] = pick(R, REP.filter(([a, b]) => longDivide(a, b).pre.length > 0));
    const L = longDivide(p, q), e = expand(p, q), digits = e.pre + e.rep, r = L.rows[L.at]!.r;
    return choiceItem(R, {
      id: `digitTrap-${n}`, family: 'digitTrap',
      prompt: `In the long division of ${fr(p, q)}, the remainder <b>${r}</b> has just come back. What does that tell you?`,
      board: `${FT(p, q)} = 0.${digits}\\ldots`,
      opts: [
        { t: `From here the same steps come again: ${fr(p, q)} = ${decHtml(e)}`, ok: true, say: `Yes: the same remainder gives the same next line, so ${e.rep} repeats forever.` },
        { t: `The division is finished: ${fr(p, q)} = 0.${digits}`, ok: false, mc: MC.truncFull, say: `It only stops at remainder 0. Remainder ${r} means the same steps start over.` },
        { t: `All the digits repeat: ${fr(p, q)} = ${barAt('0', digits, 0, digits.length)}`, ok: false, mc: MC.barAll, say: `Only the digits after the first ${r} repeat. ${e.pre} came before it and comes once.` },
      ],
      solution: divLines(p, q),
      picture: drawable(p, q) ? { kind: 'ladder', p: ladder(p, q), pre: ['cells', ...rowsOf(p, q)], post: ['loop', 'more', 'groups'], work: [`${FT(p, q)} = ${decTex(e)}`] } : { kind: 'bare', work: [`${FT(p, q)} = ${decTex(e)}`] },
    });
  }
  const T = pick(R, TRAPS), L = longDivide(T.p, T.q), D = L.rows[T.j]!.q;
  let shown = '';
  for (let t = 1; t <= T.j; t++) shown += L.rows[t]!.q;
  const e = expand(T.p, T.q);
  const fake = decHtml({ neg: false, whole: 0, pre: shown.slice(0, T.i - 1), rep: shown.slice(T.i - 1, T.j - 1) });
  return choiceItem(R, {
    id: `digitTrap-${n}`, family: 'digitTrap',
    prompt: `Dividing ${fr(T.p, T.q)} so far gives <b>0.${shown}…</b>: the digit ${D} has come up again. Has the repeating part started?`,
    board: `${FT(T.p, T.q)} = 0.${shown}\\ldots`,
    opts: [
      { t: `Not yet: the remainders after the two ${D}s are ${L.rows[T.i]!.r} and ${L.rows[T.j]!.r}, so the next steps differ`, ok: true, say: `Yes. Only a returning remainder makes the steps repeat. A digit can come up twice by chance.` },
      { t: `Yes: the ${D} came back, so ${fr(T.p, T.q)} = ${fake}`, ok: false, mc: MC.digitCycle, say: `A digit coming back is not enough. Look at the remainders: ${L.rows[T.i]!.r} and ${L.rows[T.j]!.r} differ, so the next lines differ.` },
      { t: 'It will stop soon: every division ends with remainder 0', ok: false, mc: MC.alwaysEnds, say: `Many never reach 0 (${fr(1, 3)} doesn't). Here the remainders decide, and they have not repeated yet.` },
    ],
    solution: [`The ${D}s came from the remainders ${L.rows[T.i - 1]!.r} → ${L.rows[T.i]!.r} and ${L.rows[T.j - 1]!.r} → ${L.rows[T.j]!.r}.`, `Different remainders give different next lines, so nothing repeats yet.`, `${fr(T.p, T.q)} = ${decHtml(e)}${e.rep.length > 6 ? ` (a block of ${e.rep.length} digits)` : ''}.`],
    picture: { kind: 'ladder', p: ladder(T.p, T.q, { maxRows: T.j + 1 }), pre: ['cells', ...rowsOf(T.p, T.q, T.j + 1)], post: [], rems: [T.i, T.j], work: [`\\text{r}\\ ${L.rows[T.i]!.r} \\ne \\text{r}\\ ${L.rows[T.j]!.r}`] },
  });
};

// ===================== 8. terminates or repeats, from the division =====================
const CLASSIFY: [number, number][] = [[3, 12], [2, 15], [7, 14], [1, 16], [1, 15], [3, 80], [1, 3], [6, 16], [9, 12], [4, 15], [7, 28], [2, 12], [3, 24], [5, 15], [9, 40], [1, 12], [1, 6], [3, 18], [6, 24], [5, 11], [11, 16], [7, 16], [2, 9], [1, 24], [3, 40]];
const classify: Gen = (R, n) => {
  const [p, q] = pick(R, CLASSIFY), L = longDivide(p, q), term = L.stop === 'zero', e = expand(p, q);
  const [rp, rq] = reduce(p, q);
  const unitOther = p > 1 && gcd(p, q) > 1 && longDivide(1, q).stop !== L.stop;
  const ev = term ? `the remainder reaches 0 at step ${L.at}` : `the remainder ${L.rows[L.at]!.r} comes back`;
  const opts: Opt[] = [{ t: `${term ? 'Terminates' : 'Repeats'}: ${ev}`, ok: true, say: `Yes: ${ev}, so ${fr(p, q)} = ${decHtml(e)}.` }];
  if (unitOther) opts.push({ t: `${term ? 'Repeats' : 'Terminates'}, like ${fr(1, q)} does`, ok: false, mc: MC.familiarUnit, say: `Divide ${fr(p, q)} itself: ${ev}. It equals ${fr(rp, rq)}, which behaves differently from ${fr(1, q)}.` });
  if (term && L.at >= 3) opts.push({ t: `Repeats: ${decHtml(e)} is too long to stop`, ok: false, mc: MC.lengthRepeat, say: `Long is not the same as repeating: the remainder reaches 0, so ${decHtml(e)} stops.` });
  if (!term) opts.push({ t: `Terminates: it is ${fh(roundFrac(p, q, 2, 'trunc'))}`, ok: false, mc: MC.truncFull, say: `${fh(roundFrac(p, q, 2, 'trunc'))} is only the start: the remainder is not 0 there, and ${L.rows[L.at]!.r} keeps coming back.` });
  opts.push({ t: term ? 'Repeats: the remainders never reach 0' : 'Terminates: a remainder reaches 0', ok: false, mc: term ? undefined : MC.alwaysEnds, say: `Do the division: ${ev}.` });
  return choiceItem(R, {
    id: `classify-${n}`, family: 'classify', prompt: `Does the decimal of <b>${fr(p, q)}</b> terminate or repeat? Decide from the division. ${NOCALC}`,
    board: `${FT(p, q)}`, opts: opts.slice(0, 4), solution: divLines(p, q),
    picture: drawable(p, q) ? { kind: 'ladder', p: ladder(p, q), pre: [], post: ['cells', ...rowsOf(p, q), ...(term ? ['stop'] as LadderStep[] : ['loop'] as LadderStep[])], work: [`${FT(p, q)} = ${decTex(e)}`] } : { kind: 'bare', work: [`${FT(p, q)} = ${decTex(e)}`] },
  });
};

// ===================== 9. decimal (3-4 places) to fraction =====================
const DEC_FR: Fin[] = [fin(375, 3), fin(375, 4), fin(620, 4), fin(625, 3), fin(625, 4), fin(125, 3), fin(875, 3), fin(125, 4), fin(2375, 4), fin(45, 3), fin(85, 3), fin(4375, 4), fin(1875, 4), fin(36, 3), fin(204, 3), fin(3125, 4), fin(75, 4), fin(250, 4), fin(1250, 4), fin(608, 3)];
const decToFrac: Gen = (R, n) => {
  const kk = pick(R, [3, 4]);
  const f = R() < 0.7 ? pick(R, DEC_FR) : fin(decN(R, kk), kk);
  const simplest = R() < 0.5;
  const [p, q] = finFrac(f), den = 10 ** f.k;
  const wrongs: FWrong[] = [
    { test: r => Number.isInteger(r.n) && r.w === 0 && r.n === f.N && r.d === 10 ** String(f.N).length && String(f.N).length !== f.k, mc: MC.wrongPlace, say: `${f.N}/${10 ** String(f.N).length} skips the zero places. The last digit of ${fs(f)} is in the ${PLACE[f.k]} place, so the bottom is ${den.toLocaleString('en-US')}.` },
    { test: r => r.w === 0 && r.n === f.N && (r.d === den / 10 || r.d === den * 10), mc: MC.wrongPlace, say: `Count the places after the point: ${f.k}. So ${fs(f)} = ${f.N}/${den.toLocaleString('en-US')}.` },
  ];
  return fracItem({
    id: `decToFrac-${n}`, family: 'decToFrac',
    prompt: `Write <b>${fs(f)}</b> as a fraction${simplest ? ' <b>in simplest form</b>' : ''}. ${NOCALC}`,
    board: `${fs(f)} = \\ ?`, p, q, simplest, wrongs,
    right: simplest ? `Yes: ${fs(f)} = ${f.N}/${den.toLocaleString('en-US')} = ${fr(p, q)}.` : `Yes, that is equal to ${fs(f)} = ${fr(f.N, den)}${p !== f.N ? ` (simplest: ${fr(p, q)})` : ''}.`,
    hint: `The last digit is in the ${PLACE[f.k]} place: ${fs(f)} = ${f.N} ${PLACE[f.k]}.`,
    solution: [`The last digit sits in the ${PLACE[f.k]} place: ${fs(f)} = ${fr(f.N, den.toLocaleString('en-US'))}.`, ...(p !== f.N ? [`Divide top and bottom by ${f.N / p}: ${fr(p, q)}.`] : [])],
    picture: { kind: 'ladder', p: ladder(f.N, den, { ladder: false }), pre: ['cells', 'digits'], post: [], work: [`${fs(f)} = ${FT(f.N, den)}`, ...(p !== f.N ? [`= ${FT(p, q)}`] : [])] },
  });
};

// ===================== 10. small and decimal percents =====================
const PCTS: Fin[] = [fin(5, 1), fin(25, 2), fin(125, 1), fin(8, 0), fin(825, 2), fin(35, 1), fin(75, 2), fin(375, 1), fin(9, 1), fin(625, 2), fin(15, 1), fin(4, 1), fin(65, 1), fin(725, 2), fin(1, 1), fin(2, 0)];
const decPct: Gen = (R, n) => {
  const pf = pick(R, PCTS);                                   // the percent numeral
  const df: Fin = { N: pf.N, k: pf.k + 2 };                 // the decimal = numeral / 100
  const tax = pf.N === 825 && pf.k === 2;
  const v = int(R, 0, 4);
  if (v === 4) {
    return choiceItem(R, {
      id: `decPct-${n}`, family: 'decPct', prompt: `Lena says <b>${fh(pf)}%</b> cannot be a real percent, because percents are whole numbers. Which is true?`,
      board: `${fs(pf)}\\% = \\ ?`,
      opts: [
        { t: `${fh(pf)}% is fine: ${fh(pf)} hundredths, which is ${fh(df)}`, ok: true, say: `Yes: a percent counts hundredths, and that count can be a decimal: ${fh(pf)}% = ${fh(df)}.` },
        { t: 'Lena is right: a percent must be a whole number', ok: false, mc: MC.wholePct, say: `Percents can have decimals: ${fh(pf)}% means ${fh(pf)} out of 100, which is ${fh(df)}.` },
        { t: `${fh(pf)}% is the same as ${fh(pf)}`, ok: false, mc: MC.noDiv100, say: `${fh(pf)}% is ${fh(pf)} hundredths: divide by 100, ${fh(df)}.` },
      ],
      solution: [`${fh(pf)}% = ${fh(pf)} ÷ 100 = ${fh(df)}.`, 'A percent can be a decimal, and can be less than 1%.'],
      picture: { kind: 'ladder', p: ladder(df.N, 10 ** df.k, { ladder: false }), pre: ['cells', 'digits', 'shift'], post: [], unshift: true, work: [`${fs(pf)}\\% = ${fs(df)}`] },
    });
  }
  if (v % 2 === 0) {
    // decimal -> percent
    return numItem({
      id: `decPct-${n}`, family: 'decPct',
      prompt: tax ? `The sales tax rate is written <b>${fs(df)}</b> on a receipt. What is it as a percent? ${NOCALC}` : `Write <b>${fs(df)}</b> as a percent. ${NOCALC}`,
      board: `${fs(df)} = \\ ?\\,\\%`, unit: '%', f: pf,
      wrongs: [
        { f: df, mc: MC.appendPct, say: `Putting % after ${fs(df)} makes ${fs(df)} hundredths. Multiply by 100 first: ${fs(pf)}%.` },
        { f: { N: df.N, k: df.k - 1 }, mc: MC.pointOne, say: `The point moved one place. × 100 moves it two places: ${fs(pf)}%.` },
        { f: { N: df.N, k: Math.max(0, df.k - 3) }, say: `The point moved three places. × 100 moves it two: ${fs(pf)}%.` },
      ],
      right: `Yes: × 100 moves the point two places right: ${fs(df)} = ${fs(pf)}%.`,
      hint: `Percent means hundredths: multiply by 100 (the point moves two places right).`,
      solution: [`${fs(df)} × 100 = ${fs(pf)}.`, `So ${fs(df)} = ${fs(pf)}%${pf.N < 10 ** pf.k ? ': less than 1%' : ''}.`],
      picture: { kind: 'ladder', p: ladder(df.N, 10 ** df.k, { ladder: false }), pre: ['cells', 'digits'], post: ['shift'], work: [`${fs(df)} \\times 100`, `= ${fs(pf)}\\%`] },
    });
  }
  return numItem({
    id: `decPct-${n}`, family: 'decPct',
    prompt: tax ? `The sales tax is <b>${fs(pf)}%</b>. Write the rate as a decimal. ${NOCALC}` : `Write <b>${fs(pf)}%</b> as a decimal. ${NOCALC}`,
    board: `${fs(pf)}\\% = \\ ?`, f: df,
    wrongs: [
      { f: pf, mc: MC.noDiv100, say: `${fs(pf)}% is ${fs(pf)} hundredths, not ${fs(pf)}. Divide by 100: ${fs(df)}.` },
      { f: { N: pf.N, k: pf.k + 1 }, mc: MC.pointOne, say: `The point moved one place. ÷ 100 moves it two places left: ${fs(df)}.` },
      { f: { N: pf.N, k: pf.k + 3 }, say: `The point moved three places. ÷ 100 moves it two: ${fs(df)}.` },
    ],
    right: `Yes: ÷ 100 moves the point two places left: ${fs(pf)}% = ${fs(df)}.`,
    hint: 'A percent is a number of hundredths: divide by 100.',
    solution: [`${fs(pf)}% = ${fs(pf)} ÷ 100.`, `= ${fs(df)}.`],
    picture: { kind: 'ladder', p: ladder(df.N, 10 ** df.k, { ladder: false }), pre: ['cells', 'digits', 'shift'], post: [], unshift: true, work: [`${fs(pf)}\\% = ${fs(pf)} \\div 100`, `= ${fs(df)}`] },
  });
};

// ===================== 11. a decimal percent to a fraction =====================
const PCT_FR: Fin[] = [fin(125, 1), fin(375, 1), fin(625, 1), fin(875, 1), fin(5, 1), fin(25, 1), fin(75, 1), fin(25, 2), fin(225, 1), fin(175, 1), fin(15, 1), fin(75, 2), fin(325, 1), fin(5, 2), fin(45, 1)];
/** more decimal percents: x.5% and x.25% / x.75% below 100%, with a simplest denominator of at most 400 */
const PCT_MORE: Fin[] = [];
for (let N = 5; N < 1000; N += 10) PCT_MORE.push(fin(N, 1));
for (let N = 25; N < 10000; N += 50) if (finFrac({ N, k: 4 })[1] <= 400) PCT_MORE.push(fin(N, 2));
const pctToFrac: Gen = (R, n) => {
  const pf = R() < 0.5 ? pick(R, PCT_FR) : pick(R, PCT_MORE), df: Fin = { N: pf.N, k: pf.k + 2 };
  const [p, q] = finFrac(df), pv = Number(fs(pf));
  return fracItem({
    id: `pctToFrac-${n}`, family: 'pctToFrac',
    prompt: `Write <b>${fs(pf)}%</b> as a fraction in simplest form, with whole numbers on top and bottom. ${NOCALC}`,
    board: `${fs(pf)}\\% = \\ ?`, p, q, simplest: true,
    wrongs: [
      { test: r => !Number.isInteger(r.n) && near(r.n, pv) && r.d === 100, mc: MC.nonIntFrac, say: `${fs(pf)}/100 has the right value, but use whole numbers: ${fs(pf)}/100 = ${df.N}/${(10 ** df.k).toLocaleString('en-US')} = ${p}/${q}.` },
      { test: r => pv >= 2 && r.w === 0 && r.n === 1 && (near(r.d, pv) || r.d === Math.floor(pv) || r.d === Math.ceil(pv)), mc: MC.onePth, say: `${fs(pf)}% is not 1/${fs(pf)}: it is ${fs(pf)} out of 100. Go through the decimal: ${fs(df)} = ${p}/${q}.` },
      { test: r => Number.isInteger(r.n) && r.d > 0 && near(val(r), pv / 10), mc: MC.pointOne, say: `That is ${fs({ N: pf.N, k: pf.k + 1 })}. A percent is ÷ 100: ${fs(pf)}% = ${fs(df)} = ${p}/${q}.` },
      { test: r => Number.isInteger(r.n) && r.d > 0 && near(val(r), pv), mc: MC.noDiv100, say: `That is ${fs(pf)} itself. ${fs(pf)}% = ${fs(pf)} ÷ 100 = ${fs(df)} = ${p}/${q}.` },
    ],
    right: `Yes: ${fs(pf)}% = ${fs(df)} = ${df.N}/${(10 ** df.k).toLocaleString('en-US')} = ${fr(p, q)}.`,
    hint: `Go in two known steps: percent → decimal (÷ 100), then decimal → fraction (place value), then simplify.`,
    solution: [`${fs(pf)}% = ${fs(pf)} ÷ 100 = ${fs(df)}.`, `${fs(df)} = ${fr(df.N, (10 ** df.k).toLocaleString('en-US'))}.`, `Simplify: ${fr(p, q)}.`],
    picture: { kind: 'bare', work: [`${fs(pf)}\\% = ${fs(df)}`, `= ${FT(df.N, 10 ** df.k)} = ${FT(p, q)}`] },
  });
};

// ===================== 12. beyond one whole =====================
const BEYOND: [number, number][] = [[8, 5], [7, 4], [2, 1], [19, 8], [5, 4], [7, 2], [1, 1], [19, 4], [15, 8], [9, 5], [13, 10], [11, 4], [21, 20], [23, 8], [3, 2], [6, 5], [13, 8], [9, 4]];
const beyondOne: Gen = (R, n) => {
  const [p, q] = pick(R, BEYOND), [w, a, b] = mixedOf(p, q), f = fracFin(p, q)!, pf = fracFin(100 * p, q)!;
  const v = int(R, 0, 2);
  if (v === 2 && a > 0) {
    // percent -> mixed number
    return fracItem({
      id: `beyondOne-${n}`, family: 'beyondOne', prompt: `Write <b>${fs(pf)}%</b> as a mixed number in simplest form. ${NOCALC}`,
      board: `${fs(pf)}\\% = \\ ?`, p, q, simplest: true,
      wrongs: [
        { test: r => Number.isInteger(r.n) && r.d > 0 && near(val(r), a / b), mc: MC.lessThanOne, say: `${fs(pf)}% is more than 100%, so more than 1 whole: ${fs(pf)}% = ${fs(f)} = ${w} ${a}/${b}.` },
        { test: r => Number.isInteger(r.n) && r.d > 0 && near(val(r), Number(fs(pf))), mc: MC.noDiv100, say: `Divide by 100 first: ${fs(pf)}% = ${fs(f)} = ${w} ${a}/${b}.` },
      ],
      right: `Yes: ${fs(pf)}% = ${fs(f)} = ${w} ${a}/${b}.`,
      hint: `${fs(pf)}% = ${fs(pf)} ÷ 100. The 100% part is ${w} whole${w > 1 ? 's' : ''}.`,
      solution: [`${fs(pf)}% = ${fs(pf)} ÷ 100 = ${fs(f)}.`, `${fs(f)} = ${w} + ${fs({ N: f.N - w * 10 ** f.k, k: f.k })} = ${mixH(p, q)}.`],
      picture: { kind: 'ladder', p: ladder(f.N, 10 ** f.k, { ladder: false }), pre: ['cells', 'digits', 'shift'], post: [], unshift: true, work: [`${fs(pf)}\\% = ${fs(f)}`, `= ${mixT(p, q)}`] },
    });
  }
  const fromDec = v === 1;
  const misread = a > 0 ? fin(Number(`${w}${a}${b}`), `${a}${b}`.length) : null;   // 1 3/5 read as 1.35
  const wrongs: NWrong[] = [
    { f, mc: MC.appendPct, say: `${fs(f)} is the decimal. As a percent it is × 100: ${fs(pf)}%.` },
    { f: { N: f.N, k: f.k - 1 }, mc: MC.pointOne, say: `× 100 moves the point two places, not one: ${fs(pf)}%.` },
  ];
  if (a > 0) wrongs.push({ f: fracFin(100 * a, b)!, mc: MC.lessThanOne, say: `The ${w} whole${w > 1 ? 's' : ''} count too: ${w} = ${100 * w}%, so the total is ${fs(pf)}%.` });
  if (misread && !fromDec) wrongs.push({ f: { N: misread.N * 100, k: misread.k }, mc: MC.misreadMixed, say: `${mixH(p, q)} is not ${fs(misread)}: ${fr(a, b)} = ${fs(fracFin(a, b)!)}. So ${mixH(p, q)} = ${fs(f)} = ${fs(pf)}%.` });
  return numItem({
    id: `beyondOne-${n}`, family: 'beyondOne',
    prompt: fromDec ? `Write <b>${fs(f)}</b> as a percent. ${NOCALC}` : `Write <b>${mixH(p, q)}</b> as a percent. ${NOCALC}`,
    board: `${fromDec ? fs(f) : mixT(p, q)} = \\ ?\\,\\%`, unit: '%', f: pf, wrongs,
    right: `Yes: ${fromDec ? fs(f) : mixH(p, q)} = ${fs(pf)}%. More than one whole is more than 100%.`,
    hint: `1 whole = 100%. ${fromDec || a === 0 ? `Multiply ${fs(f)} by 100.` : `Write ${mixH(p, q)} as a decimal first, then × 100.`}`,
    solution: [...(fromDec || a === 0 ? [] : [`${mixH(p, q)} = ${fs(f)}${a ? ` (${fr(a, b)} = ${fs(fracFin(a, b)!)})` : ''}.`]), `${fs(f)} × 100 = ${fs(pf)}, so it is ${fs(pf)}%.`],
    picture: drawable(p, q) && !fromDec && a > 0 ? { kind: 'ladder', p: ladder(p, q), pre: ['cells'], post: [...rowsOf(p, q), 'stop', 'zeros', 'shift'], work: [`${mixT(p, q)} = ${fs(f)}`, `= ${fs(pf)}\\%`] }
      : { kind: 'ladder', p: ladder(f.N, 10 ** f.k, { ladder: false }), pre: ['cells', 'digits'], post: ['shift'], work: [`${fs(f)} \\times 100`, `= ${fs(pf)}\\%`] },
  });
};

// ===================== 13. an exact percent with a repeating decimal =====================
const REP_PCT: [number, number][] = [[1, 3], [2, 3], [1, 6], [5, 6], [1, 12], [5, 12], [7, 12], [5, 11], [2, 11], [7, 22], [1, 22], [3, 22], [5, 22], [1, 15], [2, 15], [4, 9], [1, 9], [1, 18], [7, 18], [4, 11]];
const repPct: Gen = (R, n) => {
  const [p, q] = pick(R, REP_PCT), e = expand(p, q), pc = pctOf(p, q);
  if (R() < 0.3) {
    // the reverse: percent -> decimal
    const digits = e.pre + e.rep;
    const opts: Opt[] = [
      { t: decHtml(e), ok: true, say: `Yes: ÷ 100 moves the point two places left, and the block is read again: ${pctH(pc)} = ${decHtml(e)}.` },
      { t: decHtml(pc), ok: false, mc: MC.noDiv100, say: `That is the percent numeral. ${pctH(pc)} means ÷ 100: ${decHtml(e)}.` },
      { t: fh(roundFrac(p, q, 2)), ok: false, mc: MC.roundedExact, say: `${fh(roundFrac(p, q, 2))} is rounded. The exact decimal keeps the bar: ${decHtml(e)}.` },
    ];
    if (e.pre) opts.push({ t: barAt('0', digits, 0, digits.length), ok: false, mc: MC.barAll, say: `Only ${e.rep} repeats; ${e.pre} comes once: ${decHtml(e)}.` });
    return choiceItem(R, {
      id: `repPct-${n}`, family: 'repPct', prompt: `Write <b>${pctH(pc)}</b> as an exact decimal.`,
      board: `${pctT(pc)} = \\ ?`, opts,
      solution: [`Write it out: ${pctH(pc).replace('%', '')} = ${decLong(pc, 5)}`, `÷ 100: ${decLong(e, 7)}`, `Read the block again: ${decHtml(e)}.`],
      picture: drawable(p, q) ? { kind: 'ladder', p: ladder(p, q, { ladder: false }), pre: ['cells', 'digits', 'more', 'groups', 'shift'], post: [], unshift: true, work: [`${pctT(pc)} = ${decTex(e)}`] } : { kind: 'bare', work: [`${pctT(pc)} = ${decTex(e)}`] },
    });
  }
  const opts: Opt[] = [{ t: pctH(pc), ok: true, say: `Yes: × 100 moves the point two places, then the repeating block is read from the new point: ${pctH(pc)}.` }];
  // the old block copied after the new point (7/22: 31.18 repeating instead of 31.81 repeating)
  const anchored: Dec = { neg: false, whole: pc.whole, pre: '', rep: e.rep };
  if (decHtml(anchored) !== decHtml(pc)) opts.push({ t: pctH(anchored), ok: false, mc: MC.barAnchored, say: `The bar does not stay on the same digits. Write it out (${decLong(e, 7)}), move the point (${decLong(pc, 5)}), and read the block again: ${pctH(pc)}.` });
  opts.push({ t: `${fh(roundFrac(100 * p, q, Math.max(1, pc.pre.length + pc.rep.length), 'trunc'))}%`, ok: false, mc: MC.barAfterShift, say: `The digits still go on after the shift, so the bar stays: ${pctH(pc)} (without it, the percent is only ≈).` });
  opts.push({ t: `${decHtml(e)}%`, ok: false, mc: MC.appendPct, say: `${decHtml(e)}% would be less than 1%. Multiply by 100 first: ${pctH(pc)}.` });
  return choiceItem(R, {
    id: `repPct-${n}`, family: 'repPct', prompt: `${fr(p, q)} = <b>${decHtml(e)}</b>. Write it as an <b>exact</b> percent.`,
    board: `${FT(p, q)} = ${decTex(e)} = \\ ?\\,\\%`, opts: opts.slice(0, 4),
    solution: [`Write it out: ${decLong(e, 7)}`, `× 100: ${decLong(pc, 5)}`, `Read the block again from the point: ${pctH(pc)}.`],
    picture: drawable(p, q) ? { kind: 'ladder', p: ladder(p, q), pre: ['cells', ...rowsOf(p, q), 'loop', 'more', 'groups'], post: ['shift'], work: [`${decTex(e)} \\times 100`, `= ${pctT(pc)}`] } : { kind: 'bare', work: [`${decTex(e)} \\times 100 = ${pctT(pc)}`] },
  });
};

// ===================== 14. mixed-number percents =====================
const MIX_PCT: [number, number][] = [[1, 3], [2, 3], [1, 6], [5, 6], [1, 8], [3, 8], [5, 8], [7, 8], [1, 12], [5, 12], [1, 9], [2, 9], [1, 7], [1, 16], [3, 16], [4, 9], [7, 12], [1, 15]];
const mixedPct: Gen = (R, n) => {
  const [p, q] = pick(R, MIX_PCT), [w, a, b] = mixedOf(100 * p, q);
  const pctMix = `(${w}${fr(a, b)})%`;
  if (R() < 0.4) {
    // the reverse: (33 1/3)% -> 1/3
    const misread = Number(`${w}.${a}${b}`) / 100;
    return fracItem({
      id: `mixedPct-${n}`, family: 'mixedPct', prompt: `Write <b>${pctMix}</b> as a fraction in simplest form. ${NOCALC}`,
      board: `\\left(${w}${fT(a, b)}\\right)\\% = \\ ?`, p, q, simplest: true,
      wrongs: [
        { test: r => Number.isInteger(r.n) && r.d > 0 && near(val(r), (w * b + a) / b), mc: MC.noDiv100, say: `That is ${w} ${a}/${b} itself. A percent is a part of 100: ${w} ${a}/${b} out of 100 = ${p}/${q}.` },
        { test: r => Number.isInteger(r.n) && r.d > 0 && near(val(r), misread, 1e-6), mc: MC.misreadMixed, say: `${w} ${a}/${b} is not ${w}.${a}${b}. It is ${p}/${q} of 100, because 100 × ${p}/${q} = ${w} ${a}/${b}.` },
      ],
      right: `Yes: 100 × ${fr(p, q)} = ${w}${fr(a, b)}, so ${pctMix} = ${fr(p, q)}.`,
      hint: `Which fraction of 100 is ${w} ${a}/${b}? Try 100 × ${fr(1, q)}.`,
      solution: [`100 × ${fr(p, q)} = ${fr(100 * p, q)} = ${w}${fr(a, b)}.`, `So ${w}${fr(a, b)} is ${fr(p, q)} of 100: ${pctMix} = ${fr(p, q)}.`],
      picture: { kind: 'bare', work: [`100 \\times ${FT(p, q)} = ${w}${fT(a, b)}`, `\\left(${w}${fT(a, b)}\\right)\\% = ${FT(p, q)}`] },
    });
  }
  return fracItem({
    id: `mixedPct-${n}`, family: 'mixedPct', unit: '%',
    prompt: `Write <b>${fr(p, q)}</b> as an exact percent, with a mixed number: (☐ ☐/☐)%. ${NOCALC}`,
    board: `${FT(p, q)} = \\left(\\ ?\\ \\right)\\%`, p: 100 * p, q, simplest: false,
    wrongs: [
      { test: r => Number.isInteger(r.n) && r.d > 0 && near(val(r), p / q), mc: MC.bothTerms, say: `100 × ${p}/${q} multiplies only the top: ${100 * p}/${q}, not ${100 * p}/${100 * q}. That is ${w} ${a}/${b}.` },
      { test: r => Number.isInteger(r.n) && r.d > 0 && near(val(r), p / (100 * q)), mc: MC.denOnly, say: `100 × ${p}/${q} makes the top 100 times bigger: ${100 * p}/${q} = ${w} ${a}/${b}.` },
    ],
    right: `Yes: 100 × ${fr(p, q)} = ${fr(100 * p, q)} = ${w}${fr(a, b)}, so ${fr(p, q)} = ${pctMix}.`,
    hint: `A percent counts hundredths: multiply ${fr(p, q)} by 100, then write ${fr(100 * p, q)} as a mixed number.`,
    solution: [`100 × ${fr(p, q)} = ${fr(100 * p, q)}.`, `${fr(100 * p, q)} = ${w}${fr(a, b)} (${q} × ${w} = ${q * w}, ${100 * p - q * w} left over${gcd(100 * p - q * w, q) > 1 ? `, ${fr(100 * p - q * w, q)} = ${fr(a, b)}` : ''}).`, `So ${fr(p, q)} = ${pctMix}${expand(100 * p, q).rep ? ` = ${pctH(pctOf(p, q))}` : ''}.`],
    picture: { kind: 'bare', work: [`100 \\times ${FT(p, q)} = ${FT(100 * p, q)}`, `= ${w}${fT(a, b)}`] },
  });
};

// ===================== 15. eighths, thirds, sixths =====================
const COMMON: [number, number][] = [[1, 8], [3, 8], [5, 8], [7, 8], [1, 3], [2, 3], [1, 6], [5, 6], [1, 20], [1, 25]];
const pair = (p: number, q: number) => `${decHtml(expand(p, q))} = ${pctH(pctOf(p, q))}`;
const recall: Gen = (R, n) => {
  const [p, q] = pick(R, COMMON);
  const toFrac = R() < 0.4;
  const right = toFrac ? fr(p, q) : pair(p, q);
  const opts: Opt[] = [{ t: right, ok: true, say: `Yes: ${fr(p, q)} = ${pair(p, q)}${q === 8 ? ` (${fr(1, 8)} = 12.5%, half of 25%)` : q === 6 ? ` (${fr(1, 6)} is half of ${fr(1, 3)})` : ''}.` }];
  const swap = q === 8 && p < 6 ? [p, 6] : q === 6 ? [p, 8] : null;
  if (swap) opts.push({ t: toFrac ? fr(swap[0]!, swap[1]!) : pair(swap[0]!, swap[1]!), ok: false, mc: MC.eighthsSixths, say: `That mixes up eighths and sixths. ${fr(1, 8)} = 12.5% and ${fr(1, 6)} = ${pctH(pctOf(1, 6))}: ${fr(p, q)} = ${pair(p, q)}.` });
  if (p === 1 && q <= 9 && !toFrac) opts.push({ t: `0.${q} = ${q}0%`, ok: false, mc: MC.tenthsUnit, say: `0.${q} is ${q} tenths, not 1/${q}. ${fr(1, q)} = ${pair(1, q)}.` });
  const rd = roundFrac(p, q, 2), rp = roundFrac(100 * p, q, 0);
  if (q === 20 || q === 25) opts.push({ t: toFrac ? fr(1, 100 / q) : `${q / 100} = ${q}%`, ok: false, mc: MC.onePth, say: `${fr(1, q)} is not ${q}%: ${q}% is ${q} out of 100. ${fr(1, q)} = ${100 / q} out of 100 = ${pair(1, q)}.` });
  if (expand(p, q).rep && toFrac) { const tr = roundFrac(p, q, 2, 'trunc'), [a2, b2] = finFrac(tr); opts.push({ t: fr(a2, b2), ok: false, mc: MC.truncFull, say: `${fr(a2, b2)} = ${fh(tr)}, which stops. ${decHtml(expand(p, q))} goes on forever: it is ${fr(p, q)}.` }); }
  if (expand(p, q).rep && !toFrac) opts.push({ t: `${fh(rd)} = ${fh(rp)}%`, ok: false, mc: MC.roundedExact, say: `Close, but rounded. Exactly: ${pair(p, q)}.` });
  for (const [a, b] of shuffle(R, COMMON.slice())) {
    if (opts.length >= 4) break;
    if (a === p && b === q) continue;
    opts.push({ t: toFrac ? fr(a, b) : pair(a, b), ok: false, say: `That is ${fr(a, b)}. ${fr(p, q)} = ${pair(p, q)}.` });
  }
  return choiceItem(R, {
    id: `recall-${n}`, family: 'recall',
    prompt: toFrac ? `Which fraction is <b>${pair(p, q)}</b>?` : `Which is <b>${fr(p, q)}</b>?`,
    board: toFrac ? `${decTex(expand(p, q))} = ${pctT(pctOf(p, q))} = \\ ?` : `${FT(p, q)} = \\ ?`, opts: opts.slice(0, 4),
    solution: [q === 8 ? `${fr(1, 8)} is half of ${fr(1, 4)}: 12.5%. ${p > 1 ? `${fr(p, 8)} = ${p} × 12.5% = ${pctH(pctOf(p, q))}.` : ''}` : q === 6 ? `${fr(1, 6)} is half of ${fr(1, 3)}: ${pctH(pctOf(1, 6))}. ${p > 1 ? `${fr(5, 6)} = 1 − ${fr(1, 6)} = ${pctH(pctOf(5, 6))}.` : ''}` : q === 3 ? `${fr(1, 3)} = ${pctH(pctOf(1, 3))}${p > 1 ? `, so ${fr(2, 3)} = ${pctH(pctOf(2, 3))}` : ''}.` : `${fr(1, q)} = ${100 / q} hundredths.`, `${fr(p, q)} = ${pair(p, q)}.`],
    picture: { kind: 'bare', work: [`${FT(p, q)} = ${decTex(expand(p, q))} = ${pctT(pctOf(p, q))}`] },
  });
};

// ===================== 16. why it must stop or repeat (enrichment) =====================
const remainders: Gen = (R, n) => {
  const v = int(R, 0, 2);
  if (v === 0) {
    const q = pick(R, [7, 11, 13, 17, 19, 23, 29]);
    return numItem({
      id: `remainders-${n}`, family: 'remainders',
      prompt: `When you divide by <b>${q}</b>, the remainders can only be 0, 1, 2, …, ${q - 1}. So at most how many digits can a repeating block of a fraction with denominator ${q} have?`,
      board: `\\text{remainders: } 0, 1, \\ldots, ${q - 1}`, f: fin(q - 1, 0),
      wrongs: [{ f: fin(q, 0), mc: MC.periodIsDen, say: `Remainder 0 means it stops, so a repeat can only use the ${q - 1} others: at most ${q - 1} digits.` }],
      right: `Yes: with ${q - 1} nonzero remainders, one must come back within ${q - 1} steps.`,
      hint: `Remainder 0 means it stops. How many other remainders are there?`,
      solution: [`Nonzero remainders: 1 to ${q - 1}, that is ${q - 1} of them.`, `After at most ${q - 1} steps one comes back, so the block has at most ${q - 1} digits.`],
      picture: { kind: 'bare', work: [`\\text{at most } ${q - 1}\\ \\text{digits}`] },
    });
  }
  if (v === 1) {
    const p = int(R, 1, 6), L = longDivide(p, 7), rs = L.rows.slice(0, 6).map(w => w.r);
    // the remainders of p/7 in order: p, then 5 more; all six nonzero remainders show up, then p again
    return numItem({
      id: `remainders-${n}`, family: 'remainders',
      prompt: `Dividing ${fr(p, 7)}, the remainders so far are <b>${rs.join(', ')}</b>. What must the next remainder be?`,
      board: `${rs.join(',\\ ')},\\ ?`, f: fin(L.rows[6]!.r, 0),
      wrongs: [{ f: fin(0, 0), mc: MC.alwaysEnds, say: `${fr(p, 7)} never reaches 0. All six nonzero remainders are used, so one of them comes back: ${L.rows[6]!.r}.` }],
      right: `Yes: ${10 * rs[5]!} ÷ 7 = ${L.rows[6]!.q} r ${L.rows[6]!.r}. The remainder ${p} is back, so the 6 digits repeat.`,
      hint: `The next line is ${10 * rs[5]!} ÷ 7.`,
      solution: [`Next line: ${10 * rs[5]!} ÷ 7 = ${L.rows[6]!.q} r ${L.rows[6]!.r}.`, `All of 1–6 have been used, so a remainder had to come back.`, `${fr(p, 7)} = ${decHtml(expand(p, 7))}.`],
      picture: { kind: 'bare', work: [`${10 * rs[5]!} \\div 7 = ${L.rows[6]!.q}\\ \\text{r}\\ ${L.rows[6]!.r}`] },
    });
  }
  const q = pick(R, [7, 11, 13, 17, 19, 23]);
  return choiceItem(R, {
    id: `remainders-${n}`, family: 'remainders',
    prompt: `Can the decimal of <b>${fr(1, q)}</b> go on forever without ever repeating?`,
    board: `${FT(1, q)} = \\ ?`,
    opts: [
      { t: `No: there are only ${q - 1} nonzero remainders, so within ${q} steps one comes back (or one is 0)`, ok: true, say: `Yes: the remainders run out, so the steps must repeat.` },
      { t: 'Yes: some divisions go on forever with no pattern', ok: false, mc: MC.noRepeatForever, say: `Not for a fraction: every remainder is one of 0 to ${q - 1}, so one must come back.` },
      { t: `The repeating block always has exactly ${q} digits`, ok: false, mc: MC.periodIsDen, say: `At most ${q - 1} digits, and often fewer (${fr(1, 11)} = 0.<span class="rep">09</span>, a block of 2).` },
    ],
    solution: [`Dividing by ${q} leaves a remainder from 0 to ${q - 1}.`, `0 means it stops; otherwise one of the ${q - 1} others must come back, and then the digits repeat.`],
    picture: { kind: 'bare', work: [`\\text{remainders } 1 \\ldots ${q - 1}`] },
  });
};

// ===================== 17. the 2-and-5 test (enrichment) =====================
const TEST25: [number, number][] = [[3, 12], [2, 15], [7, 14], [3, 80], [1, 24], [6, 15], [9, 12], [7, 35], [1, 25], [3, 30], [5, 40], [11, 22], [4, 18], [3, 75], [9, 45], [1, 40], [7, 21], [2, 35], [6, 75], [1, 15], [3, 60], [9, 36]];
const factorText = (q: number) => { const out: number[] = []; let m = q; for (let f = 2; m > 1; f++) while (m % f === 0) { out.push(f); m /= f; } return out.join(' × '); };
const twoFive: Gen = (R, n) => {
  const [p, q] = pick(R, TEST25), [rp, rq] = reduce(p, q), term = otherFactors(rq).length === 0;
  const why = term ? `${fr(rp, rq)}: ${rq} = ${factorText(rq) || '1'}, only 2s and 5s` : `${fr(rp, rq)}: ${rq} = ${factorText(rq)}, which has the factor ${otherFactors(rq)[0]}`;
  const opts: Opt[] = [{ t: `${term ? 'Terminates' : 'Repeats'}: in simplest form it is ${why}`, ok: true, say: `Yes: simplify first, then look for primes other than 2 and 5.` }];
  if (term && otherFactors(q).length) opts.push({ t: `Repeats: ${q} has the factor ${otherFactors(q)[0]}`, ok: false, mc: MC.testUnreduced, say: `Simplify first: ${fr(p, q)} = ${fr(rp, rq)}, and ${rq} has only 2s and 5s.` });
  if (term && q % 2 === 1) opts.push({ t: `Repeats: ${q} is odd`, ok: false, mc: MC.oddRepeats, say: `Odd is not the test: 5s are fine. ${fr(p, q)} = ${fr(rp, rq)} = ${decHtml(expand(p, q))}.` });
  if (!term && q % 2 === 0) opts.push({ t: `Terminates: ${q} is even`, ok: false, say: `Even is not enough: ${rq} = ${factorText(rq)} has the factor ${otherFactors(rq)[0]}, so it repeats.` });
  opts.push({ t: term ? 'Repeats: the remainder can never be 0' : 'Terminates: the remainder reaches 0', ok: false, mc: term ? undefined : MC.alwaysEnds, say: `Check the simplest form: ${why}.` });
  if (opts.length < 3) opts.push({ t: 'You cannot tell without dividing', ok: false, say: `The simplest form tells you: ${why}.` });
  return choiceItem(R, {
    id: `twoFive-${n}`, family: 'twoFive', prompt: `Without dividing: does <b>${fr(p, q)}</b> terminate or repeat? Use the denominator in simplest form.`,
    board: `${FT(p, q)}${rp !== p ? ` = ${FT(rp, rq)}` : ''}`, opts: opts.slice(0, 4),
    solution: [`Simplest form: ${fr(p, q)} = ${fr(rp, rq)}.`, `${rq} = ${factorText(rq) || '1'}.`, term ? 'Only 2s and 5s: it terminates.' : `A factor ${otherFactors(rq)[0]}: it repeats.`, `${fr(p, q)} = ${decHtml(expand(p, q))}.`],
    picture: { kind: 'bare', work: [`${FT(rp, rq)}: \\ ${rq} = ${factorText(rq).replace(/×/g, '\\times') || '1'}`] },
  });
};

// ===================== 19. round once, at the end =====================
const ROUND: [number, number][] = [[2, 3], [1, 6], [5, 6], [5, 12], [7, 12], [2, 7], [5, 9], [7, 9], [4, 11], [5, 11], [1, 12], [11, 12], [1, 7], [3, 7], [8, 9], [7, 11]];
const roundFinal: Gen = (R, n) => {
  const [p, q] = pick(R, ROUND), v = int(R, 0, 2), e = expand(p, q);
  if (v === 2) {
    // rounding too early: 5/12 -> 0.42 -> 42.0% instead of 41.7%
    const early = roundFrac(p, q, 2), exact1 = roundFrac(100 * p, q, 1);
    if (fs(fin(early.N * 10, 1)) !== fs(exact1)) {
      return numItem({
        id: `roundFinal-${n}`, family: 'roundFinal', unit: '%',
        prompt: `Write ${fr(p, q)} as a percent to the nearest tenth of a percent. Ana rounds ${fr(p, q)} to ${fs(early)} first and gets ${fs(fin(early.N * 10, 1))}%. What is the right answer?`,
        board: `${FT(p, q)} \\approx \\ ?\\,\\%`, f: exact1,
        wrongs: [{ f: fin(early.N * 10, 1), mc: MC.intermediate, say: `Rounding to ${fs(early)} first threw away digits that the tenth of a percent needs. Keep it exact (${pctH(pctOf(p, q))}) and round once: ${fs(exact1)}%.` },
          { f: roundFrac(100 * p, q, 1, 'trunc'), mc: MC.truncates, say: `Look at the next digit: ${decLong(pctOf(p, q), 3)} rounds to ${fs(exact1)}%.` }],
        right: `Yes: ${fr(p, q)} = ${pctH(pctOf(p, q))} ≈ ${fs(exact1)}%, rounded once, at the end.`,
        hint: `Keep it exact until the end: ${fr(p, q)} = ${pctH(pctOf(p, q))}, then round to tenths.`,
        solution: [`Exact: ${fr(p, q)} = ${pctH(pctOf(p, q))} = ${decLong(pctOf(p, q), 3)}%.`, `Round once, to the nearest tenth: ${fs(exact1)}%.`],
        picture: { kind: 'bare', work: [`${FT(p, q)} = ${pctT(pctOf(p, q))}`, `\\approx ${fs(exact1)}\\%`] },
      });
    }
  }
  const asPct = v === 1 || v === 2, k = asPct ? pick(R, [1, 2]) : pick(R, [2, 3]);
  const exact = asPct ? pctOf(p, q) : e;
  const f = asPct ? roundFrac(100 * p, q, k) : roundFrac(p, q, k), t = asPct ? roundFrac(100 * p, q, k, 'trunc') : roundFrac(p, q, k, 'trunc');
  const placeName = k === 1 ? 'tenth' : k === 2 ? 'hundredth' : 'thousandth';
  const wrongs: NWrong[] = [];
  if (t.N !== f.N) wrongs.push({ f: t, mc: MC.truncates, say: `That cuts the digits off. Rounding looks at the next digit: ${decLong(exact, k + 1)} rounds to ${fs(f)}.` });
  wrongs.push({ f: asPct ? roundFrac(p, q, k) : roundFrac(100 * p, q, k), say: asPct ? `That is the decimal. As a percent: ${fs(f)}%.` : `That is the percent. As a decimal: ${fs(f)}.` });
  return numItem({
    id: `roundFinal-${n}`, family: 'roundFinal', unit: asPct ? '%' : undefined,
    prompt: `Write <b>${fr(p, q)}</b> as a ${asPct ? 'percent' : 'decimal'}, rounded to the nearest ${placeName}${asPct ? ' of a percent' : ''}. ${NOCALC}`,
    board: `${FT(p, q)} \\approx \\ ?${asPct ? '\\,\\%' : ''}`, f, wrongs,
    right: `Yes: ${asPct ? pctH(exact) : decHtml(exact)} ≈ ${fs(f)}${asPct ? '%' : ''}.`,
    hint: `Write enough digits: ${fr(p, q)} = ${asPct ? pctH(exact) : decHtml(exact)}. Then look at the digit after the ${placeName}s.`,
    solution: [`Exact: ${fr(p, q)} = ${asPct ? pctH(exact) : decHtml(exact)} = ${decLong(exact, k + 2)}${asPct ? '%' : ''}.`, `The next digit decides: ${fs(f)}${asPct ? '%' : ''}.`],
    picture: { kind: 'bare', work: [`${FT(p, q)} = ${asPct ? pctT(exact) : decTex(exact)}`, `\\approx ${fs(f)}${asPct ? '\\%' : ''}`] },
  });
};

// ===================== 20. what a calculator display shows =====================
const CALC_REP: [number, number][] = [[1, 3], [2, 3], [1, 6], [5, 6], [5, 12], [7, 12], [2, 9], [4, 11], [1, 7], [7, 9]];
const CALC_TERM: [number, number][] = [[1, 8], [3, 8], [7, 16], [3, 80], [9, 40], [5, 16], [1, 16], [7, 8]];
const calcDisplay: Gen = (R, n) => {
  const v = int(R, 0, 2);
  if (v === 2) {
    const [p, q] = pick(R, CALC_TERM), f = fracFin(p, q)!;
    return choiceItem(R, {
      id: `calcDisplay-${n}`, family: 'calcDisplay', prompt: `A calculator shows <b>${p} ÷ ${q} = ${fs(f)}</b>. What does the display tell you about ${fr(p, q)}?`,
      board: `${p} \\div ${q}`,
      opts: [
        { t: `It is exact: ${p} ÷ ${q} reaches remainder 0, so ${fr(p, q)} = ${fs(f)}`, ok: true, say: `Yes: the division stops, so the display shows all of it.` },
        { t: 'It is only approximate: a calculator display is never exact', ok: false, mc: MC.calcInexact, say: `Some displays are exact. ${p} ÷ ${q} stops at ${fs(f)} (remainder 0), so this one is.` },
        { t: `It repeats: ${fs(f)}${fs(f).slice(2)}…`, ok: false, mc: MC.prefixPattern, say: `Nothing says it repeats: the division reaches remainder 0, so later digits are all 0.` },
      ],
      solution: divLines(p, q),
      picture: { kind: 'calc', p: { expr: `${p} ÷ ${q} =`, shows: fs(f) }, work: [`${FT(p, q)} = ${fs(f)}`] },
    });
  }
  const [p, q] = pick(R, CALC_REP), e = expand(p, q);
  const trunc = v === 1;
  const shown = (p / q < 1) ? (trunc ? roundFrac(p, q, 9, 'trunc') : roundFrac(p, q, 9)) : roundFrac(p, q, 8);
  const isRounded = !trunc && shown.N !== roundFrac(p, q, 9, 'trunc').N;
  const what = trunc ? 'cut off (truncated)' : isRounded ? 'rounded (the last digit went up)' : 'cut off where the display ends';
  return choiceItem(R, {
    id: `calcDisplay-${n}`, family: 'calcDisplay', prompt: `A calculator shows <b>${p} ÷ ${q} = ${fs(shown)}</b>. Long division gives ${fr(p, q)} = ${decHtml(e)}. What does the display show?`,
    board: `${p} \\div ${q}`,
    opts: [
      { t: `A finite window: ${fr(p, q)} = ${decHtml(e)} goes on, and the display is ${what}`, ok: true, say: `Yes: the display has room for 10 digits; the decimal never ends. So ${fs(shown)} ≈ ${fr(p, q)}.` },
      { t: `The exact value: ${fr(p, q)} = ${fs(shown)}`, ok: false, mc: MC.truncFull, say: `The remainder keeps coming back, so the digits never stop: ${fs(shown)} is only ≈ ${fr(p, q)}.` },
      { t: `${p} ÷ ${q} stops after ${shown.k} digits`, ok: false, mc: MC.alwaysEnds, say: `The calculator stops, not the division: the remainder ${longDivide(p, q).rows[longDivide(p, q).at]!.r} comes back forever.` },
    ],
    solution: [`Long division: a remainder comes back, so ${fr(p, q)} = ${decHtml(e)} forever.`, `The display ends after ${shown.k} digits: it is ${what}.`, `So ${fs(shown)} ≈ ${fr(p, q)}, and ${decHtml(e)} = ${fr(p, q)}.`],
    picture: { kind: 'calc', p: { expr: `${p} ÷ ${q} =`, shows: fs(shown) }, work: [`${FT(p, q)} = ${decTex(e)}`, `${fs(shown)} \\approx ${FT(p, q)}`] },
  });
};

// ===================== 21. a rounded value changes the result =====================
const roundingError: Gen = (R, n) => {
  const v = int(R, 0, 3);
  const cases = [
    { p: 1, q: 3, r: fin(33, 2) }, { p: 2, q: 3, r: fin(67, 2) }, { p: 1, q: 6, r: fin(17, 2) }, { p: 1, q: 3, r: fin(3, 1) }, { p: 2, q: 3, r: fin(7, 1) },
  ];
  const c = pick(R, cases);
  const err = Math.abs(c.r.N * c.q - c.p * 10 ** c.r.k);           // |r - p/q| = err / (q 10^k)
  const unitA = c.q * 10 ** c.r.k / gcd(err, c.q * 10 ** c.r.k);   // amounts that make the error a whole number
  const step = unitA * c.q / gcd(unitA, c.q);
  const A = step * int(R, 1, Math.max(1, Math.floor(1500 / step)));
  const exact = A * c.p / c.q, used = fin(c.r.N * A, c.r.k), diff = A * err / (c.q * 10 ** c.r.k);
  const money = R() < 0.6;
  const $ = (s: string) => (money ? `$${s}` : s);
  const thing = money ? 'of the money' : pick(R, ['of the miles', 'of the people', 'of the seats']);
  if (v === 3 || (v === 0 && c.p === 1 && c.q === 3)) {
    // $100 split three ways
    return numItem({
      id: `roundingError-${n}`, family: 'roundingError', unit: 'dollars',
      prompt: `$100 is split 3 ways and each share is written as <b>$33.33</b>. Add the three shares: 3 × $33.33 = ?`,
      board: `3 \\times \\$33.33 = \\ ?`, f: fin(9999, 2),
      wrongs: [{ f: fin(100, 0), mc: MC.roundedExact, say: `$33.33 is rounded, not exactly a third: 3 × $33.33 = $99.99, a cent short.` }],
      right: 'Yes: $99.99. The rounded shares lose a cent: $33.33 ≈ 1/3 of $100.',
      hint: '3 × 33 = 99 and 3 × 0.33 = 0.99.',
      solution: ['3 × $33.33 = $99.99.', `Exactly, each share is $${decHtml(expand(100, 3))}; $33.33 is rounded, so the total is off by 1 cent.`],
      picture: { kind: 'bare', work: [`3 \\times \\$33.33 = \\$99.99`, `\\ne \\$100`] },
    });
  }
  if (v === 1 || v === 0) {
    return numItem({
      id: `roundingError-${n}`, family: 'roundingError', unit: money ? 'dollars' : undefined,
      prompt: `${fr(c.p, c.q)} of ${$(A.toLocaleString('en-US'))} is exactly ${$(exact.toLocaleString('en-US'))}. Jo uses <b>${fs(c.r)}</b> instead of ${fr(c.p, c.q)}: ${fs(c.r)} × ${$(A.toLocaleString('en-US'))} = ?`,
      board: `${fs(c.r)} \\times ${money ? '\\$' : ''}${A} = \\ ?`, f: used,
      wrongs: [{ f: fin(exact, 0), mc: MC.roundedExact, say: `${fs(c.r)} is not exactly ${fr(c.p, c.q)}, so the answer is not exactly ${$(String(exact))}: ${fs(c.r)} × ${A} = ${fs(used)}.` },
        { f: { N: used.N, k: used.k + 1 }, mc: MC.pointOne, say: `Check the point: ${fs(c.r)} × ${A} = ${fs(used)}.` }],
      right: `Yes: ${$(fs(used))}, ${$(String(diff))} ${Number(fs(used)) < exact ? 'less' : 'more'} than the exact ${$(String(exact))}.`,
      hint: `${fs(c.r)} × ${A}: multiply ${c.r.N} × ${A}, then place the point.`,
      solution: [`${fs(c.r)} × ${A} = ${fs(used)}.`, `Exactly: ${fr(c.p, c.q)} × ${A} = ${exact}. The rounding moved the answer by ${diff}.`],
      picture: { kind: 'bare', work: [`${fs(c.r)} \\times ${A} = ${fs(used)}`, `${FT(c.p, c.q)} \\times ${A} = ${exact}`] },
    });
  }
  // how far off is the result? the rounding error is multiplied too
  return numItem({
    id: `roundingError-${n}`, family: 'roundingError', unit: money ? 'dollars' : undefined,
    prompt: `Jo finds ${fr(c.p, c.q)} ${thing} out of ${$(A.toLocaleString('en-US'))} by using <b>${fs(c.r)}</b> for ${fr(c.p, c.q)}. How far off is Jo's answer from the exact one?`,
    board: `${FT(c.p, c.q)} \\times ${A} \\ \\text{vs}\\ ${fs(c.r)} \\times ${A}`, f: fin(diff, 0),
    wrongs: [
      { f: fin(0, 0), mc: MC.roundedExact, say: `${fs(c.r)} ≠ ${fr(c.p, c.q)}, so the answers differ: ${exact} vs ${fs(used)}, a gap of ${diff}.` },
      { test: x => x > 0 && x < 0.1, mc: MC.errorNotScaled, say: `That is the error of ${fs(c.r)} itself. Multiplying by ${A} multiplies the error too: ${A} × that = ${diff}.` },
    ],
    right: `Yes: ${exact} vs ${fs(used)}: off by ${diff}. The small rounding error was multiplied by ${A}.`,
    hint: `Work out both: ${fr(c.p, c.q)} × ${A} and ${fs(c.r)} × ${A}, then subtract.`,
    solution: [`Exact: ${fr(c.p, c.q)} × ${A} = ${exact}.`, `Rounded: ${fs(c.r)} × ${A} = ${fs(used)}.`, `Off by ${diff}: the rounding error is multiplied by ${A}.`],
    picture: { kind: 'bare', work: [`${FT(c.p, c.q)} \\times ${A} = ${exact}`, `${fs(c.r)} \\times ${A} = ${fs(used)}`] },
  });
};

// ===================== 22. keep it exact, report sensibly =====================
const roundEnd: Gen = (R, n) => {
  const v = int(R, 0, 2);
  if (v === 0) {
    const k = pick(R, [3, 6, 7, 9]);
    let A = int(R, 20, 95); if (A % k === 0) A++;
    const cents = roundFrac(A, k, 2);
    return choiceItem(R, {
      id: `roundEnd-${n}`, family: 'roundEnd', prompt: `A $${A} bill is split equally by ${k} friends. What should each share be written as?`,
      board: `\\$${A} \\div ${k}`,
      opts: [
        { t: `$${fh(cents)}: the exact share rounded once, to the cent`, ok: true, say: `Yes: $${A} ÷ ${k} = $${decHtml(expand(A, k))} exactly; money is reported to the cent.` },
        { t: `$${fh(roundFrac(A, k, 4))}`, ok: false, mc: MC.falsePrecision, say: `Money only has cents: report $${fh(cents)} (the 4-place number claims precision nobody can pay).` },
        { t: `$${fh(roundFrac(A, k, 0))}: whole dollars are close enough`, ok: false, say: `Money is paid to the cent: $${A} ÷ ${k} = $${decHtml(expand(A, k))} ≈ $${fh(cents)}.` },
      ],
      solution: [`Exact: $${A} ÷ ${k} = $${decHtml(expand(A, k))}.`, `Money to the cent, rounded once: $${fh(cents)}.`],
      picture: { kind: 'bare', work: [`\\$${A} \\div ${k} = \\$${decTex(expand(A, k))}`, `\\approx \\$${fs(cents)}`] },
    });
  }
  if (v === 1) {
    const k = pick(R, [3, 6, 7]);
    let T = int(R, 61, 249); if (T % k === 0) T++;
    const L = fin(T, 1), piece = roundFrac(T, 10 * k, 1);
    return choiceItem(R, {
      id: `roundEnd-${n}`, family: 'roundEnd', prompt: `A board is measured as <b>${fs(L)} cm</b> (to the nearest 0.1 cm) and cut into ${k} equal pieces. How long is each piece, reported sensibly?`,
      board: `${fs(L)}\\ \\text{cm} \\div ${k}`,
      opts: [
        { t: `${fh(piece)} cm, to 0.1 cm like the measurement`, ok: true, say: `Yes: the length was only measured to 0.1 cm, so more places would claim precision we do not have.` },
        { t: `${fh(roundFrac(T, 10 * k, 4))} cm`, ok: false, mc: MC.measuredExact, say: `${fs(L)} cm is a measurement, good to 0.1 cm. Four places pretend it was exact: report ${fh(piece)} cm.` },
        { t: `${decHtml(expand(T, 10 * k))} cm exactly`, ok: false, mc: MC.measuredExact, say: `That would be exact only if the board were exactly ${fs(L)} cm. It was measured to 0.1 cm: report ${fh(piece)} cm.` },
      ],
      solution: [`${fs(L)} ÷ ${k} = ${decHtml(expand(T, 10 * k))}.`, `The measurement is good to 0.1 cm, so report ${fh(piece)} cm.`],
      picture: { kind: 'bare', work: [`${fs(L)} \\div ${k} = ${decTex(expand(T, 10 * k))}`, `\\approx ${fs(piece)}\\ \\text{cm}`] },
    });
  }
  const [p, q] = pick(R, [[2, 3], [1, 3], [5, 6], [1, 6]] as [number, number][]);
  const m = q * int(R, 1, 3) / gcd(p, q), tot = p * m / q, r2 = roundFrac(p, q, 2), r1 = roundFrac(p, q, 1);
  const unit = pick(R, ['cup', 'yard', 'pound']);
  return choiceItem(R, {
    id: `roundEnd-${n}`, family: 'roundEnd', prompt: `A recipe uses exactly <b>${fr(p, q)} ${unit}</b> per batch. How much for <b>${m} batches</b>?`,
    board: `${m} \\times ${FT(p, q)}`,
    opts: [
      { t: `Keep ${fr(p, q)} exact: ${m} × ${fr(p, q)} = ${tot} ${unit}${tot === 1 ? '' : 's'}`, ok: true, say: `Yes: the amount is exact, so keep the fraction and round only if the answer needs it.` },
      { t: `Round first: ${m} × ${fh(r2)} = ${fh(fin(r2.N * m, 2))} ${unit}s`, ok: false, mc: MC.roundedExact, say: `${fh(r2)} is not ${fr(p, q)}: the error grows ${m} times. Exactly: ${tot}.` },
      { t: `Round to tenths first: ${m} × ${fh(r1)} = ${fh(fin(r1.N * m, 1))} ${unit}s`, ok: false, mc: MC.intermediate, say: `Rounding in the middle is what goes wrong here. Keep ${fr(p, q)} exact: ${m} × ${fr(p, q)} = ${tot}.` },
    ],
    solution: [`${m} × ${fr(p, q)} = ${fr(p * m, q)} = ${tot}.`, 'Exact values stay exact; round only at the end, if at all.'],
    picture: { kind: 'bare', work: [`${m} \\times ${FT(p, q)} = ${tot}`] },
  });
};

// ===================== 23. negative forms =====================
const SIGNED: [number, number][] = [[8, 5], [3, 8], [5, 4], [1, 16], [5, 8], [7, 4], [13, 8], [6, 5], [1, 40], [9, 8], [11, 4], [1, 8]];
const signed: Gen = (R, n) => {
  const [p, q] = pick(R, SIGNED), f = fracFin(p, q)!, pf = fracFin(100 * p, q)!, [w, a, b] = mixedOf(p, q);
  const neg = (x: Fin): Fin => ({ N: -x.N, k: x.k });
  const ctx = pick(R, ['', 'The temperature changed by ', 'A stock price changed by ', 'The elevation changed by ']);
  const toPct = R() < 0.5;
  const shown = w > 0 ? `−${mixH(p, q)}` : `−${fr(p, q)}`;
  const target = toPct ? neg(pf) : neg(f);
  const wrongs: NWrong[] = [{ f: toPct ? pf : f, mc: MC.ignoresMinus, say: `The minus sign stays with the value through every form: ${shown} = ${fh(neg(f))} = ${fh(neg(pf))}%.` }];
  if (w > 0 && a > 0) {
    const split = fracFin(-(w * b) + a, b)!;   // -1 + 3/5 = -0.4
    wrongs.push({ f: toPct ? fin(split.N * 100, split.k) : split, mc: MC.splitMixed, say: `${shown} means −(${w} + ${fr(a, b)}), the whole thing is negative: ${fh(neg(f))}, not −${w} + ${fh(fracFin(a, b)!)}.` });
  }
  if (toPct) wrongs.push({ f: neg(f), mc: MC.appendPct, say: `As a percent, × 100: ${fh(neg(pf))}%.` });
  return numItem({
    id: `signed-${n}`, family: 'signed', unit: toPct ? '%' : undefined,
    prompt: `${ctx ? `${ctx}<b>${shown}</b>${ctx.includes('temperature') ? ' °F' : ctx.includes('elevation') ? ' miles' : ctx.includes('stock') ? ' of its value' : ''}. Write it` : `Write <b>${shown}</b>`} as a ${toPct ? 'percent' : 'decimal'}. ${NOCALC}`,
    board: `-${w > 0 ? mixT(p, q) : FT(p, q)} = \\ ?${toPct ? '\\,\\%' : ''}`, f: target, wrongs,
    right: `Yes: ${shown} = ${fh(neg(f))} = ${fh(neg(pf))}%. The sign stays with the whole value.`,
    hint: `Convert ${w > 0 ? mixH(p, q) : fr(p, q)} as if it were positive, then put the minus sign in front of the whole result.`,
    solution: [`${w > 0 ? mixH(p, q) : fr(p, q)} = ${fh(f)} = ${fh(pf)}%.`, `So ${shown} = ${fh(neg(f))} = ${fh(neg(pf))}%.`],
    picture: { kind: 'bare', work: [`-${w > 0 ? mixT(p, q) : FT(p, q)} = ${finStr(neg(f))}`, `= ${finStr(neg(pf))}\\%`] },
  });
};
const signedCompare: Gen = (R, n) => {
  const t = int(R, 0, 3);
  let A: { h: string; t: string; v: [number, number] }, B: { h: string; t: string; v: [number, number] };
  if (t === 0 || t === 1) {
    const [p, q] = pick(R, [[1, 3], [2, 3], [1, 6], [5, 6], [4, 9]] as [number, number][]), e = expand(p, q), k = int(R, 2, 3);
    const f = t === 0 ? roundFrac(p, q, k, 'trunc') : roundFrac(p, q, k);
    A = { h: `−${fh(f)}`, t: `-${fs(f)}`, v: [-f.N, 10 ** f.k] };
    B = { h: `−${decHtml(e)}`, t: `-${decTex(e)}`, v: [-p, q] };
  } else {
    const N = int(R, 101, 999); if (N % 10 === 0) return signedCompare(R, n);
    const f1 = fin(N, 3), f2 = fin(Math.floor(N / 10), 2);
    A = { h: `−${fh(f1)}`, t: `-${fs(f1)}`, v: [-f1.N, 1000] };
    B = { h: `−${fh(f2)}`, t: `-${fs(f2)}`, v: [-f2.N, 100] };
  }
  const cmp = A.v[0] * B.v[1] - B.v[0] * A.v[1];
  const big = cmp > 0 ? A : B, small = cmp > 0 ? B : A;
  const [x, y] = R() < 0.5 ? [A, B] : [B, A];
  const ctx = pick(R, ['', 'Two temperature changes (°F): ', 'Two changes in a lake level (ft): ']);
  return choiceItem(R, {
    id: `signedCompare-${n}`, family: 'signedCompare', prompt: `${ctx}Which is greater: <b>${x.h}</b> or <b>${y.h}</b>?`,
    board: `${x.t}\\quad\\text{or}\\quad ${y.t}`,
    opts: [
      { t: `${big.h} is greater`, ok: true, say: `Yes: ${big.h} is closer to 0, so it is greater (further right on the number line).` },
      { t: `${small.h} is greater`, ok: false, mc: MC.byMagnitude, say: `${small.h.slice(1)} is the bigger size, but with a minus sign that is further below 0. ${big.h} is greater.` },
      { t: 'They are equal', ok: false, mc: t === 0 ? MC.truncFull : t === 1 ? MC.roundedExact : undefined, say: `They differ: ${t <= 1 ? 'one stops, the other repeats forever' : 'compare place by place'}. ${big.h} is greater.` },
    ],
    solution: [`Without signs: ${small.h.slice(1)} > ${big.h.slice(1)}.`, `With minus signs the order flips: ${big.h} > ${small.h}.`],
    picture: { kind: 'bare', work: [`${big.t} > ${small.t}`] },
  });
};

export const GENS: Record<string, Gen> = {
  placeValue, compareDec, terminates, barForm, approx, ladderStep, divide, digitTrap, classify, decToFrac, decPct, pctToFrac,
  beyondOne, repPct, mixedPct, recall, remainders, twoFive, roundFinal, calcDisplay, roundingError, roundEnd, signed, signedCompare,
};
export { REP, TERM, TRAPS };
