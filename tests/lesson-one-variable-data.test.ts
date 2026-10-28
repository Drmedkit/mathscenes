// lesson-one-variable-data: the generic checks (every family x every sub-goal it serves x 300 seeds). Add topic checks below.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { rng } from '../src/lesson/runtime/item';
import { GENERATORS } from '../src/lesson/topics/one-variable-data/items';
import { PLAN } from '../src/lesson/topics/one-variable-data/plan';

const TOPIC = { subgoals: [...new Map(["secondary-t6-15-statistics-summarizing-and-interpreting-data-algebra-i"].flatMap(i => JSON.parse(fs.readFileSync(`../math-curriculum-essentials/topics/${i}.json`, 'utf8')).subgoals).map((s: { id: string }) => [s.id, s] as const)).values()] };
const CATALOG = new Set<string>(JSON.parse(fs.readFileSync('../math-curriculum-essentials/misconceptions.json', 'utf8')).misconceptions.map((m: { id: string }) => m.id));
const GEN = GENERATORS as Record<string, (R: () => number, n: number, sg?: string) => import('../src/lesson/runtime/item').Item>;

describe('one-variable-data: plan', () => {
  it('walks through every sub-goal of the topic JSON, in order, each with a family', () => {
    expect(PLAN.map(p => p.id)).toEqual(TOPIC.subgoals.map((s: { id: string }) => s.id));
    for (const p of PLAN) { expect(p.families.length, p.id).toBeGreaterThan(0); for (const f of p.families) expect(GEN[f], f).toBeDefined(); }
  });
});

describe('one-variable-data: families', () => {
  for (const p of PLAN) for (const f of p.families) {
    it(`${p.id} / ${f}: 300 seeds`, () => {
      const seen = new Set<string>();
      for (let s = 1; s <= 300; s++) {
        const item = GEN[f]!(rng(s * 31 + 7), s, p.id);
        expect(item.check(item.answer).ok, `${item.prompt} ${JSON.stringify(item.answer)}`).toBe(true);
        if (item.choices) {
          expect(new Set(item.choices).size, item.prompt).toBe(item.choices.length);
          expect(item.choices.filter((_, i) => item.check({ kind: 'choice', i }).ok).length, item.prompt).toBe(1);
          item.choices.forEach((_, i) => { const mc = item.check({ kind: 'choice', i }).mc; if (mc) expect(CATALOG.has(mc), mc).toBe(true); });
        }
        seen.add(item.prompt + '|' + item.board);
      }
      expect(seen.size, 'distinct items').toBeGreaterThan(12);
    });
  }
});

// ---------- topic checks ----------
import { five, fences, halves, iqrOf, mad, mean, median, sdPop, sdSample, whiskers, binCounts, weightedMean } from '../src/lesson/topics/one-variable-data/stats';
import { MC } from '../src/lesson/topics/one-variable-data/common';

describe('one-variable-data: the maths (stated conventions)', () => {
  it('median, quartiles (median of halves, TI-84), fences, whiskers', () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 3, 2])).toBe(2.5);
    expect(halves([1, 2, 3, 4, 5])).toEqual([[1, 2], [4, 5]]);
    const f = five([8, 11, 13, 15, 17, 19, 21, 24, 26, 29, 59]);
    expect(f).toEqual({ min: 8, q1: 13, med: 19, q3: 26, max: 59 });
    expect(fences(f)).toEqual({ lo: -6.5, hi: 45.5, step: 19.5 });
    expect(whiskers([8, 11, 13, 15, 17, 19, 21, 24, 26, 29, 59])).toEqual([8, 29]);
    expect(five([1, 2, 3, 4, 5, 6, 7, 8])).toMatchObject({ q1: 2.5, med: 4.5, q3: 6.5 });
    const b = five([4, 17, 18, 19, 20, 21, 22, 23, 24, 25, 27]);
    expect([b.q1, b.med, b.q3, iqrOf(b)]).toEqual([18, 21, 24, 6]);
    expect(whiskers([4, 17, 18, 19, 20, 21, 22, 23, 24, 25, 27])).toEqual([17, 27]);
  });
  it('mean, MAD, SD (population and sample), the lesson contrasts', () => {
    expect(mean([8, 11, 13, 15, 17, 19, 21, 24, 26, 29, 59])).toBe(22);
    expect(mad([2, 4, 8, 10])).toBe(3);
    expect(mad([3, 3, 9, 9])).toBe(3); expect(mad([0, 6, 6, 12])).toBe(3);
    expect(sdPop([3, 3, 9, 9])).toBeCloseTo(3, 9); expect(sdPop([0, 6, 6, 12])).toBeCloseTo(Math.sqrt(18), 9);
    expect(sdPop([62, 64, 64, 64, 65, 65, 67, 69])).toBeCloseTo(2, 9);
    expect(sdPop([67, 69, 69, 69, 70, 70, 72, 74])).toBeCloseTo(2, 9);
    expect(sdSample([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(Math.sqrt(32 / 7), 9);
    expect(mean([3, 3, 3, 5, 5, 5, 5, 10])).toBe(4.875); expect(median([3, 3, 3, 5, 5, 5, 5, 10])).toBe(5);
  });
  it('histogram bins: lower end in, upper end out', () => {
    expect(binCounts([10, 19, 20, 29.9, 30], 10, 10, 3)).toEqual([2, 2, 1]);
    expect(weightedMean([80, 90], [1, 3])).toBe(87.5);
  });
});

describe('one-variable-data: probes', () => {
  const all = (fam: string, sg: string, n = 400) => Array.from({ length: n }, (_, s) => GEN[fam]!(rng(s * 97 + 13), s, sg));
  it('every misconception id in the lesson exists in the catalogue', () => {
    for (const id of Object.values(MC)) expect(CATALOG.has(id), id).toBe(true);
    for (const p of PLAN) for (const f of p.families) for (const it of all(f, p.id, 120)) {
      // probe typed answers with the classifier's own candidates: any mc it returns must exist
      if (it.input === 'num' && it.answer.kind === 'num') for (const d of [-1, 1, 0.5, 2, it.answer.v, -it.answer.v]) { const mc = it.check({ kind: 'num', v: it.answer.v + d }).mc; if (mc) expect(CATALOG.has(mc), mc).toBe(true); }
    }
  });
  it('rounded answers are never .x5 ties, and typed answers are finite', () => {
    for (const p of PLAN) for (const f of p.families) for (const it of all(f, p.id, 200)) {
      if (it.answer.kind === 'num') expect(Number.isFinite(it.answer.v), it.prompt).toBe(true);
      if (/nearest tenth/.test(it.prompt) && it.answer.kind === 'num') expect(Math.abs(it.answer.v * 10 - Math.round(it.answer.v * 10)) < 1e-6, it.prompt).toBe(true);
    }
  });
  it('items that need a convention state it', () => {
    for (const it of all('quartiles', 'five-number-summary')) expect(it.prompt).toMatch(/medians of the two halves/);
    for (const it of all('fences', 'outlier-fence-rule')) expect(it.prompt).toMatch(/1\.5 × IQR/);
    for (const it of all('sdOutput', 'sd-technology')) expect(it.prompt).toMatch(/population standard deviation/);
    for (const it of all('boundaryBin', 'histogram-intervals')) expect(it.prompt).toMatch(/lower end/);
    for (const it of all('binCount', 'histogram-intervals')) expect(it.prompt).toMatch(/lower end/);
  });
  it('picture data agree with the stated numbers (box plots, fences, dot plots inside the axis)', () => {
    for (const p of PLAN) for (const f of p.families) for (const it of all(f, p.id, 150)) {
      const plot = (it.picture as { plot?: { axis: { min: number; max: number }; panels: { data?: number[]; five?: { min: number; max: number } }[] } } | undefined)?.plot;
      if (!plot) continue;
      for (const q of plot.panels) for (const v of [...(q.data ?? []), ...(q.five ? [q.five.min, q.five.max] : [])]) expect(v >= plot.axis.min - 1e-9 && v <= plot.axis.max + 1e-9, `${f}: ${v} outside [${plot.axis.min}, ${plot.axis.max}]`).toBe(true);
    }
  });
  it('the quartile items match the stated method, and every wrong pair the classifier names is really wrong', () => {
    for (const it of all('quartiles', 'five-number-summary')) {
      const xs = (it.picture as { list: { data: number[] } }).list.data, f = five(xs);
      expect(it.answer).toEqual({ kind: 'pair', x: f.q1, y: f.q3 });
    }
    for (const it of all('isOutlier', 'outlier-fence-rule')) {
      const xs = (it.picture as { list: { data: number[] } }).list.data, F = fences(five(xs));
      const out = xs.filter(v => v < F.lo || v > F.hi);
      const right = it.choices![(it.answer as { i: number }).i]!;
      expect(right === 'None' ? out.length === 0 : out.every(v => right.includes(String(v))), right).toBe(true);
    }
  });
});

describe('one-variable-data: every practice plot lays out (DataPlot throws when it would not read)', () => {
  it('all families x sub-goals x 150 seeds', async () => {
    // words.ts measures text with a canvas; in node it falls back to an estimate (no canvas): stub the DOM call
    (globalThis as { document?: unknown }).document ??= { createElement: () => ({ getContext: () => null }) };
    const { DataPlot } = await import('../src/lesson/topics/one-variable-data/DataPlot');
    const { dusk } = await import('../src/lesson/dusk');
    const PF = { x: 50, y: 70, w: 1140, h: 940 };
    const bad: string[] = [];
    for (const p of PLAN) for (const f of p.families) for (let s = 1; s <= 150; s++) {
      let it: import('../src/lesson/runtime/item').Item;
      try { it = GEN[f]!(rng(s * 53 + 11), s, p.id); } catch (e) { bad.push(`${p.id}/${f}#${s} generator: ${(e as Error).message}`); continue; }
      const pp = (it.picture as { plot?: { axis: never; panels: never[]; marks?: never[]; solveMarks?: never[] } } | undefined)?.plot;
      if (!pp) continue;
      try { DataPlot({ axis: pp.axis, panels: pp.panels, marks: [...(pp.marks ?? []), ...(pp.solveMarks ?? [])] }, PF, dusk); }
      catch (e) { bad.push(`${p.id}/${f}#${s}: ${(e as Error).message}`); }
    }
    expect(bad.slice(0, 60)).toEqual([]);
  });
});

describe('one-variable-data: oracle-style probes on choices', () => {
  const all = (fam: string, sg: string, n = 600) => Array.from({ length: n }, (_, s) => GEN[fam]!(rng(s * 211 + 5), s, sg));
  it('scaleChoice: only the right number line holds every value with equal steps', () => {
    for (const it of all('scaleChoice', 'dotplot-scale')) {
      const xs = (it.picture as { list: { data: number[] } }).list.data;
      it.choices!.forEach((t, i) => {
        const m = t.match(/^(−?[\d.]+) to (−?[\d.]+), a tick every ([\d.]+)$/);
        if (!m) return;
        const [lo, hi] = [Number(m[1]!.replace('−', '-')), Number(m[2]!.replace('−', '-'))];
        const fits = xs.every(v => v >= lo - 1e-9 && v <= hi + 1e-9);
        expect(fits, `${t} vs ${xs}`).toBe(i === (it.answer as { i: number }).i);
      });
    }
  });
  it('modPlotPick: the three plots differ', () => {
    for (const it of all('modPlotPick', 'modified-boxplot')) {
      const ps = (it.picture as { plot: { panels: { five: object; outs: number[] }[] } }).plot.panels.map(q => JSON.stringify([q.five, q.outs]));
      expect(new Set(ps).size, it.prompt).toBe(3);
    }
  });
  it('differIn: the keyed answer matches the means/medians and SD/IQR of the plotted data', () => {
    for (const sg of ['center-location', 'spread-along-axis', 'compare-distributions']) for (const it of all('differIn', sg, 300)) {
      const [a, b] = (it.picture as { plot: { panels: { data: number[] }[] } }).plot.panels.map(q => q.data);
      const cen = mean(a!) !== mean(b!), med = median(a!) !== median(b!), sp = Math.abs(sdPop(a!) - sdPop(b!)) > 1e-9, iq = iqrOf(five(a!)) !== iqrOf(five(b!));
      expect(cen, it.prompt).toBe(med);
      expect(sp, it.prompt).toBe(iq);
      const right = it.choices![(it.answer as { i: number }).i]!;
      expect(right).toBe(cen && sp ? 'In both center and spread' : cen ? 'Only in center' : sp ? 'Only in spread' : 'In neither: same center and spread');
    }
  });
});

describe('one-variable-data: regressions from the oracle sweep', () => {
  const all = (fam: string, sg: string, n = 800) => Array.from({ length: n }, (_, s) => GEN[fam]!(rng(s * 389 + 3), s, sg));
  it('effectCenter: "both rise by" is never offered when it is true', () => {
    for (const it of all('effectCenter', 'outlier-effect-center')) {
      const xs = (it.prompt.match(/: ([\d, ]+)\. A sixth value, (\d+)/));
      if (!xs) continue;
      const a = xs[1]!.split(', ').map(Number), V = Number(xs[2]);
      const dm = mean([...a, V]) - mean(a), dmed = median([...a, V]) - median(a);
      if (Math.abs(dm - dmed) < 1e-9) expect(it.choices!.some(t => t.startsWith('Both rise by'))).toBe(false);
    }
  });
  it('sdOutput: no shown statistic sits within 0.001 of a tenths tie', () => {
    for (const it of all('sdOutput', 'sd-technology')) {
      const xs = (it.picture as { plot: { panels: { data: number[] }[] } }).plot.panels[0]!.data;
      for (const v of [sdPop(xs), sdSample(xs), mean(xs)]) expect(Math.abs(v * 10 - Math.floor(v * 10) - 0.5) > 0.01, String(v)).toBe(true);
    }
  });
  it('summaryPick: symmetric sets have no fence outliers', () => {
    for (const it of all('summaryPick', 'context-summary')) {
      if (!it.choices!.some(t => t.startsWith('Roughly symmetric'))) continue;
      const xs = (it.picture as { plot: { panels: { data: number[] }[] } }).plot.panels[0]!.data, F = fences(five(xs));
      expect(xs.every(v => v >= F.lo && v <= F.hi), String(xs)).toBe(true);
    }
  });
});
