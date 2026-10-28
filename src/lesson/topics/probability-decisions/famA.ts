// famA.ts: stage 1 families of "Using probability to make decisions": the decision structure (choices vs chance, the
// branches of the do-nothing option), net payoffs from a named person's side (tickets, booths, insurance), complete
// net-payoff distributions, and fair random selection procedures. Pure: no DOM.
import type { TreePic } from './DecTree';
import type { TablePic } from '../expected-value/DistPic';
import { type Gen, type Opt, type Slip, MC, an, An, M, NEG, ans, big, ch, frac, ft, fx, int, mx, num, pd, pick, retry, tt, until } from './common';

// ===================== contexts of a two-option decision =====================
interface Ctx { story: string; who: string; choices: [string, string]; chance: [string, string]; given: string }
function decision(R: () => number): Ctx {
  const k = int(R, 0, 5);
  if (k === 0) { const L = pick(R, [600, 800, 900, 1000, 1200]), W = pick(R, [99, 129, 149, 179]);
    return { who: 'Maya', story: `Maya is buying ${aOf(L)} ${M(L)} laptop. The store offers a 3-year protection plan for ${M(W)}.`, choices: ['Buy the protection plan', 'Skip the protection plan'], chance: ['The laptop breaks within 3 years', 'The laptop keeps working for 3 years'], given: `The plan costs ${M(W)}` }; }
  if (k === 1) { const c = pick(R, [5, 10, 20]), P = pick(R, [500, 1000, 2500]);
    return { who: 'Leo', story: `Leo can buy ${an(c)} ${M(c)} ticket in a charity raffle with one ${M(P)} prize.`, choices: ['Buy a raffle ticket', 'Do not buy a ticket'], chance: ['Leo’s ticket is drawn', 'Another ticket is drawn'], given: `The prize is ${M(P)}` }; }
  if (k === 2) { const Y = pick(R, [900, 1100, 1300]);
    return { who: 'Ana', story: `Ana is choosing car insurance: a low-deductible policy for ${M(Y)} a year or a cheaper high-deductible policy.`, choices: ['Take the low-deductible policy', 'Take the high-deductible policy'], chance: ['Ana has no accident this year', 'Ana has a major accident this year'], given: `The low-deductible policy costs ${M(Y)} a year` }; }
  if (k === 3) { const H = pick(R, [300, 400, 500]);
    return { who: 'the club', story: `A running club is planning its end-of-season party. It can hold it outdoors or rent the community hall for ${M(H)}.`, choices: ['Hold the party outdoors', 'Rent the community hall'], chance: ['It rains that afternoon', 'It stays dry that afternoon'], given: `The hall costs ${M(H)} to rent` }; }
  if (k === 4) { const T = pick(R, [1200, 1800, 2400]), I = pick(R, [90, 120, 150]);
    return { who: 'Sam', story: `Sam booked ${an(T)} ${M(T)} trip that cannot be refunded. Trip-cancellation insurance costs ${M(I)}.`, choices: ['Buy the cancellation insurance', 'Skip the cancellation insurance'], chance: ['Sam has to cancel the trip', 'Sam takes the trip as planned'], given: `The trip costs ${M(T)}` }; }
  const m = pick(R, [150, 200, 250]);
  return { who: 'Rosa', story: `Rosa runs a food truck at a weekend festival. She can bring ${m} extra meals or her usual amount.`, choices: [`Bring ${m} extra meals`, 'Bring the usual amount'], chance: ['The festival draws a big crowd', 'The crowd is the usual size'], given: `Each extra meal costs her ${M(pick(R, [4, 5, 6]))} to make` };
}
const aOf = (v: number) => (/^8|^1[18]\d{2}$|^1[18]$/.test(String(v)) ? 'an' : 'a');

// ===================== s1-decision-structure =====================
export const dsWhich: Gen = (R, n) => {
  const C = decision(R), askChoice = R() < 0.5;
  const right = askChoice ? pick(R, C.choices) : pick(R, C.chance);
  const opts: Opt[] = askChoice
    ? [{ t: right, ok: true, say: `Right: ${C.who === 'the club' ? 'the club decides' : C.who + ' decides'} this. It is a branch out of the square decision node.` },
       ...C.chance.map(t => ({ t, mc: MC.chanceAsChoice, say: 'Nobody gets to pick this: chance decides it. It belongs on a branch after the round chance node.' })),
       { t: C.given, say: 'That is a given number in the story, not something anyone chooses now.' }]
    : [{ t: right, ok: true, say: 'Right: nobody controls this. It is a branch out of a round chance node.' },
       ...C.choices.map(t => ({ t, say: `That is a choice ${C.who === 'the club' ? 'the club' : C.who} makes: a branch out of the square decision node.` })),
       { t: C.given, say: 'That is a given number in the story, not an outcome chance decides.' }];
  return ch(R, { id: `dsWhich-${n}`, family: 'dsWhich', prompt: `${C.story} In a decision tree, a square node branches into the choices someone controls and a round node branches into chance outcomes. Which of these is <b>${askChoice ? 'a choice' : 'a chance outcome'}</b>?`,
    board: '\\text{choice (square) or chance (circle)?}',
    solution: [`Ask of each one: does ${C.who} decide it, or does chance?`, askChoice ? `${C.choices[0]} / ${C.choices[1].toLowerCase()}: decided, so choices.` : `${C.chance[0]} / ${C.chance[1].toLowerCase()}: nobody decides them, so chance outcomes.`] }, opts);
};

const PAIRS = [
  { story: (a: number, b: number) => `Jo is buying ${aOf(a)} ${M(a)} phone. A 2-year protection plan costs ${M(b)} and covers any repair.`, act: 'buy the plan', passive: 'skip the plan', outs: ['the phone breaks', 'it keeps working'], eff: true, nums: [[700, 800, 999], [129, 149, 169]] as [number[], number[]] },
  { story: (a: number, b: number) => `Sam booked ${an(a)} ${M(a)} trip that cannot be refunded. Cancellation insurance costs ${M(b)}.`, act: 'buy the insurance', passive: 'skip the insurance', outs: ['Sam has to cancel', 'Sam takes the trip'], eff: true, nums: [[1200, 1800, 2400], [90, 120, 150]] as [number[], number[]] },
  { story: (a: number, b: number) => `Kai drives a car worth ${M(a)}. Collision coverage costs ${M(b)} a year.`, act: 'buy collision coverage', passive: 'skip collision coverage', outs: ['Kai has a crash', 'no crash'], eff: true, nums: [[6000, 9000, 12000], [480, 600, 720]] as [number[], number[]] },
  { story: (a: number, b: number) => `Leo can buy ${an(b)} ${M(b)} ticket in a charity raffle for ${an(a)} ${M(a)} prize.`, act: 'buy a ticket', passive: 'do not buy a ticket', outs: ['his ticket is drawn', 'it is not drawn'], eff: false, nums: [[500, 1000, 2500], [5, 10, 20]] as [number[], number[]] },
  { story: (a: number, b: number) => `A school-fair booth game costs ${M(b)} a play and its top prize is ${M(a)}.`, act: 'play once', passive: 'do not play', outs: ['you win the prize', 'you win nothing'], eff: false, nums: [[20, 25, 50], [2, 3, 5]] as [number[], number[]] },
];
const pk = <T>(xs: readonly T[], R: () => number): T => xs[Math.floor(R() * xs.length)]!;
export const dsBranches: Gen = (R, n) => {
  const P = pk(PAIRS, R);
  const nums = [pk(P.nums[0], R), pk(P.nums[1], R)];
  const story = P.story(nums[0]!, nums[1]!);
  const both = `“${P.outs[0]}” and “${P.outs[1]}”`;
  const opts: Opt[] = P.eff
    ? [{ t: `${cap(P.outs[0]!)} or ${P.outs[1]}: chance still decides the cost`, ok: true, say: 'Right: skipping does not stop the bad outcome. It only changes who pays for it.' },
       { t: `None: if you ${P.passive}, it costs $0`, mc: MC.omitsBranch, say: `Not quite: if you ${P.passive} and ${P.outs[0]}, you pay the whole cost yourself. That outcome is still on the branch.` },
       { t: `Only “${P.outs[0]}”`, mc: MC.noChange, say: `“${cap(P.outs[1]!)}” is an outcome too: its payoff is $0, and it carries the rest of the probability.` },
       { t: `“${cap(P.act)}” or “${P.passive}”`, say: 'Those are the choices: they come out of the square node, before chance acts.' }]
    : [{ t: `None: one sure outcome, a net payoff of $0`, ok: true, say: `Right: if you ${P.passive}, the draw cannot change your money. One branch, $0 for sure.` },
       { t: `${cap(P.outs[0]!)} or ${P.outs[1]}`, say: `Those outcomes still happen, but they do not change the money of someone who did not ${P.act.replace(/^buy/, 'buy').replace(' once', '')}: one sure branch, $0.` },
       { t: `Only “${P.outs[1]}”`, say: 'There is no chance branch to draw here: the payoff is $0 whatever happens.' },
       { t: `“${cap(P.act)}” or “${P.passive}”`, say: 'Those are the choices: they come out of the square node, before chance acts.' }];
  const tree: TreePic = { kind: 'dtree', opts: [{ label: cap(P.act), outs: P.outs.map(o => ({ label: o, p: null, v: null })) }] };
  return ch(R, { id: `dsBranches-${n}`, family: 'dsBranches', prompt: `${story} The tree shows the branch “${P.act}”. Which chance outcomes belong after the other choice, “${P.passive}”?`,
    board: `\\text{${P.passive}} \\to \\,?`,
    solution: [`Ask: after “${P.passive}”, can chance still change the money? The outcomes are ${both}.`, P.eff ? `Yes: if ${P.outs[0]}, you pay it all yourself; if ${P.outs[1]}, $0. Both outcomes stay on the branch.` : `No: without a ${P.act.includes('ticket') ? 'ticket' : 'play'} the result is $0 whatever happens, so one sure branch.`],
    picture: { pics: [{ ...tree, opts: [{ label: shortAct(P.act), outs: P.outs.map(o => ({ label: shortOut(o), p: '', v: '' })) }] }] } }, opts);
};
const cap = (s: string) => s[0]!.toUpperCase() + s.slice(1);
const shortAct = (s: string) => ({ 'buy the plan': 'buy plan', 'buy the insurance': 'insure', 'buy collision coverage': 'insure', 'buy a ticket': 'buy ticket', 'play once': 'play' }[s] ?? s);
const shortOut = (s: string) => ({ 'the phone breaks': 'breaks', 'it keeps working': 'works', 'Sam has to cancel': 'cancel', 'Sam takes the trip': 'trip', 'Kai has a crash': 'crash', 'no crash': 'no crash', 'his ticket is drawn': 'drawn', 'it is not drawn': 'not drawn', 'you win the prize': 'win', 'you win nothing': 'lose' }[s] ?? s);

// ===================== s1-net-payoff =====================
export const netTicket: Gen = (R, n) => {
  const raffle = R() < 0.45;
  if (raffle) {
    const c = pick(R, [2, 5, 10, 20]), N = pick(R, [200, 300, 500, 1000]), P = pick(R, [100, 250, 500, 1000].filter(x => x <= (N * c) / 2 && x >= 10 * c));
    const win = R() < 0.5, v = win ? P - c : -c;
    const slips: Slip[] = win ? [[P, MC.revenue, `${M(P)} is what you receive. Your net payoff subtracts the ${M(c)} you paid for the ticket.`], [-(P - c), MC.sellerView, 'That is the club’s side. From your side, a win is money in: prize minus ticket.'], [P - 2 * c, MC.costTwice, `The ${M(c)} ticket is paid once: ${M(P)} − ${M(c)}.`]]
      : [[0, MC.onlyOnWins, `You paid ${M(c)} for the ticket whether it wins or not: a losing ticket is a net payoff of ${M(-c)}.`], [c, MC.sellerView, `+${M(c)} is the club’s side: it kept your money. From your side the ticket is a cost.`]];
    return num({ id: `netTicket-${n}`, family: 'netTicket', prompt: `A charity sells ${big(N)} raffle tickets at ${M(c)} each. One ticket is drawn for ${an(P)} ${M(P)} prize. Jay buys one ticket. What is <b>Jay’s net payoff</b> if his ticket ${win ? 'is drawn' : 'is not drawn'}?${NEG}`,
      board: `\\text{net} = \\text{received} - \\text{paid}`,
      solution: [`Net payoff = what Jay receives − what he paid. He paid ${M(c)} in every branch.`, win ? `Drawn: ${M(P)} − ${M(c)} = ${ans(M(v))}.` : `Not drawn: $0 − ${M(c)} = ${ans(M(v))}.`],
      picture: { pics: [{ kind: 'dtree', opts: [{ label: 'buy ticket', outs: [{ label: 'drawn', p: `\\tfrac{1}{${N}}`, v: null }, { label: 'not drawn', p: `\\tfrac{${N - 1}}{${N}}`, v: null }] }], reveal: { v: [[mx(P - c), mx(-c)]] } }] } },
      v, 'Right: received minus paid, from Jay’s side.', slips, 'Net payoff = what Jay receives in that branch minus the ticket price he paid.');
  }
  const c = pick(R, [2, 3, 4, 5]), P = pick(R, [10, 15, 20, 25, 40].filter(x => x > 2 * c)), p = pick(R, [0.1, 0.15, 0.2, 0.25]);
  const booth = R() < 0.5, win = R() < 0.5;
  const v = booth ? (win ? c - P : c) : win ? P - c : -c;
  const slips: Slip[] = booth
    ? win ? [[P - c, undefined, 'That is the player’s side. The booth took in the price but paid out the prize.'], [-P, undefined, `The booth also took in the ${M(c)} price: ${M(c)} − ${M(P)}.`]]
      : [[-c, undefined, 'That is the player’s side. The booth keeps the price when the player loses.'], [0, undefined, `The booth took in ${M(c)} and paid nothing out.`]]
    : win ? [[P, MC.revenue, `${M(P)} is the prize received; subtract the ${M(c)} price.`], [c - P, MC.sellerView, 'That is the booth’s side. From your side a win is money in.']]
      : [[0, MC.onlyOnWins, `The ${M(c)} was paid before the throw, so a loss is ${M(-c)}.`], [c, MC.sellerView, `+${M(c)} is the booth’s side. From your side the price is a cost.`]];
  return num({ id: `netTicket-${n}`, family: 'netTicket', prompt: `A ring-toss booth charges ${M(c)} a throw. A ringer (probability ${pd(p)}) wins ${an(P)} ${M(P)} prize; otherwise nothing. What is the <b>${booth ? 'booth’s' : 'player’s'} net payoff</b> on one throw that ${win ? 'is a ringer' : 'misses'}?${NEG}`,
    board: `\\text{net (${booth ? 'booth' : 'player'})} = \\text{received} - \\text{paid}`,
    solution: [booth ? `The booth receives the ${M(c)} price on every throw and pays ${M(P)} on a ringer.` : `The player pays ${M(c)} on every throw and receives ${M(P)} on a ringer.`, `${win ? 'Ringer' : 'Miss'}: ${booth ? (win ? `${M(c)} − ${M(P)}` : `${M(c)} − $0`) : win ? `${M(P)} − ${M(c)}` : `$0 − ${M(c)}`} = ${ans(M(v))}.`],
    picture: { pics: [{ kind: 'dtree', title: booth ? 'From the booth’s side' : 'From the player’s side', opts: [{ label: 'one throw', outs: [{ label: 'ringer', p: pd(p), v: null }, { label: 'miss', p: pd(1 - p), v: null }] }], reveal: { v: [[mx(booth ? c - P : P - c), mx(booth ? c : -c)]] } }] } },
    v, `Right: from the ${booth ? 'booth’s' : 'player’s'} side.`, slips, `Take the ${booth ? 'booth’s' : 'player’s'} side: money in minus money out in that branch.`);
};

const POLICIES = [
  { what: 'collision coverage on her car', who: 'Ana', prem: [600, 780, 960, 1200], ded: [500, 1000], loss: [2400, 3600, 5000], ev: 'a crash' },
  { what: 'renters insurance', who: 'Omar', prem: [150, 180, 216, 240], ded: [250, 500], loss: [1500, 2200, 3000], ev: 'a burglary' },
  { what: 'phone insurance', who: 'Lee', prem: [96, 120, 144, 168], ded: [99, 149, 199], loss: [450, 600, 900], ev: 'a cracked phone' },
];
export const netInsure: Gen = (R, n) => {
  const Pl = pick(R, POLICIES), Pm = pick(R, Pl.prem), d = pick(R, Pl.ded), L = pick(R, Pl.loss), p = pick(R, [0.05, 0.06, 0.08, 0.1, 0.12]);
  const cell = int(R, 0, 3), insured = cell < 2, claim = cell % 2 === 0;
  const v = insured ? (claim ? -(Pm + d) : -Pm) : claim ? -L : 0;
  const slips: Slip[] = insured
    ? claim ? [[-d, undefined, `The ${M(Pm)} premium is paid too: ${M(-Pm)} − ${M(d)}.`], [-(Pm + L), MC.coversAll, `With a claim the insurer pays the loss above the deductible; ${Pl.who} pays only the ${M(d)} deductible plus the premium.`], [Pm + d, undefined, 'Those are costs: the net payoff is negative.']]
      : [[-(Pm + d), MC.dedEvery, `No loss, no claim: the deductible is only paid when there is a claim. Just the ${M(Pm)} premium.`], [0, MC.onlyOnWins, `The ${M(Pm)} premium is paid whether or not anything happens.`]]
    : claim ? [[-d, undefined, `Without the policy there is no deductible: ${Pl.who} pays the whole ${M(L)} loss.`], [-(L - d), undefined, `Without the policy, ${Pl.who} pays all of the ${M(L)}.`]]
      : [[-Pm, undefined, 'Without the policy there is no premium: nothing happens and nothing is paid.']];
  const tree: TreePic = { kind: 'dtree', opts: [{ label: 'insure', outs: [{ label: Pl.ev.replace(/^a /, ''), p: pd(p), v: null }, { label: 'nothing', p: pd(1 - p), v: null }] }, { label: 'no policy', outs: [{ label: Pl.ev.replace(/^a /, ''), p: pd(p), v: null }, { label: 'nothing', p: pd(1 - p), v: null }] }],
    reveal: { v: [[mx(-(Pm + d)), mx(-Pm)], [mx(-L), mx(0)]] } };
  return num({ id: `netInsure-${n}`, family: 'netInsure', prompt: `${Pl.who} can buy ${Pl.what} for ${M(Pm)} a year with ${an(d)} ${M(d)} deductible: after ${Pl.ev} (probability ${pd(p)} this year) ${Pl.who} pays the first ${M(d)} and the insurer pays the rest of the ${M(L)} loss. What is ${Pl.who}’s <b>net payoff for the year</b> ${insured ? 'with the policy' : 'without the policy'} if ${claim ? `there is ${Pl.ev}` : 'nothing happens'}?${NEG}`,
    board: '\\text{net payoff} = \\,?',
    solution: [insured ? `With the policy, the ${M(Pm)} premium is paid in every branch; the ${M(d)} deductible only after ${Pl.ev}.` : `Without the policy there is no premium and no deductible; ${Pl.who} pays any loss in full.`, insured && claim ? `${cap(Pl.ev)}: −${M(Pm)} − ${M(d)} = ${ans(M(v))}.` : `${claim ? cap(Pl.ev) : 'Nothing happens'}: the net payoff is ${ans(M(v))}.`], picture: { pics: [tree] } },
    v, 'Right: every cost in that branch, and only those.', slips, 'List what is paid in that branch: the premium (if insured), the deductible (only with a claim), or the whole loss (if not insured).');
};

// ===================== s1-payoff-distribution =====================
export const distDie: Gen = (R, n) => retry(() => {
  const die = R() < 0.55, N = die ? 6 : 8, c = pick(R, [1, 2, 3, 5]);
  const prizes = until(() => {
    const top = pick(R, [5, 6, 8, 10, 12, 15, 20]) + c, mid = pick(R, [c, c + 1, c + 2, 2 * c]);
    const nTop = 1, nMid = int(R, 1, 3), nZero = N - nTop - nMid;
    return { top, mid, nTop, nMid, nZero };
  }, o => o.nZero >= 2 && o.top !== o.mid && o.mid > 0);
  const faces = (die ? [...Array(prizes.nZero).fill(0), ...Array(prizes.nMid).fill(prizes.mid), ...Array(prizes.nTop).fill(prizes.top)] : [...Array(prizes.nTop).fill(prizes.top), ...Array(prizes.nMid).fill(prizes.mid), ...Array(prizes.nZero).fill(0)]) as number[];
  const nets = faces.map(x => x - c);
  const vals = [...new Set(nets)];
  const askV = pick(R, vals), k = nets.filter(x => x === askV).length;
  const desc = die ? `a 6 pays ${M(prizes.top)}, ${prizes.nMid === 1 ? 'a 5 pays' : prizes.nMid === 2 ? 'a 4 or 5 pays' : 'a 3, 4 or 5 pays'} ${M(prizes.mid)}, and any other roll pays nothing`
    : `one sector pays ${M(prizes.top)}, ${['', 'one sector pays', 'two sectors pay', 'three sectors pay'][prizes.nMid]} ${M(prizes.mid)}, and the other ${['', '', '', '', 'four', 'five', 'six'][prizes.nZero]} pay nothing`;
  const t: TablePic = { kind: 'table', rows: [{ head: die ? tt('roll') : tt('sector'), cells: faces.map((_, i) => String(i + 1)) }, { head: tt('prize'), cells: faces.map(x => `${x}`) }, { head: 'X', cells: faces.map(() => null) }], reveal: { cells: [faces.map(() => null), faces.map(() => null), nets.map(x => String(x))] } };
  const rv = askV === 0 ? '$0' : M(askV);
  return frac({ id: `distDie-${n}`, family: 'distDie', prompt: `A booth game costs ${M(c)}. ${die ? 'You roll one fair die' : 'You spin a spinner with 8 equal sectors'}: ${desc}. Let X be your net payoff (prize minus the ${M(c)}). What is <b>P(X = ${rv})</b>?`,
    board: `P(X = ${mx(askV)}) = \\,?`,
    solution: [`Net payoff = prize − ${M(c)}: ${[...new Set(faces)].map(x => `${M(x)} → ${M(x - c)}`).join(', ')}.`, `X = ${rv} for ${k} of the ${N} equally likely ${die ? 'rolls' : 'sectors'}: P = ${ft(k, N) === `${k}/${N}` ? ans(ft(k, N)) : `${k}/${N} = ${ans(ft(k, N))}`}.`], picture: { pics: [t] } },
    k, N, 'Right: count every outcome with that net payoff.', [[1, vals.length, MC.equiprob, `There are ${vals.length} different net payoffs, but they are not equally likely: count the ${die ? 'faces' : 'sectors'}.`], [k, 1, undefined, `That is a count. Divide it by the ${N} equally likely outcomes.`]],
    `Find every ${die ? 'roll' : 'sector'} whose prize minus ${M(c)} equals ${rv}, then divide by ${N}.`);
});

export const distComplete: Gen = (R, n) => {
  const ctx = pick(R, [{ thing: 'phone', R: [250, 300, 400], plan: [99, 129, 149], bad: 'it needs a repair' }, { thing: 'laptop', R: [350, 450, 600], plan: [149, 179, 199], bad: 'it needs a repair' }, { thing: 'TV', R: [300, 400, 500], plan: [89, 119, 149], bad: 'it needs a repair' }]);
  const Rp = pick(R, ctx.R), W = pick(R, ctx.plan), p = pick(R, [0.08, 0.1, 0.12, 0.15, 0.2, 0.25]);
  const skip = R() < 0.6;
  const opts: Opt[] = skip
    ? [{ t: `${M(-Rp)} with probability ${pd(p)}; $0 with probability ${pd(1 - p)}`, ok: true, say: 'Right: both outcomes, and the probabilities add to 1.' },
       { t: `${M(-Rp)} with probability ${pd(p)}`, mc: MC.noChange, say: `The “no repair” outcome is missing: $0 with probability ${pd(1 - p)}. A distribution lists every outcome.` },
       { t: `${M(-Rp)} with probability 0.5; $0 with probability 0.5`, mc: MC.equiprob, say: `Two outcomes are not automatically 50-50: the repair chance is ${pd(p)}.` },
       { t: `${M(-Rp)} with probability ${pd(p)}; $0 with probability ${pd(p)}`, mc: MC.notOne, say: `Those add to ${pd(2 * p)}, not 1. “No repair” has probability ${pd(1 - p)}.` }]
    : [{ t: `${M(-W)} with probability 1`, ok: true, say: 'Right: the plan price is paid for sure and every repair is covered, so one value with probability 1.' },
       { t: `${M(-W)} with probability ${pd(p)}; $0 with probability ${pd(1 - p)}`, mc: MC.onlyOnWins, say: `The ${M(W)} is paid up front, whether or not the ${ctx.thing} ever breaks.` },
       { t: `${M(-W - Rp)} with probability ${pd(p)}; ${M(-W)} with probability ${pd(1 - p)}`, mc: MC.coversAll, say: 'The plan covers every repair here, so a repair costs nothing extra.' },
       { t: `$0 with probability 1`, say: `The plan itself costs ${M(W)}.` }];
  return ch(R, { id: `distComplete-${n}`, family: 'distComplete', prompt: `A ${ctx.thing} has probability ${pd(p)} of needing ${an(Rp)} ${M(Rp)} repair within 2 years. A 2-year plan for ${M(W)} covers every repair. Which is the complete distribution of your net payoff over the 2 years if you <b>${skip ? 'skip the plan' : 'buy the plan'}</b>?`,
    board: `\\text{${skip ? 'skip' : 'buy'}: values and probabilities}`,
    solution: [skip ? `Skip: a repair costs ${M(Rp)} (probability ${pd(p)}); no repair costs $0 (probability ${pd(1 - p)}).` : `Buy: you pay ${M(W)} for sure, and any repair is free.`, skip ? `Check: ${pd(p)} + ${pd(1 - p)} = 1.` : 'One value with probability 1.'],
    picture: { pics: [{ kind: 'dtree', opts: [{ label: skip ? 'skip plan' : 'buy plan', outs: [{ label: 'repair', p: pd(p), v: null }, { label: 'no repair', p: pd(1 - p), v: null }] }], reveal: { v: [skip ? [mx(-Rp), mx(0)] : [mx(-W), mx(-W)]] } }] } }, opts);
};

// ===================== s1-fair-random-decision =====================
interface Scheme { text: string; fair: boolean; who: string; pn: number; pd: number; eqN: number; why: string; trap: 'positive' | 'equi' | 'lots' | 'reroll' | 'weighted' }
function scheme(R: () => number): Scheme {
  const k = int(R, 0, 6);
  if (k === 0) {
    const np = pick(R, [3, 4]), N = 100, w = Math.floor(N / np), last = N - w * (np - 1);
    const names = ['Ana', 'Ben', 'Cy', 'Di'].slice(0, np);
    const ranges = names.map((nm, i) => `${nm} ${i * w + 1}–${i === np - 1 ? N : (i + 1) * w}`).join(', ');
    const fair = last === w;
    const who = names[np - 1]!;
    return { text: `A random number generator picks a whole number from 1 to ${N} to choose who drives: ${ranges}.`, fair, who, pn: last, pd: N, eqN: np, why: fair ? '' : `${who} has ${last} of the ${N} numbers; the others have ${w}.`, trap: 'positive' };
  }
  if (k === 1) { /* never 7: the reason compares the sum with 7 */ const s = pick(R, [2, 3, 6, 8, 11, 12]); const ways = 6 - Math.abs(s - 7);
    return { text: `Eleven friends number themselves 2 to 12, roll two fair dice, and the sum picks who pays for pizza.`, fair: false, who: `the friend with number ${s}`, pn: ways, pd: 36, eqN: 11, why: `A sum of ${s} comes from ${ways} of the 36 rolls; a sum of 7 from 6.`, trap: 'equi' }; }
  if (k === 2) return { text: 'Six roommates number themselves 1 to 6 and roll one fair die to pick who gets the big room.', fair: true, who: 'roommate 4', pn: 1, pd: 6, eqN: 6, why: 'Each face has probability 1/6.', trap: 'positive' };
  if (k === 3) return { text: 'Five teammates number themselves 1 to 5 and roll a fair die to pick the captain; on a 6 they roll again.', fair: true, who: 'teammate 2', pn: 1, pd: 5, eqN: 5, why: 'Re-rolling every 6 leaves the five faces 1–5 equally likely: 1/5 each.', trap: 'reroll' };
  if (k === 4) return { text: 'Twelve players are numbered: heads 1–6, tails 7–12. They toss a fair coin and roll a fair die (heads and a 4 picks player 4, tails and a 4 picks player 10).', fair: true, who: 'player 10', pn: 1, pd: 12, eqN: 12, why: 'The 12 coin-die pairs are equally likely: 1/12 each.', trap: 'positive' };
  if (k === 5) {
    const t = pick(R, [[3, 5, 2], [4, 4, 2], [2, 6, 2], [5, 3, 2]]), tot = t[0]! + t[1]! + t[2]!;
    const okR = R() < 0.5, w = okR ? t : [t[0]! + 1, t[1]! - 1, t[2]!];
    const cuts: [number, number, number] = [w[0]!, w[0]! + w[1]!, tot];
    return { text: `A prize goes to one of three raffle buyers, with chances meant to match tickets bought: Ana ${t[0]}, Ben ${t[1]}, Cy ${t[2]} (${tot} tickets). A generator picks 1–${tot}: Ana 1–${cuts[0]}, Ben ${cuts[0] + 1}–${cuts[1]}, Cy ${cuts[1] + 1}–${tot}.`, fair: okR, who: 'Ben', pn: w[1]!, pd: tot, eqN: 3, why: okR ? `Each buyer’s range matches their tickets: Ben ${t[1]} of ${tot}.` : `Ben bought ${t[1]} tickets but has only ${w[1]} numbers; Ana has ${w[0]} for ${t[0]} tickets.`, trap: 'weighted' };
  }
  return { text: 'Four names go into a hat to pick who presents first. Three are on small folded slips; Jo’s name is on a large card.', fair: false, who: 'Jo', pn: 0, pd: 0, eqN: 4, why: 'The lots are not identical: a hand can find or avoid the large card, so the chances are not equal.', trap: 'lots' };
}
export const fairJudge: Gen = (R, n) => {
  const S = scheme(R);
  const opts: Opt[] = S.fair
    ? [{ t: S.trap === 'weighted' ? 'Fair: each chance matches the tickets bought' : 'Fair: every person has the same chance', ok: true, say: `Right. ${S.why}` },
       { t: 'Not fair: someone could be picked twice in a row', say: 'Each pick is a fresh random choice; past picks do not change the chances.' },
       { t: S.trap === 'reroll' ? 'Not fair: one face of the die is wasted' : 'Not fair: the numbers are not all used equally often in a short run', say: S.trap === 'reroll' ? 'The wasted 6 is rolled again, so it changes nobody’s chance.' : 'In a short run anything can happen; fairness is about the chances, which are equal here.' },
       { t: 'Fair, but only because everyone has some chance', mc: MC.positiveFair, say: 'Having some chance is not enough: fair means the chances are equal (or match the intended weights).' }]
    : [{ t: `Not fair: ${S.why.replace(/\.$/, '').replace(/^(A|The) /, m => m.toLowerCase())}`, ok: true, say: 'Right: the chances are not equal (or not as intended).' },
       { t: 'Fair: everyone has a chance to be picked', mc: MC.positiveFair, say: `Everyone has some chance, but not the same chance. ${S.why}` },
       { t: S.trap === 'equi' ? 'Fair: 11 sums for 11 people' : S.trap === 'lots' ? 'Fair: every name is in the hat once' : 'Fair: the ranges are about the same size', mc: S.trap === 'equi' ? MC.equiprob : undefined, say: S.trap === 'equi' ? 'The 11 sums are not equally likely: 7 has 6 of 36 rolls, 2 has 1.' : S.why }];
  return ch(R, { id: `fairJudge-${n}`, family: 'fairJudge', prompt: `${S.text} Is this a fair way to choose?`, board: '\\text{equal chances?}',
    solution: [`Fair selection: every person has the intended chance${S.trap === 'weighted' ? ' (here: in proportion to tickets)' : ' (here: the same chance)'}.`, S.why] }, opts);
};
export const fairProb: Gen = (R, n) => {
  const S = until(() => scheme(R), s => s.trap !== 'lots');
  const slips: [number, number, string | undefined, string][] = [[1, S.eqN, S.fair && S.trap !== 'weighted' ? undefined : MC.equiprob, S.trap === 'weighted' ? `The chances are set by the number ranges, not split evenly over the ${S.eqN} people.` : `That assumes all ${S.eqN} have the same chance. Count the outcomes that pick ${S.who}.`]];
  if (S.trap === 'reroll') slips.push([1, 6, undefined, 'The 6 is rolled again, so only the faces 1–5 can pick: 1 of 5.']);
  return frac({ id: `fairProb-${n}`, family: 'fairProb', prompt: `${S.text} What is the probability that <b>${S.who}</b> is chosen?`, board: `P(\\text{${S.who.replace('the friend with number', 'number')}}) = \\,?`,
    solution: [S.trap === 'equi' ? `List the 36 equally likely rolls of two dice; ${S.pn} of them give that sum.` : S.trap === 'reroll' ? 'Only rolls of 1–5 end the rolling, and they are equally likely.' : `Count the equally likely outcomes that pick ${S.who}: ${S.pn} of ${S.pd}.`, `P = ${ft(S.pn, S.pd) === `${S.pn}/${S.pd}` ? ans(ft(S.pn, S.pd)) : `${S.pn}/${S.pd} = ${ans(ft(S.pn, S.pd))}`}.`] },
    S.pn, S.pd, 'Right.', slips, `Count the equally likely outcomes that pick ${S.who} and divide by all of them.`);
};
void fx;
