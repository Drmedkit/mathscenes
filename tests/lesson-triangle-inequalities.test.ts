// lesson-triangle-inequalities: the generic checks (every family x every sub-goal it serves x 300 seeds). Add topic checks below.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { rng } from '../src/lesson/runtime/item';
import { GENERATORS } from '../src/lesson/topics/triangle-inequalities/items';
import { PLAN } from '../src/lesson/topics/triangle-inequalities/plan';

const TOPIC = { subgoals: [...new Map(["secondary.triangle-side-angle-relationships-isosceles-theorems-side-an"].flatMap(i => JSON.parse(fs.readFileSync(`../math-curriculum-essentials/topics/${i}.json`, 'utf8')).subgoals).map((s: { id: string }) => [s.id, s] as const)).values()] };
const CATALOG = new Set<string>(JSON.parse(fs.readFileSync('../math-curriculum-essentials/misconceptions.json', 'utf8')).misconceptions.map((m: { id: string }) => m.id));
const GEN = GENERATORS as Record<string, (R: () => number, n: number, sg?: string) => import('../src/lesson/runtime/item').Item>;

describe('triangle-inequalities: plan', () => {
  it('walks through every sub-goal of the topic JSON, in order, each with a family', () => {
    expect(PLAN.map(p => p.id)).toEqual(TOPIC.subgoals.map((s: { id: string }) => s.id));
    for (const p of PLAN) { expect(p.families.length, p.id).toBeGreaterThan(0); for (const f of p.families) expect(GEN[f], f).toBeDefined(); }
  });
});

describe('triangle-inequalities: families', () => {
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
import type { TIItem } from '../src/lesson/topics/triangle-inequalities/items';
import { FR_PROOF, RS_RESERVE, pictureProblems } from '../src/lesson/topics/triangle-inequalities/tkit';
import { dist, measure } from '../src/lesson/topics/geometry-foundations/geo';
import { ProofFrame } from '../src/lesson/topics/geometry-foundations/ProofFrame';
import { dusk } from '../src/lesson/dusk';
import { explain } from '../src/lesson/topics/triangle-inequalities/explain';
import { resultOf } from '../src/lesson/runtime/explain';
import { thirdRange, triKind, wholeIn, isoTri, angAt, sideLen, triSSS, orderBy } from '../src/lesson/topics/triangle-inequalities/ineq';
import { PROOFS } from '../src/lesson/topics/triangle-inequalities/famC';

import { SCRIPT } from '../src/lesson/topics/triangle-inequalities/script';
describe('triangle-inequalities: voice', () => {
  it('every script line is voiced, and the spoken text has no digits or symbols', () => {
    const lines = JSON.parse(fs.readFileSync('pages/lessons/triangle-inequalities/voice/lines.json', 'utf8')) as Record<string, { text: string }>;
    expect(Object.keys(lines).sort()).toEqual(Object.keys(SCRIPT).sort());
    for (const [k, v] of Object.entries(SCRIPT)) {
      expect(lines[k]!.text, k).toBe(v.say);
      expect(/[0-9=≅∠△°+−<>/]/.test(v.say), `${k}: ${v.say}`).toBe(false);
    }
  });
});

describe('triangle-inequalities: maths', () => {
  it('triKind: strict test, the flat case, decimals exact', () => {
    expect(triKind([4, 5, 9])).toBe('flat');
    expect(triKind([9, 4, 5])).toBe('flat');
    expect(triKind([5, 6, 8])).toBe('yes');
    expect(triKind([3, 4, 9])).toBe('no');
    expect(triKind([0.1, 0.2, 0.3])).toBe('flat');
    expect(triKind([2.5, 3.6, 6.1])).toBe('flat');
  });
  it('third side range and the whole lengths inside', () => {
    expect(thirdRange(6, 11)).toEqual({ lo: 5, hi: 17 });
    expect(wholeIn(5, 17)).toEqual([6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
    expect(wholeIn(2.5, 11.5).length).toBe(9);
    expect(thirdRange(3.6, 8.2)).toEqual({ lo: 4.6, hi: 11.8 });
  });
  it('isosceles triangles have equal base angles; longer sides face larger angles', () => {
    for (const v of [30, 47, 90, 120]) { const T = isoTri(v, 300); expect(Math.abs(angAt(T, 1) - angAt(T, 2))).toBeLessThan(1e-9); expect(Math.abs(angAt(T, 0) - v)).toBeLessThan(1e-9); }
    for (let s = 1; s < 200; s++) {
      const R = rng(s), L = [3 + Math.floor(R() * 15), 3 + Math.floor(R() * 15), 3 + Math.floor(R() * 15)];
      if (triKind(L) !== 'yes' || new Set(L).size < 3) continue;
      const T = triSSS(L[0]!, L[1]!, L[2]!);
      expect(orderBy([0, 1, 2].map(i => sideLen(T, i)))).toEqual(orderBy([0, 1, 2].map(i => angAt(T, i))));
    }
  });
});

describe('triangle-inequalities: pictures', () => {
  it('every practice picture reads in the frame the page uses, and every mark group is exact', () => {
    for (const p of PLAN) for (const f of p.families) for (let s = 1; s <= 40; s++) {
      const it = GEN[f]!(rng(s * 7 + 3), s, p.id) as TIItem;
      expect(pictureProblems(it.picture), `${f} ${s}`).toEqual([]);
      const fig = it.picture?.fig;
      if (!fig) continue;
      for (const g of fig.segs.filter(x => x.ticks)) for (const g2 of fig.segs.filter(x => x.ticks === g.ticks)) expect(Math.abs(dist(g.a, g.b) - dist(g2.a, g2.b)), f).toBeLessThan(1e-6);
      for (const g of fig.angles.filter(x => x.arcs && !x.solve)) for (const g2 of fig.angles.filter(x => x.arcs === g.arcs && !x.solve)) expect(Math.abs(measure(g.v, g.p, g.q) - measure(g2.v, g2.p, g2.q)), f).toBeLessThan(1e-6);
      for (const g of fig.angles) { const m = /^(\d+(?:\.\d+)?)°$/.exec(g.text ?? ''); if (m) expect(Math.abs(measure(g.v, g.p, g.q) - Number(m[1])), `${f} ${g.text}`).toBeLessThan(0.01); }
    }
  });
  it('labelled side lengths are drawn in proportion (a figure never contradicts the side-angle order)', () => {
    for (const p of PLAN) for (const f of p.families) for (let s = 1; s <= 40; s++) {
      const fig = (GEN[f]!(rng(s * 5 + 1), s, p.id) as TIItem).picture?.fig;
      if (!fig) continue;
      const lab = fig.segs.filter(x => /^\d+(\.\d+)? (in|cm)$/.test(x.text ?? '') && !x.dash).map(x => ({ v: parseFloat(x.text!), d: dist(x.a, x.b) }));
      for (const a of lab) for (const b of lab) expect(Math.abs(a.d / a.v - b.d / b.v) / (a.d / a.v), `${f} ${s}`).toBeLessThan(1e-6);
    }
  });
  it('every practice proof builds in the proof frame, before and after the solve', () => {
    for (const p of PLAN) for (const f of p.families) for (let s = 1; s <= 30; s++) {
      const it = GEN[f]!(rng(s * 17 + 3), s, p.id) as TIItem;
      const pr = it.picture?.proof;
      if (!pr) continue;
      const fill = new Map((it.picture!.reveal?.fill ?? []).map(x => [x.i, x]));
      const solved = pr.rows.map((r, i) => ({ st: fill.get(i)?.st ?? r.st, rs: fill.get(i)?.rs ?? r.rs }));
      for (const rows of [pr.rows, solved]) expect(() => ProofFrame({ given: pr.given, prove: pr.prove, rows, pool: pr.pool, first: pr.first, reserveRs: RS_RESERVE }, FR_PROOF, dusk), `${f} ${s}`).not.toThrow();
    }
  });
  it('the proof banks have the expected rows', () => {
    expect(PROOFS.ineqRows({ A: 'A', B: 'B', C: 'C', D: 'D' }).length).toBe(7);
    expect(PROOFS.sumProof('ABC').rows.length).toBe(5);
  });
});

describe('triangle-inequalities: worked steps and slips', () => {
  it('the steps card arrives at the item answer', () => {
    for (const p of PLAN) for (const f of p.families) for (let s = 1; s <= 25; s++) {
      const it = GEN[f]!(rng(s * 11 + 5), s, p.id);
      const ex = explain(it);
      const r = ex ? resultOf(it, ex.steps) : null;
      expect(r, `${f}: ${ex?.steps.join(' | ')}`).not.toBeNull();
      expect(it.check(r!).ok, `${f}: ${ex!.steps.join(' | ')}`).toBe(true);
    }
  });
  it('the main slips are classified', () => {
    const seen = new Set<string>();
    for (const p of PLAN) for (const f of p.families) for (let s = 1; s <= 60; s++) {
      const it = GEN[f]!(rng(s * 3 + 1), s, p.id);
      if (it.choices) it.choices.forEach((_, i) => { const mc = it.check({ kind: 'choice', i }).mc; if (mc) seen.add(mc); });
    }
    for (const id of ['mc.shapes.misplaces-isosceles-base-angles', 'mc.geometric-proof.converse-assumed-true', 'mc.shapes.pairs-side-with-adjacent-angle', 'mc.angles.triangle-side-ratios-equal-angle-ratios', 'mc.shapes.accepts-degenerate-triangle', 'mc.estimation.close-estimate-always-good-enough', 'mc.shapes.checks-wrong-pair-in-triangle-inequality', 'mc.shapes.third-side-upper-bound-only', 'mc.reasoning-language.examples-as-proof', 'mc.geometric-proof.uses-fact-before-established', 'mc.transformations.turned-or-flipped-copy-not-congruent', 'mc.angles.triangle-exterior-sum-depends-on-shape', 'mc.geometric-proof.overlooks-boundary-case', 'mc.geometric-proof.diagram-appearance-as-given']) expect(seen.has(id), id).toBe(true);
  });
  it('number slips: base angle as vertex, x reported, both endpoints counted, upper bound only, both exterior angles', () => {
    const mcs = new Set<string>();
    for (const f of ['isoAngle', 'isoAlgebra', 'isoSides', 'rangeCount', 'extMissing', 'rangePair']) for (let s = 1; s <= 80; s++) {
      const it = GEN[f]!(rng(s * 13 + 2), s);
      const a = it.answer;
      if (a.kind === 'pair') { const c = it.check({ kind: 'pair', x: 0, y: a.y }); if (c.mc) mcs.add(c.mc); continue; }
      for (let v = 0; v <= 800; v += 0.5) { const c = it.check({ kind: 'num', v }); if (!c.ok && c.mc) mcs.add(c.mc); }
    }
    for (const id of ['mc.shapes.misplaces-isosceles-base-angles', 'mc.linear-equations.reports-x-not-asked-quantity', 'mc.shapes.accepts-degenerate-triangle', 'mc.shapes.third-side-upper-bound-only', 'mc.angles.exterior-sum-counts-both']) expect(mcs.has(id), id).toBe(true);
  });
});
