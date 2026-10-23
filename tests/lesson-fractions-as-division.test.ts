// lesson-fractions-as-division: the quality layer (worked steps, check-in adapter) and regressions found while building it.
import { describe, expect, it } from 'vitest';

// ---- quality layer (docs/lessons/QUALITY_LAYER.md): worked steps, check-in adapter, regressions ----
import { rng as qlRng, plain as qlPlain, type Item as QlItem } from '../src/lesson/runtime/item';
import { GENERATORS as qlGens } from '../src/lesson/topics/fractions-as-division/items';
import { PLAN as qlPlan } from '../src/lesson/topics/fractions-as-division/plan';
import { explain as qlExplain } from '../src/lesson/topics/fractions-as-division/explain';
import { PLACEMENT as qlPlacement } from '../src/lesson/topics/fractions-as-division/placement';

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
      expect(text, `${p.id}/${f}`).not.toMatch(/(?<![\d.\/])1 (pieces|wholes|bars|granola bars|marbles|balloons|stickers|trading cards)\b/);
    }
  });
  it('slip: Jordan’s flipped share never uses 1 bar ("1 granola bars", "cut into 1 pieces", two right reasons)', () => {
    for (let s = 1; s <= 400; s++) {
      const it0 = gens.slip!(qlRng(s), s, 'remainder-as-fraction-of-divisor');
      expect(qlPlain(it0.prompt), it0.prompt).not.toMatch(/^1 /);
      for (const c of it0.choices ?? []) expect(c).not.toMatch(/into 1 pieces/);
    }
  });
  it('cutOrKeep marks both answers: each gets q, r left over', () => {
    for (let s = 1; s <= 100; s++) {
      const it0 = gens.cutOrKeep!(qlRng(s), s, 'remainder-subdivide-or-keep');
      expect(qlExplain(it0)!.result).toEqual(it0.answer);
    }
  });
});
