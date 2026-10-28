// logic.ts: the exact logic of "If-then statements and logical language" (no DOM, no canvas).
//   predicates   open sentences about an integer n (multiple of k, even, n > a, prime ...) with their careful
//                negations (n > 5 -> n ≤ 5) and the typical slip (n > 5 -> n < 5), and about drawn shapes
//                (four right angles, four equal sides ...) decided by the marks on the shape
//   zones        a member of the domain sits in one of four zones of the Euler picture of "if p then q":
//                pq (p and q), p (p, not q: the only zone that breaks the statement), q (q, not p), o (neither)
//   forms        a conditional and its converse, inverse and contrapositive, worded with clause variants so they
//                read as English in either position
//   cases        the four truth cases of p and q and the value of every form in each
import type { Pt } from '../../../core/math';

// ===================== predicates over a domain =====================
export interface Pred<T = number> {
  key: string;
  /** HTML clause with the variable: "<i>n</i> is a multiple of 4" */
  says: string;
  /** the negation, careful at boundaries: "<i>n</i> is not a multiple of 4", "<i>n</i> ≤ 5" */
  neg: string;
  /** the opposite-as-negation slip ("<i>n</i> < 5" for n > 5), when there is one */
  opp?: string;
  /** short words for the region label on the canvas ("multiple of 4", "n > 5") */
  label: string;
  negLabel: string;
  test(x: T): boolean;
}
const N = '<i>n</i>';
export const mult = (k: number): Pred => ({ key: `m${k}`, says: `${N} is a multiple of ${k}`, neg: `${N} is not a multiple of ${k}`, label: `multiple of ${k}`, negLabel: `not a multiple of ${k}`, test: n => n % k === 0 });
export const even: Pred = { key: 'even', says: `${N} is even`, neg: `${N} is not even`, label: 'even', negLabel: 'not even', test: n => n % 2 === 0 };
export const odd: Pred = { key: 'odd', says: `${N} is odd`, neg: `${N} is not odd`, label: 'odd', negLabel: 'not odd', test: n => Math.abs(n % 2) === 1 };
export const isPrime = (n: number) => { if (n < 2) return false; for (let d = 2; d * d <= n; d++) if (n % d === 0) return false; return true; };
export const prime: Pred = { key: 'prime', says: `${N} is prime`, neg: `${N} is not prime`, label: 'prime', negLabel: 'not prime', test: isPrime };
export const square: Pred = { key: 'sq', says: `${N} is a perfect square`, neg: `${N} is not a perfect square`, label: 'perfect square', negLabel: 'not a perfect square', test: n => n >= 0 && Math.round(Math.sqrt(n)) ** 2 === n };
export const factor = (m: number): Pred => ({ key: `f${m}`, says: `${N} is a factor of ${m}`, neg: `${N} is not a factor of ${m}`, label: `factor of ${m}`, negLabel: `not a factor of ${m}`, test: n => n > 0 && m % n === 0 });
export type Rel = '>' | '≥' | '<' | '≤';
export const NEG_REL: Record<Rel, Rel> = { '>': '≤', '≥': '<', '<': '≥', '≤': '>' };
/** the slip: the opposite direction without the boundary flip (> becomes <) */
export const OPP_REL: Record<Rel, Rel> = { '>': '<', '≥': '≤', '<': '>', '≤': '≥' };
export const relTest = (r: Rel, x: number, a: number) => (r === '>' ? x > a : r === '≥' ? x >= a : r === '<' ? x < a : x <= a);
export const REL_TEX: Record<Rel, string> = { '>': '>', '≥': '\\ge', '<': '<', '≤': '\\le' };
export const relH = (v: string, r: Rel, a: number) => `<i>${v}</i> ${r === '>' ? '&gt;' : r === '<' ? '&lt;' : r} ${a < 0 ? '−' + -a : a}`;
export const cmp = (r: Rel, a: number, v = 'n'): Pred => ({
  key: `${r}${a}`, says: relH(v, r, a), neg: relH(v, NEG_REL[r], a), opp: relH(v, OPP_REL[r], a),
  label: `${v} ${r} ${a < 0 ? "−" + -a : a}`, negLabel: `${v} ${NEG_REL[r]} ${a < 0 ? "−" + -a : a}`, test: x => relTest(r, x, a),
});

export const range = (lo: number, hi: number) => Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
export const domainWords = (lo: number, hi: number) => `the integers ${lo < 0 ? '−' + -lo : lo} to ${hi}`;

// ===================== zones =====================
export type Zone = 'pq' | 'p' | 'q' | 'o';
export function zoneOf(inP: boolean, inQ: boolean): Zone { return inP && inQ ? 'pq' : inP ? 'p' : inQ ? 'q' : 'o'; }
export interface Sorted<T> { pq: T[]; p: T[]; q: T[]; o: T[] }
export function sortDomain<T>(xs: readonly T[], P: Pred<T>, Q: Pred<T>): Sorted<T> {
  const s: Sorted<T> = { pq: [], p: [], q: [], o: [] };
  for (const x of xs) s[zoneOf(P.test(x), Q.test(x))].push(x);
  return s;
}
/** the Euler picture's layout for p and q over a domain */
export type Layout = 'nested' | 'overlap' | 'same' | 'apart' | 'one';
export function layoutOf<T>(s: Sorted<T>): Layout {
  const P = s.pq.length + s.p.length, Q = s.pq.length + s.q.length;
  if (!s.p.length && !s.q.length) return 'same';
  if (!s.pq.length && P && Q) return 'apart';
  if (!s.p.length) return 'nested';
  return 'overlap';
}

// ===================== shapes (decided by their marks) =====================
export interface Shape {
  /** points in a box about 110 x 90 around (0, 0), clockwise */
  pts: Pt[];
  /** corners (indices) marked with a right-angle square */
  right: number[];
  /** tick count per side i (pts[i] -> pts[i + 1]); 0 = no mark; matching counts = equal sides, unmarked = not equal */
  ticks: number[];
  name: string;
}
const rot = (P: Pt[], deg: number): Pt[] => { const a = (deg * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a); return P.map(([x, y]) => [x * c - y * s, x * s + y * c] as Pt); };
export const SHAPES = {
  square: (r = 0, s = 38): Shape => ({ name: 'square', pts: rot([[-s, -s], [s, -s], [s, s], [-s, s]], r), right: [0, 1, 2, 3], ticks: [1, 1, 1, 1] }),
  rect: (w = 52, h = 30, r = 0): Shape => ({ name: 'rectangle', pts: rot([[-w, -h], [w, -h], [w, h], [-w, h]], r), right: [0, 1, 2, 3], ticks: [1, 2, 1, 2] }),
  rhombus: (a = 50, b = 34): Shape => ({ name: 'rhombus', pts: [[0, -b], [a, 0], [0, b], [-a, 0]], right: [], ticks: [1, 1, 1, 1] }),
  para: (): Shape => ({ name: 'parallelogram', pts: [[-28, -30], [52, -30], [28, 30], [-52, 30]], right: [], ticks: [1, 2, 1, 2] }),
  trap: (): Shape => ({ name: 'trapezoid', pts: [[-26, -30], [26, -30], [54, 30], [-54, 30]], right: [], ticks: [0, 1, 0, 1] }),
  rightTrap: (): Shape => ({ name: 'right trapezoid', pts: [[-48, -30], [14, -30], [48, 30], [-48, 30]], right: [0, 3], ticks: [0, 0, 0, 0] }),
  kite: (): Shape => ({ name: 'kite', pts: [[0, -42], [34, -14], [0, 42], [-34, -14]], right: [], ticks: [1, 2, 2, 1] }),
  equi: (): Shape => ({ name: 'equilateral triangle', pts: [[0, -40], [46, 40], [-46, 40]], right: [], ticks: [1, 1, 1] }),
  iso: (): Shape => ({ name: 'isosceles triangle', pts: [[0, -44], [32, 40], [-32, 40]], right: [], ticks: [1, 0, 1] }),
  rightTri: (): Shape => ({ name: 'right triangle', pts: [[-44, -40], [44, 40], [-44, 40]], right: [2], ticks: [0, 0, 0] }),
  rightIso: (): Shape => ({ name: 'isosceles right triangle', pts: [[-40, -40], [40, 40], [-40, 40]], right: [2], ticks: [0, 1, 1] }),
  scalene: (): Shape => ({ name: 'scalene triangle', pts: [[-20, -38], [52, 40], [-48, 40]], right: [], ticks: [0, 0, 0] }),
} as const;
export const sides = (s: Shape) => s.pts.length;
export const rightCount = (s: Shape) => s.right.length;
export const allSidesEqual = (s: Shape) => s.ticks.every(t => t > 0 && t === s.ticks[0]);
export const equalPairs = (s: Shape) => { const c = new Map<number, number>(); for (const t of s.ticks) if (t) c.set(t, (c.get(t) ?? 0) + 1); return Math.max(0, ...c.values()); };
const SH = '';
export const shapePreds = {
  fourRight: { key: 'r4', says: `${SH}it has four right angles`, neg: 'it does not have four right angles', label: 'four right angles', negLabel: 'not four right angles', test: (s: Shape) => rightCount(s) === 4 } as Pred<Shape>,
  fourEqual: { key: 'e4', says: 'it has four equal sides', neg: 'it does not have four equal sides', label: 'four equal sides', negLabel: 'not four equal sides', test: (s: Shape) => sides(s) === 4 && allSidesEqual(s) } as Pred<Shape>,
  rightAngle: { key: 'r1', says: 'it has a right angle', neg: 'it has no right angle', label: 'a right angle', negLabel: 'no right angle', test: (s: Shape) => rightCount(s) >= 1 } as Pred<Shape>,
  threeEqual: { key: 'e3', says: 'it has three equal sides', neg: 'it does not have three equal sides', label: 'three equal sides', negLabel: 'not three equal sides', test: (s: Shape) => sides(s) === 3 && allSidesEqual(s) } as Pred<Shape>,
  twoEqual: { key: 'e2', says: 'it has at least two equal sides', neg: 'it has no two equal sides', label: 'two equal sides', negLabel: 'no two equal sides', test: (s: Shape) => equalPairs(s) >= 2 } as Pred<Shape>,
  triangle: { key: 't', says: 'it is a triangle', neg: 'it is not a triangle', label: 'triangle', negLabel: 'not a triangle', test: (s: Shape) => sides(s) === 3 } as Pred<Shape>,
};
export const LETTERS = 'ABCDEFGH';

// ===================== forms of a conditional =====================
/** a conditional's clauses: first = the clause leading a sentence, second = the same clause after a comma or "if"
 *  (a pronoun may stand for the subject); n = the negation */
export interface Clauses { p1: string; p2: string; q1: string; q2: string; np1: string; np2: string; nq1: string; nq2: string }
export type Form = 'original' | 'converse' | 'inverse' | 'contrapositive';
export const FORMS: readonly Form[] = ['original', 'converse', 'inverse', 'contrapositive'];
/** "If a, then b." with the hypothesis amber (p, ~p) and the conclusion teal (q, ~q) by MEANING, not position */
const A = (s: string) => `<b class="a">${s}</b>`, B = (s: string) => `<b class="b">${s}</b>`;
export function ifThen(a: string, b: string, colour = true, aIsP = true): string {
  const ca = colour ? (aIsP ? A(a) : B(a)) : a, cb = colour ? (aIsP ? B(b) : A(b)) : b;
  return `If ${ca}, then ${cb}.`;
}
export function formOf(c: Clauses, f: Form, colour = true): string {
  switch (f) {
    case 'original': return ifThen(c.p1, c.q2, colour, true);
    case 'converse': return ifThen(c.q1, c.p2, colour, false);
    case 'inverse': return ifThen(c.np1, c.nq2, colour, true);
    case 'contrapositive': return ifThen(c.nq1, c.np2, colour, false);
  }
}
/** a subject + predicate pair ("an angle" / "it", "measures 90°" ...) */
export function subj(s: string, it: string, P: string, Q: string, nP: string, nQ: string, s2 = s): Clauses {
  return { p1: `${s} ${P}`, p2: `${it} ${P}`, q1: `${s2} ${Q}`, q2: `${it} ${Q}`, np1: `${s} ${nP}`, np2: `${it} ${nP}`, nq1: `${s2} ${nQ}`, nq2: `${it} ${nQ}` };
}
/** two clauses that do not share a subject ("it rains" / "the game is canceled") */
export function pair(p: string, q: string, np: string, nq: string): Clauses { return { p1: p, p2: p, q1: q, q2: q, np1: np, np2: np, nq1: nq, nq2: nq }; }
/** clauses of predicates about n */
export function predClauses(P: Pred, Q: Pred): Clauses { return pair(P.says, Q.says, P.neg, Q.neg); }

// ===================== the four cases =====================
export type Case = readonly [boolean, boolean];
export const CASES: readonly Case[] = [[true, true], [true, false], [false, true], [false, false]];
export const imp = (a: boolean, b: boolean) => !a || b;
/** the truth value of a form in the case (p, q) */
export function valueOf(f: Form | 'iff', [p, q]: Case): boolean {
  switch (f) {
    case 'original': return imp(p, q);
    case 'converse': return imp(q, p);
    case 'inverse': return imp(!p, !q);
    case 'contrapositive': return imp(!q, !p);
    case 'iff': return p === q;
  }
}
export const FORM_TEX: Record<Form | 'iff', string> = {
  original: 'p \\to q', converse: 'q \\to p', inverse: '{\\sim} p \\to {\\sim} q', contrapositive: '{\\sim} q \\to {\\sim} p', iff: 'p \\leftrightarrow q',
};
export const caseWords = ([p, q]: Case) => `<i>p</i> ${p ? 'true' : 'false'}, <i>q</i> ${q ? 'true' : 'false'}`;
export const TF = (b: boolean) => (b ? 'T' : 'F');
