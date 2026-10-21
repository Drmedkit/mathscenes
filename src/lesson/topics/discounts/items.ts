// items.ts: practice families for "Calculate a discount" (grade 7, 7.RP.A.3). Every family is one deep structure;
// a generator receives the sub-goal id and uses that sub-goal's number ranges (topic JSON `cases`). Every wrong answer
// the classifier recognises carries its id from math-curriculum-essentials/misconceptions.json (logged, never shown).
// All money is exact (discountMaths.ts: integer ticks of $0.0001). Pure: no DOM, no canvas.
// Colours in prompts follow the model: original price = amber (A), discount = teal (B), sale price = lime (S). Items
// that ASK which amount plays which role print the amounts plain, so the colour does not give the answer away.
import { type Gen, type Item, type Response, type Verdict, A, B, S, int, pick, shuffle } from '../../runtime/item';
import type { PriceBarParams, PriceBarStep } from './PriceBar';
import { type Sale, CENT, TICK, digits, dollarSale, mult, percentSale, roundCent, saleRoundingDiscountFirst, toTicks, truncCent, usd, usdTex } from './discountMaths';

// ---------- what the page draws for an item ----------
export interface DiscPicture {
  /** the model with the problem (hidden amounts show "?") */ bar: PriceBarParams;
  /** the model after the answer (default: bar with nothing hidden) */ solved?: PriceBarParams;
  /** steps shown with the problem ([] = the bare notation first, the model comes with the solution) */ pre: PriceBarStep[];
  /** steps the worked solution adds */ post: PriceBarStep[];
  /** labels lit in the worked solution */ pulse: ('disc' | 'sale' | 'orig' | 'tag')[];
  /** TeX lines the worked solution writes on the board */ work: string[];
  [k: string]: unknown;
}
export type DiscItem = Item;

// ---------- contexts ----------
interface Thing { tag: string; a: string; the: string; plural?: boolean }
const THINGS: readonly Thing[] = [
  { tag: 'Headphones', a: 'a pair of headphones', the: 'the headphones', plural: true },
  { tag: 'Sneakers', a: 'a pair of sneakers', the: 'the sneakers', plural: true },
  { tag: 'Video game', a: 'a video game', the: 'the game' },
  { tag: 'Hoodie', a: 'a hoodie', the: 'the hoodie' },
  { tag: 'Skateboard', a: 'a skateboard', the: 'the skateboard' },
  { tag: 'Backpack', a: 'a backpack', the: 'the backpack' },
  { tag: 'Jacket', a: 'a jacket', the: 'the jacket' },
  { tag: 'Board game', a: 'a board game', the: 'the board game' },
  { tag: 'Soccer ball', a: 'a soccer ball', the: 'the ball' },
  { tag: 'Desk lamp', a: 'a desk lamp', the: 'the lamp' },
  { tag: 'Earbuds', a: 'a set of earbuds', the: 'the earbuds', plural: true },
  { tag: 'Bike helmet', a: 'a bike helmet', the: 'the helmet' },
  { tag: 'Keyboard', a: 'a keyboard', the: 'the keyboard' },
  { tag: 'Tent', a: 'a tent', the: 'the tent' },
  { tag: 'Smartwatch', a: 'a smartwatch', the: 'the watch' },
  { tag: 'Sunglasses', a: 'a pair of sunglasses', the: 'the sunglasses', plural: true },
];
const NAMES = ['Maya', 'Leo', 'Ava', 'Sam', 'Nora', 'Eli', 'Zoe', 'Omar', 'Lily', 'Jack', 'Rosa', 'Ben', 'Priya', 'Diego', 'Kenji', 'Amara'];
const costs = (t: Thing) => (t.plural ? 'cost' : 'costs');
const is = (t: Thing) => (t.plural ? 'are' : 'is');
const cap = (s: string) => s[0]!.toUpperCase() + s.slice(1);
const NOCALC = '<span class="calc">No calculator.</span>';
const CALC = '<span class="calc">Calculator allowed.</span>';
const POLICY = '<span class="calc">Rule: keep exact values, round only the final price to the nearest cent (halves round up).</span>';
const pctT = (p: number) => `${p}\\%`;

export const FAMILY_NAMES: Record<string, string> = {
  roles: 'Name the amounts',
  partWhole: 'How the amounts fit',
  missing: 'Find the missing amount',
  whichWhole: 'Percent of what?',
  pctOrDollars: 'Percent off or dollars off',
  readSplit: 'Read the bar',
  judgeSplit: 'Check the bar',
  discAmt: 'The dollar discount',
  salePrice: 'The sale price',
  saveAndPay: 'Saved and paid',
  exactDisc: 'An exact discount',
  keepExact: 'Parts of a cent',
  roundFinal: 'Round the final price',
  policy: 'When to round',
  pctPaid: 'The percent you pay',
  paidOfWhat: 'Percent of which amount?',
  oneStep: 'One multiplication',
  whichProduct: 'Pick the one-step product',
  whyAgree: 'Why both ways agree',
  checkClaim: 'Check a sale price',
  estimate: 'Estimate the sale price',
  bounds: 'Half price, full price, free',
};

// ---------- item builders ----------
interface MWrong { t: number; mc?: string; say: string }
/** a money answer typed as a number of dollars, checked exactly (ticks) */
function moneyItem(o: Omit<DiscItem, 'input' | 'answer' | 'check'> & { t: number; wrongs: MWrong[]; right: string; hint: string }): DiscItem {
  const { t, wrongs, right, hint, ...rest } = o;
  return {
    ...rest, input: 'num', unit: rest.unit ?? 'dollars', answer: { kind: 'num', v: t / TICK },
    check(r: Response): Verdict {
      if (r.kind !== 'num') return { ok: false, say: 'Type an amount of money.' };
      const k = toTicks(r.v);
      if (k === null) return { ok: false, say: 'Type the amount as a number, like 12.50 (no $ sign).' };
      if (k === t) return { ok: true, say: right };
      const w = wrongs.find(x => x.t === k && x.t !== t);
      return w ? { ok: false, mc: w.mc, say: w.say } : { ok: false, say: hint };
    },
  };
}
interface NWrong { v: number; mc?: string; say: string }
function percentItem(o: Omit<DiscItem, 'input' | 'answer' | 'check'> & { v: number; wrongs: NWrong[]; right: string; hint: string }): DiscItem {
  const { v, wrongs, right, hint, ...rest } = o;
  return {
    ...rest, input: 'num', unit: '%', answer: { kind: 'num', v },
    check(r: Response): Verdict {
      if (r.kind !== 'num' || !Number.isFinite(r.v)) return { ok: false, say: 'Type a whole-number percent, like 85.' };
      if (r.v === v) return { ok: true, say: right };
      const w = wrongs.find(x => x.v === r.v && x.v !== v);
      return w ? { ok: false, mc: w.mc, say: w.say } : { ok: false, say: hint };
    },
  };
}
interface Choice { t: string; ok: boolean; mc?: string; say: string }
function choiceItem(R: () => number, o: Omit<DiscItem, 'input' | 'answer' | 'check' | 'choices'> & { opts: Choice[] }): DiscItem {
  const { opts, ...rest } = o;
  const sh = shuffle(R, opts.slice());
  return {
    ...rest, input: 'choice', choices: sh.map(c => c.t), answer: { kind: 'choice', i: sh.findIndex(c => c.ok) },
    check(r: Response): Verdict {
      if (r.kind !== 'choice' || !sh[r.i]) return { ok: false, say: 'Pick one answer.' };
      const c = sh[r.i]!;
      return { ok: c.ok, mc: c.ok ? undefined : c.mc, say: c.say };
    },
  };
}
const hasCents = (cents: number) => cents % 100 !== 0;
/** a whole-dollar price in cents */
const dollars = (R: () => number, lo: number, hi: number) => int(R, lo, hi) * 100;
/** a shop price with cents: $x.99, $x.49 or $x.95 */
const shopPrice = (R: () => number, lo: number, hi: number) => int(R, lo, hi) * 100 + pick(R, [99, 49, 95]);
/** the whole-percent multiplier p/100 as TeX-safe text: 0.15, 0.05, 0.4 */
const m = mult;

/** worked lines for p% of a whole-dollar price, by the benchmark route when there is one */
function discountRoute(s: Sale): { html: string[]; tex: string[] } {
  const p = s.pct!, P = s.origT, d = s.discT, ten = P / 10;
  const $ = (t: number) => usd(t), T = (t: number) => usdTex(t);
  if (p === 0) return { html: [`0% off means nothing off: the discount is ${B('$0')}.`], tex: [`0\\%\\ \\text{of}\\ ${T(P)} = \\$0`] };
  if (p === 100) return { html: [`100% off is the whole price: the discount is ${B($(P))}.`], tex: [`100\\%\\ \\text{of}\\ ${T(P)} = ${T(P)}`] };
  if (p === 50) return { html: [`50% is half: ${$(P)} ÷ 2 = ${B($(d))}.`], tex: [`${T(P)} \\div 2 = ${T(d)}`] };
  if (p === 25) return { html: [`25% is a quarter: ${$(P)} ÷ 4 = ${B($(d))}.`], tex: [`${T(P)} \\div 4 = ${T(d)}`] };
  if (p === 10) return { html: [`10% is one tenth: ${$(P)} ÷ 10 = ${B($(d))}.`], tex: [`10\\%\\ \\text{of}\\ ${T(P)} = ${T(d)}`] };
  if (p === 20 || p === 30) return { html: [`10% of ${$(P)} is ${$(ten)}.`, `${p}% is ${p / 10} × ${$(ten)} = ${B($(d))}.`], tex: [`10\\% \\to ${T(ten)}`, `${p}\\% \\to ${p / 10} \\times ${T(ten)} = ${T(d)}`] };
  if (p === 5) return { html: [`10% of ${$(P)} is ${$(ten)}.`, `5% is half of that: ${B($(d))}.`], tex: [`10\\% \\to ${T(ten)}`, `5\\% \\to ${T(ten)} \\div 2 = ${T(d)}`] };
  if (p === 15) return { html: [`10% of ${$(P)} is ${$(ten)}, and 5% is half of that, ${$(ten / 2)}.`, `15% = 10% + 5%: ${$(ten)} + ${$(ten / 2)} = ${B($(d))}.`], tex: [`10\\% \\to ${T(ten)},\\ \\ 5\\% \\to ${T(ten / 2)}`, `15\\% \\to ${T(d)}`] };
  return { html: [`${p}% = ${m(p)}. The discount is ${m(p)} × ${$(P)} = ${B($(d))}.`], tex: [`${m(p)} \\times ${T(P)} = ${T(d)}`] };
}
const cellsFor = (p: number): number => (p % 10 === 0 ? 10 : p === 25 || p === 75 ? 4 : p % 5 === 0 ? 20 : 0);

// =============== 1. name-sale-amounts ===============
const roles: Gen = (R, n) => {
  const C = pick(R, THINGS), name = pick(R, NAMES);
  const ask = pick(R, ['sale', 'disc', 'disc', 'orig'] as const);
  let D = 0, Sp = 0;
  do { D = int(R, 3, 60); Sp = int(R, 3, 70); } while (D === Sp || D + Sp > 120 || (ask === 'disc' && R() < 0.65 && D < Sp));
  const withCents = R() < 0.35;          // supplied prices with cents: read only, nothing to compute
  const O = (D + Sp) * 100 - (withCents ? 1 : 0), Dc = D * 100, Sc = O - Dc;
  const $ = (c: number) => usd(c * CENT, withCents);
  const story = pick(R, [
    `${cap(C.the)} ${costs(C)} ${$(O)} at full price. This week ${C.plural ? 'they are' : 'it is'} ${$(Dc)} off, so ${name} pays ${$(Sc)}.`,
    `${name}'s receipt: ${C.tag.toLowerCase()}, regular price ${$(O)}, you save ${$(Dc)}, you pay ${$(Sc)}.`,
    `${name} pays ${$(Sc)} for ${C.a}. The store took ${$(Dc)} off the regular price of ${$(O)}.`,
  ]);
  const role = { sale: 'the sale price', disc: 'the discount', orig: 'the original price' }[ask];
  const right = { sale: Sc, disc: Dc, orig: O }[ask];
  const sayRole = (c: number) => (c === O ? `${$(O)} is the original price: the whole, before anything comes off.` : c === Dc ? `${$(Dc)} is the discount: the amount taken off.` : `${$(Sc)} is the sale price: what is left to pay.`);
  const opts: Choice[] = [O, Dc, Sc].map(c => {
    if (c === right) return { t: $(c), ok: true, say: `Yes. ${sayRole(c)}` };
    let mc: string | undefined;
    if (ask === 'sale' && c === Dc) mc = 'mc.percent.change-reported-as-final-amount';
    if (ask === 'disc' && c === Sc && Sc < Dc) mc = 'mc.percent.smaller-amount-always-discount';
    return { t: $(c), ok: false, mc, say: `${sayRole(c)} ${ask === 'disc' && c === Sc && Sc < Dc ? 'The discount is not always the smaller amount: here more comes off than is left.' : `Look for ${role}.`}` };
  });
  return choiceItem(R, {
    id: `roles-${n}`, family: 'roles', prompt: `${story} Which amount is <b>${role}</b>? ${NOCALC}`, board: `\\text{${role}} = \\ ?`,
    picture: { bar: { price: O, off: Dc, item: C.tag, cents: withCents }, pre: [], post: ['tag', 'bar', 'whole', 'cut', 'disc', 'sale'], pulse: [ask === 'orig' ? 'orig' : ask], work: [`${usdTex(O * CENT, withCents)} = ${usdTex(Dc * CENT, withCents)} + ${usdTex(Sc * CENT, withCents)}`] },
    solution: [`The original price ${A($(O))} is the whole.`, `It splits into the discount ${B($(Dc))} and the sale price ${S($(Sc))}: ${$(Dc)} + ${$(Sc)} = ${$(O)}.`],
    opts,
  });
};
const partWhole: Gen = (R, n) => {
  const C = pick(R, THINGS);
  let D = 0, Sp = 0;
  do { D = int(R, 4, 60); Sp = int(R, 4, 80); } while (D === Sp || D + Sp > 130);
  const O = D + Sp;
  const $ = (v: number) => `$${v}`;
  const right = pick(R, [`${$(D)} + ${$(Sp)} = ${$(O)}`, `${$(O)} = ${$(D)} + ${$(Sp)}`, `${$(Sp)} + ${$(D)} = ${$(O)}`]);
  return choiceItem(R, {
    id: `partWhole-${n}`, family: 'partWhole',
    prompt: `${cap(C.a)} ${costs(C)} ${A($(O))}. It is ${B(`${$(D)} off`)}, so you pay ${S($(Sp))}. Which equation describes this sale? ${NOCALC}`,
    board: `\\$${O} = \\$\\,? + \\$\\,?`,
    picture: { bar: { price: O * 100, off: D * 100 }, pre: [], post: ['bar', 'whole', 'cut', 'disc', 'sale'], pulse: ['orig'], work: [`\\$${O} = \\$${D} + \\$${Sp}`] },
    solution: [`The discount and the sale price are the two parts of the original price.`, `${B($(D))} + ${S($(Sp))} = ${A($(O))}.`],
    opts: [
      { t: right, ok: true, say: 'Yes: the discount and the sale price together make the original price.' },
      { t: `${$(O)} + ${$(D)} = ${$(O + D)}`, ok: false, mc: 'mc.percent.wrong-direction-of-change', say: `That adds the discount on top. A discount comes OFF the price: ${$(D)} + ${$(Sp)} = ${$(O)}.` },
      { t: `${$(O)} + ${$(Sp)} = ${$(O + Sp)}`, ok: false, say: `The sale price is part of the ${$(O)}, not extra: ${$(D)} + ${$(Sp)} = ${$(O)}.` },
    ],
  });
};

// =============== 2. find-missing-amount ===============
const missing: Gen = (R, n) => {
  const C = pick(R, THINGS);
  const unk = pick(R, ['sale', 'disc', 'orig'] as const);
  let D = 0, Sp = 0;
  // whole dollars, small, no regrouping either way (stage 1: mental, no subtraction across zeros)
  do { D = int(R, 3, 60); Sp = int(R, 3, 80); } while (D === Sp || D + Sp > 120 || (D % 10) + (Sp % 10) >= 10 || D % 10 === 0 && Sp % 10 === 0 && R() < 0.6);
  const O = D + Sp;
  const $ = (v: number) => `$${v}`, t = (v: number) => v * TICK;
  const hide = { sale: { sale: true }, disc: { disc: true }, orig: { orig: true } }[unk];
  const pic: DiscPicture = { bar: { price: O * 100, off: D * 100, hide }, pre: ['bar', 'whole', 'cut', 'disc', 'sale'], post: [], pulse: [unk === 'orig' ? 'orig' : unk], work: [] };
  if (unk === 'sale') {
    pic.work = [`\\$${O} - \\$${D} = \\$${Sp}`];
    return moneyItem({
      id: `missing-${n}`, family: 'missing', prompt: `${cap(C.the)} ${costs(C)} ${A($(O))}. ${C.plural ? 'They are' : 'It is'} ${B(`${$(D)} off`)}. What is the sale price? ${NOCALC}`,
      board: `\\$${O} - \\$${D} = \\$\\,?`, picture: pic, t: t(Sp),
      solution: [`The sale price is what is left of the original after the discount.`, `${A($(O))} − ${B($(D))} = ${S($(Sp))}.`],
      wrongs: [
        { t: t(D), mc: 'mc.percent.change-reported-as-final-amount', say: `${$(D)} is the amount taken off. The sale price is what is left: ${$(O)} − ${$(D)}.` },
        { t: t(O + D), mc: 'mc.percent.wrong-direction-of-change', say: `A discount makes the price lower, so take the ${$(D)} away.` },
      ],
      right: `Yes: ${$(O)} − ${$(D)} = ${$(Sp)}.`, hint: `Take the discount away from the original price: ${$(O)} − ${$(D)}.`,
    });
  }
  if (unk === 'disc') {
    pic.work = [`\\$${O} - \\$${Sp} = \\$${D}`];
    return moneyItem({
      id: `missing-${n}`, family: 'missing', prompt: `${cap(C.the)} ${C.plural ? 'were' : 'was'} ${A($(O))}, now ${S($(Sp))}. How much do you save? ${NOCALC}`,
      board: `\\$${O} - \\$\\,? = \\$${Sp}`, picture: pic, t: t(D),
      solution: [`The saving is the gap between the original price and the sale price.`, `${A($(O))} − ${S($(Sp))} = ${B($(D))}.`],
      wrongs: [
        { t: t(Sp), say: `${$(Sp)} is what you pay now. The saving is the part that came off: ${$(O)} − ${$(Sp)}.` },
        { t: t(O + Sp), mc: 'mc.percent.wrong-direction-of-change', say: `The saving is a part of the ${$(O)}, so it is smaller than ${$(O)}.` },
      ],
      right: `Yes: ${$(O)} − ${$(Sp)} = ${$(D)} saved.`, hint: `The saving is the original price minus the sale price.`,
    });
  }
  pic.work = [`\\$${D} + \\$${Sp} = \\$${O}`];
  return moneyItem({
    id: `missing-${n}`, family: 'missing', prompt: `${cap(C.the)} ${is(C)} ${B(`${$(D)} off`)}, and the sale price is ${S($(Sp))}. What was the original price? ${NOCALC}`,
    board: `\\$\\,? - \\$${D} = \\$${Sp}`, picture: pic, t: t(O),
    solution: [`The original price is the whole: the discount and the sale price together.`, `${B($(D))} + ${S($(Sp))} = ${A($(O))}.`],
    wrongs: [
      { t: t(Math.abs(Sp - D)), mc: 'mc.equal-sign.always-subtracts-visible-numbers-for-unknown', say: `That subtracts the two numbers you see. The original is the WHOLE, so put the parts together: ${$(D)} + ${$(Sp)}.` },
      { t: t(Sp), say: `${$(Sp)} is the sale price. Before the ${$(D)} came off, the price was higher.` },
    ],
    right: `Yes: ${$(D)} + ${$(Sp)} = ${$(O)}.`, hint: `The original price is bigger than the sale price: add the discount back on.`,
  });
};

// =============== 3. original-is-100 ===============
const whichWhole: Gen = (R, n) => {
  const C = pick(R, THINGS);
  let P = 0, p = 0;
  do { P = R() < 0.3 ? shopPrice(R, 1, 199) : dollars(R, 1, 200); p = int(R, 1, 19) * 5; } while (P === 10000);
  const s = percentSale(P, p), cents = hasCents(P);
  const q = pick(R, [`The ${p}% is ${p}% of which amount?`, `In “${p}% off”, which amount is the 100%?`]);
  return choiceItem(R, {
    id: `whichWhole-${n}`, family: 'whichWhole',
    prompt: `${cap(C.the)} ${costs(C)} ${A(usd(s.origT, cents))} and ${is(C)} ${B(`${p}% off`)}. ${q} ${NOCALC}`,
    board: `${pctT(p)}\\ \\text{off}\\ ${usdTex(s.origT, cents)}`,
    picture: { bar: { price: P, pct: p, item: C.tag, cents, words: true }, solved: { price: P, pct: p, item: C.tag, cents }, pre: ['tag', 'bar', 'cut', 'disc'], post: ['whole'], pulse: ['orig'], work: [`100\\% = ${usdTex(s.origT, cents)}`] },
    solution: [`A percent off is always a percent OF the original price.`, `So ${A(usd(s.origT, cents))} is the 100%, and ${p}% off is ${p} of every 100 parts of it.`],
    opts: [
      { t: `The original price, ${usd(s.origT, cents)}`, ok: true, say: 'Yes: the original price is the whole, the 100%.' },
      { t: '$100', ok: false, mc: 'mc.percent.percent-as-fixed-amount', say: `Percent means per 100 parts of the price, not of $100. Here the whole is ${usd(s.origT, cents)}.` },
      { t: 'The sale price', ok: false, mc: 'mc.percent.new-or-estimate-as-base', say: `The sale price comes after the discount. The discount is a percent of the price BEFORE it: ${usd(s.origT, cents)}.` },
    ],
  });
};
const pctOrDollars: Gen = (R, n) => {
  const C = pick(R, THINGS);
  const p = pick(R, [10, 15, 20, 25, 30, 40, 50]);
  const P = R() < 0.15 ? 100 : (() => { let v = 100; while (v === 100) v = int(R, 4, 40) * 5; return v; })();
  const s = percentSale(P * 100, p);
  const verdict = P > 100 ? 'pct' : P < 100 ? 'usd' : 'same';
  const why = P === 100 ? `On exactly $100, ${p}% is $${p}.` : P > 100 ? `$${P} is more than $100, so ${p}% of it is more than $${p}.` : `$${P} is less than $100, so ${p}% of it is less than $${p}.`;
  return choiceItem(R, {
    id: `pctOrDollars-${n}`, family: 'pctOrDollars',
    prompt: `Two stores sell ${C.a} for ${A(`$${P}`)}. Store A: ${B(`${p}% off`)}. Store B: ${B(`$${p} off`)}. Which saves you more? ${NOCALC}`,
    board: `${pctT(p)}\\ \\text{off} \\quad \\text{or} \\quad \\$${p}\\ \\text{off}`,
    picture: { bar: { price: P * 100, pct: p, words: false }, pre: [], post: ['bar', 'whole', 'ticks', 'cut', 'disc'], pulse: ['disc'], work: [`${pctT(p)}\\ \\text{of}\\ \\$${P} = ${usdTex(s.discT)}`] },
    solution: [`${p}% means ${p} out of every 100 dollars of the price.`, why, `${p}% of $${P} is ${B(usd(s.discT))}.`],
    opts: [
      { t: `Store A: ${p}% off`, ok: verdict === 'pct', say: verdict === 'pct' ? `Yes. ${why}` : `${why} So $${p} off saves more.` },
      { t: `Store B: $${p} off`, ok: verdict === 'usd', say: verdict === 'usd' ? `Yes. ${why}` : verdict === 'same' ? `${why} They save the same.` : `${why} So ${p}% off saves more.` },
      { t: 'They save the same', ok: verdict === 'same', mc: verdict === 'same' ? undefined : 'mc.percent.percent-as-fixed-amount', say: verdict === 'same' ? `Yes. ${why}` : `${p}% is only $${p} when the price is exactly $100. ${why}` },
    ],
  });
};

// =============== 4. percent-split-model ===============
const BENCH_WORDS: Record<number, string> = { 50: 'half', 25: 'one quarter', 10: 'one tenth', 20: 'one fifth' };
const BENCH_TEX: Record<number, string> = { 50: '\\tfrac{1}{2}', 25: '\\tfrac{1}{4}', 10: '\\tfrac{1}{10}', 20: '\\tfrac{1}{5}' };
const readSplit: Gen = (R, n) => {
  const p = pick(R, [50, 25, 10, 20, 30, 40]);
  let P = 0;
  do { P = R() < 0.25 ? shopPrice(R, 12, 179) : dollars(R, 12, 180); } while (P === 10000 || P === p * 100);
  const cents = hasCents(P), O = usd(P * CENT, cents);
  const cells = p === 25 ? 4 : 10;
  const third: Choice = p === 50
    ? { t: 'The sale price', ok: false, say: 'The teal part is the part that comes OFF. The sale price is the rest of the bar.' }
    : { t: `${100 - p}% off`, ok: false, say: `${100 - p}% is the rest of the bar, the part you still pay. The teal part is ${p}% of the bar.` };
  return choiceItem(R, {
    id: `readSplit-${n}`, family: 'readSplit',
    prompt: `The whole bar is the original price, ${A(O)} = 100%. It is cut into ${cells} equal parts. What does the ${B('teal part')} stand for? ${NOCALC}`,
    board: `100\\% = ${usdTex(P * CENT, cents)}`,
    picture: { bar: { price: P, pct: p, cents, ticks: cells, hide: { pct: true }, amounts: false }, pre: ['bar', 'whole', 'ticks', 'cut', 'disc'], post: [], pulse: ['disc'], work: [`${p === 25 ? '\\tfrac{1}{4}' : `\\tfrac{${p / 10}}{10}`}\\ \\text{of the bar} = ${pctT(p)}`] },
    solution: [`The whole bar is 100% of ${A(O)}.`, p === 25 ? `The teal part is 1 of 4 equal parts: ${B('25% off')}.` : `The teal part is ${p / 10} of 10 equal parts, each 10%: ${B(`${p}% off`)}.`],
    opts: [
      { t: `${p}% off`, ok: true, say: `Yes: ${p === 25 ? 'one of four equal parts is 25%' : `${p / 10} tenth${p === 10 ? '' : 's'} of the bar is ${p}%`}.` },
      { t: `$${p} off`, ok: false, mc: 'mc.percent.adds-or-subtracts-percent-numeral', say: `The parts are percents of the bar, not dollars. The bar is ${O}, not $100, so ${p}% is not $${p}.` },
      third,
    ],
  });
};
const judgeSplit: Gen = (R, n) => {
  const p = pick(R, [50, 25, 10, 20]), name = pick(R, NAMES), rightClaim = R() < 0.35;
  let P = 0;
  do { P = int(R, 20, 90); } while (P <= p + 3 || P === 100 || (rightClaim ? false : Math.abs(p / P - p / 100) < 0.08) || (!rightClaim && (P - p) < 6));
  const cells = 100 / p, fw = BENCH_WORDS[p]!;
  const wrongBar: PriceBarParams = { price: P * 100, off: p * 100, ticks: cells, words: false };
  const goodBar: PriceBarParams = { price: P * 100, pct: p, ticks: cells, amounts: false };
  const pic: DiscPicture = { bar: rightClaim ? goodBar : wrongBar, solved: goodBar, pre: ['bar', 'whole', 'ticks', 'cut', 'disc'], post: [], pulse: ['disc'], work: [`${pctT(p)} = ${BENCH_TEX[p]}\\ \\text{of the bar}`] };
  const prompt = rightClaim
    ? `${name} shows ${B(`${p}% off`)} a ${A(`$${P}`)} price by shading ${fw} of the bar. Is ${name} right? ${NOCALC}`
    : `${name} shows ${B(`${p}% off`)} a ${A(`$${P}`)} price by shading $${p} of the $${P} bar. Is ${name} right? ${NOCALC}`;
  const opts: Choice[] = rightClaim ? [
    { t: `Yes: ${p}% off is ${fw} of the bar`, ok: true, say: `Yes: ${p}% is ${fw} of the whole price, whatever the price is.` },
    { t: `No: ${name} should shade $${p} of the bar`, ok: false, mc: 'mc.percent.adds-or-subtracts-percent-numeral', say: `${p}% of $${P} is not $${p}: the percent is a part of the whole bar, not a number of dollars.` },
    { t: 'No: the discount is always the bigger part', ok: false, say: `The size of the parts depends on the percent. ${p}% is ${fw} of the bar.` },
  ] : [
    { t: `No: ${p}% off is ${fw} of the bar`, ok: true, say: `Right: ${p}% is ${fw} of the bar. Shading $${p} only works when the price is $100.` },
    { t: `Yes: ${p}% off means $${p} off`, ok: false, mc: 'mc.percent.adds-or-subtracts-percent-numeral', say: `That treats the percent as dollars. ${p}% off is ${fw} of the whole $${P} bar.` },
    { t: 'Yes: the discount is the smaller part', ok: false, mc: 'mc.percent.smaller-amount-always-discount', say: `Being smaller does not make it right. ${p}% off must be ${fw} of the bar.` },
  ];
  return choiceItem(R, {
    id: `judgeSplit-${n}`, family: 'judgeSplit', prompt, board: `${pctT(p)}\\ \\text{off}\\ \\$${P}`, picture: pic,
    solution: [`The bar is the whole price, 100%.`, `${p}% is ${fw} of it, so the discount part is ${fw} of the bar.`], opts,
  });
};

// =============== 5. discount-amount ===============
function discountCase(R: () => number): { P: number; p: number } {
  const r = R();
  if (r < 0.45) {
    const p = pick(R, [10, 50, 25, 20, 5]);
    return { P: dollars(R, 8, 200), p };
  }
  if (r < 0.65) return { P: int(R, 2, 20) * 1000, p: pick(R, [15, 30]) };
  if (r < 0.95) return { P: dollars(R, 10, 200), p: pick(R, [12, 35, 40, 65, 8, 6, 45, 18]) };
  return { P: dollars(R, 10, 200), p: pick(R, [0, 100]) };
}
const discAmt: Gen = (R, n) => {
  const C = pick(R, THINGS);
  const { P, p } = discountCase(R);
  const s = percentSale(P, p), d = s.discT, route = discountRoute(s);
  const bench = [0, 5, 10, 15, 20, 25, 30, 50, 100].includes(p);
  const wrongs: MWrong[] = [
    { t: s.saleT, mc: 'mc.percent.change-reported-as-final-amount', say: `${usd(s.saleT)} is the sale price, what is LEFT. The question asks for the amount taken off.` },
    { t: p * TICK, mc: 'mc.percent.percent-as-fixed-amount', say: `${p}% is not $${p}: it is ${p} of every 100 parts of ${usd(P * CENT)}.` },
  ];
  if (d > 0) wrongs.push({ t: d * 10, mc: 'mc.decimals.dollars-cents-point-misplaced', say: `Check the decimal point: ${p}% = ${m(p)}${p < 10 ? `, not ${m(p * 10)}` : ''}. The discount is ${m(p)} × ${usd(P * CENT)}.` });
  if (d > 0 && d % 10 === 0) wrongs.push({ t: d / 10, mc: 'mc.decimals.dollars-cents-point-misplaced', say: `Check the decimal point: ${p}% = ${m(p)}. The discount is ${m(p)} × ${usd(P * CENT)}.` });
  return moneyItem({
    id: `discAmt-${n}`, family: 'discAmt',
    prompt: `${cap(C.the)} ${costs(C)} ${A(usd(P * CENT))}. The store takes ${B(`${p}% off`)}. How many dollars is the discount? ${bench ? NOCALC : CALC}`,
    board: `${pctT(p)}\\ \\text{of}\\ ${usdTex(P * CENT)} = \\$\\,?`,
    picture: { bar: { price: P, pct: p, item: C.tag, ticks: cellsFor(p), hide: { disc: true }, words: false }, pre: ['tag', 'bar', 'whole', 'ticks', 'cut', 'disc'], post: [], pulse: ['disc'], work: route.tex },
    solution: [`The discount is ${p}% of the original price ${A(usd(P * CENT))}.`, ...route.html],
    t: d, wrongs, right: `Yes: ${p}% of ${usd(P * CENT)} is ${usd(d)} off.`, hint: `Find ${p}% of ${usd(P * CENT)}: ${bench ? 'start from 10%, which is one tenth' : `multiply by ${m(p)}`}.`,
  });
};

// =============== 6. subtract-discount ===============
function saleCase(R: () => number): { P: number; p: number } {
  const r = R();
  if (r < 0.35) return { P: dollars(R, 8, 200), p: pick(R, [10, 20, 25, 50]) };
  if (r < 0.55) { const P = int(R, 3, 19) * 1000 + 500 * int(R, 0, 1); return { P, p: pick(R, [15, 35, 45]) }; }   // $45.00 - $6.75: across zeros
  return { P: dollars(R, 12, 200), p: pick(R, [15, 35, 60, 65, 70, 75, 80, 12, 40]) };
}
function saleWrongs(s: Sale): MWrong[] {
  const P = s.origT, p = s.pct!;
  const w: MWrong[] = [
    { t: s.discT, mc: 'mc.percent.change-reported-as-final-amount', say: `${usd(s.discT, true)} is the discount, the amount you save. The sale price is what is left: ${usd(P, true)} − ${usd(s.discT, true)}.` },
    { t: P + s.discT, mc: 'mc.percent.wrong-direction-of-change', say: `A discount comes off: subtract the ${usd(s.discT, true)}, don't add it.` },
  ];
  if (p * TICK < P) w.push({ t: P - p * TICK, mc: 'mc.percent.adds-or-subtracts-percent-numeral', say: `That takes $${p} off. ${p}% off is ${p}% OF ${usd(P, true)}, which is ${usd(s.discT, true)}.` });
  return w;
}
const salePrice: Gen = (R, n) => {
  const C = pick(R, THINGS);
  const { P, p } = saleCase(R);
  const s = percentSale(P, p), route = discountRoute(s), cents = hasCents(s.discT / CENT);
  const bench = [10, 20, 25, 50].includes(p);
  return moneyItem({
    id: `salePrice-${n}`, family: 'salePrice',
    prompt: `${cap(C.a)} ${costs(C)} ${A(usd(P * CENT))} and ${is(C)} on sale at ${B(`${p}% off`)}. What is the sale price (before tax)? ${bench ? NOCALC : CALC}`,
    board: `${usdTex(P * CENT)} - ${pctT(p)}\\ \\text{of}\\ ${usdTex(P * CENT)} = \\$\\,?`,
    picture: { bar: { price: P, pct: p, item: C.tag, cents, ticks: cellsFor(p), hide: { disc: true, sale: true }, words: true }, solved: { price: P, pct: p, item: C.tag, cents, ticks: cellsFor(p) }, pre: ['tag', 'bar', 'whole', 'ticks', 'cut', 'disc', 'sale'], post: ['tagSale'], pulse: ['disc', 'sale'], work: [...route.tex.slice(-1), `${usdTex(P * CENT, cents)} - ${usdTex(s.discT, cents)} = ${usdTex(s.saleT, cents)}`] },
    solution: [...route.html, `Sale price: ${A(usd(P * CENT, cents))} − ${B(usd(s.discT, cents))} = ${S(usd(s.saleT, cents))}.`],
    t: s.saleT, wrongs: saleWrongs(s), right: `Yes: ${usd(s.discT, cents)} off, so you pay ${usd(s.saleT, cents)}.`, hint: `First find the discount, ${p}% of ${usd(P * CENT)}, then take it away from ${usd(P * CENT)}.`,
  });
};
const saveAndPay: Gen = (R, n) => {
  const C = pick(R, THINGS);
  const { P, p } = saleCase(R);
  const s = percentSale(P, p), route = discountRoute(s), cents = hasCents(s.discT / CENT);
  const D = s.discT / TICK, Sv = s.saleT / TICK;
  return {
    id: `saveAndPay-${n}`, family: 'saveAndPay', input: 'pair', pairLead: 'amount saved $', pairOp: 'sale price $',
    prompt: `${cap(C.the)}: ${A(usd(P * CENT))}, ${B(`${p}% off`)}. Fill in both: the amount saved and the sale price (before tax). ${[10, 20, 25, 50].includes(p) ? NOCALC : CALC}`,
    board: `${usdTex(P * CENT)} = \\$\\,? + \\$\\,?`,
    picture: { bar: { price: P, pct: p, item: C.tag, cents, ticks: cellsFor(p), hide: { disc: true, sale: true } }, solved: { price: P, pct: p, item: C.tag, cents, ticks: cellsFor(p) }, pre: ['tag', 'bar', 'whole', 'ticks', 'cut', 'disc', 'sale'], post: ['tagSale'], pulse: ['disc', 'sale'], work: [...route.tex.slice(-1), `${usdTex(P * CENT, cents)} - ${usdTex(s.discT, cents)} = ${usdTex(s.saleT, cents)}`] },
    solution: [...route.html, `Sale price: ${A(usd(P * CENT, cents))} − ${B(usd(s.discT, cents))} = ${S(usd(s.saleT, cents))}.`],
    answer: { kind: 'pair', x: D, y: Sv },
    check(r: Response): Verdict {
      if (r.kind !== 'pair') return { ok: false, say: 'Fill in both boxes.' };
      const x = toTicks(r.x), y = toTicks(r.y);
      if (x === null || y === null) return { ok: false, say: 'Type each amount as a number, like 12.50 (no $ sign).' };
      if (x === s.discT && y === s.saleT) return { ok: true, say: `Yes: you save ${usd(s.discT, cents)} and pay ${usd(s.saleT, cents)}. Together they make ${usd(P * CENT, cents)}.` };
      if (x === s.saleT && y === s.discT) return { ok: false, mc: 'mc.percent.change-reported-as-final-amount', say: `The two amounts are swapped: ${p}% of the price is what you SAVE, the rest is what you pay.` };
      if (x === s.discT) {
        const w = saleWrongs(s).find(v => v.t === y && v.t !== s.saleT);
        return w ? { ok: false, mc: w.mc, say: `The saving is right. ${w.say}` } : { ok: false, say: `The saving is right. Now take it away from ${usd(P * CENT)}.` };
      }
      if (x === p * TICK && x !== s.discT) return { ok: false, mc: 'mc.percent.percent-as-fixed-amount', say: `${p}% is not $${p}: find ${p}% OF ${usd(P * CENT)}.` };
      return { ok: false, say: `Find the discount first: ${p}% of ${usd(P * CENT)}. Then the sale price is the rest.` };
    },
  };
};

// =============== 7. multiply-cents-prices ===============
function centsCase(R: () => number): Sale {
  let s: Sale;
  do { s = percentSale(shopPrice(R, 3, 60), pick(R, [5, 10, 15, 20, 25, 30, 35, 12, 8, 40])); } while (s.discT % CENT === 0);
  return s;
}
const exactDisc: Gen = (R, n) => {
  const C = pick(R, THINGS), s = centsCase(R), p = s.pct!, P = s.origT, d = s.discT;
  const wrongs: MWrong[] = [
    { t: roundCent(d), mc: 'mc.decimals.money-only-two-places', say: `That is rounded. The exact discount has parts of a cent: ${usd(d)}. Keep it exact for now.` },
    { t: truncCent(d), mc: 'mc.decimals.money-only-two-places', say: `That cuts digits off. The exact discount is ${usd(d)}: a real dollar amount, kept until the end.` },
    { t: d * 10, mc: 'mc.decimals.product-decimal-scale-not-preserved', say: `The decimal point slipped. ${m(p)} × ${usd(P)} must be less than ${usd(P)}, about ${usd(roundCent(d))}.` },
  ];
  if (d % 10 === 0) wrongs.push({ t: d / 10, mc: 'mc.decimals.product-decimal-scale-not-preserved', say: `The decimal point slipped: ${m(p)} × ${usd(P)} is about ${usd(roundCent(d))}, not that small.` });
  return moneyItem({
    id: `exactDisc-${n}`, family: 'exactDisc',
    prompt: `${cap(C.the)} ${costs(C)} ${A(usd(P))}. Find the exact ${B(`${p}% discount`)}: do not round, keep every digit. ${CALC}`,
    board: `${m(p)} \\times ${usdTex(P)} = \\$\\,?`,
    picture: { bar: { price: s.price, pct: p, item: C.tag, cents: true, hide: { disc: true }, words: false }, pre: ['tag', 'bar', 'whole', 'cut', 'disc'], post: [], pulse: ['disc'], work: [`${m(p)} \\times ${usdTex(P)} = ${usdTex(d)}`] },
    solution: [`${p}% = ${m(p)}.`, `${m(p)} × ${A(usd(P))} = ${B(usd(d))}. It has parts of a cent, and that is fine: it is exact.`],
    t: d, wrongs, right: `Yes: exactly ${usd(d)}. Keep it unrounded until the final price.`, hint: `Multiply ${m(p)} × ${usd(P)} and write every digit.`,
  });
};
const keepExact: Gen = (R, n) => {
  const s = centsCase(R), p = s.pct!, P = s.origT, d = s.discT;
  return choiceItem(R, {
    id: `keepExact-${n}`, family: 'keepExact',
    prompt: `The calculator shows ${digits(d)} for ${B(`${p}% of ${usd(P)}`)}. What do you write for the exact discount? ${CALC}`,
    board: `${m(p)} \\times ${usdTex(P)} = ${digits(d)}`,
    picture: { bar: { price: s.price, pct: p, cents: true, words: false }, pre: ['bar', 'whole', 'cut'], post: ['disc'], pulse: ['disc'], work: [`\\text{exact discount} = ${usdTex(d)}`] },
    solution: [`${usd(d)} is a real, exact dollar amount: ${usd(truncCent(d))} and a part of a cent.`, `Keep it exact; only the final sale price gets rounded to the cent.`],
    opts: [
      { t: `${usd(d)}: an exact discount can have parts of a cent`, ok: true, say: 'Yes. Keep the exact value until the final price.' },
      { t: 'It must be wrong: money has only two decimal places', ok: false, mc: 'mc.decimals.money-only-two-places', say: `Prices you PAY have two decimal places, but an exact in-between amount can have more: ${usd(d)} is fine.` },
      { t: usd(d * 10), ok: false, mc: 'mc.decimals.product-decimal-scale-not-preserved', say: `${p}% of ${usd(P)} is less than ${usd(P)}. The decimal point stays where the calculator puts it: ${usd(d)}.` },
    ],
  });
};

// =============== 8. round-to-cent ===============
function roundCase(R: () => number, wantFirstDiffers: boolean): Sale {
  for (let i = 0; i < 400; i++) {
    const half = R() < 0.4;
    const s = half ? percentSale(int(R, 3, 60) * 100 + pick(R, [95, 45, 15, 35, 75]), 10) : percentSale(shopPrice(R, 3, 60), pick(R, [15, 35, 12, 30, 25, 5]));
    if (s.saleT % CENT === 0) continue;
    const trunc = truncCent(s.saleT), first = saleRoundingDiscountFirst(s);
    if (wantFirstDiffers && first === s.saleRT) continue;
    if (!wantFirstDiffers && trunc === s.saleRT && R() < 0.75) continue;
    return s;
  }
  return percentSale(1995, 10);
}
const roundFinal: Gen = (R, n) => {
  const C = pick(R, THINGS), s = roundCase(R, false), p = s.pct!, P = s.origT;
  const supply = s.discT % 10 !== 0;     // 4 decimal places: the item supplies the exact difference (calculator)
  const first = saleRoundingDiscountFirst(s), trunc = truncCent(s.saleT);
  const wFirst: MWrong = { t: first, mc: 'mc.decimals.intermediate-precision-always-invalid', say: `That rounds the discount first. The rule: keep ${usd(s.discT)} exact and round only the final price.` };
  const wTrunc: MWrong = { t: trunc, mc: 'mc.decimals.truncates-instead-of-rounding', say: `That cuts the digits off. Look at the next digit: ${usd(s.saleT)} is closer to ${usd(s.saleRT)}.` };
  return moneyItem({
    id: `roundFinal-${n}`, family: 'roundFinal',
    prompt: `${cap(C.the)} ${costs(C)} ${A(usd(P))}, ${B(`${p}% off`)}. The exact discount is ${B(usd(s.discT))}${supply ? `, and the exact difference is ${usd(P)} − ${usd(s.discT)} = ${usd(s.saleT)}` : ''}. What is the sale price, to the nearest cent? ${POLICY} ${supply ? CALC : NOCALC}`,
    board: supply ? `${usdTex(s.saleT)} \\approx \\$\\,?` : `${usdTex(P)} - ${usdTex(s.discT)} = \\$\\,?`,
    picture: { bar: { price: s.price, pct: p, item: C.tag, cents: true, hide: { sale: true } }, solved: { price: s.price, pct: p, item: C.tag, cents: true }, pre: ['tag', 'bar', 'whole', 'cut', 'disc', 'sale'], post: ['tagSale'], pulse: ['sale', 'tag'], work: [`${usdTex(P)} - ${usdTex(s.discT)}`, `= ${usdTex(s.saleT)} \\approx ${usdTex(s.saleRT)}`] },
    solution: [`Exact sale price: ${usd(P)} − ${usd(s.discT)} = ${usd(s.saleT)}.`, `Round only this final price to the cent: ${S(usd(s.saleRT))}.`],
    t: s.saleRT,
    wrongs: [
      { t: s.saleT, mc: 'mc.estimation.more-digits-more-accurate', say: `${usd(s.saleT)} is exact, but a price you pay is rounded to the cent: ${usd(s.saleRT)}.` },
      ...(supply ? [wTrunc, wFirst] : [wFirst, wTrunc]),
    ],
    right: `Yes: ${usd(s.saleT)} rounds to ${usd(s.saleRT)}.`, hint: `Find the exact sale price, then round it to the nearest cent.`,
  });
};
const policy: Gen = (R, n) => {
  const s = roundCase(R, true), p = s.pct!, P = s.origT;
  const [a, b] = shuffle(R, NAMES.slice()).slice(0, 2) as [string, string];
  const first = saleRoundingDiscountFirst(s);
  return choiceItem(R, {
    id: `policy-${n}`, family: 'policy',
    prompt: `${B(`${p}% off`)} ${A(usd(P))}. ${a} rounds the discount first: ${usd(roundCent(s.discT))} off, so ${usd(first)}. ${b} keeps the exact ${usd(s.discT)} and rounds at the end: ${usd(s.saleT)}, so ${usd(s.saleRT)}. ${POLICY} Who follows the rule?`,
    board: `${usdTex(first)} \\quad \\text{or} \\quad ${usdTex(s.saleRT)}`,
    picture: { bar: { price: s.price, pct: p, cents: true, exactSale: true }, solved: { price: s.price, pct: p, cents: true }, pre: ['bar', 'whole', 'cut', 'disc', 'sale'], post: [], pulse: ['sale'], work: [`${usdTex(s.saleT)} \\approx ${usdTex(s.saleRT)}`] },
    solution: [`The rule keeps the discount exact: ${usd(s.discT)}.`, `Exact sale price ${usd(s.saleT)}, rounded once at the end: ${S(usd(s.saleRT))}.`],
    opts: [
      { t: `${b}: round only the final price`, ok: true, say: `Yes. Rounding the discount first moves the answer by a cent; the rule rounds once, at the end.` },
      { t: `${a}: money must always have two decimal places`, ok: false, mc: 'mc.decimals.intermediate-precision-always-invalid', say: `The FINAL price needs two places. In-between amounts stay exact, so ${a}'s early rounding breaks the rule.` },
      { t: `Neither: the price is ${usd(s.saleT)}, it is more exact`, ok: false, mc: 'mc.estimation.more-digits-more-accurate', say: `More digits is not better for a price you pay: it is rounded to the cent, ${usd(s.saleRT)}.` },
    ],
  });
};

// =============== 9. percent-paid ===============
const PAID_P = [25, 15, 35, 5, 0, 50, 100, 60, 65, 70, 75, 80, 85, 90, 45, 12, 8, 55];
const pctPaid: Gen = (R, n) => {
  const C = pick(R, THINGS), p = pick(R, PAID_P);
  let P = 0;
  do { P = dollars(R, 6, 200); } while (P === 10000);
  const q = 100 - p;
  const wrongs: NWrong[] = [{ v: p, mc: 'mc.percent.change-reported-as-final-amount', say: `${p}% is the part that comes OFF. You pay the rest of the bar.` }];
  for (const v of [q + 10, q - 10]) if (v >= 0 && v <= 100 && v !== p) wrongs.push({ v, mc: 'mc.percent.complement-miscomputed', say: `Check the subtraction: ${p} + ? = 100.` });
  return percentItem({
    id: `pctPaid-${n}`, family: 'pctPaid',
    prompt: `${cap(C.the)} ${is(C)} ${B(`${p}% off`)}. What percent of the original price do you pay? ${NOCALC}`,
    board: `${pctT(p)}\\ \\text{off} \\;\\to\\; \\text{you pay}\\ ?\\%`,
    picture: { bar: { price: P, pct: p, item: C.tag, hide: { paid: true }, amounts: false }, pre: ['tag', 'bar', 'whole', 'cut', 'disc', 'sale', 'paid'], post: [], pulse: ['sale'], work: [`100\\% - ${pctT(p)} = ${pctT(q)}`] },
    solution: [`The whole bar is 100% of the original price.`, `${p}% comes off, so you pay 100% − ${p}% = ${S(`${q}%`)}.`],
    v: q, wrongs, right: `Yes: ${p}% off, ${q}% paid. Together they make 100%.`, hint: `The discount and what you pay fill one 100% bar.`,
  });
};
const paidOfWhat: Gen = (R, n) => {
  const C = pick(R, THINGS), p = pick(R, [10, 15, 20, 25, 30, 35, 40, 60, 70, 75]);
  const P = dollars(R, 10, 160), s = percentSale(P, p), q = 100 - p;
  return choiceItem(R, {
    id: `paidOfWhat-${n}`, family: 'paidOfWhat',
    prompt: `${cap(C.the)}: ${A(usd(s.origT))}, ${B(`${p}% off`)}, a discount of ${B(usd(s.discT))}. You pay ${q}%. ${q}% of which amount? ${NOCALC}`,
    board: `${pctT(q)}\\ \\text{of}\\ \\ ?`,
    picture: { bar: { price: P, pct: p, item: C.tag }, pre: ['tag', 'bar', 'whole', 'cut', 'disc'], post: ['sale', 'paid'], pulse: ['orig'], work: [`${pctT(q)}\\ \\text{of}\\ ${usdTex(s.origT)} = ${usdTex(s.saleT)}`] },
    solution: [`Every percent in a sale is a percent of the original price: the whole bar.`, `You pay ${q}% of ${A(usd(s.origT))}, which is ${S(usd(s.saleT))}.`],
    opts: [
      { t: `The original price, ${usd(s.origT)}`, ok: true, say: `Yes: ${q}% of the original ${usd(s.origT)}.` },
      { t: `The discount, ${usd(s.discT)}`, ok: false, mc: 'mc.fraction-ops.uses-nonreference-quantity-as-whole', say: `The ${usd(s.discT)} is a part, not the whole. Both ${p}% and ${q}% are parts of the original ${usd(s.origT)}.` },
      { t: 'The sale price', ok: false, mc: 'mc.fraction-ops.uses-nonreference-quantity-as-whole', say: `The ${q}% IS the sale price, as a part of the whole. The whole is the original ${usd(s.origT)}.` },
    ],
  });
};

// =============== 10. one-step-remaining ===============
function oneStepCase(R: () => number): Sale {
  const r = R();
  if (r < 0.35) return percentSale(dollars(R, 8, 160), pick(R, [25, 10, 20, 50]));
  if (r < 0.7) return percentSale(dollars(R, 10, 200), pick(R, [15, 35, 40, 65, 45, 30, 12, 60]));
  return percentSale(shopPrice(R, 4, 80), pick(R, [15, 25, 35, 20, 30, 40]));
}
const oneStep: Gen = (R, n) => {
  const C = pick(R, THINGS), s = oneStepCase(R), p = s.pct!, q = 100 - p, P = s.origT, cents = hasCents(s.price);
  const wrongs: MWrong[] = [
    { t: roundCent(s.discT), mc: 'mc.percent.change-reported-as-final-amount', say: `${m(p)} × ${usd(P)} is the discount. One step to the sale price uses the percent you PAY, ${q}%.` },
    { t: roundCent(Math.max(0, s.saleT - s.discT)), mc: 'mc.percent.double-subtracts-discount', say: `${m(q)} × ${usd(P)} already has the discount taken off. Don't subtract it again.` },
    { t: roundCent(Math.round((s.discT * q) / 100)), mc: 'mc.fraction-ops.uses-nonreference-quantity-as-whole', say: `Use ${q}% of the ORIGINAL price ${usd(P)}, not of the discount.` },
  ];
  if (cents) wrongs.push({ t: s.saleT, mc: 'mc.estimation.more-digits-more-accurate', say: `Round the final price to the cent: ${usd(s.saleT)} is about ${usd(s.saleRT)}.` });
  return moneyItem({
    id: `oneStep-${n}`, family: 'oneStep',
    prompt: `${cap(C.a)} ${costs(C)} ${A(usd(P, cents))} and ${is(C)} ${B(`${p}% off`)}. Find the sale price with ONE multiplication: use the percent you pay. ${cents ? `${POLICY} ${CALC}` : [25, 10, 20, 50].includes(p) ? NOCALC : CALC}`,
    board: `\\square \\times ${usdTex(P, cents)} = \\text{sale price}`,
    picture: { bar: { price: s.price, pct: p, item: C.tag, cents, hide: { sale: true, paid: true, disc: true } }, solved: { price: s.price, pct: p, item: C.tag, cents }, pre: ['tag', 'bar', 'whole', 'cut', 'disc', 'sale', 'paid'], post: ['tagSale'], pulse: ['sale'], work: [`100\\% - ${pctT(p)} = ${pctT(q)}`, `${m(q)} \\times ${usdTex(P, cents)} = ${usdTex(s.saleT, cents)}`, ...(s.saleT !== s.saleRT ? [`\\approx ${usdTex(s.saleRT)}`] : [])] },
    solution: [`${p}% off means you pay 100% − ${p}% = ${q}% of the original.`, `${m(q)} × ${A(usd(P, cents))} = ${S(usd(s.saleT, cents))}${s.saleT !== s.saleRT ? `, so ${S(usd(s.saleRT))}` : ''}.`],
    t: s.saleRT, wrongs, right: `Yes: ${m(q)} × ${usd(P, cents)} = ${usd(s.saleRT, cents)}, in one step.`, hint: `You pay ${100 - p}% of ${usd(P, cents)}: multiply by ${m(100 - p)}.`,
  });
};
const whichProduct: Gen = (R, n) => {
  const C = pick(R, THINGS);
  let s: Sale;
  do { s = oneStepCase(R); } while (s.pct === 50 || hasCents(s.price));
  const p = s.pct!, q = 100 - p, P = s.origT;
  return choiceItem(R, {
    id: `whichProduct-${n}`, family: 'whichProduct',
    prompt: `${cap(C.the)}: ${A(usd(P))}, ${B(`${p}% off`)} (that is ${B(usd(s.discT))} off). Which ONE calculation gives the sale price? ${NOCALC}`,
    board: `${pctT(p)}\\ \\text{off}\\ ${usdTex(P)}`,
    picture: { bar: { price: s.price, pct: p, item: C.tag, hide: { sale: true } }, solved: { price: s.price, pct: p, item: C.tag }, pre: ['tag', 'bar', 'whole', 'cut', 'disc', 'sale'], post: ['paid', 'tagSale'], pulse: ['sale'], work: [`${m(q)} \\times ${usdTex(P)} = ${usdTex(s.saleT)}`] },
    solution: [`You pay ${q}% of the original price.`, `${m(q)} × ${A(usd(P))} = ${S(usd(s.saleT))}.`],
    opts: [
      { t: `${m(q)} × ${usd(P)}`, ok: true, say: `Yes: you pay ${q}% of ${usd(P)}.` },
      { t: `${m(p)} × ${usd(P)}`, ok: false, mc: 'mc.percent.change-reported-as-final-amount', say: `That is the discount, the part you don't pay.` },
      { t: `${m(q)} × ${usd(P)} − ${usd(s.discT)}`, ok: false, mc: 'mc.percent.double-subtracts-discount', say: `${m(q)} × ${usd(P)} already leaves the discount out. Taking ${usd(s.discT)} off again counts it twice.` },
      { t: `${m(q)} × ${usd(s.discT)}`, ok: false, mc: 'mc.fraction-ops.uses-nonreference-quantity-as-whole', say: `The ${q}% is of the whole price, ${usd(P)}, not of the discount.` },
    ],
  });
};

// =============== 11. explain-equivalence ===============
const whyAgree: Gen = (R, n) => {
  const p = pick(R, [15, 20, 25, 30, 35, 40, 60, 65]), q = 100 - p;
  const P = dollars(R, 4, 30) * 2, s = percentSale(P, p);
  const [a, b] = shuffle(R, NAMES.slice()).slice(0, 2) as [string, string];
  const pic: DiscPicture = { bar: { price: P, pct: p }, pre: ['bar', 'whole', 'cut', 'disc', 'sale', 'paid'], post: [], pulse: ['disc', 'sale'], work: [`${pctT(p)} + ${pctT(q)} = 100\\%`] };
  if (R() < 0.55) {
    return choiceItem(R, {
      id: `whyAgree-${n}`, family: 'whyAgree',
      prompt: `${a}: ${usd(s.origT)} − ${p}% of ${usd(s.origT)} = ${usd(s.saleT)}. ${b}: ${q}% of ${usd(s.origT)} = ${usd(s.saleT)}. Why do the two ways ALWAYS agree, for every price? ${NOCALC}`,
      board: `${pctT(p)}\\ \\text{off} \\;\\to\\; \\text{pay}\\ ${pctT(q)}`,
      picture: pic,
      solution: [`The ${B(`${p}%`)} you don't pay and the ${S(`${q}%`)} you pay are two parts of one 100% bar.`, `Taking the ${p}% part away always leaves the ${q}% part, whatever the price.`],
      opts: [
        { t: `The ${p}% you don't pay and the ${q}% you pay are two parts of the same bar`, ok: true, say: `Yes: taking away the ${p}% part leaves the ${q}% part, for any price.` },
        { t: 'They agree only for some prices, so you have to check each time', ok: false, mc: 'mc.reasoning-language.methods-can-disagree', say: `Two correct ways to the same amount cannot disagree: both find the ${q}% part of the same bar.` },
        { t: `We tried ${usd(s.origT)} and it worked, so it always works`, ok: false, mc: 'mc.reasoning-language.examples-as-proof', say: `One example does not show EVERY price. The bar does: ${p}% + ${q}% = 100% for any price.` },
      ],
    });
  }
  return choiceItem(R, {
    id: `whyAgree-${n}`, family: 'whyAgree',
    prompt: `Which line shows that P − ${m(p)}P is the same as ${m(q)}P for EVERY price P? ${NOCALC}`,
    board: `P - ${m(p)}P \\;\\overset{?}{=}\\; ${m(q)}P`,
    picture: pic,
    solution: [`P is 1P, so take ${m(p)} of it away: P − ${m(p)}P = (1 − ${m(p)})P = ${m(q)}P.`, `That is the bar: 100% − ${p}% = ${q}% of the same price.`],
    opts: [
      { t: `P − ${m(p)}P = (1 − ${m(p)})P = ${m(q)}P`, ok: true, say: 'Yes: P is one whole P, and taking a part of it away leaves the rest of the same P.' },
      { t: `Try P = ${s.origT / TICK}: both give ${usd(s.saleT)}`, ok: false, mc: 'mc.reasoning-language.examples-as-proof', say: 'One price is an example, not a reason. The line has to work for every P.' },
      { t: `P − ${m(p)}P = ${m(q)}`, ok: false, say: `The P doesn't disappear: P − ${m(p)}P = ${m(q)}P, a part of the price.` },
    ],
  });
};

// =============== 12. check-and-correct ===============
type ClaimKind = 'right' | 'discAsPrice' | 'pctAsDollars' | 'pointFive' | 'roundFirst' | 'wrongBase';
const checkClaim: Gen = (R, n) => {
  const name = pick(R, NAMES), C = pick(R, THINGS);
  const kind = pick(R, ['right', 'right', 'discAsPrice', 'pctAsDollars', 'pointFive', 'roundFirst', 'wrongBase'] as ClaimKind[]);
  let s: Sale;
  if (kind === 'pointFive') s = percentSale(dollars(R, 12, 120), 5);
  else if (kind === 'roundFirst') s = roundCase(R, true);
  else s = percentSale(R() < 0.3 ? shopPrice(R, 10, 90) : dollars(R, 12, 160), pick(R, [15, 20, 25, 30, 35, 40, 60, 65, 70, 75, 80]));
  const p = s.pct!, P = s.origT, K = s.saleRT, cents = hasCents(s.price) || hasCents(s.discT / CENT);
  const errs: Record<Exclude<ClaimKind, 'right'>, number> = {
    discAsPrice: roundCent(s.discT),
    pctAsDollars: Math.max(0, P - p * TICK),
    pointFive: Math.max(0, P - P / 2),
    roundFirst: saleRoundingDiscountFirst(s),
    wrongBase: roundCent(Math.round((s.discT * (100 - p)) / 100)),
  };
  let k2: ClaimKind = kind;
  if (k2 !== 'right' && errs[k2] === K) k2 = 'right';
  const claim = k2 === 'right' ? K : errs[k2];
  const why: Record<ClaimKind, string> = {
    right: 'That is right.',
    discAsPrice: `${usd(claim, cents)} is the discount, not the price you pay.`,
    pctAsDollars: `That takes $${p} off instead of ${p}% of the price.`,
    pointFive: `That uses 0.5 for 5%. 5% is 0.05.`,
    roundFirst: `That rounds the discount first; the rule rounds only the final price.`,
    wrongBase: `That takes ${100 - p}% of the discount, not of the original price.`,
  };
  const others = [...new Set([errs.roundFirst, errs.discAsPrice, errs.pctAsDollars, errs.wrongBase, P + s.discT, P])].filter(v => v !== K && v !== claim);
  const [F, G] = others as [number, number];
  const mcOf = (v: number): string | undefined => v === errs.roundFirst && k2 === 'right' ? 'mc.estimation.rounding-gap-treated-as-error'
    : v === errs.discAsPrice ? 'mc.percent.change-reported-as-final-amount' : v === errs.pctAsDollars ? 'mc.percent.adds-or-subtracts-percent-numeral'
      : v > P ? 'mc.percent.wrong-direction-of-change' : undefined;
  const check = `Check with the percent you pay: ${100 - p}% of ${usd(P, cents)} is ${usd(K, cents)}`;
  const opts: Choice[] = k2 === 'right' ? [
    { t: `${name} is right`, ok: true, say: `Yes: ${m(100 - p)} × ${usd(P, cents)} = ${usd(s.saleT, cents)}${s.saleT !== K ? `, ${usd(K)} to the cent` : ''}.` },
    { t: `Wrong: it should be ${usd(F, cents)}`, ok: false, mc: mcOf(F), say: `${check}, so ${name} is right.` },
    { t: `Wrong: it should be ${usd(G, cents)}`, ok: false, mc: mcOf(G), say: `${check}, so ${name} is right.` },
  ] : [
    { t: `${name} is right`, ok: false, mc: claim < P ? 'mc.estimation.one-sided-bound-check' : 'mc.estimation.accepts-result-without-size-check', say: `Being less than ${usd(P, cents)} is not enough. ${check}. ${why[k2]}` },
    { t: `Wrong: it should be ${usd(K, cents)}`, ok: true, say: `Yes. ${why[k2]} ${m(100 - p)} × ${usd(P, cents)} = ${usd(K, cents)}.` },
    { t: `Wrong: it should be ${usd(F, cents)}`, ok: false, mc: mcOf(F), say: `${check}.` },
  ];
  return choiceItem(R, {
    id: `checkClaim-${n}`, family: 'checkClaim',
    prompt: `${cap(C.the)} ${costs(C)} ${A(usd(P, cents))} and ${is(C)} ${B(`${p}% off`)}. ${name} says the sale price is ${usd(claim, cents)}. Check it with the percent you pay. ${k2 === 'roundFirst' || hasCents(s.price) ? POLICY : ''} ${cents ? CALC : NOCALC}`,
    board: `\\text{${name}:}\\ ${usdTex(claim, cents)}\\ ?`,
    picture: { bar: { price: s.price, pct: p, item: C.tag, cents, hide: { sale: true } }, solved: { price: s.price, pct: p, item: C.tag, cents }, pre: ['tag', 'bar', 'whole', 'cut', 'disc', 'sale'], post: ['paid', 'tagSale'], pulse: ['sale'], work: [`${m(100 - p)} \\times ${usdTex(P, cents)} = ${usdTex(s.saleT, cents)}`, ...(s.saleT !== K ? [`\\approx ${usdTex(K)}`] : [])] },
    solution: [`You pay ${100 - p}% of the original: ${m(100 - p)} × ${A(usd(P, cents))} = ${S(usd(s.saleT, cents))}${s.saleT !== K ? `, ${S(usd(K))} to the cent` : ''}.`, k2 === 'right' ? `${name}'s ${usd(claim, cents)} matches.` : `${why[k2]}`],
    opts,
  });
};

// =============== 13. estimate-reasonableness ===============
const estimate: Gen = (R, n) => {
  const C = pick(R, THINGS);
  let p = 0, Pr = 0, s: Sale, E = 0;
  do {
    p = pick(R, [10, 20, 25, 30, 40, 60, 70, 75]);
    Pr = int(R, 1, 40) * 5;
    s = percentSale(Pr * 100 - pick(R, [1, 5]), p);
    E = (Pr * (100 - p)) / 100;
  } while (Pr < 10 || E === (Pr * p) / 100 || E === Pr - p || (Pr * p) / 100 === Pr - p || Pr - p <= 0 || !Number.isInteger(E * 2) || !Number.isInteger((Pr * p) / 50));
  const $e = (v: number) => `$${Number.isInteger(v) ? v : v.toFixed(2)}`;
  if (R() < 0.5) {
    return choiceItem(R, {
      id: `estimate-${n}`, family: 'estimate',
      prompt: `${cap(C.the)} ${costs(C)} ${A(usd(s.origT))} and ${is(C)} ${B(`${p}% off`)}. Which is the best estimate of the sale price? ${NOCALC}`,
      board: `${pctT(p)}\\ \\text{off}\\ ${usdTex(s.origT)} \\approx \\ ?`,
      picture: { bar: { price: s.price, pct: p, item: C.tag, cents: true, hide: { sale: true, disc: true } }, solved: { price: s.price, pct: p, item: C.tag, cents: true }, pre: ['tag', 'bar', 'whole', 'cut', 'disc', 'sale'], post: ['paid'], pulse: ['sale'], work: [`${usdTex(s.origT)} \\approx \\$${Pr}`, `${pctT(100 - p)}\\ \\text{of}\\ \\$${Pr} = ${$e(E).replace('$', '\\$')}`] },
      solution: [`${usd(s.origT)} is about $${Pr}.`, `${p}% off: you pay ${100 - p}% of about $${Pr}, about ${S($e(E))}.`],
      opts: [
        { t: `About ${$e(E)}`, ok: true, say: `Yes: ${100 - p}% of about $${Pr}. The exact price is ${usd(s.saleRT)}.` },
        { t: `About ${$e((Pr * p) / 100)}`, ok: false, mc: 'mc.percent.change-reported-as-final-amount', say: `That is about the discount, the part you DON'T pay. You pay ${100 - p}% of about $${Pr}.` },
        { t: `About ${$e(Pr - p)}`, ok: false, mc: 'mc.percent.adds-or-subtracts-percent-numeral', say: `That takes $${p} off. ${p}% of about $${Pr} is a different amount.` },
      ],
    });
  }
  const showsDisc = R() < 0.55, receipt = showsDisc ? roundCent(s.discT) : s.saleRT;
  return choiceItem(R, {
    id: `estimate-${n}`, family: 'estimate',
    prompt: `A receipt says: ${C.tag.toLowerCase()} ${A(usd(s.origT))}, ${B(`${p}% off`)}, you pay ${usd(receipt)}. Is that reasonable? ${NOCALC}`,
    board: `${pctT(p)}\\ \\text{off}\\ ${usdTex(s.origT)} \\to ${usdTex(receipt)}\\ ?`,
    picture: { bar: { price: s.price, pct: p, item: C.tag, cents: true, hide: { sale: true, disc: true } }, solved: { price: s.price, pct: p, item: C.tag, cents: true }, pre: ['tag', 'bar', 'whole', 'cut', 'disc', 'sale'], post: ['paid'], pulse: ['sale'], work: [`${pctT(100 - p)}\\ \\text{of}\\ \\$${Pr} = ${$e(E).replace('$', '\\$')}`] },
    solution: [`Estimate: ${usd(s.origT)} is about $${Pr}, and you pay ${100 - p}% of it, about ${S($e(E))}.`, showsDisc ? `${usd(receipt)} is about the DISCOUNT, not the price.` : `${usd(receipt)} is close to the estimate, so it is reasonable.`],
    opts: showsDisc ? [
      { t: `No: you pay about ${100 - p}% of $${Pr}, about ${$e(E)}`, ok: true, say: `Right: ${usd(receipt)} is about the discount. The sale price is ${usd(s.saleRT)}.` },
      { t: `Yes: it is less than ${usd(s.origT)}`, ok: false, mc: 'mc.estimation.accepts-result-without-size-check', say: `Less than the price is not enough. Estimate it: ${100 - p}% of about $${Pr} is about ${$e(E)}.` },
      { t: 'Yes: a sale price is always the smaller amount', ok: false, mc: 'mc.percent.smaller-amount-always-discount', say: `With ${p}% off, the price you pay is about ${$e(E)}. Check the size.` },
    ] : [
      { t: `Yes: about ${100 - p}% of $${Pr} is ${$e(E)}, close to ${usd(receipt)}`, ok: true, say: `Right: the estimate and the receipt are close.` },
      { t: `No: it should be exactly ${$e(E)}`, ok: false, mc: 'mc.estimation.rounding-gap-treated-as-error', say: `${$e(E)} is an estimate from a rounded price. A small gap is expected; the exact price is ${usd(receipt)}.` },
      { t: 'No: a sale price must be less than half', ok: false, say: `Only a discount above 50% makes the price less than half. ${p}% off leaves ${100 - p}%.` },
    ],
  });
};
const bounds: Gen = (R, n) => {
  const C = pick(R, THINGS), v = R();
  if (v < 0.45) {
    const p = pick(R, [5, 10, 20, 25, 30, 40, 45, 50, 55, 60, 65, 70, 75, 80, 90]);
    const P = R() < 0.4 ? shopPrice(R, 4, 150) : dollars(R, 6, 200), s = percentSale(P, p), cents = hasCents(P);
    const ans = p < 50 ? 'more' : p === 50 ? 'half' : 'less';
    const why = p < 50 ? `Less than half comes off, so more than half is left.` : p === 50 ? `50% off is exactly half.` : `More than half comes off, so less than half is left.`;
    return choiceItem(R, {
      id: `bounds-${n}`, family: 'bounds',
      prompt: `${cap(C.the)}: ${A(usd(s.origT, cents))}, ${B(`${p}% off`)}. Is the exact sale price more than half, exactly half, or less than half of ${usd(s.origT, cents)}? ${NOCALC}`,
      board: `${pctT(p)}\\ \\text{off}: \\ \\text{half?}`,
      picture: { bar: { price: P, pct: p, cents, hide: { sale: true, disc: true }, words: true }, solved: { price: P, pct: p, cents }, pre: ['bar', 'whole', 'cut', 'disc', 'sale', 'half'], post: ['paid'], pulse: ['sale'], work: [`\\text{you pay}\\ ${pctT(100 - p)}`] },
      solution: [`Half price is 50% off.`, `${why} You pay ${S(`${100 - p}%`)}.`],
      opts: [
        { t: 'More than half', ok: ans === 'more', say: ans === 'more' ? `Yes. ${why}` : why },
        { t: 'Exactly half', ok: ans === 'half', say: ans === 'half' ? `Yes. ${why}` : why },
        { t: 'Less than half', ok: ans === 'less', say: ans === 'less' ? `Yes. ${why}` : why },
      ],
    });
  }
  if (v < 0.62) {
    const P = dollars(R, 5, 120);
    return choiceItem(R, {
      id: `bounds-${n}`, family: 'bounds',
      prompt: `A sign says ${B('0% off')} ${C.the} at ${A(usd(P * CENT))}. What is the sale price? ${NOCALC}`,
      board: `0\\%\\ \\text{off}\\ ${usdTex(P * CENT)}`,
      picture: { bar: { price: P, pct: 0, hide: { sale: true } }, solved: { price: P, pct: 0 }, pre: ['bar', 'whole', 'disc', 'sale'], post: ['paid'], pulse: ['sale'], work: [`100\\%\\ \\text{of}\\ ${usdTex(P * CENT)} = ${usdTex(P * CENT)}`] },
      solution: [`0% off takes nothing off.`, `You pay 100% of the price: ${S(usd(P * CENT))}, the same as before.`],
      opts: [
        { t: `${usd(P * CENT)}, the same price`, ok: true, say: 'Yes: 0% off takes nothing off.' },
        { t: `A little less than ${usd(P * CENT)}`, ok: false, mc: 'mc.percent.discount-always-strictly-lowers-price', say: `0% of the price is $0. A "discount" of 0% leaves the price where it was.` },
        { t: '$0', ok: false, say: 'That would be 100% off. 0% off takes nothing off.' },
      ],
    });
  }
  if (v < 0.72) {
    const P = dollars(R, 110, 200);
    return choiceItem(R, {
      id: `bounds-${n}`, family: 'bounds',
      prompt: `A coupon gives ${B('100% off')} ${C.the} at ${A(usd(P * CENT))}. What is the sale price? ${NOCALC}`,
      board: `100\\%\\ \\text{off}\\ ${usdTex(P * CENT)}`,
      picture: { bar: { price: P, pct: 100, hide: { sale: true } }, solved: { price: P, pct: 100 }, pre: ['bar', 'whole', 'disc', 'sale'], post: ['paid'], pulse: ['sale'], work: [`0\\%\\ \\text{of}\\ ${usdTex(P * CENT)} = \\$0`] },
      solution: [`100% off takes the whole price off.`, `You pay 0%: ${S('$0')}.`],
      opts: [
        { t: '$0: it is free', ok: true, say: 'Yes: the discount is the whole bar.' },
        { t: usd((P - 10000) * CENT), ok: false, mc: 'mc.percent.percent-as-fixed-amount', say: `100% off is not $100 off: it is the whole ${usd(P * CENT)}.` },
        { t: `${usd(P * CENT)}: a coupon cannot take everything`, ok: false, say: `100% is the whole bar. Nothing is left to pay.` },
      ],
    });
  }
  // a 50%-off receipt on an odd-cent price: half is a half cent, rounded up
  let P = 0;
  do { P = int(R, 1, 40) * 100 + int(R, 1, 99); } while (P % 2 === 0);
  const s = percentSale(P, 50), right = R() < 0.6, shown = right ? s.saleRT : truncCent(s.saleT);
  const opts: Choice[] = right ? [
    { t: `Right: half is ${usd(s.saleT)}, which rounds up to ${usd(s.saleRT)}`, ok: true, say: 'Yes: the exact half has half a cent, and halves round up.' },
    { t: `Wrong: ${usd(s.saleRT)} + ${usd(s.saleRT)} = ${usd(2 * s.saleRT)}, not ${usd(s.origT)}`, ok: false, mc: 'mc.estimation.rounding-gap-treated-as-error', say: `The 1¢ gap comes from rounding the half cent. Under the rule, ${usd(s.saleRT)} is right.` },
    { t: `Wrong: it should be ${usd(truncCent(s.saleT))}`, ok: false, mc: 'mc.decimals.truncates-instead-of-rounding', say: `${usd(s.saleT)} is halfway, and halves round UP: ${usd(s.saleRT)}.` },
  ] : [
    { t: `Wrong: half is ${usd(s.saleT)}, which rounds up to ${usd(s.saleRT)}`, ok: true, say: 'Right: the receipt cut the half cent off instead of rounding it up.' },
    { t: `Right: ${usd(shown)} is half of ${usd(s.origT)}`, ok: false, mc: 'mc.decimals.truncates-instead-of-rounding', say: `Half of ${usd(s.origT)} is ${usd(s.saleT)}. Cutting off the half cent is not rounding: it rounds up to ${usd(s.saleRT)}.` },
    { t: `Right: it is less than ${usd(s.origT)}`, ok: false, mc: 'mc.estimation.one-sided-bound-check', say: `Less than the price is not enough. Half of ${usd(s.origT)} is ${usd(s.saleT)}, so ${usd(s.saleRT)}.` },
  ];
  return choiceItem(R, {
    id: `bounds-${n}`, family: 'bounds',
    prompt: `${cap(C.the)} ${costs(C)} ${A(usd(P * CENT))}, ${B('50% off')}. The receipt says ${usd(shown)}. Is the receipt right? ${POLICY} ${NOCALC}`,
    board: `50\\%\\ \\text{off}\\ ${usdTex(P * CENT)} \\to ${usdTex(shown)}\\ ?`,
    picture: { bar: { price: P, pct: 50, cents: true, hide: { sale: true } }, solved: { price: P, pct: 50, cents: true }, pre: ['bar', 'whole', 'cut', 'disc', 'sale', 'half'], post: [], pulse: ['sale'], work: [`${usdTex(P * CENT)} \\div 2 = ${usdTex(s.saleT)}`, `\\approx ${usdTex(s.saleRT)}`] },
    solution: [`Half of ${A(usd(P * CENT))} is ${usd(s.saleT)}: half a cent.`, `Halves round up: ${S(usd(s.saleRT))}.`],
    opts,
  });
};

export const GENS: Record<string, Gen> = {
  roles, partWhole, missing, whichWhole, pctOrDollars, readSplit, judgeSplit, discAmt, salePrice, saveAndPay,
  exactDisc, keepExact, roundFinal, policy, pctPaid, paidOfWhat, oneStep, whichProduct, whyAgree, checkClaim, estimate, bounds,
};
