// cp.ts: the exact maths and the seeded data of "Conditional probability and independence".
//   dice     the 36 ordered outcomes of a red and a blue die, events on them (sum, doubles, one die ...)
//   lists    events on the whole numbers 1..N (even, multiple of 3, prime ...)
//   tables   high-school survey contexts with the words every sentence needs, and count tables with margins:
//            general (all cells and margins distinct), exactly independent, or close to independent
//   venn     region counts / probabilities of two events
// Pure: no DOM, no canvas.
import { int, pick, shuffle, gcd } from '../../runtime/item';

// ===================== dice =====================
export interface DEv { t: string; /** short label for the picture */ s: string; f: (r: number, b: number) => boolean }
export const DIE = [1, 2, 3, 4, 5, 6] as const;
export const OUTCOMES: [number, number][] = DIE.flatMap(r => DIE.map(b => [r, b] as [number, number]));
export const countD = (f: (r: number, b: number) => boolean): number => OUTCOMES.filter(([r, b]) => f(r, b)).length;
export const cellsOf = (f: (r: number, b: number) => boolean): [number, number][] => OUTCOMES.filter(([r, b]) => f(r, b)).map(([r, b]) => [r - 1, b - 1]);
/** a random event on two dice */
export function diceEvent(R: () => number, kinds = 'sum,atleast,atmost,doubles,parity,face,greater,six,diff'): DEv {
  const k = pick(R, kinds.split(','));
  switch (k) {
    case 'sum': { const s = int(R, 4, 10); return { t: `the sum is ${s}`, s: `sum ${s}`, f: (r, b) => r + b === s }; }
    case 'atleast': { const s = int(R, 8, 10); return { t: `the sum is at least ${s}`, s: `sum ≥ ${s}`, f: (r, b) => r + b >= s }; }
    case 'atmost': { const s = int(R, 4, 6); return { t: `the sum is at most ${s}`, s: `sum ≤ ${s}`, f: (r, b) => r + b <= s }; }
    case 'doubles': return { t: 'the roll is a double (both dice the same)', s: 'doubles', f: (r, b) => r === b };
    case 'parity': { const ev = R() < 0.5, red = R() < 0.5; return { t: `the ${red ? 'red' : 'blue'} die is ${ev ? 'even' : 'odd'}`, s: `${red ? 'red' : 'blue'} ${ev ? 'even' : 'odd'}`, f: (r, b) => ((red ? r : b) % 2 === 0) === ev }; }
    case 'face': { const v = int(R, 1, 6), red = R() < 0.5; return { t: `the ${red ? 'red' : 'blue'} die shows ${v}`, s: `${red ? 'red' : 'blue'} = ${v}`, f: (r, b) => (red ? r : b) === v }; }
    case 'greater': { const v = int(R, 2, 4), red = R() < 0.5; return { t: `the ${red ? 'red' : 'blue'} die is greater than ${v}`, s: `${red ? 'red' : 'blue'} > ${v}`, f: (r, b) => (red ? r : b) > v }; }
    case 'six': return { t: 'at least one die shows 6', s: 'a 6', f: (r, b) => r === 6 || b === 6 };
    default: { const d = int(R, 1, 3); return { t: `the two dice differ by ${d}`, s: `differ by ${d}`, f: (r, b) => Math.abs(r - b) === d }; }
  }
}
export const sameEvent = (a: DEv, b: DEv): boolean => OUTCOMES.every(([r, bb]) => a.f(r, bb) === b.f(r, bb));

// ===================== whole numbers 1..N =====================
export interface NEv { t: string; s: string; f: (x: number) => boolean }
const isPrime = (x: number) => x > 1 && [2, 3, 5, 7, 11, 13, 17, 19].every(p => p === x || x % p !== 0);
export function numEvent(R: () => number, N: number, kinds = 'even,odd,m3,m4,m5,prime,square,gt,lt'): NEv {
  const k = pick(R, kinds.split(','));
  switch (k) {
    case 'even': return { t: 'the number is even', s: 'even', f: x => x % 2 === 0 };
    case 'odd': return { t: 'the number is odd', s: 'odd', f: x => x % 2 === 1 };
    case 'm3': return { t: 'the number is a multiple of 3', s: 'multiple of 3', f: x => x % 3 === 0 };
    case 'm4': return { t: 'the number is a multiple of 4', s: 'multiple of 4', f: x => x % 4 === 0 };
    case 'm5': return { t: 'the number is a multiple of 5', s: 'multiple of 5', f: x => x % 5 === 0 };
    case 'prime': return { t: 'the number is prime', s: 'prime', f: isPrime };
    case 'square': return { t: 'the number is a perfect square', s: 'square', f: x => Number.isInteger(Math.sqrt(x)) };
    case 'gt': { const v = int(R, Math.floor(N / 2), N - 3); return { t: `the number is greater than ${v}`, s: `> ${v}`, f: x => x > v }; }
    default: { const v = int(R, 4, Math.ceil(N / 2)); return { t: `the number is less than ${v}`, s: `< ${v}`, f: x => x < v }; }
  }
}
export const range = (N: number): number[] => Array.from({ length: N }, (_, i) => i + 1);

// ===================== survey contexts =====================
/** a category: table label, the group noun ("juniors with a job"), plural verb phrase, singular verb phrase */
export interface Cat { label: string; group: string; has: string; one: string }
export interface Ctx { who: string; one: string; rows: Cat[]; cols: Cat[]; place: string }
const c = (label: string, group: string, has: string, one: string): Cat => ({ label, group, has, one });
export const CTX2: readonly Ctx[] = [
  { who: 'juniors', one: 'junior', place: 'A high school surveyed its juniors',
    rows: [c('Job', 'juniors with a job', 'have a part-time job', 'has a part-time job'), c('No job', 'juniors without a job', 'have no job', 'has no job')],
    cols: [c('License', 'juniors with a license', 'have a driver’s license', 'has a driver’s license'), c('No license', 'juniors without a license', 'have no license', 'has no license')] },
  { who: 'seniors', one: 'senior', place: 'A class survey asked seniors',
    rows: [c('Varsity', 'varsity athletes', 'play a varsity sport', 'plays a varsity sport'), c('Not varsity', 'seniors not on a varsity team', 'don’t play a varsity sport', 'doesn’t play a varsity sport')],
    cols: [c('Honor roll', 'honor-roll students', 'are on the honor roll', 'is on the honor roll'), c('Not on it', 'seniors not on the honor roll', 'are not on the honor roll', 'is not on the honor roll')] },
  { who: 'students', one: 'student', place: 'A school surveyed students',
    rows: [c('Band', 'band members', 'are in the band', 'is in the band'), c('No band', 'students not in the band', 'are not in the band', 'is not in the band')],
    cols: [c('Sport', 'athletes', 'play a sport', 'plays a sport'), c('No sport', 'students who play no sport', 'play no sport', 'plays no sport')] },
  { who: 'employees', one: 'employee', place: 'A company tracked its employees over one winter',
    rows: [c('Flu shot', 'employees who got a flu shot', 'got a flu shot', 'got a flu shot'), c('No shot', 'employees with no flu shot', 'got no flu shot', 'got no flu shot')],
    cols: [c('Got flu', 'employees who got the flu', 'got the flu', 'got the flu'), c('No flu', 'employees who stayed well', 'did not get the flu', 'did not get the flu')] },
  { who: 'students', one: 'student', place: 'A school surveyed students',
    rows: [c('AP class', 'students taking an AP class', 'take an AP class', 'takes an AP class'), c('No AP', 'students taking no AP class', 'take no AP class', 'takes no AP class')],
    cols: [c('Job', 'students with a job', 'have a part-time job', 'has a part-time job'), c('No job', 'students without a job', 'have no job', 'has no job')] },
  { who: 'adults', one: 'adult', place: 'A health survey asked adults',
    rows: [c('Coffee', 'daily coffee drinkers', 'drink coffee daily', 'drinks coffee daily'), c('No coffee', 'adults who skip coffee', 'don’t drink coffee daily', 'doesn’t drink coffee daily')],
    cols: [c('7+ hours', 'adults who sleep 7+ hours', 'sleep at least 7 hours', 'sleeps at least 7 hours'), c('Under 7', 'adults who sleep under 7 hours', 'sleep under 7 hours', 'sleeps under 7 hours')] },
  { who: 'students', one: 'student', place: 'A school counted first-period arrivals for one week',
    rows: [c('Breakfast', 'breakfast eaters', 'eat breakfast', 'eats breakfast'), c('No breakfast', 'students who skip breakfast', 'skip breakfast', 'skips breakfast')],
    cols: [c('On time', 'on-time students', 'were on time', 'was on time'), c('Late', 'late students', 'were late', 'was late')] },
  { who: 'gym members', one: 'member', place: 'A gym surveyed its members',
    rows: [c('Mornings', 'morning members', 'work out in the morning', 'works out in the morning'), c('Evenings', 'evening members', 'work out in the evening', 'works out in the evening')],
    cols: [c('Class', 'members who take a class', 'take a fitness class', 'takes a fitness class'), c('No class', 'members who take no class', 'take no class', 'takes no class')] },
];
export const CTX23: readonly Ctx[] = [
  { who: 'students', one: 'student', place: 'A school surveyed students',
    rows: [c('Grade 10', 'tenth graders', 'are in tenth grade', 'is in tenth grade'), c('Grade 11', 'eleventh graders', 'are in eleventh grade', 'is in eleventh grade')],
    cols: [c('Bus', 'bus riders', 'ride the bus', 'rides the bus'), c('Car', 'students who come by car', 'come by car', 'comes by car'), c('Walk', 'walkers', 'walk to school', 'walks to school')] },
  { who: 'voters', one: 'voter', place: 'An exit poll asked voters about a park measure',
    rows: [c('Yes', 'yes voters', 'voted yes', 'voted yes'), c('No', 'no voters', 'voted no', 'voted no')],
    cols: [c('18–29', 'voters aged 18 to 29', 'are 18 to 29', 'is 18 to 29'), c('30–49', 'voters aged 30 to 49', 'are 30 to 49', 'is 30 to 49'), c('50+', 'voters aged 50 or over', 'are 50 or over', 'is 50 or over')] },
  { who: 'students', one: 'student', place: 'A cafeteria survey asked students',
    rows: [c('Grade 9', 'ninth graders', 'are in ninth grade', 'is in ninth grade'), c('Grade 12', 'twelfth graders', 'are in twelfth grade', 'is in twelfth grade')],
    cols: [c('Buys', 'students who buy lunch', 'buy lunch', 'buys lunch'), c('Brings', 'students who bring lunch', 'bring lunch', 'brings lunch'), c('Skips', 'students who skip lunch', 'skip lunch', 'skips lunch')] },
];

// ===================== count tables =====================
export type Grid = number[][];
export interface Totals { row: number[]; col: number[]; all: number }
export function totals(cells: Grid): Totals {
  const row = cells.map(r => r.reduce((s, v) => s + v, 0));
  const col = cells[0]!.map((_, j) => cells.reduce((s, r) => s + r[j]!, 0));
  return { row, col, all: row.reduce((s, v) => s + v, 0) };
}
/** a general table: every cell >= lo, cells and margins all distinct, grand total in [min, max] */
export function genTable(R: () => number, nr: number, nc: number, min = 40, max = 200, lo = 4): Grid {
  for (let t = 0; t < 4000; t++) {
    const N = int(R, min, max);
    const cells = Array.from({ length: nr }, () => Array.from({ length: nc }, () => int(R, lo, Math.max(lo + 2, Math.floor((2.2 * N) / (nr * nc))))));
    const T = totals(cells);
    if (T.all < min || T.all > max) continue;
    const all = [...cells.flat(), ...T.row, ...T.col, T.all];
    if (new Set(all).size !== all.length) continue;
    return cells;
  }
  throw new Error('genTable');
}
/** an exactly independent table: every row splits in the same proportions (column shares a/b), totals <= max */
export function genIndep(R: () => number, nr: number, nc: number, max = 200): Grid {
  for (let t = 0; t < 4000; t++) {
    const d = pick(R, [4, 5, 8, 10]);
    const parts = nc === 2 ? (() => { const a = int(R, 1, d - 1); return [a, d - a]; })() : (() => { const a = int(R, 1, d - 2), b = int(R, 1, d - 1 - a); return [a, b, d - a - b]; })();
    if (parts.some(p => p <= 0) || gcd(gcd(parts[0]!, parts[1]!), parts[2] ?? 0) !== 1) continue;
    const rows = Array.from({ length: nr }, () => d * int(R, 2, Math.floor(max / (nr * d))));
    const cells = rows.map(rt => parts.map(p => (rt / d) * p));
    const T = totals(cells);
    if (T.all > max || T.all < 40) continue;
    if (new Set(T.row).size !== nr) continue;
    return cells;
  }
  throw new Error('genIndep');
}
/** a dependent table close to independent: row shares of column 0 differ by 1-5 percentage points */
export function genClose(R: () => number, min = 80, max = 200): Grid {
  for (let t = 0; t < 4000; t++) {
    const r0 = int(R, 30, 110), r1 = int(R, 30, 110);
    if (r0 + r1 < min || r0 + r1 > max || r0 === r1) continue;
    const p = int(R, 30, 70) / 100;
    const a = Math.round(r0 * p), b = Math.round(r1 * (p + (R() < 0.5 ? -1 : 1) * int(R, 1, 5) / 100));
    const cells = [[a, r0 - a], [b, r1 - b]];
    const d = Math.abs(a / r0 - b / r1) * 100;
    if (d < 0.8 || d > 5 || cells.flat().some(v => v < 5)) continue;
    return cells;
  }
  throw new Error('genClose');
}
export const shareGap = (cells: Grid): number => Math.abs(cells[0]![0]! / (cells[0]![0]! + cells[0]![1]!) - cells[1]![0]! / (cells[1]![0]! + cells[1]![1]!)) * 100;

// ===================== the lesson's anchor data =====================
/** part 1-2: 200 juniors, job x license */
export const JOB: Grid = [[48, 32], [62, 58]];
/** part 3: 160 students, left-handed x instrument: exactly independent (6/16 = 60/160 = 3/8) */
export const HAND: Grid = [[6, 10], [54, 90]];

export { shuffle };
