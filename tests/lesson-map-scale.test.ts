// lesson-map-scale: the generic checks (every family x every sub-goal it serves x 300 seeds) + the map maths, every
// picture builds (layout checks inside the blocks), the misconception probes, and the voice lines.
import { beforeAll, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { rng, type Response } from '../src/lesson/runtime/item';
import { GENERATORS, MC, type MSItem, type Pic } from '../src/lesson/topics/map-scale/items';
import { PLAN } from '../src/lesson/topics/map-scale/plan';
import { Bar, MAPF, MapLines, Range, Ruler, Strips } from '../src/lesson/topics/map-scale/MapSheet';
import { LESSON_PICS } from '../src/lesson/topics/map-scale/lessonPics';
import { conv, coverMiles, drawnInches, ground, groundError, mapLen, possible, range, ratioOf } from '../src/lesson/topics/map-scale/mapMaths';
import { texReady } from '../src/core/tex';

const TOPIC = JSON.parse(fs.readFileSync('../math-curriculum-essentials/topics/primary.ratios.use-map-scale.json', 'utf8'));
const CATALOG = new Set<string>(JSON.parse(fs.readFileSync('../math-curriculum-essentials/misconceptions.json', 'utf8')).misconceptions.map((m: { id: string }) => m.id));
const GEN = GENERATORS as Record<string, (R: () => number, n: number, sg?: string) => MSItem>;
const LINES = JSON.parse(fs.readFileSync('pages/lessons/map-scale/voice/lines.json', 'utf8')) as Record<string, { text: string }>;
const num = (v: number): Response => ({ kind: 'num', v });

beforeAll(async () => {
  (globalThis as unknown as { document: unknown }).document = { createElement: () => ({ getContext: () => null }) };
  await texReady();
});
function build(p: Pic): void {
  if (p.kind === 'lines') MapLines(p.p, MAPF);
  else if (p.kind === 'ruler') Ruler(p.p, MAPF);
  else if (p.kind === 'bar') Bar(p.p, MAPF);
  else if (p.kind === 'strips') Strips(p.p, MAPF);
  else Range(p.p, MAPF);
}

describe('map-scale: maths', () => {
  it('1 : 63,360 is 1 in = 1 mi; 1 : 24,000 is 1 in = 2,000 ft; both directions', () => {
    expect(ratioOf('in', 1, 'mi')).toBe(63360);
    expect(ratioOf('in', 2000, 'ft')).toBe(24000);
    expect(conv(ground(2.5, 63360), 'in', 'mi')).toBe(2.5);
    expect(conv(ground(3.5, 24000), 'in', 'ft')).toBe(7000);
    expect(conv(ground(3.5, 24000), 'cm', 'km')).toBe(0.84);
    expect(mapLen(conv(6000, 'ft', 'in'), 24000)).toBe(3);
    expect(mapLen(conv(1.2, 'km', 'cm'), 24000)).toBe(5);
    expect(drawnInches(1, 24000)).toBe(2.64);
    expect(drawnInches(3, 24000)).toBe(7.92);
    expect(coverMiles(8.5, 24000)).toBeCloseTo(3.22, 2);
    expect(range(4.2, 0.1)).toEqual([4.15, 4.25]);
    expect(possible(4.24, 4.2, 0.1)).toBe(true);
    expect(possible(4.28, 4.2, 0.1)).toBe(false);
    expect(groundError(1, 'mm', 24000, 'm')).toBe(24);
    expect(groundError(0.1, 'in', 24000, 'ft')).toBe(200);
    expect(() => conv(1, 'in', 'cm')).toThrow();
  });
  it('the lesson pictures build, and a wrong pair cannot be drawn as one length', () => {
    for (const [name, p] of Object.entries(LESSON_PICS)) expect(() => MapLines(p, MAPF), name).not.toThrow();
    expect(() => MapLines({ ...LESSON_PICS.TOPO!, lines: { ...LESSON_PICS.TOPO!.lines, ask: { row: 2, v: 84000 } } }, MAPF)).toThrow();
  });
});

describe('map-scale: plan', () => {
  it('walks through every sub-goal of the topic JSON, in order, each with a family', () => {
    expect(PLAN.map(p => p.id)).toEqual(TOPIC.subgoals.map((s: { id: string }) => s.id));
    for (const p of PLAN) { expect(p.families.length, p.id).toBeGreaterThan(0); for (const f of p.families) expect(GEN[f], f).toBeDefined(); }
    const fams = new Set(PLAN.flatMap(p => p.families));
    expect(fams.size).toBeGreaterThanOrEqual(25);
    for (const f of Object.keys(GEN)) expect(fams.has(f), f).toBe(true);
  });
});

describe('map-scale: families', () => {
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
        if (item.answer.kind === 'num') {
          // a slip is never accepted, and a classified slip names a catalogue id
          const v = item.check(num(item.answer.v + 1));
          expect(v.ok, item.prompt).toBe(false);
          if (v.mc) expect(CATALOG.has(v.mc), v.mc).toBe(true);
        }
        if (item.picture) expect(() => build(item.picture!.pic), `${f} ${p.id} ${item.prompt}`).not.toThrow();
        seen.add(item.prompt + '|' + item.board);
      }
      expect(seen.size, 'distinct items').toBeGreaterThan(12);
    });
  }
  it('most families draw a picture', () => {
    const withPic = Object.keys(GEN).filter(f => GEN[f]!(rng(5), 1).picture);
    expect(withPic.length / Object.keys(GEN).length).toBeGreaterThan(0.8);
  });
});

describe('map-scale: misconception probes', () => {
  const first = (f: string, sg?: string, pred: (it: MSItem) => boolean = () => true) => {
    for (let s = 1; s < 500; s++) { const it = GEN[f]!(rng(s), s, sg); if (pred(it)) return it; }
    throw new Error('no item');
  };
  it('the classic slips are named', () => {
    const vt = first('verbalTimes');
    const L = Number(/(\d+) (in|cm)<\/b> on the map/.exec(vt.prompt)![1]);
    expect(vt.check(num(L)).mc).toBe(MC.equality);
    const cm = first('customaryMi', undefined, it => it.prompt.includes('63,360'));
    const v = (cm.answer as { v: number }).v;
    expect(cm.check(num(v * 12)).mc).toBe(MC.omitMiddle);
    const ft = first('customaryFt');
    expect(ft.check(num((ft.answer as { v: number }).v * 12)).mc).toBe(MC.relabel);
    const mv = first('mapFromVerbal');
    const s = Number(/= <b class="b">(\d+) mi/.exec(mv.prompt)![1]), Lm = (mv.answer as { v: number }).v;
    expect(mv.check(num(Lm * s * s)).mc).toBe(MC.wrongOp);
    const es = first('errorScale');
    expect(es.check(num(0)).mc).toBe(MC.exactScale);
    const re = first('rangeEdge');
    expect(re.check(num(Number(/<b class="a">([\d.]+) /.exec(re.prompt)![1]))).mc).toBe(MC.exact);
  });
});

describe('map-scale: voice', () => {
  it('spoken lines have no digits or symbols', () => {
    expect(Object.keys(LINES).length).toBeGreaterThan(30);
    for (const [id, l] of Object.entries(LINES)) expect(/[0-9=÷×%$<>]/.test(l.text), `${id}: ${l.text}`).toBe(false);
  });
  it('every voice id the page uses exists', () => {
    const src = fs.readFileSync('pages/lessons/map-scale.ts', 'utf8');
    const ids = [...src.matchAll(/(?:voiced|voicedFb|say)\('([a-z0-9.]+)'/gi)].map(m => m[1]!);
    expect(ids.length).toBeGreaterThan(8);
    // ids built at run time (steps, feedback tables, callbacks)
    const dyn = [0, 1, 2, 3].map(i => `e.step${i}`).concat([1, 2, 3].map(i => `p.c${i}`), [...src.matchAll(/id: '([a-z0-9.]+)'/gi)].map(m => m[1]!), [...src.matchAll(/why: '(q\.cb\.[a-z]+)'/g)].map(m => m[1]!), ['q.cb.none']);
    for (const id of [...ids, ...dyn]) expect(LINES[id], id).toBeDefined();
  });
});

describe('quality layer (regressions)', () => {
  it('sameRoad: the answer is exact in hundredths (no 0.8333… in with no rounding asked)', async () => {
    const { GENERATORS: G } = await import('../src/lesson/topics/map-scale/items');
    const { rng } = await import('../src/lesson/runtime/item');
    for (let s = 1; s <= 600; s++) {
      const it0 = G.sameRoad(rng(s * 29 + 3), s, 'compare-denominators');
      const v = (it0.answer as { v: number }).v;
      expect(Math.abs(v * 100 - Math.round(v * 100)), it0.prompt).toBeLessThan(1e-9);
    }
  });
  it('explain: the steps end on the unit asked (mm or cm) and read big numbers with every comma', async () => {
    const { GENERATORS: G } = await import('../src/lesson/topics/map-scale/items');
    const { explain } = await import('../src/lesson/topics/map-scale/explain');
    const { rng } = await import('../src/lesson/runtime/item');
    for (let s = 1; s <= 200; s++) for (const [f, sg] of [['rulerMm', 'ruler-subdivisions'], ['customaryFt', 'customary-route'], ['metricRoute', 'metric-route']] as const) {
      const it0 = G[f](rng(s * 31 + 1), s, sg), ex = explain(it0)!;
      expect(ex.result, it0.prompt).toEqual(it0.answer);
    }
  });
});
