// items.ts: practice families for "probability concepts" (grade 7, 7.SP.C.5-8). One family per sub-goal of the topic
// JSON (plan.ts); a generator receives the sub-goal id and uses that sub-goal's cases. Every wrong answer the
// classifier recognises carries its misconception id (math-curriculum-essentials/misconceptions.json).
// Pure: no DOM, no canvas (the picture is data; Chance.ts draws it). PROBES records typical wrong responses per item
// and the id they must get (tests). Seeded: the same rng gives the same item.
import { type Gen, type Item, type Response, type Verdict, A, S as S0, fr, fracValue, int, pick, same, shuffle } from '../../runtime/item';
import type { BarRow, Pin, Sector } from './Chance';
import { endOnChoice } from '../../runtime/explain';
import { type Frac, type Group, type MarbleCol, LETTER, WORDS, type Word, asExtreme, bagSpace, batches, digitTrials, expectedCount, gcd, heads, num, tossSpace, twoCubes, wordOf } from './chanceMaths';

export type FamilyId = 'scale' | 'space' | 'event' | 'equal' | 'relFreq' | 'theory' | 'model' | 'complement' | 'forms' | 'predict'
  | 'nonUniform' | 'batches' | 'longRun' | 'streak' | 'discrepancy' | 'simDigits' | 'compoundSpace' | 'compoundP' | 'designSim' | 'compoundPredict';
export const FAMILY_NAMES: Record<FamilyId, string> = {
  scale: 'The 0 to 1 scale', space: 'List the outcomes', event: 'Which outcomes?', equal: 'Equally likely?',
  relFreq: 'From the data', theory: 'Favorable over all', model: 'A complete model', complement: 'The other outcomes',
  forms: 'Fraction, decimal, percent', predict: 'About how many?', nonUniform: 'Unequal parts', batches: 'Batch to batch',
  longRun: 'In the long run', streak: 'Is it due?', discrepancy: 'Model or chance?', simDigits: 'Run a simulation',
  compoundSpace: 'Two or more stages', compoundP: 'Compound probability', designSim: 'Design a simulation', compoundPredict: 'Predict and compare',
};

/** what the page draws for an item (Chance.ts painters); `solve` parts appear after a miss */
export type Pic =
  | { kind: 'bag'; groups: Group[]; event?: string[]; other?: string[]; labels: boolean; title?: string }
  | { kind: 'cube'; event?: number[]; title?: string }
  | { kind: 'spinner'; sectors: Sector[]; event?: number[]; angles?: number[]; title?: string }
  | { kind: 'bars'; rows: BarRow[]; title?: string; event?: number[]; ref?: { v: number; tex: string }; max?: number }
  | { kind: 'scale'; pins: Pin[]; given: number }
  | { kind: 'strip'; n: number; d: number; k: number; title: string; answer: string }
  | { kind: 'run'; hits: boolean[]; p: Frac; log: boolean; marks?: number[]; refTex?: string }
  | { kind: 'dots'; ref: number[]; obs: number; title: string; obsLabel: string }
  | { kind: 'digits'; digits: number[]; size: number; wins?: boolean[]; legend: string; blocks: boolean }
  | { kind: 'table'; rows: string[]; cols: string[]; cells: (string | null)[][]; event?: [number, number][]; rowTitle?: string; colTitle?: string }
  | { kind: 'tree'; n: number; event?: number[] }
  | { kind: 'streak'; past: string[]; coin: boolean; dice?: boolean; title?: string };
export interface ProbItem extends Item {
  family: FamilyId;
  pic?: Pic;
  /** the picture appears only with the worked solution (it would give the answer away) */
  picOnSolve?: boolean;
  /** TeX the board writes with the worked solution */
  hero?: string;
}

export const PROBES = new WeakMap<Item, { r: Response; mc: string }[]>();
const probe = (it: Item, r: Response, mc: string) => { const l = PROBES.get(it) ?? []; l.push({ r, mc }); PROBES.set(it, l); };
const S = (x: string | number) => S0(String(x));
const F = (n: number, d: number): Response => ({ kind: 'frac', w: 0, n, d });
const Wh = (w: number): Response => ({ kind: 'frac', w, n: 0, d: 1 });
const N = (v: number): Response => ({ kind: 'num', v });
const tf = (n: number | string, d: number | string) => `\\tfrac{${n}}{${d}}`;
const txt = (s: string) => `\\text{${s}}`;
const sub = (id: string) => id.replace(/^([A-Z])(\d+)$/, '$1<sub>$2</sub>');
const setH = (xs: readonly (string | number)[]) => `{ ${xs.map(x => sub(String(x))).join(', ')} }`;
const pct = (p: number) => `${p}%`;

// ---------- checking helpers ----------
interface FracWrong { v: Frac | number; mc?: string; say: string }
/** a fraction answer: any equivalent form is right */
function fracCheck(r: Response, n: number, d: number, okSay: string, wrongs: FracWrong[], fallback: string): Verdict {
  if (r.kind !== 'frac') return { ok: false, say: 'Type a fraction.' };
  const v = fracValue(r);
  if (!v) return { ok: false, say: 'Fill in the boxes with whole numbers (the bottom box cannot be 0).' };
  if (same(v, n, d)) return { ok: true, say: okSay };
  for (const w of wrongs) {
    const [a, b] = typeof w.v === 'number' ? [w.v, 1] : w.v;
    if (b > 0 && same(v, a, b) && !same([n, d], a, b)) return { ok: false, mc: w.mc, say: w.say };
  }
  return { ok: false, say: fallback };
}
function numCheck(r: Response, ans: number, okSay: string, wrongs: { v: number; mc?: string; say: string }[], fallback: string): Verdict {
  if (r.kind !== 'num' || !Number.isFinite(r.v)) return { ok: false, say: 'Type a number.' };
  if (r.v === ans) return { ok: true, say: okSay };
  for (const w of wrongs) if (w.v === r.v && w.v !== ans) return { ok: false, mc: w.mc, say: w.say };
  return { ok: false, say: fallback };
}
interface Opt { t: string; ok?: boolean; say: string; mc?: string }
function options(R: () => number, opts: Opt[]): { choices: string[]; right: number; says: { say: string; mc?: string }[] } {
  const o = shuffle(R, opts.slice());
  return { choices: o.map(x => x.t), right: o.findIndex(x => x.ok), says: o.map(x => ({ say: x.say, mc: x.mc })) };
}
function choiceCheck(right: number, says: { say: string; mc?: string }[]) {
  return (r: Response): Verdict => {
    if (r.kind !== 'choice' || !says[r.i]) return { ok: false, say: 'Pick one answer.' };
    return { ok: r.i === right, mc: r.i === right ? undefined : says[r.i]!.mc, say: says[r.i]!.say };
  };
}
/** a choice item from options (shuffled), with its probes = every wrong option that carries an id */
function choiceItem(R: () => number, base: Omit<ProbItem, 'input' | 'choices' | 'answer' | 'check'>, opts: Opt[]): ProbItem {
  const o = options(R, opts);
  const it: ProbItem = { ...base, solution: endOnChoice(base.solution, o.choices[o.right]!), input: 'choice', choices: o.choices, answer: { kind: 'choice', i: o.right }, check: choiceCheck(o.right, o.says) };
  o.says.forEach((s, i) => { if (s.mc && i !== o.right) probe(it, { kind: 'choice', i }, s.mc); });
  return it;
}

// ---------- shared contexts ----------
const COLS: readonly MarbleCol[] = ['blue', 'white', 'pink', 'gray'];
const NAMES = ['Ana', 'Ben', 'Cara', 'Dev', 'Eli', 'Fay', 'Gus', 'Hana', 'Ivan', 'Jade', 'Kai', 'Lena'];
function bagOf(R: () => number, colors: number, total: [number, number]): Group[] {
  for (;;) {
    const cols = shuffle(R, COLS.slice()).slice(0, colors);
    const T = int(R, total[0], total[1]);
    const ns = cols.map(() => 1);
    for (let i = colors; i < T; i++) ns[int(R, 0, colors - 1)]!++;
    const groups = cols.map((c, i) => ({ col: c, n: ns[i]! }));
    if (new Set(ns).size > 1 || colors === 1) return groups;
  }
}
const bagText = (g: readonly Group[]) => {
  const parts = g.map(x => `${x.n} ${x.col}`);
  return parts.length === 2 ? `${parts[0]} and ${parts[1]}` : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
};
const total = (g: readonly Group[]) => g.reduce((s, x) => s + x.n, 0);
const wordTex = (w: Word) => txt(w);

// =====================================================================================================
// 1. scale: place an event on the 0-1 scale; a forecast is not a promise   [probability-scale-0-1]
const SCALE_EVENTS: { t: string; s: string; v: Frac }[] = [
  { t: 'rolling a 7 on a number cube', s: '7', v: [0, 6] },
  { t: 'rolling a number less than 7 on a number cube', s: 'less than 7', v: [6, 6] },
  { t: 'a fair coin landing heads', s: 'heads', v: [1, 2] },
  { t: 'rolling a 6 on a number cube', s: '6', v: [1, 6] },
  { t: 'rolling a number greater than 1 on a number cube', s: 'more than 1', v: [5, 6] },
  { t: 'pulling a blue marble from a bag of 9 blue marbles and 1 white', s: 'blue', v: [9, 10] },
  { t: 'pulling the white marble from a bag of 9 blue marbles and 1 white', s: 'white', v: [1, 10] },
  { t: 'rolling an even number on a number cube', s: 'even', v: [3, 6] },
  { t: 'spinning a 3 on a spinner with 10 equal parts numbered 1 to 10', s: '3', v: [1, 10] },
  { t: 'pulling a pink marble from a bag that holds only blue and white marbles', s: 'pink', v: [0, 8] },
  { t: 'a spinner with 4 equal parts, 3 of them striped, landing on a striped part', s: 'striped', v: [3, 4] },
  { t: 'picking a ticket with a name on it from a hat of 20 name tickets', s: 'a name', v: [20, 20] },
];
const scale: Gen = (R, n) => {
  const mode = pick(R, ['event', 'event', 'value', 'forecast'] as const);
  if (mode === 'forecast') {
    const high = R() < 0.6, p = high ? pick(R, [60, 70, 80, 90]) : pick(R, [10, 20, 30]);
    const what = pick(R, ['rain', 'snow', 'thunderstorms']);
    const prompt = `The forecast says ${p === 8 || p === 11 || p === 18 || (p >= 80 && p < 90) ? 'an' : 'a'} ${A(pct(p))} chance of ${what} today (that is ${p} out of 100). ${high ? `It stays dry all day.` : `It ${what === 'thunderstorms' ? 'storms' : what + 's'} in the afternoon.`} Was the forecast wrong?`;
    const w = high ? 'likely' : 'unlikely';
    return choiceItem(R, {
      id: `sc-f-${n}`, family: 'scale', prompt, board: `P(\\text{${what}}) = ${p}\\%`,
      pic: { kind: 'scale', pins: [{ v: [p, 100], tex: `${p}\\%`, col: 'link' }], given: 1 },
      hero: `${p}\\%:\\ \\text{${w}}`,
      solution: [`${p} out of 100 is between 0 and 1: ${w}, not ${high ? 'certain' : 'impossible'}.`, `On days with this forecast, ${what} ${high ? `does not come about ${100 - p}` : `comes about ${p}`} times in 100. Today was one of those.`, 'One day can not prove a probability right or wrong.'],
    }, [
      { t: `No. ${p} out of 100 makes ${what} ${w}, not ${high ? 'certain' : 'impossible'}.`, ok: true, say: `Right. A probability measures how likely, not what must happen on one day.` },
      { t: `Yes. It ${high ? 'said ' + what + ' was likely, and then it stayed dry' : 'said ' + what + ' was unlikely, and then it happened'}.`, mc: 'mc.probability.single-outcome-judges-probability', say: `One day can't judge a probability. ${p} out of 100 means ${high ? 'dry days still happen, about ' + (100 - p) : what + ' still happens, about ' + p} times in 100.` },
      { t: `It was really 50-50 all along: it ${what === 'thunderstorms' ? 'storms' : what + 's'} or it doesn't.`, mc: 'mc.probability.equiprobability-bias', say: `Two outcomes don't make 50-50. The forecast gives ${p} out of 100, which is ${w}.` },
    ]);
  }
  const ev = pick(R, SCALE_EVENTS), w = wordOf(ev.v);
  const valTex = ev.v[0] === 0 ? '0' : ev.v[0] === ev.v[1] ? '1' : tf(ev.v[0], ev.v[1]);
  const valHtml = ev.v[0] === 0 ? '0' : ev.v[0] === ev.v[1] ? '1' : fr(ev.v[0], ev.v[1]);
  const showDec = mode === 'value' && R() < 0.5 && 100 % ev.v[1] === 0;
  const prompt = mode === 'event'
    ? `How likely is ${S(ev.t)}?`
    : `P(${ev.s}) = ${S(valHtml)}${showDec ? ` (that is ${num(ev.v)})` : ''}. Which word fits?`;
  // the five words keep their scale order (a scale, not a list to shuffle)
  const says = WORDS.map(x => ({
    mc: x !== w && x === 'as likely as not' ? 'mc.probability.equiprobability-bias' : undefined,
    say: x === w ? `Yes: ${valHtml} is ${w}.` : x === 'as likely as not' ? `“As likely as not” is exactly ${fr(1, 2)}. Two outcomes don't make 50-50: ${ev.t} has probability ${valHtml}, so it is ${w}.` : `${valHtml} is ${w}: ${w === 'impossible' ? 'it can never happen' : w === 'certain' ? 'it always happens' : w === 'unlikely' ? `it is between 0 and ${fr(1, 2)}` : w === 'likely' ? `it is between ${fr(1, 2)} and 1` : `exactly ${fr(1, 2)}`}.`,
  }));
  const right = WORDS.indexOf(w);
  const it: ProbItem = {
    id: `sc-${mode}-${n}`, family: 'scale', prompt, board: `P(\\text{${ev.s}}) = ${mode === 'event' ? '\\,?' : valTex}`,
    pic: { kind: 'scale', pins: [{ v: ev.v, tex: valTex, col: 'link' }], given: 0 },
    hero: mode === 'event' ? `P(\\text{${ev.s}}) = ${valTex}` : `${valTex}:\\ \\text{${w}}`,
    solution: [`P(${ev.s}) = ${valHtml}${ev.v[0] > 0 && ev.v[0] < ev.v[1] ? ` (${ev.v[0]} of the ${ev.v[1]} equally likely outcomes)` : ''}.`, `On the scale from 0 to 1 that is ${S(w)}.`],
    input: 'choice', choices: WORDS.map(x => x[0]!.toUpperCase() + x.slice(1)), answer: { kind: 'choice', i: right }, check: choiceCheck(right, says),
  };
  if (w !== 'as likely as not') probe(it, { kind: 'choice', i: WORDS.indexOf('as likely as not') }, 'mc.probability.equiprobability-bias');
  return it;
};

// =====================================================================================================
// 2. space: the complete sample space of one trial, at the level that is recorded   [sample-space-single-stage]
const space: Gen = (R, n) => {
  const mode = pick(R, ['seen', 'color', 'marble', 'count'] as const);
  if (mode === 'seen') {
    const k = int(R, 3, 5);
    const pool = shuffle(R, [1, 2, 3, 4, 5, 6]).slice(0, k - 1);
    const seen = shuffle(R, [...pool, pick(R, pool)]);
    const uniq = [...new Set(seen)].sort((a, b) => a - b);
    return choiceItem(R, {
      id: `sp-s-${n}`, family: 'space', prompt: `A number cube has been rolled ${seen.length} times: ${seen.join(', ')}. What is the sample space for ${S('one roll')}?`,
      board: `S = \\{\\;?\\;\\}`, pic: { kind: 'streak', past: seen.map(String), coin: false, dice: true, title: 'rolled so far' },
      hero: 'S = \\{1, 2, 3, 4, 5, 6\\}',
      solution: ['The sample space lists every outcome one roll CAN give, not only the ones seen so far.', `A number cube has six faces: ${setH([1, 2, 3, 4, 5, 6])}.`],
    }, [
      { t: setH([1, 2, 3, 4, 5, 6]), ok: true, say: 'Yes: all six faces can come up, even the ones that have not appeared yet.' },
      { t: setH(uniq), mc: 'mc.probability.incomplete-sample-space', say: `Those are only the results seen so far. Faces like ${[1, 2, 3, 4, 5, 6].filter(v => !uniq.includes(v)).join(', ')} can come up too.` },
      { t: setH(seen), mc: 'mc.probability.incomplete-sample-space', say: 'That repeats the results seen so far. A sample space lists each possible outcome once: all six faces.' },
    ]);
  }
  const g = bagOf(R, int(R, 2, 3), [3, 8]);
  const sp = bagSpace(g), cols = g.map(x => x.col);
  if (mode === 'color' || mode === 'marble') {
    const byMarble = mode === 'marble';
    const objs = sp.map(o => o.id);
    const many = g.find(x => x.n > 1)!;
    return choiceItem(R, {
      id: `sp-${mode}-${n}`, family: 'space',
      prompt: byMarble
        ? `A bag holds ${A(bagText(g))} marbles. Each marble has its own number sticker (${sp.map(o => sub(o.id)).slice(0, 2).join(', ')}, ...). You pull one and write down ${S('which marble')} it is. What is the sample space?`
        : `A bag holds ${A(bagText(g))} marbles. You pull one and write down ${S('its color')}. What is the sample space?`,
      board: `S = \\{\\;?\\;\\}`, pic: { kind: 'bag', groups: g, labels: byMarble },
      hero: byMarble ? (sp.length <= 4 ? `S = \\{${sp.map(o => o.tex).join(', ')}\\}` : `${sp.length}\\ \\text{outcomes}`) : `S = \\{${cols.map(c => txt(c)).join(', ')}\\}`,
      solution: byMarble
        ? [`What is recorded is the marble, so every marble is its own outcome: ${setH(objs)}.`, `That is ${sp.length} outcomes.`]
        : [`What is recorded is the color, so the outcomes are the colors: ${setH(cols)}.`, 'Each color once, and nothing else in the list.'],
    }, byMarble ? [
      { t: setH(objs), ok: true, say: `Yes: one outcome per marble, ${sp.length} in all.` },
      { t: setH(cols), say: `That records the color. Here you write down which marble, so each of the ${sp.length} marbles is an outcome.` },
      { t: setH([...objs, many.col]), mc: 'mc.probability.mixes-description-levels', say: `“${many.col}” is not one more outcome: it is a group of marbles already in the list. Keep one level: the marbles.` },
    ] : [
      { t: setH(cols), ok: true, say: 'Yes: each color once.' },
      { t: setH([many.col, ...bagSpace([many]).map(o => o.id), ...cols.filter(c => c !== many.col)]), mc: 'mc.probability.mixes-description-levels', say: `That mixes two levels: “${many.col}” and the single ${many.col} marbles. What is recorded is the color, so list the colors only.` },
      { t: setH(cols.slice(0, -1)), mc: 'mc.probability.incomplete-sample-space', say: `${cols[cols.length - 1]} can come up too: the list must hold every possible color.` },
    ]);
  }
  // count: how many outcomes (spinner, class, bag by marble)
  const sub2 = pick(R, ['spinner', 'class', 'bag'] as const);
  if (sub2 === 'spinner') {
    const k = int(R, 3, 10);
    const it: ProbItem = {
      id: `sp-c-${n}`, family: 'space', prompt: `A spinner has ${A(`${k} equal parts`)}, numbered 1 to ${k}. How many outcomes are in the sample space of one spin?`,
      board: `\\text{outcomes} = \\,?`, input: 'num', unit: 'outcomes',
      pic: k <= 10 ? { kind: 'spinner', sectors: Array.from({ length: k }, (_, i) => ({ parts: 1, col: COLS[i % 4]!, label: String(i + 1) })) } : undefined,
      hero: `S = \\{1, \\dots, ${k}\\}:\\ ${k}`,
      solution: [`One spin can land on any of the numbers 1 to ${k}.`, `So the sample space has ${k} outcomes.`], answer: N(k),
      check: r => numCheck(r, k, `Yes: ${k} outcomes, one per part.`, [{ v: k - 1, say: `Count again: the numbers 1 to ${k} are ${k} outcomes.` }], `Each of the ${k} numbered parts is one outcome: ${k}.`),
    };
    return it;
  }
  if (sub2 === 'class') {
    const k = int(R, 18, 30);
    return {
      id: `sp-k-${n}`, family: 'space', prompt: `A teacher picks one student at random from a class list of ${A(`${k} students`)}. How many outcomes are in the sample space?`,
      board: `\\text{outcomes} = \\,?`, input: 'num', unit: 'outcomes', hero: `${k}\\ \\text{outcomes}`,
      solution: ['Each student on the list is one possible outcome.', `${k} students, so ${k} outcomes.`], answer: N(k),
      check: r => numCheck(r, k, `Yes: ${k}.`, [{ v: 2, mc: 'mc.probability.equiprobability-bias', say: `Picked or not picked is not the sample space: every one of the ${k} students is an outcome.` }], `Every student is one outcome: ${k}.`),
    };
  }
  const T = total(g);
  const it: ProbItem = {
    id: `sp-b-${n}`, family: 'space', prompt: `A bag holds ${A(bagText(g))} marbles, each with its own number sticker. You record ${S('which marble')} you pull. How many outcomes are in the sample space?`,
    board: `\\text{outcomes} = \\,?`, input: 'num', unit: 'outcomes', pic: { kind: 'bag', groups: g, labels: false },
    hero: T <= 4 ? `S = \\{${sp.map(o => o.tex).join(', ')}\\}` : `${T}\\ \\text{outcomes}`,
    solution: ['The marble is recorded, so each marble is one outcome.', `${g.map(x => x.n).join(' + ')} = ${T} outcomes.`], answer: N(T),
    check: r => numCheck(r, T, `Yes: ${T} marbles, ${T} outcomes.`, [{ v: g.length, mc: 'mc.probability.mixes-description-levels', say: `${g.length} is the number of colors. Here the marble is recorded, so each of the ${T} marbles is an outcome.` }], `Count every marble: ${T}.`),
  };
  probe(it, N(g.length), 'mc.probability.mixes-description-levels');
  return it;
};

// =====================================================================================================
// 3. event: the outcomes that make up an event   [event-as-subset]
const CUBE_EVENTS: { t: string; set: number[]; lure?: number[]; s: string }[] = [
  { t: 'an even number', set: [2, 4, 6], s: 'even' },
  { t: 'an odd number', set: [1, 3, 5], s: 'odd' },
  { t: 'a number greater than 4', set: [5, 6], lure: [4, 5, 6], s: 'greater than 4' },
  { t: 'a number greater than 3', set: [4, 5, 6], lure: [3, 4, 5, 6], s: 'greater than 3' },
  { t: 'a number less than 3', set: [1, 2], lure: [1, 2, 3], s: 'less than 3' },
  { t: 'at most 2', set: [1, 2], lure: [1], s: 'at most 2' },
  { t: 'at most 4', set: [1, 2, 3, 4], lure: [1, 2, 3], s: 'at most 4' },
  { t: 'at least 5', set: [5, 6], lure: [6], s: 'at least 5' },
  { t: 'not a 6', set: [1, 2, 3, 4, 5], s: 'not a 6' },
  { t: 'a multiple of 3', set: [3, 6], s: 'multiple of 3' },
  { t: 'a number greater than 6', set: [], s: 'greater than 6' },
  { t: 'a number less than 7', set: [1, 2, 3, 4, 5, 6], s: 'less than 7' },
  { t: 'a 4', set: [4], s: '4' },
];
const evSet = (xs: readonly number[]) => (xs.length ? setH(xs) : '{ } (no outcomes)');
const evTex = (xs: readonly (number | string)[]) => (xs.length ? `\\{${xs.join(', ')}\\}` : '\\{\\;\\}');
const event: Gen = (R, n) => {
  if (R() < 0.3) {
    // a bag, at the marble level
    const g = bagOf(R, 2, [3, 7]), sp = bagSpace(g), many = g.find(x => x.n > 1)!;
    const ids = sp.filter(o => o.group === many.col).map(o => o.id);
    const it = choiceItem(R, {
      id: `ev-b-${n}`, family: 'event', prompt: `A bag holds ${A(bagText(g))} marbles, each with its own sticker: ${setH(sp.map(o => o.id))}. Which outcomes make up the event ${S(`“the marble is ${many.col}”`)}?`,
      board: `\\text{${many.col}} = \\{\\;?\\;\\}`, pic: { kind: 'bag', groups: g, labels: true, event: ids },
      hero: ids.length > 3 ? `\\text{${many.col}}:\\ ${ids.length}\\ \\text{outcomes}` : `\\text{${many.col}} = ${evTex(sp.filter(o => o.group === many.col).map(o => o.tex))}`,
      solution: [`The event “${many.col}” happens when you pull any of the ${many.col} marbles.`, `So it is made of ${ids.length} outcomes: ${setH(ids)}.`],
    }, [
      { t: setH(ids), ok: true, say: `Yes: every ${many.col} marble is an outcome of the event.` },
      { t: setH([ids[0]!]), mc: 'mc.probability.event-must-be-single-outcome', say: `An event can hold several outcomes. Pulling ANY ${many.col} marble makes it happen: ${setH(ids)}.` },
      { t: setH([LETTER[many.col]]), mc: 'mc.probability.mixes-description-levels', say: `The outcomes here are the marbles, so the event lists the ${many.col} marbles one by one: ${setH(ids)}.` },
    ]);
    return it;
  }
  const ev = pick(R, CUBE_EVENTS);
  const pic: Pic = { kind: 'cube', event: ev.set };
  const solution = [`Go through the six faces 1 to 6 and keep the ones that are ${ev.t}.`, `The event is ${evSet(ev.set)}: ${ev.set.length} outcome${ev.set.length === 1 ? '' : 's'}.`];
  if (R() < 0.45) {
    const k = ev.set.length;
    const it: ProbItem = {
      id: `ev-n-${n}`, family: 'event', prompt: `Roll a number cube. How many outcomes make up the event ${S(`“${ev.t}”`)}?`,
      board: `\\text{${ev.s}}`, input: 'num', unit: 'outcomes', pic, picOnSolve: false, hero: evTex(ev.set),
      solution, answer: N(k),
      check: r => numCheck(r, k, `Yes: ${evSet(ev.set)}, ${k}.`, [
        ...(ev.lure ? [{ v: ev.lure.length, mc: 'mc.linear-equations.bound-phrase-strictness-wrong', say: `Check the boundary: “${ev.t}” ${ev.lure.length > k ? 'does not include' : 'includes'} ${ev.lure.length > k ? ev.lure.find(x => !ev.set.includes(x)) : ev.set.find(x => !ev.lure!.includes(x))}. The event is ${evSet(ev.set)}.` }] : []),
        ...(k >= 2 ? [{ v: 1, mc: 'mc.probability.event-must-be-single-outcome', say: `An event can hold several outcomes: ${evSet(ev.set)} is ${k}.` }] : []),
      ], `Check each face: the event is ${evSet(ev.set)}, ${k} outcome${k === 1 ? '' : 's'}.`),
    };
    if (ev.lure && ev.lure.length !== k) probe(it, N(ev.lure.length), 'mc.linear-equations.bound-phrase-strictness-wrong');
    if (k >= 2 && (!ev.lure || ev.lure.length !== 1)) probe(it, N(1), 'mc.probability.event-must-be-single-outcome');
    return it;
  }
  const opts: Opt[] = [{ t: evSet(ev.set), ok: true, say: `Yes: ${evSet(ev.set)}.` }];
  if (ev.lure) opts.push({ t: evSet(ev.lure), mc: 'mc.linear-equations.bound-phrase-strictness-wrong', say: `Check the boundary number: “${ev.t}” ${ev.lure.length > ev.set.length ? 'leaves out' : 'keeps'} ${ev.lure.length > ev.set.length ? ev.lure.find(x => !ev.set.includes(x)) : ev.set.find(x => !ev.lure!.includes(x))}. The event is ${evSet(ev.set)}.` });
  if (ev.set.length >= 2) opts.push({ t: `No list: an event can only be one outcome`, mc: 'mc.probability.event-must-be-single-outcome', say: `An event can hold several outcomes, or none, or all. Here it is ${evSet(ev.set)}.` });
  const others = [[1, 2, 3], [4, 5, 6], [2, 4], [1, 3, 5], [6], [3], [1, 6], [2, 3, 4, 5]].map(x => evSet(x)).filter(t => !opts.some(o => o.t === t));
  while (opts.length < 3) opts.push({ t: others.shift()!, say: `Check each face against “${ev.t}”: the event is ${evSet(ev.set)}.` });
  return choiceItem(R, {
    id: `ev-c-${n}`, family: 'event', prompt: `Roll a number cube. Which outcomes make up the event ${S(`“${ev.t}”`)}?`,
    board: `\\text{${ev.s}} = \\{\\;?\\;\\}`, pic, hero: evTex(ev.set), solution,
  }, opts);
};

// =====================================================================================================
// 4. equal: does the mechanism justify equally likely outcomes?   [equal-likelihood-assumption]
type Lk = 'eq' | 'neq' | 'data';
const EQ_TEXT: Record<Lk, string> = {
  eq: 'Equally likely: the way it is chosen treats every outcome the same',
  neq: 'Not equally likely: some outcomes have more ways to happen, or a bigger part',
  data: 'Can’t tell without data: toss it many times and look',
};
const equal: Gen = (R, n) => {
  const g = bagOf(R, 2, [3, 6]);
  const cases: { t: string; s: string; ans: Lk; why: string; pic?: Pic }[] = [
    { t: 'A fair number cube is rolled. The outcomes are 1, 2, 3, 4, 5, 6.', s: 'number cube', ans: 'eq', why: 'every face has the same shape and size', pic: { kind: 'cube' } },
    { t: '20 identical tickets with names on them are mixed in a hat, and one is pulled without looking. The outcomes are the 20 names.', s: 'name tickets', ans: 'eq', why: 'the tickets are identical and mixed' },
    { t: 'A spinner has 4 equal parts: blue, white, pink and gray. The outcomes are the 4 colors.', s: 'equal spinner', ans: 'eq', why: 'the four parts are the same size', pic: { kind: 'spinner', sectors: [{ parts: 1, col: 'blue' }, { parts: 1, col: 'white' }, { parts: 1, col: 'pink' }, { parts: 1, col: 'gray' }] } },
    { t: 'A spinner is half blue, one third white and one sixth pink. The outcomes are blue, white and pink.', s: 'unequal spinner', ans: 'neq', why: 'the parts are different sizes', pic: { kind: 'spinner', sectors: [{ parts: 1, col: 'blue' }, { parts: 1, col: 'white' }, { parts: 1, col: 'pink' }], angles: [1 / 2, 1 / 3, 1 / 6] } },
    { t: 'A paper cup is tossed. The outcomes are: it lands upright, upside down, or on its side.', s: 'paper cup', ans: 'data', why: 'the cup is not symmetric, so only many tosses can tell' },
    { t: 'A thumbtack is tossed. The outcomes are: point up, point down.', s: 'thumbtack', ans: 'data', why: 'the tack is not symmetric, so only many tosses can tell' },
    { t: 'A water bottle is flipped. The outcomes are: it lands standing up, or it does not.', s: 'bottle flip', ans: 'data', why: 'only many flips can tell how often it stands' },
    { t: `A bag of ${bagText(g)} marbles is mixed, and you pull one. The outcomes are the colors: ${g.map(x => x.col).join(' and ')}.`, s: 'colors', ans: 'neq', why: `there are more ${[...g].sort((a, b) => b.n - a.n)[0]!.col} marbles`, pic: { kind: 'bag', groups: g, labels: false } },
    { t: `A bag of ${bagText(g)} marbles, each with its own number sticker, is mixed, and you pull one. The outcomes are the ${total(g)} marbles.`, s: 'marbles', ans: 'eq', why: 'the marbles are the same size and mixed', pic: { kind: 'bag', groups: g, labels: true } },
    { t: 'A number cube has a weight hidden inside that makes the 6 land on top more often. The outcomes are 1 to 6.', s: 'weighted cube', ans: 'neq', why: 'the weight favors the 6' },
    { t: 'A fair coin is tossed. The outcomes are heads and tails.', s: 'coin', ans: 'eq', why: 'the coin is balanced' },
  ];
  const cs = pick(R, cases);
  const opts: Opt[] = (['eq', 'neq', 'data'] as const).map(k => ({
    t: EQ_TEXT[k], ok: k === cs.ans,
    mc: k !== cs.ans && k === 'eq' ? 'mc.probability.equiprobability-bias' : undefined,
    say: k === cs.ans ? `Yes: ${cs.why}.` : k === 'eq' ? `Listing the outcomes doesn't make them equally likely. Here ${cs.why}.` : cs.ans === 'eq' ? `Here the mechanism already settles it: ${cs.why}, so the outcomes are equally likely.` : `Look at the mechanism: ${cs.why}.`,
  }));
  return choiceItem(R, {
    id: `eq-${cs.s.replace(/\s/g, '')}-${n}`, family: 'equal', prompt: `${cs.t} Are the outcomes equally likely?`,
    board: `\\text{equally likely?}`, pic: cs.pic, hero: `\\text{${cs.ans === 'eq' ? 'equally likely' : cs.ans === 'neq' ? 'not equally likely' : 'need data'}}`,
    solution: [`Look at how the outcome is chosen, not at the list: ${cs.why}.`, cs.ans === 'eq' ? 'So the outcomes are equally likely.' : cs.ans === 'neq' ? 'So the outcomes are not equally likely.' : 'So we can’t tell without data from many trials.'],
  }, opts);
};

// =====================================================================================================
// 5. relFreq: experimental probability = occurrences / total trials   [experimental-relative-frequency]
const EXPS = [
  { thing: 'A paper cup', verb: 'was tossed', cats: ['upright', 'upside down', 'on its side'] },
  { thing: 'A thumbtack', verb: 'was tossed', cats: ['point up', 'point down'] },
  { thing: 'A water bottle', verb: 'was flipped', cats: ['standing', 'not standing'] },
  { thing: 'A basketball player', verb: 'took free throws', cats: ['made', 'missed'] },
  { thing: 'A coin', verb: 'was tossed', cats: ['heads', 'tails'] },
] as const;
const relFreq: Gen = (R, n) => {
  const e = pick(R, EXPS);
  const big = R() < 0.5, T = big ? pick(R, [40, 50, 60, 80, 100]) : int(R, 10, 20);
  const k = e.cats.length;
  // zero / all successes only where that is believable: a few trials, not a coin
  const edge = e.thing !== 'A coin' && !big && R() < 0.2;
  let counts: number[];
  if (edge) {
    // zero successes or all successes: the asked category is 0 or everything
    const all = R() < 0.5;
    counts = Array.from({ length: k }, () => 0);
    if (all) counts[0] = T;
    else { counts[1] = k === 3 ? int(R, 1, T - 1) : T; if (k === 3) counts[2] = T - counts[1]!; }
  } else {
    do { counts = Array.from({ length: k }, () => 0); for (let i = 0; i < T; i++) counts[Math.min(k - 1, Math.floor(Math.pow(R(), 0.85) * k))]!++; }
    while (counts.some(c => c === 0));
  }
  const ask = edge ? 0 : int(R, 0, k - 1), a = counts[ask]!;
  if (!edge && R() < 0.25) {
    return choiceItem(R, {
      id: `rf-c-${n}`, family: 'relFreq', prompt: `${e.thing} ${e.verb}: ${e.cats.map((c, i) => `${c} ${counts[i]}`).join(', ')}. What does ${S(fr(a, T))} tell you about P(${e.cats[ask]})?`,
      board: `P(\\text{${e.cats[ask]}}) \\approx ${tf(a, T)}`, pic: { kind: 'bars', rows: e.cats.map((c, i) => ({ label: c, n: counts[i]! })), event: [ask], title: 'results' },
      hero: `P(\\text{${e.cats[ask]}}) \\approx ${tf(a, T)}`,
      solution: [`${a} of the ${T} trials gave ${e.cats[ask]}: the relative frequency is ${fr(a, T)}.`, 'It is an estimate from these trials. Another batch would likely give a slightly different share.'],
    }, [
      { t: `It is an estimate: another ${T} trials would likely give a slightly different share.`, ok: true, say: 'Yes: experimental probability estimates the probability; it varies from batch to batch.' },
      { t: `P(${e.cats[ask]}) is exactly ${fr(a, T)}, for good.`, mc: 'mc.statistics.sample-statistic-as-exact-parameter', say: `${fr(a, T)} comes from just these ${T} trials. It is an estimate; the next batch will likely differ a little.` },
      { t: `P(${e.cats[ask]}) is ${fr(1, k)}, because there are ${k} ways it can come out.`, mc: 'mc.probability.equiprobability-bias', say: `${k} outcomes don't make them equally likely. The data say ${fr(a, T)}, an estimate.` },
    ]);
  }
  const rows: BarRow[] = e.cats.map((c, i) => ({ label: c, n: counts[i]! }));
  const it: ProbItem = {
    id: `rf-${n}`, family: 'relFreq',
    prompt: `${e.thing} ${e.verb}. The results: ${e.cats.map((c, i) => `${c} ${A(counts[i]!)}`).join(', ')}. What is the experimental probability of ${S(e.cats[ask]!)}?`,
    board: `P(\\text{${e.cats[ask]}}) \\approx \\,?`, input: 'frac', unit: '',
    pic: { kind: 'bars', rows, event: [ask], title: 'results' },
    hero: `P(\\text{${e.cats[ask]}}) \\approx \\frac{${a}}{${T}}`,
    solution: [`First the total number of trials: ${counts.join(' + ')} = ${A(T)}.`, `${e.cats[ask]} happened ${S(a)} ${a === 1 ? 'time' : 'times'}: ${a} out of ${T}, so about ${S(fr(a, T))}.`],
    answer: F(a, T),
    check: r => fracCheck(r, a, T, `Yes: ${a} of the ${T} trials, ${fr(a, T)}.`, [
      { v: [a, T - a], mc: 'mc.ratio-rate.confuses-whole-with-other-part', say: `${T - a} is the other trials. Divide by ALL the trials: ${counts.join(' + ')} = ${T}, so ${fr(a, T)}.` },
      { v: [a, k], mc: 'mc.probability.relative-frequency-over-possible-outcomes', say: `${k} is the number of ways it can land, not the number of trials. Divide by the ${T} trials: ${fr(a, T)}.` },
      { v: a, mc: 'mc.probability.count-reported-as-probability', say: `${a} is how many times it happened. As a probability: ${a} out of ${T} trials, ${fr(a, T)}.` },
    ], `Divide the count by the total number of trials: ${fr(a, T)}.`),
  };
  if (T - a > 0 && !same([a, T], a, T - a)) probe(it, F(a, T - a), 'mc.ratio-rate.confuses-whole-with-other-part');
  if (a > 0 && !same([a, T], a, k) && !same([a, T - a], a, k)) probe(it, F(a, k), 'mc.probability.relative-frequency-over-possible-outcomes');
  if (a > 1 && a !== T) probe(it, Wh(a), 'mc.probability.count-reported-as-probability');
  return it;
};

// =====================================================================================================
// 6. theory: favorable / total in a uniform model   [theoretical-uniform]
const theory: Gen = (R, n) => {
  const dev = pick(R, ['bag', 'bag', 'cube', 'spinner', 'tickets', 'class', 'edge'] as const);
  if (dev === 'edge') {
    const all = R() < 0.5;
    const ev = all ? { t: 'a number less than 7', s: 'less than 7' } : { t: 'a 7', s: '7' };
    return choiceItem(R, {
      id: `th-e-${n}`, family: 'theory', prompt: `Roll a number cube. What is the probability of rolling ${S(ev.t)}?`, board: `P(\\text{${ev.s}}) = \\,?`,
      pic: { kind: 'cube', event: all ? [1, 2, 3, 4, 5, 6] : [] }, hero: `P(\\text{${ev.s}}) = \\frac{${all ? 6 : 0}}{6} = ${all ? 1 : 0}`,
      solution: [all ? 'All 6 outcomes are in the event.' : 'No face shows a 7: the event has 0 outcomes.', `P = ${all ? 6 : 0} out of 6 = ${all ? '1, certain' : '0, impossible'}.`],
    }, all ? [
      { t: '1', ok: true, say: 'Yes: all six outcomes, certain.' },
      { t: '6', mc: 'mc.probability.count-reported-as-probability', say: '6 is the number of outcomes in the event. Divide by all 6 outcomes: 6 out of 6 = 1.' },
      { t: fr(6, 7), say: 'There are only 6 faces: 6 out of 6 = 1.' },
    ] : [
      { t: '0', ok: true, say: 'Yes: no outcome gives a 7, impossible.' },
      { t: fr(1, 7), say: 'There is no 7 on a number cube: 0 out of 6 = 0.' },
      { t: fr(1, 6), mc: 'mc.probability.equiprobability-bias', say: 'No face shows a 7, so no outcome is in the event: 0 out of 6 = 0.' },
    ]);
  }
  let fav: number, T: number, prompt: string, board: string, pic: Pic | undefined, sol: string[], nGroups = 0, label: string;
  if (dev === 'bag') {
    const big = R() < 0.25;
    const g = bagOf(R, int(R, 2, 3), big ? [13, 20] : [3, 12]);
    T = total(g); nGroups = g.length;
    const not = R() < 0.3, tg = pick(R, g);
    fav = not ? T - tg.n : tg.n;
    label = not ? `not ${tg.col}` : tg.col;
    const sp = bagSpace(g);
    prompt = `A bag holds ${A(bagText(g))} marbles. You pull one without looking. What is P(${S(label)})?`;
    board = `P(\\text{${label}}) = \\,?`;
    pic = T <= 12 ? { kind: 'bag', groups: g, labels: true, event: sp.filter(o => (not ? o.group !== tg.col : o.group === tg.col)).map(o => o.id) } : undefined;
    sol = [`Every marble is one equally likely outcome: ${A(T)} in all.`, `${not ? `Not ${tg.col}: ${T} − ${tg.n} = ${S(fav)}` : `${tg.col[0]!.toUpperCase() + tg.col.slice(1)}: ${S(fav)}`} ${fav === 1 ? 'marble is' : 'marbles are'} in the event.`, `P(${label}) = ${S(fr(fav, T))}.`];
  } else if (dev === 'cube') {
    const ev = pick(R, CUBE_EVENTS.filter(e => e.set.length > 0 && e.set.length < 6));
    fav = ev.set.length; T = 6; label = ev.s;
    prompt = `Roll a fair number cube. What is the probability of ${S(ev.t)}?`; board = `P(\\text{${ev.s}}) = \\,?`;
    pic = { kind: 'cube', event: ev.set };
    sol = [`6 equally likely faces.`, `${ev.t}: ${evSet(ev.set)}, ${fav} outcome${fav === 1 ? '' : 's'}.`, `P = ${S(fr(fav, 6))}.`];
  } else if (dev === 'spinner') {
    T = int(R, 5, 10); const m = int(R, 2, Math.floor(T / 2));
    const even = R() < 0.5;
    const set = Array.from({ length: T }, (_, i) => i + 1).filter(v => (even ? v % 2 === 0 : v > T - m));
    fav = set.length; label = even ? 'even' : `greater than ${T - m}`;
    prompt = `A spinner has ${A(`${T} equal parts`)}, numbered 1 to ${T}. What is P(${S(even ? 'an even number' : `a number greater than ${T - m}`)})?`;
    board = `P(\\text{${label}}) = \\,?`;
    pic = { kind: 'spinner', sectors: Array.from({ length: T }, (_, i) => ({ parts: 1, col: COLS[i % 4]!, label: String(i + 1) })), event: set.map(v => v - 1) };
    sol = [`${T} equal parts: ${T} equally likely outcomes.`, `In the event: ${setH(set)}, ${fav} outcomes.`, `P = ${S(fr(fav, T))}.`];
  } else if (dev === 'tickets') {
    T = int(R, 10, 20); const m = pick(R, [3, 4, 5]);
    fav = Math.floor(T / m); label = `multiple of ${m}`;
    prompt = `Tickets numbered 1 to ${A(T)} are mixed in a box, and one is pulled. What is P(${S(`a multiple of ${m}`)})?`;
    board = `P(\\text{multiple of } ${m}) = \\,?`; pic = undefined;
    sol = [`${T} tickets, each equally likely.`, `Multiples of ${m}: ${setH(Array.from({ length: fav }, (_, i) => m * (i + 1)))}, ${fav} tickets.`, `P = ${S(fr(fav, T))}.`];
  } else {
    const gl = int(R, 8, 16), by = int(R, 8, 16); T = gl + by;
    const girls = R() < 0.5; fav = girls ? gl : by; label = girls ? 'girl' : 'boy';
    prompt = `A class has ${gl} girls and ${by} boys. The teacher puts all ${A(T)} names in a hat and pulls one. What is P(${S(label)})?`;
    board = `P(\\text{${label}}) = \\,?`; pic = { kind: 'bars', rows: [{ label: 'girls', n: gl }, { label: 'boys', n: by }], event: [girls ? 0 : 1], title: 'names in the hat' };
    sol = [`Every name is equally likely: ${gl} + ${by} = ${A(T)} names.`, `${S(fav)} of them are ${label}s.`, `P(${label}) = ${S(fr(fav, T))}.`];
    nGroups = 2;
  }
  const it: ProbItem = {
    id: `th-${dev}-${n}`, family: 'theory', prompt, board, input: 'frac', pic, hero: `P(\\text{${label}}) = \\frac{${fav}}{${T}}`, solution: sol, answer: F(fav, T),
    check: r => fracCheck(r, fav, T, `Yes: ${fav} of the ${T} equally likely outcomes, ${fr(fav, T)}.`, [
      ...(nGroups ? [{ v: [1, nGroups] as Frac, mc: 'mc.probability.equiprobability-bias', say: `${nGroups} ${dev === 'class' ? 'groups' : 'colors'} are not equally likely. Count the ${dev === 'class' ? 'names' : 'marbles'}: ${fav} of ${T}.` }] : []),
      { v: [fav, T - fav], mc: 'mc.ratio-rate.confuses-whole-with-other-part', say: `${T - fav} is the outcomes NOT in the event. Divide by all ${T} outcomes: ${fr(fav, T)}.` },
      { v: fav, mc: 'mc.probability.count-reported-as-probability', say: `${fav} is how many outcomes are in the event. The probability is ${fav} out of ${T}: ${fr(fav, T)}.` },
    ], `Favorable outcomes over all outcomes: ${fr(fav, T)}.`),
  };
  if (nGroups && !same([fav, T], 1, nGroups)) probe(it, F(1, nGroups), 'mc.probability.equiprobability-bias');
  if (T - fav > 0 && !same([fav, T], fav, T - fav) && !(nGroups && same([fav, T - fav], 1, nGroups))) probe(it, F(fav, T - fav), 'mc.ratio-rate.confuses-whole-with-other-part');
  if (fav > 1 && T - fav !== 1) probe(it, Wh(fav), 'mc.probability.count-reported-as-probability');
  return it;
};

// =====================================================================================================
// 7. model: a complete model sums to 1   [complete-model-sums-to-1]
const model: Gen = (R, n) => {
  const mode = pick(R, ['missing', 'missing', 'valid', 'zero'] as const);
  if (mode === 'zero') {
    const T = pick(R, [20, 25, 30, 40]), up = int(R, 5, T - 5);
    return choiceItem(R, {
      id: `md-z-${n}`, family: 'model', prompt: `A paper cup was tossed ${A(T)} times: upright ${up}, on its side ${T - up}, upside down ${S('0')}. The model from these data gives P(upside down) = ${fr(0, T)}. What does that mean?`,
      board: `P(\\text{upside down}) \\approx ${tf(0, T)}`, pic: { kind: 'bars', rows: [{ label: 'upright', n: up }, { label: 'on its side', n: T - up }, { label: 'upside down', n: 0 }], event: [2], title: 'results' },
      hero: `${tf(0, T)}\\ \\text{is an estimate}`,
      solution: [`In ${T} tosses the cup never landed upside down, so the estimate is ${fr(0, T)}.`, 'It is an estimate, not proof: with more tosses it might still happen.'],
    }, [
      { t: `It is an estimate: in ${T} tosses it didn't happen, but it still could.`, ok: true, say: 'Yes: a zero count is an estimate, not proof that it is impossible.' },
      { t: 'Landing upside down is impossible for this cup.', mc: 'mc.statistics.sample-statistic-as-exact-parameter', say: `${T} tosses can't prove impossible. ${fr(0, T)} is an estimate from these data.` },
      { t: 'The model is broken: the probabilities no longer add to 1.', say: `They still add to 1: ${fr(up, T)} + ${fr(T - up, T)} + ${fr(0, T)} = ${fr(T, T)}.` },
    ]);
  }
  if (mode === 'valid') {
    const d = pick(R, [5, 6, 8, 10]);
    let a: number, b: number;
    do { a = int(R, 1, d - 2); b = int(R, 1, d - a - 1); } while (a === b && R() < 0.5);
    const c = d - a - b;
    const good = [a, b, c], short = [a, b, c - 1 > 0 ? c - 1 : c + 1], neg = [a + 1, b + c, -1];
    const show = (xs: number[]) => `A: ${xs[0]! < 0 ? '−' + fr(-xs[0]!, d) : fr(xs[0]!, d)} · B: ${fr(xs[1]!, d)} · C: ${xs[2]! < 0 ? '−' + fr(-xs[2]!, d) : fr(xs[2]!, d)}`;
    const sum = (xs: number[]) => xs.reduce((s, x) => s + x, 0);
    return choiceItem(R, {
      id: `md-v-${n}`, family: 'model', prompt: `A spinner can land on A, B or C. Which table could be a ${S('complete probability model')} for one spin?`,
      board: `P(A) + P(B) + P(C) = 1`, hero: `${tf(a, d)} + ${tf(b, d)} + ${tf(c, d)} = ${tf(d, d)} = 1`,
      solution: ['A complete model gives every outcome a probability from 0 to 1, and together they make exactly 1.', `${fr(a, d)} + ${fr(b, d)} + ${fr(c, d)} = ${fr(d, d)} = 1.`],
    }, [
      { t: show(good), ok: true, say: `Yes: every value is between 0 and 1, and they add to ${fr(d, d)} = 1.` },
      { t: show(short), mc: 'mc.probability.probabilities-not-summing-to-one', say: `Each value is between 0 and 1, but together they make ${fr(sum(short), d)}, not 1. A complete model must add to exactly 1.` },
      { t: show(neg), mc: 'mc.probability.probability-outside-zero-one', say: 'They add to 1, but a probability can never be negative.' },
    ]);
  }
  const emp = R() < 0.5;
  if (emp) {
    const T = pick(R, [20, 40, 50, 60, 100]);
    let a: number, b: number;
    do { a = int(R, 2, T - 4); b = int(R, 2, T - a - 2); } while (a === b);
    const c = T - a - b;
    const it: ProbItem = {
      id: `md-e-${n}`, family: 'model', prompt: `A paper cup was tossed ${A(T)} times. The model from the data: P(upright) = ${fr(a, T)}, P(on its side) = ${fr(b, T)}. What is P(${S('upside down')}) in this model?`,
      board: `P(\\text{upside down}) = \\,?`, input: 'frac',
      pic: { kind: 'bars', rows: [{ label: 'upright', n: a, tex: tf(a, T) }, { label: 'on its side', n: b, tex: tf(b, T) }, { label: 'upside down', n: c, tex: '?' }], event: [2], title: 'the model', max: T },
      hero: `1 - ${tf(a, T)} - ${tf(b, T)} = \\frac{${c}}{${T}}`,
      solution: ['The three probabilities must add to 1.', `1 = ${fr(T, T)}, and ${fr(T, T)} − ${fr(a, T)} − ${fr(b, T)} = ${S(fr(c, T))}.`], answer: F(c, T),
      check: r => fracCheck(r, c, T, `Yes: ${fr(a, T)} + ${fr(b, T)} + ${fr(c, T)} = 1.`, [{ v: [1, 3], mc: 'mc.probability.equiprobability-bias', say: `Three outcomes are not one third each here: the data give ${fr(a, T)} and ${fr(b, T)}. What is left of 1 is ${fr(c, T)}.` }, { v: [a + b, T], mc: 'mc.probability.probabilities-not-summing-to-one', say: `That is the two given probabilities added. The missing one is what is LEFT of 1: ${fr(c, T)}.` }], `What is left of 1: ${fr(T, T)} − ${fr(a, T)} − ${fr(b, T)} = ${fr(c, T)}.`),
    };
    if (!same([c, T], 1, 3)) probe(it, F(1, 3), 'mc.probability.equiprobability-bias');
    if (a + b !== c) probe(it, F(a + b, T), 'mc.probability.probabilities-not-summing-to-one');
    return it;
  }
  const d = pick(R, [6, 8, 10, 12]);
  let a: number, b: number;
  do { a = int(R, 1, d - 2); b = int(R, 1, d - a - 1); } while (a === b);
  const c = d - a - b;
  const sectors: Sector[] = [{ parts: a, col: 'blue', label: 'A' }, { parts: b, col: 'white', label: 'B' }, { parts: c, col: 'pink', label: 'C' }];
  const it: ProbItem = {
    id: `md-u-${n}`, family: 'model', prompt: `A spinner has ${A(`${d} equal parts`)}: ${a} are A, ${b} are B, the rest are C. The model: P(A) = ${fr(a, d)}, P(B) = ${fr(b, d)}. What is P(${S('C')})?`,
    board: `P(C) = \\,?`, input: 'frac', pic: { kind: 'spinner', sectors, event: [2] },
    hero: `1 - ${tf(a, d)} - ${tf(b, d)} = \\frac{${c}}{${d}}`,
    solution: ['The probabilities of A, B and C must add to 1.', `${fr(d, d)} − ${fr(a, d)} − ${fr(b, d)} = ${S(fr(c, d))}: that is the ${c} ${c === 1 ? 'part' : 'parts'} that ${c === 1 ? 'is' : 'are'} C.`], answer: F(c, d),
    check: r => fracCheck(r, c, d, `Yes: ${c} of the ${d} parts, and the three add to 1.`, [{ v: [1, 3], mc: 'mc.probability.equiprobability-bias', say: `A, B and C are not equally likely: the parts are ${a}, ${b} and ${c} of ${d}. P(C) = ${fr(c, d)}.` }, { v: [a + b, d], mc: 'mc.probability.probabilities-not-summing-to-one', say: `That adds P(A) and P(B). P(C) is what is LEFT of 1: ${fr(c, d)}.` }], `What is left of 1: ${fr(c, d)}.`),
  };
  if (!same([c, d], 1, 3)) probe(it, F(1, 3), 'mc.probability.equiprobability-bias');
  if (a + b !== c) probe(it, F(a + b, d), 'mc.probability.probabilities-not-summing-to-one');
  return it;
};

// =====================================================================================================
// 8. complement: P(not A) = 1 - P(A)   [complement]
const complement: Gen = (R, n) => {
  const mode = pick(R, ['frac', 'frac', 'cube', 'percent'] as const);
  if (mode === 'percent') {
    const p = pick(R, [10, 20, 30, 40, 60, 70, 80, 90]);
    const what = pick(R, ['rain', 'snow']);
    const it: ProbItem = {
      id: `cp-p-${n}`, family: 'complement', prompt: `The forecast says ${p === 8 || p === 11 || p === 18 || (p >= 80 && p < 90) ? 'an' : 'a'} ${A(pct(p))} chance of ${what} (that is ${p} out of 100). What is the chance of ${S(`no ${what}`)}?`,
      board: `P(\\text{no ${what}}) = \\,?`, input: 'num', unit: '%',
      pic: { kind: 'scale', pins: [{ v: [p, 100], tex: `${p}\\%`, col: 'second' }, { v: [100 - p, 100], tex: `${100 - p}\\%`, col: 'link' }], given: 1 },
      hero: `100\\% - ${p}\\% = ${100 - p}\\%`,
      solution: [`${what} and no ${what} together make all 100 out of 100.`, `100 − ${p} = ${S(100 - p)}, so ${100 - p}%.`], answer: N(100 - p),
      check: r => numCheck(r, 100 - p, `Yes: ${100 - p} out of 100.`, [{ v: 50, mc: 'mc.probability.equiprobability-bias', say: `${what} or no ${what} is not 50-50 here: the forecast gives ${p}%, so no ${what} is 100 − ${p} = ${100 - p}%.` }], `The two add to 100%: 100 − ${p} = ${100 - p}.`),
    };
    if (p !== 50) probe(it, N(50), 'mc.probability.equiprobability-bias');
    return it;
  }
  let a: number, b: number, ev: string, not: string, ctx: string;
  if (mode === 'cube') { b = 6; const k = int(R, 1, 6); a = 1; ev = `a ${k}`; not = `not a ${k}`; ctx = `Roll a number cube. P(${ev}) = ${fr(1, 6)}.`; }
  else {
    b = pick(R, [4, 5, 6, 8, 10, 12]); a = int(R, 1, b - 1);
    if (2 * a === b) a = Math.max(1, a - 1);
    const thing = pick(R, [['the spinner lands on blue', 'blue'], ['you pull a pink marble', 'pink'], ['the player makes the shot', 'made'], ['the bus is late', 'late']] as const);
    ev = thing[1]; not = `not ${thing[1]}`; ctx = `P(${thing[0]}) = ${fr(a, b)}.`;
  }
  const c = b - a;
  const it: ProbItem = {
    id: `cp-${mode}-${n}`, family: 'complement', prompt: `${ctx} What is P(${S(not)})?`,
    board: `P(\\text{${not}}) = \\,?`, input: 'frac',
    pic: { kind: 'scale', pins: [{ v: [a, b], tex: tf(a, b), col: 'second' }, { v: [c, b], tex: tf(c, b), col: 'link' }], given: 1 },
    hero: `1 - ${tf(a, b)} = \\frac{${c}}{${b}}`,
    solution: [`“${ev}” and “${not}” together are every outcome, so their probabilities add to 1.`, `1 = ${fr(b, b)}, and ${fr(b, b)} − ${fr(a, b)} = ${S(fr(c, b))}.`], answer: F(c, b),
    check: r => fracCheck(r, c, b, `Yes: ${fr(a, b)} + ${fr(c, b)} = 1.`, [
      { v: [100 * b - a, b], mc: 'mc.probability.complement-subtracted-from-100', say: `100 is the whole in percent. Here the whole is 1: 1 − ${fr(a, b)} = ${fr(c, b)}.` },
      { v: [1, 2], mc: 'mc.probability.equiprobability-bias', say: `“${ev}” or “${not}” is not 50-50 here: 1 − ${fr(a, b)} = ${fr(c, b)}.` },
    ], `The two add to 1: 1 − ${fr(a, b)} = ${fr(c, b)}.`),
  };
  probe(it, { kind: 'frac', w: 99, n: b - a, d: b }, 'mc.probability.complement-subtracted-from-100');
  if (2 * c !== b) probe(it, F(1, 2), 'mc.probability.equiprobability-bias');
  return it;
};

// =====================================================================================================
// 9. forms: fractions, decimals and percents; comparing; staying in 0..1   [probability-notation-forms]
const DENS = [2, 4, 5, 10, 20, 25, 50, 100];
function asForm(p: number, form: 'f' | 'd' | 'p', R: () => number): { html: string; tex: string; key: number } {
  if (form === 'p') return { html: `${p}%`, tex: `${p}\\%`, key: p };
  if (form === 'd') { const s = (p / 100).toString(); return { html: s, tex: s, key: Number(s.replace('0.', '')) }; }
  const ds = DENS.filter(d => (p * d) % 100 === 0);
  const d = pick(R, ds); const a = (p * d) / 100;
  return { html: fr(a, d), tex: tf(a, d), key: a };
}
const forms: Gen = (R, n) => {
  const mode = pick(R, ['order', 'order', 'valid', 'comp', 'same'] as const);
  if (mode === 'order') {
    for (;;) {
      const ps = shuffle(R, [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95]).slice(0, 3);
      const fs = shuffle(R, ['f', 'd', 'p'] as ('f' | 'd' | 'p')[]);
      const vals = ps.map((p, i) => asForm(p, fs[i]!, R));
      const most = R() < 0.65;
      const best = ps.indexOf(most ? Math.max(...ps) : Math.min(...ps));
      const keys = vals.map(v => v.key);
      const lure = keys.indexOf(most ? Math.max(...keys) : Math.min(...keys));
      if (lure === best || new Set(keys).size < 3) continue;
      const L = ['A', 'B', 'C'];
      return choiceItem(R, {
        id: `fm-o-${n}`, family: 'forms', prompt: `Three events: ${L.map((l, i) => `P(${l}) = ${S(vals[i]!.html)}`).join(', ')}. Which event is ${most ? 'most' : 'least'} likely?`,
        board: vals.map(v => v.tex).join('\\quad '),
        pic: { kind: 'scale', pins: vals.map((v, i) => ({ v: [ps[i]!, 100] as Frac, tex: `${L[i]}`, col: i === best ? 'link' : 'dim' })), given: 0 },
        hero: `\\text{${L[best]}}:\\ ${ps[best]}\\%`,
        solution: [`Write all three the same way, as percents: ${L.map((l, i) => `${l} = ${ps[i]}%`).join(', ')}.`, `The ${most ? 'biggest' : 'smallest'} is ${ps[best]}%: event ${L[best]}.`],
      }, L.map((l, i) => ({
        t: `Event ${l}`, ok: i === best, mc: i !== best && i === lure ? 'mc.percent.compares-digits-across-forms' : undefined,
        say: i === best ? `Yes: as percents, ${L.map((q, j) => `${q} = ${ps[j]}%`).join(', ')}.` : i === lure ? `Bigger-looking digits don't make a bigger probability. As percents: ${L.map((q, j) => `${q} = ${ps[j]}%`).join(', ')}.` : `Compare them as percents: ${L.map((q, j) => `${q} = ${ps[j]}%`).join(', ')}.`,
      })));
    }
  }
  if (mode === 'valid') {
    const p = int(R, 1, 19) * 5;
    const ok = R() < 0.5 ? (p / 100).toString() : `${p}%`;
    const over = pick(R, [`${(1 + p / 100).toFixed(2).replace(/0$/, '')}`, `${100 + p}%`, `${fr(5, 4)}`]);
    const neg = R() < 0.5 ? `−${(p / 100).toString()}` : `−${p}%`;
    return choiceItem(R, {
      id: `fm-v-${n}`, family: 'forms', prompt: 'Which of these numbers could be a probability?', board: `0 \\le P \\le 1`,
      hero: `0 \\le P \\le 1 = 100\\%`, solution: ['A probability is never below 0 (impossible) and never above 1 (certain), which is 100%.', `Only ${ok} is between 0 and 1.`],
    }, [
      { t: ok, ok: true, say: `Yes: ${ok} is between 0 and 1.` },
      { t: over, mc: 'mc.probability.probability-outside-zero-one', say: `${over} is more than 1 (more than 100%): more than certain is not possible.` },
      { t: neg, mc: 'mc.probability.probability-outside-zero-one', say: `${neg} is below 0: less than impossible is not possible.` },
    ]);
  }
  if (mode === 'comp') {
    const p = int(R, 5, 95); const ps = (p / 100).toFixed(2), qs = ((100 - p) / 100).toFixed(2);
    const what = pick(R, ['rain', 'a delay', 'a win']);
    return choiceItem(R, {
      id: `fm-c-${n}`, family: 'forms', prompt: `P(${what}) = ${A(ps)}. What is P(${S(`no ${what.replace(/^a /, '')}`)})?`,
      board: `P(\\text{${what}}) = ${ps}`, pic: { kind: 'scale', pins: [{ v: [p, 100], tex: ps, col: 'second' }, { v: [100 - p, 100], tex: qs, col: 'link' }], given: 1 },
      hero: `1 - ${ps} = ${qs}`, solution: ['The two probabilities add to 1.', `1 − ${ps} = ${S(qs)}.`],
    }, [
      { t: qs, ok: true, say: `Yes: ${ps} + ${qs} = 1.` },
      { t: (100 - p / 100).toFixed(2), mc: 'mc.probability.complement-subtracted-from-100', say: `100 is the whole only in percent. As a decimal the whole is 1: 1 − ${ps} = ${qs}.` },
      { t: (1 + p / 100).toFixed(2), mc: 'mc.probability.probability-outside-zero-one', say: `That is more than 1. Take it away from 1: 1 − ${ps} = ${qs}.` },
    ]);
  }
  const d = pick(R, [2, 4, 5, 10]); let a = int(R, 1, d - 1);
  while (gcd(a, d) !== 1) a = int(R, 1, d - 1);
  const p = (100 * a) / d;
  return choiceItem(R, {
    id: `fm-s-${n}`, family: 'forms', prompt: `P(red) = ${S(fr(a, d))}. Which is the same probability?`, board: `P(\\text{red}) = ${tf(a, d)}`,
    pic: { kind: 'scale', pins: [{ v: [a, d], tex: tf(a, d), col: 'link' }], given: 0 },
    hero: `${tf(a, d)} = ${p / 100} = ${p}\\%`, solution: [`${fr(a, d)} = ${fr(p, 100)}: ${p} out of 100.`, `So ${p / 100}, or ${p}%.`],
  }, [
    { t: `${p / 100}, or ${p}%`, ok: true, say: `Yes: ${fr(a, d)} = ${fr(p, 100)}.` },
    { t: `0.${a}${d}, or ${a}${d}%`, mc: 'mc.percent.compares-digits-across-forms', say: `Writing the digits side by side doesn't convert. ${fr(a, d)} = ${fr(p, 100)} = ${p}%.` },
    { t: `${d}.${a}, or ${d}${a}0%`, mc: 'mc.probability.probability-outside-zero-one', say: `That is more than 1, and no probability is. ${fr(a, d)} = ${p / 100} = ${p}%.` },
  ]);
};

// =====================================================================================================
// 10. predict: about n·P occurrences in n trials   [predict-expected-count]
const predict: Gen = (R, n) => {
  const mode = pick(R, ['cube', 'p', 'p', 'exp', 'about'] as const);
  if (mode === 'about') {
    const T = pick(R, [100, 200, 300, 500]);
    const ev = pick(R, [{ t: 'heads', p: [1, 2] as Frac, ctx: `A fair coin is tossed ${T} times.` }, { t: 'a 6', p: [1, 6] as Frac, ctx: `A number cube is rolled ${6 * Math.round(T / 6)} times.` }]);
    const NN = ev.p[1] === 6 ? 6 * Math.round(T / 6) : T, e = expectedCount(ev.p, NN);
    return choiceItem(R, {
      id: `pr-a-${n}`, family: 'predict', prompt: `${ev.ctx} Which prediction for the number of times you get ${S(ev.t)} is best?`, board: `${tf(ev.p[0], ev.p[1])} \\times ${NN} = ${e}`,
      pic: { kind: 'strip', n: NN, d: ev.p[1], k: ev.p[0], title: `${NN} trials`, answer: `\\text{about } ${e}` },
      hero: `\\text{about } ${e}`, solution: [`${fr(ev.p[0], ev.p[1])} of ${NN} is ${e}.`, `It is a prediction of about ${e}: the real count will usually be a bit more or less.`],
    }, [
      { t: `About ${e}, maybe a few more or fewer.`, ok: true, say: `Yes: about ${e}. Chance moves it a little each time.` },
      { t: `Exactly ${e}.`, mc: 'mc.probability.ev-as-guaranteed-outcome', say: `${e} is the expected count, not a promise. The real count is usually a little off: “about ${e}”.` },
      { t: `Any count from 0 to ${NN} is just as likely.`, mc: 'mc.probability.equiprobability-bias', say: `Counts near ${e} are far more likely than counts near 0 or ${NN}. Predict about ${e}.` },
    ]);
  }
  let p: Frac, T: number, prompt: string, board: string, pctTxt: number | null = null, unit = 'times';
  if (mode === 'cube') {
    const ev = pick(R, [{ t: 'a 3 or a 6', k: 2 }, { t: 'a 6', k: 1 }, { t: 'an even number', k: 3 }, { t: 'a number greater than 2', k: 4 }, { t: 'a 1, 2 or 3', k: 3 }]);
    T = pick(R, [60, 120, 300, 600, 900]); p = [ev.k, 6];
    prompt = `A number cube is rolled ${A(`${T} times`)}. About how many times do you expect ${S(ev.t)}?`; board = `P = ${tf(ev.k, 6)},\\ ${T}\\ \\text{rolls}`;
  } else if (mode === 'p') {
    p = pick(R, [[1, 2], [1, 4], [1, 5], [3, 4], [2, 5], [3, 10]] as Frac[]);
    T = p[1] * int(R, 4, Math.floor(1000 / p[1] / 10)) * (R() < 0.5 ? 1 : 5);
    T = Math.min(1000, Math.max(20, T));
    T -= T % p[1];
    const usePct = R() < 0.4; pctTxt = usePct ? (100 * p[0]) / p[1] : null;
    const ctx = pick(R, [['A player makes', 'of her free throws', 'her next', 'shots', 'go in'], ['A spinner lands on blue', 'of the time', 'the next', 'spins', 'land on blue'], ['A bus is late', 'of the days', 'the next', 'school days', 'is it late']] as const);
    const pv = usePct ? `${pctTxt}%` : fr(p[0], p[1]);
    prompt = `${ctx[0]} ${S(pv)} ${ctx[1]}. About how many of ${ctx[2]} ${A(`${T} ${ctx[3]}`)} ${ctx[4]}?`;
    board = `P = ${usePct ? `${pctTxt}\\%` : tf(p[0], p[1])},\\ ${T}\\ \\text{trials}`;
    unit = ctx[3];
  } else {
    const m = pick(R, [20, 25, 30, 40, 50]); const a = int(R, 3, m - 3); const k = pick(R, [5, 10, 20]);
    T = m * k; p = [a, m];
    prompt = `A paper cup landed upright ${S(`${a} times in ${m} tosses`)}. About how many times would it land upright in ${A(`${T} tosses`)}?`;
    board = `P \\approx ${tf(a, m)},\\ ${T}\\ \\text{tosses}`; unit = 'times';
  }
  const e = expectedCount(p, T);
  const it: ProbItem = {
    id: `pr-${mode}-${n}`, family: 'predict', prompt, board, input: 'num', unit: `${unit} (about)`,
    pic: p[1] <= 12 ? { kind: 'strip', n: T, d: p[1], k: p[0], title: `${T} trials`, answer: `\\text{about } ${e}` } : undefined,
    hero: `${tf(p[0], p[1])} \\times ${T} = ${e}`,
    solution: [`The probability is ${fr(p[0], p[1])}${pctTxt !== null ? ` (${pctTxt}%)` : ''}, so expect about ${fr(p[0], p[1])} of the ${T} trials.`, `${T} ÷ ${p[1]} = ${T / p[1]}, times ${p[0]} = ${S(e)}. About ${e}, not exactly.`], answer: N(e),
    check: r => numCheck(r, e, `Yes: about ${e}.`, [
      ...(pctTxt !== null ? [{ v: pctTxt, mc: 'mc.probability.probability-as-expected-count', say: `${pctTxt}% is the probability, not the count. ${pctTxt}% of ${T} is about ${e}.` }] : []),
      { v: p[0], mc: 'mc.probability.probability-as-expected-count', say: `${p[0]} is the top of the probability, not the count in ${T} trials. ${fr(p[0], p[1])} of ${T} is about ${e}.` },
    ], `Take ${fr(p[0], p[1])} of ${T}: about ${e}.`),
  };
  if (pctTxt !== null && pctTxt !== e) probe(it, N(pctTxt), 'mc.probability.probability-as-expected-count');
  else if (p[0] !== e) probe(it, N(p[0]), 'mc.probability.probability-as-expected-count');
  return it;
};

// =====================================================================================================
// 11. nonUniform: add the probabilities of the outcomes   [event-probability-nonuniform]
const nonUniform: Gen = (R, n) => {
  const mode = pick(R, ['spinner', 'spinner', 'table', 'equalRep'] as const);
  if (mode === 'table') {
    const T = pick(R, [50, 100]);
    let c: number[];
    do { c = [int(R, 4, 30), int(R, 20, 50), int(R, 4, 30)]; c.push(T - c[0]! - c[1]! - c[2]!); } while (c[3]! < 3 || c.some((x, i) => c.indexOf(x) !== i));
    const cats = ['upright', 'on its side', 'cap down', 'other'];
    const [i, j] = shuffle(R, [0, 1, 2, 3]).slice(0, 2).sort();
    const s = c[i!]! + c[j!]!;
    const it: ProbItem = {
      id: `nu-t-${n}`, family: 'nonUniform', prompt: `A bottle was flipped ${A(T)} times: ${cats.map((x, k) => `${x} ${c[k]}`).join(', ')}. Using these data as the model, what is P(${S(`${cats[i!]} or ${cats[j!]}`)})?`,
      board: `\\text{${cats[i!]} or ${cats[j!]}}`, input: 'frac',
      pic: { kind: 'bars', rows: cats.map((x, k) => ({ label: x, n: c[k]!, tex: tf(c[k]!, T) })), event: [i!, j!], title: 'the model', max: Math.max(...c) },
      hero: `${tf(c[i!]!, T)} + ${tf(c[j!]!, T)} = \\frac{${s}}{${T}}`,
      solution: ['The four outcomes are not equally likely, so add their probabilities.', `${fr(c[i!]!, T)} + ${fr(c[j!]!, T)} = ${S(fr(s, T))}.`], answer: F(s, T),
      check: r => fracCheck(r, s, T, `Yes: ${fr(c[i!]!, T)} + ${fr(c[j!]!, T)} = ${fr(s, T)}.`, [{ v: [2, 4], mc: 'mc.probability.equiprobability-bias', say: `2 of the 4 outcomes would be right only if they were equally likely. They aren't: add ${fr(c[i!]!, T)} + ${fr(c[j!]!, T)} = ${fr(s, T)}.` }], `Add the two outcome probabilities: ${fr(s, T)}.`),
    };
    if (!same([s, T], 1, 2)) probe(it, F(2, 4), 'mc.probability.equiprobability-bias');
    return it;
  }
  if (mode === 'equalRep') {
    const k = pick(R, [3, 4, 5]); const m = int(R, 2, k - 1);
    const sectors: Sector[] = Array.from({ length: k + 1 }, (_, i) => ({ parts: 1, col: i < m ? 'blue' : COLS[1 + (i % 3)]!, label: i < m ? 'A' : String.fromCharCode(66 + i - m) }));
    const T = k + 1;
    const it: ProbItem = {
      id: `nu-r-${n}`, family: 'nonUniform', prompt: `A spinner has ${A(`${T} equal parts`)}: ${m} of them are marked A, the others ${sectors.slice(m).map(s => s.label).join(', ')}. What is P(${S('A')})?`,
      board: `P(A) = \\,?`, input: 'frac', pic: { kind: 'spinner', sectors, event: Array.from({ length: m }, (_, i) => i) },
      hero: `${Array.from({ length: m }, () => tf(1, T)).join(' + ')} = \\frac{${m}}{${T}}`,
      solution: [`Each part is ${fr(1, T)}.`, `A has ${m} parts: ${Array.from({ length: m }, () => fr(1, T)).join(' + ')} = ${S(fr(m, T))}.`], answer: F(m, T),
      check: r => fracCheck(r, m, T, `Yes: ${m} parts of ${fr(1, T)} each, ${fr(m, T)}.`, [{ v: [1, T - m + 1], mc: 'mc.probability.equiprobability-bias', say: `The letters are not equally likely: A has ${m} parts. Add them: ${fr(m, T)}.` }], `Add the parts that are A: ${fr(m, T)}.`),
    };
    probe(it, F(1, T - m + 1), 'mc.probability.equiprobability-bias');
    return it;
  }
  const of = pick(R, [4, 6, 8]);
  let parts: number[];
  do { parts = [int(R, 1, of - 2)]; parts.push(int(R, 1, of - parts[0]! - 1)); parts.push(of - parts[0]! - parts[1]!); } while (new Set(parts).size === 1);
  const L = ['A', 'B', 'C'];
  const sectors: Sector[] = parts.map((p, i) => ({ parts: p, col: COLS[i]!, label: L[i] }));
  const two = R() < 0.5;
  const ev = two ? shuffle(R, [0, 1, 2]).slice(0, 2).sort() : [int(R, 0, 2)];
  const s = ev.reduce((t, i) => t + parts[i]!, 0);
  const lab = ev.map(i => L[i]).join(' or ');
  const it: ProbItem = {
    id: `nu-s-${n}`, family: 'nonUniform', prompt: `This spinner is cut into ${A(`${of} equal parts`)}: A covers ${parts[0]}, B covers ${parts[1]}, C covers ${parts[2]}. What is P(${S(lab)})?`,
    board: `P(${lab.replace(' or ', '\\text{ or }')}) = \\,?`, input: 'frac', pic: { kind: 'spinner', sectors, event: ev },
    hero: `${ev.map(i => tf(parts[i]!, of)).join(' + ')} = \\frac{${s}}{${of}}`,
    solution: [`A, B and C are not equally likely: ${L.map((l, i) => `P(${l}) = ${fr(parts[i]!, of)}`).join(', ')}.`, `${ev.length === 2 ? `Add: ${ev.map(i => fr(parts[i]!, of)).join(' + ')} = ` : ''}${S(fr(s, of))}.`], answer: F(s, of),
    check: r => fracCheck(r, s, of, `Yes: ${fr(s, of)}.`, [{ v: [ev.length, 3], mc: 'mc.probability.equiprobability-bias', say: `${ev.length} of 3 letters only works if the letters are equally likely. They cover different numbers of parts: ${fr(s, of)}.` }], `Count the equal parts in the event: ${s} of ${of}.`),
  };
  if (!same([s, of], ev.length, 3)) probe(it, F(ev.length, 3), 'mc.probability.equiprobability-bias');
  return it;
};

// =====================================================================================================
// 12. batches: relative frequencies vary between batches of the same mechanism   [batch-variation]
const batchesG: Gen = (R, n) => {
  if (R() < 0.6) {
    const size = pick(R, [10, 20, 30, 40, 50]), k = int(R, 4, 5);
    let cs: number[];
    do { cs = batches(R, [1, 2], size, k); } while (cs.filter(x => x !== size / 2).length < 2 || new Set(cs).size < 3);
    const G = ['A', 'B', 'C', 'D', 'E'];
    const far = cs.reduce((bi, x, i) => (Math.abs(x - size / 2) > Math.abs(cs[bi]! - size / 2) ? i : bi), 0);
    return choiceItem(R, {
      id: `bt-e-${n}`, family: 'batches', prompt: `${k} groups each toss a fair coin ${A(`${size} times`)}. Heads: ${cs.map((x, i) => `group ${G[i]} ${x}`).join(', ')}. Why are the counts different?`,
      board: `\\text{${size} tosses each}`, pic: { kind: 'bars', rows: cs.map((x, i) => ({ label: `group ${G[i]}`, n: x })), ref: { v: size / 2, tex: String(size / 2) }, max: size, title: 'heads per group' },
      hero: `\\text{${cs.join(', ')}: chance}`, solution: [`The same fair coin, ${size} tosses each: the expected count is about ${size / 2}.`, 'Each batch varies by chance; counts a few above or below are normal.'],
    }, [
      { t: `Chance: every batch of ${size} tosses varies, even with the same fair coin.`, ok: true, say: 'Yes: batch-to-batch variation is what chance looks like.' },
      { t: `The groups that didn't get exactly ${size / 2} made a mistake.`, mc: 'mc.statistics.sample-should-mirror-population', say: `A fair coin doesn't give exactly ${size / 2} in every batch. Counts near ${size / 2} are normal.` },
      { t: `Group ${G[far]}'s coin must be unfair.`, mc: 'mc.statistics.sample-should-mirror-population', say: `${cs[far]} in ${size} tosses happens with fair coins too. One batch can't show a coin is unfair.` },
    ]);
  }
  for (;;) {
    const sA = pick(R, [10, 20]), sB = pick(R, [50, 100]);
    const a = int(R, Math.round(sA * 0.3), Math.round(sA * 0.7)), b = int(R, Math.round(sB * 0.35), Math.round(sB * 0.65));
    const dA = Math.abs(a / sA - 0.5), dB = Math.abs(b / sB - 0.5);
    const cA = Math.abs(a - sA / 2), cB = Math.abs(b - sB / 2);
    if (dA === dB || cA === cB || (dA < dB) === (cA < cB)) continue;
    const ansA = dA < dB;
    return choiceItem(R, {
      id: `bt-u-${n}`, family: 'batches', prompt: `Ana tossed a coin ${A(sA)} times and got ${a} heads. Ben tossed it ${A(sB)} times and got ${b} heads. Whose ${S('share of heads')} is closer to ${fr(1, 2)}?`,
      board: `${tf(a, sA)} \\quad ${tf(b, sB)}`, pic: { kind: 'bars', rows: [{ label: 'Ana', n: a / sA, tex: tf(a, sA) }, { label: 'Ben', n: b / sB, tex: tf(b, sB) }], ref: { v: 0.5, tex: '\\tfrac{1}{2}' }, max: 1, event: [ansA ? 0 : 1] },
      hero: `${tf(a, sA)} = ${a / sA},\\ ${tf(b, sB)} = ${b / sB}`, solution: ['Compare shares, not how many heads away from half.', `Ana: ${a}/${sA} = ${a / sA}; Ben: ${b}/${sB} = ${b / sB}. ${ansA ? 'Ana' : 'Ben'} is closer to 0.5.`],
    }, [
      { t: 'Ana’s', ok: ansA, say: ansA ? `Yes: ${a / sA} is closer to 0.5 than ${b / sB}.` : `Ana's count is ${cA} from half, but her share ${a / sA} is farther from 0.5 than Ben's ${b / sB}.` },
      { t: 'Ben’s', ok: !ansA, say: !ansA ? `Yes: ${b / sB} is closer to 0.5 than ${a / sA}.` : `Ben's count is ${cB} from half, but his share ${b / sB} is farther from 0.5 than Ana's ${a / sA}.` },
      { t: 'They are the same distance', say: `As shares: ${a / sA} and ${b / sB}. They are not the same distance from 0.5.` },
    ]);
  }
};

// =====================================================================================================
// 13. longRun: the running share settles near P as trials grow, as a tendency   [long-run-stabilization]
function coinRun(R: () => number, N: number, p = 0.5): boolean[] { return Array.from({ length: N }, () => R() < p); }
const longRun: Gen = (R, n) => {
  const N = 1000;
  let hits: boolean[];
  const share = (h: boolean[], t: number) => h.slice(0, t).filter(Boolean).length;
  do { hits = coinRun(R, N); } while (Math.abs(share(hits, 10) - 5) < 2 || Math.abs(share(hits, 1000) - 500) > 30);
  const s10 = share(hits, 10), s100 = share(hits, 100), s1000 = share(hits, 1000);
  const mode = pick(R, ['fits', 'far', 'props'] as const);
  const pic: Pic = { kind: 'run', hits, p: [1, 2], log: true, marks: [10, 100, 1000], refTex: '\\tfrac{1}{2}' };
  const solution = [`After 10 tosses: ${s10}/10 = ${s10 / 10}. After 100: ${s100}/100 = ${s100 / 100}. After 1,000: ${s1000}/1,000 = ${s1000 / 1000}.`, 'Early shares swing a lot; over many tosses the share tends to settle near 1/2, without ever having to hit it exactly.'];
  const hero = `${tf(s10, 10)},\\ ${tf(s100, 100)},\\ \\tfrac{${s1000}}{1{,}000}`;
  if (mode === 'fits') return choiceItem(R, {
    id: `lr-f-${n}`, family: 'longRun', prompt: `The chart shows the share of heads as a fair coin is tossed ${A('1,000 times')} (marked after 10, 100 and 1,000). Which statement fits?`,
    board: hero, pic, hero, solution,
  }, [
    { t: 'The share swings a lot at first, then settles near 1/2. It can still drift away for a while.', ok: true, say: 'Yes: settling is a tendency over many tosses, not a rule for each toss.' },
    { t: 'Every toss moves the share closer to 1/2.', mc: 'mc.probability.long-run-convergence-misread', say: 'Look at the chart: the share often moves away from 1/2 for a while. It settles only over many tosses.' },
    { t: 'After 1,000 tosses the share must be exactly 1/2.', mc: 'mc.statistics.sample-should-mirror-population', say: `Even after 1,000 tosses it was ${s1000}/1,000, near 1/2 but not exactly. Exactly 1/2 is not required.` },
  ]);
  if (mode === 'far') return choiceItem(R, {
    id: `lr-d-${n}`, family: 'longRun', prompt: `A fair coin is tossed. Which share of heads is more likely to be ${S('far from 1/2')}: the share after ${A('10 tosses')}, or after ${A('1,000 tosses')}?`,
    board: `\\text{10 or 1{,}000 tosses?}`, pic, hero, solution,
  }, [
    { t: 'After 10 tosses', ok: true, say: 'Yes: a few tosses swing a lot; many tosses settle near 1/2.' },
    { t: 'After 1,000 tosses', mc: 'mc.probability.long-run-convergence-misread', say: 'More tosses make the share settle closer to 1/2, as a tendency. After 10 tosses it can easily be 0.3 or 0.7.' },
    { t: 'Both are just as likely to be far from 1/2', mc: 'mc.probability.equiprobability-bias', say: 'The number of tosses matters: shares from 10 tosses swing much more than shares from 1,000.' },
  ]);
  const cA = Math.abs(s10 - 5), cB = Math.abs(s1000 - 500);
  if (cA >= cB || cB === 0) return longRun(R, n, 'long-run-stabilization');
  return choiceItem(R, {
    id: `lr-p-${n}`, family: 'longRun', prompt: `After 10 tosses there ${s10 === 1 ? 'was 1 head' : `were ${s10} heads`} (${cA} away from 5). After 1,000 tosses there were ${s1000} heads (${cB} away from 500). Which ${S('share')} is closer to 1/2?`,
    board: `${tf(s10, 10)} \\quad \\tfrac{${s1000}}{1{,}000}`, pic, hero, solution,
  }, [
    { t: `After 1,000 tosses: ${s1000 / 1000} is closer to 0.5 than ${s10 / 10}`, ok: true, say: 'Yes: compare shares, not counts.' },
    { t: `After 10 tosses: ${cA} away is closer than ${cB} away`, mc: 'mc.probability.long-run-convergence-misread', say: `The count difference grows with more tosses, but the SHARE gets closer: ${s1000 / 1000} vs ${s10 / 10}.` },
    { t: 'They are equally close', say: `As shares: ${s10 / 10} and ${s1000 / 1000}. Not equally close.` },
  ]);
};

// =====================================================================================================
// 14. streak: past results do not change the next trial   [no-due-outcomes]
const streak: Gen = (R, n) => {
  const mode = pick(R, ['coin', 'coin', 'bag', 'cube'] as const);
  if (mode === 'coin') {
    const f = R() < 0.5 ? 'H' : 'T', k = int(R, 4, 7), other = f === 'H' ? 'tails' : 'heads', same_ = f === 'H' ? 'heads' : 'tails';
    return choiceItem(R, {
      id: `sk-c-${n}`, family: 'streak', prompt: `A fair coin has landed ${S(`${same_} ${k} times in a row`)}. What is P(${other}) on the next toss?`,
      board: `P(\\text{${other}}) = \\,?`, pic: { kind: 'streak', past: Array(k).fill(f), coin: true }, hero: `P(\\text{${other}}) = \\tfrac{1}{2}`,
      solution: ['The coin has no memory: the next toss works exactly like every toss before.', `P(${other}) = ${fr(1, 2)}, as always.`],
    }, [
      { t: `${fr(1, 2)}, the same as on every toss`, ok: true, say: 'Yes: the coin, not its history, sets the next toss.' },
      { t: `More than ${fr(1, 2)}: ${other} is due`, mc: 'mc.probability.gamblers-fallacy', say: `Nothing is due. The coin doesn't remember the streak: ${fr(1, 2)}.` },
      { t: `Less than ${fr(1, 2)}: ${same_} is on a streak`, say: `The coin doesn't keep a streak going either: ${fr(1, 2)}.` },
    ]);
  }
  if (mode === 'cube') {
    const k = int(R, 8, 15);
    return choiceItem(R, {
      id: `sk-d-${n}`, family: 'streak', prompt: `A fair number cube has not shown a 6 in the last ${S(`${k} rolls`)}. What is P(6) on the next roll?`,
      board: `P(6) = \\,?`, pic: { kind: 'cube', event: [6] }, hero: `P(6) = \\tfrac{1}{6}`,
      solution: ['The cube has no memory: every roll is a fresh roll of the same six faces.', `P(6) = ${fr(1, 6)}.`],
    }, [
      { t: fr(1, 6), ok: true, say: 'Yes: still one face of six.' },
      { t: `More than ${fr(1, 6)}: a 6 is due`, mc: 'mc.probability.gamblers-fallacy', say: `No outcome is due: the cube doesn't remember. ${fr(1, 6)}.` },
      { t: `Less than ${fr(1, 6)}: 6s are not coming up`, say: `A dry spell doesn't change the cube: ${fr(1, 6)}.` },
    ]);
  }
  const g: Group[] = [{ col: 'blue', n: int(R, 2, 4) }, { col: 'white', n: 1 }];
  const T = total(g), k = int(R, 3, 5);
  return choiceItem(R, {
    id: `sk-b-${n}`, family: 'streak', prompt: `A bag holds ${A(bagText(g))} marbles. You pull one, put it back and mix, again and again. The white marble came out ${S(`${k} times in a row`)}. What is P(blue) on the next pull?`,
    board: `P(\\text{blue}) = \\,?`, pic: { kind: 'streak', past: Array(k).fill('white'), coin: false, title: 'pulled so far' }, hero: `P(\\text{blue}) = \\tfrac{${g[0]!.n}}{${T}}`,
    solution: ['Each marble goes back and the bag is mixed: the next pull is a fresh pull from the same bag.', `P(blue) = ${fr(g[0]!.n, T)}, as before every pull.`],
  }, [
    { t: `${fr(g[0]!.n, T)}, the same as before every pull`, ok: true, say: 'Yes: the bag, not the history, sets the next pull.' },
    { t: `More than ${fr(g[0]!.n, T)}: blue is overdue`, mc: 'mc.probability.gamblers-fallacy', say: `The bag doesn't remember: the marble went back. ${fr(g[0]!.n, T)}.` },
    { t: `Less than ${fr(g[0]!.n, T)}: white is on a streak`, say: `The marbles went back and were mixed: nothing changed. ${fr(g[0]!.n, T)}.` },
  ]);
};

// =====================================================================================================
// 15. discrepancy: an observation against reference batches of the same size   [model-data-discrepancy]
const discrepancy: Gen = (R, n) => {
  for (;;) {
    const ctx = pick(R, [
      { what: 'sixes', dev: 'number cube', p: [1, 6] as Frac, size: 30, verb: 'rolled', unit: 'rolls' },
      { what: 'sixes', dev: 'number cube', p: [1, 6] as Frac, size: 600, verb: 'rolled', unit: 'rolls' },
      { what: 'point-up landings', dev: 'thumbtack (claim: P = 1/2)', p: [1, 2] as Frac, size: 100, verb: 'tossed', unit: 'tosses' },
      { what: 'heads', dev: 'coin', p: [1, 2] as Frac, size: 50, verb: 'tossed', unit: 'tosses' },
    ]);
    const count = 20;
    const ref = batches(R, ctx.p, ctx.size, count);
    const e = expectedCount(ctx.p, ctx.size);
    const unusual = R() < 0.5;
    let obs: number;
    if (unusual) obs = Math.max(...ref) + int(R, ctx.size >= 100 ? 4 : 2, ctx.size >= 600 ? 40 : ctx.size >= 100 ? 9 : 4);
    else { const sorted = [...ref].sort((a, b) => a - b); obs = sorted[int(R, 12, 15)]!; }
    const ext = asExtreme(ref, obs, e);
    if (unusual ? ext !== 0 : ext < 4 || obs === e) continue;
    const devName = ctx.dev.replace(/ \(.*\)$/, '');
    // a count below the center is compared with the batches that got as few or fewer (asExtreme counts that way)
    const orMore = obs >= e ? 'or more' : 'or fewer', gap = Math.abs(obs - e);
    const claim = ctx.dev.includes('claim') ? `the claim P = ${fr(1, 2)}` : `a fair ${devName}`;
    const opts: Opt[] = unusual ? [
      { t: `Unusual: none of the ${count} batches came close. The model may be wrong (a biased ${devName}), or the results were recorded wrong.`, ok: true, say: `Yes: ${obs} is outside everything the model produced in ${count} batches.` },
      { t: `Nothing can be said: any count can happen with ${claim}.`, mc: 'mc.probability.no-model-can-be-rejected', say: `Possible isn't the same as believable. None of ${count} model batches got near ${obs}, so the data speak against the model.` },
      { t: `Fine: ${obs} is only ${obs - e} more than ${e}.`, mc: 'mc.statistics.center-difference-ignores-spread', say: `Whether ${obs - e} is a lot depends on how much batches spread. These batches never reached ${obs}.` },
    ] : [
      { t: `Not unusual: ${ext} of the ${count} batches got ${obs} ${orMore}, so chance can explain it.`, ok: true, say: `Yes: ${obs} sits inside the spread of the model's own batches.` },
      { t: `The model is wrong: it should give exactly ${e}.`, mc: 'mc.statistics.sample-should-mirror-population', say: `The model's own batches spread out a lot; ${e} is only the center. ${ext} of ${count} got ${obs} ${orMore}.` },
      { t: `The model is wrong: ${obs} is ${gap} ${obs > e ? 'more' : 'less'} than ${e}.`, mc: 'mc.statistics.center-difference-ignores-spread', say: `A gap of ${gap} is small next to how much batches of ${ctx.size} vary: ${ext} of ${count} got ${obs} ${orMore}.` },
    ];
    return choiceItem(R, {
      id: `dc-${unusual ? 'u' : 'n'}-${n}`, family: 'discrepancy',
      prompt: `A ${devName} was ${ctx.verb} ${A(`${ctx.size} times`)} and gave ${S(`${obs} ${ctx.what}`)}. The dots show ${count} batches of ${ctx.size} ${ctx.unit} made with ${claim}. What do the data say?`,
      board: `${obs}\\ \\text{in}\\ ${ctx.size}`,
      pic: { kind: 'dots', ref, obs, title: `${count} batches of ${ctx.size} with ${claim}`, obsLabel: String(obs) },
      hero: `${ext}\\ \\text{of}\\ ${count}\\ \\text{reach}\\ ${obs}`,
      solution: [`Compare ${obs} with the model's own batches of the same size, not just with the expected ${e}.`, unusual ? `None of the ${count} batches reached ${obs}: unusual. Possible reasons: a biased ${devName}, a wrong model, or recording errors.` : `${ext} of ${count} batches got ${obs} ${orMore}: not unusual. Chance can explain it.`],
    }, opts);
  }
};

// =====================================================================================================
// 16. simDigits: run a random-digit simulation of a compound event   [simulate-compound-event]
const SIMS = [
  { name: 'shooter', story: 'A basketball player makes 70% of her free throws. She takes 3 shots.', map: 'digits 0 to 6 = make, 7 to 9 = miss', hit: (d: number) => d <= 6, size: 3, succ: 'at least one miss', ok: (b: readonly number[]) => b.some(d => d >= 7), stage: (d: number) => d >= 7, stageName: 'misses' },
  { name: 'prize', story: 'A cereal box has a prize 20% of the time. You buy 4 boxes.', map: 'digits 0 and 1 = prize, 2 to 9 = no prize', hit: (d: number) => d <= 1, size: 4, succ: 'at least one prize', ok: (b: readonly number[]) => b.some(d => d <= 1), stage: (d: number) => d <= 1, stageName: 'prize digits' },
  { name: 'donor', story: '40% of blood donors have type A blood. Three donors come in.', map: 'digits 0 to 3 = type A, 4 to 9 = not A', hit: (d: number) => d <= 3, size: 3, succ: 'at least two type A', ok: (b: readonly number[]) => b.filter(d => d <= 3).length >= 2, stage: (d: number) => d <= 3, stageName: 'type A digits' },
] as const;
const simDigits: Gen = (R, n) => {
  const mode = pick(R, ['count', 'count', 'estimate', 'map', 'cut'] as const);
  if (mode === 'map') {
    const t = pick(R, [{ p: 40, right: '0, 1, 2, 3', w1: '0, 1, 2, 3, 4', w1p: 50, w2: 'only 4', w2p: 10 }, { p: 30, right: '0, 1, 2', w1: '1, 2, 3', w1p: 30, w2: '0, 1, 2, 3', w2p: 40 }, { p: 70, right: '0 to 6', w1: '0 to 7', w1p: 80, w2: '1 to 7', w2p: 70 }, { p: 20, right: '0 and 1', w1: '0, 1 and 2', w1p: 30, w2: 'only 2', w2p: 10 }]);
    const opts: Opt[] = [
      { t: `Digits ${t.right}`, ok: true, say: `Yes: ${t.p / 10} of the 10 digits = ${t.p}%.` },
      { t: `Digits ${t.w1}`, ok: t.w1p === t.p, mc: t.w1p === t.p ? undefined : 'mc.probability.simulation-outcome-shares-mismatched', say: t.w1p === t.p ? `Yes: that is also ${t.p / 10} of the 10 digits.` : `That is ${t.w1p / 10} of the 10 digits, ${t.w1p}%, not ${t.p}%.` },
      { t: `Digits ${t.w2}`, ok: t.w2p === t.p, mc: t.w2p === t.p ? undefined : 'mc.probability.simulation-outcome-shares-mismatched', say: t.w2p === t.p ? `Yes: also ${t.p / 10} digits.` : `That is ${t.w2p / 10} of the 10 digits, ${t.w2p}%, not ${t.p}%.` },
    ];
    // two right answers are not allowed: drop a second right option and use a clearly wrong one
    const rights = opts.filter(o => o.ok);
    if (rights.length > 1) { const j = opts.indexOf(rights[1]!); opts[j] = { t: 'Digits 0 to 9', mc: 'mc.probability.simulation-outcome-shares-mismatched', say: `All 10 digits is 100%, not ${t.p}%.` }; }
    return choiceItem(R, {
      id: `sd-m-${n}`, family: 'simDigits', prompt: `You simulate an event with P = ${S(`${t.p}%`)} using random digits 0 to 9. Which digits should stand for the event?`,
      board: `${t.p}\\% = \\tfrac{${t.p / 10}}{10}`, hero: `${t.p}\\% = ${t.p / 10}\\ \\text{of 10 digits}`,
      solution: [`Each digit 0 to 9 is ${fr(1, 10)} = 10%.`, `${t.p}% needs ${t.p / 10} digits, for example ${t.right}.`],
    }, opts);
  }
  const sim = pick(R, SIMS);
  const T = sim.size === 4 ? 5 : int(R, 6, 8);
  let digits: number[], res: ReturnType<typeof digitTrials>;
  do { digits = Array.from({ length: T * sim.size }, () => int(R, 0, 9)); res = digitTrials(digits, sim.size, sim.ok); }
  while (res.wins.every(Boolean) || !res.wins.some(Boolean) || digits.filter(sim.stage).length === res.wins.filter(Boolean).length);
  const wins = res.wins.filter(Boolean).length, stageHits = digits.filter(sim.stage).length;
  const dstr = res.blocks.map(b => b.join('')).join(' ');
  const pic: Pic = { kind: 'digits', digits, size: sim.size, wins: res.wins, legend: sim.map, blocks: true };
  if (mode === 'cut') {
    const flat = digits.join('');
    const over = Array.from({ length: 3 }, (_, i) => flat.slice(i, i + sim.size)).join(', ');
    return choiceItem(R, {
      id: `sd-c-${n}`, family: 'simDigits', prompt: `${sim.story} You simulate it with random digits (${sim.map}): ${flat.slice(0, sim.size * 3)}... How do you cut the digits into trials?`,
      board: `\\text{one trial} = ${sim.size}\\ \\text{digits}`, pic: { ...pic, blocks: false, wins: undefined }, hero: `\\text{one trial} = ${sim.size}\\ \\text{digits}`,
      solution: [`One trial is the whole story: ${sim.size} ${sim.name === 'shooter' ? 'shots' : sim.name === 'prize' ? 'boxes' : 'donors'}, so ${sim.size} digits.`, `Read them in order, without overlap: ${res.blocks.slice(0, 3).map(b => b.join('')).join(' | ')} | ...`],
    }, [
      { t: `${sim.size} digits at a time, one block after the other: ${res.blocks.slice(0, 3).map(b => b.join('')).join(' | ')} | ...`, ok: true, say: 'Yes: each digit is used once, in one trial.' },
      { t: `${sim.size} digits, starting one digit later each time: ${over}, ...`, mc: 'mc.probability.simulation-trial-blocks-split-or-overlapped', say: 'Overlapping trials reuse digits: every digit must belong to exactly one trial.' },
      { t: 'One digit = one trial', mc: 'mc.probability.simulation-trial-misdefined', say: `One digit is one ${sim.name === 'shooter' ? 'shot' : sim.name === 'prize' ? 'box' : 'donor'}, a stage. A trial is all ${sim.size} together.` },
    ]);
  }
  if (mode === 'estimate') {
    const it: ProbItem = {
      id: `sd-e-${n}`, family: 'simDigits', prompt: `${sim.story} Success: ${S(sim.succ)}. Simulation (${sim.map}), ${A(`${T} trials`)} of ${sim.size} digits: ${dstr}. What is the estimate of P(success)?`,
      board: `P(\\text{success}) \\approx \\,?`, input: 'frac', pic: { ...pic }, hero: `\\frac{${wins}}{${T}}`,
      solution: [`Check each trial of ${sim.size} digits for “${sim.succ}”: ${wins} of the ${T} trials succeed.`, `Estimate: ${S(fr(wins, T))} (more trials give a more reliable estimate).`], answer: F(wins, T),
      check: r => fracCheck(r, wins, T, `Yes: ${wins} of ${T} trials, ${fr(wins, T)}.`, [{ v: [stageHits, T * sim.size], mc: 'mc.probability.simulation-trial-misdefined', say: `That counts single digits. The event is about whole trials of ${sim.size} digits: ${wins} of ${T}.` }], `Count whole trials that succeed: ${wins} of ${T}.`),
    };
    if (!same([wins, T], stageHits, T * sim.size)) probe(it, F(stageHits, T * sim.size), 'mc.probability.simulation-trial-misdefined');
    return it;
  }
  const it: ProbItem = {
    id: `sd-n-${n}`, family: 'simDigits', prompt: `${sim.story} Success: ${S(sim.succ)}. Simulation (${sim.map}), one trial = ${sim.size} digits: ${dstr}. How many of these ${A(`${T} trials`)} are successes?`,
    board: `\\text{successes} = \\,?`, input: 'num', unit: 'trials', pic, hero: `${wins}\\ \\text{of}\\ ${T}\\ \\text{trials}`,
    solution: [`Cut the digits into trials of ${sim.size}: ${dstr}.`, `Trials with ${sim.succ}: ${S(wins)}.`], answer: N(wins),
    check: r => numCheck(r, wins, `Yes: ${wins} of the ${T} trials.`, [{ v: stageHits, mc: 'mc.probability.simulation-trial-misdefined', say: `${stageHits} counts the single ${sim.stageName}. Count whole trials of ${sim.size} digits that succeed: ${wins}.` }], `Check each block of ${sim.size} digits: ${wins} succeed.`),
  };
  probe(it, N(stageHits), 'mc.probability.simulation-trial-misdefined');
  return it;
};

// =====================================================================================================
// 17. compoundSpace: ordered outcomes of 2-3 stages   [compound-sample-space]
const compoundSpace: Gen = (R, n) => {
  const mode = pick(R, ['coinCube', 'coinSpinner', 'cubes', 'tosses', 'tosses', 'spinners', 'draw', 'draw', 'list'] as const);
  const mk = (id: string, prompt: string, board: string, ans: number, sol: string[], wrongs: { v: number; mc?: string; say: string }[], pic?: Pic): ProbItem => {
    const it: ProbItem = { id: `cs-${id}-${n}`, family: 'compoundSpace', prompt, board, input: 'num', unit: 'outcomes', pic, picOnSolve: true, hero: `${ans}\\ \\text{outcomes}`, solution: sol, answer: N(ans), check: r => numCheck(r, ans, `Yes: ${ans} outcomes.`, wrongs, `List them in an organized way: ${ans}.`) };
    for (const w of wrongs) if (w.mc && w.v !== ans) probe(it, N(w.v), w.mc);
    return it;
  };
  if (mode === 'coinCube') return mk('cc', `You toss a coin ${S('and')} roll a number cube. How many outcomes are in the sample space?`, `\\text{coin} \\times \\text{cube}`, 12,
    ['Each of the 2 coin sides goes with each of the 6 faces.', `2 rows × 6 columns = ${S(12)} ordered outcomes (H1, H2, ..., T6).`],
    [{ v: 8, mc: 'mc.probability.incomplete-sample-space', say: '2 + 6 lists the stages, not the outcomes. Every coin side pairs with every face: 2 × 6 = 12.' }],
    { kind: 'table', rows: ['\\mathrm{H}', '\\mathrm{T}'], cols: ['1', '2', '3', '4', '5', '6'], cells: [['', '', '', '', '', ''], ['', '', '', '', '', '']], rowTitle: 'coin', colTitle: 'cube' });
  if (mode === 'coinSpinner') {
    const k = int(R, 3, 8);
    return mk('cs', `You toss a coin ${S('and')} spin a spinner with ${k} equal parts. How many outcomes are in the sample space?`, `\\text{coin} \\times \\text{spinner}`, 2 * k,
      [`Each of the 2 coin sides goes with each of the ${k} parts.`, `2 × ${k} = ${S(2 * k)} ordered outcomes.`],
      [{ v: 2 + k, mc: 'mc.probability.incomplete-sample-space', say: `2 + ${k} lists the stages, not the outcomes. Every side pairs with every part: 2 × ${k} = ${2 * k}.` }],
      { kind: 'table', rows: ['\\mathrm{H}', '\\mathrm{T}'], cols: Array.from({ length: k }, (_, i) => String(i + 1)), cells: [Array(k).fill(''), Array(k).fill('')], rowTitle: 'coin', colTitle: 'spinner' });
  }
  if (mode === 'cubes') return mk('2c', `You roll ${S('two number cubes')}, a red one and a blue one. How many outcomes are in the sample space?`, `\\text{cube} \\times \\text{cube}`, 36,
    ['Each of the 6 red faces pairs with each of the 6 blue faces.', `6 × 6 = ${S(36)} ordered outcomes: (1, 2) and (2, 1) are different.`],
    [{ v: 21, mc: 'mc.probability.ordered-outcomes-merged', say: '(1, 2) and (2, 1) are different outcomes: red 1 with blue 2 is not red 2 with blue 1. 6 × 6 = 36.' }, { v: 12, mc: 'mc.probability.incomplete-sample-space', say: '6 + 6 lists the faces, not the pairs. Every red face pairs with every blue face: 36.' }],
    { kind: 'table', rows: ['1', '2', '3', '4', '5', '6'], cols: ['1', '2', '3', '4', '5', '6'], cells: Array.from({ length: 6 }, () => Array(6).fill('')), rowTitle: 'red', colTitle: 'blue' });
  if (mode === 'tosses') {
    const k = int(R, 2, 4), ans = 2 ** k;
    return mk('t', `A coin is tossed ${S(`${k} times`)}. How many outcomes (like ${'HT'.repeat(k).slice(0, k)}) are in the sample space?`, `${k}\\ \\text{tosses}`, ans,
      [`Every toss doubles the list: ${Array(k).fill(2).join(' × ')} = ${S(ans)}.`, k <= 3 ? `The tree has ${ans} leaves: ${tossSpace(k).join(', ')}.` : 'Order matters: HHTT and TTHH are different outcomes.'],
      [{ v: k + 1, mc: 'mc.probability.ordered-outcomes-merged', say: `${k + 1} counts the number of heads (0 to ${k}). But HT and TH are different outcomes: ${ans}.` }, { v: 2 * k, mc: 'mc.probability.incomplete-sample-space', say: `${k} tosses × 2 sides counts the stages. Each toss doubles the list: ${ans}.` }],
      k <= 3 ? { kind: 'tree', n: k } : undefined);
  }
  if (mode === 'spinners') {
    const a = int(R, 2, 4), b = int(R, 3, 5);
    return mk('sp', `Spinner 1 has ${a} equal parts, spinner 2 has ${b}. You spin both. How many outcomes are in the sample space?`, `${a} \\times ${b}`, a * b,
      [`Each of the ${a} results of spinner 1 pairs with each of the ${b} of spinner 2.`, `${a} × ${b} = ${S(a * b)}.`],
      [{ v: a + b, mc: 'mc.probability.incomplete-sample-space', say: `${a} + ${b} lists the parts. Each part of spinner 1 pairs with each part of spinner 2: ${a * b}.` }],
      { kind: 'table', rows: Array.from({ length: a }, (_, i) => String(i + 1)), cols: Array.from({ length: b }, (_, i) => String(i + 1)), cells: Array.from({ length: a }, () => Array(b).fill('')), rowTitle: 'spinner 1', colTitle: 'spinner 2' });
  }
  if (mode === 'draw') {
    const four = R() < 0.4, objs = four ? ['B_1', 'B_2', 'W_1', 'W_2'] : ['B_1', 'B_2', 'W'], m = objs.length;
    const names = four ? `B${'<sub>1</sub>'}, B${'<sub>2</sub>'}, W${'<sub>1</sub>'} and W${'<sub>2</sub>'}` : `B${'<sub>1</sub>'}, B${'<sub>2</sub>'} and W`;
    const repl = R() < 0.4, ans = repl ? m * m : m * (m - 1);
    const thing = pick(R, ['marbles', 'tiles', 'chips']);
    return mk(repl ? `dr${m}` : `dn${m}`, `A bag holds ${m} ${thing}: ${names}. You pull one, ${repl ? S('put it back') : S('keep it out')}, and pull a second. How many ordered outcomes are there?`, `\\text{${repl ? 'with' : 'without'} replacement}`, ans,
      [repl ? `The first one goes back, so the second pull has all ${m} again: ${m} × ${m} = ${S(ans)}.` : `The first one stays out, so the second pull has only ${m - 1} left: ${m} × ${m - 1} = ${S(ans)}.`, 'Order matters: B₁ then W is not W then B₁.'],
      repl ? [{ v: m * (m - 1), say: `It goes back, so the same one can come out twice: ${m} × ${m} = ${ans}.` }] : [{ v: m * m, mc: 'mc.probability.reuses-object-without-replacement', say: `The first one is kept out, so it can’t come out again: B₁ B₁ is impossible. ${m} × ${m - 1} = ${ans}.` }, { v: (m * (m - 1)) / 2, mc: 'mc.probability.ordered-outcomes-merged', say: `B₁ then W and W then B₁ are different ordered outcomes: ${ans}.` }],
      { kind: 'table', rows: objs, cols: objs, cells: objs.map((_, r) => objs.map((__, k) => (!repl && r === k ? null : ''))), rowTitle: 'first', colTitle: 'second' });
  }
  return choiceItem(R, {
    id: `cs-l-${n}`, family: 'compoundSpace', prompt: `A coin is tossed ${S('twice')}. Which list is the complete sample space?`, board: `2\\ \\text{tosses}`,
    pic: { kind: 'tree', n: 2 }, picOnSolve: true, hero: `\\{\\mathrm{HH, HT, TH, TT}\\}`,
    solution: ['Write the first toss, then the second: the order matters.', 'HH, HT, TH, TT: 4 outcomes.'],
  }, [
    { t: '{ HH, HT, TH, TT }', ok: true, say: 'Yes: 2 × 2 = 4 ordered outcomes.' },
    { t: '{ HH, HT, TT }', mc: 'mc.probability.ordered-outcomes-merged', say: 'HT (heads first) and TH (tails first) are different outcomes. Both belong in the list.' },
    { t: '{ H, T }', mc: 'mc.probability.incomplete-sample-space', say: 'That is one toss. One trial here is both tosses: HH, HT, TH, TT.' },
  ]);
};

// =====================================================================================================
// 18. compoundP: favorable ordered outcomes / total   [compound-theoretical-probability]
const compoundP: Gen = (R, n) => {
  const mode = pick(R, ['tosses', 'tosses', 'sum', 'doubles', 'coinCube', 'forms'] as const);
  if (mode === 'forms') {
    const v = pick(R, [[3, 8, '0.375', '37.5%'], [1, 4, '0.25', '25%'], [1, 8, '0.125', '12.5%'], [3, 4, '0.75', '75%'], [1, 2, '0.5', '50%']] as const);
    return choiceItem(R, {
      id: `cp2-f-${n}`, family: 'compoundP', prompt: `P(event) = ${S(fr(v[0], v[1]))}. Which is the same probability as a decimal and a percent?`,
      board: `${tf(v[0], v[1])} = \\,?`, hero: `${tf(v[0], v[1])} = ${v[2]} = ${v[3].replace('%', '\\%')}`,
      solution: [`${v[0]} ÷ ${v[1]} = ${v[2]}.`, `${v[2]} = ${v[3]}.`],
    }, [
      { t: `${v[2]} = ${v[3]}`, ok: true, say: `Yes: ${v[0]} ÷ ${v[1]} = ${v[2]}.` },
      { t: `0.${v[0]}${v[1]} = ${v[0]}${v[1]}%`, mc: 'mc.percent.compares-digits-across-forms', say: `Writing the digits side by side doesn't convert: ${v[0]} ÷ ${v[1]} = ${v[2]}.` },
      { t: `${v[1]}.${v[0]} = ${v[1]}${v[0]}0%`, mc: 'mc.probability.probability-outside-zero-one', say: `That is more than 1, and no probability is: ${v[0]} ÷ ${v[1]} = ${v[2]}.` },
    ]);
  }
  let fav: number, T: number, prompt: string, board: string, pic: Pic, sol: string[], label: string;
  const wrongs: FracWrong[] = [];
  if (mode === 'tosses') {
    const k = int(R, 2, 3);
    const sp = tossSpace(k);
    const ev = pick(R, k === 2 ? [{ t: 'exactly one head', f: (s: string) => heads(s) === 1 }, { t: 'at least one head', f: (s: string) => heads(s) >= 1 }, { t: 'two heads', f: (s: string) => heads(s) === 2 }, { t: 'no heads', f: (s: string) => heads(s) === 0 }]
      : [{ t: 'exactly one head', f: (s: string) => heads(s) === 1 }, { t: 'exactly two heads', f: (s: string) => heads(s) === 2 }, { t: 'at least one head', f: (s: string) => heads(s) >= 1 }, { t: 'all the same', f: (s: string) => heads(s) === 0 || heads(s) === 3 }, { t: 'three heads', f: (s: string) => heads(s) === 3 }]);
    const evIdx = sp.map((s, i) => (ev.f(s) ? i : -1)).filter(i => i >= 0);
    fav = evIdx.length; T = sp.length; label = ev.t;
    prompt = `A fair coin is tossed ${A(`${k} times`)}. What is P(${S(ev.t)})?`; board = `P(\\text{${ev.t}}) = \\,?`;
    pic = { kind: 'tree', n: k, event: evIdx };
    sol = [`The ${T} ordered outcomes are equally likely: ${sp.join(', ')}.`, `${ev.t}: ${evIdx.map(i => sp[i]).join(', ')}, ${fav} of them.`, `P = ${S(fr(fav, T))}.`];
    if (ev.t.startsWith('exactly') || ev.t.startsWith('two') || ev.t.startsWith('no') || ev.t.startsWith('three')) wrongs.push({ v: [1, k + 1], mc: 'mc.probability.equiprobability-bias', say: `0 to ${k} heads are not equally likely: there are more ways to get some counts. Count the ordered outcomes: ${fr(fav, T)}.` });
    if (k === 2) { const merged = ['HH', 'HT', 'TT'].filter(ev.f).length; wrongs.push({ v: [merged, 3], mc: 'mc.probability.ordered-outcomes-merged', say: `HT and TH are two different outcomes, so there are 4, not 3: ${fr(fav, 4)}.` }); }
  } else if (mode === 'sum') {
    const s = int(R, 3, 11);
    const cells = twoCubes();
    fav = cells.filter(([a, b]) => a + b === s).length; T = 36; label = `sum of ${s}`;
    prompt = `You roll ${A('two number cubes')}. What is P(${S(`the sum is ${s}`)})?`; board = `P(\\text{sum} = ${s}) = \\,?`;
    pic = { kind: 'table', rows: ['1', '2', '3', '4', '5', '6'], cols: ['1', '2', '3', '4', '5', '6'], cells: [1, 2, 3, 4, 5, 6].map(a => [1, 2, 3, 4, 5, 6].map(b => String(a + b))), event: cells.map(([a, b]) => (a + b === s ? [a - 1, b - 1] as [number, number] : null)).filter((x): x is [number, number] => x !== null), rowTitle: 'cube 1', colTitle: 'cube 2' };
    sol = ['The 36 ordered pairs are equally likely; the sums 2 to 12 are not.', `Pairs with sum ${s}: ${fav}.`, `P = ${S(fr(fav, 36))}.`];
    wrongs.push({ v: [1, 11], mc: 'mc.probability.equiprobability-bias', say: `The 11 sums are not equally likely: count the ordered pairs. ${fav} of 36.` });
  } else if (mode === 'doubles') {
    fav = 6; T = 36; label = 'doubles';
    prompt = `You roll ${A('two number cubes')}. What is P(${S('doubles')}) (both cubes show the same number)?`; board = `P(\\text{doubles}) = \\,?`;
    pic = { kind: 'table', rows: ['1', '2', '3', '4', '5', '6'], cols: ['1', '2', '3', '4', '5', '6'], cells: [1, 2, 3, 4, 5, 6].map(a => [1, 2, 3, 4, 5, 6].map(b => String(a + b))), event: [0, 1, 2, 3, 4, 5].map(i => [i, i] as [number, number]), rowTitle: 'cube 1', colTitle: 'cube 2' };
    sol = ['36 equally likely ordered pairs.', 'Doubles: (1,1), (2,2), ..., (6,6): 6 of them.', `P = ${S(fr(6, 36))}.`];
    wrongs.push({ v: [6, 21], mc: 'mc.probability.ordered-outcomes-merged', say: '(1, 2) and (2, 1) are different outcomes, so there are 36 in all, not 21: 6 of 36.' });
  } else {
    const even = R() < 0.5, head = R() < 0.5;
    const set = even ? [2, 4, 6] : [5, 6];
    fav = set.length; T = 12; label = `${head ? 'heads' : 'tails'} and ${even ? 'even' : 'more than 4'}`;
    prompt = `You toss a coin and roll a number cube. What is P(${S(`${head ? 'heads' : 'tails'} and ${even ? 'an even number' : 'a number greater than 4'}`)})?`; board = `P(\\mathrm{${head ? 'H' : 'T'}},\\ ${even ? '\\text{even}' : '{>}\\,4'}) = \\,?`;
    pic = { kind: 'table', rows: ['\\mathrm{H}', '\\mathrm{T}'], cols: ['1', '2', '3', '4', '5', '6'], cells: ['H', 'T'].map(c => [1, 2, 3, 4, 5, 6].map(v => `\\mathrm{${c}}${v}`)), event: set.map(v => [head ? 0 : 1, v - 1] as [number, number]), rowTitle: 'coin', colTitle: 'cube' };
    sol = ['2 × 6 = 12 equally likely outcomes.', `${label}: ${set.map(v => (head ? 'H' : 'T') + v).join(', ')}, ${fav} of them.`, `P = ${S(fr(fav, 12))}.`];
    wrongs.push({ v: [fav + 1, 8], mc: 'mc.probability.incomplete-sample-space', say: `There are 2 × 6 = 12 outcomes, not 2 + 6. ${fav} of 12.` });
  }
  const it: ProbItem = {
    id: `cp2-${mode}-${n}`, family: 'compoundP', prompt, board, input: 'frac', pic, picOnSolve: true, hero: `P = \\frac{${fav}}{${T}}`, solution: sol, answer: F(fav, T),
    check: r => fracCheck(r, fav, T, `Yes: ${fav} of the ${T} equally likely outcomes, ${fr(fav, T)}.`, wrongs, `Count the favorable ordered outcomes over all ${T}: ${fr(fav, T)}.`),
  };
  wrongs.forEach((w, i) => {
    const v = w.v as Frac;
    const earlier = wrongs.slice(0, i).some(x => same([(x.v as Frac)[0], (x.v as Frac)[1]], v[0], v[1]));
    if (w.mc && !earlier && !same([fav, T], v[0], v[1])) probe(it, F(v[0], v[1]), w.mc);
  });
  return it;
};

// =====================================================================================================
// 19. designSim: choose a device, define one trial, keep replacement   [design-simulation]
const designSim: Gen = (R, n) => {
  const mode = pick(R, ['device', 'device', 'trial', 'replace'] as const);
  const mm = 'mc.probability.simulation-outcome-shares-mismatched';
  if (mode === 'device') {
    const t = pick(R, [
      { ev: 'a 50% free-throw shooter makes a shot', p: '50%', right: 'Toss a coin: heads = made', w: [['Roll a number cube: 6 = made', 'A 6 is 1/6, about 17%, not 50%.'], ['Random digits: 0 to 3 = made', 'Digits 0 to 3 are 4 of 10, 40%, not 50%.']] },
      { ev: 'a cereal box has the prize (1 in 6 boxes)', p: '1/6', right: 'Roll a number cube: 6 = prize', w: [['Toss a coin: heads = prize', 'Heads is 1/2, not 1/6.'], ['Random digits: 0 to 5 = prize', '0 to 5 is 6 of 10 digits, 60%, not 1/6.']] },
      { ev: 'a donor has type A blood (40%)', p: '40%', right: 'Random digits: 0 to 3 = type A', w: [['Random digits: 0 to 4 = type A', '0 to 4 is 5 digits, 50%, not 40%.'], ['Roll a number cube: 1 to 4 = type A', '1 to 4 is 4 of 6 faces, about 67%, not 40%.']] },
      { ev: 'a bus is late (1 day in 4)', p: '1/4', right: 'Spin a spinner with 4 equal parts, one marked “late”', w: [['Toss a coin: heads = late', 'Heads is 1/2, not 1/4.'], ['Random digits: 0 to 2 = late', '0 to 2 is 3 of 10, 30%, not 25%.']] },
      { ev: 'a player wins a prize (20%)', p: '20%', right: 'Random digits: 0 and 1 = prize', w: [['Roll a number cube: 1 = prize', 'A 1 is 1/6, about 17%, not 20%.'], ['Random digits: 0, 1 and 2 = prize', 'Three digits are 30%, not 20%.']] },
    ]);
    return choiceItem(R, {
      id: `ds-d-${n}`, family: 'designSim', prompt: `You want to simulate whether ${S(t.ev)}. Which chance device matches P = ${t.p}?`, board: `P = ${t.p.replace('%', '\\%').replace('1/6', '\\tfrac{1}{6}').replace('1/4', '\\tfrac{1}{4}')}`,
      hero: `\\text{device outcome} = ${t.p.replace('%', '\\%').replace('1/6', '\\tfrac{1}{6}').replace('1/4', '\\tfrac{1}{4}')}`,
      solution: [`The device's outcomes for the event must have the same probability: ${t.p}.`, `${t.right}.`],
    }, [
      { t: t.right, ok: true, say: `Yes: that has probability ${t.p}.` },
      { t: t.w[0]![0]!, mc: mm, say: t.w[0]![1]! },
      { t: t.w[1]![0]!, mc: mm, say: t.w[1]![1]! },
    ]);
  }
  if (mode === 'trial') {
    const t = pick(R, [
      { goal: 'P(it takes at least 4 donors to find one with type A blood), with digits 0 to 3 = type A', right: 'Read digits until the first 0, 1, 2 or 3; count how many digits that took', w1: 'One digit: it is type A or it is not', w2: 'Four digits, and count how many are 0 to 3' },
      { goal: 'P(at least one 6 in 4 rolls of a number cube)', right: 'Roll the cube 4 times and check for a 6', w1: 'Roll the cube once and check for a 6', w2: 'Roll until a 6 appears' },
      { goal: 'P(a 70% shooter makes both of 2 free throws), with digits 0 to 6 = make', right: 'Read 2 digits and check that both are 0 to 6', w1: 'Read 1 digit: make or miss', w2: 'Read digits until a miss appears' },
    ]);
    return choiceItem(R, {
      id: `ds-t-${n}`, family: 'designSim', prompt: `You estimate ${S(t.goal)} by simulation. What is ${A('one trial')}?`, board: `\\text{one trial} = \\,?`,
      hero: `\\text{one trial = the whole story}`, solution: ['One trial must be one complete run of the real event, all its stages.', `${t.right}.`],
    }, [
      { t: t.right, ok: true, say: 'Yes: one trial is one complete run of the event.' },
      { t: t.w1, mc: 'mc.probability.simulation-trial-misdefined', say: 'That is one stage. The event needs the whole sequence in one trial.' },
      { t: t.w2, mc: 'mc.probability.simulation-trial-misdefined', say: 'That run does not match the event. One trial must play out exactly the story being estimated.' },
    ]);
  }
  return choiceItem(R, {
    id: `ds-r-${n}`, family: 'designSim', prompt: `Two cards are drawn from 5 cards (A to E) ${S('without putting the first one back')}. Mia simulates it by spinning a 5-part spinner twice. What is the problem?`,
    board: `\\text{without replacement}`, hero: `\\text{2nd draw: only 4 cards left}`,
    solution: ['Without replacement the first card is gone, so the second draw can’t repeat it.', 'Two free spins can repeat a card. Fix: spin again on a repeat, or draw real cards.'],
  }, [
    { t: 'The second spin can land on the card already drawn, which can’t happen with real cards.', ok: true, say: 'Yes: the draws are not independent here.' },
    { t: 'Nothing: two draws are always independent.', mc: 'mc.probability.assumes-independence-by-default', say: 'Without replacement the first draw changes what is left: the second draw depends on the first.' },
    { t: 'She should spin 5 times, once per card.', say: 'One trial is two draws. The problem is that a spin can repeat the first card.' },
  ]);
};

// =====================================================================================================
// 20. compoundPredict: predictions over n complete trials; compare with data   [compound-predict-and-compare]
const compoundPredict: Gen = (R, n) => {
  const mode = pick(R, ['predict', 'predict', 'estimate', 'compare'] as const);
  const ev = pick(R, [
    { t: 'exactly one head in 3 tosses', p: [3, 8] as Frac, stages: 3, trial: '3 tosses' },
    { t: 'at least one head in 2 tosses', p: [3, 4] as Frac, stages: 2, trial: '2 tosses' },
    { t: 'two heads in 2 tosses', p: [1, 4] as Frac, stages: 2, trial: '2 tosses' },
    { t: 'three heads in 3 tosses', p: [1, 8] as Frac, stages: 3, trial: '3 tosses' },
  ]);
  const T = ev.p[1] * int(R, 5, 20), e = expectedCount(ev.p, T);
  if (mode === 'predict') {
    const wrongV = expectedCount(ev.p, T * ev.stages);
    const it: ProbItem = {
      id: `pc-p-${n}`, family: 'compoundPredict', prompt: `P(${ev.t}) = ${S(fr(ev.p[0], ev.p[1]))}. One trial is ${ev.trial}. About how many of ${A(`${T} trials`)} give ${ev.t.replace(/ in .*/, '')}?`,
      board: `P = ${tf(ev.p[0], ev.p[1])},\\ ${T}\\ \\text{trials}`, input: 'num', unit: 'trials (about)',
      pic: { kind: 'strip', n: T, d: ev.p[1], k: ev.p[0], title: `${T} trials of ${ev.trial}`, answer: `\\text{about } ${e}` },
      hero: `${tf(ev.p[0], ev.p[1])} \\times ${T} = ${e}`,
      solution: [`The probability is per TRIAL (${ev.trial} together), so multiply by the number of trials, ${T}.`, `${fr(ev.p[0], ev.p[1])} × ${T} = ${S(e)}: about ${e} trials.`], answer: N(e),
      check: r => numCheck(r, e, `Yes: about ${e} of the ${T} trials.`, [{ v: wrongV, mc: 'mc.probability.prediction-scaled-wrong', say: `${T} × ${ev.stages} counts the single tosses. The probability is per trial: ${fr(ev.p[0], ev.p[1])} × ${T} = ${e}.` }], `${fr(ev.p[0], ev.p[1])} of ${T} trials: about ${e}.`),
    };
    if (Number.isInteger(wrongV)) probe(it, N(wrongV), 'mc.probability.prediction-scaled-wrong');
    return it;
  }
  // "close enough" must be honest: the class result stays within 1.5 standard deviations of the prediction
  const sd = Math.sqrt(T * (ev.p[0] / ev.p[1]) * (1 - ev.p[0] / ev.p[1]));
  const offs = [-3, -2, 2, 3, 4, -4].filter(d => Math.abs(d) <= 1.5 * sd && e + d >= 1);
  const obs = e + (offs.length ? pick(R, offs) : 1);
  if (mode === 'estimate') {
    const it: ProbItem = {
      id: `pc-e-${n}`, family: 'compoundPredict', prompt: `A class ran ${A(`${T} trials`)} of ${ev.trial}. ${S(obs)} trials gave ${ev.t.replace(/ in .*/, '')}. What is the experimental probability?`,
      board: `P \\approx \\,?`, input: 'frac', hero: `\\frac{${obs}}{${T}} \\approx ${tf(ev.p[0], ev.p[1])}`,
      solution: [`Divide by the number of trials, not tosses: ${obs} of ${T}.`, `${S(fr(obs, T))}, close to the theoretical ${fr(ev.p[0], ev.p[1])}.`], answer: F(obs, T),
      check: r => fracCheck(r, obs, T, `Yes: ${fr(obs, T)}.`, [{ v: [obs, T * ev.stages], mc: 'mc.probability.simulation-trial-misdefined', say: `${T * ev.stages} counts single tosses. The event is about whole trials: ${obs} of ${T}.` }, { v: ev.p, mc: 'mc.statistics.sample-statistic-as-exact-parameter', say: `${fr(ev.p[0], ev.p[1])} is the theoretical probability. From the data: ${obs} of ${T}.` }], `Successful trials over all trials: ${fr(obs, T)}.`),
    };
    probe(it, F(obs, T * ev.stages), 'mc.probability.simulation-trial-misdefined');
    if (!same([obs, T], ev.p[0], ev.p[1])) probe(it, F(ev.p[0], ev.p[1]), 'mc.statistics.sample-statistic-as-exact-parameter');
    return it;
  }
  return choiceItem(R, {
    id: `pc-c-${n}`, family: 'compoundPredict', prompt: `Theory: P(${ev.t}) = ${fr(ev.p[0], ev.p[1])}, so about ${A(e)} of ${T} trials. The class got ${S(obs)}. What fits best?`,
    board: `${obs}\\ \\text{vs about}\\ ${e}`, pic: { kind: 'strip', n: T, d: ev.p[1], k: ev.p[0], title: `${T} trials of ${ev.trial}`, answer: `\\text{about } ${e}` },
    hero: `${obs} \\approx ${e}`, solution: [`${T} trials vary by chance: a difference of ${Math.abs(obs - e)} is normal.`, 'More trials would make the share settle closer to the theory.'],
  }, [
    { t: `Close enough: ${T} trials vary by chance, and ${obs} is near ${e}.`, ok: true, say: 'Yes: experimental results wander around the prediction.' },
    { t: `The theory is wrong: it should have been exactly ${e}.`, mc: 'mc.statistics.sample-should-mirror-population', say: `${e} is a prediction of about ${e}. A few more or fewer is normal.` },
    { t: `${e} was guaranteed, so the class made a mistake.`, mc: 'mc.probability.ev-as-guaranteed-outcome', say: `An expected count is not a guarantee. ${obs} is a normal result.` },
  ]);
};

export const GENS: Record<FamilyId, Gen> = {
  scale, space, event, equal, relFreq, theory, model, complement, forms, predict,
  nonUniform, batches: batchesG, longRun, streak, discrepancy, simDigits, compoundSpace, compoundP, designSim, compoundPredict,
};
