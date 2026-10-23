// lesson-composite-figures: every family x every sub-goal it serves x 300 seeds (the answer passes, choices are unique
// with exactly one right, the main misconceptions are classified, every picture can be laid out and read); the
// figure maths checks itself; the voice script and its spoken lines agree.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { rng, type Item } from '../src/lesson/runtime/item';
import { GENS, PROBES, FAMILY_NAMES, MC, type FigPicture } from '../src/lesson/topics/composite-figures/items';
import { PLAN } from '../src/lesson/topics/composite-figures/plan';
import { SCRIPT } from '../src/lesson/topics/composite-figures/script';
import {
  approx, checkFig, cornerCut, edgeNotch, lShape, pn, pnAdd, pnEq, pnTex, pnText, quarterOnly, rectHole, rectQuarter, rectSemi, ring, rotFig,
  semiOnly, circleOnly, squareInscribed, track, trapSemi, triSemi,
} from '../src/lesson/topics/composite-figures/figMaths';
import { PlanFigure } from '../src/lesson/topics/composite-figures/PlanFigure';
import { LESSON_FIGS, MF } from '../src/lesson/topics/composite-figures/lessonFigs';
import { dusk } from '../src/lesson/dusk';

// the block measures words with a canvas; in node it falls back to an estimate
(globalThis as unknown as { document: unknown }).document ??= { createElement: () => ({ getContext: () => null }) };

const TOPIC = 'C:/Users/stelt/Claude code foler/math-curriculum-essentials/topics/secondary-t6-29-area-and-perimeter-of-composite-figures.json';
const SEEDS = 300;

describe('plan covers the topic', () => {
  it('every sub-goal of the topic JSON, in order, each with a family that exists', () => {
    if (fs.existsSync(TOPIC)) {
      const t = JSON.parse(fs.readFileSync(TOPIC, 'utf8')) as { subgoals: { id: string }[] };
      expect(PLAN.map(p => p.id)).toEqual(t.subgoals.map(s => s.id));
    }
    expect(PLAN.length).toBe(19);
    for (const p of PLAN) { expect(p.families.length).toBeGreaterThan(0); for (const f of p.families) expect(GENS[f]).toBeTypeOf('function'); }
    for (const f of Object.keys(GENS)) expect(FAMILY_NAMES[f as keyof typeof FAMILY_NAMES]).toBeTruthy();
    for (const f of Object.keys(GENS)) expect(PLAN.some(p => p.families.includes(f as never)), f).toBe(true);
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
      for (const s of [it.prompt, it.board, it.solution.join(' '), ...(it.choices ?? [])]) expect(s, it.id).not.toMatch(/undefined|NaN|Infinity|\[object/);
      // TeX that lost its backslashes (\t, \f in a template string) shows up as control characters
      const pic = it.picture as unknown as FigPicture | undefined;
      for (const s of [it.board, ...(pic?.hero ?? [])]) expect(s, it.id).not.toMatch(/[\t\f\v\b\r\n]/);
    }
  });
  it('choices are unique with exactly one right', () => {
    for (const it of items) {
      if (it.input !== 'choice') continue;
      const ch = it.choices ?? [];
      expect(ch.length, it.prompt).toBeGreaterThanOrEqual(3);
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
  it('every picture checks its maths and can be laid out and read', () => {
    for (const it of items.slice(0, 150)) {
      const pic = it.picture as unknown as FigPicture | undefined;
      if (!pic) continue;
      checkFig(pic.fig);
      try {
        PlanFigure({ fig: pic.fig, unit: pic.unit, dims: pic.dims, seam: pic.seam }, MF, dusk);
      } catch (e) { throw new Error(`${it.id} (${pic.fig.name}): ${(e as Error).message}`); }
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
    // and every id the topic JSON lists is in MC
    if (fs.existsSync(TOPIC)) {
      const t = JSON.parse(fs.readFileSync(TOPIC, 'utf8')) as { subgoals: { misconceptions: string[] }[] };
      const ids = new Set(Object.values(MC) as string[]);
      for (const s of t.subgoals) for (const m of s.misconceptions) expect(ids.has(m), m).toBe(true);
    }
  });
  it('many distinct items per family', () => {
    for (const fam of Object.keys(GENS) as (keyof typeof GENS)[]) {
      const sgs = PLAN.filter(p => p.families.includes(fam)).map(p => p.id);
      const ids = new Set<string>();
      for (let s = 1; s <= 2000; s++) { const it = GENS[fam](rng(s), s, sgs[s % sgs.length]); const pic = it.picture as unknown as FigPicture | undefined; ids.add(it.prompt + it.board + JSON.stringify(pic ? [pic.dims, pic.unit, pic.fig.name, pic.fig.area, pic.fig.perimeter, pic.cand, pic.seam] : '')); }
      expect(ids.size, fam).toBeGreaterThanOrEqual(40);
    }
  });
});

describe('the figure maths', () => {
  it('a + bπ: like terms combine, unlike terms stay apart, round once at the end', () => {
    expect(pnTex(pnAdd(pn(20), pn(20), pn(0, 8), pn(0, 8)))).toBe('40 + 16\\pi');
    expect(pnText(pn(60, -2))).toBe('60 − 2π');
    expect(pnTex(pn(0, 1))).toBe('\\pi');
    expect(approx(pn(24, 6))).toBe(42.8);
    expect(approx(pn(28, 8))).toBe(53.1);
  });
  it('every template checks itself (closing loops, piece lengths, sampled area = sum of parts, seams inside)', () => {
    const figs = [rectSemi(12, 8), rectSemi(12, 10, 6), track(14, 8), rectQuarter(10, 6), triSemi(8, 3, 5), trapSemi(14, 8, 4, 5), rectHole(12, 8, 2, 4, 4, 9),
      squareInscribed(8), ring(7, 3), cornerCut(12, 8, 4), edgeNotch(10, 6, 2), semiOnly(5), quarterOnly(6), circleOnly(4), lShape(10, 4, 4, 5)];
    for (const F of figs) { checkFig(F); for (let q = 1; q < 4; q++) checkFig(rotFig(F, q)); }
  });
  it('the lesson figures: patio, garden bed, table top', () => {
    const patio = rectSemi(12, 8);
    expect(pnEq(patio.area, pn(96, 8))).toBe(true);
    expect(pnEq(patio.perimeter, pn(32, 4))).toBe(true);
    expect(approx(patio.perimeter)).toBe(44.6);
    const bed = track(14, 8);
    expect(pnEq(bed.area, pn(112, 16))).toBe(true);
    expect(pnEq(bed.perimeter, pn(28, 8))).toBe(true);
    const table = edgeNotch(10, 6, 2);
    expect(pnEq(table.perimeter, pn(28, 2))).toBe(true);
    expect(pnEq(table.area, pn(60, -2))).toBe(true);
    expect(pnVal(table.perimeter)).toBeGreaterThan(32);
  });
  it('a hole subtracts area and adds edge; the outer perimeter stays', () => {
    const F = rectHole(12, 8, 2, 4, 4);
    expect(pnEq(F.area, pn(96, -4))).toBe(true);
    expect(pnEq(F.perimeter, pn(40, 4))).toBe(true);
    expect(pnEq(F.outerPerimeter, pn(40))).toBe(true);
  });
  it('a semicircle notch raises the perimeter, a quarter corner cut lowers it (any radius)', () => {
    for (let r = 1; r <= 3; r++) {
      expect(pnVal(edgeNotch(10, 8, r).perimeter)).toBeGreaterThan(36);
      expect(pnVal(cornerCut(10, 8, r).perimeter)).toBeLessThan(36);
    }
  });
  it('the lesson figures can be laid out', () => {
    for (const [k, p] of Object.entries(LESSON_FIGS)) {
      try { PlanFigure(p, MF, dusk); } catch (e) { throw new Error(`${k}: ${(e as Error).message}`); }
    }
  });
});
const pnVal = (x: { a: number; b: number }) => x.a + x.b * Math.PI;

describe('voice', () => {
  it('every scripted panel line has a spoken text and vice versa', () => {
    const lines = JSON.parse(fs.readFileSync('pages/lessons/composite-figures/voice/lines.json', 'utf8')) as Record<string, { text: string }>;
    expect(Object.keys(lines).sort()).toEqual(Object.keys(SCRIPT).sort());
    for (const [id, l] of Object.entries(lines)) {
      expect(l.text.length, id).toBeGreaterThan(3);
      expect(l.text, id).not.toMatch(/\d\s*\/\s*\d|[<>×÷π²≈]/);
    }
  });
});

describe('quality layer (worked steps, check-in figure)', () => {
  it('the steps of an exact a + bπ answer end on both boxes (a π part alone has number part 0)', async () => {
    const { GENS } = await import('../src/lesson/topics/composite-figures/items');
    const { explain } = await import('../src/lesson/topics/composite-figures/explain');
    const { rng } = await import('../src/lesson/runtime/item');
    for (let s = 1; s <= 150; s++) for (const [f, sg] of [['hole', 's3-hole-area-and-boundary'], ['arcLen', 's2-arc-length'], ['cutArea', 's2-cutout-area'], ['notch', 's2-notch-perimeter']] as const) {
      const it0 = GENS[f](rng(s * 37 + 11), s, sg), ex = explain(it0)!;
      expect(ex.result, it0.prompt).toEqual(it0.answer);
    }
  });
  it('the check-in figure is a small self-contained svg (no NaN, no external refs)', async () => {
    const { GENS } = await import('../src/lesson/topics/composite-figures/items');
    const { PLACEMENT } = await import('../src/lesson/topics/composite-figures/placement');
    const { rng } = await import('../src/lesson/runtime/item');
    for (let s = 1; s <= 60; s++) {
      const svg = PLACEMENT.figure!(GENS.areaAdd(rng(s * 3 + 1), s, 's2-composite-area-add'))!;
      expect(svg).toMatch(/^<svg[\s>].*viewBox=/);
      expect(svg.length).toBeLessThan(6144);
      expect(svg).not.toMatch(/NaN|undefined|href=|<script/);
    }
  });
});

describe('quality layer (phase 2 regressions)', () => {
  it('round: the value before rounding is never an exact .5 tie (40 + 2.5π with π ≈ 3.14 = 47.85)', async () => {
    const { GENS } = await import('../src/lesson/topics/composite-figures/items');
    const { rng } = await import('../src/lesson/runtime/item');
    let n314 = 0;
    for (let s = 1; s <= 2000; s++) {
      const it0 = GENS.round(rng(s * 131 + 7), s, 's2-exact-and-approx');
      const p = it0.prompt.replace(/<[^>]+>/g, '');
      const m = p.match(/is (\d+) ([+−]) (\d+(?:\.\d+)?)π .*π ≈ 3\.14 and round to the nearest (tenth|whole number)/);
      if (!m) continue;
      n314++;
      const v = (+m[1]! + (m[2] === '−' ? -1 : 1) * +m[3]! * 3.14) * (m[4] === 'tenth' ? 10 : 1);
      expect(Math.abs(Math.abs(v - Math.trunc(v)) - 0.5) < 1e-6, p).toBe(false);
    }
    expect(n314).toBeGreaterThan(50);
  });
});
