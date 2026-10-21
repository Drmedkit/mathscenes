// lesson-rotations: every family × every sub-goal it serves × 300 seeds; the turn maths; the voice lines.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { rng, type Item } from '../src/lesson/runtime/item';
import { GENS, PROBES, FAMILY_NAMES, MC, type TurnItem } from '../src/lesson/topics/rotations/items';
import { PLAN } from '../src/lesson/topics/rotations/plan';
import { LINES } from '../src/lesson/topics/rotations/script';
import {
  checkTurn, d2, type Fig, moveFig, orient, picFits, reflect, rotQ, sameSet, shape, turnDir, type V,
} from '../src/lesson/topics/rotations/turnMaths';

const TOPIC = 'C:/Users/stelt/Claude code foler/math-curriculum-essentials/topics/primary.geometry.rotate-quarter-half-turns.json';
const SEEDS = 300;

describe('turn maths', () => {
  it('quarter turns: 2 right 1 up -> 1 right 2 down (clockwise), 2 left 1 down (half)', () => {
    expect(rotQ([2, 1], [0, 0], -1)).toEqual([1, -2]);
    expect(rotQ([2, 1], [0, 0], 2)).toEqual([-2, -1]);
    expect(rotQ([3, 0], [0, 0], -1)).toEqual([0, -3]);
    expect(rotQ([2, 1], [0, 0], 1)).toEqual([-1, 2]);
    expect(rotQ([5, 4], [3, 3], -1)).toEqual([4, 1]);
  });
  it('two quarter turns are a half turn, four are a full turn, half turns either way agree', () => {
    for (let x = -4; x <= 4; x++) for (let y = -4; y <= 4; y++) {
      const p: V = [x, y], c: V = [1, -1];
      expect(rotQ(rotQ(p, c, -1), c, -1)).toEqual(rotQ(p, c, -2));
      expect(rotQ(p, c, 2)).toEqual(rotQ(p, c, -2));
      expect(rotQ(p, c, 4)).toEqual(p);
      expect(d2(rotQ(p, c, 1), c)).toBe(d2(p, c));
    }
  });
  it('a turn keeps the corner order, a flip reverses it; checkTurn guards the image', () => {
    for (const nm of ['L', 'F', 'tri', 'flag'] as const) {
      const f = shape(nm);
      const [A, B, C] = f.marks;
      expect(orient(A!.p, B!.p, C!.p)).toBe(-1);   // A -> B -> C clockwise by construction
      for (const q of [-1, 1, 2]) {
        const g = moveFig({ kind: 'turn', c: [2, -1], q }, f);
        expect(() => checkTurn(f, g, [2, -1], q)).not.toThrow();
        expect(orient(g.marks[0]!.p, g.marks[1]!.p, g.marks[2]!.p)).toBe(-1);
      }
      const m = moveFig({ kind: 'flip', line: { kind: 'v', x: 4 } }, f);
      expect(orient(m.marks[0]!.p, m.marks[1]!.p, m.marks[2]!.p)).toBe(1);
      const bad: Fig = { ...moveFig({ kind: 'turn', c: [0, 0], q: -1 }, f) };
      expect(() => checkTurn(f, bad, [0, 0], 1)).toThrow();
    }
    expect(reflect([3, 1], { kind: 'd', p: [0, 0], s: 1 })).toEqual([1, 3]);
    expect(reflect([3, 1], { kind: 'd', p: [0, 0], s: -1 })).toEqual([-1, -3]);
  });
  it('pointer directions: up + quarter clockwise = right; down + quarter clockwise = left', () => {
    expect(turnDir(0, -1)).toBe(2);
    expect(turnDir(4, -1)).toBe(6);
    expect(turnDir(1, 2)).toBe(5);
    expect(turnDir(6, 1)).toBe(4);
  });
  it('symmetric figures: H and the rectangle match by half turn and both flips, Z by half turn only', () => {
    const H = shape('H'), Z = shape('Z');
    expect(sameSet(moveFig({ kind: 'turn', c: [1.5, 1.5], q: 2 }, H).pts, H.pts)).toBe(true);
    expect(sameSet(moveFig({ kind: 'turn', c: [1.5, 1.5], q: 1 }, H).pts, H.pts)).toBe(false);
    expect(sameSet(moveFig({ kind: 'flip', line: { kind: 'v', x: 1.5 } }, H).pts, H.pts)).toBe(true);
    expect(sameSet(moveFig({ kind: 'turn', c: [1.5, 1], q: 2 }, Z).pts, Z.pts)).toBe(true);
    expect(sameSet(moveFig({ kind: 'flip', line: { kind: 'v', x: 1.5 } }, Z).pts, Z.pts)).toBe(false);
  });
});

describe('plan covers the topic', () => {
  it('every sub-goal of the topic JSON, in order, each with a family that exists', () => {
    if (fs.existsSync(TOPIC)) {
      const t = JSON.parse(fs.readFileSync(TOPIC, 'utf8')) as { subgoals: { id: string }[] };
      expect(PLAN.map(p => p.id)).toEqual(t.subgoals.map(s => s.id));
    }
    expect(PLAN.length).toBe(22);
    for (const p of PLAN) { expect(p.families.length).toBeGreaterThan(0); for (const f of p.families) expect(GENS[f as keyof typeof GENS]).toBeTypeOf('function'); }
    for (const f of Object.keys(GENS)) expect(FAMILY_NAMES[f as keyof typeof FAMILY_NAMES]).toBeTruthy();
  });
});

const pairs = PLAN.flatMap(p => p.families.map(f => [f, p.id] as const));
describe.each(pairs)('family %s for sub-goal %s', (fam, sg) => {
  const items: Item[] = [];
  for (let s = 1; s <= SEEDS; s++) items.push(GENS[fam as keyof typeof GENS](rng(s * 7919 + fam.length * 13 + sg.length), s, sg));
  it('the answer passes, the item is well formed, the picture is drawable', () => {
    for (const it of items) {
      expect(it.family).toBe(fam);
      const v = it.check(it.answer);
      if (!v.ok) throw new Error(`${it.id} ${it.prompt}: own answer rejected: ${v.say}`);
      expect(it.solution.length).toBeGreaterThan(0);
      for (const s of [it.prompt, it.board, it.solution.join(' '), ...(it.choices ?? [])]) expect(s, it.id).not.toMatch(/undefined|NaN|Infinity|\[object/);
      const why = picFits((it as TurnItem).picture);
      expect(why, it.id).toBeNull();
    }
  });
  it('choices are unique with exactly one right; every wrong answer says why', () => {
    for (const it of items) {
      if (it.input !== 'choice') continue;
      const ch = it.choices ?? [];
      expect(ch.length).toBeGreaterThanOrEqual(3);
      expect(new Set(ch).size, it.prompt).toBe(ch.length);
      const vs = ch.map((_, i) => it.check({ kind: 'choice', i }));
      expect(vs.filter(v => v.ok).length, it.prompt).toBe(1);
      for (const v of vs) expect(v.say.length).toBeGreaterThan(8);
    }
  });
  it('the main misconceptions are classified', () => {
    for (const it of items) for (const p of PROBES.get(it) ?? []) {
      const v = it.check(p.r);
      expect(v.ok, `${it.id} ${JSON.stringify(p.r)}`).toBe(false);
      expect(v.mc, `${it.id} ${it.prompt} ${JSON.stringify(p.r)}`).toBe(p.mc);
    }
  });
  it('dots and pictures: the right one is where the maths says', () => {
    for (const it of items) {
      const pic = (it as TurnItem).picture;
      if (pic.kind !== 'grid' || !pic.solve) continue;
      const s = pic.solve;
      if (s.motion.kind === 'turn' && s.to && pic.start && s.to.marks.length >= 3) checkTurn(pic.start, s.to, s.motion.c, s.motion.q);
      if (pic.dots && it.input === 'choice' && s.point) {
        const right = (it.answer as { i: number }).i;
        const label = it.choices![right]!.slice(-1);
        const dot = pic.dots.find(d => d.label === label)!;
        expect(dot.p, it.id).toEqual(s.point);
      }
      if (pic.cands && it.input === 'choice' && s.to) {
        const right = (it.answer as { i: number }).i;
        const label = it.choices![right]!.slice(-1);
        const c = pic.cands.find(d => d.label === label)!;
        expect(sameSet(c.fig.pts, s.to.pts), it.id).toBe(true);
        for (const o of pic.cands) if (o !== c) expect(sameSet(o.fig.pts, s.to.pts), it.id).toBe(false);
      }
    }
  });
});

describe('misconception coverage', () => {
  it('every main catalogue misconception of the topic shows up in some verdict', () => {
    const seen = new Set<string>();
    for (const [fam, sg] of pairs) for (let s = 1; s <= 150; s++) {
      const it = GENS[fam as keyof typeof GENS](rng(s * 31 + 5), s, sg);
      for (const p of PROBES.get(it) ?? []) seen.add(p.mc);
    }
    for (const mc of Object.values(MC)) expect(seen, mc).toContain(mc);
  });
  it('families make many different problems', () => {
    for (const [fam, sg] of pairs) {
      const ids = new Set<string>();
      for (let s = 1; s <= 400; s++) { const it = GENS[fam as keyof typeof GENS](rng(s * 97 + 3), s, sg); ids.add(it.prompt + JSON.stringify((it as TurnItem).picture)); }
      expect(ids.size, `${fam}/${sg}`).toBeGreaterThanOrEqual(fam === 'square' ? 12 : 30);
    }
  });
});

describe('voice', () => {
  it('lines.json has exactly the script ids, with the spoken text', () => {
    const lines = JSON.parse(fs.readFileSync('pages/lessons/rotations/voice/lines.json', 'utf8')) as Record<string, { text: string }>;
    expect(Object.keys(lines).sort()).toEqual(Object.keys(LINES).sort());
    for (const [id, l] of Object.entries(LINES)) {
      expect(lines[id]!.text, id).toBe(l.say);
      expect(l.say, id).not.toMatch(/<|&|\d\/\d|′/);
    }
  });
});
