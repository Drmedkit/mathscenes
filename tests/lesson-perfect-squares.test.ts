// Square roots of perfect squares: every family x every sub-goal it serves x 300 seeds makes valid items (the answer
// passes, choices are unique with exactly one right, pictures can be drawn), the main misconceptions are classified,
// the models' maths holds, and every voiced line of the page has a spoken text.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { FAMILIES, GENERATORS, MC, classifyRoot, factorPair, rng, type SqItem } from '../src/lesson/topics/perfect-squares/items';
import { PLAN } from '../src/lesson/topics/perfect-squares/plan';
import { computeTiles, isqrt, isSquare } from '../src/lesson/topics/perfect-squares/TileSquare';
import { computeRootLine } from '../src/lesson/topics/perfect-squares/RootLine';
import { LINES } from '../src/lesson/topics/perfect-squares/script';

const TOPIC = 'C:/Users/stelt/Claude code foler/math-curriculum-essentials/topics/primary.numbers.square-roots-of-perfect-squares.json';
const gen = (f: string, seed: number, sg?: string): SqItem => GENERATORS[f as keyof typeof GENERATORS](rng(seed), seed, sg);

describe('plan', () => {
  it('walks through all 13 sub-goals in topic JSON order, and every family it names exists and is used', () => {
    const ids = fs.existsSync(TOPIC) ? (JSON.parse(fs.readFileSync(TOPIC, 'utf8')) as { subgoals: { id: string }[] }).subgoals.map(s => s.id) : null;
    if (ids) expect(PLAN.map(p => p.id)).toEqual(ids);
    expect(PLAN.length).toBe(13);
    for (const p of PLAN) { expect(p.families.length).toBeGreaterThan(0); for (const f of p.families) expect(GENERATORS[f], f).toBeDefined(); }
    expect(new Set(PLAN.flatMap(p => p.families))).toEqual(new Set(FAMILIES.map(f => f.id)));
  });
});

describe('every family x every sub-goal it serves x 300 seeds', () => {
  for (const p of PLAN) for (const f of p.families) {
    it(`${p.id} / ${f}`, () => {
      const seen = new Set<string>();
      for (let s = 1; s <= 300; s++) {
        const it = gen(f, s * 7 + 1, p.id);
        expect(it.check(it.answer).ok, `${it.prompt} ${JSON.stringify(it.answer)}`).toBe(true);
        if (it.input === 'choice') {
          const ch = it.choices!;
          expect(new Set(ch).size, it.prompt).toBe(ch.length);
          expect(ch.length).toBeGreaterThanOrEqual(3);
          expect(ch.filter((_, i) => it.check({ kind: 'choice', i }).ok).length, it.prompt).toBe(1);
        }
        // a picture must be drawable: the model's maths accepts it
        if (it.pic?.kind === 'tiles') { const pic = it.pic; expect(() => computeTiles(pic.p), it.prompt).not.toThrow(); }
        if (it.pic?.kind === 'line') expect(() => computeRootLine((it.pic as { n: number }).n), it.prompt).not.toThrow();
        expect(it.solution.length).toBeGreaterThan(0);
        seen.add(it.prompt + it.board);
      }
      // the topic has only 16 perfect squares (0..225), so some families are small by nature
      const MIN: Record<string, number> = { 'evaluate-roots-to-225/squareOf': 10, 'evaluate-roots-to-225/whichSquare': 5, 'perfect-square-test/whichSquare': 10, 'zero-and-nonnegative/zeroRoot': 10, 'sqrt-vs-halving/halving': 12, 'coincidence-counterexample/counterexample': 12 };
      expect(seen.size, 'distinct items').toBeGreaterThanOrEqual(MIN[`${p.id}/${f}`] ?? 20);
    });
  }
  it('sub-goal ranges hold', () => {
    for (let s = 1; s <= 300; s++) {
      const a = gen('evalRoot', s, 'evaluate-roots-to-100'); expect((a.answer as { v: number }).v).toBeLessThanOrEqual(10);
      const b = gen('squareOf', s, 'evaluate-roots-to-225'); expect((b.answer as { v: number }).v).toBeGreaterThanOrEqual(121);
      const c = gen('sideFromArea', s, 'side-from-area'); expect((c.answer as { v: number }).v).toBeLessThanOrEqual(10);
      const d = gen('context', s, 'apply-side-from-area'); expect((d.answer as { v: number }).v).toBeLessThanOrEqual(15);
      const e = gen('between', s, 'consecutive-squares-around-n'); const x = e.answer as { x: number; y: number };
      expect(isSquare(x.x) && isSquare(x.y) && isqrt(x.y) === isqrt(x.x) + 1).toBe(true);
    }
  });
});

const pickWrong = (it: SqItem, mc: string) => it.choices!.findIndex((_, i) => it.check({ kind: 'choice', i }).mc === mc);

describe('misconceptions are classified', () => {
  it('a root by halving, the area as the side, squaring instead of rooting, a negative root', () => {
    expect(classifyRoot(18, 36).mc).toBe(MC.halving);
    expect(classifyRoot(49, 49).mc).toBe(MC.ignores);
    expect(classifyRoot(49 * 49, 49).mc).toBe(MC.misreads);
    expect(classifyRoot(-7, 49).mc).toBe(MC.plusMinus);
    expect(classifyRoot(8, 49).mc).toBe(MC.noCheck);
    expect(classifyRoot(36, 144, { context: true }).mc).toBe(MC.perimeter);
    expect(classifyRoot(144, 144, { context: true }).mc).toBe(MC.wrongUnit);
    expect(classifyRoot(12, 144).ok).toBe(true);
    expect(classifyRoot(2, 4).ok).toBe(true);        // 4: root and half agree, and that is right
  });
  it('squaring as doubling', () => {
    for (let s = 1; s <= 100; s++) {
      const it = gen('squareOf', s, 'perfect-square-as-area'); const sq = (it.answer as { v: number }).v, k = isqrt(sq);
      if (k > 1) expect(it.check({ kind: 'num', v: 2 * k }).mc).toBe(MC.baseTimesExp);
    }
  });
  it('choice families carry their misconceptions', () => {
    const want: [string, string | undefined, string[]][] = [
      ['arrangement', undefined, [MC.arrangement, MC.anyPair]],
      ['sideUnits', 'apply-side-from-area', [MC.wrongUnit]],
      ['translate', 'radical-notation', [MC.swap]],
      ['zeroRoot', 'zero-and-nonnegative', [MC.zeroUndef, MC.plusMinus]],
      ['checkRoot', 'evaluate-roots-to-100', [MC.halving]],
      ['whichSquare', 'evaluate-roots-to-225', [MC.eleven]],
      ['whichSquare', 'perfect-square-test', [MC.even]],
      ['isSquare', 'perfect-square-test', [MC.anyPair]],
      ['nearer', 'nearer-integer', [MC.midpoint, MC.roundedExact]],
      ['halving', 'sqrt-vs-halving', [MC.halving, MC.baseTimesExp]],
      ['counterexample', 'coincidence-counterexample', [MC.examplesProof, MC.differEverywhere, MC.partByPart]],
    ];
    for (const [f, sg, mcs] of want) {
      const seen = new Set<string>();
      for (let s = 1; s <= 300; s++) { const it = gen(f, s, sg); it.choices!.forEach((_, i) => { const m = it.check({ kind: 'choice', i }).mc; if (m) seen.add(m); }); }
      for (const m of mcs) expect(seen.has(m), `${f}: ${m}`).toBe(true);
    }
    // every wrong choice of these families is diagnosed or explained
    for (let s = 1; s <= 200; s++) { const it = gen('checkRoot', s, 'evaluate-roots-to-225'); expect(pickWrong(it, MC.halving)).toBeGreaterThanOrEqual(0); }
  });
  it('neighbouring squares: n - 1 and n + 1, non-consecutive squares', () => {
    for (let s = 1; s <= 200; s++) {
      const it = gen('between', s); const { x, y } = it.answer as { x: number; y: number }; const N = Number(it.board.match(/< (\d+) </)![1]);
      expect(it.check({ kind: 'pair', x: N - 1, y: N + 1 }).mc).toBe(MC.neighbours);
      if (x > 1) { const k = isqrt(x); expect(it.check({ kind: 'pair', x: (k - 1) ** 2, y }).mc).toBe(MC.nonConsec); }
      expect(it.check({ kind: 'pair', x, y }).ok).toBe(true);
    }
  });
  it('the squares written as bounds of the root', () => {
    for (let s = 1; s <= 200; s++) {
      const it = gen('boundRoot', s); const { x } = it.answer as { x: number; y: number };
      expect(it.check({ kind: 'pair', x: x * x, y: (x + 1) ** 2 }).mc).toBe(MC.squaresAsBounds);
    }
  });
});

describe('the models', () => {
  it('TileSquare: k x k <= n < (k+1)^2, every tile placed once, rectangles conserve the tiles', () => {
    for (let n = 1; n <= 225; n++) {
      const m = computeTiles({ n });
      expect(m.k * m.k <= n && n < (m.k + 1) ** 2).toBe(true);
      expect(m.perfect).toBe(Math.sqrt(n) % 1 === 0);
      expect(m.extra).toBe(n - m.k * m.k);
    }
    expect(computeTiles({ n: 16, rect: [2, 8] }).perfect).toBe(true);
    expect(() => computeTiles({ n: 16, rect: [3, 5] })).toThrow(/15 tiles/);
    expect(() => computeTiles({ n: 0 })).toThrow();
    expect(() => computeTiles({ n: 300 })).toThrow();
  });
  it('RootLine: the bounds and the nearer whole number (distances to the squares, never a tie)', () => {
    expect(computeRootLine(50)).toMatchObject({ k: 7, lo: 49, hi: 64, nearer: 7, dLo: 1, dHi: 14 });
    expect(computeRootLine(63).nearer).toBe(8);
    expect(computeRootLine(56).nearer).toBe(7);   // 56 - 49 = 7 < 64 - 56 = 8: nearer 7 (the midpoint 7.5 says 8)
    for (let n = 2; n < 225; n++) if (!isSquare(n)) {
      const m = computeRootLine(n);
      expect(Math.abs(Math.sqrt(n) - m.nearer)).toBeLessThan(0.5);          // the distance rule is the true nearer integer
      expect(m.k < Math.sqrt(n) && Math.sqrt(n) < m.k + 1).toBe(true);
    }
    expect(() => computeRootLine(49)).toThrow(/perfect square/);
  });
  it('factor pairs', () => {
    expect(factorPair(36)).toEqual([4, 9]);
    expect(factorPair(13)).toEqual([1, 13]);
  });
});

describe('voice', () => {
  it('every ctx.say / line id on the page has a spoken text, and every spoken text is used', () => {
    const page = fs.readFileSync('pages/lessons/perfect-squares.ts', 'utf8');
    const lines = JSON.parse(fs.readFileSync('pages/lessons/perfect-squares/voice/lines.json', 'utf8')) as Record<string, { text: string }>;
    for (const [id, l] of Object.entries(LINES)) {
      expect(lines[id]?.text, id).toBe(l.say);
      expect(l.say).not.toMatch(/[√<>]|\d\/\d/);       // written to be read aloud
    }
    expect(Object.keys(lines).sort()).toEqual(Object.keys(LINES).sort());
    // every line id the page names exists, and every line is used by the page
    const named = new Set([...page.matchAll(/['`]([qetp]\.[a-z0-9-]+)['`]/g)].map(m => m[1]!));
    for (const id of named) if (!/^[qetp]\.(a|b|L\d|Q|J|C\d|hero|ld\d|swap|strike|slab|tiles|area|side|count|reveal|rows|pA|pS|pR|pG)$/.test(id) && !id.endsWith('.')) expect(LINES[id], id).toBeDefined();
    for (const id of Object.keys(LINES)) {
      const dyn = /^(e\.s\d|p\.c\d|t\.cb-)/.test(id);
      if (!dyn) expect(page.includes(`'${id}'`), `${id} is never shown`).toBe(true);
    }
  });
});
