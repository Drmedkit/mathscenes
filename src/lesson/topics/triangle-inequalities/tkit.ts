// tkit.ts: what every family of "Isosceles triangles and side-angle order" shares: the misconception ids, the
// picture type (the course's GFPicture plus a number-line strip), the frames the page draws in, the retry that keeps
// only readable figures, and the pair item ("□ < x < □"). The choice and number helpers are the course's
// (geometry-foundations/kit.ts: a wrong choice equivalent to the answer is dropped, never shown). Pure: no DOM.
import { type Item, type Response, type Verdict } from '../../runtime/item';
import { ans } from '../../runtime/explain';
import { box, type Box } from '../../../core/math';
import { type Frame, FR_LEFT, FR_WIDE, figProblems, galleryFrames } from '../geometry-foundations/geo';
import type { GFPicture } from '../geometry-foundations/kit';
import { type StripSpec, stripProblems } from './RangeStrip';
import { fmt } from './ineq';

export const MC = {
  baseMis: 'mc.shapes.misplaces-isosceles-base-angles',
  converse: 'mc.geometric-proof.converse-assumed-true',
  appearance: 'mc.geometric-proof.diagram-appearance-as-given',
  ratio: 'mc.angles.triangle-side-ratios-equal-angle-ratios',
  adjacent: 'mc.shapes.pairs-side-with-adjacent-angle',
  degenerate: 'mc.shapes.accepts-degenerate-triangle',
  close: 'mc.estimation.close-estimate-always-good-enough',
  wrongPair: 'mc.shapes.checks-wrong-pair-in-triangle-inequality',
  upperOnly: 'mc.shapes.third-side-upper-bound-only',
  examples: 'mc.reasoning-language.examples-as-proof',
  beforeEst: 'mc.geometric-proof.uses-fact-before-established',
  flipped: 'mc.transformations.turned-or-flipped-copy-not-congruent',
  extLocal: 'mc.angles.exterior-angle-local-and-total-confused',
  extBoth: 'mc.angles.exterior-sum-counts-both',
  extShape: 'mc.angles.triangle-exterior-sum-depends-on-shape',
  boundary: 'mc.geometric-proof.overlooks-boundary-case',
  circular: 'mc.geometric-proof.circular-reasoning',
  reportsX: 'mc.linear-equations.reports-x-not-asked-quantity',
  ssa: 'mc.transformations.ssa-accepted-as-criterion',
  wrongPairName: 'mc.angles.cites-wrong-pair-name',
  onlyMarked: 'mc.geometric-proof.only-marked-parts-count',
  order: 'mc.transformations.congruence-criterion-order-has-no-geometric-meaning',
} as const;

export type TIPicture = GFPicture & { strip?: StripSpec };
export interface TIItem extends Item { picture?: TIPicture }
export type Gen = (R: () => number, n: number, sg?: string) => TIItem;

/** the figure above a strip (the strip sits below it) */
export const FR_TOP: Frame = { x: 220, y: 60, w: 1480, h: 660 };
export const STRIP_BOX: Box = box(220, 760, 1700, 1010);
/** a figure beside a proof frame, and the proof frame (wider than the course's, for the long reason names) */
export const FR_PLEFT: Frame = { x: 30, y: 80, w: 540, h: 920 };
export const FR_PROOF: Frame = { x: 590, y: 60, w: 1300, h: 960 };
/** passed to the proof frame as reserveRs: keeps the reason column wide enough for two-word lines
 *  ("Alternate Interior", "Corresponding Angles"), so no reason wraps to more than three lines */
export const RS_RESERVE = ['Corresponding_Angle'];
/** the frame the page draws an item's figure in (generators check their layout in the same frame) */
export function frameOf(p: TIPicture): Frame {
  return p.strip ? FR_TOP : p.proof ? FR_PLEFT : p.card || p.cards ? FR_LEFT : FR_WIDE;
}
/** everything that would not read in a picture (empty = fine) */
export function pictureProblems(p: TIPicture | undefined): string[] {
  if (!p) return [];
  const out: string[] = [];
  if (p.fig) out.push(...figProblems(p.fig, frameOf(p)));
  if (p.gallery) { const fr = galleryFrames(p.gallery.figs.length); p.gallery.figs.forEach((f, i) => out.push(...figProblems(f, fr[i]!))); }
  if (p.strip) out.push(...stripProblems(p.strip, STRIP_BOX));
  return out;
}
/** try a maker until its picture reads */
export function fitted<T extends { picture?: TIPicture }>(fam: string, make: () => T, tries = 120): T {
  let last = '';
  for (let t = 0; t < tries; t++) {
    const it = make();
    const probs = pictureProblems(it.picture);
    if (!probs.length) return it;
    last = probs.join('; ');
  }
  throw new Error(`${fam}: no readable figure (${last})`);
}

/** "lo < x < hi": two numbers; recognised slips get their misconception */
export function pairItem(base: Omit<TIItem, 'input' | 'answer' | 'check' | 'pairLead' | 'pairOp' | 'pairTail'>, lo: number, hi: number, o: { name?: string; unit?: string; wrong?: { x?: number; y?: number; mc?: string; say: string }[]; right: string; general: string }): TIItem {
  const nm = o.name ?? 'x';
  const eq = (a: number, b: number) => Math.abs(a - b) < 1e-9;
  return {
    ...base, input: 'pair', pairLead: '', pairOp: `&lt; <i>${nm}</i> &lt;`, pairTail: o.unit ? ` ${o.unit}` : '',
    answer: { kind: 'pair', x: lo, y: hi },
    solution: base.solution.some(s => s.includes('class="s"')) ? base.solution : [...base.solution, `So ${ans(fmt(lo))} &lt; ${nm} &lt; ${ans(fmt(hi))}.`],
    check: (r: Response): Verdict => {
      if (r.kind !== 'pair' || !Number.isFinite(r.x) || !Number.isFinite(r.y)) return { ok: false, say: 'Type two numbers.' };
      if (eq(r.x, lo) && eq(r.y, hi)) return { ok: true, say: o.right };
      for (const w of o.wrong ?? []) if ((w.x === undefined || eq(r.x, w.x)) && (w.y === undefined || eq(r.y, w.y)) && !(eq(r.x, lo) && eq(r.y, hi))) return { ok: false, mc: w.mc, say: w.say };
      if (eq(r.x, hi) && eq(r.y, lo)) return { ok: false, say: 'The smaller bound goes first: lo < x < hi.' };
      return { ok: false, say: o.general };
    },
  };
}
export const NAMES = ['Lena', 'Omar', 'Priya', 'Kai', 'Sofia', 'Mateo', 'Ava', 'Noah', 'Jada', 'Eli', 'Mia', 'Ravi', 'Zoe', 'Theo', 'Nia', 'Sam'];
/** a segment name with real combining overlines (survives plain text) */
export const segN = (s: string) => [...s].map(ch => ch + '̅').join('');
export const tri = (s: string) => `△${s}`;
export const angN = (s: string) => `∠${s}`;
export const deg = (x: number | string) => `${typeof x === 'number' ? fmt(x) : x}°`;
