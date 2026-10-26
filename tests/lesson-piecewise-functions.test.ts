// lesson-piecewise-functions: the generic checks (every family x every sub-goal it serves x 300 seeds). Add topic checks below.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { rng } from '../src/lesson/runtime/item';
import { GENERATORS } from '../src/lesson/topics/piecewise-functions/items';
import { PLAN } from '../src/lesson/topics/piecewise-functions/plan';

const TOPIC = { subgoals: [...new Map(["secondary-t7-12-piecewise-and-step-functions"].flatMap(i => JSON.parse(fs.readFileSync(`../math-curriculum-essentials/topics/${i}.json`, 'utf8')).subgoals).map((s: { id: string }) => [s.id, s] as const)).values()] };
const CATALOG = new Set<string>(JSON.parse(fs.readFileSync('../math-curriculum-essentials/misconceptions.json', 'utf8')).misconceptions.map((m: { id: string }) => m.id));
const GEN = GENERATORS as Record<string, (R: () => number, n: number, sg?: string) => import('../src/lesson/runtime/item').Item>;

describe('piecewise-functions: plan', () => {
  it('walks through every sub-goal of the topic JSON, in order, each with a family', () => {
    expect(PLAN.map(p => p.id)).toEqual(TOPIC.subgoals.map((s: { id: string }) => s.id));
    for (const p of PLAN) { expect(p.families.length, p.id).toBeGreaterThan(0); for (const f of p.families) expect(GEN[f], f).toBeDefined(); }
  });
});

describe('piecewise-functions: families', () => {
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
        seen.add(item.prompt + '|' + item.board + '|' + JSON.stringify(item.picture ?? {}));   // graph items differ in their picture
      }
      expect(seen.size, 'distinct items').toBeGreaterThan(12);
    });
  }
});

// ---------- topic checks ----------
import { beforeAll } from 'vitest';
import { MC } from '../src/lesson/topics/piecewise-functions/items';
import { type Piece, casesTex, cst, fAt, lin, owners } from '../src/lesson/topics/piecewise-functions/pw';
import { pieceParts } from '../src/lesson/topics/piecewise-functions/pic';

describe('piecewise-functions: the maths', () => {
  const ps: Piece[] = [{ fn: lin(1, 2), hi: 3, hiIn: true }, { fn: lin(2, -4), lo: 3, loIn: false }];
  it('picks the piece by its condition, breakpoints by ≤ / ≥', () => {
    expect(fAt(ps, 1)).toBe(3); expect(fAt(ps, 3)).toBe(5); expect(fAt(ps, 4)).toBe(4);
    expect(owners(ps, 3)).toEqual([0]);
    const gap: Piece[] = [{ fn: cst(1), hi: 2 }, { fn: cst(4), lo: 2 }];
    expect(fAt(gap, 2)).toBeUndefined();
    const clash: Piece[] = [{ fn: cst(1), hi: 2, hiIn: true }, { fn: cst(4), lo: 2, loIn: true }];
    expect(fAt(clash, 2)).toBeUndefined();
    const agree: Piece[] = [{ fn: lin(1, 0), hi: 2, hiIn: true }, { fn: cst(2), lo: 2, loIn: true }];
    expect(fAt(agree, 2)).toBe(2);
  });
  it('draws a filled dot only where the condition includes the end, one dot at a continuous join', () => {
    const parts = pieceParts(ps);
    expect(parts.map(p => (p.kind === 'piece' ? p.ends : null))).toEqual([['none', 'closed'], ['open', 'none']]);
    const join: Piece[] = [{ fn: lin(1, 0), hi: 2, hiIn: true }, { fn: cst(2), lo: 2, loIn: false }];
    expect(pieceParts(join).map(p => (p.kind === 'piece' ? p.ends : null))).toEqual([['none', 'closed'], ['none', 'none']]);
  });
  it('writes cases notation', () => {
    expect(casesTex('f', ps)).toBe(String.raw`f(x) = \begin{cases} x + 2, & x \le 3 \\ 2x - 4, & x > 3 \end{cases}`);
  });
});

describe('piecewise-functions: misconceptions are classified', () => {
  const probe = (fam: string, sg: string, pred: (it: import('../src/lesson/runtime/item').Item) => [import('../src/lesson/runtime/item').Response, string] | null) => {
    let hits = 0;
    for (let s = 1; s <= 200; s++) {
      const it = GEN[fam]!(rng(s * 13 + 1), s, sg);
      const p = pred(it);
      if (!p) continue;
      expect(it.check(p[0]).mc, `${fam} ${it.prompt}`).toBe(p[1]); hits++;
    }
    expect(hits, fam).toBeGreaterThan(0);
  };
  const choiceWith = (it: import('../src/lesson/runtime/item').Item, re: RegExp) => { const i = (it.choices ?? []).findIndex(c => re.test(c)); return i < 0 ? null : i; };
  it('breakpoint: second listed, both, neither', () => {
    probe('ownerAtBreak', 'boundary-ownership', it => { const i = choiceWith(it, /^Neither/); return i === null ? null : [{ kind: 'choice', i }, MC.undefBreak]; });
    probe('ownerAtBreak', 'boundary-ownership', it => { const i = choiceWith(it, /^Both rules/); return i === null ? null : [{ kind: 'choice', i }, MC.several]; });
  });
  it('tiers: rate on the whole amount, first units counted again', () => {
    probe('tierRule', 'context-model', it => { const i = choiceWith(it, /^\$[\d.]+<i>/); return i === null ? null : [{ kind: 'choice', i }, MC.tierWhole]; });
  });
  it('floor as truncation', () => {
    probe('floorEval', 'greatest-integer-extension', it => {
      const m = it.board.match(/(-\d+\.\d+)/); if (!m) return null;
      const x = Number(m[1]); const c = Number(it.board.match(/[+-] (\d)$/)?.[0].replace(' ', '') ?? 0);
      return [{ kind: 'num', v: Math.trunc(x) + c }, MC.trunc];
    });
  });
});

describe('piecewise-functions: every picture fits the kit Plane', () => {
  let planeOf: typeof import('../src/lesson/topics/piecewise-functions/graph').planeOf;
  let fr: (x: number, y: number, w: number, h: number) => import('../src/blocks/block').Frame, dusk: import('../src/core/theme').Theme;
  beforeAll(async () => {
    (globalThis as unknown as { document: unknown }).document = { createElement: () => ({ getContext: () => null }) };
    ({ planeOf } = await import('../src/lesson/topics/piecewise-functions/graph'));
    fr = (await import('../src/blocks/block')).frame;
    dusk = (await import('../src/lesson/dusk')).dusk;
  });
  for (const p of PLAN) for (const f of p.families) {
    it(`${p.id} / ${f}`, () => {
      for (let s = 1; s <= 120; s++) {
        const item = GEN[f]!(rng(s * 31 + 7), s, p.id);
        const pic = item.picture as import('../src/lesson/topics/piecewise-functions/pic').Pic | undefined;
        if (pic?.g) expect(() => planeOf(pic.g!, fr(60, 70, 940, 940), dusk), `${f} ${s} ${item.prompt}`).not.toThrow();
        for (const g of pic?.opts ?? []) expect(() => planeOf(g, fr(0, 0, 580, 640), dusk), `${f} ${s} opt`).not.toThrow();
      }
    });
  }
});

describe('piecewise-functions: voice', () => {
  it('lines.json speaks every panel line of parts 1-4, without digits or symbols', async () => {
    const { SCRIPT } = await import('../src/lesson/topics/piecewise-functions/script');
    const lines = JSON.parse(fs.readFileSync('pages/lessons/piecewise-functions/voice/lines.json', 'utf8')) as Record<string, { text: string }>;
    expect(Object.keys(lines).sort()).toEqual(Object.keys(SCRIPT).sort());
    for (const [k, v] of Object.entries(SCRIPT)) { expect(lines[k]!.text, k).toBe(v.say); expect(v.say, k).not.toMatch(/[0-9<>≤≥=−+×÷$]/); }
  });
  it('the page only says ids the script has', async () => {
    const page = fs.readFileSync('pages/lessons/piecewise-functions.ts', 'utf8');
    const ids = [...page.matchAll(/voiced(?:Fb)?\('([\w.]+)'/g)].map(m => m[1]!);
    const { SCRIPT } = await import('../src/lesson/topics/piecewise-functions/script');
    for (const id of ids) expect(SCRIPT[id], id).toBeDefined();
  });
});
