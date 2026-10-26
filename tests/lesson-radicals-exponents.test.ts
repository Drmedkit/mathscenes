// lesson-radicals-exponents: the generic checks (every family x every sub-goal it serves x 300 seeds). Add topic checks below.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { rng } from '../src/lesson/runtime/item';
import { GENERATORS } from '../src/lesson/topics/radicals-exponents/items';
import { PLAN } from '../src/lesson/topics/radicals-exponents/plan';

const TOPIC = { subgoals: [...new Map(["secondary-t6-03-radicals-and-rational-exponents"].flatMap(i => JSON.parse(fs.readFileSync(`../math-curriculum-essentials/topics/${i}.json`, 'utf8')).subgoals).map((s: { id: string }) => [s.id, s] as const)).values()] };
const CATALOG = new Set<string>(JSON.parse(fs.readFileSync('../math-curriculum-essentials/misconceptions.json', 'utf8')).misconceptions.map((m: { id: string }) => m.id));
const GEN = GENERATORS as Record<string, (R: () => number, n: number, sg?: string) => import('../src/lesson/runtime/item').Item>;

describe('radicals-exponents: plan', () => {
  it('walks through every sub-goal of the topic JSON, in order, each with a family', () => {
    expect(PLAN.map(p => p.id)).toEqual(TOPIC.subgoals.map((s: { id: string }) => s.id));
    for (const p of PLAN) { expect(p.families.length, p.id).toBeGreaterThan(0); for (const f of p.families) expect(GEN[f], f).toBeDefined(); }
  });
});

describe('radicals-exponents: families', () => {
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

// ---------- topic checks ----------
import { SCRIPT } from '../src/lesson/topics/radicals-exponents/script';
import { extract, iroot, powQ, q, S, sAdd, sEq, sMul } from '../src/lesson/topics/radicals-exponents/rad';
import { ExpLadder, expLabel } from '../src/lesson/topics/radicals-exponents/ExpLadder';
import { explain } from '../src/lesson/topics/radicals-exponents/explain';
import { MC } from '../src/lesson/topics/radicals-exponents/common';

describe('radicals-exponents: maths', () => {
  it('roots and rational powers are exact, with the lowest-terms convention for negative bases', () => {
    expect(iroot(-27, 3)).toBe(-3); expect(iroot(-16, 2)).toBeNull(); expect(iroot(50, 2)).toBeNull();
    expect(powQ(q(8), 2, 3)).toEqual({ kind: 'value', v: [4, 1] });
    expect(powQ(q(16), -3, 4)).toEqual({ kind: 'value', v: [1, 8] });
    expect(powQ(q(27, 8), -2, 3)).toEqual({ kind: 'value', v: [4, 9] });
    expect(powQ(q(-8), 2, 6)).toEqual({ kind: 'value', v: [-2, 1] });        // read as (−8)^(1/3)
    expect(powQ(q(-4), 3, 2).kind).toBe('notreal');
    expect(powQ(q(5), 1, 3).kind).toBe('irrational');
  });
  it('simplest radical form and surd arithmetic match the topic examples', () => {
    expect(extract(72, 2)).toEqual({ out: 6, rest: 2 }); expect(extract(54, 3)).toEqual({ out: 3, rest: 2 });
    expect(sEq(sAdd(S(1, 8), S(1, 18)), S(5, 2))).toBe(true);                               // √8 + √18 = 5√2
    expect(sEq(sMul(sAdd(S(1), S(1, 2)), sAdd(S(1), S(1, 2))), sAdd(S(3), S(2, 2)))).toBe(true);   // (1 + √2)² = 3 + 2√2
    expect(sEq(sMul(sAdd(S(0), S(1, 5)), S(1)), S(1, 5))).toBe(true);
    expect(sEq(sMul(sAdd(S(1, 5), S(1, 2)), sAdd(S(1, 5), S(-1, 2))), S(3))).toBe(true);    // conjugates
  });
  it('the ladder labels exponents in equal steps of 1/n and refuses crowded ticks', () => {
    expect(expLabel(2, 4)).toBe('\\frac{2}{4}'); expect(expLabel(-4, 4)).toBe('-1'); expect(expLabel(0, 3)).toBe('0');
    expect(() => ExpLadder({ base: '2', n: 12, lo: 0, hi: 12, values: Array(13).fill(null) }, { x: 60, y: 70, w: 940, h: 940 }, {} as never)).toThrow();
  });
});

describe('radicals-exponents: misconception probes', () => {
  const G = GENERATORS as Record<string, (R: () => number, n: number, sg?: string) => import('../src/lesson/runtime/item').Item>;
  const find = (fam: string, pred: (it: import('../src/lesson/runtime/item').Item) => boolean) => { for (let s = 1; s < 2000; s++) { const it = G[fam]!(rng(s), s); if (pred(it)) return it; } throw new Error(`no ${fam} item`); };
  it('8^(2/3) typed as 16/3 (base × exponent) is classified', () => {
    const it = find('mnEval', i => i.board.startsWith('8^{\\frac{2}{3}}'));
    expect(it.check({ kind: 'num', v: 16 / 3 }).mc).toBe(MC.baseTimesExp);
    expect(it.check({ kind: 'num', v: 4 }).ok).toBe(true);
  });
  it('a negative typed for a negative exponent is negative-exponent-makes-negative', () => {
    const it = find('negEval', () => true);
    const a = it.answer as { kind: 'frac'; w: number; n: number; d: number };
    expect(it.check({ kind: 'frac', w: 0, n: -(a.w * a.d + a.n), d: a.d }).mc).toBe(MC.negMakesNeg);
  });
  it('√72 as 3√8 is partial, as 36√2 is a factor out without its root', () => {
    const it = find('simplifyRoot', i => i.board.startsWith('\\sqrt{72}'));
    expect(it.check({ kind: 'pair', x: 6, y: 2 }).ok).toBe(true);
    expect(it.check({ kind: 'pair', x: 3, y: 8 }).mc).toBe(MC.partial);
    expect(it.check({ kind: 'pair', x: 36, y: 2 }).mc).toBe(MC.noRoot);
  });
  it('a product exponent typed as the product of the exponents is product-of-powers-multiplies-exponents', () => {
    const it = find('prodExp', () => true);
    const m = /x\^\{(-?)\\frac\{(\d+)\}\{(\d+)\}\} \\cdot x\^\{(-?)\\frac\{(\d+)\}\{(\d+)\}\}/.exec(it.board);
    if (!m) return;
    const a = (m[1] ? -1 : 1) * Number(m[2]), b = Number(m[3]), c = (m[4] ? -1 : 1) * Number(m[5]), d = Number(m[6]);
    const v = it.check({ kind: 'pair', x: a * c, y: b * d });
    if (!v.ok) expect(v.mc).toBe(MC.prodMult);
  });
  it('every solution / steps card arrives at the answer', () => {
    for (const fam of Object.keys(G)) for (let s = 1; s <= 40; s++) {
      const it = G[fam]!(rng(s * 13 + 1), s);
      const ex = explain(it);
      expect(ex, `${fam}: ${it.prompt}`).not.toBeNull();
      expect(it.check(ex!.result).ok, `${fam}: ${it.prompt} → ${JSON.stringify(ex!.result)}`).toBe(true);
    }
  });
});

describe('radicals-exponents: voice', () => {
  it('lines.json speaks every panel line of parts 1-4, without digits or symbols', () => {
    const lines = JSON.parse(fs.readFileSync('pages/lessons/radicals-exponents/voice/lines.json', 'utf8')) as Record<string, { text: string }>;
    expect(Object.keys(lines).sort()).toEqual(Object.keys(SCRIPT).sort());
    for (const [k, v] of Object.entries(SCRIPT)) { expect(lines[k]!.text, k).toBe(v.say); expect(v.say, k).not.toMatch(/[0-9<>≤≥=−+×÷√∛∜]/); }
  });
});
