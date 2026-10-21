// lesson-multi-step-equations: the generic checks (every family x every sub-goal it serves x 300 seeds). Add topic checks below.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { rng } from '../src/lesson/runtime/item';
import { GENERATORS } from '../src/lesson/topics/multi-step-equations/items';
import { PLAN } from '../src/lesson/topics/multi-step-equations/plan';

const TOPIC = JSON.parse(fs.readFileSync('../math-curriculum-essentials/topics/secondary-t5-44-multi-step-equations-with-rational-coefficients.json', 'utf8'));
const CATALOG = new Set<string>(JSON.parse(fs.readFileSync('../math-curriculum-essentials/misconceptions.json', 'utf8')).misconceptions.map((m: { id: string }) => m.id));
const GEN = GENERATORS as Record<string, (R: () => number, n: number, sg?: string) => import('../src/lesson/runtime/item').Item>;

describe('multi-step-equations: plan', () => {
  it('walks through every sub-goal of the topic JSON, in order, each with a family', () => {
    expect(PLAN.map(p => p.id)).toEqual(TOPIC.subgoals.map((s: { id: string }) => s.id));
    for (const p of PLAN) { expect(p.families.length, p.id).toBeGreaterThan(0); for (const f of p.families) expect(GEN[f], f).toBeDefined(); }
  });
});

describe('multi-step-equations: families', () => {
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
import { MC, readQ } from '../src/lesson/topics/multi-step-equations/items';
import { clearLayout, picFits, pictureOf } from '../src/lesson/topics/multi-step-equations/clearLayout';
import { N, X, clears, eq, eqT, kindOf, leastClear, pow10Clear, scaleEq, scaleSome, solOf } from '../src/lesson/topics/multi-step-equations/msMaths';
import { SIDES_FRAME } from '../src/lesson/topics/linear-equations/sidesMaths';
import { qEq, rat } from '../src/core/math';
import type { Item, Response } from '../src/lesson/runtime/item';

describe('multi-step-equations: misconception ids', () => {
  it('every id the classifiers use is in the catalogue', () => { for (const id of Object.values(MC)) expect(CATALOG.has(id), id).toBe(true); });
  it('covers the ids the topic JSON names (defines-variable-incompletely is an observation, not a choice)', () => {
    const used = new Set(Object.values(MC) as string[]);
    const named = new Set<string>(TOPIC.subgoals.flatMap((s: { misconceptions: string[] }) => s.misconceptions));
    expect([...named].filter(id => !used.has(id))).toEqual([]);
  });
});

describe('multi-step-equations: the maths', () => {
  const EX = eq([X(rat(1, 2)), N(rat(2, 3))], [X(rat(1, 3)), N(1)]);
  it('clears with the least common multiple, powers of 10, valid and too-small multipliers', () => {
    expect(leastClear(EX)).toBe(6);
    expect(clears(EX, 12)).toBe(true); expect(clears(EX, 3)).toBe(false);
    const D = eq([X(rat(1, 2)), N(rat(5, 4))], [N(3)], 'dec');
    expect(leastClear(D)).toBe(4); expect(pow10Clear(D)).toBe(100);
    expect(eqT(scaleEq(EX, 6), { big: false })).toBe('3x + 4 = 2x + 6');
    expect(eqT(scaleSome(EX, 6), { big: false })).toBe('3x + 4 = 2x + 1');
    expect(qEq(solOf(EX), rat(2))).toBe(true);
    expect(kindOf(eq([X(rat(1, 2)), N(1)], [X(rat(1, 2)), N(1)]))).toBe('all');
  });
  it('reads typed answers exactly (fractions, negatives, decimals)', () => {
    expect(readQ({ kind: 'frac', w: 0, n: -7, d: 3 })).toEqual(rat(-7, 3));
    expect(readQ({ kind: 'frac', w: 4, n: 1, d: 4 })).toEqual(rat(17, 4));
    expect(readQ({ kind: 'num', v: -2.5 })).toEqual(rat(-5, 2));
  });
});

describe('multi-step-equations: the clearing balance', () => {
  const cases = [
    eq([X(rat(1, 2)), N(rat(2, 3))], [X(rat(1, 3)), N(1)]),     // the question and the worked example
    eq([X(rat(3, 4)), N(rat(1, 2))], [X(rat(1, 4)), N(3)]),     // your turn
    eq([X(rat(2, 3)), N(4)], [N(6)]),                           // prove it
  ];
  it('draws the lesson equations inside the frame, every whole item made of all its pieces', () => {
    for (const e of cases) {
      const p = pictureOf(e);
      expect(p, eqT(e)).not.toBeNull();
      const L = clearLayout(p!);
      expect(L.top).toBeGreaterThanOrEqual(SIDES_FRAME.y);
      for (const it of L.items) for (const P of [it.A, it.K]) { expect(P.x).toBeGreaterThan(SIDES_FRAME.x); expect(P.x).toBeLessThan(SIDES_FRAME.x + SIDES_FRAME.w); }
      const per = new Map<string, number[]>();
      for (const s of L.slices) { const k = `${s.side}${s.kind}${s.unit}`; per.set(k, [...(per.get(k) ?? []), s.slot]); }
      for (const [k, slots] of per) {
        const den = L.slices.find(s => `${s.side}${s.kind}${s.unit}` === k)!.den;
        expect([...slots].sort((a, b) => a - b), k).toEqual(Array.from({ length: den }, (_, i) => i));
      }
    }
  });
  it('refuses what it cannot draw', () => {
    expect(pictureOf(eq([X(rat(-1, 2)), N(1)], [N(3)]))).toBeNull();
    expect(picFits({ L: { x: rat(1, 7), n: rat(0) }, R: { x: rat(0), n: rat(3) }, k: 7 })).toBe(false);
  });
  it('practice: the balance families draw many of their items', () => {
    for (const f of ['clearLine', 'clearSolve', 'scaleKeep', 'lcdPick', 'bothSolve', 'barClear', 'distSolve', 'checkSide']) {
      let pics = 0;
      for (let s = 1; s <= 200; s++) { const it = GEN[f]!(rng(s * 13 + 1), s) as Item & { picture?: { clear?: unknown } }; if (it.picture?.clear) pics++; }
      expect(pics, f).toBeGreaterThan(30);
    }
  });
});

describe('multi-step-equations: misconceptions are classified', () => {
  const choiceMcs = (f: string, sg: string) => {
    const seen = new Set<string>();
    for (let s = 1; s <= 200; s++) { const it = GEN[f]!(rng(s * 5 + 1), s, sg); (it.choices ?? []).forEach((_, i) => { const m = it.check({ kind: 'choice', i }).mc; if (m) seen.add(m); }); }
    return seen;
  };
  it('choice families carry their slips', () => {
    expect(choiceMcs('clearLine', 'clear-every-term-two-step').has(MC.someTerms)).toBe(true);
    expect(choiceMcs('clearLine', 'clear-every-term-two-step').has(MC.leftOnly)).toBe(true);
    expect(choiceMcs('barClear', 'clear-binomial-numerators').has(MC.grouping)).toBe(true);
    expect(choiceMcs('barClear', 'clear-binomial-numerators').has(MC.crossSum)).toBe(true);
    expect(choiceMcs('howMany', 'contradiction-after-cancel').has(MC.cancelAll)).toBe(true);
    expect(choiceMcs('zeroTrap', 'identity-after-cancel').has(MC.zeroVsNone)).toBe(true);
    expect(choiceMcs('bothLine', 'variables-both-sides-rational').has(MC.noSign)).toBe(true);
    expect(choiceMcs('checkCand', 'check-in-original').has(MC.derived)).toBe(true);
    expect(choiceMcs('firstBad', 'locate-first-invalid-step').has(MC.firstOdd)).toBe(true);
    expect(choiceMcs('writeModel', 'model-comparison-both-sides').has(MC.wordOrder)).toBe(true);
    expect(choiceMcs('barSplit', 'fraction-bar-grouping').has(MC.oneTermNum)).toBe(true);
  });
  it('typed slips are recognised', () => {
    const typedMcs = (f: string, sg: string, tries: Response[]) => {
      const seen = new Set<string>();
      for (let s = 1; s <= 300; s++) { const it = GEN[f]!(rng(s * 11 + 5), s, sg); for (const r of tries) { const m = it.check(r).mc; if (m) seen.add(m); } }
      return seen;
    };
    const nums = (lo: number, hi: number): Response[] => Array.from({ length: hi - lo + 1 }, (_, i) => ({ kind: 'num', v: lo + i }));
    expect(typedMcs('lcdPick', 'choose-clearing-multiplier', nums(2, 100)).has(MC.unreduced)).toBe(true);
    expect(typedMcs('lcdPick', 'choose-clearing-multiplier', nums(2, 100)).has(MC.pow10)).toBe(true);
    expect(typedMcs('clearSolve', 'clear-every-term-two-step', nums(-40, 40)).has(MC.someTerms)).toBe(true);
    expect(typedMcs('distSolve', 'distribute-rational-factor', nums(-40, 40)).has(MC.partial)).toBe(true);
    expect(typedMcs('evalTerm', 'coefficient-as-multiplier', nums(-60, 60)).has(MC.minusNeg)).toBe(true);
  });
});
