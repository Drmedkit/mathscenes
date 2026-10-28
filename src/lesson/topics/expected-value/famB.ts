// famB.ts: stage 2 families of "Probability distributions and expected value": empirical distributions, the
// frequency-table mean, E(X) as a weighted mean and its computation, net payoff and fair games, what E(X) says about one
// trial, the long run (running means, no compensation), expected totals, and equal means of different distributions.
// Pure: no DOM.
import { type DPic, type TablePic } from './DistPic';
import { type Base, type DItem, type Gen, type Opt, CALC, MC, aD, ans, big, one, choice, compose, dec, noTie, fracItem, ft, fx, int, money, numItem, pick, shuffle, until, word } from './common';
import { evQ, possibleTotals, qr, runningMeans } from './ev';
import { table } from './famA';

const pics = (...p: DPic[]): { pics: DPic[]; weights?: number[] } => ({ pics: p });
const sumP = (xs: readonly number[], ps: readonly number[]) => xs.reduce((s, x, i) => s + x * ps[i]!, 0);
/** a distribution on distinct whole values with probabilities in hundredths (multiples of 5) */
function genDist(R: () => number, m: number, lo: number, hi: number): { xs: number[]; ps: number[] } {
  const pool = Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
  const xs = shuffle(R, pool).slice(0, m).sort((a, b) => a - b);
  return { xs, ps: compose(R, 20, m).map(x => x * 5) };
}
const modeOf = (xs: readonly number[], ps: readonly number[]): number | null => { const mx = Math.max(...ps); const at = xs.filter((_, i) => ps[i] === mx); return at.length === 1 ? at[0]! : null; };
const meanOf = (xs: readonly number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
const dtable = (xs: readonly number[], ps: readonly number[], o: { head?: string; prod?: boolean } = {}): TablePic => {
  const t = table(xs, ps.map(p => dec(p / 100)), { head: o.head });
  if (o.prod) { t.rows.push({ head: 'x \\cdot P(x)', cells: xs.map(() => null) }); t.reveal = { cells: [xs.map(() => null), xs.map(() => null), xs.map((x, i) => dec((x * ps[i]!) / 100).replace('−', '-'))] }; }
  return t;
};

// ===================== empirical-distribution =====================
const SURVEYS = [
  { what: 'people in the household', unit: 'households', xs: [1, 2, 3, 4, 5], w: [28, 35, 15, 13, 9] },
  { what: 'pets in the household', unit: 'households', xs: [0, 1, 2, 3, 4], w: [34, 30, 20, 10, 6] },
  { what: 'children under 18 in the family', unit: 'families', xs: [0, 1, 2, 3, 4], w: [40, 22, 24, 10, 4] },
  { what: 'TVs in the home', unit: 'homes', xs: [0, 1, 2, 3, 4], w: [6, 30, 32, 20, 12] },
];
function surveyCounts(R: () => number, w: readonly number[], N: number): number[] {
  return until(() => { const c = w.map(x => Math.max(1, Math.round((x / 100) * N * (0.8 + 0.4 * R())))); const s = c.reduce((a, b) => a + b, 0); c[1]! += N - s; return c; }, c => c.every(x => x >= 1));
}
export const empRel: Gen = (R, n) => {
  const S = pick(R, SURVEYS);
  const even = R() < 0.6;
  const N = even ? pick(R, [20, 40, 50, 100, 200, 250, 500]) : pick(R, [120, 150, 300, 600, 750, 900]);
  const cs = surveyCounts(R, S.w, N);
  const j = until(() => int(R, 0, S.xs.length - 1), i => even || noTie(cs[i]! / N, 3));
  const k = S.xs[j]!, c = cs[j]!;
  const exact = Number.isInteger((c * 10000) / N);
  const v = exact ? c / N : Math.round((c / N) * 1000) / 1000;
  const t: TablePic = { kind: 'table', rows: [{ head: 'x', cells: S.xs.map(String) }, { head: '\\text{count}', cells: cs.map(String) }], title: `${big(N)} ${S.unit} surveyed` };
  return numItem({ id: `empRel-${n}`, family: 'empRel', prompt: `A survey of ${big(N)} randomly chosen US ${S.unit} counted X = the number of ${S.what}. Use the survey to estimate <b>P(X = ${k})</b> for a randomly chosen ${one(S.unit)}. ${exact ? 'Give the exact decimal.' : 'Round to three decimal places.' + CALC}`,
    board: `P(X = ${k}) \\approx \\,?`,
    solution: [`Relative frequency = count ÷ total: ${c} ÷ ${big(N)}.`, `${c} ÷ ${big(N)} = ${exact ? ans(dec(v)) : `${dec(c / N, 5)}… ≈ ${ans(v.toFixed(3))}`}, an estimate for future ${S.unit}.`], picture: { pics: [t] } },
    v, `Yes: about ${dec(v * 100, 1)}% of such ${S.unit}.`, [[c, MC.countAsProb, `${c} is the count. A probability estimate divides it by all ${big(N)} ${S.unit}.`], [Math.round((c / S.xs.length) * 1000) / 1000, MC.overCategories, `Divide by the ${big(N)} ${S.unit} surveyed, not by the ${S.xs.length} values of X.`]],
    'Divide the count for this value by the total surveyed.', exact ? 1e-9 : 0.0005 + 1e-9);
};

export const empEstimate: Gen = (R, n) => {
  const S = pick(R, SURVEYS);
  const N = pick(R, [200, 250, 400, 500, 1000]);
  const cs = surveyCounts(R, S.w, N);
  const j = int(R, 1, S.xs.length - 2), k = S.xs[j]!, c = cs[j]!, rf = c / N;
  const t: TablePic = { kind: 'table', rows: [{ head: 'x', cells: S.xs.map(String) }, { head: '\\text{count}', cells: cs.map(String) }], title: `${big(N)} ${S.unit} surveyed` };
  return choice(R, { id: `empEstimate-${n}`, family: 'empEstimate', prompt: `A survey of ${big(N)} randomly chosen US ${S.unit} counted X = the number of ${S.what}. It found X = ${k} for ${c} of them. What does the relative frequency ${dec(rf)} tell you?`,
    board: `\\dfrac{${c}}{${N}} = ${dec(rf)}`, solution: [`${c} ÷ ${big(N)} = ${dec(rf)} is a sample proportion.`, `It estimates P(X = ${k}) for a ${one(S.unit)} chosen at random; another sample would give a slightly different value.`], picture: { pics: [t] } }, [
    { t: `An estimate of P(X = ${k}) for a randomly chosen US ${one(S.unit)}`, ok: true, say: 'Right: a sample gives an estimate; another sample would differ a little.' },
    { t: `Exactly ${dec(rf * 100, 2)}% of all US ${S.unit} have X = ${k}`, mc: MC.exactParam, say: `That is ${big(N)} ${S.unit}, not all of them: ${dec(rf)} is an estimate, not the exact share.` },
    { t: `P(X = ${k}) = ${c}`, mc: MC.countAsProb, say: `${c} is a count. A probability is between 0 and 1: ${c} out of ${big(N)}.` },
  ]);
};

// ===================== frequency-table-mean =====================
export const freqMean: Gen = (R, n) => {
  // realistic shapes: counts fall off for large values (US household and student surveys)
  const ctx = pick(R, [{ what: 'pets', who: 'households', x0: 0, w: [40, 30, 15, 8, 4, 3] }, { what: 'people', who: 'households', x0: 1, w: [28, 35, 15, 13, 6, 3] },
    { what: 'books read last month', who: 'students', x0: 0, w: [20, 25, 22, 15, 10, 8] }, { what: 'siblings', who: 'students', x0: 0, w: [20, 40, 25, 10, 5, 0] }]);
  const N = pick(R, [10, 20, 20, 100]);
  const it = until(() => {
    const m = int(R, 3, 5), xs = Array.from({ length: m }, (_, i) => ctx.x0 + i), w = ctx.w.slice(0, m);
    const cs = surveyCounts(R, w.map(x => (x * 100) / w.reduce((a, b) => a + b, 0)), N);
    return { xs, cs };
  }, o => { const mean = sumP(o.xs, o.cs) / N, un = meanOf(o.xs), ov = sumP(o.xs, o.cs) / o.xs.length; return Math.abs(mean - un) > 0.05 && Math.abs(mean - ov) > 0.05; });
  const tot = sumP(it.xs, it.cs), mean = tot / N;
  const t: TablePic = { kind: 'table', rows: [{ head: `\\text{${ctx.what.split(' ')[0]}}`, cells: it.xs.map(String) }, { head: `\\text{${ctx.who}}`, cells: it.cs.map(String) }] };
  return numItem({ id: `freqMean-${n}`, family: 'freqMean', prompt: `The table shows the number of ${ctx.what} for ${N} ${ctx.who}. What is the <b>mean</b> number of ${ctx.what} per ${one(ctx.who)}?`,
    board: `\\bar{x} = \\dfrac{\\sum (\\text{value} \\times \\text{count})}{${N}}`,
    solution: [`The table is a short way to write a list of ${N} numbers: each value repeated as often as its count.`, `Sum of value × count: ${it.xs.map((x, i) => `${x}·${it.cs[i]}`).join(' + ')} = ${tot}.`, `Mean = ${tot} ÷ ${N} = ${ans(dec(mean))}.`], picture: { pics: [t] } },
    mean, `Yes: ${tot} ${ctx.what} shared over ${N} ${ctx.who}.`, [[meanOf(it.xs), MC.unweighted, `That averages the ${it.xs.length} values as if each appeared once. Weight each value by its count.`], [tot / it.xs.length, MC.overCategories, `The total, ${tot}, belongs to ${N} ${ctx.who}: divide by ${N}, not by the ${it.xs.length} values.`]],
    'Multiply each value by its count, add, then divide by the total count.');
};

export const freqWhich: Gen = (R, n) => {
  const it = until(() => {
    const m = int(R, 2, 3), xs = shuffle(R, [0, 1, 2, 3, 4, 5, 6]).slice(0, m).sort((a, b) => a - b), cs = xs.map(() => int(R, 1, 4));
    return { xs, cs, N: cs.reduce((a, b) => a + b, 0) };
  }, o => { const mean = sumP(o.xs, o.cs) / o.N; return o.N >= 4 && o.N <= 8 && Math.abs(mean - meanOf(o.xs)) > 1e-9 && Math.abs(mean - sumP(o.xs, o.cs) / o.xs.length) > 1e-9 && o.cs.some(c => c > 1) && Math.abs(meanOf(o.cs) - mean) > 1e-9; });
  const list = it.xs.flatMap((x, i) => Array.from({ length: it.cs[i]! }, () => x));
  const prods = it.xs.map((x, i) => `${x}·${it.cs[i]}`).join(' + ');
  return choice(R, { id: `freqWhich-${n}`, family: 'freqWhich', prompt: `The list ${list.join(', ')} is regrouped as a table of values and counts. Which calculation gives the <b>mean of the list</b>?`,
    board: `${list.join(',\\ ')}`, solution: [`The list has ${it.N} numbers; their sum is ${prods} = ${sumP(it.xs, it.cs)}.`, `Mean = sum ÷ ${it.N}.`],
    picture: { pics: [{ kind: 'table', rows: [{ head: '\\text{value}', cells: it.xs.map(String) }, { head: '\\text{count}', cells: it.cs.map(String) }] }] } }, [
    { t: `(${prods}) ÷ ${it.N}`, ok: true, say: 'Right: every number of the list counts, and there are ' + it.N + ' of them.' },
    { t: `(${it.xs.join(' + ')}) ÷ ${it.xs.length}`, mc: MC.unweighted, say: 'That treats each value as if it appeared once. Repeated values must count every time.' },
    { t: `(${prods}) ÷ ${it.xs.length}`, mc: MC.overCategories, say: `The sum is right, but it belongs to ${it.N} numbers, not ${it.xs.length} values.` },
    { t: `(${it.cs.join(' + ')}) ÷ ${it.xs.length}`, say: 'That averages the counts: how often values appear, not the values themselves.' },
  ]);
};

// ===================== ev-weighted-mean =====================
// games whose rules can give any distribution of points (a designer sets the sectors / slots)
const GAMES = [
  { what: 'the points scored on one spin of a prize wheel', unit: 'points', trial: 'spins' },
  { what: 'the score on one turn of a board-game spinner', unit: 'points', trial: 'turns' },
  { what: 'the number of tickets won on one play of an arcade game', unit: 'tickets', trial: 'plays' },
  { what: 'the points for one throw at a ring-toss booth', unit: 'points', trial: 'throws' },
];
export const evHundred: Gen = (R, n) => {
  const G = pick(R, GAMES), T = pick(R, [100, 1000]);
  const d = until(() => genDist(R, int(R, 3, 4), 0, 8), o => { const e = sumP(o.xs, o.ps) / 100, md = modeOf(o.xs, o.ps); return md !== null && Math.abs(e - md) > 0.01 && Math.abs(e - meanOf(o.xs)) > 0.01; });
  const counts = d.ps.map(p => (p * T) / 100), tot = sumP(d.xs, counts), e = tot / T;
  const askTotal = R() < 0.5;
  const t = dtable(d.xs, d.ps);
  const sol = [`In ${big(T)} ${G.trial} in exactly these proportions: ${d.xs.map((x, i) => `${big(counts[i]!)} × ${x}`).join(', ')}.`, `Total: ${d.xs.map((x, i) => `${x}·${big(counts[i]!)}`).join(' + ')} = ${big(tot)} ${G.unit}.`];
  if (askTotal) return numItem({ id: `evHundred-${n}`, family: 'evHundred', prompt: `X is ${G.what}, with the distribution in the table. Picture <b>${big(T)} ${G.trial}</b> that come out in exactly these proportions. What is the <b>total</b> of X over all ${big(T)}?`, board: `\\text{total over } ${big(T).replace(',', '{,}')} = \\,?`,
    solution: [sol[0]!, `Total: ${d.xs.map((x, i) => `${x}·${big(counts[i]!)}`).join(' + ')} = ${ans(big(tot))} ${G.unit}.`], picture: pics(t) },
    tot, `Yes: ${big(tot)} ${G.unit}, which is ${dec(e)} per ${one(G.trial)}.`, [[meanOf(d.xs) * T, MC.unweighted, 'That treats every value as equally common. Use the proportions in the table.'], [(modeOf(d.xs, d.ps) ?? 0) * T, MC.mode, 'Not every trial gives the most likely value: use all the values in their proportions.']], `Find how many of the ${big(T)} give each value, then add value × count.`);
  return numItem({ id: `evHundred-${n}`, family: 'evHundred', prompt: `X is ${G.what}, with the distribution in the table. Picture <b>${big(T)} ${G.trial}</b> that come out in exactly these proportions. What is the <b>average</b> of X per ${one(G.trial)}? That average is E(X).`, board: `E(X) = \\dfrac{\\text{total}}{${big(T).replace(',', '{,}')}}`,
    solution: [...sol, `Average: ${big(tot)} ÷ ${big(T)} = ${ans(dec(e))} = E(X).`], picture: pics(t) },
    e, `Yes: E(X) = ${dec(e)}, the probability-weighted mean.`, [[meanOf(d.xs), MC.unweighted, 'That averages the values as if each were equally likely. Weight each by its probability.'], [modeOf(d.xs, d.ps) ?? NaN, MC.mode, 'That is the most likely value. E(X) is the mean of all the trials.']], 'Count each value’s share of the trials, add value × count, divide by the number of trials.');
};

export const evNotMode: Gen = (R, n) => {
  const G = pick(R, GAMES);
  const d = until(() => genDist(R, int(R, 3, 4), 0, 9), o => { const e = sumP(o.xs, o.ps) / 100, md = modeOf(o.xs, o.ps), un = meanOf(o.xs); return md !== null && Math.abs(e - md) > 0.01 && Math.abs(e - un) > 0.01 && Math.abs(un - md) > 0.01 && Math.abs(un - Math.round(un * 100) / 100) < 1e-9; });
  const e = sumP(d.xs, d.ps) / 100, md = modeOf(d.xs, d.ps)!, un = meanOf(d.xs);
  return choice(R, { id: `evNotMode-${n}`, family: 'evNotMode', prompt: `X is ${G.what}, with the distribution in the table. Which number is <b>E(X)</b>, the mean of the distribution?`, board: `E(X) = \\mu_X = \\,?`,
    solution: [`E(X) weights each value by its probability: ${d.xs.map((x, i) => `${x}(${dec(d.ps[i]! / 100)})`).join(' + ')}.`, `E(X) = ${dec(e)}.`], picture: pics(dtable(d.xs, d.ps)) }, [
    { t: dec(e), ok: true, key: e, say: 'Right: the probability-weighted mean.' },
    { t: dec(md), key: md, mc: MC.mode, say: `${md} is the most likely value. E(X) weights every value by its probability.` },
    { t: dec(un), key: un, mc: MC.unweighted, say: `${dec(un)} averages the values as if each were equally likely.` },
    { t: '1', key: 1, mc: MC.sumsP, say: 'The probabilities add to 1, for every distribution. E(X) adds x × P(x).' },
  ]);
};

// ===================== compute-ev =====================
export const evTable: Gen = (R, n) => {
  const G = pick(R, GAMES);
  const d = until(() => genDist(R, int(R, 2, 6), 0, 10), o => { const e = sumP(o.xs, o.ps) / 100; return !Number.isInteger(e) && Math.abs(e - meanOf(o.xs)) > 0.01 && Math.abs(e - sumP(o.xs, o.ps) / 100 / o.xs.length) > 0.01; });
  const e = sumP(d.xs, d.ps) / 100;
  return numItem({ id: `evTable-${n}`, family: 'evTable', prompt: `X is ${G.what}, with the distribution in the table. Calculate <b>E(X)</b>.`, board: `E(X) = \\textstyle\\sum x \\cdot P(x)`,
    solution: [`Products x·P(x): ${d.xs.map((x, i) => dec((x * d.ps[i]!) / 100)).join(', ')}.`, `E(X) = ${d.xs.map((x, i) => dec((x * d.ps[i]!) / 100)).join(' + ')} = ${ans(dec(e))} ${G.unit}.`], picture: pics(dtable(d.xs, d.ps, { prod: true })) },
    e, `Yes: E(X) = ${dec(e)} ${G.unit}: not a value X can take, and that is fine.`,
    [[1, MC.sumsP, 'The P(x) column always adds to 1. E(X) adds the products x·P(x).'], [meanOf(d.xs), MC.unweighted, 'That gives every value the same weight. Multiply each value by its probability.'], [e / d.xs.length, MC.overCategories, `The products already carry the weights: add them and stop. No dividing by ${d.xs.length}.`], [Math.round(e), MC.roundsEv, `E(X) is an average, so it need not be a whole number: keep ${dec(e)}.`]],
    'Multiply each value by its probability, then add the products.');
};

export const evFrac: Gen = (R, n) => {
  const v = int(R, 0, 2);
  let xs: number[], nums: number[], den: number, what: string, pic: DPic;
  if (v === 0) {
    const sides = pick(R, [4, 6, 8]);
    xs = Array.from({ length: sides }, (_, i) => i + 1); nums = xs.map(() => 1); den = sides;
    what = `X is the number on one roll of a fair ${sides}-sided die (faces 1 to ${sides}).`;
    pic = { kind: 'bars', xs, ps: xs.map(() => 1 / sides), labs: xs.map(() => fx(1, sides)), axis: { min: 1, max: sides, step: 1, name: 'x' } };
  } else {
    den = pick(R, [6, 8, 10, 12]);
    const m = int(R, 3, 4);
    const d = until(() => ({ xs: shuffle(R, [0, 1, 2, 3, 4, 5, 6, 8, 10]).slice(0, m).sort((a, b) => a - b), nums: compose(R, den, m) }), o => { const e = qr(sumP(o.xs, o.nums), den); return e[1] !== 1 && Math.abs(sumP(o.xs, o.nums) / den - meanOf(o.xs)) > 1e-9; });
    xs = d.xs; nums = d.nums;
    what = `A spinner has ${den} equal sectors. X is the number of points on the sector it lands on: ${xs.map((x, i) => `${nums[i]} sector${nums[i] === 1 ? '' : 's'} ${nums[i] === 1 ? 'shows' : 'show'} ${x}`).join(', ')}.`;
    pic = { kind: 'table', rows: [{ head: 'x', cells: xs.map(String) }, { head: 'P(X = x)', cells: nums.map(c => fx(c, den)) }] };
  }
  const tot = sumP(xs, nums), [en, ed] = qr(tot, den);
  return fracItem({ id: `evFrac-${n}`, family: 'evFrac', prompt: `${what} Find <b>E(X)</b> as a fraction or mixed number.`, board: `E(X) = \\textstyle\\sum x \\cdot P(x)`,
    solution: [`E(X) = ${xs.map((x, i) => `${x}·${ft(nums[i]!, den)}`).join(' + ')}.`, `= ${tot}/${den} = ${ans(en % ed === 0 ? String(en / ed) : en > ed ? `${Math.floor(en / ed)} ${en % ed}/${ed}` : `${en}/${ed}`)}.`], picture: pics(pic) },
    tot, den, `Yes: E(X) = ${ft(tot, den)}.`, [[xs.reduce((a, b) => a + b, 0), xs.length, MC.unweighted, 'That averages the values as if each were equally likely. Weight each by its probability.'], [1, 1, MC.sumsP, 'The probabilities add to 1. E(X) adds x times P(x).']],
    'Multiply each value by its probability and add.');
};

// ===================== net-payoff-ev =====================
export const netRaffle: Gen = (R, n) => {
  const tiers = R() < 0.5 ? 1 : 2;
  const it = until(() => {
    const N = pick(R, [200, 250, 500, 1000]), c = pick(R, [1, 2, 5]);
    const big1 = pick(R, [100, 150, 200, 250, 300, 400, 500]);
    const p2 = tiers === 2 ? pick(R, [10, 20, 25, 50]) : 0, n2 = tiers === 2 ? pick(R, [2, 4, 5]) : 0;
    return { N, c, big1, p2, n2 };
  }, o => { const prizes = o.big1 + o.p2 * o.n2; return Number.isInteger((prizes * 100) / o.N) && prizes <= o.N * o.c * 0.6; });
  const { N, c } = it;
  const prizes = it.big1 + it.p2 * it.n2, e = prizes / N - c;
  const desc = tiers === 1 ? `one prize of <b>$${it.big1}</b>` : `one prize of <b>$${it.big1}</b> and ${word(it.n2)} prizes of <b>$${it.p2}</b>`;
  const rows: TablePic = { kind: 'table', rows: [{ head: '\\text{net gain}', cells: [`${it.big1 - c}`, ...(tiers === 2 ? [`${it.p2 - c}`] : []), `-${c}`] }, { head: 'P', cells: [fx(1, N), ...(tiers === 2 ? [fx(it.n2, N)] : []), fx(N - 1 - it.n2, N)] }] };
  return numItem({ id: `netRaffle-${n}`, family: 'netRaffle', prompt: `A school raffle sells all <b>${big(N)} tickets at $${c}</b> each and draws ${desc} (one prize per ticket at most). X is the net gain of one ticket: prize minus the $${c} it cost. What is <b>E(X)</b> in dollars, to the nearest cent?`,
    board: `E(X) = \\textstyle\\sum (\\text{net}) \\cdot P`,
    solution: [`Net gains: $${it.big1 - c}${tiers === 2 ? `, $${it.p2 - c}` : ''}, or −$${c} for a ticket that wins nothing.`, `E(X) = ${it.big1 - c}·(1/${N})${tiers === 2 ? ` + ${it.p2 - c}·(${it.n2}/${N})` : ''} + (−${c})·(${N - 1 - it.n2}/${N}).`, `= ${money(prizes / N)} − ${money(c)} = ${ans(money(e))} per ticket.`], picture: pics(rows) },
    Math.round(e * 100) / 100, `Yes: on average a ticket loses ${money(-e)}.`, [[prizes / N, MC.revenue, `${money(prizes / N)} is the expected prize. The ticket cost $${c}: take it off.`], [Math.round((e - c) * 100) / 100, MC.costTwice, 'The net gains already include the ticket price. Subtracting it again counts it twice.']],
    'Work out each net gain (prize − cost), multiply by its probability, add.', 0.005);
};

export const netCarnival: Gen = (R, n) => {
  const c = pick(R, [1, 2, 3, 5]);
  const it = until(() => {
    const pa = pick(R, [5, 10, 15, 20]), pb = pick(R, [20, 25, 30, 40]);
    const a = pick(R, [5, 10, 15, 20, 25]), b = pick(R, [2, 3, 4, 5]);
    return { pa, pb, a, b };
  }, o => o.a > o.b && o.b >= c && o.pa + o.pb < 100 && Math.abs((o.a * o.pa + o.b * o.pb) / 100 - c) > 0.04);
  const p0 = 100 - it.pa - it.pb;
  const eGross = (it.a * it.pa + it.b * it.pb) / 100, e = eGross - c;
  const net = R() < 0.5;
  const t: TablePic = net
    ? { kind: 'table', rows: [{ head: '\\text{net gain}', cells: [`${it.a - c}`, `${it.b - c}`, `-${c}`] }, { head: 'P', cells: [dec(it.pa / 100), dec(it.pb / 100), dec(p0 / 100)] }] }
    : { kind: 'table', rows: [{ head: '\\text{prize}', cells: [`${it.a}`, `${it.b}`, '0'] }, { head: 'P', cells: [dec(it.pa / 100), dec(it.pb / 100), dec(p0 / 100)] }] };
  const prompt = net
    ? `A carnival game costs <b>$${c}</b> to play. The table lists the <b>net gain</b> of one play (it already takes off the $${c}) with its probability. What is the expected net gain per play, in dollars?`
    : `A carnival game costs <b>$${c}</b> to play. The table lists the <b>prize</b> of one play with its probability. What is the expected net gain per play (prize minus the $${c} cost), in dollars?`;
  const sol = net
    ? [`The table is already net: E = ${it.a - c}(${dec(it.pa / 100)}) + ${it.b - c}(${dec(it.pb / 100)}) + (−${c})(${dec(p0 / 100)}).`, `E = ${ans(money(e))} per play.`]
    : [`Expected prize: ${it.a}(${dec(it.pa / 100)}) + ${it.b}(${dec(it.pb / 100)}) + 0 = ${money(eGross)}.`, `Expected net gain: ${money(eGross)} − $${c} = ${ans(money(e))} per play.`];
  const cands: [number, string | undefined, string][] = net
    ? [[Math.round((e - c) * 100) / 100, MC.costTwice, `The net gains already include the $${c}. Don’t subtract it again.`]]
    : [[Math.round(eGross * 100) / 100, MC.revenue, `${money(eGross)} is the expected prize. Every play costs $${c}: take it off.`]];
  return numItem({ id: `netCarnival-${n}`, family: 'netCarnival', prompt, board: `E(\\text{net}) = \\,?`, solution: sol, picture: pics(t) },
    Math.round(e * 100) / 100, `Yes: ${money(e)} per play on average.`, cands, net ? 'Multiply each net gain by its probability and add.' : 'Find the expected prize, then subtract the cost of a play.', 0.005);
};

export const fairGame: Gen = (R, n) => {
  const kind = pick(R, ['fair', 'player', 'house'] as const);
  const it = until(() => {
    const den = pick(R, [2, 4, 5, 6, 8, 10]), k = int(R, 1, den - 1), cost = pick(R, [1, 2, 3, 4, 5]);
    const fairPrize = (cost * den) / k;
    const prize = kind === 'fair' ? fairPrize : kind === 'player' ? fairPrize + pick(R, [1, 2, 3]) : fairPrize - pick(R, [1, 2, 3]);
    return { den, k, cost, prize };
  }, o => Number.isInteger(o.prize) && o.prize > o.cost && o.prize <= 40 && (kind === 'fair' || Math.abs(o.prize * o.k / o.den - o.cost) >= 0.1));
  const e = (it.prize * it.k) / it.den - it.cost;
  const half = it.k * 2 === it.den;
  const opts: Opt[] = [
    { t: 'Fair: the expected net gain is $0', ok: kind === 'fair', mc: MC.fairMisread, say: kind === 'fair' ? 'Right: over many plays neither side comes out ahead.' : `The expected net gain is ${money(e)}, not $0.` },
    { t: 'Favors the player: the expected net gain is positive', ok: kind === 'player', mc: MC.fairMisread, say: kind === 'player' ? `Right: E = ${money(e)} per play for the player.` : `Work it out: E = ${money(e)} per play.` },
    { t: 'Favors the booth: the expected net gain is negative', ok: kind === 'house', mc: MC.fairMisread, say: kind === 'house' ? `Right: the player loses ${money(-e)} per play on average.` : `Work it out: E = ${money(e)} per play.` },
  ];
  if (kind === 'fair' && !half) opts.push({ t: 'Not fair: you win less than half the time', mc: MC.fairHalf, say: 'Fair is about money, not about winning half the time: a rare win can pay enough to balance the losses.' });
  if (kind !== 'fair' && half) opts.push({ t: 'Fair: you win exactly half the time', mc: MC.fairHalf, say: 'Winning half the time is not enough: the prize and the cost decide. Check the expected net gain.' });
  return choice(R, { id: `fairGame-${n}`, family: 'fairGame', prompt: `A booth charges <b>$${it.cost}</b> per play. You win ${aD(it.prize)} <b>$${it.prize}</b> prize with probability ${fx(it.k, it.den).replace(/\\tfrac\{(\d+)\}\{(\d+)\}/, '$1/$2')}, and nothing otherwise. A game is fair when the expected net gain is $0. Is this game fair?`,
    board: `E(\\text{net}) = ${it.prize} \\cdot ${fx(it.k, it.den)} - ${it.cost}`,
    solution: [`Expected prize: $${it.prize} × ${ft(it.k, it.den)} = ${money((it.prize * it.k) / it.den)}.`, `Expected net gain: ${money((it.prize * it.k) / it.den)} − $${it.cost} = ${money(e)}.`] }, opts, true);
};

// ===================== ev-single-outcome =====================
export const evPossible: Gen = (R, n) => {
  const kind = pick(R, ['impossible', 'possible', 'certain'] as const);
  let what: string, e: number, pic: DPic;
  if (kind === 'impossible') {
    const v = int(R, 0, 2);
    if (v === 0) { const s = pick(R, [4, 6, 8]); e = (s + 1) / 2; what = `X is the number on one roll of a fair ${s}-sided die (1 to ${s}), so E(X) = ${dec(e)}.`; const xs = Array.from({ length: s }, (_, i) => i + 1); pic = { kind: 'bars', xs, ps: xs.map(() => 1 / s), labs: xs.map(() => fx(1, s)), axis: { min: 1, max: s, step: 1, name: 'x' } }; }
    else if (v === 1) { e = 1.5; what = 'X is the number of heads in three tosses of a fair coin, so E(X) = 1.5.'; pic = { kind: 'bars', xs: [0, 1, 2, 3], ps: [1 / 8, 3 / 8, 3 / 8, 1 / 8], labs: ['\\tfrac{1}{8}', '\\tfrac{3}{8}', '\\tfrac{3}{8}', '\\tfrac{1}{8}'], axis: { min: 0, max: 3, step: 1, name: 'x' } }; }
    else { const a = pick(R, [5, 10]), p = pick(R, [20, 30, 40]); e = (a * p) / 100; what = `X is ${a} with probability ${dec(p / 100)} and 0 otherwise, so E(X) = ${dec(e)}.`; pic = { kind: 'bars', xs: [0, a], ps: [1 - p / 100, p / 100], labs: [dec(1 - p / 100), dec(p / 100)], axis: { min: 0, max: a, step: a === 10 ? 2 : 1, name: 'x' } }; }
  } else if (kind === 'possible') {
    const d = until(() => genDist(R, 3, 0, 6), o => { const ee = sumP(o.xs, o.ps) / 100; return Number.isInteger(ee) && o.xs.includes(ee); });
    e = sumP(d.xs, d.ps) / 100;
    what = `X has the distribution in the graph, so E(X) = ${e}.`;
    pic = { kind: 'bars', xs: d.xs, ps: d.ps.map(p => p / 100), labs: d.ps.map(p => dec(p / 100)), axis: { min: 0, max: 6, step: 1, name: 'x' } };
  } else {
    const a = pick(R, [1, 2, 5]), cnt = pick(R, [20, 30, 50]);
    e = a;
    what = `A fundraiser gives every one of its ${cnt} visitors ${aD(a)} $${a} coupon, no drawing. X is the coupon value a visitor gets, so E(X) = ${a}.`;
    pic = { kind: 'table', rows: [{ head: 'x', cells: [String(a)] }, { head: 'P(X = x)', cells: ['1'] }] };
  }
  const opts: Opt[] = [
    { t: `Impossible: X never equals ${dec(e)}`, ok: kind === 'impossible', mc: kind === 'certain' ? MC.deniesCertain : undefined, say: kind === 'impossible' ? `Right: ${dec(e)} is not a value X can take. It is the long-run average.` : `${dec(e)} is one of the values X can take.` },
    { t: `Possible, but not certain`, ok: kind === 'possible', mc: kind === 'certain' ? MC.deniesCertain : MC.guaranteed, say: kind === 'possible' ? `Right: X = ${dec(e)} can happen, and so can other values.` : kind === 'certain' ? 'Here X has only one value: it happens every time, so E(X) is certain.' : `${dec(e)} is not a value X can take: X never lands on it.` },
    { t: `Certain: X always equals ${dec(e)}`, ok: kind === 'certain', mc: MC.guaranteed, say: kind === 'certain' ? 'Right: a variable with one value is constant, so its mean is guaranteed.' : 'E(X) is an average over many trials, not a promise about one trial.' },
  ];
  return choice(R, { id: `evPossible-${n}`, family: 'evPossible', prompt: `${what} On <b>one</b> trial, is X = ${dec(e)}…`, board: `E(X) = ${dec(e)}`,
    solution: kind === 'impossible' ? [`X can only take the values in the picture.`, `${dec(e)} is not one of them: it is the balance point, the long-run average.`] : kind === 'possible' ? [`${dec(e)} is one of the values X can take.`, `But X can also take other values, so it is not certain.`] : [`X takes one value only, with probability 1.`, `So X = ${dec(e)} on every trial.`], picture: pics(pic) }, opts, true);
};

export const evOnePlay: Gen = (R, n) => {
  const p = pick(R, [10, 20, 25]), c = pick(R, [2, 3, 5]);
  const prize = until(() => pick(R, [5, 8, 10, 12, 15]), a => a > c && (a * p) / 100 < c);
  const e = (prize * p) / 100 - c, name = pick(R, ['Jay', 'Mia', 'Omar', 'Rita']);
  return choice(R, { id: `evOnePlay-${n}`, family: 'evOnePlay', prompt: `A game costs $${c}; it pays ${aD(prize)} $${prize} prize with probability ${dec(p / 100)}, otherwise nothing. The expected net gain is ${money(e)} per play. ${name} plays once. Which statement is true?`,
    board: `E(\\text{net}) = ${money(e).replace('−', '-').replace('$', '\\$')}`,
    solution: [`One play ends at +$${prize - c} or at −$${c}: never at ${money(e)}.`, `${money(e)} is the average per play over many plays.`] }, [
    { t: `${name} ends up +$${prize - c} or −$${c}; ${money(e)} is the average over many plays`, ok: true, say: 'Right: one play gives one outcome; E is the long-run mean.' },
    { t: `${name} will lose exactly ${money(-e)}`, mc: MC.guaranteed, say: `No single play loses ${money(-e)}: the only outcomes are +$${prize - c} and −$${c}.` },
    { t: `${name} can’t win: the expected value is negative`, mc: MC.singleJudges, say: `${name} wins with probability ${dec(p / 100)}. A negative E says what happens on average, not on this play.` },
    { t: `${money(e)} is the most likely result of one play`, mc: MC.mode, say: `The most likely result is −$${c}. ${money(e)} is the mean, not the mode.` },
  ]);
};

// ===================== long-run-average =====================
const CHECKS = [5, 50, 500, 5000];
const PTS = [1, 2, 3, 5, 8, 12, 20, 30, 50, 80, 120, 200, 300, 500, 800, 1200, 2000, 3000, 5000];
export const runRead: Gen = (R, n) => {
  // the running mean of the PRIZE per play (never negative, so the plot's axis stays at the bottom); the cost is a
  // level line: above it the player is ahead so far, below it behind
  const g = until(() => {
    const c = pick(R, [1, 2]), prize = pick(R, [3, 4, 5, 6]), pw = pick(R, [20, 25, 30]);
    const ep = (prize * pw) / 100;
    const seed = int(R, 1, 1e6);
    const ms = runningMeans(((s: number) => { let t = s; return () => { t = (t * 1664525 + 1013904223) >>> 0; return t / 4294967296; }; })(seed), [prize, 0], [pw / 100, 1 - pw / 100], PTS);
    return { c, prize, pw, ep, ms };
  }, o => o.ep < o.c && o.ep > o.c - 1 && o.ms[3]! > o.c && Math.abs(Math.round(o.ms[o.ms.length - 1]! * 100) / 100 - o.ep) >= 0.01 - 1e-9 && Math.abs(o.ms[o.ms.length - 1]! - o.ep) < 0.08
    && o.ms.some((m, i) => i > 3 && Math.abs(m - o.ep) > Math.abs(o.ms[i - 1]! - o.ep) + 1e-9));
  const pts = PTS.map((p, i) => [p, g.ms[i]!] as [number, number]);
  const marks = CHECKS.map(cp => [cp, g.ms[PTS.indexOf(cp)]!] as [number, number]);
  const ymax = Math.ceil(Math.max(...g.ms) + 0.3);
  const pic: DPic = { kind: 'run', pts, marks, ev: g.ep, cost: g.c, y: { min: 0, max: ymax, step: ymax > 8 ? 2 : 1 }, yName: 'Average prize per play ($)' };
  const sum = marks.map(([cp, m]) => `${big(cp)} plays: ${money(m)}`).join('; ');
  return choice(R, { id: `runRead-${n}`, family: 'runRead', prompt: `A game costs $${g.c} and pays ${aD(g.prize)} $${g.prize} prize with probability ${dec(g.pw / 100)}, so the expected prize is ${money(g.ep)} per play. A simulation plays it 5,000 times; the average prize per play so far was: ${sum}. Which statement fits?`,
    board: `E(\\text{prize}) = ${money(g.ep).replace('$', '\\$')}`,
    solution: [`Early averages jump around: after 5 plays the average prize was above the $${g.c} cost, so the player was ahead.`, `With more plays the average prize settles near ${money(g.ep)}, below the cost, though it still wiggles.`], picture: pics(pic) }, [
    { t: `The average prize per play settles near ${money(g.ep)}, below the $${g.c} cost`, ok: true, say: 'Right: the running mean stabilizes near E, without any guarantee for a short run.' },
    { t: 'The player was ahead after 5 plays, so the game favors the player', mc: MC.singleJudges, say: `Five plays are far too few to judge a game. The long run settles below the $${g.c} cost: a loss per play.` },
    { t: `Every extra play moved the average closer to ${money(g.ep)}`, mc: MC.convergence, say: 'Look at the curve: it sometimes moves away from E before coming back. Settling is a long-run pattern, not a step-by-step rule.' },
    { t: `After 5,000 plays the average is exactly ${money(g.ep)}`, mc: MC.guaranteed, say: `It is close (${money(marks[3]![1])}) but not exact. No number of plays guarantees hitting E exactly.` },
  ]);
};

export const runCheck: Gen = (R, n) => {
  const name = pick(R, ['Ana', 'Ty', 'Noor', 'Eli']);
  const e = -pick(R, [0.25, 0.5, 0.75, 1]);
  const plays = pick(R, [4, 5, 6, 8]), ahead = pick(R, [3, 4, 6, 7]);
  return choice(R, { id: `runCheck-${n}`, family: 'runCheck', prompt: `A game has an expected net gain of ${money(e)} per play. ${name} plays it ${word(plays)} times and is <b>ahead by $${ahead}</b>. Which conclusion is right?`,
    board: `E(\\text{net}) = ${money(e).replace('−', '-').replace('$', '\\$')}`,
    solution: [`A few plays can come out ahead even when E is negative.`, `Over many plays the average per play tends toward ${money(e)}.`] }, [
    { t: `A short run can end ahead; over many plays the average per play tends toward ${money(e)}`, ok: true, say: 'Right: E describes the long run, not a handful of plays.' },
    { t: `The game must favor players: ${name} is ahead`, mc: MC.singleJudges, say: `${word(plays)} plays can’t overturn the expected value. One short result does not judge the model.` },
    { t: `${name} should have lost exactly ${money(-e * plays)} by now`, mc: MC.guaranteed, say: `${money(e * plays)} is the expected total, not a guarantee for ${word(plays)} plays.` },
    { t: `Each further play will bring ${name}’s average closer to ${money(e)}`, mc: MC.convergence, say: 'Single plays can move the average either way. It settles only over many plays.' },
  ]);
};

// ===================== no-compensation =====================
export const streakNext: Gen = (R, n) => {
  const v = int(R, 0, 2), km = int(R, 3, 5);
  const ctx = v === 0 ? { s: `A fair coin has landed <b>heads ${word(int(R, 5, 8))} times in a row</b>.`, ev: 'tails on the next toss', p: '1/2', pv: 0.5, b: `\\text{H H H H H} \\ldots \\to\\ P(\\text{T}) = \\,?` }
    : v === 1 ? { s: `A fair number cube has not shown a 6 in the last <b>${int(R, 12, 20)} rolls</b>.`, ev: 'a 6 on the next roll', p: '1/6', pv: 1 / 6, b: `\\text{no 6 lately} \\to\\ P(6) = \\,?` }
      : { s: `A free-throw shooter who makes 70% of her shots, independently, has <b>missed ${word(km)} in a row</b>.`, ev: 'a make on her next shot', p: '0.7', pv: 0.7, b: `\\text{${Array.from({ length: km }, () => 'miss').join(', ')}} \\to\\ P(\\text{make}) = \\,?` };
  return choice(R, { id: `streakNext-${n}`, family: 'streakNext', prompt: `${ctx.s} What is the probability of ${ctx.ev}?`, board: ctx.b,
    solution: ['The trials are independent: the coin, cube or shooter has no memory of the streak.', `So the probability is unchanged: ${ctx.p}.`] }, [
    { t: `${ctx.p}, the same as always`, ok: true, say: 'Right: independent trials do not remember streaks.' },
    { t: `More than ${ctx.p}: it is due`, mc: MC.gambler, say: 'Nothing in the trials pushes toward balancing out. The streak does not change the next probability.' },
    { t: `Less than ${ctx.p}: the streak shows a pattern`, say: `With independent trials and a fixed probability, the chance stays ${ctx.p}.` },
  ], true);
};

export const streakCount: Gen = (R, n) => {
  const v = R() < 0.6;
  const M = pick(R, [10, 20]), N = v ? pick(R, [90, 180, 990]) : pick(R, [60, 120, 600]);
  const p = v ? 0.5 : 1 / 6;
  const H = v ? int(R, Math.round(M * 0.7), M - 1) : int(R, 0, 1);
  const e = N * p, comp = (M + N) * p - H;
  return numItem({ id: `streakCount-${n}`, family: 'streakCount', prompt: v
    ? `A fair coin landed heads ${H} times in its first ${M} tosses. It will be tossed ${N} more times. What is the expected number of heads in those <b>next ${N}</b> tosses?`
    : `A fair number cube showed ${H === 0 ? 'no' : 'only one'} 6 in its first ${M} rolls. It will be rolled ${N} more times. What is the expected number of 6s in those <b>next ${N}</b> rolls?`,
    board: `E = n \\cdot p = ${N} \\cdot ${v ? '\\tfrac{1}{2}' : '\\tfrac{1}{6}'}`,
    solution: ['The next tosses are independent of the first ones: no catching up.', `Expected count = ${N} × ${v ? '1/2' : '1/6'} = ${ans(dec(e))}.`] },
    e, `Yes: ${dec(e)}. The early ${v ? 'surplus' : 'shortfall'} is not paid back; it just gets diluted.`, [[comp, MC.gambler, `That makes the next ${N} make up for the first ${M}. Independent ${v ? 'tosses' : 'rolls'} don’t compensate.`]],
    'Multiply the number of new trials by the probability on each.');
};

// ===================== expected-total =====================
export const totalN: Gen = (R, n) => {
  const v = int(R, 0, 2);
  if (v === 0) {
    const d = { xs: [1, 2, 3, 4, 5], ps: pick(R, [[25, 35, 20, 15, 5], [30, 30, 20, 15, 5], [25, 35, 15, 15, 10], [30, 35, 15, 10, 10], [20, 35, 20, 15, 10], [30, 35, 20, 10, 5]]) };
    const e = sumP(d.xs, d.ps) / 100, T = 100;
    return numItem({ id: `totalN-${n}`, family: 'totalN', prompt: `X is the number of people in a randomly chosen household, with the distribution in the table. In a sample of <b>${T} households</b>, how many people do you expect in total?`, board: `E(\\text{total}) = ${T} \\cdot E(X)`,
      solution: [`E(X) = ${d.xs.map((x, i) => `${x}(${dec(d.ps[i]! / 100)})`).join(' + ')} = ${dec(e)}.`, `Expected total: ${T} × ${dec(e)} = ${ans(dec(T * e))} people.`], picture: pics(dtable(d.xs, d.ps)) },
      T * e, `Yes: ${dec(T * e)} people, about ${dec(e)} per household.`, [[T * Math.round(e), MC.roundsEv, `Rounding E(X) to ${Math.round(e)} first loses the fraction: use ${dec(e)}.`]], 'Find E(X) per household, then multiply by the number of households.');
  }
  if (v === 1) {
    const N = 1000, c = pick(R, [2, 5]), big1 = pick(R, [300, 500, 750]), n2 = pick(R, [5, 10]), p2 = pick(R, [20, 25, 50]);
    const prizes = big1 + n2 * p2, profit = N * c - prizes;
    return numItem({ id: `totalN-${n}`, family: 'totalN', prompt: `A club sells all <b>1,000 raffle tickets at $${c}</b>. Prizes: one $${big1} and ${word(n2)} of $${p2}. Each ticket’s expected prize is ${money(prizes / N)}. What is the club’s expected <b>profit</b> on the raffle, in dollars?`, board: `\\text{profit} = 1000 \\cdot (${c} - ${dec(prizes / N)})`,
      solution: [`Per ticket the club keeps $${c} − ${money(prizes / N)} = ${money(c - prizes / N)} on average.`, `Over 1,000 tickets: 1,000 × ${money(c - prizes / N)} = ${ans(money(profit, false))}.`] },
      profit, `Yes: ${money(profit, false)}.`, [[N * c, MC.revenue, `$${big(N * c)} is what the tickets bring in. The prizes cost $${big(prizes)}: take them off.`]], 'Multiply the expected profit per ticket by the number of tickets.');
  }
  const c = pick(R, [1, 2]), prize = pick(R, [5, 6, 8]), pw = pick(R, [10, 15, 20]);
  const e = (prize * pw) / 100 - c, W = 52;
  return numItem({ id: `totalN-${n}`, family: 'totalN', prompt: `Every week Sam plays a game that costs $${c} and pays $${prize} with probability ${dec(pw / 100)}. What is his expected net gain over <b>${W} weeks</b>, in dollars?`, board: `E(\\text{total}) = ${W} \\cdot E(X)`,
    solution: [`E(X) per play: ${prize}(${dec(pw / 100)}) − ${c} = ${money(e)}.`, `Over ${W} plays: ${W} × ${money(e)} = ${ans(money(W * e))}.`] },
    Math.round(W * e * 100) / 100, `Yes: ${money(W * e)} expected; the real total will usually differ.`, [[Math.round(W * ((prize * pw) / 100) * 100) / 100, MC.revenue, `That is the expected prize money. Each week also costs $${c}.`]], 'Find the expected net gain per play, then multiply by the number of plays.', 0.005);
};

export const totalPossible: Gen = (R, n) => {
  const sets = [[0, 2], [0, 3], [0, 5], [0, 2, 5], [1, 4], [0, 4, 10], [2, 5]];
  const xs = pick(R, sets), np = pick(R, [2, 3]);
  const tots = possibleTotals(xs, np), lo = Math.min(...tots), hi = Math.max(...tots);
  const imp = Array.from({ length: hi - lo + 1 }, (_, i) => lo + i).filter(t => !tots.has(t));
  const can = imp.length && R() < 0.5;
  const T = can ? pick(R, [...tots].filter(t => t > lo && t < hi).concat([hi])) : pick(R, imp.length ? imp : [hi]);
  const possible = tots.has(T);
  const witness = (): number[] | null => { const go = (left: number, k: number): number[] | null => { if (k === 0) return left === 0 ? [] : null; for (const x of xs) { const r = go(left - x, k - 1); if (r) return [x, ...r]; } return null; }; return go(T, np); };
  const w = witness();
  const ctx = `A game pays X dollars per play, where X is ${xs.slice(0, -1).join(', ')}${xs.length > 2 ? ',' : ''} or ${xs[xs.length - 1]} (each with a positive probability). Play it ${word(np)} times, independently.`;
  const brd = `X \\in \\{${xs.join(', ')}\\},\\ ${np} \\text{ plays: total } \\$${T}\\,?`;
  const opts: Opt[] = possible ? [
    { t: `Yes: for example ${w!.join(' + ')} = ${T}`, ok: true, say: 'Right: one combination is enough to show a total is possible.' },
    { t: `No: ${T} can’t be reached, because only the expected total can happen`, mc: MC.guaranteed, say: 'Many totals can happen; the expected total is just their average.' },
    { t: `No: ${T} is not a multiple of ${xs.find(x => x > 0)}`, say: `Look for a combination: ${w!.join(' + ')} = ${T}.` },
  ] : [
    { t: `No: no ${word(np)} of the values ${xs.join(', ')} add to ${T}`, ok: true, say: 'Right: being between the smallest and largest total is not enough.' },
    { t: `Yes: $${T} lies between the smallest total, $${lo}, and the largest, $${hi}`, mc: MC.everyTotal, say: `Bounds rule totals out, but don’t prove one in: list the totals: ${[...tots].sort((a, b) => a - b).join(', ')}.` },
    { t: `Yes: any whole number of dollars up to ${hi} can happen`, mc: MC.everyTotal, say: `Only sums of ${word(np)} values are possible: ${[...tots].sort((a, b) => a - b).join(', ')}.` },
  ];
  return choice(R, { id: `totalPossible-${n}`, family: 'totalPossible', prompt: `${ctx} Is a total of <b>$${T}</b> possible?`, board: brd,
    solution: [`Every total is a sum of ${word(np)} values from ${xs.join(', ')}: ${[...tots].sort((a, b) => a - b).join(', ')}.`, possible ? `${T} is one of them (${w!.join(' + ')}).` : `${T} is not one of them, although it lies between ${lo} and ${hi}.`] }, opts);
};

export const totalSpread: Gen = (R, n) => {
  const c = pick(R, [1, 2]), e = -pick(R, [0.1, 0.2, 0.25]);
  return choice(R, { id: `totalSpread-${n}`, family: 'totalSpread', prompt: `A game costs $${c} per play and has E(net) = ${money(e)}. Compare playing it 100 times with playing it 10,000 times. Which statement is right?`,
    board: `E(\\text{total}) = n \\cdot E(X)`,
    solution: ['The average per play settles near E(X) as n grows.', 'The total is n times the average: a small gap in the average becomes a large gap in dollars.'] }, [
    { t: `The average per play tends to settle near ${money(e)}, but the total can stray further from n × ${money(e)} in dollars`, ok: true, say: 'Right: averages settle; totals multiply the leftover gap by n.' },
    { t: `The total gets closer and closer to n × ${money(e)} in dollars`, mc: MC.totalShrinks, say: 'It is the average per play that settles. The dollar gap of the total typically grows with n.' },
    { t: `After 10,000 plays the total is exactly 10,000 × ${money(e)}`, mc: MC.guaranteed, say: 'No number of plays guarantees the expected total.' },
  ]);
};

// ===================== same-mean-different-distributions =====================
export const sameMean: Gen = (R, n) => {
  const m = pick(R, [3, 4, 5]), spread = pick(R, [2, 3]);
  const A = { xs: [m - 1, m, m + 1], ps: [25, 50, 25] }, B = { xs: [m - spread, m + spread], ps: [50, 50] };
  const flip = R() < 0.5;
  const P = flip ? B : A, Q = flip ? A : B;
  const bars = (d: { xs: number[]; ps: number[] }, t: string): DPic => ({ kind: 'bars', xs: d.xs, ps: d.ps.map(p => p / 100), labs: d.ps.map(p => dec(p / 100)), axis: { min: 0, max: m + 3, step: 1 }, title: t });
  const wide = flip ? 'A' : 'B';
  return choice(R, { id: `sameMean-${n}`, family: 'sameMean', prompt: `Two games pay X dollars per play, with the distributions shown (Game A on top, Game B below). Which statement is right?`, board: `E_A(X) \\ \\text{ and } \\ E_B(X)`,
    solution: [`E for both: ${m} (each graph is symmetric about ${m}).`, `But game ${wide}’s payouts are spread further from ${m}: the distributions differ.`], picture: { pics: [bars(P, 'Game A'), bars(Q, 'Game B')], weights: [1, 1] } }, [
    { t: `Same E(X) = ${m}, but game ${wide} is more spread out`, ok: true, say: 'Right: one number, the mean, can’t describe the whole distribution.' },
    { t: `Same E(X) = ${m}, so the two games are the same`, mc: MC.equalMeans, say: 'Equal means do not make equal distributions: look at the values and how likely each is.' },
    { t: `Same E(X) = ${m}, so the games are equally risky`, mc: MC.equalMeans, say: `Game ${wide} can pay ${m - spread} or ${m + spread}: much more variation. Same mean, different risk.` },
    { t: `Game ${wide} has the larger E(X)`, say: `Compute it: both balance at ${m}.` },
  ]);
};

export const sameMeanPick: Gen = (R, n) => {
  const k = pick(R, [2, 3, 4, 5, 6]);
  const right = pick(R, [
    { t: `$0 or $${2 * k}, each with probability 0.5`, e: k },
    { t: `$0 with probability 0.75 or $${4 * k} with probability 0.25`, e: k },
    { t: `$${k - 1}, $${k} or $${k + 1}, each with probability 1/3`, e: k },
    { t: `$${k - 2} with probability 0.5 or $${k + 2} with probability 0.5`, e: k },
  ].filter(o => !o.t.includes('$-')));
  const wrongs: Opt[] = [
    { t: `$0, $${k} or $${3 * k}: probabilities 0.5, 0.3, 0.2`, key: (k * 0.3 + 3 * k * 0.2).toFixed(4), mc: MC.mode, say: `Its middle value is $${k}, but E = ${money(k * 0.3 + 3 * k * 0.2)}.` },
    { t: `$${k} with probability 0.6 or $${3 * k} with probability 0.4`, key: (k * 0.6 + 3 * k * 0.4).toFixed(4), mc: MC.mode, say: `$${k} is its most likely value, but E = ${money(k * 0.6 + 3 * k * 0.4)}.` },
    { t: `$0 with probability 0.8 or $${2 * k} with probability 0.2`, key: (2 * k * 0.2).toFixed(4), mc: MC.unweighted, say: `The plain average of $0 and $${2 * k} is $${k}, but they are not equally likely: E = ${money(2 * k * 0.2)}.` },
  ];
  return choice(R, { id: `sameMeanPick-${n}`, family: 'sameMeanPick', prompt: `Game A pays <b>$${k} on every play</b>, guaranteed. Which game has the <b>same expected value</b> as Game A?`, board: `E(A) = ${k}`,
    solution: [`E(A) = ${k}: a constant pays its own value.`, `For each game, add value × probability; only one gives ${k}: ${right.t}.`] }, [
    { t: right.t, ok: true, key: k.toFixed(4), say: `Right: E = ${money(k)}, the same mean as game A, with a very different spread.` },
    ...wrongs,
  ]);
};
