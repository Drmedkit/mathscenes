// sampling.ts: the exact "maths" of judging a sample, pure (no DOM, no canvas). Everything the lesson states about a
// study is computed and checked here, so a wrong scene or item cannot be built:
//   computeStudy   population size, the group that supplied data and how it matches the population (census / part of
//                  the population / a different group), who answered, the yes count, the missing count
//   bounds         every completion of the unknown answers: the yes count lies between yes and yes + missing
//   guaranteed     a claim about the whole studied group holds under EVERY completion (then it may be stated)
//   possible       a claim holds under at least one completion (it is not ruled out)
//   scopeFor       which group a conclusion may be stated for, given how the data were collected
//   dedupe         a record table with a confirmed duplicate removed, recounted
// Inference from a random sample to a population is out of scope (topic JSON, generalize-scope teacher note).
import { BlockError, check } from '../../../blocks/block';

export type Match = 'census' | 'part' | 'different';
/** how the studied group was chosen: 'all' = everyone (census), 'selective' = a rule that favours or leaves out a
 *  part, 'undescribed' = the report does not say, 'outside' = a group that is not in the population */
export type Collection = 'all' | 'selective' | 'undescribed' | 'outside';
export type Direction = 'high' | 'low' | 'unknown';

export interface StudyParams {
  /** size of the population (the whole group the question is about) */
  N: number;
  /** size of the group that was asked (for 'different', a group outside the population) */
  n: number;
  match: Match;
  /** how many of the n gave an answer (default n) */
  answered?: number;
  /** how many answers were "yes" (default: not shown) */
  yes?: number;
}
export interface Study {
  readonly N: number; readonly n: number; readonly match: Match;
  readonly answered: number; readonly missing: number;
  readonly yes: number | null; readonly no: number | null;
  /** the people of the population the data do not cover (0 for a census; N for a different group) */
  readonly notAsked: number;
}

const NAME = 'Study';
const whole = (x: number, what: string) => check(Number.isInteger(x) && x >= 0, NAME, `${what} must be a whole number ≥ 0 (got ${x})`);

export function computeStudy(p: StudyParams): Study {
  whole(p.N, 'the population size'); whole(p.n, 'the number asked');
  check(p.N >= 1, NAME, 'the population needs at least one member');
  check(p.n >= 1, NAME, 'at least one member must be asked');
  if (p.match === 'census') check(p.n === p.N, NAME, `a census asks all ${p.N}, not ${p.n}`);
  if (p.match === 'part') check(p.n < p.N, NAME, `part of the population must be smaller than the population (${p.n} of ${p.N})`);
  const answered = p.answered ?? p.n;
  whole(answered, 'the number who answered');
  check(answered <= p.n, NAME, `${answered} answered, but only ${p.n} were asked`);
  let yes: number | null = null, no: number | null = null;
  if (p.yes !== undefined) {
    whole(p.yes, 'the yes count');
    check(p.yes <= answered, NAME, `${p.yes} said yes, but only ${answered} answered`);
    yes = p.yes; no = answered - p.yes;
  }
  const notAsked = p.match === 'different' ? p.N : p.N - p.n;
  return { N: p.N, n: p.n, match: p.match, answered, missing: p.n - answered, yes, no, notAsked };
}

/** the range of the yes count among the n asked, over every way the missing could have answered */
export function bounds(s: Study): [number, number] {
  if (s.yes === null) throw new BlockError(NAME, 'bounds need a yes count');
  return [s.yes, s.yes + s.missing];
}

/** a claim about how many of the n asked said yes */
export type Claim =
  | { kind: 'atLeast'; k: number }      // "at least k of the n"
  | { kind: 'most' }                     // "more than half of the n"
  | { kind: 'halfOrFewer' }              // "half or fewer of the n"
  | { kind: 'fewerThan'; k: number };    // "fewer than k of the n"

function holds(c: Claim, yes: number, n: number): boolean {
  switch (c.kind) {
    case 'atLeast': return yes >= c.k;
    case 'most': return 2 * yes > n;
    case 'halfOrFewer': return 2 * yes <= n;
    case 'fewerThan': return yes < c.k;
  }
}
/** true when the claim is true however the missing answers would have gone (checked over every completion) */
export function guaranteed(s: Study, c: Claim): boolean {
  const [lo, hi] = bounds(s);
  for (let y = lo; y <= hi; y++) if (!holds(c, y, s.n)) return false;
  return true;
}
/** true when at least one completion makes the claim true */
export function possible(s: Study, c: Claim): boolean {
  const [lo, hi] = bounds(s);
  for (let y = lo; y <= hi; y++) if (holds(c, y, s.n)) return true;
  return false;
}

/** the group a conclusion may be stated for (this topic's cases; random-sample inference is a later topic) */
export type Scope = 'population' | 'studied' | 'answered';
export function scopeFor(s: Study, how: Collection): Scope {
  if (how === 'all') check(s.match === 'census', NAME, 'everyone was asked, so this is a census');
  if (how === 'outside') check(s.match === 'different', NAME, 'an outside group is a different group');
  if (s.match === 'census' && s.missing === 0) return 'population';
  if (s.match === 'census') return 'answered';        // exact for those who answered; whole-group claims only if guaranteed
  return 'studied';
}

/** the effect of leaving a group out: if the left-out members answer "yes" less often than the ones asked, the
 *  sample's yes share is too high (and the other way round). 'unknown' when we cannot tell how they differ. */
export function effect(leftOutYesLess: boolean | null): Direction {
  return leftOutYesLess === null ? 'unknown' : leftOutYesLess ? 'high' : 'low';
}

// ---------- record tables (integrate-report) ----------
export interface Rec { name: string; ans: 'yes' | 'no' | '' }
export interface TableCount { rows: number; people: number; yes: number; no: number; blank: number; dupes: number[] }
/** count a record table; a name that appears twice is a confirmed duplicate (the later row is dropped) */
export function countTable(rows: readonly Rec[]): TableCount {
  const seen = new Map<string, number>();
  const dupes: number[] = [];
  let yes = 0, no = 0, blank = 0;
  rows.forEach((r, i) => {
    if (seen.has(r.name)) {
      check(rows[seen.get(r.name)!]!.ans === r.ans, 'Table', `${r.name} appears twice with different answers (not a plain duplicate)`);
      dupes.push(i); return;
    }
    seen.set(r.name, i);
    if (r.ans === 'yes') yes++; else if (r.ans === 'no') no++; else blank++;
  });
  return { rows: rows.length, people: seen.size, yes, no, blank, dupes };
}
