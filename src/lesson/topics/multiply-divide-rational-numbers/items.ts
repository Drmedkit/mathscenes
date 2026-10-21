// items.ts: practice families for "multiply and divide rational numbers" (grade 7, 7.NS.A.2-3, 7.EE.B.3). Each family
// is one deep structure; a generator receives the sub-goal id and uses that sub-goal's number ranges (topic JSON
// `cases`). Every wrong answer the classifier recognises carries its misconception id (math-curriculum-essentials).
// Pure: no DOM, no canvas. PROBES records, per item, typical wrong responses and the id they must get (tests).
import type { Q } from '../../../core/math';
import { type Gen, type Item, type Response, type Verdict, A, B, S, fr, int, pick, shuffle } from '../../runtime/item';
import { type Form, q, dq, qAdd, qMul, qDiv, qNeg, qAbs, qSub, qSame, qPow, sgn, val, hq, hp, tq, tp, isDec, expand, readQ, respond } from './rq';
import { jumpsFit } from './TimeJumps';
import { type CounterGroup, matFits } from './Counters';

export type FamilyId = 'distribute' | 'jumps' | 'oneNeg' | 'pattern' | 'missing' | 'zero' | 'counters' | 'signPlace' | 'meaning'
  | 'intMul' | 'signOnly' | 'intDiv' | 'ratMul' | 'ratDiv' | 'decimal' | 'sets' | 'compound' | 'powers' | 'strategy' | 'checkQ'
  | 'argument' | 'evidence' | 'story1' | 'storyMulti' | 'estimate';
export const FAMILY_NAMES: Record<FamilyId, string> = {
  distribute: 'Spread the multiplication',
  jumps: 'Steady change over time',
  oneNeg: 'One negative factor',
  pattern: 'Negative times negative',
  missing: 'The missing factor',
  zero: 'Zero in × and ÷',
  counters: 'Two-color counters',
  signPlace: 'Where the minus sign goes',
  meaning: 'What the numbers mean',
  intMul: 'Multiply integers',
  signOnly: 'Positive, negative or 0?',
  intDiv: 'Divide integers',
  ratMul: 'Multiply fractions and decimals',
  ratDiv: 'Divide fractions and decimals',
  decimal: 'Fraction to decimal',
  sets: 'Which set of numbers?',
  compound: 'Two or three operations',
  powers: 'Powers, brackets, absolute value',
  strategy: 'Smart ways to calculate',
  checkQ: 'Check a quotient',
  argument: 'Why negative × negative is positive',
  evidence: 'Example, counterexample or proof?',
  story1: 'One-step word problem',
  storyMulti: 'Multi-step word problem',
  estimate: 'Is the answer reasonable?',
};

/** pictures the page knows how to draw */
export interface JumpPicture { kind: 'jumps'; rate: [number, number]; t0: number; t1: number; start: [number, number]; ask: number; look: 'sea' | 'thermo' | 'plain'; unit: string; step: string; caption: string; signed: boolean }
export interface MatPicture { kind: 'counters'; groups: CounterGroup[]; caption: string }
export type Picture = JumpPicture | MatPicture;

/** wrong responses with the misconception they must be classified as (tests) */
export const PROBES = new WeakMap<Item, { r: Response; mc: string }[]>();
const M = '&minus;';
const MC = {
  partial: 'mc.properties.partial-distribution',
  addRules: 'mc.integers.addition-rules-in-multiplication',
  order: 'mc.integers.factor-order-changes-sign',
  bigger: 'mc.mul-div.multiplication-makes-bigger',
  twoNegAdd: 'mc.integers.two-negatives-positive-in-addition',
  arbitrary: 'mc.integers.neg-times-neg-arbitrary',
  anyNeg: 'mc.integers.any-negative-makes-negative',
  smaller: 'mc.mul-div.division-makes-smaller',
  zeroForces: 'mc.mul-div.zero-anywhere-forces-zero',
  divZero: 'mc.mul-div.division-by-zero-produces-number',
  timesZero: 'mc.mul-div.times-zero-unchanged',
  noSeed: 'mc.integers.removes-counter-groups-without-seeding-zero-pairs',
  negMult: 'mc.integers.counter-model-negative-multiplier',
  placement: 'mc.integers.negative-fraction-sign-placement',
  convention: 'mc.integers.inconsistent-sign-convention',
  meaning: 'mc.integers.sign-meaning-in-context',
  zeroParity: 'mc.integers.zero-product-classified-by-sign-parity',
  manyFactors: 'mc.integers.many-factors-sign-misjudged',
  dropSign: 'mc.integers.drops-sign-of-computed-result',
  recipFlip: 'mc.trig-functions.reciprocal-flips-sign',
  invertWrong: 'mc.fraction-ops.inverts-wrong-fraction',
  stopsEarly: 'mc.decimals.stops-before-repeat-appears',
  roundedExact: 'mc.estimation.rounded-value-treated-as-exact',
  negNotRational: 'mc.exponents-roots.negatives-not-rational',
  fracNotInt: 'mc.fractions-concept.fractions-equal-to-whole-numbers',
  zeroExcluded: 'mc.exponents-roots.zero-excluded-from-whole-or-integer-sets',
  oneSign: 'mc.integers.one-sign-for-whole-expression',
  pemdas: 'mc.properties.pemdas-letters-as-ranks',
  powSign: 'mc.exponents-roots.powers-only-negative-sign',
  negPow: 'mc.exponents-roots.confuses-negative-power-notation',
  absParts: 'mc.integers.abs-applied-to-parts',
  regroupDiv: 'mc.properties.regroups-subtraction-or-division',
  magOnly: 'mc.integers.verifies-result-by-magnitude-only',
  checkDividend: 'mc.mul-div.checks-quotient-with-dividend',
  simData: 'mc.statistics.simulation-output-as-data',
  examples: 'mc.reasoning-language.examples-as-proof',
  unsigned: 'mc.integers.records-negative-quantity-unsigned',
  noSizeCheck: 'mc.estimation.accepts-result-without-size-check',
  coarse: 'mc.estimation.coarse-estimate-overtrusted',
} as const;

// ---------- item builders ----------
interface Base { id: string; family: FamilyId; prompt: string; board: string; unit?: string; picture?: Picture; solution: string[] }
interface Wrong { v: Q | null; mc?: string; say: string }
/** a typed answer (number box or fraction boxes): any equal value is right */
function typed(o: Base, input: 'num' | 'frac', right: Q, okSay: string, wrongs: Wrong[], other: string): Item {
  const ws: { v: Q; mc?: string; say: string }[] = [];
  for (const w of wrongs) if (w.v && !qSame(w.v, right) && !ws.some(x => qSame(x.v, w.v!)) && (input === 'frac' || isDec(w.v, 6))) ws.push({ v: w.v, mc: w.mc, say: w.say });
  const it: Item = {
    ...o, picture: o.picture as unknown as Record<string, unknown> | undefined, input, answer: respond(right, input),
    check(r: Response): Verdict {
      const v = readQ(r);
      if (!v) return { ok: false, say: input === 'num' ? 'Type a number. Use - for a negative number.' : 'Fill in the top and the bottom box. A minus sign can go in any box.' };
      if (qSame(v, right)) return { ok: true, say: okSay };
      const w = ws.find(x => qSame(x.v, v));
      if (w) return { ok: false, mc: w.mc, say: w.say };
      return { ok: false, say: other };
    },
  };
  PROBES.set(it, ws.filter(w => w.mc).map(w => ({ r: respond(w.v, input), mc: w.mc! })));
  return it;
}
interface Opt { t: string; ok?: boolean; say: string; mc?: string }
/** a choice item; `keep` keeps the options in their given order (positive / negative / 0) */
function choose(o: Base, R: () => number, opts: Opt[], keep = false): Item {
  const os = keep ? opts.slice() : shuffle(R, opts.slice());
  const right = os.findIndex(x => x.ok);
  return {
    ...o, picture: o.picture as unknown as Record<string, unknown> | undefined, input: 'choice', choices: os.map(x => x.t), answer: { kind: 'choice', i: right },
    check(r: Response): Verdict {
      if (r.kind !== 'choice' || !os[r.i]) return { ok: false, say: 'Pick one answer.' };
      const x = os[r.i]!;
      return { ok: r.i === right, mc: r.i === right ? undefined : x.mc, say: x.say };
    },
  };
}
const sign = (R: () => number) => (R() < 0.5 ? -1 : 1);
const neg = (x: number) => (x < 0 ? `(${M}${-x})` : String(x));    // an integer after an operator, HTML
const ni = (x: number) => (x < 0 ? `${M}${-x}` : String(x));        // an integer, HTML
const tn = (x: number) => (x < 0 ? `(${x})` : String(x));            // an integer after an operator, TeX
/** a sign-flipped answer: both factors negative → "a negative makes it negative"; one negative → the sign was dropped */
const flipMc = (right: Q, bothNeg: boolean) => (sgn(right) > 0 && bothNeg ? MC.anyNeg : sgn(right) < 0 ? MC.dropSign : undefined);
const UNIT_SAY = (unit: string) => (unit === '$' ? 'dollars' : unit);
const NICE: readonly [number, number][] = [[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [2, 5], [3, 5], [4, 5], [1, 6], [5, 6], [3, 8], [5, 8], [2, 7], [4, 9], [5, 4], [3, 2], [7, 4], [5, 3], [9, 8]];
const niceQ = (R: () => number, proper = false): Q => { for (;;) { const [a, b] = pick(R, NICE); if (!proper || a < b) return q(a, b); } };

// =====================================================================================================
// 1. the distributive property as an equation chain [numerical-distribution]
const distribute: Gen = (R, n) => {
  const mode = pick(R, ['expand', 'expand', 'compress', 'half', 'zero', 'zero0'] as const);
  const base = (prompt: string, board: string, solution: string[]): Base => ({ id: `di-${n}`, family: 'distribute', prompt, board, solution });
  if (mode === 'expand') {
    const a = int(R, 2, 9), b = pick(R, [10, 20, 30, 5, 100]), c = int(R, 1, 9);
    return typed(base(`Finish the chain: ${A(`${a} × (${b} + ${c})`)} = ${a} × ${b} + ▢`, `${a} \\times (${b} + ${c}) = ${a} \\times ${b} + \\square`,
      [`The ${a} multiplies EACH part of the sum: ${a} × (${b} + ${c}) = ${a} × ${b} + ${a} × ${c}.`, `So the box is ${a} × ${c} = ${S(String(a * c))}.`]),
    'num', q(a * c), `Yes: ${a} × ${c} = ${a * c}. Both parts get multiplied.`, [
      { v: q(c), mc: MC.partial, say: `The ${a} multiplies BOTH parts, the ${c} too: ${a} × ${c} = ${a * c}.` },
      { v: q(a + c), say: `The box is a product: ${a} × ${c} = ${a * c}.` },
    ], `The ${a} multiplies each part: the box is ${a} × ${c}.`);
  }
  if (mode === 'compress') {
    const a = int(R, 3, 9), b = int(R, 6, 9), s = 5, r = b - s;
    return typed(base(`${A(`${a} × ${b}`)} = ${a} × (${s} + ${r}) = ${a} × ${s} + ▢. What goes in the box?`, `${a} \\times ${b} = ${a} \\times ${s} + \\square`,
      [`${b} = ${s} + ${r}, so ${a} × ${b} = ${a} × (${s} + ${r}) = ${a} × ${s} + ${a} × ${r}.`, `The box is ${a} × ${r} = ${S(String(a * r))}. Check: ${a * s} + ${a * r} = ${a * b}.`]),
    'num', q(a * r), `Yes: ${a * s} + ${a * r} = ${a * b} = ${a} × ${b}.`, [
      { v: q(r), mc: MC.partial, say: `${a} × ${s} + ${r} is only ${a * s + r}, not ${a * b}: the ${a} multiplies the ${r} too. The box is ${a * r}.` },
    ], `Split ${b} into ${s} + ${r}; the ${a} multiplies both parts. The box is ${a} × ${r}.`);
  }
  if (mode === 'half') {
    const k = pick(R, [2, 3, 4]), x = k * int(R, 1, 6);
    let y = k * int(R, 1, 6); if (y === x) y += k;
    const right = q(x + y, k);
    return typed(base(`Work it out with the distributive property: ${A(`${fr(1, k)}(${x} + ${y})`)} = ?`, `\\tfrac{1}{${k}}(${x} + ${y}) = \\,?`,
      [`${fr(1, k)}(${x} + ${y}) = ${fr(1, k)} × ${x} + ${fr(1, k)} × ${y} = ${x / k} + ${y / k}.`, `= ${S(hq(right))}. (Or add first: ${fr(1, k)} × ${x + y} = ${hq(right)}.)`]),
    'num', right, `Yes: ${x / k} + ${y / k} = ${hq(right)}.`, [
      { v: q(x / k + y), mc: MC.partial, say: `${fr(1, k)} multiplies BOTH ${x} and ${y}: ${x / k} + ${y / k} = ${hq(right)}.` },
      { v: q(x + y), say: `Don't forget the ${fr(1, k)}: ${fr(1, k)} of ${x + y} is ${hq(right)}.` },
    ], `Multiply each part by ${fr(1, k)}, then add.`);
  }
  if (mode === 'zero') {
    const a = int(R, 2, 9), b = int(R, 2, 9);
    return typed(base(`${A(`${a} × (${b} + 0)`)} = ${a} × ${b} + ${a} × 0 = ?`, `${a} \\times (${b} + 0) = \\,?`,
      [`${a} × ${b} + ${a} × 0 = ${a * b} + 0.`, `= ${S(String(a * b))}. The 0 is added, so it changes nothing.`]),
    'num', q(a * b), `Yes: ${a * b} + 0 = ${a * b}.`, [
      { v: q(0), mc: MC.zeroForces, say: `A 0 inside a SUM does not make it 0: ${b} + 0 = ${b}, and ${a} × ${b} = ${a * b}.` },
    ], `${a} × ${b} + ${a} × 0 = ${a * b} + 0.`);
  }
  const b = int(R, 2, 9), c = int(R, 2, 9);
  return typed(base(`${A(`0 × (${b} + ${c})`)} = 0 × ${b} + 0 × ${c} = ?`, `0 \\times (${b} + ${c}) = \\,?`,
    [`0 × ${b} = 0 and 0 × ${c} = 0.`, `So 0 + 0 = ${S('0')}. Zero groups of anything is 0.`]),
  'num', q(0), 'Yes: zero times anything is 0.', [
    { v: q(b + c), mc: MC.timesZero, say: `Times 0 is not "leave it": 0 groups of ${b + c} is 0.` },
  ], 'Zero groups of anything is 0.');
};

// =====================================================================================================
// 2. a steady rate over time, with the picture [product-one-negative, apply-one-step-mul-div]
interface RateSkin {
  look: 'sea' | 'thermo' | 'plain'; unit: string; step: string; steps: string; caption: string; signed: boolean; start: (R: () => number) => Q;
  lead(r: Q): string; ask(t: number): string; up: string; down: string;
}
const money = (x: Q) => (x.q === 1 ? `$${Math.abs(x.p)}` : `$${Math.abs(val(x)).toFixed(2)}`);
const SKINS: RateSkin[] = [
  { look: 'sea', unit: 'ft', step: 'min', steps: 'minutes', caption: 'height compared with now, ft', signed: true, start: () => q(0), up: 'up', down: 'down',
    lead: r => `A diver swims ${sgn(r) < 0 ? 'down' : 'up'} ${A(`${hq(qAbs(r), 'dec')} ft every minute`)}.`,
    ask: t => (t > 0 ? `Compared with now, where will she be ${B(`${t} minutes from now`)}?` : `Compared with now, where was she ${B(`${-t} minutes ago`)}?`) },
  { look: 'sea', unit: 'ft', step: 's', steps: 'seconds', caption: 'height compared with now, ft', signed: true, start: () => q(0), up: 'up', down: 'down',
    lead: r => `An underwater drone ${sgn(r) < 0 ? 'sinks' : 'rises'} ${A(`${hq(qAbs(r), 'dec')} ft each second`)}.`,
    ask: t => (t > 0 ? `Compared with now, where will it be ${B(`${t} seconds from now`)}?` : `Compared with now, where was it ${B(`${-t} seconds ago`)}?`) },
  { look: 'thermo', unit: '°F', step: 'h', steps: 'hours', caption: 'temperature, °F', signed: false, start: R => q(int(R, 18, 44)), up: 'warmer', down: 'colder',
    lead: r => `The temperature ${sgn(r) < 0 ? 'falls' : 'rises'} ${A(`${hq(qAbs(r), 'dec')} °F every hour`)}.`,
    ask: t => (t > 0 ? `How much warmer (+) or colder (${M}) than now will it be ${B(`${t} hours from now`)}?` : `How much warmer (+) or colder (${M}) than now was it ${B(`${-t} hours ago`)}?`) },
  { look: 'plain', unit: 'in.', step: 'h', steps: 'hours', caption: 'water level compared with now, in.', signed: true, start: () => q(0), up: 'higher', down: 'lower',
    lead: r => `The water in a tank ${sgn(r) < 0 ? 'drops' : 'rises'} ${A(`${hq(qAbs(r), 'dec')} in. every hour`)}.`,
    ask: t => (t > 0 ? `Compared with now, how much higher (+) or lower (${M}) will it be ${B(`${t} hours from now`)}?` : `Compared with now, how much higher (+) or lower (${M}) was it ${B(`${-t} hours ago`)}?`) },
  { look: 'plain', unit: '$', step: 'wk', steps: 'weeks', caption: 'savings compared with now, $', signed: true, start: () => q(0), up: 'more', down: 'less',
    lead: r => (sgn(r) < 0 ? `Mia spends ${A(`${money(r)} of her savings every week`)}.` : `Mia adds ${A(`${money(r)} to her savings every week`)}.`),
    ask: t => (t > 0 ? `Compared with now, how much more (+) or less (${M}) will she have ${B(`${t} weeks from now`)}?` : `Compared with now, how much more (+) or less (${M}) did she have ${B(`${-t} weeks ago`)}?`) },
];
const rateMag = (R: () => number, unit: string): Q => (unit === '$' ? pick(R, [q(2), q(3), q(4), q(5), dq(1.5), dq(2.5), dq(3.5), dq(1.25), dq(2.75)]) : R() < 0.5 ? q(int(R, 1, 6)) : pick(R, [dq(0.5), dq(1.5), dq(2.5), dq(3.5)]));
const jumps: Gen = (R, n, sg) => {
  for (;;) {
    const sk = pick(R, SKINS);
    const mag = rateMag(R, sk.unit), t = int(R, 2, 6);
    const kind = sg === 'apply-one-step-mul-div' ? pick(R, ['later', 'earlier', 'both', 'both'] as const) : pick(R, ['later', 'earlier'] as const);
    // later: a negative rate, t > 0; earlier: a positive rate, t < 0; both: a negative rate, t < 0
    const rate = kind === 'earlier' ? mag : qNeg(mag), ask = kind === 'later' ? t : -t;
    const t0 = ask < 0 ? ask : -1, t1 = ask > 0 ? ask : 1;
    if (!jumpsFit({ rate, t0, t1, ask })) continue;
    const right = qMul(q(ask), rate), start = sk.start(R);
    const pic: JumpPicture = { kind: 'jumps', rate: [rate.p, rate.q], t0, t1, start: [start.p, start.q], ask, look: sk.look, unit: sk.unit, step: sk.step, caption: sk.caption, signed: sk.signed };
    const lead = sk.look === 'thermo' ? `${sk.lead(rate)} It is ${A(`${start.p} °F now`)}.` : sk.lead(rate);
    const sign = sk.look === 'thermo' ? '' : ` (+ is ${sk.up}, ${M} is ${sk.down})`;
    const unit = UNIT_SAY(sk.unit);
    const amount = (x: Q) => (sk.unit === '$' ? money(x) : `${hq(qAbs(x), 'dec')} ${sk.unit}`);
    const solution = [
      `The rate is ${hq(rate, 'dec')} ${unit} per ${sk.step}; the time is ${ask > 0 ? `${B(ni(ask))} (from now on: positive)` : `${B(ni(ask))} (before now: negative)`}.`,
      ask > 0
        ? `${t} equal jumps of ${hq(rate, 'dec')} from now: ${t} × ${hp(rate, 'dec')} = ${S(hq(right, 'dec'))}.`
        : `The ${t} jumps of ${hq(rate, 'dec')} LED to now. So ${t} ${sk.steps} ago it was ${amount(right)} ${sgn(right) > 0 ? sk.up : sk.down} than now: ${hp(q(ask))} × ${hp(rate, 'dec')} = ${S(hq(right, 'dec'))}.`,
    ];
    const wrongs: Wrong[] = [
      { v: qNeg(right), mc: sgn(right) > 0 ? MC.anyNeg : sg === 'apply-one-step-mul-div' ? MC.meaning : MC.dropSign,
        say: sgn(right) > 0 ? `Look at the picture: the jumps went ${sgn(rate) < 0 ? sk.down : sk.up} TOWARD now, so back then it was ${sk.up === 'up' ? 'higher' : sk.up}. ${hp(q(ask))} × ${hp(rate, 'dec')} = +${hq(right, 'dec')}.`
          : `The size is right, the direction is not: it is ${sk.down} than now, so the answer is negative: ${hq(right, 'dec')}.` },
      { v: qAdd(q(ask), rate), mc: MC.addRules, say: `That adds the time and the rate. ${t} ${sk.steps} of ${hq(rate, 'dec')} each is a product: ${hp(q(ask))} × ${hp(rate, 'dec')}.` },
    ];
    return typed({ id: `ju-${n}`, family: 'jumps', prompt: `${lead} ${sk.ask(ask)}${sign}`, board: `${tn(ask)} \\times ${tp(rate, 'dec')} = \\,?`, unit, picture: pic, solution },
      'num', right, `Yes: ${hp(q(ask))} × ${hp(rate, 'dec')} = ${hq(right, 'dec')}: ${amount(right)} ${sgn(right) > 0 ? sk.up : sk.down}.`, wrongs,
      `Count the jumps from now to ${ask > 0 ? `${t} ${sk.steps} from now` : `${t} ${sk.steps} ago`}: ${hp(q(ask))} × ${hp(rate, 'dec')}.`);
  }
};

// =====================================================================================================
// 3. products with exactly one negative factor [product-one-negative]
const oneNeg: Gen = (R, n) => {
  const mode = pick(R, ['int', 'int', 'frac', 'order', 'size'] as const);
  const base = (prompt: string, board: string, solution: string[]): Base => ({ id: `on-${n}`, family: 'oneNeg', prompt, board, solution });
  if (mode === 'int' || mode === 'frac') {
    const a = mode === 'int' ? q(int(R, 2, 9)) : niceQ(R), b = mode === 'int' ? q(int(R, 2, 9)) : niceQ(R);
    const negFirst = R() < 0.5;
    const x = negFirst ? qNeg(a) : a, y = negFirst ? b : qNeg(b), right = qMul(x, y);
    return typed(base(`${A(`${hp(x)} × ${hp(y)}`)} = ?`, `${tp(x)} \\times ${tp(y)} = \\,?`,
      [`One factor is negative, so the product is negative.`, `Size: ${hq(qAbs(x))} × ${hq(qAbs(y))} = ${hq(qAbs(right))}. So ${hp(x)} × ${hp(y)} = ${S(hq(right))}.`]),
    mode === 'int' ? 'num' : 'frac', right, `Yes: one negative factor, so ${hq(right)}.`, [
      { v: qAbs(right), mc: MC.dropSign, say: `The size is right, but exactly one factor is negative: the product is negative, ${hq(right)}.` },
      { v: qAdd(x, y), mc: MC.addRules, say: `That adds the two numbers. Multiply them: the size is ${hq(qAbs(right))}, and one negative factor makes it ${hq(right)}.` },
    ], `Multiply the sizes, then one negative factor makes the product negative.`);
  }
  if (mode === 'order') {
    const a = int(R, 2, 9), b = int(R, 2, 9), who = pick(R, ['Kai', 'Nia', 'Omar', 'Lucia', 'Ben']);
    return choose(base(`${who} says: “${a} × (${M}${b}) = ${M}${a * b}, but (${M}${b}) × ${a} = ${a * b}, because the first number decides the sign.” Is ${who} right?`, `${a} \\times (-${b}) \\quad (-${b}) \\times ${a}`,
      [`${a} × (${M}${b}) is ${a} groups of ${M}${b}: ${M}${a * b}.`, `Switching the factors never changes a product: (${M}${b}) × ${a} = ${M}${a * b} too.`]), R, [
      { t: `No: both are ${M}${a * b}. The order of the factors does not change the product.`, ok: true, say: `Right: ${a} × (${M}${b}) = (${M}${b}) × ${a} = ${M}${a * b}.` },
      { t: `Yes: the first factor decides the sign.`, mc: MC.order, say: `Order never changes a product: ${a} groups of ${M}${b} and ${b} groups of ${M}${a}... both are ${M}${a * b}.` },
      { t: `No: both are ${a * b}.`, mc: MC.dropSign, say: `Exactly one factor is negative, so both products are negative: ${M}${a * b}.` },
    ]);
  }
  // size: a fraction factor below or above 1 times a negative
  for (;;) {
    const f = niceQ(R), x = qNeg(niceQ(R, true));
    if (qSame(f, q(1))) continue;
    const prod = qMul(f, x), less = val(f) < 1;
    return choose(base(`Without computing exactly: is ${A(`${hp(f)} × ${hp(x)}`)} closer to 0 than ${hq(x)}, or farther from 0?`, `${tp(f)} \\times ${tp(x)}`,
      [`Multiplying by ${hq(f)} scales the size of ${hq(x)} by ${hq(f)}: ${less ? 'less than 1 shrinks it' : 'more than 1 stretches it'}.`, `${hp(f)} × ${hp(x)} = ${hq(prod)}, ${less ? 'closer to' : 'farther from'} 0 than ${hq(x)}.`]), R, [
      { t: `Closer to 0`, ok: less, say: less ? `Yes: ${hq(f)} is less than 1, so it shrinks the size: ${hq(prod)}.` : `${hq(f)} is more than 1, so it stretches the size: ${hq(prod)} is farther from 0.` },
      { t: `Farther from 0`, ok: !less, mc: less ? MC.bigger : undefined, say: less ? `Multiplying does not always make bigger: ${hq(f)} is less than 1, so the size shrinks to ${hq(qAbs(prod))}.` : `Yes: ${hq(f)} is more than 1, so the size grows: ${hq(prod)}.` },
      { t: `The same distance from 0`, say: `Only × 1 keeps the size. ${hp(f)} × ${hp(x)} = ${hq(prod)}.` },
    ], true);
  }
};

// =====================================================================================================
// 4. negative × negative from the distributive property [neg-times-neg-distributive]
const pattern: Gen = (R, n) => {
  const mode = pick(R, ['table', 'chain', 'chain', 'half', 'why'] as const);
  const base = (prompt: string, board: string, solution: string[]): Base => ({ id: `pa-${n}`, family: 'pattern', prompt, board, solution });
  const a = int(R, 2, 9);
  if (mode === 'table') {
    const k = pick(R, [-1, -2, -3]);
    const rows = [2, 1, 0].map(x => `(${M}${a}) × ${x} = ${ni(-a * x)}`).join(', ');
    return typed(base(`Keep the pattern going: ${rows}, … What is ${A(`(${M}${a}) × ${neg(k)}`)}?`, `(-${a})\\times 1 = -${a},\\ (-${a})\\times 0 = 0,\\ (-${a})\\times ${tn(k)} = \\,?`,
      [`Each time the second factor goes down by 1, the product goes UP by ${a}.`, `${M}${a}, 0, then ${a}, ${2 * a}, ${3 * a}, … So (${M}${a}) × ${neg(k)} = ${S(String(-a * k))}.`]),
    'num', q(-a * k), `Yes: the products climb by ${a} each step: ${-a * k}.`, [
      { v: q(a * k), mc: MC.anyNeg, say: `The pattern climbs by ${a} each step: ${M}${a}, 0, ${a}, … It does not stay negative: ${-a * k}.` },
    ], `Follow the pattern: each step adds ${a}.`);
  }
  if (mode === 'chain') {
    const b = int(R, 2, 9);
    return typed(base(`0 = (${M}${a}) × (${b} + (${M}${b})) = ${M}${a * b} + (${M}${a})(${M}${b}). So what must ${A(`(${M}${a})(${M}${b})`)} be?`, `0 = -${a * b} + (-${a})(-${b})`,
      [`${b} + (${M}${b}) = 0, so the whole thing is (${M}${a}) × 0 = 0.`, `${M}${a * b} + ▢ = 0 only when ▢ = ${a * b}. So (${M}${a})(${M}${b}) = ${S(String(a * b))}.`]),
    'num', q(a * b), `Yes: only ${a * b} brings ${M}${a * b} back to 0.`, [
      { v: q(-a * b), mc: MC.anyNeg, say: `${M}${a * b} + (${M}${a * b}) = ${M}${2 * a * b}, not 0. The missing part must be the opposite of ${M}${a * b}: ${a * b}.` },
      { v: q(-a - b), mc: MC.addRules, say: `That adds the factors. The chain needs ${M}${a * b} + ▢ = 0, so ▢ = ${a * b}.` },
    ], `${M}${a * b} + ▢ = 0: what is ▢?`);
  }
  if (mode === 'half') {
    const d = pick(R, [2, 3, 4, 5]), c = int(R, 1, 4);
    const right = q(c, d);
    return typed(base(`0 = (${M}${fr(1, d)})(${c} + (${M}${c})) = ${M}${fr(c, d)} + (${M}${fr(1, d)})(${M}${c}). So what is ${A(`(${M}${fr(1, d)})(${M}${c})`)}?`, `0 = ${tq(q(-c, d))} + (-\\tfrac{1}{${d}})(-${c})`,
      [`${c} + (${M}${c}) = 0, so the left side is 0.`, `${M}${fr(c, d)} + ▢ = 0 when ▢ = ${fr(c, d)}. So (${M}${fr(1, d)})(${M}${c}) = ${S(hq(right))}.`]),
    'frac', right, `Yes: ${hq(right)}, the opposite of ${M}${fr(c, d)}.`, [
      { v: qNeg(right), mc: MC.anyNeg, say: `${M}${fr(c, d)} + (${M}${fr(c, d)}) is not 0. The missing part is the opposite: ${fr(c, d)}.` },
    ], `${M}${fr(c, d)} + ▢ = 0.`);
  }
  const b = int(R, 2, 9);
  return choose(base(`Why is ${A(`(${M}${a}) × (${M}${b})`)} positive?`, `(-${a}) \\times (-${b}) = ${a * b}`,
    [`(${M}${a})(${b}) + (${M}${a})(${M}${b}) = (${M}${a})(${b} + (${M}${b})) = (${M}${a}) × 0 = 0.`, `So (${M}${a})(${M}${b}) is the opposite of ${M}${a * b}: ${a * b}.`]), R, [
    { t: `(${M}${a})(${b}) + (${M}${a})(${M}${b}) = (${M}${a}) × 0 = 0, so (${M}${a})(${M}${b}) is the opposite of ${M}${a * b}.`, ok: true, say: 'Yes: the distributive property forces it.' },
    { t: `Two negatives always make a positive, like (${M}${a}) + (${M}${b}).`, mc: MC.twoNegAdd, say: `(${M}${a}) + (${M}${b}) = ${M}${a + b}, negative. The reason is the distributive property, not a slogan.` },
    { t: `It is just a rule: negative times negative is positive.`, mc: MC.arbitrary, say: `It is not arbitrary: (${M}${a})(${b} + (${M}${b})) = 0 forces (${M}${a})(${M}${b}) to be ${a * b}.` },
  ]);
};

// =====================================================================================================
// 5. the sign of a quotient from the missing factor [quotient-sign-missing-factor]
const missing: Gen = (R, n) => {
  const mode = pick(R, ['int', 'int', 'frac', 'size'] as const);
  const base = (prompt: string, board: string, solution: string[]): Base => ({ id: `mi-${n}`, family: 'missing', prompt, board, solution });
  if (mode === 'size') {
    const d = qNeg(niceQ(R, true)), N = q(sign(R) * int(R, 2, 12));
    const res = qDiv(N, d);
    return choose(base(`Without computing exactly: is ${A(`${hq(N)} ÷ ${hp(d)}`)} farther from 0 than ${hq(N)}, or closer to 0?`, `${tq(N)} \\div ${tp(d)}`,
      [`${hp(d)} × ▢ = ${hq(N)}: the size of ${hq(d)} is less than 1, so ▢ must be BIGGER in size than ${hq(qAbs(N))}.`, `${hq(N)} ÷ ${hp(d)} = ${hq(res)}.`]), R, [
      { t: 'Farther from 0', ok: true, say: `Yes: dividing by a size less than 1 makes the size bigger: ${hq(res)}.` },
      { t: 'Closer to 0', mc: MC.smaller, say: `Division does not always make smaller. How many ${hq(qAbs(d))}s fit in ${hq(qAbs(N))}? More than ${hq(qAbs(N))}: the answer is ${hq(res)}.` },
      { t: 'The same distance from 0', say: `Only ÷ 1 or ÷ (${M}1) keeps the size. ${hq(N)} ÷ ${hp(d)} = ${hq(res)}.` },
    ], true);
  }
  const d = mode === 'int' ? q(sign(R) * int(R, 2, 9)) : q(sign(R)).p < 0 ? qNeg(niceQ(R, true)) : niceQ(R, true);
  const qt = mode === 'int' ? q(sign(R) * int(R, 2, 9)) : (R() < 0.5 ? qNeg(niceQ(R)) : niceQ(R));
  const N = qMul(d, qt);
  const both = sgn(N) < 0 && sgn(d) < 0;
  return typed(base(`${hp(d)} × ▢ = ${hq(N)}. So ${A(`${hq(N)} ÷ ${hp(d)}`)} = ?`, `${tp(d)} \\times \\square = ${tq(N)}`,
    [`Ask: what times ${hp(d)} gives ${hq(N)}?`, `${hp(d)} × ${hp(qt)} = ${hq(N)}, so ${hq(N)} ÷ ${hp(d)} = ${S(hq(qt))}.`, sgn(N) * sgn(d) > 0 ? 'Same signs: the quotient is positive.' : 'Different signs: the quotient is negative.']),
  mode === 'int' ? 'num' : 'frac', qt, `Yes: ${hp(d)} × ${hp(qt)} = ${hq(N)}.`, [
    { v: qNeg(qt), mc: both ? MC.anyNeg : sgn(qt) < 0 ? MC.dropSign : undefined, say: `Check it: ${hp(d)} × ${hp(qNeg(qt))} = ${hq(qNeg(N))}, not ${hq(N)}. The answer is ${hq(qt)}.` },
  ], `Find the factor: ${hp(d)} × ▢ = ${hq(N)}.`);
};

// =====================================================================================================
// 6. zero in products and quotients [zero-in-division]
const zero: Gen = (R, n) => {
  const mode = pick(R, ['times0', 'zeroDiv', 'divZero', 'divZero', 'zeroZero', 'sum0', 'sign0'] as const);
  const a = sign(R) * int(R, 2, 12);
  const base = (prompt: string, board: string, solution: string[]): Base => ({ id: `ze-${n}`, family: 'zero', prompt, board, solution });
  const UND = 'Undefined: no number works';
  if (mode === 'times0') {
    const first = R() < 0.5;
    const e = first ? `0 × ${neg(a)}` : `${ni(a)} × 0`;
    return choose(base(`What is ${A(e)}?`, first ? `0 \\times ${tn(a)}` : `${a} \\times 0`, [`Zero groups (or groups of 0) make 0.`, `${e} = ${S('0')}.`]), R, [
      { t: '0', ok: true, say: 'Yes: a zero factor makes the product 0.' },
      { t: ni(a), mc: MC.timesZero, say: `Times 0 does not leave ${ni(a)} unchanged: ${e} = 0.` },
      { t: UND, say: `Multiplying by 0 is fine: the product is 0.` },
    ]);
  }
  if (mode === 'zeroDiv') {
    return choose(base(`What is ${A(`0 ÷ ${neg(a)}`)}?`, `0 \\div ${tn(a)}`, [`${neg(a)} × ▢ = 0 has exactly one answer: ▢ = 0.`, `So 0 ÷ ${neg(a)} = ${S('0')}.`]), R, [
      { t: '0', ok: true, say: `Yes: ${neg(a)} × 0 = 0.` },
      { t: UND, say: `Dividing 0 is fine: ${neg(a)} × 0 = 0, so 0 ÷ ${neg(a)} = 0. Only dividing BY 0 is undefined.` },
      { t: ni(-a), say: `${neg(a)} × ${neg(-a)} is not 0. ${neg(a)} × 0 = 0, so the answer is 0.` },
    ]);
  }
  if (mode === 'divZero') {
    return choose(base(`What is ${A(`${ni(a)} ÷ 0`)}?`, `${a} \\div 0`, [`${ni(a)} ÷ 0 = ▢ would need 0 × ▢ = ${ni(a)}.`, `But 0 × anything is 0, never ${ni(a)}. So ${ni(a)} ÷ 0 is ${S('undefined')}.`]), R, [
      { t: UND, ok: true, say: `Yes: 0 × ▢ is always 0, never ${ni(a)}.` },
      { t: '0', mc: MC.zeroForces, say: `Check it: 0 × 0 = 0, not ${ni(a)}. No number works, so it is undefined.` },
      { t: ni(a), mc: MC.divZero, say: `Check it: 0 × ${neg(a)} = 0, not ${ni(a)}. Dividing by 0 gives no number.` },
    ]);
  }
  if (mode === 'zeroZero') {
    return choose(base(`What is ${A('0 ÷ 0')}?`, `0 \\div 0`, [`0 ÷ 0 = ▢ would need 0 × ▢ = 0.`, `EVERY number works, so there is no one answer: 0 ÷ 0 is ${S('undefined')}.`]), R, [
      { t: 'Undefined: every number works, so there is no one answer', ok: true, say: 'Yes: 0 × 5 = 0 and 0 × (−2) = 0 too. No single answer, so it is undefined.' },
      { t: '0', mc: MC.zeroForces, say: '0 × 0 = 0, but so does 0 × 7. A quotient must be one number, so 0 ÷ 0 is undefined.' },
      { t: '1', mc: MC.divZero, say: 'A number divided by itself is 1, but not 0: 0 × 1 = 0 and 0 × 9 = 0. It is undefined.' },
    ]);
  }
  if (mode === 'sum0') {
    const k = sign(R) * int(R, 2, 6), m = int(R, 2, 6), top = k * m;
    return choose(base(`What is ${A(`(${ni(top)} + 0) ÷ ${m}`)}?`, `(${top} + 0) \\div ${m}`, [`${ni(top)} + 0 = ${ni(top)}.`, `${ni(top)} ÷ ${m} = ${S(ni(k))}.`]), R, [
      { t: ni(k), ok: true, say: `Yes: adding 0 changes nothing, then ${ni(top)} ÷ ${m} = ${ni(k)}.` },
      { t: '0', mc: MC.zeroForces, say: `A 0 that is ADDED does not make the answer 0: ${ni(top)} + 0 = ${ni(top)}, and ${ni(top)} ÷ ${m} = ${ni(k)}.` },
      { t: UND, say: `Nothing is divided by 0 here. ${ni(top)} ÷ ${m} = ${ni(k)}.` },
    ]);
  }
  return choose(base(`Is ${A('0')} a positive number or a negative number? (from ${ni(a)} × 0 = 0)`, `${tn(a)} \\times 0 = 0`, [`Positive numbers are right of 0, negative numbers left of 0.`, `0 itself is ${S('neither')}.`]), R, [
    { t: 'Neither: 0 is not positive and not negative', ok: true, say: 'Yes: 0 is the dividing point, neither positive nor negative.' },
    { t: 'Positive', say: 'Positive numbers are greater than 0; 0 is not greater than itself. It is neither.' },
    { t: 'Negative', say: 'Negative numbers are less than 0. 0 is neither positive nor negative.' },
  ]);
};

// =====================================================================================================
// 7. two-color counters [concrete-mul-div-models]
const counters: Gen = (R, n) => {
  for (;;) {
    const a = int(R, 2, 4), b = int(R, 2, 4), ab = a * b;
    if (ab > 12) continue;
    const mode = pick(R, ['put', 'seed', 'left', 'left', 'share', 'groups'] as const);
    const base = (prompt: string, board: string, groups: CounterGroup[], caption: string, solution: string[]): Base => ({ id: `co-${n}`, family: 'counters', prompt, board, solution, picture: { kind: 'counters', groups, caption } });
    const g = (k: number, s: number, extra: Partial<CounterGroup> = {}): CounterGroup => ({ counters: Array.from({ length: k }, () => s), ...extra });
    const pairs = (k: number): CounterGroup => ({ counters: Array.from({ length: 2 * k }, (_, i) => (i % 2 ? -1 : 1)), frame: false });
    if (mode === 'put') {
      const groups = Array.from({ length: a }, () => g(b, -1));
      if (!matFits(groups)) continue;
      return typed(base(`To show ${A(`${a} × (${M}${b})`)}, put in ${B(`${a} groups`)} of ${b} negative counters. What is the value on the mat?`, `${a} \\times (-${b}) = \\,?`, groups, `${a} groups of ${M}${b}`,
        [`${a} groups of ${b} negative counters: ${ab} negative counters.`, `Each is ${M}1, so the mat shows ${S(`${M}${ab}`)}: ${a} × (${M}${b}) = ${M}${ab}.`]),
      'num', q(-ab), `Yes: ${ab} negative counters, ${M}${ab}.`, [
        { v: q(ab), mc: MC.dropSign, say: `The counters are negative: each one is ${M}1. The mat shows ${M}${ab}.` },
        { v: q(a - b), mc: MC.addRules, say: `That combines ${a} and ${M}${b} like a sum. Count the counters: ${ab} negatives, ${M}${ab}.` },
      ], `Count the negative counters: each is ${M}1.`);
    }
    if (mode === 'seed') {
      const negs = R() < 0.5;
      const groups: CounterGroup[] = [];
      const what = negs ? 'negative' : 'positive';
      return choose(base(`To show ${A(`(${M}${a}) × ${negs ? `(${M}${b})` : b}`)} you TAKE OUT ${B(`${a} groups`)} of ${b} ${what} counters. The mat starts empty (value 0). What do you do first?`, `(-${a}) \\times ${negs ? `(-${b})` : b}`, groups, 'an empty mat: value 0',
        [`There is nothing to take out yet, and the value must stay 0 until you remove.`, `So first put in ${ab} zero pairs (each + and ${M} together is 0). Then take out ${a} groups of ${b} ${what}s.`]), R, [
        { t: `Put in ${ab} zero pairs, then take out the groups`, ok: true, say: `Yes: zero pairs keep the value 0 and give you ${ab} ${what} counters to take out.` },
        { t: `Take out ${a} groups of ${b} ${what}s right away`, mc: MC.noSeed, say: `The mat is empty: there is nothing to take out. Put in ${ab} zero pairs first (the value stays 0).` },
        { t: `Put in ${a} groups of ${b} ${what}s`, mc: MC.negMult, say: `Putting IN groups is ${a} × ${negs ? `(${M}${b})` : b}. A negative first factor means taking OUT ${a} groups.` },
      ]);
    }
    if (mode === 'left') {
      const negs = R() < 0.5;
      const removed = Array.from({ length: a }, () => g(b, negs ? -1 : 1, { removed: true }));
      const groups = [...removed, { counters: Array.from({ length: ab }, () => (negs ? 1 : -1)), frame: false }];
      if (!matFits(groups)) continue;
      const right = q(negs ? ab : -ab);
      return typed(base(`The mat had ${ab} zero pairs. Then ${B(`${a} groups`)} of ${b} ${negs ? 'negative' : 'positive'} counters were taken out (faded). This shows ${A(`(${M}${a}) × ${negs ? `(${M}${b})` : b}`)}. What value is left on the mat?`, `(-${a}) \\times ${negs ? `(-${b})` : b} = \\,?`, groups, `${ab} zero pairs, ${a} groups taken out`,
        [`${ab} zero pairs are worth 0. Taking out ${ab} ${negs ? 'negatives' : 'positives'} leaves their partners: ${ab} ${negs ? 'positives' : 'negatives'}.`, `So (${M}${a}) × ${negs ? `(${M}${b})` : b} = ${S(hq(right))}.`]),
      'num', right, `Yes: ${ab} ${negs ? 'positive' : 'negative'} counters are left, ${hq(right)}.`, [
        { v: qNeg(right), mc: MC.negMult, say: `What is LEFT are the partners of the counters taken out: ${negs ? 'positives' : 'negatives'}. The value is ${hq(right)}.` },
      ], `Count what is left after the taking out.`);
    }
    const groups = Array.from({ length: a }, () => g(b, -1, { label: `${M}${b}` }));
    if (!matFits(groups)) continue;
    if (mode === 'share') {
      return typed(base(`${A(`${M}${ab}`)} is shared into ${B(`${a} equal groups`)}. What is in each group? So ${M}${ab} ÷ ${a} = ?`, `-${ab} \\div ${a} = \\,?`, groups.map(x => ({ ...x, label: undefined })), `${M}${ab} in ${a} equal groups`,
        [`${ab} negative counters in ${a} equal groups: ${b} in each.`, `Each group is worth ${M}${b}: ${M}${ab} ÷ ${a} = ${S(`${M}${b}`)}.`]),
      'num', q(-b), `Yes: each group holds ${b} negatives, ${M}${b}.`, [
        { v: q(b), mc: MC.dropSign, say: `The counters in each group are negative: ${M}${b}.` },
      ], `Count one group: its counters are negative.`);
    }
    return typed(base(`How many groups of ${B(`${M}${b}`)} make ${A(`${M}${ab}`)}? So ${M}${ab} ÷ (${M}${b}) = ?`, `-${ab} \\div (-${b}) = \\,?`, groups, `${M}${ab} in groups of ${M}${b}`,
      [`Count the groups of ${M}${b}: ${a}.`, `So ${M}${ab} ÷ (${M}${b}) = ${S(String(a))}, positive: (${M}${b}) × ${a} = ${M}${ab}.`]),
    'num', q(a), `Yes: ${a} groups of ${M}${b}.`, [
      { v: q(-a), mc: MC.anyNeg, say: `You can count the groups: there are ${a} of them, a positive number. Check: (${M}${b}) × ${a} = ${M}${ab}.` },
    ], `Count the groups.`);
  }
};

// =====================================================================================================
// 8. where the minus sign goes in a fraction [fraction-sign-placement]
const signPlace: Gen = (R, n) => {
  const mode = pick(R, ['odd', 'odd', 'sign', 'equal', 'zero'] as const);
  let p = int(R, 1, 9), d = int(R, 2, 9); if (p === d) d++;
  const base = (prompt: string, board: string, solution: string[]): Base => ({ id: `sp-${n}`, family: 'signPlace', prompt, board, solution });
  const f1 = `${M}${fr(p, d)}`, f2 = fr(`${M}${p}`, d), f3 = fr(p, `${M}${d}`), f4 = fr(`${M}${p}`, `${M}${d}`);
  if (mode === 'odd') {
    return choose(base(`Three of these are the same number. Which one is ${A('different')}?`, `-\\tfrac{${p}}{${d}} \\quad \\tfrac{-${p}}{${d}} \\quad \\tfrac{${p}}{-${d}} \\quad \\tfrac{-${p}}{-${d}}`,
      [`One minus sign anywhere: negative over positive or positive over negative is negative. All three are ${M}${fr(p, d)}.`, `Two minus signs: ${M}${p} ÷ (${M}${d}) is positive, ${S(fr(p, d))}.`]), R, [
      { t: f4, ok: true, say: `Yes: ${f4} is positive (same signs), the others are all ${M}${fr(p, d)}.` },
      { t: f1, mc: MC.placement, say: `Moving the minus sign does not change the number: ${f1} = ${f2} = ${f3}. The odd one is ${f4}, which is positive.` },
      { t: f2, mc: MC.placement, say: `${f2} is ${M}${p} ÷ ${d}, negative, the same as ${f1}. The odd one is ${f4}.` },
      { t: f3, mc: MC.placement, say: `${f3} is ${p} ÷ (${M}${d}), negative, the same as ${f1}. The odd one is ${f4}.` },
    ]);
  }
  if (mode === 'sign') {
    return choose(base(`Is ${A(f4)} positive or negative?`, `\\tfrac{-${p}}{-${d}}`, [`A fraction bar is a division: ${M}${p} ÷ (${M}${d}).`, `Same signs: positive. ${f4} = ${S(fr(p, d))}.`]), R, [
      { t: 'Positive', ok: true, say: `Yes: (${M}${d}) × ${fr(p, d)} = ${M}${p}, so it is ${fr(p, d)}.` },
      { t: 'Negative', mc: MC.anyNeg, say: `Negative divided by negative is positive: (${M}${d}) × ${fr(p, d)} = ${M}${p}. So ${f4} = ${fr(p, d)}.` },
      { t: 'Neither: it is not a number', say: `It is a number: ${M}${p} ÷ (${M}${d}) = ${fr(p, d)}.` },
    ], true);
  }
  if (mode === 'equal') {
    return choose(base(`Which one equals ${A(f3)}?`, `\\tfrac{${p}}{-${d}}`, [`${f3} = ${p} ÷ (${M}${d}): different signs, negative.`, `So ${f3} = ${S(f1)} = ${f2}.`]), R, [
      { t: f1, ok: true, say: `Yes: one minus sign, wherever it sits, makes ${M}${fr(p, d)}.` },
      { t: fr(p, d), mc: MC.placement, say: `The minus sign in the bottom still counts: ${p} ÷ (${M}${d}) is negative, ${f1}.` },
      { t: f4, mc: MC.anyNeg, say: `${f4} has two minus signs, so it is positive. ${f3} is negative: ${f1}.` },
    ]);
  }
  return choose(base(`What is ${A(fr(0, `${M}${d}`))}?`, `\\tfrac{0}{-${d}}`, [`(${M}${d}) × ▢ = 0 has the answer 0.`, `So ${fr(0, `${M}${d}`)} = ${S('0')} (zero has no sign).`]), R, [
    { t: '0', ok: true, say: 'Yes: 0 divided by a nonzero number is 0, and 0 is neither positive nor negative.' },
    { t: `${M}${d}`, say: `(${M}${d}) × (${M}${d}) is not 0. ${fr(0, `${M}${d}`)} = 0.` },
    { t: 'Undefined', say: `Only a 0 in the BOTTOM is undefined. Here 0 is on top: the value is 0.` },
  ]);
};

// =====================================================================================================
// 9. what a signed product or quotient means in context [context-meaning-mul-div]
const meaning: Gen = (R, n) => {
  const base = (prompt: string, board: string, solution: string[]): Base => ({ id: `me-${n}`, family: 'meaning', prompt, board, solution });
  if (R() < 0.55) {
    const sk = pick(R, SKINS.filter(s => s.unit !== '$'));
    const mag = q(int(R, 2, 6)), t = int(R, 2, 5), rate = qNeg(mag);
    const ask = R() < 0.5 ? t : -t, v = qMul(q(ask), rate);
    const step = sk.steps, amt = `${hq(qAbs(v))} ${sk.unit}`;
    const hi = sk.up === 'up' ? 'higher' : sk.up, lo = sk.down === 'down' ? 'lower' : sk.down;
    const when = (x: number) => (x > 0 ? `In ${t} ${step}` : `${t} ${step} ago`);
    const tense = (x: number) => (x > 0 ? 'will be' : 'was');
    const say = (x: number, up: boolean) => `${when(x)} it ${tense(x)} ${amt} ${up ? hi : lo} than now.`;
    const right = say(ask, sgn(v) > 0);
    return choose(base(`${sk.lead(rate)} What does ${A(`${hp(q(ask))} × ${hp(rate)} = ${hq(v)}`)} tell you?`, `${tn(ask)} \\times ${tp(rate)} = ${tq(v)}`,
      [`${hq(rate)} is the change per ${sk.step}; ${ni(ask)} is the time: ${ask > 0 ? 'positive = from now on' : 'negative = before now'}.`, `${hq(v)}: ${sgn(v) > 0 ? `${hi} (positive)` : `${lo} (negative)`} than now. ${right}`]), R, [
      { t: right, ok: true, say: 'Yes: each sign has a meaning in the story.' },
      { t: say(-ask, sgn(v) > 0), mc: MC.meaning, say: `${ni(ask)} ${sk.step} is ${ask > 0 ? 'AFTER now (positive time)' : 'BEFORE now (negative time)'}. ${right}` },
      { t: say(ask, sgn(v) < 0), mc: MC.meaning, say: `${hq(v)} is ${sgn(v) > 0 ? 'positive: higher than now' : 'negative: lower than now'}. ${right}` },
    ]);
  }
  const ctx = pick(R, ['debt', 'temp', 'dive'] as const);
  const k = int(R, 3, 6), each = int(R, 2, 12), D = k * each;
  const story = ctx === 'debt' ? `A debt of ${A(`$${D}`)} is shared equally by ${B(`${k} friends`)}. A debt counts as negative. Which expression gives each friend's share?`
    : ctx === 'temp' ? `The temperature fell ${A(`${D} °F`)} over ${B(`${k} hours`)}, the same each hour. A fall counts as negative. Which expression gives the change per hour?`
      : `A diver went ${A(`${D} ft`)} down in ${B(`${k} minutes`)} at a steady speed. Down counts as negative. Which expression gives her change in height per minute?`;
  return choose(base(story, `\\square \\div \\square`, [`The ${ctx === 'debt' ? 'debt' : ctx === 'temp' ? 'fall' : 'descent'} is negative: ${M}${D}. The ${ctx === 'debt' ? 'friends' : ctx === 'temp' ? 'hours' : 'minutes'} are a count: ${k}.`, `${M}${D} ÷ ${k} = ${S(`${M}${each}`)} each.`]), R, [
    { t: `${M}${D} ÷ ${k}`, ok: true, say: `Yes: ${M}${D} ÷ ${k} = ${M}${each}.` },
    { t: `${D} ÷ (${M}${k})`, mc: MC.convention, say: `The value comes out the same, but the signs are in the wrong places: the ${ctx === 'debt' ? 'debt' : 'change'} is negative, the count ${k} is not.` },
    { t: `${D} ÷ ${k}`, mc: MC.meaning, say: `${D} ÷ ${k} = ${each} is positive, but a ${ctx === 'debt' ? 'debt' : ctx === 'temp' ? 'fall' : 'descent'} is negative: ${M}${D} ÷ ${k}.` },
  ]);
};

// =====================================================================================================
// 10. multiply integers, more than two factors [int-multiply]
const intMul: Gen = (R, n) => {
  const mode = pick(R, ['two', 'two', 'three', 'big'] as const);
  let fs: number[];
  if (mode === 'two') { fs = [sign(R) * int(R, 0, 10), sign(R) * int(R, 1, 10)]; if (R() < 0.5) fs.reverse(); if (fs.every(x => x >= 0)) fs[0] = -Math.abs(fs[0]!) || -3; }
  else if (mode === 'three') {
    for (;;) {
      const k = R() < 0.6 ? 3 : 4;
      fs = Array.from({ length: k }, () => sign(R) * pick(R, [1, 2, 2, 3, 3, 5]));
      let p = 1, okk = true;
      for (let i = 0; i < k - 1; i++) { p *= fs[i]!; if (Math.abs(p) > 10) okk = false; }
      if (okk && fs.filter(x => x < 0).length >= 2) break;
    }
  } else {
    const kind = pick(R, ['md', 'md3', 'three']);
    fs = kind === 'md' ? [-int(R, 13, 49), int(R, 2, 9)] : kind === 'md3' ? [-int(R, 101, 199), -int(R, 2, 5)] : [-int(R, 6, 9), -int(R, 6, 9), -int(R, 2, 9)];
    if (R() < 0.5) fs.reverse();
  }
  const prod = fs.reduce((a, b) => a * b, 1), negs = fs.filter(x => x < 0).length;
  const e = fs.map((x, i) => (i === 0 ? (x < 0 ? `(${M}${-x})` : String(x)) : neg(x))).join(fs.length > 2 ? '' : ' × ');
  const et = fs.map((x, i) => (i === 0 ? (x < 0 ? `(${x})` : String(x)) : tn(x))).join(fs.length > 2 ? '' : ' \\times ');
  const wrongs: Wrong[] = prod === 0 ? [] : [{
    v: q(-prod), mc: negs >= 3 && negs % 2 === 1 ? MC.manyFactors : negs >= 2 && negs % 2 === 0 ? MC.anyNeg : negs === 1 ? MC.dropSign : undefined,
    say: `Count the negative factors: ${negs}, an ${negs % 2 ? 'odd' : 'even'} number, so the product is ${prod > 0 ? 'positive' : 'negative'}: ${ni(prod)}.`,
  }];
  if (fs.length === 2 && prod !== 0) wrongs.push({ v: q(fs[0]! + fs[1]!), mc: MC.addRules, say: `That adds the factors. Multiply: ${ni(prod)}.` });
  return typed({ id: `im-${n}`, family: 'intMul', prompt: `${A(e)} = ?`, board: `${et} = \\,?`, solution: [
    prod === 0 ? 'One factor is 0, so the product is 0.' : `${negs} negative factor${negs === 1 ? '' : 's'}: ${negs % 2 ? 'odd, so negative' : 'even, so positive'}.`,
    prod === 0 ? `${e} = ${S('0')}.` : `Sizes: ${fs.map(x => Math.abs(x)).join(' × ')} = ${Math.abs(prod)}. So ${e} = ${S(ni(prod))}.`,
  ] }, 'num', q(prod), `Yes: ${ni(prod)}.`, wrongs, `Multiply the sizes, then count the negative factors.`);
};

// 11. the sign of a long product without computing it [int-multiply]
const signOnly: Gen = (R, n) => {
  const k = int(R, 3, 6);
  const fs = Array.from({ length: k }, () => sign(R) * int(R, 2, 9));
  if (R() < 0.25) fs[int(R, 0, k - 1)] = 0;
  const negs = fs.filter(x => x < 0).length, hasZero = fs.includes(0);
  if (negs < 2 && !hasZero) fs[0] = -Math.abs(fs[0]!), fs[1] = -Math.abs(fs[1]!);
  const N = fs.filter(x => x < 0).length;
  const e = fs.map(x => `(${ni(x)})`).join('');
  const kind = hasZero ? 'zero' : N % 2 ? 'neg' : 'pos';
  return choose({ id: `so-${n}`, family: 'signOnly', prompt: `Without multiplying: is ${A(e)} positive, negative or 0?`, board: fs.map(x => `(${x})`).join(''), solution: [
    hasZero ? 'A factor is 0, so the product is 0, whatever the signs.' : `${N} negative factors: ${N % 2 ? 'odd' : 'even'}.`,
    hasZero ? `The product is ${S('0')}.` : `So the product is ${S(N % 2 ? 'negative' : 'positive')}.`,
  ] }, R, [
    { t: 'Positive', ok: kind === 'pos', mc: kind === 'zero' ? MC.zeroParity : kind === 'neg' && N >= 3 ? MC.manyFactors : undefined, say: kind === 'pos' ? `Yes: ${N} negative factors, an even number.` : kind === 'zero' ? 'There is a factor 0: the product is 0, not positive or negative.' : `${N} negative factors is odd: the product is negative.` },
    { t: 'Negative', ok: kind === 'neg', mc: kind === 'zero' ? MC.zeroParity : kind === 'pos' ? MC.anyNeg : undefined, say: kind === 'neg' ? `Yes: ${N} negative factors, an odd number.` : kind === 'zero' ? 'There is a factor 0: the product is 0.' : `${N} negative factors pair up: an even number makes it positive.` },
    { t: '0', ok: kind === 'zero', say: kind === 'zero' ? 'Yes: one factor of 0 makes the whole product 0.' : 'No factor is 0, so the product is not 0.' },
  ], true);
};

// =====================================================================================================
// 12. divide integers with exact quotients [int-divide]
const intDiv: Gen = (R, n) => {
  const mode = pick(R, ['fact', 'fact', 'fact', 'long', 'zero', 'zeroDiv'] as const);
  if (mode === 'zero') {
    const a = sign(R) * int(R, 2, 99);
    return choose({ id: `id-${n}`, family: 'intDiv', prompt: `Which statement about ${A(`${ni(a)} ÷ 0`)} is true?`, board: `${a} \\div 0`, solution: [`${ni(a)} ÷ 0 = ▢ would need 0 × ▢ = ${ni(a)}.`, `0 × anything is 0, so no number works: ${S('undefined')}.`] }, R, [
      { t: `It has no answer: it is undefined.`, ok: true, say: 'Yes: you cannot divide by 0.' },
      { t: `${ni(a)} ÷ 0 = 0`, mc: MC.zeroForces, say: `Check: 0 × 0 = 0, not ${ni(a)}. It is undefined.` },
      { t: `${ni(a)} ÷ 0 = ${ni(a)}`, mc: MC.divZero, say: `Check: 0 × ${neg(a)} = 0, not ${ni(a)}. It is undefined.` },
    ]);
  }
  let d: number, qt: number;
  if (mode === 'long') { d = sign(R) * int(R, 3, 9); qt = sign(R) * int(R, 12, 60); }
  else if (mode === 'zeroDiv') { d = sign(R) * int(R, 2, 10); qt = 0; }
  else { d = sign(R) * int(R, 1, 10); qt = sign(R) * int(R, 1, 10); if (d > 0 && qt > 0) qt = -qt; }
  const N = d * qt;
  const both = N < 0 && d < 0;
  return typed({ id: `id-${n}`, family: 'intDiv', prompt: `${A(`${ni(N)} ÷ ${neg(d)}`)} = ?`, board: `${N} \\div ${tn(d)} = \\,?`, solution: [
    N === 0 ? `0 divided by a nonzero number is 0.` : `Sizes: ${Math.abs(N)} ÷ ${Math.abs(d)} = ${Math.abs(qt)}. ${N * d > 0 ? 'Same signs: positive.' : 'Different signs: negative.'}`,
    `${ni(N)} ÷ ${neg(d)} = ${S(ni(qt))}. Check: ${neg(qt)} × ${neg(d)} = ${ni(N)}.`,
  ] }, 'num', q(qt), `Yes: ${neg(d)} × ${neg(qt)} = ${ni(N)}.`, qt === 0 ? [{ v: q(d), mc: MC.divZero, say: `0 ÷ ${neg(d)}: ${neg(d)} × 0 = 0, so the answer is 0.` }] : [
    { v: q(-qt), mc: both ? MC.anyNeg : qt < 0 ? MC.dropSign : undefined, say: `Check it: ${neg(-qt)} × ${neg(d)} = ${ni(-N)}, not ${ni(N)}. The answer is ${ni(qt)}.` },
  ], `Divide the sizes, then decide the sign. Check by multiplying.`);
};

// =====================================================================================================
// 13. multiply signed fractions, mixed numbers and decimals [rational-products-signed]
const ratMul: Gen = (R, n) => {
  const mode = pick(R, ['frac', 'frac', 'mixed', 'dec', 'dec', 'mix', 'zero'] as const);
  let x: Q, y: Q, fx: Form = 'frac', fy: Form = 'frac';
  if (mode === 'frac') { x = niceQ(R); y = niceQ(R); }
  else if (mode === 'mixed') { x = qAdd(q(int(R, 1, 3)), niceQ(R, true)); y = niceQ(R, true); fx = 'mixed'; }
  else if (mode === 'dec') { x = dq(int(R, 2, 19) / 10); y = dq(pick(R, [0.5, 0.2, 0.4, 1.5, 2.5, 0.3, 1.2, 0.25])); fx = fy = 'dec'; }
  else if (mode === 'mix') { x = dq(pick(R, [0.5, 0.25, 0.75, 1.5, 2.5])); y = niceQ(R); fx = 'dec'; }
  else { x = q(0); y = niceQ(R); }
  const sx = sign(R), sy = mode === 'zero' ? -1 : sx > 0 ? -1 : sign(R);
  x = sx < 0 ? qNeg(x) : x; y = sy < 0 ? qNeg(y) : y;
  if (R() < 0.5 && mode !== 'mix') { [x, y] = [y, x]; [fx, fy] = [fy, fx]; }
  const right = qMul(x, y), both = sgn(x) < 0 && sgn(y) < 0;
  const input = mode === 'dec' ? 'num' : 'frac';
  const e = `${hp(x, fx)} × ${hp(y, fy)}`;
  const wrongs: Wrong[] = right.p === 0 ? [{ v: qAdd(x, y), mc: MC.addRules, say: `A factor is 0, so the product is 0.` }] : [
    { v: qNeg(right), mc: flipMc(right, both), say: both ? `Two negative factors: the product is positive, ${hq(right, input === 'num' ? 'dec' : 'frac')}.` : `The size is right, but one factor is negative: ${hq(right, input === 'num' ? 'dec' : 'frac')}.` },
  ];
  return typed({ id: `rm-${n}`, family: 'ratMul', prompt: `${A(e)} = ?${input === 'frac' ? ' (a fraction, mixed number or whole number)' : ''}`, board: `${tp(x, fx)} \\times ${tp(y, fy)} = \\,?`, solution: [
    right.p === 0 ? 'A factor is 0, so the product is 0.' : `Sign first: ${both ? 'two negative factors, positive' : 'one negative factor, negative'}.`,
    right.p === 0 ? `${e} = ${S('0')}.` : `Size: ${hq(qAbs(x), fx)} × ${hq(qAbs(y), fy)} = ${hq(qAbs(right), input === 'num' ? 'dec' : 'frac')}. So ${e} = ${S(hq(right, input === 'num' ? 'dec' : 'frac'))}.`,
  ] }, input, right, `Yes: ${hq(right, input === 'num' ? 'dec' : 'frac')}.`, wrongs, `Decide the sign first, then multiply the sizes.`);
};

// 14. divide signed fractions and decimals [rational-quotients-signed]
const ratDiv: Gen = (R, n) => {
  const mode = pick(R, ['frac', 'frac', 'complex', 'dec', 'int', 'zero'] as const);
  let x: Q, y: Q, fm: Form = 'frac', input: 'num' | 'frac' = 'frac';
  if (mode === 'frac' || mode === 'complex') { x = niceQ(R); y = niceQ(R); }
  else if (mode === 'dec') { const qt = pick(R, [2, 3, 4, 5, 0.5, 1.5, 2.5]); y = dq(pick(R, [0.2, 0.3, 0.4, 0.6, 0.8, 1.2, 0.5])); x = dq(Math.round(val(y) * qt * 100) / 100); fm = 'dec'; input = 'num'; }
  else if (mode === 'int') { y = q(pick(R, [2, 4, 5, 8])); x = q(int(R, 3, 19)); if (x.p % y.p === 0) x = q(x.p + 1); fm = 'dec'; input = 'num'; }
  else { x = q(0); y = niceQ(R, true); }
  const sx = mode === 'zero' ? 1 : sign(R), sy = sx > 0 ? -1 : sign(R);
  x = sx < 0 ? qNeg(x) : x; y = sy < 0 ? qNeg(y) : y;
  const right = qDiv(x, y);
  if (input === 'num' && !isDec(right)) return ratDiv(R, n);
  const rf: Form = input === 'num' ? 'dec' : 'frac';
  const e = mode === 'complex' ? `${fr(hq(x), hq(y))}` : `${hp(x, fm)} ÷ ${hp(y, fm)}`;
  const board = mode === 'complex' ? `\\dfrac{${tq(x)}}{${tq(y)}} = \\,?` : `${tp(x, fm)} \\div ${tp(y, fm)} = \\,?`;
  const wrongs: Wrong[] = [];
  if (right.p !== 0) {
    const flipped = qNeg(right);
    wrongs.push({ v: flipped, mc: sgn(x) < 0 && sgn(y) < 0 ? MC.anyNeg : sgn(y) < 0 ? MC.recipFlip : MC.dropSign,
      say: sgn(y) < 0 && sgn(x) > 0 ? `The reciprocal of ${hq(y, fm)} is still negative. Different signs: the quotient is negative, ${hq(right, rf)}.` : sgn(x) < 0 && sgn(y) < 0 ? `Both are negative: the quotient is positive, ${hq(right, rf)}.` : `The size is right; different signs make the quotient negative: ${hq(right, rf)}.` });
    if (mode === 'frac' || mode === 'complex') wrongs.push({ v: qMul(qDiv(q(1), x), y), mc: MC.invertWrong, say: `Flip the DIVISOR (the second number), not the first: ${hq(x)} × ${hq(qDiv(q(1), y))} = ${hq(right)}.` });
  }
  return typed({ id: `rd-${n}`, family: 'ratDiv', prompt: `${A(e)} = ?${input === 'frac' ? ' (a fraction, mixed number or whole number)' : ''}`, board, solution: [
    right.p === 0 ? `0 divided by a nonzero number is 0.` : `Sign first: ${sgn(x) === sgn(y) ? 'same signs, positive' : 'different signs, negative'}. Keep it apart from the flip.`,
    right.p === 0 ? `So the answer is ${S('0')}.` : mode === 'frac' || mode === 'complex' ? `Size: ${hq(qAbs(x))} × ${hq(qDiv(q(1), qAbs(y)))} = ${hq(qAbs(right))}. Answer: ${S(hq(right, rf))}.` : `Size: ${hq(qAbs(x), fm)} ÷ ${hq(qAbs(y), fm)} = ${hq(qAbs(right), rf)}. Answer: ${S(hq(right, rf))}.`,
  ] }, input, right, `Yes: ${hq(right, rf)}.`, wrongs, `Decide the sign, then divide the sizes (multiply by the reciprocal of the divisor).`);
};

// =====================================================================================================
// 15. fraction → decimal by long division, terminating or repeating [decimal-expansion-long-division]
const decimal: Gen = (R, n) => {
  const mode = pick(R, ['term', 'rep', 'rep', 'kind'] as const);
  const base = (prompt: string, board: string, solution: string[]): Base => ({ id: `de-${n}`, family: 'decimal', prompt, board, solution });
  if (mode === 'term') {
    for (;;) {
      const d = pick(R, [4, 8, 5, 20, 25, 16]), p = int(R, 1, 2 * d);
      const x = q(sign(R) * p, d);
      if (x.q === 1 || !isDec(x)) continue;
      const e = expand(x), long = e.pre.length >= 3;
      const cut = long ? q(Math.trunc(val(x) * 100), 100) : null;
      const mixedForm = R() < 0.3 && Math.abs(x.p) > x.q;
      return typed(base(`Write ${A(hq(x, mixedForm ? 'mixed' : 'frac'))} as a decimal (divide until the remainder is 0).`, `${tq(x, mixedForm ? 'mixed' : 'frac')} = \\,?`,
        [`${Math.abs(x.p)} ÷ ${x.q}: keep dividing past the decimal point until the remainder is 0.`, `${hq(qAbs(x))} = ${hq(qAbs(x), 'dec')}, and the sign stays: ${S(hq(x, 'dec'))}.`]),
      'num', x, `Yes: ${hq(x, 'dec')}.`, [
        ...(sgn(x) < 0 ? [{ v: qAbs(x), mc: MC.dropSign, say: `The digits are right, but the fraction is negative: ${hq(x, 'dec')}.` }] : []),
        ...(cut ? [{ v: cut, mc: MC.stopsEarly, say: `The division is not finished: the remainder is not 0 yet. Keep going: ${hq(x, 'dec')}.` }] : []),
      ], `Divide ${Math.abs(x.p)} by ${x.q}, digit by digit, until the remainder is 0.`);
    }
  }
  for (;;) {
    const d = pick(R, [3, 6, 7, 9, 11, 12, 15]), p = int(R, 1, d - 1);
    const x = q(sign(R) * p, d);
    if (x.q === 1 || isDec(x, 8)) continue;
    const e = expand(x), negS = sgn(x) < 0 ? M : '';
    const right = `${negS}${e.int}.${e.pre}<span class="rep">${e.rep}</span>`;
    if (mode === 'kind') {
      const f = q(sign(R) * int(R, 1, 15), pick(R, [8, 16, 20, 40, 3, 6, 7, 12]));
      if (f.q === 1) continue;
      const term = isDec(f, 8);
      return choose(base(`Does ${A(hq(f))} as a decimal terminate or repeat?`, `${tq(f)}`, [term ? `Long division reaches a remainder of 0: it terminates, ${hq(f, 'dec')}.` : `A remainder comes back, so the digits repeat: ${hq(f, 'dec')}.`]), R, [
        { t: 'It terminates: the remainder becomes 0', ok: term, say: term ? `Yes: ${hq(f)} = ${hq(f, 'dec')}.` : `The remainder never becomes 0: a remainder repeats, so the digits repeat: ${hq(f, 'dec')}.` },
        { t: 'It repeats: a remainder comes back', ok: !term, say: term ? `Divide on: the remainder reaches 0, ${hq(f, 'dec')}.` : `Yes: ${hq(f)} = ${hq(f, 'dec')}.` },
        { t: 'Neither: it goes on without a pattern', mc: MC.roundedExact, say: `A fraction never does that: the remainders are less than ${f.q}, so one comes back (repeat) or one is 0 (stop).` },
      ], true);
    }
    const all = (e.pre + e.rep.repeat(4));
    const two = `${negS}${e.int}.${all.slice(0, 2)}`;
    const rounded = (Math.abs(val(x))).toFixed(2), roundedS = `${negS}${rounded}`;
    const opts: Opt[] = [
      { t: right, ok: true, say: `Yes: the bar shows the digits that repeat forever.` },
      { t: two, mc: MC.stopsEarly, say: `The remainder is not 0 after two digits: the division goes on, and the digits repeat. ${hq(x)} = ${right}.` },
    ];
    if (roundedS !== two) opts.push({ t: roundedS, mc: MC.roundedExact, say: `${roundedS} is rounded, not equal: ${hq(x)} = ${right}, the digits repeat forever.` });
    if (negS) opts.push({ t: `${e.int}.${e.pre}<span class="rep">${e.rep}</span>`, mc: MC.dropSign, say: `The digits are right, but ${hq(x)} is negative: ${right}.` });
    if (opts.length < 3) opts.push({ t: `${negS}${e.int}.${all.slice(0, 3)}`, mc: MC.stopsEarly, say: `The remainder is still not 0 after three digits: the digits repeat forever. ${hq(x)} = ${right}.` });
    return choose(base(`Which is ${A(hq(x))} as a decimal?`, `${tq(x)} = \\,?`, [`Divide ${p} by ${d}: the remainders come back, so the digits ${e.rep} repeat.`, `${hq(x)} = ${S(right)} (the sign stays).`]), R, opts);
  }
};

// 16. the nested number sets [rational-number-sets]
const sets: Gen = (R, n) => {
  type Kind = 'count' | 'whole' | 'int' | 'rat';
  const k = pick(R, ['count', 'count', 'whole', 'int', 'int', 'int', 'rat', 'rat'] as const) as Kind;
  let html = '', tex = '', disguised = false;
  if (k === 'count') { const v = int(R, 1, 20); if (R() < 0.55) { const m = int(R, 2, 5); html = fr(v * m, m); tex = `\\tfrac{${v * m}}{${m}}`; disguised = true; } else { html = String(v); tex = String(v); } }
  else if (k === 'whole') { if (R() < 0.5) { html = '0'; tex = '0'; } else { const m = int(R, 2, 9); html = fr(0, m); tex = `\\tfrac{0}{${m}}`; disguised = true; } }
  else if (k === 'int') { const v = int(R, 1, 20); const t = pick(R, ['plain', 'frac', 'dec'] as const); if (t === 'plain') { html = `${M}${v}`; tex = `-${v}`; } else if (t === 'frac') { const m = int(R, 2, 5); html = `${M}${fr(v * m, m)}`; tex = `-\\tfrac{${v * m}}{${m}}`; disguised = true; } else { html = `${M}${v}.0`; tex = `-${v}.0`; disguised = true; } }
  else { const x = q(sign(R) * int(R, 1, 11), pick(R, [2, 3, 4, 5, 6, 8])); if (x.q === 1) return sets(R, n); const asDec = R() < 0.5; html = hq(x, asDec ? 'dec' : 'frac'); tex = tq(x, asDec ? 'dec' : 'frac'); }
  const isNeg = html.startsWith(M);
  const name = { count: 'Counting numbers', whole: 'Whole numbers', int: 'Integers', rat: 'Rational numbers' } as const;
  const why = { count: `it is one of 1, 2, 3, …`, whole: `0 is a whole number (0, 1, 2, …) but not a counting number`, int: `it is a negative whole number`, rat: `it is a fraction of integers but not a whole number` } as const;
  const opts: Opt[] = (['count', 'whole', 'int', 'rat'] as Kind[]).map(s => {
    const okk = s === k;
    let mc: string | undefined;
    if (!okk && disguised && s === 'rat') mc = MC.fracNotInt;
    if (!okk && k === 'whole' && (s === 'int' || s === 'rat')) mc = MC.zeroExcluded;
    return { t: name[s], ok: okk, mc, say: okk ? `Yes: ${html} is in the ${name[s].toLowerCase()}, because ${why[k]}.` : `${disguised ? `${html} is just another way to write ${k === 'whole' ? '0' : k === 'count' ? 'a counting number' : 'an integer'}. ` : ''}Its smallest set is the ${name[k].toLowerCase()}: ${why[k]}.` };
  });
  if (isNeg) opts.push({ t: 'None: it is not a rational number', mc: MC.negNotRational, say: `Negative numbers are rational too: ${html} can be written as a fraction of integers. Its smallest set: ${name[k].toLowerCase()}.` });
  return choose({ id: `se-${n}`, family: 'sets', prompt: `What is the smallest set that ${A(html)} belongs to? (counting ⊂ whole ⊂ integers ⊂ rational)`, board: tex, solution: [
    disguised ? `Simplify first: ${html} = ${k === 'whole' ? '0' : k === 'count' ? 'a counting number' : 'an integer'}.` : `Look at the value of ${html}.`,
    `Smallest set: ${S(name[k].toLowerCase())}, because ${why[k]}. It is in every bigger set too.`,
  ] }, R, opts, true);
};

// =====================================================================================================
// 17. short compound expressions [compound-expressions]
const compound: Gen = (R, n) => {
  const mode = pick(R, ['addMul', 'addMul', 'divMul', 'subAdd', 'paren'] as const);
  const base = (e: string, et: string, steps: string[]): Base => ({ id: `cp-${n}`, family: 'compound', prompt: `${A(e)} = ?`, board: `${et} = \\,?`, solution: steps });
  if (mode === 'addMul') {
    const a = sign(R) * int(R, 1, 9), b = int(R, 2, 6) * sign(R), c = dq(sign(R) * pick(R, [1.5, 2.5, 0.5, 3, 4, 2]));
    const prod = qMul(q(b), c), right = qAdd(q(a), prod);
    const negs = [a, b, c.p].filter(x => x < 0).length;
    const oneSign = qMul(q(negs % 2 ? -1 : 1), qAdd(q(Math.abs(a)), qAbs(prod)));
    return typed(base(`${ni(a)} + ${ni(b)}${hp(c, 'dec')}`, `${a} + ${b}${tp(c, 'dec')}`, [`Multiply first: ${ni(b)} × ${hp(c, 'dec')} = ${hq(prod, 'dec')}.`, `Then add: ${ni(a)} + ${hp(prod, 'dec')} = ${S(hq(right, 'dec'))}.`]),
    'num', right, `Yes: ${hq(right, 'dec')}.`, [
      { v: oneSign, mc: MC.oneSign, say: `Each part keeps its own sign. The product ${ni(b)} × ${hp(c, 'dec')} = ${hq(prod, 'dec')}, then ${ni(a)} + ${hp(prod, 'dec')} = ${hq(right, 'dec')}.` },
      { v: qMul(qAdd(q(a), q(b)), c), say: `Multiplication comes before addition: ${ni(b)} × ${hp(c, 'dec')} first.` },
    ], `Multiply first, then add, keeping each sign.`);
  }
  if (mode === 'divMul') {
    const b = sign(R) * int(R, 2, 6), c = sign(R) * int(R, 2, 5), k = sign(R) * int(R, 2, 9), a = b * c * k;
    const right = q((a / b) * c), ranks = q(a / (b * c));
    return typed(base(`${ni(a)} ÷ ${neg(b)} × ${neg(c)}`, `${a} \\div ${tn(b)} \\times ${tn(c)}`, [`× and ÷ have the same rank: work left to right.`, `${ni(a)} ÷ ${neg(b)} = ${ni(a / b)}; then ${ni(a / b)} × ${neg(c)} = ${S(ni(right.p))}.`]),
    'num', right, `Yes: left to right, ${ni(right.p)}.`, [
      { v: ranks, mc: MC.pemdas, say: `M does not come before D: they share a rank, so go left to right. ${ni(a)} ÷ ${neg(b)} first: ${ni(right.p)}.` },
    ], `Left to right: divide first, then multiply.`);
  }
  if (mode === 'subAdd') {
    const a = sign(R) * int(R, 1, 12), b = int(R, 2, 9), c = int(R, 2, 9), m = sign(R) * int(R, 2, 4);
    const right = q(a * m - b + c), ranks = q(a * m - (b + c));
    return typed(base(`${ni(a)} × ${neg(m)} − ${b} + ${c}`, `${a} \\times ${tn(m)} - ${b} + ${c}`, [`Multiply first: ${ni(a)} × ${neg(m)} = ${ni(a * m)}.`, `Then − and + left to right: ${ni(a * m)} − ${b} = ${ni(a * m - b)}, then + ${c} = ${S(ni(right.p))}.`]),
    'num', right, `Yes: ${ni(right.p)}.`, [
      { v: ranks, mc: MC.pemdas, say: `A does not come before S: + and − share a rank, left to right. ${ni(a * m - b)} + ${c} = ${ni(right.p)}.` },
      { v: q(-right.p), mc: MC.oneSign, say: `Each step keeps its sign: ${ni(a * m)} − ${b} + ${c} = ${ni(right.p)}.` },
    ], `Multiply first, then subtract and add from left to right.`);
  }
  const a = sign(R) * int(R, 1, 9), b = sign(R) * int(R, 1, 9), c = dq(sign(R) * pick(R, [0.5, 1.5, 2, 3, 2.5]));
  const s = a + b, right = qMul(q(s), c);
  return typed(base(`(${ni(a)} + ${neg(b)}) × ${hp(c, 'dec')}`, `(${a} + ${tn(b)}) \\times ${tp(c, 'dec')}`, [`Brackets first: ${ni(a)} + ${neg(b)} = ${ni(s)}.`, `Then ${neg(s)} × ${hp(c, 'dec')} = ${S(hq(right, 'dec'))}.`]),
  'num', right, `Yes: ${hq(right, 'dec')}.`, [
    { v: qAdd(q(a), qMul(q(b), c)), say: `The brackets come first: ${ni(a)} + ${neg(b)} = ${ni(s)}, then multiply.` },
    ...(right.p !== 0 ? [{ v: qNeg(right), mc: flipMc(right, s < 0 && c.p < 0), say: `Check the sign: ${neg(s)} × ${hp(c, 'dec')} = ${hq(right, 'dec')}.` }] : []),
  ], `Brackets first, then multiply.`);
};

// 18. order of operations with powers and absolute value [multi-step-order-of-operations]
const powers: Gen = (R, n) => {
  const mode = pick(R, ['negSq', 'negSq', 'parenPow', 'fracPow', 'fracPow', 'abs', 'abs'] as const);
  const base = (e: string, et: string, steps: string[]): Base => ({ id: `po-${n}`, family: 'powers', prompt: `${A(e)} = ?`, board: `${et} = \\,?`, solution: steps });
  if (mode === 'negSq') {
    const a = int(R, 2, 9), c = int(R, 1, 20) * sign(R);
    const right = q(-a * a + c);
    return typed(base(`${M}${a}<sup>2</sup> + ${neg(c)}`, `-${a}^2 + ${tn(c)}`, [`${M}${a}<sup>2</sup> means the opposite of ${a}<sup>2</sup>: ${M}${a * a} (the power is done before the minus).`, `${M}${a * a} + ${neg(c)} = ${S(ni(right.p))}.`]),
    'num', right, `Yes: ${M}${a * a} + ${neg(c)} = ${ni(right.p)}.`, [
      { v: q(a * a + c), mc: MC.negPow, say: `${M}${a}<sup>2</sup> is not (${M}${a})<sup>2</sup>: without brackets the power belongs to ${a} only. ${M}${a * a} + ${neg(c)} = ${ni(right.p)}.` },
    ], `Power first: ${M}${a}<sup>2</sup> = ${M}${a * a}.`);
  }
  if (mode === 'parenPow') {
    const a = int(R, 2, 6), k = pick(R, [2, 3]), m = int(R, 2, 5);
    const pw = (-a) ** k, right = q(pw * m);
    return typed(base(`(${M}${a})<sup>${k}</sup> × ${m}`, `(-${a})^{${k}} \\times ${m}`, [`(${M}${a})<sup>${k}</sup> = ${Array(k).fill(`(${M}${a})`).join('')} = ${ni(pw)} (${k} negative factors: ${k % 2 ? 'odd' : 'even'}).`, `${neg(pw)} × ${m} = ${S(ni(right.p))}.`]),
    'num', right, `Yes: ${ni(right.p)}.`, [
      { v: q(-right.p), mc: k % 2 === 0 ? MC.negPow : MC.manyFactors, say: `Write it out: ${Array(k).fill(`(${M}${a})`).join('')} has ${k} negative factors, so it is ${pw > 0 ? 'positive' : 'negative'}: ${ni(pw)}.` },
    ], `Write the power as repeated multiplication.`);
  }
  if (mode === 'fracPow') {
    const [p, d] = pick(R, [[1, 2], [1, 2], [1, 3], [2, 3]] as const), k = pick(R, [2, 3]);
    const base0 = q(-p, d), pw = qPow(base0, k), mult = q(d ** k * int(R, 1, 2));
    const right = qMul(pw, mult);
    return typed(base(`(${M}${fr(p, d)})<sup>${k}</sup> × ${mult.p}`, `\\left(-\\tfrac{${p}}{${d}}\\right)^{${k}} \\times ${mult.p}`, [`(${M}${fr(p, d)})<sup>${k}</sup> = ${Array(k).fill(`(${M}${fr(p, d)})`).join('')} = ${hq(pw)}.`, `${hp(pw)} × ${mult.p} = ${S(hq(right))}.`]),
    right.q === 1 ? 'num' : 'frac', right, `Yes: ${hq(right)}.`, [
      { v: qMul(qMul(q(k % 2 ? -1 : 1), q(p, d)), mult), mc: MC.powSign, say: `The power works on the whole fraction, not just the sign: (${M}${fr(p, d)})<sup>${k}</sup> = ${hq(pw)}. Then × ${mult.p} = ${hq(right)}.` },
      { v: qNeg(right), say: `Count the negative factors: ${k}, ${k % 2 ? 'odd: negative' : 'even: positive'}.` },
    ], `Write the power out as repeated multiplication.`);
  }
  const a = int(R, 1, 9), b = dq(int(R, 2, 19) / 2 + a), c = dq(sign(R) * pick(R, [1, 2, 0.5, 1.5, 3]));
  const inside = qSub(q(a), b), right = qAdd(qNeg(qAbs(inside)), c);
  const parts = qAdd(qNeg(qAdd(q(a), qAbs(b))), c);
  return typed(base(`${M}|${a} − ${hq(b, 'dec')}| + ${hp(c, 'dec')}`, `-|${a} - ${tq(b, 'dec')}| + ${tp(c, 'dec')}`, [`Inside the bars first: ${a} − ${hq(b, 'dec')} = ${hq(inside, 'dec')}; its absolute value is ${hq(qAbs(inside), 'dec')}.`, `${M}${hq(qAbs(inside), 'dec')} + ${hp(c, 'dec')} = ${S(hq(right, 'dec'))}.`]),
  'num', right, `Yes: ${hq(right, 'dec')}.`, [
    { v: parts, mc: MC.absParts, say: `Absolute-value bars are a grouping symbol: work out ${a} − ${hq(b, 'dec')} first (${hq(inside, 'dec')}), then take its distance from 0.` },
    { v: qAdd(qAbs(inside), c), say: `The minus sign is outside the bars: ${M}|${hq(inside, 'dec')}| = ${M}${hq(qAbs(inside), 'dec')}.` },
  ], `Bars first, then the minus sign outside, then add.`);
};

// =====================================================================================================
// 19. properties as strategies [multiplicative-properties-strategies]
const strategy: Gen = (R, n) => {
  const mode = pick(R, ['dist', 'dist', 'factor', 'regroup', 'divGroup', 'name'] as const);
  const base = (prompt: string, board: string, solution: string[]): Base => ({ id: `st-${n}`, family: 'strategy', prompt, board, solution });
  if (mode === 'dist') {
    const d = pick(R, [2, 4]), w = int(R, 1, 3), p = int(R, 1, d - 1), k = d * int(R, 1, 4);
    const right = q(-(k * w) - (k * p) / d);
    return typed(base(`Use the distributive property: ${A(`${k} × (${M}${w}&#8202;${fr(p, d)})`)} = ${k}(${M}${w}) + ${k}(${M}${fr(p, d)}) = ?`, `${k} \\times (-${w}\\tfrac{${p}}{${d}})`,
      [`${k}(${M}${w}) = ${M}${k * w} and ${k}(${M}${fr(p, d)}) = ${M}${(k * p) / d}.`, `${M}${k * w} + (${M}${(k * p) / d}) = ${S(ni(right.p))}.`]),
    'num', right, `Yes: ${ni(right.p)}.`, [
      { v: q(-(k * w * d) - p, d), mc: MC.partial, say: `The ${k} multiplies BOTH parts: ${k}(${M}${fr(p, d)}) = ${M}${(k * p) / d} too. Total ${ni(right.p)}.` },
      { v: q(-right.p), mc: MC.dropSign, say: `Both parts are negative: the total is ${ni(right.p)}.` },
    ], `Multiply each part by ${k}, then add.`);
  }
  if (mode === 'factor') {
    const f = qNeg(niceQ(R, true)), a = int(R, 2, 9), b = int(R, 2, 9);
    return typed(base(`${A(`${hp(f)}(${a}) + ${hp(f)}(${b})`)} = ${hp(f)} × ▢. What goes in the box?`, `${tp(f)}(${a}) + ${tp(f)}(${b}) = ${tp(f)} \\times \\square`,
      [`Both parts share the factor ${hp(f)}: take it out.`, `${hp(f)}(${a} + ${b}) = ${hp(f)} × ${S(String(a + b))}.`]),
    'num', q(a + b), `Yes: ${hp(f)}(${a} + ${b}) = ${hp(f)} × ${a + b}.`, [
      { v: q(a * b), say: `Taking out a common factor leaves a SUM: ${a} + ${b} = ${a + b}.` },
    ], `Take out the common factor; what is left is ${a} + ${b}.`);
  }
  if (mode === 'regroup') {
    const pair = pick(R, [[4, 2.5], [2, 5], [5, 0.2], [8, 1.25], [4, 0.25], [2, 0.5]] as const), c = int(R, 3, 9);
    const x = q(-pair[0]), y = dq(pair[1]), z = q(-c);
    const right = qMul(qMul(x, y), z);
    return typed(base(`Regroup to make it easy: ${A(`${hp(x)}(${hq(y, 'dec')})${hp(z)}`)} = ?`, `${tp(x)}(${tq(y, 'dec')})${tp(z)}`,
      [`Multiply the friendly pair first: ${hp(x)} × ${hq(y, 'dec')} = ${hq(qMul(x, y), 'dec')}.`, `Then ${hp(qMul(x, y), 'dec')} × ${hp(z)} = ${S(hq(right, 'dec'))} (two negative factors: positive).`]),
    'num', right, `Yes: ${hq(right, 'dec')}.`, [
      { v: qNeg(right), mc: MC.anyNeg, say: `Two negative factors make a positive product: ${hq(right, 'dec')}.` },
    ], `Pair ${hp(x)} with ${hq(y, 'dec')} first.`);
  }
  if (mode === 'divGroup') {
    const b = int(R, 2, 4), c = pick(R, [2, 4].filter(x => x !== b)) ?? 2, k = int(R, 1, 3), N = -(b * c * c * k);
    const v1 = N / b / c, v2 = N / (b / c);
    if (!Number.isInteger(v2)) return strategy(R, n);
    return choose(base(`Do ${A(`(${ni(N)} ÷ ${b}) ÷ ${c}`)} and ${A(`${ni(N)} ÷ (${b} ÷ ${c})`)} have the same value?`, `(${N} \\div ${b}) \\div ${c} \\quad ${N} \\div (${b} \\div ${c})`,
      [`(${ni(N)} ÷ ${b}) ÷ ${c} = ${ni(N / b)} ÷ ${c} = ${ni(v1)}.`, `${ni(N)} ÷ (${b} ÷ ${c}) = ${ni(N)} ÷ ${hq(q(b, c))} = ${ni(v2)}. Division cannot be regrouped.`]), R, [
      { t: `No: ${ni(v1)} and ${ni(v2)}. You cannot regroup a division.`, ok: true, say: 'Right: regrouping works for × and +, not for ÷ or −.' },
      { t: `Yes: moving brackets never changes the value.`, mc: MC.regroupDiv, say: `Work both out: ${ni(v1)} and ${ni(v2)}. Moving brackets is safe only in a product or a sum.` },
      { t: `Yes, because both have a negative number.`, say: `Signs do not decide it. ${ni(v1)} and ${ni(v2)} are different.` },
    ]);
  }
  const k = pick(R, ['dist', 'comm', 'assoc'] as const);
  const f = qNeg(niceQ(R, true)), a = int(R, 2, 9), b = int(R, 2, 9), c = int(R, 2, 9);
  const stmt = k === 'dist' ? `${hp(f)}(${a}) + ${hp(f)}(${b}) = ${hp(f)}(${a} + ${b})` : k === 'comm' ? `(${M}${a})(${hq(f)})(${M}${c}) = (${M}${c})(${M}${a})(${hq(f)})` : `[(${M}${a})(${hq(f)})](${M}${c}) = (${M}${a})[(${hq(f)})(${M}${c})]`;
  return choose(base(`Which property makes this true? ${A(stmt)}`, '\\text{which property?}', [k === 'dist' ? 'A common factor is taken out of a sum: distributive.' : k === 'comm' ? 'The same factors in a new ORDER: commutative.' : 'The same factors in the same order, new GROUPING: associative.']), R, [
    { t: 'Distributive property', ok: k === 'dist', say: k === 'dist' ? 'Yes: a(b) + a(c) = a(b + c).' : 'Distributive is about a sum: a(b + c) = ab + ac. There is no sum here.' },
    { t: 'Commutative property', ok: k === 'comm', say: k === 'comm' ? 'Yes: the order of factors changed.' : k === 'dist' ? 'Nothing was reordered: a common factor was taken out of a sum.' : 'The order is the same; the brackets moved.' },
    { t: 'Associative property', ok: k === 'assoc', say: k === 'assoc' ? 'Yes: the brackets moved, the order stayed.' : k === 'dist' ? 'No brackets moved inside a product: a factor was taken out of a sum.' : 'No brackets moved: the order changed.' },
  ], true);
};

// =====================================================================================================
// 20. check a quotient by multiplying by the divisor [inverse-check-quotient]
const checkQ: Gen = (R, n) => {
  const mode = pick(R, ['which', 'which', 'claim', 'claim', 'zero'] as const);
  const kind = pick(R, ['int', 'int', 'dec', 'frac'] as const);
  let d: Q, qt: Q;
  if (kind === 'int') { d = q(sign(R) * int(R, 2, 9)); qt = q(sign(R) * int(R, 2, 9)); }
  else if (kind === 'dec') { d = dq(sign(R) * pick(R, [0.5, 0.2, 2.5, 1.5, 0.4])); qt = q(sign(R) * int(R, 2, 9)); }
  else { d = sign(R) < 0 ? qNeg(niceQ(R, true)) : niceQ(R, true); qt = sign(R) < 0 ? qNeg(niceQ(R)) : niceQ(R); }
  if (sgn(d) > 0 && sgn(qt) > 0) d = qNeg(d);
  const N = qMul(d, qt), fm: Form = kind === 'dec' ? 'dec' : 'frac';
  const h = (x: Q) => hq(x, fm), hpp = (x: Q) => hp(x, fm);
  const base = (prompt: string, board: string, solution: string[]): Base => ({ id: `cq-${n}`, family: 'checkQ', prompt, board, solution });
  if (mode === 'zero') {
    const a = sign(R) * int(R, 2, 20);
    return choose(base(`Ben says ${A(`${ni(a)} ÷ 0 = 0`)}. Check it by multiplying: 0 × 0 = 0, not ${ni(a)}. So:`, `${a} \\div 0`, [`A check multiplies the quotient by the divisor: 0 × ▢ should give ${ni(a)}.`, `0 × anything is 0, so no quotient passes the check: ${S('undefined')}.`]), R, [
      { t: `There is no answer: no number times 0 gives ${ni(a)}.`, ok: true, say: 'Yes: dividing by 0 is undefined.' },
      { t: `Ben is right: anything with a 0 in it is 0.`, mc: MC.zeroForces, say: `The check fails: 0 × 0 = 0, not ${ni(a)}. No number passes, so it is undefined.` },
      { t: `The answer is ${ni(a)}.`, mc: MC.divZero, say: `Check: ${neg(a)} × 0 = 0, not ${ni(a)}. It is undefined.` },
    ]);
  }
  if (mode === 'which') {
    return choose(base(`Which multiplication checks ${A(`${h(N)} ÷ ${hpp(d)} = ${h(qt)}`)}?`, `${tq(N, fm)} \\div ${tp(d, fm)} = ${tq(qt, fm)}`, [`Multiply the quotient by the DIVISOR: you should get the dividend back.`, `${hpp(qt)} × ${hpp(d)} = ${h(N)}: ${S('it checks')}.`]), R, [
      { t: `${hpp(qt)} × ${hpp(d)} = ${h(N)}`, ok: true, say: 'Yes: quotient × divisor = dividend, signs and all.' },
      { t: `${hpp(qt)} × ${hpp(N)} = ${h(qMul(qt, N))}`, mc: MC.checkDividend, say: `Multiply by the divisor ${hpp(d)}, not the dividend: ${hpp(qt)} × ${hpp(d)} = ${h(N)}.` },
      { t: `${h(qAbs(qt))} × ${h(qAbs(d))} = ${h(qAbs(N))}`, mc: MC.magOnly, say: `Sizes alone do not check the sign. Use the signed numbers: ${hpp(qt)} × ${hpp(d)} = ${h(N)}.` },
    ]);
  }
  const wrongSign = R() < 0.6, claim = wrongSign ? qNeg(qt) : qt, who = pick(R, ['Ava', 'Ben', 'Zoe', 'Malik', 'Iris']);
  const back = qMul(claim, d);
  return choose(base(`${who} says ${A(`${h(N)} ÷ ${hpp(d)} = ${h(claim)}`)}. Check it by multiplying. Is ${who} right?`, `${tq(N, fm)} \\div ${tp(d, fm)} \\overset{?}{=} ${tq(claim, fm)}`, [`Check: ${hpp(claim)} × ${hpp(d)} = ${h(back)}${wrongSign ? `, not ${h(N)}` : ''}.`, wrongSign ? `So ${who} is wrong: the quotient is ${S(h(qt))}.` : `It gives the dividend back: ${S('right')}.`]), R, wrongSign ? [
    { t: `No: ${hpp(claim)} × ${hpp(d)} = ${h(back)}, not ${h(N)}. It is ${h(qt)}.`, ok: true, say: 'Yes: the check catches the sign.' },
    { t: `Yes: ${h(qAbs(claim))} × ${h(qAbs(d))} = ${h(qAbs(N))}.`, mc: MC.magOnly, say: `That checks only the sizes. With the signs: ${hpp(claim)} × ${hpp(d)} = ${h(back)}, not ${h(N)}.` },
    { t: `Yes: ${hpp(claim)} × ${hpp(N)} gives the right size.`, mc: MC.checkDividend, say: `Multiply by the divisor ${hpp(d)}, not the dividend: ${hpp(claim)} × ${hpp(d)} = ${h(back)}, not ${h(N)}.` },
  ] : [
    { t: `Yes: ${hpp(claim)} × ${hpp(d)} = ${h(N)}.`, ok: true, say: 'Yes: the check gives the dividend back.' },
    { t: `No: ${h(qAbs(claim))} × ${h(qAbs(d))} = ${h(qAbs(N))}, so the sign must be ${sgn(qt) < 0 ? 'positive' : 'negative'}.`, mc: MC.magOnly, say: `Check with the signs: ${hpp(claim)} × ${hpp(d)} = ${h(N)}. ${who} is right.` },
    { t: `No: ${hpp(claim)} × ${hpp(N)} is not ${h(d)}.`, mc: MC.checkDividend, say: `The check multiplies by the divisor: ${hpp(claim)} × ${hpp(d)} = ${h(N)}. ${who} is right.` },
  ]);
};

// =====================================================================================================
// 21. a general argument for negative × negative [general-neg-neg-argument]
const argument: Gen = (R, n) => {
  const mode = pick(R, ['which', 'step', 'finish'] as const);
  const base = (prompt: string, board: string, solution: string[]): Base => ({ id: `ar-${n}`, family: 'argument', prompt, board, solution });
  if (mode === 'which') {
    const a = int(R, 2, 9), b = int(R, 2, 9), c = int(R, 2, 9), d = int(R, 2, 9);
    return choose(base(`Which one PROVES that ${A('(−a)(−b) = ab')} for ANY positive numbers a and b?`, `(-a)(-b) = ab`, [`Examples and calculators only show some cases.`, `The distributive argument works for every a and b: 0 = (${M}a)(b + (${M}b)) = ${M}ab + (${M}a)(${M}b), so (${M}a)(${M}b) = ${S('ab')}.`]), R, [
      { t: `0 = (${M}a)(b + (${M}b)) = ${M}ab + (${M}a)(${M}b), so (${M}a)(${M}b) is the opposite of ${M}ab: ab.`, ok: true, say: 'Yes: it uses only properties that hold for every number.' },
      { t: `(${M}${a})(${M}${b}) = ${a * b} and (${M}${c})(${M}${d}) = ${c * d}, so it always works.`, mc: MC.examples, say: 'Two examples, however many, do not cover every a and b. The distributive argument does.' },
      { t: `A calculator gives a positive answer every time I try.`, mc: MC.simData, say: 'A calculator is built to follow the rule: its outputs are not evidence for the rule. The distributive argument is.' },
      { t: `Negative times negative is positive, so (${M}a)(${M}b) is positive.`, mc: MC.arbitrary, say: 'That uses the rule to prove the rule. The distributive argument gives a reason.' },
    ]);
  }
  if (mode === 'step') {
    const p = int(R, 1, 3), qq = pick(R, [2, 3, 4, 5]), r = int(R, 1, 4), s = pick(R, [2, 3, 5, 7]);
    if (qq === s || p >= qq || r >= s) return argument(R, n);
    const prod = q(p * r, qq * s);
    return choose(base(`A new example: 0 = (${M}${fr(p, qq)})(${fr(r, s)} + (${M}${fr(r, s)})) = ▢ + (${M}${fr(p, qq)})(${M}${fr(r, s)}). What goes in the box?`, `0 = \\square + (-\\tfrac{${p}}{${qq}})(-\\tfrac{${r}}{${s}})`,
      [`Distribute: the first part is (${M}${fr(p, qq)})(${fr(r, s)}) = ${M}${hq(prod)} (one negative factor).`, `So (${M}${fr(p, qq)})(${M}${fr(r, s)}) is its opposite: ${S(hq(prod))}.`]), R, [
      { t: `${M}${hq(prod)}`, ok: true, say: `Yes: (${M}${fr(p, qq)})(${fr(r, s)}) = ${M}${hq(prod)}, so the other part must be ${hq(prod)}.` },
      { t: hq(prod), mc: MC.dropSign, say: `(${M}${fr(p, qq)})(${fr(r, s)}) has one negative factor: ${M}${hq(prod)}.` },
      { t: `${M}${fr(p, qq)}`, mc: MC.partial, say: `The ${M}${fr(p, qq)} multiplies the ${fr(r, s)}: (${M}${fr(p, qq)})(${fr(r, s)}) = ${M}${hq(prod)}.` },
    ]);
  }
  const a = int(R, 2, 12), b = int(R, 2, 12);
  return choose(base(`0 = (${M}${a})(${b} + (${M}${b})) = ${M}${a * b} + (${M}${a})(${M}${b}). What does this show about ${A(`(${M}${a})(${M}${b})`)}?`, `0 = -${a * b} + (-${a})(-${b})`,
    [`The two parts add to 0, so they are opposites.`, `(${M}${a})(${M}${b}) is the opposite of ${M}${a * b}: ${S(String(a * b))}.`]), R, [
    { t: `It is the opposite of ${M}${a * b}, so it is ${a * b}.`, ok: true, say: 'Yes: two numbers that add to 0 are opposites.' },
    { t: `It is ${M}${a * b}, the same as the first part.`, mc: MC.anyNeg, say: `${M}${a * b} + (${M}${a * b}) = ${M}${2 * a * b}, not 0. It must be ${a * b}.` },
    { t: `Nothing: you can only find out by trying numbers.`, mc: MC.examples, say: `The chain is a reason: it forces (${M}${a})(${M}${b}) + (${M}${a * b}) = 0, so it is ${a * b}.` },
  ]);
};

// 22. example, counterexample or general argument [evidence-scope]
const evidence: Gen = (R, n) => {
  const a = int(R, 2, 9), b = int(R, 2, 9), who = pick(R, ['Lena', 'Dev', 'Rosa', 'Theo', 'June']);
  const EX = 'An example: it agrees with the claim but does not prove it', CE = 'A counterexample: it shows the claim is false', GA = 'A general argument: it proves the claim for every case';
  const mode = pick(R, ['sumCE', 'prodEx', 'prodGA', 'negCE', 'repair'] as const);
  const base = (prompt: string, board: string, solution: string[]): Base => ({ id: `ev-${n}`, family: 'evidence', prompt, board, solution });
  if (mode === 'repair') {
    return choose(base(`${who} wrote: “two negatives make a positive.” Then ${who} checked (${M}${a})(${M}${b}) = ${a * b}, but (${M}${a}) + (${M}${b}) = ${M}${a + b}. Which wording is always true?`, `(-${a})(-${b}) = ${a * b} \\quad (-${a}) + (-${b}) = -${a + b}`, [`The rule is about PRODUCTS (and quotients), not sums.`, `${S('The product of two negative numbers is positive.')}`]), R, [
      { t: 'The product of two negative numbers is positive.', ok: true, say: 'Yes: that is the claim the distributive argument proves.' },
      { t: 'The sum of two negative numbers is positive.', mc: MC.twoNegAdd, say: `(${M}${a}) + (${M}${b}) = ${M}${a + b}: a sum of negatives is negative.` },
      { t: 'Two negative numbers always combine to a positive number.', mc: MC.twoNegAdd, say: `Not when you add them: (${M}${a}) + (${M}${b}) = ${M}${a + b}. Only the product is positive.` },
    ]);
  }
  const C = {
    sumCE: { claim: 'Two negatives always make a positive.', ev: `(${M}${a}) + (${M}${b}) = ${M}${a + b}`, tex: `(-${a}) + (-${b}) = -${a + b}`, right: CE },
    prodEx: { claim: 'The product of two negative numbers is positive.', ev: `(${M}${a})(${M}${b}) = ${a * b}`, tex: `(-${a})(-${b}) = ${a * b}`, right: EX },
    prodGA: { claim: 'The product of two negative numbers is positive.', ev: `for any a, b > 0: 0 = (${M}a)(b + (${M}b)) = ${M}ab + (${M}a)(${M}b), so (${M}a)(${M}b) = ab`, tex: `0 = -ab + (-a)(-b)`, right: GA },
    negCE: { claim: 'Multiplying by a negative number always gives a negative number.', ev: `(${M}${a})(${M}${b}) = ${a * b}`, tex: `(-${a})(-${b}) = ${a * b}`, right: CE },
  }[mode];
  const sayRight = { [EX]: 'It is one case that agrees: it supports the claim but cannot prove it for every number.', [CE]: 'It is a case where the claim fails, so the claim is false.', [GA]: 'It works for every a and b, so it proves the claim.' } as Record<string, string>;
  return choose(base(`Claim: “${A(C.claim)}” Evidence: ${B(C.ev)}. What kind of evidence is it?`, C.tex, [sayRight[C.right]!, `So it is ${S(C.right.split(':')[0]!.toLowerCase())}.`]), R, [EX, CE, GA].map(t => ({
    t, ok: t === C.right,
    mc: t === C.right ? undefined : t === GA && C.right === EX ? MC.examples : t === EX && mode === 'sumCE' ? MC.twoNegAdd : undefined,
    say: t === C.right ? `Yes: ${sayRight[t]!}` : `${sayRight[C.right]!}`,
  })), true);
};

// =====================================================================================================
// 23. one-step word problems (rates, sharing, time before now) [apply-one-step-mul-div]
const story1: Gen = (R, n) => {
  const mode = pick(R, ['debt', 'temp', 'dive', 'before', 'fee'] as const);
  const base = (prompt: string, board: string, unit: string, solution: string[]): Base => ({ id: `s1-${n}`, family: 'story1', prompt, board, unit, solution });
  if (mode === 'debt') {
    const k = int(R, 2, 6), each = dq(pick(R, [4, 6, 7.5, 12.5, 9, 15, 2.25, 8])), D = qMul(each, q(k));
    return typed(base(`${pick(R, ['Four', 'A group of'])} friends share a debt of ${A(`$${val(D).toFixed(D.q === 1 ? 0 : 2)}`)} equally: there are ${B(`${k} of them`)}. Write each friend's share as a signed number (a debt is negative).`, `${tq(qNeg(D), 'dec')} \\div ${k} = \\,?`, 'dollars',
      [`The debt is ${M}$${val(D).toFixed(D.q === 1 ? 0 : 2)}; ${k} friends: ${M}${hq(D, 'dec')} ÷ ${k}.`, `= ${S(hq(qNeg(each), 'dec'))}: each friend owes $${val(each).toFixed(each.q === 1 ? 0 : 2)}.`]),
    'num', qNeg(each), `Yes: each share is ${M}$${val(each).toFixed(each.q === 1 ? 0 : 2)}.`, [
      { v: each, mc: MC.meaning, say: `A debt counts as negative, so each share is negative too: ${hq(qNeg(each), 'dec')}.` },
    ], `Divide the debt (negative) by the number of friends.`);
  }
  if (mode === 'temp' || mode === 'dive') {
    const h = int(R, 2, 6), per = dq(pick(R, [1.5, 2, 2.5, 3, 4, 0.5, 3.5])), total = qMul(per, q(h));
    const temp = mode === 'temp';
    return typed(base(temp ? `The temperature fell ${A(`${hq(total, 'dec')} °F`)} in ${B(`${h} hours`)}, the same amount each hour. What was the change per hour?` : `A submarine drone went ${A(`${hq(total, 'dec')} ft down`)} in ${B(`${h} seconds`)} at a steady speed. What was its change in height per second?`,
      `${tq(qNeg(total), 'dec')} \\div ${h} = \\,?`, temp ? '°F per hour' : 'ft per second',
      [`A ${temp ? 'fall' : 'descent'} is a negative change: ${M}${hq(total, 'dec')}.`, `${M}${hq(total, 'dec')} ÷ ${h} = ${S(hq(qNeg(per), 'dec'))} ${temp ? '°F per hour' : 'ft per second'}.`]),
    'num', qNeg(per), `Yes: ${hq(qNeg(per), 'dec')} each ${temp ? 'hour' : 'second'}.`, [
      { v: per, mc: MC.meaning, say: `The ${temp ? 'temperature fell' : 'drone went down'}: the change is negative, ${hq(qNeg(per), 'dec')}.` },
      { v: qNeg(qMul(total, q(h))), say: `Share the change over the ${h} ${temp ? 'hours' : 'seconds'}: divide, do not multiply.` },
    ], `Divide the (negative) change by the time.`);
  }
  if (mode === 'before') {
    const w = int(R, 1, 2), half = pick(R, [[1, 2], [1, 4], [3, 4]] as const), rate = qAdd(q(w), q(half[0], half[1])), t = int(R, 2, 4);
    const right = qMul(rate, q(t));
    return typed(base(`The water level in a pond drops ${A(`${w}&#8202;${fr(half[0], half[1])} in. every day`)} in a dry spell. Compared with now, what was the level ${B(`${t} days ago`)}? (+ is higher, ${M} is lower)`, `${tn(-t)} \\times (-${w}\\tfrac{${half[0]}}{${half[1]}}) = \\,?`, 'in.',
      [`Rate ${M}${w}&#8202;${fr(half[0], half[1])} in. per day; ${t} days ago is time ${M}${t}.`, `(${M}${t}) × (${M}${w}&#8202;${fr(half[0], half[1])}) = ${S('+' + hq(right, 'dec'))} in.: it was higher before the drops.`]),
    'num', right, `Yes: ${hq(right, 'dec')} in. higher than now.`, [
      { v: qNeg(right), mc: MC.anyNeg, say: `${t} days ago the drops had not happened yet, so the level was HIGHER: (${M}${t}) × (${M}${hq(rate, 'dec')}) = ${hq(right, 'dec')}.` },
    ], `Time before now is negative: (${M}${t}) × (${M}${hq(rate, 'dec')}).`);
  }
  const fee = dq(pick(R, [1.5, 2.25, 3.75, 2.5, 4.5])), wk = int(R, 3, 8), right = qNeg(qMul(fee, q(wk)));
  return typed(base(`A bank account charges a fee of ${A(`$${val(fee).toFixed(2)} every week`)}. What is the change in the balance after ${B(`${wk} weeks`)}?`, `${wk} \\times (-${tq(fee, 'dec')}) = \\,?`, 'dollars',
    [`Each fee is ${M}$${val(fee).toFixed(2)}; ${wk} weeks: ${wk} × (${M}${hq(fee, 'dec')}).`, `= ${S(hq(right, 'dec'))} dollars.`]),
  'num', right, `Yes: the balance changes by ${M}$${Math.abs(val(right)).toFixed(2)}.`, [
    { v: qNeg(right), mc: MC.meaning, say: `Fees take money away: the change is negative, ${hq(right, 'dec')}.` },
    { v: qAdd(q(wk), qNeg(fee)), mc: MC.addRules, say: `${wk} fees of ${M}$${val(fee).toFixed(2)} is a product: ${wk} × (${M}${hq(fee, 'dec')}).` },
  ], `${wk} fees of ${M}$${val(fee).toFixed(2)} each: multiply.`);
};

// 24. multi-step word problems [apply-multi-step]
const storyMulti: Gen = (R, n) => {
  const mode = pick(R, ['avgTemp', 'account', 'hike', 'dive'] as const);
  const base = (prompt: string, board: string, unit: string, solution: string[]): Base => ({ id: `sm-${n}`, family: 'storyMulti', prompt, board, unit, solution });
  const unsigned = (right: Q, say: string): Wrong[] => (sgn(right) < 0 ? [{ v: qAbs(right), mc: MC.unsigned, say }] : []);
  if (mode === 'avgTemp') {
    const h = int(R, 2, 6), per = dq(-pick(R, [1.5, 2, 2.5, 3, 4, 3.5])), t0 = int(R, 2, 12), t1 = qAdd(q(t0), qMul(per, q(h)));
    return typed(base(`At noon it was ${A(`${t0} °F`)}. By ${h} p.m. it was ${A(`${hq(t1, 'dec')} °F`)}. What was the average change per hour?`, `\\dfrac{${tq(t1, 'dec')} - ${t0}}{${h}} = \\,?`, '°F per hour',
      [`Change: ${hq(t1, 'dec')} − ${t0} = ${hq(qMul(per, q(h)), 'dec')} °F in ${h} hours.`, `${hq(qMul(per, q(h)), 'dec')} ÷ ${h} = ${S(hq(per, 'dec'))} °F per hour.`]),
    'num', per, `Yes: ${hq(per, 'dec')} °F per hour, it got colder.`, unsigned(per, `It got colder, so the change is negative: ${hq(per, 'dec')}.`), `Find the change (end − start), then divide by the hours.`);
  }
  if (mode === 'account') {
    const s = int(R, 10, 40), k = int(R, 2, 4), w = dq(pick(R, [12.5, 15, 18.25, 20, 14.75])), d = int(R, 2, 10);
    const right = qAdd(qSub(q(s), qMul(q(k), w)), q(d));
    if (sgn(right) >= 0) return storyMulti(R, n);
    return typed(base(`An account has ${A(`$${s}`)}. Then ${B(`${k} withdrawals of $${val(w).toFixed(2)}`)} are made, and a deposit of $${d}. What is the balance now? (an overdrawn balance is negative)`, `${s} + ${k}(-${tq(w, 'dec')}) + ${d} = \\,?`, 'dollars',
      [`${k} withdrawals: ${k} × (${M}${hq(w, 'dec')}) = ${hq(qNeg(qMul(q(k), w)), 'dec')}.`, `${s} + (${hq(qNeg(qMul(q(k), w)), 'dec')}) + ${d} = ${S(hq(right, 'dec'))} dollars: overdrawn.`]),
    'num', right, `Yes: ${hq(right, 'dec')} dollars, the account is overdrawn.`, unsigned(right, `The account is below 0: write the balance with its sign, ${hq(right, 'dec')}.`), `Start, add the signed withdrawals, add the deposit.`);
  }
  if (mode === 'hike') {
    const e = int(R, 2, 12) * 10, r = int(R, 2, 6) * 5, m = int(R, 3, 8), c = int(R, 1, 6) * 5;
    const right = q(e - r * m + c);
    if (right.p >= 0) return storyMulti(R, n);
    return typed(base(`A hiker in Death Valley starts at ${A(`${e} ft`)} above sea level, walks down ${B(`${r} ft per minute for ${m} minutes`)}, then climbs ${c} ft. What is her elevation now (below sea level is negative)?`, `${e} + ${m}(-${r}) + ${c} = \\,?`, 'ft',
      [`Down: ${m} × (${M}${r}) = ${M}${r * m} ft.`, `${e} + (${M}${r * m}) + ${c} = ${S(ni(right.p))} ft: below sea level.`]),
    'num', right, `Yes: ${ni(right.p)} ft, below sea level.`, unsigned(right, `Below sea level is negative: ${ni(right.p)} ft.`), `Start, add the signed change (${m} × (${M}${r})), add the climb.`);
  }
  const start = -int(R, 5, 20), rate = dq(pick(R, [1.5, 2.5, 2, 3])), s = int(R, 2, 6), up = int(R, 2, 9);
  const right = qAdd(qAdd(q(start), qMul(q(s), qNeg(rate))), q(up));
  if (sgn(right) >= 0) return storyMulti(R, n);
  return typed(base(`A diver is at ${A(`${ni(start)} ft`)}. She sinks ${B(`${hq(rate, 'dec')} ft per second for ${s} seconds`)}, then rises ${up} ft. Where is she now?`, `${start} + ${s}(-${tq(rate, 'dec')}) + ${up} = \\,?`, 'ft',
    [`Sinking: ${s} × (${M}${hq(rate, 'dec')}) = ${hq(qNeg(qMul(q(s), rate)), 'dec')} ft.`, `${ni(start)} + (${hq(qNeg(qMul(q(s), rate)), 'dec')}) + ${up} = ${S(hq(right, 'dec'))} ft.`]),
  'num', right, `Yes: ${hq(right, 'dec')} ft.`, unsigned(right, `She is below the surface: ${hq(right, 'dec')} ft.`), `Start, add the signed sinking, add the rise.`);
};

// =====================================================================================================
// 25. judge sign and size by estimation [reasonableness-estimate]
const estimate: Gen = (R, n) => {
  const mode = pick(R, ['sign', 'size', 'ok', 'near'] as const);
  const a = int(R, 2, 9), b = int(R, 2, 9) * (R() < 0.3 ? 10 : 1);
  const da = pick(R, [-0.1, 0.1, -0.2, 0.2]), db = pick(R, [-0.1, 0.1, 0.2, -0.2]);
  const x = dq(-(a + da)), y = dq(b + db), exact = qMul(x, y), est = -a * b;
  const base = (prompt: string, board: string, solution: string[]): Base => ({ id: `es-${n}`, family: 'estimate', prompt, board, solution });
  const e = `${hp(x, 'dec')} × ${hq(y, 'dec')}`;
  if (mode === 'near') {
    const c = dq(Math.round((-val(exact) + pick(R, [0.05, -0.05, 0.08, -0.07])) * 100) / 100);
    const sum = qAdd(exact, c);
    if (sum.p === 0) return estimate(R, n);
    const pos = sgn(sum) > 0;
    return choose(base(`Is ${A(`${e} + ${hq(c, 'dec')}`)} positive or negative?`, `${tp(x, 'dec')} \\times ${tq(y, 'dec')} + ${tq(c, 'dec')}`, [`The estimate (${M}${a})(${b}) + ${Math.round(val(c))} ≈ 0 is too rough to decide.`, `Exactly: ${hq(exact, 'dec')} + ${hq(c, 'dec')} = ${hq(sum, 'dec')}, ${S(pos ? 'positive' : 'negative')}.`]), R, [
      { t: 'Positive', ok: pos, say: pos ? `Yes: exactly ${hq(sum, 'dec')}. The estimate ≈ 0 could not decide it.` : `Estimate ≈ 0, so compute exactly: ${hq(sum, 'dec')}, negative.` },
      { t: 'Negative', ok: !pos, say: !pos ? `Yes: exactly ${hq(sum, 'dec')}. The estimate ≈ 0 could not decide it.` : `Estimate ≈ 0, so compute exactly: ${hq(sum, 'dec')}, positive.` },
      { t: `0: the estimate (${M}${a})(${b}) + ${Math.round(val(c))} = 0 settles it`, mc: MC.coarse, say: `An estimate near 0 cannot settle the sign. Exactly: ${hq(sum, 'dec')}.` },
    ], true);
  }
  const shown = mode === 'sign' ? qNeg(exact) : mode === 'size' ? qMul(exact, q(10)) : exact;
  const okk = mode === 'ok';
  return choose(base(`A calculator shows ${A(`${e} = ${hq(shown, 'dec')}`)}. Is that reasonable?`, `${tp(x, 'dec')} \\times ${tq(y, 'dec')} \\overset{?}{=} ${tq(shown, 'dec')}`, [`Estimate: ${hq(x, 'dec')} ≈ ${M}${a} and ${hq(y, 'dec')} ≈ ${b}, so the product ≈ ${ni(est)}: negative, size about ${Math.abs(est)}.`, okk ? `${hq(shown, 'dec')} fits: ${S('reasonable')}.` : `${hq(shown, 'dec')} does not fit: the exact product is ${S(hq(exact, 'dec'))}.`]), R, [
    { t: okk ? `Yes: about (${M}${a})(${b}) = ${ni(est)}` : mode === 'sign' ? `No: about (${M}${a})(${b}) = ${ni(est)}, so the sign is wrong` : `No: about (${M}${a})(${b}) = ${ni(est)}, so it is 10 times too big`, ok: true, say: okk ? 'Yes: the sign and the size match the estimate.' : 'Yes: the estimate catches it.' },
    { t: okk ? `No: a negative times a positive should be bigger` : `Yes: it looks about right`, mc: okk ? undefined : MC.noSizeCheck, say: okk ? `It fits the estimate ${ni(est)} in sign and size.` : `Check against an estimate: (${M}${a})(${b}) = ${ni(est)}. The exact product is ${hq(exact, 'dec')}.` },
    { t: okk ? `No: the answer should be positive` : `No: it should be about ${ni(-est)}`, say: `One negative factor: negative, about ${ni(est)}. The exact product is ${hq(exact, 'dec')}.` },
  ]);
};

export const GENS: Record<FamilyId, Gen> = {
  distribute, jumps, oneNeg, pattern, missing, zero, counters, signPlace, meaning, intMul, signOnly, intDiv, ratMul, ratDiv,
  decimal, sets, compound, powers, strategy, checkQ, argument, evidence, story1, storyMulti, estimate,
};
