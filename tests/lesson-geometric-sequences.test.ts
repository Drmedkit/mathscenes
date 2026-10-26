// lesson-geometric-sequences: the generic checks (every family x every sub-goal it serves x 300 seeds). Add topic checks below.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { rng } from '../src/lesson/runtime/item';
import { GENERATORS } from '../src/lesson/topics/geometric-sequences/items';
import { PLAN } from '../src/lesson/topics/geometric-sequences/plan';

const TOPIC = { subgoals: [...new Map(["secondary-t6-14-sequences-geometric"].flatMap(i => JSON.parse(fs.readFileSync(`../math-curriculum-essentials/topics/${i}.json`, 'utf8')).subgoals).map((s: { id: string }) => [s.id, s] as const)).values()] };
const CATALOG = new Set<string>(JSON.parse(fs.readFileSync('../math-curriculum-essentials/misconceptions.json', 'utf8')).misconceptions.map((m: { id: string }) => m.id));
const GEN = GENERATORS as Record<string, (R: () => number, n: number, sg?: string) => import('../src/lesson/runtime/item').Item>;

describe('geometric-sequences: plan', () => {
  it('walks through every sub-goal of the topic JSON, in order, each with a family', () => {
    expect(PLAN.map(p => p.id)).toEqual(TOPIC.subgoals.map((s: { id: string }) => s.id));
    for (const p of PLAN) { expect(p.families.length, p.id).toBeGreaterThan(0); for (const f of p.families) expect(GEN[f], f).toBeDefined(); }
  });
});

describe('geometric-sequences: families', () => {
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
import { arith, expH, expT, geo, q, qH, qi, qT, ratios, recT, term, terms, val } from '../src/lesson/topics/geometric-sequences/geo';
import { SCRIPT } from '../src/lesson/topics/geometric-sequences/script';
import type { Item, Response } from '../src/lesson/runtime/item';
import { stepsFrom } from '../src/lesson/runtime/explain';

const valOf = (r: Response): number => (r.kind === 'num' ? r.v : r.kind === 'frac' ? r.w + r.n / r.d : NaN);
describe('geometric-sequences: maths', () => {
  it('terms, ratios, tests', () => {
    expect(terms(qi(3), qi(2), 6).map(val)).toEqual([3, 6, 12, 24, 48, 96]);
    expect(val(term(qi(3), qi(2), 8))).toBe(384);
    expect(val(term(qi(96), q(1, 2), 6))).toBe(3);
    expect(term(qi(81), q(2, 3), 6)).toEqual({ n: 32, d: 3 });
    expect(q(0.8)).toEqual({ n: 4, d: 5 });
    expect(val(term(qi(100), q(0.8), 4))).toBeCloseTo(51.2, 12);
    expect(ratios([qi(4), qi(-8), qi(16)])).toEqual([qi(-2), qi(-2)]);
    expect(geo([qi(7), qi(7), qi(7)])).toBe(true);
    expect(arith([qi(7), qi(7), qi(7)])).toBe(true);
    expect(geo([qi(5), qi(0), qi(0)])).toBe(false);
    expect(geo([qi(1), qi(4), qi(9)])).toBe(false);
  });
  it('writes the forms', () => {
    expect(expT(qi(3), qi(2))).toBe('3 \\cdot 2^{n-1}');
    expect(expT(qi(96), q(1, 2))).toBe('96\\left(\\frac{1}{2}\\right)^{n-1}');
    expect(expT(qi(5), qi(-2), 0)).toBe('5\\left(-2\\right)^{n}');
    expect(expT(qi(1000), q(11, 10), 0, true)).toBe('1000 \\cdot 1.1^{n}');
    expect(expH(qi(-4), qi(3))).toBe('−4 · 3<sup>n−1</sup>');
    expect(qT(q(-1, 2))).toBe('-\\frac{1}{2}');
    expect(qH(q(51.2), true)).toBe('51.2');
    expect(recT({ N: { s: 'a' }, n0: 1, seed: qi(5), r: qi(-2) })).toBe('a_{1} = 5,\\ a_{n} = (-2)a_{n-1}\\ \\text{for } n \\ge 2');
  });
});

describe('geometric-sequences: pictures and steps', () => {
  let geoView: typeof import('../src/lesson/topics/geometric-sequences/pictures').geoView;
  let frame: typeof import('../src/blocks/block').frame, dusk: import('../src/core/theme').Theme;
  beforeAll(async () => {
    (globalThis as unknown as { document: unknown }).document = { createElement: () => ({ getContext: () => null }) };
    ({ geoView } = await import('../src/lesson/topics/geometric-sequences/pictures'));
    ({ frame } = await import('../src/blocks/block'));
    ({ dusk } = await import('../src/lesson/dusk'));
  });
  it('the lesson pictures lay out (strip over plane)', () => {
    const MF = frame(60, 70, 940, 940);
    const vs = terms(qi(3), qi(2), 6);
    const V = geoView({ strip: { ns: [1, 2, 3, 4, 5, 6], vals: vs, ell: true, idx: 'round n', name: 'calls aₙ' }, graph: { pts: vs.map((v, i) => [i + 1, val(v)]), guide: { a: 3, r: 2, k: 1 }, cmp: [1, 2, 3, 4, 5, 6].map(k => [k, 3 * k]), y: { min: 0, max: 100, step: 10 } } }, MF, dusk);
    expect(V.strip!.box.y1).toBeLessThan(V.plane!.box.y0);
    expect(V.plane!.box.y1).toBeLessThanOrEqual(MF.y + MF.h + 1);
    expect(() => geoView({ strip: { ns: [1, 2, 3, 4, 5, 6], vals: vs, ell: true, adds: true } }, MF, dusk)).not.toThrow();
  });
  it('most practice pictures lay out, and the steps end on the answer', () => {
    const MF = frame(60, 70, 940, 940);
    let pics = 0, bad = 0;
    const fails: string[] = [];
    for (const p of PLAN) for (const f of p.families) for (let s = 1; s <= 60; s++) {
      const it = GEN[f]!(rng(s * 13 + 1), s, p.id) as Item & { picture?: import('../src/lesson/topics/geometric-sequences/pictures').GeoPic };
      const ex = stepsFrom(it);
      expect(ex, `${f}: steps give an answer`).not.toBeNull();
      const r = ex!.result, a = it.answer;
      if (a.kind === 'num' || a.kind === 'frac') expect(Math.abs(valOf(r) - valOf(a)), `${f} ${it.solution.join(' | ')}`).toBeLessThan(1e-6);
      else if (a.kind === 'pair' && r.kind === 'pair') expect([r.x, r.y], `${f} ${it.solution.join(' | ')}`).toEqual([a.x, a.y]);
      else expect(r, f).toEqual(a);
      expect(it.solution.join(' ') + it.prompt + (it.choices ?? []).join(' '), f).not.toMatch(/undefined|NaN|\+ −|−−/);
      const pic = it.picture;
      if (!pic || (!pic.strip && !pic.graph)) continue;
      pics++;
      try { geoView(pic, pic.strip && !pic.graph ? frame(60, 330, 940, 680) : MF, dusk); } catch (e) { bad++; if (fails.length < 8) fails.push(`${f}: ${(e as Error).message}`); }
    }
    expect(pics).toBeGreaterThan(1000);
    expect(bad / pics, fails.join('\n')).toBeLessThan(0.03);
  });
});

describe('geometric-sequences: misconception probes', () => {
  const first = (f: string, sg: string, pred: (it: Item) => boolean = () => true) => { for (let s = 1; s < 600; s++) { const it = GEN[f]!(rng(s), s, sg); if (pred(it)) return it; } throw new Error('no item ' + f); };
  const num = (it: Item) => (it.answer as { v: number }).v;
  const choiceMc = (it: Item, re: RegExp) => it.check({ kind: 'choice', i: it.choices!.findIndex(c => re.test(c)) }).mc;
  it('the exponent n instead of n − 1 is n-steps', () => {
    const it = first('countHops', 'explicit-derive');
    expect(it.check({ kind: 'num', v: num(it) + 1 }).mc).toBe('mc.sequences-series.n-steps-for-nth-term');
  });
  it('the ratio upside down is ratio-inverted, a difference is constant-factor-as-constant-amount', () => {
    const it = first('findR', 'ratio-whole');
    expect(it.check({ kind: 'num', v: 1 / num(it) }).mc).toBe('mc.sequences-series.ratio-inverted');
    const m = it.board.match(/^(\d+),\\ (\d+)/)!;
    expect(it.check({ kind: 'num', v: Number(m[2]) - Number(m[1]) }).mc).toBe('mc.exponential-log.constant-factor-as-constant-amount');
  });
  it('a dropped minus sign of r is negative-ratio-sign', () => {
    const it = first('findRneg', 'ratio-negative');
    expect(it.check({ kind: 'num', v: -num(it) }).mc).toBe('mc.sequences-series.negative-ratio-sign');
  });
  it('adding the percents is adds-successive-percent-changes', () => {
    const it = first('compound', 'factor-percent', x => x.unit === '%');
    const m = it.prompt.match(/by (\d+)% each period.*after (\d) periods/)!;
    expect(it.check({ kind: 'num', v: Number(m[1]) * Number(m[2]) }).mc).toBe('mc.percent.adds-successive-percent-changes');
  });
  it('the rewrite read as a new start is algebraic-rewrite-resets-index-domain', () => {
    const it = first('rewriteVsRelabel', 'rewrite-same-index');
    expect(choiceMc(it, /^The first term is now/)).toBe('mc.sequences-series.algebraic-rewrite-resets-index-domain');
  });
  it('only the positive root is drops-negative-root-of-even-power', () => {
    const it = first('gapRatio', 'nonadjacent-ratio', x => x.choices!.some(c => / only$/.test(c)));
    expect(choiceMc(it, / only$/)).toBe('mc.exponents-roots.drops-negative-root-of-even-power');
  });
  it('a constant sequence is both (rule types overlap)', () => {
    const it = first('classify', 'classify-arith-geo', x => /^(\d+), \1, \1/.test(x.prompt));
    expect(it.check({ kind: 'choice', i: it.choices!.indexOf('Both arithmetic and geometric') }).ok).toBe(true);
    expect(choiceMc(it, /^Geometric only$/)).toBe('mc.sequences-series.rule-types-mutually-exclusive');
  });
  it('threshold items never have a term equal to the threshold, and the answer is the first crossing', () => {
    for (let s = 1; s <= 300; s++) {
      const it = GEN.firstCross!(rng(s), s, 'context-threshold');
      const m = it.board.match(/_n = (\d+)(?: \\cdot |\\left\()([\d.]+|\\frac\{(\d+)\}\{(\d+)\})(?:\\right\))?\^\{(n-1|n)\},\\ \\ [ad]_n \\(ge|le) (\d+)/)!;
      expect(m, it.board).not.toBeNull();
      const a = Number(m[1]), r = m[3] ? Number(m[3]) / Number(m[4]) : Number(m[2]), n0 = m[5] === 'n' ? 0 : 1, up = m[6] === 'ge', T = Number(m[7]);
      const t = (k: number) => a * r ** (k - n0);
      const ans = num(it);
      for (let k = n0; k <= ans + 2; k++) expect(Math.abs(t(k) - T)).toBeGreaterThan(1e-6);
      expect(up ? t(ans) >= T && t(ans - 1) < T : t(ans) <= T && t(ans - 1) > T, it.board).toBe(true);
    }
  });
});

describe('geometric-sequences: voice', () => {
  it('lines.json speaks every panel line of parts 1-4, without digits or symbols', () => {
    const lines = JSON.parse(fs.readFileSync('pages/lessons/geometric-sequences/voice/lines.json', 'utf8')) as Record<string, { text: string }>;
    expect(Object.keys(lines).sort()).toEqual(Object.keys(SCRIPT).sort());
    for (const [k, v] of Object.entries(SCRIPT)) { expect(lines[k]!.text, k).toBe(v.say); expect(v.say, k).not.toMatch(/[0-9<>≤≥=−+×÷]/); }
  });
});
