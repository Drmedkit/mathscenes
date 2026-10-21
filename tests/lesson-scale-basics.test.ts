// lesson-scale-basics: every family x every sub-goal it serves x 300 seeds gives a valid item (the answer passes,
// choices unique with exactly one right, misconception ids exist, a wrong number is never right, the picture builds),
// the main misconceptions are classified, the plan covers every sub-goal in order, the voice lines match the panel
// lines, the lesson pictures build, and the maths of a scale (factor, one unit, legend -> 1 : n) holds.
import { beforeAll, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { rng, type Item, type Response } from '../src/lesson/runtime/item';
import { FAMILY_NAMES, GENERATORS, MC, type SBItem } from '../src/lesson/topics/scale-basics/items';
import { PLAN } from '../src/lesson/topics/scale-basics/plan';
import { factor, legendRatio, sameUnit, toScale, reduce, tfmt } from '../src/lesson/topics/scale-basics/scaleBasicsMaths';
import { ScalePair } from '../src/lesson/topics/scale-basics/ScalePair';
import { LESSON_PICS, PF } from '../src/lesson/topics/scale-basics/lessonPics';
import { SCRIPT } from '../src/lesson/topics/scale-basics/script';
import { texReady } from '../src/core/tex';

const TOPIC = JSON.parse(fs.readFileSync('../math-curriculum-essentials/topics/primary.ratios.scale-introduction.json', 'utf8'));
const CATALOG = new Set<string>(JSON.parse(fs.readFileSync('../math-curriculum-essentials/misconceptions.json', 'utf8')).misconceptions.map((m: { id: string }) => m.id));
const GEN = GENERATORS as Record<string, (R: () => number, n: number, sg?: string) => SBItem>;
const num = (v: number): Response => ({ kind: 'num', v });
const valOf = (r: Response) => (r.kind === 'num' ? r.v : r.kind === 'frac' ? r.w + r.n / r.d : NaN);

// canvas words measure text with a 2D context; in node they fall back to an estimate
beforeAll(async () => {
  (globalThis as unknown as { document: unknown }).document = { createElement: () => ({ getContext: () => null }) };
  await texReady();
});

describe('scale-basics: maths', () => {
  it('factor, one factor for all lengths, one unit first, legend to ratio', () => {
    expect(factor(4, 32)).toBe(8);
    expect(() => factor(5, 12)).toThrow();
    expect(toScale([3, 2], [12, 8])).toBe(true);
    expect(toScale([4, 2], [12, 8])).toBe(false);
    expect(sameUnit(2, 'cm', 2, 'm').k).toBe(100);
    expect(sameUnit(3, 'in', 2, 'ft')).toEqual({ d: 3, a: 24, unit: 'in', k: 8 });
    expect(sameUnit(2, 'ft', 6, 'yd').k).toBe(9);
    expect(sameUnit(4, 'in', 1, 'yd').k).toBe(9);
    expect(legendRatio(10, 'in', 'ft')).toBe(120);
    expect(legendRatio(2, 'cm', 'm')).toBe(200);
    expect(legendRatio(1, 'in', 'yd')).toBe(36);
    expect(reduce(3, 24)).toEqual([1, 8]);
    expect(tfmt(2000)).toBe('2{,}000');
  });
  it('the lesson pictures build (labels on, nothing on a line)', () => {
    for (const [name, p] of Object.entries(LESSON_PICS)) expect(() => ScalePair(p, PF), name).not.toThrow();
  });
});

describe('scale-basics: plan', () => {
  it('walks through every sub-goal of the topic JSON, in order, each with a family', () => {
    expect(PLAN.map(p => p.id)).toEqual(TOPIC.subgoals.map((s: { id: string }) => s.id));
    for (const p of PLAN) { expect(p.families.length, p.id).toBeGreaterThan(0); for (const f of p.families) { expect(GEN[f], f).toBeDefined(); expect(FAMILY_NAMES[f], f).toBeTruthy(); } }
    expect(new Set(PLAN.flatMap(p => p.families))).toEqual(new Set(Object.keys(GENERATORS)));
  });
  it('every misconception id exists in the catalogue', () => {
    for (const id of Object.values(MC)) expect(CATALOG.has(id), id).toBe(true);
  });
});

describe('scale-basics: voice', () => {
  it('every panel line of parts 1-4 has a spoken text, and every spoken text a panel line', () => {
    const lines = JSON.parse(fs.readFileSync('pages/lessons/scale-basics/voice/lines.json', 'utf8')) as Record<string, { text: string }>;
    expect(Object.keys(lines).sort()).toEqual(Object.keys(SCRIPT).sort());
    for (const [id, l] of Object.entries(lines)) { expect(l.text.length, id).toBeGreaterThan(10); expect(l.text, id).not.toMatch(/\d|°|%|[½¼¾⅛×÷=:]|<|\$/); }
    const page = fs.readFileSync('pages/lessons/scale-basics.ts', 'utf8');
    for (const m of page.matchAll(/(?:say|fbk|ctx\.say)\((?:false, |true, |o\.ok, |ok, )?'([a-z.0-9]+)'/g)) expect(SCRIPT[m[1]!], m[1]).toBeTruthy();
  });
});

describe('scale-basics: families', () => {
  for (const p of PLAN) for (const f of p.families) {
    it(`${p.id} / ${f}: 300 seeds`, () => {
      const seen = new Set<string>();
      for (let s = 1; s <= 300; s++) {
        const item = GEN[f]!(rng(s * 31 + 7), s, p.id);
        expect(item.family).toBe(f);
        expect(item.check(item.answer).ok, `${item.prompt} ${JSON.stringify(item.answer)}`).toBe(true);
        expect(item.solution.length).toBeGreaterThan(0);
        for (const t of [item.prompt, item.board, item.work ?? '', ...item.solution, ...(item.choices ?? [])]) expect(t).not.toMatch(/undefined|NaN|Infinity|\[object/);
        if (item.choices) {
          expect(new Set(item.choices).size, item.prompt).toBe(item.choices.length);
          expect(item.choices.filter((_, i) => item.check({ kind: 'choice', i }).ok).length, item.prompt).toBe(1);
          item.choices.forEach((_, i) => { const mc = item.check({ kind: 'choice', i }).mc; if (mc) expect(CATALOG.has(mc), mc).toBe(true); });
        } else if (item.answer.kind === 'pair') {
          expect(item.check({ kind: 'pair', x: item.answer.x, y: item.answer.y + 1 }).ok).toBe(false);
        } else {
          expect(item.check(num(valOf(item.answer) + 0.37)).ok).toBe(false);
        }
        if (item.picture) expect(() => ScalePair(item.picture!.pair, PF), `${f} ${s}`).not.toThrow();
        seen.add(item.prompt + '|' + item.board + '|' + (item.choices ?? []).join());
      }
      expect(seen.size, 'distinct items').toBeGreaterThan(12);
    });
  }
});

describe('scale-basics: misconceptions are classified', () => {
  const find = (f: string, ok: (it: SBItem) => boolean): SBItem => {
    for (let s = 1; s < 2000; s++) { const it = GEN[f]!(rng(s), s); if (ok(it)) return it; }
    throw new Error('no such item');
  };
  it('a difference reported as the factor', () => {
    const it = find('timesAs', () => true);
    const k = (it.answer as { v: number }).v, D = Number(/actual [^<]*<b class="b">([\d,]+)/.exec(it.prompt)![1]!.replace(/,/g, '')), d = D / k;
    expect(it.check(num(D - d)).mc).toBe(MC.diff);
  });
  it('lengths in different units compared as they are', () => {
    const it = find('sameUnit', x => /2 cm<\/b>[^]*2 m</.test(x.prompt));
    expect(it.check(num(1)).mc).toBe(MC.unlike);
  });
  it('a legend rate taken as the ratio', () => {
    const it = find('legendToRatio', x => (x.answer as { v: number }).v === 120);
    expect(it.check(num(10)).mc).toBe(MC.notConverted);
  });
  it('the scale number taken as a length', () => {
    const it = find('useFactor', () => true);
    const N = Number(/1 : ([\d,]+)/.exec(it.prompt)![1]!.replace(/,/g, ''));
    expect(it.check(num(N)).mc).toBe(MC.nAsLength);
  });
  it('the scale read the wrong way round', () => {
    const it = find('writeScale', () => true);
    const N = (it.answer as { y: number }).y;
    expect(it.check({ kind: 'pair', x: N, y: 1 }).mc).toBe(MC.reverse);
  });
  it('the larger-over-smaller factor going back from actual to drawing', () => {
    const it = find('direction', x => x.input === 'frac');
    const N = (it.answer as { d: number }).d;
    expect(it.check({ kind: 'frac', w: N, n: 0, d: 1 }).mc).toBe(MC.bigOverSmall);
  });
  it('only one pair of lengths checked', () => {
    const it = find('scaleCheck', x => !!x.choices && x.choices.some(c => c.startsWith('Yes: × ') && c.endsWith('so it is to scale.')));
    const i = it.choices!.findIndex(c => c.endsWith('so it is to scale.'));
    expect(it.check({ kind: 'choice', i }).mc).toBe(MC.fewChecks);
  });
  void ({} as Item);
});
