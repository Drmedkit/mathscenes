// probability concepts: every family x every sub-goal it serves x 300 seeds gives a valid item (the answer passes,
// choices unique with exactly one right, no NaN / undefined in the text), the main misconceptions are classified
// with ids that exist in the catalogue, the plan covers every sub-goal of the topic JSON in order, the model's maths
// holds, and every voiced panel line has its spoken text.
import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { rng, type Item } from '../src/lesson/runtime/item';
import { GENS, FAMILY_NAMES, PROBES, type ProbItem } from '../src/lesson/topics/probability/items';
import { PLAN } from '../src/lesson/topics/probability/plan';
import { LINES } from '../src/lesson/topics/probability/script';
import { asExtreme, bagSpace, batches, complementOf, cubeSpace, digitTrials, eqF, eventOf, expectedCount, isModel, pairs, prob, running, simulate, tossSpace, twoCubes, wordOf } from '../src/lesson/topics/probability/chanceMaths';

// ---- quality layer (docs/lessons/QUALITY_LAYER.md): worked steps, check-in adapter, regressions ----
import { rng as qlRng, plain as qlPlain, type Item as QlItem } from '../src/lesson/runtime/item';
import { GENS as qlGens } from '../src/lesson/topics/probability/items';
import { PLAN as qlPlan } from '../src/lesson/topics/probability/plan';
import { explain as qlExplain } from '../src/lesson/topics/probability/explain';
import { PLACEMENT as qlPlacement } from '../src/lesson/topics/probability/placement';

const TOPIC = 'C:/Users/stelt/Claude code foler/math-curriculum-essentials/topics/secondary-t5-24-probability-concepts.json';
const MC = 'C:/Users/stelt/Claude code foler/math-curriculum-essentials/misconceptions.json';
const mcIds = existsSync(MC) ? new Set((JSON.parse(readFileSync(MC, 'utf8')) as { misconceptions: { id: string }[] }).misconceptions.map(m => m.id)) : null;
const SEEDS = 300;
const famPairs = PLAN.flatMap(p => p.families.map(f => [f, p.id] as const));
const make = (f: string, sg: string, s: number): ProbItem => GENS[f as keyof typeof GENS](rng(s * 7919 + f.length), s, sg) as ProbItem;

describe('plan', () => {
  it('covers every sub-goal of the topic JSON, in order, each with a family that exists', () => {
    if (existsSync(TOPIC)) {
      const t = JSON.parse(readFileSync(TOPIC, 'utf8')) as { subgoals: { id: string; order: number }[] };
      expect(PLAN.map(p => p.id)).toEqual([...t.subgoals].sort((a, b) => a.order - b.order).map(s => s.id));
    }
    expect(PLAN.length).toBe(20);
    for (const p of PLAN) {
      expect(p.families.length).toBeGreaterThan(0);
      for (const f of p.families) { expect(GENS[f as keyof typeof GENS], f).toBeTypeOf('function'); expect(FAMILY_NAMES[f as keyof typeof FAMILY_NAMES], f).toBeTruthy(); }
    }
    expect(new Set(PLAN.flatMap(p => p.families))).toEqual(new Set(Object.keys(GENS)));
  });
});

describe.each(famPairs)('family %s for sub-goal %s', (fam, sg) => {
  const items: ProbItem[] = [];
  for (let s = 1; s <= SEEDS; s++) items.push(make(fam, sg, s));
  it('the answer passes and the item is well formed', () => {
    for (const it of items) {
      expect(it.family).toBe(fam);
      const v = it.check(it.answer);
      if (!v.ok) throw new Error(`${it.id} ${it.prompt}: own answer rejected: ${v.say}`);
      expect(it.solution.length, it.id).toBeGreaterThan(0);
      for (const s of [it.prompt, it.board, it.hero ?? '', it.solution.join(' '), ...(it.choices ?? []), v.say]) expect(s, `${it.id}: ${s}`).not.toMatch(/undefined|NaN|Infinity|\[object|[\t\x00-\x08\x0b\x0c]/);
      if (it.input === 'frac') expect(it.answer.kind).toBe('frac');
      if (it.input === 'num') expect(it.answer.kind).toBe('num');
    }
  });
  it('choices are unique with exactly one right', () => {
    for (const it of items) {
      if (it.input !== 'choice') continue;
      const ch = it.choices ?? [];
      expect(ch.length, it.id).toBeGreaterThanOrEqual(3);
      expect(new Set(ch).size, `${it.id} ${ch.join(' | ')}`).toBe(ch.length);
      const right = ch.map((_, i) => it.check({ kind: 'choice', i }).ok).filter(Boolean).length;
      expect(right, `${it.id} ${it.prompt}`).toBe(1);
    }
  });
  it('the main misconceptions are classified, with ids from the catalogue', () => {
    for (const it of items) for (const p of PROBES.get(it as Item) ?? []) {
      const v = it.check(p.r);
      expect(v.ok, `${it.id} ${JSON.stringify(p.r)}`).toBe(false);
      expect(v.mc, `${it.id} ${it.prompt} ${JSON.stringify(p.r)}`).toBe(p.mc);
      if (mcIds) expect(mcIds.has(p.mc), p.mc).toBe(true);
    }
  });
  it('many distinct items', () => {
    const ids = new Set(items.map(it => it.prompt + it.board + (it.choices ?? []).join()));
    expect(ids.size, fam).toBeGreaterThanOrEqual(fam === 'equal' || fam === 'designSim' ? 14 : 25);
  });
});

describe('misconception coverage', () => {
  it("every misconception the topic's sub-goals name is recognised somewhere", () => {
    const seen = new Set<string>();
    for (const [fam, sg] of famPairs) for (let s = 1; s <= 200; s++) {
      const it = make(fam, sg, s);
      for (const p of PROBES.get(it as Item) ?? []) seen.add(p.mc);
    }
    if (existsSync(TOPIC)) {
      const t = JSON.parse(readFileSync(TOPIC, 'utf8')) as { subgoals: { misconceptions: string[] }[] };
      const want = new Set(t.subgoals.flatMap(s => s.misconceptions));
      const missing = [...want].filter(m => !seen.has(m));
      expect(missing).toEqual([]);
    }
    if (mcIds) for (const m of seen) expect(mcIds.has(m), m).toBe(true);
  });
});

describe('the chance maths', () => {
  it('bags are listed marble by marble, and P counts marbles, not colors', () => {
    const sp = bagSpace([{ col: 'blue', n: 3 }, { col: 'white', n: 1 }]);
    expect(sp.map(o => o.id)).toEqual(['B1', 'B2', 'B3', 'W']);
    expect(prob(eventOf(sp, o => o.group === 'blue'), sp)).toEqual([3, 4]);
    expect(prob(eventOf(sp, o => o.group !== 'white'), sp)).toEqual([3, 4]);
    const six = bagSpace([{ col: 'blue', n: 2 }, { col: 'white', n: 3 }, { col: 'pink', n: 1 }]);
    expect(prob(eventOf(six, o => o.group !== 'white'), six)).toEqual([3, 6]);
    expect(() => prob([{ id: 'X', tex: 'X', group: 'x' }], sp)).toThrow();
    expect(() => bagSpace([{ col: 'blue', n: 2 }, { col: 'blue', n: 1 }])).toThrow();
  });
  it('the scale words', () => {
    expect([[0, 6], [1, 6], [3, 6], [5, 6], [6, 6]].map(v => wordOf(v as [number, number]))).toEqual(['impossible', 'unlikely', 'as likely as not', 'likely', 'certain']);
    expect(() => wordOf([7, 6])).toThrow();
    expect(complementOf([2, 5])).toEqual([3, 5]);
  });
  it('models sum to 1; expected counts; the cube', () => {
    expect(isModel([[1, 6], [1, 6], [1, 6], [1, 6], [1, 6], [1, 6]]).ok).toBe(true);
    expect(isModel([[1, 5], [2, 5], [1, 5]]).ok).toBe(false);
    expect(isModel([[3, 5], [3, 5], [-1, 5]]).outside).toBe(true);
    expect(expectedCount([2, 6], 600)).toBe(200);
    expect(cubeSpace().length).toBe(6);
  });
  it('compound spaces are ordered and complete', () => {
    expect(tossSpace(3)).toEqual(['HHH', 'HHT', 'HTH', 'HTT', 'THH', 'THT', 'TTH', 'TTT']);
    expect(twoCubes().length).toBe(36);
    expect(twoCubes().filter(([a, b]) => a + b === 7).length).toBe(6);
    expect(pairs(['B1', 'B2', 'W'], ['B1', 'B2', 'W'], (a, b) => a === b).length).toBe(6);
    expect(tossSpace(3).filter(s => [...s].filter(c => c === 'H').length === 1).length).toBe(3);
  });
  it('a seeded experiment is repeatable and settles', () => {
    const a = simulate(rng(5), [[3, 4], [1, 4]], 400), b = simulate(rng(5), [[3, 4], [1, 4]], 400);
    expect(a).toEqual(b);
    const run = running(a.map(x => x === 0));
    const last = run[run.length - 1]!;
    expect(Math.abs(last[0] / last[1] - 0.75)).toBeLessThan(0.08);
    expect(batches(rng(1), [1, 2], 20, 10).every(x => x >= 0 && x <= 20)).toBe(true);
    expect(asExtreme([1, 5, 7, 9], 7, 5)).toBe(2);
    expect(eqF([3, 6], [1, 2])).toBe(true);
  });
  it('digits cut into whole trials, none reused', () => {
    const d = [4, 8, 2, 9, 1, 7, 0, 3, 5];
    const r = digitTrials(d, 3, b => b.some(x => x >= 7));
    expect(r.blocks).toEqual([[4, 8, 2], [9, 1, 7], [0, 3, 5]]);
    expect(r.wins).toEqual([true, true, false]);
    expect(() => digitTrials(d, 4, () => true)).toThrow();
  });
});

describe('voice', () => {
  it('every panel line of parts 1-4 has a spoken text in lines.json, and back', () => {
    const lines = JSON.parse(readFileSync('pages/lessons/probability/voice/lines.json', 'utf8')) as Record<string, { text: string }>;
    expect(Object.keys(lines).sort()).toEqual(Object.keys(LINES).sort());
    for (const [id, l] of Object.entries(lines)) {
      expect(l.text, id).toBe(LINES[id]!.say);
      expect(l.text.length, id).toBeGreaterThan(3);
      expect(l.text, id).not.toMatch(/\d\s*\/\s*\d|[<>×÷=]|\bP\(/);
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
      expect(text, `${p.id}/${f}`).not.toMatch(/(?<![\d.\/,])1 (times|marbles|parts|heads)\b/);
    }
  });
  it('compoundSpace marks the count in every mode', () => {
    for (let s = 1; s <= 200; s++) { const it0 = gens.compoundSpace!(qlRng(s), s, 'compound-sample-space'); expect(qlExplain(it0)!.result).toEqual(it0.answer); }
  });
});

describe('quality layer: oracle findings (phase 2)', () => {
  const gens = qlGens as unknown as Record<string, (R: () => number, n: number, sg?: string) => QlItem>;
  it('discrepancy compares the right way (or fewer below the center, never "is -2 more"); "close enough" is within 1.5 SD', () => {
    for (let s = 1; s <= 400; s++) {
      const d = gens.discrepancy!(qlRng(s), s, 'model-data-discrepancy');
      for (const c of d.choices ?? []) expect(c).not.toMatch(/is -\d/);
      const ok = (d.choices ?? [])[d.answer.kind === 'choice' ? d.answer.i : -1] ?? '';
      const m = /got (\d+) or (more|fewer)/.exec(ok), obs = Number(/gave (\d+)/.exec(qlPlain(d.prompt))?.[1]);
      if (m) expect(Number(m[1])).toBe(obs);
      const c = gens.compoundPredict!(qlRng(s), s, 'compound-predict-and-compare'), p = qlPlain(c.prompt);
      const mm = /= (\d+)\/(\d+), so about (\d+) of (\d+) trials\. The class got (\d+)/.exec(p);
      if (mm) {
        const [, a, b, e, T, o] = mm.map(Number) as number[];
        const sd = Math.sqrt(T! * (a! / b!) * (1 - a! / b!));
        expect(Math.abs(o! - e!), p).toBeLessThanOrEqual(1.5 * sd);
      }
    }
  });
});
