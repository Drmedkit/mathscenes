// lesson-probability-decisions: the generic checks (every family x every sub-goal it serves x 300 seeds). Add topic checks below.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { rng } from '../src/lesson/runtime/item';
import { GENERATORS } from '../src/lesson/topics/probability-decisions/items';
import { PLAN } from '../src/lesson/topics/probability-decisions/plan';

const TOPIC = { subgoals: [...new Map(["secondary-t8-20-using-probability-for-decisions"].flatMap(i => JSON.parse(fs.readFileSync(`../math-curriculum-essentials/topics/${i}.json`, 'utf8')).subgoals).map((s: { id: string }) => [s.id, s] as const)).values()] };
const CATALOG = new Set<string>(JSON.parse(fs.readFileSync('../math-curriculum-essentials/misconceptions.json', 'utf8')).misconceptions.map((m: { id: string }) => m.id));
const GEN = GENERATORS as Record<string, (R: () => number, n: number, sg?: string) => import('../src/lesson/runtime/item').Item>;

describe('probability-decisions: plan', () => {
  it('walks through every sub-goal of the topic JSON, in order, each with a family', () => {
    expect(PLAN.map(p => p.id)).toEqual(TOPIC.subgoals.map((s: { id: string }) => s.id));
    for (const p of PLAN) { expect(p.families.length, p.id).toBeGreaterThan(0); for (const f of p.families) expect(GEN[f], f).toBeDefined(); }
  });
});

describe('probability-decisions: families', () => {
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
        seen.add(item.prompt + '|' + item.board + '|' + (item.choices ?? []).join('|') + '|' + JSON.stringify(item.picture ?? {}));
      }
      expect(seen.size, 'distinct items').toBeGreaterThan(12);
    });
  }
});

// ---------- topic checks ----------
import { SCRIPT } from '../src/lesson/topics/probability-decisions/script';
import { MC, evOf, sdOf } from '../src/lesson/topics/probability-decisions/common';
import { explain } from '../src/lesson/topics/probability-decisions/explain';
import { plain, type Response } from '../src/lesson/runtime/item';

type It = import('../src/lesson/topics/probability-decisions/common').PItem;
const LINES_JSON = JSON.parse(fs.readFileSync('pages/lessons/probability-decisions/voice/lines.json', 'utf8')) as Record<string, { text: string }>;
const ALL = PLAN.flatMap(p => p.families.map(f => [p.id, f] as const));
const each = (fn: (it: It, f: string, s: number) => void, seeds = 200) => {
  for (const [sg, f] of ALL) for (let s = 1; s <= seeds; s++) fn(GEN[f]!(rng(s * 97 + 3), s, sg) as It, f, s);
};
const money = (s: string) => Number(s.replace(/[$,]/g, '').replace('−', '-'));

describe('probability-decisions: voice and the lesson anchors', () => {
  it('lines.json matches script.ts, spoken text has no digits or symbols', () => {
    expect(Object.keys(LINES_JSON).sort()).toEqual(Object.keys(SCRIPT).sort());
    for (const [k, v] of Object.entries(SCRIPT)) { expect(LINES_JSON[k]!.text, k).toBe(v.say); expect(v.say, k).not.toMatch(/[0-9%=|/×÷<>$]/); }
  });
  it('the anchors: phone plan, club fundraiser, changeover, splitting the stake', () => {
    expect(evOf({ xs: [-300, 0], ps: [0.15, 0.85] })).toBeCloseTo(-45, 9);
    expect(evOf({ xs: [2000, -500], ps: [0.8, 0.2] })).toBeCloseTo(1500, 9);
    expect((2000 - 1400) / (2000 + 500)).toBeCloseTo(0.24, 12);
    expect([0.1, 0.2, 0.3, 0.4].map(p => Math.round((1 - p) * 2000 - p * 500))).toEqual([1750, 1500, 1250, 1000]);
    const one = { xs: [-200, 600], ps: [0.5, 0.5] }, split = { xs: [-200, 200, 600], ps: [0.25, 0.5, 0.25] };
    expect(evOf(one)).toBe(200); expect(evOf(split)).toBe(200);
    expect(sdOf(one)).toBeCloseTo(400, 9); expect(sdOf(split)).toBeCloseTo(Math.sqrt(80000), 9);
  });
});

describe('probability-decisions: items are exact, clean and fair', () => {
  it('answers are finite, money answers are whole cents, pairs are low-high', () => {
    each((it, f) => {
      const a = it.answer;
      if (a.kind === 'num') { expect(Number.isFinite(a.v), f).toBe(true); if (!/decimal/.test(it.prompt)) expect(Math.abs(a.v * 100 - Math.round(a.v * 100)), `${f} ${a.v}`).toBeLessThan(1e-6); }
      if (a.kind === 'pair') expect(a.x <= a.y, f).toBe(true);
    });
  });
  it('plain text: no "+ −", no "1 dollars", the right article, no broken values', () => {
    each((it, f) => {
      const txt = [it.prompt, ...(it.choices ?? []), ...it.solution].map(plain).join(' \n ');
      expect(txt, f).not.toMatch(/\+\s*[-−]\s*\$?\d/);
      expect(txt, f).not.toMatch(/(^|[^\d.,])1 dollars/);
      expect(txt, `${f}: ${txt}`).not.toMatch(/\b[Aa] \$?(8|11|18)(\d{2})?(\d{3})?(?![\d.,])/);
      expect(txt, `${f}: ${txt}`).not.toMatch(/\b[Aa]n \$?(?!8|11|18)\d/);
      expect(txt, f).not.toMatch(/undefined|NaN|Infinity|\[object/);
    }, 120);
  });
  it('the step-by-step card has 2-5 steps and ends on the answer', () => {
    each((it, f) => {
      const ex = explain(it);
      expect(ex, f).not.toBeNull();
      expect(ex!.steps.length, f).toBeGreaterThanOrEqual(2);
      expect(ex!.steps.length, `${f} ${ex!.steps.join(' | ')}`).toBeLessThanOrEqual(5);
      expect(it.check(ex!.result).ok, `${f} ${JSON.stringify(ex!.result)}`).toBe(true);
    }, 80);
  });
  it('no two choices name the same amount (the keyed helper drops secretly-right twins)', () => {
    each((it, f) => {
      if (!it.choices) return;
      const nums = it.choices.filter(c => /^[−-]?\$?[\d,]+(\.\d+)?$/.test(c.trim())).map(money);
      expect(new Set(nums).size, `${f} ${it.choices.join(' | ')}`).toBe(nums.length);
    }, 600);
  });
  it('payoff distributions in pictures add to 1; warranties cost well under the product', () => {
    each((it, f) => {
      for (const p of (it.picture?.pics ?? []) as { kind: string; ps?: (number | null)[]; reveal?: { ps?: (number | null)[] } }[]) {
        if (p.kind !== 'bars') continue;
        const ps = p.ps!.map((v, i) => v ?? p.reveal?.ps?.[i] ?? 0);
        expect(ps.reduce((a, b) => a + b, 0), f).toBeCloseTo(1, 9);
      }
      const m = plain(it.prompt).match(/an? \$([\d,]+) (phone|laptop|TV)[^.]*?plan (?:for|costs) \$([\d,]+)/);
      if (m) expect(money(m[3]!), f).toBeLessThan(money(m[1]!) / 2);
    });
  });
  it('a "which is better" choice states its rule', () => {
    each((it, f) => { if (['ruleGain', 'ruleCost', 'sdPick', 'prefConstraint'].includes(f)) expect(it.prompt, f).toMatch(/rule/i); }, 60);
  });
});

describe('probability-decisions: the main slips are diagnosed', () => {
  const probe = (f: string, wrong: (it: It) => Response | null, mc: string, min = 15) => {
    let hits = 0;
    for (let s = 1; s <= 150; s++) { const it = GEN[f]!(rng(s * 13 + 1), s) as It; const r = wrong(it); if (!r) continue; const v = it.check(r); if (!v.ok && v.mc === mc) hits++; }
    expect(hits, `${f} -> ${mc}`).toBeGreaterThan(min);
  };
  const nums = (it: It) => [...plain(it.prompt).matchAll(/\$([\d,]+(?:\.\d+)?)/g)].map(m => money(m[1]!));
  it('expected value slips', () => {
    probe('evRoutes', it => { const p = plain(it.prompt), N = money(p.match(/all ([\d,]+) raffle/)![1]!), x = nums(it), k = Number(p.match(/and (\d+) others/)![1]); return { kind: 'num', v: Math.round(((x[1]! + k * x[2]!) / N) * 100) / 100 }; }, MC.revenue);
    probe('evInsureCost', it => { const [Pm, d] = nums(it); return { kind: 'num', v: Pm! + d! }; }, MC.dedEvery);
    probe('fairPrice', it => { const v = (it.answer as { v: number }).v, c = nums(it)[0]!; return Math.abs(c - v) < 0.01 ? null : { kind: 'num', v: Math.round((2 * c - v) * 100) / 100 }; }, MC.wrongDir, 10);
    probe('evNet', it => { const xs = (it.picture!.pics[0] as { xs: number[] }).xs; return { kind: 'num', v: Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 100) / 100 }; }, MC.unweighted, 10);
  });
  it('net payoff and insurance slips', () => {
    probe('netTicket', it => (/is not drawn|misses/.test(it.prompt) && /Jay|player/.test(it.prompt) && !/booth\S* net/.test(plain(it.prompt)) ? { kind: 'num', v: 0 } : null), MC.onlyOnWins, 5);
    probe('netInsure', it => (/with the policy if nothing happens/.test(plain(it.prompt)) ? { kind: 'num', v: -(nums(it)[0]! + nums(it)[1]!) } : null), MC.dedEvery, 5);
    probe('planTotal', it => { const [m, D, , B] = nums(it); const r = Number(plain(it.prompt).match(/(\d+)% coinsurance/)![1]) / 100; return B! > D! ? { kind: 'num', v: 12 * m! + r * B! } : null; }, MC.coinsFirst, 10);
    probe('planTotal', it => { const [m, D, Mx, B] = nums(it); const r = Number(plain(it.prompt).match(/(\d+)% coinsurance/)![1]) / 100; return D! + r * (B! - D!) > Mx! ? { kind: 'num', v: 12 * m! + D! + r * (B! - D!) } : null; }, MC.cap, 10);
  });
  it('distribution and SD slips', () => {
    probe('distDie', it => { const t = it.picture!.pics[0] as { rows: { cells: string[] }[] }; const c = nums(it)[0]!; const k = new Set(t.rows[1]!.cells.map(x => Number(x) - c)).size; return { kind: 'frac', w: 0, n: 1, d: k }; }, MC.equiprob, 10);
    probe('sdCompute', it => { const ex = explain(it)!; const m = plain(ex.steps.join(' ')).match(/variance: ([\d,.]+)/); return m ? { kind: 'num', v: money(m[1]!) } : null; }, MC.varForSd);
  });
});

describe('probability-decisions: oracle regressions (2026-10-28)', () => {
  it('fairJudge: a dice-sum reason never compares 7 with itself; no capital after "Not fair:"', () => {
    each((it, f) => {
      if (f !== 'fairJudge') return;
      for (const c of it.choices!) { expect(c, c).not.toMatch(/sum of 7 comes from/); expect(c, c).not.toMatch(/Not fair: (A|The) /); }
    }, 600);
  });
  it('fairPrice: the current price is never already the fair price', () => {
    each((it, f) => {
      if (f !== 'fairPrice') return;
      const c = Number(plain(it.prompt).match(/charges \$([\d.]+)/)![1]);
      expect(Math.abs((it.answer as { v: number }).v - c), it.prompt).toBeGreaterThan(0.005);
    }, 600);
  });
  it('numbers of 1,000 and more carry a comma in plain text', () => {
    each((it, f) => {
      const txt = [it.prompt, ...(it.choices ?? []), ...it.solution].map(plain).join(' ');
      expect(txt, f).not.toMatch(/(?<![\d.,$])\d{4,}(?![\d.,%])/);
    }, 200);
  });
});
