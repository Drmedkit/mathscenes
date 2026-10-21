// fraction of a quantity: every family x every sub-goal it serves x 300 seeds gives a valid item (the answer passes,
// choices unique with exactly one right), the main misconceptions are classified, the plan covers every sub-goal
// of the topic JSON in order, and the model's maths (b shares rebuild the whole, a shares are the answer) holds.
import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { rng, type Item, type Response } from '../src/lesson/runtime/item';
import { GENS, FAMILY_NAMES } from '../src/lesson/topics/fraction-of-quantity/items';
import { PLAN } from '../src/lesson/topics/fraction-of-quantity/plan';
import { computeFractionOf, setFits, setGeom, tapeFits } from '../src/lesson/topics/fraction-of-quantity/fractionOfMaths';
import { qEq, rat } from '../src/core/math';

const TOPIC = 'C:/Users/stelt/Claude code foler/math-curriculum-essentials/topics/primary.fractions.fraction-of-quantity.json';
const MC = 'C:/Users/stelt/Claude code foler/math-curriculum-essentials/misconceptions.json';
const mcIds = existsSync(MC) ? new Set((JSON.parse(readFileSync(MC, 'utf8')) as { misconceptions: { id: string }[] }).misconceptions.map(m => m.id)) : null;

const pairs = PLAN.flatMap(p => p.families.map(f => [f, p.id] as const));
const make = (f: string, sg: string, s: number): Item => GENS[f]!(rng(s * 7919 + f.length), s, sg);
const num = (v: number): Response => ({ kind: 'num', v });
const frac = (n: number, d: number, w = 0): Response => ({ kind: 'frac', w, n, d });
const nums = (it: Item) => [...it.board.matchAll(/\\tfrac\{(\d+)\}\{(\d+)\}[^0-9?]*(\d+)?/g)][0];

describe('plan', () => {
  it('covers every sub-goal of the topic JSON, in order, each with a family that exists', () => {
    if (existsSync(TOPIC)) {
      const t = JSON.parse(readFileSync(TOPIC, 'utf8')) as { subgoals: { id: string; order: number }[] };
      expect(PLAN.map(p => p.id)).toEqual([...t.subgoals].sort((a, b) => a.order - b.order).map(s => s.id));
    }
    for (const p of PLAN) {
      expect(p.families.length).toBeGreaterThan(0);
      for (const f of p.families) { expect(GENS[f], f).toBeTypeOf('function'); expect(FAMILY_NAMES[f], f).toBeTruthy(); }
    }
    expect(new Set(PLAN.flatMap(p => p.families))).toEqual(new Set(Object.keys(GENS)));
  });
});

describe('item families', () => {
  for (const [f, sg] of pairs) {
    it(`${f} for ${sg}: 300 seeds, the answer passes, choices unique with one right, mc ids exist`, () => {
      const seen = new Set<string>();
      for (let s = 1; s <= 300; s++) {
        const it = make(f, sg, s);
        expect(it.family).toBe(f);
        expect(it.check(it.answer).ok, `${it.prompt} ${JSON.stringify(it.answer)}`).toBe(true);
        expect(it.solution.length).toBeGreaterThan(0);
        expect(it.prompt).not.toMatch(/undefined|NaN/);
        expect(it.board).not.toMatch(/undefined|NaN/);
        if (it.choices) {
          expect(new Set(it.choices).size, it.choices.join(' | ')).toBe(it.choices.length);
          const verdicts = it.choices.map((_, i) => it.check({ kind: 'choice', i }));
          expect(verdicts.filter(v => v.ok).length).toBe(1);
          if (mcIds) for (const v of verdicts) if (v.mc) expect(mcIds.has(v.mc), v.mc).toBe(true);
        }
        if (it.picture) {
          const p = it.picture as { q: number; a: number; b: number; set?: boolean };
          computeFractionOf(p.q, p.a, p.b);
          if (p.set) expect(setFits(p.q, p.a, p.b)).toBe(true); else expect(tapeFits(p.q, p.a, p.b)).toBe(true);
        }
        seen.add(it.prompt + it.board + (it.choices ?? []).join());
      }
      expect(seen.size).toBeGreaterThan(30);
    });
  }
});

describe('misconceptions are diagnosed', () => {
  it('bare divide-then-multiply: one share, the swapped roles, dividing by the top', () => {
    for (let s = 1; s <= 300; s++) {
      const it = make('bareDTM', 'divide-then-multiply', s);
      const m = /\\tfrac\{(\d+)\}\{(\d+)\} \\text\{ of \} (\d+)/.exec(it.board)!;
      const a = +m[1]!, b = +m[2]!, q = +m[3]!, sh = q / b;
      if (sh !== a * sh) expect(it.check(num(sh)).mc).toBe('mc.ratio-rate.stops-at-unit-rate');
      if (q % a === 0 && (q / a) * b !== sh) expect(it.check(num((q / a) * b)).mc).toBe('mc.fraction-ops.numerator-denominator-roles-swapped');
    }
  });
  it('unit fraction of a set: groups of b, and a part taken as the whole', () => {
    let other = 0;
    for (let s = 1; s <= 300; s++) {
      const it = make('setShare', 'unit-fraction-of-set', s);
      const p = it.picture as { q: number; b: number; other: number };
      if (p.b !== p.q / p.b) expect(it.check(num(p.b)).mc).toBe('mc.fractions-concept.fraction-of-set-misgrouped');
      if (p.other) {
        other++;
        const v = p.other / p.b;
        if (v !== p.b) expect(it.check(num(v)).mc).toBe('mc.fractions-concept.part-taken-as-whole');
      }
    }
    expect(other).toBeGreaterThan(40);
  });
  it('tape: the total on one section, and the denominator as the answer', () => {
    for (let s = 1; s <= 300; s++) {
      const it = make('tapeUnit', 'unit-fraction-tape-diagram', s);
      const p = it.picture as { q: number; b: number };
      expect(it.check(num(p.q)).mc).toBe('mc.fraction-ops.total-written-on-one-section');
      expect(it.check(num(p.b)).mc).toBe('mc.fraction-ops.fraction-of-quantity-report-denominator');
    }
  });
  it('more than the whole: the "fractions shrink" answer', () => {
    let hit = 0;
    for (let s = 1; s <= 300; s++) {
      const it = make('overOne', 'fraction-at-least-one', s);
      const p = it.picture as { q: number; a: number; b: number };
      if (p.a > p.b && 2 * p.b - p.a > 0) {
        const v = (2 * p.b - p.a) * (p.q / p.b);
        const r = it.check(num(v));
        expect(r.ok).toBe(false);
        if (v !== p.q / p.b) { expect(r.mc).toBe('mc.fraction-ops.fraction-factor-always-shrinks'); hit++; }
      }
    }
    expect(hit).toBeGreaterThan(50);
  });
  it('fractional shares: the dropped leftover, the flip, multiplying both terms; equivalent forms pass', () => {
    for (let s = 1; s <= 300; s++) {
      const it = make('fracShare', 'fractional-unit-share', s);
      const p = it.picture as { q: number; b: number };
      expect(it.check(frac(p.b, p.q)).mc).toBe('mc.fractions-concept.fraction-division-order-reversed');
      if (p.q > p.b) {
        expect(it.check(frac(0, 1, Math.floor(p.q / p.b))).mc).toBe('mc.fractions-concept.leftover-not-shared-as-fraction');
        expect(it.check(frac(p.q % p.b, p.b, Math.floor(p.q / p.b))).ok).toBe(true);
      }
      expect(it.check(frac(2 * p.q, 2 * p.b)).ok).toBe(true);
      const u = make('fracNonUnit', 'fractional-non-unit-share', s);
      const pu = u.picture as { q: number; a: number; b: number };
      expect(u.check(frac(pu.a * pu.q, pu.b * pu.q)).mc).toBe('mc.fraction-ops.multiplies-both-terms-by-whole-number');
      expect(u.check(frac(pu.a, pu.b * pu.q)).mc).toBe('mc.fraction-ops.multiplies-denominator-by-whole-number');
    }
  });
  it('recover and rebuild: the part divided by the denominator, the whole rebuilt with the numerator', () => {
    for (let s = 1; s <= 300; s++) {
      const it = make('recover', 'recover-unit-share', s);
      const m = /\\tfrac\{(\d+)\}\{(\d+)\} \\text\{ of \} \? = (\d+)/.exec(it.board)!;
      const b = +m[2]!, P = +m[3]!;
      if (P % b === 0) expect(it.check(num(P / b)).mc).toBe('mc.ratio-rate.known-part-divided-by-denominator-for-unit-share');
      const w = make('unknownWhole', 'unknown-whole-extension', s);
      const mw = /\\tfrac\{(\d+)\}\{(\d+)\} \\times \\ \? = (\d+)/.exec(w.board)!;
      if (+mw[1]! > 1) expect(w.check(num(+mw[3]!)).mc).toBe('mc.fraction-ops.rebuilds-whole-with-numerator');
    }
  });
  it('which whole: the fraction of the other quantity', () => {
    for (let s = 1; s <= 300; s++) {
      const it = make('whichWhole', 'select-whole-in-context', s);
      const m = /(\d+) (?:of them|goats|miles of a different)/.exec(it.prompt)!;
      const f = /\\tfrac\{(\d+)\}\{(\d+)\}/.exec(it.board)!;
      const d = +m[1]!, a = +f[1]!, b = +f[2]!;
      expect(it.check(num((a * d) / b)).mc).toBe('mc.fraction-ops.fraction-of-wrong-quantity');
    }
  });
  void nums;
});

describe('the FractionOf model maths', () => {
  it('b shares rebuild the whole and a shares are a/b of q, for every q, a, b in range', () => {
    for (let b = 2; b <= 10; b++) for (let a = 1; a <= 10; a++) for (let q = 1; q <= 100; q++) {
      const m = computeFractionOf(q, a, b);
      expect(qEq(m.share, rat(q, b))).toBe(true);
      expect(qEq(m.result, rat(a * q, b))).toBe(true);
      expect(m.vsWhole).toBe(a < b ? -1 : a === b ? 0 : 1);
      expect(m.exact).toBe(q % b === 0);
    }
  });
  it('rejects what it cannot draw, with a readable message', () => {
    expect(() => computeFractionOf(12, 3, 1)).toThrow(/2 to 10 equal shares/);
    expect(() => computeFractionOf(0, 1, 4)).toThrow(/1 to 100/);
    expect(setGeom(13, 4)).toBeNull();
    expect(setGeom(40, 4)).toBeNull();
    for (const b of [2, 3, 4, 6, 8]) for (let s = 1; s <= 6 && b * s <= 24; s++) expect(setGeom(b * s, b), `${b * s} in ${b}`).not.toBeNull();
  });
});
