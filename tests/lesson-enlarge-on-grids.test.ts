// lesson-enlarge-on-grids: every family x every sub-goal it serves x 300 seeds gives a valid item (the answer passes,
// choices unique with exactly one right, every misconception id exists and the typical wrong answers are classified),
// pictures are honest and readable (and most items keep theirs); the plan covers every sub-goal in order; the walk
// maths holds; the lesson pictures build; every voiced line is in voice/lines.json with the same spoken text.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { rng, type Item } from '../src/lesson/runtime/item';
import { FAMILY_NAMES, GENERATORS, MC, PF, PROBES, type GridItem } from '../src/lesson/topics/enlarge-on-grids/items';
import { PLAN } from '../src/lesson/topics/enlarge-on-grids/plan';
import { closes, factors, house, isWalkCopy, moveTex, moveWords, runWalk, scaleMoves, tri, walkOf, walkPic } from '../src/lesson/topics/enlarge-on-grids/walkMaths';
import { HOUSE, LESSON_FRAME, SAIL, SQUARES } from '../src/lesson/topics/enlarge-on-grids/lessonPics';
import { ell, layoutPic, picMaths, rect, scale, stretch } from '../src/lesson/topics/scale-factor/scaleMaths';
import { SCRIPT } from '../src/lesson/topics/enlarge-on-grids/script';

const TOPIC = JSON.parse(fs.readFileSync('../math-curriculum-essentials/topics/primary.geometry.enlarge-reduce-shapes-informal.json', 'utf8'));
const CATALOG = new Set<string>(JSON.parse(fs.readFileSync('../math-curriculum-essentials/misconceptions.json', 'utf8')).misconceptions.map((m: { id: string }) => m.id));
const GEN = GENERATORS as Record<string, (R: () => number, n: number, sg?: string) => Item>;
/** families whose pictures may be dropped more often (big copies) */
const PIC_MIN: Record<string, number> = { twoFactors: 0.7, factorPair: 0.7, missingDim: 0.75 };

describe('enlarge-on-grids: plan', () => {
  it('walks through every sub-goal of the topic JSON, in order, each with a family', () => {
    expect(PLAN.map(p => p.id)).toEqual(TOPIC.subgoals.map((s: { id: string }) => s.id));
    for (const p of PLAN) { expect(p.families.length, p.id).toBeGreaterThan(0); for (const f of p.families) { expect(GEN[f], f).toBeDefined(); expect(FAMILY_NAMES[f as keyof typeof FAMILY_NAMES], f).toBeTruthy(); } }
    expect(new Set(PLAN.flatMap(p => p.families))).toEqual(new Set(Object.keys(GENERATORS)));
  });
  it('every misconception id the classifier uses is in the catalog', () => {
    for (const id of Object.values(MC)) expect(CATALOG.has(id), id).toBe(true);
  });
});

describe('enlarge-on-grids: families', () => {
  for (const p of PLAN) for (const f of p.families) {
    it(`${p.id} / ${f}: 300 seeds`, () => {
      const seen = new Set<string>();
      let pics = 0;
      for (let s = 1; s <= 300; s++) {
        const item = GEN[f]!(rng(s * 31 + 7), s, p.id) as GridItem;
        expect(item.family).toBe(f);
        expect(item.check(item.answer).ok, `${item.prompt} ${JSON.stringify(item.answer)}`).toBe(true);
        expect(item.solution.length).toBeGreaterThan(0);
        for (const t of [item.prompt, item.board, ...item.solution, ...(item.choices ?? [])]) expect(t).not.toMatch(/undefined|NaN|Infinity|null|\[object/);
        if (item.choices) {
          expect(new Set(item.choices).size, item.prompt).toBe(item.choices.length);
          expect(item.choices.filter((_, i) => item.check({ kind: 'choice', i }).ok).length, item.prompt).toBe(1);
          item.choices.forEach((_, i) => { const mc = item.check({ kind: 'choice', i }).mc; if (mc) expect(CATALOG.has(mc), mc).toBe(true); });
        }
        for (const pr of PROBES.get(item) ?? []) {
          const v = item.check(pr.r);
          expect(v.ok, `${item.prompt} probe ${JSON.stringify(pr.r)}`).toBe(false);
          expect(v.mc, `${item.prompt} probe ${JSON.stringify(pr.r)}`).toBe(pr.mc);
          expect(CATALOG.has(pr.mc), pr.mc).toBe(true);
        }
        if (item.pict) {
          pics++;
          expect(picMaths(item.pict.pic), item.prompt).toBeNull();
          expect(layoutPic(item.pict.pic, PF).why, item.prompt).toBeNull();
        }
        seen.add(item.prompt + '|' + item.board);
      }
      expect(seen.size, 'distinct items').toBeGreaterThan(12);
      expect(pics / 300, 'items that keep their picture').toBeGreaterThanOrEqual(PIC_MIN[f] ?? 0.9);
    });
  }
});

describe('enlarge-on-grids: walk maths', () => {
  it('a walk closes, scales move by move, and the copy it draws is a scaled copy', () => {
    for (const P of [rect(3, 2), ell(4, 3, 1, 2), house(2, 3, 1, 1), tri(3, 2, 3)]) {
      const M = walkOf(P);
      expect(closes(M)).toBe(true);
      for (const k of [2, 3, 0.5]) {
        const C = runWalk([0, 0], scaleMoves(M, k));
        expect(C[C.length - 1]).toEqual([0, 0]);
        expect(isWalkCopy(P, C.slice(0, -1), k)).toBe(true);
        expect(isWalkCopy(P, scale(P, k + 1), k)).toBe(false);
      }
    }
  });
  it('the across and up factors tell scaled from stretched', () => {
    expect(factors(rect(1, 3), rect(2, 6)).same).toBe(true);
    expect(factors(rect(1, 3), rect(2, 4)).same).toBe(false);
    expect(factors(rect(2, 2), rect(4, 4)).same).toBe(true);
    expect(factors(rect(4, 2), stretch(rect(4, 2), 1, 2)).same).toBe(false);
  });
  it('moves read as words and arrows', () => {
    expect(moveWords({ dx: -1, dy: 3 })).toBe('left 1, up 3');
    expect(moveWords({ dx: 0, dy: -6 })).toBe('down 6');
    expect(moveTex({ dx: 4, dy: 0 })).toBe('\\rightarrow 4');
  });
});

describe('enlarge-on-grids: lesson pictures', () => {
  it('the house, the sail and the squares are honest and readable', () => {
    for (const s of [HOUSE, SAIL]) {
      const w = walkPic(s);
      expect(picMaths(w.pic)).toBeNull();
      expect(layoutPic(w.pic, LESSON_FRAME).why).toBeNull();
      expect(isWalkCopy(w.P0, w.P1, s.k)).toBe(true);
    }
    expect(picMaths(SQUARES)).toBeNull();
    expect(layoutPic(SQUARES, LESSON_FRAME).why).toBeNull();
    // the house: the copy is 4 wide, its walls 6 tall (the answer of part 1); the "+2" house is not a x2 copy
    const w = walkPic(HOUSE);
    expect(w.moves1.map(m => [m.dx, m.dy])).toEqual([[4, 0], [0, 6], [-2, 2], [-2, -2], [0, -6]]);
    expect(factors(house(2, 3, 1, 1), house(4, 5, 2, 2)).same).toBe(false);
    // the sail x3: its slanted side goes left 3, up 9 and back left 6, down 9 (the answers of part 3)
    expect(walkPic(SAIL).moves1.map(m => [m.dx, m.dy])).toEqual([[9, 0], [-3, 9], [-6, -9]]);
  });
});

describe('enlarge-on-grids: voice', () => {
  it('every voiced line is in voice/lines.json with the same spoken text, no digits or symbols', () => {
    const lines = JSON.parse(fs.readFileSync('pages/lessons/enlarge-on-grids/voice/lines.json', 'utf8')) as Record<string, { text: string }>;
    expect(Object.keys(lines).sort()).toEqual(Object.keys(SCRIPT).sort());
    for (const [id, v] of Object.entries(SCRIPT)) {
      expect(lines[id]!.text, id).toBe(v.s);
      expect(v.s, id).not.toMatch(/[0-9×÷=+<>/%$]/);
    }
  });
});
