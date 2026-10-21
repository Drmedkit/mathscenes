// original-amount: every family x every sub-goal it serves x 300 seeds gives a valid item (the answer passes, choices
// unique with exactly one right, mc ids exist), the main misconceptions are classified, the plan covers every sub-goal
// of the topic JSON in order, the reverse maths is exact (original x multiplier = new amount, rounding, checks), and
// the voiced script matches lines.json.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { rng, type Item, type Response } from '../src/lesson/runtime/item';
import { GENS, FAMILY_NAMES, type OrigPicture, sectionPct } from '../src/lesson/topics/original-amount/items';
import { PLAN } from '../src/lesson/topics/original-amount/plan';
import { LINES, SCRIPT } from '../src/lesson/topics/original-amount/script';
import {
  bp, decimal, decimalsOf, forwardC, mNum, multStr, pctNum, rateStr, receiptTotal, resultPct, reverse, toCents, usd,
} from '../src/lesson/topics/original-amount/reverseMaths';

const TOPIC = 'C:/Users/stelt/Claude code foler/math-curriculum-essentials/topics/primary.ratios.find-the-original-amount-after-a-percent-change.json';
const MC = 'C:/Users/stelt/Claude code foler/math-curriculum-essentials/misconceptions.json';
const mcIds = fs.existsSync(MC) ? new Set((JSON.parse(fs.readFileSync(MC, 'utf8')) as { misconceptions: { id: string }[] }).misconceptions.map(m => m.id)) : null;
const topic = fs.existsSync(TOPIC) ? JSON.parse(fs.readFileSync(TOPIC, 'utf8')) as { subgoals: { id: string; order: number; misconceptions: string[] }[] } : null;

const pairs = PLAN.flatMap(p => p.families.map(f => [f, p.id] as const));
const make = (f: string, sg: string, s: number): Item => GENS[f]!(rng(s * 7919 + f.length), s, sg);
const num = (v: number): Response => ({ kind: 'num', v });
const pic = (it: Item) => it.picture as unknown as OrigPicture | undefined;
const money = (s: string) => [...s.matchAll(/\$([\d,]+(?:\.\d+)?)/g)].map(m => Math.round(Number(m[1]!.replace(/,/g, '')) * 100));

describe('plan', () => {
  it('covers every sub-goal of the topic JSON, in order, each with a family that exists', () => {
    if (topic) expect(PLAN.map(p => p.id)).toEqual([...topic.subgoals].sort((a, b) => a.order - b.order).map(s => s.id));
    for (const p of PLAN) {
      expect(p.families.length).toBeGreaterThan(0);
      for (const f of p.families) { expect(GENS[f], f).toBeTypeOf('function'); expect(FAMILY_NAMES[f], f).toBeTruthy(); }
    }
    expect(new Set(PLAN.flatMap(p => p.families))).toEqual(new Set(Object.keys(GENS)));
  });
});

describe('item families', () => {
  const mcSeen = new Set<string>();
  for (const [f, sg] of pairs) {
    it(`${f} for ${sg}: 300 seeds, the answer passes, choices unique with one right, mc ids exist`, () => {
      const seen = new Set<string>();
      for (let s = 1; s <= 300; s++) {
        const it = make(f, sg, s);
        expect(it.family).toBe(f);
        expect(it.check(it.answer).ok, `${it.prompt} ${JSON.stringify(it.answer)}`).toBe(true);
        expect(it.solution.length).toBeGreaterThan(0);
        for (const t of [it.prompt, it.board, ...it.solution, ...(it.choices ?? [])]) expect(t, it.prompt).not.toMatch(/undefined|NaN|Infinity|\$-|\[object/);
        if (it.choices) {
          expect(it.choices.length, it.prompt).toBeGreaterThanOrEqual(3);
          expect(new Set(it.choices).size, it.choices.join(' | ')).toBe(it.choices.length);
          const verdicts = it.choices.map((_, i) => it.check({ kind: 'choice', i }));
          expect(verdicts.filter(v => v.ok).length, it.prompt + ' | ' + it.choices.join(' | ')).toBe(1);
          for (const v of verdicts) if (v.mc) { mcSeen.add(v.mc); if (mcIds) expect(mcIds.has(v.mc), v.mc).toBe(true); }
        } else {
          const a = it.answer;
          const probes: Response[] = a.kind === 'num' ? [num(a.v + 0.01), num(a.v / 10), num(a.v * 10), num(0)] : a.kind === 'pair' ? [{ kind: 'pair', x: a.y, y: a.x }, { kind: 'pair', x: a.x, y: a.x }] : [];
          for (const r of probes) { const v = it.check(r); expect(v.ok).toBe(false); if (v.mc && mcIds) expect(mcIds.has(v.mc), v.mc).toBe(true); }
        }
        const P = pic(it);
        if (P) {
          expect(P.tape.rows.length).toBeGreaterThanOrEqual(2);
          for (const r of P.tape.rows) expect(Number.isInteger(r.cents) && r.cents > 0, JSON.stringify(r)).toBe(true);
          for (const w of P.work) expect(w).not.toMatch(/undefined|NaN/);
        }
        seen.add(it.prompt + it.board + (it.choices ?? []).join());
      }
      expect(seen.size, f).toBeGreaterThan(40);
    });
  }
  it('every misconception the topic JSON names is produced by some family', () => {
    // run the classifier over wrong numbers too (typed families)
    const all = new Set(mcSeen);
    for (const [f, sg] of pairs) for (let s = 1; s <= 120; s++) {
      const it = make(f, sg, s);
      if (it.choices) { it.choices.forEach((_, i) => { const v = it.check({ kind: 'choice', i }); if (v.mc) all.add(v.mc); }); continue; }
      const a = it.answer;
      if (a.kind !== 'num') continue;
      const N = money(it.prompt);
      const cands = [a.v + 0.01, a.v - 0.01, ...N.map(c => c / 100)];
      for (const v of cands) { const vv = it.check(num(v)); if (vv.mc) all.add(vv.mc); }
    }
    for (const sg of topic?.subgoals ?? []) for (const mc of sg.misconceptions) {
      if (mc === 'mc.decimals.intermediate-precision-always-invalid' || mc === 'mc.decimals.truncates-instead-of-rounding') continue;   // typed: tested below
      expect(all.has(mc), `${sg.id}: ${mc}`).toBe(true);
    }
  });
});

describe('misconceptions are diagnosed', () => {
  it('reverse: adding the percent of the new amount back, dividing by the rate', () => {
    let n = 0;
    for (let s = 1; s <= 300; s++) {
      const it = make('reverse', 'reverse-percent-change', s);
      const N = money(it.prompt)[0]!;
      const m = /(\d+(?:\.\d+)?)%/.exec(it.prompt)!;
      const r = Number(m[1]);
      const down = /off|discount/.test(it.prompt);
      const opp = Math.round(N * (down ? 1 + r / 100 : 1 - r / 100));
      if (opp > 0 && opp / 100 !== (it.answer as { v: number }).v) { expect(it.check(num(opp / 100)).mc, it.prompt).toBe('mc.percent.opposite-percent-to-undo-change'); n++; }
      const byRate = Math.round((N * 100) / r);
      if (byRate / 100 !== (it.answer as { v: number }).v && byRate !== opp) expect(it.check(num(byRate / 100)).mc, it.prompt).toBe('mc.percent.divides-by-rate-to-undo-change');
    }
    expect(n).toBeGreaterThan(200);
  });
  it('rounding: cut off and rounded too early', () => {
    let tr = 0, early = 0;
    for (let s = 1; s <= 300; s++) {
      const it = make('roundOrig', 'round-to-cent', s);
      const w = /(\d+(?:\.\d+)?)%/.exec(it.prompt)!;
      const r = Number(w[1]), N = money(it.prompt)[0]!;
      const down = /off|discount/.test(it.prompt);
      const rev = reverse(N, r, down ? 'down' : 'up');
      expect(it.check(num(rev.origC / 100)).ok).toBe(true);
      if (rev.truncC !== rev.origC) { expect(it.check(num(rev.truncC / 100)).mc).toBe('mc.decimals.truncates-instead-of-rounding'); tr++; }
      const one = Math.floor((2 * N * 100 + mNum(r, rev.dir)) / (2 * mNum(r, rev.dir))) * 100;
      if (one !== rev.origC && one !== rev.truncC) { expect(it.check(num(one / 100)).mc).toBe('mc.decimals.intermediate-precision-always-invalid'); early++; }
      // more digits than cents
      const long = Number(decimalsOf(rev.oNum, rev.oDen, 4).replace(/[…,]/g, ''));
      if (toCents(long) === null) expect(it.check(num(long)).mc).toBe('mc.estimation.more-digits-more-accurate');
    }
    expect(tr).toBeGreaterThan(50); expect(early).toBeGreaterThan(50);
  });
  it('base change: the same percent back is not the original', () => {
    for (let s = 1; s <= 300; s++) {
      const it = make('addBack', 'explain-base-change', s);
      const O = money(it.prompt)[0]!;
      expect(it.check(num(O / 100)).mc).toBe('mc.percent.adds-successive-percent-changes');
      const u = make('undoPct', 'explain-base-change', s);
      const r = Number(/(\d+(?:\.\d+)?)%/.exec(u.prompt)![1]);
      expect(u.check(num(r)).mc).toBe('mc.percent.adds-successive-percent-changes');
    }
  });
  it('resulting percent: the change reported as the new amount', () => {
    for (let s = 1; s <= 300; s++) {
      const it = make('resultPct', 'change-to-resulting-percent', s);
      const r = Number(/(\d+(?:\.\d+)?)%/.exec(it.prompt.replace(/<[^>]+>/g, ''))![1]);
      expect(it.check(num(r)).mc).toBe('mc.percent.change-reported-as-final-amount');
    }
  });
});

describe('the reverse maths', () => {
  it('the topic JSON cases', () => {
    expect(reverse(4800, 20, 'down').origC).toBe(6000);
    expect(reverse(5400, 8, 'up').origC).toBe(5000);
    expect(reverse(6900, 15, 'up').origC).toBe(6000);
    expect(reverse(7500, 25, 'up').origC).toBe(6000);
    const t = reverse(5000, 6, 'up');            // $50.00 with 6% tax -> 47.1698... -> $47.17
    expect(t.exact).toBe(false); expect(t.origC).toBe(4717); expect(t.truncC).toBe(4716); expect(decimalsOf(t.oNum, t.oDen, 4)).toBe('47.1698…');
    expect(reverse(4000, 8.25, 'up').origC).toBe(3695);
    expect(reverse(3000, 35, 'down').origC).toBe(4615);
    expect(receiptTotal(4717, 6, 'up')).toBe(5000); expect(receiptTotal(4716, 6, 'up')).toBe(4999); expect(receiptTotal(4718, 6, 'up')).toBe(5001);
    expect(forwardC(4717, 6, 'up')).toBe(5000);
  });
  it('original x multiplier = new amount, exactly, for many amounts and rates', () => {
    for (let N = 1; N <= 50000; N += 97) for (const r of [1, 4, 6, 8.25, 12.5, 15, 20, 37.5, 60, 99]) for (const d of ['down', 'up'] as const) {
      const v = reverse(N, r, d);
      expect(v.oNum * v.m).toBe(N * 10000 * v.oDen);
      expect(Math.abs(v.origC * v.oDen - v.oNum)).toBeLessThanOrEqual(v.oDen / 2);
      expect(v.truncC).toBeLessThanOrEqual(v.origC);
    }
  });
  it('multipliers and percents as text', () => {
    expect(multStr(20, 'down')).toBe('0.8'); expect(multStr(6, 'up')).toBe('1.06'); expect(multStr(8.25, 'up')).toBe('1.0825'); expect(multStr(12.5, 'down')).toBe('0.875');
    expect(rateStr(20)).toBe('0.2'); expect(rateStr(6)).toBe('0.06'); expect(rateStr(8.25)).toBe('0.0825');
    expect(resultPct(8.25, 'up')).toBe(108.25); expect(resultPct(12.5, 'down')).toBe(87.5);
    expect(pctNum(8.25)).toBe('8.25'); expect(pctNum(12.5)).toBe('12.5'); expect(pctNum(20)).toBe('20');
    expect(decimal(600)).toBe('0.06'); expect(bp(8.25)).toBe(825);
    expect(usd(4717)).toBe('$47.17'); expect(usd(6000)).toBe('$60'); expect(usd(123450, true)).toBe('$1,234.50');
    expect(sectionPct(20)).toBe(20); expect(sectionPct(75)).toBe(25); expect(sectionPct(8)).toBe(0);
  });
  it('refuses what has no single original', () => {
    expect(() => reverse(0, 20, 'down')).toThrow();
    expect(() => reverse(4800, 100, 'down')).toThrow();
    expect(() => reverse(4800, 0, 'up')).toThrow();
    expect(() => reverse(4800, 8.255, 'up')).toThrow();
  });
});

describe('voice', () => {
  it('every scripted panel line has a spoken text, and lines.json is the script', () => {
    const lines = JSON.parse(fs.readFileSync('pages/lessons/original-amount/voice/lines.json', 'utf8')) as Record<string, { text: string }>;
    expect(Object.keys(lines).sort()).toEqual(Object.keys(SCRIPT).sort());
    for (const [id, l] of Object.entries(lines)) {
      expect(l.text, id).toBe(LINES[id]!.say);
      expect(l.text.length, id).toBeGreaterThan(3);
      expect(l.text, id).not.toMatch(/\d\s*\/\s*\d|[<>×÷$%]|\d\.\d|\d/);
    }
  });
});
