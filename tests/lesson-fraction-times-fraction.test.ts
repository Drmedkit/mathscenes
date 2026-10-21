// lesson-fraction-times-fraction: every family × every sub-goal it serves × 300 seeds; the model's maths; the voice.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { rng, type Item } from '../src/lesson/runtime/item';
import { GENS, PROBES, FAMILY_NAMES, type AreaPicture } from '../src/lesson/topics/fraction-times-fraction/items';
import { PLAN } from '../src/lesson/topics/fraction-times-fraction/plan';
import { SCRIPT } from '../src/lesson/topics/fraction-times-fraction/script';
import { areaFits, computeArea } from '../src/lesson/topics/fraction-times-fraction/AreaModel';

const TOPIC = 'C:/Users/stelt/Claude code foler/math-curriculum-essentials/topics/primary.fractions.multiply-fraction-by-fraction.json';
const SEEDS = 300;

describe('plan covers the topic', () => {
  it('every sub-goal of the topic JSON, in order, each with a family that exists', () => {
    if (fs.existsSync(TOPIC)) {
      const t = JSON.parse(fs.readFileSync(TOPIC, 'utf8')) as { subgoals: { id: string }[] };
      expect(PLAN.map(p => p.id)).toEqual(t.subgoals.map(s => s.id));
    }
    expect(PLAN.length).toBe(18);
    for (const p of PLAN) { expect(p.families.length).toBeGreaterThan(0); for (const f of p.families) expect(GENS[f]).toBeTypeOf('function'); }
    for (const f of Object.keys(GENS)) expect(FAMILY_NAMES[f as keyof typeof FAMILY_NAMES]).toBeTruthy();
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
      for (const s of [it.prompt, it.board, it.solution.join(' '), ...(it.choices ?? [])]) expect(s, it.id).not.toMatch(/undefined|NaN|Infinity/);
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
      const pic = it.picture as unknown as AreaPicture | undefined;
      if (pic) expect(areaFits(pic.a, pic.b, pic.c, pic.d), it.id).toBe(true);
    }
  });
});

describe('misconception coverage', () => {
  it('every main catalogue misconception of the topic shows up in some verdict or probe', () => {
    const seen = new Set<string>();
    for (const [fam, sg] of pairs) for (let s = 1; s <= 120; s++) {
      const it = GENS[fam](rng(s * 31 + 5), s, sg);
      for (const p of PROBES.get(it) ?? []) seen.add(p.mc);
      if (it.input === 'choice') (it.choices ?? []).forEach((_, i) => { const v = it.check({ kind: 'choice', i }); if (v.mc) seen.add(v.mc); });
    }
    for (const mc of ['mc.fraction-ops.multiplies-both-terms-by-whole-number', 'mc.fractions-concept.part-taken-as-whole', 'mc.fraction-ops.adds-shaded-counts',
      'mc.fraction-ops.uses-one-piece-of-non-unit-fraction', 'mc.fraction-ops.reads-of-as-addition-or-subtraction', 'mc.fraction-ops.fraction-product-denominator-meaning-unexplained',
      'mc.area-perimeter.counts-cells-without-their-unit-area', 'mc.fraction-ops.cross-multiplies-to-multiply', 'mc.fractions-concept.stops-simplifying-early',
      'mc.fraction-ops.cancels-where-not-allowed', 'mc.mul-div.times-zero-unchanged', 'mc.quadratic-polynomial.firsts-and-lasts-only',
      'mc.fraction-ops.comparison-factors-have-interchangeable-roles', 'mc.mul-div.multiplication-makes-bigger', 'mc.fraction-ops.fraction-factor-always-shrinks',
      'mc.reasoning-language.examples-as-proof', 'mc.fraction-ops.fraction-given-instead-of-quantity', 'mc.area-perimeter.rectangle-perimeter-length-plus-width',
      'mc.measurement-units.wrong-unit-dimension', 'mc.expressions.rejects-equivalent-non-final-forms', 'mc.fraction-ops.multiplication-only-as-copies',
      'mc.fraction-ops.keeps-common-denominator-in-product-or-quotient', 'mc.properties.rewriting-changes-value', 'mc.fraction-ops.subunit-factor-product-below-both']) expect(seen.has(mc), mc).toBe(true);
  });
  it('many distinct items per family', () => {
    for (const fam of Object.keys(GENS) as (keyof typeof GENS)[]) {
      const sgs = PLAN.filter(p => p.families.includes(fam)).map(p => p.id);
      const ids = new Set<string>();
      for (let s = 1; s <= 3000; s++) { const it = GENS[fam](rng(s), s, sgs[s % sgs.length]); ids.add(it.prompt + it.board); }
      expect(ids.size, fam).toBeGreaterThanOrEqual(fam === 'cancel' ? 25 : 40);
    }
  });
});

describe('the area model', () => {
  it('counts the cells: a × c taken of b × d in one whole', () => {
    let n = 0;
    for (let b = 1; b <= 6; b++) for (let a = 1; a <= b; a++) for (let d = 2; d <= 6; d++) for (let c = 1; c <= 2 * d; c++) {
      if (!areaFits(a, b, c, d)) continue;
      const m = computeArea({ a, b, c, d }); n++;
      expect(m.taken).toBe(a * c); expect(m.perWhole).toBe(b * d); expect(m.firstCells).toBe(b * c);
      expect(m.product.p * b * d).toBe(a * c * m.product.q);
      expect(m.wholes).toBe(c > d ? 2 : 1);
    }
    expect(n).toBeGreaterThan(200);
  });
  it('refuses what it cannot draw', () => {
    expect(() => computeArea({ a: 1, b: 7, c: 1, d: 6 })).toThrow();
    expect(() => computeArea({ a: 3, b: 2, c: 1, d: 2 })).toThrow();
    expect(() => computeArea({ a: 1, b: 2, c: 13, d: 6 })).toThrow();
  });
});

describe('voice', () => {
  it('every scripted panel line has a spoken text and vice versa', () => {
    const lines = JSON.parse(fs.readFileSync('pages/lessons/fraction-times-fraction/voice/lines.json', 'utf8')) as Record<string, { text: string }>;
    expect(Object.keys(lines).sort()).toEqual(Object.keys(SCRIPT).sort());
    for (const [id, l] of Object.entries(lines)) {
      expect(l.text.length, id).toBeGreaterThan(3);
      expect(l.text, id).not.toMatch(/\d\s*\/\s*\d|[<>×÷]/);
    }
  });
});
