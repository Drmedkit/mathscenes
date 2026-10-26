// common.ts: what every family file of geometric-sequences shares: misconception ids, the answer helpers (choice,
// typed number, typed fraction, two boxes), the strip helpers, and the number pools of the sub-goals' `cases`.
// Pure: no DOM, no canvas.
import { type Item, type Response, type Verdict, fracValue, int, pick, shuffle } from '../../runtime/item';
import { endOnChoice } from '../../runtime/explain';
import type { GeoPic } from './pictures';
import { type Q, decStr, near, q, qH, qi, qT, val } from './geo';

export interface QItem extends Item { picture?: GeoPic }
export type Gen = (R: () => number, n: number, sg?: string) => QItem;

export const MC = {
  fracIdx: 'mc.functions-concept.discrete-quantity-allows-fractions',
  posVal: 'mc.sequences-series.position-value-confusion',
  firstRows: 'mc.functions-concept.initial-rows-only-model-check',
  inverted: 'mc.sequences-series.ratio-inverted',
  exclusive: 'mc.sequences-series.rule-types-mutually-exclusive',
  shape: 'mc.functions-concept.family-from-rough-shape',
  addFactor: 'mc.exponential-log.constant-factor-as-constant-amount',
  negSign: 'mc.sequences-series.negative-ratio-sign',
  negFirst: 'mc.sequences-series.negative-first-term-implies-negative-ratio',
  mustPos: 'mc.sequences-series.geometric-ratio-must-be-positive',
  shiftAdd: 'mc.functions-concept.shifted-input-added-to-output',
  fTimes: 'mc.functions-concept.f-of-x-as-multiplication',
  curIdx: 'mc.sequences-series.current-index-replaces-previous-term',
  subMis: 'mc.sequences-series.subscript-notation-misread',
  noSeed: 'mc.sequences-series.initial-condition-omitted',
  nSteps: 'mc.sequences-series.n-steps-for-nth-term',
  evenNeg: 'mc.integers.even-power-of-negative-negative',
  powTimes: 'mc.exponents-roots.power-as-base-times-exponent',
  beyondBase: 'mc.properties.exponent-applied-beyond-base',
  coefAsFactor: 'mc.linear-functions.exponential-initial-value-as-growth-factor',
  firstAsIcpt: 'mc.linear-functions.first-output-as-intercept',
  shift1: 'mc.sequences-series.index-shifted-by-one',
  dropNegRoot: 'mc.exponents-roots.drops-negative-root-of-even-power',
  diffAsRatio: 'mc.sequences-series.arithmetic-difference-as-geometric-ratio',
  gapRatio: 'mc.linear-functions.raw-output-ratios-ignore-input-gaps',
  forwardOp: 'mc.sequences-series.forward-op-when-backward',
  oldRange: 'mc.functions-concept.keeps-old-parameter-interval',
  rewriteReset: 'mc.sequences-series.algebraic-rewrite-resets-index-domain',
  addPct: 'mc.percent.adds-successive-percent-changes',
  pctOf: 'mc.percent.percent-of-read-as-percent-change',
  factorRate: 'mc.exponential-log.factor-confused-with-rate',
  meaning: 'mc.sequences-series.contextual-term-meaning-misassigned',
  roundsFirst: 'mc.sequences-series.rounds-before-threshold-test',
  minUnver: 'mc.sequences-series.first-crossing-minimality-unverified',
  keywords: 'mc.functions-concept.model-family-from-keywords',
  examples: 'mc.reasoning-language.examples-as-proof',
  coefOnly: 'mc.sequences-series.geometric-formula-coefficients-only',
} as const;

// ---------- small helpers ----------
export const nI = '<i>n</i>', rI = '<i>r</i>', Mi = '−';
export const nz = (R: () => number, lo: number, hi: number) => { for (;;) { const v = int(R, lo, hi); if (v !== 0) return v; } };
export const listH = (vs: readonly Q[], dec = false) => vs.map(v => qH(v, dec)).join(', ');
export const listT = (vs: readonly Q[], dec = false) => vs.map(v => qT(v, dec)).join(',\\ ');
/** a number for prose: thousands commas, real minus sign, exact decimal ("12,288", "40.5", "−3") */
export function numP(v: Q | number): string {
  const x = typeof v === 'number' ? q(v) : v;
  const D = x.d === 1 ? String(Math.abs(x.n)) : decStr(x, 6);
  if (D === null) return qH(x);
  const [w, f] = D.split('.');
  return (x.n < 0 ? Mi : '') + w!.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (f ? '.' + f : '');
}
/** "$12,288" / "$40.50" */
export function usd(v: Q | number): string {
  const x = typeof v === 'number' ? q(v) : v;
  const s = numP(x);
  return s.includes('.') && s.split('.')[1]!.length === 1 ? `$${s}0` : `$${s}`;
}
/** pools from the sub-goals' cases */
export const R_WHOLE = [2, 3, 4, 5, 10];
export const R_FRAC: Q[] = [q(1, 2), q(1, 3), q(2, 3), q(3, 2), q(1, 4), q(3, 4)];
export const R_NEG: Q[] = [qi(-1), qi(-2), qi(-3), q(-1, 2)];
/** a start whose first `count` terms stay whole numbers for ratio r (|a1| ≤ about lim) */
export function startFor(R: () => number, r: Q, count: number, lo = 1, hi = 6): Q {
  const m = int(R, lo, hi);
  return qi(m * r.d ** (count - 1));
}

// ---------- answer helpers ----------
export interface Opt { t: string; ok?: boolean; mc?: string; say: string }
export interface Base { id: string; family: string; prompt: string; board: string; solution: string[]; picture?: GeoPic; unit?: string }
export function choice(R: () => number, b: Base, opts: Opt[]): QItem {
  const seen = new Set<string>();
  const o0 = opts.filter(x => { const k = x.t.replace(/\s+/g, ' '); if (seen.has(k)) return false; seen.add(k); return true; });
  if (o0.filter(x => x.ok).length !== 1) throw new Error(`${b.family}: exactly one right choice`);
  const o = shuffle(R, o0.slice());
  const i = o.findIndex(x => x.ok);
  return {
    ...b, input: 'choice', choices: o.map(x => x.t), answer: { kind: 'choice', i }, solution: endOnChoice(b.solution, o[i]!.t),
    check(r: Response): Verdict {
      if (r.kind !== 'choice' || !o[r.i]) return { ok: false, say: 'Pick one of the answers.' };
      const x = o[r.i]!;
      return { ok: !!x.ok, mc: x.ok ? undefined : x.mc, say: x.say };
    },
  };
}
/** a candidate wrong answer: [value, mc, what to say] (NaN = not applicable) */
export type Cand = [Q | number, string | undefined, string];
const asNum = (v: Q | number) => (typeof v === 'number' ? v : val(v));
export function numItem(b: Base, v: Q, okSay: string, cands: Cand[], hint: string): QItem {
  return {
    ...b, input: 'num', answer: { kind: 'num', v: val(v) },
    check(r: Response): Verdict {
      if (r.kind !== 'num' || !Number.isFinite(r.v)) return { ok: false, say: 'Type a number (a decimal is fine).' };
      if (near(r.v, v)) return { ok: true, say: okSay };
      for (const [c, mc, say] of cands) { const x = asNum(c); if (Number.isFinite(x) && !near(x, v) && Math.abs(r.v - x) < 1e-9 * Math.max(1, Math.abs(x))) return { ok: false, mc, say }; }
      return { ok: false, say: hint };
    },
  };
}
/** a typed fraction (or whole / mixed number): any equivalent form is right; positive values only */
export function fracItem(b: Base, v: Q, okSay: string, cands: [Q, string | undefined, string][], hint: string): QItem {
  if (v.n < 0) throw new Error(`${b.family}: a typed fraction must be positive`);
  return {
    ...b, input: 'frac', answer: { kind: 'frac', w: 0, n: v.n, d: v.d },
    check(r: Response): Verdict {
      if (r.kind !== 'frac') return { ok: false, say: 'Type a fraction.' };
      const p = fracValue(r);
      if (!p) return { ok: false, say: 'Type a fraction with whole numbers (the bottom not 0).' };
      const isV = (x: Q) => p[0] * x.d === x.n * p[1];
      if (isV(v)) return { ok: true, say: okSay };
      for (const [c, mc, say] of cands) if (!(c.n === v.n && c.d === v.d) && isV(c)) return { ok: false, mc, say };
      return { ok: false, say: hint };
    },
  };
}
export type PCand = [Q, Q, string | undefined, string];
export function pairItem(b: Base, x: Q, y: Q, form: { lead: string; op: string; tail?: string }, okSay: string, cands: PCand[], hint: string): QItem {
  return {
    ...b, input: 'pair', pairLead: form.lead, pairOp: form.op, pairTail: form.tail ?? '', answer: { kind: 'pair', x: val(x), y: val(y) },
    check(r: Response): Verdict {
      if (r.kind !== 'pair' || !Number.isFinite(r.x) || !Number.isFinite(r.y)) return { ok: false, say: 'Fill in both boxes with numbers.' };
      if (near(r.x, x) && near(r.y, y)) return { ok: true, say: okSay };
      for (const [cx, cy, mc, say] of cands) if (!(eqQ(cx, x) && eqQ(cy, y)) && near(r.x, cx) && near(r.y, cy)) return { ok: false, mc, say };
      if (near(r.x, x)) return { ok: false, say: `The first box is right. ${hint}` };
      if (near(r.y, y)) return { ok: false, say: `The second box is right. ${hint}` };
      return { ok: false, say: hint };
    },
  };
}
const eqQ = (a: Q, b: Q) => a.n === b.n && a.d === b.d;

// ---------- strip helpers ----------
/** an estimate of a value's width at 60 px (the strip checks the real width) */
function wEst(v: Q, dec: boolean): number {
  const t = qT(v, dec);
  const m = t.match(/\\frac\{(\d+)\}\{(\d+)\}/);
  const sgn = v.n < 0 ? 34 : 0;
  if (m) return sgn + Math.max(m[1]!.length, m[2]!.length) * 26 + 18;
  return t.replace(/^-/, '').length * 33 + sgn + 8;
}
/** how many columns of these values fit a 940 px strip (at most `max`) */
export function fitCols(vs: readonly Q[], dec: boolean, max = 6, ell = true): number {
  const room = 940 - 18 - 156;
  for (let k = Math.min(max, vs.length); k >= 2; k--) {
    const w = Math.max(...vs.slice(0, k).map(v => wEst(v, dec)));
    if ((w + 26) * (k + (ell ? 1 : 0)) <= room) return k;
  }
  return 2;
}
/** a strip of the first terms (as many as fit), index from n0 */
export function stripOf(vs0: readonly Q[], o: { n0?: number; ell?: boolean; name?: string; idx?: string; hops?: boolean; adds?: boolean; dec?: boolean; max?: number } = {}): GeoPic['strip'] {
  const dec = o.dec ?? false;
  const k = fitCols(vs0, dec, o.max ?? 6, o.ell ?? true);
  const vs = vs0.slice(0, k);
  return { ns: vs.map((_, i) => (o.n0 ?? 1) + i), vals: vs, ell: o.ell ?? true, name: o.name, idx: o.idx, hops: o.hops ?? true, adds: o.adds, dec };
}
/** a strip with only the first `show` values; the rest are '?' revealed in the replay */
export function stripHidden(vs0: readonly Q[], show: number, o: { n0?: number; name?: string; idx?: string; r?: Q; dec?: boolean; max?: number; ell?: boolean } = {}): GeoPic['strip'] {
  const dec = o.dec ?? false;
  const k = fitCols(vs0, dec, o.max ?? 6, o.ell ?? false);
  const vs = vs0.slice(0, k);
  return { ns: vs.map((_, i) => (o.n0 ?? 1) + i), vals: vs.map((v, i) => (i < show ? v : null)), reveal: vs.map((v, i) => (i < show ? null : v)), r: o.r, name: o.name, idx: o.idx, ell: o.ell ?? false, dec };
}
export { pick, int };
/** a strip that reaches a far term k: n = 1..k, or 1, 2, 3, …, k with a gap column; a_1 shown (or not), the rest '?'
 *  (revealed in the replay when `reveal`) */
export function farStrip(a1: Q, r: Q, k: number, o: { showFirst?: boolean; reveal?: boolean } = {}): GeoPic['strip'] {
  const K = Math.max(k, 2), ns = K <= 5 ? Array.from({ length: K }, (_, i) => i + 1) : [1, 2, 3, K];
  const first = o.showFirst ?? true;
  const vals = ns.map((_, j) => (j === 0 && first ? a1 : null));
  const reveal = o.reveal ? ns.map((i, j) => (j === 0 && first ? null : mulPow(a1, r, i - 1))) : undefined;
  return { ns, vals, reveal, r, ell: false };
}
function mulPow(a: Q, r: Q, k: number): Q { let v = a; for (let i = 0; i < k; i++) v = q(v.n * r.n, v.d * r.d); return v; }
