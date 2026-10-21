// rigid transformations (translations, reflections, rotations): every family x every sub-goal it serves x 300 seeds
// gives a valid item (the answer passes, choices unique with exactly one right, misconception ids exist, the picture
// lays out on the grid with its letters clear), the main misconceptions are classified, the plan covers every sub-goal
// of the topic JSON in order, the voice lines match the panel script, and the model's maths holds.
import { beforeAll, describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { rng, type Response } from '../src/lesson/runtime/item';
import { GENERATORS, FAMILY_NAMES, MC, type MotionItem } from '../src/lesson/topics/rigid-transformations/items';
import { PLAN } from '../src/lesson/topics/rigid-transformations/plan';
import { SCRIPT } from '../src/lesson/topics/rigid-transformations/script';
import { MotionGrid } from '../src/lesson/topics/rigid-transformations/MotionGrid';
import {
  type Motion, type V, angleAt, apply, applyAll, dist, eqV, identify, isRigid, keepsDistances, orient, parallel, collinear, rot, reflect,
} from '../src/lesson/topics/rigid-transformations/motionMaths';
import { frame } from '../src/blocks/block';

const TOPIC = 'C:/Users/stelt/Claude code foler/math-curriculum-essentials/topics/secondary-t5-34-transformations-translations-reflections-rotations.json';
const MCF = 'C:/Users/stelt/Claude code foler/math-curriculum-essentials/misconceptions.json';
const mcIds = existsSync(MCF) ? new Set((JSON.parse(readFileSync(MCF, 'utf8')) as { misconceptions: { id: string }[] }).misconceptions.map(m => m.id)) : null;
const MF = frame(60, 70, 940, 940);

// the canvas letters measure text with a 2D context; in node they fall back to an estimate (0.52 em per character)
beforeAll(() => { (globalThis as unknown as { document: unknown }).document = { createElement: () => ({ getContext: () => null }) }; });

const pairs = PLAN.flatMap(p => p.families.map(f => [f, p.id] as const));
const make = (f: string, sg: string, s: number): MotionItem => GENERATORS[f as keyof typeof GENERATORS](rng(s * 7919 + f.length), s, sg);
const pair = (x: number, y: number): Response => ({ kind: 'pair', x, y });
const num = (v: number): Response => ({ kind: 'num', v });

describe('plan', () => {
  it('covers every sub-goal of the topic JSON, in order, each with a family that exists', () => {
    if (existsSync(TOPIC)) {
      const t = JSON.parse(readFileSync(TOPIC, 'utf8')) as { subgoals: { id: string; order: number }[] };
      expect(PLAN.map(p => p.id)).toEqual([...t.subgoals].sort((a, b) => a.order - b.order).map(s => s.id));
    }
    for (const p of PLAN) {
      expect(p.families.length).toBeGreaterThan(0);
      for (const f of p.families) { expect(GENERATORS[f as keyof typeof GENERATORS], f).toBeTypeOf('function'); expect(FAMILY_NAMES[f], f).toBeTruthy(); }
    }
    expect(new Set(PLAN.flatMap(p => p.families))).toEqual(new Set(Object.keys(GENERATORS)));
  });
  it('every misconception id used exists in the catalogue', () => {
    if (mcIds) for (const id of Object.values(MC)) expect(mcIds.has(id), id).toBe(true);
  });
});

describe('voice', () => {
  it('every panel line of parts 1-4 has a spoken text, and every spoken text a panel line', () => {
    const lines = JSON.parse(readFileSync('pages/lessons/rigid-transformations/voice/lines.json', 'utf8')) as Record<string, { text: string }>;
    expect(Object.keys(lines).sort()).toEqual(Object.keys(SCRIPT).sort());
    for (const [id, l] of Object.entries(lines)) { expect(l.text.length, id).toBeGreaterThan(10); expect(l.text, id).not.toMatch(/\d\/\d|°|%|′|\(|\)|→/); }
    const page = readFileSync('pages/lessons/rigid-transformations.ts', 'utf8');
    for (const m of page.matchAll(/(?:say|fbk|ctx\.say)\((?:false, |true, |o\.ok, )?'([a-z.0-9]+)'/g)) expect(SCRIPT[m[1]!], m[1]).toBeTruthy();
  });
});

describe('item families', () => {
  for (const [f, sg] of pairs) {
    it(`${f} for ${sg}: 300 seeds, the answer passes, choices unique with one right, the picture lays out`, () => {
      const seen = new Set<string>();
      let pics = 0, clean = 0;
      for (let s = 1; s <= 300; s++) {
        const it = make(f, sg, s);
        expect(it.family).toBe(f);
        expect(it.check(it.answer).ok, `${it.prompt} ${JSON.stringify(it.answer)}`).toBe(true);
        expect(it.solution.length).toBeGreaterThan(0);
        for (const t of [it.prompt, it.board, it.work ?? '', ...it.solution, ...(it.choices ?? [])]) expect(t).not.toMatch(/undefined|NaN|Infinity|\t|null/);
        if (it.choices) {
          expect(new Set(it.choices).size, it.choices.join(' | ')).toBe(it.choices.length);
          const verdicts = it.choices.map((_, i) => it.check({ kind: 'choice', i }));
          expect(verdicts.filter(v => v.ok).length).toBe(1);
          if (mcIds) for (const v of verdicts) if (v.mc) expect(mcIds.has(v.mc), v.mc).toBe(true);
        }
        if (it.input === 'pair') {
          const a = it.answer as { x: number; y: number };
          expect(Number.isInteger(a.x) && Number.isInteger(a.y), it.id).toBe(true);
        }
        if (it.picture) {
          pics++;
          const g = MotionGrid(it.picture.grid, MF);
          if (g.clashes === 0) clean++;
        }
        seen.add(it.prompt + it.board + (it.choices ?? []).join());
      }
      if (pics) expect(clean / pics, `${clean} of ${pics} pictures have every letter clear`).toBeGreaterThanOrEqual(0.9);
      expect(seen.size).toBeGreaterThan(f === 'proof' ? 12 : 30);
    });
  }
});

/** a rough width of a TeX line in characters (the widest \\ row): the page fits 56 px TeX into 700 px on the board
 *  beside a picture (about 25 characters), or 70 px into 1180 px on the wide slate of a bare item (about 32) */
function texChars(src: string): number {
  const t = src.replace(/\\cssId\{[a-z]+\}/g, '').replace(/\\text\{([^}]*)\}/g, '$1').replace(/\\tfrac\{(\d+)\}\{(\d+)\}/g, '$1')
    .replace(/\^\\circ/g, 'o').replace(/\\(to|parallel|angle|triangle|approx|circlearrowleft|sqrt)/g, '#')
    .split('\\\\').join('\n').replace(/\\[,;: ]/g, ' ').replace(/[{}]/g, '');
  return Math.max(...t.split('\n').map(r => r.trim().replace(/ /g, '').length + 0.4 * (r.trim().match(/ /g) ?? []).length));
}
describe('the board fits', () => {
  it('board and work lines are short enough for the board', () => {
    const long: string[] = [];
    for (const [f, sg] of pairs) for (let s = 1; s <= 300; s++) {
      const it = make(f, sg, s), lim = it.picture ? 25 : 32;
      for (const t of [it.board, it.work ?? '']) if (texChars(t) > lim) long.push(`${f}: ${texChars(t).toFixed(1)} ${t}`);
    }
    expect([...new Set(long)].slice(0, 12)).toEqual([]);
  });
});

describe('misconceptions are diagnosed', () => {
  const each = (f: string, sg: string, test: (it: MotionItem) => void) => { for (let s = 1; s <= 300; s++) test(make(f, sg, s)); };
  const mcsOf = (f: string, sg: string) => {
    const m = new Set<string>();
    each(f, sg, it => it.choices?.forEach((_, i) => { const v = it.check({ kind: 'choice', i }); if (v.mc) m.add(v.mc); }));
    return m;
  };
  it('choice families carry their sub-goal misconceptions', () => {
    const want: [string, string, string[]][] = [
      ['match', 'correspondence', [MC.position]],
      ['nameT', 'recog-translation', [MC.anyMove, MC.gap]],
      ['isMirror', 'recog-reflection', [MC.oneCond, MC.notPerp]],
      ['nameR', 'recog-rotation', [MC.reverse, MC.wrongCenter]],
      ['order', 'orientation-test', [MC.rotRefl, MC.orientTrans]],
      ['howMany', 'nonuniqueness', [MC.oneMotion, MC.ignoreLabels]],
      ['slide', 'translate-grid', [MC.diagUnit]],
      ['turnAngle', 'rotate-any-angle', [MC.reverse, MC.ignoreDist, MC.atVertex]],
      ['straight', 'verify-lines', [MC.bend]],
      ['keepLen', 'verify-distance', [MC.unmatched, MC.sameMove]],
      ['keepAngle', 'verify-angle', [MC.armLength]],
      ['keepPar', 'verify-parallel', [MC.parallel]],
      ['rule180', 'coord-rotate-180', [MC.opposite]],
      ['predict', 'predict-measures', [MC.remeasure]],
      ['rigid', 'reject-nonrigid', [MC.partial, MC.sizeChange]],
      ['proof', 'evidence-vs-proof', [MC.examples]],
    ];
    for (const [f, sg, mcs] of want) { const got = mcsOf(f, sg); for (const m of mcs) expect(got.has(m), `${f}: ${m}`).toBe(true); }
  });
  it('coordinate rules: swap, wrong coordinate, axis rule, reversed turn, full turn, mixed signs', () => {
    each('ruleAx', 'coord-reflect-axes', it => {
      const a = it.answer as { x: number; y: number };
      if (a.x !== 0 && a.y !== 0) {
        // the answer changes one sign; the named-coordinate mistake changes the other one
        const named = pair(-a.x, -a.y);
        expect(it.check(named).mc, it.prompt).toBe(MC.negNamed);
      }
    });
    each('ruleLine', 'coord-reflect-parallel', it => {
      const m = /\(([−\d]+), ([−\d]+)\)/.exec(it.prompt.replace(/<[^>]+>/g, ''))!;
      const p: V = [Number(m[1]!.replace('−', '-')), Number(m[2]!.replace('−', '-'))];
      const vert = it.prompt.includes('x = ');
      const r = it.check(vert ? pair(-p[0], p[1]) : pair(p[0], -p[1]));
      const a = it.answer as { x: number; y: number };
      if (!(vert ? -p[0] === a.x : -p[1] === a.y)) expect(r.mc, it.prompt).toBe(MC.axisRule);
    });
    let swaps = 0, fulls = 0, offs = 0, revs = 0;
    each('rule90', 'coord-rotate-90', it => {
      const m = /P\(([−\d]+), ([−\d]+)\)/.exec(it.prompt.replace(/<[^>]+>/g, ''))!;
      const p: V = [Number(m[1]!.replace('−', '-')), Number(m[2]!.replace('−', '-'))];
      if (it.id.startsWith('rule90-360')) { fulls++; expect(it.check(pair(-p[1], p[0])).mc).toBe(MC.fullTurn); return; }
      const v = it.check(pair(p[1], p[0]));
      if (!v.ok) { swaps++; expect([MC.swap, MC.reverse, MC.axisRule]).toContain(v.mc); }   // a swap that equals the reversed turn keeps that tag
      if (it.id.startsWith('rule90-off')) offs++;
      if (it.id.startsWith('rule90-q')) { revs++; const deg = it.prompt.includes('counterclockwise') ? 90 : -90; expect(it.check(pair(...(rot(p, [0, 0], -deg) as [number, number]))).mc).toBe(MC.reverse); }
    });
    expect(swaps).toBeGreaterThan(100); expect(fulls).toBeGreaterThan(10); expect(offs).toBeGreaterThan(10); expect(revs).toBeGreaterThan(100);
    let mixed = 0, shifted = 0;
    // the wrong-coordinate and mixed-sign answers are recognised (P is read from the prompt)
    for (let s = 1; s <= 300; s++) {
      const it = make('ruleT', 'coord-translate', s);
      if (it.id.startsWith('ruleT-rev')) continue;
      const m = /P\(([−\d]+), ([−\d]+)\)/.exec(it.prompt.replace(/<[^>]+>/g, ''))!;
      const p: V = [Number(m[1]!.replace('−', '-')), Number(m[2]!.replace('−', '-'))];
      const q = it.answer as { x: number; y: number };
      const a = q.x - p[0], b = q.y - p[1];
      if (a !== b) { shifted++; expect(it.check(pair(p[0] + b, p[1] + a)).mc).toBe(MC.shiftWrong); }
      if (p[0] !== 0 && a !== 0 && Math.sign(p[0]) !== Math.sign(a)) {
        const w = pair(-(Math.abs(p[0]) + Math.abs(a)), p[1] !== 0 && b !== 0 && Math.sign(p[1]) !== Math.sign(b) ? -(Math.abs(p[1]) + Math.abs(b)) : p[1] + b);
        const v = it.check(w);
        if (!v.ok && v.mc) { mixed++; expect([MC.mixedSigns, MC.shiftWrong]).toContain(v.mc); }
      }
    }
    expect(shifted).toBeGreaterThan(100); expect(mixed).toBeGreaterThan(20);
  });
  it('grid execution: edge distance, wrong center, reversed turn, horizontal reflection, one anchor', () => {
    let edge = 0, center = 0, perp = 0, anchor = 0;
    for (let s = 1; s <= 300; s++) {
      const fg = make('flipGrid', 'reflect-grid-line', s);
      // try every grid point in the window: the misconception answers are those tagged
      const tags = new Set<string>();
      for (let x = -24; x <= 24; x++) for (let y = -24; y <= 24; y++) { const v = fg.check(pair(x, y)); if (v.mc) tags.add(v.mc); }
      if (tags.has(MC.edgeDist)) edge++;
      const tg = make('turnGrid', 'rotate-tracing', s);
      const t2 = new Set<string>();
      for (let x = -9; x <= 9; x++) for (let y = -9; y <= 9; y++) { const v = tg.check(pair(x, y)); if (v.mc) t2.add(v.mc); }
      if (t2.has(MC.wrongCenter)) center++;
      const fd = make('flipDiag', 'reflect-slanted-line', s);
      for (let x = -12; x <= 12; x++) for (let y = -12; y <= 12; y++) if (fd.check(pair(x, y)).mc === MC.notPerp) { perp++; x = 99; break; }
      const wh = make('whole', 'whole-figure', s);
      for (let x = -12; x <= 12; x++) for (let y = -12; y <= 12; y++) if (wh.check(pair(x, y)).mc === MC.oneAnchor) { anchor++; x = 99; break; }
    }
    expect(edge).toBeGreaterThan(250); expect(center).toBeGreaterThan(60); expect(perp).toBeGreaterThan(200); expect(anchor).toBeGreaterThan(120);
  });
  it('angles: the supplement is recognised', () => {
    let n = 0;
    for (let s = 1; s <= 300; s++) {
      const it = make('keepAngle', 'verify-angle', s);
      if (it.input !== 'num') continue;
      const a = (it.answer as { v: number }).v;
      expect(it.check(num(180 - a)).mc).toBe(MC.supplement); n++;
    }
    expect(n).toBeGreaterThan(100);
  });
});

describe('the model maths', () => {
  const R = rng(42);
  const ri = (lo: number, hi: number) => lo + Math.floor(R() * (hi - lo + 1));
  const tri = (): V[] => { for (;;) { const P: V[] = [[ri(-5, 5), ri(-5, 5)], [ri(-5, 5), ri(-5, 5)], [ri(-5, 5), ri(-5, 5)]]; if (Math.abs((P[1]![0] - P[0]![0]) * (P[2]![1] - P[0]![1]) - (P[1]![1] - P[0]![1]) * (P[2]![0] - P[0]![0])) > 2) return P; } };
  it('quarter turns and axis mirrors are exact and invertible', () => {
    for (let i = 0; i < 500; i++) {
      const p: V = [ri(-9, 9), ri(-9, 9)], c: V = [ri(-4, 4), ri(-4, 4)];
      for (const d of [90, 180, 270, -90]) { const q = rot(p, c, d); expect(Number.isInteger(q[0]) && Number.isInteger(q[1])).toBe(true); expect(eqV(rot(q, c, -d), p)).toBe(true); expect(dist(p, c)).toBeCloseTo(dist(q, c), 9); }
      expect(eqV(rot(rot(rot(rot(p, c, 90), c, 90), c, 90), c, 90), p)).toBe(true);           // four quarter turns: home
      expect(eqV(rot(rot(p, c, 90), c, 90), rot(p, c, -180))).toBe(true);                      // half turn either way
      expect(eqV(rot(p, [0, 0], 90), [-p[1], p[0]])).toBe(true);
      expect(eqV(reflect(p, [0, 0], [1, 0]), [p[0], -p[1]])).toBe(true);
      expect(eqV(reflect(p, [0, 0], [0, 1]), [-p[0], p[1]])).toBe(true);
      const h = ri(-4, 4);
      expect(eqV(reflect(p, [h, 0], [h, 1]), [2 * h - p[0], p[1]])).toBe(true);
      expect(eqV(reflect(reflect(p, [0, 1], [1, 2]), [0, 1], [1, 2]), p)).toBe(true);
    }
  });
  it('rigid motions keep distances, angles, straightness and parallels; flips reverse the order', () => {
    for (let i = 0; i < 300; i++) {
      const P = tri();
      const ms: Motion[] = [{ kind: 'T', a: ri(-5, 5), b: ri(-5, 5) }, { kind: 'R', c: [ri(-3, 3), ri(-3, 3)], deg: [90, -90, 180, 60, -45][i % 5]! }, { kind: 'M', p: [ri(-3, 3), 0], q: [ri(-3, 3), 4] }];
      for (const m of ms) {
        const Q = applyAll(m, P);
        expect(keepsDistances(P, Q)).toBe(true);
        for (let k = 0; k < 3; k++) expect(angleAt(Q, k)).toBeCloseTo(angleAt(P, k), 6);
        expect(orient(Q)).toBe(m.kind === 'M' ? -orient(P) : orient(P));
        const M: V = [(P[0]![0] * 2 + P[1]![0]) / 3, (P[0]![1] * 2 + P[1]![1]) / 3];
        expect(collinear(Q[0]!, Q[1]!, apply(m, M))).toBe(true);
        const D = [P[0]!, P[1]!, [P[2]![0] + 3, P[2]![1] + 1] as V, [P[2]![0] + 3 + P[1]![0] - P[0]![0], P[2]![1] + 1 + P[1]![1] - P[0]![1]] as V];
        const DQ = applyAll(m, D);
        expect(parallel(D[0]!, D[1]!, D[2]!, D[3]!)).toBe(true); expect(parallel(DQ[0]!, DQ[1]!, DQ[2]!, DQ[3]!)).toBe(true);
        // identify recovers a motion that maps P onto Q point by point
        const found = identify(P, Q);
        expect(found, JSON.stringify(m)).not.toBeNull();
        for (let k = 0; k < 3; k++) expect(eqV(apply(found!, P[k]!), Q[k]!, 1e-6)).toBe(true);
      }
    }
  });
  it('a stretch or a dilation is not rigid, and identify says so', () => {
    const P: V[] = [[1, 1], [3, 1], [1, 3]];
    for (const m of [{ kind: 'S', c: [0, 0], sx: 2, sy: 1 }, { kind: 'S', c: [0, 0], sx: 2, sy: 2 }] as Motion[]) {
      expect(isRigid(m)).toBe(false);
      expect(identify(P, applyAll(m, P))).toBeNull();
    }
    // Maya's rule keeps the right angle at A but doubles AB: the proof in part 4
    const Q = applyAll({ kind: 'S', c: [0, 0], sx: 2, sy: -1 }, P);
    expect(angleAt(Q, 0)).toBeCloseTo(90, 9); expect(dist(P[0]!, P[1]!)).toBe(2); expect(dist(Q[0]!, Q[1]!)).toBe(4);
  });
  it('the worked example and your turn: a half turn and a quarter turn about O', () => {
    const P: V[] = [[1, 1], [5, 1], [2, 3]], Q: V[] = [[-1, -1], [-5, -1], [-2, -3]];
    expect(identify(P, Q)).toEqual({ kind: 'R', c: [0, 0], deg: 180 });
    expect(orient(P)).toBe(1); expect(orient(Q)).toBe(1);
    const T: V[] = [[2, 1], [5, 1], [2, 3]];
    expect(applyAll({ kind: 'R', c: [0, 0], deg: 90 }, T)).toEqual([[-1, 2], [-1, 5], [-3, 2]]);
    expect(identify(T, [[-1, 2], [-1, 5], [-3, 2]])).toEqual({ kind: 'R', c: [0, 0], deg: 90 });
    expect(rot([4, -3], [0, 0], 90)).toEqual([3, 4]);
  });
});
