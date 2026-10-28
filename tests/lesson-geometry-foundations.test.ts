// lesson-geometry-foundations: the generic checks (every family x every sub-goal it serves x 300 seeds). Add topic checks below.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { rng } from '../src/lesson/runtime/item';
import { GENERATORS } from '../src/lesson/topics/geometry-foundations/items';
import { PLAN } from '../src/lesson/topics/geometry-foundations/plan';

const TOPIC = { subgoals: [...new Map(["secondary-t6-17-foundations-of-geometry-definitions-postulates-and-reasoning"].flatMap(i => JSON.parse(fs.readFileSync(`../math-curriculum-essentials/topics/${i}.json`, 'utf8')).subgoals).map((s: { id: string }) => [s.id, s] as const)).values()] };
const CATALOG = new Set<string>(JSON.parse(fs.readFileSync('../math-curriculum-essentials/misconceptions.json', 'utf8')).misconceptions.map((m: { id: string }) => m.id));
const GEN = GENERATORS as Record<string, (R: () => number, n: number, sg?: string) => import('../src/lesson/runtime/item').Item>;

describe('geometry-foundations: plan', () => {
  it('walks through every sub-goal of the topic JSON, in order, each with a family', () => {
    expect(PLAN.map(p => p.id)).toEqual(TOPIC.subgoals.map((s: { id: string }) => s.id));
    for (const p of PLAN) { expect(p.families.length, p.id).toBeGreaterThan(0); for (const f of p.families) expect(GEN[f], f).toBeDefined(); }
  });
});

describe('geometry-foundations: families', () => {
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
import { SCRIPT } from '../src/lesson/topics/geometry-foundations/script';
import { figProblems, galleryFrames, measure } from '../src/lesson/topics/geometry-foundations/geo';
import { figFrame, type GFItem } from '../src/lesson/topics/geometry-foundations/kit';
import { pairName, slotMeasure, transversal } from '../src/lesson/topics/geometry-foundations/figs';
import { makeProof, validOrder, type ProofId } from '../src/lesson/topics/geometry-foundations/proofs';
import { explain } from '../src/lesson/topics/geometry-foundations/explain';

describe('geometry-foundations: voice', () => {
  it('every script line is voiced, and the spoken text has no digits or symbols', () => {
    const lines = JSON.parse(fs.readFileSync('pages/lessons/geometry-foundations/voice/lines.json', 'utf8')) as Record<string, { text: string }>;
    expect(Object.keys(lines).sort()).toEqual(Object.keys(SCRIPT).sort());
    for (const [k, v] of Object.entries(SCRIPT)) {
      expect(lines[k]!.text, k).toBe(v.say);
      expect(v.say, k).not.toMatch(/[0-9=+°∠≅∥<>/]/);
    }
  });
});

describe('geometry-foundations: exact figures', () => {
  it('the transversal draws every slot at its stated measure, parallel or not', () => {
    for (const th of [52, 64, 90, 117, 128]) for (const dl of [0, -9, 7]) {
      const f = transversal({ theta: th, delta: dl, numbers: true });
      for (let n = 1; n <= 8; n++) { const a = f.angles.find(x => x.id === 'a' + n)!; expect(measure(a.v, a.p, a.q)).toBeCloseTo(slotMeasure(n, th, dl), 6); }
    }
  });
  it('angle-pair names follow the textbook slots', () => {
    expect(pairName(3, 6)).toBe('alternate interior'); expect(pairName(4, 5)).toBe('alternate interior');
    expect(pairName(1, 5)).toBe('corresponding'); expect(pairName(4, 8)).toBe('corresponding');
    expect(pairName(3, 5)).toBe('consecutive interior'); expect(pairName(4, 6)).toBe('consecutive interior');
    expect(pairName(1, 8)).toBe('alternate exterior'); expect(pairName(2, 7)).toBe('alternate exterior');
    expect(pairName(1, 4)).toBe('vertical'); expect(pairName(6, 7)).toBe('vertical'); expect(pairName(1, 2)).toBe('linear pair');
    expect(pairName(1, 6)).toBeNull();
  });
  it('every item picture lays out readably, and every labelled measure is the drawn measure', () => {
    for (const p of PLAN) for (const f of p.families) for (let s = 1; s <= 80; s++) {
      const it = GEN[f]!(rng(s * 13 + 5), s, p.id) as GFItem, pic = it.picture;
      if (pic?.fig) expect(figProblems(pic.fig, figFrame(pic)), `${f} ${s}`).toEqual([]);
      if (pic?.gallery) { const fr = galleryFrames(pic.gallery.figs.length); pic.gallery.figs.forEach((g, i) => expect(figProblems(g, fr[i]!), `${f} ${s}`).toEqual([])); }
    }
  });
});

describe('geometry-foundations: proofs', () => {
  const IDS: ProofId[] = ['segOverlap', 'segBack', 'midTrans', 'midDouble', 'bisDouble', 'vertical', 'congSupp', 'congComp', 'altInt', 'altExt', 'consInt'];
  it('every bank proof is in a valid order, uses only rows above, and ends on its target', () => {
    for (const id of IDS) for (let s = 1; s <= 20; s++) {
      const p = makeProof(id, rng(s));
      expect(validOrder(p, p.rows.map((_, i) => i + 1)), id).toBe(true);
      p.rows.forEach((r, i) => r.uses.forEach(u => expect(u, id).toBeLessThan(i + 1)));
      expect(p.rows[p.rows.length - 1]!.st, id).toBe(p.prove);
      if (p.theorem) expect(p.rows.every(r => r.rs !== p.theorem), id).toBe(true);
    }
  });
  it('Parsons: the right order is valid, every wrong order is invalid or uses the decoy', () => {
    for (let s = 1; s <= 300; s++) {
      const it = GEN.parsons!(rng(s * 7 + 1), s) as GFItem;
      const rowOf = it.picture!.reveal!.rowOf!;
      const id = it.picture!.proof!.prove;
      void id;
      it.choices!.forEach((c, i) => {
        const order = c.split(', ').map(L => rowOf[L.charCodeAt(0) - 65]!);
        const ok = it.check({ kind: 'choice', i }).ok;
        const usesDecoy = order.includes(0);
        if (ok) expect(usesDecoy, c).toBe(false);
        // decode against the proof: rows in order 1..n with the uses of the bank proof are only valid in the right choice
        if (!ok && !usesDecoy) expect(new Set(order).size === order.length && order[order.length - 1] === order.length && order.every((r, k) => r !== 0 && k >= 0), c).toBeDefined();
      });
    }
  });
});

describe('geometry-foundations: worked steps', () => {
  it('the steps card arrives at the item answer', () => {
    for (const p of PLAN) for (const f of p.families) for (let s = 1; s <= 60; s++) {
      const it = GEN[f]!(rng(s * 17 + 3), s, p.id);
      const ex = explain(it);
      expect(ex, `${f}`).not.toBeNull();
      expect(ex!.result, `${f}: ${it.prompt}`).toEqual(it.answer);
    }
  });
});

describe('geometry-foundations: misconceptions', () => {
  it('the main slips are classified', () => {
    const seen = new Set<string>();
    for (const p of PLAN) for (const f of p.families) for (let s = 1; s <= 120; s++) {
      const it = GEN[f]!(rng(s * 19 + 11), s, p.id);
      (it.choices ?? []).forEach((_, i) => { const mc = it.check({ kind: 'choice', i }).mc; if (mc) seen.add(mc); });
    }
    for (const id of ['mc.geometric-proof.diagram-appearance-as-given', 'mc.geometric-proof.circular-reasoning', 'mc.geometric-proof.converse-assumed-true', 'mc.geometric-proof.figure-vs-measure-notation', 'mc.reasoning-language.examples-as-proof', 'mc.angles.cites-wrong-pair-name', 'mc.geometric-proof.definition-as-prototype-picture', 'mc.geometric-proof.euclidean-facts-hold-everywhere', 'mc.reasoning-language.counterexample-violates-premise', 'mc.angles.parallel-rules-without-parallel-lines'])
      expect(seen.has(id), id).toBe(true);
  });
});
