// lesson-function-families: the generic checks (every family x every sub-goal it serves x 300 seeds). Add topic checks below.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { rng } from '../src/lesson/runtime/item';
import { GENERATORS } from '../src/lesson/topics/function-families/items';
import { PLAN } from '../src/lesson/topics/function-families/plan';

const TOPIC = { subgoals: [...new Map(["secondary-t6-34-function-families-overview"].flatMap(i => JSON.parse(fs.readFileSync(`../math-curriculum-essentials/topics/${i}.json`, 'utf8')).subgoals).map((s: { id: string }) => [s.id, s] as const)).values()] };
const CATALOG = new Set<string>(JSON.parse(fs.readFileSync('../math-curriculum-essentials/misconceptions.json', 'utf8')).misconceptions.map((m: { id: string }) => m.id));
const GEN = GENERATORS as Record<string, (R: () => number, n: number, sg?: string) => import('../src/lesson/runtime/item').Item>;

describe('function-families: plan', () => {
  it('walks through every sub-goal of the topic JSON, in order, each with a family', () => {
    expect(PLAN.map(p => p.id)).toEqual(TOPIC.subgoals.map((s: { id: string }) => s.id));
    for (const p of PLAN) { expect(p.families.length, p.id).toBeGreaterThan(0); for (const f of p.families) expect(GEN[f], f).toBeDefined(); }
  });
});

describe('function-families: families', () => {
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
        // like tools/quality/sweep.mjs: a new picture (another table, another graph) is a new item
        seen.add(item.prompt + '|' + item.board + '|' + (item.choices ?? []).join('|') + '|' + JSON.stringify(item.picture ?? null));
      }
      expect(seen.size, 'distinct items').toBeGreaterThan(12);
    });
  }
});

// ---------- topic checks ----------
import { beforeAll } from 'vitest';
import { classify, d2, famOf, fits, rts } from '../src/lesson/topics/function-families/ff';
import { SCRIPT } from '../src/lesson/topics/function-families/script';
import { stepsFrom } from '../src/lesson/runtime/explain';
import { planeParams, tableParams } from '../src/lesson/topics/function-families/pictures';
import type { QItem } from '../src/lesson/topics/function-families/common';

let Plane: typeof import('../src/lesson/kit/Plane').Plane;
let DiffTable: typeof import('../src/lesson/topics/function-families/DiffTable').DiffTable;
let FR: import('../src/blocks/block').Frame, dusk: import('../src/core/theme').Theme;
beforeAll(async () => {
  (globalThis as unknown as { document: unknown }).document = { createElement: () => ({ getContext: () => null }) };
  ({ Plane } = await import('../src/lesson/kit/Plane'));
  ({ DiffTable } = await import('../src/lesson/topics/function-families/DiffTable'));
  FR = (await import('../src/blocks/block')).frame(60, 70, 940, 940);
  dusk = (await import('../src/lesson/dusk')).dusk;
});

describe('function-families: maths', () => {
  it('the three tests in sequence, with their restrictions', () => {
    const xs = [0, 1, 2, 3, 4];
    expect(classify(xs, [2, 4, 8, 14, 22])).toBe('quadratic');
    expect(classify([0, 2, 4, 6, 8], [3, 6, 12, 24, 48])).toBe('exponential');
    expect(classify(xs, [5, 5, 5, 5, 5])).toBe('linear');          // constant: linear only
    expect(classify(xs, [0, 0, 0, 0, 0])).toBe('linear');
    expect(classify(xs, [0, 3, 4, 3, 0])).toBe('quadratic');       // zero outputs: difference tests still apply
    expect(classify(xs, [0, 1, 8, 27, 64])).toBe('none');
    expect(classify(xs, [-100, -85, -72.25, -61.4125, -52.200625])).toBe('exponential');
    expect(classify(xs, [2, -4, 8, -16, 32])).toBe('none');        // a negative ratio is not b > 0
    expect(classify([0, 1, 3, 4], [1, 2, 8, 16])).toBe('unequal');
    expect(d2([2, 4, 8, 14, 22])).toEqual([2, 2, 2]);
    expect(rts([0, 4, 8])).toEqual([null, 2]);
    expect(fits(xs, [2, 4, 8, 14, 22])).toEqual(['quadratic']);
    expect(fits([0, 1, 2], [1, 2, 4]).sort()).toEqual(['exponential', 'quadratic']);   // three points do not decide
  });
  it('the lesson’s own numbers', () => {
    const g = (x: number) => 3 * x + 1 + x * (x - 1) * (x - 2) * (x - 3) * (x - 4) / 4;
    expect([0, 1, 2, 3, 4].map(g)).toEqual([1, 4, 7, 10, 13]);
    expect(g(5)).toBe(46);
    expect([0, 1, 2, 3, 4].map(x => x * x + x + 2)).toEqual([2, 4, 8, 14, 22]);
  });
});

describe('function-families: voice', () => {
  it('every panel line has a spoken text without digits or symbols, and lines.json matches', () => {
    const lines = JSON.parse(fs.readFileSync('pages/lessons/function-families/voice/lines.json', 'utf8')) as Record<string, { text: string }>;
    for (const [id, L] of Object.entries(SCRIPT)) {
      expect(L.say, id).not.toMatch(/[0-9$%×÷=<>+]/);
      expect(lines[id]?.text, id).toBe(L.say);
    }
  });
});

const all = (): { sg: string; f: string; it: QItem }[] => {
  const out: { sg: string; f: string; it: QItem }[] = [];
  for (const p of PLAN) for (const f of p.families) for (let s = 1; s <= 120; s++) out.push({ sg: p.id, f, it: GEN[f]!(rng(s * 97 + 3), s, p.id) as QItem });
  return out;
};
describe('function-families: pictures, tables and steps', () => {
  it('every table picture of a family test holds exactly one family (or none), and the x-steps match its claim', () => {
    for (const { f, it } of all()) {
      const t = it.picture?.t;
      if (!t || t.cols.length !== 1 || t.xs.length < 4) continue;
      const xs = t.xs.map(Number), ys = t.cols[0]!.vals.map((v, i) => Number((v ?? t.cols[0]!.reveal![i]!).replace(/,/g, '').replace('−', '-')));
      if (xs.some(Number.isNaN) || ys.some(Number.isNaN)) continue;
      const eqSteps = classify(xs, ys) !== 'unequal';
      if (!eqSteps) continue;
      const F = fits(xs, ys), fam = famOf(ys);
      expect(F.length, `${f}: ${ys.join(', ')} fits ${F.join(' and ')}`).toBeLessThanOrEqual(1);
      if (fam !== 'none') expect(F, `${f}: ${ys.join(', ')}`).toEqual([fam]);
    }
  });
  it('every picture builds (DiffTable in the model frame, Plane in the model frame)', () => {
    for (const { f, it } of all()) {
      const P = it.picture;
      if (P?.t) {
        let ok = false, last = '';
        for (const size of [60, 56, 52]) { try { DiffTable(tableParams(P.t, size), FR, dusk); ok = true; break; } catch (e) { last = (e as Error).message; } }
        expect(ok, `${f}: ${last} | ${it.prompt}`).toBe(true);
      }
      if (P?.g) {
        try { Plane(planeParams(P.g), FR, dusk); } catch (e) { throw new Error(`${f}: ${(e as Error).message} | ${it.prompt}`); }
      }
    }
  });
  it('the worked steps arrive at the right answer', () => {
    for (const { f, it } of all()) {
      const ex = stepsFrom(it);
      expect(ex, `${f}: no result in ${JSON.stringify(it.solution)}`).not.toBeNull();
      expect(it.check(ex!.result).ok, `${f}: steps end in ${JSON.stringify(ex!.result)} | ${it.solution.join(' / ')}`).toBe(true);
      for (const s of it.solution) expect(s, f).not.toMatch(/undefined|NaN|\+ −|−−/);
    }
  });
  it('the lesson tables fit', () => {
    const T = (p: Parameters<typeof DiffTable>[0]) => DiffTable(p, FR, dusk);
    T({ xName: 'x', xs: ['0', '1', '2', '3', '4'], cols: [{ name: 'y', vals: ['2', '4', '8', '14', '22'] }], dx: ['+1', '+1', '+1', '+1'], d1: ['+2', '+4', '+6', '+8'], d2: ['+2', '+2', '+2'], rt: ['×2', '×2', '×1.75', '≈×1.57'] });
    T({ xName: 'x', xs: ['0', '2', '4', '6', '8'], cols: [{ name: 'y', vals: ['3', '6', '12', '24', '48'] }], dx: ['+2', '+2', '+2', '+2'], d1: ['+3', '+6', '+12', '+24'], d2: ['+3', '+6', '+12'], rt: ['×2', '×2', '×2', '×2'] });
    T({ xName: 'x', xs: ['0', '1', '2', '3', '4', '5'], cols: [{ name: 'f (Sam)', vals: ['1', '4', '7', '10', '13', null], reveal: [null, null, null, null, null, '16'] }, { name: 'g', vals: ['1', '4', '7', '10', '13', null], reveal: [null, null, null, null, null, '46'] }], d1: ['+3', '+3', '+3', '+3', '+30'] });
  });
});

describe('function-families: no distractor is secretly right (probes on the picture data)', () => {
  const num = (s: string | null) => Number(String(s).replace(/,/g, '').replace('−', '-'));
  const names = { linear: 'Linear', quadratic: 'Quadratic', exponential: 'Exponential', none: 'None of these' } as const;
  it('classifyMixed: the right choice is the family the table holds, by an independent fit', () => {
    for (let s = 1; s <= 400; s++) {
      const it = GEN.classifyMixed!(rng(s * 11 + 5), s) as QItem;
      const t = it.picture!.t!, xs = t.xs.map(num), ys = t.cols[0]!.vals.map(num);
      const F = fits(xs, ys);
      const want = F.length ? names[F[0]!] : names.none;
      expect(it.choices![(it.answer as { i: number }).i], ys.join(', ')).toBe(want);
    }
  });
  it('whichTable: exactly one column holds the asked family', () => {
    for (let s = 1; s <= 400; s++) {
      const it = GEN.whichTable!(rng(s * 13 + 1), s) as QItem;
      const target = /an? <b>(\w+)<\/b>/.exec(it.prompt)![1]!;
      const t = it.picture!.t!, xs = t.xs.map(num);
      const hits = t.cols.filter(c => fits(xs, c.vals.map(num))[0] === target);
      expect(hits.length, JSON.stringify(t.cols.map(c => c.vals))).toBe(1);
    }
  });
});
