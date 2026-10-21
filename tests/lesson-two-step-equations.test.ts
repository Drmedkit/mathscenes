// two-step equations: every family x every sub-goal it serves x 300 seeds gives a valid item (the answer passes,
// choices unique with exactly one right, misconception ids exist in the catalogue, boards typeset), the main
// misconceptions are classified, the plan covers every sub-goal of the topic JSON in order, and the balance model's
// maths (level exactly when both sides are equal; the same move on both pans keeps it level) and layout hold.
import { beforeAll, describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { rng, type Item } from '../src/lesson/runtime/item';
import { FAMILIES, FAMILY_NAMES, GENERATORS, MC, classifySolve, eqFor, makeEq, type EqItem } from '../src/lesson/topics/two-step-equations/items';
import { PLAN } from '../src/lesson/topics/two-step-equations/plan';
import { BAG_H, BAG_W, BALANCE_FRAME, MR, balanceFits, balanceLayout, computeBalance } from '../src/lesson/topics/two-step-equations/balanceMaths';
import { tex, texReady } from '../src/core/tex';

const ROOT = 'C:/Users/stelt/Claude code foler/math-curriculum-essentials';
const TOPIC = `${ROOT}/topics/secondary-t5-19-two-step-equations-and-inequalities.json`;
const MCF = `${ROOT}/misconceptions.json`;
const mcIds = existsSync(MCF) ? new Set((JSON.parse(readFileSync(MCF, 'utf8')) as { misconceptions: { id: string }[] }).misconceptions.map(m => m.id)) : null;
const pairs = PLAN.flatMap(p => p.families.map(f => [f, p.id] as const));
const make = (f: string, sg: string, s: number): EqItem => GENERATORS[f as keyof typeof GENERATORS](rng(s * 7919 + f.length * 31 + sg.length), s, sg);
const MF = BALANCE_FRAME;

beforeAll(async () => { await texReady(); });

describe('plan', () => {
  it('covers every sub-goal of the topic JSON, in order, each with families that exist; every family is used', () => {
    if (existsSync(TOPIC)) {
      const t = JSON.parse(readFileSync(TOPIC, 'utf8')) as { subgoals: { id: string; order: number }[] };
      expect(PLAN.map(p => p.id)).toEqual([...t.subgoals].sort((a, b) => a.order - b.order).map(s => s.id));
    }
    for (const p of PLAN) {
      expect(p.families.length).toBeGreaterThan(0);
      for (const f of p.families) { expect(GENERATORS[f as keyof typeof GENERATORS], f).toBeTypeOf('function'); expect(FAMILY_NAMES[f], f).toBeTruthy(); }
    }
    expect(new Set(PLAN.flatMap(p => p.families))).toEqual(new Set(FAMILIES.map(f => f.id)));
  });
  it('every misconception id the families use is in the catalogue', () => {
    if (!mcIds) return;
    for (const id of Object.values(MC)) expect(mcIds.has(id), id).toBe(true);
  });
});

describe('item families', () => {
  for (const [f, sg] of pairs) {
    it(`${f} for ${sg}: 300 seeds, the answer passes, choices unique with one right, boards typeset`, () => {
      const seen = new Set<string>();
      for (let s = 1; s <= 300; s++) {
        const it: Item = make(f, sg, s);
        expect(it.family).toBe(f);
        expect(it.check(it.answer).ok, `${it.prompt} ${JSON.stringify(it.answer)}`).toBe(true);
        expect(it.solution.length).toBeGreaterThan(0);
        const text = [it.prompt, it.board, ...(it.choices ?? []), ...it.solution].join(' ');
        expect(text, text).not.toMatch(/(?<!is )undefined|NaN|Infinity|\+ -|- -|\+ −/);
        if (it.choices) {
          expect(new Set(it.choices).size, it.choices.join(' | ')).toBe(it.choices.length);
          const verdicts = it.choices.map((_, i) => it.check({ kind: 'choice', i }));
          expect(verdicts.filter(v => v.ok).length, it.prompt).toBe(1);
          if (mcIds) for (const v of verdicts) if (v.mc) expect(mcIds.has(v.mc), v.mc).toBe(true);
        }
        if (it.input === 'num' && it.answer.kind === 'num') {
          // the typed answer is a short decimal, and a far-off number is wrong without a catalogue tag
          expect(String(it.answer.v).length).toBeLessThanOrEqual(6);
          expect(it.check({ kind: 'num', v: it.answer.v + 1000 }).ok).toBe(false);
        }
        const F = tex(it.board);
        expect(F.missing, it.board).toEqual([]);
        const pic = (it as EqItem).picture?.balance;
        if (pic) { expect(balanceFits(pic.p, pic.q, pic.r, pic.grouped), JSON.stringify(pic)).toBe(true); expect(computeBalance(pic).level).toBe(true); }
        seen.add(it.prompt + it.board + (it.choices ?? []).join());
      }
      expect(seen.size, `${f}/${sg}`).toBeGreaterThan(40);
    });
  }
});

describe('the solve classifier', () => {
  it('px + q = r: wrong order, forward, the intermediate and combined terms are diagnosed', () => {
    const e = makeEq('lin', 'px+q', 3, 6, 7);   // 3x + 6 = 27
    expect(classifySolve(e, 7).ok).toBe(true);
    expect(classifySolve(e, 3).mc).toBe(MC.wrongOrder);      // 27 ÷ 3 − 6
    expect(classifySolve(e, 11).mc).toBe(MC.forward);        // (27 + 6) ÷ 3
    expect(classifySolve(e, 21).mc).toBe(MC.intermediate);   // 3x
    expect(classifySolve(e, 3 * 21).mc).toBe(MC.forward);    // × 3 instead of ÷ 3
    expect(classifySolve(makeEq('lin', 'px+q', 2, 4, 8), 1.25).mc).toBeUndefined();
    expect(classifySolve(makeEq('lin', 'px+q', 2, 2, 5), 3).mc).toBe(MC.combine);   // 2x + 2 = 12 -> 4x = 12
  });
  it('signs: the coefficient sign and a detached minus are diagnosed', () => {
    expect(classifySolve(makeEq('lin', 'px+q', -4, 7, 3), -3).mc).toBe(MC.signDrop);     // -4x + 7 = -5
    expect(classifySolve(makeEq('lin', 'q-px', -2, 5, -3), 3).mc).toBe(MC.detached);    // 5 - 2x = 11
    expect(classifySolve(makeEq('lin', 'px-(-q)', 3, 2, 3), 13 / 3).mc).toBe(MC.detached); // 3x - (-2) = 11
  });
  it('rational: partial coefficient, visible numbers and the decimal point are diagnosed', () => {
    const f = makeEq('lin', 'frac', 2 / 3, -1, 12, { a: 2, b: 3 });   // (2/3)x - 1 = 7
    expect(f.R).toBe(7);
    expect(classifySolve(f, 4).mc).toBe(MC.partialCoef);    // 8 ÷ 2
    expect(classifySolve(f, 24).mc).toBe(MC.partialCoef);   // 8 × 3
    const o = makeEq('lin', 'x/p+q', 1 / 3, 2, 15);         // x/3 + 2 = 7
    expect(o.R).toBe(7);
    expect(classifySolve(o, 5 / 3).mc).toBe(MC.visible);
    const d = makeEq('lin', 'dec', 0.5, 1.2, 5.6);          // 0.5x + 1.2 = 4
    expect(d.R).toBe(4);
    expect(classifySolve(d, 56).mc).toBe(MC.decScale);
    expect(classifySolve(d, 5.6).ok).toBe(true);
  });
  it('grouped: undoing the inner constant first and stopping at x + q are diagnosed', () => {
    const g = makeEq('grp', 'p(x+q)', 3, 4, 3);              // 3(x + 4) = 21
    expect(g.R).toBe(21);
    expect(classifySolve(g, 17 / 3).mc).toBe(MC.wrongOrder);
    expect(classifySolve(g, 7).mc).toBe(MC.intermediate);
    expect(classifySolve(g, 11).mc).toBe(MC.forward);
    expect(classifySolve(makeEq('grp', 'p(x+q)', -3, 2, -6), 2).mc).toBe(MC.signDrop);   // -3(x + 2) = 12
  });
  it('every sub-goal makes equations with the right features', () => {
    for (let s = 1; s <= 300; s++) {
      const w = eqFor(rng(s), 'solve-whole-positive');
      expect(Number.isInteger(w.P) && w.P >= 2 && w.R <= 100 && Number.isInteger(w.x) && w.x >= 1).toBe(true);
      const g = eqFor(rng(s), 'solve-grouped');
      expect(g.kind).toBe('grp');
      const r = eqFor(rng(s), 'solve-rational');
      expect(Number.isInteger(r.P) && Number.isInteger(r.Q)).toBe(false);
      const n = eqFor(rng(s), 'solve-signed');
      expect(n.P < 0 || n.Q < 0 || n.x <= 0 || n.look === 'px-(-q)').toBe(true);
    }
  });
});

describe('Balance maths and layout', () => {
  it('3x + 6 = 27: one bag holds 7, the same move on both pans keeps it level', () => {
    const m = computeBalance({ p: 3, q: 6, r: 27 });
    expect(m.x).toBe(7); expect(m.level).toBe(true); expect(m.per).toBe(7);
    expect(m.takeR).toEqual([21, 22, 23, 24, 25, 26]);
    // take q from both: 3x = 21 still balances; split into 3: 1 bag = 7
    expect(m.p * m.x).toBe(m.r - m.takeR.length);
    expect((m.r - m.q) / m.p).toBe(m.x);
  });
  it('a move on one side only does not balance (the beam tips)', () => {
    const sam = computeBalance({ p: 1, q: 8, r: 10, x: 6 });   // Sam's x + 8 = 10 with the real x = 6
    expect(sam.level).toBe(false); expect(sam.lhs).toBe(14);
  });
  it('grouped 3(x + 4) = 21: each share is one bag + 4 | 7', () => {
    const m = computeBalance({ p: 3, q: 4, r: 21, grouped: true });
    expect(m.x).toBe(3); expect(m.per).toBe(7); expect(m.takeR).toEqual([3, 4, 5, 6]);
  });
  it('refuses what it cannot draw', () => {
    expect(() => computeBalance({ p: 3, q: 5, r: 27 })).toThrow(/whole number/);
    expect(() => computeBalance({ p: 5, q: 1, r: 11 })).toThrow(/1 to 4/);
    expect(() => computeBalance({ p: 2, q: 1, r: 23 })).toThrow(/1 to 9/);
  });
  it('every drawable equation stays inside the frame, and no two things overlap', () => {
    let n = 0;
    for (const grouped of [false, true]) for (let p = 1; p <= 4; p++) for (let q = 0; q <= 18; q++) for (let x = 1; x <= 9; x++) {
      const r = grouped ? p * (x + q) : p * x + q;
      if (!balanceFits(p, q, r, grouped)) continue;
      n++;
      const m = computeBalance({ p, q, r, grouped }), L = balanceLayout(m, MF);
      const items = (ph: 'A' | 'C') => [
        ...(ph === 'A' ? L.bagA : L.bagC).map(b => ({ x0: b.x - BAG_W / 2, x1: b.x + BAG_W / 2, y0: b.y - BAG_H / 2, y1: b.y + BAG_H / 2 })),
        ...(ph === 'A' ? L.leftA : L.leftC).filter((_, k) => ph === 'A' || grouped).map(c => ({ x0: c.x - MR, x1: c.x + MR, y0: c.y - MR, y1: c.y + MR })),
        ...(ph === 'A' ? L.rightA : L.rightC.slice(0, grouped ? r : r - q)).map(c => ({ x0: c.x - MR, x1: c.x + MR, y0: c.y - MR, y1: c.y + MR })),
      ];
      for (const ph of ['A', 'C'] as const) {
        const B = items(ph);
        for (const b of B) { expect(b.x0).toBeGreaterThanOrEqual(MF.x); expect(b.x1).toBeLessThanOrEqual(MF.x + MF.w); expect(b.y0).toBeGreaterThanOrEqual(MF.y); expect(b.y1).toBeLessThanOrEqual(L.floor + 1); }
        for (let i = 0; i < B.length; i++) for (let j = i + 1; j < B.length; j++) {
          const a = B[i]!, b = B[j]!;
          expect(a.x0 < b.x1 - 0.5 && b.x0 < a.x1 - 0.5 && a.y0 < b.y1 - 0.5 && b.y0 < a.y1 - 0.5, `${p},${q},${r},${grouped} ${ph} ${i}/${j}`).toBe(false);
        }
      }
    }
    expect(n).toBeGreaterThan(150);
  });
});

describe('voice lines', () => {
  it('every voiced id in the page has a spoken text, and every spoken text is used', () => {
    const src = readFileSync('pages/lessons/two-step-equations.ts', 'utf8');
    const lines = JSON.parse(readFileSync('pages/lessons/two-step-equations/voice/lines.json', 'utf8')) as Record<string, { text: string }>;
    const used = new Set<string>();
    for (const m of src.matchAll(/(?:voiced|voicedFb)\('([a-z]\.[a-z0-9.]+)'/g)) used.add(m[1]!);
    for (const m of src.matchAll(/\b(?:id|why): '([a-z]\.[a-z0-9.]+)'/g)) used.add(m[1]!);
    for (const m of src.matchAll(/'(q\.cb\.[a-z]+)'/g)) used.add(m[1]!);
    for (let i = 0; i < 4; i++) used.add(`e.step${i}`);
    for (let i = 1; i <= 3; i++) used.add(`p.c${i}`);
    for (const id of used) expect(lines[id]?.text, id).toBeTruthy();
    for (const id of Object.keys(lines)) expect(used.has(id), `unused line ${id}`).toBe(true);
    for (const [id, l] of Object.entries(lines)) expect(l.text, id).not.toMatch(/[0-9]\/[0-9]|<|>/);
  });
});
