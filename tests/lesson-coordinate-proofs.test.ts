// lesson-coordinate-proofs: the generic checks (every family x every sub-goal it serves x 300 seeds) and the topic
// checks: the exact maths, the one choice helper (no secretly right distractor) probed over many seeds, the pictures
// (every plotted point at its stated coordinates, every plane builds on the kit Plane, the answer only in `reveal`),
// text rules, the misconceptions the families can diagnose, the voice lines and the check-in adapter.
import { beforeAll, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { rng } from '../src/lesson/runtime/item';
import { GENERATORS } from '../src/lesson/topics/coordinate-proofs/items';
import { PLAN } from '../src/lesson/topics/coordinate-proofs/plan';
import { explain } from '../src/lesson/topics/coordinate-proofs/explain';
import { PLACEMENT } from '../src/lesson/topics/coordinate-proofs/placement';
import { SCRIPT } from '../src/lesson/topics/coordinate-proofs/script';
import { MC, choice, type CItem, type PlanePic } from '../src/lesson/topics/coordinate-proofs/ckit';
import { area, d2, lineRel, mid, q, qclass, rad, radSum, radSumT, slope, triKind } from '../src/lesson/topics/coordinate-proofs/cg';
import { planeParams } from '../src/lesson/topics/coordinate-proofs/pic';

const TOPIC = { subgoals: [...new Map(["secondary-t6-24-coordinate-geometry-distance-midpoint-and-slope-proofs"].flatMap(i => JSON.parse(fs.readFileSync(`../math-curriculum-essentials/topics/${i}.json`, 'utf8')).subgoals).map((s: { id: string }) => [s.id, s] as const)).values()] };
const CATALOG = new Set<string>(JSON.parse(fs.readFileSync('../math-curriculum-essentials/misconceptions.json', 'utf8')).misconceptions.map((m: { id: string }) => m.id));
type V2 = readonly [number, number];
const GEN = GENERATORS as Record<string, (R: () => number, n: number, sg?: string) => CItem>;
const plain = (h: string) => h.replace(/<span class="fr"><span>([^<]*)<\/span><span>([^<]*)<\/span><\/span>/g, '$1/$2').replace(/<[^>]+>/g, '').replace(/&#8202;/g, ' ');
const each = (n: number, fn: (it: CItem, f: string, sg: string, s: number) => void) => { for (const p of PLAN) for (const f of p.families) for (let s = 1; s <= n; s++) fn(GEN[f]!(rng(s * 31 + 7), s, p.id), f, p.id, s); };

describe('coordinate-proofs: plan', () => {
  it('walks through every sub-goal of the topic JSON, in order, each with a family', () => {
    expect(PLAN.map(p => p.id)).toEqual(TOPIC.subgoals.map((s: { id: string }) => s.id));
    for (const p of PLAN) { expect(p.families.length, p.id).toBeGreaterThan(0); for (const f of p.families) expect(GEN[f], f).toBeDefined(); }
    expect(Object.keys(GENERATORS).length).toBeGreaterThanOrEqual(40);
  });
});

describe('coordinate-proofs: families', () => {
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
        seen.add([item.prompt, item.board, (item.choices ?? []).slice().sort().join('/'), (item.picture?.card?.lines ?? []).join('/'), JSON.stringify(item.answer)].join('|'));
      }
      expect(seen.size, 'distinct items').toBeGreaterThan(12);
    });
  }
});

describe('coordinate-proofs: maths', () => {
  it('radicals, sums of radicals, slopes, classes', () => {
    expect(rad(40)).toEqual({ k: 2, r: 10 }); expect(rad(72)).toEqual({ k: 6, r: 2 }); expect(rad(13)).toEqual({ k: 1, r: 13 }); expect(rad(49)).toEqual({ k: 7, r: 1 });
    expect(radSumT(radSum([36, 40, 40]))).toBe('6 + 4√10');
    expect(radSumT(radSum([8, 2, 18]))).toBe('6√2');
    expect(slope([1, 1], [7, 3])).toEqual(q(1, 3)); expect(slope([2, 1], [2, 5])).toBeNull(); expect(slope([0, 0], [1.5, 0.5])).toEqual(q(1, 3));
    expect(qclass([0, 0], [4, 0], [4, 3], [0, 3])).toBe('rectangle'); expect(qclass([0, 0], [3, 4], [8, 4], [5, 0])).toBe('rhombus');
    expect(qclass([0, 0], [2, 1], [1, 3], [-1, 2])).toBe('square'); expect(qclass([0, 0], [6, 0], [5, 3], [1, 3])).toBe('none');
    expect(triKind([1, 1], [7, 3], [5, 9])).toBe('right'); expect(triKind([0, 0], [6, 0], [1, 1])).toBe('obtuse');
    expect(lineRel([0, 0], [1, 2], [0, 1], [2, 5])).toBe('parallel'); expect(lineRel([0, 0], [1, 2], [2, 4], [3, 6])).toBe('same'); expect(lineRel([0, 0], [1, 2], [0, 0], [-2, 1])).toBe('perpendicular');
    expect(area([[0, 0], [4, 0], [0, 3]])).toBe(6);
    expect(mid([1, 1], [5, 9])).toEqual([3, 5]); expect(d2([3, 5], [7, 3])).toBe(20);
  });
});

describe('coordinate-proofs: no secretly right distractor', () => {
  it('the one choice helper drops a wrong option whose value key equals the right one', () => {
    const it0 = choice(rng(3), { id: 't', family: 't', prompt: 'p', board: 'b', solution: [] }, [
      { t: '−1', ok: true, key: '-1/1', say: '' }, { t: '−1 (opposite)', key: '-1/1', say: '' }, { t: '1', key: '1/1', say: '' }, { t: '2', key: '2/1', say: '' },
    ]);
    expect(it0.choices).not.toContain('−1 (opposite)');
  });
  it('over many seeds: every wrong choice of a slope item is a different number from the answer (slopes ±1 never doubled)', () => {
    const val = (t: string) => { const m = t.replace('−', '-').match(/^(-?\d+)(?:\/(\d+))?$/); return m ? Number(m[1]) / Number(m[2] ?? 1) : NaN; };
    for (const f of ['parSlope', 'perpSlope']) for (let s = 1; s <= 600; s++) {
      const it0 = GEN[f]!(rng(s), s);
      const r = (it0.answer as { i: number }).i, v = val(it0.choices![r]!);
      it0.choices!.forEach((c, i) => { if (i !== r) expect(Math.abs(val(c) - v) > 1e-9, `${f} ${it0.prompt} ${it0.choices}`).toBe(true); });
    }
  });
  it('perpTest never uses slope ±1 (opposite and negative reciprocal would coincide); its verdict is the geometry', () => {
    for (let s = 1; s <= 600; s++) {
      const it0 = GEN.perpTest!(rng(s), s), pts = it0.picture!.plane!.pts!.map(p => p.at);
      const m = slope(pts[0]!, pts[1]!)!;
      expect(Math.abs(m.n) === m.d, it0.prompt).toBe(false);
      const rel = lineRel(pts[0]!, pts[1]!, pts[2]!, pts[3]!);
      const right = plain(it0.choices![(it0.answer as { i: number }).i]!);
      expect(right.toLowerCase(), it0.prompt).toBe(rel === 'perpendicular' ? 'perpendicular' : rel === 'parallel' ? 'parallel' : 'neither');
    }
  });
  it('midpoints and missing endpoints never coincide with a given point', () => {
    for (const f of ['midPt', 'missEnd', 'midMix']) for (let s = 1; s <= 400; s++) {
      const it0 = GEN[f]!(rng(s), s, 'midpoint-fluent'), a = it0.answer as { x: number; y: number };
      for (const p of it0.picture!.plane!.pts!) expect(p.at[0] === a.x && p.at[1] === a.y, it0.prompt).toBe(false);
    }
  });
  it('claimProp: the right choice is the one property the coordinates prove (recomputed), never two at once', () => {
    for (let s = 1; s <= 600; s++) {
      const it0 = GEN.claimProp!(rng(s), s), [A, B, C, D] = it0.picture!.plane!.polys![0]!.pts as [V2, V2, V2, V2];
      const bis = mid(A, C)[0] === mid(B, D)[0] && mid(A, C)[1] === mid(B, D)[1];
      const perp = (A[0] - B[0]) * (C[0] - B[0]) + (A[1] - B[1]) * (C[1] - B[1]) === 0, cong = d2(A, B) === d2(B, C);
      expect([bis, perp, cong].filter(Boolean).length, it0.prompt).toBeLessThanOrEqual(1);
      const want = bis ? 'The diagonals AC and BD bisect each other' : perp ? 'AB ⊥ BC' : cong ? 'AB ≅ BC' : 'None of these';
      expect(plain(it0.choices![(it0.answer as { i: number }).i]!), it0.prompt).toBe(want);
    }
  });
  it('no polygon has three consecutive collinear vertices', () => {
    for (const f of ['perimExact', 'perimRound', 'sideDiag', 'closing', 'claimProp', 'areaRect', 'verdict', 'classify']) for (let s = 1; s <= 600; s++) {
      const it0 = GEN[f]!(rng(s), s), p = it0.picture!.plane!;
      for (const P of [...(p.polys ?? []), ...(p.reveal?.polys ?? [])].filter(x => x.key !== 'box').map(x => x.pts)) P.forEach((a, i) => {
        const b = P[(i + 1) % P.length]!, c = P[(i + 2) % P.length]!;
        expect((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]), `${f}: ${it0.prompt}`).not.toBe(0);
      });
    }
  });
  it('texts: no 0x term, real unit words, the example count asked is the count given; G is never a given point', () => {
    for (let s = 1; s <= 600; s++) {
      expect(/(^|[^\d.])0x/.test(plain(GEN.lineRel!(rng(s), s).prompt))).toBe(false);
      const pr = GEN.perimRound!(rng(s), s * 2).prompt;
      if (/grid unit/.test(pr)) expect(/1 (foot|yard|meter)\)/.test(pr), pr).toBe(true);
      const v = GEN.varyEx!(rng(s), 2 * s);
      if (/examples test/.test(v.prompt)) expect(/Which four examples/.test(v.prompt)).toBe(true);
      const w = GEN.wAvg!(rng(s), s), a = w.answer as { x: number; y: number };
      for (const p of w.picture!.plane!.pts!) expect(p.at[0] === a.x && p.at[1] === a.y, w.prompt).toBe(false);
    }
  });
  it('classify and verdict figures have exactly the class they are built as (a rhombus is never secretly a square)', () => {
    for (const f of ['classify', 'verdict']) for (let s = 1; s <= 400; s++) {
      const it0 = GEN[f]!(rng(s), s), Q = it0.picture!.plane!.polys![0]!.pts;
      const cls = qclass(Q[0]!, Q[1]!, Q[2]!, Q[3]!);
      if (f === 'classify') expect(plain(it0.choices![(it0.answer as { i: number }).i]!).toLowerCase(), it0.prompt).toBe(cls);
      else expect(['square', 'rectangle', 'rhombus', 'parallelogram']).toContain(cls);
    }
  });
});

describe('coordinate-proofs: pictures', () => {
  let Plane: typeof import('../src/lesson/kit/Plane').Plane;
  let FR: import('../src/blocks/block').Frame, dusk: import('../src/core/theme').Theme;
  beforeAll(async () => {
    (globalThis as unknown as { document: unknown }).document = { createElement: () => ({ getContext: () => null }) };
    ({ Plane } = await import('../src/lesson/kit/Plane'));
    FR = (await import('../src/blocks/block')).frame(60, 90, 960, 900);
    dusk = (await import('../src/lesson/dusk')).dusk;
  });
  it('every plane builds on the kit Plane, with and without the reveal layer', () => {
    each(60, (it0, f, _sg, s) => {
      const p = it0.picture?.plane;
      if (!p) return;
      try { Plane(planeParams(p, false), FR, dusk); Plane(planeParams(p, true), FR, dusk); } catch (e) { throw new Error(`${f} seed ${s}: ${(e as Error).message} | ${it0.prompt}`); }
    });
  });
  it('the points the prompt names sit at the stated coordinates; the answer point is never plotted before the solve', () => {
    each(60, (it0, f) => {
      const p = it0.picture?.plane as PlanePic | undefined;
      if (!p) return;
      const txt = plain(it0.prompt).replace(/−/g, '-');
      for (const pt0 of p.pts ?? []) {
        if (!pt0.name || pt0.name.length !== 1) continue;
        const m = txt.match(new RegExp(`(?:^|[^A-Za-z])${pt0.name}\\((-?[\\d.]+), (-?[\\d.]+)\\)`));
        if (m) expect([Number(m[1]), Number(m[2])], `${f}: ${pt0.name} in ${txt}`).toEqual([pt0.at[0], pt0.at[1]]);
      }
      if (it0.input === 'pair' && it0.pairOp === ',') {
        const a = it0.answer as { x: number; y: number };
        for (const pt0 of p.pts ?? []) expect(pt0.at[0] === a.x && pt0.at[1] === a.y, `${f}: answer plotted ${it0.prompt}`).toBe(false);
      }
    });
  });
});

describe('coordinate-proofs: text, steps, misconceptions', () => {
  it('no "+ −", no "1x", no double periods, no undefined values; steps 2-5 lines and end on the answer', () => {
    each(40, (it0, f) => {
      const texts = [plain(it0.prompt), it0.board, ...(it0.choices ?? []).map(plain), ...it0.solution.map(plain)];
      for (const t of texts) {
        expect(/\+\s*[-−]\s*\d/.test(t), `${f}: + − in ${t}`).toBe(false);
        expect(/(^|[^\d.])1x/.test(t), `${f}: 1x in ${t}`).toBe(false);
        expect(/\.\./.test(t), `${f}: .. in ${t}`).toBe(false);
        expect(/NaN|null|\[object/.test(t), `${f}: broken value in ${t}`).toBe(false);
      }
      const ex = explain(it0);
      expect(ex, `${f}: explain gives nothing`).not.toBeNull();
      expect(ex!.steps.length, `${f}: ${ex!.steps.length} steps`).toBeGreaterThanOrEqual(2);
      expect(ex!.steps.length, `${f}: ${ex!.steps.length} steps ${it0.prompt}`).toBeLessThanOrEqual(5);
      for (const st of ex!.steps) expect(plain(st).length, `${f}: long step ${plain(st)}`).toBeLessThanOrEqual(200);
      expect(it0.check(ex!.result).ok, `${f}: steps end in ${JSON.stringify(ex!.result)} ${it0.prompt}`).toBe(true);
    });
  });
  it('the families diagnose the topic\'s misconceptions', () => {
    const seen = new Set<string>();
    each(60, it0 => {
      if (it0.choices) it0.choices.forEach((_, i) => { const mc = it0.check({ kind: 'choice', i }).mc; if (mc) seen.add(mc); });
    });
    for (const id of Object.values(MC)) expect(CATALOG.has(id), id).toBe(true);
    for (const id of [MC.looseMid, MC.onSegMid, MC.recipBis, MC.rounding, MC.decRad, MC.diagWords, MC.zeroK, MC.infinity, MC.eqDistinct, MC.perpOpp, MC.perpRecip, MC.axisRule,
      MC.oneTest, MC.diagSides, MC.closing, MC.noClaim, MC.appearance, MC.addRad, MC.necSuff, MC.skipsRight, MC.someConds, MC.excluded, MC.longest, MC.upHier, MC.rejectsProof,
      MC.examples, MC.cxPremise, MC.cxException, MC.letters, MC.drawnCase, MC.kept, MC.special, MC.cancels, MC.sameLook, MC.numbersIn, MC.iff, MC.divisor, MC.vertSkip]) expect(seen.has(id), id).toBe(true);
  });
  it('typed slips are classified', () => {
    const it0 = GEN.missEnd!(rng(5), 1);
    const P = it0.picture!.plane!.pts!, A = P[0]!.at, M = P[1]!.at;
    expect(it0.check({ kind: 'pair', x: (A[0] + M[0]) / 2, y: (A[1] + M[1]) / 2 }).mc).toBe(MC.endAvg);
    const m0 = GEN.midPt!(rng(9), 1), Q = m0.picture!.plane!.pts!.map(p => p.at);
    if (!(Q[0]![0] === 0 && Q[0]![1] === 0)) expect(m0.check({ kind: 'pair', x: (Q[1]![0] - Q[0]![0]) / 2, y: (Q[1]![1] - Q[0]![1]) / 2 }).mc).toBe(MC.halfDiff);
  });
});

describe('coordinate-proofs: voice and check-in', () => {
  it('lines.json speaks every script line, with no digits or symbols', () => {
    const lines = JSON.parse(fs.readFileSync('pages/lessons/coordinate-proofs/voice/lines.json', 'utf8')) as Record<string, { text: string }>;
    expect(Object.keys(lines).sort()).toEqual(Object.keys(SCRIPT).sort());
    for (const [k, v] of Object.entries(SCRIPT)) { expect(lines[k]!.text, k).toBe(v.say); expect(/[0-9=+√²−]/.test(v.say), k).toBe(false); }
  });
  it('the check-in picks exist and their items stand alone', () => {
    for (const p of PLACEMENT.picks) {
      expect(PLAN.find(x => x.id === p.subgoal)?.families, p.subgoal).toContain(p.family);
      for (let s = 1; s <= 50; s++) { const it0 = GEN[p.family]!(rng(s), s, p.subgoal); expect(/\(-?[\d.]|\(−/.test(plain(it0.prompt)), it0.prompt).toBe(true); }
    }
  });
});
