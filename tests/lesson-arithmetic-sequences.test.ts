// lesson-arithmetic-sequences: the generic checks (every family x every sub-goal it serves x 300 seeds). Add topic checks below.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { rng } from '../src/lesson/runtime/item';
import { GENERATORS } from '../src/lesson/topics/arithmetic-sequences/items';
import { PLAN } from '../src/lesson/topics/arithmetic-sequences/plan';

const TOPIC = { subgoals: [...new Map(["secondary-t6-10-sequences-arithmetic"].flatMap(i => JSON.parse(fs.readFileSync(`../math-curriculum-essentials/topics/${i}.json`, 'utf8')).subgoals).map((s: { id: string }) => [s.id, s] as const)).values()] };
const CATALOG = new Set<string>(JSON.parse(fs.readFileSync('../math-curriculum-essentials/misconceptions.json', 'utf8')).misconceptions.map((m: { id: string }) => m.id));
const GEN = GENERATORS as Record<string, (R: () => number, n: number, sg?: string) => import('../src/lesson/runtime/item').Item>;

describe('arithmetic-sequences: plan', () => {
  it('walks through every sub-goal of the topic JSON, in order, each with a family', () => {
    expect(PLAN.map(p => p.id)).toEqual(TOPIC.subgoals.map((s: { id: string }) => s.id));
    for (const p of PLAN) { expect(p.families.length, p.id).toBeGreaterThan(0); for (const f of p.families) expect(GEN[f], f).toBeDefined(); }
  });
});

describe('arithmetic-sequences: families', () => {
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
import { diffs, arith, expRH, linT, position, recT, term, terms } from '../src/lesson/topics/arithmetic-sequences/seq';
import { SCRIPT } from '../src/lesson/topics/arithmetic-sequences/script';
import type { Item } from '../src/lesson/runtime/item';
import { stepsFrom } from '../src/lesson/runtime/explain';

describe('arithmetic-sequences: maths', () => {
  it('terms, differences, positions', () => {
    expect(terms(14, 3, 6)).toEqual([14, 17, 20, 23, 26, 29]);
    expect(term(14, 3, 40)).toBe(131);
    expect(term(6, 4, 0, 0)).toBe(6);
    expect(diffs([5, 1, -3])).toEqual([-4, -4]);
    expect(arith([2, 4, 8])).toBe(false);
    expect(arith([7, 7, 7])).toBe(true);
    expect(position(50, -4, 2)).toEqual({ kind: 'term', n: 13 });
    expect(position(50, -4, 0)).toEqual({ kind: 'notWhole', n: 13.5 });
    expect(position(50, -4, 58)).toEqual({ kind: 'before', n: -1 });
    expect(position(50, -4, 2, 1, 10)).toEqual({ kind: 'after', n: 13 });
    expect(position(7, 0, 7)).toEqual({ kind: 'every' });
    expect(position(7, 0, 8)).toEqual({ kind: 'none' });
  });
  it('writes the forms', () => {
    expect(expRH(14, 3)).toBe('14 + 3(<i>n</i> − 1)');
    expect(expRH(50, -4)).toBe('50 − 4(<i>n</i> − 1)');
    expect(expRH(6, 4, 0)).toBe('6 + 4<i>n</i>');
    expect(linT(3, 11)).toBe('3n + 11');
    expect(linT(-1, -2)).toBe('-n - 2');
    expect(recT({ N: { s: 'a' }, n0: 1, seed: 5, d: -2, back: true, lo: 2 })).toBe('a_{1} = 5,\\ a_{n} = a_{n-1} - 2\\ \\text{for } n \\ge 2');
  });
});

describe('arithmetic-sequences: pictures and steps', () => {
  let seqView: typeof import('../src/lesson/topics/arithmetic-sequences/pictures').seqView;
  let frame: typeof import('../src/blocks/block').frame, dusk: import('../src/core/theme').Theme;
  beforeAll(async () => {
    (globalThis as unknown as { document: unknown }).document = { createElement: () => ({ getContext: () => null }) };
    ({ seqView } = await import('../src/lesson/topics/arithmetic-sequences/pictures'));
    ({ frame } = await import('../src/blocks/block'));
    ({ dusk } = await import('../src/lesson/dusk'));
  });
  it('the lesson pictures lay out (strip over plane)', () => {
    const MF = frame(60, 70, 940, 940);
    const vs = terms(14, 3, 6);
    const V = seqView({ strip: { ns: [1, 2, 3, 4, 5, 6], vals: vs, ell: true, idx: 'row n', name: 'seats aₙ' }, graph: { pts: vs.map((y, i) => [i + 1, y]), stairs: true, guide: [3, 11], xName: 'row n', yName: 'seats aₙ', y: { min: 0, max: 35, step: 5 } } }, MF, dusk);
    expect(V.strip!.box.y1).toBeLessThan(V.plane!.box.y0);
    expect(V.plane!.box.y1).toBeLessThanOrEqual(MF.y + MF.h + 1);
  });
  it('most practice pictures lay out, and the steps end on the answer', () => {
    const MF = frame(60, 70, 940, 940);
    let pics = 0, bad = 0;
    const fails: string[] = [];
    for (const p of PLAN) for (const f of p.families) for (let s = 1; s <= 60; s++) {
      const it = GEN[f]!(rng(s * 13 + 1), s, p.id) as Item & { picture?: import('../src/lesson/topics/arithmetic-sequences/pictures').SeqPic };
      const ex = stepsFrom(it);
      expect(ex, `${f}: steps give an answer`).not.toBeNull();
      const r = ex!.result, a = it.answer;
      if (a.kind === 'num' && r.kind === 'num') expect(Math.abs(r.v - a.v), `${f} ${it.solution.join(' | ')}`).toBeLessThan(1e-6);
      else if (a.kind === 'pair' && r.kind === 'pair') expect([r.x, r.y], `${f} ${it.solution.join(' | ')}`).toEqual([a.x, a.y]);
      else expect(r, f).toEqual(a);
      const pic = it.picture;
      if (!pic || (!pic.strip && !pic.graph)) continue;
      pics++;
      try { seqView(pic, pic.strip && !pic.graph ? frame(60, 220, 940, 790) : MF, dusk); } catch (e) { bad++; if (fails.length < 8) fails.push(`${f}: ${(e as Error).message}`); }
    }
    expect(pics).toBeGreaterThan(1000);
    expect(bad / pics, fails.join('\n')).toBeLessThan(0.03);
  });
});

describe('arithmetic-sequences: misconception probes', () => {
  const first = (f: string, sg: string, pred: (it: Item) => boolean = () => true) => { for (let s = 1; s < 600; s++) { const it = GEN[f]!(rng(s), s, sg); if (pred(it)) return it; } throw new Error('no item ' + f); };
  const num = (it: Item) => (it.answer as { v: number }).v;
  it('n jumps for the nth term is named', () => {
    const it = first('countJumps', 'explicit-derive');
    expect(it.check({ kind: 'num', v: num(it) + 1 }).mc).toBe('mc.sequences-series.n-steps-for-nth-term');
    const w = first('whichN', 'solve-for-position');
    expect(w.check({ kind: 'num', v: num(w) - 1 }).mc).toBe('mc.sequences-series.n-steps-for-nth-term');
  });
  it('the value at n = 0 read as the seed is named', () => {
    const it = first('seedOf', 'explicit-to-recursive');
    const m = it.board.match(/= (-?[\d.]*)n ([+-]) ([\d.]+)/)!;
    const p = m[1] === '' ? 1 : m[1] === '-' ? -1 : Number(m[1]), q = (m[2] === '-' ? -1 : 1) * Number(m[3]);
    expect(num(it)).toBe(p + q);
    expect(it.check({ kind: 'num', v: q }).mc).toBe('mc.sequences-series.index-shifted-by-one');
  });
  it('the change over several steps used as d is ignores-input-step', () => {
    const it = first('twoTerms', 'explicit-from-two-terms');
    const [p, ap, , aq] = nums(it.board) as [number, number, number, number];
    const q = Number(it.board.match(/a_\{(\d+)\} = [^,]*,\\ \\ a_\{(\d+)\}/)![2]);
    const D2 = aq - ap;
    expect(it.check({ kind: 'pair', x: ap - (p - 1) * D2, y: D2 }).mc).toBe('mc.linear-functions.ignores-input-step');
    void q;
  });
  it('graphPick never has a_1 = d (the "through (0, 0)" distractor would be true)', () => {
    for (let s = 1; s <= 600; s++) {
      const it = GEN.graphPick!(rng(s), s, 'discrete-linear-graph');
      const m = it.board.match(/= \{?(-?\d+)\}? ([+-]) (\d*)\(n - 1\)/);
      if (m) expect(Number(m[1]), it.board).not.toBe((m[2] === '-' ? -1 : 1) * (m[3] === '' ? 1 : Number(m[3])));
    }
  });
  it('the forward rule that keeps n >= 2 is keeps-old-parameter-interval', () => {
    const it = first('shiftRule', 'recursive-notation-shift');
    const i = it.choices!.findIndex(c => /\+1\)|n\+1<\/sub>/.test(c) && /≥ 2/.test(c));
    expect(it.check({ kind: 'choice', i }).mc).toBe('mc.functions-concept.keeps-old-parameter-interval');
  });
});
/** the numbers in a TeX board, coefficients included (3n + 11 → 3, 11; "-n" → -1) */
function nums(t: string): number[] {
  return [...t.replace(/(^|[^\d.])-n/g, '$1-1n').replace(/(^|[=,\s{])n/g, '$11n').matchAll(/-?\s?\d+(?:\.\d+)?/g)].map(m => Number(m[0].replace(/\s/g, '')));
}

describe('arithmetic-sequences: voice', () => {
  it('lines.json speaks every panel line of parts 1-4, without digits or symbols', () => {
    const lines = JSON.parse(fs.readFileSync('pages/lessons/arithmetic-sequences/voice/lines.json', 'utf8')) as Record<string, { text: string }>;
    expect(Object.keys(lines).sort()).toEqual(Object.keys(SCRIPT).sort());
    for (const [k, v] of Object.entries(SCRIPT)) { expect(lines[k]!.text, k).toBe(v.say); expect(v.say, k).not.toMatch(/[0-9<>≤≥=−+×÷]/); }
  });
});
