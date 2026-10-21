// items.ts: practice families for "Calculate simple interest" (grade 7, 7.RP.A.3). Every family is one deep
// structure; a generator receives the sub-goal id and uses that sub-goal's number ranges (topic JSON `cases`). Every
// wrong answer the classifier recognises carries its id from math-curriculum-essentials/misconceptions.json (logged,
// never shown). Money is exact (interestMaths.ts). Pure: no DOM, no canvas.
// Colours follow the model: principal = amber (A), interest and rate = teal (B), balance / amount owed = lime (S).
// Items that ASK which amount plays which role print the amounts plain, so the colour does not give it away.
import { type Item, type Response, type Verdict, A, B, S, int, pick, shuffle } from '../../runtime/item';
import type { TapeParams, TapeStep } from './InterestTape';
import {
  U_CENT, cents, decOf, digits, exactCents, interestU, multDec, pct, rateDec, roundHalfUp, sameDec,
  schedule, toCents, truncCents, unitsStr, usd, usdTex, yearsDec, yearsFracTex,
} from './interestMaths';

// ---------- misconception ids ----------
export const MC = {
  principal: 'mc.finance.principal-misidentified-as-interest-or-ending-balance',
  fixed: 'mc.percent.percent-as-fixed-amount',
  units: 'mc.measurement-units.combine-mismatched-units',
  borrower: 'mc.finance.borrower-receives-interest',
  numeral: 'mc.percent.adds-or-subtracts-percent-numeral',
  point: 'mc.decimals.dollars-cents-point-misplaced',
  noDiv100: 'mc.percent.percent-numeral-without-dividing-by-100',
  changeFinal: 'mc.percent.change-reported-as-final-amount',
  appends: 'mc.percent.appends-rate-digits-after-one',
  trunc: 'mc.decimals.truncates-instead-of-rounding',
  early: 'mc.decimals.intermediate-precision-always-invalid',
  inconsistent: 'mc.estimation.inconsistent-rounding-of-linked-amounts',
  newBase: 'mc.percent.new-or-estimate-as-base',
  anyNumber: 'mc.reasoning-language.given-quantities-interchangeable-in-calculations',
  compounds: 'mc.finance.compounds-simple-interest',
  omitsTime: 'mc.finance.omits-time-in-simple-interest',
  successive: 'mc.percent.adds-successive-percent-changes',
  compoundBetter: 'mc.finance.compound-always-better-even-borrowing',
  differYear1: 'mc.finance.simple-and-compound-differ-after-one-year',
  gapSmall: 'mc.finance.compound-simple-gap-stays-small',
} as const;

// ---------- what the page draws for an item ----------
export interface BoardTable { head: [string, string, string]; rows: string[][]; solved?: string[][] }
export interface SIPicture {
  /** the model with the problem (hidden amounts show "?"); none = a bare board */ tape?: TapeParams;
  /** steps shown with the problem */ pre: TapeStep[];
  /** steps the worked solution adds */ post: TapeStep[];
  /** base rings the solution lights: the principal part of a row ('P') or the whole row */
  rings?: { row: number; at: 'P' | 'row' }[];
  /** a table on the board (TeX cells, '?' for hidden ones; `solved` after a miss) */ table?: BoardTable;
  /** TeX lines the worked solution writes on the board */ work: string[];
  [k: string]: unknown;
}
export interface SIItem extends Item { picture?: SIPicture }
type Gen = (R: () => number, n: number, sg?: string) => SIItem;

// ---------- words and amounts ----------
const NAMES = ['Maya', 'Leo', 'Ava', 'Jordan', 'Sam', 'Priya', 'Diego', 'Kai', 'Lena', 'Omar', 'Grace', 'Noah', 'Zoe', 'Eli', 'Mia', 'Theo'] as const;
const SAVE = ['a savings account', 'a CD at the bank', 'a credit union savings account', 'a high-yield savings account'] as const;
const LOAN = ['a used car', 'a laptop for school', 'a dirt bike', 'college books', 'a drum kit', 'a food truck repair'] as const;
/** cents -> "$1,250" or "$43.75" (HTML) */
const $ = (c: number) => usd(c, c % 100 !== 0);
/** cents -> TeX */
const $T = (c: number) => usdTex(c, c % 100 !== 0);
/** the cents value of an amount typed as a whole number of dollars plus cents */
const dollars = (d: number) => d * 100;
const two = (R: () => number): [string, string] => { const a = pick(R, NAMES); let b = pick(R, NAMES); while (b === a) b = pick(R, NAMES); return [a, b]; };

// ---------- checks ----------
interface Wrong { c: number; mc?: string; say: string }
/** a money answer in cents: right, a classified slip, fractions of a cent, or the general hint */
function moneyCheck(ans: number, wrongs: Wrong[], okSay: string, hint: string, o: { exact?: number } = {}): (r: Response) => Verdict {
  return r => {
    if (r.kind !== 'num' || !Number.isFinite(r.v)) return { ok: false, say: 'Type an amount in dollars, like 43.75.' };
    const c = toCents(r.v);
    if (c === ans) return { ok: true, say: okSay };
    if (c === null) {
      if (o.exact !== undefined && Math.abs(r.v * U_CENT * 100 - o.exact) < 1) return { ok: false, say: 'That is the exact interest. Money is paid in whole cents: round it to the nearest cent.' };
      return { ok: false, say: 'Money is in whole cents: two decimal places at most.' };
    }
    const w = wrongs.find(x => x.c === c && x.c !== ans);
    return w ? { ok: false, mc: w.mc, say: w.say } : { ok: false, say: hint };
  };
}
/** a decimal answer (multiplier, t in years): n / 10^places */
function decCheck(n: number, places: number, wrongs: { n: number; places: number; mc?: string; say: string }[], okSay: string, hint: string): (r: Response) => Verdict {
  return r => {
    if (r.kind !== 'num' || !Number.isFinite(r.v)) return { ok: false, say: 'Type a decimal number.' };
    if (sameDec(r.v, n, places)) return { ok: true, say: okSay };
    const w = wrongs.find(x => sameDec(r.v, x.n, x.places));
    return w ? { ok: false, mc: w.mc, say: w.say } : { ok: false, say: hint };
  };
}
interface Opt { t: string; ok?: boolean; mc?: string; say: string }
/** a multiple-choice item from options (one right); shuffled; options must be distinct */
function choiceItem(R: () => number, base: Omit<SIItem, 'input' | 'choices' | 'answer' | 'check'>, opts: Opt[]): SIItem {
  const o = shuffle(R, [...opts]);
  const right = o.findIndex(x => x.ok);
  return {
    ...base, input: 'choice', choices: o.map(x => x.t), answer: { kind: 'choice', i: right },
    check: r => { if (r.kind !== 'choice') return { ok: false, say: 'Pick one.' }; const x = o[r.i]; return x ? { ok: !!x.ok, mc: x.ok ? undefined : x.mc, say: x.say } : { ok: false, say: 'Pick one.' }; },
  };
}
const numItem = (base: Omit<SIItem, 'input' | 'answer' | 'check'>, ansC: number, check: (r: Response) => Verdict): SIItem =>
  ({ ...base, input: 'num', unit: base.unit ?? 'dollars', answer: { kind: 'num', v: ansC / 100 }, check });

// ---------- number pools from the topic JSON cases ----------
/** a principal in whole dollars, $100-$10,000, rounder first */
const principal = (R: () => number, cents = false): number => {
  const d = pick(R, [1, 2, 3, 4, 5, 6, 8, 12, 15, 20, 25, 40, 50, 75, 100]) * 100 + (R() < 0.3 ? pick(R, [0, 50, 25, 75]) : 0);
  return dollars(d) + (cents ? int(R, 1, 99) : 0);
};
/** exact one-year pairs with a decimal rate (interest-decimal-rates, new-balance) */
const DEC_PAIRS: readonly [number, number][] = [[125000, 350], [125000, 250], [84040, 250], [240000, 80], [125000, 80], [84050, 1200], [120000, 350]];
function decPair(R: () => number): [number, number] {
  if (R() < 0.4) return pick(R, DEC_PAIRS);
  for (;;) {
    const bp = pick(R, [250, 350, 450, 150, 80, 50, 650, 1200, 275]);
    const P = R() < 0.5 ? dollars(int(R, 4, 120) * 20) : int(R, 20000, 400000);
    if (exactCents(P, bp) !== null && P % 100 !== 0 || (exactCents(P, bp) !== null && bp % 100 !== 0)) return [P, bp];
  }
}
/** pairs that stay whole cents for 3 years under both rules (simple-multi-year, compound, compare) */
const TABLE_PAIRS: readonly [number, number][] = [[100000, 1000], [20000, 1000], [40000, 500], [80000, 500], [200000, 500], [60000, 1000], [300000, 1000], [120000, 500], [400000, 500], [160000, 500], [500000, 1000]];
const tablePair = (R: () => number): [number, number] => pick(R, TABLE_PAIRS);

/** a principal and a rate from the pools whose one-year interest is whole cents (and passes `ok`) */
function exactPair(R: () => number, mkP: () => number, bps: readonly number[], ok: (P: number, bp: number) => boolean = () => true): [number, number] {
  for (;;) { const P = mkP(), bp = pick(R, bps); if (exactCents(P, bp) !== null && ok(P, bp)) return [P, bp]; }
}

// ---------- pictures ----------
const tapeOne = (P: number, bp: number, o: Partial<TapeParams> = {}): TapeParams => ({ P, bp, years: 1, ...o });
const yearTable = (rows: YearRowT[]): string[][] => rows.map(r => [String(r.year), r.year === 0 ? '' : $T(r.interest), $T(r.balance)]);
type YearRowT = { year: number; interest: number; balance: number };
const HEAD: [string, string, string] = ['year', 'interest', 'balance'];

// ===================================================================================================================
// 1 identify-principal
// ===================================================================================================================
const whoIsP: Gen = (R, n) => {
  const name = pick(R, NAMES), P = principal(R, R() < 0.4), bp = pick(R, [100, 200, 300, 400, 500]), I = roundHalfUp(interestU(P, bp)), Bal = P + I;
  const story = R() < 0.5
    ? `${name} opens ${pick(R, SAVE)} with ${$(P)}. After one year the account has earned ${$(I)} in interest, and the balance is ${$(Bal)}.`
    : `At the end of the year, ${name}’s statement shows a balance of ${$(Bal)}. That includes ${$(I)} of interest on the money ${name} put in at the start: ${$(P)}.`;
  return choiceItem(R, {
    id: `whoIsP-${n}`, family: 'whoIsP', prompt: `${story} Which amount is the <b>principal</b>?`, board: `\\text{principal} = \\$\\,?`,
    solution: [`The principal is the starting amount, the money that earns the interest: ${A($(P))}.`, `${B($(I))} is the interest it earned, and ${S($(Bal))} is the ending balance: ${$(P)} + ${$(I)}.`],
    picture: { tape: tapeOne(P, bp), pre: ['tape'], post: ['whole', 'y1'], work: [`\\text{principal} = ${$T(P)}`] },
  }, [
    { t: $(P), ok: true, say: `Yes: ${$(P)} is what ${name} started with. The interest is figured on it.` },
    { t: $(I), mc: MC.principal, say: `${$(I)} is the interest: what the principal earned in the year, not the starting amount.` },
    { t: $(Bal), mc: MC.principal, say: `${$(Bal)} is the ending balance: the principal plus the interest. The principal is what was there at the start.` },
  ]);
};
const findP: Gen = (R, n) => {
  const name = pick(R, NAMES), P = principal(R, R() < 0.5), bp = pick(R, [100, 200, 250, 300, 400, 500]), I = roundHalfUp(interestU(P, bp)), Bal = P + I;
  const acct = int(R, 1000, 9999);
  return numItem({
    id: `findP-${n}`, family: 'findP',
    prompt: `${name}’s bank statement for account #${acct}: “Balance on Jan 1: ${$(P)}. Interest paid Dec 31: ${$(I)}. Balance on Dec 31: ${$(Bal)}.” No money was added or taken out. What is the principal?`,
    board: `\\text{principal} = \\$\\,?`,
    solution: [`The principal is the amount at the start, before any interest: ${A($(P))} on Jan 1.`, `The other two amounts came from it: interest ${B($(I))}, end balance ${S($(Bal))}.`],
    picture: { tape: tapeOne(P, bp, { hide: { P: true } }), pre: ['tape', 'whole'], post: ['y1'], work: [`\\text{principal} = ${$T(P)}`] },
  }, P, moneyCheck(P, [
    { c: Bal, mc: MC.principal, say: `${$(Bal)} is the balance at the END, with the interest in it. The principal is the balance at the start.` },
    { c: I, mc: MC.principal, say: `${$(I)} is the interest. The principal is the amount that earned it.` },
    { c: acct * 100, mc: MC.anyNumber, say: `${acct} is the account number, not money.` },
  ], `Yes: ${$(P)}, the amount at the start.`, 'Look for the amount at the start of the year, before interest.'));
};

// ===================================================================================================================
// 2 rate-as-percent-of-principal
// ===================================================================================================================
const per100: Gen = (R, n) => {
  const bp = pick(R, [100, 500, 1000, 250, 50]), name = pick(R, NAMES);
  const k = bp % 100 ? pick(R, [2, 4, 6, 8]) : int(R, 2, 9);
  const P = dollars(k * 100), I = cents(P, bp), per = cents(10000, bp);
  return numItem({
    id: `per100-${n}`, family: 'per100',
    prompt: `${name}’s account pays ${B(pct(bp) + '%')} interest per year on ${A($(P))}. ${pct(bp)}% means ${$(per)} for every $100. How much interest does ${$(P)} earn in one year?`,
    board: `${pct(bp)}\\%\\ \\text{of}\\ ${$T(P)} = \\$\\,?`,
    solution: [`${pct(bp)}% of $100 is ${$(per)}.`, `${$(P)} is ${k} hundreds, so the interest is ${k} × ${$(per)} = ${B($(I))}.`],
    picture: { tape: tapeOne(P, bp, { hide: { rows: [1] } }), pre: ['tape', 'whole', 'cells'], post: ['y1'], rings: [{ row: 0, at: 'P' }], work: [`${k} \\times ${$T(per)} = ${$T(I)}`] },
  }, I, moneyCheck(I, [
    { c: per, mc: MC.fixed, say: `${$(per)} is the interest on just $100. ${$(P)} has ${k} hundreds, and each one earns ${$(per)}.` },
    { c: P + bp, mc: MC.numeral, say: 'The interest is a percent OF the principal, not the percent number added on.' },
  ], `Yes: ${k} hundreds × ${$(per)} = ${$(I)}.`, `Count the hundreds in ${$(P)}; each earns ${$(per)}.`));
};
const rateVsDollars: Gen = (R, n) => {
  const bp = pick(R, [200, 300, 500, 250, 400]), name = pick(R, NAMES);
  const k = bp % 100 ? pick(R, [2, 4, 6, 8, 12]) : pick(R, [3, 4, 6, 7, 8, 9, 12, 15]);
  const P = dollars(k * 100), I = cents(P, bp), per = cents(10000, bp), ten = I * 10;
  return choiceItem(R, {
    id: `rateVsDollars-${n}`, family: 'rateVsDollars',
    prompt: `The bank pays ${B(pct(bp) + '%')} per year on ${name}’s ${A($(P))}. Which is true about one year?`,
    board: `${pct(bp)}\\%\\ \\text{per year on}\\ ${$T(P)}`,
    solution: [`${pct(bp)}% is ${$(per)} for every $100 of the principal.`, `${$(P)} = ${k} × $100, so the interest is ${k} × ${$(per)} = ${B($(I))}.`],
    picture: { tape: tapeOne(P, bp, { hide: { rows: [1] } }), pre: ['tape', 'whole'], post: ['cells', 'y1'], work: [`${k} \\times ${$T(per)} = ${$T(I)}`] },
  }, [
    { t: `${name} earns ${$(I)}: ${$(per)} for each $100.`, ok: true, say: `Yes. The rate is per $100 of the principal: ${k} × ${$(per)} = ${$(I)}.` },
    { t: `${name} earns ${$(per)}: the rate is the dollars.`, mc: MC.fixed, say: `${pct(bp)}% is not ${pct(bp)} dollars. It is ${$(per)} for EVERY $100, and there are ${k} hundreds.` },
    { t: `${name} earns ${$(ten)}: ${$(per * 10)} for each $100.`, say: `${pct(bp)}% of $100 is ${$(per)}, not ${$(per * 10)}.` },
  ]);
};

// ===================================================================================================================
// 3 match-rate-period
// ===================================================================================================================
const periodTrap: Gen = (R, n) => {
  const [a, b] = two(R), bp = pick(R, [200, 300, 400, 500]), P = principal(R);
  const how = pick(R, ['for 12 months', 'from June 1 to the next June 1', 'for one whole year', 'from Jan 1 to Dec 31']);
  const months = pick(R, [12, 12]);
  return choiceItem(R, {
    id: `periodTrap-${n}`, family: 'periodTrap',
    prompt: `The account pays ${B(pct(bp) + '% per year')}. ${a} leaves ${A($(P))} in it ${how}. ${b} says: “A year has ${months} months, so the interest is ${months} × ${pct(bp)}% = ${pct(bp * 12)}% of ${$(P)}.” Is ${b} right?`,
    board: `${pct(bp)}\\%\\ \\text{per year}`,
    solution: [`The rate is per YEAR. The money stays exactly one year, so the rate applies once: ${pct(bp)}% of ${$(P)}.`, `${pct(bp * 12)}% would be twelve years of interest.`],
    picture: { tape: tapeOne(P, bp), pre: ['tape', 'whole'], post: ['y1'], work: [`t = 1 \\ \\text{year}`] },
  }, [
    { t: `No: ${pct(bp)}% per year already covers all 12 months.`, ok: true, say: 'Right. The time unit of the rate (per year) matches the time (one year): the rate applies once.' },
    { t: `Yes: 12 months means 12 times the yearly rate.`, mc: MC.units, say: 'Months and years got mixed. The rate is per year, and one year passes, so it applies once, not 12 times.' },
    { t: `Yes, if the bank pays the interest every month.`, mc: MC.units, say: 'However it is paid out, a rate per year gives that percent for one year. 12 × the rate is 12 years’ worth.' },
  ]);
};
const oneYearUnit: Gen = (R, n) => {
  const name = pick(R, NAMES), bp = pick(R, [200, 300, 400, 500, 600]), P = dollars(pick(R, [200, 300, 400, 500, 600, 800, 1000, 1200, 1500, 2000, 2500]));
  const I = cents(P, bp), how = pick(R, ['for 12 months', 'for one year', 'from March 1 to the next March 1']);
  const twelve = I * 12, monthly = Math.round(I / 12);
  const opts: Opt[] = [
    { t: $(I), ok: true, say: `Yes: ${pct(bp)}% per year, for one year: ${pct(bp)}% of ${$(P)} = ${$(I)}.` },
    { t: $(twelve), mc: MC.units, say: `That uses the yearly rate 12 times. 12 months is ONE year, so the rate applies once.` },
  ];
  if (monthly * 12 !== I && monthly !== I && monthly > 0) opts.push({ t: `about ${$(monthly)}`, mc: MC.units, say: `That is one month’s share. The money stays the whole year, and the rate is per year.` });
  else opts.push({ t: $(I * 2), say: `${pct(bp)}% of ${$(P)} is ${$(I)}, one year’s interest.` });
  return choiceItem(R, {
    id: `oneYearUnit-${n}`, family: 'oneYearUnit',
    prompt: `${name} keeps ${A($(P))} in an account at ${B(pct(bp) + '% per year')} ${how}. How much interest is that?`,
    board: `${pct(bp)}\\%\\ \\text{per year} \\times 1\\ \\text{year}`,
    solution: [`The rate is per year and the time is one year: the rate applies once.`, `${pct(bp)}% of ${$(P)} = ${B($(I))}.`],
    picture: { tape: tapeOne(P, bp, { hide: { rows: [1] } }), pre: ['tape', 'whole'], post: ['y1'], work: [`${pct(bp)}\\% \\times ${$T(P)} = ${$T(I)}`] },
  }, opts);
};

// ===================================================================================================================
// 4 savings-and-loan-contexts
// ===================================================================================================================
const loanRoles: Gen = (R, n) => {
  const name = pick(R, NAMES), what = pick(R, LOAN), bp = pick(R, [300, 400, 500, 600, 800]), P = principal(R), I = cents(P, bp);
  const extra = R() < 0.5 ? pick(R, [`${name} is ${int(R, 18, 24)} years old.`, `The loan number is ${int(R, 2000, 9800)}.`, `A helmet for it costs ${$(dollars(int(R, 40, 180)))}.`]) : '';
  if (R() < 0.5) {
    return choiceItem(R, {
      id: `loanRoles-${n}`, family: 'loanRoles',
      prompt: `${name} borrows ${A($(P))} from a credit union for ${what} at ${B(pct(bp) + '% per year')}. ${extra} ${name} repays the loan with interest at the end of one year. Who pays the interest?`,
      board: `\\text{loan}\\ ${$T(P)}\\ \\text{at}\\ ${pct(bp)}\\%`,
      solution: [`A borrower pays interest to the lender for using the money.`, `${name} owes ${$(P)} + ${B($(I))} = ${S($(P + I))} at the end of the year.`],
      picture: { tape: tapeOne(P, bp, { loan: true }), pre: ['tape', 'whole'], post: ['y1'], work: [`\\text{owed} = ${$T(P)} + ${$T(I)}`] },
    }, [
      { t: `${name} pays it to the credit union.`, ok: true, say: `Yes. The borrower pays for the use of the money: ${name} owes ${$(P + I)} in all.` },
      { t: `The credit union pays it to ${name}.`, mc: MC.borrower, say: 'That is how savings work. On a loan, the borrower pays interest to the lender.' },
      { t: `Nobody: interest is only for savings.`, say: 'Loans have interest too. The borrower pays it to the lender.' },
    ]);
  }
  const owed = P + I;
  const opts: Opt[] = [
    { t: $(P), ok: true, say: `Yes: the principal of a loan is the amount borrowed, ${$(P)}.` },
    { t: $(owed), mc: MC.principal, say: `${$(owed)} is what ${name} owes at the end: the principal plus the interest.` },
    { t: $(I), mc: MC.principal, say: `${$(I)} is the interest. The principal is the amount borrowed.` },
  ];
  return choiceItem(R, {
    id: `loanRoles-${n}`, family: 'loanRoles',
    prompt: `${name} borrows money for ${what} at ${pct(bp)}% per year. ${extra} At the end of one year, ${name} pays back ${$(owed)}, which includes ${$(I)} interest. What is the principal of the loan?`,
    board: `\\text{loan:}\\ ${$T(owed)}\\ \\text{repaid}`,
    solution: [`The principal of a loan is the amount borrowed: ${A($(P))}.`, `${name} pays it back plus ${B($(I))} interest: ${S($(owed))}.`],
    picture: { tape: tapeOne(P, bp, { loan: true, hide: { P: true } }), pre: ['tape', 'whole', 'y1'], post: [], work: [`${$T(owed)} - ${$T(I)} = ${$T(P)}`] },
  }, opts);
};
const earnOrOwe: Gen = (R, n) => {
  const [a, b] = two(R), [P, bp] = exactPair(R, () => principal(R), [200, 300, 400, 500, 600], (P, bp) => cents(P, bp) !== bp), I = cents(P, bp);
  return choiceItem(R, {
    id: `earnOrOwe-${n}`, family: 'earnOrOwe',
    prompt: `${a} puts ${A($(P))} in ${pick(R, SAVE)} at ${B(pct(bp) + '% per year')}. ${b} borrows ${A($(P))} for ${pick(R, LOAN)} at ${B(pct(bp) + '% per year')}. After one year, what is true?`,
    board: `${$T(P)}\\ \\text{at}\\ ${pct(bp)}\\%`,
    solution: [`Both interests are ${pct(bp)}% of ${$(P)} = ${B($(I))}.`, `${a} (the saver) EARNS it: ${$(P + I)}. ${b} (the borrower) OWES it: ${$(P + I)}.`],
    picture: { tape: tapeOne(P, bp), pre: ['tape', 'whole'], post: ['y1'], work: [`${pct(bp)}\\%\\ \\text{of}\\ ${$T(P)} = ${$T(I)}`] },
  }, [
    { t: `${a} has ${$(P + I)}; ${b} owes ${$(P + I)}.`, ok: true, say: `Yes. Same principal, same rate, same interest ${$(I)}: one earns it, the other pays it.` },
    { t: `${a} has ${$(P + I)}; ${b} owes ${$(P - I)}.`, mc: MC.borrower, say: `A borrower does not receive interest. ${b} pays it on top: ${$(P)} + ${$(I)}.` },
    { t: `${a} has ${$(P + bp)}; ${b} owes ${$(P + bp)}.`, mc: MC.fixed, say: `${pct(bp)}% is not ${pct(bp)} dollars. It is ${pct(bp)}% of ${$(P)}: ${$(I)}.` },
  ]);
};

// ===================================================================================================================
// 5 interest-friendly
// ===================================================================================================================
const oneYear: Gen = (R, n) => {
  const bp = pick(R, [200, 400, 500, 1000, 2500]), P = dollars(pick(R, [200, 600, 1500, 300, 400, 800, 1000, 1200, 2000, 2400])), I = cents(P, bp);
  const name = pick(R, NAMES), loan = R() < 0.3;
  const ten = cents(P, 1000);
  return numItem({
    id: `oneYear-${n}`, family: 'oneYear',
    prompt: loan ? `${name} borrows ${A($(P))} at ${B(pct(bp) + '% per year')} for one year. How much interest does ${name} owe for the year?`
      : `${name} deposits ${A($(P))} at ${B(pct(bp) + '% per year')}. How much interest does it earn in one year?`,
    board: `${pct(bp)}\\% \\times ${$T(P)} = \\$\\,?`,
    solution: [`10% of ${$(P)} is ${$(ten)} (one cell of the tape).`, `${pct(bp)}% = ${rateDec(bp)}, so the interest is ${rateDec(bp)} × ${$(P)} = ${B($(I))}.`],
    picture: { tape: tapeOne(P, bp, { loan, hide: { rows: [1] } }), pre: ['tape', 'whole', 'cells'], post: ['y1'], rings: [{ row: 0, at: 'P' }], work: [`${rateDec(bp)} \\times ${$T(P)} = ${$T(I)}`] },
  }, I, moneyCheck(I, [
    { c: dollars(bp / 100), mc: MC.fixed, say: `${pct(bp)}% is not ${pct(bp)} dollars: it is ${pct(bp)} cents of every dollar, ${pct(bp)} dollars of every $100.` },
    { c: P + dollars(bp / 100), mc: MC.numeral, say: 'The percent number was added on. Find the percent OF the principal.' },
    { c: P + I, say: `That is the balance. The question asks only for the interest: ${$(I)}.` },
  ], `Yes: ${pct(bp)}% of ${$(P)} = ${$(I)}.`, `Start from 10% of ${$(P)}: ${$(ten)}.`));
};
const fromTen: Gen = (R, n) => {
  const P = dollars(pick(R, [200, 300, 400, 600, 800, 1500, 1200, 2000, 2500, 3000, 5000])), bp = pick(R, [500, 2000, 200, 400, 2500]), I = cents(P, bp), ten = cents(P, 1000);
  const how = bp === 500 ? `half of 10%` : bp === 2000 ? `2 × 10%` : bp === 200 ? `10% ÷ 5` : bp === 400 ? `2 × 2%` : `2 × 10% + half of 10%`;
  const name = pick(R, NAMES);
  return numItem({
    id: `fromTen-${n}`, family: 'fromTen',
    prompt: `${name}’s CD holds ${A($(P))}. 10% of ${$(P)} is ${$(ten)}. The rate is ${B(pct(bp) + '% per year')}. How much interest in one year?`,
    board: `10\\% = ${$T(ten)},\\ \\ ${pct(bp)}\\% = \\$\\,?`,
    solution: [`${pct(bp)}% is ${how}.`, `So the interest is ${B($(I))}.`],
    picture: { tape: tapeOne(P, bp, { hide: { rows: [1] } }), pre: ['tape', 'whole', 'cells'], post: ['y1'], work: [`${pct(bp)}\\%\\ \\text{of}\\ ${$T(P)} = ${$T(I)}`] },
  }, I, moneyCheck(I, [
    { c: dollars(bp / 100), mc: MC.fixed, say: `${pct(bp)}% is a part of ${$(P)}, not ${pct(bp)} dollars.` },
    { c: ten, say: `${$(ten)} is 10%. Now find ${pct(bp)}%: ${how}.` },
  ], `Yes: ${how} gives ${$(I)}.`, `${pct(bp)}% is ${how}.`));
};

// ===================================================================================================================
// 6 interest-decimal-rates
// ===================================================================================================================
const decInterest: Gen = (R, n) => {
  const [P, bp] = decPair(R), I = cents(P, bp), name = pick(R, NAMES), calc = R() < 0.5;
  return numItem({
    id: `decInterest-${n}`, family: 'decInterest',
    prompt: `${name} keeps ${A($(P))} in ${pick(R, SAVE)} at ${B(pct(bp) + '% per year')}. How much interest does it earn in one year? ${calc ? '(calculator)' : '(by hand)'}`,
    board: `${rateDec(bp)} \\times ${$T(P)} = \\$\\,?`,
    solution: [`${pct(bp)}% = ${pct(bp)} ÷ 100 = ${rateDec(bp)}.`, `${rateDec(bp)} × ${$(P)} = ${B(usd(I, true))}.`],
    picture: { tape: tapeOne(P, bp, { hide: { rows: [1] } }), pre: ['tape', 'whole'], post: ['y1'], work: [`${pct(bp)}\\% = ${rateDec(bp)}`, `${rateDec(bp)} \\times ${$T(P)} = ${usdTex(I, true)}`] },
  }, I, moneyCheck(I, [
    { c: I * 10, mc: MC.point, say: `The decimal point moved one place too few: ${pct(bp)}% is ${rateDec(bp)}, so the interest is ${usd(I, true)}.` },
    { c: I * 100, mc: MC.noDiv100, say: `That uses ${pct(bp)} as the multiplier. ${pct(bp)}% = ${rateDec(bp)}.` },
    ...(I % 10 === 0 ? [{ c: I / 10, mc: MC.point, say: `One place too far: ${pct(bp)}% is ${rateDec(bp)}.` }] : []),
    { c: P + I, say: `That is the new balance. The question asks for the interest only.` },
  ], `Yes: ${rateDec(bp)} × ${$(P)} = ${usd(I, true)}.`, `Write ${pct(bp)}% as the decimal ${rateDec(bp)} first.`));
};
const pctToDec: Gen = (R, n) => {
  const bp = pick(R, [350, 250, 80, 50, 450, 650, 275, 125, 1200, 225, 175, 325, 30, 60, 850, 1150]);
  const name = pick(R, NAMES);
  const opts: Opt[] = [
    { t: rateDec(bp), ok: true, say: `Yes: ${pct(bp)}% = ${pct(bp)} ÷ 100 = ${rateDec(bp)}.` },
    { t: decOf(bp, 3), mc: MC.point, say: `That moved the point only one place. Percent means per hundred: two places.` },
    { t: pct(bp), mc: MC.noDiv100, say: `That is the percent number itself. ${pct(bp)}% is ${pct(bp)} hundredths: ${rateDec(bp)}.` },
    { t: decOf(bp, 5), say: `One place too far: ${pct(bp)} ÷ 100 = ${rateDec(bp)}.` },
  ];
  return choiceItem(R, {
    id: `pctToDec-${n}`, family: 'pctToDec',
    prompt: `${name}’s savings rate is ${B(pct(bp) + '% per year')}. Which decimal do you multiply the principal by to find one year’s interest? (no calculator)`,
    board: `${pct(bp)}\\% = \\,?`,
    solution: [`Percent means “per hundred”: divide by 100.`, `${pct(bp)} ÷ 100 = ${rateDec(bp)}: move the point two places left.`],
    picture: { pre: [], post: [], work: [`${pct(bp)}\\% = ${pct(bp)} \\div 100 = ${rateDec(bp)}`] },
  }, opts);
};

// ===================================================================================================================
// 7 new-balance
// ===================================================================================================================
const endBalance: Gen = (R, n) => {
  const [P, bp] = decPair(R), I = cents(P, bp), name = pick(R, NAMES), loan = R() < 0.4, Bal = P + I;
  return numItem({
    id: `endBalance-${n}`, family: 'endBalance',
    prompt: loan ? `${name} borrows ${A($(P))} for ${pick(R, LOAN)} at ${B(pct(bp) + '% per year')}, repaid in one payment after one year. The interest is ${B(usd(I, true))}. How much does ${name} owe at the end of the year?`
      : `${name} deposits ${A($(P))} at ${B(pct(bp) + '% per year')}. The interest for the year is ${B(usd(I, true))}. What is the ending balance?`,
    board: `${$T(P)} + ${usdTex(I, true)} = \\$\\,?`,
    solution: [`${loan ? 'Amount owed' : 'Ending balance'} = principal + interest.`, `${usd(P, true)} + ${usd(I, true)} = ${S(usd(Bal, true))} (line up the decimal points).`],
    picture: { tape: tapeOne(P, bp, { loan }), pre: ['tape', 'whole', 'y1'], post: ['gain'], work: [`${usdTex(P, true)} + ${usdTex(I, true)} = ${usdTex(Bal, true)}`] },
  }, Bal, moneyCheck(Bal, [
    { c: I, mc: MC.changeFinal, say: `${usd(I, true)} is the interest, what was ADDED. The ${loan ? 'amount owed' : 'balance'} is the principal plus it.` },
    { c: P + dollars(bp / 100), mc: MC.numeral, say: `That adds the percent number. Add the interest, ${usd(I, true)}.` },
    { c: P - I, mc: loan ? MC.borrower : undefined, say: loan ? 'The borrower owes MORE, not less: interest is added to the loan.' : 'Interest is added to savings, not taken away.' },
  ], `Yes: ${usd(P, true)} + ${usd(I, true)} = ${usd(Bal, true)}.`, `Add the interest to the principal, decimal point under decimal point.`));
};
const labelBoth: Gen = (R, n) => {
  const [P, bp] = decPair(R), I = cents(P, bp), Bal = P + I, name = pick(R, NAMES), loan = R() < 0.4;
  const item: SIItem = {
    id: `labelBoth-${n}`, family: 'labelBoth',
    prompt: `${loan ? `${name} borrows ${A($(P))} for one year at ${B(pct(bp) + '%')}, repaid at the end.` : `${name} saves ${A($(P))} for one year at ${B(pct(bp) + '%')}.`} Type the interest and the ${loan ? 'amount owed' : 'ending balance'}.`,
    board: `I = \\$\\,?,\\ \\ ${loan ? '\\text{owed}' : '\\text{balance}'} = \\$\\,?`,
    input: 'pair', pairLead: 'interest $', pairOp: loan ? 'owed $' : 'balance $',
    answer: { kind: 'pair', x: I / 100, y: Bal / 100 },
    solution: [`Interest: ${rateDec(bp)} × ${$(P)} = ${B(usd(I, true))}.`, `${loan ? 'Owed' : 'Balance'}: ${$(P)} + ${usd(I, true)} = ${S(usd(Bal, true))}.`],
    picture: { tape: tapeOne(P, bp, { loan, hide: { rows: [1] } }), pre: ['tape', 'whole'], post: ['y1', 'gain'], work: [`I = ${rateDec(bp)} \\times ${$T(P)} = ${usdTex(I, true)}`, `${$T(P)} + ${usdTex(I, true)} = ${usdTex(Bal, true)}`] },
    check: r => {
      if (r.kind !== 'pair') return { ok: false, say: 'Fill in both boxes.' };
      const x = toCents(r.x), y = toCents(r.y);
      if (x === I && y === Bal) return { ok: true, say: `Yes: interest ${usd(I, true)}, ${loan ? 'owed' : 'balance'} ${usd(Bal, true)}, each with its own label.` };
      if (x === Bal && y === I) return { ok: false, mc: MC.changeFinal, say: 'The two are swapped: the interest is the small amount added, the balance is principal + interest.' };
      if (x === I && y === I) return { ok: false, mc: MC.changeFinal, say: `The ${loan ? 'amount owed' : 'balance'} is not the interest: add it to the principal.` };
      if (x === I * 10 || x === I / 10) return { ok: false, mc: MC.point, say: `Check the decimal point: ${pct(bp)}% = ${rateDec(bp)}.` };
      if (x === I) return { ok: false, say: `The interest is right. Now add it to ${$(P)}.` };
      return { ok: false, say: `First the interest (${rateDec(bp)} × ${$(P)}), then add it to the principal.` };
    },
  };
  return item;
};

// ===================================================================================================================
// 8 balance-multiplier
// ===================================================================================================================
const MULT_PAIRS: readonly [number, number][] = [[80000, 600], [125000, 400], [120000, 250]];
function multPair(R: () => number): [number, number] {
  if (R() < 0.35) return pick(R, MULT_PAIRS);
  for (;;) {
    const bp = pick(R, [200, 300, 400, 500, 600, 700, 800, 900, 250, 350, 450, 150]);
    const P = dollars(int(R, 2, 60) * 50);
    if (exactCents(P, bp) !== null) return [P, bp];
  }
}
/** "1." + the rate's digits: 6% -> 1.6, 2.5% -> 1.25 (the appended-digits slip) */
const appended = (bp: number): [number, number] => { const d = pct(bp).replace('.', ''); return [Number('1' + d), d.length]; };
const multExpr: Gen = (R, n) => {
  const [P, bp] = multPair(R), name = pick(R, NAMES), Pd = digits(P), Bal = P + cents(P, bp);
  const [an, ap] = appended(bp);
  const app = decOf(an, ap);
  return choiceItem(R, {
    id: `multExpr-${n}`, family: 'multExpr',
    prompt: `${name} saves ${A($(P))} at ${B(pct(bp) + '% per year')}. Which ONE expression gives the balance after one year? (no calculator)`,
    board: `${$T(P)}\\ \\text{at}\\ ${pct(bp)}\\%`,
    solution: [`The balance is 100% of the principal plus ${pct(bp)}% more: ${100 + bp / 100}% = ${multDec(bp)}.`, `${Pd} × ${multDec(bp)} = ${S($(Bal))}.`],
    picture: { tape: tapeOne(P, bp), pre: ['tape', 'whole'], post: ['y1', 'gain'], work: [`100\\% + ${pct(bp)}\\% = ${multDec(bp)}`, `${$T(P)} \\times ${multDec(bp)} = ${$T(Bal)}`] },
  }, [
    { t: `${Pd} × ${multDec(bp)}`, ok: true, say: `Yes: × ${multDec(bp)} keeps the whole ${$(P)} (the 1) and adds ${pct(bp)}% (the ${rateDec(bp)}).` },
    { t: `${Pd} × ${rateDec(bp)}`, mc: MC.changeFinal, say: `${Pd} × ${rateDec(bp)} is just the interest, not the balance.` },
    { t: `${Pd} × ${app}`, mc: MC.appends, say: `${pct(bp)}% is ${rateDec(bp)}, so the multiplier is 1 + ${rateDec(bp)} = ${multDec(bp)}, not ${app}.` },
    { t: `${Pd} + ${pct(bp)}`, mc: MC.numeral, say: `That adds ${pct(bp)} dollars. The interest is ${pct(bp)}% OF ${$(P)}.` },
  ]);
};
const multValue: Gen = (R, n) => {
  const [P, bp] = multPair(R), name = pick(R, NAMES), Bal = P + cents(P, bp);
  const askBal = R() < 0.5;
  const [an, ap] = appended(bp);
  const mN = 10000 + bp;
  if (askBal) {
    return numItem({
      id: `multValue-${n}`, family: 'multValue',
      prompt: `${name} saves ${A($(P))} at ${B(pct(bp) + '% per year')}. Use ONE multiplication: what is the balance after one year?`,
      board: `${$T(P)} \\times ${multDec(bp)} = \\$\\,?`,
      solution: [`The multiplier is 1 + ${rateDec(bp)} = ${multDec(bp)}.`, `${$(P)} × ${multDec(bp)} = ${S($(Bal))}.`],
      picture: { tape: tapeOne(P, bp), pre: ['tape', 'whole'], post: ['y1', 'gain'], work: [`${$T(P)} \\times ${multDec(bp)} = ${$T(Bal)}`] },
    }, Bal, moneyCheck(Bal, [
      { c: Bal - P, mc: MC.changeFinal, say: `That is the interest. The balance keeps the ${$(P)} too: × ${multDec(bp)}.` },
      { c: Math.round((P * an) / 10 ** ap), mc: MC.appends, say: `${pct(bp)}% = ${rateDec(bp)}, so the multiplier is ${multDec(bp)}, not ${decOf(an, ap)}.` },
    ], `Yes: ${$(P)} × ${multDec(bp)} = ${$(Bal)}.`, `Multiply by 1 + ${rateDec(bp)}.`));
  }
  const it: SIItem = {
    id: `multValue-${n}`, family: 'multValue',
    prompt: `The rate is ${B(pct(bp) + '% per year')}. ${A($(P))} × ? gives the balance after one year in ONE step. What is the multiplier?`,
    board: `${$T(P)} \\times \\,? = \\text{balance}`,
    input: 'num', unit: '', answer: { kind: 'num', v: mN / 10000 },
    solution: [`100% (keep the principal) + ${pct(bp)}% (the interest) = ${100 + bp / 100}%.`, `As a decimal: 1 + ${rateDec(bp)} = ${S(multDec(bp))}.`],
    picture: { tape: tapeOne(P, bp), pre: ['tape', 'whole'], post: ['y1', 'gain'], work: [`1 + ${rateDec(bp)} = ${multDec(bp)}`] },
    check: decCheck(mN, 4, [
      { n: an, places: ap, mc: MC.appends, say: `${pct(bp)}% is ${rateDec(bp)}, so it is 1 + ${rateDec(bp)} = ${multDec(bp)}.` },
      { n: bp, places: 4, mc: MC.changeFinal, say: `× ${rateDec(bp)} gives only the interest. Keep the principal too: 1 + ${rateDec(bp)}.` },
      { n: bp, places: 2, mc: MC.noDiv100, say: `${pct(bp)}% is ${rateDec(bp)}, and the balance needs 1 + ${rateDec(bp)}.` },
    ], `Yes: × ${multDec(bp)} is 100% + ${pct(bp)}%.`, `Keep 100% of the principal and add ${pct(bp)}%: 1 + ${rateDec(bp)}.`),
  };
  return it;
};

// ===================================================================================================================
// 9 round-to-cent
// ===================================================================================================================
const ROUND_PAIRS: readonly [number, number][] = [[12345, 300], [84050, 225], [25050, 300]];
function roundPair(R: () => number, needDiff = false): [number, number] {
  for (let i = 0; ; i++) {
    const pr = i === 0 && R() < 0.35 ? pick(R, ROUND_PAIRS) : [int(R, 10000, 250000), pick(R, [300, 225, 275, 150, 350, 125, 175, 325, 450])] as [number, number];
    const u = interestU(pr[0], pr[1]);
    if (u % U_CENT === 0) continue;
    if (needDiff && roundHalfUp(u) === truncCents(u)) continue;
    return pr;
  }
}
const roundI: Gen = (R, n) => {
  const [P, bp] = roundPair(R), u = interestU(P, bp), I = roundHalfUp(u), T = truncCents(u), name = pick(R, NAMES), ex = unitsStr(u);
  return numItem({
    id: `roundI-${n}`, family: 'roundI',
    prompt: `${name}’s account holds ${A(usd(P, true))} at ${B(pct(bp) + '% per year')}. The bank rounds interest to the nearest cent (a half cent rounds up). The exact interest is ${rateDec(bp)} × ${usd(P, true)} = $${ex}. What interest is credited?`,
    board: `I = \\$${ex.replace(/,/g, '{,}')} \\approx \\$\\,?`,
    solution: [`Exact: $${ex}. The cent place is the 2nd digit after the point; look at the 3rd digit.`, `${Number(ex.replace(/,/g, '').split('.')[1]![2])} ${Number(ex.replace(/,/g, '').split('.')[1]![2]) >= 5 ? '≥ 5: round up' : '< 5: round down'}: ${B(usd(I, true))}.`],
    picture: { tape: tapeOne(P, bp, { hide: { rows: [1] } }), pre: ['tape', 'whole', 'y1'], post: [], work: [`\\$${ex.replace(/,/g, '{,}')} \\approx ${usdTex(I, true)}`] },
  }, I, moneyCheck(I, [
    ...(T !== I ? [{ c: T, mc: MC.trunc, say: `That cuts the digits off. The next digit is 5 or more, so the cent rounds UP: ${usd(I, true)}.` }] : []),
    { c: P + I, say: 'That is the new balance. The question asks for the interest credited.' },
  ], `Yes: $${ex} rounds to ${usd(I, true)}.`, 'Look at the third digit after the point: 5 or more rounds the cent up.', { exact: u }));
};
const roundRule: Gen = (R, n) => {
  const [P, bp] = roundPair(R, true), u = interestU(P, bp), I = roundHalfUp(u), T = truncCents(u), name = pick(R, NAMES), ex = unitsStr(u);
  const opts: Opt[] = [
    { t: `interest ${usd(I, true)}, balance ${usd(P + I, true)}`, ok: true, say: `Yes: round the exact interest once, then add that same ${usd(I, true)} to the principal.` },
    { t: `interest ${usd(T, true)}, balance ${usd(P + T, true)}`, mc: MC.trunc, say: `That cuts the interest off instead of rounding: $${ex} rounds UP to ${usd(I, true)}.` },
    { t: `interest ${usd(I, true)}, balance ${usd(P + T, true)}`, mc: MC.inconsistent, say: `The balance must use the SAME rounded interest: ${usd(P, true)} + ${usd(I, true)} = ${usd(P + I, true)}.` },
  ];
  if (bp % 10 !== 0) {
    const rb = Math.round(bp / 10) * 10;   // the rate rounded to a tenth of a percent first
    const alt = roundHalfUp(interestU(P, rb));
    if (rb !== bp && alt !== I && alt !== T) opts.push({ t: `round the rate to ${pct(rb)}% first: interest ${usd(alt, true)}`, mc: MC.early, say: 'Keep the rate exact while you calculate. Round only the interest, once, at the end.' });
  }
  return choiceItem(R, {
    id: `roundRule-${n}`, family: 'roundRule',
    prompt: `${A(usd(P, true))} earns ${B(pct(bp) + '%')} for one year: exactly $${ex}. The bank’s rule: round the interest to the nearest cent, halves up, then add it. Which record follows the rule?`,
    board: `\\text{exact:}\\ \\$${ex.replace(/,/g, '{,}')}`,
    solution: [`Round once: $${ex} → ${B(usd(I, true))}.`, `Add that same amount: ${usd(P, true)} + ${usd(I, true)} = ${S(usd(P + I, true))}.`],
    picture: { tape: tapeOne(P, bp), pre: ['tape', 'whole', 'y1'], post: ['gain'], work: [`\\$${ex.replace(/,/g, '{,}')} \\approx ${usdTex(I, true)}`, `${usdTex(P, true)} + ${usdTex(I, true)} = ${usdTex(P + I, true)}`] },
  }, opts);
};

// ===================================================================================================================
// 10 justify-reasonableness
// ===================================================================================================================
const spotError: Gen = (R, n) => {
  const [P, bp] = exactPair(R, () => principal(R), [250, 350, 450, 200, 300, 400, 500, 600, 800], (P, bp) => cents(P, bp) !== dollars(bp / 100) && exactCents(P, 100) !== null && exactCents(P, 1000) !== null);
  const I = cents(P, bp), name = pick(R, NAMES), kind = pick(R, ['fixed', 'endBase', 'point', 'none'] as const);
  const Bal = P + I;
  const endI = roundHalfUp(interestU(Bal, bp));
  const line = kind === 'fixed' ? `Interest = ${$(dollars(bp / 100))} because the rate is ${pct(bp)}%.`
    : kind === 'endBase' ? `Interest = ${pct(bp)}% of ${$(Bal)} = ${usd(endI, true)}.`
      : kind === 'point' ? `Interest = ${rateDec(bp)} × ${$(P)} = ${usd(I * 10, true)}.`
        : `Interest = ${rateDec(bp)} × ${$(P)} = ${usd(I, true)}.`;
  const said = { fixed: 'used the rate as a number of dollars', endBase: 'took the percent of the ending balance, not the principal', point: 'put the decimal point in the wrong place', none: '' };
  const mcOf = { fixed: MC.fixed, endBase: MC.newBase, point: MC.point, none: undefined };
  const opts: Opt[] = (['fixed', 'endBase', 'point'] as const).map(k => ({
    t: `${name} ${said[k]}.`, ok: k === kind,
    say: k === kind ? `Yes. Check: 1% of ${$(P)} is ${usd(cents(P, 100), true)}, so ${pct(bp)}% is about ${pct(bp)} times that: ${usd(I, true)}.` : `Look again: check the answer against 1% of ${$(P)} = ${usd(cents(P, 100), true)}.`,
  }));
  opts.push({ t: 'Nothing: the work is right.', ok: kind === 'none', mc: mcOf[kind], say: kind === 'none' ? `Right: 1% is ${usd(cents(P, 100), true)}, and ${pct(bp)}% = ${usd(I, true)} fits.` : `Check with 1%: 1% of ${$(P)} is ${usd(cents(P, 100), true)}, so ${pct(bp)}% should be ${usd(I, true)}.` });
  return choiceItem(R, {
    id: `spotError-${n}`, family: 'spotError',
    prompt: `${name} finds one year of interest on ${$(P)} at ${pct(bp)}% per year. The ending balance is ${$(Bal)}. ${name} writes: “${line}” What went wrong?`,
    board: `${pct(bp)}\\%\\ \\text{of}\\ ${$T(P)}\\ \\approx\\ ?`,
    solution: [`The base is the principal ${A($(P))}. 1% of it is ${usd(cents(P, 100), true)}; 10% is ${usd(cents(P, 1000), true)}.`, `${pct(bp)}% = ${rateDec(bp)} × ${$(P)} = ${B(usd(I, true))}.`],
    picture: { tape: tapeOne(P, bp), pre: ['tape', 'whole', 'cells'], post: ['y1'], rings: [{ row: 0, at: 'P' }], work: [`1\\% = ${usdTex(cents(P, 100), true)}`, `10\\% = ${usdTex(cents(P, 1000), true)}`, `${pct(bp)}\\% = ${usdTex(I, true)}`] },
  }, opts);
};
const estimate: Gen = (R, n) => {
  const kind = pick(R, ['ok', 'big', 'small'] as const);
  const P = dollars(pick(R, kind === 'small' ? [1000, 1200, 1500, 2000, 2400, 3000, 4000, 5000, 6000, 8000, 10000] : [500, 800, 1250, 1500, 2000, 2400, 3000, 4000, 5000, 6000, 8000, 10000])), bp = pick(R, [250, 350, 400, 450, 600, 750, 150]);
  const I = cents(P, bp), one = cents(P, 100), ten = cents(P, 1000), name = pick(R, NAMES);
  const shown = kind === 'ok' ? I : kind === 'big' ? I * 10 : dollars(bp / 100);
  return choiceItem(R, {
    id: `estimate-${n}`, family: 'estimate',
    prompt: `${name} says one year of interest on ${A($(P))} at ${B(pct(bp) + '%')} is ${usd(shown, true)}. Check it with 1% and 10% of ${$(P)}. Is it reasonable?`,
    board: `1\\% = ${$T(one)},\\ \\ 10\\% = ${$T(ten)}`,
    solution: [`1% of ${$(P)} is ${$(one)}; 10% is ${$(ten)}. ${pct(bp)}% lies between, so the interest is between ${$(one)} and ${$(ten)}.`, `Exact: ${rateDec(bp)} × ${$(P)} = ${B(usd(I, true))}.`],
    picture: { tape: tapeOne(P, bp), pre: ['tape', 'whole', 'cells'], post: ['y1'], work: [`${$T(one)} < I < ${$T(ten)}`, `I = ${usdTex(I, true)}`] },
  }, [
    { t: `Yes: it is between ${$(one)} (1%) and ${$(ten)} (10%).`, ok: kind === 'ok', mc: kind === 'big' ? MC.point : kind === 'small' ? MC.fixed : undefined, say: kind === 'ok' ? 'Right: between the two benchmarks, as it must be.' : `${usd(shown, true)} is not between ${$(one)} and ${$(ten)}: it fails the check.` },
    { t: `No: it is more than 10% (${$(ten)}).`, ok: kind === 'big', say: kind === 'big' ? 'Right: a rate under 10% cannot give more than 10%. The decimal point slipped.' : `Compare: ${usd(shown, true)} is not more than ${$(ten)}.` },
    { t: `No: it is less than 1% (${$(one)}).`, ok: kind === 'small', say: kind === 'small' ? `Right: ${pct(bp)}% can’t be less than 1%. That used ${pct(bp)} dollars, not ${pct(bp)}% of ${$(P)}.` : `Compare: ${usd(shown, true)} is not less than ${$(one)}.` },
  ]);
};

// ===================================================================================================================
// 11 simple-multi-year
// ===================================================================================================================
const tableCell: Gen = (R, n) => {
  const [P, bp] = tablePair(R), years = pick(R, [2, 3, 3]), sim = schedule(P, bp, years, 'simple'), comp = schedule(P, bp, years, 'compound');
  const ask = pick(R, ['bal', 'bal', 'int'] as const), k = ask === 'int' ? years : int(R, 2, years);
  const ans = ask === 'bal' ? sim[k]!.balance : sim[k]!.interest;
  const rows = yearTable(sim.slice(0, years + 1));
  const shown = rows.map((r, i) => i === 0 ? r : i < k ? r : i === k ? (ask === 'bal' ? [r[0]!, r[1]!, '?'] : [r[0]!, '?', '?']) : [r[0]!, '?', '?']);
  const name = pick(R, NAMES);
  return numItem({
    id: `tableCell-${n}`, family: 'tableCell',
    prompt: `${name} saves ${A($(P))} at ${B(pct(bp) + '% simple interest per year')}: interest once a year, no other deposits. Fill the table: what is the ${ask === 'bal' ? 'balance' : 'interest'} in year ${k}?`,
    board: `${$T(P)},\\ ${pct(bp)}\\%\\ \\text{simple}`,
    solution: [`Simple interest is always ${pct(bp)}% of the principal ${A($(P))}: ${B($(sim[1]!.interest))} every year.`, ask === 'bal' ? `Year ${k}: ${$(P)} + ${k} × ${$(sim[1]!.interest)} = ${S($(ans))}.` : `Year ${k} adds ${B($(ans))}, the same as year 1.`],
    picture: { tape: { P, bp, years }, pre: ['tape', 'whole', ...Array.from({ length: k - 1 }, (_, i) => `y${i + 1}` as TapeStep)], post: Array.from({ length: years - k + 1 }, (_, i) => `y${k + i}` as TapeStep), rings: [{ row: k - 1, at: 'P' }], table: { head: HEAD, rows: shown, solved: rows }, work: [] },
  }, ans, moneyCheck(ans, [
    { c: ask === 'bal' ? comp[k]!.balance : comp[k]!.interest, mc: MC.compounds, say: `That takes ${pct(bp)}% of the growing balance (compound). Simple interest is ${pct(bp)}% of the original ${$(P)} every year.` },
    { c: ask === 'bal' ? sim[1]!.balance : -1, mc: MC.omitsTime, say: `That is only one year. Each year adds another ${$(sim[1]!.interest)}.` },
    { c: ask === 'int' ? sim[k]!.balance : -1, say: 'That is the balance. The interest column holds what the year ADDED.' },
  ], `Yes: ${$(ans)}.`, `Each year adds the same ${$(sim[1]!.interest)}.`));
};
const sameEach: Gen = (R, n) => {
  const [P, bp] = tablePair(R), comp = schedule(P, bp, 3, 'compound'), I = comp[1]!.interest, name = pick(R, NAMES), k = pick(R, [2, 3]);
  return choiceItem(R, {
    id: `sameEach-${n}`, family: 'sameEach',
    prompt: `${name}’s ${A($(P))} earns ${B(pct(bp) + '% simple interest per year')}. Year 1 adds ${B($(I))}. How much interest does year ${k} add?`,
    board: `\\text{year}\\ 1:\\ +${$T(I)},\\ \\ \\text{year}\\ ${k}:\\ +\\,?`,
    solution: [`Simple interest is figured on the principal ${A($(P))} only, and the principal never changes.`, `So every year adds the same ${B($(I))}.`],
    picture: { tape: { P, bp, years: k }, pre: ['tape', 'whole', 'y1'], post: Array.from({ length: k - 1 }, (_, i) => `y${i + 2}` as TapeStep), rings: [{ row: k - 1, at: 'P' }], work: [`${pct(bp)}\\% \\times ${$T(P)} = ${$T(I)}`] },
  }, [
    { t: $(I), ok: true, say: `Yes: always ${pct(bp)}% of the same ${$(P)}.` },
    { t: $(comp[k]!.interest), mc: MC.compounds, say: `That is ${pct(bp)}% of the balance after year ${k - 1}: compound interest. Simple interest stays on ${$(P)}.` },
    { t: $(I * k), mc: undefined, say: `${$(I * k)} is the TOTAL after ${k} years. Year ${k} itself adds ${$(I)}.` },
  ]);
};

// ===================================================================================================================
// 12 simple-interest-formula
// ===================================================================================================================
const FORMULA_PAIRS: readonly [number, number, number][] = [[150000, 400, 3], [250000, 350, 4], [80000, 250, 6]];
function formulaCase(R: () => number): [number, number, number] {
  if (R() < 0.3) return pick(R, FORMULA_PAIRS);
  for (;;) {
    const P = dollars(pick(R, [2, 4, 5, 6, 8, 10, 12, 15, 20, 24, 25, 30, 40, 50, 60, 80, 100]) * 100), bp = pick(R, [200, 250, 300, 350, 400, 450, 500, 600]), t = int(R, 2, 10);
    if (exactCents(P, bp, t * 12) !== null && exactCents(P, bp) !== null) return [P, bp, t];
  }
}
const formulaI: Gen = (R, n) => {
  const [P, bp, t] = formulaCase(R), I = cents(P, bp, t * 12), y1 = cents(P, bp), name = pick(R, NAMES), loan = R() < 0.4;
  return numItem({
    id: `formulaI-${n}`, family: 'formulaI',
    prompt: loan ? `${name} takes a ${t}-year loan of ${A($(P))} at ${B(pct(bp) + '% simple interest per year')}, repaid in one payment at the end. How much interest is that in all?`
      : `${name} leaves ${A($(P))} in ${pick(R, SAVE)} for ${t} years at ${B(pct(bp) + '% simple interest per year')}. How much interest does it earn in all?`,
    board: `I = P \\times r \\times t`,
    solution: [`One year: ${rateDec(bp)} × ${$(P)} = ${$(y1)}. Every year adds the same.`, `I = P × r × t = ${$(P)} × ${rateDec(bp)} × ${t} = ${B($(I))}.`],
    picture: { tape: { P, bp, months: t * 12, loan }, pre: ['tape', 'whole', 'rows', 'y1'], post: [...Array.from({ length: t - 1 }, (_, i) => `y${i + 2}` as TapeStep), 'gain'], work: [`I = ${$T(P)} \\times ${rateDec(bp)} \\times ${t}`, `I = ${$T(I)}`] },
  }, I, moneyCheck(I, [
    { c: y1, mc: MC.omitsTime, say: `That is one year of interest. Multiply by the ${t} years: I = P × r × t.` },
    { c: P + I, say: `That is the ${loan ? 'total owed' : 'ending balance'}. The question asks for the interest only.` },
  ], `Yes: ${$(P)} × ${rateDec(bp)} × ${t} = ${$(I)}.`, `I = P × r × t, with r = ${rateDec(bp)} and t = ${t}.`));
};
const formulaTotal: Gen = (R, n) => {
  const [P, bp, t] = formulaCase(R), I = cents(P, bp, t * 12), y1 = cents(P, bp), name = pick(R, NAMES), loan = R() < 0.5;
  return numItem({
    id: `formulaTotal-${n}`, family: 'formulaTotal',
    prompt: loan ? `${name} borrows ${A($(P))} for ${t} years at ${B(pct(bp) + '% simple interest per year')}, all paid back at the end. What is the total amount owed?`
      : `${A($(P))} is saved for ${t} years at ${B(pct(bp) + '% simple interest per year')}. What is the ending balance?`,
    board: `${$T(P)} + I = \\$\\,?`,
    solution: [`I = ${$(P)} × ${rateDec(bp)} × ${t} = ${B($(I))}.`, `${loan ? 'Owed' : 'Balance'} = ${$(P)} + ${$(I)} = ${S($(P + I))}.`],
    picture: { tape: { P, bp, months: t * 12, loan }, pre: ['tape', 'whole', 'rows'], post: [...Array.from({ length: t }, (_, i) => `y${i + 1}` as TapeStep), 'gain'], work: [`I = ${$T(P)} \\times ${rateDec(bp)} \\times ${t} = ${$T(I)}`, `${$T(P)} + ${$T(I)} = ${$T(P + I)}`] },
  }, P + I, moneyCheck(P + I, [
    { c: I, mc: MC.changeFinal, say: `${$(I)} is the interest. The ${loan ? 'amount owed' : 'balance'} is the principal plus the interest.` },
    { c: P + y1, mc: MC.omitsTime, say: `That adds only one year of interest. There are ${t} years: ${t} × ${$(y1)}.` },
  ], `Yes: ${$(P)} + ${$(I)} = ${$(P + I)}.`, `Find I = P × r × t first, then add it to ${$(P)}.`));
};
const costOfCredit: Gen = (R, n) => {
  for (;;) {
    const P = dollars(pick(R, [1000, 2000, 2500, 4000, 5000, 6000, 8000, 10000])), name = pick(R, NAMES);
    const a = { bp: pick(R, [300, 350, 400, 450, 500, 600]), t: int(R, 2, 8) }, b = { bp: pick(R, [300, 350, 400, 450, 500, 600]), t: int(R, 2, 8) };
    if (a.bp === b.bp || a.t === b.t) continue;
    const Ia = exactCents(P, a.bp, a.t * 12), Ib = exactCents(P, b.bp, b.t * 12);
    if (Ia === null || Ib === null) continue;
    // the trap: the loan with the higher rate is NOT the costlier one (or the two cost the same)
    if (!((a.bp > b.bp && Ia <= Ib) || (b.bp > a.bp && Ib <= Ia))) continue;
    const right = Ia > Ib ? 'A' : Ib > Ia ? 'B' : 'same';
    const hiRate = a.bp > b.bp ? 'A' : 'B';
    return choiceItem(R, {
      id: `costOfCredit-${n}`, family: 'costOfCredit',
      prompt: `${name} can borrow ${A($(P))} two ways, simple interest, paid back at the end. Loan A: ${B(pct(a.bp) + '%')} per year for ${a.t} years. Loan B: ${B(pct(b.bp) + '%')} per year for ${b.t} years. Which costs more interest?`,
      board: `A:\\ ${pct(a.bp)}\\% \\times ${a.t}\\ \\ \\ B:\\ ${pct(b.bp)}\\% \\times ${b.t}`,
      solution: [`A: ${$(P)} × ${rateDec(a.bp)} × ${a.t} = ${$(Ia)}.`, `B: ${$(P)} × ${rateDec(b.bp)} × ${b.t} = ${$(Ib)}. ${right === 'same' ? 'They cost the same.' : `Loan ${right} costs more.`}`],
      picture: { pre: [], post: [], work: [`A:\\ I = ${$T(Ia)}`, `B:\\ I = ${$T(Ib)}`] },
    }, [
      { t: 'Loan A', ok: right === 'A', mc: right !== 'A' && hiRate === 'A' ? MC.omitsTime : undefined, say: right === 'A' ? `Yes: ${$(Ia)} against ${$(Ib)}.` : `The rate alone does not decide it; the years count too. A: ${$(Ia)}, B: ${$(Ib)}.` },
      { t: 'Loan B', ok: right === 'B', mc: right !== 'B' && hiRate === 'B' ? MC.omitsTime : undefined, say: right === 'B' ? `Yes: ${$(Ib)} against ${$(Ia)}.` : `The rate alone does not decide it; the years count too. A: ${$(Ia)}, B: ${$(Ib)}.` },
      { t: 'They cost the same', ok: right === 'same', say: right === 'same' ? `Yes: both ${$(Ia)}.` : `Work both out: A ${$(Ia)}, B ${$(Ib)}.` },
    ]);
  }
};

// ===================================================================================================================
// 13 fractional-years
// ===================================================================================================================
const MONTH_CASES: readonly [number, number, number][] = [[240000, 500, 6], [120000, 300, 9], [80000, 450, 18]];
function monthCase(R: () => number): [number, number, number] {
  if (R() < 0.3) return pick(R, MONTH_CASES);
  for (;;) {
    const P = dollars(pick(R, [400, 600, 800, 1000, 1200, 1600, 2000, 2400, 3000, 3600, 4000, 4800, 6000])), bp = pick(R, [200, 300, 400, 450, 500, 600, 800]), m = pick(R, [3, 6, 9, 18, 30, 15, 21]);
    if (exactCents(P, bp, m) !== null && exactCents(P, bp) !== null) return [P, bp, m];
  }
}
const monthsT: Gen = (R, n) => {
  const m = pick(R, [3, 6, 9, 18, 30, 15, 21]), name = pick(R, NAMES), bp = pick(R, [200, 300, 400, 500]), P = principal(R);
  const t = yearsDec(m);
  const opts: Opt[] = [
    { t: `t = ${t}`, ok: true, say: `Yes: ${m} months is ${m} ÷ 12 = ${t} of a year.` },
    { t: `t = ${m}`, mc: MC.units, say: `${m} is the number of MONTHS. The rate is per year, so t must be in years: ${m} ÷ 12.` },
  ];
  const tenths = decOf(m, 1);
  opts.push({ t: `t = ${tenths}`, mc: MC.units, say: `A year has 12 months, not 10. ${m} months = ${m} ÷ 12 = ${t} years.` });
  return choiceItem(R, {
    id: `monthsT-${n}`, family: 'monthsT',
    prompt: `${name} saves ${A($(P))} for ${m} months at ${B(pct(bp) + '% per year')}. In I = P × r × t, what is t?`,
    board: `${m}\\ \\text{months} = t\\ \\text{years}`,
    solution: [`The rate is per year, so t must be in years.`, `t = ${m} ÷ 12 = ${t} (that is ${yearsFracTex(m).replace(/\\tfrac\{(\d+)\}\{(\d+)\}/, '$1/$2')} of a year).`],
    picture: { tape: { P, bp, months: m }, pre: ['tape', 'whole', 'rows'], post: Array.from({ length: Math.ceil(m / 12) }, (_, i) => `y${i + 1}` as TapeStep), work: [`t = ${yearsFracTex(m)} = ${t}`] },
  }, opts);
};
const monthsI: Gen = (R, n) => {
  const [P, bp, m] = monthCase(R), I = cents(P, bp, m), y1 = cents(P, bp), name = pick(R, NAMES), loan = R() < 0.4, t = yearsDec(m);
  return numItem({
    id: `monthsI-${n}`, family: 'monthsI',
    prompt: loan ? `${name} borrows ${A($(P))} for ${m} months at ${B(pct(bp) + '% simple interest per year')}. How much interest is owed?`
      : `${name} keeps ${A($(P))} in ${pick(R, SAVE)} for ${m} months at ${B(pct(bp) + '% simple interest per year')}. How much interest does it earn?`,
    board: `I = ${$T(P)} \\times ${rateDec(bp)} \\times t`,
    solution: [`t in years: ${m} ÷ 12 = ${t}.`, `I = ${$(P)} × ${rateDec(bp)} × ${t} = ${B($(I))}.`],
    picture: { tape: { P, bp, months: m, loan }, pre: ['tape', 'whole', 'rows'], post: [...Array.from({ length: Math.ceil(m / 12) }, (_, i) => `y${i + 1}` as TapeStep), 'gain'], work: [`t = ${yearsFracTex(m)} = ${t}`, `I = ${$T(P)} \\times ${rateDec(bp)} \\times ${t} = ${$T(I)}`] },
  }, I, moneyCheck(I, [
    { c: y1 * m, mc: MC.units, say: `That uses t = ${m}, as if the rate were per month. t must be in years: ${t}.` },
    { c: y1 !== I ? y1 : -1, mc: MC.omitsTime, say: `That is one full year of interest. The money stays ${m} months: t = ${t}.` },
  ], `Yes: ${$(P)} × ${rateDec(bp)} × ${t} = ${$(I)}.`, `Write ${m} months as years first: ${m} ÷ 12.`));
};

// ===================================================================================================================
// 14 compound-year-by-year
// ===================================================================================================================
const compoundCell: Gen = (R, n) => {
  const [P, bp] = tablePair(R), years = pick(R, [2, 3, 3]), comp = schedule(P, bp, years, 'compound'), sim = schedule(P, bp, years, 'simple');
  const k = int(R, 2, years), ask = pick(R, ['bal', 'int'] as const);
  const ans = ask === 'bal' ? comp[k]!.balance : comp[k]!.interest;
  const rows = yearTable(comp);
  const shown = rows.map((r, i) => i < k ? r : i === k ? (ask === 'bal' ? [r[0]!, r[1]!, '?'] : [r[0]!, '?', '?']) : [r[0]!, '?', '?']);
  return numItem({
    id: `compoundCell-${n}`, family: 'compoundCell',
    prompt: `${A($(P))} earns ${B(pct(bp) + '% compound interest per year')}: each year’s interest is credited and left in the account. What is the ${ask === 'bal' ? 'balance' : 'interest'} in year ${k}? (calculator allowed)`,
    board: `${$T(P)},\\ ${pct(bp)}\\%\\ \\text{compound}`,
    solution: [`Compound: year ${k}’s interest is ${pct(bp)}% of the balance after year ${k - 1}, ${$(comp[k - 1]!.balance)}: ${B($(comp[k]!.interest))}.`, `Balance: ${$(comp[k - 1]!.balance)} + ${$(comp[k]!.interest)} = ${S($(comp[k]!.balance))}.`],
    picture: { tape: { P, bp, years, rule: 'compound' }, pre: ['tape', 'whole', ...Array.from({ length: k - 1 }, (_, i) => `y${i + 1}` as TapeStep)], post: Array.from({ length: years - k + 1 }, (_, i) => `y${k + i}` as TapeStep), rings: [{ row: k - 1, at: 'row' }], table: { head: HEAD, rows: shown, solved: rows }, work: [] },
  }, ans, moneyCheck(ans, [
    { c: ask === 'bal' ? sim[k]!.balance : sim[k]!.interest, mc: MC.successive, say: `That takes ${pct(bp)}% of the original ${$(P)} again (simple). Compound takes it of the LATEST balance, ${$(comp[k - 1]!.balance)}.` },
    { c: ask === 'int' ? comp[k]!.balance : -1, say: 'That is the balance; the interest is what the year added.' },
  ], `Yes: ${$(ans)}.`, `Take ${pct(bp)}% of the balance after year ${k - 1}.`));
};
const compoundBase: Gen = (R, n) => {
  const [P, bp] = tablePair(R), comp = schedule(P, bp, 3, 'compound'), k = pick(R, [2, 3]), name = pick(R, NAMES);
  return choiceItem(R, {
    id: `compoundBase-${n}`, family: 'compoundBase',
    prompt: `${name}’s ${A($(P))} earns ${B(pct(bp) + '% compound interest per year')}. The balance after year ${k - 1} is ${S($(comp[k - 1]!.balance))}. In year ${k}, ${pct(bp)}% is taken of which amount?`,
    board: `\\text{year}\\ ${k}:\\ ${pct(bp)}\\%\\ \\text{of}\\ \\,?`,
    solution: [`Compound: the interest is left in, so the newest balance is the base.`, `Year ${k}: ${pct(bp)}% of ${$(comp[k - 1]!.balance)} = ${B($(comp[k]!.interest))}.`],
    picture: { tape: { P, bp, years: k, rule: 'compound' }, pre: ['tape', 'whole', ...Array.from({ length: k - 1 }, (_, i) => `y${i + 1}` as TapeStep)], post: [`y${k}`], rings: [{ row: k - 1, at: 'row' }], work: [`${pct(bp)}\\% \\times ${$T(comp[k - 1]!.balance)} = ${$T(comp[k]!.interest)}`] },
  }, [
    { t: $(comp[k - 1]!.balance), ok: true, say: 'Yes: the latest balance, interest included. Interest earns interest.' },
    { t: $(P), mc: MC.successive, say: `${$(P)} is the base for SIMPLE interest. Compound takes the percent of the latest balance.` },
    { t: $(comp[k - 1]!.interest), say: `${$(comp[k - 1]!.interest)} is last year’s interest, not the base.` },
  ]);
};

// ===================================================================================================================
// 15 compare-simple-compound
// ===================================================================================================================
const ruleFromTable: Gen = (R, n) => {
  const [P, bp] = tablePair(R), years = pick(R, [1, 2, 3]), rule = pick(R, ['simple', 'compound'] as const);
  const s = schedule(P, bp, years, rule), name = pick(R, NAMES);
  const right = years === 1 ? 'cant' : rule;
  const rows = s.map(r => [String(r.year), r.year === 0 ? '' : $T(r.interest), $T(r.balance)]);
  return choiceItem(R, {
    id: `ruleFromTable-${n}`, family: 'ruleFromTable',
    prompt: `${name}’s account started with ${A($(P))} at ${B(pct(bp) + '% per year')}. The table shows ${years === 1 ? 'the first year' : `the first ${years} years`}. Simple or compound interest?`,
    board: `${$T(P)},\\ ${pct(bp)}\\%:\\ \\text{simple or compound?}`,
    solution: years === 1 ? [`After year 1 both rules give ${$(s[1]!.balance)}: both take ${pct(bp)}% of ${$(P)}.`, 'One year of data cannot tell them apart.']
      : [`Look at the interest column: ${s.slice(1).map(r => $(r.interest)).join(', ')}.`, rule === 'simple' ? 'The same every year: simple interest on the principal.' : 'Growing every year: interest on the latest balance, compound.'],
    picture: { pre: [], post: [], table: { head: HEAD, rows }, work: [] },
  }, [
    { t: 'Simple interest', ok: right === 'simple', mc: years === 1 ? MC.differYear1 : undefined, say: right === 'simple' ? 'Yes: the same interest every year.' : years === 1 ? 'After one year both rules give the same balance. You can’t tell yet.' : 'The interest grows each year: that is compound.' },
    { t: 'Compound interest', ok: right === 'compound', mc: years === 1 ? MC.differYear1 : undefined, say: right === 'compound' ? 'Yes: each year’s interest is bigger, because it is taken of a bigger balance.' : years === 1 ? 'After one year both rules give the same balance. You can’t tell yet.' : 'The interest is the same every year: that is simple.' },
    { t: 'You can’t tell from this table', ok: right === 'cant', say: right === 'cant' ? 'Right: in year 1 both rules take the percent of the same principal.' : 'You can: compare the interest column from year to year.' },
  ]);
};
const gapGrows: Gen = (R, n) => {
  const [P, bp] = tablePair(R), s = schedule(P, bp, 3, 'simple'), c = schedule(P, bp, 3, 'compound');
  const g2 = c[2]!.balance - s[2]!.balance, g3 = c[3]!.balance - s[3]!.balance;
  return numItem({
    id: `gapGrows-${n}`, family: 'gapGrows',
    prompt: `${pick(R, NAMES)} compares two accounts for ${A($(P))} at ${B(pct(bp) + '% per year')}: simple gives ${$(s[3]!.balance)} after 3 years, compound gives ${$(c[3]!.balance)}. After 2 years the gap was ${$(g2)}. What is the gap after 3 years?`,
    board: `\\text{gap:}\\ \\ 0,\\ ${$T(g2)},\\ \\,?`,
    solution: [`Gap after 3 years: ${$(c[3]!.balance)} − ${$(s[3]!.balance)} = ${$(g3)}.`, `It grows: the compound account earns interest on its earlier interest too.`],
    picture: { tape: { P, bp, years: 3 }, pre: ['tape', 'whole', 'y1', 'y2', 'y3'], post: [], table: { head: ['year', '\\text{simple}', '\\text{compound}'], rows: s.map((r, i) => [String(i), $T(r.balance), $T(c[i]!.balance)]) }, work: [] },
  }, g3, moneyCheck(g3, [
    { c: g2, mc: MC.gapSmall, say: `The gap does not stay ${$(g2)}: ${$(c[3]!.balance)} − ${$(s[3]!.balance)} = ${$(g3)}. It keeps growing.` },
    { c: g2 * 2, say: `It grows faster than that: subtract the two year-3 balances.` },
  ], `Yes: ${$(g3)}, and it keeps growing.`, 'Subtract the two year-3 balances.'));
};
const saverBorrower: Gen = (R, n) => {
  const [P, bp] = tablePair(R), s = schedule(P, bp, 3, 'simple'), c = schedule(P, bp, 3, 'compound'), name = pick(R, NAMES);
  const borrow = R() < 0.6;
  return choiceItem(R, {
    id: `saverBorrower-${n}`, family: 'saverBorrower',
    prompt: borrow ? `${name} borrows ${A($(P))} for 3 years at ${B(pct(bp) + '% per year')}, all repaid at the end. Simple: owes ${$(s[3]!.balance)}. Compound: owes ${$(c[3]!.balance)}. Which rule is better for ${name}?`
      : `${name} saves ${A($(P))} for 3 years at ${B(pct(bp) + '% per year')}. Simple: ${$(s[3]!.balance)}. Compound: ${$(c[3]!.balance)}. Which rule is better for ${name}?`,
    board: `${$T(s[3]!.balance)}\\ \\text{vs}\\ ${$T(c[3]!.balance)}`,
    solution: [`Compound grows faster: ${$(c[3]!.balance - s[3]!.balance)} more after 3 years.`, borrow ? `A borrower PAYS that: simple is better for ${name}.` : `A saver GETS that: compound is better for ${name}.`],
    picture: { pre: [], post: [], table: { head: ['year', '\\text{simple}', '\\text{compound}'], rows: s.map((r, i) => [String(i), $T(r.balance), $T(c[i]!.balance)]) }, work: [] },
  }, [
    { t: 'Simple interest', ok: borrow, say: borrow ? `Yes: ${name} owes less, ${$(s[3]!.balance)}.` : 'A saver wants MORE: compound gives more.' },
    { t: 'Compound interest', ok: !borrow, mc: borrow ? MC.compoundBetter : undefined, say: !borrow ? `Yes: ${name} ends with ${$(c[3]!.balance)}.` : `Compound makes the amount grow faster, and a borrower has to PAY it: ${$(c[3]!.balance)}.` },
    { t: 'No difference', mc: MC.gapSmall, say: `They differ by ${$(c[3]!.balance - s[3]!.balance)} after 3 years, and the gap keeps growing.` },
  ]);
};

// ===================================================================================================================
export const GENERATORS: Record<string, Gen> = {
  whoIsP, findP, per100, rateVsDollars, periodTrap, oneYearUnit, loanRoles, earnOrOwe, oneYear, fromTen,
  decInterest, pctToDec, endBalance, labelBoth, multExpr, multValue, roundI, roundRule, spotError, estimate,
  tableCell, sameEach, formulaI, formulaTotal, costOfCredit, monthsT, monthsI, compoundCell, compoundBase,
  ruleFromTable, gapGrows, saverBorrower,
};
export const FAMILY_NAMES: Record<string, string> = {
  whoIsP: 'Which is the principal?', findP: 'Read the principal', per100: 'Per $100', rateVsDollars: 'Rate or dollars?',
  periodTrap: 'Per year, one year', oneYearUnit: 'Match the time', loanRoles: 'Loans', earnOrOwe: 'Earn or owe',
  oneYear: 'One year of interest', fromTen: 'Start from 10%', decInterest: 'Decimal rates', pctToDec: 'Percent to decimal',
  endBalance: 'The ending balance', labelBoth: 'Interest and balance', multExpr: 'One-step expression', multValue: 'The multiplier 1 + r',
  roundI: 'Round to the cent', roundRule: 'Round once', spotError: 'Spot the slip', estimate: 'Is it reasonable?',
  tableCell: 'Year-by-year table', sameEach: 'Same every year', formulaI: 'I = P × r × t', formulaTotal: 'The total at the end',
  costOfCredit: 'Cost of a loan', monthsT: 'Months as years', monthsI: 'Interest for months', compoundCell: 'Compound, year by year',
  compoundBase: 'Interest on interest', ruleFromTable: 'Simple or compound?', gapGrows: 'The growing gap', saverBorrower: 'Saver or borrower?',
};
