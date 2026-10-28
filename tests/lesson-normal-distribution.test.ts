// lesson-normal-distribution: the generic checks (every family x every sub-goal it serves x 300 seeds). Add topic checks below.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { rng } from '../src/lesson/runtime/item';
import { GENERATORS } from '../src/lesson/topics/normal-distribution/items';
import { PLAN } from '../src/lesson/topics/normal-distribution/plan';

const TOPIC = { subgoals: [...new Map(["secondary-t7-18-statistical-inference-normal-distribution"].flatMap(i => JSON.parse(fs.readFileSync(`../math-curriculum-essentials/topics/${i}.json`, 'utf8')).subgoals).map((s: { id: string }) => [s.id, s] as const)).values()] };
const CATALOG = new Set<string>(JSON.parse(fs.readFileSync('../math-curriculum-essentials/misconceptions.json', 'utf8')).misconceptions.map((m: { id: string }) => m.id));
const GEN = GENERATORS as Record<string, (R: () => number, n: number, sg?: string) => import('../src/lesson/runtime/item').Item>;

describe('normal-distribution: plan', () => {
  it('walks through every sub-goal of the topic JSON, in order, each with a family', () => {
    expect(PLAN.map(p => p.id)).toEqual(TOPIC.subgoals.map((s: { id: string }) => s.id));
    for (const p of PLAN) { expect(p.families.length, p.id).toBeGreaterThan(0); for (const f of p.families) expect(GEN[f], f).toBeDefined(); }
  });
});

describe('normal-distribution: families', () => {
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
import { Phi, tableArea, zForArea, zForAreaClear, bandPct, benchPct, safeRound, normalcdf } from '../src/lesson/topics/normal-distribution/normMaths';
import { LINES } from '../src/lesson/topics/normal-distribution/script';
import { planeParams } from '../src/lesson/topics/normal-distribution/NormalView';
import type { NItem } from '../src/lesson/topics/normal-distribution/common';

describe('normal-distribution: maths', () => {
  it('Phi and the table', () => {
    expect(Phi(0)).toBeCloseTo(0.5, 14);
    expect(Phi(1)).toBeCloseTo(0.841344746068543, 12);
    expect(Phi(1.96)).toBeCloseTo(0.975002104851780, 12);
    expect(Phi(-2.33)).toBeCloseTo(0.009903075559164, 12);
    expect(tableArea(1.2)).toBe(0.8849);
    expect(tableArea(1.5)).toBe(0.9332);
    expect(tableArea(-1)).toBe(0.1587);
    expect(tableArea(-1.96)).toBe(0.025);
    for (let i = -349; i <= 349; i++) expect(tableArea(i / 100) + tableArea(-i / 100)).toBeCloseTo(1, 9);
    expect(normalcdf(62, 70, 66, 3)).toBeCloseTo(Phi(4 / 3) - Phi(-4 / 3), 12);
  });
  it('the table read backwards', () => {
    expect(zForArea(0.9)).toBe(1.28);
    expect(zForArea(0.1)).toBe(-1.28);
    expect(zForArea(0.025)).toBe(-1.96);
    expect(zForArea(0.2)).toBe(-0.84);
    expect(zForAreaClear(0.05)).toBe(false);   // 0.0495 / 0.0505: a tie, never asked
  });
  it('benchmarks', () => {
    expect(bandPct(1, 2)).toBe(13.5);
    expect(bandPct(2, 3)).toBe(2.35);
    expect(benchPct(-1, 2)).toBe(81.5);
    expect(benchPct(-Infinity, 1)).toBe(84);
    expect(benchPct(2, Infinity)).toBe(2.5);
    expect(safeRound(1.335, 2)).toBe(false);
    expect(safeRound(1.3333, 2)).toBe(true);
  });
});

describe('normal-distribution: voice', () => {
  it('lines.json matches script.ts and has no digits or symbols', () => {
    const J = JSON.parse(fs.readFileSync('pages/lessons/normal-distribution/voice/lines.json', 'utf8')) as Record<string, { text: string }>;
    expect(Object.keys(J).sort()).toEqual(Object.keys(LINES).sort());
    for (const [k, v] of Object.entries(LINES)) { expect(J[k]!.text, k).toBe(v.say); expect(v.say, k).not.toMatch(/[0-9%=<>÷×−+]/); }
  });
});

describe('normal-distribution: pictures fit and agree with the question', () => {
  it('every card, table and sample plot builds (200 seeds per family)', async () => {
    (globalThis as { document?: unknown }).document ??= { createElement: () => ({ getContext: () => null }) };
    const { Plane } = await import('../src/lesson/kit/Plane');
    const { DataCard } = await import('../src/lesson/topics/linear-regression/DataCard');
    const { DataPlot } = await import('../src/lesson/topics/one-variable-data/DataPlot');
    const { dusk } = await import('../src/lesson/dusk');
    const PF = { x: 50, y: 70, w: 1140, h: 940 };
    const bad: string[] = [];
    for (const p of PLAN) for (const f of p.families) for (let s = 1; s <= 200; s++) {
      const it = GEN[f]!(rng(s * 13 + 1), s, p.id) as NItem;
      const pic = it.picture ?? {};
      try {
        if (pic.card) {
          const P = Plane(planeParams(pic.card), PF, dusk);
          if (P.dropped.length) bad.push(`${f} ${s}: dropped names ${P.dropped.join(',')}`);
          // every shade lies under a drawn curve, and every asked x-value is inside the window
          for (const sh of pic.card.shades ?? []) expect(pic.card.curves?.some(c => c.key === sh.on), `${f}`).toBe(true);
        }
        if (pic.table) {
          DataCard({ title: 'Area left of z', cols: [{ head: 'z', cells: pic.table.rows.map(r => r[0].toFixed(2)) }, { head: 'area', cells: pic.table.rows.map(r => r[1].toFixed(4)) }] }, { x: 1250, y: 330, w: 600, h: 680 }, dusk);
          for (const [z, a] of pic.table.rows) expect(a).toBe(tableArea(z));
          const ex = (it as unknown as { ex?: { z?: number | number[] } }).ex;
          const zs = ex?.z === undefined ? [] : Array.isArray(ex.z) ? ex.z : [ex.z];
          for (const z of zs) expect(pic.table.rows.some(r => r[0] === z), `${f} ${s}: the table shows z = ${z}`).toBe(true);
        }
        if (pic.calc) DataCard({ title: pic.calc.title, lines: pic.calc.lines }, pic.card ? { x: 1250, y: 330, w: 600, h: 680 } : { x: 160, y: 120, w: 900, h: 860 }, dusk);
        if (pic.samples) DataPlot({ axis: pic.samples.axis, panels: pic.samples.panels.map(q => ({ key: q.key, kind: 'dot' as const, data: q.data, label: q.label })), marks: [] }, PF, dusk);
      } catch (e) { bad.push(`${f} ${s}: ${(e as Error).message}`); }
    }
    const byFam = new Map<string, string[]>(); for (const b of bad) { const k = b.split(" ")[0]!; byFam.set(k, [...(byFam.get(k) ?? []), b]); }
    expect([...byFam.values()].map(v => `${v.length}x ${v[0]}`)).toEqual([]);
  }, 120000);
});

describe('normal-distribution: misconception probes', () => {
  const first = (f: string, sg: string, s = 3) => GEN[f]!(rng(s), s, sg) as NItem;
  it('a right tail typed as the left area is left-tail-default', () => {
    for (let s = 1; s <= 60; s++) {
      const it = first('rightTable', 'right-tail-complement', s), v = it.answer.kind === 'num' ? it.answer.v : NaN;
      expect(it.check({ kind: 'num', v: Math.round((1 - v) * 1e4) / 1e4 }).mc).toBe('mc.probability.left-tail-default');
      expect(it.check({ kind: 'num', v: v * 100 }).ok).toBe(true);   // a percent is accepted
    }
  });
  it('a between area added instead of subtracted is between-area-from-cumulatives', () => {
    for (let s = 1; s <= 60; s++) {
      const it = first('betweenTable', 'between-area', s) as NItem & { ex: { A: number[] } };
      expect(it.check({ kind: 'num', v: Math.round((it.ex.A[0]! + it.ex.A[1]!) * 1e4) / 1e4 }).mc).toBe('mc.probability.between-area-from-cumulatives');
    }
  });
  it('a one-tail benchmark answered with both tails is central-benchmark-misassigned-to-tail', () => {
    for (let s = 1; s <= 60; s++) {
      const it = first('tailPct', 'benchmark-tails-complement', s);
      const ex = (it as unknown as { ex: { k: number; N: number | null } }).ex;
      if (ex.N !== null) continue;
      expect(it.check({ kind: 'num', v: { 1: 32, 2: 5, 3: 0.3 }[ex.k]! }).mc).toBe('mc.statistics.central-benchmark-misassigned-to-tail');
    }
  });
  it('z without dividing by the SD is standardize-without-scaling', () => {
    for (let s = 1; s <= 60; s++) {
      const it = first('zCalc', 'z-compute', s) as NItem & { ex: { x: number; m: number } };
      if (Math.abs(it.ex.x - it.ex.m) < 0.01 || Math.abs(Math.abs(it.ex.x - it.ex.m) - Math.abs((it.answer as { v: number }).v)) < 0.01) continue;
      expect(it.check({ kind: 'num', v: Math.round((it.ex.x - it.ex.m) * 100) / 100 }).mc).toBe('mc.statistics.standardize-without-scaling');
    }
  });
  it('choice texts never show a raw "<" (HTML-escaped)', () => {
    for (const p of PLAN) for (const f of p.families) for (let s = 1; s <= 30; s++) {
      const it = GEN[f]!(rng(s), s, p.id);
      expect(it.prompt, f).not.toMatch(/<(?![a-zA-Z/!])/);
      for (const c of it.choices ?? []) expect(c, f).not.toMatch(/<(?![a-zA-Z/!])/);
    }
  });
});
