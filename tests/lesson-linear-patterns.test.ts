// lesson-linear-patterns: every family × every sub-goal it serves × 300 seeds; the model's maths; the voice.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { rng, type Item } from '../src/lesson/runtime/item';
import { GENS, PROBES, FAMILY_NAMES, CTX, aAn, tgFits, type FamilyId, type LinItem } from '../src/lesson/topics/linear-patterns/items';
import { PLAN } from '../src/lesson/topics/linear-patterns/plan';
import { LINES } from '../src/lesson/topics/linear-patterns/script';
import { computeTG, signed } from '../src/lesson/topics/linear-patterns/TableGraph';

const TOPIC = 'C:/Users/stelt/Claude code foler/math-curriculum-essentials/topics/primary.patterns.recognize-linear-relationship.json';
const SEEDS = 300;

describe('plan covers the topic', () => {
  it('every sub-goal of the topic JSON, in order, each with a family that exists', () => {
    if (fs.existsSync(TOPIC)) {
      const t = JSON.parse(fs.readFileSync(TOPIC, 'utf8')) as { subgoals: { id: string }[] };
      expect(PLAN.map(p => p.id)).toEqual(t.subgoals.map(s => s.id));
    }
    expect(PLAN.length).toBe(19);
    for (const p of PLAN) { expect(p.families.length).toBeGreaterThan(0); for (const f of p.families) expect(GENS[f as FamilyId]).toBeTypeOf('function'); }
    for (const f of Object.keys(GENS)) expect(FAMILY_NAMES[f as FamilyId]).toBeTruthy();
    // every family is used by some sub-goal
    for (const f of Object.keys(GENS)) expect(PLAN.some(p => p.families.includes(f)), f).toBe(true);
  });
});

const pairs = PLAN.flatMap(p => p.families.map(f => [f as FamilyId, p.id] as const));
describe.each(pairs)('family %s for sub-goal %s', (fam, sg) => {
  const items: LinItem[] = [];
  for (let s = 1; s <= SEEDS; s++) items.push(GENS[fam](rng(s * 7919 + fam.length), s, sg));
  it('the answer passes, the item is well formed', () => {
    for (const it of items) {
      expect(it.family).toBe(fam);
      const v = it.check(it.answer);
      if (!v.ok) throw new Error(`${it.id} ${it.prompt}: own answer rejected: ${v.say}`);
      expect(it.solution.length).toBeGreaterThan(0);
      expect(it.prompt.length).toBeGreaterThan(10);
      for (const s of [it.prompt, it.board, it.hero ?? '', it.solution.join(' '), v.say, ...(it.choices ?? [])]) expect(s, it.id).not.toMatch(/undefined|NaN|Infinity|\[object/);
      // no dollar sign inside TeX (MathJax would read it as math)
      expect(it.board + (it.hero ?? ''), it.id).not.toMatch(/\$/);
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
  it('the main misconceptions are classified', () => {
    for (const it of items) for (const p of PROBES.get(it as Item) ?? []) {
      const v = it.check(p.r);
      expect(v.ok, `${it.id} ${JSON.stringify(p.r)}`).toBe(false);
      expect(v.mc, `${it.id} ${it.prompt} ${JSON.stringify(p.r)}`).toBe(p.mc);
    }
  });
  it('pictures are drawable and match the maths', () => {
    for (const it of items) {
      if (!it.pic) continue;
      expect(tgFits(it.pic.tg), `${it.id} ${JSON.stringify(it.pic.tg.xs)} ${JSON.stringify(it.pic.tg.ys)}`).toBe(true);
      if (it.pic.then) expect(tgFits(it.pic.then.tg), it.id).toBe(true);
      for (const s of it.pic.solve) expect(['table', 'xsteps', 'changes', 'axes', 'points', 'stairs', 'units', 'line', 'segments', 'ruler', 'start', 'points2', 'line2']).toContain(s);
      const m = computeTG(it.pic.tg);
      // a straight line is only drawn through a constant table; the ruler only on a table that breaks
      if (it.pic.solve.includes('line') || it.pic.at.includes('line')) expect(m.constant, it.id).toBe(true);
      if (it.pic.solve.includes('ruler')) expect(m.constant, it.id).toBe(false);
      if (it.pic.solve.includes('start') || it.pic.then?.solve.includes('start')) expect((it.pic.then ? computeTG(it.pic.then.tg) : m).xs[0], it.id).toBe(0);
      const hdr = [...it.pic.tg.xHead, ...it.pic.tg.yHead];
      for (const t of hdr) expect(t.length, t).toBeLessThanOrEqual(7);
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
    // graph-as-picture also lives in the explain parts; every other id must be reachable in practice
    for (const mc of want) expect(seen.has(mc), mc).toBe(true);
  });
  it('many distinct items per family', () => {
    for (const fam of Object.keys(GENS) as FamilyId[]) {
      const sgs = PLAN.filter(p => p.families.includes(fam)).map(p => p.id);
      const ids = new Set<string>();
      for (let s = 1; s <= 3000; s++) { const it = GENS[fam](rng(s), s, sgs[s % sgs.length]); ids.add(it.prompt + it.board + (it.choices ?? []).join('|') + JSON.stringify(it.pic?.tg.ys ?? '')); }
      expect(ids.size, fam).toBeGreaterThanOrEqual(40);
    }
  });
});

describe('the table-graph model', () => {
  it('finds constant change per unit, with uneven steps too', () => {
    const a = computeTG({ xs: [0, 1, 2, 3], ys: [5, 8, 11, 14] });
    expect(a.constant).toBe(true); expect(a.rate).toEqual({ p: 3, q: 1 }); expect(a.start).toEqual({ p: 5, q: 1 });
    const b = computeTG({ xs: [1, 2, 4, 7], ys: [5, 8, 14, 23] });
    expect(b.constant).toBe(true); expect(b.diffs).toEqual([3, 6, 9]); expect(b.start).toEqual({ p: 2, q: 1 });
    const c = computeTG({ xs: [0, 1, 2, 3, 4], ys: [5, 8, 11, 15, 19] });
    expect(c.constant).toBe(false); expect(c.firstBreak).toBe(2);
    const d = computeTG({ xs: [0, 2, 4, 6, 8], ys: [40, 34, 28, 22, 16] });
    expect(d.rate).toEqual({ p: -3, q: 1 }); expect(d.start).toEqual({ p: 40, q: 1 });
    const z = computeTG({ xs: [0, 1, 2], ys: [7, 7, 7] });
    expect(z.constant).toBe(true); expect(z.rate?.p).toBe(0);
    expect(signed(-6)).toBe('−6'); expect(signed(0)).toBe('0'); expect(signed(4)).toBe('+4');
  });
  it('refuses what it cannot draw', () => {
    expect(() => computeTG({ xs: [0, 2, 1], ys: [1, 2, 3] })).toThrow();
    expect(() => computeTG({ xs: [0, 1], ys: [1, -2] })).toThrow();
    expect(() => computeTG({ xs: [0, 1, 2], ys: [1, 2] })).toThrow();
    expect(tgFits({ xs: [0, 1], ys: [1, 300], xHead: ['a', ''], yHead: ['b', ''], xName: 'a', yName: 'b' })).toBe(false);
  });
  it('the lesson tables are what the script says', () => {
    expect(computeTG({ xs: [0, 1, 2, 3, 4], ys: [5, 8, 11, 14, 17] }).constant).toBe(true);   // Leo
    expect(computeTG({ xs: [0, 1, 2, 3, 4], ys: [1, 3, 5, 8, 11] }).diffs).toEqual([2, 2, 3, 3]);   // Riley
  });
  it('contexts have short headers', () => {
    for (const c of CTX) for (const t of [...c.xh, ...c.yh]) expect(t.length, `${c.id} ${t}`).toBeLessThanOrEqual(7);
  });
});

describe('voice', () => {
  it('every scripted panel line has a spoken text and vice versa', () => {
    const lines = JSON.parse(fs.readFileSync('pages/lessons/linear-patterns/voice/lines.json', 'utf8')) as Record<string, { text: string }>;
    expect(Object.keys(lines).sort()).toEqual(Object.keys(LINES).sort());
    for (const [id, l] of Object.entries(lines)) {
      expect(l.text, id).toBe(LINES[id]!.say);
      expect(l.text.length, id).toBeGreaterThan(3);
      expect(l.text, id).not.toMatch(/\d|[<>×÷+−$%]/);
    }
  });
  it('the page uses only scripted ids', () => {
    const src = fs.readFileSync('pages/lessons/linear-patterns.ts', 'utf8');
    const used = [...src.matchAll(/(?:para|fb|sayOnly)\(\s*(?:[a-z!?.\s]*,\s*)?'([a-z]\.[a-z0-9-]+)'/g)].map(m => m[1]!);
    for (const id of used) expect(LINES[id], id).toBeTruthy();
  });
});

describe('quality layer (docs/lessons/QUALITY_LAYER.md)', () => {
  it('regression: "an $8 / an $11 / an $18 shipping fee", never "a $18"', () => {
    for (let s = 1; s <= 400; s++) for (const sg of ['words-to-table', 'classify-from-context']) {
      const it = GENS.wordsToTable(rng(s), s, sg);
      expect(it.prompt, it.prompt).not.toMatch(/\ba <b class="a">\$(8|11|18)\b/);
    }
    expect(aAn(18)).toBe('an'); expect(aAn(8)).toBe('an'); expect(aAn(80)).toBe('an'); expect(aAn(11)).toBe('an'); expect(aAn(12)).toBe('a');
  });
  it('the change rows end on the number the student types (the size of the change), and pairs mark both boxes', () => {
    const down = GENS.rowChange(rng(3), 1, 'constant-decrease-and-zero');
    expect(down.solution.at(-1)).toMatch(new RegExp(`<b class="s">${(down.answer as { v: number }).v}</b> less`));
    const pu = GENS.perUnit(rng(5), 1, 'equal-steps-larger-than-one');
    expect([...pu.solution.join(' ').matchAll(/<b class="s">/g)].length).toBe(2);
  });
  it('regression (oracle sweep): plants/hikes/savings never drop in onALine; contextLinear asks about the TOTAL; "5 in." not "5 in.."; "Whose savings"; "1 gallon"', () => {
    for (let s = 1; s <= 400; s++) {
      const o = GENS.onALine(rng(s), s, 'curve-vs-line') as LinItem & { pic: { tg: { ys: number[]; yName: string } } };
      if (!/water/.test(o.pic.tg.yName)) expect(o.pic.tg.ys.every((y, i, a) => i === 0 || y >= a[i - 1]!), o.prompt).toBe(true);
      const c = GENS.contextLinear(rng(s), s, 'classify-from-context');
      expect(c.prompt).not.toMatch(/each week saves \$\d+ more than the week before/);
      for (const f of ['wordsToTable', 'plotPoint', 'compareLines', 'couldOrMust', 'graphToWords'] as FamilyId[]) {
        const sg = PLAN.find(p => p.families.includes(f))!.id;
        const it = GENS[f](rng(s), s, sg);
        const text = [it.prompt, ...it.solution, ...(it.choices ?? [])].join(' ');
        expect(text).not.toMatch(/in\.\.|Whose saved|\b1 (gallons|miles|tiles|kids|squares)\b/);
      }
    }
  });
});
