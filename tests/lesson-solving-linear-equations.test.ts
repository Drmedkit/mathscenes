// lesson-solving-linear-equations: the generic checks (every family x every sub-goal it serves x 300 seeds). Add topic checks below.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { rng } from '../src/lesson/runtime/item';
import { GENERATORS } from '../src/lesson/topics/solving-linear-equations/items';
import { PLAN } from '../src/lesson/topics/solving-linear-equations/plan';

const TOPIC = { subgoals: [...new Map(["secondary-t6-07-solving-linear-equations-and-inequalities-algebra-i"].flatMap(i => JSON.parse(fs.readFileSync(`../math-curriculum-essentials/topics/${i}.json`, 'utf8')).subgoals).map((s: { id: string }) => [s.id, s] as const)).values()] };
const CATALOG = new Set<string>(JSON.parse(fs.readFileSync('../math-curriculum-essentials/misconceptions.json', 'utf8')).misconceptions.map((m: { id: string }) => m.id));
const GEN = GENERATORS as Record<string, (R: () => number, n: number, sg?: string) => import('../src/lesson/runtime/item').Item>;

describe('solving-linear-equations: plan', () => {
  it('walks through every sub-goal of the topic JSON, in order, each with a family', () => {
    expect(PLAN.map(p => p.id)).toEqual(TOPIC.subgoals.map((s: { id: string }) => s.id));
    for (const p of PLAN) { expect(p.families.length, p.id).toBeGreaterThan(0); for (const f of p.families) expect(GEN[f], f).toBeDefined(); }
  });
});

describe('solving-linear-equations: families', () => {
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
import { ALL, EMPTY, L, inter, member, point, ray, sameSet, setP, solve, solveChain, union } from '../src/lesson/topics/solving-linear-equations/sets';
import { SetLine, axisFor } from '../src/lesson/topics/solving-linear-equations/SetLine';
import { SCRIPT } from '../src/lesson/topics/solving-linear-equations/script';
import { picFits } from '../src/lesson/topics/solving-linear-equations/pictures';
import { frame } from '../src/blocks/block';
import { dusk } from '../src/lesson/dusk';
import type { Item } from '../src/lesson/runtime/item';

describe('solving-linear-equations: sets', () => {
  it('solves linear statements exactly, the sign of the coefficient decides the direction', () => {
    expect(setP(solve(L(-4, 7), '>', L(0, 19)))).toBe('x < −3');
    expect(setP(solve(L(-2, 7), '<=', L(3, 2)))).toBe('x ≥ 1');
    expect(setP(solve(L(3, 2), '>', L(3, -1)))).toBe('all real numbers');
    expect(setP(solve(L(3, 2), '<', L(3, -1)))).toBe('no solution');
    expect(sameSet(solve(L(2, 1), '<', L(2, 1)), EMPTY)).toBe(true);
    expect(sameSet(solve(L(2, 1), '<=', L(2, 1)), ALL)).toBe(true);
    expect(setP(solve(L(2, -6), '=', L(2, -6)))).toBe('all real numbers');
  });
  it('compound inequalities: three parts, and / or, empty and all-real results', () => {
    expect(setP(solveChain(-3, '<', L(2, 1), '<=', 7))).toBe('−2 < x ≤ 3');
    expect(setP(solveChain(4, '<=', L(-3, 1), '<', 10))).toBe('−3 < x ≤ −1');
    expect(setP(solveChain(-5, '<=', L(-2, 1), '<', 3))).toBe('−1 < x ≤ 3');
    expect(setP(inter(ray('>', 3), ray('<=', 6)))).toBe('3 < x ≤ 6');
    expect(setP(union(ray('<', -2), ray('>=', 3)))).toBe('x < −2 or x ≥ 3');
    expect(inter(ray('<', 1), ray('>', 4))).toEqual([]);
    expect(setP(union(ray('<', 5), ray('>', 2)))).toBe('all real numbers');
    expect(member(union(point(2), ray('>', 5)), 2)).toBe(true);
  });
});

describe('solving-linear-equations: SetLine', () => {
  const MF = frame(60, 70, 940, 940);
  it('lays out the worked example (crossing arrows, both symbols turned) inside the frame', () => {
    const B = SetLine({ ...axisFor([-5, 3, -6, 2, -1, 3], 620), rows: [
      { key: 'top', name: '1 - 2x', name2: '-2x', set: solveChain(-5, '<=', L(1, 0), '<', 3), role: 'first', numbers: 'above', shift: -1 },
      { key: 'x', name: 'x', set: solveChain(-5, '<=', L(-2, 1), '<', 3), numbers: 'below' }],
    maps: [{ key: 'm', from: 'top', to: 'x', vs: [-6, 2], op: { kind: 'mul', by: -0.5 } }],
    tests: [{ key: 't1', row: 'x', v: 3 }, { key: 't2', row: 'x', v: 1 }, { key: 't3', row: 'x', v: -2 }] }, MF, dusk);
    expect(B.mapped.m!.reverses).toBe(true);
    expect(B.mapped.m!.map(p => p.to)).toEqual([3, -1]);
    expect(B.tests.map(t => t.ok)).toEqual([true, true, false]);
    expect(B.box.y0).toBeGreaterThanOrEqual(MF.y - 20);
    expect(B.box.y1).toBeLessThanOrEqual(MF.y + MF.h + 20);
  });
  it('refuses a map that would show a wrong order', () => {
    expect(() => SetLine({ lo: -5, hi: 5, tick: 1, every: 2, rows: [{ key: 'a', numbers: 'above' }, { key: 'b', numbers: 'below' }],
      maps: [{ key: 'm', from: 'b', to: 'a', vs: [1, 2], op: { kind: 'mul', by: -1 } }] }, MF, dusk)).toThrow();
  });
  it('every practice line picture lays out (generators retry until it fits)', () => {
    let lines = 0, bad = 0;
    for (const p of PLAN) for (const f of p.families) for (let s = 1; s <= 120; s++) {
      const it = GEN[f]!(rng(s * 13 + 1), s, p.id) as Item & { picture?: { line?: import('../src/lesson/topics/solving-linear-equations/items').LinePic } };
      const L0 = it.picture?.line; if (!L0) continue;
      lines++;
      if (!picFits(L0)) bad++;
    }
    expect(lines).toBeGreaterThan(500);
    expect(bad).toBe(0);
  });
});

describe('solving-linear-equations: misconception probes', () => {
  const first = (f: string, sg: string, pred: (it: Item) => boolean) => { for (let s = 1; s < 400; s++) { const it = GEN[f]!(rng(s), s, sg); if (pred(it)) return it; } throw new Error('no item'); };
  const mcOf = (it: Item, text: RegExp) => { const i = (it.choices ?? []).findIndex(c => text.test(c)); return i < 0 ? 'none' : it.check({ kind: 'choice', i }).mc; };
  it('a missed flip and a flip for any negative are told apart', () => {
    const it = first('revSolve', 'inequality-with-reversal', x => /÷|by −|Divide both sides by −|Multiply both sides by −/.test(x.solution.join(' ')) && /NEGATIVE/.test(x.solution.join(' ')));
    const ok = (it.answer as { i: number }).i;
    const wrong = it.choices!.map((_, i) => it.check({ kind: 'choice', i }).mc).filter(Boolean);
    expect(wrong).toContain('mc.linear-equations.no-reversal-for-negative');
    expect(it.check({ kind: 'choice', i: ok }).ok).toBe(true);
  });
  it('x = 0 for a cancelled variable is zero-vs-no-solution', () => {
    const it = first('howMany', 'identity-contradiction-equations', x => x.choices!.some(c => /No solution/.test(c)) && !x.choices!.some(c => /One solution: <i>x<\/i> = (?!0)/.test(c)) && x.check({ kind: 'choice', i: x.choices!.findIndex(c => /All real/.test(c)) }).ok);
    expect(mcOf(it, /= 0$/)).toBe('mc.linear-equations.zero-vs-no-solution');
  });
  it('compound: one symbol turned, and partial transforms, are named', () => {
    const it = first('compSolve', 'compound-inequalities', x => x.choices!.length === 4);
    const mcs = it.choices!.map((_, i) => it.check({ kind: 'choice', i }).mc);
    expect(mcs).toContain('mc.linear-equations.compound-partial-transform');
  });
  it('rounding to the nearest in a budget is caught', () => {
    const it = first('viable', 'contextual-domain', x => /at most|within/.test(x.prompt));
    const v = (it.answer as { v: number }).v;
    expect(it.check({ kind: 'num', v: v + 1 }).mc).toBe('mc.estimation.rounds-nearest-when-context-needs-direction');
  });
});

describe('solving-linear-equations: voice', () => {
  it('lines.json speaks every panel line of parts 1-4, without digits or symbols', () => {
    const lines = JSON.parse(fs.readFileSync('pages/lessons/solving-linear-equations/voice/lines.json', 'utf8')) as Record<string, { text: string }>;
    expect(Object.keys(lines).sort()).toEqual(Object.keys(SCRIPT).sort());
    for (const [k, v] of Object.entries(SCRIPT)) { expect(lines[k]!.text, k).toBe(v.say); expect(v.say, k).not.toMatch(/[0-9<>≤≥=−+×÷]/); }
  });
});
