// items.ts: practice families for "Calculate sales tax, totals, and pre-tax prices" (grade 7, 7.RP.A.3). Every family
// is one deep structure; a generator receives the sub-goal id and uses that sub-goal's number ranges (topic JSON
// `cases`). Every wrong answer the classifier recognises carries its id from math-curriculum-essentials/
// misconceptions.json (logged, never shown). All money is exact (taxMaths.ts). Pure: no DOM, no canvas.
// Colours follow the model: pre-tax price = amber (A), tax = teal (B), total = lime (S). Items that ASK which amount
// plays which role print the amounts plain, so the colour does not give the answer away.
import { type Gen, type Item, type Response, type Verdict, A, B, S, int, pick, shuffle } from '../../runtime/item';
import type { TaxTapeParams, TaxTapeStep } from './TaxTape';
import {
  M_WHOLE, U_CENT, budgetMax, budgetQuotientU, decOf, digitsU, multDec, pct, priceFromTotal, pricesForTax, rateDec,
  roundU, salesTax, taxOf, toCents, toUnits, totalOf, truncU, usd, usdTex, usdU, usdUTex,
} from './taxMaths';

// ---------- what the page draws for an item ----------
export interface TaxPicture {
  /** the model with the problem (hidden amounts show "?") */ tape: TaxTapeParams;
  /** the model after the answer (default: tape with nothing hidden) */ solved?: TaxTapeParams;
  /** steps shown with the problem ([] = the bare notation first, the model comes with the solution) */ pre: TaxTapeStep[];
  /** steps the worked solution adds */ post: TaxTapeStep[];
  /** labels lit in the worked solution */ pulse: ('price' | 'tax' | 'total')[];
  /** TeX lines the worked solution writes on the board */ work: string[];
  [k: string]: unknown;
}

export const MC = {
  shelf: 'mc.finance.shelf-price-includes-sales-tax',
  changeFinal: 'mc.percent.change-reported-as-final-amount',
  numeral: 'mc.percent.adds-or-subtracts-percent-numeral',
  fixed: 'mc.percent.percent-as-fixed-amount',
  newBase: 'mc.percent.new-or-estimate-as-base',
  noDiv100: 'mc.percent.percent-numeral-without-dividing-by-100',
  pointShift: 'mc.decimals.dollars-cents-point-misplaced',
  oneOverP: 'mc.percent.reads-p-percent-as-one-pth',
  direction: 'mc.percent.wrong-direction-of-change',
  placeUnit: 'mc.decimals.names-wrong-place-unit',
  longer: 'mc.decimals.more-fractional-positions-means-greater',
  scale: 'mc.decimals.product-decimal-scale-not-preserved',
  digits: 'mc.estimation.more-digits-more-accurate',
  trunc: 'mc.decimals.truncates-instead-of-rounding',
  early: 'mc.decimals.intermediate-precision-always-invalid',
  calc: 'mc.estimation.trusts-calculator-display',
  oneSided: 'mc.estimation.one-sided-bound-check',
  perItem: 'mc.finance.tax-rate-as-flat-per-item-charge',
  exempt: 'mc.finance.taxes-exempt-items',
  multNotDiv: 'mc.ratio-rate.multiplies-by-rate-when-dividing-needed',
  lessThanOne: 'mc.fractions-concept.fraction-must-be-less-than-one',
  append: 'mc.percent.appends-rate-digits-after-one',
  divRate: 'mc.percent.divides-by-rate-to-undo-change',
  opposite: 'mc.percent.opposite-percent-to-undo-change',
  successive: 'mc.percent.adds-successive-percent-changes',
  roundedExact: 'mc.estimation.rounded-value-treated-as-exact',
  complete: 'mc.reasoning-language.checked-candidates-prove-completeness',
  fixedRound: 'mc.estimation.fixed-rounding-rule-for-rounded-tax-boundary',
  pretaxOnly: 'mc.finance.pretax-price-only-choice',
  rateOnly: 'mc.finance.sales-tax-rate-only-choice',
} as const;

// ---------- contexts ----------
interface Thing { tag: string; a: string; the: string }
const THINGS: readonly Thing[] = [
  { tag: 'Sneakers', a: 'a pair of sneakers', the: 'the sneakers' },
  { tag: 'Headphones', a: 'a pair of headphones', the: 'the headphones' },
  { tag: 'Video game', a: 'a video game', the: 'the game' },
  { tag: 'Hoodie', a: 'a hoodie', the: 'the hoodie' },
  { tag: 'Skateboard', a: 'a skateboard', the: 'the skateboard' },
  { tag: 'Backpack', a: 'a backpack', the: 'the backpack' },
  { tag: 'Board game', a: 'a board game', the: 'the board game' },
  { tag: 'Soccer ball', a: 'a soccer ball', the: 'the ball' },
  { tag: 'Desk lamp', a: 'a desk lamp', the: 'the lamp' },
  { tag: 'Bike helmet', a: 'a bike helmet', the: 'the helmet' },
  { tag: 'Keyboard', a: 'a keyboard', the: 'the keyboard' },
  { tag: 'Tent', a: 'a tent', the: 'the tent' },
  { tag: 'Smartwatch', a: 'a smartwatch', the: 'the watch' },
  { tag: 'Phone case', a: 'a phone case', the: 'the phone case' },
  { tag: 'Guitar strings', a: 'a set of guitar strings', the: 'the strings' },
  { tag: 'Jacket', a: 'a jacket', the: 'the jacket' },
];
const NAMES = ['Maya', 'Leo', 'Ava', 'Sam', 'Nora', 'Eli', 'Zoe', 'Omar', 'Lily', 'Jack', 'Rosa', 'Ben', 'Priya', 'Diego', 'Kenji', 'Amara', 'Kai', 'Tess'];
const STORES = ['Corner Shop', 'Mega Mart', 'Town Outlet', 'Main Street Sports', 'Gadget Hub', 'River Mall', 'Bay Store', 'Hilltop Market'];
const GROCERY = ['Milk', 'Bread', 'Apples', 'Eggs', 'Rice', 'Cereal', 'Bananas', 'Cheese'];
const TAXABLE = ['Pens', 'Soap', 'Batteries', 'Notebook', 'Socks', 'Cap', 'Glue', 'Markers', 'Towel', 'Mug'];
const NOCALC = '<span class="calc">No calculator.</span>';
const CALC = '<span class="calc">Calculator allowed.</span>';
const RULE = '<span class="calc">Tax rounds to the nearest cent, halves up.</span>';
const cap = (s: string) => s[0]!.toUpperCase() + s.slice(1);
/** a whole-number percent rate in milli-percent */
const WHOLE = (R: () => number, lo = 5, hi = 10) => int(R, lo, hi) * 1000;
/** US-style non-integer rates (all multiples of 0.125%, so a whole-dollar multiple of $8 is always exact) */
const DEC_RATES = [7500, 6250, 8250, 8875, 4500, 5500, 6500, 7250, 9250, 6750, 5750, 4750, 8500, 9500, 2500, 3500];
const decRate = (R: () => number) => pick(R, DEC_RATES);
const pT = (m: number) => `${pct(m)}\\%`;
const pH = (m: number) => `${pct(m)}%`;
const $ = (c: number) => usd(c, false);          // $60, $18.75
const $c = (c: number) => usd(c, true);          // $60.00
const T$ = (c: number) => usdTex(c, false);
const CENTS = [5, 10, 15, 20, 25, 30, 40, 45, 50, 60, 75, 80, 90, 95];
/** a price in cents whose tax at this rate is an exact number of cents */
function exactPrice(R: () => number, rateM: number, lo: number, hi: number, centsP = 0): number {
  for (let t = 0; t < 400; t++) {
    const c = int(R, lo, hi) * 100 + (R() < centsP ? pick(R, CENTS) : 0);
    if ((c * rateM) % U_CENT === 0) return c;
  }
  return Math.max(1, int(R, Math.ceil(lo / 8), Math.max(Math.ceil(lo / 8), Math.floor(hi / 8)))) * 800;
}
/** a shop price with cents ($19.99, $24.49, $7.35) */
const shopPrice = (R: () => number, lo: number, hi: number) => int(R, lo, hi) * 100 + pick(R, [99, 49, 95, 25, 75, 35, 65, 15, 89]);

// ---------- item builders ----------
type Base = Omit<Item, 'input' | 'answer' | 'check' | 'choices'>;
interface MWrong { u: number; mc?: string; say: string }
/** a money answer typed as dollars, checked exactly to the cent; wrongs are exact amounts in units ($0.0000001) */
function moneyItem(o: Base & { c: number; wrongs: MWrong[]; right: string; hint: string }): Item {
  const { c, wrongs, right, hint, ...rest } = o;
  const target = c * U_CENT;
  return {
    ...rest, input: 'num', unit: rest.unit ?? 'dollars', answer: { kind: 'num', v: c / 100 },
    check(r: Response): Verdict {
      if (r.kind !== 'num' || !Number.isFinite(r.v)) return { ok: false, say: 'Type an amount of money, like 4.80.' };
      const u = toUnits(r.v), kc = toCents(r.v);
      if (u === target) return { ok: true, say: right };
      // an exact wrong amount first; else a wrong amount the kid rounded (within half a cent)
      const w = wrongs.find(x => x.u !== target && x.u === u)
        ?? wrongs.find(x => x.u !== target && kc !== c && Math.abs(r.v * 1e7 - x.u) <= U_CENT / 2 + 1 && Math.abs(target - x.u) > U_CENT / 2);
      if (w) return { ok: false, mc: w.mc, say: w.say };
      if (u === null) return { ok: false, say: 'Type the amount as a number of dollars, like 4.80.' };
      return { ok: false, say: hint };
    },
  };
}
interface NWrong { v: number; mc?: string; say: string; tol?: number }
/** a number answer (a percent, a decimal, a multiplier) */
function numItem(o: Base & { v: number; wrongs: NWrong[]; right: string; hint: string }): Item {
  const { v, wrongs, right, hint, ...rest } = o;
  const near = (a: number, b: number, tol = 1e-9) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
  return {
    ...rest, input: 'num', answer: { kind: 'num', v },
    check(r: Response): Verdict {
      if (r.kind !== 'num' || !Number.isFinite(r.v)) return { ok: false, say: 'Type a number.' };
      if (near(r.v, v)) return { ok: true, say: right };
      const w = wrongs.find(x => !near(x.v, v) && near(r.v, x.v, x.tol));
      return w ? { ok: false, mc: w.mc, say: w.say } : { ok: false, say: hint };
    },
  };
}
interface Choice { t: string; ok: boolean; mc?: string; say: string }
/** a choice item; options with the same text are dropped (the first kept: list the right one first) */
function choiceItem(R: () => number, o: Base & { opts: Choice[] }): Item {
  const { opts, ...rest } = o;
  const seen = new Set<string>(), uniq = opts.filter(c => (seen.has(c.t) ? false : (seen.add(c.t), true)));
  const sh = shuffle(R, uniq.slice());
  return {
    ...rest, input: 'choice', choices: sh.map(c => c.t), answer: { kind: 'choice', i: sh.findIndex(c => c.ok) },
    check(r: Response): Verdict {
      if (r.kind !== 'choice' || !sh[r.i]) return { ok: false, say: 'Pick one answer.' };
      const c = sh[r.i]!;
      return { ok: c.ok, mc: c.ok ? undefined : c.mc, say: c.say };
    },
  };
}
const U = (c: number) => c * U_CENT;               // cents -> units
const ALL: TaxTapeStep[] = ['receipt', 'rPrice', 'rTax', 'rTotal', 'tape', 'whole', 'tax', 'total', 'totalPct'];
/** worked lines for the tax at a whole rate by the 1% (or 10%) route */
function taxRoute(price: number, rateM: number): { html: string[]; tex: string[] } {
  const t = salesTax(price, rateM), p = rateM / 1000;
  if (rateM === 10000) return { html: [`10% is one tenth: ${$(price)} ÷ 10 = ${B($c(t.tax))}.`], tex: [`10\\%\\ \\text{of}\\ ${T$(price)} = ${usdTex(t.tax)}`] };
  if (rateM === 5000 && price % 20 === 0) return { html: [`10% of ${$(price)} is ${$(price / 10)}. 5% is half of that: ${B($c(t.tax))}.`], tex: [`10\\% \\to ${T$(price / 10)}`, `5\\% \\to ${usdTex(t.tax)}`] };
  if (rateM % 1000 === 0 && price % 100 === 0) {
    const one = price / 100;
    return { html: [`1% of ${$(price)} is ${$c(one)}.`, `${p}% is ${p} × ${$c(one)} = ${B($c(t.tax))}.`], tex: [`1\\% \\to ${usdTex(one)}`, `${p}\\% \\to ${p} \\times ${usdTex(one)} = ${usdTex(t.tax)}`] };
  }
  return { html: [`${pH(rateM)} = ${rateDec(rateM)}. The tax is ${rateDec(rateM)} × ${$c(price)} = ${B(usdU(t.taxU))}.`], tex: [`${rateDec(rateM)} \\times ${usdTex(price)} = ${usdUTex(t.taxU)}`] };
}

// =============== 1. identify-quantities ===============
const roles: Gen = (R, n) => {
  const C = pick(R, THINGS), name = pick(R, NAMES), rate = WHOLE(R, 4, 10);
  const price = exactPrice(R, rate, pick(R, [1, 10, 40]), pick(R, [60, 200, 1000]), 0.6), t = salesTax(price, rate);
  const ask = pick(R, ['price', 'tax', 'total', 'total'] as const);
  const v = { price, tax: t.tax, total: t.total };
  const receipt = R() < 0.4;
  let story: string;
  if (receipt) {
    const lines = shuffle(R, [`TOTAL DUE ${$c(t.total)}`, `SUBTOTAL ${$c(price)}`, `SALES TAX ${$c(t.tax)}`]);
    story = `${name}'s receipt for ${C.a} lists: ${lines.join(' · ')}.`;
  } else story = pick(R, [
    `The shelf price of ${C.the} is ${$(price)}. At the register, ${$(t.tax)} of sales tax is added, and ${name} pays ${$(t.total)}.`,
    `${name} hands over ${$(t.total)} for ${C.a}. That includes ${$(t.tax)} of sales tax on the shelf price of ${$(price)}.`,
    `At the register, ${C.the}: ${$(t.tax)} sales tax, ${$(t.total)} to pay, shelf price ${$(price)}.`,
  ]);
  const role = { price: 'the pre-tax price', tax: 'the sales tax', total: 'the total you pay' }[ask];
  const sayRole = (k: 'price' | 'tax' | 'total') => ({
    price: `${$(price)} is the pre-tax price: the shelf price, before tax.`,
    tax: `${$(t.tax)} is the tax: the amount added at the register.`,
    total: `${$(t.total)} is the total: the pre-tax price plus the tax.`,
  })[k];
  const opts: Choice[] = (['price', 'tax', 'total'] as const).map(k => {
    if (k === ask) return { t: $(v[k]), ok: true, say: `Yes. ${sayRole(k)}` };
    const mc = ask === 'total' && k === 'tax' ? MC.changeFinal : ask === 'total' && k === 'price' ? MC.shelf : undefined;
    return { t: $(v[k]), ok: false, mc, say: `${sayRole(k)} Look for ${role}.` };
  });
  opts.sort((a, b) => Number(b.ok) - Number(a.ok));
  return choiceItem(R, {
    id: `roles-${n}`, family: 'roles', prompt: `${story} Which amount is <b>${role}</b>? ${NOCALC}`, board: `\\text{${role}} = \\ ?`,
    picture: { tape: { price, rate, item: C.tag }, pre: [], post: ALL, pulse: [ask], work: [`${usdTex(price)} + ${usdTex(t.tax)} = ${usdTex(t.total)}`] } satisfies TaxPicture,
    solution: [`The shelf price ${A($c(price))} is the pre-tax price: tax is added at the register.`, `${A($c(price))} + ${B($c(t.tax))} = ${S($c(t.total))}, the total.`],
    opts,
  });
};
const missingAmt: Gen = (R, n) => {
  const C = pick(R, THINGS), rate = WHOLE(R, 4, 10);
  const price = exactPrice(R, rate, pick(R, [2, 10, 30]), pick(R, [50, 150, 400]), 0.7), t = salesTax(price, rate);
  const unk = pick(R, ['total', 'total', 'tax', 'price'] as const);
  const hide = { price: unk === 'price', tax: unk === 'tax', total: unk === 'total' };
  const known = { price: `the pre-tax price is ${A($c(price))}`, tax: `the tax is ${B($c(t.tax))}`, total: `the total is ${S($c(t.total))}` };
  const givens = (['price', 'tax', 'total'] as const).filter(k => k !== unk).map(k => known[k]);
  const ask = { price: 'the pre-tax price', tax: 'the tax', total: 'the total' }[unk];
  const c = { price, tax: t.tax, total: t.total }[unk];
  const wrongs: MWrong[] = unk === 'total' ? [
    { u: U(t.tax), mc: MC.changeFinal, say: `${$c(t.tax)} is the tax, the part added. The total is the price plus the tax.` },
    { u: U(price), mc: MC.shelf, say: `${$c(price)} is the shelf price, before tax. At the register the tax is added on top.` },
    { u: U(price - t.tax), mc: MC.direction, say: 'Sales tax is added to the price, not taken off.' },
  ] : unk === 'tax' ? [
    { u: U(t.total + price), say: 'The tax is the part between the price and the total: subtract.' },
  ] : [
    { u: U(t.total), mc: MC.shelf, say: `${$c(t.total)} already has the tax in it. The pre-tax price is less.` },
    { u: U(t.total + t.tax), say: 'The tax was added to get the total. Going back, take it off.' },
  ];
  const sol = unk === 'total' ? `${A($c(price))} + ${B($c(t.tax))} = ${S($c(t.total))}.` : unk === 'tax' ? `${S($c(t.total))} − ${A($c(price))} = ${B($c(t.tax))}.` : `${S($c(t.total))} − ${B($c(t.tax))} = ${A($c(price))}.`;
  return moneyItem({
    id: `missingAmt-${n}`, family: 'missingAmt',
    prompt: `On a receipt for ${C.a}, ${givens.join(' and ')}. What is ${ask}? ${NOCALC}`,
    board: unk === 'total' ? `${usdTex(price)} + ${usdTex(t.tax)} = \\$\\,?` : unk === 'tax' ? `${usdTex(price)} + \\$\\,? = ${usdTex(t.total)}` : `\\$\\,? + ${usdTex(t.tax)} = ${usdTex(t.total)}`,
    picture: { tape: { price, rate, item: C.tag, hide }, pre: ['receipt', 'rPrice', 'rTax', 'rTotal', 'tape', 'whole', 'tax', 'total'], post: ['totalPct'], pulse: [unk], work: [unk === 'total' ? `${usdTex(price)} + ${usdTex(t.tax)} = ${usdTex(t.total)}` : unk === 'tax' ? `${usdTex(t.total)} - ${usdTex(price)} = ${usdTex(t.tax)}` : `${usdTex(t.total)} - ${usdTex(t.tax)} = ${usdTex(price)}`] } satisfies TaxPicture,
    solution: ['Total = pre-tax price + tax.', sol],
    c, wrongs, right: `Yes: ${sol.replace(/<[^>]+>/g, '')}`, hint: 'Total = pre-tax price + tax. Use the two amounts you know.',
  });
};

// =============== 2. rate-vs-amount ===============
const rateOrAmount: Gen = (R, n) => {
  const C = pick(R, THINGS), rate = R() < 0.6 ? WHOLE(R, 4, 10) : pick(R, [8250, 7500, 6250, 5500]);
  const price = exactPrice(R, rate, 12, 160, 0.4), t = salesTax(price, rate);
  const ask = pick(R, ['amount', 'rate', 'total'] as const);
  const rateAsC = Math.round(rate / 10);   // "7%" read as $7 (in cents)
  let q: string, opts: Choice[];
  const story = ask === 'total'
    ? `${cap(C.the)}: shelf price ${$c(price)}. The receipt shows "Tax (${pH(rate)}) ${$c(t.tax)}".`
    : `${cap(C.the)}: shelf price ${$c(price)}. The receipt shows "Tax (${pH(rate)}) ${$c(t.tax)}" and "Total ${$c(t.total)}".`;
  if (ask === 'amount') {
    q = 'How many dollars of tax were added?';
    opts = [
      { t: $c(t.tax), ok: true, say: `Yes: ${$c(t.tax)} is the tax amount, in dollars.` },
      { t: $c(rateAsC), ok: false, mc: MC.fixed, say: `${pH(rate)} is the rate, not dollars: ${pH(rate)} of ${$c(price)} is ${$c(t.tax)}.` },
      { t: $c(t.total), ok: false, say: `${$c(t.total)} is the total, the price with the tax in it.` },
    ];
  } else if (ask === 'rate') {
    q = 'What is the tax rate?';
    opts = [
      { t: pH(rate), ok: true, say: `Yes: the rate is ${pH(rate)}, the tax on every $100 of price.` },
      { t: `${digitsU(U(t.tax), false)}%`, ok: false, mc: MC.fixed, say: `${$c(t.tax)} is the tax amount in dollars. The rate is the percent: ${pH(rate)}.` },
      { t: $c(t.tax), ok: false, say: `That is the tax amount. A rate is a percent: ${pH(rate)}.` },
    ];
  } else {
    q = 'What do you pay in total?';
    opts = [
      { t: $c(t.total), ok: true, say: `Yes: ${$c(price)} + ${$c(t.tax)} = ${$c(t.total)}.` },
      { t: $c(price + rateAsC), ok: false, mc: MC.numeral, say: `That adds ${pH(rate)} as $${pct(rate)}. The tax is ${pH(rate)} OF the price: ${$c(t.tax)}.` },
      { t: $c(price), ok: false, mc: MC.shelf, say: 'The shelf price is before tax. The total has the tax added.' },
    ];
  }
  return choiceItem(R, {
    id: `rateOrAmount-${n}`, family: 'rateOrAmount', prompt: `${story} ${q} ${NOCALC}`,
    board: `\\text{Tax}\\ (${pT(rate)})\\quad ${usdTex(t.tax)}`,
    picture: { tape: { price, rate, item: C.tag, ...(ask === 'total' ? { hide: { total: true } } : {}) }, solved: { price, rate, item: C.tag }, pre: ['receipt', 'rPrice', 'rTax', ...(ask === 'total' ? [] : ['rTotal' as const])], post: ['rTotal', 'tape', 'whole', 'tax', 'total', 'totalPct'], pulse: [ask === 'total' ? 'total' : 'tax'], work: [`${pT(rate)}\\ \\text{of}\\ ${usdTex(price)} = ${usdTex(t.tax)}`] } satisfies TaxPicture,
    solution: [`The rate ${pH(rate)} is a percent: ${pct(rate)} dollars of tax for every $100 of price.`, `The tax amount is dollars: ${pH(rate)} of ${A($c(price))} = ${B($c(t.tax))}.`],
    opts,
  });
};
const perHundred: Gen = (R, n) => {
  const rate = R() < 0.7 ? WHOLE(R, 4, 10) : pick(R, [8250, 7500, 6250, 5500, 6500]);
  const hund = int(R, 1, 9), price = hund * 10000, t = salesTax(price, rate);
  const C = pick(R, THINGS);
  return moneyItem({
    id: `perHundred-${n}`, family: 'perHundred',
    prompt: `A ${pH(rate)} sales tax means ${B('$' + pct(rate))} of tax for every ${A('$100')} of price. ${cap(C.a)} costs ${A($(price))} before tax. How much tax is added? ${NOCALC}`,
    board: `${pT(rate)}\\ \\text{of}\\ ${T$(price)}`,
    picture: { tape: { price, rate, cells: hund > 1 ? hund : 0, hide: { tax: true, total: true } }, solved: { price, rate, cells: hund > 1 ? hund : 0 }, pre: ['tape', 'whole', 'cells'], post: ['tax', 'total', 'totalPct'], pulse: ['tax'], work: [`${hund} \\times ${usdTex(rate / 10, false)} = ${usdTex(t.tax)}`] } satisfies TaxPicture,
    solution: [`${$(price)} is ${hund} hundred${hund > 1 ? 's' : ''} of dollars.`, `${hund} × $${pct(rate)} = ${B($c(t.tax))}.`],
    c: t.tax,
    wrongs: [
      ...(hund > 1 ? [{ u: U(rate / 10), mc: MC.fixed, say: `$${pct(rate)} is the tax on $100. This price is ${hund} hundreds.` }] : []),
      { u: U(t.total), say: `${$c(t.total)} is the total. The tax is only the part added.` },
      { u: U(price) * rate / 1000, mc: MC.noDiv100, say: `${pH(rate)} is ${pct(rate)} per hundred, so divide by 100: ${$c(t.tax)}.` },
    ],
    right: `Yes: ${hund} × $${pct(rate)} = ${$c(t.tax)}.`, hint: `Count the hundreds in ${$(price)}, then $${pct(rate)} for each.`,
  });
};

// =============== 3. pretax-is-100 ===============
const priceTen = (R: () => number) => pick(R, [int(R, 2, 20) * 10, int(R, 1, 10) * 20]) * 100;
const whichWhole: Gen = (R, n) => {
  const rate = WHOLE(R, 5, 10), price = priceTen(R), t = salesTax(price, rate);
  const C = pick(R, THINGS), ask = pick(R, ['100', '100', 'top'] as const);
  const tot = pct(M_WHOLE + rate);
  const opts: Choice[] = ask === '100' ? [
    { t: `The pre-tax price, ${$(price)}`, ok: true, say: `Yes: the tax is ${pH(rate)} OF the pre-tax price, so ${$(price)} is the whole, 100%.` },
    { t: `The total, ${$(t.total)}`, ok: false, mc: MC.newBase, say: `The total is more than the whole: it is ${tot}% of the pre-tax price.` },
    { t: `The tax, ${$(t.tax)}`, ok: false, say: `The tax is only ${pH(rate)} of the price.` },
  ] : [
    { t: `The total, ${$(t.total)}`, ok: true, say: `Yes: 100% (the price) + ${pH(rate)} (the tax) = ${tot}%, the total.` },
    { t: `The tax, ${$(t.tax)}`, ok: false, mc: MC.changeFinal, say: `The tax is the ${pH(rate)} piece. ${tot}% is the price and the tax together.` },
    { t: `The pre-tax price, ${$(price)}`, ok: false, say: `The pre-tax price is 100%. ${tot}% is more than that.` },
  ];
  return choiceItem(R, {
    id: `whichWhole-${n}`, family: 'whichWhole',
    prompt: `${cap(C.a)} costs ${$(price)} before a ${pH(rate)} sales tax; the tax is ${$(t.tax)} and the total ${$(t.total)}. On a tape diagram, which amount sits at <b>${ask === '100' ? '100%' : `${tot}%`}</b>? ${NOCALC}`,
    board: ask === '100' ? '100\\% = \\ ?' : `${tot}\\% = \\ ?`,
    picture: { tape: { price, rate, cells: 10 }, pre: [], post: ['tape', 'whole', 'cells', 'tax', 'total', 'totalPct'], pulse: [ask === '100' ? 'price' : 'total'], work: [`100\\% = ${T$(price)}`, `${tot}\\% = ${T$(t.total)}`] } satisfies TaxPicture,
    solution: [`The tax is a percent OF the pre-tax price, so ${A($(price))} = 100%.`, `The tax sticks out ${pH(rate)} more: ${S($(t.total))} = ${tot}%.`],
    opts,
  });
};
const totalPct: Gen = (R, n) => {
  const rate = WHOLE(R, 5, 10), price = priceTen(R), r = rate / 1000;
  return numItem({
    id: `totalPct-${n}`, family: 'totalPct', unit: '%',
    prompt: `The pre-tax price of ${pick(R, THINGS).a} is ${A($(price))}, the 100% on the tape. A ${B(pH(rate) + ' tax')} is added. The total is what percent of the pre-tax price? ${NOCALC}`,
    board: `100\\% + ${pT(rate)} = \\ ?`,
    picture: { tape: { price, rate, hide: { totalPct: true } }, solved: { price, rate }, pre: ['tape', 'whole', 'tax', 'total'], post: ['totalPct'], pulse: ['total'], work: [`100\\% + ${pT(rate)} = ${100 + r}\\%`] } satisfies TaxPicture,
    solution: [`The pre-tax price is the whole: 100%.`, `The tax adds ${pH(rate)} of the same whole: ${S(`${100 + r}%`)}.`],
    v: 100 + r,
    wrongs: [
      { v: r, mc: MC.changeFinal, say: `${r}% is just the tax. The total is the price AND the tax.` },
      { v: 100 - r, mc: MC.direction, say: 'Tax is added: the total is more than 100%.' },
      { v: 100, mc: MC.shelf, say: '100% is the pre-tax price. The total has the tax added on top.' },
    ],
    right: `Yes: 100% + ${r}% = ${100 + r}%.`, hint: 'The price is 100%. Add the tax rate.',
  });
};
const dollarAt: Gen = (R, n) => {
  const rate = WHOLE(R, 5, 10), price = priceTen(R), t = salesTax(price, rate), r = rate / 1000;
  return moneyItem({
    id: `dollarAt-${n}`, family: 'dollarAt',
    prompt: `On a double number line, 0% lines up with $0 and ${A(`100% with ${$(price)}`)}, the pre-tax price. The tax rate is ${B(pH(rate))}. What dollar amount lines up with ${S(`${100 + r}%`)}? ${NOCALC}`,
    board: `100\\% \\to ${T$(price)},\\ \\ ${100 + r}\\% \\to \\ ?`,
    picture: { tape: { price, rate, cells: 10, hide: { tax: true, total: true } }, solved: { price, rate, cells: 10 }, pre: ['tape', 'whole', 'cells', 'tax', 'total', 'totalPct'], post: [], pulse: ['tax', 'total'], work: [`${r}\\%\\ \\text{of}\\ ${T$(price)} = ${T$(t.tax)}`, `${T$(price)} + ${T$(t.tax)} = ${T$(t.total)}`] } satisfies TaxPicture,
    solution: [`${pH(rate)} of ${A($(price))} is ${B($(t.tax))}.`, `${100 + r}% lines up with ${$(price)} + ${$(t.tax)} = ${S($(t.total))}.`],
    c: t.total,
    wrongs: [
      { u: U(price + r * 100), mc: MC.numeral, say: `That adds ${r} dollars. The ${r}% is ${r}% of ${$(price)}: ${$(t.tax)}.` },
      { u: U(t.tax), mc: MC.changeFinal, say: `${$(t.tax)} is the tax, the ${r}% piece. ${100 + r}% is the whole price plus that piece.` },
      { u: U(price - t.tax), mc: MC.direction, say: `${100 + r}% is past 100%: more than ${$(price)}.` },
      { u: U(price + t.tax * 10), mc: MC.pointShift, say: `${r}% of ${$(price)} is ${$(t.tax)}, not ${$(t.tax * 10)}: one place off.` },
    ],
    right: `Yes: ${$(price)} + ${$(t.tax)} = ${$(t.total)}.`, hint: `Find ${r}% of ${$(price)} first, then add it.`,
  });
};

// =============== 4. tax-whole-rate ===============
const taxAmt: Gen = (R, n) => {
  const rate = WHOLE(R, 5, 10), C = pick(R, THINGS), price = exactPrice(R, rate, 20, 200, 0.3), t = salesTax(price, rate), p = rate / 1000;
  const route = taxRoute(price, rate);
  const oneP = R() < 0.35 && price % 100 === 0;
  return moneyItem({
    id: `taxAmt-${n}`, family: 'taxAmt',
    prompt: `${cap(C.a)} costs ${A($(price))} before tax. The sales tax is ${B(pH(rate))}.${oneP ? ` (1% of ${$(price)} is ${$c(price / 100)}.)` : ''} How much is the tax? ${NOCALC}`,
    board: `${pT(rate)}\\ \\text{of}\\ ${T$(price)}`,
    picture: { tape: { price, rate, item: C.tag, cells: 10, hide: { tax: true, total: true } }, solved: { price, rate, item: C.tag, cells: 10 }, pre: ['receipt', 'rPrice', 'tape', 'whole', 'cells'], post: ['tax', 'rTax'], pulse: ['tax'], work: route.tex } satisfies TaxPicture,
    solution: route.html,
    c: t.tax,
    wrongs: [
      { u: U(rate / 10), mc: MC.fixed, say: `${p}% is not $${p}. It is ${p} hundredths of the price: ${$c(t.tax)}.` },
      { u: U(price) * p, mc: MC.noDiv100, say: `That multiplies by ${p}. ${p}% is ${p} ÷ 100 = ${rateDec(rate)}.` },
      { u: U(price) * p / 10, mc: MC.pointShift, say: `The decimal point moved one place too few. ${p}% = ${rateDec(rate)}: ${$c(t.tax)}.` },
      { u: Math.round(U(price) / p), mc: MC.oneOverP, say: `${p}% is not one ${p === 5 ? 'fifth' : 'part in ' + p}. It is ${p} parts in 100.` },
      { u: U(t.total), say: `${$c(t.total)} is the total. The question asks for the tax alone.` },
    ],
    right: `Yes: ${pH(rate)} of ${$(price)} is ${$c(t.tax)}.`, hint: `Find 1% of ${$(price)} (divide by 100), then take ${p} of those.`,
  });
};

// =============== 5. total-two-step ===============
const totalPay: Gen = (R, n) => {
  const rate = R() < 0.1 ? 0 : WHOLE(R, 5, 10), C = pick(R, THINGS), price = exactPrice(R, Math.max(rate, 1000), 20, 200, 0.75);
  const t = salesTax(price, rate), p = rate / 1000;
  const route = rate ? taxRoute(price, rate) : { html: [`0% tax adds ${B('$0')}.`], tex: ['0\\% \\to \\$0'] };
  return moneyItem({
    id: `totalPay-${n}`, family: 'totalPay',
    prompt: `${cap(C.a)} is marked ${A($(price))}. The sales tax is ${B(pH(rate))}. What do you pay in total? ${NOCALC}`,
    board: `${T$(price)} + ${pT(rate)}\\ \\text{tax}`,
    picture: { tape: { price, rate, item: C.tag, hide: { tax: true, total: true } }, solved: { price, rate, item: C.tag }, pre: ['receipt', 'rPrice', 'tape', 'whole'], post: ['tax', 'rTax', 'total', 'rTotal', 'totalPct'], pulse: ['tax', 'total'], work: [...route.tex, `${usdTex(price)} + ${usdTex(t.tax)} = ${usdTex(t.total)}`] } satisfies TaxPicture,
    solution: [...route.html, `Add it: ${A($c(price))} + ${B($c(t.tax))} = ${S($c(t.total))}.`],
    c: t.total,
    wrongs: [
      { u: U(price + rate / 10), mc: MC.numeral, say: `That adds $${p}. The tax is ${p}% OF ${$(price)}: ${$c(t.tax)}.` },
      { u: U(t.tax), mc: MC.changeFinal, say: `${$c(t.tax)} is the tax. Add it to the price for the total.` },
      { u: U(price - t.tax), mc: MC.direction, say: 'Sales tax is added at the register, not taken off.' },
      { u: U(price), mc: MC.shelf, say: 'The marked price is before tax. The tax comes on top.' },
      { u: U(price + t.tax * 10), mc: MC.pointShift, say: `The tax is one place off: ${p}% of ${$(price)} is ${$c(t.tax)}, not ${$c(t.tax * 10)}.` },
      { u: U(price) * (1 + p), mc: MC.noDiv100, say: `That adds ${p} times the price. ${p}% is ${p} ÷ 100 = ${rateDec(rate)} of it.` },
    ],
    right: `Yes: ${$c(price)} + ${$c(t.tax)} = ${$c(t.total)}.`, hint: 'Two steps: find the tax, then add it to the price.',
  });
};
const planTotal: Gen = (R, n) => {
  const rate = WHOLE(R, 4, 10), price = int(R, 12, 180) * 100 + (R() < 0.5 ? pick(R, [50, 25, 75, 99]) : 0), p = rate / 1000;
  const C = pick(R, THINGS);
  return choiceItem(R, {
    id: `planTotal-${n}`, family: 'planTotal',
    prompt: `${cap(C.a)} is marked ${A($(price))}, with a ${B(pH(rate))} sales tax. Which plan gives what you pay? ${NOCALC}`,
    board: `${T$(price)} + ${pT(rate)}\\ \\text{tax} = \\ ?`,
    picture: { tape: { price, rate, item: C.tag }, pre: [], post: ['receipt', 'rPrice', 'tape', 'whole', 'tax', 'rTax', 'total', 'rTotal'], pulse: ['total'], work: [`\\text{tax} = ${pT(rate)}\\ \\text{of}\\ ${T$(price)}`, `\\text{total} = ${T$(price)} + \\text{tax}`] } satisfies TaxPicture,
    solution: [`Step 1: the tax is ${pH(rate)} of ${A($(price))}.`, `Step 2: add the tax to ${$(price)}: that is the ${S('total')}.`],
    opts: [
      { t: `Find ${pH(rate)} of ${$(price)}, then add it to ${$(price)}.`, ok: true, say: 'Yes: two steps, the tax and then the sum.' },
      { t: `Add $${p} to ${$(price)}.`, ok: false, mc: MC.numeral, say: `${pH(rate)} is not $${p}: it is a part of the price.` },
      { t: `Find ${pH(rate)} of ${$(price)}: that is what you pay.`, ok: false, mc: MC.changeFinal, say: 'That is only the tax. You pay the price AND the tax.' },
      { t: `Find ${pH(rate)} of ${$(price)}, then subtract it from ${$(price)}.`, ok: false, mc: MC.direction, say: 'Subtracting is for a discount. Sales tax is added.' },
    ],
  });
};

// =============== 6. extend-place-value ===============
const PLACE = ['ones', 'tenths', 'hundredths', 'thousandths', 'ten-thousandths', 'hundred-thousandths', 'millionths'];
const readDecimal: Gen = (R, n) => {
  let k = 0, num = 0;
  do { k = int(R, 3, 5); num = int(R, 1, 10 ** (k - 1) - 1); } while (String(num).length >= k || num % 10 === 0);
  const dec = decOf(num, k), wrongK = String(num).length;
  return choiceItem(R, {
    id: `readDecimal-${n}`, family: 'readDecimal',
    prompt: `Tax rates like 8.25% turn into decimals with many places. Read <b>${dec}</b> as a number of decimal units: ${dec} = ${num} ____. ${NOCALC}`,
    board: `${dec} = ${num}\\ \\square`,
    solution: [`${dec} has ${k} decimal places, zeros included.`, `So the last digit is in the ${PLACE[k]} place: ${dec} = ${num} ${PLACE[k]}.`],
    opts: [
      { t: PLACE[k]!, ok: true, say: `Yes: ${k} places after the point, so ${num} ${PLACE[k]}.` },
      { t: PLACE[wrongK]!, ok: false, mc: MC.placeUnit, say: `Count every place after the point, the zeros too: ${k} places means ${PLACE[k]}.` },
      { t: PLACE[k + 1]!, ok: false, say: `${dec} has ${k} places after the point, not ${k + 1}.` },
    ],
  });
};
const compareDec: Gen = (R, n) => {
  const shortH = int(R, 2, 9);                         // 0.0h
  const longGreater = R() < 0.35;
  const longN = longGreater ? shortH * 1000 + int(R, 1, 999) : (shortH - 1) * 1000 + int(R, 100, 999);
  const places = R() < 0.5 ? 5 : 4;
  const longV = places === 5 ? longN : Math.round(longN / 10);
  const L = decOf(longV, places), Sd = decOf(shortH, 2);
  if (L === Sd || longV % 10 === 0) return compareDec(R, n);
  const big = longGreater ? L : Sd;
  return choiceItem(R, {
    id: `compareDec-${n}`, family: 'compareDec',
    prompt: `Which decimal is greater: <b>${Sd}</b> or <b>${L}</b>? ${NOCALC}`,
    board: `${Sd}\\ \\ \\text{or}\\ \\ ${L}`,
    solution: [`Write both with ${places} places: ${Sd} = ${Sd}${'0'.repeat(places - 2)}.`, `Compare ${Sd}${'0'.repeat(places - 2)} with ${L}: ${big} is greater.`],
    opts: [
      { t: big, ok: true, say: `Yes: with the same number of places, ${big} is greater.` },
      { t: longGreater ? Sd : L, ok: false, mc: longGreater ? undefined : MC.longer, say: longGreater ? `Line them up: ${Sd}${'0'.repeat(places - 2)} is less than ${L}.` : `More digits does not mean more. ${Sd} = ${Sd}${'0'.repeat(places - 2)}, which is greater than ${L}.` },
      { t: 'They are equal', ok: false, say: 'Line up the places: the digits differ.' },
    ],
  });
};
const placeDigit: Gen = (R, n) => {
  let ds: number[] = [];
  do { ds = Array.from({ length: 6 }, () => int(R, 0, 9)); } while (new Set(ds.slice(0, 5)).size < 5 || ds[5] === 0);
  const w = int(R, 0, 12), shown = `${w}.${ds.join('')}`;
  const ask = pick(R, [2, 3, 3, 4] as const);
  return choiceItem(R, {
    id: `placeDigit-${n}`, family: 'placeDigit',
    prompt: `A calculator shows <b>${shown}</b>. Which digit is in the <b>${PLACE[ask]}</b> place? ${NOCALC}`,
    board: `${shown}`,
    solution: [`After the point: tenths, hundredths, thousandths, ten-thousandths, ...`, `The ${PLACE[ask]} digit is place ${ask} after the point: ${ds[ask - 1]}.`],
    opts: [
      { t: String(ds[ask - 1]), ok: true, say: `Yes: ${ds[ask - 1]} is ${ask} places after the point.` },
      { t: String(ds[ask - 2]), ok: false, say: `That digit is in the ${PLACE[ask - 1]} place. Count ${ask} places after the point.` },
      { t: String(ds[ask]), ok: false, say: `That digit is in the ${PLACE[ask + 1]} place. Count ${ask} places after the point.` },
    ],
  });
};

// =============== 7. convert-decimal-percent ===============
const CONVERT = [7500, 6250, 8250, 8875, 6000, 10000, 500, 4500, 9750, 7250, 5000, 2900, 6350, 8000, 4000, 1500, 9125, 3750];
const pctToDec: Gen = (R, n) => {
  const rate = pick(R, CONVERT), d = rate / M_WHOLE;
  return numItem({
    id: `pctToDec-${n}`, family: 'pctToDec',
    prompt: `Write the rate <b>${pH(rate)}</b> as a decimal. ${NOCALC}`,
    board: `${pT(rate)} = \\ ?`,
    solution: [`Percent means per 100: divide by 100.`, `${pct(rate)} ÷ 100 moves the point two places left: ${pH(rate)} = <b>${rateDec(rate)}</b>.`],
    v: d,
    wrongs: [
      { v: d * 10, mc: MC.pointShift, say: `The point moved only one place. Divide by 100: two places, ${rateDec(rate)}.` },
      { v: d * 100, mc: MC.noDiv100, say: `That is the percent number itself. ${pH(rate)} means ${pct(rate)} ÷ 100.` },
      { v: d / 10, say: `That moved the point three places. Divide by 100: two places.` },
    ],
    right: `Yes: ${pH(rate)} = ${rateDec(rate)}.`, hint: `Divide ${pct(rate)} by 100: move the point two places left.`,
  });
};
const decBetween: Gen = (R, n) => {
  const rate = int(R, 1, 9) * 1000 + pick(R, [250, 500, 750, 125, 375, 625, 875, 200, 400, 600, 800, 350, 650, 450, 150]);
  const lo = Math.floor(rate / 1000), hi = lo + 1;
  const D = (p: number, s = 0) => decOf(p, 2 + s);
  return choiceItem(R, {
    id: `decBetween-${n}`, family: 'decBetween',
    prompt: `${pH(rate)} lies between ${lo}% and ${hi}%. Its decimal lies between which two decimals? ${NOCALC}`,
    board: `${lo}\\% < ${pT(rate)} < ${hi}\\%`,
    solution: [`${lo}% = ${D(lo)} and ${hi}% = ${D(hi)}.`, `${pH(rate)} = ${rateDec(rate)}, and ${D(lo)} < ${rateDec(rate)} < ${D(hi)}.`],
    opts: [
      { t: `${D(lo)} and ${D(hi)}`, ok: true, say: `Yes: ${rateDec(rate)} is between ${D(lo)} and ${D(hi)}.` },
      { t: `${D(lo, -1)} and ${D(hi, -1)}`, ok: false, mc: MC.pointShift, say: `Those are ${lo * 10}% and ${hi * 10}%. ${lo}% is ${D(lo)}: two places.` },
      { t: `${D(lo, 1)} and ${D(hi, 1)}`, ok: false, say: `Those are tenths of a percent. ${lo}% is ${D(lo)}.` },
    ],
  });
};

// =============== 8. decimal-rate ===============
/** a decimal rate and a whole-dollar price with an exact-cent tax ($24 at 7.5%, $80 at 8.25%) */
function decCase(R: () => number): { rate: number; price: number } {
  const rate = pick(R, DEC_RATES.filter(m => m >= 4000));
  return { rate, price: exactPrice(R, rate, 16, 200, 0) };
}
const decTax: Gen = (R, n) => {
  const { rate, price } = decCase(R), C = pick(R, THINGS), t = salesTax(price, rate), d = rateDec(rate);
  return moneyItem({
    id: `decTax-${n}`, family: 'decTax',
    prompt: `${cap(C.a)} costs ${A($(price))} before tax. The sales tax is ${B(pH(rate))}. How much is the tax? Multiply by hand. ${NOCALC}`,
    board: `${d} \\times ${T$(price)}`,
    picture: { tape: { price, rate, item: C.tag, hide: { tax: true, total: true } }, solved: { price, rate, item: C.tag }, pre: ['receipt', 'rPrice', 'tape', 'whole'], post: ['tax', 'rTax'], pulse: ['tax'], work: [`${pT(rate)} = ${d}`, `${d} \\times ${T$(price)} = ${usdTex(t.tax)}`] } satisfies TaxPicture,
    solution: [`${pH(rate)} = ${d}.`, `${d} × ${price / 100} = ${digitsU(t.taxU, false)}: the tax is ${B($c(t.tax))}.`],
    c: t.tax,
    wrongs: [
      { u: t.taxU * 10, mc: MC.scale, say: `The point is one place off. ${d} has ${d.length - 2} decimal places: count them in the product.` },
      { u: t.taxU / 10, mc: MC.scale, say: `The point is one place off. Check: ${pH(rate)} of ${$(price)} is a bit under ${pct(rate - (rate % 1000) + 1000)}% of it.` },
      { u: t.taxU * 100, mc: MC.noDiv100, say: `That uses ${pct(rate)} instead of ${d}. Divide the percent by 100 first.` },
    ],
    right: `Yes: ${d} × ${price / 100} = ${digitsU(t.taxU, false)}.`, hint: `${pH(rate)} = ${d}. Multiply ${price / 100} × ${d}, then count the decimal places.`,
  });
};
const placePoint: Gen = (R, n) => {
  const { rate, price } = decCase(R), t = salesTax(price, rate), d = rateDec(rate);
  const dd = d.replace(/^0\.0*/, ''), dollars = price / 100;
  const digitProd = BigInt(dollars) * BigInt(dd);
  const opts: Choice[] = [
    { t: $c(t.tax), ok: true, say: `Yes: ${d} has ${d.length - 2} decimal places, so the product has ${d.length - 2} too.` },
    { t: $c(t.tax * 10), ok: false, mc: MC.scale, say: `One place off: ${pH(rate)} of ${$(price)} is less than 10% of it, ${$(price / 10)}.` },
    { t: usdU(t.taxU / 10), ok: false, mc: MC.scale, say: `One place off: ${pH(rate)} of ${$(price)} is more than 1% of it, ${$c(price / 100)}.` },
    { t: $c(t.tax * 100), ok: false, mc: MC.noDiv100, say: `That is ${dollars} × ${pct(rate)}: the percent was not divided by 100.` },
  ];
  return choiceItem(R, {
    id: `placePoint-${n}`, family: 'placePoint',
    prompt: `${dollars} × ${dd} = ${digitProd}. Use it to find ${B(pH(rate))} tax on ${A($(price))}: ${d} × ${dollars} = ? ${NOCALC}`,
    board: `${d} \\times ${dollars} = \\ ?`,
    solution: [`${d} has ${d.length - 2} decimal places; ${dollars} has none.`, `So ${digitProd} gets ${d.length - 2} decimal places: ${digitsU(t.taxU, false)}, the tax ${B($c(t.tax))}.`],
    opts,
  });
};

// =============== 9. round-to-cent ===============
function roundCase(R: () => number): { rate: number; price: number } {
  const half = R() < 0.3;
  for (let i = 0; i < 400; i++) {
    const rate = R() < 0.5 ? WHOLE(R, 4, 10) : decRate(R);
    const price = R() < 0.25 ? int(R, 8, 60) * 100 + pick(R, [50, 10, 30, 70, 90]) : shopPrice(R, 4, 90);
    const u = price * rate, rem = u % U_CENT;
    if (half ? rem === U_CENT / 2 : rem !== 0 && rem !== U_CENT / 2 && roundU(u) !== truncU(u)) return { rate, price };
  }
  return { rate: 7000, price: 1050 };
}
const roundTax: Gen = (R, n) => {
  const { rate, price } = roundCase(R), C = pick(R, THINGS), t = salesTax(price, rate);
  const early = salesTax(price, Math.round(rate / 1000) * 1000);
  return moneyItem({
    id: `roundTax-${n}`, family: 'roundTax',
    prompt: `${cap(C.a)} costs ${A($c(price))}. The sales tax is ${B(pH(rate))}. What tax goes on the receipt? ${CALC} ${RULE}`,
    board: `${rateDec(rate)} \\times ${usdTex(price)}`,
    picture: { tape: { price, rate, item: C.tag, exactTax: true, hide: { total: true } }, solved: { price, rate, item: C.tag }, pre: ['receipt', 'rPrice', 'tape', 'whole', 'tax'], post: ['rTax'], pulse: ['tax'], work: [`${rateDec(rate)} \\times ${usdTex(price)} = ${usdUTex(t.taxU)}`, `\\approx ${usdTex(t.tax)}`] } satisfies TaxPicture,
    solution: [`${rateDec(rate)} × ${$c(price)} = ${usdU(t.taxU)}.`, `Round once to the cent: ${B($c(t.tax))}${t.taxU % U_CENT === U_CENT / 2 ? ' (exactly half a cent rounds up)' : ''}.`],
    c: t.tax,
    wrongs: [
      { u: U(truncU(t.taxU)), mc: MC.trunc, say: `Cutting the digits off is not rounding. Look at the next digit: ${usdU(t.taxU)} rounds to ${$c(t.tax)}.` },
      { u: t.taxU, mc: MC.digits, say: `A receipt shows whole cents. Round ${usdU(t.taxU)} to the cent.` },
      ...(rate % 1000 ? [{ u: U(early.tax), mc: MC.early, say: `Keep the rate exact: ${pH(rate)} = ${rateDec(rate)}. Round only the tax, once, at the end.` }] : []),
    ],
    right: `Yes: ${usdU(t.taxU)} rounds to ${$c(t.tax)}.`, hint: `Multiply ${$c(price)} × ${rateDec(rate)}, then round to the nearest cent.`,
  });
};
const roundTotal: Gen = (R, n) => {
  const { rate, price } = roundCase(R), C = pick(R, THINGS), t = salesTax(price, rate);
  const early = salesTax(price, Math.round(rate / 1000) * 1000);
  return moneyItem({
    id: `roundTotal-${n}`, family: 'roundTotal',
    prompt: `${cap(C.a)} costs ${A($c(price))}, with ${B(pH(rate))} sales tax. What is the total on the receipt? ${CALC} ${RULE}`,
    board: `${usdTex(price)} + ${pT(rate)}\\ \\text{tax}`,
    picture: { tape: { price, rate, item: C.tag, hide: { tax: true, total: true } }, solved: { price, rate, item: C.tag }, pre: ['receipt', 'rPrice', 'tape', 'whole'], post: ['tax', 'rTax', 'total', 'rTotal'], pulse: ['tax', 'total'], work: [`${rateDec(rate)} \\times ${usdTex(price)} = ${usdUTex(t.taxU)} \\approx ${usdTex(t.tax)}`, `${usdTex(price)} + ${usdTex(t.tax)} = ${usdTex(t.total)}`] } satisfies TaxPicture,
    solution: [`The tax: ${rateDec(rate)} × ${$c(price)} = ${usdU(t.taxU)}, rounded once: ${B($c(t.tax))}.`, `The total: ${A($c(price))} + ${B($c(t.tax))} = ${S($c(t.total))}.`],
    c: t.total,
    wrongs: [
      { u: U(price) + t.taxU, mc: MC.digits, say: `A receipt shows whole cents. Round the tax to ${$c(t.tax)} first, then add.` },
      { u: U(price + truncU(t.taxU)), mc: MC.trunc, say: `The tax ${usdU(t.taxU)} rounds to ${$c(t.tax)}, not ${$c(truncU(t.taxU))}: look at the next digit.` },
      ...(rate % 1000 ? [{ u: U(early.total), mc: MC.early, say: `Keep the rate exact: ${pH(rate)} = ${rateDec(rate)}. Round only the tax.` }] : []),
      { u: U(t.tax), mc: MC.changeFinal, say: `${$c(t.tax)} is the tax. Add it to the price.` },
    ],
    right: `Yes: ${$c(price)} + ${$c(t.tax)} = ${$c(t.total)}.`, hint: 'Find the tax, round it once to the cent, then add it to the price.',
  });
};

// =============== 10. benchmark-check ===============
function benchFor(rate: number): [number, number] {
  if (rate % 1000) return [Math.floor(rate / 1000), Math.floor(rate / 1000) + 1];
  return rate > 5000 ? [5, 10] : rate === 5000 ? [1, 10] : [1, 5];
}
const benchCheck: Gen = (R, n) => {
  const rate = R() < 0.5 ? pick(R, [6000, 7000, 8000, 9000]) : pick(R, [8250, 7500, 6250, 8875, 6500, 9250]);
  const price = int(R, 8, 90) * 200, t = salesTax(price, rate), [lo, hi] = benchFor(rate);
  const kind = pick(R, ['ok', 'big', 'small'] as const), name = pick(R, NAMES), C = pick(R, THINGS);
  const shown = kind === 'ok' ? t.tax : kind === 'big' ? t.tax * 10 : Math.round(t.tax / 10);
  const L = salesTax(price, lo * 1000).tax, Hh = salesTax(price, hi * 1000).tax;
  const okTxt = kind === 'ok' ? `Yes: it is between ${$c(L)} (${lo}%) and ${$c(Hh)} (${hi}%).` : `No: the tax must be between ${$c(L)} (${lo}%) and ${$c(Hh)} (${hi}%).`;
  return choiceItem(R, {
    id: `benchCheck-${n}`, family: 'benchCheck',
    prompt: `${name}'s calculator says the ${B(pH(rate))} tax on ${A($c(price))} is <b>${$c(shown)}</b>. Is that reasonable? Pick the answer with the right check. ${NOCALC}`,
    board: `${pT(rate)}\\ \\text{of}\\ ${usdTex(price)} \\overset{?}{=} ${usdTex(shown)}`,
    picture: { tape: { price, rate, bench: [lo, hi], cells: 10, hide: { total: true } }, solved: { price, rate, bench: [lo, hi], cells: 10 }, pre: ['tape', 'whole', 'cells', 'bench'], post: ['tax'], pulse: ['tax'], work: [`${lo}\\% \\to ${usdTex(L)},\\ \\ ${hi}\\% \\to ${usdTex(Hh)}`, `${usdTex(L)} < \\text{tax} < ${usdTex(Hh)}`] } satisfies TaxPicture,
    solution: [`${pH(rate)} is between ${lo}% and ${hi}%, so the tax is between ${$c(L)} and ${$c(Hh)}.`, kind === 'ok' ? `${$c(shown)} is between them: reasonable.` : `${$c(shown)} is outside: ${kind === 'big' ? 'ten times too big' : 'ten times too small'}. The tax is ${B($c(t.tax))}.`],
    opts: [
      { t: okTxt, ok: true, say: kind === 'ok' ? 'Yes: a lower and an upper bound, and it fits between them.' : `Right: it is outside the bounds. The tax is ${$c(t.tax)}.` },
      { t: `Yes: it is less than ${$c(price)}.`, ok: false, mc: MC.oneSided, say: `Less than the price is only one side. Check both bounds: ${lo}% and ${hi}%.` },
      { t: 'Yes: the calculator did the work.', ok: false, mc: MC.calc, say: 'A calculator does what was typed. Check the result against benchmarks.' },
    ],
  });
};
const boundsPick: Gen = (R, n) => {
  const rate = R() < 0.5 ? pick(R, [6000, 7000, 8000, 9000]) : pick(R, [8250, 7500, 6250, 6500, 9250]);
  const price = int(R, 4, 90) * 200, [lo, hi] = benchFor(rate);
  const L = salesTax(price, lo * 1000).tax, Hh = salesTax(price, hi * 1000).tax;
  return choiceItem(R, {
    id: `boundsPick-${n}`, family: 'boundsPick',
    prompt: `Before computing a ${B(pH(rate))} tax on ${A($(price))}, bracket it. The tax must be between which two amounts? ${NOCALC}`,
    board: `${pT(rate)}\\ \\text{of}\\ ${T$(price)}`,
    picture: { tape: { price, rate, bench: [lo, hi], cells: 10, hide: { tax: true, total: true } }, solved: { price, rate, bench: [lo, hi], cells: 10 }, pre: ['tape', 'whole', 'cells'], post: ['bench', 'tax'], pulse: ['tax'], work: [`${lo}\\% \\to ${usdTex(L)},\\ \\ ${hi}\\% \\to ${usdTex(Hh)}`] } satisfies TaxPicture,
    solution: [`${pH(rate)} is between ${lo}% and ${hi}%.`, `${lo}% of ${$(price)} is ${$c(L)}; ${hi}% is ${$c(Hh)}.`],
    opts: [
      { t: `${$c(L)} (${lo}%) and ${$c(Hh)} (${hi}%)`, ok: true, say: `Yes: ${pH(rate)} is between ${lo}% and ${hi}%.` },
      { t: `$0 and ${$c(price)}`, ok: false, mc: MC.oneSided, say: 'True, but far too wide to catch a slip. Use benchmark percents on both sides.' },
      { t: `${$c(L * 10)} and ${$c(Hh * 10)}`, ok: false, say: `Those are ${lo * 10}% and ${hi * 10}%. ${lo}% of ${$(price)} is ${$c(L)}.` },
      { t: `${usdU(U(L) / 10)} and ${usdU(U(Hh) / 10)}`, ok: false, say: `Those are tenths of ${lo}% and ${hi}%. ${lo}% of ${$(price)} is ${$c(L)}.` },
    ],
  });
};

// =============== 11. taxable-subtotal ===============
function cart(R: () => number): { items: { name: string; cents: number; exempt?: boolean }[]; taxable: number; all: number; nTax: number } {
  const k = int(R, 2, 4), nEx = R() < 0.2 ? 0 : int(R, 1, k - 1);
  const ex = shuffle(R, GROCERY.slice()).slice(0, nEx), tx = shuffle(R, TAXABLE.slice()).slice(0, k - nEx);
  const items: { name: string; cents: number; exempt?: boolean }[] = shuffle(R, [...ex.map(name => ({ name, cents: shopPrice(R, 1, 9), exempt: true })), ...tx.map(name => ({ name, cents: shopPrice(R, 1, 24), exempt: false }))]);
  const taxable = items.filter(i => !i.exempt).reduce((s, i) => s + i.cents, 0);
  return { items, taxable, all: items.reduce((s, i) => s + i.cents, 0), nTax: k - nEx };
}
const exemptCart: Gen = (R, n) => {
  const rate = R() < 0.5 ? WHOLE(R, 4, 10) : decRate(R), { items, taxable, all, nTax } = cart(R), t = salesTax(taxable, rate);
  const askTotal = R() < 0.5, allT = salesTax(all, rate);
  const list = items.map(i => `${i.name} ${$c(i.cents)}${i.exempt ? ' (food: no tax)' : ''}`).join(', ');
  const perItemU = U(nTax * rate / 10);
  const c = askTotal ? all + t.tax : t.tax;
  return moneyItem({
    id: `exemptCart-${n}`, family: 'exemptCart',
    prompt: `A cart: ${list}. The sales tax is ${B(pH(rate))}${items.some(i => i.exempt) ? ', and food is tax-exempt' : ''}. ${askTotal ? 'What is the total?' : 'How much is the tax?'} ${CALC} ${RULE}`,
    board: `${pT(rate)}\\ \\text{of}\\ ${usdTex(taxable)}`,
    picture: { tape: { price: taxable, rate, items, tape: items.length <= 2, hide: { tax: true, total: true } }, solved: { price: taxable, rate, items, tape: items.length <= 2 }, pre: ['receipt', 'rPrice', 'tape', 'whole'], post: ['tax', 'rTax', 'total', 'rTotal', 'totalPct'], pulse: ['tax', ...(askTotal ? ['total' as const] : [])], work: [`\\text{taxable} = ${usdTex(taxable)}`, `${rateDec(rate)} \\times ${usdTex(taxable)} \\approx ${usdTex(t.tax)}`, ...(askTotal ? [`${usdTex(all)} + ${usdTex(t.tax)} = ${usdTex(all + t.tax)}`] : [])] } satisfies TaxPicture,
    solution: [`Add the taxable items only: ${A($c(taxable))}.`, `Tax: ${rateDec(rate)} × ${$c(taxable)} = ${usdU(t.taxU)}, rounded once: ${B($c(t.tax))}.`, ...(askTotal ? [`Total: ${$c(all)} + ${$c(t.tax)} = ${S($c(all + t.tax))}.`] : [])],
    c,
    wrongs: [
      { u: U(askTotal ? all + allT.tax : allT.tax), mc: MC.exempt, say: 'The food items are tax-exempt. Tax only the taxable items.' },
      { u: askTotal ? U(all) + perItemU : perItemU, mc: MC.perItem, say: `${pH(rate)} is not $${pct(rate)} per item. It is ${pH(rate)} of the taxable subtotal.` },
      ...(askTotal ? [{ u: U(t.tax), mc: MC.changeFinal, say: 'That is the tax. Add it to the whole cart.' }, { u: U(taxable + t.tax), say: 'The food still costs money: add every item, then the tax.' }] : []),
    ],
    right: askTotal ? `Yes: ${$c(all)} + ${$c(t.tax)} = ${$c(all + t.tax)}.` : `Yes: ${pH(rate)} of ${$c(taxable)} is ${$c(t.tax)}.`,
    hint: 'Add the taxable items, take the tax on that subtotal, and round once.',
  });
};
const taxableBase: Gen = (R, n) => {
  let cc = cart(R);
  while (cc.taxable === cc.all) cc = cart(R);
  const rate = R() < 0.6 ? WHOLE(R, 4, 10) : decRate(R), { items, taxable, all } = cc;
  const list = items.map(i => `${i.name} ${$c(i.cents)}${i.exempt ? ' (food: no tax)' : ''}`).join(', ');
  return choiceItem(R, {
    id: `taxableBase-${n}`, family: 'taxableBase',
    prompt: `A cart: ${list}. The sales tax is ${pH(rate)} and food is tax-exempt. The ${pH(rate)} is taken of which amount? ${NOCALC}`,
    board: `${pT(rate)}\\ \\text{of}\\ \\ ?`,
    picture: { tape: { price: taxable, rate, items, tape: items.length <= 2 }, pre: [], post: ['receipt', 'rPrice', 'tape', 'whole', 'tax', 'rTax', 'rTotal'], pulse: ['price'], work: [`\\text{taxable} = ${usdTex(taxable)}`] } satisfies TaxPicture,
    solution: ['Exempt items are not taxed.', `Add the taxable items: ${A($c(taxable))}. The ${pH(rate)} is of that subtotal.`],
    opts: [
      { t: `${$c(taxable)}, the taxable items`, ok: true, say: 'Yes: only the taxable items, added together.' },
      { t: `${$c(all)}, everything in the cart`, ok: false, mc: MC.exempt, say: 'The food is tax-exempt: leave it out of the taxed amount.' },
      { t: `None: add $${pct(rate)} for each taxable item`, ok: false, mc: MC.perItem, say: `A ${pH(rate)} rate is a percent of the price, not $${pct(rate)} per item.` },
    ],
  });
};

// =============== 12. rate-from-receipt ===============
const findRate: Gen = (R, n) => {
  const rate = R() < 0.55 ? WHOLE(R, 3, 10) : decRate(R), C = pick(R, THINGS);
  const price = rate % 1000 ? exactPrice(R, rate, 16, 200, 0.5) : exactPrice(R, rate, 20, 300, 0.5), t = salesTax(price, rate);
  const viaTotal = R() < 0.45;
  const r = rate / 1000;
  return numItem({
    id: `findRate-${n}`, family: 'findRate', unit: '%',
    prompt: viaTotal
      ? `A receipt for ${C.a}: price ${A($c(price))}, total ${S($c(t.total))}. The tax was exact. What is the local tax rate? ${rate % 1000 ? CALC : NOCALC}`
      : `A receipt for ${C.a}: price ${A($c(price))}, tax ${B($c(t.tax))}. The tax was exact. What is the tax rate? ${rate % 1000 ? CALC : NOCALC}`,
    board: viaTotal ? `(${usdTex(t.total)} - ${usdTex(price)}) \\div ${usdTex(price)}` : `${usdTex(t.tax)} \\div ${usdTex(price)}`,
    picture: { tape: { price, rate, item: C.tag, hide: { rate: true, ...(viaTotal ? { tax: true } : { total: true }) } }, solved: { price, rate, item: C.tag }, pre: ['receipt', 'rPrice', viaTotal ? 'rTotal' : 'rTax', 'tape', 'whole', 'tax', 'total'], post: ['rTax', 'rTotal', 'totalPct'], pulse: ['tax', 'price'], work: [...(viaTotal ? [`${usdTex(t.total)} - ${usdTex(price)} = ${usdTex(t.tax)}`] : []), `${usdTex(t.tax)} \\div ${usdTex(price)} = ${rateDec(rate)} = ${pT(rate)}`] } satisfies TaxPicture,
    solution: [...(viaTotal ? [`The tax: ${$c(t.total)} − ${$c(price)} = ${B($c(t.tax))}.`] : []), `Rate = tax ÷ pre-tax price: ${$c(t.tax)} ÷ ${$c(price)} = ${rateDec(rate)} = <b>${pH(rate)}</b>.`],
    v: r,
    wrongs: [
      { v: (t.tax / t.total) * 100, tol: 0.005, mc: MC.newBase, say: `That divides by the total. The rate is a percent of the PRE-tax price: divide by ${$c(price)}.` },
      { v: (t.total / price) * 100, tol: 1e-6, say: `That is the total as a percent of the price: ${pct(M_WHOLE + rate)}%. The tax alone is the part over 100%.` },
      { v: t.tax / 100, mc: MC.fixed, say: `${$c(t.tax)} is dollars, not a percent. Divide it by the price.` },
      { v: r / 100, say: `${rateDec(rate)} is the decimal. As a percent it is ${pH(rate)}.` },
    ],
    right: `Yes: ${$c(t.tax)} ÷ ${$c(price)} = ${rateDec(rate)}, so ${pH(rate)}.`, hint: 'Rate = tax ÷ pre-tax price. Then write the decimal as a percent.',
  });
};

// =============== 13. price-from-tax ===============
const priceFromTaxG: Gen = (R, n) => {
  const late = R() < 0.45;
  const rate = late ? (R() < 0.5 ? decRate(R) : WHOLE(R, 4, 10)) : WHOLE(R, 4, 10), C = pick(R, THINGS);
  const price = late ? exactPrice(R, rate, 12, 160, 0.8) : exactPrice(R, rate, 10, 200, 0), t = salesTax(price, rate), d = rateDec(rate);
  return moneyItem({
    id: `priceFromTax-${n}`, family: 'priceFromTax',
    prompt: `The receipt for ${C.a} shows ${B(`${$c(t.tax)} of tax`)} at ${B(pH(rate))}. The tax was exact. What was the pre-tax price? ${rate % 1000 ? CALC : NOCALC}`,
    board: `${d} \\times \\$\\,? = ${usdTex(t.tax)}`,
    picture: { tape: { price, rate, item: C.tag, hide: { price: true, total: true } }, solved: { price, rate, item: C.tag }, pre: ['receipt', 'rTax', 'tape', 'whole', 'tax'], post: ['rPrice', 'rTotal', 'total'], pulse: ['price'], work: [`${pT(rate)} \\to ${usdTex(t.tax)}`, `${usdTex(t.tax)} \\div ${d} = ${usdTex(price)}`] } satisfies TaxPicture,
    solution: [`The tax is ${pH(rate)} OF the price: ${d} × price = ${B($c(t.tax))}.`, `Undo the multiply: ${$c(t.tax)} ÷ ${d} = ${A($c(price))}. Check: ${pH(rate)} of ${$c(price)} is ${$c(t.tax)}.`],
    c: price,
    wrongs: [
      { u: Math.round(t.tax * rate), mc: MC.multNotDiv, say: `That multiplies by the rate again. The tax is the part; the price is the whole: divide by ${d}.` },
      { u: U(t.tax) * 1000 / rate, say: `Dividing by ${pct(rate)} uses the percent number. Divide by the decimal ${d}.` },
      { u: U(t.tax), say: `${$c(t.tax)} is the tax, the small part. The price is the whole.` },
    ],
    right: `Yes: ${$c(t.tax)} ÷ ${d} = ${$c(price)}.`, hint: `The tax is ${d} × the price. Divide the tax by ${d}.`,
  });
};

// =============== 14. total-multiplier ===============
/** "1." followed by the percent digits (8% -> 1.8, 7.5% -> 1.75, 10% -> 1.10) */
const appended = (rate: number) => Number('1.' + pct(rate).replace('.', ''));
const multiplier: Gen = (R, n) => {
  const rate = R() < 0.5 ? WHOLE(R, 3, 10) : decRate(R), d = rate / M_WHOLE;
  return numItem({
    id: `multiplier-${n}`, family: 'multiplier',
    prompt: `With a ${B(pH(rate) + ' tax')}, total = <b>?</b> × pre-tax price. What is the multiplier? ${rate % 1000 ? CALC : NOCALC}`,
    board: `\\text{total} = \\ ? \\times \\text{price}`,
    picture: { tape: { price: 10000, rate, hide: { price: true, total: true, totalPct: true } }, solved: { price: 10000, rate }, pre: ['tape', 'whole', 'tax', 'total'], post: ['totalPct'], pulse: ['total'], work: [`100\\% + ${pT(rate)} = ${pct(M_WHOLE + rate)}\\%`, `= ${multDec(rate)}`] } satisfies TaxPicture,
    solution: [`The total is 100% of the price plus ${pH(rate)}: ${pct(M_WHOLE + rate)}%.`, `As a decimal: <b>${multDec(rate)}</b> = 1 + ${rateDec(rate)}.`],
    v: 1 + d,
    wrongs: [
      { v: d, mc: MC.changeFinal, say: `${rateDec(rate)} × the price is just the tax. The total also keeps the price: 1 + ${rateDec(rate)}.` },
      { v: appended(rate), mc: MC.append, say: `${pH(rate)} is ${rateDec(rate)}, so the multiplier is 1 + ${rateDec(rate)} = ${multDec(rate)}, not ${appended(rate)}.` },
      { v: 1 - d, mc: MC.direction, say: 'Tax makes the total bigger: the multiplier is more than 1.' },
      { v: 1 + d * 100, mc: MC.noDiv100, say: `Divide the percent by 100 first: ${pH(rate)} = ${rateDec(rate)}.` },
      { v: (1 + d) / 10, mc: MC.lessThanOne, say: `A multiplier can be more than 1: the total is more than the price. ${pct(M_WHOLE + rate)}% = ${multDec(rate)}.` },
      { v: 100 + d * 100, mc: MC.noDiv100, say: `That is the percent, ${pct(M_WHOLE + rate)}%. As a multiplier, divide by 100.` },
    ],
    right: `Yes: 1 + ${rateDec(rate)} = ${multDec(rate)}.`, hint: '100% + the rate, written as a decimal.',
  });
};
const multExpr: Gen = (R, n) => {
  const rate = R() < 0.5 ? WHOLE(R, 3, 9) : decRate(R), v = pick(R, ['B', 'p', 'x', 'P']);
  const opts: Choice[] = [
    { t: `${multDec(rate)}${v}`, ok: true, say: `Yes: ${v} + ${rateDec(rate)}${v} = (1 + ${rateDec(rate)})${v} = ${multDec(rate)}${v}.` },
    { t: `${rateDec(rate)}${v}`, ok: false, mc: MC.changeFinal, say: `${rateDec(rate)}${v} is the tax alone. The total keeps the price too.` },
    { t: `${v} + ${pct(rate)}`, ok: false, mc: MC.numeral, say: `That adds ${pct(rate)} dollars. The tax is ${pH(rate)} OF ${v}: ${rateDec(rate)}${v}.` },
    { t: `${appended(rate)}${v}`, ok: false, mc: MC.append, say: `${pH(rate)} = ${rateDec(rate)}, so the multiplier is 1 + ${rateDec(rate)} = ${multDec(rate)}.` },
    { t: `${decOf(M_WHOLE - rate, 5)}${v}`, ok: false, mc: MC.direction, say: 'That takes the tax off. Tax is added: more than 1 times the price.' },
    { t: `${decOf(M_WHOLE + rate, 6)}${v}`, ok: false, mc: MC.lessThanOne, say: `That is about a tenth of ${v}. A multiplier can be more than 1: ${pct(M_WHOLE + rate)}% = ${multDec(rate)}.` },
  ];
  return choiceItem(R, {
    id: `multExpr-${n}`, family: 'multExpr',
    prompt: `The pre-tax price is <b>${v}</b> dollars and the sales tax is ${B(pH(rate))}. Which expression is the total? ${NOCALC}`,
    board: `${v} + ${rateDec(rate)}${v} = \\ ?`,
    solution: [`Total = price + tax = ${v} + ${rateDec(rate)}${v}.`, `${v} is 1${v}, so ${v} + ${rateDec(rate)}${v} = (1 + ${rateDec(rate)})${v} = <b>${multDec(rate)}${v}</b>.`],
    opts: opts.slice(0, 1).concat(shuffle(R, opts.slice(1)).slice(0, 3)),
  });
};
const oneStepTotal: Gen = (R, n) => {
  const rate = R() < 0.5 ? WHOLE(R, 4, 10) : decRate(R), C = pick(R, THINGS);
  const price = exactPrice(R, rate, 10, 200, 0.3), t = salesTax(price, rate), m = multDec(rate);
  const ap = appended(rate);
  return moneyItem({
    id: `oneStepTotal-${n}`, family: 'oneStepTotal',
    prompt: `${cap(C.a)} costs ${A($(price))} before a ${B(pH(rate))} tax. Find the total in ONE multiplication. ${rate % 1000 ? CALC : NOCALC}`,
    board: `${m} \\times ${T$(price)}`,
    picture: { tape: { price, rate, item: C.tag, hide: { tax: true, total: true } }, solved: { price, rate, item: C.tag }, pre: ['receipt', 'rPrice', 'tape', 'whole'], post: ['tax', 'total', 'totalPct', 'rTax', 'rTotal'], pulse: ['total'], work: [`100\\% + ${pT(rate)} = ${pct(M_WHOLE + rate)}\\%`, `${m} \\times ${T$(price)} = ${usdTex(t.total)}`] } satisfies TaxPicture,
    solution: [`The total is ${pct(M_WHOLE + rate)}% of the price: the multiplier is ${m}.`, `${m} × ${$(price)} = ${S($c(t.total))}. (Two steps agree: ${$(price)} + ${$c(t.tax)}.)`],
    c: t.total,
    wrongs: [
      { u: t.taxU, mc: MC.changeFinal, say: `${rateDec(rate)} × ${$(price)} is only the tax. Use 1 + ${rateDec(rate)} = ${m}.` },
      ...(Math.abs(ap - (1 + rate / M_WHOLE)) > 1e-9 ? [{ u: Math.round(U(price) * ap), mc: MC.append, say: `The multiplier is 1 + ${rateDec(rate)} = ${m}, not ${ap}.` }] : []),
      { u: U(price + rate / 10), mc: MC.numeral, say: `That adds ${pct(rate)} dollars. Multiply by ${m} instead.` },
    ],
    right: `Yes: ${m} × ${$(price)} = ${$c(t.total)}.`, hint: `The total is 100% + ${pH(rate)} of the price: multiply by ${m}.`,
  });
};

// =============== 15. price-from-total ===============
function totalCase(R: () => number): { rate: number; price: number } {
  if (R() < 0.55) { const rate = WHOLE(R, 2, 10); return { rate, price: exactPrice(R, rate, 10, 150, 0) }; }
  const rate = R() < 0.5 ? decRate(R) : WHOLE(R, 3, 10);
  return { rate, price: exactPrice(R, rate, 10, 150, 0.85) };
}
const priceFromTotalG: Gen = (R, n) => {
  const { rate, price } = totalCase(R), t = salesTax(price, rate), m = multDec(rate), C = pick(R, THINGS);
  const torn = R() < 0.5;
  const oppU = U(t.total) - t.total * rate;          // total - r% of the total
  return moneyItem({
    id: `priceFromTotal-${n}`, family: 'priceFromTotal',
    prompt: torn
      ? `A torn receipt for ${C.a} still shows the total, ${S($c(t.total))}, with ${B(pH(rate))} tax (exact). What was the pre-tax price? ${price % 100 || rate % 1000 ? CALC : NOCALC}`
      : `You paid ${S($c(t.total))} for ${C.a}, including ${B(pH(rate))} sales tax (exact). What was the shelf price? ${price % 100 || rate % 1000 ? CALC : NOCALC}`,
    board: `${m} \\times \\$\\,? = ${usdTex(t.total)}`,
    picture: { tape: { price, rate, item: C.tag, hide: { price: true, tax: true } }, solved: { price, rate, item: C.tag }, pre: ['receipt', 'rTotal', 'tape', 'whole', 'tax', 'total', 'totalPct'], post: ['rPrice', 'rTax'], pulse: ['price'], work: [`${usdTex(t.total)} = ${pct(M_WHOLE + rate)}\\%\\ \\text{of the price}`, `${usdTex(t.total)} \\div ${m} = ${usdTex(price)}`] } satisfies TaxPicture,
    solution: [`The total is ${pct(M_WHOLE + rate)}% of the pre-tax price: ${m} × price = ${S($c(t.total))}.`, `Undo it: ${$c(t.total)} ÷ ${m} = ${A($c(price))}. Check: ${$c(price)} + ${$c(t.tax)} = ${$c(t.total)}.`],
    c: price,
    wrongs: [
      { u: Math.round(U(t.total) * M_WHOLE / rate), mc: MC.divRate, say: `Dividing by ${rateDec(rate)} gives a huge price. The total is ${m} times the price: divide by ${m}.` },
      { u: oppU, mc: MC.opposite, say: `${pH(rate)} of the TOTAL is more than the tax: the tax was ${pH(rate)} of the smaller pre-tax price. Divide by ${m}.` },
      { u: U(t.total - rate / 10), mc: MC.numeral, say: `${pH(rate)} is not $${pct(rate)}. Divide the total by ${m}.` },
      { u: Math.round(U(t.total) * (M_WHOLE + rate) / M_WHOLE), mc: MC.multNotDiv, say: `That adds the tax again. Going back, divide by ${m}.` },
    ],
    right: `Yes: ${$c(t.total)} ÷ ${m} = ${$c(price)}.`, hint: `The total is ${m} × the price. Divide the total by ${m}, then check forward.`,
  });
};
const whichDivision: Gen = (R, n) => {
  const { rate, price } = totalCase(R), t = salesTax(price, rate), m = multDec(rate), d = rateDec(rate), T = $c(t.total);
  return choiceItem(R, {
    id: `whichDivision-${n}`, family: 'whichDivision',
    prompt: `A total of ${S(T)} includes a ${B(pH(rate))} sales tax. Which calculation gives the pre-tax price? ${NOCALC}`,
    board: `${usdTex(t.total)} \\to \\$\\,?`,
    picture: { tape: { price, rate, hide: { price: true, tax: true } }, solved: { price, rate }, pre: ['tape', 'whole', 'tax', 'total', 'totalPct'], post: [], pulse: ['price'], work: [`${usdTex(t.total)} \\div ${m} = ${usdTex(price)}`] } satisfies TaxPicture,
    solution: [`The total is ${pct(M_WHOLE + rate)}% of the pre-tax price.`, `So the price is ${T} ÷ ${m} = ${A($c(price))}.`],
    opts: [
      { t: `${T} ÷ ${m}`, ok: true, say: `Yes: the total is ${m} times the price.` },
      { t: `${T} ÷ ${d}`, ok: false, mc: MC.divRate, say: `${d} × the price is only the tax. The total is ${m} × the price.` },
      { t: `${T} − ${d} × ${T}`, ok: false, mc: MC.opposite, say: `${pH(rate)} of the total is more than the tax: the tax was ${pH(rate)} of the smaller price.` },
      { t: `${T} − $${pct(rate)}`, ok: false, mc: MC.numeral, say: `${pH(rate)} is not $${pct(rate)}.` },
    ],
  });
};

// =============== 16. explain-subtract-fails ===============
const subtractFails: Gen = (R, n) => {
  const rate = WHOLE(R, 4, 10), base = rate === 8000 || rate === 4000 ? 2500 : rate % 5000 === 0 ? 2000 : 10000;
  const price = base * (base === 10000 ? int(R, 1, 6) : int(R, 2, 12));
  const t = salesTax(price, rate), name = pick(R, NAMES);
  const wrongTaxU = t.total * rate, ana = U(t.total) - wrongTaxU;
  return choiceItem(R, {
    id: `subtractFails-${n}`, family: 'subtractFails',
    prompt: `The total was ${S($c(t.total))} with ${B(pH(rate))} tax. ${name} takes ${pH(rate)} of ${$c(t.total)} off: ${$c(t.total)} − ${usdU(wrongTaxU)} = ${usdU(ana)}, "the pre-tax price". What went wrong? ${NOCALC}`,
    board: `${usdTex(t.total)} - ${pT(rate)}\\ \\text{of}\\ ${usdTex(t.total)} \\overset{?}{=} \\text{price}`,
    picture: { tape: { price, rate, cells: 10, rebase: true }, pre: [], post: ['tape', 'whole', 'cells', 'tax', 'total', 'totalPct', 'rebase'], pulse: ['tax'], work: [`${pT(rate)}\\ \\text{of}\\ ${usdTex(price)} = ${usdTex(t.tax)}`, `${pT(rate)}\\ \\text{of}\\ ${usdTex(t.total)} = ${usdUTex(wrongTaxU)}`] } satisfies TaxPicture,
    solution: [`The tax was ${pH(rate)} of the pre-tax price ${A($c(price))}: ${B($c(t.tax))}.`, `${pH(rate)} of ${$c(t.total)} is ${usdU(wrongTaxU)}: a bigger whole gives a bigger ${pH(rate)}. So ${name} took off too much.`],
    opts: [
      { t: `${pH(rate)} of ${$c(t.total)} is more than the tax: the total is a bigger whole.`, ok: true, say: 'Yes: the whole changed. Undo the tax by dividing by the multiplier.' },
      { t: `Nothing: +${pH(rate)} and −${pH(rate)} cancel.`, ok: false, mc: MC.successive, say: `They do not cancel: the ${pH(rate)} taken off is of a bigger whole. Try ${$c(price)}: it ends at ${usdU(ana)}.` },
      { t: `${name} should take $${pct(rate)} off instead.`, ok: false, mc: MC.numeral, say: `${pH(rate)} is not $${pct(rate)}. The tax here was ${$c(t.tax)}.` },
      { t: `Divide ${$c(t.total)} by ${rateDec(rate)} instead.`, ok: false, mc: MC.divRate, say: `That gives a huge price. Divide by ${multDec(rate)}, the total multiplier.` },
    ],
  });
};
const testNumber: Gen = (R, n) => {
  const rate = WHOLE(R, 4, 10), price = int(R, 1, 9) * 10000, t = salesTax(price, rate);
  const back = U(t.total) - t.total * rate;
  return moneyItem({
    id: `testNumber-${n}`, family: 'testNumber',
    prompt: `Test the idea "take ${pH(rate)} of the total off to undo a ${pH(rate)} tax". A ${A($(price))} price with ${B(pH(rate))} tax makes ${S($(t.total))}. Now take ${pH(rate)} of ${$(t.total)} off. What do you get? ${NOCALC}`,
    board: `${T$(t.total)} - ${pT(rate)}\\ \\text{of}\\ ${T$(t.total)}`,
    picture: { tape: { price, rate, cells: 10, rebase: true }, pre: ['tape', 'whole', 'cells', 'tax', 'total', 'totalPct'], post: ['rebase'], pulse: ['total'], work: [`${pT(rate)}\\ \\text{of}\\ ${T$(t.total)} = ${usdUTex(t.total * rate)}`, `${T$(t.total)} - ${usdUTex(t.total * rate)} = ${usdUTex(back)}`] } satisfies TaxPicture,
    solution: [`${pH(rate)} of ${$(t.total)} is ${usdU(t.total * rate)}, more than the ${$(t.tax)} tax.`, `${$(t.total)} − ${usdU(t.total * rate)} = ${usdU(back)}: not back to ${A($(price))}.`],
    c: Math.round(back / U_CENT),
    wrongs: [
      { u: U(price), mc: MC.successive, say: `That is what you might expect, but do the arithmetic: ${pH(rate)} of ${$(t.total)} is ${usdU(t.total * rate)}, not ${$(t.tax)}.` },
      { u: t.total * rate, say: `${usdU(t.total * rate)} is ${pH(rate)} of the total. Now subtract it.` },
    ],
    right: `Yes: ${usdU(back)}, not ${$(price)}. Taking ${pH(rate)} of the total off goes too far.`, hint: `First find ${pH(rate)} of ${$(t.total)}, then subtract it from ${$(t.total)}.`,
  });
};

// =============== 17. rounded-receipt-check ===============
const roundedTotal: Gen = (R, n) => {
  let rate = 0, price = 0, T = 0;
  for (let i = 0; i < 200; i++) {
    rate = R() < 0.6 ? decRate(R) : WHOLE(R, 4, 10); price = shopPrice(R, 5, 80); T = totalOf(price, rate);
    if (price * rate % U_CENT !== 0) break;
  }
  const m = multDec(rate), qU = Math.floor((T * M_WHOLE * U_CENT) / (M_WHOLE + rate)) * 1;
  const qTxt = `${digitsU(qU, true).slice(0, digitsU(qU, true).indexOf('.') + 5)}...`;
  const lo = totalOf(price - 1, rate), hi = totalOf(price + 1, rate);
  return choiceItem(R, {
    id: `roundedTotal-${n}`, family: 'roundedTotal',
    prompt: `A receipt total is ${S($c(T))} with ${B(pH(rate))} tax, rounded to the cent. ${$c(T)} ÷ ${m} = ${qTxt}. What can you say about the pre-tax price? ${CALC} ${RULE}`,
    board: `${usdTex(T)} \\div ${m} = ${qTxt.replace('...', '\\ldots')}`,
    picture: { tape: { price, rate, hide: { price: true, tax: true } }, solved: { price, rate }, pre: ['tape', 'whole', 'tax', 'total', 'totalPct'], post: [], pulse: ['price', 'total'], work: [`${usdTex(price - 1)} \\to ${usdTex(lo)}`, `${usdTex(price)} \\to ${usdTex(T)}\\ \\checkmark`, `${usdTex(price + 1)} \\to ${usdTex(hi)}`] } satisfies TaxPicture,
    solution: [`The quotient is a candidate: ${A($c(price))}. Check it forward: tax ${$c(taxOf(price, rate))}, total ${$c(T)}.`, `Check the neighbors: ${$c(price - 1)} gives ${$c(lo)} and ${$c(price + 1)} gives ${$c(hi)}. So ${$c(price)} is the only price.`],
    opts: [
      { t: `Only ${$c(price)}: ${$c(price - 1)} gives ${$c(lo)}, ${$c(price + 1)} gives ${$c(hi)}`, ok: true, say: 'Yes: a candidate, checked forward, and both neighbors checked too.' },
      { t: `${$c(price)} gives ${$c(T)}; no need to check others`, ok: false, mc: MC.complete, say: 'One price that works does not rule out others. Check the neighboring cents too.' },
      { t: `Exactly the quotient, ${qTxt}`, ok: false, mc: MC.roundedExact, say: 'The total was rounded, so the quotient is not exact. A price is a whole number of cents: test candidates.' },
    ],
  });
};
const roundedTaxRange: Gen = (R, n) => {
  let rate = 0, q = 0, tax = 0, rng: [number, number] | null = null;
  for (let i = 0; i < 300; i++) {
    rate = R() < 0.6 ? WHOLE(R, 4, 10) : pick(R, [7500, 6250, 8250, 5500]);
    q = exactPrice(R, rate, 10, 120, 0.4); tax = taxOf(q, rate); rng = pricesForTax(tax, rate);
    if (rng && rng[1] - rng[0] >= 3 && q > rng[0] && q < rng[1]) break;
  }
  const [lo, hi] = rng!, d = rateDec(rate);
  return choiceItem(R, {
    id: `roundedTaxRange-${n}`, family: 'roundedTaxRange',
    prompt: `A receipt shows ${B(`${$c(tax)} of tax`)} at ${B(pH(rate))}, rounded to the cent. ${$c(tax)} ÷ ${d} = ${$c(q)}. Which prices could it be? ${CALC} ${RULE}`,
    board: `${usdTex(tax)} \\div ${d} = ${usdTex(q)}`,
    solution: [`${$c(q)} is only a candidate.`, `Step out: ${$c(lo - 1)} gives ${$c(taxOf(lo - 1, rate))} and ${$c(hi + 1)} gives ${$c(taxOf(hi + 1, rate))}. So every price from ${A($c(lo))} to ${A($c(hi))} fits.`],
    opts: [
      { t: `${$c(lo)} to ${$c(hi)}: ${$c(lo - 1)} and ${$c(hi + 1)} fail`, ok: true, say: 'Yes: you stepped out on both sides until a price failed.' },
      { t: `Only ${$c(q)}`, ok: false, mc: MC.roundedExact, say: `The tax was rounded, so it is not exact. ${$c(q + 1)} also gives ${$c(taxOf(q + 1, rate))}.` },
      { t: `${$c(q)} and ${$c(q + 1)}, both checked`, ok: false, mc: MC.complete, say: 'Two prices that work do not prove there are no more. Step out until a price fails, on both sides.' },
      { t: `${$c(lo + 1)} to ${$c(hi - 1)}`, ok: false, say: `${$c(lo)} and ${$c(hi)} work too: check them forward.` },
    ],
  });
};
const roundedRate: Gen = (R, n) => {
  const SETS = [[8000, 8250, 8500], [6000, 6250, 6500], [7000, 7250, 7500], [5000, 5250, 5500], [9000, 9250, 9500], [8500, 8750, 9000]];
  let set: number[] = [], rate = 0, price = 0, tax = 0;
  for (let i = 0; i < 300; i++) {
    set = pick(R, SETS); rate = pick(R, set); price = shopPrice(R, 8, 90); tax = taxOf(price, rate);
    if (set.filter(c => taxOf(price, c) === tax).length === 1) break;
  }
  const qU = Math.floor((tax * M_WHOLE) / price);      // the quotient in milli-percent, cut off
  const qTxt = `${decOf(qU, 3)}`;
  return choiceItem(R, {
    id: `roundedRate-${n}`, family: 'roundedRate',
    prompt: `A receipt: price ${A($c(price))}, tax ${B($c(tax))} (rounded to the cent). ${$c(tax)} ÷ ${$c(price)} ≈ ${qTxt}%. The local rate is one of ${set.map(pH).join(', ')}. Which one? ${CALC} ${RULE}`,
    board: `${usdTex(tax)} \\div ${usdTex(price)} \\approx ${qTxt}\\%`,
    picture: { tape: { price, rate, hide: { rate: true } }, solved: { price, rate }, pre: ['tape', 'whole', 'tax', 'total'], post: ['totalPct'], pulse: ['tax'], work: set.map(c => `${pT(c)} \\to ${usdTex(taxOf(price, c))}${c === rate ? '\\ \\checkmark' : ''}`) } satisfies TaxPicture,
    solution: [`${qTxt}% is approximate: test each rate forward.`, set.map(c => `${pH(c)} → ${$c(taxOf(price, c))}${c === rate ? ' ✓' : ''}`).join(' · ')],
    opts: [
      ...set.map(c => (c === rate
        ? { t: pH(c), ok: true, say: `Yes: only ${pH(c)} gives ${$c(tax)}.` }
        : { t: pH(c), ok: false, say: `${pH(c)} of ${$c(price)} rounds to ${$c(taxOf(price, c))}, not ${$c(tax)}.` })).sort((a, b) => Number(b.ok) - Number(a.ok)),
      { t: `Exactly ${qTxt}%`, ok: false, mc: MC.roundedExact, say: 'The tax was rounded, so the quotient is only approximate. Test the possible rates forward.' },
    ],
  });
};

// =============== 18. budget-max-price ===============
const budgetMaxG: Gen = (R, n) => {
  let rate = 0, budget = 0, best = 0, trunc = 0;
  const wantUp = R() < 0.5;
  for (let i = 0; i < 300; i++) {
    rate = R() < 0.5 ? WHOLE(R, 4, 10) : decRate(R); budget = int(R, 15, 120) * 100 + (R() < 0.2 ? pick(R, [50, 25]) : 0);
    best = budgetMax(budget, rate); trunc = Math.floor(budgetQuotientU(budget, rate) / U_CENT);
    if ((best > trunc) === wantUp && budgetQuotientU(budget, rate) % U_CENT !== 0) break;
  }
  const qU = budgetQuotientU(budget, rate), up = trunc + 1, m = multDec(rate);
  const qTxt = `${digitsU(qU, true).slice(0, digitsU(qU, true).indexOf('.') + 5)}...`;
  return moneyItem({
    id: `budgetMax-${n}`, family: 'budgetMax',
    prompt: `You have ${S($c(budget))} to spend, and the sales tax is ${B(pH(rate))}. What is the most expensive pre-tax price you can afford? (${$c(budget)} ÷ ${m} = ${qTxt}) ${CALC} ${RULE}`,
    board: `${usdTex(budget)} \\div ${m} = ${qTxt.replace('...', '\\ldots')}`,
    solution: [`Start safe: cut the quotient to ${$c(trunc)}. Its total is ${$c(totalOf(trunc, rate))}.`,
      ...(best > trunc ? [`Step up: ${$c(best)} gives ${$c(totalOf(best, rate))}, still in budget.`] : []),
      `${$c(best + 1)} gives ${$c(totalOf(best + 1, rate))}: over. So the most is ${A($c(best))}.`],
    c: best,
    wrongs: [
      ...(up !== best ? [{ u: U(up), mc: MC.fixedRound, say: `Rounding up is not always safe: ${$c(up)} gives ${$c(totalOf(up, rate))}, over the budget.` }] : []),
      ...(trunc !== best ? [{ u: U(trunc), mc: MC.fixedRound, say: `${$c(trunc)} fits, but one more cent still fits too: ${$c(best)} gives ${$c(totalOf(best, rate))}. Step up until the next cent goes over.` }] : []),
      { u: U(budget) - budget * rate, mc: MC.opposite, say: `${pH(rate)} of the budget is not the tax: the tax is ${pH(rate)} of the smaller price. Divide by ${m}, then test cents.` },
    ],
    right: `Yes: ${$c(best)} gives ${$c(totalOf(best, rate))}, and ${$c(best + 1)} gives ${$c(totalOf(best + 1, rate))}.`,
    hint: `Cut ${qTxt} to the cent, check its total, then step up a cent at a time until the total goes over.`,
  });
};

// =============== 19. compare-totals ===============
function storeCase(R: () => number): { a: { name: string; price: number; rate: number }; b: { name: string; price: number; rate: number }; ta: number; tb: number } {
  const [na, nb] = shuffle(R, STORES.slice()) as [string, string];
  const needDisagree = R() < 0.6;
  for (let i = 0; i < 500; i++) {
    const pa = shopPrice(R, 20, 300), pb = pa + int(R, -600, 600);
    if (pb === pa || pb < 500) continue;
    const ra = pick(R, [0, 4000, 5000, 6000, 7000, 7500, 8250, 8875, 9500, 10000]);
    const rb = pick(R, [0, 4000, 5000, 6000, 6250, 7000, 8000, 8500, 9000, 9250]);
    if (ra === rb) continue;
    if ((pa < pb) === (ra < rb)) continue;           // a trade-off: one store has the lower price, the other the lower rate
    const ta = totalOf(pa, ra), tb = totalOf(pb, rb);
    if (ta === tb) continue;
    if (needDisagree !== ((pa < pb) !== (ta < tb))) continue;
    return { a: { name: na, price: pa, rate: ra }, b: { name: nb, price: pb, rate: rb }, ta, tb };
  }
  return { a: { name: na, price: 4999, rate: 9000 }, b: { name: nb, price: 5049, rate: 6000 }, ta: totalOf(4999, 9000), tb: totalOf(5049, 6000) };
}
const compareStores: Gen = (R, n) => {
  const { a, b, ta, tb } = storeCase(R), C = pick(R, THINGS);
  const win = ta < tb ? a : b, lose = ta < tb ? b : a, tw = Math.min(ta, tb), tl = Math.max(ta, tb);
  const loseMc = lose.price < win.price ? MC.pretaxOnly : lose.rate < win.rate ? MC.rateOnly : undefined;
  return choiceItem(R, {
    id: `compareStores-${n}`, family: 'compareStores',
    prompt: `${cap(C.a)}: ${a.name} sells it for ${$c(a.price)} with ${pH(a.rate)} sales tax. ${b.name} sells it for ${$c(b.price)} with ${pH(b.rate)} tax. Where is the total lower? ${CALC} ${RULE}`,
    board: `${usdTex(a.price)} + ${pT(a.rate)}\\quad \\text{vs}\\quad ${usdTex(b.price)} + ${pT(b.rate)}`,
    solution: [`${a.name}: ${$c(a.price)} + ${$c(taxOf(a.price, a.rate))} = ${S($c(ta))}.`, `${b.name}: ${$c(b.price)} + ${$c(taxOf(b.price, b.rate))} = ${S($c(tb))}. ${win.name} is lower by ${$c(tl - tw)}.`],
    opts: [
      { t: win.name, ok: true, say: `Yes: ${$c(tw)} against ${$c(tl)}, with tax included.` },
      { t: lose.name, ok: false, mc: loseMc, say: loseMc === MC.pretaxOnly ? `Its shelf price is lower, but with tax it is ${$c(tl)}: compare totals.` : `Its rate is lower, but its total is ${$c(tl)}: compare totals.` },
      { t: 'The totals are the same', ok: false, say: `Work out both totals: ${$c(ta)} and ${$c(tb)}.` },
    ],
  });
};
const saveGap: Gen = (R, n) => {
  const { a, b, ta, tb } = storeCase(R), C = pick(R, THINGS);
  const gap = Math.abs(ta - tb);
  return moneyItem({
    id: `saveGap-${n}`, family: 'saveGap',
    prompt: `${cap(C.a)}: ${a.name} charges ${$c(a.price)} plus ${pH(a.rate)} tax; ${b.name} charges ${$c(b.price)} plus ${pH(b.rate)} tax. How much do you save by buying where the total is lower? ${CALC} ${RULE}`,
    board: `|\\text{total}_A - \\text{total}_B| = \\ ?`,
    solution: [`${a.name}: ${$c(a.price)} + ${$c(taxOf(a.price, a.rate))} = ${S($c(ta))}. ${b.name}: ${$c(b.price)} + ${$c(taxOf(b.price, b.rate))} = ${S($c(tb))}.`, `The difference: ${$c(Math.max(ta, tb))} − ${$c(Math.min(ta, tb))} = <b>${$c(gap)}</b>.`],
    c: gap,
    wrongs: [
      { u: U(Math.abs(a.price - b.price)), mc: MC.pretaxOnly, say: 'That compares the shelf prices. Compare the totals, with tax.' },
    ],
    right: `Yes: the totals are ${$c(ta)} and ${$c(tb)}.`, hint: 'Find both totals (price + rounded tax), then subtract.',
  });
};

// ---------- the registry ----------
export const FAMILY_NAMES: Record<string, string> = {
  roles: 'Name the amounts', missingAmt: 'Price + tax = total',
  rateOrAmount: 'Rate or amount?', perHundred: 'Tax per $100',
  whichWhole: 'Which amount is 100%?', totalPct: 'The total as a percent', dollarAt: 'Read the double number line',
  taxAmt: 'The tax at a whole rate',
  totalPay: 'What you pay', planTotal: 'Plan the two steps',
  readDecimal: 'Read long decimals', compareDec: 'Compare decimals', placeDigit: 'Find the place',
  pctToDec: 'Percent to decimal', decBetween: 'Between whole percents',
  decTax: 'Tax at a decimal rate', placePoint: 'Place the decimal point',
  roundTax: 'Round the tax', roundTotal: 'Round, then add',
  benchCheck: 'Is it reasonable?', boundsPick: 'Bracket the tax',
  exemptCart: 'A cart with exempt items', taxableBase: 'Tax on which amount?',
  findRate: 'Find the rate',
  priceFromTax: 'Price from the tax',
  multiplier: 'The total multiplier', multExpr: 'An expression for the total', oneStepTotal: 'The total in one step',
  priceFromTotal: 'Price from the total', whichDivision: 'Which division?',
  subtractFails: 'Why subtracting fails', testNumber: 'Test it with a number',
  roundedTotal: 'A rounded total', roundedTaxRange: 'A rounded tax', roundedRate: 'A rounded rate',
  budgetMax: 'The most you can spend',
  compareStores: 'Compare two stores', saveGap: 'How much you save',
};
export const GENERATORS: Record<string, Gen> = {
  roles, missingAmt, rateOrAmount, perHundred, whichWhole, totalPct, dollarAt, taxAmt, totalPay, planTotal,
  readDecimal, compareDec, placeDigit, pctToDec, decBetween, decTax, placePoint, roundTax, roundTotal,
  benchCheck, boundsPick, exemptCart, taxableBase, findRate, priceFromTax: priceFromTaxG,
  multiplier, multExpr, oneStepTotal, priceFromTotal: priceFromTotalG, whichDivision,
  subtractFails, testNumber, roundedTotal, roundedTaxRange, roundedRate, budgetMax: budgetMaxG, compareStores, saveGap,
};
// re-exported for the page and the tests
export { priceFromTotal, rateDec, multDec };
