// lesson-linear-models: the generic checks (every family x every sub-goal it serves x 300 seeds). Add topic checks below.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { rng } from '../src/lesson/runtime/item';
import { GENERATORS } from '../src/lesson/topics/linear-models/items';
import { PLAN } from '../src/lesson/topics/linear-models/plan';

const TOPIC = { subgoals: [...new Map(["secondary-t6-32-writing-linear-equations-from-context"].flatMap(i => JSON.parse(fs.readFileSync(`../math-curriculum-essentials/topics/${i}.json`, 'utf8')).subgoals).map((s: { id: string }) => [s.id, s] as const)).values()] };
const CATALOG = new Set<string>(JSON.parse(fs.readFileSync('../math-curriculum-essentials/misconceptions.json', 'utf8')).misconceptions.map((m: { id: string }) => m.id));
const GEN = GENERATORS as Record<string, (R: () => number, n: number, sg?: string) => import('../src/lesson/runtime/item').Item>;

describe('linear-models: plan', () => {
  it('walks through every sub-goal of the topic JSON, in order, each with a family', () => {
    expect(PLAN.map(p => p.id)).toEqual(TOPIC.subgoals.map((s: { id: string }) => s.id));
    for (const p of PLAN) { expect(p.families.length, p.id).toBeGreaterThan(0); for (const f of p.families) expect(GEN[f], f).toBeDefined(); }
  });
});

describe('linear-models: families', () => {
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
import { type LItem, MC } from '../src/lesson/topics/linear-models/items';
import { explain } from '../src/lesson/topics/linear-models/explain';
import { LINES } from '../src/lesson/topics/linear-models/script';
import { PLACEMENT } from '../src/lesson/topics/linear-models/placement';
import { DEC, INC, at, modelT } from '../src/lesson/topics/linear-models/contexts';

const all = (n = 120): LItem[] => PLAN.flatMap(p => p.families.flatMap(f => Array.from({ length: n }, (_, s) => GEN[f]!(rng(s * 97 + 3), s, p.id) as LItem)));
const sameResp = (a: import('../src/lesson/runtime/item').Response, b: import('../src/lesson/runtime/item').Response) =>
  a.kind === b.kind && (a.kind === 'choice' ? a.i === (b as typeof a).i : a.kind === 'num' ? Math.abs(a.v - (b as typeof a).v) < 1e-6 : a.kind === 'pair' ? Math.abs(a.x - (b as typeof a).x) < 1e-6 && Math.abs(a.y - (b as typeof a).y) < 1e-6 : true);

describe('linear-models: contexts', () => {
  it('every context is a real constant-rate story with sane numbers', () => {
    for (let s = 1; s <= 200; s++) for (const mk of [...Object.values(INC), ...Object.values(DEC)]) {
      const C = mk(rng(s));
      expect(C.b, C.key).toBeGreaterThanOrEqual(0);
      expect(C.m !== 0, C.key).toBe(true);
      // rates are quarters: money stays in exact cents
      expect(Number.isInteger(C.m * 4), `${C.key} ${C.m}`).toBe(true);
      if (C.m < 0) { const E = C.b / -C.m; expect(Math.abs(E * 100 - Math.round(E * 100)) < 1e-9 || C.discrete, `${C.key}: runs out at ${E}`).toBe(true); }
      expect(at(C, 2)).toBeCloseTo(C.m * 2 + C.b);
    }
  });
});

describe('linear-models: items', () => {
  beforeAll(async () => { await texReady(); });
  it('boards and worked TeX typeset', () => {
    for (const it of all(40)) { expect(() => tex(it.board), it.board).not.toThrow(); for (const t of it.picture?.tex ?? []) expect(() => tex(t), t).not.toThrow(); }
    for (let s = 1; s <= 20; s++) for (const mk of [...Object.values(INC), ...Object.values(DEC)]) expect(() => tex(modelT(mk(rng(s))))).not.toThrow();
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
      expect(nx >= 2 && nx <= 20 && ny >= 2 && ny <= 20 && Math.abs(nx - Math.round(nx)) < 1e-9 && Math.abs(ny - Math.round(ny)) < 1e-9, `${it.family} ${nx} x ${ny}`).toBe(true);
      const keys = new Set(g.items.map(i => i.key));
      // the practice board uses the step keys B and T0, T1, ...: a picture item with one of them would appear with it
      for (const k of keys) expect(k === 'B' || /^T\d/.test(k), `${it.family}: item key ${k} clashes with the board`).toBe(false);
      expect(/(^|[^\\a-z])(le|ge)\s/.test(it.board), `${it.family}: ${it.board}`).toBe(false);
      for (const k of [...g.show, ...g.solve]) if (k !== 'axes') expect(keys.has(k), `${it.family}: step ${k}`).toBe(true);
      const inside = (x: number, y: number) => x >= g.x.min - 1e-9 && x <= g.x.max + 1e-9 && y >= g.y.min - 1e-9 && y <= g.y.max + 1e-9;
      for (const i of g.items) {
        if (i.kind === 'point') expect(inside(i.x, i.y), `${it.family}: ${i.key} (${i.x}, ${i.y}) in ${JSON.stringify([g.x, g.y])}`).toBe(true);
        if (i.kind === 'dots') for (const x of i.xs) expect(inside(x, i.m * x + i.b), `${it.family}: dot ${x} in ${JSON.stringify([g.x, g.y])}`).toBe(true);
        if (i.kind === 'hline') expect(i.y >= g.y.min && i.y <= g.y.max, `${it.family}: y = ${i.y}`).toBe(true);
        if (i.kind === 'vline') expect(i.x >= g.x.min && i.x <= g.x.max, `${it.family}: x = ${i.x}`).toBe(true);
        if (i.kind === 'seg') expect(inside(...i.a) && inside(...i.b), `${it.family}: seg ${i.key}`).toBe(true);
        if (i.kind === 'line') { const lo = Math.max(g.x.min, i.lo ?? g.x.min), hi = Math.min(g.x.max, i.hi ?? g.x.max); const ys = [lo, hi].map(x => i.m * x + i.b); expect(ys.some(y => y >= g.y.min - 1e-9 && y <= g.y.max + 1e-9), `${it.family}: line ${i.key} misses the window`).toBe(true); }
      }
    }
  });
  it('restriction pictures are sane', () => {
    for (const it of all(120)) {
      const r = it.picture?.r;
      if (!r) continue;
      const n = (r.max - r.min) / r.step;
      expect(n >= 4 && n <= 20 && Number.isInteger(n), `${it.family} ${n}`).toBe(true);
      for (const row of [...r.rows, r.result]) for (const e of [row.lo, row.hi]) if (e) expect(e.v >= r.min && e.v <= r.max, `${it.family}: ${e.v}`).toBe(true);
    }
  });
  it('most items show a picture', () => {
    const its = all(60), withPic = its.filter(i => i.picture?.g || i.picture?.t || i.picture?.r).length;
    expect(withPic / its.length).toBeGreaterThan(0.7);
  });
  it('the topic misconceptions are diagnosed somewhere in practice', () => {
    const seen = new Set<string>();
    for (const it of all(200)) {
      if (it.choices) it.choices.forEach((_, i) => { const m = it.check({ kind: 'choice', i }).mc; if (m) seen.add(m); });
      for (const r of it.slips ?? []) { const m = it.check(r).mc; if (m) seen.add(m); }
    }
    const topic = new Set<string>((TOPIC.subgoals as { misconceptions?: string[] }[]).flatMap(s => s.misconceptions ?? []));
    const missing = [...topic].filter(m => !seen.has(m));
    for (const m of seen) expect(CATALOG.has(m), m).toBe(true);
    for (const m of Object.values(MC)) expect(CATALOG.has(m), m).toBe(true);
    expect(missing, `not diagnosed: ${missing.join(', ')}`).toEqual([]);
  });
  it('texts are clean (no undefined, NaN, "+ −3", double spaces, float noise)', () => {
    const BAD = /\(undefined|undefined[,)]|NaN|\[object|Infinity|\+\s*[-−]\s*\d|\s{2,}\S|−\s*−|\d\.\d{4,}/;
    const clean = (h: string) => h.replace(/<[^>]+>/g, '');
    for (const it of all(80)) for (const t of [it.prompt, ...(it.choices ?? []), ...it.solution]) expect(clean(t), `${it.family}: ${t}`).not.toMatch(BAD);
  });
  it('money in the text is whole cents', () => {
    for (const it of all(80)) for (const t of [it.prompt, ...(it.choices ?? []), ...it.solution]) {
      for (const m of t.matchAll(/\$(\d+(?:\.\d+)?)/g)) expect(/^\d+(\.\d\d)?$/.test(m[1]!), `${it.family}: ${m[0]} in ${t}`).toBe(true);
    }
  });
  it('whole-number boundaries go in the direction the story needs', () => {
    for (let s = 1; s <= 300; s++) for (const f of ['wholeBoundary', 'boundaryWhy'] as const) {
      const it = GEN[f]!(rng(s), s) as LItem;
      const ineq = it.board.replace('\\le', '<=').replace('\\ge', '>=');
      const m = ineq.match(/^([\d.]+)[a-z](?: ([+-]) (\d+))? (<=|>=|>) (\d+)$/);
      expect(m, ineq).not.toBeNull();
      const f1 = (x: number) => Number(m![1]) * x + (m![2] ? (m![2] === '+' ? 1 : -1) * Number(m![3]) : 0), T = Number(m![5]);
      const ok = (x: number) => (m![4] === '<=' ? f1(x) <= T + 1e-9 : m![4] === '>=' ? f1(x) >= T - 1e-9 : f1(x) > T + 1e-9);
      const ans = f === 'wholeBoundary' ? (it.answer as { v: number }).v : Number(it.choices![(it.answer as { i: number }).i]!.split(',')[0]);
      expect(ok(ans), `${ineq}: ${ans}`).toBe(true);
      expect(ok(m![4] === '<=' ? ans + 1 : ans - 1), `${ineq}: neighbour of ${ans}`).toBe(false);
    }
  });
  it('exact totals: "yes" only when a whole number of items hits the total', () => {
    for (let s = 1; s <= 300; s++) {
      const it = GEN.reachable!(rng(s), s) as LItem;
      const right = it.choices![(it.answer as { i: number }).i]!;
      expect(right.startsWith('$'), right).toBe(true);
    }
  });
  it('lines.json matches script.ts, and spoken text has no digits or symbols', () => {
    const lines = JSON.parse(fs.readFileSync('pages/lessons/linear-models/voice/lines.json', 'utf8')) as Record<string, { text: string }>;
    expect(Object.keys(lines).sort()).toEqual(Object.keys(LINES).sort());
    for (const [k, v] of Object.entries(LINES)) {
      expect(lines[k]!.text, k).toBe(v.say);
      expect(v.say, k).not.toMatch(/[0-9=+÷×−<>/√%$≤≥]/);
    }
  });
  it('the check-in picks exist in the plan', () => {
    for (const p of PLACEMENT.picks) expect(PLAN.find(s => s.id === p.subgoal)?.families, p.family).toContain(p.family);
  });
});
