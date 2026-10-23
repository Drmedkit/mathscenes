// lesson-congruence: every family × every sub-goal it serves × 300 seeds; the congruence maths; the voice lines.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { rng, type Item } from '../src/lesson/runtime/item';
import { GENS, PROBES, FAMILY_NAMES, MC, type CongItem } from '../src/lesson/topics/congruence/items';
import { PLAN } from '../src/lesson/topics/congruence/plan';
import { LINES, toSay } from '../src/lesson/topics/congruence/script';
import {
  checkCongruence, congruentSets, dil, flipX, flipY, inverseSeq, isRigid, mapPts, mapsOnto, mv, orient, picFits, ruleOf,
  runSeq, sameLens, sameMap, seqAt, slide, symmetric, turn, type V,
} from '../src/lesson/topics/congruence/congMaths';

const TOPIC = 'C:/Users/stelt/Claude code foler/math-curriculum-essentials/topics/secondary-t5-35-congruence-via-transformations.json';
const SEEDS = 300;

describe('congruence maths', () => {
  const T: V[] = [[-6, 2], [-2, 2], [-6, 5]];
  it('the worked example: a flip over the y-axis, then a slide 6 down, maps ABC onto DEF corner by corner', () => {
    const DEF: V[] = [[6, -4], [2, -4], [6, -1]];
    expect(() => checkCongruence(T, DEF, [flipY, slide(0, -6)])).not.toThrow();
    expect(orient(T)).toBe(1);
    expect(orient(DEF)).toBe(-1);
    expect(() => checkCongruence(T, DEF, [slide(12, -6)])).toThrow();
    // the near-miss tile of part 1 is not congruent to the template
    expect(congruentSets(T, [[1, 2], [6, 2], [1, 5]])).toBe(false);
  });
  it('your turn: a quarter turn counterclockwise about O, then a slide 2 right, 5 down', () => {
    expect(mapPts([turn(1), slide(2, -5)], [[1, 1], [4, 1], [2, 4]])).toEqual([[1, -4], [1, -1], [-2, -3]]);
    expect(mv(turn(1), [1, 1])).toEqual([-1, 1]);
  });
  it('rules: axis flips, turns about the origin, dilations', () => {
    expect(mv(flipX, [3, 2])).toEqual([3, -2]);
    expect(mv(flipY, [3, 2])).toEqual([-3, 2]);
    expect(mv(turn(1), [3, 2])).toEqual([-2, 3]);
    expect(mv(turn(-1), [3, 2])).toEqual([2, -3]);
    expect(mv(turn(2), [3, 2])).toEqual([-3, -2]);
    expect(mv(dil(2), [3, 2])).toEqual([6, 4]);
    expect(ruleOf(turn(1))).toEqual(['-y', 'x']);
    expect(ruleOf(flipX)).toEqual(['x', '-y']);
    expect(isRigid(dil(1))).toBe(true);
    expect(isRigid(dil(2))).toBe(false);
  });
  it('order: a slide across the mirror line does not commute with the flip; one along it does', () => {
    const P: V[] = [[1, 1], [3, 1], [1, 2]];
    expect(sameMap(mapPts([slide(4, 0), flipY], P), mapPts([flipY, slide(4, 0)], P))).toBe(false);
    expect(sameMap(mapPts([slide(0, 3), flipY], P), mapPts([flipY, slide(0, 3)], P))).toBe(true);
    expect(sameMap(mapPts([turn(2)], P), mapPts([flipX, flipY], P))).toBe(true);
  });
  it('undo: reverse the order and invert every step', () => {
    const P: V[] = [[1, 1], [3, 1], [1, 2]];
    for (const s of [[slide(3, -2), turn(1)], [flipX, slide(2, 4)], [turn(-1), slide(-1, 5)]]) {
      const B = mapPts(s, P);
      expect(mapsOnto(inverseSeq(s), B, P)).toBe(true);
    }
  });
  it('a dilation by k changes every length by k; side collections tell congruence apart', () => {
    const P: V[] = [[0, 0], [2, 0], [0, 1]];
    expect(sameLens(P, mapPts([dil(2)], P))).toBe(false);
    expect(sameLens(P, mapPts([flipX, slide(1, 1)], P))).toBe(true);
    expect(symmetric([[0, 0], [2, 0], [2, 2], [0, 2]])).toBe(true);
    expect(symmetric([[0, 0], [4, 0], [3, 2]])).toBe(false);
  });
  it('sequences run step by step (in-between positions)', () => {
    const s = [slide(2, 0), turn(1)];
    expect(seqAt(s, [1, 0], 1)).toEqual([3, 0]);
    expect(seqAt(s, [1, 0], 2)).toEqual(runSeq(s, [1, 0]));
  });
});

describe('plan covers the topic', () => {
  it('every sub-goal of the topic JSON, in order, each with a family that exists', () => {
    if (fs.existsSync(TOPIC)) {
      const t = JSON.parse(fs.readFileSync(TOPIC, 'utf8')) as { subgoals: { id: string }[] };
      expect(PLAN.map(p => p.id)).toEqual(t.subgoals.map(s => s.id));
    }
    expect(PLAN.length).toBe(18);
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
      expect(picFits((it as CongItem).picture), it.id).toBeNull();
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
  it('the solution picture tells the truth: a sequence that is said to work maps every corner onto its partner', () => {
    for (const it of items) {
      const pic = (it as CongItem).picture;
      const s = pic.solve;
      if (!s || s.to === undefined || s.miss) continue;
      const F = pic.figs[s.fig]!.pts, T = pic.figs[s.to]!.pts;
      const end = mapPts(s.seq, F);
      if (s.seq.every(isRigid)) expect(congruentSets(end, T) || end.every(p => T.some(q => q[0] === p[0] && q[1] === p[1])), it.id).toBe(true);
      else expect(end.every(p => T.some(q => Math.abs(q[0] - p[0]) < 1e-9 && Math.abs(q[1] - p[1]) < 1e-9)), it.id).toBe(true);
      if (s.also && it.family === 'twoWays' && it.check({ kind: 'choice', i: (it.choices ?? []).findIndex(c => c === 'Both of them') }).ok) expect(sameMap(mapPts(s.also, F), end), it.id).toBe(true);
    }
  });
});

describe('misconception coverage', () => {
  it('every catalogue misconception of the topic shows up in some verdict', () => {
    const seen = new Set<string>();
    for (const [fam, sg] of pairs) for (let s = 1; s <= 150; s++) {
      const it = GENS[fam as keyof typeof GENS](rng(s * 31 + 5), s, sg);
      for (const p of PROBES.get(it) ?? []) seen.add(p.mc);
    }
    for (const mc of Object.values(MC)) expect(seen, mc).toContain(mc);
  });
  it('the topic JSON misconceptions are all in MC', () => {
    if (!fs.existsSync(TOPIC)) return;
    const t = JSON.parse(fs.readFileSync(TOPIC, 'utf8')) as { subgoals: { misconceptions: string[] }[] };
    const all = new Set(t.subgoals.flatMap(s => s.misconceptions));
    for (const mc of all) expect(Object.values(MC) as string[], mc).toContain(mc);
  });
  it('families make many different problems', () => {
    for (const [fam, sg] of pairs) {
      const ids = new Set<string>();
      for (let s = 1; s <= 400; s++) { const it = GENS[fam as keyof typeof GENS](rng(s * 97 + 3), s, sg); ids.add(it.prompt + JSON.stringify((it as CongItem).picture)); }
      expect(ids.size, `${fam}/${sg}`).toBeGreaterThanOrEqual(30);
    }
  });
});

describe('voice', () => {
  it('lines.json has exactly the script ids, with the spoken text', () => {
    const lines = JSON.parse(fs.readFileSync('pages/lessons/congruence/voice/lines.json', 'utf8')) as Record<string, { text: string }>;
    expect(Object.keys(lines).sort()).toEqual(Object.keys(LINES).sort());
    for (const [id, l] of Object.entries(LINES)) {
      expect(lines[id]!.text, id).toBe(l.say);
      expect(l.say, id).not.toMatch(/<|&|\d|′|″|△|≅|→|−/);
    }
    expect(toSay('A′ (−1, 12)')).toBe('A prime negative one, twelve');
  });
});

describe('quality layer (regressions)', () => {
  it('dilate: "1 unit", never "1 units", in the question and after the box', async () => {
    const { GENS } = await import('../src/lesson/topics/congruence/items');
    const { rng } = await import('../src/lesson/runtime/item');
    let ones = 0;
    for (let s = 1; s <= 400; s++) {
      const it0 = GENS.dilate(rng(s * 31 + 7), s, 'dilation-not-rigid');
      expect(it0.prompt.replace(/<[^>]+>/g, '')).not.toMatch(/\b1 units\b/);
      if (it0.input === 'num' && it0.answer.kind === 'num') { expect(it0.unit).toBe(it0.answer.v === 1 ? 'unit' : 'units'); if (/\bis 1 unit\b/.test(it0.prompt)) ones++; }
    }
    expect(ones).toBeGreaterThan(0);
  });
});

describe('quality layer (phase 2 regressions)', () => {
  it('no choice, prompt or step says "slide nowhere" (a zero slide)', async () => {
    const { GENS } = await import('../src/lesson/topics/congruence/items');
    const { PLAN } = await import('../src/lesson/topics/congruence/plan');
    const { rng } = await import('../src/lesson/runtime/item');
    for (const p of PLAN) for (const f of p.families) for (let s = 1; s <= 250; s++) {
      const it0 = GENS[f as keyof typeof GENS](rng(s * 131 + 7), s, p.id);
      for (const t of [it0.prompt, ...it0.solution, ...(it0.choices ?? [])]) expect(t, `${f}: ${t}`).not.toMatch(/slide nowhere/i);
    }
  });
});
