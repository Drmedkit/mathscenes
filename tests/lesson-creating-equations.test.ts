// lesson-creating-equations: the generic checks (every family x every sub-goal it serves x 300 seeds). Add topic checks below.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { rng } from '../src/lesson/runtime/item';
import { GENERATORS } from '../src/lesson/topics/creating-equations/items';
import { PLAN } from '../src/lesson/topics/creating-equations/plan';

const TOPIC = { subgoals: [...new Map(["secondary-t6-06-creating-equations-and-inequalities"].flatMap(i => JSON.parse(fs.readFileSync(`../math-curriculum-essentials/topics/${i}.json`, 'utf8')).subgoals).map((s: { id: string }) => [s.id, s] as const)).values()] };
const CATALOG = new Set<string>(JSON.parse(fs.readFileSync('../math-curriculum-essentials/misconceptions.json', 'utf8')).misconceptions.map((m: { id: string }) => m.id));
const GEN = GENERATORS as Record<string, (R: () => number, n: number, sg?: string) => import('../src/lesson/runtime/item').Item>;

describe('creating-equations: plan', () => {
  it('walks through every sub-goal of the topic JSON, in order, each with a family', () => {
    expect(PLAN.map(p => p.id)).toEqual(TOPIC.subgoals.map((s: { id: string }) => s.id));
    for (const p of PLAN) { expect(p.families.length, p.id).toBeGreaterThan(0); for (const f of p.families) expect(GEN[f], f).toBeDefined(); }
  });
});

describe('creating-equations: families', () => {
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
import { broken, extremeWhole, lin, num, rel, stepsIn, test, viable, whole } from '../src/lesson/topics/creating-equations/cons';
import { picFits } from '../src/lesson/topics/creating-equations/pictures';
import type { CItem } from '../src/lesson/topics/creating-equations/items';

describe('creating-equations: constraints', () => {
  it('a candidate is viable only when every constraint holds with the same values', () => {
    const cs = [rel(lin({ a: 8, s: 5 }), '<=', num(60)), rel(lin({ a: 1 }), '>=', num(2)), rel(lin({ a: 1, s: 1 }), '<=', num(10)), whole('a', 's')];
    expect(viable(cs, { a: 3, s: 6 })).toBe(true);
    expect(broken(cs, { a: 1, s: 9 })).toEqual([1]);
    expect(broken(cs, { a: 4, s: 5.6 })).toEqual([3]);
    expect(test(cs[0]!, { a: 4, s: 5.6 })).toMatchObject({ ok: true, l: 60, r: 60 });
    expect(test(rel(lin({ t: 1 }), '>=', lin({ b: 2 })), { t: 12, b: 10 }).ok).toBe(false);
  });
  it('the extreme whole number follows the direction of the bound, not the nearest', () => {
    expect(extremeWhole('>=', 120 / 52)).toBe(3);
    expect(extremeWhole('<=', 20 / 3)).toBe(6);
    expect(extremeWhole('<', 6)).toBe(5);
    expect(extremeWhole('<=', 6)).toBe(6);
    expect(extremeWhole('>', 6)).toBe(7);
    expect(extremeWhole('>=', 6)).toBe(6);
    expect(stepsIn(0, 2.6, 0.25).at(-1)).toBe(2.5);
  });
});

describe('creating-equations: pictures', () => {
  it('every practice picture lays out (generators retry until it fits), and most items have one', () => {
    let items = 0, pics = 0, bad = 0;
    for (const p of PLAN) for (const f of p.families) for (let s = 1; s <= 60; s++) {
      const it = GEN[f]!(rng(s * 13 + 1), s, p.id) as CItem;
      items++;
      if (it.picture) { pics++; if (!picFits(it.picture)) bad++; }
    }
    expect(bad).toBe(0);
    expect(pics / items).toBeGreaterThan(0.45);
  });
  it('families with a picture keep it (no family silently drops to a slate)', () => {
    for (const f of ['eqTest', 'eqMeaning', 'allowedSet', 'boundaryCand', 'pairTest', 'pairValue', 'bothValue', 'pairBoth', 'discreteOrNot', 'fracValue', 'systemPick', 'viablePair', 'whichViable', 'busRound', 'intEnd', 'solveRound', 'pickRep', 'notation', 'pairRange', 'noOption', 'betweenInt', 'blocks']) {
      let kept = 0;
      for (let s = 1; s <= 40; s++) if ((GEN[f]!(rng(s * 7 + 3), s) as CItem).picture) kept++;
      expect(kept, f).toBe(40);
    }
  });
});

import { SCRIPT } from '../src/lesson/topics/creating-equations/script';
import { CheckTable } from '../src/lesson/topics/creating-equations/CheckTable';
import { TABLE_FRAME } from '../src/lesson/topics/creating-equations/pictures';
import { dusk } from '../src/lesson/dusk';
import { stepsOf } from '../src/lesson/runtime/practice';
import { explain } from '../src/lesson/topics/creating-equations/explain';

describe('creating-equations: CheckTable', () => {
  it('computes every cell itself: only plan (3, 6) passes every rule of the climbing trip', () => {
    const B = CheckTable({ head: String.raw`(a,\,s)`, headWords: 'the rule', cands: [{ key: 'p0', label: String.raw`(1,\,9)`, v: { a: 1, s: 9 } }, { key: 'p1', label: String.raw`(3,\,6)`, v: { a: 3, s: 6 } }, { key: 'p2', label: String.raw`(4,\,5.6)`, v: { a: 4, s: 5.6 } }],
      rows: [{ key: 'm', words: 'spend at most $60: $8 an adult, $5 a student', tex: String.raw`8a + 5s \le 60`, con: rel(lin({ a: 8, s: 5 }), '<=', num(60)) }, { key: 'ad', words: 'at least 2 adults', tex: String.raw`a \ge 2`, con: rel(lin({ a: 1 }), '>=', num(2)) },
        { key: 'van', words: 'the van seats at most 10', tex: String.raw`a + s \le 10`, con: rel(lin({ a: 1, s: 1 }), '<=', num(10)) }, { key: 'w', words: 'whole passes, none negative', tex: String.raw`a,\,s\ \text{whole}`, con: whole('a', 's') }], all: true }, TABLE_FRAME, dusk);
    expect(B.all).toEqual({ p0: false, p1: true, p2: false });
    expect(B.ok.m).toEqual({ p0: true, p1: true, p2: true });
    expect(B.ok.van!.p0).toBe(true);
    expect(B.box.x0).toBeGreaterThanOrEqual(TABLE_FRAME.x);
    expect(B.box.x1).toBeLessThanOrEqual(TABLE_FRAME.x + TABLE_FRAME.w);
  });
});

describe('creating-equations: misconception probes', () => {
  const first = (f: string, pred: (it: CItem) => boolean) => { for (let s = 1; s < 600; s++) { const it = GEN[f]!(rng(s), s) as CItem; if (pred(it)) return it; } throw new Error('no item ' + f); };
  const mcs = (it: CItem) => (it.choices ?? []).map((_, i) => it.check({ kind: 'choice', i }).mc);
  it('one condition passed is not enough; values may not change between rules', () => {
    expect(mcs(first('pairBoth', it => mcs(it).includes('mc.systems.variable-different-values') && !it.check(it.answer).say.startsWith('Yes: the same')))).toContain('mc.systems.one-condition-enough');
    expect(mcs(first('bothValue', () => true))).toContain('mc.systems.one-condition-enough');
  });
  it('a reversed comparison and a reversed bound phrase are told apart', () => {
    const it = first('atLeastTwice', () => true);
    expect(mcs(it)).toEqual(expect.arrayContaining(['mc.expressions.reverses-multiplicative-comparison', 'mc.linear-equations.bound-phrase-direction-reversed', 'mc.linear-equations.equation-for-a-bound']));
  });
  it('a budget rounds down and a minimum rounds up; the nearest whole number is the slip', () => {
    for (let s = 1; s < 60; s++) {
      const it = GEN.busRound!(rng(s), s) as CItem, a = (it.answer as { v: number }).v;
      const wrong = /LEAST/.test(it.prompt) ? a - 1 : a + 1;
      expect(it.check({ kind: 'num', v: wrong }).mc).toBe('mc.estimation.rounds-nearest-when-context-needs-direction');
    }
  });
  it('the strict / inclusive boundary is named both ways', () => {
    const ids = new Set<string>();
    for (let s = 1; s < 80; s++) { const it = GEN.intEnd!(rng(s), s) as CItem, a = (it.answer as { v: number }).v; for (const d of [-1, 1]) { const m = it.check({ kind: 'num', v: a + d }).mc; if (m) ids.add(m); } }
    expect([...ids].sort()).toEqual(['mc.linear-equations.inclusive-excludes-boundary', 'mc.linear-equations.strict-includes-boundary']);
  });
  it('the worked steps end on the right answer for every family', () => {
    for (const p of PLAN) for (const f of p.families) for (let s = 1; s <= 40; s++) {
      const it = GEN[f]!(rng(s * 5 + 2), s, p.id);
      const ex = explain(it);
      expect(ex, `${f} gives steps`).not.toBeNull();
      expect(it.check(ex!.result).ok, `${f}: ${stepsOf(it, explain).join(' | ')}`).toBe(true);
    }
  });
});

describe('creating-equations: voice', () => {
  it('lines.json speaks every panel line of parts 1-4, without digits or symbols', () => {
    const lines = JSON.parse(fs.readFileSync('pages/lessons/creating-equations/voice/lines.json', 'utf8')) as Record<string, { text: string }>;
    expect(Object.keys(lines).sort()).toEqual(Object.keys(SCRIPT).sort());
    for (const [k, v] of Object.entries(SCRIPT)) {
      expect(lines[k]!.text, k).toBe(v.say);
      expect(v.say, k).not.toMatch(/[0-9$%≤≥<>=×÷]/);
    }
    const page = fs.readFileSync('pages/lessons/creating-equations.ts', 'utf8');
    for (const id of page.matchAll(/voiced(?:Fb)?\('([^']+)'/g)) expect(SCRIPT[id[1]!], id[1]).toBeDefined();
  });
});
