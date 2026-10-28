// lesson-conditional-statements: the generic checks (every family x every sub-goal it serves x 300 seeds). Add topic checks below.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { rng } from '../src/lesson/runtime/item';
import { GENERATORS } from '../src/lesson/topics/conditional-statements/items';
import { PLAN } from '../src/lesson/topics/conditional-statements/plan';

const TOPIC = { subgoals: [...new Map(["v2.extension.logical-reasoning"].flatMap(i => JSON.parse(fs.readFileSync(`../math-curriculum-essentials/topics/${i}.json`, 'utf8')).subgoals).map((s: { id: string }) => [s.id, s] as const)).values()] };
const CATALOG = new Set<string>(JSON.parse(fs.readFileSync('../math-curriculum-essentials/misconceptions.json', 'utf8')).misconceptions.map((m: { id: string }) => m.id));
const GEN = GENERATORS as Record<string, (R: () => number, n: number, sg?: string) => import('../src/lesson/runtime/item').Item>;

describe('conditional-statements: plan', () => {
  it('walks through every sub-goal of the topic JSON, in order, each with a family', () => {
    expect(PLAN.map(p => p.id)).toEqual(TOPIC.subgoals.map((s: { id: string }) => s.id));
    for (const p of PLAN) { expect(p.families.length, p.id).toBeGreaterThan(0); for (const f of p.families) expect(GEN[f], f).toBeDefined(); }
  });
});

describe('conditional-statements: families', () => {
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
import { eulerLayout, PRACTICE_FRAME } from '../src/lesson/topics/conditional-statements/eulerLayout';
import { CASES, FORMS, valueOf, cmp, mult, even, sortDomain, range, layoutOf, SHAPES, shapePreds } from '../src/lesson/topics/conditional-statements/logic';
import type { CSItem } from '../src/lesson/topics/conditional-statements/items';
import { explain } from '../src/lesson/topics/conditional-statements/explain';

describe('conditional-statements: logic', () => {
  it('a conditional is false only in the case T, F; the contrapositive agrees everywhere, converse and inverse do not', () => {
    expect(CASES.map(c => valueOf('original', c))).toEqual([true, false, true, true]);
    expect(CASES.map(c => valueOf('contrapositive', c))).toEqual(CASES.map(c => valueOf('original', c)));
    expect(CASES.map(c => valueOf('converse', c))).toEqual(CASES.map(c => valueOf('inverse', c)));
    expect(CASES.map(c => valueOf('converse', c))).not.toEqual(CASES.map(c => valueOf('original', c)));
    expect(FORMS.length).toBe(4);
  });
  it('negations keep the boundary: n > 5 becomes n ≤ 5', () => {
    const P = cmp('>', 5);
    for (const x of range(0, 10)) expect(cmp('≤', 5).test(x)).toBe(!P.test(x));
    expect(P.neg).toContain('≤');
  });
  it('the Euler layout follows the zones: multiple of 4 sits inside even', () => {
    const s = sortDomain(range(1, 12), mult(4), even);
    expect(s.p).toEqual([]); expect(s.pq).toEqual([4, 8, 12]); expect(layoutOf(s)).toBe('nested');
    expect(layoutOf(sortDomain(range(1, 12), even, mult(4)))).toBe('overlap');
  });
  it('shapes are decided by their marks', () => {
    expect(shapePreds.fourRight.test(SHAPES.rect())).toBe(true);
    expect(shapePreds.fourEqual.test(SHAPES.rect())).toBe(false);
    expect(shapePreds.fourEqual.test(SHAPES.rhombus())).toBe(true);
    expect(shapePreds.fourRight.test(SHAPES.rhombus())).toBe(false);
    expect(shapePreds.fourEqual.test(SHAPES.square(20))).toBe(true);
  });
});

describe('conditional-statements: pictures and worked steps', () => {
  for (const p of PLAN) for (const f of p.families) {
    it(`${p.id} / ${f}: picture fits, steps end on the answer`, () => {
      for (let s = 1; s <= 120; s++) {
        const item = GEN[f]!(rng(s * 13 + 5), s, p.id) as CSItem;
        const eu = item.picture?.euler;
        if (eu) expect(() => eulerLayout(eu, PRACTICE_FRAME), item.prompt).not.toThrow();
        expect(item.picture, f).toBeDefined();
        const ex = explain(item);
        expect(ex, `${f}: ${item.solution.join(' | ')}`).not.toBeNull();
        expect(item.check(ex!.result).ok, `${f}: steps end on ${JSON.stringify(ex!.result)}`).toBe(true);
        for (const t of [item.prompt, ...(item.choices ?? []), ...item.solution]) expect(t, f).not.toMatch(/undefined|NaN|\+ −|\s\s/);
      }
    });
  }
});

describe('conditional-statements: misconceptions are classified', () => {
  const probe = (f: string, sg: string, find: (t: string) => boolean, mc: string) => {
    let hits = 0;
    for (let s = 1; s <= 200; s++) {
      const it = GEN[f]!(rng(s), s, sg);
      const i = (it.choices ?? []).findIndex(find);
      if (i < 0) continue;
      const v = it.check({ kind: 'choice', i });
      if (!v.ok) { expect(v.mc, `${f}: ${it.choices![i]}`).toBe(mc); hits++; }
    }
    expect(hits, f).toBeGreaterThan(5);
  };
  it('no "all" means none', () => probe('negAll', 'negate-universal', t => /^For no|^No /.test(t), 'mc.geometric-proof.not-all-means-none'));
  it('some-not as the negation of some', () => probe('negSome', 'negate-existential', t => /For some <i>n<\/i> in the domain, .*not|do not|did not|without|is not/.test(t) && !/^No|^For no|^For every/.test(t), 'mc.geometric-proof.existential-negation-keeps-some'));
  it('the contrapositive taken for the converse, the inverse for the negation', () => {
    for (let s = 1; s <= 200; s++) {
      const it = GEN.whichConverse!(rng(s), s, 'form-converse');
      const mcs = it.choices!.map((_, i) => it.check({ kind: 'choice', i }).mc);
      expect(mcs).toContain('mc.geometric-proof.contrapositive-as-converse');
      expect(mcs).toContain('mc.geometric-proof.converse-as-logical-negation');
    }
  });
  it('the inverse taken for the contrapositive', () => {
    let hits = 0;
    for (let s = 1; s <= 200; s++) {
      const it = GEN.nameForm!(rng(s), s, 'form-contrapositive');
      const right = it.answer.kind === 'choice' ? it.choices![it.answer.i] : '';
      if (right !== 'The contrapositive') continue;
      const v = it.check({ kind: 'choice', i: it.choices!.indexOf('The inverse') });
      expect(v.mc).toBe('mc.geometric-proof.conditional-forms-mixed-up'); hits++;
    }
    expect(hits).toBeGreaterThan(20);
  });
  it('a false hypothesis does not break it', () => {
    let hits = 0;
    for (let s = 1; s <= 200; s++) {
      const it = GEN.caseValue!(rng(s), s, 'conditional-truth');
      const right = it.choices![(it.answer as { i: number }).i];
      const fi = it.choices!.indexOf('False');
      if (right === 'True' && fi >= 0) { const v = it.check({ kind: 'choice', i: fi }); if (v.mc) { expect(v.mc).toBe('mc.geometric-proof.false-hypothesis-breaks-conditional'); hits++; } }
    }
    expect(hits).toBeGreaterThan(10);
  });
});

import { SCRIPT } from '../src/lesson/topics/conditional-statements/script';
import { LESSON_FRAME, Q_PIC, E_PIC, T_PIC, P_PIC } from '../src/lesson/topics/conditional-statements/lessonPics';
describe('conditional-statements: lesson parts', () => {
  it('the pictures of parts 1-4 fit the lesson frame', () => {
    for (const p of [Q_PIC, E_PIC, T_PIC, P_PIC]) expect(() => eulerLayout(p, LESSON_FRAME)).not.toThrow();
  });
  it('every script line is voiced, spoken text has no digits or symbols', () => {
    if (process.env.WRITE_LINES) fs.writeFileSync('pages/lessons/conditional-statements/voice/lines.json', JSON.stringify(Object.fromEntries(Object.entries(SCRIPT).map(([k, v]) => [k, { text: v.say }])), null, 1) + '\n');
    const lines = JSON.parse(fs.readFileSync('pages/lessons/conditional-statements/voice/lines.json', 'utf8'));
    for (const [k, v] of Object.entries(SCRIPT)) {
      expect(lines[k]?.text, k).toBe(v.say);
      expect(v.say, k).not.toMatch(/[0-9<>=≤≥%°~→]/);
    }
  });
});
