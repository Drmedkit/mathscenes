// items.ts: exercise families for "percent applications" (grade 7: markups, discounts, sales tax, tips, commission,
// income tax, simple interest, successive changes, reverse percents, percent error, comparing offers). Each family
// serves one or more sub-goals of the topic JSON (plan.ts) and uses that sub-goal's number ranges; money is exact in
// cents (money.ts), and every classic wrong answer is tagged with its misconception id
// (math-curriculum-essentials/misconceptions.json). Pure: no DOM, no canvas. A seeded rng makes sessions repeatable.
import { type Item, type Response, type Verdict, int, pick, shuffle } from '../../runtime/item';
import { endOnChoice } from '../../runtime/explain';
import { type Slot, type TapeRow } from './PercentTape';
import { applyC, chainC, decStr, money, moneyTex, mp, multNum, multStr, partC, partRaw, partRound, pctStr, rateStr, simpleInterest } from './money';

export type FamilyId = 'base' | 'baseCalc' | 'direction' | 'pctOf' | 'mult' | 'single' | 'commission' | 'round' | 'wages'
  | 'estimate' | 'successive' | 'reverse' | 'pctError' | 'interest' | 'months' | 'factor' | 'product' | 'net' | 'undo'
  | 'order' | 'shared' | 'offers';
export const FAMILIES: readonly { id: FamilyId; name: string }[] = [
  { id: 'base', name: 'Which amount is 100%?' },
  { id: 'baseCalc', name: 'Percent of the right amount' },
  { id: 'direction', name: 'Add it, take it off, or neither?' },
  { id: 'pctOf', name: 'The new amount as a percent' },
  { id: 'mult', name: 'One multiplier' },
  { id: 'single', name: 'One change in a story' },
  { id: 'commission', name: 'Salary plus commission' },
  { id: 'round', name: 'Round to the cent' },
  { id: 'wages', name: 'Income tax and take-home pay' },
  { id: 'estimate', name: 'Check with an estimate' },
  { id: 'successive', name: 'One change after another' },
  { id: 'reverse', name: 'Back to the original' },
  { id: 'pctError', name: 'Percent error' },
  { id: 'interest', name: 'Simple interest' },
  { id: 'months', name: 'Interest for months' },
  { id: 'factor', name: 'Why one multiplier works' },
  { id: 'product', name: 'Multiply the multipliers' },
  { id: 'net', name: 'The net change' },
  { id: 'undo', name: 'Undo a change' },
  { id: 'order', name: 'Does the order matter?' },
  { id: 'shared', name: 'Same base or a new base?' },
  { id: 'offers', name: 'Compare two offers' },
];
export const FAMILY_NAMES: Record<string, string> = Object.fromEntries(FAMILIES.map(f => [f.id, f.name]));

/** what the page can draw: percent tapes on one dollar scale (PercentTape.ts) */
export type Pic = {
  kind: 'tape';
  rows: TapeRow[];
  max?: number;
  /** a '?' label that turns into its value after a miss */ ask?: { r: number; slot: Slot };
  /** pieces lit after a miss */ hi?: { r: number; i: number; col: 'first' | 'second' | 'link' | 'pick' }[];
  /** dashed drops from one row to the next (the output becomes the next 100%) */ guides?: { at: number; r0: number; r1: number }[];
  /** a dashed mark with a word under it (after a miss) */ marks?: { r: number; at: number; text?: string; col: 'wrong' | 'pick' | 'first' }[];
};
export interface PaItem extends Item { family: FamilyId; picture?: Pic; /** TeX written on the board after a miss */ work?: string }
type Gen = (R: () => number, n: number, sg?: string) => PaItem;

export const MC = {
  overOne: 'mc.fractions-concept.fraction-must-be-less-than-one',
  newBase: 'mc.percent.new-or-estimate-as-base',
  changeWhole: 'mc.percent.change-amount-as-whole',
  exempt: 'mc.finance.taxes-exempt-items',
  ctxBase: 'mc.percent.contextual-percent-base-misidentified',
  compound: 'mc.finance.compounds-simple-interest',
  direction: 'mc.percent.wrong-direction-of-change',
  commAdded: 'mc.percent.commission-added-to-sales',
  changeFinal: 'mc.percent.change-reported-as-final-amount',
  point: 'mc.decimals.dollars-cents-point-misplaced',
  early: 'mc.decimals.intermediate-precision-always-invalid',
  cent: 'mc.money.cent-not-smallest-unit',
  moneyFlow: 'mc.finance.reverses-money-in-and-money-out',
  topBracket: 'mc.finance.top-bracket-rate-on-all-income',
  fixed: 'mc.percent.percent-as-fixed-amount',
  noCheck: 'mc.estimation.accepts-result-without-size-check',
  mustMatch: 'mc.estimation.rejects-answer-not-equal-to-estimate',
  adds: 'mc.percent.adds-successive-percent-changes',
  diffPct: 'mc.percent.difference-number-as-percent',
  negErr: 'mc.percent.negative-percent-error',
  interestBalance: 'mc.finance.confuses-interest-and-balance',
  numeral: 'mc.percent.percent-numeral-without-dividing-by-100',
  units: 'mc.measurement-units.combine-mismatched-units',
  meaning: 'mc.percent.multiplier-without-percent-meaning',
  pctOfAsChange: 'mc.percent.percent-of-read-as-percent-change',
  commutes: 'mc.functions-concept.composition-always-commutes',
  order: 'mc.percent.misjudges-order-of-changes',
  sharedMult: 'mc.percent.multiplies-adjustments-sharing-original-base',
  rebate: 'mc.finance.rebate-lowers-taxed-price',
  wholes: 'mc.fractions-concept.different-wholes-treated-as-same',
} as const;

// ---------- text helpers ----------
const A = (s: string | number) => `<b class="a">${s}</b>`;
const B = (s: string | number) => `<b class="b">${s}</b>`;
const S = (s: string | number) => `<b class="s">${s}</b>`;
const $ = (c: number) => money(c);
const $t = (c: number) => moneyTex(c);
const P = (p: number) => `${pctStr(p)}%`;
const Pt = (p: number) => `${pctStr(p)}\\%`;
/** a / an */
const an = (w: string) => (/^[aeiou]/i.test(w) ? `an ${w}` : `a ${w}`);

// ---------- checking helpers ----------
interface Opt { t: string; ok: boolean; mc?: string; say: string }
function choiceItem(R: () => number, base: Omit<PaItem, 'input' | 'choices' | 'answer' | 'check'>, opts: Opt[], keepOrder = false): PaItem {
  const O = keepOrder ? [...opts] : shuffle(R, [...opts]);
  const ts = new Set(O.map(o => o.t));
  if (ts.size !== O.length) throw new Error(`choices not unique: ${O.map(o => o.t).join(' | ')}`);
  return {
    ...base, solution: endOnChoice(base.solution, O.find(o => o.ok)!.t), input: 'choice', choices: O.map(o => o.t), answer: { kind: 'choice', i: O.findIndex(o => o.ok) },
    check: (r: Response): Verdict => {
      const o = r.kind === 'choice' ? O[r.i] : undefined;
      if (!o) return { ok: false, say: 'Pick one.' };
      return { ok: o.ok, mc: o.mc, say: o.say };
    },
  };
}
interface Wrong { v: number; mc?: string; say: string; tol?: number }
/**
 * a number answer: right within tol, a recognised wrong value (its misconception), or a plain miss. Money answers
 * of $1,000 or more also pass when typed with a thousands comma ("1,450" reads as 1.45 in the shared input).
 */
function numCheck(ans: number, okSay: string, wrongs: Wrong[], missSay: string, tol = 1e-6): (r: Response) => Verdict {
  return r => {
    if (r.kind !== 'num') return { ok: false, say: 'Type a number.' };
    if (!Number.isFinite(r.v)) return { ok: false, say: 'Type just the number: no $ or % sign, and no commas.' };
    if (Math.abs(r.v - ans) <= tol) return { ok: true, say: okSay };
    if (ans >= 1000 && r.v < 1000 && Math.abs(r.v * 1000 - ans) <= tol) return { ok: true, say: okSay };
    for (const w of wrongs) {
      const t = w.tol ?? tol;
      if (Math.abs(w.v - ans) > Math.max(t, tol) * 2 && Math.abs(r.v - w.v) <= t) return { ok: false, mc: w.mc, say: w.say };
    }
    return { ok: false, say: missSay };
  };
}
/** a money item: the answer in dollars from cents */
function moneyItem(base: Omit<PaItem, 'input' | 'answer' | 'check' | 'unit'>, ansC: number, okSay: string, wrongs: { c: number; mc?: string; say: string; loose?: boolean }[], missSay: string): PaItem {
  return {
    ...base, input: 'num', unit: 'dollars', answer: { kind: 'num', v: ansC / 100 },
    check: numCheck(ansC / 100, okSay, wrongs.map(w => ({ v: w.c / 100, mc: w.mc, say: w.say, tol: w.loose ? 0.0051 : 1e-6 })), missSay, 1e-6),
  };
}
/** keep drawing until make() returns a value (exact cents and similar constraints) */
function until<T>(make: () => T | null, what: string): T {
  for (let i = 0; i < 400; i++) { const v = make(); if (v !== null) return v; }
  throw new Error(`no ${what} found`);
}
const cut = (amt: number, pct?: string, val?: string) => ({ amt, role: 'cut' as const, pct, val });
const seg = (role: 'base' | 'change' | 'result' | 'plain' | 'ghost', amt: number, pct?: string, val?: string) => ({ amt, role, pct, val });
const D = (c: number) => c / 100;

// ---------- contexts ----------
const GOODS = ['jacket', 'pair of sneakers', 'video game', 'tablet', 'speaker', 'hoodie', 'backpack', 'skateboard', 'phone case', 'bike helmet', 'desk lamp', 'guitar'] as const;
/** believable shelf prices, in dollars: an item is only named with a price in its range */
export const PRICE_RANGE: Record<string, [number, number]> = {
  'phone case': [8, 60], 'video game': [20, 80], hoodie: [20, 90], backpack: [20, 150], 'desk lamp': [15, 120], 'bike helmet': [20, 150],
  jacket: [30, 300], 'pair of sneakers': [40, 250], tablet: [100, 1000], speaker: [20, 500], skateboard: [40, 300], guitar: [80, 2000],
  lamp: [15, 200], 'pair of headphones': [20, 400], 'desk chair': [50, 500], tent: [40, 600], 'soccer ball': [10, 60], 'water bottle': [5, 50], bike: [100, 2000],
};
/** an item from the pool whose believable price range holds every amount (in cents) the story names with it */
export function itemFor(R: () => number, pool: readonly string[], ...cents: number[]): string {
  const fits = (g: string) => cents.every(c => c / 100 >= PRICE_RANGE[g]![0] && c / 100 <= PRICE_RANGE[g]![1]);
  const ok = pool.filter(fits);
  if (ok.length) return pick(R, ok);
  const off = (g: string) => cents.reduce((s, c) => { const [lo, hi] = PRICE_RANGE[g]!, d = c / 100; return s + (d < lo ? lo / d : d > hi ? d / hi : 1); }, 0);
  return pool.slice().sort((a, b) => off(a) - off(b))[0]!;
}
const STOCK = ['lamp', 'backpack', 'skateboard', 'guitar', 'pair of headphones', 'desk chair', 'tent', 'soccer ball', 'water bottle', 'bike'] as const;
const NAMES = ['Dana', 'Marcus', 'Priya', 'Leo', 'Sofia', 'Jamal', 'Mei', 'Carlos', 'Aisha', 'Noah', 'Grace', 'Omar'] as const;
const TAX = [4, 5, 6, 6.25, 6.5, 7, 7.25, 8, 8.25, 8.875, 9, 10] as const;
const WHOLE_TAX = [4, 5, 6, 7, 8, 9, 10] as const;

// ===== stage 1: which amount is 100% =====
type BaseCtx = 'markup' | 'discount' | 'tax' | 'tipcomm' | 'interest';
const BASE_SG: Record<string, BaseCtx> = { 'base-markup': 'markup', 'base-discount': 'discount', 'base-sales-tax': 'tax', 'base-tip-commission': 'tipcomm', 'base-simple-interest': 'interest' };
const baseCtx = (R: () => number, sg?: string): BaseCtx => BASE_SG[sg ?? ''] ?? pick(R, ['markup', 'discount', 'tax', 'tipcomm', 'interest'] as const);

function markupNums(R: () => number, big = false): { cost: number; p: number; m: number; price: number; item: string } {
  return until(() => {
    const cost = 100 * pick(R, [10, 20, 24, 40, 60, 80, 120, 160, 200, 240, 300, 400, 500, 800, 1000]);
    const p = big ? pick(R, [150, 120, 200]) : pick(R, [20, 25, 40, 50, 60, 75, 100, 150]);
    const m = partC(cost, p);
    return m === null ? null : { cost, p, m, price: cost + m, item: itemFor(R, STOCK, cost, cost + m) };
  }, 'markup');
}
function discountNums(R: () => number): { o: number; p: number; d: number; s: number; item: string } {
  return until(() => {
    const o = 100 * pick(R, [20, 24, 30, 40, 50, 60, 80, 90, 120, 150, 200, 240, 300, 400, 500, 640, 800, 1000]);
    const p = pick(R, [10, 15, 20, 25, 30, 40, 50, 60, 75]);
    const d = partC(o, p);
    return d === null ? null : { o, p, d, s: o - d, item: itemFor(R, GOODS, o, o - d) };
  }, 'discount');
}

const baseFam: Gen = (R, n, sg) => {
  const k = baseCtx(R, sg);
  if (k === 'markup') {
    const { cost, p, m, price, item } = markupNums(R, R() < 0.35);
    if (m === cost) return baseFam(R, n, sg);   // a 100% markup: "the store's cost" and "the markup" would be the same amount
    const opts: Opt[] = [
      { t: `The store’s cost, ${$(cost)}`, ok: true, say: `Yes: a markup is measured against what the store paid. ${$(cost)} is 100%, and the ${P(p)} markup is ${$(m)} on top.` },
      { t: `The selling price, ${$(price)}`, ok: false, mc: MC.newBase, say: `${$(price)} is where the markup ends up. The markup is measured against the cost the store paid: ${$(cost)} is 100%.` },
      p > 100
        ? { t: `Neither: a markup can’t be more than 100%`, ok: false, mc: MC.overOne, say: `It can: a ${P(p)} markup adds more than the cost itself. The cost ${$(cost)} is still 100%.` }
        : { t: `The markup itself, ${$(m)}`, ok: false, mc: MC.changeWhole, say: `${$(m)} is the part that gets added. It is ${P(p)} OF the cost, so the cost ${$(cost)} is 100%.` },
    ];
    return choiceItem(R, {
      id: `base-${n}`, family: 'base',
      prompt: `A store pays ${A($(cost))} for ${an(item)} and marks it up ${B(P(p))}, so it sells for ${$(price)}. The ${P(p)} is a percent of which amount?`,
      board: `${Pt(p)}\\ \\text{markup}`,
      picture: { kind: 'tape', rows: [{ segs: [seg('plain', D(cost), '100%', $(cost)), seg('change', D(m), P(p), $(m))], end: $(price), endCol: 'dim' }], ask: { r: 0, slot: 'pct0' }, hi: [{ r: 0, i: 0, col: 'first' }] },
      work: `${$t(cost)} = 100\\%`,
      solution: [`A markup is measured against the store’s cost: ${A($(cost))} is 100%.`, `The markup ${B($(m))} is ${P(p)} of ${$(cost)}, and ${$(cost)} + ${$(m)} = ${$(price)}.`],
    }, opts);
  }
  if (k === 'discount') {
    const { o, p, d, s, item } = discountNums(R);
    if (d === s) return baseFam(R, n, sg);   // 50% off: "the sale price" and "the amount you save" would be the same amount
    return choiceItem(R, {
      id: `base-${n}`, family: 'base',
      prompt: `${an(item)[0]!.toUpperCase() + an(item).slice(1)} is ${B(`${P(p)} off`)}. The sale price is ${$(s)}, and you save ${$(d)}. The ${P(p)} is a percent of which amount?`,
      board: `${Pt(p)}\\ \\text{off}`,
      picture: { kind: 'tape', rows: [{ lead: $(o), segs: [seg('plain', D(s), undefined, $(s)), cut(D(d), P(p), $(d))] }], ask: { r: 0, slot: 'lead' }, hi: [{ r: 0, i: 0, col: 'first' }, { r: 0, i: 1, col: 'first' }] },
      work: `${$t(o)} = 100\\%`,
      solution: [`A discount is taken off the price BEFORE the sale: the original price ${A($(o))} is 100%.`, `${P(p)} of ${$(o)} is ${B($(d))}, and ${$(o)} − ${$(d)} = ${$(s)}.`],
    }, [
      { t: `The original price, ${$(o)}`, ok: true, say: `Yes: the percent off is taken of the price before the sale, ${$(o)}.` },
      { t: `The sale price, ${$(s)}`, ok: false, mc: MC.newBase, say: `The sale price is what is left AFTER the discount. The ${P(p)} is of the original price, ${$(o)}.` },
      { t: `The amount you save, ${$(d)}`, ok: false, mc: MC.changeWhole, say: `${$(d)} is the discount itself: the ${P(p)} part. It is ${P(p)} of the original price ${$(o)}.` },
    ]);
  }
  if (k === 'tax') {
    const { t, e, r, item } = until(() => {
      const t = 100 * pick(R, [16, 20, 24, 32, 40, 48, 60, 64, 80, 120, 160]), e = 100 * int(R, 6, 40) + pick(R, [0, 50, 25, 75]);
      const r = pick(R, TAX);
      return partC(t, r) === null ? null : { t, e, r, item: itemFor(R, GOODS, t) };
    }, 'tax');
    const food = pick(R, ['groceries', 'school books', 'medicine']), are = food === 'medicine' ? 'is' : 'are';
    return choiceItem(R, {
      id: `base-${n}`, family: 'base',
      prompt: `You buy ${an(item)} for ${A($(t))} and ${$(e)} of ${food}. In this state, ${food} ${are} not taxed, and the sales tax is ${B(P(r))}. (Rates differ from state to state.) The ${P(r)} is taken of which amount?`,
      board: `${Pt(r)}\\ \\text{sales tax}`,
      picture: { kind: 'tape', rows: [{ segs: [seg('plain', D(t), '100%', $(t)), seg('plain', D(e), undefined, $(e))] }], ask: { r: 0, slot: 'pct0' }, hi: [{ r: 0, i: 0, col: 'first' }] },
      work: `\\text{taxed: } ${$t(t)} = 100\\%`,
      solution: [`Sales tax is added on top of the taxable amount, and only the ${item} is taxable: ${A($(t))} is 100%.`, `The ${food} (${$(e)}) ${are} not taxed, so ${food === 'medicine' ? 'it is' : 'they are'} not part of the base.`],
    }, [
      { t: `${$(t)}, the taxable ${item}`, ok: true, say: `Yes: only the taxable amount is the base. The ${food} ${are} not taxed.` },
      { t: `${$(t + e)}, everything you buy`, ok: false, mc: MC.exempt, say: `The ${food} ${are} not taxed in this state, so ${food === 'medicine' ? 'it is' : 'they are'} not in the base. Only the ${$(t)} ${item} is taxed.` },
      { t: `The total after tax`, ok: false, mc: MC.newBase, say: `The total after tax already has the tax in it. Tax is a percent of the amount BEFORE tax: the ${$(t)} ${item}.` },
    ]);
  }
  if (k === 'tipcomm') {
    const v = int(R, 0, 2);
    if (v === 0) {
      const { b, x, p } = until(() => {
        const b = 100 * pick(R, [24, 30, 40, 45, 50, 60, 64, 75, 80, 90, 120]), x = partC(b, pick(R, [5, 6, 8, 10]));
        return x === null ? null : { b, x, p: pick(R, [15, 18, 20]) };
      }, 'tip');
      return choiceItem(R, {
        id: `base-${n}`, family: 'base',
        prompt: `Your restaurant bill is ${A($(b))} before tax, and the tax is ${$(x)}. You leave a ${B(`${P(p)} tip`)} on the pre-tax bill. ${P(p)} of which amount?`,
        board: `${Pt(p)}\\ \\text{tip}`,
        picture: { kind: 'tape', rows: [{ segs: [seg('plain', D(b), '100%', $(b)), seg('plain', D(x), undefined, $(x))] }], ask: { r: 0, slot: 'pct0' }, hi: [{ r: 0, i: 0, col: 'first' }] },
        work: `\\text{bill: } ${$t(b)} = 100\\%`,
        solution: [`The problem says the tip is on the pre-tax bill: ${A($(b))} is 100%.`, `The tax ${$(x)} is not part of the base.`],
      }, [
        { t: `${$(b)}, the bill before tax`, ok: true, say: `Yes: the policy says pre-tax, so the base is ${$(b)}.` },
        { t: `${$(b + x)}, the bill with tax`, ok: false, mc: MC.ctxBase, say: `This tip is on the pre-tax bill, as the problem says. The base is ${$(b)}, not ${$(b + x)}.` },
        { t: `The bill plus the tip`, ok: false, mc: MC.ctxBase, say: `The tip can’t be part of its own base. It is ${P(p)} of the pre-tax bill, ${$(b)}.` },
      ]);
    }
    if (v === 1) {
      const who = pick(R, NAMES), sal = 100 * pick(R, [200, 250, 300, 400, 450, 500, 600, 750, 800, 1000]);
      const sales = 100 * pick(R, [1200, 2000, 2500, 3000, 4000, 4800, 5000, 6000, 8000, 10000]), p = pick(R, [2, 3, 4, 5, 6, 8, 10]);
      return choiceItem(R, {
        id: `base-${n}`, family: 'base',
        prompt: `${who} earns a ${$(sal)} weekly salary plus a ${B(`${P(p)} commission`)} on sales. This week ${who} sold ${A($(sales))}. The ${P(p)} is a percent of which amount?`,
        board: `${Pt(p)}\\ \\text{commission}`,
        work: `\\text{sales: } ${$t(sales)} = 100\\%`,
        solution: [`A commission is a percent of the sales: ${A($(sales))} is 100%.`, `The salary is paid on top; it is not part of the base.`],
      }, [
        { t: `${$(sales)}, the sales`, ok: true, say: `Yes: commission is a percent of sales. The salary is separate.` },
        { t: `${$(sales + sal)}, sales plus salary`, ok: false, mc: MC.ctxBase, say: `The salary is not sold: the commission is only on sales, ${$(sales)}.` },
        { t: `${$(sal)}, the salary`, ok: false, mc: MC.ctxBase, say: `The commission is paid for selling, so it is a percent of sales, ${$(sales)}.` },
      ]);
    }
    const { s, f } = until(() => { const s = 100 * pick(R, [40, 48, 60, 75, 80, 90, 120, 150]), f = partC(s, 12); return f === null ? null : { s, f }; }, 'fee');
    return choiceItem(R, {
      id: `base-${n}`, family: 'base',
      prompt: `Concert tickets cost ${A($(s))}. The site adds a ${B('12% service fee')} on that subtotal, and then 7% tax on the subtotal plus the fee. The 12% fee is a percent of which amount?`,
      board: `12\\%\\ \\text{fee}`,
      picture: { kind: 'tape', rows: [{ segs: [seg('plain', D(s), '100%', $(s)), seg('change', D(f), '12%')] }], ask: { r: 0, slot: 'pct0' }, hi: [{ r: 0, i: 0, col: 'first' }] },
      work: `\\text{subtotal: } ${$t(s)} = 100\\%`,
      solution: [`The problem states the base: the fee is on the ${A($(s))} subtotal.`, `The tax comes later and is on a different base (subtotal plus fee).`],
    }, [
      { t: `${$(s)}, the ticket subtotal`, ok: true, say: `Yes: the fee is stated on the subtotal.` },
      { t: `The subtotal plus the tax`, ok: false, mc: MC.ctxBase, say: `The problem says the fee is on the subtotal. Tax is not part of the fee’s base: ${$(s)}.` },
      { t: `The final total you pay`, ok: false, mc: MC.newBase, say: `The final total already has the fee in it. The fee is on the subtotal, ${$(s)}.` },
    ]);
  }
  // simple interest: the principal stays the base every year
  const { pr, p, i } = until(() => { const pr = 100 * pick(R, [200, 500, 800, 1000, 1200, 1500, 2000, 2500, 4000, 5000, 10000]), p = int(R, 1, 12), i = partC(pr, p); return i === null ? null : { pr, p, i }; }, 'interest');
  const b2 = pr + 2 * i, b3 = pr + 3 * i;
  return choiceItem(R, {
    id: `base-${n}`, family: 'base',
    prompt: `You save ${A($(pr))} at ${B(`${P(p)} simple interest`)} per year. After 2 years the balance is ${$(b2)}. The interest for year 3 is ${P(p)} of which amount?`,
    board: `\\begin{array}{lr} \\text{year} & \\text{balance} \\\\ \\hline 0 & ${$t(pr)} \\\\ 1 & ${$t(pr + i)} \\\\ 2 & ${$t(b2)} \\\\ 3 & ? \\end{array}`,
    picture: { kind: 'tape', rows: [{ segs: [seg('plain', D(pr), '100%', $(pr)), seg('change', D(i), P(p)), seg('change', D(i), P(p)), seg('change', D(i), P(p))] }], ask: { r: 0, slot: 'pct0' }, hi: [{ r: 0, i: 0, col: 'first' }] },
    work: `\\text{principal } ${$t(pr)} = 100\\%`,
    solution: [`Simple interest is always a percent of the principal: ${A($(pr))} is 100% every year.`, `So each year adds the same ${B($(i))}, and year 3 ends at ${$(b3)}.`],
  }, [
    { t: `${$(pr)}, the principal`, ok: true, say: `Yes: simple interest uses the principal every year, so every year adds ${$(i)}.` },
    { t: `${$(b2)}, the balance after year 2`, ok: false, mc: MC.compound, say: `That would be interest on interest. SIMPLE interest is always on the principal, ${$(pr)}.` },
    { t: `${$(b3)}, the balance after year 3`, ok: false, mc: MC.newBase, say: `That balance already includes year 3’s interest. Simple interest is on the principal, ${$(pr)}.` },
  ]);
};

const baseCalc: Gen = (R, n, sg) => {
  const k = baseCtx(R, sg);
  if (k === 'markup') {
    const { cost, p, m, price, item } = markupNums(R, R() < 0.35);
    const onPrice = (100 * m) / price, ratio = (100 * price) / cost;
    return {
      id: `baseCalc-${n}`, family: 'baseCalc', input: 'num', unit: '%',
      prompt: `A store buys ${an(item)} for ${A($(cost))} and sells it for ${$(price)}. What is the percent markup?`,
      board: `${$t(cost)} \\to ${$t(price)}`, work: `\\tfrac{${D(m)}}{${D(cost)}} = \\cssId{s}{${pctStr(p)}\\%}`,
      picture: { kind: 'tape', rows: [{ lead: $(cost), segs: [seg('base', D(cost), '100%'), seg('change', D(m), P(p), $(m))], end: $(price), endCol: 'dim' }], ask: { r: 0, slot: 'pct1' }, hi: [{ r: 0, i: 1, col: 'link' }] },
      solution: [`The markup is ${$(price)} − ${$(cost)} = ${B($(m))}.`, `It is measured against the cost: ${$(m)} ÷ ${$(cost)} = ${S(P(p))}.`],
      answer: { kind: 'num', v: p },
      check: numCheck(p, `Yes: ${$(m)} on a ${$(cost)} cost is a ${P(p)} markup.`, [
        { v: onPrice, mc: MC.newBase, say: `That divides by the selling price. A markup is measured against the cost: ${$(m)} ÷ ${$(cost)} = ${P(p)}.`, tol: 0.51 },
        { v: ratio, mc: MC.pctOfAsChange, say: `${$(price)} is ${decStr(Math.round(ratio * 10), 10)}% OF the cost: that includes the cost itself. The markup is the part on top: ${P(p)}.`, tol: 0.51 },
      ], `Markup ÷ cost: ${$(m)} ÷ ${$(cost)}.`),
    };
  }
  if (k === 'discount') {
    const { o, p, d, s, item } = discountNums(R);
    const onSale = (100 * d) / s;
    return {
      id: `baseCalc-${n}`, family: 'baseCalc', input: 'num', unit: '%',
      prompt: `${an(item)[0]!.toUpperCase() + an(item).slice(1)} was ${A($(o))} and is now ${$(s)}. What percent off is that?`,
      board: `${$t(o)} \\to ${$t(s)}`, work: `\\tfrac{${D(d)}}{${D(o)}} = \\cssId{s}{${pctStr(p)}\\%}`,
      picture: { kind: 'tape', rows: [{ lead: $(o), segs: [seg('base', D(s), undefined, $(s)), cut(D(d), P(p), $(d))] }], ask: { r: 0, slot: 'pct1' }, hi: [{ r: 0, i: 1, col: 'link' }] },
      solution: [`You save ${$(o)} − ${$(s)} = ${B($(d))}.`, `A discount is measured against the original price: ${$(d)} ÷ ${$(o)} = ${S(P(p))}.`],
      answer: { kind: 'num', v: p },
      check: numCheck(p, `Yes: ${$(d)} off ${$(o)} is ${P(p)} off.`, [
        { v: onSale, mc: MC.newBase, say: `That divides by the sale price. Percent off is measured against the ORIGINAL price: ${$(d)} ÷ ${$(o)} = ${P(p)}.`, tol: 0.51 },
        { v: 100 - p, mc: MC.pctOfAsChange, say: `${$(s)} is ${100 - p}% OF the original price: that is what you pay. The percent off is the rest: ${P(p)}.` },
      ], `Savings ÷ original price: ${$(d)} ÷ ${$(o)}.`),
    };
  }
  if (k === 'tax') {
    const { t, e, r, x, item } = until(() => {
      const t = 100 * pick(R, [16, 20, 24, 32, 40, 48, 60, 64, 80, 120, 160]), e = 100 * pick(R, [8, 10, 12, 15, 20, 24, 30]);
      const r = pick(R, TAX), x = partC(t, r);
      return x === null ? null : { t, e, r, x, item: itemFor(R, GOODS, t) };
    }, 'tax');
    const all = partRaw(t + e, r);
    return moneyItem({
      id: `baseCalc-${n}`, family: 'baseCalc',
      prompt: `You buy ${an(item)} for ${A($(t))} and ${$(e)} of groceries. Groceries are not taxed here; the sales tax is ${B(P(r))}. How much sales tax do you pay?`,
      board: `${Pt(r)} \\times ${$t(t)}`, work: `${rateStr(r)} \\times ${D(t)} = \\cssId{s}{${$t(x)}}`,
      picture: { kind: 'tape', rows: [{ lead: $(t), segs: [seg('base', D(t), '100%'), seg('change', D(x), P(r), $(x))] }], ask: { r: 0, slot: 'val1' }, hi: [{ r: 0, i: 1, col: 'link' }] },
      solution: [`Only the ${item} is taxed: ${A($(t))} is the base.`, `${P(r)} of ${$(t)} = ${rateStr(r)} × ${D(t)} = ${S($(x))}.`],
    }, x, `Yes: ${P(r)} of the taxable ${$(t)} is ${$(x)}.`, [
      { c: Math.round(all), mc: MC.exempt, say: `That taxes the groceries too. Only the ${$(t)} ${item} is taxable: ${$(x)}.`, loose: true },
      { c: t + x, mc: MC.changeFinal, say: `That is the ${item} plus its tax. The question asks for the tax alone: ${$(x)}.` },
    ], `${P(r)} of the taxable amount, ${$(t)}.`);
  }
  if (k === 'tipcomm') {
    if (R() < 0.5) {
      const { b, x, p, tip } = until(() => {
        const b = 100 * pick(R, [24, 30, 40, 45, 50, 60, 64, 75, 80, 90, 120]), x = partC(b, pick(R, [5, 6, 8, 10])), p = pick(R, [15, 18, 20]);
        const tip = partC(b, p);
        return x === null || tip === null ? null : { b, x, p, tip };
      }, 'tip');
      return moneyItem({
        id: `baseCalc-${n}`, family: 'baseCalc',
        prompt: `Your bill is ${A($(b))} before tax, plus ${$(x)} tax. You tip ${B(P(p))} of the pre-tax bill. How much is the tip?`,
        board: `${Pt(p)} \\times ${$t(b)}`, work: `${rateStr(p)} \\times ${D(b)} = \\cssId{s}{${$t(tip)}}`,
        picture: { kind: 'tape', rows: [{ lead: $(b), segs: [seg('base', D(b), '100%'), seg('change', D(tip), P(p), $(tip))] }], ask: { r: 0, slot: 'val1' }, hi: [{ r: 0, i: 1, col: 'link' }] },
        solution: [`The tip is on the pre-tax bill: ${A($(b))}.`, `${P(p)} of ${$(b)} = ${S($(tip))}.`],
      }, tip, `Yes: ${P(p)} of ${$(b)} is ${$(tip)}.`, [
        { c: Math.round(partRaw(b + x, p)), mc: MC.ctxBase, say: `That tips on the bill with tax. This tip is on the pre-tax ${$(b)}: ${$(tip)}.`, loose: true },
        { c: b + tip, mc: MC.changeFinal, say: `That is the bill plus the tip. The question asks for the tip alone: ${$(tip)}.` },
      ], `${P(p)} of the pre-tax bill, ${$(b)}.`);
    }
    const who = pick(R, NAMES), sal = 100 * pick(R, [200, 300, 400, 500, 600, 800]);
    const sales = 100 * pick(R, [1200, 2000, 2500, 3000, 4000, 5000, 6000, 8000]), p = pick(R, [2, 3, 4, 5, 6, 8, 10]);
    const com = partC(sales, p)!;
    return moneyItem({
      id: `baseCalc-${n}`, family: 'baseCalc',
      prompt: `${who} gets a ${$(sal)} salary plus ${B(`${P(p)} commission`)} on sales, and sold ${A($(sales))}. How much is the commission?`,
      board: `${Pt(p)} \\times ${$t(sales)}`, work: `${rateStr(p)} \\times ${D(sales)} = \\cssId{s}{${$t(com)}}`,
      solution: [`Commission is a percent of sales: ${A($(sales))}.`, `${P(p)} of ${$(sales)} = ${S($(com))}.`],
    }, com, `Yes: ${P(p)} of ${$(sales)} is ${$(com)}.`, [
      { c: partC(sales + sal, p) ?? -1, mc: MC.ctxBase, say: `That includes the salary in the base. Commission is only on sales: ${$(com)}.` },
      { c: sales + com, mc: MC.commAdded, say: `That adds the commission to the sales. ${who}’s commission is just ${P(p)} of sales: ${$(com)}.` },
    ], `${P(p)} of the sales, ${$(sales)}.`);
  }
  const { pr, p, i } = until(() => { const pr = 100 * pick(R, [200, 500, 800, 1000, 1200, 1500, 2000, 2500, 4000, 5000]), p = int(R, 1, 12), i = partC(pr, p); return i === null ? null : { pr, p, i }; }, 'interest');
  const comp3 = Math.round(partRaw(pr + 2 * i, p));
  return moneyItem({
    id: `baseCalc-${n}`, family: 'baseCalc',
    prompt: `You save ${A($(pr))} at ${B(`${P(p)} simple interest`)} per year. How much interest do you earn in year 3?`,
    board: `${Pt(p)} \\times ${$t(pr)}`, work: `${rateStr(p)} \\times ${D(pr)} = \\cssId{s}{${$t(i)}}`,
    picture: { kind: 'tape', rows: [{ lead: $(pr), segs: [seg('base', D(pr), '100%'), seg('change', D(i)), seg('change', D(i)), seg('change', D(i), undefined, $(i))] }], ask: { r: 0, slot: 'val3' }, hi: [{ r: 0, i: 3, col: 'link' }] },
    solution: [`Simple interest is a percent of the principal ${A($(pr))}, every year.`, `${P(p)} of ${$(pr)} = ${S($(i))}, in year 1, year 2 and year 3 alike.`],
  }, i, `Yes: every year earns ${$(i)}, year 3 too.`, [
    { c: comp3, mc: MC.compound, say: `That takes interest on the year-2 balance. Simple interest stays on the principal: ${$(i)} every year.`, loose: true },
    { c: pr * p, mc: MC.numeral, say: `That multiplies by ${p}, not by ${P(p)} = ${rateStr(p)}. ${P(p)} of ${$(pr)} is ${$(i)}.` },
  ], `${P(p)} of the principal, ${$(pr)}.`);
};

// ===== add-or-subtract =====
interface DirCtx { word: (p: string) => string; dir: 1 | -1 | 0; story: (b: string, p: string) => string; what: string; rates?: readonly number[]; bases?: readonly number[] }
const DIRS: readonly DirCtx[] = [
  { word: p => `a ${p} markup`, dir: 1, story: (b, p) => `A store marks up a ${b} lamp by ${p}.`, what: 'the selling price', bases: [20, 40, 50, 60, 80, 120, 200] },
  { word: p => `${p} off`, dir: -1, story: (b, p) => `A ${b} jacket is ${p} off.`, what: 'the sale price', bases: [40, 50, 60, 80, 120, 200] },
  { word: p => `a ${p} markdown`, dir: -1, story: (b, p) => `A ${b} speaker is marked down ${p}.`, what: 'the new price' },
  { word: p => `${p} sales tax`, dir: 1, story: (b, p) => `You buy a ${b} game with ${p} sales tax.`, what: 'the total you pay', rates: [5, 6, 7, 8, 10], bases: [20, 40, 50, 60] },
  { word: p => `a ${p} tip`, dir: 1, story: (b, p) => `Your dinner bill is ${b}, and you leave a ${p} tip.`, what: 'the total you pay' },
  { word: p => `a ${p} coupon`, dir: -1, story: (b, p) => `You use a ${p}-off coupon on a ${b} hoodie.`, what: 'the price you pay', bases: [20, 40, 50, 60, 80] },
  { word: p => `${p} interest`, dir: 1, story: (b, p) => `${b} sits in savings for a year at ${p} simple interest.`, what: 'the balance after a year', rates: [2, 3, 4, 5] },
  { word: p => `a ${p} commission`, dir: 0, story: (b, p) => `A salesperson sells ${b} of furniture and earns a ${p} commission.`, what: 'the commission' },
];
const direction: Gen = (R, n) => {
  const c = pick(R, DIRS);
  const base = 100 * pick(R, c.bases ?? [20, 40, 50, 60, 80, 120, 200, 400]), p = pick(R, c.rates ?? [10, 15, 20, 25, 50]);   // tax and savings rates stay real-world
  const d = partC(base, p)!;
  if (R() < 0.5) {
    const opts: Opt[] = [
      { t: 'Added: the amount goes up', ok: c.dir === 1, mc: c.dir === -1 ? MC.direction : c.dir === 0 ? MC.commAdded : undefined, say: '' },
      { t: 'Taken off: the amount goes down', ok: c.dir === -1, mc: c.dir === 1 ? MC.direction : undefined, say: '' },
      { t: 'Neither: it is a separate amount', ok: c.dir === 0, mc: c.dir !== 0 ? MC.changeFinal : undefined, say: '' },
    ];
    const right = c.dir === 1 ? `${c.word(P(p))} makes the amount go up: add ${$(d)}.` : c.dir === -1 ? `${c.word(P(p))} makes the price go down: take ${$(d)} off.` : `The commission is a percent OF the sales, paid to the seller. It is not added to or taken off the sales.`;
    opts.forEach(o => { o.say = o.ok ? `Yes. ${right}` : right; });
    return choiceItem(R, {
      id: `direction-${n}`, family: 'direction',
      prompt: `${c.story(A($(base)), B(P(p)))} Is the ${P(p)} amount added to ${$(base)}, taken off it, or neither?`,
      board: `${$t(base)},\\ ${Pt(p)}`,
      solution: [right, c.dir === 0 ? `The seller earns ${P(p)} of ${$(base)} = ${$(d)}; the sales stay ${$(base)}.` : `${P(p)} of ${$(base)} is ${$(d)}, so ${c.what} is ${$(base + c.dir * d)}.`],
    }, opts, true);
  }
  if (c.dir === 0) {
    return moneyItem({
      id: `direction-${n}`, family: 'direction',
      prompt: `${c.story(A($(base)), B(P(p)))} How much commission does the salesperson earn?`,
      board: `${Pt(p)} \\times ${$t(base)}`, work: `\\cssId{s}{${$t(d)}}`,
      solution: [`The commission is ${P(p)} of the sales ${A($(base))}.`, `${P(p)} of ${$(base)} = ${S($(d))}. It is not added to the sales.`],
    }, d, `Yes: the commission is ${$(d)}.`, [
      { c: base + d, mc: MC.commAdded, say: `That adds the commission to the sales. The salesperson earns just ${P(p)} of the sales: ${$(d)}.` },
      { c: base - d, mc: MC.direction, say: `Nothing is taken off the sales. The commission is ${P(p)} of them: ${$(d)}.` },
    ], `${P(p)} of ${$(base)}.`);
  }
  const ans = base + c.dir * d, other = base - c.dir * d;
  return moneyItem({
    id: `direction-${n}`, family: 'direction',
    prompt: `${c.story(A($(base)), B(P(p)))} What is ${c.what}?`,
    board: `${$t(base)} ${c.dir > 0 ? '+' : '-'} ${Pt(p)}`, work: `${$t(base)} ${c.dir > 0 ? '+' : '-'} ${$t(d)} = \\cssId{s}{${$t(ans)}}`,
    picture: { kind: 'tape', rows: [c.dir > 0 ? { lead: $(base), segs: [seg('base', D(base), '100%'), seg('change', D(d), P(p), $(d))], end: $(ans) } : { lead: $(base), segs: [seg('base', D(ans), P(100 - p), $(ans)), cut(D(d), P(p), $(d))] }], ask: { r: 0, slot: c.dir > 0 ? 'end' : 'val0' }, hi: [{ r: 0, i: 0, col: 'link' }] },
    solution: [`${c.word(P(p))[0]!.toUpperCase() + c.word(P(p)).slice(1)} ${c.dir > 0 ? 'adds to' : 'takes off'} the base ${A($(base))}: ${P(p)} of it is ${B($(d))}.`, `${$(base)} ${c.dir > 0 ? '+' : '−'} ${$(d)} = ${S($(ans))}.`],
  }, ans, `Yes: ${c.what} is ${$(ans)}.`, [
    { c: other, mc: MC.direction, say: `That goes the wrong way: ${c.word(P(p))} ${c.dir > 0 ? 'adds to the amount' : 'takes the amount down'}. ${$(base)} ${c.dir > 0 ? '+' : '−'} ${$(d)} = ${$(ans)}.` },
    { c: d, mc: MC.changeFinal, say: `${$(d)} is the ${P(p)} part only. ${c.what[0]!.toUpperCase() + c.what.slice(1)} is ${$(base)} ${c.dir > 0 ? '+' : '−'} ${$(d)} = ${$(ans)}.` },
  ], `Find ${P(p)} of ${$(base)}, then ${c.dir > 0 ? 'add it' : 'take it off'}.`);
};

// ===== percent-of-original =====
const pctOfFam: Gen = (R, n) => {
  const v = int(R, 0, 2);
  const base = 100;   // the tape is drawn for $100: lengths are the percents
  if (v === 0) {
    const p = pick(R, [15, 20, 25, 30, 35, 40, 12, 45, 60, 5]), item = pick(R, GOODS);
    const ans = 100 - p;
    return {
      id: `pctOf-${n}`, family: 'pctOf', input: 'num', unit: '%',
      prompt: `${an(item)[0]!.toUpperCase() + an(item).slice(1)} is ${B(`${P(p)} off`)}. The sale price is what percent of the ${A('original price')}?`,
      board: `100\\% - ${Pt(p)}`, work: `100\\% - ${Pt(p)} = \\cssId{s}{${ans}\\%}`,
      picture: { kind: 'tape', rows: [{ segs: [seg('base', ans, `${ans}%`), cut(p, P(p))] }], max: base, ask: { r: 0, slot: 'pct0' }, hi: [{ r: 0, i: 0, col: 'link' }] },
      solution: [`The original price is ${A('100%')}. ${P(p)} comes off.`, `You pay the rest: 100% − ${P(p)} = ${S(`${ans}%`)} of the original.`],
      answer: { kind: 'num', v: ans },
      check: numCheck(ans, `Yes: ${P(p)} off means you pay ${ans}%.`, [
        { v: p, mc: MC.changeFinal, say: `${P(p)} is the part taken off. You pay what is left: 100% − ${P(p)} = ${ans}%.` },
        { v: 100 + p, mc: MC.direction, say: `A discount takes the price down, so it is less than 100%: 100% − ${P(p)} = ${ans}%.` },
      ], `100% − ${P(p)}.`),
    };
  }
  const [p, what] = v === 1 ? pick(R, [[8, 'with 8% sales tax'], [6, 'with 6% sales tax'], [15, 'with a 15% tip'], [20, 'with a 20% tip'], [25, 'after a 25% markup'], [40, 'after a 40% markup']] as const)
    : pick(R, [[150, 'after a 150% markup'], [120, 'after a 120% markup'], [200, 'after a 200% markup']] as const);
  const ans = 100 + p;
  return {
    id: `pctOf-${n}`, family: 'pctOf', input: 'num', unit: '%',
    prompt: `The amount ${what} is what percent of the ${A('amount before')}?`,
    board: `100\\% + ${Pt(p)}`, work: `100\\% + ${Pt(p)} = \\cssId{s}{${ans}\\%}`,
    picture: { kind: 'tape', rows: [{ segs: [seg('base', 100, '100%'), seg('change', p, P(p))] }, { segs: [seg('result', ans, `${ans}%`)] }], max: ans, ask: { r: 1, slot: 'pct0' }, hi: [{ r: 1, i: 0, col: 'link' }], guides: [{ at: ans, r0: 0, r1: 1 }] },
    solution: [`The amount before is ${A('100%')}, and ${B(P(p))} is added on top.`, `100% + ${P(p)} = ${S(`${ans}%`)} of the amount before.${p > 100 ? ' More than 100% is fine: it is more than the whole.' : ''}`],
    answer: { kind: 'num', v: ans },
    check: numCheck(ans, `Yes: ${ans}% of the amount before.`, [
      { v: p, mc: MC.changeFinal, say: `${P(p)} is only the part added. The new amount is the whole plus that part: ${ans}%.` },
      ...(p < 100 ? [{ v: 100 - p, mc: MC.direction, say: `This change adds to the amount, so it is more than 100%: 100% + ${P(p)} = ${ans}%.` }] : []),
    ], `100% + ${P(p)}.`),
  };
};

// ===== multiplier-encode =====
const mult: Gen = (R, n) => {
  const v = int(R, 0, 2);
  if (v === 0) {
    const down = R() < 0.45;
    const p = down ? pick(R, [20, 35, 15, 40, 5, 12.5, 25, 8]) : pick(R, [7, 8.25, 6.5, 6.25, 150, 4, 12, 3.5, 250]);
    const s = down ? -p : p, ans = multNum(s);
    const word = down ? `${P(p)} off` : p > 10 ? `a ${P(p)} increase` : pick(R, [`${P(p)} sales tax`, `a ${P(p)} increase`]);   // sales tax only at a real-world rate
    const wrongs: Wrong[] = [
      { v: p / 100, mc: MC.changeFinal, say: `${rateStr(p)} is just the ${P(p)} part. The new amount is ${down ? '100% − ' : '100% + '}${P(p)}: × ${multStr(s)}.` },
      { v: multNum(-s), mc: MC.direction, say: `That goes the wrong way: ${word} makes the amount ${down ? 'smaller' : 'bigger'}, so × ${multStr(s)}.` },
    ];
    const shift = down ? 1 - p / 10 : 1 + p / 10;
    if (shift > 0) wrongs.push({ v: shift, mc: MC.point, say: `${P(p)} is ${rateStr(p)}: move the point TWO places. × ${multStr(s)}.` });
    return {
      id: `mult-${n}`, family: 'mult', input: 'num', unit: '',
      prompt: `Write ${B(word)} as one multiplier: new amount = ${A('old amount')} × ?`,
      board: `${down ? '-' : '+'}${Pt(p)} \\to \\times\\, ?`, work: `100\\% ${down ? '-' : '+'} ${Pt(p)} = ${pctStr(100 + s)}\\% = \\cssId{s}{${multStr(s)}}`,
      solution: [`The old amount is 100% = 1. ${down ? 'Take off' : 'Add'} ${P(p)} = ${rateStr(p)}.`, `1 ${down ? '−' : '+'} ${rateStr(p)} = ${S(multStr(s))}.`],
      answer: { kind: 'num', v: ans },
      check: numCheck(ans, `Yes: × ${multStr(s)} is ${pctStr(100 + s)}% of the old amount.`, wrongs, `${P(p)} is ${rateStr(p)}. Then 1 ${down ? '−' : '+'} ${rateStr(p)}.`, 1e-6),
    };
  }
  if (v === 1) {
    const s = pick(R, [-15, -20, -35, -12.5, 6.5, 8.25, 7, 4.5, 30, 150, -40, 2.5]);
    const m = multStr(s), p = Math.abs(s), up = s > 0;
    const right = `a ${P(p)} ${up ? 'increase' : 'decrease'}`;
    const opts: Opt[] = [
      { t: right, ok: true, say: `Yes: × ${m} is ${pctStr(100 + s)}% of the amount, which is ${P(p)} ${up ? 'more' : 'less'}.` },
      { t: `a ${pctStr(100 + s)}% ${up ? 'increase' : 'decrease'}`, ok: false, mc: MC.pctOfAsChange, say: `× ${m} makes the new amount ${pctStr(100 + s)}% OF the old one. The change is the difference from 100%: ${P(p)}.` },
    ];
    const shifted = p * 10;
    if (shifted <= 1000 && pctStr(shifted) !== pctStr(100 + s)) opts.push({ t: `a ${pctStr(shifted)}% ${up ? 'increase' : 'decrease'}`, ok: false, mc: MC.point, say: `${rateStr(p)} is ${P(p)}: move the point two places, not one.` });
    else opts.push({ t: `a ${P(p)} ${up ? 'decrease' : 'increase'}`, ok: false, mc: MC.direction, say: `× ${m} is ${up ? 'more' : 'less'} than 1, so the amount goes ${up ? 'up' : 'down'}.` });
    return choiceItem(R, {
      id: `mult-${n}`, family: 'mult',
      prompt: `A price is multiplied by ${S(m)}. What percent change is that?`,
      board: `\\times\\, ${m}`, work: `${m} = ${pctStr(100 + s)}\\% = 100\\% ${up ? '+' : '-'} ${Pt(p)}`,
      solution: [`× ${m} means the new price is ${pctStr(100 + s)}% of the old price.`, `100% ${up ? '+' : '−'} ${P(p)}: ${right}.`],
    }, opts);
  }
  const p = pick(R, [6.25, 8.875, 250, 4.5, 0.5, 125, 7.25, 3, 12.5, 175]);
  const ans = mp(p) / 100000;
  return {
    id: `mult-${n}`, family: 'mult', input: 'num', unit: '',
    prompt: `Quick check: write ${B(P(p))} as a decimal.`,
    board: `${Pt(p)} = \\ ?`, work: `${Pt(p)} = \\tfrac{${pctStr(p)}}{100} = \\cssId{s}{${rateStr(p)}}`,
    solution: [`Percent means per hundred: divide by 100.`, `Move the point two places left: ${P(p)} = ${S(rateStr(p))}.`],
    answer: { kind: 'num', v: ans },
    check: numCheck(ans, `Yes: ${P(p)} = ${rateStr(p)}.`, [
      { v: ans * 10, mc: MC.point, say: `That moves the point one place. Divide by 100: two places, ${rateStr(p)}.` },
      { v: p, mc: MC.numeral, say: `That drops the % sign without dividing by 100. ${P(p)} = ${rateStr(p)}.` },
    ], `Divide by 100.`, 1e-9),
  };
};

// ===== single-change-in-context =====
const single: Gen = (R, n) => {
  const kind = pick(R, ['sale', 'tax', 'tip', 'markup', 'commission'] as const);
  const decimal = R() < 0.4;
  const { b, p } = until(() => {
    const b = kind === 'commission' ? 100 * pick(R, [400, 800, 1200, 1600, 2000, 2400, 3200, 4000]) : 100 * pick(R, [16, 20, 24, 32, 36, 40, 48, 60, 64, 72, 80, 96, 120, 160, 200, 240, 320, 400, 640, 800]);
    const p = kind === 'tax' ? (decimal ? pick(R, [6.25, 6.5, 7.25, 8.25, 8.875, 7.5]) : pick(R, WHOLE_TAX))
      : kind === 'tip' ? pick(R, [15, 18, 20, 22]) : kind === 'markup' ? pick(R, [25, 40, 50, 60, 75, 120]) : kind === 'commission' ? (decimal ? pick(R, [2.5, 3.5, 4.5, 7.5]) : pick(R, [2, 4, 5, 6, 8, 10])) : pick(R, [10, 15, 20, 25, 30, 35, 40, 12.5]);
    return partC(b, p) === null ? null : { b, p };
  }, 'single');
  const d = partC(b, p)!;
  const askChange = kind === 'commission' || R() < 0.4;
  const up = kind !== 'sale';
  const total = up ? b + d : b - d;
  const good = an(itemFor(R, GOODS, b, total));
  const T = {
    sale: { story: `${good[0]!.toUpperCase()}${good.slice(1)} costs ${A($(b))} and is ${B(`${P(p)} off`)}.`, change: 'How much do you save', total: 'What is the sale price' },
    tax: { story: `Your cart is ${A($(b))} before tax, and the sales tax is ${B(P(p))}.`, change: 'How much is the tax', total: 'What is the total with tax' },
    tip: { story: `A dinner bill is ${A($(b))} before tax. You leave a ${B(`${P(p)} tip`)} on it.`, change: 'How much is the tip', total: 'What is the bill plus the tip' },
    markup: { story: `A shop pays ${A($(b))} for a ${itemFor(R, STOCK, b, b + d)} and marks it up ${B(P(p))}.`, change: 'How much is the markup', total: 'What is the selling price' },
    commission: { story: `${pick(R, NAMES)} sells ${A($(b))} of phones and earns ${B(`${P(p)} commission`)} on sales.`, change: 'How much commission is that', total: '' },
  }[kind];
  const ans = askChange ? d : total;
  const rows: TapeRow[] = [up
    ? { lead: $(b), segs: [seg('base', D(b), '100%'), seg('change', D(d), P(p), askChange ? $(d) : undefined)], end: askChange ? undefined : $(total) }
    : { lead: $(b), segs: [seg('base', D(total), P(100 - p), askChange ? undefined : $(total)), cut(D(d), P(p), askChange ? $(d) : undefined)] }];
  const slot: Slot = askChange ? 'val1' : up ? 'end' : 'val0';
  const wrongs: { c: number; mc?: string; say: string }[] = askChange
    ? [{ c: kind === 'commission' ? b + d : total, mc: kind === 'commission' ? MC.commAdded : undefined, say: `That is the ${kind === 'commission' ? 'sales plus the commission' : 'new total'}. The question asks for the ${P(p)} part only: ${$(d)}.` }]
    : [{ c: d, mc: MC.changeFinal, say: `${$(d)} is the ${P(p)} part. The question asks for the total: ${$(b)} ${up ? '+' : '−'} ${$(d)} = ${$(total)}.` },
      { c: up ? b - d : b + d, mc: MC.direction, say: `That goes the wrong way. ${up ? 'This adds to the amount' : 'A discount takes the price down'}: ${$(total)}.` }];
  return moneyItem({
    id: `single-${n}`, family: 'single',
    prompt: `${T.story} ${askChange ? T.change : T.total}?`,
    board: askChange ? `${Pt(p)} \\times ${$t(b)}` : `${$t(b)} \\times ${multStr(up ? p : -p)}`,
    work: askChange ? `${rateStr(p)} \\times ${$t(b)} = \\cssId{s}{${$t(d)}}` : `${$t(b)} \\times ${multStr(up ? p : -p)} = \\cssId{s}{${$t(total)}}`,
    picture: { kind: 'tape', rows, ask: { r: 0, slot }, hi: [{ r: 0, i: askChange ? 1 : 0, col: 'link' }] },
    solution: askChange
      ? [`${A($(b))} is 100%.`, `${P(p)} of ${$(b)} = ${rateStr(p)} × ${D(b)} = ${S($(d))}.`]
      : [`${A($(b))} is 100%; ${up ? 'with' : 'after'} ${P(p)} it is ${pctStr(up ? 100 + p : 100 - p)}%.`, `${$(b)} × ${multStr(up ? p : -p)} = ${S($(total))} (or ${$(b)} ${up ? '+' : '−'} ${$(d)}).`],
  }, ans, `Yes: ${$(ans)}.`, wrongs, askChange ? `${P(p)} of ${$(b)}.` : `${$(b)} × ${multStr(up ? p : -p)}.`);
};

// ===== commission-earnings =====
const commission: Gen = (R, n) => {
  const who = pick(R, NAMES);
  const { sal, sales, p, c } = until(() => {
    const sal = 100 * pick(R, [200, 250, 300, 400, 450, 500, 600, 750, 800, 1000, 1200, 1500, 2000]);
    const sales = 100 * pick(R, [1200, 1500, 2000, 2400, 2500, 3000, 3600, 4000, 4500, 5000, 6000, 7500, 8000, 10000, 12000]);
    const p = R() < 0.6 ? pick(R, [2, 3, 4, 5, 6, 8, 10]) : pick(R, [2.5, 3.5, 4.5, 7.5, 6.25]);
    const c = partC(sales, p);
    return c === null ? null : { sal, sales, p, c };
  }, 'commission');
  const ans = sal + c;
  return moneyItem({
    id: `commission-${n}`, family: 'commission',
    prompt: `${who} earns a ${A($(sal))} salary each month, plus ${B(`${P(p)} commission`)} on sales. This month ${who} sold ${$(sales)}. What are ${who}’s total earnings this month?`,
    board: `${$t(sal)} + ${Pt(p)} \\times ${$t(sales)}`,
    work: `${$t(sal)} + ${$t(c)} = \\cssId{s}{${$t(ans)}}`,
    picture: { kind: 'tape', rows: [{ segs: [seg('plain', D(sal), undefined, $(sal)), seg('change', D(c), `${P(p)} of ${$(sales)}`)], end: $(ans) }], ask: { r: 0, slot: 'end' }, hi: [{ r: 0, i: 1, col: 'link' }] },
    solution: [`Commission first: ${P(p)} of the sales ${$(sales)} = ${B($(c))}.`, `Then add it to the salary: ${$(sal)} + ${$(c)} = ${S($(ans))}.`],
  }, ans, `Yes: ${$(sal)} + ${$(c)} = ${$(ans)}.`, [
    { c: sales + c, mc: MC.commAdded, say: `That adds the commission to the sales. ${who} keeps only the commission, plus the salary: ${$(sal)} + ${$(c)} = ${$(ans)}.` },
    { c: partC(sales + sal, p) ?? -1, mc: MC.ctxBase, say: `That takes ${P(p)} of sales plus salary. Commission is only on sales (${$(c)}), and the salary is added after: ${$(ans)}.` },
    { c: sal + sales + c, mc: MC.commAdded, say: `The sales are the store’s money, not ${who}’s. Earnings = salary + commission = ${$(ans)}.` },
  ], `Salary + ${P(p)} of sales.`);
};

// ===== round-to-cent =====
const round: Gen = (R, n) => {
  const v = int(R, 0, 2);
  if (v === 0) {
    const { x, r, raw } = until(() => {
      const x = 100 * int(R, 6, 90) + pick(R, [99, 49, 95, 79, 25, 59]), r = pick(R, [6.25, 7.25, 8.25, 8.875, 6.5, 9.5, 5.75, 4.5]);
      const raw = partRaw(x, r);
      return Number.isInteger(raw) ? null : { x, r, raw };
    }, 'round');
    const ans = partRound(x, r), down = Math.floor(raw);
    return moneyItem({
      id: `round-${n}`, family: 'round',
      prompt: `The sales tax on a ${A($(x))} purchase is ${B(P(r))}. The calculator shows ${D(raw).toFixed(6).replace(/0+$/, '')}. The store rounds the tax to the nearest cent. How much tax is charged?`,
      board: `${rateStr(r)} \\times ${D(x)} = ${D(raw).toFixed(6).replace(/0+$/, '')}`, work: `\\approx \\cssId{s}{${$t(ans)}}`,
      solution: [`A cent is the smallest coin, so the tax is rounded to two decimal places.`, `${D(raw).toFixed(6).replace(/0+$/, '')}: look at the third decimal place → ${S($(ans))}.`],
    }, ans, `Yes: ${$(ans)}.`, [
      { c: raw, mc: MC.cent, say: `There is no fraction of a cent to charge. Round to the nearest cent: ${$(ans)}.` },
      ...(down !== ans ? [{ c: down, say: `That cuts the digits off. The third decimal place is 5 or more, so round up: ${$(ans)}.` }] : []),
    ], `Round to two decimal places.`);
  }
  if (v === 1) {
    // three items, tax per line vs on the total: the policy decides
    const { xs, r, perLine, onTotal } = until(() => {
      const xs = [0, 1, 2].map(() => 100 * int(R, 2, 30) + pick(R, [99, 49, 25, 75, 59, 19]));
      const r = pick(R, [6.25, 7.25, 8.25, 8.875, 6.5, 5.5]);
      const perLine = xs.reduce((s, x) => s + partRound(x, r), 0), onTotal = partRound(xs.reduce((s, x) => s + x, 0), r);
      return perLine === onTotal ? null : { xs, r, perLine, onTotal };
    }, 'policy');
    const lines = R() < 0.5;
    const ans = lines ? perLine : onTotal, other = lines ? onTotal : perLine;
    return moneyItem({
      id: `round-${n}`, family: 'round',
      prompt: `You buy three items: ${xs.map($).join(', ')}. Sales tax is ${B(P(r))}. The store’s policy: ${A(lines ? 'round the tax on each item to the cent, then add' : 'add the prices, then round the tax once at the end')}. What is the total tax?`,
      board: `\\begin{array}{r} ${xs.map(x => `${$t(x)}`).join(' \\\\ ')} \\end{array}\\quad ${Pt(r)}`, work: `\\text{tax} = \\cssId{s}{${$t(ans)}}`,
      solution: lines
        ? [`Each line: ${xs.map(x => `${$(partRound(x, r))}`).join(' + ')} (each rounded to the cent).`, `Total tax ${S($(ans))}. Rounding once at the end would give ${$(other)}: the policy decides.`]
        : [`Add first: ${$(xs.reduce((s, x) => s + x, 0))}. ${P(r)} of it is ${D(partRaw(xs.reduce((s, x) => s + x, 0), r)).toFixed(6).replace(/0+$/, '')}.`, `Round once: ${S($(ans))}. Keep every digit until that last step.`],
    }, ans, `Yes: following the policy, ${$(ans)}.`, [
      { c: other, mc: lines ? undefined : MC.early, say: lines ? `That rounds once at the end, but this store rounds each line first: ${$(ans)}.` : `That rounds each line first. This policy keeps the digits and rounds once at the end: ${$(ans)}.` },
    ], `Follow the policy step by step.`);
  }
  const { x, r, raw } = until(() => {
    const x = 100 * int(R, 8, 120) + pick(R, [99, 49, 95, 50, 25]), r = pick(R, [6.25, 7.25, 8.25, 8.875, 4.75, 9.25]);
    const raw = x + partRaw(x, r);
    return Number.isInteger(raw) ? null : { x, r, raw };
  }, 'total');
  const ans = x + partRound(x, r);
  return moneyItem({
    id: `round-${n}`, family: 'round',
    prompt: `A ${A($(x))} item with ${B(`${P(r)} sales tax`)}: the total is ${$(x)} × ${multStr(r)}. Round the total to the nearest cent. What do you pay?`,
    board: `${D(x)} \\times ${multStr(r)}`, work: `= ${D(raw).toFixed(6).replace(/0+$/, '')} \\approx \\cssId{s}{${$t(ans)}}`,
    solution: [`${D(x)} × ${multStr(r)} = ${D(raw).toFixed(6).replace(/0+$/, '')}.`, `Round to the cent: ${S($(ans))}.`],
  }, ans, `Yes: ${$(ans)}.`, [
    { c: raw, mc: MC.cent, say: `You can’t pay a fraction of a cent. Round to two decimal places: ${$(ans)}.` },
  ], `Multiply, then round to two decimal places.`);
};

// ===== income-tax-wages =====
const wages: Gen = (R, n) => {
  if (R() < 0.6) {
    const who = pick(R, NAMES);
    const { h, w, t, g, tax } = until(() => {
      const h = pick(R, [12, 15, 16, 18, 20, 24, 25, 30, 32, 35, 36, 40, 12.5, 22.5, 37.5]), w = 100 * int(R, 8, 40) + pick(R, [0, 0, 50]);
      const g = Math.round(h * w);
      if (Math.abs(g - h * w) > 1e-9) return null;
      const t = pick(R, [8, 10, 12, 15, 9.5]);
      return { h, w, t, g, tax: partRound(g, t) };
    }, 'wages');
    const net = g - tax;
    return moneyItem({
      id: `wages-${n}`, family: 'wages',
      prompt: `${who} works ${h} hours at ${A(`${$(w)} an hour`)}. A flat ${B(`${P(t)} income tax`)} is withheld from the gross pay (an example rate, not a real IRS rate), rounded to the cent. What is ${who}’s take-home (net) pay?`,
      board: `${h} \\times ${$t(w)} = ${$t(g)}`, work: `${$t(g)} - ${$t(tax)} = \\cssId{s}{${$t(net)}}`,
      picture: { kind: 'tape', rows: [{ lead: $(g), segs: [seg('base', D(net), P(100 - t), $(net)), cut(D(tax), P(t), $(tax))] }], ask: { r: 0, slot: 'val0' }, hi: [{ r: 0, i: 0, col: 'link' }] },
      solution: [`Gross pay: ${h} × ${$(w)} = ${A($(g))}. Tax withheld: ${P(t)} of it = ${B($(tax))}.`, `Net pay = gross − tax = ${S($(net))}.`],
    }, net, `Yes: ${$(g)} − ${$(tax)} = ${$(net)}.`, [
      { c: g + tax, mc: MC.moneyFlow, say: `Tax is withheld: it comes OUT of the pay. ${$(g)} − ${$(tax)} = ${$(net)}.` },
      { c: tax, mc: MC.changeFinal, say: `${$(tax)} is the tax. Take-home pay is what is left: ${$(net)}.` },
      { c: g - 100 * t, mc: MC.fixed, say: `${P(t)} is not ${t} dollars: it is ${P(t)} of ${$(g)} = ${$(tax)}. Net pay ${$(net)}.` },
      { c: g, say: `That is the gross pay, before tax. Take ${$(tax)} off: ${$(net)}.` },
    ], `Gross pay × ${P(t)} is the tax; take it off the gross pay.`);
  }
  // two brackets on weekly wages
  const { g, lo, hi, cap } = until(() => {
    const cap = 100 * pick(R, [400, 500, 600]), g = cap + 100 * pick(R, [50, 100, 150, 200, 250, 300, 400]) + pick(R, [0, 0, 50]);
    return { g, lo: 10, hi: pick(R, [12, 15]), cap };
  }, 'brackets');
  const t1 = partC(cap, lo)!, t2 = partRound(g - cap, hi), ans = t1 + t2;
  return moneyItem({
    id: `wages-${n}`, family: 'wages',
    prompt: `An example tax table for weekly wages: ${B(`${lo}% on the first ${$(cap)}`)}, and ${B(`${hi}% on the amount above ${$(cap)}`)}. You earn ${A($(g))} this week. How much income tax is withheld?`,
    board: `\\begin{array}{lr} \\text{first } ${$t(cap)} & ${lo}\\% \\\\ \\text{above} & ${hi}\\% \\end{array}`,
    work: `${$t(t1)} + ${$t(t2)} = \\cssId{s}{${$t(ans)}}`,
    picture: { kind: 'tape', rows: [{ lead: $(g), segs: [seg('base', D(cap), `${lo}%`, $(cap)), seg('plain', D(g - cap), `${hi}%`, $(g - cap))] }], hi: [{ r: 0, i: 0, col: 'second' }, { r: 0, i: 1, col: 'second' }] },
    solution: [`${lo}% of the first ${$(cap)} = ${$(t1)}.`, `${hi}% of the rest, ${$(g - cap)}, = ${$(t2)}. Total ${S($(ans))}.`],
  }, ans, `Yes: ${$(t1)} + ${$(t2)} = ${$(ans)}.`, [
    { c: partRound(g, hi), mc: MC.topBracket, say: `${hi}% is only for the dollars above ${$(cap)}. The first ${$(cap)} is taxed at ${lo}%: ${$(ans)}.` },
    { c: partRound(g, lo), say: `${lo}% is only for the first ${$(cap)}. The rest is taxed at ${hi}%: ${$(ans)}.` },
    { c: g - ans, mc: MC.changeFinal, say: `That is the pay after tax. The question asks for the tax: ${$(ans)}.` },
  ], `Split the pay at ${$(cap)} and tax each part at its own rate.`);
};

// ===== estimate-check =====
const BOUNDS: Record<number, [number, number]> = { 18: [15, 20], 12: [10, 15], 8: [5, 10], 6: [5, 10], 22: [20, 25], 16: [15, 20], 7: [5, 10], 14: [10, 15] };
const estimate: Gen = (R, n) => {
  const p = pick(R, [18, 12, 8, 6, 22, 16, 7, 14]);
  const [lo, hi] = BOUNDS[p]!;
  const b = 100 * int(R, 21, 98) + pick(R, [40, 60, 80, 20, 75, 25]);
  const rb = Math.round(b / 100) * 100;     // the friendly amount
  const exact = partRound(b, p), loE = partRound(rb, lo), hiE = partRound(rb, hi);
  const what = pick(R, [`a ${P(p)} tip on a ${$(b)} bill`, p <= 10 ? `${P(p)} sales tax on ${$(b)}` : `a ${P(p)} tip on a ${$(b)} meal`, `a ${P(p)} service fee on ${$(b)}`]);   // no 14% sales tax
  if (R() < 0.5) {
    const slip = R() < 0.5;
    const shown = slip ? exact * 10 : exact * 100;   // a decimal-point slip, or the percent used without dividing by 100
    return choiceItem(R, {
      id: `estimate-${n}`, family: 'estimate',
      prompt: `A calculator says ${B(what)} is ${A($(shown))}. Check it with an estimate: is that reasonable?`,
      board: `${Pt(p)} \\times ${$t(b)} \\overset{?}{=} ${$t(shown)}`, work: `${hi}\\% \\times ${$t(rb)} = ${$t(hiE)}`,
      solution: [`Estimate: ${$(b)} is about ${$(rb)}. ${hi}% of ${$(rb)} is ${$(hiE)}, and ${p}% is less than ${hi}%.`, `So the answer must be under ${$(hiE)}: ${$(shown)} is too big. (Exact: ${$(exact)}.)`],
    }, [
      { t: `No: ${hi}% of ${$(rb)} is only ${$(hiE)}`, ok: true, say: `Yes: ${P(p)} is less than ${hi}%, so it must be under ${$(hiE)}. ${slip ? 'The decimal point slipped' : 'It looks like the price got added in'}: the exact answer is ${$(exact)}.` },
      { t: `Yes: the calculator did the work`, ok: false, mc: MC.noCheck, say: `A calculator only gets what was typed. ${hi}% of ${$(rb)} is ${$(hiE)}, so ${$(shown)} is far too big.` },
      { t: `Yes: a tip, tax or discount is often that big`, ok: false, mc: MC.noCheck, say: `Check the size: ${P(p)} is less than ${hi}%, and ${hi}% of ${$(rb)} is ${$(hiE)}. ${$(shown)} is too big.` },
    ]);
  }
  return choiceItem(R, {
    id: `estimate-${n}`, family: 'estimate',
    prompt: `You work out ${B(what)} exactly and get ${A($(exact))}. Your quick estimate was ${hi}% of ${$(rb)} = ${$(hiE)}. Is ${$(exact)} reasonable?`,
    board: `${lo}\\% \\le ${Pt(p)} \\le ${hi}\\%`, work: `${$t(loE)} < \\cssId{s}{${$t(exact)}} < ${$t(hiE)}`,
    solution: [`${p}% is between ${lo}% and ${hi}%: ${lo}% of ${$(rb)} = ${$(loE)} and ${hi}% of ${$(rb)} = ${$(hiE)}.`, `${$(exact)} is between the bounds, so it is reasonable. An estimate is a range, not the answer.`],
  }, [
    { t: `Yes: it is between ${lo}% (${$(loE)}) and ${hi}% (${$(hiE)}) of ${$(rb)}`, ok: true, say: `Yes: ${hi}% gives an upper bound and ${lo}% a lower bound, and ${$(exact)} is in between.` },
    { t: `No: it should be ${$(hiE)}`, ok: false, mc: MC.mustMatch, say: `${$(hiE)} was an estimate with ${hi}%, which is more than ${P(p)}. The exact answer can differ; it only has to be between the bounds.` },
    { t: `No: it should be more than ${$(hiE)}`, ok: false, say: `${P(p)} is less than ${hi}%, so the answer is LESS than ${$(hiE)}. ${$(exact)} is in the right range.` },
  ]);
};

// ===== successive-changes =====
interface Step { p: number; word: string }
function chainRows(b: number, steps: Step[], askEnd = true): { rows: TapeRow[]; vals: number[]; guides: { at: number; r0: number; r1: number }[] } {
  const vals = [b];
  const rows: TapeRow[] = [];
  const guides: { at: number; r0: number; r1: number }[] = [];
  steps.forEach((s, i) => {
    const v = vals[i]!, d = partC(v, Math.abs(s.p))!, nv = s.p >= 0 ? v + d : v - d;
    vals.push(nv);
    rows.push(s.p >= 0
      ? { lead: $(v), segs: [seg('base', D(v), '100%'), seg('change', D(d), P(s.p))] }
      : { lead: $(v), segs: [seg('base', D(nv), P(100 + s.p)), cut(D(d), P(-s.p))] });
    guides.push({ at: D(nv), r0: i, r1: i + 1 });
  });
  rows.push({ segs: [seg('result', D(vals[vals.length - 1]!))], end: askEnd ? $(vals[vals.length - 1]!) : undefined });
  return { rows, vals, guides };
}
const STEP_KINDS: readonly ((R: () => number) => Step)[] = [
  R => { const p = pick(R, [10, 20, 25, 30, 40, 50]); return { p: -p, word: `${P(p)} off` }; },
  R => { const p = pick(R, WHOLE_TAX); return { p, word: `${P(p)} sales tax` }; },
  R => { const p = pick(R, [10, 20, 25, 50]); return { p, word: `a ${P(p)} price increase` }; },
];
const successive: Gen = (R, n) => {
  const v = int(R, 0, 3);
  const { b, steps, vals } = until(() => {
    const b = 100 * pick(R, [40, 50, 60, 80, 100, 120, 150, 160, 200, 240, 250, 300, 400, 500]);
    let steps: Step[];
    if (v === 0) steps = [STEP_KINDS[0]!(R), STEP_KINDS[1]!(R)];
    else if (v === 1) { const p = pick(R, [10, 20, 25]), q = pick(R, [10, 20, 10]); steps = [{ p: -p, word: `${P(p)} off` }, { p: -q, word: `another ${P(q)} off the sale price` }]; }
    else if (v === 2) { const p = pick(R, [10, 20, 25, 50]), q = pick(R, [10, 20, 25, 50]); steps = [{ p, word: `a ${P(p)} price increase` }, { p: -q, word: `a ${P(q)} price cut` }]; }
    else steps = [STEP_KINDS[0]!(R), { p: -pick(R, [10, 20]), word: '' }, STEP_KINDS[1]!(R)].map((s, i) => (i === 1 ? { ...s, word: `another ${P(-s.p)} off at the register` } : s));
    const end = chainC(b, steps.map(s => s.p));
    if (end === null) return null;
    const vals = [b]; for (const s of steps) vals.push(applyC(vals[vals.length - 1]!, s.p)!);
    return { b, steps, vals };
  }, 'chain');
  const ans = vals[vals.length - 1]!;
  const added = applyC(b, steps.reduce((s, x) => s + x.p, 0)) ?? Math.round(b + partRaw(b, steps.reduce((s, x) => s + x.p, 0)));
  const item = itemFor(R, GOODS, b, ans);
  const { rows, guides } = chainRows(b, steps, false);
  rows[rows.length - 1]!.end = $(ans);
  const mults = steps.map(s => multStr(s.p)).join(' \\times ');
  return moneyItem({
    id: `successive-${n}`, family: 'successive',
    prompt: `${an(item)[0]!.toUpperCase() + an(item).slice(1)} costs ${A($(b))}. In this order: ${steps.map(s => B(s.word)).join(', then ')}. Each change is a percent of the amount at that moment. What is the final amount?`,
    board: `${$t(b)} \\times ${mults}`, work: `= \\cssId{s}{${$t(ans)}}`,
    picture: { kind: 'tape', rows, guides, ask: { r: rows.length - 1, slot: 'end' }, hi: [{ r: rows.length - 1, i: 0, col: 'link' }] },
    solution: [...steps.map((s, i) => `${s.word[0]!.toUpperCase() + s.word.slice(1)}: ${$(vals[i]!)} × ${multStr(s.p)} = ${$(vals[i + 1]!)}${i < steps.length - 1 ? ' (the new 100%)' : ''}.`), `Final amount ${S($(ans))}.`],
  }, ans, `Yes: ${$(ans)}. Each result became the next 100%.`, [
    { c: added, mc: MC.adds, say: `That puts every change on the first ${$(b)}. After the first change, the NEW amount is 100%: ${steps.map((s, i) => `${$(vals[i]!)} × ${multStr(s.p)}`).join(', then ')} = ${$(ans)}.`, loose: true },
    { c: vals[1]!, say: `That is after the first change only. Keep going: ${$(ans)}.` },
  ], `Apply the changes one at a time, each to the latest amount.`);
};

// ===== reverse-percent =====
const reverse: Gen = (R, n) => {
  const kind = pick(R, ['sale', 'tax', 'markup'] as const);
  const { o, p, f } = until(() => {
    const o = kind === 'tax' ? 100 * int(R, 8, 160) + pick(R, [0, 0, 50, 99]) : 100 * pick(R, [20, 24, 30, 36, 40, 48, 50, 60, 64, 72, 80, 90, 120, 150, 200, 250]);
    const p = kind === 'sale' ? pick(R, [10, 20, 25, 30, 40, 50, 60, 75]) : kind === 'tax' ? pick(R, [5, 6, 7, 8, 6.25, 8.25, 10]) : pick(R, [20, 25, 40, 50, 60, 75, 100]);
    const f = applyC(o, kind === 'sale' ? -p : p);
    return f === null ? null : { o, p, f };
  }, 'reverse');
  const s = kind === 'sale' ? -p : p, m = multStr(s);
  const back = applyC(f, kind === 'sale' ? p : -p) ?? Math.round(f + partRaw(f, kind === 'sale' ? p : -p));
  const T = {
    sale: `After ${B(`${P(p)} off`)}, a ${itemFor(R, GOODS, o, f)} costs ${A($(f))}. What was the original price?`,
    tax: `Your receipt total is ${A($(f))}, including ${B(`${P(p)} sales tax`)} (not rounded). What was the price before tax?`,
    markup: `A store sells a ${itemFor(R, STOCK, o, f)} for ${A($(f))} after a ${B(`${P(p)} markup`)} on its cost. What was the store’s cost?`,
  }[kind];
  return moneyItem({
    id: `reverse-${n}`, family: 'reverse',
    prompt: T,
    board: `${pctStr(100 + s)}\\% = ${$t(f)}`, work: `${$t(f)} \\div ${m} = \\cssId{s}{${$t(o)}}`,
    picture: { kind: 'tape', rows: [kind === 'sale' ? { lead: $(o), segs: [seg('base', D(f), P(100 - p), $(f)), cut(D(o - f), P(p))] } : { lead: $(o), segs: [seg('base', D(o), '100%'), seg('change', D(f - o), P(p))], end: $(f), endCol: 'dim' }], ask: { r: 0, slot: 'lead' }, hi: [{ r: 0, i: 0, col: 'first' }] },
    solution: [`The unknown original is 100%, and ${$(f)} is ${pctStr(100 + s)}% of it: original × ${m} = ${$(f)}.`, `Undo the multiplier by dividing: ${$(f)} ÷ ${m} = ${S($(o))}.`],
  }, o, `Yes: ${$(o)} × ${m} = ${$(f)}, so the original was ${$(o)}.`, [
    { c: back, mc: MC.adds, say: `That ${kind === 'sale' ? `adds ${P(p)} of ${$(f)} back` : `takes ${P(p)} of ${$(f)} off`}, but the ${P(p)} was a percent of the ORIGINAL, not of ${$(f)}. Divide: ${$(f)} ÷ ${m} = ${$(o)}.`, loose: true },
    { c: Math.round(f * multNum(s)), say: `That applies the change again. Undo it by dividing: ${$(f)} ÷ ${m} = ${$(o)}.`, loose: true },
  ], `${$(f)} is ${pctStr(100 + s)}% of the original: divide by ${m}.`);
};

// ===== percent-error =====
const ERR_CTX = [
  { est: 'You estimated the grocery bill at', act: 'The register total was', u: '$' },
  { est: 'The budget estimate for a class trip was', act: 'The actual cost was', u: '$' },
  { est: 'You counted the cash drawer as', act: 'The register says it should be', u: '$' },
  { est: 'You guessed the hallway is', act: 'It measures', u: 'ft' },
  { est: 'You estimated a jar holds', act: 'It actually holds', u: 'marbles' },
] as const;
const pctError: Gen = (R, n) => {
  if (R() < 0.12) {
    return choiceItem(R, {
      id: `pctError-${n}`, family: 'pctError',
      prompt: `A team expected 0 late returns and got 3. Why can’t you give a percent error here?`,
      board: `\\tfrac{|3 - 0|}{0} = \\ ?`,
      solution: [`Percent error divides the difference by the actual (reference) value.`, `The reference value is 0, and you can’t divide by 0: there is no percent of nothing.`],
    }, [
      { t: `The reference value is 0, and you can’t divide by 0`, ok: true, say: `Yes: percent error is measured against the actual value, and 0 has no percent.` },
      { t: `It is 300%`, ok: false, mc: MC.diffPct, say: `3 is the difference, not a percent. To get a percent you divide by the reference value, which is 0: impossible.` },
      { t: `It is 0%, because the estimate was 0`, ok: false, mc: MC.newBase, say: `The estimate is not the reference. Percent error divides by the ACTUAL value, here 3 expected as 0: you would divide by 0.` },
    ]);
  }
  const c = pick(R, ERR_CTX);
  const { a, e, ans } = until(() => {
    const a = pick(R, [40, 50, 60, 80, 120, 125, 150, 200, 240, 250, 400, 500]);
    const ans = pick(R, [2, 4, 5, 8, 10, 12, 15, 20, 25]);
    const d = (a * ans) / 100;
    if (!Number.isInteger(d) || d < 2) return null;
    const e = R() < 0.5 ? a + d : a - d;
    return { a, e, ans };
  }, 'error');
  const d = Math.abs(e - a), u = (x: number) => (c.u === '$' ? `$${x}` : `${x} ${c.u}`);
  const onE = (100 * d) / e;
  const wrongs: Wrong[] = [
    { v: onE, mc: MC.newBase, say: `That divides by your estimate. Percent error is measured against the ACTUAL value: ${d} ÷ ${a} = ${ans}%.`, tol: Number.isInteger(onE * 10) ? 0.05 : 0.51 },
    { v: d, mc: MC.diffPct, say: `${d} is the difference itself, not a percent. Divide it by the actual value: ${d} ÷ ${a} = ${ans}%.` },
  ];
  if (e < a) wrongs.push({ v: -ans, mc: MC.negErr, say: `Percent error is a distance, so it is never negative: ${ans}%.` });
  return {
    id: `pctError-${n}`, family: 'pctError', input: 'num', unit: '%',
    prompt: `${c.est} ${B(u(e))}. ${c.act} ${A(u(a))}. What is the percent error?`,
    board: `\\frac{|${e} - ${a}|}{${a}} \\times 100\\%`, work: `\\tfrac{${d}}{${a}} = \\cssId{s}{${ans}\\%}`,
    picture: { kind: 'tape', rows: [{ lead: u(a), segs: [seg('base', a, '100%')] }, e > a ? { lead: u(e), leadCol: 'second', segs: [seg('plain', a), seg('change', d, `${ans}%`)] } : { lead: u(e), leadCol: 'second', segs: [seg('plain', e), cut(d, `${ans}%`)] }], ask: { r: 1, slot: 'pct1' }, hi: [{ r: 1, i: 1, col: 'link' }], guides: [{ at: a, r0: 0, r1: 1 }] },
    solution: [`The actual value ${A(u(a))} is 100%. The estimate is off by ${B(String(d))}.`, `${d} ÷ ${a} = ${S(`${ans}%`)}. ${e > a ? 'An over' : 'An under'}estimate of the same size gives the same error.`],
    answer: { kind: 'num', v: ans },
    check: numCheck(ans, `Yes: off by ${d} out of ${a}, so ${ans}%.`, wrongs, `Divide the difference by the actual value: ${d} ÷ ${a}.`),
  };
};

// ===== simple-interest-years and interest-months =====
const interest: Gen = (R, n) => {
  const loan = R() < 0.35;
  const { pr, p, t, i } = until(() => {
    const pr = 100 * pick(R, [100, 200, 400, 500, 800, 1000, 1200, 1500, 2000, 2500, 3000, 4000, 5000, 8000, 10000]);
    const p = loan ? int(R, 3, 12) : int(R, 1, 6), t = int(R, 1, 5);   // savings rates stay real-world (a loan may cost more)
    const i = simpleInterest(pr, p, t);
    return i === null ? null : { pr, p, t, i };
  }, 'interest');
  const askBal = R() < 0.5, per = i / t;
  let comp = pr; for (let k = 0; k < t; k++) comp += partRaw(comp, p);
  const compC = Math.round(comp);
  const ans = askBal ? pr + i : i;
  const segs = [seg('base', D(pr), '100%', $(pr)), ...Array.from({ length: t }, () => seg('change', D(per)))];
  return moneyItem({
    id: `interest-${n}`, family: 'interest',
    prompt: loan
      ? `You borrow ${A($(pr))} at ${B(`${P(p)} simple interest`)} per year for ${t} year${t > 1 ? 's' : ''}. ${askBal ? 'How much do you owe in all at the end (loan plus interest)?' : 'How much interest do you pay?'}`
      : `You put ${A($(pr))} in savings at ${B(`${P(p)} simple interest`)} per year. ${askBal ? `What is the balance after ${t} year${t > 1 ? 's' : ''}?` : `How much interest do you earn in ${t} year${t > 1 ? 's' : ''}?`}`,
    board: `I = ${D(pr)} \\times ${rateStr(p)} \\times ${t}`, work: askBal ? `${$t(pr)} + ${$t(i)} = \\cssId{s}{${$t(ans)}}` : `I = \\cssId{s}{${$t(i)}}`,
    picture: { kind: 'tape', rows: [{ lead: 'P', leadCol: 'first', segs, end: askBal ? $(ans) : undefined }], ask: askBal ? { r: 0, slot: 'end' } : undefined, hi: Array.from({ length: t }, (_, k) => ({ r: 0, i: k + 1, col: 'link' as const })) },
    solution: [`Each year: ${P(p)} of ${$(pr)} = ${B($(per))}, always on the principal.`, `${t} year${t > 1 ? 's' : ''}: ${$(per)} × ${t} = ${askBal ? `${$(i)}; balance ${$(pr)} + ${$(i)} = ${S($(ans))}.` : `${S($(i))}.`}`],
  }, ans, `Yes: ${$(ans)}.`, [
    { c: askBal ? compC : compC - pr, mc: MC.compound, say: `That adds interest on interest. Simple interest is ${$(per)} every year, on the principal only: ${$(ans)}.`, loose: true },
    { c: askBal ? i : pr + i, mc: MC.interestBalance, say: askBal ? `${$(i)} is the interest only. The ${loan ? 'amount owed' : 'balance'} is ${$(pr)} + ${$(i)} = ${$(ans)}.` : `That is the balance. The interest alone is ${$(i)}.` },
    { c: pr * p * t, mc: MC.numeral, say: `${P(p)} is ${rateStr(p)}, not ${p}. I = ${D(pr)} × ${rateStr(p)} × ${t} = ${$(i)}.` },
  ], `I = P × r × t, with r = ${rateStr(p)}.`);
};
const months: Gen = (R, n) => {
  const isLoan = R() < 0.5;
  const { pr, p, m, i } = until(() => {
    const pr = 100 * pick(R, [400, 600, 800, 1000, 1200, 1500, 2000, 2400, 3000, 4000, 5000]);
    const p = isLoan ? int(R, 3, 12) : int(R, 2, 6), m = pick(R, [6, 9, 18, 30, 3, 15, 24]);   // savings rates stay real-world
    const i = simpleInterest(pr, p, m / 12);
    return i === null ? null : { pr, p, m, i };
  }, 'months');
  const y = decStr(Math.round((m / 12) * 100), 100);
  return moneyItem({
    id: `months-${n}`, family: 'months',
    prompt: `A ${isLoan ? 'loan' : 'savings account'} of ${A($(pr))} has ${B(`${P(p)} simple interest per year`)}. How much interest is that for ${m} months?`,
    board: `${m}\\ \\text{months} = \\tfrac{${m}}{12}\\ \\text{year}`, work: `${$t(pr)} \\times ${rateStr(p)} \\times ${y} = \\cssId{s}{${$t(i)}}`,
    picture: { kind: 'tape', rows: [{ lead: 'P', segs: [seg('base', D(pr), '100%', $(pr)), seg('change', D(i), undefined, $(i))] }], ask: { r: 0, slot: 'val1' }, hi: [{ r: 0, i: 1, col: 'link' }] },
    solution: [`The rate is per YEAR, so the time must be in years: ${m} months = ${m}/12 = ${y} year${m === 12 ? '' : 's'}.`, `I = ${$(pr)} × ${rateStr(p)} × ${y} = ${S($(i))}.`],
  }, i, `Yes: ${$(i)}.`, [
    { c: pr * p * m / 100, mc: MC.units, say: `That uses ${m} as if it were years. The rate is per year: ${m} months = ${y} years, so ${$(i)}.` },
    { c: simpleInterest(pr, p, m / 10) ?? -1, mc: MC.units, say: `A year has 12 months, not 10: ${m} months = ${y} years. ${$(i)}.` },
  ], `Months ÷ 12 = years. Then I = P × r × t.`);
};

// ===== justify-single-multiplier =====
const factor: Gen = (R, n) => {
  const v = int(R, 0, 3);
  const down = v === 0 ? true : v === 1 ? false : R() < 0.5;
  const p = down ? pick(R, [20, 15, 25, 30, 8, 6, 40, 12]) : pick(R, [4, 5, 6, 7, 8, 10]);   // a sales tax stays a real-world rate
  const r = rateStr(p), m = multStr(down ? -p : p);
  const word = down ? `${P(p)} off` : `${P(p)} sales tax`;
  if (v === 0 || v === 1) {
    return choiceItem(R, {
      id: `factor-${n}`, family: 'factor',
      prompt: `A price is ${A('x')} dollars. Which expression is the price ${down ? 'after' : 'with'} ${B(word)}?`,
      board: `x ${down ? '-' : '+'} ${r}x`, work: `x ${down ? '-' : '+'} ${r}x = (1 ${down ? '-' : '+'} ${r})x = \\cssId{s}{${m}x}`,
      solution: [`${P(p)} of x is ${r}x, so the new price is x ${down ? '−' : '+'} ${r}x.`, `By the distributive property, x ${down ? '−' : '+'} ${r}x = (1 ${down ? '−' : '+'} ${r})x = ${S(`${m}x`)}: ${pctStr(down ? 100 - p : 100 + p)}% of the price.`],
    }, [
      { t: `x ${down ? '−' : '+'} ${r}x = ${m}x`, ok: true, say: `Yes: take ${r}x ${down ? 'off' : 'on'}, and x ${down ? '−' : '+'} ${r}x = (1 ${down ? '−' : '+'} ${r})x = ${m}x.` },
      { t: `x ${down ? '−' : '+'} ${p}`, ok: false, mc: MC.fixed, say: `${P(p)} is not ${p} dollars: it is ${r} of the price, so ${r}x.` },
      { t: `${r}x`, ok: false, mc: MC.changeFinal, say: `${r}x is the ${down ? 'discount' : 'tax'} itself. The new price is x ${down ? '−' : '+'} ${r}x = ${m}x.` },
    ]);
  }
  if (v === 2) {
    return choiceItem(R, {
      id: `factor-${n}`, family: 'factor',
      prompt: `For ${B(word)} on a price ${A('x')}: x ${down ? '−' : '+'} ${r}x = ${m}x. What does ${S(`${m}x`)} stand for?`,
      board: `x ${down ? '-' : '+'} ${r}x = ${m}x`, work: `${m}x = ${pctStr(down ? 100 - p : 100 + p)}\\%\\ \\text{of } x`,
      solution: [`x is the price: 100%. ${r}x is the ${down ? 'discount' : 'tax'}.`, `${m}x is ${pctStr(down ? 100 - p : 100 + p)}% of the price: ${down ? 'the sale price you pay' : 'the total with tax'}.`],
    }, [
      { t: down ? `The sale price: ${100 - p}% of the price` : `The total with tax: ${pctStr(100 + p)}% of the price`, ok: true, say: `Yes: ${m} = ${pctStr(down ? 100 - p : 100 + p)}%, so ${m}x is ${down ? 'what you pay' : 'the price plus tax'}.` },
      { t: down ? `The discount` : `The tax`, ok: false, mc: MC.meaning, say: `The ${down ? 'discount' : 'tax'} is ${r}x. ${m}x is ${pctStr(down ? 100 - p : 100 + p)}% of x: the ${down ? 'sale price' : 'total'}.` },
      { t: down ? `The price minus ${m} dollars` : `The price plus ${m} dollars`, ok: false, mc: MC.meaning, say: `${m}x means ${m} TIMES x: ${pctStr(down ? 100 - p : 100 + p)}% of the price, not a dollar amount ${down ? 'off' : 'on top'}.` },
    ]);
  }
  const x = 100 * pick(R, [20, 40, 50, 60, 80, 100, 120, 200]);
  const part = partC(x, p)!, ans = down ? x - part : x + part;
  return moneyItem({
    id: `factor-${n}`, family: 'factor',
    prompt: `Check that x ${down ? '−' : '+'} ${r}x = ${m}x with a price of ${A($(x))}: what does ${m} × ${D(x)} give?`,
    board: `x = ${D(x)}`, work: `${D(x)} ${down ? '-' : '+'} ${D(part)} = ${m} \\times ${D(x)} = \\cssId{s}{${D(ans)}}`,
    solution: [`Left side: ${D(x)} ${down ? '−' : '+'} ${r} × ${D(x)} = ${D(x)} ${down ? '−' : '+'} ${D(part)} = ${D(ans)}.`, `Right side: ${m} × ${D(x)} = ${S(D(ans))}. The same, as the distributive property says.`],
  }, ans, `Yes: both sides give ${$(ans)}.`, [
    { c: part, mc: MC.changeFinal, say: `${$(part)} is the ${r}x part only. ${m} × ${D(x)} = ${$(ans)}.` },
    { c: down ? x + part : x - part, mc: MC.direction, say: `${m} is ${down ? 'less' : 'more'} than 1, so the price goes ${down ? 'down' : 'up'}: ${$(ans)}.` },
  ], `Work out ${m} × ${D(x)}.`);
};

// ===== product-of-multipliers =====
const product: Gen = (R, n) => {
  const three = R() < 0.3;
  const pairs: readonly [number, number][] = [[-20, -10], [-10, -10], [-20, -20], [-25, -20], [-30, -10], [20, -10], [-10, 20], [50, -20], [10, 10], [-50, -50], [-40, -25]];
  const ps: number[] = three ? [...pick(R, pairs), pick(R, [-10, -20, 10, 25])] : [...pick(R, pairs)];
  const prod = ps.reduce((a, p) => (a * (100000 + mp(p))) / 100000, 1);
  const prodS = decStr(Math.round(prod * 1e6), 1e6);
  const sum = ps.reduce((s, p) => s + p, 0), addS = multStr(sum);
  const asDollars = R() < 0.4;
  const words = ps.map(p => (p < 0 ? `${P(-p)} off` : `up ${P(p)}`));
  const { rows, guides } = chainRows(10000, ps.map(p => ({ p, word: '' })), false);
  rows[rows.length - 1]!.segs[0]!.pct = `${decStr(Math.round(prod * 1e4), 100)}%`;
  if (asDollars) {
    const ans = Math.round(prod * 10000);
    return moneyItem({
      id: `product-${n}`, family: 'product',
      prompt: `Start at ${A('$100')}. Apply ${words.map(B).join(', then ')}, each to the new amount. Work out $100 × ${ps.map(multStr).join(' × ')}.`,
      board: `100 \\times ${ps.map(multStr).join(' \\times ')}`, work: `= \\cssId{s}{${D(ans)}}`,
      picture: { kind: 'tape', rows: rows.map((r, i) => (i === rows.length - 1 ? { ...r, end: $(Math.round(prod * 10000)) } : r)), guides, ask: { r: rows.length - 1, slot: 'end' }, hi: [{ r: rows.length - 1, i: 0, col: 'link' }] },
      solution: [`Multiply in order: ${ps.map((p, i) => `× ${multStr(p)}`).join(' ')}.`, `$100 × ${prodS} = ${S($(ans))}.`],
    }, ans, `Yes: ${$(ans)}, that is ${prodS} of $100.`, [
      { c: Math.round(multNum(sum) * 10000), mc: MC.adds, say: `That adds the percents: ${sum > 0 ? '+' : ''}${P(sum)} on the $100. Each change acts on the NEW amount, so multiply: ${$(ans)}.` },
    ], `Multiply the multipliers, then by 100.`);
  }
  return {
    id: `product-${n}`, family: 'product', input: 'num', unit: '',
    prompt: `${words.map(B).join(', then ')}, each on the new amount. What ONE multiplier does the same as all ${ps.length} together?`,
    board: ps.map(multStr).join(' \\times '), work: `= \\cssId{s}{${prodS}}`,
    picture: { kind: 'tape', rows, guides, ask: { r: rows.length - 1, slot: 'pct0' }, hi: [{ r: rows.length - 1, i: 0, col: 'link' }] },
    solution: [`Each change multiplies the amount: ${ps.map(multStr).join(', then ')}.`, `Doing them one after another is one multiplication: ${ps.map(multStr).join(' × ')} = ${S(prodS)}.`],
    answer: { kind: 'num', v: prod },
    check: numCheck(prod, `Yes: × ${prodS}, which is ${decStr(Math.round(prod * 1e4), 100)}% of the start.`, [
      { v: multNum(sum), mc: MC.adds, say: `${addS} adds the percents. The second change acts on the NEW amount, so multiply: ${ps.map(multStr).join(' × ')} = ${prodS}.` },
      { v: Math.abs(1 - prod), mc: MC.changeFinal, say: `${decStr(Math.round(Math.abs(1 - prod) * 1e6), 1e6)} is the size of the change. The multiplier for the new amount is ${prodS}.` },
    ], `Multiply: ${ps.map(multStr).join(' × ')}.`, 1e-6),
  };
};

// ===== net-percent-change =====
const net: Gen = (R, n) => {
  const pairs: readonly [number, number][] = [[20, -20], [-20, 20], [10, -10], [50, -50], [-10, -10], [-20, -20], [25, -20], [30, -30], [50, 20], [-50, 50], [40, -25], [10, 10], [-30, 20], [20, 20], [-25, -20]];
  const [a, b] = pick(R, pairs);
  const prod = ((100000 + mp(a)) * (100000 + mp(b))) / 1e10;
  const netP = Math.round((prod - 1) * 10000) / 100;
  const word = (p: number) => (p > 0 ? `up ${P(p)}` : `down ${P(-p)}`);
  const desc = (p: number) => (p === 0 ? 'no change' : `${p > 0 ? 'an increase' : 'a decrease'} of ${pctStr(Math.abs(p))}%`);
  const sum = a + b, pOf = Math.round(prod * 10000) / 100;
  const opts: Opt[] = [
    { t: desc(netP), ok: true, say: `Yes: ${multStr(a)} × ${multStr(b)} = ${decStr(Math.round(prod * 1e4), 1e4)}, which is ${pctStr(pOf)}% of the start: ${desc(netP)}.` },
    { t: desc(sum), ok: false, mc: MC.adds, say: `That adds the percents. The second change works on the NEW amount: ${multStr(a)} × ${multStr(b)} = ${decStr(Math.round(prod * 1e4), 1e4)}, so ${desc(netP)}.` },
    { t: `${prod > 1 ? 'an increase' : 'a decrease'} of ${pctStr(pOf)}%`, ok: false, mc: MC.pctOfAsChange, say: `${pctStr(pOf)}% is the new amount as a percent OF the start. The change is the difference from 100%: ${desc(netP)}.` },
  ];
  const { rows, guides } = chainRows(10000, [{ p: a, word: '' }, { p: b, word: '' }], false);
  rows[2]!.segs[0]!.pct = `${pctStr(pOf)}%`;
  return choiceItem(R, {
    id: `net-${n}`, family: 'net',
    prompt: `A price goes ${B(word(a))}, then ${B(word(b))} (the second change on the new price). What is the net change from the ${A('original price')}?`,
    board: `${multStr(a)} \\times ${multStr(b)} = ${decStr(Math.round(prod * 1e4), 1e4)}`, work: `${decStr(Math.round(prod * 1e4), 1e4)} - 1 = \\cssId{s}{${netP > 0 ? '+' : ''}${pctStr(netP)}\\%}`,
    picture: { kind: 'tape', rows, guides, ask: { r: 2, slot: 'pct0' }, hi: [{ r: 2, i: 0, col: 'link' }], marks: [{ r: 2, at: 100, text: 'start', col: 'pick' }] },
    solution: [`One multiplier: ${multStr(a)} × ${multStr(b)} = ${decStr(Math.round(prod * 1e4), 1e4)}, so the new price is ${pctStr(pOf)}% of the original.`, `Take away the original 100%: ${S(desc(netP))}.`],
  }, opts.filter((o, i, all) => all.findIndex(x => x.t === o.t) === i));
};

// ===== undo-change-inverse =====
const UNDO: readonly [number, number][] = [[-20, 25], [25, -20], [-50, 100], [100, -50], [-37.5, 60], [60, -37.5], [-60, 150], [150, -60], [-75, 300], [-80, 400]];
const undo: Gen = (R, n) => {
  const [a, b] = pick(R, UNDO);
  const up = b > 0;
  const { rows, guides } = chainRows(10000, [{ p: a, word: '' }, { p: b, word: '' }], false);
  rows[1]!.segs[1]!.pct = P(Math.abs(b));
  rows[2]!.end = '$100';
  const ma = multStr(a), mb = multStr(b);
  const what = pick(R, [['A price', 'original price'], ['A bus fare', 'old fare'], ['The rent on a shop', 'old rent'], ['A phone plan', 'old price'], ['A game’s price', 'original price'], ['A concert ticket', 'first price']] as const);
  return {
    id: `undo-${n}`, family: 'undo', input: 'num', unit: '%',
    prompt: `${what[0]} ${a < 0 ? 'goes down' : 'goes up'} ${B(P(Math.abs(a)))}. What percent ${up ? 'increase' : 'decrease'} brings it back to the ${A(what[1])}?`,
    board: `${ma} \\times \\ ? = 1`, work: `1 \\div ${ma} = ${mb} \\Rightarrow \\cssId{s}{${up ? '+' : '-'}${P(Math.abs(b)).replace('%', '\\%')}}`,
    picture: { kind: 'tape', rows, guides, ask: { r: 1, slot: 'pct1' }, hi: [{ r: 1, i: 1, col: 'link' }] },
    solution: [`After the change the price is ${ma} of the original, and that is the NEW 100%.`, `To get back: ${ma} × ? = 1, so ? = 1 ÷ ${ma} = ${mb}: ${up ? 'an increase' : 'a decrease'} of ${S(P(Math.abs(b)))}.`],
    answer: { kind: 'num', v: Math.abs(b) },
    check: numCheck(Math.abs(b), `Yes: ${ma} × ${mb} = 1.`, [
      { v: Math.abs(a), mc: MC.adds, say: `${P(Math.abs(a))} of the NEW price is ${up ? 'less' : 'more'} than ${P(Math.abs(a))} of the original. You need ${ma} × ? = 1: ${P(Math.abs(b))}.` },
    ], `Find the multiplier that makes ${ma} × ? = 1.`),
  };
};

// ===== order-and-fixed-coupons =====
const order: Gen = (R, n) => {
  const v = int(R, 0, 2);
  const x = 100 * pick(R, [40, 50, 60, 80, 100, 120, 150, 200]);
  const p = pick(R, [10, 20, 25, 50]), q = pick(R, WHOLE_TAX);
  const c1 = 100 * pick(R, [5, 10, 15, 20]), c2 = 100 * pick(R, [5, 10]);
  let first: string, second: string, totA: number, totB: number, same: boolean, why: string, mcSame: string | undefined, mcDiff: string | undefined;
  let fT: string, sT: string;
  if (v === 0) {
    first = `${P(p)} off`; second = `${P(q)} tax`; fT = `${Pt(p)}\\ \\text{off}`; sT = `${Pt(q)}\\ \\text{tax}`;
    totA = Math.round(x * multNum(-p) * multNum(q)); totB = totA; same = true;
    why = `Both orders are ${$(x)} × ${multStr(-p)} × ${multStr(q)}: multiplying in any order gives ${$(totA)}.`; mcSame = undefined; mcDiff = MC.order;
  } else if (v === 1) {
    first = `${P(p)} off`; second = `a ${$(c1)} coupon`; fT = `${Pt(p)}\\ \\text{off}`; sT = `${$t(c1)}\\ \\text{coupon}`;
    totA = applyC(x, -p)! - c1; totB = applyC(x - c1, -p)!; same = false;
    why = `${P(p)} off first, then the coupon: ${$(totA)}. The coupon first: ${$(totB)}. A fixed amount does not multiply, so the order changes the total.`; mcSame = MC.commutes; mcDiff = undefined;
  } else {
    first = `a ${$(c1)} coupon`; second = `a ${$(c2)} rebate at the register`; fT = `${$t(c1)}\\ \\text{coupon}`; sT = `${$t(c2)}\\ \\text{rebate}`;
    totA = x - c1 - c2; totB = totA; same = true;
    why = `Two fixed amounts: ${$(x)} − ${$(c1)} − ${$(c2)} = ${$(totA)} in either order.`; mcSame = undefined; mcDiff = MC.order;
  }
  const cheaper = totA < totB ? first : second;
  return choiceItem(R, {
    id: `order-${n}`, family: 'order',
    prompt: `A ${A($(x))} item. Store A applies ${B(first)} first, then ${B(second)}. Store B does the same two things in the other order.${v === 1 ? ' Each percent is of the amount at that moment.' : ''} Do the two stores charge the same?`,
    board: `\\begin{array}{l} \\text{A: } ${fT} \\to ${sT} \\\\ \\text{B: } ${sT} \\to ${fT} \\end{array}`,
    work: `\\text{A: } ${$t(totA)} \\quad \\text{B: } ${$t(totB)}`,
    solution: [why, same ? `Percent changes are multipliers, and multipliers commute. ${v === 2 ? 'Subtracting two amounts commutes too.' : ''}` : `A percent of a smaller amount is smaller: take the percent off first, then the coupon, and you save more.`],
  }, [
    { t: 'Yes: the same total', ok: same, mc: same ? undefined : mcSame, say: same ? `Yes. ${why}` : why },
    { t: `No: ${first} first is cheaper`, ok: !same && cheaper === first, mc: same ? mcDiff : undefined, say: same ? why : cheaper === first ? `Yes. ${why}` : why },
    { t: `No: ${second} first is cheaper`, ok: !same && cheaper === second, mc: same ? mcDiff : undefined, say: same ? why : cheaper === second ? `Yes. ${why}` : why },
  ], true);
};

// ===== shared-vs-updated-base =====
const shared: Gen = (R, n) => {
  const v = int(R, 0, 2);
  if (v < 2) {
    const { s, a, b, fa, fb } = until(() => {
      const s = 100 * pick(R, [40, 50, 60, 80, 100, 120, 150, 200, 240, 400]), a = pick(R, [5, 10, 12, 15, 8]), b = pick(R, [3, 4, 5, 6, 8, 10]);
      const fa = partC(s, a), fb = partC(s, b);
      if (fa === null || fb === null || a === b) return null;
      if (v === 1 && partC(s + fa, b) === null) return null;
      return { s, a, b, fa, fb };
    }, 'fees');
    const sharedTot = s + fa + fb, upd = s + fa + partC(s + fa, b)!;
    const ans = v === 0 ? sharedTot : upd;
    const rows: TapeRow[] = v === 0
      ? [{ lead: $(s), segs: [seg('base', D(s), '100%'), seg('change', D(fa), P(a)), seg('change', D(fb), P(b))], end: $(ans) }]
      : [{ lead: $(s), segs: [seg('base', D(s), '100%'), seg('change', D(fa), P(a))] }, { lead: $(s + fa), segs: [seg('base', D(s + fa), '100%'), seg('change', D(upd - s - fa), P(b))], end: $(ans) }];
    return moneyItem({
      id: `shared-${n}`, family: 'shared',
      prompt: v === 0
        ? `An online order is ${A($(s))}. There is a ${B(`${P(a)} service fee`)} and a ${B(`${P(b)} delivery fee`)}, ${A('each on the $' + D(s) + ' subtotal')}. What is the total?`
        : `An online order is ${A($(s))}. A ${B(`${P(a)} service fee`)} is added. Then a ${B(`${P(b)} delivery fee`)} is charged on ${A('the subtotal plus the service fee')}. What is the total?`,
      board: v === 0 ? `${$t(s)} + ${Pt(a)} + ${Pt(b)}\\ \\text{of } ${$t(s)}` : `${$t(s)} \\times ${multStr(a)} \\times ${multStr(b)}`,
      work: `= \\cssId{s}{${$t(ans)}}`,
      picture: { kind: 'tape', rows, guides: v === 1 ? [{ at: D(s + fa), r0: 0, r1: 1 }] : undefined, ask: { r: rows.length - 1, slot: 'end' }, hi: v === 0 ? [{ r: 0, i: 1, col: 'link' }, { r: 0, i: 2, col: 'link' }] : [{ r: 1, i: 1, col: 'link' }] },
      solution: v === 0
        ? [`Both fees are on the same base ${A($(s))}: ${$(fa)} and ${$(fb)}. Amounts on a shared base just add.`, `${$(s)} + ${$(fa)} + ${$(fb)} = ${S($(ans))}.`]
        : [`The second fee is on the new amount ${$(s + fa)}: an updated base, so the factors multiply.`, `${$(s)} × ${multStr(a)} × ${multStr(b)} = ${S($(ans))}.`],
    }, ans, `Yes: ${$(ans)}.`, v === 0
      ? [{ c: Math.round(s * multNum(a) * multNum(b)), mc: MC.sharedMult, say: `That puts the second fee on top of the first. Both fees are on the ${$(s)} subtotal, so they just add: ${$(ans)}.`, loose: true }]
      : [{ c: sharedTot, mc: MC.adds, say: `That takes both fees of the ${$(s)} subtotal. The second fee is on ${$(s + fa)}: ${$(ans)}.` }],
    `Find each fee on its stated base, then add.`);
  }
  // interest on the updated balance, year by year
  const { pr, p, t, vals } = until(() => {
    const pr = 100 * pick(R, [100, 200, 400, 500, 800, 1000, 2000]), p = pick(R, [5, 10, 20, 4, 2]), t = pick(R, [2, 3]);
    const vals = [pr];
    for (let k = 0; k < t; k++) { const nv = applyC(vals[k]!, p); if (nv === null) return null; vals.push(nv); }
    return { pr, p, t, vals };
  }, 'compound');
  const ans = vals[t]!, simple = pr + t * partC(pr, p)!;
  const rows: TapeRow[] = vals.slice(0, t).map((v2, k) => ({ lead: $(v2), segs: [seg('base', D(v2), k === 0 ? '100%' : undefined), seg('change', D(vals[k + 1]! - v2), P(p))], end: k === t - 1 ? $(ans) : undefined }));
  return moneyItem({
    id: `shared-${n}`, family: 'shared',
    prompt: `${A($(pr))} earns ${B(`${P(p)} interest each year on the balance at the start of that year`)} (not simple interest: the base updates). What is the balance after ${t} years?`,
    board: `${$t(pr)} \\times ${multStr(p)}${t === 3 ? ` \\times ${multStr(p)}` : ''} \\times ${multStr(p)}`, work: `= \\cssId{s}{${$t(ans)}}`,
    picture: { kind: 'tape', rows, guides: vals.slice(1, t).map((v2, k) => ({ at: D(v2), r0: k, r1: k + 1 })), ask: { r: t - 1, slot: 'end' }, hi: rows.map((_, k) => ({ r: k, i: 1, col: 'link' as const })) },
    solution: [`Year by year, each on the new balance: ${vals.slice(1).map($).join(' → ')}.`, `After ${t} years: ${S($(ans))}. Simple interest would give only ${$(simple)}.`],
  }, ans, `Yes: ${$(ans)}.`, [
    { c: simple, mc: MC.adds, say: `That keeps ${$(pr)} as the base every year (simple interest). Here each year’s interest is on the new balance: ${$(ans)}.` },
  ], `Year by year: × ${multStr(p)} each year.`);
};

// ===== compare-offers =====
const offers: Gen = (R, n) => {
  const v = int(R, 0, 2);
  if (v === 0) {
    const { x, r, rb } = until(() => {
      const x = 100 * pick(R, [80, 120, 150, 200, 250, 300, 400, 500]), r = pick(R, WHOLE_TAX), rb = 100 * pick(R, [10, 20, 25, 30, 50]);
      return partC(x, r) === null || partC(x - rb, r) === null ? null : { x, r, rb };
    }, 'rebate');
    const check = x + partC(x, r)!, netC = check - rb, wrong = (x - rb) + partC(x - rb, r)!;
    const askNet = R() < 0.6;
    return moneyItem({
      id: `offers-${n}`, family: 'offers',
      prompt: `A ${A($(x))} phone has a ${B(`${$(rb)} mail-in rebate`)}. Sales tax is ${P(r)}, charged on the price at the register (before the rebate). ${askNet ? 'What is your net cost after the rebate check comes back?' : 'How much do you pay at checkout?'}`,
      board: `${$t(x)} \\times ${multStr(r)}${askNet ? ` - ${$t(rb)}` : ''}`, work: `= \\cssId{s}{${$t(askNet ? netC : check)}}`,
      picture: { kind: 'tape', rows: [{ lead: $(x), segs: [seg('base', D(x), '100%'), seg('change', D(partC(x, r)!), P(r))], end: $(check), endCol: askNet ? 'dim' : 'link' }, ...(askNet ? [{ segs: [seg('result', D(netC)), cut(D(rb), undefined, $(rb))], end: $(netC) } as TapeRow] : [])], ask: { r: askNet ? 1 : 0, slot: 'end' }, hi: [{ r: askNet ? 1 : 0, i: 0, col: 'link' }] },
      solution: [`At checkout you pay the price plus tax: ${$(x)} × ${multStr(r)} = ${$(check)}. The rebate comes later.`, askNet ? `Net cost: ${$(check)} − ${$(rb)} = ${S($(netC))}.` : `So you pay ${S($(check))} at the register.`],
    }, askNet ? netC : check, `Yes: ${$(askNet ? netC : check)}.`, askNet
      ? [{ c: wrong, mc: MC.rebate, say: `That takes the rebate off before the tax. Tax is charged on the full register price: ${$(check)}, then the rebate: ${$(netC)}.` },
        { c: check, say: `That is what you pay at checkout. The rebate check brings ${$(rb)} back: ${$(netC)}.` }]
      : [{ c: wrong, mc: MC.rebate, say: `A mail-in rebate does not lower the register price. You pay ${$(x)} plus tax: ${$(check)}.` },
        { c: netC, mc: MC.rebate, say: `The rebate comes back later by mail. At checkout you pay ${$(check)}.` }],
    askNet ? `Price plus tax, then minus the rebate.` : `Price plus tax; the rebate comes later.`);
  }
  if (v === 1) {
    const { xa, pa, xb, pb } = until(() => {
      const xa = 100 * pick(R, [60, 70, 80, 90, 100]), pa = pick(R, [30, 35, 40]), xb = 100 * pick(R, [50, 55, 60, 70]), pb = pick(R, [10, 15, 20, 25]);
      const fa = applyC(xa, -pa), fb = applyC(xb, -pb);
      return fa === null || fb === null || fa <= fb || pa <= pb ? null : { xa, pa, xb, pb };
    }, 'offers');
    const fa = applyC(xa, -pa)!, fb = applyC(xb, -pb)!;
    return choiceItem(R, {
      id: `offers-${n}`, family: 'offers',
      prompt: `The same headphones: Store A lists them at ${A($(xa))} with ${B(`${P(pa)} off`)}. Store B lists them at ${A($(xb))} with ${B(`${P(pb)} off`)}. Which store is cheaper?`,
      board: `\\begin{array}{l} \\text{A: } ${$t(xa)} \\times ${multStr(-pa)} \\\\ \\text{B: } ${$t(xb)} \\times ${multStr(-pb)} \\end{array}`,
      work: `\\text{A: } ${$t(fa)} \\quad \\text{B: } \\cssId{s}{${$t(fb)}}`,
      solution: [`The percents are of different wholes, so compare the prices you pay.`, `A: ${$(xa)} × ${multStr(-pa)} = ${$(fa)}. B: ${$(xb)} × ${multStr(-pb)} = ${S($(fb))}. Store B is cheaper.`],
    }, [
      { t: `Store B: ${$(fb)} is less than ${$(fa)}`, ok: true, say: `Yes: B’s smaller percent is of a smaller price, so B ends lower.` },
      { t: `Store A: ${P(pa)} off is the bigger discount`, ok: false, mc: MC.wholes, say: `${P(pa)} is more, but of a bigger price. Compare what you pay: A ${$(fa)}, B ${$(fb)}.` },
      { t: `The same: both are a good discount`, ok: false, say: `Work out both: A ${$(fa)}, B ${$(fb)}. B is cheaper.` },
    ]);
  }
  const x = 100 * pick(R, [50, 80, 100, 120, 200, 250]);
  const [p, q] = pick(R, [[20, 20], [10, 30], [25, 25], [30, 10], [20, 10]] as const);
  const big = p + q, twoS = Math.round(x * multNum(-p) * multNum(-q)), oneS = applyC(x, -big)!;
  return choiceItem(R, {
    id: `offers-${n}`, family: 'offers',
    prompt: `On a ${A($(x))} bike: Offer A is ${B(`${big}% off`)}. Offer B is ${B(`${p}% off, then ${q}% off the sale price`)}. Which offer costs less?`,
    board: `\\begin{array}{l} \\text{A: } ${$t(x)} \\times ${multStr(-big)} \\\\ \\text{B: } ${$t(x)} \\times ${multStr(-p)} \\times ${multStr(-q)} \\end{array}`,
    work: `\\text{A: } \\cssId{s}{${$t(oneS)}} \\quad \\text{B: } ${$t(twoS)}`,
    solution: [`B’s second ${q}% comes off a smaller amount, so B takes off less than ${big}%.`, `A: ${S($(oneS))}. B: ${$(twoS)}. One ${big}% discount is better.`],
  }, [
    { t: `Offer A: ${$(oneS)}`, ok: true, say: `Yes: B is ${multStr(-p)} × ${multStr(-q)} = ${decStr(Math.round(multNum(-p) * multNum(-q) * 100), 100)} of the price, more than A’s ${multStr(-big)}.` },
    { t: `The same: ${p}% + ${q}% = ${big}%`, ok: false, mc: MC.adds, say: `The second discount is of the SALE price, not of ${$(x)}. B costs ${$(twoS)}, A costs ${$(oneS)}.` },
    { t: `Offer B: two discounts beat one`, ok: false, mc: MC.adds, say: `Two discounts take off less here: B costs ${$(twoS)}, A costs ${$(oneS)}.` },
  ]);
};

/** "an 8% tip", "an $18 hoodie", "an 11% fee": the article before a number read aloud (eight, eleven, eighteen, eighty) */
export const articles = (s: string) => s.replace(/\b([Aa]) ((?:<[^>]+>)*\$?)(8|11(?!\d)|18(?!\d))/g, '$1n $2$3');
const withArticles = (g: Gen): Gen => (R, n, sg) => {
  const it = g(R, n, sg);
  return { ...it, prompt: articles(it.prompt), solution: it.solution.map(articles), ...(it.choices ? { choices: it.choices.map(articles) } : {}) };
};
const FAMS: Record<FamilyId, Gen> = {
  base: baseFam, baseCalc, direction, pctOf: pctOfFam, mult, single, commission, round, wages, estimate, successive, reverse,
  pctError, interest, months, factor, product, net, undo, order, shared, offers,
};
export const GENERATORS = Object.fromEntries(Object.entries(FAMS).map(([k, g]) => [k, withArticles(g)])) as Record<FamilyId, Gen>;
