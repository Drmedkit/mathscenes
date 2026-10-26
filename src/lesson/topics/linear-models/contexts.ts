// contexts.ts: the situations of "Linear equations from a context": each one a real constant-rate story (a fee plus
// a rate, a tank that drains, a gift card that pays), with its two quantities named (letter, words, unit, what input
// 0 means), whether the input is counted (whole numbers) or measured, and realistic numbers. Pure: no DOM.
import { int, pick } from '../../runtime/item';
import { money } from './modelPic';
import { nH } from '../linear-functions-slope/lineMaths';

export interface Ctx {
  key: string;
  /** letters of the input and the output */ x: string; y: string;
  /** the input in words (plural: "games played"), one unit / many units of it ("game" / "games") */ xw: string; one: string; many: string;
  /** the output in words ("total cost") and its unit: 'money', '%' or a word ("gallons") */ yw: string; unit: string;
  m: number; b: number;
  /** whole numbers only (a count, or a stated billing rule) */ discrete: boolean;
  /** the story sentence that states the start and the rate (in either order) */ story: string;
  /** what input 0 means */ zero: string;
  /** the start in words ("the card itself costs $3") and the rate in words ("each game adds $2.50") */ startW: string; rateW: string;
  /** what makes the model stop (for a decreasing story: it runs out) */ stop?: string;
}
const I = (s: string) => `<i>${s}</i>`;
export const vH = I;

/** an output value with its unit */
export function out(C: Ctx, v: number): string { return C.unit === 'money' ? money(v) : C.unit === '%' ? `${nH(v)}%` : `${nH(v)} ${C.unit}`; }
/** the output unit as a word */
export const outU = (C: Ctx): string => (C.unit === 'money' ? 'dollars' : C.unit === '%' ? 'percent' : C.unit);
/** an input amount with its unit ("1 game", "2.5 hours") */
export const cnt = (C: Ctx, v: number): string => `${nH(v)} ${Math.abs(v) === 1 ? C.one : C.many}`;
/** the unit of the rate ("dollars per game") */
export const rateU = (C: Ctx): string => `${outU(C)} per ${C.one}`;
/** the rate as an amount per unit ("$2.50 per game", "4 gallons per minute") */
export const rateAmt = (C: Ctx, v = C.m): string => `${out(C, Math.abs(v))} per ${C.one}`;

type Maker = (R: () => number) => Ctx;
const either = (R: () => number, a: string, b: string) => (R() < 0.5 ? a : b);

// ---------- increasing: a start plus a rate ----------
export const INC: Record<string, Maker> = {
  arcade: R => { const b = pick(R, [2, 3, 4, 5]), m = pick(R, [1.25, 1.5, 2, 2.5, 3]); return { key: 'arcade', x: 'g', y: 'C', xw: 'games played', one: 'game', many: 'games', yw: 'total cost', unit: 'money', m, b, discrete: true,
    story: either(R, `An arcade card costs ${money(b)}, and each game on it costs ${money(m)}.`, `Each arcade game costs ${money(m)}, and the card you play them on costs ${money(b)}.`),
    zero: 'the card is bought, before any game', startW: `the card itself costs ${money(b)}`, rateW: `each game adds ${money(m)}` }; },
  ride: R => { const b = pick(R, [2.5, 3, 3.5, 4]), m = pick(R, [1.25, 1.5, 1.75, 2]); return { key: 'ride', x: 'd', y: 'C', xw: 'miles driven', one: 'mile', many: 'miles', yw: 'fare', unit: 'money', m, b, discrete: false,
    story: either(R, `A rideshare charges a ${money(b)} pickup fee plus ${money(m)} per mile.`, `A rideshare charges ${money(m)} per mile plus a ${money(b)} pickup fee.`),
    zero: 'the pickup, before any miles', startW: `the pickup fee is ${money(b)}`, rateW: `each mile adds ${money(m)}` }; },
  gym: R => { const b = pick(R, [25, 30, 40, 50]), m = pick(R, [15, 20, 25, 30, 35]); return { key: 'gym', x: 'n', y: 'C', xw: 'months of membership', one: 'month', many: 'months', yw: 'total paid', unit: 'money', m, b, discrete: true,
    story: either(R, `A gym charges a ${money(b)} sign-up fee plus ${money(m)} per month.`, `A gym charges ${money(m)} per month, after a ${money(b)} sign-up fee.`),
    zero: 'signing up, before the first month', startW: `the sign-up fee is ${money(b)}`, rateW: `each month adds ${money(m)}` }; },
  plumber: R => { const b = pick(R, [45, 60, 75, 90]), m = pick(R, [40, 55, 65, 70, 85]); return { key: 'plumber', x: 'h', y: 'C', xw: 'hours of work', one: 'hour', many: 'hours', yw: 'bill', unit: 'money', m, b, discrete: false,
    story: either(R, `A plumber charges ${money(b)} to come out plus ${money(m)} per hour of work.`, `A plumber charges ${money(m)} per hour of work, plus ${money(b)} to come out.`),
    zero: 'the plumber arrives, before any work', startW: `coming out costs ${money(b)}`, rateW: `each hour adds ${money(m)}` }; },
  posters: R => { const b = pick(R, [8, 10, 12, 15]), m = pick(R, [0.5, 0.75, 1.25, 1.5]); return { key: 'posters', x: 'p', y: 'C', xw: 'posters printed', one: 'poster', many: 'posters', yw: 'cost of the order', unit: 'money', m, b, discrete: true,
    story: either(R, `A print shop charges a ${money(b)} setup fee plus ${money(m)} per poster.`, `A print shop charges ${money(m)} per poster plus a ${money(b)} setup fee.`),
    zero: 'the setup, before any poster', startW: `the setup fee is ${money(b)}`, rateW: `each poster adds ${money(m)}` }; },
  tickets: R => { const b = pick(R, [5, 6, 8, 9]), m = pick(R, [24, 28, 32, 45]); return { key: 'tickets', x: 't', y: 'C', xw: 'tickets bought', one: 'ticket', many: 'tickets', yw: 'order total', unit: 'money', m, b, discrete: true,
    story: either(R, `Concert tickets cost ${money(m)} each, plus a ${money(b)} fee per order.`, `A concert order has a ${money(b)} fee, plus ${money(m)} per ticket.`),
    zero: 'an order with no tickets yet', startW: `the order fee is ${money(b)}`, rateW: `each ticket adds ${money(m)}` }; },
  savings: R => { const b = pick(R, [40, 60, 85, 120, 150]), m = pick(R, [15, 20, 25, 30]); return { key: 'savings', x: 'w', y: 'S', xw: 'weeks of saving', one: 'week', many: 'weeks', yw: 'savings', unit: 'money', m, b, discrete: true,
    story: either(R, `Jae has ${money(b)} saved and adds ${money(m)} every week.`, `Jae adds ${money(m)} to savings every week, starting from ${money(b)}.`),
    zero: 'today, before any week of saving', startW: `Jae starts with ${money(b)}`, rateW: `each week adds ${money(m)}` }; },
  kayak: R => { const b = pick(R, [10, 15, 20]), m = pick(R, [8, 12, 16]); return { key: 'kayak', x: 'h', y: 'C', xw: 'hours on the water', one: 'hour', many: 'hours', yw: 'rental cost', unit: 'money', m, b, discrete: false,
    story: either(R, `A kayak rental costs ${money(b)} plus ${money(m)} per hour, charged by the minute.`, `A kayak rental costs ${money(m)} per hour, charged by the minute, plus ${money(b)} for the gear.`),
    zero: 'you pick up the kayak', startW: `the base charge is ${money(b)}`, rateW: `each hour adds ${money(m)}` }; },
  pool: R => { const b = pick(R, [150, 200, 300, 400]), m = pick(R, [8, 9, 10, 12]); return { key: 'pool', x: 't', y: 'V', xw: 'minutes of filling', one: 'minute', many: 'minutes', yw: 'water in the pool', unit: 'gallons', m, b, discrete: false,
    story: either(R, `A pool already holds ${b} gallons, and a hose adds ${m} gallons per minute.`, `A hose adds ${m} gallons per minute to a pool that already holds ${b} gallons.`),
    zero: 'the hose is turned on', startW: `the pool holds ${b} gallons at the start`, rateW: `each minute adds ${m} gallons` }; },
  plant: R => { const b = pick(R, [4, 5, 6, 8]), m = pick(R, [1.5, 2, 2.5, 3]); return { key: 'plant', x: 'w', y: 'h', xw: 'weeks of growth', one: 'week', many: 'weeks', yw: 'height', unit: 'cm', m, b, discrete: false,
    story: either(R, `A bean plant is ${b} cm tall and grows ${nH(m)} cm per week.`, `A bean plant grows ${nH(m)} cm per week; today it is ${b} cm tall.`),
    zero: 'today, when it is measured', startW: `the plant is ${b} cm tall today`, rateW: `each week adds ${nH(m)} cm` }; },
};
// ---------- decreasing: a start that runs down ----------
export const DEC: Record<string, Maker> = {
  tank: R => { const r = pick(R, [2, 3, 4, 5, 6]), b = r * int(R, 8, 20); return { key: 'tank', x: 't', y: 'V', xw: 'minutes of draining', one: 'minute', many: 'minutes', yw: 'water left', unit: 'gallons', m: -r, b, discrete: false,
    story: either(R, `A ${b}-gallon tank starts full and drains ${r} gallons per minute.`, `A tank drains ${r} gallons per minute; it starts full, with ${b} gallons.`),
    zero: 'the drain is opened', startW: `the tank holds ${b} gallons at the start`, rateW: `each minute takes away ${r} gallons`, stop: 'the tank is empty' }; },
  card: R => { const b = pick(R, [50, 60, 75, 100]), r = pick(R, [4.5, 5, 6, 6.5]); return { key: 'card', x: 's', y: 'B', xw: 'smoothies bought', one: 'smoothie', many: 'smoothies', yw: 'card balance', unit: 'money', m: -r, b, discrete: true,
    story: either(R, `A ${money(b)} gift card pays for smoothies that cost ${money(r)} each.`, `Smoothies cost ${money(r)} each, paid with a ${money(b)} gift card.`),
    zero: 'the card is new', startW: `the card starts with ${money(b)}`, rateW: `each smoothie takes away ${money(r)}`, stop: 'the card cannot pay for another smoothie' }; },
  candle: R => { const r = pick(R, [0.5, 0.75, 1.25]), b = r === 0.75 ? pick(R, [12, 15]) : pick(R, [8, 10, 12, 15]); return { key: 'candle', x: 'h', y: 'L', xw: 'hours of burning', one: 'hour', many: 'hours', yw: 'candle height', unit: 'inches', m: -r, b, discrete: false,
    story: either(R, `A ${b}-inch candle burns down ${nH(r)} inch${r === 1 ? '' : 'es'} per hour.`, `A candle burns down ${nH(r)} inch${r === 1 ? '' : 'es'} per hour; it starts ${b} inches tall.`),
    zero: 'the candle is lit', startW: `the candle is ${b} inches tall when lit`, rateW: `each hour takes away ${nH(r)} inch${r === 1 ? '' : 'es'}`, stop: 'the candle has burned down' }; },
  battery: R => { const r = pick(R, [4, 5, 8, 10]); return { key: 'battery', x: 'h', y: 'P', xw: 'hours of video', one: 'hour', many: 'hours', yw: 'battery charge', unit: '%', m: -r, b: 100, discrete: false,
    story: either(R, `A phone starts at 100% and loses ${r}% per hour of video.`, `Video drains a phone ${r}% per hour; it starts fully charged at 100%.`),
    zero: 'the video starts', startW: 'the phone starts at 100%', rateW: `each hour takes away ${r}%`, stop: 'the battery is empty' }; },
  trip: R => { const r = pick(R, [50, 55, 60, 65]), b = r * int(R, 4, 7); return { key: 'trip', x: 'h', y: 'D', xw: 'hours of driving', one: 'hour', many: 'hours', yw: 'distance left', unit: 'miles', m: -r, b, discrete: false,
    story: either(R, `A family is ${b} miles from the beach and drives at ${r} miles per hour.`, `Driving at ${r} miles per hour, a family sets off ${b} miles from the beach.`),
    zero: 'they set off', startW: `they start ${b} miles away`, rateW: `each hour takes away ${r} miles`, stop: 'they reach the beach' }; },
  loan: R => { const r = pick(R, [50, 75, 100, 125]), b = r * int(R, 8, 16); return { key: 'loan', x: 'n', y: 'B', xw: 'monthly payments made', one: 'payment', many: 'payments', yw: 'amount owed', unit: 'money', m: -r, b, discrete: true,
    story: either(R, `A ${money(b)} phone loan is paid off at ${money(r)} per month.`, `Each month ${money(r)} goes toward a ${money(b)} phone loan.`),
    zero: 'the loan starts, before any payment', startW: `the loan starts at ${money(b)}`, rateW: `each payment takes away ${money(r)}`, stop: 'the loan is paid off' }; },
};
/** a context whose start and rate are different numbers (C = 3g + 3 would make the rate and the start indistinguishable) */
function distinct(R: () => number, make: () => Ctx): Ctx { for (let i = 0; ; i++) { const C = make(); if (Math.abs(C.m) !== C.b || i > 50) return C; } }
export const incCtx = (R: () => number, keys?: readonly string[]): Ctx => distinct(R, () => INC[pick(R, keys ?? Object.keys(INC))]!(R));
export const decCtx = (R: () => number, keys?: readonly string[]): Ctx => distinct(R, () => DEC[pick(R, keys ?? Object.keys(DEC))]!(R));
export const anyCtx = (R: () => number): Ctx => (R() < 0.5 ? incCtx(R) : decCtx(R));

// ---------- the model written out ----------
const num = (v: number) => nH(Math.abs(v));
/** mx + b in HTML (1x → x, + −3 → − 3), the rate term first */
export function exprH(m: number, b: number, x: string): string {
  const t = m === 0 ? '' : `${m < 0 ? '−' : ''}${Math.abs(m) === 1 ? '' : num(m)}${I(x)}`;
  if (!t) return nH(b);
  return b === 0 ? t : `${t} ${b < 0 ? '−' : '+'} ${num(b)}`;
}
export function exprT(m: number, b: number, x: string): string {
  const t = m === 0 ? '' : `${m < 0 ? '-' : ''}${Math.abs(m) === 1 ? '' : num(m)}${x}`;
  if (!t) return String(b);
  return b === 0 ? t : `${t} ${b < 0 ? '-' : '+'} ${num(b)}`;
}
/** b + mx / b − |m|x (the start first, the way a decreasing story is usually written) */
export const startFirstH = (m: number, b: number, x: string) => (m === 0 ? nH(b) : `${nH(b)} ${m < 0 ? '−' : '+'} ${Math.abs(m) === 1 ? '' : num(m)}${I(x)}`);
export const startFirstT = (m: number, b: number, x: string) => (m === 0 ? String(b) : `${b} ${m < 0 ? '-' : '+'} ${Math.abs(m) === 1 ? '' : num(m)}${x}`);
/** the model as people write it: decreasing stories start first (V = 60 − 4t), the others rate first (C = 2.5g + 3) */
export const modelH = (C: Ctx) => `${I(C.y)} = ${C.m < 0 ? startFirstH(C.m, C.b, C.x) : exprH(C.m, C.b, C.x)}`;
export const modelT = (C: Ctx) => `${C.y} = ${C.m < 0 ? startFirstT(C.m, C.b, C.x) : exprT(C.m, C.b, C.x)}`;
/** the model with its variables defined in words */
export const defined = (C: Ctx) => `${modelH(C)}, where ${I(C.y)} is the ${C.yw} (${outU(C)}) and ${I(C.x)} is the number of ${C.xw}`;
export const at = (C: Ctx, x: number) => Math.round((C.m * x + C.b) * 1e6) / 1e6;
