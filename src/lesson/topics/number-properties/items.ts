// items.ts: practice families for "Properties and the real numbers" (secondary-t6-01 + the real number system and
// closure). Every family is generated from the sub-goal's cases, checked exactly, and every wrong answer the
// classifier recognises carries its catalogue id (math-curriculum-essentials/misconceptions.json).
// Pictures (item.picture, solution-side data under `reveal`): map (SetMap), claim (ClaimTable), area (AreaSplit),
// chain (a rewrite chain on a wide slate). Pure: no DOM.
import { type Item, type Response, type Verdict, fr, int, pick, shuffle } from '../../runtime/item';
import { endOnChoice, ans } from '../../runtime/explain';
import { type Q, type Real, type SetId, H, PI, QH, QT, R as Rn, RQ, SETS_OF, SET_LONG, T, add, fmt, html as rHtml, innermost, mul, neg, q, qAdd, qMul, qVal, rootHtml, sqrt, tex as rTex } from './numbers';

// ---------- misconception ids ----------
export const MC = {
  subDivComm: 'mc.properties.subtraction-division-commutative',
  assocComm: 'mc.properties.associative-commutative-confused',
  zeroIdentity: 'mc.properties.zero-property-called-identity',
  zeroEvery: 'mc.properties.zero-identity-for-every-operation',
  minusNeg: 'mc.integers.minus-sign-means-negative',
  oppRecip: 'mc.properties.opposite-reciprocal-confused',
  zeroRecip: 'mc.properties.zero-has-reciprocal',
  partialDist: 'mc.properties.partial-distribution',
  detached: 'mc.integers.minus-sign-detached-from-term',
  cancelProd: 'mc.rational-radical.cancels-additive-inverses-inside-products',
  repeatCancel: 'mc.properties.repeated-numbers-cancel-regardless-of-operation',
  nameFromResult: 'mc.properties.property-name-from-result-alone',
  exception: 'mc.reasoning-language.counterexample-as-exception',
  examplesProof: 'mc.reasoning-language.examples-as-proof',
  nonSeparating: 'mc.expressions.chooses-non-separating-test-value',
  rootSum: 'mc.exponents-roots.distributes-root-over-sum',
  fnSum: 'mc.functions-concept.function-distributes-over-sum',
  zeroNotWhole: 'mc.exponents-roots.zero-excluded-from-whole-numbers',
  wholeNeg: 'mc.exponents-roots.whole-numbers-include-negatives',
  notNested: 'mc.exponents-roots.number-sets-not-nested',
  calcDisplay: 'mc.decimals.full-calculator-display-implies-irrationality',
  rounded: 'mc.estimation.rounded-value-treated-as-exact',
  repeatIrr: 'mc.exponents-roots.repeating-decimal-called-irrational',
  prefix: 'mc.exponents-roots.pattern-or-prefix-taken-as-repeating',
  notReal: 'mc.exponents-roots.excludes-irrationals-from-reals',
  misplaced: 'mc.exponents-roots.irrationals-misplaced-in-set-diagram',
  resultExists: 'mc.properties.closure-means-result-exists',
  fracNotInt: 'mc.fractions-concept.fractions-equal-to-whole-numbers',
  minusRadical: 'mc.exponents-roots.outside-minus-disqualifies-radical',
  radicalIrr: 'mc.exponents-roots.radical-sign-means-irrational',
  plusMinus: 'mc.exponents-roots.principal-root-as-plus-minus',
  premise: 'mc.reasoning-language.counterexample-violates-premise',
  divZero: 'mc.mul-div.division-by-zero-produces-number',
  fracDisplay: 'mc.fractions-concept.rational-membership-by-fraction-display',
  ratPlusIrr: 'mc.exponents-roots.rational-plus-irrational-can-be-rational',
  nonzeroDiv: 'mc.linear-equations.omits-nonzero-divisor-condition',
  assumption: 'mc.reasoning-language.indirect-assumption-as-claim',
} as const;

// ---------- pictures ----------
export type Region = SetId | 'real';
export interface MapTok { tex: string; at: SetId }
export interface MapPic { tokens: MapTok[]; ring?: Region; reveal?: { tokens?: MapTok[]; arrows?: [number, number][]; ring?: Region; bad?: boolean } }
export interface ClaimRowPic { vals: string[]; left?: string; right?: string; ok?: boolean }
export interface ClaimPic { left: string; right: string; vars: string[]; scope?: string; rows: ClaimRowPic[]; reveal?: { rows?: Required<ClaimRowPic>[]; strike?: boolean } }
export interface AreaVals { a: string; b: string; c: string; ab: string; ac: string }
export interface AreaPic { op: '+' | '-'; wb: number; wc: number; given: Partial<AreaVals>; reveal: AreaVals }
export interface ChainPic { lines: string[]; ask?: number }
export interface NPItem extends Item { picture?: { map?: MapPic; claim?: ClaimPic; area?: AreaPic; chain?: ChainPic } }
type Gen = (R: () => number, n: number, sg?: string) => NPItem;

// ---------- small helpers ----------
const V = (s: string) => `<i>${s}</i>`;
const near = (a: number, b: number) => Math.abs(a - b) < 1e-9;
interface Opt { t: string; ok?: boolean; mc?: string; say: string }
type Base = Omit<NPItem, 'input' | 'choices' | 'answer' | 'check'>;
function choiceItem(R: () => number, base: Base, opts: Opt[]): NPItem {
  const o = shuffle(R, opts.slice());
  const i = o.findIndex(x => x.ok);
  if (i < 0 || o.filter(x => x.ok).length !== 1) throw new Error(`${base.family}: exactly one right choice`);
  if (new Set(o.map(x => x.t)).size !== o.length) throw new Error(`${base.family}: duplicate choices ${o.map(x => x.t).join(' | ')}`);
  return {
    ...base, input: 'choice', choices: o.map(x => x.t), answer: { kind: 'choice', i }, solution: endOnChoice(base.solution, o[i]!.t),
    check: (r: Response) => {
      if (r.kind !== 'choice' || !o[r.i]) return { ok: false, say: 'Pick one of the answers.' };
      const c = o[r.i]!;
      return { ok: !!c.ok, mc: c.mc, say: c.say };
    },
  };
}
const numItem = (base: Omit<NPItem, 'input' | 'answer' | 'check'>, a: number, check: (v: number) => Verdict): NPItem => ({
  ...base, input: 'num', answer: { kind: 'num', v: a },
  check: (r: Response) => (r.kind === 'num' && Number.isFinite(r.v) ? check(r.v) : { ok: false, say: 'Type a number.' }),
});
/** distinct options: keeps the first of equal texts (a generator re-rolls when too few remain) */
const uniq = (o: Opt[]) => o.filter((x, i) => o.findIndex(y => y.t === x.t) === i);
/** a value as TeX: whole, a short decimal, or a fraction */
export function numTex(v: number): string {
  if (Number.isInteger(Math.round(v * 1e6) / 1e6) && near(v, Math.round(v))) return T(Math.round(v));
  for (let d = 2; d <= 12; d++) { const p = Math.round(v * d); if (near(p / d, v)) return QT(q(p, d)); }
  const short = Math.round(v * 1e4) / 1e4;
  if (near(v, short)) return T(short);
  for (let d = 13; d <= 400; d++) { const p = Math.round(v * d); if (near(p / d, v)) return QT(q(p, d)); }
  return T(Math.round(v * 1e4) / 1e4);
}
export function numHtml(v: number): string {
  if (near(v, Math.round(v))) return H(Math.round(v));
  for (let d = 2; d <= 12; d++) { const p = Math.round(v * d); if (near(p / d, v)) return QH(q(p, d)); }
  const short = Math.round(v * 1e4) / 1e4;
  if (near(v, short)) return H(short);
  for (let d = 13; d <= 400; d++) { const p = Math.round(v * d); if (near(p / d, v)) return QH(q(p, d)); }
  return H(short);
}
/** a nonzero signed fraction with a small denominator, not a whole number */
function sfrac(R: () => number, neg = 0.5): Q {
  for (;;) { const d = int(R, 2, 9), p = int(R, 1, 9); const f = q(p * (R() < neg ? -1 : 1), d); if (f[1] !== 1) return f; }
}
const paren = (t: string) => (t.startsWith('-') ? `(${t})` : t);
const parenH = (t: string) => (t.startsWith('−') ? `(${t})` : t);

// ===================== stage 1: the properties =====================
// ---------- commName: which property does the equation show? (commutative, associative) ----------
type Op = '+' | 'x';
const OPN: Record<Op, string> = { '+': 'addition', x: 'multiplication' };
function operand(R: () => number): { t: string; h: string } {
  const k = pick(R, ['int', 'neg', 'frac', 'var', 'var'] as const);
  if (k === 'int') { const v = int(R, 2, 15); return { t: String(v), h: String(v) }; }
  if (k === 'neg') { const v = -int(R, 1, 12); return { t: T(v), h: H(v) }; }
  if (k === 'frac') { const f = sfrac(R, 0.4); return { t: QT(f, '\\tfrac'), h: QH(f) }; }
  const v = pick(R, ['a', 'b', 'c', 'x', 'y', 'n']); return { t: v, h: V(v) };
}
const commName: Gen = (R, n, sg) => {
  for (;;) {
    const a = operand(R), b = operand(R), c = operand(R);
    if (a.t === b.t || b.t === c.t || a.t === c.t) continue;
    const op = pick(R, ['+', 'x'] as const), os = op === '+' ? ' + ' : ' \\cdot ', oh = op === '+' ? ' + ' : ' · ';
    const P = (x: { t: string }) => (op === 'x' ? paren(x.t) : paren(x.t)), PH = (x: { h: string }) => parenH(x.h);
    const kinds = sg === 'associative' ? ['assoc', 'assoc', 'innerSwap', 'outerSwap'] as const : ['comm', 'comm', 'innerSwap', 'assoc'] as const;
    const kind = pick(R, kinds);
    let texs = '', htm = '', right: 'comm' | 'assoc';
    if (kind === 'comm') { texs = `${P(a)}${os}${P(b)} = ${P(b)}${os}${P(a)}`; htm = `${PH(a)}${oh}${PH(b)} = ${PH(b)}${oh}${PH(a)}`; right = 'comm'; }
    else if (kind === 'assoc') { texs = `(${P(a)}${os}${P(b)})${os}${P(c)} = ${P(a)}${os}(${P(b)}${os}${P(c)})`; htm = `(${PH(a)}${oh}${PH(b)})${oh}${PH(c)} = ${PH(a)}${oh}(${PH(b)}${oh}${PH(c)})`; right = 'assoc'; }
    else if (kind === 'innerSwap') { texs = `${P(a)}${os}(${P(b)}${os}${P(c)}) = ${P(a)}${os}(${P(c)}${os}${P(b)})`; htm = `${PH(a)}${oh}(${PH(b)}${oh}${PH(c)}) = ${PH(a)}${oh}(${PH(c)}${oh}${PH(b)})`; right = 'comm'; }
    else { texs = `(${P(a)}${os}${P(b)})${os}${P(c)} = (${P(b)}${os}${P(a)})${os}${P(c)}`; htm = `(${PH(a)}${oh}${PH(b)})${oh}${PH(c)} = (${PH(b)}${oh}${PH(a)})${oh}${PH(c)}`; right = 'comm'; }
    const on = OPN[op];
    const why = right === 'comm' ? `The order of the two ${op === '+' ? 'addends' : 'factors'} changes; the grouping stays the same.` : 'Only the parentheses move: the numbers stay in the same order.';
    const opts: Opt[] = [
      { t: `Commutative property of ${on}`, ok: right === 'comm', mc: right === 'assoc' ? MC.assocComm : undefined, say: right === 'comm' ? `Yes. ${why}` : `Look again: nothing changes places, only the parentheses move. That is associative (grouping), not commutative (order).` },
      { t: `Associative property of ${on}`, ok: right === 'assoc', mc: right === 'comm' ? MC.assocComm : undefined, say: right === 'assoc' ? `Yes. ${why}` : `The parentheses stay put; two numbers swap places. Swapping order is commutative; associative is regrouping.` },
      { t: 'Distributive property', say: 'Distributive needs a product spread over a sum, like a(b + c) = ab + ac. Here only one operation appears.' },
      { t: `Identity property of ${on}`, say: `Identity is ${op === '+' ? 'a + 0 = a' : 'a · 1 = a'}. No ${op === '+' ? '0' : '1'} is added here; the terms are rearranged.` },
    ];
    return choiceItem(R, {
      id: `commName-${n}`, family: 'commName', prompt: `Which property does this equation show?<br><b>${htm}</b>`, board: texs,
      solution: [why, right === 'comm' ? `Changing the order is the <b>commutative</b> property of ${on}.` : `Regrouping is the <b>associative</b> property of ${on}.`],
    }, opts);
  }
};

// ---------- commSwap: reverse a subtraction or a division ----------
const commSwap: Gen = (R, n) => {
  const div = R() < 0.4;
  if (!div) {
    let a = int(R, 2, 20), b = int(R, 2, 20); if (a === b) b = a + int(R, 1, 6);
    const v = a - b;
    return numItem({
      id: `commSwap-${n}`, family: 'commSwap',
      prompt: `${a} − ${b} = ${H(v)}. Is subtraction commutative? Find <b>${b} − ${a}</b>.`, board: `${a} - ${b} = ${T(v)} \\qquad ${b} - ${a} = \\,?`,
      picture: { claim: { left: 'a - b', right: 'b - a', vars: ['a', 'b'], rows: [{ vals: [String(a), String(b)] }], reveal: { rows: [{ vals: [String(a), String(b)], left: T(v), right: T(-v), ok: false }], strike: true } } },
      solution: [`${b} − ${a}: start at ${b} and take away ${a}.`, `${b} − ${a} = ${ans(H(-v))}, the opposite of ${H(v)}. Swapping the order changed the answer: subtraction is not commutative.`],
    }, -v, w => near(w, -v) ? { ok: true, say: `Yes: ${b} − ${a} = ${H(-v)}. Swap the order and the answer changes sign, so subtraction is not commutative.` }
      : near(w, v) ? { ok: false, mc: MC.subDivComm, say: `${H(v)} is ${a} − ${b}. Swapping the numbers in a subtraction changes the answer: ${b} − ${a} = ${H(-v)}.` }
        : { ok: false, say: `Start at ${b} and take away ${a}: ${b} − ${a} = ${H(-v)}.` });
  }
  const k = pick(R, [2, 4, 5, 8, 10]), b = int(R, 2, 9), a = b * k, v = 1 / k;
  return numItem({
    id: `commSwap-${n}`, family: 'commSwap',
    prompt: `${a} ÷ ${b} = ${k}. Is division commutative? Find <b>${b} ÷ ${a}</b> as a decimal.`, board: `${a} \\div ${b} = ${k} \\qquad ${b} \\div ${a} = \\,?`,
    picture: { claim: { left: 'a \\div b', right: 'b \\div a', vars: ['a', 'b'], rows: [{ vals: [String(a), String(b)] }], reveal: { rows: [{ vals: [String(a), String(b)], left: String(k), right: fmt(v), ok: false }], strike: true } } },
    solution: [`${b} ÷ ${a} = ${fr(b, a)} = ${fr(1, k)}.`, `${fr(1, k)} = ${ans(fmt(v))}, not ${k}: division is not commutative.`],
  }, v, w => near(w, v) ? { ok: true, say: `Yes: ${b} ÷ ${a} = ${fr(1, k)} = ${fmt(v)}. Swapping the numbers gave a different answer.` }
    : near(w, k) ? { ok: false, mc: MC.subDivComm, say: `${k} is ${a} ÷ ${b}. With the numbers swapped you share ${b} into ${a} parts: ${fr(b, a)} = ${fmt(v)}.` }
      : { ok: false, say: `${b} ÷ ${a} = ${fr(b, a)} = ${fmt(v)}.` });
};

// ---------- assocPair: regroup a subtraction or a division (non-examples) ----------
const assocPair: Gen = (R, n) => {
  const div = R() < 0.45;
  let a: number, b: number, c: number, L: number, Rr: number, os: string, oh: string;
  if (div) { c = int(R, 2, 4); const m = int(R, 2, 4); b = c * m; a = b * c * int(R, 1, 3); L = a / b / c; Rr = a / (b / c); os = '\\div'; oh = '÷'; }
  else { a = int(R, 6, 20); b = int(R, 2, a - 2); c = int(R, 1, 9); if (c === b) c = b + 1; L = a - b - c; Rr = a - (b - c); os = '-'; oh = '−'; }
  return {
    id: `assocPair-${n}`, family: 'assocPair', input: 'pair',
    prompt: `Regroup without reordering: work out both sides. Is ${div ? 'division' : 'subtraction'} associative?`,
    board: `(${a} ${os} ${b}) ${os} ${c} \\quad\\text{and}\\quad ${a} ${os} (${b} ${os} ${T(c)})`,
    pairLead: `(${a} ${oh} ${b}) ${oh} ${c} =`, pairOp: `&nbsp; and &nbsp;${a} ${oh} (${b} ${oh} ${c}) =`,
    picture: { claim: { left: `(a ${os} b) ${os} c`, right: `a ${os} (b ${os} c)`, vars: ['a', 'b', 'c'], rows: [{ vals: [String(a), String(b), String(c)] }], reveal: { rows: [{ vals: [String(a), String(b), String(c)], left: numTex(L), right: numTex(Rr), ok: false }], strike: true } } },
    solution: [`Left: (${a} ${oh} ${b}) ${oh} ${c} = ${H(div ? a / b : a - b)} ${oh} ${c} = ${ans(H(L))}.`, `Right: ${a} ${oh} (${b} ${oh} ${c}) = ${a} ${oh} ${parenH(H(div ? b / c : b - c))} = ${ans(H(Rr))}.`, `Different answers: ${div ? 'division' : 'subtraction'} is not associative.`],
    answer: { kind: 'pair', x: L, y: Rr },
    check: r => {
      if (r.kind !== 'pair') return { ok: false, say: 'Fill in both boxes.' };
      if (near(r.x, L) && near(r.y, Rr)) return { ok: true, say: `Yes: ${fmt(L)} and ${fmt(Rr)}. Moving the parentheses changed the answer, so ${div ? 'division' : 'subtraction'} is not associative.` };
      if (near(r.x, Rr) && near(r.y, L)) return { ok: false, say: 'Those two are swapped. Work inside the parentheses first on each side.' };
      if (near(r.x, r.y)) return { ok: false, say: `Work each side on its own, parentheses first: the two sides do not match. Left ${fmt(L)}, right ${fmt(Rr)}.` };
      return { ok: false, say: `Parentheses first. Left: ${fmt(L)}. Right: ${fmt(Rr)}.` };
    },
  };
};

// ---------- identityPick: which equation shows the identity property? ----------
const identityPick: Gen = (R, n) => {
  const v = pick(R, ['int', 'neg', 'frac'] as const);
  const x: Q = v === 'int' ? q(int(R, 2, 30)) : v === 'neg' ? q(-int(R, 1, 30)) : sfrac(R);
  const t = paren(QT(x, '\\tfrac')), h = parenH(QH(x));
  const mulT = R() < 0.55, on = mulT ? 'multiplication' : 'addition';
  const opts: Opt[] = [
    { t: `${h} · 1 = ${h}`, ok: mulT, say: mulT ? 'Yes: multiplying by 1 leaves every number unchanged. 1 is the multiplicative identity.' : 'That is the identity of multiplication (× 1). The question asks about addition.' },
    { t: `${h} + 0 = ${h}`, ok: !mulT, say: !mulT ? 'Yes: adding 0 leaves every number unchanged. 0 is the additive identity.' : 'That is the identity of addition (+ 0). The question asks about multiplication.' },
    { t: `${h} · 0 = 0`, mc: MC.zeroIdentity, say: 'Multiplying by 0 gives 0, not the number you started with. That is the zero property of multiplication, not an identity.' },
    { t: `${h} + (${QH(qMul(x, q(-1)))}) = 0`, say: 'That adds the opposite and lands on 0: the inverse property, not the identity property.' },
  ];
  return choiceItem(R, {
    id: `identityPick-${n}`, family: 'identityPick',
    prompt: `Which equation shows the <b>identity property of ${on}</b>?`, board: `\\text{identity of } ${mulT ? '\\times' : '+'} \\text{ with } ${t}`,
    solution: [`An identity leaves the number unchanged: ${mulT ? 'times 1' : 'plus 0'}.`],
  }, opts);
};

// ---------- identityFill: a ∘ □ = a ----------
const identityFill: Gen = (R, n) => {
  const op = pick(R, ['x', '+', '-', '÷', 'x', '+'] as const);
  const x: Q = pick(R, [q(int(R, 2, 40)), q(-int(R, 1, 40)), sfrac(R)]);
  const t = QT(x), h = QH(x);
  const ansV = op === 'x' || op === '÷' ? 1 : 0;
  const os = { x: '\\times', '+': '+', '-': '-', '÷': '\\div' }[op], oh = { x: '×', '+': '+', '-': '−', '÷': '÷' }[op];
  return numItem({
    id: `identityFill-${n}`, family: 'identityFill',
    prompt: `What number goes in the box, so that the equation is true for <b>${h}</b> and for every other number?`, board: `${t} ${os} \\square = ${t}`,
    solution: [`The box must leave every number unchanged under ${oh}.`, `${op === 'x' || op === '÷' ? `${oh} 1 changes nothing` : `${oh} 0 changes nothing`}: the box is ${ans(ansV)}.`],
  }, ansV, w => near(w, ansV) ? { ok: true, say: `Yes: ${h} ${oh} ${ansV} = ${h}, and that works for every number.` }
    : near(w, 0) && ansV === 1 ? { ok: false, mc: MC.zeroEvery, say: `${oh} 0 does not leave the number alone${op === 'x' ? `: ${h} × 0 = 0` : ': you cannot divide by 0'}. For ${oh} the number that changes nothing is 1.` }
      : near(w, 1) && ansV === 0 ? { ok: false, say: `${h} ${oh} 1 is not ${h}. For ${oh} the number that changes nothing is 0.` }
        : { ok: false, say: `Which number changes nothing under ${oh}? ${ansV}.` });
};

// ---------- opposite: the additive inverse ----------
const opposite: Gen = (R, n) => {
  const k = pick(R, ['int', 'neg', 'neg', 'dec', 'zero'] as const);
  const v = k === 'int' ? int(R, 2, 40) : k === 'neg' ? -int(R, 1, 40) : k === 'dec' ? (R() < 0.5 ? -1 : 1) * int(R, 1, 95) / 10 : 0;
  const o = -v + 0;
  return numItem({
    id: `opposite-${n}`, family: 'opposite',
    prompt: `What is the <b>opposite</b> (additive inverse) of <b>${H(v)}</b>? It is the number that adds to ${H(v)} to make 0.`, board: `${T(v)} + \\square = 0`,
    solution: [`The opposite is the same distance from 0 on the other side.`, `${H(v)} + ${parenH(H(o))} = 0, so the opposite is ${ans(H(o))}.`],
  }, o, w => near(w, o) ? { ok: true, say: v === 0 ? 'Yes: 0 + 0 = 0, so 0 is its own opposite.' : `Yes: ${H(v)} + ${parenH(H(o))} = 0.` }
    : v < 0 && near(w, v) ? { ok: false, mc: MC.minusNeg, say: `The opposite of a negative number is positive: ${H(v)} + ${H(o)} = 0.` }
      : v !== 0 && near(w, 1 / v) ? { ok: false, mc: MC.oppRecip, say: `${fmt(1 / v)} is the reciprocal (it multiplies to 1). The opposite adds to 0: ${H(o)}.` }
        : { ok: false, say: `What adds to ${H(v)} to give 0? ${H(o)}.` });
};

// ---------- toZero: which number adds to a fraction to make 0? ----------
const toZero: Gen = (R, n) => {
  for (;;) {
    const x = sfrac(R), o = qMul(x, q(-1)), rc = q(x[1], x[0]), nrc = qMul(rc, q(-1));
    if (Math.abs(x[0]) === 1) continue;
    const opts: Opt[] = [
      { t: QH(o), ok: true, say: `Yes: ${QH(x)} + ${parenH(QH(o))} = 0. The opposite has the same size and the other sign.` },
      { t: QH(rc), mc: MC.oppRecip, say: `${QH(rc)} is the reciprocal: it multiplies with ${QH(x)} to make 1. To make 0 by adding, use the opposite, ${QH(o)}.` },
      { t: QH(nrc), mc: MC.oppRecip, say: `${QH(nrc)} flips the fraction. Flipping is for products (reciprocal). Adding to 0 needs the opposite, ${QH(o)}.` },
      { t: '0', mc: MC.zeroEvery, say: `${QH(x)} + 0 is still ${QH(x)}. Adding 0 changes nothing; you need ${QH(o)}.` },
    ];
    return choiceItem(R, {
      id: `toZero-${n}`, family: 'toZero', prompt: `Which number adds to <b>${QH(x)}</b> to make 0?`, board: `${QT(x)} + \\square = 0`,
      solution: [`Adding to 0 needs the opposite: same size, other sign.`, `${QH(x)} + ${parenH(QH(o))} = 0.`],
    }, opts);
  }
};

// ---------- reciprocal: the multiplicative inverse of a signed fraction ----------
const reciprocal: Gen = (R, n) => {
  for (;;) {
    const x = sfrac(R, 0.6);
    if (Math.abs(x[0]) === 1) continue;
    const rc = q(x[1], x[0]), o = qMul(x, q(-1)), wrongSign = qMul(rc, q(-1));
    const opts: Opt[] = [
      { t: QH(rc), ok: true, say: `Yes: ${QH(x)} · ${parenH(QH(rc))} = 1. Flip the fraction and keep the sign.` },
      { t: QH(wrongSign), say: `The sign must stay: ${QH(x)} · ${parenH(QH(wrongSign))} = −1, not 1. The reciprocal is ${QH(rc)}.` },
      { t: QH(o), mc: MC.oppRecip, say: `${QH(o)} is the opposite: it adds to 0. The reciprocal multiplies to 1: ${QH(rc)}.` },
    ];
    return choiceItem(R, {
      id: `reciprocal-${n}`, family: 'reciprocal', prompt: `What is the <b>reciprocal</b> (multiplicative inverse) of <b>${QH(x)}</b>?`, board: `${QT(x)} \\times \\square = 1`,
      solution: [`The reciprocal multiplies to 1: flip the fraction, keep the sign.`, `${QH(x)} · ${parenH(QH(rc))} = 1.`],
    }, opts);
  }
};

// ---------- recipNum: the reciprocal of a decimal or a whole number ----------
const recipNum: Gen = (R, n) => {
  const v = pick(R, [0.25, 0.5, 0.2, 0.125, 0.1, 0.4, 1.25, 2.5, 2, 4, 5, 8, 10, 20, 0.05, 1.6]) * (R() < 0.35 ? -1 : 1);
  const r = 1 / v, Qv = q(Math.round(v * 1000), 1000);
  return numItem({
    id: `recipNum-${n}`, family: 'recipNum',
    prompt: `What is the reciprocal of <b>${H(v)}</b>? Type it as a decimal or a whole number.`, board: `${T(v)} \\times \\square = 1`,
    solution: [`Write ${H(v)} as a fraction: ${QH(Qv)}.`, `Flip it: ${QH(q(Qv[1], Qv[0]))} = ${ans(H(r))}. Check: ${H(v)} × ${parenH(H(r))} = 1.`],
  }, r, w => near(w, r) ? { ok: true, say: `Yes: ${H(v)} × ${parenH(H(r))} = 1.` }
    : near(w, -v) ? { ok: false, mc: MC.oppRecip, say: `${H(-v)} is the opposite (it adds to 0). The reciprocal multiplies to 1: ${H(r)}.` }
      : near(w, -r) ? { ok: false, say: `Keep the sign: ${H(v)} × ${parenH(H(-r))} = −1. The reciprocal is ${H(r)}.` }
        : { ok: false, say: `${H(v)} = ${QH(Qv)}; flip it: ${H(r)}.` });
};

// ---------- zeroRecip: 0 has no reciprocal ----------
const zeroRecip: Gen = (R, n) => {
  const k = int(R, 2, 12);
  if (R() < 0.5) {
    const opts: Opt[] = [
      { t: '0', ok: true, say: `Yes: 0 times any number is 0, never 1. So 0 has no reciprocal.` },
      { t: String(k), say: `${k} · ${fr(1, k)} = 1, so ${k} has a reciprocal.` },
      { t: H(-k), say: `${H(-k)} · (−${fr(1, k)}) = 1, so ${H(-k)} has a reciprocal.` },
      { t: fr(1, k), say: `${fr(1, k)} · ${k} = 1, so ${fr(1, k)} has a reciprocal.` },
    ];
    return choiceItem(R, {
      id: `zeroRecip-${n}`, family: 'zeroRecip', prompt: `Every number but one has a reciprocal (a number it multiplies with to make 1): ${k} · ${fr(1, k)} = 1. Which of these has <b>no</b> reciprocal?`,
      board: `${k} \\times \\tfrac{1}{${k}} = 1, \\quad \\square \\times ? = 1`, solution: ['A reciprocal multiplies with the number to make 1.', '0 × anything = 0, so nothing works for 0.'],
    }, opts);
  }
  const opts: Opt[] = [
    { t: '0 has no reciprocal: 0 times any number is 0, never 1.', ok: true, say: 'Yes. The flip rule works for fractions with a nonzero top; 1/0 is not a number.' },
    { t: `Its reciprocal is ${fr(1, 0)}: write 0 as ${fr(0, 1)} and flip it.`, mc: MC.zeroRecip, say: `${fr(1, 0)} is not a number: no number times 0 gives 1. 0 has no reciprocal.` },
    { t: 'Its reciprocal is 0, because 0 · 0 = 0.', mc: MC.zeroRecip, say: '0 · 0 = 0, not 1. A reciprocal must multiply to 1, and nothing does that with 0.' },
  ];
  return choiceItem(R, {
    id: `zeroRecip-${n}`, family: 'zeroRecip', prompt: `Jo found the reciprocal of ${fr(k, k + 1)} by flipping it: ${fr(k + 1, k)}. Now she wants the reciprocal of <b>0</b>. Which is true?`,
    board: `0 \\times \\square = 1`, solution: ['A reciprocal multiplies with the number to make 1.', '0 × anything = 0, so 0 has no reciprocal.'],
  }, opts);
};

// ---------- distArea: mental math with the area model (7 × 98 = 7(100 − 2)) ----------
const distArea: Gen = (R, n) => {
  const a = int(R, 3, 9), sub = R() < 0.55;
  let b: number, c: number;
  if (sub) { b = pick(R, [100, 100, 50, 200, 1000]); c = int(R, 1, 4); }
  else if (R() < 0.5) { b = 100; c = int(R, 1, 9); }
  else { b = int(R, 2, 9) * 10; c = int(R, 1, 9); }
  const N = sub ? b - c : b + c, v = a * N, slip = sub ? a * b - c : a * b + c;
  const opS = sub ? '-' : '+', opH = sub ? '−' : '+';
  return numItem({
    id: `distArea-${n}`, family: 'distArea',
    prompt: `Use the distributive property: ${a} × ${N} = ${a}(${b} ${opH} ${c}). What is <b>${a} × ${N}</b>?`, board: `${a} \\times ${N} = ${a}(${b} ${opS} ${c})`,
    picture: { area: { op: sub ? '-' : '+', wb: b, wc: c, given: { a: String(a), b: String(b), c: String(c) }, reveal: { a: String(a), b: String(b), c: String(c), ab: String(a * b), ac: String(a * c) } } },
    solution: [`Multiply ${a} by BOTH parts: ${a} × ${b} = ${a * b} and ${a} × ${c} = ${a * c}.`, `${a * b} ${opH} ${a * c} = ${ans(v)}.`],
  }, v, w => near(w, v) ? { ok: true, say: `Yes: ${a} × ${b} ${opH} ${a} × ${c} = ${a * b} ${opH} ${a * c} = ${v}.` }
    : near(w, slip) ? { ok: false, mc: MC.partialDist, say: `The ${a} multiplies both parts, the ${c} too: ${a * b} ${opH} ${a * c} = ${v}. Both strips of the rectangle are ${a} tall.` }
      : { ok: false, say: `${a} × ${b} = ${a * b}, ${a} × ${c} = ${a * c}, and ${a * b} ${opH} ${a * c} = ${v}.` });
};

// ---------- distForm: expand or factor, signed multipliers ----------
const termT = (k: number, x: string) => (k === 1 ? x : k === -1 ? `-${x}` : `${T(k)}${x}`);
const termH = (k: number, x: string) => (k === 1 ? V(x) : k === -1 ? `−${V(x)}` : `${H(k)}${V(x)}`);
const sumH = (k: number, x: string, c: number) => `${termH(k, x)} ${c < 0 ? '−' : '+'} ${fmt(Math.abs(c))}`;
const sumT = (k: number, x: string, c: number) => `${termT(k, x)} ${c < 0 ? '-' : '+'} ${fmt(Math.abs(c))}`;
const distForm: Gen = (R, n) => {
  for (;;) {
    const x = pick(R, ['x', 'y', 'n']);
    const factor = R() < 0.4;
    if (!factor) {
      const a = (R() < 0.5 ? -1 : 1) * int(R, 2, 9), b = int(R, 1, 5), c = (R() < 0.5 ? -1 : 1) * int(R, 1, 9);
      const opts = uniq([
        { t: sumH(a * b, x, a * c), ok: true, say: `Yes: ${H(a)} times ${termH(b, x)} and ${H(a)} times ${H(c)}.` },
        { t: sumH(a * b, x, c), mc: MC.partialDist, say: `The ${H(a)} multiplies every term inside, the ${H(c)} too: ${H(a)} × ${parenH(H(c))} = ${H(a * c)}.` },
        { t: sumH(a * b, x, -a * c), say: `Check the sign: ${H(a)} × ${parenH(H(c))} = ${H(a * c)}.` },
        { t: sumH(-a * b, x, a * c), say: `Check the sign: ${H(a)} × ${termH(b, x)} = ${termH(a * b, x)}.` },
      ]);
      if (opts.length < 3) continue;
      return choiceItem(R, {
        id: `distForm-${n}`, family: 'distForm', prompt: `Expand: <b>${H(a)}(${sumH(b, x, c)})</b>`, board: `${T(a)}(${sumT(b, x, c)})`,
        picture: a > 0 && c > 0 ? { area: { op: '+', wb: 2, wc: 1, given: { a: String(a), b: termT(b, x), c: String(c) }, reveal: { a: String(a), b: termT(b, x), c: String(c), ab: termT(a * b, x), ac: String(a * c) } } } : undefined,
        solution: [`Distribute ${H(a)} over both terms: ${H(a)} · ${termH(b, x)} = ${termH(a * b, x)} and ${H(a)} · ${parenH(H(c))} = ${H(a * c)}.`, `${H(a)}(${sumH(b, x, c)}) = ${sumH(a * b, x, a * c)}.`],
      }, opts);
    }
    const g = int(R, 2, 6), p = int(R, 1, 5), c = int(R, 1, 9);
    if (p === c || (p % 2 === 0 && c % 2 === 0) || (p % 3 === 0 && c % 3 === 0) || (p % 5 === 0 && c % 5 === 0)) continue;
    const opts = uniq([
      { t: `${g}(${sumH(p, x, c)})`, ok: true, say: `Yes: ${g} · ${termH(p, x)} + ${g} · ${c} = ${sumH(g * p, x, g * c)}.` },
      { t: `${g}(${sumH(p, x, g * c)})`, mc: MC.partialDist, say: `Multiply it back: ${g}(${sumH(p, x, g * c)}) = ${sumH(g * p, x, g * g * c)}. The ${g} must come out of BOTH terms.` },
      { t: `${g * p}(${V(x)} + ${c})`, say: `Multiply it back: ${g * p}(${V(x)} + ${c}) = ${sumH(g * p, x, g * p * c)}, not ${sumH(g * p, x, g * c)}.` },
      { t: `${g}(${sumH(p, x, c)}) + ${g * c}`, say: `That counts the ${g * c} twice: ${g}(${sumH(p, x, c)}) is already ${sumH(g * p, x, g * c)}.` },
    ]);
    return choiceItem(R, {
      id: `distForm-${n}`, family: 'distForm', prompt: `Factor using the distributive property (the other direction): <b>${sumH(g * p, x, g * c)}</b> = ?`, board: `${sumT(g * p, x, g * c)} = \\square(\\ \\ldots\\ )`,
      picture: { area: { op: '+', wb: 2, wc: 1, given: { ab: termT(g * p, x), ac: String(g * c) }, reveal: { a: String(g), b: termT(p, x), c: String(c), ab: termT(g * p, x), ac: String(g * c) } } },
      solution: [`Both terms share the factor ${g}: ${termH(g * p, x)} = ${g} · ${termH(p, x)} and ${g * c} = ${g} · ${c}.`, `ab + ac = a(b + c): ${sumH(g * p, x, g * c)} = ${g}(${sumH(p, x, c)}).`],
    }, opts);
  }
};

// ===================== stage 2: using the properties =====================
// ---------- smartGroup: regroup a sum with negatives ----------
const smartGroup: Gen = (R, n) => {
  for (;;) {
    const a = int(R, 2, 19), b = int(R, 3, 40), c = int(R, 1, 9);
    if (b === a || c === a || b === 2 * a) continue;
    const layout = pick(R, ['-a+b+a', 'b-a+a', '-a+b+a+c', 'a+b-a'] as const);
    let expr: string, exprT: string, v: number, right: string, detached: string, wrong3: string, w3: number, d: number;
    if (layout === '-a+b+a') { expr = `−${a} + ${b} + ${a}`; exprT = `-${a} + ${b} + ${a}`; v = b; right = `(−${a} + ${a}) + ${b} = ${b}`; d = 2 * a + b; detached = `(${a} + ${a}) + ${b} = ${d}`; w3 = -(a + b + a); wrong3 = `−(${a} + ${b} + ${a}) = −${2 * a + b}`; }
    else if (layout === 'b-a+a') { expr = `${b} − ${a} + ${a}`; exprT = `${b} - ${a} + ${a}`; v = b; right = `${b} + (−${a} + ${a}) = ${b}`; d = b + 2 * a; detached = `${b} + (${a} + ${a}) = ${d}`; w3 = b - 2 * a; wrong3 = `${b} − (${a} + ${a}) = ${H(b - 2 * a)}`; }
    else if (layout === 'a+b-a') { expr = `${a} + ${b} − ${a}`; exprT = `${a} + ${b} - ${a}`; v = b; right = `(${a} − ${a}) + ${b} = ${b}`; d = 2 * a + b; detached = `(${a} + ${a}) + ${b} = ${d}`; w3 = -b; wrong3 = `${a} − (${b} + ${a}) = ${H(-b)}`; }
    else { expr = `−${a} + ${b} + ${a} + ${c}`; exprT = `-${a} + ${b} + ${a} + ${c}`; v = b + c; right = `(−${a} + ${a}) + (${b} + ${c}) = ${b + c}`; d = 2 * a + b + c; detached = `(${a} + ${a}) + (${b} + ${c}) = ${d}`; w3 = b + c - 2 * a; wrong3 = `(−${a} − ${a}) + (${b} + ${c}) = ${H(b + c - 2 * a)}`; }
    if (w3 === v || d === v) continue;
    const opts: Opt[] = [
      { t: right, ok: true, say: `Yes: reorder so the opposites sit together; −${a} + ${a} = 0.` },
      { t: detached, mc: MC.detached, say: `The minus sign belongs to the ${a} in front of it. When the ${a}'s move together, −${a} keeps its sign, and −${a} + ${a} = 0.` },
      { t: wrong3, say: `That changes the signs of terms. Each term keeps its own sign when it moves; only the order and grouping change.` },
    ];
    return choiceItem(R, {
      id: `smartGroup-${n}`, family: 'smartGroup', prompt: `Which regrouping of <b>${expr}</b> is correct (and makes it quick)?`, board: exprT,
      solution: [`Each term keeps its sign. Reorder (commutative) and regroup (associative) so −${a} and ${a} sit together.`, `−${a} + ${a} = 0, so the sum is ${v}.`],
    }, opts);
  }
};

// ---------- chainProduct: the friendly pair first (25 × 7 × 4) ----------
const chainProduct: Gen = (R, n) => {
  const [p1, p2] = pick(R, [[25, 4], [2, 5], [4, 25], [5, 20], [125, 8], [50, 2], [20, 5], [2, 50]] as const);
  const m = int(R, 3, 19), order = pick(R, ['p m q', 'm p q', 'p q m'] as const);
  const xs = order === 'p m q' ? [p1, m, p2] : order === 'm p q' ? [m, p1, p2] : [p1, p2, m];
  const v = p1 * p2 * m;
  return numItem({
    id: `chainProduct-${n}`, family: 'chainProduct',
    prompt: `Compute <b>${xs.join(' × ')}</b> in your head: reorder and regroup to find a friendly pair first.`, board: xs.join(' \\times '),
    solution: [`Reorder (commutative) and group (associative): (${p1} × ${p2}) × ${m}.`, `${p1} × ${p2} = ${p1 * p2}, and ${p1 * p2} × ${m} = ${ans(v)}.`],
  }, v, w => near(w, v) ? { ok: true, say: `Yes: ${p1} × ${p2} = ${p1 * p2}, then × ${m} = ${v}.` }
    : { ok: false, say: `Group ${p1} × ${p2} = ${p1 * p2} first, then ${p1 * p2} × ${m} = ${v}.` });
};

// ---------- cancelChain: inverse pairs that really cancel ----------
const cancelChain: Gen = (R, n) => {
  const k = pick(R, ['add', 'mul', 'prodOpp', 'repeat', 'repeatMul'] as const);
  const f = sfrac(R, 0), c = int(R, 2, 12) * (R() < 0.3 ? -1 : 1);
  const fT = QT(f), fH = QH(f), rT = QT(q(f[1], f[0])), rH = QH(q(f[1], f[0]));
  if (k === 'add') {
    return numItem({
      id: `cancelChain-${n}`, family: 'cancelChain', prompt: `Simplify using inverse pairs: <b>−${fH} + ${parenH(H(c))} + ${fH}</b>`, board: `-${fT} + ${paren(T(c))} + ${fT}`,
      solution: [`−${fH} and ${fH} are opposites: they add to 0 (additive inverses).`, `0 + ${parenH(H(c))} = ${ans(H(c))}.`],
    }, c, w => near(w, c) ? { ok: true, say: `Yes: −${fH} + ${fH} = 0, and 0 + ${parenH(H(c))} = ${H(c)}.` } : { ok: false, say: `Group the opposites: −${fH} + ${fH} = 0. What is left is ${H(c)}.` });
  }
  if (k === 'mul') {
    return numItem({
      id: `cancelChain-${n}`, family: 'cancelChain', prompt: `Simplify using inverse pairs: <b>(−${fH})(−${rH}) × ${parenH(H(c))}</b>`, board: `\\left(-${fT}\\right)\\left(-${rT}\\right) \\times ${paren(T(c))}`,
      solution: [`−${fH} and −${rH} are reciprocals: their product is 1 (multiplicative inverses).`, `1 × ${parenH(H(c))} = ${ans(H(c))}.`],
    }, c, w => near(w, c) ? { ok: true, say: `Yes: (−${fH})(−${rH}) = 1, and 1 × ${parenH(H(c))} = ${H(c)}.` }
      : near(w, -c) ? { ok: false, say: `Negative × negative is positive: (−${fH})(−${rH}) = 1, so the answer is ${H(c)}.` }
        : near(w, 0) ? { ok: false, mc: MC.cancelProd, say: `Reciprocals multiply to 1, not 0. 1 × ${parenH(H(c))} = ${H(c)}.` }
          : { ok: false, say: `(−${fH})(−${rH}) = 1, so the answer is ${H(c)}.` });
  }
  if (k === 'prodOpp') {
    const a = int(R, 2, 9), m = int(R, 2, 9), v = -a * a * m;
    return numItem({
      id: `cancelChain-${n}`, family: 'cancelChain', prompt: `Careful: do these opposites cancel? Simplify <b>(−${a})(${a}) × ${m}</b>`, board: `(-${a})(${a}) \\times ${m}`,
      solution: [`−${a} and ${a} are opposites, but here they are MULTIPLIED: (−${a})(${a}) = −${a * a}, not 0.`, `−${a * a} × ${m} = ${ans(H(v))}.`],
    }, v, w => near(w, v) ? { ok: true, say: `Yes: opposites only cancel when added. (−${a})(${a}) = −${a * a}, and −${a * a} × ${m} = ${H(v)}.` }
      : near(w, 0) || near(w, m) ? { ok: false, mc: MC.cancelProd, say: `Opposites cancel to 0 only in a SUM. In a product, (−${a})(${a}) = −${a * a}. So the answer is ${H(v)}.` }
        : { ok: false, say: `(−${a})(${a}) = −${a * a}; −${a * a} × ${m} = ${H(v)}.` });
  }
  const a = int(R, 2, 12), b = int(R, 2, 12);
  if (a === b) return cancelChain(R, n, undefined);
  if (k === 'repeat') {
    const v = a * b + a;
    return numItem({
      id: `cancelChain-${n}`, family: 'cancelChain', prompt: `Careful: does the repeated ${a} cancel? Simplify <b>${a} × ${b} + ${a}</b>`, board: `${a} \\times ${b} + ${a}`,
      solution: [`The two ${a}'s are not an inverse pair: one multiplies, one is added.`, `${a} × ${b} = ${a * b}, and ${a * b} + ${a} = ${ans(v)}.`],
    }, v, w => near(w, v) ? { ok: true, say: `Yes: nothing cancels here. ${a * b} + ${a} = ${v}.` }
      : near(w, b) ? { ok: false, mc: MC.repeatCancel, say: `Two equal numbers cancel only as an inverse pair (+${a} and −${a}, or × ${a} and ÷ ${a}). Here: ${a * b} + ${a} = ${v}.` }
        : { ok: false, say: `${a} × ${b} = ${a * b}; ${a * b} + ${a} = ${v}.` });
  }
  const v = (a * b) / a;
  return numItem({
    id: `cancelChain-${n}`, family: 'cancelChain', prompt: `Simplify using an inverse pair: <b>${a} × ${b} ÷ ${a}</b>`, board: `${a} \\times ${b} \\div ${a}`,
    solution: [`× ${a} and ÷ ${a} undo each other: ${a} × ${fr(1, a)} = 1.`, `So the result is 1 × ${b} = ${ans(v)}.`],
  }, v, w => near(w, v) ? { ok: true, say: `Yes: × ${a} and ÷ ${a} are inverse moves; ${b} is left.` } : { ok: false, say: `${a} × ${b} = ${a * b}, and ${a * b} ÷ ${a} = ${b}.` });
};

// ---------- cancelWhich: which cancellation is valid? ----------
const cancelWhich: Gen = (R, n) => {
  for (;;) {
    const f = sfrac(R, 0), c = int(R, 2, 12), a = int(R, 2, 9), b = int(R, 2, 9);
    if (a === b || Math.abs(f[0]) === 1) continue;
    const fH = QH(f), rH = QH(q(f[1], f[0]));
    const good: Opt[] = [
      { t: `−${fH} + ${fH} + ${c} = ${c}`, ok: true, say: `Yes: −${fH} and ${fH} add to 0, so ${c} is left.` },
      { t: `${fH} · ${rH} · ${c} = ${c}`, ok: true, say: `Yes: ${fH} and ${rH} multiply to 1, so ${c} is left.` },
    ];
    const bad: Opt[] = [
      { t: `(−${fH})(${fH}) · ${c} = 0`, mc: MC.cancelProd, say: `Opposites cancel to 0 only when ADDED. (−${fH})(${fH}) is a product: it is −${QH(qMul(f, f))}, not 0.` },
      { t: `${a} · ${b} + ${a} = ${b}`, mc: MC.repeatCancel, say: `The two ${a}'s are not an inverse pair (one multiplies, one adds): ${a} · ${b} + ${a} = ${a * b + a}.` },
      { t: `${fH} + ${rH} + ${c} = ${c + 1}`, mc: MC.oppRecip, say: `${fH} and ${rH} are reciprocals: they MULTIPLY to 1. Added, they make ${QH(qAdd(f, q(f[1], f[0])))}.` },
      { t: `0 · (${fr(1, 0)}) · ${c} = ${c}`, mc: MC.zeroRecip, say: `${fr(1, 0)} is not a number: 0 has no reciprocal, so there is no pair to cancel.` },
    ];
    const opts = [pick(R, good), ...shuffle(R, bad).slice(0, 3)];
    return choiceItem(R, {
      id: `cancelWhich-${n}`, family: 'cancelWhich', prompt: `Which simplification uses an inverse pair <b>correctly</b>? Watch how ${fH} is paired.`, board: `\\text{inverse pairs with } ${QT(f)}`,
      solution: ['Opposites cancel when added (to 0); reciprocals cancel when multiplied (to 1). 0 has no reciprocal.'],
    }, opts);
  }
};

// ---------- the rewrite chain a(x + b) + cx -> (a + c)x + ab (justify-steps) ----------
type Prop = 'dist' | 'comm' | 'assoc';
interface ChainStep { tex: string; html: string; prop: Prop }
function rewriteChain(R: () => number): { start: { tex: string; html: string }; steps: ChainStep[]; a: number; b: number; c: number; x: string } {
  const x = pick(R, ['x', 'y', 'n']), a = int(R, 2, 9), b = int(R, 1, 9), c = int(R, 1, 6);
  const X = V(x), aX = `${a}${X}`, aT = `${a}${x}`, cX = c === 1 ? X : `${c}${X}`, cT = c === 1 ? x : `${c}${x}`;
  return {
    a, b, c, x,
    start: { tex: `${a}(${x} + ${b}) + ${cT}`, html: `${a}(${X} + ${b}) + ${cX}` },
    steps: [
      { tex: `(${aT} + ${a * b}) + ${cT}`, html: `(${aX} + ${a * b}) + ${cX}`, prop: 'dist' },
      { tex: `${aT} + (${a * b} + ${cT})`, html: `${aX} + (${a * b} + ${cX})`, prop: 'assoc' },
      { tex: `${aT} + (${cT} + ${a * b})`, html: `${aX} + (${cX} + ${a * b})`, prop: 'comm' },
      { tex: `(${aT} + ${cT}) + ${a * b}`, html: `(${aX} + ${cX}) + ${a * b}`, prop: 'assoc' },
      { tex: `(${a} + ${c})${x} + ${a * b}`, html: `(${a} + ${c})${X} + ${a * b}`, prop: 'dist' },
    ],
  };
}
const PROP_NAME: Record<Prop, string> = { dist: 'Distributive property', comm: 'Commutative property of addition', assoc: 'Associative property of addition' };
const PROP_WHY: Record<Prop, string> = { dist: 'a product is spread over a sum (or a common factor is taken out)', comm: 'two terms change places', assoc: 'only the parentheses move' };
const nameStep: Gen = (R, n) => {
  const ch = rewriteChain(R), k = int(R, 0, ch.steps.length - 1), st = ch.steps[k]!, prev = k === 0 ? ch.start : ch.steps[k - 1]!;
  const opts: Opt[] = (['dist', 'comm', 'assoc'] as Prop[]).map(p => ({
    t: PROP_NAME[p], ok: p === st.prop,
    mc: p === st.prop ? undefined : (p === 'comm' && st.prop === 'assoc') || (p === 'assoc' && st.prop === 'comm') ? MC.assocComm : p === 'comm' ? MC.nameFromResult : undefined,
    say: p === st.prop ? `Yes: in this step ${PROP_WHY[p]}.` : `Compare the two lines: in this step ${PROP_WHY[st.prop]}. That is the ${PROP_NAME[st.prop].toLowerCase()}.`,
  }));
  opts.push({ t: 'Identity property of addition', say: `Nothing is added as 0 here. In this step ${PROP_WHY[st.prop]}.` });
  return choiceItem(R, {
    id: `nameStep-${n}`, family: 'nameStep', prompt: `Which property justifies step ${k + 1}:<br><b>${prev.html}</b> = <b>${st.html}</b>?`, board: `${prev.tex} = ${st.tex}`,
    picture: { chain: { lines: [ch.start.tex, ...ch.steps.map(s => s.tex)], ask: k + 1 } },
    solution: [`Compare the two lines: ${PROP_WHY[st.prop]}.`, `That is the ${PROP_NAME[st.prop].toLowerCase()}.`],
  }, opts);
};
const whichStep: Gen = (R, n) => {
  const ch = rewriteChain(R);
  const prop = pick(R, ['dist', 'comm', 'assoc'] as const);
  const all = ch.steps.map((s, i) => ({ s, i, prev: i === 0 ? ch.start : ch.steps[i - 1]! }));
  const right = pick(R, all.filter(z => z.s.prop === prop));
  const others = shuffle(R, all.filter(z => z.s.prop !== prop)).slice(0, 2);
  const opts: Opt[] = [right, ...others].map(z => ({
    t: `${z.prev.html} = ${z.s.html}`, ok: z === right,
    mc: z === right ? undefined : (prop === 'comm' && z.s.prop === 'assoc') || (prop === 'assoc' && z.s.prop === 'comm') ? MC.assocComm : prop === 'comm' ? MC.nameFromResult : undefined,
    say: z === right ? `Yes: here ${PROP_WHY[prop]}.` : `In that step ${PROP_WHY[z.s.prop]}: the ${PROP_NAME[z.s.prop].toLowerCase()}.`,
  }));
  return choiceItem(R, {
    id: `whichStep-${n}`, family: 'whichStep', prompt: `${ch.start.html} becomes ${(`(${ch.a} + ${ch.c})`)}${V(ch.x)} + ${ch.a * ch.b} in five steps. Which step uses the <b>${PROP_NAME[prop].toLowerCase()}</b>?`,
    board: `${ch.start.tex} = (${ch.a} + ${ch.c})${ch.x} + ${ch.a * ch.b}`,
    picture: { chain: { lines: [ch.start.tex, ...ch.steps.map(s => s.tex)] } },
    solution: [`The ${PROP_NAME[prop].toLowerCase()}: ${PROP_WHY[prop]}.`],
  }, opts);
};

// ===================== stage 3: claims, counterexamples, identities =====================
interface Claim { left: string; right: string; vars: string[]; L(v: number[]): number | null; Rr(v: number[]): number | null; html: string; scope: string }
const sq = (v: number) => (v >= 0 && near(Math.sqrt(v), Math.round(Math.sqrt(v))) ? Math.round(Math.sqrt(v)) : v >= 0 ? Math.sqrt(v) : null);
const CLAIMS: Record<string, Claim> = {
  sub: { left: 'a - b', right: 'b - a', vars: ['a', 'b'], L: ([a, b]) => a! - b!, Rr: ([a, b]) => b! - a!, html: `${V('a')} − ${V('b')} = ${V('b')} − ${V('a')}`, scope: 'for all numbers a and b' },
  div: { left: 'a \\div b', right: 'b \\div a', vars: ['a', 'b'], L: ([a, b]) => (b ? a! / b : null), Rr: ([a, b]) => (a ? b! / a : null), html: `${V('a')} ÷ ${V('b')} = ${V('b')} ÷ ${V('a')}`, scope: 'for all nonzero a and b' },
  sqsum: { left: '(a + b)^2', right: 'a^2 + b^2', vars: ['a', 'b'], L: ([a, b]) => (a! + b!) ** 2, Rr: ([a, b]) => a! ** 2 + b! ** 2, html: `(${V('a')} + ${V('b')})<sup>2</sup> = ${V('a')}<sup>2</sup> + ${V('b')}<sup>2</sup>`, scope: 'for all numbers a and b' },
  sqdiff: { left: '(a - b)^2', right: 'a^2 - b^2', vars: ['a', 'b'], L: ([a, b]) => (a! - b!) ** 2, Rr: ([a, b]) => a! ** 2 - b! ** 2, html: `(${V('a')} − ${V('b')})<sup>2</sup> = ${V('a')}<sup>2</sup> − ${V('b')}<sup>2</sup>`, scope: 'for all numbers a and b' },
  rootsum: { left: '\\sqrt{a + b}', right: '\\sqrt{a} + \\sqrt{b}', vars: ['a', 'b'], L: ([a, b]) => (a! < 0 || b! < 0 ? null : sq(a! + b!)), Rr: ([a, b]) => (a! < 0 || b! < 0 ? null : sq(a!)! + sq(b!)!), html: `√<span class="rad">${V('a')} + ${V('b')}</span> = ${rootHtml(V('a'))} + ${rootHtml(V('b'))}`, scope: 'for all a ≥ 0 and b ≥ 0' },
  rootsq: { left: '\\sqrt{a^2 + b^2}', right: 'a + b', vars: ['a', 'b'], L: ([a, b]) => (a! < 0 || b! < 0 ? null : sq(a! ** 2 + b! ** 2)), Rr: ([a, b]) => (a! < 0 || b! < 0 ? null : a! + b!), html: `√<span class="rad">${V('a')}<sup>2</sup> + ${V('b')}<sup>2</sup></span> = ${V('a')} + ${V('b')}`, scope: 'for all a ≥ 0 and b ≥ 0' },
  part: { left: 'a(b + c)', right: 'ab + c', vars: ['a', 'b', 'c'], L: ([a, b, c]) => a! * (b! + c!), Rr: ([a, b, c]) => a! * b! + c!, html: `${V('a')}(${V('b')} + ${V('c')}) = ${V('a')}${V('b')} + ${V('c')}`, scope: 'for all numbers a, b and c' },
  negd: { left: '-(a - b)', right: '-a - b', vars: ['a', 'b'], L: ([a, b]) => -(a! - b!), Rr: ([a, b]) => -a! - b!, html: `−(${V('a')} − ${V('b')}) = −${V('a')} − ${V('b')}`, scope: 'for all numbers a and b' },
  twop: { left: '2(xy)', right: '(2x)(2y)', vars: ['x', 'y'], L: ([x, y]) => 2 * x! * y!, Rr: ([x, y]) => 4 * x! * y!, html: `2(${V('x')}${V('y')}) = (2${V('x')})(2${V('y')})`, scope: 'for all numbers x and y' },
  fsplit: { left: '\\dfrac{a}{b + c}', right: '\\dfrac{a}{b} + \\dfrac{a}{c}', vars: ['a', 'b', 'c'], L: ([a, b, c]) => (b! + c! === 0 ? null : a! / (b! + c!)), Rr: ([a, b, c]) => (b === 0 || c === 0 ? null : a! / b! + a! / c!), html: `${fr(V('a'), `${V('b')} + ${V('c')}`)} = ${fr(V('a'), V('b'))} + ${fr(V('a'), V('c'))}`, scope: 'for all a, b, c with b, c, b + c ≠ 0' },
  dbl: { left: '2a', right: 'a^2', vars: ['a'], L: ([a]) => 2 * a!, Rr: ([a]) => a! ** 2, html: `2${V('a')} = ${V('a')}<sup>2</sup>`, scope: 'for every number a' },
};
function row(c: Claim, v: number[]): Required<ClaimRowPic> {
  const L = c.L(v)!, Rr = c.Rr(v)!;
  return { vals: v.map(numTex), left: numTex(L), right: numTex(Rr), ok: near(L, Rr) };
}
const sides = (c: Claim, v: number[]) => ({ L: c.L(v), R: c.Rr(v) });

// ---------- oneCounter: several rows agree, one fails: what follows? ----------
const oneCounter: Gen = (R, n) => {
  for (;;) {
    const id = pick(R, ['sub', 'div', 'sqsum', 'dbl'] as const), C = CLAIMS[id]!;
    let agree: number[][], fail: number[];
    if (id === 'sub' || id === 'div') { const s = shuffle(R, [1, 2, 3, 4, 5, 6, 7, 9].map(x => x * (id === 'sub' && R() < 0.3 ? -1 : 1))).slice(0, 3); agree = s.map(x => [x, x]); const a = int(R, 2, 9); let b = int(R, 2, 9); if (b === a) b = a + 3; fail = [a, b]; }
    else if (id === 'sqsum') { agree = shuffle(R, [[0, int(R, 1, 6)], [int(R, 1, 6), 0], [0, -int(R, 1, 5)], [-int(R, 1, 6), 0]]).slice(0, 3); fail = [int(R, 1, 5), int(R, 1, 5)]; }
    else { agree = [[0], [2]]; fail = [pick(R, [1, 3, 4, 5, -1, -2])]; }
    const rows = [...agree.map(v => row(C, v)), row(C, fail)];
    if (!rows.slice(0, -1).every(r => r.ok) || rows[rows.length - 1]!.ok) continue;
    const fv = fail.map(numHtml), fs = C.vars.map((x, i) => `${V(x)} = ${fv[i]}`).join(', ');
    const opts: Opt[] = [
      { t: 'The claim is false: one row that fails is enough.', ok: true, say: `Yes. "Always" means every row; ${fs} breaks it, so the claim is false. The rows that work do not save it.` },
      { t: `It is true, except when ${fs}.`, mc: MC.exception, say: `A claim that says "for all" has no exceptions. One failing row (${fs}) makes it false.` },
      { t: `It is true: it worked in ${agree.length} of ${agree.length + 1} rows.`, mc: MC.examplesProof, say: 'Most rows working is not enough. An "always" claim needs every row, and one fails.' },
      { t: 'We need more failing rows before we can decide.', mc: MC.exception, say: 'One failing row already settles it: the claim is false.' },
    ];
    return choiceItem(R, {
      id: `oneCounter-${n}`, family: 'oneCounter', prompt: `Kai tests the claim <b>${C.html}</b> (${C.scope}). His table is on the left: ${agree.length} rows work, and the last row, ${fs}, fails. What follows?`, board: `${C.left} \\overset{?}{=} ${C.right}`,
      picture: { claim: { left: C.left, right: C.right, vars: C.vars, scope: C.scope, rows, reveal: { strike: true } } },
      solution: [`The last row: ${fs} gives ${numHtml(C.L(fail)!)} and ${numHtml(C.Rr(fail)!)}, not equal.`, 'One valid counterexample makes an "always" claim false.'],
    }, opts);
  }
};

// ---------- proved: do these checks prove the claim? ----------
const proved: Gen = (R, n) => {
  const kind = pick(R, ['inf', 'inf', 'fin', 'finFail'] as const);
  let C: Claim, rows: Required<ClaimRowPic>[], scope: string, right: 'proved' | 'not' | 'disproved', extra: string;
  if (kind === 'inf') {
    const id = pick(R, ['plus0', 'times1', 'aa', 'dist'] as const);
    const m = int(R, 2, 6);
    C = id === 'plus0' ? { left: 'a + 0', right: 'a', vars: ['a'], L: ([a]) => a! + 0, Rr: ([a]) => a!, html: `${V('a')} + 0 = ${V('a')}`, scope: 'for every number a' }
      : id === 'times1' ? { left: 'a \\cdot 1', right: 'a', vars: ['a'], L: ([a]) => a!, Rr: ([a]) => a!, html: `${V('a')} · 1 = ${V('a')}`, scope: 'for every number a' }
        : id === 'aa' ? { left: 'a + a', right: '2a', vars: ['a'], L: ([a]) => 2 * a!, Rr: ([a]) => 2 * a!, html: `${V('a')} + ${V('a')} = 2${V('a')}`, scope: 'for every number a' }
          : { left: `${m}(a + 3)`, right: `${m}a + ${3 * m}`, vars: ['a'], L: ([a]) => m * (a! + 3), Rr: ([a]) => m * a! + 3 * m, html: `${m}(${V('a')} + 3) = ${m}${V('a')} + ${3 * m}`, scope: 'for every number a' };
    const vs = shuffle(R, [-7, -3, -1, 1, 2, 4, 5, 8, 10, 0.5]).slice(0, 3);
    rows = vs.map(v => row(C, [v])); scope = C.scope; right = 'not';
    extra = `Three rows cannot cover every number: there are infinitely many. (The claim is true, but the reason is a property${id === 'dist' ? ' (distributive)' : id === 'aa' ? ' (a + a is 1a + 1a = 2a, distributive)' : ' (identity)'}, not the table.)`;
  } else {
    const id = pick(R, ['sq01', 'sqpm', 'cube']);
    const set = id === 'sq01' ? [0, 1] : id === 'sqpm' ? [-1, 1] : [-1, 0, 1];
    C = id === 'sq01' ? { left: 'a \\cdot a', right: 'a', vars: ['a'], L: ([a]) => a! * a!, Rr: ([a]) => a!, html: `${V('a')} · ${V('a')} = ${V('a')}`, scope: '' }
      : id === 'sqpm' ? { left: 'a \\cdot a', right: '1', vars: ['a'], L: ([a]) => a! * a!, Rr: () => 1, html: `${V('a')} · ${V('a')} = 1`, scope: '' }
        : { left: 'a^3', right: 'a', vars: ['a'], L: ([a]) => a! ** 3, Rr: ([a]) => a!, html: `${V('a')}<sup>3</sup> = ${V('a')}`, scope: '' };
    let full = set.slice();
    if (kind === 'finFail') full = id === 'sqpm' ? [-1, 1, 2] : [...set, 2];
    scope = `for every a in {${full.map(H).join(', ')}}`;
    rows = full.map(v => row(C, [v]));
    right = kind === 'fin' ? 'proved' : 'disproved';
    extra = kind === 'fin' ? `The set has only ${set.length} numbers, and every one is in the table: that IS a proof.` : `The set holds 2, and the table shows it: 2 gives ${numHtml(C.L([2])!)} and ${numHtml(C.Rr([2])!)}, not equal. One member that fails is enough.`;
  }
  const opts: Opt[] = [
    { t: 'Proved', ok: right === 'proved', mc: right === 'not' ? MC.examplesProof : right === 'disproved' ? MC.exception : undefined, say: right === 'proved' ? `Yes. ${extra}` : right === 'not' ? `Agreeing rows never prove a claim about infinitely many numbers. ${extra}` : `One row fails, so the claim cannot be proved. ${extra}` },
    { t: 'Not proved by these checks', ok: right === 'not', say: right === 'not' ? `Yes. ${extra}` : right === 'proved' ? `For a FINITE set you can check every case. ${extra}` : `The row for 2 fails, so the checks do more than leave it open: they disprove it. ${extra}` },
    { t: 'Disproved', ok: right === 'disproved', say: right === 'disproved' ? `Yes. ${extra}` : 'No row fails, and no number of the claim breaks it.' },
  ];
  return choiceItem(R, {
    id: `proved-${n}`, family: 'proved', prompt: `Claim: <b>${C.html}</b>, ${scope}. Lee checked the rows in the table${kind === 'finFail' ? '' : ', and all of them work'}. What can Lee say?`, board: `${C.left} \\overset{?}{=} ${C.right}`,
    picture: { claim: { left: C.left, right: C.right, vars: C.vars, scope, rows } },
    solution: [extra],
  }, opts);
};

// ---------- equivQ: are the two expressions equivalent? ----------
const equivQ: Gen = (R, n) => {
  const k = int(R, 2, 6), m = int(R, 1, 6);
  const cases = [
    { L: `${k}(x + ${m})`, Rt: `${k}x + ${k * m}`, Lh: `${k}(${V('x')} + ${m})`, Rh: `${k}${V('x')} + ${k * m}`, f: (x: number) => k * (x + m), g: (x: number) => k * x + k * m, eq: true, rows: [0, 1, 2], why: 'the distributive property' },
    { L: 'x + x', Rt: '2x', Lh: `${V('x')} + ${V('x')}`, Rh: `2${V('x')}`, f: (x: number) => 2 * x, g: (x: number) => 2 * x, eq: true, rows: [k, -1, 0], why: 'x + x = 1x + 1x = (1 + 1)x (distributive)' },
    { L: `${k}x`, Rt: 'x^2', Lh: `${k}${V('x')}`, Rh: `${V('x')}<sup>2</sup>`, f: (x: number) => k * x, g: (x: number) => x * x, eq: false, rows: [0, k], why: '' },
    { L: `(x + ${m})^2`, Rt: `x^2 + ${m * m}`, Lh: `(${V('x')} + ${m})<sup>2</sup>`, Rh: `${V('x')}<sup>2</sup> + ${m * m}`, f: (x: number) => (x + m) ** 2, g: (x: number) => x * x + m * m, eq: false, rows: [0], why: '' },
    { L: 'x^2 + ' + k * k, Rt: `${2 * k}x`, Lh: `${V('x')}<sup>2</sup> + ${k * k}`, Rh: `${2 * k}${V('x')}`, f: (x: number) => x * x + k * k, g: (x: number) => 2 * k * x, eq: false, rows: [k], why: '' },
  ];
  const C = pick(R, cases);
  const rows = C.rows.map(x => ({ vals: [numTex(x)], left: numTex(C.f(x)), right: numTex(C.g(x)), ok: near(C.f(x), C.g(x)) }));
  let w = 1; while (!C.eq && (near(C.f(w), C.g(w)) || C.rows.includes(w))) w++;
  const opts: Opt[] = C.eq ? [
    { t: `Yes: ${C.why} makes them equal for every ${V('x')}.`, ok: true, say: `Yes. The table only shows a few values; ${C.why} shows it for every ${V('x')}.` },
    { t: 'Yes, because they match in every row of the table.', mc: MC.examplesProof, say: `The answer is yes, but not because of the table: a few rows never cover every ${V('x')}. The reason is ${C.why}.` },
    { t: `No: some value of ${V('x')} must make them differ.`, say: `No value does: ${C.why} makes them equal for every ${V('x')}.` },
  ] : [
    { t: `No: at ${V('x')} = ${w} they are ${numHtml(C.f(w))} and ${numHtml(C.g(w))}.`, ok: true, say: `Yes. Equivalent means equal for EVERY ${V('x')}; ${V('x')} = ${w} breaks it.` },
    { t: 'Yes, because they match in every row of the table.', mc: MC.examplesProof, say: `The rows were chosen where they happen to agree. Try ${V('x')} = ${w}: ${numHtml(C.f(w))} and ${numHtml(C.g(w))}.` },
    { t: `Yes: they agree at ${V('x')} = ${C.rows[0]}, so they agree everywhere.`, mc: MC.nonSeparating, say: `One agreeing value proves nothing. At ${V('x')} = ${w} they differ.` },
  ];
  return choiceItem(R, {
    id: `equivQ-${n}`, family: 'equivQ', prompt: `Are <b>${C.Lh}</b> and <b>${C.Rh}</b> equivalent (equal for every value of ${V('x')})?`, board: `${C.L} \\overset{?}{=} ${C.Rt}`,
    picture: { claim: { left: C.L, right: C.Rt, vars: ['x'], scope: 'for every number x', rows, ...(C.eq ? {} : { reveal: { rows: [...rows, { vals: [String(w)], left: numTex(C.f(w)), right: numTex(C.g(w)), ok: false }], strike: true } }) } },
    solution: C.eq ? [`The table agrees, but that is not the reason: ${C.why} makes them equal for every ${V('x')}.`] : [`Try a value the table skipped: ${V('x')} = ${w} gives ${numHtml(C.f(w))} and ${numHtml(C.g(w))}.`, 'One value where they differ: not equivalent.'],
  }, opts);
};

// ---------- differAt: type a value where two expressions differ ----------
const differAt: Gen = (R, n) => {
  const k = int(R, 2, 6), m = int(R, 1, 5);
  const cases = [
    { L: `${k}x`, Rt: 'x^2', Lh: `${k}${V('x')}`, Rh: `${V('x')}<sup>2</sup>`, f: (x: number) => k * x, g: (x: number) => x * x, agree: [0, k] },
    { L: `x^2 + ${m * m}`, Rt: `${2 * m}x`, Lh: `${V('x')}<sup>2</sup> + ${m * m}`, Rh: `${2 * m}${V('x')}`, f: (x: number) => x * x + m * m, g: (x: number) => 2 * m * x, agree: [m] },
    { L: `(x + ${m})^2`, Rt: `x^2 + ${m * m}`, Lh: `(${V('x')} + ${m})<sup>2</sup>`, Rh: `${V('x')}<sup>2</sup> + ${m * m}`, f: (x: number) => (x + m) ** 2, g: (x: number) => x * x + m * m, agree: [0] },
    { L: 'x^3', Rt: 'x', Lh: `${V('x')}<sup>3</sup>`, Rh: V('x'), f: (x: number) => x ** 3, g: (x: number) => x, agree: [-1, 0, 1] },
    { L: 'x^2', Rt: `x + ${m * (m + 1)}`, Lh: `${V('x')}<sup>2</sup>`, Rh: `${V('x')} + ${m * (m + 1)}`, f: (x: number) => x * x, g: (x: number) => x + m * (m + 1), agree: [-m, m + 1] },
  ];
  const C = pick(R, cases);
  let w = 1; while (near(C.f(w), C.g(w))) w++;
  const agreeH = C.agree.map(H).join(' and ');
  return numItem({
    id: `differAt-${n}`, family: 'differAt',
    prompt: `<b>${C.Lh}</b> and <b>${C.Rh}</b> agree at ${V('x')} = ${agreeH}. Type a value of ${V('x')} where they <b>differ</b> (that shows they are not equivalent).`,
    board: `${C.L} \\overset{?}{=} ${C.Rt}`,
    picture: { claim: { left: C.L, right: C.Rt, vars: ['x'], rows: C.agree.map(x => ({ vals: [numTex(x)], left: numTex(C.f(x)), right: numTex(C.g(x)), ok: true })), reveal: { rows: [...C.agree.map(x => ({ vals: [numTex(x)], left: numTex(C.f(x)), right: numTex(C.g(x)), ok: true })), { vals: [String(w)], left: numTex(C.f(w)), right: numTex(C.g(w)), ok: false }].slice(-4), strike: true } } },
    solution: [`Pick a value that is not ${agreeH}, for example ${V('x')} = ${ans(w)}.`, `${C.Lh} = ${numHtml(C.f(w))} and ${C.Rh} = ${numHtml(C.g(w))}: they differ, so they are not equivalent.`],
  }, w, v => !near(C.f(v), C.g(v)) ? { ok: true, say: `Yes: at ${V('x')} = ${fmt(v)} they are ${numHtml(C.f(v))} and ${numHtml(C.g(v))}. One such value shows they are not equivalent.` }
    : { ok: false, mc: MC.nonSeparating, say: `At ${V('x')} = ${fmt(v)} they agree (${numHtml(C.f(v))} both). A test value has to make the sides differ: try ${V('x')} = ${w}.` });
};

// ---------- separating: which test values expose a false claim? ----------
type SepCase = { id: keyof typeof CLAIMS; good: () => number[]; bad: (() => number[])[] };
const separating: Gen = (R, n, sg) => {
  const pw = sg === 'power-root-overgeneralization';
  const nz = (lo = 1, hi = 9) => int(R, lo, hi) * (R() < 0.3 ? -1 : 1);
  const sqr = () => pick(R, [1, 4, 9, 16, 25, 36, 49, 64]);
  const cases: SepCase[] = pw ? [
    { id: 'sqsum', good: () => [int(R, 1, 6), int(R, 1, 6)], bad: [() => [0, int(R, 1, 9)], () => [int(R, 1, 9), 0]] },
    { id: 'sqdiff', good: () => { const a = int(R, 3, 9); return [a, int(R, 1, a - 1)]; }, bad: [() => [int(R, 1, 9), 0], () => { const a = int(R, 2, 9); return [a, a]; }] },
    { id: 'rootsum', good: () => [sqr(), sqr()], bad: [() => [0, sqr()], () => [sqr(), 0]] },
    { id: 'rootsq', good: () => [int(R, 1, 9), int(R, 1, 9)], bad: [() => [0, int(R, 1, 9)], () => [int(R, 1, 9), 0]] },
  ] : [
    { id: 'part', good: () => [int(R, 2, 9), nz(), nz()], bad: [() => [1, nz(), nz()], () => [int(R, 2, 9), nz(), 0]] },
    { id: 'negd', good: () => [nz(), nz()], bad: [() => [nz(), 0], () => [nz(), 0]] },
    { id: 'twop', good: () => [nz(), nz()], bad: [() => [0, nz()], () => [nz(), 0]] },
  ];
  for (;;) {
    const S = pick(R, cases), C = CLAIMS[S.id]!;
    const g = S.good(), b1 = S.bad[0]!(), b2 = S.bad[1]!();
    const sg1 = sides(C, g), s1 = sides(C, b1), s2 = sides(C, b2);
    if (sg1.L === null || sg1.R === null || near(sg1.L, sg1.R) || !near(s1.L!, s1.R!) || !near(s2.L!, s2.R!)) continue;
    const t = (v: number[]) => C.vars.map((x, i) => `${V(x)} = ${H(v[i]!)}`).join(', ');
    if (new Set([t(g), t(b1), t(b2)]).size < 3) continue;
    const fn = S.id === 'rootsum' || S.id === 'rootsq' ? MC.rootSum : undefined;
    void fn;
    const opts: Opt[] = [
      { t: t(g), ok: true, say: `Yes: the sides come out ${numHtml(sg1.L)} and ${numHtml(sg1.R)}, not equal. That one row disproves the claim.` },
      { t: t(b1), mc: MC.nonSeparating, say: `With ${t(b1)} both sides are ${numHtml(s1.L!)}: these values happen to work, so they prove nothing. Try ${t(g)}.` },
      { t: t(b2), mc: MC.nonSeparating, say: `With ${t(b2)} both sides are ${numHtml(s2.L!)}: an accidental match. Try ${t(g)}.` },
    ];
    return choiceItem(R, {
      id: `separating-${n}`, family: 'separating', prompt: `Claim: <b>${C.html}</b> (${C.scope}). Which values show the claim is <b>false</b>?`, board: `${C.left} \\overset{?}{=} ${C.right} \\quad \\text{tests: } ${[g, b1, b2].map(v => `(${v.map(T).join(', ')})`).join(',\\ ')}`,
      picture: { claim: { left: C.left, right: C.right, vars: C.vars, scope: C.scope, rows: [], reveal: { rows: [row(C, b1), row(C, g)], strike: true } } },
      solution: [`Work out both sides for each choice. ${t(b1)}: ${numHtml(s1.L!)} and ${numHtml(s1.R!)} (equal, no use).`, `${t(g)}: ${numHtml(sg1.L)} and ${numHtml(sg1.R)}. They differ, so the claim is false.`],
    }, opts);
  }
};

// ---------- ownValue: the student picks the value that breaks the claim ----------
const ownValue: Gen = (R, n, sg) => {
  const pw = sg === 'power-root-overgeneralization';
  const id = pick(R, pw ? ['sqsum', 'sqdiff', 'rootsum', 'rootsq'] as const : ['part', 'negd', 'twop', 'fsplit'] as const);
  const C = CLAIMS[id]!;
  // fix every letter but the last; the student types the last one
  let fixed: number[];
  if (id === 'part') fixed = [int(R, 2, 9), int(R, 1, 9)];
  else if (id === 'negd') fixed = [int(R, 1, 9) * (R() < 0.3 ? -1 : 1)];
  else if (id === 'twop') fixed = [int(R, 1, 9)];
  else if (id === 'fsplit') fixed = [pick(R, [6, 12, 24, 30]), pick(R, [1, 2, 3, 4, 6])];
  else if (id === 'rootsum') fixed = [pick(R, [4, 9, 16, 25, 36, 49])];
  else fixed = [int(R, 1, 9)];
  const last = C.vars[C.vars.length - 1]!;
  const admissible = (v: number) => { const s = sides(C, [...fixed, v]); return s.L !== null && s.R !== null && Number.isFinite(s.L) && Number.isFinite(s.R); };
  let w = pick(R, [1, 2, 3, 4, 5]);
  if (id === 'rootsum') w = pick(R, [4, 9, 16, 25]);
  while (!admissible(w) || near(sides(C, [...fixed, w]).L!, sides(C, [...fixed, w]).R!)) w++;
  const fixH = C.vars.slice(0, -1).map((x, i) => `${V(x)} = ${H(fixed[i]!)}`).join(' and ');
  const s = sides(C, [...fixed, w]);
  const vals = (v: number) => [...fixed, v].map(numTex);
  return numItem({
    id: `ownValue-${n}`, family: 'ownValue',
    prompt: `Claim: <b>${C.html}</b> (${C.scope}). Keep ${fixH}. Type a value of ${V(last)} that shows the claim is <b>false</b>.`, board: `${C.left} \\overset{?}{=} ${C.right}`,
    picture: { claim: { left: C.left, right: C.right, vars: C.vars, scope: C.scope, rows: [{ vals: [...fixed.map(numTex), '?'] }], reveal: { rows: [{ vals: vals(w), left: numTex(s.L!), right: numTex(s.R!), ok: false }], strike: true } } },
    solution: [`Choose a value that the claim allows and that does not make the sides match by accident, for example ${V(last)} = ${ans(w)}.`, `Then the left side is ${numHtml(s.L!)} and the right side is ${numHtml(s.R!)}: they differ, so the claim is false.`],
  }, w, v => {
    if (!admissible(v)) return { ok: false, mc: id === 'fsplit' ? MC.divZero : MC.premise, say: id === 'fsplit' ? `With ${V(last)} = ${fmt(v)} a side divides by 0, which has no value. The claim does not allow it: pick another value.` : `The claim is only about ${C.scope.replace('for all ', '')}: ${V(last)} = ${fmt(v)} is not allowed. Pick another value.` };
    const t = sides(C, [...fixed, v]);
    return near(t.L!, t.R!) ? { ok: false, mc: MC.nonSeparating, say: `With ${V(last)} = ${fmt(v)} both sides are ${numHtml(t.L!)}: an accidental match. Try ${V(last)} = ${w}.` }
      : { ok: true, say: `Yes: the sides are ${numHtml(t.L!)} and ${numHtml(t.R!)}. One counterexample is enough.` };
  });
};

// ---------- powerEval: test (a + b)² or √(a + b) with numbers ----------
const powerEval: Gen = (R, n) => {
  const id = pick(R, ['sqsum', 'sqdiff', 'rootsum', 'rootsum'] as const), C = CLAIMS[id]!;
  let a: number, b: number;
  if (id === 'rootsum') [a, b] = pick(R, [[9, 16], [16, 9], [36, 64], [64, 36], [25, 144], [144, 25], [81, 144], [64, 225], [225, 64], [144, 81]] as const);
  else if (id === 'sqsum') { a = int(R, 1, 7); b = int(R, 1, 7); }
  else { a = int(R, 3, 9); b = int(R, 1, a - 1); }
  const L = C.L([a, b])!, Rr = C.Rr([a, b])!;
  const lhsH = id === 'rootsum' ? `√<span class="rad">${a} + ${b}</span>` : id === 'sqsum' ? `(${a} + ${b})<sup>2</sup>` : `(${a} − ${b})<sup>2</sup>`;
  const inner = id === 'rootsum' ? a + b : id === 'sqsum' ? a + b : a - b;
  return numItem({
    id: `powerEval-${n}`, family: 'powerEval',
    prompt: `Test the claim <b>${C.html}</b> with ${V('a')} = ${a}, ${V('b')} = ${b}. What is the left side, <b>${lhsH}</b>?`,
    board: id === 'rootsum' ? `\\sqrt{${a} + ${b}}` : id === 'sqsum' ? `(${a} + ${b})^2` : `(${a} - ${b})^2`,
    picture: { claim: { left: C.left, right: C.right, vars: C.vars, scope: C.scope, rows: [{ vals: [String(a), String(b)] }], reveal: { rows: [{ vals: [String(a), String(b)], left: numTex(L), right: numTex(Rr), ok: false }], strike: true } } },
    solution: [`Inside first: ${id === 'sqdiff' ? `${a} − ${b}` : `${a} + ${b}`} = ${inner}.`, `${id === 'rootsum' ? `√${inner}` : `${inner}<sup>2</sup>`} = ${ans(L)}. The right side is ${numHtml(Rr)}: not equal, so the claim is false.`],
  }, L, w => near(w, L) ? { ok: true, say: `Yes: ${lhsH} = ${L}, while the right side is ${numHtml(Rr)}. The claim fails.` }
    : near(w, Rr) ? { ok: false, mc: id === 'rootsum' ? MC.rootSum : MC.fnSum, say: `${numHtml(Rr)} is the RIGHT side. ${id === 'rootsum' ? 'A root does not split over a sum' : 'A square does not split over a sum or difference'}: work inside first, ${inner}, then ${id === 'rootsum' ? `√${inner} = ${L}` : `${inner}<sup>2</sup> = ${L}`}.` }
      : { ok: false, say: `Inside first: ${inner}. Then ${id === 'rootsum' ? `√${inner}` : `${inner}<sup>2</sup>`} = ${L}.` });
};

// ===================== the number sets =====================
export interface NumX { tex: string; html: string; x: Real; tag: 'int' | 'zero' | 'neg' | 'fracInt' | 'frac' | 'dec' | 'bar' | 'sqrtSq' | 'negSqrtSq' | 'sqrt0' | 'sqrt' | 'pi' | 'mixedIrr' }
function numX(R: () => number, tag: NumX['tag']): NumX {
  switch (tag) {
    case 'int': { const k = int(R, 1, 20); return { tex: String(k), html: String(k), x: Rn(k), tag }; }
    case 'zero': return { tex: '0', html: '0', x: Rn(0), tag };
    case 'neg': { const k = -int(R, 1, 20); return { tex: T(k), html: H(k), x: Rn(k), tag }; }
    case 'fracInt': { const d = int(R, 2, 6), k = pick(R, [int(R, 1, 6), -int(R, 1, 6), 0]); return { tex: `${k < 0 ? '-' : ''}\\frac{${Math.abs(k * d)}}{${d}}`, html: `${k < 0 ? '−' : ''}${fr(Math.abs(k * d), d)}`, x: Rn(k), tag }; }
    case 'frac': { const f = sfrac(R, 0.4); return { tex: QT(f), html: QH(f), x: RQ(f), tag }; }
    case 'dec': { const v = pick(R, [0.375, 2.5, 0.75, 1.25, 0.04, 3.6]) * (R() < 0.4 ? -1 : 1); return { tex: T(v), html: H(v), x: RQ(q(Math.round(v * 1000), 1000)), tag }; }
    case 'bar': { const [d, f] = pick(R, [['6', q(2, 3)], ['3', q(1, 3)], ['27', q(3, 11)], ['18', q(2, 11)], ['1', q(1, 9)], ['45', q(5, 11)]] as const); return { tex: `0.\\overline{${d}}`, html: `0.<span class="bar">${d}</span>`, x: RQ(f), tag }; }
    case 'sqrtSq': { const k = int(R, 1, 12); return { tex: `\\sqrt{${k * k}}`, html: rootHtml(k * k), x: Rn(k), tag }; }
    case 'negSqrtSq': { const k = int(R, 1, 12); return { tex: `-\\sqrt{${k * k}}`, html: `−${rootHtml(k * k)}`, x: Rn(-k), tag }; }
    case 'sqrt0': return { tex: '\\sqrt{0}', html: rootHtml(0), x: Rn(0), tag };
    case 'sqrt': { const m = pick(R, [2, 3, 5, 6, 7, 8, 10, 11, 12, 13, 15, 18, 20, 50]); const neg = R() < 0.3; return { tex: `${neg ? '-' : ''}\\sqrt{${m}}`, html: `${neg ? '−' : ''}${rootHtml(m)}`, x: neg ? { ...sqrt(m), s: qMul(sqrt(m).s, q(-1)) } : sqrt(m), tag }; }
    case 'pi': { const d = pick(R, [1, 2, 3, 4]); return d === 1 ? { tex: '\\pi', html: 'π', x: PI, tag } : { tex: `\\frac{\\pi}{${d}}`, html: fr('π', d), x: { r: q(0), s: q(1, d), n: 0 }, tag }; }
    case 'mixedIrr': { const k = int(R, 1, 6), m = pick(R, [2, 3, 5, 7]); return { tex: `${k} + \\sqrt{${m}}`, html: `${k} + ${rootHtml(m)}`, x: add(Rn(k), sqrt(m)), tag }; }
  }
}
const setsList = (s: SetId) => [...SETS_OF[s].map(x => SET_LONG[x]), 'real numbers'];
const cap = (s: string) => s[0]!.toUpperCase() + s.slice(1);
const listH = (xs: string[]) => cap(xs.length === 1 ? xs[0]! : xs.slice(0, -1).join(', ') + ' and ' + xs[xs.length - 1]);
const tok = (u: NumX): MapTok => ({ tex: u.tex, at: innermost(u.x) });

// ---------- setRule: the US set names and their rules ----------
const setRule: Gen = (R, n) => {
  const k = int(R, 2, 15), f = sfrac(R, 0), d = int(R, 2, 5);
  const kind = pick(R, ['wholeNotCounting', 'intNotWhole', 'ratNotInt', 'counting', 'zeroWhole'] as const);
  const ring: Region = kind === 'wholeNotCounting' || kind === 'zeroWhole' ? 'whole' : kind === 'intNotWhole' ? 'integer' : kind === 'ratNotInt' ? 'rational' : 'counting';
  let prompt: string, opts: Opt[], sol: string[], drop: MapTok;
  if (kind === 'wholeNotCounting') {
    prompt = 'Which number is a <b>whole number</b> but <b>not</b> a counting number?'; drop = { tex: '0', at: 'whole' };
    opts = [{ t: '0', ok: true, say: 'Yes: whole numbers are 0, 1, 2, 3, …; counting numbers start at 1.' }, { t: H(-k), mc: MC.wholeNeg, say: `Whole numbers are 0, 1, 2, 3, …: no negatives. ${H(-k)} is an integer.` }, { t: String(k), say: `${k} is a counting number (and whole too).` }, { t: QH(f), say: `${QH(f)} is not a whole number at all.` }];
    sol = ['Counting numbers: 1, 2, 3, …  Whole numbers: 0, 1, 2, 3, …', 'The only whole number that is not a counting number is 0.'];
  } else if (kind === 'intNotWhole') {
    prompt = 'Which number is an <b>integer</b> but <b>not</b> a whole number?'; drop = { tex: T(-k), at: 'integer' };
    opts = [{ t: H(-k), ok: true, say: `Yes: integers include the negatives, whole numbers don't.` }, { t: '0', mc: MC.zeroNotWhole, say: '0 is a whole number: whole numbers are 0, 1, 2, 3, …' }, { t: String(k), say: `${k} is a whole number too.` }, { t: QH(f), say: `${QH(f)} is not an integer.` }];
    sol = ['Integers: …, −2, −1, 0, 1, 2, …  Whole numbers: 0, 1, 2, …', `The negative integers are not whole: ${H(-k)}.`];
  } else if (kind === 'ratNotInt') {
    prompt = 'Which number is <b>rational</b> but <b>not</b> an integer?'; drop = { tex: QT(f), at: 'rational' };
    opts = [{ t: QH(f), ok: true, say: `Yes: ${QH(f)} is a ratio of integers, and it is not a whole step on the number line.` }, { t: fr(k * d, d), mc: MC.fracNotInt, say: `${fr(k * d, d)} = ${k}: an integer, even with a fraction bar. Classify by the value.` }, { t: H(-k), say: `${H(-k)} is an integer.` }, { t: '0', say: '0 is an integer.' }];
    sol = ['Simplify first, then classify by the value.', `${fr(k * d, d)} = ${k} is an integer; ${QH(f)} is not.`];
  } else if (kind === 'counting') {
    prompt = 'Which number is a <b>counting number</b>?'; drop = { tex: String(k), at: 'counting' };
    opts = [{ t: String(k), ok: true, say: 'Yes: counting numbers are 1, 2, 3, …' }, { t: '0', say: 'Counting starts at 1: 0 is whole, not counting.' }, { t: H(-k), say: `${H(-k)} is an integer, not a counting number.` }, { t: QH(f), say: `${QH(f)} is not a counting number.` }];
    sol = ['Counting (natural) numbers: 1, 2, 3, …'];
  } else {
    prompt = `Mia had ${k} stickers and gave all ${k} away, so she has 0 left. Is <b>0</b> a whole number?`; drop = { tex: '0', at: 'whole' };
    opts = [{ t: 'Yes: the whole numbers are 0, 1, 2, 3, …', ok: true, say: 'Yes. In US usage, whole numbers start at 0; counting numbers start at 1.' }, { t: 'No: the whole numbers start at 1.', mc: MC.zeroNotWhole, say: 'The counting numbers start at 1. The whole numbers are the counting numbers plus 0.' }, { t: `No: 0 is not a number of things.`, mc: MC.zeroNotWhole, say: '0 is a whole number (and an integer and rational). It is not a counting number.' }];
    sol = ['Whole numbers: 0, 1, 2, 3, …  (counting numbers: 1, 2, 3, …)'];
  }
  return choiceItem(R, {
    id: `setRule-${n}`, family: 'setRule', prompt, board: `${k},\\ \\ -${k},\\ \\ ${QT(f)},\\ \\ 0`,
    picture: { map: { tokens: [], ring, reveal: { tokens: [drop] } } }, solution: sol,
  }, opts);
};

// ---------- countMembers: how many of the list are in the set? ----------
const countMembers: Gen = (R, n, sg) => {
  for (;;) {
    const tags: NumX['tag'][] = sg === 'classify-radicals' ? ['sqrtSq', 'negSqrtSq', 'sqrt0', 'sqrt', 'sqrt', 'int', 'frac', 'sqrt']
      : sg === 'classify-rational-forms' ? ['fracInt', 'fracInt', 'frac', 'dec', 'bar', 'neg', 'zero', 'int']
        : ['int', 'int', 'zero', 'neg', 'neg', 'frac', 'dec', 'int'];
    const xs = shuffle(R, tags.map(t => numX(R, t)));
    if (new Set(xs.map(x => x.tex)).size < xs.length) continue;
    const target: SetId = sg === 'classify-radicals' ? pick(R, ['irrational', 'integer', 'rational'] as const) : sg === 'classify-rational-forms' ? pick(R, ['integer', 'whole', 'rational'] as const) : pick(R, ['whole', 'integer', 'counting'] as const);
    const inT = (u: NumX) => SETS_OF[innermost(u.x)].includes(target);
    const right = xs.filter(inT).length;
    // map tokens: at most 3 per ring region, 4 irrational
    const per = (s: SetId) => xs.filter(u => innermost(u.x) === s).length;
    if (per('counting') > 3 || per('whole') > 3 || per('integer') > 3 || per('rational') > 3 || per('irrational') > 4) continue;
    if (right === 0 || right === xs.length) continue;
    const alts: [number, string, string][] = [];
    if (target === 'whole') {
      alts.push([right - xs.filter(u => innermost(u.x) === 'whole').length, MC.zeroNotWhole, '0 is a whole number: whole numbers are 0, 1, 2, 3, …']);
      alts.push([right + xs.filter(u => innermost(u.x) === 'integer').length, MC.wholeNeg, 'Whole numbers have no negatives: −3 is an integer but not whole.']);
    }
    if (target === 'integer' || target === 'whole' || target === 'counting') alts.push([right - xs.filter(u => u.tag === 'fracInt' && inT(u)).length, MC.fracNotInt, 'A fraction like 12/4 is 3: simplify, then classify by the value.']);
    if (target === 'integer') alts.push([right - xs.filter(u => u.tag === 'negSqrtSq').length, MC.minusRadical, 'A minus in front of a root is fine: −√49 = −7, an integer.']);
    if (target === 'irrational') {
      alts.push([xs.filter(u => /sqrt/.test(u.tex)).length, MC.radicalIrr, 'A root sign alone does not make a number irrational: √81 = 9, √0 = 0.']);
      alts.push([right + xs.filter(u => u.tag === 'bar').length, MC.repeatIrr, 'A repeating decimal is rational: 0.666… = 2/3.']);
    }
    if (target === 'rational') {
      alts.push([xs.filter(u => ['frac', 'dec', 'bar'].includes(u.tag)).length, MC.notNested, 'Every integer is rational too (−7 = −7/1): count every number whose smallest set is inside Rational.']);
      alts.push([right - xs.filter(u => u.tag === 'bar').length, MC.repeatIrr, 'A repeating decimal is rational: 0.666… = 2/3.']);
      alts.push([right - xs.filter(u => /sqrt/.test(u.tex) && inT(u)).length, MC.radicalIrr, 'Some roots are rational: √81 = 9, −√49 = −7, √0 = 0.']);
    }
    const names = xs.filter(inT).map(u => u.html);
    return numItem({
      id: `countMembers-${n}`, family: 'countMembers',
      prompt: `How many of these numbers are <b>${SET_LONG[target]}</b>?`, board: xs.map(u => u.tex).join(',\\ \\ '),
      picture: { map: { tokens: [], ring: target, reveal: { tokens: xs.map(tok) } } },
      solution: [`Find each number's value first (simplify, take the root), then its smallest set.`, `${cap(SET_LONG[target])}: ${names.join(', ')}. That is ${ans(right)}.`],
    }, right, v => {
      if (near(v, right)) return { ok: true, say: `Yes: ${names.join(', ')}.` };
      for (const [c, mc, say] of alts) if (c !== right && near(v, c)) return { ok: false, mc, say: `${say} The ${SET_LONG[target]} here: ${names.join(', ')} (${right}).` };
      return { ok: false, say: `Classify each by its value. The ${SET_LONG[target]} here: ${names.join(', ')} (${right}).` };
    });
  }
};

// ---------- allSets: every set a number belongs to ----------
const allSets: Gen = (R, n, sg) => {
  for (;;) {
    const tag = pick(R, sg === 'classify-rational-forms' ? ['fracInt', 'fracInt', 'neg', 'bar', 'dec', 'zero'] as const : sg === 'classify-radicals' ? ['sqrtSq', 'negSqrtSq', 'sqrt', 'sqrt0'] as const : ['int', 'neg', 'zero', 'fracInt', 'frac', 'sqrt'] as const);
    const u = numX(R, tag), s = innermost(u.x);
    const right = listH(setsList(s));
    const opts: Opt[] = [{ t: right, ok: true, say: `Yes: ${u.html} = ${rHtml(u.x)} sits in the ${SET_LONG[s]}, and so in every set around it.` }];
    if (s !== 'rational' && s !== 'irrational') opts.push({ t: cap(SET_LONG[s]) + ' only', mc: MC.notNested, say: `The sets are nested: ${SET_LONG[s]} are also ${setsList(s).slice(1).join(', ')}.` });
    else opts.push({ t: cap(SET_LONG[s]) + ' only', mc: MC.notNested, say: `Every ${s === 'rational' ? 'rational' : 'irrational'} number is a real number too.` });
    if (u.tag === 'fracInt' || u.tag === 'frac' || u.tag === 'dec') opts.push({ t: 'Rational numbers and real numbers', mc: u.tag === 'fracInt' ? MC.fracNotInt : undefined, say: u.tag === 'fracInt' ? `${u.html} = ${rHtml(u.x)}: with the fraction bar gone it is ${s === 'integer' ? 'an integer' : 'a whole number'}.` : 'Check the value again.' });
    if (u.tag === 'sqrtSq' || u.tag === 'negSqrtSq' || u.tag === 'sqrt0') opts.push({ t: 'Irrational numbers and real numbers', mc: MC.radicalIrr, say: `${u.html} = ${rHtml(u.x)}: the root of a perfect square is an integer.` });
    if (u.tag === 'negSqrtSq') opts.push({ t: 'None: it is not a real number', mc: MC.minusRadical, say: `The minus is outside the root: −${rootHtml(Math.abs(qVal(u.x.r)) ** 2)} = ${rHtml(u.x)}, a real integer.` });
    if (u.tag === 'sqrt') opts.push({ t: 'Irrational numbers, rational numbers and real numbers', mc: MC.misplaced, say: 'No number is both rational and irrational: the two regions do not overlap.' });
    if (u.tag === 'neg' || u.tag === 'zero') opts.push({ t: u.tag === 'neg' ? 'Whole numbers, integers, rational numbers and real numbers' : 'Integers, rational numbers and real numbers', mc: u.tag === 'neg' ? MC.wholeNeg : MC.zeroNotWhole, say: u.tag === 'neg' ? 'Whole numbers are 0, 1, 2, …: no negatives.' : '0 is a whole number too: whole numbers are 0, 1, 2, 3, …' });
    if (u.tag === 'bar') opts.push({ t: 'Irrational numbers and real numbers', mc: MC.repeatIrr, say: `${u.html} repeats forever, so it is a fraction: ${rHtml(u.x)}. Rational.` });
    const o = uniq(opts);
    if (o.length < 3) continue;
    return choiceItem(R, {
      id: `allSets-${n}`, family: 'allSets', prompt: `Which list names <b>every</b> set that <b>${u.html}</b> belongs to?`, board: u.tex,
      picture: { map: { tokens: [], reveal: { tokens: [tok(u)], ring: s } } },
      solution: [`Find the value: ${u.html} = ${rHtml(u.x)}. Its smallest set: the ${SET_LONG[s]}.`, `The sets are nested, so it is in all of these: ${right.toLowerCase()}.`],
    }, o.slice(0, 4));
  }
};

// ---------- subsetTrue: statements about nesting ----------
const subsetTrue: Gen = (R, n) => {
  const k = int(R, 2, 12), d = int(R, 2, 5);
  const trues: Opt[] = [
    { t: 'Every counting number is a whole number.', ok: true, say: 'Yes: 1, 2, 3, … are all in 0, 1, 2, 3, …' },
    { t: 'Every whole number is an integer.', ok: true, say: 'Yes: the integers are the whole numbers and their opposites.' },
    { t: 'Every integer is a rational number.', ok: true, say: `Yes: any integer n is n/1, a ratio of integers. ${H(-k)} = ${H(-k)}/1.` },
    { t: `${H(-k)} is rational, because ${H(-k)} = ${fr(H(-k), 1)}.`, ok: true, say: 'Yes: every integer can be written over 1.' },
  ];
  const falses: Opt[] = [
    { t: 'Every integer is a whole number.', mc: MC.wholeNeg, say: `${H(-k)} is an integer but not a whole number: whole numbers have no negatives.` },
    { t: `${H(-k)} is an integer, so it is not a rational number.`, mc: MC.notNested, say: `The sets are nested: ${H(-k)} = ${H(-k)}/1 is rational too.` },
    { t: `${fr(k * d, d)} is a fraction, so it is not an integer.`, mc: MC.fracNotInt, say: `${fr(k * d, d)} = ${k}: classify by the value, not by the fraction bar.` },
    { t: 'Every rational number is an integer.', say: `${fr(1, d)} is rational but not an integer.` },
    { t: 'Some whole numbers are not integers.', mc: MC.notNested, say: 'Every whole number is an integer: Whole sits inside Integers.' },
  ];
  const opts = [pick(R, trues), ...shuffle(R, falses).slice(0, 3)];
  return choiceItem(R, {
    id: `subsetTrue-${n}`, family: 'subsetTrue', prompt: `Which statement is <b>true</b>? Think of −${k} and ${fr(k * d, d)}.`, board: `-${k},\\ \\frac{${k * d}}{${d}},\\ \\frac{1}{${d}}`,
    picture: { map: { tokens: [] } },
    solution: ['The sets are nested: counting inside whole inside integers inside rational.'],
  }, opts);
};

// ---------- display: exact number vs its display ----------
const display: Gen = (R, n) => {
  const kind = pick(R, ['calcFrac', 'calcRoot', 'bar', 'grow', 'dots', 'calcUnknown'] as const);
  let prompt: string, board: string, right: 'Rational' | 'Irrational' | 'Cannot tell', why: string;
  const mcs: Partial<Record<'Rational' | 'Irrational' | 'Cannot tell', string>> = {};
  if (kind === 'calcFrac') {
    const [p, d] = pick(R, [[1, 3], [2, 3], [1, 7], [2, 7], [5, 7], [1, 9], [4, 9], [5, 11], [1, 6], [5, 6]] as const);
    const disp = (p / d).toFixed(7);
    prompt = `A calculator shows <b>${disp}</b> for ${fr(p, d)}. The display is full. Is the number ${fr(p, d)} rational or irrational?`; board = `\\frac{${p}}{${d}} \\to ${disp}`;
    right = 'Rational'; why = `${fr(p, d)} is a ratio of integers, so it is rational; the display is just cut off.`; mcs.Irrational = MC.calcDisplay;
  } else if (kind === 'calcRoot') {
    const m = pick(R, [2, 3, 5, 6, 7, 10, 11, 13]);
    const disp = Math.sqrt(m).toFixed(8);
    prompt = `A calculator shows <b>${disp}</b> for ${rootHtml(m)}. The display ends. Is ${rootHtml(m)} rational or irrational?`; board = `\\sqrt{${m}} \\to ${disp}`;
    right = 'Irrational'; why = `${m} is not a perfect square, so ${rootHtml(m)} is irrational. ${disp} is only a rounded display of it.`; mcs.Rational = MC.rounded;
  } else if (kind === 'bar') {
    const d = pick(R, ['27', '6', '18', '142857', '3', '09', '81']);
    prompt = `Is <b>0.<span class="bar">${d}</span></b> (the bar means the block ${d} repeats forever) rational or irrational?`; board = `0.\\overline{${d}}`;
    right = 'Rational'; why = 'A decimal that repeats a block forever is a fraction of integers: rational.'; mcs.Irrational = MC.repeatIrr;
  } else if (kind === 'grow') {
    const dg = pick(R, ['1', '2', '3', '5', '7']);
    const s = `0.${dg}0${dg}00${dg}000${dg}0000${dg}…`;
    prompt = `The decimal <b>${s}</b> goes on by a rule: after each ${dg}, one more 0 than last time. Rational or irrational?`; board = `${s.replace('…', '\\ldots')}`;
    right = 'Irrational'; why = 'The gaps of 0s keep growing, so no block ever repeats from some point on: the decimal never repeats, so it is irrational.'; mcs.Rational = MC.prefix;
  } else if (kind === 'dots') {
    const d = pick(R, ['27', '45', '12', '36', '81']);
    const s = `0.${d}${d}${d}…`;
    prompt = `Someone writes <b>${s}</b> with no bar and no rule for the digits that come next. Is the number rational or irrational?`; board = `${s.replace('…', '\\ldots')}`;
    right = 'Cannot tell'; why = 'Without a bar or a stated rule, "…" does not say what comes next. A few repeating digits are not a promise.'; mcs.Rational = MC.prefix;
  } else {
    const v = (int(R, 1, 9) + R()).toFixed(7);
    prompt = `A calculator shows <b>${v}</b>, a full display, for some number. With only this display, is that number rational or irrational?`; board = v;
    right = 'Cannot tell'; why = 'A full display could come from a fraction (like 1/7) or from a root like √7. The display alone cannot decide.'; mcs.Irrational = MC.calcDisplay; mcs.Rational = MC.rounded;
  }
  const opts: Opt[] = (['Rational', 'Irrational', 'Cannot tell'] as const).map(t => ({ t: t === 'Cannot tell' ? 'Cannot tell from this' : t, ok: t === right, mc: t === right ? undefined : mcs[t], say: t === right ? `Yes. ${why}` : why }));
  return choiceItem(R, { id: `display-${n}`, family: 'display', prompt, board, solution: [why] }, opts);
};

// ---------- approx: an exact number is not its approximation ----------
const approx: Gen = (R, n) => {
  const kind = pick(R, ['pi', 'root', 'third'] as const);
  let exactH: string, apxH: string, board: string, why: string;
  if (kind === 'pi') { const a = pick(R, [['22/7', fr(22, 7)], ['3.14', '3.14'], ['3.1416', '3.1416'], ['355/113', fr(355, 113)]] as const); exactH = 'π'; apxH = a[1]; board = `\\pi \\overset{?}{=} ${a[0].includes('/') ? `\\frac{${a[0].split('/')[0]}}{${a[0].split('/')[1]}}` : a[0]}`; why = `${apxH} is rational (a ratio of integers or a finite decimal) and π is irrational, so they cannot be equal: ${apxH} is only close to π.`; }
  else if (kind === 'root') { const m = pick(R, [2, 3, 5, 7, 10, 11]), dp = pick(R, [2, 3, 4]); const a = Math.sqrt(m).toFixed(dp); exactH = rootHtml(m); apxH = a; board = `\\sqrt{${m}} \\overset{?}{=} ${a}`; why = `${a} is a finite decimal, so it is rational; ${rootHtml(m)} is irrational. ${a}<sup>2</sup> = ${(Number(a) ** 2).toFixed(2 * dp)}, not ${m}.`; }
  else { const [p, d, s] = pick(R, [[1, 3, '0.333'], [2, 3, '0.667'], [1, 9, '0.111'], [1, 3, '0.33'], [5, 9, '0.556']] as const); exactH = fr(p, d); apxH = s; board = `\\frac{${p}}{${d}} \\overset{?}{=} ${s}`; why = `${s} = ${fr(s.slice(2), 10 ** (s.length - 2))} exactly, a different number. ${fr(p, d)} is a repeating decimal; ${s} is it rounded.`; }
  const opts: Opt[] = [
    { t: `No: ${apxH} is only an approximation of ${exactH}.`, ok: true, say: `Yes. ${why}` },
    { t: `Yes: ${apxH} is ${exactH} written another way.`, mc: MC.rounded, say: why },
    { t: `Yes, if you round to enough places.`, mc: MC.rounded, say: `Rounding never makes two different numbers equal. ${why}` },
  ];
  return choiceItem(R, { id: `approx-${n}`, family: 'approx', prompt: `Is <b>${exactH} = ${apxH}</b> exactly true?`, board, solution: [why] }, opts);
};

// ---------- placeIt: the smallest region on the map ----------
const REGION_LABEL: Record<SetId, string> = { counting: 'Counting', whole: 'Whole', integer: 'Integers', rational: 'Rational', irrational: 'Irrational' };
const placeIt: Gen = (R, n, sg) => {
  for (;;) {
    const tag = pick(R, sg === 'classify-radicals' ? ['sqrtSq', 'negSqrtSq', 'sqrt0', 'sqrt', 'sqrt'] as const : ['sqrt', 'pi', 'mixedIrr', 'bar', 'frac', 'sqrt'] as const);
    const u = numX(R, tag), s = innermost(u.x);
    const opts: Opt[] = [{ t: `In ${REGION_LABEL[s]}`, ok: true, say: `Yes: ${u.html} = ${rHtml(u.x)}, so its smallest region is ${REGION_LABEL[s]}.` }];
    if (s === 'irrational') {
      opts.push({ t: 'In Rational', mc: MC.misplaced, say: `${u.html} is irrational, and Irrational is a separate region beside Rational: no number is in both.` });
      opts.push({ t: 'Outside the map: it is not a real number', mc: MC.notReal, say: `Irrational numbers are real: ${u.html} has a place on the number line. It goes in Irrational, inside Real numbers.` });
    } else if (tag === 'bar') {
      opts.push({ t: 'In Irrational', mc: MC.repeatIrr, say: `${u.html} repeats forever, so it equals ${rHtml(u.x)}: rational.` });
      opts.push({ t: 'In Integers', say: `${u.html} = ${rHtml(u.x)} is between two integers.` });
    } else if (tag === 'frac') {
      opts.push({ t: 'In Irrational', say: `${u.html} is a ratio of integers: rational.` });
      opts.push({ t: 'In Integers', say: `${u.html} is not a whole step on the number line.` });
    } else {
      opts.push({ t: 'In Irrational', mc: MC.radicalIrr, say: `${u.html} = ${rHtml(u.x)}: the root of a perfect square is not irrational.` });
      if (u.tag === 'negSqrtSq') opts.push({ t: 'Outside the map: it is not a real number', mc: MC.minusRadical, say: `The minus is outside the root: ${u.html} = ${rHtml(u.x)}, a real number.` });
      else if (u.tag === 'sqrtSq') opts.push({ t: `In two places: it is ${rHtml(u.x)} and −${rHtml(u.x)}`, mc: MC.plusMinus, say: `The √ sign means the nonnegative root only: ${u.html} = ${rHtml(u.x)}.` });
      else opts.push({ t: 'In Counting', say: '√0 = 0, and counting starts at 1.' });
    }
    return choiceItem(R, {
      id: `placeIt-${n}`, family: 'placeIt', prompt: `Where does <b>${u.html}</b> go on the map: in which <b>smallest</b> region?`, board: u.tex,
      picture: { map: { tokens: [], reveal: { tokens: [tok(u)], ring: s } } },
      solution: [`Work out the exact value: ${u.html} = ${rHtml(u.x)}.`, `${s === 'irrational' ? 'It is not a ratio of integers' : 'Classify the value'}: its smallest region is ${REGION_LABEL[s]}.`],
    }, opts);
  }
};

// ---------- partitionTrue: rational or irrational, never both ----------
const partitionTrue: Gen = (R, n) => {
  const m = pick(R, [2, 3, 5, 6, 7, 8, 10, 11, 12, 13, 14, 15, 17, 18, 19]), r = rootHtml(m);
  const trues: Opt[] = [
    { t: 'Every real number is rational or irrational, never both.', ok: true, say: 'Yes: Rational and Irrational split the real numbers into two regions with no overlap.' },
    { t: `${r} is irrational and real.`, ok: true, say: `Yes: ${r} is not a ratio of integers, and it has a point on the number line.` },
  ];
  const falses: Opt[] = [
    { t: `${r} is irrational, so it is not a real number.`, mc: MC.notReal, say: `Irrational numbers are real: ${r} sits on the number line between ${Math.floor(Math.sqrt(m))} and ${Math.floor(Math.sqrt(m)) + 1}.` },
    { t: 'The irrational numbers are a part of the rational numbers.', mc: MC.misplaced, say: 'Irrational means NOT rational: the region sits beside Rational, not inside it.' },
    { t: `Some numbers, like ${r}, are both rational and irrational.`, mc: MC.misplaced, say: 'Irrational means "not rational": a number cannot be both.' },
    { t: `${rootHtml(m * m * 0 + (Math.floor(Math.sqrt(m)) + 1) ** 2)} is irrational because it has a root sign.`, mc: MC.radicalIrr, say: `${rootHtml((Math.floor(Math.sqrt(m)) + 1) ** 2)} = ${Math.floor(Math.sqrt(m)) + 1}: rational.` },
  ];
  const opts = [pick(R, trues), ...shuffle(R, falses).slice(0, 3)];
  return choiceItem(R, {
    id: `partitionTrue-${n}`, family: 'partitionTrue', prompt: `Which statement about ${r} is <b>true</b>?`, board: `\\sqrt{${m}}`,
    picture: { map: { tokens: [{ tex: `\\sqrt{${m}}`, at: 'irrational' }, { tex: String(Math.floor(Math.sqrt(m)) + 1), at: 'counting' }] } },
    solution: ['Real numbers split into two regions: Rational and Irrational, with no overlap.'],
  }, opts);
};

// ===================== closure =====================
// ---------- closedFinite: a small set and an operation ----------
const closedFinite: Gen = (R, n) => {
  for (;;) {
    const sets = [[0, 1], [-1, 0, 1], [-1, 1], [-1, 0], [0, 3], [0, 2], [1, 2], [1, 3], [0, 1, 2], [-2, 0, 2]];
    const S = pick(R, sets), op = pick(R, ['x', '+'] as const);
    const f = (a: number, b: number) => (op === 'x' ? a * b : a + b);
    const pairs = S.flatMap(a => S.map(b => [a, b] as const));
    const bad = pairs.find(([a, b]) => !S.includes(f(a, b)));
    const closed = !bad;
    const os = op === 'x' ? '×' : '+', sH = `{${S.map(H).join(', ')}}`;
    const out = Math.max(...S) + 2;
    const opts: Opt[] = closed ? [
      { t: `Closed: all ${pairs.length} ${op === 'x' ? 'products' : 'sums'} are in the set.`, ok: true, say: `Yes: the set is finite, so checking every pair is a proof. Each result is in ${sH}.` },
      { t: `Not closed: ${out} ${os} ${out} = ${f(out, out)} is not in the set.`, mc: MC.premise, say: `${out} is not in the set, so that pair is not allowed. Use only members: every result lands in ${sH}.` },
      { t: 'Cannot tell without checking infinitely many pairs.', say: `The set has only ${S.length} member${S.length === 1 ? '' : 's'}: all ${pairs.length} pairs can be checked, and all land inside.` },
    ] : [
      { t: `Not closed: ${H(bad[0])} ${os} ${parenH(H(bad[1]))} = ${H(f(bad[0], bad[1]))} is not in the set.`, ok: true, say: `Yes: one pair of members whose result leaves the set is enough.` },
      { t: `Closed: every ${op === 'x' ? 'product' : 'sum'} is some number.`, mc: MC.resultExists, say: `Closed means the result is IN the set, not just a number. ${H(bad[0])} ${os} ${parenH(H(bad[1]))} = ${H(f(bad[0], bad[1]))} is not in ${sH}.` },
      { t: `Closed: ${H(S[0]!)} ${os} ${parenH(H(S[0]!))} = ${H(f(S[0]!, S[0]!))} is in the set.`, mc: MC.examplesProof, say: `One pair landing inside is not enough. ${H(bad[0])} ${os} ${parenH(H(bad[1]))} = ${H(f(bad[0], bad[1]))} lands outside.` },
    ];
    if (!closed && S.includes(f(S[0]!, S[0]!)) === false) continue;
    if (new Set(opts.map(o => o.t)).size < 3) continue;
    return choiceItem(R, {
      id: `closedFinite-${n}`, family: 'closedFinite', prompt: `Is the set <b>${sH}</b> closed under <b>${op === 'x' ? 'multiplication' : 'addition'}</b>?`, board: `\\{${S.map(T).join(', ')}\\} \\text{ under } ${op === 'x' ? '\\times' : '+'}`,
      solution: closed ? [`Check every pair of members: ${pairs.map(([a, b]) => `${H(a)} ${os} ${parenH(H(b))} = ${H(f(a, b))}`).slice(0, 6).join('; ')}.`, 'All land in the set: closed.'] : [`${H(bad[0])} ${os} ${parenH(H(bad[1]))} = ${H(f(bad[0], bad[1]))}, which is not in ${sH}.`, 'Not closed.'],
    }, opts);
  }
};

// ---------- closedNamed: the named infinite sets ----------
interface ClosureCase { set: SetId; op: string; opH: string; closed: boolean; ex: { a: string; b: string; r: string; aAt: SetId; bAt: SetId; rAt: SetId; html: string }; reason: string }
function closureCase(R: () => number): ClosureCase {
  const a = int(R, 2, 9), b = int(R, a + 1, 15), m = pick(R, [2, 3, 5, 7]), c = int(R, 2, 9);
  const cases: ClosureCase[] = [
    { set: 'whole', op: '+', opH: 'addition', closed: true, ex: { a: String(a), b: String(b), r: String(a + b), aAt: 'counting', bAt: 'counting', rAt: 'counting', html: `${a} + ${b} = ${a + b}` }, reason: 'Adding two whole numbers counts on from a whole number: the result is whole.' },
    { set: 'whole', op: '-', opH: 'subtraction', closed: false, ex: { a: String(a), b: String(b), r: T(a - b), aAt: 'counting', bAt: 'counting', rAt: 'integer', html: `${a} − ${b} = ${H(a - b)}` }, reason: `${a} − ${b} = ${H(a - b)} is not a whole number.` },
    { set: 'integer', op: '\\times', opH: 'multiplication', closed: true, ex: { a: T(-a), b: String(c), r: T(-a * c), aAt: 'integer', bAt: 'counting', rAt: 'integer', html: `${H(-a)} × ${c} = ${H(-a * c)}` }, reason: 'A product of integers is an integer (repeated addition of integers, with a sign).' },
    { set: 'integer', op: '\\div', opH: 'division (by nonzero integers)', closed: false, ex: { a: String(a), b: String(b), r: QT(q(a, b)), aAt: 'counting', bAt: 'counting', rAt: innermost(RQ(q(a, b))), html: `${a} ÷ ${b} = ${QH(q(a, b))}` }, reason: `${a} ÷ ${b} = ${QH(q(a, b))} is not an integer.` },
    { set: 'integer', op: '-', opH: 'subtraction', closed: true, ex: { a: String(a), b: String(b), r: T(a - b), aAt: 'counting', bAt: 'counting', rAt: 'integer', html: `${a} − ${b} = ${H(a - b)}` }, reason: 'a − b = a + (−b): the opposite of an integer is an integer, and integers are closed under +.' },
    { set: 'irrational', op: '+', opH: 'addition', closed: false, ex: { a: `\\sqrt{${m}}`, b: `-\\sqrt{${m}}`, r: '0', aAt: 'irrational', bAt: 'irrational', rAt: 'whole', html: `${rootHtml(m)} + (−${rootHtml(m)}) = 0` }, reason: `${rootHtml(m)} + (−${rootHtml(m)}) = 0, and 0 is rational.` },
    { set: 'irrational', op: '\\times', opH: 'multiplication', closed: false, ex: { a: `\\sqrt{${m}}`, b: `\\sqrt{${m}}`, r: String(m), aAt: 'irrational', bAt: 'irrational', rAt: 'counting', html: `${rootHtml(m)} × ${rootHtml(m)} = ${m}` }, reason: `${rootHtml(m)} × ${rootHtml(m)} = ${m}, because ${rootHtml(m)} is the positive number whose square is ${m}. ${m} is rational.` },
    { set: 'rational', op: '+', opH: 'addition', closed: true, ex: { a: `\\frac{1}{${c}}`, b: `\\frac{${c - 1}}{${c + 1}}`, r: QT(qAdd(q(1, c), q(c - 1, c + 1))), aAt: 'rational', bAt: 'rational', rAt: innermost(RQ(qAdd(q(1, c), q(c - 1, c + 1)))), html: `${fr(1, c)} + ${fr(c - 1, c + 1)} = ${QH(qAdd(q(1, c), q(c - 1, c + 1)))}` }, reason: 'a/b + c/d = (ad + bc)/(bd): integers over a nonzero integer, so rational.' },
    { set: 'counting', op: '-', opH: 'subtraction', closed: false, ex: { a: String(a), b: String(a), r: '0', aAt: 'counting', bAt: 'counting', rAt: 'whole', html: `${a} − ${a} = 0` }, reason: `${a} − ${a} = 0, and 0 is not a counting number.` },
  ];
  return pick(R, cases);
}
const closedNamed: Gen = (R, n) => {
  for (;;) {
    const C = closureCase(R);
    if (C.ex.a === C.ex.b && C.set !== 'counting' && C.set !== 'irrational') continue;
    const opts: Opt[] = C.closed ? [
      { t: `Yes: ${C.reason}`, ok: true, say: 'Yes. A closure claim needs a reason that covers every pair, like this one.' },
      { t: `No: ${C.set === 'whole' ? '−2 + 1 = −1' : C.set === 'integer' ? (C.op === '-' ? `${fr(1, 2)} − 3 = −${fr(5, 2)}` : `${fr(1, 2)} × 3 = ${fr(3, 2)}`) : `${rootHtml(2)} + 1 = 1 + ${rootHtml(2)}`} is not in the set.`, mc: MC.premise, say: `That pair uses a number that is not in the set. A counterexample must start with two members.` },
      { t: `Not sure: we can only check a few pairs.`, mc: MC.examplesProof, say: `A general reason covers every pair at once: ${C.reason}` },
    ] : [
      { t: `No: ${C.ex.html}`, ok: true, say: `Yes: both inputs are ${SET_LONG[C.set]}, and the result is not.` },
      { t: `Yes: the ${C.opH.split(' ')[0]} of two ${SET_LONG[C.set]} is always a number.`, mc: MC.resultExists, say: `Closed means the answer is in the SAME set. ${C.reason}` },
      { t: 'Yes: every pair I tried landed inside.', mc: MC.examplesProof, say: `A few pairs that work do not prove it. ${C.reason}` },
    ];
    const tokens: MapTok[] = [{ tex: C.ex.a, at: C.ex.aAt }, ...(C.ex.a === C.ex.b ? [] : [{ tex: C.ex.b, at: C.ex.bAt }]), { tex: C.ex.r, at: C.ex.rAt }];
    const ri = tokens.length - 1;
    return choiceItem(R, {
      id: `closedNamed-${n}`, family: 'closedNamed', prompt: `Are the <b>${SET_LONG[C.set]}</b> closed under <b>${C.opH}</b>?`, board: `${C.ex.a} ${C.op} ${C.ex.b.startsWith('-') ? `(${C.ex.b})` : C.ex.b}`,
      picture: { map: { tokens: [], ring: C.set, reveal: { tokens, arrows: tokens.slice(0, -1).map((_, i) => [i, ri] as [number, number]), ring: C.set, bad: !C.closed } } },
      solution: [C.closed ? `${C.reason} So: closed.` : `${C.ex.html}: both inputs are ${SET_LONG[C.set]}, the result is not. Not closed.`],
    }, opts);
  }
};

// ---------- counterPick: pick a valid counterexample ----------
const counterPick: Gen = (R, n, sg) => {
  const m = pick(R, [2, 3, 5, 7, 11]), m2 = pick(R, [3, 5, 6, 7, 10].filter(x => x !== m)), a = int(R, 1, 9), b = int(R, a + 1, 10), k = int(R, 2, 9);
  type CP = { claim: string; set: SetId; good: [string, string, string, SetId, SetId, SetId, string]; opts: Opt[] };
  const irr = sg === 'irrational-closure-counterexample', adm = sg === 'admissibility-check';
  const pool: CP[] = [];
  if (!irr) {
    pool.push({ claim: 'The whole numbers are closed under subtraction.', set: 'whole', good: [String(a), String(b), T(a - b), 'counting', 'counting', 'integer', `${a} − ${b} = ${H(a - b)}`], opts: [
      { t: `${a} − ${b} = ${H(a - b)}`, ok: true, say: `Yes: ${a} and ${b} are whole, ${H(a - b)} is not.` },
      { t: `${b} − ${a} = ${b - a}`, say: `${b - a} is a whole number: this pair stays inside, so it disproves nothing.` },
      { t: `−${a} − ${b} = ${H(-a - b)}`, mc: MC.premise, say: `−${a} is not a whole number, so the claim says nothing about this pair. Start with two whole numbers.` },
    ] });
    const bb = pick(R, [2, 3, 4, 5].filter(x => k % x !== 0));
    pool.push({ claim: 'The integers are closed under division by nonzero integers.', set: 'integer', good: [String(k), String(bb), QT(q(k, bb)), 'counting', 'counting', 'rational', `${k} ÷ ${bb} = ${QH(q(k, bb))}`], opts: [
      { t: `${k} ÷ ${bb} = ${QH(q(k, bb))}`, ok: true, say: `Yes: ${k} and ${bb} are integers (${bb} ≠ 0), and ${QH(q(k, bb))} is not an integer.` },
      { t: `${k * bb} ÷ ${bb} = ${k}`, say: `${k} is an integer: this pair stays inside.` },
      { t: `${k} ÷ 0 has no value`, mc: MC.premise, say: 'The claim only talks about NONZERO divisors, so 0 is not allowed. Find two allowed integers whose quotient is not an integer.' },
    ] });
  }
  if (irr || adm) {
    pool.push({ claim: 'The irrational numbers are closed under addition.', set: 'irrational', good: [`\\sqrt{${m}}`, `-\\sqrt{${m}}`, '0', 'irrational', 'irrational', 'whole', `${rootHtml(m)} + (−${rootHtml(m)}) = 0`], opts: [
      { t: `${rootHtml(m)} + (−${rootHtml(m)}) = 0`, ok: true, say: `Yes: both are irrational, and their sum 0 is rational (opposites add to 0).` },
      { t: `${rootHtml(m)} + ${rootHtml(m2)}`, say: `That sum is irrational: it stays inside, so it disproves nothing.` },
      { t: `0 + ${rootHtml(m)} = ${rootHtml(m)}`, mc: MC.premise, say: '0 is rational, not irrational: the claim says nothing about this pair.' },
    ] });
    pool.push({ claim: 'The irrational numbers are closed under multiplication.', set: 'irrational', good: [`\\sqrt{${m}}`, `\\sqrt{${m}}`, String(m), 'irrational', 'irrational', 'counting', `${rootHtml(m)} × ${rootHtml(m)} = ${m}`], opts: [
      { t: `${rootHtml(m)} × ${rootHtml(m)} = ${m}`, ok: true, say: `Yes: ${rootHtml(m)} is the positive number whose square is ${m}, so ${rootHtml(m)} × ${rootHtml(m)} = ${m}, a rational number.` },
      { t: `π × π = π<sup>2</sup>`, say: 'π² is irrational: it stays inside, so it disproves nothing.' },
      { t: `0 × ${rootHtml(m)} = 0`, mc: MC.premise, say: '0 is not irrational, so this pair is not allowed by the claim.' },
    ] });
    pool.push({ claim: 'A rational number times an irrational number is always irrational.', set: 'irrational', good: ['0', `\\sqrt{${m}}`, '0', 'whole', 'irrational', 'whole', `0 × ${rootHtml(m)} = 0`], opts: [
      { t: `0 × ${rootHtml(m)} = 0`, ok: true, say: `Yes: 0 is rational and ${rootHtml(m)} is irrational, and the product 0 is rational. (That is why the true theorem says NONZERO rational.)` },
      { t: `${k} × ${rootHtml(m)} = ${k}${rootHtml(m)}`, say: `${k}${rootHtml(m)} is irrational: no help.` },
      { t: `${rootHtml(m)} × ${rootHtml(m)} = ${m}`, mc: MC.premise, say: `${rootHtml(m)} is not rational, so this pair is not "rational times irrational".` },
    ] });
  }
  const C = pick(R, pool);
  const [ga, gb, gr, aAt, bAt, rAt] = C.good;
  const tokens: MapTok[] = ga === gb ? [{ tex: ga, at: aAt }, { tex: gr, at: rAt }] : [{ tex: ga, at: aAt }, { tex: gb, at: bAt }, { tex: gr, at: rAt }];
  const ri = tokens.length - 1;
  return choiceItem(R, {
    id: `counterPick-${n}`, family: 'counterPick', prompt: `Claim: <b>${C.claim}</b> Which is a valid counterexample?`, board: `${C.good[0]},\\ \\ ${C.good[1]}`,
    picture: { map: { tokens: [], ring: C.set, reveal: { tokens, arrows: tokens.slice(0, -1).map((_, i) => [i, ri] as [number, number]), ring: C.set, bad: true } } },
    solution: ['A counterexample: inputs that the claim allows, and a result outside the set.', `${C.good[6]}.`],
  }, C.opts);
};

// ---------- counterType: type an input that breaks closure ----------
const counterType: Gen = (R, n) => {
  if (R() < 0.5) {
    const a = pick(R, [6, 8, 9, 10, 12, 15, 18, 20]);
    let w = 2; while (a % w === 0) w++;
    return numItem({
      id: `counterType-${n}`, family: 'counterType',
      prompt: `Claim: the integers are closed under division by nonzero integers. Type an <b>integer</b> ${V('b')} so that <b>${a} ÷ ${V('b')}</b> is not an integer.`, board: `${a} \\div b \\notin \\text{Integers}`,
      solution: [`${V('b')} must be a nonzero integer that does not divide ${a}: for example ${V('b')} = ${ans(w)}.`, `${a} ÷ ${w} = ${QH(q(a, w))}, not an integer: a counterexample.`],
    }, w, v => !Number.isInteger(v) ? { ok: false, mc: MC.premise, say: `${fmt(v)} is not an integer, so the claim does not cover it. Use an integer, like ${w}.` }
      : v === 0 ? { ok: false, mc: MC.divZero, say: `${a} ÷ 0 has no value, and the claim excludes 0 anyway. Try ${w}: ${a} ÷ ${w} = ${QH(q(a, w))}.` }
        : a % v === 0 ? { ok: false, say: `${a} ÷ ${fmt(v)} = ${a / v}, an integer. Pick a divisor that does not go evenly, like ${w}.` }
          : { ok: true, say: `Yes: ${a} ÷ ${fmt(v)} = ${QH(q(a, v))}, not an integer. One counterexample settles it.` });
  }
  const a = int(R, 2, 12), w = a + 1;
  return numItem({
    id: `counterType-${n}`, family: 'counterType',
    prompt: `Claim: the whole numbers are closed under subtraction. Type a <b>whole number</b> ${V('b')} so that <b>${a} − ${V('b')}</b> is not a whole number.`, board: `${a} - b \\notin \\text{Whole}`,
    solution: [`${V('b')} must be a whole number bigger than ${a}: for example ${V('b')} = ${ans(w)}.`, `${a} − ${w} = −1, not a whole number: a counterexample.`],
  }, w, v => !Number.isInteger(v) || v < 0 ? { ok: false, mc: MC.premise, say: `${fmt(v)} is not a whole number, so the claim does not cover it. Whole numbers are 0, 1, 2, …` }
    : v <= a ? { ok: false, say: `${a} − ${fmt(v)} = ${a - v}, a whole number. Take away more than ${a}.` }
      : { ok: true, say: `Yes: ${a} − ${fmt(v)} = ${H(a - v)}, not whole.` });
};

// ---------- admissible: is the offered counterexample allowed? ----------
const admissible: Gen = (R, n) => {
  const m = pick(R, [2, 3, 5, 7]), k = int(R, 2, 9), a = int(R, 2, 8), b = int(R, a + 1, 12);
  const kind = pick(R, ['zeroTimes', 'divZero', 'negWhole', 'zeroIrr', 'valid'] as const);
  let claim: string, offer: string, right: string, opts: Opt[];
  if (kind === 'zeroTimes') {
    claim = 'A nonzero rational number times an irrational number is irrational.'; offer = `0 × ${rootHtml(m)} = 0, which is rational.`; right = 'No: 0 is not a nonzero rational, so the claim does not cover it.';
    opts = [{ t: right, ok: true, say: 'Yes. The claim says NONZERO: 0 breaks the premise, not the claim.' }, { t: 'Yes: 0 is rational, and the product is rational.', mc: MC.premise, say: 'The claim only covers nonzero rationals. 0 is excluded, so 0 × √ is no counterexample.' }, { t: 'Yes: one counterexample is always enough.', mc: MC.premise, say: 'One VALID counterexample is enough. This one breaks the claim\'s own condition (nonzero).' }];
  } else if (kind === 'divZero') {
    claim = 'The integers are closed under division by nonzero integers.'; offer = `${k} ÷ 0 has no value, so it is not an integer.`; right = 'No: the claim excludes 0 as a divisor.';
    opts = [{ t: right, ok: true, say: `Yes. A valid counterexample here is ${k} ÷ ${k + 1} = ${fr(k, k + 1)}.` }, { t: 'Yes: there is no integer answer.', mc: MC.premise, say: 'Division by 0 is excluded by the claim, so this pair does not count.' }, { t: `Yes: ${k} ÷ 0 = 0, and the claim fails anyway.`, mc: MC.divZero, say: `${k} ÷ 0 is not 0: no number times 0 gives ${k}. And 0 is excluded by the claim.` }];
  } else if (kind === 'negWhole') {
    claim = 'The whole numbers are closed under subtraction.'; offer = `−${a} − ${b} = −${a + b}, not a whole number.`; right = `No: −${a} is not a whole number.`;
    opts = [{ t: right, ok: true, say: `Yes. Use two whole numbers: ${a} − ${b} = ${H(a - b)} is a valid counterexample.` }, { t: `Yes: −${a + b} is not whole.`, mc: MC.premise, say: `The inputs must be whole numbers too. −${a} is not.` }, { t: 'No: subtraction of whole numbers is always whole.', say: `That part is false: ${a} − ${b} = ${H(a - b)}. But this offer starts with −${a}.` }];
  } else if (kind === 'zeroIrr') {
    claim = 'The irrational numbers are closed under multiplication.'; offer = `0 × ${rootHtml(m)} = 0, which is rational.`; right = '0 is not irrational, so this pair does not count.';
    opts = [{ t: right, ok: true, say: `Yes. A valid one: ${rootHtml(m)} × ${rootHtml(m)} = ${m}.` }, { t: 'It counts: the product is rational.', mc: MC.premise, say: 'Both inputs must be irrational. 0 is rational.' }, { t: 'It counts: any example with a root sign works.', mc: MC.premise, say: 'The pair must meet the claim: two irrational numbers. 0 is not one.' }];
  } else {
    claim = 'The whole numbers are closed under subtraction.'; offer = `${a} − ${b} = ${H(a - b)}, not a whole number.`; right = `Yes: ${a} and ${b} are whole, and ${H(a - b)} is not.`;
    opts = [{ t: right, ok: true, say: 'Yes: the inputs meet the claim and the result leaves the set.' }, { t: `No: you cannot take ${b} from ${a}.`, say: `You can: ${a} − ${b} = ${H(a - b)}. It is just not a whole number.` }, { t: 'No: one example cannot disprove a claim.', mc: MC.exception, say: 'One valid counterexample is enough to disprove an "always" claim.' }];
  }
  return choiceItem(R, {
    id: `admissible-${n}`, family: 'admissible', prompt: `Claim: <b>${claim}</b><br>Ana offers a counterexample: ${offer} Does it count?`, board: '\\text{inputs allowed?} \\ \\to\\ \\text{result outside?}',
    solution: ['A counterexample must meet every condition of the claim, then break its conclusion.', `${offer.split(',')[0]}: ${right}`],
  }, opts);
};

// ---------- irrValue: exact results of irrational inputs ----------
const irrValue: Gen = (R, n) => {
  const m = pick(R, [2, 3, 5, 6, 7, 10, 11, 13, 15, 17, 19]), k = int(R, 1, 9);
  const kind = pick(R, ['times', 'square', 'cancel', 'oppSum'] as const);
  const r = rootHtml(m);
  let prompt: string, board: string, v: number, sol: string[], toks: MapTok[];
  if (kind === 'times') { prompt = `Work out exactly: <b>${r} × ${r}</b>`; board = `\\sqrt{${m}} \\times \\sqrt{${m}}`; v = m; sol = [`${r} is the positive number whose square is ${m}.`, `So ${r} × ${r} = ${ans(m)}: two irrational numbers, a rational product.`]; toks = [{ tex: `\\sqrt{${m}}`, at: 'irrational' }, { tex: String(m), at: 'counting' }]; }
  else if (kind === 'square') { prompt = `Work out exactly: <b>(−${r})<sup>2</sup></b>`; board = `(-\\sqrt{${m}})^2`; v = m; sol = [`(−${r})<sup>2</sup> = (−${r}) × (−${r}) = ${r} × ${r}.`, `${r} × ${r} = ${ans(m)}.`]; toks = [{ tex: `-\\sqrt{${m}}`, at: 'irrational' }, { tex: String(m), at: 'counting' }]; }
  else if (kind === 'cancel') { prompt = `Work out exactly: <b>(${k} + ${r}) + (−${r})</b>`; board = `(${k} + \\sqrt{${m}}) + (-\\sqrt{${m}})`; v = k; sol = [`Regroup: ${k} + (${r} + (−${r})).`, `${r} + (−${r}) = 0, so the sum is ${ans(k)}.`]; toks = [{ tex: `${k} + \\sqrt{${m}}`, at: 'irrational' }, { tex: `-\\sqrt{${m}}`, at: 'irrational' }, { tex: String(k), at: 'counting' }]; }
  else { prompt = `Work out exactly: <b>${r} + (−${r})</b>`; board = `\\sqrt{${m}} + (-\\sqrt{${m}})`; v = 0; sol = [`${r} and −${r} are opposites.`, `Opposites add to ${ans(0)}.`]; toks = [{ tex: `\\sqrt{${m}}`, at: 'irrational' }, { tex: `-\\sqrt{${m}}`, at: 'irrational' }, { tex: '0', at: 'whole' }]; }
  const ri = toks.length - 1;
  return numItem({
    id: `irrValue-${n}`, family: 'irrValue', prompt: prompt + ' (no calculator: use what √ means)', board,
    picture: { map: { tokens: toks.slice(0, -1), ring: 'irrational', reveal: { tokens: [toks[ri]!], arrows: toks.slice(0, -1).map((_, i) => [i, ri] as [number, number]), ring: 'irrational', bad: true } } },
    solution: sol,
  }, v, w => near(w, v) ? { ok: true, say: `Yes: ${v}, a rational number from irrational inputs. So the irrationals are not closed.` }
    : kind !== 'cancel' && kind !== 'oppSum' && near(w, m * m) ? { ok: false, say: `${r} × ${r} is not ${m}<sup>2</sup>: ${r} is the number whose square is ${m}, so ${r} × ${r} = ${m}.` }
      : kind === 'square' && near(w, -m) ? { ok: false, say: `A negative times a negative is positive: (−${r})<sup>2</sup> = ${m}.` }
        : { ok: false, say: `Exactly: ${v}.` });
};

// ---------- sumForm: (ad + bc)/(bd) with integers ----------
const sumForm: Gen = (R, n) => {
  for (;;) {
    const a = int(R, 1, 7) * (R() < 0.3 ? -1 : 1), b = int(R, 2, 9), c = int(R, 1, 7), d = int(R, 2, 9);
    if (b === d) continue;
    const prod = R() < 0.4;
    const N = prod ? a * c : a * d + b * c, D = b * d;
    const val = q(N, D);
    if (val[1] === 1) continue;
    const aH = H(a);
    const lhsH = `${prod ? `${fr(aH, b)} × ${fr(c, d)}` : `${fr(aH, b)} + ${fr(c, d)}`}`;
    return {
      id: `sumForm-${n}`, family: 'sumForm', input: 'pair',
      prompt: `Rationals are closed under ${prod ? 'multiplication' : 'addition'}: ${prod ? `${fr(V('a'), V('b'))} · ${fr(V('c'), V('d'))} = ${fr(`${V('a')}${V('c')}`, `${V('b')}${V('d')}`)}` : `${fr(V('a'), V('b'))} + ${fr(V('c'), V('d'))} = ${fr(`${V('a')}${V('d')} + ${V('b')}${V('c')}`, `${V('b')}${V('d')}`)}`}. Use the rule on <b>${lhsH}</b>: what are the new numerator and denominator (before simplifying)?`,
      board: `${prod ? `\\frac{${T(a)}}{${b}} \\cdot \\frac{${c}}{${d}}` : `\\frac{${T(a)}}{${b}} + \\frac{${c}}{${d}}`} = \\frac{\\square}{\\square}`,
      pairLead: 'numerator', pairOp: '&nbsp; denominator', unit: '',
      picture: { map: { tokens: [{ tex: `${a < 0 ? '-' : ''}\\frac{${Math.abs(a)}}{${b}}`, at: 'rational' }, { tex: `\\frac{${c}}{${d}}`, at: 'rational' }], ring: 'rational', reveal: { tokens: [{ tex: QT(val), at: 'rational' }], arrows: [[0, 2], [1, 2]], ring: 'rational' } } },
      solution: prod ? [`Numerator: ${aH} × ${c} = ${ans(H(N))}. Denominator: ${b} × ${d} = ${ans(D)}.`, `Integers over a nonzero integer: the product is rational.`]
        : [`Numerator: ${aH} × ${d} + ${b} × ${c} = ${ans(H(N))}. Denominator: ${b} × ${d} = ${ans(D)}.`, `Integers over a nonzero integer (${b} × ${d} ≠ 0): the sum is rational.`],
      answer: { kind: 'pair', x: N, y: D },
      check: r => {
        if (r.kind !== 'pair') return { ok: false, say: 'Fill in both boxes.' };
        if (r.x === N && r.y === D) return { ok: true, say: `Yes: ${fr(H(N), D)}, an integer over a nonzero integer. Rational.` };
        if (Number.isInteger(r.x) && Number.isInteger(r.y) && r.y !== 0 && near(r.x / r.y, N / D)) return { ok: true, say: `Yes, that is the same number (${fr(H(N), D)} simplified). Still integers over a nonzero integer.` };
        if (!prod && r.x === a + c && r.y === b + d) return { ok: false, say: `Fractions do not add top + top over bottom + bottom. Use the rule: ${aH} · ${d} + ${b} · ${c} = ${H(N)} over ${D}.` };
        return { ok: false, say: `Use the rule: numerator ${H(N)}, denominator ${D}.` };
      },
    };
  }
};

// ---------- whyRational: what proves closure of the rationals? ----------
const whyRational: Gen = (R, n) => {
  const p = int(R, 1, 6), d = int(R, 2, 9), m = pick(R, [2, 3, 5, 7]);
  if (R() < 0.6) {
    const prod = R() < 0.4, opn = prod ? 'product' : 'sum';
    const opts: Opt[] = [
      { t: `Write them as ${fr(V('a'), V('b'))} and ${fr(V('c'), V('d'))} with integers and ${V('b')}, ${V('d')} ≠ 0. The ${opn} is ${prod ? fr(`${V('a')}${V('c')}`, `${V('b')}${V('d')}`) : fr(`${V('a')}${V('d')} + ${V('b')}${V('c')}`, `${V('b')}${V('d')}`)}: integers over a nonzero integer.`, ok: true, say: 'Yes: the letters stand for EVERY pair of rationals, so this covers all of them at once.' },
      { t: `${fr(p, d)} ${prod ? '×' : '+'} ${fr(1, 2)}, ${fr(2, 3)} ${prod ? '×' : '+'} ${fr(3, 4)} and ${p} ${prod ? '×' : '+'} ${fr(1, 5)} all came out as fractions.`, mc: MC.examplesProof, say: 'Three examples cannot cover infinitely many pairs. The letter argument does.' },
      { t: `The ${opn} can always be written with a fraction bar, so it is rational.`, mc: MC.fracDisplay, say: `A fraction bar is not enough: ${fr(rootHtml(m), 1)} has a bar and is irrational. It must be INTEGERS over a nonzero integer.` },
    ];
    return choiceItem(R, {
      id: `whyRational-${n}`, family: 'whyRational', prompt: `Which argument shows that the <b>${opn} of any two rational numbers</b> is rational?`, board: `${prod ? '\\frac{a}{b} \\cdot \\frac{c}{d}' : '\\frac{a}{b} + \\frac{c}{d}'} \\quad \\text{e.g. } \\frac{${p}}{${d}}`,
      solution: ['A proof must cover every pair: use letters for the integers.', `${prod ? 'ac and bd' : 'ad + bc and bd'} are integers (integers are closed under + and ×), and bd ≠ 0 because b ≠ 0 and d ≠ 0.`],
    }, opts);
  }
  const opts: Opt[] = [
    { t: `No: ${rootHtml(m)} is not an integer, so ${fr(rootHtml(m), 1)} is not a ratio of integers.`, ok: true, say: `Yes. Rational means equal to integer / nonzero integer. ${rootHtml(m)} is irrational, with or without the bar.` },
    { t: 'Yes: it is written as a fraction.', mc: MC.fracDisplay, say: `The top must be an integer. ${rootHtml(m)} is not, so the fraction bar does not make it rational.` },
    { t: 'Yes: any number divided by 1 is an integer.', say: `${rootHtml(m)} ÷ 1 = ${rootHtml(m)}, still irrational.` },
  ];
  return choiceItem(R, {
    id: `whyRational-${n}`, family: 'whyRational', prompt: `Pat says <b>${fr(rootHtml(m), 1)}</b> is rational, because it is a fraction. Is Pat right?`, board: `\\frac{\\sqrt{${m}}}{1}`,
    solution: ['Rational = a ratio of INTEGERS with a nonzero bottom.', `${rootHtml(m)} is not an integer.`],
  }, opts);
};

// ---------- contradiction: rational ± irrational, nonzero rational × irrational ----------
const contradiction: Gen = (R, n) => {
  const k = int(R, 2, 9), m = pick(R, [2, 3, 5, 6, 7, 10]), r = rootHtml(m);
  const kind = pick(R, ['plus', 'minus', 'times'] as const);
  let sup: string, iso: string, board: string, opts: Opt[];
  if (kind === 'plus') {
    sup = `${k} + ${r} = ${V('q')}`; iso = `${r} = ${V('q')} − ${k}`; board = `\\text{Suppose } ${k} + \\sqrt{${m}} = q`;
    opts = [
      { t: `Then ${iso}, which is rational (rationals are closed under −). But ${r} is irrational: the supposition is false.`, ok: true, say: 'Yes: the supposition leads to a contradiction, so it is false: the sum is irrational.' },
      { t: `So ${k} + ${r} is rational, because we said so.`, mc: MC.assumption, say: 'The supposition is not a fact: it is what we test. It leads to a contradiction, so it is false.' },
      { t: `It could be true for a well-chosen ${V('q')}.`, mc: MC.ratPlusIrr, say: `No rational ${V('q')} works: any ${V('q')} would make ${r} = ${V('q')} − ${k} rational.` },
    ];
  } else if (kind === 'minus') {
    sup = `${k} − ${r} = ${V('q')}`; iso = `${r} = ${k} − ${V('q')}`; board = `\\text{Suppose } ${k} - \\sqrt{${m}} = q`;
    opts = [
      { t: `Then ${iso}, which is rational. But ${r} is irrational: the supposition is false.`, ok: true, say: 'Yes: a contradiction, so the supposition fails and the difference is irrational.' },
      { t: `So ${k} − ${r} is rational, as we supposed.`, mc: MC.assumption, say: 'A supposition is only tested, not asserted. Here it leads to a contradiction.' },
      { t: `Some rational ${V('q')} might work, so we cannot know.`, mc: MC.ratPlusIrr, say: `Every rational ${V('q')} would make ${r} = ${k} − ${V('q')} rational: impossible.` },
    ];
  } else {
    sup = `${k}${r} = ${V('q')}`; iso = `${r} = ${fr(V('q'), k)}`; board = `\\text{Suppose } ${k}\\sqrt{${m}} = q`;
    opts = [
      { t: `Then ${iso}, which is rational (${k} ≠ 0). But ${r} is irrational: the supposition is false.`, ok: true, say: `Yes. The step divides by ${k}, which is allowed because ${k} ≠ 0.` },
      { t: `Then ${iso}; the same argument works for 0 · ${r} too.`, mc: MC.nonzeroDiv, say: `The argument divides by the rational factor, so it needs it to be nonzero. 0 · ${r} = 0 is rational.` },
      { t: `So ${k}${r} is rational, because we supposed it.`, mc: MC.assumption, say: 'The supposition is what we test: it leads to a contradiction, so it is false.' },
    ];
  }
  return choiceItem(R, {
    id: `contradiction-${n}`, family: 'contradiction', prompt: `To show <b>${kind === 'times' ? `${k}${r}` : kind === 'plus' ? `${k} + ${r}` : `${k} − ${r}`}</b> is irrational, suppose the opposite: <b>${sup}</b> for some rational ${V('q')}. What comes next?`, board,
    solution: [`Undo the ${kind === 'times' ? `× ${k}` : kind === 'plus' ? `+ ${k}` : `${k} −`}: ${iso}.`, `That would make ${r} rational: a contradiction. So the number is irrational.`],
  }, opts);
};

// ---------- isIrrational: which is irrational? ----------
const isIrrational: Gen = (R, n) => {
  for (;;) {
    const k = int(R, 2, 9), m = pick(R, [2, 3, 5, 6, 7, 10, 11]), j = int(R, 2, 9), r = rootHtml(m);
    const irr: Opt[] = [
      { t: `${k} + ${r}`, ok: true, say: 'Yes: rational + irrational is always irrational.' },
      { t: `${k}${r}`, ok: true, say: 'Yes: a nonzero rational times an irrational is irrational.' },
      { t: fr('π', k), ok: true, say: `Yes: π times the nonzero rational ${fr(1, k)} is irrational.` },
      { t: `${k} − ${r}`, ok: true, say: 'Yes: rational − irrational is irrational.' },
    ];
    const rat: Opt[] = [
      { t: `0 · ${r}`, mc: MC.nonzeroDiv, say: `0 · ${r} = 0: rational. "Rational × irrational is irrational" needs the rational to be NONZERO.` },
      { t: `${r} − ${r}`, say: `${r} − ${r} = 0: rational.` },
      { t: rootHtml(j * j), mc: MC.radicalIrr, say: `${rootHtml(j * j)} = ${j}: rational, even with the root sign.` },
      { t: `(${r})<sup>2</sup>`, mc: MC.radicalIrr, say: `(${r})<sup>2</sup> = ${m}: rational.` },
      { t: `(${k} + ${r}) − ${r}`, mc: MC.ratPlusIrr, say: `(${k} + ${r}) − ${r} = ${k}: the irrational parts cancel. Rational.` },
    ];
    const opts = [pick(R, irr), ...shuffle(R, rat).slice(0, 3)];
    return choiceItem(R, {
      id: `isIrrational-${n}`, family: 'isIrrational', prompt: `Which number is <b>irrational</b>? (${r} is irrational.)`, board: `\\sqrt{${m}},\\ ${k},\\ ${j}`,
      solution: ['Work each one out: roots of perfect squares, opposites that cancel, and 0 times anything give rational numbers.', 'Rational ± irrational, and a nonzero rational times an irrational, are irrational.'],
    }, opts);
  }
};

void neg; void mul; void rTex;

export const FAMILIES: readonly { id: string; name: string; gen: Gen }[] = [
  { id: 'commName', name: 'Name the property', gen: commName },
  { id: 'commSwap', name: 'Swap the order', gen: commSwap },
  { id: 'assocPair', name: 'Move the parentheses', gen: assocPair },
  { id: 'identityPick', name: 'The identity property', gen: identityPick },
  { id: 'identityFill', name: 'The number that changes nothing', gen: identityFill },
  { id: 'opposite', name: 'The opposite', gen: opposite },
  { id: 'toZero', name: 'Add to zero', gen: toZero },
  { id: 'reciprocal', name: 'The reciprocal', gen: reciprocal },
  { id: 'recipNum', name: 'Reciprocal of a decimal', gen: recipNum },
  { id: 'zeroRecip', name: 'Zero and reciprocals', gen: zeroRecip },
  { id: 'distArea', name: 'Distribute in your head', gen: distArea },
  { id: 'distForm', name: 'Expand or factor', gen: distForm },
  { id: 'smartGroup', name: 'Regroup a sum', gen: smartGroup },
  { id: 'chainProduct', name: 'Friendly pairs first', gen: chainProduct },
  { id: 'cancelChain', name: 'Inverse pairs', gen: cancelChain },
  { id: 'cancelWhich', name: 'Which pair cancels?', gen: cancelWhich },
  { id: 'nameStep', name: 'Justify the step', gen: nameStep },
  { id: 'whichStep', name: 'Find the step', gen: whichStep },
  { id: 'oneCounter', name: 'One counterexample', gen: oneCounter },
  { id: 'proved', name: 'Proved or not?', gen: proved },
  { id: 'equivQ', name: 'Equivalent?', gen: equivQ },
  { id: 'differAt', name: 'Make them differ', gen: differAt },
  { id: 'separating', name: 'Values that expose it', gen: separating },
  { id: 'ownValue', name: 'Your own counterexample', gen: ownValue },
  { id: 'powerEval', name: 'Squares and roots of sums', gen: powerEval },
  { id: 'setRule', name: 'Set names', gen: setRule },
  { id: 'countMembers', name: 'Count the members', gen: countMembers },
  { id: 'allSets', name: 'Every set it is in', gen: allSets },
  { id: 'subsetTrue', name: 'Nested sets', gen: subsetTrue },
  { id: 'display', name: 'Exact or display?', gen: display },
  { id: 'approx', name: 'Exact or approximate?', gen: approx },
  { id: 'placeIt', name: 'Place it on the map', gen: placeIt },
  { id: 'partitionTrue', name: 'Rational or irrational', gen: partitionTrue },
  { id: 'closedFinite', name: 'Closed? (small sets)', gen: closedFinite },
  { id: 'closedNamed', name: 'Closed? (number sets)', gen: closedNamed },
  { id: 'counterPick', name: 'Pick the counterexample', gen: counterPick },
  { id: 'counterType', name: 'Build a counterexample', gen: counterType },
  { id: 'admissible', name: 'Does it count?', gen: admissible },
  { id: 'irrValue', name: 'Exact values', gen: irrValue },
  { id: 'sumForm', name: 'Integers over integers', gen: sumForm },
  { id: 'whyRational', name: 'Why rational?', gen: whyRational },
  { id: 'contradiction', name: 'Suppose the opposite', gen: contradiction },
  { id: 'isIrrational', name: 'Which is irrational?', gen: isIrrational },
];
export const GENERATORS: Record<string, Gen> = Object.fromEntries(FAMILIES.map(f => [f.id, f.gen]));
export const FAMILY_NAMES: Record<string, string> = Object.fromEntries(FAMILIES.map(f => [f.id, f.name]));
