// lesson-triangle-congruence: the generic checks (every family x every sub-goal it serves x 300 seeds). Add topic checks below.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { rng } from '../src/lesson/runtime/item';
import { GENERATORS } from '../src/lesson/topics/triangle-congruence/items';
import { PLAN } from '../src/lesson/topics/triangle-congruence/plan';
import type { GFItem } from '../src/lesson/topics/triangle-congruence/items';
import { SCRIPT } from '../src/lesson/topics/triangle-congruence/script';
import { FR_LEFT, FR_RIGHT, FR_WIDE, dist, figProblems, measure } from '../src/lesson/topics/geometry-foundations/geo';
import { ProofFrame } from '../src/lesson/topics/geometry-foundations/ProofFrame';
import { dusk } from '../src/lesson/dusk';
import { type Part, angle, buildFig, critOf, critsOf, side, triASA } from '../src/lesson/topics/triangle-congruence/tri';
import { BANK, makeProof, partsFor, validOrder } from '../src/lesson/topics/triangle-congruence/triProofs';
import { makePair, ssaAlt } from '../src/lesson/topics/triangle-congruence/pairs';
import { explain } from '../src/lesson/topics/triangle-congruence/explain';
import { resultOf } from '../src/lesson/runtime/explain';

const TOPIC = { subgoals: [...new Map(["secondary-t6-19-triangle-congruence-sss-sas-asa-aas-hl"].flatMap(i => JSON.parse(fs.readFileSync(`../math-curriculum-essentials/topics/${i}.json`, 'utf8')).subgoals).map((s: { id: string }) => [s.id, s] as const)).values()] };
const CATALOG = new Set<string>(JSON.parse(fs.readFileSync('../math-curriculum-essentials/misconceptions.json', 'utf8')).misconceptions.map((m: { id: string }) => m.id));
const GEN = GENERATORS as Record<string, (R: () => number, n: number, sg?: string) => import('../src/lesson/runtime/item').Item>;

describe('triangle-congruence: plan', () => {
  it('walks through every sub-goal of the topic JSON, in order, each with a family', () => {
    expect(PLAN.map(p => p.id)).toEqual(TOPIC.subgoals.map((s: { id: string }) => s.id));
    for (const p of PLAN) { expect(p.families.length, p.id).toBeGreaterThan(0); for (const f of p.families) expect(GEN[f], f).toBeDefined(); }
  });
});

describe('triangle-congruence: families', () => {
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
describe('triangle-congruence: voice', () => {
  it('every script line is voiced, and the spoken text has no digits or symbols', () => {
    const lines = JSON.parse(fs.readFileSync('pages/lessons/triangle-congruence/voice/lines.json', 'utf8')) as Record<string, { text: string }>;
    expect(Object.keys(lines).sort()).toEqual(Object.keys(SCRIPT).sort());
    for (const [k, v] of Object.entries(SCRIPT)) {
      expect(lines[k]!.text, k).toBe(v.say);
      expect(/[0-9=≅∠△°+−<>/]/.test(v.say), `${k}: ${v.say}`).toBe(false);
    }
  });
});

describe('triangle-congruence: criteria', () => {
  const P = (k: 's' | 'a', i: number, right = false): Part => ({ k, i, right });
  it('names the pattern of three pairs', () => {
    expect(critOf([P('s', 0), P('s', 1), P('s', 2)])).toBe('SSS');
    expect(critOf([P('s', 1), P('a', 0), P('s', 2)])).toBe('SAS');       // angle 0 between sides 1 and 2
    expect(critOf([P('s', 1), P('a', 1), P('s', 2)])).toBe('none');      // SSA
    expect(critOf([P('s', 0), P('a', 1, true), P('s', 1)])).toBe('HL'); // right angle 1, hypotenuse = side 1
    expect(critOf([P('a', 0), P('s', 2), P('a', 1)])).toBe('ASA');       // side 2 joins vertices 0 and 1
    expect(critOf([P('a', 0), P('s', 0), P('a', 1)])).toBe('AAS');
    expect(critOf([P('a', 0), P('a', 1), P('a', 2)])).toBe('none');
  });
  it('derives the third angle (ASA and AAS go together) and the third side of a right triangle', () => {
    expect([...critsOf([P('a', 0), P('s', 2), P('a', 1)])].sort()).toEqual(['AAS', 'ASA']);
    expect(critsOf([P('s', 1), P('a', 1), P('s', 2)]).size).toBe(0);
    expect(critsOf([P('a', 0), P('a', 1), P('a', 2)]).size).toBe(0);
    expect(critsOf([P('s', 0), P('a', 1, true), P('s', 1)]).has('SSS')).toBe(true);
  });
  it('the other SSA triangle has the same two sides and angle, and a different third side', () => {
    let n = 0;
    for (let s = 1; s < 200; s++) {
      const T = triASA(30 + (s % 40), 320, 40 + (s % 30));
      for (let k = 0; k < 3; k++) {
        const A2 = ssaAlt(T, k); if (!A2) continue;
        n++;
        const a = (k + 1) % 3, b = (k + 2) % 3;
        expect(Math.abs(angle(A2, k) - angle(T, k))).toBeLessThan(1e-6);
        expect(Math.abs(side(A2, k) - side(T, k))).toBeLessThan(1e-6);
        expect(Math.abs(side(A2, a) - side(T, a))).toBeLessThan(1e-6);
        expect(Math.abs(side(A2, b) - side(T, b))).toBeGreaterThan(20);
      }
    }
    expect(n).toBeGreaterThan(50);
  });
  it('marks are exact: a tick group of unequal segments is refused', () => {
    expect(() => buildFig({ pts: { A: [0, 0], B: [100, 0], C: [0, 120] }, segs: ['AB', 'AC', 'BC'], marks: [{ seg: 'AB', n: 1 }, { seg: 'AC', n: 1 }] })).toThrow();
  });
});

describe('triangle-congruence: exact figures', () => {
  it('every marked pair: tick groups equal, arc groups equal, boxes right', () => {
    for (const pat of ['SSS', 'SAS', 'ASA', 'AAS', 'HL', 'AAA', 'SSA'] as const) for (let s = 1; s <= 60; s++) {
      const f = makePair(rng(s * 13 + 1), pat, 'row').fig;
      for (const g of f.segs.filter(x => x.ticks)) for (const g2 of f.segs.filter(x => x.ticks === g.ticks)) expect(Math.abs(dist(g.a, g.b) - dist(g2.a, g2.b))).toBeLessThan(1e-6);
      for (const g of f.angles.filter(x => x.arcs)) for (const g2 of f.angles.filter(x => x.arcs === g.arcs)) expect(Math.abs(measure(g.v, g.p, g.q) - measure(g2.v, g2.p, g2.q))).toBeLessThan(1e-6);
      for (const g of f.angles.filter(x => x.box)) expect(Math.abs(measure(g.v, g.p, g.q) - 90)).toBeLessThan(1e-6);
    }
  });
  it('every practice item picture lays out readably in the frame the page uses', () => {
    for (const p of PLAN) for (const f of p.families) for (let s = 1; s <= 40; s++) {
      const pic = (GEN[f]!(rng(s * 7 + 3), s, p.id) as GFItem).picture;
      if (pic?.fig) expect(figProblems(pic.fig, pic.proof || pic.card || pic.cards ? FR_LEFT : FR_WIDE), `${f} ${s}`).toEqual([]);
    }
  });
});

describe('triangle-congruence: proofs', () => {
  it('every bank proof is in a valid order, ends on its target, and cites its criterion last', () => {
    for (const id of BANK) for (let s = 1; s <= 30; s++) {
      const p = makeProof(id, rng(s));
      expect(validOrder(p, p.rows.map((_, i) => i + 1)), id).toBe(true);
      expect(p.rows[p.rows.length - 1]!.st).toBe(p.prove);
      expect(p.rows[p.rows.length - 1]!.rs).toBe(p.crit);
      expect(p.rows.length).toBeLessThanOrEqual(6);
    }
  });
  it('partsFor gives the criterion it is asked for', () => {
    for (const c of ['SSS', 'SAS', 'ASA', 'AAS', 'HL'] as const) for (let s = 1; s < 50; s++) expect(critOf(partsFor(c, rng(s)))).toBe(c);
  });
});

describe('triangle-congruence: proof frames', () => {
  it('every practice proof builds in the proof frame, before and after the solve fills its cell', () => {
    for (const f of ['proofParsons', 'proofReason', 'proofGap', 'cpctcNext', 'cpctcEarly', 'reflexReason', 'defReason']) for (let s = 1; s <= 80; s++) {
      const it = GEN[f]!(rng(s * 17 + 3), s) as GFItem;
      const pr = it.picture!.proof!;
      const fill = new Map((it.picture!.reveal?.fill ?? []).map(x => [x.i, x]));
      const solved = pr.rows.map((r, i) => ({ st: fill.get(i)?.st ?? r.st, rs: fill.get(i)?.rs ?? r.rs }));
      for (const rows of [pr.rows, solved]) expect(() => ProofFrame({ given: pr.given, prove: pr.prove, rows, pool: pr.pool, first: pr.first }, { x: FR_RIGHT.x, y: 60, w: FR_RIGHT.w, h: 960 }, dusk), `${f} ${s}`).not.toThrow();
    }
  });
});

describe('triangle-congruence: worked steps', () => {
  it('the steps card arrives at the item answer', () => {
    for (const p of PLAN) for (const f of p.families) for (let s = 1; s <= 25; s++) {
      const it = GEN[f]!(rng(s * 11 + 5), s, p.id);
      const ex = explain(it);
      const r = ex ? resultOf(it, ex.steps) : null;
      expect(r, `${f}: ${ex?.steps.join(' | ')}`).not.toBeNull();
      expect(it.check(r!).ok, `${f}: ${ex!.steps.join(' | ')}`).toBe(true);
    }
  });
});

describe('triangle-congruence: misconceptions', () => {
  it('the main slips are classified', () => {
    const seen = new Set<string>();
    for (const p of PLAN) for (const f of p.families) for (let s = 1; s <= 40; s++) {
      const it = GEN[f]!(rng(s * 3 + 1), s, p.id);
      if (it.choices) it.choices.forEach((_, i) => { const mc = it.check({ kind: 'choice', i }).mc; if (mc) seen.add(mc); });
    }
    for (const id of ['mc.transformations.ssa-accepted-as-criterion', 'mc.transformations.equal-angles-prove-congruence', 'mc.transformations.misapplies-aas', 'mc.transformations.hl-pairs-leg-with-hypotenuse', 'mc.transformations.statement-vertex-order-ignored', 'mc.geometric-proof.only-marked-parts-count', 'mc.geometric-proof.diagram-appearance-as-given', 'mc.reasoning-language.counterexample-violates-premise', 'mc.transformations.turned-or-flipped-copy-not-congruent']) expect(seen.has(id), id).toBe(true);
  });
});
