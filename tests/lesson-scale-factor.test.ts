// scale factor: every family x every sub-goal it serves x 300 seeds gives a valid item (the answer passes, choices
// unique with exactly one right, every misconception id exists and the typical wrong answers are classified), every
// picture is honest (copies really are copies, labels match the drawn lengths) and readable (layout rules); the plan
// covers every sub-goal of the topic JSON in order; the model's maths (scaled copies, angles, triangles) holds.
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { rng, type Item } from '../src/lesson/runtime/item';
import { FAMILY_NAMES, GENS, PF, PROBES, type ScaleItem, valueOf } from '../src/lesson/topics/scale-factor/items';
import { PLAN } from '../src/lesson/topics/scale-factor/plan';
import { angleAt, ell, layoutPic, para, picMaths, rect, scale, scaledCopy, sides, sss, stretch, texNumber, turn, flip } from '../src/lesson/topics/scale-factor/scaleMaths';
import { LESSON_FRAME, LESSON_PICS } from '../src/lesson/topics/scale-factor/lessonPics';
import { picSteps } from '../src/lesson/topics/scale-factor/ScaleGrid';
import { qEq, rat } from '../src/core/math';

const TOPIC = 'C:/Users/stelt/Claude code foler/math-curriculum-essentials/topics/primary.geometry.enlarge-reduce-scale-factor.json';
const MCS = 'C:/Users/stelt/Claude code foler/math-curriculum-essentials/misconceptions.json';
const mcIds = existsSync(MCS) ? new Set((JSON.parse(readFileSync(MCS, 'utf8')) as { misconceptions: { id: string }[] }).misconceptions.map(m => m.id)) : null;

const pairs = PLAN.flatMap(p => p.families.map(f => [f, p.id] as const));
const make = (f: string, sg: string, s: number): ScaleItem => GENS[f as keyof typeof GENS](rng(s * 7919 + f.length * 31), s, sg) as ScaleItem;
/** the fewest distinct items a family must make in 300 seeds */
const MIN_DISTINCT: Record<string, number> = { predict: 25, angleCheck: 40 };

describe('plan', () => {
  it('covers every sub-goal of the topic JSON, in order, each with a family that exists', () => {
    if (existsSync(TOPIC)) {
      const t = JSON.parse(readFileSync(TOPIC, 'utf8')) as { subgoals: { id: string; order: number }[] };
      expect(PLAN.map(p => p.id)).toEqual([...t.subgoals].sort((a, b) => a.order - b.order).map(s => s.id));
    }
    for (const p of PLAN) {
      expect(p.families.length).toBeGreaterThan(0);
      for (const f of p.families) { expect(GENS[f as keyof typeof GENS], f).toBeTypeOf('function'); expect(FAMILY_NAMES[f as keyof typeof FAMILY_NAMES], f).toBeTruthy(); }
    }
    expect(new Set(PLAN.flatMap(p => p.families))).toEqual(new Set(Object.keys(GENS)));
  });
});

describe('item families', () => {
  for (const [f, sg] of pairs) {
    it(`${f} for ${sg}: 300 seeds, valid, classified, honest and readable pictures`, () => {
      const seen = new Set<string>();
      let probes = 0;
      for (let s = 1; s <= 300; s++) {
        const it = make(f, sg, s);
        expect(it.family).toBe(f);
        expect(it.check(it.answer).ok, `${it.prompt} ${JSON.stringify(it.answer)}`).toBe(true);
        expect(it.solution.length).toBeGreaterThan(0);
        for (const t of [it.prompt, it.board, ...it.solution, ...(it.choices ?? [])]) expect(t).not.toMatch(/undefined|NaN|Infinity|null/);
        if (it.choices) {
          expect(new Set(it.choices).size, it.choices.join(' | ')).toBe(it.choices.length);
          expect(it.choices.map((_, i) => it.check({ kind: 'choice', i })).filter(v => v.ok).length).toBe(1);
        }
        for (const p of PROBES.get(it as Item) ?? []) {
          const v = it.check(p.r);
          expect(v.ok, `${it.prompt} probe ${JSON.stringify(p.r)}`).toBe(false);
          expect(v.mc, `${it.prompt} probe ${JSON.stringify(p.r)}`).toBe(p.mc);
          if (mcIds) expect(mcIds.has(p.mc), p.mc).toBe(true);
          probes++;
        }
        if (it.pict) {
          expect(picMaths(it.pict.pic), it.prompt).toBeNull();
          expect(layoutPic(it.pict.pic, PF).why, it.prompt).toBeNull();
          const steps = new Set(picSteps(it.pict.pic));
          const fig = (k: string) => /^f(\d+)/.exec(k);
          for (const k of [...(it.pict.hide ?? []), ...(it.pict.solve.show ?? [])]) {
            const m = fig(k);
            expect(m && Number(m[1]) < it.pict.pic.figs.length || steps.has(k) || k === 'm1', `${f}: step ${k}`).toBeTruthy();
          }
          if (it.pict.solve.ring !== undefined) expect(it.pict.solve.ring).toBeLessThan(it.pict.pic.figs.length);
        }
        seen.add(it.prompt + it.board + (it.choices ?? []).join() + JSON.stringify(it.pict?.pic.figs.map(g => [g.pts, g.labels, g.angles])));
      }
      expect(seen.size).toBeGreaterThan(MIN_DISTINCT[f] ?? 40);
      if (!['predict', 'refute'].includes(f)) expect(probes, `${f} has no classified wrong answers`).toBeGreaterThan(0);
    });
  }
});

describe('responses', () => {
  it('accepts any equal form: 15/2, 7 1/2, 7.5 (decimal in the whole box)', () => {
    const v = rat(15, 2);
    expect(qEq(valueOf({ kind: 'frac', w: 0, n: 15, d: 2 })!, v)).toBe(true);
    expect(qEq(valueOf({ kind: 'frac', w: 7, n: 1, d: 2 })!, v)).toBe(true);
    expect(qEq(valueOf({ kind: 'frac', w: 7.5, n: 0, d: 1 })!, v)).toBe(true);
    expect(qEq(valueOf({ kind: 'num', v: 7.5 })!, v)).toBe(true);
    expect(valueOf({ kind: 'frac', w: 0, n: 3, d: 0 })).toBeNull();
  });
});

describe('the model', () => {
  it('a scaled copy multiplies every side by k and keeps every angle; stretches and +n copies fail', () => {
    const L0 = ell(4, 3, 1, 1);
    for (const k of [2, 3, 0.5, 1.5, 0.75]) {
      const sc = scaledCopy(L0, scale(L0, k));
      expect(sc.ok).toBe(true);
      expect(sc.k).toBeCloseTo(k, 9);
      sides(scale(L0, k)).forEach((l, i) => expect(l).toBeCloseTo(k * sides(L0)[i]!, 9));
    }
    expect(scaledCopy(rect(3, 2), stretch(rect(3, 2), 2, 1)).ok).toBe(false);
    expect(scaledCopy(rect(3, 2), rect(6, 5)).ok).toBe(false);          // +3 to every side
    expect(scaledCopy(rect(2, 2), rect(4, 4)).ok).toBe(true);           // +2 on a square is also x2
    expect(scaledCopy(rect(3, 2), para(6, 4, 60)).ok).toBe(false);       // ratios equal, angles not
    expect(scaledCopy(rect(3, 2), para(6, 4, 60)).ratios.every(r => Math.abs(r - 2) < 1e-9)).toBe(true);
  });
  it('turns and flips keep the correspondence by index', () => {
    const T = [[0, 0], [3, 0], [1, 2]] as const;
    for (let n = 0; n < 4; n++) expect(scaledCopy(T, scale(turn(T, n), 2)).ok).toBe(true);
    expect(scaledCopy(T, flip(T)).ok).toBe(true);
  });
  it('angles: a right angle is 90, a triangle sums to 180, an L has a 270 corner', () => {
    expect(angleAt(rect(3, 2), 0)).toBeCloseTo(90, 9);
    const T = sss(5, 4, 3);
    expect(angleAt(T, 0) + angleAt(T, 1) + angleAt(T, 2)).toBeCloseTo(180, 9);
    expect(sides(T)).toEqual([5, expect.closeTo(4, 9), expect.closeTo(3, 9)]);
    expect(angleAt(ell(4, 3, 1, 1), 3)).toBeCloseTo(270, 9);
  });
  it('numeric labels are read exactly', () => {
    expect(texNumber('12')).toBe(12);
    expect(texNumber('7\\tfrac{1}{2}')).toBe(7.5);
    expect(texNumber('\\tfrac{3}{4}')).toBe(0.75);
    expect(texNumber('?')).toBeNull();
  });
  it('the lesson pictures (parts 1-4) are honest and readable in the lesson frame', () => {
    for (const [name, pic] of Object.entries(LESSON_PICS)) {
      expect(picMaths(pic), name).toBeNull();
      expect(layoutPic(pic, LESSON_FRAME).why, name).toBeNull();
    }
  });
});

describe('voice', () => {
  it('every voiced line of the script is in voice/lines.json with the same spoken text, and nothing else is', async () => {
    const { SCRIPT } = await import('../src/lesson/topics/scale-factor/script');
    const lines = JSON.parse(readFileSync('pages/lessons/scale-factor/voice/lines.json', 'utf8')) as Record<string, { text: string }>;
    expect(Object.keys(lines).sort()).toEqual(Object.keys(SCRIPT).sort());
    for (const [id, v] of Object.entries(SCRIPT)) {
      expect(lines[id]!.text, id).toBe(v.s);
      expect(v.s, id).not.toMatch(/[0-9]\/[0-9]|<|×|÷/);   // read aloud: "one half", not "1/2"
    }
  });
});
