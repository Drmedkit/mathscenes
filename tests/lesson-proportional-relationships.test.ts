// lesson-proportional-relationships: every family × every sub-goal it serves × 300 seeds; the model's maths; the voice.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { rng, type Item } from '../src/lesson/runtime/item';
import { frame } from '../src/blocks/block';
import { dusk } from '../src/lesson/dusk';
import { GENS, PROBES, FAMILY_NAMES, type RatePicture, type FamilyId } from '../src/lesson/topics/proportional-relationships/items';
import { PLAN } from '../src/lesson/topics/proportional-relationships/plan';
import { LINES } from '../src/lesson/topics/proportional-relationships/script';
import { RateGraph, computeGraph } from '../src/lesson/topics/proportional-relationships/RateGraph';
import { fmt, money, niceAxis, quotient, qSame, tableTest, times, successiveFactorsEqual } from '../src/lesson/topics/proportional-relationships/rateMaths';

// ---- quality layer (docs/lessons/QUALITY_LAYER.md): worked steps, check-in adapter, regressions ----
import { rng as qlRng, plain as qlPlain, type Item as QlItem } from '../src/lesson/runtime/item';
import { GENS as qlGens } from '../src/lesson/topics/proportional-relationships/items';
import { PLAN as qlPlan } from '../src/lesson/topics/proportional-relationships/plan';
import { explain as qlExplain } from '../src/lesson/topics/proportional-relationships/explain';
import { PLACEMENT as qlPlacement } from '../src/lesson/topics/proportional-relationships/placement';

const TOPIC = 'C:/Users/stelt/Claude code foler/math-curriculum-essentials/topics/secondary-t5-16-proportional-relationships.json';
const MISC = 'C:/Users/stelt/Claude code foler/math-curriculum-essentials/misconceptions.json';
const SEEDS = 300;
const MF = frame(60, 70, 940, 940);

describe('plan covers the topic', () => {
  it('every sub-goal of the topic JSON, in order, each with a family that exists', () => {
    if (fs.existsSync(TOPIC)) {
      const t = JSON.parse(fs.readFileSync(TOPIC, 'utf8')) as { subgoals: { id: string }[] };
      expect(PLAN.map(p => p.id)).toEqual(t.subgoals.map(s => s.id));
    }
    expect(PLAN.length).toBe(17);
    for (const p of PLAN) { expect(p.families.length).toBeGreaterThan(0); for (const f of p.families) expect(GENS[f]).toBeTypeOf('function'); }
    for (const f of Object.keys(GENS)) expect(FAMILY_NAMES[f as FamilyId]).toBeTruthy();
    // every family is used by some sub-goal
    for (const f of Object.keys(GENS)) expect(PLAN.some(p => p.families.includes(f as FamilyId)), f).toBe(true);
  });
});

const pairs = PLAN.flatMap(p => p.families.map(f => [f, p.id] as const));
describe.each(pairs)('family %s for sub-goal %s', (fam, sg) => {
  const items: Item[] = [];
  for (let s = 1; s <= SEEDS; s++) items.push(GENS[fam](rng(s * 7919 + fam.length * 13 + sg.length), s, sg));
  it('the answer passes, the item is well formed', () => {
    for (const it of items) {
      expect(it.family).toBe(fam);
      const v = it.check(it.answer);
      if (!v.ok) throw new Error(`${it.id} ${it.prompt}: own answer rejected: ${v.say}`);
      expect(it.solution.length).toBeGreaterThan(0);
      for (const s of [it.prompt, it.board, it.solution.join(' '), v.say, ...(it.choices ?? []), it.unit ?? '']) expect(s, it.id).not.toMatch(/undefined|NaN|Infinity|\[object/);
    }
  });
  it('choices are unique with exactly one right; every wrong choice explains itself', () => {
    for (const it of items) {
      if (it.input !== 'choice') continue;
      const ch = it.choices ?? [];
      expect(ch.length).toBeGreaterThanOrEqual(3);
      expect(new Set(ch).size, it.prompt).toBe(ch.length);
      const vs = ch.map((_, i) => it.check({ kind: 'choice', i }));
      expect(vs.filter(v => v.ok).length, it.prompt).toBe(1);
      for (const v of vs) expect(v.say.length, it.prompt).toBeGreaterThan(8);
    }
  });
  it('the main misconceptions are classified', () => {
    for (const it of items) for (const p of PROBES.get(it) ?? []) {
      const v = it.check(p.r);
      expect(v.ok, `${it.id} ${JSON.stringify(p.r)}`).toBe(false);
      expect(v.mc, `${it.id} ${it.prompt} ${JSON.stringify(p.r)}`).toBe(p.mc);
    }
  });
  it('pictures are drawable (maths and layout)', () => {
    for (const it of items) {
      const pic = it.picture as unknown as RatePicture | undefined;
      if (!pic?.graph) continue;
      expect(() => computeGraph(pic.graph!), it.id).not.toThrow();
      try { RateGraph(pic.graph, MF, dusk); } catch (e) { throw new Error(`${it.id}: ${(e as Error).message} ${JSON.stringify(pic.graph)}`); }
      for (const s of [...pic.show, ...pic.solve]) {
        const [kind, id] = s.split(':');
        if (kind === 'pt' || kind === 'ray') expect(pic.graph.points?.some(p => p.id === id), `${it.id} ${s}`).toBe(true);
        if (kind === 'line') expect(pic.graph.lines?.some(p => p.id === id), `${it.id} ${s}`).toBe(true);
      }
    }
  });
});

describe('misconception coverage', () => {
  it('every catalogue misconception of the topic shows up in some verdict or probe', () => {
    const seen = new Set<string>();
    for (const [fam, sg] of pairs) for (let s = 1; s <= 150; s++) {
      const it = GENS[fam](rng(s * 31 + 5), s, sg);
      for (const p of PROBES.get(it) ?? []) seen.add(p.mc);
      if (it.input === 'choice') (it.choices ?? []).forEach((_, i) => { const v = it.check({ kind: 'choice', i }); if (v.mc) seen.add(v.mc); });
    }
    const t = JSON.parse(fs.readFileSync(TOPIC, 'utf8')) as { subgoals: { misconceptions: string[] }[] };
    const want = [...new Set(t.subgoals.flatMap(s => s.misconceptions))];
    const missing = want.filter(m => !seen.has(m));
    expect(missing).toEqual([]);
    // and every id used exists in the catalogue
    const cat = JSON.parse(fs.readFileSync(MISC, 'utf8')) as { misconceptions: { id: string }[] };
    const ids = new Set(cat.misconceptions.map(m => m.id));
    for (const m of seen) expect(ids.has(m), m).toBe(true);
  });
  it('many distinct items per family', () => {
    for (const fam of Object.keys(GENS) as FamilyId[]) {
      const sgs = PLAN.filter(p => p.families.includes(fam)).map(p => p.id);
      const ids = new Set<string>();
      for (let s = 1; s <= 3000; s++) { const it = GENS[fam](rng(s), s, sgs[s % sgs.length]); ids.add(it.prompt + it.board + (it.choices ?? []).join("|")); }
      expect(ids.size, fam).toBeGreaterThanOrEqual(40);
    }
  });
});

describe('the maths', () => {
  it('quotients are exact and ordered (y ÷ x)', () => {
    expect(quotient(3, 7.5)).toEqual({ p: 5, q: 2 });
    expect(quotient(0, 0)).toBeNull();
    expect(qSame(quotient(6, 15), quotient(2, 5))).toBe(true);
    expect(qSame(quotient(4, 10), quotient(1, 3))).toBe(false);
    expect(times(3.5, 6)).toBe(21);
    expect(times(0.75, 3)).toBe(2.25);
    expect(fmt(7.5)).toBe('7.5'); expect(money(7.5)).toBe('7.50'); expect(money(15)).toBe('15');
  });
  it('the table test: one quotient in every nonzero row, and 0 → 0', () => {
    expect(tableTest([{ x: 6, y: 15 }, { x: 2, y: 5 }, { x: 3, y: 7.5 }]).proportional).toBe(true);
    const a = tableTest([{ x: 1, y: 3 }, { x: 2, y: 6 }, { x: 4, y: 10 }]);
    expect(a.proportional).toBe(false); expect(a.breaks).toEqual([2]);
    expect(tableTest([{ x: 2, y: 7 }, { x: 4, y: 9 }, { x: 6, y: 11 }]).proportional).toBe(false);
    expect(tableTest([{ x: 0, y: 0 }, { x: 4, y: 14 }]).proportional).toBe(true);
    const fee = tableTest([{ x: 0, y: 5 }, { x: 2, y: 4 }, { x: 4, y: 8 }]);
    expect(fee.proportional).toBe(false); expect(fee.zeroOk).toBe(false);
    // doubling outputs at equally spaced inputs pass the wrong test, fail the right one
    const dbl = [{ x: 1, y: 6 }, { x: 2, y: 12 }, { x: 3, y: 24 }];
    expect(successiveFactorsEqual(dbl)).toBe(true); expect(tableTest(dbl).proportional).toBe(false);
  });
  it('the lesson numbers hold (asserted, not assumed)', () => {
    // part 1: shop A breaks in row 3, shop B adds, shop C is proportional with k = 2.5
    expect(tableTest([{ x: 1, y: 3 }, { x: 2, y: 6 }, { x: 4, y: 10 }]).breaks).toEqual([2]);
    expect(tableTest([{ x: 2, y: 7 }, { x: 4, y: 9 }, { x: 6, y: 11 }]).proportional).toBe(false);
    const c = tableTest([{ x: 6, y: 15 }, { x: 2, y: 5 }, { x: 3, y: 7.5 }]);
    expect(c.k).toEqual({ p: 5, q: 2 });
    // part 3: gas at 3.5 dollars per gallon
    expect(tableTest([{ x: 4, y: 14 }, { x: 10, y: 35 }, { x: 6, y: 21 }]).k).toEqual({ p: 7, q: 2 });
  });
  it('graph facts: straight and through the origin', () => {
    const g = computeGraph({ xMax: 8, yMax: 20, xStep: 1, yStep: 2.5, xName: 'pounds', yName: 'dollars', points: [{ x: 6, y: 15, id: 'a' }, { x: 2, y: 5, id: 'b' }], lines: [{ id: 'L', k: 2.5 }, { id: 'F', k: 2, b: 3 }, { id: 'C', k: 0.5, kind: 'square' }] });
    expect(g.oneRay).toBe(true);
    expect(g.lineFacts.L!.proportional).toBe(true); expect(g.lineFacts.F!.proportional).toBe(false); expect(g.lineFacts.C!.proportional).toBe(false);
    expect(() => computeGraph({ xMax: 8, yMax: 20, xStep: 1, yStep: 2.5, xName: 'a', yName: 'b', points: [{ x: 9, y: 1, id: 'p' }] })).toThrow();
    expect(niceAxis(16.8)).toEqual({ max: 18, step: 2 });
  });
  it('the lesson graphs lay out', () => {
    expect(() => RateGraph({ xMax: 8, yMax: 20, xStep: 1, yStep: 2.5, xName: 'pounds', yName: 'dollars', points: [{ x: 6, y: 15, id: 'r0', label: true }, { x: 2, y: 5, id: 'r1', label: true }, { x: 3, y: 7.5, id: 'r2', label: true }], lines: [{ id: 'L', k: 2.5, ends: 'ray' }], unit: 'L', unitWords: ['1 lb', '$2.50'] }, MF, dusk)).not.toThrow();
    expect(() => RateGraph({ xMax: 12, yMax: 45, xStep: 1, yStep: 5, xName: 'gallons', yName: 'dollars', points: [{ x: 4, y: 14, id: 'r0', label: true }, { x: 10, y: 35, id: 'r1', label: true }, { x: 6, y: 21, id: 'r2', label: true }], lines: [{ id: 'L', k: 3.5, ends: 'ray' }], unit: 'L', unitWords: ['1 gal', '$3.50'] }, MF, dusk)).not.toThrow();
  });
});

describe('voice', () => {
  it('every scripted panel line has a spoken text and vice versa', () => {
    const lines = JSON.parse(fs.readFileSync('pages/lessons/proportional-relationships/voice/lines.json', 'utf8')) as Record<string, { text: string }>;
    expect(Object.keys(lines).sort()).toEqual(Object.keys(LINES).sort());
    for (const [id, l] of Object.entries(lines)) {
      expect(l.text, id).toBe(LINES[id]!.say);
      expect(l.text.length, id).toBeGreaterThan(3);
      expect(l.text, id).not.toMatch(/\d\s*\/\s*\d|[<>×÷$]|\d/);
    }
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
      expect(text, `${p.id}/${f}`).not.toMatch(/(?<!, |[\d.\/])1 cups\b/);
    }
  });
  it('the table test fits the steps card: at most 5 steps however many rows', () => {
    for (let s = 1; s <= 200; s++) expect(qlExplain(gens.tableTest!(qlRng(s), s, 'table-test'))!.steps.length).toBeLessThanOrEqual(5);
  });
});

describe('quality layer: oracle findings (phase 2)', () => {
  const gens = qlGens as unknown as Record<string, (R: () => number, n: number, sg?: string) => QlItem>;
  it('the growing pattern is never a, 2a, 3a (that one is proportional); only money tables are price lists', () => {
    for (let s = 1; s <= 400; s++) {
      const p = qlPlain(gens.changingRate!(qlRng(s), s, 'changing-rate-counterexample').prompt);
      const m = /figure 1 has (\d+) squares, figure 2 has (\d+)/.exec(p);
      if (m) expect(Number(m[2]), p).not.toBe(2 * Number(m[1]));
      const t = qlPlain(gens.tableTest!(qlRng(s), s, 'table-test').prompt);
      expect(t).not.toMatch(/price list for (a printer|a hose|a car|a recipe)/);
    }
  });
});
