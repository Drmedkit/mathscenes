// kit.ts: what every family of the lesson shares: misconception ids, the picture types the page draws, the choice
// helper (exactly one right choice; a wrong choice that means the same as the answer is dropped, never shown), the
// number helper, and the retry that keeps only figures that lay out readably in the frame the page will use.
// Pure: no DOM.
import { type Item, type Response, type Verdict, pick, shuffle } from '../../runtime/item';
import { ans, endOnChoice } from '../../runtime/explain';
import { type Fig, type Frame, type MarkCol, FR_LEFT, FR_WIDE, figProblems, galleryFrames } from './geo';
import type { GlobePath } from './Globe';

export const MC = {
  everyDefined: 'mc.geometric-proof.every-term-must-be-defined',
  drawnMark: 'mc.geometric-proof.object-is-the-drawn-mark',
  listAll: 'mc.geometric-proof.definition-must-list-all-properties',
  prototype: 'mc.geometric-proof.definition-as-prototype-picture',
  skew: 'mc.shapes.never-meeting-lines-are-parallel-in-space',
  postDef: 'mc.geometric-proof.postulate-definition-confused',
  postThm: 'mc.geometric-proof.postulate-theorem-status-confused',
  euclid: 'mc.geometric-proof.euclidean-facts-hold-everywhere',
  latitude: 'mc.geometric-proof.latitude-circles-as-spherical-lines',
  converse: 'mc.geometric-proof.converse-assumed-true',
  partsReason: 'mc.geometric-proof.conditional-parts-as-reason-and-answer',
  wrongClause: 'mc.geometric-proof.wrong-clause-as-hypothesis',
  authority: 'mc.geometric-proof.authority-as-proof-of-theorem',
  examples: 'mc.reasoning-language.examples-as-proof',
  circular: 'mc.geometric-proof.circular-reasoning',
  everyPostulate: 'mc.geometric-proof.every-assumption-called-postulate',
  beforeEst: 'mc.geometric-proof.uses-fact-before-established',
  threeLetter: 'mc.angles.misreads-three-letter-angle-names',
  figMeasure: 'mc.geometric-proof.figure-vs-measure-notation',
  boxValue: 'mc.shapes.ignores-right-angle-box-value',
  wrongPart: 'mc.geometric-proof.diagram-marking-attached-to-wrong-part',
  ticksAsArcs: 'mc.shapes.segment-ticks-read-as-angle-marks',
  appearance: 'mc.geometric-proof.diagram-appearance-as-given',
  noHyp: 'mc.geometric-proof.cites-theorem-without-checking-hypotheses',
  onlyDefs: 'mc.geometric-proof.only-definitions-allow-both-directions',
  someConds: 'mc.geometric-proof.stops-after-some-conditions',
  midMis: 'mc.geometric-proof.midpoint-bisector-misdefined',
  bisArb: 'mc.geometric-proof.angle-bisector-from-arbitrary-points',
  informal: 'mc.geometric-proof.informal-reason-not-named-property',
  oneSide: 'mc.linear-equations.one-side-only',
  noReason: 'mc.geometric-proof.step-without-reason',
  wrongPair: 'mc.angles.cites-wrong-pair-name',
  byFormat: 'mc.geometric-proof.proof-judged-by-format',
  drawnCase: 'mc.geometric-proof.proof-covers-only-drawn-case',
  picPrecludes: 'mc.geometric-proof.picture-precludes-proof',
  failedDisproof: 'mc.geometric-proof.failed-argument-as-disproof',
  checkingNever: 'mc.reasoning-language.checking-never-proves-anything',
  measureProof: 'mc.geometric-proof.procedure-or-measurement-as-proof',
  cxException: 'mc.reasoning-language.counterexample-as-exception',
  cxPremise: 'mc.reasoning-language.counterexample-violates-premise',
  cxHolds: 'mc.reasoning-language.counterexample-claim-holds',
  parNoPar: 'mc.angles.parallel-rules-without-parallel-lines',
  anyPair: 'mc.angles.arbitrary-congruent-pair-proves-parallel',
  suppEqual: 'mc.angles.supplementary-pair-set-equal',
  congAsSupp: 'mc.angles.congruent-pair-treated-as-supplementary',
  compSupp: 'mc.angles.complementary-supplementary-swapped',
  wholeAsPart: 'mc.angles.reports-whole-as-missing-part',
  reportsX: 'mc.linear-equations.reports-x-not-asked-quantity',
  intermediate: 'mc.reasoning-language.reports-intermediate-result',
} as const;

// ---------- pictures ----------
export interface ProofPic { given?: string[]; prove?: string; rows: { st: string; rs: string }[]; first?: number; ask?: { i: number; cell: 'st' | 'rs' }[]; ring?: number; pool?: boolean; strike?: number[] }
export interface Reveal {
  /** cells filled in by the solve */
  fill?: { i: number; st?: string; rs?: string }[];
  /** figure: labels that crossfade to alt, marks that glow, colour changes, solve-only parts */
  solved?: string[]; glow?: string[]; col?: Record<string, MarkCol>; solve?: boolean;
  /** proof rows ringed / struck by the solve */
  rings?: number[]; strike?: number[];
  /** gallery cell ringed */
  cell?: number;
  /** globe: paths that glow, the triangle */
  paths?: number[]; tri?: boolean;
  /** card lines added by the solve */
  lines?: string[];
  /** Parsons: the proof row (1-based, 0 = decoy) of every pool line */
  rowOf?: number[];
}
export type GFPicture = {
  fig?: Fig;
  proof?: ProofPic;
  gallery?: { figs: Fig[]; caps: string[]; tags?: string[] };
  globe?: { paths: GlobePath[]; tri?: number };
  card?: { lines: string[] };
  cards?: { head: string; text: string }[];
  reveal?: Reveal;
};
export interface GFItem extends Item { picture?: GFPicture }
export type Gen = (R: () => number, n: number, sg?: string) => GFItem;
export type Base = Omit<GFItem, 'input' | 'choices' | 'answer' | 'check'>;

/** the frame the page draws an item's figure in (generators check their layout in the same frame) */
export function figFrame(p: GFPicture): Frame {
  return p.proof || p.card || p.cards ? FR_LEFT : FR_WIDE;
}
/** a figure that lays out readably, or null */
export function okFig(f: Fig, fr: Frame): boolean { return figProblems(f, fr).length === 0; }
/** try a maker until its figures fit (every figure of the picture, in its frame) */
export function fitted<T extends { picture?: GFPicture }>(fam: string, make: () => T, tries = 80): T {
  let last = '';
  for (let t = 0; t < tries; t++) {
    const it = make();
    const p = it.picture;
    if (!p) return it;
    const probs: string[] = [];
    if (p.fig) probs.push(...figProblems(p.fig, figFrame(p)));
    if (p.gallery) { const fr = galleryFrames(p.gallery.figs.length); p.gallery.figs.forEach((f, i) => probs.push(...figProblems(f, fr[i]!))); }
    if (!probs.length) return it;
    last = probs.join('; ');
  }
  throw new Error(`${fam}: no readable figure (${last})`);
}

// ---------- choice and number items ----------
export interface Opt { t: string; ok?: boolean; mc?: string; say: string; /** same meaning as the answer -> dropped when wrong */ key?: string }
export function choiceItem(R: () => number, base: Base, opts: Opt[], fixed = false): GFItem {
  const right = opts.filter(o => o.ok);
  if (right.length !== 1) throw new Error(`${base.family}: exactly one right choice (${right.length})`);
  const rk = right[0]!.key;
  const kept = opts.filter(o => o.ok || rk === undefined || o.key !== rk);
  const o = fixed ? kept : shuffle(R, kept.slice());
  if (new Set(o.map(x => x.t)).size !== o.length) throw new Error(`${base.family}: duplicate choices ${o.map(x => x.t).join(' | ')}`);
  const i = o.findIndex(x => x.ok);
  return {
    ...base, input: 'choice', choices: o.map(x => x.t), answer: { kind: 'choice', i }, solution: endOnChoice(base.solution, o[i]!.t),
    check: (r: Response): Verdict => {
      if (r.kind !== 'choice' || !o[r.i]) return { ok: false, say: 'Pick one of the answers.' };
      const c = o[r.i]!;
      return { ok: !!c.ok, mc: c.mc, say: c.say };
    },
  };
}
export interface NumWrong { v: number; mc?: string; say: string }
export function numItem(base: Omit<GFItem, 'input' | 'answer' | 'check'>, a: number, wrong: NumWrong[], right: string, general: string): GFItem {
  return {
    ...base, board: base.board.replace(/\+\s*-\s*(\d)/g, '- $1'), input: 'num', answer: { kind: 'num', v: a },
    solution: base.solution.length && base.solution.some(s => s.includes('class="s"')) ? base.solution : [...base.solution, `So the answer is ${ans(a)}.`],
    check: (r: Response): Verdict => {
      if (r.kind !== 'num' || !Number.isFinite(r.v)) return { ok: false, say: 'Type a number.' };
      if (Math.abs(r.v - a) < 1e-9) return { ok: true, say: right };
      const w = wrong.find(x => Math.abs(x.v - r.v) < 1e-9 && Math.abs(x.v - a) > 1e-9);
      return w ? { ok: false, mc: w.mc, say: w.say } : { ok: false, say: general };
    },
  };
}
export const r = (R: () => number, lo: number, hi: number) => lo + Math.floor(R() * (hi - lo + 1));
export { pick, shuffle, ans };
export const NAMES = ['Lena', 'Omar', 'Priya', 'Kai', 'Sofia', 'Mateo', 'Ava', 'Noah', 'Jada', 'Eli', 'Mia', 'Ravi', 'Zoe', 'Theo', 'Nia', 'Sam'];
/** a quoted statement for the panel */
export const q = (s: string) => `“${s}”`;
export const A = (s: string) => `<b class="a">${s}</b>`, B = (s: string) => `<b class="b">${s}</b>`, S = (s: string) => `<b class="s">${s}</b>`;
/** segment / ray / line names with real combining marks (they survive plain text) */
export const segN = (s: string) => [...s].map(ch => ch + '̅').join('');
export const rayN = (s: string) => `ray ${s}`;
export const lineN = (s: string) => `line ${s}`;
export const ang = (s: string) => `∠${s}`;
export const mA = (s: string) => `m∠${s}`;
