// lesson-units-and-quantities: the generic checks (every family x every sub-goal it serves x 300 seeds). Add topic checks below.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { rng } from '../src/lesson/runtime/item';
import { GENERATORS } from '../src/lesson/topics/units-and-quantities/items';
import { PLAN } from '../src/lesson/topics/units-and-quantities/plan';

const TOPIC = { subgoals: [...new Map(["secondary-t6-02-reasoning-with-units-and-quantities"].flatMap(i => JSON.parse(fs.readFileSync(`../math-curriculum-essentials/topics/${i}.json`, 'utf8')).subgoals).map((s: { id: string }) => [s.id, s] as const)).values()] };
const CATALOG = new Set<string>(JSON.parse(fs.readFileSync('../math-curriculum-essentials/misconceptions.json', 'utf8')).misconceptions.map((m: { id: string }) => m.id));
const GEN = GENERATORS as Record<string, (R: () => number, n: number, sg?: string) => import('../src/lesson/runtime/item').Item>;

describe('units-and-quantities: plan', () => {
  it('walks through every sub-goal of the topic JSON, in order, each with a family', () => {
    expect(PLAN.map(p => p.id)).toEqual(TOPIC.subgoals.map((s: { id: string }) => s.id));
    for (const p of PLAN) { expect(p.families.length, p.id).toBeGreaterThan(0); for (const f of p.families) expect(GEN[f], f).toBeDefined(); }
  });
});

describe('units-and-quantities: families', () => {
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

// ---------- topic checks: the maths of units.ts and misconception probes ----------
import { agreePlace, cToF, fToC, fmt, interval, report, roundsTo } from '../src/lesson/topics/units-and-quantities/units';
type Gen = (R: () => number, n: number, sg?: string) => import('../src/lesson/runtime/item').Item & { picture?: Record<string, unknown> };
const G = GENERATORS as unknown as Record<string, Gen>;
/** the first item of a family (over seeds) that matches a test */
function find(fam: string, ok: (it: ReturnType<Gen>) => boolean, sg?: string): ReturnType<Gen> {
  for (let s = 1; s < 3000; s++) { const it = G[fam]!(rng(s), s, sg); if (ok(it)) return it; }
  throw new Error(`no ${fam} item found`);
}
const pl = (it: { prompt: string }) => it.prompt.replace(/<[^>]+>/g, '');
const numOf = (it: ReturnType<Gen>) => (it.answer as { v: number }).v;

describe('units-and-quantities: maths', () => {
  it('rounding intervals: half a step either side, halfway rounds up', () => {
    expect(interval(4.3, 0.1)[0]).toBeCloseTo(4.25); expect(interval(4.3, 0.1)[1]).toBeCloseTo(4.35);
    expect(roundsTo(4.25, 4.3, 0.1)).toBe(true); expect(roundsTo(4.35, 4.3, 0.1)).toBe(false); expect(roundsTo(4.349, 4.3, 0.1)).toBe(true);
  });
  it('reports keep only the digits a range agrees on (the topic JSON audit key: 0.10 mi)', () => {
    expect(report(0.1, agreePlace(2 * 2.95 / 60, 2 * 3.05 / 60)!)).toBe('0.10');
    expect(report(3, agreePlace(11.95 / 4, 12.05 / 4)!)).toBe('3.0');
    expect(report(8.4 * 2.54, agreePlace(8.35 * 2.54, 8.45 * 2.54)!)).toBe('21');
    // regression (walk round 1): a range that straddles a tenth but agrees at the hundredth reported "about 0 mi"
    expect(report(0.15, agreePlace(3 * 2.95 / 60, 3 * 3.05 / 60)!)).toBe('0.15');
    // regression (oracle sweep): the open upper end on a rounding boundary is excluded: 2.13 <= true < 2.15 -> 2.1
    expect(report(2.14, agreePlace(2.13, 2.15)!)).toBe('2.1');
    for (let s = 1; s <= 300; s++) { const it = G.audit!(rng(s), s); expect(/about 0 mi/.test(it.prompt), it.prompt).toBe(false); }
  });
  it('temperature: readings carry the offset, F and C round-trip', () => {
    expect(cToF(20)).toBe(68); expect(cToF(-40)).toBe(-40); expect(fToC(212)).toBeCloseTo(100);
  });
  it('formats numbers with thousands commas and no float noise', () => { expect(fmt(158400)).toBe('158,400'); expect(fmt(0.1 + 0.2)).toBe('0.3'); expect(fmt(3, 1)).toBe('3.0'); });
});

describe('units-and-quantities: misconception probes', () => {
  const mcOf = (it: ReturnType<Gen>, v: number) => it.check({ kind: 'num', v }).mc;
  it('upside-down unit factor', () => {
    const it = find('convert', x => / ft to inches\./.test(pl(x)));
    const v = Number(/([\d.,]+) ft/.exec(it.prompt.replace(/<[^>]+>/g, ''))![1]!.replace(/,/g, ''));
    expect(mcOf(it, v / 12)).toBe('mc.measurement-units.unit-factor-upside-down');
  });
  it('linear factor for an area, and for a volume', () => {
    const a = find('areaConvert', x => /ft² to in²/.test(pl(x)));
    expect(mcOf(a, numOf(a) / 12)).toBe('mc.measurement-units.linear-factor-for-area');
    const v = find('areaConvert', x => /yd³ to ft³/.test(pl(x)));
    expect(mcOf(v, numOf(v) / 9)).toBe('mc.measurement-units.linear-factor-for-area');
  });
  it('a temperature change converted with the offset', () => {
    const it = find('tempChange', x => /°F did it rise/.test(x.prompt));
    expect(mcOf(it, numOf(it) + 32)).toBe('mc.measurement-units.temperature-change-with-offset');
  });
  it('a rate converted on one unit only', () => {
    const it = find('rateConvert', x => /mi\/h/.test(x.prompt) && /ft\/s/.test(x.prompt));
    const v = Number(/(\d+) mi\/h/.exec(it.prompt.replace(/<[^>]+>/g, ''))![1]);
    expect(mcOf(it, v * 5280)).toBe('mc.measurement-units.converts-one-unit-of-rate');
  });
  it('unweighted average of two speeds over equal distances', () => {
    const it = find('avgSpeed', x => /the same/.test(x.prompt));
    const [a, b] = [...it.prompt.replace(/<[^>]+>/g, '').matchAll(/(\d+) mi\/h/g)].map(m => Number(m[1]));
    expect(mcOf(it, (a! + b!) / 2)).toBe('mc.statistics.unweighted-average');
    expect(numOf(it)).toBeCloseTo((2 * a! * b!) / (a! + b!));
  });
  it('mismatched time units in rate x time, and unconverted inputs in a formula', () => {
    const it = find('rateTime', x => /cyclist/.test(x.prompt));
    const [r, t] = [/(\d+) mi\/h/, /(\d+) min/].map(re => Number(re.exec(it.prompt.replace(/<[^>]+>/g, ''))![1]));
    expect(mcOf(it, r! * t!)).toBe('mc.measurement-units.combine-mismatched-units');
    const f = find('formulaUnits', x => /keeps/.test(x.prompt));
    const [r2, t2] = [/(\d+) mi\/h/, /(\d+) min/].map(re => Number(re.exec(f.prompt.replace(/<[^>]+>/g, ''))![1]));
    expect(mcOf(f, r2! * t2!)).toBe('mc.measurement-units.uses-unconverted-inputs-in-unit-specific-formula');
  });
  it('rounding bounds with a whole step, and the recorded value as exact', () => {
    const it = find('boundsDec', x => /scale reads/.test(x.prompt));
    const v = Number(/([\d.]+) lb/.exec(it.prompt.replace(/<[^>]+>/g, ''))![1]);
    expect(it.check({ kind: 'pair', x: v - 0.1, y: v + 0.1 }).mc).toBe('mc.measurement-units.uncertainty-whole-increment');
    expect(it.check({ kind: 'pair', x: v, y: v }).mc).toBe('mc.measurement-units.measurement-treated-as-exact');
    expect(it.check({ kind: 'pair', x: v - 0.05, y: v + 0.05 }).ok).toBe(true);
  });
  it('adding feet and inches without converting', () => {
    const it = find('addMixed', x => /\d ft and \d+ in\b/.test(pl(x)));
    const [a, b] = [/(\d+) ft/, /(\d+) in/].map(re => Number(re.exec(it.prompt.replace(/<[^>]+>/g, ''))![1]));
    expect(mcOf(it, a! + b!)).toBe('mc.measurement-units.adds-lengths-without-matching-units');
  });
  it('every picture is plain data the page can draw', () => {
    for (const p of PLAN) for (const f of p.families) for (let s = 1; s <= 40; s++) {
      const pic = G[f]!(rng(s * 13 + 1), s, p.id).picture;
      if (pic) expect(() => JSON.stringify(pic)).not.toThrow();
    }
  });
});
