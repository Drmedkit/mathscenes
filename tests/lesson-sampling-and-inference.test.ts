// sampling-and-inference: every family x every sub-goal it serves x 300 seeds gives a valid item (the answer passes,
// choices unique with exactly one right, mc ids exist, the picture builds), the main misconceptions are classified,
// the plan covers every sub-goal of the topic JSON in order, the sampling maths is exact (seeded draws without
// replacement, summaries, scaling rounded once), the story's stated numbers hold, and the voiced script matches
// lines.json.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { rng, type Item, type Response } from '../src/lesson/runtime/item';
import { frame } from '../src/blocks/block';
import { dusk } from '../src/lesson/dusk';
import { GENS, FAMILY_NAMES, picOf } from '../src/lesson/topics/sampling-and-inference/items';
import { PLAN } from '../src/lesson/topics/sampling-and-inference/plan';
import { LINES, SCRIPT } from '../src/lesson/topics/sampling-and-inference/script';
import { Sampler, type SamplerParams } from '../src/lesson/topics/sampling-and-inference/Sampler';
import { ScaleBars } from '../src/lesson/topics/sampling-and-inference/ScaleBars';
import { Nested } from '../src/lesson/topics/sampling-and-inference/Nested';
import * as St from '../src/lesson/topics/sampling-and-inference/story';
import {
  drawIdx, iqr, mad, mean, median, mostWithin, pctCount, population, quartiles, repeatMeans, roundedFactorFirst, scaleExact, scaleWhole, sum,
} from '../src/lesson/topics/sampling-and-inference/samplingMaths';

// words.ts measures text with a canvas; in node it falls back to an estimate
if (typeof document === 'undefined') (globalThis as unknown as { document: unknown }).document = { createElement: () => ({ getContext: () => null }) };

const TOPIC = 'C:/Users/stelt/Claude code foler/math-curriculum-essentials/topics/secondary-t5-25-sampling-and-comparative-inferences.json';
const MC = 'C:/Users/stelt/Claude code foler/math-curriculum-essentials/misconceptions.json';
const mcIds = fs.existsSync(MC) ? new Set((JSON.parse(fs.readFileSync(MC, 'utf8')) as { misconceptions: { id: string }[] }).misconceptions.map(m => m.id)) : null;
const MF = frame(60, 70, 880, 940);

const pairs = PLAN.flatMap(p => p.families.map(f => [f, p.id] as const));
const make = (f: string, sg: string, s: number): Item => GENS[f]!(rng(s * 7919 + f.length), s, sg);
const num = (v: number): Response => ({ kind: 'num', v });
const mcsOffered = (f: string, sg: string, seeds = 120) => {
  const out = new Set<string>();
  for (let s = 1; s <= seeds; s++) { const it = make(f, sg, s); (it.choices ?? []).forEach((_, i) => { const v = it.check({ kind: 'choice', i }); if (v.mc) out.add(v.mc); }); }
  return out;
};

describe('plan', () => {
  it('covers every sub-goal of the topic JSON, in order, each with a family that exists', () => {
    if (fs.existsSync(TOPIC)) {
      const t = JSON.parse(fs.readFileSync(TOPIC, 'utf8')) as { subgoals: { id: string; order: number }[] };
      expect(PLAN.map(p => p.id)).toEqual([...t.subgoals].sort((a, b) => a.order - b.order).map(s => s.id));
    }
    for (const p of PLAN) {
      expect(p.families.length).toBeGreaterThan(0);
      for (const f of p.families) { expect(GENS[f], f).toBeTypeOf('function'); expect(FAMILY_NAMES[f], f).toBeTruthy(); }
    }
    expect(new Set(PLAN.flatMap(p => p.families))).toEqual(new Set(Object.keys(GENS)));
  });
});

describe('item families', () => {
  for (const [f, sg] of pairs) {
    it(`${f} for ${sg}: 300 seeds, the answer passes, choices unique with one right, mc ids exist, the picture builds`, () => {
      const seen = new Set<string>();
      for (let s = 1; s <= 300; s++) {
        const it = make(f, sg, s);
        expect(it.family).toBe(f);
        expect(it.check(it.answer).ok, `${it.prompt} ${JSON.stringify(it.answer)}`).toBe(true);
        expect(it.solution.length).toBeGreaterThan(0);
        for (const t of [it.prompt, it.board, ...it.solution, ...(it.choices ?? [])]) expect(t, it.prompt).not.toMatch(/undefined|NaN|Infinity|\[object/);
        if (it.choices) {
          expect(new Set(it.choices).size, it.choices.join(' | ')).toBe(it.choices.length);
          const verdicts = it.choices.map((_, i) => it.check({ kind: 'choice', i }));
          expect(verdicts.filter(v => v.ok).length, it.prompt).toBe(1);
          if (mcIds) for (const v of verdicts) if (v.mc) expect(mcIds.has(v.mc), v.mc).toBe(true);
        } else if (mcIds && it.answer.kind === 'num') {
          const a = it.answer.v;
          for (const r of [num(a + 1), num(a * 10), num(a / 10), num(0), num(a - 1)]) { const v = it.check(r); expect(v.ok).toBe(false); if (v.mc) expect(mcIds.has(v.mc), v.mc).toBe(true); }
        }
        const P = picOf(it);
        if (P) {
          if (P.kind === 'plots') expect(() => Sampler(P.p, MF, dusk), `${f} ${s}`).not.toThrow();
          else if (P.kind === 'bars') expect(() => ScaleBars(P.p, MF, dusk), `${f} ${s} ${JSON.stringify(P.p)}`).not.toThrow();
          else expect(() => Nested(P.p, MF, dusk), `${f} ${s} ${JSON.stringify(P.p)}`).not.toThrow();
          for (const w of P.work) expect(w).not.toMatch(/undefined|NaN/);
        }
        seen.add(it.prompt + it.board + (it.choices ?? []).join());
      }
      expect(seen.size, f).toBeGreaterThan(['absent', 'biggerSample', 'plan'].includes(f) ? 25 : 40);
    });
  }
});

describe('misconceptions are offered and diagnosed', () => {
  const offers: Record<string, string[]> = {
    popSample: ['mc.statistics.confuses-sample-and-population-terms', 'mc.statistics.population-means-everyone-everywhere'],
    spreadCompare: ['mc.statistics.smaller-sample-guarantees-smaller-spread', 'mc.statistics.sample-should-mirror-population'],
    statParam: ['mc.statistics.sample-statistic-as-exact-parameter'],
    isRandom: ['mc.statistics.collects-from-whoever-is-convenient', 'mc.statistics.hand-picked-typical-sample-as-random', 'mc.statistics.large-sample-cures-bias'],
    randomDiffers: ['mc.statistics.sample-should-mirror-population'],
    whatDot: ['mc.statistics.sampling-dot-as-individual'],
    twoSamples: ['mc.statistics.sample-should-mirror-population', 'mc.statistics.sample-statistic-as-exact-parameter'],
    whichSize: ['mc.statistics.individual-vs-statistic-spread'],
    biggerSample: ['mc.statistics.individual-vs-statistic-spread'],
    drawNumbers: ['mc.probability.reuses-object-without-replacement'],
    absent: ['mc.statistics.random-protocol-deviations-ok'],
    report: ['mc.statistics.mean-as-every-individual-value', 'mc.statistics.sample-statistic-as-exact-parameter'],
    typical: ['mc.statistics.individual-vs-statistic-spread'],
    plan: ['mc.statistics.recompute-same-sample-as-resampling'],
    reportCount: ['mc.ratio-rate.additive-keep-difference', 'mc.statistics.sample-statistic-as-exact-parameter'],
    pickMeasure: ['mc.statistics.center-gap-divided-by-unrequested-spread'],
    compare: ['mc.statistics.overlap-makes-comparison-impossible', 'mc.statistics.spread-ratio-as-automatic-verdict', 'mc.statistics.center-difference-ignores-spread'],
    biasWay: ['mc.statistics.large-sample-cures-bias', 'mc.statistics.bias-means-dishonesty'],
    biasOrChance: ['mc.statistics.large-sample-cures-bias', 'mc.statistics.sample-should-mirror-population'],
    whichBiased: ['mc.statistics.large-sample-cures-bias'],
    scope: ['mc.statistics.generalizes-beyond-sampled-group', 'mc.statistics.mean-as-every-individual-value'],
  };
  for (const [f, want] of Object.entries(offers)) {
    it(`${f} offers ${want.length} catalogued misconception(s)`, () => {
      const sg = PLAN.find(p => p.families.includes(f))!.id;
      const got = mcsOffered(f, sg);
      for (const w of want) expect(got.has(w), `${f}: ${w}`).toBe(true);
    });
  }
  const nums = (s: string) => [...s.replace(/<[^>]+>/g, '').matchAll(/(\d[\d,]*(?:\.\d+)?)/g)].map(m => Number(m[1]!.replace(/,/g, '')));
  it('scale a count: adding the difference instead of multiplying', () => {
    for (let s = 1; s <= 300; s++) {
      const it = make('scaleCount', 'estimate-count-from-proportion', s);
      const [m, N, a] = nums(it.prompt) as [number, number, number];
      expect(scaleWhole(a, m, N).est).toBe((it.answer as { v: number }).v);
      expect(it.check(num(N - m + a)).mc).toBe('mc.ratio-rate.additive-keep-difference');
    }
  });
  it('non-whole factor: rounding the factor first, adding, and rounding once', () => {
    let early = 0;
    for (let s = 1; s <= 300; s++) {
      const it = make('scaleNonWhole', 'estimate-count-nonwhole-factor', s);
      const [m, N, a] = nums(it.prompt) as [number, number, number];
      const S = scaleExact(a, m, N);
      expect((it.answer as { v: number }).v).toBe(S.rounded);
      const e = roundedFactorFirst(a, m, N);
      if (e !== S.rounded) { early++; expect(it.check(num(e)).mc).toBe('mc.decimals.intermediate-precision-always-invalid'); }
      expect(it.check(num(N - m + a)).mc).toBe('mc.ratio-rate.additive-keep-difference');
    }
    expect(early).toBeGreaterThan(200);   // most items show that rounding early changes the answer
  });
  it('complement: subtracting the unscaled sample count; the percent applied to n', () => {
    let nc = 0;
    for (let s = 1; s <= 300; s++) {
      const it = make('complementCount', 'predict-population-percent', s);
      const v = (it.answer as { v: number }).v;
      if (/voted on/.test(it.prompt)) {
        const [m, N, p1, p2] = nums(it.prompt) as [number, number, number, number];
        expect(v).toBe(pctCount(100 - p1 - p2, N));
        expect(it.check(num(N - p1 - p2)).mc).toBe('mc.statistics.complement-subtracts-unscaled-sample-count');
        if (pctCount(100 - p1 - p2, m) !== v) expect(it.check(num(pctCount(100 - p1 - p2, m))).mc).toBe('mc.statistics.sample-percent-applied-to-sample-size');
      } else {
        nc++;
        const [m, N, a] = nums(it.prompt) as [number, number, number];
        expect(v).toBe(pctCount(100 - (100 * a) / m, N));
        expect(it.check(num(N - a)).mc).toBe('mc.statistics.complement-subtracts-unscaled-sample-count');
        const pn = pctCount(100 - (100 * a) / m, m);
        if (pn !== v && pn !== N - a) expect(it.check(num(pn)).mc).toBe('mc.statistics.sample-percent-applied-to-sample-size');
      }
    }
    expect(nc).toBeGreaterThan(100);
  });
  it('complement percent: 100 minus the count', () => {
    for (let s = 1; s <= 300; s++) {
      const it = make('complementPct', 'predict-population-percent', s);
      const m = /(\d+) of (\d+)<\/b>/.exec(it.prompt);
      if (!m) continue;
      const a = Number(m[1]), n = Number(m[2]);
      if (100 - a !== 100 - (100 * a) / n) expect(it.check(num(100 - a)).mc).toBe('mc.statistics.complement-subtracts-unscaled-sample-count');
    }
  });
  it('MAD units: the raw gap, and dividing by the IQR', () => {
    for (let s = 1; s <= 300; s++) {
      const it = make('madUnits', 'center-difference-in-mad-units', s);
      const P = picOf(it)!;
      if (P.kind !== 'plots') throw new Error('madUnits draws plots');
      const [A, B] = P.p.rows as [SamplerParams['rows'][number], SamplerParams['rows'][number]];
      const diff = mean(A.values) - mean(B.values), M = mad(A.values);
      expect(Math.abs(mad(B.values) - M)).toBeLessThan(1e-9);
      expect((it.answer as { v: number }).v).toBeCloseTo(diff / M, 9);
      expect(it.check(num(diff)).mc).toBe('mc.statistics.center-difference-ignores-spread');
      expect(it.check(num(diff / iqr(A.values))).mc).toBe('mc.statistics.center-gap-divided-by-unrequested-spread');
    }
  });
  it('estimate: the answer is the sample statistic', () => {
    for (let s = 1; s <= 300; s++) {
      const it = make('estimate', 'estimate-from-sample', s);
      const P = picOf(it)!;
      if (P.kind !== 'plots') throw new Error('estimate draws plots');
      const xs = P.p.rows[0]!.values;
      expect((it.answer as { v: number }).v).toBe(/<b>mean<\/b>/.test(it.prompt) ? mean(xs) : median(xs));
    }
  });
});

describe('the sampling maths', () => {
  it('summaries', () => {
    expect(mean([2, 4, 9])).toBe(5);
    expect(median([5, 1, 3])).toBe(3); expect(median([4, 1, 3, 10])).toBe(3.5);
    expect(quartiles([1, 2, 3, 4, 5, 6, 7, 8])).toEqual([2.5, 6.5]);
    expect(quartiles([1, 2, 3, 4, 5, 6, 7, 8, 9])).toEqual([2.5, 7.5]);
    expect(iqr([1, 2, 3, 4, 5, 6, 7, 8])).toBe(4);
    expect(mad([2, 4, 6, 8])).toBe(2);
    expect(mostWithin([40, 41, 44, 50], 42, 0.75)).toBe(2);
  });
  it('a random sample has no one twice, and is seeded', () => {
    for (let s = 1; s <= 200; s++) {
      const I = drawIdx(rng(s), 60, 20);
      expect(new Set(I).size).toBe(20);
      expect(I.every(i => i >= 0 && i < 60)).toBe(true);
      expect(drawIdx(rng(s), 60, 20)).toEqual(I);
    }
  });
  it('a population reaches its exact total on its grid', () => {
    for (let s = 1; s <= 50; s++) {
      const P = population({ N: 150, mu: 40, sd: 15, lo: 0, hi: 100, step: 5, seed: s, total: 6000 });
      expect(sum(P)).toBe(6000);
      expect(P.every(v => v % 5 === 0 && v >= 0 && v <= 100)).toBe(true);
    }
  });
  it('scaling: kept exact, rounded once (half up)', () => {
    expect(scaleExact(45, 250, 3800).rounded).toBe(684);
    expect(scaleExact(18, 75, 1240).rounded).toBe(298);    // 297.6
    expect(scaleExact(6, 600, 4300).rounded).toBe(43);
    expect(roundedFactorFirst(18, 75, 1240)).toBe(306);    // x17 instead of x16.53
    expect(scaleExact(1, 2, 3).half).toBe(true);
    expect(pctCount(35, 2400)).toBe(840);
    expect(pctCount(37.5, 1000)).toBe(375);
    expect(() => scaleWhole(12, 40, 810)).toThrow();
  });
  it('means of bigger random samples spread less (the simulation behind the lesson)', () => {
    const P = population({ N: 300, mu: 45, sd: 16, lo: 0, hi: 100, step: 5, seed: 9, total: 13500 });
    const R = rng(4);
    const m10 = repeatMeans(P, 10, 200, R).means, m50 = repeatMeans(P, 50, 200, R).means;
    expect(mostWithin(m50, 45)).toBeLessThan(mostWithin(m10, 45));
    expect(mostWithin(m10, 45)).toBeLessThan(Math.round(mad(P)));
  });
});

describe('the Ridgeview story', () => {
  it('states numbers the simulation makes', () => {
    expect(St.MU).toBe(42); expect(mean(St.POP)).toBe(42);
    expect([St.MAYA_MEAN, St.LEO_MEAN, St.HALFWAY]).toEqual([46, 34, 40]);
    expect(new Set(St.MAYA).size).toBe(10); expect(new Set(St.LEO).size).toBe(10);
    expect([St.MEANS10_LO, St.MEANS10_HI, St.MOST10, St.S40_SUM, St.S40_MEAN, St.MOST40, St.POLL_MEAN]).toEqual([34, 50.5, 6, 1720, 43, 3, 55]);
    expect(Math.round(mad(St.POP))).toBe(14);
  });
  it('the lesson pictures build', () => {
    const AX = { lo: 0, hi: 100, major: 20, minor: 5, unit: 'minutes of homework' };
    const R = { N: 200, label: '200 seventh graders', picks: St.MAYA };
    expect(() => Sampler({ roster: R, axis: AX, rows: [{ label: 'Maya’s 10 names', values: St.vals(St.MAYA), col: 'second', fly: true, mark: { at: 46, col: 'link' } }, { label: 'Leo’s 10 names', values: St.vals(St.LEO), col: 'second', mark: { at: 34, col: 'link' } }] }, MF, dusk)).not.toThrow();
    expect(() => Sampler({ roster: R, axis: AX, pop: { at: 42, label: 'mean of all 200' }, bands: [{ row: 1, at: 42, d: 6 }], rows: [{ label: 'Maya’s sample of 10', values: St.vals(St.MAYA), col: 'second', fly: true, mark: { at: 46, col: 'link' } }, { label: 'means of 20 samples of 10', values: St.MEANS10, col: 'link', bin: 0, r: 12 }] }, MF, dusk)).not.toThrow();
    expect(() => Sampler({ axis: AX, pop: { at: 42, label: 'mean of all 200' }, bands: [{ row: 1, at: 42, d: 6 }, { row: 2, at: 42, d: 3 }], rows: [{ label: 'one sample of 40', values: St.vals(St.S40), col: 'second', mark: { at: 43, col: 'link' }, r: 13 }, { label: 'means of 20 samples of 10', values: St.MEANS10, col: 'link', bin: 0, r: 11 }, { label: 'means of 20 samples of 40', values: St.MEANS40, col: 'link', bin: 0, r: 11 }] }, MF, dusk)).not.toThrow();
    expect(() => Sampler({ axis: AX, pop: { at: 42, label: 'mean of all 200' }, gap: { rowA: 0, rowB: 1, unit: 13 }, rows: [{ label: 'means of 20 random samples of 40', values: St.MEANS40, col: 'link', bin: 0, r: 13, mark: { at: 42, col: 'first' } }, { label: 'means of 20 online polls of 60', values: St.POLLS, col: 'pick', bin: 0, r: 13, mark: { at: 55, col: 'pick' } }] }, MF, dusk)).not.toThrow();
  });
  it('the Sampler refuses an unreadable picture', () => {
    expect(() => Sampler({ axis: { lo: 0, hi: 100, major: 20, minor: 5, unit: '' }, rows: [{ label: 'x', values: Array.from({ length: 200 }, () => 50), col: 'second' }] }, MF, dusk)).toThrow();
    expect(() => Sampler({ roster: { N: 50, label: 'x', picks: [3, 3] }, axis: { lo: 0, hi: 100, major: 20, minor: 5, unit: '' }, rows: [] }, MF, dusk)).toThrow();
  });
});

describe('voice', () => {
  it('every scripted panel line has a spoken text, and lines.json is the script', () => {
    const lines = JSON.parse(fs.readFileSync('pages/lessons/sampling-and-inference/voice/lines.json', 'utf8')) as Record<string, { text: string }>;
    expect(Object.keys(lines).sort()).toEqual(Object.keys(SCRIPT).sort());
    for (const [id, l] of Object.entries(lines)) {
      expect(l.text, id).toBe(LINES[id]!.say);
      expect(l.text.length, id).toBeGreaterThan(3);
      expect(l.text, id).not.toMatch(/\d|[<>×÷$%]/);
    }
  });
});

describe('sampling-and-inference: oracle findings (phase 2)', () => {
  const txt = (h: string) => h.replace(/<[^>]+>/g, '');
  it('only people answer an online survey (no tomato plants "chose to answer")', () => {
    for (let s = 1; s <= 600; s++) {
      const p = txt(GENS.scope!(rng(s * 7 + 5), s, 'scope-of-generalization').prompt);
      if (/chose to answer/.test(p)) expect(p, p).not.toMatch(/plants/);
    }
  });
  it('"no outliers" holds for the plotted samples (no value beyond 1.5 IQRs)', async () => {
    const { hasOutlier } = await import('../src/lesson/topics/sampling-and-inference/items');
    for (let s = 1; s <= 600; s++) {
      const it = GENS.pickMeasure!(rng(s * 11 + 3), s, 'center-difference-in-mad-units');
      if (!/no outliers/.test(txt(it.prompt))) continue;
      const pic = picOf(it) as unknown as { p: { rows: { values: number[] }[] } };
      for (const r of pic.p.rows) expect(hasOutlier(r.values), txt(it.prompt)).toBe(false);
    }
  });
  it('every prompt starts with a capital letter', () => {
    for (const p of PLAN) for (const f of p.families) for (let s = 1; s <= 60; s++) {
      const t = txt(GENS[f]!(rng(s * 13 + 1), s, p.id).prompt);
      expect(t, `${f}: ${t}`).toMatch(/^[^a-z]/);
    }
  });
});
