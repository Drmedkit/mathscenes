// lesson-complex-numbers: the generic checks (every family x every sub-goal it serves x 300 seeds). Add topic checks below.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { rng } from '../src/lesson/runtime/item';
import { GENERATORS } from '../src/lesson/topics/complex-numbers/items';
import { PLAN } from '../src/lesson/topics/complex-numbers/plan';
import type { Item } from '../src/lesson/runtime/item';
import * as X from '../src/lesson/topics/complex-numbers/cx';
import { cxChoice, MC as M } from '../src/lesson/topics/complex-numbers/common';
import { SCRIPT } from '../src/lesson/topics/complex-numbers/script';
import { PLACEMENT } from '../src/lesson/topics/complex-numbers/placement';
import { explain } from '../src/lesson/topics/complex-numbers/explain';

const TOPIC = { subgoals: [...new Map(["secondary-t7-01-complex-numbers"].flatMap(i => JSON.parse(fs.readFileSync(`../math-curriculum-essentials/topics/${i}.json`, 'utf8')).subgoals).map((s: { id: string }) => [s.id, s] as const)).values()] };
const CATALOG = new Set<string>(JSON.parse(fs.readFileSync('../math-curriculum-essentials/misconceptions.json', 'utf8')).misconceptions.map((m: { id: string }) => m.id));
const GEN = GENERATORS as Record<string, (R: () => number, n: number, sg?: string) => import('../src/lesson/runtime/item').Item>;

describe('complex-numbers: plan', () => {
  it('walks through every sub-goal of the topic JSON, in order, each with a family', () => {
    expect(PLAN.map(p => p.id)).toEqual(TOPIC.subgoals.map((s: { id: string }) => s.id));
    for (const p of PLAN) { expect(p.families.length, p.id).toBeGreaterThan(0); for (const f of p.families) expect(GEN[f], f).toBeDefined(); }
  });
});

describe('complex-numbers: families', () => {
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
type Pair = { kind: 'pair'; x: number; y: number };
const parseZ = (z: string) => { const m = /^(-?\d+) ([+-]) (\d*)i$/.exec(z.trim()); return m ? [Number(m[1]), (m[2] === '-' ? -1 : 1) * Number(m[3] || 1)] as const : null; };

describe('complex-numbers: exact maths', () => {
  it('multiplies, divides, conjugates and powers i', () => {
    expect(X.eq(X.mul(X.C(2, 3), X.C(4, 1)), X.C(5, 14))).toBe(true);
    expect(X.eq(X.mul(X.C(1, 1), X.C(1, 1)), X.C(0, 2))).toBe(true);
    expect(X.eq(X.div(X.C(5, 5), X.C(1, 2)), X.C(3, -1))).toBe(true);
    expect(X.eq(X.div(X.C(1, 1), X.C(1, -1)), X.C(0, 1))).toBe(true);
    expect(X.eq(X.div(X.C(2, 1), X.C(3, -1)), X.CQ(X.q(1, 2), X.q(1, 2)))).toBe(true);
    expect(X.eq(X.div(X.C(5), X.C(0, 1)), X.C(0, -5))).toBe(true);
    expect(() => X.div(X.C(1, 1), X.C(0, 0))).toThrow();
    expect(X.qVal(X.normSq(X.C(-2, 5)))).toBe(29);
    expect([0, 3, 4, 10, 27].map(n => X.html(X.powI(n)))).toEqual(['1', '−<i>i</i>', '1', '−1', '−<i>i</i>']);
    for (let n = 0; n < 40; n++) expect(X.eq(X.powI(n), X.pow(X.I, n))).toBe(true);
    expect(X.tex(X.CQ(X.q(7, 5), X.q(-1, 5)))).toBe('\\frac{7}{5} - \\frac{1}{5}i');
    expect(X.html(X.CQ(X.q(7, 5), X.q(-1, 5)))).toContain('(<span class="fr"><span>1</span><span>5</span></span>)<i>i</i>');
    expect(X.extract(72)).toEqual({ out: 6, rest: 2 });
  });
});

describe('complex-numbers: no secretly right distractor', () => {
  it('cxChoice drops a wrong choice equal in value to the answer, however it is written', () => {
    const it = cxChoice(rng(5), { id: 't', family: 't', prompt: 'p', board: 'b', solution: [] },
      { z: X.mul(X.C(2, 5), X.C(2, -5)), text: '(2 + 5i)(2 − 5i)', say: '' },
      [{ z: X.mul(X.C(5, 2), X.C(5, -2)), text: '(5 + 2i)(5 − 2i)', say: '' }, { z: X.C(1, 1), say: '' }, { z: X.C(2, 2), say: '' }, { z: X.C(3, 3), say: '' }]);
    expect(it.choices!.some(c => c.includes('(5 + 2i)'))).toBe(false);
  });
  it('the right choice of iPower is the true power of i (the cycle of 4)', () => {
    for (let s = 1; s <= 400; s++) {
      const it = GEN.iPower!(rng(s), s);
      const e = Number(/i\^\{(\d+)\}/.exec(it.board)![1]);
      expect(it.choices![(it.answer as { i: number }).i]!).toBe(X.html(X.powI(e)));
    }
  });
  it('sumSquaresPick: exactly one offered product has the asked value', () => {
    for (let s = 1; s <= 300; s++) {
      const it = GEN.sumSquaresPick!(rng(s), s);
      const N = Number(/= (\d+)/.exec(it.board)![1]);
      const vals = it.choices!.map(c => { const m = /^\((.+)\)\((.+)\)$/.exec(c.replace(/<[^>]+>/g, '').replace(/−/g, '-'))!; const z = parseZ(m[1]!)!, w = parseZ(m[2]!)!; return X.mul(X.C(z[0], z[1]), X.C(w[0], w[1])); });
      expect(vals.filter(v => X.eq(v, X.C(N, 0))).length, it.choices!.join(' | ')).toBe(1);
    }
  });
  it('every pair answer can be typed (whole numbers or short decimals)', () => {
    for (const p of PLAN) for (const f of p.families) for (let s = 1; s <= 200; s++) {
      const it = GEN[f]!(rng(s * 13 + 1), s, p.id);
      if (it.answer.kind === 'pair') for (const v of [it.answer.x, it.answer.y]) expect(Math.abs(v * 1e4 - Math.round(v * 1e4)), `${f} ${it.prompt}`).toBeLessThan(1e-6);
    }
  });
});

describe('complex-numbers: misconceptions are classified', () => {
  it('binProduct: i² as +1 and firsts-and-lasts', () => {
    let hits = 0;
    for (let s = 1; s < 300; s++) {
      const it = GEN.binProduct!(rng(s), s, 'multiply-complex');
      const t = /\(([^)]*)\)\(([^)]*)\)/.exec(it.board)!;
      const z = parseZ(t[1]!), w = parseZ(t[2]!);
      if (!z || !w) continue;
      const [a, b] = z, [c, d] = w;
      expect(it.check({ kind: 'pair', x: a * c + b * d, y: a * d + b * c }).mc).toBe(M.i2Plus);
      if (a * d + b * c !== 0) expect(it.check({ kind: 'pair', x: a * c - b * d, y: 0 }).mc).toBe(M.firstsLasts);
      hits++;
    }
    expect(hits).toBeGreaterThan(100);
  });
  it('conjugates, the product rule, the 2-cycle, the minus on the first part only, dividing one part', () => {
    const find = (f: string, sg: string, ok: (it: Item) => boolean) => { for (let s = 1; s < 800; s++) { const it = GEN[f]!(rng(s), s, sg); if (ok(it)) return it; } throw new Error(f); };
    const c = find('conjPair', 'conjugate', it => /conjugate of [^t]/.test(it.prompt) && (it.answer as Pair).x !== 0 && (it.answer as Pair).y !== 0);
    const A = c.answer as Pair;
    expect(c.check({ kind: 'pair', x: -A.x, y: -A.y }).mc).toBe(M.conjBoth);
    expect(c.check({ kind: 'pair', x: -A.x, y: A.y }).mc).toBe(M.conjReal);
    const r = find('radProduct', 'radical-product-trap', it => (it.prompt.match(/−\d/g) ?? []).length === 2);
    expect(r.check({ kind: 'pair', x: -(r.answer as Pair).x, y: 0 }).mc).toBe(M.productRule);
    const p = find('iPower', 'powers-of-i', it => Number(/\{(\d+)\}/.exec(it.board)![1]) % 4 === 2);
    expect(p.check({ kind: 'choice', i: 0 }).mc).toBe(M.cycle2);
    const sb = find('subPair', 'subtract-complex', it => /^\(-?\d+ [+-] \d*i\) - \(-?\d+ [+-] \d*i\)/.test(it.board));
    const t = /^\((.+?)\) - \((.+?)\)/.exec(sb.board)!, z = parseZ(t[1]!)!, w = parseZ(t[2]!)!;
    expect(sb.check({ kind: 'pair', x: z[0] - w[0], y: z[1] + w[1] }).mc).toBe(M.firstOnly);
    const dv = find('divReal', 'divide-by-real', it => /^\\dfrac\{-?\d+ [+-] \d*i\}\{2\}/.test(it.board));
    const u = parseZ(/\{(.+?)\}/.exec(dv.board)![1]!)!;
    expect(dv.check({ kind: 'pair', x: u[0] / 2, y: u[1] }).mc).toBe(M.divFirst);
  });
});

describe('complex-numbers: voice, steps, check-in', () => {
  it('lines.json speaks every script line, with no digits or symbols', () => {
    const lines = JSON.parse(fs.readFileSync('pages/lessons/complex-numbers/voice/lines.json', 'utf8')) as Record<string, { text: string }>;
    expect(Object.keys(lines).sort()).toEqual(Object.keys(SCRIPT).sort());
    for (const [k, v] of Object.entries(SCRIPT)) { expect(lines[k]!.text, k).toBe(v.say); expect(/[0-9=+√²−]/.test(v.say), k).toBe(false); }
  });
  it('the steps card arrives at the answer for every family', () => {
    for (const p of PLAN) for (const f of p.families) for (let s = 1; s <= 60; s++) {
      const it = GEN[f]!(rng(s * 7 + 3), s, p.id);
      const ex = explain(it);
      expect(ex, f).not.toBeNull();
      expect(it.check(ex!.result).ok, `${f}: ${it.prompt} -> ${JSON.stringify(ex!.result)}`).toBe(true);
    }
  });
  it('the check-in picks are plan families', () => {
    for (const pk of PLACEMENT.picks) expect(PLAN.find(p => p.id === pk.subgoal)?.families).toContain(pk.family);
  });
});
