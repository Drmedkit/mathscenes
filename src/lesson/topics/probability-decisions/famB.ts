// famB.ts: stage 2 families of "Using probability to make decisions": a common basis (same period, net not gross),
// expected net payoff (from a net table, by the E(receipts) − cost route, expected cost of a policy), the fair price,
// the EV decision rule (gain and cost framing), the assumption audit, sensitivity (scenario tables and the changeover)
// and insurance / warranty spreadsheets over claim scenarios. Pure: no DOM.
import type { BarsPic, TablePic } from '../expected-value/DistPic';
import type { TreePic } from './DecTree';
import { type Dist, type Gen, type Opt, type Slip, CALC, MC, an, An, M, Mc, NEG, ans, big, ch, dec, evOf, hundredths, int, mx, near, num, par, pc, pd, pick, retry, Reroll, shuffle, tt, until } from './common';

const round2 = (v: number) => Math.round(v * 100 + Math.sign(v) * 1e-7) / 100;
const cents = (v: number) => Math.abs(Math.round(v * 100) - v * 100) < 1e-6;

// ===================== s2-common-basis =====================
const PERIODS = [
  { what: 'phone protection', mo: [8, 10, 12, 15], once: [149, 179, 199, 229], span: 24, spanTxt: '2 years', onceTxt: 'a one-time 2-year plan' },
  { what: 'renters insurance', mo: [14, 16, 18, 22], once: [150, 168, 180, 204], span: 12, spanTxt: 'one year', onceTxt: 'a yearly policy paid up front' },
  { what: 'roadside assistance', mo: [6, 8, 9, 11], once: [60, 79, 89, 99], span: 12, spanTxt: 'one year', onceTxt: 'a yearly membership' },
];
export const basisPeriod: Gen = (R, n) => {
  const P = pick(R, PERIODS);
  const { m, T } = until(() => ({ m: pick(R, P.mo), T: pick(R, P.once) }), o => o.m * P.span - o.T >= 10 && o.T - o.m > 0);
  const v = m * P.span - T;
  const t: TablePic = { kind: 'table', rows: [{ head: tt('option'), cells: [tt('monthly'), tt('up front')] }, { head: tt('price'), cells: [`\\$${m}\\text{/mo}`, mx(T)] }, { head: tt(P.spanTxt), cells: [null, null] }], reveal: { cells: [[null, null], [null, null], [mx(m * P.span), mx(T)]] } };
  return num({ id: `basisPeriod-${n}`, family: 'basisPeriod', prompt: `Two ways to pay for ${P.what}: ${M(m)} a month, or ${P.onceTxt} for ${M(T)}. The coverage is the same. Over ${P.spanTxt}, <b>how much more</b> does the monthly option cost?`,
    board: '\\text{monthly} - \\text{up front} = \\,?',
    solution: [`Same period first: ${P.span} months × ${M(m)} = ${M(m * P.span)}.`, `${M(m * P.span)} − ${M(T)} = ${ans(M(v))} more for the monthly option.`], picture: { pics: [t] } },
    v, `Right: both over ${P.spanTxt}.`, [[T - m, MC.units, `${M(T)} covers ${P.spanTxt} but ${M(m)} covers one month: convert to the same period first.`], [m * P.span, undefined, `That is the monthly total; subtract the ${M(T)} up-front price.`]],
    `Put both on the same period: ${P.span} months of ${M(m)}, then compare with ${M(T)}.`);
};

const BOOTHS = ['a ring-toss booth', 'a duck-pond booth', 'a basketball free-throw booth', 'a balloon-dart booth'];
export const basisNet: Gen = (R, n) => {
  const { N, c, Y } = until(() => { const N = pick(R, [200, 250, 400, 500]), c = pick(R, [1, 2, 3, 5]); const Y = Math.round(N * c * (0.3 + 0.4 * R()) / 10) * 10; return { N, c, Y }; }, o => cents((o.N * o.c - o.Y) / o.N) && o.Y > 0 && (o.N * o.c - o.Y) % o.N !== 0);
  const v = round2((N * c - Y) / N);
  return num({ id: `basisNet-${n}`, family: 'basisNet', prompt: `${cap(pick(R, BOOTHS))} at a school fair sold ${big(N)} plays at ${M(c)} each and paid out ${M(Y)} in prizes. What was the booth’s <b>net gain per play</b>?`,
    board: `\\dfrac{\\text{take} - \\text{prizes}}{${N}} = \\,?`,
    solution: [`Net, not gross: ${big(N)} × ${M(c)} = ${M(N * c)} taken in, minus ${M(Y)} paid out = ${M(N * c - Y)}.`, `Per play: ${M(N * c - Y)} ÷ ${big(N)} = ${ans(Mc(v))}.`] },
    v, 'Right: net gain, on a per-play basis.', [[c, MC.revenue, `${M(c)} is what each play brings in. Net gain subtracts the prizes paid out.`], [N * c - Y, undefined, `That is the net gain for all ${big(N)} plays; the question asks per play.`], [round2(Y / N), undefined, 'That is the prize money per play; the booth’s gain is take minus prizes.']],
    'Take in minus prizes paid out, then divide by the number of plays.', 0.005);
};
const cap = (s: string) => s[0]!.toUpperCase() + s.slice(1);

// ===================== s2-expected-net-payoff =====================
const LADDERS: Record<number, number[]> = { 1: [0, 2, 5, 10], 2: [0, 4, 10, 20], 3: [0, 5, 10, 25], 5: [0, 10, 20, 50] };
export const evNet: Gen = (R, n) => {
  const it = until(() => {
    const c = pick(R, [1, 2, 3, 5]), lad = LADDERS[c]!, m = int(R, 3, 4);
    const prizes = m === 4 ? lad.slice() : [0, ...shuffle(R, lad.slice(1)).slice(0, 2).sort((a, b) => a - b)];
    const ps = hundredths(R, m, 5, 5).sort((a, b) => b - a); // the biggest chance on $0, then smaller for bigger prizes
    const d: Dist = { xs: prizes.map(x => x - c), ps };
    return { c, d };
  }, o => { const e = evOf(o.d), un = o.d.xs.reduce((a, b) => a + b, 0) / o.d.xs.length; return !near(e, 0) && Math.abs(e - un) > 0.05 && cents(e) && evOf({ xs: o.d.xs.map(x => x + o.c), ps: o.d.ps }) < o.c * 1.3; });
  const { c, d } = it, e = evOf(d), un = d.xs.reduce((a, b) => a + b, 0) / d.xs.length;
  const lo = Math.min(...d.xs), hi = Math.max(...d.xs), step = hi - lo > 30 ? 10 : 5;
  const bars: BarsPic = { kind: 'bars', xs: d.xs, ps: d.ps, labs: d.ps.map(p => pd(p)), axis: { min: Math.floor(lo / step) * step, max: Math.ceil(hi / step) * step, step, pre: '$', name: 'Net payoff X (dollars)', only: true }, y: { max: Math.max(...d.ps) > 0.5 ? 1 : 0.6, step: 0.2, dec: 1 } };
  return num({ id: `evNet-${n}`, family: 'evNet', prompt: `A booth game costs ${M(c)}. The bar graph shows the player’s <b>net payoff</b> X (prize minus the ${M(c)}): ${d.xs.map((x, i) => `${M(x)} with probability ${pd(d.ps[i]!)}`).join(', ')}. What is <b>E(X)</b>, the expected net payoff per play?${NEG}`,
    board: `E(X) = \\textstyle\\sum x\\,P(x) = \\,?`,
    solution: [`The values are already net (the ${M(c)} is inside them). Multiply each by its probability: ${d.xs.map((x, i) => `${pd(d.ps[i]!)} × ${par(x)}`).join(' + ')}.`, `E(X) = ${ans(Mc(e))} per play.`], picture: { pics: [bars] } },
    e, `Right: ${e < 0 ? 'the player loses' : 'the player gains'} ${Mc(Math.abs(e))} per play on average.`, [[round2(un), MC.unweighted, 'That averages the values as if they were equally likely. Weight each by its probability.'], [round2(e - c), MC.costTwice, `The values already include the ${M(c)} price; subtracting it again counts it twice.`], [round2(e + c), MC.revenue, `That is the expected prize. The net payoff subtracts the ${M(c)}.`]],
    'Multiply each net payoff by its probability and add.');
};

export const evRoutes: Gen = (R, n) => {
  const it = until(() => {
    const N = pick(R, [500, 1000, 2000, 2500]), c = pick(R, [2, 5, 10, 20]), G = pick(R, [250, 500, 1000, 2500]), k = int(R, 2, 5), S = pick(R, [25, 50, 100]);
    return { N, c, G, k, S };
  }, o => { const tot = o.G + o.k * o.S; return tot <= 0.6 * o.N * o.c && cents(tot / o.N) && o.G > o.S * 2; });
  const { N, c, G, k, S } = it, tot = G + k * S, eR = round2(tot / N), e = round2(eR - c), wins = k + 1;
  const t: TablePic = { kind: 'table', rows: [{ head: tt('prize'), cells: [mx(G), mx(S), mx(0)] }, { head: tt('tickets'), cells: ['1', String(k), big(N - wins).replace(',', '{,}')] }, { head: 'P', cells: [`\\tfrac{1}{${N}}`, `\\tfrac{${k}}{${N}}`, `\\tfrac{${N - wins}}{${N}}`] }] };
  return num({ id: `evRoutes-${n}`, family: 'evRoutes', prompt: `A charity sells all ${big(N)} raffle tickets at ${M(c)} each. One ticket wins ${M(G)} and ${k} others win ${M(S)} each. What is a buyer’s <b>expected net payoff</b> per ticket?${NEG}`,
    board: `E(\\text{net}) = E(\\text{prize}) - ${mx(c)} = \\,?`,
    solution: [`Expected prize: (${M(G)} + ${k} × ${M(S)}) ÷ ${big(N)} = ${M(tot)} ÷ ${big(N)} = ${Mc(eR)}.`, `The ${M(c)} ticket is paid in every branch, so subtract it once: ${Mc(eR)} − ${M(c)} = ${ans(Mc(e))}.`], picture: { pics: [t] } },
    e, 'Right: expected prize minus the fixed cost.', [[eR, MC.revenue, `${Mc(eR)} is the expected prize; the ticket costs ${M(c)} in every branch.`], [round2(eR - c * wins / N), MC.onlyOnWins, `The ticket price is paid on losing tickets too, not just winning ones: subtract the full ${M(c)}.`]],
    'Expected prize = total prize money ÷ tickets; then subtract the ticket price once.', 0.005);
};

export const evInsureCost: Gen = (R, n) => {
  const P = pick(R, [{ what: 'renters insurance', prem: [180, 216, 240, 264], ded: [250, 500, 1000] }, { what: 'car collision coverage', prem: [600, 720, 840, 960], ded: [500, 1000] }, { what: 'pet insurance', prem: [360, 420, 480], ded: [200, 250, 500] }]);
  const Pm = pick(R, P.prem), d = pick(R, P.ded), p = pick(R, [0.04, 0.05, 0.06, 0.08, 0.1, 0.12, 0.15]);
  const e = round2(Pm + d * p);
  const tree: TreePic = { kind: 'dtree', opts: [{ label: 'policy', outs: [{ label: 'a claim', p: pd(p), v: null }, { label: 'no claim', p: pd(1 - p), v: null }] }], ev: [null], reveal: { v: [[mx(-(Pm + d)), mx(-Pm)]], ev: [`E = ${mx(-e)}`] } };
  return num({ id: `evInsureCost-${n}`, family: 'evInsureCost', prompt: `${cap(P.what)} costs ${M(Pm)} a year with ${an(d)} ${M(d)} deductible. Assume at most one claim a year, with probability ${pd(p)}, and that any loss is more than the deductible. What is the <b>expected yearly cost</b> of the policy (as a positive number)?`,
    board: `E(\\text{cost}) = \\,?`,
    solution: [`Costs per branch: a claim ${M(Pm)} + ${M(d)} = ${M(Pm + d)} (probability ${pd(p)}); no claim ${M(Pm)} (probability ${pd(1 - p)}).`, `E = ${pd(p)} × ${M(Pm + d)} + ${pd(1 - p)} × ${M(Pm)} = ${M(Pm)} + ${pd(p)} × ${M(d)} = ${ans(Mc(e))}.`], picture: { pics: [tree] } },
    e, 'Right: the premium for sure, the deductible only with a claim.', [[Pm + d, MC.dedEvery, `The deductible is only paid in the claim branch (probability ${pd(p)}), not every year.`], [round2(d * p), undefined, `Add the ${M(Pm)} premium: it is paid in every branch.`], [Pm, undefined, `There is also the deductible in the claim branch: ${pd(p)} × ${M(d)}.`], [-e, undefined, 'The question asks for the cost as a positive number.']],
    'Cost in each branch times its probability, then add.', 0.005);
};

// ===================== s2-fair-price =====================
export const fairPrice: Gen = (R, n) => {
  const it = until(() => {
    const m = int(R, 1, 2), prizes = shuffle(R, [5, 10, 20, 25, 50]).slice(0, m).sort((a, b) => b - a);
    const ps = prizes.map((_, i) => pick(R, i === 0 ? [0.02, 0.04, 0.05, 0.1] : [0.1, 0.15, 0.2, 0.25]));
    const c = pick(R, [1, 2, 3, 4, 5]);
    return { prizes, ps, c };
  }, o => { const e = o.prizes.reduce((s, x, i) => s + x * o.ps[i]!, 0); return cents(e) && e > 0.3 && Math.abs(e - o.c) <= 3 && sumOk(o.ps) && !near(2 * o.c - e, 0) && !near(e, o.c); });
  const { prizes, ps, c } = it, e = round2(prizes.reduce((s, x, i) => s + x * ps[i]!, 0)), p0 = round2(1 - ps.reduce((a, b) => a + b, 0));
  const xs = [0, ...prizes.slice().reverse()], pps = [p0, ...ps.slice().reverse()];
  const gap = Math.min(...xs.slice(1).map((x, i) => x - xs[i]!)) / Math.max(...xs);
  const pic: BarsPic | TablePic = gap >= 0.18 ? { kind: 'bars', xs, ps: pps, labs: pps.map(pd), axis: { min: 0, max: Math.max(...xs), step: 5, pre: '$', name: 'Prize (dollars)', only: true }, y: { max: 1, step: 0.2, dec: 1 } }
    : { kind: 'table', rows: [{ head: tt('prize'), cells: xs.map(mx) }, { head: 'P', cells: pps.map(pd) }] };
  const desc = prizes.map((x, i) => `${M(x)} with probability ${pd(ps[i]!)}`).join(' and ');
  return num({ id: `fairPrice-${n}`, family: 'fairPrice', prompt: `A booth charges ${M(c)} a play. It pays ${desc}; otherwise nothing. Keeping the prizes and chances the same, what <b>price</b> would make the game fair, with an expected net payoff of $0 for the player?`,
    board: `E(\\text{prize}) - \\text{price} = 0`,
    solution: [`E(prize) = ${prizes.map((x, i) => `${pd(ps[i]!)} × ${M(x)}`).join(' + ')} = ${Mc(e)}.`, `Fair: price = E(prize) = ${ans(Mc(e))}${near(e, c) ? ', the current price: already fair' : e < c ? ` (lower than ${M(c)}: the game favors the booth now)` : ` (higher than ${M(c)}: the player is ahead now)`}.`], picture: { pics: [pic] } },
    e, 'Right: at that price the expected net payoff is $0.', [[round2(2 * c - e), MC.wrongDir, `The player now ${e < c ? 'loses' : 'gains'} ${Mc(Math.abs(c - e))} per play on average; to make it fair the price must move ${e < c ? 'down' : 'up'} by that, to ${Mc(e)}.`], [round2(e - c), undefined, 'That is the expected net payoff at the current price. The fair price makes it zero.']],
    'The fair price is the expected prize: probability times prize, added up.', 0.005);
};
const sumOk = (ps: number[]) => ps.reduce((a, b) => a + b, 0) < 0.6;

export const fairWhich: Gen = (R, n) => retry(() => {
  // a fair game (prize × p = price, p not 1/2), a 50-50 game that is not fair, a lottery with equal chances that is not fair
  const c = pick(R, [1, 2, 3, 4, 5]), p = pick(R, [0.1, 0.2, 0.25, 0.4]), P = c / p;
  if (!Number.isInteger(P)) throw new Reroll();
  const c2 = pick(R, [1, 2, 3, 5]), P2 = pick(R, [2 * c2 - 1, 2 * c2 + 1, Math.round(1.5 * c2), 3 * c2].filter(x => x !== 2 * c2 && x > c2));
  const N = pick(R, [100, 200, 500]), c3 = pick(R, [1, 2, 5]), P3 = pick(R, [0.5, 0.6, 0.75].map(f => Math.round(f * N * c3)));
  const names = shuffle(R, ['Spin & Win', 'Lucky Cup', 'Coin Flip', 'Ticket Grab']);
  const ev = [round2(P * p - c), round2(P2 * 0.5 - c2), round2(P3 / N - c3)];
  const games = [
    { t: `${names[0]}: pay ${M(c)}; the prize is ${M(P)} with probability ${pd(p)}, otherwise nothing`, ok: true, key: 'zero', say: `Right: ${pd(p)} × ${M(P)} = ${M(c)}, the price, so the expected net payoff is $0.` },
    { t: `${names[1]}: pay ${M(c2)}; the prize is ${M(P2)} with probability 0.5, otherwise nothing`, mc: MC.fairHalf, key: near(ev[1]!, 0) ? 'zero' : 'g2', say: `Winning half the time is not what makes it fair: 0.5 × ${M(P2)} = ${Mc(P2 / 2)}, not the ${M(c2)} price.` },
    { t: `${names[2]}: all ${N} tickets at ${M(c3)} are sold, each with the same chance; one ticket wins ${M(P3)}`, mc: MC.fairMisread, key: near(ev[2]!, 0) ? 'zero' : 'g3', say: `Equal chances make a fair draw, not a fair game: the expected prize is ${Mc(P3 / N)} for ${an(c3)} ${M(c3)} ticket.` },
    { t: 'None of them is fair', key: 'none', say: `${names[0]} is: ${pd(p)} × ${M(P)} = ${M(c)}, so its expected net payoff is $0.` },
  ];
  if (!near(ev[0]!, 0)) throw new Reroll();
  return ch(R, { id: `fairWhich-${n}`, family: 'fairWhich', prompt: 'A game is <b>fair</b> when a player’s expected net payoff is $0. Which game is fair?', board: 'E(\\text{net payoff}) = 0\\ ?',
    solution: [`${names[0]}: ${pd(p)} × ${M(P)} − ${M(c)} = $0.`, `${names[1]}: 0.5 × ${M(P2)} − ${M(c2)} = ${Mc(ev[1]!)}. ${names[2]}: ${M(P3)} ÷ ${N} − ${M(c3)} = ${Mc(ev[2]!)}.`] }, games as Opt[], { max: 3 });
});

// ===================== s2-ev-decision-rule =====================
export const ruleGain: Gen = (R, n) => retry(() => {
  const g = () => { const c = pick(R, [1, 2, 3, 5]), P = pick(R, [5, 10, 20, 50, 100].filter(x => x > 2 * c)), p = pick(R, [0.01, 0.02, 0.05, 0.1, 0.2, 0.25, 0.4].filter(q => q * P <= c * 1.6)); return { c, P, p, e: round2(P * p - c) }; };
  const A = g(), Bg = g();
  const es = [A.e, Bg.e, 0];
  if (A.P === Bg.P || A.c === Bg.c && A.p === Bg.p) throw new Reroll();
  for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) if (Math.abs(es[i]! - es[j]!) < 0.1) throw new Reroll();
  const must = R() < 0.4;
  const best = must ? (A.e > Bg.e ? 0 : 1) : es.indexOf(Math.max(...es));
  const bigPrize = A.P > Bg.P ? 0 : 1, cheap = A.c < Bg.c ? 0 : A.c > Bg.c ? 1 : -1;
  const lab = ['Game A', 'Game B', must ? 'They have the same expected net payoff' : 'Play neither (expected net payoff $0)'];
  const evTxt = `E(A) = ${Mc(A.e)}, E(B) = ${Mc(Bg.e)}${must ? '' : ', neither = $0'}`;
  const opts: Opt[] = [0, 1, 2].map(i => ({
    t: lab[i]!, ok: i === best,
    mc: i === best ? undefined : i === bigPrize ? MC.byPrize : i === cheap ? MC.byPrize : undefined,
    say: i === best ? `Right: ${evTxt}.` : i === bigPrize ? `A bigger prize is not enough: weight it by its probability. ${evTxt}.` : i === cheap ? `A cheaper game is not enough: weight the prize by its probability. ${evTxt}.` : `Compare the expected net payoffs: ${evTxt}.`,
  }));
  const t: TablePic = { kind: 'table', rows: [{ head: tt('game'), cells: ['A', 'B'] }, { head: tt('price'), cells: [mx(A.c), mx(Bg.c)] }, { head: tt('prize'), cells: [mx(A.P), mx(Bg.P)] }, { head: 'P(\\text{win})', cells: [pd(A.p), pd(Bg.p)] }] };
  return ch(R, { id: `ruleGain-${n}`, family: 'ruleGain', prompt: `Game A costs ${M(A.c)} and pays ${M(A.P)} with probability ${pd(A.p)}. Game B costs ${M(Bg.c)} and pays ${M(Bg.P)} with probability ${pd(Bg.p)}. Otherwise they pay nothing. ${must ? ' At the club’s fundraiser you will play one of the two games.' : ''} <b>Your rule: the largest expected net payoff per play.</b> What do you choose?`,
    board: `\\text{largest } E(\\text{net})`,
    solution: [`E(A) = ${pd(A.p)} × ${M(A.P)} − ${M(A.c)} = ${Mc(A.e)}; E(B) = ${pd(Bg.p)} × ${M(Bg.P)} − ${M(Bg.c)} = ${Mc(Bg.e)}.`, must ? `The larger (less negative or more positive) is ${Mc(es[best]!)}.` : `Playing neither is $0. The largest is ${best === 2 ? '$0' : Mc(es[best]!)}.`], picture: { pics: [t] } }, opts, { keep: true });
});

export const ruleCost: Gen = (R, n) => retry(() => {
  const ctx = pick(R, [{ what: 'car collision coverage', a: [900, 1000, 1100, 1200], b: [600, 700, 800], da: [250, 500], db: [1000, 2000] }, { what: 'renters insurance', a: [240, 264, 300], b: [150, 168, 180], da: [100, 250], db: [500, 1000] }]);
  const PA = pick(R, ctx.a), PB = pick(R, ctx.b), dA = pick(R, ctx.da), dB = pick(R, ctx.db), p = pick(R, [0.05, 0.08, 0.1, 0.15, 0.2, 0.25, 0.3]);
  const eA = round2(PA + dA * p), eB = round2(PB + dB * p);
  if (Math.abs(eA - eB) < 5) throw new Reroll();
  const best = eA < eB ? 0 : 1;
  const evTxt = `A: ${M(PA)} + ${pd(p)} × ${M(dA)} = ${Mc(eA)}; B: ${M(PB)} + ${pd(p)} × ${M(dB)} = ${Mc(eB)}`;
  const opts: Opt[] = [
    { t: 'Policy A', ok: best === 0, mc: best === 0 ? undefined : undefined, say: best === 0 ? `Right: ${evTxt}.` : `A lower deductible does not pay for itself here: ${evTxt}.` },
    { t: 'Policy B', ok: best === 1, mc: best === 1 ? undefined : MC.oneFee, say: best === 1 ? `Right: ${evTxt}.` : `B has the lower premium, but its deductible counts too: ${evTxt}.` },
    { t: 'They have the same expected cost', say: `They differ: ${evTxt}.` },
  ];
  const tree: TreePic = { kind: 'dtree', opts: [{ label: 'policy A', outs: [{ label: 'claim', p: pd(p), v: mx(-(PA + dA)) }, { label: 'no claim', p: pd(1 - p), v: mx(-PA) }] }, { label: 'policy B', outs: [{ label: 'claim', p: pd(p), v: mx(-(PB + dB)) }, { label: 'no claim', p: pd(1 - p), v: mx(-PB) }] }], ev: [null, null], hl: best, reveal: { ev: [`E = ${mx(-eA)}`, `E = ${mx(-eB)}`] } };
  return ch(R, { id: `ruleCost-${n}`, family: 'ruleCost', prompt: `${cap(ctx.what)}: policy A costs ${M(PA)} a year with ${an(dA)} ${M(dA)} deductible; policy B costs ${M(PB)} with ${an(dB)} ${M(dB)} deductible. Assume at most one claim a year, with probability ${pd(p)}, and a loss bigger than either deductible. <b>Your rule: the lowest expected yearly cost.</b> Which policy?`,
    board: `\\text{lowest } E(\\text{cost})`,
    solution: [`Expected cost = premium + P(claim) × deductible.`, `${evTxt}.`, `Lower: policy ${best === 0 ? 'A' : 'B'}.`], picture: { pics: [tree] } }, opts, { keep: true });
});

// ===================== s2-assumption-audit =====================
const SOURCES = [
  { s: (R: () => number) => { const k = pick(R, [24, 36, 45]), N = pick(R, [300, 400, 600]); return { txt: `A repair shop says ${k} of the ${N} laptops it sold last year needed a repair in the first year, so it uses P(repair) = ${dec(k / N, 3)}.`, kind: 'emp' as const }; } },
  { s: (_R: () => number) => ({ txt: 'A booth uses a fair 6-sided die and says P(rolling a 6) = 1/6.', kind: 'theo' as const }) },
  { s: (R: () => number) => { const q = pick(R, [0.2, 0.25, 0.3]); return { txt: `A new café owner has no sales data yet and guesses that ${pd(q)} of customers will buy a dessert.`, kind: 'assumed' as const }; } },
  { s: (R: () => number) => { const k = pick(R, [12, 18, 27]); return { txt: `An insurer saw claims from ${k}% of 50,000 similar drivers last year and uses P(claim) = ${dec(k / 100, 2)} for next year.`, kind: 'emp' as const }; } },
  { s: (_R: () => number) => ({ txt: 'A spinner has 10 equal sectors, 3 of them red, so P(red) = 0.3.', kind: 'theo' as const }) },
];
export const auditSource: Gen = (R, n) => {
  const S = pick(R, SOURCES).s(R);
  const o: Opt[] = [
    { t: 'Theoretical: from equally likely outcomes of the mechanism', ok: S.kind === 'theo', say: S.kind === 'theo' ? 'Right: it comes from the design of the device.' : 'Nothing here is a device with equally likely outcomes.' },
    { t: 'Empirical: an estimate from past data', ok: S.kind === 'emp', say: S.kind === 'emp' ? 'Right: a relative frequency from past cases, an estimate for the future.' : S.kind === 'theo' ? 'No data was collected: the value comes from the device’s design.' : 'There is no data yet.' },
    { t: 'Assumed: a guess to be checked later', ok: S.kind === 'assumed', say: S.kind === 'assumed' ? 'Right: a stated guess, to be replaced by data.' : 'It is based on something firmer than a guess.' },
    { t: 'Exact: it will be the true rate for every future case', mc: MC.exactParam, say: 'Past data gives an estimate; the future rate can differ, and a guess is only a guess.' },
  ];
  return ch(R, { id: `auditSource-${n}`, family: 'auditSource', prompt: `${S.txt} Where does this probability come from?`, board: '\\text{theoretical, empirical or assumed?}',
    solution: ['Theoretical = from a chance device’s equally likely outcomes; empirical = a relative frequency from data; assumed = a stated guess.', S.kind === 'theo' ? 'Here: a device with equally likely outcomes.' : S.kind === 'emp' ? 'Here: counts from past cases, so an estimate.' : 'Here: no data, a guess.'] }, o, { keep: true });
};

const AUDITS = [
  (R: () => number) => { const Pm = pick(R, [600, 720, 900]), d = pick(R, [500, 1000]), p = pick(R, [0.05, 0.08, 0.1]);
    return { calc: `the expected yearly cost of a car policy as ${M(Pm)} + ${pd(p)} × ${M(d)}`, right: 'At most one claim in the year, and every loss is bigger than the deductible',
      w: [{ t: 'Claims by different drivers are independent', mc: MC.independence, say: 'The calculation is about one driver’s one year; it never multiplies probabilities of different drivers.' }, { t: `The ${pd(p)} is exactly right for this driver`, mc: MC.inputsExact, say: `${pd(p)} is an estimate; the calculation uses it, but it does not assume it is exact.` }, { t: 'The deductible is paid every year', mc: MC.dedEvery, say: `Then the cost would be ${M(Pm + d)}; the calculation pays it only in the claim branch.` }] }; },
  (R: () => number) => { const N = pick(R, [500, 1000]), c = pick(R, [5, 10]), G = pick(R, [1000, 2000]);
    return { calc: `a raffle ticket’s expected net payoff as ${M(G)} ÷ ${big(N)} − ${M(c)}`, right: `All ${big(N)} tickets are sold, and every ticket has the same chance to be drawn`,
      w: [{ t: 'Different raffles are independent of each other', mc: MC.independence, say: 'Only one draw is involved; no probabilities are multiplied.' }, { t: `Each buyer will receive ${Mc(G / N)}`, mc: MC.guaranteed, say: 'That is the expected prize, an average; a ticket pays the prize or nothing.' }, { t: 'The prize is worth more than the ticket', say: 'That is a fact of the raffle, not an assumption the formula needs.' }] }; },
  (R: () => number) => { const Rp = pick(R, [300, 450]), p = pick(R, [0.1, 0.15]);
    return { calc: `the expected repair cost of skipping a 3-year laptop plan as ${pd(p)} × ${M(Rp)}`, right: `A repair costs ${M(Rp)} whenever it happens, and the laptop needs at most one repair`,
      w: [{ t: 'Breakdowns of different laptops are independent', mc: MC.independence, say: 'The calculation is about one laptop; it multiplies nothing across laptops.' }, { t: 'The plan would cover every kind of damage', mc: MC.coversAll, say: 'The calculation is about skipping the plan; what the plan covers does not enter it.' }, { t: `The laptop will cost ${Mc(p * Rp)} in repairs`, mc: MC.guaranteed, say: `${Mc(p * Rp)} is an average over many laptops; this one costs $0 or ${M(Rp)}.` }] }; },
];
export const auditWhich: Gen = (R, n) => {
  const A = pick(R, AUDITS)(R);
  return ch(R, { id: `auditWhich-${n}`, family: 'auditWhich', prompt: `An analyst computes ${A.calc}. Which assumption does that calculation <b>rely on</b>?`, board: '\\text{which assumption is used?}',
    solution: ['Look at what the formula does: each probability and each cost it uses, and what it leaves out.', `It needs: ${A.right.toLowerCase()}.`] },
    [{ t: A.right, ok: true, say: 'Right: without it the formula would need more branches.' }, ...A.w]);
};

// ===================== s2-sensitivity =====================
interface Sc { what: string; risky: string; safe: string; bad: string; good: string; ifG: string; ifB: string; G: number; L: number; S: number }
function scenario(R: () => number): Sc {
  return until(() => {
    const k = int(R, 0, 2);
    if (k === 0) return { what: 'A club’s outdoor fundraiser', risky: 'outdoors', safe: 'gym', bad: 'rain', good: 'dry', ifG: 'if it stays dry', ifB: 'if it rains', G: pick(R, [1800, 2000, 2400]), L: pick(R, [400, 500, 600]), S: pick(R, [1200, 1300, 1400]) };
    if (k === 1) return { what: 'A food truck’s festival order', risky: 'extra meals', safe: 'usual', bad: 'small crowd', good: 'big crowd', ifG: 'with a big crowd', ifB: 'with a small crowd', G: pick(R, [900, 1000, 1200]), L: pick(R, [300, 400, 500]), S: pick(R, [500, 600, 700]) };
    return { what: 'A farm stand’s weekend plan', risky: 'big market', safe: 'home stand', bad: 'storm', good: 'fair weather', ifG: 'in fair weather', ifB: 'in a storm', G: pick(R, [1500, 1600, 1800]), L: pick(R, [200, 300, 400]), S: pick(R, [900, 1000, 1100]) };
  }, s => s.G > s.S);
}
const PS = [0.1, 0.2, 0.3, 0.4, 0.5];
const evR = (s: Sc, p: number) => round2((1 - p) * s.G - p * s.L);
export const sensFill: Gen = (R, n) => {
  const s = scenario(R), p0 = pick(R, [0.1, 0.2]), j = int(R, 1, 4), p = PS[j]!;
  const v = evR(s, p);
  const row = PS.map(q => (near(q, p) ? null : mx(evR(s, q))));
  const t: TablePic = { kind: 'table', title: `E(${s.risky}) as P(${s.bad}) changes`, rows: [{ head: `P(\\text{${s.bad}})`, cells: PS.map(pd) }, { head: tt('E'), cells: row }], reveal: { cells: [PS.map(() => null), PS.map(q => (near(q, p) ? mx(v) : null))] } };
  return num({ id: `sensFill-${n}`, family: 'sensFill', prompt: `${s.what}: “${s.risky}” nets ${M(s.G)} ${s.ifG} and ${M(-s.L)} ${s.ifB}. The forecast says P(${s.bad}) = ${pd(p0)}. The table recomputes E(${s.risky}) for other values of P(${s.bad}). What goes in the empty cell, at P(${s.bad}) = ${pd(p)}?`,
    board: `E\\ \\text{at}\\ P(\\text{${s.bad}}) = ${pd(p)}`,
    solution: [`When P(${s.bad}) changes to ${pd(p)}, P(${s.good}) changes too: 1 − ${pd(p)} = ${pd(1 - p)}.`, `E = ${pd(1 - p)} × ${M(s.G)} + ${pd(p)} × ${par(-s.L)} = ${ans(M(v))}.`], picture: { pics: [t] } },
    v, 'Right: both probabilities updated, still adding to 1.', [[round2((1 - p0) * s.G - p * s.L), MC.notOne, `P(${s.good}) must change too: ${pd(1 - p)}, not ${pd(1 - p0)}, so the two still add to 1.`], [round2((1 - p) * s.G), MC.noChange, `The ${s.bad} branch counts too: ${pd(p)} × ${par(-s.L)}.`], [round2((1 - p) * s.G + p * s.L), MC.direction, `With ${s.bad} the plan loses ${M(s.L)}: that net payoff is negative.`]],
    'Use P(bad) and 1 − P(bad), each times its net payoff.');
};
export const sensSwitch: Gen = (R, n) => retry(() => {
  const s = scenario(R);
  const ps = PS.map(p => evR(s, p));
  const pStar = (s.G - s.S) / (s.G + s.L);
  const j = PS.findIndex((p, i) => i < PS.length - 1 && p < pStar && PS[i + 1]! > pStar);
  if (j < 0 || PS.some(p => near(p, pStar)) || ps.some(v => Math.abs(v - s.S) < 20)) throw new Reroll();
  const lab = (i: number) => `Between ${pd(PS[i]!)} and ${pd(PS[i + 1]!)}`;
  const t: TablePic = { kind: 'table', rows: [{ head: `P(\\text{${s.bad}})`, cells: PS.map(pd) }, { head: tt(s.risky), cells: ps.map(mx) }, { head: tt(s.safe), cells: PS.map(() => mx(s.S)) }] };
  const others = [j - 1, j + 1, j + 2, j - 2].filter(i => i >= 0 && i < PS.length - 1);
  const opts: Opt[] = [
    { t: lab(j), ok: true, say: `Right: at ${pd(PS[j]!)} “${s.risky}” is higher (${M(ps[j]!)} vs ${M(s.S)}); at ${pd(PS[j + 1]!)} it is lower (${M(ps[j + 1]!)}).` },
    { t: `It never switches: “${s.risky}” is always better`, mc: MC.unqualified, say: `Look along the row: at P(${s.bad}) = ${pd(PS[PS.length - 1]!)}, “${s.risky}” gives ${M(ps[PS.length - 1]!)}, less than ${M(s.S)}.` },
    ...others.map(i => ({ t: lab(i), say: `At both ${pd(PS[i]!)} and ${pd(PS[i + 1]!)} the same option is higher; find the pair of columns where the order flips.` })),
  ];
  return ch(R, { id: `sensSwitch-${n}`, family: 'sensSwitch', prompt: `${s.what}: “${s.risky}” nets ${M(s.G)} ${s.ifG} and ${M(-s.L)} ${s.ifB}; “${s.safe}” nets ${M(s.S)} for sure. The scenario table shows each option’s expected value for five values of P(${s.bad}). Between which two tabled values does the option with the <b>higher expected value</b> change?`,
    board: `\\text{where does the better option change?}`,
    solution: [`Compare the rows column by column: “${s.risky}” is higher while P(${s.bad}) is small.`, `At ${pd(PS[j]!)}: ${M(ps[j]!)} > ${M(s.S)}; at ${pd(PS[j + 1]!)}: ${M(ps[j + 1]!)} < ${M(s.S)}.`], picture: { pics: [t] } }, opts, { max: 3 });
});

// ===================== insurance-warranty-spreadsheet =====================
export const planTotal: Gen = (R, n) => retry(() => {
  const m = pick(R, [180, 220, 250, 300, 350, 420]), D = pick(R, [1000, 1500, 2000, 3000]), r = pick(R, [0.1, 0.2, 0.3]), Mx = pick(R, [4000, 5000, 6000, 7500]);
  const kind = int(R, 0, 2);
  const pool = kind === 0 ? [400, 600, 800].filter(b => b < D) : kind === 1 ? [3000, 4000, 5000, 6000, 8000, 10000].filter(b => b > D && D + r * (b - D) < Mx - 100) : [20000, 30000, 40000, 60000].filter(b => D + r * (b - D) > Mx + 100);
  if (!pool.length) throw new Reroll();
  const B = pick(R, pool);
  const oop = B <= D ? B : Math.min(Mx, D + r * (B - D));
  const v = round2(12 * m + oop);
  const slips: Slip[] = [[round2(m + oop), MC.units, `The premium is ${M(m)} a month: ${M(12 * m)} for the year.`]];
  if (B > D) { slips.push([round2(12 * m + r * B), MC.coinsFirst, `First the ${M(D)} deductible is paid in full; coinsurance applies only to the ${M(B - D)} above it.`]); slips.push([round2(12 * m + D + r * (B - D)), MC.cap, `Out-of-pocket costs stop at the ${M(Mx)} maximum.`]); }
  slips.push([round2(12 * m), undefined, 'Add what you pay for care, not just the premiums.']);
  const t: TablePic = { kind: 'table', title: 'The plan', rows: [{ head: tt('premium'), cells: [`\\$${m}\\text{/mo}`] }, { head: tt('deductible'), cells: [mx(D)] }, { head: tt('coinsurance'), cells: [`${r * 100}\\%`] }, { head: tt('out-of-pocket max'), cells: [mx(Mx)] }] };
  return num({ id: `planTotal-${n}`, family: 'planTotal', prompt: `A health plan costs ${M(m)} a month, with ${an(D)} ${M(D)} deductible, ${r * 100}% coinsurance after the deductible, and ${an(Mx)} ${M(Mx)} out-of-pocket maximum (for deductible plus coinsurance; premiums do not count toward it). This year’s covered medical bills are ${M(B)}. What is the <b>total cost for the year</b>, premiums included?${CALC}`,
    board: '\\text{total for the year} = \\,?',
    solution: [`Premiums: 12 × ${M(m)} = ${M(12 * m)}.`, B <= D ? `The ${M(B)} bills are below the deductible: you pay all ${M(B)}.` : `Out of pocket: ${M(D)} + ${r * 100}% × ${M(B - D)} = ${M(D + r * (B - D))}${D + r * (B - D) > Mx ? `, capped at ${M(Mx)}` : ''}.`, `Total: ${M(12 * m)} + ${M(oop)} = ${ans(M(v))}.`], picture: { pics: [t] } },
    v, 'Right.', slips, 'Premiums for 12 months, plus the deductible, plus coinsurance on the rest, but never more than the out-of-pocket maximum.');
});

export const warrantyScen: Gen = (R, n) => {
  const item = pick(R, [{ thing: 'TV', price: [700, 900, 1200], W: [89, 129, 179], mech: [250, 300, 400], acc: [400, 500, 600] }, { thing: 'laptop', price: [800, 1000, 1300], W: [149, 199, 249], mech: [300, 350, 450], acc: [350, 450, 550] }]);
  const price = pick(R, item.price), W = pick(R, item.W), mech = pick(R, item.mech), acc = until(() => pick(R, item.acc), a => a < price && a !== mech);
  const plan = R() < 0.6, sc = int(R, 0, 2);
  const cost = [plan ? W : 0, plan ? W : mech, plan ? W + acc : acc][sc]!;
  const names = ['nothing breaks', 'a mechanical failure', `an accidental crack`];
  const slips: Slip[] = [];
  if (plan && sc === 2) slips.push([W, MC.coversAll, `The plan excludes accidental damage: the ${M(acc)} repair is yours on top of the ${M(W)}.`]);
  if (plan && sc === 1) slips.push([W + mech, undefined, `Mechanical failures are covered: the plan price is all you pay.`]);
  if (plan && sc === 0) slips.push([0, undefined, `The ${M(W)} plan price is paid even if nothing breaks.`]);
  if (!plan && sc > 0) slips.push([W, undefined, 'Without the plan there is no plan price, but you pay the repair.']);
  if (!plan && sc === 0) slips.push([W, undefined, 'Without the plan, nothing breaking costs nothing.']);
  const t: TablePic = { kind: 'table', title: plan ? `With the ${M(W)} plan` : 'Without the plan', rows: [{ head: tt('scenario'), cells: [tt('nothing'), tt('mechanical'), tt('accident')] }, { head: tt('3-yr cost'), cells: [0, 1, 2].map(i => (i === sc ? null : mx([plan ? W : 0, plan ? W : mech, plan ? W + acc : acc][i]!))) }], reveal: { cells: [[null, null, null], [0, 1, 2].map(i => (i === sc ? mx(cost) : null))] } };
  return num({ id: `warrantyScen-${n}`, family: 'warrantyScen', prompt: `${cap(an(price))} ${M(price)} ${item.thing} has a 3-year protection plan for ${M(W)}. The plan covers mechanical failures (${an(mech)} ${M(mech)} repair) but <b>not</b> accidental damage (${an(acc)} ${M(acc)} repair). What is your total cost over the 3 years ${plan ? 'with' : 'without'} the plan if ${['nothing breaks', 'it has one mechanical failure', 'it gets one accidental crack'][sc]}?`,
    board: '\\text{3-year cost} = \\,?',
    solution: [plan ? `With the plan you pay ${M(W)} up front; it pays mechanical repairs only.` : 'Without the plan you pay every repair yourself.', plan && sc === 2 ? `${cap(names[sc]!)}: ${M(W)} + ${M(acc)} = ${ans(M(cost))}.` : `${cap(names[sc]!)}: the total is ${ans(M(cost))}.`], picture: { pics: [t] } },
    cost, 'Right: read what the plan covers and what it does not.', slips, 'Add the plan price (if you bought it) and any repair the plan does not cover.');
};
void pc; void ans; void hundredths;
