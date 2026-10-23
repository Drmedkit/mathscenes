// lesson-dilations-and-similarity: the generic checks (every family x every sub-goal it serves x 300 seeds). Add topic checks below.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { rng } from '../src/lesson/runtime/item';
import { GENERATORS } from '../src/lesson/topics/dilations-and-similarity/items';
import { PLAN } from '../src/lesson/topics/dilations-and-similarity/plan';

const TOPIC = JSON.parse(fs.readFileSync('../math-curriculum-essentials/topics/secondary-t5-36-dilations-and-similarity.json', 'utf8'));
const CATALOG = new Set<string>(JSON.parse(fs.readFileSync('../math-curriculum-essentials/misconceptions.json', 'utf8')).misconceptions.map((m: { id: string }) => m.id));
const GEN = GENERATORS as Record<string, (R: () => number, n: number, sg?: string) => import('../src/lesson/runtime/item').Item>;

describe('dilations-and-similarity: plan', () => {
  it('walks through every sub-goal of the topic JSON, in order, each with a family', () => {
    expect(PLAN.map(p => p.id)).toEqual(TOPIC.subgoals.map((s: { id: string }) => s.id));
    for (const p of PLAN) { expect(p.families.length, p.id).toBeGreaterThan(0); for (const f of p.families) expect(GEN[f], f).toBeDefined(); }
  });
});

describe('dilations-and-similarity: families', () => {
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

// ---------------------------------------------------------------- topic checks
import { MC } from '../src/lesson/topics/dilations-and-similarity/items';
import type { DItem } from '../src/lesson/topics/dilations-and-similarity/items';
import { LINES, toSay } from '../src/lesson/topics/dilations-and-similarity/script';
import { checkDilation, dilate, dilateAll, picProblem, simMap, simAt, similarAs, similarAny, sssSimilar, triAA, triSSS, angles, place, kk, kv, numH } from '../src/lesson/topics/dilations-and-similarity/dilMaths';

describe('dilations-and-similarity: maths', () => {
  it('a dilation puts P′ on ray CP at k times the distance', () => {
    expect(dilate([1, 4], [0, 0], 2)).toEqual([2, 8]);
    expect(dilate([5, 3], [1, 1], 3)).toEqual([13, 7]);
    expect(dilate([-6, 4], [0, 0], 0.5)).toEqual([-3, 2]);
    expect(() => checkDilation([[1, 2], [5, 2]], dilateAll([[1, 2], [5, 2]], [0, 0], 2), [0, 0], 2)).not.toThrow();
    expect(() => checkDilation([[1, 2]], [[3, 5]], [0, 0], 2)).toThrow();
  });
  it('similarity maps land every corner, AA triangles are similar, stretched copies are not', () => {
    const P = triAA(5, 50, 70), Q = place(P, { k: 1.5, rot: 120, flip: true, at: [20, 3] });
    const m = simMap(P, Q);
    P.forEach((p, i) => { const q = simAt(m, p, 1); expect(Math.hypot(q[0] - Q[i]![0], q[1] - Q[i]![1])).toBeLessThan(1e-6); });
    expect(similarAs(P, Q)).toBe(true);
    expect(angles(Q).map(Math.round)).toEqual([50, 70, 60]);
    expect(similarAny(triSSS(4, 5, 6), triSSS(12, 10, 8))).toBe(true);
    expect(sssSimilar([3, 4, 5], [5, 6, 7])).toBe(false);
    expect(sssSimilar([4, 5, 6], [10, 7.5, 12.5].sort())).toBe(false);
    expect(sssSimilar([4, 5, 6], [8, 10, 12])).toBe(true);
    expect(kv(kk(6, 4))).toBe(1.5);
    expect(numH(-4 / 3)).toContain('fr');
  });
});

describe('dilations-and-similarity: items', () => {
  const pairs = PLAN.flatMap(p => p.families.map(f => [f, p.id] as const));
  it('every misconception id the topic uses is in the catalog, and the topic JSON ones are covered', () => {
    for (const id of Object.values(MC)) expect(CATALOG.has(id), id).toBe(true);
    const all = new Set<string>(TOPIC.subgoals.flatMap((s: { misconceptions: string[] }) => s.misconceptions));
    for (const id of all) expect(Object.values(MC) as string[], id).toContain(id);
  });
  it('every item has a picture the painter can draw, a board line and a worked solution', () => {
    for (const [f, sg] of pairs) for (let s = 1; s <= 120; s++) {
      const it = GEN[f]!(rng(s * 53 + 11), s, sg) as unknown as DItem;
      expect(picProblem(it.picture), `${f}/${sg}/${s}`).toBeNull();
      expect(it.solution.length, f).toBeGreaterThan(0);
      expect(it.board.length, f).toBeGreaterThan(0);
      expect(it.prompt, f).not.toMatch(/undefined|NaN|\[object/);
      for (const c of it.choices ?? []) expect(c, f).not.toMatch(/undefined|NaN/);
      // no answer on the picture before the solve: asks show '?', hidden figures stay hidden
      for (const fg of it.picture.figs) if (fg.ask) expect(fg.ask.ans.length).toBeGreaterThan(0);
    }
  });
  const probe = (f: string, sg: string, r: (it: DItem) => import('../src/lesson/runtime/item').Response | null, mc: string) => {
    let seen = 0;
    for (let s = 1; s <= 200; s++) {
      const it = GEN[f]!(rng(s * 7 + 1), s, sg) as unknown as DItem;
      const resp = r(it);
      if (!resp) continue;
      const v = it.check(resp);
      if (!v.ok && v.mc === mc) seen++;
    }
    expect(seen, `${f} -> ${mc}`).toBeGreaterThan(10);
  };
  it('classifies the main slips', () => {
    // multiplying the coordinates when the center is not the origin
    probe('dilPoint', 'dilation-center-ray', it => {
      const p = it.prompt.match(/land\?/) ? it.prompt : ''; void p;
      const a = it.answer as { x: number; y: number }; const D = it.picture.dil!; const F = it.picture.figs[0]!.pts;
      const i = F.findIndex(q => Math.abs(D.c[0] + kv(D.k) * (q[0] - D.c[0]) - a.x) < 1e-9 && Math.abs(D.c[1] + kv(D.k) * (q[1] - D.c[1]) - a.y) < 1e-9);
      return i < 0 ? null : { kind: 'pair', x: kv(D.k) * F[i]![0], y: kv(D.k) * F[i]![1] };
    }, MC.ignored);
    // dropping the sign in the coordinate rule
    probe('ruleImage', 'coordinate-dilation-origin', it => (it.input === 'pair' ? { kind: 'pair', x: Math.abs((it.answer as { x: number }).x), y: Math.abs((it.answer as { y: number }).y) } : null), MC.sign);
    // multiplying angles by k
    probe('angleKeep', 'angle-invariance', it => { const m = it.board.match(/k = (\\tfrac\{(\d+)\}\{(\d+)\}|\d+)/)!; const k = m[2] ? Number(m[2]) / Number(m[3]) : Number(m[1]); return { kind: 'num', v: (it.answer as { v: number }).v * k }; }, MC.scalesAngles);
    // multiplying when going back to the original
    probe('lenK', 'inverse-missing-length', it => { const m = it.prompt.match(/= (\d+(?:\.\d+)?)\. How long/)!; const k = it.board.match(/k = (\\tfrac\{(\d+)\}\{(\d+)\}|[\d.]+)/)!; const kk2 = k[2] ? Number(k[2]) / Number(k[3]) : Number(k[1]); return { kind: 'num', v: Number(m[1]) * kk2 }; }, MC.wrongOp);
    // keeping the difference instead of the ratio
    probe('lenFig', 'forward-missing-length', it => { const n = [...it.prompt.matchAll(/= (\d+(?:\.\d+)?)/g)].map(x => Number(x[1])); return { kind: 'num', v: n[2]! + (n[1]! - n[0]!) }; }, MC.addKeep);
    // a choice family: picking the "equal angles" reason for rectangles
    probe('rectRhombus', 'identify-similar-polygons', it => { const i = (it.choices ?? []).findIndex(c => /all their angles are 90/.test(c)); return i < 0 ? null : { kind: 'choice', i }; }, MC.equalAngles);
  });
});

describe('dilations-and-similarity: voice', () => {
  it('lines.json has exactly the script ids, with the spoken text, and no digits or symbols are spoken', () => {
    const lines = JSON.parse(fs.readFileSync('pages/lessons/dilations-and-similarity/voice/lines.json', 'utf8')) as Record<string, { text: string }>;
    expect(Object.keys(lines).sort()).toEqual(Object.keys(LINES).sort());
    for (const [id, l] of Object.entries(LINES)) {
      expect(lines[id]!.text, id).toBe(l.say);
      expect(l.say, id).not.toMatch(/<|&|\d|′|″|△|→|−|×|÷|=|½|~|°/);
    }
    expect(toSay('C′ (−1, 5)')).toBe('C prime negative one, five');
  });
});

describe('dilations-and-similarity: quality layer regressions', () => {
  it('a marked point or "k = 2/3" reads as the answer on the steps card', async () => {
    const { explain } = await import('../src/lesson/topics/dilations-and-similarity/explain');
    const cases: [string, string][] = [['dilPoint', 'dilation-center-ray'], ['ruleImage', 'coordinate-dilation-origin'], ['simSeq', 'similarity-as-transformations'], ['ratioK', 'proportional-sides-common-ratio'], ['dilCenterOn', 'dilation-center-ray']];
    for (const [f, sg] of cases) for (let s = 1; s <= 80; s++) {
      const item = GEN[f]!(rng(s * 41 + 7), s, sg);
      const r = explain(item)!.result;
      expect(item.check(r).ok, `${f}: ${JSON.stringify(r)} for ${item.prompt}`).toBe(true);
    }
  });
  it('witnessPick: every step fits the card (200 characters)', async () => {
    const { plain } = await import('../src/lesson/runtime/item');
    for (let s = 1; s <= 200; s++) for (const l of GEN.witnessPick!(rng(s * 3 + 1), s, 'transformation-witness').solution) expect(plain(l).length).toBeLessThanOrEqual(200);
  });
});

describe('dilations-and-similarity: sweep regressions (oracle findings)', () => {
  it('rectangles similar when turned, AA with the angles at other corners, articles, ratios and real sizes: the oracle agrees', async () => {
    // @ts-expect-error: the oracle is an untyped .mjs module
    const O = (await import('./oracle/dilations-and-similarity.mjs')).default;
    // @ts-expect-error: an untyped .mjs module
    const { viewOf } = await import('../tools/quality/view.mjs');
    const fams: [string, string][] = [['rectRhombus', 'identify-similar-polygons'], ['rectRhombus', 'refute-universal-claim'], ['aaDecide', 'aa-apply'], ['allSimilar', 'refute-universal-claim'],
      ['ctxShadow', 'context-missing-length-units'], ['ctxMetric', 'context-missing-length-units'], ['resizeJudge', 'practical-resizing-claim']];
    for (const [f, sg] of fams) for (let s = 1; s <= 300; s++) {
      const it = GEN[f]!(rng(s * 19 + f.length), s, sg), q = viewOf(it, sg);
      expect(O.sane ? O.sane(q) : '', `${f}: ${it.prompt}`).toBe('');
      const want = O.solve(q);
      if (want !== undefined) expect(want, `${f}: ${it.prompt} | ${(it.choices ?? []).join(' | ')}`).toEqual(it.input === 'choice' ? (it.answer as { i: number }).i : (it.answer as { v: number }).v);
    }
  });
});
