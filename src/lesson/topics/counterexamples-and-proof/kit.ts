// kit.ts: what every family of the lesson shares: misconception ids, the picture types the page draws, the frames it
// draws them in (pure, so generators check the same layout), and the choice helper (exactly one right choice; a wrong
// choice that means the same as the answer is dropped, never shown). Pure: no DOM.
import { type Item, type Response, type Verdict, int, pick, shuffle } from '../../runtime/item';
import { endOnChoice } from '../../runtime/explain';
import type { Paint } from '../../../core/theme';
import type { Frame } from '../../../blocks/block';
import { type EulerParams, PRACTICE_FRAME, eulerFits } from '../conditional-statements/eulerLayout';
import type { ZoneSel } from '../conditional-statements/Euler';
import type { Fig } from '../geometry-foundations/geo';
import { type PairsParams, type PairsStep, pairsWidth } from './Pairs';
import type { NestParams, NestStep } from './Nest';

export const MC = {
  examples: 'mc.reasoning-language.examples-as-proof',
  cxPremise: 'mc.reasoning-language.counterexample-violates-premise',
  cxException: 'mc.reasoning-language.counterexample-as-exception',
  cxHolds: 'mc.reasoning-language.counterexample-claim-holds',
  domain: 'mc.geometric-proof.domain-of-variable-ignored',
  afterProof: 'mc.reasoning-language.expects-exceptions-after-general-proof',
  checkingNever: 'mc.reasoning-language.checking-never-proves-anything',
  varIncomplete: 'mc.expressions.defines-variable-incompletely',
  oneLetter: 'mc.expressions.one-letter-for-two-quantities',
  affirm: 'mc.geometric-proof.necessary-property-as-sufficient-test',
  chainErr: 'mc.geometric-proof.syllogism-chain-errors',
  chainRev: 'mc.geometric-proof.reverses-conditional-chain',
  bothSides: 'mc.trig-functions.works-both-sides-to-true-statement',
  numbersInside: 'mc.geometric-proof.numbers-inside-general-proof',
  noReason: 'mc.geometric-proof.step-without-reason',
  failedDisproof: 'mc.geometric-proof.failed-argument-as-disproof',
  byTruth: 'mc.geometric-proof.validity-judged-by-truth',
  circular: 'mc.geometric-proof.circular-reasoning',
  rejectsThm: 'mc.geometric-proof.established-theorems-rejected-as-reasons',
  converse: 'mc.geometric-proof.converse-assumed-true',
  inverse: 'mc.geometric-proof.inverse-error',
  missTollens: 'mc.geometric-proof.misses-modus-tollens',
  necSuff: 'mc.geometric-proof.necessary-sufficient-confused',
  iffOne: 'mc.geometric-proof.iff-one-direction-only',
  usual: 'mc.geometric-proof.usual-condition-as-necessary',
  noNeither: 'mc.geometric-proof.condition-cannot-be-neither',
  appearance: 'mc.geometric-proof.diagram-appearance-as-given',
  measure: 'mc.geometric-proof.procedure-or-measurement-as-proof',
  falseHyp: 'mc.geometric-proof.false-hypothesis-breaks-conditional',
  contraAsConv: 'mc.geometric-proof.contrapositive-as-converse',
  beforeEst: 'mc.geometric-proof.uses-fact-before-established',
  suppEqual: 'mc.angles.supplementary-pair-set-equal',
  allChecked: 'mc.geometric-proof.all-limited-to-checked-examples',
} as const;

// ---------- pictures ----------
export interface EulerPic extends EulerParams {
  /** draw the regions before the answer (the premises); otherwise only the domain */
  regions?: boolean;
  /** members drawn before the answer (otherwise they arrive with the solve) */
  tokensFirst?: boolean;
  reveal: { zones?: [ZoneSel, Paint][]; glow?: [number, Paint][]; cross?: number[] };
}
export interface TablePic {
  head: string[]; headCol: Paint[]; rows: string[][]; keys: number;
  /** statement columns shown before the answer */
  start: number[];
  /** cells that wait as '?' */
  ask?: [number, number][];
  ring?: number;
  reveal: { cols: number[]; rings?: [number, Paint][] };
}
export interface PairsPic { params: PairsParams; start: PairsStep[]; reveal: PairsStep[] }
export interface NestPic { params: NestParams; start: NestStep[]; reveal: NestStep[]; cross?: boolean }
export interface ProofPic {
  given?: string[]; prove?: string;
  rows: { st: string; rs: string }[];
  /** cells that wait as '?' (filled by the solve from reveal.fill) */
  ask?: { i: number; cell: 'st' | 'rs' }[];
  ring?: number;
  reveal?: { fill?: { i: number; st?: string; rs?: string }[]; rings?: number[]; strike?: number[] };
}
export type CPPicture = {
  card?: { lines: string[]; reveal?: string[] };
  euler?: EulerPic;
  table?: TablePic;
  pairs?: PairsPic;
  nest?: NestPic;
  proof?: ProofPic;
  fig?: Fig;
};
export interface CPItem extends Item { picture?: CPPicture }
export type Gen = (R: () => number, n: number, sg?: string) => CPItem;
export type Base = Omit<CPItem, 'input' | 'choices' | 'answer' | 'check'>;

// ---------- frames (the page uses the same ones) ----------
/** the statement card above a picture */
export const CARD_TOP = { x0: 190, y0: 70, x1: 1730, y1: 330 } as const;
/** a picture under a card */
export const UNDER: Frame = { x: 230, y: 360, w: 1460, h: 650 };
/** a picture alone */
export const WIDE: Frame = PRACTICE_FRAME;
export const frameOf = (p: CPPicture): Frame => (p.card ? UNDER : WIDE);
export function eulerOk(e: EulerParams, p: CPPicture): boolean { return eulerFits(e, frameOf(p)); }
export function pairsOk(pp: PairsParams, p: CPPicture): boolean { return pairsWidth(pp) <= frameOf(p).w - 40; }

// ---------- choice items ----------
export interface Opt { t: string; ok?: boolean; mc?: string; say: string; /** same meaning as the answer -> dropped when wrong */ key?: string }
export function choiceItem(R: () => number, base: Base, opts: Opt[], fixed = false): CPItem {
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
/** try a maker until its picture fits (generators that choose sizes or labels) */
export function fitted<T>(fam: string, make: () => T | null, tries = 200): T {
  for (let t = 0; t < tries; t++) { const it = make(); if (it) return it; }
  throw new Error(`${fam}: nothing fitted`);
}
export { int, pick, shuffle };
export const NAMES = ['Lena', 'Omar', 'Priya', 'Kai', 'Sofia', 'Mateo', 'Ava', 'Noah', 'Jada', 'Eli', 'Mia', 'Ravi', 'Zoe', 'Theo', 'Nia', 'Sam'];
export const q = (s: string) => `“${s.replace(/\.$/, '')}”`;
/** HTML with its tags off (for card lines that are plain) */
export const plainOf = (s: string) => s.replace(/<[^>]+>/g, '').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&');
