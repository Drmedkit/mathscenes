// lesson-square-and-cube-roots: every family × every sub-goal it serves × 300 seeds (the answer passes, choices are
// unique with exactly one right, the main misconceptions are classified, pictures are drawable); the models' maths;
// the plan covers the topic JSON; the voice lines match the panel script.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { rng, type Item } from '../src/lesson/runtime/item';
import { GENS, PROBES, FAMILY_NAMES, type FamilyId, type Pic, cubeFloor, sqFloor, tenthsFloor, midSquare } from '../src/lesson/topics/square-and-cube-roots/items';
import { PLAN } from '../src/lesson/topics/square-and-cube-roots/plan';
import { LINES } from '../src/lesson/topics/square-and-cube-roots/script';
import { computeBox } from '../src/lesson/topics/square-and-cube-roots/IsoBox';
import { computeSquare } from '../src/lesson/topics/square-and-cube-roots/SquareTiles';
import { rulerFits } from '../src/lesson/topics/square-and-cube-roots/RootRuler';

const TOPIC = 'C:/Users/stelt/Claude code foler/math-curriculum-essentials/topics/secondary-t5-28-square-roots-and-cube-roots.json';
const MISC = 'C:/Users/stelt/Claude code foler/math-curriculum-essentials/misconceptions.json';
const SEEDS = 300;

describe('plan covers the topic', () => {
  it('every sub-goal of the topic JSON, in order, each with families that exist', () => {
    if (fs.existsSync(TOPIC)) {
      const t = JSON.parse(fs.readFileSync(TOPIC, 'utf8')) as { subgoals: { id: string }[] };
      expect(PLAN.map(p => p.id)).toEqual(t.subgoals.map(s => s.id));
    }
    expect(PLAN.length).toBe(21);
    for (const p of PLAN) { expect(p.families.length).toBeGreaterThan(0); for (const f of p.families) expect(GENS[f as FamilyId], f).toBeTypeOf('function'); }
    for (const f of Object.keys(GENS)) { expect(FAMILY_NAMES[f as FamilyId]).toBeTruthy(); expect(PLAN.some(p => p.families.includes(f as FamilyId)), `${f} is in no sub-goal`).toBe(true); }
  });
});

const known = fs.existsSync(MISC) ? new Set((JSON.parse(fs.readFileSync(MISC, 'utf8')) as { misconceptions: { id: string }[] }).misconceptions.map(m => m.id)) : null;
const pairs = PLAN.flatMap(p => p.families.map(f => [f, p.id] as const));
describe.each(pairs)('family %s for sub-goal %s', (fam, sg) => {
  const items: Item[] = [];
  for (let s = 1; s <= SEEDS; s++) items.push(GENS[fam as FamilyId](rng(s * 7919 + fam.length * 31 + sg.length), s, sg));
  it('the answer passes, the item is well formed', () => {
    for (const it of items) {
      expect(it.family).toBe(fam);
      const v = it.check(it.answer);
      if (!v.ok) throw new Error(`${it.id} ${it.prompt}: own answer rejected: ${v.say}`);
      expect(it.solution.length).toBeGreaterThan(0);
      for (const s of [it.prompt, it.board, it.solution.join(' '), v.say, ...(it.choices ?? []), it.pairLead ?? '', it.pairOp ?? ''])
        expect(s, `${it.id} ${it.prompt}`).not.toMatch(/undefined|NaN|Infinity|\[object|−−|--/);
      if (it.input === 'pair') expect(it.pairOp ?? '', it.id).not.toMatch(/<span/);
    }
  });
  it('choices are unique with exactly one right', () => {
    for (const it of items) {
      if (it.input !== 'choice') continue;
      const ch = it.choices ?? [];
      expect(ch.length).toBeGreaterThanOrEqual(3);
      expect(new Set(ch).size, it.prompt + ' ' + ch.join(' | ')).toBe(ch.length);
      const right = ch.map((_, i) => it.check({ kind: 'choice', i }).ok).filter(Boolean).length;
      expect(right, it.prompt).toBe(1);
    }
  });
  it('the main misconceptions are classified (with catalogue ids)', () => {
    let n = 0;
    for (const it of items) for (const p of PROBES.get(it) ?? []) {
      const v = it.check(p.r);
      expect(v.ok, `${it.id} ${it.prompt} ${JSON.stringify(p.r)}`).toBe(false);
      expect(v.mc, `${it.id} ${it.prompt} ${JSON.stringify(p.r)}`).toBe(p.mc);
      if (known) expect(known.has(p.mc), p.mc).toBe(true);
      n++;
    }
    expect(n, `${fam}: no misconception probes`).toBeGreaterThan(0);
  });
  it('pictures are drawable (the maths of the models holds)', () => {
    for (const it of items) {
      const pic = it.picture as Pic | undefined;
      if (!pic) continue;
      if (pic.kind === 'sq') computeSquare({ area: pic.area, cut: pic.cut, tiles: pic.tiles !== 'none' });
      else if (pic.kind === 'cube') {
        const e = Math.cbrt(pic.vol), r = Math.round(e);
        const edge = r ** 3 === pic.vol ? r : e;
        computeBox({ nx: edge, ny: edge, nz: edge, ghosts: pic.ghosts });
      } else if (pic.kind === 'line') {
        expect(rulerFits(pic), `${it.id} ${pic.lo}..${pic.hi}/${pic.minor}`).toBe(true);
        for (const v of [...pic.labels, ...pic.marks.map(m => m.v), ...(pic.band ?? []), ...(pic.mid != null ? [pic.mid] : [])]) expect(v >= pic.lo - 1e-9 && v <= pic.hi + 1e-9, `${it.id} ${v} in ${pic.lo}..${pic.hi}`).toBe(true);
      }
    }
  });
  it('makes many different problems', () => {
    const few = ['countSol', 'principal', 'signRoot', 'rootIndex', 'cubeEdge', 'evalCube', 'solveCube', 'context', 'multistep', 'sqSide', 'evalSq', 'isolate'];
    expect(new Set(items.map(i => i.prompt + i.board + (i.choices ?? []).join())).size).toBeGreaterThan(sg === 'eval-perfect-square-roots' ? 12 : few.includes(fam) ? 25 : 60);   // only 13 perfect squares up to 144
  });
});

describe('exact numbers and the models', () => {
  it('floors and midpoints', () => {
    expect(sqFloor(50)).toBe(7); expect(sqFloor(49)).toBe(7); expect(sqFloor(56.4)).toBe(7);
    expect(cubeFloor(100)).toBe(4); expect(cubeFloor(-20)).toBe(-3); expect(cubeFloor(999)).toBe(9);
    expect(tenthsFloor(2)).toBe(14); expect(tenthsFloor(200)).toBe(141); expect(tenthsFloor(50)).toBe(70);
    expect(midSquare(141)).toBeCloseTo(200.2225, 10);     // 14.15² > 200, so √200 ≈ 14.1
    expect(midSquare(70)).toBeCloseTo(49.7025, 10);       // 7.05² < 50, so √50 ≈ 7.1
  });
  it('the box counts its unit cubes; ghosts sit around a non-whole edge', () => {
    expect(computeBox({ nx: 4, ny: 4, nz: 4 }).vol).toBe(64);
    expect(computeBox({ nx: 8, ny: 8, nz: 1 }).vol).toBe(64);
    const g = computeBox({ nx: Math.cbrt(200), ny: Math.cbrt(200), nz: Math.cbrt(200), ghosts: true });
    expect([g.lo, g.hi]).toEqual([5, 6]);
    expect(() => computeBox({ nx: 4, ny: 4, nz: 4, ghosts: true })).toThrow();
  });
  it('the square: tiles only for whole sides; cut mode is a²/b² of one unit', () => {
    expect(computeSquare({ area: 49, tiles: true }).side).toBe(7);
    expect(() => computeSquare({ area: 50, tiles: true })).toThrow();
    expect(computeSquare({ area: 9 / 16, cut: { a: 3, b: 4 } }).side).toBe(0.75);
    const g = computeSquare({ area: 50, ghosts: true });
    expect([g.lo, g.hi]).toEqual([7, 8]);
  });
});

describe('voice', () => {
  it('every panel line has a spoken text, and lines.json matches the script', () => {
    const file = 'pages/lessons/square-and-cube-roots/voice/lines.json';
    const json = JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, { text: string }>;
    expect(Object.keys(json).sort()).toEqual(Object.keys(LINES).sort());
    for (const [id, l] of Object.entries(LINES)) {
      expect(json[id]!.text, id).toBe(l.say);
      expect(l.say, id).not.toMatch(/[<>√∛±²³×÷]|\d\/\d|−\d/);   // read-aloud text: no HTML, no symbols, no "3/4"
    }
  });
});
