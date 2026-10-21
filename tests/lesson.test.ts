// The lesson line: item families generate valid items, the right answer passes, and the classic wrong answers are
// classified as their catalogue misconception. The equal-share model conserves the whole.
import { describe, expect, it } from 'vitest';
import { FAMILIES, GENERATORS, rng } from '../src/lesson/topics/fractions-as-division/items';
import { PLAN } from '../src/lesson/topics/fractions-as-division/plan';
import { computeEqualShare } from '../src/lesson/EqualShare';

describe('item families', () => {
  for (const { id } of FAMILIES) {
    it(`${id}: 400 seeded items, the answer passes and choices are unique`, () => {
      const ids = new Set<string>();
      for (let s = 1; s <= 400; s++) {
        const it = GENERATORS[id](rng(s), s);
        expect(it.check(it.answer).ok, `${it.prompt} ${JSON.stringify(it.answer)}`).toBe(true);
        if (it.choices) {
          expect(new Set(it.choices).size).toBe(it.choices.length);
          expect(it.choices.filter((_, i) => it.check({ kind: 'choice', i }).ok).length).toBe(1);
        }
        ids.add(it.prompt + it.board);
      }
      expect(ids.size).toBeGreaterThan(['toFrac', 'slip', 'twoWays'].includes(id) ? 40 : 100);
    });
  }
  it('story: the flipped fraction and the one-piece answer are diagnosed', () => {
    for (let s = 1; s <= 200; s++) {
      const it = GENERATORS.story(rng(s), s);
      const a = it.answer.kind === 'frac' ? it.answer.n : 0, b = it.answer.kind === 'frac' ? it.answer.d : 0;
      expect(it.check({ kind: 'frac', w: 0, n: b, d: a }).mc).toBe('mc.fractions-concept.fraction-division-order-reversed');
      if (a > 1) expect(it.check({ kind: 'frac', w: 0, n: 1, d: b }).mc).toBe('mc.fractions-concept.all-shown-taken-as-one-whole');
      if (a > b) {
        expect(it.check({ kind: 'frac', w: Math.floor(a / b), n: 0, d: 1 }).mc).toBe('mc.fractions-concept.leftover-not-shared-as-fraction');
        expect(it.check({ kind: 'frac', w: Math.floor(a / b), n: a % b, d: b }).ok).toBe(true);
      }
    }
  });
  it('remainder: the leftover over the dividend is diagnosed', () => {
    const it = GENERATORS.remainder(rng(7), 1);
    if (it.answer.kind !== 'frac') throw new Error('frac');
    const { w, n, d } = it.answer, a = w * d + n;
    expect(it.check({ kind: 'frac', w, n, d: a }).mc).toBe('mc.fractions-concept.remainder-misplaced-in-fraction-part');
    expect(it.check({ kind: 'frac', w, n: 0, d: 1 }).mc).toBe('mc.fractions-concept.leftover-not-shared-as-fraction');
    expect(it.check({ kind: 'frac', w: 0, n: a * 2, d: d * 2 }).ok).toBe(true);   // unsimplified forms count
  });
});

describe('plan', () => {
  it('walks through all 12 sub-goals of the topic JSON, and every family it names exists', () => {
    expect(PLAN.map(p => p.id)).toEqual(['share-one-whole', 'share-several-wholes-less-than-one', 'share-one-or-more-wholes', 'fraction-bar-means-divide', 'sharing-story-to-division', 'quotient-as-mixed-number', 'bound-between-wholes', 'remainder-as-fraction-of-divisor', 'conservation-check', 'two-sharing-methods-agree', 'remainder-subdivide-or-keep', 'remainder-sharing-vs-grouping']);
    for (const p of PLAN) for (const f of p.families) expect(GENERATORS[f as keyof typeof GENERATORS], f).toBeDefined();
  });
  it('every sub-goal x family makes valid items (300 seeds), with the sub-goal ranges', () => {
    for (const p of PLAN) for (const f of p.families) for (let s = 1; s <= 300; s++) {
      const it = GENERATORS[f as keyof typeof GENERATORS](rng(s * 7 + 1), s, p.id);
      expect(it.check(it.answer).ok, `${p.id}/${f}: ${it.prompt}`).toBe(true);
      if (p.id === 'share-one-whole' && it.answer.kind === 'frac') expect(it.answer.n).toBe(1);
      if (p.id === 'share-several-wholes-less-than-one' && it.answer.kind === 'frac') expect(it.answer.n).toBeLessThan(it.answer.d);
    }
  });
});

describe('EqualShare maths', () => {
  it('every sharer gets a pieces of 1/b and every piece is dealt once', () => {
    const m = computeEqualShare({ a: 5, b: 3 });
    expect(m.share).toEqual({ p: 5, q: 3 });
    expect(m.whole).toBe(1); expect(m.rem).toBe(2); expect(m.rows).toBe(2);
    expect(m.deals.length).toBe(15);
    expect(new Set(m.deals.map(d => `${d.bar},${d.piece}`)).size).toBe(15);
  });
  it('refuses shares it cannot draw', () => {
    expect(() => computeEqualShare({ a: 7, b: 2 })).toThrow(/more than 2 whole/);
    expect(() => computeEqualShare({ a: 3, b: 1 })).toThrow(/2 to 6/);
  });
});

describe('pictures', () => {
  it('every object story and every slip item can be drawn by the EqualShare model', async () => {
    const { equalShareFits } = await import('../src/lesson/shareLayout');
    for (let s = 1; s <= 400; s++) for (const f of ['story', 'slip'] as const) {
      const it = GENERATORS[f](rng(s), s);
      if (it.model) expect(equalShareFits(it.model.a, it.model.b), it.prompt).toBe(true);
      else expect(it.strip, it.prompt).toBeDefined();
    }
  });
});
