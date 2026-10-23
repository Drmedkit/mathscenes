// lesson-composite-area-volume: every family x every sub-goal it serves x 300 seeds (the answer passes, choices are
// unique with exactly one right, the main misconceptions are classified, every picture lays out readably); the
// measure maths (exposed-face inventory vs S1 + S2 - 2A, union volume vs sums); the voice script and its spoken lines.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { rng, type Item } from '../src/lesson/runtime/item';
import { GENS, PROBES, FAMILY_NAMES, MC, type CavPicture } from '../src/lesson/topics/composite-area-volume/items';
import { PLAN } from '../src/lesson/topics/composite-area-volume/plan';
import { SCRIPT } from '../src/lesson/topics/composite-area-volume/script';
import {
  box3, boxSurface, boxVolume, contactArea, cylSurfPi, cylVolPi, fmt, polyArea, pyramidVolume, unionSurface, unionVolume, words,
} from '../src/lesson/topics/composite-area-volume/measure';
import { SolidsSafe } from '../src/lesson/topics/composite-area-volume/Solids';
import { FloorPlan } from '../src/lesson/topics/composite-area-volume/FloorPlan';
import { frame } from '../src/blocks/block';
import { dusk } from '../src/lesson/dusk';

// the blocks measure words with a canvas; in node they fall back to an estimate
(globalThis as unknown as { document: unknown }).document ??= { createElement: () => ({ getContext: () => null }) };

const TOPIC = 'C:/Users/stelt/Claude code foler/math-curriculum-essentials/topics/secondary.composite-area-volume-and-surface-area.json';
const SEEDS = 300;
const MF = frame(40, 80, 1110, 920);   // the page's model frame

describe('plan covers the topic', () => {
  it('every sub-goal of the topic JSON, in order, each with a family that exists', () => {
    if (fs.existsSync(TOPIC)) {
      const t = JSON.parse(fs.readFileSync(TOPIC, 'utf8')) as { subgoals: { id: string }[] };
      expect(PLAN.map(p => p.id)).toEqual(t.subgoals.map(s => s.id));
    }
    expect(PLAN.length).toBe(21);
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
      for (const s of [it.prompt, it.board, it.solution.join(' '), ...(it.choices ?? []), ...((it.picture as unknown as CavPicture).hero)]) expect(s, it.id).not.toMatch(/undefined|NaN|Infinity|\[object/);
      const pic = it.picture as unknown as CavPicture;
      for (const h of pic.hero) expect(h.replace(/\\(text|cdot|tfrac|pi|div|approx|to|ne)\b/g, 'x').replace(/[{}\\ ]/g, '').length, `${it.id} hero "${h}" too long for the board`).toBeLessThanOrEqual(26);
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
  it('every picture can be laid out and read (labels off the lines; at most 3 % drop a label)', () => {
    let loose = 0;
    for (const it of items.slice(0, 150)) {
      const pic = it.picture as unknown as CavPicture;
      try {
        if (pic.kind === 'solids') { const m = SolidsSafe(pic.solids!, MF, dusk); if (!m.strict) loose++; expect(Math.max(m.where.all.w, m.where.all.h), it.id).toBeGreaterThan(300); }
        else { const m = FloorPlan(pic.plan!, MF, dusk); expect(Math.max(m.where.fig.w, m.where.fig.h), it.id).toBeGreaterThan(300); }
      } catch (e) { throw new Error(`${it.id} ${it.prompt}: ${(e as Error).message}`); }
    }
    expect(loose, `${fam}: pictures that had to drop a label`).toBeLessThanOrEqual(6);
  });
});

describe('misconception coverage', () => {
  it('every misconception id in MC shows up in some verdict or probe', () => {
    const seen = new Set<string>();
    for (const [fam, sg] of pairs) for (let s = 1; s <= 200; s++) {
      const it = GENS[fam](rng(s * 31 + 5), s, sg);
      for (const p of PROBES.get(it) ?? []) seen.add(p.mc);
      if (it.input === 'choice') (it.choices ?? []).forEach((_, i) => { const v = it.check({ kind: 'choice', i }); if (v.mc) seen.add(v.mc); });
    }
    for (const mc of Object.values(MC)) expect(seen.has(mc), mc).toBe(true);
  });
  it('the misconceptions of every sub-goal in the topic JSON are classified somewhere', () => {
    if (!fs.existsSync(TOPIC)) return;
    const t = JSON.parse(fs.readFileSync(TOPIC, 'utf8')) as { subgoals: { id: string; misconceptions?: string[] }[] };
    const ids = new Set<string>(Object.values(MC));
    for (const s of t.subgoals) for (const m of s.misconceptions ?? []) expect(ids.has(m as never), `${s.id}: ${m}`).toBe(true);
  });
  it('many distinct items per family', () => {
    for (const fam of Object.keys(GENS) as (keyof typeof GENS)[]) {
      const sgs = PLAN.filter(p => p.families.includes(fam)).map(p => p.id);
      const ids = new Set<string>();
      for (let s = 1; s <= 2000; s++) { const it = GENS[fam](rng(s), s, sgs[s % sgs.length]); ids.add(it.prompt + it.board + (it.choices ?? []).join('|')); }
      expect(ids.size, fam).toBeGreaterThanOrEqual(40);
    }
  });
});

describe('the measure maths', () => {
  it('the step of the lesson: 18 ft³, 38 + 22 - 2 x 6 = 48 ft² by the face inventory', () => {
    const A = box3(0, 0, 0, 4, 3, 1), B = box3(0, 0, 1, 2, 3, 1);
    expect(boxVolume(A) + boxVolume(B)).toBe(18);
    expect(unionVolume([A, B])).toBe(18);
    expect([boxSurface(A), boxSurface(B), contactArea(A, B)]).toEqual([38, 22, 6]);
    expect(unionSurface([A, B])).toBe(48);
  });
  it('the plinth of part 3: 10 x 10 x 4 under a centred 6 x 6 x 4: 360 + 168 - 72 = 456', () => {
    const A = box3(0, 0, 0, 10, 10, 4), B = box3(2, 2, 4, 6, 6, 4);
    expect([boxSurface(A), boxSurface(B), contactArea(A, B)]).toEqual([360, 168, 36]);
    expect(unionSurface([A, B])).toBe(456);
    expect(unionVolume([A, B])).toBe(544);
  });
  it('the clay of part 4: a cut keeps the volume and adds two faces', () => {
    const whole = box3(0, 0, 0, 6, 4, 3), a = box3(0, 0, 0, 2, 4, 3), b = box3(2, 0, 0, 4, 4, 3);
    expect(boxVolume(a) + boxVolume(b)).toBe(boxVolume(whole));
    expect(boxSurface(a) + boxSurface(b)).toBe(boxSurface(whole) + 2 * 12);
  });
  it('S1 + S2 - 2A equals the direct count for many random joins (whole, partial, side)', () => {
    const R = rng(11);
    for (let i = 0; i < 2000; i++) {
      const L = 2 + Math.floor(R() * 8), W = 2 + Math.floor(R() * 8), H = 1 + Math.floor(R() * 6);
      const l = 1 + Math.floor(R() * L), w = 1 + Math.floor(R() * W), h = 1 + Math.floor(R() * 5);
      const x = Math.floor(R() * (L - l + 1)), y = Math.floor(R() * (W - w + 1));
      const A = box3(0, 0, 0, L, W, H), B = box3(x, y, H, l, w, h);
      expect(unionSurface([A, B])).toBe(boxSurface(A) + boxSurface(B) - 2 * contactArea(A, B));
      expect(unionVolume([A, B])).toBe(boxVolume(A) + boxVolume(B));
    }
  });
  it('a cut box: the volume is outer minus cut; a cavity adds its walls to the surface', () => {
    const outer = box3(0, 0, 0, 6, 5, 4), hole = box3(1, 1, 2, 2, 3, 2);
    expect(unionVolume([outer], [hole])).toBe(120 - 12);
    expect(unionSurface([outer], [hole])).toBe(boxSurface(outer) - 2 * 3 + (2 * 3 + 2 * (2 * 2 + 3 * 2)));
  });
  it('polygons, pyramids, cylinders, numbers', () => {
    expect(polyArea([[0, 0], [10, 0], [10, 4], [6, 4], [6, 8], [0, 8]])).toBe(64);
    expect(pyramidVolume(36, 5)).toBe(60);
    expect(cylVolPi(3, 4)).toBe(36);
    expect(cylSurfPi(3, 4, 2)).toBe(42);
    expect(fmt(2.5, 'frac')).toBe('2½');
    expect(fmt(1234)).toBe('1,234');
    expect(words(456)).toBe('four hundred fifty-six');
  });
});

describe('voice', () => {
  it('every scripted panel line has a spoken text and vice versa', () => {
    const lines = JSON.parse(fs.readFileSync('pages/lessons/composite-area-volume/voice/lines.json', 'utf8')) as Record<string, { text: string }>;
    expect(Object.keys(lines).sort()).toEqual(Object.keys(SCRIPT).sort());
    for (const [id, l] of Object.entries(lines)) {
      expect(l.text.length, id).toBeGreaterThan(3);
      expect(l.text, id).not.toMatch(/\d\s*\/\s*\d|[<>×÷²³]/);
    }
  });
});

describe('quality layer (worked steps, regressions)', () => {
  it('pyramid volume is whole or thirds, never sixths typed as 45.833… (no rounding is asked)', async () => {
    const { GENS } = await import('../src/lesson/topics/composite-area-volume/items');
    const { rng } = await import('../src/lesson/runtime/item');
    for (let s = 1; s <= 1500; s++) {
      const it0 = GENS.pyrVol(rng(s * 131 + 7), s, 'pyramid-volume');
      const v = it0.answer.kind === 'num' ? it0.answer.v : it0.answer.kind === 'frac' ? it0.answer.w + it0.answer.n / it0.answer.d : 0;
      expect(Math.abs(v * 3 - Math.round(v * 3)), it0.prompt).toBeLessThan(1e-6);
    }
  });
  it('"two blocks of cheese", never "two block of cheeses"', async () => {
    const { GENS } = await import('../src/lesson/topics/composite-area-volume/items');
    const { rng } = await import('../src/lesson/runtime/item');
    for (let s = 1; s <= 400; s++) for (const [f, sg] of [['classify', 'sa-contact-classify'], ['joinSA', 'sa-double-subtraction']] as const) {
      expect(GENS[f](rng(s * 7 + 3), s, sg).prompt.replace(/<[^>]+>/g, '')).not.toMatch(/\bblock of \w+s\b/);
    }
  });
  it('explain reads mixed numbers the way the steps write them (15¾ ft²)', async () => {
    const { GENS } = await import('../src/lesson/topics/composite-area-volume/items');
    const { explain } = await import('../src/lesson/topics/composite-area-volume/explain');
    const { rng } = await import('../src/lesson/runtime/item');
    let fr = 0;
    for (let s = 1; s <= 300; s++) for (const [f, sg] of [['areaAdd', 'area-additive'], ['areaSub', 'area-subtractive'], ['pyrVol', 'pyramid-volume']] as const) {
      const it0 = GENS[f](rng(s * 11 + 1), s, sg), ex = explain(it0)!;
      expect(it0.check(ex.result).ok, `${it0.prompt} ${JSON.stringify(ex.result)}`).toBe(true);
      if (it0.input === 'frac') fr++;
    }
    expect(fr).toBeGreaterThan(0);
  });
});

describe('quality layer (world words)', () => {
  it('"an ice block", "an 18 in base"; a pyramid tent is in feet, a paperweight never in feet', async () => {
    const { GENS } = await import('../src/lesson/topics/composite-area-volume/items');
    const { rng } = await import('../src/lesson/runtime/item');
    const txt = (s: string) => s.replace(/<[^>]+>/g, '');
    for (let s = 1; s <= 400; s++) for (const [f, sg] of [['volSub', 'vol-subtractive'], ['cylVol', 'cyl-volume-bh'], ['pyrVol', 'pyramid-volume'], ['missing', 'vol-missing-dimension']] as const) {
      const p = txt(GENS[f](rng(s * 41 + 9), s, sg).prompt);
      expect(p, p).not.toMatch(/\b[Aa] (?=[aeioAEIO]|8|1[18](?![\d.,]))/);
      expect(p, p).not.toMatch(/pyramid tent .*\d (in|cm)\b|paperweight .*\d ft\b|roof cap .*\d (in|cm)\b/);
    }
  });
});
