// lesson-pythagoras-intro: the generic checks (every family x every sub-goal it serves x 300 seeds). Add topic checks below.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { rng } from '../src/lesson/runtime/item';
import { GENERATORS } from '../src/lesson/topics/pythagoras-intro/items';
import { PLAN } from '../src/lesson/topics/pythagoras-intro/plan';
import { MC, GENERATORS as G2, type PyItem } from '../src/lesson/topics/pythagoras-intro/items';
import { TRIPLES, bracket, isTriple, polyArea, proofLeft, proofMiddle, proofTris, round1, rightPts, squareOn, sideLen2, tilted, triKind } from '../src/lesson/topics/pythagoras-intro/pythag';
import { LINES } from '../src/lesson/topics/pythagoras-intro/script';

const TOPIC = JSON.parse(fs.readFileSync('../math-curriculum-essentials/topics/primary.geometry.pythagorean-theorem-introduction.json', 'utf8'));
const CATALOG = new Set<string>(JSON.parse(fs.readFileSync('../math-curriculum-essentials/misconceptions.json', 'utf8')).misconceptions.map((m: { id: string }) => m.id));
const GEN = GENERATORS as Record<string, (R: () => number, n: number, sg?: string) => import('../src/lesson/runtime/item').Item>;

describe('pythagoras-intro: plan', () => {
  it('walks through every sub-goal of the topic JSON, in order, each with a family', () => {
    expect(PLAN.map(p => p.id)).toEqual(TOPIC.subgoals.map((s: { id: string }) => s.id));
    for (const p of PLAN) { expect(p.families.length, p.id).toBeGreaterThan(0); for (const f of p.families) expect(GEN[f], f).toBeDefined(); }
  });
});

describe('pythagoras-intro: families', () => {
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

// ---------- topic checks: the maths, the misconception probes, the voice ----------
const gen = (f: string, seed: number, sg?: string) => (G2 as Record<string, (R: () => number, n: number, sg?: string) => PyItem>)[f]!(rng(seed), seed, sg);

describe('pythagoras-intro: maths', () => {
  it('the topic triples are right triangles', () => { for (const [a, b, c] of TRIPLES) expect(isTriple(a, b, c)).toBe(true); });
  it('tilted squares: surround minus corners, the areas of the cases, cells touched', () => {
    const areas = [[1, 1], [1, 2], [1, 3], [2, 3], [3, 4]].map(([p, q]) => tilted(p!, q!).area);
    expect(areas).toEqual([2, 5, 10, 13, 25]);
    const t = tilted(1, 2);
    expect(t.surround - 4 * t.corner).toBe(5);
    expect(t.touched).toBeGreaterThan(t.area);
    expect(polyArea(t.pts)).toBe(5);
  });
  it('squares on sides: each square has the side squared as area; the 3-4-5 squares add up', () => {
    const [R, A, B] = rightPts(3, 4);
    const sa = squareOn(R, A, B), sb = squareOn(R, B, A), sc = squareOn(A, B, R);
    expect([polyArea(sa), polyArea(sb), polyArea(sc)]).toEqual([9, 16, 25]);
    expect(sideLen2(A, B)).toBe(25);
    // outward: the square on b lies below the x axis, the square on a left of the y axis
    expect(Math.max(...sb.map(p => p[1]))).toBe(0);
    expect(Math.max(...sa.map(p => p[0]))).toBe(0);
  });
  it('triangle kinds', () => {
    expect(triKind([[0, 0], [0, 3], [4, 0]])).toBe('right');
    expect(triKind([[-1, 2], [0, 0], [4, 0]])).toBe('obtuse');
    expect(triKind([[1, 3], [0, 0], [4, 0]])).toBe('acute');
  });
  it('the rearrangement proof: triangles only slide, the uncovered area is c² before and a² + b² after', () => {
    for (const [a, b] of [[2.7, 4.3], [3, 5], [1, 2]] as const) {
      const s = a + b;
      const before = proofTris(a, b), after = proofTris(a, b, [1, 1, 1, 1]);
      for (const x of [...before.map(polyArea), ...after.map(polyArea)]) expect(x).toBeCloseTo((a * b) / 2, 9);
      expect(polyArea(proofMiddle(a, b))).toBeCloseTo(a * a + b * b, 9);
      expect(s * s - 4 * (a * b) / 2).toBeCloseTo(a * a + b * b, 9);
      const { A: sqA, B: sqB } = proofLeft(a, b);
      expect(polyArea(sqA) + polyArea(sqB)).toBeCloseTo(a * a + b * b, 9);
      for (const t of after) for (const [x, y] of t) for (const v of [x, y]) { expect(v).toBeGreaterThanOrEqual(-1e-9); expect(v).toBeLessThanOrEqual(s + 1e-9); }
      // the middle square's sides are hypotenuses: all of length c
      const M = proofMiddle(a, b);
      for (let i = 0; i < 4; i++) expect(sideLen2(M[i]!, M[(i + 1) % 4]!)).toBeCloseTo(a * a + b * b, 9);
    }
  });
  it('brackets and rounding', () => {
    expect(bracket(50)).toEqual([7, 8]);
    expect(bracket(13)).toEqual([3, 4]);
    expect(round1(Math.sqrt(13))).toBe(3.6);
    expect(round1(Math.sqrt(288))).toBe(17);
  });
});

describe('pythagoras-intro: misconception probes', () => {
  it('every MC id is in the catalog', () => { for (const id of Object.values(MC)) expect(CATALOG.has(id), id).toBe(true); });
  const num = (it: PyItem, v: number) => it.check({ kind: 'num', v });
  it('hypotenuse: adding the legs, stopping at c², doubling', () => {
    for (let s = 1; s < 60; s++) {
      const it = gen('hypWhole', s, 'hypotenuse-whole');
      const m = /legs of a right triangle are <b class="a">(\d+) (\w+)<\/b> and <b class="b">(\d+)/.exec(it.prompt)!;
      const a = Number(m[1]), b = Number(m[3]);
      expect(num(it, a + b).mc).toBe(MC.addLengths);
      expect(num(it, a * a + b * b).mc).toBe(MC.noRoot);
      expect(num(it, 2 * a + 2 * b).mc).toBe(MC.timesTwo);
    }
  });
  it('missing leg: adding the squares, subtracting the lengths, stopping at the square', () => {
    let seen = 0;
    for (let s = 1; s < 80; s++) {
      const it = gen('missingLeg', s, 'missing-leg');
      const m = /hypotenuse <b class="s">(\d+) \w+<\/b> and one leg <b class="[ab]">(\d+)/.exec(it.prompt);
      if (!m) continue;
      const c = Number(m[1]), k = Number(m[2]);
      expect(num(it, round1(Math.sqrt(c * c + k * k))).mc).toBe(MC.legAdds);
      expect(num(it, c - k).mc).toBe(MC.addLengths);
      expect(num(it, c * c - k * k).mc).toBe(MC.noRoot);
      seen++;
    }
    expect(seen).toBeGreaterThan(40);
  });
  it('tilted square: counting touched cells is the bundle slip', () => {
    for (let s = 1; s < 40; s++) {
      const it = gen('tilted', s, 'tilted-square-area');
      const m = /goes (\d) across and (\d) up/.exec(it.prompt)!;
      const T = tilted(Number(m[1]), Number(m[2]));
      if (T.touched !== T.area) expect(num(it, T.touched).mc).toBe(MC.bundle);
    }
  });
  it('bracket: the squares instead of the roots', () => {
    for (let s = 1; s < 40; s++) {
      const it = gen('bracketRoot', s, 'side-from-area');
      const a = it.answer as { kind: 'pair'; x: number; y: number };
      expect(it.check({ kind: 'pair', x: a.x * a.x, y: a.y * a.y }).mc).toBe(MC.squaresBounds);
      expect(it.check({ kind: 'pair', x: a.y, y: a.x }).ok).toBe(false);
    }
  });
  it('choice families carry the topic misconceptions', () => {
    const want: Record<string, string[]> = {
      findHyp: [MC.visual], letterC: [MC.hypC], areaUnit: [MC.unitDim, MC.timesTwo, MC.areaPerim], meaning: [MC.triArea, MC.addLengths],
      nonRight: [MC.noRight], writeEq: [MC.unknownHyp, MC.knownLegHyp, MC.hypC], exactSide: [MC.halfRoot, MC.onlyWhole, MC.areaPerim],
      exactRoot: [MC.partByPart, MC.noRoot], contextHyp: [MC.roleSwap], subCheck: [MC.looksRight, MC.repeatSteps],
      sizeCheck: [MC.boundsOnly, MC.calcTrust], roundCheck: [MC.roundGap], proofStep: [MC.looksSquare, MC.examples, MC.triArea], eqTrue: [MC.afterEquals],
    };
    for (const [f, ids] of Object.entries(want)) {
      const got = new Set<string>();
      for (let s = 1; s < 300; s++) { const it = gen(f, s); it.choices!.forEach((_, i) => { const mc = it.check({ kind: 'choice', i }).mc; if (mc) got.add(mc); }); }
      for (const id of ids) expect(got.has(id), `${f}: ${id}`).toBe(true);
    }
  });
  it('story: the ladder role swap and the whole base of an isosceles triangle are classified', () => {
    const got = new Set<string>();
    for (let s = 1; s < 400; s++) {
      const it = gen('story', s, 'model-context');
      const lad = /A (\d+) ft ladder .* foot is (\d+) ft/.exec(it.prompt);
      if (lad) got.add(num(it, round1(Math.sqrt(Number(lad[1]) ** 2 + Number(lad[2]) ** 2))).mc ?? '');
      const iso = /two equal sides of (\d+) ft and a base of (\d+) ft/.exec(it.prompt);
      if (iso && Number(iso[1]) > Number(iso[2])) got.add(num(it, round1(Math.sqrt(Number(iso[1]) ** 2 - Number(iso[2]) ** 2))).mc ?? '');
    }
    expect(got.has(MC.roleSwap)).toBe(true);
    expect(got.has(MC.wholeNotHalf)).toBe(true);
  });
  it('mixed units: using the unconverted numbers is classified', () => {
    let seen = 0;
    for (let s = 1; s < 60; s++) {
      const it = gen('mixedUnits', s, 'unit-consistency');
      const m = /(\d+) (?:ft|yd)\b/.exec(it.prompt.replace(/<[^>]+>/g, ''));
      const m2 = /(\d+) (?:in|ft)<\/b>\./.exec(it.prompt) ?? /rises (\d+) /.exec(it.prompt);
      if (!m || !m2) continue;
      const raw = Number(m[1]) ** 2 + Number(m2[1]) ** 2;
      if (num(it, raw).mc) { expect(num(it, raw).mc).toBe(MC.unconverted); seen++; }
    }
    expect(seen).toBeGreaterThan(10);
  });
});

describe('pythagoras-intro: board TeX and pictures', () => {
  it('every board / step line keeps its backslashes, and most families show the model', () => {
    let withPic = 0, all = 0;
    for (const p of PLAN) for (const f of p.families) for (let s = 1; s <= 60; s++) {
      const it = gen(f, s, p.id);
      // the board, the worked steps and every TeX string a picture draws (side labels, area labels, square labels)
      const pic = it.picture?.pic as Record<string, unknown> | undefined;
      const picTex = pic ? [pic.ask, pic.root, ...Object.values((pic.labels ?? {}) as object), ...Object.values((pic.areas ?? {}) as object), ...((pic.verts ?? []) as string[])].filter((x): x is string => typeof x === 'string') : [];
      for (const t of [it.board, ...(it.steps ?? []), ...picTex]) {
        expect(t, `${f}: ${t}`).not.toMatch(/[\t\n\r\f\v\b]/);
        expect(t, `${f}: ${t}`).not.toMatch(/(^|[^\\a-z])(sqrt|overset|times|text|approx|ldots)\b/);
      }
      all++; if (it.picture) withPic++;
    }
    expect(withPic / all).toBeGreaterThan(0.75);
  });
});

describe('pythagoras-intro: voice', () => {
  it('lines.json holds the spoken text of every script line, written to be read aloud', () => {
    const lines = JSON.parse(fs.readFileSync('pages/lessons/pythagoras-intro/voice/lines.json', 'utf8')) as Record<string, { text: string }>;
    expect(Object.keys(lines).sort()).toEqual(Object.keys(LINES).sort());
    for (const [id, l] of Object.entries(LINES)) {
      expect(lines[id]?.text, id).toBe(l.say);
      expect(l.say, id).not.toMatch(/[0-9√²<>=+×−]/);
    }
  });
  it('every voiced id the page uses exists, and every line is used', () => {
    const page = fs.readFileSync('pages/lessons/pythagoras-intro.ts', 'utf8');
    const named = new Set([...page.matchAll(/['`]([qetp]\.[a-z0-9-]+)['`]/g)].map(m => m[1]!));
    for (const id of named) expect(LINES[id], id).toBeDefined();
    for (const id of Object.keys(LINES)) {
      const dyn = /^(e\.s\d|p\.c\d|t\.cb-|p\.no-)/.test(id);
      if (!dyn) expect(page.includes(`'${id}'`), `${id} is never shown`).toBe(true);
    }
  });
});
