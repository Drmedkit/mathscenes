// lesson-multiply-divide-rational-numbers: every family × every sub-goal it serves × 300 seeds; the models' maths;
// the voice lines.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { rng, type Item } from '../src/lesson/runtime/item';
import { GENS, PROBES, FAMILY_NAMES, type Picture } from '../src/lesson/topics/multiply-divide-rational-numbers/items';
import { PLAN } from '../src/lesson/topics/multiply-divide-rational-numbers/plan';
import { SCRIPT, LINES } from '../src/lesson/topics/multiply-divide-rational-numbers/script';
import { computeJumps, jumpsFit } from '../src/lesson/topics/multiply-divide-rational-numbers/TimeJumps';
import { computeMat, matFits } from '../src/lesson/topics/multiply-divide-rational-numbers/Counters';
import { q, dq, qAdd, qMul, qSame, readQ, expand, hq } from '../src/lesson/topics/multiply-divide-rational-numbers/rq';

const TOPIC = 'C:/Users/stelt/Claude code foler/math-curriculum-essentials/topics/secondary.multiply-and-divide-rational-numbers.json';
const SEEDS = 300;

describe('plan covers the topic', () => {
  it('every sub-goal of the topic JSON, in order, each with a family that exists', () => {
    if (fs.existsSync(TOPIC)) {
      const t = JSON.parse(fs.readFileSync(TOPIC, 'utf8')) as { subgoals: { id: string }[] };
      expect(PLAN.map(p => p.id)).toEqual(t.subgoals.map(s => s.id));
    }
    expect(PLAN.length).toBe(23);
    for (const p of PLAN) { expect(p.families.length).toBeGreaterThan(0); for (const f of p.families) expect(GENS[f]).toBeTypeOf('function'); }
    for (const f of Object.keys(GENS)) expect(FAMILY_NAMES[f as keyof typeof FAMILY_NAMES]).toBeTruthy();
    // every family is used by the plan
    for (const f of Object.keys(GENS)) expect(PLAN.some(p => p.families.includes(f as never)), f).toBe(true);
  });
});

const pairs = PLAN.flatMap(p => p.families.map(f => [f, p.id] as const));
describe.each(pairs)('family %s for sub-goal %s', (fam, sg) => {
  const items: Item[] = [];
  for (let s = 1; s <= SEEDS; s++) items.push(GENS[fam](rng(s * 7919 + fam.length), s, sg));
  it('the answer passes, the item is well formed', () => {
    for (const it of items) {
      expect(it.family).toBe(fam);
      const v = it.check(it.answer);
      if (!v.ok) throw new Error(`${it.id} ${it.prompt}: own answer rejected: ${v.say}`);
      expect(it.solution.length).toBeGreaterThan(0);
      for (const s of [it.prompt, it.board, it.solution.join(' '), ...(it.choices ?? []), v.say]) expect(s.replace(/is undefined|>undefined<|Undefined/g, ''), it.id).not.toMatch(/undefined|NaN|Infinity|\[object/);
      if (it.input === 'num') expect(it.answer.kind === 'num' && Number.isFinite(it.answer.v)).toBe(true);
    }
  });
  it('choices are unique with exactly one right', () => {
    for (const it of items) {
      if (it.input !== 'choice') continue;
      const ch = it.choices ?? [];
      expect(ch.length).toBeGreaterThanOrEqual(3);
      expect(new Set(ch).size, it.prompt).toBe(ch.length);
      const right = ch.map((_, i) => it.check({ kind: 'choice', i }).ok).filter(Boolean).length;
      expect(right, it.prompt).toBe(1);
    }
  });
  it('the main misconceptions are classified', () => {
    for (const it of items) for (const p of PROBES.get(it) ?? []) {
      const v = it.check(p.r);
      expect(v.ok, `${it.id} ${JSON.stringify(p.r)}`).toBe(false);
      expect(v.mc, `${it.id} ${it.prompt} ${JSON.stringify(p.r)}`).toBe(p.mc);
    }
  });
  it('pictures are drawable', () => {
    for (const it of items) {
      const pic = it.picture as unknown as Picture | undefined;
      if (!pic) continue;
      if (pic.kind === 'jumps') {
        const p = { rate: q(pic.rate[0], pic.rate[1]), t0: pic.t0, t1: pic.t1, ask: pic.ask };
        expect(jumpsFit(p), it.id).toBe(true);
        const m = computeJumps({ ...p, start: q(pic.start[0], pic.start[1]), look: pic.look, unit: pic.unit, step: pic.step, caption: pic.caption });
        // the picture's answer is the item's answer
        expect(qSame(m.change!, readQ(it.answer)!), it.id).toBe(true);
      } else expect(matFits(pic.groups), it.id).toBe(true);
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
    const catalog = 'C:/Users/stelt/Claude code foler/math-curriculum-essentials/misconceptions.json';
    let ids: string[] = [];
    if (fs.existsSync(catalog)) {
      const m = JSON.parse(fs.readFileSync(catalog, 'utf8')) as { id: string; used_by?: unknown }[] | { misconceptions: { id: string; used_by?: unknown }[] };
      const arr = Array.isArray(m) ? m : m.misconceptions;
      ids = arr.filter(e => JSON.stringify(e.used_by ?? '').includes('secondary.multiply-and-divide-rational-numbers')).map(e => e.id);
      // every id we log exists in the catalogue
      const all = new Set(arr.map(e => e.id));
      for (const s of seen) expect(all.has(s), s).toBe(true);
    }
    // monitoring-only observations that a single answer cannot show
    const notByAnswer = new Set<string>([]);
    for (const mc of ids) if (!notByAnswer.has(mc)) expect(seen.has(mc), mc).toBe(true);
  });
  it('many distinct items per family', () => {
    for (const fam of Object.keys(GENS) as (keyof typeof GENS)[]) {
      const sgs = PLAN.filter(p => p.families.includes(fam)).map(p => p.id);
      const ids = new Set<string>();
      for (let s = 1; s <= 3000; s++) { const it = GENS[fam](rng(s), s, sgs[s % sgs.length]); ids.add(it.prompt + it.board); }
      expect(ids.size, fam).toBeGreaterThanOrEqual(40);
    }
  });
});

describe('the models', () => {
  it('time jumps: every node is start + t × rate, the change at t < 0 flips the sign', () => {
    let n = 0;
    for (const r of [-4, -2.5, -1.5, 3, 0.5, 2.25]) for (let t0 = -6; t0 <= 0; t0++) for (let t1 = 0; t1 <= 6; t1++) for (const ask of [t0, t1]) {
      const rate = dq(r);
      if (!jumpsFit({ rate, t0, t1, ask: ask || null })) continue;
      const m = computeJumps({ rate, t0, t1, ask: ask || null, start: q(30), look: 'thermo', unit: '°F', step: 'h', caption: 't' });
      n++;
      for (let t = t0; t <= t1; t++) expect(qSame(m.pos(t), qAdd(q(30), qMul(q(t), rate)))).toBe(true);
      if (m.change) { expect(qSame(m.change, qMul(q(ask), rate))).toBe(true); if (ask < 0) expect(Math.sign(m.change.p)).toBe(-Math.sign(rate.p)); }
    }
    expect(n).toBeGreaterThan(100);
  });
  it('time jumps refuse what they cannot draw', () => {
    expect(() => computeJumps({ rate: q(0), t0: -1, t1: 1, look: 'sea', unit: 'ft', step: 'min', caption: '' })).toThrow();
    expect(() => computeJumps({ rate: q(2), t0: -5, t1: 5, look: 'sea', unit: 'ft', step: 'min', caption: '' })).toThrow();
    expect(() => computeJumps({ rate: q(1, 3), t0: -1, t1: 1, look: 'sea', unit: 'ft', step: 'min', caption: '' })).toThrow();
  });
  it('counters: zero pairs are worth 0; taking out 3 groups of −4 from 12 zero pairs leaves +12', () => {
    const pairs = { counters: Array.from({ length: 24 }, (_, i) => (i % 2 ? -1 : 1)) };
    expect(computeMat([pairs])).toBe(0);
    const removed = Array.from({ length: 3 }, () => ({ counters: [-1, -1, -1, -1], removed: true }));
    expect(computeMat([...removed, { counters: Array(12).fill(1) }])).toBe(12);
    expect(computeMat(Array.from({ length: 3 }, () => ({ counters: [-1, -1, -1, -1] })))).toBe(-12);
  });
  it('reads signed answers in any box and expands repeating decimals', () => {
    expect(qSame(readQ({ kind: 'frac', w: -1, n: 1, d: 2 })!, q(-3, 2))).toBe(true);
    expect(qSame(readQ({ kind: 'frac', w: 0, n: 3, d: -4 })!, q(-3, 4))).toBe(true);
    expect(qSame(readQ({ kind: 'frac', w: 0, n: -3, d: -4 })!, q(3, 4))).toBe(true);
    expect(qSame(readQ({ kind: 'num', v: -0.625 })!, q(-5, 8))).toBe(true);
    expect(expand(q(-7, 12))).toEqual({ int: '0', pre: '58', rep: '3' });
    expect(expand(q(1, 7)).rep).toBe('142857');
    expect(hq(q(-5, 8), 'dec')).toBe('−0.625');
  });
});

describe('voice', () => {
  it('every scripted panel line has a spoken text and vice versa', () => {
    const lines = JSON.parse(fs.readFileSync('pages/lessons/multiply-divide-rational-numbers/voice/lines.json', 'utf8')) as Record<string, { text: string }>;
    expect(Object.keys(lines).sort()).toEqual(Object.keys(SCRIPT).sort());
    for (const [id, l] of Object.entries(lines)) {
      expect(l.text, id).toBe(LINES[id]!.say);
      expect(l.text.length, id).toBeGreaterThan(3);
      expect(l.text, id).not.toMatch(/\d\s*\/\s*\d|[<>×÷−]|-\d|\(\s*-/);
    }
  });
});

describe('multiply-divide-rational-numbers: quality layer (docs/lessons/QUALITY_LAYER.md)', () => {
  const G = GENS as Record<string, (R: () => number, n: number, sg?: string) => Item>;
  const txt = (h: string) => h.replace(/<[^>]+>/g, '');
  it('"a + b × c" is written with its × and brackets: never "−7 + −52" (which read as −7 + (−5)(2))', () => {
    for (let s = 1; s <= 400; s++) {
      const it = G.compound!(rng(s * 7 + 3), s);
      expect(txt(it.prompt), it.prompt).not.toMatch(/[+−-] [−-]\d/);
      expect(it.board, it.board).not.toMatch(/\t/);
    }
  });
  it('the distributive "box" step marks the box (the first part), not its opposite', async () => {
    const { explain } = await import('../src/lesson/topics/multiply-divide-rational-numbers/explain');
    for (let s = 1; s <= 300; s++) {
      const it = G.argument!(rng(s * 11 + 5), s);
      expect(explain(it)?.result, txt(it.prompt)).toEqual(it.answer);
    }
  });
  it('negative fraction answers and repeating-decimal choices are read from the steps', async () => {
    const { explain } = await import('../src/lesson/topics/multiply-divide-rational-numbers/explain');
    for (let s = 1; s <= 200; s++) for (const f of ['ratMul', 'oneNeg', 'decimal', 'story1']) {
      const it = G[f]!(rng(s * 13 + 1), s);
      const ex = explain(it);
      expect(ex, `${f}: ${txt(it.prompt)}`).not.toBeNull();
      expect(it.check(ex!.result).ok, `${f}: ${txt(it.prompt)} ${JSON.stringify(ex!.result)}`).toBe(true);
    }
  });
});

describe('multiply-divide-rational-numbers: oracle findings (phase 2)', () => {
  it('factors written side by side each have brackets: never "(−2)51(−5)" or "13(−2)" (read as 51, 13)', () => {
    const G = GENS as Record<string, (R: () => number, n: number, sg?: string) => Item>;
    for (let s = 1; s <= 600; s++) {
      const it = G.intMul!(rng(s * 19 + 3), s);
      const p = it.prompt.replace(/<[^>]+>/g, '');
      expect(p, p).not.toMatch(/\)\d/);
      if (!p.includes(' × ')) expect(p, p).toMatch(/^(\(−?\d+\)|\d)(\(−?\d+\))+ = \?$/);
      expect(it.board, it.board).not.toMatch(/\)\d/);
    }
  });
});
