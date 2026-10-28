// lesson-similarity: the generic checks (every family x every sub-goal it serves x 300 seeds). Add topic checks below.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { rng } from '../src/lesson/runtime/item';
import { GENERATORS } from '../src/lesson/topics/similarity/items';
import { PLAN } from '../src/lesson/topics/similarity/plan';
import type { GFItem } from '../src/lesson/topics/similarity/items';
import { SCRIPT } from '../src/lesson/topics/similarity/script';
import { FR_LEFT, FR_RIGHT, FR_WIDE, type Fig, type Pt, dist, figProblems, galleryFrames } from '../src/lesson/topics/geometry-foundations/geo';
import { ProofFrame } from '../src/lesson/topics/geometry-foundations/ProofFrame';
import { dusk } from '../src/lesson/dusk';
import { genericAltitude, genericNested, lengthsOf, propHolds, simValid, validOrders, hourglass, nested } from '../src/lesson/topics/similarity/sim';
import { BANK, makeProof, validOrder } from '../src/lesson/topics/similarity/proofs';
import { explain } from '../src/lesson/topics/similarity/explain';
import { resultOf } from '../src/lesson/runtime/explain';

const TOPIC = { subgoals: [...new Map(["secondary-t6-22-similarity-criteria-and-applications"].flatMap(i => JSON.parse(fs.readFileSync(`../math-curriculum-essentials/topics/${i}.json`, 'utf8')).subgoals).map((s: { id: string }) => [s.id, s] as const)).values()] };
const CATALOG = new Set<string>(JSON.parse(fs.readFileSync('../math-curriculum-essentials/misconceptions.json', 'utf8')).misconceptions.map((m: { id: string }) => m.id));
const GEN = GENERATORS as Record<string, (R: () => number, n: number, sg?: string) => import('../src/lesson/runtime/item').Item>;

describe('similarity: plan', () => {
  it('walks through every sub-goal of the topic JSON, in order, each with a family', () => {
    expect(PLAN.map(p => p.id)).toEqual(TOPIC.subgoals.map((s: { id: string }) => s.id));
    for (const p of PLAN) { expect(p.families.length, p.id).toBeGreaterThan(0); for (const f of p.families) expect(GEN[f], f).toBeDefined(); }
  });
});

describe('similarity: families', () => {
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
const ITEMS: { f: string; sg: string; it: GFItem }[] = [];
for (const p of PLAN) for (const f of p.families) for (let s = 1; s <= 60; s++) ITEMS.push({ f, sg: p.id, it: GEN[f]!(rng(s * 7 + 3), s, p.id) as GFItem });
const figsOf = (it: GFItem): { fig: Fig; fr: import('../src/lesson/topics/geometry-foundations/geo').Frame }[] => {
  const p = it.picture; if (!p) return [];
  if (p.gallery) { const frs = galleryFrames(p.gallery.figs.length); return p.gallery.figs.map((fig, i) => ({ fig, fr: frs[i]! })); }
  return p.fig ? [{ fig: p.fig, fr: p.proof || p.card || p.cards ? FR_LEFT : FR_WIDE }] : [];
};

describe('similarity: voice', () => {
  it('every script line is voiced, and the spoken text has no digits or symbols', () => {
    const lines = JSON.parse(fs.readFileSync('pages/lessons/similarity/voice/lines.json', 'utf8')) as Record<string, { text: string }>;
    expect(Object.keys(lines).sort()).toEqual(Object.keys(SCRIPT).sort());
    for (const [k, v] of Object.entries(SCRIPT)) {
      expect(lines[k]!.text, k).toBe(v.say);
      expect(/[0-9=≅∠△°+−<>/~]/.test(v.say), `${k}: ${v.say}`).toBe(false);
    }
  });
});

describe('similarity: exact figures', () => {
  it('every practice picture lays out readably in the frame the page uses', () => {
    for (const { f, it } of ITEMS) for (const { fig, fr } of figsOf(it)) expect(figProblems(fig, fr), f).toEqual([]);
  });
  it('every numeric length label (and its solved value) is drawn at its length: one unit per figure and unit word', () => {
    for (const { f, it } of ITEMS) for (const { fig } of figsOf(it)) {
      const per = new Map<string, number[]>();
      for (const s of fig.segs) for (const t of [s.text, s.alt]) {
        const m = /^(\d+(?:\.\d+)?)\s*(ft|in|yd|cm)?$/.exec(t ?? '');
        if (!m) continue;
        const u = m[2] ?? '', L = dist(s.a, s.b);
        per.set(u, [...(per.get(u) ?? []), L / Number(m[1])]);
      }
      // inches are drawn in feet (a person 66 in tall is drawn 5.5 ft tall)
      const ft = per.get('ft'), inch = per.get('in');
      if (ft && inch) { per.set('ft', [...ft, ...inch.map(x => x * 12)]); per.delete('in'); }
      for (const [u, v] of per) expect(Math.max(...v) / Math.min(...v), `${f} ${u}: ${it.prompt}`).toBeLessThan(1 + 1e-6);
    }
  });
});

describe('similarity: statements and proportions', () => {
  it('a statement holds when the angles match vertex by vertex; an isosceles pair has two valid orders', () => {
    const P: Record<string, Pt> = { A: [0, 0], B: [4, 0], C: [2, 3], D: [10, 0], E: [18, 0], F: [14, 6] };
    expect(simValid(P, 'ABC', 'DEF')).toBe(true);
    expect(validOrders(P, 'ABC', 'DEF').sort()).toEqual(['DEF', 'EDF']);
  });
  it('the generic figures accept only the true proportions', () => {
    const N = lengthsOf(genericNested());
    expect(propHolds(N, ['AD', 'AB', 'DE', 'BC'])).toBe(true);
    expect(propHolds(N, ['AD', 'DB', 'AE', 'EC'])).toBe(true);
    expect(propHolds(N, ['AD', 'DB', 'DE', 'BC'])).toBe(false);
    const H = lengthsOf(genericAltitude());
    expect(propHolds(H, ['AD', 'CD', 'CD', 'DB'])).toBe(true);
    expect(propHolds(H, ['AD', 'AC', 'AC', 'AB'])).toBe(true);
    expect(propHolds(H, ['DB', 'AC', 'AC', 'AB'])).toBe(false);
  });
  it('the configurations are exact: nested DE ∥ BC, hourglass AB ∥ CD with EC = k·AE', () => {
    const P = nested(10, 12, 12.5, 0.4, 40);
    expect(Math.abs(dist(P.D!, P.E!) - 5 * 40)).toBeLessThan(1e-6);
    const Hg = hourglass(8, 6, 7, 1.5, 34);
    expect(Math.abs(dist(Hg.E!, Hg.C!) - 9 * 34)).toBeLessThan(1e-6);
    expect(Math.abs(dist(Hg.C!, Hg.D!) - 12 * 34)).toBeLessThan(1e-6);
    expect(Math.abs(dist(Hg.A!, Hg.B!) - 8 * 34)).toBeLessThan(1e-6);
  });
  it('statement choices: exactly the right one is valid on the drawn points (rotated, reflected, isosceles)', () => {
    for (const { f, it } of ITEMS.filter(x => ['stmtMarks', 'altStmt'].includes(x.f))) {
      const P = Object.fromEntries(it.picture!.fig!.points.map(p => [p.name, p.at])) as Record<string, Pt>;
      it.choices!.forEach((c, i) => {
        const m = /△(\w{3}) ~ △(\w{3})/.exec(c)!;
        expect(simValid(P, m[1]!, m[2]!), `${f}: ${c}`).toBe(it.check({ kind: 'choice', i }).ok);
      });
    }
  });
});

describe('similarity: proofs', () => {
  it('every bank proof is in a valid order and ends on its target', () => {
    for (const id of BANK) for (let s = 1; s <= 30; s++) {
      const p = makeProof(id, rng(s));
      expect(validOrder(p, p.rows.map((_, i) => i + 1)), id).toBe(true);
      expect(p.rows[p.rows.length - 1]!.st).toBe(p.prove);
    }
  });
  it('every practice proof builds in the proof frame, before and after the solve fills its cell', () => {
    for (const { f, it } of ITEMS.filter(x => x.it.picture?.proof)) {
      const pr = it.picture!.proof!;
      const fill = new Map((it.picture!.reveal?.fill ?? []).map(x => [x.i, x]));
      const solved = pr.rows.map((r, i) => ({ st: fill.get(i)?.st ?? r.st, rs: fill.get(i)?.rs ?? r.rs }));
      const fr = it.picture!.fig ? { x: FR_RIGHT.x, y: 60, w: FR_RIGHT.w, h: 960 } : { x: 260, y: 60, w: 1400, h: 960 };
      for (const rows of [pr.rows, solved]) expect(() => ProofFrame({ given: pr.given, prove: pr.prove, rows, pool: pr.pool, first: pr.first }, fr, dusk), `${f}`).not.toThrow();
    }
  });
});

describe('similarity: worked steps', () => {
  it('the steps card arrives at the item answer', () => {
    for (const { f, it } of ITEMS) {
      const ex = explain(it);
      const r = ex ? resultOf(it, ex.steps) : null;
      expect(r, `${f}: ${ex?.steps.join(' | ')}`).not.toBeNull();
      expect(it.check(r!).ok, `${f}: ${ex!.steps.join(' | ')}`).toBe(true);
    }
  });
});

describe('similarity: misconceptions', () => {
  it('the main slips are classified', () => {
    const seen = new Set<string>();
    for (const { it } of ITEMS) if (it.choices) it.choices.forEach((_, i) => { const mc = it.check({ kind: 'choice', i }).mc; if (mc) seen.add(mc); });
    for (const id of ['mc.angles.aa-compares-listed-angles-only', 'mc.transformations.ssa-accepted-as-criterion', 'mc.transformations.no-criterion-means-not-similar', 'mc.transformations.failed-search-proves-impossible', 'mc.transformations.statement-vertex-order-ignored', 'mc.transformations.matches-parts-by-position-or-letters', 'mc.transformations.part-segment-for-whole-side', 'mc.transformations.altitude-similarity-without-right-triangle', 'mc.transformations.altitude-hypotenuse-similarity-misapplied', 'mc.right-triangles-trig.arithmetic-not-geometric-mean', 'mc.geometric-proof.circular-reasoning', 'mc.geometric-proof.validity-judged-by-truth', 'mc.transformations.equal-angles-make-polygons-similar', 'mc.shapes.special-case-excluded-from-class', 'mc.geometric-proof.converse-assumed-true']) expect(seen.has(id), id).toBe(true);
  });
  it('typed slips are classified: part for whole, cross-paired shadows, the scale factor upside down', () => {
    const probe = (f: string, wrong: (it: GFItem) => number | null, mc: string) => {
      let hits = 0;
      for (const { it } of ITEMS.filter(x => x.f === f)) { const v = wrong(it); if (v === null) continue; const r = it.check(it.input === 'frac' ? { kind: 'frac', w: 0, n: v, d: 1 } : { kind: 'num', v }); if (r.mc === mc) hits++; }
      if (mc) expect(hits, `${f} ${mc}`).toBeGreaterThan(5);
    };
    const nums = (s: string) => [...s.replace(/<[^>]+>/g, ' ').matchAll(/\d+(?:\.\d+)?/g)].map(m => Number(m[0]));
    probe('shadow', it => { const n = nums(it.prompt); if (/inches/.test(it.prompt)) return null; return (n[0]! * n[1]!) / n[2]!; }, 'mc.ratio-rate.cross-pairs-objects-in-similarity-proportion');
    probe('kDirected', it => { const a = it.answer as { w: number; n: number; d: number }; const v = a.d === 1 ? a.w : a.n / a.d; return v === 1 ? null : 1 / v; }, '');
  });
});
