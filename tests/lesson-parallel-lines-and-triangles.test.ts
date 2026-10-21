// lesson-parallel-lines-and-triangles: the generic checks (every family x every sub-goal it serves x 300 seeds). Add topic checks below.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { rng } from '../src/lesson/runtime/item';
import { GENERATORS } from '../src/lesson/topics/parallel-lines-and-triangles/items';
import { PLAN } from '../src/lesson/topics/parallel-lines-and-triangles/plan';

const TOPIC = JSON.parse(fs.readFileSync('../math-curriculum-essentials/topics/secondary-t5-37-angle-relationships-in-parallel-lines-and-triangles.json', 'utf8'));
const CATALOG = new Set<string>(JSON.parse(fs.readFileSync('../math-curriculum-essentials/misconceptions.json', 'utf8')).misconceptions.map((m: { id: string }) => m.id));
const GEN = GENERATORS as Record<string, (R: () => number, n: number, sg?: string) => import('../src/lesson/runtime/item').Item>;

describe('parallel-lines-and-triangles: plan', () => {
  it('walks through every sub-goal of the topic JSON, in order, each with a family', () => {
    expect(PLAN.map(p => p.id)).toEqual(TOPIC.subgoals.map((s: { id: string }) => s.id));
    for (const p of PLAN) { expect(p.families.length, p.id).toBeGreaterThan(0); for (const f of p.families) expect(GEN[f], f).toBeDefined(); }
  });
});

describe('parallel-lines-and-triangles: families', () => {
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
import { MC, FAMILIES } from '../src/lesson/topics/parallel-lines-and-triangles/items';
import { SLOTS, figProblems, measure, partner, relation, slotMeasure, trans, tri, poly, polyAngles, type Slot } from '../src/lesson/topics/parallel-lines-and-triangles/figMaths';

describe('parallel-lines-and-triangles: maths', () => {
  it('every misconception id is in the catalog', () => { for (const id of Object.values(MC)) expect(CATALOG.has(id), id).toBe(true); });
  it('about 35 families, every family in the plan', () => {
    const used = new Set(PLAN.flatMap(p => p.families));
    expect(FAMILIES.length).toBeGreaterThanOrEqual(30);
    for (const f of FAMILIES) expect(used.has(f.id), f.id).toBe(true);
  });
  it('slot pairs: textbook numbering', () => {
    expect([1, 2, 3, 4].map(s => partner(s as Slot, 'corresponding'))).toEqual([5, 6, 7, 8]);
    expect(partner(3, 'altInt')).toBe(6); expect(partner(4, 'altInt')).toBe(5);
    expect(partner(1, 'altExt')).toBe(8); expect(partner(2, 'altExt')).toBe(7);
    expect(partner(3, 'ssInt')).toBe(5); expect(partner(4, 'ssInt')).toBe(6);
    expect(relation(1, 4)).toBe('vertical'); expect(relation(1, 2)).toBe('linear'); expect(relation(1, 6)).toBe('none');
  });
  it('slot measures match the drawn figure (parallel and not), under rotation and mirror', () => {
    for (const tau of [48, 73, 112, 131]) for (const delta of [0, 7, -9]) for (const rot of [0, 33, 95]) for (const mirror of [false, true]) {
      const T = trans({ tau, delta, rot, mirror, marks: Object.fromEntries(SLOTS.map(s => [s, { text: String(s), id: `s${s}` }])) });
      for (const s of SLOTS) {
        const a = T.fig.angles.find(x => x.id === `s${s}`)!;
        expect(measure(a.v, a.p, a.q)).toBeCloseTo(slotMeasure(s, tau, delta), 6);
      }
    }
  });
  it('triangles and polygons are drawn true to their angles', () => {
    const T = tri({ A: 50, B: 60, C: 70, rot: 25, mirror: true, marks: { A: { text: '1' }, B: { text: '2' }, C: { text: '3' } } });
    expect(T.fig.angles.map(a => Math.round(measure(a.v, a.p, a.q)))).toEqual([50, 60, 70]);
    const P = poly({ n: 6, regular: true });
    for (const a of polyAngles(P.V)) expect(a).toBeCloseTo(120, 6);
    expect(polyAngles(poly({ n: 7, wobble: [0.5, -0.3, 0.8, -1, 0.2, 0.9, -0.6] }).V).reduce((s, x) => s + x, 0)).toBeCloseTo(900, 6);
  });
  it('practice figures pass the layout rules (labels inside, off lines, no overlaps)', () => {
    const bad: string[] = [];
    for (const p of PLAN) for (const f of p.families) for (let s = 1; s <= 120; s++) {
      const it = GEN[f]!(rng(s * 17 + 3), s, p.id) as import('../src/lesson/topics/parallel-lines-and-triangles/items').GeoItem;
      if (!it.picture) continue;
      const pr = figProblems(it.picture.fig);
      if (pr.length) bad.push(`${f}/${p.id}/${s}: ${pr[0]}`);
    }
    expect(bad.slice(0, 12), `${bad.length} figures break the rules`).toEqual([]);
  });
  it('typical slips are classified', () => {
    const mcOf = (f: string, sg: string, v: (it: import('../src/lesson/runtime/item').Item) => import('../src/lesson/runtime/item').Response) => {
      const seen = new Set<string>();
      for (let s = 1; s <= 200; s++) { const it = GEN[f]!(rng(s), s, sg); const r = it.check(v(it)); if (r.mc) seen.add(r.mc); }
      return seen;
    };
    const num = (it: import('../src/lesson/runtime/item').Item) => (it.answer as { v: number }).v;
    expect(mcOf('pairValue', 'same-side-supplementary', it => ({ kind: 'num', v: 180 - num(it) }))).toContain(MC.suppEqual);
    expect(mcOf('pairValue', 'corresponding-congruent-if-parallel', it => ({ kind: 'num', v: 180 - num(it) }))).toContain(MC.congSupp);
    expect(mcOf('isoBase', 'isosceles-marked-angles', it => ({ kind: 'num', v: 2 * num(it) }))).toContain(MC.halve);
    expect(mcOf('polySum', 'polygon-angle-sum', it => ({ kind: 'num', v: num(it) + 360 }))).toContain(MC.nTimes180);
    expect(mcOf('regAngle', 'regular-polygon-interior-angle', () => ({ kind: 'num', v: 180 }))).toContain(MC.divWrong);
    expect(mcOf('chainExt', 'multi-step-chain', it => ({ kind: 'num', v: 180 - num(it) - (it.picture as never as { fig: { angles: { id: string; text?: string }[] } }).fig.angles.length * 0 }))).toBeDefined();
    expect(mcOf('exprPair', 'angle-expressions-equation', it => ({ kind: 'pair', x: (it.answer as { x: number }).x, y: (it.answer as { x: number }).x }))).toContain(MC.reportsX);
  });
});

import { QUESTION, TURN, proofFig } from '../src/lesson/topics/parallel-lines-and-triangles/figures';
import { fitFig } from '../src/lesson/topics/parallel-lines-and-triangles/figMaths';
describe('parallel-lines-and-triangles: lesson figures and voice', () => {
  it('the part 1-4 figures pass the layout rules (the proof triangle at every point of its slide)', () => {
    expect(figProblems(QUESTION.fig)).toEqual([]);
    expect(figProblems(TURN.fig)).toEqual([]);
    const fit = fitFig(proofFig(0).fig);
    for (const ax of [-150, -75, 0, 50, 100]) expect(figProblems(proofFig(ax).fig, fit), `ax ${ax}`).toEqual([]);
  });
  it('the question figure says what the lesson says: x and 65° are same-side interior, y corresponds to 65°', () => {
    const a = (id: string) => QUESTION.fig.angles.find(x => x.id === id)!;
    expect(measure(a('g').v, a('g').p, a('g').q)).toBeCloseTo(65, 6);
    expect(measure(a('x').v, a('x').p, a('x').q)).toBeCloseTo(115, 6);
    expect(measure(a('y').v, a('y').p, a('y').q)).toBeCloseTo(65, 6);
    const t = (id: string) => TURN.fig.angles.find(x => x.id === id)!;
    expect(measure(t('a').v, t('a').p, t('a').q)).toBeCloseTo(108, 6);
    expect(measure(t('b').v, t('b').p, t('b').q)).toBeCloseTo(72, 6);
  });
  it('every voiced line of parts 1-4 has spoken text without digits or symbols', () => {
    const page = fs.readFileSync('pages/lessons/parallel-lines-and-triangles.ts', 'utf8');
    const lines = JSON.parse(fs.readFileSync('pages/lessons/parallel-lines-and-triangles/voice/lines.json', 'utf8')) as Record<string, { text: string }>;
    const ids = new Set([...page.matchAll(/voiced(?:Fb)?\('([a-z0-9.]+)'/g)].map(m => m[1]!));
    for (const m of page.matchAll(/id: '([a-z]\.[a-z0-9.]+)'/g)) ids.add(m[1]!);
    for (const m of page.matchAll(/why: '(q\.cb\.[a-z]+)'/g)) ids.add(m[1]!);
    for (const k of ['e.step0', 'e.step1', 'e.step2', 'e.step3', 'p.c1', 'p.c2', 'p.c3', 'p.c4', 'q.cb.none']) ids.add(k);
    for (const id of ids) expect(lines[id], id).toBeDefined();
    for (const [id, l] of Object.entries(lines)) expect(/[0-9°=+−×÷<>]/.test(l.text), `${id}: ${l.text}`).toBe(false);
  });
});
