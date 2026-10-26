// lesson-linear-functions-slope: the generic checks (every family x every sub-goal it serves x 300 seeds). Add topic checks below.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { rng } from '../src/lesson/runtime/item';
import { GENERATORS } from '../src/lesson/topics/linear-functions-slope/items';
import { PLAN } from '../src/lesson/topics/linear-functions-slope/plan';

const TOPIC = { subgoals: [...new Map(["secondary-t6-09-linear-functions-and-slope"].flatMap(i => JSON.parse(fs.readFileSync(`../math-curriculum-essentials/topics/${i}.json`, 'utf8')).subgoals).map((s: { id: string }) => [s.id, s] as const)).values()] };
const CATALOG = new Set<string>(JSON.parse(fs.readFileSync('../math-curriculum-essentials/misconceptions.json', 'utf8')).misconceptions.map((m: { id: string }) => m.id));
const GEN = GENERATORS as Record<string, (R: () => number, n: number, sg?: string) => import('../src/lesson/runtime/item').Item>;

describe('linear-functions-slope: plan', () => {
  it('walks through every sub-goal of the topic JSON, in order, each with a family', () => {
    expect(PLAN.map(p => p.id)).toEqual(TOPIC.subgoals.map((s: { id: string }) => s.id));
    for (const p of PLAN) { expect(p.families.length, p.id).toBeGreaterThan(0); for (const f of p.families) expect(GEN[f], f).toBeDefined(); }
  });
});

describe('linear-functions-slope: families', () => {
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
import { beforeAll } from 'vitest';
import { tex, texReady } from '../src/core/tex';
import { explain } from '../src/lesson/topics/linear-functions-slope/explain';
import { MC, type LItem } from '../src/lesson/topics/linear-functions-slope/items';
import { q, slope, stdOf, zeroOf, through, at, psT, siT, stdT, qEq } from '../src/lesson/topics/linear-functions-slope/lineMaths';
import { LINES } from '../src/lesson/topics/linear-functions-slope/script';
import { PLACEMENT } from '../src/lesson/topics/linear-functions-slope/placement';

const all = (n = 120): LItem[] => PLAN.flatMap(p => p.families.flatMap(f => Array.from({ length: n }, (_, s) => GEN[f]!(rng(s * 97 + 3), s, p.id) as LItem)));
const sameResp = (a: import('../src/lesson/runtime/item').Response, b: import('../src/lesson/runtime/item').Response) =>
  a.kind === b.kind && (a.kind === 'choice' ? a.i === (b as typeof a).i : a.kind === 'num' ? Math.abs(a.v - (b as typeof a).v) < 1e-6 : a.kind === 'pair' ? Math.abs(a.x - (b as typeof a).x) < 1e-6 && Math.abs(a.y - (b as typeof a).y) < 1e-6 : true);

describe('linear-functions-slope: maths', () => {
  it('slope, intercepts and the three forms agree', () => {
    expect(slope([-2, 7], [4, -2])).toEqual(q(-3, 2));
    expect(slope([4, -2], [-2, 7])).toEqual(q(-3, 2));
    expect(slope([2, 5], [2, -1])).toBeNull();
    const L = through(q(-3, 2), [-2, 7]);
    expect(qEq(L.b, q(4))).toBe(true);
    expect(stdOf(L)).toEqual({ A: 3, B: 2, C: 8 });
    expect(zeroOf(L)).toEqual(q(8, 3));
    expect(zeroOf({ m: q(0), b: q(3) })).toBe('none');
    expect(zeroOf({ m: q(0), b: q(0) })).toBe('all');
    expect(at(L, 4)).toBe(-2);
    expect(psT(q(-2), q(1), q(-3))).toBe('y + 3 = -2(x - 1)');
    expect(siT(q(-1), q(0))).toBe('y = -x');
    expect(stdT({ A: 2, B: -1, C: -3 })).toBe('2x - y = -3');
  });
});

describe('linear-functions-slope: items', () => {
  beforeAll(async () => { await texReady(); });
  it('boards and worked TeX typeset', () => {
    for (const it of all(40)) { expect(() => tex(it.board), it.board).not.toThrow(); for (const t of it.picture?.tex ?? []) expect(() => tex(t), t).not.toThrow(); }
  });
  it('the worked steps arrive at the item answer', () => {
    for (const it of all(150)) {
      const ex = explain(it);
      expect(ex, `${it.family} ${it.prompt}`).not.toBeNull();
      expect(sameResp(ex!.result, it.answer), `${it.family}: ${JSON.stringify(ex!.result)} vs ${JSON.stringify(it.answer)} | ${it.solution.join(' / ')}`).toBe(true);
    }
  });
  it('plane pictures are sane (grid size, keys, points inside the window)', () => {
    for (const it of all(120)) {
      const g = it.picture?.g;
      if (!g) continue;
      const nx = (g.x.max - g.x.min) / g.x.step, ny = (g.y.max - g.y.min) / g.y.step;
      expect(nx >= 2 && nx <= 20 && ny >= 2 && ny <= 20, `${it.family} ${nx} x ${ny}`).toBe(true);
      const keys = new Set(g.items.map(i => i.key));
      for (const k of [...g.show, ...g.solve]) if (k !== 'axes') expect(keys.has(k), `${it.family}: step ${k}`).toBe(true);
      for (const i of g.items) if (i.kind === 'point') expect(i.x >= g.x.min && i.x <= g.x.max && i.y >= g.y.min && i.y <= g.y.max, `${it.family}: ${i.key} (${i.x}, ${i.y}) in ${JSON.stringify([g.x, g.y])}`).toBe(true);
    }
  });
  it('most items show a picture', () => {
    const its = all(60), withPic = its.filter(i => i.picture?.g || i.picture?.t || i.picture?.n).length;
    expect(withPic / its.length).toBeGreaterThan(0.7);
  });
  it('the topic misconceptions are diagnosed somewhere in practice', () => {
    const seen = new Set<string>();
    for (const it of all(200)) {
      if (it.choices) it.choices.forEach((_, i) => { const m = it.check({ kind: 'choice', i }).mc; if (m) seen.add(m); });
    }
    // number and pair slips: the typical wrong responses each item carries
    for (const it of all(200)) for (const r of it.slips ?? []) { const m = it.check(r).mc; if (m) seen.add(m); }
    const topic = new Set<string>((TOPIC.subgoals as { misconceptions?: string[] }[]).flatMap(s => s.misconceptions ?? []));
    const missing = [...topic].filter(m => !seen.has(m));
    for (const m of seen) expect(CATALOG.has(m), m).toBe(true);
    expect(missing.length, `not diagnosed: ${missing.join(', ')}`).toBeLessThanOrEqual(4);
    void MC;
  });
  it('texts are clean (no undefined, NaN, "+ −3", double spaces)', () => {
    const BAD = /\(undefined|undefined[,)]|NaN|\[object|Infinity|\+\s*[-−]\s*\d|\s{2,}\S|−\s*−/;
    const clean = (h: string) => h.replace(/<[^>]+>/g, '');
    for (const it of all(80)) for (const t of [it.prompt, ...(it.choices ?? []), ...it.solution]) expect(clean(t), `${it.family}: ${t}`).not.toMatch(BAD);
  });
  it('lines.json matches script.ts, and spoken text has no digits or symbols', () => {
    const lines = JSON.parse(fs.readFileSync('pages/lessons/linear-functions-slope/voice/lines.json', 'utf8')) as Record<string, { text: string }>;
    expect(Object.keys(lines).sort()).toEqual(Object.keys(LINES).sort());
    for (const [k, v] of Object.entries(LINES)) {
      expect(lines[k]!.text, k).toBe(v.say);
      expect(v.say, k).not.toMatch(/[0-9=+÷×−<>/√%$]/);
    }
  });
  it('the check-in picks exist in the plan', () => {
    for (const p of PLACEMENT.picks) expect(PLAN.find(s => s.id === p.subgoal)?.families, p.family).toContain(p.family);
  });
});
