// lesson-conditional-probability: the generic checks (every family x every sub-goal it serves x 300 seeds). Add topic checks below.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { rng } from '../src/lesson/runtime/item';
import { GENERATORS } from '../src/lesson/topics/conditional-probability/items';
import { PLAN } from '../src/lesson/topics/conditional-probability/plan';

const TOPIC = { subgoals: [...new Map(["secondary-t7-17-probability-conditional-and-independent-events"].flatMap(i => JSON.parse(fs.readFileSync(`../math-curriculum-essentials/topics/${i}.json`, 'utf8')).subgoals).map((s: { id: string }) => [s.id, s] as const)).values()] };
const CATALOG = new Set<string>(JSON.parse(fs.readFileSync('../math-curriculum-essentials/misconceptions.json', 'utf8')).misconceptions.map((m: { id: string }) => m.id));
const GEN = GENERATORS as Record<string, (R: () => number, n: number, sg?: string) => import('../src/lesson/runtime/item').Item>;

describe('conditional-probability: plan', () => {
  it('walks through every sub-goal of the topic JSON, in order, each with a family', () => {
    expect(PLAN.map(p => p.id)).toEqual(TOPIC.subgoals.map((s: { id: string }) => s.id));
    for (const p of PLAN) { expect(p.families.length, p.id).toBeGreaterThan(0); for (const f of p.families) expect(GEN[f], f).toBeDefined(); }
  });
});

describe('conditional-probability: families', () => {
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
import { SCRIPT } from '../src/lesson/topics/conditional-probability/script';
import { MC } from '../src/lesson/topics/conditional-probability/common';
import { OUTCOMES, countD, genIndep, genClose, genTable, shareGap, totals, JOB, HAND } from '../src/lesson/topics/conditional-probability/cp';
import { gcd } from '../src/lesson/runtime/item';

const LINES_JSON = JSON.parse(fs.readFileSync('pages/lessons/conditional-probability/voice/lines.json', 'utf8')) as Record<string, { text: string }>;
const ALL = PLAN.flatMap(p => p.families.map(f => [p.id, f] as const));
const each = (fn: (it: import('../src/lesson/topics/conditional-probability/common').CItem, f: string, s: number) => void, seeds = 200) => {
  for (const [sg, f] of ALL) for (let s = 1; s <= seeds; s++) fn(GEN[f]!(rng(s * 97 + 3), s, sg) as never, f, s);
};

describe('conditional-probability: voice and maths', () => {
  it('lines.json matches script.ts, spoken text has no digits or symbols', () => {
    expect(Object.keys(LINES_JSON).sort()).toEqual(Object.keys(SCRIPT).sort());
    for (const [k, v] of Object.entries(SCRIPT)) {
      expect(LINES_JSON[k]!.text, k).toBe(v.say);
      expect(v.say, k).not.toMatch(/[0-9%=|/×÷<>]/);
    }
  });
  it('the dice grid and the anchor tables', () => {
    expect(OUTCOMES.length).toBe(36);
    expect(countD((r, b) => r + b === 7)).toBe(6);
    expect(totals(JOB)).toEqual({ row: [80, 120], col: [110, 90], all: 200 });
    const H = totals(HAND);
    expect(HAND[0]![0]! * H.all).toBe(H.col[0]! * H.row[0]!);   // exactly independent: 6/16 = 60/160
    expect(6 * 80).not.toBe(48 * 16);
  });
  it('table generators: distinct cells and margins, exact independence, close tables', () => {
    for (let s = 1; s <= 300; s++) {
      const g = genTable(rng(s), 2, s % 2 ? 3 : 2), T = totals(g);
      const all = [...g.flat(), ...T.row, ...T.col, T.all];
      expect(new Set(all).size).toBe(all.length);
      const I = genIndep(rng(s), 2, 2), TI = totals(I);
      expect(I[0]![0]! * TI.all).toBe(TI.row[0]! * TI.col[0]!);
      const c = genClose(rng(s));
      expect(shareGap(c)).toBeGreaterThan(0.5);
      expect(shareGap(c)).toBeLessThanOrEqual(5);
    }
  });
});

describe('conditional-probability: answers are exact and stated well', () => {
  it('fractions in lowest terms, decimals without float noise, tables realistic', () => {
    each((it, f) => {
      const a = it.answer;
      if (a.kind === 'frac') { expect(gcd(a.n, a.d), `${f} ${it.prompt}`).toBeLessThanOrEqual(a.n === 0 ? a.d : 1); expect(a.n).toBeLessThan(a.d || 2); }
      if (a.kind === 'num') { expect(Number.isFinite(a.v)).toBe(true); expect(Math.abs(a.v - Math.round(a.v * 1e6) / 1e6), f).toBeLessThan(1e-12); }
      for (const p of (it.picture?.pics ?? []) as { kind: string; cells?: number[][] }[]) if (p.kind === 'table') {
        const T = totals(p.cells!);
        expect(p.cells!.flat().every(v => Number.isInteger(v) && v > 0), f).toBe(true);
        expect(T.all, f).toBeGreaterThanOrEqual(12); expect(T.all, f).toBeLessThanOrEqual(1000);
      }
      // a probability answer is a probability
      if (a.kind === 'frac' && !/count|how many/i.test(it.prompt)) expect(a.w + a.n / a.d, f).toBeLessThanOrEqual(1);
    });
  });
  it('rounded answers say how to round and are not ties', () => {
    each((it, f) => {
      if (/three decimal places/.test(it.prompt)) { expect(it.answer.kind).toBe('num'); const v = (it.answer as { v: number }).v; expect(Math.round(v * 1000) / 1000, f).toBeCloseTo(v, 9); }
    });
  });
  it('the main slips are diagnosed', () => {
    const probe = (f: string, wrong: (it: import('../src/lesson/topics/conditional-probability/common').CItem) => import('../src/lesson/runtime/item').Response | null, mc: string) => {
      let hits = 0;
      for (let s = 1; s <= 120; s++) { const it = GEN[f]!(rng(s * 13 + 1), s); const r = wrong(it as never); if (!r) continue; const v = it.check(r); if (!v.ok && v.mc === mc) hits++; }
      expect(hits, `${f} -> ${mc}`).toBeGreaterThan(20);
    };
    const tbl = (it: { picture?: { pics?: unknown[] } }) => (it.picture!.pics![0] as { cells: number[][]; whole: { kind: string; i: number }; parts: [number, number][] });
    probe('tableCond', it => { const p = tbl(it), T = totals(p.cells), [r, c] = p.parts[0]!; return { kind: 'frac', w: 0, n: p.cells[r]![c]!, d: T.all }; }, MC.newWhole);
    probe('tableCond', it => { const p = tbl(it), T = totals(p.cells), [r, c] = p.parts[0]!; return { kind: 'frac', w: 0, n: p.cells[r]![c]!, d: p.whole.kind === 'row' ? T.col[c]! : T.row[r]! }; }, MC.inverse);
    probe('notationRead', it => ({ kind: 'choice', i: it.choices!.findIndex(c => c.startsWith('P(')) }), MC.barDiv);
    probe('addGiven', it => { const m = it.prompt.match(/P\(A\) = ([\d.]+), P\(B\) = ([\d.]+) and P\(A and B\)/); return m ? { kind: 'num', v: Number(m[1]) + Number(m[2]) } : null; }, MC.overlap);
    probe('twoDraws', it => { const m = it.prompt.match(/holds (\d+) \w+ and (\d+) \w+ counters\. You draw two <b>without/); if (!m) return null; const r = +m[1]!, n = r + +m[2]!; return { kind: 'frac', w: 0, n: r * r, d: n * n }; }, MC.assumeIndep);
    probe('screenTable', it => { const p = tbl(it); return { kind: 'frac', w: 0, n: p.cells[0]![0]!, d: p.cells[0]![0]! + p.cells[0]![1]! }; }, MC.inverse);
    probe('totalTwo', it => { const m = it.prompt.match(/= (\d+(?:\.\d+)?); otherwise P\([^)]*\) = (\d+(?:\.\d+)?)/); return m ? { kind: 'num', v: (Number(m[1]) + Number(m[2])) / 2 } : null; }, MC.unweighted);
  });
});

describe('conditional-probability: board TeX', () => {
  it('every TeX command keeps its backslash', () => {
    each((it, f) => { expect(it.board, f).not.toMatch(/(^|[^\\a-zA-Z])(mid|dfrac|tfrac|text|cap|cup|quad|varnothing|times|overset|hat)\b/); }, 40);
  });
});
