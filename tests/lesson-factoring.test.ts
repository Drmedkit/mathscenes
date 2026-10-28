// lesson-factoring: the generic checks (every family x every sub-goal it serves x 300 seeds). Add topic checks below.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { rng } from '../src/lesson/runtime/item';
import { GENERATORS } from '../src/lesson/topics/factoring/items';
import { PLAN } from '../src/lesson/topics/factoring/plan';

const TOPIC = { subgoals: [...new Map(["secondary-t6-05-factoring-polynomials"].flatMap(i => JSON.parse(fs.readFileSync(`../math-curriculum-essentials/topics/${i}.json`, 'utf8')).subgoals).map((s: { id: string }) => [s.id, s] as const)).values()] };
const CATALOG = new Set<string>(JSON.parse(fs.readFileSync('../math-curriculum-essentials/misconceptions.json', 'utf8')).misconceptions.map((m: { id: string }) => m.id));
const GEN = GENERATORS as Record<string, (R: () => number, n: number, sg?: string) => import('../src/lesson/runtime/item').Item>;

describe('factoring: plan', () => {
  it('walks through every sub-goal of the topic JSON, in order, each with a family', () => {
    expect(PLAN.map(p => p.id)).toEqual(TOPIC.subgoals.map((s: { id: string }) => s.id));
    for (const p of PLAN) { expect(p.families.length, p.id).toBeGreaterThan(0); for (const f of p.families) expect(GEN[f], f).toBeDefined(); }
  });
});

describe('factoring: families', () => {
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

// ---------- topic checks: the factoring maths, the misconception probes, the voice script ----------
import { F, Fp, T, expand, isComplete, lin, pairs, polyTex, quad, sumProd, facHtml, equal } from '../src/lesson/topics/factoring/fx';
import { MC, choiceItem, sameFn } from '../src/lesson/topics/factoring/common';
import { SCRIPT } from '../src/lesson/topics/factoring/script';

describe('factoring: maths', () => {
  it('the lesson examples multiply back', () => {
    expect(polyTex(expand(F(undefined, lin(1, 3), lin(1, 4))))).toBe('x^{2} + 7x + 12');
    expect(polyTex(expand(F(undefined, lin(1, 3), lin(1, -5))))).toBe('x^{2} - 2x - 15');
    expect(polyTex(expand(F(undefined, lin(2, 6), lin(1, -3))))).toBe('2x^{2} - 18');
    expect(polyTex(expand(F(2, lin(1, 3), lin(1, -3))))).toBe('2x^{2} - 18');
  });
  it('the sum-product search finds the one pair', () => {
    expect(sumProd(7, 12)).toEqual([3, 4]);
    expect(sumProd(-2, -15)).toEqual([-5, 3]);
    expect(sumProd(5, 3)).toBeNull();
    expect(pairs(12).length).toBe(6);
  });
  it('completeness over the integers', () => {
    expect(isComplete(F(2, lin(1, 3), lin(1, -3)))).toBe(true);
    expect(isComplete(F(undefined, lin(2, 6), lin(1, -3)))).toBe(false);      // Sam: correct but not complete
    expect(isComplete(F(2, quad(1, 0, -9)))).toBe(false);                      // a difference of squares left
    expect(isComplete(F(6, lin(1, 1), lin(1, -1)))).toBe(true);                // 6 is not split
    expect(isComplete(Fp(3, [lin(1, 2)], [2]))).toBe(true);
    expect(isComplete(F(undefined, quad(1, 1, 1)))).toBe(true);                // prime
    expect(isComplete({ k: T(1, 1), fs: [quad(1, 0, -4)] })).toBe(false);     // x(x² − 4)
  });
  it('choiceItem drops a wrong option that is secretly equal to the right one', () => {
    const R = rng(3);
    const right = F(undefined, lin(1, 3), lin(1, 4)), same = F(undefined, lin(1, 4), lin(1, 3));
    const it = choiceItem(R, { id: 't', family: 't', prompt: 'p', board: 'b', solution: [] }, [
      { t: facHtml(right), ok: true, say: '', ev: x => (x + 3) * (x + 4) },
      { t: facHtml(same), say: '', ev: x => (x + 4) * (x + 3) },
      { t: 'a', say: '', ev: x => x * x },
      { t: 'b', say: '', ev: x => x },
    ], { min: 3 });
    expect(it.choices!.length).toBe(3);
    expect(it.choices).not.toContain(facHtml(same));
    expect(sameFn(x => (x + 1) ** 2, x => x * x + 2 * x + 1)).toBe(true);
    expect(equal(expand(right), expand(same))).toBe(true);
  });
});

describe('factoring: misconception probes (300 seeds)', () => {
  const plain = (s: string) => s.replace(/<sup>(\d)<\/sup>/g, '^$1').replace(/<[^>]+>/g, '');
  function probe(fam: string, sg: string, pickWrong: (it: import('../src/lesson/runtime/item').Item) => import('../src/lesson/runtime/item').Response | null, mc: string) {
    let hit = 0;
    for (let s = 1; s <= 300; s++) {
      const it = GEN[fam]!(rng(s * 13 + 1), s, sg);
      const r = pickWrong(it);
      if (!r) continue;
      const v = it.check(r);
      expect(v.ok, it.prompt).toBe(false);
      if (v.mc === mc) hit++;
    }
    expect(hit, `${fam}: ${mc}`).toBeGreaterThan(10);
  }
  const choiceWith = (re: RegExp) => (it: import('../src/lesson/runtime/item').Item) => { const i = (it.choices ?? []).findIndex(c => re.test(plain(c))); return i >= 0 && !it.check({ kind: 'choice', i }).ok ? { kind: 'choice' as const, i } : null; };
  it('opposite signs: the larger number with the wrong sign', () => probe('monicOppPair', 'monic-opposite-signs', it => {
    const a = it.answer as { x: number; y: number }; return { kind: 'pair', x: -a.y, y: -a.x };
  }, MC.largerReversed));
  it('a pair with the right product, sum unchecked', () => probe('monicPair', 'monic-positive', it => {
    const a = it.answer as { x: number; y: number }; const c = a.x * a.y;
    const o = pairs(c).find(([u, v]) => u > 0 && u + v !== a.x + a.y); return o ? { kind: 'pair', x: o[0], y: o[1] } : null;
  }, MC.sumUnchecked));
  it('difference of squares as a squared binomial', () => probe('dosPick', 'difference-of-squares', choiceWith(/\)\^2$/), MC.dosSquared));
  it('a GCF divided out of the first term only', () => probe('gcfOut', 'numeric-gcf-extraction', it => { for (let i = 0; i < (it.choices ?? []).length; i++) if (it.check({ kind: 'choice', i }).mc === MC.oneTerm) return { kind: 'choice', i }; return null; }, MC.oneTerm));
  it('stopping before complete (an equal but incomplete product)', () => probe('completePick', 'factor-completely', it => { for (let i = 0; i < (it.choices ?? []).length; i++) if (it.check({ kind: 'choice', i }).mc === MC.stops) return { kind: 'choice', i }; return null; }, MC.stops));
});

describe('factoring: voice script', () => {
  const LINES = JSON.parse(fs.readFileSync('pages/lessons/factoring/voice/lines.json', 'utf8')) as Record<string, { text: string }>;
  it('every panel line has its spoken text, without digits or symbols', () => {
    for (const [id, v] of Object.entries(SCRIPT)) {
      expect(LINES[id]?.text, id).toBe(v.say);
      expect(/[0-9=+×÷<>^²³−]/.test(v.say), `${id}: ${v.say}`).toBe(false);
    }
  });
});
