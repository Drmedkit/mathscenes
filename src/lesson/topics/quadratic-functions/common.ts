// common.ts: what the practice families of "Quadratic functions and their graphs" share: misconception ids, the
// picture data the page draws on the kit Plane, and the item builders with exact checks. Every choice list goes
// through choiceItem, which drops a wrong choice that means the same as the right one (same number, same point, same
// function, same set: the `key` of an option), so a distractor can never be secretly right. Pure: no DOM.
import { type Item, type Response, type Verdict, shuffle } from '../../runtime/item';
import { endOnChoice, ans } from '../../runtime/explain';
import { type Std, near } from './qf';

// ---------- misconception ids (all in math-curriculum-essentials/misconceptions.json) ----------
export const MC = {
  evenNeg: 'mc.integers.even-power-of-negative-negative',
  straight: 'mc.functions-concept.straight-segments-for-curve',
  yAxis: 'mc.quadratic-polynomial.parabola-centered-on-y-axis',
  signA: 'mc.quadratic-polynomial.ignores-sign-of-a',
  oneCoord: 'mc.quadratic-polynomial.vertex-single-coordinate',
  axisAsPoint: 'mc.quadratic-polynomial.vertex-location-as-axis-description',
  nZeros: 'mc.quadratic-polynomial.n-real-zeros',
  interceptSwap: 'mc.linear-functions.intercept-zero-swap',
  halfDiff: 'mc.coordinate-geometry.midpoint-as-half-difference',
  wrongSign: 'mc.quadratic-polynomial.wrong-sign-zero-factor',
  openK: 'mc.quadratic-polynomial.opening-from-vertex-height',
  widerA: 'mc.quadratic-polynomial.bigger-a-wider',
  anchors: 'mc.functions-concept.vertical-scaling-moves-zero-anchors',
  slopeA: 'mc.quadratic-polynomial.a-as-constant-slope',
  inOut: 'mc.functions-concept.inside-outside-confusion',
  negShift: 'mc.functions-concept.negative-factor-as-shift',
  reflSwap: 'mc.functions-concept.reflection-axis-swap',
  notRecip: 'mc.functions-concept.horizontal-scale-not-reciprocal',
  negKTwo: 'mc.quadratic-polynomial.negative-vertex-height-forces-two-zeros',
  pmRoot: 'mc.exponents-roots.principal-root-as-plus-minus',
  forgetsH: 'mc.quadratic-polynomial.forgets-to-add-h',
  nonRealPts: 'mc.systems.non-real-roots-as-points',
  onlyPos: 'mc.quadratic-polynomial.only-positive-root',
  bxc: 'mc.quadratic-polynomial.zero-of-bx-c-as-c',
  outside: 'mc.quadratic-polynomial.outside-coefficient-multiplies-zeros',
  facHeight: 'mc.quadratic-polynomial.factored-vertex-height-a-or-zero',
  kAsInt: 'mc.quadratic-polynomial.visible-constant-as-feature',
  cAsK: 'mc.quadratic-polynomial.standard-constant-as-vertex-height',
  formula: 'mc.quadratic-polynomial.vertex-formula-misremembered',
  window: 'mc.data-displays.graph-window-assumed-complete',
  negPow: 'mc.exponents-roots.confuses-negative-power-notation',
  shown: 'mc.quadratic-polynomial.sketch-only-shown-features',
  drSwap: 'mc.functions-concept.domain-range-swap',
  strict: 'mc.quadratic-polynomial.range-excludes-extreme',
  rangeH: 'mc.quadratic-polynomial.range-bound-uses-h',
  signDir: 'mc.functions-concept.sign-vs-direction',
  rtl: 'mc.functions-concept.reads-graph-right-to-left',
  flips: 'mc.quadratic-polynomial.sign-flips-every-zero',
  examples: 'mc.reasoning-language.examples-as-proof',
  distrib: 'mc.functions-concept.function-distributes-over-sum',
  aIs1: 'mc.quadratic-polynomial.assumes-a-is-1',
  noK: 'mc.quadratic-polynomial.a-without-subtracting-k',
  pointHK: 'mc.quadratic-polynomial.vertex-form-point-in-hk',
  habit: 'mc.estimation.method-not-chosen-from-numbers',
  unbalanced: 'mc.quadratic-polynomial.cs-unbalanced',
  notation: 'mc.quadratic-polynomial.zeros-by-notation-only',
  allZero: 'mc.quadratic-polynomial.all-factors-zero',
  ctxAll: 'mc.functions-concept.context-domain-all-reals',
  wrongCoord: 'mc.functions-concept.reports-wrong-coordinate',
  infeasible: 'mc.functions-concept.infeasible-vertex-as-optimum',
  params: 'mc.quadratic-polynomial.compares-parameters-instead-of-extrema',
  sumsPart: 'mc.expressions.multiplies-sums-part-by-part',
  noFactor: 'mc.quadratic-polynomial.no-integer-factors-no-roots',
} as const;

// ---------- pictures: items on the kit Plane, as data (the page turns them into Plane items) ----------
export type GCol = 'link' | 'second' | 'water' | 'first' | 'pick' | 'wrong' | 'dim' | 'ink';
type End = 'open' | 'closed' | 'none';
export type GItem =
  | { kind: 'curve'; key: string; s: Std; col?: GCol; name?: string; dash?: boolean; lo?: number; hi?: number; ends?: [End, End] }
  | { kind: 'point'; key: string; x: number; y: number; col?: GCol; name?: string; open?: boolean }
  | { kind: 'vline'; key: string; x: number; col?: GCol }
  | { kind: 'hline'; key: string; y: number; col?: GCol }
  | { kind: 'seg'; key: string; a: [number, number]; b: [number, number]; col?: GCol; dash?: boolean; arrow?: boolean; w?: number }
  | { kind: 'text'; key: string; x: number; y: number; text: string; col?: GCol };
export type Win = [number, number, number];
export interface GPic {
  x: Win; y: Win; xName?: string; yName?: string;
  /** on screen from the start (never the answer) */ show: GItem[];
  /** added in the replay after a miss (the answer side) */ reveal: GItem[];
  /** nothing to see before the answer: a big slate with the board first, the plane only in the replay */ slate?: boolean;
}
export interface QItem extends Item { picture?: { g?: GPic } }
export type Gen = (R: () => number, n: number, sg?: string) => QItem;

// ---------- builders ----------
/** a choice: `key` = what it means (two options with the same key say the same thing; a wrong one is dropped) */
export interface Opt { t: string; ok?: boolean; mc?: string; say: string; key?: string }
export type Base = Omit<QItem, 'input' | 'choices' | 'answer' | 'check'>;
/** an inequality sign written between spaces (x < 3) as an HTML entity, so it can never read as a tag */
export const esc = (s: string) => s.replace(/ < /g, ' &lt; ').replace(/ > /g, ' &gt; ');
export function choiceItem(R: () => number, base0: Base, opts0: Opt[], keepOrder = false): QItem {
  const opts = opts0.map(o => ({ ...o, t: esc(o.t), say: esc(o.say) }));
  const base = { ...base0, prompt: esc(base0.prompt), solution: base0.solution.map(esc) };
  const right = opts.filter(o => o.ok);
  if (right.length !== 1) throw new Error(`${base.family}: exactly one right choice`);
  const r = right[0]!, rk = r.key ?? r.t;
  const kept: Opt[] = [];
  for (const o of opts) {
    const k = o.key ?? o.t;
    if (!o.ok && (k === rk || o.t === r.t)) continue;
    if (kept.some(x => x.t === o.t || (x.key ?? x.t) === k)) continue;
    kept.push(o);
  }
  if (kept.length < 2) throw new Error(`${base.family}: fewer than two choices left`);
  const o = keepOrder ? kept : shuffle(R, kept.slice());
  const i = o.findIndex(x => x.ok);
  return {
    ...base, input: 'choice', choices: o.map(x => x.t), answer: { kind: 'choice', i }, solution: endOnChoice(base.solution, o[i]!.t),
    check: (res: Response) => {
      if (res.kind !== 'choice' || !o[res.i]) return { ok: false, say: 'Pick one of the answers.' };
      const c = o[res.i]!;
      return { ok: !!c.ok, mc: c.mc, say: c.say };
    },
  };
}
export function numItem(base: Base, a: number, check: (v: number) => Verdict, unit = ''): QItem {
  return { ...base, input: 'num', unit, answer: { kind: 'num', v: a }, check: (r: Response) => (r.kind === 'num' && Number.isFinite(r.v) ? check(r.v) : { ok: false, say: 'Type a number.' }) };
}
/** two number boxes ("( □ , □ )" for a point, "x = □ or x = □" for two zeros) */
export function pairItem(base: Base, x: number, y: number, lead: string, op: string, tail: string, check: (x: number, y: number) => Verdict): QItem {
  return {
    ...base, input: 'pair', pairLead: lead, pairOp: op, pairTail: tail, answer: { kind: 'pair', x, y },
    check: (r: Response) => (r.kind === 'pair' && Number.isFinite(r.x) && Number.isFinite(r.y) ? check(r.x, r.y) : { ok: false, say: 'Fill in both boxes.' }),
  };
}
/** a point item "( □ , □ )" */
export const pointItem = (base: Base, x: number, y: number, check: (x: number, y: number) => Verdict) => pairItem(base, x, y, '(', ',', ')', check);
/** the two typed values are the set {a, b} (either order) */
export const isSet = (x: number, y: number, a: number, b: number) => (near(x, a) && near(y, b)) || (near(x, b) && near(y, a));
export { ans, near };

// ---------- small random helpers ----------
export const int = (R: () => number, lo: number, hi: number) => lo + Math.floor(R() * (hi - lo + 1));
export const pick = <T>(R: () => number, xs: readonly T[]): T => xs[Math.floor(R() * xs.length)]!;
/** a nonzero integer in lo..hi */
export function nz(R: () => number, lo: number, hi: number): number { for (;;) { const v = int(R, lo, hi); if (v !== 0) return v; } }
export const X = '<i>x</i>';
export const Y = '<i>y</i>';
