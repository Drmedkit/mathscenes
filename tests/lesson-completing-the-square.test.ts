// lesson-completing-the-square: the generic checks (every family x every sub-goal it serves x 300 seeds). Add topic checks below.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { rng } from '../src/lesson/runtime/item';
import { GENERATORS } from '../src/lesson/topics/completing-the-square/items';
import { PLAN } from '../src/lesson/topics/completing-the-square/plan';

const TOPIC = { subgoals: [...new Map(["secondary.solving-quadratic-equations-by-completing-the-square-and-the"].flatMap(i => JSON.parse(fs.readFileSync(`../math-curriculum-essentials/topics/${i}.json`, 'utf8')).subgoals).map((s: { id: string }) => [s.id, s] as const)).values()] };
const CATALOG = new Set<string>(JSON.parse(fs.readFileSync('../math-curriculum-essentials/misconceptions.json', 'utf8')).misconceptions.map((m: { id: string }) => m.id));
const GEN = GENERATORS as Record<string, (R: () => number, n: number, sg?: string) => import('../src/lesson/runtime/item').Item>;

describe('completing-the-square: plan', () => {
  it('walks through every sub-goal of the topic JSON, in order, each with a family', () => {
    expect(PLAN.map(p => p.id)).toEqual(TOPIC.subgoals.map((s: { id: string }) => s.id));
    for (const p of PLAN) { expect(p.families.length, p.id).toBeGreaterThan(0); for (const f of p.families) expect(GEN[f], f).toBeDefined(); }
  });
});

describe('completing-the-square: families', () => {
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

// ---------- topic checks: the exact maths, the classifier, rounding without ties ----------
import { roots, rootsH, rootVals, complete, q, qEq, noTie, surd, sameRoots } from '../src/lesson/topics/completing-the-square/quad';
import { MC } from '../src/lesson/topics/completing-the-square/common';
import { plain } from '../src/lesson/runtime/item';

describe('completing-the-square: maths', () => {
  it('roots are exact and in simplest radical form', () => {
    expect(rootsH(roots(1, 4, 1)).replace(/<[^>]+>/g, '')).toBe('x = −2 ± √3');
    expect(rootsH(roots(1, 3, -1)).replace(/<[^>]+>/g, '')).toBe('x = (−3 ± √13)/2');
    expect(rootsH(roots(2, -8, -4)).replace(/<[^>]+>/g, '')).toBe('x = 2 ± √6');
    expect(rootsH(roots(-1, 4, 1)).replace(/<[^>]+>/g, '')).toBe('x = 2 ± √5');
    expect(roots(1, 6, 9)).toEqual({ kind: 'one', x: [-3, 1] });
    expect(roots(1, 0, 1).kind).toBe('none');
    expect(rootVals(roots(2, -3, -2))).toEqual([-0.5, 2]);
    for (let a = -4; a <= 4; a++) for (let b = -8; b <= 8; b++) for (let c = -8; c <= 8; c++) {
      if (a === 0) continue;
      for (const x of rootVals(roots(a, b, c))) expect(Math.abs(a * x * x + b * x + c)).toBeLessThan(1e-9);
    }
  });
  it('completing the square adds (b/2)² to both sides', () => {
    const r = complete(q(6), q(-7));
    expect(qEq(r.h, q(3)) && qEq(r.add, q(9)) && qEq(r.rhs, q(16))).toBe(true);
    const o = complete(q(3), q(-1));
    expect(qEq(o.add, q(9, 4)) && qEq(o.rhs, q(13, 4))).toBe(true);
  });
  it('surd() reduces like roots()', () => {
    expect(sameRoots(surd(-8, 1, 52, 2), roots(1, 8, 3))).toBe(true);
  });
});

describe('completing-the-square: classifier probes', () => {
  const G = GENERATORS as Record<string, (R: () => number, n: number, sg?: string) => import('../src/lesson/runtime/item').Item>;
  it('fillTerm: b/2 is cs-wrong-term, b² is the incomplete formula', () => {
    for (let s = 1; s <= 60; s++) {
      const it = G.fillTerm!(rng(s), s), t = (it.answer as { v: number }).v, h = Math.sqrt(t);
      const b = Number(plain(it.prompt).match(/x² ([+−]) (\d+)x/)!.slice(1).join('').replace('−', '-').replace('+', ''));
      if (Math.abs(b) === 2) continue;   // (±1)² = 1: half of b is then the answer itself
      expect(it.check({ kind: 'num', v: b / 2 }).mc).toBe(MC.wrongTerm);
      expect(it.check({ kind: 'num', v: b * b }).mc).toBe(MC.incomplete);
      expect(h).toBe(Math.abs(b / 2));
    }
  });
  it('csSolve: ±s alone is forgets-to-add-h, one root twice is only-positive-root', () => {
    for (let s = 1; s <= 60; s++) {
      const it = G.csSolve!(rng(s), s), a = it.answer as { x: number; y: number };
      const m = plain(it.solution[1]!).match(/= (\d+) or/)!;
      const k = Number(m[1]);
      expect(it.check({ kind: 'pair', x: k, y: -k }).mc).toBe(MC.forgetsH);
      expect(it.check({ kind: 'pair', x: a.x, y: a.x }).mc).toBe(MC.onlyPos);
      expect(it.check({ kind: 'pair', x: a.y, y: a.x }).ok).toBe(true);
    }
  });
  it('discVal: (−b)² taken as −b² is negative-substitution-without-grouping', () => {
    for (let s = 1; s <= 60; s++) {
      const it = G.discVal!(rng(s), s), D = (it.answer as { v: number }).v;
      const m = plain(it.solution[0]!).match(/b = (−?\d+)/)!, b = Number(m[1]!.replace('−', '-'));
      expect(it.check({ kind: 'num', v: D - 2 * b * b }).mc).toBe(MC.negSub);
    }
  });
  it('rounded answers are never near a rounding tie', () => {
    // the generators keep the unrounded value in the solution ("≈ 8.753"); it must sit at least 0.0002 from a tie
    for (const f of ['formulaRound', 'rearrangeEval']) for (let s = 1; s <= 300; s++) {
      const it = G[f]!(rng(s), s);
      const vals = [...plain(it.solution.join(' ')).matchAll(/(−?\d+\.\d{3,4})/g)].map(m => Number(m[1]!.replace('−', '-')));
      const a = (it.answer as { v: number }).v;
      const v = vals.find(x => Math.abs(x - a) < 0.006) ?? a;   // an exact hundredth (4.25) has no longer decimal
      expect(v, it.prompt).toBeDefined();
      expect(noTie(v!, 2, 0.08), it.prompt).toBe(true);
    }
  });
  it('exact-root choices never contain a second option with the same roots', () => {
    for (const f of ['csExact', 'oddSolve', 'nmSolve', 'formulaExact']) for (let s = 1; s <= 300; s++) {
      const it = G[f]!(rng(s * 7 + 1), s);
      const texts = it.choices!.map(c => plain(c));
      expect(new Set(texts).size).toBe(texts.length);
    }
  });
});
