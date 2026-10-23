// lesson-reflections: every family x every sub-goal it serves x 300 seeds (the answer passes, choices unique with
// exactly one right, the main misconceptions classified, the picture drawable); the plan covers every sub-goal of
// the topic JSON in order; the reflection maths holds for every kind of line; the voice script matches lines.json.
import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { rng, type Item } from '../src/lesson/runtime/item';
import { GENS, FAMILY_NAMES, PROBES, type RefItem } from '../src/lesson/topics/reflections/items';
import { PLAN } from '../src/lesson/topics/reflections/plan';
import { LINES } from '../src/lesson/topics/reflections/script';
import {
  aLine, checkReflection, dLine, foot, hLine, lineInSheet, oLine, offset, onLine, orientation, picFits, reflect, reflectAll, stepsTo, vLine, type MLine, type Pt,
} from '../src/lesson/topics/reflections/mirrorMaths';

const TOPIC = 'C:/Users/stelt/Claude code foler/math-curriculum-essentials/topics/primary.geometry.reflect-2d-shapes.json';
const MCS = 'C:/Users/stelt/Claude code foler/math-curriculum-essentials/misconceptions.json';
const SEEDS = 300;
const catalog = existsSync(MCS) ? (JSON.parse(readFileSync(MCS, 'utf8')) as { misconceptions: { id: string; used_by?: string[] }[] }).misconceptions : null;
const mcIds = catalog ? new Set(catalog.map(m => m.id)) : null;

describe('plan', () => {
  it('covers every sub-goal of the topic JSON, in order, each with families that exist', () => {
    if (existsSync(TOPIC)) {
      const t = JSON.parse(readFileSync(TOPIC, 'utf8')) as { subgoals: { id: string; order: number }[] };
      expect(PLAN.map(p => p.id)).toEqual([...t.subgoals].sort((a, b) => a.order - b.order).map(s => s.id));
    }
    expect(PLAN.length).toBe(23);
    for (const p of PLAN) {
      expect(p.families.length).toBeGreaterThan(0);
      for (const f of p.families) { expect(GENS[f as keyof typeof GENS], f).toBeTypeOf('function'); expect(FAMILY_NAMES[f], f).toBeTruthy(); }
    }
    for (const f of Object.keys(GENS)) expect(PLAN.some(p => p.families.includes(f)), `${f} is in the plan`).toBe(true);
  });
});

const pairs = PLAN.flatMap(p => p.families.map(f => [f, p.id] as const));
const make = (f: string, sg: string, s: number): RefItem => GENS[f as keyof typeof GENS](rng(s * 7919 + f.length * 31 + sg.length), s, sg);

describe.each(pairs)('family %s for sub-goal %s', (fam, sg) => {
  const items: RefItem[] = [];
  for (let s = 1; s <= SEEDS; s++) items.push(make(fam, sg, s));
  it('the answer passes and the item is well formed', () => {
    for (const it of items) {
      expect(it.family).toBe(fam);
      const v = it.check(it.answer);
      if (!v.ok) throw new Error(`${it.id} ${it.prompt}: own answer rejected: ${v.say}`);
      expect(it.solution.length).toBeGreaterThan(0);
      for (const s of [it.prompt, it.board, it.solution.join(' '), ...(it.choices ?? []), v.say]) expect(s, it.id).not.toMatch(/undefined|NaN|Infinity|\[object/);
    }
  });
  it('the picture can be drawn', () => {
    for (const it of items) expect(picFits(it.pic), `${it.id} ${it.prompt}`).toBeNull();
  });
  it('choices are unique with exactly one right, and every wrong one says why', () => {
    for (const it of items) {
      if (it.input !== 'choice') continue;
      const ch = it.choices ?? [];
      expect(ch.length).toBeGreaterThanOrEqual(3);
      expect(new Set(ch).size, it.prompt).toBe(ch.length);
      const vs = ch.map((_, i) => it.check({ kind: 'choice', i }));
      expect(vs.filter(v => v.ok).length, it.prompt).toBe(1);
      for (const v of vs) expect(v.say.length, `${it.id}: empty feedback`).toBeGreaterThan(8);
      for (const v of vs) if (v.mc && mcIds) expect(mcIds.has(v.mc), v.mc).toBe(true);
      // a spot answer: the right spot is the true image when the item reflects one point
      const sp = it.pic.spots, sol = it.pic.solve;
      if (sp && sol?.spot !== undefined && it.pic.line && sol.pts.length === 1 && fam !== 'perp') {
        const right = sp.find(s => s.n === sol.spot)!;
        const img = reflect(sol.pts[0]!.from, it.pic.line);
        expect(Math.hypot(right.at[0] - img[0], right.at[1] - img[1]), `${it.id} right spot is the image`).toBeLessThan(1e-6);
      }
    }
  });
  it('the main misconceptions are classified', () => {
    for (const it of items) for (const p of PROBES.get(it) ?? []) {
      const v = it.check(p.r);
      expect(v.ok, `${it.id} ${JSON.stringify(p.r)}`).toBe(false);
      expect(v.mc, `${it.id} ${it.prompt} ${JSON.stringify(p.r)}`).toBe(p.mc);
      if (mcIds) expect(mcIds.has(p.mc), p.mc).toBe(true);
    }
  });
});

describe('variety and coverage', () => {
  it('many distinct items per family', () => {
    for (const fam of Object.keys(GENS)) {
      const sgs = PLAN.filter(p => p.families.includes(fam)).map(p => p.id);
      const ids = new Set<string>();
      for (let s = 1; s <= 1500; s++) { const it = make(fam, sgs[s % sgs.length]!, s); ids.add(it.prompt + JSON.stringify(it.pic)); }
      expect(ids.size, fam).toBeGreaterThanOrEqual(40);
    }
  });
  it('every misconception of the topic shows up in some verdict or probe', () => {
    const seen = new Set<string>();
    for (const [fam, sg] of pairs) for (let s = 1; s <= 150; s++) {
      const it: Item = make(fam, sg, s);
      for (const p of PROBES.get(it) ?? []) seen.add(p.mc);
      if (it.input === 'choice') (it.choices ?? []).forEach((_, i) => { const v = it.check({ kind: 'choice', i }); if (v.mc) seen.add(v.mc); });
    }
    const topicMcs = catalog ? catalog.filter(m => (m.used_by ?? []).some(u => String(u).includes('reflect-2d-shapes'))).map(m => m.id) : [];
    for (const mc of topicMcs) expect(seen.has(mc), mc).toBe(true);
  });
});

describe('the reflection maths', () => {
  const lines: MLine[] = [vLine(3), vLine(5.5), hLine(2), hLine(4.5), dLine(0), dLine(-2), dLine(3), aLine(6), aLine(9), aLine(4)];
  it('PP′ is perpendicular to the line and bisected by it; points on the line stay; twice gives P back', () => {
    for (const L of lines) for (let x = -1; x <= 10; x += 0.5) for (let y = -1; y <= 10; y += 0.5) {
      const P: Pt = [x, y];
      const r = checkReflection(P, L);
      expect(reflect(r.image, L)).toEqual(P);
      if (onLine(P, L)) expect(r.image).toEqual(P);
      expect(Math.abs(offset(r.image, L))).toBe(Math.abs(offset(P, L)));
    }
    for (let k = 0; k < 200; k++) {
      const L = oLine([3 + (k % 7) * 0.3, 2 + (k % 5) * 0.4], 7 + k * 1.7);
      const P: Pt = [(k * 37) % 11, (k * 53) % 9];
      checkReflection(P, L);
    }
  });
  it('the grid counts: squares for v/h, whole and small diagonal steps for 45° lines', () => {
    expect(stepsTo([1, 4], vLine(5)).squares).toBe(4);
    expect(stepsTo([9, 7], aLine(12))).toEqual({ squares: 4, whole: 2, small: 4 });
    expect(stepsTo([2, 5], dLine(0))).toEqual({ squares: 3, whole: null, small: 3 });
    expect(foot([2, 5], dLine(0))).toEqual([3.5, 3.5]);   // a cell centre
    expect(reflect([9, 7], aLine(12))).toEqual([5, 3]);
  });
  it('a reflection reverses the vertex order', () => {
    const T: Pt[] = [[1, 1], [4, 2], [2, 5]];
    for (const L of lines) expect(orientation(reflectAll(T, L))).not.toBe(orientation(T));
  });
  it('clips lines to the sheet', () => {
    expect(lineInSheet(vLine(4), 10, 8)).toEqual([[4, 0], [4, 8]]);
    expect(lineInSheet(vLine(12), 10, 8)).toBeNull();
    const s = lineInSheet(dLine(0), 10, 8)!;
    expect(s[0][0]).toBeCloseTo(0); expect(s[1][0]).toBeCloseTo(8);
  });
});

describe('voice', () => {
  it('every scripted panel line has a spoken text, and vice versa', () => {
    const lines = JSON.parse(readFileSync('pages/lessons/reflections/voice/lines.json', 'utf8')) as Record<string, { text: string }>;
    expect(Object.keys(lines).sort()).toEqual(Object.keys(LINES).sort());
    for (const [id, l] of Object.entries(lines)) {
      expect(l.text, id).toBe(LINES[id]!.say);
      expect(l.text.length, id).toBeGreaterThan(3);
      expect(l.text, id).not.toMatch(/[<>×÷′⊥]|\d\s*\/\s*\d|'(?=\s|$)/);
    }
  });
});

describe('quality layer (docs/lessons/QUALITY_LAYER.md)', () => {
  it('regression (oracle sweep): verify has one true "No" (a Q on P\'s side, or P on m, was also "not as far from m as P")', () => {
    for (let s = 1; s <= 600; s++) {
      const it = GENS.verify!(rng(s), s, 'verify-point-pair');
      const right = it.choices![(it.answer as { i: number }).i]!;
      if (/same side|P is on m/.test(right)) expect(it.choices, it.choices!.join(' | ')).not.toContain('No: Q is not as far from m as P');
    }
  });
  it('the counting items end on the number asked (apart, or from P to m)', () => {
    for (let s = 1; s <= 200; s++) {
      const it = GENS.stepsNum!(rng(s), s, 'grid-point-reflect');
      const m = it.solution.at(-1)!.match(/<b class="s">(\d+)/)!;
      expect(Number(m[1]), it.prompt).toBe((it.answer as { v: number }).v);
    }
  });
});
