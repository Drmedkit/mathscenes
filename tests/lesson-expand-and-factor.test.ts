// lesson-expand-and-factor: every family × every sub-goal it serves × 300 seeds; the models' maths; the voice.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { rng, type Item } from '../src/lesson/runtime/item';
import { GENS, PROBES, FAMILY_NAMES, type EFItem, type FamilyId } from '../src/lesson/topics/expand-and-factor/items';
import { PLAN } from '../src/lesson/topics/expand-and-factor/plan';
import { SCRIPT } from '../src/lesson/topics/expand-and-factor/script';
import { computeTiles, tilesFit, computeGrid } from '../src/lesson/topics/expand-and-factor/AreaModel';
import { computeTermTiles, termTilesFit } from '../src/lesson/topics/expand-and-factor/TermTiles';
import { computeTable } from '../src/lesson/topics/expand-and-factor/ValueTable';
import { t, expand, divide, normal, same, value, exTex, exHtml, prodTex, q, num, type Term } from '../src/lesson/topics/expand-and-factor/expr';

const TOPIC_DIR = 'C:/Users/stelt/Claude code foler/math-curriculum-essentials';
const TOPIC = `${TOPIC_DIR}/topics/secondary-t5-18-expressions-expand-and-factor.json`;
const SEEDS = 300;

describe('plan covers the topic', () => {
  it('every sub-goal of the topic JSON, in order, each with a family that exists', () => {
    if (fs.existsSync(TOPIC)) {
      const tp = JSON.parse(fs.readFileSync(TOPIC, 'utf8')) as { subgoals: { id: string }[] };
      expect(PLAN.map(p => p.id)).toEqual(tp.subgoals.map(s => s.id));
    }
    expect(PLAN.length).toBe(22);
    for (const p of PLAN) { expect(p.families.length).toBeGreaterThan(0); for (const f of p.families) expect(GENS[f as FamilyId]).toBeTypeOf('function'); }
    for (const f of Object.keys(GENS)) expect(FAMILY_NAMES[f]).toBeTruthy();
    // every family is used by the plan
    for (const f of Object.keys(GENS)) expect(PLAN.some(p => p.families.includes(f)), f).toBe(true);
  });
});

const pairs = PLAN.flatMap(p => p.families.map(f => [f as FamilyId, p.id] as const));
describe.each(pairs)('family %s for sub-goal %s', (fam, sg) => {
  const items: EFItem[] = [];
  for (let s = 1; s <= SEEDS; s++) items.push(GENS[fam](rng(s * 7919 + fam.length * 13 + sg.length), s, sg));
  it('the answer passes, the item is well formed', () => {
    for (const it of items) {
      expect(it.family).toBe(fam);
      const v = it.check(it.answer);
      if (!v.ok) throw new Error(`${it.id} ${it.prompt}: own answer rejected: ${v.say}`);
      expect(it.solution.length).toBeGreaterThan(0);
      for (const s of [it.prompt, it.board, it.solution.join(' '), ...(it.choices ?? []), v.say]) expect(s, it.prompt).not.toMatch(/undefined|NaN|Infinity|\[object/);
      expect(it.board, it.prompt).not.toMatch(/\+ -|- -|\+ \+|(?<![0-9.}])1x/);
    }
  });
  it('choices are unique with exactly one right', () => {
    for (const it of items) {
      if (it.input !== 'choice') continue;
      const ch = it.choices ?? [];
      expect(ch.length, it.prompt).toBeGreaterThanOrEqual(3);
      expect(new Set(ch).size, it.prompt).toBe(ch.length);
      const right = ch.map((_, i) => it.check({ kind: 'choice', i }).ok).filter(Boolean).length;
      expect(right, it.prompt).toBe(1);
    }
  });
  it('the main misconceptions are classified', () => {
    for (const it of items) for (const p of PROBES.get(it) ?? []) {
      const v = it.check(p.r);
      expect(v.ok, `${it.id} ${JSON.stringify(p.r)}`).toBe(false);
      expect(v.mc, `${it.id} ${it.prompt} ${JSON.stringify(p.r)}`).toBe(p.mc);
    }
  });
  it('pictures are drawable and agree with the item', () => {
    for (const it of items) {
      const pic = it.pic;
      if (!pic) continue;
      if (pic.kind === 'tiles') { expect(tilesFit(pic.a, pic.p, pic.q), it.prompt).toBe(true); computeTiles(pic); }
      if (pic.kind === 'grid') computeGrid(pic);
      if (pic.kind === 'row') { expect(termTilesFit(pic.terms), it.prompt).toBe(true); computeTermTiles(pic.terms); }
      if (pic.kind === 'table') { computeTable(pic); for (const x of pic.show) expect(pic.xs, it.prompt).toContain(x); }
    }
  });
});

describe('misconception coverage', () => {
  it('every catalogue misconception the topic names shows up in a probe (except the listed extension-only ones)', () => {
    const tp = fs.existsSync(TOPIC) ? JSON.parse(fs.readFileSync(TOPIC, 'utf8')) as { subgoals: { misconceptions?: string[] }[] } : { subgoals: [] };
    // optional extension, not required by the topic (percent contexts)
    const skip = new Set(['mc.percent.multiplier-without-percent-meaning']);
    const want = [...new Set(tp.subgoals.flatMap(s => s.misconceptions ?? []))].filter(m => !skip.has(m));
    const seen = new Set<string>();
    for (const [fam, sg] of pairs) for (let s = 1; s <= 200; s++) for (const p of PROBES.get(GENS[fam](rng(s * 31 + 5), s, sg)) ?? []) seen.add(p.mc);
    const missing = want.filter(m => !seen.has(m));
    expect(missing).toEqual([]);
    // and every id is a real catalogue id
    const catPath = `${TOPIC_DIR}/misconceptions.json`;
    if (fs.existsSync(catPath)) {
      const ids = new Set((JSON.parse(fs.readFileSync(catPath, 'utf8')) as { misconceptions: { id: string }[] }).misconceptions.map(m => m.id));
      for (const m of seen) expect(ids.has(m), m).toBe(true);
    }
  });
  it('many distinct items per family', () => {
    for (const fam of Object.keys(GENS) as FamilyId[]) {
      const sgs = PLAN.filter(p => p.families.includes(fam)).map(p => p.id);
      const ids = new Set<string>();
      for (let s = 1; s <= 3000; s++) { const it = GENS[fam](rng(s), s, sgs[s % sgs.length]); ids.add(it.prompt + it.board); }
      expect(ids.size, fam).toBeGreaterThanOrEqual(40);
    }
  });
});

describe('the maths', () => {
  it('expand and factor are inverse, and keep the value for every x', () => {
    const R = rng(11);
    for (let i = 0; i < 2000; i++) {
      const f: Term = t(q(Math.floor(R() * 19) - 9 || 2, [1, 2, 3, 4][Math.floor(R() * 4)]!), R() < 0.3 ? 'x' : '');
      const e = [t(Math.floor(R() * 13) - 6 || 1, 'x'), t(Math.floor(R() * 21) - 10)];
      const out = expand(f, e);
      expect(same(divide(out, f), e)).toBe(true);
      for (const x of [-3, 0, 1, 2.5, 7]) expect(num(value(out, x))).toBeCloseTo(num(value([f], x)) * num(value(e, x)), 9);
    }
  });
  it('normal form merges like terms and keeps the sign with its term', () => {
    expect(exHtml(normal([t(2, 'x'), t(7), t(3, 'x'), t(1)]))).toBe('5<i>x</i> + 8');
    expect(exTex([t(7), t(-2, 'x'), t(4)])).toBe('7 - 2x + 4');
    expect(exTex(normal([t(1, 'x'), t(-1, 'x')]))).toBe('0');
    expect(prodTex(t(-1), [t(1, 'x'), t(6)])).toBe('-(x + 6)');
    expect(exTex(expand(t(q(1, 2)), [t(6, 'x'), t(-4)]))).toBe('3x - 2');
  });
  it('the tiles count a(px + q) = apx + aq', () => {
    let n = 0;
    for (let a = 1; a <= 9; a++) for (let p = 1; p <= 3; p++) for (let qq = 0; qq <= 8; qq++) {
      if (!tilesFit(a, p, qq)) continue;
      const m = computeTiles({ a, p, q: qq }); n++;
      expect(m.strips).toBe(a * p); expect(m.squares).toBe(a * qq);
    }
    expect(n).toBeGreaterThan(150);
    expect(() => computeTiles({ a: 10, p: 1, q: 3 })).toThrow();
  });
  it('the box: every cell is factor × term', () => {
    const g = computeGrid({ factor: t(-2), terms: [t(1, 'x'), t(-4)] });
    expect(g.cells.map(c => exTex([c]))).toEqual(['-2x', '8']);
    const m = computeGrid({ factor: t(3, 'x'), terms: [t(2, 'x'), t(3)] });
    expect(m.cells.map(c => exTex([c]))).toEqual(['6x^2', '9x']);
    expect(() => computeGrid({ factor: t(0), terms: [t(1, 'x')] })).toThrow();
  });
  it('term tiles: zero pairs leave the combined terms', () => {
    const m = computeTermTiles([t(5, 'x'), t(3), t(-5, 'x'), t(2)]);
    expect(m.x).toBe(0); expect(m.u).toBe(5); expect(m.pairsX).toBe(5);
    const m2 = computeTermTiles([t(4, 'x'), t(-1, 'x'), t(-6)]);
    expect(m2.x).toBe(3); expect(m2.u).toBe(-6);
  });
  it('the value table finds the counterexample', () => {
    const m = computeTable({ A: expand(t(2), [t(1, 'x'), t(3)]), B: [t(3, 'x'), t(4)], xs: [0, 1, 2, 3] });
    expect(m.rows.map(r => r.eq)).toEqual([false, false, true, false]);
  });
});

describe('voice', () => {
  it('every scripted panel line has a spoken text and vice versa', () => {
    const lines = JSON.parse(fs.readFileSync('pages/lessons/expand-and-factor/voice/lines.json', 'utf8')) as Record<string, { text: string }>;
    expect(Object.keys(lines).sort()).toEqual(Object.keys(SCRIPT).sort());
    for (const [id, l] of Object.entries(lines)) {
      expect(l.text, id).toBe(SCRIPT[id]!.say);
      expect(l.text.length, id).toBeGreaterThan(3);
      expect(l.text, id).not.toMatch(/\d\s*\/\s*\d|[<>×÷=−]|\d[a-z]\b|\(/);
    }
  });
});
void (null as unknown as Item);
