// lesson-angle-relationships: every family × every sub-goal it serves × 300 seeds; the angle maths and layout; the
// voice lines (script.ts = voice/lines.json).
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { rng, type Item } from '../src/lesson/runtime/item';
import { GENS, PROBES, FAMILY_NAMES, MC, type AngleItem } from '../src/lesson/topics/angle-relationships/items';
import { PLAN } from '../src/lesson/topics/angle-relationships/plan';
import { LINES } from '../src/lesson/topics/angle-relationships/script';
import {
  adjacent, ccw, crossing, drawnSpan, fanFrom, isLine, layoutPic, linearPair, picFits, raysInside, vertical, type Pic,
} from '../src/lesson/topics/angle-relationships/angleMaths';
import { EXAMPLE, PROOF, QUESTION, TURN, proofAt } from '../src/lesson/topics/angle-relationships/figures';

const TOPIC = 'C:/Users/stelt/Claude code foler/math-curriculum-essentials/topics/secondary-t5-22-angle-relationships.json';
const SEEDS = 300;

describe('angle maths', () => {
  it('ccw spans, crossing lines: vertical angles equal, linear pairs add to 180', () => {
    expect(ccw(350, 20)).toBe(30);
    expect(ccw(20, 350)).toBe(330);
    for (const t of [30, 65, 90, 128]) for (const s of [0, 95, 200]) {
      const f = crossing(['A', 'B', 'C', 'D'], s, t);
      const AOB = { a: 'A', b: 'B' }, BOC = { a: 'B', b: 'C' }, COD = { a: 'C', b: 'D' }, DOA = { a: 'D', b: 'A' };
      expect(drawnSpan(f, AOB)).toBeCloseTo(t);
      expect(drawnSpan(f, COD)).toBeCloseTo(t);
      expect(drawnSpan(f, AOB) + drawnSpan(f, BOC)).toBeCloseTo(180);
      expect(drawnSpan(f, AOB) + drawnSpan(f, BOC) + drawnSpan(f, COD) + drawnSpan(f, DOA)).toBeCloseTo(360);
      expect(vertical(f, AOB, COD)).toBe(true);
      expect(vertical(f, AOB, BOC)).toBe(false);
      expect(linearPair(f, AOB, BOC)).toBe(true);
      expect(linearPair(f, AOB, COD)).toBe(false);
      expect(adjacent(f, AOB, BOC)).toBe(true);
      expect(adjacent(f, AOB, COD)).toBe(false);
    }
  });
  it('a linear pair needs a DRAWN line: rays that only look aligned are not one', () => {
    const drawn = fanFrom(['A', 'B', 'C'], 10, [70, 110], { lines: [['A', 'C']] });
    const looks = fanFrom(['A', 'B', 'C'], 10, [70, 110]);
    expect(isLine(drawn, 'A', 'C')).toBe(true);
    expect(linearPair(drawn, { a: 'A', b: 'B' }, { a: 'B', b: 'C' })).toBe(true);
    expect(linearPair(looks, { a: 'A', b: 'B' }, { a: 'B', b: 'C' })).toBe(false);
    expect(raysInside(drawn, 'A', 'C')).toEqual(['B']);
  });
  it('the lesson figures are right and lay out readably', () => {
    for (const p of [QUESTION, EXAMPLE, TURN, PROOF]) expect(picFits(p), JSON.stringify(p.fans[0]!.marks.map(m => m.id))).toBeNull();
    for (let t = 40; t <= 140; t += 5) expect(picFits(proofAt(t)), `proof at ${t}`).toBeNull();
  });
  it('layout keeps every label off every line and inside the frame', () => {
    const p: Pic = { fans: [crossing(['A', 'B', 'C', 'D'], 15, 65)] };
    p.fans[0]!.marks = [{ id: 'a', a: 'A', b: 'B', text: '65°' }, { id: 'b', a: 'B', b: 'C', text: '115°' }, { id: 'c', a: 'C', b: 'D', text: '65°' }, { id: 'd', a: 'D', b: 'A', text: '115°' }];
    const lay = layoutPic(p);
    expect(lay.err).toBeNull();
    for (const ml of lay.fans[0]!.marks) {
      const b = ml.label!.box;
      expect(b.x0).toBeGreaterThan(60); expect(b.x1).toBeLessThan(1000); expect(b.y0).toBeGreaterThan(70); expect(b.y1).toBeLessThan(1010);
    }
  });
});

describe('plan covers the topic', () => {
  it('every sub-goal of the topic JSON, in order, each with a family that exists', () => {
    if (fs.existsSync(TOPIC)) {
      const t = JSON.parse(fs.readFileSync(TOPIC, 'utf8')) as { subgoals: { id: string }[] };
      expect(PLAN.map(p => p.id)).toEqual(t.subgoals.map(s => s.id));
    }
    expect(PLAN.length).toBe(25);
    for (const p of PLAN) { expect(p.families.length).toBeGreaterThan(0); for (const f of p.families) expect(GENS[f as keyof typeof GENS]).toBeTypeOf('function'); }
    for (const f of Object.keys(GENS)) expect(FAMILY_NAMES[f as keyof typeof FAMILY_NAMES]).toBeTruthy();
  });
});

const pairs = PLAN.flatMap(p => p.families.map(f => [f, p.id] as const));
describe.each(pairs)('family %s for sub-goal %s', (fam, sg) => {
  const items: Item[] = [];
  for (let s = 1; s <= SEEDS; s++) items.push(GENS[fam as keyof typeof GENS](rng(s * 7919 + fam.length * 13 + sg.length), s, sg));
  it('the answer passes, the item is well formed, the picture lays out', () => {
    for (const it of items) {
      expect(it.family).toBe(fam === 'mixed' ? 'mixed' : fam);
      const v = it.check(it.answer);
      if (!v.ok) throw new Error(`${it.id} ${it.prompt}: own answer rejected: ${v.say}`);
      expect(it.solution.length).toBeGreaterThan(0);
      const ai = it as AngleItem;
      for (const s of [it.prompt, it.board, it.solution.join(' '), ...(it.choices ?? []), ...ai.givens, ...ai.work]) expect(s, it.id).not.toMatch(/undefined|NaN|Infinity|\[object/);
      expect(picFits(ai.picture), it.id).toBeNull();
      for (const t of [...ai.givens, ...ai.work]) expect(t, it.id).not.toMatch(/(^|[^\\])circ|\t|(^|[^\\])(text|angle)\{?/);
      if (it.input === 'num') { const a = (it.answer as { v: number }).v; expect(Number.isInteger(a), it.id).toBe(true); expect(a, it.id).toBeGreaterThan(0); }
    }
  });
  it('choices are unique with exactly one right; every answer says why', () => {
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
  it('typed answers: the measures in the picture agree with the answer', () => {
    for (const it of items) {
      const ai = it as AngleItem;
      if (it.input !== 'num') continue;
      // the revealed label of the unknown shows the answer (or the angle when x is asked)
      const rev = ai.picture.solve?.reveal ?? [];
      const alts = ai.picture.fans.flatMap(f => f.marks).filter(m => rev.includes(m.id) && m.alt).map(m => m.alt!);
      if (ai.unit === '°' && alts.length) expect(alts.some(a => a === `${(it.answer as { v: number }).v}°`), `${it.id} ${alts}`).toBe(true);
    }
  });
});

describe('misconception coverage', () => {
  it('every catalogued misconception of the topic shows up in some verdict', () => {
    const seen = new Set<string>();
    for (const [fam, sg] of pairs) for (let s = 1; s <= 200; s++) {
      const it = GENS[fam as keyof typeof GENS](rng(s * 31 + 5), s, sg);
      for (const p of PROBES.get(it) ?? []) seen.add(p.mc);
    }
    const missing = Object.values(MC).filter(mc => !seen.has(mc) && mc !== MC.lastRule);
    expect(missing).toEqual([]);
  });
  it('families make many different problems', () => {
    for (const [fam, sg] of pairs) {
      const ids = new Set<string>();
      for (let s = 1; s <= 400; s++) { const it = GENS[fam as keyof typeof GENS](rng(s * 97 + 3), s, sg); ids.add(it.prompt + JSON.stringify((it as AngleItem).picture)); }
      expect(ids.size, `${fam}/${sg}`).toBeGreaterThanOrEqual(40);
    }
  });
});

describe('voice', () => {
  it('lines.json has exactly the script ids, with the spoken text', () => {
    const lines = JSON.parse(fs.readFileSync('pages/lessons/angle-relationships/voice/lines.json', 'utf8')) as Record<string, { text: string }>;
    expect(Object.keys(lines).sort()).toEqual(Object.keys(LINES).sort());
    for (const [id, l] of Object.entries(LINES)) {
      expect(lines[id]!.text, id).toBe(l.say);
      expect(l.say, id).not.toMatch(/<|&|\d\/\d|∠|°|′/);
    }
  });
});
