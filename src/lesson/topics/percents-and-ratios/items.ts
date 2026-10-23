// items.ts: exercise families for "combine percents and ratios in one problem" (primary.ratios.combine-percentage-
// ratio-contexts), generated from templates, checked exactly, every wrong answer the classifier knows carries its
// misconception id from math-curriculum-essentials/misconceptions.json. A generator gets the SUB-GOAL it practises
// (plan.ts); number ranges follow that sub-goal's `cases` (friendly whole numbers first, decimals = calculator).
// Pure: no DOM, no canvas; a seeded rng makes sessions repeatable.
import { type Item, type Response, type Verdict, A, B, int, pick, shuffle } from '../../runtime/item';
import { isCents, isWhole, money, near, nf, pc, pctOf, r4, roundDiv, tn, toCents } from './chainMaths';
import type { ChainParams, CRow } from './ChainTape';
import { ans as mark, endOnChoice } from '../../runtime/explain';

export type FamilyId = 'labelStep' | 'nameWhole' | 'orderPlan' | 'share' | 'ratioPercent' | 'percentRatio' | 'twoChanges'
  | 'multiplier' | 'chainProduct' | 'rounding' | 'audit' | 'checkShares' | 'undo' | 'estimate' | 'transfer'
  | 'findFixed' | 'doubleTest' | 'wholeValue' | 'firstStep' | 'planThree' | 'shareFromPart' | 'shareFraction' | 'ratioPercentRest' | 'rateThenPercent'
  | 'percentThenRate' | 'percentRatioGrow' | 'netChange' | 'threeStep' | 'multiplierToPercent' | 'roundingTip' | 'fixAudit' | 'checkPercent'
  | 'undoPercentRatio' | 'direction' | 'transferThree';
export const FAMILIES: readonly { id: FamilyId; name: string }[] = [
  { id: 'labelStep', name: 'Ratio, percent, or neither?' },
  { id: 'nameWhole', name: 'Which amount is 100%?' },
  { id: 'orderPlan', name: 'Plan the steps' },
  { id: 'share', name: 'Share in a ratio' },
  { id: 'ratioPercent', name: 'Ratio, then percent' },
  { id: 'percentRatio', name: 'Percent, then ratio' },
  { id: 'twoChanges', name: 'Two percent changes' },
  { id: 'multiplier', name: 'One multiplier' },
  { id: 'chainProduct', name: 'The chain in one line' },
  { id: 'rounding', name: 'Round at the right point' },
  { id: 'audit', name: 'Find the mistake' },
  { id: 'checkShares', name: 'Check the shares' },
  { id: 'undo', name: 'Work back to the start' },
  { id: 'estimate', name: 'Does it make sense?' },
  { id: 'transfer', name: 'A new situation' },
  { id: 'findFixed', name: 'Find the fixed amount' },
  { id: 'doubleTest', name: 'The doubling test' },
  { id: 'wholeValue', name: 'How big is the whole?' },
  { id: 'firstStep', name: 'What comes first?' },
  { id: 'planThree', name: 'Three steps in order' },
  { id: 'shareFromPart', name: 'From one share' },
  { id: 'shareFraction', name: 'A share as a fraction' },
  { id: 'ratioPercentRest', name: 'What is left of the share' },
  { id: 'rateThenPercent', name: 'Rate, then percent' },
  { id: 'percentThenRate', name: 'Percent, then rate' },
  { id: 'percentRatioGrow', name: 'Grow, then share' },
  { id: 'netChange', name: 'The overall change' },
  { id: 'threeStep', name: 'Share, tax, tip' },
  { id: 'multiplierToPercent', name: 'Multiplier to percent' },
  { id: 'roundingTip', name: 'Rounding a tip' },
  { id: 'fixAudit', name: 'Fix the solution' },
  { id: 'checkPercent', name: 'Check the percent' },
  { id: 'undoPercentRatio', name: 'Back to the prize' },
  { id: 'direction', name: 'Up or down overall?' },
  { id: 'transferThree', name: 'Three steps, on your own' },
];
export const FAMILY_NAMES: Record<string, string> = Object.fromEntries(FAMILIES.map(f => [f.id, f.name]));

/** a chain picture the page draws: the rows, the draw keys shown at the start, the amounts asked ("?"), the TeX of the solve */
export interface ChainPic { chain: ChainParams; given: string[]; ask: { r: number; j: number }[]; steps: string[] }
export interface PRItem extends Item { family: FamilyId; picture?: { chain: ChainPic } }
type Gen = (R: () => number, n: number, sg?: string) => PRItem;

// ---------- misconception ids (all in misconceptions.json; the test checks) ----------
export const MC = {
  otherPart: 'mc.ratio-rate.confuses-whole-with-other-part',
  scalesFixed: 'mc.ratio-rate.scales-non-proportional',
  keyword: 'mc.reasoning-language.keyword-operation-choice',
  addsPercents: 'mc.percent.adds-successive-percent-changes',
  mentionOrder: 'mc.functions-concept.composition-flow-from-mention-order',
  wrongWhole: 'mc.fraction-ops.uses-nonreference-quantity-as-whole',
  lostIntermediate: 'mc.reasoning-language.loses-track-of-intermediate',
  postChangeRatio: 'mc.reasoning-language.applies-post-change-ratio-to-original-total',
  changeAsFinal: 'mc.percent.change-reported-as-final-amount',
  changeAsWhole: 'mc.percent.change-amount-as-whole',
  roundsEarly: 'mc.decimals.intermediate-precision-always-invalid',
  arithmeticOk: 'mc.reasoning-language.correct-arithmetic-validates-setup',
  totalMatches: 'mc.area-perimeter.accepts-work-because-total-matches',
  oppositePct: 'mc.percent.opposite-percent-to-undo-change',
  noSizeCheck: 'mc.estimation.accepts-result-without-size-check',
  mulBigger: 'mc.mul-div.multiplication-makes-bigger',
  template: 'mc.reasoning-language.familiar-story-template-overrides-question',
  equalSplit: 'mc.ratio-rate.equal-split-not-proportional',
  unitRate: 'mc.ratio-rate.stops-at-unit-rate',
  wrongDir: 'mc.percent.wrong-direction-of-change',
  appendDigits: 'mc.percent.appends-rate-digits-after-one',
  dropsHundred: 'mc.percent.drops-original-hundred-percent',
  noDivide100: 'mc.percent.percent-numeral-without-dividing-by-100',
  commissionAdded: 'mc.percent.commission-added-to-sales',
  wholeByPart: 'mc.percent.divides-whole-by-part',
  reversedProportion: 'mc.ratio-rate.proportion-inconsistent-order',
  complementPart: 'mc.ratio-rate.reverses-part-whole-by-complement',
  percentOfAsChange: 'mc.percent.percent-of-read-as-percent-change',
  fixedCommute: 'mc.percent.fixed-amount-and-percent-changes-commute',
} as const;

// ---------- shared helpers ----------
interface Wrong { v: number; mc?: string; say: string }
function numCheck(ans: number, isMoney: boolean, okSay: string, hint: string, wrongs: Wrong[]): (r: Response) => Verdict {
  const eq = (a: number, b: number) => (isMoney ? toCents(a) === toCents(b) && Math.abs(a - b) < 0.0051 : near(a, b, 1e-6));
  return r => {
    if (r.kind !== 'num' || !Number.isFinite(r.v)) return { ok: false, say: 'Type a number.' };
    if (eq(r.v, ans)) return { ok: true, say: okSay };
    for (const w of wrongs) if (!eq(w.v, ans) && eq(r.v, w.v)) return { ok: false, mc: w.mc, say: w.say };
    return { ok: false, say: hint };
  };
}
interface Opt { t: string; ok?: boolean; mc?: string; say: string }
function choose(R: () => number, opts: Opt[], keepOrder = false): { choices: string[]; answer: Response; check: (r: Response) => Verdict } {
  const o = keepOrder ? opts : shuffle(R, [...opts]);
  const i = o.findIndex(x => x.ok);
  return {
    choices: o.map(x => x.t), answer: { kind: 'choice', i },
    check: r => { const x = r.kind === 'choice' ? o[r.i] : undefined; return x ? { ok: !!x.ok, mc: x.mc, say: x.say } : { ok: false, say: 'Pick an answer.' }; },
  };
}
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
/** "a" or "an" before a number as it is spoken: an 8%, an 11%, an 18%, an 80% (but a 1%, a 110%) */
const an = (x: number | string) => (/^(8|11(\.\d+)?$|18(\.\d+)?$)/.test(String(x)) ? 'an' : 'a');
const PAIRS: readonly [number, number][] = [[1, 2], [2, 1], [1, 3], [3, 1], [2, 3], [3, 2], [3, 4], [4, 3], [3, 5], [5, 3], [2, 5], [5, 2], [4, 5], [5, 4], [1, 4], [7, 2], [2, 7], [5, 7], [7, 5], [3, 7], [4, 1]];
const TRIPLES: readonly [number, number, number][] = [[1, 2, 3], [2, 3, 5], [1, 1, 2], [3, 4, 5], [1, 2, 5], [2, 3, 4], [1, 3, 4], [2, 2, 3]];
const BENCH = [10, 20, 25, 50, 5, 30, 40, 75, 15, 60];
const CALC = [12, 35, 45, 8, 65, 18, 6, 85];
const tickCount = (p: number) => (p % 10 === 0 ? 10 : p % 25 === 0 ? 4 : p % 5 === 0 ? 20 : 10);
const dec = (p: number) => tn(r4(p / 100));
/** hard sub-goals use calculator numbers some of the time */
const useCalc = (R: () => number, sg?: string) => R() < (sg === 'transfer-new-context' || sg === 'backward-check' ? 0.3 : 0.25);

// ---------- contexts: a total shared in a ratio, then a percent of ONE share ----------
interface RC {
  id: string; kind: 'money' | 'count' | 'measure'; unit: string; fmt: (v: number) => string;
  whole: string; names: [string, string]; w: 0 | 1; units: readonly number[];
  setup: (T: string, rt: string) => string; pct: (p: string) => string; ask: string;
  /** "art’s share" / "the away fans" */ share: string; other: string; pctName: string;
}
const RCS: readonly RC[] = [
  { id: 'club', kind: 'money', unit: 'dollars', fmt: money, whole: 'budget', names: ['art', 'music'], w: 0, units: [10, 15, 20, 25, 30, 40, 50, 60],
    setup: (T, rt) => `A club splits its ${T} budget between art and music in the ratio ${rt}.`, pct: p => `Art spends ${p} of its share on paint.`,
    ask: 'How much does art spend on paint?', share: 'art’s share', other: 'music’s share', pctName: 'paint' },
  { id: 'fans', kind: 'count', unit: 'fans', fmt: v => `${nf(v)} fans`, whole: 'fans', names: ['home', 'away'], w: 1, units: [20, 40, 50, 60, 80, 100, 120, 150],
    setup: (T, rt) => `${T} came to the game. Home fans to away fans was ${rt}.`, pct: p => `${p} of the away fans wore caps.`,
    ask: 'How many away fans wore caps?', share: 'the away fans', other: 'the home fans', pctName: 'caps' },
  { id: 'mix', kind: 'measure', unit: 'ounces', fmt: v => `${nf(v)} oz`, whole: 'trail mix', names: ['nuts', 'raisins'], w: 0, units: [2, 3, 4, 5, 6],
    setup: (T, rt) => `A bag holds ${T} of trail mix, nuts to raisins ${rt}.`, pct: p => `${p} of the nuts are almonds.`,
    ask: 'How many ounces of almonds are in the bag?', share: 'the nuts', other: 'the raisins', pctName: 'almonds' },
  { id: 'sales', kind: 'money', unit: 'dollars', fmt: money, whole: 'sales', names: ['Ana', 'Ben'], w: 1, units: [20, 40, 50, 60, 80, 100],
    setup: (T, rt) => `Ana and Ben sold ${T} of phone cases, Ana to Ben ${rt}.`, pct: p => `Ben earns ${p} commission on his own sales.`,
    ask: 'How much commission does Ben earn?', share: 'Ben’s sales', other: 'Ana’s sales', pctName: 'commission' },
  { id: 'farm', kind: 'measure', unit: 'acres', fmt: v => `${nf(v)} acres`, whole: 'farm', names: ['corn', 'soy'], w: 0, units: [10, 20, 25, 30, 40, 50],
    setup: (T, rt) => `A farm grows ${T} of corn and soybeans, corn to soy ${rt}.`, pct: p => `${p} of the corn gets sprinklers.`,
    ask: 'How many acres of corn get sprinklers?', share: 'the corn', other: 'the soybeans', pctName: 'sprinklers' },
  { id: 'punch', kind: 'measure', unit: 'cups', fmt: v => `${nf(v)} cups`, whole: 'punch', names: ['juice', 'water'], w: 0, units: [2, 3, 4],
    setup: (T, rt) => `A punch recipe makes ${T} of juice and sparkling water, ${rt}.`, pct: p => `${p} of the juice is orange juice.`,
    ask: 'How many cups of orange juice go in?', share: 'the juice', other: 'the water', pctName: 'orange' },
];
interface RPN { c: RC; a: number; b: number; s: number; u: number; T: number; part: number; other: number; p: number; ans: number }
function rpNumbers(R: () => number, c: RC, calc: boolean): RPN {
  for (let t = 0; t < 400; t++) {
    const [a, b] = pick(R, PAIRS), s = a + b, u = pick(R, c.units), T = u * s;
    if (T > 1000) continue;
    const parts = [a * u, b * u], part = parts[c.w]!, other = parts[1 - c.w]!;
    const p = pick(R, calc ? CALC : BENCH), ans = pctOf(p, part);
    const exact = c.kind === 'count' || !calc ? isWhole(ans) : isCents(ans);
    if (!exact || ans <= 0 || ans >= part) continue;
    if (calc && isWhole(ans) && t < 300) continue;
    return { c, a, b, s, u, T, part, other, p, ans };
  }
  return { c, a: 3, b: 5, s: 8, u: c.units[0]! * 10, T: c.units[0]! * 80, part: c.units[0]! * 30, other: c.units[0]! * 50, p: 10, ans: c.units[0]! * 3 };
}
function rpPic(x: RPN, rest = false): ChainPic {
  const { c, a, b, T, part, p, ans } = x, w = c.w, shares = [shareFor(x, 0), shareFor(x, 1)], start = w === 0 ? 0 : shares[0]!;
  const R0: CRow = { title: c.whole, lead: c.fmt(T), base: T, units: x.s <= 12 ? x.s : undefined,
    pieces: shares.map((v, j) => ({ amt: v, role: j === w ? 'part' as const : 'rest' as const, inside: c.names[j], under: c.fmt(v) })) };
  const R1: CRow = { title: c.names[w], lead: c.fmt(part), base: part, zoomFrom: { row: 0, a: start, b: start + part }, ticks: tickCount(p), hundred: true,
    pieces: rest ? [{ amt: ans, role: 'part', inside: pc(p), under: c.fmt(ans) }, { amt: part - ans, role: 'answer', inside: pc(100 - p), under: c.fmt(r4(part - ans)) }]
      : [{ amt: ans, role: 'answer', inside: pc(p), under: c.fmt(ans) }, { amt: part - ans, role: 'whole', inside: pc(100 - p) }] };
  const j = rest ? 1 : 0, out = rest ? r4(part - ans) : ans, pp = rest ? 100 - p : p;
  return {
    chain: { rows: [R0, R1] }, ask: [{ r: 1, j }],
    given: ['r0', 't0', 'L0', 's0', 'u0', 'n0.0', 'n0.1', 'z1', 'r1', 't1', 'h1', 'k1', 's1', 'n1.0', 'n1.1', `v1.${j}`],
    steps: [`${tn(T)} \\div ${x.s} = ${tn(x.u)}`, `${[a, b][w]} \\times ${tn(x.u)} = ${tn(part)}`, `${dec(pp)} \\times ${tn(part)} = ${tn(out, c.kind === 'money')}`],
  };
}
const shareFor = (x: RPN, j: number) => [x.a, x.b][j]! * x.u;
function rpSolution(x: RPN): string[] {
  const { c, a, b, s, u, T, part, p, ans } = x, w = c.w;
  return [`Ratio step: ${a} + ${b} = ${s} parts, and ${c.fmt(T)} ÷ ${s} = ${c.fmt(u)} per part.`,
    `${cap(c.share)}: ${[a, b][w]} × ${c.fmt(u)} = ${c.fmt(part)}. That is the whole (100%) for the next step.`,
    `Percent step: ${pc(p)} of ${c.fmt(part)} = ${dec(p).replace('{,}', ',')} × ${nf(part)} = ${c.fmt(ans)}.`];
}

// =========================== 1 label-relationships ===========================
const REL: readonly { s: string; kind: 'ratio' | 'percent' | 'fixed'; trap?: 'keyword' }[] = [
  { s: 'The recipe uses <b>3 cups of flour for every 2 cups of sugar</b>.', kind: 'ratio' },
  { s: 'The club splits its money <b>3 : 5</b> between art and music.', kind: 'ratio' },
  { s: 'There are <b>2 coaches for every 25 players</b>.', kind: 'ratio' },
  { s: 'On the map, <b>1 inch stands for 20 miles</b>.', kind: 'ratio' },
  { s: 'The paint is mixed <b>4 parts blue to 1 part white</b>.', kind: 'ratio' },
  { s: 'Apples cost <b>$3 per pound</b>.', kind: 'ratio' },
  { s: 'Leo leaves <b>a 15% tip</b> on the bill.', kind: 'percent' },
  { s: 'The store adds <b>8% sales tax</b> to the price.', kind: 'percent' },
  { s: 'Everything in the shop is <b>30% off</b>.', kind: 'percent' },
  { s: '<b>40% of the class</b> walks to school.', kind: 'percent' },
  { s: 'Dana gets <b>a 6% raise</b> on her pay.', kind: 'percent' },
  { s: 'The seller earns <b>5% commission</b> on each sale.', kind: 'percent' },
  { s: 'Shipping is <b>a flat $5 for every order</b>, big or small.', kind: 'fixed', trap: 'keyword' },
  { s: 'The bakery charges <b>a $2 box fee</b> on each cake order.', kind: 'fixed' },
  { s: 'Mia is <b>3 years older</b> than her brother.', kind: 'fixed' },
  { s: 'Entry to the fair costs <b>$10 per family</b>, however many people come.', kind: 'fixed', trap: 'keyword' },
  { s: 'This year there are <b>12 more chairs</b> than last year.', kind: 'fixed' },
  { s: 'The gym charges <b>a $25 sign-up fee</b>, then a monthly price.', kind: 'fixed' },
];
const labelStep: Gen = (R, n) => {
  const rel = pick(R, REL);
  const say = {
    ratio: 'A ratio step: it compares two amounts that grow together (double one, double the other).',
    percent: 'A percent step: it is a part of some whole, per 100.',
    fixed: 'Neither: it is a fixed amount. It does not grow when the other amounts grow.',
  };
  const opts: Opt[] = [
    { t: 'A ratio step', ok: rel.kind === 'ratio', say: rel.kind === 'ratio' ? say.ratio : rel.kind === 'fixed' ? 'It is a fixed amount: it stays the same when the order grows.' : 'It is a percent: a part per 100 of one whole.',
      mc: rel.kind === 'fixed' ? (rel.trap ? MC.keyword : MC.scalesFixed) : undefined },
    { t: 'A percent step', ok: rel.kind === 'percent', say: rel.kind === 'percent' ? say.percent : rel.kind === 'fixed' ? 'It is a fixed amount: it stays the same when the order grows.' : 'It is a ratio: it compares two amounts, not a part per 100.',
      mc: rel.kind === 'fixed' ? MC.scalesFixed : undefined },
    { t: 'Neither: a fixed amount', ok: rel.kind === 'fixed', say: rel.kind === 'fixed' ? say.fixed : rel.kind === 'ratio' ? 'Not fixed: double one amount and the other doubles too.' : 'Not fixed: it grows with its whole.' },
  ];
  const ch = choose(R, opts, true);
  return { id: `labelStep-${n}`, family: 'labelStep', prompt: `What kind of step is the bold part?<br>${rel.s}`, board: '\\text{ratio, percent, or neither?}',
    input: 'choice', ...ch, solution: ['Test: if the other amount doubled, would this one double? Ratios and percents do; fixed amounts don’t.'] };
};

// =========================== 2 name-whole-per-step ===========================
const nameWhole: Gen = (R, n) => {
  const kind = pick(R, ['tax', 'share', 'tipPre', 'tipPost', 'markdown'] as const);
  let prompt = '', opts: Opt[] = [], board = '', sol: string[] = [];
  if (kind === 'tax') {
    const P = pick(R, [40, 60, 80, 120, 50, 200]), d = pick(R, [20, 25, 10, 50]), t = pick(R, [6, 8, 5, 7]), S = P * (100 - d) / 100;
    prompt = `A ${A(money(P))} jacket is <b>${d}% off</b>. Then <b>${t}% sales tax</b> is added to the sale price. The ${t}% is a percent of which amount?`;
    board = `\\$${P},\\ ${d}\\%\\ \\text{off},\\ ${t}\\%\\ \\text{tax}`;
    opts = [{ t: `The sale price, ${money(S)}`, ok: true, say: `Yes. The tax is on the sale price, so ${money(S)} is 100% for the tax step.` },
      { t: `The original price, ${money(P)}`, mc: MC.addsPercents, say: `${money(P)} is 100% for the discount only. The story says the tax is added to the sale price, ${money(S)}.` },
      { t: `The discount, ${money(P - S)}`, mc: MC.changeAsWhole, say: `The discount is the amount taken off, not the price you are taxed on.` }];
    sol = [`Discount step: 100% = ${money(P)}.`, `Tax step: 100% = the sale price, ${money(S)}.`];
  } else if (kind === 'share') {
    const x = rpNumbers(R, RCS[0]!, false);
    prompt = `A club splits its ${A(money(x.T))} budget between art and music in the ratio ${B(`${x.a} : ${x.b}`)}. Art spends <b>${x.p}%</b> of its share on paint. The ${x.p}% is a percent of which amount?`;
    board = `\\$${tn(x.T)},\\ ${x.a} : ${x.b},\\ ${x.p}\\%`;
    opts = [{ t: `Art’s share, ${money(x.part)}`, ok: true, say: `Yes. “${x.p}% of its share”: art’s share is 100% for the paint step.` },
      { t: `The whole budget, ${money(x.T)}`, mc: MC.wrongWhole, say: `${money(x.T)} is the whole for the ratio step. The ${x.p}% is of art’s share only.` },
      { t: `Music’s share, ${money(x.other)}`, mc: MC.otherPart, say: 'Music’s share is the other part. The paint comes out of art’s share.' }];
    sol = [`Ratio step: 100% = the budget, ${money(x.T)}.`, `Percent step: 100% = art’s share, ${money(x.part)}.`];
  } else if (kind === 'tipPre' || kind === 'tipPost') {
    const Bl = pick(R, [40, 60, 80, 50, 120]), t = pick(R, [5, 10, 8]), q = pick(R, [15, 20, 18]), X = Bl * t / 100;
    const pre = kind === 'tipPre';
    prompt = `Dinner is ${A(money(Bl))} before tax. Tax is ${t}%, so the bill with tax is ${A(money(Bl + X))}. The family tips <b>${q}% of the bill ${pre ? 'before' : 'with'} tax</b>. The tip is a percent of which amount?`;
    board = `\\$${Bl}\\ \\text{before tax},\\ ${q}\\%\\ \\text{tip}`;
    opts = [{ t: `The bill before tax, ${money(Bl)}`, ok: pre, mc: pre ? undefined : MC.wrongWhole, say: pre ? 'Yes. The story says the tip is on the bill before tax.' : 'Read it again: the tip is on the bill with tax.' },
      { t: `The bill with tax, ${money(Bl + X)}`, ok: !pre, mc: pre ? MC.wrongWhole : undefined, say: pre ? 'Read it again: the tip is on the bill before tax.' : 'Yes. The story says the tip is on the bill with tax.' },
      { t: `The tax, ${money(X)}`, mc: MC.changeAsWhole, say: 'The tax is a small added amount. The tip is a percent of a bill.' }];
    sol = [`The story names the whole: the bill ${pre ? 'before' : 'with'} tax, ${money(pre ? Bl : Bl + X)}.`];
  } else {
    const C = pick(R, [80, 120, 200, 60, 100]), m = pick(R, [25, 50, 20]), d = pick(R, [10, 20, 30]), M = C * (100 + m) / 100;
    prompt = `A store pays ${A(money(C))} for a bike and marks it up <b>${m}%</b> to ${A(money(M))}. Later it marks that price down <b>${d}%</b>. The ${d}% is a percent of which amount?`;
    board = `\\$${C},\\ +${m}\\%,\\ -${d}\\%`;
    opts = [{ t: `The marked-up price, ${money(M)}`, ok: true, say: `Yes. The markdown is taken off the price after the markup, ${money(M)}.` },
      { t: `The store’s cost, ${money(C)}`, mc: MC.addsPercents, say: `${money(C)} is the whole for the markup only. The markdown works on the new price, ${money(M)}.` },
      { t: `The markup, ${money(M - C)}`, mc: MC.changeAsWhole, say: 'The markup is the amount added, not the price that is marked down.' }];
    sol = [`Markup step: 100% = the cost, ${money(C)}.`, `Markdown step: 100% = the marked-up price, ${money(M)}.`];
  }
  return { id: `nameWhole-${n}`, family: 'nameWhole', prompt, board, input: 'choice', ...choose(R, opts), solution: sol };
};

// =========================== 3 order-plan ===========================
const orderPlan: Gen = (R, n) => {
  const kind = pick(R, ['prize', 'paint', 'tickets', 'tax'] as const);
  let prompt = '', board = '', opts: Opt[] = [], sol: string[] = [];
  let [a, b] = pick(R, PAIRS);
  /** a ratio whose split of `whole` is whole (tickets) or in cents (money) */
  const fit = (whole: number, inCents: boolean) => { for (let t = 0; t < 60; t++) { const ok = inCents ? isCents((whole * a) / (a + b)) : isWhole((whole * a) / (a + b)); if (ok) return true; [a, b] = pick(R, PAIRS); } return false; };
  if (kind === 'prize') {
    let T = pick(R, [500, 800, 1000, 600]), p = pick(R, [10, 20, 25]);
    if (!fit((T * (100 - p)) / 100, true)) { T = 1000; p = 20; [a, b] = [3, 5]; }
    prompt = `Lena and Omar split the prize ${B(`${a} : ${b}`)}. The prize is what is left of ${A(money(T))} after ${p}% tax is taken out. How much does Lena get? Which plan works?`;
    board = `\\$${tn(T)},\\ ${p}\\%\\ \\text{tax},\\ ${a} : ${b}`;
    opts = [{ t: `First take ${p}% off ${money(T)} to get the prize. Then split the prize ${a} : ${b}.`, ok: true, say: 'Yes. The split needs the prize, and the prize comes from the tax step, so the tax step goes first.' },
      { t: `First split the prize ${a} : ${b}. Then take ${p}% off ${money(T)}.`, mc: MC.mentionOrder, say: 'That follows the order of the sentences. But you can’t split the prize before you know it: it comes from the tax step.' },
      { t: `First find ${p}% of ${money(T)}. Then split that ${p}% ${a} : ${b}.`, mc: MC.lostIntermediate, say: `${p}% of ${money(T)} is the tax. Lena and Omar split what is left, not the tax.` }];
  } else if (kind === 'paint') {
    let T = pick(R, [240, 400, 480, 320]), p = pick(R, [10, 20, 25]);
    for (let t = 0; t < 60 && !isCents((((T * a) / (a + b)) * p) / 100); t++) { [a, b] = pick(R, PAIRS); T = pick(R, [240, 400, 480, 320]); p = pick(R, [10, 20, 25]); }
    if (!isCents((((T * a) / (a + b)) * p) / 100)) { T = 400; p = 10; [a, b] = [3, 5]; }
    prompt = `Art spends ${p}% of its share on paint. The club splits its ${A(money(T))} budget, art to music ${B(`${a} : ${b}`)}. How much goes to paint? Which plan works?`;
    board = `${p}\\%,\\ \\$${T},\\ ${a} : ${b}`;
    opts = [{ t: `First split ${money(T)} ${a} : ${b} to get art’s share. Then find ${p}% of art’s share.`, ok: true, say: 'Yes. The percent step needs art’s share, so the ratio step goes first.' },
      { t: `First find ${p}% of art’s share. Then split ${money(T)} ${a} : ${b}.`, mc: MC.mentionOrder, say: 'That is the order of the sentences, but step 1 needs art’s share, which only step 2 gives you.' },
      { t: `First find ${p}% of ${money(T)}. Then that is the paint money.`, mc: MC.wrongWhole, say: `That takes ${p}% of the whole budget. The paint is ${p}% of art’s share.` }];
  } else if (kind === 'tickets') {
    let T = pick(R, [400, 600, 800, 500]), p = pick(R, [75, 80, 90, 60]);
    if (!fit((T * p) / 100, false)) { T = 400; p = 75; [a, b] = [1, 2]; }
    prompt = `The tickets sold were adult to student ${B(`${a} : ${b}`)}. Of the ${A(T)} tickets printed, ${p}% were sold. How many student tickets were sold? Which plan works?`;
    board = `${a} : ${b},\\ ${T},\\ ${p}\\%`;
    opts = [{ t: `First find ${p}% of ${T} to get the tickets sold. Then split them ${a} : ${b}.`, ok: true, say: 'Yes. The ratio is about the tickets sold, so you need that number first.' },
      { t: `First split the tickets sold ${a} : ${b}. Then find ${p}% of ${T}.`, mc: MC.mentionOrder, say: 'That follows the sentences, but you can’t split the tickets sold before you know how many were sold.' },
      { t: `Split all ${T} tickets ${a} : ${b}. That gives the student tickets.`, mc: MC.postChangeRatio, say: `The ratio describes the tickets sold, not all ${T} printed. Find the tickets sold first.` }];
  } else {
    const P = pick(R, [60, 80, 40, 120]), d = pick(R, [25, 20, 50]), t = pick(R, [6, 8, 5]);
    prompt = `Sales tax of ${t}% is added to the sale price. The ${A(money(P))} speaker is ${d}% off. What is the total? Which plan works?`;
    board = `${t}\\%\\ \\text{tax},\\ \\$${P},\\ ${d}\\%\\ \\text{off}`;
    opts = [{ t: `First take ${d}% off ${money(P)} to get the sale price. Then add ${t}% of the sale price.`, ok: true, say: 'Yes. The tax is on the sale price, so the discount step goes first.' },
      { t: `First add ${t}% of the sale price. Then take ${d}% off ${money(P)}.`, mc: MC.mentionOrder, say: 'That is the order of the sentences, but you need the sale price before you can find the tax on it.' },
      { t: `Add ${t}% of ${money(P)} and take ${d}% off ${money(P)}, both from ${money(P)}.`, mc: MC.addsPercents, say: `The tax is on the sale price, not on ${money(P)}. After the discount, the whole changes.` }];
  }
  sol = ['Ask of each step: what does it need? A step that needs another step’s result goes after it.', 'That order can be different from the order of the sentences.'];
  return { id: `orderPlan-${n}`, family: 'orderPlan', prompt, board, input: 'choice', ...choose(R, opts), solution: sol };
};

// =========================== 4 share-total-in-ratio ===========================
const SHARE_CTX = [
  { names: ['Kai', 'Lu', 'Rosa'], fmt: money, unit: 'dollars', money: true, story: (T: string, rt: string, who: string) => `Friends share a ${T} prize in the ratio ${rt}. How much does ${who} get?` },
  { names: ['red', 'blue', 'green'], fmt: (v: number) => `${nf(v)} ft`, unit: 'feet', money: false, story: (T: string, rt: string, who: string) => `A ${T} rope is cut into ${rt.split(':').length > 2 ? 'red, blue, and green' : 'red and blue'} pieces in the ratio ${rt}. How long is the ${who} piece?` },
  { names: ['Team A', 'Team B', 'Team C'], fmt: (v: number) => `${nf(v)} students`, unit: 'students', money: false, story: (T: string, rt: string, who: string) => `${T} are split into teams in the ratio ${rt}. How many students are on ${who}?` },
] as const;
const share: Gen = (R, n, sg) => {
  const c = pick(R, SHARE_CTX), three = R() < 0.35;
  const parts: number[] = three ? [...pick(R, TRIPLES)] : [...pick(R, PAIRS)];
  const s = parts.reduce((x, y) => x + y, 0);
  const calc = c.money && useCalc(R, sg) && R() < 0.6;
  let u: number;
  if (calc) { u = pick(R, [1.25, 2.5, 3.75, 6.25, 12.5, 7.5]); } else u = c.unit === 'students' ? pick(R, [3, 4, 5, 6, 8]) : pick(R, [5, 10, 12, 15, 20, 25, 30, 40]);
  const T = r4(u * s), w = int(R, 0, parts.length - 1), ans = r4(parts[w]! * u), who = c.names[w]!;
  const rt = parts.join(' : ');
  const wrongs: Wrong[] = [
    { v: r4(T / parts.length), mc: MC.equalSplit, say: `That splits ${c.fmt(T)} equally. The ratio ${rt} gives bigger and smaller shares.` },
    { v: r4(T / s), mc: MC.unitRate, say: `${c.fmt(r4(T / s))} is ONE part. ${who} gets ${parts[w]} parts.` },
  ];
  if (!three) wrongs.push({ v: r4((T * parts[w]!) / parts[1 - w]!), mc: MC.otherPart, say: `${rt} compares the two shares. Out of every ${s} parts, ${who} gets ${parts[w]}: that is ${parts[w]}/${s} of the total.` });
  parts.forEach((q, j) => { if (j !== w) wrongs.push({ v: r4(q * u), say: `That is the share of ${c.names[j]}. Count ${who}’s parts.` }); });
  const total = c.fmt(T);
  const pic: ChainPic = {
    chain: { rows: [{ title: 'total', lead: c.fmt(T).replace(' students', ''), base: T, units: s <= 12 ? s : undefined,
      pieces: parts.map((q, j) => ({ amt: q * u, role: j === w ? 'answer' as const : 'rest' as const, inside: c.names[j]!.replace('Team ', ''), under: c.fmt(q * u).replace(/ (ft|students)$/, '') })) }] },
    given: ['r0', 't0', 'L0', 's0', 'u0', ...parts.map((_, j) => `n0.${j}`), `v0.${w}`], ask: [{ r: 0, j: w }],
    steps: [`${parts.join(' + ')} = ${s}`, `${tn(T)} \\div ${s} = ${tn(u)}`, `${parts[w]} \\times ${tn(u)} = ${tn(ans, c.money)}`],
  };
  return {
    id: `share-${n}`, family: 'share', prompt: c.story(A(total), B(rt), who), board: `${tn(T)}\\ \\text{in}\\ ${parts.join(':')}`,
    input: 'num', unit: c.unit, answer: { kind: 'num', v: ans }, picture: { chain: pic },
    solution: [`${rt} means ${s} equal parts in all.`, `One part: ${c.fmt(T)} ÷ ${s} = ${c.fmt(u)}.`, `${who}: ${parts[w]} × ${c.fmt(u)} = ${c.fmt(ans)}.`],
    check: numCheck(ans, c.money, `Yes: ${c.fmt(T)} ÷ ${s} = ${c.fmt(u)} per part, and ${parts[w]} parts make ${c.fmt(ans)}.`, `Add the parts (${s}), find one part, then take ${who}’s ${parts[w]}.`, wrongs),
  };
};

// =========================== 5 chain-ratio-then-percent ===========================
const ratioPercent: Gen = (R, n, sg) => {
  const c = pick(R, RCS), x = rpNumbers(R, c, useCalc(R, sg));
  const { a, b, T, part, other, p, ans } = x, rt = `${a} : ${b}`, isMoney = c.kind === 'money';
  const wrongs: Wrong[] = [
    { v: pctOf(p, T), mc: MC.wrongWhole, say: `That is ${pc(p)} of the whole ${c.fmt(T)}. The ${pc(p)} is of ${c.share} only, so find that first.` },
    { v: part, mc: MC.lostIntermediate, say: `${c.fmt(part)} is ${c.share}: the middle amount. The question asks for ${pc(p)} of it.` },
    { v: pctOf(p, other), mc: MC.otherPart, say: `That is ${pc(p)} of ${c.other}. The percent belongs to ${c.share}.` },
    { v: pctOf(p, (T * [a, b][c.w]!) / [a, b][1 - c.w]!), mc: MC.otherPart, say: `${rt} compares the two parts. ${cap(c.share)} is ${[a, b][c.w]} of every ${a + b} parts of the total.` },
    { v: r4(part - ans), say: `That is the other ${pc(100 - p)} of ${c.share}. The question asks for the ${pc(p)}.` },
  ];
  return {
    id: `ratioPercent-${n}`, family: 'ratioPercent', prompt: `${c.setup(A(c.fmt(T)), B(rt))} ${c.pct(`<b>${pc(p)}</b>`)} ${c.ask}`,
    board: `${isMoney ? '\\$' : ''}${tn(T)} \\xrightarrow{\\;${a}:${b}\\;} \\text{${c.names[c.w]}} \\xrightarrow{\\;${p}\\%\\;} \\,?`,
    input: 'num', unit: c.unit, answer: { kind: 'num', v: ans }, picture: { chain: rpPic(x) },
    solution: rpSolution(x),
    check: numCheck(ans, isMoney, `Yes: ${c.share} is ${c.fmt(part)}, and ${pc(p)} of it is ${c.fmt(ans)}.`, `Share ${c.fmt(T)} in the ratio ${rt} first. ${cap(c.share)} is the whole for the ${pc(p)}.`, wrongs),
  };
};

// =========================== 6 chain-percent-then-ratio ===========================
interface PRC { id: string; money: boolean; unit: string; fmt: (v: number) => string; whole: string; keptName: string; keepP: boolean; names: [string, string]; w: 0 | 1;
  setup: (T: string, p: string) => string; split: (rt: string) => string; ask: string; units: readonly number[] }
const PRCS: readonly PRC[] = [
  { id: 'tickets', money: false, unit: 'tickets', fmt: v => `${nf(v)} tickets`, whole: 'printed', keptName: 'sold', keepP: true, names: ['adult', 'student'], w: 1, units: [10, 12, 15, 20, 30],
    setup: (T, p) => `The school play printed ${T}, and ${p} of them were sold.`, split: rt => `The tickets sold were adult to student ${rt}.`, ask: 'How many student tickets were sold?' },
  { id: 'prize', money: true, unit: 'dollars', fmt: money, whole: 'prize', keptName: 'after tax', keepP: false, names: ['Lena', 'Omar'], w: 1, units: [12, 15, 20, 24, 30, 40],
    setup: (T, p) => `Lena and Omar win a ${T} prize, and ${p} is taken out for taxes.`, split: rt => `They split the rest, Lena to Omar ${rt}.`, ask: 'How much does Omar get?' },
  { id: 'clubs', money: false, unit: 'students', fmt: v => `${nf(v)} students`, whole: 'grade 7', keptName: 'in clubs', keepP: true, names: ['chess', 'art'], w: 0, units: [6, 8, 10, 12, 15],
    setup: (T, p) => `There are ${T} in grade 7, and ${p} of them joined an after-school club.`, split: rt => `The club members chose chess or art in the ratio ${rt}.`, ask: 'How many chose chess?' },
  { id: 'fund', money: true, unit: 'dollars', fmt: money, whole: 'raised', keptName: 'left', keepP: false, names: ['library', 'band'], w: 1, units: [15, 20, 25, 30, 40, 50],
    setup: (T, p) => `A fundraiser raised ${T}, and ${p} of it paid for costs.`, split: rt => `The rest was split, library to band, ${rt}.`, ask: 'How much did the band get?' },
];
const percentRatio: Gen = (R, n, sg) => {
  const c = pick(R, PRCS), calc = c.money && useCalc(R, sg);
  let a = 3, b = 2, s = 5, u = 20, T = 200, k = 50, p = 50;
  let found = false;
  for (let t = 0; t < 600 && !found; t++) {
    [a, b] = pick(R, PAIRS); s = a + b; u = calc ? int(R, 6, 60) : pick(R, c.units);
    p = pick(R, c.keepP ? [75, 80, 60, 90, 40, 25] : calc ? [12, 15, 35, 8] : [20, 25, 10, 40, 50]);
    k = c.keepP ? p : 100 - p;
    T = (u * s * 100) / k;
    found = isWhole(T) && T >= 40 && T <= 2000;
  }
  if (!found) { [a, b] = [3, 2]; s = 5; u = c.units[0]!; p = c.keepP ? 80 : 20; k = 80; T = (u * s * 100) / k; }
  const kept = u * s, removed = r4(T - kept), parts = [a * u, b * u], ans = parts[c.w]!, rt = `${a} : ${b}`, tot = c.fmt(T);
  const wrongs: Wrong[] = [
    { v: r4((T * [a, b][c.w]!) / s), mc: MC.postChangeRatio, say: `That splits all ${tot}. The ratio is about the ${c.keptName === 'sold' ? 'tickets sold' : c.keptName === 'in clubs' ? 'club members' : 'amount left'}, so find that first.` },
    { v: kept, mc: MC.lostIntermediate, say: `${c.fmt(kept)} is the middle amount. Now split it ${rt}.` },
    { v: r4((removed * [a, b][c.w]!) / s), mc: c.keepP ? MC.lostIntermediate : MC.changeAsFinal, say: `That splits the ${c.keepP ? 'other' : 'removed'} ${pc(100 - k)}. Split the ${pc(k)} that ${c.keepP ? 'the ratio is about' : 'is left'}.` },
    { v: parts[1 - c.w]!, say: `That is the ${c.names[1 - c.w]} share. The question asks about ${c.names[c.w]}.` },
  ];
  const R0: CRow = { title: c.whole, lead: c.fmt(T).replace(/ (tickets|students)$/, ''), base: T, ticks: tickCount(k),
    pieces: [{ amt: kept, role: 'whole', inside: pc(k), under: c.fmt(kept).replace(/ (tickets|students)$/, '') }, { amt: removed, role: 'cut', inside: pc(100 - k) }] };
  const R1: CRow = { title: c.keptName, lead: c.fmt(kept).replace(/ (tickets|students)$/, ''), base: kept, zoomFrom: { row: 0, a: 0, b: kept }, units: s <= 12 ? s : undefined,
    pieces: parts.map((v, j) => ({ amt: v, role: j === c.w ? 'answer' as const : 'rest' as const, inside: c.names[j], under: c.fmt(v).replace(/ (tickets|students)$/, '') })) };
  const pic: ChainPic = { chain: { rows: [R0, R1] }, ask: [{ r: 1, j: c.w }],
    given: ['r0', 't0', 'L0', 's0', 'k0', 'n0.0', 'n0.1', 'z1', 'r1', 't1', 's1', 'u1', 'n1.0', 'n1.1', `v1.${c.w}`],
    steps: [`${dec(k)} \\times ${tn(T)} = ${tn(kept, c.money)}`, `${tn(kept, c.money)} \\div ${s} = ${tn(u)}`, `${[a, b][c.w]} \\times ${tn(u)} = ${tn(ans, c.money)}`] };
  return {
    id: `percentRatio-${n}`, family: 'percentRatio', prompt: `${c.setup(A(tot), `<b>${pc(p)}</b>`)} ${c.split(B(rt))} ${c.ask}`,
    board: `${c.money ? '\\$' : ''}${tn(T)} \\xrightarrow{\\;${p}\\%\\;} \\text{${c.keptName}} \\xrightarrow{\\;${a}:${b}\\;} \\,?`,
    input: 'num', unit: c.unit, answer: { kind: 'num', v: ans }, picture: { chain: pic },
    solution: [`Percent step: ${c.keepP ? `${pc(p)} of ${tot}` : `${pc(100 - p)} of ${tot} is left`} = ${c.fmt(kept)}. That is the whole for the ratio step.`,
      `Ratio step: ${a} + ${b} = ${s} parts, ${c.fmt(kept)} ÷ ${s} = ${c.fmt(u)} per part.`, `${cap(c.names[c.w])}: ${[a, b][c.w]} × ${c.fmt(u)} = ${c.fmt(ans)}.`],
    check: numCheck(ans, c.money, `Yes: first ${c.fmt(kept)}, then ${[a, b][c.w]} of ${s} parts of it is ${c.fmt(ans)}.`, `Do the percent step first: the ratio is about the ${c.keptName === 'sold' ? 'tickets sold' : c.keptName === 'in clubs' ? 'club members' : 'amount left'}.`, wrongs),
  };
};

// =========================== 7 successive-percents ===========================
/** a chain of percent changes on a changing whole, exact in cents */
interface Change { p: number; up: boolean }
function runChanges(P: number, ch: readonly Change[]): number[] {
  const out = [P];
  for (const c of ch) out.push(r4(out[out.length - 1]! * (100 + (c.up ? c.p : -c.p)) / 100));
  return out;
}
function changeRows(vals: number[], ch: readonly Change[], titles: string[]): ChainPic {
  const rows: CRow[] = [];
  ch.forEach((c, i) => {
    const v = vals[i]!, next = vals[i + 1]!, d = r4(Math.abs(next - v));
    const pieces = c.up ? [{ amt: v, role: 'whole' as const, inside: '100%' }, { amt: d, role: 'add' as const, inside: `+${c.p}%`, under: money(d) }]
      : [{ amt: next, role: 'whole' as const, inside: pc(100 - c.p) }, { amt: d, role: 'cut' as const, inside: `−${c.p}%`, under: money(d) }];
    const prev = i > 0 ? vals[i]! : 0;
    rows.push({ title: titles[i]!, lead: money(v), base: v, ticks: tickCount(c.p), pieces, ...(i > 0 ? { zoomFrom: { row: i - 1, a: 0, b: prev } } : {}) });
  });
  const F = vals[vals.length - 1]!;
  rows.push({ title: titles[ch.length]!, lead: '', base: vals[ch.length - 1]!, zoomFrom: undefined, pieces: [{ amt: F, role: 'answer', under: money(F) }] });
  const last = rows.length - 1;
  return {
    chain: { rows },
    given: ['r0', 't0', 'L0', 's0', 'k0', 'n0.0', 'n0.1', ...rows.slice(1, -1).flatMap((_, j) => [`z${j + 1}`, `r${j + 1}`, `t${j + 1}`, `s${j + 1}`, `k${j + 1}`, `n${j + 1}.0`, `n${j + 1}.1`]), `r${last}`, `t${last}`, `s${last}`, `v${last}.0`],
    ask: [{ r: last, j: 0 }],
    steps: ch.map((c, i) => `${tn(vals[i]!, true)} \\times ${tn(r4(1 + (c.up ? c.p : -c.p) / 100))} = ${tn(vals[i + 1]!, true)}`),
  };
}
/** a start price (dollars) whose chain stays in whole cents */
function exactStart(R: () => number, ch: readonly Change[], list: readonly number[]): number {
  for (let t = 0; t < 200; t++) { const P = pick(R, list); if (runChanges(P, ch).every(isCents)) return P; }
  return 100;
}
const twoChanges: Gen = (R, n) => {
  const kind = pick(R, ['tax', 'markup', 'downup', 'tip', 'tax'] as const);
  let ch: Change[], P: number, prompt: string, titles: string[];
  if (kind === 'tax') {
    ch = [{ p: pick(R, [10, 20, 25, 30, 40, 50]), up: false }, { p: pick(R, [5, 6, 8, 10]), up: true }];
    P = exactStart(R, ch, [40, 50, 60, 80, 120, 150, 200, 75, 90]);
    prompt = `A ${A(money(P))} jacket is <b>${ch[0]!.p}% off</b>. Then <b>${ch[1]!.p}% sales tax</b> is added to the sale price. What is the total?`;
    titles = ['price', 'sale', 'total'];
  } else if (kind === 'markup') {
    ch = [{ p: pick(R, [20, 25, 40, 50]), up: true }, { p: pick(R, [10, 20, 25]), up: false }];
    P = exactStart(R, ch, [40, 60, 80, 100, 120, 160, 200]);
    prompt = `A store pays ${A(money(P))} for a bike and marks the price up <b>${ch[0]!.p}%</b>. In a sale it takes <b>${ch[1]!.p}% off</b> that price. What is the sale price?`;
    titles = ['cost', 'price', 'sale'];
  } else if (kind === 'downup') {
    const p = pick(R, [10, 20, 25, 50]);
    ch = [{ p, up: false }, { p, up: true }];
    P = exactStart(R, ch, [40, 60, 80, 100, 120, 200]);
    prompt = `A video game costs ${A(money(P))}. Its price drops <b>${p}%</b>, then rises <b>${p}%</b> of the new price. What does it cost now?`;
    titles = ['start', 'after', 'now'];
  } else {
    ch = [{ p: pick(R, [5, 8, 10]), up: true }, { p: pick(R, [15, 20, 25]), up: true }];
    P = exactStart(R, ch, [20, 40, 60, 80, 100, 50]);
    prompt = `Lunch costs ${A(money(P))} before tax. Tax is <b>${ch[0]!.p}%</b>, and the tip is <b>${ch[1]!.p}% of the bill with tax</b>. What is the total?`;
    titles = ['lunch', 'with tax', 'total'];
  }
  const vals = runChanges(P, ch), F = vals[2]!, net = (ch[0]!.up ? ch[0]!.p : -ch[0]!.p) + (ch[1]!.up ? ch[1]!.p : -ch[1]!.p);
  const wrongs: Wrong[] = [
    { v: r4(P * (100 + net) / 100), mc: MC.addsPercents, say: `That adds the percents (${net >= 0 ? '+' : '−'}${Math.abs(net)}%) as if both were of ${money(P)}. The second percent is of the new whole, ${money(vals[1]!)}.` },
    { v: vals[1]!, mc: MC.lostIntermediate, say: `${money(vals[1]!)} is after the first change only. Now take ${ch[1]!.p}% of ${money(vals[1]!)}.` },
    { v: r4(Math.abs(F - vals[1]!)), mc: MC.changeAsFinal, say: `That is the size of the second change. Add it to ${ch[1]!.up ? '' : 'or take it from '}${money(vals[1]!)}.` },
  ];
  return {
    id: `twoChanges-${n}`, family: 'twoChanges', prompt, board: `\\$${tn(P)}\\ ${ch.map(c => `\\xrightarrow{\\;${c.up ? '+' : '-'}${c.p}\\%\\;}`).join('\\,?\\,')}\\ ?`,
    input: 'num', unit: 'dollars', answer: { kind: 'num', v: F }, picture: { chain: changeRows(vals, ch, titles) },
    solution: [`Step 1: ${ch[0]!.up ? '+' : '−'}${ch[0]!.p}% of ${money(P)}: ${money(P)} × ${tn(r4(1 + (ch[0]!.up ? ch[0]!.p : -ch[0]!.p) / 100))} = ${money(vals[1]!)}.`,
      `${money(vals[1]!)} is the new whole (100%).`, `Step 2: ${money(vals[1]!)} × ${tn(r4(1 + (ch[1]!.up ? ch[1]!.p : -ch[1]!.p) / 100))} = ${money(F)}.`],
    check: numCheck(F, true, `Yes: ${money(P)} → ${money(vals[1]!)} → ${money(F)}. The second percent is of the new whole.`, `Do one change at a time. After the first change, the new amount is the whole for the second.`, wrongs),
  };
};

// =========================== 8 percent-multiplier ===========================
const multiplier: Gen = (R, n) => {
  const kinds = [
    { w: (p: number) => `${p}% off`, up: false }, { w: (p: number) => `${an(p)} ${p}% raise`, up: true }, { w: (p: number) => `${p}% sales tax added`, up: true },
    { w: (p: number) => `${an(p)} ${p}% decrease`, up: false }, { w: (p: number) => `${an(p)} ${p}% increase`, up: true }, { w: (p: number) => `${an(p)} ${p}% markup`, up: true },
  ];
  const k = pick(R, kinds);
  const p = k.up ? pick(R, [20, 15, 25, 7, 8, 6, 7.25, 8.5, 5, 150, 120, 40]) : pick(R, [20, 15, 25, 30, 12, 40, 35, 5, 60]);
  const m = r4(1 + (k.up ? p : -p) / 100), ch = r4(p / 100);
  const opts: Opt[] = [{ t: `× ${tn(m)}`, ok: true, say: k.up ? `Yes: 100% + ${pc(p)} = ${pc(100 + p)}, and ${pc(100 + p)} = ${tn(m)}.` : `Yes: 100% − ${pc(p)} = ${pc(100 - p)} is left, and ${pc(100 - p)} = ${tn(m)}.` },
    { t: `× ${tn(ch)}`, mc: MC.changeAsFinal, say: `× ${tn(ch)} gives only the change (${pc(p)}), not the new amount. Keep the 100% too.` }];
  if (k.up && p > 100) {
    opts[1] = { t: `× ${tn(ch)}`, mc: MC.dropsHundred, say: `× ${tn(ch)} leaves out the original 100%. An increase of ${pc(p)} makes ${pc(100 + p)}.` };
    opts.push({ t: `× ${tn(p)}`, mc: MC.noDivide100, say: `${pc(p)} is ${tn(ch)}, not ${p}. And the new amount keeps the old 100%.` });
  } else if (k.up && p < 10 && isWhole(p)) opts.push({ t: `× ${tn(r4(1 + p / 10))}`, mc: MC.appendDigits, say: `${pc(p)} is ${tn(ch)}, so the multiplier is 1 + ${tn(ch)} = ${tn(m)}, not 1.${p}.` });
  else opts.push({ t: `× ${tn(r4(1 + (k.up ? -p : p) / 100))}`, mc: MC.wrongDir, say: k.up ? 'That multiplier is below 1, so it makes the amount smaller. An increase needs a multiplier above 1.' : 'That multiplier is above 1, so it makes the amount bigger. A decrease needs a multiplier below 1.' });
  return {
    id: `multiplier-${n}`, family: 'multiplier', prompt: `Write <b>${k.w(p)}</b> as one multiplier: new amount = old amount × ?`,
    board: `\\text{new} = \\text{old} \\times \\,?`, input: 'choice', ...choose(R, opts),
    solution: [k.up ? `The new amount is 100% + ${pc(p)} = ${pc(100 + p)} of the old amount.` : `The new amount is 100% − ${pc(p)} = ${pc(100 - p)} of the old amount.`, `${pc(k.up ? 100 + p : 100 - p)} = ${tn(m)}, so multiply by ${tn(m)}.`],
  };
};
const chainProduct: Gen = (R, n) => {
  const kind = pick(R, ['taxd', 'share', 'updown'] as const);
  let prompt = '', opts: Opt[] = [], board = '', sol: string[] = [];
  if (kind === 'taxd') {
    const P = pick(R, [80, 60, 120, 50, 200]), d = pick(R, [25, 20, 30, 40]), t = pick(R, [8, 6, 7, 5]);
    const m1 = r4(1 - d / 100), m2 = r4(1 + t / 100), net = r4(1 + (t - d) / 100);
    prompt = `A ${A(money(P))} coat is ${d}% off, then ${t}% sales tax is added to the sale price. Which one line gives the total?`;
    board = `\\$${P},\\ -${d}\\%,\\ +${t}\\%`;
    opts = [{ t: `${P} × ${tn(m1)} × ${tn(m2)}`, ok: true, say: `Yes: × ${tn(m1)} leaves ${100 - d}%, then × ${tn(m2)} adds ${t}% of the new whole.` },
      { t: `${P} × ${tn(net)}`, mc: MC.addsPercents, say: `That adds −${d}% and +${t}% as if both were of ${money(P)}. The tax is of the sale price.` },
      { t: `${P} × ${tn(r4(d / 100))} × ${tn(r4(t / 100))}`, mc: MC.changeAsFinal, say: `× ${tn(r4(d / 100))} gives the discount, not the price you pay. Use what is left: × ${tn(m1)}.` }];
    sol = [`${d}% off: × ${tn(m1)}. ${t}% tax on the new price: × ${tn(m2)}.`, `Total = ${P} × ${tn(m1)} × ${tn(m2)} = ${money(P * m1 * m2)}.`];
  } else if (kind === 'share') {
    const [a, b] = pick(R, PAIRS.filter(q => q[0] !== q[1])), s = a + b, T = s * pick(R, [20, 30, 40, 50]), p = pick(R, [20, 25, 10, 50]);
    prompt = `${A(money(T))} is shared, Kai to Lu ${B(`${a} : ${b}`)}. Kai saves ${p}% of his share. Which one line gives Kai’s savings?`;
    board = `\\$${T},\\ ${a}:${b},\\ ${p}\\%`;
    opts = [{ t: `${T} × ${a}/${s} × ${tn(r4(p / 100))}`, ok: true, say: `Yes: × ${a}/${s} is Kai’s share, then × ${tn(r4(p / 100))} is ${p}% of that share.` },
      { t: `${T} × ${a}/${b} × ${tn(r4(p / 100))}`, mc: MC.otherPart, say: `${a}/${b} compares Kai with Lu. Kai’s share of the total is ${a} out of ${s} parts: ${a}/${s}.` },
      { t: `${T} × ${tn(r4(p / 100))}`, mc: MC.wrongWhole, say: `That is ${p}% of all ${money(T)}. The ${p}% is of Kai’s share only.` }];
    sol = [`Kai’s share: × ${a}/${s}. Then ${p}% of it: × ${tn(r4(p / 100))}.`, `${T} × ${a}/${s} × ${tn(r4(p / 100))} = ${money(T * a / s * p / 100)}.`];
  } else {
    const P = pick(R, [50, 80, 100, 200, 60]), p = pick(R, [20, 10, 25, 50]);
    prompt = `A ${A(money(P))} stock goes up ${p}%, then down ${p}% of its new value. Which one line gives its value now?`;
    board = `\\$${P},\\ +${p}\\%,\\ -${p}\\%`;
    opts = [{ t: `${P} × ${tn(r4(1 + p / 100))} × ${tn(r4(1 - p / 100))}`, ok: true, say: `Yes. The ${p}% down is of the bigger value, so it takes off more than the ${p}% up added.` },
      { t: `${P} × 1`, mc: MC.addsPercents, say: `+${p}% and −${p}% don’t cancel: they are percents of different wholes.` },
      { t: `${P} × ${tn(r4(p / 100))} × ${tn(r4(p / 100))}`, mc: MC.changeAsFinal, say: `× ${tn(r4(p / 100))} gives the change only. Up ${p}% is × ${tn(r4(1 + p / 100))}.` }];
    sol = [`Up ${p}%: × ${tn(r4(1 + p / 100))}. Down ${p}% of the new value: × ${tn(r4(1 - p / 100))}.`, `${P} × ${tn(r4(1 + p / 100))} × ${tn(r4(1 - p / 100))} = ${money(P * (1 + p / 100) * (1 - p / 100))}.`];
  }
  return { id: `chainProduct-${n}`, family: 'chainProduct', prompt, board, input: 'choice', ...choose(R, opts), solution: sol };
};

// =========================== 9 rounding-policy ===========================
/** total in cents of a cents price, d% off, then a tax of t basis points: round each step, or only the end */
export function roundingTotals(Pc: number, d: number, tbp: number): { each: number; end: number; sale: number; saleExact: number } {
  const saleN = Pc * (100 - d);                          // sale price in 1/100 cent
  const sale = roundDiv(saleN, 100);
  const tax = roundDiv(sale * tbp, 10000);
  const each = sale + tax;
  const end = roundDiv(saleN * (10000 + tbp), 1000000);
  return { each, end, sale, saleExact: saleN / 100 };
}
const ROUND_P = [1999, 2499, 2995, 3499, 4999, 1295, 5999, 7995, 899, 1449, 6495, 2295, 3995, 1799, 2795, 4495];
const ROUND_D = [15, 35, 45, 12, 33, 25, 30, 18, 22];
const ROUND_T = [725, 825, 650, 875, 625, 475, 925, 575];
const rounding: Gen = (R, n) => {
  let Pc = 2499, d = 35, t = 825, T = roundingTotals(Pc, d, t);
  for (let i = 0; i < 400; i++) {
    const P2 = pick(R, ROUND_P), d2 = pick(R, ROUND_D), t2 = pick(R, ROUND_T), T2 = roundingTotals(P2, d2, t2);
    const ties = (P2 * (100 - d2)) % 100 === 50 || (T2.sale * t2) % 10000 === 5000 || (P2 * (100 - d2) * (10000 + t2)) % 1000000 === 500000;
    if (T2.each !== T2.end && (P2 * (100 - d2)) % 100 !== 0 && !ties) { Pc = P2; d = d2; t = t2; T = T2; break; }
  }
  const each = R() < 0.5, ans = (each ? T.each : T.end) / 100, other = (each ? T.end : T.each) / 100, tp = t / 100;
  const policy = each ? 'The store rounds the sale price to the cent first, then rounds the tax to the cent.' : 'Keep every digit until the end, then round the total to the cent.';
  const saleX = T.saleExact / 100;
  return {
    id: `rounding-${n}`, family: 'rounding', prompt: `A ${A(money(Pc / 100))} lamp is <b>${d}% off</b>, and <b>${nf(tp)}% sales tax</b> is added to the sale price. <b>${policy}</b> What is the total? (You may use a calculator.)`,
    board: `\\$${tn(Pc / 100, true)}\\ \\xrightarrow{\\;-${d}\\%\\;}\\ \\xrightarrow{\\;+${tn(tp)}\\%\\;}\\ ?`, input: 'num', unit: 'dollars', answer: { kind: 'num', v: ans },
    solution: each ? [`Sale price: ${money(Pc / 100)} × ${tn(r4(1 - d / 100))} = ${nf(saleX)} → round: ${money(T.sale / 100)}.`, `Tax: ${nf(tp)}% of ${money(T.sale / 100)} = ${nf(r4((T.sale * t) / 1000000))} → round: ${money(Math.round(T.sale * t / 10000) / 100)}.`, `Total: ${mark(money(ans))}.`]
      : [`Sale price: ${money(Pc / 100)} × ${tn(r4(1 - d / 100))} = ${nf(saleX)} (keep all the digits).`, `Total: ${nf(saleX)} × ${r4(1 + tp / 100)} = ${nf(Math.round(saleX * (1 + tp / 100) * 1e6) / 1e6)} → round once: ${mark(money(ans))}.`],
    check: numCheck(ans, true, `Yes: ${money(ans)}. ${each ? 'Each billed amount is rounded as you go.' : 'Rounding only once keeps the most exact total.'}`,
      each ? 'Round the sale price to the cent, find the tax on that, round the tax, then add.' : 'Keep every digit of the sale price, multiply, and round only the total.',
      [{ v: other, mc: each ? undefined : MC.roundsEarly, say: each ? 'That keeps every digit. This store rounds the sale price and the tax as it bills them.' : 'You rounded the sale price early. The rule here is: round only the total.' },
        { v: Math.floor(saleX * (1 + tp / 100) * 100) / 100, say: 'That cuts the digits off. Round to the nearest cent instead.' }]),
  };
};

// =========================== 10 audit-wrong-whole ===========================
const audit: Gen = (R, n) => {
  const kind = pick(R, ['share', 'tax', 'adds', 'tip'] as const);
  let story = '', lines: string[] = [], bad = -1, why = '', board = '';
  const ok = R() < 0.3;
  if (kind === 'share') {
    const x = rpNumbers(R, RCS[0]!, false), { a, b, s, T, part, p, ans } = x;
    story = `Budget ${money(T)}, art to music ${a} : ${b}. Art spends ${p}% of its share on paint. Find the paint money.`;
    board = `\\$${tn(T)},\\ ${a}:${b},\\ ${p}\\%`;
    const mode = ok ? 0 : pick(R, [1, 2]);
    if (mode === 1) { lines = [`Art’s share: ${money(T)} ÷ ${s} × ${a} = ${money(part)}`, `Paint: ${p}% of ${money(T)} = ${money(pctOf(p, T))}`]; bad = 1; why = `Line 2 takes ${p}% of the whole budget. The ${p}% is of art’s share, ${money(part)}.`; }
    else if (mode === 2 && isCents((T * a) / b)) { const wr = r4((T * a) / b); lines = [`Art’s share: ${a}/${b} of ${money(T)} = ${money(wr)}`, `Paint: ${p}% of ${money(wr)} = ${money(pctOf(p, wr))}`]; bad = 0; why = `Line 1 reads ${a} : ${b} as ${a}/${b} of the budget. Art gets ${a} of every ${s} parts: ${a}/${s}.`; }
    else { lines = [`Art’s share: ${money(T)} ÷ ${s} × ${a} = ${money(part)}`, `Paint: ${p}% of ${money(part)} = ${money(ans)}`]; bad = -1; }
  } else if (kind === 'tax') {
    const P = pick(R, [40, 60, 80, 120, 200]), d = pick(R, [25, 20, 50, 10]), t = pick(R, [5, 10, 8]), S = P * (100 - d) / 100;
    story = `A ${money(P)} jacket is ${d}% off, then ${t}% tax is added to the sale price. Find the total.`;
    board = `\\$${P},\\ -${d}\\%,\\ +${t}\\%`;
    const X = ok ? pctOf(t, S) : pctOf(t, P);
    lines = [`Sale price: ${money(P)} − ${d}% of ${money(P)} = ${money(S)}`, `Tax: ${t}% of ${money(ok ? S : P)} = ${money(X)}`, `Total: ${money(S)} + ${money(X)} = ${money(S + X)}`];
    bad = ok ? -1 : 1; why = `Line 2 finds the tax on ${money(P)}. The tax is on the sale price, ${money(S)}.`;
  } else if (kind === 'adds') {
    const P = pick(R, [80, 100, 50, 200]), d = pick(R, [20, 30, 40, 25]), t = pick(R, [5, 10, 8]);
    story = `A ${money(P)} bike is ${d}% off, then ${t}% tax is added to the sale price. Find the total.`;
    board = `\\$${P},\\ -${d}\\%,\\ +${t}\\%`;
    if (ok) { const S = P * (100 - d) / 100; lines = [`Sale price: ${money(P)} × ${tn(r4(1 - d / 100))} = ${money(S)}`, `Total: ${money(S)} × ${tn(r4(1 + t / 100))} = ${money(r4(S * (100 + t) / 100))}`]; bad = -1; }
    else { lines = [`${d}% off and ${t}% tax make ${d - t}% off in all.`, `Total: ${money(P)} × ${tn(r4(1 - (d - t) / 100))} = ${money(r4(P * (100 - d + t) / 100))}`]; bad = 0; why = `Line 1 adds the percents. The ${t}% is of the sale price, not of ${money(P)}, so they can’t be added.`; }
  } else {
    const Bl = pick(R, [40, 60, 80, 100]), t = pick(R, [5, 10]), q = pick(R, [15, 20]), X = Bl * t / 100;
    story = `Dinner is ${money(Bl)} before tax, plus ${t}% tax. The tip is ${q}% of the bill <b>before</b> tax. Find the tip.`;
    board = `\\$${Bl},\\ ${t}\\%\\ \\text{tax},\\ ${q}\\%\\ \\text{tip}`;
    lines = [`Tax: ${t}% of ${money(Bl)} = ${money(X)}`, `Bill with tax: ${money(Bl)} + ${money(X)} = ${money(Bl + X)}`, `Tip: ${q}% of ${money(ok ? Bl : Bl + X)} = ${money(pctOf(q, ok ? Bl : Bl + X))}`];
    bad = ok ? -1 : 2; why = `Line 3 tips on the bill with tax. The story says before tax: ${q}% of ${money(Bl)}.`;
  }
  const opts: Opt[] = lines.map((_, i) => ({ t: `Line ${i + 1}`, ok: i === bad, mc: undefined,
    say: i === bad ? `Yes. ${why}` : bad < 0 ? `Line ${i + 1} is fine. Every line uses the whole the story names.` : `Line ${i + 1} is fine. ${why}` }));
  opts.push({ t: 'Every line is right', ok: bad < 0, mc: bad < 0 ? undefined : MC.arithmeticOk,
    say: bad < 0 ? 'Yes. Each step uses the whole the story names.' : `Right arithmetic is not enough. ${why}` });
  const ch = choose(R, opts, true);
  return { id: `audit-${n}`, family: 'audit', prompt: `${story} Which line uses the wrong amount, if any? (The arithmetic is right.)<br>${lines.map((l, i) => `<b>${i + 1}.</b> ${l}`).join('<br>')}`,
    board, input: 'choice', ...ch, solution: ['For each percent step, ask: of which amount does the story say?'] };
};

// =========================== 11 check-against-relationships ===========================
const checkShares: Gen = (R, n) => {
  const [a, b] = pick(R, PAIRS.filter(q => q[0] !== q[1])), s = a + b, u = pick(R, [10, 12, 15, 20, 25, 30, 40]), T = s * u;
  const who = pick(R, ['Jo', 'Sam', 'Priya', 'Eli']);
  const kind = pick(R, ['ok', 'swap', 'shift', 'unit'] as const);
  let x = a * u, y = b * u, said = T;
  if (kind === 'swap') [x, y] = [y, x];
  else if (kind === 'shift') { const d = Math.min(pick(R, [5, 10]), Math.floor((b * u) / 2)); x += d; y -= d; }
  else if (kind === 'unit') { const u2 = u + pick(R, [2, 5]); x = a * u2; y = b * u2; }
  said = T;
  const sumOk = x + y === T, ratioOk = x * b === y * a;
  const opts: Opt[] = [
    { t: `Right: they add to ${money(T)} and are in the ratio ${a} : ${b}`, ok: sumOk && ratioOk, mc: !ratioOk && sumOk ? MC.totalMatches : undefined,
      say: sumOk && ratioOk ? `Yes: ${money(x)} + ${money(y)} = ${money(T)}, and ${x} : ${y} = ${a} : ${b}.` : sumOk ? `They do add to ${money(T)}, but ${x} : ${y} is not ${a} : ${b}. A matching total is not enough.` : `${money(x)} + ${money(y)} = ${money(x + y)}, not ${money(T)}.` },
    { t: `Wrong: they add to ${money(T)}, but are not in the ratio ${a} : ${b}`, ok: sumOk && !ratioOk,
      say: sumOk && !ratioOk ? `Yes: ${x} ÷ ${a} = ${nf(x / a)} but ${y} ÷ ${b} = ${nf(y / b)}. The parts are not equal-sized.` : !sumOk ? `Check the total: ${money(x)} + ${money(y)} = ${money(x + y)}.` : `${x} ÷ ${a} = ${y} ÷ ${b} = ${nf(x / a)}: the ratio fits.` },
    { t: `Wrong: they are in the ratio ${a} : ${b}, but don’t add to ${money(T)}`, ok: !sumOk && ratioOk,
      say: !sumOk && ratioOk ? `Yes: ${x} : ${y} = ${a} : ${b}, but ${money(x)} + ${money(y)} = ${money(x + y)}, not ${money(T)}.` : `Add them: ${money(x)} + ${money(y)} = ${money(x + y)}.` },
  ];
  return { id: `checkShares-${n}`, family: 'checkShares', prompt: `${who} shared ${A(money(said))} in the ratio ${B(`${a} : ${b}`)} and got ${A(money(x))} and ${A(money(y))}. Check it against both facts in the story.`,
    board: `${x} + ${y} \\overset{?}{=} ${T},\\quad ${x} : ${y} \\overset{?}{=} ${a} : ${b}`, input: 'choice', ...choose(R, opts, true),
    solution: [`Total: ${money(x)} + ${money(y)} = ${money(x + y)} ${x + y === T ? '✓' : `≠ ${money(T)}`}.`, `Ratio: one part = ${x} ÷ ${a} = ${nf(x / a)} and ${y} ÷ ${b} = ${nf(y / b)} ${ratioOk ? '✓ equal' : '✗ not equal'}.`] };
};

// =========================== 12 backward-check ===========================
const undo: Gen = (R, n, sg) => {
  const kind = pick(R, ['tax', 'share', 'downup'] as const);
  if (kind === 'share') {
    const x = rpNumbers(R, RCS[0]!, useCalc(R, sg)), { a, b, s, T, part, p, ans } = x;
    const music = r4((part * b) / a);
    return {
      id: `undo-${n}`, family: 'undo', prompt: `Art spent ${A(money(ans))} on paint, which is <b>${p}%</b> of art’s share. The club’s budget was split art to music ${B(`${a} : ${b}`)}. What was the whole budget?`,
      board: `? \\xrightarrow{\\;${a}:${b}\\;} \\text{art} \\xrightarrow{\\;${p}\\%\\;} \\$${tn(ans, true)}`, input: 'num', unit: 'dollars', answer: { kind: 'num', v: T },
      solution: [`Undo the last step first: ${money(ans)} is ${p}% of art’s share, so art’s share = ${money(ans)} ÷ ${dec(p)} = ${money(part)}.`, `Undo the ratio step: art is ${a} of ${s} parts, so one part = ${money(part)} ÷ ${a} = ${money(r4(part / a))}.`, `Budget: ${s} × ${money(r4(part / a))} = ${mark(money(T))}. Check: ${p}% of ${a}/${s} of ${money(T)} = ${money(ans)} ✓`],
      check: numCheck(T, true, `Yes: art’s share was ${money(part)}, and ${money(part)} is ${a} of ${s} parts of ${money(T)}.`, 'Undo the percent step first (find art’s share), then rebuild the budget from the ratio.', [
        { v: part, mc: MC.lostIntermediate, say: `${money(part)} is art’s share. The question asks for the whole budget.` },
        { v: music, mc: MC.otherPart, say: `${money(music)} is music’s share. Add art’s share to it, or use ${s} parts.` },
        { v: r4(ans * (100 + p) / 100), mc: MC.oppositePct, say: `Adding ${p}% back doesn’t undo “${p}% of”. ${money(ans)} is ${p}% of art’s share, so divide by ${dec(p)}.` },
        { v: r4(part * s), say: `One part is ${money(part)} ÷ ${a}, not ${money(part)}.` },
      ]),
    };
  }
  const ch: Change[] = kind === 'tax' ? [{ p: pick(R, [20, 25, 10, 50]), up: false }, { p: pick(R, [5, 8, 10]), up: true }] : (() => { const p = pick(R, [10, 20, 25]); return [{ p, up: false }, { p, up: true }]; })();
  const P = exactStart(R, ch, [40, 60, 80, 100, 120, 200, 50]), vals = runChanges(P, ch), F = vals[2]!;
  const m1 = r4(1 + (ch[0]!.up ? ch[0]!.p : -ch[0]!.p) / 100), m2 = r4(1 + (ch[1]!.up ? ch[1]!.p : -ch[1]!.p) / 100);
  const opp = r4(F * (100 - ch[1]!.p) / 100 * (100 + ch[0]!.p) / 100);
  const prompt = kind === 'tax' ? `After <b>${ch[0]!.p}% off</b>, <b>${ch[1]!.p}% sales tax</b> was added to the sale price. Rosa paid ${A(money(F))}. What was the price before the discount?`
    : `A price dropped <b>${ch[0]!.p}%</b>, then rose <b>${ch[1]!.p}%</b> of the new price. It is now ${A(money(F))}. What was it at the start?`;
  const net = ch[1]!.p - ch[0]!.p;
  return {
    id: `undo-${n}`, family: 'undo', prompt, board: `? \\xrightarrow{\\times ${tn(m1)}} \\square \\xrightarrow{\\times ${tn(m2)}} \\$${tn(F, true)}`,
    input: 'num', unit: 'dollars', answer: { kind: 'num', v: P },
    solution: [`Undo the last step first: ${money(F)} ÷ ${tn(m2)} = ${money(vals[1]!)}.`, `Then undo the first: ${money(vals[1]!)} ÷ ${tn(m1)} = ${mark(money(P))}.`, `Check forward: ${money(P)} × ${tn(m1)} × ${tn(m2)} = ${money(F)} ✓`],
    check: numCheck(P, true, `Yes: ${money(F)} ÷ ${tn(m2)} = ${money(vals[1]!)}, and ${money(vals[1]!)} ÷ ${tn(m1)} = ${money(P)}.`, `Undo each step with its own divide, last step first: ÷ ${tn(m2)}, then ÷ ${tn(m1)}.`, [
      { v: opp, mc: MC.oppositePct, say: `Taking ${ch[1]!.p}% off and adding ${ch[0]!.p}% back uses the wrong wholes. Undo × ${tn(m2)} with ÷ ${tn(m2)}.` },
      { v: kind === 'downup' ? F : r4(F * 100 / (100 + net)), mc: MC.addsPercents, say: kind === 'downup' ? `−${ch[0]!.p}% and +${ch[1]!.p}% don’t cancel: they are percents of different wholes.` : 'That treats the two percents as one change of the start price. Undo them one at a time.' },
      { v: vals[1]!, mc: MC.lostIntermediate, say: `${money(vals[1]!)} is the price in the middle. Undo the first step too.` },
    ]),
  };
};

// =========================== 13 estimate-reasonableness ===========================
const estimate: Gen = (R, n) => {
  const kind = pick(R, ['tax', 'share'] as const);
  let prompt = '', opts: Opt[] = [], board = '', sol: string[] = [];
  if (kind === 'tax') {
    const base = pick(R, [40, 60, 80, 100, 120, 50]), P = r4(base - pick(R, [0.05, 0.01, 0.5])), d = pick(R, [20, 25, 30, 40, 50]), t = pick(R, [6, 7, 8]);
    const exact = Math.round(P * (100 - d) * (100 + t)) / 10000, big = Math.round(P * (100 + d) * (100 + t)) / 10000, small = Math.round(P * d) / 100;
    const est = base * (100 - d) / 100;
    prompt = `A ${A(money(P))} game is <b>${d}% off</b>, then ${t}% sales tax is added. Without working it out exactly, which total makes sense?`;
    board = `\\$${tn(P, true)},\\ -${d}\\%,\\ +${t}\\%`;
    opts = [{ t: money(exact), ok: true, say: `Yes: ${100 - d}% of about ${money(base)} is about ${money(est)}, and the tax adds a little.` },
      { t: money(big), mc: MC.mulBigger, say: `${d}% off makes the price smaller, and ${an(t)} ${t}% tax can’t make up for it. The total must be under ${money(P)}.` },
      { t: money(small), mc: MC.changeAsFinal, say: `That is about the size of the discount. You pay what is left: about ${money(est)}.` }];
    sol = [`Round: ${money(P)} ≈ ${money(base)}. ${100 - d}% of ${money(base)} = ${money(est)}.`, `Tax adds a little, so the total is a bit over ${money(est)}: ${money(exact)}.`];
  } else {
    const x = rpNumbers(R, RCS[0]!, false), { a, b, s, T, part, p, ans } = x;
    const tooBig = r4(part + pctOf(p, T)), whole = pctOf(p, T);
    prompt = `The club splits ${A(money(T))} art to music ${B(`${a} : ${b}`)}, and art spends ${p}% of its share on paint. Which paint amount passes a quick estimate?`;
    board = `\\$${tn(T)},\\ ${a}:${b},\\ ${p}\\%`;
    opts = [{ t: money(ans), ok: true, say: `Yes: art gets ${a} of ${s} parts, about ${money(part)}, and ${p}% of that is ${money(ans)}.` },
      { t: money(tooBig), mc: MC.noSizeCheck, say: `That is more than art’s whole share (about ${money(part)}). Paint is only part of art’s share.` },
      { t: money(whole), mc: MC.wrongWhole, say: `That is ${p}% of all ${money(T)}. Art’s share is smaller than the budget, so its ${p}% is smaller too.` }];
    sol = [`Art’s share is ${a} of ${s} parts, a bit ${a / s < 0.5 ? 'under' : 'over'} half of ${money(T)}.`, `${p}% of art’s share must be less than ${p}% of ${money(T)} (${money(whole)}).`];
  }
  return { id: `estimate-${n}`, family: 'estimate', prompt, board, input: 'choice', ...choose(R, opts), solution: sol };
};

// =========================== 14 transfer-new-context ===========================
const transfer: Gen = (R, n, sg) => {
  const kind = pick(R, ['commission', 'interest', 'garden', 'runners'] as const);
  const calc = useCalc(R, sg);
  if (kind === 'commission') {
    let S = 2000, p = 5, q = 20;
    for (let t = 0; t < 200; t++) { S = pick(R, [1200, 2000, 2400, 3000, 1500, 4000, 800]); p = pick(R, calc ? [4, 6, 7.5, 8] : [5, 10]); q = pick(R, [10, 20, 25, 50]); if (isCents(S * p * q / 10000)) break; }
    const com = r4(S * p / 100), ans = r4(com * q / 100);
    return { id: `transfer-${n}`, family: 'transfer', prompt: `Dev sold ${A(money(S))} of bikes this month. He earns <b>${nf(p)}% commission</b> and saves <b>${q}%</b> of his commission. How much does Dev save?${calc ? ' (You may use a calculator.)' : ''}`,
      board: `\\text{save} = \\,?`, input: 'num', unit: 'dollars', answer: { kind: 'num', v: ans },
      solution: [`Commission: ${nf(p)}% of ${money(S)} = ${money(com)}. That is the whole for the saving step.`, `Savings: ${q}% of ${money(com)} = ${money(ans)}.`],
      check: numCheck(ans, true, `Yes: commission ${money(com)}, and ${q}% of it is ${money(ans)}.`, 'Two percent steps. The second percent is of the commission, not of the sales.', [
        { v: r4(S * q / 100), mc: MC.wrongWhole, say: `That is ${q}% of all the sales. Dev saves ${q}% of his commission.` },
        { v: com, mc: MC.lostIntermediate, say: `${money(com)} is his commission: the middle amount. He saves ${q}% of it.` },
        { v: r4(S + com), mc: MC.commissionAdded, say: 'Commission is what Dev earns, not sales plus commission. And the question asks what he saves.' },
        { v: r4(S * (p + q) / 100), mc: MC.addsPercents, say: 'The two percents have different wholes, so they can’t be added.' },
      ]) };
  }
  if (kind === 'interest') {
    let [a, b] = pick(R, PAIRS), s = a + b, P = 1000, r = 5, found = false;
    for (let t = 0; t < 400 && !found; t++) {
      [a, b] = pick(R, PAIRS); s = a + b; P = pick(R, [500, 800, 1000, 1200, 1500, 2000, 2500]); r = pick(R, calc ? [2.5, 3.5, 4.5] : [2, 3, 4, 5, 6]);
      found = isCents((P * r / 100) / s);
    }
    if (!found) { [a, b] = [3, 2]; s = 5; P = 1000; r = 5; }
    const I = r4(P * r / 100), ans = r4(I * a / s);
    return { id: `transfer-${n}`, family: 'transfer', prompt: `Kim puts ${A(money(P))} in a savings account that pays <b>${nf(r)}% simple interest</b> for one year. She gives the interest to her cousins Ivy and Noah in the ratio ${B(`${a} : ${b}`)}. How much does Ivy get?${calc ? ' (You may use a calculator.)' : ''}`,
      board: `\\text{Ivy} = \\,?`, input: 'num', unit: 'dollars', answer: { kind: 'num', v: ans },
      solution: [`Interest: ${nf(r)}% of ${money(P)} = ${money(I)}. That is what gets shared.`, `Share ${money(I)} in ${a} : ${b}: ${money(I)} ÷ ${s} × ${a} = ${money(ans)}.`],
      check: numCheck(ans, true, `Yes: the interest is ${money(I)}, and Ivy gets ${a} of ${s} parts of it.`, 'Find the interest first, then share only the interest.', [
        { v: r4(P * a / s), mc: MC.postChangeRatio, say: `That shares all ${money(P)}. Kim only gives away the interest.` },
        { v: I, mc: MC.lostIntermediate, say: `${money(I)} is all the interest. Ivy gets ${a} of ${s} parts of it.` },
        { v: r4((P + I) * a / s), mc: MC.template, say: 'That shares the whole balance. The question is about the interest only.' },
      ]) };
  }
  if (kind === 'garden') {
    const c: RC = { ...RCS[4]!, id: 'garden', unit: 'square feet', fmt: v => `${nf(v)} sq ft`, units: [10, 12, 15, 20, 25, 30] };
    const x = rpNumbers(R, c, calc), { a, b, T, part, p, ans } = x;
    return { id: `transfer-${n}`, family: 'transfer', prompt: `A community garden of ${A(`${nf(T)} square feet`)} is split, vegetables to flowers, ${B(`${a} : ${b}`)}. Tomatoes fill <b>${pc(p)}</b> of the vegetable part. How many square feet of tomatoes are there?`,
      board: `\\text{tomatoes} = \\,?`, input: 'num', unit: 'square feet', answer: { kind: 'num', v: ans },
      solution: [`Vegetables: ${nf(T)} ÷ ${a + b} × ${a} = ${nf(part)} sq ft. That is 100% for the tomatoes.`, `Tomatoes: ${pc(p)} of ${nf(part)} = ${nf(ans)} sq ft.`],
      check: numCheck(ans, false, `Yes: ${nf(part)} square feet of vegetables, and ${pc(p)} of it is ${nf(ans)}.`, 'Find the vegetable part first; the percent is of that part.', [
        { v: pctOf(p, T), mc: MC.wrongWhole, say: `That is ${pc(p)} of the whole garden. Tomatoes are ${pc(p)} of the vegetable part.` },
        { v: part, mc: MC.lostIntermediate, say: `${nf(part)} square feet is the vegetable part. Tomatoes fill ${pc(p)} of it.` },
      ]) };
  }
  let [a, b] = pick(R, PAIRS), s = a + b, T = 400, p = 20, found = false;
  for (let t = 0; t < 400 && !found; t++) {
    [a, b] = pick(R, PAIRS); s = a + b; T = pick(R, [200, 300, 400, 500, 600, 800, 250]); p = pick(R, [10, 20, 25, 40]);
    found = isWhole(T * (100 - p) / 100 / s);
  }
  if (!found) { [a, b] = [3, 2]; s = 5; T = 500; p = 20; }
  const kept = T * (100 - p) / 100, ans = kept * b / s;
  return { id: `transfer-${n}`, family: 'transfer', prompt: `${A(`${T} people`)} signed up for a 5K, but <b>${p}%</b> did not show up. The people who came were walkers to joggers ${B(`${a} : ${b}`)}. How many joggers were there?`,
    board: `\\text{joggers} = \\,?`, input: 'num', unit: 'joggers', answer: { kind: 'num', v: ans },
    solution: [`People who came: ${100 - p}% of ${T} = ${nf(kept)}. The ratio is about them.`, `Joggers: ${nf(kept)} ÷ ${s} × ${b} = ${nf(ans)}.`],
    check: numCheck(ans, false, `Yes: ${nf(kept)} people came, and ${b} of every ${s} of them jogged.`, 'Find how many came first. The ratio describes them, not everyone who signed up.', [
      { v: T * b / s, mc: MC.postChangeRatio, say: `That splits all ${T} who signed up. The ratio is about the people who came.` },
      { v: kept, mc: MC.lostIntermediate, say: `${nf(kept)} is everyone who came. Now find the joggers among them.` },
      { v: r4(T * p / 100 * b / s), mc: MC.changeAsFinal, say: `That splits the ${p}% who did not come. Split the people who came.` },
    ]) };
};

// =========================== more families (round 2): every sub-goal in 2-3 different ways ===========================

// ----- label-relationships -----
/** three bold relationships in one story: which one is a fixed amount? */
const findFixed: Gen = (R, n) => {
  const strip = (x: string) => /<b>(.*?)<\/b>/.exec(x)![1]!;
  const ra = pick(R, REL.filter(r => r.kind === 'ratio')), pe = pick(R, REL.filter(r => r.kind === 'percent')), fx = pick(R, REL.filter(r => r.kind === 'fixed'));
  const story = shuffle(R, [ra, pe, fx]).map(r => r.s).join(' ');
  const mcWrong = fx.trap ? MC.keyword : MC.scalesFixed;
  const opts: Opt[] = [
    { t: strip(fx.s), ok: true, say: 'Yes. It stays the same however big the order or the group is.' },
    { t: strip(ra.s), mc: mcWrong, say: 'That is a ratio: double one amount and the other doubles. Look for the amount that never changes.' },
    { t: strip(pe.s), mc: mcWrong, say: 'That is a percent: it grows with its whole. Look for the amount that never changes.' },
  ];
  return { id: `findFixed-${n}`, family: 'findFixed', prompt: `${story}<br>Which bold part is a fixed amount, not a ratio or percent step?`, board: '\\text{which one stays fixed?}',
    input: 'choice', ...choose(R, opts), solution: ['Ask of each: if the other amount doubled, would this double too? The one that doesn’t is fixed.'] };
};
/** the doubling test, as a number: a fixed amount stays, a ratio or a percent doubles */
const doubleTest: Gen = (R, n) => {
  const kind = pick(R, ['ship', 'age', 'fee', 'paint', 'tax', 'tip'] as const);
  let prompt = '', ans = 0, unit = 'dollars', fixed = false, base = 0, k = 2;
  k = pick(R, [2, 3]);
  if (kind === 'ship') { const F = pick(R, [4, 5, 6, 8]), q = pick(R, [2, 3, 4]); base = F; fixed = true; ans = F;
    prompt = `Shipping is a flat ${A(money(F))} per order. An order of ${q} games paid ${money(F)} shipping. What is the shipping on an order of ${q * k} games?`; }
  else if (kind === 'age') { const d = pick(R, [2, 3, 4, 5]), b = pick(R, [4, 5, 6]); base = b + d; fixed = true; ans = b * k + d; unit = 'years';
    prompt = `Mia is ${A(d)} years older than her brother. When he was ${b}, she was ${b + d}. How old is Mia when her brother is ${b * k}?`; }
  else if (kind === 'fee') { const F = pick(R, [10, 15, 20, 25]), q = pick(R, [2, 3, 4]); base = F; fixed = true; ans = F;
    prompt = `The fair charges ${A(money(F))} per family, however many people come. A family of ${q} paid ${money(F)}. What does a family of ${q * k} pay?`; }
  else if (kind === 'paint') { const bl = pick(R, [4, 3, 5]), w = pick(R, [1, 2]), c = pick(R, [2, 3]); base = w * c; ans = w * c * k; unit = 'cups';
    prompt = `Paint is mixed ${B(`${bl} parts blue to ${w} part${w > 1 ? 's' : ''} white`)}. ${bl * c} cups of blue need ${w * c} cups of white. How much white for ${bl * c * k} cups of blue?`; }
  else if (kind === 'tax') { const t = pick(R, [5, 8, 10, 6]), P = pick(R, [50, 100, 20, 40]); base = P * t / 100; ans = base * k;
    prompt = `Sales tax is ${t}%. On ${A(money(P))}, the tax is ${money(base)}. What is the tax on ${money(P * k)}?`; }
  else { const q = pick(R, [15, 20, 10]), P = pick(R, [40, 60, 20, 30]); base = P * q / 100; ans = base * k;
    prompt = `Leo tips ${q}% of the bill. On ${an(P)} ${A(money(P))} bill, the tip is ${money(base)}. What is the tip on ${an(P * k)} ${money(P * k)} bill?`; }
  const isMoney = unit === 'dollars';
  const wrongs: Wrong[] = fixed
    ? [{ v: kind === 'age' ? base * k : base * k, mc: MC.scalesFixed, say: kind === 'age' ? 'Ages don’t double: the difference stays the same. Add the same number of years.' : 'That fee is fixed: it doesn’t grow with the order.' }]
    : [{ v: base, say: 'This one is not fixed: it grows with its whole. Double the whole, double this.' }];
  return { id: `doubleTest-${n}`, family: 'doubleTest', prompt, board: '\\text{does it grow?}', input: 'num', unit, answer: { kind: 'num', v: ans },
    solution: [fixed ? 'A fixed amount (or a fixed difference) stays the same when the other amount grows.' : 'A ratio or a percent grows with its whole: the same factor on both.', `So the answer is ${isMoney ? money(ans) : nf(ans)}.`],
    check: numCheck(ans, isMoney, fixed ? 'Yes: a fixed amount doesn’t scale.' : `Yes: ${k} times the whole, ${k} times this amount.`, fixed ? 'Does this amount depend on the size of the order?' : `The whole is ${k} times as big. What happens to this amount?`, wrongs) };
};

// ----- name-whole-per-step -----
/** the whole (100%) of the SECOND step, as a number */
const wholeValue: Gen = (R, n) => {
  const kind = pick(R, ['tax', 'share', 'markup', 'tipPost', 'tickets'] as const);
  let prompt = '', ans = 0, wrongs: Wrong[] = [], unit = 'dollars', isMoney = true, sol: string[] = [];
  if (kind === 'tax') {
    const P = pick(R, [40, 60, 80, 120, 200, 50]), d = pick(R, [20, 25, 10, 50]), t = pick(R, [6, 8, 5]); ans = P * (100 - d) / 100;
    prompt = `A ${A(money(P))} jacket is <b>${d}% off</b>, then <b>${t}% tax</b> is added to the sale price. What amount is 100% for the tax step?`;
    wrongs = [{ v: P, mc: MC.addsPercents, say: `${money(P)} is 100% for the discount. The tax is on the sale price.` }, { v: P - ans, mc: MC.changeAsWhole, say: 'That is the discount, the amount taken off. The tax is on what is left.' }];
    sol = ['The tax is added to the sale price, so the sale price is 100% for the tax.', `Sale price: ${money(P)} − ${d}% of ${money(P)} = ${mark(money(ans))}.`];
  } else if (kind === 'share') {
    const x = rpNumbers(R, RCS[0]!, false); ans = x.part;
    prompt = `A club splits its ${A(money(x.T))} budget art to music ${B(`${x.a} : ${x.b}`)}, and art spends <b>${x.p}%</b> of its share on paint. What amount is 100% for the paint step?`;
    wrongs = [{ v: x.T, mc: MC.wrongWhole, say: `${money(x.T)} is the whole budget. The ${x.p}% is of art’s share.` }, { v: x.other, mc: MC.otherPart, say: 'That is music’s share. The paint comes out of art’s share.' },
      { v: r4((x.T * x.a) / x.b), mc: MC.otherPart, say: `${x.a} : ${x.b} compares art with music. Art gets ${x.a} of every ${x.a + x.b} parts.` }];
    sol = ['The paint is a percent of art’s share, so art’s share is 100% for the paint step.', `Art’s share: ${money(x.T)} ÷ ${x.a + x.b} × ${x.a} = ${mark(money(x.part))}.`];
  } else if (kind === 'markup') {
    const C = pick(R, [40, 60, 80, 100, 120]), m = pick(R, [25, 50, 20, 40]), d = pick(R, [10, 20]); ans = C * (100 + m) / 100;
    prompt = `A store pays ${A(money(C))} for a lamp, marks it up <b>${m}%</b>, then takes <b>${d}% off</b> in a sale. What amount is 100% for the sale step?`;
    wrongs = [{ v: C, mc: MC.addsPercents, say: `${money(C)} is 100% for the markup. The sale works on the marked-up price.` }, { v: ans - C, mc: MC.changeAsWhole, say: 'That is the markup, the amount added. The sale is on the whole new price.' }];
    sol = ['The sale takes its percent off the marked-up price, so that price is 100% for the sale.', `Marked-up price: ${money(C)} + ${m}% of ${money(C)} = ${mark(money(ans))}.`];
  } else if (kind === 'tipPost') {
    const Bl = pick(R, [40, 60, 80, 50, 100]), t = pick(R, [5, 10, 8]), q = pick(R, [15, 20]); ans = Bl * (100 + t) / 100;
    prompt = `Dinner is ${A(money(Bl))} before tax. Tax is <b>${t}%</b>, and the tip is <b>${q}% of the bill with tax</b>. What amount is 100% for the tip?`;
    wrongs = [{ v: Bl, mc: MC.wrongWhole, say: 'That is the bill before tax. This tip is on the bill with tax.' }, { v: ans - Bl, mc: MC.changeAsWhole, say: 'That is the tax. The tip is on the whole bill with tax.' }];
    sol = ['The tip is a percent of the bill with tax, so that bill is 100% for the tip.', `Bill with tax: ${money(Bl)} + ${t}% of ${money(Bl)} = ${mark(money(ans))}.`];
  } else {
    let T = pick(R, [400, 500, 600, 800, 300]), p = pick(R, [75, 80, 60, 90]), [a, b] = pick(R, PAIRS);
    for (let t = 0; t < 60 && !isWhole((T * p) / 100 / (a + b)); t++) { T = pick(R, [400, 500, 600, 800, 300]); p = pick(R, [75, 80, 60, 90]); [a, b] = pick(R, PAIRS); }
    if (!isWhole((T * p) / 100 / (a + b))) { T = 400; p = 75; [a, b] = [1, 2]; }
    ans = T * p / 100; unit = 'tickets'; isMoney = false;
    prompt = `Of ${A(`${T} tickets`)} printed, <b>${p}%</b> were sold. The tickets sold were adult to student ${B(`${a} : ${b}`)}. How many tickets are the whole for the ratio step?`;
    wrongs = [{ v: T, mc: MC.postChangeRatio, say: `The ratio is about the tickets sold, not all ${T} printed.` }, { v: T - ans, mc: MC.changeAsWhole, say: 'Those are the unsold tickets. The ratio is about the sold ones.' }];
    sol = ['The ratio describes the tickets sold, not all those printed.', `Tickets sold: ${p}% of ${T} = ${mark(nf(ans))}. The ratio step splits those.`];
  }
  return { id: `wholeValue-${n}`, family: 'wholeValue', prompt, board: '100\\% = \\,?', input: 'num', unit, answer: { kind: 'num', v: ans }, solution: sol,
    check: numCheck(ans, isMoney, `Yes: ${isMoney ? money(ans) : nf(ans)} is the whole for that step.`, 'Which amount does the step work on? It may be the result of the step before.', wrongs) };
};

// ----- order-plan -----
/** which amount must be found first (a three-step story told out of order) */
const firstStep: Gen = (R, n) => {
  const kind = pick(R, ['commission', 'tip', 'tickets'] as const);
  let prompt = '', opts: Opt[] = [], board = '';
  if (kind === 'commission') {
    const [a, b] = pick(R, PAIRS), T = (a + b) * pick(R, [100, 200, 300]), p = pick(R, [5, 10, 4]), q = pick(R, [20, 25, 50]);
    prompt = `Ben saves ${q}% of his commission. He earns ${p}% commission on his own sales. Ana and Ben sold ${A(money(T))} of bikes, Ana to Ben ${B(`${a} : ${b}`)}. How much does Ben save? Which amount do you find first?`;
    board = `${q}\\%,\\ ${p}\\%,\\ \\$${tn(T)},\\ ${a}:${b}`;
    opts = [{ t: 'Ben’s sales', ok: true, say: 'Yes. The commission needs Ben’s sales, and the savings need the commission.' },
      { t: 'Ben’s savings', mc: MC.mentionOrder, say: 'The savings are mentioned first, but they need the commission, which needs Ben’s sales.' },
      { t: `${p}% of ${money(T)}`, mc: MC.wrongWhole, say: `Ben earns commission on his own sales, not on all ${money(T)}.` }];
  } else if (kind === 'tip') {
    const Bl = pick(R, [40, 60, 80, 50]), t = pick(R, [5, 8, 10]), q = pick(R, [15, 20]);
    prompt = `The tip is ${q}% of the bill with tax. Tax is ${t}% of the meal. The meal costs ${A(money(Bl))}. What is the total? Which amount do you find first?`;
    board = `${q}\\%\\ \\text{tip},\\ ${t}\\%\\ \\text{tax},\\ \\$${Bl}`;
    opts = [{ t: 'The tax on the meal', ok: true, say: 'Yes. The bill with tax needs the tax, and the tip needs the bill with tax.' },
      { t: 'The tip', mc: MC.mentionOrder, say: 'The tip comes first in the story, but it needs the bill with tax.' },
      { t: `${q}% of ${money(Bl)}`, mc: MC.wrongWhole, say: 'The tip is on the bill with tax, not on the meal alone.' }];
  } else {
    const T = pick(R, [400, 600, 800, 500]), p = pick(R, [75, 80, 90]), [a, b] = pick(R, PAIRS);
    prompt = `Student tickets cost half price. The tickets sold were adult to student ${B(`${a} : ${b}`)}. Of ${A(T)} tickets printed, ${p}% were sold. How many student tickets were sold? Which amount do you find first?`;
    board = `${a}:${b},\\ ${T},\\ ${p}\\%`;
    opts = [{ t: 'The number of tickets sold', ok: true, say: 'Yes. The ratio is about the tickets sold, so you need that number first.' },
      { t: 'The student tickets out of all printed', mc: MC.postChangeRatio, say: `The ratio describes the tickets sold, not all ${T} printed.` },
      { t: 'The price of a student ticket', mc: MC.mentionOrder, say: 'The price is mentioned first, but the question doesn’t need it at all.' }];
  }
  return { id: `firstStep-${n}`, family: 'firstStep', prompt, board, input: 'choice', ...choose(R, opts), solution: ['Start from the question and work back: what does each amount need? The amount that needs nothing new comes first.'] };
};
/** three steps with a fixed amount: here the order changes the answer */
const planThree: Gen = (R, n) => {
  const kind = pick(R, ['party', 'pay'] as const);
  let prompt = '', opts: Opt[] = [], board = '', sol: string[] = [];
  if (kind === 'party') {
    const [a, b] = pick(R, PAIRS), T = (a + b) * pick(R, [40, 50, 60]), p = pick(R, [10, 20, 25]), F = pick(R, [8, 10, 12, 15]);
    prompt = `Delivery is a flat ${A(money(F))}. The food store takes ${p}% off the food. A ${A(money(T))} party budget is split food to games ${B(`${a} : ${b}`)}, and the food order uses all of food’s share before the discount. What does the food cost with delivery? Which plan works?`;
    board = `\\$${F},\\ ${p}\\%,\\ \\$${T},\\ ${a}:${b}`;
    opts = [{ t: `Split ${money(T)} → take ${p}% off food’s share → add ${money(F)}`, ok: true, say: 'Yes. The discount is on the food only, and the delivery fee is added after.' },
      { t: `Add ${money(F)} → take ${p}% off → split ${money(T)}`, mc: MC.mentionOrder, say: 'That follows the sentences. But the discount needs food’s share, which comes from the split.' },
      { t: `Split ${money(T)} → add ${money(F)} → take ${p}% off`, mc: MC.fixedCommute, say: `That takes ${p}% off the delivery fee too. A fixed fee and a percent don’t swap places.` }];
    sol = ['The percent is of food’s share, so split first.', `The ${money(F)} is a fixed fee: add it after the discount, as the story says.`];
  } else {
    const w = pick(R, [12, 15, 16, 20]), h = pick(R, [10, 20, 25]), p = pick(R, [10, 20]), F = pick(R, [20, 25, 30]);
    prompt = `Jo pays a flat ${A(money(F))} for a bus pass out of her pay. She earns ${A(money(w))} an hour and works ${h} hours, and ${p}% of her pay is withheld for taxes. How much is left after taxes and the pass? Which plan works?`;
    board = `\\$${F},\\ \\$${w}/\\text{h},\\ ${h}\\ \\text{h},\\ ${p}\\%`;
    opts = [{ t: `${money(w)} × ${h} → take ${p}% off → subtract ${money(F)}`, ok: true, say: 'Yes. The tax is a percent of her pay; the pass is a fixed amount taken after.' },
      { t: `Subtract ${money(F)} → ${money(w)} × ${h} → take ${p}% off`, mc: MC.mentionOrder, say: 'That follows the sentences, but you can’t take the pass out before you know her pay.' },
      { t: `${money(w)} × ${h} → subtract ${money(F)} → take ${p}% off`, mc: MC.fixedCommute, say: 'That taxes less than her full pay. The fixed $ and the percent don’t swap places.' }];
    sol = ['Rate step first (pay), then the percent of the pay, then the fixed amount.'];
  }
  return { id: `planThree-${n}`, family: 'planThree', prompt, board, input: 'choice', ...choose(R, opts), solution: sol };
};

// ----- share-total-in-ratio -----
/** from one share to the other share or the total */
const shareFromPart: Gen = (R, n) => {
  const [a, b] = pick(R, PAIRS.filter(q => q[0] !== q[1])), s = a + b, u = pick(R, [5, 6, 8, 10, 12, 15, 20, 25]);
  const X = a * u, askTotal = R() < 0.5, ans = askTotal ? s * u : b * u;
  const who = pick(R, [['Kai', 'Lu'], ['Rosa', 'Eli'], ['Ana', 'Ben']] as const);
  const wrongs: Wrong[] = [
    { v: r4((X * a) / b), mc: MC.reversedProportion, say: `That flips the ratio. ${who[0]} has ${a} parts: one part is ${money(X)} ÷ ${a} = ${money(u)}.` },
    { v: X * (askTotal ? s : b), say: `${money(X)} is ${a} parts, not one. Find one part first: ${money(X)} ÷ ${a}.` },
  ];
  if (askTotal) wrongs.push({ v: b * u, mc: MC.lostIntermediate, say: `That is ${who[1]}’s share. The total is both shares together.` });
  else wrongs.push({ v: s * u, mc: MC.otherPart, say: `That is the total. ${who[1]} gets ${b} of the ${s} parts.` });
  return { id: `shareFromPart-${n}`, family: 'shareFromPart', prompt: `${who[0]} and ${who[1]} share some money in the ratio ${B(`${a} : ${b}`)}. ${who[0]} gets ${A(money(X))}. ${askTotal ? 'How much money was shared in all?' : `How much does ${who[1]} get?`}`,
    board: `${a} : ${b} = ${X} : \\,?`, input: 'num', unit: 'dollars', answer: { kind: 'num', v: ans },
    solution: [`${who[0]}’s ${a === 1 ? '1 part is' : `${a} parts are`} ${money(X)}, so one part = ${money(X)} ÷ ${a} = ${money(u)}.`, askTotal ? `All ${s} parts: ${s} × ${money(u)} = ${money(ans)}.` : `${who[1]}: ${b} × ${money(u)} = ${money(ans)}.`],
    check: numCheck(ans, true, `Yes: one part is ${money(u)}.`, `Find one part first: ${money(X)} ÷ ${a}.`, wrongs) };
};
/** what fraction of the total is one share? */
const shareFraction: Gen = (R, n) => {
  const [a, b] = pick(R, PAIRS.filter(q => q[0] !== q[1])), s = a + b;
  const ctx = pick(R, [{ w: 'art', o: 'music', t: 'the budget' }, { w: 'nuts', o: 'raisins', t: 'the trail mix' }, { w: 'home fans', o: 'away fans', t: 'the crowd' }, { w: 'juice', o: 'water', t: 'the punch' }]);
  const opts: Opt[] = [
    { t: `${a}/${s} of ${ctx.t}`, ok: true, say: `Yes: ${a} parts out of ${a} + ${b} = ${s} parts.` },
    { t: `${a}/${b} of ${ctx.t}`, mc: MC.otherPart, say: `${a} : ${b} compares ${ctx.w} with ${ctx.o}. The whole is all ${s} parts.` },
    { t: `${b}/${s} of ${ctx.t}`, mc: MC.complementPart, say: `${b}/${s} is the ${ctx.o}. The ${ctx.w} are the first ${a} parts.` },
  ];
  return { id: `shareFraction-${n}`, family: 'shareFraction', prompt: `In ${ctx.t}, ${ctx.w} to ${ctx.o} is ${B(`${a} : ${b}`)}. What fraction of ${ctx.t} is ${ctx.w}?`,
    board: `${a} : ${b}`, input: 'choice', ...choose(R, opts), solution: [`${a} : ${b} means ${s} equal parts in all.`, `The ${ctx.w} are ${a} of them: ${a}/${s} of the total.`] };
};

// ----- chain-ratio-then-percent -----
const RESTASK: Record<string, string> = {
  club: 'How much of art’s share is left after the paint?', fans: 'How many away fans did not wear caps?', mix: 'How many ounces of the nuts are not almonds?',
  farm: 'How many acres of corn get no sprinklers?', punch: 'How many cups of the juice are not orange juice?',
};
/** the same chain, but the question asks for the OTHER part of the share */
const ratioPercentRest: Gen = (R, n, sg) => {
  const c = pick(R, RCS.filter(x => x.id in RESTASK)), x = rpNumbers(R, c, useCalc(R, sg));
  const { a, b, T, part, p, ans } = x, rest = r4(part - ans), rt = `${a} : ${b}`, isMoney = c.kind === 'money';
  return {
    id: `ratioPercentRest-${n}`, family: 'ratioPercentRest', prompt: `${c.setup(A(c.fmt(T)), B(rt))} ${c.pct(`<b>${pc(p)}</b>`)} ${RESTASK[c.id]}`,
    board: `${isMoney ? '\\$' : ''}${tn(T)} \\xrightarrow{\\;${a}:${b}\\;} \\text{${c.names[c.w]}} \\xrightarrow{\\;${p}\\%\\;} \\text{rest} = \\,?`,
    input: 'num', unit: c.unit, answer: { kind: 'num', v: rest }, picture: { chain: rpPic(x, true) },
    solution: [...rpSolution(x).slice(0, 2), `What is left is ${pc(100 - p)} of ${c.fmt(part)} = ${c.fmt(rest)}.`],
    check: numCheck(rest, isMoney, `Yes: ${pc(100 - p)} of ${c.fmt(part)} is ${c.fmt(rest)}.`, `Find ${c.share} first. Then the rest is ${pc(100 - p)} of it.`, [
      { v: ans, mc: MC.changeAsFinal, say: `${c.fmt(ans)} is the ${pc(p)} part. The question asks for the rest.` },
      { v: pctOf(100 - p, T), mc: MC.wrongWhole, say: `That is ${pc(100 - p)} of all ${c.fmt(T)}. The percent is of ${c.share}.` },
      { v: part, mc: MC.lostIntermediate, say: `${c.fmt(part)} is all of ${c.share}. Take out the ${pc(p)}.` },
      { v: r4(T - ans), mc: MC.wrongWhole, say: `That takes the ${pc(p)} out of the whole ${c.fmt(T)}. The rest is part of ${c.share} only.` },
    ]),
  };
};
/** a rate (ratio) step, then a percent */
const rateThenPercent: Gen = (R, n) => {
  const kind = pick(R, ['fabric', 'pay', 'apples'] as const);
  let prompt = '', ans = 0, mid = 0, rate = 0, q = 0, p = 0, board = '', wrongs: Wrong[] = [], sol: string[] = [];
  if (kind === 'fabric') {
    rate = pick(R, [4, 6, 8, 12, 15]); q = pick(R, [5, 10, 12, 15, 20]); p = pick(R, [10, 20, 25, 30]); mid = rate * q; ans = mid * (100 - p) / 100;
    prompt = `Fabric costs ${A(`${money(rate)} per yard`)}. Lena buys ${q} yards and uses ${an(p)} <b>${p}% off</b> coupon on the whole order. What does she pay?`;
    wrongs = [{ v: mid * p / 100, mc: MC.changeAsFinal, say: `${money(mid * p / 100)} is the amount saved. She pays the other ${100 - p}%.` }, { v: mid, mc: MC.lostIntermediate, say: `${money(mid)} is before the coupon.` }];
    sol = [`Rate step: ${q} × ${money(rate)} = ${money(mid)}.`, `Percent step: ${100 - p}% of ${money(mid)} = ${money(ans)}.`];
  } else if (kind === 'pay') {
    rate = pick(R, [12, 15, 16, 18, 20]); q = pick(R, [10, 20, 25, 30]); p = pick(R, [10, 20, 25]); mid = rate * q; ans = mid * p / 100;
    prompt = `Jo earns ${A(`${money(rate)} an hour`)} and works ${q} hours. She saves <b>${p}%</b> of her pay. How much does she save?`;
    wrongs = [{ v: rate * p / 100, mc: MC.lostIntermediate, say: `That is ${p}% of one hour’s pay. Find her pay for all ${q} hours first.` }, { v: mid, mc: MC.lostIntermediate, say: `${money(mid)} is her whole pay. She saves ${p}% of it.` }];
    sol = [`Rate step: ${q} × ${money(rate)} = ${money(mid)}.`, `Percent step: ${p}% of ${money(mid)} = ${money(ans)}.`];
  } else {
    rate = pick(R, [2, 3, 4, 5]); q = pick(R, [10, 20, 30, 40]); p = pick(R, [5, 8, 10]); mid = rate * q; ans = r4(mid * (100 + p) / 100);
    prompt = `Apples cost ${A(`${money(rate)} per pound`)}. A café buys ${q} pounds, and ${an(p)} <b>${p}% delivery charge</b> is added to the price. What is the total?`;
    wrongs = [{ v: mid * p / 100, mc: MC.changeAsFinal, say: 'That is the delivery charge alone. Add it to the price.' }, { v: mid, mc: MC.lostIntermediate, say: `${money(mid)} is before the ${p}% charge.` }, { v: r4(rate * (100 + p) / 100), mc: MC.lostIntermediate, say: 'That is one pound with the charge. Multiply for every pound first.' }];
    sol = [`Rate step: ${q} × ${money(rate)} = ${money(mid)}.`, `Percent step: ${money(mid)} × ${tn(r4(1 + p / 100))} = ${money(ans)}.`];
  }
  board = `${q} \\times \\$${rate} \\to \\,?`;
  return { id: `rateThenPercent-${n}`, family: 'rateThenPercent', prompt, board, input: 'num', unit: 'dollars', answer: { kind: 'num', v: ans }, solution: sol,
    check: numCheck(ans, true, `Yes: ${money(mid)} first, then the percent of it: ${money(ans)}.`, 'Use the rate first to find the whole amount. The percent is of that amount.', wrongs) };
};

// ----- chain-percent-then-ratio -----
/** a percent of a total, then a unit rate */
const percentThenRate: Gen = (R, n) => {
  const kind = pick(R, ['trip', 'card'] as const);
  if (kind === 'trip') {
    let d = 480, p = 25, m = 15;
    for (let t = 0; t < 200; t++) { d = pick(R, [240, 300, 360, 400, 480, 600]); p = pick(R, [20, 25, 50, 40, 10]); m = pick(R, [10, 12, 15, 20, 30]); if (isWhole(d * p / 100 / m)) break; }
    const part = d * p / 100, ans = part / m;
    return { id: `percentThenRate-${n}`, family: 'percentThenRate', prompt: `A truck drives ${an(d)} ${A(`${d}-mile`)} trip. <b>${p}%</b> of it is on dirt roads, where the truck uses <b>1 gallon every ${m} miles</b>. How many gallons does it use on dirt roads?`,
      board: `${d} \\xrightarrow{\\;${p}\\%\\;} \\text{dirt} \\xrightarrow{\\;\\div ${m}\\;} \\,?`, input: 'num', unit: 'gallons', answer: { kind: 'num', v: ans },
      solution: [`Percent step: ${p}% of ${d} miles = ${nf(part)} miles of dirt road.`, `Rate step: ${nf(part)} ÷ ${m} = ${nf(ans)} gallons.`],
      check: numCheck(ans, false, `Yes: ${nf(part)} miles of dirt road, ${nf(ans)} gallons.`, 'Find the dirt-road miles first, then use the rate on those miles.', [
        { v: r4(d / m), mc: MC.postChangeRatio, say: `That uses the rate on all ${d} miles. The rate is for the dirt part only.` },
        { v: part, mc: MC.lostIntermediate, say: `${nf(part)} is miles, the middle amount. Now turn the miles into gallons.` },
        { v: r4(part * m), mc: MC.lostIntermediate, say: `1 gallon goes ${m} miles, so divide the miles by ${m}.` },
      ]) };
  }
  let T = 50, p = 10, c = 3;
  for (let t = 0; t < 200; t++) { T = pick(R, [20, 25, 40, 50, 60, 100]); p = pick(R, [10, 20, 25, 40]); c = pick(R, [2, 3, 4, 5]); if (isWhole(T * (100 - p) / 100 / c)) break; }
  const left = T * (100 - p) / 100, ans = left / c;
  return { id: `percentThenRate-${n}`, family: 'percentThenRate', prompt: `A ${A(money(T))} gift card loses <b>${p}%</b> to a fee before you can use it. Songs cost <b>${money(c)} each</b>. How many songs can you buy with the rest?`,
    board: `\\$${T} \\xrightarrow{\\;-${p}\\%\\;} \\text{left} \\xrightarrow{\\;\\div ${c}\\;} \\,?`, input: 'num', unit: 'songs', answer: { kind: 'num', v: ans },
    solution: [`Percent step: ${100 - p}% of ${money(T)} = ${money(left)} is left.`, `Rate step: ${money(left)} ÷ ${money(c)} = ${nf(ans)} songs.`],
    check: numCheck(ans, false, `Yes: ${money(left)} left, ${nf(ans)} songs.`, 'Take the fee off first, then see how many songs fit in what is left.', [
      { v: r4(T / c), mc: MC.postChangeRatio, say: `That spends all ${money(T)}. The fee comes off first.` },
      { v: r4(T * p / 100 / c), mc: MC.changeAsFinal, say: 'That spends only the fee. Use the money that is left.' },
      { v: left, mc: MC.lostIntermediate, say: `${money(left)} is money, the middle amount. How many songs is that?` },
    ]) };
};
/** a percent increase, then the new total shared in a ratio */
const percentRatioGrow: Gen = (R, n) => {
  let N = 200, p = 10, a = 3, b = 2, s = 5;
  for (let t = 0; t < 300; t++) { N = pick(R, [80, 100, 120, 150, 200, 250, 300, 400]); p = pick(R, [10, 20, 25, 50, 5, 15]); [a, b] = pick(R, PAIRS); s = a + b; if (isWhole(N * (100 + p) / 100 / s)) break; }
  const now = N * (100 + p) / 100, ans = now * b / s;
  const pic: ChainPic = {
    chain: { rows: [
      { title: 'last year', lead: nf(N), base: N, ticks: tickCount(p), pieces: [{ amt: N, role: 'whole', inside: '100%' }, { amt: now - N, role: 'add', inside: `+${p}%`, under: nf(now - N) }] },
      { title: 'now', lead: nf(now), base: now, zoomFrom: { row: 0, a: 0, b: now }, units: s <= 12 ? s : undefined,
        pieces: [{ amt: now * a / s, role: 'rest', inside: 'kids', under: nf(now * a / s) }, { amt: ans, role: 'answer', inside: 'adults', under: nf(ans) }] },
    ] },
    given: ['r0', 't0', 'L0', 's0', 'k0', 'n0.0', 'n0.1', 'z1', 'r1', 't1', 's1', 'u1', 'n1.0', 'n1.1', 'v1.1'], ask: [{ r: 1, j: 1 }],
    steps: [`${N} \\times ${tn(r4(1 + p / 100))} = ${tn(now)}`, `${tn(now)} \\div ${s} = ${tn(now / s)}`, `${b} \\times ${tn(now / s)} = ${tn(ans)}`],
  };
  return { id: `percentRatioGrow-${n}`, family: 'percentRatioGrow', prompt: `A swim club had ${A(`${N} members`)} last year. Membership grew by <b>${p}%</b>. Now kids to adults is ${B(`${a} : ${b}`)}. How many adults are members now?`,
    board: `${N} \\xrightarrow{\\;+${p}\\%\\;} \\text{now} \\xrightarrow{\\;${a}:${b}\\;} \\,?`, input: 'num', unit: 'adults', answer: { kind: 'num', v: ans }, picture: { chain: pic },
    solution: [`Percent step: ${N} + ${p}% = ${nf(now)} members now. That is the whole for the ratio.`, `Ratio step: ${nf(now)} ÷ ${s} = ${nf(now / s)} per part; adults: ${b} × ${nf(now / s)} = ${nf(ans)}.`],
    check: numCheck(ans, false, `Yes: ${nf(now)} members now, and ${b} of every ${s} are adults.`, 'Grow the club first. The ratio is about the members now.', [
      { v: r4(N * b / s), mc: MC.postChangeRatio, say: `That splits last year’s ${N}. The ratio is about the members now.` },
      { v: now, mc: MC.lostIntermediate, say: `${nf(now)} is all members now. Find the adults among them.` },
      { v: r4(N * p / 100 * b / s), mc: MC.changeAsFinal, say: 'That splits only the new members. Split everyone who is a member now.' },
    ]) };
};

// ----- successive-percents -----
const describe = (net: number) => (Math.abs(net) < 1e-9 ? 'no change' : net > 0 ? `${an(nf(net))} ${nf(net)}% increase` : `${an(nf(-net))} ${nf(-net)}% decrease`);
/** the overall percent change of two changes */
const netChange: Gen = (R, n) => {
  const pairs: [number, number][] = [[-20, 20], [-10, 10], [-50, 50], [-25, 20], [-20, 25], [10, -10], [20, -20], [10, 20], [-20, 10], [50, -50], [25, -20], [20, 50], [-30, 10], [40, -25]];
  const [c1, c2] = pick(R, pairs);
  const net = r4(((100 + c1) * (100 + c2)) / 100 - 100), adds = c1 + c2;
  const third = [describe(c2), describe(c1), describe(-(c1 + c2))].find(t => t !== describe(net) && t !== describe(adds))!;
  const opts: Opt[] = [
    { t: describe(net), ok: true, say: `Yes: × ${tn(r4(1 + c1 / 100))} × ${tn(r4(1 + c2 / 100))} = × ${tn(r4(1 + net / 100))}, which is ${describe(net)}.` },
    { t: describe(adds), mc: MC.addsPercents, say: 'Adding the percents treats both as percents of the start. The second one is of the new amount.' },
    { t: third, mc: MC.lostIntermediate, say: 'Use both changes: multiply the two multipliers.' },
  ];
  const w = (c: number) => (c > 0 ? `goes up <b>${c}%</b>` : `goes down <b>${-c}%</b>`);
  return { id: `netChange-${n}`, family: 'netChange', prompt: `A price ${w(c1)}, then ${w(c2)} of the new price. What is the change overall?`,
    board: `\\times ${tn(r4(1 + c1 / 100))} \\times ${tn(r4(1 + c2 / 100))} = \\times \\,?`, input: 'choice', ...choose(R, opts),
    solution: [`Multipliers: ${tn(r4(1 + c1 / 100))} × ${tn(r4(1 + c2 / 100))} = ${tn(r4(1 + net / 100))}.`, `${tn(r4(1 + net / 100))} means ${describe(net)}. Try it on $100: $100 → $${100 + c1} → $${tn(r4(100 + net))}.`] };
};
/** a ratio share, then two percents on a changing whole */
const threeStep: Gen = (R, n) => {
  let T = 100, a = 3, b = 2, t = 8, q = 20, share = 60, mid = 64.8, ans = 77.76;
  for (let k = 0; k < 300; k++) {
    [a, b] = pick(R, PAIRS); T = (a + b) * pick(R, [10, 12, 15, 20, 24, 25]); t = pick(R, [5, 8, 10, 6]); q = pick(R, [15, 20, 25, 10]);
    share = T * a / (a + b); mid = r4(share * (100 + t) / 100); ans = r4(mid * (100 + q) / 100);
    if (isCents(mid) && isCents(ans)) break;
  }
  return { id: `threeStep-${n}`, family: 'threeStep', prompt: `Mia and Leo split ${an(T)} ${A(money(T))} dinner bill by what they ate, Mia to Leo ${B(`${a} : ${b}`)}. Mia adds <b>${t}% tax</b> to her share, then a <b>${q}% tip</b> on her share with tax. What does Mia pay?`,
    board: `\\$${T} \\xrightarrow{${a}:${b}} \\xrightarrow{+${t}\\%} \\xrightarrow{+${q}\\%} \\,?`, input: 'num', unit: 'dollars', answer: { kind: 'num', v: ans },
    solution: [`Ratio step: Mia’s share = ${money(T)} ÷ ${a + b} × ${a} = ${money(share)}.`, `Tax: ${money(share)} × ${tn(r4(1 + t / 100))} = ${money(mid)}.`, `Tip on that: ${money(mid)} × ${tn(r4(1 + q / 100))} = ${money(ans)}.`],
    check: numCheck(ans, true, `Yes: ${money(share)} → ${money(mid)} → ${money(ans)}.`, 'Three steps: Mia’s share, then tax on it, then the tip on her share with tax.', [
      { v: r4(share * (100 + t + q) / 100), mc: MC.addsPercents, say: `That adds ${t}% and ${q}% as if both were of ${money(share)}. The tip is on the share with tax.` },
      { v: r4(T * (100 + t) * (100 + q) / 10000), mc: MC.wrongWhole, say: `That is the whole bill. Mia pays only her share of ${money(T)}.` },
      { v: mid, mc: MC.lostIntermediate, say: `${money(mid)} is her share with tax. Add the tip too.` },
    ]) };
};

// ----- percent-multiplier -----
/** read a multiplier back as a percent change */
const multiplierToPercent: Gen = (R, n) => {
  const m = pick(R, [0.85, 0.7, 1.15, 1.06, 0.95, 1.25, 0.6, 1.4, 0.92, 1.08, 0.75, 1.3, 0.8, 1.2]);
  const ch = r4(Math.abs(m - 1) * 100), up = m > 1, keep = r4(m * 100);
  const opts: Opt[] = [
    { t: up ? `${an(nf(ch))} ${nf(ch)}% increase` : `${an(nf(ch))} ${nf(ch)}% decrease`, ok: true, say: `Yes: × ${m} keeps ${nf(keep)}% of the amount, ${up ? 'which is ' + nf(ch) + '% more' : nf(ch) + '% less'} than 100%.` },
    { t: up ? `${an(nf(keep))} ${nf(keep)}% increase` : `${an(nf(keep))} ${nf(keep)}% decrease`, mc: MC.percentOfAsChange, say: `× ${m} gives ${nf(keep)}% OF the amount. The change is the difference from 100%: ${nf(ch)}%.` },
    { t: up ? `${an(nf(ch))} ${nf(ch)}% decrease` : `${an(nf(ch))} ${nf(ch)}% increase`, mc: MC.wrongDir, say: `${m} is ${up ? 'more' : 'less'} than 1, so the amount gets ${up ? 'bigger' : 'smaller'}.` },
  ];
  return { id: `multiplierToPercent-${n}`, family: 'multiplierToPercent', prompt: `A price is multiplied by <b>${m}</b>. What percent change is that?`, board: `\\text{new} = \\text{old} \\times ${m}`,
    input: 'choice', ...choose(R, opts), solution: [`× ${m} = ${nf(keep)}% of the old amount.`, `${nf(keep)}% − 100% = ${up ? '+' : '−'}${nf(ch)}%: ${up ? 'an increase' : 'a decrease'} of ${nf(ch)}%.`] };
};

// ----- rounding-policy -----
/** a tip on the bill with tax: round each amount, or only the total (cents and basis points, exact) */
export function tipTotals(Bc: number, tbp: number, q: number): { each: number; end: number; tax: number; tip: number } {
  const tax = roundDiv(Bc * tbp, 10000), tip = roundDiv((Bc + tax) * q, 100);
  return { each: Bc + tax + tip, end: roundDiv(Bc * (10000 + tbp) * (100 + q), 1000000), tax, tip };
}
const roundingTip: Gen = (R, n) => {
  let Bc = 4637, t = 825, q = 18, T = tipTotals(Bc, t, q);
  for (let i = 0; i < 400; i++) {
    const B2 = pick(R, [2345, 3786, 4637, 5219, 6158, 2893, 7442, 3367, 4875, 5531]), t2 = pick(R, [725, 825, 650, 875, 625]), q2 = pick(R, [15, 18, 20, 22]), T2 = tipTotals(B2, t2, q2);
    const ties = (B2 * t2) % 10000 === 5000 || ((B2 + roundDiv(B2 * t2, 10000)) * q2) % 100 === 50 || (B2 * (10000 + t2) * (100 + q2)) % 1000000 === 500000;
    if (T2.each !== T2.end && !ties) { Bc = B2; t = t2; q = q2; T = T2; break; }
  }
  const each = R() < 0.5, ans = (each ? T.each : T.end) / 100, other = (each ? T.end : T.each) / 100;
  const rule = each ? 'Round the tax to the cent, then round the tip to the cent, then add.' : 'Keep every digit, and round only the final total to the cent.';
  return { id: `roundingTip-${n}`, family: 'roundingTip', prompt: `Dinner costs ${A(money(Bc / 100))}. Sales tax is <b>${nf(t / 100)}%</b>, and the tip is <b>${q}% of the bill with tax</b>. <b>${rule}</b> What is the total? (You may use a calculator.)`,
    board: `\\$${tn(Bc / 100, true)} \\xrightarrow{+${tn(t / 100)}\\%} \\xrightarrow{+${q}\\%} \\,?`, input: 'num', unit: 'dollars', answer: { kind: 'num', v: ans },
    solution: each ? [`Tax: ${nf(t / 100)}% of ${money(Bc / 100)} → ${money(T.tax / 100)}.`, `Tip: ${q}% of ${money((Bc + T.tax) / 100)} → ${money(T.tip / 100)}.`, `Total: ${mark(money(ans))}.`]
      : [`${money(Bc / 100)} × ${r4(1 + t / 10000)} × ${tn(r4(1 + q / 100))} = ${nf(Math.round(Bc * (1 + t / 10000) * (1 + q / 100) * 1e4) / 1e6)}.`, `Round once: ${mark(money(ans))}.`],
    check: numCheck(ans, true, `Yes: ${money(ans)}.`, each ? 'Round the tax first, find the tip on the rounded bill, round it, then add.' : 'Multiply with every digit, then round the total once.', [
      { v: other, mc: each ? undefined : MC.roundsEarly, say: each ? 'That rounds only at the end. This rule rounds the tax and the tip as you go.' : 'You rounded along the way. This rule keeps every digit until the total.' },
    ]) };
};

// ----- audit-wrong-whole -----
/** a worked solution with the wrong whole: give the corrected answer */
const fixAudit: Gen = (R, n) => {
  const kind = pick(R, ['tax', 'share', 'tip'] as const);
  let prompt = '', ans = 0, shown = 0, sol: string[] = [];
  if (kind === 'tax') {
    let P = pick(R, [40, 60, 80, 120, 200, 50]), d = pick(R, [25, 20, 50, 10]), t = pick(R, [5, 10, 8]);
    for (let k = 0; k < 60 && !isCents(pctOf(t, P * (100 - d) / 100)); k++) { P = pick(R, [40, 60, 80, 120, 200, 50]); d = pick(R, [25, 20, 50, 10]); t = pick(R, [5, 10, 8]); }
    if (!isCents(pctOf(t, P * (100 - d) / 100))) { P = 80; d = 25; t = 5; }
    const S = P * (100 - d) / 100;
    shown = S + pctOf(t, P); ans = r4(S + pctOf(t, S));
    prompt = `A ${A(money(P))} coat is ${d}% off, then ${t}% tax is added to the sale price. Sam writes: “Sale price ${money(S)}. Tax: ${t}% of ${money(P)} = ${money(pctOf(t, P))}. Total ${money(shown)}.” His arithmetic is right. What should the total be?`;
    sol = [`The tax is on the sale price: ${t}% of ${money(S)} = ${money(pctOf(t, S))}.`, `Total: ${money(S)} + ${money(pctOf(t, S))} = ${mark(money(ans))}.`];
  } else if (kind === 'share') {
    const x = rpNumbers(R, RCS[0]!, false); shown = pctOf(x.p, x.T); ans = x.ans;
    prompt = `Budget ${A(money(x.T))}, art to music ${B(`${x.a} : ${x.b}`)}. Art spends ${x.p}% of its share on paint. Sam writes: “Paint: ${x.p}% of ${money(x.T)} = ${money(shown)}.” His arithmetic is right. How much should the paint money be?`;
    sol = [`Art’s share first: ${money(x.T)} ÷ ${x.a + x.b} × ${x.a} = ${money(x.part)}.`, `Paint: ${x.p}% of ${money(x.part)} = ${mark(money(ans))}.`];
  } else {
    const Bl = pick(R, [40, 60, 80, 100, 50]), t = pick(R, [5, 10, 8]), q = pick(R, [15, 20]), X = Bl * t / 100;
    shown = pctOf(q, Bl + X); ans = pctOf(q, Bl);
    prompt = `Dinner is ${A(money(Bl))} before tax, plus ${t}% tax. The tip is ${q}% of the bill <b>before</b> tax. Sam writes: “Tip: ${q}% of ${money(Bl + X)} = ${money(shown)}.” His arithmetic is right. What should the tip be?`;
    sol = [`Sam took ${q}% of ${money(Bl + X)}, the bill with tax. The story says before tax: ${money(Bl)}.`, `The tip: ${q}% of ${money(Bl)} = ${mark(money(ans))}.`];
  }
  return { id: `fixAudit-${n}`, family: 'fixAudit', prompt, board: '\\text{fix it}', input: 'num', unit: 'dollars', answer: { kind: 'num', v: ans }, solution: sol,
    check: numCheck(ans, true, `Yes: ${money(ans)}. Sam’s mistake was the whole, not the arithmetic.`, 'Find the step that uses the wrong whole and redo it with the whole the story names.', [
      { v: shown, mc: MC.arithmeticOk, say: 'That is Sam’s answer. His arithmetic is right, but one step uses the wrong whole.' },
    ]) };
};

// ----- check-against-relationships -----
/** check a percent amount against its stated whole */
const checkPercent: Gen = (R, n) => {
  const x = rpNumbers(R, RCS[0]!, false), { a, b, T, part, other, p } = x;
  const kind = pick(R, ['ok', 'whole', 'other'] as const);
  const claim = kind === 'ok' ? x.ans : kind === 'whole' ? pctOf(p, T) : pctOf(p, other);
  if (kind !== 'ok' && near(claim, x.ans)) return checkPercent(R, n);
  const who = pick(R, ['Jo', 'Sam', 'Priya', 'Eli']);
  const opts: Opt[] = [
    { t: `Right: ${money(claim)} is ${p}% of art’s ${money(part)}`, ok: kind === 'ok', mc: kind === 'ok' ? undefined : MC.noSizeCheck,
      say: kind === 'ok' ? `Yes: ${money(claim)} ÷ ${money(part)} = ${dec(p)} = ${p}%.` : `Check it: ${money(claim)} ÷ ${money(part)} = ${nf(r4(claim / part * 100))}%, not ${p}%.` },
    { t: `Wrong: ${money(claim)} is ${p}% of the whole budget`, ok: kind === 'whole', say: kind === 'whole' ? `Yes: ${money(claim)} ÷ ${money(T)} = ${p}%. The paint is ${p}% of art’s share.` : `${money(claim)} ÷ ${money(T)} = ${nf(r4(claim / T * 100))}%, not ${p}%.` },
    { t: `Wrong: ${money(claim)} is ${p}% of music’s share`, ok: kind === 'other', say: kind === 'other' ? `Yes: ${money(claim)} ÷ ${money(other)} = ${p}%: the wrong share.` : `${money(claim)} ÷ ${money(other)} = ${nf(r4(claim / other * 100))}%, not ${p}%.` },
  ];
  return { id: `checkPercent-${n}`, family: 'checkPercent', prompt: `A club splits ${A(money(T))} art to music ${B(`${a} : ${b}`)} (art gets ${money(part)}). Art spends ${p}% of its share on paint. ${who} says the paint money is ${A(money(claim))}. Check it by dividing.`,
    board: `${tn(claim, true)} \\div \\,? = ${dec(p)}`, input: 'choice', ...choose(R, opts, true),
    solution: [`The paint should be ${p}% of art’s ${money(part)}: check ${money(claim)} ÷ ${money(part)}.`, `${p}% of ${money(part)} = ${money(x.ans)}.`] };
};

// ----- backward-check -----
/** undo a percent-then-ratio chain: from one share back to the start */
const undoPercentRatio: Gen = (R, n) => {
  let a = 3, b = 2, s = 5, u = 20, p = 20, T = 125;
  for (let k = 0; k < 300; k++) { [a, b] = pick(R, PAIRS); s = a + b; u = pick(R, [8, 10, 12, 15, 16, 20, 24]); p = pick(R, [20, 25, 10, 40, 50]); T = u * s * 100 / (100 - p); if (isWhole(T)) break; }
  const kept = u * s, X = b * u;
  return { id: `undoPercentRatio-${n}`, family: 'undoPercentRatio', prompt: `Lena and Omar won a prize. <b>${p}%</b> was taken out for taxes, and they split the rest, Lena to Omar ${B(`${a} : ${b}`)}. Omar got ${A(money(X))}. How big was the prize?`,
    board: `? \\xrightarrow{-${p}\\%} \\square \\xrightarrow{${a}:${b}} \\$${X}`, input: 'num', unit: 'dollars', answer: { kind: 'num', v: T },
    solution: [`Undo the last step first: Omar’s ${b} parts are ${money(X)}, so one part = ${money(u)} and the rest was ${s} × ${money(u)} = ${money(kept)}.`, `Undo the tax: ${money(kept)} is ${100 - p}% of the prize, so the prize = ${money(kept)} ÷ ${tn(r4(1 - p / 100))} = ${money(T)}.`],
    check: numCheck(T, true, `Yes: ${money(kept)} after tax, and that is ${100 - p}% of ${money(T)}.`, 'Undo the split first (find what they shared), then undo the tax by dividing.', [
      { v: kept, mc: MC.lostIntermediate, say: `${money(kept)} is what was left after tax. Undo the tax too.` },
      { v: r4(kept * (100 + p) / 100), mc: MC.oppositePct, say: `Adding ${p}% back doesn’t undo taking ${p}% off: the wholes are different. Divide by ${tn(r4(1 - p / 100))}.` },
      { v: r4(X * (100 + p) / 100), mc: MC.lostIntermediate, say: 'That only works on Omar’s share. Rebuild the whole amount they split first.' },
    ]) };
};

// ----- estimate-reasonableness -----
/** without calculating: is the final amount more, less, or the same? */
const direction: Gen = (R, n) => {
  const pairs: [number, number][] = [[-20, 20], [-10, 10], [10, -5], [-20, 25], [-50, 100], [15, -10], [-25, 20], [20, -15], [-30, 30], [-10, 8], [-40, 50]];
  const [c1, c2] = pick(R, pairs), P = pick(R, [40, 60, 80, 100, 120, 200]);
  const m = ((100 + c1) * (100 + c2)) / 10000, w = (c: number) => (c > 0 ? `up <b>${c}%</b>` : `down <b>${-c}%</b>`);
  const verdict = Math.abs(m - 1) < 1e-9 ? 0 : m > 1 ? 1 : -1;
  const opts: Opt[] = [
    { t: `Less than ${money(P)}`, ok: verdict < 0, mc: verdict === 0 ? MC.mulBigger : undefined, say: verdict < 0 ? `Yes: × ${tn(r4(m))} is below 1.` : verdict > 0 ? `× ${tn(r4(m))} is above 1, so it ends up more.` : `× ${tn(r4(m))} is exactly 1.` },
    { t: `More than ${money(P)}`, ok: verdict > 0, mc: verdict < 0 ? MC.mulBigger : undefined, say: verdict > 0 ? `Yes: × ${tn(r4(m))} is above 1.` : `The second change is a percent of a different amount. × ${tn(r4(m))} is ${verdict < 0 ? 'below' : 'exactly'} 1.` },
    { t: `Exactly ${money(P)}`, ok: verdict === 0, mc: verdict !== 0 ? MC.addsPercents : undefined, say: verdict === 0 ? `Yes: ${tn(r4(1 + c1 / 100))} × ${tn(r4(1 + c2 / 100))} = 1 exactly.` : 'The percents don’t cancel: the second is of the new amount.' },
  ];
  return { id: `direction-${n}`, family: 'direction', prompt: `A ${A(money(P))} bike goes ${w(c1)}, then ${w(c2)} of its new price. Without working out the price, where does it end up?`,
    board: `\\$${P} \\times ${tn(r4(1 + c1 / 100))} \\times ${tn(r4(1 + c2 / 100))}`, input: 'choice', ...choose(R, opts, true),
    solution: [`Multiply the multipliers: ${tn(r4(1 + c1 / 100))} × ${tn(r4(1 + c2 / 100))} = ${tn(r4(m))}.`, `${tn(r4(m))} is ${verdict < 0 ? 'below 1: less' : verdict > 0 ? 'above 1: more' : 'exactly 1: the same'}.`] };
};

// ----- transfer-new-context -----
/** three steps with a fixed amount, no plan given */
const transferThree: Gen = (R, n) => {
  const kind = pick(R, ['party', 'pay'] as const);
  if (kind === 'party') {
    const [a, b] = pick(R, PAIRS), T = (a + b) * pick(R, [40, 50, 60, 30]), p = pick(R, [10, 20, 25]), F = pick(R, [8, 10, 12, 15]);
    const share = T * a / (a + b), ans = r4(share * (100 - p) / 100 + F);
    return { id: `transferThree-${n}`, family: 'transferThree', prompt: `A ${A(money(T))} party budget is split food to games ${B(`${a} : ${b}`)}. The food order is all of food’s share at full price, but the store takes <b>${p}% off</b>, and delivery is a flat ${A(money(F))}. What does the food order cost with delivery?`,
      board: '\\text{food} = \\,?', input: 'num', unit: 'dollars', answer: { kind: 'num', v: ans },
      solution: [`Food’s share: ${money(T)} ÷ ${a + b} × ${a} = ${money(share)}.`, `${p}% off: ${money(share)} × ${tn(r4(1 - p / 100))} = ${money(r4(share * (100 - p) / 100))}.`, `Delivery: + ${money(F)} = ${money(ans)}.`],
      check: numCheck(ans, true, `Yes: ${money(ans)}.`, 'Share the budget, take the percent off food’s share, then add the fixed fee.', [
        { v: r4((share + F) * (100 - p) / 100), mc: MC.fixedCommute, say: `That takes ${p}% off the delivery too. The fee is added after the discount.` },
        { v: r4(T * (100 - p) / 100 + F), mc: MC.wrongWhole, say: 'That uses the whole budget. The food order is food’s share only.' },
        { v: r4(share * (100 - p) / 100), mc: MC.lostIntermediate, say: 'Add the delivery fee too.' },
      ]) };
  }
  const w = pick(R, [12, 15, 16, 20]), h = pick(R, [10, 20, 25, 30]), p = pick(R, [10, 20, 15]), F = pick(R, [20, 25, 30]);
  const pay = w * h, ans = r4(pay * (100 - p) / 100 - F);
  return { id: `transferThree-${n}`, family: 'transferThree', prompt: `Jo earns ${A(money(w))} an hour and works ${h} hours. <b>${p}%</b> of her pay is withheld for taxes. Then she buys a ${A(money(F))} bus pass. How much of her pay is left?`,
    board: '\\text{left} = \\,?', input: 'num', unit: 'dollars', answer: { kind: 'num', v: ans },
    solution: [`Pay: ${h} × ${money(w)} = ${money(pay)}.`, `After taxes: ${money(pay)} × ${tn(r4(1 - p / 100))} = ${money(r4(pay * (100 - p) / 100))}.`, `After the pass: − ${money(F)} = ${money(ans)}.`],
    check: numCheck(ans, true, `Yes: ${money(ans)}.`, 'Pay first, then the percent of the pay, then the fixed amount.', [
      { v: r4((pay - F) * (100 - p) / 100), mc: MC.fixedCommute, say: 'That takes the pass out before the tax. The tax is a percent of her whole pay.' },
      { v: r4(pay * p / 100 - F), mc: MC.changeAsFinal, say: `${p}% is the tax. She keeps the other ${100 - p}%.` },
      { v: r4(pay - F), mc: MC.lostIntermediate, say: 'Take the taxes out too.' },
    ]) };
};

const RAW: Record<FamilyId, Gen> = {
  labelStep, nameWhole, orderPlan, share, ratioPercent, percentRatio, twoChanges, multiplier, chainProduct, rounding, audit, checkShares, undo, estimate, transfer,
  findFixed, doubleTest, wholeValue, firstStep, planThree, shareFromPart, shareFraction, ratioPercentRest, rateThenPercent, percentThenRate, percentRatioGrow,
  netChange, threeStep, multiplierToPercent, roundingTip, fixAudit, checkPercent, undoPercentRatio, direction, transferThree,
};
/** a choice item's worked solution ends on the right choice (the steps card names it: docs/lessons/QUALITY_LAYER.md) */
const endsOnChoice = (g: Gen): Gen => (R, n, sg) => {
  const it = g(R, n, sg);
  if (it.input === 'choice' && it.answer.kind === 'choice') it.solution = endOnChoice(it.solution, it.choices![it.answer.i]!);
  return it;
};
/** "a 8 ft rope" → "an 8 ft rope", "A $80 jacket" → "An $80 jacket", "a 18% tip" → "an 18% tip": the article as the number is spoken */
const anFix = (h: string) => h
  .replace(/(^|[.?!:]\s+|“)A ((?:<b[^>]*>)*\$?(?:8|1[18](?![\d])))/g, '$1An $2')
  .replace(/(\s|\()a ((?:<b[^>]*>)*\$?(?:8|1[18](?![\d])))/g, '$1an $2');
/** every generator's text reads its articles right (prompt, choices, worked solution) */
const withArticles = <G extends (R: () => number, n: number, sg?: string) => Item>(g: G): G => ((R: () => number, n: number, sg?: string) => {
  const it = g(R, n, sg);
  it.prompt = anFix(it.prompt);
  it.solution = it.solution.map(anFix);
  if (it.choices) it.choices = it.choices.map(anFix);
  return it;
}) as G;
export const GENERATORS = Object.fromEntries(Object.entries(RAW).map(([k, g]) => [k, withArticles(endsOnChoice(g))])) as Record<FamilyId, Gen>;
