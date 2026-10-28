// famC.ts: stage 3 families of "Probability distributions and expected value": the binomial model (setting, exact and
// cumulative probabilities, E(X) = np), the geometric waiting time, the Poisson count, and the normal approximation of
// a binomial count. Rounded answers state their places and are never at a rounding tie. Pure: no DOM.
import { type DPic } from './DistPic';
import { type Gen, type Opt, CALC, MC, ans, big, choice, dec, decFixed, fracItem, ft, int, noTie, numItem, pairItem, pick, shuffle, until, word } from './common';
import { binomP, binomRange, geoP, nCk, poisCdf, poisP } from './ev';

const pics = (...p: DPic[]): { pics: DPic[] } => ({ pics: p });
const r3 = (x: number) => Math.round(x * 1000) / 1000;
/** a rounded answer is fair when it is no tie and the slips do not round to the same value */
const fair3 = (v: number, ...slips: number[]) => noTie(v, 3) && slips.every(s => r3(s) !== r3(v));

// ===================== binomial-distribution =====================
const BIN_YES = [
  'Roll a fair number cube 10 times; X = the number of 6s.',
  'Ask 12 randomly chosen adults from a large city whether they own a dog (about 40% do); X = the number who say yes.',
  'Guess on all 8 questions of a 4-choice quiz; X = the number right.',
  'A player who makes 80% of her free throws, independently, shoots 6 of them; X = the number made.',
  'Toss a fair coin 9 times; X = the number of heads.',
];
const BIN_NO = [
  { t: 'Roll a number cube until the first 6 appears; X = the number of rolls.', why: 'There is no fixed number of trials: you stop at the first success. That is a geometric setting.' },
  { t: 'Draw 3 cards without replacement from 5 red and 5 black cards; X = the number of red cards.', why: 'Without replacement from a small group, the chance of red changes after each draw: p is not constant.' },
  { t: 'A runner tries 5 sprints and tires, so each sprint is less likely to beat her record; X = the number of records.', why: 'The success probability drops from trial to trial: p is not constant.' },
  { t: 'Roll two number cubes 4 times; X = the total of all the dice.', why: 'X adds up numbers; a binomial X counts successes.' },
  { t: 'Shoot free throws until two in a row are missed; X = the number of shots.', why: 'The number of trials is not fixed in advance.' },
];
export const binomSetting: Gen = (R, n) => {
  const yes = pick(R, BIN_YES), nos = shuffle(R, BIN_NO.slice()).slice(0, 3);
  const opts: Opt[] = [{ t: yes, ok: true, say: 'Right: fixed n, independent trials, success or failure, the same p, and X counts successes.' }, ...nos.map(o => ({ t: o.t, mc: MC.noConditions, say: o.why }))];
  return choice(R, { id: `binomSetting-${n}`, family: 'binomSetting', prompt: 'Which situation gives a <b>binomial</b> random variable X?', board: `\\text{fixed } n,\\ \\text{same } p,\\ \\text{independent}`,
    solution: ['Check all four: a fixed number of trials n, independent trials, two outcomes, the same p every trial, X counts successes.', `Only one passes every check: ${yes}`] }, opts);
};

const CTX = [
  { s: (nn: number, p: number) => `A ${p === 0.25 ? '4' : '5'}-choice quiz has ${nn} questions and you guess on every one`, x: 'the number right', ps: [0.25, 0.2] },
  { s: (nn: number, p: number) => `A survey asks ${nn} randomly chosen adults a yes/no question; in the whole (large) population a share of ${dec(p)} would say yes`, x: 'the number who say yes', ps: [0.3, 0.4, 0.6, 0.7] },
  { s: (nn: number, p: number) => `A basketball player makes each free throw with probability ${dec(p)}, independently, and shoots ${nn}`, x: 'the number made', ps: [0.7, 0.8, 0.9] },
  { s: (nn: number, p: number) => `A machine makes parts, each defective with probability ${dec(p)}, independently; you test ${nn} parts`, x: 'the number defective', ps: [0.1, 0.05] },
];
export const binomExact: Gen = (R, n) => {
  const it = until(() => {
    const C = pick(R, CTX), p = pick(R, C.ps), nn = int(R, 3, 10), k = int(R, 1, nn - 1);
    const v = binomP(nn, k, p), one = p ** k * (1 - p) ** (nn - k);
    return { C, p, nn, k, v, one };
  }, o => o.v >= 0.01 && fair3(o.v, o.one) && nCk(o.nn, o.k) > 1);
  const { C, p, nn, k, v, one } = it, c = nCk(nn, k);
  return numItem({ id: `binomExact-${n}`, family: 'binomExact', prompt: `${C.s(nn, p)}. X is ${C.x}. Find <b>P(X = ${k})</b>, rounded to three decimal places.${CALC}`,
    board: `P(X = ${k}) = \\binom{${nn}}{${k}} (${dec(p)})^{${k}} (${dec(1 - p)})^{${nn - k}}`,
    solution: [`Binomial: n = ${nn}, p = ${dec(p)}, k = ${k}.`, `C(${nn}, ${k}) = ${c} paths, each with probability ${dec(p)}^${k} × ${dec(1 - p)}^${nn - k}.`, `P(X = ${k}) = ${c} × ${dec(one, 6)} ≈ ${ans(decFixed(v, 3))}.`] },
    r3(v), `Yes: about ${decFixed(v, 3)}.`, [[r3(one), MC.omitsOrder, `That is one ordered path. ${k} successes can come in C(${nn}, ${k}) = ${c} orders: multiply by ${c}.`]],
    'Use C(n, k) · p^k · (1 − p)^(n − k).', 0.0005 + 1e-9);
};

export const binomCumul: Gen = (R, n) => {
  const it = until(() => {
    const C = pick(R, CTX), p = pick(R, C.ps), nn = int(R, 5, 20), k = int(R, 1, nn - 2);
    const kind = pick(R, ['atLeast', 'atMost', 'between', 'more'] as const);
    let v: number, slips: [number, string | undefined, string][] = [], sym: string, words: string, how: string;
    if (kind === 'atLeast') {
      v = binomRange(nn, p, k, nn); sym = `X \\ge ${k}`; words = `at least ${k}`;
      how = `1 − P(X ≤ ${k - 1}) = 1 − ${decFixed(binomRange(nn, p, 0, k - 1), 4)}`;
      slips = [[r3(1 - binomRange(nn, p, 0, k)), MC.endpoint, `1 − P(X ≤ ${k}) also removes X = ${k}, which “at least ${k}” includes. Use 1 − P(X ≤ ${k - 1}).`], [r3(binomP(nn, k, p)), MC.atLeastExactly, `That is P(X = ${k}) only. At least ${k} includes ${k}, ${k + 1}, …, ${nn}.`]];
    } else if (kind === 'more') {
      v = binomRange(nn, p, k + 1, nn); sym = `X > ${k}`; words = `more than ${k}`;
      how = `1 − P(X ≤ ${k}) = 1 − ${decFixed(binomRange(nn, p, 0, k), 4)}`;
      slips = [[r3(binomRange(nn, p, k, nn)), MC.strictBoundary, `“More than ${k}” leaves ${k} out: 1 − P(X ≤ ${k}).`]];
    } else if (kind === 'atMost') {
      v = binomRange(nn, p, 0, k); sym = `X \\le ${k}`; words = `at most ${k}`;
      how = `P(X = 0) + … + P(X = ${k}) (binomcdf)`;
      slips = [[r3(binomRange(nn, p, 0, k - 1)), undefined, `“At most ${k}” includes ${k} itself.`], [r3(binomP(nn, k, p)), MC.atLeastExactly, `That is only P(X = ${k}). At most ${k} adds 0 through ${k}.`]];
    } else {
      const b = Math.min(nn, k + int(R, 1, 3));
      v = binomRange(nn, p, k, b); sym = `${k} \\le X \\le ${b}`; words = `between ${k} and ${b}, inclusive`;
      how = `P(X ≤ ${b}) − P(X ≤ ${k - 1})`;
      slips = [[r3(binomRange(nn, p, k + 1, b)), MC.endpoint, `P(X ≤ ${b}) − P(X ≤ ${k}) drops X = ${k}, which is included. Subtract P(X ≤ ${k - 1}).`]];
    }
    return { C, p, nn, k, v, slips, sym, words, how };
  }, o => o.v > 0.02 && o.v < 0.98 && fair3(o.v, ...o.slips.map(s => s[0])));
  return numItem({ id: `binomCumul-${n}`, family: 'binomCumul', prompt: `${it.C.s(it.nn, it.p)}. X is ${it.C.x}. Find the probability that X is <b>${it.words}</b>, rounded to three decimal places.${CALC}`,
    board: `P(${it.sym}) = \\,?\\quad n = ${it.nn},\\ p = ${dec(it.p)}`,
    solution: [`Binomial with n = ${it.nn}, p = ${dec(it.p)}; the event is ${it.sym.replace(/\\ge/g, '≥').replace(/\\le/g, '≤')}.`, `P = ${it.how} ≈ ${ans(decFixed(it.v, 3))}.`] },
    r3(it.v), `Yes: about ${decFixed(it.v, 3)}.`, it.slips, 'Decide which counts are in the event, then add them (or use the complement).', 0.0005 + 1e-9);
};

// ===================== binomial-expected-value =====================
const MEANS = [
  { s: (nn: number, p: number) => `A survey asks ${nn} randomly chosen adults a yes/no question; ${dec(p * 100)}% of the population would say yes. X is the number who say yes`, ns: [50, 120, 200, 250, 400], ps: [0.3, 0.45, 0.6, 0.64, 0.72], u: 'people' },
  { s: (nn: number, p: number) => `You guess on ${nn} questions with ${p === 0.25 ? 'four' : 'five'} choices each. X is the number right`, ns: [5, 6, 7, 9, 10, 15], ps: [0.25, 0.2], u: 'questions' },
  { s: (nn: number, p: number) => `A shipment has ${nn} items, each defective with probability ${dec(p)}, independently. X is the number defective`, ns: [150, 200, 350, 500, 800], ps: [0.02, 0.03, 0.05], u: 'items' },
  { s: (nn: number, p: number) => `A player makes ${dec(p * 100)}% of her free throws, independently, and takes ${nn} this season. X is the number made`, ns: [40, 65, 90, 150], ps: [0.7, 0.75, 0.82, 0.85], u: 'free throws' },
];
export const binomMean: Gen = (R, n) => {
  const it = until(() => { const M = pick(R, MEANS), nn = pick(R, M.ns), p = pick(R, M.ps); return { M, nn, p, e: Math.round(nn * p * 1e6) / 1e6 }; }, o => Number.isInteger(o.e * 100));
  const { M, nn, p, e } = it;
  return numItem({ id: `binomMean-${n}`, family: 'binomMean', prompt: `${M.s(nn, p)}. What is <b>E(X)</b>?`, board: `E(X) = np = ${nn} \\cdot ${dec(p)}`,
    solution: [`Binomial: E(X) = n·p.`, `E(X) = ${nn} × ${dec(p)} = ${ans(dec(e))} ${e === 1 ? M.u.replace(/s$/, '') : M.u}, the long-run average count.`] },
    e, `Yes: ${dec(e)} ${e === 1 ? M.u.replace(/s$/, '') : M.u} on average${Number.isInteger(e) ? '' : ' (a count can’t be ' + dec(e) + ', but an average can)'}.`,
    [[Math.round(e), MC.roundsEv, `E(X) is a long-run average: keep ${dec(e)}, even though one count is a whole number.`], [nn * (1 - p), undefined, `That counts failures. E(X) = n × p, the probability of success.`]],
    'Multiply the number of trials by the probability of success.');
};

export const binomMeaning: Gen = (R, n) => {
  const it = until(() => { const nn = pick(R, [3, 5, 6, 7, 9, 10]), p = pick(R, [0.25, 0.2]); return { nn, p, e: Math.round(nn * p * 100) / 100 }; }, o => !Number.isInteger(o.e));
  const { nn, p, e } = it;
  const md = [...Array(nn + 1).keys()].reduce((a, b) => (binomP(nn, b, p) > binomP(nn, a, p) ? b : a), 0);
  return choice(R, { id: `binomMeaning-${n}`, family: 'binomMeaning', prompt: `You guess on ${word(nn)} questions with ${p === 0.25 ? 'four' : 'five'} choices each, so X = number right is binomial with E(X) = ${nn} × ${dec(p)} = ${dec(e)}. What does ${dec(e)} mean?`,
    board: `E(X) = ${dec(e)}`, solution: [`${dec(e)} is not a possible count: you get a whole number right on each quiz.`, `Over many such quizzes, the average number right per quiz tends toward ${dec(e)}.`] }, [
    { t: `Over many such quizzes, the average number right per quiz tends toward ${dec(e)}`, ok: true, say: 'Right: an expected count is a long-run average.' },
    { t: `On every quiz you get exactly ${dec(e)} right`, mc: MC.guaranteed, say: `A quiz score is a whole number: ${dec(e)} is never the score of one quiz.` },
    { t: `You will get ${Math.round(e)} right: ${dec(e)} rounded`, mc: MC.roundsEv, say: 'Nothing guarantees a score. Rounding turns the average into a promise it does not make.' },
    { t: `${dec(e)} is the most likely number right`, mc: MC.mode, say: `${dec(e)} can’t even happen. The most likely count is ${md}.` },
  ]);
};

// ===================== geometric-distribution =====================
const WAIT = [
  { s: 'Roll a fair number cube until the first 6', p: [1, 6] as [number, number], x: 'roll', frac: true },
  { s: 'Toss a fair coin until the first heads', p: [1, 2] as [number, number], x: 'toss', frac: true },
  { s: 'A player who makes 70% of her free throws, independently, shoots until her first make', p: [7, 10] as [number, number], x: 'shot', frac: false },
  { s: 'A telemarketer calls numbers, each answered with probability 0.4, independently, until someone answers', p: [2, 5] as [number, number], x: 'call', frac: false },
  { s: 'Each scratch card wins with probability 0.2, independently; buy cards until the first winner', p: [1, 5] as [number, number], x: 'card', frac: false },
];
export const geoExact: Gen = (R, n) => {
  const W = pick(R, WAIT), [a, b] = W.p, p = a / b, q = 1 - p;
  const fails = R() < 0.25;
  const k = int(R, 2, 4);
  if (fails) {
    // Y = failures before the first success; P(Y = j) = q^j p
    const j = k - 1, vN = (b - a) ** j * a, vD = b ** (j + 1), slipN = (b - a) ** (j - 1) * a, slipD = b ** j;
    const base = { id: `geoExact-${n}`, family: 'geoExact', prompt: `${W.s}. A calculator counts <b>Y = the number of failures before the first success</b> (Y = 0, 1, 2, …). What is <b>P(Y = ${j})</b>?${W.frac ? ' Give a fraction.' : ' Give the exact decimal.'}`,
      board: `Y = ${j} \\iff X = ${j + 1}`, solution: [`Y = ${j}: ${j} failure${j === 1 ? "" : "s"}, then the success: the success comes on ${W.x} ${j + 1}.`, `P = (${ft(b - a, b)})^${j} × ${ft(a, b)} = ${ans(W.frac ? ft(vN, vD) : dec(vN / vD, 6))}.`] };
    return W.frac ? fracItem(base, vN, vD, `Yes: ${j} failure${j === 1 ? "" : "s"}, then a success.`, [[slipN, slipD, MC.geoOffByOne, `Y counts failures only: ${j} failures come before the success, so (1 − p) is raised to ${j}.`]], 'Multiply: (1 − p) for each failure, then p for the success.')
      : numItem(base, Math.round((vN / vD) * 1e6) / 1e6, `Yes: ${j} failure${j === 1 ? "" : "s"}, then a success.`, [[Math.round((slipN / slipD) * 1e6) / 1e6, MC.geoOffByOne, `Y counts failures only: (1 − p) is raised to ${j}.`]], 'Multiply: (1 − p) for each failure, then p for the success.', 1e-6);
  }
  const vN = (b - a) ** (k - 1) * a, vD = b ** k, sN = (b - a) ** k * a, sD = b ** (k + 1);
  const base = { id: `geoExact-${n}`, family: 'geoExact', prompt: `${W.s}. X is the number of the ${W.x} on which the first success happens (X = 1, 2, 3, …). What is <b>P(X = ${k})</b>?${W.frac ? ' Give a fraction.' : ' Give the exact decimal.'}`,
    board: `P(X = ${k}) = (1 - p)^{${k - 1}}\\,p`, solution: [`X = ${k} means ${k - 1} failure${k - 1 === 1 ? '' : 's'}, then a success on ${W.x} ${k}.`, `P = (${ft(b - a, b)})^${k - 1} × ${ft(a, b)} = ${ans(W.frac ? ft(vN, vD) : dec(vN / vD, 6))}.`] };
  return W.frac ? fracItem(base, vN, vD, `Yes: ${k - 1} failure${k - 1 === 1 ? "" : "s"}, then the first success.`, [[sN, sD, MC.geoOffByOne, `Only ${k - 1} trials fail before ${W.x} ${k}: (1 − p)^${k - 1}, not (1 − p)^${k}.`], [a, b, undefined, `That is P(X = 1). The success must wait for ${k - 1} failure${k - 1 === 1 ? '' : 's'}.`]], 'Multiply (1 − p) for each failure before the success, then p.')
    : numItem(base, Math.round((vN / vD) * 1e6) / 1e6, `Yes: ${k - 1} failure${k - 1 === 1 ? "" : "s"}, then the first success.`, [[Math.round((sN / sD) * 1e6) / 1e6, MC.geoOffByOne, `Only ${k - 1} trials fail before ${W.x} ${k}: raise (1 − p) to ${k - 1}.`]], 'Multiply (1 − p) for each failure before the success, then p.', 1e-6);
};

export const geoTail: Gen = (R, n) => {
  const W = pick(R, WAIT.filter(w => !w.frac)), [a, b] = W.p, q = (b - a) / b;
  const k = int(R, 2, 4), more = R() < 0.5;
  const tail = q ** k, v = more ? tail : 1 - tail;
  return numItem({ id: `geoTail-${n}`, family: 'geoTail', prompt: `${W.s}. X is the number of the ${W.x} with the first success. What is <b>P(X ${more ? '>' : '≤'} ${k})</b>? Give the exact decimal.`,
    board: more ? `P(X > ${k}) = (1 - p)^{${k}}` : `P(X \\le ${k}) = 1 - (1 - p)^{${k}}`,
    solution: [`X > ${k} means the first ${k} ${W.x}s all fail: (${dec(q)})^${k} = ${dec(tail, 6)}.`, more ? `P(X > ${k}) = ${ans(dec(v, 6))}.` : `P(X ≤ ${k}) = 1 − ${dec(tail, 6)} = ${ans(dec(v, 6))}.`] },
    Math.round(v * 1e6) / 1e6, `Yes: ${dec(v, 6)}.`, more ? [[Math.round(q ** (k - 1) * 1e6) / 1e6, MC.geoOffByOne, `X > ${k} needs all of the first ${k} to fail: (1 − p)^${k}.`], [Math.round((1 - tail) * 1e6) / 1e6, undefined, `That is P(X ≤ ${k}). “More than ${k}” is the first ${k} all failing.`]]
      : [[Math.round(tail * 1e6) / 1e6, undefined, `That is P(X > ${k}). Take it from 1.`], [Math.round((1 - q ** (k - 1)) * 1e6) / 1e6, MC.geoOffByOne, `X ≤ ${k} is the complement of the first ${k} all failing: 1 − (1 − p)^${k}.`]],
    'X > k: the first k trials all fail. X ≤ k: 1 minus that.', 1e-6);
};

export const geoMean: Gen = (R, n) => {
  const W = pick(R, WAIT), [a, b] = W.p, e = b / a;
  return choice(R, { id: `geoMean-${n}`, family: 'geoMean', prompt: `${W.s}. X is the number of the ${W.x} with the first success, so E(X) = 1/p ${Number.isInteger(e * 100) ? '=' : '≈'} ${dec(e, 2)}. Which statement is true?`, board: `E(X) = \\dfrac{1}{p} ${Number.isInteger(e * 100) ? '=' : '\\approx'} ${dec(e, 2)}`,
    solution: [`E(X) ${Number.isInteger(e * 100) ? '=' : '≈'} ${dec(e, 2)} is the mean waiting time over many repetitions.`, `There is no deadline: X can be larger than ${dec(e, 2)} (with probability (1 − p)^${Math.floor(e)} it is).`] }, [
    { t: `On average the first success comes on ${W.x} ${dec(e, 2)}, but it can take longer`, ok: true, say: 'Right: 1/p is a mean waiting time, not a deadline.' },
    { t: `The first success is sure to come by ${W.x} ${Math.ceil(e)}`, mc: MC.deadline, say: `The first ${Math.ceil(e)} can all fail: probability (${ft(b - a, b)})^${Math.ceil(e)}. 1/p is an average, not an upper limit.` },
    { t: `X is binomial with n = ${Math.ceil(e)} trials`, mc: MC.noConditions, say: 'There is no fixed number of trials: you stop at the first success. That is geometric, not binomial.' },
    { t: `After ${Math.max(2, Math.ceil(e) - 1)} failures in a row, the next ${W.x} must succeed`, mc: MC.gambler, say: 'The trials are independent: the chance on the next one is still p.' },
  ]);
};

// ===================== poisson-distribution =====================
const RATES: { s: (r: number) => string; unit: string; parts: [number, string, number][]; rs: number[]; what: string }[] = [
  { s: (r: number) => `A help desk gets calls at a steady average of ${r} per hour, independently`, unit: 'hour', parts: [[30, 'half hour', 0.5], [20, '20 minutes', 1 / 3], [15, '15 minutes', 0.25], [2, 'two hours', 2]], rs: [3, 6, 12], what: 'calls' },
  { s: (r: number) => `A sheet of glass has flaws at an average of ${r} per square meter, independently`, unit: 'square meter', parts: [[10, '10 square meters', 10], [5, '5 square meters', 5], [4, '4 square meters', 4]], rs: [0.2, 0.4, 0.5], what: 'flaws' },
  { s: (r: number) => `Meteors appear at a steady average of ${r} per hour on a clear night`, unit: 'hour', parts: [[30, 'half hour', 0.5], [20, '20 minutes', 1 / 3], [3, 'three hours', 3]], rs: [3, 6, 9], what: 'meteors' },
];
export const poisRescale: Gen = (R, n) => {
  const it = until(() => { const S = pick(R, RATES), r = pick(R, S.rs), P = pick(R, S.parts); return { S, r, P, lam: Math.round(r * (P[2] as number) * 1e6) / 1e6 }; }, o => Number.isInteger(o.lam * 10) && o.lam > 0 && Math.abs(o.lam - o.r) > 1e-9);
  const { S, r, P, lam } = it;
  return numItem({ id: `poisRescale-${n}`, family: 'poisRescale', prompt: `${S.s(r)}. X is the number of ${S.what} in ${P[1] === 'half hour' ? 'a ' : ''}<b>${P[1]}</b>. What mean λ should the Poisson model of X use?`,
    board: `\\lambda = \\text{rate} \\times \\text{interval}`, solution: [`The rate is ${r} per ${S.unit}; the interval is ${P[1]}, which is ${Math.abs((P[2] as number) - 1 / 3) < 1e-9 ? '1/3' : dec(P[2] as number, 4)} ${S.unit}${(P[2] as number) === 1 ? '' : 's'}.`, `λ = ${r} × ${Math.abs((P[2] as number) - 1 / 3) < 1e-9 ? '1/3' : dec(P[2] as number, 4)} = ${ans(dec(lam))} ${lam === 1 ? S.what.replace(/s$/, '') : S.what}.`] },
    lam, `Yes: λ = ${dec(lam)} for this interval.`, [[r, MC.mismatchedUnits, `${r} is per ${S.unit}. Rescale it to ${P[1] === 'half hour' ? 'a half hour' : P[1]} first.`]], 'Multiply the rate by the length of the interval (in the rate’s unit).');
};

export const poisProb: Gen = (R, n) => {
  const it = until(() => {
    const lam = pick(R, [0.5, 1, 1.5, 2, 2.5, 3, 4]), k = int(R, 0, 4), kind = pick(R, ['eq', 'atLeast1', 'atMost'] as const);
    const v = kind === 'eq' ? poisP(lam, k) : kind === 'atLeast1' ? 1 - poisP(lam, 0) : poisCdf(lam, k);
    const slips: [number, string | undefined, string][] = kind === 'atLeast1' ? [[r3(poisP(lam, 1)), MC.atLeastExactly, 'That is P(X = 1). At least one is every count but 0: 1 − P(X = 0).']] : kind === 'atMost' ? [[r3(poisP(lam, k)), MC.atLeastExactly, `That is only P(X = ${k}); at most ${k} adds 0 through ${k}.`]] : [];
    return { lam, k: kind === 'atLeast1' ? 1 : k, kind, v, slips };
  }, o => o.v > 0.01 && o.v < 0.99 && fair3(o.v, ...o.slips.map(s => s[0])) && !(o.kind === 'atMost' && o.k === 0));
  const S = pick(R, [{ s: 'Cars arrive at a quiet toll booth', u: 'minute', w: 'cars' }, { s: 'Typos appear in a book', u: 'page', w: 'typos' }, { s: 'Customers walk into a shop', u: 'five-minute period', w: 'customers' }]);
  const { lam, k, kind, v } = it;
  const q = kind === 'eq' ? `exactly ${k}` : kind === 'atLeast1' ? 'at least one' : `at most ${k}`;
  const sym = kind === 'eq' ? `X = ${k}` : kind === 'atLeast1' ? 'X \\ge 1' : `X \\le ${k}`;
  return numItem({ id: `poisProb-${n}`, family: 'poisProb', prompt: `${S.s} independently at a steady average of λ = ${dec(lam)} per ${S.u}. X is the number of ${S.w} in one ${S.u} (Poisson). What is the probability of <b>${q}</b>? Round to three decimal places.${CALC}`,
    board: `P(${sym}),\\quad P(X = k) = \\dfrac{e^{-\\lambda} \\lambda^{k}}{k!}`,
    solution: kind === 'eq' ? [`P(X = ${k}) = e^(−${dec(lam)}) × ${dec(lam)}^${k} ÷ ${k}!`, `≈ ${ans(decFixed(v, 3))}.`] : kind === 'atLeast1' ? [`At least one = 1 − P(X = 0) = 1 − e^(−${dec(lam)}).`, `≈ 1 − ${decFixed(Math.exp(-lam), 4)} = ${ans(decFixed(v, 3))}.`] : [`Add P(X = 0) through P(X = ${k}) (poissoncdf).`, `≈ ${ans(decFixed(v, 3))}.`] },
    r3(v), `Yes: about ${decFixed(v, 3)}.`, it.slips, 'Use e^(−λ) λ^k / k!, and a complement for “at least”.', 0.0005 + 1e-9);
};

export const poisMeaning: Gen = (R, n) => {
  const lam = pick(R, [3, 4, 5, 6]), big2 = lam + int(R, 2, 4);
  if (R() < 0.6) return choice(R, { id: `poisMeaning-${n}`, family: 'poisMeaning', prompt: `Calls reach a help desk independently at a steady average of λ = ${lam} per hour (a Poisson count). Which statement is true?`, board: `\\lambda = ${lam}\\ \\text{per hour}`,
    solution: [`λ is the mean count per hour, not a limit.`, `A Poisson count has no upper limit: ${big2} calls in an hour can happen (probability ${decFixed(poisP(lam, big2), 3)}).`] }, [
    { t: `${lam} is the average per hour; an hour with ${big2} calls can happen`, ok: true, say: 'Right: λ is a mean, and a Poisson count has no fixed upper limit.' },
    { t: `No hour can have more than ${lam} calls`, mc: MC.poisLimit, say: `λ is an average, not a cap: P(X = ${big2}) is about ${decFixed(poisP(lam, big2), 3)}.` },
    { t: `Every hour has exactly ${lam} calls`, mc: MC.poisLimit, say: `Exactly ${lam} has probability only about ${decFixed(poisP(lam, lam), 3)}.` },
  ]);
  return choice(R, { id: `poisMeaning-${n}`, family: 'poisMeaning', prompt: `Which count is a good fit for a <b>Poisson</b> model?`, board: `\\text{independent, steady rate, fixed interval}`,
    solution: ['Poisson: independent events at a constant mean rate, counted in a fixed interval, with no fixed upper limit.', 'Rush hour changes the rate, and a fixed number of trials is binomial.'] }, [
    { t: 'The number of emails a help desk gets between 2 and 3 p.m. on a steady weekday', ok: true, say: 'Right: independent arrivals at a steady rate in a fixed hour.' },
    { t: 'The number of cars through a toll booth from 6 to 10 a.m., including rush hour', mc: MC.noConditions, say: 'The rate jumps at rush hour: it is not constant over the interval.' },
    { t: 'The number of heads in 20 coin tosses', mc: MC.noConditions, say: 'A fixed number of trials with a cap of 20: that is binomial.' },
  ]);
};

// ===================== binomial-normal-connection =====================
export const bnCheck: Gen = (R, n) => {
  const ok = R() < 0.5;
  const it = until(() => { const nn = pick(R, [20, 30, 40, 50, 60, 80, 100, 150, 200]), p = pick(R, [0.05, 0.1, 0.2, 0.3, 0.5, 0.6, 0.8, 0.9, 0.95]); return { nn, p, a: Math.round(nn * p * 100) / 100, b: Math.round(nn * (1 - p) * 100) / 100 }; },
    o => (ok ? o.a >= 10 && o.b >= 10 : (o.a < 10 || o.b < 10) && Math.min(o.a, o.b) >= 1) && o.nn >= 20);
  const { nn, p, a, b } = it;
  const mu = nn * p, sd = Math.sqrt(nn * p * (1 - p));
  const lo = Math.max(0, Math.floor(mu - 4.2 * sd)), hi = Math.min(nn, Math.ceil(mu + 4.2 * sd));
  const lo2 = Math.floor(lo / 5) * 5, hi2 = Math.ceil(hi / 5) * 5;
  const st = [1, 5, 10, 20, 25, 50].find(s0 => (hi2 - lo2) / s0 <= 12 && Number.isInteger((hi2 - lo2) / s0))!;
  const small = a < 10 ? `np = ${dec(a)}` : `n(1 − p) = ${dec(b)}`;
  return choice(R, { id: `bnCheck-${n}`, family: 'bnCheck', prompt: `X is binomial with n = ${nn} and p = ${dec(p)} (the histogram shows it, with a normal curve of the same mean and SD). Is a normal model a reasonable approximation for X? (Check np ≥ 10 and n(1 − p) ≥ 10.)`,
    board: `np = ${dec(a)},\\quad n(1-p) = ${dec(b)}`, solution: [`np = ${nn} × ${dec(p)} = ${dec(a)} and n(1 − p) = ${dec(b)}.`, ok ? 'Both are at least 10: the histogram is close to symmetric, so the normal model is reasonable.' : `${small} is below 10: the histogram is skewed, so the normal model is not reasonable.`],
    picture: pics({ kind: 'binorm', n: nn, p, lo: lo2, hi: hi2, step: st, curve: true, name: 'X' }) }, [
    { t: `Yes: np = ${dec(a)} and n(1 − p) = ${dec(b)} are both at least 10`, ok: ok, mc: ok ? undefined : MC.alwaysNormal, say: ok ? 'Right: enough expected successes and failures.' : `${small} is less than 10.` },
    { t: `No: ${a < b ? `np = ${dec(a)}` : `n(1 − p) = ${dec(b)}`} is less than 10, so the histogram is skewed`, ok: !ok, say: ok ? 'Both are at least 10 here.' : 'Right: too few expected successes or failures: the shape is skewed.' },
    { t: 'Yes: every binomial count is approximately normal', mc: MC.alwaysNormal, say: 'Only when np and n(1 − p) are both large enough. With p near 0 or 1 and small n the histogram is skewed.' },
  ], true);
};

export const bnParams: Gen = (R, n) => {
  const it = until(() => { const nn = pick(R, [50, 80, 100, 120, 200, 250, 400, 500, 600, 800, 1000]), p = pick(R, [0.2, 0.25, 0.3, 0.4, 0.45, 0.5, 0.55, 0.6, 0.7]); const v = nn * p * (1 - p); return { nn, p, mu: Math.round(nn * p * 1e6) / 1e6, v, sd: Math.sqrt(v) }; },
    o => Number.isInteger(o.mu * 10) && o.mu >= 10 && o.nn * (1 - o.p) >= 10 && (Number.isInteger(Math.round(o.sd * 1e6) / 1e6 * 100) || noTie(o.sd, 2)) && Math.abs(o.v - o.sd) > 0.05);
  const { nn, p, mu, v, sd } = it, sd2 = Math.round(sd * 100) / 100;
  return pairItem({ id: `bnParams-${n}`, family: 'bnParams', prompt: `A survey asks ${big(nn)} randomly chosen people a yes/no question; in the population ${dec(p * 100)}% would say yes. X is the number who say yes. Give the mean and the standard deviation of the normal model for X (SD to two decimal places).${CALC}`,
    board: `\\mu = np,\\quad \\sigma = \\sqrt{np(1-p)}`, solution: [`μ = ${big(nn)} × ${dec(p)} = ${ans(dec(mu))}.`, `σ = √(${dec(mu)} × ${dec(1 - p)}) = √${dec(v)} ≈ ${ans(dec(sd2, 2))}.`] },
    'μ =', ', σ =', '', mu, sd2, `Yes: N(${dec(mu)}, ${dec(sd2, 2)}).`, [[mu, Math.round(v * 100) / 100, MC.varForSd, `${dec(v)} is the variance np(1 − p). The SD is its square root.`]],
    'μ = np; σ = the square root of np(1 − p).', [1e-9, 0.005 + 1e-9]);
};

const sgn = (z: number) => (z > 0 ? `+${z}` : z < 0 ? `−${-z}` : '0');
export const bnEstimate: Gen = (R, n) => {
  const S = pick(R, [[100, 0.5], [400, 0.5], [400, 0.2], [900, 0.1], [625, 0.2], [225, 0.2], [144, 0.5], [400, 0.8], [2500, 0.5]] as [number, number][]);
  const [nn, p] = S, mu = Math.round(nn * p * 1e6) / 1e6, sd = Math.round(Math.sqrt(nn * p * (1 - p)) * 1e6) / 1e6;
  const zs = pick(R, [[-1, 1, 68], [-2, 2, 95], [0, 2, 47.5], [-1, 0, 34], [1, 9, 16], [-9, -2, 2.5], [-2, 1, 81.5], [2, 9, 2.5], [-1, 2, 81.5]] as [number, number, number][]);
  const [za, zb, pct] = zs;
  const at = (z: number) => mu + z * sd;
  const q = za === -9 ? `fewer than ${at(zb)}` : zb === 9 ? `more than ${at(za)}` : `between ${at(za)} and ${at(zb)}`;
  return numItem({ id: `bnEstimate-${n}`, family: 'bnEstimate', prompt: `A survey asks ${big(nn)} randomly chosen people a yes/no question; ${dec(p * 100)}% of the population would say yes. Use the normal model N(np, √(np(1 − p))) and the 68-95-99.7 rule: about what <b>percent</b> of such surveys get ${q} yes answers?`,
    board: `\\mu = ${mu},\\quad \\sigma = \\sqrt{${nn} \\cdot ${dec(p)} \\cdot ${dec(1 - p)}} = ${sd}`,
    solution: [`μ = ${mu} and σ = ${sd}, so ${q} is ${za === -9 ? `below ${sgn(zb)} SD` : zb === 9 ? `above ${sgn(za)} SD` : `from ${sgn(za)} to ${sgn(zb)} SD`}.`, `68-95-99.7 rule: about ${ans(dec(pct))}%.`],
    picture: pics({ kind: 'binorm', n: nn, p, lo: mu - 4 * sd, hi: mu + 4 * sd, step: sd, curve: true }) },
    pct, `Yes: about ${dec(pct)}% of surveys.`, [], 'Find μ and σ, count how many SDs each end is from μ, and use 68%, 95%, 99.7%.', 1e-9);
};
