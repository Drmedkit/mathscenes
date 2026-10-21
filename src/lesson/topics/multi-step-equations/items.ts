// items.ts: exercise families for "multi-step linear equations with rational coefficients" (secondary-t5-44), generated
// from templates, checked exactly (core/math Q), and every wrong answer the classifiers know carries its catalogue id
// (math-curriculum-essentials/misconceptions.json). A generator gets the SUB-GOAL it practises (plan.ts) and uses that
// sub-goal's cases from the topic JSON. Typed solutions are classified by the linear-equations classifier (read-only
// import: partial distribution, negative-first-term, scaling only some terms, sign slips, intermediate results)
// plus this topic's own slips (grouping a fraction bar, cross-multiplying a sum, a detached minus sign).
// Pure: no DOM, no canvas; a seeded rng makes sessions repeatable.
import { type Item, type Response, type Verdict, fr, int, pick, shuffle } from '../../runtime/item';
import { type Q, qAdd, qDiv, qEq, qMul, rat } from '../../../core/math';
import { classifySolve, workLines } from '../linear-equations/solving';
import { type ClearPic, type Eq, type Fmt, type MGrp, type MTerm, type Side, BAR, G, N, X, ZERO, clears, collected, decQ, eq, eqH, eqT, kindOf, lcm, leastClear, lin, magH, mixedH, nH, nT, neg, pow10Clear, q, qAbs, qSub, scaleEq, scaleSide, scaleSome, sideH, sideLin, sideT, solOf, solve, subH, usd, valueAt } from './msMaths';
import { pictureOf } from './clearLayout';

export type FamilyId =
  | 'evalTerm' | 'coefMeaning' | 'formMatch' | 'mixedCoef' | 'barSplit' | 'barClear' | 'sameSet' | 'scaleKeep' | 'scaleBy'
  | 'lcdPick' | 'validMult' | 'clearLine' | 'clearSolve' | 'collectLine' | 'collectSolve' | 'distFirst' | 'distSolve'
  | 'barSolve' | 'bothLine' | 'bothSolve' | 'planFirst' | 'planSolve' | 'exactForm' | 'howMany' | 'zeroTrap' | 'makeKind'
  | 'checkCand' | 'checkSide' | 'estimate' | 'nameProp' | 'firstBad' | 'oneValue' | 'planMeaning' | 'feasible'
  | 'writeModel' | 'storyFor';
export const FAMILIES: readonly { id: FamilyId; name: string }[] = [
  { id: 'evalTerm', name: 'A coefficient multiplies' },
  { id: 'coefMeaning', name: 'What the coefficient means' },
  { id: 'formMatch', name: 'Same coefficient, other notation' },
  { id: 'mixedCoef', name: 'Mixed-number coefficients' },
  { id: 'barSplit', name: 'The fraction bar groups' },
  { id: 'barClear', name: 'Clear, keep the group' },
  { id: 'sameSet', name: 'Same solutions?' },
  { id: 'scaleKeep', name: 'Scale the whole equation' },
  { id: 'scaleBy', name: 'Which multipliers are safe' },
  { id: 'lcdPick', name: 'The least clearing number' },
  { id: 'validMult', name: 'Does this multiplier clear it?' },
  { id: 'clearLine', name: 'Clear every term' },
  { id: 'clearSolve', name: 'Clear, then solve' },
  { id: 'collectLine', name: 'Combine like terms' },
  { id: 'collectSolve', name: 'Combine, then solve' },
  { id: 'distFirst', name: 'Distribute or undo the factor' },
  { id: 'distSolve', name: 'A factor in front' },
  { id: 'barSolve', name: 'Binomial numerators' },
  { id: 'bothLine', name: 'x-terms on both sides' },
  { id: 'bothSolve', name: 'Solve with x on both sides' },
  { id: 'planFirst', name: 'Plan the first move' },
  { id: 'planSolve', name: 'The full solve' },
  { id: 'exactForm', name: 'Keep it exact' },
  { id: 'howMany', name: 'One, none, or every number' },
  { id: 'zeroTrap', name: 'What the last line says' },
  { id: 'makeKind', name: 'Make it that kind' },
  { id: 'checkCand', name: 'Check in the original' },
  { id: 'checkSide', name: 'Work out one side' },
  { id: 'estimate', name: 'Estimate first' },
  { id: 'nameProp', name: 'Name the property' },
  { id: 'firstBad', name: 'Find the first wrong line' },
  { id: 'oneValue', name: 'One value is not a proof' },
  { id: 'planMeaning', name: 'What the solution means' },
  { id: 'feasible', name: 'Does it make sense?' },
  { id: 'writeModel', name: 'Story to relation' },
  { id: 'storyFor', name: 'Relation to story' },
];
export const FAMILY_NAMES: Record<string, string> = Object.fromEntries(FAMILIES.map(f => [f.id, f.name]));

/** the balance picture: the pans as given; replay = what the page plays after a miss */
export interface ClearPicItem { pic: ClearPic; e: Eq; replay: 'solve' | 'clear' | 'kind' | 'none' }
export interface MsItem extends Item { family: FamilyId; picture?: { clear?: ClearPicItem; lines?: string[] } }
type Gen = (R: () => number, n: number, sg?: string) => MsItem;

// ---------- misconception ids ----------
export const MC = {
  coefAdd: 'mc.expressions.reads-coefficient-as-addition',
  minusNeg: 'mc.integers.minus-sign-means-negative',
  rounded: 'mc.estimation.rounded-value-treated-as-exact',
  mixedProd: 'mc.expressions.reads-mixed-number-coefficient-as-product',
  overMisread: 'mc.expressions.misreads-variable-over-number',
  formsDiff: 'mc.expressions.fractional-coefficient-forms-treated-as-different',
  oneTermNum: 'mc.expressions.divides-only-one-term-of-numerator',
  negFirst: 'mc.integers.distribute-negative-first-term-only',
  eqVsIdentity: 'mc.linear-equations.equivalent-equation-vs-expression-identity',
  uniqueGraph: 'mc.functions-concept.unique-equation-for-graph',
  examples: 'mc.reasoning-language.examples-as-proof',
  someTerms: 'mc.linear-equations.scales-only-some-terms',
  anySame: 'mc.linear-equations.any-same-operation-preserves',
  newSolution: 'mc.linear-equations.transformed-equation-new-solution',
  pow10: 'mc.linear-equations.only-powers-of-ten-clear-decimals',
  unreduced: 'mc.fractions-concept.least-clearing-multiplier-from-unreduced-denominators',
  onlyOne: 'mc.linear-equations.only-one-multiplier-clears',
  tooSmall: 'mc.linear-equations.clearing-multiplier-too-small',
  leftOnly: 'mc.exponential-log.multiplies-only-left-side-by-exponential-factor',
  unlike: 'mc.expressions.combines-unlike-terms',
  detached: 'mc.integers.minus-sign-detached-from-term',
  partial: 'mc.properties.partial-distribution',
  grouping: 'mc.properties.ignores-grouping-symbols',
  crossSum: 'mc.linear-equations.cross-multiplies-sum',
  noSign: 'mc.linear-equations.moves-term-without-sign-change',
  bothGap: 'mc.linear-equations.unknown-on-both-sides-gap',
  notCollected: 'mc.calculus.dydx-not-collected',
  precision: 'mc.decimals.intermediate-precision-always-invalid',
  method: 'mc.estimation.method-not-chosen-from-numbers',
  zeroVsNone: 'mc.linear-equations.zero-vs-no-solution',
  cancelAll: 'mc.linear-equations.cancellation-always-infinitely-many',
  runOn: 'mc.equal-sign.run-on-chain',
  derived: 'mc.linear-equations.derived-equation-check-proves-original',
  repeatCheck: 'mc.reasoning-language.check-by-repeating-same-steps',
  noSizeCheck: 'mc.estimation.accepts-result-without-size-check',
  roundEqual: 'mc.estimation.equal-after-rounding-means-equal',
  moveSign: 'mc.linear-equations.move-and-change-sign-justification',
  familiar: 'mc.linear-equations.familiar-looking-step-is-valid',
  firstOdd: 'mc.linear-equations.error-located-at-first-suspicious-result',
  finalAnswer: 'mc.reasoning-language.judges-work-by-final-answer',
  domain: 'mc.functions-concept.context-domain-all-reals',
  defVar: 'mc.expressions.defines-variable-incompletely',
  wordOrder: 'mc.expressions.writes-operations-in-word-order',
  boundRev: 'mc.linear-equations.bound-phrase-direction-reversed',
  storyWrong: 'mc.reasoning-language.story-wrong-structure',
  slopeSign: 'mc.linear-functions.drops-slope-sign',
  // further catalogue ids the classifiers recognise
  denomTimes: 'mc.fraction-ops.multiplies-denominator-by-whole-number',
  bigDenom: 'mc.fractions-concept.common-denominator-size-or-factor-tests',
  product: 'mc.fractions-concept.denominator-product-validity-and-minimality',
  digitsAfter: 'mc.decimals.fraction-digits-after-decimal-point',
  noSolErr: 'mc.linear-equations.no-solution-means-error',
  oneSide: 'mc.equal-sign.evaluates-one-side-only',
  intermediate: 'mc.reasoning-language.reports-intermediate-result',
  bare: 'mc.reasoning-language.bare-number-without-meaning',
  wrongOrder: 'mc.linear-equations.undoes-in-wrong-order',
} as const;

// ---------- small helpers ----------
const XH = '<i>x</i>';
const nz = (R: () => number) => (R() < 0.5 ? 1 : -1);
const isInt = (v: Q) => v.q === 1;
/** a typed answer as an exact number (a fraction box, a decimal, a negative), or null */
export function readQ(r: Response): Q | null {
  try {
    if (r.kind === 'num') return Number.isFinite(r.v) ? decQ(r.v) : null;
    if (r.kind === 'frac') {
      if (![r.w, r.n, r.d].every(Number.isFinite) || r.d === 0) return null;
      const negv = (r.w < 0 || r.n < 0) !== (r.d < 0);
      if (![r.w, r.n, r.d].every(Number.isInteger)) return decQ((negv ? -1 : 1) * (Math.abs(r.w) + Math.abs(r.n) / Math.abs(r.d)));
      return rat((negv ? -1 : 1) * (Math.abs(r.w) * Math.abs(r.d) + Math.abs(r.n)), Math.abs(r.d));
    }
  } catch { return null; }
  return null;
}
/** the input and the stored right answer for an exact value */
function ansOf(v: Q, fmt: Fmt = 'frac'): Pick<MsItem, 'input' | 'answer'> {
  if (isInt(v) || (fmt === 'dec' && [2, 4, 5, 8, 10, 20, 25, 50, 100].includes(v.q))) return { input: 'num', answer: { kind: 'num', v: v.p / v.q } };
  return { input: 'frac', answer: { kind: 'frac', w: 0, n: v.p, d: v.q } };
}
interface Opt { t: string; ok?: boolean; mc?: string; say: string }
type Base = Pick<MsItem, 'id' | 'family' | 'subgoal' | 'prompt' | 'board' | 'solution' | 'picture'>;
function base(fam: FamilyId, n: number, sg: string | undefined, prompt: string, board: string, solution: string[], picture?: MsItem['picture']): Base {
  return { id: `${fam}-${n}`, family: fam, subgoal: sg, prompt, board, solution, ...(picture ? { picture } : {}) };
}
/** a multiple-choice item: options shuffled, exactly one right */
function choose(R: () => number, b: Base, opts: Opt[]): MsItem {
  const ts = opts.map(o => o.t);
  if (new Set(ts).size !== ts.length || opts.filter(o => o.ok).length !== 1) throw new Error(`choose: bad options in ${b.family}: ${ts.join(' | ')}`);
  const order = shuffle(R, opts.map((_, i) => i));
  return {
    ...b, input: 'choice', choices: order.map(i => opts[i]!.t), answer: { kind: 'choice', i: order.findIndex(i => opts[i]!.ok) },
    check: (r: Response): Verdict => {
      if (r.kind !== 'choice') return { ok: false, say: 'Pick one of the answers.' };
      const o = opts[order[r.i] ?? -1];
      return o ? { ok: !!o.ok, mc: o.mc, say: o.say } : { ok: false, say: 'Pick one of the answers.' };
    },
  };
}
/** a typed exact value with a list of known slips */
function typed(b: Base, v: Q, fmt: Fmt, unit: string, slips: [Q, string | undefined, string][], hint: string, okSay: string): MsItem {
  return {
    ...b, ...ansOf(v, fmt), unit,
    check: (r: Response): Verdict => {
      const t = readQ(r);
      if (!t) return { ok: false, say: 'Type a number: a whole number, a fraction, or a decimal.' };
      if (qEq(t, v)) return { ok: true, say: okSay };
      for (const [w, mc, say] of slips) if (qEq(w, t) && !qEq(w, v)) return { ok: false, mc, say };
      return { ok: false, say: hint };
    },
  };
}
/** retry a generator body until it returns an item (some random draws do not fit) */
function retry<T>(f: () => T | null): T { for (let i = 0; i < 60; i++) { const v = f(); if (v) return v; } throw new Error('retry: no fitting draw'); }
const picOf = (e: Eq, replay: ClearPicItem['replay']) => { const pic = pictureOf(e); return pic ? { clear: { pic, e, replay } } : undefined; };
/** solve an equation: typed answer, classified; topic-specific extra slips first */
function solveItem(fam: FamilyId, n: number, sg: string | undefined, e: Eq, o: { prompt?: string; pic?: boolean; extra?: [Q, string, string][]; unit?: string; lines?: string[] } = {}): MsItem {
  const x = solOf(e);
  const b = base(fam, n, sg, o.prompt ?? `Solve ${eqH(e)}.`, eqT(e), workLines(e), o.pic ? picOf(e, 'solve') : o.lines ? { lines: o.lines } : undefined);
  return {
    ...b, ...ansOf(x, e.fmt), unit: o.unit ?? '',
    check: (r: Response): Verdict => {
      const v = readQ(r);
      if (v && !qEq(v, x)) for (const [w, mc, say] of o.extra ?? []) if (qEq(w, v) && !qEq(w, x)) return { ok: false, mc, say };
      return classifySolve(e, v);
    },
  };
}
const solOr = (e: Eq): Q | null => { const s = solve(e); return s.kind === 'one' ? s.x : null; };
/** a reduced fraction a/b (not whole) with b from dens and 0 < a/b < max */
function fracQ(R: () => number, dens: readonly number[], max = 3): Q {
  for (;;) { const b = pick(R, dens), a = int(R, 1, b * max - 1); const v = rat(a, b); if (v.q > 1) return v; }
}
/** written in decimals inside a fraction equation (0.5(x - 2) + x/3 = ...) */
const dec = <T extends MTerm | MGrp>(p: T): T => ({ ...p, fmt: 'dec' as Fmt });
const sumH = (s: Side, fmt: Fmt = 'frac') => sideH(s, fmt);

// ======================================================================================================
// 1 coefficient-as-multiplier
const evalTerm: Gen = (R, n, sg) => {
  const dec = R() < 0.3, d = pick(R, [2, 4, 5, 10]);
  let c: Q;
  if (R() < 0.15) c = rat(nz(R));
  else for (;;) { const a = int(R, 1, 5 * d); c = rat(nz(R) * a, d); if (c.q > 1 && (!dec || [2, 4, 5, 10].includes(c.q))) break; }
  const x = rat(nz(R) * c.q * int(R, 1, 4)), v = qMul(c, x), fmt: Fmt = dec ? 'dec' : 'frac';
  const tH = sideH([X(c)], fmt), tT = sideT([X(c)], fmt);
  const add = qAdd(c, x);
  return typed(base('evalTerm', n, sg, `What is ${tH} when ${XH} = ${nH(x)}?`, `${tT} \\text{ at } x = ${nT(x)}`,
    [`${tH} means ${nH(c, fmt)} × ${XH}.`, `${nH(c, fmt)} × (${nH(x)}) = <b class="s">${nH(v)}</b>.`]),
  v, 'frac', '', [
    [add, MC.coefAdd, `A number in front of ${XH} multiplies it: ${nH(c, fmt)} × (${nH(x)}), not ${nH(c, fmt)} + (${nH(x)}).`],
    [neg(v), v.p > 0 ? MC.minusNeg : undefined, v.p > 0 ? `A minus sign does not make it negative: negative × negative = positive. ${nH(c, fmt)} × (${nH(x)}) = ${nH(v)}.` : `Check the sign: ${nH(c, fmt)} × (${nH(x)}) is negative.`],
  ], `Multiply: ${nH(c, fmt)} × (${nH(x)}).`, `Yes: ${nH(c, fmt)} × (${nH(x)}) = ${nH(v)}.`);
};
const coefMeaning: Gen = (R, n, sg) => {
  const c = fracQ(R, [2, 4, 5, 10, 3], 2), over = R() < 0.5;
  if (R() < 0.5) {
    const tH = sideH([X(c, over ? 'over' : undefined)]);
    return choose(R, base('coefMeaning', n, sg, `What does ${tH} mean?`, sideT([X(c, over ? 'over' : undefined)]), [`${tH} is ${magH(c)} of ${XH}: ${XH} multiplied by ${magH(c)}.`]), [
      { t: `${XH} multiplied by ${magH(c)}`, ok: true, say: `Yes: the coefficient multiplies ${XH}. ${tH} is ${magH(c)} of ${XH}.` },
      { t: `${XH} + ${magH(c)}`, mc: MC.coefAdd, say: `Side by side means multiply, not add: ${tH} = ${magH(c)} × ${XH}.` },
      { t: `${c.p} divided by ${c.q}${XH}`, mc: MC.overMisread, say: `${XH} stays in the numerator: ${fr(`${c.p === 1 ? '' : c.p}${XH}`, c.q)} = ${magH(c)} × ${XH}, not ${c.p} ÷ (${c.q}${XH}).` },
    ]);
  }
  const tH = sideH([X(neg(c))]);
  return choose(R, base('coefMeaning', n, sg, `${XH} is a negative number. What can you say about ${tH}?`, `${sideT([X(neg(c))])},\\ x < 0`, [`${tH} = −${magH(c)} × ${XH}. A negative times a negative is positive.`]), [
    { t: 'It is positive', ok: true, say: `Yes: −${magH(c)} times a negative number is positive.` },
    { t: 'It is negative, because of the minus sign', mc: MC.minusNeg, say: `The minus sign means “the opposite”. The opposite of a negative amount is positive.` },
    { t: `It is ${XH} − ${magH(c)}`, mc: MC.coefAdd, say: `The coefficient multiplies: ${tH} = −${magH(c)} × ${XH}.` },
  ]);
};

// 2 equivalent-coefficient-forms
const DEC_DENS = [2, 4, 5, 10, 20, 25] as const, REP_DENS = [3, 6, 7, 9, 11, 12] as const;
const decOf = (c: Q) => String(Math.round((c.p / c.q) * 1000) / 1000);
const formMatch: Gen = (R, n, sg) => {
  const v = int(R, 0, 3);
  if (v === 0) {
    const c = fracQ(R, [3, 4, 5, 7, 8, 9], 2), s = nz(R), sg0 = s < 0 ? '−' : '';
    const over = `${sg0}${fr(`${c.p === 1 ? '' : c.p}${XH}`, c.q)}`;
    return choose(R, base('formMatch', n, sg, `Which one is the same as ${over}?`, sideT([X(qMul(c, rat(s)), 'over')]), [`Dividing by ${c.q} is multiplying by ${fr(1, c.q)}: ${over} = ${sg0}${magH(c)}${XH}.`]), [
      { t: `${sg0}${magH(c)}${XH}`, ok: true, say: `Yes: ${over} = ${sg0}${magH(c)} × ${XH}.` },
      { t: `${sg0}${fr(c.p, `${c.q}${XH}`)}`, mc: MC.overMisread, say: `The ${XH} is in the numerator: ${over} means ${sg0}${c.p}${XH} ÷ ${c.q}, not ${c.p} ÷ (${c.q}${XH}).` },
      { t: `${sg0}${fr(c.q, c.p)}${XH}`, say: `That flips the fraction. ${over} = ${sg0}${magH(c)}${XH}.` },
    ]);
  }
  if (v === 1) {
    let c: Q; do c = fracQ(R, DEC_DENS, 2); while (!DEC_DENS.includes(c.q as never));
    const s = nz(R), sg0 = s < 0 ? '−' : '', digits = `0.${c.p}${c.q}`, d = decOf(c);
    const wrong2 = `${c.p}.${c.q}`;
    const opts: Opt[] = [
      { t: `${sg0}${d}${XH}`, ok: true, say: `Yes: ${magH(c)} = ${c.p} ÷ ${c.q} = ${d}.` },
      { t: `${sg0}${digits}${XH}`, mc: MC.digitsAfter, say: `A fraction is a division: ${c.p} ÷ ${c.q} = ${d}, not the digits written after a point.` },
    ];
    if (wrong2 !== d && wrong2 !== digits) opts.push({ t: `${sg0}${wrong2}${XH}`, say: `${magH(c)} is ${c.p} ÷ ${c.q} = ${d}.` });
    return choose(R, base('formMatch', n, sg, `Which decimal form is the same as ${sg0}${magH(c)}${XH}?`, sideT([X(qMul(c, rat(s)))]), [`${magH(c)} = ${c.p} ÷ ${c.q} = ${d}, so ${sg0}${magH(c)}${XH} = ${sg0}${d}${XH}.`]), opts);
  }
  if (v === 2) {
    const b = pick(R, REP_DENS), a = pick(R, [1, 2, 4, 5, 7].filter(k => k < b && rat(k, b).q === b)), c = rat(a, b);
    const r2 = (Math.floor((a / b) * 100) / 100).toFixed(2);
    return choose(R, base('formMatch', n, sg, `Is ${magH(c)}${XH} the same as ${r2}${XH}?`, `${sideT([X(c)])} \\overset{?}{=} ${r2}x`, [`${a} ÷ ${b} = ${(a / b).toFixed(4)}… never stops. ${r2} is rounded, so it is close but not equal. Keep ${magH(c)}${XH}.`]), [
      { t: `No: ${r2} is a rounded value; ${magH(c)} is exact`, ok: true, say: `Right: the decimal of ${magH(c)} repeats forever. ${r2}${XH} is only close to ${magH(c)}${XH}.` },
      { t: `Yes: ${magH(c)} = ${r2}`, mc: MC.rounded, say: `${a} ÷ ${b} = ${(a / b).toFixed(4)}… The decimal never ends, so ${r2} is only an approximation.` },
      { t: `Yes, but only when ${XH} is small`, mc: MC.examples, say: `For a large ${XH} the gap grows: ${magH(c)} and ${r2} are different numbers.` },
    ]);
  }
  const c = fracQ(R, [3, 4, 5, 6, 7, 8], 2);
  const A = fr(`${c.p}${XH}`, c.q), Bq = `${magH(c)}${XH}`;
  return choose(R, base('formMatch', n, sg, `Are ${A} and ${Bq} equal?`, `\\dfrac{${c.p}x}{${c.q}} \\overset{?}{=} \\dfrac{${c.p}}{${c.q}}x`, [`${A} means (${c.p} × ${XH}) ÷ ${c.q}; ${Bq} means ${c.p} ÷ ${c.q} × ${XH}. The same number for every ${XH}.`]), [
    { t: `Yes, for every ${XH}: dividing by ${c.q} is multiplying by ${fr(1, c.q)}`, ok: true, say: `Yes: two notations, one coefficient.` },
    { t: 'No: one divides, the other multiplies', mc: MC.formsDiff, say: `Dividing by ${c.q} IS multiplying by ${fr(1, c.q)}. Both are ${magH(c)} × ${XH}.` },
    { t: `Only when ${XH} = ${c.q}`, mc: MC.examples, say: `They agree for every ${XH}, not just one: both are ${magH(c)} × ${XH}.` },
  ]);
};
const mixedCoef: Gen = (R, n, sg) => {
  const d = pick(R, [2, 3, 4]), w = int(R, 1, 3), r = pick(R, Array.from({ length: d - 1 }, (_, i) => i + 1).filter(k => rat(k, d).q === d));
  const c = rat(w * d + r, d), mh = `${w}&#8202;${fr(r, d)}`;
  if (R() < 0.45) {
    return typed(base('mixedCoef', n, sg, `Write ${mh}&#8202;${XH} with one fraction: ${mh}&#8202;${XH} = □${XH}. What goes in the box?`, `${w}\\tfrac{${r}}{${d}}\\,x = \\square\\, x`,
      [`${mh} = ${w} + ${fr(r, d)} = ${fr(w * d, d)} + ${fr(r, d)} = ${fr(w * d + r, d)}.`]),
    c, 'frac', '', [[rat(w * r, d), MC.mixedProd, `${mh} means ${w} + ${fr(r, d)}, not ${w} × ${fr(r, d)}. So it is ${fr(w * d + r, d)}.`], [rat(w + r, d), undefined, `${w} wholes are ${fr(w * d, d)}: ${fr(w * d, d)} + ${fr(r, d)} = ${fr(w * d + r, d)}.`]],
    `${mh} = ${w} + ${fr(r, d)}. Write ${w} as ${d}ths first.`, `Yes: ${mh} = ${fr(w * d + r, d)}.`);
  }
  return retry(() => {
    const x = int(R, 1, 8), rhs = qMul(c, rat(x));
    if (!isInt(rhs) || rhs.p > 30) return null;
    const e = eq([X(c, 'mixed')], [N(rhs)]);
    const wrongX = qDiv(rhs, rat(w * r, d));
    return solveItem('mixedCoef', n, sg, e, { prompt: `Solve ${eqH(e)}.`, pic: true, extra: [[wrongX, MC.mixedProd, `${mh} is ${w} + ${fr(r, d)} = ${fr(w * d + r, d)}, not ${w} × ${fr(r, d)}.`]] });
  });
};

// 3 fraction-bar-grouping
const barSplit: Gen = (R, n, sg) => retry(() => {
  const b = int(R, 2, 9), a = int(R, 1, 9);
  if (a % b === 0 || a === b) return null;
  const ab = magH(rat(a, b)), xb = fr(XH, b);
  if (R() < 0.5) {
    const p = R() < 0.35 ? 2 : 1, px = `${p === 1 ? '' : p}${XH}`, pxb = p === 1 ? xb : `${magH(rat(p, b))}${XH}`;
    const top = fr(`${px} + ${a}`, b);
    return choose(R, base('barSplit', n, sg, `Which one is equal to ${top}?`, `\\dfrac{${p === 1 ? '' : p}x + ${a}}{${b}}`, [`The bar groups the whole top: ${top} = ${fr(1, b)}(${px} + ${a}) = ${pxb} + ${ab}.`]), [
      { t: `${pxb} + ${ab}`, ok: true, say: `Yes: every term on top is divided by ${b}.` },
      { t: `${px} + ${ab}`, mc: MC.oneTermNum, say: `The bar divides the WHOLE top by ${b}, the ${px} too.` },
      { t: `${pxb} + ${a}`, mc: MC.grouping, say: `The bar is a grouping symbol: the ${a} is divided by ${b} as well.` },
    ]);
  }
  const top = `−${fr(`${XH} − ${a}`, b)}`;
  return choose(R, base('barSplit', n, sg, `Which one is equal to ${top}?`, `-\\dfrac{x - ${a}}{${b}}`, [`${top} = −${fr(1, b)}(${XH} − ${a}) = −${xb} + ${ab}. The minus applies to the whole top.`]), [
    { t: `−${xb} + ${ab}`, ok: true, say: `Yes: minus times minus ${a} gives plus ${ab}.` },
    { t: `−${xb} − ${ab}`, mc: MC.negFirst, say: `The minus in front applies to every term on top: −(−${a}) is + ${a}.` },
    { t: `−${xb} − ${a}`, mc: MC.grouping, say: `The bar groups the top: the ${a} is divided by ${b}, and the minus flips its sign.` },
  ]);
});
/** (x ± a)/b + x/c = r and friends, written with fraction bars */
function barEq(R: () => number, positive: boolean): { e: Eq; M: number; kind: 'sum' | 'diff' | 'two' } | null {
  const t = positive ? int(R, 0, 1) : int(R, 0, 2);
  if (t <= 1) {
    const [b, c] = positive ? pick(R, [[2, 3], [3, 2], [2, 4], [4, 2], [3, 6], [6, 3], [2, 6], [6, 2]] as const) : (() => { const b0 = pick(R, [2, 3, 4, 5]); return [b0, pick(R, [2, 3, 4, 5, 6].filter(k => k !== b0))] as const; })();
    const a = int(R, 1, positive ? 4 : 6) * (positive || R() < 0.4 ? 1 : -1);
    const x = int(R, 1, positive ? 8 : 12);
    const e0 = eq([BAR(b, 1, X(1), N(a)), X(rat(1, c), 'over')], [N(0)]);
    const val = valueAt(e0.L, rat(x));
    if (!isInt(val) || val.p <= 0 || val.p > 20) return null;
    const e = eq(e0.L, [N(val)]);
    if (positive && !pictureOf(e)) return null;
    return { e, M: lcm(b, c), kind: a > 0 ? 'sum' : 'diff' };
  }
  const b = pick(R, [3, 5]), d = pick(R, [2, 4].filter(k => k !== b)), p = int(R, 2, 3), a = int(R, 1, 4), cc = int(R, 1, 6);
  const e = eq([BAR(b, 1, X(p), N(-a))], [BAR(d, 1, X(1), N(cc))]);
  const s = solOr(e);
  if (!s || !isInt(s) || Math.abs(s.p) > 30) return null;
  return { e, M: lcm(b, d), kind: 'two' };
}
const barClear: Gen = (R, n, sg) => retry(() => {
  const B = barEq(R, R() < 0.6);
  if (!B) return null;
  const { e, M } = B, good = scaleEq(e, M);
  const g0 = e.L[0] as { f: Q; e: MTerm[] }, F = qMul(g0.f, rat(M));
  const groupLoose: Side = [X(qMul(F, g0.e[0]!.c)), ...g0.e.slice(1), ...scaleSide(e.L.slice(1), rat(M))];
  const opts: Opt[] = [
    { t: eqH(good), ok: true, say: `Yes: × ${M} on every term, and each top stays together in parentheses.` },
    { t: `${sumH(groupLoose)} = ${sumH(scaleSide(e.R, rat(M)))}`, mc: MC.grouping, say: `The bar groups the whole top: ${M} × ${sideH([e.L[0]!])} = ${sideH(scaleSide([e.L[0]!], rat(M)))}, so EVERY term in the parentheses is multiplied.` },
  ];
  if (B.kind !== 'two') {
    opts.push({ t: `${sumH(scaleSide(e.L, rat(M)))} = ${sumH(e.R)}`, mc: MC.someTerms, say: `Every term on BOTH sides gets × ${M}: the ${sideH(e.R)} on the right too.` });
    const c = (e.L[1] as MTerm).c.q, b = g0.f.q;
    opts.push({ t: `${c}(${sideH(g0.e)}) = ${b}${XH}`, mc: MC.crossSum, say: `Cross-multiplying is for one fraction = one fraction. Here two fractions are ADDED on one side, and the ${sideH(e.R)} matters.` });
  } else opts.push({ t: `${sideH(scaleSide(e.L, rat(M)))} = ${sideH(e.R)}`, mc: MC.leftOnly, say: `Multiply BOTH sides by ${M}, the right side too.` });
  return choose(R, base('barClear', n, sg, `Multiply every term of ${eqH(e)} by ${M}. Which line do you get?`, eqT(e), [`${M} × each fraction: the denominator divides into ${M}, and the top keeps its parentheses.`, `${eqH(good)}.`], picOf(e, 'clear')), opts);
});

// 4 equivalent-equations-solution-set
const sameSet: Gen = (R, n, sg) => {
  const v = int(R, 0, 3);
  if (v === 0 || v === 2) {
    const dec = v === 2;
    const c = dec ? pick(R, [rat(2, 5), rat(1, 2), rat(3, 4), rat(1, 4), rat(6, 5)]) : fracQ(R, [2, 3, 4, 5], 2);
    const x = rat(int(R, 1, 9) * c.q), k = dec ? rat(int(R, 1, 5)) : ZERO;
    const e1 = eq(lin(c, k), [N(qAdd(qMul(c, x), k))], dec ? 'dec' : 'frac');
    return choose(R, base('sameSet', n, sg, `Are ${eqH(e1)} and ${XH} = ${nH(x)} equivalent equations?`, `${eqT(e1)} \\quad\\text{and}\\quad x = ${nT(x)}`, [`Each equation turns into ${XH} = ${nH(x)} by steps that can be undone, so both have exactly one solution, ${nH(x)}.`], { lines: [eqT(e1), `x = ${nT(x)}`] }), [
      { t: `Yes: each has exactly one solution, ${XH} = ${nH(x)}`, ok: true, say: `Yes: same solution set, so equivalent.` },
      { t: 'No: they look different, so their solutions differ', mc: MC.uniqueGraph, say: `Different-looking equations can have exactly the same solutions. Both have only ${XH} = ${nH(x)}.` },
      { t: `No: equivalent means equal for every ${XH}`, mc: MC.eqVsIdentity, say: `That is what equivalent EXPRESSIONS means. Equivalent EQUATIONS have the same solutions.` },
    ]);
  }
  if (v === 1) {
    const f = pick(R, [rat(1, 2), rat(1, 3), rat(1, 4)]), a = f.q * int(R, 1, 2), b = f.q * int(R, 1, 4), x = rat(int(R, 2, 9));
    const fd = R() < 0.5;
    const e2 = eq([G(f, X(a), N(b))], [X(qMul(f, rat(a))), N(qMul(f, rat(b)))]);
    if (fd) { (e2.L[0] as { fmt?: Fmt }).fmt = 'dec'; }
    return choose(R, base('sameSet', n, sg, `${XH} = ${nH(x)} and ${eqH(e2)} are both true when ${XH} = ${nH(x)}. Are they equivalent?`, `x = ${nT(x)} \\quad\\text{and}\\quad ${eqT(e2)}`, [`${sideH(e2.L)} = ${sideH(e2.R)} for EVERY ${XH}: every number is a solution. ${XH} = ${nH(x)} has one solution. Different solution sets.`], { lines: [`x = ${nT(x)}`, eqT(e2)] }), [
      { t: `No: the second is true for every ${XH}, the first only for ${nH(x)}`, ok: true, say: `Right: one shared value is not enough when an equation has more than one solution.` },
      { t: `Yes: ${XH} = ${nH(x)} makes both true`, mc: MC.examples, say: `Try ${XH} = 0: the second is true, the first is not. Their solution sets differ.` },
      { t: 'No: the second has no solution', say: `Expand it: both sides are the same, so EVERY number is a solution.` },
    ]);
  }
  return retry(() => {
    const c = fracQ(R, [2, 3, 4], 2), k = rat(int(R, 1, 6)), x = rat(int(R, 1, 8) * c.q), rhs = qAdd(qMul(c, x), k);
    if (!isInt(rhs)) return null;
    const e1 = eq([X(c), N(k)], [N(rhs)]), e2 = scaleSome(e1, c.q);
    const s2 = solOr(e2);
    if (!s2 || qEq(s2, x)) return null;
    return choose(R, base('sameSet', n, sg, `Are ${eqH(e1)} and ${eqH(e2)} equivalent?`, `${eqT(e1)} \\quad\\text{and}\\quad ${eqT(e2)}`, [`${eqH(e1)} has ${XH} = ${nH(x)}; ${eqH(e2)} has ${XH} = ${nH(s2)}. Different solutions: the ${nH(k)} was not multiplied by ${c.q}.`], { lines: [eqT(e1), eqT(e2)] }), [
      { t: `No: the first has ${XH} = ${nH(x)}, the second ${XH} = ${nH(s2)}`, ok: true, say: `Right. Multiplying by ${c.q} only keeps the solution if EVERY term is multiplied.` },
      { t: `Yes: the second is the first times ${c.q}`, mc: MC.someTerms, say: `Not every term was multiplied: ${c.q} × ${nH(k)} is ${nH(qMul(k, rat(c.q)))}, not ${nH(k)}.` },
      { t: 'Yes: they look almost the same', mc: MC.uniqueGraph, say: `Looks do not decide it: solve both. ${nH(x)} and ${nH(s2)} differ.` },
    ]);
  });
};

/** a fraction equation for the clearing families: one side or both sides, positive (drawable) or not */
/** a positive fraction equation built backward from a whole-number balance the picture can draw (k copies clear it) */
function smallEq(R: () => number, o: { both?: boolean; whole?: boolean }): Eq | null {
  const k = pick(R, [2, 3, 4, 6]), x = int(R, 1, 6), a = int(R, 1, 5), c = o.both ? int(R, 1, 5) : 0, b = int(R, 0, 12);
  if (a === c) return null;
  const d = (a - c) * x + b;
  if (d < 0 || d > 18 || (c === 0 && d === 0)) return null;
  const L = lin(rat(a, k), rat(b, k)), Rs = lin(rat(c, k), rat(d, k));
  const cs = [rat(a, k), rat(b, k), rat(c, k), rat(d, k)];
  if (cs.every(v => v.q === 1)) return null;
  if (o.whole && !cs.slice(1).some((v, i) => v.q === 1 && v.p > 0 && i !== 1)) return null;
  return eq(L, Rs);
}
function clearEq(R: () => number, o: { positive?: boolean; both?: boolean; whole?: boolean } = {}): Eq | null {
  if (o.positive && R() < 0.85) return smallEq(R, o);
  const dens = [2, 3, 4, 6];
  const c1 = fracQ(R, o.positive ? dens : [2, 3, 4, 5, 6, 8], 2);
  const x = o.positive ? rat(int(R, 1, 6)) : rat(nz(R) * int(R, 1, 8));
  if (o.both) {
    let c2 = fracQ(R, dens, 2); if (qEq(c1, c2)) c2 = qAdd(c2, rat(1));
    const k1 = R() < 0.5 ? rat(int(R, 1, 4)) : fracQ(R, dens, 2);
    const k2 = qSub(qAdd(qMul(c1, x), k1), qMul(c2, x));
    if (o.positive && k2.p <= 0) return null;
    if (k2.p === 0) return null;
    return eq([X(c1), N(k1)], lin(c2, k2));
  }
  const whole = o.whole ?? R() < 0.6;
  const k1 = whole ? rat(int(R, 1, 6) * (o.positive ? 1 : nz(R))) : qMul(fracQ(R, dens, 2), rat(o.positive ? 1 : nz(R)));
  const rhs = qAdd(qMul(c1, x), k1);
  if (rhs.p === 0 || (o.positive && rhs.p < 0)) return null;
  if (whole && !isInt(rhs)) return null;
  return eq([X(c1), N(k1)], [N(rhs)]);
}
const hasWholeConst = (e: Eq) => [...e.L, ...e.R].some(p => !('f' in p) && p.v === '' && p.c.q === 1);
const scaleKeep: Gen = (R, n, sg) => retry(() => {
  const e = clearEq(R, { positive: R() < 0.7, both: R() < 0.4, whole: true });
  if (!e || !hasWholeConst(e)) return null;
  const M = leastClear(e), good = collectedEq(scaleEq(e, M)), some = collectedEq(scaleSome(e, M));
  if (eqH(good) === eqH(some)) return null;
  const opts: Opt[] = [
    { t: eqH(good), ok: true, say: `Yes: that is every term times ${M}, and ${M} is not 0.` },
    { t: eqH(some), mc: MC.someTerms, say: `The whole numbers were not multiplied. × ${M} has to reach EVERY term on both sides.` },
    { t: '0 = 0', mc: MC.anySame, say: `× 0 on both sides gives 0 = 0, true for every number: it gains solutions. Multiply by a number that is not 0.` },
  ];
  return choose(R, base(  'scaleKeep', n, sg, `Which equation has exactly the same solutions as ${eqH(e)}?`, eqT(e), [`Multiply EVERY term on both sides by ${M} (not 0): ${eqH(good)}.`, `× 0 is never safe: it turns any equation into 0 = 0.`], picOf(e, 'clear')), opts);
});
const collectedEq = (e: Eq): Eq => ({ L: collected(e.L), R: collected(e.R), fmt: e.fmt });
const scaleBy: Gen = (R, n, sg) => retry(() => {
  const e = clearEq(R, { both: R() < 0.4, positive: R() < 0.6 });
  if (!e) return null;
  const M = pick(R, [rat(-2), rat(-3), rat(1, 2), rat(2, 3), rat(0), rat(0), rat(6), rat(10), rat(-1, 4)]);
  const lines = [eqT(e), `\\times\\,${M.p < 0 ? `(${nT(M)})` : nT(M)}\\ \\text{on every term}`];
  const pic = picOf(e, 'none') ?? { lines };
  if (M.p === 0) return choose(R, base('scaleBy', n, sg, `Multiply every term on both sides of ${eqH(e)} by 0. Are the solutions still the same?`, eqT(e), [`× 0 turns both sides into 0: 0 = 0 is true for EVERY number, so solutions are gained. It cannot be undone (no ÷ 0).`], pic), [
    { t: 'No: it becomes 0 = 0, true for every number', ok: true, say: `Right: × 0 cannot be undone, so it changes the solutions.` },
    { t: 'Yes: the same thing was done to both sides', mc: MC.anySame, say: `“The same to both sides” is not enough: the step must be undoable. × 0 cannot be undone.` },
    { t: 'Yes: 0 clears every fraction', mc: MC.anySame, say: `It clears the fractions by wiping out everything, x too. 0 = 0 is true for every number.` },
  ]);
  return choose(R, base('scaleBy', n, sg, `Multiply every term on both sides of ${eqH(e)} by ${nH(M)}. Are the solutions still the same?`, eqT(e), [`${nH(M)} is not 0, so × ${nH(M)} can be undone by ÷ ${nH(M)}: the solutions stay the same (the multiplication property of equality).`], pic), [
    { t: `Yes: ${nH(M)} is not 0, so the step can be undone`, ok: true, say: `Right: any nonzero multiplier on every term keeps the solutions.` },
    { t: M.p < 0 ? 'No: a negative multiplier flips the solution' : 'No: a new-looking equation has a new solution', mc: MC.newSolution, say: `The equation looks different, but the step can be undone, so the solutions are the same.` },
    { t: 'No: only the least common denominator keeps it', mc: MC.onlyOne, say: `Any nonzero number keeps the solutions. The least common denominator is just the tidiest choice for clearing.` },
  ]);
});

// 6 choose-clearing-multiplier
interface DenEq { e: Eq; dens: number[]; rawDens: number[] }
function denEq(R: () => number): DenEq | null {
  const t = int(R, 0, 4);
  if (t === 4) {
    const opts: [number, number][] = [[0.5, 1.25], [0.2, 0.75], [0.4, 1.5], [0.25, 0.3], [1.5, 0.25], [0.6, 0.05]];
    const [a, b] = pick(R, opts), r = int(R, 2, 9);
    const e = eq([X(decQ(a)), N(decQ(b))], [N(r)], 'dec');
    return { e, dens: [decQ(a).q, decQ(b).q], rawDens: [] };
  }
  const pairs: [number, number][][] = [[[2, 4], [3, 6], [2, 6], [4, 8], [5, 10], [3, 9]], [[3, 4], [2, 3], [2, 5], [3, 5], [4, 5], [5, 6]], [[4, 6], [6, 8], [4, 10], [6, 9], [8, 12], [10, 12], [6, 10]]];
  if (t === 3) {
    // an unreduced coefficient: 6/8 is really 3/4
    const [rp, rq] = pick(R, [[6, 8], [4, 6], [2, 6], [9, 12], [10, 12], [3, 9]] as [number, number][]);
    const c = rat(rp, rq), d2 = pick(R, [2, 3, 4, 5].filter(k => lcm(c.q, k) !== lcm(rq, k)));
    if (!d2) return null;
    const k = rat(int(R, 1, d2 - 1), d2);
    if (k.q !== d2) return null;
    const e = eq([{ ...X(c), raw: [rp, rq] } as MTerm, N(k)], [N(int(R, 2, 9))]);
    return { e, dens: [c.q, d2], rawDens: [rq, d2] };
  }
  const [d1, d2] = pick(R, pairs[t]!);
  const c = rat(int(R, 1, d1 - 1), d1), k = rat(int(R, 1, d2 - 1), d2);
  if (c.q !== d1 || k.q !== d2) return null;
  const e = R() < 0.5 ? eq([X(c), N(k)], [N(int(R, 1, 9))]) : eq([X(c)], [N(k)]);
  return { e, dens: [d1, d2], rawDens: [d1, d2] };
}
const lcdPick: Gen = (R, n, sg) => retry(() => {
  const D = denEq(R);
  if (!D) return null;
  const { e } = D, L = leastClear(e), dec = e.fmt === 'dec';
  const rawL = D.rawDens.length ? D.rawDens.reduce(lcm, 1) : L, prod = D.dens.reduce((a, b) => a * b, 1), big = Math.max(...D.dens);
  const slips: [Q, string | undefined, string][] = [];
  const raw = (e.L[0] as MTerm).raw;
  if (rawL !== L && raw) slips.push([rat(rawL), MC.unreduced, `Reduce first: ${fr(raw[0], raw[1])} = ${magH((e.L[0] as MTerm).c)}. Then the denominators are ${D.dens.join(' and ')}, and the least is ${L}.`]);
  if (dec) { const p10 = pow10Clear(e); if (p10 !== L) slips.push([rat(p10), MC.pow10, `${p10} clears it, but a smaller whole number does too: write the decimals as fractions (${D.dens.map(d => `…/${d}`).join(', ')}); the least common multiple is ${L}.`]); }
  if (prod !== L) slips.push([rat(prod), MC.product, `${prod} works, but it is not the least: ${L} is already a multiple of ${D.dens.join(' and ')}.`]);
  if (!clears(e, big)) slips.push([rat(big), MC.bigDenom, `The largest denominator is not always enough: ${big} × ${magH((e.L[0] as MTerm).c, e.fmt)} still leaves a fraction. You need a multiple of ${D.dens.join(' and ')}.`]);
  const ask = dec ? 'clears every decimal (makes every number whole)' : 'clears every fraction';
  return typed(base('lcdPick', n, sg, `What is the least positive whole number that ${ask} in ${eqH(e)}?`, eqT(e),
    [`The denominators${dec ? ' (as fractions)' : ''} are ${D.dens.join(' and ')}${D.rawDens.length && rawL !== L ? ' (after reducing)' : ''}.`, `The least common multiple of ${D.dens.join(' and ')} is <b class="s">${L}</b>.`], picOf(e, 'clear')),
  rat(L), 'frac', '', slips, `Find the least common multiple of the denominators ${D.dens.join(' and ')}.`, `Yes: ${L} is the least common multiple of ${D.dens.join(' and ')}.`);
});
const validMult: Gen = (R, n, sg) => retry(() => {
  const D = denEq(R);
  if (!D) return null;
  const { e } = D, L = leastClear(e), dec = e.fmt === 'dec';
  const kind = dec ? int(R, 0, 1) : int(R, 0, 1) + 1;
  const b0 = (M: number, sol: string) => base('validMult', n, sg, `Does multiplying every term of ${eqH(e)} by ${M} clear all the ${dec ? 'decimals' : 'fractions'}?`, `${eqT(e)} \\quad \\times ${M}`, [sol], picOf(e, 'none'));
  if (kind === 0) {
    if (L === pow10Clear(e) || L === 1) return null;
    return choose(R, b0(L, `${D.dens.map(d => `…/${d}`).join(' and ')}: ${L} is a multiple of both, so yes. No power of 10 needed.`), [
      { t: `Yes: as fractions the denominators are ${D.dens.join(' and ')}, and ${L} is a multiple of both`, ok: true, say: 'Right: any common multiple of the denominators clears them.' },
      { t: 'No: decimals only clear with 10, 100, or 1000', mc: MC.pow10, say: `Write the decimals as fractions: denominators ${D.dens.join(' and ')}. ${L} clears both.` },
      { t: `No: ${L} is too small`, say: `Try it: every number times ${L} is whole.` },
    ]);
  }
  if (kind === 1) {
    const M = L * pick(R, [2, 3]);
    return choose(R, b0(M, `${M} is a common multiple of ${D.dens.join(' and ')} (not the least, which is ${L}), so it clears every fraction. The numbers are just bigger.`), [
      { t: `Yes: ${M} is a common multiple of ${D.dens.join(' and ')}`, ok: true, say: `Right: it works, it just is not the least (${L}).` },
      { t: 'No: only the least common denominator works', mc: MC.onlyOne, say: `Any common multiple clears the fractions. ${L} is the least, ${M} works too.` },
      { t: `No: ${M} changes the solution`, mc: MC.newSolution, say: `Any nonzero multiplier on every term keeps the solution.` },
    ]);
  }
  const small = D.dens.find(d => !clears(e, d) && d > 1) ?? (L % 2 === 0 && !clears(e, L / 2) ? L / 2 : 0);
  if (!small || small === 1) return null;
  const left = D.dens.find(d => small % d !== 0)!;
  return choose(R, b0(small, `${small} is not a multiple of ${left}, so a fraction with denominator ${left} survives. Use a common multiple, like ${L}.`), [
    { t: `No: ${small} is not a multiple of ${left}, a fraction is left`, ok: true, say: `Right: ${small} is too small. ${L} would clear them all.` },
    { t: 'Yes: any multiplier clears the fractions', mc: MC.tooSmall, say: `Not quite: after × ${small}, a fraction with denominator ${left} is still there.` },
    { t: `Yes: ${small} is one of the denominators`, mc: MC.bigDenom, say: `One denominator is not enough: it must be a multiple of ${D.dens.join(' AND ')}.` },
  ]);
});

// 7 clear-every-term-two-step
const leftOnlyEq = (e: Eq, M: number): Eq => ({ L: scaleSide(e.L, rat(M)), R: e.R, fmt: e.fmt });
const clearLine: Gen = (R, n, sg) => retry(() => {
  const dec = R() < 0.25;
  let e: Eq | null;
  if (dec) {
    const a = pick(R, [0.4, 0.3, 0.6, 1.2, 0.5]), b = pick(R, [1.2, 0.8, 2.5, 0.7]), x = int(R, 1, 9) * nz(R);
    e = eq([X(decQ(a)), N(decQ(-b))], [N(decQ(Math.round((a * x - b) * 100) / 100))], 'dec');
  } else e = clearEq(R, { positive: R() < 0.6, whole: R() < 0.7 });
  if (!e) return null;
  const M = dec ? pow10Clear(e) : leastClear(e);
  if (M <= 1) return null;
  const good = scaleEq(e, M), some = scaleSome(e, M), left = leftOnlyEq(e, M);
  const opts: Opt[] = [{ t: eqH(good), ok: true, say: `Yes: every term on both sides × ${M}, the whole numbers too.` }];
  if (eqH(some) !== eqH(good)) opts.push({ t: eqH(some), mc: MC.someTerms, say: `A whole number is a term too: it also gets × ${M}, or the sides stop balancing.` });
  if (eqH(left) !== eqH(good) && !opts.some(o => o.t === eqH(left))) opts.push({ t: eqH(left), mc: MC.leftOnly, say: `Multiply BOTH sides: the right side gets × ${M} too.` });
  if (opts.length < 3) return null;
  return choose(R, base('clearLine', n, sg, `Multiply every term of ${eqH(e)} by ${M}. Which line do you get?`, eqT(e), [`× ${M} on every term, both sides: ${eqH(good)}.`], picOf(e, 'clear')), opts);
});
const clearSolve: Gen = (R, n, sg) => retry(() => {
  const t = R();
  let e: Eq | null;
  if (t < 0.2) {
    const a = pick(R, [0.4, 0.3, 0.6, 0.5, 1.5, 0.25]), b = pick(R, [1.2, 0.8, 2.5, 0.7, 0.5]), x = pick(R, [int(R, -6, 9), int(R, 1, 9) / 2]);
    if (x === 0) return null;
    e = eq([X(decQ(a)), N(decQ(-b))], [N(decQ(Math.round((a * x - b) * 1000) / 1000))], 'dec');
  } else if (t < 0.35) {
    // -(3/4)x + 2 = 1/2 : a negative fraction coefficient, a fraction answer allowed
    const c = neg(fracQ(R, [2, 3, 4, 5], 2)), k = rat(int(R, 1, 5)), rhs = fracQ(R, [2, 3, 4], 2);
    e = eq([X(c), N(k)], [N(rhs)]);
    const s = solOr(e); if (!s || Math.abs(s.p / s.q) > 20 || s.q > 12) return null;
  } else e = clearEq(R, { positive: R() < 0.65 });
  if (!e) return null;
  return solveItem('clearSolve', n, sg, e, { pic: true });
});

// 8 collect-like-terms-one-side
function collectEq(R: () => number): Eq | null {
  if (R() < 0.3) {
    const a = pick(R, [0.6, 0.8, 1.5, 0.9]), b = pick(R, [0.2, 0.5, 0.3, 0.4]), k = pick(R, [1.5, 0.5, 2.5, 1.2]);
    if (a === b) return null;
    const x = pick(R, [int(R, 1, 9), -int(R, 1, 5)]);
    return eq([X(decQ(a)), N(decQ(k)), X(decQ(-b))], [N(decQ(Math.round(((a - b) * x + k) * 1000) / 1000))], 'dec');
  }
  const a = fracQ(R, [2, 3, 4, 6, 8, 12], 2), b = fracQ(R, [2, 3, 4, 6], 1);
  if (qEq(a, b)) return null;
  const k = rat(int(R, 1, 6) * nz(R)), x = rat(int(R, -6, 12) || 3);
  const rhs = qAdd(qMul(qSub(a, b), x), k);
  if (!isInt(rhs)) return null;
  return eq([X(a), X(neg(b)), N(k)], [N(rhs)]);
}
const collectLine: Gen = (R, n, sg) => retry(() => {
  const e = collectEq(R);
  if (!e) return null;
  const l = sideLin(e.L), xs = e.L.filter(p => !('f' in p) && p.v === 'x') as MTerm[], ks = e.L.filter(p => !('f' in p) && p.v === '') as MTerm[];
  const detachedM = xs.reduce((s, t) => qAdd(s, qAbs(t.c)), ZERO), unlikeM = qAdd(l.m, l.k);
  const good = eq(lin(l.m, l.k), e.R, e.fmt);
  const opts: Opt[] = [
    { t: eqH(good), ok: true, say: `Yes: ${xs.map(t => sideH([t], e.fmt)).join(' and ')} are like terms: ${nH(l.m, e.fmt)}${XH}. The number stays a separate term.` },
    { t: eqH(eq(lin(detachedM, l.k), e.R, e.fmt)), mc: MC.detached, say: `The minus belongs to the term after it: ${sideH([xs[1]!], e.fmt)} is subtracted, not added.` },
    { t: eqH(eq([X(unlikeM)], e.R, e.fmt)), mc: MC.unlike, say: `${nH(ks[0]!.c, e.fmt)} is a number, not an ${XH}-term: it cannot join the ${XH}-terms.` },
  ];
  if (new Set(opts.map(o => o.t)).size < 3) return null;
  return choose(R, base('collectLine', n, sg, `Combine like terms on the left of ${eqH(e)}. Which line do you get?`, eqT(e), [`${XH}-terms: ${sideH(xs, e.fmt)} = ${nH(l.m, e.fmt)}${XH} (keep each sign). The number stays: ${eqH(good)}.`]), opts);
});
const collectSolve: Gen = (R, n, sg) => retry(() => {
  const e = collectEq(R);
  if (!e) return null;
  const xs = e.L.filter(p => !('f' in p) && p.v === 'x') as MTerm[], l = sideLin(e.L), r = sideLin(e.R);
  const det = solOr(eq(lin(xs.reduce((s, t) => qAdd(s, qAbs(t.c)), ZERO), l.k), [N(r.k)]));
  const extra: [Q, string, string][] = det ? [[det, MC.detached, `Keep each sign with its term: ${sideH(xs, e.fmt)} = ${nH(l.m, e.fmt)}${XH}.`]] : [];
  return solveItem('collectSolve', n, sg, e, { extra });
});

// 9 distribute-rational-factor
function distEq(R: () => number, positive = false): { e: Eq; t: number } | null {
  const t = positive ? 0 : int(R, 0, 3);
  if (t === 0) {
    const f = positive ? pick(R, [rat(1, 2), rat(1, 3), rat(2, 3), rat(1, 4), rat(3, 4), rat(3, 2)]) : fracQ(R, [2, 3, 4, 5], 2);
    const c = int(R, 1, positive ? 4 : 8) * (positive ? 1 : nz(R)), x = rat(int(R, positive ? 1 : -4, positive ? 6 : 12));
    const rhs = qMul(f, qAdd(x, rat(c)));
    if (!isInt(rhs) || rhs.p === 0 || (positive && rhs.p <= 0)) return null;
    const e = eq([G(f, X(1), N(c))], [N(rhs)]);
    if (positive && !pictureOf(e)) return null;
    return { e, t };
  }
  if (t === 1) {
    const f = rat(-1, pick(R, [2, 3])), a = f.q * int(R, 1, 3), b = f.q * int(R, 1, 4) * nz(R), x = rat(int(R, -8, 8) || 2);
    const rhs = qMul(f, qAdd(qMul(rat(a), x), rat(b)));
    return { e: eq([G(f, X(a), N(b))], [N(rhs)]), t };
  }
  if (t === 2) {
    const f = pick(R, [1.5, 2.5, 0.5, 1.2]), c = pick(R, [0.4, 0.2, 1.5, 0.6]) * nz(R), x = int(R, 1, 8);
    return { e: eq([G(decQ(f), X(1), N(decQ(c)))], [N(decQ(Math.round(f * (x + c) * 1000) / 1000))], 'dec'), t };
  }
  const f = rat(-1, 2), c = int(R, 1, 6), g = rat(1, 4), x = rat(4 * int(R, -3, 6));
  const rhs = qAdd(qMul(f, qSub(x, rat(c))), qMul(g, x));
  return { e: eq([G(f, X(1), N(-c)), X(g)], [N(rhs)]), t };
}
const distFirst: Gen = (R, n, sg) => retry(() => {
  const D = distEq(R);
  if (!D || D.t === 3) return null;
  const { e } = D, g = e.L[0] as { f: Q; e: MTerm[] }, f = g.f, rhs = (e.R[0] as MTerm).c, fmt = e.fmt;
  if (D.t === 1) {
    const ex = g.e.map(t => ({ c: qMul(f, t.c), v: t.v }));
    const nf: MTerm[] = g.e.map((t, i) => ({ c: qMul(i === 0 ? f : qAbs(f), t.c), v: t.v }));
    const pt: MTerm[] = [{ c: qMul(f, g.e[0]!.c), v: 'x' }, g.e[1]!];
    return choose(R, base('distFirst', n, sg, `First step for ${eqH(e)}: distribute. Which line is right?`, eqT(e), [`${nH(f)} times EVERY term inside, sign included: ${sideH(ex)} = ${nH(rhs)}.`]), [
      { t: `${sideH(ex)} = ${nH(rhs)}`, ok: true, say: 'Yes: the negative factor multiplies every term, and flips each sign.' },
      { t: `${sideH(nf)} = ${nH(rhs)}`, mc: MC.negFirst, say: `The minus in ${nH(f)} reaches the second term too: ${nH(f)} × (${nH(g.e[1]!.c)}) = ${nH(qMul(f, g.e[1]!.c))}.` },
      { t: `${sideH(pt)} = ${nH(rhs)}`, mc: MC.partial, say: `The factor multiplies EVERY term inside the parentheses, not just the first.` },
    ]);
  }
  const inv = qDiv(rat(1), f), inner = qMul(rhs, inv);
  const innerS = sideH(g.e, fmt);
  const undo = fmt === 'dec' ? `Divide both sides by ${nH(f, fmt)}` : `Multiply both sides by ${nH(inv)}`;
  return choose(R, base('distFirst', n, sg, `Which first step for ${eqH(e)} is right?`, eqT(e), [`${undo}: the factor disappears and the parentheses stay whole. ${innerS} = ${nH(inner, fmt)}.`]), [
    { t: `${undo}: ${innerS} = ${nH(inner, fmt)}`, ok: true, say: `Yes: undoing the factor first keeps the numbers small.` },
    { t: `Distribute: ${sideH([X(f)], fmt)} ${(g.e[1]!.c.p < 0 ? '−' : '+')} ${magH(g.e[1]!.c, fmt)} = ${nH(rhs, fmt)}`, mc: MC.partial, say: `If you distribute, the factor multiplies BOTH terms inside: ${nH(f, fmt)} × ${nH(g.e[1]!.c, fmt)} too.` },
    { t: `${undo}: ${innerS} = ${nH(rhs, fmt)}`, mc: MC.leftOnly, say: `Both sides change: the right side becomes ${nH(rhs, fmt)} × ${fmt === 'dec' ? `(1 ÷ ${nH(f, fmt)})` : nH(inv)} = ${nH(inner, fmt)}.` },
  ]);
});
const distSolve: Gen = (R, n, sg) => retry(() => {
  const D = distEq(R, R() < 0.55);
  if (!D) return null;
  const s = solOr(D.e); if (!s || s.q > 12 || Math.abs(s.p / s.q) > 40) return null;
  return solveItem('distSolve', n, sg, D.e, { pic: true });
});

// 10 clear-binomial-numerators
const barSolve: Gen = (R, n, sg) => retry(() => {
  const B = barEq(R, R() < 0.5);
  if (!B) return null;
  const { e, M } = B, g0 = e.L[0] as { f: Q; e: MTerm[] }, F = qMul(g0.f, rat(M));
  const loose: Side = [X(qMul(F, g0.e[0]!.c)), ...g0.e.slice(1), ...scaleSide(e.L.slice(1), rat(M))];
  const extra: [Q, string, string][] = [];
  const lz = solOr(eq(loose, scaleSide(e.R, rat(M))));
  if (lz) extra.push([lz, MC.grouping, `Keep each top in parentheses: ${M} × ${sideH([e.L[0]!])} = ${sideH(scaleSide([e.L[0]!], rat(M)))}, so the ${nH(g0.e[1]!.c)} is multiplied too.`]);
  if (B.kind !== 'two') {
    const cs = solOr(eq([G(rat((e.L[1] as MTerm).c.q), ...g0.e)], [X(g0.f.q)]));
    if (cs) extra.push([cs, MC.crossSum, `Cross-multiplying is for one fraction = one fraction. Here two fractions are added; multiply every term by ${M} instead.`]);
  }
  return solveItem('barSolve', n, sg, e, { pic: true, extra });
});

// 11 variables-both-sides-rational
function bothEq(R: () => number, positive: boolean): Eq | null {
  if (!positive && R() < 0.3) {
    const a = pick(R, [0.3, 0.5, 0.2, 0.7]), b = pick(R, [0.5, 0.8, 0.4, 1.2]), x = int(R, -9, 20) || 5;
    if (a === b) return null;
    const k1 = pick(R, [2, 1.5, 3, 0.5]), k2 = Math.round((a * x + k1 - b * x) * 1000) / 1000;
    if (k2 === 0) return null;
    return eq([X(decQ(a)), N(decQ(k1))], lin(decQ(b), decQ(k2)), 'dec');
  }
  return clearEq(R, { both: true, positive });
}
const bothLine: Gen = (R, n, sg) => retry(() => {
  const e = bothEq(R, R() < 0.5);
  if (!e) return null;
  const l = sideLin(e.L), r = sideLin(e.R), fmt = e.fmt;
  const good = eq(lin(ZERO, l.k), lin(qSub(r.m, l.m), r.k), fmt), wrong = eq(lin(ZERO, l.k), lin(qAdd(r.m, l.m), r.k), fmt);
  return choose(R, base('bothLine', n, sg, `Subtract ${sideH([X(l.m)], fmt)} from both sides of ${eqH(e)}. Which line do you get?`, eqT(e), [`${sideH([X(r.m)], fmt)} − ${sideH([X(l.m)], fmt)} = ${sideH([X(qSub(r.m, l.m))], fmt)}: ${eqH(good)}.`], picOf(e, 'solve')), [
    { t: eqH(good), ok: true, say: `Yes: ${sideH([X(l.m)], fmt)} comes off BOTH sides, so the right side has ${nH(qSub(r.m, l.m), fmt)}${XH} left.` },
    { t: eqH(wrong), mc: MC.noSign, say: `The term that leaves the left is SUBTRACTED on the right too: ${nH(r.m, fmt)} − ${nH(l.m, fmt)}, not ${nH(r.m, fmt)} + ${nH(l.m, fmt)}.` },
    { t: `You can't: the two ${XH}'s may be different numbers`, mc: MC.bothGap, say: `Every ${XH} in one equation is the SAME number, so ${XH}-terms on both sides can be combined.` },
  ]);
});
const bothSolve: Gen = (R, n, sg) => retry(() => {
  const e = bothEq(R, R() < 0.5);
  if (!e) return null;
  const s = solOr(e); if (!s || s.q > 12 || Math.abs(s.p / s.q) > 60) return null;
  return solveItem('bothSolve', n, sg, e, { pic: true });
});

// 12 plan-multi-step-strategy
const planFirst: Gen = (R, n, sg) => {
  const v = int(R, 0, 2);
  if (v === 0) {
    const c = fracQ(R, [3, 4, 5, 7], 1), r = c.p * int(R, 2, 9), e = eq([X(c)], [N(r)]);
    const inv = rat(c.q, c.p);
    return choose(R, base('planFirst', n, sg, `What is the quickest first move for ${eqH(e)}?`, eqT(e), [`One move: × ${nH(inv)} on both sides gives ${XH} = ${nH(qMul(rat(r), inv))}. No clearing needed.`]), [
      { t: `Multiply both sides by ${nH(inv)}`, ok: true, say: `Yes: the reciprocal undoes ${magH(c)} in one step.` },
      { t: 'Multiply both sides by 100 to clear the decimals', mc: MC.method, say: `There are no decimals here. Pick the move from the numbers you see: ${magH(c)} is undone by ${nH(inv)}.` },
      { t: `Subtract ${magH(c)} from both sides`, mc: MC.coefAdd, say: `${magH(c)}${XH} is ${magH(c)} TIMES ${XH}. Undo a multiplication with its reciprocal.` },
    ]);
  }
  if (v === 1) {
    const a = pick(R, [3, 5]), b = 4, cc = int(R, 2, 9) * 2, h = rat(1, 2), k = int(R, 1, 6);
    const e = eq([G(rat(a, b), X(1), N(-cc))], [X(h), N(k)]);
    const good = scaleEq(e, 4), some = scaleSome(e, 4);
    return choose(R, base('planFirst', n, sg, `Plan for ${eqH(e)}: which first move is right?`, eqT(e), [`× 4 on every term: ${eqH(good)}. Then distribute and collect.`]), [
      { t: `× 4 on every term: ${eqH(good)}`, ok: true, say: 'Yes: one multiplier clears both fractions at once.' },
      { t: `× 4 on the fractions only: ${eqH(some)}`, mc: MC.someTerms, say: `The ${k} is a term too: it becomes ${4 * k}.` },
      { t: `Distribute: ${sideH([X(rat(a, b))])} − ${cc} = ${sideH(e.R)}`, mc: MC.partial, say: `${fr(a, b)} multiplies BOTH terms inside: ${fr(a, b)} × ${cc} too.` },
    ]);
  }
  const k = int(R, 1, 4), e = eq([dec(G(rat(1, 2), X(1), N(-2))), X(rat(1, 3), 'over')], [dec(X(rat(1, 4))), dec(N(rat(2 * k + 1, 2)))]);
  return choose(R, base('planFirst', n, sg, `${eqH(e)} mixes decimals and a third. Which plan keeps it exact?`, eqT(e), [`Write 0.5 = ${fr(1, 2)} and 0.25 = ${fr(1, 4)}; the denominators 2, 3, 4 clear with × 12. ${fr(XH, 3)} has no exact decimal.`]), [
    { t: `Write the decimals as fractions, then × 12 on every term`, ok: true, say: 'Yes: exact all the way.' },
    { t: `Round ${fr(XH, 3)} to 0.33${XH} and work in decimals`, mc: MC.rounded, say: `0.33 is not ${fr(1, 3)}: the answer would come out slightly wrong.` },
    { t: 'Multiply every term by 100', mc: MC.tooSmall, say: `100 is not a multiple of 3: ${fr(XH, 3)} × 100 is still a fraction.` },
  ]);
};
const planSolve: Gen = (R, n, sg) => retry(() => {
  const v = int(R, 0, 3);
  let e: Eq;
  if (v === 0) { const a = pick(R, [3, 5]), cc = 2 * int(R, 1, 6), k = int(R, 1, 6); e = eq([G(rat(a, 4), X(1), N(-cc))], [X(rat(1, 2)), N(k)]); }
  else if (v === 1) { const k = int(R, 1, 3); e = eq([dec(G(rat(1, 5), X(5), N(-3)))], [dec(N(rat(7 * k, 5))), X(rat(-1, 2), 'over')]); }
  else if (v === 2) { const w = int(R, 1, 3), c = rat(2 * w + 1, 2), k1 = int(R, 1, 6), x = 2 * int(R, 1, 6); e = eq([X(c, 'mixed'), N(-k1)], [X(1), N(qSub(qMul(qSub(c, rat(1)), rat(x)), rat(k1)))]); }
  else { const c = fracQ(R, [3, 5, 7], 1), x = c.q * int(R, 1, 9); e = eq([X(c)], [N(qMul(c, rat(x)))]); }
  const s = solOr(e); if (!s || s.q > 12 || Math.abs(s.p / s.q) > 60) return null;
  return solveItem('planSolve', n, sg, e, { pic: true });
});
const exactForm: Gen = (R, n, sg) => retry(() => {
  const a = pick(R, [3, 6, 7, 9]), b = int(R, 1, 9), c = int(R, b + 1, b + 40), s = rat(c - b, a);
  if (s.q === 1 || [2, 4, 5, 8, 10].includes(s.q)) return null;
  const e = eq([X(a), N(b)], [N(c)]), v = s.p / s.q;
  if (R() < 0.3) {
    return choose(R, base('exactForm', n, sg, `Kai solves ${eqH(e)} and keeps ${XH} = ${nH(s)} as a fraction in his middle lines. A friend says every line must be rounded to two decimals. Who is right?`, `x = ${nT(s)}`, [`Exact fractions in the middle keep the final answer exact. Round only at the end, if the question asks for it.`]), [
      { t: 'Kai: exact values in the middle keep the answer exact', ok: true, say: 'Right: rounding early piles up small errors.' },
      { t: 'The friend: middle lines may not have more digits than the answer', mc: MC.precision, say: `Middle lines may keep MORE precision. Rounding early makes the answer slightly off.` },
      { t: 'Neither: equations must be solved in decimals', say: `Fractions are exact numbers too, often the best way to write the answer.` },
    ]);
  }
  const r2 = v.toFixed(2), r1 = v.toFixed(1);
  return choose(R, base('exactForm', n, sg, `Solving ${eqH(e)} gives ${XH} = ${nH(s)}. Which other way of writing it is also exact?`, `${eqT(e)}\\ \\Rightarrow\\ x = ${nT(s)}`, [`${nH(s)} = ${mixedH(s)} exactly. ${r2} is rounded: ${a} × ${r2} + ${b} is not exactly ${c}.`]), [
    { t: mixedH(s), ok: true, say: `Yes: a mixed number is exact.` },
    { t: r2, mc: MC.rounded, say: `${r2} is rounded. ${s.p} ÷ ${s.q} = ${v.toFixed(4)}… never stops.` },
    { t: r1, mc: MC.rounded, say: `${r1} is rounded, even more than ${r2}.` },
  ]);
});

// 13 / 14 identity and contradiction
function kindEq(R: () => number, want: 'one' | 'none' | 'all', positive = false): Eq {
  const f = pick(R, positive ? [rat(1, 2), rat(1, 3), rat(1, 4), rat(1, 2)] : [rat(1, 2), rat(1, 3), rat(1, 4), rat(2, 3), rat(3, 4)]), a = f.q * (positive ? 1 : int(R, 1, 2)), b = f.q * int(R, 1, positive ? 3 : 4) * (positive ? 1 : nz(R));
  const m = qMul(f, rat(a)), k = qMul(f, rat(b));
  const delta = want !== 'all' ? rat(int(R, 1, 4) * (positive ? 1 : nz(R))) : ZERO;
  const m2 = want === 'one' ? (positive ? qAdd(m, pick(R, [rat(1, 2), rat(1), rat(1, 4)])) : qSub(m, pick(R, [rat(1, 2), rat(1), rat(1, 4)]))) : m;
  const dec = [2, 4, 5].includes(f.q) && R() < 0.5;
  const R0: MTerm[] = lin(m2, qAdd(k, delta)) as MTerm[];
  if (dec) R0.forEach(t => { if ([1, 2, 4, 5].includes(t.c.q)) t.fmt = 'dec'; });
  const e = eq([G(f, X(a), N(b))], R0);
  if (kindOf(e) !== want) throw new Error('kindEq');
  return e;
}
const KIND_TXT = { one: 'Exactly one solution', none: 'No solution', all: 'Every number is a solution' } as const;
const howMany: Gen = (R, n, sg) => {
  const want: 'one' | 'none' | 'all' = sg === 'identity-after-cancel' ? pick(R, ['all', 'all', 'none', 'one'] as const) : sg === 'contradiction-after-cancel' ? pick(R, ['none', 'none', 'all', 'one'] as const) : pick(R, ['one', 'none', 'all'] as const);
  const e = kindEq(R, want, R() < 0.8);
  const ex = { L: collected(e.L), R: collected(e.R), fmt: e.fmt } as Eq, l = sideLin(e.L), r = sideLin(e.R);
  const why = want === 'one' ? `The ${XH}-terms differ (${nH(l.m)} vs ${nH(r.m)}), so they do not cancel: exactly one solution.`
    : `Distribute: ${eqH(ex)}. Take ${sideH([X(l.m)])} off both sides: ${nH(l.k)} = ${nH(r.k)}, ${want === 'all' ? 'always true: every number works' : 'never true: no number works'}.`;
  return choose(R, base('howMany', n, sg, `How many solutions does ${eqH(e)} have?`, eqT(e), [why], picOf(e, 'kind')), [
    { t: KIND_TXT.one, ok: want === 'one', mc: undefined, say: want === 'one' ? 'Yes: the x-terms do not cancel.' : `The ${XH}-terms cancel, so there is no single value: look at what is left.` },
    { t: KIND_TXT.none, ok: want === 'none', mc: undefined, say: want === 'none' ? `Yes: after the ${XH}-terms cancel, a false statement is left.` : want === 'all' ? `What is left is TRUE (${nH(l.k)} = ${nH(r.k)}), so every number works.` : 'The x-terms do not cancel here.' },
    { t: KIND_TXT.all, ok: want === 'all', mc: want === 'none' ? MC.cancelAll : undefined, say: want === 'all' ? 'Yes: both sides are the same expression.' : want === 'none' ? `Cancelling is not enough: what is left, ${nH(l.k)} = ${nH(r.k)}, is false.` : 'The x-terms do not cancel here.' },
    { t: `${XH} = 0`, mc: want !== 'one' ? MC.zeroVsNone : undefined, say: want === 'one' ? `Solve it: ${XH} = ${nH(solOf(e))}.` : `When ${XH} disappears, the answer is not ${XH} = 0: read the statement that is left.` },
  ]);
};
const zeroTrap: Gen = (R, n, sg) => {
  const want = R() < (sg === 'contradiction-after-cancel' ? 0.3 : 0.6) ? 'all' : 'none';
  const e = kindEq(R, want, false), l = sideLin(e.L), r = sideLin(e.R);
  const last = `${nH(l.k)} = ${nH(r.k)}`;
  const b0 = base('zeroTrap', n, sg, `Kai solves ${eqH(e)}. His ${XH}-terms cancel and his last line is ${last}. He writes “${XH} = 0”. What should he write?`, `${eqT(e)}\\ \\Rightarrow\\ ${nT(l.k)} = ${nT(r.k)}`,
    [`${last} is ${want === 'all' ? 'always true' : 'never true'}, whatever ${XH} is.`, want === 'all' ? 'So every number is a solution.' : 'So no number is a solution.'], { lines: [eqT(e), `${nT(l.k)} = ${nT(r.k)}`] });
  return choose(R, b0, want === 'all' ? [
    { t: 'Every number is a solution', ok: true, say: `Right: ${last} is true for every ${XH}.` },
    { t: `${XH} = 0`, mc: MC.zeroVsNone, say: `${XH} = 0 is one solution, but so is every other number. ${last} is always true.` },
    { t: 'No solution', say: `${last} is TRUE, so every number works.` },
  ] : [
    { t: 'No solution', ok: true, say: `Right: ${last} is false for every ${XH}.` },
    { t: `${XH} = 0`, mc: MC.zeroVsNone, say: `Put 0 in for ${XH}: the sides are still ${nH(l.k)} and ${nH(r.k)}. Nothing works.` },
    { t: 'Every number is a solution', mc: MC.cancelAll, say: `The ${XH}-terms cancelled, but what is left is FALSE.` },
    { t: 'He made a mistake: every equation has a solution', mc: MC.noSolErr, say: `No mistake: some equations have no solution. The steps were fine.` },
  ]);
};
const makeKind: Gen = (R, n, sg) => {
  const f = pick(R, [rat(1, 2), rat(1, 3), rat(1, 4), rat(2, 3)]), a = f.q * int(R, 1, 2), b = f.q * int(R, 1, 4);
  const m = qMul(f, rat(a)), k = qMul(f, rat(b)), gH = sideH([G(f, X(a), N(b))]);
  if (R() < 0.5) {
    return typed(base('makeKind', n, sg, `${gH} = ${sideH([X(m)])} + □. Which number in the box makes EVERY number a solution?`, `${sideT([G(f, X(a), N(b))])} = ${sideT([X(m)])} + \\square`,
      [`Distribute: ${gH} = ${sideH(lin(m, k))}.`, `Both sides match when the box is <b class="s">${nH(k)}</b>.`]),
    k, 'frac', '', [[rat(b), MC.partial, `${nH(f)} multiplies the ${b} too: ${nH(f)} × ${b} = ${nH(k)}.`]], `Distribute ${nH(f)} over both terms, then make the sides identical.`, `Yes: both sides become ${sideH(lin(m, k))}.`);
  }
  const c = qAdd(k, rat(int(R, 1, 5)));
  return typed(base('makeKind', n, sg, `${gH} = □${XH} + ${nH(c)}. Which coefficient in the box makes the equation have NO solution?`, `${sideT([G(f, X(a), N(b))])} = \\square\\, x + ${nT(c)}`,
    [`Distribute: ${sideH(lin(m, k))} = □${XH} + ${nH(c)}.`, `With the box = <b class="s">${nH(m)}</b> the ${XH}-terms cancel and ${nH(k)} = ${nH(c)} is false.`]),
  m, 'frac', '', [[rat(a), MC.partial, `${nH(f)} multiplies the ${a}${XH} too: the left has ${nH(m)}${XH}.`]], `Make the ${XH}-terms cancel: what is the ${XH}-coefficient on the left after distributing?`, `Yes: the ${XH}-terms cancel and ${nH(k)} = ${nH(c)} is false.`);
};

// 15 check-in-original
const checkCand: Gen = (R, n, sg) => retry(() => {
  const e = clearEq(R, { whole: true, both: R() < 0.3, positive: R() < 0.5 });
  if (!e || !hasWholeConst(e)) return null;
  const M = leastClear(e), x = solOr(e), W = scaleSome(e, M), wx = solOr(W);
  if (!x || !wx || qEq(x, wx) || wx.q > 12) return null;
  const vl = (v: Q) => valueAt(e.L, v), vr = (v: Q) => valueAt(e.R, v);
  if (R() < 0.6) {
    return choose(R, base('checkCand', n, sg, `Ana multiplied ${eqH(e)} by ${M} and got ${eqH(W)}, so ${XH} = ${nH(wx)}. Is ${nH(wx)} a solution of the original equation?`, eqT(e),
      [`Put ${nH(wx)} into the ORIGINAL: left ${nH(vl(wx))}, right ${nH(vr(wx))}. Not equal.`, `Her line ${eqH(W)} forgot to multiply a whole number by ${M}.`], { lines: [eqT(e), eqT(W), `x = ${nT(wx)}`] }), [
      { t: `No: in the original the left is ${nH(vl(wx))} and the right is ${nH(vr(wx))}`, ok: true, say: 'Right: always check in the ORIGINAL equation, both sides.' },
      { t: `Yes: ${nH(wx)} makes ${eqH(W)} true`, mc: MC.derived, say: `Her line ${eqH(W)} is not equivalent to the original. A check must use the original.` },
      { t: 'Yes: she did the steps again and got the same answer', mc: MC.repeatCheck, say: `Repeating the same steps repeats the same slip. Substitute into the original instead.` },
    ]);
  }
  const C = scaleEq(e, M);
  return choose(R, base('checkCand', n, sg, `Is ${XH} = ${nH(x)} a solution of ${eqH(e)}?`, `${eqT(e)},\\ x = ${nT(x)}`, [`Left: ${nH(vl(x))}. Right: ${nH(vr(x))}. Equal, so yes.`], picOf(e, 'none')), [
    { t: `Yes: both sides of the original equal ${nH(vl(x))}`, ok: true, say: 'Right: both sides, in the original equation.' },
    { t: `Yes: it makes ${eqH(collectedEq(C))} true`, mc: MC.derived, say: `That is a later line. A later line can be wrong; check in the ORIGINAL.` },
    { t: `No: the left side is ${nH(vl(x))}, not ${nH(qAdd(vl(x), rat(1)))}`, mc: MC.oneSide, say: `Compare the left side with the RIGHT SIDE's value: both are ${nH(vl(x))}.` },
  ]);
});
const checkSide: Gen = (R, n, sg) => retry(() => {
  const e = clearEq(R, { positive: R() < 0.7, both: R() < 0.5 });
  if (!e) return null;
  const x = R() < 0.6 ? solOr(e) : rat(int(R, 1, 9));
  if (!x) return null;
  const side = R() < 0.5 ? 'L' : 'R', S = side === 'L' ? e.L : e.R, v = valueAt(S, x), M = leastClear(e);
  const dv = qMul(v, rat(M));
  return typed(base('checkSide', n, sg, `Check ${XH} = ${nH(x)} in ${eqH(e)}. What is the ${side === 'L' ? 'left' : 'right'} side worth?`, `${eqT(e)},\\ x = ${nT(x)}`,
    [`${sideH(S)} with ${XH} = ${nH(x)}: ${subH(S, x)} = <b class="s">${nH(v)}</b>.`], picOf(e, 'none')),
  v, 'frac', '', [[dv, MC.derived, `That is the side after × ${M}. A check uses the ORIGINAL side: divide by ${M}, or substitute again.`]], `Multiply first, then add: ${sideH(S)} with ${XH} = ${nH(x)}.`, `Yes: ${nH(v)}.`);
});

// 16 estimate-reasonableness
const estimate: Gen = (R, n, sg) => {
  const v = int(R, 0, 2);
  if (v === 0 || v === 1) {
    const bm = pick(R, [[0.48, 0.5], [0.52, 0.5], [0.26, 0.25], [0.24, 0.25], [0.19, 0.2], [0.21, 0.2]] as const);
    const k = pick(R, [2.98, 4.02, 1.97, 5.01, 3.03]), kr = Math.round(k), r = kr + int(R, 2, 9) * 2;
    const est = Math.round((r - kr) / bm[1]), e = `${bm[0]}${XH} + ${k} = ${r}`;
    if (v === 0) return choose(R, base('estimate', n, sg, `Without solving exactly: which is the best estimate of ${XH} in ${e}?`, `${bm[0]}x + ${k} = ${r}`, [`${bm[0]} ≈ ${bm[1]}, ${k} ≈ ${kr}: ${bm[1]}${XH} ≈ ${r - kr}, so ${XH} ≈ ${est}.`]), [
      { t: `About ${est}`, ok: true, say: `Yes: ${r} − ${kr} = ${r - kr}, and ${r - kr} ÷ ${bm[1]} = ${est}.` },
      { t: `About ${Math.round((r - kr) * bm[1] * 100) / 100}`, mc: MC.noSizeCheck, say: `Size check: ${bm[1]} × ${Math.round((r - kr) * bm[1] * 100) / 100} is far less than ${r - kr}. Divide by ${bm[1]}, don't multiply.` },
      { t: `About ${Math.round(r / bm[1])}`, say: `Take the ${k} off first: ${bm[1]}${XH} ≈ ${r - kr}.` },
    ]);
    const lee = Math.round((est / 10) * 100) / 100;
    return choose(R, base('estimate', n, sg, `Lee solves ${e} and gets ${XH} = ${lee}. Is that reasonable?`, `${bm[0]}x + ${k} = ${r}`, [`Estimate: ${bm[1]}${XH} ≈ ${r - kr}, so ${XH} ≈ ${est}. ${lee} is ten times too small.`]), [
      { t: `No: ${XH} should be about ${est}`, ok: true, say: 'Right: a quick estimate catches a slipped decimal point.' },
      { t: 'Yes: that is what the calculation gave', mc: MC.noSizeCheck, say: `Check the size: ${bm[0]} × ${lee} + ${k} is nowhere near ${r}.` },
      { t: `Yes: ${bm[0]} is close to ${bm[1]}`, say: `True, but use it: ${bm[1]}${XH} ≈ ${r - kr} means ${XH} ≈ ${est}.` },
    ]);
  }
  const a = pick(R, [0.48, 0.52, 0.31, 0.74]), b = Math.round((a + 0.01) * 100) / 100, k1 = int(R, 1, 4), k2 = k1 + int(R, 1, 3);
  const s = Math.round(((k2 - k1) / (a - b)) * 100) / 100, rb = Math.round(a * 2) / 2;
  return choose(R, base('estimate', n, sg, `${a}${XH} + ${k1} = ${b}${XH} + ${k2}. Rounding ${a} and ${b} both to ${rb} first would make the ${XH}-terms equal. What is right?`, `${a}x + ${k1} = ${b}x + ${k2}`, [`Collect first, exactly: ${a}${XH} − ${b}${XH} = −0.01${XH}, so −0.01${XH} = ${k2 - k1} and ${XH} = ${s}.`, 'Estimate only after collecting: rounding first hides the small difference.']), [
    { t: `Collect exactly first: −0.01${XH} = ${k2 - k1}, so ${XH} = ${s}`, ok: true, say: 'Right: the tiny difference in the x-coefficients decides everything.' },
    { t: `They round to the same number, so there is no solution`, mc: MC.roundEqual, say: `${a} and ${b} are NOT equal: rounding hid a difference of 0.01.` },
    { t: `${XH} is about ${k2 - k1}`, say: `Collect exactly: the ${XH}-coefficient left is −0.01, not 1.` },
  ]);
};

// 17 justify-steps-properties
const PROP = {
  mul: 'Multiplication property of equality',
  dist: 'Distributive property',
  comb: 'Combining like terms',
  sub: 'Subtraction property of equality',
  add: 'Addition property of equality',
  div: 'Division property of equality',
} as const;
const nameProp: Gen = (R, n, sg) => retry(() => {
  const v = int(R, 0, 4);
  const e = clearEq(R, { both: R() < 0.5, whole: true });
  if (!e) return null;
  let from: Eq, to: Eq, right: keyof typeof PROP, others: (keyof typeof PROP)[], extra: Opt | null = null;
  if (v === 0) { const M = leastClear(e); if (M < 2) return null; from = e; to = scaleEq(e, M); right = 'mul'; others = ['dist', 'add']; }
  else if (v === 1) { const f = pick(R, [2, 3, 4]), b = int(R, 1, 6); from = eq([G(rat(f), X(1), N(-b))], [N(int(R, 1, 20))]); to = eq([X(f), N(-f * b)], from.R); right = 'dist'; others = ['mul', 'comb']; }
  else if (v === 2) { const a = int(R, 3, 7), b = int(R, 1, a - 1), k = int(R, 1, 9); from = eq([X(a), N(k), X(-b)], [N(k + (a - b) * int(R, 1, 5))]); to = eq(lin(rat(a - b), rat(k)), from.R); right = 'comb'; others = ['dist', 'sub']; }
  else if (v === 3) { const a = int(R, 3, 7), c = int(R, 1, a - 1), k = int(R, 1, 9), d = k + (a - c) * int(R, 1, 6); from = eq(lin(rat(a), rat(k)), lin(rat(c), rat(d))); to = eq(lin(rat(a - c), rat(k)), [N(d)]); right = 'sub'; others = ['div', 'comb']; extra = { t: 'Move the term to the other side and change its sign', mc: MC.moveSign, say: `That describes what it looks like, not why it is allowed. The reason: ${c}${XH} was SUBTRACTED from both sides.` }; }
  else { const a = int(R, 2, 9), x = int(R, -9, 12) || 4; from = eq([X(a)], [N(a * x)]); to = eq([X(1)], [N(x)]); right = 'div'; others = ['mul', 'sub']; }
  const opts: Opt[] = [{ t: PROP[right], ok: true, say: `Yes: that is the property that makes this step valid.` }, ...others.map(o => ({ t: PROP[o], say: `Not this one. Compare the two lines: ${v === 0 ? 'every term on both sides was multiplied by the same number' : v === 1 ? 'a factor was multiplied into the parentheses' : v === 2 ? 'two x-terms on one side became one' : v === 3 ? 'the same x-term was subtracted from both sides' : 'both sides were divided by the same nonzero number'}.` }))];
  if (extra) opts.push(extra);
  return choose(R, base('nameProp', n, sg, `Which property justifies the step from ${eqH(from)} to ${eqH(to)}?`, `${eqT(from)} \\;\\Rightarrow\\; ${eqT(to)}`, [`${PROP[right]}.`], { lines: [eqT(from), `\\Downarrow`, eqT(to)] }), opts);
});

// 18 locate-first-invalid-step
const firstBad: Gen = (R, n, sg) => retry(() => {
  const c = fracQ(R, [3, 4, 5], 1), b = c.q, k = int(R, 2, 9), x = int(R, 1, 9) + int(R, 0, 1) * 3, rhs = qAdd(qMul(c, rat(x)), rat(k));
  if (!isInt(rhs)) return null;
  const err = int(R, 0, 3);   // 0 none, 1 line 2 (someTerms), 2 line 3 (sign), 3 line 4 (arithmetic)
  const a = c.p, K = err === 1 ? k : b * k, Rr = b * rhs.p;
  const ax = a === 1 ? 'x' : `${a}x`, axH = a === 1 ? XH : `${a}${XH}`;
  const L2 = `${ax} + ${K} = ${Rr}`;
  const m3 = err === 2 ? Rr + K : Rr - K;
  const L3 = `${ax} = ${m3}`;
  const ans4 = err === 3 ? m3 / a + pick(R, [1, 2, -1]) : m3 / a;
  if (!Number.isInteger(ans4 * 100)) return null;
  const L4 = `x = ${Math.round(ans4 * 1000) / 1000}`;
  const lines = [`(1)\\ \\ ${sideT([X(c)])} + ${k} = ${rhs.p}`, `(2)\\ \\ ${L2}`, `(3)\\ \\ ${L3}`, `(4)\\ \\ ${L4}`];
  const words = ['None: every line is right', 'Line 2', 'Line 3', 'Line 4'];
  const fixes = ['', `Line 2 must multiply the ${k} by ${b} too: ${axH} + ${b * k} = ${Rr}.`, `Line 3 must SUBTRACT ${K}: ${axH} = ${Rr - K}.`, `Line 4: ${m3} ÷ ${a} = ${Math.round((m3 / a) * 1000) / 1000}.`];
  const opts: Opt[] = words.map((t, i) => {
    if (i === err) return { t, ok: true, say: err === 0 ? 'Right: each line follows from the one before.' : `Right: ${fixes[i]}` };
    if (i === 0) return { t, mc: MC.familiar, say: `Check each step, not how familiar it looks. ${fixes[err]}` };
    if (err === 0) return { t, say: `That step is fine. Every line follows from the one before.` };
    if (i > err) return { t, mc: MC.firstOdd, say: `The answer first goes wrong earlier, even if it looks fine there. ${fixes[err]}` };
    return { t, say: `Line ${i} is fine. ${fixes[err]}` };
  });
  return choose(R, base('firstBad', n, sg, `Which line is the FIRST one that does not follow from the line before?`, lines.join('\\\\'), [err === 0 ? 'Every step keeps the solutions: none is wrong.' : fixes[err]!], { lines }), opts);
});

// 19 check-versus-justification
const oneValue: Gen = (R, n, sg) => {
  const f = pick(R, [rat(1, 2), rat(1, 4), rat(3, 2)]), b = 2 * int(R, 1, 4), fH = nH(f, 'dec'), fb = qMul(f, rat(b));
  if (R() < 0.55) {
    // the wrong rewrite f(x + b) = fx + (fb)x agrees only at x = 1
    const fbX = fb.p === fb.q ? '' : nH(fb, 'dec'), fbT = fb.p === fb.q ? '' : nT(fb, 'dec');
    const wrong = `${fH}${XH} + ${fbX}${XH}`, at = qAdd(f, fb);
    return choose(R, base('oneValue', n, sg, `Pat says ${fH}(${XH} + ${b}) = ${wrong}, because both are ${nH(at, 'dec')} when ${XH} = 1. Is that enough to show they are equal?`, `${nT(f, 'dec')}(x + ${b}) \\overset{?}{=} ${nT(f, 'dec')}x + ${fbT}x`,
      [`Try ${XH} = 0: left ${nH(fb, 'dec')}, right 0. One counterexample shows they are NOT equal for every ${XH}.`, `The distributive property gives ${fH}${XH} + ${nH(fb, 'dec')}.`]), [
      { t: `No: at ${XH} = 0 the left is ${nH(fb, 'dec')} and the right is 0`, ok: true, say: 'Right: one counterexample is enough to disprove it.' },
      { t: `Yes: they agree at ${XH} = 1`, mc: MC.examples, say: `Agreeing at one value proves nothing about the others. At ${XH} = 0 they differ.` },
      { t: 'Yes, after checking two more values', mc: MC.examples, say: `A few checks never prove “for every ${XH}”. And ${XH} = 0 already breaks it.` },
    ]);
  }
  const good = `${fH}${XH} + ${nH(fb, 'dec')}`;
  return choose(R, base('oneValue', n, sg, `Pat checked ${fH}(${XH} + ${b}) = ${good} at ${XH} = 1 and ${XH} = 2. Both worked. Is that a proof that they are equal for every ${XH}?`, `${nT(f, 'dec')}(x + ${b}) \\overset{?}{=} ${nT(f, 'dec')}x + ${nT(fb, 'dec')}`,
    [`Checks show it works for those values only. The distributive property proves it for EVERY ${XH}: ${fH}(${XH} + ${b}) = ${fH}${XH} + ${fH} × ${b}.`]), [
    { t: 'No, but the distributive property proves it for every x', ok: true, say: 'Right: a property justifies the rewrite; checks only support it.' },
    { t: 'Yes: two values are enough', mc: MC.examples, say: `Two checks cannot cover every number. The distributive property can.` },
    { t: 'No: it is false', say: `It is true: ${fH} × ${b} = ${nH(fb, 'dec')}. Only the reason was weak.` },
  ]);
};

// 20 interpret-solution-in-context
interface Plans { A0: number; Ar: number; B0: number; Br: number; unit: string; what: string; per: string; thing: string }
function plans(R: () => number): Plans | null {
  const t = pick(R, [
    { unit: 'game', what: 'bowling plans', per: 'a game', thing: 'Plan' },
    { unit: 'ride', what: 'bike-share plans', per: 'a ride', thing: 'Plan' },
    { unit: 'mile', what: 'taxi companies', per: 'a mile', thing: 'Company' },
    { unit: 'visit', what: 'gym memberships', per: 'a visit', thing: 'Gym' },
  ]);
  const Ar = pick(R, [0.75, 1.25, 0.5, 1.5, 2.25]), Br = pick(R, [0.25, 0.5, 0.75, 0.25]), x = int(R, 2, 20);
  if (Ar <= Br) return null;
  const A0 = int(R, 1, 12), B0 = Math.round((A0 + (Ar - Br) * x) * 100) / 100;
  if (B0 > 60 || !Number.isInteger(B0 * 4)) return null;
  return { A0, Ar, B0, Br, ...t };
}
const pE = (P: Plans): Eq => eq([N(P.A0), X(decQ(P.Ar))], [N(decQ(P.B0)), X(decQ(P.Br))], 'dec');
const planMeaning: Gen = (R, n, sg) => retry(() => {
  const P = plans(R);
  if (!P) return null;
  const e = pE(P), x = solOf(e), cost = P.A0 + P.Ar * (x.p / x.q);
  if (!isInt(x)) return null;
  const story = `Two ${P.what}: A costs ${usd(P.A0)} plus ${usd(P.Ar)} ${P.per}, B costs ${usd(P.B0)} plus ${usd(P.Br)} ${P.per}. With ${XH} ${P.unit}s, A = ${eqH(e).split(' = ')[0]} and B = ${eqH(e).split(' = ')[1]}.`;
  if (sg === 'model-comparison-both-sides' || R() < 0.45) {
    const mid = qSub(rat(Math.round((P.B0 - P.A0) * 100), 100), ZERO);
    return solveItem('planMeaning', n, sg, e, { prompt: `${story} For how many ${P.unit}s do they cost the same?`, unit: `${P.unit}s`, extra: [[mid, MC.intermediate, `${usd(P.B0 - P.A0)} is the difference in start fees. Divide by the difference in rates, ${usd(P.Ar - P.Br)}.`]], lines: [eqT(e)] });
  }
  return choose(R, base('planMeaning', n, sg, `${story} Solving A = B gives ${XH} = ${nH(x)}. What does that mean?`, eqT(e), [`At ${nH(x)} ${P.unit}s both cost ${usd(cost)}. After that, A (the bigger rate) costs more.`], { lines: [eqT(e), `x = ${nT(x)}`] }), [
    { t: `At ${nH(x)} ${P.unit}s both cost ${usd(cost)}`, ok: true, say: 'Right: the solution is the number of uses where the costs match, with its unit.' },
    { t: `A costs ${usd(x.p)}`, mc: MC.bare, say: `${nH(x)} counts ${P.unit}s, not dollars. Say what the number means, with its unit.` },
    { t: `After ${nH(x)} ${P.unit}s, A is the cheaper one`, mc: MC.boundRev, say: `A has the bigger rate (${usd(P.Ar)}), so after ${nH(x)} ${P.unit}s A costs MORE.` },
  ]);
});
const feasible: Gen = (R, n, sg) => {
  if (R() < 0.5) {
    const s1 = int(R, 20, 60), r1 = pick(R, [2.5, 3.5, 1.5]), r2 = r1 + pick(R, [0.5, 1, 1.5]), w = int(R, 2, 8), s2 = s1 + (r2 - r1) * w;
    const e = eq([N(s2), X(decQ(r2))], [N(s1), X(decQ(r1))], 'dec');
    return choose(R, base('feasible', n, sg, `Mia has ${usd(s2)} and saves ${usd(r2)} a week. Leo has ${usd(s1)} and saves ${usd(r1)} a week. Solving ${eqH(e)} (${XH} = weeks from now) gives ${XH} = −${w}. What does it mean?`, eqT(e), [`Mia has more AND saves more, so Leo never catches up. −${w} would be ${w} weeks AGO, outside the story (weeks from now).`], { lines: [eqT(e), `x = -${w}`] }), [
      { t: 'From now on they never have the same amount', ok: true, say: `Right: weeks from now cannot be negative. The equal point was in the past.` },
      { t: `They have the same amount after ${w} weeks`, mc: MC.domain, say: `The solution is −${w}, not ${w}: that is in the past. Check that the value fits the story.` },
      { t: `They will be equal in −${w} weeks`, mc: MC.domain, say: `“In −${w} weeks” is not a time in the future. The model's equal point is ${w} weeks ago.` },
    ]);
  }
  const fA = int(R, 10, 30), rA = pick(R, [6, 8]), fB = fA + int(R, 1, 5) * 2 + 1, rB = rA - 2;
  const x = (fB - fA) / (rA - rB);
  const e = eq([N(fA), X(rA)], [N(fB), X(rB)]);
  return choose(R, base('feasible', n, sg, `Club A: ${usd(fA)} plus ${usd(rA)} a ticket. Club B: ${usd(fB)} plus ${usd(rB)} a ticket. Solving ${eqH(e)} gives ${XH} = ${x}. What does it mean for buying tickets?`, eqT(e), [`Tickets come in whole numbers. At ${Math.floor(x)} tickets A is cheaper, at ${Math.ceil(x)} B is cheaper: they are never exactly equal.`], { lines: [eqT(e), `x = ${x}`] }), [
    { t: 'No whole number of tickets makes them cost the same', ok: true, say: `Right: ${x} tickets is not possible; the costs switch between ${Math.floor(x)} and ${Math.ceil(x)}.` },
    { t: `They cost the same at ${x} tickets`, mc: MC.domain, say: `You cannot buy ${x} tickets. The input must be a whole number here.` },
    { t: `Round: they cost the same at ${Math.round(x)} tickets`, say: `Try it: at ${Math.round(x)} tickets the costs differ. Rounding does not make them equal.` },
  ]);
};

// 21 model-comparison-both-sides
const writeModel: Gen = (R, n, sg) => retry(() => {
  const P = plans(R);
  if (!P) return null;
  const v = int(R, 0, 2);
  const A = `${P.A0} + ${P.Ar}${XH}`, B = `${P.B0} + ${P.Br}${XH}`, Aw = `${P.A0}${XH} + ${P.Ar}`, Bw = `${P.B0}${XH} + ${P.Br}`;
  const [phrase, sym, rev] = v === 0 ? ['cost the same', '=', '≠'] : v === 1 ? [`A is cheaper than B`, '<', '>'] : [`A costs at most as much as B`, '≤', '≥'];
  const stem = `Two ${P.what}: A costs ${usd(P.A0)} plus ${usd(P.Ar)} ${P.per}; B costs ${usd(P.B0)} plus ${usd(P.Br)} ${P.per}. Let ${XH} be the number of ${P.unit}s. Which models “${phrase}”?`;
  const opts: Opt[] = [
    { t: `${A} ${sym} ${B}`, ok: true, say: `Yes: each side is a total cost in dollars, and “${phrase}” is ${sym}.` },
    { t: `${Aw} ${sym} ${Bw}`, mc: MC.wordOrder, say: `${XH} counts ${P.unit}s, so it goes with the per-${P.unit} rate, not with the start fee.` },
  ];
  if (v === 0) opts.push({ t: `${P.A0} + ${P.B0} = ${P.Ar}${XH} + ${P.Br}${XH}`, mc: MC.storyWrong, say: `Each side must be ONE plan's total: start fee plus rate × ${XH}.` });
  else opts.push({ t: `${A} ${rev} ${B}`, mc: MC.boundRev, say: `“${phrase}”: A's total goes on the ${sym === '<' ? 'smaller' : 'smaller-or-equal'} side, so ${sym}.` });
  return choose(R, base('writeModel', n, sg, stem, `\\text{A: } ${P.A0} + ${P.Ar}x \\qquad \\text{B: } ${P.B0} + ${P.Br}x`, [`A's total: ${A} dollars. B's total: ${B} dollars.`, `“${phrase}”: ${A} ${sym} ${B}.`]), opts);
});

// 22 write-context-for-relation
const storyFor: Gen = (R, n, sg) => retry(() => {
  if (R() < 0.6) {
    const a = int(R, 6, 15), r1 = pick(R, [0.25, 0.5, 1.5]), b = int(R, 1, a - 2), r2 = r1 + pick(R, [0.5, 0.25, 1]);
    const rel = `${a} + ${r1}${XH} = ${b} + ${r2}${XH}`;
    return choose(R, base('storyFor', n, sg, `Which story fits ${rel}?`, `${a} + ${r1}x = ${b} + ${r2}x`, [`Each side: a start amount plus a rate times ${XH}. ${XH} = the number of miles; = means “cost the same”.`]), [
      { t: `Ride A: ${usd(a)} plus ${usd(r1)} a mile; ride B: ${usd(b)} plus ${usd(r2)} a mile. After how many miles do they cost the same?`, ok: true, say: 'Yes: start fees are the constants, per-mile prices go with x.' },
      { t: `Ride A: ${usd(r1)} plus ${usd(a)} a mile; ride B: ${usd(r2)} plus ${usd(b)} a mile. After how many miles do they cost the same?`, mc: MC.storyWrong, say: `Same numbers, wrong roles: in ${rel} the ${a} is NOT multiplied by ${XH}, so it is a start fee.` },
      { t: `Ride A: ${usd(a)} plus ${usd(r1)} a mile; ride B: ${usd(b)} plus ${usd(r2)} a mile. How much does a ride cost?`, mc: MC.storyWrong, say: `${XH} must be the unknown the question asks for: the number of miles where the costs match.` },
    ]);
  }
  const s1 = int(R, 30, 50), r1 = 2, s2 = int(R, 10, 20), r2 = 0.5;
  const rel = `${s1} − ${r1}${XH} ≥ ${s2} + ${r2}${XH}`;
  return choose(R, base('storyFor', n, sg, `Which story fits ${rel}? (${XH} = days)`, `${s1} - ${r1}x \\ge ${s2} + ${r2}x`, [`${s1} − ${r1}${XH}: starts at ${s1} and DROPS ${r1} a day. ≥ means “at least as much as”.`]), [
      { t: `Tank A holds ${s1} gal and loses ${r1} gal a day; tank B holds ${s2} gal and gains ${r2} gal a day. For how many days does A hold at least as much as B?`, ok: true, say: 'Yes: minus = losing, ≥ = at least as much.' },
      { t: `Tank A holds ${s1} gal and gains ${r1} gal a day; tank B holds ${s2} gal and gains ${r2} gal a day. For how many days does A hold at least as much as B?`, mc: MC.slopeSign, say: `− ${r1}${XH} means A LOSES ${r1} gal a day.` },
      { t: `Tank A holds ${s1} gal and loses ${r1} gal a day; tank B holds ${s2} gal and gains ${r2} gal a day. For how many days does A hold less than B?`, mc: MC.boundRev, say: `≥ says A holds AT LEAST as much as B, not less.` },
    ]);
});

export const GENERATORS: Record<FamilyId, Gen> = {
  evalTerm, coefMeaning, formMatch, mixedCoef, barSplit, barClear, sameSet, scaleKeep, scaleBy, lcdPick, validMult,
  clearLine, clearSolve, collectLine, collectSolve, distFirst, distSolve, barSolve, bothLine, bothSolve, planFirst,
  planSolve, exactForm, howMany, zeroTrap, makeKind, checkCand, checkSide, estimate, nameProp, firstBad, oneValue,
  planMeaning, feasible, writeModel, storyFor,
};
export { eqT, eqH, sideT, sideH, nT, nH, collected, scaleEq, leastClear, sideLin, solOf, kindOf, q };
