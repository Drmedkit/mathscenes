// items.ts: practice families for "If-then statements and logical language" (v2.extension.logical-reasoning).
// Every family states its domain, so the truth of every statement can be decided from what the student sees; every
// choice item has exactly one right choice, and every wrong choice the classifier recognises carries its catalogue
// id (math-curriculum-essentials/misconceptions.json). Colours by MEANING: the hypothesis p (and ~p) amber, the
// conclusion q (and ~q) teal, in every form.
// Pictures (item.picture; solution-side data under `reveal`): euler (Euler.ts: domain line-up -> zones), table
// (CaseTable.ts: truth / value table), card (a statement on a wide slate). Pure: no DOM.
import { type Item, type Response, type Verdict, int, pick, shuffle } from '../../runtime/item';
import { ans, endOnChoice } from '../../runtime/explain';
import type { Paint } from '../../../core/theme';
import {
  type Case, type Clauses, type Form, type Layout, type Pred, type Rel, type Shape, type Sorted, type Zone, CASES, FORM_TEX, LETTERS, NEG_REL, OPP_REL, SHAPES,
  cmp, domainWords, even, factor, formOf, ifThen, layoutOf, mult, odd, pair, predClauses, prime, range, relH, relTest, shapePreds, sortDomain, subj, valueOf,
} from './logic';
import { type ETok, type EulerParams, eulerFits } from './eulerLayout';
import type { ZoneSel } from './Euler';

// ---------- misconception ids ----------
export const MC = {
  openTruth: 'mc.geometric-proof.open-sentence-given-unconditional-truth',
  domain: 'mc.geometric-proof.domain-of-variable-ignored',
  negOpp: 'mc.geometric-proof.negation-as-opposite',
  boundary: 'mc.geometric-proof.overlooks-boundary-case',
  wrongClause: 'mc.geometric-proof.wrong-clause-as-hypothesis',
  converseTrue: 'mc.geometric-proof.converse-assumed-true',
  causation: 'mc.geometric-proof.material-implication-requires-causation',
  falseHyp: 'mc.geometric-proof.false-hypothesis-breaks-conditional',
  converseNeg: 'mc.geometric-proof.converse-as-logical-negation',
  iffOne: 'mc.geometric-proof.iff-one-direction-only',
  allChecked: 'mc.geometric-proof.all-limited-to-checked-examples',
  allSome: 'mc.geometric-proof.misreads-all-and-some',
  examples: 'mc.reasoning-language.examples-as-proof',
  notAllNone: 'mc.geometric-proof.not-all-means-none',
  someKeeps: 'mc.geometric-proof.existential-negation-keeps-some',
  invAsContra: 'mc.geometric-proof.inverse-formed-as-contrapositive',
  invOne: 'mc.geometric-proof.inverse-negates-only-one-clause',
  formsMixed: 'mc.geometric-proof.conditional-forms-mixed-up',
  contraAsConv: 'mc.geometric-proof.contrapositive-as-converse',
  inverseError: 'mc.geometric-proof.inverse-error',
  someConditions: 'mc.geometric-proof.stops-after-some-conditions',
} as const;

// ---------- pictures ----------
export interface EulerPic extends EulerParams {
  /** regions drawn before the answer (otherwise only the domain line-up shows) */
  regions?: boolean;
  reveal: { zones?: [ZoneSel, Paint][]; glow?: [number, Paint][]; cross?: number[] };
}
export interface TablePic {
  head: string[]; headCol: Paint[]; rows: string[][]; keys: number;
  /** statement columns shown before the answer */
  start: number[];
  ask?: [number, number][];
  ring?: number;
  reveal: { cols: number[]; rings?: [number, Paint][] };
}
export interface CardPic { lines: string[]; reveal?: string[] }
export interface CSItem extends Item { picture?: { euler?: EulerPic; table?: TablePic; card?: CardPic } }
type Gen = (R: () => number, n: number, sg?: string) => CSItem;

// ---------- helpers ----------
interface Opt { t: string; ok?: boolean; mc?: string; say: string }
type Base = Omit<CSItem, 'input' | 'choices' | 'answer' | 'check'>;
function choiceItem(R: () => number, base: Base, opts: Opt[], fixed = false): CSItem {
  const o = fixed ? opts.slice() : shuffle(R, opts.slice());
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
const numItem = (base: Omit<CSItem, 'input' | 'answer' | 'check'>, a: number, check: (v: number) => Verdict): CSItem => ({
  ...base, input: 'num', answer: { kind: 'num', v: a },
  check: (r: Response) => (r.kind === 'num' && Number.isFinite(r.v) ? check(r.v) : { ok: false, say: 'Type a number.' }),
});
const A = (s: string) => `<b class="a">${s}</b>`, B = (s: string) => `<b class="b">${s}</b>`, W = (s: string) => `<b class="w">${s}</b>`;
const H = (n: number) => (n < 0 ? `−${-n}` : String(n));
const nEq = (v: number) => `<i>n</i> = ${H(v)}`;
/** capitalise the first letter of a clause (not inside a tag) */
export const cap = (s: string) => (s.startsWith('<') ? s : s.charAt(0).toUpperCase() + s.slice(1));
const stmt = (P: Pred, Q: Pred) => ifThen(P.says, Q.says);
/** a sentence in quotes, without its final period */
const qt = (s: string) => `“${s.replace(/\.$/, '')}”`;
const lower = (s: string) => s.replace(/^If /, 'if ');
const DOM = (lo: number, hi: number) => `Domain: <i>n</i> is one of ${domainWords(lo, hi)}.`;
const tokTex = (v: number) => String(v);
/** the Euler picture of p (and q) over a list of integers */
function eulerOf(xs: readonly number[], P: Pred, Q: Pred | null, lo: number, hi: number, reveal: EulerPic['reveal'], regions = false): EulerPic {
  const tokens: ETok[] = xs.map(v => ({ tex: tokTex(v), zone: Q ? (P.test(v) && Q.test(v) ? 'pq' : P.test(v) ? 'p' : Q.test(v) ? 'q' : 'o') : P.test(v) ? 'p' : 'o' }));
  const layout: Layout = Q ? layoutOf(sortDomain(xs, P, Q)) : 'one';
  return { layout, domain: domainWords(lo, hi), P: P.label, Q: Q?.label, tokens, regions, reveal };
}
const idx = (xs: readonly number[], v: number) => xs.indexOf(v);

// ---------- random predicates over a small integer domain ----------
const RELS: Rel[] = ['>', '≥', '<', '≤'];
function randPred(R: () => number, lo: number, hi: number): Pred {
  const k = pick(R, ['mult', 'mult', 'mult', 'even', 'odd', 'prime', 'cmp', 'cmp', 'cmp', 'factor'] as const);
  switch (k) {
    case 'mult': return mult(int(R, 3, 6));
    case 'even': return even;
    case 'odd': return odd;
    case 'prime': return prime;
    case 'factor': return factor(pick(R, [12, 18, 20, 24, 30]));
    case 'cmp': return cmp(pick(R, RELS), int(R, lo + 2, hi - 2));
  }
}
interface NumCtx { lo: number; hi: number; xs: number[]; P: Pred; Q: Pred; s: Sorted<number> }
function numPair(R: () => number, ok: (c: NumCtx) => boolean, fam: string): NumCtx {
  for (let t = 0; t < 2000; t++) {
    const lo = pick(R, [1, 1, 0, 2, 3]), hi = lo + int(R, 9, 11);
    const xs = range(lo, hi), P = randPred(R, lo, hi), Q = randPred(R, lo, hi);
    if (P.key === Q.key) continue;
    const nP = xs.filter(P.test).length, nQ = xs.filter(Q.test).length;
    if (nP < 1 || nQ < 1 || nP === xs.length || nQ === xs.length) continue;
    const c = { lo, hi, xs, P, Q, s: sortDomain(xs, P, Q) };
    if (!ok(c)) continue;
    if (!eulerFits(eulerOf(xs, P, Q, lo, hi, {}))) continue;
    return c;
  }
  throw new Error(`${fam}: no number pair found`);
}

/** p and q true for exactly the same members (n > 7 and n ≥ 8 on the integers) */
function samePair(R: () => number, fam: string): NumCtx {
  for (let t = 0; t < 500; t++) {
    const lo = pick(R, [1, 0, 2]), hi = lo + int(R, 9, 11), xs = range(lo, hi), a = int(R, lo + 3, hi - 3);
    const k = int(R, 0, 4);
    const [P, Q] = k === 0 ? [cmp('>', a), cmp('≥', a + 1)] : k === 1 ? [cmp('<', a), cmp('≤', a - 1)] : k === 2 ? [cmp('≥', a), cmp('>', a - 1)] : k === 3 ? [cmp('≤', a), cmp('<', a + 1)] : [even, mult(2)];
    const s = sortDomain(xs, P, Q);
    if (s.pq.length < 2 || s.o.length < 1) continue;
    if (!eulerFits(eulerOf(xs, P, Q, lo, hi, {}))) continue;
    return { lo, hi, xs, P, Q, s };
  }
  throw new Error(`${fam}: no equal pair found`);
}

// ---------- statement banks ----------
interface Bank { c: Clauses; all?: string; ex?: string }
const SUBJ: (() => Bank)[] = [
  () => ({ c: subj('an angle', 'it', 'measures 90°', 'is a right angle', 'does not measure 90°', 'is not a right angle'), all: 'Every angle that measures 90° is a right angle.' }),
  () => ({ c: subj('a triangle', 'it', 'has three equal sides', 'has three equal angles', 'does not have three equal sides', 'does not have three equal angles'), all: 'Every triangle with three equal sides has three equal angles.' }),
  () => ({ c: subj('a quadrilateral', 'it', 'is a square', 'has four right angles', 'is not a square', 'does not have four right angles'), all: 'Every square has four right angles.' }),
  () => ({ c: subj('two angles', 'they', 'are vertical angles', 'are congruent', 'are not vertical angles', 'are not congruent'), all: 'All pairs of vertical angles are congruent.' }),
  () => ({ c: subj('a number', 'it', 'ends in 0', 'is divisible by 5', 'does not end in 0', 'is not divisible by 5'), all: 'Every number that ends in 0 is divisible by 5.' }),
  () => ({ c: subj('two lines', 'they', 'meet at a right angle', 'are perpendicular', 'do not meet at a right angle', 'are not perpendicular') }),
  () => ({ c: subj('a polygon', 'it', 'has three sides', 'is a triangle', 'does not have three sides', 'is not a triangle'), all: 'Every polygon with three sides is a triangle.' }),
  () => ({ c: subj('a number', 'it', 'is a multiple of 6', 'is even', 'is not a multiple of 6', 'is not even'), all: 'Every multiple of 6 is even.' }),
  () => ({ c: subj('a figure', 'it', 'is a rectangle', 'has four sides', 'is not a rectangle', 'does not have four sides'), all: 'Every rectangle has four sides.' }),
  () => ({ c: subj('an angle', 'it', 'measures less than 90°', 'is acute', 'measures 90° or more', 'is not acute'), all: 'Every angle that measures less than 90° is acute.' }),
];
const PAIRS: ((R: () => number) => Bank)[] = [
  () => ({ c: pair('it rains', 'the game is canceled', 'it does not rain', 'the game is not canceled') }),
  R => { const s = pick(R, [85, 90, 92]); return { c: pair(`you score ${s} or more`, 'you get an A', `you score less than ${s}`, 'you do not get an A') }; },
  R => { const b = pick(R, [10, 15, 20]); return { c: pair(`the battery is below ${b}%`, 'the screen dims', `the battery is at ${b}% or more`, 'the screen does not dim') }; },
  () => ({ c: pair('you order a large pizza', 'you get a free drink', 'you do not order a large pizza', 'you do not get a free drink') }),
  () => ({ c: pair('the light is red', 'the cars stop', 'the light is not red', 'the cars do not stop') }),
  () => ({ c: pair('Ana lives in Chicago', 'Ana lives in Illinois', 'Ana does not live in Chicago', 'Ana does not live in Illinois') }),
  R => { const t = pick(R, [60, 65, 68]); return { c: pair(`the temperature drops below ${t}°F`, 'the heater turns on', `the temperature is ${t}°F or higher`, 'the heater does not turn on') }; },
  () => ({ c: pair('you come to every practice', 'you play on Saturday', 'you miss a practice', 'you do not play on Saturday') }),
];
/** a conditional from the banks or from two predicates about n (with its domain words) */
/** the two clauses say the same thing, or exactly opposite things, on the values: then a conditional's related
 *  forms collapse (the converse means the original), so the families that form them skip such pairs */
function collapses(P: Pred, Q: Pred, xs: readonly number[]): boolean {
  return xs.every(x => P.test(x) === Q.test(x)) || xs.every(x => P.test(x) !== Q.test(x));
}
/** definitions and two-way theorems in the subject bank (p and q mean the same): skipped where forms must differ */
const SUBJ_IFF = new Set([0, 1, 5, 6, 9]);
function anyClauses(R: () => number, distinct = false): { c: Clauses; dom?: string; all?: string } {
  const k = R();
  if (k < 0.38) {
    const i = distinct ? pick(R, SUBJ.map((_, j) => j).filter(j => !SUBJ_IFF.has(j))) : int(R, 0, SUBJ.length - 1);
    const b = SUBJ[i]!(); return { c: b.c, all: b.all };
  }
  if (k < 0.7) return { c: pick(R, PAIRS)(R).c };
  const lo = pick(R, [1, 0]), hi = lo + 11, xs = range(lo, hi);
  for (;;) { const P = randPred(R, lo, hi), Q = randPred(R, lo, hi); if (P.key !== Q.key && !(distinct && collapses(P, Q, xs))) return { c: predClauses(P, Q), dom: DOM(lo, hi) }; }
}
/** a conditional whose clauses are inequalities (boundaries matter when they are negated) */
function ineqClauses(R: () => number): { c: Clauses; opp: Clauses; P: Pred; Q: Pred; v: string } {
  const v = pick(R, ['x', 'n']);
  // test values: every integer around the numbers for n, halves too for x (n > 9 and n ≥ 10 are the same on the integers)
  const vals = range(-40, 60).map(t => (v === 'x' ? t / 2 : t));
  let P: Pred, Q: Pred;
  do {
    const r1 = pick(R, RELS), a = int(R, -4, 12), r2 = pick(R, RELS);
    // the conclusion follows from the hypothesis or not: both are fine for forming the related statements
    const b = r2 === '>' || r2 === '≥' ? a - int(R, 1, 6) : a + int(R, 1, 6);
    P = cmp(r1, a, v); Q = cmp(r2, b, v);
  } while (collapses(P, Q, vals));
  return { c: pair(P.says, Q.says, P.neg, Q.neg), opp: pair(P.says, Q.says, P.opp!, Q.opp!), P, Q, v };
}

// ===================== 1 statement-truth-value =====================
interface Sentence { t: string; kind: 'true' | 'false' | 'open' | 'none' }
function sentence(R: () => number): Sentence {
  const k = pick(R, ['mult', 'prime', 'sum', 'shape', 'open', 'open', 'open', 'none', 'none'] as const);
  if (k === 'mult') { const a = int(R, 12, 60), d = pick(R, [3, 4, 5, 6, 7, 9]); return { t: `${a} is a multiple of ${d}.`, kind: a % d === 0 ? 'true' : 'false' }; }
  if (k === 'prime') { const p = pick(R, [2, 9, 11, 15, 17, 21, 23, 27, 29, 33, 37, 39, 41, 49, 51, 53, 57]); return { t: `${p} is prime.`, kind: [2, 11, 17, 23, 29, 37, 41, 53].includes(p) ? 'true' : 'false' }; }
  if (k === 'sum') { const a = int(R, 6, 19), b = int(R, 6, 19), c = a + b + pick(R, [0, 0, 1, -1]); return { t: `${a} + ${b} = ${c}.`, kind: c === a + b ? 'true' : 'false' }; }
  if (k === 'shape') return pick(R, [
    { t: 'A square has four right angles.', kind: 'true' }, { t: 'A triangle has four sides.', kind: 'false' },
    { t: 'An equilateral triangle has three equal sides.', kind: 'true' }, { t: 'A rectangle has exactly three right angles.', kind: 'false' },
    { t: 'A right angle measures 90°.', kind: 'true' }, { t: 'A pentagon has six sides.', kind: 'false' },
  ] as Sentence[]);
  if (k === 'open') {
    const a = int(R, 2, 9), b = int(R, 10, 20);
    return pick(R, [
      { t: `<i>x</i> + ${a} = ${b}.`, kind: 'open' }, { t: `<i>x</i> &gt; ${b}.`, kind: 'open' }, { t: `${a}<i>y</i> = ${a * int(R, 2, 9)}.`, kind: 'open' },
      { t: `<i>n</i> is a multiple of ${a}.`, kind: 'open' }, { t: `<i>t</i> − ${a} &lt; ${b}.`, kind: 'open' }, { t: 'The number <i>n</i> is prime.', kind: 'open' },
    ] as Sentence[]);
  }
  const a = int(R, 2, 9), b = int(R, 10, 30);
  return pick(R, [
    { t: 'Find the area of the rectangle.', kind: 'none' }, { t: `Is ${b * 2 + 1} prime?`, kind: 'none' }, { t: `Solve <i>x</i> + ${a} = ${b}.`, kind: 'none' },
    { t: 'Draw a right triangle.', kind: 'none' }, { t: `List the factors of ${b}.`, kind: 'none' }, { t: `What is ${a} times ${b}?`, kind: 'none' },
  ] as Sentence[]);
}
const statementKind: Gen = (R, n) => {
  const s = sentence(R);
  const say: Record<Sentence['kind'], string> = {
    true: 'It has one truth value, and the value is true.',
    false: 'It has one truth value, and the value is false.',
    open: 'It has a variable with no value: it is true for some values and false for others. That is an open sentence.',
    none: 'It is an instruction or a question: it cannot be true or false at all.',
  };
  const opts: Opt[] = [
    { t: 'A true statement', ok: s.kind === 'true', mc: s.kind === 'open' ? MC.openTruth : undefined, say: s.kind === 'true' ? 'Yes. ' + say.true : s.kind === 'open' ? 'There is a variable with no value yet: true or false depends on it.' : s.kind === 'none' ? say.none : 'Check it: it is false.' },
    { t: 'A false statement', ok: s.kind === 'false', mc: s.kind === 'open' ? MC.openTruth : undefined, say: s.kind === 'false' ? 'Yes. ' + say.false : s.kind === 'open' ? 'There is a variable with no value yet: true or false depends on it.' : s.kind === 'none' ? say.none : 'Check it: it is true.' },
    { t: 'An open sentence: true or false depends on the variable', ok: s.kind === 'open', say: s.kind === 'open' ? 'Yes. ' + say.open : 'There is no variable to choose: it already has one truth value.' + (s.kind === 'none' ? ' In fact, it has none: it is not a statement.' : '') },
    { t: 'Not a statement: it cannot be true or false', ok: s.kind === 'none', say: s.kind === 'none' ? 'Yes. ' + say.none : s.kind === 'open' ? 'It is a claim about a variable; pick a value and it becomes true or false.' : 'It makes a claim, so it can be judged true or false.' },
  ];
  return choiceItem(R, {
    id: `statementKind-${n}`, family: 'statementKind', prompt: `What kind of sentence is this?<br><b>“${s.t}”</b>`, board: '\\text{statement?}',
    picture: { card: { lines: [`“${s.t}”`] } },
    solution: [s.kind === 'open' ? 'There is a variable, and no value for it.' : s.kind === 'none' ? 'It asks or tells you to do something; it makes no claim.' : 'There is no variable: the sentence makes one claim.', say[s.kind]],
  }, opts, true);
};
const openTruth: Gen = (R, n) => {
  for (;;) {
    const evens = R() < 0.35;
    const lo = evens ? 0 : pick(R, [1, 0, 2]), hi = evens ? pick(R, [16, 18, 20]) : lo + int(R, 9, 11);
    const xs = evens ? range(lo, hi).filter(v => v % 2 === 0) : range(lo, hi);
    const P = R() < 0.5 ? cmp(pick(R, RELS), int(R, lo + 2, hi - 2)) : pick(R, [mult(3), mult(4), mult(5), prime, factor(12), factor(24)]);
    const count = xs.filter(P.test).length;
    if (count < 1 || count === xs.length) continue;
    const domTxt = evens ? `the even integers ${lo} to ${hi}` : domainWords(lo, hi);
    const ignored = evens ? range(lo, hi).filter(P.test).length : -1;
    const rel = P.key.match(/^([><≥≤])(-?\d+)$/);
    const flipped = rel ? xs.filter(v => relTest(({ '>': '≥', '≥': '>', '<': '≤', '≤': '<' } as Record<Rel, Rel>)[rel[1] as Rel], v, Number(rel[2]))).length : -1;
    const pic = { ...eulerOf(xs, P, null, lo, hi, { zones: [['P', 'link']] as [ZoneSel, Paint][] }), domain: domTxt };
    if (!eulerFits(pic)) continue;
    return numItem({
      id: `openTruth-${n}`, family: 'openTruth', prompt: `Domain: <i>n</i> is one of ${domTxt}. For how many values of <i>n</i> in the domain is the open sentence ${A(P.says)} true?`,
      board: `\\text{${P.label}}`, unit: 'values', picture: { euler: pic },
      solution: [`Test each member of the domain: ${domTxt}.`, `The ones that make ${A(P.says)} true: ${xs.filter(P.test).map(H).join(', ')}.`, `That is ${ans(count)} ${count === 1 ? "value" : "values"}.`],
    }, count, v => v === count ? { ok: true, say: `Yes: ${count} ${count === 1 ? "member" : "members"} of the domain ${count === 1 ? "makes" : "make"} it true.` }
      : v === ignored ? { ok: false, mc: MC.domain, say: `Only the domain counts: ${domTxt}. Odd numbers are not in it.` }
        : v === flipped ? { ok: false, mc: MC.boundary, say: `Check the boundary value ${H(Number(rel![2]))}: is it in or out?` }
          : { ok: false, say: `Test each member of the domain one by one, and count the ones that make it true.` });
  }
};

// ===================== 2 negate-simple =====================
const negateIneq: Gen = (R, n) => {
  const v = pick(R, ['x', 'n']), eq = R() < 0.2, r = pick(R, RELS), a = int(R, -3, 12), lo = a - 4, hi = a + 4;
  const xs = range(lo, hi);
  const sentenceH = eq ? `<i>${v}</i> = ${H(a)}` : relH(v, r, a);
  const P: Pred = eq ? { key: `=${a}`, says: sentenceH, neg: `<i>${v}</i> ≠ ${H(a)}`, label: `${v} = ${a}`, negLabel: `${v} ≠ ${a}`, test: x => x === a } : cmp(r, a, v);
  const opts: Opt[] = eq ? [
    { t: `<i>${v}</i> ≠ ${H(a)}`, ok: true, say: `Yes: everything except ${H(a)}.` },
    { t: `<i>${v}</i> &gt; ${H(a)}`, say: `That leaves out the values below ${H(a)}: they also make the statement false.` },
    { t: `<i>${v}</i> &lt; ${H(a)}`, say: `That leaves out the values above ${H(a)}: they also make the statement false.` },
  ] : [
    { t: relH(v, NEG_REL[r], a), ok: true, say: `Yes: the negation is true exactly when ${sentenceH} is false, and the boundary ${H(a)} ${P.test(a) ? 'stays out' : 'is in'}.` },
    { t: relH(v, OPP_REL[r], a), mc: MC.negOpp, say: `Check the boundary ${H(a)}: ${r === '>' || r === '<' ? `${sentenceH} is false at ${H(a)}, so the negation must be true there` : `${sentenceH} is true at ${H(a)}, so the negation must be false there`}.` },
    { t: relH(v, r === '>' ? '≥' : r === '≥' ? '>' : r === '<' ? '≤' : '<', a), say: 'That still says the same direction: it is true for the same values (almost), not the opposite ones.' },
  ];
  const right = opts[0]!;
  return choiceItem(R, {
    id: `negateIneq-${n}`, family: 'negateIneq',
    prompt: `Domain: <i>${v}</i> is one of ${domainWords(lo, hi)}. What is the negation of ${A(sentenceH)}?`,
    board: eq ? `${v} = ${a}` : `${v} ${({ '>': '>', '≥': '\\ge', '<': '<', '≤': '\\le' } as Record<Rel, string>)[r]} ${a}`,
    picture: { euler: { ...eulerOf(xs, P, null, lo, hi, { zones: [['notP', 'pick']], glow: [[idx(xs, a), 'pick']] }), P: P.label } },
    solution: [`The negation is true exactly where ${A(sentenceH)} is false.`, `Check the boundary <i>${v}</i> = ${H(a)}: ${P.test(a) ? 'the statement is true there, so the negation leaves it out' : 'the statement is false there, so the negation includes it'}.`, `The negation is ${ans(right.t)}.`],
  }, opts);
};
interface PropNeg { s: string; neg: string; opp: string; other: string; why: string }
function propNeg(R: () => number): PropNeg {
  const k = int(R, 0, 5);
  if (k === 0) return { s: '<i>n</i> is positive', neg: '<i>n</i> ≤ 0', opp: '<i>n</i> is negative', other: '<i>n</i> ≥ 0', why: '0 is neither positive nor negative, so the negation must include 0.' };
  if (k === 1) return { s: '<i>n</i> is negative', neg: '<i>n</i> ≥ 0', opp: '<i>n</i> is positive', other: '<i>n</i> ≤ 0', why: '0 is neither positive nor negative, so the negation must include 0.' };
  if (k === 2) return { s: 'the angle is acute (it measures less than 90°)', neg: 'the angle measures 90° or more', opp: 'the angle is obtuse (it measures more than 90°)', other: 'the angle measures 90° or less', why: 'A right angle (exactly 90°) is not acute, so the negation must include 90°.' };
  if (k === 3) { const t = pick(R, [32, 50, 60, 75]); return { s: `the temperature is above ${t}°F`, neg: `the temperature is ${t}°F or below`, opp: `the temperature is below ${t}°F`, other: `the temperature is ${t}°F or above`, why: `Exactly ${t}°F is not above ${t}°F, so the negation must include it.` }; }
  if (k === 4) return { s: 'the team won the game', neg: 'the team did not win the game', opp: 'the team lost the game', other: 'the team tied the game', why: 'A game can also end in a tie: "did not win" covers losing and tying.' };
  const a = int(R, 3, 15); return { s: `<i>n</i> is greater than ${a}`, neg: `<i>n</i> is less than or equal to ${a}`, opp: `<i>n</i> is less than ${a}`, other: `<i>n</i> is greater than or equal to ${a}`, why: `${a} is not greater than ${a}, so the negation must include ${a}.` };
}
const negateProperty: Gen = (R, n) => {
  const p = propNeg(R);
  const dom = p.s.includes('<i>n</i>') ? ' (<i>n</i> is any integer)' : p.s.includes('angle') ? ' (the angle measures between 0° and 180°)' : '';
  return choiceItem(R, {
    id: `negateProperty-${n}`, family: 'negateProperty', prompt: `What is the negation of “${A(p.s)}”${dom}?`, board: '{\\sim} p',
    picture: { card: { lines: [`Statement: ${A(cap(p.s))}.`], reveal: [`Negation: ${B(cap(p.neg))}.`, p.why] } },
    solution: [`The negation is true exactly when the statement is false.`, p.why, `The negation is ${ans(p.neg)}.`],
  }, [
    { t: cap(p.neg), ok: true, say: 'Yes: it is true in every case where the statement is false.' },
    { t: cap(p.opp), mc: MC.negOpp, say: `That is the opposite, not the negation. ${p.why}` },
    { t: cap(p.other), say: 'That one overlaps the statement: in some cases both would be true.' },
  ]);
};
const negBoundary: Gen = (R, n) => {
  const k = int(R, 0, 2);
  if (k === 2) {
    const t = pick(R, [32, 40, 50, 68, 75]);
    return numItem({
      id: `negBoundary-${n}`, family: 'negBoundary', prompt: `Sam says the negation of “the temperature is above ${t}°F” is “the temperature is below ${t}°F”. Which whole-degree temperature makes <b>both</b> sentences false?`,
      board: `\\text{above } ${t}\\ \\text{and below } ${t}`, unit: '°F',
      picture: { card: { lines: [`${A(`above ${t}°F`)}    ${B(`below ${t}°F`)}`], reveal: [`At exactly ${t}°F, neither is true.`, `So the real negation is “${t}°F or below”.`] } },
      solution: [`A statement and its negation can never both be false.`, `At exactly ${t}°F the temperature is not above ${t}°F and not below ${t}°F.`, `So Sam's sentence fails at ${ans(t + '°F')}: the negation is “${t}°F or below”.`],
    }, t, v => v === t ? { ok: true, say: `Yes: at exactly ${t}°F both are false, so Sam's sentence is not the negation.` }
      : Math.abs(v - t) === 1 ? { ok: false, mc: MC.boundary, say: `Check that one: it makes one of the two sentences true. Try the boundary itself.` }
        : { ok: false, say: 'At that temperature one of the sentences is true. Look at the boundary.' });
  }
  const v = pick(R, ['x', 'n']), pos = k === 1;
  const a = pos ? 0 : int(R, -3, 12), r: Rel = pos ? '>' : pick(R, ['>', '<'] as Rel[]);
  const S = pos ? `<i>${v}</i> is positive` : relH(v, r, a), Sam = pos ? `<i>${v}</i> is negative` : relH(v, OPP_REL[r], a);
  const P = pos ? { ...cmp('>', 0, v), label: 'positive' } : cmp(r, a, v), Q = pos ? { ...cmp('<', 0, v), label: 'negative' } : cmp(OPP_REL[r], a, v);
  const lo = a - 4, hi = a + 4, xs = range(lo, hi);
  return numItem({
    id: `negBoundary-${n}`, family: 'negBoundary', prompt: `Domain: <i>${v}</i> is one of ${domainWords(lo, hi)}. Sam says the negation of “${A(S)}” is “${B(Sam)}”. Which value of <i>${v}</i> makes <b>both</b> sentences false?`,
    board: `${v} ${r} ${a},\\ \\ ${v} ${OPP_REL[r]} ${a}`, unit: '',
    picture: { euler: { ...eulerOf(xs, P, Q, lo, hi, { zones: [['o', 'wrong']], glow: [[idx(xs, a), 'wrong']] }), P: P.label, Q: Q.label } },
    solution: [`A statement and its negation can never both be false: one of them is always true.`, `At <i>${v}</i> = ${H(a)}: “${S}” is false, and “${Sam}” is false.`, `So <i>${v}</i> = ${ans(H(a))} shows Sam's sentence is not the negation: the negation is ${relH(v, NEG_REL[r], a)}.`],
  }, a, x => x === a ? { ok: true, say: `Yes: at ${H(a)} both are false, so Sam's sentence is not the negation.` }
    : Math.abs(x - a) === 1 ? { ok: false, mc: MC.boundary, say: `At ${H(x)} one of the two sentences is true. Try the boundary itself.` }
      : { ok: false, say: `At ${H(x)} one of the two sentences is true. Look at the boundary value.` });
};

// ===================== 3 conditional-form =====================
interface Phrase { t: string; qFirst: boolean; ifThen: boolean }
function phrasings(b: { c: Clauses; all?: string }): Phrase[] {
  const c = b.c, out: Phrase[] = [
    { t: `${cap(c.q1)} if ${c.p2}.`, qFirst: true, ifThen: false },
    { t: `${cap(c.q1)} whenever ${c.p2}.`, qFirst: true, ifThen: false },
  ];
  if (b.all) out.push({ t: b.all, qFirst: false, ifThen: false });
  return out;
}
const ifThenForm: Gen = (R, n) => {
  const b = R() < 0.6 ? pick(R, SUBJ)() : pick(R, PAIRS)(R);
  const ph = pick(R, phrasings(b));
  const plainC = b.c;
  return choiceItem(R, {
    id: `ifThen-${n}`, family: 'ifThen', prompt: `Which is the same statement in if-then form?<br><b>“${ph.t}”</b>`, board: 'p \\to q',
    picture: { card: { lines: [`“${ph.t}”`], reveal: [formOf(plainC, 'original')] } },
    solution: [ph.qFirst ? `The clause after “${ph.t.includes('whenever') ? 'whenever' : 'if'}” is the hypothesis, even though it comes second: ${A(plainC.p1)}.` : `“All A are B” means: if something is an A, then it is a B. Hypothesis: ${A(plainC.p1)}.`, `The conclusion: ${B(plainC.q1)}.`],
  }, [
    { t: formOf(plainC, 'original'), ok: true, say: 'Yes: the hypothesis goes after “if”.' },
    { t: formOf(plainC, 'converse'), mc: ph.qFirst ? MC.wrongClause : undefined, say: ph.qFirst ? `The first clause is not always the hypothesis: the hypothesis is the part after “${ph.t.includes('whenever') ? 'whenever' : 'if'}”.` : 'That swaps the parts: it is the converse.' },
    { t: formOf(plainC, 'inverse'), say: 'That negates both parts: the original says nothing like that.' },
  ]);
};
const hypConc: Gen = (R, n) => {
  const b = R() < 0.55 ? pick(R, SUBJ)() : pick(R, PAIRS)(R);
  const all = phrasings(b);
  const ph = R() < 0.25 ? { t: formOf(b.c, 'original', false), qFirst: false, ifThen: true } : pick(R, all);
  const c = b.c;
  const opts: Opt[] = [
    { t: `Hypothesis: ${A(c.p1)}. Conclusion: ${B(c.q1)}.`, ok: true, say: 'Yes: the hypothesis is the condition; the conclusion is what follows from it.' },
    { t: `Hypothesis: ${B(c.q1)}. Conclusion: ${A(c.p1)}.`, mc: ph.qFirst ? MC.wrongClause : undefined, say: ph.qFirst ? `The first clause is not always the hypothesis. The condition is the part after “${ph.t.includes('whenever') ? 'whenever' : 'if'}”.` : 'Those are swapped: the condition comes after “if”.' },
    ph.ifThen ? { t: `Hypothesis: ${A(c.np1)}. Conclusion: ${B(c.nq1)}.`, say: 'The statement has no “not” in it: the parts are stated as they are.' }
      : { t: 'There is none: it is not an if-then statement.', say: 'It is one, in disguise: it can be rewritten as “If …, then …” without changing its meaning.' },
  ];
  return choiceItem(R, {
    id: `hypConc-${n}`, family: 'hypConc', prompt: `Name the hypothesis and the conclusion.<br><b>“${ph.t}”</b>`, board: 'p \\to q',
    picture: { card: { lines: [`“${ph.t}”`], reveal: [formOf(c, 'original')] } },
    solution: [`Rewrite it as “If …, then …”: ${formOf(c, 'original')}`, `The part after “if” is the hypothesis: ${A(c.p1)}. The part after “then” is the conclusion: ${B(c.q1)}.`],
  }, opts);
};

// ===================== 4 conditional-truth =====================
const breaker: Gen = (R, n) => {
  const c = numPair(R, x => x.s.p.length >= 1 && x.s.pq.length >= 1 && x.s.q.length >= 1 && x.s.o.length >= 1, 'breaker');
  const w = pick(R, c.s.p), a = pick(R, c.s.pq), b = pick(R, c.s.q), d = pick(R, c.s.o);
  return choiceItem(R, {
    id: `breaker-${n}`, family: 'breaker', prompt: `${DOM(c.lo, c.hi)} Statement: ${stmt(c.P, c.Q)} Which value of <i>n</i> shows the statement is false?`,
    board: 'p \\to q',
    picture: { euler: eulerOf(c.xs, c.P, c.Q, c.lo, c.hi, { zones: [['p', 'wrong']], glow: [[idx(c.xs, w), 'wrong']], cross: [idx(c.xs, w)] }) },
    solution: [`Only a case with the hypothesis true and the conclusion false can break it: in the amber region, outside the teal one.`, `${nEq(w)}: ${A(c.P.says.replace(/<i>n<\/i>/g, String(w)))} is true, and ${B(c.Q.says.replace(/<i>n<\/i>/g, String(w)))} is false.`],
  }, [
    { t: nEq(w), ok: true, say: `Yes: ${w} makes the hypothesis true and the conclusion false.` },
    { t: nEq(a), say: `${a} makes both parts true: it agrees with the statement.` },
    { t: nEq(b), mc: MC.falseHyp, say: `For ${b} the hypothesis is false, so the statement promises nothing about it. Only “hypothesis true, conclusion false” breaks it.` },
    { t: nEq(d), mc: MC.falseHyp, say: `For ${d} the hypothesis is false, so the statement promises nothing about it. Only “hypothesis true, conclusion false” breaks it.` },
  ]);
};
const UNRELATED: [string, boolean][] = [['2 + 2 = 4', true], ['a triangle has three sides', true], ['5 is even', false], ['a square has five sides', false], ['7 is prime', true], ['10 is a multiple of 3', false], ['a right angle measures 90°', true], ['9 is less than 4', false]];
const caseValue: Gen = (R, n) => {
  const k = R();
  let html: string, p: boolean, q: boolean, caseTxt: string, causal = false;
  if (k < 0.45) {
    const c = pick(R, PAIRS)(R).c;
    [p, q] = pick(R, [[false, true], [false, false], [true, false], [true, true], [false, true], [false, false]] as Case[]);
    html = formOf(c, 'original');
    caseTxt = `${cap(p ? c.p1 : c.np1)}, and ${q ? c.q1 : c.nq1}.`;
  } else if (k < 0.8) {
    const c = numPair(R, () => true, 'caseValue');
    const v = pick(R, c.xs);
    p = c.P.test(v); q = c.Q.test(v);
    const sub = (s: string) => s.replace(/<i>n<\/i>/g, String(v));
    html = `${DOM(c.lo, c.hi)} ${stmt(c.P, c.Q)} Put in ${nEq(v)}: ${ifThen(sub(c.P.says), sub(c.Q.says))}`;
    caseTxt = `${nEq(v)}: ${sub(c.P.says)} is ${p ? 'true' : 'false'}, ${sub(c.Q.says)} is ${q ? 'true' : 'false'}.`;
  } else {
    let a: [string, boolean], b: [string, boolean];
    do { a = pick(R, UNRELATED); b = pick(R, UNRELATED); } while (a[0] === b[0] || (a[1] && !b[1]));
    p = a[1]; q = b[1]; causal = true;
    html = ifThen(a[0], b[0]);
    caseTxt = `${cap(a[0])} is ${p ? 'true' : 'false'}; ${b[0]} is ${q ? 'true' : 'false'}.`;
  }
  const val = !p || q;
  const ci = CASES.findIndex(([a, b]) => a === p && b === q);
  const opts: Opt[] = [
    { t: 'True', ok: val, say: val ? (p ? 'Yes: the hypothesis happened and so did the conclusion.' : 'Yes: the hypothesis is false, so the statement made no promise here. It is not broken, so it is true.') : 'The hypothesis is true and the conclusion is false: that is the one case that breaks it.' },
    causal && val
      ? { t: 'False: the first part does not cause the second', mc: MC.causation, say: 'An if-then statement does not claim a cause. It is false only when the hypothesis is true and the conclusion is false.' }
      : { t: 'False', ok: !val, mc: val && !p ? MC.falseHyp : undefined, say: !val ? 'Yes: the hypothesis is true and the conclusion is false. That is the only case that breaks it.' : !p ? 'A false hypothesis does not break it: the statement only promises something when the hypothesis is true.' : 'Both parts are true: the statement holds.' },
    { t: 'Neither: it has no truth value in this case', say: 'An if-then statement is always true or false. When the hypothesis is false, it counts as true: nothing it promised failed.' },
  ];
  return choiceItem(R, {
    id: `caseValue-${n}`, family: 'caseValue',
    prompt: k >= 0.45 && k < 0.8 ? `${html} Is this statement true or false?` : `Statement: ${html}<br>Case: ${caseTxt} In this case, is the statement true or false?`,
    board: 'p \\to q',
    picture: { table: { head: ['p', 'q', 'p \\to q'], headCol: ['first', 'second', 'ink'], rows: CASES.map(([a, b]) => ['T'.repeat(+a) || 'F', 'T'.repeat(+b) || 'F', a && !b ? 'F' : 'T']), keys: 2, start: [], ask: [[ci, 2]], ring: ci, reveal: { cols: [2], rings: [[1, 'wrong']] } } },
    solution: [`The case: ${caseTxt.replace(/\.$/, '')}: <i>p</i> ${p ? 'true' : 'false'}, <i>q</i> ${q ? 'true' : 'false'}.`, 'An if-then statement is false only when the hypothesis is true and the conclusion is false (the row T, F).', `Here it is ${val ? 'true' : 'false'}.`],
  }, opts, true);
};

// ===================== 5 form-converse =====================
const whichConverse: Gen = (R, n) => {
  const { c, dom } = anyClauses(R, true);
  return choiceItem(R, {
    id: `whichConverse-${n}`, family: 'whichConverse', prompt: `${dom ? dom + ' ' : ''}Statement: ${formOf(c, 'original')} Which is its converse?`, board: 'q \\to p',
    picture: { card: { lines: [`Statement: ${formOf(c, 'original')}`], reveal: [`Converse: ${formOf(c, 'converse')}`, 'The hypothesis and the conclusion trade places.'] } },
    solution: ['The converse swaps the hypothesis and the conclusion; nothing is negated.', ],
  }, [
    { t: formOf(c, 'converse'), ok: true, say: 'Yes: the hypothesis and the conclusion trade places.' },
    { t: formOf(c, 'inverse'), mc: MC.converseNeg, say: 'That negates both parts: that is the inverse. The converse swaps them, without “not”.' },
    { t: formOf(c, 'contrapositive'), mc: MC.contraAsConv, say: 'That swaps AND negates: that is the contrapositive. The converse only swaps.' },
  ]);
};
const converseTrue: Gen = (R, n) => {
  const sameCase = R() < 0.3;
  const c = sameCase
    ? samePair(R, 'converseTrue')
    : numPair(R, x => !x.s.p.length && x.s.q.length >= 1 && x.s.pq.length >= 1 && x.s.o.length >= 1, 'converseTrue');
  const conv = ifThen(c.Q.says, c.P.says, true, false);
  const opts: Opt[] = sameCase ? [
    { t: 'Yes: no <i>n</i> in the domain has the conclusion without the hypothesis', ok: true, say: 'Yes: the two regions hold the same members, so it works both ways.' },
    { t: `No: ${nEq(pick(R, c.s.pq))} is a counterexample`, say: 'That member makes both parts true: it agrees with the converse.' },
    { t: `No: ${nEq(pick(R, c.s.o))} is a counterexample`, mc: MC.falseHyp, say: 'For that member the converse\'s hypothesis is false: it cannot break it.' },
  ] : (() => {
    const w = pick(R, c.s.q);
    return [
      { t: `No: ${nEq(w)} is a counterexample`, ok: true, say: `Yes: ${w} makes the converse's hypothesis true and its conclusion false.` },
      { t: 'Yes: a true statement always has a true converse', mc: MC.converseTrue, say: `The converse is a different statement. Check ${nEq(w)}.` },
      { t: `No: ${nEq(pick(R, c.s.pq))} is a counterexample`, say: 'That member makes both parts true: it agrees with the converse.' },
    ];
  })();
  return choiceItem(R, {
    id: `converseTrue-${n}`, family: 'converseTrue',
    prompt: `${DOM(c.lo, c.hi)} The statement ${qt(stmt(c.P, c.Q))} is true for every <i>n</i> in the domain. Its converse is ${qt(conv)}. Is the converse true for every <i>n</i> in the domain?`,
    board: 'q \\to p',
    picture: { euler: eulerOf(c.xs, c.P, c.Q, c.lo, c.hi, sameCase ? { zones: [['Q', 'link']] } : { zones: [['q', 'wrong']], glow: c.s.q.map(v => [idx(c.xs, v), 'wrong'] as [number, Paint]) }) },
    solution: ['The converse has the teal part as its hypothesis: check every member in the teal region.', sameCase ? 'Every member in the teal region is also in the amber region: the converse holds.' : `${c.s.q.map(H).join(', ')} ${c.s.q.length > 1 ? 'are' : 'is'} in the teal region but outside the amber one: hypothesis true, conclusion false.`, `So: ${ans(opts.find(o => o.ok)!.t)}.`],
  }, opts);
};

// ===================== 6 biconditional =====================
const iffMeans: Gen = (R, n) => {
  const { c, dom } = anyClauses(R);
  const iff = `${cap(c.p1)} if and only if ${c.q2}.`;
  return choiceItem(R, {
    id: `iffMeans-${n}`, family: 'iffMeans', prompt: `${dom ? dom + ' ' : ''}What does this statement say?<br><b>“${iff}”</b>`, board: 'p \\leftrightarrow q',
    picture: { card: { lines: [`“${iff}”`], reveal: [formOf(c, 'original'), 'and', formOf(c, 'converse')] } },
    solution: ['“If and only if” packs two statements into one: the conditional and its converse.', `${formOf(c, 'original')} And: ${formOf(c, 'converse')}`],
  }, [
    { t: `${formOf(c, 'original')} And ${formOf(c, 'converse').charAt(0).toLowerCase() + formOf(c, 'converse').slice(1)}`, ok: true, say: 'Yes: both directions.' },
    { t: formOf(c, 'original'), mc: MC.iffOne, say: '“If and only if” says more: the converse too. That is only one direction.' },
    { t: formOf(c, 'converse'), mc: MC.iffOne, say: 'That is only the “only if” half. “If and only if” says both directions.' },
    { t: `${cap(c.p1)}, and ${c.q2}.`, say: 'It does not say both parts happen. It says each one comes with the other.' },
  ]);
};
const iffTrue: Gen = (R, n) => {
  const same = R() < 0.4;
  const c = same ? samePair(R, 'iffTrue')
    : numPair(R, x => !x.s.p.length && x.s.q.length >= 1 && x.s.pq.length >= 1, 'iffTrue');
  const iff = `${A(c.P.says)} if and only if ${B(c.Q.says)}.`;
  const opts: Opt[] = same ? [
    { t: 'True: both directions hold for every <i>n</i> in the domain', ok: true, say: 'Yes: the two regions hold exactly the same members.' },
    { t: 'False: only one direction holds', say: 'Check both: every member with one part has the other too.' },
    { t: `False: ${nEq(pick(R, c.s.o))} has neither part`, mc: MC.falseHyp, say: 'A member with neither part fits “if and only if”: both sides are false together.' },
  ] : (() => {
    const w = pick(R, c.s.q);
    return [
      { t: `False: ${nEq(w)} makes the second part true and the first part false`, ok: true, say: `Yes: the converse direction fails at ${w}.` },
      { t: 'True: every <i>n</i> that makes the first part true makes the second part true', mc: MC.iffOne, say: `That checks only one direction. “If and only if” needs the converse too: look at ${w}.` },
      { t: `False: ${nEq(pick(R, c.s.pq))} makes the first part true and the second part false`, say: 'Check that member again: it makes both parts true.' },
    ];
  })();
  return choiceItem(R, {
    id: `iffTrue-${n}`, family: 'iffTrue', prompt: `${DOM(c.lo, c.hi)} Is this statement true for every <i>n</i> in the domain?<br>${iff}`, board: 'p \\leftrightarrow q',
    picture: { euler: eulerOf(c.xs, c.P, c.Q, c.lo, c.hi, same ? { zones: [['pq', 'link']] } : { zones: [['q', 'wrong']], glow: c.s.q.map(v => [idx(c.xs, v), 'wrong'] as [number, Paint]) }) },
    solution: ['“If and only if” is true when both directions hold: no member has one part without the other.', same ? 'The amber and teal regions hold the same members.' : `${c.s.q.map(H).join(', ')} ${c.s.q.length > 1 ? 'have' : 'has'} the second part but not the first.`, `So: ${ans(opts.find(o => o.ok)!.t)}.`],
  }, opts);
};
const ifAsIff: Gen = (R, n) => {
  const promisers = ['The coach', 'Ms. Reyes', 'The store', 'Dad', 'The manager'];
  const c = pick(R, PAIRS)(R).c;
  const who = pick(R, promisers), broken = R() < 0.3;
  const caseTxt = broken ? `${cap(c.p1)}, and ${c.nq1}.` : `${cap(c.np1)}, and ${c.q1}.`;
  const opts: Opt[] = broken ? [
    { t: 'Yes: the hypothesis happened and the conclusion did not', ok: true, say: 'Yes: that is the one case the promise rules out.' },
    { t: 'No: a promise is only broken when the hypothesis is false', mc: MC.falseHyp, say: 'It is the other way round: the promise is broken only when the hypothesis happens and the conclusion does not.' },
    { t: 'No: the promise does not cover this case', say: 'The hypothesis happened, so the promise covers it, and the conclusion failed.' },
  ] : [
    { t: 'No: the promise only says what happens when the hypothesis is true', ok: true, say: 'Yes: here the hypothesis is false, so the promise made no claim, and it is not broken.' },
    { t: 'Yes: the promise means the conclusion happens only when the hypothesis does', mc: MC.converseTrue, say: 'That reads it as “if and only if”. The promise only says what follows when the hypothesis is true.' },
    { t: 'Yes: the hypothesis is false, so the promise is false', mc: MC.falseHyp, say: 'A false hypothesis does not break a promise: it simply does not apply.' },
  ];
  return choiceItem(R, {
    id: `ifAsIff-${n}`, family: 'ifAsIff', prompt: `${who} says: “${formOf(c, 'original').replace(/\.$/, '')}.”<br>What happened: ${caseTxt} Is the promise broken?`, board: 'p \\to q',
    picture: { table: { head: ['p', 'q', 'p \\to q'], headCol: ['first', 'second', 'ink'], rows: CASES.map(([a, b]) => [a ? 'T' : 'F', b ? 'T' : 'F', a && !b ? 'F' : 'T']), keys: 2, start: [], ask: [[broken ? 1 : 2, 2]], ring: broken ? 1 : 2, reveal: { cols: [2], rings: [[1, 'wrong']] } } },
    solution: [`What happened: <i>p</i> ${broken ? 'true' : 'false'}, <i>q</i> ${broken ? 'false' : 'true'}.`, 'A promise “if p, then q” is broken only when p happens and q does not.', `So: ${ans(opts.find(o => o.ok)!.t)}.`],
  }, opts);
};

// ===================== 7 universal-quantifier =====================
const allTrue: Gen = (R, n) => {
  const one = R() < 0.45;
  if (one) {
    for (;;) {
      const lo = pick(R, [1, 0, 2, 3]), hi = lo + int(R, 9, 11), xs = range(lo, hi);
      const P = randPred(R, lo, hi), sat = xs.filter(P.test), bad = xs.filter(v => !P.test(v));
      if (sat.length < 3 || bad.length > 3) continue;
      const tru = bad.length === 0;
      if (tru) continue;   // a predicate true on all of a 10-member range is rare; the two-region form covers "true"
      const w = pick(R, bad), ex = shuffle(R, sat.slice()).slice(0, 3).sort((a, b) => a - b);
      const pic = eulerOf(xs, P, null, lo, hi, { zones: [['o', 'wrong']], glow: [[idx(xs, w), 'wrong']] });
      if (!eulerFits(pic)) continue;
      return choiceItem(R, {
        id: `allTrue-${n}`, family: 'allTrue', prompt: `${DOM(lo, hi)} True or false: for every <i>n</i> in the domain, ${A(P.says)}.`, board: '\\forall n',
        picture: { euler: pic },
        solution: ['An “every” statement must hold for each member of the domain; one exception makes it false.', `${bad.map(H).join(', ')} ${bad.length > 1 ? 'do' : 'does'} not make ${A(P.says)} true.`, `So: ${ans(`False: ${nEq(w)} is an exception`)}.`],
      }, [
        { t: `False: ${nEq(w)} is an exception`, ok: true, say: `Yes: ${w} is in the domain and fails, so “every” is false.` },
        { t: `True: it works for ${ex.map(nEq).join(', ')}`, mc: MC.allChecked, say: `Three examples do not check every member. Look at ${nEq(w)}.` },
        { t: `False: ${nEq(sat.find(v => !ex.includes(v)) ?? sat[0]!)} is an exception`, say: 'Check that member again: it does make it true.' },
      ]);
    }
  }
  const tru = R() < 0.45;
  const c = numPair(R, x => (tru ? !x.s.p.length : x.s.p.length >= 1) && x.s.pq.length >= (tru ? 2 : 3), 'allTrue');
  const ex = shuffle(R, c.s.pq.slice()).slice(0, 3).sort((a, b) => a - b);
  const notEx = pick(R, [...c.s.pq, ...c.s.q, ...c.s.o]);
  const claim = `for every <i>n</i> in the domain, ${lower(stmt(c.P, c.Q)).replace(/\.$/, '')}`;
  const opts: Opt[] = tru ? [
    { t: 'True: no member has the hypothesis without the conclusion', ok: true, say: 'Yes: every member in the amber region is inside the teal one.' },
    { t: `False: ${nEq(notEx)} is an exception`, mc: c.P.test(notEx) ? undefined : MC.falseHyp, say: c.P.test(notEx) ? 'Check that member again: both parts are true for it.' : 'For that member the hypothesis is false: it cannot be an exception.' },
    { t: `False: ${nEq(pick(R, c.s.pq.filter(v => v !== notEx).length ? c.s.pq.filter(v => v !== notEx) : c.s.pq))} is an exception`, say: 'Check that member again: both parts are true for it.' },
  ] : (() => {
    const w = pick(R, c.s.p);
    return [
      { t: `False: ${nEq(w)} is an exception`, ok: true, say: `Yes: ${w} has the hypothesis and not the conclusion.` },
      { t: `True: it works for ${ex.map(nEq).join(', ')}`, mc: MC.allChecked, say: `Checked examples are not every member. Look at ${nEq(w)}.` },
      { t: `False: ${nEq(notEx)} is an exception`, mc: c.P.test(notEx) ? undefined : MC.falseHyp, say: c.P.test(notEx) ? 'Check that member again: both parts are true for it.' : 'For that member the hypothesis is false: it cannot be an exception.' },
    ];
  })();
  return choiceItem(R, {
    id: `allTrue-${n}`, family: 'allTrue', prompt: `${DOM(c.lo, c.hi)} True or false: ${claim}.`, board: '\\forall n',
    picture: { euler: eulerOf(c.xs, c.P, c.Q, c.lo, c.hi, tru ? { zones: [['P', 'link']] } : { zones: [['p', 'wrong']], glow: c.s.p.map(v => [idx(c.xs, v), 'wrong'] as [number, Paint]) }) },
    solution: ['“For every n” means each member of the domain; one member with the hypothesis and without the conclusion makes it false.', tru ? 'Every member in the amber region is inside the teal region.' : `${c.s.p.map(H).join(', ')} ${c.s.p.length > 1 ? 'have' : 'has'} the hypothesis but not the conclusion.`, `So: ${ans(opts.find(o => o.ok)!.t)}.`],
  }, opts);
};
interface Claim { h: string; test: (n: number) => boolean }
const CLAIMS: Claim[] = [
  { h: '<i>n</i> + 3 &gt; <i>n</i>', test: n => n + 3 > n }, { h: '2<i>n</i> &gt; <i>n</i>', test: n => 2 * n > n },
  { h: '<i>n</i>² ≥ <i>n</i>', test: n => n * n >= n }, { h: '<i>n</i>² &gt; <i>n</i>', test: n => n * n > n },
  { h: '−<i>n</i> &lt; <i>n</i>', test: n => -n < n }, { h: '<i>n</i>(<i>n</i> + 1) is even', test: n => (n * (n + 1)) % 2 === 0 },
  { h: '<i>n</i>² + 1 is odd', test: n => Math.abs((n * n + 1) % 2) === 1 }, { h: '3<i>n</i> ≥ <i>n</i>', test: n => 3 * n >= n },
  { h: '(<i>n</i> + 1)² = <i>n</i>² + 1', test: n => (n + 1) ** 2 === n * n + 1 }, { h: '<i>n</i> − 5 &lt; <i>n</i>', test: n => n - 5 < n },
  { h: '<i>n</i>² ≠ 2<i>n</i>', test: n => n * n !== 2 * n }, { h: '|<i>n</i>| ≥ <i>n</i>', test: n => Math.abs(n) >= n },
  { h: '<i>n</i>² is even', test: n => (n * n) % 2 === 0 }, { h: '5<i>n</i> ≠ <i>n</i>', test: n => 5 * n !== n },
];
const implicitAll: Gen = (R, n) => {
  const cl = pick(R, CLAIMS);
  const cands = range(-6, 8);
  const fails = cands.filter(v => !cl.test(v)).sort((a, b) => Math.abs(a) - Math.abs(b) || b - a), works = cands.filter(v => cl.test(v));
  const tru = fails.length === 0;
  const pos = works.filter(v => v > 0);
  const ex = shuffle(R, pos.length >= 3 ? pos : works.slice()).slice(0, 3).sort((a, b) => a - b);
  const nonFail = shuffle(R, works.filter(v => !ex.includes(v)));
  let opts: Opt[];
  if (tru) opts = [
    { t: 'True for every integer <i>n</i>', ok: true, say: 'Yes: no integer breaks it.' },
    { t: `False: ${nEq(nonFail[0]!)} fails`, say: `Check ${H(nonFail[0]!)}: it works.` },
    { t: `False: ${nEq(nonFail[1]!)} fails`, say: `Check ${H(nonFail[1]!)}: it works.` },
  ];
  else {
    const w = pick(R, fails);
    opts = [
      { t: `False: ${nEq(w)} fails`, ok: true, say: `Yes: at ${H(w)} it is false, and one integer is enough.` },
      { t: `True: it works for ${ex.map(nEq).join(', ')}`, mc: MC.allChecked, say: `“For every integer” includes 0 and the negatives. Try ${H(w)}.` },
      { t: 'True for every integer <i>n</i>', say: `Try ${H(w)}.` },
    ];
    if (nonFail.length) opts.push({ t: `False: ${nEq(nonFail[0]!)} fails`, say: `Check ${H(nonFail[0]!)}: it works.` });
  }
  return choiceItem(R, {
    id: `implicitAll-${n}`, family: 'implicitAll', prompt: `A claim with no “all” written: ${A(cl.h)}. (<i>n</i> is any integer.) It claims this for every integer. Is it true?`, board: '\\forall n',
    picture: { card: { lines: [`${A(cl.h)}`, '(n is any integer)'], reveal: [tru ? 'No integer breaks it.' : `Try n = ${H(fails[0]!)}: it is false.`] } },
    solution: ['A claim about a variable with no domain words means: for every value of the variable.', tru ? 'It holds for every integer, including 0 and the negatives.' : `It fails for ${fails.slice(0, 3).map(H).join(', ')}${fails.length > 3 ? ' and more' : ''}.`, `So: ${ans(opts.find(o => o.ok)!.t)}.`],
  }, opts);
};

// ===================== 8 existential-quantifier =====================
const someTrue: Gen = (R, n) => {
  const tru = R() < 0.65, allQual = tru && R() < 0.35;
  const c = numPair(R, x => (tru ? x.s.pq.length >= 1 : x.s.pq.length === 0) && x.s.p.length + x.s.pq.length >= 2 && (allQual ? !x.s.p.length : true) && (!tru || x.s.p.length + x.s.q.length + x.s.o.length >= 1), 'someTrue');
  const non = [...c.s.p, ...c.s.q, ...c.s.o];
  const claim = `some <i>n</i> in the domain makes both “${A(c.P.says)}” and “${B(c.Q.says)}” true`;
  const w = tru ? pick(R, c.s.pq) : 0;
  const opts: Opt[] = tru ? [
    { t: `True: ${nEq(w)} is one`, ok: true, say: `Yes: ${w} has both, and one is enough for “some”.` },
    { t: `True: ${nEq(pick(R, non))} is one`, say: 'Check that member again: it does not have both parts.' },
    allQual ? { t: 'False: every one with the first part has the second, so “some” is wrong', mc: MC.allSome, say: '“Some” means at least one. It is still true when all of them qualify.' }
      : { t: 'False: no <i>n</i> in the domain has both', say: `Look at ${w}.` },
  ] : [
    { t: 'False: no <i>n</i> in the domain has both', ok: true, say: 'Yes: the amber and teal regions share no member.' },
    { t: `True: ${nEq(pick(R, c.s.p.length ? c.s.p : non))} is one`, say: 'Check that member: it does not have both parts.' },
    { t: `True: ${nEq(pick(R, c.s.q.length ? c.s.q : non))} is one`, say: 'Check that member: it does not have both parts.' },
  ];
  if (new Set(opts.map(o => o.t)).size < opts.length) return someTrue(R, n, 'existential-quantifier');
  return choiceItem(R, {
    id: `someTrue-${n}`, family: 'someTrue', prompt: `${DOM(c.lo, c.hi)} True or false: ${claim}.`, board: '\\exists n',
    picture: { euler: eulerOf(c.xs, c.P, c.Q, c.lo, c.hi, tru ? { zones: [['pq', 'link']], glow: [[idx(c.xs, w), 'link']] } : { zones: [['pq', 'wrong']] }) },
    solution: ['“Some” means at least one member of the domain: one witness makes it true.', tru ? `${c.s.pq.map(H).join(', ')} ${c.s.pq.length > 1 ? 'have' : 'has'} both parts.` : 'No member has both parts.', `So: ${ans(opts.find(o => o.ok)!.t)}.`],
  }, opts);
};
const witnessCount: Gen = (R, n) => {
  const c = numPair(R, x => x.s.pq.length >= 1 && x.s.p.length >= 1, 'witnessCount');
  const k = c.s.pq.length, partial = c.s.pq.length + c.s.p.length;
  return numItem({
    id: `witnessCount-${n}`, family: 'witnessCount', prompt: `${DOM(c.lo, c.hi)} “Some <i>n</i> in the domain makes both ${A(c.P.says)} and ${B(c.Q.says)} true.” How many members of the domain are witnesses (make both parts true)?`,
    board: '\\exists n', unit: 'witnesses',
    picture: { euler: eulerOf(c.xs, c.P, c.Q, c.lo, c.hi, { zones: [['pq', 'link']], glow: c.s.pq.map(v => [idx(c.xs, v), 'link'] as [number, Paint]) }) },
    solution: ['A witness must make both parts true: it sits where the amber and teal regions overlap.', `Both parts: ${c.s.pq.map(H).join(', ')}.`, `That is ${ans(k)} ${k === 1 ? "witness" : "witnesses"}.`],
  }, k, v => v === k ? { ok: true, say: `Yes: ${k} members have both parts.` }
    : v === partial ? { ok: false, mc: MC.someConditions, say: 'Those have the first part. A witness needs the second part too.' }
      : { ok: false, say: 'Check each member for both parts and count the ones that have both.' });
};

// ===================== 9 logical-equivalence =====================
interface OpenPair { a: string; b: string; ta: string; tb: string; fa: (x: number) => boolean; fb: (x: number) => boolean; D: number[] }
function openPair(R: () => number): OpenPair {
  const k = int(R, 0, 4), c = int(R, 2, 6);
  const choose = (eqD: number[], diffD: number[]) => (R() < 0.45 ? eqD : diffD);
  if (k === 0) return { a: `<i>x</i> &gt; ${c - 1}`, b: `<i>x</i> ≥ ${c}`, ta: `x > ${c - 1}`, tb: `x \\ge ${c}`, fa: x => x > c - 1, fb: x => x >= c, D: choose([c - 2, c - 1, c, c + 1], [c - 1, c - 0.5, c, c + 1]) };
  if (k === 1) return { a: `<i>x</i> &lt; ${c + 1}`, b: `<i>x</i> ≤ ${c}`, ta: `x < ${c + 1}`, tb: `x \\le ${c}`, fa: x => x < c + 1, fb: x => x <= c, D: choose([c - 1, c, c + 1, c + 2], [c - 1, c, c + 0.5, c + 1]) };
  if (k === 2) return { a: `<i>x</i>² = ${c * c}`, b: `<i>x</i> = ${c}`, ta: `x^2 = ${c * c}`, tb: `x = ${c}`, fa: x => x * x === c * c, fb: x => x === c, D: choose([0, 1, c, c + 1], [-c, 0, c, c + 1]) };
  if (k === 3) return { a: `|<i>x</i>| = ${c}`, b: `<i>x</i> = ${c}`, ta: `|x| = ${c}`, tb: `x = ${c}`, fa: x => Math.abs(x) === c, fb: x => x === c, D: choose([1, c, c + 1, c + 2], [-c, 1, c, c + 2]) };
  return { a: '<i>x</i> is a multiple of 4', b: '<i>x</i> is even', ta: 'x\\ \\text{mult. of } 4', tb: 'x\\ \\text{even}', fa: x => x % 4 === 0, fb: x => x % 2 === 0, D: choose([4, 5, 8, 9], [4, 6, 8, 9]) };
}
const fmtD = (x: number) => (x < 0 ? `−${-x}` : String(x));
const equivOnD: Gen = (R, n) => {
  const o = openPair(R);
  const D = o.D.slice().sort((a, b) => a - b);
  const diff = D.filter(x => o.fa(x) !== o.fb(x)), agree = D.filter(x => o.fa(x) === o.fb(x));
  const both = D.filter(x => o.fa(x) && o.fb(x));
  const eq = diff.length === 0;
  const opts: Opt[] = eq ? [
    { t: 'Equivalent on <i>D</i>: the same truth value at every member', ok: true, say: 'Yes: at each member of D they are both true or both false.' },
    { t: `Not equivalent: they differ at <i>x</i> = ${fmtD(agree[0]!)}`, say: `Check ${fmtD(agree[0]!)}: they have the same truth value there.` },
    { t: `Not equivalent: they differ at <i>x</i> = ${fmtD(agree[agree.length - 1]!)}`, say: `Check ${fmtD(agree[agree.length - 1]!)}: they have the same truth value there.` },
  ] : (() => {
    const w = pick(R, diff), a = both[0] ?? agree[0]!;
    return [
      { t: `Not equivalent on <i>D</i>: they differ at <i>x</i> = ${fmtD(w)}`, ok: true, say: `Yes: at ${fmtD(w)} one is true and the other is false.` },
      { t: `Equivalent: they agree at <i>x</i> = ${fmtD(a)}`, mc: MC.examples, say: 'Agreeing at one member is not enough: they must agree at every member of D.' },
      { t: `Not equivalent: they differ at <i>x</i> = ${fmtD(agree.find(x => x !== a) ?? agree[0]!)}`, say: 'Check that member: they agree there.' },
    ];
  })();
  if (new Set(opts.map(x => x.t)).size < opts.length) return equivOnD(R, n);
  const row = (x: number) => [fmtD(x).replace('−', '-'), o.fa(x) ? 'T' : 'F', o.fb(x) ? 'T' : 'F'];
  return choiceItem(R, {
    id: `equivOnD-${n}`, family: 'equivOnD', prompt: `Domain <i>D</i> = {${D.map(fmtD).join(', ')}}. Are ${A(o.a)} and ${B(o.b)} equivalent on <i>D</i>?`, board: 'A \\equiv B',
    picture: { table: { head: ['x', o.ta, o.tb], headCol: ['dim', 'first', 'second'], rows: D.map(row), keys: 1, start: [], reveal: { cols: [1, 2], rings: diff.map(x => [D.indexOf(x), 'wrong'] as [number, Paint]) } } },
    solution: ['Equivalent on D means: the same truth value at EVERY member of D.', eq ? 'At each member they are both true or both false.' : `At ${diff.map(fmtD).join(' and ')} one is true and the other false.`, `So: ${ans(opts.find(x => x.ok)!.t)}.`],
  }, opts);
};
const CASE_W = ([p, q]: Case) => `<i>p</i> is ${p ? 'true' : 'false'} and <i>q</i> is ${q ? 'true' : 'false'}`;
const formsEquiv: Gen = (R, n) => {
  const f = pick(R, ['converse', 'inverse', 'contrapositive', 'contrapositive', 'iff'] as const);
  const cx = R() < 0.5 ? pick(R, PAIRS)(R).c : pick(R, SUBJ)().c;
  const diff = CASES.filter(cs => valueOf('original', cs) !== valueOf(f, cs)), agree = CASES.filter(cs => valueOf('original', cs) === valueOf(f, cs));
  const fH = (s: string) => s.replace(/\\sim/g, '~').replace(/[{}]/g, '').replace(/\\to/g, '→').replace(/\\leftrightarrow/g, '↔').replace(/~ /g, '~').replace(/\b([pq])\b/g, '<i>$1</i>');
  const name = f === 'iff' ? fH(FORM_TEX.iff) : `its ${f}, ${fH(FORM_TEX[f])}`;
  const eq = diff.length === 0;
  const opts: Opt[] = eq ? [
    { t: 'Equivalent: the same truth value in all four cases', ok: true, say: 'Yes: the columns match row by row.' },
    { t: `Not equivalent: they differ when ${CASE_W(pick(R, agree))}`, say: 'Check that row: the two columns agree there.' },
    { t: 'Not equivalent: one of them is about ~<i>p</i> and ~<i>q</i>', say: 'Different words can still say the same thing: compare the columns, row by row.' },
  ] : (() => {
    const w = pick(R, diff), a = pick(R, agree.filter(cs => cs[0] && cs[1]).length ? agree.filter(cs => cs[0] && cs[1]) : agree);
    return [
      { t: `Not equivalent: they differ when ${CASE_W(w)}`, ok: true, say: 'Yes: in that row one column is T and the other F.' },
      { t: `Equivalent: they agree when ${CASE_W(a)}`, mc: MC.examples, say: 'One row is not enough: equivalent forms agree in all four rows.' },
      { t: `Not equivalent: they differ when ${CASE_W(agree.find(cs => cs !== a) ?? a)}`, say: 'Check that row: the two columns agree there.' },
    ];
  })();
  if (new Set(opts.map(x => x.t)).size < opts.length) return formsEquiv(R, n);
  return choiceItem(R, {
    id: `formsEquiv-${n}`, family: 'formsEquiv', prompt: `Let <i>p</i> be “${A(cx.p1)}” and <i>q</i> be “${B(cx.q1)}”. Compare ${formOf(cx, 'original')} (<i>p</i> → <i>q</i>) with ${name}${f === 'iff' ? ` (“${cap(cx.p1)} if and only if ${cx.q2}”)` : `: ${formOf(cx, f as Form)}`} Over the four cases, are they logically equivalent?`, board: `${FORM_TEX.original}\\ \\ ${FORM_TEX[f]}`,
    picture: { table: { head: ['p', 'q', FORM_TEX.original, FORM_TEX[f]], headCol: ['first', 'second', 'ink', 'pick'], rows: CASES.map(cs => [cs[0] ? 'T' : 'F', cs[1] ? 'T' : 'F', valueOf('original', cs) ? 'T' : 'F', valueOf(f, cs) ? 'T' : 'F']), keys: 2, start: [2], ask: CASES.map((_, i) => [i, 3] as [number, number]), reveal: { cols: [3], rings: diff.map(cs => [CASES.indexOf(cs), 'wrong'] as [number, Paint]) } } },
    solution: [`Fill the column of ${fH(FORM_TEX[f])}: it is false only when its own hypothesis is true and its conclusion false.`, eq ? 'The two columns match in all four rows.' : `They differ in the row${diff.length > 1 ? 's' : ''} where ${diff.map(CASE_W).join(', and where ')}.`, `So: ${ans(opts.find(x => x.ok)!.t)}.`],
  }, opts);
};

// ===================== 10 negate-universal =====================
interface Quant { all: string; someNot: string; none: string; allNot: string; some: string }
const EVERYDAY_ALL: Quant[] = [
  { all: 'All the players on the team are over 6 feet tall.', someNot: 'Some player on the team is not over 6 feet tall.', none: 'No player on the team is over 6 feet tall.', allNot: 'All the players on the team are not over 6 feet tall.', some: 'Some player on the team is over 6 feet tall.' },
  { all: 'Every student in the class passed the test.', someNot: 'Some student in the class did not pass the test.', none: 'No student in the class passed the test.', allNot: 'Every student in the class failed the test.', some: 'Some student in the class passed the test.' },
  { all: 'Every triangle in the figure has a right angle.', someNot: 'Some triangle in the figure does not have a right angle.', none: 'No triangle in the figure has a right angle.', allNot: 'Every triangle in the figure has no right angle.', some: 'Some triangle in the figure has a right angle.' },
  { all: 'All the stores on Main Street are open on Sunday.', someNot: 'Some store on Main Street is not open on Sunday.', none: 'No store on Main Street is open on Sunday.', allNot: 'All the stores on Main Street are closed on Sunday.', some: 'Some store on Main Street is open on Sunday.' },
  { all: 'Every angle of the polygon measures 120°.', someNot: 'Some angle of the polygon does not measure 120°.', none: 'No angle of the polygon measures 120°.', allNot: 'Every angle of the polygon measures something other than 120°.', some: 'Some angle of the polygon measures 120°.' },
];
const negAll: Gen = (R, n) => {
  let q: Quant, dom = '';
  if (R() < 0.4) q = pick(R, EVERYDAY_ALL);
  else {
    const lo = pick(R, [1, 0, 2]), hi = lo + 11, P = randPred(R, lo, hi);
    dom = DOM(lo, hi) + ' ';
    q = { all: `For every <i>n</i> in the domain, ${P.says}.`, someNot: `For some <i>n</i> in the domain, ${P.neg}.`, none: `For no <i>n</i> in the domain, ${P.says}.`, allNot: `For every <i>n</i> in the domain, ${P.neg}.`, some: `For some <i>n</i> in the domain, ${P.says}.` };
  }
  return choiceItem(R, {
    id: `negAll-${n}`, family: 'negAll', prompt: `${dom}What is the negation of this statement?<br>${A(q.all)}`, board: '{\\sim}\\forall = \\exists{\\sim}',
    picture: { card: { lines: [A(q.all)], reveal: [`Negation: ${B(q.someNot)}`, 'Not all = at least one is not.'] } },
    solution: ['“Not all” means at least one exception, in the same domain.'],
  }, [
    { t: q.someNot, ok: true, say: 'Yes: “not all” means at least one exception.' },
    { t: q.none, mc: MC.notAllNone, say: '“Not all” is not “none”: one exception is enough to make “all” false.' },
    { t: q.allNot, mc: MC.notAllNone, say: 'That says every one fails. “Not all” only needs one that fails.' },
    { t: q.some, say: 'That can be true at the same time as the statement: it is not its negation.' },
  ]);
};
type ShapeKey = keyof typeof SHAPES;
const QUAD_KEYS: ShapeKey[] = ['square', 'rect', 'rhombus', 'para', 'trap', 'kite', 'rightTrap'];
const TRI_KEYS: ShapeKey[] = ['equi', 'iso', 'rightTri', 'rightIso', 'scalene'];
function shapeSet(R: () => number, tri: boolean): Shape[] {
  const keys = tri ? TRI_KEYS : QUAD_KEYS;
  const base = shuffle(R, keys.slice()).slice(0, int(R, 4, 5)).map(k => (k === 'square' ? SHAPES.square(pick(R, [0, 15, 30]), pick(R, [32, 38])) : SHAPES[k]()));
  while (base.length < 6) { const k = pick(R, keys); base.push(k === 'square' ? SHAPES.square(pick(R, [0, 20]), pick(R, [30, 36])) : SHAPES[k]()); }
  return shuffle(R, base);
}
const SHAPE_KEY = 'A small square marks a right angle; matching tick marks show equal sides, unmarked sides are not equal.';
const negAllWitness: Gen = (R, n) => {
  for (;;) {
    const tri = R() < 0.35, shapes = shapeSet(R, tri);
    const P = tri ? pick(R, [shapePreds.rightAngle, shapePreds.twoEqual, shapePreds.threeEqual]) : pick(R, [shapePreds.fourRight, shapePreds.fourEqual]);
    const yes = shapes.map((s, i) => i).filter(i => P.test(shapes[i]!)), no = shapes.map((s, i) => i).filter(i => !P.test(shapes[i]!));
    if (yes.length < 2 || no.length < 1) continue;
    const w = pick(R, no), others = shuffle(R, yes.slice()).slice(0, 2);
    const kind = tri ? 'triangle' : 'quadrilateral';
    const pic: EulerPic = { layout: 'one', domain: `the ${shapes.length} ${kind}s shown`, P: P.label, tokens: shapes.map((s, i) => ({ shape: s, letter: LETTERS[i], zone: P.test(s) ? 'p' : 'o' })), reveal: { zones: [['o', 'wrong']], glow: [[w, 'wrong']] } };
    if (!eulerFits(pic)) continue;
    return choiceItem(R, {
      id: `negAllWitness-${n}`, family: 'negAllWitness', prompt: `Domain: the ${kind}s A to ${LETTERS[shapes.length - 1]}. ${SHAPE_KEY} The statement “${pick(R, [`Not every ${kind} shown has ${P.label}`, `Not all the ${kind}s shown have ${P.label}`, `It is false that every ${kind} shown has ${P.label}`])}” is true. Which ${kind} shows it?`,
      board: '{\\sim}\\forall', picture: { euler: pic },
      solution: [`“Not every ${kind} has ${P.label}” needs one ${kind} without it.`, `${kind.charAt(0).toUpperCase() + kind.slice(1)} ${LETTERS[w]} does not have ${P.label} (look at its marks).`],
    }, [w, ...others].map((i, j) => ({ t: `${cap(kind)} ${LETTERS[i]}`, ok: j === 0, say: j === 0 ? `Yes: ${LETTERS[i]} does not have ${P.label}.` : `${LETTERS[i]} does have ${P.label}: it agrees with “every”, it is not an exception.` })));
  }
};

// ===================== 11 negate-existential =====================
const EVERYDAY_SOME: { some: string; none: string; someNot: string; all: string }[] = [
  { some: 'Some students in the class have a pet.', none: 'No student in the class has a pet.', someNot: 'Some students in the class do not have a pet.', all: 'All the students in the class have a pet.' },
  { some: 'There is a quadrilateral in the figure with four right angles.', none: 'No quadrilateral in the figure has four right angles.', someNot: 'There is a quadrilateral in the figure without four right angles.', all: 'Every quadrilateral in the figure has four right angles.' },
  { some: 'At least one store on Main Street is open late.', none: 'No store on Main Street is open late.', someNot: 'At least one store on Main Street is not open late.', all: 'Every store on Main Street is open late.' },
  { some: 'Some angle of the triangle is obtuse.', none: 'No angle of the triangle is obtuse.', someNot: 'Some angle of the triangle is not obtuse.', all: 'Every angle of the triangle is obtuse.' },
  { some: 'Some player on the team scored a goal.', none: 'No player on the team scored a goal.', someNot: 'Some player on the team did not score a goal.', all: 'Every player on the team scored a goal.' },
];
const negSome: Gen = (R, n) => {
  let q: { some: string; none: string; someNot: string; all: string }, dom = '';
  if (R() < 0.4) q = pick(R, EVERYDAY_SOME);
  else {
    const lo = pick(R, [1, 0, 2]), hi = lo + 11, P = randPred(R, lo, hi);
    dom = DOM(lo, hi) + ' ';
    q = { some: `For some <i>n</i> in the domain, ${P.says}.`, none: R() < 0.5 ? `For no <i>n</i> in the domain, ${P.says}.` : `For every <i>n</i> in the domain, ${P.neg}.`, someNot: `For some <i>n</i> in the domain, ${P.neg}.`, all: `For every <i>n</i> in the domain, ${P.says}.` };
  }
  return choiceItem(R, {
    id: `negSome-${n}`, family: 'negSome', prompt: `${dom}What is the negation of this statement?<br>${A(q.some)}`, board: '{\\sim}\\exists = \\forall{\\sim}',
    picture: { card: { lines: [A(q.some)], reveal: [`Negation: ${B(q.none)}`, 'Not even one: every one fails.'] } },
    solution: ['“Some” is true when at least one member works; its negation says not even one works.'],
  }, [
    { t: q.none, ok: true, say: 'Yes: not even one member works.' },
    { t: q.someNot, mc: MC.someKeeps, say: 'That can be true at the same time as the statement. The negation of “some” is “none”.' },
    { t: q.all, say: 'That would make the statement even more true. The negation must be true exactly when the statement is false.' },
  ]);
};
const negSomeTruth: Gen = (R, n) => {
  const two = R() < 0.5;
  if (!two) {
    for (;;) {
      const lo = pick(R, [1, 0, 2, 3]), hi = lo + int(R, 9, 11), xs = range(lo, hi), P = randPred(R, lo, hi);
      const k = xs.filter(P.test).length, none = R() < 0.4;
      // "none" items: a predicate over a shifted domain that misses it entirely
      const Pn = none ? (pick(R, [cmp('>', hi + int(R, 0, 3)), cmp('<', lo - int(R, 0, 2)), mult(pick(R, [13, 14, 15, 16].filter(m => m > hi)) || 17)])) : P;
      if (!none && (k < 1 || k === xs.length)) continue;
      if (none && xs.some(Pn.test)) continue;
      const pic = eulerOf(xs, Pn, null, lo, hi, none ? { zones: [['P', 'wrong']] } : { zones: [['P', 'link']] });
      if (!eulerFits(pic)) continue;
      const some = `Some <i>n</i> in the domain makes “${Pn.says}” true.`, noneS = `No <i>n</i> in the domain makes “${Pn.says}” true.`;
      return choiceItem(R, {
        id: `negSomeTruth-${n}`, family: 'negSomeTruth', prompt: `${DOM(lo, hi)} Two statements about “${A(Pn.says)}”: exactly one of them is true. Which one?`, board: '\\exists \\ \\text{or}\\ {\\sim}\\exists',
        picture: { euler: pic },
        solution: ['A “some” statement and its “no” statement are negations: exactly one of them is true.', none ? 'No member of the domain makes it true.' : `${xs.filter(Pn.test).map(H).join(', ')} make${xs.filter(Pn.test).length > 1 ? '' : 's'} it true.`, `So: ${ans(none ? noneS : some)}`],
      }, [
        { t: some, ok: !none, say: none ? 'No member of the domain makes it true: there is no witness.' : 'Yes: there is a witness in the domain.' },
        { t: noneS, ok: none, say: none ? 'Yes: not one member of the domain makes it true.' : `Look again: ${xs.filter(Pn.test).map(H).join(', ')} make${xs.filter(Pn.test).length > 1 ? '' : 's'} it true.` },
      ], true);
    }
  }
  const tru = R() < 0.55;
  const c = numPair(R, x => (tru ? x.s.pq.length >= 1 : x.s.pq.length === 0), 'negSomeTruth');
  const some = `Some <i>n</i> in the domain makes both “${A(c.P.says)}” and “${B(c.Q.says)}” true.`, none = `No <i>n</i> in the domain makes both “${A(c.P.says)}” and “${B(c.Q.says)}” true.`;
  return choiceItem(R, {
    id: `negSomeTruth-${n}`, family: 'negSomeTruth', prompt: `${DOM(c.lo, c.hi)} Two statements about “${A(c.P.says)}” and “${B(c.Q.says)}”: exactly one of them is true. Which one?`, board: '\\exists \\ \\text{or}\\ {\\sim}\\exists',
    picture: { euler: eulerOf(c.xs, c.P, c.Q, c.lo, c.hi, tru ? { zones: [['pq', 'link']] } : { zones: [['P', 'wrong'], ['Q', 'wrong']] }) },
    solution: ['A “some” statement and its “no” statement are negations: exactly one of them is true.', tru ? `${c.s.pq.map(H).join(', ')} ${c.s.pq.length > 1 ? 'have' : 'has'} both parts.` : 'No member has both parts: the regions do not share a member.', `So: ${ans(tru ? some : none)}`],
  }, [
    { t: some, ok: tru, say: tru ? 'Yes: there is a witness in the overlap.' : 'No member has both parts: there is no witness.' },
    { t: none, ok: !tru, say: tru ? `Look again: ${c.s.pq.map(H).join(', ')} ${c.s.pq.length > 1 ? 'have' : 'has'} both parts.` : 'Yes: not one member has both parts.' },
  ], true);
};

// ===================== 12 form-inverse, 13 form-contrapositive =====================
/** a conditional with careful negations, and (for inequalities) the opposite-as-negation slip */
function relatedSet(R: () => number): { c: Clauses; opp: Clauses | null; dom: string } {
  const k = R();
  if (k < 0.5) { const t = ineqClauses(R); return { c: t.c, opp: t.opp, dom: t.v === 'x' ? '(<i>x</i> is any real number) ' : '(<i>n</i> is any integer) ' }; }
  if (k < 0.7) {
    const e = pick(R, ['<i>n</i> + 5', '<i>n</i> + 3', '<i>n</i>²', '2<i>n</i> + 7']);   // never the same as n > 0
    const c = pair('<i>n</i> is positive', `${e} is positive`, '<i>n</i> ≤ 0', `${e} ≤ 0`);
    const opp = pair('<i>n</i> is positive', `${e} is positive`, '<i>n</i> is negative', `${e} is negative`);
    return { c, opp, dom: '(<i>n</i> is any integer) ' };
  }
  const a = anyClauses(R, true);
  return { c: a.c, opp: null, dom: a.dom ? a.dom + ' ' : '' };
}
const ifThenOf = (c: Clauses, a: 'p' | 'np' | 'q' | 'nq', b: 'p' | 'np' | 'q' | 'nq') => {
  const first = { p: c.p1, np: c.np1, q: c.q1, nq: c.nq1 }[a], second = { p: c.p2, np: c.np2, q: c.q2, nq: c.nq2 }[b];
  return ifThen(first, second, true, a === 'p' || a === 'np');
};
const whichInverse: Gen = (R, n) => {
  const { c, opp, dom } = relatedSet(R);
  const opts: Opt[] = [
    { t: formOf(c, 'inverse'), ok: true, say: 'Yes: both parts negated, in the same order.' },
    { t: formOf(c, 'contrapositive'), mc: MC.invAsContra, say: 'That one also swaps the parts: it is the contrapositive. The inverse keeps the order.' },
    { t: ifThenOf(c, 'np', 'q'), mc: MC.invOne, say: 'Only the hypothesis is negated there. The inverse negates both parts.' },
  ];
  if (opp) opts.push({ t: formOf(opp, 'inverse'), mc: MC.negOpp, say: 'Check the boundaries: the negation of “greater than” is “less than or equal to”.' });
  return choiceItem(R, {
    id: `whichInverse-${n}`, family: 'whichInverse', prompt: `${dom}Statement: ${formOf(c, 'original')} Which is its inverse?`, board: FORM_TEX.inverse,
    picture: { card: { lines: [`Statement: ${formOf(c, 'original')}`], reveal: [`Inverse: ${formOf(c, 'inverse')}`, 'Negate both parts, keep the order.'] } },
    solution: ['The inverse negates the hypothesis and the conclusion and keeps their order: if not p, then not q.', `Negations: ${A(c.np1)}; ${B(c.nq1)}.`],
  }, opts);
};
const inverseFalse: Gen = (R, n) => {
  const c = numPair(R, x => !x.s.p.length && x.s.q.length >= 1 && x.s.pq.length >= 1 && x.s.o.length >= 1, 'inverseFalse');
  const inv = ifThen(c.P.neg, c.Q.neg, true, true);
  const w = pick(R, c.s.q);
  return choiceItem(R, {
    id: `inverseFalse-${n}`, family: 'inverseFalse', prompt: `${DOM(c.lo, c.hi)} The statement ${qt(stmt(c.P, c.Q))} is true for every <i>n</i> in the domain. Its inverse is ${qt(inv)}. Which value of <i>n</i> shows the inverse is false?`,
    board: FORM_TEX.inverse,
    picture: { euler: eulerOf(c.xs, c.P, c.Q, c.lo, c.hi, { zones: [['notP', 'pick'], ['q', 'wrong']], glow: [[idx(c.xs, w), 'wrong']], cross: [idx(c.xs, w)] }) },
    solution: [`The inverse breaks where its hypothesis ${A(c.P.neg)} is true and its conclusion ${B(c.Q.neg)} is false.`, `That is a member outside the amber region but inside the teal one: ${c.s.q.map(H).join(', ')}.`],
  }, [
    { t: nEq(w), ok: true, say: `Yes: ${w} is not in the amber region (hypothesis of the inverse true) but is in the teal one (its conclusion false).` },
    { t: nEq(pick(R, c.s.o)), say: 'For that member both negations are true: it agrees with the inverse.' },
    { t: nEq(pick(R, c.s.pq)), mc: MC.falseHyp, say: 'For that member the inverse\'s hypothesis is false, so it cannot break the inverse.' },
    { t: 'None: the inverse of a true statement is true', mc: MC.inverseError, say: `The inverse is a different statement and can be false. Look at ${nEq(w)}.` },
  ]);
};
const whichContra: Gen = (R, n) => {
  const { c, opp, dom } = relatedSet(R);
  const opts: Opt[] = [
    { t: formOf(c, 'contrapositive'), ok: true, say: 'Yes: swapped and both negated.' },
    { t: formOf(c, 'inverse'), mc: MC.formsMixed, say: 'That only negates: it is the inverse. The contrapositive also swaps the parts.' },
    { t: formOf(c, 'converse'), mc: MC.contraAsConv, say: 'That only swaps: it is the converse. The contrapositive swaps AND negates.' },
  ];
  if (opp) opts.push({ t: formOf(opp, 'contrapositive'), mc: MC.negOpp, say: 'Check the boundaries: the negation of “greater than” is “less than or equal to”.' });
  return choiceItem(R, {
    id: `whichContra-${n}`, family: 'whichContra', prompt: `${dom}Statement: ${formOf(c, 'original')} Which is its contrapositive?`, board: FORM_TEX.contrapositive,
    picture: { card: { lines: [`Statement: ${formOf(c, 'original')}`], reveal: [`Contrapositive: ${formOf(c, 'contrapositive')}`, 'Swap the parts and negate both.'] } },
    solution: ['The contrapositive swaps the hypothesis and the conclusion and negates both: if not q, then not p.', `Negations: ${B(c.nq1)}; ${A(c.np1)}.`],
  }, opts);
};
const nameForm: Gen = (R, n) => {
  const { c, dom } = R() < 0.6 ? anyClauses(R, true) : (() => { const t = relatedSet(R); return { c: t.c, dom: t.dom.trim() || undefined }; })();
  const f = pick(R, ['converse', 'inverse', 'contrapositive'] as Form[]);
  const MCN: Record<string, string | undefined> = {
    'contrapositive>inverse': MC.formsMixed, 'contrapositive>converse': MC.contraAsConv, 'inverse>contrapositive': MC.invAsContra,
    'inverse>converse': MC.converseNeg, 'converse>contrapositive': MC.contraAsConv, 'converse>inverse': MC.converseNeg,
  };
  const DESC: Record<string, string> = { converse: 'swaps the parts', inverse: 'negates both parts', contrapositive: 'swaps and negates both parts' };
  return choiceItem(R, {
    id: `nameForm-${n}`, family: 'nameForm', prompt: `${dom ? dom + ' ' : ''}Statement: ${formOf(c, 'original')}<br>New statement: ${formOf(c, f)}<br>What is the new statement called?`, board: 'p \to q\ \ \text{and}\ \ ?',
    picture: { card: { lines: [`Statement: ${formOf(c, 'original')}`, `New: ${formOf(c, f)}`], reveal: [`It ${DESC[f]}: the ${f}.`] } },
    solution: ['Compare the two: are the parts swapped? are they negated?', `The new statement ${DESC[f]}.`],
  }, (['converse', 'inverse', 'contrapositive'] as Form[]).map(g => ({ t: `The ${g}`, ok: g === f, mc: g === f ? undefined : MCN[`${f}>${g}`], say: g === f ? `Yes: it ${DESC[f]}.` : `The ${g} ${DESC[g]}. This one ${DESC[f]}.` })), true);
};

// ===================== registry =====================
export const GENERATORS: Record<string, Gen> = {
  statementKind, openTruth, negateIneq, negateProperty, negBoundary, ifThen: ifThenForm, hypConc, breaker, caseValue, whichConverse, converseTrue,
  iffMeans, iffTrue, ifAsIff, allTrue, implicitAll, someTrue, witnessCount, equivOnD, formsEquiv, negAll, negAllWitness, negSome, negSomeTruth,
  whichInverse, inverseFalse, whichContra, nameForm,
};
export const FAMILY_NAMES: Record<string, string> = {
  statementKind: 'Statement or not?', openTruth: 'True for how many?', negateIneq: 'Negate an inequality', negateProperty: 'Negate a property',
  negBoundary: 'The boundary test', ifThen: 'Into if-then form', hypConc: 'Hypothesis and conclusion', breaker: 'What breaks it?',
  caseValue: 'True in this case?', whichConverse: 'Find the converse', converseTrue: 'Is the converse true?', iffMeans: 'If and only if',
  iffTrue: 'Both directions?', ifAsIff: 'Broken promise?', allTrue: 'Every member?', implicitAll: 'The hidden “for all”',
  someTrue: 'Is there one?', witnessCount: 'Count the witnesses', equivOnD: 'Equivalent on D?', formsEquiv: 'Same in all four cases?',
  negAll: 'Negate “all”', negAllWitness: 'Find the exception', negSome: 'Negate “some”', negSomeTruth: 'Some or none?',
  whichInverse: 'Find the inverse', inverseFalse: 'Break the inverse', whichContra: 'Find the contrapositive', nameForm: 'Name the form',
};
