// items.ts: the practice families of "Sampling and comparative inferences" (grade 7, 7.SP.A.1-2, 7.SP.B.3-4).
// Every family is a seeded generator (runtime/item.ts Gen): fixed structure, free skins (contexts.ts) and numbers in
// the ranges of the sub-goal it serves (topic JSON `cases`). Every number is computed by samplingMaths.ts; random
// samples come from the seeded rng, never Math.random. Wrong answers the classifier recognises carry the misconception
// id (logged, never shown). A miss shows the worked solution and replays it on the canvas (picture.post / work).
import { type Gen, type Item, type Response, int, pick, shuffle } from '../../runtime/item';
import { ans as mark, endOnChoice } from '../../runtime/explain';
import type { SamplerParams } from './Sampler';
import type { ScaleBarsParams } from './ScaleBars';
import type { NestedParams } from './Nested';
import { BIAS, CAT, CAT3, NAMES, NUM, TWO, type NumCtx } from './contexts';
import {
  commas, dec, drawIdx, farthest, iqr, mad, mean, median, mostWithin, pctCount, population, quartiles, repeatMeans,
  roundedFactorFirst, scaleExact, sum,
} from './samplingMaths';

export type SPic =
  | { kind: 'plots'; p: SamplerParams; pre: string[]; post: string[]; work: string[] }
  | { kind: 'bars'; p: ScaleBarsParams; pre: string[]; post: string[]; work: string[] }
  | { kind: 'nested'; p: NestedParams; pre: string[]; post: string[]; work: string[] };
export const picOf = (it: Item): SPic | undefined => it.picture as unknown as SPic | undefined;

const MC = {
  confuse: 'mc.statistics.confuses-sample-and-population-terms',
  everyone: 'mc.statistics.population-means-everyone-everywhere',
  mirror: 'mc.statistics.sample-should-mirror-population',
  smallerSpread: 'mc.statistics.smaller-sample-guarantees-smaller-spread',
  exact: 'mc.statistics.sample-statistic-as-exact-parameter',
  bigCures: 'mc.statistics.large-sample-cures-bias',
  convenient: 'mc.statistics.collects-from-whoever-is-convenient',
  handPicked: 'mc.statistics.hand-picked-typical-sample-as-random',
  dotIndividual: 'mc.statistics.sampling-dot-as-individual',
  indivSpread: 'mc.statistics.individual-vs-statistic-spread',
  reuse: 'mc.probability.reuses-object-without-replacement',
  protocol: 'mc.statistics.random-protocol-deviations-ok',
  everyMember: 'mc.statistics.mean-as-every-individual-value',
  recompute: 'mc.statistics.recompute-same-sample-as-resampling',
  additive: 'mc.ratio-rate.additive-keep-difference',
  ignoresSpread: 'mc.statistics.center-difference-ignores-spread',
  unrequested: 'mc.statistics.center-gap-divided-by-unrequested-spread',
  verdict: 'mc.statistics.spread-ratio-as-automatic-verdict',
  overlap: 'mc.statistics.overlap-makes-comparison-impossible',
  dishonest: 'mc.statistics.bias-means-dishonesty',
  beyond: 'mc.statistics.generalizes-beyond-sampled-group',
  early: 'mc.decimals.intermediate-precision-always-invalid',
  pctOfN: 'mc.statistics.sample-percent-applied-to-sample-size',
  complement: 'mc.statistics.complement-subtracts-unscaled-sample-count',
} as const;

// ---------- item builders ----------
interface Opt { t: string; ok?: boolean; mc?: string; say?: string }
interface Base { id: string; family: string; prompt: string; board: string; solution: string[]; picture?: SPic }
function choice(R: () => number, b: Base, opts: Opt[], okSay: string): Item {
  const order = shuffle(R, opts.map((_, i) => i));
  const choices = order.map(i => opts[i]!.t);
  const ans = order.findIndex(i => opts[i]!.ok);
  return {
    ...b, solution: endOnChoice(b.solution, opts.find(o => o.ok)!.t), picture: b.picture as unknown as Record<string, unknown> | undefined, input: 'choice', choices, answer: { kind: 'choice', i: ans },
    check(r: Response) {
      if (r.kind !== 'choice') return { ok: false, say: 'Pick one of the answers.' };
      const o = opts[order[r.i] ?? -1];
      if (!o) return { ok: false, say: 'Pick one of the answers.' };
      return o.ok ? { ok: true, say: okSay } : { ok: false, mc: o.mc, say: o.say ?? 'Not this one. Look at the worked solution.' };
    },
  };
}
interface Wrong { v: number; mc?: string; say: string }
function numeric(b: Base, ans: number, unit: string, wrongs: Wrong[], okSay: string, generic: string): Item {
  const W = wrongs.filter(w => Number.isFinite(w.v) && Math.abs(w.v - ans) > 1e-9);
  return {
    ...b, picture: b.picture as unknown as Record<string, unknown> | undefined, input: 'num', unit, answer: { kind: 'num', v: ans },
    check(r: Response) {
      if (r.kind !== 'num' || !Number.isFinite(r.v)) return { ok: false, say: 'Type a number.' };
      if (Math.abs(r.v - ans) < 1e-9) return { ok: true, say: okSay };
      const w = W.find(x => Math.abs(x.v - r.v) < 1e-9);
      return w ? { ok: false, mc: w.mc, say: w.say } : { ok: false, say: generic };
    },
  };
}
const list = (xs: readonly number[]) => xs.map(x => commas(x)).join(', ');
const texNum = (x: number) => commas(x).replace(/,/g, '{,}');
const T = (s: string) => `\\text{${s}}`;
const AX100 = { lo: 0, hi: 100, major: 20, minor: 5 } as const;
const seedOf = (R: () => number) => int(R, 1, 2 ** 30);
const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

// =====================================================================================================
// 1 pop-sample-id: name the population and the sample (incl. census and "cannot tell")
// =====================================================================================================
const popSample: Gen = (R, n) => {
  const kind = pick(R, ['explicit', 'explicit', 'mall', 'census', 'unstated'] as const);
  const name = pick(R, NAMES);
  if (kind === 'explicit') {
    const c = pick(R, CAT);
    const big = R() < 0.35;
    const N = big ? pick(R, [400, 600, 800, 1200, 1500, 2000]) : int(R, 6, 20) * 10;
    const m = big ? pick(R, [20, 30, 40, 50, 60, 80, 100]) : pick(R, [5, 8, 10, 12, 15, 20, 25, 30, 40]);
    const askPop = R() < 0.5;
    const prompt = `${name} wants to know how many of the <b class="a">${commas(N)} ${c.who} at ${c.place}</b> ${c.verb}. ${name} puts all ${commas(N)} names in a box, mixes them, and draws <b class="b">${m}</b>. <br>${askPop ? 'What is the <b>population</b>?' : 'What is the <b>sample</b>?'}`;
    const popT = `All ${commas(N)} ${c.who} at ${c.place}`, sampT = `The ${m} ${c.who} whose names were drawn`;
    const per = N <= 200 ? 1 : N % 10 === 0 && m % 10 === 0 && N / 10 <= 200 ? 10 : 0;
    const picture: SPic | undefined = per ? {
      kind: 'plots', pre: [], post: ['roster', 'pick'], work: [`\\cssId{a}{${T('population: ')}${texNum(N)}}`, `\\cssId{b}{${T('sample: ')}${m}}`],
      p: { roster: { N, label: `all ${commas(N)} ${c.who}`, picks: drawIdx(R, N / per, m / per), per, unit: c.who }, axis: { ...AX100, unit: '' }, rows: [] },
    } : { kind: 'nested', pre: [], post: ['outer', 'inner'], work: [`\\cssId{a}{${T('population: ')}${texNum(N)}}`, `\\cssId{b}{${T('sample: ')}${m}}`], p: { outer: `all ${commas(N)} ${c.who}`, inner: `the ${m} drawn`, kind: 'part' } };
    const opts: Opt[] = askPop
      ? [{ t: popT, ok: true }, { t: sampT, mc: MC.confuse, say: 'Those are the ones who answered: the sample. The population is the whole group the question is about.' }, { t: `All ${c.who} in the United States`, mc: MC.everyone, say: `The question is only about ${c.place}. The population is the whole group the question is about, not everyone everywhere.` }]
      : [{ t: sampT, ok: true }, { t: popT, mc: MC.confuse, say: 'That is the whole group the question is about: the population. The sample is the part that was drawn.' }, { t: `All ${c.who} in the United States`, mc: MC.everyone, say: `Nobody outside ${c.place} was drawn. The sample is the ${m} names from the box.` }];
    return choice(R, {
      id: `popSample-${n}`, family: 'popSample', prompt, board: `${T('population?')}\\quad ${T('sample?')}`, picture,
      solution: [`The question is about all ${commas(N)} ${c.who} at ${c.place}: that is the <b class="a">population</b>.`, `The ${m} drawn names are the <b class="b">sample</b>, a part of the population.`],
    }, opts, askPop ? `Yes: the population is the whole group the question is about, all ${commas(N)}.` : `Yes: the sample is the ${m} ${c.who} who were drawn.`);
  }
  if (kind === 'mall') {
    const st = pick(R, [['Ohio', 'Columbus'], ['Texas', 'Austin'], ['Oregon', 'Portland'], ['Georgia', 'Atlanta'], ['Michigan', 'Detroit']] as const);
    const m = int(R, 4, 20) * 5;
    const askPop = R() < 0.6;
    const prompt = `A reporter wants to know how far <b class="a">shoppers in ${st[0]}</b> drive to go shopping. She asks <b class="b">${m} shoppers at one mall in ${st[1]}</b>. <br>${askPop ? 'What is the <b>population</b>?' : 'What is the <b>sample</b>?'}`;
    const popT = `All shoppers in ${st[0]}`, sampT = `The ${m} shoppers she asked`;
    const opts: Opt[] = askPop
      ? [{ t: popT, ok: true }, { t: sampT, mc: MC.confuse, say: 'Those are the people who answered: the sample. The question is about shoppers in the whole state.' }, { t: 'Every shopper in the world', mc: MC.everyone, say: `The question is about ${st[0]}, not the whole world.` }, { t: `Only the shoppers at that one mall`, say: `She asked at one mall, but the question is about shoppers in all of ${st[0]}.` }]
      : [{ t: sampT, ok: true }, { t: popT, mc: MC.confuse, say: 'That is the group the question is about: the population.' }, { t: 'Every shopper in the world', mc: MC.everyone, say: `Only ${m} people were asked: they are the sample.` }];
    return choice(R, {
      id: `popSample-${n}`, family: 'popSample', prompt, board: `${T('population?')}\\quad ${T('sample?')}`,
      picture: { kind: 'nested', pre: [], post: ['outer', 'inner'], work: [`\\cssId{a}{${T(`all shoppers in ${st[0]}`)}}`, `\\cssId{b}{${T(`sample: ${m} at one mall`)}}`], p: { outer: `all shoppers in ${st[0]}`, inner: `${m} at one mall`, kind: 'part' } },
      solution: [`The question is about <b class="a">all shoppers in ${st[0]}</b>: the population is wider than the one mall.`, `The <b class="b">${m} shoppers at the mall</b> are the sample.`],
    }, opts, askPop ? `Yes: the population is everyone the question is about, all shoppers in ${st[0]}.` : `Yes: the ${m} shoppers who were asked are the sample.`);
  }
  if (kind === 'census') {
    const team = pick(R, ['soccer team', 'robotics club', 'school band', 'chess club', 'swim team']);
    const N = int(R, 12, 30);
    const prompt = `Coach ${name} wants to know how the <b class="a">${N} members of the ${team}</b> get to practice. ${name} asks <b class="b">all ${N}</b> of them. Which is true?`;
    return choice(R, {
      id: `popSample-${n}`, family: 'popSample', prompt, board: `${T('asked: all ')}${N}`,
      picture: { kind: 'plots', pre: [], post: ['roster', 'pick'], work: [`\\cssId{a}{${T('population: ')}${N}}`, `\\cssId{b}{${T('asked: all ')}${N}}`], p: { roster: { N, label: `all ${N} members`, picks: Array.from({ length: N }, (_, i) => i) }, axis: { ...AX100, unit: '' }, rows: [] } },
      solution: [`The question is about the ${N} members, and all ${N} answered.`, 'When everyone in the population answers, it is a <b>census</b>: the sample is the whole population.'],
    }, [
      { t: `It is a census: the population and the group asked are the same ${N} members`, ok: true },
      { t: `The population is all ${team} members in the country`, mc: MC.everyone, say: `The coach only asks about this ${team}. The population is these ${N} members.` },
      { t: `The ${N} members are a sample, so the population must be bigger`, mc: MC.confuse, say: `Everyone the question is about was asked. That is a census: the ${N} are the population.` },
    ], `Yes: everyone in the population answered, so it is a census.`);
  }
  const m = int(R, 3, 12) * 5;
  const where = pick(R, ['at a skate park', 'outside a movie theater', 'at a bus stop', 'at a basketball game']);
  const prompt = `A blogger asked <b class="b">${m} people ${where}</b> whether they like a new phone. The post does not say whose opinion the blogger wants to know. What is the population?`;
  return choice(R, {
    id: `popSample-${n}`, family: 'popSample', prompt, board: `${T('asked: ')}${m}\\quad ${T('population?')}`,
    picture: { kind: 'nested', pre: [], post: ['outer', 'inner'], work: [T('population: not stated')], p: { outer: null, inner: `the ${m} people asked`, kind: 'part' } },
    solution: ['The population is the whole group the question is about, and the post never names it.', `The ${m} people ${where} are the sample. From the information given, we <b>cannot tell</b> the population.`],
  }, [
    { t: 'You cannot tell from the information given', ok: true },
    { t: `The ${m} people ${where}`, mc: MC.confuse, say: 'Those are the people asked: the sample. The population is the group the question is about, and the post does not say.' },
    { t: 'Everyone in the world', mc: MC.everyone, say: 'A population is the group a question is about, not everyone everywhere. Here it is not stated.' },
    { t: 'Everyone who owns a phone', say: 'That is a guess. The post does not say whose opinion it is about.' },
  ], 'Yes: the study never says which group it is about, so we cannot tell.');
};

// =====================================================================================================
// 2 within-variability: spread of a sample's values vs the population's values
// =====================================================================================================
const spreadCompare: Gen = (R, n) => {
  const c = pick(R, NUM);
  const want = pick(R, ['less', 'more', 'same'] as const);
  for (let tries = 0; ; tries++) {
    const N = int(R, 24, 36);
    const pop = population({ N, mu: c.mu + int(R, -5, 10), sd: c.sd, lo: 0, hi: 100, step: 5, seed: seedOf(R) });
    const m = int(R, 6, 10);
    const mu = mean(pop);
    const byDist = pop.map((v, i) => [Math.abs(v - mu), i] as const).sort((a, b) => a[0] - b[0]).map(x => x[1]);
    let I: number[];
    if (want === 'less') I = shuffle(R, byDist.slice(0, Math.ceil(N * 0.45))).slice(0, m);
    else if (want === 'more') I = shuffle(R, byDist.slice(-Math.ceil(N * 0.35))).slice(0, m);
    else I = drawIdx(R, N, m);
    const S = I.map(i => pop[i]!);
    const mp = mad(pop), ms = mad(S), r = ms / mp;
    const okCase = want === 'less' ? r <= 0.7 : want === 'more' ? r >= 1.3 : r >= 0.88 && r <= 1.12;
    if (!okCase && tries < 60) continue;
    if (!okCase) continue;
    const text = { less: 'The sample’s values are less spread out', more: 'The sample’s values are more spread out', same: 'About as spread out as the population’s values' } as const;
    const opts: Opt[] = (['less', 'more', 'same'] as const).map(k => ({
      t: text[k], ok: k === want,
      mc: k === want ? undefined : k === 'less' ? MC.smallerSpread : k === 'same' ? MC.mirror : undefined,
      say: k === 'less' ? 'Fewer values does not mean less spread. Compare how far the dots sit from the middle in each plot.' : k === 'same' ? 'A sample need not look like the population. Compare how far the dots sit from the middle.' : 'Look again: are the sample’s dots farther from the middle than the population’s?',
    }));
    return choice(R, {
      id: `spreadCompare-${n}`, family: 'spreadCompare',
      prompt: `The top plot shows the ${c.what} of <b class="a">all ${N} ${c.who}</b> in a group. The bottom plot shows <b class="b">a sample of ${m}</b> of them. How does the spread of the sample’s values compare with the spread of all ${N}?`,
      board: `${T('spread: sample vs all ')}${N}`,
      picture: { kind: 'plots', pre: ['row0', 'row1'], post: [], work: [`\\cssId{a}{${T('MAD of all ')}${N} = ${dec(mp, 1)}}`, `\\cssId{b}{${T('MAD of the sample')} = ${dec(ms, 1)}}`], p: { axis: { ...AX100, unit: c.unit }, rows: [{ label: `all ${N} ${c.who}`, values: pop, col: 'first' }, { label: `a sample of ${m}`, values: S, col: 'second' }] } },
      solution: [`Mean distance from the middle (MAD): all ${N}: ${dec(mp, 1)}, the sample: ${dec(ms, 1)}.`, want === 'same' ? 'About the same spread.' : want === 'less' ? 'The sample’s values bunch near the middle: less spread.' : 'The sample’s values sit near the ends: more spread, even though there are fewer of them.'],
    }, opts, 'Yes. A sample’s spread can be smaller, larger or about the same as the population’s.');
  }
};

// =====================================================================================================
// 3 statistic-parameter: the sample mean/median (known) vs the population's (usually unknown)
// =====================================================================================================
const statParam: Gen = (R, n) => {
  const c = pick(R, NUM), name = pick(R, NAMES);
  const stat = R() < 0.65 ? 'mean' : 'median';
  const N = int(R, 10, 60) * 10, m = int(R, 5, 20);
  const s = c.mu + int(R, -8, 8);
  if (R() < 0.45) {
    const P = s + pick(R, [-5, -4, -3, -2, 2, 3, 4, 5]);
    return choice(R, {
      id: `statParam-${n}`, family: 'statParam',
      prompt: `For a class project, ${c.place} recorded the ${c.what} of <b class="a">all ${N} ${c.who}</b>: the ${stat} is ${P}. ${name} drew <b class="b">a random sample of ${m}</b> of them; the sample’s ${stat} is ${s}. Which is true?`,
      board: `${P}\\quad ${T('and')}\\quad ${s}`,
      solution: [`${P} comes from all ${N}: it is the <b class="a">population ${stat}</b>.`, `${s} comes from the ${m} drawn: it is the <b class="b">sample ${stat}</b>. A random sample lands near the population value, not on it.`],
    }, [
      { t: `${P} is the population ${stat}, and ${s} is the sample ${stat}`, ok: true },
      { t: `${s} is the population ${stat}, and ${P} is the sample ${stat}`, mc: MC.confuse, say: `The population ${stat} comes from all ${N}; the sample ${stat} comes from the ${m} drawn.` },
      { t: `The sample was drawn wrong: a random sample’s ${stat} equals the population ${stat}`, mc: MC.mirror, say: 'Random samples vary. A sample value close to, but not equal to, the population value is normal.' },
    ], `Yes: ${P} is the population ${stat} (all ${N}), ${s} the sample ${stat} (the ${m} drawn).`);
  }
  return choice(R, {
    id: `statParam-${n}`, family: 'statParam',
    prompt: `${name} drew <b class="b">a random sample of ${m}</b> of the <b class="a">${N} ${c.who}</b> at ${c.place} and recorded their ${c.what}. The sample ${stat} is ${s}. What do we know about the ${stat} of all ${N}?`,
    board: `${T(`sample ${stat}`)} = ${s}`,
    solution: [`${s} is the <b class="b">sample ${stat}</b>: it is known.`, `The ${stat} of all ${N} is unknown (nobody measured them all). ${s} is an <b class="s">estimate</b> of it.`],
  }, [
    { t: `It is unknown; ${s} is an estimate of it`, ok: true },
    { t: `It is exactly ${s}`, mc: MC.exact, say: `Only ${m} of the ${N} were measured. Another random sample would give a slightly different ${stat}.` },
    { t: `Every one of the ${N} ${c.who}: exactly ${s}`, mc: MC.everyMember, say: `A ${stat} sums up a group; the ${c.who} have different values.` },
  ], `Yes: the population ${stat} is unknown, and ${s} is our estimate.`);
};

// =====================================================================================================
// 4 random-representative: which method is random; a random sample that misses the population value
// =====================================================================================================
const isRandom: Gen = (R, n) => {
  const c = pick(R, CAT.filter(x => x.who === 'students')), name = pick(R, NAMES);
  const N = int(R, 20, 90) * 10, m = int(R, 4, 12) * 5;
  const right = pick(R, [
    `Draw ${m} of the ${N} names from a box of identical slips`,
    `Pick ${m} different roster numbers with a random number generator`,
  ]);
  const wrongs: Opt[] = shuffle(R, [
    { t: `Ask the first ${m} who walk into the cafeteria`, mc: MC.convenient, say: 'Whoever comes first is convenient, not random: some students never pass by then.' },
    { t: `Use the first ${m} who sign up on a sheet`, mc: MC.convenient, say: 'Volunteers choose themselves. A random sample is chosen by a chance process.' },
    { t: `Have a teacher pick ${m} who seem typical`, mc: MC.handPicked, say: 'Hand-picking is not random, even when the choices look typical. Only a chance process gives everyone the same chance.' },
    { t: `Ask all ${Math.min(N - 10, m * 4)} at a basketball game`, mc: MC.bigCures, say: 'More answers from one place still leave out everyone who was not there. Size does not make a sample random.' },
  ]).slice(0, 3);
  return choice(R, {
    id: `isRandom-${n}`, family: 'isRandom',
    prompt: `${name} wants to know how many of the <b class="a">${N} ${c.who}</b> at ${c.place} ${c.verb}. Which way of choosing <b class="b">${m}</b> of them gives every one the same chance to be chosen?`,
    board: `${T('random sample: ')}${m}${T(' of ')}${N}`,
    solution: ['A random sample uses a chance process (slips, a random number generator).', 'Then every member has the same chance to be picked, so no group is favored.'],
  }, [{ t: right, ok: true }, ...wrongs], 'Yes: a chance process gives every member the same chance.');
};
const randomDiffers: Gen = (R, n) => {
  const c = pick(R, NUM), name = pick(R, NAMES);
  const N = int(R, 20, 80) * 10, m = pick(R, [10, 15, 20, 25, 30]);
  const P = c.mu + int(R, -6, 6), s = P + pick(R, [-5, -4, -3, -2, -1, 1, 2, 3, 4, 5]);
  return choice(R, {
    id: `randomDiffers-${n}`, family: 'randomDiffers',
    prompt: `${name} used a random number generator to pick <b class="b">${m}</b> of the <b class="a">${N} ${c.who}</b> at ${c.place}. Their mean ${c.what.replace(/ \(.*\)$/, '')}: <b class="b">${s}</b>. Later the school measured all ${N}: the mean is <b class="a">${P}</b>. What does the difference tell you?`,
    board: `${T('sample mean ')}${s}\\quad ${T('all ')}${N}: ${P}`,
    solution: ['Each random sample is a different set of members, so its mean lands <b>near</b> the population mean, not exactly on it.', `A miss of ${Math.abs(s - P)} is chance at work, not a mistake.`],
  }, [
    { t: 'Nothing went wrong: random samples land near the population mean, not exactly on it', ok: true },
    { t: 'The sample was not really random: a random sample matches the population', mc: MC.mirror, say: 'Random samples tend to be close, but they almost never match exactly. That is normal.' },
    { t: `Hand-picking ${m} typical ${c.who} would have been closer`, mc: MC.handPicked, say: 'Hand-picking lets a person’s choices creep in. Random selection is what keeps a sample fair.' },
  ], 'Yes: a random sample tends to be representative, but it does not match exactly.');
};

// =====================================================================================================
// 5 sampling-variability-concept: one dot = one sample's mean; different samples, different means
// =====================================================================================================
function simPop(R: () => number, c: NumCtx, N: number): { pop: number[]; P: number } {
  const P = c.mu + int(R, -4, 4);
  return { pop: population({ N, mu: P, sd: c.sd, lo: 0, hi: 100, step: 5, seed: seedOf(R), total: N * P }), P };
}
const whatDot: Gen = (R, n) => {
  const c = pick(R, NUM);
  const N = int(R, 10, 30) * 10, m = pick(R, [5, 10]);
  const { pop } = simPop(R, c, N);
  const sim = repeatMeans(pop, m, 20, R);
  const one = sim.idx[0]!.map(i => pop[i]!);
  return choice(R, {
    id: `whatDot-${n}`, family: 'whatDot',
    prompt: `From the <b class="a">${N} ${c.who}</b>, a computer drew 20 random samples of ${m}. The top plot shows the ${c.what} in the first sample. In the bottom plot, what does <b>one dot</b> stand for?`,
    board: `20 ${T(' samples of ')}${m}`,
    picture: { kind: 'plots', pre: ['row0', 'row1'], post: ['mark0'], work: [`\\cssId{s}{${T('one dot = the mean of ')}${m}}`], p: { axis: { ...AX100, unit: c.unit }, rows: [{ label: `one sample of ${m}`, values: one, col: 'second', mark: { at: mean(one), col: 'link' } }, { label: `means of 20 samples of ${m}`, values: sim.means, col: 'link', bin: 0, r: 12 }] } },
    solution: [`Each dot in the bottom plot is the <b class="s">mean of one whole sample</b> of ${m} ${c.who}.`, `The lime mark under the top plot is the first sample’s mean: it becomes one dot below.`],
  }, [
    { t: `The mean of one random sample of ${m} ${c.who}`, ok: true },
    { t: `One ${c.one}’s value`, mc: MC.dotIndividual, say: `The bottom plot has 20 dots for 20 samples. Each dot sums up a whole sample of ${m}.` },
    { t: `The mean of all ${N} ${c.who}`, mc: MC.exact, say: 'There is only one population mean, but 20 dots: each dot is one sample’s mean.' },
  ], `Yes: each dot is one sample’s mean, ${m} ${c.who} summed up in one number.`);
};
const twoSamples: Gen = (R, n) => {
  const c = pick(R, NUM), [a, b] = shuffle(R, [...NAMES]).slice(0, 2) as [string, string];
  const N = int(R, 20, 80) * 10, m = pick(R, [10, 20, 25]);
  const lo = c.mu + int(R, -10, 0), gap = 2 * int(R, 2, 6), hi = lo + gap;
  const [m1, m2] = R() < 0.5 ? [lo, hi] : [hi, lo];
  return choice(R, {
    id: `twoSamples-${n}`, family: 'twoSamples',
    prompt: `${a} and ${b} each drew a random sample of ${m} from the same <b class="a">${N} ${c.who}</b> at ${c.place}. ${a}’s sample mean: <b class="b">${m1}</b>. ${b}’s: <b class="b">${m2}</b> (${c.unit}). What do you conclude?`,
    board: `${m1}\\quad ${T('and')}\\quad ${m2}`,
    solution: ['Two random samples hold different members, so their means differ. That is <b>sampling variability</b>, not a mistake.', `Both are estimates; the population mean is unknown and probably not far from them.`],
  }, [
    { t: 'Both are fair estimates: different random samples give different means', ok: true },
    { t: 'One of them made a mistake: random samples from the same group give the same mean', mc: MC.mirror, say: 'Different random samples contain different members. Their means are expected to differ a little.' },
    { t: `The mean of all ${N} is exactly ${(m1 + m2) / 2}, halfway between`, mc: MC.exact, say: 'Halfway is a reasonable estimate, but nothing makes it exact. The population mean is still unknown.' },
  ], 'Yes: a different result from another random sample is expected.');
};

// =====================================================================================================
// 6 sample-size-effect: bigger random samples, less variable means (not less varied individuals)
// =====================================================================================================
const whichSize: Gen = (R, n) => {
  const c = pick(R, NUM);
  for (;;) {
    const N = int(R, 30, 50) * 10;
    const { pop, P } = simPop(R, c, N);
    const small = repeatMeans(pop, 10, 20, R).means, big = repeatMeans(pop, 50, 20, R).means;
    if (!(farthest(big, P) < 0.6 * farthest(small, P) && mostWithin(big, P) < mostWithin(small, P))) continue;
    const bigFirst = R() < 0.5;
    const rows = bigFirst ? [big, small] : [small, big];
    const label = bigFirst ? 'Plot A' : 'Plot B';
    return choice(R, {
      id: `whichSize-${n}`, family: 'whichSize',
      prompt: `From the same <b class="a">${N} ${c.who}</b>, a computer drew 20 random samples of <b class="b">10</b> and 20 random samples of <b class="b">50</b>, and plotted each sample’s mean. Which plot shows the samples of 50?`,
      board: `${T('samples of ')}10\\ ${T('or')}\\ 50?`,
      picture: { kind: 'plots', pre: ['row0', 'row1'], post: ['pop'], work: [`${T('means of 50: tighter')}`], p: { axis: { ...AX100, unit: c.unit }, pop: { at: P, label: `mean of all ${N}` }, rows: [{ label: 'Plot A: 20 sample means', values: rows[0]!, col: 'link', bin: 0, r: 12 }, { label: 'Plot B: 20 sample means', values: rows[1]!, col: 'link', bin: 0, r: 12 }] } },
      solution: ['A mean of 50 values averages out more highs and lows than a mean of 10.', `So means of samples of 50 bunch closer to the population mean: <b>${label}</b>, the narrower plot.`],
    }, [
      { t: 'Plot A', ok: bigFirst, mc: bigFirst ? undefined : MC.smallerSpread, say: bigFirst ? undefined : 'Bigger samples make the means vary less, not more. Pick the plot whose dots bunch closer together.' },
      { t: 'Plot B', ok: !bigFirst, mc: bigFirst ? MC.smallerSpread : undefined, say: bigFirst ? 'Bigger samples make the means vary less, not more. Pick the plot whose dots bunch closer together.' : undefined },
      { t: 'You can’t tell: both come from the same population', mc: MC.indivSpread, say: 'Same population, but sample size changes how much the MEANS vary: bigger samples, tighter means.' },
    ], `Yes: means of bigger samples bunch closer to the population mean.`);
  }
};
const biggerSample: Gen = (R, n) => {
  const c = pick(R, NUM), name = pick(R, NAMES);
  const small = pick(R, [5, 10, 15]), big = small * pick(R, [4, 5, 10]);
  return choice(R, {
    id: `biggerSample-${n}`, family: 'biggerSample',
    prompt: `${name} says: “If we take random samples of <b class="b">${big}</b> instead of <b class="b">${small}</b> ${c.who}, the ${c.who} in each sample will be less different from each other.” Is ${name} right?`,
    board: `${small}\\ \\to\\ ${big}`,
    solution: [`The ${c.who} vary just as much as before: a bigger sample does not change them.`, 'What changes is the <b class="s">sample mean</b>: with more values it varies less from sample to sample.'],
  }, [
    { t: `No: the ${c.who} vary as much as ever; it is the sample means that vary less`, ok: true },
    { t: 'Yes: in bigger samples the values are closer together', mc: MC.indivSpread, say: `Each ${c.one} has the value it has. Only the mean of a bigger sample is steadier.` },
    { t: 'No: bigger samples make the sample means vary more', mc: MC.smallerSpread, say: 'It goes the other way: means of bigger samples vary less.' },
  ], 'Yes: bigger samples give steadier means, not more alike individuals.');
};

// =====================================================================================================
// 7 random-sampling-protocol: use a random number list (skip repeats and numbers off the roster)
// =====================================================================================================
const pad2 = (x: number) => String(x).padStart(2, '0');
const drawNumbers: Gen = (R, n) => {
  const c = pick(R, CAT), name = pick(R, NAMES);
  const N = int(R, 20, 95), m = int(R, 4, 6);
  for (;;) {
    const good = drawIdx(R, N, m).map(i => i + 1);
    const repAt = int(R, 1, m - 1), offAt = int(R, 1, m);
    const rep = good[int(R, 0, repAt - 1)]!;
    const off = N < 99 ? int(R, N + 1, 99) : 0;
    const seq: number[] = [];
    good.forEach((g, i) => { if (i === repAt) seq.push(rep); if (i === offAt) seq.push(off); seq.push(g); });
    if (offAt === m) seq.push(off);
    seq.push(int(R, 1, N));
    // the protocol: in order, skip a number already used or not on the roster
    const used: number[] = [];
    for (const x of seq) if (x >= 1 && x <= N && !used.includes(x) && used.length < m) used.push(x);
    const keepRepeat: number[] = []; for (const x of seq) if (x >= 1 && x <= N && keepRepeat.length < m) keepRepeat.push(x);
    const keepOff: number[] = []; for (const x of seq) if (!keepOff.includes(x) && keepOff.length < m) keepOff.push(x);
    const fmt = (xs: number[]) => xs.map(pad2).join(', ');
    const A = fmt(used), B = fmt(keepRepeat), C = fmt(keepOff);
    if (new Set([A, B, C]).size < 3 || used.length < m) continue;
    return choice(R, {
      id: `drawNumbers-${n}`, family: 'drawNumbers',
      prompt: `${name} numbered the <b class="a">${N} ${c.who}</b> on the roster 01 to ${pad2(N)} and needs a random sample of <b class="b">${m}</b>, nobody twice. Going along the random numbers on the board, which ${c.who} are in the sample?`,
      board: seq.map(pad2).join(',\\ '),
      solution: [`Read in order. Skip ${pad2(rep)} the second time: that ${c.who.replace(/s$/, '')} is already in the sample.`, `${off === 0 ? 'Skip 00' : `Skip ${pad2(off)}`}: nobody on the roster has that number.`, `The sample: ${A}.`],
    }, [
      { t: A, ok: true },
      { t: B, mc: MC.reuse, say: `${pad2(rep)} comes up twice, but a slip that is drawn is out of the box: skip the repeat.` },
      { t: C, say: `No one has number ${pad2(off)}: the roster stops at ${pad2(N)}. Skip it.` },
    ], 'Yes: in order, skipping the repeat and the number off the roster.');
  }
};
const absent: Gen = (R, n) => {
  const name = pick(R, NAMES);
  const N = int(R, 30, 99), k = int(R, 1, N);
  return choice(R, {
    id: `absent-${n}`, family: 'absent',
    prompt: `${name} uses random numbers to pick students from a roster of ${N}. Number <b class="b">${pad2(k)}</b> came up, but that student is absent on the day of the survey. What should ${name} do?`,
    board: `${pad2(k)}\\ ${T('is absent')}`,
    solution: ['Stick to the chance process: ask that student later, or use the next random number.', 'Swapping in someone nearby lets convenience choose instead of chance.'],
  }, shuffle(R, [
    { t: `Ask student ${pad2(k)} when they are back, or go on to the next random number`, ok: true },
    { t: `Ask the student who sits next to ${pad2(k)} instead`, mc: MC.protocol, say: 'A neighbor was not picked by chance. Swapping in a convenient person breaks the random sample.' },
    { t: 'Ask a friend instead: one person more or less won’t matter', mc: MC.protocol, say: 'A friend is chosen by convenience, not chance. Use the next random number instead.' },
  ]), 'Yes: keep the random process; never swap in a convenient person.');
};

// =====================================================================================================
// 8 estimate-from-sample: the sample mean / median as an estimate, reported as one
// =====================================================================================================
const estimate: Gen = (R, n) => {
  const c = pick(R, NUM), name = pick(R, NAMES);
  const stat = R() < 0.6 ? 'mean' : 'median';
  for (;;) {
    const m = int(R, 5, 10);
    const N = int(R, 10, 60) * 10;
    const xs = Array.from({ length: m }, () => Math.max(0, Math.min(100, Math.round(c.mu + (R() + R() + R() - 1.5) * c.sd * 1.4))));
    const v = stat === 'mean' ? mean(xs) : median(xs);
    if (stat === 'mean' && !Number.isInteger(v)) continue;
    if (new Set(xs).size < m - 2) continue;
    const other = stat === 'mean' ? median(xs) : mean(xs);
    const sorted = [...xs].sort((a, b) => a - b);
    const work = stat === 'mean'
      ? [`${T('sum')} = ${sum(xs)}`, `${sum(xs)} \\div ${m} = ${v}`, `${T('estimate: about ')}${dec(v, 1)}`]
      : [m % 2 ? `${T('middle value: ')}${dec(v, 1)}` : `${T('middle two: ')}${sorted[m / 2 - 1]}, ${sorted[m / 2]}`, ...(m % 2 ? [] : [`(${sorted[m / 2 - 1]} + ${sorted[m / 2]}) \\div 2 = ${dec(v, 1)}`]), `${T('estimate: about ')}${dec(v, 1)}`];
    return numeric({
      id: `estimate-${n}`, family: 'estimate',
      prompt: `${name} drew a random sample of <b class="b">${m}</b> of the <b class="a">${N} ${c.who}</b> at ${c.place}. Their ${c.what}: ${list(xs)}. Use the sample to estimate the <b>${stat}</b> for all ${N} ${c.who}.`,
      board: `${T('sample of ')}${m}\\ \\to\\ ${T(`${stat}?`)}`,
      picture: { kind: 'plots', pre: ['row0'], post: ['mark0'], work, p: { axis: { ...axisFor(xs), unit: c.unit }, rows: [{ label: `sample of ${m}`, values: xs, col: 'second', bin: 0, mark: { at: v, col: 'link' } }] } },
      solution: stat === 'mean' ? [`Add the ${m} values: ${sum(xs)}. Divide by ${m}: ${dec(v, 1)}.`, `The sample mean, ${dec(v, 1)}, is the estimate for all ${N}: about ${mark(dec(v, 1))} ${c.unit}.`] : [`Put the ${m} values in order: ${sorted.join(', ')}.`, `The middle ${m % 2 ? 'value' : 'two values average to'} ${dec(v, 1)}: about ${mark(dec(v, 1))} ${c.unit} for all ${N}.`],
    }, v, c.unit, [
      { v: sum(xs), say: `That is the total of the ${m} values. Divide by ${m} for the mean.` },
      { v: other, say: stat === 'mean' ? 'That is the middle value (the median). The question asks for the mean.' : 'That is the mean. The question asks for the median: the middle value in order.' },
    ], `Yes: about ${dec(v, 1)} ${c.unit}. Another random sample would give a slightly different estimate.`, stat === 'mean' ? `Add the ${m} values and divide by ${m}.` : 'Put the values in order and find the middle.');
  }
};
const report: Gen = (R, n) => {
  const c = pick(R, NUM), name = pick(R, NAMES);
  const N = int(R, 20, 90) * 10, m = int(R, 10, 20), s = c.mu + int(R, -8, 8);
  return choice(R, {
    id: `report-${n}`, family: 'report',
    prompt: `${name}’s random sample of <b class="b">${m}</b> ${c.who} from ${c.place} has a mean of <b class="b">${s} ${c.unit}</b> (${c.what}). How should ${name} report the mean for all <b class="a">${N}</b>?`,
    board: `${T('sample mean')} = ${s}`,
    solution: ['A sample mean is an <b class="s">estimate</b> of the population mean, so say “about”.', 'Another random sample would give a slightly different number.'],
  }, [
    { t: `About ${s} ${c.unit}: another random sample would give a slightly different number`, ok: true },
    { t: `Exactly ${s} ${c.unit}`, mc: MC.exact, say: `Only ${m} of the ${N} were measured, so ${s} is an estimate, not the exact mean.` },
    { t: `Each of the ${N} ${c.who}: ${s} ${c.unit}`, mc: MC.everyMember, say: 'A mean sums up the group. The individual values still differ.' },
  ], 'Yes: report it as an estimate.');
};

// =====================================================================================================
// 9 simulate-repeated-samples: how far sample means typically land from a known population mean
// =====================================================================================================
const typical: Gen = (R, n) => {
  const c = pick(R, NUM);
  for (;;) {
    const N = pick(R, [100, 150, 200]);
    const { pop, P } = simPop(R, c, N);
    const sim = repeatMeans(pop, 10, 20, R);
    const d = mostWithin(sim.means, P), mp = Math.round(mad(pop));
    if (d < 2 || mp < d + 4 || P - d < 2 || P + d > 98) continue;
    const one = sim.idx[0]!.map(i => pop[i]!);
    return choice(R, {
      id: `typical-${n}`, family: 'typical',
      prompt: `${c.place} knows the ${c.what} of all <b class="a">${N} ${c.who}</b>: the mean is <b class="a">${P}</b>. A computer drew 20 random samples of 10 and plotted each sample’s mean (bottom). Most of the sample means land within about how far of ${P}?`,
      board: `${T('mean of all ')}${N} = ${P}`,
      picture: { kind: 'plots', pre: ['row0', 'row1', 'pop'], post: ['band0'], work: [`${mostWithinCount(sim.means, P, d)}${T(' of 20 within ')}${d}${T(' of ')}${P}`], p: { axis: { ...AX100, unit: c.unit }, pop: { at: P, label: `mean of all ${N}` }, bands: [{ row: 1, at: P, d }], rows: [{ label: 'one sample of 10', values: one, col: 'second' }, { label: 'means of 20 samples of 10', values: sim.means, col: 'link', bin: 0, r: 12 }] } },
      solution: [`Count the means between ${P - d} and ${P + d}: ${mostWithinCount(sim.means, P, d)} of the 20.`, `So most sample means land within about ${d} ${c.unit} of ${P}. Single ${c.who} vary much more (the top plot).`],
    }, [
      { t: `Within about ${d} ${c.unit}`, ok: true },
      { t: `Within about ${mp} ${c.unit}`, mc: MC.indivSpread, say: `${mp} is how far single ${c.who} typically are from ${P}. Means of 10 vary much less: look at the bottom plot.` },
      { t: `They all land exactly on ${P}`, mc: MC.mirror, say: 'Look at the bottom plot: the means scatter around the line. Random samples vary.' },
    ], `Yes: most means land within about ${d} of ${P}.`);
  }
};
const mostWithinCount = (xs: readonly number[], mu: number, d: number) => xs.filter(x => Math.abs(x - mu) <= d + 1e-9).length;
const plan: Gen = (R, n) => {
  const c = pick(R, NUM), name = pick(R, NAMES);
  const m = pick(R, [5, 10, 20]), reps = pick(R, [10, 20, 30]);
  return choice(R, {
    id: `plan-${n}`, family: 'plan',
    prompt: `${name} wants to see how much the mean of a random sample of ${m} ${c.who} can vary. Which plan works?`,
    board: `${reps}\\ ${T('sample means?')}`,
    solution: ['To see how sample means vary, you need many <b>different</b> random samples.', `Draw ${reps} new samples of ${m}, find each one’s mean, and plot the ${reps} means.`],
  }, [
    { t: `Draw ${reps} different random samples of ${m} and plot each sample’s mean`, ok: true },
    { t: `Draw one sample of ${m} and find its mean ${reps} times`, mc: MC.recompute, say: 'The same sample gives the same mean every time. Repeated sampling means NEW samples.' },
    { t: `Draw one sample of ${m} and plot its ${m} values`, mc: MC.indivSpread, say: 'That shows how individuals vary. The question is how the MEAN varies from sample to sample.' },
  ], 'Yes: new random samples, one mean each.');
};

// =====================================================================================================
// 10 estimate-count-from-proportion: a of n, whole factor N = k n
// =====================================================================================================
function bars(a: number, n0: number, N: number, who: string, botNum: string | null, factor: string | undefined): ScaleBarsParams {
  return {
    topLabel: `sample: ${n0} ${who}`, bottomLabel: `all ${commas(N)} ${who}`, factor,
    ticks: n0 <= 60 ? n0 : undefined,
    segs: [{ share: a / n0, col: 'link', top: String(a), ...(botNum ? { bottom: botNum } : {}) }, { share: 1 - a / n0, col: 'faint', top: String(n0 - a) }],
  };
}
const scaleCount: Gen = (R, n) => {
  const c = pick(R, CAT), name = pick(R, NAMES);
  const m = pick(R, [20, 25, 30, 40, 50, 60, 75, 80, 100]);
  const k = pick(R, [5, 6, 8, 10, 12, 15, 20, 25, 30, 40].filter(x => x * m <= 4000 && x * m >= 200));
  const N = k * m;
  const a = int(R, Math.ceil(m * 0.25), Math.floor(m * 0.75));
  const est = k * a;
  return numeric({
    id: `scaleCount-${n}`, family: 'scaleCount',
    prompt: `${name} asked a random sample of <b class="b">${m}</b> of the <b class="a">${commas(N)} ${c.who}</b> at ${c.place}: <b class="s">${a}</b> ${c.verb}. Estimate how many of all ${commas(N)} ${c.who} ${c.verb}.`,
    board: `${a}\\ ${T('of')}\\ ${m}\\ \\to\\ ?\\ ${T('of')}\\ ${texNum(N)}`,
    picture: { kind: 'bars', pre: ['top', 'bottom'], post: ['shade', 'factor', 'nums'], work: [`${m} \\times ${k} = ${texNum(N)}`, `${a} \\times ${k} = ${texNum(est)}`, `${T('about ')}${texNum(est)}`], p: bars(a, m, N, c.who, commas(est), `×${k}`) },
    solution: [`${commas(N)} is ${k} times ${m}, so scale the sample up by ×${k}.`, `${a} × ${k} = ${commas(est)}: about ${mark(commas(est))} of the ${commas(N)} ${c.who} ${c.verb}.`],
  }, est, c.who, [
    { v: N - m + a, mc: MC.additive, say: `That adds the same amount to both numbers. Scale by multiplying: ${commas(N)} is ${k} times ${m}.` },
    { v: N - est, say: `That is the estimate for the ones who ${c.not}. The question asks about the ones who ${c.verb}.` },
    { v: a, say: `${a} is the count in the sample of ${m}. Scale it up to all ${commas(N)}.` },
  ], `Yes: about ${commas(est)} (×${k}). It is an estimate: another sample would give a somewhat different count.`, `Find how many times ${m} fits into ${commas(N)}, then multiply ${a} by that.`);
};
const reportCount: Gen = (R, n) => {
  const c = pick(R, CAT);
  const m = pick(R, [20, 25, 40, 50, 80, 100]);
  const k = pick(R, [5, 10, 20, 25, 30].filter(x => x * m <= 3000 && x * m >= 200));
  const N = k * m, a = int(R, Math.ceil(m * 0.2), Math.floor(m * 0.8)), est = k * a;
  return choice(R, {
    id: `reportCount-${n}`, family: 'reportCount',
    prompt: `In a random sample of <b class="b">${m}</b> of the <b class="a">${commas(N)} ${c.who}</b> at ${c.place}, <b class="s">${a}</b> ${c.verb}. Which statement is the best prediction?`,
    board: `${a}\\ ${T('of')}\\ ${m}\\ \\to\\ ?\\ ${T('of')}\\ ${texNum(N)}`,
    picture: { kind: 'bars', pre: ['top', 'bottom'], post: ['shade', 'factor', 'nums'], work: [`${a} \\times ${k} = ${texNum(est)}`, `${T('about ')}${texNum(est)}`], p: bars(a, m, N, c.who, commas(est), `×${k}`) },
    solution: [`${commas(N)} = ${k} × ${m}, so about ${a} × ${k} = ${commas(est)} ${c.verb}.`, 'Say “about”: another random sample would give a somewhat different count.'],
  }, [
    { t: `About ${commas(est)} of the ${commas(N)} ${c.who} ${c.verb}`, ok: true },
    { t: `Exactly ${commas(est)} of the ${commas(N)} ${c.who} ${c.verb}`, mc: MC.exact, say: 'The number comes from a sample, so it is an estimate: say “about”.' },
    { t: `About ${commas(N - m + a)} of the ${commas(N)} ${c.who} ${c.verb}`, mc: MC.additive, say: `That adds ${commas(N - m)} to both numbers. Scale by multiplying by ${k}.` },
  ], `Yes: about ${commas(est)}, an estimate.`);
};

// =====================================================================================================
// 11 center-difference-in-mad-units / 12 informal-comparative-inference: two groups on one axis
// =====================================================================================================
/** a group of values with an exact mean m and MAD M: pairs m +- a_i (plus m itself when the count is odd) */
function groupWith(R: () => number, m: number, M: number, count: number): number[] {
  const pairs = Math.floor(count / 2), total = (M * count) / 2;   // sum of the a_i so that the mean distance is M
  if (!Number.isInteger(total)) throw new Error('groupWith: MAD needs a whole total');
  for (;;) {
    const a = Array.from({ length: pairs }, () => int(R, 0, Math.min(3 * M, 30)));
    let s = sum(a), guard = 0;
    while (s !== total && guard++ < 500) { const i = int(R, 0, pairs - 1); if (s < total && a[i]! < 3 * M) { a[i]!++; s++; } else if (s > total && a[i]! > 0) { a[i]!--; s--; } }
    if (s !== total) continue;
    const xs = a.flatMap(x => [m - x, m + x]);
    if (count % 2) xs.push(m);
    if (Math.abs(mad(xs) - M) > 1e-9 || Math.abs(mean(xs) - m) > 1e-9) continue;
    return shuffle(R, xs);
  }
}
function axisFor(xs: readonly number[]): SamplerParams['axis'] & { unit: string } {
  const lo = Math.max(0, Math.floor((Math.min(...xs) - 3) / 10) * 10);
  const hi = Math.max(lo + 30, Math.ceil((Math.max(...xs) + 3) / 10) * 10);
  return { lo, hi, major: hi - lo > 60 ? 20 : 10, minor: hi - lo > 50 ? 2 : 1, unit: '' };
}
interface Two { ctx: (typeof TWO)[number]; A: number[]; B: number[]; mA: number; mB: number; M: number; q: number; diff: number }
function twoGroups(R: () => number, count: number, qs: readonly number[], Ms: readonly number[]): Two {
  const ctx = pick(R, TWO);
  for (;;) {
    const M = pick(R, Ms), q = pick(R, qs), diff = q * M;
    if (!Number.isInteger(diff)) continue;
    const mB = ctx.mu + int(R, -6, 4), mA = mB + diff;
    const A = groupWith(R, mA, M, count), B = groupWith(R, mB, M, count);
    if (Math.min(...A, ...B) < 0 || Math.max(...A, ...B) > 100) continue;
    return { ctx, A, B, mA, mB, M, q, diff };
  }
}
function twoPicture(t: Two, post: string[], work: string[], unit = t.M): SPic {
  const ax = axisFor([...t.A, ...t.B]);
  return {
    kind: 'plots', pre: ['row0', 'row1'], post, work,
    p: {
      axis: { ...ax, unit: t.ctx.unit }, gap: { rowA: 0, rowB: 1, unit },
      rows: [{ label: t.ctx.A, values: t.A, col: 'first', bin: 0, mark: { at: t.mA, col: 'first' }, r: 13 }, { label: t.ctx.B, values: t.B, col: 'second', bin: 0, mark: { at: t.mB, col: 'second' }, r: 13 }],
    },
  };
}
const madUnits: Gen = (R, n) => {
  for (;;) {
    const t = twoGroups(R, 10, [0.5, 1, 1.5, 2, 2.5, 3], [2, 3, 4, 5, 6]);
    const iA = iqr(t.A), iB = iqr(t.B), medA = median(t.A), medB = median(t.B);
    if (iA === 0 || Math.abs(t.diff / iA - t.q) < 1e-9) continue;
    const c = t.ctx;
    const row = (g: string, m: number, M: number, md: number, I: number, cls: string) => `<b class="${cls}">${g}</b>: mean ${m}, MAD ${M}, median ${dec(md, 1)}, IQR ${dec(I, 1)}`;
    return numeric({
      id: `madUnits-${n}`, family: 'madUnits',
      prompt: `Random samples of 10 ${c.A} and 10 ${c.B}, ${c.what}. Both are roughly symmetric.<br>${row(c.A, t.mA, t.M, medA, iA, 'a')}<br>${row(c.B, t.mB, t.M, medB, iB, 'b')}<br>The difference of the means is how many MADs?`,
      board: `${T('means ')}${t.mA}\\ ${T('and')}\\ ${t.mB},\\ ${T('MAD ')}${t.M}`,
      picture: twoPicture(t, ['mark0', 'mark1', 'gap'], [`${t.mA} - ${t.mB} = ${t.diff}`, `${t.diff} \\div ${t.M} = ${dec(t.q, 2)}`, `${dec(t.q, 2)}\\ ${T(t.q === 1 ? 'MAD apart' : 'MADs apart')}`]),
      solution: [`Difference of the means: ${t.mA} − ${t.mB} = ${t.diff}.`, `Divide by the MAD (both are ${t.M}): ${t.diff} ÷ ${t.M} = ${dec(t.q, 2)}. The means are ${mark(dec(t.q, 2))} ${t.q === 1 ? 'MAD' : 'MADs'} apart.`],
    }, t.q, 'MADs', [
      { v: t.diff, mc: MC.ignoresSpread, say: `${t.diff} is the gap in ${c.unit}. Measure it in MADs: divide by ${t.M}.` },
      { v: t.diff / iA, mc: MC.unrequested, say: 'That divides by the IQR. Means go with the MAD: divide by the MAD.' },
      { v: t.M / t.diff, say: `Upside down: how many MADs fit into the gap is ${t.diff} ÷ ${t.M}.` },
    ], `Yes: ${dec(t.q, 2)} MADs. The ruler on the picture fits ${dec(t.q, 2)} MAD-lengths between the means.`, `Subtract the means, then divide by the MAD.`);
  }
};
/** a value more than 1.5 IQRs below the lower or above the upper quartile */
export function hasOutlier(xs: readonly number[]): boolean {
  const [q1, q3] = quartiles(xs), k = 1.5 * (q3 - q1);
  return xs.some(x => x < q1 - k || x > q3 + k);
}
const pickMeasure: Gen = (R, n) => {
  const t = twoGroups(R, 10, [1, 1.5, 2], [3, 4, 5]);
  const outlier = R() < 0.6;
  // "no outliers" must be true of the plotted samples: no value beyond 1.5 IQRs from the quartiles
  if (!outlier && (hasOutlier(t.A) || hasOutlier(t.B))) return pickMeasure(R, n);
  const c = t.ctx;
  let B = t.B;
  if (outlier) { B = [...t.B]; const i = B.indexOf(Math.max(...B)); B[i] = Math.min(100, Math.max(...t.A, ...t.B) + int(R, 15, 25)); }
  const mB = mean(B);
  const tt: Two = { ...t, B, mB };
  const right = outlier ? 'Medians and IQRs' : 'Means and MADs';
  const pic = twoPicture(tt, [], [outlier ? `${T('outlier: medians, IQRs')}` : `${T('symmetric: means, MADs')}`]);
  if (pic.kind === 'plots') { pic.p.gap = undefined; pic.p.rows.forEach(r => { r.mark = undefined; }); }
  return choice(R, {
    id: `pickMeasure-${n}`, family: 'pickMeasure',
    prompt: outlier ? `The plots show random samples of ${c.A} and ${c.B} (${c.what}). One ${c.B.replace(/s\b.*$/, '')} value is far from the rest. Which measures should you use to compare the two groups?` : `The plots show random samples of ${c.A} and ${c.B} (${c.what}). Both are roughly symmetric, with no outliers. Which measures should you use to compare them?`,
    board: outlier ? T('an outlier') : T('roughly symmetric'),
    picture: pic,
    solution: outlier ? ['An outlier pulls the mean and the MAD toward it.', 'Medians and IQRs are not pulled by one far value: compare <b>medians</b>, measure the gap in <b>IQRs</b>.'] : ['For roughly symmetric data without outliers, the mean is a good center.', 'Compare <b>means</b> and measure the gap in <b>MADs</b> (the matching spread).'],
  }, [
    { t: right, ok: true },
    { t: outlier ? 'Means and MADs' : 'Medians and IQRs', say: outlier ? 'One far value pulls the mean and the MAD. Use measures it cannot pull.' : 'That works too, but with symmetric data and no outliers the usual pair is means and MADs.' },
    { t: 'Means and IQRs', mc: MC.unrequested, say: 'Use a matching pair: means with MADs, medians with IQRs.' },
    { t: 'Medians and MADs', mc: MC.unrequested, say: 'Use a matching pair: means with MADs, medians with IQRs.' },
  ], outlier ? 'Yes: with an outlier, medians and IQRs.' : 'Yes: symmetric, no outliers: means and MADs.');
};
const overlaps = (A: readonly number[], B: readonly number[]) => Math.max(...B) >= Math.min(...A) && Math.max(...A) >= Math.min(...B);
const compare: Gen = (R, n) => {
  const kind = pick(R, ['clear', 'small', 'tiny'] as const);
  const t = kind === 'small' ? twoGroups(R, 5, [2, 2.5, 3], [2, 4, 6]) : twoGroups(R, kind === 'clear' ? 20 : 20, kind === 'clear' ? [2, 2.5, 3] : [0.5], [3, 4, 5, 6]);
  const c = t.ctx, cnt = t.A.length;
  const one = c.A.replace(/^students /, '');
  void one;
  const base = `Random samples of <b class="a">${cnt} ${c.A}</b> and <b class="b">${cnt} ${c.B}</b>, ${c.what}: the means are ${t.mA} and ${t.mB}, both MADs are ${t.M}, so the means are <b>${dec(t.q, 2)} MADs</b> apart.`;
  const ov = overlaps(t.A, t.B);
  let opts: Opt[];
  if (kind === 'clear') opts = [
    { t: `${cap(c.A)} likely ${c.more} than ${c.B} in general: the gap is large next to the spread`, ok: true },
    ov ? { t: 'The plots overlap, so the two groups can’t be compared', mc: MC.overlap, say: 'Groups can overlap and still clearly differ: compare the centers, measured in MADs.' } : { t: `The means of all ${c.A} and all ${c.B} differ by exactly ${t.diff}`, mc: MC.exact, say: 'The samples estimate the populations; another pair of samples would give a slightly different gap.' },
    { t: `A gap over 2 MADs proves that every one of the ${c.A} ${c.more} than every one of the ${c.B}`, mc: MC.verdict, say: 'No cutoff proves anything about every member. It is a strong sign about the groups in general.' },
  ];
  else if (kind === 'small') opts = [
    { t: `${cap(c.A)} may ${c.more}, but samples of only 5 can vary a lot, so be cautious`, ok: true },
    { t: `The gap is over 2 MADs, so ${c.A} ${c.more}: that settles it`, mc: MC.verdict, say: 'With samples of 5, the means jump around from sample to sample. A ratio is not an automatic verdict.' },
    ov ? { t: 'The plots overlap, so the two groups can’t be compared', mc: MC.overlap, say: 'Overlap does not stop a comparison. Here the real worry is how small the samples are.' } : { t: `The means of all ${c.A} and all ${c.B} differ by exactly ${t.diff}`, mc: MC.exact, say: 'Samples of 5 give rough estimates, not exact population values.' },
  ];
  else opts = [
    { t: 'No clear difference: half a MAD is small next to the spread', ok: true },
    { t: `The mean of the ${c.A} is higher, so ${c.A} ${c.more}`, mc: MC.ignoresSpread, say: `A gap of ${t.diff} is only half a MAD: random samples from two equal groups could easily differ that much.` },
    { t: 'The plots overlap, so the two groups can’t be compared', mc: MC.overlap, say: 'You can compare overlapping groups. Here the comparison says the gap is small.' },
  ];
  return choice(R, {
    id: `compare-${n}`, family: 'compare', prompt: `${base} Which conclusion fits best?`,
    board: `${dec(t.q, 2)}\\ ${T('MADs, samples of ')}${cnt}`,
    picture: twoPicture(t, ['mark0', 'mark1', 'gap'], [`${t.mA} - ${t.mB} = ${t.diff} = ${dec(t.q, 2)}\\ ${T('MADs')}`]),
    solution: kind === 'clear' ? [`${dec(t.q, 2)} MADs is a big gap next to the spread, and samples of ${cnt} give steady means.`, `So ${c.A} likely ${c.more} in general, though not every single one.`] : kind === 'small' ? ['The gap is big next to the spread, but samples of 5 are small: their means vary a lot.', 'So the difference is less certain: say “may”, and take bigger samples to be sure.'] : ['Half a MAD is a small gap next to the spread within each group.', 'Two random samples from the same population could differ that much: no clear difference.'],
  }, opts, 'Yes: weigh the gap, the spread and the sample size together.');
};
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// =====================================================================================================
// 13 selection-bias-mechanism: which way does the method push the estimate?
// =====================================================================================================
const biasWay: Gen = (R, n) => {
  const b = pick(R, BIAS), name = pick(R, NAMES);
  const m = pick(R, [60, 80, 120, 150, 200, 300, 500, 900]);
  const dir = b.dir === 'high' ? 'too high' : 'too low', opp = b.dir === 'high' ? 'too low' : 'too high';
  return choice(R, {
    id: `biasWay-${n}`, family: 'biasWay',
    prompt: `${name} wants to ${b.goal}. ${name} ${b.how(m)}. Is the estimate likely to be off, and which way?`,
    board: T(b.kind === 'convenience' ? 'who was easy to reach?' : b.kind === 'voluntary' ? 'who chose to answer?' : 'who was left out?'),
    solution: [`How the sample was chosen favors some people: ${b.why}.`, `So the estimate is likely <b>${dir}</b>, however many answer and however honest they are.`],
  }, [
    { t: `${cap(dir)}: ${b.why}`, ok: true },
    { t: `${cap(opp)}: ${b.why}`, say: `Follow the reason through: ${b.why}, so the estimate comes out ${dir}.` },
    { t: 'Not off: everyone answered honestly', mc: MC.dishonest, say: 'Bias here comes from WHO was asked, not from lying. Honest answers from the wrong group still miss.' },
    { t: `Not off: ${m} answers is plenty`, mc: MC.bigCures, say: 'More answers chosen the same way lean the same way. Size does not fix how the sample was picked.' },
  ], `Yes: ${dir}, because ${b.why}.`);
};

// =====================================================================================================
// 14 bias-vs-variability: chance or the method?
// =====================================================================================================
const biasOrChance: Gen = (R, n) => {
  const c = pick(R, CAT), name = pick(R, NAMES);
  if (R() < 0.5) {
    const m = pick(R, [20, 25, 40, 50]), N = int(R, 30, 90) * 10;
    const P = int(R, 30, 70), p = P + pick(R, [-8, -6, -4, 4, 6, 8]);
    return choice(R, {
      id: `biasOrChance-${n}`, family: 'biasOrChance',
      prompt: `${name} drew names from a hat for a random sample of <b class="b">${m}</b> of the <b class="a">${N} ${c.who}</b> at ${c.place}: ${p}% ${c.verb}. Later everyone was asked: ${P}% ${c.verb}. What best explains the difference?`,
      board: `${p}\\%\\ ${T('vs')}\\ ${P}\\%`,
      solution: ['The names came from a hat, so the method was fair.', `A random sample of ${m} lands near the true share, not on it. A miss of ${Math.abs(p - P)} points is <b>chance</b> (sampling variability).`],
    }, [
      { t: 'Chance: random samples vary around the true share', ok: true },
      { t: 'Bias: the hat must have been unfair, since the sample missed', mc: MC.mirror, say: 'An unexpected result alone is not a sign of bias. A fair random sample still misses a little.' },
      { t: `The sample was too small to count: only a census tells you anything`, say: `A random sample of ${m} gives a useful estimate; it just varies a little.` },
    ], 'Yes: the method was random, so the small miss is chance.');
  }
  const small = pick(R, [50, 80, 100, 120]), big = pick(R, [1500, 2000, 3000, 5000]);
  return choice(R, {
    id: `biasOrChance-${n}`, family: 'biasOrChance',
    prompt: `Two estimates of the share of ${c.who} in ${c.place} who ${c.verb}: a <b class="b">random sample of ${small}</b>, and a <b class="w">website poll that ${commas(big)} people chose to answer</b>. Which is more trustworthy?`,
    board: `${small}\\ ${T('random')}\\ ${T('vs')}\\ ${texNum(big)}\\ ${T('volunteers')}`,
    solution: ['The volunteers chose themselves, so the poll leans toward people who care most: a <b>bias</b> that more answers do not remove.', `The random sample of ${small} only has chance error, which is small for ${small}.`],
  }, [
    { t: `The random sample of ${small}`, ok: true },
    { t: `The poll: ${commas(big)} answers beat ${small}`, mc: MC.bigCures, say: 'More volunteers repeat the same lean. Size shrinks chance error, not the error from how people were chosen.' },
    { t: 'They are equally good: both are samples', mc: MC.convenient, say: 'A poll anyone can answer is not a random sample. Only the random one gives everyone the same chance.' },
  ], 'Yes: a smaller random sample beats a big self-selected one.');
};
const whichBiased: Gen = (R, n) => {
  const c = pick(R, NUM);
  for (;;) {
    const N = 200;
    const { pop, P } = simPop(R, c, N);
    const up = R() < 0.6;
    const w = pop.map(v => Math.pow(up ? v + 5 : 105 - v, 3));
    const rand = repeatMeans(pop, 30, 20, R).means;
    const polls: number[] = [];
    for (let r = 0; r < 20; r++) {
      const left = pop.map((_, i) => i), got: number[] = [];
      for (let k = 0; k < 40; k++) { const tot = left.reduce((a, i) => a + w[i]!, 0); let u = R() * tot, j = 0; while (u > w[left[j]!]! && j < left.length - 1) { u -= w[left[j]!]!; j++; } got.push(pop[left[j]!]!); left.splice(j, 1); }
      polls.push(mean(got));
    }
    const pc = mean(polls), rc = mean(rand);
    if (Math.abs(pc - P) < 8 || Math.abs(rc - P) > 2.5 || Math.min(...polls) < 2 || Math.max(...polls) > 98) continue;
    const pollFirst = R() < 0.5;
    const rows = pollFirst ? [polls, rand] : [rand, polls];
    const lab = pollFirst ? 'Plot A' : 'Plot B';
    return choice(R, {
      id: `whichBiased-${n}`, family: 'whichBiased',
      prompt: `All <b class="a">${N} ${c.who}</b> were measured: the mean is <b class="a">${P}</b>. One method drew random samples of 30, the other used volunteers (40 each time). Each plot shows 20 results. Which plot is the volunteer method?`,
      board: `${T('mean of all ')}${N} = ${P}`,
      picture: { kind: 'plots', pre: ['row0', 'row1', 'pop'], post: [], work: [`${T('random: centered on ')}${P}`, `${T('volunteers: off-center')}`], p: { axis: { ...AX100, unit: c.unit }, pop: { at: P, label: `mean of all ${N}` }, rows: [{ label: 'Plot A: 20 results', values: rows[0]!, col: 'link', bin: 0, r: 11 }, { label: 'Plot B: 20 results', values: rows[1]!, col: 'link', bin: 0, r: 11 }] } },
      solution: ['Random samples scatter <b>around</b> the true mean: chance pushes them both ways.', `Volunteer polls all miss to the same side: that is <b>bias</b>. ${lab} sits off to one side.`],
    }, [
      { t: 'Plot A', ok: pollFirst, mc: pollFirst ? undefined : MC.bigCures, say: pollFirst ? undefined : 'A tight cluster is not the same as an accurate one. Which plot sits off to one side of the true mean?' },
      { t: 'Plot B', ok: !pollFirst, mc: pollFirst ? MC.bigCures : undefined, say: pollFirst ? 'A tight cluster is not the same as an accurate one. Which plot sits off to one side of the true mean?' : undefined },
      { t: 'You can’t tell: both are samples, so both vary', mc: MC.mirror, say: 'Both vary, but only one is centered on the true mean. Look where each cluster sits.' },
    ], `Yes: ${lab} misses to one side every time: bias, not chance.`);
  }
};

// =====================================================================================================
// 15 scope-of-generalization: say it for the group the sample came from, as an estimate
// =====================================================================================================
const scope: Gen = (R, n) => {
  const c0 = pick(R, NUM), m = int(R, 4, 16) * 5;
  const kind = pick(R, ['random', 'volunteer', 'two'] as const);
  // only people answer an online survey: no tomato plants among the volunteers
  const c = kind === 'volunteer' && /plants/.test(c0.who) ? pick(R, NUM.filter(x => !/plants/.test(x.who))) : c0, s = c.mu + int(R, -6, 6);
  if (kind === 'random') return choice(R, {
    id: `scope-${n}`, family: 'scope',
    prompt: `A random sample of <b class="b">${m} ${c.who}</b> from ${c.place} has a mean of <b class="b">${s} ${c.unit}</b> (${c.what}). Which claim does the study support?`,
    board: `${T('random sample of ')}${m}`,
    picture: { kind: 'nested', pre: ['outer', 'inner'], post: ['claim'], work: [`\\cssId{s}{${T(`the claim: all of them`)}}`], p: { outer: `${c.who} at ${c.place}`, inner: `random sample of ${m}`, kind: 'part', claim: 'outer' } },
    solution: [`The sample was drawn at random from ${c.place}, so it speaks for <b class="a">${c.place}</b> only.`, `And a mean is about the group in general, as an estimate: “about ${s}”.`],
  }, [
    { t: `${c.who === 'students' ? c.place + ' students' : 'The ' + c.who + ' at ' + c.place} ${c.claim(String(s))}, on average`, ok: true },
    { t: `${cap(c.who)} across the country ${c.claim(String(s))}, on average`, mc: MC.beyond, say: `Only ${c.place} was sampled. The claim can’t reach past it.` },
    { t: `Every one of the ${c.who} at ${c.place}: ${s} ${c.unit}`, mc: MC.everyMember, say: 'A mean describes the group, not every member.' },
  ], `Yes: about ${c.place}, on average, as an estimate.`);
  if (kind === 'volunteer') return choice(R, {
    id: `scope-${n}`, family: 'scope',
    prompt: `${c.place} posted an online survey; <b class="b">${m} ${c.who}</b> chose to answer. Their mean: <b class="b">${s} ${c.unit}</b> (${c.what}). Which claim does the study support?`,
    board: `${m}\\ ${T('volunteers')}`,
    picture: { kind: 'nested', pre: ['outer', 'inner'], post: ['claim'], work: [`\\cssId{s}{${T(`the claim: the ${m} only`)}}`], p: { outer: `${c.who} at ${c.place}`, inner: `${m} volunteers`, kind: 'part', claim: 'inner' } },
    solution: ['Volunteers are not a random sample, so they speak only for themselves.', `The supported claim is about the ${m} who answered.`],
  }, [
    { t: `The ${m} who answered averaged ${s} ${c.unit}; we can’t say much about the rest`, ok: true },
    { t: `${c.who === 'students' ? c.place + ' students' : 'The ' + c.who + ' at ' + c.place} ${c.claim(String(s))}, on average`, mc: MC.beyond, say: 'The answers came from volunteers, not a random sample. They may not be like the rest.' },
    { t: `Every one of the ${m}: exactly ${s} ${c.unit}`, mc: MC.everyMember, say: 'A mean sums up the group; members still differ.' },
  ], 'Yes: a nonrandom sample supports a claim about the sample only.');
  const t = pick(R, NUM.filter(x => x.who === 'students')), [p1, p2] = shuffle(R, ['Lincoln Middle', 'Grant Middle', 'Hoover Middle', 'Adams Middle']).slice(0, 2) as [string, string];
  const q = pick(R, [2, 2.5, 3]);
  return choice(R, {
    id: `scope-${n}`, family: 'scope',
    prompt: `Random samples of 30 students from <b class="a">${p1}</b> and from <b class="b">${p2}</b> (${t.what}): ${p1}’s mean is ${q} MADs above ${p2}’s. Which claim does the study support?`,
    board: T('two random samples'),
    solution: [`The samples are random samples from ${p1} and ${p2}, so the claim is about those two schools.`, 'It describes the schools in general, not every student.'],
  }, [
    { t: `${p1} students typically ${t.higher} than ${p2} students`, ok: true },
    { t: 'Students at every school in the state show the same difference', mc: MC.beyond, say: `Only ${p1} and ${p2} were sampled.` },
    { t: `Every ${p1} student is above every ${p2} student`, mc: MC.everyMember, say: 'The groups overlap. A difference in means is about the groups in general.' },
  ], 'Yes: about those two schools, in general.');
};

// =====================================================================================================
// 16 estimate-count-nonwhole-factor: a of n to N, keep it exact, round once
// =====================================================================================================
const scaleNonWhole: Gen = (R, n) => {
  const c = pick(R, CAT), name = pick(R, NAMES);
  for (;;) {
    const m = pick(R, [60, 75, 80, 120, 150, 250, 300, 400, 600]);
    const N = int(R, 90, 500) * 10;
    if (N % m === 0) continue;
    const a = int(R, Math.max(3, Math.ceil(m * 0.06)), Math.floor(m * 0.6));
    const S = scaleExact(a, m, N);
    if (S.half) continue;
    const early = roundedFactorFirst(a, m, N);
    if (early === S.rounded && R() < 0.85) continue;   // most items: rounding the factor first changes the answer
    if (a / m < 0.18 && R() < 0.5) continue;
    const f = N / m, fs = dec(f, 4);
    const factor = fs.length <= 4 && Math.abs(Number(fs) - f) < 1e-9 ? `×${fs}` : undefined;
    const exact = Math.abs(S.value - Math.round(S.value)) < 1e-9;
    return numeric({
      id: `scaleNonWhole-${n}`, family: 'scaleNonWhole',
      prompt: `${name} asked a random sample of <b class="b">${m}</b> of the <b class="a">${commas(N)} ${c.who}</b> in ${c.place}: <b class="s">${a}</b> ${c.verb}. Estimate how many of all ${commas(N)} ${c.verb}. Round to the nearest whole number once, at the end.`,
      board: `${a}\\ ${T('of')}\\ ${m}\\ \\to\\ ?\\ ${T('of')}\\ ${texNum(N)}`,
      picture: a / m >= 0.18 ? { kind: 'bars', pre: ['top', 'bottom'], post: ['shade', ...(factor ? ['factor'] : []), 'nums'], work: [`\\tfrac{${a}}{${m}} \\times ${texNum(N)} ${exact ? '=' : '\\approx'} ${texNum(+dec(S.value, 2))}`, `${T('about ')}${texNum(S.rounded)}`], p: bars(a, m, N, c.who, commas(S.rounded), factor) } : undefined,
      solution: [`Keep it exact: ${a}/${m} × ${commas(N)} = ${a} × ${commas(N)} ÷ ${m} ${exact ? '=' : '≈'} ${dec(S.value, 2)}.`, `Round once, at the end: about ${mark(commas(S.rounded))}.`],
    }, S.rounded, c.who, [
      { v: early, mc: MC.early, say: `That rounds ${commas(N)} ÷ ${m} = ${dec(f, 3)} to ${Math.round(f)} first. Keep the exact value and round only the final answer.` },
      { v: N - m + a, mc: MC.additive, say: `That adds the same amount to both numbers. Scale by multiplying: ${a}/${m} of ${commas(N)}.` },
      { v: Math.floor(S.value), say: `${dec(S.value, 2)} rounds to ${S.rounded}, not down to ${Math.floor(S.value)}.` },
    ], `Yes: about ${commas(S.rounded)}. It is an estimate, so round once and say “about”.`, `Multiply ${a} by ${commas(N)}, divide by ${m}, then round once.`);
  }
};

// =====================================================================================================
// 17 predict-population-percent: the sample share (count / decimal / percent) as the population share,
// its complement, and a count
// =====================================================================================================
const complementPct: Gen = (R, n) => {
  const c = pick(R, CAT);
  const m = pick(R, [20, 25, 40, 50, 80, 100, 200]);
  const N = int(R, 12, 60) * 50;
  let a: number, p: number;
  do { a = int(R, Math.ceil(m * 0.2), Math.floor(m * 0.85)); p = (100 * a) / m; } while (!Number.isInteger(p) || p === 50);
  const form = pick(R, ['count', 'count', 'decimal', 'percent'] as const);
  const res = form === 'count' ? `<b class="s">${a} of ${m}</b> ${c.verb}` : form === 'decimal' ? `a share of <b class="s">${dec(p / 100, 2)}</b> ${c.verb}` : `<b class="s">${p}%</b> ${c.verb}`;
  return numeric({
    id: `complementPct-${n}`, family: 'complementPct',
    prompt: `In a random sample of <b class="b">${m}</b> of the <b class="a">${commas(N)} ${c.who}</b> at ${c.place}, ${res}. Predict the percent of all ${commas(N)} who ${c.not}.`,
    board: form === 'count' ? `${a}\\ ${T('of')}\\ ${m}` : form === 'decimal' ? dec(p / 100, 2) : `${p}\\%`,
    picture: { kind: 'bars', pre: ['top', 'bottom'], post: ['shade', 'nums'], work: [`${form === 'count' ? `${a} \\div ${m} = ` : ''}${p}\\%\\ ${T(c.verb.split(' ')[0]!)}`, `100\\% - ${p}\\% = ${100 - p}\\%`, `${T('about ')}${100 - p}\\%`], p: { topLabel: `sample: ${m} ${c.who}`, bottomLabel: `all ${commas(N)} ${c.who}`, segs: [{ share: p / 100, col: 'faint', top: `${p}%` }, { share: 1 - p / 100, col: 'link', top: `${100 - p}%`, bottom: `${100 - p}%` }] } },
    solution: [`${form === 'count' ? `${a} of ${m} is ${p}%. ` : ''}${p}% ${c.verb}, so 100% − ${p}% = ${100 - p}% ${c.not}.`, `Predict about ${mark(`${100 - p}%`)} of all ${commas(N)}: the sample share stands in for the population share.`],
  }, 100 - p, '%', [
    { v: p, say: `${p}% is the share who ${c.verb}. The question asks about the ones who ${c.not}.` },
    { v: 100 - a, mc: MC.complement, say: `That subtracts the count ${a} from 100%. First turn ${a} of ${m} into a percent: ${p}%.` },
    { v: m - a, say: `${m - a} is a count in the sample, not a percent: ${m - a} of ${m} is ${100 - p}%.` },
  ], `Yes: about ${100 - p}%. Another random sample would give a slightly different percent.`, `Find the percent who ${c.verb}, then take it away from 100%.`);
};
const complementCount: Gen = (R, n) => {
  if (R() < 0.35) {
    // three categories: the rest = 100% minus the stated shares
    const c = pick(R, CAT3), m = pick(R, [50, 80, 100, 120, 200]), N = int(R, 8, 48) * 50;
    const p1 = int(R, 6, 10) * 5, p2 = int(R, 4, Math.min(8, (80 - p1) / 5)) * 5, rest = 100 - p1 - p2;
    const ans = pctCount(rest, N);
    return numeric({
      id: `complementCount-${n}`, family: 'complementCount',
      prompt: `A random sample of <b class="b">${m}</b> of the <b class="a">${commas(N)} ${c.who}</b> at ${c.place} voted on ${c.topic}: <b>${p1}%</b> chose ${c.opts[0]}, <b>${p2}%</b> chose ${c.opts[1]}, the rest chose <b class="s">${c.opts[2]}</b>. About how many of all ${commas(N)} would choose ${c.opts[2]}?`,
      board: `${p1}\\%,\\ ${p2}\\%,\\ ${T('the rest')}`,
      picture: { kind: 'bars', pre: ['top', 'bottom'], post: ['shade', 'nums'], work: [`100\\% - ${p1}\\% - ${p2}\\% = ${rest}\\%`, `${dec(rest / 100, 2)} \\times ${texNum(N)} = ${texNum(ans)}`, `${T('about ')}${texNum(ans)}`], p: { topLabel: `sample: ${m} ${c.who}`, bottomLabel: `all ${commas(N)} ${c.who}`, segs: [{ share: p1 / 100, col: 'faint', top: `${p1}%` }, { share: p2 / 100, col: 'dim', top: `${p2}%` }, { share: rest / 100, col: 'link', top: `${rest}%`, bottom: commas(ans) }] } },
      solution: [`The rest: 100% − ${p1}% − ${p2}% = ${rest}%.`, `${rest}% of ${commas(N)} = ${commas(ans)}: about ${mark(commas(ans))} would choose ${c.opts[2]}.`],
    }, ans, c.who, [
      { v: N - p1 - p2, mc: MC.complement, say: `${p1} and ${p2} are percents, not counts. The rest is ${rest}% of ${commas(N)}.` },
      { v: pctCount(rest, m), mc: MC.pctOfN, say: `That is ${rest}% of the ${m} in the sample. Predict for all ${commas(N)}.` },
      { v: rest, say: `${rest}% is the share. Turn it into a count of the ${commas(N)}.` },
    ], `Yes: about ${commas(ans)}, a prediction that another sample would change a little.`, `Find the share that is left, then take that percent of ${commas(N)}.`);
  }
  const c = pick(R, CAT);
  const m = pick(R, [20, 25, 40, 50, 80, 100]);
  const N = int(R, 8, 60) * 50;
  let a: number, p: number;
  do { a = int(R, Math.ceil(m * 0.25), Math.floor(m * 0.8)); p = (100 * a) / m; } while (!Number.isInteger(p) || p === 50);
  const ans = pctCount(100 - p, N);
  return numeric({
    id: `complementCount-${n}`, family: 'complementCount',
    prompt: `In a random sample of <b class="b">${m}</b> of the <b class="a">${commas(N)} ${c.who}</b> at ${c.place}, <b class="s">${a}</b> ${c.verb}. About how many of all ${commas(N)} ${c.not}?`,
    board: `${a}\\ ${T('of')}\\ ${m}\\ \\to\\ ?\\ ${T('of')}\\ ${texNum(N)}`,
    picture: { kind: 'bars', pre: ['top', 'bottom'], post: ['shade', 'nums'], work: [`${a} \\div ${m} = ${p}\\%`, `100\\% - ${p}\\% = ${100 - p}\\%`, `${dec((100 - p) / 100, 2)} \\times ${texNum(N)} = ${texNum(ans)}`], p: { topLabel: `sample: ${m} ${c.who}`, bottomLabel: `all ${commas(N)} ${c.who}`, ticks: m <= 50 ? m : undefined, segs: [{ share: p / 100, col: 'faint', top: String(a) }, { share: 1 - p / 100, col: 'link', top: String(m - a), bottom: commas(ans) }] } },
    solution: [`${a} of ${m} is ${p}%, so ${100 - p}% ${c.not}.`, `${100 - p}% of ${commas(N)} = ${commas(ans)}: about ${mark(commas(ans))}.`],
  }, ans, c.who, [
    { v: N - a, mc: MC.complement, say: `${a} is a count in the sample of ${m}. Scale up first: ${100 - p}% of ${commas(N)}.` },
    { v: pctCount(100 - p, m), mc: MC.pctOfN, say: `That is ${100 - p}% of the ${m} in the sample. Use all ${commas(N)}.` },
    { v: pctCount(p, N), say: `That is how many ${c.verb}. The question asks about the ones who ${c.not}.` },
  ], `Yes: about ${commas(ans)}.`, `Find the percent who ${c.not}, then that percent of ${commas(N)}.`);
};

// ---------- registry ----------
const FAMS: Record<string, Gen> = {
  popSample, spreadCompare, statParam, isRandom, randomDiffers, whatDot, twoSamples, whichSize, biggerSample,
  drawNumbers, absent, estimate, report, typical, plan, scaleCount, reportCount, madUnits, pickMeasure, compare,
  biasWay, biasOrChance, whichBiased, scope, scaleNonWhole, complementPct, complementCount,
};
/** a prompt that opens on a place ("the community garden knows …") starts with a capital, past any leading tags */
export const capFirst = (h: string) => h.replace(/^((?:<[^>]+>)*)([a-z])/, (_, tags: string, c: string) => tags + c.toUpperCase());
export const GENS: Record<string, Gen> = Object.fromEntries(Object.entries(FAMS).map(([k, g]) => [k, ((R, n, sg) => { const it = g(R, n, sg); it.prompt = capFirst(it.prompt); return it; }) as Gen]));
export const FAMILY_NAMES: Record<string, string> = {
  popSample: 'Population or sample?', spreadCompare: 'Spread: sample vs population', statParam: 'Sample value or population value?',
  isRandom: 'Which method is random?', randomDiffers: 'A random sample that misses', whatDot: 'What one dot stands for',
  twoSamples: 'Two samples, two means', whichSize: 'Which plot has the bigger samples?', biggerSample: 'What bigger samples change',
  drawNumbers: 'Draw with random numbers', absent: 'Keep the draw random', estimate: 'Estimate from a sample',
  report: 'Report an estimate', typical: 'How far do sample means land?', plan: 'Plan a simulation',
  scaleCount: 'Scale a sample count', reportCount: 'Predict a count', madUnits: 'The gap in MADs', pickMeasure: 'Pick the measures',
  compare: 'Compare two groups', biasWay: 'Which way is it biased?', biasOrChance: 'Bias or chance?', whichBiased: 'Spot the biased method',
  scope: 'How far a claim reaches', scaleNonWhole: 'Scale up, round once', complementPct: 'Predict a percent', complementCount: 'Predict the rest',
};
void quartiles; void lower;
