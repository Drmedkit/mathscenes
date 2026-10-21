// lesson-scale-and-area: the generic checks (every family x every sub-goal it serves x 300 seeds). Add topic checks below.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { rng } from '../src/lesson/runtime/item';
import { GENERATORS } from '../src/lesson/topics/scale-and-area/items';
import { PLAN } from '../src/lesson/topics/scale-and-area/plan';

const TOPIC = JSON.parse(fs.readFileSync('../math-curriculum-essentials/topics/primary.ratios.scale-area.json', 'utf8'));
const CATALOG = new Set<string>(JSON.parse(fs.readFileSync('../math-curriculum-essentials/misconceptions.json', 'utf8')).misconceptions.map((m: { id: string }) => m.id));
const GEN = GENERATORS as Record<string, (R: () => number, n: number, sg?: string) => import('../src/lesson/runtime/item').Item>;

describe('scale-and-area: plan', () => {
  it('walks through every sub-goal of the topic JSON, in order, each with a family', () => {
    expect(PLAN.map(p => p.id)).toEqual(TOPIC.subgoals.map((s: { id: string }) => s.id));
    for (const p of PLAN) { expect(p.families.length, p.id).toBeGreaterThan(0); for (const f of p.families) expect(GEN[f], f).toBeDefined(); }
  });
});

describe('scale-and-area: families', () => {
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

// ---------- topic checks: probes, pictures, the model's maths, the voice lines ----------
import { FAMILY_NAMES, MC, PF, PROBES, type AreaItem } from '../src/lesson/topics/scale-and-area/items';
import { type Shape, areaOf, extentOf, fitsArea, groups, layoutArea, polyArea, shapePts, stretchPts, tiles, traceCells } from '../src/lesson/topics/scale-and-area/areaMaths';
import { LESSON_FRAME, LESSON_PICS } from '../src/lesson/topics/scale-and-area/lessonPics';
import { SCRIPT } from '../src/lesson/topics/scale-and-area/script';

describe('scale-and-area: diagnosis and pictures', () => {
  it('every misconception id used is in the catalogue', () => {
    for (const id of Object.values(MC)) expect(CATALOG.has(id), id).toBe(true);
  });
  for (const p of PLAN) for (const f of p.families) {
    it(`${p.id} / ${f}: probes are classified, pictures fit, names exist`, () => {
      expect((FAMILY_NAMES as Record<string, string>)[f], f).toBeTruthy();
      let probes = 0;
      for (let s = 1; s <= 300; s++) {
        const item = GEN[f]!(rng(s * 131 + 3), s, p.id) as AreaItem;
        for (const t of [item.prompt, item.board, ...item.solution, ...(item.choices ?? [])]) expect(t).not.toMatch(/undefined|NaN|Infinity|null|\[object/);
        for (const pr of PROBES.get(item) ?? []) {
          const v = item.check(pr.r);
          expect(v.ok, `${item.prompt} ${JSON.stringify(pr.r)}`).toBe(false);
          expect(v.mc, `${item.prompt} ${JSON.stringify(pr.r)}`).toBe(pr.mc);
          probes++;
        }
        if (item.pict) expect(layoutArea(item.pict.pic, PF).why, item.prompt).toBeNull();
        // TeX in a template string: a lone backslash-t or backslash-f would become a control character
        for (const t of [item.board, item.pict?.solve.tex ?? '']) expect(t, f).not.toMatch(/[\x00-\x1f]/);
      }
      expect(probes).toBeGreaterThanOrEqual(0);
    });
  }
  it('the main misconceptions are probed somewhere', () => {
    const seen = new Set<string>();
    for (const p of PLAN) for (const f of p.families) for (let s = 1; s <= 60; s++) for (const pr of PROBES.get(GEN[f]!(rng(s), s, p.id)) ?? []) seen.add(pr.mc);
    for (const id of [MC.byK, MC.additive, MC.addSide, MC.nonUniform, MC.onlyRects, MC.pieces, MC.wholeCopies, MC.makeSquare, MC.timesTwo, MC.factorAsArea, MC.squareArea,
      MC.omitDigits, MC.squareBigger, MC.reverseRatio, MC.oneTerm, MC.linearUnits, MC.unitDim, MC.rootHalf, MC.ruleAsWhy, MC.examples, MC.drawnCase, MC.someSides, MC.halfConst, MC.areaToLength]) expect(seen.has(id), id).toBe(true);
  });
  it('the lesson pictures fit the lesson frame', () => {
    for (const [name, pic] of Object.entries(LESSON_PICS)) expect(layoutArea(pic, LESSON_FRAME).why, name).toBeNull();
  });
});

describe('scale-and-area: the model maths', () => {
  const shapes: Shape[] = [
    { kind: 'rect', w: 3, h: 2 }, { kind: 'rect', w: 1, h: 4 }, { kind: 'para', w: 3, h: 2, s: 1 },
    { kind: 'tri', w: 4, h: 3, a: 0 }, { kind: 'tri', w: 4, h: 2, a: 1 }, { kind: 'tri', w: 3, h: 3, a: 3 },
  ];
  for (const S of shapes) for (const k of [1, 2, 3, 4]) it(`${S.kind} ${JSON.stringify(S)} x ${k}: k x k whole copies tile the copy exactly`, () => {
    const T = tiles(S, k, k)!;
    expect(T.length).toBe(k * k);
    const copy = stretchPts(shapePts(S), k, k);
    expect(polyArea(copy)).toBeCloseTo(k * k * areaOf(S), 9);
    expect(T.reduce((s, t) => s + polyArea(t.pts), 0)).toBeCloseTo(polyArea(copy), 9);
    for (const t of T) expect(polyArea(t.pts)).toBeCloseTo(areaOf(S), 9);
    // every tile corner lies inside the copy or on its edge (the copy's extent bounds them)
    const e = extentOf(copy);
    for (const t of T) for (const [x, y] of t.pts) { expect(x).toBeGreaterThanOrEqual(e.x0 - 1e-9); expect(x).toBeLessThanOrEqual(e.x1 + 1e-9); expect(y).toBeGreaterThanOrEqual(-1e-9); expect(y).toBeLessThanOrEqual(e.y1 + 1e-9); }
  });
  it('a stretch along one side is k copies; unequal factors give a x b copies', () => {
    expect(tiles({ kind: 'rect', w: 3, h: 2 }, 3, 1)!.length).toBe(3);
    expect(tiles({ kind: 'rect', w: 3, h: 2 }, 2, 3)!.length).toBe(6);
    expect(tiles({ kind: 'tri', w: 3, h: 2, a: 0 }, 2, 3)).toBeNull();
    expect(tiles({ kind: 'rect', w: 3, h: 2 }, 1.5, 1.5)).toBeNull();
  });
  it('unit-square figures: the outline encloses the cells, each cell becomes a k-by-k group', () => {
    for (const cells of [[[0, 0], [1, 0], [0, 1]], [[0, 1], [1, 1], [2, 1], [1, 0]], [[1, 0], [0, 1], [1, 1], [2, 1], [1, 2]]] as [number, number][][]) {
      expect(polyArea(traceCells(cells))).toBe(cells.length);
      for (const k of [2, 3]) {
        const G = groups({ kind: 'cells', cells }, k)!;
        expect(G.reduce((s, g) => s + polyArea(g.sq), 0)).toBe(cells.length * k * k);
        expect(polyArea(stretchPts(traceCells(cells), k, k))).toBe(cells.length * k * k);
      }
    }
  });
  it('a reduction by 1/m: m x m copies of the copy tile the original', () => {
    expect(fitsArea({ shape: { kind: 'rect', w: 4, h: 2 }, kx: 0.5, ky: 0.5, tile: 'reverse' }, PF)).toBe(true);
    expect(fitsArea({ shape: { kind: 'tri', w: 4, h: 4, a: 0 }, kx: 0.5, ky: 0.5, tile: 'reverse' }, PF)).toBe(true);
  });
});

describe('scale-and-area: voice', () => {
  const LINES = JSON.parse(fs.readFileSync('pages/lessons/scale-and-area/voice/lines.json', 'utf8')) as Record<string, { text: string }>;
  it('lines.json = the spoken texts of script.ts, read-aloud only (no digits or symbols)', () => {
    expect(Object.keys(LINES).sort()).toEqual(Object.keys(SCRIPT).sort());
    for (const [id, l] of Object.entries(SCRIPT)) {
      expect(LINES[id]!.text, id).toBe(l.s);
      expect(l.s, id).not.toMatch(/[0-9×÷=+²½<>/%$]/);
    }
  });
  it('every voice id the page uses exists', () => {
    const src = fs.readFileSync('pages/lessons/scale-and-area.ts', 'utf8');
    const ids = new Set([...src.matchAll(/(?:said|fbSaid)\((?:true|false, )?'([a-z.0-9]+)'/g)].map(m => m[1]!));
    for (const m of src.matchAll(/id: '([a-z.0-9]+)'/g)) ids.add(m[1]!);
    for (const m of src.matchAll(/why: '([a-z.0-9]+)'/g)) ids.add(m[1]!);
    for (const id of ids) expect(SCRIPT[id], id).toBeDefined();
  });
});
