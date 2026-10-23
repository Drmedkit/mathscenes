// two-step inequalities: every family x every sub-goal it serves x 300 seeds gives a valid item (the answer passes,
// choices unique with exactly one right, misconception ids exist in the catalogue, boards typeset), the main
// misconceptions are classified, the plan covers every sub-goal of the topic JSON in order, the maths agrees with
// brute-force testing (the symbol turns exactly when both sides are multiplied or divided by a negative), and the
// StepLines model refuses a picture with a wrong flip.
import { beforeAll, describe, expect, it } from 'vitest';
import fs, { existsSync, readFileSync } from 'node:fs';
import { rng, type Item } from '../src/lesson/runtime/item';
import { FAMILIES, FAMILY_NAMES, GENERATORS, MC, classifySet, eqFor, type IqItem } from '../src/lesson/topics/two-step-inequalities/items';
import { PLAN } from '../src/lesson/topics/two-step-inequalities/plan';
import { type Ineq, agreesEverywhere, chainPicture, flip, q, qNum, solve, toggleEq, dq } from '../src/lesson/topics/two-step-inequalities/ineqMaths';
import { StepLines, stepFits } from '../src/lesson/topics/two-step-inequalities/StepLines';
import { orderPicture, setPicture } from '../src/lesson/topics/two-step-inequalities/pictures';
import { SCRIPT } from '../src/lesson/topics/two-step-inequalities/script';
import { LINES_FRAME as MF } from '../src/lesson/topics/two-step-inequalities/StepLines';
import { dusk } from '../src/lesson/dusk';
import { tex, texReady } from '../src/core/tex';

const ROOT = 'C:/Users/stelt/Claude code foler/math-curriculum-essentials';
const TOPIC = `${ROOT}/topics/secondary.two-step-inequalities.json`;
const MCF = `${ROOT}/misconceptions.json`;
const mcIds = existsSync(MCF) ? new Set((JSON.parse(readFileSync(MCF, 'utf8')) as { misconceptions: { id: string }[] }).misconceptions.map(m => m.id)) : null;
const pairs = PLAN.flatMap(p => p.families.map(f => [f, p.id] as const));
const make = (f: string, sg: string, s: number): IqItem => GENERATORS[f as keyof typeof GENERATORS](rng(s * 7919 + f.length * 31 + sg.length), s, sg);

beforeAll(async () => {
  // words.ts measures labels with a canvas; in node it falls back to an estimate
  if (typeof document === 'undefined') (globalThis as unknown as { document: unknown }).document = { createElement: () => ({ getContext: () => null }) };
  await texReady();
});

describe('plan', () => {
  it('covers every sub-goal of the topic JSON, in order, each with families that exist; every family is used', () => {
    if (existsSync(TOPIC)) {
      const t = JSON.parse(readFileSync(TOPIC, 'utf8')) as { subgoals: { id: string; order: number }[] };
      expect(PLAN.map(p => p.id)).toEqual([...t.subgoals].sort((a, b) => a.order - b.order).map(s => s.id));
    }
    for (const p of PLAN) {
      expect(p.families.length).toBeGreaterThan(0);
      for (const f of p.families) { expect(GENERATORS[f as keyof typeof GENERATORS], f).toBeTypeOf('function'); expect(FAMILY_NAMES[f], f).toBeTruthy(); }
    }
    expect(new Set(PLAN.flatMap(p => p.families))).toEqual(new Set(FAMILIES.map(f => f.id)));
  });
  it('every misconception id the families use is in the catalogue', () => {
    if (!mcIds) return;
    for (const id of Object.values(MC)) expect(mcIds.has(id), id).toBe(true);
  });
});

describe('item families', () => {
  for (const [f, sg] of pairs) {
    it(`${f} for ${sg}: 300 seeds, the answer passes, choices unique with one right, boards typeset`, () => {
      const seen = new Set<string>();
      let pics = 0, drawn = 0;
      for (let s = 1; s <= 300; s++) {
        const it: Item = make(f, sg, s);
        expect(it.family).toBe(f);
        expect(it.check(it.answer).ok, `${it.prompt} ${JSON.stringify(it.answer)}`).toBe(true);
        expect(it.solution.length).toBeGreaterThan(0);
        const text = [it.prompt, it.board, ...(it.choices ?? []), ...it.solution].join(' ');
        expect(text, text).not.toMatch(/undefined|NaN|Infinity|\+ -|- -|\+ −|\+ &minus;|−−|&minus;&minus;|\[object/);
        if (it.choices) {
          expect(new Set(it.choices).size, it.choices.join(' | ')).toBe(it.choices.length);
          expect(it.choices.length).toBeGreaterThanOrEqual(2);
          const verdicts = it.choices.map((_, i) => it.check({ kind: 'choice', i }));
          expect(verdicts.filter(v => v.ok).length, it.prompt + ' :: ' + it.choices.join(' | ')).toBe(1);
          if (mcIds) for (const v of verdicts) if (v.mc) expect(mcIds.has(v.mc), v.mc).toBe(true);
        }
        if (it.input === 'num' && it.answer.kind === 'num') expect(it.check({ kind: 'num', v: it.answer.v + 1000 }).ok).toBe(false);
        const F = tex(it.board);
        expect(F.missing, it.board).toEqual([]);
        const pic = (it as IqItem).picture;
        if (pic) {
          pics++;
          const P = pic.kind === 'chain' ? { ...chainPicture(pic.I), ys: undefined } : pic.kind === 'order' ? orderPicture(pic) : setPicture(pic);
          if (stepFits(P, MF, dusk)) drawn++;
        }
        seen.add(it.prompt + it.board + (it.choices ?? []).join());
      }
      expect(seen.size, `${f}/${sg}`).toBeGreaterThan(40);
      // most pictures can be drawn (the page falls back to the bare board for the rest)
      if (pics) expect(drawn / pics, `${f}/${sg}: ${drawn} of ${pics} pictures fit`).toBeGreaterThan(0.75);
    });
  }
});

describe('the maths', () => {
  it('solve() agrees with brute-force testing; the symbol turns exactly when p < 0', () => {
    for (const sg of ['ineq-solution-set', 'solve-ineq-positive', 'solve-ineq-negative', 'audit-solution-set']) {
      for (let s = 1; s <= 600; s++) {
        const I = eqFor(rng(s * 13 + sg.length), sg);
        const S = solve(I);
        expect(agreesEverywhere(I, S.op, S.b), JSON.stringify(I)).toBe(true);
        expect(S.reversed).toBe(I.p.p < 0);
        if (sg === 'solve-ineq-positive' || sg === 'ineq-solution-set') expect(I.p.p > 0).toBe(true);
        if (sg === 'solve-ineq-negative') expect(I.p.p < 0).toBe(true);
        expect(agreesEverywhere(I, flip(S.op), S.b)).toBe(false);
      }
    }
  });
  it('the worked examples of the lesson', () => {
    const ex: Ineq = { kind: 'lin', p: q(-6), q: q(50), r: q(8), op: '<', side: 'L', qFirst: true, form: 'int', v: 'h' };
    expect(solve(ex)).toMatchObject({ b: q(7), op: '>', reversed: true });
    const turn: Ineq = { kind: 'lin', p: q(-3), q: q(4), r: q(19), op: '<=', side: 'L', form: 'int', v: 'x' };
    expect(solve(turn)).toMatchObject({ b: q(-5), op: '>=' });
    const jordan: Ineq = { kind: 'lin', p: q(2), q: q(-5), r: q(-11), op: '>', side: 'L', form: 'int', v: 'x' };
    expect(solve(jordan)).toMatchObject({ b: q(-3), op: '>' });
    const g: Ineq = { kind: 'grp', p: q(-2), q: dq(-1.5), r: q(7), op: '<=', side: 'L', form: 'dec', v: 'x' };
    expect(qNum(solve(g).b)).toBe(-2);
    expect(solve(g).op).toBe('>=');
    for (const I of [ex, turn, jordan, g]) expect(stepFits(chainPicture(I), MF, dusk), JSON.stringify(I)).toBe(true);
  });
  it('the classifier names the main slips on a solve item', () => {
    const I: Ineq = { kind: 'lin', p: q(-2), q: q(5), r: q(11), op: '>', side: 'L', qFirst: true, form: 'int', v: 'x' };   // 5 - 2x > 11
    expect(classifySet(I, '<', q(-3))).toBeUndefined();
    expect(classifySet(I, '>', q(-3))).toBe(MC.noRev);
    const J: Ineq = { kind: 'lin', p: q(-3), q: q(4), r: q(19), op: '<=', side: 'L', form: 'int', v: 'x' };
    expect(classifySet(J, toggleEq('>='), q(-5))).toBe(MC.flipIncl);
    const K: Ineq = { kind: 'lin', p: q(3), q: q(5), r: q(17), op: '>', side: 'R', form: 'int', v: 'x' };    // 17 < 3x + 5
    expect(classifySet(K, '<', q(4))).toBe(MC.sideSwap);
  });
});

describe('the StepLines model', () => {
  it('refuses a picture whose ray does not turn under a negative move, or turns under a positive one', () => {
    const ex: Ineq = { kind: 'lin', p: q(-6), q: q(50), r: q(8), op: '<', side: 'L', qFirst: true, form: 'int', v: 'h' };
    const P = chainPicture(ex);
    expect(() => StepLines(P, MF, dusk)).not.toThrow();
    const bad = { ...P, sets: [P.sets[0]!, P.sets[1]!, { ...P.sets[2]!, dir: -1 as const }] };
    expect(() => StepLines(bad, MF, dusk)).toThrow(/turn around/);
    const bad2 = { ...P, sets: [P.sets[0]!, { ...P.sets[1]!, dir: 1 as const }, P.sets[2]!] };
    expect(() => StepLines(bad2, MF, dusk)).toThrow(/keep its direction/);
    const bad3 = { ...P, tests: [{ v: 5, ok: true, text: '5' }] };
    expect(() => StepLines(bad3, MF, dusk)).toThrow(/test/);
  });
  it('arrows cross exactly for a negative move (order reversed)', () => {
    const m = StepLines(orderPicture({ a: 3, b: 7, move: { kind: 'mul', k: -1, form: 'int' } }), MF, dusk);
    const x0 = [3, 7].map(v => m.where.x(0, v)), x1 = [-3, -7].map(v => m.where.x(1, v));
    expect(Math.sign(x0[1]! - x0[0]!)).toBe(-Math.sign(x1[1]! - x1[0]!));
  });
});

describe('voice', () => {
  it('every scripted panel line has a spoken text and vice versa', () => {
    const lines = JSON.parse(fs.readFileSync('pages/lessons/two-step-inequalities/voice/lines.json', 'utf8')) as Record<string, { text: string }>;
    expect(Object.keys(lines).sort()).toEqual(Object.keys(SCRIPT).sort());
    for (const [id, l] of Object.entries(SCRIPT)) {
      expect(lines[id]!.text, id).toBe(l.say);
      expect(l.say, id).not.toMatch(/[<>≤≥&]|\d\/\d/);
    }
  });
});

describe('quality-layer fixes (practice sweep, 2026-10-23)', () => {
  const gen = (f: string, sg: string, s: number) => (GENERATORS as Record<string, (R: () => number, n: number, sg?: string) => Item>)[f]!(rng(s * 43 + 1), s, sg);
  it('the steps card names the right number-line graph by its label, never pastes a graph into a step', async () => {
    const { explain } = await import('../src/lesson/topics/two-step-inequalities/explain');
    for (let s = 1; s <= 200; s++) {
      const it = gen('pickSet', 'ineq-solution-set', s), ex = explain(it);
      expect(ex, it.prompt).not.toBeNull();
      expect(it.check(ex!.result).ok, it.prompt).toBe(true);
      expect(ex!.steps.join(' '), it.prompt).not.toMatch(/<svg/);
    }
  });
  it('2-5 steps for audit, chooseModel and proofStep, ending on an answer the lesson accepts', async () => {
    const { explain } = await import('../src/lesson/topics/two-step-inequalities/explain');
    for (const [f, sg] of [['audit', 'audit-solution-set'], ['chooseModel', 'choose-equation-or-inequality'], ['proofStep', 'justify-reversal-general']] as const) {
      for (let s = 1; s <= 200; s++) {
        const it = gen(f, sg, s), ex = explain(it);
        expect(ex, `${f}: ${it.prompt}`).not.toBeNull();
        expect(ex!.steps.length).toBeGreaterThanOrEqual(2);
        expect(ex!.steps.length).toBeLessThanOrEqual(5);
        expect(it.check(ex!.result).ok, `${f}: ${it.prompt}`).toBe(true);
      }
    }
  });
});

describe('worlds (practice sweep, 2026-10-23)', () => {
  const gen = (f: string, sg: string, s: number) => (GENERATORS as Record<string, (R: () => number, n: number, sg?: string) => Item>)[f]!(rng(s * 47 + 5), s, sg);
  it('firstMove asks to undo the last step first, and never offers "divide both sides first" (that is a legal first move too)', () => {
    for (const sg of ['solve-ineq-positive', 'solve-ineq-negative']) for (let s = 1; s <= 300; s++) {
      const it = gen('firstMove', sg, s);
      expect(it.prompt).toMatch(/Undo the last step/);
      const wrong = it.choices!.filter((_, i) => !it.check({ kind: 'choice', i }).ok).join(' | ');
      expect(wrong, wrong).not.toMatch(/(Divide|Multiply) both sides by [^;]*first/);
    }
  });
  it('a temperature below zero is written with a real minus sign (−5 °F, not -5 °F)', () => {
    for (let s = 1; s <= 400; s++) for (const f of ['writeIneq', 'contextSolve']) {
      expect(gen(f, 'inequality-context', s).prompt.replace(/<[^>]+>/g, '')).not.toMatch(/-\d[\d.]* °F/);
    }
  });
});
