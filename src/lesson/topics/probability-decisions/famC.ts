// famC.ts: stage 3 families of "Using probability to make decisions": downside risk (worst case, P(loss), P(loss of at
// least T), equal EVs with different risk), the SD of a payoff distribution, choosing on EV and SD under a stated rule,
// diversification, repetition and pooling, model uncertainty vs randomness, risk preference and constraints, and the
// conditional recommendation (with the changeover value). Pure: no DOM.
import type { BarsPic, TablePic } from '../expected-value/DistPic';
import { type Dist, type Gen, type Opt, type Slip, CALC, MC, an, An, M, Mc, NEG, ans, big, ch, dec, evOf, hundredths, int, mx, near, noTie, num, pair, par, pd, pick, retry, Reroll, sdOf, shuffle, tt, until, varOf } from './common';

const round2 = (v: number) => Math.round(v * 100 + Math.sign(v) * 1e-7) / 100;
const cap = (s: string) => s[0]!.toUpperCase() + s.slice(1);
/** the payoff distribution as a bar graph, or as a table when the values are 4-digit or crowded (labels would collide) */
function barsOf(d: Dist, name: string, title?: string): BarsPic | TablePic {
  const lo = Math.min(...d.xs), hi = Math.max(...d.xs), span = hi - lo;
  const s0 = d.xs.slice().sort((a, b) => a - b), gap = Math.min(...s0.slice(1).map((x, i) => x - s0[i]!)) / span;
  if (Math.max(...d.xs.map(Math.abs)) >= 1000 || gap < 0.25) return { kind: 'table', title, rows: [{ head: 'X', cells: s0.map(mx) }, { head: 'P', cells: s0.map(x => pd(d.ps[d.xs.indexOf(x)]!)) }] };
  const step = span > 1000 ? 500 : span > 400 ? 100 : span > 150 ? 50 : span > 60 ? 20 : 10;
  return { kind: 'bars', xs: d.xs, ps: d.ps, labs: d.ps.map(p => pd(p)), axis: { min: Math.floor(lo / step) * step, max: Math.ceil(hi / step) * step, step, pre: '$', name, only: true }, y: { max: Math.max(...d.ps) > 0.6 ? 1 : 0.6, step: 0.2, dec: 1 }, title };
}
const sorted = (d: Dist): Dist => { const o = d.xs.map((x, i) => [x, d.ps[i]!] as const).sort((a, b) => a[0] - b[0]); return { xs: o.map(a => a[0]), ps: o.map(a => a[1]) }; };
const gapOk = (xs: number[]) => { const s = xs.slice().sort((a, b) => a - b), span = s[s.length - 1]! - s[0]!; return s.slice(1).every((x, i) => (x - s[i]!) / span >= 0.2); };

// ===================== s3-downside-risk =====================
const BIZ = [
  { who: 'A food truck’s day at a street fair', vals: [-400, -300, -150, -100, 200, 300, 500, 700, 900] },
  { who: 'A pop-up shop’s weekend', vals: [-600, -500, -250, -200, 300, 450, 600, 800, 1200] },
  { who: 'A concert promoter’s small show', vals: [-1500, -1000, -800, -500, 500, 1000, 1500, 2500] },
];
export const riskRead: Gen = (R, n) => {
  const B = pick(R, BIZ);
  const d = until(() => {
    const m = int(R, 3, 4), neg = B.vals.filter(v => v < 0), pos = B.vals.filter(v => v > 0);
    const nn = m === 4 ? 2 : int(R, 1, 2);
    const xs = [...shuffle(R, neg.slice()).slice(0, nn), ...shuffle(R, pos.slice()).slice(0, m - nn)];
    return sorted({ xs, ps: hundredths(R, m, 5, 10) });
  }, o => gapOk(o.xs));
  const kind = d.xs.filter(x => x < 0).length >= 2 ? int(R, 0, 2) : int(R, 0, 1);
  const negs = d.xs.filter(x => x < 0);
  const T = kind === 2 ? -pick(R, negs) : 0;
  const v = kind === 0 ? d.xs[0]! : kind === 1 ? round2(d.xs.reduce((s, x, i) => s + (x < 0 ? d.ps[i]! : 0), 0)) : round2(d.xs.reduce((s, x, i) => s + (x <= -T ? d.ps[i]! : 0), 0));
  const ask = ['the <b>worst case</b>: the lowest possible net payoff', 'the <b>chance of a loss</b>, P(net payoff < $0)', `the <b>chance of losing at least ${M(T)}</b>`][kind]!;
  const slips: Slip[] = kind === 0 ? [[-d.xs[0]!, undefined, 'A loss is a negative net payoff.'], [d.xs[d.ps.indexOf(Math.max(...d.ps))]!, MC.mode, 'That is the most likely value; the worst case is the lowest one.']]
    : kind === 1 ? [[round2(negs.length / d.xs.length), MC.equiprob, 'The values are not equally likely: add the probabilities of the losing values.'], [round2(1 - v), undefined, 'That is the chance of a gain. Add the probabilities of the negative values.']]
      : [[round2(d.xs.reduce((s, x, i) => s + (x < -T ? d.ps[i]! : 0), 0)), undefined, `“At least ${M(T)}” includes a loss of exactly ${M(T)}.`], [round2(d.xs.reduce((s, x, i) => s + (x < 0 ? d.ps[i]! : 0), 0)), undefined, `Only losses of ${M(T)} or more count.`]];
  return num({ id: `riskRead-${n}`, family: 'riskRead', prompt: `${B.who}: the net payoff is ${d.xs.map((x, i) => `${M(x)} with probability ${pd(d.ps[i]!)}`).join(', ')}. What is ${ask}?${kind === 0 ? NEG : ''}`,
    board: kind === 0 ? '\\text{worst case} = \\,?' : kind === 1 ? 'P(X < 0) = \\,?' : `P(X \\le ${mx(-T)}) = \\,?`,
    solution: kind === 0 ? ['The worst case is the lowest value in the distribution, whatever its probability.', `Lowest: ${ans(M(v))}.`]
      : [`Losing values: ${d.xs.filter(x => (kind === 1 ? x < 0 : x <= -T)).map(M).join(' and ')}.`, `Add their probabilities: ${d.xs.map((x, i) => ((kind === 1 ? x < 0 : x <= -T) ? pd(d.ps[i]!) : '')).filter(Boolean).join(' + ')} = ${ans(pd(v))}.`],
    picture: { pics: [barsOf(d, 'Net payoff (dollars)')] } },
    v, 'Right: a number for the downside, beside the EV.', slips, kind === 0 ? 'Find the lowest value of the net payoff.' : 'Add the probabilities of the values that count as that loss.');
};

export const riskCompare: Gen = (R, n) => retry(() => {
  const caseA = R() < 0.5;
  if (caseA) {
    const S = pick(R, [40, 50, 60, 80, 100]), p = pick(R, [0.25, 0.4, 0.5, 0.6, 0.75]), hi = pick(R, [150, 200, 250, 300]);
    const lo = round2((S - p * hi) / (1 - p));
    if (!Number.isInteger(lo) || lo === hi || Math.abs(lo) > 400) throw new Reroll();
    const d: Dist = sorted({ xs: [hi, lo], ps: [p, 1 - p] });
    const opts: Opt[] = [
      { t: `Same expected value, but the gamble’s result ranges from ${M(lo)} to ${M(hi)}${lo < 0 ? ', including a loss' : ''}: more risk`, ok: true, say: 'Right: the EV is the same; the spread (and any chance of a loss) is the risk.' },
      { t: 'Same expected value, so the same risk', mc: MC.equalMeans, say: `Equal means do not make equal distributions: the sure ${M(S)} never varies; the gamble swings from ${M(lo)} to ${M(hi)}.` },
      { t: `The gamble is less risky, because its best case is ${M(hi)}`, mc: MC.riskPrize, say: 'A big best case is not low risk: risk is about how far results spread, especially downward.' },
      { t: `The sure ${M(S)} has the higher expected value`, say: `Check: ${pd(p)} × ${M(hi)} + ${pd(1 - p)} × ${par(lo)} = ${M(S)}. The EVs are equal.` },
    ];
    return ch(R, { id: `riskCompare-${n}`, family: 'riskCompare', prompt: `Option 1: a sure ${M(S)}. Option 2, a gamble: ${M(hi)} with probability ${pd(p)}, otherwise ${M(lo)}. Which statement about the two options is right?`, board: '\\text{expected value and risk}',
      solution: [`EV of the gamble: ${pd(p)} × ${M(hi)} + ${pd(1 - p)} × ${par(lo)} = ${M(S)}, the same as the sure option.`, `But one gamble lands on ${M(lo)} or ${M(hi)}, never on ${M(S)}: more spread, more risk.`],
      picture: { pics: [barsOf(d, 'Net payoff (dollars)', 'Option 2: the gamble')] } }, opts, { max: 3 });
  }
  const eB = pick(R, [100, 150, 200]), L = pick(R, [300, 500, 800, 1000]), q = pick(R, [0.1, 0.2, 0.25]), G = pick(R, [300, 400, 500, 600]);
  const eA = round2((1 - q) * G - q * L);
  if (eA <= eB + 20) throw new Reroll();
  const opts: Opt[] = [
    { t: `A has the higher expected value, but a ${pd(q)} chance of losing ${M(L)}; B never loses`, ok: true, say: 'Right: a higher reward that comes with a real downside. Which is better depends on how much loss you can take.' },
    { t: 'A is better in every way: its expected value is higher', mc: MC.equalMeans, say: `The EV says nothing about the ${pd(q)} chance of ${an(L)} ${M(L)} loss: the distributions differ in more than their means.` },
    { t: `B is riskier, because A can pay ${M(G)}`, mc: MC.riskPrize, say: 'Risk is the downside and the spread, not the size of the best prize.' },
    { t: 'They have the same risk, because both are uncertain', say: `B gives ${M(eB)} for sure; A swings between ${M(-L)} and ${M(G)}.` },
  ];
  return ch(R, { id: `riskCompare-${n}`, family: 'riskCompare', prompt: `Option A: ${M(G)} with probability ${pd(1 - q)}, ${M(-L)} with probability ${pd(q)}. Option B: a sure ${M(eB)}. Which statement is right?`, board: '\\text{expected value and risk}',
    solution: [`E(A) = ${pd(1 - q)} × ${M(G)} + ${pd(q)} × ${par(-L)} = ${M(eA)} > ${M(eB)}.`, `Downside: A loses ${M(L)} with probability ${pd(q)}; B never loses.`],
    picture: { pics: [barsOf(sorted({ xs: [G, -L], ps: [1 - q, q] }), 'Net payoff (dollars)', 'Option A')] } }, opts, { max: 3 });
});

// ===================== s3-payoff-sd =====================
export const sdCompute: Gen = (R, n) => retry(() => {
  const m = pick(R, [2, 2, 3]);
  const xs = m === 2 ? [pick(R, [-200, -100, -50, -20]), pick(R, [50, 100, 150, 300])] : [pick(R, [-300, -100, -50]), pick(R, [0, 20, 50]), pick(R, [100, 200, 400])];
  const ps = m === 2 ? (() => { const p = pick(R, [0.2, 0.25, 0.4, 0.6, 0.75, 0.8]); return [1 - p, p]; })() : hundredths(R, 3, 10, 10);
  const d: Dist = { xs, ps: ps.map(p => round2(p)) };
  const e = evOf(d), sd = sdOf(d), vr = varOf(d);
  if (Math.abs(e * 100 - Math.round(e * 100)) > 1e-6 || !noTie(sd, 2) || near(sd, Math.round(sd), 0.01)) throw new Reroll();
  const un = (() => { const mu = xs.reduce((a, b) => a + b, 0) / xs.length; return Math.sqrt(xs.reduce((s, x) => s + (x - mu) ** 2, 0) / xs.length); })();
  const sdv = round2(sd);
  const devs = d.xs.map((x, i) => `${pd(d.ps[i]!)} × (${M(x)} − ${par(e)})²`);
  return num({ id: `sdCompute-${n}`, family: 'sdCompute', prompt: `A small investment’s net payoff is ${d.xs.map((x, i) => `${M(x)} with probability ${pd(d.ps[i]!)}`).join(', ')}. Its expected value is ${M(e)}. Find the <b>standard deviation</b> of the payoff, SD = √(Σ (x − μ)² P(x)), to the nearest cent.${CALC}`,
    board: `\\sigma = \\sqrt{\\textstyle\\sum (x - \\mu)^2 P(x)}`,
    solution: [`Squared deviations from μ = ${M(e)}, weighted: ${devs.join(' + ')}.`, `That sum is the variance: ${big(round2(vr))} (square dollars).`, `SD = √${big(round2(vr))} ≈ ${ans(Mc(sdv))}.`], picture: { pics: [barsOf(sorted(d), 'Net payoff (dollars)')] } },
    sdv, `Right: a typical result is about ${Mc(sdv)} away from the EV.`, [[round2(vr), MC.varForSd, 'That is the variance, in square dollars. Take its square root for the SD.'], [round2(un), MC.equiprob, 'That treats the values as equally likely. Weight each squared deviation by its probability.']],
    'Weight each squared distance from the mean by its probability, add, then take the square root.', 0.005);
});

export const sdPick: Gen = (R, n) => retry(() => {
  const evs = shuffle(R, [60, 80, 100, 120, 140]).slice(0, 3), sds = shuffle(R, [15, 30, 45, 60, 90]).slice(0, 3);
  const rule1 = R() < 0.5;
  const names = ['A', 'B', 'C'];
  const iMaxE = evs.indexOf(Math.max(...evs)), iMaxS = sds.indexOf(Math.max(...sds));
  let right: number, T: number, ruleTxt: string;
  if (rule1) {
    T = pick(R, [40, 50, 70]);
    const ok = [0, 1, 2].filter(i => sds[i]! <= T);
    if (ok.length < 1 || ok.length > 2 || sds[iMaxE]! <= T) throw new Reroll();
    right = ok.reduce((a, b) => (evs[b]! > evs[a]! ? b : a));
    ruleTxt = `the highest expected value among options with an SD of at most ${M(T)}`;
  } else {
    T = pick(R, [80, 90, 100]);
    const ok = [0, 1, 2].filter(i => evs[i]! >= T);
    if (ok.length !== 2) throw new Reroll();
    right = ok.reduce((a, b) => (sds[b]! < sds[a]! ? b : a));
    if (right === iMaxE) throw new Reroll();
    ruleTxt = `the lowest SD among options with an expected value of at least ${M(T)}`;
  }
  if (right === iMaxS) throw new Reroll();
  const opts: Opt[] = [0, 1, 2].map(i => ({
    t: `Option ${names[i]}`, ok: i === right,
    mc: i === right ? undefined : i === iMaxS ? MC.sdBetter : i === iMaxE ? MC.prefModel : undefined,
    say: i === right ? 'Right: it meets the rule.' : i === iMaxS ? 'A bigger SD is more spread, not more value: check the rule.' : i === iMaxE ? 'The highest expected value is not the rule here: the rule limits the risk too.' : 'Check each option against both parts of the rule.',
  }));
  const t: TablePic = { kind: 'table', rows: [{ head: tt('option'), cells: names }, { head: 'E', cells: evs.map(mx) }, { head: tt('SD'), cells: sds.map(mx) }] };
  return ch(R, { id: `sdPick-${n}`, family: 'sdPick', prompt: `Three ways to run a weekend stall have these expected net payoffs and SDs: ${names.map((x, i) => `${x}: E = ${M(evs[i]!)}, SD = ${M(sds[i]!)}`).join('; ')}. <b>The rule: ${ruleTxt}.</b> Which option?`,
    board: '\\text{reward } E,\\ \\text{risk } SD',
    solution: [rule1 ? `SD at most ${M(T)}: ${[0, 1, 2].filter(i => sds[i]! <= T).map(i => names[i]).join(' and ')}.` : `EV at least ${M(T)}: ${[0, 1, 2].filter(i => evs[i]! >= T).map(i => names[i]).join(' and ')}.`, `Of those, ${rule1 ? 'the highest EV' : 'the lowest SD'}: option ${names[right]}.`], picture: { pics: [t] } }, opts, { keep: true });
});

export const sdDiversify: Gen = (R, n) => {
  const S = pick(R, [1000, 2000, 4000]), g = pick(R, [0.3, 0.4, 0.5]), l = pick(R, [0.1, 0.2]);
  const linked = R() < 0.4;
  const what = linked ? 'two food stalls at the same outdoor festival (one storm hits both)' : 'two food stalls at festivals in different states (the weather at one tells nothing about the other)';
  const opts: Opt[] = linked
    ? [{ t: 'The same expected payoff and the same SD: the stalls rise and fall together', ok: true, say: 'Right: perfectly linked halves move together, so splitting removes no risk.' },
       { t: 'The same expected payoff and a smaller SD', mc: MC.linked, say: 'Splitting only lowers the SD when the results can offset each other. One storm hits both stalls.' },
       { t: 'A higher expected payoff, because there are two chances', mc: MC.divEv, say: 'Splitting the stake keeps the expected payoff: half of each EV adds back to the same EV.' },
       { t: 'A smaller expected payoff and a smaller SD', say: 'The expected payoff is unchanged: each half has half the EV.' }]
    : [{ t: 'The same expected payoff and a smaller SD', ok: true, say: 'Right: independent halves often offset, so the results bunch nearer the EV.' },
       { t: 'A higher expected payoff, because there are two chances', mc: MC.divEv, say: 'Splitting the stake keeps the expected payoff: half of each EV adds back to the same EV.' },
       { t: 'The same expected payoff and the same SD', say: 'Independent halves can offset (one good, one bad), so the combined result spreads less.' },
       { t: 'A smaller expected payoff and a smaller SD', say: 'The expected payoff is unchanged: each half has half the EV.' }];
  return ch(R, { id: `sdDiversify-${n}`, family: 'sdDiversify', prompt: `Putting all ${M(S)} into one festival food stall returns ${pc0(g)} or loses ${pc0(l)}, each with probability 0.5. Instead you split it: ${M(S / 2)} into each of ${what}, each with the same chances. Compared with one stall, the split gives…`,
    board: '\\text{split the stake: } E\\ ?\\ \\ SD\\ ?',
    solution: [`Each half has half the expected payoff, so together the EV is unchanged.`, linked ? 'The two halves always do the same thing, so the combined result is just the one-stall result: same spread.' : 'Independent halves: sometimes one is up and one is down, so the total spreads less than one stall: smaller SD.'] }, opts, { max: 3 });
};
const pc0 = (x: number) => `${Math.round(x * 100)}%`;

// ===================== s3-repetition-pooling =====================
export const poolTotal: Gen = (R, n) => {
  const k = int(R, 0, 2);
  if (k === 0) {
    const c = pick(R, [1, 2, 5]), back = pick(R, [0.5, 0.55, 0.6, 0.65]), N = pick(R, [100, 200, 500]);
    const e = round2(c * back - c), v = round2(N * e);
    return num({ id: `poolTotal-${n}`, family: 'poolTotal', prompt: `${An(c)} ${M(c)} scratch ticket pays back ${Mc(c * back)} per ticket on average, so its expected net payoff is ${Mc(e)}. Over ${N} tickets, what is the <b>expected total</b> net payoff?${NEG}`, board: `${N} \\times E = \\,?`,
      solution: [`Expected total = number of plays × expected net payoff per play.`, `${N} × ${par(e)} = ${ans(M(v))}: expected, not guaranteed.`] },
      v, `Right: about ${M(v)}, though the actual total will differ.`, [[e, undefined, `That is per ticket; multiply by ${N}.`], [-N * c, undefined, 'That ignores the prizes; use the expected net payoff per ticket.']], 'Multiply the expected net payoff per play by the number of plays.');
  }
  if (k === 1) {
    const P = pick(R, [480, 600, 720, 900]), C = round2(P * pick(R, [0.7, 0.75, 0.8])), N = pick(R, [2000, 5000, 10000]);
    const e = round2(P - C), v = round2(N * e);
    return num({ id: `poolTotal-${n}`, family: 'poolTotal', prompt: `An insurer sells ${big(N)} independent policies at ${M(P)} a year. The expected claims are ${M(C)} per policy. What is the insurer’s <b>expected total</b> profit before expenses?`, board: `${big(N).replace(',', '{,}')} \\times E = \\,?`,
      solution: [`Expected profit per policy: ${M(P)} − ${M(C)} = ${M(e)}.`, `Total: ${big(N)} × ${M(e)} = ${ans(M(v))}.`] },
      v, 'Right: and with many independent policies, the actual average per policy stays close to that.', [[round2(N * P), MC.revenue, 'That is the premium income; subtract the expected claims.'], [e, undefined, `That is per policy; multiply by ${big(N)}.`]], 'Expected profit per policy times the number of policies.');
  }
  const c = pick(R, [2, 3]), e = pick(R, [0.4, 0.6, 0.75, 0.8]), N = pick(R, [300, 400, 600]);
  const v = round2(N * e);
  return num({ id: `poolTotal-${n}`, family: 'poolTotal', prompt: `A school-fair booth charges ${M(c)} a play; its expected net gain is ${Mc(e)} per play. What is its <b>expected total</b> net gain over ${N} plays?`, board: `${N} \\times E = \\,?`,
    solution: ['Expected total = number of plays × expected net gain per play.', `${N} × ${Mc(e)} = ${ans(M(v))}.`] },
    v, 'Right: the expected total; the real total will land near it, not exactly on it.', [[round2(N * c), MC.revenue, 'That is the money taken in; the net gain subtracts the prizes.'], [e, undefined, `That is per play; multiply by ${N}.`]], 'Expected net gain per play times the number of plays.');
};

const POOLS = [
  (R: () => number) => { const N = pick(R, [5000, 10000, 20000, 50000]), P = pick(R, [600, 900, 1200]); return { q: `An insurer covers ${big(N)} independent drivers at ${M(P)} a year each. One family insures its one car with the same insurer. Whose <b>average result per policy</b> will be close to the expected value?`,
    o: [{ t: 'The insurer’s: averages over many independent policies bunch near the EV', ok: true, say: `Right: one family gets $0 or a big claim; ${big(N)} independent policies average out.` },
      { t: 'The family’s: one policy is easier to predict', say: 'One policy pays nothing or a large claim; that is far from the average either way.' },
      { t: 'Both equally: they have the same expected value per policy', mc: MC.equalMeans, say: 'Same EV per policy, but the spread of an average shrinks only with many independent policies.' }] }; },
  (R: () => number) => { const k = pick(R, [2000, 3500, 5000, 8000]), city = pick(R, ['Denver', 'Dallas', 'Omaha', 'Wichita']); return { q: `A hailstorm damages ${big(k)} insured cars in ${city} on the same afternoon. What does that do to the insurer’s pooling?`,
    o: [{ t: 'The claims are linked, so the average claim per policy can land far above the expected value', ok: true, say: 'Right: pooling needs independence; one shared shock moves many policies at once.' },
      { t: 'Nothing: with thousands of policies the average always ends up at the expected value', mc: MC.forces, say: 'Many policies only help when they are independent. A shared storm hits them together.' },
      { t: `It makes another hailstorm in ${city} this year less likely`, mc: MC.gambler, say: 'Weather does not owe anything: one storm does not lower the chance of the next.' }] }; },
  (R: () => number) => { const L = pick(R, [5000, 8000, 12000, 20000]), q = pick(R, [0.01, 0.02, 0.03]); return { q: `A one-time choice has a ${pd(q)} chance of ${an(L)} ${M(L)} loss. What is true about using its expected value?`,
    o: [{ t: 'It is still a sensible guide, but one result can land far from it, so the downside matters too', ok: true, say: 'Right: EV is the long-run center; a single outcome needs a look at the risk.' },
      { t: 'It tells you nothing for a one-time choice', mc: MC.dismisses, say: 'It still summarizes the chances and payoffs; it just does not tell the whole story for one try.' },
      { t: `You will lose ${Mc(q * L)}, the expected loss, since you only choose once`, mc: MC.guaranteed, say: `One try gives $0 or ${an(L)} ${M(L)} loss, never ${Mc(q * L)}.` }] }; },
  (R: () => number) => { const k = int(R, 6, 12), p = pick(R, [0.2, 0.25, 0.3]); return { q: `A player has lost a game ${k} times in a row. The chance of winning is ${pd(p)} on every play. What is the chance of a win on the next play?`,
    o: [{ t: `Still ${pd(p)}: the plays are independent`, ok: true, say: 'Right: the game has no memory.' },
      { t: `More than ${pd(p)}: the results must even out`, mc: MC.gambler, say: 'Independent plays do not catch up. The chance is the same every time.' },
      { t: `Less than ${pd(p)}: the player is on a losing streak`, say: 'A streak does not change the game: the chance is the same every time.' }] }; },
];
export const poolWho: Gen = (R, n) => {
  const P = pick(R, POOLS)(R);
  return ch(R, { id: `poolWho-${n}`, family: 'poolWho', prompt: P.q, board: '\\text{many independent tries vs one}',
    solution: ['Many independent repetitions of an unchanged game: the average bunches near the EV, the total still varies.', 'A shared shock (no independence) or a single try: results can land far from the EV.'] }, P.o as Opt[]);
};

// ===================== s3-model-uncertainty =====================
const KINDS = [
  (R: () => number) => ({ t: `Even with a fair ${pick(R, [6, 8, 12])}-sided die, the next roll could be any of its numbers.`, k: 'rand' }),
  (R: () => number) => { const k = pick(R, [2, 3, 4]), N = pick(R, [20, 25, 30]); return { t: `The repair rate of ${dec(k / N, 2)} comes from only ${N} laptops (${k} repairs), so the true rate could be quite different.`, k: 'model' }; },
  (R: () => number) => ({ t: `The rain forecast is ${pick(R, [20, 30, 40, 60])}%, and it may or may not rain on Saturday.`, k: 'rand' }),
  (R: () => number) => ({ t: `The café owner guessed a ${pick(R, [20, 25, 30, 35])}% dessert rate before opening; no sales data exists yet.`, k: 'model' }),
  (R: () => number) => { const a = pick(R, [150, 200, 250]); return { t: `The repair might cost anywhere from ${M(a)} to ${M(2 * a)}; nobody has a quote yet.`, k: 'model' }; },
  (R: () => number) => ({ t: `In a raffle of ${big(pick(R, [300, 500, 1000]))} tickets, your ticket may or may not be drawn.`, k: 'rand' }),
];
export const muKind: Gen = (R, n) => {
  const K = pick(R, KINDS)(R);
  const opts: Opt[] = [
    { t: 'Randomness within the model: the chances are known, the result is not', ok: K.k === 'rand', say: K.k === 'rand' ? 'Right: even a perfect model cannot say which outcome comes next.' : 'Here the chances themselves are unsure, not just the outcome.' },
    { t: 'Uncertainty about the model: an input (a probability or a cost) is not known well', ok: K.k === 'model', say: K.k === 'model' ? 'Right: the input could be off, so the EV built on it could be off too.' : 'The chances are known here; only the result is unknown.' },
    { t: 'No uncertainty: once you compute with the numbers, the answer is exact', mc: MC.inputsExact, say: 'Exact arithmetic on an estimate still gives an estimate.' },
  ];
  return ch(R, { id: `muKind-${n}`, family: 'muKind', prompt: `“${K.t}” Which kind of uncertainty is this?`, board: '\\text{randomness or model uncertainty?}',
    solution: ['Randomness: the model’s chances are known, but one outcome is not.', 'Model uncertainty: a probability or a cost in the model is itself unsure.'] }, opts, { keep: true });
};
export const muRange: Gen = (R, n) => {
  const k = int(R, 0, 1);
  if (k === 0) {
    const Rp = pick(R, [300, 400, 500, 600]), a = pick(R, [0.05, 0.1]), b = pick(R, [0.15, 0.2, 0.25]);
    const lo = round2(-Rp * b), hi = round2(-Rp * a), mid = round2(-Rp * (a + b) / 2);
    return pair({ id: `muRange-${n}`, family: 'muRange', prompt: `Skipping a phone plan: a repair costs ${M(Rp)}. The repair chance is only known to be between ${pd(a)} and ${pd(b)}. Over that range, what are the <b>lowest and highest</b> expected net payoffs of skipping?${NEG}`,
      board: `E = -${Rp}\\,p \\qquad ${pd(a)} \\le p \\le ${pd(b)}`,
      solution: [`E = p × ${par(-Rp)}. At p = ${pd(b)}: ${M(lo)}; at p = ${pd(a)}: ${M(hi)}.`, `So E is between ${ans(M(lo))} and ${ans(M(hi))}.`] },
      'lowest', 'highest', '', lo, hi, 'Right: a range of EVs, not one exact number.', [[hi, lo, undefined, 'Lowest first: the more negative value is lower.'], [mid, mid, MC.inputsExact, 'One middle value hides the uncertainty: give the EV at both ends of the range.']], 'Compute the EV at each end of the probability range.');
  }
  const G = pick(R, [1500, 2000, 2400]), L = pick(R, [400, 500, 600]), a = pick(R, [0.1, 0.2]), b = pick(R, [0.3, 0.4]);
  const lo = round2((1 - b) * G - b * L), hi = round2((1 - a) * G - a * L), mid = round2((1 - (a + b) / 2) * G - ((a + b) / 2) * L);
  return pair({ id: `muRange-${n}`, family: 'muRange', prompt: `An outdoor event nets ${M(G)} if dry and ${M(-L)} if it rains. Forecasters disagree: the chance of rain is somewhere from ${pd(a)} to ${pd(b)}. What are the <b>lowest and highest</b> expected net payoffs over that range?`,
    board: `E = (1 - p)(${G}) + p(-${L})`,
    solution: [`At p = ${pd(b)}: ${pd(1 - b)} × ${M(G)} + ${pd(b)} × ${par(-L)} = ${M(lo)}.`, `At p = ${pd(a)}: ${pd(1 - a)} × ${M(G)} + ${pd(a)} × ${par(-L)} = ${M(hi)}. So from ${ans(M(lo))} to ${ans(M(hi))}.`] },
    'lowest', 'highest', '', lo, hi, 'Right: the uncertain input becomes a range of EVs.', [[hi, lo, undefined, 'Lowest first: more rain means a lower EV.'], [mid, mid, MC.inputsExact, 'One middle value hides the uncertainty: give the EV at both ends.']], 'Compute the EV at each end of the rain range.');
};

// ===================== s3-risk-preference =====================
export const prefConstraint: Gen = (R, n) => retry(() => {
  const T = pick(R, [200, 300, 500]);
  const A = { G: pick(R, [800, 1000, 1200]), L: T + pick(R, [100, 200, 300]), q: pick(R, [0.2, 0.25]) };
  const Bo = { G: pick(R, [400, 500, 600]), L: pick(R, [100, 150, T]), q: pick(R, [0.2, 0.3]) };
  const eA = round2((1 - A.q) * A.G - A.q * A.L), eB = round2((1 - Bo.q) * Bo.G - Bo.q * Bo.L), C = pick(R, [150, 200, 250]);
  if (!(eA > eB + 20 && eB > C + 20)) throw new Reroll();
  // the plans get their letters at random: [risky, safe-enough, sure]
  const L3 = shuffle(R, ['A', 'B', 'C']), [lr, lm, ls] = L3 as [string, string, string];
  const desc: Record<string, string> = { [lr]: `${M(A.G)} with probability ${pd(1 - A.q)}, ${M(-A.L)} with probability ${pd(A.q)}`, [lm]: `${M(Bo.G)} with probability ${pd(1 - Bo.q)}, ${M(-Bo.L)} with probability ${pd(Bo.q)}`, [ls]: `a sure ${M(C)}` };
  const ev: Record<string, number> = { [lr]: eA, [lm]: eB, [ls]: C }, worst: Record<string, number> = { [lr]: -A.L, [lm]: -Bo.L, [ls]: C };
  const opts: Opt[] = [
    { t: `Plan ${lm}`, ok: true, say: `Right: ${lr} could lose ${M(A.L)}, more than ${M(T)}; of the plans within the limit, ${lm} has the higher EV (${M(eB)} vs ${M(C)}).` },
    { t: `Plan ${lr}`, mc: MC.prefModel, say: `${lr} has the highest EV (${M(eA)}), but it can lose ${M(A.L)}: that breaks the stated limit. Choosing within a limit is rational.` },
    { t: `Plan ${ls}`, say: `${ls} is safe, but ${lm} is safe enough too (worst case ${M(-Bo.L)}) and has the higher EV.` },
  ];
  const t: TablePic = { kind: 'table', rows: [{ head: tt('plan'), cells: ['A', 'B', 'C'] }, { head: 'E', cells: [null, null, null] }, { head: tt('worst'), cells: [null, null, null] }], reveal: { cells: [[null, null, null], ['A', 'B', 'C'].map(x => mx(ev[x]!)), ['A', 'B', 'C'].map(x => mx(worst[x]!))] } };
  return ch(R, { id: `prefConstraint-${n}`, family: 'prefConstraint', prompt: `A small bakery picks a plan for a holiday market. ${['A', 'B', 'C'].map(x => `${x}: ${desc[x]}.`).join(' ')} <b>The owner’s rule: never risk losing more than ${M(T)}; within that, the highest expected value.</b> Which plan?`,
    board: `\\text{worst} \\ge ${mx(-T)} \\qquad \\text{then highest } E`,
    solution: [`EVs: ${['A', 'B', 'C'].map(x => `${x} ${M(ev[x]!)}`).join(', ')}. Worst cases: ${['A', 'B', 'C'].map(x => `${x} ${M(worst[x]!)}`).join(', ')}.`, `${lr} breaks the ${M(T)} limit. Of ${[lm, ls].sort().join(' and ')}, ${lm} has the higher EV.`], picture: { pics: [t] } }, opts);
});

const WHYS = [
  (R: () => number) => { const W = pick(R, [99, 129, 179]), Rp = pick(R, [400, 600, 800]); return { q: `${An(W)} ${M(W)} extended warranty covers ${an(Rp)} ${M(Rp)} repair, and its expected value for the buyer is negative. Many people buy one anyway. When can that be a reasonable choice?`,
    o: [{ t: `When ${an(Rp)} ${M(Rp)} bill would be hard to pay: the buyer trades a small expected loss for no large loss`, ok: true, say: 'Right: an affordability limit is a real reason; the store, with many warranties, can rely on the average.' },
      { t: 'Never: choosing a negative-EV option is always irrational', mc: MC.prefModel, say: 'With a limit on the loss you can take, a lower-EV but safer option can be the rational choice.' },
      { t: 'When the buyer really needs the item, which makes a breakdown less likely', mc: MC.desire, say: 'Needing the item does not change how likely it is to break.' },
      { t: 'Always: expected values say nothing about one purchase', mc: MC.dismisses, say: 'The EV still tells you the warranty costs more than it pays on average; the choice depends on your risk limit.' }] }; },
  (R: () => number) => { const s = pick(R, [45, 60, 75, 90]); return { q: `A hockey team trails by one goal with ${s} seconds left and pulls its goalie for an extra attacker. That raises the chance of tying, but also of losing by two. Why can that be smart?`,
    o: [{ t: 'Losing by one or by two counts the same, so only the chance of tying matters', ok: true, say: 'Right: the objective (not losing) makes the riskier choice the better one.' },
      { t: 'It cannot be smart: it raises the chance of conceding', mc: MC.prefModel, say: 'Conceding again costs nothing extra in the standings; what counts is the chance to tie.' },
      { t: 'Because the team wants a goal badly, so a goal becomes more likely', mc: MC.desire, say: 'Wanting a goal does not raise its chance; the extra attacker does.' }] }; },
  (R: () => number) => { const c = pick(R, [1, 2, 5]), b = pick(R, [0.5, 0.55, 0.6]); return { q: `${An(c)} ${M(c)} lottery ticket pays back about ${Mc(c * b)} on average, an expected net payoff of ${Mc(c * b - c)}. Someone buys one each month. When is that reasonable?`,
    o: [{ t: 'When it is a small, affordable cost of entertainment, not a plan to make money', ok: true, say: 'Right: the EV says it is not an investment; as entertainment it can be a fair price.' },
      { t: 'When the buyer has lost many times, so a win is due', mc: MC.gambler, say: 'Draws are independent: past losses do not make a win due.' },
      { t: 'Never: any negative-EV choice is irrational', mc: MC.prefModel, say: 'People pay for fun all the time; the EV tells you the cost of the fun.' }] }; },
];
export const prefWhy: Gen = (R, n) => {
  const W = pick(R, WHYS)(R);
  return ch(R, { id: `prefWhy-${n}`, family: 'prefWhy', prompt: W.q, board: '\\text{same model, different preference}',
    solution: ['The probabilities and EVs stay the same; a stated preference or limit can change which option is best.', 'Wishing and past results do not change the chances.'] }, W.o as Opt[], { max: 3 });
};

// ===================== s3-conditional-recommendation =====================
export const recPick: Gen = (R, n) => retry(() => {
  const G = pick(R, [1600, 2000, 2400]), L = pick(R, [400, 600, 800]), S = pick(R, [1000, 1200, 1400]), a = pick(R, [0.1, 0.15]), b = pick(R, [0.2, 0.25, 0.3, 0.35]);
  const eLo = round2((1 - b) * G - b * L), eHi = round2((1 - a) * G - a * L);
  const cross = eLo < S - 20 && eHi > S + 20;
  if (!cross && eLo <= S + 20) throw new Reroll();
  const right: Opt = cross
    ? { t: `It depends on the rain chance: at ${pd(a)} outdoors has the higher EV, at ${pd(b)} the gym does. Pin down the forecast, and outdoors only if the club can absorb ${an(L)} ${M(L)} loss`, ok: true, say: 'Right: the EV order flips inside the range, so the recommendation must be conditional on the forecast, and on the downside.' }
    : { t: `Outdoors if the club can absorb ${an(L)} ${M(L)} loss: its EV is higher across the whole rain range. If it cannot, rent the gym`, ok: true, say: 'Right: the EV comparison, the downside, the uncertain input and the club’s limit, all in one sentence.' };
  const opts: Opt[] = [right,
    { t: 'Outdoors, because its expected value is higher', mc: MC.unqualified, say: cross ? `Not across the whole range: at ${pd(b)} the gym’s EV is higher. A recommendation must say when it holds.` : `True on EV, but the recommendation should name the ${M(L)} downside and when it matters.` },
    { t: 'The gym, because I prefer playing it safe', mc: MC.prefJustify, say: 'A preference is fine, but tie the reason to the numbers: the EV comparison and the size of the loss.' },
    { t: 'Outdoors: last year’s party stayed dry', mc: MC.singleJudges, say: 'One past day says little about the chance of rain this time.' },
  ];
  return ch(R, { id: `recPick-${n}`, family: 'recPick', prompt: `A club’s fundraiser: outdoors nets ${M(G)} if it stays dry and ${M(-L)} if it rains; the gym nets a sure ${M(S)}. The chance of rain is somewhere from ${pd(a)} to ${pd(b)}, so E(outdoors) is between ${M(eLo)} and ${M(eHi)}. Which recommendation is best?`,
    board: '\\text{which recommendation?}',
    solution: cross ? [`At ${pd(a)}: ${M(eHi)} > ${M(S)}, outdoors is higher. At ${pd(b)}: ${M(eLo)} < ${M(S)}, the gym is higher.`, `The best choice depends on where the rain chance really is, and outdoors also risks ${an(L)} ${M(L)} loss.`]
      : [`Even at the worst rain chance, ${pd(b)}, outdoors has the higher EV (${M(eLo)} > ${M(S)}).`, `But outdoors can lose ${M(L)}: the choice depends on whether the club can afford that.`] }, opts, { max: 3 });
});

export const recCondition: Gen = (R, n) => {
  const it = until(() => ({ G: pick(R, [1500, 1800, 2000, 2400, 3000]), L: pick(R, [300, 400, 500, 600, 1000]), S: pick(R, [900, 1000, 1200, 1400, 1600]) }),
    o => { const p = (o.G - o.S) / (o.G + o.L); return p > 0.05 && p < 0.6 && Math.abs(p * 100 - Math.round(p * 100)) < 1e-9 && !near(p, 0.5); });
  const { G, L, S } = it, p = round2((G - S) / (G + L));
  return num({ id: `recCondition-${n}`, family: 'recCondition', prompt: `Outdoors nets ${M(G)} if dry and ${M(-L)} if it rains; the hall nets a sure ${M(S)}. For which rain chance p do the two options have the <b>same expected value</b>? (Above it, recommend the hall; below it, outdoors.) Give p as a decimal.`,
    board: `(1 - p)(${G}) + p(-${L}) = ${S}`,
    solution: [`E(outdoors) = ${big(G)} − ${big(G + L)}p. Set it equal to ${big(S)}: ${big(G)} − ${big(G + L)}p = ${big(S)}.`, `${big(G + L)}p = ${big(G - S)}, so p = ${big(G - S)}/${big(G + L)} = ${ans(pd(p))}.`] },
    p, `Right: below ${pd(p)} go outdoors, above it rent the hall (by EV).`, [[round2((G - S) / G), undefined, `The rain branch changes too: E(outdoors) = ${big(G)} − ${big(G + L)}p, not ${big(G)} − ${big(G)}p.`], [round2(1 - p), undefined, 'That is the chance of a dry day at the changeover; the question asks for the rain chance.']],
    'Write E(outdoors) as a function of p, set it equal to the hall’s sure amount, and solve.', 0.0005);
};
void Mc; void big; void evOf;
