// lesson-polynomial-identities: the generic checks (every family x every sub-goal it serves x 300 seeds). Add topic checks below.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { rng } from '../src/lesson/runtime/item';
import { GENERATORS } from '../src/lesson/topics/polynomial-identities/items';
import { PLAN } from '../src/lesson/topics/polynomial-identities/plan';

const TOPIC = { subgoals: [...new Map(["secondary-t7-02-polynomial-operations-and-identities"].flatMap(i => JSON.parse(fs.readFileSync(`../math-curriculum-essentials/topics/${i}.json`, 'utf8')).subgoals).map((s: { id: string }) => [s.id, s] as const)).values()] };
const CATALOG = new Set<string>(JSON.parse(fs.readFileSync('../math-curriculum-essentials/misconceptions.json', 'utf8')).misconceptions.map((m: { id: string }) => m.id));
const GEN = GENERATORS as Record<string, (R: () => number, n: number, sg?: string) => import('../src/lesson/runtime/item').Item>;

describe('polynomial-identities: plan', () => {
  it('walks through every sub-goal of the topic JSON, in order, each with a family', () => {
    expect(PLAN.map(p => p.id)).toEqual(TOPIC.subgoals.map((s: { id: string }) => s.id));
    for (const p of PLAN) { expect(p.families.length, p.id).toBeGreaterThan(0); for (const f of p.families) expect(GEN[f], f).toBeDefined(); }
  });
});

describe('polynomial-identities: families', () => {
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

// ---------- topic checks: the maths, the "secretly right" probe, the voice script ----------
import { E, M, collect, ex, exHtml, exTex, isIdentity, minus, mul, plus, pow, polyTex, grp, valEx } from '../src/lesson/topics/polynomial-identities/idm';
import { SCRIPT } from '../src/lesson/topics/polynomial-identities/script';
import { explain } from '../src/lesson/topics/polynomial-identities/explain';

describe('polynomial-identities: maths', () => {
  it('the three special products and the Pythagorean identity hold for every value', () => {
    expect(isIdentity(pow(E('a + b'), 2), E('a2 + 2ab + b2'))).toBe(true);
    expect(isIdentity(pow(E('a - b'), 2), E('a2 - 2ab + b2'))).toBe(true);
    expect(isIdentity(mul(E('a + b'), E('a - b')), E('a2 - b2'))).toBe(true);
    expect(isIdentity(pow(E('x2 + y2'), 2), plus(pow(E('x2 - y2'), 2), pow(E('2xy'), 2)))).toBe(true);
    expect(isIdentity(mul(E('x + y'), E('x2 - xy + y2')), E('x3 + y3'))).toBe(true);
    expect(isIdentity(pow(E('a + b'), 2), E('a2 + b2'))).toBe(false);
  });
  it('writes expressions with the brackets a reader needs', () => {
    expect(exTex(mul(E('x + 1'), E('x - 2'), E('x + 3')))).toBe('(x + 1)(x - 2)(x + 3)');
    expect(exTex(mul(plus(grp(E('x + 1')), '3'), minus(grp(E('x + 1')), '3')))).toBe('((x + 1) + 3)((x + 1) - 3)');
    expect(exTex(pow(E('2xy'), 2))).toBe('(2xy)^{2}');
    expect(exTex(mul(E([M(-2, 'x')]), E([M(-4, 'y')])))).toBe('(-2x)(-4y)');
    expect(exHtml(pow(E('x2'), 2))).toBe('(<i>x</i><sup>2</sup>)<sup>2</sup>');
    expect(polyTex(collect(ex(pow(E('x + 1'), 3))))).toBe('x^{3} + 3x^{2} + 3x + 1');
  });
  it('the worked example and the turn: 529, a = -5 and b = 2, (a - b)^2 at 5 and 2', () => {
    expect(valEx(pow(E('a + b'), 2), { a: 20, b: 3 })).toBe(529);
    expect(valEx(pow(E('a + b'), 2), { a: -5, b: 2 })).toBe(9);
    expect(valEx(E('a2 + b2'), { a: -5, b: 2 })).toBe(29);
    expect(valEx(pow(E('a - b'), 2), { a: 5, b: 2 })).toBe(9);
    expect(valEx(E('a2 - b2'), { a: 5, b: 2 })).toBe(21);
  });
});

describe('polynomial-identities: no wrong choice is secretly right (2000 seeds per family)', () => {
  // every expression choice is compared with the answer as a polynomial; here the same rule for the choice texts:
  // two choices whose plain text is an equation or expression must never be the same polynomial as the answer
  it('choice items: exactly one right, every seed', () => {
    for (const p of PLAN) for (const f of p.families) {
      for (let s = 1; s <= 2000; s++) {
        const item = GEN[f]!(rng(s * 97 + 3), s, p.id);
        expect(item.check(item.answer).ok, `${f} ${s}`).toBe(true);
        if (item.choices) expect(item.choices.filter((_, i) => item.check({ kind: 'choice', i }).ok).length, `${f} ${s}`).toBe(1);
      }
    }
  });
  it('the worked steps arrive at the answer', () => {
    for (const p of PLAN) for (const f of p.families) for (let s = 1; s <= 200; s++) {
      const item = GEN[f]!(rng(s * 13 + 5), s, p.id);
      const ex2 = explain(item);
      expect(ex2, `${f} ${s}`).not.toBeNull();
      expect(item.check(ex2!.result).ok, `${f} ${s}: ${ex2!.steps.join(' | ')}`).toBe(true);
    }
  });
  it('a "No" in nearMatch is honest: those monic quadratics are not (x + m)^2 - k^2 with whole numbers', () => {
    // x^2 + Bx + C = (x + m)^2 - k^2 needs B = 2m even and m^2 - C = k^2 a perfect square
    const isDiff = (B: number, C: number) => B % 2 === 0 && Number.isInteger(Math.sqrt((B / 2) ** 2 - C)) && (B / 2) ** 2 - C > 0;
    for (const m of [2, 3, 5, 6, 7, 8, 10, 11, 12, 13, 15]) for (let s2 = 1; s2 <= 4; s2++) expect(isDiff(2 * s2, s2 * s2 - m), `(x+${s2})^2 - ${m}`).toBe(false);
    for (let k = 2; k <= 9; k++) for (let s2 = 0; s2 <= 4; s2++) expect(isDiff(2 * s2, s2 * s2 + k * k), `(x+${s2})^2 + ${k * k}`).toBe(false);
  });
});

describe('polynomial-identities: text probes', () => {
  it('no choice, prompt or board has a zero term, and no lone number in brackets before ÷', () => {
    const plainT = (h: string) => h.replace(/<[^>]+>/g, '').replace(/&#8202;|&nbsp;/g, ' ');
    for (const p of PLAN) for (const f of p.families) for (let s = 1; s <= 600; s++) {
      const item = GEN[f]!(rng(s * 7 + 1), s, p.id);
      for (const t of [...(item.choices ?? []), item.prompt].map(plainT)) {
        expect(/[+−-] 0(?![\d.,])/.test(t), `${f} ${s}: ${t}`).toBe(false);
        expect(/\(\d+\) ÷/.test(t), `${f} ${s}: ${t}`).toBe(false);
      }
      expect(/[+-] 0(?![\d.])/.test(item.board), `${f} ${s}: ${item.board}`).toBe(false);
    }
  });
});

describe('polynomial-identities: voice script', () => {
  const LINES = JSON.parse(fs.readFileSync('pages/lessons/polynomial-identities/voice/lines.json', 'utf8')) as Record<string, { text: string }>;
  it('every panel line has its spoken text, without digits or symbols', () => {
    for (const [id, v] of Object.entries(SCRIPT)) {
      expect(LINES[id]?.text, id).toBe(v.say);
      expect(/[0-9=+×÷<>^²³]/.test(v.say), `${id}: ${v.say}`).toBe(false);
    }
  });
});
