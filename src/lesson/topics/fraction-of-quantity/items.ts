// items.ts: practice families for "fraction of a quantity" (grade 5). Every family is one deep structure; a generator
// receives the sub-goal id and uses that sub-goal's number ranges (topic JSON `cases`). Every wrong answer the
// classifier recognises carries its id from math-curriculum-essentials/misconceptions.json (logged, never shown).
// Pure: no DOM, no canvas.
import { type Gen, type Item, type Response, type Verdict, A, B, S, fr, fracValue, gcd, int, mixed, pick, same, shuffle } from '../../runtime/item';
import { setFits, tapeFits } from './fractionOfMaths';

// ---------- contexts (US units, no money) ----------
interface SetCtx { things: string; thing: string; look: 'cookie' | 'marble'; holder: string; other: string }
const SETS: readonly SetCtx[] = [
  { things: 'cookies', thing: 'cookie', look: 'cookie', holder: 'a tray of', other: 'oatmeal' },
  { things: 'marbles', thing: 'marble', look: 'marble', holder: 'a bag of', other: 'blue' },
  { things: 'crackers', thing: 'cracker', look: 'cookie', holder: 'a plate of', other: 'cheese' },
  { things: 'beads', thing: 'bead', look: 'marble', holder: 'a jar of', other: 'blue' },
];
interface MeasCtx { unit: string; one: string; what: string; verb: string }
const MEAS: readonly MeasCtx[] = [
  { unit: 'ft', one: 'foot', what: 'ribbon', verb: 'cuts off' },
  { unit: 'in', one: 'inch', what: 'strip of paper', verb: 'cuts off' },
  { unit: 'ft', one: 'foot', what: 'rope', verb: 'uses' },
  { unit: 'yd', one: 'yard', what: 'roll of fabric', verb: 'uses' },
  { unit: 'min', one: 'minute', what: 'practice session', verb: 'spends' },
];
const NAMES = ['Maya', 'Leo', 'Ava', 'Sam', 'Nora', 'Eli', 'Zoe', 'Omar', 'Lily', 'Jack', 'Rosa', 'Ben'];
const ORD: Record<number, string> = { 2: 'halves', 3: 'thirds', 4: 'fourths', 5: 'fifths', 6: 'sixths', 7: 'sevenths', 8: 'eighths', 9: 'ninths', 10: 'tenths' };
const ftex = (a: number, b: number) => `\\tfrac{${a}}{${b}}`;

export const FAMILY_NAMES: Record<string, string> = {
  setShare: 'One share of a set',
  groupChoice: 'Make the groups',
  tapeUnit: 'One part of a tape',
  equalParts: 'Equal parts?',
  iterate: 'Take some of the shares',
  expr: 'Write the expression',
  bareUnit: 'Divide to find one share',
  bareDTM: 'Divide, then multiply',
  overOne: 'More than the whole',
  unitCheck: 'Keep the unit',
  predict: 'Predict the size',
  recover: 'Back to one share',
  verify: 'Check a claim',
  whichWhole: 'Which is the whole?',
  fracShare: 'A share that is a fraction',
  fracNonUnit: 'Some shares that make a fraction',
  unknownWhole: 'Find the whole',
};

// ---------- item builders ----------
interface Wrong { v: number; mc?: string; say: string }
function numItem(o: Omit<Item, 'input' | 'answer' | 'check'> & { value: number; wrongs: Wrong[]; right: string; hint: string }): Item {
  const { value, wrongs, right, hint, ...rest } = o;
  return {
    ...rest, input: 'num', answer: { kind: 'num', v: value },
    check(r: Response): Verdict {
      if (r.kind !== 'num' || !Number.isFinite(r.v)) return { ok: false, say: 'Type a number.' };
      if (r.v === value) return { ok: true, say: right };
      const w = wrongs.find(x => x.v === r.v && x.v !== value);
      return w ? { ok: false, mc: w.mc, say: w.say } : { ok: false, say: hint };
    },
  };
}
interface FracWrong { n: number; d: number; whole?: boolean; mc?: string; say: string }
function fracItem(o: Omit<Item, 'input' | 'answer' | 'check'> & { n: number; d: number; wrongs: FracWrong[]; right: string; hint: string }): Item {
  const { n, d, wrongs, right, hint, ...rest } = o;
  return {
    ...rest, input: 'frac', answer: { kind: 'frac', w: 0, n, d },
    check(r: Response): Verdict {
      if (r.kind !== 'frac') return { ok: false, say: 'Type a fraction or a mixed number.' };
      const v = fracValue(r);
      if (!v) return { ok: false, say: 'Fill in the boxes with whole numbers (the bottom box cannot be 0).' };
      if (same(v, n, d)) return { ok: true, say: right };
      const w = wrongs.find(x => same(v, x.n, x.d) && !same([x.n, x.d], n, d));
      return w ? { ok: false, mc: w.mc, say: w.say } : { ok: false, say: hint };
    },
  };
}
interface Choice { t: string; ok: boolean; mc?: string; say: string }
function choiceItem(R: () => number, o: Omit<Item, 'input' | 'answer' | 'check' | 'choices'> & { opts: Choice[] }): Item {
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
const solutionDTM = (q: number, a: number, b: number, unit: string) => {
  const s = q / b;
  return [
    `The whole is ${A(`${q} ${unit}`.trim())}. Cut it into ${B(b)} equal shares: ${q} ÷ ${b} = ${s}.`,
    a === 1 ? `${fr(1, b)} is one share: ${S(`${s} ${unit}`.trim())}.` : `${fr(a, b)} is ${a} of those shares: ${s} × ${a} = ${S(`${s * a} ${unit}`.trim())}.`,
  ];
};

// ---------- 1. unit fraction of a set ----------
const setShare: Gen = (R, n) => {
  let b = 3, s = 4;
  do { b = pick(R, [2, 3, 4, 6, 8]); s = int(R, 2, 6); } while (b * s > 24 || !setFits(b * s, 1, b));
  const q = b * s, C = pick(R, SETS);
  // a subset in a second colour is a distractor: the fraction is of ALL the objects
  const useOther = R() < 0.4 && q >= 8;
  const other = useOther ? b * int(R, 1, Math.max(1, Math.floor(s / 2))) : 0;
  const prompt = useOther
    ? `${A(`${C.holder} ${q} ${C.things}`)}: ${q - other} plain and ${other} ${C.other}. How many ${C.things} are ${fr(1, b)} of <b>all</b> the ${C.things}?`
    : `${A(`${C.holder} ${q} ${C.things}`)}. How many ${C.things} are ${fr(1, b)} of them?`;
  const wrongs: Wrong[] = [
    { v: b, mc: 'mc.fractions-concept.fraction-of-set-misgrouped', say: `That is a group of ${b}. For ${fr(1, b)}, make ${B(b)} equal groups and count ONE group.` },
  ];
  if (useOther) {
    if (other % b === 0) wrongs.push({ v: other / b, mc: 'mc.fractions-concept.part-taken-as-whole', say: `That is ${fr(1, b)} of the ${other} ${C.other} ones. The whole is all ${A(q)} ${C.things}.` });
    if ((q - other) % b === 0) wrongs.push({ v: (q - other) / b, mc: 'mc.fractions-concept.part-taken-as-whole', say: `That is ${fr(1, b)} of the plain ones. The whole is all ${A(q)} ${C.things}.` });
  }
  return numItem({
    id: `setShare-${n}`, family: 'setShare', prompt, board: `\\tfrac{1}{${b}} \\text{ of } ${q} = \\ ?`, unit: C.things,
    picture: { q, a: 1, b, set: true, whole: `${q} ${C.things}`, groups: `${b} equal groups`, unit: '', other, look: C.look },
    solution: [`The whole is all ${A(`${q} ${C.things}`)}.`, `Make ${B(b)} equal groups: ${q} ÷ ${b} = ${s} in each group.`, `${fr(1, b)} is one group: ${S(`${s} ${C.things}`)}.`],
    value: s, wrongs, right: `Yes: ${B(b)} equal groups of ${s}, and ${fr(1, b)} is one group.`, hint: `Make ${B(b)} equal groups of all ${A(q)}. How many are in one group?`,
  });
};
const groupChoice: Gen = (R, n) => {
  let b = 3, s = 4;
  do { b = pick(R, [2, 3, 4, 6, 8]); s = int(R, 2, 6); } while (s === b || b * s > 24 || !setFits(b * s, 1, b));
  const q = b * s, C = pick(R, SETS);
  const picture = { q, a: 1, b, set: true, whole: `${q} ${C.things}`, groups: `${b} equal groups`, unit: '', look: C.look };
  if (R() < 0.5) {
    return choiceItem(R, {
      id: `groupChoice-${n}`, family: 'groupChoice', picture, prompt: `To find ${fr(1, b)} of ${A(`${q} ${C.things}`)}, how do you group them?`, board: `\\tfrac{1}{${b}} \\text{ of } ${q}`,
      solution: [`The bottom number says how many equal groups: ${B(b)} groups.`, `${q} ÷ ${b} = ${s} in each group; ${fr(1, b)} of ${q} is ${S(String(s))}.`],
      opts: [
        { t: `${b} equal groups of ${s}, then take 1 group`, ok: true, say: `Yes: ${B(b)} equal groups, one group is ${fr(1, b)}.` },
        { t: `Groups of ${b}, then take 1 group`, ok: false, mc: 'mc.fractions-concept.fraction-of-set-misgrouped', say: `Groups of ${b} make ${s} groups, so one group would be ${fr(1, s)}. The ${b} tells how many groups.` },
        { t: `Take 1 ${C.thing}`, ok: false, mc: 'mc.fractions-concept.numerator-as-object-count', say: `The 1 counts groups, not ${C.things}. One group of ${b} equal groups.` },
      ],
    });
  }
  return choiceItem(R, {
    id: `groupChoice-${n}`, family: 'groupChoice', picture, prompt: `What is ${fr(1, b)} of ${A(`${q} ${C.things}`)}?`, board: `\\tfrac{1}{${b}} \\text{ of } ${q} = \\ ?`,
    solution: [`Make ${B(b)} equal groups: ${q} ÷ ${b} = ${s}.`, `The answer is a number of ${C.things}: ${S(`${s} ${C.things}`)}.`],
    opts: [
      { t: `${s} ${C.things}`, ok: true, say: `Yes: one of ${b} equal groups is ${s} ${C.things}.` },
      { t: `${fr(1, b)}`, ok: false, mc: 'mc.fraction-ops.fraction-given-instead-of-quantity', say: `${fr(1, b)} is the fraction. The question asks how many ${C.things}.` },
      { t: `${b} ${C.things}`, ok: false, mc: 'mc.fractions-concept.fraction-of-set-misgrouped', say: `${b} is the number of groups. Each group has ${q} ÷ ${b} = ${s}.` },
    ],
  });
};

// ---------- 2. unit fraction on a tape ----------
const tapeUnit: Gen = (R, n) => {
  let b = 4, s = 6;
  do { b = int(R, 2, 10); s = int(R, 2, 10); } while (b * s > 60 || s === b);
  const q = b * s, C = pick(R, MEAS), who = pick(R, NAMES);
  return numItem({
    id: `tapeUnit-${n}`, family: 'tapeUnit', subgoal: 'unit-fraction-tape-diagram',
    prompt: `${who}'s ${C.what} is ${A(`${q} ${C.unit}`)} long. ${who} ${C.verb} ${fr(1, b)} of it. How much is that?`, board: `\\tfrac{1}{${b}} \\text{ of } ${q}\\ \\text{${C.unit}} = \\ ?`, unit: C.unit,
    picture: { q, a: 1, b, whole: `${q} ${C.unit}`, groups: `${b} equal parts`, unit: C.unit },
    solution: solutionDTM(q, 1, b, C.unit),
    value: s, right: `Yes: ${q} ÷ ${b} = ${s}, so each part is ${s} ${C.unit}.`, hint: `Cut ${A(`${q} ${C.unit}`)} into ${B(b)} equal parts. How long is one part?`,
    wrongs: [
      { v: q, mc: 'mc.fraction-ops.total-written-on-one-section', say: `${q} ${C.unit} is the whole tape. One of ${B(b)} parts is shorter.` },
      { v: b, mc: 'mc.fraction-ops.fraction-of-quantity-report-denominator', say: `${b} is how many parts. Each part is ${q} ÷ ${b}.` },
    ],
  });
};
const equalParts: Gen = (R, n) => {
  let b = 4, s = 3;
  do { b = int(R, 3, 5); s = int(R, 2, 6); } while (b * s > 30);
  const q = b * s, C = pick(R, MEAS.filter(m => m.unit !== 'min')), who = pick(R, NAMES);
  // b unequal pieces that still add up to q
  const parts = Array.from({ length: b }, () => s);
  const d = int(R, 1, s - 1);
  parts[0]! -= d; parts[b - 1]! += d;
  const list = shuffle(R, parts.slice()).map(p => `${p} ${C.unit}`).join(', ');
  return choiceItem(R, {
    id: `equalParts-${n}`, family: 'equalParts', prompt: `${who} cuts a ${A(`${q} ${C.unit}`)} ${C.what} into ${B(b)} pieces: ${list}. Is each piece ${fr(1, b)} of the ${C.what}?`,
    board: `${list.replace(/ (ft|in|yd)/g, '\\,\\text{$1}').replace(/, /g, ',\\ ')}`,
    solution: [`${ORD[b]} must be ${B(b)} EQUAL parts.`, `${q} ÷ ${b} = ${s}, so each ${fr(1, b)} would be ${S(`${s} ${C.unit}`)}. These pieces are not all ${s} ${C.unit}.`],
    opts: [
      { t: 'No. The pieces are not equal.', ok: true, say: `Right: ${ORD[b]} are ${b} equal parts of ${q / b} ${C.unit} each.` },
      { t: `Yes. There are ${b} pieces.`, ok: false, mc: 'mc.fractions-concept.unequal-parts-counted-as-fractions', say: `${b} pieces are only ${ORD[b]} when they are equal. Here they are not.` },
      { t: `Yes. They add up to ${q} ${C.unit}.`, ok: false, mc: 'mc.fractions-concept.unequal-parts-counted-as-fractions', say: `They do add up, but ${ORD[b]} must also be equal: ${s} ${C.unit} each.` },
    ],
  });
};

// ---------- 3 / 6. a of the b shares (with a picture) ----------
function properNumbers(R: () => number, maxQ: number): { a: number; b: number; s: number } {
  let a = 2, b = 3, s = 4;
  do { b = pick(R, [3, 4, 5, 6, 8, 10]); a = int(R, 2, b - 1); s = int(R, 2, 10); } while (b * s > maxQ || gcd(a, b) !== 1);
  return { a, b, s };
}
function dtmWrongs(q: number, a: number, b: number, unit: string): Wrong[] {
  const s = q / b, u = unit ? ' ' + unit : '';
  const w: Wrong[] = [{ v: s, mc: 'mc.ratio-rate.stops-at-unit-rate', say: `${s}${u} is ONE share. ${fr(a, b)} is ${a} shares: ${s} × ${a}.` }];
  if (q % a === 0) {
    w.push({ v: (q / a) * b, mc: 'mc.fraction-ops.numerator-denominator-roles-swapped', say: `That cuts the whole into ${a} shares and takes ${b}. The ${B(b)} on the bottom says how many equal shares; the ${a} on top says how many you take.` });
    w.push({ v: q / a, mc: 'mc.fraction-ops.divides-by-numerator-for-fraction-of-quantity', say: `That divides by ${a}, the top number. Divide by the bottom number ${B(b)} to get one share, then take ${a} of them.` });
  }
  w.push({ v: a, mc: 'mc.fractions-concept.numerator-as-object-count', say: `${a} counts shares, not single ${unit || 'objects'}. Each share is ${q} ÷ ${b} = ${s}.` });
  w.push({ v: q * a, mc: 'mc.fraction-ops.multiplies-numerator-never-divides', say: `That is ${a} times the whole. First divide by ${B(b)}: ${q} ÷ ${b} = ${s}, then × ${a}.` });
  return w;
}
const iterate: Gen = (R, n, sg) => {
  const { a, b, s } = properNumbers(R, sg === 'divide-then-multiply' ? 100 : 60);
  const q = b * s;
  const asSet = setFits(q, a, b) && R() < 0.5;
  if (asSet) {
    const C = pick(R, SETS), who = pick(R, NAMES);
    return numItem({
      id: `iterate-${n}`, family: 'iterate', prompt: `${A(`${C.holder} ${q} ${C.things}`)}. ${who} takes ${fr(a, b)} of them. How many ${C.things} is that?`,
      board: `\\tfrac{${a}}{${b}} \\text{ of } ${q} = \\ ?`, unit: C.things,
      picture: { q, a, b, set: true, whole: `${q} ${C.things}`, groups: `${b} equal groups`, unit: '', look: C.look },
      solution: solutionDTM(q, a, b, C.things), value: a * s, wrongs: dtmWrongs(q, a, b, C.things),
      right: `Yes: one group is ${s}, and ${a} groups are ${a * s}.`, hint: `Make ${B(b)} equal groups. How many in one group? Then take ${a} groups.`,
    });
  }
  const C = pick(R, MEAS), who = pick(R, NAMES);
  return numItem({
    id: `iterate-${n}`, family: 'iterate', prompt: `${who}'s ${C.what} is ${A(`${q} ${C.unit}`)} long. ${who} ${C.verb} ${fr(a, b)} of it. How much is that?`,
    board: `\\tfrac{${a}}{${b}} \\text{ of } ${q}\\ \\text{${C.unit}} = \\ ?`, unit: C.unit,
    picture: { q, a, b, whole: `${q} ${C.unit}`, groups: `${b} equal parts`, unit: C.unit },
    solution: solutionDTM(q, a, b, C.unit), value: a * s, wrongs: dtmWrongs(q, a, b, C.unit),
    right: `Yes: one part is ${s} ${C.unit}, and ${a} parts are ${a * s} ${C.unit}.`, hint: `Cut it into ${B(b)} equal parts. How long is one part? Then take ${a} parts.`,
  });
};

// ---------- 4. record the expression ----------
const expr: Gen = (R, n) => {
  const { a, b, s } = properNumbers(R, 60);
  const q = b * s, v = int(R, 0, 2);
  const right = `(${q} ÷ ${b}) × ${a}`;
  const opts: Choice[] = [
    { t: right, ok: true, say: `Yes: ${q} ÷ ${b} = ${s} is one share, and × ${a} takes ${a} shares: ${a * s}.` },
    { t: `(${q} ÷ ${a}) × ${b}`, ok: false, mc: 'mc.fraction-ops.numerator-denominator-roles-swapped', say: `That cuts into ${a} shares and takes ${b}. Divide by the bottom number ${B(b)}, multiply by the top number ${a}.` },
    { t: `${q} ÷ ${b}`, ok: false, mc: 'mc.ratio-rate.stops-at-unit-rate', say: `${q} ÷ ${b} is only ONE share. ${fr(a, b)} needs ${a} of them.` },
  ];
  const prompt = v === 0 ? `Which expression finds ${fr(a, b)} of ${A(q)}?`
    : v === 1 ? `Which expression has the same value as ${fr(a, b)} × ${A(q)}?`
      : `A ${A(`${q} in`)} tape is cut into ${B(b)} equal parts, and ${a} parts are taken. Which expression matches the tape?`;
  return choiceItem(R, {
    id: `expr-${n}`, family: 'expr', prompt, board: v === 1 ? `\\tfrac{${a}}{${b}} \\times ${q}` : `\\tfrac{${a}}{${b}} \\text{ of } ${q}`,
    picture: v === 2 ? { q, a, b, whole: `a ${q} in tape`, groups: `${b} equal parts`, unit: 'in', show: 'take' } : undefined,
    solution: [`"of" means times: ${fr(a, b)} of ${q} = ${fr(a, b)} × ${q}.`, `Divide by the bottom number for one share, multiply by the top: ${S(right)} = ${a * s}.`],
    opts,
  });
};

// ---------- 5. 1/b of q by division (bare) ----------
const bareUnit: Gen = (R, n) => {
  let b = 4, s = 6;
  do { b = int(R, 2, 10); s = int(R, 2, 10); } while (s === b);
  const q = b * s;
  return numItem({
    id: `bareUnit-${n}`, family: 'bareUnit', prompt: `${fr(1, b)} of ${A(q)} = ?`, board: `\\tfrac{1}{${b}} \\text{ of } ${q} = \\ ?`,
    solution: [`${fr(1, b)} of ${q} is one of ${B(b)} equal shares.`, `${q} ÷ ${b} = ${S(String(s))}.`],
    value: s, right: `Yes: ${q} ÷ ${b} = ${s}.`, hint: `Divide ${A(q)} into ${B(b)} equal shares.`,
    wrongs: [
      { v: b, mc: 'mc.fraction-ops.fraction-of-quantity-report-denominator', say: `${b} is how many shares. One share is ${q} ÷ ${b}.` },
      { v: q * b, mc: 'mc.fraction-ops.numerator-denominator-roles-swapped', say: `That is ${q} × ${b}. ${fr(1, b)} of ${q} is smaller than ${q}: divide by ${b}.` },
    ],
  });
};

// ---------- 6. divide then multiply (bare) ----------
const bareDTM: Gen = (R, n) => {
  let a = 3, b = 4, s = 7;
  do { b = int(R, 3, 10); a = int(R, 2, b - 1); s = int(R, 2, 10); } while (gcd(a, b) !== 1);
  const q = b * s;
  return numItem({
    id: `bareDTM-${n}`, family: 'bareDTM', prompt: `${fr(a, b)} of ${A(q)} = ?`, board: `\\tfrac{${a}}{${b}} \\text{ of } ${q} = \\ ?`,
    solution: solutionDTM(q, a, b, ''), value: a * s, wrongs: dtmWrongs(q, a, b, ''),
    right: `Yes: ${q} ÷ ${b} = ${s}, and ${s} × ${a} = ${a * s}.`, hint: `First ${q} ÷ ${B(b)}, then multiply by ${a}.`,
  });
};

// ---------- 7. a ≥ b ----------
const overOne: Gen = (R, n) => {
  let a = 5, b = 4, s = 3;
  do { b = int(R, 2, 9); a = R() < 0.25 ? b : int(R, b + 1, 10); s = int(R, 2, 10); } while (b * s > 60 || a * s > 100 || !tapeFits(b * s, a, b) || (a !== b && gcd(a, b) !== 1));
  const q = b * s, C = pick(R, MEAS), r = a * s;
  const ctx = pick(R, [
    `The old ${C.what} was ${A(`${q} ${C.unit}`)}. The new one is ${fr(a, b)} of the old one. How long is the new one?`,
    `A plan calls for ${A(`${q} ${C.unit}`)} of ${C.what}. ${pick(R, NAMES)} needs ${fr(a, b)} of that amount. How much is that?`,
  ]);
  const wrongs: Wrong[] = dtmWrongs(q, a, b, C.unit).filter(w => w.mc !== 'mc.fractions-concept.numerator-as-object-count');
  if (a > b && (2 * b - a) > 0) wrongs.push({ v: (2 * b - a) * s, mc: 'mc.fraction-ops.fraction-factor-always-shrinks', say: `${fr(a, b)} is MORE than 1 whole (${b} shares make the whole), so the answer is more than ${q}.` });
  if (a > b) wrongs.push({ v: q, mc: 'mc.fractions-concept.fraction-must-be-less-than-one', say: `${q} is the whole: ${b} shares. ${fr(a, b)} takes ${a} shares, ${a - b} more than the whole.` });
  return numItem({
    id: `overOne-${n}`, family: 'overOne', prompt: ctx, board: `\\tfrac{${a}}{${b}} \\text{ of } ${q}\\ \\text{${C.unit}} = \\ ?`, unit: C.unit,
    picture: { q, a, b, whole: `${q} ${C.unit}`, groups: `${b} equal parts`, unit: C.unit },
    solution: [...solutionDTM(q, a, b, C.unit), a === b ? `${fr(b, b)} is the whole.` : `${a} shares are more than the ${b} that make the whole, so it is more than ${q} ${C.unit}.`],
    value: r, wrongs, right: `Yes: ${a} shares of ${s} ${C.unit} = ${r} ${C.unit}${a > b ? `, more than the whole ${q} ${C.unit}` : ''}.`, hint: `One share is ${q} ÷ ${B(b)}. Take ${a} shares, even past the whole.`,
  });
};

// ---------- 8. keep the unit ----------
const UNIT_SWAP: Record<string, string> = { ft: 'in', in: 'ft', yd: 'ft', min: 'hours' };
const unitCheck: Gen = (R, n) => {
  const { a, b, s } = properNumbers(R, 60);
  const q = b * s, C = pick(R, MEAS), who = pick(R, NAMES), r = a * s;
  return choiceItem(R, {
    id: `unitCheck-${n}`, family: 'unitCheck', prompt: `${who} finds ${fr(a, b)} of a ${A(`${q} ${C.unit}`)} ${C.what}. Which answer is written right?`,
    board: `\\tfrac{${a}}{${b}} \\text{ of } ${q}\\ \\text{${C.unit}}`,
    solution: [`${q} ÷ ${b} × ${a} = ${r}.`, `A part of ${q} ${C.unit} is still measured in ${C.unit}: ${S(`${r} ${C.unit}`)}.`],
    opts: [
      { t: `${r} ${C.unit}`, ok: true, say: `Yes: a fraction of ${C.unit} is still ${C.unit}.` },
      { t: `${r} ${ORD[b]}`, ok: false, mc: 'mc.fraction-ops.denominator-creates-measurement-unit', say: `${ORD[b]} is the name of the shares, not a unit. The ${C.what} is measured in ${C.unit}.` },
      { t: `${r} ${UNIT_SWAP[C.unit]}`, ok: false, mc: 'mc.reasoning-language.correct-arithmetic-validates-setup', say: `The number is right, but the unit changed. Nothing turned ${C.unit} into ${UNIT_SWAP[C.unit]}.` },
      { t: `${r}`, ok: false, mc: 'mc.reasoning-language.bare-number-without-meaning', say: `${r} what? Give the unit: ${C.unit}.` },
    ],
  });
};

// ---------- 9. predict the size ----------
const predict: Gen = (R, n) => {
  const b = int(R, 2, 9), kind = int(R, 0, 2);
  const a = kind === 0 ? int(R, 1, b - 1) : kind === 1 ? b : int(R, b + 1, Math.min(10, 2 * b));
  const s = int(R, 2, 10), q = b * s;
  if (R() < 0.35 && a !== b) {
    // reject a claim without computing
    const claim = a < b ? q + s : Math.max(1, q - s);
    const more = a > b;
    return choiceItem(R, {
      id: `predict-${n}`, family: 'predict', prompt: `${pick(R, NAMES)} says ${fr(a, b)} of ${A(q)} is ${claim}. Without working it out, can that be right?`,
      board: `\\tfrac{${a}}{${b}} \\text{ of } ${q} = ${claim}\\ ?`,
      solution: [`${b} shares make the whole ${q}. ${fr(a, b)} takes ${a} shares: ${more ? 'more' : 'fewer'} than ${b}.`, `So the answer is ${more ? 'more' : 'less'} than ${q}, and ${claim} is ${more ? 'less' : 'more'}. (It is ${a * s}.)`],
      opts: [
        { t: `No. ${fr(a, b)} is ${more ? 'more' : 'less'} than 1, so the answer is ${more ? 'more' : 'less'} than ${q}.`, ok: true, say: `Right: compare ${a} with ${b} first.` },
        { t: more ? `Yes. A fraction always makes it smaller.` : `Yes. Multiplying always makes it bigger.`, ok: false, mc: more ? 'mc.fraction-ops.fraction-factor-always-shrinks' : 'mc.mul-div.multiplication-makes-bigger', say: more ? `${fr(a, b)} is more than 1 whole, so ${fr(a, b)} of ${q} is more than ${q}.` : `Times a number less than 1 makes it smaller: ${fr(a, b)} of ${q} is less than ${q}.` },
        { t: `You can't tell without working it out.`, ok: false, say: `You can: compare the top number ${a} with the bottom number ${b}.` },
      ],
    });
  }
  const ans = a < b ? 0 : a === b ? 1 : 2;
  const T = [`Less than ${q}`, `Equal to ${q}`, `More than ${q}`];
  const mcFor = (i: number) => (i < ans ? 'mc.fraction-ops.fraction-factor-always-shrinks' : i > ans ? 'mc.mul-div.multiplication-makes-bigger' : undefined);
  const why = [`${a} shares are fewer than the ${b} that make the whole.`, `${b} shares out of ${b} is exactly the whole.`, `${a} shares are more than the ${b} that make the whole.`][ans]!;
  return choiceItem(R, {
    id: `predict-${n}`, family: 'predict', prompt: `Without working it out: is ${fr(a, b)} of ${A(q)} less than, equal to, or more than ${q}?`, board: `\\tfrac{${a}}{${b}} \\text{ of } ${q} \\ \\ ? \\ \\ ${q}`,
    solution: [`Compare the top number with the bottom number: ${a} and ${b}.`, why + ` (${fr(a, b)} of ${q} = ${a * s}.)`],
    opts: T.map((t, i) => ({ t, ok: i === ans, mc: mcFor(i), say: i === ans ? `Yes: ${why}` : `Look at ${a} and ${b}: ${why}` })),
  });
};

// ---------- 10. recover one share ----------
const recover: Gen = (R, n) => {
  let a = 3, b = 4, s = 6;
  do { b = int(R, 3, 10); a = int(R, 2, Math.min(9, b - 1)); s = int(R, 2, 10); } while (gcd(a, b) !== 1);
  const P = a * s, C = pick(R, MEAS), q = b * s;
  const wrongs: Wrong[] = [{ v: P, say: `${P} ${C.unit} is ${a} shares together. One share is less.` }];
  if (P % b === 0) wrongs.unshift({ v: P / b, mc: 'mc.ratio-rate.known-part-divided-by-denominator-for-unit-share', say: `${P} ${C.unit} is ${a} shares, not ${b}. Divide by ${a}: ${P} ÷ ${a}.` });
  return numItem({
    id: `recover-${n}`, family: 'recover', prompt: `${fr(a, b)} of a ${C.what} is ${S(`${P} ${C.unit}`)}. How much is ${fr(1, b)} of it?`,
    board: `\\tfrac{${a}}{${b}} \\text{ of } ? = ${P}\\ \\text{${C.unit}}`, unit: C.unit,
    picture: { q, a, b, whole: `the whole ${C.what}`, groups: `${b} equal parts`, unit: C.unit, hideTotal: true, answerTex: `${P}\\ \\text{${C.unit}}`, show: 'take' },
    solution: [`${fr(a, b)} is ${a} equal shares, together ${P} ${C.unit}.`, `One share: ${P} ÷ ${a} = ${S(`${s} ${C.unit}`)}.`],
    value: s, wrongs, right: `Yes: ${a} shares make ${P}, so one share is ${P} ÷ ${a} = ${s} ${C.unit}.`, hint: `${P} ${C.unit} is made of ${a} equal shares. Share it by ${a}.`,
  });
};

// ---------- 11. verify a claim by rebuilding the whole ----------
const verify: Gen = (R, n) => {
  let a = 3, b = 4, s = 7, t = 6;
  do { b = int(R, 2, 10); a = int(R, 1, b - 1); s = int(R, 2, 10); t = int(R, 2, 10); } while (gcd(a, b) !== 1 || t === s);
  const q = b * s, okClaim = R() < 0.45, tt = okClaim ? s : t, P = a * tt, who = pick(R, NAMES);
  const opts: Choice[] = okClaim ? [
    { t: `Right: ${P} ÷ ${a} = ${s}, and ${s} × ${b} = ${q}, the whole.`, ok: true, say: `Yes: working backward rebuilds the whole ${q}.` },
    { t: `Right: ${P} ÷ ${a} = ${s}, and ${s} × ${a} = ${P}.`, ok: false, mc: 'mc.fraction-ops.rebuilds-whole-with-numerator', say: `That only gets back to ${P}. Rebuild the WHOLE: ${b} shares, ${s} × ${b}.` },
    { t: `Wrong: ${fr(a, b)} of ${q} must be more than ${q}.`, ok: false, mc: 'mc.mul-div.multiplication-makes-bigger', say: `${fr(a, b)} is less than 1, so the answer is less than ${q}.` },
  ] : [
    { t: `Wrong: ${P} ÷ ${a} = ${tt}, and ${tt} × ${b} = ${tt * b}, not ${q}.`, ok: true, say: `Yes: the claim rebuilds ${tt * b}, not the whole ${q}. The answer is ${a * s}.` },
    { t: `Right: ${P} ÷ ${a} = ${tt}, and ${tt} × ${a} = ${P}.`, ok: false, mc: 'mc.fraction-ops.rebuilds-whole-with-numerator', say: `That only gets back to ${P}. Rebuild the WHOLE: ${b} shares, ${tt} × ${b} = ${tt * b}.` },
    { t: `Right: ${P} is less than ${q}.`, ok: false, mc: 'mc.reasoning-language.correct-arithmetic-validates-setup', say: `Less than ${q} is needed, but not enough. Rebuild the whole: ${tt} × ${b} = ${tt * b}.` },
  ];
  return choiceItem(R, {
    id: `verify-${n}`, family: 'verify', prompt: `${who} says ${fr(a, b)} of ${A(q)} is ${P}. Check it by working backward.`, board: `\\tfrac{${a}}{${b}} \\text{ of } ${q} = ${P}\\ ?`,
    solution: [`One share would be ${P} ÷ ${a} = ${tt}.`, `${b} shares rebuild the whole: ${tt} × ${b} = ${tt * b}${tt * b === q ? `, the whole. ${S('Right')}.` : `, not ${q}. ${S('Wrong')}: it is ${a * s}.`}`],
    opts,
  });
};

// ---------- 12. which quantity is the whole ----------
const WHOLE_CTX = [
  (q: number, d: number, a: number, b: number) => ({ p: `A class has ${A(`${q} students`)}. ${d} of them walk to school. ${fr(a, b)} of the class has a library card. How many students have a library card?`, unit: 'students' }),
  (q: number, d: number, a: number, b: number) => ({ p: `A farm has ${A(`${q} hens`)} and ${d} goats. ${fr(a, b)} of the hens are brown. How many brown hens are there?`, unit: 'hens' }),
  (q: number, d: number, a: number, b: number) => ({ p: `A trail is ${A(`${q} miles`)} long. Yesterday Kim hiked ${d} miles of a different trail. Today she hikes ${fr(a, b)} of this trail. How far is that?`, unit: 'miles' }),
];
const whichWhole: Gen = (R, n) => {
  let a = 2, b = 3, s = 5, d = 9;
  do { b = pick(R, [2, 3, 4, 5, 6]); a = int(R, 1, b - 1); s = int(R, 3, 10); d = b * int(R, 1, s - 1); } while (gcd(a, b) !== 1 || b * s > 60);
  const q = b * s, k = pick(R, WHOLE_CTX)(q, d, a, b);
  const wrongs: Wrong[] = [{ v: (a * d) / b, mc: 'mc.fraction-ops.fraction-of-wrong-quantity', say: `That is ${fr(a, b)} of ${d}. The fraction is of the ${A(q)}: read again what it is "of".` }];
  if (a > 1) wrongs.push({ v: s, mc: 'mc.ratio-rate.stops-at-unit-rate', say: `${s} is one share. Take ${a} shares.` });
  return numItem({
    id: `whichWhole-${n}`, family: 'whichWhole', prompt: k.p, board: `\\tfrac{${a}}{${b}} \\text{ of } ? `, unit: k.unit,
    solution: [`The fraction is "of" the ${A(`${q} ${k.unit}`)}; the ${d} is not part of it.`, ...solutionDTM(q, a, b, k.unit)],
    value: a * s, wrongs, right: `Yes: the whole is ${q} ${k.unit}, and ${fr(a, b)} of ${q} = ${a * s}.`, hint: `Which number is the fraction "of"? That is the whole.`,
  });
};

// ---------- 13. a unit fraction that gives a fraction ----------
const SHARE_CTX: readonly { unit: string; what: string }[] = [
  { unit: 'ft', what: 'board' }, { unit: 'ft', what: 'ribbon' }, { unit: 'in', what: 'sandwich' }, { unit: 'yd', what: 'rope' }];
function fracWrongs(q: number, a: number, b: number, unit: string): FracWrong[] {
  const w: FracWrong[] = [];
  if (a === 1 && q > b) w.push({ n: Math.floor(q / b), d: 1, mc: 'mc.fractions-concept.leftover-not-shared-as-fraction', say: `That leaves the ${q % b} ${unit} left over unshared. Cut it too: each share is ${fr(q, b)} ${unit}.` });
  w.push({ n: b, d: a * q, mc: 'mc.fractions-concept.fraction-division-order-reversed', say: `That is flipped. The amount (${A(a * q)}) goes on top, the ${B(b)} shares underneath.` });
  if (a === 1) w.push({ n: 1, d: b, mc: 'mc.fraction-ops.fraction-given-instead-of-quantity', say: `${fr(1, b)} is the fraction. The question asks how many ${unit}: ${q} ÷ ${b}.` });
  if (a > 1) {
    w.push({ n: a, d: b, mc: 'mc.fraction-ops.multiplies-both-terms-by-whole-number', say: `${fr(a * q, b * q)} is still just ${fr(a, b)}. Multiply only the top: ${a} × ${q} = ${a * q}, over ${b}.` });
    w.push({ n: a, d: b * q, mc: 'mc.fraction-ops.multiplies-denominator-by-whole-number', say: `Times ${q} makes it MORE, but ${fr(a, b * q)} is smaller. Multiply the top: ${fr(a * q, b)}.` });
  }
  return w;
}
const fracShare: Gen = (R, n) => {
  let b = 4, q = 6;
  do { b = int(R, 2, 10); q = int(R, 2, 12); } while (q % b === 0 || !tapeFits(q, 1, b));
  const C = pick(R, SHARE_CTX), who = pick(R, NAMES);
  return fracItem({
    id: `fracShare-${n}`, family: 'fracShare', prompt: `${who} cuts a ${A(`${q} ${C.unit}`)} ${C.what} into ${B(b)} equal pieces. How long is ${fr(1, b)} of it?`,
    board: `\\tfrac{1}{${b}} \\text{ of } ${q}\\ \\text{${C.unit}} = \\ ?`, unit: C.unit,
    picture: { q, a: 1, b, whole: `${q} ${C.unit}`, groups: `${b} equal pieces`, unit: C.unit, ticks: true },
    solution: [`${fr(1, b)} of ${q} = ${q} ÷ ${b}.`, `${q} ÷ ${b} = ${S(`${fr(q, b)} ${C.unit}`)}${q > b ? ` = ${mixed(q, b)} ${C.unit}` : ''}.`],
    n: q, d: b, wrongs: fracWrongs(q, 1, b, C.unit), right: `Yes: ${q} ÷ ${b} = ${fr(q, b)} ${C.unit}${q > b ? ` (${mixed(q, b)} ${C.unit})` : ''}.`, hint: `${fr(1, b)} of ${q} is ${q} ÷ ${b}, and a division can be written as a fraction.`,
  });
};

// ---------- 14. a/b of q as a fraction ----------
const fracNonUnit: Gen = (R, n) => {
  let a = 2, b = 3, q = 4;
  do { b = int(R, 2, 10); a = int(R, 2, 9); q = int(R, 2, 10); } while (q % b === 0 || a === b || gcd(a, b) !== 1 || !tapeFits(q, a, b) || (a * q) % b === 0);
  const C = pick(R, SHARE_CTX), who = pick(R, NAMES);
  return fracItem({
    id: `fracNonUnit-${n}`, family: 'fracNonUnit', prompt: `${who} has a ${A(`${q} ${C.unit}`)} ${C.what} and needs ${fr(a, b)} of it. How much is that?`,
    board: `\\tfrac{${a}}{${b}} \\times ${q} = \\ ?`, unit: C.unit,
    picture: { q, a, b, whole: `${q} ${C.unit}`, groups: `${b} equal parts`, unit: C.unit, ticks: true },
    solution: [`One share: ${q} ÷ ${b} = ${fr(q, b)} ${C.unit}.`, `${a} shares: ${a} × ${fr(q, b)} = ${S(`${fr(a * q, b)} ${C.unit}`)}${a * q > b ? ` = ${mixed(a * q, b)} ${C.unit}` : ''}.`, `The same as ${a} × ${q} ÷ ${b}.`],
    n: a * q, d: b, wrongs: fracWrongs(q, a, b, C.unit), right: `Yes: ${a} × ${q} ÷ ${b} = ${fr(a * q, b)} ${C.unit}.`, hint: `One share is ${fr(q, b)} ${C.unit}. Take ${a} of them.`,
  });
};

// ---------- 15. find the whole (extension) ----------
const unknownWhole: Gen = (R, n) => {
  let a = 1, b = 4, s = 6;
  do { b = int(R, 2, 10); a = R() < 0.5 ? 1 : int(R, 2, b - 1); s = int(R, 2, 10); } while (gcd(a, b) !== 1 || b * s > 100 || a === b);
  const P = a * s, q = b * s, C = pick(R, MEAS.filter(m => m.unit !== 'min'));
  const wrongs: Wrong[] = [];
  if (a > 1) wrongs.push({ v: P, mc: 'mc.fraction-ops.rebuilds-whole-with-numerator', say: `${P} is only ${a} shares. The whole is ${b} shares: ${s} × ${b}.` });
  if ((P * a) % b === 0) wrongs.push({ v: (P * a) / b, mc: 'mc.ratio-rate.multiplies-by-rate-when-dividing-needed', say: `That takes ${fr(a, b)} of ${P} again. Go backward: one share is ${P} ÷ ${a}, the whole is ${b} shares.` });
  if (P % b === 0 && a > 1) wrongs.push({ v: P / b, mc: 'mc.ratio-rate.known-part-divided-by-denominator-for-unit-share', say: `${P} is ${a} shares, so one share is ${P} ÷ ${a}, and the whole is ${b} of them.` });
  return numItem({
    id: `unknownWhole-${n}`, family: 'unknownWhole', prompt: `${fr(a, b)} of a ${C.what} is ${S(`${P} ${C.unit}`)}. How long is the whole ${C.what}?`,
    board: `\\tfrac{${a}}{${b}} \\times \\ ? = ${P}`, unit: C.unit,
    picture: { q, a, b, whole: `the whole ${C.what}`, groups: `${b} equal parts`, unit: C.unit, hideTotal: true, answerTex: `${P}\\ \\text{${C.unit}}`, show: 'take' },
    solution: [`${P} ${C.unit} is ${a} share${a > 1 ? 's' : ''}: one share is ${P} ÷ ${a} = ${s} ${C.unit}.`, `The whole is ${b} shares: ${s} × ${b} = ${S(`${q} ${C.unit}`)}.`],
    value: q, wrongs, right: `Yes: one share is ${s} ${C.unit} and ${b} shares make ${q} ${C.unit}.`, hint: `Find one share first (${P} ÷ ${a}), then build all ${B(b)} shares.`,
  });
};

export const GENS: Readonly<Record<string, Gen>> = {
  setShare, groupChoice, tapeUnit, equalParts, iterate, expr, bareUnit, bareDTM, overOne, unitCheck, predict, recover, verify,
  whichWhole, fracShare, fracNonUnit, unknownWhole,
};
export { ftex };
