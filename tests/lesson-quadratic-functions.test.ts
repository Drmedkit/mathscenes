// lesson-quadratic-functions: the generic checks (every family x every sub-goal it serves x 300 seeds). Add topic checks below.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { explain } from '../src/lesson/topics/quadratic-functions/explain';
import { planeParams } from '../src/lesson/topics/quadratic-functions/pic';
import { fromV, fromZ, vertexOf, zerosOf, val, win, sameStd, type Std } from '../src/lesson/topics/quadratic-functions/qf';
import type { QItem, GItem } from '../src/lesson/topics/quadratic-functions/common';
import fs from 'node:fs';
import { rng } from '../src/lesson/runtime/item';
import { GENERATORS } from '../src/lesson/topics/quadratic-functions/items';
import { PLAN } from '../src/lesson/topics/quadratic-functions/plan';

const TOPIC = { subgoals: [...new Map(["secondary-t6-11-quadratic-functions-graphing-and-key-features"].flatMap(i => JSON.parse(fs.readFileSync(`../math-curriculum-essentials/topics/${i}.json`, 'utf8')).subgoals).map((s: { id: string }) => [s.id, s] as const)).values()] };
const CATALOG = new Set<string>(JSON.parse(fs.readFileSync('../math-curriculum-essentials/misconceptions.json', 'utf8')).misconceptions.map((m: { id: string }) => m.id));
const GEN = GENERATORS as Record<string, (R: () => number, n: number, sg?: string) => import('../src/lesson/runtime/item').Item>;

describe('quadratic-functions: plan', () => {
  it('walks through every sub-goal of the topic JSON, in order, each with a family', () => {
    expect(PLAN.map(p => p.id)).toEqual(TOPIC.subgoals.map((s: { id: string }) => s.id));
    for (const p of PLAN) { expect(p.families.length, p.id).toBeGreaterThan(0); for (const f of p.families) expect(GEN[f], f).toBeDefined(); }
  });
});

describe('quadratic-functions: families', () => {
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

// ---------------- topic checks ----------------
let Plane: typeof import('../src/lesson/kit/Plane').Plane;
let FR: import('../src/blocks/block').Frame, dusk: import('../src/core/theme').Theme;
beforeAll(async () => {
  (globalThis as unknown as { document: unknown }).document = { createElement: () => ({ getContext: () => null }) };
  ({ Plane } = await import('../src/lesson/kit/Plane'));
  FR = (await import('../src/blocks/block')).frame(40, 70, 780, 940);
  dusk = (await import('../src/lesson/dusk')).dusk;
});
const near = (a: number, b: number) => Math.abs(a - b) < 1e-6;
const curveOf = (it: QItem, key = 'f'): Std | null => {
  const g = it.picture?.g; if (!g) return null;
  const c = [...g.show, ...g.reveal].find((i): i is Extract<GItem, { kind: 'curve' }> => i.kind === 'curve' && i.key === key);
  return c ? c.s : null;
};

describe('quadratic-functions: maths', () => {
  it('forms convert to standard form, and the vertex and zeros come back', () => {
    for (const [a, h, k] of [[1, 2, -9], [-2, -1.5, 4], [0.5, 3, 0], [3, 0, 5]] as const) {
      const s = fromV(a, h, k); expect(vertexOf(s)[0]).toBeCloseTo(h, 9); expect(vertexOf(s)[1]).toBeCloseTo(k, 9);
    }
    expect(zerosOf(fromZ(2, -1, 5))).toEqual([-1, 5]);
    expect(zerosOf(fromV(1, 3, 0))).toEqual([3]);
    expect(zerosOf(fromV(1, 3, 2))).toEqual([]);
    expect(sameStd(fromZ(1, -1, 5), fromV(1, 2, -9))).toBe(true);
  });
  it('a window holds its values with room, 6-14 cells', () => {
    for (const vs of [[-1, 5, 2], [-9, 0, 24], [0.5, 1.5], [-120, 3000]]) {
      const [lo, hi, st] = win(vs); const nC = Math.round((hi - lo) / st);
      expect(nC).toBeGreaterThanOrEqual(6); expect(nC).toBeLessThanOrEqual(14);
      for (const v of vs) { expect(v).toBeGreaterThan(lo); expect(v).toBeLessThan(hi); }
    }
  });
});

const DROPPED = new Map<string, number>();
describe('quadratic-functions: every practice item reads', () => {
  afterAll(() => { if (DROPPED.size) console.log('dropped labels (family:key x count of 150):', [...DROPPED].map(([k, v]) => `${k} x${v}`).join(', ')); });
  for (const p of PLAN) for (const f of p.families) {
    it(`${p.id} / ${f}: picture builds on the Plane, steps arrive at the answer`, () => {
      for (let s = 1; s <= 150; s++) {
        const it0 = GEN[f]!(rng(s * 53 + 11), s, p.id) as QItem;
        const ex = explain(it0);
        expect(ex, `${f}: no steps for ${it0.prompt}`).not.toBeNull();
        expect(it0.check(ex!.result).ok, `${f}: steps end on ${JSON.stringify(ex!.result)} for ${it0.prompt}`).toBe(true);
        const g = it0.picture?.g;
        expect(g, `${f}: every item has a picture`).toBeDefined();
        // no empty plane before the answer: a slate, or something on the plane from the start
        if (!g!.slate) expect(g!.show.length, `${f}: empty graph before the answer`).toBeGreaterThan(0);
        let B: ReturnType<typeof Plane>;
        try { B = Plane(planeParams(g!), FR, dusk); } catch (e) { throw new Error(`${f} seed ${s}: ${(e as Error).message} | ${it0.prompt}`); }
        if (f === 'whichGraph') expect(B.dropped.filter(k => k.startsWith('g')), `${f}: a graph letter has no room`).toEqual([]);
        for (const k of B.dropped) DROPPED.set(`${f}:${k}`, (DROPPED.get(`${f}:${k}`) ?? 0) + 1);
      }
    });
  }
});

describe('quadratic-functions: answers agree with the pictured function', () => {
  const R = (s: number) => rng(s * 97 + 3);
  it('vertex items: the answer is the vertex of the curve', () => {
    for (const f of ['vertexRead', 'vfVertex', 'facVertex']) for (let s = 1; s <= 200; s++) {
      const it0 = GEN[f]!(R(s), s) as QItem, c = curveOf(it0)!, a = it0.answer as { x: number; y: number };
      const [h, k] = vertexOf(c); expect(near(a.x, h) && near(a.y, k), `${f} ${it0.prompt}`).toBe(true);
    }
  });
  it('zero items: the answer is the set of real zeros of the curve', () => {
    for (const f of ['zerosRead', 'facZeros', 'sqrtZeros', 'factorZeros']) for (let s = 1; s <= 200; s++) {
      const it0 = GEN[f]!(R(s), s) as QItem, c = curveOf(it0)!, a = it0.answer as { x: number; y: number }, z = zerosOf(c);
      expect(z.length, `${f} ${it0.prompt}`).toBe(2);
      expect((near(a.x, z[0]!) && near(a.y, z[1]!)) || (near(a.x, z[1]!) && near(a.y, z[0]!)), `${f} ${it0.prompt}`).toBe(true);
    }
  });
  it('y-intercept, axis and extreme-value items agree with f(0), −b/(2a) and f(h)', () => {
    for (let s = 1; s <= 200; s++) {
      const y = GEN.yInt!(R(s), s) as QItem; expect(near((y.answer as { v: number }).v, val(curveOf(y)!, 0))).toBe(true);
      const ax = GEN.stdAxis!(R(s), s) as QItem; expect(near((ax.answer as { v: number }).v, vertexOf(curveOf(ax)!)[0])).toBe(true);
      const c = GEN.csMin!(R(s), s) as QItem; expect(near((c.answer as { v: number }).v, vertexOf(curveOf(c)!)[1])).toBe(true);
    }
  });
  it('the count of zeros matches the curve', () => {
    for (const f of ['zeroCount', 'countZeros']) for (let s = 1; s <= 200; s++) {
      const it0 = GEN[f]!(R(s), s) as QItem, n = zerosOf(curveOf(it0)!).length;
      const right = it0.choices![(it0.answer as { i: number }).i]!;
      expect(right.startsWith(['no', 'one', 'two'][n]!), `${f}: ${right} vs ${n}`).toBe(true);
    }
  });
});

describe('quadratic-functions: typical slips are classified', () => {
  const pairMc = (f: string, sg: string, slip: (it: QItem) => [number, number] | null, mc: string) => {
    let hit = 0;
    for (let s = 1; s <= 200; s++) {
      const it0 = GEN[f]!(rng(s * 7 + 1), s, sg) as QItem, w = slip(it0);
      if (!w) continue;
      const v = it0.check({ kind: 'pair', x: w[0], y: w[1] });
      if (v.ok) continue;
      expect(v.mc, `${f}: ${it0.prompt} ${w}`).toBe(mc); hit++;
    }
    expect(hit).toBeGreaterThan(20);
  };
  it('vertex form read with the wrong sign of h', () => pairMc('vfVertex', 'vertex-form-read', it => { const a = it.answer as { x: number; y: number }; return a.x !== 0 ? [-a.x, a.y] : null; }, 'mc.quadratic-polynomial.wrong-sign-zero-factor'));
  it('±√q reported as the zeros (forgets h)', () => pairMc('sqrtZeros', 'zeros-by-square-roots', it => { const a = it.answer as { x: number; y: number }, r = Math.abs(a.x - a.y) / 2; return [r, -r]; }, 'mc.quadratic-polynomial.forgets-to-add-h'));
  it('the factored vertex at height 0', () => pairMc('facVertex', 'factored-form-vertex', it => { const a = it.answer as { x: number; y: number }; return a.y !== 0 ? [a.x, 0] : null; }, 'mc.quadratic-polynomial.factored-vertex-height-a-or-zero'));
  it('num slips: axis without the minus, the negative zero of a projectile, the vertex outside the domain', () => {
    let n1 = 0, n2 = 0, n3 = 0;
    for (let s = 1; s <= 300; s++) {
      const ax = GEN.stdAxis!(rng(s), s) as QItem, h = (ax.answer as { v: number }).v;
      if (h !== 0) { expect(ax.check({ kind: 'num', v: -h }).mc).toBe('mc.quadratic-polynomial.vertex-formula-misremembered'); n1++; }
      const pr = GEN.projectile!(rng(s), s) as QItem;
      if (/hit the ground/.test(pr.prompt)) { const neg = pr.prompt.includes('<i>t</i> + 1)') && pr.prompt.includes('(2<i>t</i>') ? -0.5 : -1; expect(pr.check({ kind: 'num', v: neg }).mc, pr.prompt).toBe('mc.functions-concept.context-domain-all-reals'); n2++; }
      const pm = GEN.penMax!(rng(s), s) as QItem;
      if (/only \d+ ft long/.test(pm.prompt)) { const L = Number(pm.prompt.match(/has (\d+) ft/)![1]); const v = pm.check({ kind: 'num', v: L * L / 8 }); if (!v.ok) { expect(v.mc).toBe('mc.functions-concept.infeasible-vertex-as-optimum'); n3++; } }
    }
    expect(n1).toBeGreaterThan(50); expect(n2).toBeGreaterThan(10); expect(n3).toBeGreaterThan(5);
  });
});
