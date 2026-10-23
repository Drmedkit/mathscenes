// items.ts: exercise families for "ratio problems with fractions and decimals" (primary.ratios.solve-complex-ratio-
// problems), generated from templates, checked exactly, and every wrong answer the classifier recognises carries its
// misconception id (math-curriculum-essentials/misconceptions.json). A generator gets the SUB-GOAL it practises
// (plan.ts) and uses that sub-goal's number ranges from the topic JSON. Pure: no DOM, no canvas.
import { type Item, type Response, type Verdict, A, B, fr, int, pick, plain, shuffle, gcd } from '../../runtime/item';
import { type DLSpec, DL_FRAME, dlFits } from './DoubleLine';
import { endOnChoice } from '../../runtime/explain';
import { type Q, Qv, fmt, fmtMixed, fracAns, longDiv, missing, money, near, qDiv, qEq, qLess, qMul, qNum, qOf, qSub, rat, rateOf, roundQ, terminates, places, texQ, truncQ, valueOf, qAdd } from './ratioMaths';

export type FamilyId = 'scaleUp' | 'sameRatio' | 'scaleDown' | 'fracOk' | 'findFactor' | 'predict' | 'betweenWithin' | 'unitRate'
  | 'blockRow' | 'pickBlock' | 'exactFrac' | 'longDiv' | 'roundEnd' | 'decTable' | 'complexRate' | 'writeK' | 'useK' | 'isProp'
  | 'chooseMethod' | 'mixed' | 'unitCheck' | 'mixedUnits' | 'ratioCheck' | 'roundCheck' | 'sizeCheck' | 'audit';
export const FAMILIES: readonly { id: FamilyId; name: string }[] = [
  { id: 'scaleUp', name: 'Scale up by a fraction' },
  { id: 'sameRatio', name: 'Same ratio?' },
  { id: 'scaleDown', name: 'Scale down' },
  { id: 'fracOk', name: 'Part of a recipe' },
  { id: 'findFactor', name: 'Find the multiplier' },
  { id: 'predict', name: 'Predict the size' },
  { id: 'betweenWithin', name: 'Multiplier or rate?' },
  { id: 'unitRate', name: 'Through the unit rate' },
  { id: 'blockRow', name: 'A building-block row' },
  { id: 'pickBlock', name: 'Pick the stepping stone' },
  { id: 'exactFrac', name: 'Keep it exact' },
  { id: 'longDiv', name: 'Long division' },
  { id: 'roundEnd', name: 'Round once, at the end' },
  { id: 'decTable', name: 'Decimals in both columns' },
  { id: 'complexRate', name: 'Rates from fractions' },
  { id: 'writeK', name: 'Write y = kx' },
  { id: 'useK', name: 'Use y = kx' },
  { id: 'isProp', name: 'Proportional or not?' },
  { id: 'chooseMethod', name: 'Choose a method' },
  { id: 'mixed', name: 'Mixed problems' },
  { id: 'unitCheck', name: 'Check the units' },
  { id: 'mixedUnits', name: 'Different units' },
  { id: 'ratioCheck', name: 'Check the ratio' },
  { id: 'roundCheck', name: 'Check a rounded answer' },
  { id: 'sizeCheck', name: 'Check the size' },
  { id: 'audit', name: 'Audit a solution' },
];
export const FAMILY_NAMES: Record<string, string> = Object.fromEntries(FAMILIES.map(f => [f.id, f.name]));

/** what the page draws: the double number line, and how the worked solution replays on it */
export type RPPic = { dl: DLSpec };
export interface RPItem extends Item { family: FamilyId; picture?: RPPic }
type Gen = (R: () => number, n: number, sg?: string) => RPItem;

// ---------- misconception ids ----------
export const MC = {
  additive: 'mc.ratio-rate.additive-keep-difference',
  bigger: 'mc.mul-div.multiplication-makes-bigger',
  fracInvalid: 'mc.ratio-rate.fractional-quantities-invalid',
  inverted: 'mc.ratio-rate.scale-factor-inverted',
  difference: 'mc.mul-div.factor-reported-as-difference',
  betweenWithin: 'mc.ratio-rate.confuses-between-and-within-multipliers',
  reversed: 'mc.ratio-rate.unit-rate-division-reversed',
  early: 'mc.decimals.intermediate-precision-always-invalid',
  habit: 'mc.estimation.method-not-chosen-from-numbers',
  truncates: 'mc.decimals.truncates-instead-of-rounding',
  remainder: 'mc.fractions-concept.remainder-written-as-r-or-decimal',
  wrongPlace: 'mc.decimals.uses-unrequested-rounding-unit',
  oneTerm: 'mc.ratio-rate.scale-only-one-term',
  unequal: 'mc.ratio-rate.unequal-factors-on-both-terms',
  otherPart: 'mc.ratio-rate.confuses-whole-with-other-part',
  nonProp: 'mc.ratio-rate.scales-non-proportional',
  labelRepair: 'mc.measurement-units.unit-label-repairs-invalid-dimensions',
  rateEq: 'mc.ratio-rate.misreads-rate-notation',
  unconverted: 'mc.measurement-units.arithmetic-on-unconverted-unit-numerals',
  noSize: 'mc.estimation.accepts-result-without-size-check',
  nearMiss: 'mc.estimation.near-miss-accepted-as-match',
  gapError: 'mc.estimation.rounding-gap-treated-as-error',
  bounds: 'mc.statistics.mean-check-by-bounds-only',
  repeat: 'mc.reasoning-language.check-by-repeating-same-steps',
} as const;

// ---------- text helpers ----------
/** HTML of a value: 12, 4.5, else a mixed number with a stacked fraction */
export function hv(v: Q): string {
  if (terminates(v) && places(v) <= 3) return fmt(v);
  const w = Math.floor(v.p / v.q), r = v.p - w * v.q;
  return `${w ? w + '&#8202;' : ''}${fr(r, v.q)}`;
}
const fq = (v: Q) => (v.q === 1 ? String(v.p) : fr(v.p, v.q));
/** HTML of a value as a fraction or mixed number (never a decimal) */
const hf = (v: Q) => { if (v.q === 1) return String(v.p); const w = Math.floor(v.p / v.q), r = v.p - w * v.q; return `${w ? w + '&#8202;' : ''}${fr(r, v.q)}`; };
/** TeX of a value as a fraction or mixed number */
const texF = (v: Q) => { if (v.q === 1) return String(v.p); const w = Math.floor(v.p / v.q), r = v.p - w * v.q; return `${w || ''}\\dfrac{${r}}{${v.q}}`; };
/** a decimal when it is short, else a fraction */
const nice = (v: Q) => (terminates(v) && places(v) <= 3 ? fmt(v) : fq(v));
const dec = (v: Q) => fmt(v);

/** an exact .x5 tie for rounding to dp places (27.885 to the cent): floats may round it either way, so never asked */
const tie = (x: Q, dp: number) => terminates(x) && places(x) === dp + 1 && Math.round(Math.abs(qNum(x)) * 10 ** (dp + 1)) % 10 === 5;

// ---------- contexts (US units; every quantity can be split) ----------
export interface Ctx {
  id: string;
  rails: [string, string];
  money: [boolean, boolean];
  u: [[string, string], [string, string]];
  given(a: string, b: string): string;
  askBot(a: string): string;
  askTop(b: string): string;
  /** second per first, first per second */
  per: [string, string];
  /** the input unit word for a missing first / second value */
  unit: [string, string];
  tex: [(v: string) => string, (v: string) => string];
}
// ---------- the world of a story: every given pair a real one (the oracle sweep found $0.33 cherries, a 9 mpg car,
// a pancake recipe with flour : milk = 2 : 12). Each story's given() notes its pair; GENERATORS draws again (from the
// same seeded stream, so still deterministic) until the pair is a real one.
let SEEN: { id: string; a: number; b: number }[] = [];
/** a quantity's value from its text: "$4.50", "12 pounds", "2 1/2 cups of flour", "3/4 mile" */
function valueOfText(h: string): number {
  const m = plain(h).replace(/,/g, '').match(/^\$?(\d+(?:\.\d+)?)(?:\s+(\d+)\/(\d+)|\/(\d+))?/);
  if (!m) return NaN;
  return m[2] ? Number(m[1]) + Number(m[2]) / Number(m[3]) : m[4] ? Number(m[1]) / Number(m[4]) : Number(m[1]);
}
function saw(id: string, a: string, b: string): void { SEEN.push({ id, a: valueOfText(a), b: valueOfText(b) }); }
/** a real pair: cherries $1-$15 a pound, a hike 1-5 mph, a car 10-60 mpg, pancakes flour : milk between 1 : 3 and 3 : 1 */
export function realPair(id: string, a: number, b: number): boolean {
  const r = b / a;
  if (!Number.isFinite(r)) return true;
  if (id === 'cherries') return r >= 1 && r <= 15;
  if (id === 'hike') return r >= 1 && r <= 5;
  if (id === 'car') return r >= 10 && r <= 60;
  if (id === 'pancakes') return a / b >= 1 / 3 && a / b <= 3;
  return true;
}
export const CTX: Record<string, Ctx> = {
  cherries: {
    id: 'cherries', rails: ['pounds', 'dollars'], money: [false, true], u: [['pound', 'pounds'], ['', '']],
    given: (a, b) => (saw('cherries', a, b), `${A(a)} of cherries cost ${B(b)}.`), askBot: a => `How much do ${A(a)} cost?`, askTop: b => `How many pounds of cherries do ${B(b)} buy?`,
    per: ['dollars per pound', 'pounds per dollar'], unit: ['pounds', 'dollars'], tex: [v => `${v}\\text{ lb}`, v => `\\$${v}`],
  },
  hike: {
    id: 'hike', rails: ['hours', 'miles'], money: [false, false], u: [['hour', 'hours'], ['mile', 'miles']],
    given: (a, b) => (saw('hike', a, b), `Maya hikes ${B(b)} in ${A(a)} at a steady pace.`), askBot: a => `How far does she hike in ${A(a)}?`, askTop: b => `How long does she take to hike ${B(b)}?`,
    per: ['miles per hour', 'hours per mile'], unit: ['hours', 'miles'], tex: [v => `${v}\\text{ h}`, v => `${v}\\text{ mi}`],
  },
  car: {
    id: 'car', rails: ['gallons', 'miles'], money: [false, false], u: [['gallon', 'gallons'], ['mile', 'miles']],
    given: (a, b) => (saw('car', a, b), `A car goes ${B(b)} on ${A(a)} of gas.`), askBot: a => `How far does it go on ${A(a)}?`, askTop: b => `How much gas does it need for ${B(b)}?`,
    per: ['miles per gallon', 'gallons per mile'], unit: ['gallons', 'miles'], tex: [v => `${v}\\text{ gal}`, v => `${v}\\text{ mi}`],
  },
  pancakes: {
    id: 'pancakes', rails: ['flour', 'milk'], money: [false, false], u: [['cup of flour', 'cups of flour'], ['cup of milk', 'cups of milk']],
    given: (a, b) => (saw('pancakes', a, b), `A pancake recipe uses ${A(a)} for every ${B(b)}.`), askBot: a => `How much milk goes with ${A(a)}?`, askTop: b => `How much flour goes with ${B(b)}?`,
    per: ['cups of milk per cup of flour', 'cups of flour per cup of milk'], unit: ['cups', 'cups'], tex: [v => `${v}\\text{ flour}`, v => `${v}\\text{ milk}`],
  },
  chain: {
    id: 'chain', rails: ['feet', 'pounds'], money: [false, false], u: [['foot', 'feet'], ['pound', 'pounds']],
    given: (a, b) => `${A(a)} of chain weigh ${B(b)}.`, askBot: a => `What do ${A(a)} of the chain weigh?`, askTop: b => `How long is a piece of the chain that weighs ${B(b)}?`,
    per: ['pounds per foot', 'feet per pound'], unit: ['feet', 'pounds'], tex: [v => `${v}\\text{ ft}`, v => `${v}\\text{ lb}`],
  },
};
const ALL = Object.values(CTX);
/** a quantity with its unit: "$4.50", "3 pounds", "2½ cups of flour" */
export function qt(c: Ctx, side: 0 | 1, v: Q): string {
  if (c.money[side]) return fmt(v, true);
  return `${hv(v)} ${qEq(v, rat(1)) ? c.u[side][0] : c.u[side][1]}`;
}
const tq = (c: Ctx, side: 0 | 1, v: Q | null) => (v === null ? '\\,?' : c.tex[side](c.money[side] && v.q !== 1 ? qNum(v).toFixed(2) : texQ(v)));
/** the board line of a missing-value problem: 4 lb : $10 = 6 lb : ? */
export const pairBoard = (c: Ctx, a: Q, b: Q, ta: Q | null, tb: Q | null) => `${tq(c, 0, a)} : ${tq(c, 1, b)} = ${tq(c, 0, ta)} : ${tq(c, 1, tb)}`;

// ---------- the double number line picture ----------
function pic(c: Ctx, a: Q, b: Q, ta: Q | null, tb: Q | null, o: Partial<DLSpec> = {}): RPPic | undefined {
  const dl: DLSpec = { top: { name: c.rails[0], money: c.money[0] }, bot: { name: c.rails[1], money: c.money[1] }, given: [a, b], target: [ta, tb], ...o };
  if (dlFits(dl, DL_FRAME)) return { dl };
  if (o.pieces && dlFits({ ...dl, pieces: null, arcs: [] }, DL_FRAME)) return { dl: { ...dl, pieces: null, arcs: o.arcs?.filter(x => x.from !== 'piece' && x.to !== 'piece') } };
  return undefined;
}
/** a multiplier label: × 3/2, × 1.5 */
export const xLabel = (m: Q, frac = true) => `×${frac && m.q !== 1 ? `${m.p}/${m.q}` : fmt(m)}`;

// ---------- the classifier of a missing value ----------
interface MissOpts {
  /** old and new of the known quantity, old of the missing one, the exact answer */
  k0: Q; k1: Q; u0: Q; ans: Q;
  /** answers within this tolerance count (a stated rounding) */
  roundTo?: number;
  rateUnit?: string;
  right?: string;
}
function classifyMissing(o: MissOpts, x: Q): Verdict {
  const want = o.roundTo === undefined ? o.ans : roundQ(o.ans, o.roundTo);
  if (qEq(x, want)) return { ok: true, say: o.right ?? `Yes: ${hv(want)}.` };
  const m = qDiv(o.k1, o.k0);
  const tol = o.roundTo === undefined ? 0.0001 : 0.5 * 10 ** -o.roundTo + 1e-9;
  const is = (v: Q | null) => v !== null && v.p > 0 && Math.abs(qNum(x) - qNum(v)) <= tol && !near(x, want, 1e-9);
  const additive = qAdd(o.u0, qSub(o.k1, o.k0));
  if (is(additive)) return { ok: false, mc: MC.additive, say: `That adds the same amount to both. Adding keeps the difference, not the ratio. Multiply both by ${fq(m)} instead.` };
  if (is(qMul(o.u0, qDiv(o.k0, o.k1)))) return { ok: false, mc: MC.inverted, say: `That multiplies by ${fq(qDiv(o.k0, o.k1))}, the multiplier turned upside down. The multiplier is new ÷ old = ${fq(m)}.` };
  if (is(qMul(o.k1, qDiv(o.k0, o.u0)))) return { ok: false, mc: MC.reversed, say: 'That rate was divided the wrong way round. Divide the quantity you want by the one you know: the rate is the missing quantity per one of the other.' };
  if (is(o.u0)) return { ok: false, mc: MC.oneTerm, say: 'That is the old amount. When one quantity changes, the other changes by the same multiplier.' };
  if (is(qMul(o.u0, o.k1))) return { ok: false, mc: MC.unequal, say: `That multiplies one side by ${hv(o.k1)} but the other by ${fq(m)}. Use the same multiplier on both.` };
  const rate = qDiv(o.u0, o.k0);
  if (!terminates(rate) || places(rate) > 2) for (const d of [2, 1]) {
    const early = qMul(roundQ(rate, d), o.k1);
    if (is(early) && !qEq(early, want)) return { ok: false, mc: MC.early, say: `That rounds the rate to ${fmt(roundQ(rate, d))} first, and the rounding error grows when you multiply. Keep the rate exact (${fq(rate)}) and round once, at the end.` };
  }
  if (o.roundTo !== undefined) {
    if (qEq(x, truncQ(o.ans, o.roundTo)) && !qEq(want, truncQ(o.ans, o.roundTo))) return { ok: false, mc: MC.truncates, say: `Close: those digits were cut off. Look at the next digit: ${longDiv(o.ans, o.roundTo + 1)} rounds to ${fmt(want)}.` };
    for (const d of [o.roundTo - 1, 0]) if (d >= 0 && d !== o.roundTo && qEq(x, roundQ(o.ans, d)) && !qEq(x, want)) return { ok: false, mc: MC.wrongPlace, say: `That is rounded to the wrong place. Round to ${o.roundTo === 2 ? 'the nearest hundredth (cent)' : o.roundTo === 1 ? 'the nearest tenth' : 'a whole number'}.` };
  }
  if (!qLess(o.k0, o.k1) && qLess(o.u0, x) && qLess(o.k1, o.k0)) return { ok: false, mc: MC.bigger, say: `The known amount went down (× ${fq(m)}, less than 1), so the other one must go down too.` };
  return { ok: false, say: `Find the multiplier first: ${hv(o.k1)} ÷ ${hv(o.k0)} = ${fq(m)}. Then multiply the other amount by the same number.` };
}
/** reads a response as an exact value and classifies it */
const checkMissing = (o: MissOpts) => (r: Response): Verdict => {
  const x = valueOf(r as never);
  if (!x) return { ok: false, say: 'Type a number (a whole number, a decimal or a fraction).' };
  return classifyMissing(o, x);
};

// ---------- a missing-value item (shared by several families) ----------
interface MV { c: Ctx; a: Q; b: Q; t: Q; missBot: boolean }
function mvParts(v: MV) {
  const { c, a, b, t, missBot } = v;
  const k0 = missBot ? a : b, u0 = missBot ? b : a, ans = missing(k0, u0, t);
  const ta = missBot ? t : ans, tb = missBot ? ans : t;
  const text = `${c.given(qt(c, 0, a), qt(c, 1, b))} ${missBot ? c.askBot(qt(c, 0, t)) : c.askTop(qt(c, 1, t))}`;
  return { k0, u0, ans, ta, tb, text, board: pairBoard(c, a, b, missBot ? t : null, missBot ? null : t), unit: c.unit[missBot ? 1 : 0], side: (missBot ? 1 : 0) as 0 | 1 };
}

// ---------- 1 scale up by 3/2, 5/2, 5/4 ----------
const M_UP: readonly [number, number][] = [[3, 2], [5, 2], [5, 4]];
const scaleUp: Gen = (R, n, sg) => {
  const [p, q] = pick(R, M_UP);
  let i = 1, j = 1;
  for (let k = 0; k < 60; k++) { i = int(R, 1, Math.floor(20 / p)); j = int(R, 1, Math.floor(20 / q)); if (q * i <= 20 && j !== i && j * q !== p * i && q * j !== p * i && q * i !== q * j) break; }
  const c = pick(R, [CTX.cherries!, CTX.pancakes!, CTX.chain!]);
  const missBot = sg === 'choose-method' ? R() < 0.5 : R() < 0.75;
  // the given pair (q·i, q·j); the known target is p·i (first) or p·j (second); either way it is p pieces of i
  const a = rat(q * i), b = rat(q * j), t = rat(p * (missBot ? i : j));
  const v: MV = { c, a, b, t, missBot };
  const P = mvParts(v), m = rat(p, q);
  return {
    id: `scaleUp-${n}`, family: 'scaleUp', prompt: P.text, board: P.board, input: 'num', unit: P.unit, answer: { kind: 'num', v: qNum(P.ans) },
    picture: pic(c, a, b, missBot ? t : null, missBot ? null : t, { pieces: { cut: q, count: p }, arcs: [{ from: 'given', to: 'target', label: xLabel(m) }] }),
    solution: [`The multiplier: new ÷ old = ${hv(t)} ÷ ${hv(P.k0)} = ${fq(m)} (= ${fmt(m)}).`, `In whole steps: ÷ ${q}, then × ${p}, on <b>both</b> quantities.`, `${hv(P.u0)} × ${fq(m)} = <b class="s">${hv(P.ans)}</b>.`],
    check: checkMissing({ k0: P.k0, k1: t, u0: P.u0, ans: P.ans, right: `Yes: both quantities × ${fq(m)}, so ${qt(c, P.side, P.ans)}.` }),
  };
};

// ---------- 1 same ratio? (multiply both vs add to both) ----------
const sameRatio: Gen = (R, n) => {
  const [p, q] = pick(R, M_UP);
  const c = pick(R, [CTX.cherries!, CTX.pancakes!, CTX.chain!]);
  let i = 1, j = 2;
  for (let k = 0; k < 60; k++) { i = int(R, 1, Math.floor(20 / p)); j = int(R, 1, Math.floor(20 / q)); if (j !== i) break; }
  const a = rat(q * i), b = rat(q * j), ta = rat(p * i), tb = rat(p * j);
  const add = qAdd(b, qSub(ta, a));
  const opts = [
    { t: `${qt(c, 0, ta)} and ${qt(c, 1, tb)}`, ok: true, mc: undefined as string | undefined },
    { t: `${qt(c, 0, ta)} and ${qt(c, 1, add)}`, ok: false, mc: MC.additive },
    { t: `${qt(c, 0, ta)} and ${qt(c, 1, b)}`, ok: false, mc: MC.oneTerm },
  ];
  const sh = shuffle(R, [0, 1, 2]);
  const ch = sh.map(k => opts[k]!);
  const right = ch.findIndex(o => o.ok);
  return {
    id: `sameRatio-${n}`, family: 'sameRatio', prompt: `${c.given(qt(c, 0, a), qt(c, 1, b))} Which pair goes at the <b>same rate</b>?`,
    board: `${tq(c, 0, a)} : ${tq(c, 1, b)}`, input: 'choice', choices: ch.map(o => o.t), answer: { kind: 'choice', i: right },
    solution: [`${hv(ta)} ÷ ${hv(a)} = ${fq(rat(p, q))}: the first amount is multiplied by ${fq(rat(p, q))}.`, `The second must be multiplied by the same number: ${hv(b)} × ${fq(rat(p, q))} = ${hv(tb)}.`, `Adding the same amount to both keeps the difference, not the ratio.`],
    check: r => {
      if (r.kind !== 'choice') return { ok: false, say: 'Pick one.' };
      const o = ch[r.i]!;
      if (o.ok) return { ok: true, say: `Yes: both × ${fq(rat(p, q))}.` };
      return o.mc === MC.additive ? { ok: false, mc: o.mc, say: `Both went up by ${hv(qSub(ta, a))}, so the difference stays, but the ratio changes. Multiply both by ${fq(rat(p, q))}.` }
        : { ok: false, mc: o.mc, say: `Only the first amount changed. If the first is × ${fq(rat(p, q))}, the second is × ${fq(rat(p, q))} too.` };
    },
  };
};

// ---------- 2 scale down by 1/2, 2/3, 3/4 ----------
const M_DOWN: readonly [number, number][] = [[1, 2], [2, 3], [3, 4]];
const scaleDown: Gen = (R, n) => {
  const [p, q] = pick(R, M_DOWN);
  const c = pick(R, [CTX.pancakes!, CTX.chain!]);
  const i = int(R, 1, Math.floor(20 / q));
  let b = 3;
  for (let k = 0; k < 40; k++) { b = int(R, 3, 20); if (b !== q * i && (b * p) % q !== 0) break; }
  const a = rat(q * i), ta = rat(p * i), bq = rat(b), tb = qMul(bq, rat(p, q)), m = rat(p, q);
  const P = mvParts({ c, a, b: bq, t: ta, missBot: true });
  const base = checkMissing({ k0: a, k1: ta, u0: bq, ans: tb });
  return {
    id: `scaleDown-${n}`, family: 'scaleDown', prompt: `${P.text} <span class="dim">(A fraction, a mixed number or a decimal is fine.)</span>`, board: P.board,
    input: 'frac', unit: c.money[1] ? 'dollars' : P.unit, answer: fracAns(tb),
    picture: pic(c, a, bq, ta, null, { pieces: { cut: q, count: p }, arcs: [{ from: 'given', to: 'target', label: xLabel(m) }], fillText: c.money[1] ? undefined : fmtMixed(tb) }),
    solution: [`The multiplier: ${hv(ta)} ÷ ${hv(a)} = ${fq(m)}, less than 1, so the answer is smaller than ${hv(bq)}.`, `${hv(bq)} × ${fq(m)} = ${fq(rat(b * p, q))} = <b class="s">${hv(tb)}</b>.`, `A fraction of a cup or a pound is a real amount: no need to round.`],
    check: r => {
      const v = base(r);
      if (v.ok || v.mc) return v;
      const x = valueOf(r as never);
      if (x && (qEq(x, rat(Math.floor(qNum(tb)))) || qEq(x, rat(Math.round(qNum(tb)))))) return { ok: false, mc: MC.fracInvalid, say: `A ratio can hold fractions: ${hv(tb)} ${c.money[1] ? 'dollars' : 'is a real amount'}. Give the exact value.` };
      if (x && qLess(bq, x)) return { ok: false, mc: MC.bigger, say: `× ${fq(m)} makes it smaller: ${fq(m)} is less than 1. The answer is less than ${hv(bq)}.` };
      return v;
    },
  };
};

// ---------- 2 part of a recipe: fractions are fine ----------
const fracOk: Gen = (R, n) => {
  const [p, q] = pick(R, M_DOWN);
  let a = 3, b = 5;
  for (let k = 0; k < 60; k++) { a = int(R, 2, 15); b = int(R, 2, 15); if (a !== b && ((a * p) % q !== 0 || (b * p) % q !== 0)) break; }
  const m = rat(p, q), ta = qMul(rat(a), m), tb = qMul(rat(b), m);
  const whole = (v: Q) => rat(Math.max(1, Math.round(qNum(v))));
  const up = (v: Q) => qDiv(v, m);
  const c = CTX.pancakes!;
  const cand = [
    { t: `${qt(c, 0, ta)} and ${qt(c, 1, tb)}`, ok: true, mc: undefined as string | undefined },
    { t: `${qt(c, 0, whole(ta))} and ${qt(c, 1, whole(tb))}: amounts in a ratio must be whole`, ok: false, mc: MC.fracInvalid },
    { t: `${qt(c, 0, up(rat(a)))} and ${qt(c, 1, up(rat(b)))}`, ok: false, mc: MC.inverted },
  ];
  const ch = shuffle(R, cand);
  return {
    id: `fracOk-${n}`, family: 'fracOk', prompt: `${c.given(qt(c, 0, rat(a)), qt(c, 1, rat(b)))} You make <b>${fq(m)}</b> of the recipe. How much of each?`,
    board: `${a} : ${b} \\xrightarrow{\\times ${texQ(m)}} \\,?`, input: 'choice', choices: ch.map(o => o.t), answer: { kind: 'choice', i: ch.findIndex(o => o.ok) },
    solution: [`${fq(m)} of the recipe: multiply both amounts by ${fq(m)}.`, `${a} × ${fq(m)} = ${hv(ta)} and ${b} × ${fq(m)} = ${hv(tb)}.`, 'Cups can be split, so fractions are real amounts here.'],
    check: r => {
      if (r.kind !== 'choice') return { ok: false, say: 'Pick one.' };
      const o = ch[r.i]!;
      if (o.ok) return { ok: true, say: `Yes: both × ${fq(m)}.` };
      return o.mc === MC.fracInvalid ? { ok: false, mc: o.mc, say: `Rounding to whole cups changes the ratio. ${hv(ta)} cups is a real amount.` }
        : { ok: false, mc: o.mc, say: `That divides by ${fq(m)}, which makes MORE. ${fq(m)} of the recipe is less than the whole recipe.` };
    },
  };
};

// ---------- 3 the multiplier as new ÷ old ----------
const FACTORS: readonly [number, number][] = [[3, 2], [5, 4], [2, 3], [5, 3], [3, 4], [5, 2], [4, 3], [7, 4], [3, 5], [7, 2]];
const findFactor: Gen = (R, n) => {
  const [p, q] = pick(R, FACTORS);
  const k = int(R, 1, Math.floor(100 / Math.max(p, q)));
  const o = q * k, w = p * k, m = rat(p, q);
  const c = pick(R, ALL);
  const side = int(R, 0, 1) as 0 | 1;
  return {
    id: `findFactor-${n}`, family: 'findFactor',
    prompt: `In a ratio table, ${side ? B(qt(c, side, rat(o))) : A(qt(c, side, rat(o)))} in one row becomes ${side ? B(qt(c, side, rat(w))) : A(qt(c, side, rat(w)))} in another. What do you multiply ${o} by to get ${w}? <span class="dim">(A fraction or a decimal.)</span>`,
    board: `${o} \\xrightarrow{\\;\\times\\; ?\\;} ${w}`, input: 'frac', answer: fracAns(m),
    solution: [`The multiplier is new ÷ old: ${w} ÷ ${o} = ${fr(w, o)}.`, `${fr(w, o)} = <b class="s">${fq(m)}</b>${terminates(m) ? ` = ${fmt(m)}` : ''}.`, `Check: ${o} × ${fq(m)} = ${w}.`],
    check: r => {
      const x = valueOf(r as never);
      if (!x) return { ok: false, say: 'Type a fraction or a decimal.' };
      if (qEq(x, m)) return { ok: true, say: `Yes: ${w} ÷ ${o} = ${fq(m)}.` };
      if (qEq(x, rat(q, p))) return { ok: false, mc: MC.inverted, say: `That is old ÷ new. The multiplier takes the old value to the new one: new ÷ old = ${w} ÷ ${o}.` };
      if (qEq(x, rat(Math.abs(w - o)))) return { ok: false, mc: MC.difference, say: `${Math.abs(w - o)} is the difference. The question is “times what?”: new ÷ old.` };
      return { ok: false, say: `Divide new by old: ${w} ÷ ${o}, then simplify.` };
    },
  };
};

// ---------- 4 predict the size from the multiplier ----------
const PRED: readonly [number, number][] = [[2, 5], [3, 5], [3, 4], [4, 5], [9, 10], [11, 10], [5, 4], [3, 2], [7, 4], [5, 2]];
const predict: Gen = (R, n) => {
  const [p, q] = pick(R, PRED);
  const m = rat(p, q);
  const k = int(R, 1, Math.max(1, Math.floor(30 / q)));
  const a = rat(q * k), ta = rat(p * k);
  const c = pick(R, [CTX.cherries!, CTX.car!, CTX.chain!]);
  const b = rat(2 * int(R, c.id === 'car' ? 40 : 4, c.id === 'car' ? 120 : 30));
  const half = qDiv(b, rat(2)), dbl = qMul(b, rat(2));
  const s = (v: Q) => qt(c, 1, v);
  const choices = [`less than ${s(half)}`, `between ${s(half)} and ${s(b)}`, `between ${s(b)} and ${s(dbl)}`, `more than ${s(dbl)}`];
  const v = qNum(m), right = v < 0.5 ? 0 : v < 1 ? 1 : v < 2 ? 2 : 3;
  return {
    id: `predict-${n}`, family: 'predict',
    prompt: `${c.given(qt(c, 0, a), qt(c, 1, b))} ${c.askBot(qt(c, 0, ta))} Don't work it out yet: the ${c.rails[0]} are multiplied by <b>${fmt(m)}</b>. About how big is the answer?`,
    board: `${tq(c, 0, a)} \\xrightarrow{\\times ${fmt(m)}} ${tq(c, 0, ta)}`, input: 'choice', choices, answer: { kind: 'choice', i: right },
    solution: [`× ${fmt(m)} is ${v < 1 ? 'less than 1: the answer is smaller than' : 'more than 1: the answer is bigger than'} ${s(b)}.`, `${v < 0.5 ? 'Less than one half' : v < 1 ? 'Between one half and 1' : v < 2 ? 'Between 1 and 2' : 'More than 2'}, so ${choices[right]}.`, `(Exactly: ${s(b)} × ${fmt(m)} = ${s(qMul(b, m))}.)`],
    check: r => {
      if (r.kind !== 'choice') return { ok: false, say: 'Pick one.' };
      if (r.i === right) return { ok: true, say: `Yes: × ${fmt(m)} gives ${choices[right]}.` };
      if (v < 1 && r.i >= 2) return { ok: false, mc: MC.bigger, say: `Multiplying by ${fmt(m)}, a number less than 1, makes it smaller, not bigger.` };
      return { ok: false, say: `Compare the multiplier with ½, 1 and 2: ${fmt(m)} is ${v < 0.5 ? 'less than ½' : v < 1 ? 'between ½ and 1' : v < 2 ? 'between 1 and 2' : 'more than 2'}.` };
    },
  };
};

// ---------- 5 the multiplier (between pairs) vs the rate (within a pair) ----------
const betweenWithin: Gen = (R, n) => {
  const c = pick(R, [CTX.cherries!, CTX.car!, CTX.chain!, CTX.hike!]);
  let a = 4, b = 10, m = rat(3, 2), r = rat(5, 2);
  for (let k = 0; k < 80; k++) {
    const [p, q] = pick(R, [[3, 2], [5, 2], [5, 4], [1, 2], [3, 4]] as const);
    a = q * int(R, 1, 4); m = rat(p, q);
    const rr = c.id === 'car' ? rat(int(R, 36, 70), 2) : c.id === 'hike' ? rat(int(R, 4, 8), 2) : rat(int(R, 3, 18), 4);
    r = rr; b = qNum(qMul(rat(a), rr));
    if (qNum(qMul(rat(a), m)) % 1 === 0 && !qEq(r, m) && !qEq(r, qDiv(rat(1), m)) && !qEq(r, rat(1)) && places(qMul(qMul(rat(a), m), r)) <= 2) break;
  }
  const A0 = rat(a), B0 = qOf(b), A1 = qMul(A0, m), B1 = qMul(B0, m), inv = qDiv(rat(1), r);
  const askRate = R() < 0.5;
  if (askRate && c.money[1] && qEq(inv, r)) return betweenWithin(R, n);
  const rateTxt = c.money[1] ? `${money(r)} per ${c.u[0][0]}` : `${fmt(r)} ${c.per[0]}`;
  const opts = [
    { t: `${xLabel(m, false)} (no unit)`, kind: 'mult' },
    { t: rateTxt, kind: 'rate' },
    // asking for "the rate", the reverse rate (pounds per dollar) is a true rate too: then the reversed division gets the
    // first unit, which is wrong ("4/13 dollars per pound" for $3.25 per pound)
    { t: `${nice(inv)} ${c.per[askRate ? 0 : 1]}`, kind: 'rev' },
    { t: `${qLess(B1, B0) ? '−' : '+'}${c.money[1] ? money(qLess(B1, B0) ? qSub(B0, B1) : qSub(B1, B0)) : fmt(qLess(B1, B0) ? qSub(B0, B1) : qSub(B1, B0)) + ' ' + c.u[1][1]}`, kind: 'diff' },
  ];
  const ch = shuffle(R, opts);
  const right = ch.findIndex(o => o.kind === (askRate ? 'rate' : 'mult'));
  return {
    id: `betweenWithin-${n}`, family: 'betweenWithin',
    prompt: `${c.given(qt(c, 0, A0), qt(c, 1, B0))} At the same rate, ${A(qt(c, 0, A1))} go with ${B(qt(c, 1, B1))}. ${askRate ? `Which is the <b>rate</b> (within one pair)?` : `Which is the <b>multiplier</b> from the first pair to the second?`}`,
    board: `${tq(c, 0, A0)} : ${tq(c, 1, B0)} \\qquad ${tq(c, 0, A1)} : ${tq(c, 1, B1)}`, input: 'choice', choices: ch.map(o => o.t), answer: { kind: 'choice', i: right },
    solution: [`Between the pairs: ${hv(A1)} ÷ ${hv(A0)} = ${fmt(m)}, and ${hv(B1)} ÷ ${hv(B0)} = ${fmt(m)}. A multiplier has no unit.`, `Within a pair: ${hv(B0)} ÷ ${hv(A0)} = ${fmt(r)}: that is ${rateTxt}, a rate with a unit.`],
    check: x => {
      if (x.kind !== 'choice') return { ok: false, say: 'Pick one.' };
      const o = ch[x.i]!;
      if (x.i === right) return { ok: true, say: askRate ? `Yes: within a pair, ${hv(B0)} ÷ ${hv(A0)} = ${fmt(r)}, with a unit.` : `Yes: ${hv(A1)} ÷ ${hv(A0)} = ${fmt(m)}, and it has no unit.` };
      if (o.kind === 'mult' || o.kind === 'rate') return { ok: false, mc: MC.betweenWithin, say: askRate ? `${fmt(m)} is the multiplier BETWEEN the pairs. The rate is WITHIN one pair: ${hv(B0)} ÷ ${hv(A0)}.` : `That is the rate within one pair. The multiplier goes from one pair to the other: ${hv(A1)} ÷ ${hv(A0)}.` };
      if (o.kind === 'rev') return { ok: false, mc: MC.reversed, say: askRate ? `${nice(inv)} is ${hv(A0)} ÷ ${hv(B0)}: the division turned around. ${c.per[0]}: ${hv(B0)} ÷ ${hv(A0)} = ${fmt(r)}.` : `That is ${c.per[1]}: the division turned around.` };
      return { ok: false, mc: MC.difference, say: 'That is a difference. Ratios and rates come from dividing, not subtracting.' };
    },
  };
};

// ---------- 6 through the unit rate (a terminating decimal) ----------
const unitRate: Gen = (R, n, sg) => {
  const c = pick(R, [CTX.cherries!, CTX.car!, CTX.chain!]);
  let a = 4, ta = 7;
  for (let k = 0; k < 60; k++) { a = int(R, 3, 8); ta = int(R, 2, 12); if (ta !== a && ta % a !== 0 && a % ta !== 0 && gcd(a, ta) === 1) break; }
  const r = c.id === 'car' ? rat(int(R, 37, 73), 2) : c.id === 'cherries' ? rat(int(R, 23, 79), 20) : rat(int(R, 1, 11), 4);
  const A0 = rat(a), B0 = qMul(A0, r), T = rat(ta), ans = qMul(T, r);
  const P = mvParts({ c, a: A0, b: B0, t: T, missBot: true });
  const rateTxt = c.money[1] ? `${money(r)} per ${c.u[0][0]}` : `${fmt(r)} ${c.per[0]}`;
  return {
    id: `unitRate-${n}`, family: sg === 'choose-method' ? 'mixed' : 'unitRate', prompt: P.text, board: P.board, input: 'num', unit: P.unit, answer: { kind: 'num', v: qNum(ans) },
    picture: pic(c, A0, B0, T, null, { unit: true, pieces: ta <= 14 && a <= 14 ? { cut: a, count: ta } : null, within: [{ at: 'unit', label: `×${fmt(r)}` }], fillText: c.money[1] ? money(ans) : undefined }),
    solution: [`The rate for one: ${qt(c, 1, B0)} ÷ ${a} = ${rateTxt}.`, `${ta} × ${fmt(r)} = <b class="s">${c.money[1] ? money(ans) : fmt(ans)}</b>.`, `Check the size: ${ta} is ${ta > a ? 'more' : 'less'} than ${a}, so the answer is ${ta > a ? 'more' : 'less'} than ${qt(c, 1, B0)}.`],
    check: checkMissing({ k0: A0, k1: T, u0: B0, ans, right: `Yes: ${rateTxt}, times ${ta}.` }),
  };
};

// ---------- 7 a building-block row (common factor; the unit rate repeats) ----------
function blockNums(R: () => number) {
  for (let k = 0; k < 200; k++) {
    const c = pick(R, [3, 6, 7] as const), i = int(R, 2, 5), j = int(R, 2, 5);
    if (i === j || gcd(i, j) !== 1 || c * i > 30 || c * j > 35) continue;
    const kk = int(R, 2, 9), b = i * kk;
    if (terminates(rat(kk, c))) continue;
    return { c, i, j, a: c * i, ta: c * j, b, block: kk };
  }
  return { c: 3, i: 2, j: 5, a: 6, ta: 15, b: 14, block: 7 };
}
const blockRow: Gen = (R, n, sg) => {
  const N = blockNums(R);
  const c = pick(R, [CTX.cherries!, CTX.pancakes!, CTX.chain!]);
  const A0 = rat(N.a), B0 = rat(N.b), T = rat(N.ta), ans = rat(N.j * N.block);
  const P = mvParts({ c, a: A0, b: B0, t: T, missBot: true });
  return {
    id: `blockRow-${n}`, family: sg === 'choose-method' ? 'mixed' : 'blockRow', prompt: P.text, board: P.board, input: 'num', unit: P.unit, answer: { kind: 'num', v: qNum(ans) },
    picture: pic(c, A0, B0, T, null, { pieces: { cut: N.i, count: N.j }, arcs: [{ from: 'given', to: 'piece', label: `÷${N.i}` }, { from: 'piece', to: 'target', label: `×${N.j}` }] }),
    solution: [`The rate for one is ${fr(N.b, N.a)} = ${longDiv(rateOf(A0, B0), 3)}…: not friendly.`, `Both ${N.a} and ${N.ta} are multiples of ${N.c}. A row for ${N.c}: ÷ ${N.i} on both gives ${N.c} → ${qt(c, 1, rat(N.block))}.`, `Then × ${N.j} on both: ${N.ta} → <b>${qt(c, 1, ans)}</b>.`],
    check: checkMissing({ k0: A0, k1: T, u0: B0, ans, right: `Yes: through the row for ${N.c}, exactly ${qt(c, 1, ans)}.` }),
  };
};
const pickBlock: Gen = (R, n) => {
  const N = blockNums(R);
  const c = pick(R, [CTX.cherries!, CTX.pancakes!, CTX.chain!]);
  const unitW = c.u[0];
  const others = [2, 4, 5, 6, 7, 9, 10].filter(d => d !== N.c && d < Math.max(N.a, N.ta) && ((N.a % d === 0) !== (N.ta % d === 0)));
  const d = others.length ? pick(R, others) : N.c + 1;
  const r = rateOf(rat(N.a), rat(N.b));
  const opts = [
    { t: `${N.c} ${unitW[1]}: both ${N.a} and ${N.ta} are multiples of ${N.c}`, ok: true, mc: undefined as string | undefined },
    { t: `1 ${unitW[0]}: always go through one`, ok: false, mc: MC.habit },
    { t: `${d} ${unitW[1]}`, ok: false, mc: undefined },
  ];
  const ch = shuffle(R, opts);
  return {
    id: `pickBlock-${n}`, family: 'pickBlock',
    prompt: `${c.given(qt(c, 0, rat(N.a)), qt(c, 1, rat(N.b)))} You need the amount for ${A(qt(c, 0, rat(N.ta)))}. Which row is the best stepping stone?`,
    board: `${N.a} \\to\\ ? \\to ${N.ta}`, input: 'choice', choices: ch.map(o => o.t), answer: { kind: 'choice', i: ch.findIndex(o => o.ok) },
    solution: [`The rate for one is ${fr(N.b, N.a)} = ${longDiv(r, 3)}…, a repeating decimal.`, `${N.c} divides both ${N.a} and ${N.ta}: ÷ ${N.i} gets to ${N.c}, × ${N.j} gets to ${N.ta}. Whole numbers all the way.`],
    check: x => {
      if (x.kind !== 'choice') return { ok: false, say: 'Pick one.' };
      const o = ch[x.i]!;
      if (o.ok) return { ok: true, say: `Yes: ${N.c} fits both, and every number stays whole.` };
      if (o.mc) return { ok: false, mc: o.mc, say: `Going through one works, but here it gives ${longDiv(r, 3)}…, a repeating decimal. Pick the route from the numbers: ${N.c} divides both.` };
      return { ok: false, say: `${d} does not divide both ${N.a} and ${N.ta}, so one of the steps is not whole.` };
    },
  };
};

// ---------- 8 keep the multiplier exact ----------
const exactFrac: Gen = (R, n, sg) => {
  const c = pick(R, [CTX.pancakes!, CTX.chain!]);
  let a = 7, ta = 12, b = 5;
  for (let k = 0; k < 100; k++) { a = int(R, 3, 12); ta = int(R, 2, 14); b = int(R, 2, 15); if (ta !== a && gcd(a, ta) === 1 && (b * ta) % a !== 0 && !terminates(rat(b * ta, a)) && b !== a) break; }
  const A0 = rat(a), B0 = rat(b), T = rat(ta), ans = rat(b * ta, a);
  const P = mvParts({ c, a: A0, b: B0, t: T, missBot: true });
  const base = checkMissing({ k0: A0, k1: T, u0: B0, ans });
  return {
    id: `exactFrac-${n}`, family: sg === 'choose-method' ? 'mixed' : 'exactFrac', prompt: `${P.text} Give the <b>exact</b> answer (a fraction or a mixed number).`, board: P.board,
    input: 'frac', unit: P.unit, answer: fracAns(ans),
    picture: pic(c, A0, B0, T, null, { pieces: a <= 14 && ta <= 14 ? { cut: a, count: ta } : null, arcs: [{ from: 'given', to: 'target', label: xLabel(rat(ta, a)) }], fillText: fmtMixed(ans) }),
    solution: [`No friendly route: ${a} and ${ta} share no factor, and ${b} ÷ ${a} repeats.`, `Keep the multiplier as a fraction: ${ta} ÷ ${a} = ${fr(ta, a)}.`, `${b} × ${fr(ta, a)} = ${fr(b * ta, a)} = <b class="s">${hv(ans)}</b>.`],
    check: r => {
      const x = valueOf(r as never);
      if (x && !qEq(x, ans) && near(x, ans, 0.051)) return { ok: false, say: `Close, but that is rounded. The question wants the exact amount: ${fr(b * ta, a)}.` };
      return base(r);
    },
  };
};

// ---------- 9 long division one digit past the stated place ----------
const longDivF: Gen = (R, n) => {
  const q = pick(R, [3, 6, 7, 9, 11, 12, 7, 6, 8]);
  let p = 20;
  for (let k = 0; k < 40; k++) { p = int(R, 10, 300); if (p % q !== 0) break; }
  const v = rat(p, q), cents = R() < 0.5, dp = cents ? 3 : 2;
  const ansS = longDiv(v, dp), ans = Number(ansS);
  const w = Math.floor(p / q), rem = p % q;
  return {
    id: `longDiv-${n}`, family: 'longDiv',
    prompt: `To round ${fr(p, q)} to the nearest ${cents ? 'hundredth (a cent)' : 'tenth'}, you need one more digit. Use long division: write ${p} ÷ ${q} to the <b>${cents ? 'thousandths' : 'hundredths'}</b> place, without rounding.`,
    board: `${p} \\div ${q}`, input: 'num', answer: { kind: 'num', v: ans },
    solution: [`${p} ÷ ${q} = ${w} with ${rem} left over.`, `Bring down zeros: ${rem}0 ÷ ${q}, and so on, until there are ${dp} digits after the point.`, `${p} ÷ ${q} = <b class="s">${ansS}</b>${terminates(v) && places(v) <= dp ? '' : '…'}`],
    check: r => {
      if (r.kind !== 'num' || !Number.isFinite(r.v)) return { ok: false, say: 'Type a decimal.' };
      if (Math.abs(r.v - ans) < 1e-9) return { ok: true, say: `Yes: ${ansS}${terminates(v) && places(v) <= dp ? '' : '…'}` };
      if (Math.abs(r.v - Number(`${w}.${rem}`)) < 1e-9) return { ok: false, mc: MC.remainder, say: `${w}.${rem} writes the remainder after the point. The remainder ${rem} still has to be divided by ${q}.` };
      if (Math.abs(r.v - qNum(roundQ(v, dp))) < 1e-9) return { ok: false, say: 'That last digit is rounded. Here, write the digits the division gives; round later, in one step.' };
      return { ok: false, say: `Keep dividing: after ${w}, bring down a zero and divide ${rem}0 by ${q}.` };
    },
  };
};

// ---------- 10 round once, at the end ----------
const roundEnd: Gen = (R, n) => {
  const moneyCase = R() < 0.6;
  const c = moneyCase ? CTX.cherries! : pick(R, [CTX.pancakes!, CTX.chain!]);
  const dp = moneyCase ? 2 : 1;
  for (let k = 0; k < 400; k++) {
    const a = int(R, 3, 12), ta = int(R, 2, 15), b = moneyCase ? int(R, 8, 40) : int(R, 2, 15);
    if (ta === a || gcd(a, ta) !== 1 || (moneyCase && b % a === 0)) continue;
    const exact = rat(b * ta, a), want = roundQ(exact, dp), early = qMul(roundQ(rat(b, a), dp), rat(ta));
    if ((terminates(exact) && places(exact) <= dp) || tie(exact, dp)) continue;
    if (qEq(early, want)) continue;
    const A0 = rat(a), B0 = rat(b), T = rat(ta);
    const P = mvParts({ c, a: A0, b: B0, t: T, missBot: true });
    const where = moneyCase ? 'to the nearest cent' : 'to the nearest tenth';
    return {
      id: `roundEnd-${n}`, family: 'roundEnd', prompt: `${P.text} Round ${where}.`, board: `${P.board} \\quad \\text{(nearest ${moneyCase ? 'cent' : 'tenth'})}`,
      input: 'num', unit: P.unit, answer: { kind: 'num', v: qNum(want) },
      picture: pic(c, A0, B0, T, null, { arcs: [{ from: 'given', to: 'target', label: xLabel(rat(ta, a)) }], fillText: moneyCase ? money(want) : `≈ ${fmt(want)}` }),
      solution: [`Exact first: ${b} × ${fr(ta, a)} = ${fr(b * ta, a)}.`, `Long division to one digit past the ${moneyCase ? 'cents' : 'tenths'}: ${longDiv(exact, dp + 1)}…`, `Round once: <b class="s">${moneyCase ? money(want) : fmt(want)}</b>. (Rounding ${fr(b, a)} first would give ${fmt(early)}.)`],
      check: checkMissing({ k0: A0, k1: T, u0: B0, ans: exact, roundTo: dp, right: `Yes: exact first, then one rounding: ${moneyCase ? money(want) : fmt(want)}.` }),
    };
  }
  throw new Error('roundEnd: no numbers');
};

// ---------- 11 decimals in both columns ----------
const decTable: Gen = (R, n, sg) => {
  const c = pick(R, [CTX.cherries!, CTX.chain!]);
  for (let k = 0; k < 400; k++) {
    const a10 = int(R, 3, 24), t10 = int(R, 2, 24), b = c.money[1] ? rat(int(R, 30, 180) * 5, 100) : rat(int(R, 5, 60), 10);
    if (t10 === a10 || a10 % 10 === 0 || t10 % 10 === 0) continue;
    const A0 = rat(a10, 10), T = rat(t10, 10), exact = missing(A0, b, T);
    const dp = 2, want = roundQ(exact, dp);
    if (qEq(want, b) || qEq(exact, qMul(b, T)) || tie(exact, dp)) continue;
    const P = mvParts({ c, a: A0, b, t: T, missBot: true });
    const rounds = !(terminates(exact) && places(exact) <= 2);
    return {
      id: `decTable-${n}`, family: sg === 'choose-method' ? 'mixed' : 'decTable', prompt: `${P.text}${rounds ? ` Round to the nearest ${c.money[1] ? 'cent' : 'hundredth'}.` : ''}`, board: P.board,
      input: 'num', unit: P.unit, answer: { kind: 'num', v: qNum(want) },
      picture: pic(c, A0, b, T, null, { pieces: { cut: a10, count: t10 }, arcs: [{ from: 'given', to: 'target', label: xLabel(rat(t10, a10)) }], fillText: c.money[1] ? money(want) : (rounds ? '≈ ' : '') + fmt(want) }),
      solution: [`The multiplier: ${fmt(T)} ÷ ${fmt(A0)} = ${fr(t10, a10)} (pieces of 0.1: ${a10} of them, then ${t10}).`, `${fmt(b)} × ${fr(t10, a10)} = ${rounds ? longDiv(exact, 3) + '…' : fmt(exact)}.`, `${rounds ? `Round once: <b class="s">${c.money[1] ? money(want) : fmt(want)}</b>.` : `<b>${c.money[1] ? money(want) : fmt(want)}</b>.`}`],
      check: checkMissing({ k0: A0, k1: T, u0: b, ans: exact, roundTo: 2 }),
    };
  }
  throw new Error('decTable: no numbers');
};

// ---------- 12 a unit rate from fractions ----------
const FRS: readonly Q[] = [rat(1, 2), rat(1, 3), rat(2, 3), rat(1, 4), rat(3, 4), rat(2, 5), rat(3, 5), rat(4, 5), rat(5, 6), rat(3, 8), rat(5, 8), rat(3, 2), rat(5, 2), rat(5, 4)];
const complexRate: Gen = (R, n) => {
  let d = rat(3, 4), t = rat(2, 5);
  const kind = pick(R, ['walk', 'batch', 'paint'] as const);
  for (let k = 0; k < 60; k++) { d = pick(R, FRS); t = pick(R, FRS); if (!qEq(d, t) && (kind === 'walk' || t.p < t.q)) break; }
  if (kind !== 'walk' && t.p >= t.q) t = rat(2, 3);
  const hv = hf;
  const ans = qDiv(d, t);
  const S = {
    walk: { prompt: `Lena walks ${A(hv(d) + ' mile' + (qLess(rat(1), d) ? 's' : ''))} in ${B(hv(t) + ' hour' + (qLess(rat(1), t) ? 's' : ''))}. How fast is that, in <b>miles per hour</b>?`, unit: 'miles per hour', per: 'miles per hour', nm: ['miles', 'hours'] as [string, string] },
    batch: { prompt: `${A(hv(d) + ' cup' + (qLess(rat(1), d) ? 's' : ''))} of sugar ${qLess(rat(1), d) ? 'make' : 'makes'} ${B(hv(t) + ' of a batch')} of cookies. How much sugar goes into <b>one whole batch</b>?`, unit: 'cups', per: 'cups per batch', nm: ['cups', 'batches'] as [string, string] },
    paint: { prompt: `${A(hv(d) + ' gallon' + (qLess(rat(1), d) ? 's' : ''))} of paint ${qLess(rat(1), d) ? 'cover' : 'covers'} ${B(hv(t) + ' of a wall')}. How much paint covers <b>one whole wall</b>?`, unit: 'gallons', per: 'gallons per wall', nm: ['gallons', 'walls'] as [string, string] },
  }[kind];
  return {
    id: `complexRate-${n}`, family: 'complexRate', prompt: `${S.prompt} <span class="dim">(Any equivalent form.)</span>`,
    board: `${texF(d)} \\div ${texF(t)}`, input: 'frac', unit: S.unit, answer: fracAns(ans),
    solution: [`“Per one” of the ${S.nm[1]}: divide the ${S.nm[0]} by the ${S.nm[1]}.`, `${fq(d)} ÷ ${fq(t)} = ${fq(d)} × ${fq(qDiv(rat(1), t))} = <b class="s">${hv(ans)}</b> ${S.per}.`],
    check: r => {
      const x = valueOf(r as never);
      if (!x) return { ok: false, say: 'Type a fraction, a mixed number or a decimal.' };
      if (qEq(x, ans)) return { ok: true, say: `Yes: ${fq(d)} ÷ ${fq(t)} = ${hv(ans)} ${S.per}.` };
      if (qEq(x, qDiv(t, d))) return { ok: false, mc: MC.reversed, say: `That is ${S.nm[1]} per ${S.nm[0].replace(/s$/, '')}: the division turned around. For ${S.per}, divide the ${S.nm[0]} by the ${S.nm[1]}.` };
      if (qEq(x, d)) return { ok: false, mc: MC.otherPart, say: `${hv(d)} goes with only ${hv(t)}, not with one whole. Divide by ${fq(t)} to get the amount for one.` };
      if (qEq(x, qMul(d, t))) return { ok: false, say: `Multiplying gives ${S.nm[0]} × ${S.nm[1]}, which means nothing here. “Per one” means divide.` };
      return { ok: false, say: `Divide: ${fq(d)} ÷ ${fq(t)}. Multiply by the reciprocal of ${fq(t)}.` };
    },
  };
};

// ---------- 13 y = kx ----------
const KS: readonly Q[] = [rat(3, 2), rat(5, 2), rat(5, 4), rat(3, 4), rat(2, 5), rat(7, 2), rat(9, 4), rat(1, 4), rat(7, 4), rat(13, 4)];
const writeK: Gen = (R, n) => {
  const c = pick(R, [CTX.cherries!, CTX.car!, CTX.chain!]);
  const k0 = pick(R, KS);
  let k = k0, x0 = rat(k0.q * int(R, 1, 4));
  if (c.id === 'car') { k = rat(int(R, 20, 40)); x0 = rat(int(R, 2, 9)); }
  const y0 = qMul(x0, k), rev = R() < 0.4;
  const xName = rev ? (c.money[1] ? 'the cost in dollars' : `the ${c.u[1][1]}`) : `the ${c.u[0][1]}`;
  const yName = rev ? `the ${c.u[0][1]}` : (c.money[1] ? 'the cost in dollars' : `the ${c.u[1][1]}`);
  const K = rev ? qDiv(rat(1), k) : k;
  const ks = nice;
  const dY = rev ? qSub(x0, y0) : qSub(y0, x0);
  const X = '<i>x</i>', Y = '<i>y</i>';
  const opts = [
    { t: `${Y} = ${ks(K)}${X}`, ok: true, mc: undefined as string | undefined },
    { t: `${Y} = ${ks(qDiv(rat(1), K))}${X}`, ok: false, mc: MC.inverted },
    { t: `${Y} = ${X} ${dY.p >= 0 ? '+' : '−'} ${fmt(dY.p >= 0 ? dY : qSub(rat(0), dY))}`, ok: false, mc: MC.additive },
  ];
  const ch = shuffle(R, opts);
  return {
    id: `writeK-${n}`, family: 'writeK',
    prompt: `${c.given(qt(c, 0, x0), qt(c, 1, y0))} Let ${X} be ${xName} and ${Y} be ${yName}. Which equation fits?`,
    board: `${tq(c, 0, x0)} : ${tq(c, 1, y0)}`, input: 'choice', choices: ch.map(o => o.t), answer: { kind: 'choice', i: ch.findIndex(o => o.ok) },
    solution: [`k = ${Y} ÷ ${X} for one pair: ${rev ? `${hv(x0)} ÷ ${hv(y0)}` : `${hv(y0)} ÷ ${hv(x0)}`} = ${ks(K)}.`, `So <b>${Y} = ${ks(K)}${X}</b>. Check with the pair: ${ks(K)} × ${rev ? hv(y0) : hv(x0)} = ${rev ? hv(x0) : hv(y0)}.`],
    check: r => {
      if (r.kind !== 'choice') return { ok: false, say: 'Pick one.' };
      const o = ch[r.i]!;
      if (o.ok) return { ok: true, say: `Yes: k = ${Y} ÷ ${X} = ${ks(K)}.` };
      return o.mc === MC.inverted ? { ok: false, mc: o.mc, say: `That k is ${X} ÷ ${Y}. Read which letter is which: k = ${Y} ÷ ${X}.` }
        : { ok: false, mc: o.mc, say: `Adding a fixed amount is not proportional. In ${Y} = k${X}, k = ${Y} ÷ ${X}.` };
    },
  };
};
const useK: Gen = (R, n) => {
  const c = pick(R, [CTX.cherries!, CTX.chain!]);
  const k = pick(R, [rat(3, 2), rat(5, 2), rat(3, 4), rat(5, 4), rat(7, 2), rat(2, 5), rat(9, 4)]);
  const findX = R() < 0.55;
  const x = rat(k.q * int(R, 2, 12)), y = qMul(x, k);
  const X = '<i>x</i>', Y = '<i>y</i>';
  const xs = c.u[0][1], ys = c.money[1] ? 'the cost in dollars' : c.u[1][1];
  const ans = findX ? x : y;
  return {
    id: `useK-${n}`, family: 'useK',
    prompt: `${c.id === 'cherries' ? 'Cherries' : 'A chain'}: ${Y} = ${fmt(k)}${X}, where ${X} is the ${xs} and ${Y} is ${ys}. ${findX ? `Find ${X} when ${Y} = ${fmt(y)}.` : `Find ${Y} when ${X} = ${fmt(x)}.`}`,
    board: `y = ${fmt(k)}x,\\quad ${findX ? `y = ${fmt(y)}` : `x = ${fmt(x)}`}`, input: 'num', unit: findX ? xs : (c.money[1] ? 'dollars' : c.u[1][1]), answer: { kind: 'num', v: qNum(ans) },
    solution: findX ? [`${fmt(y)} = ${fmt(k)}${X}.`, `Undo × ${fmt(k)}: ${X} = ${fmt(y)} ÷ ${fmt(k)} = <b class="s">${fmt(x)}</b>.`] : [`Put ${X} = ${fmt(x)} into ${Y} = ${fmt(k)}${X}.`, `${Y} = ${fmt(k)} × ${fmt(x)} = <b class="s">${fmt(y)}</b>.`],
    check: r => {
      if (r.kind !== 'num' || !Number.isFinite(r.v)) return { ok: false, say: 'Type a number.' };
      const v = qOf(r.v);
      if (qEq(v, ans)) return { ok: true, say: findX ? `Yes: ${fmt(y)} ÷ ${fmt(k)} = ${fmt(x)}.` : `Yes: ${fmt(k)} × ${fmt(x)} = ${fmt(y)}.` };
      if (findX && near(v, qMul(y, k), 0.001)) return { ok: false, mc: MC.inverted, say: `That multiplies by ${fmt(k)} again. ${fmt(k)}${X} = ${fmt(y)}: undo the multiply with a divide.` };
      if (!findX && near(v, qDiv(x, k), 0.001)) return { ok: false, mc: MC.inverted, say: `k multiplies ${X}: ${Y} = ${fmt(k)} × ${fmt(x)}.` };
      return { ok: false, say: findX ? `Solve ${fmt(k)}${X} = ${fmt(y)}: divide both sides by ${fmt(k)}.` : `Substitute: ${fmt(k)} × ${fmt(x)}.` };
    },
  };
};

// ---------- 14 proportional or not ----------
const isProp: Gen = (R, n) => {
  const kind = pick(R, ['prop', 'fee', 'add', 'const', 'prop', 'fee'] as const);
  const CH = [
    'Yes: double one amount, and the other doubles too.',
    'No: there is a fixed part, so the second ÷ the first changes.',
    'No: the difference stays the same, not the ratio.',
    'No: the answer does not change with that number.',
  ];
  let prompt = '', board = '', sol: string[] = [];
  const x = int(R, 2, 6);
  if (kind === 'prop') {
    const r = pick(R, [rat(5, 2), rat(3, 2), rat(9, 4), rat(7, 2), rat(3)]);
    prompt = `Peaches cost ${money(r)} a pound, nothing else. ${x} pounds cost ${money(qMul(rat(x), r))}. Ben says ${2 * x} pounds cost ${money(qMul(rat(2 * x), r))}. Can a ratio be used here?`;
    board = `${x} : ${fmt(qMul(rat(x), r))} \\quad ${2 * x} : ${fmt(qMul(rat(2 * x), r))}`;
    sol = [`Cost ÷ pounds = ${money(r)} for every pair, and 0 pounds cost $0.`, 'So it is proportional: double the pounds, double the cost.'];
  } else if (kind === 'fee') {
    const f = int(R, 2, 9), r = int(R, 3, 9);
    prompt = `A fabric store charges $${f} to cut, plus $${r} per yard. ${x} yards cost $${f + r * x}. Ben says ${2 * x} yards cost $${2 * (f + r * x)}. Can a ratio be used here?`;
    board = `${x} : ${f + r * x} \\quad ${2 * x} : \\,?`;
    sol = [`${f + r * x} ÷ ${x} and ${f + 2 * r * x} ÷ ${2 * x} are not equal: the $${f} fee is paid once.`, `So ${2 * x} yards cost $${f} + $${r} × ${2 * x} = $${f + 2 * r * x}, not $${2 * (f + r * x)}.`];
  } else if (kind === 'add') {
    const d = int(R, 2, 6), y = x + int(R, 3, 8);
    prompt = `Ana is ${d} years older than her brother. When he is ${y}, she is ${y + d}. Ben says when he is ${2 * y}, she will be ${2 * (y + d)}. Can a ratio be used here?`;
    board = `${y} : ${y + d} \\quad ${2 * y} : \\,?`;
    sol = [`The DIFFERENCE stays ${d} years; the ratio of the ages changes.`, `When he is ${2 * y}, she is ${2 * y + d}.`];
  } else {
    const p = int(R, 3, 6), t = int(R, 3, 5);
    prompt = `A band of ${p} musicians plays a song in ${t} minutes. Ben says ${2 * p} musicians play the same song in ${2 * t} minutes. Can a ratio be used here?`;
    board = `${p} : ${t} \\quad ${2 * p} : \\,?`;
    sol = ['More musicians do not make the song longer or shorter.', `The song still takes ${t} minutes.`];
  }
  const right = { prop: 0, fee: 1, add: 2, const: 3 }[kind];
  return {
    id: `isProp-${n}`, family: 'isProp', prompt, board, input: 'choice', choices: CH, answer: { kind: 'choice', i: right }, solution: sol,
    check: r => {
      if (r.kind !== 'choice') return { ok: false, say: 'Pick one.' };
      if (r.i === right) return { ok: true, say: kind === 'prop' ? 'Yes: the second ÷ the first is the same for every pair.' : 'Right: a ratio method does not fit this situation.' };
      if (r.i === 0) return { ok: false, mc: MC.nonProp, say: `Test it before you scale: ${sol[0]}` };
      return { ok: false, say: kind === 'prop' ? 'Test it: the cost ÷ the pounds is the same for every pair, and there is no fee. It is proportional.' : `Look again at what stays the same: ${sol[0]}` };
    },
  };
};

// ---------- 15 choose a method / mixed problems ----------
const METHODS = ['Multiply both by a whole number', 'Go through the rate for one', 'Go through a building-block row', 'Keep an exact fraction multiplier'];
const chooseMethod: Gen = (R, n) => {
  const kind = int(R, 0, 3);
  const c = kind === 3 ? pick(R, [CTX.pancakes!, CTX.chain!]) : pick(R, [CTX.cherries!, CTX.pancakes!, CTX.chain!]);
  const fits = (a: number, b: number, ta: number): boolean => {
    if (a === ta || a === b) return false;
    const rTerm = terminates(rat(b, a)) && places(rat(b, a)) <= 2, g = gcd(a, ta), mult = ta % a === 0;
    return kind === 0 ? mult && !rTerm && ta <= 4 * a
      : kind === 1 ? rTerm && g === 1 && !mult && a % ta !== 0 && a > 2
        // a rate that ends (2.875) is a fine rate for one: the building block and the exact fraction need a repeating one
        : kind === 2 ? !terminates(rat(b, a)) && !mult && a % ta !== 0 && g > 1 && g < Math.min(a, ta)
          : !terminates(rat(b, a)) && g === 1 && !mult && a % ta !== 0 && a > 2;
  };
  let [a, b, ta] = ([[3, 7, 12], [4, 10, 7], [6, 14, 15], [7, 5, 12]] as const)[kind as 0 | 1 | 2 | 3] as readonly number[] as [number, number, number];
  for (let k = 0; k < 400; k++) {
    const A1 = int(R, 2, 12), T1 = int(R, 2, 30), B1 = int(R, 2, 30);
    if (fits(A1, B1, T1)) { a = A1; b = B1; ta = T1; break; }
  }
  const r = rat(b, a), g = gcd(a, ta);
  const why = [
    `${ta} = ${ta / a} × ${a}: multiply both by ${ta / a}.`,
    `The rate for one is a friendly decimal: ${fmt(r)}. Then × ${ta}.`,
    `${a} and ${ta} share the factor ${g}, and the rate for one repeats: go through the row for ${g}.`,
    `No shared factor, and ${b} ÷ ${a} repeats: keep ${fr(ta, a)} exact.`,
  ];
  return {
    id: `chooseMethod-${n}`, family: 'chooseMethod',
    prompt: `${c.given(qt(c, 0, rat(a)), qt(c, 1, rat(b)))} ${c.askBot(qt(c, 0, rat(ta)))} Which way is the most efficient?`,
    board: pairBoard(c, rat(a), rat(b), rat(ta), null), input: 'choice', choices: METHODS, answer: { kind: 'choice', i: kind },
    solution: [why[kind]!, `Answer: ${qt(c, 1, missing(a, b, ta))}${terminates(missing(a, b, ta)) ? '' : ` = ${hv(missing(a, b, ta))}`}.`],
    check: x => {
      if (x.kind !== 'choice') return { ok: false, say: 'Pick one.' };
      if (x.i === kind) return { ok: true, say: `Yes. ${why[kind]}` };
      return { ok: false, mc: MC.habit, say: `Look at the numbers first. ${why[kind]}` };
    },
  };
};
const mixed: Gen = (R, n) => {
  const g = pick(R, [scaleUp, unitRate, blockRow, exactFrac, decTable]);
  const it = g(R, n, 'choose-method');
  return { ...it, id: `mixed-${n}`, family: 'mixed' };
};

// ---------- 16 check the units ----------
const UNIT_PAIRS: readonly [number, number][] = [[4, 10], [8, 10], [4, 5], [5, 2], [8, 2], [5, 8], [2, 5], [10, 4], [20, 8], [16, 10], [25, 10], [8, 20], [5, 4], [4, 1], [2, 8]];
/** hours : miles at a walking pace (1.5 to 5 miles per hour) */
const HIKE_PAIRS: readonly [number, number][] = [[4, 10], [2, 5], [2, 8], [4, 14], [5, 15], [2, 7], [4, 18], [5, 20], [8, 20], [4, 6]];
const unitCheck: Gen = (R, n) => {
  const c = pick(R, [CTX.cherries!, CTX.car!, CTX.hike!, CTX.chain!]);
  let [a, b] = pick(R, c.id === 'hike' ? HIKE_PAIRS : UNIT_PAIRS);
  if (c.id === 'car') { a = int(R, 2, 8); b = a * int(R, 20, 40); }
  const A0 = rat(a), B0 = rat(b);
  const askTopPer = R() < 0.5;   // the question asks for first-per-second
  const asked = askTopPer ? c.per[1] : c.per[0];
  const swapped = R() < 0.55;    // the kid's division is the wrong way but labelled with the asked unit
  // the division the kid did: (n ÷ d)
  const doTop = askTopPer !== swapped;
  const nV = doTop ? A0 : B0, dV = doTop ? B0 : A0, v = qDiv(nV, dV);
  const vRight = askTopPer ? qDiv(A0, B0) : qDiv(B0, A0);
  const unitOf = (top: boolean) => (top ? c.per[1] : c.per[0]);
  const nm = (side: 0 | 1, val: Q) => qt(c, side, val);
  const opts = [
    { t: `Right: ${nm(doTop ? 0 : 1, nV)} ÷ ${nm(doTop ? 1 : 0, dV)} gives ${unitOf(doTop)}, the unit asked for.`, ok: !swapped, mc: swapped ? MC.labelRepair as string : undefined },
    { t: `Wrong: ${fmt(nV)} ÷ ${fmt(dV)} gives ${unitOf(doTop)}. It should be ${fmt(dV)} ÷ ${fmt(nV)} = ${nice(qDiv(dV, nV))} ${asked}.`, ok: swapped, mc: undefined as string | undefined },
    { t: `Right: ${nm(0, A0)} = ${nm(1, B0)}, so the unit can go either way.`, ok: false, mc: MC.rateEq as string | undefined },
  ];
  const ch = shuffle(R, opts);
  return {
    id: `unitCheck-${n}`, family: 'unitCheck',
    prompt: `${c.given(qt(c, 0, A0), qt(c, 1, B0))} The question asks for <b>${asked}</b>. Kai writes: ${fmt(nV)} ÷ ${fmt(dV)} = ${nice(v)} ${asked}. Is Kai's unit right?`,
    board: `${fmt(nV)} \\div ${fmt(dV)} = ${texQ(v)}`, input: 'choice', choices: ch.map(o => o.t), answer: { kind: 'choice', i: ch.findIndex(o => o.ok) },
    solution: ['For a rate “A per B”, divide the amount of A by the amount of B.', `So the answer is ${nice(vRight)} ${asked}.`],
    check: x => {
      if (x.kind !== 'choice') return { ok: false, say: 'Pick one.' };
      const o = ch[x.i]!;
      if (o.ok) return { ok: true, say: swapped ? `Yes: the label does not fix a division done the wrong way. ${nice(vRight)} ${asked}.` : 'Yes: the units in the division match the unit of the answer.' };
      if (o.mc === MC.rateEq) return { ok: false, mc: o.mc, say: `${nm(0, A0)} and ${nm(1, B0)} are not equal: they go together. A rate says how much of one for ONE of the other.` };
      if (o.mc === MC.labelRepair) return { ok: false, mc: o.mc, say: `Writing “${asked}” after the number does not make it so. ${fmt(nV)} ÷ ${fmt(dV)} gives ${unitOf(doTop)}.` };
      return { ok: false, say: `Kai's division matches the unit: ${fmt(nV)} ÷ ${fmt(dV)} gives ${unitOf(doTop)}.` };
    },
  };
};

// ---------- 17 different customary units (optional) ----------
const mixedUnits: Gen = (R, n) => {
  const kind = pick(R, ['oz', 'min', 'in'] as const);
  let prompt = '', unit = '', ans = rat(0), wrong = rat(0), sol: string[] = [], board = '';
  if (kind === 'oz') {
    const price = rat(int(R, 4, 12) * 80, 100), oz = pick(R, [4, 6, 8, 10, 12, 14, 18, 20, 24]);
    ans = qMul(price, rat(oz, 16)); wrong = qMul(price, rat(oz));
    prompt = `Cheese costs ${money(price)} per pound. Lee buys ${A(oz + ' ounces')}. (16 ounces = 1 pound.) What does Lee pay?`; unit = 'dollars';
    board = `${money(price).replace('$', '\\$')}\\text{ per lb},\\ ${oz}\\text{ oz}`;
    sol = [`Match the units first: ${oz} ounces = ${fr(oz, 16)} pound = ${fmt(rat(oz, 16))} lb.`, `${money(price)} × ${fmt(rat(oz, 16))} = <b class="s">${money(ans)}</b>.`];
  } else if (kind === 'min') {
    const mph = 6 * int(R, 1, 4), min = pick(R, [10, 15, 20, 30, 40, 45, 50]);
    ans = qMul(rat(mph), rat(min, 60)); wrong = rat(mph * min);
    prompt = `A cyclist rides ${mph} miles per hour. How far does she ride in ${A(min + ' minutes')}? (60 minutes = 1 hour.)`; unit = 'miles';
    board = `${mph}\\text{ mi per h},\\ ${min}\\text{ min}`;
    sol = [`Match the units first: ${min} minutes = ${fr(min, 60)} hour.`, `${mph} × ${fr(min, 60)} = <b class="s">${fmt(ans)}</b> miles.`];
  } else {
    const pf = rat(int(R, 2, 9) * 12, 100), inch = pick(R, [3, 6, 9, 18, 30]);
    ans = qMul(pf, rat(inch, 12)); wrong = qMul(pf, rat(inch));
    prompt = `Rope costs ${money(pf)} per foot. What do ${A(inch + ' inches')} cost? (12 inches = 1 foot.)`; unit = 'dollars';
    board = `${money(pf).replace('$', '\\$')}\\text{ per ft},\\ ${inch}\\text{ in}`;
    sol = [`Match the units first: ${inch} inches = ${fr(inch, 12)} foot.`, `${money(pf)} × ${fr(inch, 12)} = <b class="s">${money(ans)}</b>.`];
  }
  return {
    id: `mixedUnits-${n}`, family: 'mixedUnits', prompt, board, input: 'num', unit, answer: { kind: 'num', v: qNum(ans) }, solution: sol,
    check: r => {
      if (r.kind !== 'num' || !Number.isFinite(r.v)) return { ok: false, say: 'Type a number.' };
      const v = qOf(r.v);
      if (near(v, ans, 0.0001)) return { ok: true, say: 'Yes: same units first, then the rate.' };
      if (near(v, wrong, 0.0001)) return { ok: false, mc: MC.unconverted, say: `The rate is per ${kind === 'min' ? 'hour' : kind === 'oz' ? 'pound' : 'foot'}, but the amount is in ${kind === 'min' ? 'minutes' : kind === 'oz' ? 'ounces' : 'inches'}. Convert first.` };
      return { ok: false, say: sol[0]! };
    },
  };
};

// ---------- 18 check a constant ratio (exact) ----------
const ratioCheck: Gen = (R, n) => {
  const c = pick(R, [CTX.cherries!, CTX.pancakes!, CTX.chain!]);
  for (let k = 0; k < 400; k++) {
    const [p, q] = pick(R, [[3, 2], [5, 2], [3, 4], [2, 3], [5, 4], [4, 3]] as const);
    const a = q * int(R, 1, 4), b = int(R, 2, 24), ta = (a / q) * p;
    const A0 = rat(a), B0 = rat(b), T = rat(ta), right = missing(A0, B0, T), inv = qMul(B0, qDiv(A0, T)), add = qAdd(B0, qSub(T, A0));
    if (right.q !== 1 || inv.q !== 1 || add.p <= 0 || qEq(add, right) || qEq(inv, right) || b === a) continue;
    const kind = pick(R, ['right', 'add', 'inv', 'off'] as const);
    const claim = kind === 'right' ? right : kind === 'add' ? add : kind === 'inv' ? inv : qAdd(right, rat(pick(R, [1, 2, -1, 3])));
    if (claim.p <= 0 || (kind === 'off' && (qEq(claim, add) || qEq(claim, inv)))) continue;
    const ok = qEq(claim, right);
    const s = (v: Q) => qt(c, 1, v);
    const opts = [
      { t: `It checks: ${fmt(claim)} ÷ ${ta} = ${fmt(B0)} ÷ ${a}.`, ok, mc: undefined as string | undefined },
      { t: `It does not check: ${fmt(claim)} ÷ ${ta} ≠ ${fmt(B0)} ÷ ${a}.`, ok: !ok, mc: undefined as string | undefined },
      kind === 'add' ? { t: `It checks: both went ${qLess(T, A0) ? 'down' : 'up'} by ${fmt(qLess(T, A0) ? qSub(A0, T) : qSub(T, A0))}.`, ok: false, mc: MC.additive as string | undefined }
        : { t: `It checks: ${s(claim)} looks about the right size.`, ok: false, mc: MC.noSize as string | undefined },
    ];
    const ch = shuffle(R, opts);
    return {
      id: `ratioCheck-${n}`, family: 'ratioCheck',
      prompt: `${c.given(qt(c, 0, A0), qt(c, 1, B0))} Sam says ${A(qt(c, 0, T))} go with ${B(s(claim))}. Check Sam's pair.`,
      board: `${tq(c, 0, A0)} : ${tq(c, 1, B0)} \\quad ${tq(c, 0, T)} : ${tq(c, 1, claim)}`, input: 'choice', choices: ch.map(o => o.t), answer: { kind: 'choice', i: ch.findIndex(o => o.ok) },
      solution: [`${fmt(B0)} ÷ ${a} = ${hv(rateOf(A0, B0))} and ${fmt(claim)} ÷ ${ta} = ${hv(rateOf(T, claim))}.`, ok ? 'Equal quotients, in the same order: it checks.' : `Not equal, so the ratio is broken. The right value is ${s(right)}.`],
      check: x => {
        if (x.kind !== 'choice') return { ok: false, say: 'Pick one.' };
        const o = ch[x.i]!;
        if (o.ok) return { ok: true, say: ok ? 'Yes: the same quotient in both pairs.' : `Yes: the quotients differ. It should be ${s(right)}.` };
        if (o.mc === MC.additive) return { ok: false, mc: o.mc, say: 'Going up by the same amount keeps the difference, not the ratio. Divide to check.' };
        if (o.mc) return { ok: false, mc: o.mc, say: `Looking about right is not a check. Divide: ${fmt(claim)} ÷ ${ta} and ${fmt(B0)} ÷ ${a}.` };
        return { ok: false, say: `Divide both pairs: ${fmt(B0)} ÷ ${a} = ${hv(rateOf(A0, B0))}, ${fmt(claim)} ÷ ${ta} = ${hv(rateOf(T, claim))}.` };
      },
    };
  }
  throw new Error('ratioCheck: no numbers');
};

// ---------- 19 check a rounded answer ----------
const roundCheck: Gen = (R, n) => {
  const c = CTX.cherries!;
  for (let k = 0; k < 400; k++) {
    const dec = R() < 0.5;
    const a = dec ? rat(int(R, 6, 24), 10) : rat(int(R, 3, 12)), ta = dec ? rat(int(R, 3, 24), 10) : rat(int(R, 2, 15));
    const b = dec ? rat(int(R, 30, 160) * 5, 100) : rat(int(R, 8, 40));
    if (qEq(a, ta)) continue;
    const E = missing(a, b, ta);
    if ((terminates(E) && places(E) <= 2) || tie(E, 2)) continue;
    // Kim reports to the nearest cent, so an early-rounding claim is itself rounded to the cent ($0.891 is not "$0.89")
    const Rr = roundQ(E, 2), early = roundQ(qMul(roundQ(qDiv(b, a), 2), ta), 2), tr = truncQ(E, 2), tenth = roundQ(E, 1);
    const kind = pick(R, ['right', 'right', 'early', 'trunc', 'tenth'] as const);
    const claim = kind === 'right' ? Rr : kind === 'early' ? early : kind === 'trunc' ? tr : tenth;
    if (kind !== 'right' && qEq(claim, Rr)) continue;
    const ok = kind === 'right';
    const Et = `${longDiv(E, 3)}…`;
    const opts = ok ? [
      { t: `It checks: the exact cost is $${Et}, which rounds to ${money(claim)}.`, ok: true, mc: undefined as string | undefined },
      { t: `It does not check: ${money(claim)} ÷ ${fmt(ta)} is not exactly ${fmt(b)} ÷ ${fmt(a)}.`, ok: false, mc: MC.gapError as string | undefined },
      { t: `It does not check: the exact cost is $${Et}, which rounds to ${money(qAdd(claim, rat(1, 100)))}.`, ok: false, mc: undefined },
    ] : [
      { t: `It does not check: the exact cost is $${Et}, which rounds to ${money(Rr)}, not ${money(claim)}.`, ok: true, mc: undefined as string | undefined },
      { t: 'Close enough: the gap is just rounding.', ok: false, mc: MC.nearMiss as string | undefined },
      { t: `It checks: the exact cost is $${Et}, which rounds to ${money(claim)}.`, ok: false, mc: undefined },
    ];
    const ch = shuffle(R, opts);
    return {
      id: `roundCheck-${n}`, family: 'roundCheck',
      prompt: `${c.given(qt(c, 0, a), qt(c, 1, b))} Kim says ${A(qt(c, 0, ta))} cost ${B(money(claim))}, to the nearest cent. Check Kim's answer.`,
      board: `${pairBoard(c, a, b, ta, null)} \\quad \\text{(nearest cent)}`, input: 'choice', choices: ch.map(o => o.t), answer: { kind: 'choice', i: ch.findIndex(o => o.ok) },
      solution: [`Exact: ${fmt(b)} × ${fmt(ta)} ÷ ${fmt(a)} = ${Et}`, `Rounded once to the cent: ${money(Rr)}.`, ok ? `Kim's ${money(claim)} is right. Dividing a rounded answer back never gives the exact rate, and that is fine.` : `Kim's ${money(claim)} is ${kind === 'early' ? 'from rounding too early' : kind === 'trunc' ? 'cut off, not rounded' : 'rounded to the tenth, not the cent'}.`],
      check: x => {
        if (x.kind !== 'choice') return { ok: false, say: 'Pick one.' };
        const o = ch[x.i]!;
        if (o.ok) return { ok: true, say: ok ? 'Yes: check the exact value, then see if it rounds to the answer.' : `Yes: the right answer is ${money(Rr)}.` };
        if (o.mc === MC.gapError) return { ok: false, mc: o.mc, say: `A rounded answer never divides back exactly. Check the exact value instead: ${Et} rounds to ${money(claim)}.` };
        if (o.mc === MC.nearMiss) return { ok: false, mc: o.mc, say: `Rounding to the cent can only move it by half a cent. The exact value ${Et} rounds to ${money(Rr)}, so ${money(claim)} is wrong.` };
        return { ok: false, say: `Work out the exact value first: ${Et}, then round it once.` };
      },
    };
  }
  throw new Error('roundCheck: no numbers');
};

// ---------- 20 check the size ----------
const sizeCheck: Gen = (R, n) => {
  const c = pick(R, [CTX.cherries!, CTX.chain!, CTX.car!]);
  for (let k = 0; k < 400; k++) {
    const a = rat(int(R, 12, 60), 10), ta = rat(int(R, 5, 90), 10);
    const m = qNum(ta) / qNum(a);
    if (m > 0.7 && m < 1.45) continue;
    const r = c.id === 'car' ? rat(int(R, 22, 38)) : rat(int(R, 6, 40) * 25, 100);
    // the estimate rounds the new amount to a whole number: only when that is close (0.5 gal is not "about 1")
    if (Math.abs(Math.round(qNum(ta)) - qNum(ta)) > 0.2 * qNum(ta)) continue;
    const b = qMul(a, r), E = qMul(ta, r);
    if (places(b) > 2 || places(E) > 2) continue;
    const kind = pick(R, ['right', 'x10', 'd10', 'inv'] as const);
    const claim = kind === 'right' ? E : kind === 'x10' ? qMul(E, rat(10)) : kind === 'd10' ? qDiv(E, rat(10)) : qMul(b, qDiv(a, ta));
    if (places(claim) > 3) continue;
    const fr1 = qNum(r) < 4 ? Math.round(qNum(r) * 2) / 2 : Math.round(qNum(r)), est = qOf(Math.round(fr1 * Math.round(qNum(ta)) * 10) / 10);
    if (Math.round(qNum(ta)) === 0 || fr1 === 0) continue;
    const ok = kind === 'right';
    if (!ok && Math.abs(Math.log(qNum(claim) / qNum(est))) < Math.log(1.8)) continue;
    if (ok && Math.abs(Math.log(qNum(claim) / qNum(est))) > Math.log(1.6)) continue;
    const s = (v: Q) => (c.money[1] ? money(v) : `${fmt(v)} ${c.u[1][1]}`);
    const estTxt = `about ${c.money[1] ? '$' + fr1 : fr1} × ${Math.round(qNum(ta))} ≈ ${c.money[1] ? '$' : ''}${fmt(est)}`;
    const opts = ok ? [
      { t: `Reasonable: ${estTxt}, close to ${s(claim)}.`, ok: true, mc: undefined as string | undefined },
      { t: `Not reasonable: it should be about ${s(qMul(est, rat(10)))}.`, ok: false, mc: undefined },
      { t: `Not reasonable: ${fmt(ta)} is ${qLess(ta, a) ? 'less' : 'more'} than ${fmt(a)}, so the answer must be ${qLess(ta, a) ? 'more' : 'less'} than ${s(b)}.`, ok: false, mc: undefined },
    ] : [
      { t: `Not reasonable: ${estTxt}.`, ok: true, mc: undefined as string | undefined },
      { t: `Reasonable: it is in ${c.money[1] ? 'dollars' : c.u[1][1]}, the unit asked for.`, ok: false, mc: MC.noSize as string | undefined },
      { t: `Reasonable: the calculation was done step by step.`, ok: false, mc: MC.noSize as string | undefined },
    ];
    const ch = shuffle(R, opts);
    return {
      id: `sizeCheck-${n}`, family: 'sizeCheck',
      prompt: `${c.given(qt(c, 0, a), qt(c, 1, b))} Jo works out the ${c.id === 'cherries' ? 'cost' : c.id === 'car' ? 'distance' : 'weight'} for ${A(qt(c, 0, ta))} and gets ${B(s(claim))}. Is that reasonable?`,
      board: `${pairBoard(c, a, b, ta, claim)}`, input: 'choice', choices: ch.map(o => o.t), answer: { kind: 'choice', i: ch.findIndex(o => o.ok) },
      solution: [`Estimate with friendly numbers: the rate is about ${fr1}, and ${fmt(ta)} is about ${Math.round(qNum(ta))}.`, `So ${estTxt}. The exact answer is ${s(E)}.`],
      check: x => {
        if (x.kind !== 'choice') return { ok: false, say: 'Pick one.' };
        const o = ch[x.i]!;
        if (o.ok) return { ok: true, say: ok ? 'Yes: the estimate backs it up.' : `Yes: the estimate is ${s(est)}, nowhere near ${s(claim)}.` };
        if (o.mc === MC.noSize) return { ok: false, mc: o.mc, say: `A right unit or careful steps do not check the size. Estimate: ${estTxt}.` };
        if (o.mc) return { ok: false, mc: o.mc, say: `${fmt(ta)} is ${qLess(ta, a) ? 'less' : 'more'} than ${fmt(a)}, so the answer is ${qLess(ta, a) ? 'less' : 'more'} than ${s(b)}, and ${s(claim)} is.` };
        return { ok: false, say: `Estimate first: ${estTxt}.` };
      },
    };
  }
  throw new Error('sizeCheck: no numbers');
};

// ---------- 21 audit a worked solution ----------
const audit: Gen = (R, n) => {
  const kind = pick(R, ['right', 'reversed', 'additive', 'decimal', 'early', 'rounded', 'painters'] as const);
  let work = '', ok = false, fix = '', why = '', claimTxt = '', lo = 0, hi = 0, claimV = 0;
  if (kind === 'painters') {
    const p = int(R, 2, 4), h = pick(R, [4, 6, 8, 12]), f = pick(R, [2, 3]);
    work = `${p} painters paint a fence in ${h} hours. Ana: “${p * f} painters is ${f} times as many, so ${h} × ${f} = ${h * f} hours.”`;
    fix = `More painters take LESS time: this is not proportional. About ${fmt(rat(h, f))} hours.`;
    why = 'Not proportional'; claimTxt = `${h * f} hours`; lo = Math.min(p, h); hi = Math.max(p * f, h * f); claimV = h * f;
  } else {
    let a = 4, b = 10, ta = 6;
    for (let k = 0; k < 100; k++) {
      a = int(R, 3, 9); ta = int(R, 2, 14); b = int(R, 6, 40);
      if (ta === a) continue;
      if (b <= a || b > 15 * a) continue;   // grapes at $1 to $15 a pound (at $1 a pound the additive way is right too)
      const E = rat(b * ta, a), rr = rat(b, a);
      const friendly = terminates(E) && places(E) <= 2 && terminates(rr) && places(rr) <= 2;
      if (['right', 'reversed', 'additive', 'decimal'].includes(kind) && !friendly) continue;
      if (kind === 'reversed' && !(terminates(rat(a, b)) && places(rat(a, b)) <= 3)) continue;
      if (['early', 'rounded'].includes(kind) && ((terminates(E) && places(E) <= 2) || qEq(qMul(roundQ(rr, 2), rat(ta)), roundQ(E, 2)))) continue;
      if (kind === 'additive' && b + ta - a <= 0) continue;
      break;
    }
    const E = rat(b * ta, a), r = rat(b, a);
    const intro = `${a} pounds of grapes cost $${b}. Ana finds the cost of ${ta} pounds:`;
    if (kind === 'right') { work = `${intro} “$${b} ÷ ${a} = ${money(r)} per pound, × ${ta} = ${money(E)}.”`; ok = true; claimTxt = money(E); claimV = qNum(E); }
    if (kind === 'reversed') { const v = qMul(rat(a, b), rat(ta)); work = `${intro} “${a} ÷ ${b} = ${fmt(rat(a, b))} dollars per pound, × ${ta} = ${money(roundQ(v, 2))}.”`; fix = `${a} ÷ ${b} is pounds per dollar. ${money(r)} per pound × ${ta} = ${money(E)}.`; why = 'The unit is wrong'; claimTxt = money(roundQ(v, 2)); claimV = qNum(roundQ(v, 2)); }
    if (kind === 'additive') { work = `${intro} “${ta} is ${Math.abs(ta - a)} ${ta > a ? 'more' : 'less'} than ${a}, so $${b} ${ta > a ? '+' : '−'} $${Math.abs(ta - a)} = $${b + ta - a}.”`; fix = `$${b + ta - a} ÷ ${ta} ≠ $${b} ÷ ${a}: the ratio is broken. It is ${money(E)}.`; why = 'The ratio is broken'; claimTxt = `$${b + ta - a}`; claimV = b + ta - a; }
    if (kind === 'decimal') { const v = qMul(E, rat(10)); work = `${intro} “$${b} ÷ ${a} = ${money(r)}, × ${ta} = ${money(v)}.”`; fix = `${ta} pounds at about $${Math.round(qNum(r))} a pound is about $${Math.round(qNum(r)) * ta}, not ${money(v)}. It is ${money(E)}.`; why = 'The size is off'; claimTxt = money(v); claimV = qNum(v); }
    if (kind === 'early') { const v = qMul(roundQ(r, 2), rat(ta)); work = `${intro} “$${b} ÷ ${a} ≈ ${money(roundQ(r, 2))}, × ${ta} = ${money(v)}.”`; fix = `Exact: ${fr(b * ta, a)} = ${longDiv(E, 3)}…, so ${money(roundQ(E, 2))}.`; why = 'Rounded too early'; claimTxt = money(v); claimV = qNum(v); }
    if (kind === 'rounded') { work = `${intro} “$${b} × ${ta} ÷ ${a} = ${fr(b * ta, a)} = ${longDiv(E, 3)}…, so ${money(roundQ(E, 2))}.”`; ok = true; claimTxt = money(roundQ(E, 2)); claimV = qNum(roundQ(E, 2)); }
    lo = Math.min(a, b, ta); hi = Math.max(a, b, ta);
    if (ok) why = `Units match (dollars per pound), the ratio checks, and the size is right`;
  }
  const inBounds = claimV >= lo && claimV <= hi;
  const opts = [
    ok ? { t: `Correct. ${why}.`, ok: true, mc: undefined as string | undefined } : { t: `Wrong. ${why}: ${fix}`, ok: true, mc: undefined as string | undefined },
    ok ? { t: `Wrong: the answer should be about twice as much.`, ok: false, mc: undefined as string | undefined } : { t: `Correct: ${claimTxt} is between the smallest and the largest number in the problem.`, ok: false, mc: (inBounds ? MC.bounds : MC.noSize) as string | undefined },
    { t: `Correct: doing the same steps again gives ${claimTxt} again.`, ok: false, mc: MC.repeat as string | undefined },
  ];
  const ch = shuffle(R, opts);
  return {
    id: `audit-${n}`, family: 'audit', prompt: `${work} Is Ana right?`, board: `\\text{Ana: }${claimTxt.replace('$', '\\$')}`, input: 'choice', choices: ch.map(o => o.t), answer: { kind: 'choice', i: ch.findIndex(o => o.ok) },
    solution: ok ? ['Units: dollars per pound times pounds gives dollars.', 'Ratio: the answer ÷ the pounds equals the given price ÷ the given pounds.', 'Size: more pounds cost more, fewer cost less.'] : [fix],
    check: x => {
      if (x.kind !== 'choice') return { ok: false, say: 'Pick one.' };
      const o = ch[x.i]!;
      if (o.ok) return { ok: true, say: ok ? 'Yes: every check passes.' : `Yes. ${fix}` };
      if (o.mc === MC.repeat) return { ok: false, mc: o.mc, say: 'Repeating the same steps repeats the same slip. Check a different way: the units, the ratio, the size.' };
      if (o.mc) return { ok: false, mc: o.mc, say: `Being between the numbers proves nothing. ${ok ? '' : fix}` };
      return { ok: false, say: 'Check it: the units match, the ratio is the same, and the size makes sense.' };
    },
  };
};

const RAW: Record<FamilyId, Gen> = {
  scaleUp, sameRatio, scaleDown, fracOk, findFactor, predict, betweenWithin, unitRate, blockRow, pickBlock, exactFrac,
  longDiv: longDivF, roundEnd, decTable, complexRate, writeK, useK, isProp, chooseMethod, mixed, unitCheck, mixedUnits,
  ratioCheck, roundCheck, sizeCheck, audit,
};
/** a choice item's worked solution ends on the right choice (docs/lessons/QUALITY_LAYER.md); the item is mutated, not
 *  copied (PROBES are keyed by the item) */
const ending = (g: Gen): Gen => (R, n, sg) => {
  SEEN = [];
  let it = g(R, n, sg);
  for (let t = 0; t < 60 && !SEEN.every(x => realPair(x.id, x.a, x.b)); t++) { SEEN = []; it = g(R, n, sg); }
  SEEN = [];
  if (it.choices && it.answer.kind === 'choice') it.solution = endOnChoice(it.solution, it.choices[it.answer.i]!);
  return it;
};
export const GENERATORS = Object.fromEntries(Object.entries(RAW).map(([k, g]) => [k, ending(g)])) as Record<FamilyId, Gen>;
