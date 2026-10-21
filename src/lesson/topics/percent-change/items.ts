// items.ts: exercise families for "percent increase and decrease", generated from templates, checked exactly
// (changeMaths.ts), and every wrong answer classified against the misconception catalogue
// (math-curriculum-essentials/misconceptions.json ids). A FAMILY is one deep structure; its items vary the numbers,
// the context, the order of the story and the wording. A generator gets the SUB-GOAL it practises (plan.ts).
// Pure: no DOM, no canvas; a seeded rng makes sessions repeatable.
import { type Item, type Response, type Verdict, A, B, S, fr, gcd, int, mixed, pick, shuffle } from '../../runtime/item';
import { type Unit, apply, change, exactTo, fmtMoney, fmtNum, fmtPct, fmtQ, multiplier, near, r9, roundTo, texMoney, texNum, texPct } from './changeMaths';
/** an amount on the board: money keeps its $, counts and measures are bare numbers (the unit is in the words) */
const texQ = (u: Unit, x: number): string => (u.money ? texMoney(x) : texNum(x));

export const MC = {
  firstMentioned: 'mc.percent.first-mentioned-quantity-as-whole',
  bySize: 'mc.percent.whole-chosen-by-size-or-order',
  newBase: 'mc.percent.new-or-estimate-as-base',
  byTo: 'mc.percent.increased-by-vs-increased-to',
  diffAsPct: 'mc.percent.difference-number-as-percent',
  absRel: 'mc.ratio-rate.compares-by-one-quantity',
  unscaled: 'mc.percent.appends-percent-sign-to-unscaled-value',
  numeral: 'mc.percent.adds-or-subtracts-percent-numeral',
  changeAsFinal: 'mc.percent.change-reported-as-final-amount',
  lessThanOne: 'mc.fractions-concept.fraction-must-be-less-than-one',
  sameProc: 'mc.percent.same-procedure-for-every-unknown',
  changesCheck: 'mc.add-sub.changes-check-to-match-answer',
  trustsCalc: 'mc.estimation.trusts-calculator-display',
  roundedExact: 'mc.estimation.rounded-value-treated-as-exact',
  earlyRound: 'mc.decimals.intermediate-precision-always-invalid',
  addsSucc: 'mc.percent.adds-successive-percent-changes',
  lastAsOverall: 'mc.percent.reports-last-change-as-overall',
  pctOfAsChange: 'mc.percent.percent-of-read-as-percent-change',
  couponCommute: 'mc.percent.fixed-amount-and-percent-changes-commute',
  orderMatters: 'mc.percent.misjudges-order-of-changes',
  mismatched: 'mc.fractions-concept.adds-shares-with-mismatched-wholes',
  neverAdd: 'mc.percent.percents-can-never-be-added',
  negError: 'mc.percent.negative-percent-error',
} as const;

export type FamilyId =
  | 'base' | 'whichFrac' | 'byTo' | 'changeWord' | 'benchPct' | 'compare' | 'pctChange' | 'pctLabel'
  | 'twoStepUp' | 'twoStepDown' | 'multPick' | 'multNum' | 'over100' | 'over100Why' | 'choose'
  | 'estimate' | 'sanity' | 'round' | 'exactOrNot' | 'successive' | 'overall' | 'compose' | 'order'
  | 'undo' | 'noCancelWhy' | 'sameBase' | 'pctError' | 'closer';
export const FAMILIES: readonly { id: FamilyId; name: string }[] = [
  { id: 'base', name: 'Which amount is the base?' },
  { id: 'whichFrac', name: 'Which fraction?' },
  { id: 'byTo', name: 'Changed by, changed to' },
  { id: 'changeWord', name: 'Say the change' },
  { id: 'benchPct', name: 'Percent change on a tape' },
  { id: 'compare', name: 'Dollars or percent?' },
  { id: 'pctChange', name: 'Find the percent change' },
  { id: 'pctLabel', name: 'Name the change' },
  { id: 'twoStepUp', name: 'Add a percent' },
  { id: 'twoStepDown', name: 'Take off a percent' },
  { id: 'multPick', name: 'One multiplier' },
  { id: 'multNum', name: 'Find the multiplier' },
  { id: 'over100', name: 'More than 100%' },
  { id: 'over100Why', name: 'Can it be more than 100%?' },
  { id: 'choose', name: 'Which calculation?' },
  { id: 'estimate', name: 'Estimate first' },
  { id: 'sanity', name: 'Does the answer make sense?' },
  { id: 'round', name: 'Round at the end' },
  { id: 'exactOrNot', name: 'Exact or rounded?' },
  { id: 'successive', name: 'Two changes in a row' },
  { id: 'overall', name: 'The overall change' },
  { id: 'compose', name: 'Two multipliers, one change' },
  { id: 'order', name: 'Does the order matter?' },
  { id: 'undo', name: 'Undo a change' },
  { id: 'noCancelWhy', name: 'Why they don’t cancel' },
  { id: 'sameBase', name: 'When percents add' },
  { id: 'pctError', name: 'Percent error' },
  { id: 'closer', name: 'Which estimate is closer?' },
];
export const FAMILY_NAMES: Record<string, string> = Object.fromEntries(FAMILIES.map(f => [f.id, f.name]));

/** a picture the page draws with the ChangeTape model */
export interface TapePic {
  amounts: number[]; names: string[]; unit: Unit;
  cuts?: (number | undefined)[]; hide?: boolean[]; hideChange?: boolean; changeTex?: (string | undefined)[];
}
export interface ChangeItem extends Item {
  family: FamilyId;
  /** the situation as tapes (one chain of amounts) */
  tape?: TapePic;
  /** two situations side by side on one scale */
  pair?: [TapePic, TapePic];
}
type Gen = (R: () => number, n: number, sg?: string) => ChangeItem;

// ---------- contexts (US; money only where money is the point) ----------
interface Ctx {
  key: string; unit: Unit; upOnly?: boolean;
  what: string;               // 'the price'
  of: string;                 // 'the price of a concert ticket'
  names: [string, string];    // tape labels
  when: [string, string];     // sentence time phrases ('in 2015', 'now')
  was(x: string): string; now(x: string): string; nowFirst(x: string): string; wasAfter(x: string): string;
  /** typical size of the base */
  lo: number; hi: number; step: number;
}
const MONEY: Unit = { money: true };
const CTX: Ctx[] = [
  { key: 'ticket', unit: MONEY, what: 'the price', of: 'the price of a concert ticket', when: ['last year', 'this year'], names: ['last year', 'this year'], lo: 20, hi: 200, step: 5,
    was: x => `Last year a concert ticket cost ${x}.`, now: x => `This year it costs ${x}.`, nowFirst: x => `This year a concert ticket costs ${x}.`, wasAfter: x => `Last year it cost ${x}.` },
  { key: 'sneakers', unit: MONEY, what: 'the price', of: 'the price of the sneakers', when: ['before', 'now'], names: ['before', 'now'], lo: 40, hi: 160, step: 5,
    was: x => `A pair of sneakers cost ${x}.`, now: x => `Now the same pair costs ${x}.`, nowFirst: x => `A pair of sneakers costs ${x} now.`, wasAfter: x => `Before, the same pair cost ${x}.` },
  { key: 'town', unit: { money: false, word: 'people' }, what: 'the population', of: 'the population of a town', when: ['in 2015', 'in 2025'], names: ['2015', '2025'], lo: 400, hi: 9000, step: 100,
    was: x => `In 2015 a town had ${x}.`, now: x => `In 2025 it has ${x}.`, nowFirst: x => `In 2025 a town has ${x}.`, wasAfter: x => `In 2015 it had ${x}.` },
  { key: 'fans', unit: { money: false, word: 'fans' }, what: 'the attendance', of: 'the average attendance', when: ['last season', 'this season'], names: ['last season', 'this season'], lo: 200, hi: 2000, step: 20,
    was: x => `Last season an average game drew ${x}.`, now: x => `This season an average game draws ${x}.`, nowFirst: x => `This season an average game draws ${x}.`, wasAfter: x => `Last season it drew ${x}.` },
  { key: 'sunflower', unit: { money: false, word: 'in.' }, upOnly: true, what: 'the height', of: 'the height of a sunflower', when: ['in June', 'in August'], names: ['in June', 'in August'], lo: 12, hi: 40, step: 2,
    was: x => `In June a sunflower was ${x} tall.`, now: x => `In August it is ${x} tall.`, nowFirst: x => `In August a sunflower is ${x} tall.`, wasAfter: x => `In June it was ${x} tall.` },
  { key: 'club', unit: { money: false, word: 'members' }, what: 'the membership', of: 'the chess club’s membership', when: ['in the fall', 'in the spring'], names: ['in the fall', 'in the spring'], lo: 20, hi: 80, step: 4,
    was: x => `In the fall the chess club had ${x}.`, now: x => `In the spring it has ${x}.`, nowFirst: x => `In the spring the chess club has ${x}.`, wasAfter: x => `In the fall it had ${x}.` },
  { key: 'bike', unit: MONEY, what: 'the price', of: 'the price of a bike', when: ['in March', 'in May'], names: ['in March', 'in May'], lo: 80, hi: 600, step: 10,
    was: x => `In March a bike cost ${x}.`, now: x => `In May it costs ${x}.`, nowFirst: x => `In May a bike costs ${x}.`, wasAfter: x => `In March it cost ${x}.` },
];
const ctxs = (up: boolean) => CTX.filter(c => up || !c.upOnly);
const cap = (s: string) => s[0]!.toUpperCase() + s.slice(1);
const word = (d: 'up' | 'down') => (d === 'up' ? 'increase' : 'decrease');
const an = (d: 'up' | 'down') => (d === 'up' ? 'an increase' : 'a decrease');
const opp = (d: 'up' | 'down'): 'up' | 'down' => (d === 'up' ? 'down' : 'up');
const ansUnit = (u: Unit) => (u.money ? 'dollars' : u.word ?? '');
/** the before/after story, the original amber, the new amount bold; sometimes the new amount comes first */
function story(c: Ctx, a: number, b: number, newFirst: boolean): string {
  const fa = A(fmtQ(c.unit, a)), fb = `<b>${fmtQ(c.unit, b)}</b>`;
  return newFirst ? `${c.nowFirst(fb)} ${c.wasAfter(fa)}` : `${c.was(fa)} ${c.now(fb)}`;
}
/** a random base for context c (on its step grid) for which every percent in ps gives an exact result */
function baseFor(R: () => number, c: { unit: Unit; lo: number; hi: number; step: number }, ps: readonly number[], dp?: number): number {
  const places = dp ?? (c.unit.money ? 2 : 0);
  for (let t = 0; t < 300; t++) {
    const a = r9(int(R, Math.ceil(c.lo / c.step), Math.floor(c.hi / c.step)) * c.step);
    if (ps.every(p => exactTo(r9((a * p) / 100), places))) return a;
  }
  return r9(Math.ceil(c.lo / 100) * 100);
}
/** sections that show percent p on a tape (25% -> 4), or undefined */
const cutsFor = (p: number): number | undefined => ({ 10: 10, 20: 5, 25: 4, 50: 2, 75: 4, 100: 2, 200: 2, 150: 2, 300: 2 } as Record<number, number>)[p];

// ---------- checking helpers ----------
interface Wrong { v: number; mc?: string; say: string }
const notNum = (r: Response): Verdict | null => {
  if (r.kind === 'num' && !Number.isFinite(r.v)) return { ok: false, say: 'Type just the number, without a $ or % sign.' };
  if (r.kind === 'pair' && (!Number.isFinite(r.x) || !Number.isFinite(r.y))) return { ok: false, say: 'Type just the numbers, without a $ or % sign.' };
  return null;
};
function numCheck(ans: number, ok: string, wrongs: readonly Wrong[], fallback: string): Item['check'] {
  return r => {
    const bad = notNum(r); if (bad) return bad;
    if (r.kind !== 'num') return { ok: false, say: 'Type a number.' };
    if (near(r.v, ans)) return { ok: true, say: ok };
    const w = wrongs.find(w => !near(w.v, ans) && near(r.v, w.v));
    return w ? { ok: false, mc: w.mc, say: w.say } : { ok: false, say: fallback };
  };
}
interface Opt { t: string; ok?: boolean; mc?: string; say: string }
function choose(R: () => number, opts: Opt[]): Pick<ChangeItem, 'input' | 'choices' | 'answer' | 'check'> {
  const o = shuffle(R, [...opts]);
  const i = o.findIndex(x => x.ok);
  return { input: 'choice', choices: o.map(x => x.t), answer: { kind: 'choice', i }, check: r => (r.kind === 'choice' && o[r.i] ? { ok: !!o[r.i]!.ok, mc: o[r.i]!.mc, say: o[r.i]!.say } : { ok: false, say: 'Pick one answer.' }) };
}
/** "a" or "an" before a number read aloud (an 8%, an 11%, an 18%, an 80%; a 180%) */
export const article = (num: string) => (/^8/.test(num) || /^1[18](?![0-9])/.test(num) || /^1[18]\./.test(num) ? 'an' : 'a');
const pctWords = (p: number, d: 'up' | 'down' | 'none') => (d === 'none' ? 'no change' : `${article(fmtNum(p))} ${fmtPct(p)} ${word(d)}`);

// ---------- 1 identify-base ----------
function beforeAfter(R: () => number, ps: readonly number[], maxDown = 99) {
  const dir: 'up' | 'down' = R() < 0.5 ? 'up' : 'down';
  const c = pick(R, ctxs(dir === 'up'));
  const d = c.upOnly ? 'up' : dir;
  const p = pick(R, ps.filter(q => d === 'up' || q <= maxDown));
  const a = baseFor(R, c, [p]);
  return { c, d, p, a, b: apply(a, p, d) };
}
const baseGen: Gen = (R, n) => {
  const { c, d, p, a, b } = beforeAfter(R, [10, 20, 25, 50], 25);
  const newFirst = R() < 0.5, ch = change(a, b);
  const mcNew = newFirst ? MC.firstMentioned : b > a ? MC.bySize : MC.newBase;
  const whyNew = newFirst ? `It is mentioned first, but it is the amount AFTER the change.` : b > a ? `It is the bigger number, but it is the amount AFTER the change.` : `That is the amount AFTER the change.`;
  return {
    id: `base-${n}`, family: 'base', subgoal: 'identify-base',
    prompt: `${story(c, a, b, newFirst)} To find the percent change, which amount is the base, the 100%?`,
    board: `${texQ(c.unit, a)} \\to ${texQ(c.unit, b)}`,
    ...choose(R, [
      { t: fmtQ(c.unit, a), ok: true, say: `Yes: the base is the amount before the change, ${A(fmtQ(c.unit, a))}.` },
      { t: fmtQ(c.unit, b), mc: mcNew, say: `${whyNew} The base is the amount before: ${A(fmtQ(c.unit, a))}.` },
      { t: fmtQ(c.unit, ch.size), say: `${fmtQ(c.unit, ch.size)} is the change. It gets compared WITH the base, the amount before: ${A(fmtQ(c.unit, a))}.` },
    ]),
    tape: { amounts: [a, b], names: [...c.names], unit: c.unit, cuts: [cutsFor(p)] },
    solution: [`The base is the amount <b>before</b> the change: ${A(fmtQ(c.unit, a))} (${c.when[0]}). It is 100%.`,
      `That holds whether it is mentioned first or second, and whether it is bigger or smaller.`,
      `The change, ${B(fmtQ(c.unit, ch.size))}, is ${fmtPct(p)} of ${fmtQ(c.unit, a)}: ${pctWords(p, d)}.`],
  };
};
const whichFrac: Gen = (R, n) => {
  const { c, d, p, a, b } = beforeAfter(R, [10, 20, 25, 50], 25);
  const newFirst = R() < 0.5, ch = change(a, b);
  const x = fmtNum(ch.size), fa = fmtNum(a), fb = fmtNum(b);
  return {
    id: `whichFrac-${n}`, family: 'whichFrac', subgoal: 'identify-base',
    prompt: `${story(c, a, b, newFirst)} Which fraction gives the percent change?`,
    board: `${texQ(c.unit, a)} \\to ${texQ(c.unit, b)}`,
    ...choose(R, [
      { t: fr(x, fa), ok: true, say: `Yes: the change, ${B(x)}, over the base, ${A(fa)}. That is ${fmtPct(p)}.` },
      { t: fr(x, fb), mc: MC.newBase, say: `That divides by ${fb}, the amount AFTER the change. The base is the amount before, ${A(fa)}: ${fr(x, fa)} = ${fmtPct(p)}.` },
      { t: fr(fb, fa), mc: MC.pctOfAsChange, say: `${fr(fb, fa)} compares the whole new amount with the old one (${fmtPct(ch.pctOf)}). The percent CHANGE uses only the change: ${fr(x, fa)} = ${fmtPct(p)}.` },
    ]),
    tape: { amounts: [a, b], names: [...c.names], unit: c.unit, cuts: [cutsFor(p)] },
    solution: [`The change is ${B(x)}; the base is the amount before, ${A(fa)}.`, `Percent change = change ÷ base = ${fr(x, fa)} = ${fmtPct(p)}: ${pctWords(p, d)}.`],
  };
};

// ---------- 2 amount-of-change ----------
const byTo: Gen = (R, n) => {
  const v = R();
  const dir: 'up' | 'down' = R() < 0.55 ? 'up' : 'down';
  const c = pick(R, ctxs(dir === 'up'));
  const d = c.upOnly ? 'up' : dir;
  const hi = Math.min(1000, c.hi);
  const a = r9(int(R, Math.ceil(c.lo / 1), hi));
  const a0 = Math.max(1, Math.round(a));
  let size = int(R, Math.max(1, Math.round(a0 * 0.08)), Math.max(2, Math.round(a0 * 0.6)));
  if (d === 'down') size = Math.min(size, a0 - 1);
  if (d === 'down' && 2 * size === a0) size = Math.max(1, size - 1);
  const b = d === 'up' ? a0 + size : a0 - size;
  const u = c.unit, q = (x: number) => fmtQ(u, x);
  const unit = ansUnit(u);
  if (v < 0.12) {
    return {
      id: `byTo-${n}`, family: 'byTo', subgoal: 'amount-of-change',
      prompt: `${cap(c.of)} was ${A(q(a0))} ${c.when[0]}, and it is <b>${q(a0)}</b> ${c.when[1]}. By how much did it change?`,
      board: `${texQ(u, a0)} \\to ${texQ(u, a0)}`, input: 'num', unit,
      answer: { kind: 'num', v: 0 },
      check: numCheck(0, 'Yes: no change. The change is 0.', [{ v: a0, mc: MC.byTo, say: `${q(a0)} is the amount itself. It did not change at all, so the change is 0.` }], 'Both amounts are the same, so the change is 0.'),
      solution: [`Before: ${A(q(a0))}. After: <b>${q(a0)}</b>.`, `They are equal: no change, a change of 0.`],
    };
  }
  if (v < 0.55) {
    // "increased TO": the kid finds the size of the change
    return {
      id: `byTo-${n}`, family: 'byTo', subgoal: 'amount-of-change',
      prompt: `${cap(c.of)} was ${A(q(a0))} ${c.when[0]}. ${cap(c.when[1])} it has ${d === 'up' ? 'increased' : 'decreased'} <b>to</b> <b>${q(b)}</b>. By how much did it ${word(d)}?`,
      board: `${texQ(u, a0)} \\to ${texQ(u, b)}`, input: 'num', unit,
      answer: { kind: 'num', v: size },
      check: numCheck(size, `Yes: ${an(d)} of ${B(q(size))}.`, [
        { v: b, mc: MC.byTo, say: `“${d === 'up' ? 'Increased' : 'Decreased'} to ${q(b)}” gives the NEW amount. The change is the difference: ${d === 'up' ? `${fmtNum(b)} − ${fmtNum(a0)}` : `${fmtNum(a0)} − ${fmtNum(b)}`} = ${fmtNum(size)}.` },
        { v: -size, say: `The size of a change is never negative: larger minus smaller, ${fmtNum(size)}, and the word “${word(d)}” says which way.` },
      ], `The change is the larger amount minus the smaller one: ${fmtNum(Math.max(a0, b))} − ${fmtNum(Math.min(a0, b))} = ${fmtNum(size)}.`),
      tape: { amounts: [a0, b], names: [...c.names], unit: u, hideChange: true },
      solution: [`“${d === 'up' ? 'Increased' : 'Decreased'} to” names the new amount: <b>${q(b)}</b>.`, `The change is larger minus smaller: ${fmtNum(Math.max(a0, b))} − ${fmtNum(Math.min(a0, b))} = ${B(fmtNum(size))}.`, `So it is ${an(d)} of ${B(q(size))}.`],
    };
  }
  // "increased BY": the kid finds the new amount
  return {
    id: `byTo-${n}`, family: 'byTo', subgoal: 'amount-of-change',
    prompt: `${cap(c.of)} was ${A(q(a0))} ${c.when[0]}. ${cap(c.when[1])} it has ${d === 'up' ? 'increased' : 'decreased'} <b>by</b> ${B(q(size))}. What is it now?`,
    board: `${texQ(u, a0)} ${d === 'up' ? '+' : '-'} ${texQ(u, size)} = \\,?`, input: 'num', unit,
    answer: { kind: 'num', v: b },
    check: numCheck(b, `Yes: ${fmtNum(a0)} ${d === 'up' ? '+' : '−'} ${fmtNum(size)} = ${fmtNum(b)}.`, [
      { v: size, mc: MC.byTo, say: `“${d === 'up' ? 'Increased' : 'Decreased'} by ${q(size)}” gives the CHANGE, not the new amount. Now: ${fmtNum(a0)} ${d === 'up' ? '+' : '−'} ${fmtNum(size)} = ${fmtNum(b)}.` },
      { v: d === 'up' ? a0 - size : a0 + size, say: `Check the direction: it ${d === 'up' ? 'went up, so add' : 'went down, so subtract'}: ${fmtNum(b)}.` },
    ], `Start from ${fmtNum(a0)} and ${d === 'up' ? 'add' : 'take away'} the change ${fmtNum(size)}: ${fmtNum(b)}.`),
    tape: { amounts: [a0, b], names: [...c.names], unit: u, hide: [false, true] },
    solution: [`“${d === 'up' ? 'Increased' : 'Decreased'} by” names the change: ${B(q(size))}.`, `New amount: ${fmtNum(a0)} ${d === 'up' ? '+' : '−'} ${fmtNum(size)} = <b>${q(b)}</b>.`],
  };
};
const changeWord: Gen = (R, n) => {
  const dir: 'up' | 'down' = R() < 0.5 ? 'up' : 'down';
  const c = pick(R, ctxs(dir === 'up')), d = c.upOnly ? 'up' : dir;
  const a = Math.round(int(R, Math.ceil(c.lo / c.step), Math.floor(Math.min(1000, c.hi) / c.step)) * c.step);
  const eq = R() < 0.12;
  const size = eq ? 0 : Math.max(1, Math.round(a * pick(R, d === 'up' ? [0.1, 0.15, 0.2, 0.25, 0.3, 0.4, 0.5] : [0.1, 0.15, 0.2, 0.25, 0.3, 0.4])));
  const b = eq ? a : d === 'up' ? a + size : a - size;
  const q = (x: number) => fmtQ(c.unit, x), newFirst = R() < 0.4;
  const opts: Opt[] = eq
    ? [{ t: 'no change', ok: true, say: 'Yes: the amounts are equal, so there is no change.' },
      { t: `an increase of ${q(a)}`, mc: MC.byTo, say: `${q(a)} is the amount itself, not a change. Both amounts are ${q(a)}: no change.` },
      { t: `a decrease of ${q(a)}`, mc: MC.byTo, say: `${q(a)} is the amount itself, not a change. Both amounts are ${q(a)}: no change.` }]
    : [{ t: `${an(d)} of ${q(size)}`, ok: true, say: `Yes: ${an(d)} of ${B(q(size))}.` },
      { t: `${an(opp(d))} of ${q(size)}`, say: `It went from ${q(a)} to ${q(b)}: that is ${d === 'up' ? 'up' : 'down'}, ${an(d)}.` },
      { t: `${an(d)} of ${q(b)}`, mc: MC.byTo, say: `${q(b)} is the new amount, not the change. The change is ${fmtNum(Math.max(a, b))} − ${fmtNum(Math.min(a, b))} = ${fmtNum(size)}.` }];
  return {
    id: `changeWord-${n}`, family: 'changeWord', subgoal: 'amount-of-change',
    prompt: `${story(c, a, b, newFirst)} Which describes the change?`,
    board: `${texQ(c.unit, a)} \\to ${texQ(c.unit, b)}`,
    ...choose(R, opts),
    tape: eq ? undefined : { amounts: [a, b], names: [...c.names], unit: c.unit },
    solution: eq ? [`Before and after are both ${q(a)}: no change.`]
      : [`Before: ${A(q(a))} (${c.when[0]}). After: <b>${q(b)}</b>.`, `Larger minus smaller: ${fmtNum(Math.max(a, b))} − ${fmtNum(Math.min(a, b))} = ${B(fmtNum(size))}, and it went ${d}: ${an(d)} of ${q(size)}.`],
  };
};

// ---------- 3 percent-of-original (benchmarks, tape diagram) ----------
const pctWrongs = (a: number, b: number, p: number, c: Ctx | null): Wrong[] => {
  const ch = change(a, b), out: Wrong[] = [];
  const unitTxt = (x: number) => (c ? fmtQ(c.unit, x) : fmtNum(x));
  out.push({ v: r9(p / 100), mc: MC.unscaled, say: `${fmtNum(r9(p / 100))} is the change as a decimal. As a percent, multiply by 100: ${fmtPct(p)}.` });
  out.push({ v: ch.size, mc: MC.diffAsPct, say: `${unitTxt(ch.size)} is the change itself, not a percent. Compare it with the base: ${fmtNum(ch.size)} ÷ ${fmtNum(a)} = ${fmtPct(p)}.` });
  if (b > 0) out.push({ v: roundTo((ch.size / b) * 100, 1), mc: MC.newBase, say: `That compares the change with ${fmtNum(b)}, the amount AFTER. The base is the amount before: ${fmtNum(ch.size)} ÷ ${fmtNum(a)} = ${fmtPct(p)}.` });
  if (b > 0) out.push({ v: r9((ch.size / b) * 100), mc: MC.newBase, say: `That compares the change with ${fmtNum(b)}, the amount AFTER. The base is the amount before: ${fmtNum(ch.size)} ÷ ${fmtNum(a)} = ${fmtPct(p)}.` });
  out.push({ v: ch.pctOf, mc: MC.pctOfAsChange, say: `The new amount is ${fmtPct(ch.pctOf)} OF the old one. The change is the part ${ch.dir === 'up' ? 'above' : 'below'} 100%: ${fmtPct(p)}.` });
  return out;
};
const benchPct: Gen = (R, n) => {
  const { c, d, p, a, b } = beforeAfter(R, [10, 20, 25, 50, 75, 100]);
  const k = cutsFor(p);
  return {
    id: `benchPct-${n}`, family: 'benchPct', subgoal: 'percent-of-original',
    prompt: `${story(c, a, b, R() < 0.3)} By what percent did ${c.what} ${word(d)}?`,
    board: `${texQ(c.unit, a)} \\to ${texQ(c.unit, b)}`, input: 'num', unit: '%',
    answer: { kind: 'num', v: p },
    check: numCheck(p, `Yes: ${pctWords(p, d)}.`, pctWrongs(a, b, p, c), `Compare the change with the base: ${fmtNum(change(a, b).size)} ÷ ${fmtNum(a)} = ${fmtPct(p)}.`),
    tape: { amounts: [a, b], names: [...c.names], unit: c.unit, cuts: [k] },
    solution: [`The base, ${A(fmtQ(c.unit, a))}, is 100%. Cut it into ${k} equal parts: each is ${fmtPct(100 / k!)}.`,
      `The change, ${B(fmtQ(c.unit, change(a, b).size))}, is ${p / (100 / k!) === 1 ? 'one part' : `${p / (100 / k!)} parts`}: ${fmtNum(change(a, b).size)} ÷ ${fmtNum(a)} = ${fmtPct(p)}.`,
      `So it is ${pctWords(p, d)}.`],
  };
};

// ---------- 4 absolute-vs-relative ----------
const PAIRS = [['Lakeview', 'Hillside'], ['Store A', 'Store B'], ['Jade’s plant', 'Omar’s plant']] as const;
const compare: Gen = (R, n) => {
  const kind = pick(R, ['sameAbs', 'bigAbsSmallPct', 'samePct'] as const);
  const set = int(R, 0, 2);
  const [n1, n2] = PAIRS[set]!;
  const unit: Unit = set === 0 ? { money: false, word: 'people' } : set === 1 ? MONEY : { money: false, word: 'in.' };
  const d: 'up' | 'down' = set === 2 ? 'up' : R() < 0.6 ? 'up' : 'down';
  const scale = set === 0 ? 100 : set === 1 ? 5 : 2;
  let a1: number, a2: number, c1: number, c2: number;
  if (kind === 'sameAbs') {
    a1 = scale * pick(R, [4, 5, 6, 8]); a2 = a1 * pick(R, [2, 3]); c1 = c2 = scale * pick(R, [1, 2]);
  } else if (kind === 'bigAbsSmallPct') {
    a1 = scale * pick(R, [4, 5]); c1 = scale * pick(R, [1, 2]); a2 = a1 * pick(R, [3, 4]); c2 = c1 + scale * pick(R, [1, 2]);
    if (c2 / a2 >= c1 / a1) c2 = c1 + scale;
  } else {
    a1 = scale * pick(R, [4, 5, 8]); const f = pick(R, [0.25, 0.5]); a2 = a1 * pick(R, [2, 3]); c1 = a1 * f; c2 = a2 * f;
  }
  if (d === 'down') { c1 = Math.min(c1, a1 / 2); c2 = Math.min(c2, a2 / 2); if (kind === 'samePct') { c1 = a1 / 4; c2 = a2 / 4; } }
  const swap = R() < 0.5;
  interface Side { name: string; a: number; c: number }
  const P1: Side = { name: n1, a: swap ? a2 : a1, c: swap ? c2 : c1 }, P2: Side = { name: n2, a: swap ? a1 : a2, c: swap ? c1 : c2 };
  const pc = (x: { a: number; c: number }) => r9((x.c / x.a) * 100);
  const q = (x: number) => fmtQ(unit, x);
  const b = (x: { a: number; c: number }) => (d === 'up' ? x.a + x.c : x.a - x.c);
  const same = near(pc(P1), pc(P2));
  const win = same ? null : pc(P1) > pc(P2) ? P1 : P2, lose = win === P1 ? P2 : P1;
  const bigAbs = P1.c > P2.c ? P1 : P2.c > P1.c ? P2 : null;
  const line = (x: typeof P1) => `${x.name}: ${q(x.a)} to ${q(b(x))}, a change of ${q(x.c)} out of ${q(x.a)}, ${fmtPct(pc(x))}.`;
  const opts: Opt[] = [P1, P2].map(x => {
    if (x === win) return { t: x.name, ok: true, say: `Yes. ${x.name}: ${fmtNum(x.c)} ÷ ${fmtNum(x.a)} = ${fmtPct(pc(x))}; ${lose.name}: ${fmtPct(pc(lose))}.` };
    return { t: x.name, mc: x === bigAbs || same ? MC.absRel : undefined, say: same ? `The changes are different, but so are the bases: both are ${fmtPct(pc(x))}.` : `${x === bigAbs ? `${x.name} changed by more ${unit.money ? 'dollars' : unit.word}, but compared with its base it is less. ` : ''}${x.name}: ${fmtPct(pc(x))}; ${win!.name}: ${fmtPct(pc(win!))}.` };
  });
  opts.push(same ? { t: 'the same percent', ok: true, say: `Yes: both are ${fmtPct(pc(P1))}, even though the changes are different.` }
    : { t: 'the same percent', mc: kind === 'sameAbs' ? MC.absRel : undefined, say: `${kind === 'sameAbs' ? 'The changes are equal, but the bases are not. ' : ''}${line(P1)} ${line(P2)}` });
  return {
    id: `compare-${n}`, family: 'compare', subgoal: 'absolute-vs-relative',
    prompt: `${set === 0 ? `The population of ${P1.name} went from` : set === 1 ? `At ${P1.name} the price of a lamp went from` : `${P1.name} grew from`} ${A(q(P1.a))} to <b>${q(b(P1))}</b>. ${set === 0 ? `The population of ${P2.name} went from` : set === 1 ? `At ${P2.name} it went from` : `${P2.name} grew from`} ${A(q(P2.a))} to <b>${q(b(P2))}</b>. Which had the bigger percent ${word(d)}?`,
    board: `${texQ(unit, P1.a)} \\to ${texQ(unit, b(P1))},\\ ${texQ(unit, P2.a)} \\to ${texQ(unit, b(P2))}`,
    ...choose(R, opts),
    pair: [{ amounts: [P1.a, b(P1)], names: [`${P1.name}, before`, 'after'], unit }, { amounts: [P2.a, b(P2)], names: [`${P2.name}, before`, 'after'], unit }],
    solution: [`Compare each change with its OWN base.`, line(P1), line(P2), same ? 'The same percent.' : `${win!.name} has the bigger percent ${word(d)}.`],
  };
};

// ---------- 5 compute-percent-change ----------
const P_ANY = [2, 4, 5, 8, 12, 12.5, 15, 16, 30, 35, 37.5, 45, 60, 62.5, 64, 80, 120, 150];
function anyChange(R: () => number, noneOk: boolean) {
  const none = noneOk && R() < 0.07;
  const dir: 'up' | 'down' = R() < 0.5 ? 'up' : 'down';
  const c = pick(R, ctxs(dir === 'up')), d = c.upOnly ? 'up' : dir;
  const p = none ? 0 : pick(R, P_ANY.filter(q => d === 'up' || q < 100));
  const big = R() < 0.4;
  const cc = big && !c.upOnly ? { ...c, hi: Math.min(10000, c.hi * 4) } : c;
  const a = baseFor(R, cc, [p]);
  const b = none ? a : apply(a, p, d);
  return { c, d: none ? ('none' as const) : d, p, a, b };
}
const pctChange: Gen = (R, n) => {
  const { c, d, p, a, b } = anyChange(R, true);
  const calc = a >= 1000 || !Number.isInteger(a) || !Number.isInteger(b) || !Number.isInteger(p);
  return {
    id: `pctChange-${n}`, family: 'pctChange', subgoal: 'compute-percent-change',
    prompt: `${story(c, a, b, R() < 0.3)} By what percent did ${c.what} change? Type the size of the change as a percent. <i>${calc ? 'Calculator allowed.' : 'No calculator.'}</i>`,
    board: `${texQ(c.unit, a)} \\to ${texQ(c.unit, b)}`, input: 'num', unit: '%',
    answer: { kind: 'num', v: p },
    check: numCheck(p, d === 'none' ? 'Yes: no change, 0%.' : `Yes: ${pctWords(p, d)}.`, d === 'none' ? [] : pctWrongs(a, b, p, c),
      d === 'none' ? 'The two amounts are equal: no change, 0%.' : `Change ÷ base: ${fmtNum(change(a, b).size)} ÷ ${fmtNum(a)} = ${fmtNum(p / 100)} = ${fmtPct(p)}.`),
    tape: { amounts: [a, b], names: [...c.names], unit: c.unit },
    solution: d === 'none' ? ['Before and after are equal: no change, 0%.']
      : [`Change: ${fmtNum(Math.max(a, b))} − ${fmtNum(Math.min(a, b))} = ${B(fmtNum(change(a, b).size))} (${word(d)}).`,
        `Divide by the base, the amount before: ${fmtNum(change(a, b).size)} ÷ ${A(fmtNum(a))} = ${fmtNum(p / 100)}.`,
        `As a percent: ${fmtNum(p / 100)} × 100 = ${S(fmtPct(p))}, ${pctWords(p, d)}.`],
  };
};
const pctLabel: Gen = (R, n) => {
  let g = anyChange(R, false);
  for (let t = 0; t < 20 && (g.d === 'none' || near(roundTo((change(g.a, g.b).size / g.b) * 100, 1), g.p) || g.b === 0); t++) g = anyChange(R, false);
  const { c, p, a, b } = g; const d = g.d as 'up' | 'down';
  const ch = change(a, b), qn = roundTo((ch.size / b) * 100, 1);
  return {
    id: `pctLabel-${n}`, family: 'pctLabel', subgoal: 'compute-percent-change',
    prompt: `${story(c, a, b, R() < 0.3)} Which describes the change?`,
    board: `${texQ(c.unit, a)} \\to ${texQ(c.unit, b)}`,
    ...choose(R, [
      { t: pctWords(p, d), ok: true, say: `Yes: ${fmtNum(ch.size)} ÷ ${fmtNum(a)} = ${fmtPct(p)}, and it went ${d}.` },
      { t: pctWords(p, opp(d)), say: `The size is right, but it went from ${fmtQ(c.unit, a)} to ${fmtQ(c.unit, b)}: ${d}, ${an(d)}.` },
      { t: pctWords(qn, d).replace(/^a /, 'about a ').replace(/^an /, 'about an '), mc: MC.newBase, say: `That divides by ${fmtNum(b)}, the amount after. The base is the amount before: ${fmtNum(ch.size)} ÷ ${fmtNum(a)} = ${fmtPct(p)}.` },
      { t: pctWords(r9(p / 100), d), mc: MC.unscaled, say: `${fmtNum(r9(p / 100))} is the decimal. As a percent it is ${fmtNum(r9(p / 100))} × 100 = ${fmtPct(p)}.` },
    ]),
    tape: { amounts: [a, b], names: [...c.names], unit: c.unit },
    solution: [`Change: ${B(fmtNum(ch.size))}; base: ${A(fmtNum(a))} (the amount before).`, `${fmtNum(ch.size)} ÷ ${fmtNum(a)} = ${fmtNum(p / 100)} = ${fmtPct(p)}; it went ${d}: ${S(pctWords(p, d))}.`],
  };
};

// ---------- 6, 7 apply a percent in two steps ----------
interface ApplyCtx { ask?: string; ps: number[]; set(a: string, p: string, art: string): string; lead: string; op: string; lo: number; hi: number; step: number; unit: Unit; names: [string, string] }
const UP: ApplyCtx[] = [
  { ps: [5, 6, 7, 8, 10, 4.5, 6.5, 7.5, 8.25], set: (a, p) => `A pair of headphones costs ${a}. The sales tax is ${p}.`, lead: 'tax&nbsp;$', op: 'total $', lo: 20, hi: 300, step: 0.5, unit: MONEY, names: ['price', 'with tax'] },
  { ps: [10, 15, 18, 20, 25], set: (a, p, art) => `A family’s dinner costs ${a}. They leave ${art} ${p} tip.`, lead: 'tip&nbsp;$', op: 'total $', lo: 20, hi: 160, step: 0.5, unit: MONEY, names: ['meal', 'with tip'] },
  { ps: [20, 25, 30, 40, 50, 60, 35, 45], set: (a, p) => `A store buys a lamp for ${a} and marks it up ${p}.`, lead: 'markup&nbsp;$', op: 'price $', lo: 10, hi: 400, step: 1, unit: MONEY, names: ['cost', 'store price'] },
  { ps: [2, 3, 4, 5, 6, 8, 10, 2.5], set: (a, p, art) => `Sam earns ${a} an hour and gets ${art} ${p} raise.`, lead: 'raise&nbsp;$', op: 'new pay $', lo: 9, hi: 40, step: 0.25, unit: MONEY, names: ['pay now', 'new pay'] },
];
const DOWN: ApplyCtx[] = [
  { ps: [10, 15, 20, 25, 30, 40, 50, 12.5, 35], set: (a, p) => `A jacket costs ${a}. It is ${p} off.`, lead: 'discount&nbsp;$', op: 'sale price $', lo: 20, hi: 240, step: 1, unit: MONEY, names: ['price', 'sale price'] },
  { ps: [10, 20, 25, 30, 40, 15, 37.5], set: (a, p) => `A store marks a ${a} video game down ${p}.`, lead: 'markdown&nbsp;$', op: 'new price $', lo: 20, hi: 80, step: 1, unit: MONEY, names: ['price', 'new price'] },
  { ask: 'Find how many fewer people there are, and how many there are now.', ps: [2, 4, 5, 8, 10, 12, 15, 2.5, 7.5], set: (a, p) => `A town had ${a}. Over ten years its population went down ${p}.`, lead: 'fewer&nbsp;people', op: 'people now', lo: 400, hi: 9000, step: 100, unit: { money: false, word: 'people' }, names: ['before', 'ten years later'] },
];
function applyItem(R: () => number, n: number, d: 'up' | 'down'): ChangeItem {
  const k = pick(R, d === 'up' ? UP : DOWN);
  const hundred = d === 'down' && R() < 0.06;
  const p = hundred ? 100 : pick(R, k.ps);
  const a = baseFor(R, k, [p]);
  const ch = r9((a * p) / 100), b = apply(a, p, d);
  const q = (x: number) => fmtQ(k.unit, x), sg = d === 'up' ? 'apply-increase' : 'apply-decrease';
  const fam = d === 'up' ? 'twoStepUp' : 'twoStepDown';
  const sign = d === 'up' ? '+' : '−';
  return {
    id: `${fam}-${n}`, family: fam, subgoal: sg,
    prompt: `${k.set(A(q(a)), `<b>${fmtPct(p)}</b>`, article(fmtNum(p)))} ${k.ask ?? `Find the ${d === 'up' ? 'increase' : 'amount taken off'} and the new amount.`}`,
    board: `${texPct(p)}\\ \\text{of}\\ ${texQ(k.unit, a)}`, input: 'pair', pairLead: k.lead, pairOp: k.op,
    answer: { kind: 'pair', x: ch, y: b },
    check: r => {
      const bad = notNum(r); if (bad) return bad;
      if (r.kind !== 'pair') return { ok: false, say: 'Fill in both boxes.' };
      const xOk = near(r.x, ch), yOk = near(r.y, b);
      if (xOk && yOk) return { ok: true, say: `Yes: ${fmtPct(p)} of ${q(a)} is ${q(ch)}, and ${fmtNum(a)} ${sign} ${fmtNum(ch)} = ${q(b)}.` };
      if (near(r.y, ch) && !near(ch, b)) return { ok: false, mc: MC.changeAsFinal, say: `${q(ch)} is the ${d === 'up' ? 'increase' : 'amount taken off'}, not the new amount. ${d === 'up' ? 'Add it to' : 'Take it from'} ${q(a)}: ${q(b)}.` };
      const numY = d === 'up' ? r9(a + p) : r9(a - p);
      if (near(r.x, p) || near(r.y, numY)) return { ok: false, mc: MC.numeral, say: `${fmtPct(p)} is not ${q(p)}: it is ${p} hundredths OF ${q(a)}, which is ${fmtNum(a)} × ${fmtNum(p / 100)} = ${q(ch)}.` };
      if (xOk) return { ok: false, say: `The ${d === 'up' ? 'increase' : 'discount'} is right. Now ${d === 'up' ? 'add it to' : 'subtract it from'} ${q(a)}: ${fmtNum(a)} ${sign} ${fmtNum(ch)} = ${q(b)}.` };
      return { ok: false, say: `${fmtPct(p)} of ${q(a)} = ${fmtNum(p / 100)} × ${fmtNum(a)} = ${q(ch)}; then ${fmtNum(a)} ${sign} ${fmtNum(ch)} = ${q(b)}.` };
    },
    tape: { amounts: [a, b], names: [...k.names], unit: k.unit, hide: [false, true], hideChange: true, cuts: [cutsFor(p)] },
    solution: [`${fmtPct(p)} of ${A(q(a))}: ${fmtNum(p / 100)} × ${fmtNum(a)} = ${B(q(ch))}.`, `${d === 'up' ? 'Add it' : 'Take it away'}: ${fmtNum(a)} ${sign} ${fmtNum(ch)} = ${S(q(b))}.`],
  };
}
const twoStepUp: Gen = (R, n) => applyItem(R, n, 'up');
const twoStepDown: Gen = (R, n) => applyItem(R, n, 'down');

// ---------- 8 one multiplier ----------
const multTxt = (m: number) => fmtNum(m, 4);
const multPick: Gen = (R, n) => {
  const d: 'up' | 'down' = R() < 0.5 ? 'up' : 'down';
  const p = pick(R, d === 'up' ? [6, 8, 15, 20, 25, 35, 8.25, 4.5] : [10, 15, 20, 30, 35, 40, 12.5]);
  const m = multiplier(p, d), r = r9(p / 100);
  if (R() < 0.5) {
    const a = pick(R, [40, 60, 80, 120, 150, 200, 250]);
    const what = d === 'up' ? pick(R, ['a markup', 'a sales tax', 'a raise']) : pick(R, ['a discount', 'a markdown']);
    return {
      id: `multPick-${n}`, family: 'multPick', subgoal: 'change-multiplier',
      prompt: `${cap(what)} of <b>${fmtPct(p)}</b> on ${A(fmtMoney(a))}. Which single multiplication gives the new amount?`,
      board: `${texNum(a)} ${d === 'up' ? '+' : '-'} ${texNum(r)} \\times ${texNum(a)}`,
      ...choose(R, [
        { t: `${multTxt(m)} × ${a}`, ok: true, say: `Yes: ${a} ${d === 'up' ? '+' : '−'} ${fmtNum(r)} × ${a} = (1 ${d === 'up' ? '+' : '−'} ${fmtNum(r)}) × ${a} = ${multTxt(m)} × ${a}.` },
        { t: `${multTxt(r)} × ${a}`, mc: MC.changeAsFinal, say: `${multTxt(r)} × ${a} is only the ${d === 'up' ? 'increase' : 'amount taken off'}. The new amount is ${d === 'up' ? '1 + ' : '1 − '}${fmtNum(r)} = ${multTxt(m)} times ${a}.` },
        { t: `${multTxt(multiplier(p, opp(d)))} × ${a}`, say: `That would be ${an(opp(d))}. For ${an(d)}: 1 ${d === 'up' ? '+' : '−'} ${fmtNum(r)} = ${multTxt(m)}.` },
      ]),
      solution: [`${a} ${d === 'up' ? '+' : '−'} ${fmtNum(r)} × ${a} = 1 × ${a} ${d === 'up' ? '+' : '−'} ${fmtNum(r)} × ${a} = (1 ${d === 'up' ? '+' : '−'} ${fmtNum(r)}) × ${a}.`, `So one multiplier does it: ${S(`× ${multTxt(m)}`)}.`],
    };
  }
  return {
    id: `multPick-${n}`, family: 'multPick', subgoal: 'change-multiplier',
    prompt: `A price is multiplied by <b>${multTxt(m)}</b>. What percent change is that?`,
    board: `\\text{price} \\times ${texNum(m)}`,
    ...choose(R, [
      { t: pctWords(p, d), ok: true, say: `Yes: ${multTxt(m)} = 1 ${d === 'up' ? '+' : '−'} ${fmtNum(r)}, so ${pctWords(p, d)}.` },
      { t: pctWords(r9(m * 100), d), mc: MC.pctOfAsChange, say: `${multTxt(m)} means the new price is ${fmtPct(r9(m * 100))} OF the old one. The change is the gap from 100%: ${pctWords(p, d)}.` },
      { t: pctWords(p, opp(d)), say: `${multTxt(m)} is ${d === 'up' ? 'more' : 'less'} than 1, so the price goes ${d}: ${pctWords(p, d)}.` },
    ]),
    solution: [`× 1 keeps the price the same (100%).`, `${multTxt(m)} = 1 ${d === 'up' ? '+' : '−'} ${fmtNum(r)}: the price ${d === 'up' ? 'gains' : 'loses'} ${fmtPct(p)}, ${S(pctWords(p, d))}.`],
  };
};
const multNum: Gen = (R, n) => {
  const d: 'up' | 'down' = R() < 0.55 ? 'up' : 'down';
  const p = pick(R, d === 'up' ? [3, 5, 6, 7, 8, 12, 15, 18, 8.25, 6.5, 7.5] : [5, 10, 15, 20, 25, 30, 40, 12.5, 2.5]);
  const m = multiplier(p, d), r = r9(p / 100);
  const ar = article(fmtNum(p));
  const what = d === 'up' ? pick(R, [`${ar} ${fmtPct(p)} sales tax`, `${ar} ${fmtPct(p)} raise`, `${ar} ${fmtPct(p)} markup`]) : pick(R, [`${fmtPct(p)} off`, `${ar} ${fmtPct(p)} drop in price`]);
  return {
    id: `multNum-${n}`, family: 'multNum', subgoal: 'change-multiplier',
    prompt: `What single number do you multiply a price by for ${what}?`,
    board: `\\text{price} \\times \\,?`, input: 'num', unit: '',
    answer: { kind: 'num', v: m },
    check: numCheck(m, `Yes: 1 ${d === 'up' ? '+' : '−'} ${fmtNum(r)} = ${multTxt(m)}.`, [
      { v: r, mc: MC.changeAsFinal, say: `× ${fmtNum(r)} gives only the ${d === 'up' ? 'increase' : 'amount taken off'}. Keep the price too: 1 ${d === 'up' ? '+' : '−'} ${fmtNum(r)} = ${multTxt(m)}.` },
      { v: d === 'up' ? 100 + p : 100 - p, say: `${fmtPct(d === 'up' ? 100 + p : 100 - p)} is right as a percent; as a decimal it is ${multTxt(m)}.` },
      { v: multiplier(p, opp(d)), say: `That is the multiplier for ${an(opp(d))}. For ${an(d)}: 1 ${d === 'up' ? '+' : '−'} ${fmtNum(r)} = ${multTxt(m)}.` },
    ], `${fmtPct(p)} = ${fmtNum(r)}, and the price itself is 1 whole: 1 ${d === 'up' ? '+' : '−'} ${fmtNum(r)} = ${multTxt(m)}.`),
    solution: [`price ${d === 'up' ? '+' : '−'} ${fmtNum(r)} × price = (1 ${d === 'up' ? '+' : '−'} ${fmtNum(r)}) × price.`, `So the multiplier is ${S(multTxt(m))}.`],
  };
};

// ---------- 9 over 100 % ----------
const over100: Gen = (R, n) => {
  const v = R();
  const c = pick(R, CTX.filter(x => x.key !== 'club'));
  const q = (x: number) => fmtQ(c.unit, x), unit = ansUnit(c.unit);
  if (v < 0.4) {
    const mlt = pick(R, [2, 3, 2.5, 4]);
    const p = r9((mlt - 1) * 100), a = baseFor(R, { ...c, hi: Math.min(c.hi, 2500) }, [p]), b = r9(a * mlt);
    return {
      id: `over100-${n}`, family: 'over100', subgoal: 'over-100-percent',
      prompt: `${story(c, a, b, false)} By what percent did ${c.what} increase?`,
      board: `${texQ(c.unit, a)} \\to ${texQ(c.unit, b)}`, input: 'num', unit: '%',
      answer: { kind: 'num', v: p },
      check: numCheck(p, `Yes: the change, ${q(b - a)}, is ${fmtNum(mlt - 1)} times the base: a ${fmtPct(p)} increase.`, [
        { v: r9(mlt * 100), mc: MC.pctOfAsChange, say: `${q(b)} is ${fmtPct(mlt * 100)} OF ${q(a)}. The increase is what is added on top of the first 100%: ${fmtPct(p)}.` },
        { v: 100, mc: MC.lessThanOne, say: `A percent increase can go past 100%. The change, ${q(b - a)}, is ${fmtNum(mlt - 1)} times ${q(a)}: ${fmtPct(p)}.` },
        { v: r9(b - a), mc: MC.diffAsPct, say: `${q(b - a)} is the change itself. Compared with the base: ${fmtNum(b - a)} ÷ ${fmtNum(a)} = ${fmtPct(p)}.` },
      ], `Change ÷ base: ${fmtNum(b - a)} ÷ ${fmtNum(a)} = ${fmtNum(mlt - 1)} = ${fmtPct(p)}.`),
      tape: { amounts: [a, b], names: [...c.names], unit: c.unit, cuts: [2] },
      solution: [`Change: ${fmtNum(b)} − ${fmtNum(a)} = ${B(fmtNum(b - a))}.`, `${fmtNum(b - a)} ÷ ${A(fmtNum(a))} = ${fmtNum(mlt - 1)} = ${S(fmtPct(p))}. More than 100%: the change is bigger than the base.`],
    };
  }
  if (v < 0.85) {
    const p = pick(R, [100, 150, 200, 250, 300]), byForm = v < 0.62;
    const cc = c.upOnly || c.key === 'sunflower' ? CTX[2]! : c;
    const a = baseFor(R, { ...cc, hi: Math.min(cc.hi, 2000) }, [p]);
    const by = apply(a, p, 'up'), of = r9((a * p) / 100), ans = byForm ? by : of;
    const qq = (x: number) => fmtQ(cc.unit, x);
    return {
      id: `over100-${n}`, family: 'over100', subgoal: 'over-100-percent',
      prompt: byForm ? `${cap(cc.of)} was ${A(qq(a))} ${cc.when[0]}. Since then it has <b>increased by ${fmtPct(p)}</b>. What is it now?`
        : `${cap(cc.of)} was ${A(qq(a))} ${cc.when[0]}. ${cap(cc.when[1])} it <b>is ${fmtPct(p)} of</b> that. What is it now?`,
      board: byForm ? `${texQ(cc.unit, a)} \\times (1 + ${texNum(p / 100)})` : `${texPct(p)}\\ \\text{of}\\ ${texQ(cc.unit, a)}`, input: 'num', unit: ansUnit(cc.unit),
      answer: { kind: 'num', v: ans },
      check: numCheck(ans, byForm ? `Yes: the base plus ${fmtPct(p)} of it, ${fmtNum(a)} × ${fmtNum(1 + p / 100)} = ${qq(by)}.` : `Yes: ${fmtNum(a)} × ${fmtNum(p / 100)} = ${qq(of)}.`, [
        byForm ? { v: of, mc: MC.byTo, say: `${qq(of)} is ${fmtPct(p)} OF ${qq(a)}. “Increased by ${fmtPct(p)}” keeps the base and adds ${fmtPct(p)}: ${fmtNum(a)} × ${fmtNum(1 + p / 100)} = ${qq(by)}.` }
          : { v: by, mc: MC.byTo, say: `“Is ${fmtPct(p)} of” means × ${fmtNum(p / 100)}: ${qq(of)}. ${qq(by)} would be “increased BY ${fmtPct(p)}”.` },
        { v: r9(a + p), mc: MC.numeral, say: `${fmtPct(p)} is a part of ${qq(a)}, not ${p} more ${cc.unit.money ? 'dollars' : cc.unit.word}.` },
      ], byForm ? `Increased by ${fmtPct(p)}: × (1 + ${fmtNum(p / 100)}) = × ${fmtNum(1 + p / 100)}: ${qq(by)}.` : `${fmtPct(p)} of ${qq(a)} = ${fmtNum(p / 100)} × ${fmtNum(a)} = ${qq(of)}.`),
      tape: { amounts: [a, ans], names: [...cc.names], unit: cc.unit, hide: [false, true], hideChange: true, cuts: [2] },
      solution: byForm ? [`“Increased by ${fmtPct(p)}”: keep the base (100%) and add ${fmtPct(p)}: ${fmtPct(100 + p)} of it.`, `${fmtNum(a)} × ${fmtNum(1 + p / 100)} = ${S(qq(by))}.`]
        : [`“Is ${fmtPct(p)} of” the base: × ${fmtNum(p / 100)}.`, `${fmtNum(a)} × ${fmtNum(p / 100)} = ${S(qq(of))}. (That is an increase of ${fmtPct(p - 100)}.)`],
    };
  }
  const a = pick(R, [120, 150, 240, 360, 480]);
  return {
    id: `over100-${n}`, family: 'over100', subgoal: 'over-100-percent',
    prompt: `A food bank had ${A(`${a} cans`)} of soup. By Friday the number of cans had gone <b>down 100%</b>. How many cans are left?`,
    board: `${a} \\times (1 - 1) = \\,?`, input: 'num', unit: 'cans',
    answer: { kind: 'num', v: 0 },
    check: numCheck(0, 'Yes: a 100% decrease takes away all of it. 0 cans are left.', [
      { v: a - 100, mc: MC.numeral, say: `100% is not 100 cans: it is ALL of the ${a} cans. 0 are left.` },
      { v: a, mc: MC.changeAsFinal, say: `${a} cans is the amount taken away (100% of ${a}). What is left: ${a} − ${a} = 0.` },
    ], `100% of ${a} is all ${a} cans, so 0 are left.`),
    tape: { amounts: [a, 0], names: ['Monday', 'Friday'], unit: { money: false, word: 'cans' }, hide: [false, true] },
    solution: [`100% of ${A(`${a} cans`)} is all ${a} of them.`, `${a} − ${a} = ${S('0')}. A decrease cannot go past 100% here: there is nothing left to take.`],
  };
};
const over100Why: Gen = (R, n) => {
  if (R() < 0.55) {
    const a = pick(R, [8, 10, 12, 15, 20]), mlt = pick(R, [3, 4, 2.5]), b = r9(a * mlt), p = r9((mlt - 1) * 100);
    const who = pick(R, ['Mia', 'Leo', 'Ava', 'Kai']);
    return {
      id: `over100Why-${n}`, family: 'over100Why', subgoal: 'over-100-percent',
      prompt: `A sunflower grew from ${A(`${a} in.`)} to <b>${fmtNum(b)} in.</b> ${who} says: “That can’t be a ${fmtPct(p)} increase. Percents stop at 100%.” What is true?`,
      board: `${a} \\to ${texNum(b)}`,
      ...choose(R, [
        { t: `It is a ${fmtPct(p)} increase: the change, ${fmtNum(b - a)} in., is ${fmtNum(mlt - 1)} times the base.`, ok: true, say: `Yes. A change can be bigger than its base, so a percent increase can pass 100%.` },
        { t: `${who} is right: a percent can’t be more than 100%.`, mc: MC.lessThanOne, say: `A percent compares with the base; it can be more than 100%. Here the change, ${fmtNum(b - a)} in., is ${fmtNum(mlt - 1)} times the ${a} in. base: ${fmtPct(p)}.` },
        { t: `It is a ${fmtPct(mlt * 100)} increase.`, mc: MC.pctOfAsChange, say: `${fmtNum(b)} in. is ${fmtPct(mlt * 100)} OF ${a} in. The increase is the part above 100%: ${fmtPct(p)}.` },
      ]),
      tape: { amounts: [a, b], names: ['in June', 'in August'], unit: { money: false, word: 'in.' }, cuts: [2] },
      solution: [`Change: ${fmtNum(b)} − ${a} = ${B(`${fmtNum(b - a)} in.`)}`, `${fmtNum(b - a)} ÷ ${A(a)} = ${fmtNum(mlt - 1)} = ${S(fmtPct(p))}. Increases can pass 100%.`],
    };
  }
  const a = pick(R, [20, 40, 50, 80]), p = pick(R, [110, 120, 150]);
  return {
    id: `over100Why-${n}`, family: 'over100Why', subgoal: 'over-100-percent',
    prompt: `Can the price of a ${A(fmtMoney(a))} game go <b>down ${fmtPct(p)}</b>?`,
    board: `${texMoney(a)} - ${texPct(p)}\\ \\text{of}\\ ${texMoney(a)}`,
    ...choose(R, [
      { t: `No: a 100% decrease already takes it to $0.`, ok: true, say: `Yes. Down 100% leaves $0, and a price can’t go below $0.` },
      { t: `No: no percent can be more than 100%.`, mc: MC.lessThanOne, say: `The answer “no” is right, but not the reason: increases CAN pass 100% (doubling is +100%, tripling +200%). A decrease stops at 100% because that leaves $0.` },
      { t: `Yes: it would cost ${fmtMoney(a - a * p / 100).replace('−', '−')}.`, say: `Down ${fmtPct(p)} would take off more than the whole price. Down 100% already leaves $0.` },
    ]),
    solution: [`Down 100% takes away all of ${A(fmtMoney(a))}: $0 left.`, `So for a price (never below $0) a decrease is at most 100%. Increases have no such limit.`],
  };
};

// ---------- 10 choose-operation ----------
const chooseGen: Gen = (R, n) => {
  const rate = R() < 0.5;
  if (rate) {
    const k = pick(R, [
      { s: (a: string, b: string) => `Mia’s pay went from ${a} to ${b} an hour. What percent raise is that?`, a: [12, 15, 16, 20], up: true, money: true },
      { s: (a: string, b: string) => `A town’s population went from ${a} to ${b}. What is the percent change?`, a: [400, 500, 800, 1200], up: false, money: false },
      { s: (a: string, b: string) => `A store bought a backpack for ${a} and sells it for ${b}. What is the percent markup?`, a: [20, 24, 30, 40], up: true, money: true },
    ]);
    const a = pick(R, k.a), p = pick(R, [10, 20, 25, 50]), b = apply(a, p, k.up ? 'up' : 'down');
    const fm = (x: number) => (k.money ? fmtMoney(x) : `${fmtNum(x)} people`);
    const diff = k.up ? `(${fmtNum(b)} − ${fmtNum(a)})` : `(${fmtNum(a)} − ${fmtNum(b)})`;
    return {
      id: `choose-${n}`, family: 'choose', subgoal: 'choose-operation',
      prompt: `${k.s(A(fm(a)), `<b>${fm(b)}</b>`)} Which calculation answers it?`,
      board: `${k.money ? texMoney(a) : texNum(a)} \\to ${k.money ? texMoney(b) : texNum(b)}:\\ ?\\%`,
      ...choose(R, [
        { t: `${diff} ÷ ${fmtNum(a)}, then × 100`, ok: true, say: `Yes: the rate is unknown, so find the change and divide by the base.` },
        { t: `${fmtNum(a)} × ${fmtNum(b)} ÷ 100`, mc: MC.sameProc, say: `That is the “percent of an amount” recipe, but here the PERCENT is what you are looking for: change ÷ base.` },
        { t: `${diff} ÷ ${fmtNum(b)}, then × 100`, mc: MC.newBase, say: `Right idea, wrong base: divide by the amount before, ${fmtNum(a)}.` },
      ]),
      solution: [`What is unknown? The percent (a rate).`, `So: change ÷ base = ${diff} ÷ ${fmtNum(a)} = ${fmtPct(p)}.`],
    };
  }
  const k = pick(R, [
    { s: (a: string, p: string) => `A shirt costs ${a} and is ${p} off. What do you pay?`, up: false },
    { s: (a: string, p: string) => `A meal costs ${a}. You add a ${p} tip. What is the total?`, up: true },
    { s: (a: string, p: string) => `A bike costs ${a} plus ${p} sales tax. What is the total?`, up: true },
  ]);
  const a = pick(R, [40, 45, 60, 80, 120]), p = pick(R, [5, 10, 15, 20, 25]), m = multiplier(p, k.up ? 'up' : 'down');
  return {
    id: `choose-${n}`, family: 'choose', subgoal: 'choose-operation',
    prompt: `${k.s(A(fmtMoney(a)), `<b>${fmtPct(p)}</b>`)} Which calculation answers it?`,
    board: `${texMoney(a)}\\ ${k.up ? '+' : '-'}${texPct(p)} \\to \\$\\,?`,
    ...choose(R, [
      { t: `${a} × ${multTxt(m)}`, ok: true, say: `Yes: the percent is given and the new amount is unknown, so apply it: × ${multTxt(m)}.` },
      { t: `${p} ÷ ${a}, then × 100`, mc: MC.sameProc, say: `That finds a percent, but the percent is GIVEN. The new amount is unknown: ${a} × ${multTxt(m)}.` },
      { t: `${a} ${k.up ? '+' : '−'} ${p}`, mc: MC.numeral, say: `${fmtPct(p)} is not $${p}: it is ${p} hundredths of $${a}. Use ${a} × ${multTxt(m)}.` },
    ]),
    solution: [`What is unknown? The new amount; the percent is given.`, `So apply it: ${a} × ${multTxt(m)} = ${S(fmtMoney(a * m))}.`],
  };
};

// ---------- 11 check-reasonableness ----------
const BANDS = [[0, 10], [10, 25], [25, 50]] as const;
const bandTxt = (b: readonly [number, number], d: 'up' | 'down') => (b[0] === 0 ? `${an(d)} of less than 10%` : `${an(d)} between ${b[0]}% and ${b[1]}%`);
const estimate: Gen = (R, n) => {
  const bi = int(R, 0, 2), band = BANDS[bi]!;
  const p = pick(R, bi === 0 ? [3, 4, 6, 7, 8] : bi === 1 ? [12, 14, 15, 18, 22] : [30, 35, 40, 45]);
  const d: 'up' | 'down' = R() < 0.5 ? 'up' : 'down';
  const c = pick(R, CTX.filter(x => x.key === 'town' || x.key === 'fans' || x.key === 'bike')), dd = d;
  const a = baseFor(R, { ...c, lo: Math.max(c.lo, 100) }, [p], 0);
  const b = apply(a, p, dd), ch = change(a, b);
  const ten = r9(a / 10), quarter = r9(a / 4), half = r9(a / 2);
  const others = [0, 1, 2].filter(i => i !== bi);
  return {
    id: `estimate-${n}`, family: 'estimate', subgoal: 'check-reasonableness',
    prompt: `${story(c, a, b, false)} Before you calculate: what is the percent change about?`,
    board: `${texQ(c.unit, a)} \\to ${texQ(c.unit, b)}`,
    ...choose(R, [
      { t: bandTxt(band, dd), ok: true, say: `Yes: the change is ${fmtNum(ch.size)}. 10% of ${fmtNum(a)} is ${fmtNum(ten)}, 25% is ${fmtNum(quarter)}${bi === 2 ? `, 50% is ${fmtNum(half)}` : ''}. (Exactly: ${fmtPct(p)}.)` },
      { t: bandTxt(band, opp(dd)), say: `Direction first: ${fmtQ(c.unit, a)} to ${fmtQ(c.unit, b)} goes ${dd}.` },
      ...others.map(i => ({ t: bandTxt(BANDS[i]!, dd), say: `Use benchmarks of the base: 10% of ${fmtNum(a)} is ${fmtNum(ten)}, 25% is ${fmtNum(quarter)}, 50% is ${fmtNum(half)}. The change, ${fmtNum(ch.size)}, is ${bi === 0 ? 'less than 10%' : bi === 1 ? 'between 10% and 25%' : 'between 25% and 50%'}.` })),
    ]),
    tape: { amounts: [a, b], names: [...c.names], unit: c.unit, cuts: [4] },
    solution: [`Direction: ${fmtQ(c.unit, a)} → ${fmtQ(c.unit, b)} goes ${dd}. The change is ${B(fmtNum(ch.size))}.`,
      `Benchmarks of the base ${A(fmtNum(a))}: 10% = ${fmtNum(ten)}, 25% = ${fmtNum(quarter)}, 50% = ${fmtNum(half)}.`, `So: ${S(bandTxt(band, dd))} (exactly ${fmtPct(p)}).`],
  };
};
const sanity: Gen = (R, n) => {
  const v = R();
  const who = pick(R, ['Ava', 'Kai', 'Noah', 'Lena']);
  if (v < 0.4) {
    const p = pick(R, [6.5, 7.25, 8.25, 6, 8, 9.5]);
    const a = pick(R, [79.5, 45.99, 120, 64.5, 249.99, 38.75]);
    const tot = roundTo(a * (1 + p / 100), 2), tax = roundTo((a * p) / 100, 2), wrong = roundTo(a * p, 2);
    return {
      id: `sanity-${n}`, family: 'sanity', subgoal: 'check-reasonableness',
      prompt: `${who} uses a calculator to find the total for ${A(fmtMoney(a))} with <b>${fmtPct(p)}</b> sales tax. Which display passes the check “a little less than 10% more”?`,
      board: `${texMoney(a)} + ${texPct(p)}`,
      ...choose(R, [
        { t: fmtMoney(tot), ok: true, say: `Yes: ${fmtMoney(tot)} is a little more than ${fmtMoney(a)}, just under 10% more.` },
        { t: fmtMoney(tax), mc: MC.trustsCalc, say: `${fmtMoney(tax)} is only the tax (× ${fmtNum(p / 100)} instead of × ${fmtNum(1 + p / 100)}). A total must be MORE than ${fmtMoney(a)}.` },
        { t: fmtMoney(wrong), mc: MC.trustsCalc, say: `${fmtMoney(wrong)} is about ${Math.round(p)} times the price: ${p} was typed instead of ${fmtNum(p / 100)}. 10% more would be only about ${fmtMoney(Math.round(a * 1.1))}.` },
      ]),
      solution: [`Estimate first: 10% of ${fmtMoney(a)} is about ${fmtMoney(Math.round(a / 10))}, so the total is a little under ${fmtMoney(Math.round(a * 1.1))}.`, `Only ${S(fmtMoney(tot))} fits: ${fmtNum(a)} × ${fmtNum(1 + p / 100)} ≈ ${fmtMoney(tot)}.`],
    };
  }
  if (v < 0.75) {
    const p = pick(R, [12.5, 15, 7.5, 22.5, 35]), a = pick(R, [640, 800, 400, 1200, 2000]), d: 'up' | 'down' = R() < 0.5 ? 'up' : 'down';
    const b = apply(a, p, d), dec = r9(p / 100);
    return {
      id: `sanity-${n}`, family: 'sanity', subgoal: 'check-reasonableness',
      prompt: `A town went from ${A(`${fmtNum(a)} people`)} to <b>${fmtNum(b)} people</b>. ${who}’s calculator shows <b>${fmtNum(dec)}</b> for the change ÷ the base. What should ${who} write?`,
      board: `${texNum(a)} \\to ${texNum(b)}`,
      ...choose(R, [
        { t: pctWords(p, d), ok: true, say: `Yes: ${fmtNum(dec)} × 100 = ${fmtPct(p)}, and the town ${d === 'up' ? 'grew' : 'shrank'}.` },
        { t: pctWords(dec, d), mc: MC.unscaled, say: `${fmtNum(dec)} is a decimal; as a percent it is ${fmtNum(dec)} × 100 = ${fmtPct(p)}. Check: ${fmtPct(dec)} of ${fmtNum(a)} would be less than 10 people.` },
        { t: pctWords(p, opp(d)), mc: MC.trustsCalc, say: `The calculator only shows the size. Predict the direction: ${fmtNum(a)} to ${fmtNum(b)} goes ${d}.` },
      ]),
      solution: [`Direction: ${fmtNum(a)} → ${fmtNum(b)} goes ${d}.`, `Size: ${fmtNum(dec)} = ${fmtPct(p)}. So ${S(pctWords(p, d))}.`],
    };
  }
  const a = pick(R, [79.5, 64, 120, 45]), p = pick(R, [8.25, 7.5, 6.5]);
  const est = Math.round(a * 1.1), bad = roundTo(a * p + a, 2);
  return {
    id: `sanity-${n}`, family: 'sanity', subgoal: 'check-reasonableness',
    prompt: `${who} finds the total for ${A(fmtMoney(a))} with ${fmtPct(p)} tax. ${who}’s estimate: about ${fmtMoney(est)}. The calculator says <b>${fmtMoney(bad)}</b>. What should ${who} do?`,
    board: `${texMoney(est)}\\ \\text{or}\\ ${texMoney(bad)}`,
    ...choose(R, [
      { t: `Redo the calculation: ${fmtMoney(bad)} is far from about ${fmtMoney(est)}.`, ok: true, say: `Yes. When the check and the answer disagree, fix the answer, not the check.` },
      { t: `Keep ${fmtMoney(bad)}: calculators don’t make mistakes.`, mc: MC.trustsCalc, say: `The calculator did what was typed. ${fmtMoney(bad)} is far too much for a few percent of tax.` },
      { t: `Change the estimate to ${fmtMoney(Math.round(bad))}.`, mc: MC.changesCheck, say: `The estimate is the check. Never change the check to match an answer: redo the calculation.` },
    ]),
    solution: [`About ${fmtPct(p)} tax adds a little less than 10%: about ${fmtMoney(est)}.`, `So ${fmtMoney(bad)} is wrong: redo it, ${fmtNum(a)} × ${fmtNum(1 + p / 100)} = ${S(fmtMoney(roundTo(a * (1 + p / 100), 2)))}.`],
  };
};

// ---------- 12 round-results ----------
const roundGen: Gen = (R, n) => {
  if (R() < 0.6) {
    let a = 0, size = 0;
    for (let t = 0; t < 100; t++) {
      a = int(R, 12, 96); size = int(R, 1, Math.floor(a * 0.6));
      const den = a / gcd(a, size * 100);
      let x = den; while (x % 2 === 0) x /= 2; while (x % 5 === 0) x /= 5;
      if (x > 1) break;
    }
    const d: 'up' | 'down' = R() < 0.5 ? 'up' : 'down';
    const c = pick(R, CTX.filter(x => x.unit.money && (d === 'up' || !x.upOnly)));
    const b = d === 'up' ? a + size : a - size;
    const exact = (size / a) * 100, ans = roundTo(exact, 1), early = roundTo(size / a, 2) * 100;
    return {
      id: `round-${n}`, family: 'round', subgoal: 'round-results',
      prompt: `${story(c, a, b, false)} Find the percent ${word(d)}, rounded to the nearest tenth of a percent.`,
      board: `\\frac{${size}}{${a}} = ${texNum(size / a, 6)}\\ldots`, input: 'num', unit: '%',
      answer: { kind: 'num', v: ans },
      check: numCheck(ans, `Yes: ${fmtNum(size)} ÷ ${fmtNum(a)} = ${fmtNum(size / a, 5)}… = ${fmtNum(exact, 3)}…%, rounded ${fmtPct(ans)}.`, [
        { v: r9(early), mc: MC.earlyRound, say: `That rounded too early (${fmtNum(size / a, 2)} first). Keep all the digits and round only at the end: ${fmtNum(exact, 3)}…% ≈ ${fmtPct(ans)}.` },
        { v: Math.floor(exact * 10) / 10, say: `Round, don’t cut off: ${fmtNum(exact, 3)}…% rounds to ${fmtPct(ans)}.` },
        { v: r9(size / a), mc: MC.unscaled, say: `As a percent, multiply by 100: ${fmtNum(exact, 3)}…% ≈ ${fmtPct(ans)}.` },
      ], `${fmtNum(size)} ÷ ${fmtNum(a)} = ${fmtNum(size / a, 5)}…; × 100 = ${fmtNum(exact, 3)}…%; to the nearest tenth: ${fmtPct(ans)}.`),
      solution: [`Change ÷ base: ${fmtNum(size)} ÷ ${fmtNum(a)} = ${fmtNum(size / a, 6)}… (keep every digit).`, `× 100 = ${fmtNum(exact, 4)}…%. Round only now: ${S(fmtPct(ans))}.`],
    };
  }
  const p = pick(R, [6.5, 7.25, 8.25, 9.5, 4.75]);
  let a = 0, tot = 0;
  for (let t = 0; t < 100; t++) { a = r9(int(R, 1000, 9999) / 100); tot = r9(a * (1 + p / 100)); if (!exactTo(tot, 2)) break; }
  const ans = roundTo(tot, 2);
  return {
    id: `round-${n}`, family: 'round', subgoal: 'round-results',
    prompt: `A book costs ${A(fmtMoney(a))}. The sales tax is <b>${fmtPct(p)}</b>. What is the total, rounded to the nearest cent?`,
    board: `${texNum(a)} \\times ${texNum(1 + p / 100)}`, input: 'num', unit: 'dollars',
    answer: { kind: 'num', v: ans },
    check: numCheck(ans, `Yes: ${fmtNum(tot, 6)} rounds to ${fmtMoney(ans)}.`, [
      { v: Math.floor(tot * 100) / 100, say: `Round, don’t cut off: ${fmtNum(tot, 6)} rounds to ${fmtMoney(ans)}.` },
      { v: roundTo((a * p) / 100, 2), mc: MC.changeAsFinal, say: `That is the tax only. The total is the price plus the tax: ${fmtMoney(ans)}.` },
    ], `${fmtNum(a)} × ${fmtNum(1 + p / 100)} = ${fmtNum(tot, 6)}; to the nearest cent: ${fmtMoney(ans)}.`),
    solution: [`One multiplier: ${fmtNum(a)} × ${fmtNum(1 + p / 100)} = ${fmtNum(tot, 6)} (keep every digit).`, `Round only at the end, to the cent: ${S(fmtMoney(ans))}.`],
  };
};
const exactOrNot: Gen = (R, n) => {
  const den = pick(R, [3, 6, 7, 9, 12]);
  const a = den * pick(R, [2, 3, 4, 5, 10]);
  let size = int(R, 1, Math.floor(a * 0.6));
  while ((size * 100) % a === 0) size++;
  const exact = (size * 100) / a, rd = roundTo(exact, 1);
  const g = gcd(size * 100, a), num = (size * 100) / g, dd = a / g;
  const who = pick(R, ['Ana', 'Ben', 'Zoe', 'Eli']);
  return {
    id: `exactOrNot-${n}`, family: 'exactOrNot', subgoal: 'round-results',
    prompt: `A price went from ${A(fmtMoney(a))} to <b>${fmtMoney(a + size)}</b>. ${who} writes: “a ${fmtPct(rd)} increase.” Is ${fmtPct(rd)} exact?`,
    board: `\\frac{${size}}{${a}} = ${texNum(size / a, 6)}\\ldots`,
    ...choose(R, [
      { t: `No: it is rounded. Exactly, it is ${mixed(num, dd)}%.`, ok: true, say: `Yes: ${size} ÷ ${a} never ends as a decimal, so ${fmtPct(rd)} is rounded. Exactly: ${mixed(num, dd)}%.` },
      { t: `Yes: ${fmtPct(rd)} is exactly ${fr(size, a)}.`, mc: MC.roundedExact, say: `${fmtPct(rd)} of ${a} is ${fmtNum((rd * a) / 100, 4)}, not exactly ${size}. ${fmtPct(rd)} is rounded; exactly it is ${mixed(num, dd)}%.` },
      { t: `No: you must round ${fmtNum(size / a, 6)}… to ${fmtNum(roundTo(size / a, 2))} first, so it is ${fmtPct(roundTo(size / a, 2) * 100)}.`, mc: MC.earlyRound, say: `Rounding in the middle loses accuracy. Keep all the digits and round at the end: ${fmtPct(rd)}, exactly ${mixed(num, dd)}%.` },
    ]),
    solution: [`${size} ÷ ${a} = ${fmtNum(size / a, 6)}… never ends.`, `So ${fmtPct(rd)} is a rounded answer; the exact one is ${S(`${mixed(num, dd)}%`)}.`],
  };
};

// ---------- 13 - 18 successive changes ----------
interface TwoCtx { start(a: string): string; step(p: string, d: 'up' | 'down', i: number): string; names: [string, string, string]; unit: Unit; lo: number; hi: number; step0: number; dirs?: ['up' | 'down', 'up' | 'down'] }
const TWO: TwoCtx[] = [
  { start: a => `A jacket costs ${a}.`, step: (p, d, i) => (i === 0 ? `It goes on sale for ${p} off,` : `then the store takes an extra ${p} off the sale price.`), names: ['price', 'sale price', 'final price'], unit: MONEY, lo: 40, hi: 200, step0: 10, dirs: ['down', 'down'] },
  { start: a => `A pair of skates costs ${a}.`, step: (p, _d, i) => (i === 0 ? `It is ${p} off,` : `and then ${p} sales tax is charged on the discounted price.`), names: ['price', 'sale price', 'with tax'], unit: MONEY, lo: 40, hi: 200, step0: 10, dirs: ['down', 'up'] },
  { start: a => `A video game costs ${a}.`, step: (p, d, i) => (i === 0 ? `Its price goes ${d} ${p},` : `then the new price goes ${d} ${p}.`), names: ['start', 'after one change', 'after two'], unit: MONEY, lo: 20, hi: 80, step0: 5 },
  { start: a => `A town has ${a}.`, step: (p, d, i) => (i === 0 ? `Over five years the population goes ${d} ${p},` : `then over the next five years it goes ${d} ${p}.`), names: ['at first', 'five years on', 'ten years on'], unit: { money: false, word: 'people' }, lo: 1000, hi: 9000, step0: 100 },
];
const P_SUCC = [10, 20, 25, 50, 30, 40, 5, 15];
function twoChanges(R: () => number) {
  const k = pick(R, TWO);
  const d1 = k.dirs?.[0] ?? (R() < 0.5 ? 'up' : 'down'), d2 = k.dirs?.[1] ?? (R() < 0.5 ? 'up' : 'down');
  let p1 = pick(R, P_SUCC), p2 = pick(R, P_SUCC);
  if (k === TWO[1]) p2 = pick(R, [5, 6, 8, 10]);
  let a = 0, mid = 0, fin = 0;
  const places = k.unit.money ? 2 : 0;
  for (let t = 0; t < 200; t++) {
    a = r9(int(R, Math.ceil(k.lo / k.step0), Math.floor(k.hi / k.step0)) * k.step0);
    mid = apply(a, p1, d1); fin = apply(mid, p2, d2);
    if (exactTo(mid, places) && exactTo(fin, places) && !near(fin, a)) break;
    if (t % 40 === 39) { p1 = pick(R, [10, 20, 25, 50]); p2 = pick(R, [10, 20, 25, 50]); }
  }
  return { k, d1, d2, p1, p2, a, mid, fin };
}
const succPrompt = (g: ReturnType<typeof twoChanges>) =>
  `${g.k.start(A(fmtQ(g.k.unit, g.a)))} ${g.k.step(`<b>${fmtPct(g.p1)}</b>`, g.d1, 0)} ${g.k.step(`<b>${fmtPct(g.p2)}</b>`, g.d2, 1)}`;
const signed = (p: number, d: 'up' | 'down') => (d === 'up' ? p : -p);
const successive: Gen = (R, n) => {
  const g = twoChanges(R);
  const q = (x: number) => fmtQ(g.k.unit, x);
  const added = signed(g.p1, g.d1) + signed(g.p2, g.d2);
  const wrongAdd = r9(g.a * (1 + added / 100));
  return {
    id: `successive-${n}`, family: 'successive', subgoal: 'successive-new-base',
    prompt: `${succPrompt(g)} What is the final ${g.k.unit.money ? 'price' : 'population'}?`,
    board: `${texQ(g.k.unit, g.a)} \\to \\,? \\to \\,?`, input: 'num', unit: ansUnit(g.k.unit),
    answer: { kind: 'num', v: g.fin },
    check: numCheck(g.fin, `Yes: ${q(g.a)} → ${q(g.mid)} → ${q(g.fin)}.`, [
      { v: wrongAdd, mc: MC.addsSucc, say: `That takes both percents of ${q(g.a)}. The second change is a percent of the NEW amount, ${q(g.mid)}: ${q(g.fin)}.` },
      { v: g.mid, say: `${q(g.mid)} is after the first change only. Now apply ${fmtPct(g.p2)} to ${q(g.mid)}: ${q(g.fin)}.` },
    ], `First: ${q(g.a)} × ${multTxt(multiplier(g.p1, g.d1))} = ${q(g.mid)}. Then: ${q(g.mid)} × ${multTxt(multiplier(g.p2, g.d2))} = ${q(g.fin)}.`),
    tape: { amounts: [g.a, g.mid, g.fin], names: [...g.k.names], unit: g.k.unit, cuts: [cutsFor(g.p1), cutsFor(g.p2)], hide: [false, true, true], hideChange: true },
    solution: [`First change, on ${A(q(g.a))}: ${fmtPct(g.p1)} ${g.d1} → ${q(g.mid)}.`, `The second change is on the NEW amount ${q(g.mid)}: ${fmtPct(g.p2)} ${g.d2} → ${S(q(g.fin))}.`],
  };
};
const OVERALL_PAIRS: [number, 'up' | 'down', number, 'up' | 'down'][] = [
  [20, 'up', 20, 'down'], [20, 'down', 20, 'up'], [10, 'up', 10, 'up'], [10, 'down', 10, 'down'], [50, 'up', 50, 'down'],
  [25, 'up', 20, 'down'], [20, 'down', 25, 'up'], [100, 'up', 50, 'down'], [50, 'down', 100, 'up'], [20, 'up', 30, 'up'],
  [30, 'down', 20, 'down'], [40, 'up', 25, 'down'], [10, 'up', 20, 'down'], [25, 'down', 10, 'up'],
];
function changeTxt(a: number, b: number): string { const c = change(a, b); return c.dir === 'none' ? 'no change' : pctWords(c.pct, c.dir); }
const overall: Gen = (R, n) => {
  const [p1, d1, p2, d2] = pick(R, OVERALL_PAIRS);
  const a = pick(R, [100, 200, 50, 80, 400, 1000]);
  const mid = apply(a, p1, d1), fin = apply(mid, p2, d2), ov = change(a, fin);
  const right = changeTxt(a, fin);
  const added = signed(p1, d1) + signed(p2, d2);
  const addTxt = added === 0 ? 'no change' : pctWords(Math.abs(added), added > 0 ? 'up' : 'down');
  const ofTxt = ov.dir === 'none' ? '' : pctWords(ov.pctOf, ov.dir);
  const cands: Opt[] = [
    { t: right, ok: true, say: `Yes: from ${fmtMoney(a)} to ${fmtMoney(fin)}, ${ov.dir === 'none' ? 'back where it started' : `a change of ${fmtMoney(ov.size)} on the first price`}: ${right}.` },
    { t: pctWords(p2, d2), mc: MC.lastAsOverall, say: `${fmtPct(p2)} is only the last change. Overall, compare the final ${fmtMoney(fin)} with the FIRST price, ${fmtMoney(a)}: ${right}.` },
    { t: addTxt, mc: MC.addsSucc, say: `Adding the percents treats both as percents of ${fmtMoney(a)}. The second is of ${fmtMoney(mid)}. Overall: ${fmtMoney(a)} → ${fmtMoney(fin)}, ${right}.` },
  ];
  if (ofTxt) cands.push({ t: ofTxt, mc: MC.pctOfAsChange, say: `${fmtMoney(fin)} is ${fmtPct(ov.pctOf)} OF ${fmtMoney(a)}. The change is the gap from 100%: ${right}.` });
  const seen = new Set<string>(); const opts = cands.filter(o => (seen.has(o.t) ? false : (seen.add(o.t), true)));
  return {
    id: `overall-${n}`, family: 'overall', subgoal: 'overall-change',
    prompt: `A game costs ${A(fmtMoney(a))}. Its price goes ${d1} <b>${fmtPct(p1)}</b>, then the new price goes ${d2} <b>${fmtPct(p2)}</b>. What is the overall change from ${fmtMoney(a)}?`,
    board: `${d1 === 'up' ? '+' : '-'}${texPct(p1)},\\ ${d2 === 'up' ? '+' : '-'}${texPct(p2)}`,
    ...choose(R, opts),
    tape: { amounts: [a, mid, fin], names: ['start', 'after one change', 'after two'], unit: MONEY },
    solution: [`${A(fmtMoney(a))} → ${fmtMoney(mid)} → ${fmtMoney(fin)}.`, `Overall, against the FIRST price: ${fmtMoney(ov.size)} ÷ ${fmtMoney(a)} = ${fmtPct(ov.pct)}: ${S(right)}.`],
  };
};
const compose: Gen = (R, n) => {
  const [p1, d1, p2, d2] = pick(R, OVERALL_PAIRS.filter(x => !(x[0] === 25 && x[2] === 20) && !(x[0] === 20 && x[2] === 25) && x[0] !== 100 && x[2] !== 100));
  const m1 = multiplier(p1, d1), m2 = multiplier(p2, d2), m = r9(m1 * m2);
  const net = change(1, m);
  const desc = (p: number, d: 'up' | 'down') => (d === 'up' ? `${fmtPct(p)} more` : `${fmtPct(p)} off`);
  const added = r9(1 + (signed(p1, d1) + signed(p2, d2)) / 100);
  const lab = (x: number) => { const c = change(1, x); return c.dir === 'none' ? 'no change' : pctWords(c.pct, c.dir); };
  const cands: Opt[] = [
    { t: `× ${multTxt(m)}: ${lab(m)}`, ok: true, say: `Yes: ${multTxt(m1)} × ${multTxt(m2)} = ${multTxt(m)}, ${lab(m)}.` },
    { t: `× ${multTxt(added)}: ${lab(added)}`, mc: MC.addsSucc, say: `Adding the percents treats both as percents of the first price. Multiply the multipliers: ${multTxt(m1)} × ${multTxt(m2)} = ${multTxt(m)}.` },
  ];
  if (net.dir !== 'none') {
    const mis = r9(net.pctOf / 100);
    cands.push({ t: `× ${multTxt(r9(1 + (net.dir === 'up' ? 1 : -1) * mis))}: ${pctWords(net.pctOf, net.dir)}`, mc: MC.pctOfAsChange, say: `${multTxt(m)} means the final price is ${fmtPct(net.pctOf)} OF the first. The change is the gap from 100%: ${lab(m)}.` });
  }
  const seen = new Set<string>(); const opts = cands.filter(o => (seen.has(o.t) || o.t.includes('× -') ? false : (seen.add(o.t), true)));
  return {
    id: `compose-${n}`, family: 'compose', subgoal: 'compose-multipliers',
    prompt: `A price changes by <b>${desc(p1, d1)}</b>, then by <b>${desc(p2, d2)}</b> on the new price. Which single change does the same?`,
    board: `${texNum(m1)} \\times ${texNum(m2)} = \\,?`,
    ...choose(R, opts),
    solution: [`Each change is one multiplier: ${desc(p1, d1)} is × ${multTxt(m1)}, ${desc(p2, d2)} is × ${multTxt(m2)}.`, `Together: ${multTxt(m1)} × ${multTxt(m2)} = ${S(multTxt(m))}, ${lab(m)}.`, `Check with $100: $100 × ${multTxt(m1)} = ${fmtMoney(100 * m1)}, × ${multTxt(m2)} = ${fmtMoney(100 * m)}.`],
  };
};
const order: Gen = (R, n) => {
  if (R() < 0.55) {
    const a = pick(R, [40, 50, 60, 80, 120]), p = pick(R, [10, 20, 25]), t = pick(R, [5, 6, 8, 10]);
    const twin = R() < 0.35;
    const p2 = twin ? p : t, d2: 'up' | 'down' = 'up';
    const A1 = apply(apply(a, p, 'down'), p2, d2), A2 = apply(apply(a, p2, d2), p, 'down');
    const thing = twin ? `marks it up ${fmtPct(p2)}` : `adds ${fmtPct(p2)} tax`;
    return {
      id: `order-${n}`, family: 'order', subgoal: 'multiplier-order',
      prompt: `A ${A(fmtMoney(a))} hoodie. Store A takes <b>${fmtPct(p)} off</b>, then ${thing}. Store B ${thing.replace('adds', 'adds').replace('marks it up', 'marks it up')} first, then takes ${fmtPct(p)} off. Which costs less?`,
      board: `\\times ${texNum(multiplier(p, 'down'))}\\ \\text{and}\\ \\times ${texNum(multiplier(p2, d2))}`,
      ...choose(R, [
        { t: 'They cost the same.', ok: true, say: `Yes: both are ${a} × ${multTxt(multiplier(p, 'down'))} × ${multTxt(multiplier(p2, d2))} = ${fmtMoney(A1)}, just in a different order.` },
        { t: 'Store A', mc: MC.orderMatters, say: `Try it: Store A gives ${fmtMoney(A1)}, Store B gives ${fmtMoney(A2)}. Swapping two multipliers gives the same product.` },
        { t: 'Store B', mc: MC.orderMatters, say: `Try it: Store A gives ${fmtMoney(A1)}, Store B gives ${fmtMoney(A2)}. Swapping two multipliers gives the same product.` },
      ]),
      solution: [`Store A: ${a} × ${multTxt(multiplier(p, 'down'))} × ${multTxt(multiplier(p2, d2))} = ${fmtMoney(A1)}.`, `Store B: ${a} × ${multTxt(multiplier(p2, d2))} × ${multTxt(multiplier(p, 'down'))} = ${fmtMoney(A2)}.`, `${S('The same')}: the order of two multipliers doesn’t change the product.`],
    };
  }
  const a = pick(R, [40, 50, 60, 80, 100]), p = pick(R, [10, 20, 25]), cp = pick(R, [5, 10]);
  const pctFirst = r9(a * multiplier(p, 'down') - cp), cpFirst = r9((a - cp) * multiplier(p, 'down'));
  return {
    id: `order-${n}`, family: 'order', subgoal: 'multiplier-order',
    prompt: `A ${A(fmtMoney(a))} jacket. You have a <b>${fmtMoney(cp)} coupon</b>, and the store takes <b>${fmtPct(p)} off</b>. Which order costs less?`,
    board: `-${texMoney(cp)}\\ \\text{and}\\ \\times ${texNum(multiplier(p, 'down'))}`,
    ...choose(R, [
      { t: `${fmtPct(p)} off first, then the coupon`, ok: true, say: `Yes: ${fmtMoney(pctFirst)} against ${fmtMoney(cpFirst)}. The coupon is a fixed amount, not a multiplier, so the order matters.` },
      { t: 'the coupon first, then the percent off', say: `Try both: percent first gives ${fmtMoney(pctFirst)}, coupon first gives ${fmtMoney(cpFirst)}.` },
      { t: 'the same either way', mc: MC.couponCommute, say: `Only two multipliers can swap freely. A ${fmtMoney(cp)} coupon is not a multiplier: ${fmtMoney(pctFirst)} against ${fmtMoney(cpFirst)}.` },
    ]),
    solution: [`Percent first: ${a} × ${multTxt(multiplier(p, 'down'))} − ${cp} = ${fmtMoney(pctFirst)}.`, `Coupon first: (${a} − ${cp}) × ${multTxt(multiplier(p, 'down'))} = ${fmtMoney(cpFirst)}.`, `${S(`${fmtPct(p)} off first`)} is cheaper: then the percent comes off the bigger price.`],
  };
};
const UNDO: [number, 'up' | 'down', number][] = [[25, 'up', 20], [100, 'up', 50], [150, 'up', 60], [300, 'up', 75], [60, 'up', 37.5], [20, 'down', 25], [50, 'down', 100], [75, 'down', 300], [37.5, 'down', 60]];
const undo: Gen = (R, n) => {
  const [p1, d1, p2] = pick(R, UNDO), d2 = opp(d1);
  const a = pick(R, [40, 80, 120, 160, 200, 400]);
  const mid = apply(a, p1, d1);
  const k2 = cutsFor(p2) ?? (p2 === 37.5 ? 8 : p2 === 60 ? 5 : undefined);
  return {
    id: `undo-${n}`, family: 'undo', subgoal: 'justify-no-cancel',
    prompt: `A price went ${d1} <b>${fmtPct(p1)}</b>, from ${A(fmtMoney(a))} to <b>${fmtMoney(mid)}</b>. By what percent must it go ${d2} to get back to ${fmtMoney(a)}?`,
    board: `${texMoney(a)} \\to ${texMoney(mid)} \\to \\,?`, input: 'num', unit: '%',
    answer: { kind: 'num', v: p2 },
    check: numCheck(p2, `Yes: ${fmtMoney(change(mid, a).size)} out of the new base ${fmtMoney(mid)} is ${fmtPct(p2)}.`, [
      { v: p1, mc: MC.addsSucc, say: `Going back, the base is ${fmtMoney(mid)}, not ${fmtMoney(a)}. ${fmtMoney(change(mid, a).size)} out of ${fmtMoney(mid)} is ${fmtPct(p2)}.` },
      { v: change(mid, a).size, mc: MC.diffAsPct, say: `${fmtMoney(change(mid, a).size)} is the change; as a percent of ${fmtMoney(mid)} it is ${fmtPct(p2)}.` },
    ], `Back from ${fmtMoney(mid)} to ${fmtMoney(a)}: ${fmtNum(change(mid, a).size)} ÷ ${fmtNum(mid)} = ${fmtPct(p2)}.`),
    tape: { amounts: [a, mid, a], names: ['start', d1 === 'up' ? 'after the rise' : 'after the drop', 'back again'], unit: MONEY, cuts: [cutsFor(p1), k2] },
    solution: [`Going back, the base is the NEW price ${A(fmtMoney(mid))}.`, `Change: ${B(fmtMoney(change(mid, a).size))}. ${fmtNum(change(mid, a).size)} ÷ ${fmtNum(mid)} = ${S(fmtPct(p2))}, not ${fmtPct(p1)}.`],
  };
};
const noCancelWhy: Gen = (R, n) => {
  const p = pick(R, [10, 20, 25, 50]), a = pick(R, [40, 60, 80, 100, 200]), upFirst = R() < 0.6;
  const d1: 'up' | 'down' = upFirst ? 'up' : 'down', mid = apply(a, p, d1), fin = apply(mid, p, opp(d1));
  return {
    id: `noCancelWhy-${n}`, family: 'noCancelWhy', subgoal: 'justify-no-cancel',
    prompt: `A ${A(fmtMoney(a))} game goes ${d1} <b>${fmtPct(p)}</b> to ${fmtMoney(mid)}, then ${opp(d1)} <b>${fmtPct(p)}</b>. It ends at <b>${fmtMoney(fin)}</b>, not ${fmtMoney(a)}. Why?`,
    board: `${upFirst ? '+' : '-'}${texPct(p)},\\ ${upFirst ? '-' : '+'}${texPct(p)}`,
    ...choose(R, [
      { t: upFirst ? `The ${fmtPct(p)} decrease is of a bigger price, ${fmtMoney(mid)}, so it takes off more than was added.` : `The ${fmtPct(p)} increase is of a smaller price, ${fmtMoney(mid)}, so it adds back less than was taken.`, ok: true, say: `Yes: the base changed. ${fmtPct(p)} of ${fmtMoney(a)} is ${fmtMoney((a * p) / 100)}, but ${fmtPct(p)} of ${fmtMoney(mid)} is ${fmtMoney((mid * p) / 100)}.` },
      { t: `It really ends at ${fmtMoney(a)}: equal percents up and down cancel.`, mc: MC.addsSucc, say: `Work it out: ${fmtPct(p)} of ${fmtMoney(mid)} is ${fmtMoney((mid * p) / 100)}, so it ends at ${fmtMoney(fin)}.` },
      { t: `The order is the problem: ${opp(d1)} first, then ${d1}, would end at ${fmtMoney(a)}.`, mc: MC.orderMatters, say: `The other order ends at ${fmtMoney(fin)} too: × ${multTxt(multiplier(p, d1))} × ${multTxt(multiplier(p, opp(d1)))} is the same either way.` },
    ]),
    tape: { amounts: [a, mid, fin], names: ['start', d1 === 'up' ? 'after the rise' : 'after the drop', 'after the second change'], unit: MONEY },
    solution: [`First ${fmtPct(p)} of ${A(fmtMoney(a))} = ${fmtMoney((a * p) / 100)}; second ${fmtPct(p)} of ${fmtMoney(mid)} = ${fmtMoney((mid * p) / 100)}.`, `Different bases, different amounts: the price ends at ${S(fmtMoney(fin))}.`],
  };
};
const sameBase: Gen = (R, n) => {
  const a = pick(R, [40, 60, 80, 100, 120, 200]), [p1, p2] = pick(R, [[20, 10], [30, 10], [25, 20], [10, 10], [15, 10], [20, 20]] as const);
  const kind = pick(R, ['same', 'succ', 'sameUp', 'succUp'] as const);
  const up = kind === 'sameUp' || kind === 'succUp', same = kind === 'same' || kind === 'sameUp';
  const sum = r9(a * (1 + ((up ? 1 : -1) * (p1 + p2)) / 100));
  const succ = r9(a * multiplier(p1, up ? 'up' : 'down') * multiplier(p2, up ? 'up' : 'down'));
  const numeral = up ? a + p1 + p2 : a - p1 - p2;
  const prompt = up
    ? (same ? `A meal costs ${A(fmtMoney(a))}. The ${fmtPct(p1)} tip and the ${fmtPct(p2)} service fee are <b>both</b> figured on the meal price. What is the total?`
      : `A ${A(fmtMoney(a))} item gets a <b>${fmtPct(p1)}</b> markup, then the new price gets another <b>${fmtPct(p2)}</b> markup. What is the final price?`)
    : (same ? `A ${A(fmtMoney(a))} jacket. Members get <b>${fmtPct(p1)} off</b> the original price, and a coupon takes another <b>${fmtPct(p2)}</b> of the original price. What do you pay?`
      : `A ${A(fmtMoney(a))} jacket is <b>${fmtPct(p1)} off</b>, then an extra <b>${fmtPct(p2)} off</b> the sale price. What do you pay?`);
  const ans = same ? sum : succ, other = same ? succ : sum;
  const opts: Opt[] = [
    { t: fmtMoney(ans), ok: true, say: same ? `Yes: both percents are of the same ${fmtMoney(a)}, so they add: ${p1}% + ${p2}% = ${p1 + p2}%.` : `Yes: the second percent is of the new price, so you can’t just add them.` },
    { t: fmtMoney(other), mc: same ? MC.neverAdd : MC.mismatched, say: same ? `Here both percents are of the SAME base, ${fmtMoney(a)}, so they can be added: ${fmtPct(p1 + p2)} of ${fmtMoney(a)}. Total ${fmtMoney(sum)}.` : `Adding ${p1}% + ${p2}% only works if both are of the same base. The second is of ${fmtMoney(apply(a, p1, up ? 'up' : 'down'))}: ${fmtMoney(succ)}.` },
  ];
  if (!near(numeral, ans) && !near(numeral, other)) opts.push({ t: fmtMoney(numeral), mc: MC.numeral, say: `Percents are parts of the price, not dollars: ${fmtPct(p1)} of ${fmtMoney(a)} is ${fmtMoney((a * p1) / 100)}.` });
  else {
    const only = r9(Math.abs(ans - a));
    opts.push({ t: fmtMoney(only), mc: MC.changeAsFinal, say: `${fmtMoney(only)} is how much ${up ? 'is added' : 'comes off'}, not what you ${up ? 'pay in all' : 'pay'}: ${fmtMoney(ans)}.` });
  }
  return {
    id: `sameBase-${n}`, family: 'sameBase', subgoal: 'same-base-adding',
    prompt, board: `${texMoney(a)},\\ ${up ? '+' : '-'}${texPct(p1)},\\ ${up ? '+' : '-'}${texPct(p2)}`,
    ...choose(R, opts),
    solution: same ? [`Both percents are of the same base, ${A(fmtMoney(a))}: they add, ${fmtPct(p1)} + ${fmtPct(p2)} = ${fmtPct(p1 + p2)}.`, `${fmtMoney(a)} × ${multTxt(r9(1 + ((up ? 1 : -1) * (p1 + p2)) / 100))} = ${S(fmtMoney(sum))}.`]
      : [`The second percent is of the NEW price: different bases, so don’t add.`, `${fmtMoney(a)} × ${multTxt(multiplier(p1, up ? 'up' : 'down'))} × ${multTxt(multiplier(p2, up ? 'up' : 'down'))} = ${S(fmtMoney(succ))}.`],
  };
};

// ---------- 19 percent error ----------
const ERR = [
  { s: (e: string, w: string) => `${w} guesses there are ${e} jelly beans in a jar. The jar holds`, unit: 'beans', lo: 200, hi: 1200, step: 10, names: ['actual', 'guess'] as [string, string] },
  { s: (e: string, w: string) => `${w} estimates the crowd at a game as ${e}. The real count is`, unit: 'people', lo: 2000, hi: 9000, step: 100, names: ['actual', 'estimate'] as [string, string] },
  { s: (e: string, w: string) => `${w} measures a board as ${e}. Its actual length is`, unit: 'in.', lo: 20, hi: 96, step: 4, names: ['actual', 'measured'] as [string, string] },
  { s: (e: string, w: string) => `${w} times a lap as ${e}. The official time is`, unit: 'seconds', lo: 40, hi: 120, step: 4, names: ['official', 'timed'] as [string, string] },
];
const pctError: Gen = (R, n) => {
  const k = pick(R, ERR), who = pick(R, ['Mia', 'Leo', 'Ava', 'Sam', 'Noah']);
  const rounded = R() < 0.3, above = R() < 0.5;
  let acc = 0, est = 0, e = 0;
  if (!rounded) {
    e = pick(R, [2, 4, 5, 8, 10, 12.5, 15, 20, 25]);
    acc = baseFor(R, { unit: { money: false }, lo: k.lo, hi: k.hi, step: k.step }, [e]);
    est = apply(acc, e, above ? 'up' : 'down');
  } else {
    for (let t = 0; t < 100; t++) {
      acc = r9(int(R, Math.ceil(k.lo / k.step), Math.floor(k.hi / k.step)) * k.step); const off = int(R, 1, Math.max(2, Math.round(acc * 0.2)));
      est = above ? acc + off : acc - off; e = (off / acc) * 100;
      if (!exactTo(e, 2)) break;
    }
  }
  const ans = rounded ? roundTo(e, 1) : r9(e), diff = r9(Math.abs(est - acc));
  const byEst = rounded ? roundTo((diff / est) * 100, 1) : r9((diff / est) * 100);
  const u = { money: false, word: k.unit };
  return {
    id: `pctError-${n}`, family: 'pctError', subgoal: 'percent-error',
    prompt: `${k.s(`<b>${fmtQ(u, est)}</b>`, who)} ${A(fmtQ(u, acc))}. What is the percent error${rounded ? ', to the nearest tenth of a percent' : ''}?`,
    board: `\\frac{|${texNum(est)} - ${texNum(acc)}|}{${texNum(acc)}}`, input: 'num', unit: '%',
    answer: { kind: 'num', v: ans },
    check: numCheck(ans, `Yes: off by ${fmtNum(diff)} out of the actual ${fmtNum(acc)}: ${fmtPct(ans)}.`, [
      { v: byEst, mc: MC.newBase, say: `That divides by the estimate, ${fmtNum(est)}. Percent error compares with the ACTUAL value: ${fmtNum(diff)} ÷ ${fmtNum(acc)} = ${fmtPct(ans)}.` },
      { v: -ans, mc: MC.negError, say: `Percent error is a size: it is never negative. ${fmtPct(ans)}.` },
      { v: diff, mc: MC.diffAsPct, say: `${fmtNum(diff)} is how far off it is. As a percent of the actual ${fmtNum(acc)}: ${fmtPct(ans)}.` },
    ], `|${fmtNum(est)} − ${fmtNum(acc)}| ÷ ${fmtNum(acc)} = ${fmtNum(diff / acc, 5)}${rounded ? '…' : ''} → ${fmtPct(ans)}.`),
    tape: { amounts: [acc, est], names: [...k.names], unit: u },
    solution: [`How far off: |${fmtNum(est)} − ${fmtNum(acc)}| = ${B(fmtNum(diff))}.`, `The base is the ACTUAL value ${A(fmtNum(acc))}: ${fmtNum(diff)} ÷ ${fmtNum(acc)} × 100 = ${S(fmtPct(ans))}${rounded ? ' (rounded at the end)' : ''}.`],
  };
};
const closer: Gen = (R, n) => {
  const [w1, w2] = pick(R, [['Mia', 'Leo'], ['Ava', 'Sam'], ['Zoe', 'Eli']] as const);
  const kind = R() < 0.75 ? 'diff' : 'same';
  const a1 = pick(R, [20, 30, 40, 50]), a2 = a1 * pick(R, [8, 10, 20]);
  const e1 = kind === 'same' ? a1 / 10 : pick(R, [4, 5, 6].filter(x => x < a1 / 2));
  const e2 = kind === 'same' ? a2 / 10 : Math.max(e1 + 2, Math.round((a2 * e1) / a1 / 3));
  const p1 = (e1 / a1) * 100, p2 = (e2 / a2) * 100;
  const sw = R() < 0.5;
  const X = sw ? { w: w2, a: a2, e: e2, p: p2 } : { w: w1, a: a1, e: e1, p: p1 }, Y = sw ? { w: w1, a: a1, e: e1, p: p1 } : { w: w2, a: a2, e: e2, p: p2 };
  const same = near(X.p, Y.p), win = same ? null : X.p < Y.p ? X : Y, lose = win === X ? Y : X;
  const smallAbs = X.e < Y.e ? X : Y.e < X.e ? Y : null;
  const line = (z: typeof X) => `${z.w}: off by ${z.e} of ${z.a}, ${fmtPct(roundTo(z.p, 1))}`;
  const opts: Opt[] = [X, Y].map(z => (z === win
    ? { t: z.w, ok: true, say: `Yes. ${line(X)}; ${line(Y)}.` }
    : { t: z.w, mc: z === smallAbs ? MC.absRel : undefined, say: `${z === smallAbs ? `${z.w} is off by fewer, but out of a much smaller count. ` : ''}${line(X)}; ${line(Y)}.` }));
  opts.push(same ? { t: 'equally close', ok: true, say: `Yes: both are off by 10% of the actual count.` } : { t: 'equally close', say: `${line(X)}; ${line(Y)}.` });
  return {
    id: `closer-${n}`, family: 'closer', subgoal: 'percent-error',
    prompt: `${X.w} guesses ${X.a + X.e} marbles in a jar of ${A(X.a)}. ${Y.w} guesses ${Y.a - Y.e} jelly beans in a jar of ${A(Y.a)}. Whose guess is closer, by percent error?`,
    board: `\\frac{${X.e}}{${X.a}}\\ \\text{or}\\ \\frac{${Y.e}}{${Y.a}}`,
    ...choose(R, opts),
    solution: [`Percent error compares how far off with the ACTUAL count.`, `${line(X)}. ${line(Y)}.`, same ? 'Equally close.' : `${S(win!.w)} is closer${win!.e > lose.e ? `, even though ${win!.w} is off by more` : ''}.`],
  };
};

/** text tidying for every item: "an $80", one period after "in.", no double spaces */
export function tidy(h: string): string {
  return h.replace(/\b([Aa]) ((?:<b class="a">)?\$)(?=8|1[18](?![\d,]))/g, (_m, a: string, d: string) => `${a}n ${d}`)
    .replace(/\.((?:<\/b>)?)\./g, '.$1').replace(/  +/g, ' ');
}
const tidied = (g: Gen): Gen => (R, n, sg) => {
  const it = g(R, n, sg);
  it.prompt = tidy(it.prompt); it.solution = it.solution.map(tidy);
  if (it.choices) it.choices = it.choices.map(tidy);
  const check = it.check;
  it.check = r => { const v = check(r); return { ...v, say: tidy(v.say) }; };
  return it;
};
const RAW: Record<FamilyId, Gen> = {
  base: baseGen, whichFrac, byTo, changeWord, benchPct, compare, pctChange, pctLabel, twoStepUp, twoStepDown, multPick, multNum,
  over100, over100Why, choose: chooseGen, estimate, sanity, round: roundGen, exactOrNot, successive, overall, compose, order,
  undo, noCancelWhy, sameBase, pctError, closer,
};
export const GENERATORS = Object.fromEntries(Object.entries(RAW).map(([k, g]) => [k, tidied(g)])) as Record<FamilyId, Gen>;
export type { Response, Verdict };
export { fmtMoney, fmtPct, fmtNum };
