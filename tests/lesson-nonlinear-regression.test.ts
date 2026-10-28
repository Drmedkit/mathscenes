// lesson-nonlinear-regression: the generic checks (every family x every sub-goal it serves x 300 seeds). Add topic checks below.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { rng } from '../src/lesson/runtime/item';
import { GENERATORS } from '../src/lesson/topics/nonlinear-regression/items';
import { PLAN } from '../src/lesson/topics/nonlinear-regression/plan';
import { evalM, expReg, expRegOrig, patterned, patternless, pwrReg, quadReg, quadSolve, rd, resid, sqrtReg, sse } from '../src/lesson/topics/nonlinear-regression/nlMaths';
import { BALL, BALL_Q, DRUG, DRUG_E, DRUG_Q, SIGNUPS, SIGN_E, SIGN_Q } from '../src/lesson/topics/nonlinear-regression/lessonData';
import { LINES } from '../src/lesson/topics/nonlinear-regression/script';
import { plain } from '../src/lesson/runtime/item';
import { PLACEMENT } from '../src/lesson/topics/nonlinear-regression/placement';

const TOPIC = { subgoals: [...new Map(["secondary-t7-19-regression-models-non-linear"].flatMap(i => JSON.parse(fs.readFileSync(`../math-curriculum-essentials/topics/${i}.json`, 'utf8')).subgoals).map((s: { id: string }) => [s.id, s] as const)).values()] };
const CATALOG = new Set<string>(JSON.parse(fs.readFileSync('../math-curriculum-essentials/misconceptions.json', 'utf8')).misconceptions.map((m: { id: string }) => m.id));
const GEN = GENERATORS as Record<string, (R: () => number, n: number, sg?: string) => import('../src/lesson/runtime/item').Item>;

describe('nonlinear-regression: plan', () => {
  it('walks through every sub-goal of the topic JSON, in order, each with a family', () => {
    expect(PLAN.map(p => p.id)).toEqual(TOPIC.subgoals.map((s: { id: string }) => s.id));
    for (const p of PLAN) { expect(p.families.length, p.id).toBeGreaterThan(0); for (const f of p.families) expect(GEN[f], f).toBeDefined(); }
  });
});

describe('nonlinear-regression: families', () => {
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
const arr = (a: readonly number[]) => a.slice();
describe('nonlinear-regression: maths', () => {
  it('QuadReg recovers an exact parabola, ExpReg an exact exponential, PwrReg and the square-root model their curves', () => {
    const xs = [0, 1, 2, 3, 4, 5], q = quadReg(xs, xs.map(x => -2 * x * x + 3 * x + 7));
    expect([q.a, q.b, q.c].map(v => rd(v, 9))).toEqual([-2, 3, 7]);
    const e = expReg(xs, xs.map(x => 5 * 1.3 ** x)); expect(rd(e.a, 9)).toBe(5); expect(rd(e.b, 9)).toBe(1.3);
    const p = pwrReg([1, 2, 4, 9], [1, 2, 4, 9].map(x => 1.1 * Math.sqrt(x))); expect(rd(p.b, 9)).toBe(0.5);
    const s = sqrtReg([1, 4, 9, 16], [1, 4, 9, 16].map(x => 3 * Math.sqrt(x) + 2)); expect([rd(s.a, 9), rd(s.k, 9)]).toEqual([3, 2]);
  });
  it('the Desmos original-scale fit has a smaller sum of squared residuals of y than ExpReg', () => {
    const xs = arr(DRUG.xs), ys = arr(DRUG.ys), e = expReg(xs, ys), o = expRegOrig(xs, ys);
    expect(o.sse).toBeLessThanOrEqual(sse(e.model, xs, ys) + 1e-12);
  });
  it('quadSolve: two, one (tangent) and no solutions', () => {
    expect(quadSolve(1, 0, -4, 0)).toEqual([-2, 2]); expect(quadSolve(1, -2, 1, 0)).toEqual([1]); expect(quadSolve(1, 0, 4, 0)).toEqual([]);
  });
});
describe('nonlinear-regression: the lesson data', () => {
  it('drug: the recorded models are the rounded fits; a wave against no pattern; 12 h predictions', () => {
    const xs = arr(DRUG.xs), ys = arr(DRUG.ys), q = quadReg(xs, ys), e = expReg(xs, ys);
    expect([rd(q.a, 4), rd(q.b, 4), rd(q.c, 4)]).toEqual([0.3488, -5.3388, 23.2933]);
    expect([rd(e.a, 4), rd(e.b, 4), rd(e.r2, 4)]).toEqual([23.8714, 0.7509, 0.9997]);
    expect(DRUG_Q.p).toEqual([rd(q.a, 3), rd(q.b, 3), rd(q.c, 3)]); expect(DRUG_E.p).toEqual([rd(e.a, 2), rd(e.b, 3)]);
    const eq = resid(DRUG_Q, xs, ys), ee = resid(DRUG_E, xs, ys);
    expect(eq.map(v => Math.sign(rd(v, 2))).join()).toBe('1,-1,-1,-1,-1,1,1,1,-1');
    expect(patterned(xs, eq)).toBe(true); expect(patternless(xs, ee)).toBe(true);
    expect(rd(ys[2]! - evalM(DRUG_Q, 2), 2)).toBe(-0.61); expect(rd(ys[2]! - evalM(DRUG_E, 2), 2)).toBe(-0.06);
    expect(rd(evalM(DRUG_Q, 12), 1)).toBe(9.5); expect(rd(evalM(DRUG_E, 12), 1)).toBe(0.8); expect(rd(5.339 / (2 * 0.349), 1)).toBe(7.6);
  });
  it('ball: QuadReg output, h(1.5) = 29.1, landing 2.63 s (and −0.11 s)', () => {
    const q = quadReg(arr(BALL.xs), arr(BALL.ys));
    expect([rd(q.a, 4), rd(q.b, 4), rd(q.c, 4), rd(q.r2, 4)]).toEqual([-15.9879, 40.22, 4.7109, 0.9976]);
    expect(BALL_Q.p).toEqual([rd(q.a, 2), rd(q.b, 2), rd(q.c, 2)]);
    expect(rd(evalM(BALL_Q, 1.5), 1)).toBe(29.1);
    expect(quadSolve(-15.99, 40.22, 4.71, 0).map(v => rd(v, 2))).toEqual([-0.11, 2.63]);
  });
  it('sign-ups: both fits within ±0.2; week 13 and 23 predictions', () => {
    const xs = arr(SIGNUPS.xs), ys = arr(SIGNUPS.ys), q = quadReg(xs, ys), e = expReg(xs, ys);
    expect(SIGN_Q.p).toEqual([rd(q.a, 3), rd(q.b, 3), rd(q.c, 3)]); expect(SIGN_E.p).toEqual([rd(e.a, 3), rd(e.b, 3)]);
    for (const m of [SIGN_Q, SIGN_E]) expect(Math.max(...resid(m, xs, ys).map(Math.abs))).toBeLessThan(0.205);
    expect([rd(evalM(SIGN_Q, 13), 1), rd(evalM(SIGN_E, 13), 1), rd(evalM(SIGN_Q, 23), 0), rd(evalM(SIGN_E, 23), 0)]).toEqual([33.7, 52.8, 104, 768]);
  });
});
describe('nonlinear-regression: voice and words', () => {
  it('lines.json speaks every panel line, without digits or symbols', () => {
    const J = JSON.parse(fs.readFileSync('pages/lessons/nonlinear-regression/voice/lines.json', 'utf8')) as Record<string, { text: string }>;
    for (const [k, v] of Object.entries(LINES)) { expect(J[k]?.text, k).toBe(v.say); expect(/[0-9%±=+]/.test(v.say), k).toBe(false); }
  });
  it('no float noise, "undefined", "NaN" or "+ −" in any prompt, choice or solution', () => {
    for (const p of PLAN) for (const f of p.families) for (let s = 1; s <= 60; s++) {
      const it = GEN[f]!(rng(s * 13 + 5), s, p.id);
      for (const t of [it.prompt, it.board, ...(it.choices ?? []), ...it.solution]) {
        const x = plain(t);
        expect(/undefined|NaN|Infinity|\+ −\s*\d|− −\s*\d|\d\.\d{7,}/.test(x), `${f}: ${x}`).toBe(false);
      }
    }
  });
});
describe('nonlinear-regression: misconception probes', () => {
  type It = ReturnType<(typeof GEN)[string]>;
  const find = (f: string, ok: (it: It) => boolean): It => { for (let s = 1; s < 400; s++) { const it = GEN[f]!(rng(s), s); if (ok(it)) return it; } throw new Error(f); };
  it('a residual computed as predicted − observed is a sign error', () => {
    for (const f of ['residQuad', 'residExp']) {
      const it = find(f, i => i.answer.kind === 'num' && i.answer.v !== 0);
      const v = (it.answer as { v: number }).v;
      expect(it.check({ kind: 'num', v: -v }).mc).toBe('mc.statistics.residual-sign-errors');
    }
  });
  it('the signed residual total is classified as the signed-total misconception', () => {
    const it = find('sseCompute', () => true), t = plain(it.prompt);
    const yh = t.match(/predicts ŷ = ([\d, ]+) for/)![1]!.split(',').map(Number), ys = t.match(/y = ([\d, ]+) \(/)![1]!.split(',').map(Number);
    expect(it.check({ kind: 'num', v: ys.reduce((s, v, i) => s + v - yh[i]!, 0) }).mc).toBe('mc.statistics.signed-residual-total-as-fit-objective');
  });
  it('the ln-fit coefficients not exponentiated are classified', () => {
    const it = find('linRecover', () => true), b = it.board.match(/= (-?[\d.]+) ([+-]) ([\d.]+)x/)!;
    const A = Number(b[1]), B = (b[2] === '-' ? -1 : 1) * Number(b[3]), da = /nearest whole/.test(it.prompt) ? 0 : 2;
    expect(it.check({ kind: 'pair', x: rd(A, da), y: rd(B, 3) }).mc).toBe('mc.exponential-log.log-fit-coefficients-not-exponentiated');
  });
  it('a calendar year typed into a re-coded model is classified', () => {
    const it = find('recodePredict', () => true), m = plain(it.prompt).match(/ŷ = ([\d.,]+)\(([\d.]+)\)x, with x = years since (\d+).*value for (\d+)/)!;
    const a = Number(m[1]!.replace(/,/g, '')), b = Number(m[2]), Y = Number(m[4]), dp = /whole/.test(it.prompt) ? 0 : 1;
    expect(it.check({ kind: 'num', v: rd(a * b ** Y, dp) }).mc).toBe('mc.functions-concept.calendar-vs-elapsed-time');
  });
});
describe('nonlinear-regression: choices never secretly right', () => {
  it('every choice item has exactly one accepted choice and distinct texts, over 1,000 seeds per family', () => {
    for (const p of PLAN) for (const f of p.families) for (let s = 1; s <= 1000; s++) {
      const it = GEN[f]!(rng(s * 7919 + 3), s, p.id);
      if (!it.choices) continue;
      expect(it.choices.filter((_, i) => it.check({ kind: 'choice', i }).ok).length, `${f} ${s}`).toBe(1);
      expect(new Set(it.choices.map(c => plain(c).trim())).size, `${f} ${s}`).toBe(it.choices.length);
    }
  }, 120000);
  it('the check-in picks exist', () => {
    for (const pk of PLACEMENT.picks) expect(PLAN.find(p => p.id === pk.subgoal)?.families).toContain(pk.family);
  });
});
