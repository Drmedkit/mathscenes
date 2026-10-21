// circles: every family x every sub-goal it serves x 300 seeds gives a valid item (the answer passes, choices unique
// with exactly one right, the typical wrong answers get their misconception id, which exists in the catalogue), every
// picture lays out readably (no label on a line, none outside the frame); the plan covers every sub-goal of the topic
// JSON in order; the model's maths holds (circumference, area, the wedge rearrangement keeps the area and approaches
// a pi r by r rectangle); the voiced script equals voice/lines.json.
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { rng, type Item } from '../src/lesson/runtime/item';
import { FAMILY_NAMES, GENS, PF, PROBES, type CircleItem, valueOf } from '../src/lesson/topics/circles/items';
import { PLAN } from '../src/lesson/topics/circles/plan';
import { PI, circle, layoutPic, piecePts, segEnds, texW, throughCenter, wedgeStrip, type Pic } from '../src/lesson/topics/circles/circleMaths';
import { LESSON_PICS, LF } from '../src/lesson/topics/circles/lessonPics';
import { rat } from '../src/core/math';

const TOPIC = 'C:/Users/stelt/Claude code foler/math-curriculum-essentials/topics/secondary-t5-21-area-and-circumference-of-circles.json';
const MCS = 'C:/Users/stelt/Claude code foler/math-curriculum-essentials/misconceptions.json';
const mcIds = existsSync(MCS) ? new Set((JSON.parse(readFileSync(MCS, 'utf8')) as { misconceptions: { id: string }[] }).misconceptions.map(m => m.id)) : null;

const pairs = PLAN.flatMap(p => p.families.map(f => [f, p.id] as const));
const make = (f: string, sg: string, s: number): CircleItem => GENS[f as keyof typeof GENS](rng(s * 7919 + f.length * 31), s, sg);
/** families whose structure allows fewer distinct items (fixed reasoning items mixed in) */
const MIN_DISTINCT: Record<string, number> = { propCheck: 12, deriveArea: 30, wedgeRead: 30, piRatio: 30, areaBack: 7, gridBound: 9, scaleFrac: 15, aroundAcross: 30 };
/** the steps a worked solution may show, per picture kind */
const STEPS: Record<Pic['kind'], RegExp> = {
  disc: /^(in|segs|labels|C|CL|A|AL|seg\d+|seg\dL|seg\dA)$/,
  grid: /^(grid|disc|outer|inner|diag|r|A)$/,
  wedges: /^(in|cut|move|top|topL|ht|htL|sq|A|d|dL|r|rL|C)$/,
  pair: /^(a|b|segs|tags|C|A|quad)$/,
  unroll: /^(in|d|dL|roll|dm|C)$/,
};

describe('plan', () => {
  it('covers every sub-goal of the topic JSON, in order, each with a family that exists', () => {
    if (existsSync(TOPIC)) {
      const t = JSON.parse(readFileSync(TOPIC, 'utf8')) as { subgoals: { id: string; order: number }[] };
      expect(PLAN.map(p => p.id)).toEqual([...t.subgoals].sort((a, b) => a.order - b.order).map(s => s.id));
    }
    for (const p of PLAN) {
      expect(p.families.length).toBeGreaterThan(0);
      for (const f of p.families) { expect(GENS[f as keyof typeof GENS], f).toBeTypeOf('function'); expect(FAMILY_NAMES[f], f).toBeTruthy(); }
    }
    expect(new Set(PLAN.flatMap(p => p.families))).toEqual(new Set(Object.keys(GENS)));
  });
});

describe('item families', () => {
  for (const [f, sg] of pairs) {
    it(`${f} for ${sg}: 300 seeds, valid, classified, readable pictures`, () => {
      const seen = new Set<string>();
      let probes = 0;
      for (let s = 1; s <= 300; s++) {
        const it = make(f, sg, s);
        expect(it.family).toBe(f);
        expect(it.check(it.answer).ok, `${it.prompt} ${JSON.stringify(it.answer)}`).toBe(true);
        expect(it.solution.length).toBeGreaterThan(0);
        for (const t of [it.prompt, it.board, ...it.solution, ...(it.choices ?? []), it.unit ?? '']) expect(t).not.toMatch(/undefined|NaN|Infinity|null|\[object/);
        if (it.choices) {
          expect(new Set(it.choices).size, it.choices.join(' | ')).toBe(it.choices.length);
          expect(it.choices.length).toBeGreaterThanOrEqual(2);
          expect(it.choices.map((_, i) => it.check({ kind: 'choice', i })).filter(v => v.ok).length, it.prompt).toBe(1);
        }
        for (const p of PROBES.get(it as Item) ?? []) {
          const v = it.check(p.r);
          expect(v.ok, `${it.prompt} probe ${JSON.stringify(p.r)}`).toBe(false);
          expect(v.mc, `${it.prompt} probe ${JSON.stringify(p.r)}`).toBe(p.mc);
          if (mcIds) expect(mcIds.has(p.mc), p.mc).toBe(true);
          probes++;
        }
        if (it.pict) {
          const lay = layoutPic(it.pict.pic, PF);
          expect(lay.why, `${it.prompt} ${JSON.stringify(it.pict.pic)}`).toBeNull();
          for (const k of [...(it.pict.solve.show ?? []), ...(it.pict.rest ?? [])]) expect(k, `${f}: step ${k}`).toMatch(STEPS[it.pict.pic.kind]);
          if (it.pict.solve.hl !== undefined && it.pict.pic.kind === 'disc') expect(it.pict.solve.hl).toBeLessThan(it.pict.pic.segs.length);
          if (it.pict.solve.tex) expect(it.pict.solve.tex).not.toMatch(/undefined|NaN/);
        }
        // the board lines fit the practice board (560 px wide, at the smallest size the page allows)
        if (it.pict) for (const t of [it.board, it.pict.solve.tex ?? '']) expect(texW(t, 44), t).toBeLessThan(470);
        seen.add(it.prompt + it.board + (it.choices ?? []).join() + JSON.stringify(it.pict?.pic ?? ''));
      }
      expect(seen.size).toBeGreaterThan(MIN_DISTINCT[f] ?? 40);
      if (!['approx', 'piRatio', 'propCheck', 'aroundAcross'].includes(f)) expect(probes, `${f} has no classified wrong answers`).toBeGreaterThan(0);
    });
  }
  it('every misconception named in the topic JSON for a sub-goal is diagnosed somewhere in practice or the lesson', () => {
    if (!existsSync(TOPIC) || !mcIds) return;
    const t = JSON.parse(readFileSync(TOPIC, 'utf8')) as { subgoals: { id: string; misconceptions: string[] }[] };
    const seen = new Set<string>();
    for (const [f, sg] of pairs) for (let s = 1; s <= 300; s++) for (const p of PROBES.get(make(f, sg, s) as Item) ?? []) seen.add(p.mc);
    // the lesson parts (page) diagnose these too
    for (const id of ['mc.circles.area-as-radius-based-rectangle', 'mc.area-perimeter.confuses-area-with-perimeter', 'mc.circles.drops-half-in-area-from-circumference', 'mc.circles.diameter-for-radius', 'mc.area-perimeter.area-scales-by-length-factor', 'mc.circles.pi-not-a-fixed-ratio', 'mc.ratio-rate.additive-keep-difference']) seen.add(id);
    const missing = [...new Set(t.subgoals.flatMap(s => s.misconceptions))].filter(m => !seen.has(m));
    // last-practiced-rule is a habit seen across items (interleaving), not one wrong answer
    expect(missing.filter(m => m !== 'mc.angles.last-practiced-rule')).toEqual([]);
  });
});

describe('responses', () => {
  it('accepts any equal form: 49/4, 12 1/4, 12.25 (decimal in the whole box)', () => {
    expect(valueOf({ kind: 'frac', w: 0, n: 49, d: 4 })).toBe(12.25);
    expect(valueOf({ kind: 'frac', w: 12, n: 1, d: 4 })).toBe(12.25);
    expect(valueOf({ kind: 'frac', w: 12.25, n: 0, d: 1 })).toBe(12.25);
    expect(valueOf({ kind: 'num', v: 12.25 })).toBe(12.25);
    expect(valueOf({ kind: 'frac', w: 0, n: 3, d: 0 })).toBeNull();
  });
});

describe('the model', () => {
  it('C = 2 pi r and A = pi r^2, exactly', () => {
    expect(circle(rat(6))).toMatchObject({ C: { p: 12, q: 1 }, A: { p: 36, q: 1 } });
    expect(circle(rat(7, 2))).toMatchObject({ C: { p: 7, q: 1 }, A: { p: 49, q: 4 } });
    expect(circle(rat(6)).Av).toBeCloseTo(113.097, 3);
  });
  it('the wedges keep the area and approach a rectangle pi r long and r tall', () => {
    let last = 0;
    for (const n of [8, 16, 32, 256]) {
      const S = wedgeStrip(n, 100, 0, 0);
      // every angle of the circle is used exactly once: the area is the circle's
      const span = S.pieces.reduce((t, p) => t + (p.a1 - p.a0), 0);
      expect(span).toBeCloseTo(2 * PI, 9);
      expect(S.width).toBeGreaterThan(last);
      expect(S.width).toBeLessThan(PI * 100);
      last = S.width;
    }
    expect(wedgeStrip(256, 100, 0, 0).width).toBeCloseTo(PI * 100, 0);
    expect(wedgeStrip(256, 100, 0, 0).rc).toBeCloseTo(100, 0);
  });
  it('neighbouring wedges share an edge exactly (the shape has no gaps)', () => {
    const S = wedgeStrip(16, 100, 0, 0);
    // the last point of a piece's outline is its right rim point; pieces sit apex to apex
    const ups = S.pieces.filter(p => p.up), downs = S.pieces.filter(p => !p.up);
    for (const d of downs) {
      const P = piecePts(d, 100, d.ax, d.ay, d.rot);
      const leftRim = P[1]!, rightRim = P[P.length - 1]!;
      // the up-wedge apexes sit on this wedge's rim points
      const hits = ups.filter(u => [leftRim, rightRim].some(q => Math.hypot(q[0] - u.ax, q[1] - u.ay) < 1e-6));
      expect(hits.length).toBeGreaterThanOrEqual(1);
    }
  });
  it('segments: a diameter passes the center, a chord does not; a radius ends on the circle', () => {
    expect(throughCenter({ kind: 'diameter', a: 30 })).toBe(true);
    expect(throughCenter({ kind: 'chord', a: 30, b: 210 })).toBe(true);
    expect(throughCenter({ kind: 'chord', a: 30, b: 180 })).toBe(false);
    const [p0, p1] = segEnds({ kind: 'radius', a: 40 }, 0, 0, 10);
    expect(Math.hypot(p1[0] - p0[0], p1[1] - p0[1])).toBeCloseTo(10, 9);
    const [, s1] = segEnds({ kind: 'stub', a: 40, f: 0.5 }, 0, 0, 10);
    expect(Math.hypot(s1[0], s1[1])).toBeCloseTo(5, 9);
  });
  it('the lesson pictures (parts 1-4) lay out readably', () => {
    for (const [name, pic] of Object.entries(LESSON_PICS)) expect(layoutPic(pic, LF).why, name).toBeNull();
  });
});

describe('voice', () => {
  it('every voiced line of the script is in voice/lines.json with the same spoken text, and nothing else is', async () => {
    const { SCRIPT } = await import('../src/lesson/topics/circles/script');
    const lines = JSON.parse(readFileSync('pages/lessons/circles/voice/lines.json', 'utf8')) as Record<string, { text: string }>;
    expect(Object.keys(lines).sort()).toEqual(Object.keys(SCRIPT).sort());
    for (const [id, v] of Object.entries(SCRIPT)) {
      expect(lines[id]!.text, id).toBe(v.s);
      expect(v.s, id).not.toMatch(/[0-9]\/[0-9]|<|×|÷|π|²|≈/);   // read aloud: "pi", "squared", "about"
    }
  });
});
