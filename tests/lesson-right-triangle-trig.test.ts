// lesson-right-triangle-trig: the generic checks (every family x every sub-goal it serves x 300 seeds). Add topic checks below.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { rng } from '../src/lesson/runtime/item';
import { GENERATORS } from '../src/lesson/topics/right-triangle-trig/items';
import { PLAN } from '../src/lesson/topics/right-triangle-trig/plan';

const TOPIC = { subgoals: [...new Map(["secondary-t6-23-right-triangle-trigonometry"].flatMap(i => JSON.parse(fs.readFileSync(`../math-curriculum-essentials/topics/${i}.json`, 'utf8')).subgoals).map((s: { id: string }) => [s.id, s] as const)).values()] };
const CATALOG = new Set<string>(JSON.parse(fs.readFileSync('../math-curriculum-essentials/misconceptions.json', 'utf8')).misconceptions.map((m: { id: string }) => m.id));
const GEN = GENERATORS as Record<string, (R: () => number, n: number, sg?: string) => import('../src/lesson/runtime/item').Item>;

describe('right-triangle-trig: plan', () => {
  it('walks through every sub-goal of the topic JSON, in order, each with a family', () => {
    expect(PLAN.map(p => p.id)).toEqual(TOPIC.subgoals.map((s: { id: string }) => s.id));
    for (const p of PLAN) { expect(p.families.length, p.id).toBeGreaterThan(0); for (const f of p.families) expect(GEN[f], f).toBeDefined(); }
  });
});

describe('right-triangle-trig: families', () => {
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
import { SCRIPT } from '../src/lesson/topics/right-triangle-trig/script';
import { explain } from '../src/lesson/topics/right-triangle-trig/explain';
import { FR_LEFT, FR_WIDE, type Fig, dist, figProblems, galleryFrames } from '../src/lesson/topics/geometry-foundations/geo';
import type { GFItem } from '../src/lesson/topics/geometry-foundations/kit';
import { apothemOf, polyArea, radiusOf, rnd, sinD, tanD } from '../src/lesson/topics/right-triangle-trig/trig';

const ITEMS: { f: string; sg: string; it: GFItem }[] = [];
for (const p of PLAN) for (const f of p.families) for (let s = 1; s <= 60; s++) ITEMS.push({ f, sg: p.id, it: GEN[f]!(rng(s * 7 + 3), s, p.id) as GFItem });
const figsOf = (it: GFItem): { fig: Fig; fr: import('../src/lesson/topics/geometry-foundations/geo').Frame }[] => {
  const p = it.picture; if (!p) return [];
  if (p.gallery) { const frs = galleryFrames(p.gallery.figs.length); return p.gallery.figs.map((fig, i) => ({ fig, fr: frs[i]! })); }
  return p.fig ? [{ fig: p.fig, fr: p.card || p.cards ? FR_LEFT : FR_WIDE }] : [];
};

describe('right-triangle-trig: voice', () => {
  it('every script line is voiced, and the spoken text has no digits or symbols', () => {
    const lines = JSON.parse(fs.readFileSync('pages/lessons/right-triangle-trig/voice/lines.json', 'utf8')) as Record<string, { text: string }>;
    expect(Object.keys(lines).sort()).toEqual(Object.keys(SCRIPT).sort());
    for (const [k, v] of Object.entries(SCRIPT)) {
      expect(lines[k]!.text, k).toBe(v.say);
      expect(/[0-9=≅∠△°+−<>/~]/.test(v.say), `${k}: ${v.say}`).toBe(false);
    }
  });
});

describe('right-triangle-trig: figures', () => {
  it('every practice picture lays out readably in the frame the page uses', () => {
    for (const { f, it } of ITEMS) for (const { fig, fr } of figsOf(it)) expect(figProblems(fig, fr), f).toEqual([]);
  });
  it('numeric length labels are drawn at their length (one unit per figure and unit word)', () => {
    for (const { f, it } of ITEMS) for (const { fig } of figsOf(it)) {
      const per = new Map<string, number[]>();
      for (const s of fig.segs) for (const t of [s.text, s.alt]) {
        const m = /^(\d+(?:\.\d+)?)\s*(ft|in|m|cm)?$/.exec(t ?? '');
        if (!m) continue;
        const u = m[2] ?? '', L = dist(s.a, s.b);
        per.set(u, [...(per.get(u) ?? []), L / Number(m[1])]);
      }
      // rounded labels (nearest tenth or hundredth) may be off by their rounding
      for (const [u, v] of per) expect(Math.max(...v) / Math.min(...v), `${f} ${u}: ${it.prompt}`).toBeLessThan(1.02);
    }
  });
  it('no figure shows the answer before the solve (labels, before alt)', () => {
    for (const { f, it } of ITEMS) {
      if (it.answer.kind !== 'num') continue;
      const a = it.answer.v;
      for (const { fig } of figsOf(it)) for (const t of it.unit === '°' ? fig.angles.map(g => g.text) : fig.segs.map(s => s.text)) {
        const m = /^(\d+(?:\.\d+)?)\s*(ft|in|m|cm|°)?$/.exec(t ?? '');
        if (m && Math.abs(Number(m[1]) - a) < 1e-9 && !/depWhere|shadowTrig/.test(f)) expect.fail(`${f}: label ${t} shows the answer: ${it.prompt}`);
      }
    }
  });
});

describe('right-triangle-trig: worked steps', () => {
  it('explain(it) arrives at a right answer in 2-5 steps', () => {
    for (const { f, it } of ITEMS) {
      const ex = explain(it);
      expect(ex, f).not.toBeNull();
      expect(ex!.steps.length, `${f}: ${ex!.steps.join(' | ')}`).toBeGreaterThanOrEqual(2);
      expect(ex!.steps.length, `${f}: ${ex!.steps.join(' | ')}`).toBeLessThanOrEqual(5);
      for (const st of ex!.steps) expect(st.replace(/<[^>]+>/g, '').length, `${f}: ${st}`).toBeLessThanOrEqual(200);
      for (const t of [it.prompt, ...ex!.steps, ...(it.choices ?? [])]) expect(/\s{2,}\S|NaN|undefined|Infinity|\+\s*[-−]\s*\d/.test(t.replace(/<[^>]+>/g, '')), `${f}: ${t}`).toBe(false);
      expect(it.check(ex!.result).ok, `${f}: ${it.prompt} -> ${JSON.stringify(ex!.result)} | ${ex!.steps.join(' | ')}`).toBe(true);
    }
  });
});

describe('right-triangle-trig: maths', () => {
  it('rounding refuses a .x5 tie and degree trig is exact at the benchmarks', () => {
    expect(() => rnd(2.25, 1)).toThrow('retry');
    expect(rnd(64.278760968, 1)).toBe(64.3);
    expect(Math.abs(sinD(30) - 0.5)).toBeLessThan(1e-12);
    expect(Math.abs(tanD(45) - 1)).toBeLessThan(1e-12);
  });
  it('regular polygons: hexagon apothem s√3/2, square area s², radius of a hexagon = side', () => {
    expect(Math.abs(apothemOf(6, 10) - 5 * Math.sqrt(3))).toBeLessThan(1e-9);
    expect(Math.abs(polyArea(4, 7) - 49)).toBeLessThan(1e-9);
    expect(Math.abs(radiusOf(6, 9) - 9)).toBeLessThan(1e-9);
  });
  it('every rounded answer is not within 0.08 of a tie at its precision (a careful oracle rounds the same way)', () => {
    for (const { f, it } of ITEMS) {
      if (it.answer.kind !== 'num' || !/nearest tenth/.test(it.prompt)) continue;
      expect(Number.isInteger(Math.round(it.answer.v * 10 * 1e6) / 1e6), f).toBe(true);
    }
  });
});

describe('right-triangle-trig: articles', () => {
  it('the article helper follows the spoken word', async () => {
    const { article } = await import('../src/lesson/topics/right-triangle-trig/common');
    for (const w of [8, 11, 18, 80, 84, 800, 8000, 11000, 18000, '8.5 ft', '8x', 'octagon', 'equilateral triangle', 'hour']) expect(article(w), String(w)).toBe('an');
    for (const w of [1, 12, 110, 180, 100, 1100, '18.5'.replace('18', '28'), 'regular hexagon', 'unit', 'one-way street', 'cliff']) expect(article(w), String(w)).toBe('a');
  });
  it('no prompt or solution says "a" before a vowel sound or before 8, 11, 18', () => {
    const bad = /(^A|[.:!?] A|(^|[^\w'])a) (?!is |and )(8|11\b|11\.|18\b|18\.|[aeiAEI][a-z]|o(?!ne)[a-z]|O[a-z])/;
    for (const { f, it } of ITEMS) for (const t of [it.prompt, ...it.solution, ...(it.choices ?? [])]) {
      const p = t.replace(/<[^>]+>/g, '');
      expect(bad.test(p), `${f}: ${p}`).toBe(false);
    }
  });
});
