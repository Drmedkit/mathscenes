// lesson-triangle-centers: the generic checks (every family x every sub-goal it serves x 300 seeds) and topic checks.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { rng } from '../src/lesson/runtime/item';
import { GENERATORS, type TCItem } from '../src/lesson/topics/triangle-centers/items';
import { PLAN } from '../src/lesson/topics/triangle-centers/plan';
import { SCRIPT } from '../src/lesson/topics/triangle-centers/script';
import { explain } from '../src/lesson/topics/triangle-centers/explain';
import { resultOf } from '../src/lesson/runtime/explain';
import { FR_RIGHT, dist, figProblems, measure } from '../src/lesson/topics/geometry-foundations/geo';
import { ProofFrame } from '../src/lesson/topics/geometry-foundations/ProofFrame';
import { dusk } from '../src/lesson/dusk';
import { consProblems } from '../src/lesson/topics/constructions/Construct';
import { type Kind, type Tri, altitudeFoot, centroidOf, circumcenterOf, footOf, incenterOf, inradiusOf, kindOf, makeTri, mid, orthocenterOf, sideMid, whereIs } from '../src/lesson/topics/triangle-centers/centers';
import { TC_BANK, makeTCProof, validOrder } from '../src/lesson/topics/triangle-centers/tcProofs';
import { circumCons, inCons } from '../src/lesson/topics/triangle-centers/consTC';
import { picFrame } from '../src/lesson/topics/triangle-centers/tkit';

const TOPIC = { subgoals: [...new Map(["secondary-t6-20-properties-of-triangles"].flatMap(i => JSON.parse(fs.readFileSync(`../math-curriculum-essentials/topics/${i}.json`, 'utf8')).subgoals).map((s: { id: string }) => [s.id, s] as const)).values()] };
const CATALOG = new Set<string>(JSON.parse(fs.readFileSync('../math-curriculum-essentials/misconceptions.json', 'utf8')).misconceptions.map((m: { id: string }) => m.id));
const GEN = GENERATORS as Record<string, (R: () => number, n: number, sg?: string) => import('../src/lesson/runtime/item').Item>;

describe('triangle-centers: plan', () => {
  it('walks through every sub-goal of the topic JSON, in order, each with a family', () => {
    expect(PLAN.map(p => p.id)).toEqual(TOPIC.subgoals.map((s: { id: string }) => s.id));
    for (const p of PLAN) { expect(p.families.length, p.id).toBeGreaterThan(0); for (const f of p.families) expect(GEN[f], f).toBeDefined(); }
  });
});

describe('triangle-centers: families', () => {
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
describe('triangle-centers: voice', () => {
  it('every script line is voiced, and the spoken text has no digits or symbols', () => {
    const lines = JSON.parse(fs.readFileSync('pages/lessons/triangle-centers/voice/lines.json', 'utf8')) as Record<string, { text: string }>;
    expect(Object.keys(lines).sort()).toEqual(Object.keys(SCRIPT).sort());
    for (const [k, v] of Object.entries(SCRIPT)) {
      expect(lines[k]!.text, k).toBe(v.say);
      expect(/[0-9=≅∠△°+−<>/:]/.test(v.say.replace(/: /g, ', ')), `${k}: ${v.say}`).toBe(false);
    }
  });
});

describe('triangle-centers: the centers', () => {
  const kinds: Kind[] = ['acute', 'right', 'obtuse'];
  it('circumcenter equidistant from the vertices, incenter from the sides, centroid 2 : 1, altitudes concurrent', () => {
    for (const k of kinds) for (let s = 1; s <= 60; s++) {
      const T = makeTri(rng(s * 3 + 1), k, { at: s % 3 });
      const O = circumcenterOf(T), I = incenterOf(T), G = centroidOf(T), H = orthocenterOf(T), r = inradiusOf(T);
      expect(Math.abs(dist(O, T[0]) - dist(O, T[1])) + Math.abs(dist(O, T[1]) - dist(O, T[2]))).toBeLessThan(1e-6);
      for (let i = 0; i < 3; i++) expect(Math.abs(dist(I, footOf(I, T[(i + 1) % 3]!, T[(i + 2) % 3]!)) - r)).toBeLessThan(1e-6);
      for (let i = 0; i < 3; i++) expect(Math.abs(dist(T[i]!, G) - 2 * dist(G, sideMid(T, i)))).toBeLessThan(1e-6);
      for (let i = 0; i < 3; i++) { const D = altitudeFoot(T, i); if (dist(D, T[i]!) > 1e-6 && dist(H, T[i]!) > 1e-6) expect(Math.abs(measure(T[i]!, D, H)) < 1e-4 || Math.abs(measure(T[i]!, D, H) - 180) < 1e-4).toBe(true); }
      expect(kindOf(T)).toBe(k);
    }
  });
  it('where the centers lie, by kind', () => {
    for (let s = 1; s <= 60; s++) {
      const a = makeTri(rng(s), 'acute'), r = makeTri(rng(s), 'right', { at: 1 }), o = makeTri(rng(s), 'obtuse');
      expect(whereIs(a, circumcenterOf(a))).toBe('inside'); expect(whereIs(a, orthocenterOf(a))).toBe('inside');
      expect(whereIs(r, circumcenterOf(r))).toBe('side'); expect(whereIs(r, orthocenterOf(r))).toBe('vertex');
      expect(whereIs(o, circumcenterOf(o))).toBe('outside'); expect(whereIs(o, orthocenterOf(o))).toBe('outside');
      for (const T of [a, r, o]) { expect(whereIs(T, centroidOf(T))).toBe('inside'); expect(whereIs(T, incenterOf(T))).toBe('inside'); }
      expect(dist(circumcenterOf(r), mid(r[0], r[2]))).toBeLessThan(1e-6);   // the right angle at vertex 1: hypotenuse V0V2
    }
  });
  it('the constructions: the circle passes through the vertices, the inscribed circle touches every side', () => {
    for (let s = 1; s <= 40; s++) {
      const T: Tri = makeTri(rng(s), s % 2 ? 'acute' : 'obtuse', { at: 2, lo: 100, hi: 116 });
      const c1 = circumCons(T, ['A', 'B', 'C', 'K']), arc = c1.steps.find(x => x.id === 'circ')!.arcs[0]!;
      for (const v of T) expect(Math.abs(dist(arc.c, v) - arc.r)).toBeLessThan(1e-6);
      const c2 = inCons(T, ['A', 'B', 'C', 'K', 'F']), a2 = c2.steps.find(x => x.id === 'circ')!.arcs[0]!;
      for (let i = 0; i < 3; i++) expect(Math.abs(dist(a2.c, footOf(a2.c, T[(i + 1) % 3]!, T[(i + 2) % 3]!)) - a2.r)).toBeLessThan(1e-6);
    }
  });
});

describe('triangle-centers: pictures', () => {
  it('every practice picture lays out readably in the frame the page uses (figure, construction, proof frame)', () => {
    for (const p of PLAN) for (const f of p.families) for (let s = 1; s <= 30; s++) {
      const it = GEN[f]!(rng(s * 7 + 3), s, p.id) as TCItem, pic = it.picture;
      if (!pic) continue;
      if (pic.fig) expect(figProblems(pic.fig, picFrame(pic)), `${f} ${s}`).toEqual([]);
      if (pic.cons) expect(consProblems(pic.cons.c, picFrame(pic), pic.cons.over), `${f} ${s}`).toEqual([]);
      if (pic.proof) {
        const pr = pic.proof, fill = new Map((pic.reveal?.fill ?? []).map(x => [x.i, x]));
        const solved = pr.rows.map((r, i) => ({ st: fill.get(i)?.st ?? r.st, rs: fill.get(i)?.rs ?? r.rs }));
        for (const rows of [pr.rows, solved]) expect(() => ProofFrame({ given: pr.given, prove: pr.prove, rows, pool: pr.pool, first: pr.first }, { x: FR_RIGHT.x, y: 60, w: FR_RIGHT.w, h: 960 }, dusk), `${f} ${s}`).not.toThrow();
      }
    }
  });
  it('labelled angles are drawn at their measure; tick groups equal; boxes right', () => {
    for (const p of PLAN) for (const f of p.families) for (let s = 1; s <= 20; s++) {
      const fig = (GEN[f]!(rng(s * 13 + 5), s, p.id) as TCItem).picture?.fig;
      if (!fig) continue;
      for (const a of fig.angles) { const m = /^(\d+)°$/.exec(a.text ?? ''); if (m) expect(Math.abs(measure(a.v, a.p, a.q) - Number(m[1])), `${f} ${a.id}`).toBeLessThan(0.5); if (a.box) expect(Math.abs(measure(a.v, a.p, a.q) - 90), `${f} box`).toBeLessThan(1e-6); }
      for (const g of fig.segs.filter(x => x.ticks)) for (const g2 of fig.segs.filter(x => x.ticks === g.ticks)) expect(Math.abs(dist(g.a, g.b) - dist(g2.a, g2.b)), `${f} ticks`).toBeLessThan(1e-6);
    }
  });
  it('every proof item builds in the proof frame, before and after the solve (150 seeds)', () => {
    for (const f of ['pbProofReason', 'pbProofOrder', 'pbConvReason', 'concurChain', 'abProofReason', 'abConvReason', 'inConcur', 'midProofStep', 'twoThirdsStep', 'medConcur']) for (let s = 1; s <= 150; s++) {
      const pic = (GEN[f]!(rng(s * 17 + 3), s) as TCItem).picture;
      const pr = pic?.proof;
      if (!pr) continue;
      const fill = new Map((pic!.reveal?.fill ?? []).map(x => [x.i, x]));
      const solved = pr.rows.map((r, i) => ({ st: fill.get(i)?.st ?? r.st, rs: fill.get(i)?.rs ?? r.rs }));
      for (const rows of [pr.rows, solved]) expect(() => ProofFrame({ given: pr.given, prove: pr.prove, rows, pool: pr.pool, first: pr.first }, { x: FR_RIGHT.x, y: 60, w: FR_RIGHT.w, h: 960 }, dusk), `${f} ${s}`).not.toThrow();
    }
  });
  it('no answer is drawn before the student answers: an asked proof cell is blank in the picture data', () => {
    for (const f of ['pbProofReason', 'pbConvReason', 'concurChain', 'abProofReason', 'abConvReason', 'inConcur', 'midProofStep', 'twoThirdsStep']) for (let s = 1; s <= 40; s++) {
      const pr = (GEN[f]!(rng(s * 5 + 1), s) as TCItem).picture?.proof;
      for (const a of pr?.ask ?? []) expect(pr!.rows[a.i]![a.cell], f).toBe('');
    }
  });
});

describe('triangle-centers: proofs', () => {
  it('every bank proof is in a valid order and ends on its target', () => {
    for (const id of TC_BANK) for (let s = 1; s <= 20; s++) {
      const p = makeTCProof(id, rng(s));
      expect(validOrder(p, p.rows.map((_, i) => i + 1)), id).toBe(true);
      expect(p.rows.length).toBeLessThanOrEqual(7);
      for (const r of p.rows) { expect(r.wrong.some(w => w.t === r.rs), `${id}: a wrong reason equals the right one`).toBe(false); for (const w of r.wrong) if (w.mc) expect(CATALOG.has(w.mc), w.mc).toBe(true); }
      for (const d of p.decoys) expect(CATALOG.has(d.mc), d.mc).toBe(true);
    }
  });
  it('an AAS row never offers ASA as wrong (the third angle makes it work too), an HL row never offers SSS', () => {
    for (const id of TC_BANK) { const p = makeTCProof(id, rng(3)); for (const r of p.rows) { if (r.rs === 'AAS') expect(r.wrong.map(w => w.t)).not.toContain('ASA'); if (r.rs === 'HL') expect(r.wrong.map(w => w.t)).not.toContain('SSS'); } }
  });
});

describe('triangle-centers: misconceptions are classified', () => {
  /** the misconception ids a family's number check gives for typical wrong answers (scaled answers, small whole numbers) */
  const seen = (f: string, sg: string): Set<string> => {
    const out = new Set<string>();
    for (let s = 1; s <= 150; s++) {
      const it = GEN[f]!(rng(s * 19 + 2), s, sg);
      if (it.answer.kind !== 'num') continue;
      const a = it.answer.v;
      for (const v of [a / 2, 2 * a, (3 * a) / 2, (2 * a) / 3, 3 * a, a / 3, 4 * a, (3 * a) / 4, (4 * a) / 3, 90, 45, 180 - a, ...Array.from({ length: 14 }, (_, i) => i + 1)]) {
        const r = it.check({ kind: 'num', v });
        if (!r.ok && r.mc) out.add(r.mc);
      }
    }
    return out;
  };
  it('centroid: halfway, reversed and 3 : 1', () => {
    const m = seen('centroidPart', 's2-centroid-ratio');
    for (const id of ['mc.shapes.centroid-ratio-wrong', 'mc.shapes.centroid-bisects-median', 'mc.shapes.centroid-long-segment-three-times-short']) expect(m.has(id), id).toBe(true);
  });
  it('midsegment: the half relation misapplied, equal to the parallel side; x reported instead of the length', () => {
    const m = seen('midsegLen', 's2-midsegment-length');
    for (const id of ['mc.shapes.midsegment-half-relation-misapplied', 'mc.shapes.midsegment-equals-parallel-side']) expect(m.has(id), id).toBe(true);
    expect(seen('midsegAlg', 's2-midsegment-algebra').has('mc.linear-equations.reports-x-not-asked-quantity')).toBe(true);
  });
  it('angle bisector: the whole angle, right angles', () => {
    const m = seen('bisectAngle', 's2-angle-bisector-equal-parts');
    for (const id of ['mc.angles.uses-whole-not-half-after-bisecting', 'mc.angles.bisection-always-makes-right-angles']) expect(m.has(id), id).toBe(true);
  });
});

describe('triangle-centers: worked steps', () => {
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

describe('triangle-centers: oracle regressions (2026-10-28)', () => {
  it('the article "A" is never relabelled; statement questions show a neutral board; the medial perimeter is exact', () => {
    for (let s = 1; s <= 200; s++) {
      for (const f of ['contextBrace', 'contextTowns']) { const it = GEN[f]!(rng(s), s); expect(/^(A |The |[A-Z][a-z])/.test(it.prompt), it.prompt).toBe(true); expect(/^[B-Z] (roof|water|brace)/.test(it.prompt), it.prompt).toBe(false); }
      for (const f of ['concurChain', 'inConcur', 'midProofStep', 'twoThirdsStep']) { const it = GEN[f]!(rng(s), s); if (it.prompt.startsWith('Which statement')) expect(it.board.includes('text{line ')).toBe(true); }
      const m = GEN.medialPerim!(rng(s), s);
      if (m.answer.kind === 'num') expect(Math.round(m.answer.v * 100)).toBeCloseTo(m.answer.v * 100, 6);
    }
  });
});
