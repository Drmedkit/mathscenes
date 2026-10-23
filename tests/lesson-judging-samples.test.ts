// judging samples: the plan covers every sub-goal of the topic JSON in order; every family x every sub-goal it serves
// x 300 seeds gives a valid item (the answer passes, choices unique with exactly one right, misconception ids exist,
// the main misconceptions of each family are offered and classified, the picture lays out, the board fits); the
// model's maths (census / part / different, completion bounds, guaranteed claims, duplicate-free counts) holds.
import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { rng } from '../src/lesson/runtime/item';
import { FAMILY_NAMES, GENERATORS, type JudgeItem } from '../src/lesson/topics/judging-samples/items';
import { PLAN } from '../src/lesson/topics/judging-samples/plan';
import { bounds, computeStudy, countTable, guaranteed, possible, scopeFor } from '../src/lesson/topics/judging-samples/sampling';
import { SampleMap } from '../src/lesson/topics/judging-samples/SampleMap';
import { RecordTable } from '../src/lesson/topics/judging-samples/RecordTable';
import { boardRow } from '../src/lesson/topics/judging-samples/board';
import { frame } from '../src/blocks/block';
import { dusk } from '../src/lesson/dusk';
import { CONTEXTS } from '../src/lesson/topics/judging-samples/contexts';

// ---- quality layer (docs/lessons/QUALITY_LAYER.md): worked steps, check-in adapter, regressions ----
import { rng as qlRng, plain as qlPlain, type Item as QlItem } from '../src/lesson/runtime/item';
import { GENERATORS as qlGens } from '../src/lesson/topics/judging-samples/items';
import { PLAN as qlPlan } from '../src/lesson/topics/judging-samples/plan';
import { explain as qlExplain } from '../src/lesson/topics/judging-samples/explain';
import { PLACEMENT as qlPlacement } from '../src/lesson/topics/judging-samples/placement';

// words.ts measures with a canvas in the browser; in node it falls back to an estimate (0.52 em per character)
if (typeof document === 'undefined') (globalThis as unknown as { document: unknown }).document = { createElement: () => ({ getContext: () => null }) };

const TOPIC = 'C:/Users/stelt/Claude code foler/math-curriculum-essentials/topics/primary.data.judge-sample-representativeness-and-limit-conclusions.json';
const MC = 'C:/Users/stelt/Claude code foler/math-curriculum-essentials/misconceptions.json';
const mcIds = existsSync(MC) ? new Set((JSON.parse(readFileSync(MC, 'utf8')) as { misconceptions: { id: string }[] }).misconceptions.map(m => m.id)) : null;
const MF = frame(60, 70, 1110, 940);
const BOARD_X = 1294, BOARD_W = 512;

const pairs = PLAN.flatMap(p => p.families.map(f => [f, p.id] as const));
const make = (f: string, sg: string, s: number): JudgeItem => GENERATORS[f as keyof typeof GENERATORS](rng(s * 7919 + f.length), s, sg);

/** the misconceptions each family must offer as a wrong choice in (nearly) every item */
const MAIN: Record<string, string[]> = {
  namePop: ['mc.statistics.confuses-sample-and-population-terms', 'mc.statistics.population-description-omits-scope'],
  whoGave: ['mc.statistics.target-population-assumed-measured'],
  leftOut: ['mc.statistics.large-sample-cures-bias', 'mc.statistics.generalizes-beyond-sampled-group'],
  biasWay: ['mc.statistics.large-sample-cures-bias'],
  missingWay: ['mc.statistics.nonrespondents-answer-like-respondents'],
  scope: ['mc.statistics.generalizes-beyond-sampled-group'],
  revise: ['mc.reasoning-language.generic-model-limitations', 'mc.statistics.one-flaw-rejects-all-data'],
  audit: ['mc.reasoning-language.generic-model-limitations'],
};
/** misconceptions that must show up somewhere across a family's 300 items */
const SOME: Record<string, string[]> = {
  popOrSample: ['mc.statistics.confuses-sample-and-population-terms', 'mc.statistics.target-population-assumed-measured'],
  matchKind: ['mc.statistics.large-sample-cures-bias', 'mc.statistics.target-population-assumed-measured'],
  missingWhy: ['mc.statistics.nonrespondents-answer-like-respondents', 'mc.statistics.missingness-mechanism-does-not-matter'],
  scope: ['mc.statistics.census-result-hedged', 'mc.statistics.no-sample-supports-population-claim'],
  complete: ['mc.statistics.census-result-hedged', 'mc.statistics.nonrespondents-answer-like-respondents'],
  revise: ['mc.statistics.nonrespondents-answer-like-respondents'],
};

describe('plan', () => {
  it('covers every sub-goal of the topic JSON, in order, each with a family that exists', () => {
    if (existsSync(TOPIC)) {
      const t = JSON.parse(readFileSync(TOPIC, 'utf8')) as { subgoals: { id: string; order: number }[] };
      expect(PLAN.map(p => p.id)).toEqual([...t.subgoals].sort((a, b) => a.order - b.order).map(s => s.id));
    }
    for (const p of PLAN) {
      expect(p.families.length).toBeGreaterThan(0);
      for (const f of p.families) { expect(GENERATORS[f as keyof typeof GENERATORS], f).toBeTypeOf('function'); expect(FAMILY_NAMES[f], f).toBeTruthy(); }
    }
    expect(new Set(PLAN.flatMap(p => p.families))).toEqual(new Set(Object.keys(GENERATORS)));
  });
});

describe('item families', () => {
  for (const [f, sg] of pairs) {
    it(`${f} for ${sg}: 300 seeds, valid, classified, drawable`, () => {
      const seen = new Set<string>(), mcSeen = new Set<string>();
      let rightIdx = [0, 0, 0, 0, 0];
      for (let s = 1; s <= 300; s++) {
        const it = make(f, sg, s);
        expect(it.family).toBe(f);
        expect(it.input).toBe('choice');
        expect(it.check(it.answer).ok, it.prompt).toBe(true);
        expect(it.solution.length).toBeGreaterThan(0);
        for (const t of [it.prompt, it.board, ...it.solution, ...(it.choices ?? [])]) expect(t).not.toMatch(/undefined|NaN|\{[a-z]+\}/);
        const choices = it.choices!;
        expect(new Set(choices).size, choices.join(' | ')).toBe(choices.length);
        const verdicts = choices.map((_, i) => it.check({ kind: 'choice', i }));
        expect(verdicts.filter(v => v.ok).length).toBe(1);
        for (const v of verdicts) { expect(v.say.length).toBeGreaterThan(5); if (v.mc) { mcSeen.add(v.mc); if (mcIds) expect(mcIds.has(v.mc), v.mc).toBe(true); } }
        for (const mc of MAIN[f] ?? []) expect(verdicts.some(v => !v.ok && v.mc === mc), `${f} offers ${mc}: ${it.prompt}`).toBe(true);
        if (it.answer.kind === 'choice') rightIdx[it.answer.i]!++;
        // the picture lays out in the model frame
        if (it.pic.kind === 'map') expect(() => SampleMap(it.pic.kind === 'map' ? it.pic.map : (null as never), MF, dusk), JSON.stringify(it.pic.map)).not.toThrow();
        else expect(() => RecordTable(it.pic.kind === 'table' ? it.pic.table : (null as never), MF, dusk)).not.toThrow();
        // every board line has a version that fits the board
        for (const L of [...it.rows, ...it.solveRows]) {
          const ok = L.alts.some(runs => { try { boardRow('k', 300, L.label, runs, BOARD_X, BOARD_W); return true; } catch { return false; } });
          expect(ok, `${L.label}: ${L.alts.map(a => a.map(r => r.t).join('')).join(' / ')}`).toBe(true);
        }
        seen.add(it.prompt + choices.join());
      }
      expect(seen.size, 'distinct items').toBeGreaterThan(40);
      for (const mc of SOME[f] ?? []) expect(mcSeen.has(mc), `${f} offers ${mc} somewhere`).toBe(true);
      // the right answer is not always in the same place
      expect(Math.max(...rightIdx)).toBeLessThan(300 * 0.6);
      rightIdx = [];
    });
  }
});

describe('the model maths', () => {
  it('classifies census / part / different and refuses nonsense', () => {
    expect(computeStudy({ N: 28, n: 28, match: 'census' }).notAsked).toBe(0);
    expect(computeStudy({ N: 240, n: 60, match: 'part' }).notAsked).toBe(180);
    expect(computeStudy({ N: 240, n: 30, match: 'different' }).notAsked).toBe(240);
    expect(() => computeStudy({ N: 240, n: 60, match: 'census' })).toThrow(/census/);
    expect(() => computeStudy({ N: 240, n: 240, match: 'part' })).toThrow(/smaller/);
    expect(() => computeStudy({ N: 200, n: 200, match: 'census', answered: 210 })).toThrow();
    expect(() => computeStudy({ N: 200, n: 200, match: 'census', answered: 140, yes: 150 })).toThrow();
  });
  it('bounds and guaranteed claims match a brute-force check over every completion', () => {
    // the Your-turn case: 200 students, 140 answered, 110 yes, 60 missing
    const s = computeStudy({ N: 200, n: 200, match: 'census', answered: 140, yes: 110 });
    expect(bounds(s)).toEqual([110, 170]);
    expect(guaranteed(s, { kind: 'most' })).toBe(true);
    expect(guaranteed(s, { kind: 'atLeast', k: 110 })).toBe(true);
    expect(guaranteed(s, { kind: 'atLeast', k: 111 })).toBe(false);
    expect(possible(s, { kind: 'atLeast', k: 170 })).toBe(true);
    expect(possible(s, { kind: 'halfOrFewer' })).toBe(false);
    for (let N = 4; N <= 30; N += 3) for (let m = 0; m <= 6; m++) for (let y = 0; y <= N - m; y++) {
      const st = computeStudy({ N, n: N, match: 'census', answered: N - m, yes: y });
      const all: boolean[] = [];
      for (let extra = 0; extra <= m; extra++) all.push(2 * (y + extra) > N);
      expect(guaranteed(st, { kind: 'most' })).toBe(all.every(Boolean));
      expect(possible(st, { kind: 'most' })).toBe(all.some(Boolean));
    }
  });
  it('scopes conclusions to the group the data support', () => {
    expect(scopeFor(computeStudy({ N: 28, n: 28, match: 'census' }), 'all')).toBe('population');
    expect(scopeFor(computeStudy({ N: 28, n: 28, match: 'census', answered: 25 }), 'all')).toBe('answered');
    expect(scopeFor(computeStudy({ N: 240, n: 60, match: 'part' }), 'selective')).toBe('studied');
    expect(scopeFor(computeStudy({ N: 240, n: 60, match: 'part' }), 'undescribed')).toBe('studied');
    expect(scopeFor(computeStudy({ N: 240, n: 30, match: 'different' }), 'outside')).toBe('studied');
  });
  it('counts a record sheet once per person', () => {
    const c = countTable([{ name: 'Ava', ans: 'yes' }, { name: 'Ben', ans: 'no' }, { name: 'Ava', ans: 'yes' }, { name: 'Cy', ans: '' }]);
    expect(c).toMatchObject({ rows: 4, people: 3, yes: 1, no: 1, blank: 1, dupes: [2] });
    expect(() => countTable([{ name: 'Ava', ans: 'yes' }, { name: 'Ava', ans: 'no' }])).toThrow(/twice/);
  });
  it('the lesson scenes lay out (worked example, your turn, prove it)', () => {
    const ex = SampleMap({ popLabel: '240 seventh graders', N: 240, match: 'part', sampleLabel: '60 at the gym', n: 60, yes: 51, leftLabel: '180 not asked' }, MF, dusk);
    expect(ex.exact).toBe(true); expect(ex.answersShown).toBe(true);
    expect(ex.where.ring.x0).toBeGreaterThan(ex.where.left!.x1);          // the asked block sits nearest the board
    const turn = SampleMap({ popLabel: '200 students', N: 200, match: 'census', sampleLabel: 'all 200 asked', n: 200, answered: 140, yes: 110 }, MF, dusk);
    expect(turn.study.missing).toBe(60);
    const prove = SampleMap({ popLabel: '600 students', N: 600, match: 'part', sampleLabel: '200 in the lunch line', n: 200, leftLabel: '400 not asked' }, MF, dusk);
    expect(prove.exact).toBe(false);
    for (const c of CONTEXTS) expect(c.popShort.length).toBeLessThanOrEqual(22);
  });
});

describe('quality layer', () => {
  const gens = qlGens as unknown as Record<string, (R: () => number, n: number, sg?: string) => QlItem>;
  it('the steps card ends on an answer the lesson accepts, in every pair (200 seeds)', () => {
    for (const p of qlPlan) for (const f of p.families) for (let s = 1; s <= 200; s++) {
      const it0 = gens[f]!(qlRng(s * 37 + 5), s, p.id);
      const ex = qlExplain(it0);
      expect(ex, `${p.id}/${f}: ${it0.prompt}`).not.toBeNull();
      expect(it0.check(ex!.result).ok, `${p.id}/${f}: ${JSON.stringify(ex!.result)} for ${it0.prompt}`).toBe(true);
    }
  });
  it('the check-in picks are pairs of the plan and their answers pass', () => {
    for (const pk of qlPlacement.picks) {
      expect(qlPlan.find(p => p.id === pk.subgoal)?.families as string[] | undefined).toContain(pk.family);
      for (let s = 1; s <= 50; s++) { const it0 = gens[pk.family]!(qlRng(s), s, pk.subgoal); expect(it0.check(it0.answer).ok).toBe(true); }
    }
  });
  it('no "1 …s" in questions, choices or steps', () => {
    for (const p of qlPlan) for (const f of p.families) for (let s = 1; s <= 200; s++) {
      const it0 = gens[f]!(qlRng(s * 7 + 3), s, p.id);
      const text = qlPlain([it0.prompt, ...(it0.choices ?? []), ...it0.solution].join(' | '));
      expect(text, `${p.id}/${f}`).not.toMatch(/\b\d+ the /);
    }
  });
});

describe('quality layer: oracle findings (phase 2)', () => {
  const gens = qlGens as unknown as Record<string, (R: () => number, n: number, sg?: string) => QlItem>;
  it('school days and apples are checked, not asked', () => {
    for (const p of qlPlan) for (const f of p.families) for (let s = 1; s <= 200; s++) {
      const it0 = gens[f]!(qlRng(s), s, p.id);
      expect(qlPlain([it0.prompt, ...(it0.choices ?? [])].join(' '))).not.toMatch(/asked (the )?\d+ (school days|apples|days)/);
    }
  });
});
