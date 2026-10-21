// lesson-cylinders-cones-spheres: the generic checks (every family x every sub-goal it serves x 300 seeds). Add topic checks below.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { rng } from '../src/lesson/runtime/item';
import { GENERATORS } from '../src/lesson/topics/cylinders-cones-spheres/items';
import { PLAN } from '../src/lesson/topics/cylinders-cones-spheres/plan';

const TOPIC = JSON.parse(fs.readFileSync('../math-curriculum-essentials/topics/secondary-t5-39-volume-cones-cylinders-spheres.json', 'utf8'));
const CATALOG = new Set<string>(JSON.parse(fs.readFileSync('../math-curriculum-essentials/misconceptions.json', 'utf8')).misconceptions.map((m: { id: string }) => m.id));
const GEN = GENERATORS as Record<string, (R: () => number, n: number, sg?: string) => import('../src/lesson/runtime/item').Item>;

describe('cylinders-cones-spheres: plan', () => {
  it('walks through every sub-goal of the topic JSON, in order, each with a family', () => {
    expect(PLAN.map(p => p.id)).toEqual(TOPIC.subgoals.map((s: { id: string }) => s.id));
    for (const p of PLAN) { expect(p.families.length, p.id).toBeGreaterThan(0); for (const f of p.families) expect(GEN[f], f).toBeDefined(); }
  });
});

describe('cylinders-cones-spheres: families', () => {
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

// ---------- topic checks: the model's maths, the pour levels, typical slips ----------
import { coef, levelOf, q, val, cylLateral, cylTotal } from '../src/lesson/topics/cylinders-cones-spheres/volMaths';

describe('cylinders-cones-spheres: maths', () => {
  it('the three formulas and the pour relations', () => {
    expect(val(coef('cyl', q(3), q(5)))).toBe(45);
    expect(val(coef('cone', q(4), q(6)))).toBe(32);
    expect(coef('cone', q(2), q(5))).toEqual([20, 3]);
    expect(val(coef('sphere', q(3)))).toBe(36);
    expect(val(coef('hemi', q(3)))).toBe(18);
    expect(coef('cyl', q(5, 2), q(4))).toEqual([25, 1]);
    expect(coef('sphere', q(3, 2))).toEqual([9, 2]);
    for (let r = 1; r <= 12; r++) for (let h = 1; h <= 12; h++) {
      expect(val(coef('cone', q(r), q(h))) * 3).toBeCloseTo(val(coef('cyl', q(r), q(h))), 9);
      expect(val(coef('sphere', q(r))) * 3 / 2).toBeCloseTo(val(coef('cyl', q(r), q(2 * r))), 9);
      // cone + hemisphere = cylinder, all radius r and height r
      expect(val(coef('cone', q(r), q(r))) + val(coef('hemi', q(r)))).toBeCloseTo(val(coef('cyl', q(r), q(r))), 9);
    }
    expect(val(cylLateral(q(3), q(5)))).toBe(30);
    expect(val(cylTotal(q(3), q(5)))).toBe(48);
  });
  it('water levels hold the right volume', () => {
    expect(levelOf('cyl', 1 / 3)).toBeCloseTo(1 / 3, 9);
    expect(levelOf('cup', 1 / 27)).toBeCloseTo(1 / 3, 6);
    expect(levelOf('sphere', 0.5)).toBeCloseTo(0.5, 6);
    expect(levelOf('bowl', 1)).toBeCloseTo(1, 6);
    const t = levelOf('sphere', 2 / 3); expect(t * t * (3 - 2 * t)).toBeCloseTo(2 / 3, 6);
  });
});

describe('cylinders-cones-spheres: misconception probes', () => {
  const each = (fam: string, sg: string, f: (it: import('../src/lesson/runtime/item').Item, v: number) => void) => {
    for (let s = 1; s <= 120; s++) { const it = GEN[fam]!(rng(s * 13 + 1), s, sg); const a = it.answer as { kind: string; v?: number; w?: number; n?: number; d?: number }; f(it, a.kind === 'num' ? a.v! : a.w! + a.n! / a.d!); }
  };
  const num = (v: number) => ({ kind: 'num' as const, v });
  const frac = (v: number) => (Number.isInteger(v) ? { kind: 'frac' as const, w: v, n: 0, d: 1 } : { kind: 'frac' as const, w: 0, n: Math.round(v * 9), d: 9 });
  it('cone: whole cylinder, a third twice, a half', () => each('calc-pic', 'cone-volume-calc', (it, c) => {
    expect(it.check(frac(c * 3)).mc).toBe('mc.volume.drops-formula-coefficient');
    if (Number.isInteger(c * 3 / 9 * 9)) expect(it.check(frac(c / 3)).mc).toBe('mc.volume.divides-by-three-twice');
  }));
  it('sphere: dropped 4/3', () => each('calc-pic', 'sphere-volume-calc', (it, c) => { expect(it.check(frac(c * 3 / 4)).mc).toBe('mc.volume.drops-formula-coefficient'); }));
  it('hemisphere: the whole sphere', () => each('calc-pic', 'hemisphere-volume', (it, c) => { expect(it.check(frac(c * 2)).mc).toBe('mc.circles.full-circle-for-part'); }));
  it('diameter as radius', () => each('calc-pic', 'diameter-given', (it, c) => {
    const k = /sphere|hemisphere/.test(it.prompt) ? 8 : 4;
    expect(it.check(frac(c * k)).mc).toBe('mc.circles.diameter-for-radius');
  }));
  it('cone pour: a half', () => each('cone-pour', 'cone-third', (it, v) => { if (/does the cone hold/.test(it.prompt)) expect(it.check(num(v * 3 / 2)).mc).toBe('mc.volume.cone-half-of-cylinder'); }));
  it('cone height: dividing by 3 to undo 1/3', () => each('solve-h', 'solve-for-height', (it, h) => { if (/cone/.test(it.prompt)) expect(it.check(num(h / 9)).mc).toBe('mc.linear-equations.divides-to-undo-unit-fraction-factor'); }));
  it('cubic units: the length factor once', () => each('cubic-cube', 'cubic-unit-conversion', (it, v) => { if (/How many cubic feet/.test(it.prompt)) expect(it.check(num(v / 9)).mc).toBe('mc.measurement-units.linear-factor-for-area'); }));
  it('surface area: lateral for total, one base only', () => each('sa-prism-net', 'sa-prism-lateral-total', (it, v) => {
    // the first solve line ends in the lateral area L; the total is L + 2B
    const L = Number(/= (\d+)$/.exec((it.picture as { hero: string[] }).hero[0]!)![1]);
    if (/total surface area/.test(it.prompt)) {
      expect(it.check(num(L)).mc).toBe('mc.area-perimeter.confuses-lateral-and-total-surface-area');
      expect(it.check(num((L + v) / 2)).mc).toBe('mc.area-perimeter.omits-a-base-from-surface-area');
    } else expect(v).toBe(L);
  }));
});

describe('cylinders-cones-spheres: voice', () => {
  it('lines.json speaks every panel line of parts 1-4, without digits or symbols', async () => {
    const { LINES } = await import('../src/lesson/topics/cylinders-cones-spheres/script');
    const voice = JSON.parse(fs.readFileSync('pages/lessons/cylinders-cones-spheres/voice/lines.json', 'utf8')) as Record<string, { text: string }>;
    expect(Object.keys(voice).sort()).toEqual(Object.keys(LINES).sort());
    for (const [k, v] of Object.entries(LINES)) { expect(voice[k]!.text, k).toBe(v.say); expect(/[0-9=+×÷π²³⁄½⅓]/.test(v.say), k).toBe(false); }
  });
});
