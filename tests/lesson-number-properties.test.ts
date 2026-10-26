// lesson-number-properties: the generic checks (every family x every sub-goal it serves x 300 seeds). Add topic checks below.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { rng } from '../src/lesson/runtime/item';
import { GENERATORS } from '../src/lesson/topics/number-properties/items';
import { PLAN } from '../src/lesson/topics/number-properties/plan';

const TOPIC = { subgoals: [...new Map(["secondary-t6-01-real-number-properties-and-classification", "secondary.real-number-system-classification-and-closure"].flatMap(i => JSON.parse(fs.readFileSync(`../math-curriculum-essentials/topics/${i}.json`, 'utf8')).subgoals).map((s: { id: string }) => [s.id, s] as const)).values()] };
const CATALOG = new Set<string>(JSON.parse(fs.readFileSync('../math-curriculum-essentials/misconceptions.json', 'utf8')).misconceptions.map((m: { id: string }) => m.id));
const GEN = GENERATORS as Record<string, (R: () => number, n: number, sg?: string) => import('../src/lesson/runtime/item').Item>;

describe('number-properties: plan', () => {
  it('walks through every sub-goal of the topic JSON, in order, each with a family', () => {
    expect(PLAN.map(p => p.id)).toEqual(TOPIC.subgoals.map((s: { id: string }) => s.id));
    for (const p of PLAN) { expect(p.families.length, p.id).toBeGreaterThan(0); for (const f of p.families) expect(GEN[f], f).toBeDefined(); }
  });
});

describe('number-properties: families', () => {
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

// ---------- topic checks: the exact numbers, the set map, and the main misconceptions ----------
import { R as num, add, frac, innermost, mul, neg, sqrt, tex as rTex, SETS_OF } from '../src/lesson/topics/number-properties/numbers';
import { MC } from '../src/lesson/topics/number-properties/items';

describe('number-properties: exact numbers', () => {
  it('classifies by value, not by look', () => {
    expect(innermost(frac(12, 4))).toBe('counting');
    expect(innermost(frac(-8, 4))).toBe('integer');
    expect(innermost(frac(0, 5))).toBe('whole');
    expect(innermost(sqrt(49))).toBe('counting');
    expect(innermost(neg(sqrt(49)))).toBe('integer');
    expect(innermost(sqrt(0))).toBe('whole');
    expect(innermost(sqrt(8))).toBe('irrational');
    expect(rTex(sqrt(50))).toBe(String.raw`5\sqrt{2}`);
    expect(innermost(frac(2, 3))).toBe('rational');
    expect(SETS_OF.counting).toEqual(['counting', 'whole', 'integer', 'rational']);
  });
  it('closure counterexamples come out exactly', () => {
    expect(innermost(add(sqrt(2), neg(sqrt(2))))).toBe('whole');
    expect(innermost(mul(sqrt(3), sqrt(3)))).toBe('counting');
    expect(innermost(mul(num(0), sqrt(2)))).toBe('whole');
    expect(innermost(add(num(3), sqrt(2)))).toBe('irrational');
    expect(innermost(mul(num(3), sqrt(2)))).toBe('irrational');
  });
});

describe('number-properties: misconception probes', () => {
  const probe = (f: string, sg: string, v: number, mc: string) => {
    for (let s = 1; s <= 200; s++) {
      const it = GEN[f]!(rng(s), s, sg);
      const r = it.check({ kind: 'num', v: (v as unknown as (a: typeof it) => number) instanceof Function ? (v as unknown as (a: typeof it) => number)(it) : v });
      if (r.mc === mc) return true;
    }
    return false;
  };
  it('7 × 98 as 700 − 2 is partial distribution', () => {
    let hit = false;
    for (let s = 1; s <= 200 && !hit; s++) {
      const it = GEN.distArea!(rng(s), s, 'distributive');
      const m = it.prompt.match(/(\d+) × (\d+) = \d+\((\d+) (−|\+) (\d+)\)/);
      if (!m) continue;
      const a = +m[1]!, b = +m[3]!, c = +m[5]!, slip = m[4] === '−' ? a * b - c : a * b + c;
      hit = it.check({ kind: 'num', v: slip }).mc === MC.partialDist;
    }
    expect(hit).toBe(true);
  });
  it('a value where the sides agree is non-separating', () => {
    expect(probe('differAt', 'equivalence-meaning', 0, MC.nonSeparating)).toBe(true);
  });
  it('choice items carry the catalogued ids', () => {
    const seen = new Set<string>();
    for (const p of PLAN) for (const f of p.families) for (let s = 1; s <= 60; s++) {
      const it = GEN[f]!(rng(s), s, p.id);
      (it.choices ?? []).forEach((_, i) => { const mc = it.check({ kind: 'choice', i }).mc; if (mc) seen.add(mc); });
    }
    for (const id of [MC.assocComm, MC.zeroIdentity, MC.oppRecip, MC.zeroRecip, MC.examplesProof, MC.exception, MC.nonSeparating, MC.notNested, MC.radicalIrr, MC.premise, MC.resultExists, MC.misplaced, MC.notReal, MC.assumption, MC.fracDisplay]) expect(seen.has(id), id).toBe(true);
  });
});

describe('number-properties: regressions from the oracle sweep', () => {
  it('proved: a finite-set claim shows every member of the set in its table', () => {
    for (let s = 1; s <= 300; s++) {
      const it = GEN.proved!(rng(s), s, 'counterexample-logic') as unknown as { picture: { claim: { scope?: string; rows: { vals: string[] }[] } } };
      const m = it.picture.claim.scope?.match(/in \{(.*)\}/);
      if (!m) continue;
      expect(it.picture.claim.rows.length).toBe(m[1]!.split(',').length);
    }
  });
  it('closedFinite and closedNamed: no garbled or "all 1" wording', () => {
    for (let s = 1; s <= 300; s++) for (const f of ['closedFinite', 'closedNamed']) {
      const it = GEN[f]!(rng(s), s, 'closure');
      for (const c of it.choices ?? []) { expect(c).not.toMatch(/all 1 /); expect(c).not.toMatch(/is irrational is not/); }
    }
  });
});
