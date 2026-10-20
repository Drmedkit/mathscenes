// The lesson line: item families generate valid items, the right answer passes, and the classic wrong answers are
// classified as their catalogue misconception. The equal-share model conserves the whole.
import { describe, expect, it } from 'vitest';
import { FAMILIES, GENERATORS, mastery, nextFamily, rng, type Attempt } from '../src/lesson/items';
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
      expect(ids.size).toBeGreaterThan(id === 'toFrac' || id === 'slip' ? 60 : 100);
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

describe('session', () => {
  it('a twin after a miss, never the same family twice after a hit', () => {
    const R = rng(3);
    expect(nextFamily([], R)).toBe('story');
    expect(nextFamily([{ family: 'between', ok: false }], R)).toBe('between');
    for (let i = 0; i < 50; i++) expect(nextFamily([{ family: 'story', ok: true }, { family: 'between', ok: true }], R)).not.toBe('between');
  });
  it('mastery: 5 of the last 6, from at least 4 families', () => {
    const f = (fam: Attempt['family'], ok = true): Attempt => ({ family: fam, ok });
    expect(mastery([f('story'), f('toFrac'), f('toDiv'), f('between'), f('story'), f('toFrac', false)]).done).toBe(true);
    expect(mastery([f('story'), f('toFrac'), f('story'), f('toFrac'), f('story'), f('between')]).done).toBe(false);
    expect(mastery([f('story'), f('toFrac'), f('toDiv'), f('between'), f('story', false), f('toFrac', false)]).done).toBe(false);
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
