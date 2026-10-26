// lesson-linear-inequalities-2d: the generic checks (every family x every sub-goal it serves x 300 seeds). Add topic checks below.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { rng } from '../src/lesson/runtime/item';
import { GENERATORS } from '../src/lesson/topics/linear-inequalities-2d/items';
import { PLAN } from '../src/lesson/topics/linear-inequalities-2d/plan';

const TOPIC = { subgoals: [...new Map(["secondary-t6-33-graphing-linear-inequalities-two-variables"].flatMap(i => JSON.parse(fs.readFileSync(`../math-curriculum-essentials/topics/${i}.json`, 'utf8')).subgoals).map((s: { id: string }) => [s.id, s] as const)).values()] };
const CATALOG = new Set<string>(JSON.parse(fs.readFileSync('../math-curriculum-essentials/misconceptions.json', 'utf8')).misconceptions.map((m: { id: string }) => m.id));
const GEN = GENERATORS as Record<string, (R: () => number, n: number, sg?: string) => import('../src/lesson/runtime/item').Item>;

describe('linear-inequalities-2d: plan', () => {
  it('walks through every sub-goal of the topic JSON, in order, each with a family', () => {
    expect(PLAN.map(p => p.id)).toEqual(TOPIC.subgoals.map((s: { id: string }) => s.id));
    for (const p of PLAN) { expect(p.families.length, p.id).toBeGreaterThan(0); for (const f of p.families) expect(GEN[f], f).toBeDefined(); }
  });
});

describe('linear-inequalities-2d: families', () => {
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

// ---------------------------------------------------------------------------------------------------------------------
// topic checks: the maths, the pictures (they fit the kit's Plane), the diagnosis, the texts, the voice
// ---------------------------------------------------------------------------------------------------------------------
import { holds, onLine, rel, side, type Form, q } from '../src/lesson/topics/linear-inequalities-2d/ineq';
import { shadeGeom } from '../src/lesson/topics/linear-inequalities-2d/ineqPic';
import { FAMILIES, MC, type IItem } from '../src/lesson/topics/linear-inequalities-2d/items';

const items = (per: number) => PLAN.flatMap(p => p.families.flatMap(f => Array.from({ length: per }, (_, s) => GEN[f]!(rng(s * 97 + 3), s, p.id) as IItem)));

describe('linear-inequalities-2d: maths', () => {
  it('membership, equality case and sides', () => {
    const F: Form = { f: 'si', m: q(2), b: q(1), op: '>' };
    expect(holds(F, 0, 3)).toBe(true); expect(holds(F, 1, 3)).toBe(false); expect(onLine(F, 1, 3)).toBe(true);
    expect(holds({ ...F, op: '>=' }, 1, 3)).toBe(true);
    expect(side(F)).toBe('above');
    const G: Form = { f: 'std', A: -2, B: -3, C: 6, op: '>' };      // −2x − 3y > 6 shades below
    expect(side(G)).toBe('below'); expect(holds(G, 0, 0)).toBe(false); expect(holds(G, 0, -3)).toBe(true);
    expect(side({ f: 'x', c: 3, op: '>' })).toBe('right'); expect(side({ f: 'std', A: -2, B: 0, C: 6, op: '>=' })).toBe('left');
    const ps: Form = { f: 'ps', m: q(2), x1: 3, y1: 1, op: '>' };   // y − 1 > 2(x − 3)  ⇔  y > 2x − 5
    expect(rel(ps)).toMatchObject({ A: -2, B: 1, C: -5 });
  });
  it('a shade of two half-planes is their overlap; an empty system shades nothing', () => {
    const G = shadeGeom([{ A: 0, B: 1, C: 1, s: 1 }, { A: 0, B: 1, C: 3, s: -1 }], -6, 6)!;   // 1 ≤ y ≤ 3
    expect(G.low(0)).toBe(1); expect(G.up(0)).toBe(3);
    const E = shadeGeom([{ A: 0, B: 1, C: 3, s: 1 }, { A: 0, B: 1, C: 1, s: -1 }], -6, 6)!;   // y ≥ 3, y ≤ 1
    expect(E.up(0) - E.low(0)).toBe(0);
    expect(shadeGeom([{ A: 1, B: 0, C: 4, s: 1 }, { A: 1, B: 0, C: 2, s: -1 }], -6, 6)).toBeNull();
  });
});

describe('linear-inequalities-2d: items', () => {
  it('every family is in the plan, about 45 of them', () => {
    const used = new Set(PLAN.flatMap(p => p.families));
    for (const f of FAMILIES) expect(used.has(f.id), f.id).toBe(true);
    expect(used.size).toBeGreaterThanOrEqual(40);
  });
  it('the same seed gives the same item', () => {
    for (const p of PLAN) for (const f of p.families) {
      const a = GEN[f]!(rng(11), 1, p.id), b = GEN[f]!(rng(11), 1, p.id);
      expect(a.prompt + a.board + JSON.stringify(a.choices), f).toBe(b.prompt + b.board + JSON.stringify(b.choices));
    }
  });
  it('the main misconceptions are diagnosed, and every id is in the catalogue', () => {
    const seen = new Set<string>();
    for (const it of items(30)) {
      (it.choices ?? []).forEach((_, i) => { const m = it.check({ kind: 'choice', i }).mc; if (m) seen.add(m); });
      for (const s of it.slips ?? []) { const m = it.check(s).mc; if (m) seen.add(m); }
    }
    for (const m of seen) expect(CATALOG.has(m), m).toBe(true);
    const missing = Object.values(MC).filter(m => !seen.has(m));
    expect(missing, `not diagnosed: ${missing.join(', ')}`).toEqual([]);
  });
  it('texts are clean (no undefined, NaN, "+ −3", double spaces, raw angle brackets)', () => {
    const BAD = /\(undefined|undefined[,)]|NaN|\[object|Infinity|\+\s*[-−]\s*\d|\s{2,}\S|−\s*−|−0(?![.\d])/;
    const clean = (h: string) => h.replace(/<[^>]+>/g, '');
    for (const it of items(25)) for (const t of [it.prompt, ...(it.choices ?? []), ...it.solution]) {
      expect(clean(t), `${it.family}: ${t}`).not.toMatch(BAD);
      expect(t.replace(/<\/?(i|b|span|sup|sub)( class="[^"]*")?>/g, ''), `${it.family}: raw < or > in ${t}`).not.toMatch(/[<>]/);
    }
  });
  it('a picture never shows an empty grid: something is drawn with the question, or it starts as a slate', () => {
    for (const it of items(20)) {
      const g = it.picture?.g;
      if (!g) continue;
      const keys = new Set(g.items.map(i => i.key));
      for (const k of [...g.show, ...g.solve]) expect(keys.has(k), `${it.family}: step ${k}`).toBe(true);
      expect(g.show.length + g.solve.length, it.family).toBeGreaterThan(0);
    }
  });
  it('every picture fits the kit Plane (no BlockError)', async () => {
    // Plane measures label widths with a canvas; without a DOM it estimates them
    (globalThis as unknown as { document: unknown }).document ??= { createElement: () => ({ getContext: () => null }) };
    const { planeOf } = await import('../src/lesson/topics/linear-inequalities-2d/ineqPic');
    const { frame } = await import('../src/blocks/block');
    const { dusk } = await import('../src/lesson/dusk');
    const MF = frame(60, 70, 940, 940);
    const bad: string[] = [];
    for (const it of items(40)) {
      const g = it.picture?.g;
      if (!g) continue;
      try { planeOf(g, MF, dusk); } catch (e) { bad.push(`${it.family}: ${(e as Error).message}`); }
    }
    expect([...new Set(bad)].slice(0, 12), `${bad.length} pictures do not fit`).toEqual([]);
  });
});

import { LINES } from '../src/lesson/topics/linear-inequalities-2d/script';
import { PLACEMENT } from '../src/lesson/topics/linear-inequalities-2d/placement';
import { explain } from '../src/lesson/topics/linear-inequalities-2d/explain';
describe('linear-inequalities-2d: voice, check-in, worked steps', () => {
  it('lines.json matches script.ts, and spoken text has no digits or symbols', () => {
    const lines = JSON.parse(fs.readFileSync('pages/lessons/linear-inequalities-2d/voice/lines.json', 'utf8')) as Record<string, { text: string }>;
    expect(Object.keys(lines).sort()).toEqual(Object.keys(LINES).sort());
    for (const [k, v] of Object.entries(LINES)) {
      expect(lines[k]!.text, k).toBe(v.say);
      expect(v.say, k).not.toMatch(/[0-9=+÷×−<>/√%$≤≥]/);
    }
  });
  it('the check-in picks exist in the plan', () => {
    for (const p of PLACEMENT.picks) expect(PLAN.find(s => s.id === p.subgoal)?.families, p.family).toContain(p.family);
  });
  it('the worked steps arrive at the answer, in 2-5 steps', () => {
    for (const it of items(15)) {
      const ex = explain(it);
      expect(ex, `${it.family}: no result`).not.toBeNull();
      expect(ex!.steps.length, it.family).toBeGreaterThanOrEqual(2);
      expect(ex!.steps.length, it.family).toBeLessThanOrEqual(5);
      expect(it.check(ex!.result).ok, `${it.family}: ${ex!.steps.join(' | ')}`).toBe(true);
    }
  });
});

import { lineKey, relKey } from '../src/lesson/topics/linear-inequalities-2d/items';
describe('linear-inequalities-2d: equivalent distractors are dropped (oracle sweep 2026-10-26)', () => {
  it('the keys see through rewriting', () => {
    // x = −y + 3 is y = −x + 3; y + 20 ≥ 4(x + 5) is y − 20 ≥ 4(x − 5) (both y ≥ 4x); −2x − 3y > 6 is 2x + 3y < −6
    expect(lineKey(1, 1, 3)).toBe(lineKey(-1, -1, -3));
    expect(relKey({ f: 'ps', m: q(4), x1: -5, y1: -20, op: '>=' })).toBe(relKey({ f: 'ps', m: q(4), x1: 5, y1: 20, op: '>=' }));
    expect(relKey({ f: 'std', A: -2, B: -3, C: 6, op: '>' })).toBe(relKey({ f: 'std', A: 2, B: 3, C: -6, op: '<' }));
    expect(relKey({ f: 'std', A: 2, B: 3, C: 6, op: '>' })).not.toBe(relKey({ f: 'std', A: 2, B: 3, C: 6, op: '>=' }));
  });
  it('every choice item still has at least one wrong option', () => {
    for (const it of items(40)) if (it.choices) expect(it.choices.length, it.family).toBeGreaterThanOrEqual(2);
  });
});
