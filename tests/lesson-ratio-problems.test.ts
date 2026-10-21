// lesson-ratio-problems: the generic checks (every family x every sub-goal it serves x 300 seeds), then the topic
// checks: the exact maths, the double number line (pairs line up; every picture fits and shows the item's answer),
// the classifier (the main misconceptions get their catalogue ids), the boards typeset, and the voice lines.
import { beforeAll, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { rng } from '../src/lesson/runtime/item';
import { GENERATORS, MC, type RPItem } from '../src/lesson/topics/ratio-problems/items';
import { PLAN } from '../src/lesson/topics/ratio-problems/plan';
import { tex, texReady } from '../src/core/tex';
import { DL_FRAME, computeDL, planDL, roughMeasure, dlFits } from '../src/lesson/topics/ratio-problems/DoubleLine';
import { CHERRY, HIKE, PEARS } from '../src/lesson/topics/ratio-problems/specs';
import { LINES } from '../src/lesson/topics/ratio-problems/script';
import { fmt, longDiv, missing, places, qEq, qNum, rat, roundQ, terminates, truncQ, valueOf } from '../src/lesson/topics/ratio-problems/ratioMaths';

const TOPIC = JSON.parse(fs.readFileSync('../math-curriculum-essentials/topics/primary.ratios.solve-complex-ratio-problems.json', 'utf8'));
const CATALOG = new Set<string>(JSON.parse(fs.readFileSync('../math-curriculum-essentials/misconceptions.json', 'utf8')).misconceptions.map((m: { id: string }) => m.id));
const GEN = GENERATORS as Record<string, (R: () => number, n: number, sg?: string) => import('../src/lesson/runtime/item').Item>;

describe('ratio-problems: plan', () => {
  it('walks through every sub-goal of the topic JSON, in order, each with a family', () => {
    expect(PLAN.map(p => p.id)).toEqual(TOPIC.subgoals.map((s: { id: string }) => s.id));
    for (const p of PLAN) { expect(p.families.length, p.id).toBeGreaterThan(0); for (const f of p.families) expect(GEN[f], f).toBeDefined(); }
  });
  it('every misconception id the topic uses is in the catalogue', () => {
    for (const id of Object.values(MC)) expect(CATALOG.has(id), id).toBe(true);
  });
});

describe('ratio-problems: families', () => {
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
const item = (f: string, sg: string, s: number) => GEN[f]!(rng(s * 7919 + 13), s, sg) as RPItem;
const num = (v: number) => ({ kind: 'num' as const, v });
const plainText = (s: string) => s.replace(/<span class="fr"><span>([^<]*)<\/span><span>([^<]*)<\/span><\/span>/g, '$1/$2').replace(/<[^>]+>/g, '').replace(/&#8202;/g, ' ');

describe('ratio-problems: exact maths', () => {
  it('keeps values exact, carries long division and rounds once, half up', () => {
    expect(qEq(missing(4, 10, 6), rat(15))).toBe(true);
    expect(qEq(missing(7, 20, 12), rat(240, 7))).toBe(true);
    expect(longDiv(rat(240, 7), 3)).toBe('34.285');
    expect(longDiv(rat(35, 6), 3)).toBe('5.833');
    expect(qEq(roundQ(rat(240, 7), 2), rat(3429, 100))).toBe(true);
    expect(qEq(roundQ(rat(21, 8), 2), rat(263, 100))).toBe(true);   // 2.625 -> 2.63
    expect(qEq(truncQ(rat(240, 7), 2), rat(3428, 100))).toBe(true);
    expect(terminates(rat(3, 8)) && places(rat(3, 8)) === 3 && !terminates(rat(5, 3))).toBe(true);
    expect(fmt(rat(9, 2), true)).toBe('$4.50');
    expect(qEq(valueOf({ kind: 'frac', w: 8, n: 4, d: 7 })!, rat(60, 7))).toBe(true);
    expect(qEq(valueOf({ kind: 'frac', w: 7.5, n: 0, d: 1 })!, rat(15, 2))).toBe(true);
  });
});

describe('ratio-problems: the double number line', () => {
  it('lines up the pairs: one multiplier on both lines, the rate inside a pair', () => {
    const c = computeDL(CHERRY);
    expect(qEq(c.tB, rat(15)) && qEq(c.mult, rat(3, 2)) && qEq(c.rate, rat(5, 2)) && qEq(c.pB!, rat(5))).toBe(true);
    const hk = computeDL(HIKE);
    expect(hk.miss).toBe('top');
    expect(qEq(hk.tA, rat(3)) && qEq(hk.mult, rat(3, 4)) && qEq(hk.rate, rat(3))).toBe(true);
    const p = computeDL(PEARS);
    expect(qEq(p.tB, rat(240, 7)) && qEq(roundQ(p.tB, 2), rat(3429, 100))).toBe(true);
    expect(() => computeDL({ given: [4, 10], target: [6, 12] })).toThrow();
    expect(() => computeDL({ given: [4, 10], target: [6, null], pieces: { cut: 2, count: 4 } })).toThrow();
  });
  it('the pictures of parts 1-4 fit the frame (labels never collide)', () => {
    for (const S of [CHERRY, HIKE, PEARS]) expect(() => planDL(S, DL_FRAME, roughMeasure)).not.toThrow();
  });
  it('every practice picture fits, and its missing value is the item answer', () => {
    for (const p of PLAN) for (const f of p.families) for (let s = 1; s <= 120; s++) {
      const it = item(f, p.id, s);
      const S = it.picture?.dl;
      if (!S) continue;
      expect(dlFits(S, DL_FRAME), it.prompt).toBe(true);
      const m = computeDL(S), miss = m.miss === 'bot' ? m.tB : m.tA;
      const ans = it.answer.kind === 'num' ? it.answer.v : it.answer.kind === 'frac' ? qNum(valueOf(it.answer)!) : NaN;
      expect(Math.abs(qNum(miss) - ans), it.prompt).toBeLessThanOrEqual((/tenth/.test(it.prompt) ? 0.05 : 0.005) + 1e-9);
    }
  });
});

describe('ratio-problems: misconceptions are classified', () => {
  const mcOf = (it: RPItem, v: number) => it.check(num(v)).mc;
  it('scale up: adding the same amount, and the multiplier upside down', () => {
    let add = 0, inv = 0;
    for (let s = 1; s <= 60; s++) {
      const it = item('scaleUp', 'scale-up-same-factor', s);
      const m = /= ([\d.]+) ÷ ([\d.]+) =/.exec(plainText(it.solution[0]!))!;
      const t = Number(m[1]), k0 = Number(m[2]), u0 = it.answer.kind === 'num' ? it.answer.v * k0 / t : 0;
      if (mcOf(it, u0 + t - k0) === MC.additive) add++;
      if (Number.isInteger(u0 * k0 / t) && mcOf(it, u0 * k0 / t) === MC.inverted) inv++;
    }
    expect(add).toBeGreaterThan(50);
    expect(inv).toBeGreaterThan(5);
  });
  it('the multiplier: old ÷ new and the difference', () => {
    for (let s = 1; s <= 40; s++) {
      const it = item('findFactor', 'find-factor-as-quotient', s);
      const [o, w] = (/(\d+) \\xrightarrow.*\} (\d+)/.exec(it.board)!).slice(1).map(Number) as [number, number];
      expect(it.check({ kind: 'frac', w: 0, n: o, d: w }).mc).toBe(MC.inverted);
      expect(it.check({ kind: 'frac', w: Math.abs(w - o), n: 0, d: 1 }).mc).toBe(MC.difference);
    }
  });
  it('rounding: too early, cut off, the wrong place', () => {
    let early = 0, trunc = 0, place = 0;
    for (let s = 1; s <= 200; s++) {
      const it = item('roundEnd', 'round-at-final-step', s);
      const sol = plainText(it.solution.join(' '));
      const e = /first would give (\d+(?:\.\d+)?)/.exec(sol);
      if (e && mcOf(it, Number(e[1])) === MC.early) early++;
      const d = /: ([\d.]+)…/.exec(sol);
      if (d && it.answer.kind === 'num') {
        const cents = /cent/.test(it.prompt), dp = cents ? 2 : 1, cut = Math.floor(Number(d[1]) * 10 ** dp + 1e-9) / 10 ** dp;
        if (Math.abs(cut - it.answer.v) > 1e-9 && mcOf(it, cut) === MC.truncates) trunc++;
        const tenth = Math.round(Number(d[1]) * 10) / 10;
        if (cents && Math.abs(tenth - it.answer.v) > 1e-9 && mcOf(it, tenth) === MC.wrongPlace) place++;
      }
    }
    expect(early).toBeGreaterThan(150);
    expect(trunc).toBeGreaterThan(10);
    expect(place).toBeGreaterThan(10);
  });
  it('rates divided the wrong way round; units not converted', () => {
    for (let s = 1; s <= 40; s++) {
      const it = item('complexRate', 'fraction-quantities-unit-rate', s);
      const v = valueOf({ kind: 'frac', ...(it.answer as { w: number; n: number; d: number }) })!;
      if (!qEq(v, rat(1))) expect(it.check({ kind: 'frac', w: 0, n: v.q, d: v.p }).mc, it.prompt).toBe(MC.reversed);
      const mu = item('mixedUnits', 'check-units-mixed', s);
      const per = /(\d+) (ounces|minutes|inches)/.exec(plainText(mu.prompt))!;
      const conv = per[2] === 'ounces' ? 16 : per[2] === 'minutes' ? 60 : 12;
      expect(mu.check(num((mu.answer as { v: number }).v * conv)).mc, mu.prompt).toBe(MC.unconverted);
    }
  });
  it('long division: the remainder written after the point', () => {
    let n = 0;
    for (let s = 1; s <= 80; s++) {
      const it = item('longDiv', 'decimal-digits-past-precision', s);
      const [p, q] = (/(\d+) \\div (\d+)/.exec(it.board)!).slice(1).map(Number) as [number, number];
      const v = Number(`${Math.floor(p / q)}.${p % q}`);
      if (Math.abs(v - (it.answer as { v: number }).v) > 1e-9 && it.check(num(v)).mc === MC.remainder) n++;
    }
    expect(n).toBeGreaterThan(60);
  });
});

describe('ratio-problems: boards and voice', () => {
  beforeAll(async () => { await texReady(); });
  it('every board typesets', () => {
    for (const p of PLAN) for (const f of p.families) for (let s = 1; s <= 40; s++) { const it = item(f, p.id, s); expect(() => tex(it.board), it.board).not.toThrow(); }
  });
  it('voice/lines.json is the spoken text of every panel line, with no digits or symbols', () => {
    const J = JSON.parse(fs.readFileSync('pages/lessons/ratio-problems/voice/lines.json', 'utf8')) as Record<string, { text: string }>;
    expect(Object.keys(J).sort()).toEqual(Object.keys(LINES).sort());
    for (const [k, v] of Object.entries(LINES)) {
      expect(J[k]!.text, k).toBe(v.say);
      expect(/[0-9$%÷×=+/<>]/.test(v.say), `${k}: ${v.say}`).toBe(false);
    }
    const page = fs.readFileSync('pages/lessons/ratio-problems.ts', 'utf8');
    const used = [...page.matchAll(/'([eqtp]\.[\w.-]+)'/g)].map(m => m[1]!).filter(id => !/^[eqtp]\.(r\.|[A-Z]|rails|given|target|cut|count|fill|unit|arc|within|claim|strike|l\d)/.test(id));
    for (const id of used) expect(LINES[id], id).toBeDefined();
  });
});
