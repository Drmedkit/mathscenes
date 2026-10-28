// reason.ts: the exact content of "Counterexamples, inference and proof" (no DOM, no canvas).
//   claims      universal conditionals over a stated domain with pools of values: counterexamples (hypothesis true,
//               conclusion false), values where it holds, values that fail the conclusion but also the hypothesis
//               (not counterexamples), and values with a false hypothesis and a true conclusion. Squares and products
//               a value needs are supplied with it ("(−4)² = 16"), so signed / fraction arithmetic is not assessed.
//   rules       true (or explicitly stipulated) conditionals with a subject, for the laws of inference
//   forms       the four one-premise argument forms: detachment, modus tollens (valid), affirming the consequent,
//               denying the antecedent (invalid) and what may be concluded from each
//   conditions  pairs of conditions with their relation (sufficient, necessary, both, neither), checked on a domain
// Every pool and relation is verified in tests/lesson-counterexamples-and-proof.test.ts.
import { isPrime } from '../conditional-statements/logic';

/** a minus for the panel (HTML) */
export const H = (n: number) => (n < 0 ? `−${-n}` : String(n));
export const N = '<i>n</i>', X = '<i>x</i>', Av = '<i>a</i>', Bv = '<i>b</i>';
export const A = (s: string) => `<b class="a">${s}</b>`, B = (s: string) => `<b class="b">${s}</b>`, S = (s: string) => `<b class="s">${s}</b>`, W = (s: string) => `<b class="w">${s}</b>`;

// ===================== values =====================
/** a value of the claim's letter(s): numbers, its panel text, its TeX, a supplied fact */
export interface Val { v: number[]; html: string; tex: string; fact?: string; factTex?: string }
const num = (n: number, fact?: [string, string]): Val => ({ v: [n], html: H(n), tex: String(n), fact: fact?.[0], factTex: fact?.[1] });
const half = (d: number): Val => ({ v: [1 / d], html: `1/${d}`, tex: `\\tfrac{1}{${d}}`, fact: `(1/${d})² = 1/${d * d}`, factTex: `(\\tfrac{1}{${d}})^2 = \\tfrac{1}{${d * d}}` });
const sq = (n: number): Val => num(n, [`${n < 0 ? `(${H(n)})` : H(n)}² = ${n * n}`, `${n < 0 ? `(${n})` : n}^2 = ${n * n}`]);
const two = (a: number, b: number): Val => ({ v: [a, b], html: `${Av} = ${H(a)}, ${Bv} = ${H(b)}`, tex: `${a},\\ ${b}` });

// ===================== claims (universal conditionals) =====================
export interface Claim {
  key: string;
  /** the domain in words, for the prompt ("<i>n</i> is any integer") */
  domain: string;
  /** clauses (HTML) with the letter */
  hyp: string; conc: string;
  /** short TeX heads for a table: the letter(s), the hypothesis, the conclusion */
  vT: string; hT: string; cT: string;
  /** a column with the supplied fact (n², x²), when the claim needs one */
  factHead?: string;
  P(v: number[]): boolean; Q(v: number[]): boolean;
  /** hypothesis true, conclusion false */
  cx: Val[];
  /** hypothesis true, conclusion true */
  holds: Val[];
  /** hypothesis false AND conclusion false: fails the conclusion but is not a counterexample */
  premise: Val[];
  /** hypothesis false, conclusion true */
  other: Val[];
  /** the claim is about a whole number letter called a (pairs) */
  pair?: boolean;
  /** a note under the claim ("1 is not prime") */
  note?: string;
}
const ev = (n: number) => n % 2 === 0, od = (n: number) => Math.abs(n % 2) === 1, m = (k: number) => (n: number) => n % k === 0;
const range = (a: number, b: number, step = 1) => { const o: number[] = []; for (let i = a; i <= b; i += step) o.push(i); return o; };
export const CLAIMS: Claim[] = [
  {
    key: 'even4', domain: `${N} is any integer`, hyp: `${N} is even`, conc: `${N} is a multiple of 4`, vT: 'n', hT: 'n\\ \\text{even}', cT: '\\text{mult. of } 4',
    P: ([n]) => ev(n!), Q: ([n]) => m(4)(n!), cx: [2, 6, 10, 14, 18, 22, 26, 30].map(n => num(n)), holds: [4, 8, 12, 16, 20, 24].map(n => num(n)), premise: [1, 3, 5, 7, 9, 11].map(n => num(n)), other: [],
  },
  {
    key: 'oddPrime', domain: `${N} is any positive integer`, hyp: `${N} is odd`, conc: `${N} is prime`, vT: 'n', hT: 'n\\ \\text{odd}', cT: 'n\\ \\text{prime}',
    P: ([n]) => od(n!), Q: ([n]) => isPrime(n!), cx: [1, 9, 15, 21, 25, 27, 33, 35].map(n => num(n)), holds: [3, 5, 7, 11, 13, 17, 19].map(n => num(n)), premise: [4, 6, 8, 10, 12].map(n => num(n)), other: [num(2)],
    note: '1 is not prime: a prime has exactly two factors.',
  },
  {
    key: 'primeOdd', domain: `${N} is any positive integer`, hyp: `${N} is prime`, conc: `${N} is odd`, vT: 'n', hT: 'n\\ \\text{prime}', cT: 'n\\ \\text{odd}',
    P: ([n]) => isPrime(n!), Q: ([n]) => od(n!), cx: [num(2)], holds: [3, 5, 7, 11, 13, 17].map(n => num(n)), premise: [4, 6, 8, 10, 12].map(n => num(n)), other: [9, 15, 21, 1].map(n => num(n)),
  },
  {
    key: 'wholeSq', domain: `${X} is any real number`, hyp: `${X} is a whole number`, conc: `${X}² &gt; ${X}`, vT: 'x', hT: 'x\\ \\text{whole}', cT: 'x^2 > x', factHead: 'x^2',
    P: ([x]) => Number.isInteger(x!) && x! >= 0, Q: ([x]) => x! * x! > x!, cx: [sq(0), sq(1)], holds: [2, 3, 4, 5, 10].map(sq), premise: [half(2), half(3), half(4)], other: [sq(-1), sq(-2), sq(-3)],
  },
  {
    key: 'lt3', domain: `${X} is any integer`, hyp: `${X} &lt; 3`, conc: `${X}² &lt; 9`, vT: 'x', hT: 'x < 3', cT: 'x^2 < 9', factHead: 'x^2',
    P: ([x]) => x! < 3, Q: ([x]) => x! * x! < 9, cx: [-3, -4, -5, -6].map(sq), holds: [-2, -1, 0, 1, 2].map(sq), premise: [3, 4, 5, 6].map(sq), other: [],
  },
  {
    key: 'posSq', domain: `${X} is any real number`, hyp: `${X} &gt; 0`, conc: `${X}² ≥ ${X}`, vT: 'x', hT: 'x > 0', cT: 'x^2 \\ge x', factHead: 'x^2',
    P: ([x]) => x! > 0, Q: ([x]) => x! * x! >= x! - 1e-12, cx: [half(2), half(3), half(4), half(5)], holds: [1, 2, 3, 4].map(sq), premise: [], other: [sq(-1), sq(-2), sq(0)],
  },
  {
    key: 'sq4', domain: `${N} is any positive integer`, hyp: `${N}² is a multiple of 4`, conc: `${N} is a multiple of 4`, vT: 'n', hT: 'n^2\\ \\text{mult. of } 4', cT: 'n\\ \\text{mult. of } 4', factHead: 'n^2',
    P: ([n]) => m(4)(n! * n!), Q: ([n]) => m(4)(n!), cx: [2, 6, 10, 14].map(sq), holds: [4, 8, 12].map(sq), premise: [1, 3, 5, 7].map(sq), other: [],
  },
  {
    key: 'm3odd', domain: `${N} is any whole number`, hyp: `${N} is a multiple of 3`, conc: `${N} is odd`, vT: 'n', hT: '\\text{mult. of } 3', cT: 'n\\ \\text{odd}',
    P: ([n]) => m(3)(n!), Q: ([n]) => od(n!), cx: [0, 6, 12, 18, 24, 30].map(n => num(n)), holds: [3, 9, 15, 21].map(n => num(n)), premise: [2, 4, 8, 10, 14].map(n => num(n)), other: [1, 5, 7, 11].map(n => num(n)),
    note: '0 is a multiple of 3: 0 = 3 × 0.',
  },
  {
    key: 'f12', domain: `${N} is any positive integer`, hyp: `${N} is a factor of 12`, conc: `${N} is even`, vT: 'n', hT: '\\text{factor of } 12', cT: 'n\\ \\text{even}',
    P: ([n]) => 12 % n! === 0, Q: ([n]) => ev(n!), cx: [num(1), num(3)], holds: [2, 4, 6, 12].map(n => num(n)), premise: [5, 7, 9, 11].map(n => num(n)), other: [8, 10, 14].map(n => num(n)),
  },
  {
    key: 'gt2', domain: `${N} is any integer`, hyp: `${N} &gt; 2`, conc: `${N}² &gt; 9`, vT: 'n', hT: 'n > 2', cT: 'n^2 > 9', factHead: 'n^2',
    P: ([n]) => n! > 2, Q: ([n]) => n! * n! > 9, cx: [sq(3)], holds: [4, 5, 6, 7].map(sq), premise: [0, 1, 2, -1, -2].map(sq), other: [-4, -5].map(sq),
  },
  {
    key: 'sumEven', domain: `${Av} and ${Bv} are any integers`, hyp: `${Av} + ${Bv} is even`, conc: `${Av} and ${Bv} are both even`, vT: 'a,\\ b', hT: 'a + b\\ \\text{even}', cT: '\\text{both even}', pair: true,
    P: ([a, b]) => ev(a! + b!), Q: ([a, b]) => ev(a!) && ev(b!), cx: [two(3, 5), two(1, 7), two(5, 9), two(7, 3)], holds: [two(2, 4), two(6, 8), two(4, 10)], premise: [two(2, 3), two(4, 5), two(1, 6)], other: [],
  },
  {
    key: 'oddSum', domain: `${Av} and ${Bv} are any integers`, hyp: `${Av} and ${Bv} are both odd`, conc: `${Av} + ${Bv} is odd`, vT: 'a,\\ b', hT: '\\text{both odd}', cT: 'a + b\\ \\text{odd}', pair: true,
    P: ([a, b]) => od(a!) && od(b!), Q: ([a, b]) => od(a! + b!), cx: [two(3, 5), two(1, 7), two(5, 9), two(7, 11)], holds: [], premise: [two(2, 4), two(6, 8), two(2, 6)], other: [two(2, 3), two(4, 5)],
  },
];
export const claimText = (c: Claim, colour = true) => `If ${colour ? A(c.hyp) : c.hyp}, then ${colour ? B(c.conc) : c.conc}.`;
export const valText = (c: Claim, v: Val) => (c.pair ? v.html : `${c.vT === 'x' ? X : N} = ${v.html}`);

// ===================== rules (true or stipulated conditionals with a subject) =====================
export interface Rule {
  key: string;
  /** the setting sentence before the rule ("In the board game Quarry, the rule is:") */
  intro?: string;
  /** the setting as a phrase ("In the board game Quarry") */
  ctx?: string;
  /** definitions printed with the rule (shape rules) */
  defs?: string;
  /** the domain words for the Euler picture */
  domain: string;
  /** "an integer", "two angles": the rule's subject */
  any: string; it: string;
  /** predicates after the subject: p, not p, q, not q */
  p: string; np: string; q: string; nq: string;
  /** Euler region labels */
  P: string; Q: string;
  /** particular members ("Kai’s number", "∠1 and ∠2") */
  who: string[];
  /** true for real mathematics; false = a stipulated rule that holds because it is the rule */
  math: boolean;
}
export const RULES: Rule[] = [
  { key: 'm6', domain: 'the integers', any: 'an integer', it: 'it', p: 'is a multiple of 6', np: 'is not a multiple of 6', q: 'is even', nq: 'is odd', P: 'multiple of 6', Q: 'even', who: ['Kai’s secret integer', 'Mia’s integer', 'the integer on the card'], math: true },
  { key: 'm4', domain: 'the integers', any: 'an integer', it: 'it', p: 'is a multiple of 4', np: 'is not a multiple of 4', q: 'is even', nq: 'is odd', P: 'multiple of 4', Q: 'even', who: ['Omar’s secret integer', 'the integer in the box'], math: true },
  { key: 'm10', domain: 'the integers', any: 'an integer', it: 'it', p: 'is a multiple of 10', np: 'is not a multiple of 10', q: 'is a multiple of 5', nq: 'is not a multiple of 5', P: 'multiple of 10', Q: 'multiple of 5', who: ['Zoe’s secret integer', 'the integer on the board'], math: true },
  { key: 'gt', domain: 'the real numbers', any: 'a number', it: 'it', p: 'is greater than 5', np: 'is not greater than 5', q: 'is greater than 2', nq: 'is not greater than 2', P: 'greater than 5', Q: 'greater than 2', who: ['Ana’s number', 'the hidden number'], math: true },
  { key: 'vert', domain: 'pairs of angles', any: 'two angles', it: 'they', p: 'are vertical angles', np: 'are not vertical angles', q: 'are congruent', nq: 'are not congruent', P: 'vertical angles', Q: 'congruent', who: ['∠1 and ∠2', '∠3 and ∠4', '∠A and ∠B'], math: true },
  { key: 'lin', domain: 'pairs of angles', any: 'two angles', it: 'they', p: 'form a linear pair', np: 'do not form a linear pair', q: 'are supplementary', nq: 'are not supplementary', P: 'linear pair', Q: 'supplementary', who: ['∠5 and ∠6', '∠P and ∠Q'], math: true },
  { key: 'sq', domain: 'quadrilaterals', any: 'a quadrilateral', it: 'it', p: 'is a square', np: 'is not a square', q: 'is a rectangle', nq: 'is not a rectangle', P: 'square', Q: 'rectangle', who: ['ABCD', 'PQRS', 'WXYZ'], math: true, defs: 'Definitions: a rectangle has four right angles; a square has four right angles and four equal sides.' },
  { key: 'gold', intro: 'In the board game Quarry, the rule is:', ctx: 'In the board game Quarry', domain: 'the tiles in Quarry', any: 'a tile', it: 'it', p: 'is gold', np: 'is not gold', q: 'scores 5 points', nq: 'does not score 5 points', P: 'gold', Q: 'scores 5 points', who: ['tile T7', 'tile B2', 'the last tile'], math: false },
  { key: 'pw', intro: 'A school app has this rule:', ctx: 'In a school app', domain: 'passwords in the app', any: 'a password', it: 'it', p: 'has fewer than 8 characters', np: 'has at least 8 characters', q: 'is rejected', nq: 'is not rejected', P: 'under 8 characters', Q: 'rejected', who: ['Ravi’s password', 'Jada’s password'], math: false },
];
export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
export const ruleText = (r: Rule, colour = true) => `If ${r.any} ${colour ? A(r.p) : r.p}, then ${r.it} ${colour ? B(r.q) : r.q}.`;
/** a sentence about a member: "Kai’s secret integer is even." (amber for p / not p, teal for q / not q) */
export const fact = (who: string, pred: string, col: 'a' | 'b' | '') => `${cap(who)} ${col === 'a' ? A(pred) : col === 'b' ? B(pred) : pred}.`;

// ===================== the four one-premise argument forms =====================
export type FormKey = 'detach' | 'tollens' | 'affirm' | 'deny';
export const VALID: Record<FormKey, boolean> = { detach: true, tollens: true, affirm: false, deny: false };
export const FORM_NAME: Record<FormKey, string> = { detach: 'law of detachment', tollens: 'modus tollens', affirm: 'affirming the conclusion', deny: 'denying the hypothesis' };
/** the second premise of each form, and the conclusion each form claims */
export function premise2(r: Rule, who: string, f: FormKey): string {
  return f === 'detach' ? fact(who, r.p, 'a') : f === 'tollens' ? fact(who, r.nq, 'b') : f === 'affirm' ? fact(who, r.q, 'b') : fact(who, r.np, 'a');
}
export function claimed(r: Rule, who: string, f: FormKey): string {
  return f === 'detach' ? fact(who, r.q, 'b') : f === 'tollens' ? fact(who, r.np, 'a') : f === 'affirm' ? fact(who, r.p, 'a') : fact(who, r.nq, 'b');
}
/** where the member can sit in the Euler picture of p -> q (P inside Q) given the second premise */
export const SPOTS: Record<FormKey, ('pq' | 'q' | 'o')[]> = { detach: ['pq'], tollens: ['o'], affirm: ['pq', 'q'], deny: ['q', 'o'] };

// ===================== conditions: sufficient / necessary / both / neither =====================
export type Rel = 'suff' | 'nec' | 'both' | 'neither';
export const REL_WORDS: Record<Rel, string> = { suff: 'Sufficient, not necessary', nec: 'Necessary, not sufficient', both: 'Both necessary and sufficient', neither: 'Neither necessary nor sufficient' };
export interface Cond {
  key: string;
  domain: string;
  /** the condition and the property (HTML clauses) */
  c: string; p: string;
  test: { c(v: number): boolean; p(v: number): boolean; dom: number[] };
  rel: Rel;
  /** a member with the condition but not the property (shows "not sufficient"), and one with the property but not the condition */
  noSuff?: number; noNec?: number;
  /** the condition usually goes with the property (most primes are odd) */
  usual?: boolean;
  /** a supplied fact the member needs */
  facts?: Record<number, string>;
}
const ints = range(-30, 30), pos = range(1, 60);
export const CONDS: Cond[] = [
  { key: 'm6-even', domain: `${N} is any integer`, c: `${N} is a multiple of 6`, p: `${N} is even`, test: { c: m(6), p: ev, dom: ints }, rel: 'suff', noNec: 4 },
  { key: 'even-m6', domain: `${N} is any integer`, c: `${N} is even`, p: `${N} is a multiple of 6`, test: { c: ev, p: m(6), dom: ints }, rel: 'nec', noSuff: 4 },
  { key: 'm4-even', domain: `${N} is any integer`, c: `${N} is a multiple of 4`, p: `${N} is even`, test: { c: m(4), p: ev, dom: ints }, rel: 'suff', noNec: 6 },
  { key: 'odd-n1', domain: `${N} is any integer`, c: `${N} is odd`, p: `${N} + 1 is even`, test: { c: od, p: n => ev(n + 1), dom: ints }, rel: 'both' },
  { key: 'even-n2', domain: `${N} is any integer`, c: `${N} is even`, p: `${N} + 2 is even`, test: { c: ev, p: n => ev(n + 2), dom: ints }, rel: 'both' },
  { key: 'm23-m6', domain: `${N} is any integer`, c: `${N} is a multiple of 2 and of 3`, p: `${N} is a multiple of 6`, test: { c: n => ev(n) && m(3)(n), p: m(6), dom: ints }, rel: 'both' },
  { key: 'prime-odd', domain: `${N} is any positive integer`, c: `${N} is odd`, p: `${N} is prime`, test: { c: od, p: isPrime, dom: pos }, rel: 'neither', noSuff: 9, noNec: 2, usual: true },
  { key: 'even-m3', domain: `${N} is any integer`, c: `${N} is even`, p: `${N} is a multiple of 3`, test: { c: ev, p: m(3), dom: ints }, rel: 'neither', noSuff: 4, noNec: 9 },
  { key: 'gt5-gt2', domain: `${X} is any real number`, c: `${X} &gt; 5`, p: `${X} &gt; 2`, test: { c: x => x > 5, p: x => x > 2, dom: range(-10, 20) }, rel: 'suff', noNec: 3 },
  { key: 'gt2-gt5', domain: `${X} is any real number`, c: `${X} &gt; 2`, p: `${X} &gt; 5`, test: { c: x => x > 2, p: x => x > 5, dom: range(-10, 20) }, rel: 'nec', noSuff: 3 },
  { key: 'x3-sq9', domain: `${X} is any real number`, c: `${X}² = 9`, p: `${X} = 3`, test: { c: x => x * x === 9, p: x => x === 3, dom: range(-10, 10) }, rel: 'nec', noSuff: -3, facts: { [-3]: '(−3)² = 9' } },
  { key: 'pos-sq', domain: `${N} is any integer`, c: `${N} &gt; 0`, p: `${N}² &gt; 0`, test: { c: n => n > 0, p: n => n * n > 0, dom: ints }, rel: 'suff', noNec: -2, facts: { [-2]: '(−2)² = 4' } },
  { key: 'end0-even', domain: `${N} is any positive integer`, c: `the last digit of ${N} is 0`, p: `${N} is even`, test: { c: n => n % 10 === 0, p: ev, dom: pos }, rel: 'suff', noNec: 8 },
  { key: 'odd-prime', domain: `${N} is any positive integer`, c: `${N} is prime`, p: `${N} is odd`, test: { c: isPrime, p: od, dom: pos }, rel: 'neither', noSuff: 2, noNec: 9 },
  { key: 'gt-le', domain: `${X} is any real number`, c: `${X} &gt; 4`, p: `${X} &lt; 10`, test: { c: x => x > 4, p: x => x < 10, dom: range(-10, 20) }, rel: 'neither', noSuff: 12, noNec: 0 },
];
/** the relation of a condition to a property, read off a finite check domain */
export function relOn(c: Cond): Rel {
  const D = c.test.dom;
  const suff = D.every(v => !c.test.c(v) || c.test.p(v)), nec = D.every(v => !c.test.p(v) || c.test.c(v));
  return suff && nec ? 'both' : suff ? 'suff' : nec ? 'nec' : 'neither';
}

// ===================== number classes and their general forms =====================
export interface Rep { key: string; name: string; form: string; formT: string; letter: string; test(n: number): boolean }
export const REPS: Rep[] = [
  { key: 'even', name: 'an even integer', form: '2<i>m</i>', formT: '2m', letter: 'm', test: ev },
  { key: 'odd', name: 'an odd integer', form: '2<i>m</i> + 1', formT: '2m + 1', letter: 'm', test: od },
  { key: 'm3', name: 'a multiple of 3', form: '3<i>k</i>', formT: '3k', letter: 'k', test: m(3) },
  { key: 'm5', name: 'a multiple of 5', form: '5<i>k</i>', formT: '5k', letter: 'k', test: m(5) },
];
