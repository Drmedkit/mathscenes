// lesson-one-step-inequalities: every family × every sub-goal it serves × 300 seeds; the solving maths by
// substitution; the number-line model; the voice.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { rng, type Item } from '../src/lesson/runtime/item';
import { FAMILY_NAMES, FORMS, GENS, MC, PROBES, type LinePicture } from '../src/lesson/topics/one-step-inequalities/items';
import { PLAN } from '../src/lesson/topics/one-step-inequalities/plan';
import { SCRIPT } from '../src/lesson/topics/one-step-inequalities/script';
import { N, add, cmp, dec, holds, solve, sub, val } from '../src/lesson/topics/one-step-inequalities/ineq';
import { SignLine, autoAxis, estTexW } from '../src/lesson/topics/one-step-inequalities/SignLine';
import { frame } from '../src/blocks/block';
import { dusk } from '../src/lesson/dusk';

const TOPIC = 'C:/Users/stelt/Claude code foler/math-curriculum-essentials/topics/secondary.one-step-inequalities-and-signed-one-step-equations.json';
const SEEDS = 300;
const MF = frame(60, 70, 940, 940);

describe('plan covers the topic', () => {
  it('every sub-goal of the topic JSON, in order, each with a family that exists', () => {
    if (fs.existsSync(TOPIC)) {
      const t = JSON.parse(fs.readFileSync(TOPIC, 'utf8')) as { subgoals: { id: string }[] };
      expect(PLAN.map(p => p.id)).toEqual(t.subgoals.map(s => s.id));
    }
    expect(PLAN.length).toBe(11);
    for (const p of PLAN) { expect(p.families.length).toBeGreaterThan(0); for (const f of p.families) expect(GENS[f]).toBeTypeOf('function'); }
    for (const f of Object.keys(GENS)) expect(FAMILY_NAMES[f as keyof typeof FAMILY_NAMES]).toBeTruthy();
    // every family is used by some sub-goal
    for (const f of Object.keys(GENS)) expect(PLAN.some(p => p.families.includes(f as never)), f).toBe(true);
  });
});

/** the solution set of a one-step statement, checked by substitution around the boundary */
function checkSolve(it: Item): void {
  const f = FORMS.get(it);
  if (!f) return;
  const s = solve(f);
  const eps = N(1, 1000);
  const at = holds(f, s.b), right = holds(f, add(s.b, eps)), left = holds(f, sub(s.b, eps));
  const far = (d: number) => holds(f, add(s.b, N(d)));
  if (s.rel === '=') { expect(at, `${it.id}: the solution makes it true`).toBe(true); expect(right || left).toBe(false); return; }
  expect(at, `${it.id} boundary`).toBe(s.rel === '<=' || s.rel === '>=');
  const up = s.rel === '>' || s.rel === '>=';
  expect(right, `${it.id} right of the boundary`).toBe(up);
  expect(left, `${it.id} left of the boundary`).toBe(!up);
  expect(far(1000), `${it.id} far right`).toBe(up);
  expect(far(-1000), `${it.id} far left`).toBe(!up);
}

const pairs = PLAN.flatMap(p => p.families.map(f => [f, p.id] as const));
describe.each(pairs)('family %s for sub-goal %s', (fam, sg) => {
  const items: Item[] = [];
  for (let s = 1; s <= SEEDS; s++) items.push(GENS[fam](rng(s * 7919 + fam.length), s, sg));
  it('the answer passes, the item is well formed, the maths solves by substitution', () => {
    for (const it of items) {
      expect(it.family).toBe(fam);
      const v = it.check(it.answer);
      if (!v.ok) throw new Error(`${it.id} ${it.prompt}: own answer rejected: ${v.say}`);
      expect(it.solution.length).toBeGreaterThan(0);
      for (const s of [it.prompt, it.board, it.solution.join(' '), ...(it.choices ?? []), v.say]) expect(s, `${it.id}: ${s}`).not.toMatch(/undefined|NaN|Infinity|\[object/);
      checkSolve(it);
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
  it('pictures are drawable and tell the truth', () => {
    for (const it of items) {
      const pic = it.picture as unknown as LinePicture | undefined;
      if (!pic) continue;
      let blk;
      try { blk = SignLine(pic.params, MF, dusk); } catch (e) { throw new Error(`${it.id} ${it.board}: ${(e as Error).message}`); }
      for (const k of [...pic.show, ...pic.solve]) expect(blk.steps, `${it.id} key ${k}`).toContain(k);
      const f = FORMS.get(it);
      // every test value's check / cross agrees with substitution (no domain on the item)
      if (f && f.rel !== '=') for (const t of pic.params.tests ?? []) {
        const lo = (pic.params.marks ?? []).find(m => m.key === 'm.lo');
        const inDomain = !lo || (lo.dot === 'closed' ? t.v >= lo.v : t.v > lo.v);
        if (inDomain && it.family !== 'contextCount') expect(t.ok, `${it.id} test ${t.v}`).toBe(holds(f, dec(t.v)));
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
    for (const mc of Object.values(MC)) expect(seen.has(mc), mc).toBe(true);
    // the topic's own list (topic JSON subgoals[].misconceptions)
    if (fs.existsSync(TOPIC)) {
      const t = JSON.parse(fs.readFileSync(TOPIC, 'utf8')) as { subgoals: { misconceptions: string[] }[] };
      for (const mc of t.subgoals.flatMap(s => s.misconceptions)) expect(seen.has(mc), mc).toBe(true);
    }
  });
  it('many distinct items per family', () => {
    for (const fam of Object.keys(GENS) as (keyof typeof GENS)[]) {
      const sgs = PLAN.filter(p => p.families.includes(fam)).map(p => p.id);
      const ids = new Set<string>();
      for (let s = 1; s <= 3000; s++) { const it = GENS[fam](rng(s), s, sgs[s % sgs.length]); ids.add(it.prompt + it.board); }
      expect(ids.size, fam).toBeGreaterThanOrEqual(40);
    }
  });
});

describe('the maths', () => {
  it('solve keeps the symbol under + − and positive scaling, reverses it under a negative factor', () => {
    let n = 0;
    for (const op of ['add', 'sub', 'mul', 'div'] as const) for (let p = -6; p <= 6; p++) for (let q = -8; q <= 8; q++) for (const rel of ['<', '<=', '>', '>='] as const) {
      if ((op === 'mul' || op === 'div') && p === 0) continue;
      const f = { op, p: N(p), q: N(q), rel };
      const s = solve(f);
      expect(s.flips).toBe((op === 'mul' || op === 'div') && p < 0);
      for (let x = -60; x <= 60; x++) {
        const X = N(x, 2);
        const want = s.rel === '<' ? cmp(X, s.b) < 0 : s.rel === '<=' ? cmp(X, s.b) <= 0 : s.rel === '>' ? cmp(X, s.b) > 0 : cmp(X, s.b) >= 0;
        expect(holds(f, X), `${op} ${p} ${rel} ${q} at ${x / 2}`).toBe(want);
      }
      n++;
    }
    expect(n).toBeGreaterThan(1500);
  });
  it('exact decimals', () => {
    expect(val(add(dec(2.5), dec(-1.25)))).toBe(1.25);
    expect(() => dec(0.123456)).toThrow();
  });
});

describe('the number-line model', () => {
  const ax = (id: string, y: number, side: 'above' | 'below') => ({ id, lo: -10, hi: 10, tick: 1, every: 5, y, side, name: id });
  it('maps compute images and the order rule', () => {
    const b = SignLine({ axes: [ax('a', 330, 'above'), ax('b', 720, 'below')], maps: [{ key: 'm', from: 'a', to: 'b', vs: [-6, -8, -10], op: { kind: 'mul', by: -0.5 }, role: 'pick', tex: '\\div(-2)' }] }, MF, dusk);
    expect(b.mapped.m!.map(q => q.to)).toEqual([3, 4, 5]);
    expect(b.mapped.m!.reverses).toBe(true);
    const c = SignLine({ axes: [ax('a', 330, 'above'), ax('b', 720, 'below')], maps: [{ key: 'm', from: 'a', to: 'b', vs: [5, 2, -1], op: { kind: 'add', by: 3 }, role: 'pick', tex: '+3' }] }, MF, dusk);
    expect(c.mapped.m!.reverses).toBe(false);
  });
  it('refuses what it cannot show', () => {
    expect(() => SignLine({ axes: [ax('a', 560, 'below')], marks: [{ key: 'k', axis: 'a', v: 14, tex: '14', role: 'link', dot: 'open' }] }, MF, dusk)).toThrow(/off the line/);
    expect(() => SignLine({ axes: [{ id: 'a', lo: -10, hi: 10, tick: 1, every: 1, y: 560, side: 'below' }] }, MF, dusk)).toThrow(/overlap/);
    expect(() => SignLine({ axes: [ax('a', 330, 'above'), ax('b', 720, 'below')], maps: [{ key: 'm', from: 'a', to: 'b', vs: [8], op: { kind: 'mul', by: -2 }, role: 'pick', tex: '\\times(-2)' }] }, MF, dusk)).toThrow(/off the line/);
  });
  it('auto axes fit their values', () => {
    for (const vs of [[-3], [12.5, 0], [-40, 5], [0.25, 3], [6.67, 7, 6], [55, 60, 50]]) {
      const a = autoAxis(vs);
      for (const v of vs) { expect(v).toBeGreaterThanOrEqual(a.lo); expect(v).toBeLessThanOrEqual(a.hi); }
      expect(() => SignLine({ axes: [{ id: 'x', ...a, y: 560, side: 'below' }] }, MF, dusk)).not.toThrow();
    }
    expect(estTexW('-10', 60)).toBeGreaterThan(estTexW('5', 60));
  });
});

describe('voice', () => {
  it('every scripted panel line has a spoken text and vice versa', () => {
    const lines = JSON.parse(fs.readFileSync('pages/lessons/one-step-inequalities/voice/lines.json', 'utf8')) as Record<string, { text: string }>;
    expect(Object.keys(lines).sort()).toEqual(Object.keys(SCRIPT).sort());
    for (const [id, l] of Object.entries(lines)) {
      expect(l.text.length, id).toBeGreaterThan(3);
      expect(l.text, id).not.toMatch(/\d\s*\/\s*\d|[<>×÷≤≥−]|\d-\d/);
    }
  });
});
