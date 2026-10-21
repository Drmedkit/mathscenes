// linear equations: every family x every sub-goal it serves x 300 seeds gives a valid item (the answer passes,
// choices unique with exactly one right, misconception ids exist in the catalogue, boards typeset), the main
// misconceptions are classified, the plan covers every sub-goal of the topic JSON in order, the exact solver is right,
// the two-pan balance model's maths (the same move on both pans keeps the difference; level exactly at the solution)
// and layout hold, and the scripted panel lines match the spoken texts.
import { beforeAll, describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { rng, type Item } from '../src/lesson/runtime/item';
import { rat } from '../src/core/math';
import { FAMILIES, FAMILY_NAMES, GENERATORS, MC, MC_EXTRA, readQ, type LEItem } from '../src/lesson/topics/linear-equations/items';
import { PLAN } from '../src/lesson/topics/linear-equations/plan';
import { classifySolve, eqFor, eqOf, workLines } from '../src/lesson/topics/linear-equations/solving';
import { G, N, X, eqHtml, eqTex, holds, q, solve, sideLin, valueAt } from '../src/lesson/topics/linear-equations/lin';
import { BAG_H, BAG_W, MR, SIDES_FRAME, computeSides, panTotals, sidesFit, sidesLayout, tiltAt } from '../src/lesson/topics/linear-equations/sidesMaths';
import { SCRIPT } from '../src/lesson/topics/linear-equations/script';
import { tex, texReady } from '../src/core/tex';

const ROOT = 'C:/Users/stelt/Claude code foler/math-curriculum-essentials';
const TOPIC = `${ROOT}/topics/secondary-t5-30-solving-linear-equations.json`;
const MCF = `${ROOT}/misconceptions.json`;
const mcIds = existsSync(MCF) ? new Set((JSON.parse(readFileSync(MCF, 'utf8')) as { misconceptions: { id: string }[] }).misconceptions.map(m => m.id)) : null;
const pairs = PLAN.flatMap(p => p.families.map(f => [f, p.id] as const));
const make = (f: string, sg: string, s: number): LEItem => GENERATORS[f as keyof typeof GENERATORS](rng(s * 7919 + f.length * 31 + sg.length), s, sg);

beforeAll(async () => { await texReady(); });

describe('plan', () => {
  it('covers every sub-goal of the topic JSON, in order, each with families that exist; every family is used', () => {
    if (existsSync(TOPIC)) {
      const t = JSON.parse(readFileSync(TOPIC, 'utf8')) as { subgoals: { id: string; order: number; stage: number }[] };
      expect(PLAN.map(p => p.id)).toEqual([...t.subgoals].sort((a, b) => a.stage - b.stage || a.order - b.order).map(s => s.id));
    }
    for (const p of PLAN) {
      expect(p.families.length).toBeGreaterThan(0);
      for (const f of p.families) { expect(GENERATORS[f as keyof typeof GENERATORS], f).toBeTypeOf('function'); expect(FAMILY_NAMES[f], f).toBeTruthy(); }
    }
    expect(new Set(PLAN.flatMap(p => p.families))).toEqual(new Set(FAMILIES.map(f => f.id)));
  });
  it('every misconception id the families use is in the catalogue, and every id the topic names is used', () => {
    if (!mcIds) return;
    for (const id of [...Object.values(MC), ...Object.values(MC_EXTRA)]) expect(mcIds.has(id), id).toBe(true);
    if (existsSync(TOPIC)) {
      const t = JSON.parse(readFileSync(TOPIC, 'utf8')) as { subgoals: { misconceptions: string[] }[] };
      const ours = new Set<string>([...Object.values(MC), ...Object.values(MC_EXTRA)]);
      for (const s of t.subgoals) for (const id of s.misconceptions) expect(ours.has(id), id).toBe(true);
    }
  });
});

describe('item families', () => {
  const seenMc = new Set<string>();
  for (const [f, sg] of pairs) {
    it(`${f} for ${sg}: 300 seeds, the answer passes, choices unique with one right, boards typeset`, () => {
      const seen = new Set<string>();
      for (let s = 1; s <= 300; s++) {
        const it: Item = make(f, sg, s);
        expect(it.family).toBe(f);
        expect(it.check(it.answer).ok, `${it.prompt} ${JSON.stringify(it.answer)}`).toBe(true);
        expect(it.solution.length).toBeGreaterThan(0);
        const text = [it.prompt, it.board, ...(it.choices ?? []), ...it.solution].join(' ');
        expect(text, text).not.toMatch(/undefined|NaN|Infinity|\+ -|- -|\+ −|− −|\[object/);
        if (it.choices) {
          expect(it.choices.length, it.prompt).toBeGreaterThanOrEqual(3);
          expect(new Set(it.choices).size, it.choices.join(' | ')).toBe(it.choices.length);
          const verdicts = it.choices.map((_, i) => it.check({ kind: 'choice', i }));
          expect(verdicts.filter(v => v.ok).length, `${it.prompt} :: ${it.choices.join(' | ')}`).toBe(1);
          for (const v of verdicts) { if (v.mc) { seenMc.add(v.mc); if (mcIds) expect(mcIds.has(v.mc), v.mc).toBe(true); } expect(v.say.length).toBeGreaterThan(5); }
        }
        if (it.input === 'num' && it.answer.kind === 'num' && !/^construct/.test(it.id)) {
          expect(String(it.answer.v).length, it.prompt).toBeLessThanOrEqual(6);
          expect(it.check({ kind: 'num', v: it.answer.v + 1000 }).ok).toBe(false);
        }
        const F = tex(it.board);
        expect(F.missing, it.board).toEqual([]);
        for (const L of (it as LEItem).picture?.lines ?? []) expect(tex(L).missing, L).toEqual([]);
        const pic = (it as LEItem).picture?.balance;
        if (pic) { expect(sidesFit(pic.a, pic.b, pic.c, pic.d, pic.loose), JSON.stringify(pic)).toBe(true); if (pic.tex) expect(tex(pic.tex).missing, pic.tex).toEqual([]); }
        seen.add(it.prompt + it.board + (it.choices ?? []).join());
      }
      expect(seen.size, `${f}/${sg}`).toBeGreaterThan(40);
    });
  }
});

describe('the exact solver', () => {
  it('one, none, every number', () => {
    expect(solve(eqOf([X(5), N(3)], [X(1), N(15)]))).toEqual({ kind: 'one', x: rat(3) });
    expect(solve(eqOf([X(2), N(5)], [X(2), N(9)])).kind).toBe('none');
    expect(solve(eqOf([G(2, X(1), N(1))], [X(2), N(2)])).kind).toBe('all');
    const f = eqOf([X(q(1, 2)), N(3)], [X(q(1, 3)), N(5)]);
    expect(solve(f)).toEqual({ kind: 'one', x: rat(12) });
    const g = eqOf([N(7), G(-2, N(3), X(-8))], [X(5), N(1)]);   // 7 - 2(3 - 8x) = 5x + 1
    expect(solve(g)).toEqual({ kind: 'one', x: rat(0) });
    const h = eqOf([G(5, X(1), N(1)), G(-3, X(1), N(-2))], [G(4, X(1), N(1)), N(-1)]);   // 5(x+1) - 3(x-2) = 4(x+1) - 1
    expect(solve(h)).toEqual({ kind: 'one', x: rat(4) });
    expect(holds(h, rat(4))).toBe(true);
    expect(eqHtml(g)).toBe('7 − 2(3 − 8<i>x</i>) = 5<i>x</i> + 1');
    expect(eqTex(f)).toBe('\\tfrac{1}{2}x + 3 = \\tfrac{1}{3}x + 5');
  });
  it('the worked solution ends with a check in the original', () => {
    const lines = workLines(eqOf([X(5), N(3)], [X(1), N(15)]));
    expect(lines.at(-1)).toMatch(/Check in the original/);
    expect(lines.join(' ')).toMatch(/Subtract <i>x<\/i> from both sides/);
    expect(workLines(eqOf([X(2), N(5)], [X(2), N(9)])).join(' ')).toMatch(/never true/);
  });
});

describe('the solve classifier', () => {
  it('moving a term without changing its sign, signs, intermediate results', () => {
    const e = eqOf([X(5), N(3)], [X(1), N(15)]);   // x = 3
    expect(classifySolve(e, rat(3)).ok).toBe(true);
    expect(classifySolve(e, rat(2)).mc).toBe(MC.noSign);           // 6x = 12
    expect(classifySolve(e, rat(12)).mc).toBe(MC.intermediate);    // 4x = 12
    const n = eqOf([X(2), N(5)], [X(5), N(-7)]);   // 2x + 5 = 5x - 7, x = 4
    expect(classifySolve(n, rat(-4)).mc).toBe(MC.signDrop);
    const m = eqOf([X(3), N(4)], [X(4), N(-1)]);   // -x = -5 -> x = 5
    expect(classifySolve(m, rat(-5)).mc).toBe(MC.negStop);
  });
  it('parentheses: partial distribution, a negative on the first term only, the outside number', () => {
    const p = eqOf([G(4, X(1), N(-3))], [X(2), N(6)]);   // 4(x - 3) = 2x + 6, x = 9
    expect(solve(p)).toEqual({ kind: 'one', x: rat(9) });
    expect(classifySolve(p, rat(9, 2)).mc).toBe(MC.partial);       // 4x - 3 = 2x + 6
    const k = eqOf([N(5), G(-2, X(1), N(-1))], [X(1), N(-2)]);   // 5 - 2(x - 1) = x - 2, x = 3
    expect(solve(k)).toEqual({ kind: 'one', x: rat(3) });
    expect(classifySolve(k, rat(5, 3)).mc).toBe(MC.negFirst);      // 5 - 2x - 2 = x - 2
    expect(classifySolve(k, rat(1, 2)).mc).toBe(MC.outside);       // 3(x - 1) = x - 2 -> 3x - 3 = x - 2 -> x = 1/2
  });
  it('fractions: scaling only some terms', () => {
    const f = eqOf([X(q(1, 2)), N(3)], [X(q(1, 3)), N(5)]);   // x = 12; ×6 on x-terms only: 3x + 3 = 2x + 5 -> x = 2
    expect(classifySolve(f, rat(2)).mc).toBe(MC.someTerms);
  });
  it('typed fractions and decimals are read exactly', () => {
    expect(readQ({ kind: 'frac', w: 0, n: -7, d: 3 })).toEqual(rat(-7, 3));
    expect(readQ({ kind: 'frac', w: -2, n: 1, d: 3 })).toEqual(rat(-7, 3));
    expect(readQ({ kind: 'num', v: 0.15 })).toEqual(rat(3, 20));
  });
  it('every solve sub-goal makes equations with the right features', () => {
    for (let s = 1; s <= 300; s++) {
      const neg = eqFor(rng(s), 's2-negative-coefficients'), l = sideLin(neg.L), r = sideLin(neg.R);
      expect(l.m.p < 0 || r.m.p < 0).toBe(true);
      expect([...eqFor(rng(s), 's2-expand-positive').L, ...eqFor(rng(s), 's2-expand-positive').R].some(p => 'f' in p)).toBe(true);
      expect([...eqFor(rng(s), 's2-negative-factor').L].some(p => 'f' in p && p.f.p < 0)).toBe(true);
      expect(eqTex(eqFor(rng(s), 's2-fraction-coefficients'))).toMatch(/tfrac/);
      expect(eqTex(eqFor(rng(s), 's2-decimal-coefficients'))).toMatch(/\d\.\d/);
      const c = eqFor(rng(s), 's2-collect-integer'), cl = sideLin(c.L), cr = sideLin(c.R);
      expect(cl.m.p > 0 && cr.m.p > 0 && cl.m.p <= 10 && cr.m.p <= 10).toBe(true);
    }
  });
});

describe('the two-pan balance', () => {
  it('5x + 3 = x + 15: one bag holds 3; a bag and 3 marbles off both pans, then 4 rows of 3', () => {
    const m = computeSides({ a: 5, b: 3, c: 1, d: 15 });
    expect(m.kind).toBe('one'); expect(m.x).toBe(3); expect(m.tx).toBe(1); expect(m.tn).toBe(3);
    expect(m.canSplit).toBe(true); expect(m.bagSide).toBe('L'); expect(m.p).toBe(4); expect(m.per).toBe(3);
    expect(panTotals(m, 3)).toEqual([18, 18]);
  });
  it('3x + 11 = 5x + 3 (your turn): the bags end on the right, 2 rows of 4', () => {
    const m = computeSides({ a: 3, b: 11, c: 5, d: 3 });
    expect(m.x).toBe(4); expect(m.bagSide).toBe('R'); expect(m.p).toBe(2); expect(m.per).toBe(4); expect(m.canSplit).toBe(true);
  });
  it('2x + 5 = 2x + 9 tips the same way whatever is in the bags; an identity never tips', () => {
    const m = computeSides({ a: 2, b: 5, c: 2, d: 9 });
    expect(m.kind).toBe('none');
    for (let v = 0; v <= 8; v++) expect(tiltAt(m, v)).toBe(-0.5);
    const a = computeSides({ a: 2, b: 2, c: 2, d: 2 });
    expect(a.kind).toBe('all');
    for (let v = 0; v <= 8; v++) expect(tiltAt(a, v)).toBe(0);
    const o = computeSides({ a: 5, b: 3, c: 1, d: 15 });
    for (let v = 0; v <= 8; v++) expect(tiltAt(o, v) === 0).toBe(v === 3);
  });
  it('the same move on both pans keeps the difference (so the beam keeps its tilt)', () => {
    for (let a = 0; a <= 5; a++) for (let c = 0; c <= 5; c++) for (const b of [0, 4, 11]) for (const d of [0, 6, 15]) {
      const m = { a, b, c, d }, t = Math.min(a, c), n = Math.min(b, d);
      for (let v = 0; v <= 8; v++) expect(panTotals({ a: a - t, b: b - n, c: c - t, d: d - n }, v)[0] - panTotals({ a: a - t, b: b - n, c: c - t, d: d - n }, v)[1]).toBe(panTotals(m, v)[0] - panTotals(m, v)[1]);
    }
  });
  it('refuses what it cannot draw', () => {
    expect(() => computeSides({ a: 6, b: 1, c: 1, d: 11 })).toThrow(/0 to 5/);
    expect(() => computeSides({ a: 3, b: 1, c: 1, d: 4 })).toThrow(/whole number/);
    expect(sidesFit(4, 0, 0, 40)).toBe(false);
  });
  it('every drawable equation stays inside the frame, and no two things on a pan overlap', () => {
    let n = 0;
    for (let a = 0; a <= 5; a++) for (let c = 0; c <= 5; c++) for (let b = 0; b <= 18; b++) for (let d = 0; d <= 18; d++) {
      if (!sidesFit(a, b, c, d)) continue;
      n++;
      const m = computeSides({ a, b, c, d }), L = sidesLayout(m, SIDES_FRAME);
      for (const P of [L.L, L.R]) for (const ph of ['A', 'B', 'C'] as const) {
        const bags = ph === 'A' ? P.bagA : ph === 'B' ? P.bagB : P.bagC, mars = ph === 'A' ? P.marA : ph === 'B' ? P.marB : P.marC;
        const B = [
          ...bags.filter((_, i) => ph === 'A' || !P.takenBags.includes(i)).map(b => ({ x0: b.x - BAG_W / 2, x1: b.x + BAG_W / 2, y0: b.y - BAG_H / 2, y1: b.y + BAG_H / 2 })),
          ...mars.filter((_, i) => ph !== 'C' || !P.takenMar.includes(i)).map(c => ({ x0: c.x - MR, x1: c.x + MR, y0: c.y - MR, y1: c.y + MR })),
        ];
        for (const b of B) { expect(b.x0).toBeGreaterThanOrEqual(SIDES_FRAME.x); expect(b.x1).toBeLessThanOrEqual(SIDES_FRAME.x + SIDES_FRAME.w); expect(b.y0).toBeGreaterThanOrEqual(SIDES_FRAME.y); expect(b.y1).toBeLessThanOrEqual(L.floor + 1); }
        for (let i = 0; i < B.length; i++) for (let j = i + 1; j < B.length; j++) {
          const p = B[i]!, r = B[j]!;
          expect(p.x0 < r.x1 - 0.5 && r.x0 < p.x1 - 0.5 && p.y0 < r.y1 - 0.5 && r.y0 < p.y1 - 0.5, `${a},${b},${c},${d} ${ph} ${i}/${j}`).toBe(false);
        }
      }
      expect(L.panL.x1).toBeLessThan(L.panR.x0);
    }
    expect(n).toBeGreaterThan(300);
  });
  it('the values on the strip are the solutions', () => {
    const e = eqOf([X(5), N(3)], [X(1), N(15)]);
    for (let v = 0; v <= 8; v++) expect(valueAt(e.L, q(v)).p === valueAt(e.R, q(v)).p).toBe(v === 3);
  });
});

describe('voice', () => {
  it('every scripted panel line has a spoken text and vice versa', () => {
    const lines = JSON.parse(readFileSync('pages/lessons/linear-equations/voice/lines.json', 'utf8')) as Record<string, { text: string }>;
    expect(Object.keys(lines).sort()).toEqual(Object.keys(SCRIPT).sort());
    for (const [id, l] of Object.entries(lines)) {
      expect(l.text, id).toBe(SCRIPT[id]!.say);
      expect(l.text.length, id).toBeGreaterThan(3);
      expect(l.text, id).not.toMatch(/\d|[<>×÷+−=$%/]/);
    }
  });
  it('the page uses only scripted ids, and every scripted id is used', () => {
    const src = readFileSync('pages/lessons/linear-equations.ts', 'utf8');
    const used = new Set<string>();
    const pats = [/said\('([a-z]\.[a-z0-9-]+)'/g, /fbk\((?:true|false|o\.ok|right), '([a-z]\.[a-z0-9-]+)'/g, /sayNext\('([a-z]\.[a-z0-9-]+)'\)/g, /SCRIPT\['([a-z]\.[a-z0-9-]+)'\]/g, /\b(?:id|cb): '([a-z]\.[a-z0-9-]+)'/g, /'(p\.k\d|p\.test|p\.build|p\.w-other)'/g, /'(t\.[a-z]+-[a-z0-9]+)'/g];
    for (const re of pats) for (const m of src.matchAll(re)) used.add(m[1]!);
    for (let i = 1; i <= 4; i++) used.add(`e.s${i}`);
    for (let i = 1; i <= 3; i++) used.add(`p.c${i}`);
    for (const id of used) expect(SCRIPT[id], id).toBeTruthy();
    for (const id of Object.keys(SCRIPT)) expect(used.has(id), `unused line ${id}`).toBe(true);
  });
});
