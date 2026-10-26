// lesson-absolute-value: the generic checks (every family x every sub-goal it serves x 300 seeds). Add topic checks below.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { rng } from '../src/lesson/runtime/item';
import { GENERATORS } from '../src/lesson/topics/absolute-value/items';
import { PLAN } from '../src/lesson/topics/absolute-value/plan';

const TOPIC = { subgoals: [...new Map(["secondary-t7-13-absolute-value-functions-and-equations"].flatMap(i => JSON.parse(fs.readFileSync(`../math-curriculum-essentials/topics/${i}.json`, 'utf8')).subgoals).map((s: { id: string }) => [s.id, s] as const)).values()] };
const CATALOG = new Set<string>(JSON.parse(fs.readFileSync('../math-curriculum-essentials/misconceptions.json', 'utf8')).misconceptions.map((m: { id: string }) => m.id));
const GEN = GENERATORS as Record<string, (R: () => number, n: number, sg?: string) => import('../src/lesson/runtime/item').Item>;

describe('absolute-value: plan', () => {
  it('walks through every sub-goal of the topic JSON, in order, each with a family', () => {
    expect(PLAN.map(p => p.id)).toEqual(TOPIC.subgoals.map((s: { id: string }) => s.id));
    for (const p of PLAN) { expect(p.families.length, p.id).toBeGreaterThan(0); for (const f of p.families) expect(GEN[f], f).toBeDefined(); }
  });
});

describe('absolute-value: families', () => {
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
        seen.add(item.prompt + '|' + item.board + '|' + (item.choices ?? []).join('/') + '|' + JSON.stringify(item.picture ?? {}));   // graph / statement items differ in their picture or choices
      }
      expect(seen.size, 'distinct items').toBeGreaterThan(12);
    });
  }
});

// ---------- topic checks ----------
import { beforeAll } from 'vitest';
import { MC, type AVItem } from '../src/lesson/topics/absolute-value/items';
import { absAt, absIneq, solveEq, vertexOf, slopesOf, setT, absT, inT } from '../src/lesson/topics/absolute-value/av';
import { lineFits } from '../src/lesson/topics/absolute-value/line';

describe('absolute-value: the maths', () => {
  it('vertex, slopes, values of a|mx + b| + k', () => {
    const f = { a: -2, m: 2, b: -4, k: 3 };
    expect(vertexOf(f)).toEqual([2, 3]); expect(slopesOf(f)).toEqual([4, -4]); expect(absAt(f, 0)).toBe(-5);
    expect(absT(-1, 2, -4, 3)).toBe('-|2x - 4| + 3'); expect(inT(-1, 3)).toBe('3 - x');
  });
  it('solves |u| = c with two, one or no solutions', () => {
    expect(solveEq({ a: 1, m: 1, b: -4, k: 0 }, 3)).toEqual([1, 7]);
    expect(solveEq({ a: 2, m: 1, b: 1, k: -4 }, 6)).toEqual([-6, 4]);
    expect(solveEq({ a: 1, m: 1, b: -4, k: 0 }, 0)).toEqual([4]);
    expect(solveEq({ a: 1, m: 2, b: -3, k: 0 }, -5)).toEqual([]);
  });
  it('|u| < c is a band, |u| > c two rays, special targets', () => {
    expect(setT(absIneq(1, -3, '<', 5))).toBe('-2 < x < 8');
    expect(setT(absIneq(2, 1, '>=', 5))).toBe(String.raw`x \le -3 \text{ or } x \ge 2`);
    expect(setT(absIneq(-1, 3, '<=', 1))).toBe(String.raw`2 \le x \le 4`);
    expect(setT(absIneq(1, -2, '<', -3))).toBe(String.raw`\text{no solution}`);
    expect(setT(absIneq(1, -2, '>', -3))).toBe(String.raw`\text{all real numbers}`);
    expect(setT(absIneq(1, -2, '<=', 0))).toBe(String.raw`x = 2`);
    expect(setT(absIneq(1, -2, '>', 0))).toBe(String.raw`x < 2 \text{ or } x > 2`);
  });
});

describe('absolute-value: misconceptions are classified', () => {
  const probe = (fam: string, sg: string, pred: (it: AVItem) => [import('../src/lesson/runtime/item').Response, string] | null) => {
    let hits = 0;
    for (let s = 1; s <= 300; s++) {
      const it = GEN[fam]!(rng(s * 13 + 1), s, sg) as AVItem;
      const p = pred(it);
      if (!p) continue;
      expect(it.check(p[0]).mc, `${fam} ${it.prompt} ${JSON.stringify(p[0])}`).toBe(p[1]); hits++;
    }
    expect(hits, fam).toBeGreaterThan(0);
  };
  const choiceWith = (it: AVItem, re: RegExp) => { const i = (it.choices ?? []).findIndex(c => re.test(c)); return i < 0 ? null : i; };
  it('± ignoring the inside, wrong sign of the zero', () => {
    probe('splitSolve', 'solve-abs-eq-positive', it => { const c = Number(it.board.split('= ')[1]); const a = it.answer as { x: number; y: number }; return Math.abs(a.x + c) < 1e-9 && Math.abs(a.y - c) < 1e-9 ? null : [{ kind: 'pair', x: -c, y: c }, MC.ignoreIn]; });
    probe('hShiftVertex', 'graph-horizontal-shift', it => [{ kind: 'num', v: -(it.answer as { v: number }).v }, MC.signZero]);
  });
  it('counting: repeated root, negative target', () => {
    probe('howManySol', 'solution-count-by-sign', it => /= 0$/.test(it.board) ? [{ kind: 'num', v: 2 }, MC.twice] : null);
    probe('howManySol', 'solution-count-by-sign', it => /= -\d+$/.test(it.board) ? [{ kind: 'num', v: 2 }, MC.negBranches] : null);
  });
  it('and / or, three-part chain, special targets', () => {
    probe('andPick', 'abs-ineq-less-and', it => { const i = choiceWith(it, / or /); return i === null ? null : [{ kind: 'choice', i }, MC.andOr]; });
    probe('orPick', 'abs-ineq-greater-or', it => { const i = choiceWith(it, /&gt; <i>x<\/i> &gt;|≥ <i>x<\/i> ≥/); return i === null ? null : [{ kind: 'choice', i }, MC.chain]; });
    probe('specialSet', 'abs-ineq-special-targets', it => /\ge -|> -/.test(it.board) ? [{ kind: 'choice', i: choiceWith(it, /^No solution$/)! }, MC.alwaysNone] : null);
  });
  it('stretch before shift, case condition', () => {
    probe('stretchPoint', 'graph-vertical-stretch', it => {
      const m = it.board.match(/^y = (\d*\.?\d*)\|x(?: ([+-]) (\d+))?\| ([+-]) (\d+),\\quad x = (-?\d+)/); if (!m) return null;
      const a = Number(m[1] || 1), h = m[2] ? (m[2] === '-' ? 1 : -1) * Number(m[3]) : 0, k = (m[4] === '-' ? -1 : 1) * Number(m[5]), x = Number(m[6]);
      return [{ kind: 'num', v: a * (Math.abs(x - h) + k) }, MC.shiftScale];
    });
    probe('keepReject', 'filter-candidates-by-condition', it => { const i = choiceWith(it, /algebra was right/); return i === null ? null : [{ kind: 'choice', i }, MC.condIgnored]; });
  });
});

describe('absolute-value: every picture fits', () => {
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
        const item = GEN[f]!(rng(s * 31 + 7), s, p.id) as AVItem;
        const pic = item.picture;
        if (pic?.g) expect(() => planeOf(pic.g!, fr(60, 70, 940, 940), dusk), `${f} ${s} ${item.prompt}`).not.toThrow();
        for (const g of pic?.opts ?? []) expect(() => planeOf(g, fr(0, 0, 580, 640), dusk), `${f} ${s} opt`).not.toThrow();
        if (pic?.line) expect(lineFits(pic.line), `${f} ${s} line`).toBe(true);
      }
    });
  }
});

describe('absolute-value: voice', () => {
  it('lines.json speaks every panel line of parts 1-4, without digits or symbols', async () => {
    const { SCRIPT } = await import('../src/lesson/topics/absolute-value/script');
    const lines = JSON.parse(fs.readFileSync('pages/lessons/absolute-value/voice/lines.json', 'utf8')) as Record<string, { text: string }>;
    expect(Object.keys(lines).sort()).toEqual(Object.keys(SCRIPT).sort());
    for (const [k, v] of Object.entries(SCRIPT)) { expect(lines[k]!.text, k).toBe(v.say); expect(v.say, k).not.toMatch(/[0-9<>≤≥=−+×÷$|]/); }
  });
  it('the page only says ids the script has', async () => {
    const { SCRIPT } = await import('../src/lesson/topics/absolute-value/script');
    const page = fs.readFileSync('pages/lessons/absolute-value.ts', 'utf8');
    const ids = [...page.matchAll(/voiced(?:Fb)?\('([\w.]+)'/g)].map(m => m[1]!);
    for (const id of ids) expect(SCRIPT[id], id).toBeDefined();
  });
});
