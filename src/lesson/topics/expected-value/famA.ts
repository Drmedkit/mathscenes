// famA.ts: stage 1-2 families of "Probability distributions and expected value": the random variable as a rule, the
// event {X = k}, the distribution and its validity, tables from equally likely outcomes, the bar graph, events stated
// with X, path probabilities and several paths into one value. Pure: no DOM.
import { type DPic, type TablePic } from './DistPic';
import { type Base, type DItem, type Gen, type Opt, MC, aD, ans, choice, compose, dec, fracItem, ft, fx, int, numItem, pick, redA, until, word } from './common';
import { nCk } from './ev';
import { shuffle } from '../../runtime/item';

// ---------- shared pictures ----------
export const table = (xs: readonly (number | string)[], ps: readonly (string | null)[], o: { head?: string; title?: string; hl?: number[]; reveal?: (string | null)[] } = {}): TablePic => ({
  kind: 'table', title: o.title, hl: o.hl,
  rows: [{ head: o.head ?? 'x', cells: xs.map(x => String(x).replace('−', '-')) }, { head: 'P(X = x)', cells: [...ps] }],
  ...(o.reveal ? { reveal: { cells: [xs.map(() => null), o.reveal] } } : {}),
});
const pics = (...p: DPic[]): { pics: DPic[] } => ({ pics: p });
const coinTree = (n: number): DPic => ({ kind: 'count', pic: { kind: 'tree', levels: Array.from({ length: n }, (_, i) => ({ name: `Coin ${i + 1}`, opts: ['H', 'T'] })), leaves: true, title: `${word(n)} coins`.replace(/^./, s => s.toUpperCase()) } });
const SUM = (r: number, b: number) => r + b, MAX = (r: number, b: number) => Math.max(r, b), DIFF = (r: number, b: number) => Math.abs(r - b);
const DICE = { sum: { f: SUM, name: 'the sum of the two dice', vals: [2, 12] }, larger: { f: MAX, name: 'the larger of the two numbers', vals: [1, 6] }, diff: { f: DIFF, name: 'the difference, larger minus smaller', vals: [0, 5] } } as const;
type DiceKind = keyof typeof DICE;
const diceGrid = (f: (r: number, b: number) => number, A?: [number, number][]): DPic => ({
  kind: 'cond', pic: { kind: 'grid', rowName: 'Red die', colName: 'Blue die', rowVals: ['1', '2', '3', '4', '5', '6'], colVals: ['1', '2', '3', '4', '5', '6'], text: [1, 2, 3, 4, 5, 6].map(r => [1, 2, 3, 4, 5, 6].map(b => String(f(r, b)))), A },
});
const diceCount = (f: (r: number, b: number) => number, k: number) => { let c = 0; for (let r = 1; r <= 6; r++) for (let b = 1; b <= 6; b++) if (f(r, b) === k) c++; return c; };
/** all 2^n coin outcomes, e.g. HHT */
const coinOutcomes = (n: number): string[] => Array.from({ length: 2 ** n }, (_, i) => Array.from({ length: n }, (_, j) => ((i >> (n - 1 - j)) & 1 ? 'T' : 'H')).join(''));
const heads = (s: string) => [...s].filter(ch => ch === 'H').length;

// ===================== rv-assign =====================
export const rvValue: Gen = (R, n) => {
  const v = int(R, 0, 4);
  const b = (prompt: string, board: string, sol: string[], picture?: { pics: DPic[] }): Base => ({ id: `rvValue-${n}`, family: 'rvValue', prompt, board, solution: sol, picture });
  if (v === 0) {
    const nc = pick(R, [3, 4]), o = until(() => coinOutcomes(nc)[int(R, 0, 2 ** nc - 1)]!, s => heads(s) > 0 && heads(s) < nc), h = heads(o);
    return numItem(b(`Toss ${word(nc)} coins. The random variable X is the <b>number of heads</b>. The coins land <b>${o}</b>. What value does X give this outcome?`, `X(\\text{${o}}) = \\,?`,
      [`X counts the heads in the outcome: ${[...o].join(', ')}.`, `${h === 1 ? 'There is' : 'There are'} ${ans(h)} head${h === 1 ? '' : 's'}.`], pics({ kind: 'count', pic: { kind: 'tokens', names: [...o], groups: [...o].map(ch => (ch === 'H' ? 0 : 1)), legend: ['heads', 'tails'], title: 'The outcome' } })),
      h, `Yes: X turns ${o} into the number ${h}.`, [[nc - h, undefined, 'That counts the tails. X counts the heads.']], 'Count the H’s in the outcome.');
  }
  if (v === 1) {
    const r = int(R, 1, 6), bl = int(R, 1, 6), k = pick(R, ['sum', 'larger'] as const), x = DICE[k].f(r, bl);
    return numItem(b(`Roll a red and a blue number cube. X is ${DICE[k].name}. The red cube shows <b>${r}</b> and the blue cube shows <b>${bl}</b>. What is X for this outcome?`, `X(${r},\\,${bl}) = \\,?`,
      [k === 'sum' ? `X adds the two numbers: ${r} + ${bl}.` : `X keeps the larger of ${r} and ${bl}.`, `X = ${ans(x)}.`],
      pics({ kind: 'count', pic: { kind: 'tokens', names: [String(r), String(bl)], groups: [0, 1], legend: ['red cube', 'blue cube'], title: 'The outcome' } })),
      x, `Yes: the rule turns (${r}, ${bl}) into ${x}.`, k === 'sum' ? [[r * bl, undefined, 'That multiplies. X is the sum.']] : [[Math.min(r, bl), undefined, 'That is the smaller number. X is the larger one.']], 'Apply the rule to the two numbers.');
  }
  if (v === 2) {
    const cost = pick(R, [1, 2, 3]), prize = pick(R, [5, 8, 10, 12]);
    const win = R() < 0.6;
    const x = win ? prize - cost : -cost;
    return numItem(b(`A carnival game costs <b>$${cost}</b> to play. Spin a spinner: <b>red</b> wins ${aD(prize)} <b>$${prize}</b> prize, any other color wins nothing. X is your <b>net gain in dollars</b> (prize minus the cost to play). You spin <b>${win ? 'red' : 'blue'}</b>. What is X?`, `X = \\,?\\ \\text{dollars}`,
      [win ? `You get $${prize} but paid $${cost}.` : `You get nothing but paid $${cost}.`, `X = ${win ? `${prize} − ${cost}` : `0 − ${cost}`} = ${ans(x < 0 ? '−' + -x : x)}.`]),
      x, win ? `Yes: $${prize} back on ${aD(cost)} $${cost} ticket is a net gain of $${x}.` : `Yes: a loss is a negative net gain, −$${cost}.`,
      win ? [[prize, MC.revenue, 'That is the prize. The net gain takes off the $' + cost + ' you paid.']] : [[0, MC.revenue, `You paid $${cost} and won nothing: the net gain is negative.`], [cost, undefined, 'A loss of $' + cost + ' is a net gain of −' + cost + '.']],
      'Net gain = prize − cost to play.');
  }
  if (v === 3) {
    const nq = pick(R, [3, 4]), L = ['A', 'B', 'C', 'D'];
    const key = Array.from({ length: nq }, () => pick(R, L));
    const guess = until(() => key.map(k0 => (R() < 0.5 ? k0 : pick(R, L))), g => { const c = g.filter((x, i) => x === key[i]).length; return c > 0 && c < nq; });
    const c = guess.filter((x, i) => x === key[i]).length;
    return numItem(b(`A quiz has ${word(nq)} multiple-choice questions. X is the <b>number of answers that are right</b>. The answer key is <b>${key.join(', ')}</b>. Lee answered <b>${guess.join(', ')}</b>. What is X?`, `X = \\,?`,
      [`Compare question by question: ${guess.map((x, i) => (x === key[i] ? `${i + 1} right` : `${i + 1} wrong`)).join(', ')}.`, `X = ${ans(c)} right answers.`]),
      c, `Yes: ${c} of Lee’s answers match the key.`, [[nq - c, undefined, 'That counts the wrong answers. X counts the right ones.']], 'Compare each answer with the key and count the matches.');
  }
  const r = int(R, 1, 6), bl = int(R, 1, 6);
  const x = Math.abs(r - bl);
  return numItem(b(`Roll a red and a blue number cube. X is the <b>difference</b> between the numbers, larger minus smaller (0 when they match). The cubes show <b>${r}</b> and <b>${bl}</b>. What is X?`, `X(${r},\\,${bl}) = \\,?`,
    [`Larger minus smaller: ${Math.max(r, bl)} − ${Math.min(r, bl)}.`, `X = ${ans(x)}.`], pics({ kind: 'count', pic: { kind: 'tokens', names: [String(r), String(bl)], groups: [0, 1], legend: ['red cube', 'blue cube'], title: 'The outcome' } })),
    x, `Yes: X = ${x} for this outcome.`, [[r + bl, undefined, 'That is the sum. X is the difference.']], 'Subtract the smaller number from the larger one.');
};

export const rvWhich: Gen = (R, n) => {
  const ctx = pick(R, [
    { setup: 'Toss two coins. X is the number of heads.', o1: 'HT', o2: 'TH', v: 1, outs: 'HH, HT, TH and TT', vals: '0, 1 and 2' },
    { setup: 'Roll two number cubes. X is the sum.', o1: '(2, 5)', o2: '(4, 3)', v: 7, outs: '(1, 1), (1, 2), … , (6, 6)', vals: '2, 3, … , 12' },
    { setup: 'Toss three coins. X is the number of tails.', o1: 'HTT', o2: 'TTH', v: 2, outs: 'HHH, HHT, … , TTT', vals: '0, 1, 2 and 3' },
    { setup: 'Guess on two true-false questions. X is the number right.', o1: 'right, wrong', o2: 'wrong, right', v: 1, outs: 'RR, RW, WR and WW', vals: '0, 1 and 2' },
  ]);
  const opts: Opt[] = [
    { t: `${ctx.o1} and ${ctx.o2} both give X = ${ctx.v}: different outcomes can share one value.`, ok: true, say: 'Right: X is a rule outcome → number, and a rule may send several outcomes to one number.' },
    { t: `${ctx.o1} and ${ctx.o2} can’t both give ${ctx.v}: each outcome needs its own value.`, mc: MC.oneToOne, say: `A random variable may give several outcomes the same number. ${ctx.o1} and ${ctx.o2} really do both give ${ctx.v}.` },
    { t: 'X is one fixed number; we could solve for it before the experiment.', mc: MC.fixedUnknown, say: 'X has no single value to solve for: its value depends on the outcome, and changes from trial to trial.' },
    { t: `The values of X are the outcomes ${ctx.outs}.`, mc: MC.partsConfused, say: `Those are the outcomes. The values of X are the numbers the rule gives: ${ctx.vals}.` },
  ];
  return choice(R, { id: `rvWhich-${n}`, family: 'rvWhich', prompt: `${ctx.setup} Which statement is true?`, board: `X:\\ \\text{outcome} \\mapsto \\text{number}`,
    solution: [`X is a rule that turns each outcome into a number.`, `${ctx.o1} → ${ctx.v} and ${ctx.o2} → ${ctx.v}: two outcomes, one value.`] }, opts);
};

// ===================== event-x-equals-k =====================
export const eventCount: Gen = (R, n) => {
  const v = int(R, 0, 3);
  const b = (prompt: string, board: string, sol: string[], picture?: { pics: DPic[] }): Base => ({ id: `eventCount-${n}`, family: 'eventCount', prompt, board, solution: sol, picture });
  if (v === 0 || v === 1) {
    const kind: DiceKind = v === 0 ? 'sum' : pick(R, ['larger', 'diff'] as const), D = DICE[kind];
    const k = int(R, D.vals[0], D.vals[1]), c = diceCount(D.f, k);
    return numItem(b(`Roll a red and a blue number cube (36 equally likely outcomes). X is ${D.name}. How many outcomes are in the event <b>{X = ${k}}</b>?`, `\\{X = ${k}\\}:\\ \\text{how many outcomes?}`,
      [`Every cell of the grid is one outcome, with its value of X.`, `Count the cells that show ${k}: ${ans(c)} outcome${c === 1 ? '' : 's'}.`], pics(diceGrid(D.f))),
      c, `Yes: ${c} of the 36 outcomes give X = ${k}.`, c > 1 ? [[1, MC.oneToOne, `Several outcomes can give the same value: count every cell that shows ${k}.`]] : [], `Count every cell of the grid that shows ${k}.`);
  }
  if (v === 2) {
    const nc = 3, k = int(R, 0, 3), c = nCk(nc, k);
    return numItem(b(`Toss three coins (8 equally likely outcomes). X is the number of heads. How many outcomes are in the event <b>{X = ${k}}</b>?`, `\\{X = ${k}\\}:\\ \\text{how many outcomes?}`,
      [`List the outcomes with exactly ${k} head${k === 1 ? '' : 's'}: ${coinOutcomes(3).filter(s => heads(s) === k).join(', ')}.`, `That is ${ans(c)} outcome${c === 1 ? '' : 's'}.`], pics(coinTree(3))),
      c, `Yes: ${coinOutcomes(3).filter(s => heads(s) === k).join(', ')}.`, c > 1 ? [[1, MC.oneToOne, `${k} heads can come in different orders: count each order as its own outcome.`]] : [], `Follow each path of the tree and count those with ${k} heads.`);
  }
  // how many values can X take?
  const kind = pick(R, ['sum', 'larger', 'diff'] as const), D = DICE[kind], nv = D.vals[1] - D.vals[0] + 1;
  return numItem(b(`Roll a red and a blue number cube. X is ${D.name}. How many <b>different values</b> can X take?`, `\\text{values of } X:\\ \\text{how many?}`,
    [`X can be ${D.vals[0]}, ${D.vals[0] + 1}, … , ${D.vals[1]}.`, `That is ${ans(nv)} values (many outcomes share each one).`], pics(diceGrid(D.f))),
    nv, `Yes: from ${D.vals[0]} to ${D.vals[1]}, ${nv} values.`, [[36, MC.partsConfused, 'There are 36 outcomes, but the values of X are the numbers in the cells. Count the different numbers.']], 'List the different numbers that appear in the grid.');
};

export const eventList: Gen = (R, n) => {
  if (R() < 0.5) {
    const k = pick(R, [1, 2]), right = coinOutcomes(3).filter(s => heads(s) === k);
    const atLeast = coinOutcomes(3).filter(s => heads(s) >= k);
    const one = right[0]!;
    const opts: Opt[] = [
      { t: `{${right.join(', ')}}`, ok: true, say: `Right: every order with exactly ${k} head${k > 1 ? 's' : ''}.` },
      { t: `{${one}}`, mc: MC.oneToOne, say: `${one} is one of them, but ${right.slice(1).join(' and ')} also have exactly ${k} head${k > 1 ? 's' : ''}.` },
      { t: `{${atLeast.join(', ')}}`, say: `That is {X ≥ ${k}}: it includes outcomes with more than ${k} head${k > 1 ? 's' : ''}.` },
      { t: `{${k}}`, mc: MC.partsConfused, say: `${k} is the value of X. The event is the set of outcomes that give that value.` },
    ];
    return choice(R, { id: `eventList-${n}`, family: 'eventList', prompt: `Toss three coins. X is the number of heads. Which set is the event <b>{X = ${k}}</b>?`, board: `\\{X = ${k}\\} = \\,?`,
      solution: [`{X = ${k}} holds every outcome whose number of heads is ${k}.`, `Those are ${right.join(', ')}.`], picture: pics(coinTree(3)) }, opts);
  }
  const k = pick(R, [4, 5, 9, 10]);
  const right: string[] = [];
  for (let r = 1; r <= 6; r++) for (let b = 1; b <= 6; b++) if (r + b === k) right.push(`(${r}, ${b})`);
  const merged = right.filter(s => { const [r, b] = s.slice(1, -1).split(', ').map(Number); return r! <= b!; });
  const opts: Opt[] = [
    { t: `{${right.join(', ')}}`, ok: true, say: 'Right: (red, blue) pairs in both orders, because the cubes are different colors.' },
    { t: `{${merged.join(', ')}}`, mc: 'mc.probability.ordered-outcomes-merged', say: `(1, 3) and (3, 1) are different outcomes: red 1, blue 3 is not red 3, blue 1. Keep both orders.` },
    { t: `{${k}}`, mc: MC.partsConfused, say: `${k} is the value of X. The event is the set of outcomes that give it.` },
  ];
  return choice(R, { id: `eventList-${n}`, family: 'eventList', prompt: `Roll a red and a blue number cube; write an outcome as (red, blue). X is the sum. Which set is the event <b>{X = ${k}}</b>?`, board: `\\{X = ${k}\\} = \\,?`,
    solution: [`List every (red, blue) pair that adds to ${k}.`, `${right.join(', ')}: ${right.length} outcomes.`], picture: pics(diceGrid(SUM)) }, opts);
};

// ===================== distribution-concept =====================
const DISTS = [
  { x: 'the number of pets in a household', xs: [0, 1, 2, 3], ps: [35, 30, 20, 15] },
  { x: 'the number of cars a family owns', xs: [0, 1, 2, 3, 4], ps: [10, 30, 35, 15, 10] },
  { x: 'the number of goals a team scores in a game', xs: [0, 1, 2, 3, 4], ps: [20, 30, 25, 15, 10] },
  { x: 'the number of siblings a student has', xs: [0, 1, 2, 3], ps: [20, 40, 25, 15] },
  { x: 'the number of texts a person sends in an hour', xs: [0, 1, 2, 3, 4, 5], ps: [25, 20, 20, 15, 10, 10] },
];
export const distParts: Gen = (R, n) => {
  const D = pick(R, DISTS), j = int(R, 0, D.xs.length - 1), x = D.xs[j]!, p = D.ps[j]! / 100;
  const pic = pics(table(D.xs, D.ps.map(q => dec(q / 100))));
  const v = int(R, 0, 2);
  const base = (prompt: string, board: string, sol: string[]): Base => ({ id: `distParts-${n}`, family: 'distParts', prompt, board, solution: sol, picture: pic });
  if (v === 0) {
    return choice(R, base(`X is ${D.x}. The table is its probability distribution. What does <b>P(X = ${x}) = ${dec(p)}</b> say?`, `P(X = ${x}) = ${dec(p)}`,
      [`Inside P( ) is the event: X takes the value ${x}.`, `The number after = is how likely that is.`]), [
      { t: `X takes the value ${x} with probability ${dec(p)}.`, ok: true, say: `Right: the value is ${x}; ${dec(p)} is how likely it is.` },
      { t: `X takes the value ${dec(p)}, with probability ${x}.`, mc: MC.probAsValue, say: `That swaps them: ${dec(p)} is the probability, and the value of X is the number inside P( ): ${x}.` },
      { t: `The random variable X is equal to ${dec(p)}.`, mc: MC.probAsValue, say: `X is ${D.x}: a whole number here. ${dec(p)} is the chance that X = ${x}.` },
      { t: `X is the whole table, and ${dec(p)} is one row of it.`, mc: MC.rvAsTable, say: 'The table describes X; it is not X. X is the number the chance process produces.' },
    ]);
  }
  if (v === 1) {
    return choice(R, base(`X is ${D.x}. Which of these is <b>the random variable</b>?`, `X,\\ \\ x,\\ \\ P(X = x)`,
      [`The random variable is the rule: each household or trial gives one number.`, `The table lists its values with their probabilities: that is its distribution.`]), [
      { t: `${D.x[0]!.toUpperCase() + D.x.slice(1)}, a number that varies by chance`, ok: true, say: 'Right: X is the numerical rule; the table is its distribution.' },
      { t: 'The table of values and probabilities', mc: MC.rvAsTable, say: 'The table is the distribution of X: it describes X but is not X itself.' },
      { t: `The probability ${dec(p)}`, mc: MC.probAsValue, say: `${dec(p)} is P(X = ${x}): a probability, not the variable.` },
    ]);
  }
  // which number is a value of X?
  const probs = shuffle(R, [...new Set(D.ps)].filter(q => q !== D.ps[j])).slice(0, 2).map(q => dec(q / 100));
  return choice(R, base(`X is ${D.x}, with the distribution in the table. Which number is a <b>value of X</b>, not a probability?`, `x \\ \\text{ or } \\ P(X = x)?`,
    [`The top row lists the values X can take: ${D.xs.join(', ')}.`, `The bottom row lists probabilities.`]), [
    { t: String(x), ok: true, say: `Right: ${x} is in the top row: a value X can take.` },
    ...probs.map(pv => ({ t: pv, mc: MC.probAsValue, say: `${pv} is in the bottom row: a probability, not a value of X.` })),
  ]);
};

export const distRead: Gen = (R, n) => {
  const D = pick(R, DISTS);
  const uniq = D.ps.filter(q => D.ps.filter(r => r === q).length === 1);
  const pq = pick(R, uniq), j = D.ps.indexOf(pq), x = D.xs[j]!;
  const pic = pics(table(D.xs, D.ps.map(q => dec(q / 100))));
  if (R() < 0.5) {
    return numItem({ id: `distRead-${n}`, family: 'distRead', prompt: `X is ${D.x}, with the distribution in the table. What is <b>P(X = ${x})</b>?`, board: `P(X = ${x}) = \\,?`,
      solution: [`Find ${x} in the x row.`, `Under it: P(X = ${x}) = ${ans(dec(pq / 100))}.`], picture: pic },
      pq / 100, `Yes: P(X = ${x}) = ${dec(pq / 100)}.`, [[x, MC.probAsValue, `${x} is the value. The question asks how likely that value is: read the row under it.`]], `Find ${x} in the top row and read the probability under it.`);
  }
  return numItem({ id: `distRead-${n}`, family: 'distRead', prompt: `X is ${D.x}, with the distribution in the table. Which <b>value of X</b> has probability ${dec(pq / 100)}?`, board: `P(X = x) = ${dec(pq / 100)}:\\ \\ x = \\,?`,
    solution: [`Find ${dec(pq / 100)} in the probability row.`, `Above it is the value: x = ${ans(x)}.`], picture: pic },
    x, `Yes: P(X = ${x}) = ${dec(pq / 100)}.`, [[pq / 100, MC.probAsValue, `${dec(pq / 100)} is the probability. The value of X is the number above it.`]], `Find ${dec(pq / 100)} in the bottom row and read the value above it.`);
};

// ===================== validity-check =====================
const FRAC_DENS = [4, 6, 8, 12, 36];
export const validJudge: Gen = (R, n) => {
  const kind = pick(R, ['valid', 'valid0', 'low', 'high', 'neg'] as const);
  const m = int(R, 3, 5);
  const useFrac = R() < 0.35 && kind !== 'neg';
  let cells: string[], sumTxt: string;
  if (kind === 'neg') {
    // one entry negative, the rest positive, total exactly 1
    const neg = -int(R, 1, 3) * 5, rest = compose(R, (100 - neg) / 5, m - 1).map(x => x * 5);
    const parts = rest.slice(); parts.splice(int(R, 0, m - 1), 0, neg);
    cells = parts.map(p => dec(p / 100).replace('−', '-'));
    sumTxt = '1';
  } else if (useFrac) {
    const d = pick(R, [8, 12, 36]);
    const target = kind === 'low' ? d - (d === 36 ? 2 : 1) : kind === 'high' ? d + (d === 36 ? 2 : 1) : d;
    let parts = compose(R, target, kind === 'valid0' ? m - 1 : m);
    if (kind === 'valid0') { parts = parts.slice(); parts.splice(int(R, 0, m - 1), 0, 0); }
    cells = parts.map(p => (p === 0 ? '0' : fx(p, d)));
    sumTxt = ft(target, d);
  } else {
    const target = kind === 'low' ? 90 : kind === 'high' ? 110 : 100;
    let parts = compose(R, target / 5, kind === 'valid0' ? m - 1 : m).map(x => x * 5);
    if (kind === 'valid0') { parts = parts.slice(); parts.splice(int(R, 0, m - 1), 0, 0); }
    cells = parts.map(p => dec(p / 100));
    sumTxt = dec(target / 100);
  }
  const xs = Array.from({ length: m }, (_, i) => i);
  const okKey = kind === 'valid' || kind === 'valid0' ? 'valid' : kind;
  const opts: Opt[] = [
    { t: 'Valid: every probability is from 0 to 1, and they add to 1', ok: okKey === 'valid', key: 'valid', mc: kind === 'neg' ? MC.outside01 : MC.notOne, say: okKey === 'valid' ? 'Right: both conditions hold.' : kind === 'neg' ? 'They do add to 1, but a probability can never be negative.' : `Each entry looks fine, but together they add to ${sumTxt}, not 1.` },
    { t: 'Not valid: the probabilities add to more than 1', ok: okKey === 'high', key: 'high', say: okKey === 'high' ? `Right: they add to ${sumTxt}.` : `Add them: the total is ${sumTxt}.` },
    { t: 'Not valid: the probabilities add to less than 1', ok: okKey === 'low', key: 'low', say: okKey === 'low' ? `Right: they add to ${sumTxt}, so some probability is missing.` : `Add them: the total is ${sumTxt}.` },
    { t: 'Not valid: a probability is negative', ok: okKey === 'neg', key: 'neg', say: okKey === 'neg' ? 'Right: a probability below 0 is impossible, even though the total is 1.' : 'Look again: no entry is below 0.' },
  ];
  if (kind === 'valid0') opts.push({ t: 'Not valid: a probability of 0 is not allowed', key: 'zero', say: 'A value can have probability 0: it is in the table but never happens. 0 is inside [0, 1].' });
  return choice(R, { id: `validJudge-${n}`, family: 'validJudge', prompt: `Is this table a valid probability distribution for X?`, board: `\\textstyle\\sum P(X = x) = \\,?`,
    solution: [`Check 1: every entry is between 0 and 1${kind === 'neg' ? ' (one is not)' : ''}.`, `Check 2: the entries add to ${sumTxt}${sumTxt === '1' ? '' : ', not 1'}.`],
    picture: pics(table(xs, cells)) }, opts, true);
};

export const validMissing: Gen = (R, n) => {
  const m = int(R, 3, 5), hole = int(R, 0, m - 1), s0 = R() < 0.3 ? 1 : 0, xs = Array.from({ length: m }, (_, i) => i + s0);
  if (R() < 0.5) {
    const d = pick(R, FRAC_DENS.filter(q => q > m));
    const parts = compose(R, d, m);
    const known = parts.filter((_, i) => i !== hole), miss = parts[hole]!;
    const cells = parts.map((p, i) => (i === hole ? null : fx(p, d)));
    const ks = known.reduce((s, x) => s + x, 0);
    return fracItem({ id: `validMissing-${n}`, family: 'validMissing', prompt: `The table is a probability distribution, but one probability is missing. What is <b>P(X = ${xs[hole]})</b>?`, board: `P(X = ${xs[hole]}) = 1 - \\textstyle\\sum \\text{others}`,
      solution: [`All the probabilities must add to 1.`, `The others add to ${ft(ks, d)}.`, `1 − ${ft(ks, d)} = ${ans(ft(miss, d))}.`], picture: pics(table(xs, cells, { reveal: parts.map((p, i) => (i === hole ? fx(p, d) : null)) })) },
      miss, d, `Yes: then the table adds to exactly 1.`, [[ks, d, MC.notOne, `${ft(ks, d)} is what the others add to. The missing one is what is left to make 1.`]], 'Add the given probabilities and subtract from 1.');
  }
  const parts = R() < 0.5 ? compose(R, 20, m).map(x => x * 5) : compose(R, 100, m, 4);
  const known = parts.filter((_, i) => i !== hole), miss = parts[hole]!, ks = known.reduce((s, x) => s + x, 0);
  return numItem({ id: `validMissing-${n}`, family: 'validMissing', prompt: `The table is a probability distribution, but one probability is missing. What is <b>P(X = ${xs[hole]})</b>? Give a decimal.`, board: `P(X = ${xs[hole]}) = 1 - \\textstyle\\sum \\text{others}`,
    solution: [`All the probabilities must add to 1.`, `The others add to ${dec(ks / 100)}.`, `1 − ${dec(ks / 100)} = ${ans(dec(miss / 100))}.`], picture: pics(table(xs, parts.map((p, i) => (i === hole ? null : dec(p / 100))), { reveal: parts.map((p, i) => (i === hole ? dec(p / 100) : null)) })) },
    miss / 100, 'Yes: now the table adds to exactly 1.', [[ks / 100, MC.notOne, `${dec(ks / 100)} is the sum of the others. The missing one is 1 minus that.`], [miss, undefined, `As a probability: ${dec(miss / 100)}, a number from 0 to 1.`]], 'Add the given probabilities and subtract from 1.');
};

// ===================== build-equally-likely =====================
export const buildCoins: Gen = (R, n) => {
  const nc = pick(R, [2, 3, 3]), what = pick(R, ['heads', 'tails'] as const), k = int(R, 0, nc), c = nCk(nc, k), N = 2 ** nc;
  const list = coinOutcomes(nc).filter(s => (what === 'heads' ? heads(s) : nc - heads(s)) === k);
  return fracItem({ id: `buildCoins-${n}`, family: 'buildCoins', prompt: `Toss ${word(nc)} fair coins. X is the number of <b>${what}</b>. Build the distribution of X. What is <b>P(X = ${k})</b>?`, board: `P(X = ${k}) = \\dfrac{\\text{outcomes in } \\{X = ${k}\\}}{${N}}`,
    solution: [`The ${N} outcomes (the paths of the tree) are equally likely.`, `{X = ${k}} = {${list.join(', ')}}: ${c} outcome${c === 1 ? '' : 's'}.`, `P(X = ${k}) = ${redA(c, N)}.`],
    picture: pics(coinTree(nc)) },
    c, N, `Yes: ${c} of the ${N} equally likely outcomes.`, [[c, 1, MC.countAsProb, `${c} is how many outcomes give X = ${k}. Divide by all ${N} outcomes to get a probability.`], [1, nc + 1, MC.equiprob, `X has ${nc + 1} values, but they are not equally likely: count the outcomes behind each one.`]],
    `Count the paths with exactly ${k} ${what}, then divide by ${N}.`);
};

export const buildDice: Gen = (R, n) => {
  const kind = pick(R, ['sum', 'larger', 'diff'] as const), D = DICE[kind];
  const k = int(R, D.vals[0], D.vals[1]), c = diceCount(D.f, k), nv = D.vals[1] - D.vals[0] + 1;
  return fracItem({ id: `buildDice-${n}`, family: 'buildDice', prompt: `Roll a red and a blue fair number cube. X is ${D.name}. What is <b>P(X = ${k})</b>?`, board: `P(X = ${k}) = \\dfrac{\\text{cells showing } ${k}}{36}`,
    solution: [`The 36 cells are equally likely outcomes.`, `${c} cell${c === 1 ? ' shows' : 's show'} ${k}.`, `P(X = ${k}) = ${redA(c, 36)}.`], picture: pics(diceGrid(D.f)) },
    c, 36, `Yes: ${c} of the 36 outcomes give X = ${k}.`, [[c, 1, MC.countAsProb, `${c} counts the outcomes. A probability divides by all 36.`], [1, nv, MC.equiprob, `X has ${nv} values, but they do not come up equally often: count the cells for ${k}.`]],
    `Count the cells that show ${k} and divide by 36.`);
};

// ===================== graph-distribution =====================
const COUNT_SETS = [
  { what: 'X = number of heads in three tosses of a fair coin', xs: [0, 1, 2, 3], cs: [1, 3, 3, 1], N: 8 },
  { what: 'X = larger number when two fair number cubes are rolled', xs: [1, 2, 3, 4, 5, 6], cs: [1, 3, 5, 7, 9, 11], N: 36 },
  { what: 'X = sum of two spins of a fair spinner numbered 1 to 3', xs: [2, 3, 4, 5, 6], cs: [1, 2, 3, 2, 1], N: 9 },
  { what: 'X = number of heads in two tosses of a fair coin', xs: [0, 1, 2], cs: [1, 2, 1], N: 4 },
  { what: 'X = difference of two fair number cubes (larger minus smaller)', xs: [0, 1, 2, 3, 4, 5], cs: [6, 10, 8, 6, 4, 2], N: 36 },
];
export const graphHeight: Gen = (R, n) => {
  const S = pick(R, COUNT_SETS), j = until(() => int(R, 0, S.xs.length - 1), i => S.cs[i]! !== S.xs[i]! && S.cs[i]! > 1), x = S.xs[j]!, c = S.cs[j]!;
  const labs = S.cs.map((q, i) => (i === j ? null : fx(q, S.N)));
  const pic: DPic = { kind: 'bars', xs: S.xs, ps: S.cs.map((q, i) => (i === j ? null : q / S.N)), labs, axis: { min: Math.min(...S.xs), max: Math.max(...S.xs), step: 1, name: 'x' }, reveal: { ps: S.cs.map((q, i) => (i === j ? q / S.N : null)), labs: S.cs.map((q, i) => (i === j ? fx(q, S.N) : null)) } };
  return fracItem({ id: `graphHeight-${n}`, family: 'graphHeight', prompt: `${S.what}. Out of ${S.N} equally likely outcomes, ${S.cs.map((q, i) => `${q} give X = ${S.xs[i]}`).join(', ')}. The bar for X = ${x} is missing. How tall should it be on the <b>probability</b> scale?`,
    board: `\\text{height at } ${x} = P(X = ${x}) = \\,?`,
    solution: [`A bar’s height is the probability of its value, not its count.`, `${c} of ${S.N} outcomes give X = ${x}: P(X = ${x}) = ${redA(c, S.N)}.`], picture: pics(pic) },
    c, S.N, `Yes: the bar stands ${ft(c, S.N)} high.`, [[c, 1, MC.countAsProb, `${c} is the count. The graph shows probabilities: ${c} out of ${S.N}.`], [x, 1, MC.valueAsHeight, `${x} is where the bar stands, on the horizontal axis. Its height is the probability.`]],
    `Divide the outcomes for X = ${x} by ${S.N}.`);
};

const UNEVEN = [{ xs: [0, 2, 5], ps: [50, 30, 20] }, { xs: [1, 2, 5], ps: [40, 40, 20] }, { xs: [0, 1, 4], ps: [30, 50, 20] }, { xs: [0, 3, 4, 10], ps: [40, 30, 20, 10] }, { xs: [0, 1, 6], ps: [60, 30, 10] }];
export const graphAxis: Gen = (R, n) => {
  const v = int(R, 0, 2);
  if (v === 0) {
    const U = pick(R, UNEVEN), last = U.xs[U.xs.length - 1]!, prev = U.xs[U.xs.length - 2]!, pl = U.ps[U.ps.length - 1]! / 100;
    const pic: DPic = { kind: 'bars', xs: U.xs, ps: U.ps.map((p, i) => (i === U.xs.length - 1 ? null : p / 100)), labs: U.ps.map((p, i) => (i === U.xs.length - 1 ? null : dec(p / 100))), axis: { min: 0, max: last + 1, step: 1, name: 'x' }, ghost: false, reveal: { ps: U.ps.map((p, i) => (i === U.xs.length - 1 ? p / 100 : null)), labs: U.ps.map((p, i) => (i === U.xs.length - 1 ? dec(p / 100) : null)) } };
    return choice(R, { id: `graphAxis-${n}`, family: 'graphAxis', prompt: `X takes the values ${U.xs.join(', ')} with probabilities ${U.ps.map(p => dec(p / 100)).join(', ')}. The bars for ${U.xs.slice(0, -1).join(' and ')} are drawn. Where does the bar for <b>X = ${last}</b> go, and how tall is it?`,
      board: `P(X = ${last}) = ${dec(pl)}`, solution: [`The horizontal axis is a number scale: the bar stands above ${last}.`, `Its height is its probability, ${dec(pl)}.`], picture: pics(pic) }, [
      { t: `Above ${last} on the scale, ${dec(pl)} tall`, ok: true, say: 'Right: values sit at their true places; heights are probabilities.' },
      { t: `Right after the bar for ${prev}, at ${prev + 1}, ${dec(pl)} tall`, key: prev + 1 === last ? 'same' : 'next', mc: MC.equalTicks, say: `${last} is ${last - prev} steps after ${prev} on the number scale, not one step. The gaps between values must show.` },
      { t: `Above ${last}, ${last} tall`, mc: MC.valueAsHeight, say: `${last} is the value: it says WHERE the bar stands. How tall it is comes from the probability, ${dec(pl)}.` },
      { t: `Above ${dec(pl)} on the scale, ${last} tall`, mc: MC.probAsValue, say: 'That swaps them: the value goes along the axis, the probability goes up.' },
    ]);
  }
  const D = pick(R, DISTS);
  const pic: DPic = { kind: 'bars', xs: D.xs, ps: D.ps.map(p => p / 100), axis: { min: 0, max: D.xs[D.xs.length - 1]!, step: 1 }, y: { max: 0.4, step: 0.1, dec: 1 } };
  if (v === 1) return choice(R, { id: `graphAxis-${n}`, family: 'graphAxis', prompt: `You graph the distribution of X, ${D.x}. What goes along the <b>horizontal</b> axis?`, board: `\\text{axis: } x \\ \\text{ or } \\ P(X = x)?`,
    solution: ['A distribution graph has one bar for each possible value of X.', 'So the horizontal axis lists the possible values of X.'], picture: pics(pic) }, [
    { t: 'The possible values of X', ok: true, say: 'Right: one bar at each value.' },
    { t: 'The trial number: 1st household, 2nd household, …', mc: MC.trialAxis, say: 'That would be a list of results in order. A distribution groups them by value: the axis lists the values of X.' },
    { t: 'The probabilities', mc: MC.probAsValue, say: 'The probabilities are the heights, on the vertical axis.' },
  ]);
  return choice(R, { id: `graphAxis-${n}`, family: 'graphAxis', prompt: `You graph the distribution of X, ${D.x}. What sets the <b>height</b> of each bar?`, board: `\\text{height} = \\,?`,
    solution: ['The bar stands above its value x.', 'Its height is P(X = x), so the heights add to 1.'], picture: pics(pic) }, [
    { t: 'Its probability, P(X = x)', ok: true, say: 'Right: the heights are probabilities and add to 1.' },
    { t: 'The value x itself', mc: MC.valueAsHeight, say: 'The value says where the bar stands. A bar for x = 3 is not 3 tall.' },
    { t: 'How many outcomes give that value', mc: MC.countAsProb, say: 'Counts make a different graph. A probability distribution shows count ÷ total: the probability.' },
  ]);
};

// ===================== event-probabilities =====================
type Cond = { w: string; s: string; keep: (x: number) => boolean; slip?: { keep: (x: number) => boolean; mc: string; say: string } };
function eventGen(R: () => number, n: number, family: string, words: boolean): DItem {
  const D = pick(R, DISTS), xs = D.xs, lo = xs[0]!, hi = xs[xs.length - 1]!;
  const k = int(R, lo + 1, hi - 1);
  const conds: Cond[] = words ? [
    { w: `at least ${k}`, s: `X \\ge ${k}`, keep: x => x >= k, slip: { keep: x => x === k, mc: MC.atLeastExactly, say: `“At least ${k}” means ${k} or more: add every value from ${k} up.` } },
    { w: `at most ${k}`, s: `X \\le ${k}`, keep: x => x <= k, slip: { keep: x => x < k, mc: undefined as never, say: `“At most ${k}” includes ${k} itself.` } },
    { w: `more than ${k}`, s: `X > ${k}`, keep: x => x > k, slip: { keep: x => x >= k, mc: MC.strictBoundary, say: `“More than ${k}” leaves ${k} out: start at ${k + 1}.` } },
    { w: `fewer than ${k}`, s: `X < ${k}`, keep: x => x < k, slip: { keep: x => x <= k, mc: MC.strictBoundary, say: `“Fewer than ${k}” leaves ${k} out.` } },
    ...(lo === 0 ? [{ w: 'at least one', s: 'X \\ge 1', keep: (x: number) => x >= 1, slip: { keep: (x: number) => x === 1, mc: MC.atLeastExactly, say: '“At least one” is 1 or more: every value but 0. Quickest: 1 − P(X = 0).' } }] : []),
  ] : [
    { w: '', s: `X \\ge ${k}`, keep: x => x >= k, slip: { keep: x => x === k, mc: MC.atLeastExactly, say: `≥ means ${k} or more, not just ${k}.` } },
    { w: '', s: `X > ${k}`, keep: x => x > k, slip: { keep: x => x >= k, mc: MC.strictBoundary, say: `> leaves ${k} out.` } },
    { w: '', s: `X < ${k}`, keep: x => x < k, slip: { keep: x => x <= k, mc: MC.strictBoundary, say: `< leaves ${k} out.` } },
    { w: '', s: `X \\le ${k}`, keep: x => x <= k, slip: { keep: x => x === k, mc: MC.atLeastExactly, say: `≤ means ${k} or less: add every value up to ${k}.` } },
    ...(hi - lo >= 3 ? [{ w: '', s: `${lo + 1} \\le X < ${hi}`, keep: (x: number) => x >= lo + 1 && x < hi, slip: { keep: (x: number) => x >= lo + 1 && x <= hi, mc: MC.strictBoundary, say: `< ${hi} leaves ${hi} out.` } }] : []),
  ];
  const C = pick(R, conds);
  const sumOf = (keep: (x: number) => boolean) => xs.reduce((s, x, i) => s + (keep(x) ? D.ps[i]! : 0), 0);
  const v = sumOf(C.keep), sl = C.slip ? sumOf(C.slip.keep) : NaN;
  const idx = xs.map((x, i) => (C.keep(x) ? i : -1)).filter(i => i >= 0);
  const sym = C.s.replace(/\\ge/g, '≥').replace(/\\le/g, '≤').replace(/\\/g, '');
  const prompt = words ? `X is ${D.x}, with the distribution in the table. What is the probability that X is <b>${C.w}</b>? Give a decimal.` : `X is ${D.x}, with the distribution in the table. Find <b>P(${sym})</b> as a decimal.`;
  const kept = idx.map(i => xs[i]);
  const usesComp = C.w === 'at least one';
  return numItem({ id: `${family}-${n}`, family, prompt, board: `P(${C.s}) = \\,?`,
    solution: [`${words ? `“${C.w}” is ${sym}: ` : ''}the values that count are ${kept.join(', ')}.`, usesComp ? `1 − P(X = 0) = 1 − ${dec(D.ps[0]! / 100)} = ${ans(dec(v / 100))}.` : `Add their probabilities: ${idx.map(i => dec(D.ps[i]! / 100)).join(' + ')} = ${ans(dec(v / 100))}.`],
    picture: pics(table(xs, D.ps.map(q => dec(q / 100)), { hl: idx })) },
    v / 100, `Yes: P(${sym}) = ${dec(v / 100)}.`, C.slip && sl !== v ? [[sl / 100, C.slip.mc || undefined, C.slip.say]] : [], `List the values of X that satisfy ${sym}, then add their probabilities.`);
}
export const eventSymbols: Gen = (R, n) => eventGen(R, n, 'eventSymbols', false);
export const eventWords: Gen = (R, n) => eventGen(R, n, 'eventWords', true);

// ===================== path-probability =====================
const treeOf = (a: string, pa: string, b: string, pb: string): DPic => ({ kind: 'cond', pic: { kind: 'tree', first: [{ label: a, p: pa }, { label: b, p: pb }], second: [[{ label: a, p: pa }, { label: b, p: pb }], [{ label: a, p: pa }, { label: b, p: pb }]] } });
export const pathGuess: Gen = (R, n) => {
  const ch = pick(R, [3, 4, 5]), nq = pick(R, [2, 2, 3]);
  const seq = until(() => Array.from({ length: nq }, () => (R() < 0.5 ? 'R' : 'W')), s => nq === 2 || s.includes('R'));
  const kR = seq.filter(s => s === 'R').length, num = (ch - 1) ** (nq - kR), den = ch ** nq;
  const words = seq.map(s => (s === 'R' ? 'right' : 'wrong'));
  const fac = seq.map(s => (s === 'R' ? `1/${ch}` : `${ch - 1}/${ch}`));
  const sumN = seq.reduce((s, x) => s + (x === 'R' ? 1 : ch - 1), 0);
  const prompt = nq === 2 && R() < 0.5
    ? `Guess on two multiple-choice questions with ${word(ch)} choices each (one right answer). There are ${ch * ch} equally likely answer pairs. What is the probability of <b>${words.join(', then ')}</b>? (Check it against the product of the branch probabilities.)`
    : `Guess on ${word(nq)} multiple-choice questions with ${word(ch)} choices each; the guesses are independent. What is the probability of <b>${words.join(', then ')}</b>, in that order?`;
  return fracItem({ id: `pathGuess-${n}`, family: 'pathGuess', prompt, board: `P(\\text{${seq.join('')}}) = \\,?`,
    solution: [`Each guess is right with probability 1/${ch}, wrong with ${ch - 1}/${ch}.`, `Multiply along the path: ${fac.join(' × ')} = ${ans(ft(num, den))}.`],
    picture: nq === 2 ? pics(treeOf('R', fx(1, ch), 'W', fx(ch - 1, ch))) : undefined },
    num, den, `Yes: ${fac.join(' × ')} = ${ft(num, den)}.`, [[sumN, ch, MC.addStages, 'Along one path the branch probabilities multiply; adding them gives more than any single branch.'], [1, 2 ** nq, MC.equiprob, `There are ${2 ** nq} right/wrong patterns, but they are not equally likely: a wrong guess is ${ch - 1} times as likely as a right one.`]],
    'Multiply the branch probabilities along the path.');
};

export const pathSpinner: Gen = (R, n) => {
  const pr = pick(R, [0.2, 0.3, 0.4, 0.6, 0.7]), pb = Math.round((1 - pr) * 10) / 10, ns = pick(R, [2, 2, 3]);
  const seq = until(() => Array.from({ length: ns }, () => (R() < 0.5 ? 'red' : 'blue')), s => new Set(s).size === 2);
  const v = seq.reduce((p, s) => p * (s === 'red' ? pr : pb), 1), add = seq.reduce((p, s) => p + (s === 'red' ? pr : pb), 0);
  const fac = seq.map(s => dec(s === 'red' ? pr : pb));
  return numItem({ id: `pathSpinner-${n}`, family: 'pathSpinner', prompt: `A spinner lands on <b>red</b> with probability ${dec(pr)} and on <b>blue</b> with probability ${dec(pb)}. Spin it ${word(ns)} times. What is the probability of <b>${seq.join(', then ')}</b>, in that order? Give the exact decimal.`,
    board: `P(\\text{${seq.map(x => x[0]!.toUpperCase()).join('')}}) = \\,?`,
    solution: [`The spins are independent, so the probabilities along the path multiply.`, `${fac.join(' × ')} = ${ans(dec(v, 6))}.`],
    picture: pics({ kind: 'cond', pic: { kind: 'spinner', sectors: [{ label: 'red', w: pr, p: dec(pr) }, { label: 'blue', w: pb, p: dec(pb) }] } }) },
    Math.round(v * 1e6) / 1e6, `Yes: ${fac.join(' × ')} = ${dec(v, 6)}.`, [[Math.round(add * 1e6) / 1e6, MC.addStages, 'Adding the branch probabilities is not the chance of the whole path: multiply them.'], [Math.round(0.5 ** ns * 1e6) / 1e6, MC.equiprob, 'Red and blue are not equally likely on this spinner: use its probabilities.']],
    'Multiply the probability of each spin in the order.', 1e-6);
};

// ===================== multi-path-distribution =====================
export const multiGuess: Gen = (R, n) => {
  const ch = pick(R, [3, 4, 5]), nq = pick(R, [2, 3, 4]), k = int(R, 1, nq - 1);
  const ways = nCk(nq, k), onePathN = (ch - 1) ** (nq - k), den = ch ** nq;
  const pic: DPic | null = nq === 2 ? treeOf('R', fx(1, ch), 'W', fx(ch - 1, ch)) : nq === 3 ? { kind: 'count', pic: { kind: 'tree', levels: [1, 2, 3].map(i => ({ name: `Q${i}`, opts: ['R', 'W'] })), leaves: true } } : null;
  return fracItem({ id: `multiGuess-${n}`, family: 'multiGuess', prompt: `Guess on ${word(nq)} questions with ${word(ch)} choices each (independent guesses). X is the number right. What is <b>P(X = ${k})</b>?`, board: `P(X = ${k}) = \\,?`,
    solution: [`Paths with exactly ${k} right: ${ways} (the order of right and wrong can change).`, `Each such path: ${ft(onePathN, den)}.`, `P(X = ${k}) = ${ways} × ${ft(onePathN, den)} = ${ans(ft(ways * onePathN, den))}.`], picture: pic ? pics(pic) : undefined },
    ways * onePathN, den, `Yes: ${ways} paths, each ${ft(onePathN, den)}.`, [[onePathN, den, MC.omitsOrder, `That is one path. ${k} right can happen in ${ways} different orders: add them all.`], [1, nq + 1, MC.equiprob, `The ${nq + 1} values of X are not equally likely: add up the paths behind ${k}.`]],
    `Find every path with ${k} right, multiply along each, then add.`);
};

export const multiShots: Gen = (R, n) => {
  const ctx = pick(R, [
    { s: 'A basketball player makes each free throw with probability', it: 'free throws', x: 'the number made' },
    { s: 'A seed sprouts with probability', it: 'seeds planted', x: 'the number that sprout' },
    { s: 'A pitcher throws a strike with probability', it: 'pitches', x: 'the number of strikes' },
  ]);
  const p = pick(R, [0.6, 0.7, 0.8, 0.9]), q = Math.round((1 - p) * 10) / 10, nt = pick(R, [2, 3]), k = int(R, 1, nt - 1);
  const one = p ** k * q ** (nt - k), ways = nCk(nt, k), v = ways * one;
  const paths = Array.from({ length: 2 ** nt }, (_, i) => Array.from({ length: nt }, (_, j) => ((i >> (nt - 1 - j)) & 1 ? 'N' : 'Y')).join('')).filter(s => [...s].filter(c => c === 'Y').length === k);
  return numItem({ id: `multiShots-${n}`, family: 'multiShots', prompt: `${ctx.s} ${dec(p)}, independently. There are ${word(nt)} ${ctx.it}; X is ${ctx.x}. What is <b>P(X = ${k})</b>? Give the exact decimal.`, board: `P(X = ${k}) = \\,?`,
    solution: [`Paths with ${k} success${k === 1 ? '' : 'es'} (Y = yes, N = no): ${paths.join(', ')}.`, `Each has probability ${Array.from({ length: k }, () => dec(p)).concat(Array.from({ length: nt - k }, () => dec(q))).join(' × ')} = ${dec(one, 6)}.`, `P(X = ${k}) = ${ways} × ${dec(one, 6)} = ${ans(dec(v, 6))}.`],
    picture: nt === 2 ? pics(treeOf('Y', dec(p), 'N', dec(q))) : undefined },
    Math.round(v * 1e6) / 1e6, `Yes: ${ways} paths of ${dec(one, 6)} each.`, [[Math.round(one * 1e6) / 1e6, MC.omitsOrder, `That is one path. There are ${ways} orders with ${k} successes: add them.`]],
    'Add the probabilities of every path that gives this value.', 1e-6);
};
