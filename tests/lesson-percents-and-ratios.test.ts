// lesson-percents-and-ratios: the generic checks (every family x every sub-goal it serves x 300 seeds). Add topic checks below.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { rng } from '../src/lesson/runtime/item';
import { GENERATORS } from '../src/lesson/topics/percents-and-ratios/items';
import { PLAN } from '../src/lesson/topics/percents-and-ratios/plan';

const TOPIC = JSON.parse(fs.readFileSync('../math-curriculum-essentials/topics/primary.ratios.combine-percentage-ratio-contexts.json', 'utf8'));
const CATALOG = new Set<string>(JSON.parse(fs.readFileSync('../math-curriculum-essentials/misconceptions.json', 'utf8')).misconceptions.map((m: { id: string }) => m.id));
const GEN = GENERATORS as Record<string, (R: () => number, n: number, sg?: string) => import('../src/lesson/runtime/item').Item>;

describe('percents-and-ratios: plan', () => {
  it('walks through every sub-goal of the topic JSON, in order, each with a family', () => {
    expect(PLAN.map(p => p.id)).toEqual(TOPIC.subgoals.map((s: { id: string }) => s.id));
    for (const p of PLAN) { expect(p.families.length, p.id).toBeGreaterThan(0); for (const f of p.families) expect(GEN[f], f).toBeDefined(); }
  });
});

describe('percents-and-ratios: families', () => {
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

// ---------- topic checks: the model's maths, the lesson's fixed chains, the classifier ----------
import { MC, roundingTotals, type PRItem } from '../src/lesson/topics/percents-and-ratios/items';
import { ChainTape } from '../src/lesson/topics/percents-and-ratios/ChainTape';
import { CHAIN_FRAME, EX_CARDS, EX_CHAIN, EX_PAINT, PROVE_CHAIN, PROVE_MAYA, PROVE_TOTAL, TURN_ALMONDS, TURN_CHAIN, TURN_NUTS } from '../src/lesson/topics/percents-and-ratios/scenes';
import { money, pctOf, shareOf } from '../src/lesson/topics/percents-and-ratios/chainMaths';

describe('percents-and-ratios: maths and lesson chains', () => {
  it('every misconception id is in the catalog', () => { for (const id of Object.values(MC)) expect(CATALOG.has(id), id).toBe(true); });
  it('the lesson numbers', () => {
    expect(shareOf(240, [3, 5], 0)).toBe(90); expect(EX_PAINT).toBe(18);
    expect(EX_CARDS).toEqual({ right: 18, whole: 48, other: 28.8 });
    expect(TURN_NUTS).toBe(28); expect(TURN_ALMONDS).toBe(7);
    expect(PROVE_TOTAL).toBeCloseTo(64.8, 9); expect(PROVE_MAYA).toBeCloseTo(66.4, 9);
    expect(money(4.8)).toBe('$4.80'); expect(money(1200)).toBe('$1,200'); expect(pctOf(7.25, 200)).toBe(14.5);
  });
  it('the lesson chains lay out inside the frame (rows sum to their wholes)', () => {
    for (const ch of [EX_CHAIN, TURN_CHAIN, PROVE_CHAIN]) {
      expect(() => ChainTape(ch, CHAIN_FRAME)).not.toThrow();
      for (const row of ch.rows) if (row.zoomFrom) expect(row.zoomFrom.b - row.zoomFrom.a).toBeCloseTo(row.base, 9);
    }
    expect(EX_CHAIN.rows[1]!.pieces.reduce((s, p) => s + p.amt, 0)).toBe(90);
  });
  it('rounding items: the two policies always differ by at least a cent', () => {
    for (let s = 1; s <= 300; s++) {
      const it = GEN.rounding!(rng(s * 31 + 7), s, 'rounding-policy');
      const m = /\$([\d.]+)/.exec(it.prompt)!; const d = Number(/<b>(\d+)% off/.exec(it.prompt)![1]); const t = Number(/<b>([\d.]+)% sales tax/.exec(it.prompt)![1]);
      const T = roundingTotals(Math.round(Number(m[1]) * 100), d, Math.round(t * 100));
      expect(T.each, it.prompt).not.toBe(T.end);
    }
  });
  it('practice pictures build (they fall back to a bare board when they cannot)', () => {
    let built = 0, all = 0;
    for (const f of ['share', 'ratioPercent', 'percentRatio', 'twoChanges', 'ratioPercentRest', 'percentRatioGrow']) for (let s = 1; s <= 200; s++) {
      const it = GEN[f]!(rng(s * 13 + 5), s) as PRItem;
      if (!it.picture) continue;
      all++;
      try { ChainTape(it.picture.chain.chain, CHAIN_FRAME); built++; } catch { /* fallback */ }
    }
    expect(built / all).toBeGreaterThan(0.9);
  });
});

describe('percents-and-ratios: misconceptions are classified', () => {
  const probe = (fam: string, sg: string, guess: (it: PRItem) => number | null, mc: string) => {
    let hit = 0;
    for (let s = 1; s <= 200; s++) {
      const it = GEN[fam]!(rng(s * 17 + 3), s, sg) as PRItem;
      const v = guess(it); if (v === null) continue;
      const r = it.check({ kind: 'num', v });
      if (r.ok) continue;
      if (r.mc === mc) hit++;
    }
    expect(hit, `${fam} -> ${mc}`).toBeGreaterThan(50);
  };
  const nums = (it: PRItem) => [...it.prompt.replace(/<[^>]+>/g, '').matchAll(/\$?([\d,]+(?:\.\d+)?)/g)].map(m => Number(m[1]!.replace(/,/g, '')));
  it('ratio then percent: the percent of the whole total = wrong whole', () => {
    probe('ratioPercent', 'chain-ratio-then-percent', it => { const n = nums(it); const p = Number(/(\d+)%/.exec(it.prompt.replace(/<[^>]+>/g, ''))![1]); return pctOf(p, n[0]!); }, MC.wrongWhole);
  });
  it('two changes: adding the percents', () => {
    probe('twoChanges', 'successive-percents', it => {
      const t = it.prompt.replace(/<[^>]+>/g, ''); const P = nums(it)[0]!; const ps = [...t.matchAll(/(\d+)%/g)].map(m => Number(m[1]));
      const ups = /marks the price up/.test(t) ? [1, -1] : /drops/.test(t) ? [-1, 1] : /Lunch/.test(t) ? [1, 1] : [-1, 1];
      return P * (100 + ups[0]! * ps[0]! + ups[1]! * ps[1]!) / 100;
    }, MC.addsPercents);
  });
});
