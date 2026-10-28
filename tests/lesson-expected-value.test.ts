// lesson-expected-value: the generic checks (every family x every sub-goal it serves x 300 seeds). Add topic checks below.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { rng } from '../src/lesson/runtime/item';
import { GENERATORS } from '../src/lesson/topics/expected-value/items';
import { PLAN } from '../src/lesson/topics/expected-value/plan';

const TOPIC = { subgoals: [...new Map(["secondary-t8-19-expected-value-and-probability-distributions"].flatMap(i => JSON.parse(fs.readFileSync(`../math-curriculum-essentials/topics/${i}.json`, 'utf8')).subgoals).map((s: { id: string }) => [s.id, s] as const)).values()] };
const CATALOG = new Set<string>(JSON.parse(fs.readFileSync('../math-curriculum-essentials/misconceptions.json', 'utf8')).misconceptions.map((m: { id: string }) => m.id));
const GEN = GENERATORS as Record<string, (R: () => number, n: number, sg?: string) => import('../src/lesson/runtime/item').Item>;

describe('expected-value: plan', () => {
  it('walks through every sub-goal of the topic JSON, in order, each with a family', () => {
    expect(PLAN.map(p => p.id)).toEqual(TOPIC.subgoals.map((s: { id: string }) => s.id));
    for (const p of PLAN) { expect(p.families.length, p.id).toBeGreaterThan(0); for (const f of p.families) expect(GEN[f], f).toBeDefined(); }
  });
});

describe('expected-value: families', () => {
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
import { SCRIPT } from '../src/lesson/topics/expected-value/script';
import { MC } from '../src/lesson/topics/expected-value/common';
import { binomP, evQ, geoP, nCk, poisP, possibleTotals, qeq, runningMeans } from '../src/lesson/topics/expected-value/ev';
import { torque } from '../src/lesson/topics/expected-value/DistPic';
import { gcd, type Response } from '../src/lesson/runtime/item';

type It = import('../src/lesson/topics/expected-value/common').DItem;
const LINES_JSON = JSON.parse(fs.readFileSync('pages/lessons/expected-value/voice/lines.json', 'utf8')) as Record<string, { text: string }>;
const ALL = PLAN.flatMap(p => p.families.map(f => [p.id, f] as const));
const each = (fn: (it: It, f: string, s: number) => void, seeds = 200) => {
  for (const [sg, f] of ALL) for (let s = 1; s <= seeds; s++) fn(GEN[f]!(rng(s * 97 + 3), s, sg) as It, f, s);
};
/** the value of a TeX cell: 0.35, \tfrac{3}{8}, -0.1 */
const cellVal = (s: string): number => { const m = s.match(/\\tfrac\{(\d+)\}\{(\d+)\}/); return m ? Number(m[1]) / Number(m[2]) : Number(s.replace(/[^\d.-]/g, '')); };

describe('expected-value: voice and maths', () => {
  it('lines.json matches script.ts, spoken text has no digits or symbols', () => {
    expect(Object.keys(LINES_JSON).sort()).toEqual(Object.keys(SCRIPT).sort());
    for (const [k, v] of Object.entries(SCRIPT)) {
      expect(LINES_JSON[k]!.text, k).toBe(v.say);
      expect(v.say, k).not.toMatch(/[0-9%=|/×÷<>$]/);
    }
  });
  it('the lesson anchors: spinner E = 2, quiz table and E = 0.75, balance point', () => {
    expect(qeq(evQ([0, 2, 10], [[4, 8], [3, 8], [1, 8]]), [2, 1])).toBe(true);
    expect(qeq(evQ([0, 2, 20], [[4, 8], [3, 8], [1, 8]]), [13, 4])).toBe(true);
    const q = [0, 1, 2, 3].map(k => binomP(3, k, 0.25) * 64);
    q.forEach((v, i) => expect(v).toBeCloseTo([27, 27, 9, 1][i]!, 9));
    expect(torque([0, 2, 10], [0.5, 0.375, 0.125], 2)).toBeCloseTo(0, 12);
    expect(torque([0, 2, 10], [0.5, 0.375, 0.125], 4)).toBeLessThan(0);
    expect(torque([0, 1, 2, 3], [27, 27, 9, 1].map(v => v / 64), 0.75)).toBeCloseTo(0, 12);
  });
  it('models: binomial and Poisson sum to 1, geometric tails, totals', () => {
    for (const [n, p] of [[5, 0.3], [10, 0.25], [20, 0.6]] as const) expect([...Array(n + 1).keys()].reduce((s, k) => s + binomP(n, k, p), 0)).toBeCloseTo(1, 12);
    expect([...Array(60).keys()].reduce((s, k) => s + poisP(3, k), 0)).toBeCloseTo(1, 12);
    expect([1, 2, 3].reduce((s, k) => s + geoP(0.4, k), 0)).toBeCloseTo(1 - 0.6 ** 3, 12);
    expect(nCk(10, 3)).toBe(120);
    expect([...possibleTotals([0, 2, 5], 2)].sort((a, b) => a - b)).toEqual([0, 2, 4, 5, 7, 10]);
    const ms = runningMeans(rng(5), [3, -1], [0.25, 0.75], [10, 1000, 100000]);
    expect(Math.abs(ms[2]!)).toBeLessThan(0.05);
  });
});

describe('expected-value: answers are exact and stated well', () => {
  it('fractions in lowest terms, decimals without float noise', () => {
    each((it, f) => {
      const a = it.answer;
      if (a.kind === 'frac') { expect(gcd(a.n, a.d), `${f} ${it.prompt}`).toBeLessThanOrEqual(a.n === 0 ? a.d : 1); expect(a.n).toBeLessThan(a.d || 2); }
      if (a.kind === 'num') { expect(Number.isFinite(a.v)).toBe(true); expect(Math.abs(a.v - Math.round(a.v * 1e6) / 1e6), f).toBeLessThan(1e-12); }
      if (a.kind === 'pair') { expect(Number.isFinite(a.x) && Number.isFinite(a.y)).toBe(true); }
    });
  });
  it('every distribution in a picture is valid (probabilities in [0, 1] adding to 1), except where validity is the question', () => {
    each((it, f) => {
      for (const p of (it.picture?.pics ?? []) as { kind: string; ps?: (number | null)[]; reveal?: { ps?: (number | null)[]; cells?: (string | null)[][] }; rows?: { head: string; cells: (string | null)[] }[] }[]) {
        if (p.kind === 'bars') {
          const ps = p.ps!.map((v, i) => v ?? p.reveal?.ps?.[i] ?? null);
          if (ps.some(v => v === null)) continue;
          for (const v of ps) expect(v!, f).toBeGreaterThanOrEqual(0);
          expect(ps.reduce((s: number, v) => s + v!, 0), `${f} ${it.prompt}`).toBeCloseTo(1, 9);
        }
        if (p.kind === 'table' && f !== 'validJudge') {
          const r = p.rows!.findIndex(row => /^P/.test(row.head));
          if (r < 0) continue;
          const cells = p.rows![r]!.cells.map((c, j) => c ?? p.reveal?.cells?.[r]?.[j] ?? null);
          if (cells.some(c => c === null)) continue;
          const vs = cells.map(c => cellVal(c!));
          for (const v of vs) { expect(v, f).toBeGreaterThanOrEqual(0); expect(v, f).toBeLessThanOrEqual(1); }
          expect(vs.reduce((s, v) => s + v, 0), `${f} ${it.prompt}`).toBeCloseTo(1, 9);
        }
      }
    });
  });
  it('values of X in a picture are distinct', () => {
    each((it, f) => {
      for (const p of (it.picture?.pics ?? []) as { kind: string; xs?: number[]; rows?: { head: string; cells: (string | null)[] }[] }[]) {
        const xs: (number | string | null)[] | null = p.kind === 'bars' ? p.xs! : p.kind === 'table' && p.rows![0]!.head === 'x' ? p.rows![0]!.cells : null;
        if (xs) expect(new Set(xs).size, `${f} ${xs.join(',')}`).toBe(xs.length);
      }
    });
  });
  it('rounded answers say how to round, are not ties, and probabilities are probabilities', () => {
    each((it, f) => {
      if (/three decimal places/.test(it.prompt) && it.answer.kind === 'num') { const v = it.answer.v; expect(Math.round(v * 1000) / 1000, f).toBeCloseTo(v, 9); }
      if (/nearest cent/.test(it.prompt) && it.answer.kind === 'num') { const v = it.answer.v; expect(Math.round(v * 100) / 100, f).toBeCloseTo(v, 9); }
      if (it.answer.kind === 'frac' && /P\(/.test(it.prompt) && !/E\(X\)/.test(it.prompt)) expect(it.answer.w + it.answer.n / it.answer.d, `${f} ${it.prompt}`).toBeLessThanOrEqual(1);
    });
  });
  it('choices: no two choices name the same number', () => {
    each((it, f) => {
      if (!it.choices) return;
      const nums = it.choices.filter(c => /^[−-]?\$?\d+(\.\d+)?$/.test(c.trim())).map(c => Number(c.replace('−', '-').replace('$', '')));
      expect(new Set(nums).size, `${f} ${it.choices.join(' | ')}`).toBe(nums.length);
    }, 120);
  });
  it('the main slips are diagnosed', () => {
    const probe = (f: string, wrong: (it: It) => Response | null, mc: string, min = 15) => {
      let hits = 0;
      for (let s = 1; s <= 150; s++) { const it = GEN[f]!(rng(s * 13 + 1), s) as It; const r = wrong(it); if (!r) continue; const v = it.check(r); if (!v.ok && v.mc === mc) hits++; }
      expect(hits, `${f} -> ${mc}`).toBeGreaterThan(min);
    };
    const tab = (it: It) => it.picture!.pics![0] as unknown as { rows: { head: string; cells: string[] }[] };
    const xsps = (it: It) => { const t = tab(it); return { xs: t.rows[0]!.cells.map(Number), ps: t.rows[1]!.cells.map(cellVal) }; };
    probe('evTable', it => { const { ps } = xsps(it); return { kind: 'num', v: ps.reduce((a, b) => a + b, 0) }; }, MC.sumsP);
    probe('evTable', it => { const { xs } = xsps(it); return { kind: 'num', v: xs.reduce((a, b) => a + b, 0) / xs.length }; }, MC.unweighted);
    probe('buildDice', it => { const m = it.prompt.match(/P\(X = (\d+)\)/); if (!m || !/sum/.test(it.prompt)) return null; const k = Number(m[1]); return { kind: 'frac', w: 6 - Math.abs(k - 7), n: 0, d: 1 }; }, MC.countAsProb, 5);
    probe('multiGuess', it => { const m = it.prompt.match(/Guess on (\w+) questions with (\w+) choices.*P\(X = (\d+)\)/); if (!m) return null; const W = ['zero', 'one', 'two', 'three', 'four', 'five']; const nq = W.indexOf(m[1]!), ch = W.indexOf(m[2]!), k = Number(m[3]); return { kind: 'frac', w: 0, n: (ch - 1) ** (nq - k), d: ch ** nq }; }, MC.omitsOrder);
    probe('netCarnival', it => { const t = tab(it); if (!/net/.test(t.rows[0]!.head)) return null; const xs = t.rows[0]!.cells.map(Number), ps = t.rows[1]!.cells.map(cellVal); const c = Number(it.prompt.match(/costs <b>\$(\d+)/)![1]); return { kind: 'num', v: Math.round((xs.reduce((s, x, i) => s + x * ps[i]!, 0) - c) * 100) / 100 }; }, MC.costTwice, 5);
    probe('netRaffle', it => { const m = it.prompt.match(/one prize of <b>\$(\d+)<\/b>(?: and (\w+) prizes of <b>\$(\d+)<\/b>)?/), N = Number(it.prompt.match(/all <b>([\d,]+) tickets/)![1]!.replace(',', '')); if (!m) return null; const W = ['zero', 'one', 'two', 'three', 'four', 'five']; const prizes = Number(m[1]) + (m[2] ? W.indexOf(m[2]) * Number(m[3]) : 0); return { kind: 'num', v: Math.round((prizes / N) * 100) / 100 }; }, MC.revenue);
    probe('streakCount', it => { const m = it.prompt.match(/heads (\d+) times in its first (\d+) tosses.*tossed (\d+) more/); if (!m) return null; return { kind: 'num', v: (Number(m[2]) + Number(m[3])) / 2 - Number(m[1]) }; }, MC.gambler);
  });
});

describe('expected-value: board TeX', () => {
  it('every TeX command keeps its backslash', () => {
    each((it, f) => { expect(it.board, f).not.toMatch(/(^|[^\\a-zA-Z])(dfrac|tfrac|text|textstyle|sum|cdot|times|binom|approx|lambda|mu|sigma|sqrt|quad)\b/); }, 40);
  });
});
