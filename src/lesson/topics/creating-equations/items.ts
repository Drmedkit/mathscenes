// items.ts: practice families for "Writing equations and inequalities from constraints" (Algebra 1, secondary-t6-06).
// Every family is built from templates and checked exactly (cons.ts); every wrong answer it can recognise carries a
// misconception id from math-curriculum-essentials/misconceptions.json. Answers that are equations, inequalities or
// systems are asked as choices among forms that differ by one typical slip; values are typed. A generator gets the
// sub-goal it practises (plan.ts). Pictures: `line` (AllowedLine: bands and dots of one variable) and `table`
// (CheckTable: candidates against every rule); both reveal their verdicts only in the replay after a miss. Pure.
import { type Item, type Response, type Verdict, int, pick, shuffle } from '../../runtime/item';
import { ans, endOnChoice } from '../../runtime/explain';
import type { SSet } from '../solving-linear-equations/sets';
import { flip, otherStrict, point, ray, strictOf, inter, EMPTY } from '../solving-linear-equations/sets';
import type { CTParams } from './CheckTable';
import { picFits } from './pictures';
import type { ALDots } from './AllowedLine';
import {
  type Con, type Rel, type Vals, broken, candH, candT, conH, conT, dec, decT, extremeWhole, holds, lin, money, near, nonneg, num,
  rel, relH, relT, stepsIn, test, viable, whole, wholeIn,
} from './cons';

// ---------- pictures ----------
export interface PicRow { key: string; name?: string; set?: SSet; role?: 'first' | 'second' | 'link' | 'pick' | 'wrong' | 'water' | 'dim'; dashed?: boolean; numbers?: 'above' | 'below' | 'none'; show?: boolean }
export interface LinePic {
  rows: PicRow[];
  tests?: { key: string; row: string; v: number; ok?: boolean }[];
  dots?: (ALDots & { show?: boolean })[];
  /** every value the window must hold */ values: number[];
  /** a fixed window (quarter steps) instead of axisFor */ axis?: { lo: number; hi: number; tick: number; every: number };
  /** TeX the board writes when the solve replays */ result?: string;
}
export interface TablePic extends CTParams { /** rows whose symbols show before the answer (default all) */ texShown?: boolean }
export interface CItem extends Item { picture?: { line?: LinePic; table?: TablePic } }
type Gen = (R: () => number, n: number, sg?: string) => CItem;

// ---------- misconception ids ----------
export const MC = {
  computes: 'mc.linear-equations.computes-instead-of-writing-equation',
  strictIn: 'mc.linear-equations.strict-includes-boundary',
  boundaryOnly: 'mc.linear-equations.boundary-only-solution',
  oneCoord: 'mc.linear-equations.checks-one-coordinate',
  inclOut: 'mc.linear-equations.inclusive-excludes-boundary',
  oneCond: 'mc.systems.one-condition-enough',
  diffVals: 'mc.systems.variable-different-values',
  reversed: 'mc.linear-equations.bound-phrase-direction-reversed',
  label: 'mc.expressions.letter-as-object-label',
  wordOrder: 'mc.expressions.writes-operations-in-word-order',
  everyNum: 'mc.reasoning-language.uses-every-number',
  dropStart: 'mc.linear-functions.drops-start-value',
  eqBound: 'mc.linear-equations.equation-for-a-bound',
  countValue: 'mc.linear-equations.count-and-value-mixed',
  swapRates: 'mc.expressions.swaps-rates-between-variables',
  unlike: 'mc.ratio-rate.adds-across-unlike-quantities',
  revComp: 'mc.expressions.reverses-multiplicative-comparison',
  allReals: 'mc.functions-concept.context-domain-all-reals',
  positive: 'mc.reasoning-language.context-quantities-strictly-positive',
  mustWhole: 'mc.expressions.variable-must-be-whole-number',
  fracCount: 'mc.functions-concept.discrete-quantity-allows-fractions',
  oneLetter: 'mc.expressions.one-letter-for-two-quantities',
  dropCon: 'mc.systems.drops-a-constraint',
  merge: 'mc.systems.merges-constraints',
  roundNear: 'mc.estimation.rounds-nearest-when-context-needs-direction',
  linked: 'mc.systems.linked-variables-independent',
  oneAnswer: 'mc.reasoning-language.one-determinable-answer',
  wholeOnly: 'mc.functions-concept.discrete-means-whole-numbers',
} as const;

// ---------- helpers ----------
const v = (s: string) => `<i>${s}</i>`;
const Cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : Math.abs(a));
/** a fraction a/b in lowest terms, as plain text (23/3, 10/3) */
const frac = (a: number, b: number) => { const g = gcd(a, b); return `${a / g}/${b / g}`; };
interface Opt { t: string; ok?: boolean; mc?: string; say: string }
interface Base { id: string; family: string; prompt: string; board: string; solution: string[]; picture?: CItem['picture'] }
function choice(R: () => number, b: Base, opts: Opt[]): CItem {
  const seen = new Set<string>();
  const uniq = opts.filter(o => { const k = o.t.replace(/\s+/g, ' '); if (seen.has(k)) return false; seen.add(k); return true; });
  const o = shuffle(R, uniq);
  const i = o.findIndex(x => x.ok);
  if (i < 0 || o.filter(x => x.ok).length !== 1) throw new Error(`${b.family}: exactly one right choice`);
  return {
    ...b, input: 'choice', choices: o.map(x => x.t), answer: { kind: 'choice', i }, solution: endOnChoice(b.solution, o[i]!.t),
    check(r: Response): Verdict {
      if (r.kind !== 'choice' || !o[r.i]) return { ok: false, say: 'Pick one of the answers.' };
      const x = o[r.i]!;
      return { ok: !!x.ok, mc: x.ok ? undefined : x.mc, say: x.say };
    },
  };
}
type Cand = [number, string | undefined, string];
function numItem(b: Base & { unit?: string }, val: number, okSay: string, cands: Cand[], hint: string): CItem {
  return {
    ...b, input: 'num', answer: { kind: 'num', v: val },
    check(r: Response): Verdict {
      if (r.kind !== 'num' || !Number.isFinite(r.v)) return { ok: false, say: 'Type a number.' };
      if (Math.abs(r.v - val) < 1e-6) return { ok: true, say: okSay };
      for (const [c, mc, say] of cands) if (Number.isFinite(c) && Math.abs(c - val) > 1e-6 && Math.abs(r.v - c) < 1e-6) return { ok: false, mc, say };
      return { ok: false, say: hint };
    },
  };
}
/** the misconception of picking relation `got` when the context needs `want` */
function relMc(want: Rel, got: Rel): string | undefined {
  if (got === want) return undefined;
  if (got === '=') return MC.eqBound;
  if (want === '=') return undefined;
  if (got === otherStrict(want)) return strictOf(want) ? MC.strictIn : MC.inclOut;
  if (got === flip(want)) return MC.reversed;
  return undefined;
}
function relSay(want: Rel, got: Rel, phrase: string): string {
  if (got === '=') return `“${phrase}” sets a limit, not one exact value: many values are allowed, so it is an inequality.`;
  if (want === '=') return `“${phrase}” pins the value down exactly: use =.`;
  if (got === otherStrict(want)) return strictOf(want) ? `“${phrase}” leaves the number itself out: use ${relH(want)}.` : `“${phrase}” lets the number itself count: use ${relH(want)}.`;
  return `“${phrase}” points the other way: it is a ${want === '<=' || want === '<' ? 'ceiling' : 'floor'}, so use ${relH(want)}.`;
}
const relWord = (r: Rel) => ({ '<=': 'up to', '<': 'below', '>=': 'from', '>': 'above', '=': 'exactly' }[r]);
/** a line picture of one variable: the set (and dots) appear in the replay */
function line1(name: string, set: SSet | undefined, values: number[], o: { dots?: number[]; tests?: { v: number; ok?: boolean }[]; result?: string; showSet?: boolean; axis?: LinePic['axis'] } = {}): LinePic {
  return {
    rows: [{ key: 'x', name, set, role: o.dots ? 'dim' : 'link', show: o.showSet }],
    dots: o.dots ? [{ key: 'd', row: 'x', vs: o.dots }] : undefined,
    tests: o.tests?.map((t, i) => ({ key: 't' + i, row: 'x', v: t.v, ok: t.ok })),
    values: [...values, ...(o.dots ?? []), ...(o.tests ?? []).map(t => t.v)], result: o.result, axis: o.axis,
  };
}

// ---------- contexts ----------
interface Two { x: string; y: string; xw: string; yw: string; px: number; py: number; B: number; kind: 'money' | 'min' | 'lb'; what: string; fmt: (z: number) => string; unit: string }
function two(R: () => number, decimals = false): Two {
  const k = pick(R, decimals ? ['store', 'plants', 'tickets'] as const : ['tickets', 'plants', 'bake', 'ship'] as const);
  if (k === 'store') { const px = pick(R, [0.75, 0.5, 0.25]), py = pick(R, [1.2, 1.5, 1.25]); return { x: 'p', y: 'q', xw: 'pencils', yw: 'pens', px, py, B: pick(R, [12, 15, 18, 20]), kind: 'money', what: 'spend', fmt: money, unit: 'dollars' }; }
  if (k === 'tickets') { const px = decimals ? pick(R, [8.5, 9.5, 7.5]) : pick(R, [8, 9, 10, 12]), py = decimals ? pick(R, [4.5, 5.5, 6.5]) : pick(R, [4, 5, 6]); return { x: 'a', y: 'c', xw: 'adult tickets', yw: 'child tickets', px, py, B: pick(R, [60, 72, 80, 90]), kind: 'money', what: 'spend', fmt: money, unit: 'dollars' }; }
  if (k === 'plants') { const px = decimals ? pick(R, [3.5, 4.5]) : pick(R, [3, 4, 5]), py = decimals ? pick(R, [2.25, 2.75]) : pick(R, [2, 6, 7]); return { x: 't', y: 'f', xw: 'tomato plants', yw: 'flower pots', px, py, B: pick(R, [40, 48, 50, 60]), kind: 'money', what: 'spend', fmt: money, unit: 'dollars' }; }
  if (k === 'bake') { const px = pick(R, [12, 15]), py = pick(R, [20, 25]); return { x: 'c', y: 'm', xw: 'batches of cookies', yw: 'batches of muffins', px, py, B: pick(R, [180, 200, 240]), kind: 'min', what: 'bake for', fmt: z => `${dec(z)} min`, unit: 'minutes' }; }
  const px = pick(R, [3, 4]), py = pick(R, [5, 7]);
  return { x: 's', y: 'l', xw: 'small boxes', yw: 'large boxes', px, py, B: pick(R, [60, 70, 84]), kind: 'lb', what: 'load', fmt: z => `${dec(z)} lb`, unit: 'pounds' };
}
const twoStory = (T: Two, phrase = 'at most') => T.kind === 'money'
  ? `${Cap(T.xw)} cost ${money(T.px)} each, ${T.yw} ${money(T.py)} each. You can spend ${phrase} ${money(T.B)}.`
  : T.kind === 'min' ? `A batch of cookies bakes ${T.px} min, a batch of muffins ${T.py} min. The oven is free ${phrase} ${T.B} min.`
    : `A small box weighs ${T.px} lb, a large box ${T.py} lb. A cart carries ${phrase} ${T.B} lb.`;
const twoDefs = (T: Two) => `${v(T.x)} = number of ${T.xw}, ${v(T.y)} = number of ${T.yw}`;
const twoCon = (T: Two, r: Rel = '<='): Con => rel(lin({ [T.x]: T.px, [T.y]: T.py }), r, num(T.B));
const twoBoard = (T: Two, phrase = 'at most') => `\\text{${phrase} }${T.kind === 'money' ? '\\$' + T.B : T.B + (T.kind === 'min' ? '\\text{ min}' : '\\text{ lb}')}`;

// =====================================================================================================================
// 1 equation-as-condition
// =====================================================================================================================
interface Eq1 { story: string; x: string; k: number; f: number; T: number; s: number; words: string; what: string }
function eq1(R: () => number): Eq1 {
  for (;;) {
    const kind = pick(R, ['boxes', 'plumber', 'bags', 'rows'] as const), s = int(R, 2, 10), k = int(R, 2, 10);
    if (kind === 'boxes') { const T = k * s; if (T > 100) continue; return { story: `Each box holds ${k} muffins. ${Cap(v('n'))} boxes hold exactly ${T} muffins.`, x: 'n', k, f: 0, T, s, words: `${T} muffins in all`, what: 'boxes' }; }
    if (kind === 'plumber') { const f = int(R, 2, 6) * 5, T = f + k * s; if (T > 100) continue; return { story: `A plumber charges $${f} plus $${k} per hour. The bill for ${v('h')} hours was exactly $${T}.`, x: 'h', k, f, T, s, words: `the bill is exactly $${T}`, what: 'hours' }; }
    if (kind === 'bags') { const f = int(R, 1, 9), T = f + k * s; if (T > 100) continue; return { story: `A bag of soil weighs ${k} lb. ${Cap(v('b'))} bags plus ${f === 8 ? 'an' : 'a'} ${f}-lb shovel weigh exactly ${T} lb.`, x: 'b', k, f, T, s, words: `${T} lb in all`, what: 'bags' }; }
    const T = k * s; if (T > 100) continue;
    return { story: `A hall puts ${k} chairs in each row. ${Cap(v('r'))} rows hold exactly ${T} chairs.`, x: 'r', k, f: 0, T, s, words: `${T} chairs in all`, what: 'rows' };
  }
}
const eq1Con = (E: Eq1) => rel(lin({ [E.x]: E.k }, E.f), '=', num(E.T));
const eq1T = (E: Eq1) => conT(eq1Con(E)), eq1H = (E: Eq1) => conH(eq1Con(E));
const eqTest: Gen = (R, n) => {
  const E = eq1(R);
  const cs = [E.s - 1, E.s, E.s + 1];
  const opts: Opt[] = cs.map(c => {
    const l = E.k * c + E.f;
    return c === E.s ? { t: `${v(E.x)} = ${c}`, ok: true, say: `Yes: ${E.f ? `${E.f} + ` : ''}${E.k}(${c}) = ${E.T}. The condition is true for ${c} and false for the others.` }
      : { t: `${v(E.x)} = ${c}`, say: `Put it in: ${E.f ? `${E.f} + ` : ''}${E.k}(${c}) = ${l}, not ${E.T}. The condition is false for ${c}.` };
  });
  opts.push({ t: 'All three: an equation is a sum to work out, not a test', mc: MC.computes, say: `The equation is a condition: it is TRUE for some values and FALSE for others. Put each value in and compare with ${E.T}.` });
  const table: TablePic = { head: E.x, headWords: 'the condition', cands: cs.map((c, i) => ({ key: 'k' + i, label: `${E.x} = ${c}`, v: { [E.x]: c } })), rows: [{ key: 'e', words: E.words, tex: eq1T(E), con: eq1Con(E) }] };
  return choice(R, { id: `eqTest-${n}`, family: 'eqTest', board: eq1T(E), prompt: `${E.story} The condition is <b>${eq1H(E)}</b>. Which value makes it true?`,
    solution: [`Put each value in for ${v(E.x)} and compare with ${E.T}.`, `${E.f ? `${E.f} + ` : ''}${E.k}(${E.s}) = ${E.T}: true. The others give ${E.k * cs.filter(c => c !== E.s)[0]! + E.f} and ${E.k * cs.filter(c => c !== E.s)[1]! + E.f}: false.`], picture: { table } }, opts);
};
const eqMeaning: Gen = (R, n) => {
  const E = eq1(R);
  const opts: Opt[] = [
    { t: `It is a condition: true for exactly the right number of ${E.what}, false for every other number`, ok: true, say: `Yes. Try ${E.s}: it makes the equation true. ${E.s + 1} makes it false.` },
    { t: `It is an instruction: work out ${eq1H(E).replace(/ = .*/, '')} to get the answer`, mc: MC.computes, say: `You can’t work it out without knowing ${v(E.x)}. The equation is a condition on ${v(E.x)}: true or false for each value.` },
    { t: `${v(E.x)} stands for “${E.what}”, so the equation is a short way to write the sentence`, mc: MC.label, say: `${v(E.x)} is a NUMBER: how many ${E.what}. That is why you can test values in it.` },
    { t: `Any number of ${E.what} up to ${E.T} works`, say: `“Exactly” allows one value, not a range. Only ${E.s} makes it true.` },
  ];
  return choice(R, { id: `eqMeaning-${n}`, family: 'eqMeaning', board: eq1T(E), prompt: `${E.story} What does the equation <b>${eq1H(E)}</b> say?`,
    solution: [`An equation is a condition: it is true for some values of ${v(E.x)} and false for others.`, `Here only ${v(E.x)} = ${E.s} makes it true: ${E.f ? `${E.f} + ` : ''}${E.k}(${E.s}) = ${E.T}.`],
    picture: { line: line1(E.x, point(E.s), [0, E.s, E.s + 1], { tests: [{ v: E.s, ok: true }, { v: E.s + 1, ok: false }], result: `${E.x} = ${E.s}` }) } }, opts);
};

// =====================================================================================================================
// 2 inequality-as-allowed-set
// =====================================================================================================================
interface Bnd { x: string; r: Rel; B: number; d: number; story: string; unit: string; noun: string; phrase: string }
function bnd(R: () => number): Bnd {
  const k = pick(R, ['bag', 'ride', 'speed', 'oven', 'gas', 'score'] as const);
  if (k === 'bag') { const B = pick(R, [22, 40, 50]); return { x: 'w', r: '<=', B, d: pick(R, [2, 4, 5]), story: `A carry-on bag can weigh at most ${B} lb.`, unit: 'lb', noun: 'weight', phrase: 'at most' }; }
  if (k === 'ride') { const B = pick(R, [42, 48, 54]); return { x: 'h', r: '>=', B, d: pick(R, [2, 3, 6]), story: `Riders must be at least ${B} in tall.`, unit: 'in', noun: 'height', phrase: 'at least' }; }
  if (k === 'speed') { const B = pick(R, [25, 35, 55]); return { x: 's', r: '<', B, d: pick(R, [5, 10]), story: `Drivers must stay under ${B} mph in this zone.`, unit: 'mph', noun: 'speed', phrase: 'under' }; }
  if (k === 'oven') { const B = pick(R, [350, 375, 400]); return { x: 't', r: '>', B, d: pick(R, [25, 50]), story: `The oven must be hotter than ${B} °F.`, unit: '°F', noun: 'temperature', phrase: 'hotter than' }; }
  if (k === 'gas') { const B = pick(R, [30, 40, 45]); return { x: 'g', r: '<=', B, d: pick(R, [5, 10]), story: `Spend no more than $${B} on gas.`, unit: 'dollars', noun: 'amount', phrase: 'no more than' }; }
  const B = pick(R, [70, 75, 80]);
  return { x: 'p', r: '>=', B, d: pick(R, [5, 10]), story: `To pass, a team needs no fewer than ${B} points.`, unit: 'points', noun: 'score', phrase: 'no fewer than' };
}
const bT = (b: Bnd) => `${b.x} ${relT(b.r)} ${b.B}`, bH = (b: Bnd) => `${v(b.x)} ${relH(b.r)} ${b.B}`;
function setWords(b: Bnd, r: Rel): string {
  const incl = r === '<=' || r === '>=';
  const dir = r === '<=' || r === '<' ? `every ${b.noun} below ${b.B}` : `every ${b.noun} above ${b.B}`;
  return `${Cap(dir)}, and ${b.B} itself ${incl ? 'too' : 'left out'}`;
}
const allowedSet: Gen = (R, n) => {
  const b = bnd(R);
  const opts: Opt[] = [
    { t: setWords(b, b.r), ok: true, say: `Yes: a whole set of values, ${strictOf(b.r) ? `with ${b.B} itself left out` : `${b.B} included`}.` },
    { t: `Only ${b.B} ${b.unit}`, mc: MC.boundaryOnly, say: `${b.B} is only the boundary. ${Cap(b.phrase)} allows a whole set of values, not one number.` },
    { t: setWords(b, otherStrict(b.r)), mc: strictOf(b.r) ? MC.strictIn : MC.inclOut, say: strictOf(b.r) ? `“${b.phrase}” leaves ${b.B} itself out.` : `“${b.phrase}” lets ${b.B} itself count.` },
    { t: setWords(b, flip(b.r)), mc: MC.reversed, say: `That points the wrong way: “${b.phrase}” is a ${b.r === '<=' || b.r === '<' ? 'ceiling' : 'floor'}.` },
  ];
  const tv = [b.B - b.d, b.B, b.B + b.d];
  return choice(R, { id: `allowedSet-${n}`, family: 'allowedSet', board: bT(b), prompt: `${b.story} With ${v(b.x)} the ${b.noun} (${b.unit}), the condition is <b>${bH(b)}</b>. Which values does it allow?`,
    solution: [`An inequality allows a whole set: every ${b.noun} that makes ${bH(b)} true.`, `${b.B} itself: ${b.B} ${relH(b.r)} ${b.B} is ${holds(b.B, b.r, b.B) ? 'true, so it is in' : 'false, so it is out'}.`],
    picture: { line: line1(b.x, ray(b.r, b.B), tv, { tests: tv.map(t => ({ v: t })), result: bT(b) }) } }, opts);
};
const boundaryCand: Gen = (R, n) => {
  const b = bnd(R), where = pick(R, ['edge', 'edge', 'in', 'out'] as const);
  const inside = b.r === '<=' || b.r === '<' ? b.B - b.d : b.B + b.d, outside = b.r === '<=' || b.r === '<' ? b.B + b.d : b.B - b.d;
  const c = where === 'edge' ? b.B : where === 'in' ? inside : outside;
  const yes = holds(c, b.r, b.B);
  const opts: Opt[] = [
    { t: `Yes: ${c} ${relH(b.r)} ${b.B} is true`, ok: yes, mc: yes ? undefined : c === b.B ? MC.strictIn : MC.reversed, say: yes ? `Yes: ${c} is in the allowed set.` : c === b.B ? `${c} ${relH(b.r)} ${b.B} is false: “${b.phrase}” leaves ${b.B} itself out.` : `${c} ${relH(b.r)} ${b.B} is false: it is on the wrong side of ${b.B}.` },
    { t: `No: ${c} ${relH(b.r)} ${b.B} is false`, ok: !yes, mc: !yes ? undefined : c === b.B ? MC.inclOut : undefined, say: !yes ? `Right: ${c} is not allowed.` : c === b.B ? `${relH(b.r)} includes the boundary: ${b.B} ${relH(b.r)} ${b.B} is true.` : `${c} ${relH(b.r)} ${b.B} is true: ${c} is allowed.` },
  ];
  if (c !== b.B) opts.push({ t: `Only ${b.B} itself is allowed`, mc: MC.boundaryOnly, say: `An inequality allows a whole set of values, not just the boundary.` });
  return choice(R, { id: `boundaryCand-${n}`, family: 'boundaryCand', board: bT(b), prompt: `${b.story} The condition is <b>${bH(b)}</b>. Is ${v(b.x)} = ${c} allowed?`,
    solution: [`Put it in: ${c} ${relH(b.r)} ${b.B}.`, `That is ${yes ? 'true' : 'false'}, so ${c} is ${yes ? '' : 'not '}allowed.`],
    picture: { line: line1(b.x, ray(b.r, b.B), [b.B - b.d, b.B + b.d], { tests: [{ v: c }], result: bT(b) }) } }, opts);
};

// =====================================================================================================================
// 3 test-candidates
// =====================================================================================================================
function twoPair(R: () => number, T: Two, want: 'under' | 'exact' | 'over'): Vals | null {
  const cands: Vals[] = [];
  for (let a = 1; a * T.px <= T.B * 1.3 && a <= 16; a++) for (let b = 1; b * T.py <= T.B * 1.3 && b <= 16; b++) {
    const s = a * T.px + b * T.py;
    if (want === 'exact' ? near(s, T.B) : want === 'under' ? s < T.B - 1e-9 && s >= T.B * 0.8 : s > T.B + 1e-9 && s <= T.B * 1.15) cands.push({ [T.x]: a, [T.y]: b });
  }
  return cands.length ? pick(R, cands) : null;
}
const pairTest: Gen = (R, n) => {
  for (;;) {
    const T = two(R, R() < 0.35), want = pick(R, ['under', 'exact', 'over', 'over'] as const), P = twoPair(R, T, want);
    if (!P) continue;
    const a = P[T.x]!, b = P[T.y]!, s = a * T.px + b * T.py, okv = s <= T.B + 1e-9;
    const sub = `${dec(T.px)}(${a}) + ${dec(T.py)}(${b}) = ${dec(s)}`;
    const C = twoCon(T);
    const opts: Opt[] = [
      { t: `${sub}, and ${dec(s)} ≤ ${T.B} is ${okv ? 'true' : 'false'}: (${a}, ${b}) ${okv ? 'satisfies' : 'does not satisfy'} it`, ok: true, say: `Yes: both values go in, then compare with ${T.B}.` },
      { t: `${dec(T.px)}(${a}) = ${dec(a * T.px)}, and ${dec(a * T.px)} ≤ ${T.B}: (${a}, ${b}) satisfies it`, mc: MC.oneCoord, say: `That checks only ${v(T.x)}. The pair has a second value: ${dec(T.py)}(${b}) counts too.` },
      { t: `${a} + ${b} = ${a + b}, and ${a + b} ≤ ${T.B}: (${a}, ${b}) satisfies it`, mc: MC.countValue, say: `${a + b} counts items. The rule is about ${T.unit}: multiply each count by its ${T.kind === 'money' ? 'price' : 'size'}.` },
    ];
    if (want === 'exact') opts.push({ t: `${sub}, but ${dec(s)} is not less than ${T.B}: (${a}, ${b}) does not satisfy it`, mc: MC.inclOut, say: `≤ includes equal: ${dec(s)} ≤ ${T.B} is true.` });
    else opts.push({ t: `${sub}, and ${dec(s)} ≤ ${T.B} is ${okv ? 'false' : 'true'}: (${a}, ${b}) ${okv ? 'does not satisfy' : 'satisfies'} it`, say: `Compare again: is ${dec(s)} at most ${T.B}?` });
    const table: TablePic = { head: `(${T.x},\\,${T.y})`, cands: [{ key: 'p', label: candT(P, [T.x, T.y]), v: P }], rows: [{ key: 'r', words: `${T.what} at most ${T.fmt(T.B)}`, tex: conT(C), con: C }] };
    return choice(R, { id: `pairTest-${n}`, family: 'pairTest', board: conT(C), prompt: `${twoStory(T)} With ${twoDefs(T)}, the rule is <b>${conH(C)}</b>. Which check of the pair (${a}, ${b}) is right?`,
      solution: [`Put BOTH values in: ${sub}.`, `Compare with the bound: ${dec(s)} ≤ ${T.B} is ${okv ? 'true' : 'false'}.`], picture: { table } }, opts);
  }
};
const pairValue: Gen = (R, n) => {
  for (;;) {
    const T = two(R, R() < 0.5), P = twoPair(R, T, pick(R, ['under', 'over', 'exact'] as const));
    if (!P) continue;
    const a = P[T.x]!, b = P[T.y]!, s = Math.round((a * T.px + b * T.py) * 100) / 100, C = twoCon(T);
    const verdict = s <= T.B + 1e-9 ? `${dec(s)} ≤ ${T.B}: the pair satisfies the rule.` : `${dec(s)} &gt; ${T.B}: the pair breaks the rule.`;
    const table: TablePic = { head: `(${T.x},\\,${T.y})`, cands: [{ key: 'p', label: candT(P, [T.x, T.y]), v: P }], rows: [{ key: 'r', words: `${T.what} at most ${T.fmt(T.B)}`, tex: conT(C), con: C }] };
    return numItem({ id: `pairValue-${n}`, family: 'pairValue', board: conT(C), unit: T.unit, picture: { table },
      prompt: `${twoStory(T)} The rule is <b>${conH(C)}</b> (${twoDefs(T)}). Test the pair (${a}, ${b}): what is the left side?`,
      solution: [`Put ${v(T.x)} = ${a} and ${v(T.y)} = ${b} in: ${dec(T.px)}(${a}) + ${dec(T.py)}(${b}) = ${ans(dec(s))}.`, verdict] }, s,
      `Yes: ${dec(s)}. ${verdict}`, [[Math.round(a * T.px * 100) / 100, MC.oneCoord, `That is only the ${v(T.x)} part. Add ${dec(T.py)}(${b}) for ${v(T.y)}.`], [a + b, MC.countValue, `${a + b} counts items; the rule adds ${T.unit}. Multiply each count first.`], [Math.round((a * T.py + b * T.px) * 100) / 100, MC.swapRates, `Each count goes with its own ${T.kind === 'money' ? 'price' : 'size'}: ${dec(T.px)} goes with ${v(T.x)}.`]],
      `Multiply each value by its number, then add: ${dec(T.px)}(${a}) + ${dec(T.py)}(${b}).`);
  }
};

// =====================================================================================================================
// 4 conjunction-of-constraints
// =====================================================================================================================
const bothValue: Gen = (R, n) => {
  for (;;) {
    const m = int(R, 3, 6), p = pick(R, [4, 5, 6, 8]), B = p * int(R, m + 2, m + 4) + pick(R, [0, 0, int(R, 1, p - 1)]);
    const cap = Math.floor(B / p);
    if (cap - m < 1 || cap > 12) continue;
    const kind = pick(R, ['team', 'club'] as const);
    const story = kind === 'team' ? `A team needs at least ${m} players. Jerseys cost $${p} each and the budget is $${B}.` : `A study group needs at least ${m} members. Each member’s book costs $${p} and the club has $${B}.`;
    const good = int(R, m, cap), low = m - 1, high = cap + 1;
    const opts: Opt[] = [
      { t: `${v('n')} = ${good}`, ok: true, say: `Yes: ${good} ≥ ${m} and ${p}(${good}) = ${p * good} ≤ ${B}. Both hold.` },
      { t: `${v('n')} = ${low}`, mc: MC.oneCond, say: `${p}(${low}) = ${p * low} fits the budget, but ${low} ≥ ${m} is false. A value must pass BOTH.` },
      { t: `${v('n')} = ${high}`, mc: MC.oneCond, say: `${high} ≥ ${m} is true, but ${p}(${high}) = ${p * high} &gt; ${B}. A value must pass BOTH.` },
    ];
    const both = inter(ray('>=', m), ray('<=', B / p));
    const pic: LinePic = {
      rows: [{ key: 'a', name: `n \\ge ${m}`, set: ray('>=', m), role: 'first' }, { key: 'b', name: `${p}n \\le ${B}`, set: ray('<=', B / p), role: 'second' }, { key: 'c', name: '\\text{both}', role: 'dim' }],
      dots: [{ key: 'd', row: 'c', vs: wholeIn(m, cap) }], values: [0, m, B / p, low, high], result: `${m} \\le n \\le ${cap}`,
    };
    void both;
    return choice(R, { id: `bothValue-${n}`, family: 'bothValue', board: `n \\ge ${m}\\ \\text{and}\\ ${p}n \\le ${B}`, picture: { line: pic },
      prompt: `${story} With ${v('n')} the number of ${kind === 'team' ? 'players' : 'members'}: <b>${v('n')} ≥ ${m}</b> and <b>${p}${v('n')} ≤ ${B}</b>. Which value meets BOTH conditions?`,
      solution: [`Test each value in both conditions.`, `${good}: ${good} ≥ ${m} ✓ and ${p * good} ≤ ${B} ✓. ${low} fails the first, ${high} fails the second.`] }, opts);
  }
};
const pairBoth: Gen = (R, n) => {
  for (;;) {
    const N = int(R, 8, 14), a = pick(R, [5, 6, 8]), b = pick(R, [2, 3, 4]), G = int(R, 5, 9) * 10;
    const story = `A bake sale table fits at most ${N} trays. A tray of cookies earns $${a} and a tray of muffins $${b}. The goal is to earn at least $${G}.`;
    const C1 = rel(lin({ c: 1, m: 1 }), '<=', num(N)), C2 = rel(lin({ c: a, m: b }), '>=', num(G));
    const want = pick(R, ['fail2', 'fail2', 'fail1', 'ok'] as const);
    const pool: Vals[] = [];
    for (let x = 1; x <= N + 3; x++) for (let y = 1; y <= N + 3; y++) {
      const P = { c: x, m: y }, t1 = test(C1, P).ok, t2 = test(C2, P).ok;
      if (x === y) continue;
      if (want === 'ok' ? t1 && t2 : want === 'fail1' ? !t1 && t2 : t1 && !t2) pool.push(P);
    }
    if (!pool.length) continue;
    const P = pick(R, pool), x = P.c!, y = P.m!, s1 = x + y, s2 = a * x + b * y, sw = a * y + b * x;
    const t1 = s1 <= N, t2 = s2 >= G;
    const right = t1 && t2 ? `Yes: ${s1} ≤ ${N} and ${s2} ≥ ${G}. Both hold` : !t1 ? `No: ${s1} trays is more than ${N}` : `No: it fits (${s1} ≤ ${N}), but earns only $${s2}, less than $${G}`;
    const opts: Opt[] = [{ t: right, ok: true, say: t1 && t2 ? 'Yes: the same pair passes both rules.' : 'Right: one broken rule is enough to rule it out.' }];
    if (!t1 || !t2) opts.push({ t: !t1 ? `Yes: it earns $${s2}, at least $${G}` : `Yes: ${s1} trays fit on the table`, mc: MC.oneCond, say: 'Passing one rule is not enough: the pair must pass every rule at once.' });
    if ((sw >= G) !== t2) opts.push({ t: sw >= G ? `Yes: ${a}(${y}) + ${b}(${x}) = ${sw} ≥ ${G}` : `No: ${a}(${y}) + ${b}(${x}) = ${sw}, less than ${G}`, mc: MC.diffVals, say: `Keep ${v('c')} = ${x} and ${v('m')} = ${y} in EVERY rule: ${a}(${x}) + ${b}(${y}) = ${s2}.` });
    if (opts.length < 3) opts.push({ t: `No: it must earn exactly $${G}`, mc: MC.eqBound, say: `“At least” allows any amount from $${G} up.` });
    if (opts.length < 3) opts.push({ t: `No: ${s1} trays is more than ${N}`, say: `${s1} ≤ ${N}: it fits.` });
    const table: TablePic = { head: '(c,\\,m)', cands: [{ key: 'p', label: candT(P, ['c', 'm']), v: P }], rows: [{ key: 'r1', words: `at most ${N} trays`, tex: conT(C1), con: C1 }, { key: 'r2', words: `earn at least $${G}`, tex: conT(C2), con: C2 }], all: true };
    return choice(R, { id: `pairBoth-${n}`, family: 'pairBoth', board: conT(C1), picture: { table },
      prompt: `${story} With ${v('c')} cookie trays and ${v('m')} muffin trays: <b>${conH(C1)}</b> and <b>${conH(C2)}</b>. Does (${x}, ${y}) meet both?`,
      solution: [`Same values in both rules: ${x} + ${y} = ${s1} and ${a}(${x}) + ${b}(${y}) = ${s2}.`, `${s1} ≤ ${N} is ${t1 ? 'true' : 'false'}; ${s2} ≥ ${G} is ${t2 ? 'true' : 'false'}.`] }, opts);
  }
};

// =====================================================================================================================
// 5 bound-phrase-to-symbol
// =====================================================================================================================
const PHRASES: { p: string; r: Rel; count: boolean }[] = [
  { p: 'no more than', r: '<=', count: false }, { p: 'no more than', r: '<=', count: true }, { p: 'no fewer than', r: '>=', count: true }, { p: 'no fewer than', r: '>=', count: true },
  { p: 'at most', r: '<=', count: false }, { p: 'at least', r: '>=', count: false }, { p: 'cannot exceed', r: '<=', count: false }, { p: 'a maximum of', r: '<=', count: true },
  { p: 'a minimum of', r: '>=', count: true }, { p: 'more than', r: '>', count: false }, { p: 'exceeds', r: '>', count: false }, { p: 'less than', r: '<', count: false },
  { p: 'under', r: '<', count: false }, { p: 'fewer than', r: '<', count: true }, { p: 'exactly', r: '=', count: false }, { p: 'a total of', r: '=', count: true },
  { p: 'no less than', r: '>=', count: false },
];
function phrase(R: () => number): { P: (typeof PHRASES)[number]; sent: string; x: string; def: string; B: number } {
  const P = pick(R, PHRASES);
  if (P.count) {
    const c = pick(R, [{ s: 'The van carries', w: 'people', x: 'n' }, { s: 'The club signs up', w: 'members', x: 'm' }, { s: 'The order is for', w: 'shirts', x: 's' }]);
    const B = pick(R, [12, 15, 20, 25, 30]);
    return { P, sent: `${c.s} ${P.p} ${B} ${c.w}.`, x: c.x, def: `the number of ${c.w}`, B };
  }
  if (P.p === 'cannot exceed' || P.p === 'exceeds') {
    const B = pick(R, [40, 50, 60, 75]);
    return { P, sent: P.p === 'exceeds' ? `The phone bill ${P.p} $${B}.` : `The phone bill ${P.p} $${B}.`, x: 'b', def: 'the bill in dollars', B };
  }
  const c = pick(R, [{ s: 'The suitcase weighs', x: 'w', d: 'the weight in pounds', u: 'lb', Bs: [40, 45, 50] }, { s: 'The tank holds', x: 'g', d: 'the amount of water in gallons', u: 'gallons', Bs: [20, 30, 55] }, { s: 'The hike takes', x: 't', d: 'the time in hours', u: 'hours', Bs: [3, 4, 6] }]);
  const B = pick(R, c.Bs);
  return { P, sent: `${c.s} ${P.p} ${B} ${c.u}.`, x: c.x, def: c.d, B };
}
const SYMS: Rel[] = ['<=', '>=', '<', '>', '='];
const phraseSymbol: Gen = (R, n) => {
  const Q = phrase(R);
  const opts: Opt[] = SYMS.map(r => ({ t: relH(r), ok: r === Q.P.r, mc: relMc(Q.P.r, r), say: r === Q.P.r ? `Yes: “${Q.P.p}” is ${relH(r)}.` : relSay(Q.P.r, r, Q.P.p) }));
  return choice(R, { id: `phraseSymbol-${n}`, family: 'phraseSymbol', board: `\\text{${Q.P.p}}`, prompt: `“${Q.sent}” With ${v(Q.x)} = ${Q.def}, the condition is ${v(Q.x)} ☐ ${Q.B}. Which symbol goes in the box?`,
    solution: [`Ask: can ${v(Q.x)} be ${Q.B} itself? ${Q.P.r === '<' || Q.P.r === '>' ? 'No' : 'Yes'}. ${Q.P.r === '=' ? 'Only that value.' : `Is ${Q.B} a ceiling or a floor? A ${Q.P.r === '<=' || Q.P.r === '<' ? 'ceiling' : 'floor'}.`}`, `“${Q.P.p}”: ${ans(relH(Q.P.r))}`] }, opts);
};
const phraseWrite: Gen = (R, n) => {
  const Q = phrase(R), want = Q.P.r;
  const rels: Rel[] = want === '=' ? ['=', '<=', '>=', '<'] : [want, flip(want), otherStrict(want), '='];
  const form = (r: Rel) => (R() < 0.4 && r !== '=' ? `${Q.B} ${relH(flip(r))} ${v(Q.x)}` : `${v(Q.x)} ${relH(r)} ${Q.B}`);
  const opts: Opt[] = rels.map(r => ({ t: form(r), ok: r === want, mc: relMc(want, r), say: r === want ? `Yes. (${Q.B} ${relH(flip(want))} ${v(Q.x)} and ${v(Q.x)} ${relH(want)} ${Q.B} say the same thing.)` : relSay(want, r, Q.P.p) }));
  return choice(R, { id: `phraseWrite-${n}`, family: 'phraseWrite', board: `\\text{${Q.P.p} } ${Q.B}`, prompt: `“${Q.sent}” Let ${v(Q.x)} = ${Q.def}. Which statement says this? (Read each one from the letter.)`,
    solution: [`“${Q.P.p}”: ${v(Q.x)} ${relH(want)} ${Q.B}.`, `Written the other way round the symbol turns too: ${Q.B} ${relH(flip(want))} ${v(Q.x)} is the same statement.`] }, opts);
};

// =====================================================================================================================
// 6 define-variables
// =====================================================================================================================
const DEFS = [
  { story: (k: number) => `A theater sells adult tickets for $${k} each.`, k: [8, 9, 12, 15], x: 'a', ok: 'the number of adult tickets sold', label: 'adult tickets', other: 'the price of one adult ticket', other2: 'the money from adult tickets, in dollars', pin: 'Nobody knows yet how many adult tickets will sell.' },
  { story: (k: number) => `A dog walker earns $${k} for each hour she works.`, k: [12, 15, 18, 20], x: 'h', ok: 'the number of hours she works', label: 'hours', other: 'the pay for one hour, in dollars', other2: 'the number of dogs she walks', pin: 'Nobody knows yet how long she will work this week.' },
  { story: (k: number) => `Apples cost $${dec(k / 10 + 0.05)} per pound.`, k: [15, 17, 19, 21], x: 'p', ok: 'the weight of apples bought, in pounds', label: 'apples', other: 'the price of one pound of apples', other2: 'the number of stores that sell apples', pin: 'You don’t know yet how much fruit you will put on the scale.' },
  { story: (k: number) => `Gas costs $${dec(k / 100)} per gallon.`, k: [329, 349, 365, 389], x: 'g', ok: 'the amount of gas bought, in gallons', label: 'gas', other: 'the price of one gallon', other2: 'the number of cars at the pump', pin: 'You don’t know yet how much gas you will pump.' },
  { story: (k: number) => `Each bus seats ${k} students.`, k: [44, 48, 52, 56], x: 'b', ok: 'the number of buses rented', label: 'buses', other: 'the number of students on one bus', other2: 'the number of seats on one bus, minus the driver', pin: 'The school has not decided how many buses to rent.' },
  { story: (k: number) => `A plant grows ${dec(k / 10)} cm per week.`, k: [15, 20, 25, 35], x: 'w', ok: 'the number of weeks of growth', label: 'weeks', other: 'the height of the plant, in cm', other2: 'the growth in one week, in cm', pin: 'You want to know how long it has been growing.' },
] as const;
const defineVar: Gen = (R, n) => {
  const D = pick(R, DEFS), story = D.story(pick(R, D.k));
  const opts: Opt[] = [
    { t: `${v(D.x)} = ${D.ok}`, ok: true, say: 'Yes: a quantity you can count or measure, with its unit.' },
    { t: `${v(D.x)} = ${D.label}`, mc: MC.label, say: `${v(D.x)} must be a NUMBER. “${D.label}” names things; say what you count or measure, and in what unit.` },
    { t: `${v(D.x)} = ${D.other}`, say: 'That number is already given in the story. The variable is the quantity you do not know yet.' },
    { t: `${v(D.x)} = ${D.other2}`, say: `That is a different quantity. Read the story again: ${story}` },
  ];
  return choice(R, { id: `defineVar-${n}`, family: 'defineVar', board: `${D.x} = \\ ?`, prompt: `${story} ${D.pin} Which is a complete definition of the variable ${v(D.x)} for that unknown?`,
    solution: ['A variable stands for a NUMBER: name the quantity and its unit.', `${v(D.x)} = ${D.ok}.`] }, opts);
};
const unitCheck: Gen = (R, n) => {
  const T = two(R, false);
  let tot = pick(R, [3, 4, 5, 6]) * T.px + pick(R, [2, 3, 4]) * T.py;
  for (let k = 0; tot > T.B && k < 50; k++) tot = int(R, 1, 4) * T.px + int(R, 1, 3) * T.py;   // the exact total stays within the stated limit
  if (tot > T.B) tot = T.px + T.py;
  const okE = `${dec(T.px)}${v(T.x)} + ${dec(T.py)}${v(T.y)} = ${dec(tot)}`;
  const opts: Opt[] = [
    { t: okE, ok: true, say: `Yes: ${T.unit} plus ${T.unit}, equal to ${T.unit}.` },
    { t: `${v(T.x)} + ${v(T.y)} = ${dec(tot)}`, mc: T.kind === 'money' ? MC.countValue : MC.unlike, say: `${v(T.x)} + ${v(T.y)} counts items, but ${dec(tot)} is in ${T.unit}. Multiply each count by its ${T.kind === 'money' ? 'price' : 'size'}.` },
    { t: `${dec(T.px)}${v(T.x)} + ${v(T.y)} = ${dec(tot)}`, mc: MC.unlike, say: `${dec(T.px)}${v(T.x)} is in ${T.unit}, but ${v(T.y)} alone counts ${T.yw}: you can’t add those.` },
    { t: `${dec(T.px)} + ${dec(T.py)} + ${v(T.x)} + ${v(T.y)} = ${dec(tot)}`, mc: MC.unlike, say: `That adds ${T.unit} to counts. Each count needs its own ${T.kind === 'money' ? 'price' : 'size'} as a factor.` },
  ];
  const lead = T.kind === 'money' ? `The total was exactly ${money(tot)}` : T.kind === 'min' ? `The oven ran exactly ${tot} minutes` : `The load was exactly ${tot} lb`;
  return choice(R, { id: `unitCheck-${n}`, family: 'unitCheck', board: `\\text{${T.unit} with ${T.unit}}`, prompt: `${twoStory(T, 'up to')} ${lead}. With ${twoDefs(T)}, which equation adds quantities with the same unit?`,
    solution: [`${dec(T.px)}${v(T.x)} is ${T.unit} and ${dec(T.py)}${v(T.y)} is ${T.unit}: they can be added and compared with ${dec(tot)} ${T.unit}.`] }, opts);
};

// =====================================================================================================================
// 7 one-var-equation
// =====================================================================================================================
interface Fee { story: (rel: string) => string; x: string; F: number; r: number; T: number; D: number; unit: string; dWords: string }
function fee(R: () => number, decimals = false): Fee {
  const k = pick(R, ['plumber', 'bike', 'phone', 'taxi'] as const);
  const r = decimals ? pick(R, [3.75, 2.5, 4.25, 1.5]) : int(R, 3, 9), F = decimals ? pick(R, [12.5, 8.75, 15.5]) : int(R, 2, 6) * 5, s = int(R, 2, 9), T = Math.round((F + r * s) * 100) / 100;
  if (k === 'plumber') { const D = pick(R, [12, 18, 25]); return { x: 'h', F, r, T, D, unit: 'hours', dWords: `${D} miles`, story: rl => `A plumber charges ${money(F)} for the visit plus ${money(r)} per hour. The house is ${D} miles away. The bill is ${rl} ${money(T)} for ${v('h')} hours.` }; }
  if (k === 'bike') { const D = pick(R, [21, 18, 24]); return { x: 'h', F, r, T, D, unit: 'hours', dWords: `${D} gears`, story: rl => `A bike rental costs ${money(F)} to start plus ${money(r)} per hour. The bike has ${D} gears. The rental is ${rl} ${money(T)} for ${v('h')} hours.` }; }
  if (k === 'phone') { const D = pick(R, [64, 128, 256]); return { x: 'g', F, r, T, D, unit: 'GB', dWords: `${D} GB of storage`, story: rl => `A phone plan costs ${money(F)} a month plus ${money(r)} per GB of data. The phone has ${D} GB of storage. The bill is ${rl} ${money(T)} for ${v('g')} GB.` }; }
  const D = pick(R, [4, 3, 5]);
  return { x: 'm', F, r, T, D, unit: 'miles', dWords: `${D} seats`, story: rl => `A taxi charges ${money(F)} plus ${money(r)} per mile. The car has ${D} seats. The fare is ${rl} ${money(T)} for ${v('m')} miles.` };
}
const feeRate: Gen = (R, n) => {
  const Fe = fee(R, R() < 0.35), x = v(Fe.x);
  const opts: Opt[] = [
    { t: `${dec(Fe.F)} + ${dec(Fe.r)}${x} = ${dec(Fe.T)}`, ok: true, say: 'Yes: the fixed charge once, plus the rate times the unknown.' },
    { t: `${dec(Fe.F)}${x} + ${dec(Fe.r)} = ${dec(Fe.T)}`, mc: MC.wordOrder, say: `The ${money(Fe.r)} is charged for EACH unit, so it multiplies ${x}; the ${money(Fe.F)} is charged once.` },
    { t: `${dec(Fe.r)}${x} = ${dec(Fe.T)}`, mc: MC.dropStart, say: `The ${money(Fe.F)} is charged too: add it to ${dec(Fe.r)}${x}.` },
    { t: `${dec(Fe.F)} + ${dec(Fe.r)}${x} + ${Fe.D} = ${dec(Fe.T)}`, mc: MC.everyNum, say: `The ${Fe.dWords} is not part of the cost. Not every number in a story belongs in the equation.` },
  ];
  return choice(R, { id: `feeRate-${n}`, family: 'feeRate', board: `\\text{exactly } \\$${decT(Fe.T)}`, prompt: `${Fe.story('exactly')} Which equation fits?`,
    solution: [`Define ${x} = the number of ${Fe.unit}. The cost is ${money(Fe.F)} once plus ${money(Fe.r)} for each: ${dec(Fe.F)} + ${dec(Fe.r)}${x}.`, `“Exactly ${money(Fe.T)}”: ${dec(Fe.F)} + ${dec(Fe.r)}${x} = ${dec(Fe.T)}.`] }, opts);
};
const groupEq: Gen = (R, n) => {
  const k = int(R, 3, 8), q = int(R, 2, 6), t = int(R, 5, 20), T = k * (t + q);
  const c = pick(R, [
    { s: `${k} friends each buy a movie ticket for ${v('t')} dollars and a $${q} snack. Together they pay exactly $${T}.`, x: 't' },
    { s: `A coach buys ${k} kits. Each kit is a ball for ${v('b')} dollars and a $${q} pump. The total is exactly $${T}.`, x: 'b' },
    { s: `Each of ${k} shelves holds ${v('n')} books plus ${q} binders. There are exactly ${T} items on the shelves.`, x: 'n' },
  ]);
  const x = v(c.x);
  const opts: Opt[] = [
    { t: `${k}(${x} + ${q}) = ${T}`, ok: true, say: `Yes: ${k} equal groups, each worth ${x} + ${q}.` },
    { t: `${k}${x} + ${q} = ${T}`, say: `The ${q} comes ${k} times, once per group: group first, ${k}(${x} + ${q}).` },
    { t: `${x} + ${q} = ${T}`, say: `That is one group. There are ${k} of them.` },
    { t: `${k} + ${x} + ${q} = ${T}`, mc: MC.wordOrder, say: `${k} is the number of groups: it multiplies each group, it is not added.` },
  ];
  return choice(R, { id: `groupEq-${n}`, family: 'groupEq', board: `${k}\\ \\text{groups, exactly } ${T}`, prompt: `${c.s} Which equation fits?`,
    solution: [`One group is worth ${x} + ${q}.`, `${k} equal groups: ${k}(${x} + ${q}), and that is exactly ${T}.`] }, opts);
};

// =====================================================================================================================
// 8 one-var-inequality
// =====================================================================================================================
const rateIneq: Gen = (R, n) => {
  const c = pick(R, [
    { s: (r: number, B: number) => `A car drives at ${r} mph. The driver wants to cover at least ${B} miles in ${v('t')} hours.`, r: () => pick(R, [45, 55, 60, 65]), B: () => pick(R, [300, 330, 400]), rel: '>=' as Rel, x: 't', p: 'at least' },
    { s: (r: number, B: number) => `A pump fills a tank at ${r} gallons per minute. The tank holds no more than ${B} gallons. It runs ${v('m')} minutes.`, r: () => pick(R, [8, 12, 15]), B: () => pick(R, [200, 240, 300]), rel: '<=' as Rel, x: 'm', p: 'no more than' },
    { s: (r: number, B: number) => `Each item costs ${r}${v('p')} dollars with tax, where ${v('p')} is the price before tax. You can spend at most $${B}.`, r: () => pick(R, [1.07, 1.06, 1.08]), B: () => pick(R, [40, 50, 60]), rel: '<=' as Rel, x: 'p', p: 'at most' },
    { s: (r: number, B: number) => `Mia reads ${r} pages an hour. She wants to read more than ${B} pages in ${v('h')} hours.`, r: () => pick(R, [25, 30, 40]), B: () => pick(R, [200, 240, 300]), rel: '>' as Rel, x: 'h', p: 'more than' },
  ]);
  const r = c.r(), B = c.B(), x = v(c.x), w = c.rel;
  const f = (rr: Rel) => `${dec(r)}${x} ${relH(rr)} ${B}`;
  const opts: Opt[] = [
    { t: f(w), ok: true, say: `Yes: rate times ${c.x === 'p' ? 'price' : 'time'}, “${c.p}” is ${relH(w)}.` },
    { t: f(flip(w)), mc: MC.reversed, say: relSay(w, flip(w), c.p) },
    { t: f('='), mc: MC.eqBound, say: relSay(w, '=', c.p) },
    { t: f(otherStrict(w)), mc: relMc(w, otherStrict(w)), say: relSay(w, otherStrict(w), c.p) },
  ];
  return choice(R, { id: `rateIneq-${n}`, family: 'rateIneq', board: `\\text{${c.p} } ${B}`, prompt: `${c.s(r, B)} Which inequality fits?`,
    solution: [`The amount is ${dec(r)} times ${x}: ${dec(r)}${x}.`, `“${c.p} ${B}”: ${dec(r)}${x} ${relH(w)} ${B}.`] }, opts);
};
const feeIneq: Gen = (R, n) => {
  const Fe = fee(R, false), x = v(Fe.x);
  const P = pick(R, [{ p: 'no more than', r: '<=' as Rel }, { p: 'at most', r: '<=' as Rel }, { p: 'less than', r: '<' as Rel }, { p: 'at least', r: '>=' as Rel }]);
  const f = (rr: Rel, fixed = true) => `${fixed ? `${dec(Fe.F)} + ` : ''}${dec(Fe.r)}${x} ${relH(rr)} ${dec(Fe.T)}`;
  const opts: Opt[] = [
    { t: f(P.r), ok: true, say: 'Yes: fixed part plus the rate times the unknown, with the right symbol.' },
    { t: f(P.r, false), mc: MC.dropStart, say: `The ${money(Fe.F)} is part of the bill too.` },
    { t: f(flip(P.r)), mc: MC.reversed, say: relSay(P.r, flip(P.r), P.p) },
    { t: f(otherStrict(P.r)), mc: relMc(P.r, otherStrict(P.r)), say: relSay(P.r, otherStrict(P.r), P.p) },
  ];
  return choice(R, { id: `feeIneq-${n}`, family: 'feeIneq', board: `\\text{${P.p} } \\$${decT(Fe.T)}`, prompt: `${Fe.story(P.p)} Which inequality fits?`,
    solution: [`The bill: ${dec(Fe.F)} + ${dec(Fe.r)}${x}.`, `“${P.p} ${money(Fe.T)}”: ${f(P.r)}.`] }, opts);
};

// =====================================================================================================================
// 9 two-var-resource
// =====================================================================================================================
const budget2: Gen = (R, n) => {
  const T = two(R, R() < 0.5), P = pick(R, [{ p: 'at most', r: '<=' as Rel }, { p: 'no more than', r: '<=' as Rel }]);
  const X = v(T.x), Y = v(T.y);
  const f = (a: number, b: number, rr: Rel) => `${a === 1 ? '' : dec(a)}${X} + ${b === 1 ? '' : dec(b)}${Y} ${relH(rr)} ${T.B}`;
  const opts: Opt[] = [
    { t: f(T.px, T.py, P.r), ok: true, say: `Yes: each count times its ${T.kind === 'money' ? 'price' : 'size'}, added, ${relH(P.r)} ${T.B}.` },
    { t: f(T.py, T.px, P.r), mc: MC.swapRates, say: `${dec(T.px)} belongs to ${T.xw} (${X}) and ${dec(T.py)} to ${T.yw} (${Y}).` },
    { t: f(1, 1, P.r), mc: T.kind === 'money' ? MC.countValue : MC.unlike, say: `${X} + ${Y} counts items; ${T.B} is in ${T.unit}. Multiply each count first.` },
    { t: f(T.px, T.py, flip(P.r)), mc: MC.reversed, say: relSay(P.r, flip(P.r), P.p) },
  ];
  return choice(R, { id: `budget2-${n}`, family: 'budget2', board: twoBoard(T, P.p), prompt: `${twoStory(T, P.p)} With ${twoDefs(T)}, which inequality fits?`,
    solution: [`${Cap(T.unit)} for ${T.xw}: ${dec(T.px)}${X}. For ${T.yw}: ${dec(T.py)}${Y}.`, `Together ${P.p} ${T.B}: ${f(T.px, T.py, P.r)}.`] }, opts);
};
const total2: Gen = (R, n) => {
  const T0 = two(R, false), exact = R() < 0.5;
  // an exact total must be reachable with whole numbers of both kinds
  const T = exact ? { ...T0, B: (() => { for (let k = 0; k < 60; k++) { const B = int(R, 2, 8) * T0.px + int(R, 2, 8) * T0.py; if (B >= T0.B * 0.6 && B <= T0.B * 1.3) return B; } return 3 * T0.px + 4 * T0.py; })() } : T0;
  const X = v(T.x), Y = v(T.y), w: Rel = exact ? '=' : '<=';
  const f = (a: number, b: number, rr: Rel) => `${a === 1 ? '' : dec(a)}${X} + ${b === 1 ? '' : dec(b)}${Y} ${relH(rr)} ${T.B}`;
  const story = T.kind === 'money' ? `${Cap(T.xw)} cost ${money(T.px)} each and ${T.yw} ${money(T.py)} each. You spend ${exact ? 'a total of exactly' : 'at most'} ${money(T.B)}.`
    : T.kind === 'min' ? `One of the ${T.xw} takes ${T.px} minutes and one of the ${T.yw} takes ${T.py} minutes. The oven runs for ${exact ? 'a total of exactly' : 'at most'} ${T.B} minutes.`
      : `A small box weighs ${T.px} lb and a large box ${T.py} lb. The cart carries ${exact ? 'a total of exactly' : 'at most'} ${T.B} lb.`;
  const opts: Opt[] = [
    { t: f(T.px, T.py, w), ok: true, say: exact ? 'Yes: “a total of exactly” is =.' : 'Yes: “at most” is ≤.' },
    { t: f(T.py, T.px, w), mc: MC.swapRates, say: `Each count goes with its own ${T.kind === 'money' ? 'price' : 'size'}: ${dec(T.px)} with ${X}.` },
    { t: f(1, 1, w), mc: T.kind === 'money' ? MC.countValue : MC.unlike, say: `${X} + ${Y} counts items, not ${T.unit}.` },
    { t: f(T.px, T.py, exact ? '<=' : '='), mc: exact ? undefined : MC.eqBound, say: exact ? '“A total of exactly” pins the amount down: =.' : '“At most” allows less too: ≤, not =.' },
  ];
  return choice(R, { id: `total2-${n}`, family: 'total2', board: `\\text{${exact ? 'exactly' : 'at most'} } ${T.B}`, prompt: `${story} With ${twoDefs(T)}, which ${exact ? 'equation' : 'inequality'} fits?`,
    solution: [`Each count times its ${T.kind === 'money' ? 'price' : 'size'}: ${dec(T.px)}${X} + ${dec(T.py)}${Y} (both in ${T.unit}).`, `${exact ? '“A total of exactly”: =' : '“At most”: ≤'} ${T.B}.`] }, opts);
};

// =====================================================================================================================
// 10 two-var-comparison
// =====================================================================================================================
const PAIRS = [
  { a: 'students', A: 'S', b: 'teachers', B: 'T' }, { a: 'cars', A: 'C', b: 'trucks', B: 'K' }, { a: 'fans', A: 'F', b: 'players', B: 'P' },
  { a: 'red beads', A: 'r', b: 'blue beads', B: 'b' }, { a: 'vegetables', A: 'v', b: 'fruits', B: 'f' },
] as const;
const timesAsMany: Gen = (R, n) => {
  const P = pick(R, PAIRS), k = int(R, 2, 6), form = pick(R, ['times', 'times', 'every', 'more'] as const);
  const A = v(P.A), B = v(P.B);
  const sent = form === 'times' ? `There are ${k} times as many ${P.a} as ${P.b}.` : form === 'every' ? `For every one of the ${P.b} there are ${k} ${P.a}.` : `There are ${k} more ${P.a} than ${P.b}.`;
  const opts: Opt[] = form === 'more' ? [
    { t: `${A} = ${B} + ${k}`, ok: true, say: `Yes: the ${P.a} are the bigger group, ${k} more.` },
    { t: `${A} + ${k} = ${B}`, say: `That makes the ${P.b} the bigger group. Test it: ${P.b} = 10 gives ${10 - k} ${P.a}.` },
    { t: `${A} = ${k}${B}`, say: `“${k} more” adds ${k}; it does not multiply.` },
  ] : [
    { t: `${A} = ${k}${B}`, ok: true, say: `Yes: test it with 1 of the ${P.b}: ${A} = ${k}.` },
    { t: `${k}${A} = ${B}`, mc: MC.revComp, say: `Test it: 1 of the ${P.b} would give ${A} = 1/${k}. The ${k} belongs to the SMALLER group’s letter: ${A} = ${k}${B}.` },
    { t: `${A} = ${B} + ${k}`, say: `“Times as many” multiplies; it does not add.` },
    { t: `${A} + ${B} = ${k}`, say: `That says there are ${k} altogether.` },
  ];
  return choice(R, { id: `timesAsMany-${n}`, family: 'timesAsMany', board: `${P.A} = \\text{${P.a}},\\ ${P.B} = \\text{${P.b}}`, prompt: `${sent} With ${A} = the number of ${P.a} and ${B} = the number of ${P.b}, which equation fits?`,
    solution: [`Check with a number: say there are 2 ${P.b}.`, form === 'more' ? `Then there are ${2 + k} ${P.a}: ${A} = ${B} + ${k}.` : `Then there are ${2 * k} ${P.a}: ${A} = ${k}${B}.`] }, opts);
};
const atLeastTwice: Gen = (R, n) => {
  const P = pick(R, PAIRS), k = int(R, 2, 4), Q = pick(R, [{ p: 'at least', r: '>=' as Rel }, { p: 'no more than', r: '<=' as Rel }, { p: 'at least', r: '>=' as Rel }]);
  const A = v(P.A), B = v(P.B), K = k === 2 ? 'twice' : `${k} times`;
  const opts: Opt[] = [
    { t: `${A} ${relH(Q.r)} ${k}${B}`, ok: true, say: `Yes: ${k}${B} is the bound, “${Q.p}” is ${relH(Q.r)}.` },
    { t: `${k}${A} ${relH(Q.r)} ${B}`, mc: MC.revComp, say: `The ${k} multiplies the ${P.b}: the bound is ${k}${B}. Test with 1 of the ${P.b}.` },
    { t: `${A} ${relH(flip(Q.r))} ${k}${B}`, mc: MC.reversed, say: relSay(Q.r, flip(Q.r), Q.p) },
    { t: `${A} = ${k}${B}`, mc: MC.eqBound, say: relSay(Q.r, '=', Q.p) },
  ];
  return choice(R, { id: `atLeastTwice-${n}`, family: 'atLeastTwice', board: `\\text{${Q.p} ${K} as many}`, prompt: `A display must have ${Q.p} ${K} as many ${P.a} as ${P.b}. With ${A} and ${B} the numbers of each, which inequality fits?`,
    solution: [`“${K} as many ${P.a} as ${P.b}” is the amount ${k}${B}.`, `${Cap(P.a)} ${Q.p} that: ${A} ${relH(Q.r)} ${k}${B}.`] }, opts);
};
const compareCheck: Gen = (R, n) => {
  const P = pick(R, PAIRS), k = int(R, 2, 6), t = int(R, 3, 12);
  return numItem({ id: `compareCheck-${n}`, family: 'compareCheck', board: `${P.A} = ${k}${P.B}`, unit: P.a,
    prompt: `There are ${k} times as many ${P.a} as ${P.b}, so ${v(P.A)} = ${k}${v(P.B)}. Check the equation with a number: if there are ${t} ${P.b}, how many ${P.a} are there?`,
    solution: [`Put ${v(P.B)} = ${t} in: ${v(P.A)} = ${k}(${t}) = ${ans(k * t)}.`, `More ${P.a} than ${P.b}, as the sentence says.`] }, k * t,
    `Yes: ${k * t}. The equation matches the sentence.`, [[t / k, MC.revComp, `That has fewer ${P.a} than ${P.b}. “${k} times as many ${P.a}” means MORE ${P.a}.`], [t + k, undefined, `“Times as many” multiplies: ${k} × ${t}.`]], `Multiply: ${k} × ${t}.`);
};

// =====================================================================================================================
// 11 implicit-bounds
// =====================================================================================================================
const QUANT = [
  { q: 'the number of hours a student works this week', x: 'h', ok: `${v('h')} ≥ 0`, opts: [[`${v('h')} &gt; 0`, MC.positive, 'Zero hours is possible: a week off.'], ['No bound: any number works', MC.allReals, 'Negative hours make no sense.'], [`${v('h')} ≥ 1`, MC.positive, 'Zero hours is possible.']], zero: true, neg: false, max: 0 },
  { q: 'the side length of a square tile, in inches', x: 'L', ok: `${v('L')} &gt; 0`, opts: [[`${v('L')} ≥ 0`, undefined, 'A tile with side 0 is not a tile: lengths are strictly positive.'], ['No bound: any number works', MC.allReals, 'A negative length makes no sense.'], [`${v('L')} ≥ 1`, undefined, 'A tile can be smaller than an inch.']], zero: false, neg: false, max: 0 },
  { q: 'the percentage of seats filled in a theater', x: 'p', ok: `0 ≤ ${v('p')} ≤ 100`, opts: [[`${v('p')} ≥ 0`, MC.allReals, 'More than 100% of the seats can’t be filled.'], [`0 &lt; ${v('p')} &lt; 100`, MC.positive, 'An empty or a full theater is possible: 0 and 100 count.'], ['No bound: any number works', MC.allReals, 'A percentage of seats runs from 0 to 100.']], zero: true, neg: false, max: 100 },
  { q: 'the number of riders on a 48-seat bus', x: 'n', ok: `0 ≤ ${v('n')} ≤ 48`, opts: [[`${v('n')} ≥ 0`, MC.allReals, 'The bus has only 48 seats.'], [`0 &lt; ${v('n')} ≤ 48`, MC.positive, 'An empty bus is possible.'], [`${v('n')} ≤ 48`, MC.allReals, 'A negative number of riders makes no sense.']], zero: true, neg: false, max: 48 },
  { q: 'the noon temperature in Fairbanks, Alaska, in January, in °F', x: 't', ok: 'No sign bound: it can be 0 or negative', opts: [[`${v('t')} ≥ 0`, MC.positive, 'Fairbanks in January is often below 0 °F.'], [`${v('t')} &gt; 0`, MC.positive, 'Temperatures in °F can be 0 or negative.'], [`${v('t')} ≥ 32`, undefined, 'Below freezing is common there.']], zero: true, neg: true, max: 0 },
  { q: 'the number of minutes a phone call lasts', x: 'm', ok: `${v('m')} ≥ 0`, opts: [[`${v('m')} &gt; 0`, MC.positive, 'A call can last 0 minutes (it was not picked up).'], ['No bound: any number works', MC.allReals, 'A negative time makes no sense.'], [`${v('m')} ≥ 1`, MC.positive, 'A call can be shorter than a minute.']], zero: true, neg: false, max: 0 },
] as const;
/** the bus gets a random size; the others a random setting in the wording */
function withSeats(R: () => number, Q: (typeof QUANT)[number]): { q: string; x: string; ok: string; opts: readonly (readonly [string, string | undefined, string])[]; zero: boolean; neg: boolean; max: number } {
  if (Q.max === 48) {
    const S = pick(R, [36, 44, 48, 52, 56]);
    return { ...Q, q: `the number of riders on a ${S}-seat bus`, ok: `0 ≤ ${v('n')} ≤ ${S}`, max: S, opts: [[`${v('n')} ≥ 0`, MC.allReals, `The bus has only ${S} seats.`], [`0 &lt; ${v('n')} ≤ ${S}`, MC.positive, 'An empty bus is possible.'], [`${v('n')} ≤ ${S}`, MC.allReals, 'A negative number of riders makes no sense.']] };
  }
  const who = pick(R, ['Ava', 'Ben', 'Kai', 'Lena', 'Omar', 'Rosa']);
  return { ...Q, q: Q.q.replace('a student', who).replace('a phone call', `${who}’s phone call`).replace('a square tile', `${who}’s square tile`).replace('a theater', `${who}’s school theater`), opts: Q.opts };
}
const unstatedBound: Gen = (R, n) => {
  const Q = withSeats(R, pick(R, QUANT));
  const opts: Opt[] = [{ t: Q.ok, ok: true, say: 'Yes: that is what the situation itself allows.' }, ...Q.opts.map(([t, mc, say]) => ({ t, mc, say }))];
  return choice(R, { id: `unstatedBound-${n}`, family: 'unstatedBound', board: `${Q.x} = \\ ?`, prompt: `${v(Q.x)} is ${Q.q}. No bound is stated. Which bound does the situation itself add?`,
    solution: ['Ask: can it be 0? Can it be negative? Is there a largest value?', `So: ${Q.ok}.`] }, opts);
};
const boundCandidate: Gen = (R, n) => {
  const Q = withSeats(R, pick(R, QUANT)), kind = pick(R, ['zero', 'neg', Q.max ? 'over' : 'neg', 'mid'] as const);
  const c = kind === 'zero' ? 0 : kind === 'neg' ? -pick(R, [2, 5, 10]) : kind === 'over' ? Q.max + pick(R, [2, 10]) : (Q.max ? Math.round(Q.max / 2) : pick(R, [3, 7, 12]));
  const okv = kind === 'zero' ? Q.zero : kind === 'neg' ? Q.neg : kind === 'over' ? false : true;
  const why = kind === 'zero' ? (Q.zero ? 'zero is possible here' : 'a length of 0 is no tile') : kind === 'neg' ? (Q.neg ? 'temperatures can be negative' : 'a negative value makes no sense here') : kind === 'over' ? `there is a largest value, ${Q.max}` : 'it is a typical value';
  const opts: Opt[] = [
    { t: `Yes: ${okv ? why : 'any number fits a formula'}`, ok: okv, mc: okv ? undefined : MC.allReals, say: okv ? `Yes: ${why}.` : `A formula takes any number, but the situation does not: ${why}.` },
    { t: `No: ${okv ? 'real quantities must be positive' : why}`, ok: !okv, mc: okv ? MC.positive : undefined, say: okv ? `Not every real quantity has to be positive: ${why}.` : `Right: ${why}.` },
  ];
  return choice(R, { id: `boundCandidate-${n}`, family: 'boundCandidate', board: `${Q.x} = ${c}`, prompt: `${v(Q.x)} is ${Q.q}. Can ${v(Q.x)} = ${dec(c)} happen?`,
    solution: [`Think about the situation, not the formula: ${why}.`] }, opts);
};

// =====================================================================================================================
// 12 discrete-vs-continuous
// =====================================================================================================================
const KINDS = [
  { q: 'the number of buses rented', x: 'b', disc: true, why: 'you can’t rent part of a bus' },
  { q: 'the number of tickets sold', x: 't', disc: true, why: 'tickets come whole' },
  { q: 'the number of people at a party', x: 'p', disc: true, why: 'people come whole' },
  { q: 'the amount of gas pumped, in gallons', x: 'g', disc: false, why: 'a pump can stop at 7.4 gallons' },
  { q: 'the weight of grapes bought, in pounds (sold by weight)', x: 'w', disc: false, why: 'grapes can weigh 2.35 lb' },
  { q: 'the rental hours bought, when any part of an hour can be bought and is charged by the minute', x: 'h', disc: false, why: 'a rental can be 1.5 hours' },
  { q: 'the length of ribbon cut from a roll, in feet', x: 'f', disc: false, why: 'ribbon can be cut at 3.25 ft' },
] as const;
const discreteOrNot: Gen = (R, n) => {
  const K = pick(R, KINDS), B = pick(R, [5, 6, 8, 10]);
  const opts: Opt[] = [
    { t: `Separated values: only whole numbers, 0, 1, 2, …`, ok: K.disc, mc: K.disc ? undefined : MC.mustWhole, say: K.disc ? `Yes: ${K.why}.` : `Not here: ${K.why}. A variable is not always a whole number.` },
    { t: `Any value in a range: parts like 2.5 make sense`, ok: !K.disc, mc: K.disc ? MC.fracCount : undefined, say: K.disc ? `No: ${K.why}. Write “${K.x} a whole number”.` : `Yes: ${K.why}.` },
  ];
  return choice(R, { id: `discreteOrNot-${n}`, family: 'discreteOrNot', board: `0 \\le ${K.x} \\le ${B}`, prompt: `${v(K.x)} is ${K.q}, with <b>0 ≤ ${v(K.x)} ≤ ${B}</b>. Which values can ${v(K.x)} take?`,
    solution: [`Ask: does a part of one make sense? ${Cap(K.why)}.`, K.disc ? `So: separated values, ${v(K.x)} a whole number.` : 'So: any value in the range.'],
    picture: { line: line1(K.x, K.disc ? undefined : inter(ray('>=', 0), ray('<=', B)), [0, B], K.disc ? { dots: wholeIn(0, B) } : {}) } }, opts);
};
const fracValue: Gen = (R, n) => {
  const K = pick(R, KINDS), B = pick(R, [6, 8, 10]), c = int(R, 1, B - 2) + pick(R, [0.5, 0.25, 0.4]);
  const opts: Opt[] = [
    { t: `Yes: ${dec(c)} is in the range and a part makes sense`, ok: !K.disc, mc: K.disc ? MC.fracCount : undefined, say: K.disc ? `It is in the range, but ${K.why}.` : `Yes: ${K.why}.` },
    { t: `No: ${K.disc ? K.why : 'variables are whole numbers'}`, ok: K.disc, mc: K.disc ? undefined : MC.mustWhole, say: K.disc ? `Right: ${K.why}.` : `Not every variable is a whole number: ${K.why}.` },
  ];
  return choice(R, { id: `fracValue-${n}`, family: 'fracValue', board: `${K.x} = ${decT(c)}`, prompt: `${v(K.x)} is ${K.q}, and the budget allows <b>${v(K.x)} ≤ ${B}</b>. Is ${v(K.x)} = ${dec(c)} a sensible value?`,
    solution: [`${dec(c)} ≤ ${B}: the bound is fine.`, `But does a part make sense? ${Cap(K.why)}.`],
    picture: { line: line1(K.x, K.disc ? undefined : inter(ray('>=', 0), ray('<=', B)), [0, B], { ...(K.disc ? { dots: wholeIn(0, B) } : {}), tests: [{ v: c, ok: !K.disc }] }) } }, opts);
};

// =====================================================================================================================
// 13 assemble-system   14 viability-of-candidates
// =====================================================================================================================
interface Sys { story: string; x: string; y: string; defs: string; rules: { words: string; con: Con }[]; restrict: Con; N: number; m: number; B: number; px: number; py: number; xw: string; yw: string }
function sys(R: () => number): Sys {
  const k = pick(R, ['tickets', 'snacks', 'plants'] as const);
  if (k === 'snacks') {
    // the A-CED.A.3 nutrition-and-cost kind: protein at least P, cost at most B
    const pg = pick(R, [6, 8]), py = pick(R, [9, 12]), cg = pick(R, [1.5, 2]), cy = pick(R, [1, 1.25]), P = pick(R, [40, 48, 54]), B = pick(R, [10, 12, 14]);
    return { story: `For a hike you pack granola bars (${pg} g of protein, ${money(cg)} each) and yogurt cups (${py} g of protein, ${money(cy)} each). You want at least ${P} g of protein and can spend at most ${money(B)}.`,
      x: 'g', y: 'y', defs: `${v('g')} = the number of granola bars, ${v('y')} = the number of yogurt cups`, xw: 'granola bars', yw: 'yogurt cups', N: 0, m: P, B, px: cg, py: cy,
      rules: [{ words: `at least ${P} g of protein`, con: rel(lin({ g: pg, y: py }), '>=', num(P)) }, { words: `spend at most ${money(B)}`, con: rel(lin({ g: cg, y: cy }), '<=', num(B)) }],
      restrict: whole('g', 'y') };
  }
  const N = int(R, 8, 12), m = int(R, 2, 4);
  if (k === 'tickets') {
    const px = pick(R, [8, 9, 10]), py = pick(R, [4, 5, 6]), B = px * m + py * (N - m) + pick(R, [6, 10, 12, 15]);
    return { story: `A club buys exactly ${N} tickets: adult tickets at $${px} and student tickets at $${py}. At least ${m} must be adult tickets, and it can spend at most $${B}.`,
      x: 'a', y: 's', defs: `${v('a')} = the number of adult tickets, ${v('s')} = the number of student tickets`, xw: 'adult tickets', yw: 'student tickets', N, m, B, px, py,
      rules: [{ words: `exactly ${N} tickets`, con: rel(lin({ a: 1, s: 1 }), '=', num(N)) }, { words: `at least ${m} adult tickets`, con: rel(lin({ a: 1 }), '>=', num(m)) }, { words: `spend at most $${B}`, con: rel(lin({ a: px, s: py }), '<=', num(B)) }],
      restrict: whole('a', 's') };
  }
  const px = pick(R, [4, 5]), py = pick(R, [2, 3]), B = px * m + py * (N - m) + pick(R, [4, 6, 8]);
  return { story: `A garden club plants exactly ${N} plants: tomatoes at $${px} and peppers at $${py}. At least ${m} must be tomatoes, and the budget is at most $${B}.`,
    x: 't', y: 'p', defs: `${v('t')} = the number of tomato plants, ${v('p')} = the number of pepper plants`, xw: 'tomato plants', yw: 'pepper plants', N, m, B, px, py,
    rules: [{ words: `exactly ${N} plants`, con: rel(lin({ t: 1, p: 1 }), '=', num(N)) }, { words: `at least ${m} tomatoes`, con: rel(lin({ t: 1 }), '>=', num(m)) }, { words: `spend at most $${B}`, con: rel(lin({ t: px, p: py }), '<=', num(B)) }],
    restrict: whole('t', 'p') };
}
const sysCons = (S: Sys) => [...S.rules.map(r => r.con), S.restrict];
const sysH = (cs: Con[]) => cs.map(conH).join('; ');
function sysTable(S: Sys, cands: Vals[], texShown = true): TablePic {
  return { head: `(${S.x},\\,${S.y})`, headWords: 'the rule', texShown,
    cands: cands.map((c, i) => ({ key: 'k' + i, label: candT(c, [S.x, S.y]), v: c })),
    rows: [...S.rules.map((r, i) => ({ key: 'r' + i, words: r.words, tex: conT(r.con), con: r.con })), { key: 'w', words: 'whole numbers, not negative', tex: `${S.x},\\,${S.y}\\ \\text{whole}`, con: S.restrict }], all: true };
}
/** a candidate of a given kind: viable, fractional, negative, or breaking exactly stated rule i */
function sysCand(R: () => number, S: Sys, kind: 'ok' | 'frac' | 'neg' | number): Vals | null {
  const cs = sysCons(S), pool: Vals[] = [];
  const steps = kind === 'frac' ? [0.5] : [1];
  for (let x = kind === 'neg' ? -3 : 0; x <= 14; x += steps[0]!) for (let y = kind === 'neg' ? -3 : 0; y <= 14; y += steps[0]!) {
    const V = { [S.x]: x, [S.y]: y }, br = broken(cs, V);
    const fr = !Number.isInteger(x) || !Number.isInteger(y), ng = x < 0 || y < 0;
    if (kind === 'ok' ? br.length === 0 : kind === 'frac' ? fr && !ng && br.length === 1 && br[0] === cs.length - 1 : kind === 'neg' ? ng && !fr && br.length === 1 && br[0] === cs.length - 1 : !fr && !ng && br.length === 1 && br[0] === kind) pool.push(V);
  }
  return pool.length ? pick(R, pool) : null;
}
const systemPick: Gen = (R, n) => {
  for (;;) {
    const S = sys(R);
    if (S.N === 0) continue;   // the ticket and plant systems have a count rule to drop or merge
    const X = v(S.x), Y = v(S.y), [cN, cM, cB] = S.rules.map(r => conH(r.con)) as [string, string, string];
    const rest = `${X}, ${Y} whole numbers`;
    const opts: Opt[] = [
      { t: `${cN}; ${cM}; ${cB}; ${rest}`, ok: true, say: 'Yes: every condition, with one letter per quantity, and the whole-number restriction.' },
      { t: `${cM}; ${cB}; ${rest}`, mc: MC.dropCon, say: `The story also says exactly ${S.N}: ${cN}. Every condition needs its own line.` },
      { t: `${S.px}${X} + ${S.py}${Y} ≤ ${S.B + S.N}; ${cM}; ${rest}`, mc: MC.merge, say: `A count and a cost can’t be added into one rule: dollars plus ${S.xw.split(' ').pop()}. Keep ${cN} and ${cB} apart.` },
      { t: `${S.px}${v('x')} + ${S.py}${v('x')} ≤ ${S.B}; ${v('x')} + ${v('x')} = ${S.N}; ${v('x')} ≥ ${S.m}`, mc: MC.oneLetter, say: `One letter for two quantities forces them to be equal. Use ${X} and ${Y}.` },
      { t: `${cN}; ${cM}; ${cB}`, mc: MC.allReals, say: `Without “whole numbers” the model allows ${S.m + 0.5} ${S.xw}. Add the restriction.` },
    ];
    const good = sysCand(R, S, 'ok'), bad = sysCand(R, S, 0);
    if (!good || !bad) continue;
    return choice(R, { id: `systemPick-${n}`, family: 'systemPick', board: '\\text{the whole model}', picture: { table: sysTable(S, [good, bad], false) },
      prompt: `${S.story} With ${S.defs}, which is the complete model?`,
      solution: ['One line per condition in the story, the same letters throughout.', `${cN}; ${cM}; ${cB}; and ${rest}.`] }, shuffle(R, opts.slice(1)).slice(0, 3).concat(opts[0]!));
  }
};
const missingCon: Gen = (R, n) => {
  for (;;) {
    const S = sys(R), cs = sysCons(S), miss = int(R, 0, cs.length - 1), shown = cs.filter((_, i) => i !== miss);
    const M = cs[miss]!;
    const opts: Opt[] = [
      { t: conH(M), ok: true, say: 'Yes: that condition is in the story but not in the model.' },
      { t: 'Nothing: the model is complete', mc: M.kind === 'whole' ? MC.allReals : MC.dropCon, say: M.kind === 'whole' ? 'Counts must be whole numbers: say so.' : 'Check each sentence of the story against the model.' },
      { t: conH(shown[0]!), say: 'That one is already in the model.' },
    ];
    if (M.kind === 'rel') opts.push({ t: conH({ ...M, rel: M.rel === '=' ? '<=' : flip(M.rel) }), mc: M.rel === '=' ? undefined : MC.reversed, say: 'Close, but the symbol does not match the words.' });
    else opts.push({ t: `${v(S.x)}, ${v(S.y)} &gt; 0`, mc: MC.positive, say: 'Zero is possible here; the missing piece is that they are whole numbers.' });
    const good = sysCand(R, S, 'ok');
    if (!good) continue;
    return choice(R, { id: `missingCon-${n}`, family: 'missingCon', board: '\\text{what is missing?}',
      prompt: `${S.story} (${S.defs}.) A model reads: <b>${sysH(shown)}</b>. Which condition is missing?`,
      solution: ['Go through the story sentence by sentence and find each one in the model.', `Not there: ${conH(M)}.`] }, opts);
  }
};
const failWhy = (S: Sys, V: Vals): { t: string; mc?: string } => {
  const cs = sysCons(S), br = broken(cs, V);
  if (!br.length) return { t: 'Viable: it meets every condition' };
  const i = br[0]!;
  if (i === cs.length - 1) {
    const x = V[S.x]!, y = V[S.y]!;
    return x < 0 || y < 0 ? { t: `Not viable: ${dec(Math.min(x, y))} ${x < 0 ? S.xw : S.yw} is impossible`, mc: MC.allReals } : { t: `Not viable: ${dec(Number.isInteger(x) ? y : x)} ${Number.isInteger(x) ? S.yw : S.xw} is impossible`, mc: MC.fracCount };
  }
  return { t: `Not viable: it breaks “${S.rules[i]!.words}”`, mc: MC.oneCond };
};
const viablePair: Gen = (R, n) => {
  for (;;) {
    const S = sys(R), kind = pick(R, ['ok', 'frac', 'neg', 0, 1, 2] as const);
    if (typeof kind === 'number' && kind >= S.rules.length) continue;
    const V = sysCand(R, S, kind);
    if (!V) continue;
    const right = failWhy(S, V), cs = sysCons(S);
    const opts: Opt[] = [{ t: right.t, ok: true, say: right.t.startsWith('Viable') ? 'Yes: every rule holds with the same values.' : 'Yes: one broken condition is enough to rule it out.' }];
    if (!right.t.startsWith('Viable')) opts.push({ t: 'Viable: it meets every condition', mc: right.mc, say: right.mc === MC.oneCond ? 'It passes some rules, but every condition must hold at once.' : right.mc === MC.fracCount ? 'The algebra works, but the context does not: counts come whole.' : 'A formula takes negative numbers; a count can’t be negative.' });
    for (const r of S.rules) { const t = `Not viable: it breaks “${r.words}”`; if (t !== right.t && test(r.con, V).ok) opts.push({ t, say: `Check it: that rule holds for (${dec(V[S.x]!)}, ${dec(V[S.y]!)}).` }); }
    const sel = [opts[0]!, ...shuffle(R, opts.slice(1)).slice(0, 3)];
    if (sel.length < 3) continue;
    void cs;
    return choice(R, { id: `viablePair-${n}`, family: 'viablePair', board: candT(V, [S.x, S.y]), picture: { table: sysTable(S, [V]) },
      prompt: `${S.story} (${S.defs}.) Is the plan <b>${candH(V, [S.x, S.y])}</b> viable?`,
      solution: [`Check every condition with the same values, and the context: whole numbers, not negative.`, `${right.t}.`] }, sel);
  }
};
const whichViable: Gen = (R, n) => {
  for (;;) {
    const S = sys(R);
    const kinds = shuffle(R, ['frac', 'neg', 0, 1, 2].filter(k => typeof k !== 'number' || k < S.rules.length) as ('frac' | 'neg' | number)[]).slice(0, 2);
    const good = sysCand(R, S, 'ok'), bads = kinds.map(k => sysCand(R, S, k));
    if (!good || bads.some(b => !b)) continue;
    const all = [good, ...(bads as Vals[])];
    const labels = all.map(V => candH(V, [S.x, S.y]));
    if (new Set(labels).size < 3) continue;
    const opts: Opt[] = all.map((V, i) => {
      const w = failWhy(S, V);
      return i === 0 ? { t: labels[0]!, ok: true, say: 'Yes: it passes every condition and makes sense in the context.' } : { t: labels[i]!, mc: w.mc, say: w.t.replace('Not viable: ', 'No: ') + '.' };
    });
    return choice(R, { id: `whichViable-${n}`, family: 'whichViable', board: '\\text{which plan works?}', picture: { table: sysTable(S, all) },
      prompt: `${S.story} (${S.defs}.) Which plan is viable?`,
      solution: ['Check every plan against every condition, and the context (whole, not negative).', `Only ${labels[0]} passes them all.`] }, opts);
  }
};

// =====================================================================================================================
// 15 bound-rounding
// =====================================================================================================================
function roundPic(x: string, r: Rel, b: number, answer: number, adj: number): LinePic {
  // a short window around the bound: the allowed whole numbers as dots, the answer and its excluded neighbour tested
  const lo = Math.max(0, Math.floor(b) - 2), hi = Math.ceil(b) + 2;
  const dotsVs = stepsIn(lo, hi, 1).filter(z => holds(z, r, b));
  return { rows: [{ key: 'x', name: `${x}`, set: ray(r, b), role: 'dim' }], dots: [{ key: 'd', row: 'x', vs: dotsVs }],
    tests: [{ key: 't0', row: 'x', v: answer, ok: true }, { key: 't1', row: 'x', v: adj, ok: false }], values: [lo, b, answer, adj, hi] };
}
const busRound: Gen = (R, n) => {
  for (;;) {
    const up = R() < 0.5;
    if (up) {
      const cap = pick(R, [12, 15, 24, 52, 48]), S0 = int(R, 2, 6) * cap + int(R, 1, Math.floor(cap / 2) - 1);
      const raw = S0 / cap, a = Math.ceil(raw), near0 = Math.round(raw);
      if (near0 === a || a > 9) continue;
      return numItem({ id: `busRound-${n}`, family: 'busRound', board: `${cap}b \\ge ${S0}`, unit: 'buses', picture: { line: roundPic('b', '>=', raw, a, a - 1) },
        prompt: `Each bus seats ${cap} students and ${S0} students are going: <b>${cap}${v('b')} ≥ ${S0}</b>. What is the LEAST whole number of buses?`,
        solution: [`${v('b')} ≥ ${frac(S0, cap)}, a bit more than ${a - 1}.`, `Check: ${cap}(${a - 1}) = ${cap * (a - 1)} &lt; ${S0}, too few. ${cap}(${a}) = ${cap * a} ≥ ${S0}. So ${ans(a)} buses.`] }, a,
        `Yes: ${a} buses seat ${cap * a}.`, [[a - 1, MC.roundNear, `${a - 1} buses seat only ${cap * (a - 1)}: students are left behind. A minimum rounds UP.`], [raw, MC.fracCount, 'Buses come whole: you need a whole number.']], `Check ${a - 1} and ${a} buses in ${cap}${v('b')} ≥ ${S0}.`);
    }
    const p = pick(R, [3, 4, 6, 7, 8]), B = int(R, 3, 9) * p + int(R, Math.ceil(p / 2), p - 1);
    const raw = B / p, a = Math.floor(raw), near0 = Math.round(raw);
    if (near0 === a || a < 2) continue;
    return numItem({ id: `busRound-${n}`, family: 'busRound', board: `${p}n \\le ${B}`, unit: 'tickets', picture: { line: roundPic('n', '<=', raw, a, a + 1) },
      prompt: `Tickets cost $${p} and you have $${B}: <b>${p}${v('n')} ≤ ${B}</b>. What is the GREATEST whole number of tickets?`,
      solution: [`${v('n')} ≤ ${frac(B, p)}, a bit less than ${a + 1}.`, `Check: ${p}(${a}) = ${p * a} ≤ ${B}. ${p}(${a + 1}) = ${p * (a + 1)} &gt; ${B}, too much. So ${ans(a)} tickets.`] }, a,
      `Yes: ${a} tickets cost $${p * a}.`, [[a + 1, MC.roundNear, `${a + 1} tickets cost $${p * (a + 1)}, more than $${B}. A maximum rounds DOWN.`], [raw, MC.fracCount, 'Tickets come whole.']], `Check ${a} and ${a + 1} tickets in ${p}${v('n')} ≤ ${B}.`);
  }
};
const intEnd: Gen = (R, n) => {
  const r = pick(R, ['<', '<=', '>', '>='] as Rel[]), b = int(R, 4, 15);
  const a = extremeWhole(r, b)!, up = r === '>' || r === '>=';
  const wrong = r === '<' ? b : r === '<=' ? b - 1 : r === '>' ? b : b + 1;
  return numItem({ id: `intEnd-${n}`, family: 'intEnd', board: `n ${relT(r)} ${b}`, unit: '', picture: { line: roundPic('n', r, b, a, up ? a - 1 : a + 1) },
    prompt: `${v('n')} is a whole number with <b>${v('n')} ${relH(r)} ${b}</b>. What is the ${up ? 'LEAST' : 'GREATEST'} value ${v('n')} can take?`,
    solution: [`Is ${b} itself allowed? ${b} ${relH(r)} ${b} is ${holds(b, r, b) ? 'true' : 'false'}.`, `So the ${up ? 'least' : 'greatest'} whole number is ${ans(a)}.`] }, a,
    `Yes: ${a}.`, [[wrong, strictOf(r) ? MC.strictIn : MC.inclOut, strictOf(r) ? `${b} ${relH(r)} ${b} is false: the boundary is left out.` : `${b} ${relH(r)} ${b} is true: the boundary counts.`]], `Test ${b} itself in ${v('n')} ${relH(r)} ${b}.`);
};
const solveRound: Gen = (R, n) => {
  for (;;) {
    const up = R() < 0.5;
    const F = int(R, 2, 12) * 5, r = pick(R, [6, 7, 8, 9, 12, 15]), G = F + r * int(R, 3, 9) + int(R, 1, r - 1);
    const raw = (G - F) / r, a = up ? Math.ceil(raw) : Math.floor(raw), nr = Math.round(raw);
    if (nr === a) continue;
    const story = up ? `Sam has $${F} saved and adds $${r} a week. He needs at least $${G}: <b>${F} + ${r}${v('w')} ≥ ${G}</b>. What is the LEAST whole number of weeks?`
      : `A gym charges $${F} to join plus $${r} per class. Maya can spend at most $${G}: <b>${F} + ${r}${v('c')} ≤ ${G}</b>. What is the GREATEST whole number of classes?`;
    const x = up ? 'w' : 'c', rr: Rel = up ? '>=' : '<=';
    return numItem({ id: `solveRound-${n}`, family: 'solveRound', board: `${F} + ${r}${x} ${relT(rr)} ${G}`, unit: up ? 'weeks' : 'classes', picture: { line: roundPic(x, rr, raw, a, up ? a - 1 : a + 1) },
      prompt: story,
      solution: [`Subtract ${F}, divide by ${r}: ${v(x)} ${relH(rr)} ${frac(G - F, r)}, between ${Math.floor(raw)} and ${Math.ceil(raw)}.`, `${up ? 'At least: round UP' : 'At most: round DOWN'}. Check: ${F} + ${r}(${a}) = ${F + r * a} ${relH(rr)} ${G}. So ${ans(a)}.`] }, a,
      `Yes: ${a}. ${F} + ${r}(${a}) = ${F + r * a}.`, [[nr, MC.roundNear, `${F} + ${r}(${nr}) = ${F + r * nr}: that breaks the condition. ${up ? 'A minimum rounds up' : 'A maximum rounds down'}, whatever the decimal.`], [Math.round(raw * 100) / 100, MC.fracCount, 'The answer must be a whole number.']], `Solve, then check the whole numbers on each side of ${frac(G - F, r)}.`);
  }
};

// =====================================================================================================================
// 16 represent-allowed-values
// =====================================================================================================================
const pickRep: Gen = (R, n) => {
  for (;;) {
    const p = pick(R, [3, 4, 6, 7]), B = int(R, 3, 8) * p + int(R, 1, p - 1), bnd0 = B / p, a = Math.floor(bnd0), disc = R() < 0.55;
    const q = disc ? { x: 'n', what: `tickets at $${p} each`, unit: 'tickets' } : { x: 'g', what: `gallons of gas at $${p} a gallon`, unit: 'gallons' };
    const segT = `A solid segment from 0 to ${frac(B, p)}, both ends closed`;
    const dotsT = `Separate dots at 0, 1, 2, …, ${a}`;
    const rayT = `An arrow from ${frac(B, p)} to the left, with no end`;
    const opts: Opt[] = [
      { t: dotsT, ok: disc, mc: disc ? undefined : MC.mustWhole, say: disc ? 'Yes: whole tickets only, from 0 up to the last one that fits.' : 'Gas can be pumped in parts of a gallon: the allowed values fill a segment.' },
      { t: segT, ok: !disc, mc: disc ? MC.fracCount : undefined, say: disc ? 'A segment holds 2.5 tickets too: counts are separate dots.' : 'Yes: any amount from 0 up to the bound.' },
      { t: rayT, mc: MC.allReals, say: 'Negative amounts make no sense: the picture must stop at 0.' },
    ];
    if (a < 2) continue;
    const L = disc ? line1(q.x, undefined, [0, bnd0], { dots: wholeIn(0, bnd0) }) : line1(q.x, inter(ray('>=', 0), ray('<=', bnd0)), [0, bnd0]);
    return choice(R, { id: `pickRep-${n}`, family: 'pickRep', board: `${p}${q.x} \\le ${B}`, picture: { line: L },
      prompt: `${v(q.x)} = the number of ${q.what}, with $${B} to spend: <b>${p}${v(q.x)} ≤ ${B}</b>. Which number-line picture shows the allowed values?`,
      solution: [`The bound: 0 ≤ ${v(q.x)} ≤ ${frac(B, p)} (no negatives).`, disc ? `Tickets are whole: dots at 0 to ${a}.` : 'Gas can be any amount: a closed segment.'] }, opts);
  }
};
const notation: Gen = (R, n) => {
  const form = pick(R, ['bounded', 'bounded', 'above'] as const), p = pick(R, [3, 4, 6]);
  if (form === 'above') {
    const m = int(R, 2, 8);
    const opts: Opt[] = [
      { t: `${v('n')} ≥ ${m}, ${v('n')} a whole number`, ok: true, say: 'Yes: no top limit, whole numbers from the minimum up.' },
      { t: `${m} ≤ ${v('n')} ≤ ${m + 10}, ${v('n')} a whole number`, say: 'The story sets no top limit.' },
      { t: `${v('n')} ≥ ${m}`, mc: MC.fracCount, say: `Without “whole number” this allows ${m}.5 tickets.` },
      { t: `${v('n')} &gt; ${m}, ${v('n')} a whole number`, mc: MC.strictIn, say: `“At least ${m}” includes ${m}.` },
    ];
    return choice(R, { id: `notation-${n}`, family: 'notation', board: `\\text{at least } ${m}`, picture: { line: line1('n', undefined, [0, m, m + 4], { dots: wholeIn(m, m + 4) }) },
      prompt: `A raffle needs at least ${m} tickets sold. With ${v('n')} = the number of tickets sold, how do you state the allowed values?`,
      solution: ['A lower bound and no upper bound, and tickets are whole.', `${v('n')} ≥ ${m}, ${v('n')} a whole number.`] }, opts);
  }
  const B = int(R, 3, 7) * p + int(R, 1, p - 1), a = Math.floor(B / p);
  const opts: Opt[] = [
    { t: `0 ≤ ${v('n')} ≤ ${a}, ${v('n')} a whole number`, ok: true, say: 'Yes: the lower bound, the last whole number that fits, and the type.' },
    { t: `0 ≤ ${v('n')} ≤ ${frac(B, p)}`, mc: MC.fracCount, say: `This allows ${a - 1}.5 ${'tickets'}: add “whole number” (and then ${a} is the top).` },
    { t: `${v('n')} ≤ ${a}, ${v('n')} a whole number`, mc: MC.allReals, say: 'You need the lower bound too: no negative tickets.' },
    { t: `0 &lt; ${v('n')} ≤ ${a}, ${v('n')} a whole number`, mc: MC.positive, say: 'Buying 0 tickets is allowed.' },
  ];
  return choice(R, { id: `notation-${n}`, family: 'notation', board: `${p}n \\le ${B}`, picture: { line: line1('n', undefined, [0, B / p], { dots: wholeIn(0, B / p) }) },
    prompt: `Tickets cost $${p}; you have $${B}: <b>${p}${v('n')} ≤ ${B}</b>, ${v('n')} = the number of tickets. How do you state the allowed values?`,
    solution: [`${v('n')} ≤ ${frac(B, p)}, and ${v('n')} can’t be negative.`, `Whole tickets: 0 ≤ ${v('n')} ≤ ${a}, ${v('n')} a whole number.`] }, opts);
};
const pairRange: Gen = (R, n) => {
  for (;;) {
    const T = two(R, false);
    if (T.kind !== 'money') continue;
    const xm = Math.floor(T.B / T.px), ym = Math.floor(T.B / T.py);
    const C = twoCon(T), V = { [T.x]: xm, [T.y]: ym }, s = xm * T.px + ym * T.py;
    const opts: Opt[] = [
      { t: `No: ${T.px}(${xm}) + ${T.py}(${ym}) = ${s}, more than ${T.B}. The two counts share one budget`, ok: true, say: 'Yes: each bound holds when the other count is 0. Together they must fit in one budget.' },
      { t: `Yes: ${v(T.x)} ≤ ${xm} and ${v(T.y)} ≤ ${ym}, so any pair inside both works`, mc: MC.linked, say: `${xm} is the most ${T.xw} when you buy NO ${T.yw}. The variables are linked by one budget.` },
      { t: `Yes: ${xm} + ${ym} = ${xm + ym} items, which is fine`, mc: MC.countValue, say: `The rule is about dollars: ${T.px}(${xm}) + ${T.py}(${ym}).` },
    ];
    const table: TablePic = { head: `(${T.x},\\,${T.y})`, cands: [{ key: 'p', label: candT(V, [T.x, T.y]), v: V }], rows: [{ key: 'r', words: `spend at most ${money(T.B)}`, tex: conT(C), con: C }, { key: 'w', words: 'whole numbers, not negative', tex: `${T.x},\\,${T.y}\\ \\text{whole}`, con: whole(T.x, T.y) }], all: true };
    return choice(R, { id: `pairRange-${n}`, family: 'pairRange', board: conT(C), picture: { table },
      prompt: `${twoStory(T)} (${twoDefs(T)}; whole numbers.) On its own, ${v(T.x)} can be at most ${xm} and ${v(T.y)} at most ${ym}. Is the pair (${xm}, ${ym}) allowed?`,
      solution: [`Describe the allowed pairs with the whole system: ${conH(C)}, ${v(T.x)} and ${v(T.y)} whole numbers.`, `Check the pair: ${T.px}(${xm}) + ${T.py}(${ym}) = ${s} &gt; ${T.B}. Not allowed.`] }, opts);
  }
};

// =====================================================================================================================
// 17 empty-feasible-set
// =====================================================================================================================
const noOption: Gen = (R, n) => {
  const lo = int(R, 6, 10), hi = lo - int(R, 2, 3);
  const c = pick(R, [
    { s: `A trip needs at least ${lo} drivers, but only ${hi} people in the club have a license.`, x: 'd', w: 'drivers' },
    { s: `A recital needs at least ${lo} songs, but the hall allows time for at most ${hi} songs.`, x: 's', w: 'songs' },
    { s: `A project needs at least ${lo} volunteers, but the van holds at most ${hi}.`, x: 'v', w: 'volunteers' },
  ]);
  const mid = Math.round((lo + hi) / 2);
  const opts: Opt[] = [
    { t: 'No value works: no number is at least ' + lo + ' and at most ' + hi + ' at once', ok: true, say: 'Yes: the two allowed sets do not overlap. “No viable option” is a real answer.' },
    { t: `${v(c.x)} = ${mid}, in between`, mc: MC.oneAnswer, say: `${mid} is less than ${lo}: it breaks the first rule. Not every problem has an answer.` },
    { t: `${v(c.x)} = ${hi}, the closest one`, mc: MC.oneAnswer, say: `${hi} breaks “at least ${lo}”. Close is not allowed: there is no viable option.` },
    { t: `${v(c.x)} = ${lo}, the closest one`, mc: MC.oneAnswer, say: `${lo} breaks “at most ${hi}”. There is no viable option.` },
  ];
  const pic: LinePic = { rows: [{ key: 'a', name: `${c.x} \\ge ${lo}`, set: ray('>=', lo), role: 'first' }, { key: 'b', name: `${c.x} \\le ${hi}`, set: ray('<=', hi), role: 'second' }, { key: 'c', name: '\\text{both}', role: 'dim' }], values: [0, lo, hi, lo + 2], result: '\\text{no viable option}' };
  return choice(R, { id: `noOption-${n}`, family: 'noOption', board: `${c.x} \\ge ${lo}\\ \\text{and}\\ ${c.x} \\le ${hi}`, picture: { line: pic },
    prompt: `${c.s} With ${v(c.x)} = the number of ${c.w}: <b>${v(c.x)} ≥ ${lo}</b> and <b>${v(c.x)} ≤ ${hi}</b>. What can ${v(c.x)} be?`,
    solution: [`Every allowed value is ${lo} or more, and every allowed value is ${hi} or less.`, `No number is both: the set is empty. There is no viable option.`] }, opts);
};
const betweenInt: Gen = (R, n) => {
  for (;;) {
    const p = pick(R, [5, 6, 8, 10]), k = int(R, 2, 6), lo = k * p + int(R, 1, Math.floor(p / 2) - 1 || 1), hi = k * p + p - int(R, 1, Math.floor(p / 2) - 1 || 1);
    if (!(hi > lo) || lo % p === 0 || hi % p === 0 || Math.floor(lo / p) !== Math.floor(hi / p)) continue;
    const a = lo / p, b = hi / p;
    const opts: Opt[] = [
      { t: 'No whole number works', ok: true, say: `Yes: everything allowed lies between ${k} and ${k + 1}, and no whole number does.` },
      { t: `${v('g')} = ${k}`, mc: MC.roundNear, say: `${p}(${k}) = ${p * k}, less than ${lo}: it breaks the first rule.` },
      { t: `${v('g')} = ${k + 1}`, mc: MC.roundNear, say: `${p}(${k + 1}) = ${p * (k + 1)}, more than ${hi}: it breaks the second rule.` },
      { t: `${v('g')} = ${dec(Math.round(((a + b) / 2) * 100) / 100)}`, mc: MC.fracCount, say: 'Groups come whole: a part of a group is not an option.' },
    ];
    const pic: LinePic = { rows: [{ key: 'x', name: 'g', set: inter(ray('>=', a), ray('<=', b)), role: 'dim' }], tests: [{ key: 't0', row: 'x', v: k, ok: false }, { key: 't1', row: 'x', v: k + 1, ok: false }], values: [0, a, b, k, k + 1], result: '\\text{no whole } g' };
    return choice(R, { id: `betweenInt-${n}`, family: 'betweenInt', board: `${lo} \\le ${p}g \\le ${hi}`, picture: { line: pic },
      prompt: `A coach splits players into ${v('g')} groups of ${p}. She needs places for at least ${lo} players and has room for at most ${hi}: <b>${lo} ≤ ${p}${v('g')} ≤ ${hi}</b>, ${v('g')} a whole number. Which ${v('g')} works?`,
      solution: [`Divide by ${p}: ${lo}/${p} ≤ ${v('g')} ≤ ${hi}/${p}, so ${v('g')} is between ${k} and ${k + 1}.`, `${k} is too small, ${k + 1} too big: no whole number works.`] }, opts);
  }
};

// =====================================================================================================================
// 18 model-assumption
// =====================================================================================================================
const blocks: Gen = (R, n) => {
  for (;;) {
    const r = pick(R, [8, 10, 12, 16]), F = pick(R, [5, 10, 15]), H = pick(R, [2.6, 2.7, 3.3, 3.6, 2.4, 3.4]);
    const B = Math.round((F + r * H) * 100) / 100;
    if (!Number.isInteger(B * 1)) { /* keep money exact to cents */ }
    const mode = pick(R, ['any', 'whole', 'quarter', 'quarter'] as const);
    const wholeTop = Math.floor(H + 1e-9), qTop = Math.floor(H * 4 + 1e-9) / 4;
    if (Number.isInteger(H * 4)) continue;
    const words = { any: `any part of an hour can be bought and is charged proportionally`, whole: 'kayaks are rented only in whole hours', quarter: 'kayaks are rented only in quarter-hour blocks' }[mode];
    const tAny = `Any value from 0 to ${dec(H)}`, tWhole = `0, 1, ${wholeTop > 2 ? '…, ' : ''}${wholeTop} only`, tQ = `0, 0.25, 0.5, …, ${dec(qTop)}`;
    const opts: Opt[] = [
      { t: tAny, ok: mode === 'any', mc: mode === 'any' ? undefined : MC.allReals, say: mode === 'any' ? 'Yes: any part of an hour is allowed.' : `The assumption changed: ${words}. Not every value in the range can be bought.` },
      { t: tWhole, ok: mode === 'whole', mc: mode === 'quarter' ? MC.wholeOnly : mode === 'any' ? MC.mustWhole : undefined, say: mode === 'whole' ? 'Yes: whole hours only.' : mode === 'quarter' ? 'Quarter hours are separate values too: 0.25, 0.5, … Separated does not mean whole.' : 'Any part of an hour is allowed here.' },
      { t: tQ, ok: mode === 'quarter', say: mode === 'quarter' ? 'Yes: separated values, a quarter hour apart.' : mode === 'whole' ? 'Only whole hours are sold.' : 'Any part of an hour is allowed, not only quarters.' },
    ];
    const axis = { lo: -0.5, hi: Math.ceil(H) + 0.5, tick: 0.25, every: 4 };
    if ((axis.hi - axis.lo) / axis.tick > 24) continue;
    const L: LinePic = mode === 'any' ? line1('h', inter(ray('>=', 0), ray('<=', H)), [0, H], { axis })
      : line1('h', undefined, [0, H], { dots: mode === 'whole' ? stepsIn(0, H, 1) : stepsIn(0, H, 0.25), axis });
    return choice(R, { id: `blocks-${n}`, family: 'blocks', board: `${F} + ${r}h \\le ${decT(B)}`, picture: { line: L },
      prompt: `A kayak rental costs $${F} plus $${r} per hour; you have ${money(B)}: <b>${F} + ${r}${v('h')} ≤ ${dec(B)}</b>, so ${v('h')} ≤ ${dec(H)}. Assume ${words}. Which values of ${v('h')} are allowed?`,
      solution: [`The budget gives 0 ≤ ${v('h')} ≤ ${dec(H)}.`, `The assumption decides the type: ${mode === 'any' ? 'any value in the range' : mode === 'whole' ? 'whole hours only' : 'multiples of 0.25 only'}.`] }, opts);
  }
};
const packs: Gen = (R, n) => {
  for (;;) {
    const k = pick(R, [4, 6, 8, 12]), N = int(R, 2, 6) * k + int(R, 1, Math.floor(k / 2) - 1 || 1);
    const packsN = Math.ceil(N / k), cans = packsN * k;
    if (N % k === 0) continue;
    const item = pick(R, [['cans of juice', 'cans'], ['bottles of water', 'bottles'], ['granola bars', 'bars']] as const);
    return numItem({ id: `packs-${n}`, family: 'packs', board: `${k}p \\ge ${N}`, unit: item[1],
      prompt: `You need at least ${N} ${item[0]}. Sold one at a time, the least you can buy is ${N}. Now assume they are sold only in packs of ${k} (${v('p')} packs, ${k}${v('p')} ≥ ${N}). What is the least number of ${item[1]} you can buy?`,
      solution: [`${v('p')} ≥ ${N}/${k}, so at least ${packsN} packs (${packsN - 1} packs hold only ${(packsN - 1) * k}).`, `${packsN} packs hold ${ans(cans)} ${item[1]}.`] }, cans,
      `Yes: ${packsN} packs, ${cans} ${item[1]}. The pack assumption changes the allowed totals to multiples of ${k}.`,
      [[N, MC.allReals, `That is the answer when they are sold one at a time. In packs, only multiples of ${k} are possible.`], [(packsN - 1) * k, MC.roundNear, `${(packsN - 1) * k} is fewer than ${N}: not enough. Round the packs UP.`], [packsN, undefined, `${packsN} is the number of PACKS. How many ${item[1]} is that?`]],
      `Only multiples of ${k} can be bought: find the first one that is at least ${N}.`);
  }
};

// =====================================================================================================================
export type FamilyId = keyof typeof GENS;
const GENS = {
  eqTest, eqMeaning, allowedSet, boundaryCand, pairTest, pairValue, bothValue, pairBoth, phraseSymbol, phraseWrite, defineVar, unitCheck,
  feeRate, groupEq, rateIneq, feeIneq, budget2, total2, timesAsMany, atLeastTwice, compareCheck, unstatedBound, boundCandidate,
  discreteOrNot, fracValue, systemPick, missingCon, viablePair, whichViable, busRound, intEnd, solveRound, pickRep, notation, pairRange,
  noOption, betweenInt, blocks, packs,
} as const;
/** a generator whose picture always lays out: retry (same seeded stream), else drop the picture (slate) */
const fitted = (g: Gen): Gen => (R, n, sg) => {
  let it = g(R, n, sg);
  for (let k = 0; k < 25 && it.picture && !picFits(it.picture); k++) it = g(R, n, sg);
  if (it.picture && !picFits(it.picture)) it.picture = undefined;
  return it;
};
export const GENERATORS: Record<string, Gen> = Object.fromEntries(Object.entries(GENS).map(([k, g]) => [k, fitted(g)]));
export const FAMILY_NAMES: Record<string, string> = {
  eqTest: 'Which value makes it true?', eqMeaning: 'What the equation says', allowedSet: 'The allowed set', boundaryCand: 'Allowed or not?',
  pairTest: 'Check a pair', pairValue: 'Plug in a pair', bothValue: 'Both conditions', pairBoth: 'A pair against two rules',
  phraseSymbol: 'Phrase to symbol', phraseWrite: 'Phrase to inequality', defineVar: 'Define the variable', unitCheck: 'Same units',
  feeRate: 'Fee plus rate', groupEq: 'Equal groups', rateIneq: 'Rate and a bound', feeIneq: 'Fee, rate and a bound',
  budget2: 'Two items, one budget', total2: 'Two kinds, one total', timesAsMany: 'Times as many', atLeastTwice: 'At least k times as many',
  compareCheck: 'Check the comparison', unstatedBound: 'The unstated bound', boundCandidate: 'Can that happen?', discreteOrNot: 'Separated or a range?',
  fracValue: 'Does a part make sense?', systemPick: 'The complete model', missingCon: 'What is missing?', viablePair: 'Viable or not?',
  whichViable: 'Which plan is viable?', busRound: 'Round the right way', intEnd: 'The extreme whole number', solveRound: 'Solve, then round',
  pickRep: 'Dots or a segment?', notation: 'State the allowed values', pairRange: 'Linked variables', noOption: 'No viable option',
  betweenInt: 'Between two whole numbers', blocks: 'Change the assumption', packs: 'Sold in packs',
};
void EMPTY; void decT; void viable;
