// lesson-exponential-functions: the generic checks (every family x every sub-goal it serves x 300 seeds). Add topic checks below.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { rng } from '../src/lesson/runtime/item';
import { GENERATORS } from '../src/lesson/topics/exponential-functions/items';
import { PLAN } from '../src/lesson/topics/exponential-functions/plan';

const TOPIC = { subgoals: [...new Map(["secondary-t6-13-exponential-functions-and-growth-decay"].flatMap(i => JSON.parse(fs.readFileSync(`../math-curriculum-essentials/topics/${i}.json`, 'utf8')).subgoals).map((s: { id: string }) => [s.id, s] as const)).values()] };
const CATALOG = new Set<string>(JSON.parse(fs.readFileSync('../math-curriculum-essentials/misconceptions.json', 'utf8')).misconceptions.map((m: { id: string }) => m.id));
const GEN = GENERATORS as Record<string, (R: () => number, n: number, sg?: string) => import('../src/lesson/runtime/item').Item>;

describe('exponential-functions: plan', () => {
  it('walks through every sub-goal of the topic JSON, in order, each with a family', () => {
    expect(PLAN.map(p => p.id)).toEqual(TOPIC.subgoals.map((s: { id: string }) => s.id));
    for (const p of PLAN) { expect(p.families.length, p.id).toBeGreaterThan(0); for (const f of p.families) expect(GEN[f], f).toBeDefined(); }
  });
});

describe('exponential-functions: families', () => {
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

// ---------- topic checks ----------
import { beforeAll } from 'vitest';
import { diffs, firstOver, kind, nH, nearTie, pw, ratios, rnd, usd } from '../src/lesson/topics/exponential-functions/expo';
import { SCRIPT } from '../src/lesson/topics/exponential-functions/script';
import type { Item } from '../src/lesson/runtime/item';
import { stepsFrom } from '../src/lesson/runtime/explain';
import type { Pic } from '../src/lesson/topics/exponential-functions/pictures';

describe('exponential-functions: maths', () => {
  it('values, ratios, the exact ratio test', () => {
    expect([0, 1, 2, 3].map(t => pw(1000, 1.1, t))).toEqual([1000, 1100, 1210, 1331]);
    expect(pw(24000, 0.8, 2)).toBe(15360);
    expect(ratios([3, 6, 12, 24])).toEqual([2, 2, 2]);
    expect(diffs([1000, 1100, 1210])).toEqual([100, 110]);
    expect(kind([3, 6, 12, 24])).toBe('exponential');
    expect(kind([3, 6, 9, 12])).toBe('linear');
    expect(kind([1, 4, 9, 16])).toBe('neither');
    expect(kind([100, 150, 225.1])).toBe('neither');
    expect(kind([625, 500, 400, 320])).toBe('exponential');
    expect(firstOver(t => 0.01 * 2 ** t, t => 1000 * t + 1000)).toBe(22);
    expect(rnd(1000 * 1.1 ** 20, 2)).toBe(6727.5);
    expect(nearTie(2.345, 2)).toBe(true);
    expect(nearTie(2.3449, 3)).toBe(false);
  });
  it('formats', () => {
    expect(nH(24000)).toBe('24,000');
    expect(nH(-3.5)).toBe('−3.5');
    expect(usd(1464.1)).toBe('$1,464.10');
    expect(usd(1331)).toBe('$1,331');
  });
});

describe('exponential-functions: voice', () => {
  it('every panel line has a spoken text without digits or symbols, and lines.json matches', () => {
    const lines = JSON.parse(fs.readFileSync('pages/lessons/exponential-functions/voice/lines.json', 'utf8')) as Record<string, { text: string }>;
    for (const [id, L] of Object.entries(SCRIPT)) {
      expect(L.say, id).not.toMatch(/[0-9$%×÷=<>]/);
      expect(lines[id]?.text, id).toBe(L.say);
    }
  });
});

describe('exponential-functions: pictures and steps', () => {
  let planeOf: typeof import('../src/lesson/topics/exponential-functions/pictures').planeOf;
  let tableOf: typeof import('../src/lesson/topics/exponential-functions/pictures').tableOf;
  let frame: typeof import('../src/blocks/block').frame, dusk: import('../src/core/theme').Theme;
  beforeAll(async () => {
    (globalThis as unknown as { document: unknown }).document = { createElement: () => ({ getContext: () => null }) };
    ({ planeOf, tableOf } = await import('../src/lesson/topics/exponential-functions/pictures'));
    ({ frame } = await import('../src/blocks/block'));
    ({ dusk } = await import('../src/lesson/dusk'));
  });
  it('the steps end on the answer, and the practice pictures lay out', () => {
    const MF = frame(60, 70, 940, 940), BD = frame(1256, 90, 588, 640);
    let pics = 0, bad = 0, withPic = 0, total = 0;
    const fails: string[] = [];
    for (const p of PLAN) for (const f of p.families) for (let s = 1; s <= 60; s++) {
      const it = GEN[f]!(rng(s * 13 + 1), s, p.id) as Item & { picture?: Pic };
      const ex = stepsFrom(it);
      expect(ex, `${f}: steps give an answer`).not.toBeNull();
      const r = ex!.result, a = it.answer;
      if (a.kind === 'num' && r.kind === 'num') expect(Math.abs(r.v - a.v), `${f} ${it.solution.join(' | ')}`).toBeLessThan(1e-6);
      else if (a.kind === 'pair' && r.kind === 'pair') expect([r.x, r.y], `${f} ${it.solution.join(' | ')}`).toEqual([a.x, a.y]);
      else expect(r, `${f} ${it.solution.join(' | ')}`).toEqual(a);
      total++;
      const pic = it.picture;
      if (!pic || (!pic.t && !pic.g)) continue;
      withPic++;
      if (pic.g) { pics++; try { planeOf(pic.g, MF, dusk); } catch (e) { bad++; if (fails.length < 10) fails.push(`${f} plane: ${(e as Error).message}`); } }
      if (pic.t) { pics++; try { tableOf(pic.t, pic.g ? BD : MF, dusk, !!pic.g); } catch (e) { bad++; if (fails.length < 10) fails.push(`${f} table: ${(e as Error).message}`); } }
    }
    expect(withPic / total, 'most items have a picture').toBeGreaterThan(0.5);
    expect(bad / pics, fails.join('\n')).toBeLessThan(0.02);
  });
});

describe('exponential-functions: misconception probes', () => {
  const first = (f: string, sg: string, pred: (it: Item) => boolean = () => true) => { for (let s = 1; s < 600; s++) { const it = GEN[f]!(rng(s), s, sg); if (pred(it)) return it; } throw new Error('no item ' + f); };
  const num = (v: number) => ({ kind: 'num' as const, v });
  it('adding the first change is the constant-amount slip', () => {
    const it = first('continueTable', 'repeated-factor');
    const pic = (it as Item & { picture: Pic }).picture.t!;
    const v = pic.cols[0]!.vals.slice(0, 4).map(s => Number(s!.replace(/,/g, '')));
    const T = pic.ts.length - 1;
    expect(it.check(num(v[3]! + (v[1]! - v[0]!) * (T - 3))).mc).toBe('mc.exponential-log.constant-factor-as-constant-amount');
  });
  it('simple vs compound: 0 is the adds-successive-percent slip', () => {
    expect(first('simpleVsCompound', 'percent-situations').check(num(0)).mc).toBe('mc.percent.adds-successive-percent-changes');
  });
  it('the rate as the factor', () => {
    const it = first('pctToFactor', 'factor-percent', x => /grows by 4%/.test(x.prompt));
    expect(it.check(num(0.04)).mc).toBe('mc.exponential-log.factor-confused-with-rate');
    expect(it.check(num(1.04)).ok).toBe(true);
  });
  it('b^2 for steps of 2 ignores the input gap', () => {
    const it = first('stepTwo', 'equal-intervals', x => (x.answer as { v: number }).v === 3);
    expect(it.check(num(9)).mc).toBe('mc.linear-functions.raw-output-ratios-ignore-input-gaps');
  });
  it('two points: the ratio is not the per-step factor', () => {
    const it = first('twoPt', 'two-point-factor', x => /\(0, 100\) and \(2, 900\)/.test(x.prompt));
    expect(it.check(num(9)).mc).toBe('mc.exponential-log.multi-period-factor-as-per-unit');
    expect(it.check(num(4.5)).mc).toBe('mc.exponential-log.divides-instead-of-root-for-factor');
  });
  it('compounding: the annual rate per period and the period count', () => {
    const it = first('compoundBalance', 'periodic-compounding', x => /monthly/.test(x.prompt));
    const m = it.prompt.match(/\$([\d,]+) .*?([\d.]+)% per year.*?after (\d+) years/)!;
    const P = Number(m[1]!.replace(/,/g, '')), r = Number(m[2]) / 100, t = Number(m[3]);
    expect(it.check(num(rnd(P * (1 + r) ** (12 * t), 2))).mc).toBe('mc.exponential-log.annual-rate-per-period');
    expect(it.check(num(rnd(P * (1 + r / 12) ** t, 2))).mc).toBe('mc.exponential-log.compounding-period-count-omitted-or-reversed');
  });
  it('evaluating (ab)^t is the exponent-on-wrong-part slip', () => {
    const it = first('evalModel', 'model-form', x => /<i>f<\/i>\(<i>t<\/i>\) = 3 · 2<sup>/.test(x.prompt) && /f<\/i>\(3\)/.test(x.prompt));
    expect(it.check(num(216)).mc).toBe('mc.exponential-log.exponent-on-wrong-part');
    expect(it.check(num(24)).ok).toBe(true);
  });
});
