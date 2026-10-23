// items.ts: exercise families for "expand, combine, and factor linear expressions" (grade 7, 7.EE.A.1-2).
// A FAMILY is one deep structure; its items vary numbers, letters, contexts and wording. A generator gets the SUB-GOAL
// it practises (plan.ts) and uses that sub-goal's cases from the topic JSON (number ranges, signs, fractions).
// Every item is checked exactly (expr.ts) and every classic wrong answer is classified against the misconception
// catalogue (math-curriculum-essentials/misconceptions.json ids). PROBES lists, per item, the wrong responses the
// test feeds in to prove they are recognised. Pure: no DOM, no canvas.
import { type Item, type Response, type Verdict, int, pick, shuffle } from '../../runtime/item';
import {
  type Ex, type Fmt, type Q, type Term, decQ, exHtml, exTex, expand, factorHtml, factorTex, gcfOf, magHtml, magTex, nH, nT, neg, negEx,
  normal, num, prodHtml, prodTex, q, qAdd, qDiv, qEq, qMul, rat, same, t, termHtml, termTex, value, coef, addEx, divide, isZero,
} from './expr';
import { ans, endOnChoice } from '../../runtime/explain';
import { termTilesFit } from './TermTiles';
import { tilesFit } from './AreaModel';

export type FamilyId = 'equalSign' | 'likeTerms' | 'property' | 'areaToSum' | 'areaToProduct' | 'equivalent' | 'expand' | 'collect'
  | 'signedTerms' | 'expandCollect' | 'subtract' | 'factorOut' | 'gcf' | 'twoFactorings' | 'twoVar' | 'nameStep' | 'faultyStep'
  | 'counter' | 'context' | 'monomial' | 'monoFactor';
export const FAMILIES: readonly { id: FamilyId; name: string }[] = [
  { id: 'equalSign', name: 'True or false?' },
  { id: 'likeTerms', name: 'Like terms' },
  { id: 'property', name: 'Name the property' },
  { id: 'areaToSum', name: 'Area as a sum' },
  { id: 'areaToProduct', name: 'Area as a product' },
  { id: 'equivalent', name: 'Equivalent or not?' },
  { id: 'expand', name: 'Expand' },
  { id: 'collect', name: 'Combine like terms' },
  { id: 'signedTerms', name: 'Signs belong to terms' },
  { id: 'expandCollect', name: 'Expand, then combine' },
  { id: 'subtract', name: 'Add and subtract expressions' },
  { id: 'factorOut', name: 'Factor out' },
  { id: 'gcf', name: 'Factor completely' },
  { id: 'twoFactorings', name: 'Two factorings' },
  { id: 'twoVar', name: 'Two variables' },
  { id: 'nameStep', name: 'Justify the step' },
  { id: 'faultyStep', name: 'Find the faulty step' },
  { id: 'counter', name: 'Counterexample' },
  { id: 'context', name: 'What the form shows' },
  { id: 'monomial', name: 'Multiply by a monomial' },
  { id: 'monoFactor', name: 'Factor out a monomial' },
];
export const FAMILY_NAMES: Record<string, string> = Object.fromEntries(FAMILIES.map(f => [f.id, f.name]));

/** the picture of an item (the page knows how to draw each kind) */
export type Pic =
  | { kind: 'tiles'; a: number; p: number; q: number; unit?: string; letter?: string }
  | { kind: 'grid'; factor: Term; terms: Term[]; fmt: Fmt; ask?: { factor?: boolean; terms?: boolean; cells?: boolean }; signed?: boolean; letter?: string }
  | { kind: 'row'; terms: Term[]; letter?: string }
  | { kind: 'table'; A: Term[]; B: Term[]; aTex: string; bTex: string; xs: number[]; show: number[]; fmt?: Fmt };
export interface EFItem extends Item { family: FamilyId; pic?: Pic }
export interface Probe { r: Response; mc: string }
/** wrong responses whose misconception must be recognised (tests) */
export const PROBES = new WeakMap<Item, Probe[]>();

type R = () => number;
type Gen = (R: R, n: number, sg?: string) => EFItem;

// ---------- shared builders ----------
interface Base { family: FamilyId; n: number; sg?: string; prompt: string; board: string; solution: string[]; pic?: Pic }
interface Opt { t: string; ok?: boolean; mc?: string; say?: string }
function choiceItem(R: R, b: Base, opts: Opt[]): EFItem {
  const seen = new Set<string>(), list: Opt[] = [];
  for (const o of opts) if (!seen.has(o.t)) { seen.add(o.t); list.push(o); }
  const right = list.filter(o => o.ok);
  if (right.length !== 1) throw new Error(`${b.family}: ${right.length} right options in "${b.prompt}"`);
  const ch = shuffle(R, list);
  const it: EFItem = {
    id: `${b.family}.${b.n}`, family: b.family, subgoal: b.sg, prompt: b.prompt, board: b.board, input: 'choice', choices: ch.map(o => o.t),
    solution: endOnChoice(b.solution, right[0]!.t), pic: b.pic, answer: { kind: 'choice', i: ch.findIndex(o => o.ok) },
    check(r: Response): Verdict {
      if (r.kind !== 'choice' || !ch[r.i]) return { ok: false, say: 'Pick one of the answers.' };
      const o = ch[r.i]!;
      return o.ok ? { ok: true, say: o.say ?? 'Yes.' } : { ok: false, mc: o.mc, say: o.say ?? 'Not this one.' };
    },
  };
  PROBES.set(it, ch.map((o, i) => ({ r: { kind: 'choice', i } as Response, mc: o.mc ?? '' })).filter(p => p.mc && !ch[(p.r as { i: number }).i]!.ok));
  return it;
}
const eqN = (v: number, Qv: Q) => Number.isFinite(v) && Math.abs(v - num(Qv)) < 1e-9;
interface Pat { x: Q; y: Q; mc?: string; say: string }
/** an answer "□ x + □" (two numbers); `pats` are the classified wrong pairs, first match wins. The worked solution
 *  ends by reading the result into the two boxes (the steps card's answer, docs/lessons/QUALITY_LAYER.md). */
function pairItem(b: Base, lead: string, op: string, right: [Q, Q], pats: Pat[], okSay: string, miss: string, fmt: Fmt = 'frac'): EFItem {
  const used: [Q, Q][] = [right];
  const P = pats.filter(p => { if (used.some(u => qEq(u[0], p.x) && qEq(u[1], p.y))) return false; used.push([p.x, p.y]); return true; });
  const it: EFItem = {
    id: `${b.family}.${b.n}`, family: b.family, subgoal: b.sg, prompt: b.prompt, board: b.board, input: 'pair', pairLead: lead, pairOp: op,
    solution: [...b.solution, `In the boxes: ${ans(nH(right[0], fmt))} and ${ans(nH(right[1], fmt))}.`], pic: b.pic, answer: { kind: 'pair', x: num(right[0]), y: num(right[1]) },
    check(r: Response): Verdict {
      if (r.kind !== 'pair' || !Number.isFinite(r.x) || !Number.isFinite(r.y)) return { ok: false, say: 'Type a number in each box: a minus sign for a negative number, 0 for a missing term.' };
      if (eqN(r.x, right[0]) && eqN(r.y, right[1])) return { ok: true, say: okSay };
      for (const p of P) if (eqN(r.x, p.x) && eqN(r.y, p.y)) return { ok: false, mc: p.mc, say: p.say };
      return { ok: false, say: miss };
    },
  };
  PROBES.set(it, P.filter(p => p.mc).map(p => ({ r: { kind: 'pair', x: num(p.x), y: num(p.y) }, mc: p.mc! })));
  return it;
}
interface NPat { v: Q; mc?: string; say: string }
function numItem(b: Base, unit: string, right: Q, pats: NPat[], okSay: string, miss: string): EFItem {
  const P = pats.filter((p, i) => !qEq(p.v, right) && pats.findIndex(o => qEq(o.v, p.v)) === i);
  const it: EFItem = {
    id: `${b.family}.${b.n}`, family: b.family, subgoal: b.sg, prompt: b.prompt, board: b.board, input: 'num', unit,
    solution: b.solution, pic: b.pic, answer: { kind: 'num', v: num(right) },
    check(r: Response): Verdict {
      if (r.kind !== 'num' || !Number.isFinite(r.v)) return { ok: false, say: 'Type a number (a minus sign for a negative number).' };
      if (eqN(r.v, right)) return { ok: true, say: okSay };
      for (const p of P) if (eqN(r.v, p.v)) return { ok: false, mc: p.mc, say: p.say };
      return { ok: false, say: miss };
    },
  };
  PROBES.set(it, P.filter(p => p.mc).map(p => ({ r: { kind: 'num', v: num(p.v) }, mc: p.mc! })));
  return it;
}
const Z = rat(0);
const xc = (e: Ex) => coef(e, 'x'), cc = (e: Ex) => coef(e, '');
/** letters for bare items (a context-free expression can use any letter) */
const LETTERS = ['x', 'x', 'x', 'a', 'c', 'n', 'm', 'p', 'k'];
const sub = (s: string, L: string) => (L === 'x' ? s : s.replace(/x/g, L));
const subH = (s: string, L: string) => (L === 'x' ? s : s.replace(/<i>x<\/i>/g, `<i>${L}</i>`));
const I = (L: string) => `<i>${L}</i>`;
const nz = (R: R, lo: number, hi: number) => { let v = 0; while (v === 0) v = int(R, lo, hi); return v; };
const MIN = '−';
/** HTML for "□x + □" answers in sentences */
const axb = (a: Q, b: Q, L = 'x', fmt: Fmt = 'frac') => subH(exHtml(normal([{ c: a, v: 'x' }, { c: b, v: '' }]), { fmt }), L);
const picFor = (f: Term, inner: Ex, fmt: Fmt, letter = 'x'): Pic | undefined => {
  if (f.v === '' && f.c.q === 1 && f.c.p > 0 && inner.length === 2 && inner[0]!.v === 'x' && inner[1]!.v === '' && inner.every(s => s.c.q === 1 && s.c.p > 0) && tilesFit(f.c.p, inner[0]!.c.p, inner[1]!.c.p)) {
    return { kind: 'tiles', a: f.c.p, p: inner[0]!.c.p, q: inner[1]!.c.p, letter };
  }
  if (isZero(f.c) || inner.length > 3) return undefined;
  return { kind: 'grid', factor: f, terms: [...inner], fmt, ask: { cells: true }, signed: f.c.p < 0 || inner.some(s => s.c.p < 0), letter };
};

// ===================================================================== 1 the equal sign
const equalSign: Gen = (R, n, sg) => {
  const a = int(R, 2, 12), b = int(R, 2, 12), s = a + b;
  const kind = pick(R, ['reversed', 'both', 'false', 'blank', 'runon'] as const);
  const base = { family: 'equalSign' as const, n, sg };
  const tf = 'True or false?';
  if (kind === 'reversed') return choiceItem(R, { ...base, prompt: `${tf} <b>${s} = ${a} + ${b}</b>`, board: `${s} = ${a} + ${b}`, solution: [`The left side is ${s}. The right side is ${a} + ${b} = ${s}.`, '= means "has the same value as". A single number can come first.'] }, [
    { t: `True: both sides are worth ${s}`, ok: true, say: `Yes. = means "has the same value as", and both sides are ${s}.` },
    { t: 'False: the answer has to come after the equal sign', mc: 'mc.equal-sign.answer-must-come-after-equals', say: `= is not "the answer comes next". It says both sides have the same value: ${s} and ${a} + ${b} are both ${s}.` },
    { t: `False: ${s} is bigger than ${a}`, say: `Compare whole sides: ${a} + ${b} is ${s}, the same as the left side.` },
  ]);
  if (kind === 'both') {
    let c = int(R, 2, 12); if (c === a || c === b) c = c === 12 ? 2 : c + 1;
    const d = s - c;
    if (d < 1 || c === s) return equalSign(R, n, sg);
    return choiceItem(R, { ...base, prompt: `${tf} <b>${a} + ${b} = ${c} + ${d}</b>`, board: `${a} + ${b} = ${c} + ${d}`, solution: [`Left: ${a} + ${b} = ${s}. Right: ${c} + ${d} = ${s}.`, 'Both sides have the same value, so the sentence is true.'] }, [
      { t: `True: both sides are worth ${s}`, ok: true, say: `Yes: ${a} + ${b} and ${c} + ${d} are both ${s}.` },
      { t: `False: after the = there should be the answer, ${s}`, mc: 'mc.equal-sign.answer-must-come-after-equals', say: `The = does not ask for an answer. It says both sides have the same value, and ${c} + ${d} is ${s} too.` },
      { t: 'False: the two sides use different numbers', mc: 'mc.equal-sign.equal-means-same-look', say: `Different numbers can have the same value: ${c} + ${d} = ${s}, just like ${a} + ${b}.` },
    ]);
  }
  if (kind === 'false') {
    const d = int(R, 1, 9);
    return choiceItem(R, { ...base, prompt: `${tf} <b>${a} + ${b} = ${s} + ${d}</b>`, board: `${a} + ${b} = ${s} + ${d}`, solution: [`Left: ${a} + ${b} = ${s}. Right: ${s} + ${d} = ${s + d}.`, `${s} and ${s + d} are different values, so the sentence is false.`] }, [
      { t: `False: the left side is ${s}, the right side is ${s + d}`, ok: true, say: `Yes. Compare the two whole sides: ${s} is not ${s + d}.` },
      { t: `True: ${a} + ${b} is ${s}`, mc: 'mc.equal-sign.answer-must-come-after-equals', say: `${a} + ${b} is ${s}, but the right side is all of ${s} + ${d} = ${s + d}. The = compares whole sides.` },
      { t: `True: both sides have a ${s} in them`, mc: 'mc.equal-sign.equal-means-same-look', say: `Look at values, not at digits: the right side is ${s + d}.` },
    ]);
  }
  if (kind === 'runon') {
    const d = int(R, 1, 9);
    return choiceItem(R, { ...base, prompt: `Jay adds ${a} + ${b} + ${d} and writes: <b>${a} + ${b} = ${s} + ${d} = ${s + d}</b>. ${tf}`, board: `${a} + ${b} = ${s} + ${d} = ${s + d}`, solution: [`${a} + ${b} is ${s}, not ${s + d}: the first = is false.`, `Write it as ${a} + ${b} + ${d} = ${s} + ${d} = ${s + d}: every = joins equal values.`] }, [
      { t: `False: ${a} + ${b} is ${s}, not ${s + d}`, ok: true, say: 'Yes. Every = in a chain must join two equal values. Jay used = as "and then".' },
      { t: 'True: every step is worked out right', mc: 'mc.equal-sign.run-on-chain', say: `The steps are right, but the = signs are not: ${a} + ${b} is not equal to ${s} + ${d}. Each = must join equal values.` },
      { t: `True: the last number, ${s + d}, is the right total`, mc: 'mc.equal-sign.run-on-chain', say: `The total is right, but a chain of = says every part is equal, and ${a} + ${b} = ${s + d} is false.` },
    ]);
  }
  // blank: a + b = __ + d
  let d = int(R, 1, s - 1); if (d === a || d === b) d = Math.max(1, d - 1);
  const right = s - d;
  return numItem({ ...base, prompt: `What number goes in the box? <b>${a} + ${b} = □ + ${d}</b>`, board: `${a} + ${b} = \\square + ${d}`, solution: [`The left side is ${s}.`, `The right side must also be ${s}: □ + ${d} = ${s}, so □ = ${right}.`] }, '', rat(right), [
    { v: rat(s), mc: 'mc.equal-sign.fills-blank-with-left-total', say: `${s} is the whole left side. The box is only part of the right side: □ + ${d} must make ${s}, so □ = ${right}.` },
    { v: rat(s + d), mc: 'mc.equal-sign.answer-must-come-after-equals', say: `The = is not "write the answer". Both sides need the same value: □ + ${d} = ${s}.` },
  ], `Yes: ${right} + ${d} = ${s}, the same as ${a} + ${b}.`, `Find the value of the left side first (${s}); then what plus ${d} makes it?`);
};

// ===================================================================== 2 like terms
const likeTerms: Gen = (R, n, sg) => {
  const kind = pick(R, ['which', 'coef', 'done', 'letter'] as const);
  const base = { family: 'likeTerms' as const, n, sg };
  if (kind === 'which') {
    const k = int(R, 2, 12), L = pick(R, ['x', 'x', 'a', 'n']), M = L === 'y' ? 'x' : 'y';
    let m = int(R, 1, 12); if (m === k) m = m === 1 ? 2 : 1;
    const like = m === 1 ? I(L) : `${m}${I(L)}`;
    return choiceItem(R, { ...base, prompt: `Which term is a like term of <b>${k}${I(L)}</b>?`, board: `${k}${L}`, solution: [`Like terms have the same variable part.`, `${k}${I(L)} and ${like} both have ${I(L)}; ${k} is a constant and ${k}${I(M)} has ${I(M)}.`] }, [
      { t: like, ok: true, say: `Yes: same variable part, ${I(L)}. ${m === 1 ? `(${I(L)} is 1${I(L)}.)` : ''}` },
      { t: String(k), mc: 'mc.expressions.combines-unlike-terms', say: `${k} has the same number, but no ${I(L)}. Like terms share the variable part, not the coefficient.` },
      { t: `${k}${I(M)}`, mc: 'mc.expressions.combines-unlike-terms', say: `${k}${I(M)} has ${I(M)}, not ${I(L)}: a different variable part, so unlike.` },
    ]);
  }
  if (kind === 'coef') {
    const c = int(R, 1, 12), L = pick(R, LETTERS), front = R() < 0.5;
    const e = front ? `${I(L)} + ${c}` : `${c} + ${I(L)}`;
    return numItem({ ...base, prompt: `What is the coefficient of ${I(L)} in <b>${e}</b>?`, board: front ? `${L} + ${c}` : `${c} + ${L}`, solution: [`${I(L)} means 1 · ${I(L)}: one ${I(L)}.`, `The coefficient is ${ans(1)} (it is just not written).`] }, '', rat(1), [
      { v: Z, mc: 'mc.expressions.ignores-implicit-coefficient-one', say: `A bare ${I(L)} is one ${I(L)}: 1${I(L)}. Its coefficient is 1, not 0.` },
      { v: rat(c), say: `${c} is the constant term. ${I(L)} on its own is 1${I(L)}.` },
    ], `Yes: ${I(L)} = 1${I(L)}.`, `${I(L)} on its own means 1 · ${I(L)}.`);
  }
  if (kind === 'done') {
    const a = int(R, 2, 12), b = a === 2 ? int(R, 3, 12) : int(R, 2, 12), L = pick(R, ['x', 'x', 'a', 'n']), first = R() < 0.5;
    const e = first ? `${a} + ${b}${I(L)}` : `${b}${I(L)} + ${a}`;
    return choiceItem(R, { ...base, prompt: `Can <b>${e}</b> be written with fewer terms?`, board: first ? `${a} + ${b}${L}` : `${b}${L} + ${a}`, solution: [`${b}${I(L)} has the variable part ${I(L)}; ${a} is a constant.`, 'Unlike terms stay separate: the expression is already finished.'] }, [
      { t: `No: ${a} and ${b}${I(L)} are unlike terms, so it is finished`, ok: true, say: 'Yes. A constant and an x-term are unlike terms; there is nothing to combine.' },
      { t: `Yes: it is ${a + b}${I(L)}`, mc: 'mc.expressions.combines-unlike-terms', say: `Try ${I(L)} = 10: ${e.replace(/<\/?i>/g, '')} gives ${first ? a + b * 10 : b * 10 + a}, but ${a + b}${I(L)} gives ${(a + b) * 10}. Unlike terms do not combine.` },
      { t: `Yes: it is ${a * b}${I(L)}`, mc: 'mc.expressions.combines-unlike-terms', say: `Multiplying the numbers changes the value: try ${I(L)} = 1. ${a} and ${b}${I(L)} stay separate.` },
    ]);
  }
  const sk = pick(R, [['a', 'b', 'apples', 'bananas'], ['c', 'd', 'cats', 'dogs'], ['s', 'h', 'shirts', 'hats'], ['p', 'e', 'pens', 'erasers'], ['t', 'm', 'tacos', 'muffins']] as const);
  const a = int(R, 2, 9), b = int(R, 2, 9);
  return choiceItem(R, { ...base, prompt: `Sam reads <b>${a}${I(sk[0])} + ${b}${I(sk[1])}</b> as "${a} ${sk[2]} and ${b} ${sk[3]}". What do ${I(sk[0])} and ${I(sk[1])} really stand for?`, board: `${a}${sk[0]} + ${b}${sk[1]}`, solution: [`A letter stands for a number: a count, a length, a price...`, `${a}${I(sk[0])} means ${a} times the number ${I(sk[0])}.`] }, [
    { t: 'Numbers: each letter can stand for any value', ok: true, say: `Yes. ${a}${I(sk[0])} is ${a} times a number. If ${I(sk[0])} is the number of ${sk[2]}, it is still a number.` },
    { t: `The objects: ${I(sk[0])} is ${sk[2]}, ${I(sk[1])} is ${sk[3]}`, mc: 'mc.expressions.letter-as-object-label', say: `A letter is a number, not a label for a thing. ${a}${I(sk[0])} means ${a} × (a number), whatever the number counts.` },
    { t: `Their places in the alphabet`, say: 'A letter in algebra can stand for any number; it is not a code for its place in the alphabet.' },
  ]);
};

// ===================================================================== 3 commutative / associative
const property: Gen = (R, n, sg) => {
  const kind = pick(R, ['cAdd', 'cMul', 'aAdd', 'aMul', 'cNum'] as const);
  const a = int(R, 2, 9), b = int(R, 2, 9), c = int(R, 2, 12), L = pick(R, ['x', 'x', 'a', 'n']);
  const base = { family: 'property' as const, n, sg };
  let lhs: string, rhs: string;
  if (kind === 'cAdd') { lhs = `${a}${L} + ${c} + ${b}${L}`; rhs = `${a}${L} + ${b}${L} + ${c}`; }
  else if (kind === 'cMul') { lhs = `${a} \\cdot ${L} \\cdot ${b}`; rhs = `${a} \\cdot ${b} \\cdot ${L}`; }
  else if (kind === 'aAdd') { lhs = `(${a}${L} + ${b}${L}) + ${c}`; rhs = `${a}${L} + (${b}${L} + ${c})`; }
  else if (kind === 'aMul') { lhs = `(${a} \\cdot ${b}) \\cdot ${L}`; rhs = `${a} \\cdot (${b} \\cdot ${L})`; }
  else { let d = int(R, 2, 9); if (d === c) d = c === 9 ? 2 : c + 1; lhs = `${a + 5} + ${c} + ${d}`; rhs = `${a + 5} + ${d} + ${c}`; }
  const html = (s: string) => s.replace(/\\cdot/g, '·').replace(new RegExp(`(?<![a-z])${L}(?![a-z])`, 'g'), I(L));
  const isC = kind === 'cAdd' || kind === 'cMul' || kind === 'cNum';
  const C = 'Commutative property: the order changes', A = 'Associative property: the grouping changes';
  return choiceItem(R, { ...base, prompt: `Which property makes this true? <b>${html(lhs)} = ${html(rhs)}</b>`, board: `${lhs} = ${rhs}`, solution: [isC ? 'The same terms in a different ORDER, no parentheses moved: commutative.' : 'The same terms in the same order; only the PARENTHESES moved: associative.', 'Neither one changes the value.'] }, [
    { t: C, ok: isC, mc: isC ? undefined : 'mc.properties.associative-commutative-confused', say: isC ? 'Yes: same terms, new order.' : 'The order is the same here; the parentheses moved. That is the associative property (grouping).' },
    { t: A, ok: !isC, mc: isC ? 'mc.properties.associative-commutative-confused' : undefined, say: !isC ? 'Yes: same order, new grouping.' : 'No parentheses moved; the terms swapped places. That is the commutative property (order).' },
    { t: 'Distributive property', say: 'Nothing is multiplied into parentheses here. Look at what moved: the order or the grouping?' },
    { t: 'None: the two sides have different values', mc: 'mc.properties.order-changes-sum', say: 'Changing the order or the grouping of a sum or a product never changes its value.' },
  ]);
};

// ===================================================================== 4 the area model, both directions
const areaToSum: Gen = (R, n, sg) => {
  let a: number, p: number, qq: number;
  do { a = int(R, 2, 9); p = R() < 0.7 ? 1 : 2; qq = int(R, 1, 8); } while (!tilesFit(a, p, qq));
  const right = R() < 0.3;
  const inner: Ex = [t(p, 'x'), t(qq)];
  const prodT = prodTex(t(a), inner, { right }), prodH = prodHtml(t(a), inner, { right, color: true });
  return pairItem({ family: 'areaToSum', n, sg, prompt: `The rectangle is ${a} rows of <b>${exHtml(inner, { color: true })}</b>: its area is <b>${prodH}</b>. Write the area as a sum.`, board: prodT,
    solution: [`The strip part: ${a} rows of ${p === 1 ? '' : p}${I('x')}, so ${a * p}${I('x')}.`, `The square part: ${a} rows of ${qq} ${qq === 1 ? 'square' : 'squares'}, so ${a} · ${qq} = ${a * qq}.`, `${prodH} = ${axb(rat(a * p), rat(a * qq))} (distributive property).`],
    pic: { kind: 'tiles', a, p, q: qq } }, '', 'x +', [rat(a * p), rat(a * qq)], [
    { x: rat(a * p), y: rat(qq), mc: 'mc.properties.partial-distribution', say: `Count the squares: every one of the ${a} rows has ${qq}, so ${a} · ${qq} = ${a * qq}, not ${qq}.` },
    { x: rat(a * p + a * qq), y: Z, mc: 'mc.expressions.combines-unlike-terms', say: `Strips and squares are unlike terms: ${a * p}${I('x')} and ${a * qq} stay separate.` },
    { x: rat(p), y: rat(a * qq), mc: 'mc.properties.partial-distribution', say: `The strips are ${a} rows too: ${a} · ${p === 1 ? '' : p}${I('x')} = ${a * p}${I('x')}.` },
  ], `Yes: ${axb(rat(a * p), rat(a * qq))}, the strips plus the squares.`, `Count each part: the strips (${a} rows of ${p === 1 ? '' : p}${I('x')}) and the squares (${a} rows of ${qq}).`);
};
const areaToProduct: Gen = (R, n, sg) => {
  let a: number, p: number, qq: number;
  do { a = int(R, 2, 9); p = R() < 0.75 ? 1 : 2; qq = int(R, 1, 9); } while (a * qq > 100 || a === qq);
  const A = a * p, B = a * qq, inner: Ex = [t(p, 'x'), t(qq)];
  const sum = axb(rat(A), rat(B));
  return choiceItem(R, { family: 'areaToProduct', n, sg, prompt: `A rectangle ${a} units high has the area <b>${sum}</b>. Which product gives the same area?`, board: exTex([t(A, 'x'), t(B)]),
    solution: [`Both parts are ${a} high: ${A}${I('x')} = ${a} · ${p === 1 ? '' : p}${I('x')} and ${B} = ${a} · ${qq}.`, `So ${sum} = ${prodHtml(t(a), inner)}: the distributive property read backwards.`],
    pic: { kind: 'grid', factor: t(a), terms: [...inner], fmt: 'frac', ask: { terms: true } } }, [
    { t: prodHtml(t(a), inner), ok: true, say: `Yes: ${a} · ${p === 1 ? '' : p}${I('x')} = ${A}${I('x')} and ${a} · ${qq} = ${B}. The distributive property works both ways.` },
    { t: prodHtml(t(a), [t(p, 'x'), t(B)]), mc: 'mc.expressions.factors-out-of-one-term-only', say: `Multiply it out: ${a} · ${B} = ${a * B}, not ${B}. Take the ${a} out of BOTH terms: ${B} ÷ ${a} = ${qq}.` },
    { t: 'It cannot be written as a product', mc: 'mc.properties.distributive-one-direction', say: `The distributive property reads both ways: ${sum} = ${prodHtml(t(a), inner)}. Writing it as a product is factoring.` },
    { t: prodHtml(t(qq), [t(p, 'x'), t(a)]), say: `Multiply it out: ${qq} · ${p === 1 ? '' : p}${I('x')} = ${qq * p}${I('x')}, not ${A}${I('x')}. The height is ${a}.` },
  ]);
};

// ===================================================================== 5 equivalence means every value
const equivalent: Gen = (R, n, sg) => {
  const base = { family: 'equivalent' as const, n, sg };
  if (R() < 0.55) {
    // non-equivalent pair that agrees at one value x0
    let p: number, r: number, s: number, x0: number, qq: number;
    do { p = int(R, 1, 6); r = int(R, 1, 7); s = int(R, 0, 9); x0 = int(R, 1, 3); qq = (r - p) * x0 + s; } while (p === r || qq < 1 || qq > 20);
    const A: Ex = [t(p, 'x'), t(qq)], B: Ex = s ? [t(r, 'x'), t(s)] : [t(r, 'x')];
    const V = num(value(A, x0)), x1 = x0 === 1 ? 2 : x0 - 1, a1 = num(value(A, x1)), b1 = num(value(B, x1));
    return choiceItem(R, { ...base, prompt: `When ${I('x')} = ${x0}, <b>${exHtml(A)}</b> and <b>${exHtml(B)}</b> are both ${V}. Are they equivalent?`, board: `${exTex(A)} \\quad ${exTex(B)}`,
      solution: [`Equivalent means equal for EVERY value of ${I('x')}.`, `At ${I('x')} = ${x1}: ${exHtml(A)} = ${a1} but ${exHtml(B)} = ${b1}. One mismatch is enough: not equivalent.`],
      pic: { kind: 'table', A: [...A], B: [...B], aTex: exTex(A), bTex: exTex(B), xs: [0, 1, 2, 3, 4].filter(v => v !== x0 && v !== x1).slice(0, 2).concat([x0, x1]).sort((u, v) => u - v), show: [x0] } }, [
      { t: `No: at ${I('x')} = ${x1} they are ${a1} and ${b1}`, ok: true, say: `Yes. Matching at one value is not enough; one value where they differ shows they are not equivalent.` },
      { t: `Yes: they are equal at ${I('x')} = ${x0}`, mc: 'mc.reasoning-language.examples-as-proof', say: `Equal at one value is not equal for every value. Try ${I('x')} = ${x1}: ${a1} and ${b1}.` },
      { t: 'No: because they do not look the same', mc: 'mc.equal-sign.equal-means-same-look', say: `The verdict is right, the reason is not: ${prodHtml(t(2), [t(1, 'x'), t(3)])} and 2${I('x')} + 6 look different and ARE equivalent. Check values: ${I('x')} = ${x1} gives ${a1} and ${b1}.` },
    ]);
  }
  const f = int(R, 2, 6), qq = int(R, 1, 9), inner: Ex = [t(1, 'x'), t(qq)], ex = expand(t(f), inner);
  return choiceItem(R, { ...base, prompt: `Are <b>${prodHtml(t(f), inner)}</b> and <b>${exHtml(ex)}</b> equivalent?`, board: `${prodTex(t(f), inner)} \\quad ${exTex(ex)}`,
    solution: [`The distributive property: ${prodHtml(t(f), inner)} = ${f}${I('x')} + ${f * qq} for every ${I('x')}.`, 'They look different but always have the same value: equivalent.'],
    pic: { kind: 'table', A: expand(t(f), inner), B: [...ex], aTex: prodTex(t(f), inner), bTex: exTex(ex), xs: [0, 1, 2, 5], show: [] } }, [
    { t: `Yes: they are equal for every ${I('x')} (distributive property)`, ok: true, say: 'Yes. The distributive property turns one into the other, for every value of x.' },
    { t: 'No: they do not look the same', mc: 'mc.equal-sign.equal-means-same-look', say: `Equivalent is about value, not looks. ${f} · (${I('x')} + ${qq}) = ${f}${I('x')} + ${f * qq} for every ${I('x')}.` },
    { t: `Only when ${I('x')} = 0`, say: `Try ${I('x')} = 2: ${f * (2 + qq)} and ${f * 2 + f * qq}. They match for every ${I('x')}.` },
  ]);
};

// ===================================================================== 6, 10, 11 expand
const DEC_F = [0.5, 1.5, 0.4, 0.2, 2.5, 0.3, -1.5, -0.5];
const FRAC_F: [number, number][] = [[1, 2], [1, 3], [2, 3], [3, 4], [1, 4], [-1, 2], [3, 2], [-2, 3]];
const expandGen: Gen = (R, n, sg) => {
  const mode = sg === 'expand-negative' ? 'neg' : sg === 'rational-coefficients' ? 'rat' : 'pos';
  let f: Term, inner: Ex, fmt: Fmt = 'frac', right = false, L = pick(R, LETTERS);
  if (mode === 'pos') {
    const a = int(R, 2, 9), kind = pick(R, ['x+b', 'px+q', 'q+px', 'right'] as const);
    let p = kind === 'x+b' ? 1 : int(R, 1, 4), qq = int(R, 1, 12);
    while (a * qq > 100) qq--; while (a * p > 100) p--;
    f = t(a); inner = kind === 'q+px' ? [t(qq), t(p, 'x')] : [t(p, 'x'), t(qq)]; right = kind === 'right';
  } else if (mode === 'neg') {
    const kind = pick(R, ['neg', 'neg', 'posMinus', 'minusOne', 'zero'] as const);
    const p = R() < 0.5 ? 1 : int(R, 2, 5), qq = int(R, 1, 9);
    if (kind === 'neg') { f = t(-int(R, 2, 9)); inner = [t(p, 'x'), t(R() < 0.6 ? -qq : qq)]; }
    else if (kind === 'posMinus') { f = t(int(R, 2, 9)); inner = R() < 0.5 ? [t(qq), t(-p, 'x')] : [t(p, 'x'), t(-qq)]; }
    else if (kind === 'minusOne') { f = t(-1); inner = [t(p, 'x'), t(R() < 0.5 ? qq : -qq)]; }
    else { f = t(0); inner = [t(p, 'x'), t(qq)]; }
  } else {
    if (R() < 0.5) { const [a, b] = pick(R, FRAC_F); f = t(rat(a, b)); const p = b * int(R, 1, 4), qq = b * int(R, 1, 5); inner = [t(p, 'x'), t(R() < 0.5 ? -qq : qq)]; }
    else { const d = pick(R, DEC_F); f = t(decQ(d)); fmt = 'dec'; const den = f.c.q; const p = den * int(R, 1, 3) / (den % 2 === 0 && R() < 0.5 ? 1 : 1), qq = den * int(R, 1, 6); inner = [t(p, 'x'), t(R() < 0.4 ? -qq : qq)]; }
    L = 'x';
  }
  const out = expand(f, inner), A = xc(out), B = cc(out);
  const pT = sub(prodTex(f, inner, { fmt, right }), L), pH = subH(prodHtml(f, inner, { fmt, right, color: true }), L);
  const iX = inner.find(s => s.v === 'x')!, iC = inner.find(s => s.v === '')!;
  const pats: Pat[] = [];
  const fx = qMul(f.c, iX.c), fc = qMul(f.c, iC.c);
  pats.push({ x: fx, y: iC.c, mc: 'mc.properties.partial-distribution', say: `The ${factorHtml(f, fmt) || '1'} multiplies EVERY term inside, the ${nH(iC.c, fmt)} too: ${nH(f.c, fmt)} · ${nH(iC.c, fmt)} = ${nH(fc, fmt)}.` });
  if (f.c.p < 0) {
    // the negative only on the first term written inside
    const first = inner[0]!, second = inner[1]!;
    const w1 = qMul(f.c, first.c), w2 = qMul(rat(Math.abs(f.c.p), f.c.q), second.c);
    const wx = first.v === 'x' ? w1 : w2, wc = first.v === 'x' ? w2 : w1;
    pats.push({ x: wx, y: wc, mc: 'mc.integers.distribute-negative-first-term-only', say: `The minus belongs to the whole factor ${factorHtml(f, fmt) || MIN + '1'}: it changes the sign of EVERY term. ${nH(f.c, fmt)} · ${nH(second.c, fmt)} = ${nH(qMul(f.c, second.c), fmt)}.` });
  }
  if (mode === 'pos' && f.c.p <= 9 && iX.c.p > 1 && iX.c.p <= 9) pats.push({ x: rat(Number(`${f.c.p}${iX.c.p}`)), y: fc, mc: 'mc.expressions.reads-coefficient-as-concatenation', say: `${f.c.p} · ${iX.c.p}${I(L)} means ${f.c.p} times ${iX.c.p}${I(L)}: ${f.c.p * iX.c.p}${I(L)}, not ${f.c.p}${iX.c.p}${I(L)}.` });
  if (mode === 'rat') {
    if (fmt === 'dec') for (const s of [10, 0.1]) pats.push({ x: qMul(fx, decQ(s)), y: qMul(fc, decQ(s)), mc: 'mc.decimals.product-decimal-scale-not-preserved', say: `Check the decimal point: ${nH(f.c, fmt)} · ${nH(iX.c, fmt)} = ${nH(fx, fmt)}. A quick estimate helps.` });
    else {
      pats.push({ x: qMul(iX.c, rat(f.c.p)), y: qMul(iC.c, rat(f.c.p)), mc: 'mc.fraction-ops.incomplete-rational-coefficient-product', say: `Multiplying by ${factorHtml(f, fmt)} means times ${Math.abs(f.c.p)} AND divided by ${f.c.q}: ${nH(f.c)} · ${nH(iX.c)} = ${nH(fx)}.` });
      pats.push({ x: qDiv(iX.c, rat(f.c.q)), y: qDiv(iC.c, rat(f.c.q)), mc: 'mc.fraction-ops.incomplete-rational-coefficient-product', say: `You divided by ${f.c.q}; multiply by ${Math.abs(f.c.p)} too: ${nH(f.c)} · ${nH(iX.c)} = ${nH(fx)}.` });
    }
  }
  if (!isZero(A) && !isZero(B)) pats.push({ x: qAdd(A, B), y: Z, mc: 'mc.expressions.combines-unlike-terms', say: `${termHtml({ c: A, v: 'x' }, fmt)} and ${nH(B, fmt)} are unlike terms; they stay separate.` });
  const sol = isZero(f.c)
    ? [`0 times anything is 0: 0 · ${I(L)} = 0 and 0 · ${nH(iC.c)} = 0.`, `So ${pH} = 0: type 0 in both boxes.`]
    : [`Multiply ${factorHtml(f, fmt) || (f.c.p < 0 ? MIN + '1' : '1')} into every term: ${inner.map(s => `${nH(f.c, fmt)} · ${subH(termHtml(s, fmt), L)} = ${subH(termHtml(mulTerm_(f, s), fmt), L)}`).join(', ')}.`,
      `So ${pH} = ${subH(axb(A, B, 'x', fmt), L)}${f.c.p < 0 ? ': a negative factor changes the sign of every term' : ''}.`];
  return pairItem({ family: 'expand', n, sg, prompt: `Expand: <b>${pH}</b>`, board: pT, solution: sol, pic: picFor(f, inner, fmt, L) }, '', `${L} +`, [A, B], pats,
    `Yes: ${pH} = ${subH(axb(A, B, 'x', fmt), L)}.`, `Multiply the factor into every term inside the parentheses, keeping each sign.`);
};
const mulTerm_ = (f: Term, s: Term): Term => ({ c: qMul(f.c, s.c), v: s.v });

// ===================================================================== 7, 9, 11 combine like terms
const collectGen: Gen = (R, n, sg) => {
  const L = pick(R, LETTERS);
  if (sg === 'rational-coefficients') return collectRational(R, n, sg);
  if (sg === 'collect-signed') return collectSigned(R, n, sg, L);
  // positive: 2-5 terms, coefficients 1-12, hidden 1, non-adjacent like terms
  const onlyX = R() < 0.3;
  const terms: Term[] = [];
  if (onlyX) {
    const k = int(R, 2, 3);
    for (let i = 0; i < k; i++) terms.push(t(R() < 0.25 && !terms.some(s => s.c.p === 1) ? 1 : int(R, 2, 12), 'x'));
    const S = terms.reduce((s, x) => s + x.c.p, 0);
    const pats: NPat[] = [];
    if (k === 2) pats.push({ v: rat(terms[0]!.c.p * terms[1]!.c.p), mc: 'mc.expressions.multiplies-when-adding-like-terms', say: `Adding like terms adds the counts: ${terms[0]!.c.p} ${I(L)}'s and ${terms[1]!.c.p} more make ${S} ${I(L)}'s. (Multiplying would give ${I(L)}<sup>2</sup>.)` });
    const hidden = terms.filter(s => s.c.p === 1).length;
    if (hidden) pats.push({ v: rat(S - hidden), mc: 'mc.expressions.ignores-implicit-coefficient-one', say: `A bare ${I(L)} is 1${I(L)}: count it.` });
    const eH = subH(exHtml(terms), L);
    return numItem({ family: 'collect', n, sg, prompt: `Combine: <b>${eH}</b>`, board: sub(exTex(terms), L), solution: [`Like terms: ${terms.map(s => (s.c.p === 1 ? `1${I(L)}` : `${s.c.p}${I(L)}`)).join(' + ')}.`, `(${terms.map(s => s.c.p).join(' + ')})${I(L)} = ${S}${I(L)}: the distributive property backwards.`],
      pic: termTilesFit(terms) ? { kind: 'row', terms, letter: L } : undefined }, L, rat(S), pats, `Yes: ${S}${I(L)}.`, `Add the coefficients of the like terms (a bare ${I(L)} counts as 1).`);
  }
  const nx = int(R, 2, 3), nc = int(R, 1, 2);
  for (let i = 0; i < nx; i++) terms.push(t(R() < 0.25 && !terms.some(s => s.c.p === 1) ? 1 : int(R, 1, 12), 'x'));
  for (let i = 0; i < nc; i++) terms.push(t(int(R, 1, 12)));
  // interleave so like terms are not all next to each other
  const blocked = (o: Term[]) => o.every((s, i) => i === 0 || s.v === o[i - 1]!.v || o.slice(0, i).every(x => x.v !== s.v));
  let order = shuffle(R, [...terms]);
  for (let tries = 0; tries < 6 && blocked(order); tries++) order = shuffle(R, [...terms]);
  const SX = terms.filter(s => s.v === 'x').reduce((s, x) => s + x.c.p, 0), SC = terms.filter(s => s.v === '').reduce((s, x) => s + x.c.p, 0);
  const pats: Pat[] = [
    { x: rat(SX + SC), y: Z, mc: 'mc.expressions.combines-unlike-terms', say: `${I(L)}-terms and constants are unlike: keep ${SX}${I(L)} and ${SC} apart.` },
    { x: Z, y: rat(SX + SC), mc: 'mc.expressions.combines-unlike-terms', say: `${I(L)}-terms and constants are unlike: keep ${SX}${I(L)} and ${SC} apart.` },
  ];
  const hidden = terms.filter(s => s.v === 'x' && s.c.p === 1).length;
  if (hidden) pats.push({ x: rat(SX - hidden), y: rat(SC), mc: 'mc.expressions.ignores-implicit-coefficient-one', say: `A bare ${I(L)} is 1${I(L)}: count it. The ${I(L)}-terms make ${SX}${I(L)}.` });
  const xs = terms.filter(s => s.v === 'x');
  if (xs.length === 2) pats.push({ x: rat(xs[0]!.c.p * xs[1]!.c.p), y: rat(SC), mc: 'mc.expressions.multiplies-when-adding-like-terms', say: `Adding like terms adds their coefficients: ${xs[0]!.c.p} + ${xs[1]!.c.p} = ${SX}.` });
  const eH = subH(exHtml(order), L);
  return pairItem({ family: 'collect', n, sg, prompt: `Combine like terms: <b>${eH}</b>`, board: sub(exTex(order), L),
    solution: [`Gather the like terms (commutative property): ${subH(exHtml([...order.filter(s => s.v === 'x'), ...order.filter(s => s.v === '')]), L)}.`, `${I(L)}-terms: ${SX}${I(L)}. Constants: ${SC}. So ${subH(axb(rat(SX), rat(SC)), L)}.`],
    pic: termTilesFit(order) ? { kind: 'row', terms: order, letter: L } : undefined }, '', `${L} +`, [rat(SX), rat(SC)], pats, `Yes: ${subH(axb(rat(SX), rat(SC)), L)}.`, `Add the ${I(L)}-terms, add the constants, keep the two apart.`);
};
function collectSigned(R: R, n: number, sg: string | undefined, L: string): EFItem {
  const kind = pick(R, ['cancel', 'minusOne', 'smaller', 'mixed', 'zeroMinus'] as const);
  let terms: Term[];
  if (kind === 'cancel') { const k = int(R, 1, 9), c1 = nz(R, -12, 12), c2 = nz(R, -12, 12); terms = shuffle(R, [t(k, 'x'), t(c1)]).concat([t(-k, 'x'), t(c2)]); if (terms[0]!.c.p < 0 && terms[0]!.v === '') terms = [terms[1]!, terms[0]!, terms[2]!, terms[3]!]; }
  else if (kind === 'minusOne') { const a = int(R, 2, 12), c = nz(R, -12, 12); terms = R() < 0.5 ? [t(a, 'x'), t(-1, 'x'), t(c)] : [t(a, 'x'), t(c), t(-1, 'x')]; }
  else if (kind === 'smaller') { let a = int(R, 1, 9), b = int(R, 2, 12); if (b <= a) b = a + int(R, 1, 5); const c = nz(R, -15, 15); terms = R() < 0.5 ? [t(a, 'x'), t(-b, 'x'), t(c)] : [t(c), t(a, 'x'), t(-b, 'x')]; }
  else if (kind === 'zeroMinus') { const c = int(R, 1, 12), d = nz(R, -12, 12); terms = [t(c), t(-1, 'x'), t(d)]; }
  else { terms = [t(nz(R, -9, 12), 'x'), t(nz(R, -15, 15)), t(nz(R, -12, 9), 'x'), t(nz(R, -15, 15))]; if (terms[0]!.c.p < 0 && R() < 0.5) terms[0] = t(-terms[0]!.c.p, 'x'); }
  const SX = num(xc(terms)), SC = num(cc(terms));
  const pats: Pat[] = [];
  if (kind === 'cancel') { const k = terms.find(s => s.v === 'x')!.c.p; pats.push({ x: rat(Math.abs(k)), y: rat(SC), mc: 'mc.expressions.identical-term-subtraction-leaves-term', say: `${k}${I(L)} − ${k}${I(L)} is ${k} − ${k} = 0 ${I(L)}'s: nothing is left, so the ${I(L)}-term is 0.` }); }
  if (kind === 'minusOne') { const a = terms[0]!.c.p; pats.push({ x: Z, y: rat(a + SC), mc: 'mc.expressions.erases-variable-and-subtrahend-in-like-term-subtraction', say: `${a}${I(L)} − ${I(L)} takes away ONE ${I(L)}: ${a - 1}${I(L)}. The ${I(L)} does not vanish.` }); }
  if (kind === 'smaller' || SX < 0) pats.push({ x: rat(Math.abs(SX)), y: rat(SC), mc: 'mc.integers.smaller-from-larger-subtraction', say: `The order matters: ${terms.filter(s => s.v === 'x').map(s => nH(s.c)).join(' + ').replace(/\+ −/g, '− ')} = ${nH(SX)}. The ${I(L)}-term is negative.` });
  const absX = terms.filter(s => s.v === 'x').reduce((s, x) => s + Math.abs(x.c.p), 0), absC = terms.filter(s => s.v === '').reduce((s, x) => s + Math.abs(x.c.p), 0);
  pats.push({ x: rat(absX), y: rat(absC), mc: 'mc.integers.minus-sign-detached-from-term', say: `Each sign belongs to the term after it: ${subH(terms.map(s => termHtml(s)).join(', '), L)}. Add them with their signs.` });
  pats.push({ x: rat(SX + SC), y: Z, mc: 'mc.expressions.combines-unlike-terms', say: `${I(L)}-terms and constants are unlike: keep them apart.` });
  const eH = subH(exHtml(terms), L);
  return pairItem({ family: 'collect', n, sg, prompt: `Combine like terms: <b>${eH}</b>`, board: sub(exTex(terms), L),
    solution: [`Each sign belongs to its term: ${subH(terms.map(s => termHtml(s)).join(', '), L)}.`, `${I(L)}-terms: ${terms.filter(s => s.v === 'x').map(s => `(${nH(s.c)})`).join(' + ')} = ${nH(SX)}. Constants: ${terms.filter(s => s.v === '').map(s => `(${nH(s.c)})`).join(' + ')} = ${nH(SC)}.`, `So ${subH(axb(rat(SX), rat(SC)), L)}.`],
    pic: termTilesFit(terms) ? { kind: 'row', terms, letter: L } : undefined }, '', `${L} +`, [rat(SX), rat(SC)], pats, `Yes: ${subH(axb(rat(SX), rat(SC)), L)}.`, `Add the ${I(L)}-terms with their signs, then the constants with their signs.`);
}
function collectRational(R: R, n: number, sg: string | undefined): EFItem {
  const L = pick(R, ['x', 'a', 'y'].slice(0, 2));
  if (R() < 0.5) {
    const dens = [2, 3, 4, 5, 6, 8, 10, 12];
    let d1: number, d2: number, p1: number, p2: number;
    do { d1 = pick(R, dens); d2 = pick(R, dens); p1 = int(R, 1, d1 - 1); p2 = int(R, 1, d2 - 1); } while (d1 === d2 && p1 === p2);
    const a = rat(p1, d1), b = rat(p2, d2), s = qAdd(a, b), wrong = rat(p1 + p2, d1 + d2);
    const T = (c: Q) => `${magHtml(c)}${I(L)}`;
    const opts: Opt[] = [
      { t: T(s), ok: true, say: `Yes: ${magHtml(a)} + ${magHtml(b)} = ${magHtml(s)}, so ${T(s)}.` },
      { t: T(wrong), mc: 'mc.fraction-ops.adds-or-subtracts-denominators', say: `The bottoms are not added: rename to a common denominator first. ${magHtml(a)} + ${magHtml(b)} = ${magHtml(s)}.` },
      { t: `${magHtml(qMul(a, b))}${I(L)}<sup>2</sup>`, mc: 'mc.expressions.multiplies-when-adding-like-terms', say: 'Adding like terms adds the coefficients; the variable part stays the same.' },
    ];
    if (qEq(wrong, s)) opts.splice(1, 1);
    return choiceItem(R, { family: 'collect', n, sg, prompt: `Combine: <b>${T(a)} + ${T(b)}</b>`, board: sub(`${magTex(a)}x + ${magTex(b)}x`, L),
      solution: [`(${magHtml(a)} + ${magHtml(b)})${I(L)}: add the coefficients.`, `${magHtml(a)} + ${magHtml(b)} = ${magHtml(s)}, so ${T(s)}${s.q !== 1 && Number.isInteger(num(s) * 1000) ? ` (or ${decStrOr(s)}${I(L)})` : ''}.`] }, opts);
  }
  const d = pick(R, [0.3, 0.4, 0.6, 0.7, 0.25, 0.75, 1.2, 0.8]), D = decQ(d), s = qAdd(D, rat(-1));
  const T = (c: Q) => `${nH(c, 'dec')}${I(L)}`;
  return choiceItem(R, { family: 'collect', n, sg, prompt: `Combine: <b>${nH(D, 'dec')}${I(L)} − ${I(L)}</b>`, board: sub(`${nT(D, 'dec')}x - x`, L),
    solution: [`${I(L)} is 1${I(L)}: ${nH(D, 'dec')}${I(L)} − 1${I(L)} = (${nH(D, 'dec')} − 1)${I(L)}.`, `${nH(D, 'dec')} − 1 = ${nH(s, 'dec')}, so ${T(s)}.`] }, [
    { t: T(s), ok: true, say: `Yes: ${nH(D, 'dec')} − 1 = ${nH(s, 'dec')}.` },
    { t: T(D), mc: 'mc.expressions.ignores-implicit-coefficient-one', say: `${I(L)} is 1${I(L)}, so you take away 1: ${nH(D, 'dec')} − 1 = ${nH(s, 'dec')}.` },
    { t: T(neg(s)), mc: 'mc.integers.smaller-from-larger-subtraction', say: `${nH(D, 'dec')} − 1 is less than 0: ${nH(s, 'dec')}. The order of a subtraction matters.` },
  ]);
}
const decStrOr = (s: Q) => { const v = num(s); return Number.isInteger(v * 1000) ? String(+v.toFixed(3)) : `${s.p}/${s.q}`; };

// ===================================================================== 8 signs belong to terms
const signedTerms: Gen = (R, n, sg) => {
  const kind = pick(R, ['terms', 'reorder', 'coef', 'minusParen'] as const);
  const L = pick(R, LETTERS), base = { family: 'signedTerms' as const, n, sg };
  if (kind === 'coef') {
    const c = int(R, 1, 12), lead = R() < 0.5;
    const eH = lead ? `${MIN}${I(L)} + ${c}` : `${c} ${MIN} ${I(L)}`;
    return numItem({ ...base, prompt: `What is the coefficient of ${I(L)} in <b>${eH}</b>?`, board: lead ? `-${L} + ${c}` : `${c} - ${L}`, solution: [`The minus sign belongs to the term: the terms are ${lead ? `${MIN}${I(L)} and ${c}` : `${c} and ${MIN}${I(L)}`}.`, `${MIN}${I(L)} = ${MIN}1 · ${I(L)}: the coefficient is ${ans(MIN + '1')}.`] }, '', rat(-1), [
      { v: rat(1), mc: 'mc.integers.minus-sign-detached-from-term', say: `The minus in front of ${I(L)} belongs to that term: ${MIN}${I(L)} is ${MIN}1 · ${I(L)}.` },
      { v: Z, mc: 'mc.expressions.ignores-implicit-coefficient-one', say: `${MIN}${I(L)} still has one ${I(L)}, taken away: its coefficient is ${MIN}1.` },
    ], `Yes: ${MIN}${I(L)} = ${MIN}1${I(L)}.`, `${MIN}${I(L)} means ${MIN}1 times ${I(L)}.`);
  }
  if (kind === 'minusParen') {
    const qq = int(R, 2, 9);
    return numItem({ ...base, prompt: `In <b>${MIN}(${I(L)} + ${qq})</b> the minus sign in front of the parentheses is the same as multiplying by which number?`, board: `-(${L} + ${qq})`, solution: [`${MIN}(${I(L)} + ${qq}) = ${MIN}1(${I(L)} + ${qq}) = ${MIN}${I(L)} ${MIN} ${qq}.`, `So a minus in front of parentheses is ${ans(MIN + '1')} times the group.`] }, '', rat(-1), [
      { v: rat(1), mc: 'mc.integers.minus-sign-detached-from-term', say: `The minus stays with the group: it means ${MIN}1 times (${I(L)} + ${qq}).` },
      { v: Z, say: `Times 0 would wipe the group out. A lone minus means ${MIN}1 times the group.` },
    ], `Yes: ${MIN}(${I(L)} + ${qq}) = ${MIN}1(${I(L)} + ${qq}) = ${MIN}${I(L)} ${MIN} ${qq}.`, `A minus sign alone in front means ${MIN}1 times.`);
  }
  const a = int(R, 2, 15), p = int(R, 2, 9), b = int(R, 2, 12);
  const e: Term[] = kind === 'terms' && R() < 0.35 ? [t(-p, 'x'), t(a), t(-b)] : [t(a), t(-p, 'x'), t(b)];
  const eH = subH(exHtml(e), L);
  if (kind === 'terms') {
    const list = (ts: Term[]) => subH(ts.map(s => termHtml(s)).join(', '), L);
    const det = e.map(s => ({ c: rat(Math.abs(s.c.p)), v: s.v })), moved = e.map((s, i) => ({ c: i === 0 ? rat(Math.abs(s.c.p)) : (e[i - 1]!.c.p < 0 ? rat(-Math.abs(s.c.p)) : rat(Math.abs(s.c.p))), v: s.v }));
    return choiceItem(R, { ...base, prompt: `What are the terms of <b>${eH}</b>?`, board: sub(exTex(e), L), solution: ['Each sign belongs to the term right after it.', `The terms are ${list(e)}.`] }, [
      { t: list(e), ok: true, say: 'Yes: every term keeps the sign in front of it.' },
      { t: list(det), mc: 'mc.integers.minus-sign-detached-from-term', say: `The minus belongs to its term: ${list(e)}.` },
      { t: list(moved), mc: 'mc.integers.minus-sign-detached-from-term', say: `A sign belongs to the term AFTER it, not before: ${list(e)}.` },
    ]);
  }
  // reorder: which is the same?
  const xT = e.find(s => s.v === 'x')!, cs = e.filter(s => s.v === '');
  const good: Term[] = [...cs, xT];
  const detached: Term[] = [cs[0]!, cs[1]!, { c: qAbs_(xT.c), v: 'x' }];
  const regroupT = `${termHtml(cs[0]!)} ${MIN} (${subH(termHtml({ c: qAbs_(xT.c), v: 'x' }), L)} + ${Math.abs(cs[1]!.c.p)})`;
  const opts: Opt[] = [
    { t: subH(exHtml(good), L), ok: true, say: 'Yes: the terms moved, and each one took its sign with it.' },
    { t: subH(exHtml(detached), L), mc: 'mc.integers.minus-sign-detached-from-term', say: `The minus belongs to ${subH(termHtml(xT), L)}: when the term moves, its sign moves with it. ${subH(exHtml(good), L)}.` },
    { t: regroupT, mc: 'mc.properties.regroups-subtraction-or-division', say: 'Putting parentheses after a minus changes the value: the minus would then take away the whole group.' },
  ];
  return choiceItem(R, { ...base, prompt: `Which expression is the same as <b>${eH}</b>?`, board: sub(exTex(e), L), solution: [`The terms are ${subH(e.map(s => termHtml(s)).join(', '), L)}.`, `Reorder them, each with its sign: ${subH(exHtml(good), L)}.`] }, opts);
};
const qAbs_ = (c: Q) => rat(Math.abs(c.p), c.q);

// ===================================================================== 12 expand, then combine
const expandCollect: Gen = (R, n, sg) => {
  const kind = pick(R, ['outside', 'outside', 'twoGroups', 'rational'] as const);
  const base = { family: 'expandCollect' as const, n, sg };
  if (kind === 'twoGroups') {
    const f1 = int(R, 2, 6), f2 = nz(R, -5, 6), q1 = nz(R, -6, 7), q2 = nz(R, -6, 7);
    const g1: Ex = [t(1, 'x'), t(q1)], g2: Ex = [t(1, 'x'), t(q2)];
    const out = normal([...expand(t(f1), g1), ...expand(t(f2), g2)]), A = xc(out), B = cc(out);
    if (isZero(A)) return expandCollect(R, n, sg);
    const eT = `${prodTex(t(f1), g1)} ${f2 < 0 ? '-' : '+'} ${prodTex(t(Math.abs(f2)), g2)}`;
    const eH = `${prodHtml(t(f1), g1)} ${f2 < 0 ? MIN : '+'} ${prodHtml(t(Math.abs(f2)), g2)}`;
    const pats: Pat[] = [
      { x: rat(f1 + f2), y: rat(q1 + q2), mc: 'mc.properties.partial-distribution', say: `Each factor multiplies the constant in its group too: ${f1} · ${nH(q1)} and ${nH(f2)} · ${nH(q2)}.` },
      { x: qAdd(A, B), y: Z, mc: 'mc.expressions.combines-unlike-terms', say: `${termHtml({ c: A, v: 'x' })} and ${nH(B)} are unlike terms.` },
    ];
    if (f2 < 0) pats.push({ x: A, y: rat(f1 * q1 - f2 * q2), mc: 'mc.integers.distribute-negative-first-term-only', say: `The ${MIN}${Math.abs(f2)} multiplies both terms of its group: ${nH(f2)} · ${nH(q2)} = ${nH(f2 * q2)}.` });
    return pairItem({ ...base, prompt: `Expand, then combine: <b>${eH}</b>`, board: eT,
      solution: [`Expand each group: ${exHtml(expand(t(f1), g1))} and ${exHtml(expand(t(f2), g2), { raw: true })}.`, `Combine: ${axb(A, B)}.`] }, '', 'x +', [A, B], pats, `Yes: ${axb(A, B)}.`, 'Expand each group first (every term inside), then combine the like terms.');
  }
  let f: Term, inner: Ex, k: Term, fmt: Fmt = 'frac', outsideFirst = true;
  if (kind === 'rational') {
    const [a, b] = pick(R, [[1, 2], [1, 3], [2, 3], [3, 4], [1, 4]] as [number, number][]);
    f = t(rat(a, b)); inner = [t(b * int(R, 1, 3), 'x'), t(b * nz(R, -4, 5))]; k = t(nz(R, -6, 6), 'x'); outsideFirst = false;
  } else {
    const fv = nz(R, -6, 6); f = t(fv === 1 ? 2 : fv);
    const p = int(R, 1, 9), qq = int(R, 1, 9);
    inner = R() < 0.5 ? [t(qq), t(-p, 'x')] : [t(p, 'x'), t(R() < 0.5 ? -qq : qq)];
    k = R() < 0.75 ? t(int(R, 2, 15)) : t(nz(R, -9, 9), 'x'); outsideFirst = R() < 0.75;
  }
  const prod = expand(f, inner), all = outsideFirst ? [k, ...prod] : [...prod, k], out = normal(all), A = xc(out), B = cc(out);
  if (isZero(A)) return expandCollect(R, n, sg);
  const fAbs: Term = { c: qAbs_(f.c), v: '' };
  const pT = prodTex(fAbs, inner, { fmt }), pH = prodHtml(fAbs, inner, { fmt });
  const op = f.c.p < 0 ? '-' : '+', opH = f.c.p < 0 ? MIN : '+';
  const eT = outsideFirst ? `${termTex(k)} ${op} ${pT}` : `${prodTex(f, inner, { fmt })} ${k.c.p < 0 ? '-' : '+'} ${termTex({ c: qAbs_(k.c), v: k.v })}`;
  const eH = outsideFirst ? `${termHtml(k)} ${opH} ${pH}` : `${prodHtml(f, inner, { fmt })} ${k.c.p < 0 ? MIN : '+'} ${termHtml({ c: qAbs_(k.c), v: k.v })}`;
  const pats: Pat[] = [];
  if (outsideFirst && k.v === '') {
    const s = qAdd(k.c, f.c), lr = normal(expand({ c: s, v: '' }, inner));
    pats.push({ x: xc(lr), y: cc(lr), mc: 'mc.properties.left-to-right-ignoring-precedence', say: `Multiplication comes before addition: ${termHtml(k)} is not part of the product. Expand ${f.c.p < 0 ? MIN : ''}${pH} first.` });
    const est = normal(expand(f, [k, ...inner]));
    pats.push({ x: xc(est), y: cc(est), mc: 'mc.estimation.changes-operations-to-estimate', say: `${termHtml(k)} is outside the parentheses: it is added once, not multiplied.` });
  }
  pats.push({ x: xc(prod), y: cc(prod), mc: 'mc.expressions.omits-noncanceling-term', say: `Don't lose ${termHtml(k)}: it is still there after expanding.` });
  if (f.c.p < 0) {
    const w = inner.map((s, i) => ({ c: i === 0 ? qMul(f.c, s.c) : qMul(qAbs_(f.c), s.c), v: s.v }));
    const o2 = normal(outsideFirst ? [k, ...w] : [...w, k]);
    pats.push({ x: xc(o2), y: cc(o2), mc: 'mc.integers.distribute-negative-first-term-only', say: `The minus in front of ${pH} changes the sign of EVERY term inside.` });
  }
  pats.push({ x: qAdd(A, B), y: Z, mc: 'mc.expressions.combines-unlike-terms', say: `${termHtml({ c: A, v: 'x' })} and ${nH(B)} are unlike terms.` });
  return pairItem({ ...base, prompt: `Expand, then combine: <b>${eH}</b>`, board: eT,
    solution: [`Expand first (multiplication before addition): ${f.c.p < 0 ? MIN : ''}${pH} = ${exHtml(prod)}.`, `Now combine: ${exHtml(all)} = ${axb(A, B)}.`],
    pic: picFor(f, inner, fmt) }, '', 'x +', [A, B], pats, `Yes: ${axb(A, B)}.`, 'Expand the product first, keeping every sign; then combine like terms.');
};

// ===================================================================== 13 add and subtract expressions
const subtract: Gen = (R, n, sg) => {
  const kind = pick(R, ['sub', 'sub', 'add', 'from', 'rational'] as const);
  const base = { family: 'subtract' as const, n, sg };
  if (kind === 'rational') {
    const a = int(R, 2, 9), c = int(R, 1, 9), [p, d] = pick(R, [[1, 2], [1, 3], [3, 4], [2, 3]] as [number, number][]);
    let b = nz(R, -6, 6); if (b === c) b = -b;
    const A: Ex = [t(a, 'x'), t(b)], B: Ex = [t(c), t(rat(-p, d), 'x')];
    const out = normal([...A, ...negEx(B)]), X = xc(out), K = cc(out);
    const wrong = normal([...A, t(-c), t(rat(-p, d), 'x')]);
    const T = (e: Ex) => exHtml(normal(e));
    return choiceItem(R, { ...base, prompt: `Simplify: <b>(${exHtml(A)}) ${MIN} (${exHtml(B)})</b>`, board: `(${exTex(A)}) - (${exTex(B)})`,
      solution: [`Subtracting a group subtracts every term: ${MIN}(${exHtml(B)}) = ${exHtml(negEx(B))}.`, `${exHtml([...A, ...negEx(B)])} = ${T(out)}.`] }, [
      { t: T(out), ok: true, say: `Yes: ${MIN}(${MIN}${fracH(p, d)}${I('x')}) = +${fracH(p, d)}${I('x')}, so ${a} + ${fracH(p, d)} = ${magHtml(X)} ${I('x')}'s.` },
      { t: T(wrong), mc: 'mc.integers.distribute-negative-first-term-only', say: `The minus takes away the WHOLE group: ${MIN}(${MIN}${fracH(p, d)}${I('x')}) is +${fracH(p, d)}${I('x')}.` },
      { t: T(normal([t(qAdd(X, K), 'x')])), mc: 'mc.expressions.combines-unlike-terms', say: 'x-terms and constants are unlike: keep them apart.' },
    ]);
  }
  const a = int(R, 2, 12), b = nz(R, -9, 9), c = int(R, 1, 11), d = nz(R, -9, 9);
  const A: Ex = [t(a, 'x'), t(b)], B: Ex = [t(c, 'x'), t(d)];
  if (kind === 'add') {
    const out = normal([...A, ...B]), X = xc(out), K = cc(out);
    if (isZero(X)) return subtract(R, n, sg);
    return pairItem({ ...base, prompt: `Add: <b>(${exHtml(A)}) + (${exHtml(B)})</b>`, board: `(${exTex(A)}) + (${exTex(B)})`, solution: [`Adding a group adds each of its terms: ${exHtml([...A, ...B])}.`, `Combine: ${axb(X, K)}.`] }, '', 'x +', [X, K], [
      { x: qAdd(X, K), y: Z, mc: 'mc.expressions.combines-unlike-terms', say: 'x-terms and constants are unlike: keep them apart.' },
      { x: rat(a + c), y: rat(Math.abs(b) + Math.abs(d)), mc: 'mc.integers.minus-sign-detached-from-term', say: 'Each constant keeps its sign: add them with their signs.' },
    ], `Yes: ${axb(X, K)}.`, 'Add the x-terms, add the constants (with their signs).');
  }
  const words = kind === 'from';
  const out = normal([...A, ...negEx(B)]), X = xc(out), K = cc(out);
  if (isZero(X) && isZero(K)) return subtract(R, n, sg);
  const pats: Pat[] = [
    { x: rat(a - c), y: rat(b + d), mc: 'mc.integers.distribute-negative-first-term-only', say: `The minus takes away the WHOLE second group: ${MIN}(${exHtml(B)}) = ${exHtml(negEx(B))}.` },
    { x: rat(a + c), y: rat(b + d), mc: 'mc.integers.distribute-negative-first-term-only', say: `Subtracting means taking away: ${MIN}(${exHtml(B)}) = ${exHtml(negEx(B))}.` },
  ];
  if (words) pats.unshift({ x: rat(c - a), y: rat(d - b), mc: 'mc.expressions.reverses-less-than-subtraction', say: `"Subtract B from A" means A − B: start with (${exHtml(A)}) and take away (${exHtml(B)}).` });
  pats.push({ x: qAdd(X, K), y: Z, mc: 'mc.expressions.combines-unlike-terms', say: 'x-terms and constants are unlike: keep them apart.' });
  return pairItem({ ...base, prompt: words ? `Subtract <b>${exHtml(B)}</b> from <b>${exHtml(A)}</b>.` : `Subtract: <b>(${exHtml(A)}) ${MIN} (${exHtml(B)})</b>`, board: words ? `\\text{subtract } ${exTex(B)} \\text{ from } ${exTex(A)}` : `(${exTex(A)}) - (${exTex(B)})`,
    solution: [...(words ? [`"Subtract B from A" is A − B: (${exHtml(A)}) ${MIN} (${exHtml(B)}).`] : []), `The minus is ${MIN}1 times the whole group: ${MIN}(${exHtml(B)}) = ${exHtml(negEx(B))}.`, `${exHtml([...A, ...negEx(B)])} = ${axb(X, K)}.`] },
    '', 'x +', [X, K], pats, `Yes: ${axb(X, K)}.`, 'Change the sign of EVERY term of the group you subtract, then combine.');
};
const fracH = (p: number, d: number) => magHtml(rat(p, d));

// ===================================================================== 14, 16 factor out a given factor
const factorOut: Gen = (R, n, sg) => {
  const base = { family: 'factorOut' as const, n, sg };
  let g: Term, inner: Ex, fmt: Fmt = 'frac';
  if (sg === 'factor-signed-rational') {
    const kind = pick(R, ['neg', 'neg', 'frac', 'dec', 'can'] as const);
    if (kind === 'can') {
      const gv = int(R, 2, 6), p = int(R, 1, 5), qq = int(R, 1, 9);
      const e = expand(t(-gv), [t(p, 'x'), t(-qq)]);
      return choiceItem(R, { ...base, prompt: `Can you factor <b>${MIN}${gv}</b> out of <b>${exHtml(e)}</b>?`, board: exTex(e), solution: [`Divide every term by ${MIN}${gv}: ${termHtml(e[0]!)} ÷ (${MIN}${gv}) = ${termHtml(t(p, 'x'))}, ${termHtml(e[1]!)} ÷ (${MIN}${gv}) = ${nH(-qq)}.`, `So ${exHtml(e)} = ${prodHtml(t(-gv), [t(p, 'x'), t(-qq)])}. Check: expand it back.`] }, [
        { t: `Yes: ${prodHtml(t(-gv), [t(p, 'x'), t(-qq)])}`, ok: true, say: 'Yes. Any number that is not 0 can be factored out; check by expanding.' },
        { t: 'No: only positive whole numbers can be factored out', mc: 'mc.expressions.restricts-what-can-be-factored-out', say: `Negative and fractional factors work too: ${prodHtml(t(-gv), [t(p, 'x'), t(-qq)])} expands back to ${exHtml(e)}.` },
        { t: `Yes: ${prodHtml(t(-gv), [t(p, 'x'), t(qq)])}`, mc: 'mc.integers.distribute-negative-first-term-only', say: `Expand it back: ${MIN}${gv} · ${qq} = ${MIN}${gv * qq}, not +${gv * qq}. Divide EVERY term by ${MIN}${gv}.` },
      ]);
    }
    if (kind === 'neg') { g = t(-int(R, 2, 9)); inner = [t(int(R, 1, 9), 'x'), t(nz(R, -9, 9))]; }
    else if (kind === 'frac') { const d = pick(R, [2, 3, 4]); g = t(rat(1, d)); inner = [t(R() < 0.7 ? 1 : d + 1, 'x'), t(d * nz(R, -4, 6))]; }
    else { const d = pick(R, [0.5, 0.2, 0.25, 1.5]); g = t(decQ(d)); fmt = 'dec'; inner = [t(R() < 0.6 ? 1 : int(R, 2, 4), 'x'), t(nz(R, -9, 9))]; }
  } else {
    const gv = int(R, 2, 12);
    let p = int(R, 1, 9), qq = R() < 0.2 ? 1 : int(R, 1, 9);
    while (gv * p > 100) p--; while (gv * qq > 100) qq--;
    if (p === 1 && qq === 1) qq = 2;
    g = t(gv); inner = R() < 0.2 ? [t(qq), t(p, 'x')] : [t(p, 'x'), t(qq)];
  }
  const e = expand(g, inner), iX = coef(inner, 'x'), iC = coef(inner, '');
  const eH = exHtml(e, { fmt }), gH = factorHtml(g, fmt) || MIN + '1';
  const pats: Pat[] = [
    { x: iX, y: coef(e, ''), mc: 'mc.expressions.factors-out-of-one-term-only', say: `Divide EVERY term by ${gH}: ${nH(coef(e, ''), fmt)} ÷ ${gH} = ${nH(iC, fmt)}. Check: ${gH} · ${nH(coef(e, ''), fmt)} is not ${nH(coef(e, ''), fmt)}.` },
    { x: coef(e, 'x'), y: iC, mc: 'mc.expressions.factors-out-of-one-term-only', say: `Divide EVERY term by ${gH}: ${termHtml({ c: coef(e, 'x'), v: 'x' }, fmt)} ÷ ${gH} = ${termHtml({ c: iX, v: 'x' }, fmt)}.` },
  ];
  if (qEq(iC, rat(1))) pats.push({ x: iX, y: Z, mc: 'mc.expressions.leaves-zero-for-factor-over-itself', say: `${nH(coef(e, ''))} ÷ ${gH} = 1, not 0: a term divided by itself leaves 1. Check: ${gH}(${I('x')} + 0) is just ${gH}${I('x')}.` });
  if (qEq(iX, rat(1))) pats.push({ x: Z, y: iC, mc: 'mc.expressions.leaves-zero-for-factor-over-itself', say: `${termHtml({ c: coef(e, 'x'), v: 'x' })} ÷ ${gH} = ${I('x')}, which is 1${I('x')}: type 1, not 0.` });
  if (g.c.p < 0) pats.push({ x: iX, y: neg(iC), mc: 'mc.integers.distribute-negative-first-term-only', say: `Dividing by a negative changes the sign of EVERY term: ${nH(coef(e, ''), fmt)} ÷ (${gH}) = ${nH(iC, fmt)}. Expand back to check.` });
  const lead = `${factorHtml(g, fmt) || MIN}(`;
  return pairItem({ ...base, prompt: `Factor out <b>${gH}</b>: <b>${eH} = ${factorHtml(g, fmt) || MIN}(□${I('x')} + □)</b>`, board: `${exTex(e, { fmt })} = ${factorTex(g, fmt)}(\\square x + \\square)`,
    solution: [`Divide every term by ${gH}: ${e.map(s => `${termHtml(s, fmt)} ÷ ${gH} = ${termHtml({ c: qDiv(s.c, g.c), v: s.v }, fmt)}`).join(', ')}.`, `So ${eH} = ${prodHtml(g, normal(inner), { fmt })}. Check: expand it back.`],
    pic: { kind: 'grid', factor: g, terms: normal(inner), fmt, ask: { terms: true }, signed: g.c.p < 0 || inner.some(s => s.c.p < 0) } }, lead, 'x +', [iX, iC], pats,
    `Yes: ${eH} = ${prodHtml(g, normal(inner), { fmt })}.`, `Divide each term by ${gH}; expand your answer to check.`);
};

// ===================================================================== 15 the greatest common factor
const GCFS = [4, 6, 8, 9, 10, 12, 14, 15, 16, 18, 20];
function gcfPair(R: R): { G: number; a: number; b: number; A: number; B: number } {
  for (;;) {
    const G = pick(R, GCFS), a = int(R, 1, 9), b = int(R, 1, 11);
    if (gcfOf([a, b]) !== 1 || G * a > 100 || G * b > 100 || a === b) continue;
    return { G, a, b, A: G * a, B: G * b };
  }
}
const smallDiv = (G: number) => [2, 3, 5, 7].find(d => G % d === 0 && d < G)!;
const gcf: Gen = (R, n, sg) => {
  const { G, a, b, A, B } = gcfPair(R), d = smallDiv(G), L = pick(R, LETTERS);
  const e: Ex = [t(A, 'x'), t(B)], eH = subH(exHtml(e), L);
  const P = (f: number, x: number, c: number) => subH(prodHtml(t(f), [t(x, 'x'), t(c)]), L);
  return choiceItem(R, { family: 'gcf', n, sg, prompt: `Factor completely: <b>${eH}</b>`, board: sub(exTex(e), L),
    solution: [`The greatest common factor of ${A} and ${B} is ${G}.`, `${A} ÷ ${G} = ${a}, ${B} ÷ ${G} = ${b}: ${eH} = ${P(G, a, b)}.`, `Inside, ${a} and ${b} share no factor but 1: that is "completely".`],
    pic: { kind: 'grid', factor: t(G), terms: [t(a, 'x'), t(b)], fmt: 'frac', ask: { factor: true, terms: true }, letter: L } }, [
    { t: P(G, a, b), ok: true, say: `Yes: ${G} is the GREATEST common factor; ${a} and ${b} share nothing more.` },
    { t: P(d, A / d, B / d), mc: 'mc.expressions.stops-at-non-greatest-common-factor', say: `That is a factorization, but not complete: ${A / d} and ${B / d} still share ${G / d}. Take out ${G}.` },
    { t: P(G, a, B), mc: 'mc.expressions.factors-out-of-one-term-only', say: `Expand it: ${G} · ${B} = ${G * B}, not ${B}. Divide BOTH terms by ${G}.` },
    { t: P(G / d, a * d, b * d), mc: 'mc.expressions.stops-at-non-greatest-common-factor', say: `${a * d} and ${b * d} still share ${d}: take out ${G} in all.` },
  ]);
};
const NAMES = [['Ana', 'Ben'], ['Maya', 'Leo'], ['Priya', 'Sam'], ['Jordan', 'Riley'], ['Kai', 'Nora'], ['Omar', 'Zoe']] as const;
const twoFactorings: Gen = (R, n, sg) => {
  const { G, a, b, A, B } = gcfPair(R), d = smallDiv(G), [p1, p2] = pick(R, NAMES), compl = R() < 0.45;
  const e: Ex = [t(A, 'x'), t(B)];
  const f1 = prodHtml(t(d), [t(A / d, 'x'), t(B / d)]), f2 = prodHtml(t(G), [t(a, 'x'), t(b)]);
  return choiceItem(R, { family: 'twoFactorings', n, sg, prompt: `The task says <b>${compl ? 'factor completely' : 'factor'}</b> ${exHtml(e)}. ${p1} writes <b>${f1}</b>. ${p2} writes <b>${f2}</b>. Who is right?`, board: `${exTex(e)}`,
    solution: [`Both expand to ${exHtml(e)}, so both are factorizations.`, compl ? `"Completely" asks for the greatest common factor, ${G}: only ${p2}'s ${f2} is complete.` : `"Factor" accepts any correct factorization: both are right.`] }, compl ? [
    { t: `Only ${p2}: ${G} is the greatest common factor`, ok: true, say: `Yes. Inside ${p1}'s parentheses ${A / d} and ${B / d} still share ${G / d}.` },
    { t: 'Both: each one expands to the same expression', mc: 'mc.expressions.stops-at-non-greatest-common-factor', say: `Both are factorizations, but "completely" means the greatest common factor: ${A / d} and ${B / d} still share ${G / d}.` },
    { t: `Only ${p1}: smaller factors are simpler`, mc: 'mc.expressions.stops-at-non-greatest-common-factor', say: `"Completely" means nothing more can come out: ${A / d} and ${B / d} still share ${G / d}.` },
    { t: 'Neither: they got different answers', mc: 'mc.expressions.factorization-believed-unique', say: `Different factorizations can both be right; here only ${p2}'s is complete.` },
  ] : [
    { t: 'Both: each one expands to the same expression', ok: true, say: `Yes. "Factor" accepts any correct factorization. (${p2}'s is also complete.)` },
    { t: `Only ${p2}: a factorization has one right answer`, mc: 'mc.expressions.factorization-believed-unique', say: `Expand ${p1}'s: ${d} · ${A / d}${I('x')} + ${d} · ${B / d} = ${exHtml(e)}. It is right too; only "factor completely" would ask for ${G}.` },
    { t: `Only ${p1}`, say: `Expand ${p2}'s: ${G} · ${a}${I('x')} + ${G} · ${b} = ${exHtml(e)}. Both are right.` },
    { t: 'Neither: they got different answers', mc: 'mc.expressions.factorization-believed-unique', say: 'Different factorizations can both be right: expand each one to check.' },
  ]);
};

// ===================================================================== 17 two variables
const twoVar: Gen = (R, n, sg) => {
  const base = { family: 'twoVar' as const, n, sg };
  const Y = (e: Ex) => e;
  if (R() < 0.5) {
    const { G, a, b, A, B } = gcfPair(R);
    const e: Ex = [t(A, 'x'), t(B, 'y')];
    const P = (f: number, x: number, y: number) => prodHtml(t(f), [t(x, 'x'), t(y, 'y')]);
    return choiceItem(R, { ...base, prompt: `Factor completely: <b>${exHtml(e)}</b>`, board: exTex(e), solution: [`The terms share the number ${G} (no variable is needed in common).`, `${exHtml(e)} = ${P(G, a, b)}: expand to check.`] }, [
      { t: P(G, a, b), ok: true, say: `Yes: ${G} · ${a}${I('x')} + ${G} · ${b}${I('y')} = ${exHtml(e)}.` },
      { t: `It cannot be factored: ${I('x')} and ${I('y')} are different`, mc: 'mc.expressions.requires-shared-variable-for-common-factor', say: `A common factor can be just a number: ${G} goes into ${A} and ${B}, so ${exHtml(e)} = ${P(G, a, b)}.` },
      { t: P(G, a, B), mc: 'mc.expressions.factors-out-of-one-term-only', say: `Expand it: ${G} · ${B}${I('y')} = ${G * B}${I('y')}. Divide BOTH terms by ${G}.` },
      { t: `${A + B}${I('x')}${I('y')}`, mc: 'mc.expressions.combines-unlike-terms', say: `${I('x')}- and ${I('y')}-terms are unlike: they do not combine into one term.` },
    ]);
  }
  const f = int(R, 2, 6), k = int(R, 1, 5), m = nz(R, -5, 5), r = int(R, 1, 3);
  const g1: Ex = [t(1, 'x'), t(k, 'y')], g2: Ex = [t(r, 'x'), t(m, 'y')];
  const out = normal([...expand(t(f), g1), ...negEx(g2)]);
  if (out.length !== 2 || out.some(s => s.v === '')) return twoVar(R, n, sg);
  const wrong = normal([...expand(t(f), g1), t(-r, 'x'), t(m, 'y')]);
  const T = (e: Ex) => exHtml(Y(e));
  return choiceItem(R, { ...base, prompt: `Simplify: <b>${prodHtml(t(f), g1)} ${MIN} (${exHtml(g2)})</b>`, board: `${prodTex(t(f), g1)} - (${exTex(g2)})`,
    solution: [`Expand: ${exHtml(expand(t(f), g1))}; subtract every term of the group: ${exHtml(negEx(g2))}.`, `Combine the ${I('x')}-terms and the ${I('y')}-terms separately: ${T(out)}.`] }, [
    { t: T(out), ok: true, say: `Yes: ${I('x')}-terms and ${I('y')}-terms combine separately.` },
    { t: T(wrong), mc: 'mc.integers.distribute-negative-first-term-only', say: `The minus takes away the whole group: ${MIN}(${exHtml(g2)}) = ${exHtml(negEx(g2))}.` },
    { t: `${num(out[0]!.c) + num(out[1]!.c)}${I('x')}${I('y')}`, mc: 'mc.expressions.combines-unlike-terms', say: `${I('x')}- and ${I('y')}-terms are unlike: keep them apart.` },
  ]);
};

// ===================================================================== 18 property-justified chains
const PROPS = { d: 'Distributive property', c: 'Commutative property', a: 'Associative property', o: 'Order of operations (PEMDAS)' } as const;
function propOpts(right: 'd' | 'c' | 'a', why: string): Opt[] {
  return (['d', 'c', 'a', 'o'] as const).map(k => ({
    t: PROPS[k], ok: k === right,
    mc: k === right ? undefined : k === 'o' ? 'mc.properties.names-non-property' : (k === 'a' && right === 'c') || (k === 'c' && right === 'a') ? 'mc.properties.associative-commutative-confused' : undefined,
    say: k === right ? `Yes: ${why}` : k === 'o' ? 'PEMDAS says which operation to do first; it does not allow rewriting. Name the property that makes the two sides equal.' : k === 'a' ? 'The associative property moves parentheses. Look at what changed here.' : k === 'c' ? 'The commutative property swaps the order of terms. Look at what changed here.' : 'The distributive property multiplies a factor into a sum (or takes it out). Look at what changed here.',
  }));
}
const nameStep: Gen = (R, n, sg) => {
  const base = { family: 'nameStep' as const, n, sg };
  const a = int(R, 3, 7), b = int(R, 1, 9), c = int(R, 2, a - 1), k = int(R, 2, 9);
  const kind = pick(R, ['dist', 'comm', 'collect', 'assoc', 'assocMul', 'justify'] as const);
  if (kind === 'justify') {
    const [p] = pick(R, NAMES);
    const res = normal([...expand(t(a), [t(1, 'x'), t(b)]), t(-c, 'x')]);
    return choiceItem(R, { ...base, prompt: `The task: <i>show that</i> <b>${prodHtml(t(a), [t(1, 'x'), t(b)])} ${MIN} ${c}${I('x')}</b> and <b>${exHtml(res)}</b> are equivalent. ${p} only writes the answer, ${exHtml(res)}. Is that enough?`, board: `${prodTex(t(a), [t(1, 'x'), t(b)])} - ${c}x = \\,?`,
      solution: ['"Show" asks for the reasons, not only the answer.', `A chain does it: ${prodHtml(t(a), [t(1, 'x'), t(b)])} ${MIN} ${c}${I('x')} = ${a}${I('x')} + ${a * b} ${MIN} ${c}${I('x')} (distributive) = ${a}${I('x')} ${MIN} ${c}${I('x')} + ${a * b} (commutative) = ${exHtml(res)} (distributive).`] }, [
      { t: 'No: each step needs its reason (a property)', ok: true, say: 'Yes. A right answer is not yet a reason; the chain with properties is the proof.' },
      { t: 'Yes: the answer is correct, so it is shown', mc: 'mc.reasoning-language.correct-answer-needs-no-justification', say: 'A correct answer does not show WHY. "Show" asks for each step and the property behind it.' },
      { t: `Yes: if it works for ${I('x')} = 1 that is enough`, mc: 'mc.reasoning-language.examples-as-proof', say: 'One value is not every value. The properties make it true for every x.' },
    ]);
  }
  let lhs: string, rhs: string, right: 'd' | 'c' | 'a', why: string;
  if (kind === 'dist') { lhs = `${a}(x + ${b}) - ${c}x`; rhs = `${a}x + ${a * b} - ${c}x`; right = 'd'; why = `the ${a} is multiplied into the sum.`; }
  else if (kind === 'comm') { lhs = `${a}x + ${a * b} - ${c}x`; rhs = `${a}x - ${c}x + ${a * b}`; right = 'c'; why = 'the terms change order (each keeps its sign).'; }
  else if (kind === 'collect') { lhs = `${a}x - ${c}x + ${a * b}`; rhs = `(${a} - ${c})x + ${a * b}`; right = 'd'; why = `the common factor x is taken out: ${a}x − ${c}x = (${a} − ${c})x.`; }
  else if (kind === 'assoc') { lhs = `(${a}x + ${k}x) + ${b}`; rhs = `${a}x + (${k}x + ${b})`; right = 'a'; why = 'only the grouping changes.'; }
  else { lhs = `(${k} \\cdot ${a}) \\cdot x`; rhs = `${k} \\cdot (${a} \\cdot x)`; right = 'a'; why = 'only the grouping changes.'; }
  const html = (s: string) => s.replace(/\\cdot/g, '·').replace(/ - /g, ` ${MIN} `).replace(/x/g, I('x'));
  return choiceItem(R, { ...base, prompt: `Which property justifies this step? <b>${html(lhs)} = ${html(rhs)}</b>`, board: `${lhs} = ${rhs}`,
    solution: [right === 'd' ? 'A factor goes into a sum, or comes out of one: distributive.' : right === 'c' ? 'Same terms, new order: commutative.' : 'Same order, new grouping: associative.', `Here ${why}`] }, propOpts(right, why));
};
const faultyStep: Gen = (R, n, sg) => {
  const a = int(R, 3, 8), b = int(R, 1, 9), c = int(R, 2, a - 1), err = pick(R, [1, 2, 3] as const);
  const dx = a - c === 1 ? '' : String(a - c);
  // the right chain: a(x + b) - cx = ax + ab - cx = ax - cx + ab = (a - c)x + ab
  const s1 = err === 1 ? `${a}x + ${b} - ${c}x` : `${a}x + ${a * b} - ${c}x`;
  const k1 = err === 1 ? b : a * b;
  const s2 = err === 2 ? `${a}x - ${c}x - ${k1}` : `${a}x - ${c}x + ${k1}`;
  const s3 = err === 3 ? `${a + c}x + ${k1}` : `${dx}x ${err === 2 ? '-' : '+'} ${k1}`;
  const MC = { 1: 'mc.properties.partial-distribution', 2: 'mc.integers.minus-sign-detached-from-term', 3: 'mc.integers.minus-sign-detached-from-term' } as const;
  const WHY = { 1: `step 1: the ${a} must multiply the ${b} too (${a} · ${b} = ${a * b}).`, 2: `step 2: when the terms move, +${k1} keeps its plus sign.`, 3: `step 3: ${a}x − ${c}x = ${dx}x; the minus belongs to ${c}x.` } as const;
  const board = `\\begin{aligned} & ${a}(x + ${b}) - ${c}x \\\\ ={}& ${s1} && \\text{step 1} \\\\ ={}& ${s2} && \\text{step 2} \\\\ ={}& ${s3} && \\text{step 3} \\end{aligned}`;
  const html = (s: string) => s.replace(/ - /g, ` ${MIN} `).replace(/x/g, I('x'));
  return choiceItem(R, { family: 'faultyStep', n, sg, prompt: `Which step of this chain is wrong? It starts with <b>${html(`${a}(x + ${b}) - ${c}x`)}</b>.`, board,
    solution: [`The faulty one is ${WHY[err]}`, `The right chain: ${html(`${a}(x + ${b}) - ${c}x`)} = ${html(`${a}x + ${a * b} - ${c}x`)} = ${html(`${a}x - ${c}x + ${a * b}`)} = ${html(`${a - c === 1 ? '' : a - c}x + ${a * b}`)}.`] },
    [1, 2, 3].map(s => ({ t: `Step ${s}`, ok: s === err, say: s === err ? `Yes: ${WHY[err]}` : `Step ${s} follows from the line before it. Check each step against its property.` } as Opt)).concat([
      { t: 'No step: the chain is right', mc: MC[err], say: `Look again at ${WHY[err]}` },
    ]));
};

// ===================================================================== 19 counterexamples
const counter: Gen = (R, n, sg) => {
  const base = { family: 'counter' as const, n, sg };
  const kind = pick(R, ['pick', 'exception', 'equiv', 'rational'] as const);
  if (kind === 'equiv') {
    const f = int(R, 2, 6), qq = nz(R, -6, 9), inner: Ex = [t(1, 'x'), t(qq)], ex = expand(t(f), inner);
    return choiceItem(R, { ...base, prompt: `<b>${prodHtml(t(f), inner)}</b> and <b>${exHtml(ex)}</b> match at ${I('x')} = 0, 1 and 2. What shows they are equivalent?`, board: `${prodTex(t(f), inner)} \\quad ${exTex(ex)}`,
      solution: ['Matching values are evidence, but they cover only the values you tried.', `The distributive property covers every x: ${prodHtml(t(f), inner)} = ${exHtml(ex)}.`],
      pic: { kind: 'table', A: [...ex], B: [...ex], aTex: prodTex(t(f), inner), bTex: exTex(ex), xs: [0, 1, 2], show: [0, 1, 2] } }, [
      { t: `The distributive property turns one into the other, for every ${I('x')}`, ok: true, say: 'Yes. A rewrite by the properties covers every value; the checks only back it up.' },
      { t: 'The three matching values prove it', mc: 'mc.reasoning-language.examples-as-proof', say: 'Three values are not every value: 2x + 3 and 5x match at x = 1 and still differ. The property is the proof.' },
      { t: 'Nothing: matching values tell us nothing at all', mc: 'mc.reasoning-language.matching-cases-provide-no-information', say: 'Matching values ARE evidence (they are equal at those x), just not a proof for every x. The distributive property finishes it.' },
    ]);
  }
  if (kind === 'rational') {
    const d = 3, f = rat(int(R, 1, 2) * 2, d), s = int(R, 2, 4) * d, k = int(R, 2, 4);
    const lhs = normal([...expand(t(f), [t(s), t(-1, 'x')]), t(-k, 'x')]);
    const wrongC = qAdd(f, rat(-k));
    const B: Ex = [t(cc(lhs)), t(wrongC, 'x')];
    if (same(lhs, B)) return counter(R, n, sg);
    const lhsH = `${magHtml(f)}(${s} ${MIN} ${I('x')}) ${MIN} ${k}${I('x')}`;
    const xs = 3;
    const va = value(lhs, xs), vb = value(B, xs);
    return choiceItem(R, { ...base, prompt: `Are <b>${lhsH}</b> and <b>${exHtml(B)}</b> equivalent?`, board: `${magTexF(f)}(${s} - x) - ${k}x \\quad ${exTex(B)}`,
      solution: [`Rewrite the first: ${magHtml(f)} · ${s} = ${nH(qMul(f, rat(s)))}, ${magHtml(f)} · (${MIN}${I('x')}) = ${MIN}${magHtml(f)}${I('x')}, then ${MIN}${magHtml(f)}${I('x')} ${MIN} ${k}${I('x')} = ${termHtml({ c: coef(lhs, 'x'), v: 'x' })}.`, `So it is ${exHtml(lhs)}, not ${exHtml(B)}. Check ${I('x')} = 3: ${nH(va)} and ${nH(vb)}.`],
      pic: { kind: 'table', A: lhs, B: [...B], aTex: `${magTexF(f)}(${s} - x) - ${k}x`, bTex: exTex(B), xs: [0, 3], show: [0] } }, [
      { t: `No: the first one is ${exHtml(lhs)}`, ok: true, say: `Yes: rewritten, the x-terms differ. At x = 3 they give ${nH(va)} and ${nH(vb)}.` },
      { t: 'Yes: both start with the same number', mc: 'mc.equal-sign.equal-means-same-look', say: `Same-looking parts are not the test. Rewrite: the first is ${exHtml(lhs)}.` },
      { t: `Yes: they match at ${I('x')} = 0`, mc: 'mc.reasoning-language.examples-as-proof', say: `Matching at 0 is one value. At x = 3 they give ${nH(va)} and ${nH(vb)}.` },
    ]);
  }
  let p: number, r: number, s: number, x0: number, qq: number;
  do { p = int(R, 1, 6); r = int(R, 1, 7); s = int(R, 0, 9); x0 = pick(R, [0, 1, 1, 2]); qq = (r - p) * x0 + s; } while (p === r || qq < 0 || qq > 20 || (x0 === 0 && qq !== s));
  const A: Ex = qq ? [t(p, 'x'), t(qq)] : [t(p, 'x')], B: Ex = s ? [t(r, 'x'), t(s)] : [t(r, 'x')];
  if (same(A, B)) return counter(R, n, sg);
  const x1 = x0 === 2 ? 3 : x0 + 2, V0 = num(value(A, x0)), a1 = num(value(A, x1)), b1 = num(value(B, x1));
  const pic: Pic = { kind: 'table', A: [...A], B: [...B], aTex: exTex(A), bTex: exTex(B), xs: [x0, x1].sort((u, v) => u - v), show: [] };
  if (kind === 'pick') {
    return choiceItem(R, { ...base, prompt: `Which check shows that <b>${exHtml(A)}</b> and <b>${exHtml(B)}</b> are NOT equivalent?`, board: `${exTex(A)} \\quad ${exTex(B)}`,
      solution: [`At ${I('x')} = ${x0} both are ${V0}: that does not decide anything.`, `At ${I('x')} = ${x1}: ${a1} and ${b1}. One value where they differ is a counterexample.`], pic }, [
      { t: `${I('x')} = ${x1}: they give ${a1} and ${b1}`, ok: true, say: 'Yes. One value where they differ is enough: not equivalent.' },
      { t: `${I('x')} = ${x0}: they give ${V0} and ${V0}`, mc: 'mc.reasoning-language.examples-as-proof', say: `At ${I('x')} = ${x0} they MATCH, so that check cannot show they differ. Try another value.` },
      { t: `None: they match at ${I('x')} = ${x0}, so they are equivalent`, mc: 'mc.reasoning-language.examples-as-proof', say: `Matching at one value is not matching at every value: ${I('x')} = ${x1} gives ${a1} and ${b1}.` },
    ]);
  }
  const [pn] = pick(R, NAMES);
  return choiceItem(R, { ...base, prompt: `<b>${exHtml(A)}</b> and <b>${exHtml(B)}</b> match at ${I('x')} = ${x0} but differ at ${I('x')} = ${x1}. ${pn} says ${I('x')} = ${x1} is just an exception. What is the verdict?`, board: `${exTex(A)} \\quad ${exTex(B)}`,
    solution: ['Equivalent means equal for EVERY value of x.', `One value where they differ (${I('x')} = ${x1}) breaks that: not equivalent.`], pic: { ...pic, show: [x0] } }, [
    { t: 'Not equivalent: one value where they differ is enough', ok: true, say: 'Yes. A counterexample is not an exception; it disproves "always equal".' },
    { t: `Equivalent: ${I('x')} = ${x1} is only an exception`, mc: 'mc.reasoning-language.counterexample-as-exception', say: '"Equivalent" is a claim about every value. One counterexample is enough to break it.' },
    { t: 'We cannot tell anything from checking values', mc: 'mc.reasoning-language.matching-cases-provide-no-information', say: `Checking can disprove: they differ at ${I('x')} = ${x1}, so they are not equivalent.` },
  ]);
};
const magTexF = (f: Q) => `\\tfrac{${f.p}}{${f.q}}`;

// ===================================================================== 20 what each form shows
const KITS = [
  { kit: 'kit', items: ['a T-shirt', 'a cap'], pl: 'caps', word: 'kits' },
  { kit: 'lunch', items: ['a sandwich', 'a drink'], pl: 'drinks', word: 'lunches' },
  { kit: 'ticket bundle', items: ['a ticket', 'a snack'], pl: 'snacks', word: 'bundles' },
  { kit: 'supply pack', items: ['a notebook', 'a set of pens'], pl: 'sets of pens', word: 'packs' },
] as const;
const context: Gen = (R, n, sg) => {
  const base = { family: 'context' as const, n, sg };
  if (R() < 0.3) {
    const w = 'w';
    const ask = pick(R, ['sum', 'grouped'] as const);
    return choiceItem(R, { ...base, prompt: `A rectangle has length ${I('l')} and width ${I(w)}. Its perimeter is <b>2(${I('l')} + ${I(w)})</b> or <b>2${I('l')} + 2${I(w)}</b>. ${ask === 'grouped' ? 'Which form shows "one length plus one width, twice"?' : 'Which form shows "two lengths plus two widths"?'}`, board: '2(l + w) \\quad 2l + 2w',
      solution: ['Both forms give the same perimeter for every rectangle (distributive property).', '2(l + w): half the way around, twice. 2l + 2w: the two lengths and the two widths.'] }, [
      { t: ask === 'grouped' ? `2(${I('l')} + ${I(w)})` : `2${I('l')} + 2${I(w)}`, ok: true, say: 'Yes. Same value, but each form shows a different way to walk around the rectangle.' },
      { t: ask === 'grouped' ? `2${I('l')} + 2${I(w)}` : `2(${I('l')} + ${I(w)})`, mc: 'mc.expressions.sees-rewriting-as-ritual', say: 'Both are right as values; the question is which one SHOWS that structure. Read the grouping.' },
      { t: 'Neither: the two forms give different perimeters', mc: 'mc.expressions.rewriting-changes-described-situation', say: 'They are equivalent: the same perimeter for every l and w. Only the way of reading it changes.' },
    ]);
  }
  const K = pick(R, KITS), k = int(R, 2, 8), c = int(R, 2, 9), ask = pick(R, ['one', 'parts', 'meaning'] as const);
  const P = `${k}(${I('x')} + ${c})`, S = `${k}${I('x')} + ${k * c}`;
  const intro = `Each ${K.kit} has ${K.items[0]} that costs $${I('x')} and ${K.items[1]} that costs $${c}. The cost of ${k} ${K.word} is <b>${P}</b> or <b>${S}</b> dollars.`;
  const sol = [`${P}: ${k} ${K.word}, each costing ${I('x')} + ${c}.`, `${S}: ${k} of the first item (${k}${I('x')}) plus ${k} of the second ($${k * c}).`];
  if (ask === 'one') return choiceItem(R, { ...base, prompt: `${intro} Which form shows the cost of ONE ${K.kit} right inside it?`, board: `${k}(x + ${c}) \\quad ${k}x + ${k * c}`, solution: sol, pic: tilesFit(k, 1, c) ? { kind: 'tiles', a: k, p: 1, q: c } : undefined }, [
    { t: `${P}: the ${I('x')} + ${c} is one ${K.kit}`, ok: true, say: `Yes. The product form keeps one ${K.kit} together as a group.` },
    { t: `${S}: the expanded form always shows the most`, mc: 'mc.expressions.sees-rewriting-as-ritual', say: `The expanded form shows the totals per item; the cost of one ${K.kit}, ${I('x')} + ${c}, is only visible in ${P}.` },
    { t: 'Neither: they are the costs of different purchases', mc: 'mc.expressions.rewriting-changes-described-situation', say: `They are the SAME purchase written two ways: equal for every ${I('x')}.` },
  ]);
  if (ask === 'parts') return choiceItem(R, { ...base, prompt: `${intro} What does the <b>${k * c}</b> in ${S} tell you?`, board: `${k}x + ${k * c}`, solution: sol }, [
    { t: `The cost of the ${k} ${K.pl}`, ok: true, say: `Yes: ${k} times $${c}.` },
    { t: `The cost of one ${K.kit}`, say: `One ${K.kit} costs ${I('x')} + ${c}. The ${k * c} is ${k} × $${c}: the second item for all ${k}.` },
    { t: `A different total from ${P}`, mc: 'mc.expressions.rewriting-changes-described-situation', say: `${S} is ${P} expanded: the same total for every ${I('x')}.` },
  ]);
  return choiceItem(R, { ...base, prompt: `${intro} Riley says the two forms describe two different shopping trips. Is Riley right?`, board: `${k}(x + ${c}) = ${k}x + ${k * c}`, solution: sol }, [
    { t: `No: they are equal for every ${I('x')}, the same trip seen two ways`, ok: true, say: `Yes. ${P} groups by ${K.kit}; ${S} groups by item. Same cost.` },
    { t: 'Yes: different forms describe different situations', mc: 'mc.expressions.rewriting-changes-described-situation', say: 'Rewriting by a property keeps the value; it only shows the same situation another way.' },
    { t: 'Yes: only the expanded form is the real cost', mc: 'mc.expressions.sees-rewriting-as-ritual', say: 'Both are the real cost; each form makes a different part easy to see.' },
  ]);
};

// ===================================================================== 21 multiply by a monomial
const monomial: Gen = (R, n, sg) => {
  const base = { family: 'monomial' as const, n, sg };
  const kind = pick(R, ['mono', 'frac', 'int', 'dec'] as const);
  if (kind === 'mono') {
    const useDec = R() < 0.4;
    const c = useDec ? decQ(pick(R, [-2.3, 1.5, 0.4, -0.6, 2.5])) : rat(pick(R, [1, 1, 3, -1]), pick(R, [2, 3, 4]));
    const d = useDec ? rat(pick(R, [1, 2, 3])) : rat(pick(R, [2, 4, 6, 8, 3, -4]));
    const fmt: Fmt = useDec ? 'dec' : 'frac';
    const prod = qMul(c, d), added = qAdd(c, d);
    if (qEq(added, prod)) return monomial(R, n, sg);
    const T = (k: Q, v: 'x' | 'x2') => termHtml({ c: k, v }, fmt);
    const opts: Opt[] = [
      { t: T(prod, 'x2'), ok: true, say: `Yes: the numbers multiply (${nH(c, fmt)} · ${nH(d, fmt)} = ${nH(prod, fmt)}) and ${I('x')} · ${I('x')} = ${I('x')}<sup>2</sup>.` },
      { t: T(added, 'x2'), mc: 'mc.expressions.adds-when-multiplying-terms', say: `Multiplying terms multiplies the coefficients: ${nH(c, fmt)} · ${nH(d, fmt)} = ${nH(prod, fmt)}.` },
      { t: T(prod, 'x'), say: `${I('x')} · ${I('x')} is ${I('x')}<sup>2</sup>, not ${I('x')}.` },
    ];
    return choiceItem(R, { ...base, prompt: `Multiply: <b>(${T(c, 'x')})(${T(d, 'x')})</b>`, board: `(${termTex({ c, v: 'x' }, fmt)})(${termTex({ c: d, v: 'x' }, fmt)})`,
      solution: ['Reorder (commutative): numbers together, letters together.', `${nH(c, fmt)} · ${nH(d, fmt)} = ${nH(prod, fmt)}; ${I('x')} · ${I('x')} = ${I('x')}<sup>2</sup>: ${T(prod, 'x2')}.`] }, opts);
  }
  let f: Term, inner: Ex, fmt: Fmt = 'frac', right = false;
  if (kind === 'frac') { const [p, d] = pick(R, [[1, 2], [1, 3], [3, 2], [-1, 2]] as [number, number][]); f = t(rat(p, d), 'x'); inner = [t(d * int(R, 1, 4), 'x'), t(d * nz(R, -4, 4))]; }
  else if (kind === 'int') { f = t(nz(R, -5, 6), 'x'); if (f.c.p === 1) f = t(2, 'x'); inner = [t(int(R, 1, 6), 'x'), t(nz(R, -9, 9))]; }
  else { f = t(decQ(pick(R, [-2.3, 0.5, 1.2, -0.4])), 'x'); fmt = 'dec'; inner = [t(decQ(pick(R, [1.1, 2, 0.5, 3])) ), t(1, 'x')]; right = true; }
  const out = expand(f, inner);
  const X2 = coef(out, 'x2'), X1 = coef(out, 'x');
  const show = (e: Ex) => exHtml(normal(e), { fmt });
  const iX = inner.find(s => s.v === 'x')!, iC = inner.find(s => s.v === '')!;
  const opts: Opt[] = [
    { t: show(out), ok: true, say: `Yes: ${termHtml(f, fmt)} times EVERY term: ${out.map(s => termHtml(s, fmt)).join(' and ')}.` },
    { t: show([mulTerm_x(f, iX), iC]), mc: 'mc.properties.partial-distribution', say: `The ${termHtml(f, fmt)} multiplies the ${nH(iC.c, fmt)} too: ${termHtml(mulTerm_x(f, iC), fmt)}.` },
    { t: show([{ c: qAdd(f.c, iX.c), v: 'x2' }, mulTerm_x(f, iC)]), mc: 'mc.expressions.adds-when-multiplying-terms', say: `Multiply the coefficients: ${nH(f.c, fmt)} · ${nH(iX.c, fmt)} = ${nH(X2, fmt)}, not ${nH(qAdd(f.c, iX.c), fmt)}.` },
    { t: termHtml({ c: qAdd(X2, X1), v: 'x2' }, fmt), mc: 'mc.expressions.combines-unlike-terms', say: `${I('x')}<sup>2</sup>-terms and ${I('x')}-terms are unlike: keep them apart.` },
  ];
  if (fmt === 'dec') opts.push({ t: show([{ c: qAdd(f.c, iC.c), v: 'x' }, { c: X2, v: 'x2' }]), mc: 'mc.decimals.add-factors-when-multiplying', say: `${nH(f.c, fmt)} times ${nH(iC.c, fmt)} is a product: ${nH(qMul(f.c, iC.c), fmt)}, not ${nH(qAdd(f.c, iC.c), fmt)}.` });
  return choiceItem(R, { ...base, prompt: `Expand: <b>${right ? `(${exHtml(inner, { fmt })})(${termHtml(f, fmt)})` : `${termHtml(f, fmt)}(${exHtml(inner, { fmt })})`}</b>`, board: right ? `(${exTex(inner, { fmt })})(${termTex(f, fmt)})` : `${termTex(f, fmt)}(${exTex(inner, { fmt })})`,
    solution: [`Multiply ${termHtml(f, fmt)} into every term: ${inner.map(s => `${termHtml(f, fmt)} · ${termHtml(s, fmt)} = ${termHtml(mulTerm_x(f, s), fmt)}`).join('; ')}.`, `So ${show(out)} (either order is fine). Check with ${I('x')} = 1.`],
    pic: { kind: 'grid', factor: f, terms: [...inner], fmt, ask: { cells: true }, signed: true } }, opts);
};
const mulTerm_x = (f: Term, s: Term): Term => ({ c: qMul(f.c, s.c), v: s.v === 'x' ? 'x2' : 'x' });

// ===================================================================== 22 factor out a monomial
const monoFactor: Gen = (R, n, sg) => {
  const base = { family: 'monoFactor' as const, n, sg };
  const kind = pick(R, ['fill', 'gcf', 'neg', 'frac'] as const);
  if (kind === 'neg') {
    const g = int(R, 2, 11), a = int(R, 2, 9);
    const e: Ex = [t(g * a, 'x'), t(-g, 'x3')];
    const inner = divide(e, t(-g, 'x'));
    return choiceItem(R, { ...base, prompt: `Fill in: <b>${exHtml(e)} = ${MIN}${g}${I('x')}( ? )</b>`, board: `${exTex(e)} = -${g}x(\\,?\\,)`,
      solution: [`Divide each term by ${MIN}${g}${I('x')}: ${g * a}${I('x')} ÷ (${MIN}${g}${I('x')}) = ${MIN}${a}; ${MIN}${g}${I('x')}<sup>3</sup> ÷ (${MIN}${g}${I('x')}) = ${I('x')}<sup>2</sup>.`, `So ${MIN}${g}${I('x')}(${exHtml(inner)}). Expand it back to check.`],
      pic: { kind: 'grid', factor: t(-g, 'x'), terms: inner, fmt: 'frac', ask: { terms: true }, signed: true } }, [
      { t: exHtml(inner), ok: true, say: 'Yes: expand back and both signs come out right.' },
      { t: exHtml([t(a), t(-1, 'x2')]), mc: 'mc.integers.distribute-negative-first-term-only', say: `Dividing by a negative flips EVERY sign: ${g * a}${I('x')} ÷ (${MIN}${g}${I('x')}) = ${MIN}${a}.` },
      { t: exHtml([t(-a), t(1, 'x3')]), mc: 'mc.exponents-roots.variable-power-quotient-keeps-power-or-base', say: `${I('x')}<sup>3</sup> ÷ ${I('x')} = ${I('x')}<sup>2</sup>: take away ONE factor of ${I('x')}.` },
    ]);
  }
  const fr_ = kind === 'frac';
  const g = fr_ ? rat(1, 2) : rat(int(R, 2, 8)), a = fr_ ? 1 : int(R, 1, 6), b = fr_ ? pick(R, [3, 5, 7, -3]) : nz(R, -9, 9);
  if (!fr_ && gcfOf([a, b]) !== 1) return monoFactor(R, n, sg);
  const G: Term = { c: g, v: 'x' }, inner: Ex = [t(a, 'x'), t(b)], e = expand(G, inner);
  const T = (ex: Ex) => exHtml(ex);
  if (kind === 'gcf') {
    const P = (f: Term, ex: Ex) => `${termHtml(f)}(${exHtml(ex)})`;
    return choiceItem(R, { ...base, prompt: `Factor out the greatest common factor: <b>${T(e)}</b>`, board: exTex(e),
      solution: [`Both terms have the number ${g.p} and a factor ${I('x')}: the GCF is ${termHtml(G)}.`, `${T(e)} = ${P(G, inner)}. Check: expand it back.`],
      pic: { kind: 'grid', factor: G, terms: [...inner], fmt: 'frac', ask: { factor: true, terms: true }, signed: b < 0 } }, [
      { t: P(G, inner), ok: true, say: `Yes: ${termHtml(G)} comes out of both terms, and nothing more is common inside.` },
      { t: P(t(g), [t(a, 'x2'), t(b, 'x')]), mc: 'mc.expressions.stops-at-non-greatest-common-factor', say: `Both terms inside still have an ${I('x')}: take out ${termHtml(G)}.` },
      { t: P(t(1, 'x'), [t(g.p * a, 'x'), t(g.p * b)]), mc: 'mc.expressions.stops-at-non-greatest-common-factor', say: `${g.p * a} and ${Math.abs(g.p * b)} still share ${g.p}: take out ${termHtml(G)}.` },
      { t: P(G, [t(a, 'x2'), t(b)]), mc: 'mc.exponents-roots.variable-power-quotient-keeps-power-or-base', say: `${termHtml(e[0]!)} ÷ ${termHtml(G)} = ${termHtml(t(a, 'x'))}: dividing by ${I('x')} takes away one ${I('x')}.` },
    ]);
  }
  return choiceItem(R, { ...base, prompt: `Fill in: <b>${T(e)} = ${termHtml(G)}( ? )</b>`, board: `${exTex(e)} = ${termTex(G)}(\\,?\\,)`,
    solution: [`Divide each term by ${termHtml(G)}: ${e.map((s, i) => `${termHtml(s)} ÷ ${termHtml(G)} = ${termHtml(inner[i]!)}`).join('; ')}.`, `So ${T(e)} = ${termHtml(G)}(${exHtml(inner)}). Expand to check.`],
    pic: { kind: 'grid', factor: G, terms: [...inner], fmt: 'frac', ask: { terms: true }, signed: b < 0 } }, [
    { t: exHtml(inner), ok: true, say: `Yes: ${termHtml(G)} · ${termHtml(inner[0]!)} = ${termHtml(e[0]!)} and ${termHtml(G)} · ${nH(b)} = ${termHtml(e[1]!)}.` },
    { t: exHtml([t(a, 'x2'), t(b)]), mc: 'mc.exponents-roots.variable-power-quotient-keeps-power-or-base', say: `${termHtml(e[0]!)} ÷ ${termHtml(G)}: the ${I('x')}<sup>2</sup> loses ONE ${I('x')}, leaving ${I('x')}.` },
    { t: exHtml([t(a, 'x2'), t(b, 'x')]), mc: 'mc.exponents-roots.variable-power-quotient-keeps-power-or-base', say: `Dividing by ${termHtml(G)} takes one ${I('x')} out of each term.` },
    { t: exHtml([t(a, 'x'), e[1]!]), mc: 'mc.expressions.factors-out-of-one-term-only', say: `Divide the second term too: ${termHtml(e[1]!)} ÷ ${termHtml(G)} = ${nH(b)}.` },
  ]);
};

export const GENS: Record<FamilyId, Gen> = {
  equalSign, likeTerms, property, areaToSum, areaToProduct, equivalent, expand: expandGen, collect: collectGen, signedTerms, expandCollect,
  subtract, factorOut, gcf, twoFactorings, twoVar, nameStep, faultyStep, counter, context, monomial, monoFactor,
};
export { addEx, value, same, normal, q };
