// items.ts: practice families for "Find the original amount after a percent change" (grade 7, 7.RP.A.3, 7.EE.A.2).
// Every family is one deep structure; a generator receives the sub-goal id and uses that sub-goal's number ranges
// (topic JSON `cases`). Every wrong answer the classifier recognises carries its id from
// math-curriculum-essentials/misconceptions.json (logged, never shown). Money is exact (reverseMaths.ts: cents and
// basis points). Pure: no DOM, no canvas.
// Colours in prompts follow the model: the original (the 100%) amber (A), the change teal (B), the new amount lime
// (S). Items that ASK which amount plays which role print the amounts plain.
import { type Gen, type Item, type Response, type Verdict, A, B, S, int, pick, shuffle } from '../../runtime/item';
import type { BaseTapeParams } from './BaseTape';
import {
  type Dir, BP, bp, decimal, decimalsOf, forwardExact, mNum, multStr, multVal, pctNum, receiptTotal, resultPct,
  reverse, rateStr, roundFrac, toCents, usd, usdTex,
} from './reverseMaths';
import { ans as mark, endOnChoice } from '../../runtime/explain';
/** the answer in the lesson's own colour (a), marked for the steps card */
const AA = (x: string) => mark(x);   // not class "a ans": .ans is the answer row in lesson.css (a flex block)

// ---------- what the page draws for an item ----------
export interface OrigPicture {
  /** the model; hidden values show "?" until the `reveal` step */ tape: BaseTapeParams;
  /** steps shown with the problem ([] = the bare notation first, the model comes with the solution) */ pre: string[];
  /** steps the worked solution adds */ post: string[];
  /** rows whose value lights up in the worked solution */ pulse: number[];
  /** TeX lines the worked solution writes on the board */ work: string[];
  [k: string]: unknown;
}

// ---------- contexts ----------
type Kind = 'off' | 'markup' | 'tax' | 'tip';
/** a thing or a service with the range of real prices it has (dollars, before any change) */
export interface Thing { tag: string; a: string; the: string; plural?: boolean; lo: number; hi: number }
export const THINGS: readonly Thing[] = [
  { tag: 'Headphones', a: 'a pair of headphones', the: 'the headphones', plural: true, lo: 15, hi: 350 },
  { tag: 'Sneakers', a: 'a pair of sneakers', the: 'the sneakers', plural: true, lo: 30, hi: 220 },
  { tag: 'Video game', a: 'a video game', the: 'the game', lo: 15, hi: 70 },
  { tag: 'Hoodie', a: 'a hoodie', the: 'the hoodie', lo: 15, hi: 90 },
  { tag: 'Skateboard', a: 'a skateboard', the: 'the skateboard', lo: 30, hi: 250 },
  { tag: 'Backpack', a: 'a backpack', the: 'the backpack', lo: 15, hi: 150 },
  { tag: 'Jacket', a: 'a jacket', the: 'the jacket', lo: 30, hi: 300 },
  { tag: 'Board game', a: 'a board game', the: 'the board game', lo: 10, hi: 80 },
  { tag: 'Soccer ball', a: 'a soccer ball', the: 'the ball', lo: 10, hi: 60 },
  { tag: 'Desk lamp', a: 'a desk lamp', the: 'the lamp', lo: 15, hi: 150 },
  { tag: 'Bike helmet', a: 'a bike helmet', the: 'the helmet', lo: 20, hi: 150 },
  { tag: 'Keyboard', a: 'a keyboard', the: 'the keyboard', lo: 15, hi: 250 },
  { tag: 'Tent', a: 'a tent', the: 'the tent', lo: 40, hi: 600 },
  { tag: 'Smartwatch', a: 'a smartwatch', the: 'the watch', lo: 50, hi: 600 },
  { tag: 'Notebook', a: 'a notebook', the: 'the notebook', lo: 2, hi: 15 },
  { tag: 'Phone case', a: 'a phone case', the: 'the case', lo: 5, hi: 60 },
  { tag: 'Water bottle', a: 'a water bottle', the: 'the bottle', lo: 5, hi: 45 },
  { tag: 'Bike', a: 'a bike', the: 'the bike', lo: 150, hi: 1500 },
  { tag: 'TV', a: 'a TV', the: 'the TV', lo: 150, hi: 2000 },
  { tag: 'Laptop', a: 'a laptop', the: 'the laptop', lo: 300, hi: 2500 },
];
export const SERVICES: readonly Thing[] = [
  { tag: 'Dinner', a: 'dinner', the: 'the dinner', lo: 15, hi: 300 },
  { tag: 'Pizza delivery', a: 'a pizza delivery', the: 'the delivery', lo: 15, hi: 100 },
  { tag: 'Haircut', a: 'a haircut', the: 'the haircut', lo: 15, hi: 120 },
  { tag: 'Taxi ride', a: 'a taxi ride', the: 'the ride', lo: 10, hi: 150 },
  { tag: 'Lunch', a: 'lunch', the: 'the lunch', lo: 8, hi: 60 },
  { tag: 'Group dinner', a: 'a group dinner', the: 'the group dinner', lo: 80, hi: 900 },
];
/** a thing whose real price range holds this price (dollars); the closest range when none does */
export function thingFor(R: () => number, list: readonly Thing[], dollars: number): Thing {
  const fits = list.filter(t => dollars >= t.lo && dollars <= t.hi);
  if (fits.length) return pick(R, fits);
  const off = (t: Thing) => Math.max(t.lo / dollars, dollars / t.hi);
  return list.reduce((a, b) => (off(b) < off(a) ? b : a));
}
const NAMES = ['Maya', 'Leo', 'Ava', 'Sam', 'Nora', 'Eli', 'Zoe', 'Omar', 'Lily', 'Jack', 'Rosa', 'Ben', 'Priya', 'Diego', 'Kenji', 'Amara'];

interface Ctx {
  kind: Kind; dir: Dir; thing: Thing;
  /** words for the two amounts (panel, tape) and short board words */
  oldWord: string; newWord: string; oShort: string; nShort: string;
  objKind: 'tag' | 'receipt'; objOld: string; objNow: string;
}
function ctxOf(R: () => number, kind: Kind): Ctx {
  if (kind === 'off') return { kind, dir: 'down', thing: pick(R, THINGS), oldWord: 'original price', newWord: 'sale price', oShort: 'original', nShort: 'sale', objKind: 'tag', objOld: 'was', objNow: 'now' };
  if (kind === 'markup') return { kind, dir: 'up', thing: pick(R, THINGS), oldWord: 'old price', newWord: 'new price', oShort: 'old', nShort: 'new', objKind: 'tag', objOld: 'was', objNow: 'now' };
  if (kind === 'tax') return { kind, dir: 'up', thing: pick(R, THINGS), oldWord: 'price before tax', newWord: 'total', oShort: 'price', nShort: 'total', objKind: 'receipt', objOld: 'price', objNow: 'total' };
  return { kind, dir: 'up', thing: pick(R, SERVICES), oldWord: 'bill before the tip', newWord: 'total with tip', oShort: 'bill', nShort: 'total', objKind: 'receipt', objOld: 'bill', objNow: 'total' };
}
const cap = (s: string) => s[0]!.toUpperCase() + s.slice(1);
const P = (r: number) => `${pctNum(r)}%`;
/** "a" or "an" before a number as it is spoken: an 8%, an 11%, an 18%, an 80% (but a 1%, a 110%) */
const an = (x: number | string) => (/^(8|11(\.\d+)?$|18(\.\d+)?$)/.test(String(x)) ? 'an' : 'a');
const PT = (r: number) => `${pctNum(r)}\\%`;
/** the change in words: "20% off", "a 25% markup", "8% sales tax", "a 15% tip" */
const rateWords = (C: Ctx, r: number) => (C.kind === 'off' ? `${P(r)} off` : C.kind === 'markup' ? `${an(r)} ${P(r)} markup` : C.kind === 'tax' ? `${P(r)} sales tax` : `${an(r)} ${P(r)} tip`);
/** the change label on the tape */
const changeTex = (C: Ctx, r: number) => (C.kind === 'off' ? `${PT(r)}\\ \\text{off}` : C.kind === 'markup' ? `+${PT(r)}` : C.kind === 'tax' ? `+${PT(r)}\\ \\text{tax}` : `+${PT(r)}\\ \\text{tip}`);
/** the board's short statement of the change: "20% off", "+8% tax" */
const boardChange = changeTex;
/** the story: the new amount and the rate, in role colours */
function story(R: () => number, C: Ctx, newC: number, r: number, cents = false): string {
  C.thing = thingFor(R, C.kind === 'tip' ? SERVICES : THINGS, newC / (C.dir === 'down' ? 100 - r : 100 + r));
  const name = pick(R, NAMES), N = S(usd(newC, cents)), Rt = B(rateWords(C, r)), T = C.thing;
  if (C.kind === 'off') return pick(R, [
    `${cap(T.the)} ${T.plural ? 'are' : 'is'} ${Rt}. The sale price is ${N}.`,
    `After ${Rt}, ${name} paid ${N} for ${T.a}.`,
    `${cap(T.a)} is on sale for ${N}. That is ${Rt} the original price.`,
  ]);
  if (C.kind === 'markup') return pick(R, [
    `A store raised the price of ${T.a} by ${B(P(r))}. It now costs ${N}.`,
    `After ${Rt}, ${T.the} ${T.plural ? 'sell' : 'sells'} for ${N}.`,
    `${cap(T.the)} went up ${B(P(r))} and now ${T.plural ? 'cost' : 'costs'} ${N}.`,
  ]);
  if (C.kind === 'tax') return pick(R, [
    `${name} paid ${N} for ${T.a}, including ${Rt}.`,
    `The receipt total for ${T.a} is ${N}. That includes ${Rt}.`,
    `With ${Rt}, ${T.the} ${T.plural ? 'come' : 'comes'} to ${N}.`,
  ]);
  return pick(R, [
    `${name} paid ${N} for ${T.a}, with ${Rt}.`,
    `The total for ${T.a}, with ${Rt}, was ${N}.`,
    `${name} left ${Rt}. The total came to ${N}.`,
  ]);
}
const NOCALC = '<span class="calc">No calculator.</span>';
const CALC = '<span class="calc">Calculator allowed.</span>';

export const FAMILY_NAMES: Record<string, string> = {
  resultPct: 'The new amount as a percent',
  tapeRead: 'Read the tape',
  multNum: 'One multiplier',
  multExpr: 'Same expression',
  tapeUnit: 'One section, then the whole',
  reverse: 'Find the original',
  whichCalc: 'Pick the calculation',
  roundOrig: 'Round to the cent',
  roundPick: 'Which rounded original?',
  forwardCheck: 'Check it forward',
  receiptCheck: 'Match the receipt',
  checkHow: 'A real check',
  addBack: 'Change, then change back',
  undoPct: 'The percent that undoes it',
  whyBase: 'Why it does not cancel',
  diagnose: 'Find the slip',
  contextOrig: 'Original in context',
  boundFirst: 'Bound it first',
};

// ---------- item builders ----------
interface Wrong { c: number; mc?: string; say: string }
/** a money answer typed in dollars, checked exactly in cents */
function moneyItem(o: Omit<Item, 'input' | 'answer' | 'check'> & { c: number; wrongs: Wrong[]; right: string; hint: string; exact?: { num: number; den: number } }): Item {
  const { c, wrongs, right, hint, exact, ...rest } = o;
  return {
    ...rest, input: 'num', unit: rest.unit ?? 'dollars', answer: { kind: 'num', v: c / 100 },
    check(r: Response): Verdict {
      if (r.kind !== 'num' || !Number.isFinite(r.v)) return { ok: false, say: 'Type an amount of money, like 47.17 (no $ sign).' };
      const k = toCents(r.v);
      if (k === null) {
        if (exact && Math.abs(r.v * 100 - exact.num / exact.den) < 1) return { ok: false, mc: 'mc.estimation.more-digits-more-accurate', say: `Money is counted in cents: round to two decimal places. ${usd(c)} is the nearest cent.` };
        return { ok: false, say: 'Give the amount in dollars and cents (two decimal places at most).' };
      }
      if (k === c) return { ok: true, say: right };
      const w = wrongs.find(x => x.c === k && x.c !== c);
      return w ? { ok: false, mc: w.mc, say: w.say } : { ok: false, say: hint };
    },
  };
}
interface NWrong { v: number; mc?: string; say: string }
/** a number answer (percent or multiplier), compared to 1e-9 */
function numItem(o: Omit<Item, 'input' | 'answer' | 'check'> & { v: number; wrongs: NWrong[]; right: string; hint: string }): Item {
  const { v, wrongs, right, hint, ...rest } = o;
  const eq = (a: number, b: number) => Math.abs(a - b) < 1e-9;
  return {
    ...rest, input: 'num', answer: { kind: 'num', v },
    check(r: Response): Verdict {
      if (r.kind !== 'num' || !Number.isFinite(r.v)) return { ok: false, say: 'Type a number.' };
      if (eq(r.v, v)) return { ok: true, say: right };
      const w = wrongs.find(x => eq(x.v, r.v) && !eq(x.v, v));
      return w ? { ok: false, mc: w.mc, say: w.say } : { ok: false, say: hint };
    },
  };
}
interface Choice { t: string; ok: boolean; mc?: string; say: string }
function choiceItem(R: () => number, o: Omit<Item, 'input' | 'answer' | 'check' | 'choices'> & { opts: Choice[] }): Item {
  const { opts, ...rest } = o;
  const seen = new Set<string>();
  const uniq = opts.filter(c => (seen.has(c.t) ? false : (seen.add(c.t), true)));
  const sh = shuffle(R, uniq);
  return {
    ...rest, input: 'choice', choices: sh.map(c => c.t), answer: { kind: 'choice', i: sh.findIndex(c => c.ok) }, solution: endOnChoice(rest.solution, sh.find(c => c.ok)!.t),
    check(r: Response): Verdict {
      if (r.kind !== 'choice' || !sh[r.i]) return { ok: false, say: 'Pick one answer.' };
      const c = sh[r.i]!;
      return { ok: c.ok, mc: c.ok ? undefined : c.mc, say: c.say };
    },
  };
}

// ---------- the model for an item ----------
/** equal sections for a whole-number rate: the biggest of 50 / 25 / 20 / 10 % that divides it */
export function sectionPct(r: number): number {
  const b = bp(r);
  for (const g of [50, 25, 20, 10]) if (b % (g * 100) === 0) return g;
  return 0;
}
/** row 0 sections and row 1 sections (over its extent) for a change, or [0, 0] */
function sectionsFor(r: number, dir: Dir, max = 12): [number, number] {
  const g = sectionPct(r);
  if (!g) return [0, 0];
  const n0 = 100 / g, n1 = dir === 'down' ? n0 : (100 + r) / g;
  return Math.max(n0, n1) > max ? [0, 0] : [n0, n1];
}
interface TapeOpts { sections?: boolean; secVals?: boolean; scale?: boolean; obj?: boolean; cents?: boolean; hideOrig?: boolean; pct?: boolean }
function tape2(C: Ctx, origC: number, newC: number, r: number, o: TapeOpts = {}): BaseTapeParams {
  const [n0, n1] = o.sections ? sectionsFor(r, C.dir) : [0, 0];
  return {
    rows: [
      { cents: origC, word: C.oldWord, hide: o.hideOrig ?? true, sections: n0, secVals: !!(o.secVals && n0) },
      { cents: newC, word: C.newWord, sections: n1, secVals: !!(o.secVals && n1), pct: o.pct === false ? undefined : `${pctNum(resultPct(r, C.dir))}\\%`, change: changeTex(C, r) },
    ],
    scale: !!(o.scale && n0),
    obj: o.obj ? { kind: C.objKind, title: C.thing.tag, old: C.objOld, now: C.objNow } : undefined,
    cents: o.cents,
  };
}
const PRE_TAPE = ['obj', 'row0', 'val0', 'row1', 'val1', 'chg1'];

// ---------- rates per sub-goal ----------
const WHOLE: Record<Kind, number[]> = {
  off: [5, 10, 15, 20, 25, 30, 35, 40, 45, 60, 70, 75, 80],
  markup: [10, 20, 25, 30, 40, 50, 60, 75],
  tax: [4, 5, 6, 7, 8, 9],
  tip: [10, 15, 18, 20, 25],
};
const DECIMAL: Record<Kind, number[]> = { off: [12.5, 37.5, 17.5, 2.5], markup: [12.5, 37.5], tax: [8.25, 6.5, 7.25, 8.75], tip: [12.5, 17.5] };
const KINDS: readonly Kind[] = ['off', 'markup', 'tax', 'tip'];
/** a context and a rate; decimal rates with probability pDec */
function ctxRate(R: () => number, pDec = 0.3, kinds: readonly Kind[] = KINDS): { C: Ctx; r: number } {
  const C = ctxOf(R, pick(R, kinds));
  const r = R() < pDec ? pick(R, DECIMAL[C.kind]) : pick(R, WHOLE[C.kind]);
  return { C, r };
}
/** an original (whole dollars) whose new amount is friendly (whole dollars, or .50 when allowed) */
function friendly(R: () => number, C: Ctx, rates: readonly number[], lo = 12, hi = 240, half = false): { r: number; O: number; N: number } {
  for (let t = 0; t < 400; t++) {
    const r = pick(R, rates), O = int(R, lo, hi) * 100;
    const num = O * mNum(r, C.dir);
    if (num % BP) continue;
    const N = num / BP;
    if (N % 100 === 0 || (half && N % 50 === 0)) return { r, O, N };
  }
  return { r: C.dir === 'down' ? 20 : 25, O: 6000, N: C.dir === 'down' ? 4800 : 7500 };
}

/** the usual wrong originals for N after an r% change, as cents (rounded to the cent) */
function usualWrongs(C: Ctx, N: number, r: number): Wrong[] {
  const b = bp(r), m = mNum(r, C.dir), opp = C.dir === 'down' ? BP + b : BP - b;
  const out: Wrong[] = [];
  const add = (c: number, mc: string | undefined, say: string) => { if (c > 0 && !out.some(w => w.c === c)) out.push({ c, mc, say }); };
  add(roundFrac(N * opp, BP), 'mc.percent.opposite-percent-to-undo-change',
    C.dir === 'down' ? `That adds ${P(r)} of ${usd(N)}, the wrong base. The ${P(r)} was of the original, which is bigger. Divide by ${multStr(r, C.dir)}.`
      : `That takes ${P(r)} of ${usd(N)} off, the wrong base. The ${P(r)} was of the original, which is smaller. Divide by ${multStr(r, C.dir)}.`);
  add(roundFrac(N * BP, b), 'mc.percent.divides-by-rate-to-undo-change', `That divides by the rate ${rateStr(r)}. ${usd(N)} is ${pctNum(resultPct(r, C.dir))}% of the original, so divide by ${multStr(r, C.dir)}.`);
  add(roundFrac(N * m, BP), undefined, `That applies the change again. To undo it, divide by ${multStr(r, C.dir)}.`);
  if (Number.isInteger(r)) add(C.dir === 'down' ? N + r * 100 : N - r * 100, 'mc.percent.adds-or-subtracts-percent-numeral', `${P(r)} is not $${pctNum(r)}: it is ${P(r)} of the original price.`);
  return out;
}

// =============== 1. change-to-resulting-percent ===============
const resultPctG: Gen = (R, n) => {
  const { C, r } = ctxRate(R, 0.35);
  const res = resultPct(r, C.dir);
  const { O, N } = (() => { const f = friendly(R, C, [r], 12, 200, true); return f.r === r ? f : { O: 10000, N: roundFrac(10000 * mNum(r, C.dir), BP) }; })();
  const [n0] = sectionsFor(r, C.dir);
  const pic: OrigPicture = { tape: tape2(C, O, N, r, { sections: true, scale: true }), pre: [...PRE_TAPE, 'cut0', 'cut1', 'pct0'], post: ['pct1'], pulse: [1], work: [`100\\% ${C.dir === 'down' ? '-' : '+'} ${PT(r)} = ${PT(res)}`] };
  if (!n0) pic.pre = pic.pre.filter(s => !s.startsWith('cut'));
  return numItem({
    id: `resultPct-${n}`, family: 'resultPct', unit: '%',
    prompt: `${story(R, C, N, r)} The ${C.newWord} is what percent of the ${A(C.oldWord)}? ${NOCALC}`,
    board: `\\text{${C.oShort}} = 100\\% \\quad \\text{${C.nShort}} = \\ ?\\%`, picture: pic, v: res,
    solution: [`The ${A(C.oldWord)} is the whole: ${A('100%')}.`, `${C.dir === 'down' ? `${P(r)} comes off` : `${P(r)} is added on`}: 100% ${C.dir === 'down' ? '−' : '+'} ${P(r)} = ${S(P(res))}.`],
    wrongs: [
      { v: r, mc: 'mc.percent.change-reported-as-final-amount', say: `${P(r)} is the change itself. The ${C.newWord} is 100% ${C.dir === 'down' ? '−' : '+'} ${P(r)}.` },
      { v: C.dir === 'down' ? 100 + r : 100 - r, mc: 'mc.percent.wrong-direction-of-change', say: C.dir === 'down' ? `A discount makes the price smaller than 100%: 100% − ${P(r)}.` : `Adding ${C.kind === 'tax' ? 'tax' : C.kind === 'tip' ? 'a tip' : 'a markup'} makes the amount more than 100%: 100% + ${P(r)}.` },
    ],
    right: `Yes: the ${C.newWord} is ${P(res)} of the ${C.oldWord}.`, hint: `Start from 100% for the ${C.oldWord}, then ${C.dir === 'down' ? 'take' : 'add'} ${P(r)}.`,
  });
};
const tapeRead: Gen = (R, n) => {
  let C: Ctx, r: number;
  do { ({ C, r } = ctxRate(R, 0.25)); } while (C.dir === 'down' && r === 50);
  const res = resultPct(r, C.dir), flip = C.dir === 'down' ? 100 + r : 100 - r;
  const { O, N } = (() => { const f = friendly(R, C, [r], 12, 200, true); return f.r === r ? f : { O: 10000, N: roundFrac(10000 * mNum(r, C.dir), BP) }; })();
  const [n0] = sectionsFor(r, C.dir);
  const pic: OrigPicture = { tape: tape2(C, O, N, r, { sections: true, scale: true, obj: true }), pre: [...PRE_TAPE, 'cut0', 'cut1', 'pct0'], post: ['pct1'], pulse: [1], work: [`\\text{${C.nShort}} = ${PT(res)}\\ \\text{of}\\ \\text{${C.oShort}}`] };
  if (!n0) pic.pre = pic.pre.filter(s => !s.startsWith('cut'));
  return choiceItem(R, {
    id: `tapeRead-${n}`, family: 'tapeRead',
    prompt: `${story(R, C, N, r)} The tape shows the ${A(C.oldWord)} as 100%. Which sentence is true? ${NOCALC}`,
    board: `${boardChange(C, r)}\\colon\\ \\ \\$\\,? \\to ${usdTex(N)}`, picture: pic,
    solution: [`The ${A(C.oldWord)} is the 100% whole.`, `The ${S(C.newWord)} is 100% ${C.dir === 'down' ? '−' : '+'} ${P(r)} = ${S(P(res))} of it.`],
    opts: [
      { t: `The ${C.newWord} is ${P(res)} of the ${C.oldWord}.`, ok: true, say: `Yes: the ${C.oldWord} is 100%, and the ${C.newWord} is ${P(res)} of it.` },
      { t: `The ${C.newWord} is ${P(r)} of the ${C.oldWord}.`, ok: false, mc: 'mc.percent.change-reported-as-final-amount', say: `${P(r)} is only the change, the teal piece. The ${C.newWord} is ${P(res)}.` },
      { t: `The ${C.oldWord} is ${P(flip)} of the ${C.newWord}.`, ok: false, mc: 'mc.percent.new-or-estimate-as-base', say: `That makes the ${C.newWord} the 100%. The percent is of the ${C.oldWord}: the ${C.newWord} is ${P(res)} of it.` },
    ],
  });
};

// =============== 2. change-multiplier-expression ===============
const multNum: Gen = (R, n) => {
  const { C, r } = ctxRate(R, 0.4);
  const d = rateStr(r), sign = C.dir === 'down' ? '-' : '+', mv = multVal(r, C.dir);
  const wrongs: NWrong[] = [
    { v: bp(r) / BP, mc: 'mc.percent.change-reported-as-final-amount', say: `${d}x is only the change. Keep the x you started with: 1 ${C.dir === 'down' ? '−' : '+'} ${d}.` },
    { v: (C.dir === 'down' ? BP + bp(r) : BP - bp(r)) / BP, mc: 'mc.percent.wrong-direction-of-change', say: `The sign is ${C.dir === 'down' ? 'minus: x − ' : 'plus: x + '}${d}x, so 1 ${C.dir === 'down' ? '−' : '+'} ${d}.` },
    { v: resultPct(r, C.dir), say: `${pctNum(resultPct(r, C.dir))}% as a decimal is ${multStr(r, C.dir)}.` },
  ];
  return numItem({
    id: `multNum-${n}`, family: 'multNum',
    prompt: `${cap(rateWords(C, r))}: a price of ${A('x')} dollars becomes ${A('x')} ${sign === '-' ? '−' : '+'} ${B(`${d}x`)}. Write that as one number times ${A('x')}. ${NOCALC}`,
    board: `x ${sign} ${d}x = \\square\\, x`,
    solution: [`x is 1x, so x ${sign === '-' ? '−' : '+'} ${d}x = (1 ${sign === '-' ? '−' : '+'} ${d})x.`, `1 ${sign === '-' ? '−' : '+'} ${d} = ${S(multStr(r, C.dir))}: the ${C.newWord} is ${S(multStr(r, C.dir) + 'x')}.`],
    v: mv, wrongs, right: `Yes: x ${sign === '-' ? '−' : '+'} ${d}x = ${multStr(r, C.dir)}x.`, hint: `x is 1x. Combine 1 ${sign === '-' ? '−' : '+'} ${d}.`,
  });
};
const multExpr: Gen = (R, n) => {
  const { C, r } = ctxRate(R, 0.4);
  const d = rateStr(r), sign = C.dir === 'down' ? '−' : '+', m = multStr(r, C.dir);
  const opp = decimal(C.dir === 'down' ? BP + bp(r) : BP - bp(r));
  const opts: Choice[] = [
    { t: `${m}x`, ok: true, say: `Yes: x ${sign} ${d}x = (1 ${sign} ${d})x = ${m}x.` },
    { t: `${d}x`, ok: false, mc: 'mc.percent.change-reported-as-final-amount', say: `${d}x is only the change. The ${C.newWord} keeps the x too: ${m}x.` },
    { t: `1 ${sign} ${d}x`, ok: false, mc: 'mc.expressions.removes-factor-from-first-term-without-outside-factor', say: `The x came off the first term but was not kept outside. x ${sign} ${d}x = (1 ${sign} ${d})x = ${m}x.` },
    { t: `${opp}x`, ok: false, mc: 'mc.percent.wrong-direction-of-change', say: `That changes the sign. x ${sign} ${d}x = ${m}x.` },
  ];
  const reading = C.kind === 'off' ? `The sale price is ${pctNum(resultPct(r, C.dir))}% of the original` : C.kind === 'tax' ? `The total is ${pctNum(resultPct(r, C.dir))}% of the price` : `The new amount is ${pctNum(resultPct(r, C.dir))}% of the old one`;
  return choiceItem(R, {
    id: `multExpr-${n}`, family: 'multExpr',
    prompt: `With ${B(rateWords(C, r))}, a price of ${A('x')} dollars becomes ${A('x')} ${sign} ${B(`${d}x`)}. Which expression is the same amount? ${NOCALC}`,
    board: `x ${C.dir === 'down' ? '-' : '+'} ${d}x`,
    solution: [`Take x out of both terms: x ${sign} ${d}x = (1 ${sign} ${d})x.`, `So it is ${S(`${m}x`)}. ${reading}.`],
    opts,
  });
};

// =============== 3. reverse-percent-change ===============
const tapeUnit: Gen = (R, n) => {
  const C = ctxOf(R, pick(R, ['off', 'off', 'markup', 'tax', 'tip'] as const));
  const rates = C.dir === 'down' ? [20, 40, 60, 25, 50] : C.kind === 'tax' ? [20, 25] : C.kind === 'tip' ? [20, 25] : [20, 40, 25, 50];
  const r = pick(R, rates), g = sectionPct(r);
  const n0 = 100 / g, nk = C.dir === 'down' ? (100 - r) / g : (100 + r) / g;
  const vMax = Math.max(n0, nk) > 5 ? 40 : 60;
  const v = int(R, 3, vMax) * 100, N = v * nk, O = v * n0;
  const pic: OrigPicture = {
    tape: tape2(C, O, N, r, { sections: true, secVals: true, scale: true, obj: true }),
    pre: [...PRE_TAPE, 'cut0', 'cut1', 'pct0', 'pct1'], post: ['sv1', 'copy', 'sv0', 'reveal'], pulse: [0],
    work: [`${usdTex(N)} \\div ${nk} = ${usdTex(v)}`, `${n0} \\times ${usdTex(v)} = ${usdTex(O)}`],
  };
  const opp = roundFrac(N * (C.dir === 'down' ? BP + r * 100 : BP - r * 100), BP);
  return {
    id: `tapeUnit-${n}`, family: 'tapeUnit', input: 'pair',
    prompt: `${story(R, C, N, r)} On the tape the ${S(C.newWord)} is ${nk} ${nk === 1 ? 'section' : 'sections'} of ${g}%. Find one section, then the ${A(C.oldWord)}. ${NOCALC}`,
    board: `${usdTex(N)} = ${nk} \\times \\square`, picture: pic,
    pairLead: `one ${g}% section $`, pairOp: `&nbsp; ${C.oldWord} $`,
    solution: [`The ${S(C.newWord)} ${usd(N)} is ${nk} equal ${nk === 1 ? 'section' : 'sections'}: ${usd(N)} ÷ ${nk} = ${mark(usd(v))} each.`, `The ${A(C.oldWord)} is ${n0} sections (100%): ${n0} × ${usd(v)} = ${AA(usd(O))}.`],
    answer: { kind: 'pair', x: v / 100, y: O / 100 },
    check(rp: Response): Verdict {
      if (rp.kind !== 'pair') return { ok: false, say: 'Fill in both boxes.' };
      const x = toCents(rp.x), y = toCents(rp.y);
      if (x === v && y === O) return { ok: true, say: `Yes: one section is ${usd(v)}, and ${n0} sections make ${usd(O)}.` };
      if (x === O && y === v) return { ok: false, say: `Both numbers are right, but in each other's box: one section is ${usd(v)}, the ${C.oldWord} is ${usd(O)}.` };
      if (x === roundFrac(N, n0)) return { ok: false, mc: 'mc.percent.new-or-estimate-as-base', say: `That splits the ${C.newWord} into ${n0} parts, as if it were the 100%. It is only ${nk} sections: ${usd(N)} ÷ ${nk}.` };
      if (y === opp) return { ok: false, mc: 'mc.percent.opposite-percent-to-undo-change', say: `${usd(opp)} ${C.dir === 'down' ? 'adds' : 'takes off'} ${P(r)} of ${usd(N)}, the wrong base. Count sections: ${n0} × one section.` };
      if (x === v && y === N) return { ok: false, say: `${usd(N)} is the ${C.newWord} again. The ${C.oldWord} is ${n0} sections: ${n0} × ${usd(v)}.` };
      if (x === v) return { ok: false, say: `The section is right. The ${C.oldWord} is all ${n0} sections of the 100% tape: ${n0} × ${usd(v)}.` };
      return { ok: false, say: `${usd(N)} is ${nk} equal sections. Divide to find one, then take ${n0} of them.` };
    },
  };
};
const reverseG: Gen = (R, n) => {
  const C = ctxOf(R, pick(R, KINDS));
  const rates = C.kind === 'off' ? [10, 20, 25, 30, 40, 60, 75, 80, 15] : C.kind === 'markup' ? [10, 20, 25, 50, 75] : C.kind === 'tax' ? [4, 5, 6, 8, 10] : [10, 15, 20, 25];
  const { r, O, N } = friendly(R, C, rates, 8, 240);
  const m = multStr(r, C.dir);
  const pic: OrigPicture = { tape: tape2(C, O, N, r, { sections: true, obj: true }), pre: [...PRE_TAPE, 'pct0', 'cut0', 'cut1'], post: ['pct1', 'reveal'], pulse: [0], work: [`${m} \\times x = ${usdTex(N)}`, `x = ${usdTex(N)} \\div ${m} = ${usdTex(O)}`] };
  return moneyItem({
    id: `reverse-${n}`, family: 'reverse',
    prompt: `${story(R, C, N, r)} What was the ${A(C.oldWord)}? ${NOCALC}`,
    board: `${boardChange(C, r)}\\colon\\ \\ \\$\\,? \\to ${usdTex(N)}`, picture: pic, c: O,
    solution: [`The ${S(C.newWord)} is ${pctNum(resultPct(r, C.dir))}% of the ${A(C.oldWord)}: ${m} × x = ${usd(N)}.`, `Undo the multiplication: x = ${usd(N)} ÷ ${m} = ${AA(usd(O))}.`],
    wrongs: usualWrongs(C, N, r), right: `Yes: ${usd(N)} ÷ ${m} = ${usd(O)}. Check: ${m} × ${usd(O)} = ${usd(N)}.`,
    hint: `The ${C.newWord} is ${m} times the ${C.oldWord}. Divide ${usd(N)} by ${m}.`,
  });
};
const whichCalc: Gen = (R, n) => {
  const C = ctxOf(R, pick(R, KINDS));
  const rates = C.kind === 'off' ? [10, 15, 20, 25, 30, 40, 60, 12.5] : C.kind === 'markup' ? [10, 20, 25, 40, 12.5] : C.kind === 'tax' ? [5, 6, 7, 8, 8.25] : [15, 18, 20];
  const { r, O, N } = friendly(R, C, rates, 10, 300, true);
  const m = multStr(r, C.dir), d = rateStr(r), opp = decimal(C.dir === 'down' ? BP + bp(r) : BP - bp(r));
  const $N = usd(N, N % 100 !== 0);
  const pic: OrigPicture = { tape: tape2(C, O, N, r, { obj: true, cents: N % 100 !== 0 }), pre: [...PRE_TAPE, 'pct0'], post: ['pct1', 'reveal'], pulse: [0], work: [`${usdTex(N, N % 100 !== 0)} \\div ${m} = ${usdTex(O)}`] };
  return choiceItem(R, {
    id: `whichCalc-${n}`, family: 'whichCalc',
    prompt: `${story(R, C, N, r, N % 100 !== 0)} Which calculation gives the ${A(C.oldWord)}? ${NOCALC}`,
    board: `${boardChange(C, r)}\\colon\\ \\ \\$\\,? \\to ${usdTex(N, N % 100 !== 0)}`, picture: pic,
    solution: [`${$N} is ${pctNum(resultPct(r, C.dir))}% of the ${A(C.oldWord)}: ${m} × x = ${$N}.`, `So x = ${$N} ÷ ${m} = ${AA(usd(O))}.`],
    opts: [
      { t: `${$N} ÷ ${m}`, ok: true, say: `Yes: the ${C.newWord} is ${m} times the original, so divide by ${m}.` },
      { t: `${$N} × ${opp}`, ok: false, mc: 'mc.percent.opposite-percent-to-undo-change', say: `That ${C.dir === 'down' ? 'adds' : 'takes off'} ${P(r)} of ${$N}, the new amount. The ${P(r)} was of the original: divide by ${m}.` },
      { t: `${$N} ÷ ${d}`, ok: false, mc: 'mc.percent.divides-by-rate-to-undo-change', say: `${d} is only the change. ${$N} is ${m} of the original, so divide by ${m}.` },
      { t: `${$N} × ${m}`, ok: false, say: `That applies the change a second time. To undo it, divide by ${m}.` },
    ],
  });
};

// =============== 4. round-to-cent ===============
const ROUND_RATES: Record<Kind, number[]> = { off: [35, 15, 30, 45, 65, 12.5, 37.5], markup: [35, 15, 45, 12.5], tax: [6, 7, 8.25, 6.5, 7.25, 3, 9], tip: [15, 18, 22, 12.5] };
/** a new amount whose original does not come out in whole cents */
function nonExact(R: () => number, C: Ctx, needDiff = false): { r: number; N: number; rev: ReturnType<typeof reverse> } {
  for (let t = 0; t < 500; t++) {
    const r = pick(R, ROUND_RATES[C.kind]);
    const N = R() < 0.55 ? int(R, 10, 250) * 100 : int(R, 1000, 25000);
    const rev = reverse(N, r, C.dir);
    if (rev.exact) continue;
    if (needDiff && rev.truncC === rev.origC) continue;
    // never exactly half a cent (the halves-up rule is a different lesson)
    if ((2 * rev.oNum) % rev.oDen === 0) continue;
    return { r, N, rev };
  }
  const rev = reverse(5000, 6, 'up');
  return { r: 6, N: 5000, rev };
}
/** wrong roundings: cut off; 1% found and rounded first; the multiplier rounded first */
function roundingWrongs(C: Ctx, N: number, r: number, right: number, trunc: number): Wrong[] {
  const out: Wrong[] = [];
  const add = (c: number, mc: string | undefined, say: string) => { if (c > 0 && c !== right && !out.some(w => w.c === c)) out.push({ c, mc, say }); };
  add(trunc, 'mc.decimals.truncates-instead-of-rounding', `That cuts the digits off. Look at the next digit: ${usd(trunc)} rounds up to ${usd(right)}.`);
  const one = roundFrac(N * 100, mNum(r, C.dir));     // 1% of the original (N ÷ 106) rounded to the cent first
  add(one * 100, 'mc.decimals.intermediate-precision-always-invalid', `That rounds 1% to the cent first, and × 100 makes that error 100 times bigger. Keep every digit until the end, then round once: ${usd(right, true)}.`);
  const m2 = Math.round(mNum(r, C.dir) / 100);       // the multiplier rounded to 2 decimals (hundredths)
  if (mNum(r, C.dir) % 100 !== 0) add(roundFrac(N * 100, m2), 'mc.decimals.intermediate-precision-always-invalid', `That rounds the multiplier to ${decimal(m2 * 100)} first. Keep ${multStr(r, C.dir)} exact; round only the final answer.`);
  for (const w of usualWrongs(C, N, r)) add(w.c, w.mc, w.say);
  return out;
}
const roundOrig: Gen = (R, n) => {
  const C = ctxOf(R, pick(R, KINDS));
  const { r, N, rev } = nonExact(R, C);
  const m = multStr(r, C.dir);
  const long = decimalsOf(rev.oNum, rev.oDen, 4);
  const pic: OrigPicture = { tape: tape2(C, rev.origC, N, r, { obj: true, cents: true }), pre: [...PRE_TAPE, 'pct0'], post: ['pct1', 'reveal'], pulse: [0], work: [`${usdTex(N, true)} \\div ${m}`, `= ${long.replace('…', '\\ldots')}`, `\\approx ${usdTex(rev.origC, true)}`] };
  return moneyItem({
    id: `roundOrig-${n}`, family: 'roundOrig',
    prompt: `${story(R, C, N, r, true)} What was the ${A(C.oldWord)}, to the nearest cent? ${CALC}`,
    board: `${boardChange(C, r)}\\colon\\ \\ \\$\\,? \\to ${usdTex(N, true)}`, picture: pic, c: rev.origC, exact: { num: rev.oNum, den: rev.oDen },
    solution: [`${usd(N, true)} ÷ ${m} = ${long}`, `The digit after the cents decides: ${A(usd(rev.origC, true))}.`],
    wrongs: roundingWrongs(C, N, r, rev.origC, rev.truncC), right: `Yes: ${usd(N, true)} ÷ ${m} = ${long}, which rounds to ${usd(rev.origC, true)}.`,
    hint: `Divide ${usd(N, true)} by ${m} and round to the nearest cent.`,
  });
};
const roundPick: Gen = (R, n) => {
  const C = ctxOf(R, pick(R, KINDS));
  const { r, N, rev } = nonExact(R, C, R() < 0.7);
  const m = multStr(r, C.dir), long = decimalsOf(rev.oNum, rev.oDen, 4);
  const wr = roundingWrongs(C, N, r, rev.origC, rev.truncC).filter(w => w.c !== rev.origC);
  const opts: Choice[] = [
    { t: usd(rev.origC, true), ok: true, say: `Yes: ${long} rounds to ${usd(rev.origC, true)}.` },
    { t: `$${long.replace('…', '')}`, ok: false, mc: 'mc.estimation.more-digits-more-accurate', say: `A price is in whole cents. Round ${long} to ${usd(rev.origC, true)}.` },
    ...wr.slice(0, 2).map(w => ({ t: usd(w.c, true), ok: false, mc: w.mc, say: w.say })),
  ];
  return choiceItem(R, {
    id: `roundPick-${n}`, family: 'roundPick',
    prompt: `${story(R, C, N, r, true)} Which is the ${A(C.oldWord)}, to the nearest cent? ${CALC}`,
    board: `${usdTex(N, true)} \\div ${m}`, picture: { tape: tape2(C, rev.origC, N, r, { obj: true, cents: true }), pre: [...PRE_TAPE, 'pct0'], post: ['pct1', 'reveal'], pulse: [0], work: [`= ${long.replace('…', '\\ldots')}`, `\\approx ${usdTex(rev.origC, true)}`] } satisfies OrigPicture,
    solution: [`${usd(N, true)} ÷ ${m} = ${long}`, `Round once, at the end, to the nearest cent: ${A(usd(rev.origC, true))}.`],
    opts,
  });
};

// =============== 5. rounding-check ===============
const fwdStr = (c: number, r: number, dir: Dir) => { const f = forwardExact(c, r, dir); return decimalsOf(f.num, f.den, 6); };
/** |m × P − N| in dollars as text, and whether it is within the rounding allowance m × $0.005 */
function miss(c: number, N: number, r: number, dir: Dir): { txt: string; ok: boolean; tol: string } {
  const f = forwardExact(c, r, dir);           // cents = num / den
  const diffNum = Math.abs(f.num - N * f.den); // cents × den
  const tolNum = mNum(r, dir) / 2;             // m × 0.5 cent, in cents × 10000 (den = 10000)
  return { txt: decimalsOf(diffNum, f.den, 6), ok: diffNum <= tolNum, tol: decimalsOf(mNum(r, dir), 2 * BP, 7) };
}
const forwardCheck: Gen = (R, n) => {
  const C = ctxOf(R, pick(R, ['tax', 'tax', 'tip', 'off'] as const));
  const { r, N, rev } = nonExact(R, C);
  const m = multStr(r, C.dir);
  const good = R() < 0.4;
  const cand = good ? rev.origC : rev.origC + (R() < 0.5 ? 1 : -1);
  const fx = fwdStr(cand, r, C.dir), ms = miss(cand, N, r, C.dir);
  const name = pick(R, NAMES);
  const rule = `<span class="calc">Rule: the price was rounded to the cent, so ${m} × price may miss ${usd(N, true)} by at most ${m} × $0.005 = $${ms.tol}.</span>`;
  const opts: Choice[] = good ? [
    { t: `Accept: ${m} × ${usd(cand, true)} = $${fx}, only $${ms.txt} off, within the rounding allowance`, ok: true, say: `Yes: the miss is smaller than $${ms.tol}, so rounding explains it.` },
    { t: `Reject: $${fx} is not exactly ${usd(N, true)}`, ok: false, mc: 'mc.estimation.rounding-gap-treated-as-error', say: `A rounded price can miss by a tiny amount. $${ms.txt} is within $${ms.tol}, so ${usd(cand, true)} is right.` },
    { t: `Accept: ${usd(N, true)} ÷ ${m} gives ${usd(cand, true)} again`, ok: false, mc: 'mc.reasoning-language.check-by-repeating-same-steps', say: `Redoing the same division repeats any slip. A check goes forward: ${m} × ${usd(cand, true)}.` },
  ] : [
    { t: `Reject: ${m} × ${usd(cand, true)} = $${fx} misses by $${ms.txt}, more than rounding allows`, ok: true, say: `Right: $${ms.txt} is more than $${ms.tol}. The nearest-cent answer is ${usd(rev.origC, true)}.` },
    { t: `Accept: $${fx} is only $${ms.txt} away, that is just rounding`, ok: false, mc: 'mc.estimation.near-miss-accepted-as-match', say: `Rounding can explain at most $${ms.tol}. $${ms.txt} is more, so ${usd(cand, true)} is not the nearest cent.` },
    { t: `Accept: ${usd(N, true)} ÷ ${m} gives ${usd(cand, true)} if you stop at the cents`, ok: false, mc: 'mc.reasoning-language.check-by-repeating-same-steps', say: `Stopping at the cents is cutting off, not rounding, and doing it again repeats the slip. Check forward: ${m} × ${usd(cand, true)}.` },
  ];
  if (!good && ms.ok) throw new Error('forwardCheck: a wrong candidate within the allowance');
  return choiceItem(R, {
    id: `forwardCheck-${n}`, family: 'forwardCheck',
    prompt: `${story(R, C, N, r, true)} ${name} says the ${A(C.oldWord)} was ${A(usd(cand, true))}. Check it forward: accept or reject? ${rule} ${CALC}`,
    board: `${m} \\times ${usdTex(cand, true)} \\overset{?}{=} ${usdTex(N, true)}`,
    picture: { tape: tape2(C, cand, N, r, { obj: true, cents: true, hideOrig: false }), pre: [...PRE_TAPE, 'pct0', 'pct1'], post: [], pulse: [1], work: [`= ${fx}`, `\\text{miss} = ${ms.txt} ${ms.ok ? '\\le' : '>'} ${ms.tol}`] } satisfies OrigPicture,
    solution: [`Forward: ${m} × ${usd(cand, true)} = $${fx}.`, `It misses ${usd(N, true)} by $${ms.txt}; rounding allows $${ms.tol}. ${good ? 'Accept.' : `Reject: the nearest cent is ${A(usd(rev.origC, true))}.`}`],
    opts,
  });
};
const receiptCheck: Gen = (R, n) => {
  // Model 2: the change r% is rounded to the cent first, then added (tax, tip) or taken off (discount)
  const C = ctxOf(R, pick(R, ['tax', 'tax', 'tip', 'off'] as const));
  let r = 0, P0 = 0, N = 0, cands: number[] = [];
  for (let t = 0; t < 400; t++) {
    r = pick(R, ROUND_RATES[C.kind]);
    P0 = int(R, 800, 20000);
    N = receiptTotal(P0, r, C.dir);
    const ps = [P0 - 1, P0, P0 + 1];
    if (ps.filter(p => receiptTotal(p, r, C.dir) === N).length !== 1) continue;
    if (reverse(N, r, C.dir).exact) continue;
    cands = ps; break;
  }
  if (!cands.length) { r = C.kind === 'off' ? 35 : 6; P0 = 4717; N = receiptTotal(P0, r, C.dir); cands = [P0 - 1, P0, P0 + 1]; }
  const what = C.kind === 'off' ? 'discount' : C.kind === 'tax' ? 'tax' : 'tip';
  const verb = C.dir === 'down' ? 'takes it off' : 'adds it';
  const line = (p: number) => { const ch = Math.abs(receiptTotal(p, r, C.dir) - p); return `${usd(p, true)}: ${what} ${usd(ch, true)}, ${C.dir === 'down' ? 'pay' : 'total'} ${usd(receiptTotal(p, r, C.dir), true)}`; };
  const opts: Choice[] = cands.map(p => {
    const tot = receiptTotal(p, r, C.dir);
    if (p === P0) return { t: usd(p, true), ok: true, say: `Yes: ${line(p)}, exactly the receipt.` };
    return { t: usd(p, true), ok: false, mc: 'mc.estimation.near-miss-accepted-as-match', say: `${line(p)}. That is ${usd(Math.abs(tot - N), true)} off the receipt: under this rule the total must match exactly.` };
  });
  return choiceItem(R, {
    id: `receiptCheck-${n}`, family: 'receiptCheck',
    prompt: `${story(R, C, N, r, true)} The store rounds the ${what} to the nearest cent, then ${verb}. Which ${A(C.oldWord)} gives exactly ${S(usd(N, true))}? ${CALC}`,
    board: `${boardChange(C, r)} \\to ${usdTex(N, true)}`,
    picture: { tape: tape2(C, P0, N, r, { obj: true, cents: true }), pre: [...PRE_TAPE, 'pct0'], post: ['pct1', 'reveal'], pulse: [0], work: cands.map(p => (p === P0 ? `\\cssId{o}{${usdTex(p, true)}} \\to \\cssId{s}{${usdTex(receiptTotal(p, r, C.dir), true)}}\\ \\checkmark` : `${usdTex(p, true)} \\to ${usdTex(receiptTotal(p, r, C.dir), true)}`)) } satisfies OrigPicture,
    solution: [`Apply the rule forward to each price: round the ${what}, then ${C.dir === 'down' ? 'subtract' : 'add'}.`, ...cands.map(p => (p === P0 ? A(line(p)) : line(p)) + '.')],
    opts,
  });
};
const checkHow: Gen = (R, n) => {
  const C = ctxOf(R, pick(R, KINDS));
  const { r, N, rev } = nonExact(R, C);
  const name = pick(R, NAMES), m = multStr(r, C.dir), c = rev.origC;
  const fwd = C.kind === 'off' ? `Take ${P(r)} off ${usd(c, true)} and compare with ${usd(N, true)}` : `Add ${rateWords(C, r).replace(/^a /, 'a ')} to ${usd(c, true)} and compare with ${usd(N, true)}`;
  return choiceItem(R, {
    id: `checkHow-${n}`, family: 'checkHow',
    prompt: `${story(R, C, N, r, true)} ${name} found the ${A(C.oldWord)}: ${A(usd(c, true))}. Which is a real check? ${CALC}`,
    board: `${usdTex(c, true)} \\overset{?}{\\to} ${usdTex(N, true)}`,
    picture: { tape: tape2(C, c, N, r, { obj: true, cents: true, hideOrig: false }), pre: [...PRE_TAPE, 'pct0', 'pct1'], post: [], pulse: [1], work: [`${m} \\times ${usdTex(c, true)}`, `= ${fwdStr(c, r, C.dir)}`, `\\approx ${usdTex(N, true)}\\ \\checkmark`] } satisfies OrigPicture,
    solution: [`A check goes the other way: apply the change to the answer.`, `${m} × ${usd(c, true)} = $${fwdStr(c, r, C.dir)}, which rounds to ${S(usd(N, true))}.`],
    opts: [
      { t: fwd, ok: true, say: `Yes: going forward from the answer is a real check.` },
      { t: `Divide ${usd(N, true)} by ${m} again`, ok: false, mc: 'mc.reasoning-language.check-by-repeating-same-steps', say: `Doing the same division again repeats any slip. Go forward from the answer instead.` },
      { t: C.dir === 'down' ? `Add ${P(r)} of ${usd(N, true)} to ${usd(N, true)} and compare with ${usd(c, true)}` : `Take ${P(r)} of ${usd(N, true)} off ${usd(N, true)} and compare with ${usd(c, true)}`, ok: false, mc: 'mc.percent.opposite-percent-to-undo-change', say: `${P(r)} of ${usd(N, true)} uses the new amount as the base. It will not match even when the answer is right.` },
      { t: `See that ${usd(c, true)} is ${C.dir === 'down' ? 'more' : 'less'} than ${usd(N, true)}`, ok: false, mc: 'mc.estimation.one-sided-bound-check', say: `That only checks the direction. Many wrong answers pass it too.` },
    ],
  });
};

// =============== 6. explain-base-change ===============
const addBack: Gen = (R, n) => {
  const first = pick(R, ['down', 'up'] as const);
  const r = first === 'down' ? pick(R, [10, 20, 25, 50, 40]) : pick(R, [10, 20, 25, 50]);
  const unit = r === 25 || r === 50 ? 4 : r === 40 ? 5 : r === 20 ? 5 : 10;
  let O = 0, M = 0, E2 = 0;
  for (let t = 0; t < 200; t++) {
    O = int(R, 4, 40) * unit * 100;
    M = roundFrac(O * mNum(r, first), BP);
    E2 = roundFrac(M * mNum(r, first === 'down' ? 'up' : 'down'), BP);
    if ((O * mNum(r, first)) % BP === 0 && (M * mNum(r, first === 'down' ? 'up' : 'down')) % BP === 0 && O <= 50000) break;
  }
  const T = thingFor(R, THINGS, O / 100);
  const s1 = first === 'down' ? '-' : '+', s2 = first === 'down' ? '+' : '-';
  const words = first === 'down' ? `goes on sale at ${B(`${r}% off`)}. Later the sale price goes up ${B(`${r}%`)}.` : `goes up ${B(`${r}%`)}. Later the new price goes on sale at ${B(`${r}% off`)}.`;
  const g = sectionPct(r);
  const pic: OrigPicture = {
    tape: {
      rows: [
        { cents: O, word: 'start', sections: g ? 100 / g : 0 },
        { cents: M, word: first === 'down' ? 'after the sale' : 'after the rise', change: `${s1}${r}\\%` },
        { cents: E2, word: first === 'down' ? 'after the rise' : 'after the sale', hide: true, change: `${s2}${r}\\%` },
      ], mark: O,
    },
    pre: ['row0', 'val0', 'pct0', 'cut0', 'row1', 'val1', 'chg1', 'row2', 'val2', 'chg2'], post: ['reveal', 'mark'], pulse: [2],
    work: [`${r}\\%\\ \\text{of}\\ ${usdTex(O)} = ${usdTex(Math.abs(O - M))}`, `${r}\\%\\ \\text{of}\\ ${usdTex(M)} = ${usdTex(Math.abs(M - E2))}`],
  };
  return moneyItem({
    id: `addBack-${n}`, family: 'addBack',
    prompt: `${cap(T.a)} costs ${A(usd(O))}. It ${words} What does it cost now? ${NOCALC}`,
    board: `${usdTex(O)} \\xrightarrow{${s1}${r}\\%} ${usdTex(M)} \\xrightarrow{${s2}${r}\\%} \\$\\,?`, picture: pic, c: E2,
    solution: [`The first change is ${r}% of ${A(usd(O))}: ${usd(Math.abs(O - M))}, so ${usd(M)}.`, `The second is ${r}% of ${usd(M)}, a different base: ${usd(Math.abs(M - E2))}, so ${S(usd(E2))}.`],
    wrongs: [{ c: O, mc: 'mc.percent.adds-successive-percent-changes', say: `−${r}% and +${r}% do not cancel: the second ${r}% is of ${usd(M)}, not of ${usd(O)}.` }],
    right: `Yes: ${usd(E2)}. The second ${r}% was of ${usd(M)}, so it is not back at ${usd(O)}.`, hint: `First find ${usd(M)}. Then take ${r}% of ${usd(M)} (the new base).`,
  });
};
const UNDO: { first: Dir; r: number; u: number }[] = [
  { first: 'down', r: 20, u: 25 }, { first: 'down', r: 50, u: 100 }, { first: 'down', r: 60, u: 150 }, { first: 'down', r: 75, u: 300 },
  { first: 'down', r: 80, u: 400 }, { first: 'down', r: 37.5, u: 60 },
  { first: 'up', r: 25, u: 20 }, { first: 'up', r: 100, u: 50 }, { first: 'up', r: 150, u: 60 }, { first: 'up', r: 300, u: 75 },
  { first: 'up', r: 400, u: 80 }, { first: 'up', r: 60, u: 37.5 },
];
const undoPct: Gen = (R, n) => {
  const U = pick(R, UNDO);
  // an original where every amount is whole dollars
  const step = U.first === 'down' ? 100 / sectionOr(U.r) : 100 / sectionOr(U.r);
  const O = int(R, 1, Math.max(2, Math.floor(200 / step))) * step * 100;
  const T = thingFor(R, THINGS, O / 100);
  const M = roundFrac(O * mNum(U.r, U.first), BP);
  const ch = Math.abs(O - M);
  const back = U.first === 'down' ? 'go up' : 'go down';
  const g = sectionPct(U.r);
  // the tape: equal sections of the original; the way back is a whole number of them, compared with the NEW tape
  const n0 = g ? 100 / g : 0, n1 = g ? (U.first === 'down' ? n0 : (100 + U.r) / g) : 0;
  const nice = g > 0 && Math.max(n0, n1) <= 10;
  const secV = nice && Math.max(n0, n1) <= 6 && O / n0 <= 9900;
  const pic: OrigPicture = {
    tape: { rows: [
      { cents: O, word: 'original', sections: nice ? n0 : 0 },
      { cents: M, word: U.first === 'down' ? 'sale price' : 'new price', sections: nice ? n1 : 0, secVals: secV, change: U.first === 'down' ? `${PT(U.r)}\\ \\text{off}` : `+${PT(U.r)}` },
    ] },
    pre: ['row0', 'val0', 'cut0', 'row1', 'val1', 'chg1', 'cut1'], post: ['sv1'], pulse: [1],
    work: [`${usdTex(ch)} \\div ${usdTex(M)} = ${pctNum(U.u)}\\%`],
  };
  return numItem({
    id: `undoPct-${n}`, family: 'undoPct', unit: '%',
    prompt: U.first === 'down'
      ? `${cap(T.a)} goes from ${A(usd(O))} to ${S(usd(M))}: ${B(`${P(U.r)} off`)}. By what percent must the ${S('sale price')} ${back} to get back to ${usd(O)}? ${NOCALC}`
      : `${cap(T.a)} goes from ${A(usd(O))} up ${B(P(U.r))} to ${S(usd(M))}. By what percent must the ${S('new price')} ${back} to get back to ${usd(O)}? ${NOCALC}`,
    board: `${usdTex(M)} \\xrightarrow{\\ ?\\%} ${usdTex(O)}`, picture: pic, v: U.u,
    solution: [`The way back is ${usd(ch)}, but the base is now ${S(usd(M))}.`, `${usd(ch)} ÷ ${usd(M)} = ${mark(`${pctNum(U.u)}%`)}. (${usd(M)} ${U.first === 'down' ? '÷' : '÷'} ${multStr(U.r, U.first)} = ${usd(O)}.)`],
    wrongs: [{ v: U.r, mc: 'mc.percent.adds-successive-percent-changes', say: `${P(U.r)} of ${usd(M)} is not ${usd(ch)}: the base changed. Compare ${usd(ch)} with ${usd(M)}.` }],
    right: `Yes: ${usd(ch)} is ${pctNum(U.u)}% of ${usd(M)}.`, hint: `Find the change in dollars, then compare it with the new base ${usd(M)}.`,
  });
};
function sectionOr(r: number): number { const g = sectionPct(r); return g || (r === 37.5 ? 12.5 : 5); }
const whyBase: Gen = (R, n) => {
  const first = pick(R, ['down', 'up'] as const);
  const r = pick(R, [10, 20, 25, 50]);
  const O = int(R, 2, 30) * (r === 25 ? 4 : r === 50 ? 2 : r === 20 ? 5 : 10) * 100 * (r === 10 ? 1 : 1);
  const M = roundFrac(O * mNum(r, first), BP), E2 = roundFrac(M * mNum(r, first === 'down' ? 'up' : 'down'), BP);
  const T = thingFor(R, THINGS, O / 100);
  const story1 = first === 'down' ? `${cap(T.a)} at ${A(usd(O))} goes ${B(`${r}% off`)}, then the sale price goes up ${B(`${r}%`)}.` : `${cap(T.a)} at ${A(usd(O))} goes up ${B(`${r}%`)}, then the new price goes ${B(`${r}% off`)}.`;
  return choiceItem(R, {
    id: `whyBase-${n}`, family: 'whyBase',
    prompt: `${story1} It ends at ${S(usd(E2, E2 % 100 !== 0))}, not ${usd(O)}. Why? ${NOCALC}`,
    board: `${usdTex(O)} \\to \\cdots \\to ${usdTex(E2, E2 % 100 !== 0)}`,
    picture: { tape: { rows: [{ cents: O, word: 'start' }, { cents: M, word: 'after one change', change: `${first === 'down' ? '-' : '+'}${r}\\%` }, { cents: E2, word: 'after both', change: `${first === 'down' ? '+' : '-'}${r}\\%` }], mark: O }, pre: ['row0', 'val0', 'pct0', 'row1', 'val1', 'chg1', 'row2', 'val2', 'chg2'], post: ['mark'], pulse: [2], work: [`${r}\\%\\ \\text{of}\\ ${usdTex(O)} \\ne ${r}\\%\\ \\text{of}\\ ${usdTex(M, M % 100 !== 0)}`] } satisfies OrigPicture,
    solution: [`The first ${r}% is of ${A(usd(O))}: ${usd(Math.abs(O - M))}.`, `The second ${r}% is of ${usd(M, M % 100 !== 0)}, a ${first === 'down' ? 'smaller' : 'bigger'} base: ${usd(Math.abs(M - E2), Math.abs(M - E2) % 100 !== 0)}.`],
    opts: [
      { t: first === 'down' ? `The second ${r}% is of the smaller sale price, so it adds back less than came off.` : `The second ${r}% is of the bigger new price, so it takes off more than was added.`, ok: true, say: 'Yes: the base changed, so the same percent is a different number of dollars.' },
      { t: `It should be ${usd(O)}: −${r}% and +${r}% make 0%. The store made a mistake.`, ok: false, mc: 'mc.percent.adds-successive-percent-changes', say: `Percents of different bases do not add: ${r}% of ${usd(O)} and ${r}% of ${usd(M, M % 100 !== 0)} are different amounts.` },
      { t: `Rounding to the cent lost a little money.`, ok: false, say: `No rounding happened here: every amount is exact. The base changed.` },
    ],
  });
};

// =============== 7. context-diagnose-change ===============
const diagnose: Gen = (R, n) => {
  const variant = pick(R, ['taxTotal', 'saleBack', 'partWord', 'correct'] as const);
  const name = pick(R, NAMES);
  if (variant === 'partWord') {
    // "the $12 discount was 20%": the discount is the r% part, divide by the rate (the grade-6 method)
    const r = pick(R, [10, 20, 25, 40]), O = int(R, 3, 30) * (100 / sectionPct(r)) * 100, D = O * r / 100;   // not 50%: D ÷ (1 − 0.5) is right too
    const T = thingFor(R, THINGS, O / 100);
    return choiceItem(R, {
      id: `diagnose-${n}`, family: 'diagnose',
      prompt: `${name} saved ${B(usd(D))} on ${T.a}. The ${B(usd(D))} discount was ${B(`${r}%`)} of the original price. ${name} writes: “original = ${usd(D)} ÷ ${multStr(r, 'down')} = ${usd(roundFrac(D * BP, mNum(r, 'down')))}.” What is right? ${NOCALC}`,
      board: `${usdTex(D)} = ${r}\\%\\ \\text{of}\\ \\$\\,?`,
      picture: { tape: { rows: [{ cents: O, word: 'original price', hide: true }, { cents: D, word: 'the discount', role: 'second', pct: `${r}\\%` }] }, pre: ['row0', 'val0', 'pct0', 'row1', 'val1'], post: ['pct1', 'reveal'], pulse: [0], work: [`${usdTex(D)} \\div ${rateStr(r)} = ${usdTex(O)}`] } satisfies OrigPicture,
      solution: [`Here ${B(usd(D))} is the ${r}% part (the discount), not the sale price.`, `So divide by the rate: ${usd(D)} ÷ ${rateStr(r)} = ${A(usd(O))}.`],
      opts: [
        { t: `${usd(D)} is the ${r}% part, so the original is ${usd(D)} ÷ ${rateStr(r)} = ${usd(O)}.`, ok: true, say: `Yes: when the amount IS the percent part, divide by the rate.` },
        { t: `${name} is right: always divide by 1 − the rate.`, ok: false, mc: 'mc.percent.change-reported-as-final-amount', say: `${usd(D)} is the discount, not the price after it. Dividing by ${multStr(r, 'down')} treats it as the sale price.` },
        { t: `Add ${r}% back: ${usd(D)} + ${r}% of ${usd(D)}.`, ok: false, mc: 'mc.percent.opposite-percent-to-undo-change', say: `${usd(D)} is ${r}% of the original, so the original is ${usd(D)} ÷ ${rateStr(r)}.` },
      ],
    });
  }
  const C = ctxOf(R, variant === 'taxTotal' ? pick(R, ['tax', 'tip'] as const) : variant === 'saleBack' ? 'off' : pick(R, KINDS));
  const { r, O, N } = friendly(R, C, C.kind === 'off' ? [20, 25, 40, 10] : C.kind === 'markup' ? [20, 25, 50] : C.kind === 'tax' ? [5, 6, 8, 10] : [15, 20, 25], 10, 200);
  const m = multStr(r, C.dir), b = bp(r);
  const oppC = roundFrac(N * (C.dir === 'down' ? BP + b : BP - b), BP), chN = roundFrac(N * b, BP);
  const shown = variant === 'correct' ? `${usd(N)} ÷ ${m} = ${usd(O)}` : C.dir === 'down' ? `${r}% of ${usd(N)} is ${usd(chN, chN % 100 !== 0)}, so the original was ${usd(N)} + ${usd(chN, chN % 100 !== 0)} = ${usd(oppC, oppC % 100 !== 0)}` : `${r}% of ${usd(N)} is ${usd(chN, chN % 100 !== 0)}, so the ${C.oldWord} was ${usd(N)} − ${usd(chN, chN % 100 !== 0)} = ${usd(oppC, oppC % 100 !== 0)}`;
  const pic: OrigPicture = { tape: tape2(C, O, N, r, { obj: true }), pre: [...PRE_TAPE, 'pct0'], post: ['pct1', 'reveal'], pulse: [0], work: [`${usdTex(N)} \\div ${m} = ${usdTex(O)}`] };
  const ok = variant === 'correct';
  return choiceItem(R, {
    id: `diagnose-${n}`, family: 'diagnose',
    prompt: `${story(R, C, N, r)} ${name} finds the ${A(C.oldWord)}: “${shown}.” Is that right? ${NOCALC}`,
    board: `${boardChange(C, r)}\\colon\\ \\ \\$\\,? \\to ${usdTex(N)}`, picture: pic,
    solution: [`The ${P(r)} is of the ${A(C.oldWord)}, so ${usd(N)} is ${pctNum(resultPct(r, C.dir))}% of it.`, `${usd(N)} ÷ ${m} = ${A(usd(O))}.`],
    opts: [
      { t: ok ? `Right: ${usd(N)} is ${pctNum(resultPct(r, C.dir))}% of the ${C.oldWord}, so divide by ${m}.` : `Wrong base: the ${P(r)} was of the ${C.oldWord}, not of ${usd(N)}. It is ${usd(N)} ÷ ${m} = ${usd(O)}.`, ok: true, say: ok ? 'Yes: dividing by the multiplier undoes the change.' : `Yes: ${name} took ${P(r)} of the new amount.` },
      { t: ok ? `Wrong: ${C.dir === 'down' ? 'add' : 'take'} ${P(r)} of ${usd(N)} ${C.dir === 'down' ? 'back on' : 'off'} instead.` : `Right: ${C.dir === 'down' ? 'adding' : 'taking'} the same ${P(r)} ${C.dir === 'down' ? 'back' : 'off'} undoes it.`, ok: false, mc: 'mc.percent.opposite-percent-to-undo-change', say: `${P(r)} of ${usd(N)} uses the new amount as the base. The ${P(r)} was of the ${C.oldWord}: ${usd(N)} ÷ ${m} = ${usd(O)}.` },
      { t: `Wrong: divide by the rate, ${usd(N)} ÷ ${rateStr(r)}.`, ok: false, mc: 'mc.percent.divides-by-rate-to-undo-change', say: `${usd(N)} is not the ${P(r)} part. It is ${pctNum(resultPct(r, C.dir))}% of the ${C.oldWord}: divide by ${m}.` },
    ],
  });
};
const contextOrig: Gen = (R, n) => {
  const variant = pick(R, ['coupon', 'rebate', 'part', 'story', 'story', 'round'] as const);
  const name = pick(R, NAMES);
  if (variant === 'part') {
    const what = pick(R, ['saved', 'saved', 'tax']);
    const r = what === 'saved' ? pick(R, [10, 20, 25, 40, 50, 15]) : pick(R, [5, 10, 4, 8]);
    const unitD = r === 15 || r === 5 ? 20 : r === 4 ? 25 : r === 8 ? 25 : 100 / sectionPct(r);
    const O = int(R, 2, Math.max(3, Math.floor(300 / unitD))) * unitD * 100, D = O * r / 100;
    const C = ctxOf(R, what === 'saved' ? 'off' : 'tax'), T = thingFor(R, THINGS, O / 100);
    const prompt = what === 'saved' ? `${name} saved ${B(usd(D, D % 100 !== 0))} on ${T.a}. That was ${B(`${r}%`)} of the original price. What was the ${A('original price')}? ${NOCALC}`
      : `The sales tax on ${T.a} was ${B(usd(D, D % 100 !== 0))}, which is ${B(`${r}%`)} of the price before tax. What was the ${A('price before tax')}? ${NOCALC}`;
    return moneyItem({
      id: `contextOrig-${n}`, family: 'contextOrig', prompt,
      board: `${usdTex(D, D % 100 !== 0)} = ${r}\\%\\ \\text{of}\\ \\$\\,?`, c: O,
      picture: { tape: { rows: [{ cents: O, word: C.oldWord, hide: true }, { cents: D, word: what === 'saved' ? 'the discount' : 'the tax', role: 'second', pct: `${r}\\%` }] }, pre: ['row0', 'val0', 'pct0', 'row1', 'val1'], post: ['pct1', 'reveal'], pulse: [0], work: [`${usdTex(D, D % 100 !== 0)} \\div ${rateStr(r)} = ${usdTex(O)}`] } satisfies OrigPicture,
      solution: [`Here the ${usd(D, D % 100 !== 0)} IS the ${r}% part, not an amount after a change.`, `So divide by the rate: ${usd(D, D % 100 !== 0)} ÷ ${rateStr(r)} = ${A(usd(O))}.`],
      wrongs: [
        { c: roundFrac(D * BP, what === 'saved' ? BP - r * 100 : BP + r * 100), mc: 'mc.percent.change-reported-as-final-amount', say: `That treats ${usd(D, D % 100 !== 0)} as the price after the change. It is the ${r}% part itself: divide by ${rateStr(r)}.` },
        { c: roundFrac(D * (BP + r * 100), BP), mc: 'mc.percent.opposite-percent-to-undo-change', say: `${usd(D, D % 100 !== 0)} is ${r}% of the whole. Divide by ${rateStr(r)}.` },
      ],
      right: `Yes: ${usd(D, D % 100 !== 0)} ÷ ${rateStr(r)} = ${usd(O)}.`, hint: `${usd(D, D % 100 !== 0)} is ${r}% of the original. What is 100%?`,
    });
  }
  if (variant === 'round') {
    const C = ctxOf(R, pick(R, KINDS));
    const { r, N, rev } = nonExact(R, C);
    const m = multStr(r, C.dir);
    return moneyItem({
      id: `contextOrig-${n}`, family: 'contextOrig',
      prompt: `${story(R, C, N, r, true)} What was the ${A(C.oldWord)}? Round to the nearest cent. ${CALC}`,
      board: `${boardChange(C, r)}\\colon\\ \\ \\$\\,? \\to ${usdTex(N, true)}`, c: rev.origC, exact: { num: rev.oNum, den: rev.oDen },
      picture: { tape: tape2(C, rev.origC, N, r, { obj: true, cents: true }), pre: [...PRE_TAPE, 'pct0'], post: ['pct1', 'reveal'], pulse: [0], work: [`${usdTex(N, true)} \\div ${m} \\approx ${usdTex(rev.origC, true)}`] } satisfies OrigPicture,
      solution: [`${usd(N, true)} is ${pctNum(resultPct(r, C.dir))}% of the ${A(C.oldWord)}.`, `${usd(N, true)} ÷ ${m} = ${decimalsOf(rev.oNum, rev.oDen, 4)} ≈ ${A(usd(rev.origC, true))}.`],
      wrongs: roundingWrongs(C, N, r, rev.origC, rev.truncC), right: `Yes: ${usd(rev.origC, true)}.`, hint: `Divide ${usd(N, true)} by ${m}, then round to the cent.`,
    });
  }
  const C = ctxOf(R, variant === 'coupon' || variant === 'rebate' ? 'off' : pick(R, KINDS));
  const { r, O, N } = friendly(R, C, C.kind === 'off' ? [10, 15, 20, 25, 30, 40] : C.kind === 'markup' ? [10, 20, 25, 50] : C.kind === 'tax' ? [5, 6, 8] : [15, 20, 25], 10, 250);
  const m = multStr(r, C.dir);
  if (variant === 'coupon' || variant === 'rebate') C.thing = thingFor(R, THINGS, O / 100);   // the price tag and the story name the same thing
  const T = C.thing;
  const prompt = variant === 'coupon' ? `With ${an(r)} ${B(`${r}%-off coupon`)}, ${name} paid ${S(usd(N))} for ${T.a}. What was the price ${A('before the coupon')}? ${NOCALC}`
    : variant === 'rebate' ? `After ${an(r)} ${B(`${r}% rebate`)}, ${T.the} cost ${name} ${S(usd(N))} in the end. What was the ${A('price before the rebate')}? ${NOCALC}`
      : `${story(R, C, N, r)} What was the ${A(C.oldWord)}? ${NOCALC}`;
  return moneyItem({
    id: `contextOrig-${n}`, family: 'contextOrig', prompt,
    board: `${boardChange(C, r)}\\colon\\ \\ \\$\\,? \\to ${usdTex(N)}`, c: O,
    picture: { tape: tape2(C, O, N, r, { obj: true, sections: true }), pre: [...PRE_TAPE, 'pct0', 'cut0', 'cut1'], post: ['pct1', 'reveal'], pulse: [0], work: [`${usdTex(N)} \\div ${m} = ${usdTex(O)}`] } satisfies OrigPicture,
    solution: [`Which amount is 100%? The one BEFORE the change. ${usd(N)} is ${pctNum(resultPct(r, C.dir))}% of it.`, `${usd(N)} ÷ ${m} = ${A(usd(O))}.`],
    wrongs: usualWrongs(C, N, r), right: `Yes: ${usd(N)} ÷ ${m} = ${usd(O)}.`, hint: `${usd(N)} is ${pctNum(resultPct(r, C.dir))}% of the amount before. Divide by ${m}.`,
  });
};
const boundFirst: Gen = (R, n) => {
  const C = ctxOf(R, pick(R, KINDS));
  const rates = C.kind === 'off' ? [10, 20, 25, 30, 40, 50] : C.kind === 'markup' ? [10, 20, 25, 50] : C.kind === 'tax' ? [5, 8, 10] : [10, 15, 20, 25];
  let r = 0, O = 0, N = 0, opp = 0;
  for (let t = 0; t < 300; t++) {
    ({ r, O, N } = friendly(R, C, rates, 10, 250));
    const num = N * (C.dir === 'down' ? BP + bp(r) : BP - bp(r));
    if (num % BP) continue;
    opp = num / BP;
    if (opp !== O) break;
  }
  const c = (x: number) => usd(x, x % 100 !== 0);
  const oppWhat = C.dir === 'down' ? `${c(N)} + ${P(r)} of ${c(N)}` : `${c(N)} − ${P(r)} of ${c(N)}`;
  const opts: Choice[] = C.dir === 'down' ? [
    { t: `More than ${c(opp)}`, ok: true, say: `Yes: adding ${P(r)} of ${c(N)} is not enough, because the ${P(r)} came off the bigger original. It is ${c(O)}.` },
    { t: `Between ${c(N)} and ${c(opp)}`, ok: false, mc: 'mc.percent.opposite-percent-to-undo-change', say: `${c(opp)} = ${oppWhat}: the wrong base, too small. The original is ${c(O)}, more than ${c(opp)}.` },
    { t: `Less than ${c(N)}`, ok: false, mc: 'mc.percent.wrong-direction-of-change', say: `Something came OFF the original, so the original is more than ${c(N)}.` },
  ] : [
    { t: `Between ${c(opp)} and ${c(N)}`, ok: true, say: `Yes: it is less than ${c(N)}, but taking ${P(r)} of ${c(N)} off takes too much. It is ${c(O)}.` },
    { t: `Less than ${c(opp)}`, ok: false, mc: 'mc.percent.opposite-percent-to-undo-change', say: `${c(opp)} = ${oppWhat}: the wrong base takes off too much. The ${C.oldWord} is ${c(O)}, more than ${c(opp)}.` },
    { t: `More than ${c(N)}`, ok: false, mc: 'mc.percent.wrong-direction-of-change', say: `Something was ADDED to the ${C.oldWord}, so it is less than ${c(N)}.` },
  ];
  return choiceItem(R, {
    id: `boundFirst-${n}`, family: 'boundFirst',
    prompt: `${story(R, C, N, r)} Before you calculate: where is the ${A(C.oldWord)}? ${NOCALC}`,
    board: `${boardChange(C, r)}\\colon\\ \\ \\$\\,? \\to ${usdTex(N)}`,
    picture: { tape: tape2(C, O, N, r, { obj: true }), pre: [...PRE_TAPE, 'pct0'], post: ['pct1', 'reveal'], pulse: [0], work: [`${usdTex(N)} \\times ${decimal(C.dir === 'down' ? BP + bp(r) : BP - bp(r))} = ${usdTex(opp, opp % 100 !== 0)}`, `${usdTex(N)} \\div ${multStr(r, C.dir)} = ${usdTex(O)}`] } satisfies OrigPicture,
    solution: [`${C.dir === 'down' ? 'Adding' : 'Taking'} ${P(r)} of ${c(N)} uses the new amount as the base: ${c(opp)}.`, `The real base is the ${A(C.oldWord)}: ${c(N)} ÷ ${multStr(r, C.dir)} = ${A(c(O))}, ${C.dir === 'down' ? `more than ${c(opp)}` : `between ${c(opp)} and ${c(N)}`}.`],
    opts,
  });
};

export const GENS: Record<string, Gen> = {
  resultPct: resultPctG, tapeRead, multNum, multExpr, tapeUnit, reverse: reverseG, whichCalc, roundOrig, roundPick,
  forwardCheck, receiptCheck, checkHow, addBack, undoPct, whyBase, diagnose, contextOrig, boundFirst,
};
