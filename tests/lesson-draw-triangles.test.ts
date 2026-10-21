// draw triangles from given conditions: every family x every sub-goal it serves x 300 seeds gives a valid item (the
// answer passes, choices unique with exactly one right, mc ids exist, the picture lays out readably), the main
// misconceptions are classified, the plan covers every sub-goal of the topic JSON in order, and the triangle maths
// (SSS / SAS / ASA solvers, existence, angle sum, side-angle order, none / one / many) checks out.
import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { rng, type Response } from '../src/lesson/runtime/item';
import { GENS, FAMILY_NAMES, type DTItem, splitBoard } from '../src/lesson/topics/draw-triangles/items';
import { PLAN } from '../src/lesson/topics/draw-triangles/plan';
import { PROOF_F, buildPic, constructDrawing, proofDrawing, type Pic } from '../src/lesson/topics/draw-triangles/pictures';
import { Construction } from '../src/lesson/topics/draw-triangles/Construction';
import { frame } from '../src/blocks/block';
import { circleMeet, countTriangles, existsSSS, lenText, solveASA, solveSAS, solveSSS, thirdAngle, thirdSideRange } from '../src/lesson/topics/draw-triangles/triangleMaths';

const ROOT = 'C:/Users/stelt/Claude code foler/math-curriculum-essentials';
const TOPIC = `${ROOT}/topics/secondary.draw-triangles-from-given-conditions.json`;
const MC = `${ROOT}/misconceptions.json`;
const mcIds = existsSync(MC) ? new Set((JSON.parse(readFileSync(MC, 'utf8')) as { misconceptions: { id: string }[] }).misconceptions.map(m => m.id)) : null;
const topic = existsSync(TOPIC) ? (JSON.parse(readFileSync(TOPIC, 'utf8')) as { subgoals: { id: string; order: number; misconceptions: string[] }[] }) : null;

const pairs = PLAN.flatMap(p => p.families.map(f => [f, p.id] as const));
const make = (f: string, sg: string, s: number): DTItem => GENS[f]!(rng(s * 7919 + f.length * 31), s, sg);
const allMcs = (it: DTItem): (string | undefined)[] => (it.choices ? it.choices.map((_, i) => it.check({ kind: 'choice', i }).mc) : []);

describe('plan', () => {
  it('covers every sub-goal of the topic JSON, in order, each with families that exist', () => {
    if (topic) expect(PLAN.map(p => p.id)).toEqual([...topic.subgoals].sort((a, b) => a.order - b.order).map(s => s.id));
    for (const p of PLAN) {
      expect(p.families.length).toBeGreaterThan(0);
      for (const f of p.families) { expect(GENS[f], f).toBeTypeOf('function'); expect(FAMILY_NAMES[f], f).toBeTruthy(); }
    }
    expect(new Set(PLAN.flatMap(p => p.families))).toEqual(new Set(Object.keys(GENS)));
  });
});

describe('item families', () => {
  for (const [f, sg] of pairs) {
    it(`${f} for ${sg}: 300 seeds, the answer passes, choices unique with one right, mc ids exist, pictures lay out`, () => {
      const seen = new Set<string>();
      for (let s = 1; s <= 300; s++) {
        const it = make(f, sg, s);
        expect(it.family).toBe(f);
        expect(it.check(it.answer).ok, `${it.prompt} ${JSON.stringify(it.answer)}`).toBe(true);
        expect(it.solution.length).toBeGreaterThan(0);
        expect(it.prompt).not.toMatch(/undefined|NaN|null/);
        expect(it.board).not.toMatch(/undefined|NaN|null/);
        expect(splitBoard(it.board).length).toBeGreaterThan(0);
        for (const l of it.solution) expect(l).not.toMatch(/undefined|NaN/);
        if (it.choices) {
          expect(new Set(it.choices).size, it.choices.join(' | ')).toBe(it.choices.length);
          const verdicts = it.choices.map((_, i) => it.check({ kind: 'choice', i }));
          expect(verdicts.filter(v => v.ok).length).toBe(1);
          for (const v of verdicts) expect(v.say).not.toMatch(/undefined|NaN/);
          if (mcIds) for (const v of verdicts) if (v.mc) expect(mcIds.has(v.mc), v.mc).toBe(true);
        }
        // the triangle the prompt names and the letters of its givens agree
        const tri = /triangle ([A-Z]{3})/.exec(it.prompt)?.[1];
        if (tri) for (const m of it.prompt.matchAll(/<b class="[ab]">(?:∠([A-Z])|([A-Z]{2})) =/g)) for (const ch of (m[1] ?? m[2])!) expect(tri, it.prompt).toContain(ch);
        if (it.picture) buildPic(it.picture);
        if (it.solvePic) buildPic(it.solvePic);
        seen.add(it.prompt + it.board + (it.choices ?? []).join() + JSON.stringify(it.picture ?? null));
      }
      expect(seen.size).toBeGreaterThan(30);
    });
  }
});

describe('misconceptions are diagnosed', () => {
  it('every sub-goal misconception of the topic JSON is reachable from a practice answer', () => {
    if (!topic) return;
    for (const sg of topic.subgoals) {
      const p = PLAN.find(x => x.id === sg.id)!;
      const seen = new Set<string>();
      for (const f of p.families) for (let s = 1; s <= 300; s++) {
        const it = make(f, sg.id, s);
        for (const m of allMcs(it)) if (m) seen.add(m);
        // numeric families: try the classic wrong answers
        if (it.input !== 'choice') for (const r of wrongTries(it)) { const v = it.check(r); if (v.mc) seen.add(v.mc); }
      }
      for (const m of sg.misconceptions) expect(seen.has(m), `${sg.id}: ${m}`).toBe(true);
    }
  });
  it('a ruler read from 0 instead of the start mark is "aligns at ruler end"', () => {
    for (let s = 1; s <= 200; s++) {
      const it = make('segLen', 'draw-given-length', s), p = it.picture as Extract<Pic, { kind: 'ruler' }>;
      const v = it.check(num(p.seg![1], p.unit));
      expect(v.ok).toBe(false); expect(v.mc).toBe('mc.measurement-units.aligns-at-ruler-end-or-1');
    }
  });
  it('the third side range: endpoints are degenerate, too small checks the wrong pair', () => {
    for (let s = 1; s <= 200; s++) {
      const it = make('thirdSide', 'triangle-existence', s), a = it.answer as { x: number; y: number };
      expect(it.check({ kind: 'pair', x: a.x - 1, y: a.y + 1 }).mc).toBe('mc.shapes.accepts-degenerate-triangle');
      if (a.x - 2 >= 0) expect(it.check({ kind: 'pair', x: a.x - 2, y: a.y }).mc).toBe('mc.shapes.checks-wrong-pair-in-triangle-inequality');
    }
  });
});

function num(v: number, u: string): Response {
  if (u === 'cm') return { kind: 'num', v };
  const w = Math.floor(v + 1e-9), q = Math.round((v - w) * 4);
  return { kind: 'frac', w, n: q, d: 4 };
}
function wrongTries(it: DTItem): Response[] {
  const out: Response[] = [];
  const a = it.answer;
  if (a.kind === 'num' || a.kind === 'frac') {
    const v = a.kind === 'num' ? a.v : a.w + a.n / a.d;
    for (const d of [-3, -2, -1, -0.5, -0.25, 0.25, 0.5, 1, 2, 3, 4, 5, 6, 7, 8]) out.push({ kind: 'num', v: v + d }, num(v + d, 'in'));
    const p = it.picture as Extract<Pic, { kind: 'ruler' }> | Extract<Pic, { kind: 'compassRuler' }> | undefined;
    if (p?.kind === 'ruler' && p.seg) out.push({ kind: 'num', v: p.seg[1] }, num(p.seg[1], 'in'));
    if (p?.kind === 'compassRuler') out.push({ kind: 'num', v: p.e }, num(p.e, 'in'), { kind: 'num', v: p.e - p.s + 1 }, num(p.e - p.s + 1, 'in'));
  }
  return out;
}

describe('the triangle maths', () => {
  it('SSS: the corner is AC from A and BC from B; the angles total 180', () => {
    for (const [c, b, a] of [[5, 4, 3], [6, 3.5, 4], [7, 7, 7], [10, 6, 5]] as const) {
      const t = solveSSS(c, b, a);
      expect(t.AC).toBeCloseTo(b, 9); expect(t.BC).toBeCloseTo(a, 9);
      expect(t.angA + t.angB + t.angC).toBeCloseTo(180, 9);
    }
    expect(solveSSS(5, 4, 3).angC).toBeCloseTo(90, 9);
    expect(() => solveSSS(7, 3, 4)).toThrow(/flat/);
    expect(() => solveSSS(9, 3, 4)).toThrow(/too short/);
  });
  it('SAS and ASA solve and check themselves', () => {
    const s = solveSAS(6, 4, 50); expect(s.angA).toBeCloseTo(50, 9); expect(s.AC).toBeCloseTo(4, 9);
    const a = solveASA(3, 40, 60); expect(a.angC).toBeCloseTo(80, 9); expect(a.angB).toBeCloseTo(60, 9);
    const b = solveASA(5, 40, 60); expect(b.angC).toBeCloseTo(80, 9); expect(b.AB / a.AB).toBeCloseTo(b.AC / a.AC, 9);   // same shape, bigger
    expect(() => solveASA(4, 100, 80)).toThrow(/never meet/);
  });
  it('existence, third side range, angle sum, arcs', () => {
    expect(existsSSS(3, 4, 7)).toBe('flat'); expect(existsSSS(3, 4, 8)).toBe('short'); expect(existsSSS(7, 3, 5)).toBe('yes');
    expect(thirdSideRange(5, 8)).toEqual([4, 12]);
    expect(thirdAngle(48, 75)).toBe(57); expect(() => thirdAngle(100, 80)).toThrow();
    expect(circleMeet([0, 0], 3, [7, 0], 4)).toHaveLength(1);
    expect(circleMeet([0, 0], 3, [8, 0], 4)).toHaveLength(0);
    const two = circleMeet([0, 0], 4, [5, 0], 3); expect(two).toHaveLength(2); expect(two[0]![1]).toBeGreaterThan(0);
  });
  it('none / one / many', () => {
    expect(countTriangles({ kind: 'SSS', AB: 3, AC: 4, BC: 7 })).toBe('none');
    expect(countTriangles({ kind: 'SSS', AB: 3, AC: 4, BC: 5 })).toBe('one');
    expect(countTriangles({ kind: 'SAS', AB: 3, AC: 4, angA: 120 })).toBe('one');
    expect(countTriangles({ kind: 'ASA', AB: 3, angA: 100, angB: 80 })).toBe('none');
    expect(countTriangles({ kind: 'AAA', angA: 40, angB: 60, angC: 80 })).toBe('many');
    expect(countTriangles({ kind: 'AAA', angA: 40, angB: 60, angC: 90 })).toBe('none');
  });
  it('lengths read as kids write them', () => { expect(lenText(3.5)).toBe('3½'); expect(lenText(0.25)).toBe('¼'); expect(lenText(4)).toBe('4'); });
});

describe('the lesson pictures lay out', () => {
  it('the worked example, your turn, the sticks question and the proof picture', () => {
    const f = frame(100, 330, 1040, 650);
    Construction(proofDrawing(), PROOF_F);
    Construction(constructDrawing({ kind: 'sss', unit: 'in', AB: 5, AC: 4, BC: 3, names: ['A', 'B', 'C'] }), f);
    Construction(constructDrawing({ kind: 'sss', unit: 'in', AB: 6, AC: 3.5, BC: 4, names: ['A', 'B', 'C'], cands: ['P', 'Q', 'R'] }), f);
    Construction(constructDrawing({ kind: 'sss', unit: 'in', AB: 7, AC: 3, BC: 4, names: ['A', 'B', 'C'] }), f);
    buildPic({ kind: 'sticks', unit: 'in', lens: [3, 4, 7] });
  });
});
