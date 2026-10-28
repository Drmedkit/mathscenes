// lesson-polynomials: the generic checks (every family x every sub-goal it serves x 300 seeds). Add topic checks below.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { rng } from '../src/lesson/runtime/item';
import { GENERATORS } from '../src/lesson/topics/polynomials/items';
import { PLAN } from '../src/lesson/topics/polynomials/plan';

const TOPIC = { subgoals: [...new Map(["secondary-t6-04-algebraic-expressions-and-polynomials"].flatMap(i => JSON.parse(fs.readFileSync(`../math-curriculum-essentials/topics/${i}.json`, 'utf8')).subgoals).map((s: { id: string }) => [s.id, s] as const)).values()] };
const CATALOG = new Set<string>(JSON.parse(fs.readFileSync('../math-curriculum-essentials/misconceptions.json', 'utf8')).misconceptions.map((m: { id: string }) => m.id));
const GEN = GENERATORS as Record<string, (R: () => number, n: number, sg?: string) => import('../src/lesson/runtime/item').Item>;

describe('polynomials: plan', () => {
  it('walks through every sub-goal of the topic JSON, in order, each with a family', () => {
    expect(PLAN.map(p => p.id)).toEqual(TOPIC.subgoals.map((s: { id: string }) => s.id));
    for (const p of PLAN) { expect(p.families.length, p.id).toBeGreaterThan(0); for (const f of p.families) expect(GEN[f], f).toBeDefined(); }
  });
});

describe('polynomials: families', () => {
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

// ---------- topic checks: the polynomial maths, the misconception probes, the voice script ----------
import { T, add, collect, degree, equal, evalP, mul, neg, polyHtml, polyTex, sub, table } from '../src/lesson/topics/polynomials/poly';
import { MC } from '../src/lesson/topics/polynomials/common';
import { SCRIPT } from '../src/lesson/topics/polynomials/script';
// @ts-expect-error: a plain .mjs helper without types
import { plainText } from '../tools/quality/view.mjs';

describe('polynomials: maths', () => {
  const xp3 = [T(1, 1), T(3)];
  it('(x + 3)^2 = x^2 + 6x + 9, and every partial product is there', () => {
    expect(polyTex(collect(mul(xp3, xp3)))).toBe('x^{2} + 6x + 9');
    expect(table(xp3, xp3).flat().length).toBe(4);
  });
  it('(x - 2)(x^2 + x + 3) = x^3 - x^2 + x - 6, degree 3', () => {
    const p = mul([T(1, 1), T(-2)], [T(1, 2), T(1, 1), T(3)]);
    expect(polyTex(collect(p))).toBe('x^{3} - x^{2} + x - 6');
    expect(degree(p)).toBe(3);
  });
  it("Riley's subtraction: the right answer and his slip differ at x = 1", () => {
    const A = [T(5, 2), T(3, 1), T(-2)], B = [T(2, 2), T(-4, 1), T(1)];
    expect(polyTex(collect(sub(A, B)))).toBe('3x^{2} + 7x - 3');
    const riley = [T(3, 2), T(-1, 1), T(-1)];
    expect(evalP(sub(A, B), 1)).toEqual({ p: 7, q: 1 });
    expect(evalP(riley, 1)).toEqual({ p: 1, q: 1 });
    expect(equal(add(A, [neg(B)[0]!, ...B.slice(1)]), riley)).toBe(true);
  });
  it('the zero polynomial has no degree; a constant has degree 0', () => {
    expect(degree([T(4, 2), T(-4, 2)])).toBeNull();
    expect(degree([T(7)])).toBe(0);
  });
  it('HTML of a polynomial reads unambiguously as plain text', () => {
    expect(plainText(polyHtml([T(3, 2, 1), T(-1, 1), T({ p: 1, q: 2 } as never, 2)]))).toBe('3x^2 y − x + 1/2 x^2');
  });
});

describe('polynomials: misconceptions are classified', () => {
  const R = rng(99);
  const probe = (fam: string, sg: string, pickWrong: (it: import('../src/lesson/runtime/item').Item) => import('../src/lesson/runtime/item').Response | null, mc: string) => {
    let seen = 0;
    for (let s = 1; s <= 400 && !seen; s++) {
      const it = GEN[fam]!(rng(s * 13 + 5), s, sg);
      const r = pickWrong(it);
      if (r && it.check(r).mc === mc) seen++;
    }
    expect(seen, `${fam} -> ${mc}`).toBeGreaterThan(0);
  };
  const choiceWith = (re: RegExp) => (it: import('../src/lesson/runtime/item').Item) => { const i = (it.choices ?? []).findIndex(c => re.test(plainText(c))); return i >= 0 ? { kind: 'choice' as const, i } : null; };
  it('firsts and lasts only', () => probe('binBin', 'binomial-times-binomial', it => {
    for (let i = 0; i < (it.choices ?? []).length; i++) if (it.check({ kind: 'choice', i }).mc === MC.firstsLasts) return { kind: 'choice', i };
    return null;
  }, MC.firstsLasts));
  it('negating only the first term', () => probe('subPoly', 'subtract-polynomials', it => {
    for (let i = 0; i < (it.choices ?? []).length; i++) if (it.check({ kind: 'choice', i }).mc === MC.negFirst) return { kind: 'choice', i };
    return null;
  }, MC.negFirst));
  it('the degree read from the first term', () => probe('polyDegree', 'degree-of-polynomial', it => {
    const m = plainText(it.prompt).match(/of (.+)\?$/)![1]!.split(/ [+−] /)[0]!.match(/x\^(\d)/);
    return m ? { kind: 'num', v: Number(m[1]) } : null;
  }, MC.byPosition));
  it('a square distributed over a sum', () => probe('squareBin', 'square-of-binomial', choiceWith(/^\d*x\^2 \+ \d+$/), MC.fnSum));
  it('a quotient called a polynomial', () => probe('closure', 'closure', it => (/quotient/.test(it.prompt) ? choiceWith(/^Yes/)(it) : null), MC.quotient));
  void R;
});

describe('polynomials: voice script', () => {
  const LINES = JSON.parse(fs.readFileSync('pages/lessons/polynomials/voice/lines.json', 'utf8')) as Record<string, { text: string }>;
  it('every panel line has its spoken text, without digits or symbols', () => {
    for (const [id, v] of Object.entries(SCRIPT)) {
      expect(LINES[id]?.text, id).toBe(v.say);
      expect(/[0-9=+×÷<>^²³]/.test(v.say), `${id}: ${v.say}`).toBe(false);
    }
  });
});
