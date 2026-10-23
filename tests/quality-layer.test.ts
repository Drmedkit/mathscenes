// quality-layer.test.ts: the lesson-side half of docs/lessons/QUALITY_LAYER.md, for every lesson that has it.
// explain.ts: every (sub-goal, family) pair x 60 seeds gives 2-5 steps whose result the lesson's own check() accepts
// and equals the item's answer by value. placement.ts: 1-3 picks that exist in plan.ts, the use() filter keeps items,
// and every kept item's answer passes its check. (The oracle-side checks run in tools/quality/sweep.mjs.)
// Also the runtime helpers that read the answer out of the steps.
import { describe, expect, it } from 'vitest';
import { rng, type Explain, type Item, type Response } from '../src/lesson/runtime/item';
import type { SubgoalPlan } from '../src/lesson/runtime/practice';
import type { Placement } from '../src/lesson/placement/types';
import { endOnChoice, leadValue, resultOf, stepsFrom } from '../src/lesson/runtime/explain';
import { stepsOf } from '../src/lesson/runtime/practice';

type Gens = Record<string, (R: () => number, n: number, sg?: string) => Item>;
const EXPLAIN = import.meta.glob<{ explain: Explain }>('../src/lesson/topics/*/explain.ts');
const PLACE = import.meta.glob<{ PLACEMENT: Placement }>('../src/lesson/topics/*/placement.ts');
const ITEMS = import.meta.glob<Record<string, unknown>>('../src/lesson/topics/*/items.ts');
const PLANS = import.meta.glob<{ PLAN: SubgoalPlan[] }>('../src/lesson/topics/*/plan.ts');
const slugOf = (k: string) => k.split('/').at(-2)!;
async function lesson(slug: string): Promise<{ gens: Gens; plan: SubgoalPlan[] }> {
  const base = `../src/lesson/topics/${slug}/`;
  const items = await ITEMS[base + 'items.ts']!(), plan = (await PLANS[base + 'plan.ts']!()).PLAN;
  return { gens: (items.GENERATORS ?? items.GENS) as Gens, plan };
}
const value = (r: Response): number[] => (r.kind === 'num' ? [r.v] : r.kind === 'frac' ? [r.w + r.n / r.d] : r.kind === 'pair' ? [r.x, r.y] : [r.i]);
const sameValue = (a: Response, b: Response) => value(a).length === value(b).length && value(a).every((x, i) => Math.abs(x - value(b)[i]!) < 1e-9);

describe('runtime: reading the answer out of the steps', () => {
  it('reads marked values with units, fractions, mixed numbers and a bare π', () => {
    expect(leadValue('3 weeks')?.v).toBe(3);
    expect(leadValue('−2.5')?.v).toBe(-2.5);
    expect(leadValue('$1,450.50')?.v).toBe(1450.5);
    expect(leadValue('<span class="fr"><span>11</span><span>2</span></span>π cm')?.frac).toEqual([0, 11, 2]);
    expect(leadValue('2 <span class="fr"><span>1</span><span>2</span></span>')?.v).toBe(2.5);
    expect(leadValue('π cm')?.v).toBe(1);
    expect(leadValue('the circumference')).toBeNull();
  });
  const base = { id: 't', family: 'f', prompt: '', board: '', solution: [], check: () => ({ ok: true, say: '' }) };
  it('num: the last marked value, else the last number of the last step', () => {
    const it0 = { ...base, input: 'num', answer: { kind: 'num', v: 4 } } as Item;
    expect(resultOf(it0, ['x = <b class="s">4</b>.', 'Check: 3 · 4 + 1 = 13.'])).toEqual({ kind: 'num', v: 4 });
    expect(resultOf(it0, ['So 12 ÷ 3 = 4.'])).toEqual({ kind: 'num', v: 4 });
    expect(resultOf(it0, ['the area is <b class="a ans">9π sq ft</b>'])).toEqual({ kind: 'num', v: 9 });
  });
  it('choice: the marked or the one named choice; endOnChoice adds "So: …" only when needed', () => {
    const it0 = { ...base, input: 'choice', choices: ['Segment A', 'Segment B'], answer: { kind: 'choice', i: 1 } } as Item;
    expect(resultOf(it0, endOnChoice(['A radius goes from the center to the circle.'], 'Segment B'))).toEqual({ kind: 'choice', i: 1 });
    expect(endOnChoice(['So: <b class="s">Segment B</b>'], 'Segment B')).toHaveLength(1);
    expect(stepsFrom(it0, ['Nothing named here.'])).toBeNull();
  });
  it('the card falls back to item.solution when explain is missing, gives nothing or throws', () => {
    const it0 = { ...base, input: 'num', answer: { kind: 'num', v: 1 }, solution: ['a', 'b'] } as Item;
    expect(stepsOf(it0)).toEqual(['a', 'b']);
    expect(stepsOf(it0, () => null)).toEqual(['a', 'b']);
    expect(stepsOf(it0, () => { throw new Error('x'); })).toEqual(['a', 'b']);
    expect(stepsOf(it0, () => ({ steps: ['c', 'd'], result: { kind: 'num', v: 1 } }))).toEqual(['c', 'd']);
  });
});

for (const [k, load] of Object.entries(EXPLAIN)) {
  const slug = slugOf(k);
  describe(`${slug}: explain`, () => {
    it('every pair x 60 seeds: 2-5 steps, the steps end on an answer the lesson accepts and equal to item.answer', async () => {
      const { explain } = await load(), { gens, plan } = await lesson(slug);
      for (const p of plan) for (const f of p.families) for (let s = 1; s <= 60; s++) {
        const item = gens[f]!(rng(s * 101 + f.length), s, p.id);
        const ex = explain(item);
        expect(ex, `${p.id}/${f} seed ${s}: ${item.prompt}`).not.toBeNull();
        expect(ex!.steps.length, `${p.id}/${f}`).toBeGreaterThanOrEqual(2);
        expect(ex!.steps.length, `${p.id}/${f}`).toBeLessThanOrEqual(5);
        expect(item.check(ex!.result).ok, `${p.id}/${f}: ${JSON.stringify(ex!.result)} for ${item.prompt}`).toBe(true);
        expect(sameValue(ex!.result, item.answer), `${p.id}/${f}: ${JSON.stringify(ex!.result)} vs ${JSON.stringify(item.answer)}`).toBe(true);
      }
    });
  });
}
for (const [k, load] of Object.entries(PLACE)) {
  const slug = slugOf(k);
  describe(`${slug}: placement`, () => {
    it('1-3 picks of plan.ts; use() keeps items; every kept answer passes its check', async () => {
      const { PLACEMENT: P } = await load(), { gens, plan } = await lesson(slug);
      expect(P.picks.length).toBeGreaterThanOrEqual(1);
      expect(P.picks.length).toBeLessThanOrEqual(3);
      for (const pk of P.picks) {
        expect(plan.find(p => p.id === pk.subgoal)?.families, `${pk.subgoal}/${pk.family}`).toContain(pk.family);
        let kept = 0;
        const R = rng(9 + pk.family.length);
        for (let n = 1; n <= 200; n++) {
          const item = gens[pk.family]!(R, n, pk.subgoal);
          if (P.use && !P.use(item)) continue;
          kept++;
          expect(item.check(item.answer).ok).toBe(true);
        }
        expect(kept, `${pk.subgoal}/${pk.family}: use() keeps too few`).toBeGreaterThan(50);
      }
    });
  });
}
