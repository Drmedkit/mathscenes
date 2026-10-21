// lesson-cross-sections: every family x every sub-goal it serves x 300 seeds; the section maths; the pictures can be
// laid out; the voice script and its spoken lines agree.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { rng, type Item } from '../src/lesson/runtime/item';
import { GENS, PROBES, FAMILY_NAMES, MC, findPlane, type SlicePicture } from '../src/lesson/topics/cross-sections/items';
import { PLAN } from '../src/lesson/topics/cross-sections/plan';
import { SCRIPT } from '../src/lesson/topics/cross-sections/script';
import {
  type SolidSpec, faceCount, planeAxis, planeThrough, planeUpright, sectionOf, shapeOf, pieceOf, solidFaces, sheetOf, len, sub,
} from '../src/lesson/topics/cross-sections/sliceMaths';
import { Slicer } from '../src/lesson/topics/cross-sections/Slicer';
import { frame } from '../src/blocks/block';
import { dusk } from '../src/lesson/dusk';

// the block measures words with a canvas; in node it falls back to an estimate
(globalThis as unknown as { document: unknown }).document ??= { createElement: () => ({ getContext: () => null }) };

const TOPIC = 'C:/Users/stelt/Claude code foler/math-curriculum-essentials/topics/secondary-t5-23-cross-sections-and-composite-area-volume.json';
const SEEDS = 300;
const MF = frame(40, 80, 1110, 920);   // the page's model frame

describe('plan covers the topic', () => {
  it('every sub-goal of the topic JSON, in order, each with a family that exists', () => {
    if (fs.existsSync(TOPIC)) {
      const t = JSON.parse(fs.readFileSync(TOPIC, 'utf8')) as { subgoals: { id: string }[] };
      expect(PLAN.map(p => p.id)).toEqual(t.subgoals.map(s => s.id));
    }
    expect(PLAN.length).toBe(6);
    for (const p of PLAN) { expect(p.families.length).toBeGreaterThan(0); for (const f of p.families) expect(GENS[f]).toBeTypeOf('function'); }
    for (const f of Object.keys(GENS)) expect(FAMILY_NAMES[f as keyof typeof FAMILY_NAMES]).toBeTruthy();
  });
});

const pairs = PLAN.flatMap(p => p.families.map(f => [f, p.id] as const));
describe.each(pairs)('family %s for sub-goal %s', (fam, sg) => {
  const items: Item[] = [];
  for (let s = 1; s <= SEEDS; s++) items.push(GENS[fam](rng(s * 7919 + fam.length), s, sg));
  it('the answer passes, the item is well formed', () => {
    for (const it of items) {
      expect(it.family).toBe(fam);
      const v = it.check(it.answer);
      if (!v.ok) throw new Error(`${it.id} ${it.prompt}: own answer rejected: ${v.say}`);
      expect(it.solution.length).toBeGreaterThan(0);
      for (const s of [it.prompt, it.board, it.solution.join(' '), ...(it.choices ?? [])]) expect(s, it.id).not.toMatch(/undefined|NaN|Infinity/);
    }
  });
  it('choices are unique with exactly one right', () => {
    for (const it of items) {
      if (it.input !== 'choice') continue;
      const ch = it.choices ?? [];
      expect(ch.length).toBeGreaterThanOrEqual(3);
      expect(new Set(ch).size, it.prompt).toBe(ch.length);
      const right = ch.map((_, i) => it.check({ kind: 'choice', i }).ok).filter(Boolean).length;
      expect(right, it.prompt).toBe(1);
    }
  });
  it('the main misconceptions are classified', () => {
    for (const it of items) for (const p of PROBES.get(it) ?? []) {
      const v = it.check(p.r);
      expect(v.ok, `${it.id} ${JSON.stringify(p.r)}`).toBe(false);
      expect(v.mc, `${it.id} ${it.prompt} ${JSON.stringify(p.r)}`).toBe(p.mc);
    }
  });
  it('every picture can be laid out and read (labels off the lines, section drawn)', () => {
    for (const it of items.slice(0, 120)) {
      const pic = it.picture as unknown as SlicePicture;
      expect(pic?.kind).toBe('slice');
      const m = Slicer({ solid: pic.solid, pose: pic.pose, unit: pic.unit, planes: pic.planes, planeNames: pic.planeNames, dims: pic.dims, points: pic.points, sideLabels: pic.sideLabels }, MF, dusk);
      expect(Math.max(m.where.solid.w, m.where.solid.h), it.id).toBeGreaterThan(420);
      for (const P of pic.planes) expect(['polygon', 'point'], it.id).toContain(sectionOf(pic.solid, P).kind);
    }
  });
});

describe('misconception coverage', () => {
  it('every catalogue misconception of the topic shows up in some verdict or probe', () => {
    const seen = new Set<string>();
    for (const [fam, sg] of pairs) for (let s = 1; s <= 150; s++) {
      const it = GENS[fam](rng(s * 31 + 5), s, sg);
      for (const p of PROBES.get(it) ?? []) seen.add(p.mc);
      if (it.input === 'choice') (it.choices ?? []).forEach((_, i) => { const v = it.check({ kind: 'choice', i }); if (v.mc) seen.add(v.mc); });
    }
    for (const mc of Object.values(MC)) expect(seen.has(mc), mc).toBe(true);
  });
  it('many distinct items per family', () => {
    for (const fam of Object.keys(GENS) as (keyof typeof GENS)[]) {
      const sgs = PLAN.filter(p => p.families.includes(fam)).map(p => p.id);
      const ids = new Set<string>();
      for (let s = 1; s <= 2000; s++) { const it = GENS[fam](rng(s), s, sgs[s % sgs.length]); ids.add(it.prompt + JSON.stringify((it.picture as unknown as SlicePicture).planes)); }
      expect(ids.size, fam).toBeGreaterThanOrEqual(40);
    }
  });
});

describe('the section maths', () => {
  const box: SolidSpec = { kind: 'box', l: 6, w: 4, h: 3 };
  const pyr: SolidSpec = { kind: 'pyramid', l: 6, w: 4, h: 4 };
  const cube: SolidSpec = { kind: 'box', l: 4, w: 4, h: 4 };
  it('a box cut parallel to a face is congruent to that face', () => {
    for (const [axis, at, a, b] of [[0, 4, 4, 3], [1, 1, 6, 3], [2, 2, 6, 4]] as const) {
      const s = sectionOf(box, planeAxis(axis, at)), sh = shapeOf(s.pts);
      expect(sh.name).toBe('rectangle');
      expect(s.crossed.length).toBe(4);
      expect(sh.lengths.map(x => Math.round(x * 1e6) / 1e6).sort()).toEqual([a, a, b, b].sort());
    }
    expect(shapeOf(sectionOf(cube, planeAxis(2, 1)).pts).name).toBe('square');
  });
  it('the cheese of the lesson: a 4 in by 3 in rectangle, traced over top, front, bottom and back', () => {
    const s = sectionOf(box, planeAxis(0, 4));
    expect([...s.sideFaces].sort()).toEqual(['back', 'bottom', 'front', 'top']);
  });
  it('parallel pyramid slices shrink to a point; halfway is half', () => {
    let prev = Infinity;
    for (const t of [0.25, 0.5, 0.75]) {
      const sh = shapeOf(sectionOf(pyr, planeAxis(2, t * 4)).pts);
      expect(sh.name).toBe('rectangle');
      const area = sh.lengths[0]! * sh.lengths[1]!;
      expect(area).toBeLessThan(prev); prev = area;
      expect(Math.max(...sh.lengths)).toBeCloseTo(6 * (1 - t), 9);
    }
    expect(sectionOf(pyr, planeAxis(2, 4)).kind).toBe('point');
  });
  it('perpendicular pyramid slices: triangle through the apex, isosceles trapezoid when it misses', () => {
    expect(shapeOf(sectionOf(pyr, planeAxis(0, 3)).pts).name).toBe('triangle');
    expect(shapeOf(sectionOf(pyr, planeUpright([0, 0, 0], [6, 4, 0])).pts).name).toBe('triangle');
    const tz = sectionOf(pyr, planeAxis(0, 1.5)), sh = shapeOf(tz.pts);
    expect(sh.name).toBe('trapezoid'); expect(sh.isoTrapezoid).toBe(true);
    expect(tz.crossed.length).toBe(4);
    expect(Math.max(...sh.lengths)).toBeCloseTo(4, 9);
    // the corner cut of the base: a triangle that misses the apex (the extension case)
    expect(shapeOf(sectionOf(pyr, planeUpright([4.5, 0, 0], [6, 1.5, 0])).pts).name).toBe('triangle');
  });
  it('oblique cube sections: equilateral corner cut, regular hexagon through six midpoints', () => {
    const tri = shapeOf(sectionOf(cube, planeThrough([2, 0, 4], [4, 2, 4], [4, 0, 2])).pts);
    expect(tri.name).toBe('triangle'); expect(tri.equalSides).toBe(true);
    const sc = shapeOf(sectionOf(cube, planeThrough([3, 0, 4], [4, 2, 4], [4, 0, 2])).pts);
    expect(sc.equalSides).toBe(false);
    const hex = sectionOf(cube, planeThrough([4, 2, 0], [2, 0, 0], [0, 0, 2]));
    expect(hex.pts.length).toBe(6); expect(shapeOf(hex.pts).regular).toBe(true); expect(hex.crossed.length).toBe(6);
  });
  it('the slanted cut through two opposite edges is a rectangle with a long side', () => {
    const s = sectionOf(box, planeThrough([0, 0, 3], [6, 0, 3], [0, 4, 0]));
    expect(s.containsEdge).toBe(true);
    const sh = shapeOf(s.pts);
    expect(sh.name).toBe('rectangle');
    expect(Math.max(...sh.lengths.filter(x => Math.abs(x - 6) > 1e-9))).toBeCloseTo(5, 9);
  });
  it('one side per face crossed: sides never outnumber faces (many random planes)', () => {
    const R = rng(4);
    for (const S of [box, cube, pyr]) for (let i = 0; i < 3000; i++) {
      const P = planeThrough([R() * S.l, R() * S.w, R() * S.h], [R() * S.l, R() * S.w, R() * S.h], [R() * S.l, R() * S.w, R() * S.h]);
      const s = sectionOf(S, P);
      if (s.kind !== 'polygon' || s.throughVertex) continue;
      expect(s.pts.length).toBe(s.crossed.length);
      expect(s.pts.length).toBeLessThanOrEqual(faceCount(S));
      expect(s.pts.length).toBeGreaterThanOrEqual(3);
    }
  });
  it('every possible side count has a real cut; the pieces close up', () => {
    for (const S of [box, cube]) for (const k of [3, 4, 5, 6]) expect(findPlane(S, k), `box ${k}`).not.toBeNull();
    for (const k of [3, 4, 5]) expect(findPlane(pyr, k), `pyramid ${k}`).not.toBeNull();
    expect(findPlane(pyr, 6)).toBeNull();
    const P = planeAxis(0, 4);
    const a = pieceOf(solidFaces(box), P, 1), b = pieceOf(solidFaces(box), P, -1);
    expect(a.some(f => f.name === 'cap')).toBe(true); expect(b.some(f => f.name === 'cap')).toBe(true);
    expect(sheetOf(box, P).length).toBe(4);
    void len; void sub;
  });
});

describe('voice', () => {
  it('every scripted panel line has a spoken text and vice versa', () => {
    const lines = JSON.parse(fs.readFileSync('pages/lessons/cross-sections/voice/lines.json', 'utf8')) as Record<string, { text: string }>;
    expect(Object.keys(lines).sort()).toEqual(Object.keys(SCRIPT).sort());
    for (const [id, l] of Object.entries(lines)) {
      expect(l.text.length, id).toBeGreaterThan(3);
      expect(l.text, id).not.toMatch(/\d\s*\/\s*\d|[<>×÷]/);
    }
  });
});
