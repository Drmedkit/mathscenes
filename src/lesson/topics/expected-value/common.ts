// common.ts: what every practice family of "Probability distributions and expected value" shares: the item type with
// its pictures (DistPic specs the page draws), misconception ids (math-curriculum-essentials/misconceptions.json),
// exact number formatting, and the choice / number / fraction / pair item makers. The choice maker drops every wrong
// choice whose key equals the right one (same value, same claim), so a distractor can never be secretly right.
// Pure: no DOM.
import { type Item, type Response, type Verdict, fr, fracValue, int, pick, same, shuffle } from '../../runtime/item';
import { ans, endOnChoice } from '../../runtime/explain';
import type { DPic } from './DistPic';
import { type Q, gcd, qr } from './ev';

export { ans, fr, gcd, int, pick, shuffle };

export interface Pic { [k: string]: unknown; pics?: DPic[]; weights?: number[] }
export interface DItem extends Item { picture?: Pic }
export type Gen = (R: () => number, n: number, sg?: string) => DItem;

export const MC = {
  oneToOne: 'mc.probability.random-variable-must-be-one-to-one',
  fixedUnknown: 'mc.probability.random-variable-as-fixed-unknown',
  partsConfused: 'mc.probability.random-variable-parts-confused',
  equiprob: 'mc.probability.equiprobability-bias',
  rvAsTable: 'mc.probability.random-variable-as-distribution-table',
  probAsValue: 'mc.probability.probability-as-random-variable-value',
  outside01: 'mc.probability.probability-outside-zero-one',
  notOne: 'mc.probability.probabilities-not-summing-to-one',
  countAsProb: 'mc.probability.count-reported-as-probability',
  valueAsHeight: 'mc.data-displays.data-value-as-frequency-or-probability',
  trialAxis: 'mc.data-displays.distribution-axis-as-trial-order',
  equalTicks: 'mc.data-displays.data-values-as-equal-ticks',
  strictBoundary: 'mc.linear-equations.strict-includes-boundary',
  atLeastExactly: 'mc.probability.at-least-read-as-exactly',
  addStages: 'mc.probability.adds-stage-counts',
  omitsOrder: 'mc.probability.omits-order-factor-in-binomial',
  overCategories: 'mc.statistics.weighted-sum-over-category-count',
  exactParam: 'mc.statistics.sample-statistic-as-exact-parameter',
  unweighted: 'mc.statistics.unweighted-average',
  mode: 'mc.probability.ev-as-most-likely-value',
  sumsP: 'mc.probability.sums-probability-column-as-ev',
  roundsEv: 'mc.statistics.rounds-expectation-to-possible-count',
  revenue: 'mc.finance.revenue-treated-as-profit',
  costTwice: 'mc.finance.cost-subtracted-twice',
  deniesCertain: 'mc.probability.denies-ev-can-be-certain',
  guaranteed: 'mc.probability.ev-as-guaranteed-outcome',
  singleJudges: 'mc.probability.single-outcome-judges-probability',
  convergence: 'mc.probability.long-run-convergence-misread',
  gambler: 'mc.probability.gamblers-fallacy',
  everyTotal: 'mc.probability.every-intermediate-total-possible',
  totalShrinks: 'mc.probability.total-error-must-shrink-with-repetition',
  equalMeans: 'mc.probability.equal-means-equal-distributions',
  noConditions: 'mc.probability.model-applied-without-conditions',
  endpoint: 'mc.probability.inequality-endpoint-off-by-one',
  geoOffByOne: 'mc.probability.geometric-failures-off-by-one',
  deadline: 'mc.probability.mean-wait-as-guaranteed-deadline',
  poisLimit: 'mc.probability.poisson-mean-as-hard-count-limit',
  mismatchedUnits: 'mc.measurement-units.combine-mismatched-units',
  alwaysNormal: 'mc.statistics.binomial-always-normal',
  varForSd: 'mc.statistics.variance-for-sd',
  fairHalf: 'mc.probability.fair-means-half-wins',
  fairMisread: 'mc.probability.fair-game-misread',
} as const;

// ---------- exact numbers ----------
export const lowest = (n: number, d: number): [number, number] => qr(n, d);
/** a fraction in HTML (stacked), lowest terms unless raw */
export const fh = (n: number, d: number, raw = false): string => { const [a, b] = raw ? [n, d] : lowest(n, d); return b === 1 ? String(a) : fr(a, b); };
export const fhQ = (q: Q): string => fh(q[0], q[1]);
/** a fraction as plain text (the answer mark: the explain reader parses it) */
export const ft = (n: number, d: number): string => { const [a, b] = lowest(n, d); return b === 1 ? String(a) : `${a}/${b}`; };
/** TeX of a fraction (lowest terms unless raw) */
export const fx = (n: number, d: number, raw = false): string => { const [a, b] = raw ? [n, d] : lowest(n, d); return b === 1 ? String(a) : `\\tfrac{${a}}{${b}}`; };
export const fxQ = (q: Q): string => fx(q[0], q[1]);
/** round half up, robust to float noise */
export function round(x: number, d: number): number { const m = 10 ** d; return Math.round(x * m + Math.sign(x) * 1e-7) / m; }
/** a decimal for display: at most d places, no trailing zeros, a real minus sign */
export function dec(x: number, d = 4): string { const r = round(x, d); const s = Number.isInteger(r) ? String(Math.abs(r)) : Math.abs(r).toFixed(d).replace(/0+$/, '').replace(/\.$/, ''); return (r < 0 ? '−' : '') + s; }
/** a decimal with exactly d places (stated roundings: 0.090) */
export const decFixed = (x: number, d: number): string => (round(x, d) < 0 ? '−' : '') + Math.abs(round(x, d)).toFixed(d);
/** TeX of a decimal (the minus as TeX '-') */
export const dx = (x: number, d = 4): string => dec(x, d).replace('−', '-');
/** is x far enough from a rounding tie at `places`? */
export function noTie(x: number, places: number): boolean { const s = Math.abs(x) * 10 ** places; const f = s - Math.floor(s); return Math.abs(f - 0.5) > 0.03; }
/** dollars: $1.20, −$0.75, $12 (cents only when needed unless `cents`) */
export function money(v: number, cents = true): string {
  const r = round(v, 2), a = Math.abs(r);
  const s = cents || !Number.isInteger(r) ? a.toFixed(2) : String(a);
  return `${r < 0 ? '−' : ''}$${Number(s) >= 1000 ? Number(s).toLocaleString('en-US', { minimumFractionDigits: s.includes('.') ? 2 : 0 }) : s}`;
}
/** TeX dollars */
export const mx = (v: number, cents = true): string => money(v, cents).replace('−', '-').replace('$', '\\$');
/** "1,000" */
export const big = (n: number): string => n.toLocaleString('en-US');
/** "a" or "an" before a dollar amount read aloud: an $8, an $11, an $18, an $80, a $10 */
export const aD = (n: number): string => { const s = String(Math.abs(Math.round(n))); return s[0] === '8' || /^1[18]$/.test(s) || /^1[18]\d{3}$/.test(s) ? 'an' : 'a'; };
/** singular of a plural unit word: families -> family, households -> household */
export const one = (w: string): string => (w.endsWith('ies') ? w.slice(0, -3) + 'y' : w.replace(/s$/, ''));
/** a probability in hundredths as a decimal string: 35 -> "0.35" */
export const hd = (n: number, den = 100): string => dec(n / den, 4);

// ---------- words ----------
export const NAMES = ['Ravi', 'Mia', 'Lee', 'Jay', 'Pat', 'Ty', 'Zoe', 'Mo', 'Rita', 'Kim', 'Ada', 'Omar', 'Noor', 'Eli', 'Sam', 'Lu'];
export const who = (R: () => number): string => pick(R, NAMES);
const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
export const word = (n: number): string => WORDS[n] ?? String(n);
export const B = (s: string | number) => `<b class="b">${s}</b>`;
export const A = (s: string | number) => `<b class="a">${s}</b>`;
export const CALC = ' <span class="dim">(calculator allowed)</span>';

// ---------- item makers ----------
export interface Opt { t: string; ok?: boolean; mc?: string; say: string; /** the same key as the right choice = the same answer: dropped */ key?: string | number }
export interface Base { id: string; family: string; prompt: string; board: string; solution: string[]; picture?: Pic; unit?: string }

/** a choice item: duplicate texts and wrong choices that mean the same as the right one (same key) are dropped */
export function choice(R: () => number, b: Base, opts: Opt[], keepOrder = false): DItem {
  const right = opts.filter(x => x.ok);
  if (right.length !== 1) throw new Error(`${b.family}: exactly one right choice`);
  const rk = right[0]!.key;
  const seen = new Set<string>();
  const o0 = opts.filter(x => {
    const t = x.t.replace(/\s+/g, ' ').trim();
    if (seen.has(t)) return false;
    if (!x.ok && rk !== undefined && x.key !== undefined && String(x.key) === String(rk)) return false;
    seen.add(t);
    return true;
  });
  const o = keepOrder ? o0.slice() : shuffle(R, o0.slice());
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
/** a wrong typed value with its misconception and a specific reply */
export type Cand = [number, string | undefined, string];
/** a typed number; `tol` = the accepted distance (a stated rounding); slips equal to the answer are skipped */
export function numItem(b: Base, v: number, okSay: string, cands: Cand[], hint: string, tol = 1e-9): DItem {
  return {
    ...b, input: 'num', answer: { kind: 'num', v },
    check(r: Response): Verdict {
      if (r.kind !== 'num' || !Number.isFinite(r.v)) return { ok: false, say: 'Type a number.' };
      if (Math.abs(r.v - v) <= tol) return { ok: true, say: okSay };
      for (const [c, mc, say] of cands) if (Number.isFinite(c) && Math.abs(c - v) > tol && Math.abs(r.v - c) <= Math.max(tol, 1e-9)) return { ok: false, mc, say };
      return { ok: false, say: hint };
    },
  };
}
export type FCand = [number, number, string | undefined, string];
/** a probability as a fraction: any equivalent fraction is right (the answer key is in lowest terms) */
export function fracItem(b: Base, n: number, d: number, okSay: string, cands: FCand[], hint: string): DItem {
  const [ln, ld] = lowest(n, d);
  const key: Response = ld === 1 ? { kind: 'frac', w: ln, n: 0, d: 1 } : ln > ld ? { kind: 'frac', w: Math.floor(ln / ld), n: ln % ld, d: ld } : { kind: 'frac', w: 0, n: ln, d: ld };
  return {
    ...b, input: 'frac', answer: key,
    check(r: Response): Verdict {
      if (r.kind !== 'frac') return { ok: false, say: 'Type a fraction.' };
      const v = fracValue(r);
      if (!v) return { ok: false, say: 'Type it as a fraction: a whole-number top and bottom.' };
      if (same(v, ln, ld)) return { ok: true, say: okSay };
      for (const [cn, cd, mc, say] of cands) if (cd > 0 && cn * ld !== ln * cd && same(v, cn, cd)) return { ok: false, mc, say };
      return { ok: false, say: hint };
    },
  };
}
/** two numbers in boxes; each within its own tolerance */
export function pairItem(b: Base, lead: string, op: string, tail: string, x: number, y: number, okSay: string, cands: [number, number, string | undefined, string][], hint: string, tol: [number, number] = [1e-9, 1e-9]): DItem {
  return {
    ...b, input: 'pair', pairLead: lead, pairOp: op, pairTail: tail, answer: { kind: 'pair', x, y },
    check(r: Response): Verdict {
      if (r.kind !== 'pair' || !Number.isFinite(r.x) || !Number.isFinite(r.y)) return { ok: false, say: 'Type a number in each box.' };
      const okx = Math.abs(r.x - x) <= tol[0], oky = Math.abs(r.y - y) <= tol[1];
      if (okx && oky) return { ok: true, say: okSay };
      for (const [cx, cy, mc, say] of cands) if (!(Math.abs(cx - x) <= tol[0] && Math.abs(cy - y) <= tol[1]) && Math.abs(r.x - cx) <= tol[0] && Math.abs(r.y - cy) <= tol[1]) return { ok: false, mc, say };
      return { ok: false, say: hint };
    },
  };
}
/** try a maker until the test holds */
export function until<T>(make: () => T, ok: (t: T) => boolean, tries = 4000): T {
  let t = make();
  for (let i = 0; i < tries && !ok(t); i++) t = make();
  if (!ok(t)) throw new Error('until: nothing found');
  return t;
}
/** a probability table as TeX rows for the board ("x" and "P(X = x)") */
export const tableTex = (xs: readonly (string | number)[], ps: readonly string[], v = 'X'): string =>
  `\\begin{array}{c|${'c'.repeat(xs.length)}} x & ${xs.join(' & ')} \\\\ \\hline P(${v} = x) & ${ps.join(' & ')} \\end{array}`;
/** m positive whole numbers (each >= min) that add to total, in random order */
export function compose(R: () => number, total: number, m: number, min = 1): number[] {
  const free = total - m * min;
  if (free < 0) throw new Error('compose: total too small');
  const cuts = Array.from({ length: m - 1 }, () => Math.floor(R() * (free + 1))).sort((a, b) => a - b);
  const out: number[] = [];
  let prev = 0;
  for (const c of [...cuts, free]) { out.push(c - prev + min); prev = c; }
  return out;
}
/** "c/N = a/b" with the lowest-terms value marked as the answer; just the marked value when c/N is in lowest terms */
export const redA = (c: number, N: number): string => { const [a, b] = lowest(c, N); return a === c && b === N ? ans(ft(c, N)) : `${c}/${N} = ${ans(ft(c, N))}`; };
