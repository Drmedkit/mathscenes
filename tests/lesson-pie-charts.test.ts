// pie charts (make a circle graph with percents): every family x every sub-goal it serves x 300 seeds gives a valid
// item (the answer passes, choices unique with exactly one right, misconception ids exist, the picture can be drawn),
// the main misconceptions are classified, the plan covers every sub-goal of the topic JSON in order, and the model's
// maths (shares, percents, exact angles, the closed angle list) holds.
import { beforeAll, describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { rng, type Response } from '../src/lesson/runtime/item';
import { GENERATORS, FAMILY_NAMES, MC, type PieItem } from '../src/lesson/topics/pie-charts/items';
import { PLAN } from '../src/lesson/topics/pie-charts/plan';
import { computePie, round1, roundQ } from '../src/lesson/topics/pie-charts/pieMaths';
import { CircleGraph, BarGraph } from '../src/lesson/topics/pie-charts/CircleGraph';
import { frame } from '../src/blocks/block';
import { dusk } from '../src/lesson/dusk';
import { rat } from '../src/core/math';
import { SCRIPT } from '../src/lesson/topics/pie-charts/script';

const TOPIC = 'C:/Users/stelt/Claude code foler/math-curriculum-essentials/topics/primary.data.make-pie-chart.json';
const MCF = 'C:/Users/stelt/Claude code foler/math-curriculum-essentials/misconceptions.json';
const mcIds = existsSync(MCF) ? new Set((JSON.parse(readFileSync(MCF, 'utf8')) as { misconceptions: { id: string }[] }).misconceptions.map(m => m.id)) : null;
const MF = frame(60, 70, 940, 940);

// the canvas labels measure text with a 2D context; in node they fall back to an estimate (0.52 em per character)
beforeAll(() => { (globalThis as unknown as { document: unknown }).document = { createElement: () => ({ getContext: () => null }) }; });

const pairs = PLAN.flatMap(p => p.families.map(f => [f, p.id] as const));
const make = (f: string, sg: string, s: number): PieItem => GENERATORS[f as keyof typeof GENERATORS](rng(s * 7919 + f.length), s, sg);
const num = (v: number): Response => ({ kind: 'num', v });

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
  it('every misconception id used exists in the catalogue', () => {
    if (mcIds) for (const id of Object.values(MC)) expect(mcIds.has(id), id).toBe(true);
  });
});

describe('voice', () => {
  it('every panel line of parts 1-4 has a spoken text, and every spoken text a panel line', () => {
    const lines = JSON.parse(readFileSync('pages/lessons/pie-charts/voice/lines.json', 'utf8')) as Record<string, { text: string }>;
    expect(Object.keys(lines).sort()).toEqual(Object.keys(SCRIPT).sort());
    for (const [id, l] of Object.entries(lines)) { expect(l.text.length, id).toBeGreaterThan(10); expect(l.text, id).not.toMatch(/\d\/\d|°|%/); }
    const page = readFileSync('pages/lessons/pie-charts.ts', 'utf8');
    for (const m of page.matchAll(/(?:say|fbk|ctx\.say)\((?:false, |true, |o\.ok, )?'([a-z.0-9]+)'/g)) expect(SCRIPT[m[1]!], m[1]).toBeTruthy();
  });
});

describe('item families', () => {
  for (const [f, sg] of pairs) {
    it(`${f} for ${sg}: 300 seeds, the answer passes, choices unique with one right, the picture draws`, () => {
      const seen = new Set<string>();
      let labelled = 0, graphs = 0;
      for (let s = 1; s <= 300; s++) {
        const it = make(f, sg, s);
        expect(it.family).toBe(f);
        expect(it.check(it.answer).ok, `${it.prompt} ${JSON.stringify(it.answer)}`).toBe(true);
        expect(it.solution.length).toBeGreaterThan(0);
        for (const t of [it.prompt, it.board, it.work ?? '', ...it.solution, ...(it.choices ?? [])]) expect(t).not.toMatch(/undefined|NaN|Infinity|\t/);
        if (it.choices) {
          expect(new Set(it.choices).size, it.choices.join(' | ')).toBe(it.choices.length);
          const verdicts = it.choices.map((_, i) => it.check({ kind: 'choice', i }));
          expect(verdicts.filter(v => v.ok).length).toBe(1);
          if (mcIds) for (const v of verdicts) if (v.mc) expect(mcIds.has(v.mc), v.mc).toBe(true);
        }
        const p = it.picture;
        if (p?.kind === 'graph') {
          graphs++;
          const m = computePie(p.cats, p.n);
          if (!p.angles) expect(m.draw.reduce((a, b) => a + b, 0)).toBe(m.listed === m.n ? 360 : m.draw.reduce((a, b) => a + b, 0));
          if (p.focus !== undefined) expect(p.focus).toBeLessThan(p.cats.length);
          try { CircleGraph({ ...p, labels: p.labels }, MF, dusk); labelled++; } catch { CircleGraph({ ...p, labels: 'none', title: undefined }, MF, dusk); }
        } else if (p?.kind === 'bars') BarGraph(p, MF);
        seen.add(it.prompt + it.board + (it.choices ?? []).join());
      }
      // the picture keeps its labels in at least 90 % of the items that have one
      if (graphs) expect(labelled / graphs, `${labelled} of ${graphs} graphs fit with labels`).toBeGreaterThanOrEqual(0.9);
      expect(seen.size).toBeGreaterThan(f === 'sameShare' || f === 'fit' ? 12 : 20);
    });
  }
});

describe('misconceptions are diagnosed', () => {
  const first = (f: string, sg: string, test: (it: PieItem) => void) => { for (let s = 1; s <= 300; s++) test(make(f, sg, s)); };
  const mcsOf = (f: string, sg: string) => {
    const m = new Set<string>();
    first(f, sg, it => it.choices?.forEach((_, i) => { const v = it.check({ kind: 'choice', i }); if (v.mc) m.add(v.mc); }));
    return m;
  };
  it('percent and degrees: x% drawn as x°, a 180° circle', () => {
    first('toDeg', 'percent-degree-double-scale', it => {
      const deg = (it.answer as { v: number }).v, p = Math.round((deg / 3.6) * 10) / 10;
      expect(it.check(num(p)).mc).toBe(MC.pctDeg);
      expect(it.check(num(Math.round((deg / 2) * 10) / 10)).mc).toBe(MC.half);
    });
    first('toPct', 'percent-degree-double-scale', it => {
      const p = (it.answer as { v: number }).v, deg = Math.round(p * 3.6);
      expect(it.check(num(deg)).mc).toBe(MC.pctDeg);
    });
  });
  it('central angle: count × 360, percent as degrees', () => {
    first('angle', 'central-angle-from-share', it => {
      const m = /cssId\{fc\}\{\\?\$?(\d+)\}/.exec(it.board)!; const f = +m[1]!;
      expect(it.check(num(f * 360)).mc).toBe(MC.times360);
    });
  });
  it('count over total: dividing by the biggest group', () => {
    let hit = 0;
    first('share', 'relative-frequency', it => {
      const a = it.answer as { n: number; d: number };
      const counts = [...it.board.matchAll(/& (?:\\cssId\{f?c\}\{)?\\?\$?(\d+)/g)].map(x => +x[1]!).filter(x => x !== a.d);
      const big = Math.max(...counts);
      if (big !== a.n) { hit++; expect(it.check({ kind: 'frac', w: 0, n: a.n, d: big }).mc).toBe(MC.wrongTotal); }
    });
    expect(hit).toBeGreaterThan(100);
  });
  it('percent: the count used as the percent, the decimal share with a % sign', () => {
    first('pct', 'percent-from-relative-frequency', it => {
      const v = (it.answer as { v: number }).v;
      if (v === 0) return;
      const m = /\\tfrac\{(\d+)\}\{(\d+)\}/.exec(it.work!)!; const f = +m[1]!, N = +m[2]!;
      if (f !== v) expect(it.check(num(f)).mc).toBe(MC.fixed);
      expect(it.check(num(f / N)).mc).toBe(MC.noScale);
    });
  });
  it('next slice from the first ray; the reflex slice replaced by the small opening', () => {
    first('adjacent', 'draw-adjacent-sectors', it => {
      const m = /([\d.]+)(?:\^\\circ|\\%) \+ ([\d.]+)/.exec(it.board)!;
      expect(it.check(num(+m[2]!)).mc).toBe(MC.sameRadius);
    });
    first('reflex', 'draw-reflex-sector', it => {
      if (it.input !== 'num') return;
      const v = (it.answer as { v: number }).v;
      const D = it.board.startsWith('360') ? v : v + 180;
      expect(it.check(num(360 - D)).mc).toBe(MC.reflex);
    });
  });
  it('the choice families carry their misconceptions', () => {
    const want: Record<string, [string, string[]]> = {
      whole: ['circle-is-whole', [MC.subtotal, MC.fixed]],
      sameShare: ['sector-share-by-central-angle', [MC.radius, MC.unequal]],
      estimate: ['estimate-sector-share', [MC.pctDeg]],
      exact: ['keep-unrounded-shares', [MC.early]],
      close: ['close-angle-list', [MC.forceLast, MC.notSum]],
      label: ['label-circle-graph', [MC.rawLabel, MC.noTotal, MC.tiny]],
      audit: ['audit-against-source', [MC.byAnswer]],
      bound: ['rounding-error-bound', [MC.mustSum, MC.nearMiss]],
      disclose: ['disclose-rounding', [MC.forceLast]],
      gap: ['incomplete-whole', [MC.remainder, MC.subtotal, MC.nonWhole]],
      fit: ['reject-overlapping-categories', [MC.nonWhole, MC.nearMiss]],
    };
    for (const [f, [sg, ids]] of Object.entries(want)) {
      const got = mcsOf(f, sg);
      for (const id of ids) expect(got.has(id), `${f}: ${id}`).toBe(true);
    }
  });
});

describe('the model maths', () => {
  it('lunch: 10, 14, 6, 10 of 40 is 25%, 35%, 15%, 25% and 90°, 126°, 54°, 90°', () => {
    const m = computePie([{ name: 'Pizza', count: 10 }, { name: 'Tacos', count: 14 }, { name: 'Salad', count: 6 }, { name: 'Pasta', count: 10 }]);
    expect(m.pctLabel).toEqual([25, 35, 15, 25]);
    expect(m.draw).toEqual([90, 126, 54, 90]);
  });
  it('sport: 21, 15, 12, 12 of 60 is 126°, 90°, 72°, 72°', () => {
    const m = computePie([{ name: 'a', count: 21 }, { name: 'b', count: 15 }, { name: 'c', count: 12 }, { name: 'd', count: 12 }]);
    expect(m.draw).toEqual([126, 90, 72, 72]); expect(m.pctLabel).toEqual([35, 25, 20, 20]);
  });
  it('the closed list: 1, 1, 1, 1, 3 of 7 and 1, 1, 1, 8 of 11 (topic JSON cases)', () => {
    const a = computePie([1, 1, 1, 1, 3].map((count, i) => ({ name: String(i), count })));
    expect(a.indep).toEqual([51, 51, 51, 51, 154]);
    expect(a.bound).toEqual([51, 103, 154, 206, 360]);
    expect(a.draw).toEqual([51, 52, 51, 52, 154]);
    const b = computePie([1, 1, 1, 8].map((count, i) => ({ name: String(i), count })));
    expect(b.indep.reduce((s, x) => s + x, 0)).toBe(361);
    expect(b.draw.reduce((s, x) => s + x, 0)).toBe(360);
    const c = computePie([1, 499, 500].map((count, i) => ({ name: String(i), count })));
    expect(c.indep).toEqual([0, 180, 180]);
  });
  it('exact angles and rounding at the end: 1 of 7 is 51 3/7°, about 51.4°; from 14% it would be 50.4°', () => {
    const m = computePie([{ name: 'a', count: 1 }, { name: 'b', count: 6 }]);
    expect(m.angleExact[0]).toEqual(rat(360, 7));
    expect(round1(m.angleExact[0]!)).toBe(51.4);
    expect(roundQ(m.pctExact[0]!)).toBe(14);
    expect(Math.round(3.6 * 14 * 10) / 10).toBe(50.4);
  });
  it('a random 2–6 category table always closes at 360° with every angle within 1°', () => {
    const R = rng(5);
    for (let t = 0; t < 2000; t++) {
      const k = 2 + Math.floor(R() * 5), cs = Array.from({ length: k }, () => 1 + Math.floor(R() * 60));
      const m = computePie(cs.map((count, i) => ({ name: String(i), count })));
      expect(m.draw.reduce((s, x) => s + x, 0)).toBe(360);
      m.draw.forEach((a, i) => expect(Math.abs(a - m.angleExact[i]!.p / m.angleExact[i]!.q)).toBeLessThan(1));
    }
  });
});
