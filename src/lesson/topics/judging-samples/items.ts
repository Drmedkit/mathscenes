// items.ts: exercise families for "judge sample representativeness and limit conclusions" (grade 7, 7.SP.A.1).
// Every family is one deep structure with many skins (contexts.ts: people, days, apples; explicit and implied
// populations; census, part, different group; selective rules with a known or unknown direction; missing answers for
// a reason linked or not linked to the answer; record sheets with a duplicate or blanks). All items are tap-to-choose
// (no free typing); every wrong choice that is a catalogued misconception carries its id (logged, never shown).
// The facts an item states are computed by sampling.ts (census / part / different, completion bounds, guaranteed
// claims, duplicate-free counts), so a wrong item cannot be generated.
import { type Item, type Response, type Verdict, A, B, S, int, pick, shuffle } from '../../runtime/item';
import type { Paint } from '../../../core/theme';
import { CONTEXTS, type Ctx, NAMES, type Other, type Rule, SHEETS, type Sheet } from './contexts';
import { type Claim, computeStudy, countTable, guaranteed, possible, type Rec, type Study } from './sampling';
import type { SampleMapParams, SampleMapStep } from './SampleMap';
import type { RecordTableParams, RecordTableStep } from './RecordTable';
import type { Run } from './board';
import { endOnChoice } from '../../runtime/explain';
export type { Response, Verdict };

export type FamilyId = 'namePop' | 'popOrSample' | 'matchKind' | 'whoGave' | 'missingWhy' | 'missingWay' | 'leftOut' | 'biasWay' | 'scope' | 'complete' | 'revise' | 'audit';
export const FAMILIES: readonly { id: FamilyId; name: string }[] = [
  { id: 'namePop', name: 'Name the population' },
  { id: 'popOrSample', name: 'Population or sample?' },
  { id: 'matchKind', name: 'Census, part, or a different group' },
  { id: 'whoGave', name: 'Who gave the data?' },
  { id: 'missingWhy', name: 'Does the missing data matter?' },
  { id: 'missingWay', name: 'Which way do the missing push it?' },
  { id: 'leftOut', name: 'Who is left out?' },
  { id: 'biasWay', name: 'Too high, too low, or can’t tell?' },
  { id: 'scope', name: 'Which conclusion fits the data?' },
  { id: 'complete', name: 'True however the missing answered?' },
  { id: 'revise', name: 'Fix the overreaching claim' },
  { id: 'audit', name: 'Audit the report' },
];
export const FAMILY_NAMES: Record<string, string> = Object.fromEntries(FAMILIES.map(f => [f.id, f.name]));

// ---------- pictures and board lines ----------
export interface MapPic { kind: 'map'; map: SampleMapParams; show: SampleMapStep[]; solve: SampleMapStep[]; scopeAll?: boolean; complete?: boolean }
export interface TablePic { kind: 'table'; table: RecordTableParams; show: RecordTableStep[]; solve: RecordTableStep[] }
/** a board row: a dim label and its value; `alts` are shorter fallbacks, the page takes the first that fits */
export interface BoardLine { label: string; alts: Run[][] }
export interface JudgeItem extends Item {
  family: FamilyId;
  pic: MapPic | TablePic;
  /** the board before the answer, and the rows the worked solution adds */
  rows: BoardLine[]; solveRows: BoardLine[];
}

/** split a value into runs: numbers big, words normal, all in one colour */
export function runsOf(text: string, col: Paint): Run[] {
  return text.split(/(\d[\d,]*)/).filter(s => s !== '').map(t => ({ t, col, num: /^\d/.test(t) }));
}
const line = (label: string, col: Paint, ...texts: string[]): BoardLine => ({ label, alts: texts.map(t => runsOf(t, col)) });
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const fill = (s: string, v: Record<string, number | string>) => s.replace(/\{(\w+)\}/g, (_, k: string) => String(v[k] ?? `{${k}}`));
const fmt = (n: number) => n.toLocaleString('en-US');

/** people are asked; school days and apples are checked */
const askOf = (c: Ctx) => (c.mark === 'person' ? 'asked' : 'checked');
// ---------- a choice item ----------
interface Opt { t: string; ok: boolean; mc?: string; say: string }
interface Base { id: string; family: FamilyId; prompt: string; board: string; solution: string[]; pic: MapPic | TablePic; rows: BoardLine[]; solveRows: BoardLine[] }
function choose(R: () => number, b: Base, opts: Opt[]): JudgeItem {
  const o = shuffle(R, opts.slice());
  const texts = new Set(o.map(x => x.t));
  if (texts.size !== o.length) throw new Error(`${b.family}: two choices read the same (${o.map(x => x.t).join(' | ')})`);
  if (o.filter(x => x.ok).length !== 1) throw new Error(`${b.family}: needs exactly one right choice`);
  return {
    ...b, solution: endOnChoice(b.solution, o.find(x => x.ok)!.t), input: 'choice', choices: o.map(x => x.t), answer: { kind: 'choice', i: o.findIndex(x => x.ok) },
    check: r => {
      const x = r.kind === 'choice' ? o[r.i] : undefined;
      if (!x) return { ok: false, say: 'Pick one.' };
      return x.ok ? { ok: true, say: x.say } : { ok: false, mc: x.mc, say: x.say };
    },
  };
}

// ---------- shared pieces ----------
const PEOPLE = CONTEXTS.filter(c => c.mark === 'person');
/** the number asked; in a big population a round number, so the map can draw it to an exact scale (1 mark = k) */
const nOf = (R: () => number, r: Rule | Other, N = 0) => {
  const step = N > 1500 ? 10 : N > 300 ? 5 : 1;
  const lo = Math.ceil(r.n[0] / step), hi = Math.max(lo, Math.floor(r.n[1] / step));
  return step * int(R, lo, hi);
};
/** a study sentence: "The Lincoln student council wants to know: “…” They asked 60 kids at the gym after school." */
function studyText(c: Ctx, how: string, implied: boolean): string {
  return implied ? `${c.ourAsker}: “${c.qOur}” To find out, they ${how}.` : `${c.asker} wants to know: “${c.q}” They ${how}.`;
}
/** “51 of 60 said yes” for people, “9 of 21 had a late bus” for days and things */
const saidYes = (c: Ctx, y: number, of: number, the = '') => (c.mark === 'person' ? `${fmt(y)} of ${the}${fmt(of)} said yes` : `${fmt(y)} of ${the}${fmt(of)} ${c.yes}`);
const verb = (c: Ctx) => (c.mark === 'person' ? 'asked' : 'checked');
function partMap(c: Ctx, rule: Rule, n: number, extra: Partial<SampleMapParams> = {}): SampleMapParams {
  return { popLabel: c.popShort, N: c.N, match: 'part', sampleLabel: `${n} ${rule.tag}`, n, leftLabel: `${fmt(c.N - n)} not ${verb(c)}`, verb: verb(c), mark: c.mark, unit: c.unit, ...extra };
}
function otherMap(c: Ctx, o: Other, n: number, extra: Partial<SampleMapParams> = {}): SampleMapParams {
  return { popLabel: c.popShort, N: c.N, match: 'different', sampleLabel: `${n} ${verb(c)}`, n, outsideLabel: o.tag, verb: verb(c), mark: c.mark, unit: c.unit, ...extra };
}
function censusMap(c: Ctx, extra: Partial<SampleMapParams> = {}): SampleMapParams {
  return { popLabel: c.popShort, N: c.N, match: 'census', sampleLabel: `all ${fmt(c.N)} ${verb(c)}`, n: c.N, verb: verb(c), mark: c.mark, unit: c.unit, ...extra };
}
const popLine = (c: Ctx) => line('the question is about', 'first', c.popShort);
const fromLine = (t: string) => line('the data came from', 'second', t);
const DIRWORD = { high: 'too high', low: 'too low', unknown: 'can’t tell' } as const;

// =============== sub-goal 1: name the population ===============
const namePop = (R: () => number, n: number): JudgeItem => {
  const c = pick(R, CONTEXTS), rule = pick(R, c.rules), k = nOf(R, rule, c.N), implied = R() < 0.5;
  const how = fill(rule.how, { n: k });
  const sample = `The ${k} ${rule.group}`;
  return choose(R, {
    id: `namePop-${n}`, family: 'namePop',
    prompt: `${studyText(c, how, implied)} What is the <b class="a">population</b>?`,
    board: `population = ?`,
    solution: [`The population is the whole group the question is about: ${A(c.pop)}.`, `The ${B(`${k} ${rule.group}`)} are the sample: the ones who gave the data.`],
    pic: { kind: 'map', map: partMap(c, rule, k), show: ['dots', 'sample'], solve: ['pop'] },
    rows: [fromLine(`${k} ${rule.tag}`)], solveRows: [popLine(c)],
  }, [
    { t: cap(c.pop), ok: true, say: `Yes. The question is about ${A(c.pop)}${implied ? ` (“our ${c.qOur.includes('town') ? 'town' : c.qOur.includes('homeroom') ? 'homeroom' : 'school'}” means ${c.popOf})` : ''}.` },
    { t: sample, ok: false, mc: 'mc.statistics.confuses-sample-and-population-terms', say: `Those ${B(k)} gave the data: they are the sample. The population is the whole group the question is about: ${A(c.pop)}.` },
    { t: cap(c.broad), ok: false, mc: 'mc.statistics.population-description-omits-scope', say: `Too wide: the question is only about ${A(c.pop)}, not ${c.broad} anywhere.` },
    { t: cap(c.askerGroup), ok: false, say: `They run the study; they are not who the question is about. The population is ${A(c.pop)}.` },
  ]);
};

const popOrSample = (R: () => number, n: number): JudgeItem => {
  const c = pick(R, CONTEXTS), useOther = R() < 0.3;
  const rule = pick(R, c.rules), o = pick(R, c.others);
  const k = useOther ? nOf(R, o, c.N) : nOf(R, rule, c.N);
  const how = useOther ? `${askOf(c)} ${k} ${o.group}` : fill(rule.how, { n: k });
  const which = pick(R, ['pop', 'sample', 'sample', 'asker'] as const);
  const phrase = which === 'pop' ? c.popOf : which === 'sample' ? `the ${k} ${useOther ? o.group : rule.group}` : c.askerGroup;
  const right = which === 'pop' ? 0 : which === 'sample' ? 1 : 2;
  const opts: Opt[] = [
    { t: 'The population: the whole group the question is about', ok: right === 0, mc: right === 1 ? 'mc.statistics.confuses-sample-and-population-terms' : undefined,
      say: right === 0 ? `Yes: the question is about ${A(c.popOf)}.` : `“${phrase}” ${right === 1 ? 'gave the data' : 'ran the study'}; the question is about ${A(c.popOf)}.` },
    { t: 'The sample: the group that gave the data', ok: right === 1, mc: right === 0 ? 'mc.statistics.target-population-assumed-measured' : undefined,
      say: right === 1 ? `Yes: the data came from ${B(phrase)}${useOther ? `, even though ${o.why}` : ''}.` : right === 0 ? `The question is about them, but the data came from ${B(`the ${k} ${useOther ? o.group : rule.group}`)}.` : `They ran the study; the data came from ${B(`the ${k} ${useOther ? o.group : rule.group}`)}.` },
    { t: 'Neither: they ran the study', ok: right === 2, say: right === 2 ? `Right: they asked the question; they are neither the population nor the sample.` : `“${phrase}” ${right === 0 ? 'is the population: the whole group the question is about' : 'is the sample: the group that gave the data'}.` },
  ];
  return choose(R, {
    id: `popOrSample-${n}`, family: 'popOrSample',
    prompt: `${studyText(c, how, R() < 0.3)} In this study, what is “${phrase}”?`,
    board: `${phrase} = ?`,
    solution: [`Population: the whole group the question is about, ${A(c.popOf)}.`, `Sample: the group that gave the data, ${B(`the ${k} ${useOther ? o.group : rule.group}`)}.`, `${cap(c.askerGroup)} only ran the study.`],
    pic: { kind: 'map', map: useOther ? otherMap(c, o, k) : partMap(c, rule, k), show: ['dots'], solve: ['pop', 'sample'] },
    rows: [], solveRows: [popLine(c), fromLine(`${k} ${useOther ? o.tag : rule.tag}`)],
  }, opts);
};

// =============== sub-goal 2: the group studied vs. the population ===============
const matchKind = (R: () => number, n: number): JudgeItem => {
  const c = pick(R, CONTEXTS), kind = pick(R, ['census', 'part', 'part', 'different'] as const);
  const rule = pick(R, c.rules), o = pick(R, c.others);
  const k = kind === 'census' ? c.N : kind === 'part' ? nOf(R, rule, c.N) : nOf(R, o, c.N);
  const how = kind === 'census' ? c.census : kind === 'part' ? fill(rule.how, { n: k }) : `${askOf(c)} ${k} ${o.group}`;
  const st = computeStudy({ N: c.N, n: k, match: kind });
  const big = kind === 'part' && k >= 40;
  const opts: Opt[] = [
    { t: `A census: every one of ${c.popOf} was included`, ok: kind === 'census', say: kind === 'census' ? `Yes: all ${fmt(c.N)} were included, so the group studied IS the population.` : `Not everyone: ${kind === 'part' ? `${fmt(st.notAsked)} were never asked` : `not one of ${c.popOf} was asked`}.` },
    { t: `Part of the population: some of ${c.popOf} were included`, ok: kind === 'part', say: kind === 'part' ? `Yes: the ${B(`${k} ${rule.group}`)} are some of the ${A(fmt(c.N))}; ${fmt(st.notAsked)} were not asked.` : kind === 'census' ? `More than some: every one of the ${fmt(c.N)} was included.` : `None of the ones asked belong to the population: ${o.why}.` },
    { t: `A different group: the ones studied are not in the population`, ok: kind === 'different', say: kind === 'different' ? `Yes: ${o.why}. The data describe the ${B(o.group)}, not ${A(c.popOf)}.` : `The ones studied ARE in the population${kind === 'part' ? `: the ${rule.group} are ${c.members} too` : ''}.` },
  ];
  if (kind === 'part') opts.push(big
    ? { t: `A census: ${k} is so many that it counts as everyone`, ok: false, mc: 'mc.statistics.large-sample-cures-bias', say: `${k} is a lot, but ${fmt(st.notAsked)} were never asked. Only asking everyone makes a census.` }
    : { t: `A different group: the ${rule.group} are only some of ${c.members}`, ok: false, say: `Some of the population is still IN the population: that is part of the population, not a different group.` });
  else if (kind === 'different') opts.push({ t: `Part of the population: the question is about ${c.popOf}, so they were asked`, ok: false, mc: 'mc.statistics.target-population-assumed-measured', say: `The question is about them, but the data came from the ${B(o.group)}: ${o.why}.` });
  else opts.push({ t: 'Part of the population: a study can only ever ask some of a group', ok: false, mc: 'mc.statistics.census-result-hedged', say: `Here every one of the ${fmt(c.N)} was included. That is a census.` });
  return choose(R, {
    id: `matchKind-${n}`, family: 'matchKind',
    prompt: `${studyText(c, how, false)} How does the group they studied match the <b class="a">population</b>?`,
    board: `${kind}`,
    solution: [`Population: ${A(c.pop)}.`, kind === 'census' ? `Studied: all ${fmt(c.N)}: a ${S('census')}.` : kind === 'part' ? `Studied: ${B(`${k} ${rule.group}`)}, some of the ${fmt(c.N)}: ${S('part of the population')}.` : `Studied: ${B(`${k} ${o.group}`)}; ${o.why}: ${S('a different group')}.`],
    pic: { kind: 'map', map: kind === 'census' ? censusMap(c) : kind === 'part' ? partMap(c, rule, k) : otherMap(c, o, k), show: ['pop', 'dots'], solve: ['sample'] },
    rows: [popLine(c)], solveRows: [fromLine(kind === 'census' ? `all ${fmt(c.N)}` : kind === 'part' ? `${k} ${rule.tag}` : `${k} ${o.tag}`)],
  }, opts);
};

const whoGave = (R: () => number, n: number): JudgeItem => {
  const c = pick(R, CONTEXTS), useOther = R() < 0.4;
  const rule = pick(R, c.rules), o = pick(R, c.others);
  const k = useOther ? nOf(R, o, c.N) : nOf(R, rule, c.N);
  const how = useOther ? `${askOf(c)} ${k} ${o.group}` : fill(rule.how, { n: k });
  const group = useOther ? o.group : rule.group;
  const qFirst = R() < 0.5 || !how.startsWith('asked');
  const prompt = qFirst ? `${c.asker} wants to know: “${c.q}” They ${how}. Who actually gave the data?`
    : `${c.asker} ${how} to answer: “${c.q}” Who actually gave the data?`;
  const wrongOther = useOther ? c.others.find(x => x !== o) ?? o : null;
  return choose(R, {
    id: `whoGave-${n}`, family: 'whoGave', prompt, board: 'sample = ?',
    solution: [`The question is about ${A(c.popOf)}.`, `But the answers came from ${B(`the ${k} ${group}`)}: that is the group studied.`],
    pic: { kind: 'map', map: useOther ? otherMap(c, o, k) : partMap(c, rule, k), show: ['pop', 'dots'], solve: ['sample'] },
    rows: [popLine(c)], solveRows: [fromLine(`${k} ${useOther ? o.tag : rule.tag}`)],
  }, [
    { t: `The ${k} ${group}`, ok: true, say: `Yes: only the ${B(`${k} ${group}`)} answered${useOther ? `, and ${o.why}` : ''}.` },
    { t: cap(c.popOf), ok: false, mc: 'mc.statistics.target-population-assumed-measured', say: `That is who the question is about. The data came only from the ${B(`${k} ${group}`)}.` },
    { t: cap(c.askerGroup), ok: false, say: `They ran the study. The answers came from the ${B(`${k} ${group}`)}.` },
    wrongOther
      ? { t: `The ${wrongOther.group}`, ok: false, say: `They were not asked here. The answers came from the ${B(`${k} ${group}`)}.` }
      : { t: cap(rule.leftOut), ok: false, say: `They are exactly the ones who were NOT asked. The answers came from the ${B(`${k} ${group}`)}.` },
  ]);
};

// =============== sub-goal 3: missing data, linked to the answer or not ===============
interface Miss { c: Ctx; m: number; r: number; y: number; st: Study; text: string }
function missingStudy(R: () => number, c: Ctx, reason: string): Miss {
  const N = c.N;
  const m = Math.max(2, Math.round(N * (0.12 + 0.25 * R())));
  const r = N - m;
  const y = Math.max(1, Math.min(r - 1, Math.round(r * (0.35 + 0.45 * R()))));
  const st = computeStudy({ N, n: N, match: 'census', answered: r, yes: y });
  const text = `${c.asker} ${c.missing.sent}. ${cap(fill(c.missing.back, { r: fmt(r) }))}; ${fill(c.missing.notBack, { m: fmt(m) })}. ${fill(reason, { m: fmt(m) })}`;
  return { c, m, r, y, st, text };
}
const missRows = (s: Miss) => [popLine(s.c), line('the answers', 'ink', `${fmt(s.y)} yes, ${fmt(s.r - s.y)} no`, `${fmt(s.y)} yes`), line('no reply', 'second', `${fmt(s.m)}`)];

const missingWhy = (R: () => number, n: number): JudgeItem => {
  const c = pick(R, CONTEXTS), kase = pick(R, ['unrelated', 'related', 'unknown'] as const);
  const rel = pick(R, c.missing.related);
  const reason = kase === 'unrelated' ? pick(R, c.missing.lost) : kase === 'related' ? rel.reason : 'No one knows why.';
  const s = missingStudy(R, c, reason);
  const opts: Opt[] = [
    { t: 'Not likely: why they are missing has nothing to do with the answers', ok: kase === 'unrelated',
      say: kase === 'unrelated' ? `Right: the reason is chance, not the answer, so the ${fmt(s.m)} missing are likely a mix like the rest.` : kase === 'related' ? `Here the reason IS linked to the answer: ${rel.reason.toLowerCase()}` : `We don't know the reason, so we can't say it is unrelated.` },
    { t: `Yes: why they are missing is linked to the answer, so the result is likely ${DIRWORD[rel.dir]}`, ok: kase === 'related',
      say: kase === 'related' ? `Yes. ${rel.reason} So the result is likely ${S(DIRWORD[rel.dir])}.` : kase === 'unrelated' ? `This reason has nothing to do with the answers, so it doesn't push the result either way.` : `Maybe, but nothing tells us the reason is linked. We can only say “if …”.` },
    { t: `Can’t tell which way: no one knows why. If the missing ones ${c.yesLess}, the result is too high`, ok: kase === 'unknown',
      say: kase === 'unknown' ? `Right: with no reason given, the effect could go either way. “If …” is the honest way to say it.` : `We do know the reason here, so we can say more than “if”.` },
    kase === 'unrelated'
      ? { t: 'Yes: any missing answers make a result wrong, whatever the reason', ok: false, mc: 'mc.statistics.missingness-mechanism-does-not-matter', say: `What matters is WHY they are missing. Lost by chance, before anyone read them, they are likely a mix like the rest.` }
      : { t: 'No: the missing ones would answer just like the ones who answered', ok: false, mc: 'mc.statistics.nonrespondents-answer-like-respondents', say: kase === 'related' ? `Not here: ${rel.reason.charAt(0).toLowerCase() + rel.reason.slice(1)} They are likely different.` : `We can't assume that: nobody knows who they are or why they didn't answer.` },
  ];
  return choose(R, {
    id: `missingWhy-${n}`, family: 'missingWhy', prompt: `${s.text} Could the missing ones make the result misleading?`, board: `${s.y}/${s.r}, ${s.m} missing`,
    solution: [`${fmt(s.m)} of ${fmt(c.N)} are missing.`, kase === 'unrelated' ? 'The reason has nothing to do with the answers: the missing are likely a mix like the others.' : kase === 'related' ? `The reason is linked to the answer, so the missing are likely different: the result is likely ${S(DIRWORD[rel.dir])}.` : `The reason is unknown, so the direction is unknown. Say it with “if”.`],
    pic: { kind: 'map', map: censusMap(c, { answered: s.r, yes: s.y }), show: ['pop', 'dots', 'sample', 'answers'], solve: [] },
    rows: missRows(s), solveRows: [line('the result is', 'link', kase === 'unrelated' ? 'not pushed either way' : kase === 'related' ? `likely ${DIRWORD[rel.dir]}` : 'unknown: say “if”', kase === 'unrelated' ? 'not pushed' : kase === 'related' ? DIRWORD[rel.dir] : 'unknown')],
  }, opts);
};

const missingWay = (R: () => number, n: number): JudgeItem => {
  const c = pick(R, CONTEXTS), kase = R() < 0.72 ? 'related' : 'unknown';
  const rel = pick(R, c.missing.related);
  const s = missingStudy(R, c, kase === 'related' ? rel.reason : 'No one knows why.');
  const right = kase === 'related' ? rel.dir : 'unknown';
  const opts: Opt[] = (['high', 'low', 'unknown'] as const).map(d => ({
    t: d === 'high' ? 'Likely too high' : d === 'low' ? 'Likely too low' : 'Can’t tell which way',
    ok: d === right,
    say: d === right
      ? (kase === 'related' ? `Yes. ${rel.reason} Without them the yes share is likely ${S(DIRWORD[rel.dir])}.` : `Right: no reason is given, so it could go either way.`)
      : (kase === 'related' ? `Think about who is missing: ${rel.reason.charAt(0).toLowerCase() + rel.reason.slice(1)} That makes the result ${DIRWORD[rel.dir]}.` : `Nothing tells us who the missing are, so we can't tell which way.`),
  }));
  opts.push({ t: 'About right: the missing ones would answer like the others', ok: false, mc: 'mc.statistics.nonrespondents-answer-like-respondents', say: kase === 'related' ? `Not when the reason is linked to the answer: the missing ones are likely different.` : `We can't assume they answer like the others when nobody knows why they are missing.` });
  return choose(R, {
    id: `missingWay-${n}`, family: 'missingWay',
    prompt: `${s.text} For ${c.popOf}, is “${saidYes(c, s.y, s.r)}” likely too high, too low, or can’t you tell?`, board: `${s.y}/${s.r}`,
    solution: [kase === 'related' ? `Who is missing? ${rel.reason}` : 'Who is missing? Nobody knows.', kase === 'related' ? `So the yes share among those who answered is likely ${S(DIRWORD[rel.dir])}.` : `So the direction ${S('can’t be told')}; we could only say “if the missing ${c.yesLess}, it is too high”.`],
    pic: { kind: 'map', map: censusMap(c, { answered: s.r, yes: s.y }), show: ['pop', 'dots', 'sample', 'answers'], solve: [] },
    rows: missRows(s), solveRows: [line('the result is', 'link', kase === 'related' ? `likely ${DIRWORD[rel.dir]}` : 'can’t tell which way', kase === 'related' ? DIRWORD[rel.dir] : 'can’t tell')],
  }, opts);
};

// =============== sub-goal 4: selection bias ===============
const leftOut = (R: () => number, n: number): JudgeItem => {
  const c = pick(R, CONTEXTS), rule = pick(R, c.rules), k = nOf(R, rule, c.N);
  const how = fill(rule.how, { n: k });
  return choose(R, {
    id: `leftOut-${n}`, family: 'leftOut',
    prompt: `${studyText(c, how, R() < 0.3)} Who does this way of choosing <b class="b">leave out</b>?`, board: 'left out = ?',
    solution: [`The ${B(`${k} ${rule.group}`)} were asked.`, `That leaves out ${S(rule.leftOut)}${rule.dir === 'unknown' ? '' : `, and ${rule.why}`}.`],
    pic: { kind: 'map', map: partMap(c, rule, k), show: ['pop', 'dots', 'sample'], solve: ['leftOut'] },
    rows: [popLine(c), fromLine(`${k} ${rule.tag}`)], solveRows: [line('left out', 'pick', `${fmt(c.N - k)} not asked`)],
  }, [
    { t: cap(rule.leftOut), ok: true, say: `Yes: the way they chose leaves out ${rule.leftOut}.` },
    { t: `Nobody: with ${k} answers, everyone is covered`, ok: false, mc: 'mc.statistics.large-sample-cures-bias', say: `More answers collected the same way still leave out ${rule.leftOut}. Size doesn't fix who is missing.` },
    { t: `Nobody: the ${rule.group} are ${c.members} too, so they stand for all of them`, ok: false, mc: 'mc.statistics.generalizes-beyond-sampled-group', say: `They are ${c.members}, but not a fair mix of them: ${rule.leftOut} were never asked.` },
    { t: cap(rule.group), ok: false, say: `They are the ones who WERE asked. Left out: ${rule.leftOut}.` },
  ]);
};

const biasWay = (R: () => number, n: number): JudgeItem => {
  const c = pick(R, CONTEXTS), rule = pick(R, c.rules), k = nOf(R, rule, c.N);
  const how = fill(rule.how, { n: k });
  const opts: Opt[] = (['high', 'low', 'unknown'] as const).map(d => ({
    t: d === 'high' ? `Likely too high` : d === 'low' ? `Likely too low` : `Can’t tell which way, even though we know who is left out`,
    ok: d === rule.dir,
    say: d === rule.dir ? (d === 'unknown' ? `Right: ${rule.leftOut} are left out, but ${rule.why}.` : `Yes: ${rule.why}, so the result is likely ${DIRWORD[d]}.`)
      : (rule.dir === 'unknown' ? `We know who is left out (${rule.leftOut}), but ${rule.why}.` : `Think about who is left out: ${rule.leftOut}. ${cap(rule.why)}, so it is likely ${DIRWORD[rule.dir]}.`),
  }));
  opts.push({ t: `About right: asking more people this way would make it accurate`, ok: false, mc: 'mc.statistics.large-sample-cures-bias', say: `Asking more people the same way leaves out the same ${rule.leftOut}. A bigger biased sample is still biased.` });
  return choose(R, {
    id: `biasWay-${n}`, family: 'biasWay',
    prompt: `${studyText(c, how, false)} For ${c.popOf}, is the share who ${c.yes} in this sample likely too high, too low, or can’t you tell?`, board: 'too high / too low?',
    solution: [`Left out: ${S(rule.leftOut)}.`, rule.dir === 'unknown' ? `${cap(rule.why)}: the direction ${S('can’t be told')}.` : `${cap(rule.why)}: likely ${S(DIRWORD[rule.dir])}.`],
    pic: { kind: 'map', map: partMap(c, rule, k), show: ['pop', 'dots', 'sample'], solve: ['leftOut'] },
    rows: [popLine(c), fromLine(`${k} ${rule.tag}`)], solveRows: [line('the result is', 'link', rule.dir === 'unknown' ? 'can’t tell which way' : `likely ${DIRWORD[rule.dir]}`, rule.dir === 'unknown' ? 'can’t tell' : DIRWORD[rule.dir])],
  }, opts);
};

// =============== sub-goal 5: which group a conclusion may be stated for ===============
const scope = (R: () => number, n: number): JudgeItem => {
  const c = pick(R, CONTEXTS), kind = pick(R, ['part', 'part', 'census', 'different', 'undescribed'] as const);
  const rule = pick(R, c.rules), o = pick(R, c.others);
  const k = kind === 'census' ? c.N : kind === 'different' ? nOf(R, o, c.N) : nOf(R, rule, c.N);
  const y = int(R, Math.floor(k / 2) + 1, Math.max(Math.floor(k / 2) + 1, k - 1));
  const st = computeStudy({ N: c.N, n: k, match: kind === 'undescribed' ? 'part' : kind, yes: y });
  if (!guaranteed(st, { kind: 'most' })) throw new Error('scope: the observed claim must say "most" truthfully');
  const how = kind === 'census' ? c.census : kind === 'different' ? `${askOf(c)} ${k} ${o.group}` : kind === 'part' ? fill(rule.how, { n: k }) : `studied ${k} of the ${fmt(c.N)}; the report does not say how they were chosen`;
  const who = kind === 'different' ? `the ${k} ${o.group}` : kind === 'part' ? `the ${k} ${rule.group}` : `the ${k} studied`;
  const over: Opt = { t: `Most of ${c.popOf} ${c.yes}`, ok: false, mc: 'mc.statistics.generalizes-beyond-sampled-group', say: `The data only cover ${B(who)}. Saying it for all ${fmt(c.N)} goes beyond the data.` };
  let opts: Opt[];
  if (kind === 'census') opts = [
    { t: `${fmt(y)} of ${c.popOf} ${c.yes}`, ok: true, say: `Yes: everyone was asked, so this is simply true for ${A(c.popOf)}.` },
    { t: `Probably about ${fmt(y)} of the ${fmt(c.N)}, but a survey can never be sure`, ok: false, mc: 'mc.statistics.census-result-hedged', say: `This was a census: every one of the ${fmt(c.N)} answered. The count is the count; no hedging needed.` },
    { t: `Most ${c.wider} ${c.yes}`, ok: false, mc: 'mc.statistics.generalizes-beyond-sampled-group', say: `The census covers ${c.popOf} only, not ${c.wider}.` },
    { t: `Nothing: one survey can’t prove anything`, ok: false, mc: 'mc.statistics.no-sample-supports-population-claim', say: `Every one of the ${fmt(c.N)} answered, so the result is exact for that group.` },
  ];
  else opts = [
    { t: kind === 'different' ? `${fmt(y)} of the ${k} ${o.group} ${c.mark === 'person' ? 'said yes' : c.yes}; it says nothing sure about ${c.popOf}`
      : kind === 'part' ? `${fmt(y)} of the ${k} ${rule.group} ${c.yes}; it may not hold for the rest`
        : `${fmt(y)} of the ${k} studied ${c.yes}; to say more we need to know how they were chosen`,
    ok: true, say: kind === 'different' ? `Yes: the data are about the ${B(o.group)}, and ${o.why}.` : kind === 'part' ? `Yes: stated only for the ${B(`${k} ${rule.group}`)}, because ${rule.leftOut} were left out.` : `Yes: without knowing how they were chosen, the claim stays with the ${B(`${k} studied`)}.` },
    over,
    { t: kind === 'undescribed' ? `Nothing: only asking all ${fmt(c.N)} could tell us anything` : `Nothing at all, not even about the ${k} who answered`, ok: false, mc: 'mc.statistics.no-sample-supports-population-claim', say: `We can still state exactly what the ${B(k)} answered: ${y} of ${k}.` },
    { t: `Most ${c.wider} ${c.yes}`, ok: false, mc: 'mc.statistics.generalizes-beyond-sampled-group', say: `That jumps even further than ${c.popOf}. The data only cover ${B(who)}.` },
  ];
  const map: SampleMapParams = kind === 'census' ? censusMap(c, { yes: y }) : kind === 'different' ? otherMap(c, o, k, { yes: y }) : kind === 'part' ? partMap(c, rule, k, { yes: y }) : partMap(c, rule, k, { yes: y, sampleLabel: `${k} chosen somehow` });
  return choose(R, {
    id: `scope-${n}`, family: 'scope',
    prompt: `${studyText(c, how, false)} ${cap(saidYes(c, y, k, 'the '))}. Which conclusion can they state?`, board: `${y} of ${k}`,
    solution: [kind === 'census' ? `Everyone in the population answered: a census.` : `The data came from ${B(who)}, not from all of ${c.popOf}.`, kind === 'census' ? `So the result is stated for the whole group: ${S(`${y} of ${fmt(c.N)}`)}.` : `So the conclusion is stated for ${S(who)} only.`],
    pic: { kind: 'map', map, show: ['pop', 'dots', 'sample', 'answers'], solve: ['scope'], ...(kind !== 'census' ? {} : {}) },
    rows: [popLine(c), fromLine(kind === 'census' ? `all ${fmt(c.N)}` : kind === 'different' ? `${k} ${o.tag}` : kind === 'part' ? `${k} ${rule.tag}` : `${k} chosen somehow`), line('the answers', 'ink', `${fmt(y)} yes, ${fmt(k - y)} no`, `${fmt(y)} of ${fmt(k)} yes`)],
    solveRows: [line('the data support', 'link', kind === 'census' ? `${fmt(y)} of all ${fmt(c.N)}` : `${y} of those ${k} only`, kind === 'census' ? `${fmt(y)} of ${fmt(c.N)}` : `those ${k} only`)],
  }, opts);
};

const complete = (R: () => number, n: number): JudgeItem => {
  const c = pick(R, CONTEXTS.filter(x => x.N <= 300));
  const N = c.N;
  const m = Math.max(2, Math.round(N * (0.08 + 0.2 * R())));
  const r = N - m, y = int(R, Math.round(r * 0.3), Math.round(r * 0.85)), no = r - y;
  const st = computeStudy({ N, n: N, match: 'census', answered: r, yes: y });
  const kind = pick(R, ['most', 'most', 'atLeast', 'atLeast', 'half'] as const);
  let claim: Claim, text: string;
  if (kind === 'most') { claim = { kind: 'most' }; text = `More than half of ${c.popOf} ${c.yes}`; }
  else if (kind === 'half') { claim = { kind: 'halfOrFewer' }; text = `At most half of ${c.popOf} ${c.yes}`; }
  else { const kk = pick(R, [y, Math.min(y + Math.ceil(m / 2), y + m), y - Math.min(y, int(R, 1, 3))].filter(v => v > 0)); claim = { kind: 'atLeast', k: kk }; text = `At least ${fmt(kk)} of ${c.popOf} ${c.yes}`; }
  const sure = guaranteed(st, claim), can = possible(st, claim);
  const right = sure ? 'sure' : can ? 'depends' : 'false';
  // would the claim hold if the missing answered in the same proportion as the others? (the misconception's view)
  const propYes = y + Math.round((m * y) / r);
  const propHolds = claim.kind === 'most' ? 2 * propYes > N : claim.kind === 'halfOrFewer' ? 2 * propYes <= N : claim.kind === 'atLeast' ? propYes >= claim.k : false;
  const opts: Opt[] = [
    { t: 'Yes: it is true however the missing ones would have answered', ok: right === 'sure', say: right === 'sure' ? `Right: even if all ${m} missing said ${claim.kind === 'halfOrFewer' ? 'yes' : 'no'}, it still holds.` : `Not however: if the ${m} missing all said ${claim.kind === 'halfOrFewer' ? 'yes' : 'no'}, it ${right === 'false' ? 'is false (and it is false the other way too)' : 'fails'}.` },
    { t: 'No: it could be true or false, depending on the missing answers', ok: right === 'depends', say: right === 'depends' ? `Right: some ways the ${m} could answer make it true, others make it false.` : right === 'sure' ? `Check the worst case: it holds even then, so it is true either way.` : `Check the best case: it fails even then.` },
    { t: 'No: it is false however the missing ones would have answered', ok: right === 'false', say: right === 'false' ? `Right: even the best case for the claim fails.` : `Some completion makes it true, so it is not false for sure.` },
  ];
  opts.push(right === 'sure'
    ? { t: 'No: with answers missing, nothing can be said about the whole group', ok: false, mc: 'mc.statistics.census-result-hedged', say: `Something CAN be said: check every way the ${m} could answer; the claim holds in all of them.` }
    : propHolds ? { t: 'Yes: the missing ones would answer like the others', ok: false, mc: 'mc.statistics.nonrespondents-answer-like-respondents', say: `We don't know that. If the ${m} answered differently, the claim could fail.` }
      : { t: 'Yes: the answers we have already show it', ok: false, mc: 'mc.statistics.generalizes-beyond-sampled-group', say: `The answers we have cover ${r} of ${N}; the claim is about all ${N}, so check the ${m} missing too.` });
  const [lo, hi] = [y, y + m];
  return choose(R, {
    id: `complete-${n}`, family: 'complete',
    prompt: `${c.asker} ${c.missing.sent}. ${c.mark === 'person' ? `${fmt(y)} said yes, ${fmt(no)} said no, and ${fmt(m)} gave no answer` : `${fmt(y)} ${c.yes}, ${fmt(no)} did not, and ${fmt(m)} have no record`}. Can they state this for the whole group: “${text}”?`,
    board: text,
    solution: [`The ${m} missing could all be yes or all be no: between ${S(`${fmt(lo)} and ${fmt(hi)}`)} of ${fmt(N)} said yes.`, right === 'sure' ? 'The claim is true at both ends, so it is true however they answered: it may be stated.' : right === 'depends' ? 'True at one end, false at the other: it may not be stated.' : 'False at both ends: it is false.'],
    pic: { kind: 'map', map: censusMap(c, { answered: r, yes: y }), show: ['pop', 'dots', 'sample', 'answers'], solve: [], scopeAll: true, complete: true },
    rows: [popLine(c), line('the answers', 'ink', `${fmt(y)} yes, ${fmt(no)} no`, `${fmt(y)} yes`), line('no reply', 'second', `${fmt(m)}`)],
    solveRows: [line('yes could be', 'link', `${fmt(lo)} to ${fmt(hi)} of ${fmt(N)}`, `${fmt(lo)} to ${fmt(hi)}`)],
  }, opts);
};

// =============== sub-goal 6: revise an overreaching claim, audit the report ===============
interface SheetData { s: Sheet; rows: Rec[]; P: number; y: number; dupName: string | null; blanks: number; rawYes: number }
function makeSheet(R: () => number, s: Sheet, o: { dup: boolean; blanks: number; dupAns?: 'yes' | 'no'; P?: number; yesShare?: number }): SheetData {
  const P = o.P ?? int(R, 12, 18);
  const names = shuffle(R, NAMES.slice()).slice(0, P);
  const answered = P - o.blanks;
  const y = Math.max(1, Math.min(answered - 1, Math.round(answered * (o.yesShare ?? 0.35 + 0.4 * R()))));
  const ans: ('yes' | 'no' | '')[] = shuffle(R, [...Array(y).fill('yes'), ...Array(answered - y).fill('no'), ...Array(o.blanks).fill('')]);
  const rows: Rec[] = names.map((name, i) => ({ name, ans: ans[i]! }));
  let dupName: string | null = null;
  if (o.dup) {
    const cands = rows.filter(r => r.ans === (o.dupAns ?? 'yes'));
    const d = pick(R, cands.length ? cands : rows.filter(r => r.ans !== ''));
    dupName = d.name;
    rows.splice(int(R, rows.indexOf(d) + 2, rows.length), 0, { ...d });
  }
  const cnt = countTable(rows);
  if (cnt.people !== P || cnt.yes !== y) throw new Error('sheet: the count does not match');
  const rawYes = rows.filter(r => r.ans === 'yes').length;
  return { s, rows, P, y, dupName, blanks: o.blanks, rawYes };
}
const sheetMap = (d: SheetData): TablePic => ({ kind: 'table', table: { rows: d.rows, ask: d.s.ask }, show: ['grid', 'rows'], solve: ['dup', 'blank', 'yes'] });

const revise = (R: () => number, n: number): JudgeItem => {
  const s = pick(R, SHEETS);
  const kase = pick(R, ['dup', 'dupHolds', 'blank', 'two'] as const);
  const GENERIC: Opt = { t: 'It might be wrong, because real data are always messy', ok: false, mc: 'mc.reasoning-language.generic-model-limitations', say: 'That is true of every study and says nothing about THIS one. Name the specific problem and fix the count.' };
  const REJECT: Opt = { t: 'No conclusion: the sheet has a mistake, so none of it can be used', ok: false, mc: 'mc.statistics.one-flaw-rejects-all-data', say: 'One flaw doesn’t sink the data: fix it, recount, and see what still holds.' };
  let d: SheetData, claim: string, opts: Opt[], fixLine: string, rows: BoardLine[], solveRows: BoardLine[];
  if (kase === 'dup' || kase === 'dupHolds') {
    // dupHolds: "most" survives the fix; dup: the count claim must be corrected
    let tries = 0;
    do { d = makeSheet(R, s, { dup: true, blanks: 0, dupAns: 'yes', yesShare: kase === 'dupHolds' ? 0.62 + 0.25 * R() : undefined }); tries++; }
    while (kase === 'dupHolds' && !(2 * d.y > d.P) && tries < 50);
    if (kase === 'dupHolds' && !(2 * d.y > d.P)) throw new Error('revise: no sheet where most holds');
    const wrongCount = `${d.rawYes} of the ${d.P} members ${s.yes}`;
    claim = kase === 'dupHolds' ? `Most of ${s.group} ${s.yes}: ${d.rawYes} signed yes.` : `${d.rawYes} of the ${d.P} members of ${s.group} ${s.yes}.`;
    fixLine = `${d.dupName} signed twice: drop the copy. ${d.y} of ${d.P} said yes.`;
    opts = kase === 'dupHolds' ? [
      { t: `Still true: without ${d.dupName}’s second row, ${d.y} of ${d.P} is more than half`, ok: true, say: `Yes: the duplicate changes the count (${d.rawYes} to ${d.y}) but not the conclusion. Most still ${s.yes}.` },
      { t: `Not true anymore: a duplicate means the count can’t be trusted`, ok: false, mc: 'mc.statistics.one-flaw-rejects-all-data', say: `Fix it and recount: ${d.y} of ${d.P} is still more than half, so “most” still holds.` },
      GENERIC, REJECT,
    ] : [
      { t: `${d.y} of the ${d.P} members ${s.yes}: ${d.dupName} was counted twice`, ok: true, say: `Yes: one person, one row. ${d.y} of ${d.P}.` },
      { t: cap(wrongCount), ok: false, say: `${d.dupName} appears twice. Count each member once: ${d.y} of ${d.P}.` },
      GENERIC, REJECT,
    ];
  } else if (kase === 'blank') {
    d = makeSheet(R, s, { dup: false, blanks: int(R, 2, 4) });
    const st = computeStudy({ N: d.P, n: d.P, match: 'census', answered: d.P - d.blanks, yes: d.y });
    const most = guaranteed(st, { kind: 'most' }), mostPossible = possible(st, { kind: 'most' });
    claim = `Exactly ${d.y} of the ${d.P} members of ${s.group} ${s.yes}.`;
    fixLine = `${d.blanks} left it blank: between ${d.y} and ${d.y + d.blanks} of ${d.P}.`;
    const prop = Math.round((d.y * d.P) / (d.P - d.blanks));
    opts = [
      { t: `At least ${d.y} of the ${d.P} ${s.yes}; ${d.blanks} left it blank`, ok: true, say: `Yes: the ${d.blanks} blanks could be yes or no, so “at least ${d.y}” is what the sheet guarantees${most ? `, and that is already more than half` : ''}.` },
      { t: `Exactly ${d.y} of the ${d.P} ${s.yes}, as the report says`, ok: false, say: `The ${d.blanks} blanks are unknown, not “no”: the true count is somewhere from ${d.y} to ${d.y + d.blanks}.` },
      ...(prop !== d.y && prop <= d.y + d.blanks ? [{ t: `${prop} of the ${d.P} ${s.yes}: the blanks answer like the rest`, ok: false, mc: 'mc.statistics.nonrespondents-answer-like-respondents', say: `We can't know how the ${d.blanks} blanks would answer. All we can say: ${d.y} to ${d.y + d.blanks} of ${d.P}.` }] : []),
      GENERIC, REJECT,
    ];
    void mostPossible;
  } else {
    d = makeSheet(R, s, { dup: true, blanks: int(R, 1, 3), dupAns: 'yes' });
    claim = `Most of ${s.group} ${s.yes}: ${d.rawYes} signed yes.`;
    const st = computeStudy({ N: d.P, n: d.P, match: 'census', answered: d.P - d.blanks, yes: d.y });
    const sure = guaranteed(st, { kind: 'most' }), can = possible(st, { kind: 'most' });
    fixLine = `Drop ${d.dupName}’s copy, ${d.blanks} blank: ${d.y} to ${d.y + d.blanks} of ${d.P}.`;
    opts = [
      { t: sure ? `Still true: at least ${d.y} of ${d.P} after the fixes, more than half` : can ? `Not shown: ${d.y} to ${d.y + d.blanks} of ${d.P} yes, so it depends on the blanks` : `False: at most ${d.y + d.blanks} of ${d.P}, not more than half`, ok: true,
        say: `Yes: one row per member (${d.y} yes), and the ${d.blanks} blank${d.blanks > 1 ? 's' : ''} could go either way: ${d.y} to ${d.y + d.blanks} of ${d.P}.` },
      { t: sure ? `Not true anymore: the sheet had two problems` : `Still true: ${d.rawYes} signed yes`, ok: false, mc: sure ? 'mc.statistics.one-flaw-rejects-all-data' : undefined,
        say: `Fix both and recount: ${d.dupName} counts once (${d.y} yes) and the blanks give ${d.y} to ${d.y + d.blanks} of ${d.P}.` },
      GENERIC, REJECT,
    ];
  }
  return choose(R, {
    id: `revise-${n}`, family: 'revise',
    prompt: `Every member of ${s.group} (${d.P} people) got the sign-up sheet: “${s.question}” The report says: “${claim}” Which revised conclusion does the sheet support?`,
    board: claim,
    solution: [`Audit the sheet: ${d.dupName ? `${B(d.dupName)} appears twice (one person, one row)` : 'no duplicates'}${d.blanks ? `; ${B(d.blanks)} blank${d.blanks > 1 ? 's' : ''} (could be yes or no)` : ''}.`, `${fixLine}`, 'State only what still holds, with the reason.'],
    pic: sheetMap(d),
    rows: [line('the group', 'first', `${d.P} members`), line('the report says', 'ink', `${d.rawYes} yes`)],
    solveRows: [line('after the audit', 'link', d.blanks ? `${d.y} to ${d.y + d.blanks} of ${d.P}` : `${d.y} of ${d.P}`, d.blanks ? `${d.y} to ${d.y + d.blanks}` : `${d.y}`)],
  }, opts);
};

const AUDIT = {
  records: 'Repeated or blank rows on the sheet',
  collection: 'How the group was chosen',
  scope: 'The group the claim is stated for',
  measure: 'What was measured',
} as const;
const AUDIT_SHORT = { records: 'repeated rows', collection: 'who was chosen', scope: 'who the claim covers', measure: 'what was measured' } as const;
const audit = (R: () => number, n: number): JudgeItem => {
  const s = pick(R, SHEETS);
  const kase = pick(R, ['dup', 'collection', 'scope', 'measure'] as const);
  const d = makeSheet(R, s, { dup: kase === 'dup', blanks: 0, dupAns: pick(R, ['yes', 'no'] as const), yesShare: 0.6 + 0.25 * R() });
  const right = kase === 'dup' ? 'records' : kase;
  let text: string, claim: string;
  if (kase === 'dup') { text = `Every member of ${s.group} (${d.P} people) answered: “${s.question}”`; claim = `${d.rawYes} of the ${d.P} members ${s.yes}.`; }
  else if (kase === 'collection') { text = `${s.group.charAt(0).toUpperCase() + s.group.slice(1)} has ${d.P + int(R, 6, 12)} members. ${s.partial} The sheet asked: “${s.question}”`; claim = `Most of ${s.group} ${s.yes}.`; }
  else if (kase === 'scope') { text = `Every member of ${s.group} (${d.P} people) answered: “${s.question}”`; claim = `Most ${s.wider} ${s.yes}.`; }
  else { text = `Every member of ${s.group} (${d.P} people) answered: “${s.measured.question}”`; claim = `Most members of ${s.group} ${s.measured.claim}.`; }
  const say: Record<keyof typeof AUDIT, string> = {
    records: d.dupName ? `${d.dupName} signed twice; counted once, ${d.y} of ${d.P} said yes.` : 'Every member appears once and every row has an answer.',
    collection: kase === 'collection' ? `Only some members signed (${s.partial.replace(/^Only /, 'only ').replace(/\.$/, '')}), so the claim about the whole club overreaches.` : `Every member of ${s.group} was asked: the collection is fine.`,
    scope: kase === 'scope' ? `The sheet covers ${s.group} only; the claim jumps to ${s.wider}.` : `The claim is about ${s.group}, the group that was asked.`,
    measure: kase === 'measure' ? `The sheet asked “${s.measured.question}”, but the claim says they ${s.measured.claim}. One day is not every day.` : `The claim talks about the same thing the sheet asked.`,
  };
  const opts: Opt[] = (Object.keys(AUDIT) as (keyof typeof AUDIT)[]).map(k => ({ t: AUDIT[k], ok: k === right, say: say[k] }));
  opts.push({ t: 'Nothing in particular: data are never perfect', ok: false, mc: 'mc.reasoning-language.generic-model-limitations', say: `There IS a specific problem: ${say[right]}` });
  return choose(R, {
    id: `audit-${n}`, family: 'audit',
    prompt: `${text} The report says: “${claim}” Which check finds the problem?`, board: claim,
    solution: ['Run the checklist: what was measured, how the group was chosen, repeated or blank rows, the group the claim is stated for.', `The one that fails: ${S(AUDIT[right])}. ${say[right]}`],
    pic: { ...sheetMap(d), solve: kase === 'dup' ? ['dup', 'yes'] : [] },
    rows: [line('the claim is about', 'ink', ...(kase === 'scope' ? [s.wider, 'a wider group'] : kase === 'dup' ? [`${d.rawYes} of ${d.P} members`] : kase === 'measure' ? ['every day, always', 'always'] : ['the whole club', 'everyone']))],
    solveRows: [line('the check that fails', 'link', AUDIT_SHORT[right])],
  }, opts);
};

// ---------- registry ----------
type Gen = (R: () => number, n: number, sg?: string) => JudgeItem;
export const GENERATORS: Record<FamilyId, Gen> = { namePop, popOrSample, matchKind, whoGave, missingWhy, missingWay, leftOut, biasWay, scope, complete, revise, audit };
void PEOPLE; void A; void B;
