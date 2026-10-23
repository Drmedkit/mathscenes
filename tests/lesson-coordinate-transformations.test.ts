// lesson-coordinate-transformations: every family × every sub-goal it serves × 300 seeds; the model's maths and layout;
// the voice.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { rng, type Item } from '../src/lesson/runtime/item';
import { GENS, PROBES, FAMILY_NAMES, type FamilyId, type CTItem } from '../src/lesson/topics/coordinate-transformations/items';
import { PLAN } from '../src/lesson/topics/coordinate-transformations/plan';
import { LINES } from '../src/lesson/topics/coordinate-transformations/script';
import { apply, angleAt, collinear, dist, movesFitting, orient, parallel, ruleText, ruleTex, applyAll, type V } from '../src/lesson/topics/coordinate-transformations/coordMaths';
import { CoordGrid } from '../src/lesson/topics/coordinate-transformations/CoordGrid';
import { dusk } from '../src/lesson/dusk';
import { frame } from '../src/blocks/block';

const TOPIC = 'C:/Users/stelt/Claude code foler/math-curriculum-essentials/topics/primary.geometry.coordinate-plane-transformations.json';
const SEEDS = 300;
// the block measures words with a canvas when there is one; in node it estimates (a little wider than real text)
(globalThis as { document?: unknown }).document ??= { createElement: () => ({ getContext: () => null }) };
const FR = frame(50, 70, 1020, 940);   // the page's model frame

describe('plan covers the topic', () => {
  it('every sub-goal of the topic JSON, in order, each with a family that exists', () => {
    if (fs.existsSync(TOPIC)) {
      const t = JSON.parse(fs.readFileSync(TOPIC, 'utf8')) as { subgoals: { id: string }[] };
      expect(PLAN.map(p => p.id)).toEqual(t.subgoals.map(s => s.id));
    }
    expect(PLAN.length).toBe(21);
    for (const p of PLAN) { expect(p.families.length).toBeGreaterThan(0); for (const f of p.families) expect(GENS[f as FamilyId]).toBeTypeOf('function'); }
    for (const f of Object.keys(GENS)) expect(FAMILY_NAMES[f as FamilyId]).toBeTruthy();
    for (const f of Object.keys(GENS)) expect(PLAN.some(p => p.families.includes(f)), f).toBe(true);
  });
});

const pairs = PLAN.flatMap(p => p.families.map(f => [f as FamilyId, p.id] as const));
describe.each(pairs)('family %s for sub-goal %s', (fam, sg) => {
  const items: CTItem[] = [];
  for (let s = 1; s <= SEEDS; s++) items.push(GENS[fam](rng(s * 7919 + fam.length), s, sg));
  it('the answer passes, the item is well formed', () => {
    for (const it of items) {
      expect(it.family).toBe(fam);
      const v = it.check(it.answer);
      if (!v.ok) throw new Error(`${it.id} ${it.prompt}: own answer rejected: ${v.say}`);
      expect(it.solution.length).toBeGreaterThan(0);
      expect(it.prompt.length).toBeGreaterThan(10);
      for (const s of [it.prompt, it.board, it.hero ?? '', it.solution.join(' '), v.say, ...(it.choices ?? [])]) expect(s, it.id).not.toMatch(/undefined|NaN|Infinity|\[object|−0(?![.\d])/);
      // TeX on the board: no unicode minus or dollar (MathJax), balanced braces
      for (const t of [it.board, it.hero ?? '']) {
        expect(t, it.id).not.toMatch(/[−$]/);
        expect((t.match(/\{/g) ?? []).length, t).toBe((t.match(/\}/g) ?? []).length);
      }
      if (it.input === 'pair') { expect(it.answer.kind).toBe('pair'); expect(it.pairLead).toMatch(/′ = \($/); }
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
  it('pictures lay out on the page (grid squares, letters) and show the maths', () => {
    let fails = 0;
    for (const it of items) {
      if (!it.pic) continue;
      try {
        const b = CoordGrid(it.pic.p, FR, dusk);
        // the drawn image is the move applied to every vertex
        if (it.pic.p.move && !it.pic.p.img) b.img!.forEach((q, i) => expect(q).toEqual(apply(it.pic!.p.move!, b.pre[i]!)));
      } catch (e) { fails++; if (fails < 4) console.warn(it.id, (e as Error).message, JSON.stringify(it.pic.p)); }
    }
    expect(fails, `${fam}: ${fails} pictures fail`).toBe(0);
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
    const missing = want.filter(mc => !seen.has(mc));
    expect(missing).toEqual([]);
  });
  it('many distinct items per family', () => {
    for (const fam of Object.keys(GENS) as FamilyId[]) {
      const sgs = PLAN.filter(p => p.families.includes(fam)).map(p => p.id);
      const ids = new Set<string>();
      for (let s = 1; s <= 2000; s++) { const it = GENS[fam](rng(s), s, sgs[s % sgs.length]); ids.add(it.prompt + it.board + (it.choices ?? []).join('|')); }
      expect(ids.size, fam).toBeGreaterThanOrEqual(40);
    }
  });
});

describe('the coordinate maths', () => {
  it('slides and reflections', () => {
    expect(apply({ kind: 'slide', dx: 5, dy: -4 }, [-2, 3])).toEqual([3, -1]);
    expect(apply({ kind: 'reflect', axis: 'x' }, [4, -3])).toEqual([4, 3]);
    expect(apply({ kind: 'reflect', axis: 'y' }, [-3, -2])).toEqual([3, -2]);
    expect(apply({ kind: 'reflect', axis: 'y' }, [0, 5])).toEqual([0, 5]);
    expect(apply({ kind: 'mirror', line: 'x', k: 2 }, [5, 1])).toEqual([-1, 1]);
    expect(apply({ kind: 'mirror', line: 'y', k: -1 }, [3, 2])).toEqual([3, -4]);
    expect(apply({ kind: 'slide', dx: 0.4, dy: -1.3 }, [1.3, 0.2])).toEqual([1.7, -1.1]);
    expect(ruleText({ kind: 'slide', dx: 5, dy: -4 })).toBe('(x, y) → (x + 5, y − 4)');
    expect(ruleTex({ kind: 'reflect', axis: 'x' })).toBe('(x,\\,y)\\to(x,\\,-y)');
  });
  it('rigid moves keep lengths, angles, straightness and parallels; reflections reverse the order', () => {
    const T: V[] = [[-2, 3], [1, 4], [-1, 1]];
    for (const m of [{ kind: 'slide', dx: 5, dy: -4 }, { kind: 'reflect', axis: 'x' }, { kind: 'reflect', axis: 'y' }, { kind: 'mirror', line: 'x', k: 2 }] as const) {
      const I = applyAll(m, T);
      for (let i = 0; i < 3; i++) {
        expect(dist(I[i]!, I[(i + 1) % 3]!)).toBeCloseTo(dist(T[i]!, T[(i + 1) % 3]!), 9);
        expect(angleAt(I, i)).toBeCloseTo(angleAt(T, i), 9);
      }
      expect(orient(I)).toBe(m.kind === 'slide' ? orient(T) : -orient(T));
      const L = applyAll(m, [[0, 0], [1, 2], [2, 4]]);
      expect(collinear(L[0]!, L[1]!, L[2]!)).toBe(true);
      const Q = applyAll(m, [[0, 0], [3, 1], [4, 3], [1, 2]]);
      expect(parallel(Q[0]!, Q[1]!, Q[3]!, Q[2]!)).toBe(true);
    }
    // non-rigid rules change a length
    const S = applyAll({ kind: 'stretch', a: 2 }, T);
    expect(dist(S[0]!, S[1]!)).not.toBeCloseTo(dist(T[0]!, T[1]!), 3);
  });
  it('names a move only when every pair fits', () => {
    const T: V[] = [[-2, 3], [1, 4], [-1, 1]];
    expect(movesFitting(T, applyAll({ kind: 'slide', dx: 5, dy: -4 }, T))).toEqual([{ kind: 'slide', dx: 5, dy: -4 }]);
    expect(movesFitting(T, applyAll({ kind: 'reflect', axis: 'x' }, T))).toEqual([{ kind: 'reflect', axis: 'x' }]);
    const bad = applyAll({ kind: 'slide', dx: 5, dy: -4 }, T); bad[2] = [bad[2]![0] + 1, bad[2]![1]];
    expect(movesFitting(T, bad)).toEqual([]);
  });
  it('the lesson figures lay out and say what the script says', () => {
    const ex = CoordGrid({ pre: { pts: [[-2, 3], [1, 4], [-1, 1]], names: ['A', 'B', 'C'] }, move: { kind: 'slide', dx: 5, dy: -4 } }, FR, dusk);
    expect(ex.img).toEqual([[3, -1], [6, 0], [4, -3]]);
    const turn = CoordGrid({ pre: { pts: [[-5, 1], [-1, 3], [-3, -2]], names: ['D', 'E', 'F'] }, move: { kind: 'reflect', axis: 'y' } }, FR, dusk);
    expect(turn.img).toEqual([[5, 1], [1, 3], [3, -2]]);
    expect(apply({ kind: 'reflect', axis: 'x' }, [4, -3])).toEqual([4, 3]);
    expect(() => CoordGrid({ pre: { pts: [[-30, 0]] } }, FR, dusk)).toThrow();
  });
});

describe('voice', () => {
  it('every scripted panel line has a spoken text and vice versa', () => {
    const lines = JSON.parse(fs.readFileSync('pages/lessons/coordinate-transformations/voice/lines.json', 'utf8')) as Record<string, { text: string }>;
    expect(Object.keys(lines).sort()).toEqual(Object.keys(LINES).sort());
    for (const [id, l] of Object.entries(lines)) {
      expect(l.text, id).toBe(LINES[id]!.say);
      expect(l.text.length, id).toBeGreaterThan(3);
      expect(l.text, id).not.toMatch(/\d|[<>×÷+−$%()′]/);
    }
  });
  it('the page uses only scripted ids', () => {
    const src = fs.readFileSync('pages/lessons/coordinate-transformations.ts', 'utf8');
    const used = [...src.matchAll(/(?:para|fb|sayOnly)\(\s*(?:[a-z!?.\s]*,\s*)?'([a-z]\.[a-z0-9-]+)'/g)].map(m => m[1]!);
    for (const id of used) expect(LINES[id], id).toBeTruthy();
  });
});

describe('quality-layer fixes (practice sweep, 2026-10-23)', () => {
  const gen = (f: FamilyId, sg: string, s: number) => GENS[f]!(rng(s * 41 + 9), s, sg) as CTItem;
  it('"Does the rule move P?": exactly one choice names the right point (no x + d, y + d rule, where swapped coordinates land on it too)', () => {
    for (let s = 1; s <= 600; s++) {
      const it = gen('rigidOrNot', 'non-rigid-non-examples', s);
      const right = it.choices!.filter((_, i) => it.check({ kind: 'choice', i }).ok);
      expect(right.length).toBe(1);
      const pts = it.choices!.map(c => c.replace(/<[^>]+>/g, '').match(/P′ = (\([^)]*\))/)?.[1]).filter(Boolean);
      expect(new Set(pts).size, it.choices!.join(' | ')).toBe(pts.length);
    }
  });
  it('the steps card: at most 5 steps, a point answer ends on the marked point, a length on its value', async () => {
    const { explain } = await import('../src/lesson/topics/coordinate-transformations/explain');
    for (const [f, sg] of [['straightImage', 'verify-straightness'], ['moveOne', 'translation-coordinate-effect'], ['sideLength', 'verify-segment-length'], ['angleImage', 'verify-angle-measure'], ['reflectLine', 'reflect-non-axis-line']] as const) {
      for (let s = 1; s <= 150; s++) {
        const it = gen(f, sg, s), ex = explain(it);
        expect(ex, `${f}: ${it.prompt}`).not.toBeNull();
        expect(ex!.steps.length, f).toBeLessThanOrEqual(5);
        expect(it.check(ex!.result).ok, `${f}: ${it.prompt}`).toBe(true);
      }
    }
  });
});
