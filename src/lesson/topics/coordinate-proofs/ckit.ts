// ckit.ts: what every practice family of "Distance, midpoint and coordinate proofs" shares: the misconception ids,
// the picture data the page draws (a coordinate plane with points, segments, polygons, full lines and circles, and a
// `reveal` layer that only comes in at the solve; or a card of words), the window that fits a picture, and the item
// builders. Every choice list goes through ONE helper (`choice`, on quadratics-complex `keyed`): a wrong option whose
// value key equals the right one's is dropped, so no distractor is secretly right. Pure: no DOM.
import type { Item, Response, Verdict } from '../../runtime/item';
import { ans } from '../../runtime/explain';
import type { Paint } from '../../../core/theme';
import { keyed, Reroll, retry } from '../quadratics-complex/common';
import { type V, isSq, near, rad } from './cg';

export { Reroll, retry, ans };

export const MC = {
  adds: 'mc.right-triangles-trig.adds-lengths-not-squares',
  negDist: 'mc.coordinate-geometry.negative-distance',
  rootSum: 'mc.exponents-roots.distributes-root-over-sum',
  looseMid: 'mc.shapes.loose-meaning-of-bisect-and-midpoint',
  onSegMid: 'mc.shapes.any-on-segment-point-is-midpoint',
  recipBis: 'mc.geometric-proof.segment-bisection-is-reciprocal',
  rounding: 'mc.estimation.equal-after-rounding-means-equal',
  decRad: 'mc.rational-radical.decimals-required-to-compare-radicals',
  halfDiff: 'mc.coordinate-geometry.midpoint-as-half-difference',
  endAvg: 'mc.coordinate-geometry.missing-endpoint-by-averaging',
  endHalves: 'mc.coordinate-geometry.halves-to-undo-midpoint-average',
  diagWords: 'mc.shapes.confuses-diagonal-property-words',
  zeroK: 'mc.calculus.zero-over-k-vs-k-over-zero',
  infinity: 'mc.calculus.infinity-as-a-number',
  divZero: 'mc.mul-div.division-by-zero-produces-number',
  eqDistinct: 'mc.linear-functions.equal-slopes-always-distinct',
  perpOpp: 'mc.linear-functions.perp-opposite-only',
  perpRecip: 'mc.linear-functions.perp-reciprocal-only',
  axisRule: 'mc.linear-functions.slope-product-rule-on-axis-lines',
  parPerpSwap: 'mc.coordinate-geometry.parallel-perpendicular-slope-swap',
  diffSq: 'mc.coordinate-geometry.difference-of-squares-for-squared-difference',
  evenNeg: 'mc.integers.even-power-of-negative-negative',
  shared: 'mc.coordinate-geometry.subtracts-shared-coordinate',
  onePoint: 'mc.coordinate-geometry.averages-coordinates-of-one-point',
  halfOne: 'mc.coordinate-geometry.midpoint-halves-one-addend',
  tEnd: 'mc.coordinate-geometry.partition-adds-t-times-endpoint',
  wrongEnd: 'mc.coordinate-geometry.partition-from-wrong-endpoint',
  mOverN: 'mc.coordinate-geometry.partition-ratio-m-over-n',
  byCount: 'mc.statistics.weighted-sum-over-category-count',
  pushAway: 'mc.statistics.larger-weight-pushes-away',
  oneTest: 'mc.linear-functions.one-test-for-all-line-pairs',
  closing: 'mc.coordinate-geometry.omits-closing-side',
  diagSides: 'mc.shapes.diagonals-confused-with-sides-from-vertex-order',
  noClaim: 'mc.geometric-proof.work-without-stated-claim',
  appearance: 'mc.geometric-proof.diagram-appearance-as-given',
  vertexOrder: 'mc.coordinate-geometry.vertex-order-ignored',
  addRad: 'mc.exponents-roots.adds-radicands',
  somePieces: 'mc.area-perimeter.subtracts-only-some-excess-pieces',
  slantHeight: 'mc.area-perimeter.uses-slant-side-as-height',
  tiltRun: 'mc.coordinate-geometry.tilted-square-area-from-horizontal-run',
  necSuff: 'mc.geometric-proof.necessary-property-as-sufficient-test',
  skipsRight: 'mc.shapes.skips-right-angle-check',
  someConds: 'mc.geometric-proof.stops-after-some-conditions',
  excluded: 'mc.shapes.special-case-excluded-from-class',
  rectAxis: 'mc.coordinate-geometry.rectangle-always-axis-parallel',
  longest: 'mc.right-triangles-trig.converse-does-not-require-longest-side',
  upHier: 'mc.shapes.passes-property-up-the-hierarchy',
  rejectsProof: 'mc.geometric-proof.rejects-valid-proof-surface-features',
  examples: 'mc.reasoning-language.examples-as-proof',
  cxPremise: 'mc.reasoning-language.counterexample-violates-premise',
  cxException: 'mc.reasoning-language.counterexample-as-exception',
  cxHolds: 'mc.reasoning-language.counterexample-claim-holds',
  letters: 'mc.geometric-proof.letters-guarantee-generality',
  drawnCase: 'mc.geometric-proof.proof-covers-only-drawn-case',
  kept: 'mc.transformations.misjudges-which-properties-are-kept',
  special: 'mc.coordinate-geometry.general-figure-as-special-case',
  cancels: 'mc.rational-radical.cancels-terms-not-factors',
  sameLook: 'mc.equal-sign.equal-means-same-look',
  numbersIn: 'mc.geometric-proof.numbers-inside-general-proof',
  iff: 'mc.geometric-proof.iff-one-direction-only',
  divisor: 'mc.linear-equations.omits-nonzero-divisor-condition',
  vertSkip: 'mc.coordinate-geometry.vertical-side-skipped-in-slope-check',
  locusEye: 'mc.coordinate-geometry.locus-judged-by-eye',
  coordLen: 'mc.coordinate-geometry.coordinate-as-length',
} as const;

// ---------- pictures (what the page draws; `reveal` is answer-side and comes in at the solve) ----------
export interface DPt { key: string; at: V; name?: string; col?: Paint; open?: boolean }
export interface DSeg { key: string; a: V; b: V; col?: Paint; dash?: boolean; w?: number }
/** a filled polygon (vertices in order), outlined by its own sides */
export interface DPoly { key: string; pts: V[]; col?: Paint }
/** the full line through two points (vertical lines too) */
export interface DLine { key: string; a: V; b: V; col?: Paint }
export interface DCirc { key: string; c: V; r: number; col?: Paint }
/** a short label at a data point (leg lengths, weights) */
export interface DText { key: string; at: V; text: string; col?: Paint }
export interface Layer { pts?: DPt[]; segs?: DSeg[]; polys?: DPoly[]; lines?: DLine[]; circles?: DCirc[]; texts?: DText[] }
export interface PlanePic extends Layer { x: [number, number, number]; y: [number, number, number]; reveal?: Layer }
/** words on a slate: an argument, a claim, an evidence table (rows of words); `reveal` lines come in at the solve */
export interface CardPic { lines: string[]; reveal?: { lines?: string[] } }
export type CPicture = { plane?: PlanePic; card?: CardPic };
export interface CItem extends Item { picture?: CPicture; ex?: Record<string, unknown> }
export type Gen = (R: () => number, n: number, sg?: string) => CItem;
export type Base = Omit<CItem, 'input' | 'choices' | 'answer' | 'check'>;

/** every data value a layer uses (for the window) */
function layerVals(l: Layer | undefined): { xs: number[]; ys: number[] } {
  const xs: number[] = [], ys: number[] = [];
  if (!l) return { xs, ys };
  const P = (v: V) => { xs.push(v[0]); ys.push(v[1]); };
  l.pts?.forEach(p => P(p.at)); l.segs?.forEach(s => { P(s.a); P(s.b); }); l.polys?.forEach(p => p.pts.forEach(P));
  l.lines?.forEach(s => { P(s.a); P(s.b); }); l.texts?.forEach(t => { P([t.at[0] - 1.6, t.at[1]]); P([t.at[0] + 1.6, t.at[1]]); });
  l.circles?.forEach(c => { P([c.c[0] - c.r, c.c[1] - c.r]); P([c.c[0] + c.r, c.c[1] + c.r]); });
  return { xs, ys };
}
function axis(vals: number[], minSpan: number): [number, number, number] {
  let lo = Math.floor(Math.min(...vals) - 1e-9) - 1, hi = Math.ceil(Math.max(...vals) + 1e-9) + 1;
  if (lo > 0 && lo <= 3) lo = -1;
  if (hi < 0 && hi >= -3) hi = 1;
  while (hi - lo < minSpan) { if ((hi - lo) % 2) hi++; else lo--; }
  if (hi - lo <= 16) return [lo, hi, 1];
  lo = Math.floor(lo / 2) * 2; hi = Math.ceil(hi / 2) * 2;
  if ((hi - lo) / 2 > 20) throw new Reroll();
  return [lo, hi, 2];
}
/** a plane picture with a window that holds every item (the reveal too), square cells, spans that match */
export function plane(l: Layer, reveal?: Layer): PlanePic {
  const a = layerVals(l), b = layerVals(reveal);
  const xs = [...a.xs, ...b.xs], ys = [...a.ys, ...b.ys];
  const sx = Math.max(...xs) - Math.min(...xs) + 2, sy = Math.max(...ys) - Math.min(...ys) + 2;
  const big = Math.max(sx, sy, 7);
  const x = axis(xs, Math.max(7, Math.ceil(big * 0.75))), y = axis(ys, Math.max(7, Math.ceil(big * 0.75)));
  return { ...l, x, y, ...(reveal ? { reveal } : {}) };
}

// ---------- text ----------
/** a number for the panel: 2.5, −3 (real minus), never 3.0 */
export const fmt = (x: number): string => { const v = Math.round(x * 10000) / 10000; return (v < 0 ? '−' : '') + String(Math.abs(v)); };
/** a number for TeX: -3 */
export const fmtT = (x: number): string => { const v = Math.round(x * 10000) / 10000; return (v < 0 ? '-' : '') + String(Math.abs(v)); };
/** a number in a sum: (−3) in brackets when negative */
export const par = (x: number) => (x < 0 ? `(${fmt(x)})` : fmt(x));
export const pt = (v: V) => `(${fmt(v[0])}, ${fmt(v[1])})`;
export const ptN = (name: string, v: V) => `${name}${pt(v)}`;
export const ptT = (v: V) => `(${fmtT(v[0])}, ${fmtT(v[1])})`;
export const ptNT = (name: string, v: V) => `${name}${ptT(v)}`;
/** "a − b" with brackets around a negative b: 5 − (−3) */
export const minus = (a: number, b: number) => `${fmt(a)} − ${par(b)}`;
export const sq = (x: number) => `${par(x)}²`;
export const A = (s: string | number) => `<b class="a">${s}</b>`, B = (s: string | number) => `<b class="b">${s}</b>`, S = (s: string | number) => `<b class="s">${s}</b>`;
/** point-name pairs and triples that never use I, L or O */
const NAMES2 = [['A', 'B'], ['P', 'Q'], ['R', 'S'], ['J', 'K'], ['M', 'N'], ['E', 'F'], ['G', 'H'], ['C', 'D']];
export const two = (R: () => number, avoid = ''): [string, string] => { const ok = NAMES2.filter(p => !p.some(ch => avoid.includes(ch))); return ok[Math.floor(R() * ok.length)]! as [string, string]; };
export const PEOPLE = ['Lena', 'Omar', 'Priya', 'Kai', 'Sofia', 'Mateo', 'Ava', 'Noah', 'Jada', 'Eli', 'Mia', 'Ravi', 'Zoe', 'Theo', 'Nia', 'Sam'];

// ---------- builders ----------
export interface Opt { t: string; ok?: boolean; mc?: string; say: string; /** the VALUE the option names; same key as the right one = dropped */ key?: string }
/** THE choice helper (every choice item of the lesson): shuffled unless `keep`, exactly one right, a wrong option with
 *  the same text or value key as a kept one is dropped, at most `max` wrong options, at least `min` options */
export function choice(R: () => number, base: Base, opts: Opt[], o: { min?: number; max?: number; keep?: boolean } = {}): CItem {
  return keyed(R, base as never, opts, { min: o.min ?? 3, max: o.max ?? 3, keep: o.keep }) as unknown as CItem;
}
/** a typed number; the solution must mark the answer (one is added when no line does) */
export function num(base: Omit<CItem, 'input' | 'answer' | 'check'>, v: number, okSay: string, slips: { v: number; mc?: string; say: string }[], hint: string): CItem {
  const solution = base.solution.some(s => s.includes('class="s"')) ? base.solution : [...base.solution, `So the answer is ${ans(fmt(v))}.`];
  return {
    ...base, solution, input: 'num', answer: { kind: 'num', v },
    check: (r: Response): Verdict => {
      if (r.kind !== 'num' || !Number.isFinite(r.v)) return { ok: false, say: 'Type a number.' };
      if (near(r.v, v)) return { ok: true, say: okSay };
      const s = slips.find(x => !near(x.v, v) && near(x.v, r.v));
      return s ? { ok: false, mc: s.mc, say: s.say } : { ok: false, say: hint };
    },
  };
}
/** a point typed as ( □ , □ ); slips matched by both coordinates; swapped coordinates get their own hint */
export function point(base: Omit<CItem, 'input' | 'answer' | 'check' | 'pairLead' | 'pairOp' | 'pairTail'>, name: string, P: V, okSay: string, slips: { at: V; mc?: string; say: string }[], hint: string): CItem {
  return {
    ...base, input: 'pair', pairLead: `${name} = (`, pairOp: ',', pairTail: ')', answer: { kind: 'pair', x: P[0], y: P[1] },
    check: (r: Response): Verdict => {
      if (r.kind !== 'pair' || !Number.isFinite(r.x) || !Number.isFinite(r.y)) return { ok: false, say: 'Fill in both coordinates.' };
      if (near(r.x, P[0]) && near(r.y, P[1])) return { ok: true, say: okSay };
      const s = slips.find(sl => !(near(sl.at[0], P[0]) && near(sl.at[1], P[1])) && near(r.x, sl.at[0]) && near(r.y, sl.at[1]));
      if (s) return { ok: false, mc: s.mc, say: s.say };
      if (near(r.x, P[1]) && near(r.y, P[0])) return { ok: false, say: 'Those two are swapped: the x-coordinate comes first.' };
      return { ok: false, say: hint };
    },
  };
}
/** the last solution line of a point answer: both coordinates marked (the steps card reads them) */
export const endPt = (name: string, P: V) => `So ${name} = (${ans(fmt(P[0]))}, ${ans(fmt(P[1]))}).`;
/** an exact length √n: a typed number when n is a perfect square, else [k] √ [r] (any k√r with k²r = n is accepted;
 *  the prompt asks for simplest form, which is the answer). Slips are squared values. */
export function radItem(base: Omit<CItem, 'input' | 'answer' | 'check' | 'pairLead' | 'pairOp' | 'pairTail'>, n: number, okSay: string, slips: { n: number; mc?: string; say: string }[], hint: string): CItem {
  if (isSq(n)) {
    const v = Math.round(Math.sqrt(n));
    return num({ ...base, solution: [...base.solution.slice(0, -1), base.solution[base.solution.length - 1]!.replace('{ANS}', ans(String(v)))] }, v, okSay,
      slips.filter(s => s.n >= 0 || s.mc === MC.negDist).map(s => ({ v: s.n < 0 ? -Math.sqrt(-s.n) : Math.sqrt(s.n), mc: s.mc, say: s.say })), hint);
  }
  const { k, r } = rad(n);
  const shown = k === 1 ? `√${r}, which goes in the boxes as ${ans('1')}√${ans(String(r))}` : `${ans(String(k))}√${ans(String(r))}`;
  const solution = [...base.solution.slice(0, -1), base.solution[base.solution.length - 1]!.replace('{ANS}', shown)];
  return {
    ...base, solution,
    input: 'pair', pairLead: '', pairOp: '√', pairTail: '', answer: { kind: 'pair', x: k, y: r },
    check: (res: Response): Verdict => {
      if (res.kind !== 'pair' || !Number.isFinite(res.x) || !Number.isFinite(res.y)) return { ok: false, say: 'Fill in both boxes: the number in front, then the number under the root (1 in front if there is none).' };
      const val = res.x > 0 && res.y > 0 ? res.x * res.x * res.y : NaN;
      if (near(val, n)) return { ok: true, say: okSay + (res.x !== k ? ` In simplest form: ${k === 1 ? '' : k}√${r}.` : '') };
      const s = slips.find(sl => !near(sl.n, n) && near(val, sl.n));
      return s ? { ok: false, mc: s.mc, say: s.say } : { ok: false, say: hint };
    },
  };
}
export const pickOf = <T>(R: () => number, xs: readonly T[]): T => xs[Math.floor(R() * xs.length)]!;
export const int = (R: () => number, lo: number, hi: number) => lo + Math.floor(R() * (hi - lo + 1));
export function nz(R: () => number, lo: number, hi: number): number { for (;;) { const v = int(R, lo, hi); if (v !== 0) return v; } }
export function ipt(R: () => number, lo: number, hi: number): V { return [int(R, lo, hi), int(R, lo, hi)]; }
