// items.ts: practice families for "integer exponents" (grade 8, 8.EE.A.1). Each family is one deep structure; a
// generator receives the sub-goal id and uses that sub-goal's number ranges (topic JSON `cases`). Every wrong answer
// the classifier recognises carries its misconception id (math-curriculum-essentials/misconceptions.json).
// Values are exact (expo.ts: repeated multiplication, never Math.pow). Pure: no DOM, no canvas.
// PROBES records, per item, typical wrong responses and the id they must get (tests).
import { type Gen, type Item, type Response, type Verdict, A, B, S, fr, int, pick, shuffle } from '../../runtime/item';
import { endOnChoice } from '../../runtime/explain';
import { type Q, rat } from '../../../core/math';
import { type Bracket, type MatParams, type Role, type Tile, matFits } from './FactorMat';
import { baseHtml, baseTex, decStr, minus, powHtml, powTex, qNeg, qPow, qSame, readQ, respOf, sup, vHtml, vTex, varHtml, varPow } from './expo';

export type FamilyId = 'prodExp' | 'prodPick' | 'quotExp' | 'quotPick' | 'powPow' | 'powProd' | 'powQuot' | 'negBase' | 'negSame'
  | 'zeroExp' | 'zeroContrast' | 'tenDec' | 'tenExp' | 'negExp' | 'negWhich' | 'minusPair' | 'zeroMix' | 'lawVal' | 'sumPow'
  | 'justify' | 'monoExp' | 'monoPick';
export const FAMILY_NAMES: Record<FamilyId, string> = {
  prodExp: 'Multiply powers',
  prodPick: 'One power, or not?',
  quotExp: 'Divide powers',
  quotPick: 'Pick the quotient',
  powPow: 'Power of a power',
  powProd: 'Power of a product',
  powQuot: 'Power of a fraction',
  negBase: 'Negative and fraction bases',
  negSame: 'Same negative base',
  zeroExp: 'The zero exponent',
  zeroContrast: 'Zero, three ways',
  tenDec: 'Negative powers of 10',
  tenExp: 'Decimals as powers of 10',
  negExp: 'Negative exponents',
  negWhich: 'Which is equal?',
  minusPair: 'The minus sign: inside or outside',
  zeroMix: 'Zero powers in expressions',
  lawVal: 'Use a rule, then evaluate',
  sumPow: 'Power of a sum',
  justify: 'Why the definitions hold',
  monoExp: 'Variables: the exponent',
  monoPick: 'Simplify a monomial',
};

/** the picture the page draws: the factor mat (tiles, groups named by their power) and the readout after a miss */
export interface MatPic extends MatParams { kind: 'mat'; result: string; resultValue?: Q }
export type Pic = MatPic;

export const PROBES = new WeakMap<Item, { r: Response; mc: string }[]>();
const probe = (it: Item, r: Response, mc: string) => { const l = PROBES.get(it) ?? []; l.push({ r, mc }); PROBES.set(it, l); };

const MC = {
  prodMul: 'mc.exponents-roots.product-of-powers-multiplies-exponents',
  sameBase: 'mc.exponents-roots.same-base-combining-operates-on-bases',
  quotDiv: 'mc.exponents-roots.quotient-divides-exponents',
  powAdd: 'mc.exponents-roots.power-of-power-adds-exponents',
  oneProd: 'mc.exponents-roots.powers-only-one-product-factor',
  oneFrac: 'mc.exponents-roots.power-applied-to-one-factor-only',
  evenNeg: 'mc.integers.even-power-of-negative-negative',
  zero0: 'mc.exponents-roots.zero-exponent-as-zero-or-base',
  zeroBase: 'mc.exponents-roots.zero-exponent-as-base',
  negNeg: 'mc.exponents-roots.negative-exponent-makes-negative',
  zerosCount: 'mc.exponents-roots.power-of-ten-by-counting-zeros',
  baseTimes: 'mc.exponents-roots.power-as-base-times-exponent',
  dropSign: 'mc.integers.drops-sign-of-computed-result',
  minusRead: 'mc.exponents-roots.confuses-negative-power-notation',
  sumPos: 'mc.integers.product-exponent-sum-made-positive',
  subNeg: 'mc.integers.subtract-negative-as-positive',
  anyNeg: 'mc.integers.any-negative-makes-negative',
  overSum: 'mc.functions-concept.function-distributes-over-sum',
  arbitrary: 'mc.exponents-roots.zero-exponent-definition-seen-as-arbitrary',
  examples: 'mc.reasoning-language.examples-as-proof',
  diffBase: 'mc.exponents-roots.combines-powers-with-different-bases',
} as const;

// ---------- checking ----------
interface W { v: Q; mc?: string; say: string }
type In = 'num' | 'frac';
const ASK_NUM = 'Type a number, like −3 or 0.25.';
const ASK_FRAC = 'Type a fraction: a minus sign goes in the top box, and the bottom box cannot be 0.';
const FRAC_NOTE = ' <span class="hint">(a minus sign goes in the top box)</span>';
function classify(r: Response, want: Q, input: In, okSay: string, wrongs: readonly W[], fallback: string): Verdict {
  const v = readQ(r);
  if (!v) return { ok: false, say: input === 'num' ? ASK_NUM : ASK_FRAC };
  if (qSame(v, want)) return { ok: true, say: okSay };
  for (const w of wrongs) if (qSame(v, w.v)) return { ok: false, mc: w.mc, say: w.say };
  return { ok: false, say: fallback };
}
interface Base { id: string; family: FamilyId; prompt: string; board: string; solution: string[]; picture?: Pic }
/** an item whose answer is a number (an exponent, or a value): the wrong answers in order, first match wins */
function valItem(o: Base, want: Q, input: In, okSay: string, wrongs: W[], fallback: string): Item {
  const ws = wrongs.filter((w, i) => !qSame(w.v, want) && wrongs.findIndex(x => qSame(x.v, w.v)) === i);
  const it: Item = { ...o, picture: o.picture as Record<string, unknown> | undefined, prompt: o.prompt + (input === 'frac' ? FRAC_NOTE : ''), input, answer: respOf(want, input), check: r => classify(r, want, input, okSay, ws, fallback) };
  for (const w of ws) if (w.mc && (input === 'frac' || decStr(w.v) !== null)) probe(it, respOf(w.v, input), w.mc);
  return it;
}
/** the answer box for a value: integers and decimals in a number box, other fractions in fraction boxes */
const inputFor = (v: Q, decOk = false): In => (v.q === 1 || (decOk && decStr(v) !== null) ? 'num' : 'frac');
const Z = (n: number) => rat(n);

interface Opt { t: string; ok?: boolean; say: string; mc?: string }
function choiceItem(o: Base, R: () => number, opts: Opt[]): Item {
  const sh = shuffle(R, opts.slice());
  const right = sh.findIndex(x => x.ok);
  const it: Item = {
    ...o, solution: endOnChoice(o.solution, sh[right]!.t), picture: o.picture as Record<string, unknown> | undefined, input: 'choice', choices: sh.map(x => x.t), answer: { kind: 'choice', i: right },
    check: r => {
      if (r.kind !== 'choice' || !sh[r.i]) return { ok: false, say: 'Pick one answer.' };
      const x = sh[r.i]!;
      return { ok: r.i === right, mc: r.i === right ? undefined : x.mc, say: x.say };
    },
  };
  sh.forEach((x, i) => { if (!x.ok && x.mc) probe(it, { kind: 'choice', i }, x.mc); });
  return it;
}

// ---------- shared pieces ----------
const B10 = Z(10);
/** a power whose EXPONENT is the marked answer ("Type the exponent": the steps card reads the exponent, not 3^6 as 36) */
const PS = (b: Q, n: number) => `${baseHtml(b)}<sup>${S(minus(n))}</sup>`;
const VS = (x: string, n: number) => `<i>${x}</i><sup>${S(minus(n))}</sup>`;
/** a signed number after + or −, in parentheses when negative: 2 + (−5), never 2 + −5 */
/** "1 factor", "3 factors" */
const nf = (n: number) => `${n} factor${n === 1 ? '' : 's'}`;
const par = (n: number) => (n < 0 ? `(${minus(n)})` : String(n));
const P = (b: Q, n: number | string) => powHtml(b, n);
const T = (b: Q, n: number | string) => powTex(b, n);
const times = ' × ';
/** a list of a base's factors in words for solutions: "2 × 2 × 2" */
const factors = (b: Q, n: number) => Array.from({ length: n }, () => baseHtml(b)).join(' × ');
const VARS = ['x', 'y', 'a', 'n', 'm', 'k'];

/** the factor mat for a product / quotient of powers of ONE whole base: positive powers on top, negative below */
export function lawMat(b: number, groups: { exp: number; label: string; div?: boolean }[], result: string, resultValue?: Q): MatPic | undefined {
  const top: Tile[] = [], bottom: Tile[] = [], brackets: Bracket[] = [];
  const lab = String(b);
  groups.forEach((g, gi) => {
    const col: Role = gi % 2 === 0 ? 'first' : 'second';
    const below = g.div ? g.exp > 0 : g.exp < 0;
    const row = below ? bottom : top, n = Math.abs(g.exp);
    if (n === 0) return;
    const from = row.length;
    for (let i = 0; i < n; i++) row.push({ label: lab, col });
    brackets.push({ key: `g${gi}`, row: below ? 'bottom' : 'top', from, to: from + n - 1, label: g.label, col });
  });
  if (top.length + bottom.length === 0) return undefined;
  const pic: MatPic = { kind: 'mat', top, bottom, cancel: Math.min(top.length, bottom.length), brackets, bar: bottom.length > 0 || top.length === 0, result, resultValue };
  return matFits(pic) ? pic : undefined;
}

// =====================================================================================================
// 1. a^m x a^n as one power  [product-rule-positive, product-rule-integer]
function prodBase(R: () => number, sg?: string): Q {
  if (sg === 'product-rule-integer') return Z(pick(R, [2, 3, 5, 10, 10]));
  const r = R();
  return r < 0.3 ? B10 : r < 0.85 ? Z(pick(R, [2, 3, 5, 7])) : pick(R, [rat(1, 2), rat(2, 3)]);
}
function intPair(R: () => number): [number, number] {
  for (;;) {
    const m = int(R, -6, 6), n = int(R, -6, 6);
    if (m === 0 || n === 0 || (m > 0 && n > 0)) continue;
    return [m, n];
  }
}
const prodExp: Gen = (R, n, sg) => {
  const b = prodBase(R, sg);
  const [m, k] = sg === 'product-rule-integer' ? intPair(R) : [int(R, 1, 5), int(R, 1, 5)];
  const s = m + k;
  const pic = b.q === 1 ? lawMat(b.p, [{ exp: m, label: T(b, m) }, { exp: k, label: T(b, k) }], `= ${T(b, s)}${s === 0 ? ' = 1' : ''}`) : undefined;
  const wrongs: W[] = [
    { v: Z(m * k), mc: MC.prodMul, say: `Multiplying the exponents is the rule for a power of a power. Here you multiply ${P(b, m)} by ${P(b, k)}: count the factors, ${minus(m)} + ${par(k)} = ${minus(s)}.` },
    ...(s < 0 ? [{ v: Z(-s), mc: MC.sumPos, say: `${minus(m)} + ${par(k)} is ${minus(s)}, not ${-s}: there are more factors below the bar than on top, so the exponent stays negative.` }] : []),
  ];
  return valItem({
    id: `pe-${n}`, family: 'prodExp',
    prompt: `Write ${A(P(b, m))} × ${B(P(b, k))} as one power of ${baseHtml(b)}. Type the exponent.`,
    board: `${T(b, m)} \\times ${T(b, k)} = ${baseTex(b)}^{\\,?}`,
    solution: [
      m > 0 && k > 0 ? `${P(b, m)} is ${m} factor${m > 1 ? 's' : ''} of ${baseHtml(b)}, ${P(b, k)} is ${k} more: ${nf(m + k)} in all.` : `A negative exponent puts its factors below the bar; each factor on top cancels one below.`,
      `Same base, multiply: add the exponents. ${minus(m)} + ${par(k)} = ${minus(s)}.`,
      `So ${P(b, m)} × ${P(b, k)} = ${PS(b, s)}.`,
    ],
    picture: pic,
  }, Z(s), 'num', `Yes: ${minus(m)} + ${par(k)} = ${minus(s)}, so it is ${P(b, s)}.`, wrongs, `Same base, so add the exponents: ${minus(m)} + ${par(k)} = ${minus(s)}.`);
};

// 2. one power or not? [product-rule-positive]
const prodPick: Gen = (R, n) => {
  if (R() < 0.35) {
    // unequal bases cannot be combined
    const [a, c] = shuffle(R, [2, 3, 5]).slice(0, 2) as [number, number], m = int(R, 2, 3), k = int(R, 2, 3);
    const va = qPow(Z(a), m).p, vc = qPow(Z(c), k).p;
    return choiceItem({
      id: `pp-u-${n}`, family: 'prodPick',
      prompt: `What is ${A(P(Z(a), m))} × ${B(P(Z(c), k))}?`, board: `${T(Z(a), m)} \\times ${T(Z(c), k)}`,
      solution: [`The bases are different (${a} and ${c}), so there is no single power to add exponents for.`, `Work it out: ${va} × ${vc} = ${va * vc}.`],
    }, R, [
      { t: `${va * vc}: the bases differ, so it is not one power`, ok: true, say: `Yes: ${P(Z(a), m)} × ${P(Z(c), k)} = ${va} × ${vc} = ${va * vc}. The rule "add the exponents" only works for the same base.` },
      { t: `${a * c}${sup(m + k)}`, mc: MC.diffBase, say: `${a * c}${sup(m + k)} multiplies the bases and adds the exponents, but the factors are ${a}s and ${c}s, not ${a * c}s. Work it out: ${va} × ${vc} = ${va * vc}.` },
      { t: `${a}${sup(m + k)}`, say: `That treats every factor as a ${a}, but ${k} of them are ${c}s. ${va} × ${vc} = ${va * vc}.` },
    ]);
  }
  const b = pick(R, [2, 3, 5]);
  let m = int(R, 2, 5), k = int(R, 2, 5);
  if (m * k === m + k) k = 3;
  return choiceItem({
    id: `pp-${n}`, family: 'prodPick',
    prompt: `Which is equal to ${A(P(Z(b), m))} × ${B(P(Z(b), k))}?`, board: `${T(Z(b), m)} \\times ${T(Z(b), k)}`,
    solution: [`${nf(m)} of ${b} times ${k} more factors of ${b}: ${nf(m + k)} of ${b}.`, `The base stays ${b}; the exponents add: ${S(P(Z(b), m + k))}.`],
  }, R, [
    { t: `${b}${sup(m + k)}`, ok: true, say: `Yes: ${m} + ${k} = ${nf(m + k)} of ${b}, so ${b}${sup(m + k)}.` },
    { t: `${b * b}${sup(m + k)}`, mc: MC.sameBase, say: `The exponents add, but the base stays ${b}: every factor is still a ${b}, not a ${b * b}. It is ${b}${sup(m + k)}.` },
    { t: `${b}${sup(m * k)}`, mc: MC.prodMul, say: `Multiplying exponents is for a power of a power. Here count the factors: ${m} + ${k} = ${m + k}, so ${b}${sup(m + k)}.` },
    { t: `${b * b}${sup(m * k)}`, mc: MC.sameBase, say: `Both the base and the exponent changed. The base stays ${b} and the exponents add: ${b}${sup(m + k)}.` },
  ]);
};

// 3. a^m / a^n as one power [quotient-rule-positive, quotient-rule-integer]
const quotExp: Gen = (R, n, sg) => {
  const b = Z(pick(R, [2, 3, 5, 10, 10]));
  let m: number, k: number;
  if (sg === 'quotient-rule-integer') {
    for (;;) {
      m = int(R, -6, 6); k = int(R, -6, 6);
      if (m > 0 && k > 0 && m > k) continue;     // stage 1 already did these
      if (m === 0 || k === 0) continue;
      break;
    }
  } else {
    m = int(R, 3, 7); k = int(R, 1, m - 1);
    if (R() < 0.4) { k = pick(R, [2, 3].filter(x => x < m)); m = k * int(R, 2, 3); if (m / k === m - k) m += k; }
  }
  const d = m - k;
  const bar = R() < 0.5;
  const board = bar ? `\\frac{${T(b, m)}}{${T(b, k)}} = ${baseTex(b)}^{\\,?}` : `${T(b, m)} \\div ${T(b, k)} = ${baseTex(b)}^{\\,?}`;
  const pic = m > 0 && k > 0 ? lawMat(b.p, [{ exp: m, label: T(b, m) }, { exp: k, label: T(b, k), div: true }], `= ${T(b, d)}${d === 0 ? ' = 1' : ''}`) : undefined;
  const wrongs: W[] = [];
  if (Math.abs(k) >= 2 && m % k === 0) wrongs.push({ v: Z(m / k), mc: MC.quotDiv, say: `Dividing powers does not divide the exponents. Cancel factors: ${minus(m)} − ${k < 0 ? `(${minus(k)})` : k} = ${minus(d)}.` });
  if (k < 0) wrongs.push({ v: Z(m + k), mc: MC.subNeg, say: `Subtracting ${minus(k)} is adding ${-k}: ${minus(m)} − (${minus(k)}) = ${minus(m)} + ${-k} = ${minus(d)}. Dividing by a negative power puts its factors back on top.` });
  if (d < 0) wrongs.push({ v: Z(-d), mc: MC.dropSign, say: `More factors are below the bar than on top, so what is left divides: the exponent is ${minus(d)}, not ${-d}.` });
  wrongs.push({ v: Z(m + k), say: `Adding exponents is for multiplying. Dividing subtracts: ${minus(m)} − ${k < 0 ? `(${minus(k)})` : k} = ${minus(d)}.` });
  return valItem({
    id: `qe-${n}`, family: 'quotExp',
    prompt: `Write ${A(P(b, m))} ÷ ${B(P(b, k))} as one power of ${baseHtml(b)}. Type the exponent.`, board,
    solution: [
      m > 0 && k > 0 ? `${nf(m)} of ${baseHtml(b)} on top, ${k} below the bar; each pair cancels (${baseHtml(b)} ÷ ${baseHtml(b)} = 1).` : `Dividing by ${P(b, k)} undoes multiplying by it, so subtract its exponent.`,
      `Same base, divide: subtract the exponents. ${minus(m)} − ${k < 0 ? `(${minus(k)})` : k} = ${minus(d)}.`,
      `So it is ${PS(b, d)}.`,
    ],
    picture: pic,
  }, Z(d), 'num', `Yes: ${minus(m)} − ${k < 0 ? `(${minus(k)})` : k} = ${minus(d)}, so ${P(b, d)}.`, wrongs, `Same base, so subtract the exponents: ${minus(m)} − ${k < 0 ? `(${minus(k)})` : k} = ${minus(d)}.`);
};

// 4. pick the quotient [quotient-rule-positive, power-of-a-quotient]
const quotPick: Gen = (R, n, sg) => {
  if (sg === 'power-of-a-quotient') {
    const [a, c] = pick(R, [[2, 3], [3, 4], [2, 5], [3, 5], [4, 5]] as [number, number][]);
    const e = int(R, 2, 3), neg = R() < 0.65;
    const ex = neg ? -e : e;
    const base = rat(a, c);
    const ok = neg ? `${fr(`${c}${sup(e)}`, `${a}${sup(e)}`)}` : `${fr(`${a}${sup(e)}`, `${c}${sup(e)}`)}`;
    const one = neg ? `${fr(`${c}${sup(e)}`, a)}` : `${fr(`${a}${sup(e)}`, c)}`;
    const negv = neg ? `−${fr(`${a}${sup(e)}`, `${c}${sup(e)}`)}` : `${fr(`${a}`, `${c}`)}${times}${e}`;
    const other = neg ? `${fr(`${a}${sup(e)}`, `${c}${sup(e)}`)}` : `${fr(`${a}${sup(e)}`, `${a}${sup(e - 1)}`)}`;
    return choiceItem({
      id: `qp-f-${n}`, family: 'quotPick',
      prompt: `Which is equal to ${A(P(base, ex))}?`, board: T(base, ex),
      solution: neg
        ? [`A negative exponent flips the fraction: ${P(base, ex)} = ${P(rat(c, a), e)}.`, `Then the power goes to the top AND the bottom: ${S(ok)}.`]
        : [`(${fr(a, c)})${sup(e)} is ${nf(e)} of ${fr(a, c)}.`, `The power goes to the top AND the bottom: (${fr(a, c)})${sup(e)} = ${S(ok)}.`],
    }, R, [
      { t: ok, ok: true, say: neg ? `Yes: flip the fraction, then raise both parts: ${ok}.` : `Yes: ${nf(e)} of ${fr(a, c)} give ${a}${sup(e)} on top and ${c}${sup(e)} below.` },
      { t: one, mc: MC.oneFrac, say: `The power belongs to the whole fraction, so the bottom is raised too: ${ok}.` },
      { t: negv, mc: neg ? MC.negNeg : MC.baseTimes, say: neg ? `A negative exponent does not make the value negative: it flips the fraction. ${ok}.` : `An exponent counts factors; it does not multiply by ${e}. ${ok}.` },
      { t: other, say: neg ? `That forgot the flip: a negative exponent turns ${fr(a, c)} into ${fr(c, a)}. ${ok}.` : `That divides two powers of ${a}. Raising a fraction to a power raises the top and the bottom: ${ok}.` },
    ]);
  }
  const b = pick(R, [2, 3, 5, 10]);
  const [m, k] = pick(R, [[6, 2], [8, 4], [6, 3], [9, 3], [8, 2], [10, 2], [10, 5]] as [number, number][]);
  return choiceItem({
    id: `qp-${n}`, family: 'quotPick',
    prompt: `Which is equal to ${A(P(Z(b), m))} ÷ ${B(P(Z(b), k))}?`, board: `\\frac{${T(Z(b), m)}}{${T(Z(b), k)}}`,
    solution: [`${nf(m)} of ${b} on top, ${k} below: ${k} pairs cancel.`, `${nf(m - k)} of ${b} are left: ${S(`${b}${sup(m - k)}`)}.`],
  }, R, [
    { t: `${b}${sup(m - k)}`, ok: true, say: `Yes: ${k} pairs cancel and ${nf(m - k)} of ${b} are left.` },
    { t: `${b}${sup(m / k)}`, mc: MC.quotDiv, say: `Dividing powers subtracts the exponents; it does not divide them. ${m} − ${k} = ${m - k}: ${b}${sup(m - k)}.` },
    { t: `1${sup(m - k)}`, mc: MC.sameBase, say: `The base stays ${b}: only the exponents change. ${b}${sup(m - k)}.` },
    { t: `${b}${sup(m + k)}`, say: `Adding exponents is for multiplying. Dividing cancels factors: ${b}${sup(m - k)}.` },
  ]);
};

// 5. power of a power [power-rules-whole, power-of-a-power]
const powPow: Gen = (R, n, sg) => {
  const b = Z(pick(R, [2, 3, 5, 10]));
  let m: number, k: number;
  if (sg === 'power-of-a-power') {
    for (;;) {
      m = int(R, -4, 4); k = int(R, -3, 3);
      if (k === 0 && R() < 0.7) continue;
      if (m > 0 && k > 0 && R() < 0.85) continue;
      if (m === 0 && k === 0) continue;
      break;
    }
    if (R() < 0.12) { m = 0; k = int(R, 2, 4); }
  } else {
    m = int(R, 2, 4); k = int(R, 2, 4);
    if (m === 2 && k === 2) k = 3;
  }
  const e = m * k + 0;   // + 0: (3^0)^−2 is 3^0, not 3^−0
  // the picture: k groups of m tiles (m and k small, k > 0)
  let pic: MatPic | undefined;
  if (k > 0 && m !== 0 && b.p !== 10 && Math.abs(m) * k <= 8) {
    pic = lawMat(b.p, Array.from({ length: k }, () => ({ exp: m, label: T(b, m) })), `= ${T(b, e)}`);
  }
  const wrongs: W[] = [{ v: Z(m + k), mc: MC.powAdd, say: `Adding exponents is for multiplying two powers. Here ${P(b, m)} is used ${k < 0 ? `with exponent ${minus(k)}` : `${k} times`}: multiply, ${minus(m)} × ${minus(k)} = ${minus(e)}.` }];
  if (m < 0 && k < 0) wrongs.push({ v: Z(-e), mc: MC.anyNeg, say: `A negative times a negative is positive: ${minus(m)} × (${minus(k)}) = ${e}.` });
  if (m * k !== 0 && (m < 0) !== (k < 0)) wrongs.push({ v: Z(-e), mc: MC.dropSign, say: `${minus(m)} × ${minus(k)} is negative: ${minus(e)}.` });
  const v = valItem({
    id: `pw-${n}`, family: 'powPow',
    prompt: `Write ${A(`(${P(b, m)})${sup(k)}`)} as one power of ${baseHtml(b)}. Type the exponent.`,
    board: `\\left(${T(b, m)}\\right)^{${k}} = ${baseTex(b)}^{\\,?}`,
    solution: [
      k > 0 ? `(${P(b, m)})${sup(k)} is ${nf(k)} of ${P(b, m)}: ${Array.from({ length: k }, () => P(b, m)).join(' × ')}.` : `The rule (a${sup('m')})${sup('n')} = a${sup('mn')} still holds for zero and negative exponents.`,
      `Multiply the exponents: ${minus(m)} × ${k < 0 ? `(${minus(k)})` : k} = ${minus(e)}.`,
      `So it is ${PS(b, e)}.`,
    ],
    picture: pic,
  }, Z(e), 'num', `Yes: ${minus(m)} × ${k < 0 ? `(${minus(k)})` : k} = ${minus(e)}, so ${P(b, e)}.`, wrongs, `A power of a power multiplies the exponents: ${minus(m)} × ${k < 0 ? `(${minus(k)})` : k} = ${minus(e)}.`);
  return v;
};

// 6. power of a product [power-rules-whole, power-of-a-product]
const powProd: Gen = (R, n, sg) => {
  if (sg === 'power-of-a-product') {
    const r = R();
    if (r < 0.5) {
      // (c x 10^k)^e  = c^e x 10^(ke)
      let c = pick(R, [2, 3, 4, 5]), k = int(R, 2, 4); const e = pick(R, [2, 3]);
      if (c === 2 && e === 2) c = 3;
      if (c >= 4 && e === 3) k = 2;
      if (k === 2 && e === 2) k = 3;
      const ce = qPow(Z(c), e).p;
      return choiceItem({
        id: `pd-s-${n}`, family: 'powProd',
        prompt: `Which is equal to ${A(`(${c} × 10${sup(k)})${sup(e)}`)}?`, board: `\\left(${c} \\times 10^{${k}}\\right)^{${e}}`,
        solution: [`The power goes to EVERY factor: ${c}${sup(e)} × (10${sup(k)})${sup(e)}.`, `${c}${sup(e)} = ${ce} and (10${sup(k)})${sup(e)} = 10${sup(k * e)}.`, `So it is ${S(`${ce} × 10${sup(k * e)}`)}.`],
      }, R, [
        { t: `${ce} × 10${sup(k * e)}`, ok: true, say: `Yes: both factors are raised: ${c}${sup(e)} = ${ce} and (10${sup(k)})${sup(e)} = 10${sup(k * e)}.` },
        { t: `${c} × 10${sup(k * e)}`, mc: MC.oneProd, say: `The power applies to the ${c} too: ${c}${sup(e)} = ${ce}. So ${ce} × 10${sup(k * e)}.` },
        { t: `${ce} × 10${sup(k + e)}`, mc: MC.powAdd, say: `(10${sup(k)})${sup(e)} multiplies the exponents: ${k} × ${e} = ${k * e}, so ${ce} × 10${sup(k * e)}.` },
        { t: `${c * e} × 10${sup(k * e)}`, mc: MC.baseTimes, say: `${c}${sup(e)} is ${Array.from({ length: e }, () => c).join(' × ')} = ${ce}, not ${c} × ${e}. So ${ce} × 10${sup(k * e)}.` },
      ]);
    }
    // (a x b)^-e, a or b may be negative
    const [a0, c] = pick(R, [[2, 3], [2, 5], [3, 4], [-2, 5], [2, -3], [-3, 2]] as [number, number][]);
    const e = a0 < 0 || c < 0 ? 1 : 2;
    const prod = a0 * c, pv = qPow(Z(prod), e).p;
    const pw = (x: number) => (e === 1 ? baseHtml(Z(x)) : `${baseHtml(Z(x))}${sup(e)}`);
    const ok = `${fr(1, `${pw(a0)} × ${pw(c)}`)} = ${vHtml(rat(1, pv))}`;
    const opts: Opt[] = [
      { t: ok, ok: true, say: `Yes: both factors are raised, and the negative exponent puts them below the bar: ${vHtml(rat(1, pv))}.` },
      { t: `${baseHtml(Z(a0))} × ${fr(1, pw(c))}`, mc: MC.oneProd, say: `The power applies to the ${minus(a0)} too. Both factors go below the bar: ${vHtml(rat(1, pv))}.` },
      { t: minus(-Math.abs(pv)), mc: MC.negNeg, say: `A negative exponent does not make a number negative; it puts the factors below the bar: ${vHtml(rat(1, pv))}.` },
      pv < 0
        ? { t: vHtml(rat(1, -pv)), mc: MC.dropSign, say: `One negative factor below the bar keeps the value negative: ${vHtml(rat(1, pv))}.` }
        : { t: minus(prod * -e), mc: MC.baseTimes, say: `An exponent is not a factor. (${minus(prod)})${sup(-e)} is 1 over (${minus(prod)})${sup(e)}: ${vHtml(rat(1, pv))}.` },
    ];
    return choiceItem({
      id: `pd-n-${n}`, family: 'powProd',
      prompt: `Which is equal to ${A(`(${minus(a0)} × ${minus(c)})${sup(-e)}`)}?`, board: `\\left(${a0} \\times ${c < 0 ? `(${c})` : c}\\right)^{-${e}}`,
      solution: [`The power goes to both factors: ${baseHtml(Z(a0))}${sup(-e)} × ${baseHtml(Z(c))}${sup(-e)}.`, `A negative exponent means 1 over the positive power: ${ok}.`],
    }, R, opts);
  }
  const [a, c] = shuffle(R, [2, 3, 5]).slice(0, 2) as [number, number];
  const e = int(R, 2, 4);
  const top: Tile[] = [], brackets: Bracket[] = [], sort: number[] = [];
  for (let i = 0; i < e; i++) {
    top.push({ label: String(a), col: 'first' }, { label: String(c), col: 'second' });
    brackets.push({ key: `p${i}`, row: 'top', from: 2 * i, to: 2 * i + 1, label: `(${a}\\times${c})`, col: 'pick' });
    sort.push(i, e + i);
  }
  brackets.push({ key: 'afterA', row: 'top', from: 0, to: e - 1, label: `${a}^{${e}}`, col: 'first' }, { key: 'afterC', row: 'top', from: e, to: 2 * e - 1, label: `${c}^{${e}}`, col: 'second' });
  const pic: MatPic = { kind: 'mat', top, bottom: [], sort, brackets, result: `= ${a}^{${e}} \\times ${c}^{${e}}` };
  const va = qPow(Z(a), e).p, vc = qPow(Z(c), e).p;
  return choiceItem({
    id: `pd-${n}`, family: 'powProd',
    prompt: `Which is equal to ${A(`(${a} × ${c})${sup(e)}`)}?`, board: `(${a} \\times ${c})^{${e}}`,
    solution: [`(${a} × ${c})${sup(e)} is ${nf(e)} of (${a} × ${c}).`, `Regroup: ${nf(e)} of ${a} and ${nf(e)} of ${c}: ${S(`${a}${sup(e)} × ${c}${sup(e)}`)} = ${va} × ${vc} = ${va * vc}.`],
    picture: matFits(pic) ? pic : undefined,
  }, R, [
    { t: `${a}${sup(e)} × ${c}${sup(e)}`, ok: true, say: `Yes: every factor is raised. ${a}${sup(e)} × ${c}${sup(e)} = ${va * vc}.` },
    { t: `${a} × ${c}${sup(e)}`, mc: MC.oneProd, say: `The power goes to the ${a} too: there are ${nf(e)} of ${a}, not one. ${a}${sup(e)} × ${c}${sup(e)}.` },
    { t: `${a}${sup(e)} + ${c}${sup(e)}`, say: `The ${a}s and ${c}s are multiplied, not added: ${a}${sup(e)} × ${c}${sup(e)}.` },
    { t: `${a * c} × ${e}`, mc: MC.baseTimes, say: `An exponent counts factors; it does not multiply by ${e}. ${a}${sup(e)} × ${c}${sup(e)} = ${va * vc}.` },
  ]);
};

// 7. power of a fraction, as a value [power-rules-whole, power-of-a-quotient]
const powQuot: Gen = (R, n, sg) => {
  const pairs: [number, number][] = [[1, 2], [2, 3], [3, 4], [2, 5], [3, 5], [1, 3], [4, 5], [5, 2], [3, 2], [1, 4], [1, 5], [2, 7], [3, 7], [5, 3], [5, 6], [7, 2], [4, 3], [1, 6], [5, 4], [3, 8], [1, 7], [2, 9], [7, 3]];
  let [a, c] = pick(R, pairs);
  let e = int(R, 2, 3);
  if (sg === 'power-of-a-quotient') {
    e = -int(R, 1, 3);
    if (R() < 0.35) { a = -a; if (Math.abs(e) === 3 && Math.abs(a) > 2) e = -2; }
    if (Math.abs(e) === 3 && (Math.abs(a) > 3 || c > 3)) e = -2;
  } else if (e === 3 && (a > 5 || c > 5)) e = 2;
  const base = rat(a, c), want = qPow(base, e);
  const ae = Math.abs(e);
  const powA = qPow(Z(Math.abs(a)), ae).p, powC = qPow(Z(c), ae).p;
  const wrongs: W[] = [];
  if (e > 0) {
    wrongs.push({ v: rat(powA * Math.sign(a), c), mc: MC.oneFrac, say: `The power goes to the bottom too: ${fr(`${a}${sup(e)}`, `${c}${sup(e)}`)} = ${vHtml(want)}.` });
    wrongs.push({ v: rat(a * e, c), mc: MC.baseTimes, say: `An exponent counts factors: (${fr(a, c)})${sup(e)} = ${Array.from({ length: e }, () => fr(a, c)).join(' × ')} = ${vHtml(want)}.` });
  } else {
    wrongs.push({ v: qNeg(want), mc: (a < 0 && ae % 2 === 0) ? MC.evenNeg : (a < 0 ? MC.dropSign : MC.negNeg), say: a < 0 ? (ae % 2 === 0 ? `An even number of negative factors makes a positive: ${vHtml(want)}.` : `An odd number of negative factors stays negative: ${vHtml(want)}.`) : `A negative exponent flips the fraction; it does not make it negative: ${vHtml(want)}.` });
    if (a > 0) wrongs.push({ v: qNeg(qPow(base, ae)), mc: MC.negNeg, say: `A negative exponent flips the fraction; it does not make it negative: ${vHtml(want)}.` });
    if (Math.abs(a) !== 1) wrongs.push({ v: rat(powC * (a < 0 && ae % 2 ? -1 : 1), Math.abs(a)), mc: MC.oneFrac, say: `After the flip, raise the top AND the bottom: ${vHtml(want)}.` });
    wrongs.push({ v: qPow(base, ae), say: `That is (${vHtml(base)})${sup(ae)}. The negative exponent flips it: ${vHtml(want)}.` });
  }
  const input = inputFor(want);
  return valItem({
    id: `pq-${n}`, family: 'powQuot',
    prompt: `What is ${A(P(base, e))}?`, board: `${T(base, e)} = \\ ?`,
    solution: e > 0
      ? [`(${vHtml(base)})${sup(e)} is ${nf(e)} of ${vHtml(base)}.`, `Multiply the tops and the bottoms: ${fr(`${a}${sup(e)}`, `${c}${sup(e)}`)} = ${S(vHtml(want))}.`]
      : [`A negative exponent flips the fraction: (${vHtml(base)})${sup(e)} = (${vHtml(rat(c, a))})${sup(ae)}.`, `Raise the top and the bottom: ${S(vHtml(want))}.`],
  }, want, input, `Yes: ${P(base, e)} = ${vHtml(want)}.`, wrongs, `Raise the top and the bottom${e < 0 ? ' after flipping the fraction' : ''}: ${vHtml(want)}.`);
};

// 8. the laws on negative and fraction bases, evaluated [negative-base-whole-laws]
const negBase: Gen = (R, n) => {
  const kind = pick(R, ['prod', 'prod', 'quot', 'pow', 'frac']);
  let base: Q, e: number, board: string, html: string, how: string, pic: MatPic | undefined;
  if (kind === 'prod') {
    const b = -pick(R, [2, 3]);
    const m = int(R, 1, b === -3 ? 3 : 4), k = int(R, 1, b === -3 ? 3 : 4);
    base = Z(b); e = m + k;
    if (e > (b === -3 ? 6 : 7)) return negBase(R, n);
    board = `${T(base, m)} \\times ${T(base, k)} = \\ ?`; html = `${P(base, m)} × ${P(base, k)}`; how = `same base: ${m} + ${k} = ${nf(e)} of (${minus(b)})`;
    pic = lawMat(b, [{ exp: m, label: T(base, m) }, { exp: k, label: T(base, k) }], `= ${T(base, e)} = ${vTex(qPow(base, e))}`);
  } else if (kind === 'quot') {
    const b = -2, m = int(R, 3, 6), k = int(R, 1, m - 1);
    base = Z(b); e = m - k;
    board = `\\frac{${T(base, m)}}{${T(base, k)}} = \\ ?`; html = `${P(base, m)} ÷ ${P(base, k)}`; how = `same base: ${m} − ${k} = ${nf(e)} of (${minus(b)})`;
    pic = lawMat(b, [{ exp: m, label: T(base, m) }, { exp: k, label: T(base, k), div: true }], `= ${T(base, e)} = ${vTex(qPow(base, e))}`);
  } else if (kind === 'pow') {
    base = pick(R, [rat(-1, 2), rat(-1, 3), Z(-2)]);
    const m = int(R, 1, 2), k = int(R, 2, 3);
    e = m * k;
    if (base.q === 3 && e > 4) return negBase(R, n);
    board = `\\left(${T(base, m)}\\right)^{${k}} = \\ ?`; html = `(${P(base, m)})${sup(k)}`; how = `power of a power: ${m} × ${k} = ${e}`;
  } else {
    base = pick(R, [rat(2, 3), rat(3, 4), rat(1, 2), rat(-2, 3)]);
    const m = int(R, 3, 5), k = int(R, 1, m - 1);
    e = m - k;
    if (e > 3) return negBase(R, n);
    board = `\\frac{${T(base, m)}}{${T(base, k)}} = \\ ?`; html = `${P(base, m)} ÷ ${P(base, k)}`; how = `same base: ${m} − ${k} = ${e}`;
  }
  const want = qPow(base, e);
  const neg = base.p < 0;
  const wrongs: W[] = [];
  if (neg) wrongs.push({ v: qNeg(want), mc: e % 2 === 0 ? MC.evenNeg : MC.dropSign, say: e % 2 === 0 ? `${e} negative factors: an even number, so the value is positive: ${vHtml(want)}.` : `${e} negative factors: an odd number, so the value stays negative: ${vHtml(want)}.` });
  const input = inputFor(want);
  return valItem({
    id: `nb-${n}`, family: 'negBase',
    prompt: `Use a rule to write it as one power, then find the value: ${A(html)}.`, board,
    solution: [`The base ${baseHtml(base)} is one factor, in parentheses: the rules work as usual (${how}).`, `${P(base, e)} = ${S(vHtml(want))}${neg ? ` (${e} negative factors: ${e % 2 === 0 ? 'even, so positive' : 'odd, so negative'})` : ''}.`],
    picture: pic,
  }, want, input, `Yes: ${P(base, e)} = ${vHtml(want)}.`, wrongs, `First one power: ${P(base, e)}. Then the value: ${vHtml(want)}.`);
};

// 9. which single power? (negative base) [negative-base-whole-laws]
const negSame: Gen = (R, n) => {
  const b = -pick(R, [2, 3]);
  let m = int(R, 2, 4), k = int(R, 2, 3);
  if (m * k === m + k) m = 3;
  const base = Z(b);
  return choiceItem({
    id: `ns-${n}`, family: 'negSame',
    prompt: `Write ${A(P(base, m))} × ${B(P(base, k))} as one power.`, board: `${T(base, m)} \\times ${T(base, k)}`,
    solution: [`(${minus(b)}) is one factor, used ${m} times and then ${k} more times.`, `Same base, add the exponents: ${S(P(base, m + k))}.`],
  }, R, [
    { t: P(base, m + k), ok: true, say: `Yes: ${m} + ${k} = ${nf(m + k)} of (${b}).` },
    { t: `${b * b}${sup(m + k)}`, mc: MC.sameBase, say: `Every factor is still a (${b}); the base does not change. ${P(base, m + k)}.` },
    { t: P(base, m * k), mc: MC.prodMul, say: `Multiplying the exponents is for a power of a power. Count the factors: ${m} + ${k} = ${m + k}.` },
  ]);
};

// 10. the zero exponent [zero-exponent]
const zeroExp: Gen = (R, n) => {
  const kind = pick(R, ['plain', 'plain', 'quot', 'table']);
  const b = kind === 'plain' ? pick(R, [Z(int(R, 2, 15)), Z(int(R, 2, 15)), Z(pick(R, [20, 25, 50, 100, 1000])), pick(R, [rat(1, 2), rat(1, 3), rat(3, 4), rat(2, 5)])]) : Z(pick(R, [2, 3, 4, 5, 6, 10]));
  let board: string, prompt: string, sol: string[], pic: MatPic | undefined;
  if (kind === 'quot') {
    const k = int(R, 2, 4);
    board = `\\frac{${T(b, k)}}{${T(b, k)}} = ${baseTex(b)}^{\\,?} = \\ ?`; prompt = `${A(P(b, k))} ÷ ${B(P(b, k))} is ${baseHtml(b)} to what power, and what is its value? Type the value.`;
    sol = [`${nf(k)} on top, ${k} below: every pair cancels, and 1 is left.`, `The quotient rule gives ${k} − ${k} = 0: ${P(b, 0)}. Both are right, so ${P(b, 0)} = ${S('1')}.`];
    pic = lawMat(b.p, [{ exp: k, label: T(b, k) }, { exp: k, label: T(b, k), div: true }], `= ${T(b, 0)} = 1`, rat(1));
  } else if (kind === 'table') {
    const vals = [3, 2, 1].map(e => `${T(b, e)} = ${vTex(qPow(b, e))}`).join(',\\ \\ ');
    board = `${vals},\\ \\ ${T(b, 0)} = \\ ?`;
    prompt = `Going down the table, each step divides by ${b.p}. What is ${A(P(b, 0))}?`;
    sol = [`${P(b, 1)} = ${b.p}. One step down divides by ${b.p}: ${b.p} ÷ ${b.p} = 1.`, `So ${P(b, 0)} = ${S('1')}.`];
  } else {
    board = `${T(b, 0)} = \\ ?`; prompt = `What is ${A(P(b, 0))}?`;
    sol = [`${P(b, 1)} = ${vHtml(b)}; divide by the base once more: ${vHtml(b)} ÷ ${vHtml(b)} = 1.`, `With no factors left, the 1 every product starts from is what remains: ${P(b, 0)} = ${S('1')}.`];
    if (b.q === 1) pic = { kind: 'mat', top: [], bottom: [], brackets: [{ key: 'z', row: 'top', from: 0, to: 0, label: T(b, 0), col: 'second', empty: true }], result: '= 1', resultValue: rat(1) };
  }
  return valItem({ id: `z-${n}`, family: 'zeroExp', prompt, board, solution: sol, picture: pic }, rat(1), 'num', `Yes: ${P(b, 0)} = 1.`, [
    { v: rat(0), mc: MC.zero0, say: `Zero factors do not make 0: nothing is multiplied, so the 1 you start from is left. ${P(b, 0)} = 1.` },
    { v: b, mc: MC.zeroBase, say: `${P(b, 1)} is ${vHtml(b)}; ${P(b, 0)} is one more step down: ${vHtml(b)} ÷ ${vHtml(b)} = 1.` },
  ], `${P(b, 0)} = 1 for every base except 0.`);
};

// 11. zero, three ways [zero-exponent]
const zeroContrast: Gen = (R, n) => {
  const b = int(R, 2, 9);
  const row = (x: string, y: string, z: string) => `${b}${sup(0)} = ${x}, &nbsp;${b} × 0 = ${y}, &nbsp;0${sup(b)} = ${z}`;
  return choiceItem({
    id: `zc-${n}`, family: 'zeroContrast',
    prompt: `Which line is right?`, board: `${b}^{0} \\qquad ${b} \\times 0 \\qquad 0^{${b}}`,
    solution: [`${b}${sup(0)}: no factors of ${b}, so the starting 1 is left: 1.`, `${b} × 0 = 0, and 0${sup(b)} = ${nf(b)} of 0 = 0.`, `So: ${S(row('1', '0', '0'))}.`],
  }, R, [
    { t: row('1', '0', '0'), ok: true, say: `Yes: ${b}${sup(0)} = 1, but ${b} × 0 and 0${sup(b)} are both 0.` },
    { t: row('0', '0', '0'), mc: MC.zero0, say: `${b}${sup(0)} is not ${b} × 0. It is one step down from ${b}${sup(1)} = ${b}: ${b} ÷ ${b} = 1.` },
    { t: row(String(b), '0', '0'), mc: MC.zeroBase, say: `${b}${sup(1)} is ${b}; ${b}${sup(0)} is one step further down the table: ${b} ÷ ${b} = 1.` },
    { t: row('1', '0', '1'), say: `0${sup(b)} is ${nf(b)} of 0, and that is 0. Only a NONZERO base to the power 0 is 1.` },
  ]);
};

// 12. negative powers of 10 as decimals and fractions [negative-exponent-base-10]
const tenDec: Gen = (R, n) => {
  const k = int(R, 1, 6), want = qPow(B10, -k), asDec = R() < 0.6;
  const dec = decStr(want)!;
  const pic: MatPic | undefined = lawMat(10, [{ exp: -k, label: T(B10, -k) }], `= \\frac{1}{${k === 1 ? '10' : `10^{${k}}`}} = ${dec.replace('−', '-')}`, want);
  const tenK = k === 1 ? '10' : `10${sup(k)}`, times10 = k === 1 ? 'once' : `${k} times`, places = k === 1 ? 'one place' : `${k} places`;
  return valItem({
    id: `td-${n}`, family: 'tenDec',
    prompt: asDec ? `Write ${A(`10${sup(-k)}`)} as a decimal.` : `Write ${A(`10${sup(-k)}`)} as a fraction.`, board: `10^{-${k}} = \\ ?`,
    solution: [`10${sup(-k)} = 1 ÷ ${tenK} = ${asDec ? fr(1, qPow(B10, k).p) : S(fr(1, qPow(B10, k).p))}: ${k === 1 ? 'one factor' : `${nf(k)}`} of 10 below the bar.`, `Dividing 1 by 10 ${times10} moves the 1 ${places} to the right of the decimal point: ${asDec ? S(dec) : dec}.`],
    picture: pic,
  }, want, asDec ? 'num' : 'frac', `Yes: 10${sup(-k)} = ${fr(1, qPow(B10, k).p)} = ${dec}.`, [
    { v: qNeg(qPow(B10, k)), mc: MC.negNeg, say: `A negative exponent does not make the number negative: 10${sup(-k)} is 1 divided by 10${sup(k)}, a small positive number, ${dec}.` },
    { v: qNeg(want), mc: MC.negNeg, say: `10${sup(-k)} is positive: it is 1 ÷ 10${sup(k)} = ${dec}.` },
    { v: qPow(B10, -(k + 1)), mc: MC.zerosCount, say: `The exponent says which decimal place the 1 is in, not how many zeros come first. 10${sup(-k)} puts the 1 in place ${k}: ${dec}.` },
    { v: qPow(B10, k), say: `10${sup(k)} = ${qPow(B10, k).p}. The negative exponent divides instead: ${dec}.` },
  ], `10${sup(-k)} = 1 ÷ ${tenK} = ${dec}.`);
};

// 13. decimals as powers of 10 [negative-exponent-base-10]
const tenExp: Gen = (R, n) => {
  const k = int(R, 1, 6), v = qPow(B10, -k), dec = decStr(v)!, asFrac = R() < 0.35;
  const shown = asFrac ? fr(1, qPow(B10, k).p) : dec;
  const wrongs: W[] = [];
  if (k >= 2) wrongs.push({ v: Z(-(k - 1)), mc: MC.zerosCount, say: `Count the decimal place of the 1, not the zeros in front of it: the 1 in ${dec} is in place ${k}, so 10${sup(-k)}.` });
  wrongs.push({ v: Z(k), mc: MC.dropSign, say: `10${sup(k)} = ${qPow(B10, k).p}, a big number. ${dec} is small: 1 ÷ 10${sup(k)} = 10${sup(-k)}.` });
  return valItem({
    id: `te-${n}`, family: 'tenExp',
    prompt: `${A(shown)} = 10 to what power? Type the exponent.`, board: `${asFrac ? `\\frac{1}{${qPow(B10, k).p}}` : dec} = 10^{\\,?}`,
    solution: [`${shown} = ${fr(1, qPow(B10, k).p)} = 1 ÷ 10${sup(k)}.`, `Dividing by 10${sup(k)} is the power 10${sup(-k)}: the exponent is ${S(minus(-k))}.`],
  }, Z(-k), 'num', `Yes: ${shown} = 10${sup(-k)}.`, wrongs, `${shown} = 1 ÷ 10${sup(k)} = 10${sup(-k)}.`);
};

// 14. negative exponents, as values [negative-exponent-general, neg-power-fraction-base, neg-power-negative-base]
function negPick(R: () => number, sg?: string): { base: Q; e: number } {
  if (sg === 'neg-power-fraction-base') {
    const unit = R() < 0.45;
    const base = unit ? rat(1, pick(R, [2, 3, 4, 5, 6, 10])) : pick(R, [rat(2, 3), rat(3, 4), rat(3, 2), rat(5, 2), rat(2, 5), rat(4, 3), rat(3, 5), rat(5, 3), rat(2, 7), rat(4, 5)]);
    const e = -int(R, 1, base.q >= 4 || base.p >= 4 ? 2 : 3);
    return { base, e };
  }
  if (sg === 'neg-power-negative-base') {
    const base = pick(R, [Z(-2), Z(-2), Z(-3), Z(-4), Z(-5), Z(-10), rat(-1, 2), rat(-1, 3), rat(-2, 3), rat(-1, 4), Z(-6), rat(-1, 5), rat(-3, 2)]);
    let e = -int(R, 0, 3);
    if (Math.abs(base.p) >= 3 || base.q >= 3) e = Math.max(e, -2);
    return { base, e };
  }
  const b = pick(R, [2, 2, 3, 3, 4, 5, 5, 6, 10]);
  return { base: Z(b), e: -int(R, 1, b === 2 ? 5 : b === 3 ? 4 : b === 6 ? 2 : 3) };
}
const negExp: Gen = (R, n, sg) => {
  const { base, e } = negPick(R, sg);
  if (sg === 'negative-exponent-general' && R() < 0.35) {
    // the other direction: 1/8 = 2 to what power?
    const ae = -e, v = qPow(base, ae).p;
    return valItem({
      id: `ne-r-${n}`, family: 'negExp',
      prompt: `${A(fr(1, v))} = ${baseHtml(base)} to what power? Type the exponent.`, board: `\\frac{1}{${v}} = ${base.p}^{\\,?}`,
      solution: [`${v} = ${factors(base, ae)} = ${P(base, ae)}.`, `1 over ${P(base, ae)}: the ${ae} factor${ae > 1 ? 's are' : ' is'} below the bar, so the exponent is ${S(minus(e))}.`],
    }, Z(e), 'num', `Yes: ${fr(1, v)} = ${P(base, e)}.`, [
      { v: Z(ae), mc: MC.dropSign, say: `${P(base, ae)} = ${v}, a big number. ${fr(1, v)} has the ${base.p}s below the bar: ${P(base, e)}.` },
      { v: Z(-v), mc: MC.baseTimes, say: `The exponent counts factors: ${v} = ${factors(base, ae)}, so ${fr(1, v)} = ${P(base, e)}.` },
    ], `${fr(1, v)} = 1 ÷ ${P(base, ae)} = ${P(base, e)}.`);
  }
  const want = qPow(base, e), ae = -e;
  const pos = qPow(base, ae);
  const wrongs: W[] = [];
  const neg = base.p < 0;
  if (e === 0) {
    wrongs.push({ v: rat(0), mc: MC.zero0, say: `Zero factors leave the 1 you start from: ${P(base, 0)} = 1, for a negative base too.` });
    wrongs.push({ v: base, mc: MC.zeroBase, say: `${P(base, 1)} = ${vHtml(base)}; one step down divides by ${baseHtml(base)}: 1.` });
  } else if (neg) {
    wrongs.push({ v: qNeg(want), mc: ae % 2 === 0 ? MC.evenNeg : MC.dropSign, say: ae % 2 === 0 ? `${ae} negative factors below the bar: an even number, so the value is positive: ${vHtml(want)}.` : `${ae} negative factors: an odd number, so the value stays negative: ${vHtml(want)}.` });
    wrongs.push({ v: qNeg(qPow(qNeg(base), ae)), mc: MC.negNeg, say: `The exponent's minus sign does not go onto the answer: it puts the factors below the bar. ${P(base, e)} = ${vHtml(want)}.` });
  } else {
    wrongs.push({ v: qNeg(pos), mc: MC.negNeg, say: `A negative exponent does not make the number negative: it puts the factors below the bar. ${P(base, e)} = ${vHtml(want)}.` });
    wrongs.push({ v: qNeg(want), mc: MC.negNeg, say: `${P(base, e)} is positive: dividing a positive number never makes it negative. ${vHtml(want)}.` });
    if (base.q === 1) {
      wrongs.push({ v: Z(base.p * e), mc: MC.baseTimes, say: `An exponent is not a factor: ${P(base, ae)} = ${factors(base, ae)}, not ${base.p} × ${ae}. So ${P(base, e)} = ${vHtml(want)}.` });
      wrongs.push({ v: rat(1, base.p * ae), mc: MC.baseTimes, say: `${P(base, ae)} is ${factors(base, ae)} = ${vHtml(pos)}, not ${base.p} × ${ae}. So ${P(base, e)} = ${vHtml(want)}.` });
    } else if (base.p !== 1) {
      wrongs.push({ v: rat(qPow(Z(base.q), ae).p, base.p), mc: MC.oneFrac, say: `After the flip, raise the top AND the bottom: ${vHtml(want)}.` });
    }
    wrongs.push({ v: pos, say: `That is ${P(base, ae)}. The negative exponent puts the factors below the bar: ${vHtml(want)}.` });
  }
  const pic = base.q === 1 && e !== 0 ? lawMat(base.p, [{ exp: e, label: T(base, e) }], `= \\frac{1}{${T(base, ae)}} = ${vTex(want)}`, want) : undefined;
  const input = inputFor(want);
  return valItem({
    id: `ne-${n}`, family: 'negExp',
    prompt: `What is ${A(P(base, e))}?`, board: `${T(base, e)} = \\ ?`,
    solution: e === 0 ? [`${P(base, 0)} has no factors of ${baseHtml(base)}: only the starting 1 is left.`, `Every nonzero base to the power 0 is 1: ${P(base, 0)} = ${S('1')}.`] : base.q === 1
      ? [`${P(base, e)} = 1 ÷ ${P(base, ae)}: ${ae} factor${ae > 1 ? 's' : ''} of ${baseHtml(base)} below the bar.`, `${P(base, ae)} = ${vHtml(pos)}, so ${P(base, e)} = ${S(vHtml(want))}.`]
      : [`A negative exponent flips the fraction: ${P(base, e)} = ${P(qPow(base, -1), ae)}.`, `${P(qPow(base, -1), ae)} = ${S(vHtml(want))}.`],
    picture: pic,
  }, want, input, `Yes: ${P(base, e)} = ${vHtml(want)}.`, wrongs, `${P(base, e)} = 1 ÷ ${P(base, ae)} = ${vHtml(want)}.`);
};

// 15. which is equal? [negative-exponent-general, neg-power-fraction-base, neg-power-negative-base]
const negWhich: Gen = (R, n, sg) => {
  let { base, e } = negPick(R, sg);
  if (e === 0) e = -2;
  if (base.q === 1 && base.p === 2 && e === -2) e = -3;
  const want = qPow(base, e), ae = -e, pos = qPow(base, ae);
  const opts: Opt[] = [{ t: vHtml(want), ok: true, say: `Yes: ${P(base, e)} = ${vHtml(want)}.` }];
  if (base.p < 0) {
    opts.push({ t: vHtml(qNeg(want)), mc: ae % 2 === 0 ? MC.evenNeg : MC.dropSign, say: ae % 2 === 0 ? `An even number of negative factors gives a positive value: ${vHtml(want)}.` : `An odd number of negative factors stays negative: ${vHtml(want)}.` });
    opts.push({ t: vHtml(pos), say: `That is ${P(base, ae)}. The negative exponent puts the factors below the bar: ${vHtml(want)}.` });
    if (!qSame(qNeg(pos), want) && !qSame(qNeg(pos), pos)) opts.push({ t: vHtml(qNeg(pos)), mc: qNeg(pos).p < 0 ? MC.negNeg : undefined, say: `The exponent's minus sign does not go onto the answer: ${vHtml(want)}.` });
  } else if (base.q === 1) {
    opts.push({ t: vHtml(qNeg(pos)), mc: MC.negNeg, say: `A negative exponent does not make the number negative: ${P(base, e)} = 1 ÷ ${P(base, ae)} = ${vHtml(want)}.` });
    opts.push({ t: minus(base.p * e), mc: MC.baseTimes, say: `An exponent is not a factor: ${P(base, ae)} = ${factors(base, ae)}. So ${vHtml(want)}.` });
    opts.push({ t: vHtml(rat(1, base.p * ae)), mc: MC.baseTimes, say: `${P(base, ae)} = ${factors(base, ae)} = ${vHtml(pos)}, not ${base.p} × ${ae}. So ${vHtml(want)}.` });
    opts.push({ t: vHtml(pos), say: `That is ${P(base, ae)}. The negative exponent puts the factors below the bar: ${vHtml(want)}.` });
  } else {
    opts.push({ t: vHtml(qNeg(pos)), mc: MC.negNeg, say: `A negative exponent flips the fraction; it does not make it negative: ${vHtml(want)}.` });
    opts.push({ t: vHtml(pos), say: `That forgot the flip. ${P(base, e)} = ${P(qPow(base, -1), ae)} = ${vHtml(want)}.` });
    if (base.p !== 1) opts.push({ t: vHtml(rat(qPow(Z(base.q), ae).p, base.p)), mc: MC.oneFrac, say: `After the flip, raise the top AND the bottom: ${vHtml(want)}.` });
  }
  const uniq = opts.filter((o, i) => opts.findIndex(x => x.t === o.t) === i);
  return choiceItem({
    id: `nw-${n}`, family: 'negWhich',
    prompt: `Which number is equal to ${A(P(base, e))}?`, board: T(base, e),
    solution: base.q === 1 ? [`${P(base, e)} = 1 ÷ ${P(base, ae)} = 1 ÷ ${pos.p < 0 ? `(${vHtml(pos)})` : vHtml(pos)}.`, `So ${S(vHtml(want))}.`] : [`Flip the fraction and make the exponent positive: ${P(qPow(base, -1), ae)}.`, `So ${S(vHtml(want))}.`],
  }, R, uniq);
};

// 16. the minus sign inside or outside the power [external-minus-contrast]
const minusPair: Gen = (R, n) => {
  const [b, e] = pick(R, [[3, 0], [5, 0], [2, 0], [2, -2], [3, -2], [2, 4], [3, 2], [5, 2], [2, -1], [4, 2]] as [number, number][]);
  const outside = R() < 0.6;
  const inner = qPow(Z(-b), e), outer = qNeg(qPow(Z(b), e));
  const want = outside ? outer : inner;
  const board = outside ? `-${b}^{${e}} = \\ ?` : `(-${b})^{${e}} = \\ ?`;
  const html = outside ? `−${b}${sup(e)}` : `(−${b})${sup(e)}`;
  const wrongs: W[] = [];
  if (outside) wrongs.push({ v: inner, mc: MC.minusRead, say: `Without parentheses, the exponent belongs to ${b} only: −${b}${sup(e)} = −(${b}${sup(e)}) = ${vHtml(outer)}. The minus is applied after the power.` });
  else {
    if (e === 0) wrongs.push({ v: rat(0), mc: MC.zero0, say: `Any nonzero base to the power 0 is 1, a negative base too: (−${b})${sup(0)} = 1.` });
    wrongs.push({ v: outer, mc: e % 2 === 0 ? MC.evenNeg : MC.dropSign, say: e % 2 === 0 || e === 0 ? `With parentheses, the base is −${b}: an even number of negative factors makes a positive. (−${b})${sup(e)} = ${vHtml(inner)}.` : `The base is −${b}: an odd number of negative factors stays negative. ${vHtml(inner)}.` });
  }
  if (e === 0 && outside) wrongs.push({ v: rat(0), mc: MC.zero0, say: `${b}${sup(0)} = 1, so −${b}${sup(0)} = −1.` });
  if (e < 0) wrongs.push({ v: qNeg(qPow(Z(b), -e)), mc: MC.negNeg, say: `A negative exponent puts the factors below the bar; it does not give ${vHtml(qNeg(qPow(Z(b), -e)))}. ${vHtml(want)}.` });
  const input = inputFor(want);
  return valItem({
    id: `mp-${n}`, family: 'minusPair',
    prompt: `What is ${A(html)}?`, board,
    solution: outside
      ? [`No parentheses: the power comes first, then the minus. −${b}${sup(e)} = −(${b}${sup(e)}).`, `${b}${sup(e)} = ${vHtml(qPow(Z(b), e))}, so it is ${S(vHtml(want))}.`]
      : [`With parentheses the base is −${b}.`, `(−${b})${sup(e)} = ${S(vHtml(want))}.`],
  }, want, input, `Yes: ${html} = ${vHtml(want)}.`, wrongs, `${outside ? `−${b}${sup(e)} = −(${b}${sup(e)})` : `The base is (−${b})`}: ${vHtml(want)}.`);
};

// 17. zero powers inside expressions [external-minus-contrast]
const zeroMix: Gen = (R, n) => {
  const kind = pick(R, ['sum', 'diff', 'series', 'minus']);
  const a = int(R, 2, 9), c = int(R, 2, 9);
  let board: string, html: string, want: number, w0: number, wb: number, extra: W | null = null;
  if (kind === 'sum') { board = `${c} \\times 10^{0} + ${a}^{0}`; html = `${c} × 10${sup(0)} + ${a}${sup(0)}`; want = c + 1; w0 = 0; wb = c * 10 + a; }
  else if (kind === 'diff') { board = `${c + 3} - ${a}^{0}`; html = `${c + 3} − ${a}${sup(0)}`; want = c + 2; w0 = c + 3; wb = c + 3 - a; }
  else if (kind === 'series') { board = `${a}^{0} + ${a}^{1} + ${a}^{2}`; html = `${a}${sup(0)} + ${a}${sup(1)} + ${a}${sup(2)}`; want = 1 + a + a * a; w0 = a + a * a; wb = 2 * a + a * a; }
  else { board = `-${a}^{0} + ${c}`; html = `−${a}${sup(0)} + ${c}`; want = c - 1; w0 = c; wb = c - a; extra = { v: Z(c + 1), mc: MC.minusRead, say: `−${a}${sup(0)} means −(${a}${sup(0)}) = −1, because the power comes before the minus. ${c} − 1 = ${c - 1}.` }; }
  return valItem({
    id: `zm-${n}`, family: 'zeroMix',
    prompt: `Find the value: ${A(html)}.`, board: `${board} = \\ ?`,
    solution: [`Every zero power of a nonzero base is 1${kind === 'minus' ? `, and the minus is applied after the power: −${a}${sup(0)} = −1` : ''}.`, `So ${kind === 'sum' ? `${c} × 1 + 1` : kind === 'diff' ? `${c + 3} − 1` : kind === 'series' ? `1 + ${a} + ${a * a}` : `−1 + ${c}`} = ${S(String(want))}.`],
  }, Z(want), 'num', `Yes: ${want}.`, [
    ...(extra ? [extra] : []),
    { v: Z(w0), mc: MC.zero0, say: `A zero power is 1, not 0. Put 1 in for each zero power: ${want}.` },
    { v: Z(wb), mc: MC.zeroBase, say: `A zero power is 1, not the base. Put 1 in for each zero power: ${want}.` },
  ], `Replace each zero power by 1, then work it out: ${want}.`);
};

// 18. use a rule, then evaluate [product-rule-integer, quotient-rule-integer, power-of-a-power]
const lawVal: Gen = (R, n, sg) => {
  const b = Z(pick(R, [2, 3, 2, 10]));
  const lim = b.p === 2 ? 4 : b.p === 3 ? 3 : 4;
  let m = 0, k = 0, e = 0, board = '', html = '', how = '', law: 'prod' | 'quot' | 'pow' = sg === 'quotient-rule-integer' ? 'quot' : sg === 'power-of-a-power' ? 'pow' : 'prod';
  for (let t = 0; t < 400; t++) {
    if (law === 'pow') { m = int(R, -3, 3); k = int(R, -2, 3); e = m * k; if (m === 0 || k === 0 || (m > 0 && k > 0)) continue; }
    else { m = int(R, -6, 6); k = int(R, -6, 6); e = law === 'prod' ? m + k : m - k; if (m === 0 || k === 0 || (m > 0 && k > 0 && (law === 'prod' || m > k))) continue; }
    if (Math.abs(e) <= lim && e !== 0) break;
  }
  if (law === 'prod') { board = `${T(b, m)} \\times ${T(b, k)}`; html = `${P(b, m)} × ${P(b, k)}`; how = `${minus(m)} + ${par(k)} = ${minus(e)}`; }
  else if (law === 'quot') { board = `\\frac{${T(b, m)}}{${T(b, k)}}`; html = `${P(b, m)} ÷ ${P(b, k)}`; how = `${minus(m)} − ${k < 0 ? `(${minus(k)})` : k} = ${minus(e)}`; }
  else { board = `\\left(${T(b, m)}\\right)^{${k}}`; html = `(${P(b, m)})${sup(k)}`; how = `${minus(m)} × ${k < 0 ? `(${minus(k)})` : k} = ${minus(e)}`; }
  const want = qPow(b, e);
  const wrongs: W[] = [];
  if (e < 0) wrongs.push({ v: qNeg(qPow(b, -e)), mc: MC.negNeg, say: `${P(b, e)} is 1 ÷ ${P(b, -e)}, a positive number: ${vHtml(want)}.` });
  if (law === 'prod' && e < 0) wrongs.push({ v: qPow(b, -e), mc: MC.sumPos, say: `${how}: the exponent is negative, so the factors are below the bar: ${vHtml(want)}.` });
  if (law === 'prod' && Math.abs(m * k) <= lim + 2) wrongs.push({ v: qPow(b, m * k), mc: MC.prodMul, say: `Multiplying powers adds the exponents: ${how}. ${P(b, e)} = ${vHtml(want)}.` });
  if (law === 'quot' && k < 0 && m + k !== 0 && Math.abs(m + k) <= 8) wrongs.push({ v: qPow(b, m + k), mc: MC.subNeg, say: `Subtracting a negative exponent adds: ${how}. ${P(b, e)} = ${vHtml(want)}.` });
  if (law === 'pow' && Math.abs(m + k) <= 8) wrongs.push({ v: qPow(b, m + k), mc: MC.powAdd, say: `A power of a power multiplies the exponents: ${how}. ${vHtml(want)}.` });
  if (law === 'pow' && m < 0 && k < 0) wrongs.push({ v: qPow(b, -e), mc: MC.anyNeg, say: `A negative times a negative is positive: ${how}. ${vHtml(want)}.` });
  const pic = law !== 'pow' && b.p !== 10
    ? lawMat(b.p, [{ exp: m, label: T(b, m) }, { exp: k, label: T(b, k), div: law === 'quot' }], `= ${T(b, e)} = ${vTex(want)}`, want)
    : undefined;
  const input = inputFor(want, b.p === 10);
  return valItem({
    id: `lv-${n}`, family: 'lawVal',
    prompt: `Find the value of ${A(html)}.${b.p === 10 && e < 0 ? ' A decimal or a fraction is fine.' : ''}`, board: `${board} = \\ ?`,
    solution: [`One power first: ${how}, so ${P(b, e)}.`, e < 0 ? `${P(b, e)} = 1 ÷ ${P(b, -e)} = ${S(vHtml(want))}.` : `${P(b, e)} = ${S(vHtml(want))}.`],
    picture: law === 'quot' && (m < 0 || k < 0) ? undefined : pic,
  }, want, input, `Yes: ${P(b, e)} = ${vHtml(want)}.`, wrongs, `First one power (${how}), then the value: ${vHtml(want)}.`);
};

// 19. a power of a sum is not the sum of the powers [power-of-a-product]
const sumPow: Gen = (R, n) => {
  const a = int(R, 1, 6), c = int(R, 1, 6), sub = R() < 0.3 && a !== c;
  const [x, y] = sub ? [Math.max(a, c), Math.min(a, c)] : [a, c];
  const e = sub || x + y > 6 ? 2 : pick(R, [2, 2, 3]);
  const inner = sub ? x - y : x + y, want = qPow(Z(inner), e).p;
  const split = sub ? qPow(Z(x), e).p - qPow(Z(y), e).p : qPow(Z(x), e).p + qPow(Z(y), e).p;
  const op = sub ? '−' : '+';
  return valItem({
    id: `sp-${n}`, family: 'sumPow',
    prompt: `Find the value of ${A(`(${x} ${op} ${y})${sup(e)}`)}.`, board: `(${x} ${sub ? '-' : '+'} ${y})^{${e}} = \\ ?`,
    solution: [`Parentheses first: ${x} ${op} ${y} = ${inner}.`, `${inner}${sup(e)} = ${S(String(want))}. (A power of a SUM is not ${x}${sup(e)} ${op} ${y}${sup(e)} = ${split}; only a power of a product splits.)`],
  }, Z(want), 'num', `Yes: (${x} ${op} ${y})${sup(e)} = ${inner}${sup(e)} = ${want}.`, [
    { v: Z(split), mc: MC.overSum, say: `A power does not split over ${sub ? 'a difference' : 'a sum'}: ${x}${sup(e)} ${op} ${y}${sup(e)} = ${split}, but (${x} ${op} ${y})${sup(e)} = ${inner}${sup(e)} = ${want}.` },
    { v: Z(inner * e), mc: MC.baseTimes, say: `${inner}${sup(e)} is ${Array.from({ length: e }, () => inner).join(' × ')}, not ${inner} × ${e}. It is ${want}.` },
  ], `Work out the parentheses first: ${inner}, then ${inner}${sup(e)} = ${want}.`);
};

// 20. why the definitions hold [justify-zero-negative-definitions]
const justify: Gen = (R, n) => {
  const b = int(R, 2, 9), k = int(R, 2, 4), kind = pick(R, ['zero', 'neg', 'sam', 'zerobase', 'examples']);
  const bq = Z(b), vk = qPow(bq, k).p;
  if (kind === 'zero') return choiceItem({
    id: `j-z-${n}`, family: 'justify', prompt: `Why must ${A(`${b}${sup(0)}`)} be 1?`, board: `${b}^{${k}} \\times ${b}^{0} = ${b}^{${k}+0} = ${b}^{${k}}`,
    solution: [`The product rule gives ${b}${sup(k)} × ${b}${sup(0)} = ${b}${sup(k)}: multiplying by ${b}${sup(0)} changes nothing.`, `Only 1 does that, so ${b}${sup(0)} = ${S('1')}.`],
  }, R, [
    { t: `${b}${sup(k)} × ${b}${sup(0)} = ${b}${sup(`${k}+0`)} = ${b}${sup(k)}, and only multiplying by 1 changes nothing.`, ok: true, say: `Yes: that is the only value that keeps the product rule true.` },
    { t: `It is a rule you have to memorize.`, mc: MC.arbitrary, say: `It is not arbitrary: ${b}${sup(k)} × ${b}${sup(0)} must be ${b}${sup(k)} by the product rule, and only × 1 changes nothing.` },
    { t: `No factors of ${b} leave the ${b} itself, and ${b} × 1 = ${b}.`, mc: MC.zeroBase, say: `If ${b}${sup(0)} were ${b}, then ${b}${sup(k)} × ${b}${sup(0)} would be ${b}${sup(k + 1)}, not ${b}${sup(k)}.` },
  ]);
  if (kind === 'neg') return choiceItem({
    id: `j-n-${n}`, family: 'justify', prompt: `Why must ${A(`${b}${sup(-k)}`)} be ${fr(1, vk)}?`, board: `${b}^{${k}} \\times ${b}^{-${k}} = ${b}^{0} = 1`,
    solution: [`The product rule gives ${b}${sup(k)} × ${b}${sup(-k)} = ${b}${sup(0)} = 1.`, `So ${b}${sup(-k)} is the number that multiplies ${vk} to make 1: ${S(fr(1, vk))}.`],
  }, R, [
    { t: `${b}${sup(k)} × ${b}${sup(-k)} = ${b}${sup(0)} = 1, so ${b}${sup(-k)} is the number that multiplies ${vk} to make 1.`, ok: true, say: `Yes: ${b}${sup(-k)} has to be the reciprocal of ${b}${sup(k)}, ${fr(1, vk)}.` },
    { t: `The minus sign of the exponent makes the answer −${vk}.`, mc: MC.negNeg, say: `Then ${b}${sup(k)} × ${b}${sup(-k)} would be ${vk} × (−${vk}), not ${b}${sup(0)} = 1. Only ${fr(1, vk)} works.` },
    { t: `${b}${sup(-1)}, ${b}${sup(-2)} and ${b}${sup(-3)} all check out on a calculator, so that proves it.`, mc: MC.examples, say: `Checked examples are not a proof for every exponent. The product rule argument (${b}${sup(k)} × ${b}${sup(-k)} = 1) works for all of them at once.` },
  ]);
  if (kind === 'sam') return choiceItem({
    id: `j-s-${n}`, family: 'justify', prompt: `Sam says ${A(`${b}${sup(0)} = 0`)}, “because there are no ${b}s.” Which argument shows Sam is wrong?`, board: `${b}^{0} = 0\\ ?`,
    solution: [`If ${b}${sup(0)} were 0, then ${b}${sup(k)} × ${b}${sup(0)} would be 0.`, `But the product rule says it is ${b}${sup(`${k}+0`)} = ${b}${sup(k)} = ${vk}. So ${b}${sup(0)} = ${S('1')}.`],
  }, R, [
    { t: `Then ${b}${sup(k)} × ${b}${sup(0)} would be 0, but the product rule says it is ${b}${sup(k)} = ${vk}.`, ok: true, say: `Yes: Sam's value breaks the product rule, and 1 is the only value that keeps it.` },
    { t: `Sam is right: no ${b}s means nothing is there.`, mc: MC.zero0, say: `No factors means nothing is multiplied, and the 1 you start from is left: ${b}${sup(0)} = 1.` },
    { t: `My calculator says 1, and calculators are always right.`, mc: MC.examples, say: `A calculator shows the value but does not show why. The product rule argument does.` },
  ]);
  if (kind === 'zerobase') return choiceItem({
    id: `j-0-${n}`, family: 'justify', prompt: `Why does ${A(`0${sup(-1)}`)} have no value?`, board: `0^{-1} = \\frac{1}{0}\\ ?`,
    solution: [`A negative exponent means 1 over the positive power: 0${sup(-1)} = 1 ÷ 0${sup(1)} = 1 ÷ 0.`, `Dividing by 0 has no value, so ${S('the base 0 is left out')} for zero and negative exponents.`],
  }, R, [
    { t: `0${sup(-1)} would be 1 ÷ 0, and dividing by 0 has no value.`, ok: true, say: `Yes: that is why the rules for zero and negative exponents say "for a nonzero base".` },
    { t: `0${sup(-1)} is −0, which is just 0.`, mc: MC.negNeg, say: `A negative exponent does not make a number negative: it divides. 0${sup(-1)} would be 1 ÷ 0, which has no value.` },
    { t: `Every power of 0 is 0, so it is not needed.`, say: `0${sup(1)} = 0, but 0${sup(-1)} would be 1 ÷ 0, and that has no value.` },
  ]);
  return choiceItem({
    id: `j-e-${n}`, family: 'justify', prompt: `Mia checked ${b}${sup(0)}, ${b + 1}${sup(0)} and 10${sup(0)} on a calculator: all 1. Does that prove ${A(`a${sup(0)} = 1`)} for every nonzero a?`, board: `${b}^{0} = ${b + 1}^{0} = 10^{0} = 1`,
    solution: [`Examples can suggest a rule, but they do not prove it for bases nobody checked.`, `The product rule argument does: a${sup('n')} × a${sup(0)} = a${sup('n')}, so a${sup(0)} = ${S('1')} for every nonzero a.`],
  }, R, [
    { t: `No: examples do not cover every base. The product rule argument does: a${sup('n')} × a${sup(0)} = a${sup('n')}.`, ok: true, say: `Yes: a proof works for every base at once; checked examples cannot.` },
    { t: `Yes: three bases are enough to be sure.`, mc: MC.examples, say: `However many bases you check, there are always more. The product rule argument covers them all.` },
    { t: `No: it only works for bases up to 10.`, say: `It works for every nonzero base, and the product rule argument shows why.` },
  ]);
};

// 21. variables: the exponent after a rule [monomial-exponent-laws]
const monoExp: Gen = (R, n) => {
  const x = pick(R, VARS), law = pick(R, ['prod', 'quot', 'pow']);
  let m = 0, k = 0, e = 0;
  for (;;) {
    m = int(R, -6, 6); k = law === 'pow' ? int(R, -3, 3) : int(R, -6, 6);
    if (m === 0 || k === 0) continue;
    e = law === 'prod' ? m + k : law === 'quot' ? m - k : m * k;
    if ((m < 0 || k < 0 || e <= 0) && Math.abs(e) <= 12) break;
  }
  const kk = k < 0 ? `(${minus(k)})` : String(k);
  const how = law === 'prod' ? `${minus(m)} + ${par(k)} = ${minus(e)}` : law === 'quot' ? `${minus(m)} − ${kk} = ${minus(e)}` : `${minus(m)} × ${kk} = ${minus(e)}`;
  const html = law === 'prod' ? `${varHtml(x, m)} · ${varHtml(x, k)}` : law === 'quot' ? `${varHtml(x, m)} ÷ ${varHtml(x, k)}` : `(${varHtml(x, m)})${sup(k)}`;
  const board = law === 'prod' ? `${varPow(x, m)} \\cdot ${varPow(x, k)}` : law === 'quot' ? `\\frac{${varPow(x, m)}}{${varPow(x, k)}}` : `\\left(${varPow(x, m)}\\right)^{${k}}`;
  const wrongs: W[] = [];
  if (law === 'prod') { wrongs.push({ v: Z(m * k), mc: MC.prodMul, say: `Multiplying powers adds the exponents: ${how}.` }); if (e < 0) wrongs.push({ v: Z(-e), mc: MC.sumPos, say: `${how}: keep the sign.` }); }
  if (law === 'quot') { if (Math.abs(k) >= 2 && m % k === 0) wrongs.push({ v: Z(m / k), mc: MC.quotDiv, say: `Dividing powers subtracts the exponents: ${how}.` }); if (k < 0) wrongs.push({ v: Z(m + k), mc: MC.subNeg, say: `Subtracting a negative adds: ${how}.` }); if (e < 0) wrongs.push({ v: Z(-e), mc: MC.dropSign, say: `${how}: more factors below the bar, so the exponent is negative.` }); }
  if (law === 'pow') { wrongs.push({ v: Z(m + k), mc: MC.powAdd, say: `A power of a power multiplies the exponents: ${how}.` }); if (m < 0 && k < 0) wrongs.push({ v: Z(-e), mc: MC.anyNeg, say: `A negative times a negative is positive: ${how}.` }); }
  return valItem({
    id: `me-${n}`, family: 'monoExp',
    prompt: `${A(html)} = <i>${x}</i> to what power? (<i>${x}</i> ≠ 0) Type the exponent.`, board: `${board} = ${x}^{\\,?}`,
    solution: [`<i>${x}</i> is a base like any number (not 0).`, `${law === 'prod' ? 'Multiply: add' : law === 'quot' ? 'Divide: subtract' : 'Power of a power: multiply'} the exponents: ${how}, so ${VS(x, e)}.`],
  }, Z(e), 'num', `Yes: ${how}, so ${varHtml(x, e)}.`, wrongs, `${law === 'prod' ? 'Add' : law === 'quot' ? 'Subtract' : 'Multiply'} the exponents: ${how}.`);
};

// 22. simplify a monomial [monomial-exponent-laws]
const mono = (c: number | null, parts: [string, number][]) => `${c === null ? '' : minus(c)}${parts.filter(([, e]) => e !== 0).map(([v, e]) => varHtml(v, e)).join('')}`;
const monoPick: Gen = (R, n) => {
  const kind = pick(R, ['pow', 'pow', 'quot', 'diff']);
  const [x, y] = shuffle(R, ['x', 'y', 'a', 'b']).slice(0, 2) as [string, string];
  if (kind === 'pow') {
    let c = pick(R, [2, 3, 5]); const k = pick(R, [2, 3]);
    if (c === 2 && k === 2) c = 3;
    let m = int(R, -3, 4), q = int(R, -3, 3);
    if (m === 0) m = 2; if (q === 0) q = -2;
    if (m > 0 && q > 0) q = -q;
    const ck = qPow(Z(c), k).p;
    return choiceItem({
      id: `mp-p-${n}`, family: 'monoPick', prompt: `Simplify ${A(`(${mono(c, [[x, m], [y, q]])})${sup(k)}`)}, with <i>${x}</i>, <i>${y}</i> ≠ 0.`,
      board: `\\left(${c}${varPow(x, m)}${varPow(y, q)}\\right)^{${k}}`,
      solution: [`The power goes to every factor: ${c}${sup(k)}, (${varHtml(x, m)})${sup(k)} and (${varHtml(y, q)})${sup(k)}.`, `${c}${sup(k)} = ${ck}; multiply the exponents: ${S(mono(ck, [[x, m * k], [y, q * k]]))}.`],
    }, R, [
      { t: mono(ck, [[x, m * k], [y, q * k]]), ok: true, say: `Yes: ${c}${sup(k)} = ${ck}, and each exponent is multiplied by ${k}.` },
      { t: mono(c, [[x, m * k], [y, q * k]]), mc: MC.oneProd, say: `The coefficient is a factor too: ${c}${sup(k)} = ${ck}.` },
      { t: mono(c * k, [[x, m * k], [y, q * k]]), mc: MC.baseTimes, say: `${c}${sup(k)} is ${Array.from({ length: k }, () => c).join(' × ')} = ${ck}, not ${c} × ${k}.` },
      { t: mono(ck, [[x, m + k], [y, q + k]]), mc: MC.powAdd, say: `A power of a power multiplies the exponents: ${m} × ${k} and ${minus(q)} × ${k}.` },
    ]);
  }
  if (kind === 'quot') {
    const d = pick(R, [2, 3, 4]), c = d * pick(R, [2, 3, 5]), m = int(R, 1, 4), k = int(R, m + 1, 7), q = int(R, 1, 3);
    const ok = mono(c / d, [[x, m - k]]);
    const opts: Opt[] = [
      { t: ok, ok: true, say: `Yes: ${c} ÷ ${d} = ${c / d}; ${m} − ${k} = ${m - k}; the ${y}s cancel.` },
      { t: mono(c / d, [[x, k - m]]), mc: MC.dropSign, say: `More <i>${x}</i>s are below the bar, so the exponent is negative: ${m} − ${k} = ${m - k}.` },
      { t: mono(c - d, [[x, m - k]]), say: `Coefficients divide too: ${c} ÷ ${d} = ${c / d}.` },
      { t: mono(c / d, [[x, m - k], [y, q]]), say: `${varHtml(y, q)} ÷ ${varHtml(y, q)} = ${varHtml(y, 0)} = 1: the <i>${y}</i>s cancel.` },
    ];
    return choiceItem({
      id: `mp-q-${n}`, family: 'monoPick', prompt: `Simplify ${A(`${mono(c, [[x, m], [y, q]])} ÷ ${mono(d, [[x, k], [y, q]])}`)}, with <i>${x}</i>, <i>${y}</i> ≠ 0.`,
      board: `\\frac{${c}${varPow(x, m)}${varPow(y, q)}}{${d}${varPow(x, k)}${varPow(y, q)}}`,
      solution: [`Numbers: ${c} ÷ ${d} = ${c / d}. Each variable is its own base: ${varHtml(x, m)} ÷ ${varHtml(x, k)} = ${varHtml(x, m - k)}, ${varHtml(y, q)} ÷ ${varHtml(y, q)} = 1.`, `So ${S(ok)}, or ${c / d}/<i>${x}</i>${sup(k - m)} with a positive exponent.`],
    }, R, opts.filter((o, i) => opts.findIndex(z => z.t === o.t) === i));
  }
  const m = int(R, 2, 5), q = int(R, 2, 5);
  return choiceItem({
    id: `mp-d-${n}`, family: 'monoPick', prompt: `Simplify ${A(`${varHtml(x, m)} · ${varHtml(y, q)}`)} as far as you can.`, board: `${varPow(x, m)} \\cdot ${varPow(y, q)}`,
    solution: [`<i>${x}</i> and <i>${y}</i> are different bases: nothing combines.`, `It stays ${S(`${varHtml(x, m)}${varHtml(y, q)}`)}.`],
  }, R, [
    { t: `${varHtml(x, m)}${varHtml(y, q)}: different bases do not combine`, ok: true, say: `Yes: the rules add exponents only for the same base.` },
    { t: `(<i>${x}${y}</i>)${sup(m + q)}`, mc: MC.diffBase, say: `That would need ${nf(m + q)} of <i>${x}${y}</i>, but there are ${m} <i>${x}</i>s and ${q} <i>${y}</i>s. Nothing combines.` },
    { t: `${varHtml(x, m + q)}`, say: `The ${nf(q)} of <i>${y}</i> do not turn into <i>${x}</i>s. Different bases do not combine: ${varHtml(x, m)}${varHtml(y, q)}.` },
  ]);
};

export const GENS: Record<FamilyId, Gen> = {
  prodExp, prodPick, quotExp, quotPick, powPow, powProd, powQuot, negBase, negSame, zeroExp, zeroContrast, tenDec, tenExp,
  negExp, negWhich, minusPair, zeroMix, lawVal, sumPow, justify, monoExp, monoPick,
};
