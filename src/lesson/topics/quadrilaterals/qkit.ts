// qkit.ts: what every family of "Parallelograms and other quadrilaterals" shares: the misconception ids, the picture
// type (the course's figure / proof / card plus the family tree and the rectangle-rhombus Euler picture), and the item
// helpers reused read-only from triangle-centers/tkit.ts (exactly one right choice, a wrong choice equal to the answer
// is dropped; relabelled point letters; `fitted` retries a maker until its figure lays out readably).
import type { QK } from './quad';
import type { EulerParams } from '../conditional-statements/eulerLayout';
import type { ZoneSel } from '../conditional-statements/Euler';
import type { Paint } from '../../../core/theme';
import { mapFig } from '../triangle-congruence/tri';
import { type NumWrong as NW, type Opt as OptT, type TCItem, type TCPicture, choice as choice0, choiceT as choiceT0, fitted as fitted0, numT as numT0, relabel as relabel0 } from '../triangle-centers/tkit';

export const MC = {
  unmarkedFalse: 'mc.geometric-proof.unmarked-relation-assumed-false',
  appearance: 'mc.geometric-proof.diagram-appearance-as-given',
  prototypeDef: 'mc.shapes.prototype-description-as-definition',
  recites: 'mc.shapes.recites-class-inclusions-without-justification',
  excluded: 'mc.shapes.special-case-excluded-from-class',
  noInherit: 'mc.shapes.fails-to-inherit-category-properties',
  disjoint: 'mc.shapes.categories-drawn-or-sorted-as-disjoint',
  oneName: 'mc.shapes.figure-gets-only-one-name',
  prototypeOnly: 'mc.shapes.prototype-only-recognition',
  converse: 'mc.geometric-proof.converse-assumed-true',
  remainder: 'mc.fractions-concept.remainder-written-as-r-or-decimal',
  addsPart: 'mc.shapes.adds-segment-part-to-containing-whole',
  partWhole: 'mc.shapes.part-whole-segment-confusion',
  oppCons: 'mc.shapes.misreads-opposite-and-consecutive',
  pagePos: 'mc.shapes.opposite-parts-chosen-by-page-position',
  upHier: 'mc.shapes.passes-property-up-the-hierarchy',
  swapAng: 'mc.shapes.swaps-parallelogram-angle-relations',
  congSupp: 'mc.angles.congruent-pair-treated-as-supplementary',
  extBoth: 'mc.angles.exterior-sum-counts-both',
  nTimes180: 'mc.angles.polygon-sum-n-times-180',
  examples: 'mc.reasoning-language.examples-as-proof',
  divisor: 'mc.angles.regular-angle-uses-incorrect-divisor',
  fixed360: 'mc.angles.fixed-180-or-360-polygon-sum',
  fracCount: 'mc.functions-concept.discrete-quantity-allows-fractions',
  diagWords: 'mc.shapes.confuses-diagonal-property-words',
  congPerp: 'mc.shapes.congruent-diagonals-assumed-perpendicular',
  vertexCross: 'mc.angles.vertex-part-confused-with-diagonal-crossing-angle',
  interchange: 'mc.shapes.quadrilateral-properties-interchangeable',
  reportsX: 'mc.linear-equations.reports-x-not-asked-quantity',
  circular: 'mc.geometric-proof.circular-reasoning',
  vertexOrder: 'mc.transformations.statement-vertex-order-ignored',
  suffCompat: 'mc.geometric-proof.sufficient-means-compatible',
  necDef: 'mc.geometric-proof.necessary-only-if-in-definition',
  necSuff: 'mc.geometric-proof.necessary-sufficient-confused',
  protoPic: 'mc.geometric-proof.definition-as-prototype-picture',
  necAsSuff: 'mc.geometric-proof.necessary-property-as-sufficient-test',
  insuffTest: 'mc.shapes.insufficient-parallelogram-test',
  diffPairs: 'mc.shapes.parallelogram-test-uses-different-side-pairs',
  dropsPara: 'mc.shapes.drops-parallelogram-premise',
  skipsRight: 'mc.shapes.skips-right-angle-check',
  congBisect: 'mc.shapes.congruent-diagonals-imply-mutual-bisection',
  uniqueDiag: 'mc.shapes.diagonal-property-unique-to-one-shape',
  labels: 'mc.geometric-proof.necessary-sufficient-labels-not-independent',
  trapAvg: 'mc.calculus.trapezoid-height-not-endpoint-average',
  beforeEst: 'mc.geometric-proof.uses-fact-before-established',
  wrongPair: 'mc.angles.cites-wrong-pair-name',
  ssa: 'mc.transformations.ssa-accepted-as-criterion',
  someConds: 'mc.geometric-proof.stops-after-some-conditions',
  wholeHalf: 'mc.angles.uses-whole-not-half-after-bisecting',
  suppEqual: 'mc.angles.supplementary-pair-set-equal',
} as const;

export interface TreePic { hide?: QK[]; glow?: QK[]; dim?: QK[]; path?: QK }
export interface EulerPic extends EulerParams { reveal: { zones?: [ZoneSel, Paint][]; glow?: [number, Paint][]; cross?: number[] } }
export type QPicture = TCPicture & { tree?: TreePic; euler?: EulerPic; treeReveal?: never };
export type QItem = Omit<TCItem, 'picture'> & { picture?: QPicture };
export type Gen = (R: () => number, n: number, sg?: string) => QItem;
export const fitted = <T extends { picture?: QPicture }>(fam: string, make: () => T, tries = 80): T => fitted0(fam, make as () => T & { picture?: TCPicture }, tries) as T;
type QBase = Omit<QItem, 'input' | 'choices' | 'answer' | 'check'>;
type TB = Parameters<typeof choice0>[1];
type NB = Parameters<typeof numT0>[1];
/** the course's choice item, typed for this lesson's pictures */
type T = ((s: string) => string) & { roles?: string };
const RESERVED = /^(SSS|SAS|ASA|AAS|HL|AAA|SSA)$/;
/** protected prose: text inside these marks is never relabelled (titles, word problems, sentences with the article
 *  "A"); the marks are removed when the item is built */
export const P0 = '⟦', P1 = '⟧';
export const prose = (s: string) => `${P0}${s}${P1}`;
const unq = (s: string) => s.split(P0).join('').split(P1).join('');
/** relabel POINT NAMES only: outside protected prose, a standalone token of 1-4 capitals (a quadrilateral's name has
 *  four) that is made of the item's role letters only, never a criterion name and never part of a hyphenated word.
 *  Words such as ONE or PART are left alone because they are not made of role letters. */
export function twQ(s: string, t: T): string {
  const roles = t.roles;
  return s.split(P0).map((chunk, i) => {
    const cut = i === 0 ? -1 : chunk.indexOf(P1);
    const keep = cut < 0 ? '' : chunk.slice(0, cut + 1), rest = cut < 0 ? chunk : chunk.slice(cut + 1);
    const done = rest.replace(/(?<![A-Za-z\-])[A-Z]{1,4}(?![A-Za-z\-])/g, (m, at: number, all: string) => (RESERVED.test(m) || (roles !== undefined && ![...m].every(ch => roles.includes(ch))) || isArticle(m, all.slice(0, at), all.slice(at + 1)) ? m : t(m)));
    return (i === 0 ? '' : P0) + keep + done;
  }).join('');
}
/** the article "A": a lone A that opens a sentence (start, or after . : ? ! or a quote) and is followed by a word */
const isArticle = (m: string, before: string, after: string) => m === 'A' && /^ [a-z]{2,}/.test(after) && /(^|[.:?!“”"(]\s*)$/.test(before);
/** the item's letters: role letters mapped to random point letters; the function knows its roles */
export const relabel = (R: () => number, roles: string, keep = ''): T => Object.assign(relabel0(R, roles, keep), { roles });
const tidy = (s: string) => unq(s).replace(/\bin\.\./g, 'in.');
/** the course's choice item, typed for this lesson's pictures (protected-prose marks removed) */
export const choice = (R: () => number, b: QBase, opts: OptT[], fixed = false): QItem =>
  choice0(R, { ...b, prompt: tidy(b.prompt), board: unq(b.board), solution: b.solution.map(tidy), picture: b.picture && b.picture.card ? { ...b.picture, card: { lines: b.picture.card.lines.map(tidy) } } : b.picture } as unknown as TB, opts.map(o => ({ ...o, t: tidy(o.t), say: tidy(o.say) })), fixed) as unknown as QItem;
function mapPic(p: QPicture | undefined, t: T): QPicture | undefined {
  if (!p) return p;
  const out: QPicture = { ...p };
  if (p.fig) out.fig = mapFig(p.fig, t);
  if (p.proof) out.proof = { ...p.proof, given: p.proof.given?.map(x => twQ(x, t)), prove: p.proof.prove ? twQ(p.proof.prove, t) : p.proof.prove, rows: p.proof.rows.map(x => ({ st: twQ(x.st, t), rs: twQ(x.rs, t) })) };
  if (p.reveal?.fill) out.reveal = { ...p.reveal, fill: p.reveal.fill.map(f => ({ ...f, st: f.st ? twQ(f.st, t) : f.st, rs: f.rs ? twQ(f.rs, t) : f.rs })) };
  if (p.card) out.card = { lines: p.card.lines.map(x => twQ(x, t)) };
  return out;
}
/** a choice item written with role letters, shown with random letters (prose, TeX, the figure, the proof) */
export const choiceT = (R: () => number, t: T, b: QBase, opts: OptT[], fixed = false): QItem =>
  choice(R, { ...b, prompt: twQ(b.prompt, t), board: twQ(b.board, t), solution: b.solution.map(x => twQ(x, t)), picture: mapPic(b.picture, t) }, opts.map(o => ({ ...o, t: twQ(o.t, t), say: twQ(o.say, t) })), fixed);
export const numT = (t: T, b: Omit<QItem, 'input' | 'answer' | 'check'>, a: number, wrong: NW[], right: string, general: string): QItem => {
  const pic = mapPic(b.picture, t);
  return numT0(s => s, { ...b, prompt: tidy(twQ(b.prompt, t)), board: unq(twQ(b.board, t)), solution: b.solution.map(x => tidy(twQ(x, t))), picture: pic && pic.card ? { ...pic, card: { lines: pic.card.lines.map(tidy) } } : pic } as unknown as NB, a, wrong.map(w => ({ ...w, say: tidy(twQ(w.say, t)) })), tidy(twQ(right, t)), tidy(twQ(general, t))) as unknown as QItem;
};
void choiceT0;
export { pick, r, shuffle, segN, tick, box, arc, lbl, albl, A, Bq, S, lin, NAMES, type Opt, type NumWrong } from '../triangle-centers/tkit';

export const ov = (s: string) => `\\overline{${s}}`;
export const ang = (s: string) => `∠${s}`;
export const mA = (s: string) => `m∠${s}`;
/** a number for the panel: 37.5, 9 (never 9.0), a real minus */
export const fmt = (x: number): string => { const v = Math.round(x * 100) / 100; return (v < 0 ? '−' : '') + String(Math.abs(v)); };
/** TeX of a linear expression ax + b */
export function linT(a: number, b: number, v = 'x'): string {
  const ax = a === 1 ? v : a === -1 ? `-${v}` : `${a}${v}`;
  return b === 0 ? ax : `${ax} ${b < 0 ? '-' : '+'} ${Math.abs(b)}`;
}
