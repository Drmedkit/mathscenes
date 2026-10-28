// lesson-constructions: the generic checks (every family x every sub-goal it serves x 300 seeds). Add topic checks below.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { rng } from '../src/lesson/runtime/item';
import { GENERATORS } from '../src/lesson/topics/constructions/items';
import { PLAN } from '../src/lesson/topics/constructions/plan';

const TOPIC = { subgoals: [...new Map(["secondary-t6-35-geometric-constructions", "secondary.geometric-constructions"].flatMap(i => JSON.parse(fs.readFileSync(`../math-curriculum-essentials/topics/${i}.json`, 'utf8')).subgoals).map((s: { id: string }) => [s.id, s] as const)).values()] };
const CATALOG = new Set<string>(JSON.parse(fs.readFileSync('../math-curriculum-essentials/misconceptions.json', 'utf8')).misconceptions.map((m: { id: string }) => m.id));
const GEN = GENERATORS as Record<string, (R: () => number, n: number, sg?: string) => import('../src/lesson/runtime/item').Item>;

describe('constructions: plan', () => {
  it('walks through every sub-goal of the topic JSON, in order, each with a family', () => {
    expect(PLAN.map(p => p.id)).toEqual(TOPIC.subgoals.map((s: { id: string }) => s.id));
    for (const p of PLAN) { expect(p.families.length, p.id).toBeGreaterThan(0); for (const f of p.families) expect(GEN[f], f).toBeDefined(); }
  });
});

describe('constructions: families', () => {
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
import { SCRIPT } from '../src/lesson/topics/constructions/script';
import { type Cons, angleBis, canDo, copyAngle, copySeg, equilateral, hexagon, isLegal, lineAngle, parallelCorr, parallelPerp, perpAt, perpBis, perpFrom, square, validOrder } from '../src/lesson/topics/constructions/cons';
import { dist, measure } from '../src/lesson/topics/geometry-foundations/geo';
import type { CItem } from '../src/lesson/topics/constructions/ckit';

describe('constructions: voice', () => {
  it('every script line is voiced, and the spoken text has no digits or symbols', () => {
    const lines = JSON.parse(fs.readFileSync('pages/lessons/constructions/voice/lines.json', 'utf8')) as Record<string, { text: string }>;
    expect(Object.keys(lines).sort()).toEqual(Object.keys(SCRIPT).sort());
    for (const [k, v] of Object.entries(SCRIPT)) {
      expect(lines[k]!.text, k).toBe(v.say);
      expect(/[0-9=≅∠△°+−<>/]/.test(v.say), `${k}: ${v.say}`).toBe(false);
    }
  });
});

const P = (c: Cons, i: number) => c.pts[i]!.at;
describe('constructions: the maths of every construction (200 seeds each)', () => {
  it('each construction does what it claims, exactly', () => {
    for (let s = 1; s <= 200; s++) {
      const R = rng(s);
      const pb = perpBis(R);   // A B P Q M
      expect(Math.abs(dist(P(pb, 0), P(pb, 4)) - dist(P(pb, 1), P(pb, 4)))).toBeLessThan(1e-6);
      expect(Math.abs(measure(P(pb, 4), P(pb, 0), P(pb, 2)) - 90)).toBeLessThan(1e-6);
      const ab = angleBis(R);   // O A B X
      expect(Math.abs(measure(P(ab, 0), P(ab, 1), P(ab, 3)) - measure(P(ab, 0), P(ab, 2), P(ab, 3)))).toBeLessThan(1e-6);
      const ca = copyAngle(R);   // O A B O2 A2 B2
      expect(Math.abs(measure(P(ca, 0), P(ca, 1), P(ca, 2)) - measure(P(ca, 3), P(ca, 4), P(ca, 5)))).toBeLessThan(1e-6);
      const cs = copySeg(R, { twice: true });   // A B C D E
      expect(Math.abs(dist(P(cs, 2), P(cs, 4)) - 2 * dist(P(cs, 0), P(cs, 1)))).toBeLessThan(1e-6);
      const eq = equilateral(R);
      expect(Math.abs(dist(P(eq, 0), P(eq, 2)) - dist(P(eq, 0), P(eq, 1)))).toBeLessThan(1e-6);
      expect(Math.abs(dist(P(eq, 1), P(eq, 2)) - dist(P(eq, 0), P(eq, 1)))).toBeLessThan(1e-6);
      const pa = perpAt(R), la = pa.steps.find(x => x.id === 'line')!.lines[0]!;
      expect(Math.abs(lineAngle(pa.given[0]!.a, pa.given[0]!.b, la.a, la.b) - 90)).toBeLessThan(1e-6);
      const pf = perpFrom(R), lf = pf.steps.find(x => x.id === 'line')!.lines[0]!;
      expect(Math.abs(lineAngle(pf.given[0]!.a, pf.given[0]!.b, lf.a, lf.b) - 90)).toBeLessThan(1e-6);
      const pp = parallelPerp(R), ln = pp.steps.find(x => x.id === 'n')!.lines[0]!;
      expect(lineAngle(pp.given[0]!.a, pp.given[0]!.b, ln.a, ln.b)).toBeLessThan(1e-6);
      const pc = parallelCorr(R), lc = pc.steps.find(x => x.id === 'line')!.lines[0]!;
      expect(lineAngle(pc.given[0]!.a, pc.given[0]!.b, lc.a, lc.b)).toBeLessThan(1e-6);
      const pw = parallelCorr(R, { wrongSide: true }), lw = pw.steps.find(x => x.id === 'line')!.lines[0]!;
      expect(lineAngle(pw.given[0]!.a, pw.given[0]!.b, lw.a, lw.b)).toBeGreaterThan(5);
      const hx = hexagon(R);   // the sixth chord closes: V5 to V0 is one radius
      expect(Math.abs(dist(P(hx, 6), P(hx, 1)) - dist(P(hx, 0), P(hx, 1)))).toBeLessThan(1e-6);
      const sq = square(R);   // O A C B D
      expect(Math.abs(measure(P(sq, 0), P(sq, 1), P(sq, 3)) - 90)).toBeLessThan(1e-6);
      for (const c of [pb, ab, ca, cs, eq, pa, pf, pp, pc, hx, sq]) expect(validOrder(c, c.steps.map(x => x.id)), c.kind).toBe(true);
    }
  });
  it('flawed versions really fail', () => {
    for (let s = 1; s <= 200; s++) {
      const R = rng(s);
      const pb = perpBis(R, { w: 230, wB: 270 });
      expect(Math.abs(dist(P(pb, 0), P(pb, 4)) - dist(P(pb, 1), P(pb, 4)))).toBeGreaterThan(1);
      const pa = perpAt(R, { off: true }), la = pa.steps.find(x => x.id === 'line')!.lines[0]!;
      expect(Math.abs(lineAngle(pa.given[0]!.a, pa.given[0]!.b, la.a, la.b) - 90)).toBeGreaterThan(2);
    }
  });
});

describe('constructions: the generic families against the drawn construction', () => {
  const each = (fam: string, sgs: string[], f: (it: CItem) => void) => { for (const sg of sgs) for (let s = 1; s <= 200; s++) f(GEN[fam]!(rng(s * 13 + 5), s, sg) as CItem); };
  it('orderSteps: exactly the right choice is a valid order of the card steps', () => {
    each('orderSteps', ['copy-segment', 'equilateral-triangle', 'perp-bisector-construct', 'angle-bisector-construct', 'perp-through-point-on-line', 'perp-through-point-off-line', 'copy-angle', 'parallel-through-point'], it => {
      const c = it.picture!.cons!.c, ids = it.picture!.stepIds!;
      const valid = it.choices!.map(t => validOrder(c, t.split(', ').map(l => ids['abcdefgh'.indexOf(l)]!)));
      expect(valid.filter(Boolean).length, it.prompt).toBe(1);
      expect(valid[(it.answer as { i: number }).i]).toBe(true);
    });
  });
  it('nextStep: the right step can come next, no wrong choice is a legal next step of the construction', () => {
    each('nextStep', ['compass-transfer', 'angle-bisector-construct', 'parallel-corresponding-angle', 'perpendicular-bisector', 'perp-on-line', 'perp-off-line'], it => {
      const pc = it.picture!.cons!, c = pc.c, done = new Set(c.steps.slice(0, pc.upto).map(x => x.id));
      const nexts = c.steps.filter(x => canDo(c, x, done) && isLegal(x.tool)).map(x => x.text);
      const ai = (it.answer as { i: number }).i;
      expect(nexts).toContain(it.choices![ai]);
      it.choices!.forEach((t, i) => { if (i !== ai) expect(nexts.includes(t), t).toBe(false); });
    });
  });
  it('spotFake: exactly one card step measures or guesses, and it is the answer', () => {
    each('spotFake', ['construction-rules', 'perp-bisector-construct', 'inscribed-regular-polygons', 'angle-bisector', 'parallel-through-point'], it => {
      const c = it.picture!.cons!.c;
      const fakes = c.steps.map((x, i) => (isLegal(x.tool) ? -1 : i)).filter(i => i >= 0);
      expect(fakes.length).toBe(1);
      expect((it.answer as { i: number }).i).toBe(fakes[0]);
    });
  });
});
