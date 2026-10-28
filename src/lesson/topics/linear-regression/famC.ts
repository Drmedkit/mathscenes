// famC.ts: practice families for the last stage of "Scatter plots, correlation and the regression line": interpolation
// and extrapolation, whom the data represent and the scope of a model, lurking variables and experiments, influential
// points, the three-check critique, and r² (its meaning and its limits). Pure: no DOM.
import {
  type Cand, type Opt, type RCtx, type RGen, a1, plausible, MC, ans, calc, choice, ctxById, ctxPick, dataSet, int, numItem, pick, residG, scatterG, xv, yv,
} from './kit';
import { patterned } from './famA';
import { fx, fxT, lsrl, modelH, modelT, nH, nT, onGrid, r9, rd, residuals, tieFree, until, yhat } from './regMaths';

const I = (s: string) => `<i>${s}</i>`;
const cap = (s: string) => s[0]!.toUpperCase() + s.slice(1);
const mH = (A0: number, B0: number, c: RCtx) => modelH(fx(A0, c.da), fx(B0, c.db));
const mT = (A0: number, B0: number, c: RCtx) => modelT(fxT(A0, c.da), fxT(B0, c.db));

// ===================== interpolation-extrapolation =====================
export const interExtra: RGen = (R, n) => {
  const c = ctxPick(R, ['rent', 'study', 'arm', 'drinks', 'mpg', 'growth', 'screen', 'foot', 'bike', 'tree']);
  const d = dataSet(R, c, 9);
  const lo = Math.min(...d.xs), hi = Math.max(...d.xs), span = hi - lo;
  const kind = pick(R, ['inside', 'edge', 'just', 'far'] as const);
  const x0 = until(() => {
    if (kind === 'inside') return onGrid(lo + span * (0.15 + R() * 0.7), c.xStep);
    if (kind === 'edge') return R() < 0.5 ? lo : hi;
    if (kind === 'just') return R() < 0.5 ? onGrid(hi + span * (0.04 + R() * 0.06), c.xStep) : onGrid(lo - span * (0.04 + R() * 0.06), c.xStep);
    return R() < 0.7 ? onGrid(Math.min(c.xCap, hi + span * (1 + R())), c.xStep) : onGrid(lo - span * (0.6 + R() * 0.4), c.xStep);
  }, v => (kind !== 'far' || v >= hi + span * 0.5 || v <= lo - span * 0.5) && (kind === 'inside' || kind === 'edge' ? v >= lo && v <= hi && !(kind === 'inside' && (v === lo || v === hi)) : (v > hi || v < lo)) && v > 0);
  const inside = x0 >= lo && x0 <= hi;
  const opts: Opt[] = [
    { t: `Interpolation: ${nH(x0)} is inside the observed ${c.xMany}, ${nH(lo)} to ${nH(hi)}.`, ok: inside, mc: inside ? undefined : MC.noLimit, say: inside ? 'Yes: inside the observed interval (the endpoints count as inside).' : `${nH(x0)} is outside ${nH(lo)} to ${nH(hi)}: the data say nothing about the trend there.` },
    { t: `Extrapolation: ${nH(x0)} is outside the observed ${c.xMany}, ${nH(lo)} to ${nH(hi)}.`, ok: !inside, say: inside ? `${nH(x0)} lies between ${nH(lo)} and ${nH(hi)} (endpoints included): that is interpolation.` : `Yes: outside the observed interval.${kind === 'far' ? ' Far outside, so the prediction is not supported at all.' : ' Even just outside, use it with caution.'}` },
    { t: `Decide by ŷ: it is interpolation only if the predicted ${c.yWhat} is inside the observed values of ${c.yWhat}.`, mc: MC.domainRange, say: `The model's supported interval is about the INPUT: the observed ${c.xMany}, not the values of ${c.yWhat}.` },
  ];
  return choice(R, {
    id: `interExtra-${n}`, family: 'interExtra',
    prompt: `The model ${mH(d.A, d.B, c)} was fit to ${c.who} with ${c.xMany} from ${nH(lo)} to ${nH(hi)} (${c.xUnit}). Is a prediction at ${I('x')} = ${nH(x0)} an interpolation or an extrapolation? (The endpoints of the observed interval count as inside.)`,
    board: `x = ${nT(x0)}`,
    solution: [`Observed ${c.xMany}: ${nH(lo)} to ${nH(hi)}.`, `${nH(x0)} is ${inside ? 'inside' : 'outside'} that interval: ${inside ? 'interpolation' : 'extrapolation'}.`],
    picture: { g: scatterG(d, { line: [d.A, d.B], extraX: [x0] }) },
  }, opts, true);
};
const NONSENSE: { id: string; x0: number; what: string }[] = [
  { id: 'growth', x0: 40, what: 'a 40-year-old' },
  { id: 'growth', x0: 30, what: 'a 30-year-old' },
  { id: 'mpg', x0: 10, what: 'a 10,000-pound truck' },
  { id: 'mpg', x0: 11, what: 'an 11,000-pound truck' },
  { id: 'tree', x0: 120, what: 'a tree with a 120-inch trunk' },
  { id: 'drinks', x0: 130, what: 'a day with a high of 130°F' },
];
export const extraNonsense: RGen = (R, n) => {
  const N = pick(R, NONSENSE), c = ctxById(N.id);
  const d = dataSet(R, c, 9);
  const lo = Math.min(...d.xs), hi = Math.max(...d.xs), v = yhat(d.A, d.B, N.x0);
  const silly = c.id === 'growth' ? `be about ${nH(rd(v / 12, 1))} feet tall` : c.id === 'mpg' ? `get ${v < 0 ? 'a negative gas mileage' : 'almost no gas mileage'}` : c.id === 'tree' ? 'be taller than any oak ever measured' : `sell ${v < 0 ? 'a negative number of drinks' : 'almost no drinks'}`;
  const opts: Opt[] = [
    { t: `${cap(N.what)} is far outside the data (${nH(lo)} to ${nH(hi)}): the trend need not continue there, so this prediction means nothing.`, ok: true, say: 'Yes. A model is supported only over the observed x-interval. Far outside it, extrapolation can give nonsense.' },
    { t: `The trend keeps going, so ${N.what} really would ${silly}.`, mc: MC.noLimit, say: `A straight line goes on forever; real ${c.who} do not follow it beyond the data.` },
    { t: `The model must be wrong for the ${c.who} in the data too.`, say: `Inside ${nH(lo)} to ${nH(hi)} the line fits well. The problem is only the far extrapolation.` },
    { t: 'Predictions from a well-fitting model can always be trusted.', mc: MC.interpSafe, say: 'Not outside the data, and even inside it a prediction is an estimate with scatter.' },
  ];
  return choice(R, {
    id: `extraNonsense-${n}`, family: 'extraNonsense',
    prompt: `${calc(true)}For ${c.who} with ${c.xMany} from ${nH(lo)} to ${nH(hi)}, the least-squares line is ${mH(d.A, d.B, c)}. Used for ${N.what} (${I('x')} = ${nH(N.x0)}), it predicts ŷ = ${nH(rd(v, 1))}. What does this show?`,
    board: mT(d.A, d.B, c),
    solution: [`x = ${nH(N.x0)} is far outside the observed ${nH(lo)} to ${nH(hi)}.`, 'The line was only checked on the data: extrapolating that far gives a meaningless prediction.'],
    picture: { g: scatterG(d, { line: [d.A, d.B] }) },
  }, opts);
};

// ===================== representative-data =====================
export const represent: RGen = (R, n) => {
  const c = ctxPick(R, ['rent', 'study', 'arm', 'drinks', 'mpg', 'growth', 'elev', 'screen', 'foot', 'bike', 'tree']);
  const d = dataSet(R, c, 10);
  const k = int(R, 40, 140);
  const all = c.id === 'rent' ? 'apartments anywhere in the US' : c.id === 'study' ? 'all US high school students on any test' : c.id === 'drinks' ? 'every coffee shop in the country' : c.id === 'mpg' ? 'every car on the road, of any year or engine' : c.id === 'elev' ? 'towns anywhere in the world' : c.id === 'growth' ? 'all children everywhere' : `all ${c.who} everywhere`;
  const opts: Opt[] = [
    { t: `${cap(c.who)} like those in the data: ${c.source}.`, ok: true, say: 'Yes. Ask first whom or what the data represent; conclusions reach only that far.' },
    { t: `${cap(all)}.`, mc: MC.generalizes, say: `The data come only from ${c.source}. Other ${c.who} may follow a different line.` },
    { t: `${cap(all)}, because ${k} cases is a large sample.`, mc: MC.bigSample, say: 'A bigger sample from the same narrow source is still from that source: size does not fix who is missing.' },
    { t: 'Nobody: a sample can never tell us anything.', mc: MC.rejectsAll, say: 'A sample does support conclusions: about the population it represents.' },
  ];
  return choice(R, {
    id: `represent-${n}`, family: 'represent',
    prompt: `A model of ${c.yWhat} against ${c.xWhat} was fit to ${k} ${c.who}: ${c.source}. Whom (or what) can the model fairly describe?`,
    board: '',
    solution: [`The data: ${c.source}.`, `The model describes ${c.who} like those, not ${all}.`],
    picture: { g: scatterG(d) },
  }, opts);
};
const BIG: { who: string; pop: string; vol: string; rnd: string; pair: string }[] = [
  { who: 'teens', pop: 'all US teens', vol: '5,000 teens who answered an online poll posted on a gaming site', rnd: 'a random sample of 300 teens from a national school roster', pair: 'daily screen time and hours of sleep' },
  { who: 'adults', pop: 'all adults in the county', vol: '2,400 adults who stopped at a fitness expo booth', rnd: 'a random sample of 250 adults from the county voter list', pair: 'weekly exercise and resting heart rate' },
  { who: 'drivers', pop: 'all drivers in the state', vol: '8,000 drivers who replied to a car-club email', rnd: 'a random sample of 400 drivers from the state license records', pair: 'miles driven per week and money spent on gas' },
  { who: 'students', pop: 'all students in the district', vol: '1,500 students who joined an after-school study app', rnd: 'a random sample of 200 students from the district enrollment list', pair: 'hours studied and test score' },
];
export const bigSample: RGen = (R, n) => {
  const b0 = pick(R, BIG);
  const big = int(R, 15, 90) * 100, small = int(R, 12, 40) * 10;
  const b = { ...b0, vol: b0.vol.replace(/^[\d,]+/, nH(big)), rnd: b0.rnd.replace(/\d[\d,]*/, String(small)) };
  const opts: Opt[] = [
    { t: `The random sample of ${b.rnd.match(/\d[\d,]*/)![0]}: every member of the population had a chance to be chosen.`, ok: true, say: 'Yes. Random selection makes the sample represent the population; size alone does not.' },
    { t: `The ${b.vol.match(/\d[\d,]*/)![0]} volunteers: a bigger sample is always more representative.`, mc: MC.bigSample, say: 'Volunteers who chose to answer differ from the rest: thousands of them are still biased.' },
    { t: 'Both equally: each is large enough.', mc: MC.bigSample, say: 'Size does not cure bias: how the cases were chosen matters more.' },
    { t: 'Neither: no sample can say anything about a population.', mc: MC.rejectsAll, say: 'A random sample can: that is what it is for.' },
  ];
  return choice(R, {
    id: `bigSample-${n}`, family: 'bigSample',
    prompt: `Two data sets on ${b.pair}: (1) ${b.vol}; (2) ${b.rnd}. Which one better supports a regression model for ${b.pop}?`,
    board: `n = ${nT(big)}\\quad \\text{vs}\\quad n = ${small}`,
    solution: ['A model generalizes only to the population the data represent.', `Volunteers choose themselves; a random sample from a list of ${b.pop.replace('all ', '')} represents them. Pick the random sample.`],
  }, opts);
};

// ===================== population-scope =====================
const SCOPE: Record<string, { other: string; same: string; why: string }> = {
  rent: { other: 'an apartment of {x} square feet in Manhattan', same: 'another apartment of {x} square feet listed in the same neighborhood this spring', why: 'a different city with a very different rental market' },
  study: { other: 'a student in another school\'s physics class who studied {x} hours', same: 'another student in the same chemistry class who studied {x} hours for the same test', why: 'a different school, course and test' },
  arm: { other: 'a 12-year-old with an arm span of {x} inches', same: 'another adult at the same health fair with an arm span of {x} inches', why: 'children grow differently from adults' },
  drinks: { other: 'the same café on a July summer-session day with a high of {x}°F', same: 'the same café on a school day during the year with a high of {x}°F', why: 'the summer session has far fewer students' },
  mpg: { other: 'a 2024 electric car weighing {x} thousand pounds', same: 'another 2024 gasoline car the magazine tested, weighing {x} thousand pounds', why: 'an electric car does not burn gas the same way' },
  growth: { other: 'a {x}-year-old measured standing on a carpet with shoes on', same: 'another {x}-year-old measured at the same clinic', why: 'a different measuring method' },
  elev: { other: 'a town in Arizona at {x} thousand feet', same: 'another Colorado town at {x} thousand feet', why: 'a different region with a different climate' },
  screen: { other: 'an adult office worker with {x} hours of daily screen time', same: 'another teen at the same school with {x} hours of daily screen time', why: 'adults are a different population' },
  foot: { other: 'a child with a foot length of {x} inches', same: 'another adult at the same shoe store with a foot length of {x} inches', why: 'children are a different population' },
  bike: { other: 'the same {x}-mile route ridden in January snow', same: 'another Minneapolis commuter riding {x} miles in September', why: 'different riding conditions' },
  tree: { other: 'a pine tree with a {x}-inch trunk in the same park', same: 'another oak in the same park with a {x}-inch trunk', why: 'a different kind of tree' },
};
export const scope: RGen = (R, n) => {
  const c = ctxPick(R);
  const S = SCOPE[c.id]!;
  const d = dataSet(R, c, 9);
  const lo = Math.min(...d.xs), hi = Math.max(...d.xs);
  const x0 = until(() => onGrid(lo + (hi - lo) * (0.2 + R() * 0.6), c.xStep), v => !d.xs.includes(v));
  const same = R() < 0.4;
  const caseText = (same ? S.same : S.other).replace('{x}', nH(x0));
  const opts: Opt[] = [
    { t: 'Yes, as an estimate: the case matches the data\'s population and conditions, and x is inside the observed interval.', ok: same, mc: same ? undefined : MC.interpSafe, say: same ? 'Yes. Same kind of case, same conditions, x inside the interval: a fair (still uncertain) prediction.' : `Not this case: ${S.why}. The data say nothing about it.` },
    { t: 'Not without new data: the case comes from a different population or conditions than the data.', ok: !same, say: same ? 'This case does match: same source, same conditions.' : `Yes: ${S.why}. Being inside the x-interval is not enough.` },
    { t: 'Yes: any x inside the observed interval gives a reliable prediction, whoever the case is.', mc: MC.interpSafe, say: 'Inside the x-interval is necessary, not sufficient: the case must also come from the population and conditions the data represent.' },
    { t: 'No: x must exactly match one of the observed values.', say: 'Interpolating between observed x values is what a model is for.' },
  ];
  return choice(R, {
    id: `scope-${n}`, family: 'scope',
    prompt: `${mH(d.A, d.B, c)} was fit to ${c.source} (${c.xMany} from ${nH(lo)} to ${nH(hi)}). Should it be used to predict the ${c.yWhat} of ${caseText}?`,
    board: mT(d.A, d.B, c),
    solution: ['Check two things: is x inside the observed interval, AND does the case come from the population and conditions of the data?', same ? 'Both hold: use it, as an estimate.' : `x is inside, but ${S.why}: not without new data.`],
    picture: { g: scatterG(d, { line: [d.A, d.B] }) },
  }, opts, true);
};
export const scopeWhich: RGen = (R, n) => {
  const c = ctxPick(R);
  const S = SCOPE[c.id]!;
  const d = dataSet(R, c, 9);
  const lo = Math.min(...d.xs), hi = Math.max(...d.xs);
  const xin = until(() => onGrid(lo + (hi - lo) * (0.2 + R() * 0.6), c.xStep), v => !d.xs.includes(v));
  const xout = onGrid(Math.min(c.xCap, hi + (hi - lo) * (0.6 + R() * 0.5)), c.xStep);
  const opts: Opt[] = [
    { t: cap(S.same.replace('{x}', nH(xin))), ok: true, say: 'Yes: same population and conditions, and x is inside the observed interval.' },
    { t: cap(S.same.replace('{x}', nH(xout))), mc: MC.noLimit, say: `Same population, but ${nH(xout)} is outside the observed ${nH(lo)} to ${nH(hi)}: an extrapolation.` },
    { t: cap(S.other.replace('{x}', nH(xin))), mc: MC.interpSafe, say: `x is inside the interval, but ${S.why}.` },
  ];
  return choice(R, {
    id: `scopeWhich-${n}`, family: 'scopeWhich',
    prompt: `${mH(d.A, d.B, c)} was fit to ${c.source}, with ${c.xMany} from ${nH(lo)} to ${nH(hi)} (${c.xUnit}). For which case is it fair to use the model?`,
    board: mT(d.A, d.B, c),
    solution: ['A fair use needs x inside the observed interval AND a case from the same population and conditions.', 'Only one case passes both checks.'],
    picture: { g: scatterG(d, { line: [d.A, d.B] }) },
  }, opts);
};

// ===================== lurking-variable =====================
const LURK: { data: string; claim: string; kind: 'lurk' | 'reverse' | 'chance'; alt: string; xName: string; yName: string; slope: number }[] = [
  { data: 'Over 12 months at a beach town, monthly ice cream sales and the number of swimmers rescued rise and fall together', claim: 'ice cream sales cause more swimmers to need rescue', kind: 'lurk', alt: 'Hot weather drives both: more people buy ice cream and more people swim.', xName: 'Ice cream sales ($1,000s)', yName: 'Rescues', slope: 1 },
  { data: 'Across 30 house fires, the number of firefighters sent and the dollar damage are strongly correlated', claim: 'sending more firefighters causes more damage', kind: 'lurk', alt: 'Bigger fires get more firefighters AND cause more damage: the size of the fire drives both.', xName: 'Firefighters', yName: 'Damage ($1,000s)', slope: 1 },
  { data: 'For students in grades 1 to 6, shoe size and reading score are positively correlated', claim: 'bigger feet make students better readers', kind: 'lurk', alt: 'Older students have bigger feet and have also had more years of reading: age drives both.', xName: 'Shoe size', yName: 'Reading score', slope: 1 },
  { data: 'Across 40 countries, TVs per 100 people and life expectancy are positively correlated', claim: 'owning more TVs makes people live longer', kind: 'lurk', alt: 'Wealthier countries have more TVs AND better health care: wealth drives both.', xName: 'TVs per 100 people', yName: 'Life expectancy (years)', slope: 1 },
  { data: 'At one high school, students who get tutoring have lower grades than students who do not', claim: 'tutoring lowers grades', kind: 'reverse', alt: 'The direction may run the other way: students with low grades are the ones who sign up for tutoring.', xName: 'Tutoring hours', yName: 'Grade (%)', slope: -1 },
  { data: 'Across 50 cities, the number of police officers per 1,000 people and the crime rate are positively correlated', claim: 'more police cause more crime', kind: 'reverse', alt: 'The direction may run the other way: cities with more crime hire more police.', xName: 'Police per 1,000', yName: 'Crimes per 1,000', slope: 1 },
  { data: 'From 2000 to 2009, cheese eaten per person in the US and the number of people who died tangled in their bedsheets rose together (r = 0.95)', claim: 'eating cheese makes bedsheet accidents more likely', kind: 'chance', alt: 'Two things that both happen to rise over the same years: a coincidence, with no link between them.', xName: 'Cheese (lb per person)', yName: 'Bedsheet deaths', slope: 1 },
];
export const lurking: RGen = (R, n) => {
  const L0 = pick(R, LURK);
  const L = { ...L0, data: L0.data.replace(/(30|40|50) (house fires|countries|cities)/, (_, _n: string, w: string) => `${int(R, 3, 9) * 10} ${w}`).replace('Over 12 months', `Over ${int(R, 12, 36)} months`).replace('grades 1 to 6', `grades 1 to ${int(R, 5, 8)}`).replace('At one high school', pick(R, ['At one high school', 'At one middle school', 'In one school district'])) };
  const opts: Opt[] = [
    { t: L.alt, ok: true, say: L.kind === 'lurk' ? 'Yes: a lurking variable can make two things move together without either causing the other.' : L.kind === 'reverse' ? 'Yes: correlation does not say which way a cause would run.' : 'Yes: with time series, unrelated trends often line up by chance.' },
    { t: `The correlation is strong, so ${L.claim}.`, mc: MC.causation, say: 'A strong correlation in observational data does not show cause: something else can explain it.' },
    { t: 'There can be no real association, since one cannot cause the other.', mc: MC.noCause, say: 'The association is real in these data. It just has another explanation than the claimed cause.' },
    { t: 'The two variables have different units, so they cannot be correlated.', say: 'Any two quantitative variables can be correlated; r has no units.' },
  ];
  return choice(R, {
    id: `lurking-${n}`, family: 'lurking',
    prompt: `${L.data}. Someone claims ${L.claim}. Which is the best alternative explanation?`,
    board: '\\text{association} \\ne \\text{cause}',
    solution: ['Correlation in observational data is not evidence of cause by itself.', L.alt],
  }, opts);
};
export const causeClaim: RGen = (R, n) => {
  const c = ctxPick(R, ['screen', 'study', 'drinks', 'bike', 'elev']);
  const d = dataSet(R, c, 10);
  const more = d.B > 0 ? 'more' : 'less';
  const yMore = c.id === 'screen' ? (d.B > 0 ? 'more sleep' : 'less sleep') : c.id === 'study' ? 'higher scores' : c.id === 'drinks' ? 'fewer hot drinks sold' : c.id === 'bike' ? 'longer commute times' : 'lower July highs';
  const xMore = c.id === 'screen' ? 'more screen time' : c.id === 'study' ? 'more hours studied' : c.id === 'drinks' ? 'warmer days' : c.id === 'bike' ? 'longer distances' : 'higher elevations';
  const opts: Opt[] = [
    { t: `${cap(xMore)} ${c.id === 'screen' ? 'tends' : 'tend'} to go with ${yMore}: an association, measured in these ${c.who}.`, ok: true, say: 'Yes: observational data show an association. They cannot show what causes what.' },
    { t: `${cap(xMore)} ${c.id === 'screen' ? 'causes' : 'cause'} ${yMore}.`, mc: MC.causation, say: 'Nobody assigned the x values: other differences between the cases could explain the pattern.' },
    { t: 'There is no link, because no cause has been shown.', mc: MC.noCause, say: 'The association is there in the data, whether or not anything causes it.' },
  ];
  void more;
  return choice(R, {
    id: `causeClaim-${n}`, family: 'causeClaim',
    prompt: `Observational data on ${c.source}: ${I('r')} = ${fx(rd(d.f.r, 2), 2)} for ${c.xWhat} and ${c.yWhat}. Which conclusion do these data support?`,
    board: `r = ${nT(rd(d.f.r, 2), 2)}`,
    solution: ['Observational data, however strong the r: an association, not a cause.', `${cap(xMore)} ${c.id === 'screen' ? 'tends' : 'tend'} to go with ${yMore}.`],
    picture: { g: scatterG(d) },
  }, opts);
};

// ===================== experiment-for-cause =====================
const DESIGN: { claim: string; who: string; treat: string; out: string }[] = [
  { claim: 'screen time in the hour before bed reduces sleep', who: '100 volunteer teens', treat: 'no screens or their usual screens in the last hour before bed', out: 'hours of sleep' },
  { claim: 'a new fertilizer makes tomato plants grow taller', who: '60 tomato seedlings', treat: 'the new fertilizer or the usual one', out: 'height after 8 weeks' },
  { claim: 'caffeine shortens reaction time', who: '80 adult volunteers', treat: 'a caffeinated or a decaf drink (same taste)', out: 'reaction time on a computer test' },
  { claim: 'a 20-minute daily review raises quiz scores', who: '6 class sections', treat: 'the daily review or the usual lesson', out: 'quiz scores after 4 weeks' },
];
export const design: RGen = (R, n) => {
  const D0 = pick(R, DESIGN);
  const D = { ...D0, who: D0.who.replace(/^\d+/, String(int(R, 4, 12) * (D0.who.includes('sections') ? 1 : 10))) };
  const opts: Opt[] = [
    { t: `Randomly assign the ${D.who} to ${D.treat}, then compare ${D.out}.`, ok: true, say: 'Yes: random assignment makes the groups alike in everything except the treatment, so a difference can be blamed on it.' },
    { t: `Compare people who already chose ${D.treat.split(' or ')[0]!.replace(/^(a|the) /, '')} with those who did not: that is an experiment.`, mc: MC.studyType, say: 'If the subjects chose for themselves, it is observational: the groups may differ in other ways.' },
    { t: `Survey many more subjects about the two variables and compute r.`, mc: MC.causation, say: 'A bigger observational data set still shows only association.' },
  ];
  return choice(R, {
    id: `design-${n}`, family: 'design',
    prompt: `Observational data suggest that ${D.claim}. A research team has ${D.who} available. Which study could test whether it is a <b>cause</b>?`,
    board: '\\text{random assignment?}',
    solution: ['To test a cause, the researcher must assign the explanatory variable at random.', `Randomly assign the ${D.who} to ${D.treat}, then compare ${D.out}.`],
  }, opts);
};
export const designLimits: RGen = (R, n) => {
  if (R() < 0.5) {
    const U = pick(R, [
      { q: 'Does smoking cause lung disease?', why: 'It would be unethical to assign people to smoke: researchers rely on many careful observational studies instead.' },
      { q: 'Does skipping breakfast for a whole school year lower 10th graders\' grades?', why: 'It would be unethical to make students skip breakfast for a year: observational data, used carefully, are what we can get.' },
      { q: 'Does growing up in a bigger city change adult income?', why: 'It is impossible to assign children at random to grow up in different cities: we must rely on observational data.' },
    ]);
    const opts: Opt[] = [
      { t: U.why, ok: true, say: 'Yes. Random assignment is the tool for cause, but some experiments must not, or cannot, be run.' },
      { t: 'No experiment is needed: a strong correlation already proves the cause.', mc: MC.causation, say: 'A correlation alone never proves cause; that is why the question is hard here.' },
      { t: 'Randomized experiments only work with plants and machines, not people.', mc: MC.studyType, say: 'Many experiments use people (drug trials). The problem here is ethics or practicality.' },
    ];
    return choice(R, {
      id: `designLimits-${n}`, family: 'designLimits',
      prompt: `${U.q} Why can't researchers simply run a randomized experiment?`,
      board: '\\text{experiment?}',
      solution: ['Random assignment can support a causal conclusion.', 'But here assigning the treatment would be unethical or impossible.'],
    }, opts);
  }
  const k = int(R, 3, 8) * 10, e = int(R, 2, 6);
  const S = pick(R, [
    { who: `${k} volunteer college swimmers`, what: 'a new warm-up', did: `cut their 50 m times by 0.${e} s on average` },
    { who: `${k} volunteer adults aged 20 to 30`, what: 'a new stretching routine', did: `raised their flexibility scores by ${e} points on average` },
    { who: `${k} volunteer students at one high school`, what: 'a new vocabulary app', did: `raised their quiz scores by ${e} points on average` },
  ]);
  const opts: Opt[] = [
    { t: `${cap(S.what)} caused the change for people like these volunteers; whether it works for others needs more data.`, ok: true, say: 'Yes. Random assignment supports cause for the people studied; generalizing needs a sample of the wider population.' },
    { t: `${cap(S.what)} will work for everyone, by exactly the same amount.`, mc: MC.randomAny, say: 'Randomization supports cause in the group studied, on average, not an exact effect for every person everywhere.' },
    { t: 'Nothing: an experiment with volunteers proves nothing.', mc: MC.rejectsAll, say: 'Random assignment still licenses a causal conclusion for the volunteers: it just does not reach further.' },
  ];
  return choice(R, {
    id: `designLimits-${n}`, family: 'designLimits',
    prompt: `In a randomized experiment, ${S.who} were randomly split into two groups; ${S.what} ${S.did} compared with the usual routine. What can you conclude?`,
    board: '\\text{cause, for whom?}',
    solution: ['Random assignment: a causal conclusion for the people studied, on average.', 'To reach other people, the volunteers would have to represent them.'],
  }, opts);
};

// ===================== influential-point =====================
interface Infl { c: RCtx; xs: number[]; ys: number[]; iA: number; iB: number; all: ReturnType<typeof lsrl>; noA: ReturnType<typeof lsrl>; noB: ReturnType<typeof lsrl> }
function influential(R: () => number): Infl {
  const c = ctxPick(R, ['study', 'bike', 'tree', 'growth', 'rent', 'drinks']);
  return until(() => {
    const d = dataSet(R, c, 9, { hi: c.lo + (c.hi - c.lo) * 0.62, rLo: 0.75 });
    const xs = d.xs.slice(), ys = d.ys.slice();
    const mid = xs[4]!, span = c.hi - c.lo;
    // A: an x near the middle with a big residual; B: far out along x, off the trend
    const xA = onGrid(mid + c.xStep * (R() < 0.5 ? 1 : -1), c.xStep), xB = onGrid(c.lo + span * (0.92 + R() * 0.08), c.xStep);
    const yA = onGrid(d.f.a + d.f.b * xA + (R() < 0.5 ? 1 : -1) * c.sd * 4, c.yStep);
    const yB = onGrid(d.f.a + d.f.b * xB - Math.sign(d.f.b) * Math.abs(d.f.b) * span * 0.55, c.yStep);
    xs.push(xA, xB); ys.push(yA, yB);
    const iA = xs.length - 2, iB = xs.length - 1;
    const all = lsrl(xs, ys);
    const noA = lsrl(xs.filter((_, i) => i !== iA), ys.filter((_, i) => i !== iA)), noB = lsrl(xs.filter((_, i) => i !== iB), ys.filter((_, i) => i !== iB));
    return { c, xs, ys, iA, iB, all, noA, noB };
  }, m => plausible(c, m.ys) && !m.xs.slice(0, -2).includes(m.xs[m.iA]!) && !m.xs.slice(0, -1).includes(m.xs[m.iB]!) && (c.yMax === undefined || Math.max(...m.ys) <= c.yMax) && Math.min(...m.ys) > 0
    && Math.abs(m.noB.b - m.all.b) > 3 * Math.abs(m.noA.b - m.all.b) && Math.abs(m.noB.b - m.all.b) > 0.25 * Math.abs(m.noB.b)
    && [m.all, m.noA, m.noB].every(f => tieFree(f.b, 2, 0.05) && tieFree(f.r, 2, 0.05)));
}
const outCard = (m: Infl) => ({ title: 'Refits', cols: [{ head: 'Fit', cells: [`All ${m.xs.length}`, 'No A', 'No B'] }, { head: 'b', cells: [m.all, m.noA, m.noB].map(f => fx(f.b, 2)) }, { head: 'r', cells: [m.all, m.noA, m.noB].map(f => fx(f.r, 2)) }] });
export const refit: RGen = (R, n) => {
  const m = influential(R), { c } = m;
  const g = scatterG({ c, xs: m.xs, ys: m.ys }, { line: [m.all.a, m.all.b], hot: [m.iA, m.iB], names: { [m.iA]: 'A', [m.iB]: 'B' } });
  g.solveItems = [{ kind: 'line', key: 'noB', m: m.noB.b, b: m.noB.a, col: 'second', dash: true }];
  const opts: Opt[] = [
    { t: 'B: removing it changes the slope (and r) a lot.', ok: true, say: `Yes. B sits far out along the x-axis, off the trend: it pulls the line toward itself. Without B the slope is ${fx(m.noB.b, 2)} instead of ${fx(m.all.b, 2)}.` },
    { t: 'A: it has the largest residual, so it must move the line most.', mc: MC.equalInfluence, say: `A's x is near the middle: removing it barely changes the slope (${fx(m.noA.b, 2)} vs ${fx(m.all.b, 2)}). A far-out x matters more.` },
    { t: 'Both equally: any unusual point pulls the line the same amount.', mc: MC.equalInfluence, say: 'Compare the refits: removing A hardly changes b, removing B changes it a lot.' },
    { t: `Neither: one point cannot change a line fitted to ${m.xs.length} points.`, mc: MC.influence, say: `Look at the refit without B: the slope moves from ${fx(m.all.b, 2)} to ${fx(m.noB.b, 2)}.` },
  ];
  return choice(R, {
    id: `refit-${n}`, family: 'refit',
    prompt: `${calc(true)}${cap(c.who)}: ${c.yWhat} against ${c.xWhat}, with two unusual points A and B. The card shows the least-squares slope ${I('b')} and ${I('r')}, refit with all points, without A, and without B. Which point is <b>influential</b>?`,
    board: '',
    solution: [`Without A: b = ${fx(m.noA.b, 2)} (hardly changed). Without B: b = ${fx(m.noB.b, 2)} (a big change).`, 'B is influential: its x is far from the rest, so it pulls the line.'],
    picture: { g, card: outCard(m) },
  }, opts);
};
export const reportNotDelete: RGen = (R, n) => {
  const m = influential(R), { c } = m;
  const g = scatterG({ c, xs: m.xs, ys: m.ys }, { line: [m.all.a, m.all.b], hot: [m.iB], names: { [m.iB]: 'B' } });
  const opts: Opt[] = [
    { t: 'Check B for a recording error; if it is real, report the fit with and without it.', ok: true, say: 'Yes. Investigate, then be open: show how much the conclusion depends on that one case.' },
    { t: 'Delete B: an unusual point is always a mistake.', mc: MC.alwaysDelete, say: 'Unusual points are often real and important. Deleting them quietly hides how fragile the fit is.' },
    { t: 'Delete every point that is far from the line.', mc: MC.alwaysDelete, say: 'Throwing away inconvenient data makes the fit look better than it is.' },
    { t: `Keep B and say nothing: one point cannot matter among ${m.xs.length}.`, mc: MC.influence, say: `It does matter here: without B the slope is ${fx(m.noB.b, 2)} instead of ${fx(m.all.b, 2)}.` },
  ];
  return choice(R, {
    id: `reportNotDelete-${n}`, family: 'reportNotDelete',
    prompt: `${cap(c.who)}: point B is far out along the ${c.xWhat} axis, off the trend. With B the slope is ${fx(m.all.b, 2)}; without B it is ${fx(m.noB.b, 2)}. What should the analyst do about B?`,
    board: '',
    solution: ['First check whether B is an error (a typo, a broken measurement).', 'If B is real, keep it and report the fit both with and without it.'],
    picture: { g },
  }, opts);
};

// ===================== three-check-critique =====================
type Flaw = 'fit' | 'scope' | 'cause' | 'none';
export const critique: RGen = (R, n) => {
  const flaw = pick(R, ['fit', 'scope', 'cause', 'none', 'none'] as Flaw[]);
  const c = ctxPick(R, ['rent', 'growth', 'bike', 'elev', 'tree', 'study']);
  const { xs, ys } = flaw === 'fit'
    ? until(() => patterned(R, c, 'curve'), s => Math.abs(lsrl(s.xs, s.ys).r) >= 0.85)
    : until(() => patterned(R, c, 'random'), s => Math.abs(lsrl(s.xs, s.ys).r) >= 0.85);
  const f = lsrl(xs, ys), A0 = rd(f.a, c.da), B0 = rd(f.b, c.db);
  const lo = Math.min(...xs), hi = Math.max(...xs);
  const x0 = flaw === 'scope' ? onGrid(Math.min(c.xCap, hi + (hi - lo) * (0.9 + R() * 0.6)), c.xStep) : until(() => onGrid(lo + (hi - lo) * (0.25 + R() * 0.5), c.xStep), v => !xs.includes(v));
  const v = rd(yhat(A0, B0, x0), 1);
  const claim = flaw === 'cause'
    ? `"Raising ${a1(c.one)}'s ${c.xWhat} by one unit causes ${c.poss} ${c.yWhat} to ${B0 > 0 ? 'rise' : 'fall'} by ${yv(c, Math.abs(B0), c.db)}."`
    : `"For ${c.who} like these, the predicted ${c.yWhat} for ${c.caseWith(nH(x0))} is about ${yv(c, v, 1)}, on average."`;
  const es = residuals(xs, ys, f.a, f.b).map(e => rd(e, 2));
  const gS = scatterG({ c, xs, ys }, { line: [f.a, f.b] });
  const T: Record<Flaw, string> = {
    fit: 'Fit: the residual plot curves, so a straight line is the wrong model.',
    scope: 'Scope: it predicts outside the observed interval of x.',
    cause: 'Cause: it claims cause from observational data.',
    none: 'Nothing: the claim is justified.',
  };
  const opts: Opt[] = (Object.keys(T) as Flaw[]).map(k => ({
    t: T[k], ok: k === flaw,
    mc: k === flaw ? undefined : k === 'none' ? MC.settles : flaw === 'none' ? MC.rejectsAll : undefined,
    say: k === flaw ? (flaw === 'none' ? 'Yes: a good fit, x inside the data, the same population, and "predicted / on average" wording.' : 'Yes: that check fails. The other two pass.') : k === 'none' ? 'Check fit, scope and cause one at a time: one of them fails here.' : flaw === 'none' ? 'That check passes here. A claim can be justified: say so when all three checks pass.' : 'That check passes. Look at the other two.',
  }));
  return choice(R, {
    id: `critique-${n}`, family: 'critique',
    prompt: `Observational data on ${c.source}: ${c.xMany} from ${nH(lo)} to ${nH(hi)} (${c.xUnit}), least-squares line ${modelH(fx(A0, c.da), fx(B0, c.db))}, ${I('r')} = ${fx(rd(f.r, 2), 2)}. The residual plot is on the right. Claim: ${claim} Which check, if any, does the claim fail?`,
    board: '',
    solution: ['Three separate checks: fit (residual plot), scope (x inside the data, same population), cause (observational data cannot show cause).', flaw === 'fit' ? 'The residual plot curves: fit fails.' : flaw === 'scope' ? `x = ${nH(x0)} is outside ${nH(lo)} to ${nH(hi)}: scope fails.` : flaw === 'cause' ? '"Causes" from observational data: cause fails.' : 'All three pass: the claim is justified.'],
    picture: { g: gS, g2: residG(c, xs, es, { xAxis: gS.x }) },
  }, opts, true);
};

// ===================== r-squared-meaning =====================
export const r2SS: RGen = (R, n) => {
  const { sst, sse } = until(() => { const sst = int(R, 12, 90) * 10, sse = int(R, Math.round(sst * 0.08), Math.round(sst * 0.7)); return { sst, sse }; }, q => tieFree(100 * (1 - q.sse / q.sst), 0, 0.05));
  const r2 = 1 - sse / sst, pct = rd(100 * r2, 0);
  const cands: Cand[] = [[rd(100 * sse / sst, 0), MC.r2Share, 'SSE / SST is the share the line LEAVES unexplained. r² = 1 − SSE / SST.']];
  return numItem({
    id: `r2SS-${n}`, family: 'r2SS',
    prompt: `${calc(true)}Predicting with the mean ȳ leaves a total squared variation SST = ${nH(sst)}. The least-squares line leaves SSE = ${nH(sse)}. What is ${I('r')}², as a percent rounded to the nearest whole percent?`,
    board: `SST = ${nT(sst)}\\qquad SSE = ${nT(sse)}`, unit: '%',
    solution: [`r² = 1 − SSE / SST = 1 − ${nH(sse)} / ${nH(sst)} = ${nH(r2, 4)}.`, `As a percent: about ${ans(nH(pct) + '%')}.`],
  }, pct, `Yes: about ${pct}% of the variation in y is accounted for by the line.`, cands, 'r² = 1 − SSE / SST, then times 100 for a percent.', { also: [rd(r2, 2)] });
};
export const r2Sentence: RGen = (R, n) => {
  const c = ctxPick(R);
  const d = until(() => dataSet(R, c, 10, { rLo: 0.6, rHi: 0.97 }), s => tieFree(s.f.r2, 2, 0.05));
  const p = Math.round(rd(d.f.r2, 2) * 100);
  const opts: Opt[] = [
    { t: `About ${p}% of the variation in ${c.yWhat} is accounted for by the linear model relating ${c.yWhat} to ${c.xWhat}.`, ok: true, say: 'Yes: r² is the share of the variation in y that the line accounts for.' },
    { t: `About ${p}% of the ${c.who} lie on the regression line.`, mc: MC.r2Share, say: 'r² is not a share of points: usually no point lies exactly on the line.' },
    { t: `The model's predictions are correct ${p}% of the time.`, mc: MC.r2Share, say: 'r² is not a hit rate: almost every prediction misses by a little.' },
    { t: `About ${p}% of ${a1(c.one)}'s ${c.yWhat} is caused by its ${c.xWhat}.`, mc: MC.causation, say: 'r² describes how well a line fits, not causes.' },
  ];
  return choice(R, {
    id: `r2Sentence-${n}`, family: 'r2Sentence',
    prompt: `For ${c.source}, ${c.yWhat} against ${c.xWhat}: ${I('r')}² = ${fx(rd(d.f.r2, 2), 2)}. Which sentence interprets ${I('r')}²?`,
    board: `r^2 = ${fxT(rd(d.f.r2, 2), 2)}`,
    solution: ['r² = the share of the total variation in y (about its mean) that the least-squares line accounts for.', `Template: about ${p}% of the variation in ${c.yWhat} is accounted for by the linear model.`],
    picture: { g: scatterG(d, { line: [d.f.a, d.f.b] }) },
  }, opts);
};
export const rFromR2: RGen = (R, n) => {
  const toR = R() < 0.65;
  const c = ctxPick(R);
  if (toR) {
    const d = until(() => dataSet(R, c, 10, { rLo: 0.6, rHi: 0.97 }), s => tieFree(Math.sqrt(rd(s.f.r2, 2)), 2, 0.05));
    const r2 = rd(d.f.r2, 2), r = rd(Math.sign(d.f.b) * Math.sqrt(r2), 2);
    const cands: Cand[] = [[Math.abs(r), r < 0 ? MC.r2Sign : undefined, 'The square root has two signs: r takes the sign of the slope, which is negative here.'], [r2, MC.summaries, 'That is r² itself. Take the square root.']];
    return numItem({
      id: `rFromR2-${n}`, family: 'rFromR2',
      prompt: `${calc(true)}The least-squares line for ${c.source} is ${modelH(fx(d.A, c.da), fx(d.B, c.db))} (${I('x')} = ${c.xWhat}), and ${I('r')}² = ${fx(r2, 2)}. What is ${I('r')}? Round to 2 decimal places.`,
      board: `r^2 = ${fxT(r2, 2)}`, unit: '',
      solution: [`√${fx(r2, 2)} ≈ ${nH(Math.sqrt(r2), 4)}.`, `The slope is ${d.B < 0 ? 'negative' : 'positive'}, so r ≈ ${ans(fx(r, 2))}.`],
    }, r, `Yes: r ≈ ${fx(r, 2)}.`, cands, 'r = ±√r², with the sign of the slope.');
  }
  const r = until(() => rd((R() < 0.5 ? -1 : 1) * (0.4 + R() * 0.55), 2), v => tieFree(v * v, 2, 0.05));
  const r2 = rd(r * r, 2);
  const cands: Cand[] = [[Math.abs(r), undefined, 'Square r: r² = r × r.'], [rd(2 * r, 2), undefined, 'Square means r times r, not 2 times r.'], [r9(-r2), MC.r2Sign, 'A square is never negative.']];
  return numItem({
    id: `rFromR2-${n}`, family: 'rFromR2',
    prompt: `${calc(true)}For ${c.source}, ${c.yWhat} against ${c.xWhat}, the correlation is ${I('r')} = ${fx(r, 2)}. What is ${I('r')}² for the least-squares line? Round to 2 decimal places.`,
    board: `r = ${nT(r, 2)}`, unit: '',
    solution: [`r² = (${fx(r, 2)})² = ${nH(r * r, 4)}.`, `About ${ans(fx(r2, 2))}`],
  }, r2, `Yes: r² ≈ ${fx(r2, 2)}.`, cands, 'Multiply r by itself.', { also: [r9(r * r)] });
};

// ===================== r-squared-limits =====================
export const r2Compare: RGen = (R, n) => {
  const k = pick(R, ['across', 'same', 'infl'] as const);
  if (k === 'across') {
    const a = rd(0.3 + R() * 0.25, 2), b = rd(0.65 + R() * 0.25, 2);
    const S = pick(R, [
      ['weight against age', 'height against age', 'children at one clinic'],
      ['monthly rent against floor area', 'monthly utility bill against floor area', 'apartments in one city'],
      ['test score against hours studied', 'hours of sleep against hours studied', 'students at one school'],
    ]);
    const opts: Opt[] = [
      { t: 'Neither can be called better from r²: they predict different responses, so their r² values do not compare.', ok: true, say: 'Yes. r² compares fits only for the same response and the same data.' },
      { t: `The ${S[1]} model, because its r² is higher.`, mc: MC.r2Across, say: 'Different responses have different amounts of variation to explain: their r² values do not rank the models.' },
      { t: `The ${S[0]} model, because its r² is lower and so it is more cautious.`, say: 'A lower r² is not more cautious; and anyway these r² values cannot be compared.' },
    ];
    return choice(R, {
      id: `r2Compare-${n}`, family: 'r2Compare',
      prompt: `For ${S[2]}: ${S[0]} gives ${I('r')}² = ${fx(a, 2)}; ${S[1]} gives ${I('r')}² = ${fx(b, 2)}. Which model fits better?`,
      board: `r^2 = ${fxT(a, 2)}\\quad \\text{vs}\\quad r^2 = ${fxT(b, 2)}`,
      solution: ['r² compares models only for the same response variable and the same data.', 'Here the responses differ: r² cannot rank these two models.'],
    }, opts);
  }
  if (k === 'same') {
    const a = rd(0.55 + R() * 0.15, 2), b = rd(0.8 + R() * 0.15, 2);
    const opts: Opt[] = [
      { t: `Model 2 accounts for more of the variation; before using it, check its residual plot for a pattern.`, ok: true, say: 'Yes. Same data and response: r² can be compared. Adequacy still comes from the residual plot.' },
      { t: 'Model 2 is the right model: a higher r² proves the form is correct.', mc: MC.highR, say: 'A higher r² does not prove the form: a curved pattern in the residuals can still show the line is wrong.' },
      { t: 'They cannot be compared at all.', mc: MC.r2Across, say: 'For the same response and the same data, r² values CAN be compared.' },
    ];
    return choice(R, {
      id: `r2Compare-${n}`, family: 'r2Compare',
      prompt: `Two models for the same data and the same response: model 1 has ${I('r')}² = ${fx(a, 2)}, model 2 has ${I('r')}² = ${fx(b, 2)}. What can you say?`,
      board: `r^2_1 = ${fxT(a, 2)}\\quad r^2_2 = ${fxT(b, 2)}`,
      solution: ['Same response, same data: the larger r² accounts for more variation.', 'Whether a model is adequate is decided by its residual plot, not by r².'],
    }, opts);
  }
  const lo2 = rd(0.12 + R() * 0.12, 2), hi2 = rd(0.7 + R() * 0.15, 2);
  const opts: Opt[] = [
    { t: 'The high r² rests on one point: report both fits and be careful with the conclusion.', ok: true, say: 'Yes. One influential point can manufacture a high r².' },
    { t: `The relationship is strong: r² = ${fx(hi2, 2)} settles it.`, mc: MC.highR, say: `Without that point r² is only ${fx(lo2, 2)}: the strength comes from one case.` },
    { t: 'One point cannot change r² that much, so the refit must be a mistake.', mc: MC.influence, say: 'A point far out along x can change r² that much.' },
  ];
  return choice(R, {
    id: `r2Compare-${n}`, family: 'r2Compare',
    prompt: `Without one point far out along the ${I('x')}-axis, ${I('r')}² = ${fx(lo2, 2)}. With that point added, ${I('r')}² = ${fx(hi2, 2)}. What should you conclude?`,
    board: `r^2:\\ ${fxT(lo2, 2)} \\to ${fxT(hi2, 2)}`,
    solution: ['One influential point raised r² a lot.', 'The strong-looking fit depends on that one case: report both and be cautious.'],
  }, opts);
};

