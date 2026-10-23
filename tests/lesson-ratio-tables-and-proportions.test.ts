// lesson-ratio-tables-and-proportions: every family × every sub-goal it serves × 300 seeds (the answer passes, choices
// are unique with exactly one right, the main misconceptions are classified, pictures fit and match the maths); the
// RatioRows model's maths; the plan covers the topic; the voice lines match the script.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { rng, type Item } from '../src/lesson/runtime/item';
import { frame } from '../src/blocks/block';
import { GENS, PROBES, FAMILY_NAMES, CTX, type FamilyId, type RTItem, type RRPic } from '../src/lesson/topics/ratio-tables-and-proportions/items';
import { PLAN } from '../src/lesson/topics/ratio-tables-and-proportions/plan';
import { LINES } from '../src/lesson/topics/ratio-tables-and-proportions/script';
import { computeTable, fmtQ, fmtVal, rrFits, planLayout, roughMeasure, lineThrough } from '../src/lesson/topics/ratio-tables-and-proportions/RatioRows';

const TOPIC = 'C:/Users/stelt/Claude code foler/math-curriculum-essentials/topics/primary.measurement.relationships-between-quantities.json';
const MCF = 'C:/Users/stelt/Claude code foler/math-curriculum-essentials/misconceptions.json';
const SEEDS = 300;
const FR = frame(60, 70, 1120, 940);
const mcIds = fs.existsSync(MCF) ? new Set((JSON.parse(fs.readFileSync(MCF, 'utf8')) as { misconceptions: { id: string }[] }).misconceptions.map(m => m.id)) : null;

describe('plan covers the topic', () => {
  it('every sub-goal of the topic JSON, in order, each with families that exist', () => {
    if (fs.existsSync(TOPIC)) {
      const t = JSON.parse(fs.readFileSync(TOPIC, 'utf8')) as { subgoals: { id: string }[] };
      expect(PLAN.map(p => p.id)).toEqual(t.subgoals.map(s => s.id));
    }
    expect(PLAN.length).toBe(20);
    for (const p of PLAN) { expect(p.families.length).toBeGreaterThan(0); for (const f of p.families) expect(GENS[f as FamilyId]).toBeTypeOf('function'); }
    for (const f of Object.keys(GENS)) { expect(FAMILY_NAMES[f as FamilyId]).toBeTruthy(); expect(PLAN.some(p => p.families.includes(f)), f).toBe(true); }
  });
});

/** the step keys a picture may use */
function validSteps(p: RRPic): Set<string> {
  const s = new Set<string>();
  p.p.shelf?.configs.forEach((_, i) => s.add('shelf' + i));
  p.p.tables.forEach((T, j) => {
    const pre = j ? 'B' : '';
    s.add(pre + 'table');
    (T.ops ?? []).forEach((_, i) => s.add(pre + 'op' + i));
    if (T.quot) s.add(pre + 'quot');
    if (T.zero !== undefined && T.zero !== null) s.add(pre + 'zero');
    if (T.hide?.length) s.add(pre + 'fill');
    if (j === 0) { s.add('strike'); s.add('fix'); }
  });
  if (p.p.graph) for (const k of ['axes', 'points', 'line', 'origin']) s.add(k);
  return s;
}

const pairs = PLAN.flatMap(p => p.families.map(f => [f as FamilyId, p.id] as const));
describe.each(pairs)('family %s for sub-goal %s', (fam, sg) => {
  const items: RTItem[] = [];
  for (let s = 1; s <= SEEDS; s++) items.push(GENS[fam](rng(s * 7919 + fam.length), s, sg));
  it('the answer passes, the item is well formed', () => {
    for (const it of items) {
      expect(it.family).toBe(fam);
      const v = it.check(it.answer);
      if (!v.ok) throw new Error(`${it.id} ${it.prompt}: own answer rejected: ${v.say}`);
      expect(it.solution.length).toBeGreaterThan(0);
      expect(it.prompt.length).toBeGreaterThan(10);
      for (const s of [it.prompt, it.board, it.hero ?? '', it.solution.join(' '), v.say, ...(it.choices ?? [])]) expect(s, it.id).not.toMatch(/undefined|NaN|Infinity|\[object|null/);
      // no dollar sign inside TeX (MathJax would read it as math); the board stays short
      expect(it.board + (it.hero ?? ''), it.id).not.toMatch(/\$/);
      // every board line fits the slate at >= 60 px: a rough count of what MathJax draws
      for (const ln of [...it.board.split(' | '), ...(it.hero ?? '').split(' | ')]) {
        const vis = ln.replace(/\\text\{([^}]*)\}/g, '$1').replace(/\\(?:to|times|div|qquad|quad)/g, 'xx').replace(/\\[a-z]+|[{}]|\\[,; ]/g, '');
        expect(vis.length, `${it.id}: ${ln}`).toBeLessThanOrEqual(/\d/.test(vis) ? 18 : 24);
      }
      if (it.input === 'num' && it.answer.kind === 'num') expect(Number.isFinite(it.answer.v)).toBe(true);
    }
  });
  it('choices are unique with exactly one right', () => {
    for (const it of items) {
      if (it.input !== 'choice') continue;
      const ch = it.choices ?? [];
      expect(ch.length).toBeGreaterThanOrEqual(3);
      expect(new Set(ch).size, it.prompt).toBe(ch.length);
      const right = ch.map((_, i) => it.check({ kind: 'choice', i }).ok).filter(Boolean).length;
      expect(right, `${it.prompt} ${ch.join(' / ')}`).toBe(1);
    }
  });
  it('the main misconceptions are classified, with ids from the catalogue', () => {
    for (const it of items) for (const p of PROBES.get(it as Item) ?? []) {
      const v = it.check(p.r);
      expect(v.ok, `${it.id} ${JSON.stringify(p.r)}`).toBe(false);
      expect(v.mc, `${it.id} ${it.prompt} ${JSON.stringify(p.r)}`).toBe(p.mc);
      if (mcIds) expect(mcIds.has(p.mc), p.mc).toBe(true);
    }
  });
  it('pictures fit the frame and use only their own steps', () => {
    for (const it of items) {
      const pics = [it.pic, it.pic?.then].filter((x): x is RRPic => !!x);
      for (const p of pics) {
        if (p.at.length || p.solve.length) {
          let err = '';
          try { planLayout(p.p, FR, roughMeasure); } catch (e) { err = (e as Error).message; }
          expect(err, `${it.id} ${JSON.stringify(p.p.tables.map(t => t.rows))}`).toBe('');
          expect(rrFits(p.p, FR)).toBe(true);
        }
        const ok = validSteps(p);
        for (const s of [...p.at, ...p.solve]) expect(ok.has(s), `${it.id}: step ${s}`).toBe(true);
        for (const T of p.p.tables) for (const h of [...T.heads[0], ...T.heads[1]]) expect(h.length, h).toBeLessThanOrEqual(9);
      }
    }
  });
});

describe('misconception coverage', () => {
  it('every catalogue misconception of the topic shows up in some verdict or probe', () => {
    const seen = new Set<string>();
    for (const [fam, sg] of pairs) for (let s = 1; s <= 150; s++) {
      const it = GENS[fam](rng(s * 31 + 5), s, sg);
      for (const p of PROBES.get(it) ?? []) seen.add(p.mc);
      if (it.input === 'choice') (it.choices ?? []).forEach((_, i) => { const v = it.check({ kind: 'choice', i }); if (v.mc) seen.add(v.mc); });
    }
    const topic = fs.existsSync(TOPIC) ? JSON.parse(fs.readFileSync(TOPIC, 'utf8')) as { subgoals: { misconceptions: string[] }[] } : null;
    const want = topic ? [...new Set(topic.subgoals.flatMap(s => s.misconceptions))] : [];
    for (const mc of want) expect(seen.has(mc), mc).toBe(true);
  });
  it('many distinct items per family', () => {
    for (const fam of Object.keys(GENS) as FamilyId[]) {
      const sgs = PLAN.filter(p => p.families.includes(fam)).map(p => p.id);
      const ids = new Set<string>();
      for (let s = 1; s <= 3000; s++) { const it = GENS[fam](rng(s), s, sgs[s % sgs.length]); ids.add(it.prompt + it.board + (it.choices ?? []).join('|') + JSON.stringify(it.pic?.p.tables.map(t => t.rows) ?? '')); }
      expect(ids.size, fam).toBeGreaterThanOrEqual(40);
    }
  });
});

describe('the RatioRows model', () => {
  it('finds the constant quotient, the row that breaks, and the zero row', () => {
    const a = computeTable({ rows: [[4, 6], [2, 3], [10, 15]] });
    expect(a.constant).toBe(true); expect(a.k).toEqual({ p: 3, q: 2 }); expect(a.proportional).toBe(true);
    const b = computeTable({ rows: [[0, 5], [1, 8], [2, 11], [3, 19]] });
    expect(b.constant).toBe(false); expect(b.zero).toBe('start'); expect(b.firstBreak).toBe(2); expect(b.proportional).toBe(false);
    const z = computeTable({ rows: [[0, 0], [2, 6], [4, 13]] });
    expect(z.zero).toBe('origin'); expect(z.constant).toBe(false); expect(z.quots[0]).toBeNull();
    const ok = computeTable({ rows: [[0, 0], [2, 6], [4, 12]] });
    expect(ok.proportional).toBe(true);
    const m = computeTable({ rows: [[2, 3], [4, 6.5]] });
    expect(m.constant).toBe(false);
    const cents = computeTable({ rows: [[2, 3], [3, 4.5], [5, 7]] });
    expect(cents.firstBreak).toBe(2);
  });
  it('checks every operation on both columns', () => {
    expect(computeTable({ rows: [[4, 6], [2, 3], [10, 15]], ops: [{ kind: 'div', from: 0, to: 1, f: 2 }, { kind: 'mul', from: 1, to: 2, f: 5 }] }).opOk).toEqual([true, true]);
    expect(() => computeTable({ rows: [[4, 6], [2, 4]], ops: [{ kind: 'div', from: 0, to: 1, f: 2 }] })).toThrow();
    expect(computeTable({ rows: [[5, 30], [2, 12], [7, 42]], ops: [{ kind: 'add', a: 0, b: 1, to: 2 }] }).opOk).toEqual([true]);
    expect(computeTable({ rows: [[5, 30], [2, 12], [3, 18]], ops: [{ kind: 'sub', a: 0, b: 1, to: 2 }] }).opOk).toEqual([true]);
    expect(() => computeTable({ rows: [[2, 12], [5, 30], [-3, -18]], ops: [{ kind: 'sub', a: 0, b: 1, to: 2 }] })).toThrow();
    expect(computeTable({ rows: [[2, 3], [4, 6]], ops: [{ kind: 'step', from: 0, to: 1, da: 2, db: 3 }] }).opOk).toEqual([true]);
    expect(() => computeTable({ rows: [[2, 3], [4, 5]], ops: [{ kind: 'step', from: 0, to: 1, da: 2, db: 3 }] })).toThrow();
  });
  it('writes numbers as the table shows them', () => {
    expect(fmtVal(4.5, '$')).toBe('$4.50'); expect(fmtVal(12, '$')).toBe('$12'); expect(fmtVal(12, '$', true)).toBe('$12.00');
    expect(fmtVal(2.5, 'h')).toBe('2½'); expect(fmtVal(0.75, 'h')).toBe('¾'); expect(fmtVal(1.4, 'n')).toBe('1.4');
    expect(fmtQ({ p: 3, q: 2 })).toBe('1.5'); expect(fmtQ({ p: 7, q: 4 })).toBe('1.75'); expect(fmtQ({ p: 4, q: 3 })).toBe('4/3'); expect(fmtQ(null)).toBe('none');
    expect(lineThrough([[1, 3], [2, 6], [4, 12]])).toEqual({ s: 0, r: 3 });
    expect(lineThrough([[1, 3], [2, 6], [4, 13]])).toBeNull();
  });
  it('the lesson pictures fit (parts 1-4)', () => {
    const LEMON = { heads: [['lemon', '(cups)'], ['water', '(cups)']] as const, rows: [[4, 6], [2, 3], [10, 15]] as const, ops: [{ kind: 'div' as const, from: 0, to: 1, f: 2 }, { kind: 'mul' as const, from: 1, to: 2, f: 5 }], quot: ['water ÷', 'lemon'] as const };
    const five = Array.from({ length: 5 }, () => [2, 3] as const);
    expect(rrFits({ tables: [LEMON], shelf: { style: 'cups', middle: true, configs: [[[4, 6], [10, 0]]], tags: [['the recipe', 'you have']] } }, FR)).toBe(true);
    expect(rrFits({ tables: [LEMON], shelf: { style: 'cups', configs: [[[4, 6]], [[2, 3], [2, 3]], five] } }, FR)).toBe(true);
    const cases = (n: number) => Array.from({ length: n }, () => [1, 8] as const);
    expect(rrFits({ tables: [{ heads: [['cases', ''], ['bottles', '']], rows: [[3, 24], [1, 8], [7, 56]], ops: [{ kind: 'div', from: 0, to: 1, f: 3 }, { kind: 'mul', from: 1, to: 2, f: 7 }], hide: [[1, 1], [2, 1]] }], shelf: { style: 'case', configs: [cases(3), cases(1), cases(7)] } }, FR)).toBe(true);
    expect(rrFits({ tables: [{ heads: [['hours', ''], ['cost', '($)']], rows: [[0, 5], [1, 8], [2, 11], [3, 19]], zero: 0, ops: [{ kind: 'add', a: 1, b: 2, to: 3 }], quot: ['dollars', 'per hour'] }] }, FR)).toBe(true);
  });
  it('contexts have short headers', () => {
    for (const c of CTX) for (const t of [...c.A, ...c.B]) expect(t.length, `${c.id} ${t}`).toBeLessThanOrEqual(9);
  });
});

describe('voice', () => {
  it('every scripted panel line has a spoken text and vice versa', () => {
    const lines = JSON.parse(fs.readFileSync('pages/lessons/ratio-tables-and-proportions/voice/lines.json', 'utf8')) as Record<string, { text: string }>;
    expect(Object.keys(lines).sort()).toEqual(Object.keys(LINES).sort());
    for (const [id, l] of Object.entries(lines)) {
      expect(l.text, id).toBe(LINES[id]!.say);
      expect(l.text.length, id).toBeGreaterThan(3);
      expect(l.text, id).not.toMatch(/\d|[<>×÷+−$%]/);
    }
  });
  it('the page uses only scripted ids, and every scripted id is used', () => {
    const src = fs.readFileSync('pages/lessons/ratio-tables-and-proportions.ts', 'utf8');
    const used = new Set([...src.matchAll(/'([qetp]\.[a-z0-9.-]+)'/g)].map(m => m[1]!));
    for (const id of used) if (/^[qetp]\.(intro|ask|sure|s\d|why|unit|scale|rate|claim|build|k\d|c\d|w-|done|u-|r-|cb|s-)/.test(id)) expect(LINES[id], id).toBeTruthy();
    for (const id of Object.keys(LINES)) {
      const dyn = /^(e\.s\d|t\.cb-\d|p\.k\d|p\.c\d)$/.test(id);
      expect(dyn || used.has(id), `unused line ${id}`).toBe(true);
    }
  });
});

describe('quality layer: oracle sweep fixes', () => {
  const sgOf = (f: FamilyId) => PLAN.find(p => (p.families as string[]).includes(f))!.id;
  const plainT = (h: string) => h.replace(/<[^>]+>/g, '');
  it('testTable never makes a table of a fixed unit conversion (4 gal = 6 qt, 1 yd = 2 ft)', () => {
    for (let s = 1; s <= 600; s++) expect(plainT(GENS.testTable(rng(s), s, 'test-every-pair').prompt)).not.toMatch(/gallon|quart|pint|yard/);
  });
  it('one item, one verb: "1 bag holds", "What does 1 notebook cost?", "1 hour"', () => {
    for (let s = 1; s <= 300; s++) for (const f of ['timesAsMany', 'whatStays', 'subRows', 'pairTable', 'unitRow'] as FamilyId[]) {
      const it = GENS[f](rng(s), s, sgOf(f));
      const t = [it.prompt, ...it.solution].map(plainT).join(' ');
      expect(t, t).not.toMatch(/(?<!does )\b1 (bag|batch of muffins|notebook|bus ticket|pound of grapes|can of paint) (hold|use|cost|cover)\b|\bdo 1 \w|\b1 hours\b/);
    }
  });
});
